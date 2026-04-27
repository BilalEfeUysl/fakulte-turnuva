import { useMemo, useState } from "react";
import type { MatchRow } from "../../types/tournament";
import type { TournamentAppState } from "../../hooks/useTournamentApp";

type Props = { app: TournamentAppState };
type GFilter = "all" | string;

function formatDate(value: string | null) {
  if (!value) return "Tarih bekleniyor";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("tr-TR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function FixturesView({ app }: Props) {
  const { matches, hasDraw, openMatch, updateMatchSchedule, planningSchedule } = app;
  const [g, setG] = useState<GFilter>("all");
  const [dragged, setDragged] = useState<MatchRow | null>(null);
  const [weekDateDraft, setWeekDateDraft] = useState<Record<number, string>>({});

  const filtered = useMemo(() => {
    const base = matches.filter((m) => m.stage === "group");
    if (g === "all") return base;
    return base.filter((m) => m.group_name === g);
  }, [matches, g]);

  const weekBuckets = useMemo(() => {
    const map = new Map<number, MatchRow[]>();
    for (const m of filtered) {
      const key = m.matchday_no > 0 ? m.matchday_no : 999;
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(m);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([week, list]) => [
        week,
        [...list].sort((x, y) => {
          const xd = x.scheduled_date ?? "9999-12-31";
          const yd = y.scheduled_date ?? "9999-12-31";
          return xd.localeCompare(yd) || x.calendar_slot - y.calendar_slot || x.id - y.id;
        }),
      ] as const);
  }, [filtered]);

  if (!hasDraw) {
    return (
      <div className="empty-state">
        <strong>Fikstür henüz yok</strong>
        Önce kura çekip grup maçlarını oluşturun.
      </div>
    );
  }

  return (
    <div>
      <div className="fixture-toolbar">
        <h2 className="fixture-title">Fikstür</h2>
        {(["all", "A", "B"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={"btn-arena" + (g === key ? " fixture-filter-active" : "")}
            onClick={() => setG(key)}
          >
            {key === "all" ? "Tümü" : `Grup ${key}`}
          </button>
        ))}
      </div>

      <p className="empty" style={{ marginBottom: "1rem" }}>
        Maçı başka haftaya taşımak için satırı sürükleyip bırakabilirsin.
      </p>

      <div className="fixture-list">
        {weekBuckets.map(([week, list], idx) => (
          <section
            key={week}
            className="fixture-block"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!dragged) return;
              const targetDate = list.find((m) => m.scheduled_date)?.scheduled_date ?? dragged.scheduled_date;
              void updateMatchSchedule({
                id: dragged.id,
                matchdayNo: week === 999 ? idx + 1 : week,
                scheduledDate: targetDate,
                calendarSlot: list.length + 1,
              });
              setDragged(null);
            }}
          >
            <header className="fixture-block__head">
              <div>
                <div className="fixture-block__title">
                  {week === 999 ? "Planlanmamış Maçlar" : `${week}. Hafta`}
                </div>
                <div className="fixture-block__meta">{list.length} maç</div>
              </div>
              <div className="fixture-block__date">
                <input
                  type="date"
                  className="arena-input"
                  value={weekDateDraft[week] ?? list[0]?.scheduled_date ?? ""}
                  onChange={(e) => setWeekDateDraft((p) => ({ ...p, [week]: e.target.value }))}
                  disabled={planningSchedule || week === 999}
                />
                <button
                  type="button"
                  className="btn-arena"
                  disabled={planningSchedule || week === 999}
                  onClick={() => {
                    const newDate = weekDateDraft[week] ?? list[0]?.scheduled_date;
                    if (!newDate) return;
                    void Promise.all(
                      list.map((m, order) =>
                        updateMatchSchedule({
                          id: m.id,
                          matchdayNo: m.matchday_no || week,
                          scheduledDate: newDate,
                          calendarSlot: m.calendar_slot || order + 1,
                        }),
                      ),
                    );
                  }}
                >
                  Tarihi uygula
                </button>
              </div>
            </header>

            <div className="fixture-rows">
              {list.map((m, rowIdx) => (
                <button
                  key={m.id}
                  type="button"
                  className="fixture-row"
                  draggable={!planningSchedule}
                  onDragStart={() => setDragged(m)}
                  onDragEnd={() => setDragged(null)}
                  onClick={() => openMatch(m.id)}
                >
                  <span className="fixture-row__order">{m.calendar_slot || rowIdx + 1}</span>
                  <span className="fixture-row__team fixture-row__team--left">{m.home_team_name}</span>
                  <span className="fixture-row__score">
                    {m.status === "finished" ? `${m.home_score} - ${m.away_score}` : "-"}
                  </span>
                  <span className="fixture-row__team fixture-row__team--right">{m.away_team_name}</span>
                  <span className="fixture-row__date">{formatDate(m.scheduled_date)}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
