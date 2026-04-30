import { useEffect, useMemo, useRef, useState } from "react";
import type { TournamentAppState } from "../../hooks/useTournamentApp";
import { ConfirmDialog } from "../ui/ConfirmDialog";

type DrawHistoryItem = {
  id: string;
  focusTeamId: number;
  weekNo: number;
  opponentId: number;
};

const pickRandom = <T,>(arr: T[]): T | null => {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

export function DrawView({ app }: { app: TournamentAppState }) {
  const {
    canDraw,
    teamCount,
    drawRunning,
    runLeagueDrawAction,
    resetAllAction,
    matches,
    teams,
    leagueDrawCompleted,
    markLeagueDrawCompleted,
    setView,
  } = app;

  const [requestedWeeksCount, setRequestedWeeksCount] = useState(9);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);

  const [knownOppSets, setKnownOppSets] = useState<Record<number, Set<number>>>({});
  const [history, setHistory] = useState<DrawHistoryItem[]>([]);
  const [activeReveal, setActiveReveal] = useState<DrawHistoryItem | null>(null);
  const [localReady, setLocalReady] = useState(false);
  const [stepBusy, setStepBusy] = useState(false);
  const revealTimerRef = useRef<number | null>(null);

  const teamNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const t of teams) map[t.id] = t.name;
    return map;
  }, [teams]);

  const leagueMatches = useMemo(() => {
    return matches.filter((m) => m.stage === "league" && m.matchday_no > 0);
  }, [matches]);

  const maxWeeksInGenerated = useMemo(() => {
    let max = 0;
    for (const m of leagueMatches) max = Math.max(max, m.matchday_no);
    return max;
  }, [leagueMatches]);

  const effectiveWeeksCount = useMemo(() => {
    return Math.max(1, Math.min(requestedWeeksCount, maxWeeksInGenerated || requestedWeeksCount));
  }, [requestedWeeksCount, maxWeeksInGenerated]);

  const leagueMatchesKey = useMemo(() => {
    // Matches are regenerated on draw rerun; this key helps re-init client-side step state.
    const ids = leagueMatches.map((m) => m.id);
    ids.sort((a, b) => a - b);
    return ids.join("|");
  }, [leagueMatches]);

  const opponentByTeamAndWeek = useMemo(() => {
    const opp: Record<number, Record<number, number>> = {};
    for (const m of leagueMatches) {
      const wk = m.matchday_no;
      if (!wk) continue;
      if (!opp[m.home_team_id]) opp[m.home_team_id] = {};
      if (!opp[m.away_team_id]) opp[m.away_team_id] = {};
      opp[m.home_team_id][wk] = m.away_team_id;
      opp[m.away_team_id][wk] = m.home_team_id;
    }
    return opp;
  }, [leagueMatches]);

  useEffect(() => {
    // When backend regenerates league matches, reset local reveal session.
    if (leagueMatches.length === 0) return;
    setLocalReady(false);
    const next: Record<number, Set<number>> = {};
    for (const t of teams) next[t.id] = new Set<number>();
    setKnownOppSets(next);
    setHistory([]);
    setActiveReveal(null);
    setLocalReady(true);
  }, [leagueMatchesKey, leagueMatches.length, teams]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
    };
  }, []);

  const isRevealing = leagueMatches.length > 0 && !leagueDrawCompleted;


  const totalKnownOppCount = useMemo(() => {
    let sum = 0;
    for (const t of teams) sum += knownOppSets[t.id]?.size ?? 0;
    return sum;
  }, [teams, knownOppSets]);

  const totalTargetOppCount = useMemo(() => {
    return teams.length * effectiveWeeksCount;
  }, [teams.length, effectiveWeeksCount]);

  const progressPct = useMemo(() => {
    if (totalTargetOppCount <= 0) return 0;
    return Math.round((totalKnownOppCount / totalTargetOppCount) * 100);
  }, [totalKnownOppCount, totalTargetOppCount]);

  const canReveal = isRevealing && localReady && !drawRunning && !stepBusy;

  const stepReveal = () => {
    if (!canReveal) return;
    if (effectiveWeeksCount <= 0) return;
    setStepBusy(true);

    const next: Record<number, Set<number>> = { ...knownOppSets };

    const unrevealedMatches: { focusId: number; weekNo: number; opponentId: number }[] = [];
    for (const m of leagueMatches) {
      if (m.matchday_no <= 0 || m.matchday_no > effectiveWeeksCount) continue;
      // Maçlar çift yönlü eklendiği için sadece bir tarafı kontrol etmek yeterli
      if (!(next[m.home_team_id]?.has(m.away_team_id))) {
        unrevealedMatches.push({
          focusId: m.home_team_id,
          weekNo: m.matchday_no,
          opponentId: m.away_team_id,
        });
      }
    }

    if (unrevealedMatches.length === 0) {
      setTimeout(() => setStepBusy(false), 0);
      return;
    }

    const match = pickRandom(unrevealedMatches);
    if (!match) {
      setTimeout(() => setStepBusy(false), 0);
      return;
    }

    const { focusId, weekNo, opponentId } = match;

    const focusOppSet = new Set(next[focusId] ?? []);
    focusOppSet.add(opponentId);
    next[focusId] = focusOppSet;

    const opponentOppSet = new Set(next[opponentId] ?? []);
    opponentOppSet.add(focusId);
    next[opponentId] = opponentOppSet;

    setKnownOppSets(next);

    const revealItem: DrawHistoryItem = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      focusTeamId: focusId,
      weekNo,
      opponentId,
    };
    setHistory((h) => [...h, revealItem]);
    setActiveReveal(revealItem);
    if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
    revealTimerRef.current = window.setTimeout(() => setActiveReveal(null), 1350);

    const allDone = unrevealedMatches.length === 1; // bu son maçtıysa
    if (allDone) markLeagueDrawCompleted();
    
    // State güncellemesi bir sonraki render’da yayılacağı için kısa bir süre sonra step’i tekrar aktif ediyoruz.
    setTimeout(() => setStepBusy(false), 0);
  };

  const handleStartOrRegenerate = async () => {
    if (!canDraw || drawRunning) return;
    await runLeagueDrawAction(requestedWeeksCount);
    // Local reveal init happens in effects when matches change.
  };

  const handleGoToFixtures = () => {
    // Draw is complete; now allow navigation.
    setView("fixtures");
  };

  return (
    <div className="draw-page">
      <div className="draw-header">
        <div>
          <h2 className="draw-title">Kura ve lig fikstürü</h2>
        </div>
        <div className="draw-progressbox" aria-label={`Kura ilerleme: ${progressPct}%`}>
          <div className="draw-progressbox__label">İlerleme</div>
          <div className="draw-progress">
            <div className="draw-progress__fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {!canDraw ? (
        <div className="empty-state">
          <strong>Kura şartları</strong>
          <div style={{ marginTop: 6 }}>Kura için tam 10 takım gerekir. Şu an {teamCount} takım kayıtlı.</div>
        </div>
      ) : (
        <div className="draw-layout">
          <section className="draw-left">
            <div className="draw-controls">
              <label className="draw-control">
                <span>Tur sayısı (max 9)</span>
                <span style={{ fontSize: "0.75rem", color: "var(--arena-muted)", marginTop: 2 }}>
                  10 takımla tam lig = 9 tur, 45 maç. Daha az tur seçersen kısaltılmış sezon üretilir.
                </span>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={requestedWeeksCount}
                  onChange={(e) => setRequestedWeeksCount(Math.max(1, Math.min(9, Number(e.target.value) || 1)))}
                  className="arena-input"
                  style={{ width: 140 }}
                  disabled={drawRunning || isRevealing}
                />
              </label>

              <button
                type="button"
                className="btn-arena btn-arena--gold"
                disabled={drawRunning || isRevealing}
                onClick={handleStartOrRegenerate}
              >
                {isRevealing || drawRunning
                  ? "Kura devam ediyor…"
                  : leagueMatches.length > 0
                    ? "Lig fikstürünü yeniden üret"
                    : "Kurayı çek ve lig fikstürü üret"}
              </button>
            </div>

            <div className="draw-strip">
              <div className="draw-strip__top">
                <div className="draw-strip__title">Çekiliş şeridi</div>
                <div className="draw-strip__legend">
                  <span className="draw-strip__legenditem">
                    <span className="cl-dot draw-dot--off" /> Bekleyen
                  </span>
                  <span className="draw-strip__legenditem">
                    <span className="cl-dot draw-dot--on" /> Açılan
                  </span>
                </div>
              </div>

              <div className="draw-strip__rows">
                {teams.map((t) => {
                  const rowSet = knownOppSets[t.id] ?? new Set<number>();
                  const isComplete = rowSet.size >= effectiveWeeksCount;
                  const isFocus = activeReveal != null && (activeReveal.focusTeamId === t.id || activeReveal.opponentId === t.id);
                  return (
                    <div
                      key={t.id}
                      className={[
                        "draw-strip__row",
                        isFocus ? "is-focus" : "",
                        isComplete ? "is-done" : "",
                      ].join(" ")}
                    >
                      <div className="draw-strip__team">{t.name}</div>
                      <div className="draw-strip__dots">
                        {Array.from({ length: effectiveWeeksCount }).map((_, i) => {
                          const wk = i + 1;
                          const oppId = opponentByTeamAndWeek[t.id]?.[wk];
                          const on = oppId != null && rowSet.has(oppId);
                          return <span key={wk} className={`cl-dot ${on ? "draw-dot--on" : "draw-dot--off"}`} />;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </section>

          <section className="draw-right">
            <div className="draw-history">
              <div className="draw-history__header">
                <div className="draw-history__title">Kura geçmişi</div>
                {isRevealing ? (
                  <div className="draw-history__hint">
                    Rastgele eşleşme açılıyor...
                  </div>
                ) : leagueDrawCompleted ? (
                  <div className="draw-history__hint">Kura tamamlandı.</div>
                ) : (
                  <div className="draw-history__hint">Önce lig fikstürünü üret.</div>
                )}
              </div>

              <div className="draw-history__list" role="log" aria-live="polite">
                {history.length === 0 ? (
                  <div className="draw-history__empty">Henüz rakip açılmadı.</div>
                ) : (
                  history
                    .slice()
                    .reverse()
                    .map((h) => (
                      <div key={h.id} className="cl-opp-card cl-opp-card--pair">
                        <span className="cl-opp-card__pair">
                          {teamNameById[h.focusTeamId]} <strong style={{ color: "var(--arena-gold)", margin: "0 4px" }}>vs</strong> {teamNameById[h.opponentId]}
                        </span>
                      </div>
                    ))
                )}
              </div>

              <div className="draw-actions">
                <button
                  type="button"
                  className="btn-arena btn-arena--gold"
                  disabled={!canReveal || leagueDrawCompleted}
                  onClick={stepReveal}
                >
                  Kura çek
                </button>

                <button
                  type="button"
                  className="btn-arena"
                  disabled={!leagueDrawCompleted}
                  onClick={handleGoToFixtures}
                >
                  Fikstüre geç
                </button>
              </div>
            </div>
          </section>

          {/* Reset section */}
          <section style={{
            gridColumn: "1 / -1",
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--arena-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 4 }}>
                Tüm fikstürü sıfırla
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--arena-muted)", lineHeight: 1.5 }}>
                Tüm maçlar, kura ve fikstür silinir. Takımlar ve kadro bilgileri korunur.
              </div>
            </div>
            <button
              type="button"
              className="btn-arena btn-arena--danger"
              disabled={drawRunning}
              onClick={() => setResetStep(1)}
            >
              Sıfırla
            </button>
          </section>
        </div>
      )}

      {activeReveal ? (
        <div key={activeReveal.id} className="draw-reveal-overlay" aria-live="assertive" aria-atomic="true">
          <div className="draw-reveal-overlay__inner">
            <div className="draw-reveal-overlay__week">EŞLEŞME AÇILDI</div>
            <div className="draw-reveal-overlay__matchup">
              <span>{teamNameById[activeReveal.focusTeamId]}</span>
              <strong>VS</strong>
              <span>{teamNameById[activeReveal.opponentId]}</span>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={resetStep === 1}
        title="Fikstürü sıfırla"
        description="Tüm maçlar, kura ve fikstür silinecek. Takımlar korunacak. Devam etmek istiyor musun?"
        confirmLabel="Evet, devam et"
        variant="danger"
        onConfirm={() => setResetStep(2)}
        onCancel={() => setResetStep(0)}
      />

      <ConfirmDialog
        open={resetStep === 2}
        title="Son onay — Bu işlem geri alınamaz!"
        description="Tüm turnuva verisi kalıcı olarak silinecek. Kesinlikle emin misin?"
        confirmLabel="Evet, sil"
        cancelLabel="Vazgeç"
        variant="danger"
        busy={drawRunning}
        onConfirm={() => {
          setResetStep(0);
          void resetAllAction();
        }}
        onCancel={() => setResetStep(0)}
      />
    </div>
  );
}

