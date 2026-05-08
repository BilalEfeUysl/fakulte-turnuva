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

let bgDataUrlCache: string | null = null;

async function loadBgDataUrl(): Promise<string> {
  if (bgDataUrlCache) return bgDataUrlCache;
  const response = await fetch("/assets/background_image.png");
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      bgDataUrlCache = reader.result as string;
      resolve(bgDataUrlCache);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
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

  const wrapper = document.createElement("div");
  wrapper.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:0",
    "height:0",
    "overflow:hidden",
    "z-index:99999",
    "pointer-events:none",
  ].join(";");

  const host = document.createElement("div");
  host.style.cssText = [
    `width:${STORY_WIDTH}px`,
    `height:${STORY_HEIGHT}px`,
    "overflow:hidden",
  ].join(";");

  wrapper.appendChild(host);
  document.body.appendChild(wrapper);

  const root = createRoot(host);
  try {
    root.render(createElement(StoryExportTemplate, { data, bgImageDataUrl }));

    await document.fonts.ready;
    await new Promise<void>((resolve) => setTimeout(resolve, 800));

    const toPngOptions = {
      width: STORY_WIDTH,
      height: STORY_HEIGHT,
      pixelRatio: 1,
      cacheBust: false,
    };

    // First call warms up the WebKit/WebView2 renderer (fixes shadows-only bug)
    await toPng(host, toPngOptions);
    const dataUrl = await toPng(host, toPngOptions);

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
    wrapper.remove();
  }
}
