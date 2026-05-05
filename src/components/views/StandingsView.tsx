import { useMemo } from "react";
import type { TournamentAppState } from "../../hooks/useTournamentApp";
import { TeamBadge } from "../ui/TeamBadge";

type Props = { app: TournamentAppState };

function rowZoneClass(rank: number): string {
  if (rank <= 2) return "zone-sf";
  if (rank <= 6) return "zone-po";
  return "";
}

function groupLabel(name: string): string {
  if (name === "Lig") return "Lig";
  if (name === "Genel") return "Tüm Takımlar";
  return `Grup ${name}`;
}

export function StandingsView({ app }: Props) {
  const { standings } = app;

  const teamById = useMemo(
    () => new Map(app.teams.map((t) => [t.id, t])),
    [app.teams]
  );

  if (standings.length === 0) {
    return (
      <div className="empty-state">
        <strong>Takım yok</strong>
      </div>
    );
  }

  const isPreDraw = standings.length === 1 && standings[0].group_name === "Genel";

  return (
    <div className="standings-view">
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.35rem", fontWeight: 800 }}>Puan durumu</h2>
      <div className="standings-wrap">
        {standings.map((g) => (
          <div key={g.group_id} className="standings-card">
            <div className="standings-card__head">{groupLabel(g.group_name)}</div>
            <table className="standings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Takım</th>
                  <th>O</th>
                  <th>G</th>
                  <th>B</th>
                  <th>M</th>
                  <th>A</th>
                  <th>Y</th>
                  <th>Av</th>
                  <th>P</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => {
                  const zone = isPreDraw ? "" : rowZoneClass(r.rank);
                  const team = teamById.get(r.team_id);
                  return (
                    <tr key={r.team_id} className={["rank-" + r.rank, zone].filter(Boolean).join(" ")}>
                      <td>
                        <span className={zone ? `standings-rank-badge standings-rank-badge--${zone}` : undefined}>
                          {r.rank}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <TeamBadge
                            size="sm"
                            color={team?.color}
                            shortName={team?.short_name}
                            name={r.team_name}
                          />
                          <span style={{ fontWeight: 700 }}>{r.team_name}</span>
                        </span>
                      </td>
                      <td>{r.played}</td>
                      <td>{r.won}</td>
                      <td>{r.drawn}</td>
                      <td>{r.lost}</td>
                      <td>{r.gf}</td>
                      <td>{r.ga}</td>
                      <td>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                      <td style={{ fontWeight: 800, color: "var(--arena-gold)" }}>{r.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {!isPreDraw && (
        <div className="standings-legend">
          <span className="standings-legend__item standings-legend__item--sf">
            <span className="standings-legend__dot" />
            Yarı Finalist (1.–2. sıra)
          </span>
          <span className="standings-legend__item standings-legend__item--po">
            <span className="standings-legend__dot" />
            Playoff (3.–6. sıra)
          </span>
          <span className="standings-legend__item">
            <span className="standings-legend__dot standings-legend__dot--neutral" />
            Elendi (7.+)
          </span>
        </div>
      )}
    </div>
  );
}
