import type { Team } from "../types/team";
import type { GroupStandings, MatchRow, TopScorerRow } from "../types/tournament";
import { initialsFromName } from "../utils/initials";

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const FONT = `"Plus Jakarta Sans", "Segoe UI", "Helvetica Neue", system-ui, sans-serif`;
const MONO = `"SF Mono", "Fira Code", "Courier New", monospace`;

export type StoryData =
  | {
      type: "single_match_result";
      match: MatchRow;
      teamById: Map<number, Team>;
      stageLabel?: string;
    }
  | {
      type: "standings";
      group: GroupStandings;
      teamById: Map<number, Team>;
      groupLabel?: string;
    }
  | {
      type: "top_scorers";
      scorers: TopScorerRow[];
      teamById: Map<number, Team>;
    };

function teamHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function teamColor(team: Team | undefined, name: string): string {
  if (team?.color) return team.color;
  const hue = teamHue(name);
  return `hsl(${hue}, 60%, 45%)`;
}

function teamLabel(team: Team | undefined, name: string): string {
  return team?.short_name?.trim() || initialsFromName(name);
}

function formatDateTr(dateStr: string | null, timeStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T${timeStr ?? "00:00"}:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function todayTr(): string {
  return new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function TeamCircle({ team, name, size = 180 }: { team: Team | undefined; name: string; size?: number }) {
  const color = teamColor(team, name);
  const label = teamLabel(team, name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: size * 0.38,
        letterSpacing: "-0.02em",
        boxShadow: "0 14px 40px rgba(0,0,0,0.4), inset 0 -6px 16px rgba(0,0,0,0.25)",
        border: "8px solid rgba(255,255,255,0.22)",
        flexShrink: 0,
        fontFamily: FONT,
      }}
    >
      {label}
    </div>
  );
}

function SmallCircle({ team, name, size = 40 }: { team: Team | undefined; name: string; size?: number }) {
  const color = teamColor(team, name);
  const label = teamLabel(team, name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: size * 0.38,
        flexShrink: 0,
        fontFamily: FONT,
      }}
    >
      {label}
    </div>
  );
}

function BgLayer({ overlay, bgSrc }: { overlay: string; bgSrc: string }) {
  return (
    <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 0 }}>
      <img
        src={bgSrc}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        alt=""
      />
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, background: overlay }} />
    </div>
  );
}

