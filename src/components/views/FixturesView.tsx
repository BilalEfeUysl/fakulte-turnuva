import { useMemo } from "react";
import type { MatchRow } from "../../types/tournament";
import type { Team } from "../../types/team";
import type { TournamentAppState } from "../../hooks/useTournamentApp";
import { TeamBadge } from "../ui/TeamBadge";
import { StoryExportButton } from "../ui/StoryExportButton";

type Props = { app: TournamentAppState };

const KNOCKOUT_ORDER = ["Playoff", "Yarı Final", "Final"];

const FINAL_ICONS: Record<string, string> = {
  Playoff: "⚔️",
  "Yarı Final": "🏆",
  Final: "👑",
};

function knockoutLabel(stage: string): string {
  if (stage === "semi") return "Yarı Final";
  if (stage === "final") return "Final";
  return stage;
}

function formatDate(date: string | null, time: string | null): string {
  if (!date) return "Tarih belirsiz";
  const d = new Date(`${date}T${time ?? "00:00"}:00`);
  if (Number.isNaN(d.getTime())) return `${date}${time ? ` ${time}` : ""}`;
  return d.toLocaleString("tr-TR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type CardProps = {
  m: MatchRow;
  onOpen: (id: number) => void;
  variant?: "group" | "knockout" | "final";
  teamById: Map<number, Team>;
};

function MatchCard({ m, onOpen, variant = "group", teamById }: CardProps) {
  const finished = m.status === "finished";
  const home = teamById.get(m.home_team_id);
  const away = teamById.get(m.away_team_id);
  return (
    <button
      type="button"
      className={`match-card match-card--${variant}${finished ? " match-card--finished" : ""}`}
      onClick={() => onOpen(m.id)}
    >
      <div className="match-card__datetime">{formatDate(m.scheduled_date, m.scheduled_time)}</div>
      <div className="match-card__teams">
        <span className="match-card__team match-card__team--home">
          <span className="match-card__team-name">{m.home_team_name}</span>
          <TeamBadge size="sm" color={home?.color} shortName={home?.short_name} name={m.home_team_name} />
        </span>
        <span className={`match-card__vs${finished ? " match-card__vs--score" : ""}`}>
          {finished ? `${m.home_score} – ${m.away_score}` : "VS"}
        </span>
        <span className="match-card__team match-card__team--away">
          <span className="match-card__team-name">{m.away_team_name}</span>
          <TeamBadge size="sm" color={away?.color} shortName={away?.short_name} name={m.away_team_name} />
        </span>
      </div>
      <div className="match-card__action">
        {finished ? "✏️ Skoru Güncelle" : "⚽ Skor Gir"}
      </div>
    </button>
  );
}

export function FixturesView({ app }: Props) {
  const { matches, openMatch } = app;

  const teamById = useMemo(
    () => new Map(app.teams.map((t) => [t.id, t])),
    [app.teams]
  );

  const { dayBuckets, knockoutBuckets, isLeague } = useMemo(() => {
    const sorted = [...matches].sort((a, b) => {
      const ad = a.scheduled_date ?? "9999-12-31";
      const bd = b.scheduled_date ?? "9999-12-31";
      const at = a.scheduled_time ?? "23:59";
      const bt = b.scheduled_time ?? "23:59";
      return ad.localeCompare(bd) || at.localeCompare(bt) || a.id - b.id;
    });

    const days = new Map<string, { label: string; sortKey: number; matches: MatchRow[] }>();
    const knockouts = new Map<string, MatchRow[]>();
    let hasLeague = false;

    for (const m of sorted) {
      if (m.stage === "group" || m.stage === "league") {
        if (m.stage === "league") hasLeague = true;
        const n = m.matchday_no > 0 ? m.matchday_no : 0;
        const key = `day-${n}`;
        const dayLabels: Record<number, string> = { 1: "1 Haziran 2026", 2: "3 Haziran 2026", 3: "5 Haziran 2026" };
        const label = n > 0 ? (dayLabels[n] ?? `Gün ${n}`) : "Planlanmamış";
        if (!days.has(key)) days.set(key, { label, sortKey: n, matches: [] });
        days.get(key)!.matches.push(m);
      } else if (/^Gün \d+/.test(m.stage)) {
        const key = `stage-${m.stage}`;
        const n = parseInt(m.stage.replace("Gün ", ""), 10) || 0;
        const dayLabels2: Record<number, string> = { 1: "1 Haziran 2026", 2: "3 Haziran 2026", 3: "5 Haziran 2026" };
        if (!days.has(key)) days.set(key, { label: dayLabels2[n] ?? m.stage, sortKey: n, matches: [] });
        days.get(key)!.matches.push(m);
      } else {
        const label = knockoutLabel(m.stage);
        if (!knockouts.has(label)) knockouts.set(label, []);
        knockouts.get(label)!.push(m);
      }
    }

    const dayBuckets = [...days.values()].sort((a, b) => a.sortKey - b.sortKey);

    const knockoutBuckets = [...knockouts.entries()]
      .sort((a, b) => {
        const ai = KNOCKOUT_ORDER.indexOf(a[0]);
        const bi = KNOCKOUT_ORDER.indexOf(b[0]);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
      .map(([stage, ms]) => ({ stage, matches: ms }));

    return { dayBuckets, knockoutBuckets, isLeague: hasLeague };
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div className="empty-state">
        <strong>Fikstür boş</strong>
      </div>
    );
  }

  return (
    <div className="fixture-page">
      <div className="fixture-toolbar">
        <h2 className="fixture-title">Fikstür</h2>
      </div>

      {dayBuckets.length > 0 && (
        <section className="fixture-section">
          <h3 className="fixture-section__heading">{isLeague ? "Lig Maçları" : "Grup Maçları"}</h3>
          <div className="fixture-days-grid">
            {dayBuckets.map(({ label, matches: dayMatches }) => {
              const finishedMatches = dayMatches.filter((m) => m.status === "finished");
              const upcomingMatches = dayMatches.filter((m) => m.status !== "finished");
              const showResults = finishedMatches.length > 0;
              return (
                <div key={label} className="fixture-day-col">
                  <div className="fixture-day-col__head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    <div className="fixture-day-col__title">{label}</div>
                    <StoryExportButton
                      size="sm"
                      label={showResults ? "Sonuçlar" : "Program"}
                      title={showResults ? "Bu günün sonuçlarını hikaye görseli olarak kaydet" : "Bu günün programını hikaye görseli olarak kaydet"}
                      buildData={() =>
                        showResults
                          ? { type: "daily_results", dateLabel: label, matches: finishedMatches, teamById }
                          : { type: "upcoming_matches", title: label, matches: upcomingMatches, teamById }
                      }
                    />
                  </div>
                  <div className="fixture-day-col__body">
                    {dayMatches.map((m) => (
                      <MatchCard key={m.id} m={m} onOpen={openMatch} variant="group" teamById={teamById} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {knockoutBuckets.length > 0 && (
        <section className="fixture-section">
          <h3 className="fixture-section__heading">Finaller</h3>
          <div className="fixture-finals-grid">
            {knockoutBuckets.map(({ stage, matches: stageMatches }) => {
              const isFinal = stage === "Final";
              const stageFinished = stageMatches.filter((m) => m.status === "finished");
              const stageUpcoming = stageMatches.filter((m) => m.status !== "finished");
              const stageShowResults = stageFinished.length > 0;
              return (
                <div
                  key={stage}
                  className={`fixture-final-block${isFinal ? " fixture-final-block--final" : ""}`}
                >
                  <div className="fixture-final-block__head" style={{ gap: "0.5rem" }}>
                    <span className="fixture-final-block__icon">{FINAL_ICONS[stage] ?? "🏅"}</span>
                    <span className="fixture-final-block__title">{stage}</span>
                    <span className="fixture-final-block__count">{stageMatches.length} maç</span>
                    <StoryExportButton
                      size="sm"
                      label={stageShowResults ? "Sonuçlar" : "Program"}
                      title="Bu aşamayı hikaye görseli olarak kaydet"
                      buildData={() =>
                        stageShowResults
                          ? { type: "daily_results", dateLabel: stage, matches: stageFinished, teamById }
                          : { type: "upcoming_matches", title: stage, matches: stageUpcoming, teamById }
                      }
                    />
                  </div>
                  <div className="fixture-final-block__body">
                    {stageMatches.map((m) => (
                      <MatchCard
                        key={m.id}
                        m={m}
                        onOpen={openMatch}
                        variant={isFinal ? "final" : "knockout"}
                        teamById={teamById}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
