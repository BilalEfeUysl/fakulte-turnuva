import { TeamFormPanel } from "../teams/TeamFormPanel";
import { TeamListPanel } from "../teams/TeamListPanel";
import { MembersPanel } from "../teams/MembersPanel";
import { PlayerDetailModal } from "../teams/PlayerDetailModal";
import type { TournamentAppState } from "../../hooks/useTournamentApp";

type Props = { app: TournamentAppState };

export function TeamsTabView({ app }: Props) {
  return (
    <div>
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.35rem", fontWeight: 800 }}>Takımlar ve kadrolar</h2>
      <p style={{ margin: "0 0 1.25rem", color: "var(--arena-muted)", maxWidth: "54ch" }}>
        En fazla 10 takım. Turnuva başladıysa takım silmek maç özetlerini etkileyebilir; mümkünse önce
        kurayı sıfırlamadan takım silmeyin.
      </p>
      <div className="teams-tab-grid">
        <TeamFormPanel
          editTeamId={app.editTeamId}
          formName={app.formName}
          formNotes={app.formNotes}
          formColor={app.formColor}
          formShortName={app.formShortName}
          onNameChange={app.setFormName}
          onNotesChange={app.setFormNotes}
          onColorChange={app.setFormColor}
          onShortNameChange={app.setFormShortName}
          onSubmit={app.submitTeam}
          onCancelEdit={app.cancelEdit}
          disabled={app.savingTeam || app.loadingTeams}
          saving={app.savingTeam}
        />
        <TeamListPanel
          teams={app.teams}
          selectedId={app.selectedId}
          onSelect={app.selectTeam}
          summaries={app.summaryByTeamId}
          loading={app.loadingTeams}
          disabled={app.savingTeam}
        />
        <MembersPanel
          selected={app.selected}
          selectedId={app.selectedId}
          members={app.members}
          memberName={app.memberName}
          memberRole={app.memberRole}
          memberJerseyNo={app.memberJerseyNo}
          memberSchoolNo={app.memberSchoolNo}
          onMemberNameChange={app.setMemberName}
          onMemberRoleChange={app.setMemberRole}
          onMemberJerseyNoChange={app.setMemberJerseyNo}
          onMemberSchoolNoChange={app.setMemberSchoolNo}
          onSubmitMember={app.submitMember}
          onEditTeam={app.startEditTeam}
          onRequestDeleteTeam={app.askDeleteTeam}
          onRequestDeleteMember={app.askDeleteMember}
          onOpenPlayerDetail={app.loadPlayerDetail}
          playerStats={app.teamPlayersSummary}
          membersLoading={app.loadingMembers}
          savingMember={app.savingMember}
          formDisabled={app.savingMember || app.loadingMembers}
        />
      </div>
      <PlayerDetailModal summary={app.selectedPlayerSummary} onClose={app.closePlayerDetail} />
    </div>
  );
}
