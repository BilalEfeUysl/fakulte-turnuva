import { useEffect, useState } from "react";
import type { TournamentAppState } from "../../hooks/useTournamentApp";
import * as membersApi from "../../api/members";
import type { TeamMember } from "../../types/team";

type Props = { app: TournamentAppState };

export function MatchSheet({ app }: Props) {
  const {
    selectedMatch,
    closeMatch,
    saveMatchScores,
    savingMatch,
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
  const [minute, setMinute] = useState(0);
  const [teamSide, setTeamSide] = useState<"home" | "away">("home");
  const [homeMembers, setHomeMembers] = useState<TeamMember[]>([]);
  const [awayMembers, setAwayMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    if (!selectedMatch) return;
    setHome(selectedMatch.home_score);
    setAway(selectedMatch.away_score);
    setStatus(selectedMatch.status);
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

  if (!selectedMatch) return null;

  const homeId = selectedMatch.home_team_id;
  const awayId = selectedMatch.away_team_id;
  const teamIdForEvent = teamSide === "home" ? homeId : awayId;
  const activeMembers = teamSide === "home" ? homeMembers : awayMembers;

  return (
    <>
      <button type="button" className="match-sheet-backdrop" aria-label="Kapat" onClick={closeMatch} />
      <aside className="match-sheet" role="dialog" aria-modal="true" aria-labelledby="match-sheet-title">
        <div className="match-sheet__head">
          <button
            type="button"
            className="btn-arena"
            style={{ marginBottom: "0.75rem" }}
            onClick={closeMatch}
          >
            ← Kapat
          </button>
          <h2 id="match-sheet-title">
            {selectedMatch.home_team_name} — {selectedMatch.away_team_name}
          </h2>
          <div style={{ fontSize: "0.82rem", color: "var(--arena-muted)" }}>
            Grup {selectedMatch.group_name} · Maç #{selectedMatch.match_order}
          </div>
        </div>
        <div className="match-sheet__body">
          <section style={{ marginBottom: "1.75rem" }}>
            <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--arena-muted)", margin: "0 0 0.75rem" }}>
              Skor ve durum
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0.75rem", alignItems: "end" }}>
              <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 600 }}>
                {selectedMatch.home_team_name}
                <input
                  type="number"
                  min={0}
                  value={home}
                  onChange={(e) => setHome(Number(e.target.value) || 0)}
                  className="arena-input"
                />
              </label>
              <span style={{ fontWeight: 900, paddingBottom: "0.5rem" }}>:</span>
              <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 600 }}>
                {selectedMatch.away_team_name}
                <input
                  type="number"
                  min={0}
                  value={away}
                  onChange={(e) => setAway(Number(e.target.value) || 0)}
                  className="arena-input"
                />
              </label>
            </div>
            <label style={{ display: "grid", gap: "0.35rem", marginTop: "1rem", fontSize: "0.78rem", fontWeight: 600 }}>
              Durum
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="arena-input"
              >
                <option value="scheduled">Planlandı</option>
                <option value="finished">Tamamlandı</option>
              </select>
            </label>
            <button
              type="button"
              className="btn-arena btn-arena--gold"
              style={{ marginTop: "1rem", width: "100%" }}
              disabled={savingMatch}
              onClick={() => void saveMatchScores({ homeScore: home, awayScore: away, status })}
            >
              {savingMatch ? "Kaydediliyor…" : "Maçı tamamla / güncelle"}
            </button>
          </section>

          <section>
            <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--arena-muted)", margin: "0 0 0.75rem" }}>
              Gol ve kartlar
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--arena-muted)", margin: "0 0 1rem", lineHeight: 1.5 }}>
              Goller puan tablosu için skor satırını kullanır; buradaki gol satırları kayıt amaçlıdır. Sarı
              ve kırmızı kartlar disiplin kaydı içindir.
            </p>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 600 }}>
                Oyuncu
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ad Soyad"
                  className="arena-input"
                  list="players-list"
                />
                <datalist id="players-list">
                  {activeMembers.map((m) => (
                    <option key={m.id} value={m.full_name} />
                  ))}
                </datalist>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 600 }}>
                  Takım
                  <select
                    value={teamSide}
                    onChange={(e) => setTeamSide(e.target.value as "home" | "away")}
                    className="arena-input"
                  >
                    <option value="home">{selectedMatch.home_team_name}</option>
                    <option value="away">{selectedMatch.away_team_name}</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 600 }}>
                  Dakika
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={minute}
                    onChange={(e) => setMinute(Number(e.target.value) || 0)}
                    className="arena-input"
                  />
                </label>
              </div>
              <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 600 }}>
                Olay
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="arena-input"
                >
                  <option value="goal">Gol</option>
                  <option value="yellow">Sarı kart</option>
                  <option value="red">Kırmızı kart</option>
                </select>
              </label>
              <button
                type="button"
                className="btn-arena"
                onClick={() => {
                  void addEvent({
                    teamId: teamIdForEvent,
                    playerName: playerName.trim(),
                    eventType,
                    minute,
                  });
                  setPlayerName("");
                }}
                disabled={!playerName.trim()}
              >
                Olay ekle
              </button>
            </div>

            <ul style={{ listStyle: "none", margin: "1.25rem 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {loadingMatchEvents ? (
                <li style={{ color: "var(--arena-muted)" }}>Yükleniyor…</li>
              ) : matchEvents.length === 0 ? (
                <li style={{ color: "var(--arena-muted)", fontSize: "0.9rem" }}>Henüz olay yok.</li>
              ) : (
                matchEvents.map((ev) => (
                  <li
                    key={ev.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      padding: "0.55rem 0.65rem",
                      borderRadius: 12,
                      background: "var(--arena-surface2)",
                      border: "1px solid var(--arena-line)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span>
                      <span
                        className={
                          "event-pill event-pill--" +
                          (ev.event_type === "goal" ? "goal" : ev.event_type === "yellow" ? "yellow" : "red")
                        }
                      >
                        {ev.event_type === "goal" ? "⚽ Gol" : ev.event_type === "yellow" ? "🟨 Sarı" : "🟥 Kırmızı"}
                      </span>{" "}
                      <strong>{ev.player_name}</strong> · {ev.team_name} · {ev.minute}&apos;
                    </span>
                    <button type="button" className="btn-arena btn-arena--danger" onClick={() => void removeEvent(ev.id)}>
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