// ===== VARYANT 1: MAÇ SONUCU =====
function MatchResultStory({
  match,
  teamById,
  stageLabel,
  bgSrc,
}: {
  match: MatchRow;
  teamById: Map<number, Team>;
  stageLabel?: string;
  bgSrc: string;
}) {
  const home = teamById.get(match.home_team_id);
  const away = teamById.get(match.away_team_id);
  const finished = match.status === "finished";
  const stage =
    stageLabel ||
    (match.group_name === "Lig"
      ? "Lig Maçı"
      : match.group_name === "Genel"
        ? "Turnuva"
        : `Grup ${match.group_name}`);
  const dateText = formatDateTr(match.scheduled_date, match.scheduled_time);

  return (
    <div style={{ position: "relative", overflow: "hidden", fontFamily: FONT, width: STORY_WIDTH, height: STORY_HEIGHT }}>
      <BgLayer overlay="rgba(0,0,0,0.52)" bgSrc={bgSrc} />

      {/* Season & title header */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 0,
          width: "100%",
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ height: 2, width: 48, background: "rgba(255,255,255,0.38)" }} />
          <span
            style={{
              color: "rgba(255,255,255,0.58)",
              fontWeight: 700,
              letterSpacing: "0.4em",
              fontSize: 20,
              textTransform: "uppercase",
            }}
          >
            2025-2026
          </span>
          <div style={{ height: 2, width: 48, background: "rgba(255,255,255,0.38)" }} />
        </div>
        <div
          style={{
            color: "#ffffff",
            fontWeight: 900,
            fontSize: 60,
            letterSpacing: "-0.05em",
            textTransform: "uppercase",
            fontStyle: "italic",
            lineHeight: 1,
          }}
        >
          Fakülte <span style={{ color: "#60a5fa" }}>Turnuvası</span>
        </div>
        <div
          style={{
            marginTop: 14,
            color: "rgba(255,255,255,0.5)",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {stage}
        </div>
      </div>

      {/* Center card */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          padding: "80px 40px 0",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.58)",
            padding: 64,
            borderRadius: 60,
            border: "1px solid rgba(255,255,255,0.15)",
            width: "100%",
            boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
          }}
        >
          {/* "Maç Sonucu" pill */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div
              style={{
                display: "inline-block",
                background: "#ffffff",
                color: "#172554",
                padding: "16px 48px",
                borderRadius: 999,
                fontWeight: 900,
                fontSize: 30,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              }}
            >
              {finished ? "Maç Sonucu" : "Karşılaşma"}
            </div>
          </div>

          {/* Teams + Score */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            {/* Home */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <TeamCircle team={home} name={match.home_team_name} size={220} />
              <div
                style={{
                  color: "#ffffff",
                  fontSize: 36,
                  fontWeight: 900,
                  textAlign: "center",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                }}
              >
                {match.home_team_name}
              </div>
            </div>

            {/* Score */}
            {finished ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: 190,
                    fontWeight: 900,
                    lineHeight: 1,
                    fontFamily: MONO,
                    filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.6))",
                    letterSpacing: "-0.06em",
                  }}
                >
                  {match.home_score}
                </div>
                <div style={{ width: 28, height: 10, background: "#60a5fa", borderRadius: 999 }} />
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: 190,
                    fontWeight: 900,
                    lineHeight: 1,
                    fontFamily: MONO,
                    filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.6))",
                    letterSpacing: "-0.06em",
                  }}
                >
                  {match.away_score}
                </div>
              </div>
            ) : (
              <div
                style={{
                  color: "#60a5fa",
                  fontSize: 90,
                  fontWeight: 900,
                  lineHeight: 1,
                  fontFamily: MONO,
                  letterSpacing: "-0.04em",
                  flexShrink: 0,
                }}
              >
                VS
              </div>
            )}

            {/* Away */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <TeamCircle team={away} name={match.away_team_name} size={220} />
              <div
                style={{
                  color: "#ffffff",
                  fontSize: 36,
                  fontWeight: 900,
                  textAlign: "center",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                }}
              >
                {match.away_team_name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date */}
      {dateText && (
        <div style={{ position: "absolute", bottom: 96, left: 0, width: "100%", textAlign: "center", zIndex: 10 }}>
          <div
            style={{
              display: "inline-block",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "16px 48px",
              background: "rgba(255,255,255,0.18)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {dateText}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== VARYANT 2: PUAN TABLOSU =====
function StandingsStory({
  group,
  teamById,
  groupLabel,
  bgSrc,
}: {
  group: GroupStandings;
  teamById: Map<number, Team>;
  groupLabel?: string;
  bgSrc: string;
}) {
  const rows = group.rows.slice(0, 10);
  const title =
    groupLabel ||
    (group.group_name === "Genel"
      ? "Tüm Takımlar"
      : group.group_name === "Lig"
        ? "Lig"
        : `Grup ${group.group_name}`);

  return (
    <div style={{ position: "relative", overflow: "hidden", fontFamily: FONT, width: STORY_WIDTH, height: STORY_HEIGHT }}>
      <BgLayer overlay="rgba(23,37,84,0.68)" bgSrc={bgSrc} />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 192,
          left: 64,
          right: 64,
          zIndex: 10,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: 90,
            fontWeight: 900,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-0.03em",
          }}
        >
          PUAN TABLOSU
        </div>
        <div
          style={{
            marginTop: 14,
            color: "#93c5fd",
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          {title} · {todayTr()}
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          position: "absolute",
          top: 480,
          left: 40,
          right: 40,
          bottom: 96,
          zIndex: 10,
          background: "rgba(0,0,0,0.60)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 50,
          padding: 40,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
        }}
      >
        {/* Column headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "70px 1fr 90px 90px 90px 110px",
            alignItems: "center",
            padding: "0 28px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.38)",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          <div>SIRA</div>
          <div>TAKIM</div>
          <div style={{ textAlign: "center" }}>OM</div>
          <div style={{ textAlign: "center" }}>G</div>
          <div style={{ textAlign: "center" }}>M</div>
          <div style={{ textAlign: "right" }}>PUAN</div>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14, flex: 1, overflow: "hidden" }}>
          {rows.map((r, i) => {
            const isLeader = i === 0;
            const team = teamById.get(r.team_id);
            return (
              <div
                key={r.team_id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr 90px 90px 90px 110px",
                  alignItems: "center",
                  padding: "18px 28px",
                  borderRadius: 16,
                  background: isLeader ? "#ffffff" : "transparent",
                  color: isLeader ? "#172554" : "#ffffff",
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 28, fontFamily: MONO }}>{r.rank}.</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, overflow: "hidden" }}>
                  <SmallCircle team={team} name={r.team_name} size={42} />
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 25,
                      letterSpacing: "-0.01em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.team_name}
                  </span>
                </div>
                <div style={{ textAlign: "center", fontWeight: 700, fontSize: 25, opacity: 0.65, fontFamily: MONO }}>
                  {r.played}
                </div>
                <div style={{ textAlign: "center", fontWeight: 700, fontSize: 25, opacity: 0.65, fontFamily: MONO }}>
                  {r.won}
                </div>
                <div style={{ textAlign: "center", fontWeight: 700, fontSize: 25, opacity: 0.65, fontFamily: MONO }}>
                  {r.lost}
                </div>
                <div style={{ textAlign: "right", fontWeight: 900, fontSize: 36, fontFamily: MONO }}>{r.points}</div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "center",
            gap: 32,
            color: "rgba(255,255,255,0.32)",
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span>OM: Oynanan Maç</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>G: Galibiyet</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>M: Mağlubiyet</span>
        </div>
      </div>
    </div>
  );
}

// ===== VARYANT 3: GOL KRALLIGI =====
function TopScorersStory({ scorers, teamById, bgSrc }: { scorers: TopScorerRow[]; teamById: Map<number, Team>; bgSrc: string }) {
  const rows = scorers.slice(0, 10);

  return (
    <div style={{ position: "relative", overflow: "hidden", fontFamily: FONT, width: STORY_WIDTH, height: STORY_HEIGHT }}>
      <BgLayer overlay="rgba(10,22,60,0.72)" bgSrc={bgSrc} />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 192,
          left: 64,
          right: 64,
          zIndex: 10,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: 90,
            fontWeight: 900,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-0.03em",
          }}
        >
          GOL KRALLIGI
        </div>
        <div
          style={{
            marginTop: 14,
            color: "#93c5fd",
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          Turnuva Geneli · {todayTr()}
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          position: "absolute",
          top: 480,
          left: 40,
          right: 40,
          bottom: 96,
          zIndex: 10,
          background: "rgba(0,0,0,0.60)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 50,
          padding: 40,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
        }}
      >
        {/* Column headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "70px 1fr 110px",
            alignItems: "center",
            padding: "0 28px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.38)",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          <div>#</div>
          <div>OYUNCU</div>
          <div style={{ textAlign: "right" }}>GOL</div>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14, flex: 1, overflow: "hidden" }}>
          {rows.map((s, i) => {
            const isLeader = i === 0;
            const team = teamById.get(s.team_id);
            return (
              <div
                key={`${s.player_name}-${s.team_id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr 110px",
                  alignItems: "center",
                  padding: "16px 28px",
                  borderRadius: 16,
                  background: isLeader ? "#ffffff" : "transparent",
                  color: isLeader ? "#172554" : "#ffffff",
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 28, fontFamily: MONO }}>{s.rank}.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, overflow: "hidden" }}>
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: 28,
                      letterSpacing: "-0.01em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.player_name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <SmallCircle team={team} name={s.team_name} size={28} />
                    <span style={{ fontSize: 20, fontWeight: 600, opacity: 0.65 }}>{s.team_name}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900, fontSize: 46, fontFamily: MONO, lineHeight: 1 }}>{s.goals}</div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      opacity: 0.5,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}
                  >
                    gol
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Brand */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "center",
            color: "rgba(255,255,255,0.3)",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
          }}
        >
          #FAKULTETURNUVA
        </div>
      </div>
    </div>
  );
}

export function StoryExportTemplate({ data, bgImageDataUrl }: { data: StoryData; bgImageDataUrl?: string }) {
  const bgSrc = bgImageDataUrl ?? "/assets/background_image.png";
  switch (data.type) {
    case "single_match_result":
      return <MatchResultStory match={data.match} teamById={data.teamById} stageLabel={data.stageLabel} bgSrc={bgSrc} />;
    case "standings":
      return <StandingsStory group={data.group} teamById={data.teamById} groupLabel={data.groupLabel} bgSrc={bgSrc} />;
    case "top_scorers":
      return <TopScorersStory scorers={data.scorers} teamById={data.teamById} bgSrc={bgSrc} />;
  }
}
