import { useState } from "react";
import { exportStoryImage } from "../../utils/storyExport";
import type { StoryData } from "../StoryExportTemplate";

type Props = {
  buildData: () => StoryData | null;
  label?: string;
  size?: "sm" | "md";
  variant?: "solid" | "ghost";
  disabled?: boolean;
  title?: string;
  onSaved?: (path?: string) => void;
  onError?: (msg: string) => void;
};

function StoryIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17.4" cy="6.6" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function StoryExportButton({
  buildData,
  label = "Hikaye Görseli",
  size = "md",
  variant = "solid",
  disabled = false,
  title,
  onSaved,
  onError,
}: Props) {
  const [busy, setBusy] = useState(false);

  const cls = [
    "story-export-btn",
    `story-export-btn--${size}`,
    `story-export-btn--${variant}`,
    busy ? "is-busy" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={cls}
      disabled={disabled || busy}
      title={title}
      onClick={async () => {
        const data = buildData();
        if (!data) return;
        setBusy(true);
        try {
          const result = await exportStoryImage(data);
          if (result.saved) onSaved?.(result.path);
        } catch (e) {
          onError?.(String(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <StoryIcon size={size === "sm" ? 14 : 16} />
      <span>{busy ? "Oluşturuluyor…" : label}</span>
    </button>
  );
}
