import { useMemo } from "react";
import type { TournamentAppState } from "../../hooks/useTournamentApp";
import { TeamBadge } from "../ui/TeamBadge";

type Props = { app: TournamentAppState };

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_MODS = ["gold", "silver", "bronze"] as const;

export function ScorersView({ app }: Props) {
  const { scorers } = app;

  const teamById = useMemo(
    () => new Map(app.teams.map((t) => [t.id, t])),
    [app.teams]
  );

  if (app.loadingTeams) {
    return <div className="empty-state">Yükleniyor…</div>;
  }

  if (scorers.length === 0) {
    return (
      <div className="empty-state">
        <strong>Gol lideri tablosu boş</strong>
      </div>
    );
  }

  const top3 = scorers.slice(0, 3);
  const rest = scorers.slice(3);

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.35rem", fontWeight: 800 }}>Gol lideri</h2>

      <div className="scorers-podium" style={{ gridTemplateColumns: `repeat(${top3.length}, 1fr)` }}>
        {top3.map((s, i) => {
          const team = teamById.get(s.team_id);
          return (
            <div
              key={`${s.player_name}-${s.team_id}`}
              className={`scorers-podium-card scorers-podium-card--${PODIUM_MODS[i]}`}
            >
              <span className="scorers-podium-card__medal">{MEDALS[i]}</span>
              <span className="scorers-podium-card__name">{s.player_name}</span>
              <span className="scorers-podium-card__goals">
                <span className="scorers-podium-card__goals-count">{s.goals}</span>
                <span className="scorers-podium-card__goals-label">gol</span>
              </span>
              <span className="scorers-podium-card__team">
                <TeamBadge size="sm" color={team?.color} shortName={team?.short_name} name={s.team_name} />
                {s.team_name}
              </span>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="standings-card">
          <table className="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Oyuncu</th>
                <th>Takım</th>
                <th>Gol</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((s) => {
                const team = teamById.get(s.team_id);
                return (
                  <tr key={`${s.player_name}-${s.team_id}`}>
                    <td>{s.rank}</td>
                    <td style={{ fontWeight: 700 }}>{s.player_name}</td>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <TeamBadge size="sm" color={team?.color} shortName={team?.short_name} name={s.team_name} />
                        {s.team_name}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: "var(--arena-gold)" }}>{s.goals}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
