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
    case "daily_results":
      return `gunun-sonuclari-${safeFileSegment(data.dateLabel)}-${stamp}.png`;
    case "standings":
      return `puan-durumu-${safeFileSegment(data.group.group_name)}-${stamp}.png`;
    case "top_scorers":
      return `gol-kralligi-${stamp}.png`;
    case "upcoming_matches":
      return `program-${safeFileSegment(data.title)}-${stamp}.png`;
  }
}

async function nextPaint(): Promise<void> {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}

export type StoryExportResult = { saved: boolean; path?: string };

export async function exportStoryImage(data: StoryData): Promise<StoryExportResult> {
  const host = document.createElement("div");
  host.setAttribute("data-story-export", "true");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.width = `${STORY_WIDTH}px`;
  host.style.height = `${STORY_HEIGHT}px`;
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    root.render(createElement(StoryExportTemplate, { data }));
    await nextPaint();

    const dataUrl = await toPng(host, {
      width: STORY_WIDTH,
      height: STORY_HEIGHT,
      pixelRatio: 1,
      cacheBust: true,
      backgroundColor: "#062c66",
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
