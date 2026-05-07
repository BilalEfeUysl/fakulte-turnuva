import type { Team } from "../types/team";
import type { GroupStandings, MatchRow, TopScorerRow } from "../types/tournament";
import { initialsFromName } from "../utils/initials";

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export type StoryData =
  | {
      type: "single_match_result";
      match: MatchRow;
      teamById: Map<number, Team>;
      stageLabel?: string;
    }
  | {
      type: "daily_results";
      dateLabel: string;
      matches: MatchRow[];
      teamById: Map<number, Team>;
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
    }
  | {
      type: "upcoming_matches";
      title: string;
      matches: MatchRow[];
      teamById: Map<number, Team>;
    };

const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif`;

const C = {
  bgGradient: "linear-gradient(160deg, #062c66 0%, #0a4ea8 45%, #1e6fd9 100%)",
  decorRing: "rgba(255,255,255,0.06)",
  card: "#ffffff",
  cardSoft: "rgba(255,255,255,0.06)",
  cardBorder: "rgba(255,255,255,0.16)",
  ink: "#0a2a55",
  inkSoft: "#4a5d7d",
  inkFaint: "#90a0bd",
  white: "#ffffff",
  whiteSoft: "rgba(255,255,255,0.92)",
  whiteFaint: "rgba(255,255,255,0.55)",
  accent: "#ffd166",
  divider: "rgba(10,42,85,0.08)",
};

function formatDateTr(dateStr: string | null, timeStr: string | null): string {
  if (!dateStr) return "Tarih belirsiz";
  const d = new Date(`${dateStr}T${timeStr ?? "00:00"}:00`);
  if (Number.isNaN(d.getTime())) return `${dateStr}${timeStr ? " " + timeStr : ""}`;
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function formatTimeShort(dateStr: string | null, timeStr: string | null): string {
  if (timeStr) return timeStr.slice(0, 5);
  if (!dateStr) return "—";
  return "";
}

function TeamCircle({ team, name, size = 180 }: { team: Team | undefined; name: string; size?: number }) {
  const label = team?.short_name?.trim() || initialsFromName(name);
  const bg = team?.color || "#1e6fd9";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.36,
        letterSpacing: "-0.02em",
        boxShadow: "0 14px 40px rgba(0,0,0,0.25), inset 0 -8px 20px rgba(0,0,0,0.18)",
        border: "6px solid #ffffff",
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

function Brand() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        color: C.whiteSoft,
        fontWeight: 800,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontSize: 24,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: "linear-gradient(135deg, #ffd166, #ffae3b)",
          color: "#0a2a55",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: "-0.04em",
        }}
      >
        FT
      </div>
      <span>Fakülteler Arası Turnuva</span>
    </div>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "12px 26px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.14)",
        border: "1px solid rgba(255,255,255,0.28)",
        color: C.white,
        fontWeight: 700,
        fontSize: 26,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function HeaderBlock({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <Brand />
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 22 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1
          style={{
            margin: 0,
            color: C.white,
            fontSize: 110,
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p style={{ margin: 0, fontSize: 38, color: C.whiteSoft, fontWeight: 600 }}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: C.whiteFaint,
        fontSize: 24,
        fontWeight: 600,
        letterSpacing: "0.04em",
      }}
    >
      <span>fakulte-turnuva · {new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}</span>
      <span style={{ color: C.accent, letterSpacing: "0.18em" }}>#FAKULTETURNUVA</span>
    </div>
  );
}

function SingleMatchView({ match, teamById, stageLabel }: { match: MatchRow; teamById: Map<number, Team>; stageLabel?: string }) {
  const home = teamById.get(match.home_team_id);
  const away = teamById.get(match.away_team_id);
  const finished = match.status === "finished";
  const dateText = formatDateTr(match.scheduled_date, match.scheduled_time);
  const timeText = formatTimeShort(match.scheduled_date, match.scheduled_time);
  const stage = stageLabel || (match.group_name === "Lig" ? "Lig" : `Grup ${match.group_name}`);

  return (
    <div
      style={{
        flex: 1,
        background: C.card,
        borderRadius: 48,
        padding: "80px 70px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 30px 70px rgba(0,0,0,0.22)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <span
          style={{
            padding: "10px 24px",
            borderRadius: 999,
            background: "rgba(10,78,168,0.1)",
            color: "#0a4ea8",
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontSize: 22,
          }}
        >
          {stage}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 24 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <TeamCircle team={home} name={match.home_team_name} size={220} />
          <div style={{ color: C.ink, fontSize: 36, fontWeight: 800, textAlign: "center", lineHeight: 1.1 }}>
            {match.home_team_name}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.ink,
            fontWeight: 900,
            fontSize: 180,
            letterSpacing: "-0.06em",
            lineHeight: 0.9,
            minWidth: 280,
          }}
        >
          {finished ? (
            <>
              <span>{match.home_score}</span>
              <span style={{ color: C.inkFaint, margin: "0 28px", fontWeight: 700 }}>–</span>
              <span>{match.away_score}</span>
            </>
          ) : (
            <span style={{ color: "#0a4ea8" }}>VS</span>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <TeamCircle team={away} name={match.away_team_name} size={220} />
          <div style={{ color: C.ink, fontSize: 36, fontWeight: 800, textAlign: "center", lineHeight: 1.1 }}>
            {match.away_team_name}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <span style={{ color: C.inkSoft, fontSize: 28, fontWeight: 600 }}>{dateText}</span>
        {timeText ? <span style={{ color: C.inkFaint, fontSize: 24, fontWeight: 600 }}>{timeText}</span> : null}
      </div>
    </div>
  );
}

function MatchRowItem({ match, teamById, mode }: { match: MatchRow; teamById: Map<number, Team>; mode: "result" | "upcoming" }) {
  const home = teamById.get(match.home_team_id);
  const away = teamById.get(match.away_team_id);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "20px 26px",
        background: "#f4f7fc",
        borderRadius: 22,
        border: `1px solid ${C.divider}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
        <span style={{ color: C.ink, fontSize: 30, fontWeight: 800, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {match.home_team_name}
        </span>
        <TeamCircle team={home} name={match.home_team_name} size={64} />
      </div>
      <div
        style={{
          minWidth: 170,
          textAlign: "center",
          fontWeight: 900,
          fontSize: mode === "result" ? 56 : 30,
          color: mode === "result" ? C.ink : "#0a4ea8",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {mode === "result" ? (
          <>
            {match.home_score}
            <span style={{ color: C.inkFaint, fontWeight: 700, margin: "0 14px" }}>–</span>
            {match.away_score}
          </>
        ) : (
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 36 }}>{formatTimeShort(match.scheduled_date, match.scheduled_time) || "—"}</span>
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
        <TeamCircle team={away} name={match.away_team_name} size={64} />
        <span style={{ color: C.ink, fontSize: 30, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {match.away_team_name}
        </span>
      </div>
    </div>
  );
}

function MatchListView({ matches, teamById, mode }: { matches: MatchRow[]; teamById: Map<number, Team>; mode: "result" | "upcoming" }) {
  const visible = matches.slice(0, 7);
  const overflow = matches.length - visible.length;
  return (
    <div
      style={{
        flex: 1,
        background: C.card,
        borderRadius: 48,
        padding: "60px 56px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        boxShadow: "0 30px 70px rgba(0,0,0,0.22)",
      }}
    >
      {visible.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.inkFaint, fontSize: 36, fontWeight: 700 }}>
          {mode === "result" ? "Bu güne ait sonuç bulunmuyor." : "Yaklaşan maç bulunmuyor."}
        </div>
      ) : (
        visible.map((m) => <MatchRowItem key={m.id} match={m} teamById={teamById} mode={mode} />)
      )}
      {overflow > 0 ? (
        <div style={{ marginTop: 12, color: C.inkFaint, fontSize: 26, fontWeight: 700, textAlign: "right" }}>+{overflow} maç daha</div>
      ) : null}
    </div>
  );
}

function StandingsCardView({ group, teamById }: { group: GroupStandings; teamById: Map<number, Team> }) {
  const rows = group.rows.slice(0, 8);
  const overflow = group.rows.length - rows.length;
  return (
    <div
      style={{
        flex: 1,
        background: C.card,
        borderRadius: 48,
        padding: "56px 50px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 30px 70px rgba(0,0,0,0.22)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "70px 1fr 70px 70px 70px 70px 90px",
          gap: 12,
          padding: "0 24px",
          color: C.inkFaint,
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        <span>#</span>
        <span>Takım</span>
        <span style={{ textAlign: "center" }}>O</span>
        <span style={{ textAlign: "center" }}>G</span>
        <span style={{ textAlign: "center" }}>B</span>
        <span style={{ textAlign: "center" }}>M</span>
        <span style={{ textAlign: "center" }}>P</span>
      </div>
      {rows.map((r, idx) => {
        const team = teamById.get(r.team_id);
        const isTop = idx === 0;
        return (
          <div
            key={r.team_id}
            style={{
              display: "grid",
              gridTemplateColumns: "70px 1fr 70px 70px 70px 70px 90px",
              gap: 12,
              alignItems: "center",
              padding: "18px 24px",
              borderRadius: 20,
              background: isTop ? "linear-gradient(95deg, #fff7e0, #fff3c8)" : "#f4f7fc",
              border: isTop ? "2px solid #ffd166" : `1px solid ${C.divider}`,
            }}
          >
            <span
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                background: isTop ? "#ffd166" : "#0a4ea8",
                color: isTop ? "#0a2a55" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 26,
              }}
            >
              {r.rank}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <TeamCircle team={team} name={r.team_name} size={56} />
              <span style={{ color: C.ink, fontSize: 30, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.team_name}
              </span>
            </span>
            <span style={{ textAlign: "center", color: C.inkSoft, fontSize: 28, fontWeight: 700 }}>{r.played}</span>
            <span style={{ textAlign: "center", color: C.inkSoft, fontSize: 28, fontWeight: 700 }}>{r.won}</span>
            <span style={{ textAlign: "center", color: C.inkSoft, fontSize: 28, fontWeight: 700 }}>{r.drawn}</span>
            <span style={{ textAlign: "center", color: C.inkSoft, fontSize: 28, fontWeight: 700 }}>{r.lost}</span>
            <span style={{ textAlign: "center", color: C.ink, fontSize: 32, fontWeight: 900 }}>{r.points}</span>
          </div>
        );
      })}
      {overflow > 0 ? (
        <div style={{ marginTop: 10, color: C.inkFaint, fontSize: 26, fontWeight: 700, textAlign: "right" }}>+{overflow} takım daha</div>
      ) : null}
    </div>
  );
}

function TopScorersCardView({ scorers, teamById }: { scorers: TopScorerRow[]; teamById: Map<number, Team> }) {
  const rows = scorers.slice(0, 8);
  const overflow = scorers.length - rows.length;
  const medalColor = (rank: number): string => (rank === 1 ? "#ffd166" : rank === 2 ? "#cfd6e2" : rank === 3 ? "#e0a266" : "#0a4ea8");
  return (
    <div
      style={{
        flex: 1,
        background: C.card,
        borderRadius: 48,
        padding: "56px 50px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 30px 70px rgba(0,0,0,0.22)",
      }}
    >
      {rows.map((s) => {
        const team = teamById.get(s.team_id);
        const podium = s.rank <= 3;
        return (
          <div
            key={`${s.player_name}-${s.team_id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "22px 26px",
              borderRadius: 22,
              background: podium ? "linear-gradient(95deg, #fff7e0, #ffffff)" : "#f4f7fc",
              border: podium ? "2px solid #ffd166" : `1px solid ${C.divider}`,
            }}
          >
            <span
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: medalColor(s.rank),
                color: s.rank <= 3 ? "#0a2a55" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 30,
              }}
            >
              {s.rank}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.ink, fontSize: 34, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.player_name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                <TeamCircle team={team} name={s.team_name} size={42} />
                <span style={{ color: C.inkSoft, fontSize: 24, fontWeight: 700 }}>{s.team_name}</span>
              </div>
            </div>
            <div style={{ textAlign: "right", lineHeight: 1 }}>
              <div style={{ color: C.ink, fontSize: 60, fontWeight: 900, letterSpacing: "-0.03em" }}>{s.goals}</div>
              <div style={{ color: C.inkFaint, fontSize: 22, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>gol</div>
            </div>
          </div>
        );
      })}
      {overflow > 0 ? (
        <div style={{ marginTop: 10, color: C.inkFaint, fontSize: 26, fontWeight: 700, textAlign: "right" }}>+{overflow} oyuncu daha</div>
      ) : null}
    </div>
  );
}

function decorations() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          right: -300,
          top: -360,
          background: "radial-gradient(circle, rgba(255,209,102,0.18) 0%, rgba(255,209,102,0) 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          left: -260,
          bottom: -260,
          background: "radial-gradient(circle, rgba(58,142,246,0.32) 0%, rgba(58,142,246,0) 65%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

export function StoryExportTemplate({ data }: { data: StoryData }) {
  let eyebrow = "";
  let title = "";
  let subtitle: string | undefined;
  let body: React.ReactNode = null;

  switch (data.type) {
    case "single_match_result": {
      eyebrow = "Maç Sonucu";
      title = data.match.status === "finished" ? "Tamamlandı" : "Karşılaşma";
      subtitle = data.match.group_name === "Lig" ? "Lig Maçı" : `Grup ${data.match.group_name}`;
      body = <SingleMatchView match={data.match} teamById={data.teamById} stageLabel={data.stageLabel} />;
      break;
    }
    case "daily_results": {
      eyebrow = "Günün Sonuçları";
      title = "Skor Tablosu";
      subtitle = data.dateLabel;
      body = <MatchListView matches={data.matches} teamById={data.teamById} mode="result" />;
      break;
    }
    case "standings": {
      eyebrow = "Puan Durumu";
      title = "Sıralama";
      subtitle = data.groupLabel || (data.group.group_name === "Genel" ? "Tüm Takımlar" : data.group.group_name === "Lig" ? "Lig" : `Grup ${data.group.group_name}`);
      body = <StandingsCardView group={data.group} teamById={data.teamById} />;
      break;
    }
    case "top_scorers": {
      eyebrow = "Gol Krallığı";
      title = "En Skorerler";
      subtitle = "Turnuva geneli";
      body = <TopScorersCardView scorers={data.scorers} teamById={data.teamById} />;
      break;
    }
    case "upcoming_matches": {
      eyebrow = "Yaklaşan Maçlar";
      title = "Program";
      subtitle = data.title;
      body = <MatchListView matches={data.matches} teamById={data.teamById} mode="upcoming" />;
      break;
    }
  }

  return (
    <div
      style={{
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        background: C.bgGradient,
        fontFamily: FONT,
        position: "relative",
        overflow: "hidden",
        color: C.white,
        padding: "100px 70px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 50,
      }}
    >
      {decorations()}
      <div style={{ position: "relative", zIndex: 1 }}>
        <HeaderBlock eyebrow={eyebrow} title={title} subtitle={subtitle} />
      </div>
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>{body}</div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <Footer />
      </div>
    </div>
  );
}
