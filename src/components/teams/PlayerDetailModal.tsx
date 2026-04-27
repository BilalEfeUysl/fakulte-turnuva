import type { PlayerSummaryRow } from "../../types/tournament";

type Props = {
  summary: PlayerSummaryRow | null;
  onClose: () => void;
};

export function PlayerDetailModal({ summary, onClose }: Props) {
  if (!summary) return null;
  return (
    <>
      <button type="button" className="match-sheet-backdrop" aria-label="Kapat" onClick={onClose} />
      <aside className="match-sheet" role="dialog" aria-modal="true">
        <div className="match-sheet__head">
          <button type="button" className="btn-arena" onClick={onClose}>
            ← Kapat
          </button>
          <h2 style={{ marginTop: "0.8rem" }}>{summary.player_name}</h2>
          <div style={{ color: "var(--arena-muted)", fontSize: "0.86rem" }}>{summary.team_name}</div>
        </div>
        <div className="match-sheet__body">
          <div className="arena-stat-grid">
            <div className="arena-stat">
              <div className="arena-stat__v">{summary.goals}</div>
              <div className="arena-stat__l">Gol</div>
            </div>
            <div className="arena-stat">
              <div className="arena-stat__v">{summary.yellow_cards}</div>
              <div className="arena-stat__l">Sarı kart</div>
            </div>
            <div className="arena-stat">
              <div className="arena-stat__v">{summary.red_cards}</div>
              <div className="arena-stat__l">Kırmızı kart</div>
            </div>
            <div className="arena-stat">
              <div className="arena-stat__v">{summary.matches}</div>
              <div className="arena-stat__l">Maç</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
