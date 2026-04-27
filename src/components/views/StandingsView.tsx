import type { TournamentAppState } from "../../hooks/useTournamentApp";

type Props = { app: TournamentAppState };

export function StandingsView({ app }: Props) {
  const { standings, hasDraw } = app;

  if (!hasDraw || standings.length === 0) {
    return (
      <div className="empty-state">
        <strong>Puan tablosu hazır değil</strong>
        Kura sonrası en az bir maç oynanınca satırlar güncellenir. Bitmiş maçların skorlarını fikstürden
        girin.
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.35rem", fontWeight: 800 }}>Puan durumu</h2>
      <p style={{ margin: "0 0 1.5rem", color: "var(--arena-muted)", maxWidth: "54ch" }}>
        Sıralama ve eşitlik bozma: puan {" > "} ikili averaj {" > "} genel averaj {" > "} atılan gol.
      </p>
      <div className="standings-wrap">
        {standings.map((g) => (
          <div key={g.group_id} className="standings-card">
            <div className="standings-card__head">Grup {g.group_name}</div>
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
                {g.rows.map((r) => (
                  <tr key={r.team_id} className={"rank-" + r.rank}>
                    <td>{r.rank}</td>
                    <td style={{ fontWeight: 700 }}>{r.team_name}</td>
                    <td>{r.played}</td>
                    <td>{r.won}</td>
                    <td>{r.drawn}</td>
                    <td>{r.lost}</td>
                    <td>{r.gf}</td>
                    <td>{r.ga}</td>
                    <td>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                    <td style={{ fontWeight: 800, color: "var(--arena-gold)" }}>{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
