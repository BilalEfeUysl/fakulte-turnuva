import type { TournamentAppState } from "../../hooks/useTournamentApp";

type Props = { app: TournamentAppState };

export function ScorersView({ app }: Props) {
  const { scorers } = app;

  if (scorers.length === 0) {
    return (
      <div className="empty-state">
        <strong>Gol kralı tablosu boş</strong>
        Maçlardan gol olayı girildikçe bu tablo otomatik dolacaktır.
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.35rem", fontWeight: 800 }}>Gol kralı</h2>
      <div className="standings-card" style={{ maxWidth: 820 }}>
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Oyuncu</th>
              <th>Takım</th>
              <th>Gol</th>
              <th>Son gol dk.</th>
            </tr>
          </thead>
          <tbody>
            {scorers.map((s) => (
              <tr key={`${s.player_name}-${s.team_id}`}>
                <td>{s.rank}</td>
                <td style={{ fontWeight: 700 }}>{s.player_name}</td>
                <td>{s.team_name}</td>
                <td style={{ fontWeight: 800, color: "var(--arena-gold)" }}>{s.goals}</td>
                <td>{s.last_goal_minute != null ? `${s.last_goal_minute}'` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
