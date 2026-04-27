import type { TournamentAppState } from "../../hooks/useTournamentApp";

type Props = { app: TournamentAppState };

export function HomeView({ app }: Props) {
  const topScorer = app.scorers[0];
  const mostCarded = [...app.teamSummaries].sort(
    (a, b) => b.yellow_cards + b.red_cards - (a.yellow_cards + a.red_cards),
  )[0];

  return (
    <div>
      <section className="arena-hero">
        <div className="arena-hero__inner">
          <h1>Turnuva kontrol merkezi</h1>
          <p>
            Takım yönetimi, grup kuraları, maç planlama ve oyuncu performanslarını tek ekrandan takip
            edin.
          </p>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <button className="btn-arena btn-arena--gold" onClick={() => app.setView("teams")}>
              Takımları yönet
            </button>
            <button className="btn-arena" onClick={() => app.setView("fixtures")}>
              Takvim/Fikstür
            </button>
          </div>
          <div className="arena-stat-grid">
            <div className="arena-stat">
              <div className="arena-stat__v">{app.teamCount}</div>
              <div className="arena-stat__l">Takım</div>
            </div>
            <div className="arena-stat">
              <div className="arena-stat__v">{app.matches.length}</div>
              <div className="arena-stat__l">Toplam maç</div>
            </div>
            <div className="arena-stat">
              <div className="arena-stat__v">{app.finishedMatches}</div>
              <div className="arena-stat__l">Tamamlanan maç</div>
            </div>
            <div className="arena-stat">
              <div className="arena-stat__v">{topScorer ? `${topScorer.goals}` : "-"}</div>
              <div className="arena-stat__l">Gol kralı lideri</div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <div className="standings-card">
          <div className="standings-card__head">Yaklaşan maçlar</div>
          <div style={{ padding: "0.85rem 1rem" }}>
            {app.upcomingMatches.length === 0 ? (
              <p className="empty">Yaklaşan maç yok.</p>
            ) : (
              app.upcomingMatches.map((m) => (
                <button
                  key={m.id}
                  className="btn-arena"
                  style={{ width: "100%", justifyContent: "space-between", marginBottom: "0.45rem" }}
                  onClick={() => {
                    app.setView("fixtures");
                    app.openMatch(m.id);
                  }}
                >
                  <span>{m.home_team_name} - {m.away_team_name}</span>
                  <span>{m.scheduled_date ?? "Tarih yok"}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="standings-card">
          <div className="standings-card__head">Disiplin özeti</div>
          <div style={{ padding: "0.95rem 1rem" }}>
            {mostCarded ? (
              <>
                <p style={{ margin: "0 0 0.4rem", fontWeight: 700 }}>{mostCarded.team_name}</p>
                <p className="empty">
                  Sarı: {mostCarded.yellow_cards} · Kırmızı: {mostCarded.red_cards}
                </p>
              </>
            ) : (
              <p className="empty">Henüz kart verisi yok.</p>
            )}
            {topScorer ? (
              <p className="empty" style={{ marginTop: "0.9rem" }}>
                Gol lideri: <strong>{topScorer.player_name}</strong> ({topScorer.goals})
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
