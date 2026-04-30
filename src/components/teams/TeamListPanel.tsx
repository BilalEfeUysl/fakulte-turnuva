import type { Team } from "../../types/team";
import type { TeamSummaryRow } from "../../types/tournament";
import { initialsFromName } from "../../utils/initials";

type Props = {
  teams: Team[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  summaries?: Record<number, TeamSummaryRow>;
  loading?: boolean;
  disabled?: boolean;
};

function TeamListSkeleton() {
  return (
    <ul className="team-list team-list--skeleton" aria-hidden>
      {["a", "b", "c"].map((k) => (
        <li key={k}>
          <div className="skeleton-row">
            <span className="skeleton skeleton--avatar" />
            <span className="skeleton skeleton--text" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TeamListPanel({
  teams,
  selectedId,
  onSelect,
  summaries,
  loading = false,
  disabled = false,
}: Props) {
  return (
    <section className="panel" aria-labelledby="team-list-title">
      <div className="panel__head">
        <h2 className="panel__title" id="team-list-title">
          Takımlar
        </h2>
        <span className="panel__meta">
          {loading ? "Yükleniyor…" : teams.length === 0 ? "Liste boş" : `${teams.length} takım`}
        </span>
      </div>
      {loading ? (
        <TeamListSkeleton />
      ) : teams.length === 0 ? (
        <div className="empty-state">
          <strong>Henüz takım eklenmedi</strong>
          Soldaki karttan ilk takımınızı oluşturun; sonra buradan seçip kadroyu doldurun.
        </div>
      ) : (
        <ul className="team-list">
          {teams.map((t) => (
            <li key={t.id}>
              {(() => {
                const s = summaries?.[t.id];
                const stats = s
                  ? `${s.played} maç · ${s.goals_for}G ${s.yellow_cards}S ${s.red_cards}K`
                  : "";
                const sub =
                  t.faculty_name && t.faculty_name !== t.name
                    ? [t.faculty_name, stats].filter(Boolean).join(" · ")
                    : stats;
                return (
              <button
                type="button"
                className={"team-item" + (selectedId === t.id ? " selected" : "")}
                onClick={() => onSelect(t.id)}
                aria-pressed={selectedId === t.id}
                disabled={disabled}
              >
                <span className="team-item__avatar" aria-hidden>
                  {initialsFromName(t.name)}
                </span>
                <span className="team-item__body">
                  <span className="team-item__name">{t.name}</span>
                  <span className="team-item__meta">{sub || "\u00a0"}</span>
                </span>
              </button>
                );
              })()}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
