import { useMemo } from "react";
import type { MatchRow } from "../../types/tournament";
import type { Team } from "../../types/team";
import type { TournamentAppState } from "../../hooks/useTournamentApp";
import { TeamBadge } from "../ui/TeamBadge";

type Props = { app: TournamentAppState };

const GROUP_STAGES = ["Gün 1", "Gün 2", "Gün 3"] as const;
const FINAL_STAGES = ["Playoff", "Yarı Final", "Final"] as const;

const FINAL_ICONS: Record<string, string> = {
  Playoff: "⚔️",
  "Yarı Final": "🏆",
  Final: "👑",
};

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

  const byStage = useMemo(() => {
    const map = new Map<string, MatchRow[]>();
    for (const m of [...matches].sort((a, b) => {
      const ad = a.scheduled_date ?? "9999-12-31";
      const bd = b.scheduled_date ?? "9999-12-31";
      const at = a.scheduled_time ?? "23:59";
      const bt = b.scheduled_time ?? "23:59";
      return ad.localeCompare(bd) || at.localeCompare(bt) || a.id - b.id;
    })) {
      if (!map.has(m.stage)) map.set(m.stage, []);
      map.get(m.stage)!.push(m);
    }
    return map;
  }, [matches]);

  const groupDays = GROUP_STAGES.map((s) => ({ stage: s, matches: byStage.get(s) ?? [] }));
  const finalBlocks = FINAL_STAGES.map((s) => ({ stage: s, matches: byStage.get(s) ?? [] })).filter((b) => b.matches.length > 0);
  const hasGroupMatches = groupDays.some((d) => d.matches.length > 0);

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

      {hasGroupMatches && (
        <section className="fixture-section">
          <h3 className="fixture-section__heading">Grup Maçları</h3>
          <div className="fixture-days-grid">
            {groupDays.map(({ stage, matches: dayMatches }) => (
              <div key={stage} className="fixture-day-col">
                <div className="fixture-day-col__head">
                  <div className="fixture-day-col__title">{stage}</div>
                  <div className="fixture-day-col__count">{dayMatches.length} maç</div>
                </div>
                <div className="fixture-day-col__body">
                  {dayMatches.length === 0 ? (
                    <p className="fixture-day-col__empty">Maç planlanmamış</p>
                  ) : (
                    dayMatches.map((m) => (
                      <MatchCard key={m.id} m={m} onOpen={openMatch} variant="group" teamById={teamById} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {finalBlocks.length > 0 && (
        <section className="fixture-section">
          <h3 className="fixture-section__heading">Finaller</h3>
          <div className="fixture-finals-grid">
            {finalBlocks.map(({ stage, matches: stageMatches }) => {
              const isFinal = stage === "Final";
              return (
                <div
                  key={stage}
                  className={`fixture-final-block${isFinal ? " fixture-final-block--final" : ""}`}
                >
                  <div className="fixture-final-block__head">
                    <span className="fixture-final-block__icon">{FINAL_ICONS[stage] ?? "🏅"}</span>
                    <span className="fixture-final-block__title">{stage}</span>
                    <span className="fixture-final-block__count">{stageMatches.length} maç</span>
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
