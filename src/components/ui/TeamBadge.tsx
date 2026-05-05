import { initialsFromName } from "../../utils/initials";

type Props = {
  color?: string;
  shortName?: string;
  name: string;
  size?: "sm" | "md";
};

export function TeamBadge({ color, shortName, name, size = "md" }: Props) {
  const label = shortName?.trim() || initialsFromName(name);
  return (
    <span
      className={`team-badge team-badge--${size}`}
      style={{
        background: color || "var(--arena-surface2)",
        color: color ? "#fff" : "inherit",
      }}
    >
      {label}
    </span>
  );
}
