import { useMemo } from "react";
import type { GroupStandings } from "../../types/tournament";
import type { TournamentAppState } from "../../hooks/useTournamentApp";
import { TeamBadge } from "../ui/TeamBadge";
import { StoryExportButton } from "../ui/StoryExportButton";

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
  const { standings, loadingStandings } = app;

  const teamById = useMemo(
    () => new Map(app.teams.map((t) => [t.id, t])),
    [app.teams]
  );

  if (loadingStandings) {
    return <div className="empty-state">Yükleniyor…</div>;
  }

  if (standings.length === 0) {
    return (
      <div className="empty-state">
        <strong>Puan tablosu henüz hazır değil</strong>
      </div>
    );
  }

  return (
    <div className="standings-view">
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.35rem", fontWeight: 800 }}>Puan durumu</h2>
      <div className="standings-wrap">
        {standings.map((g: GroupStandings) => (
          <div key={g.group_id} className="standings-card">
            <div className="standings-card__head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
              <span>{groupLabel(g.group_name)}</span>
              <StoryExportButton
                size="sm"
                label="Hikaye"
                title="Bu puan tablosunu Instagram hikayesi olarak kaydet"
                buildData={() => ({
                  type: "standings",
                  group: g,
                  teamById,
                  groupLabel: groupLabel(g.group_name),
                })}
              />
            </div>
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
                {g.rows.map((r, i) => {
                  const zone = rowZoneClass(r.rank);
                  const prevZone = i > 0 ? rowZoneClass(g.rows[i - 1].rank) : "";
                  const nextZone = i < g.rows.length - 1 ? rowZoneClass(g.rows[i + 1].rank) : "";
                  const isFirst = zone && zone !== prevZone;
                  const isLast = zone && zone !== nextZone;
                  const team = teamById.get(r.team_id);
                  const cls = [
                    "rank-" + r.rank,
                    zone,
                    isFirst ? zone + "--first" : "",
                    isLast ? zone + "--last" : "",
                  ].filter(Boolean).join(" ");
                  return (
                    <tr key={r.team_id} className={cls}>
                      <td>
                        <span className={`standings-rank-badge${zone ? ` standings-rank-badge--${zone}` : ""}`}>
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
    </div>
  );
}
