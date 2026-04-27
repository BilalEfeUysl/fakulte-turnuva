import { useState } from "react";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import type { TournamentAppState } from "../../hooks/useTournamentApp";

type Props = { app: TournamentAppState };

export function DrawView({ app }: Props) {
  const {
    teams,
    groups,
    canDraw,
    hasDraw,
    drawRunning,
    runDrawAction,
    teamCount,
    moveGroupTeam,
    regenerateFixturesAction,
    adjustingGroups,
    groupSettings,
    updateDailyLimit,
    scheduleStartDate,
    setScheduleStartDate,
    autoPlanSchedule,
    planningSchedule,
  } = app;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const teamById = (id: number) => teams.find((t) => t.id === id);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Kura ve grup dağılımı
        </h2>
        <p style={{ margin: 0, color: "var(--arena-muted)", maxWidth: "52ch", lineHeight: 1.55 }}>
          Takımlar rastgele karıştırılır, yarısı A grubuna yarısı B grubuna düşer. Her grupta tek devreli
          lig fikstürü otomatik oluşur. Yeni kura, mevcut maç sonuçlarını ve olayları sıfırlar.
        </p>
      </div>

      {!canDraw ? (
        <div className="empty-state" style={{ marginBottom: "1.25rem" }}>
          <strong>Kura şartları</strong>
          Kura için tam 10 takım gerekir. Şu an {teamCount} takım kayıtlı.
        </div>
      ) : (
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            type="button"
            className="btn-arena btn-arena--gold"
            disabled={drawRunning}
            onClick={() => (hasDraw ? setConfirmOpen(true) : void runDrawAction())}
          >
            {drawRunning ? "Kura çekiliyor…" : hasDraw ? "Kurayı yeniden çek" : "Kurayı çek ve fikstürü oluştur"}
          </button>
        </div>
      )}

      {hasDraw && groups.length > 0 ? (
        <>
        <div className="draw-groups">
          {groups.map((g) => (
            <div key={g.id} className="draw-group">
              <h3>Grup {g.name}</h3>
              <ul>
                {g.team_ids.map((tid) => (
                  <li key={tid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <span>{teamById(tid)?.name ?? `Takım #${tid}`}</span>
                    <button
                      type="button"
                      className="btn-arena"
                      disabled={adjustingGroups}
                      onClick={() => void moveGroupTeam(tid, g.name === "A" ? "B" : "A")}
                    >
                      {g.name === "A" ? "B'ye taşı" : "A'ya taşı"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
          <h3 style={{ margin: 0 }}>Günlük maç limitleri</h3>
          {groupSettings.map((s) => (
            <label key={s.group_id} style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
              <span style={{ minWidth: 68 }}>Grup {s.group_name}</span>
              <input
                className="arena-input"
                type="number"
                min={1}
                value={s.daily_limit}
                onChange={(e) => void updateDailyLimit(s.group_id, Number(e.target.value) || 1)}
                style={{ width: 120 }}
              />
            </label>
          ))}
          <label style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
            <span style={{ minWidth: 68 }}>Başlangıç</span>
            <input
              type="date"
              className="arena-input"
              value={scheduleStartDate}
              onChange={(e) => setScheduleStartDate(e.target.value)}
            />
            <button
              type="button"
              className="btn-arena btn-arena--gold"
              disabled={planningSchedule}
              onClick={() => void autoPlanSchedule()}
            >
              {planningSchedule ? "Planlanıyor…" : "Otomatik maç günleri oluştur"}
            </button>
          </label>
        </div>
        </>
      ) : (
        <p style={{ color: "var(--arena-muted)" }}>Henüz kura çekilmedi.</p>
      )}
      {hasDraw ? (
        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn-arena"
            disabled={adjustingGroups}
            onClick={() => void regenerateFixturesAction()}
          >
            {adjustingGroups ? "Güncelleniyor…" : "Grupları kaydet ve fikstürü güncelle"}
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Kurayı yeniden çek"
        description="Tüm grup eşleşmeleri, fikstür, maç skorları ve maç olayları (gol / kart) silinecek. Devam edilsin mi?"
        confirmLabel="Evet, sıfırla ve kura çek"
        variant="danger"
        busy={drawRunning}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void runDrawAction();
        }}
      />
    </div>
  );
}
