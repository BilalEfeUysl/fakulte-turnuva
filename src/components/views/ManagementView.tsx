import { useState } from "react";
import { TeamFormPanel } from "../teams/TeamFormPanel";
import type { TournamentAppState } from "../../hooks/useTournamentApp";
import type { MatchStage } from "../../types/tournament";

const STAGES: MatchStage[] = ["Gün 1", "Gün 2", "Gün 3", "Playoff", "Yarı Final", "Final"];

type PendingReset = "tournament" | "teams";
type Props = { app: TournamentAppState };

export function ManagementView({ app }: Props) {
  const [homeTeamId, setHomeTeamId] = useState<number | "">("");
  const [awayTeamId, setAwayTeamId] = useState<number | "">("");
  const [stage, setStage] = useState<MatchStage>(STAGES[0]);
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [matchTime, setMatchTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingReset, setPendingReset] = useState<PendingReset | null>(null);

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (homeTeamId === "" || awayTeamId === "") return;
    setSaving(true);
    try {
      await app.addMatchAction({
        homeTeamId: homeTeamId as number,
        awayTeamId: awayTeamId as number,
        stage,
        matchDate: matchDate || null,
        matchTime: matchTime || null,
      });
      setHomeTeamId("");
      setAwayTeamId("");
      setStage(STAGES[0]);
      setMatchDate(new Date().toISOString().slice(0, 10));
      setMatchTime("");
    } catch {
      // error is set via app.error
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    if (pendingReset === "tournament") {
      await app.resetAllAction();
    } else if (pendingReset === "teams") {
      await app.resetTeamsAction();
    }
    setPendingReset(null);
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.35rem", fontWeight: 800 }}>Yönetim</h2>

      {pendingReset && (
        <div style={{
          background: "var(--color-danger, #ef4444)",
          color: "#fff",
          borderRadius: "0.75rem",
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          <span style={{ flex: 1, fontWeight: 600 }}>
            {pendingReset === "tournament"
              ? "Turnuva verisi (maçlar, gruplar, fikstür) silinecek. Takımlar korunacak. Emin misiniz?"
              : "Tüm takımlar ve turnuva verisi kalıcı olarak silinecek. Emin misiniz?"}
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="primary"
              style={{ background: "#fff", color: "#ef4444", fontWeight: 700 }}
              onClick={handleConfirmReset}
              disabled={app.drawRunning}
            >
              Evet, sil
            </button>
            <button onClick={() => setPendingReset(null)} disabled={app.drawRunning}>
              İptal
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        <TeamFormPanel
          editTeamId={app.editTeamId}
          formName={app.formName}
          formNotes={app.formNotes}
          formColor={app.formColor}
          formShortName={app.formShortName}
          formManagerName={app.formManagerName}
          formManagerPhone={app.formManagerPhone}
          formManagerEmail={app.formManagerEmail}
          onNameChange={app.setFormName}
          onNotesChange={app.setFormNotes}
          onColorChange={app.setFormColor}
          onShortNameChange={app.setFormShortName}
          onManagerNameChange={app.setFormManagerName}
          onManagerPhoneChange={app.setFormManagerPhone}
          onManagerEmailChange={app.setFormManagerEmail}
          onSubmit={app.submitTeam}
          onCancelEdit={app.cancelEdit}
          disabled={app.savingTeam || app.loadingTeams}
          saving={app.savingTeam}
        />

        <section
          className={"panel panel--accent-strip" + (saving ? " panel--busy" : "")}
          aria-labelledby="match-form-title"
        >
          <div className="panel__head">
            <h2 className="panel__title" id="match-form-title">Maç ekle</h2>
            <span className="panel__meta">{saving ? "Kaydediliyor…" : "Kayıt formu"}</span>
          </div>
          <form className="form-grid" onSubmit={handleAddMatch}>
            <label>
              1. Takım
              <select
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value === "" ? "" : Number(e.target.value))}
                required
                disabled={saving}
              >
                <option value="">Seçiniz…</option>
                {app.teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label>
              2. Takım
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value === "" ? "" : Number(e.target.value))}
                required
                disabled={saving}
              >
                <option value="">Seçiniz…</option>
                {app.teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label>
              Aşama
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as MatchStage)}
                disabled={saving}
              >
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <label>
                Tarih
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  disabled={saving}
                />
              </label>
              <label>
                Saat
                <input
                  type="time"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  disabled={saving}
                />
              </label>
            </div>
            <div className="row-actions">
              <button
                type="submit"
                className="primary"
                disabled={saving || homeTeamId === "" || awayTeamId === ""}
              >
                {saving ? (
                  <span className="btn-with-spinner">
                    <span className="spinner spinner--sm spinner--on-dark" aria-hidden />
                    Kaydediliyor
                  </span>
                ) : (
                  "Maçı ekle"
                )}
              </button>
            </div>
          </form>
        </section>
      </div>

      <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1 }}></div>
        <button
          style={{
            background: "transparent",
            border: "1.5px solid var(--color-danger, #ef4444)",
            color: "var(--color-danger, #ef4444)",
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
          disabled={app.drawRunning || !!pendingReset}
          onClick={() => setPendingReset("tournament")}
        >
          Turnuvayı Sıfırla
        </button>
        <button
          style={{
            background: "var(--color-danger, #ef4444)",
            border: "none",
            color: "#fff",
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
          disabled={app.drawRunning || !!pendingReset}
          onClick={() => setPendingReset("teams")}
        >
          Takımları Sıfırla
        </button>
      </div>
    </div>
  );
}
