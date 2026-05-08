import { createElement } from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
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
// Data URLs are opaque to html2canvas's security model — no taint, no fetch.
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
    // No crossOrigin attribute — same-origin images draw to canvas without taint
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

async function nextPaint(): Promise<void> {
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

export type StoryExportResult = { saved: boolean; path?: string };

export async function exportStoryImage(data: StoryData): Promise<StoryExportResult> {
  const bgImageDataUrl = await loadBgDataUrl();

  const host = document.createElement("div");
  host.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    `width:${STORY_WIDTH}px`,
    `height:${STORY_HEIGHT}px`,
    "opacity:0.01",
    "pointer-events:none",
    "z-index:99999",
    "overflow:hidden",
  ].join(";");
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    root.render(createElement(StoryExportTemplate, { data, bgImageDataUrl }));
    await nextPaint();
    await nextPaint();

    const canvas = await html2canvas(host, {
      width: STORY_WIDTH,
      height: STORY_HEIGHT,
      scale: 1,
      useCORS: false,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      imageTimeout: 15000,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
    });

    const dataUrl = canvas.toDataURL("image/png");

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
