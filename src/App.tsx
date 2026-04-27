import { useTournamentApp } from "./hooks/useTournamentApp";
import { ArenaShell } from "./components/shell/ArenaShell";
import { ErrorBanner } from "./components/layout/ErrorBanner";
import { Toast } from "./components/ui/Toast";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { MatchSheet } from "./components/match/MatchSheet";
import { TeamsTabView } from "./components/views/TeamsTabView";
import { HomeView } from "./components/views/HomeView";
import { DrawView } from "./components/views/DrawView";
import { FixturesView } from "./components/views/FixturesView";
import { StandingsView } from "./components/views/StandingsView";
import { ScorersView } from "./components/views/ScorersView";

export default function App() {
  const app = useTournamentApp();

  return (
    <div className="arena">
      <ArenaShell view={app.view} onView={app.setView} />
      <main className="arena-main">
        <ErrorBanner message={app.error} />
        <Toast message={app.successMessage} />
        {app.view === "home" ? <HomeView app={app} /> : null}
        {app.view === "teams" ? <TeamsTabView app={app} /> : null}
        {app.view === "draw" ? <DrawView app={app} /> : null}
        {app.view === "fixtures" ? <FixturesView app={app} /> : null}
        {app.view === "standings" ? <StandingsView app={app} /> : null}
        {app.view === "scorers" ? <ScorersView app={app} /> : null}
      </main>

      <ConfirmDialog
        open={app.teamPendingDelete != null}
        title="Takımı sil"
        description={
          app.teamPendingDelete
            ? `“${app.teamPendingDelete.name}” ve kadrosu silinsin mi? Turnuvada maçı varsa işlem veritabanı kuralına takılabilir.`
            : ""
        }
        confirmLabel="Sil"
        variant="danger"
        busy={app.deletingTeam}
        onConfirm={() => void app.confirmDeleteTeam()}
        onCancel={app.cancelDeleteTeam}
      />
      <ConfirmDialog
        open={app.memberPendingDelete != null}
        title="Oyuncuyu çıkar"
        description={
          app.memberPendingDelete ? `“${app.memberPendingDelete.name}” kadrodan çıkarılsın mı?` : ""
        }
        confirmLabel="Çıkar"
        variant="danger"
        busy={app.deletingMember}
        onConfirm={() => void app.confirmDeleteMember()}
        onCancel={app.cancelDeleteMember}
      />

      {app.matchSheetId != null ? <MatchSheet app={app} /> : null}
    </div>
  );
}
