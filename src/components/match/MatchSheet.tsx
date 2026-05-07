import { useEffect, useMemo, useState } from "react";
import type { TournamentAppState } from "../../hooks/useTournamentApp";
import * as membersApi from "../../api/members";
import type { TeamMember } from "../../types/team";
import { StoryExportButton } from "../ui/StoryExportButton";

type Props = { app: TournamentAppState };

export function MatchSheet({ app }: Props) {
  const {
    selectedMatch,
    closeMatch,
    updateMatchSchedule,
    planningSchedule,
    savingMatch,
    saveMatchScores,
    resetMatchAction,
    deleteMatchAction,
    matchEvents,
    loadingMatchEvents,
    addEvent,
    removeEvent,
  } = app;

  const [home, setHome] = useState(0);
  const [away, setAway] = useState(0);
  const [status, setStatus] = useState("scheduled");
  const [playerName, setPlayerName] = useState("");
  const [eventType, setEventType] = useState("goal");
  const [teamSide, setTeamSide] = useState<"home" | "away">("home");
  const [homeMembers, setHomeMembers] = useState<TeamMember[]>([]);
  const [awayMembers, setAwayMembers] = useState<TeamMember[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [dateSavedFeedback, setDateSavedFeedback] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!selectedMatch) return;
    setHome(selectedMatch.home_score);
    setAway(selectedMatch.away_score);
    setStatus(selectedMatch.status);
    
    // Varsayılan olarak bugünü (yerel saat dilimi ile) ve 12:30'u baz al
    const localIsoDate = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
    setScheduledDate(selectedMatch.scheduled_date || localIsoDate);
    setScheduledTime(selectedMatch.scheduled_time || "12:30");
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedMatch) return;
    let cancelled = false;
    (async () => {
      try {
        const [h, a] = await Promise.all([
          membersApi.listMembers(selectedMatch.home_team_id),
          membersApi.listMembers(selectedMatch.away_team_id),
        ]);
        if (!cancelled) {
          setHomeMembers(h);
          setAwayMembers(a);
        }
      } catch {
        if (!cancelled) {
          setHomeMembers([]);
          setAwayMembers([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedMatch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMatch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMatch]);

  const teamById = useMemo(() => new Map(app.teams.map((t) => [t.id, t])), [app.teams]);

  if (!selectedMatch) return null;

  const homeId = selectedMatch.home_team_id;
  const awayId = selectedMatch.away_team_id;
  const teamIdForEvent = teamSide === "home" ? homeId : awayId;
  const activeMembers = teamSide === "home" ? homeMembers : awayMembers;

  const homeGoalEventsCount = matchEvents.filter((ev) => ev.team_id === homeId && ev.event_type === "goal").length;
  const awayGoalEventsCount = matchEvents.filter((ev) => ev.team_id === awayId && ev.event_type === "goal").length;

  const isGoalLimitReached =
    eventType === "goal" &&
    ((teamSide === "home" && homeGoalEventsCount >= selectedMatch.home_score) ||
     (teamSide === "away" && awayGoalEventsCount >= selectedMatch.away_score));

  return (
    <>
      <button type="button" className="match-sheet-backdrop" aria-label="Kapat" onClick={closeMatch} />
      <aside className="match-sheet" role="dialog" aria-modal="true" aria-labelledby="match-sheet-title">
        <div className="match-sheet__head">
          <button
            type="button"
            className="ghost"
            style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--arena-muted)" }}
            onClick={closeMatch}
          >
            ← Geri dön
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h2 id="match-sheet-title" style={{ margin: "0 0 0.25rem", fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
                Maç Detayı
              </h2>
              <div style={{ fontSize: "0.85rem", color: "var(--arena-gold)", fontWeight: 700 }}>
                {selectedMatch.group_name === "L" ? "Lig" : `Grup ${selectedMatch.group_name}`} · Maç #{selectedMatch.match_order}
              </div>
            </div>
          </div>
        </div>
        <div className="match-sheet__body">
          <section className="match-sheet__section">
            <h3 className="match-sheet__section-title">Skor ve Durum</h3>
            
            <div className="match-sheet__scoreboard">
              <div className="match-sheet__team-col">
                <div className="match-sheet__team-name">{selectedMatch.home_team_name}</div>
                <input
                  type="number"
                  min={0}
                  value={home}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    setHome(v);
                    if (status === "scheduled" && (v > 0 || away > 0)) setStatus("finished");
                  }}
                  className="arena-input match-sheet__score-input"
                />
              </div>
              
              <div className="match-sheet__vs">VS</div>
              
              <div className="match-sheet__team-col">
                <div className="match-sheet__team-name">{selectedMatch.away_team_name}</div>
                <input
                  type="number"
                  min={0}
                  value={away}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    setAway(v);
                    if (status === "scheduled" && (home > 0 || v > 0)) setStatus("finished");
                  }}
                  className="arena-input match-sheet__score-input"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="arena-input"
                style={{ flex: 1, fontWeight: 700 }}
              >
                <option value="scheduled">⏱️ Planlandı</option>
                <option value="finished">✅ Tamamlandı</option>
              </select>

              <button
                type="button"
                className="btn-arena btn-arena--gold"
                style={{ flex: 2 }}
                disabled={savingMatch || home < homeGoalEventsCount || away < awayGoalEventsCount}
                title={(home < homeGoalEventsCount || away < awayGoalEventsCount) ? "Skorbord, girilen gol olaylarından daha düşük olamaz!" : ""}
                onClick={() => void saveMatchScores({ homeScore: home, awayScore: away, status })}
              >
                {savingMatch ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>

            {selectedMatch.status === "finished" && (
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center" }}>
                <StoryExportButton
                  label="Hikaye Görseli Oluştur"
                  title="Bu maç sonucunu Instagram hikayesi olarak kaydet"
                  buildData={() => ({ type: "single_match_result", match: selectedMatch, teamById })}
                />
              </div>
            )}

            {confirmReset ? (
              <div style={{ marginTop: "1rem", background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.35)", borderRadius: "10px", padding: "0.85rem 1rem" }}>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#ff4d4d", fontWeight: 600 }}>
                  Skor sıfırlanacak, tüm gol/kart olayları silinecek. Emin misiniz?
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn-arena"
                    style={{ flex: 1, background: "#ff4d4d", color: "#fff", fontSize: "0.85rem" }}
                    disabled={savingMatch}
                    onClick={() => { setConfirmReset(false); void resetMatchAction(); }}
                  >
                    {savingMatch ? "Sıfırlanıyor…" : "Evet, Sıfırla"}
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    style={{ flex: 1, fontSize: "0.85rem" }}
                    disabled={savingMatch}
                    onClick={() => setConfirmReset(false)}
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : confirmDelete ? (
              <div style={{ marginTop: "1rem", background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.35)", borderRadius: "10px", padding: "0.85rem 1rem" }}>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#ff4d4d", fontWeight: 600 }}>
                  Maç ve tüm olay kayıtları tamamen silinecek! Emin misiniz?
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn-arena"
                    style={{ flex: 1, background: "#ff4d4d", color: "#fff", fontSize: "0.85rem" }}
                    disabled={savingMatch}
                    onClick={() => { setConfirmDelete(false); void deleteMatchAction(); }}
                  >
                    {savingMatch ? "Siliniyor…" : "Evet, Sil"}
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    style={{ flex: 1, fontSize: "0.85rem" }}
                    disabled={savingMatch}
                    onClick={() => setConfirmDelete(false)}
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="ghost"
                  style={{ flex: 1, color: "#ff4d4d", fontSize: "0.85rem", fontWeight: 600, border: "1px solid rgba(255,77,77,0.2)", borderRadius: "8px", padding: "0.5rem" }}
                  disabled={savingMatch}
                  onClick={() => setConfirmReset(true)}
                >
                  🔄 Maçı Sıfırla
                </button>
                <button
                  type="button"
                  className="ghost"
                  style={{ flex: 1, color: "#ff4d4d", fontSize: "0.85rem", fontWeight: 600, border: "1px solid rgba(255,77,77,0.2)", borderRadius: "8px", padding: "0.5rem" }}
                  disabled={savingMatch}
                  onClick={() => setConfirmDelete(true)}
                >
                  🗑️ Maçı Sil
                </button>
              </div>
            )}
          </section>

          <section className="match-sheet__section">
            <h3 className="match-sheet__section-title">Tarih ve Saat</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <input
                type="date"
                className="arena-input"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={planningSchedule}
              />
              <input
                type="time"
                className="arena-input"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={planningSchedule}
              />
              <button
                type="button"
                className="btn-arena"
                style={{ gridColumn: "1 / -1", backgroundColor: dateSavedFeedback ? "var(--arena-green)" : "" }}
                disabled={planningSchedule}
                onClick={async () => {
                  await updateMatchSchedule({
                    id: selectedMatch.id,
                    matchdayNo: selectedMatch.matchday_no,
                    scheduledDate: scheduledDate.trim() ? scheduledDate : null,
                    scheduledTime: scheduledTime.trim() ? scheduledTime : null,
                    calendarSlot: selectedMatch.calendar_slot,
                  });
                  setDateSavedFeedback(true);
                  setTimeout(() => setDateSavedFeedback(false), 2000);
                }}
              >
                {dateSavedFeedback ? "✅ Güncellendi!" : (planningSchedule ? "Güncelleniyor..." : "Tarih/saati güncelle")}
              </button>
            </div>
          </section>

          <section className="match-sheet__section">
            <h3 className="match-sheet__section-title">Olaylar (Gol & Kart)</h3>
            
            <div style={{ display: "grid", gap: "0.75rem", background: "rgba(0,0,0,0.1)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <select
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="arena-input"
              >
                <option value="" disabled>
                  {activeMembers.length > 0 ? "Oyuncu seçin..." : "Takımda kayıtlı oyuncu yok"}
                </option>
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.full_name}>
                    {m.jersey_no != null ? `#${m.jersey_no} ` : ""}{m.full_name}
                  </option>
                ))}
              </select>
              
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <select
                  value={teamSide}
                  onChange={(e) => {
                    setTeamSide(e.target.value as "home" | "away");
                    setPlayerName("");
                  }}
                  className="arena-input"
                >
                  <option value="home">{selectedMatch.home_team_name}</option>
                  <option value="away">{selectedMatch.away_team_name}</option>
                </select>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem" }}>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="arena-input"
                >
                  <option value="goal">⚽ Gol</option>
                  <option value="yellow">🟨 Sarı kart</option>
                  <option value="red">🟥 Kırmızı kart</option>
                </select>
                <button
                  type="button"
                  className="btn-arena"
                  onClick={() => {
                    void addEvent({
                      teamId: teamIdForEvent,
                      playerName: playerName.trim(),
                      eventType,
                      minute: 0,
                    });
                    setPlayerName("");
                  }}
                  disabled={!playerName.trim() || isGoalLimitReached}
                  title={isGoalLimitReached ? "Skorborddaki golden fazlası eklenemez!" : ""}
                >
                  Ekle
                </button>
              </div>
            </div>

            <ul style={{ listStyle: "none", margin: "1.25rem 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {loadingMatchEvents ? (
                <li style={{ color: "var(--arena-muted)", textAlign: "center", padding: "1rem" }}>Yükleniyor…</li>
              ) : matchEvents.length === 0 ? (
                <li style={{ color: "var(--arena-muted)", fontSize: "0.85rem", textAlign: "center", padding: "1rem", background: "rgba(0,0,0,0.1)", borderRadius: "12px" }}>
                  Henüz olay eklenmedi.
                </li>
              ) : (
                matchEvents.map((ev) => (
                  <li
                    key={ev.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span
                        className={
                          "event-pill event-pill--" +
                          (ev.event_type === "goal" ? "goal" : ev.event_type === "yellow" ? "yellow" : "red")
                        }
                      >
                        {ev.event_type === "goal" ? "⚽" : ev.event_type === "yellow" ? "🟨" : "🟥"}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong style={{ fontSize: "0.9rem" }}>{ev.player_name}</strong>
                        <span style={{ fontSize: "0.7rem", color: "var(--arena-muted)" }}>{ev.team_name}</span>
                      </div>
                    </div>
                    <button type="button" className="ghost" style={{ padding: "0.25rem 0.5rem", color: "var(--arena-red)", fontSize: "0.75rem" }} onClick={() => void removeEvent(ev.id)}>
                      Sil
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}
