import { useMemo } from "react";
import type { MatchRow } from "../../types/tournament";
import type { TournamentAppState } from "../../hooks/useTournamentApp";

type Props = { app: TournamentAppState };

function formatDateTime(date: string | null, time: string | null) {
  if (!date) return "Tarih bekleniyor";
  const d = new Date(`${date}T${time ?? "00:00"}:00`);
  if (Number.isNaN(d.getTime())) return `${date} ${time ?? ""}`.trim();
  return d.toLocaleString("tr-TR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FixturesView({ app }: Props) {
  const { matches, hasDraw, openMatch, leagueDrawCompleted } = app;

  const filtered = useMemo(() => {
    return matches.filter((m) => m.stage === "league" || m.stage === "semi" || m.stage === "final");
  }, [matches]);

  const sortedMatches = useMemo(() => {
    return [...filtered].sort((x, y) => {
      const xd = x.scheduled_date ?? "9999-12-31";
      const yd = y.scheduled_date ?? "9999-12-31";
      const xt = x.scheduled_time ?? "23:59";
      const yt = y.scheduled_time ?? "23:59";
      return (
        xd.localeCompare(yd) ||
        xt.localeCompare(yt) ||
        x.calendar_slot - y.calendar_slot ||
        x.id - y.id
      );
    });
  }, [filtered]);

  const leagueMatches = useMemo(() => sortedMatches.filter(m => m.stage === "league"), [sortedMatches]);
  const semiMatches = useMemo(() => sortedMatches.filter(m => m.stage === "semi"), [sortedMatches]);
  const finalMatches = useMemo(() => sortedMatches.filter(m => m.stage === "final"), [sortedMatches]);

  const getGlobalIndex = (matchId: number) => {
    return sortedMatches.findIndex(m => m.id === matchId) + 1;
  };

  const renderMatchRow = (m: MatchRow) => (
    <button
      key={m.id}
      type="button"
      className={`fixture-row fixture-row--${m.stage}`}
      onClick={() => openMatch(m.id)}
    >
      <span className="fixture-row__slot">#{getGlobalIndex(m.id)}</span>
      <span className="fixture-row__team fixture-row__team--left">{m.home_team_name}</span>
      <span className="fixture-row__center">
        <span className="fixture-row__date">{formatDateTime(m.scheduled_date, m.scheduled_time)}</span>
        <span className="fixture-row__score">
          {m.status === "finished" ? `${m.home_score} - ${m.away_score}` : "-"}
        </span>
      </span>
      <span className="fixture-row__team fixture-row__team--right">{m.away_team_name}</span>
    </button>
  );


  if (!hasDraw || !leagueDrawCompleted) {
    return (
      <div className="empty-state">
        <strong>Fikstür kapalı</strong>
        {!hasDraw ? "Önce lig fikstürünü üret." : "Kura bitince fikstürler ve tarihler açılacak."}
      </div>
    );
  }

  return (
    <div>
      <div className="fixture-toolbar">
        <h2 className="fixture-title">Fikstür</h2>
      </div>

      <p className="empty fixture-note">
        Tüm maçlar tarihe ve saate göre listelenir. Maç sırası (#) baştan sona otomatik hesaplanır.
      </p>

      <div className="fixture-list" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* LİG MAÇLARI */}
        {leagueMatches.length > 0 && (
          <section className="fixture-block">
            <header className="fixture-block__head">
              <div>
                <div className="fixture-block__title">Lig Aşaması</div>
                <div className="fixture-block__meta">{leagueMatches.length} maç</div>
              </div>
            </header>
            <div className="fixture-rows">
              {leagueMatches.map(renderMatchRow)}
            </div>
          </section>
        )}

        {/* YARI FİNAL */}
        {semiMatches.length > 0 && (
          <section className="fixture-block knockout-block semi-final">
            <header className="fixture-block__head" style={{ borderLeft: "4px solid var(--arena-gold)" }}>
              <div>
                <div className="fixture-block__title" style={{ color: "var(--arena-gold)" }}>🏆 Yarı Finaller</div>
                <div className="fixture-block__meta">Eleme Usulü · 2 Maç</div>
              </div>
            </header>
            <div className="fixture-rows">
              {semiMatches.map(renderMatchRow)}
            </div>
          </section>
        )}

        {/* FİNAL */}
        {finalMatches.length > 0 && (
          <section className="fixture-block knockout-block final">
            <header className="fixture-block__head" style={{ borderLeft: "4px solid #fff", background: "linear-gradient(90deg, rgba(255,255,255,0.05), transparent)" }}>
              <div>
                <div className="fixture-block__title" style={{ color: "#fff", textShadow: "0 0 15px rgba(255,255,255,0.3)" }}>👑 BÜYÜK FİNAL</div>
                <div className="fixture-block__meta">Şampiyonluk Maçı</div>
              </div>
            </header>
            <div className="fixture-rows">
              {finalMatches.map(renderMatchRow)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
