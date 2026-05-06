import type { AppView } from "../../types/tournament";

const TABS: { id: AppView; label: string }[] = [
  { id: "home", label: "Ana Sayfa" },
  { id: "teams", label: "Takımlar" },
  { id: "management", label: "Yönetim" },
  { id: "fixtures", label: "Fikstür" },
  { id: "standings", label: "Puan Tablosu" },
  { id: "scorers", label: "Gol Lideri" },
];

type Props = {
  view: AppView;
  onView: (v: AppView) => void;
};

export function ArenaShell({ view, onView }: Props) {
  return (
    <header className="arena-nav">
      <div className="arena-brand">
        <div className="arena-brand__icon" aria-hidden>
          FT
        </div>
        <div className="arena-brand__text">
          <span className="arena-brand__k">Fakülte turnuvası</span>
          <span className="arena-brand__n">Saha kontrol paneli</span>
        </div>
      </div>
      <nav className="arena-tabs" aria-label="Bölümler">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={"arena-tab" + (view === t.id ? " is-active" : "")}
            onClick={() => onView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
