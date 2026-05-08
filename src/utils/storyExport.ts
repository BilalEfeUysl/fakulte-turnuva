import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import {
  STORY_HEIGHT,
  STORY_WIDTH,
  StoryExportTemplate,
  type StoryData,
} from "../components/StoryExportTemplate";

// Load the background image via the browser's Image API (same-origin, no CORS
// headers required) and draw it to an offscreen canvas to get a data URL.
// Data URLs are opaque to html-to-image's security model — no taint, no fetch.
let bgDataUrlCache: string | null = null;

function loadBgDataUrl(): Promise<string> {
  if (bgDataUrlCache) return Promise.resolve(bgDataUrlCache);
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        if (!ctx) { resolve("/assets/background_image.png"); return; }
        ctx.drawImage(img, 0, 0);
        bgDataUrlCache = c.toDataURL("image/jpeg", 0.90);
        resolve(bgDataUrlCache);
      } catch {
        resolve("/assets/background_image.png");
      }
    };
    img.onerror = () => resolve("/assets/background_image.png");
    img.src = "/assets/background_image.png";
  });
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const idx = dataUrl.indexOf(",");
  const base64 = idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function safeFileSegment(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function defaultFileName(data: StoryData): string {
  const stamp = new Date().toISOString().slice(0, 10);
  switch (data.type) {
    case "single_match_result":
      return `mac-sonucu-${safeFileSegment(data.match.home_team_name)}-vs-${safeFileSegment(data.match.away_team_name)}-${stamp}.png`;
    case "standings":
      return `puan-durumu-${safeFileSegment(data.group.group_name)}-${stamp}.png`;
    case "top_scorers":
      return `gol-kralligi-${stamp}.png`;
  }
}

export type StoryExportResult = { saved: boolean; path?: string };

export async function exportStoryImage(data: StoryData): Promise<StoryExportResult> {
  const bgImageDataUrl = await loadBgDataUrl();

  const host = document.createElement("div");
  host.style.cssText = [
    "position:fixed",
    "top:-9999px",
    "left:-9999px",
    `width:${STORY_WIDTH}px`,
    `height:${STORY_HEIGHT}px`,
    "pointer-events:none",
    "z-index:99999",
    "overflow:hidden",
  ].join(";");
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    root.render(createElement(StoryExportTemplate, { data, bgImageDataUrl }));

    await document.fonts.ready;
    await new Promise<void>((resolve) => setTimeout(resolve, 800));

    const dataUrl = await toPng(host, {
      width: STORY_WIDTH,
      height: STORY_HEIGHT,
      pixelRatio: 1,
      cacheBust: false,
    });

    const filePath = await save({
      defaultPath: defaultFileName(data),
      filters: [{ name: "PNG Görseli", extensions: ["png"] }],
      title: "Hikaye Görselini Kaydet",
    });
    if (!filePath) return { saved: false };

    const bytes = dataUrlToBytes(dataUrl);
    await writeFile(filePath, bytes);
    return { saved: true, path: filePath };
  } finally {
    root.unmount();
    host.remove();
  }
}
