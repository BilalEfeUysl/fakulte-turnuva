import { useCallback, useEffect, useMemo, useState } from "react";
import * as matchApi from "../api/matchApi";
import * as membersApi from "../api/members";
import * as statsApi from "../api/stats";
import * as teamsApi from "../api/teams";
import * as tournamentApi from "../api/tournament";
import type { Team, TeamMember } from "../types/team";
import type {
  AppView,
  GroupScheduleSetting,
  GroupStandings,
  GroupWithTeams,
  MatchEventRow,
  MatchRow,
  PlayerSummaryRow,
  TeamSummaryRow,
  TopScorerRow,
} from "../types/tournament";

type PendingTeamDelete = { id: number; name: string };
type PendingMemberDelete = { id: number; name: string };

export function useTournamentApp() {
  const [view, setView] = useState<AppView>("home");
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<GroupWithTeams[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [standings, setStandings] = useState<GroupStandings[]>([]);
  const [scorers, setScorers] = useState<TopScorerRow[]>([]);
  const [teamSummaries, setTeamSummaries] = useState<TeamSummaryRow[]>([]);
  const [groupSettings, setGroupSettings] = useState<GroupScheduleSetting[]>([]);
  const [selectedPlayerSummary, setSelectedPlayerSummary] = useState<PlayerSummaryRow | null>(null);
  const [teamPlayersSummary, setTeamPlayersSummary] = useState<PlayerSummaryRow[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [deletingMember, setDeletingMember] = useState(false);
  const [drawRunning, setDrawRunning] = useState(false);
  const [planningSchedule, setPlanningSchedule] = useState(false);

  const [teamPendingDelete, setTeamPendingDelete] = useState<PendingTeamDelete | null>(null);
  const [memberPendingDelete, setMemberPendingDelete] = useState<PendingMemberDelete | null>(null);

  const [formName, setFormName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formColor, setFormColor] = useState("#14b8a6");
  const [formShortName, setFormShortName] = useState("");
  const [editTeamId, setEditTeamId] = useState<number | null>(null);

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberJerseyNo, setMemberJerseyNo] = useState("");
  const [memberSchoolNo, setMemberSchoolNo] = useState("");

  const [matchSheetId, setMatchSheetId] = useState<number | null>(null);
  const [matchEvents, setMatchEvents] = useState<MatchEventRow[]>([]);
  const [loadingMatchEvents, setLoadingMatchEvents] = useState(false);
  const [savingMatch, setSavingMatch] = useState(false);

  useEffect(() => {
    if (!successMessage) return;
    const t = window.setTimeout(() => setSuccessMessage(null), 3200);
    return () => window.clearTimeout(t);
  }, [successMessage]);

  const loadMembers = useCallback(async (teamId: number) => {
    setLoadingMembers(true);
    try {
      const [list, playerStats] = await Promise.all([
        membersApi.listMembers(teamId),
        statsApi.getTeamPlayersSummary(teamId),
      ]);
      setMembers(list);
      setTeamPlayersSummary(playerStats);
    } catch (e) {
      setError(String(e));
      setMembers([]);
      setTeamPlayersSummary([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setError(null);
    setLoadingTeams(true);
    setLoadingStandings(true);
    try {
      const [t, g, m, top, teamStats, settings] = await Promise.all([
        teamsApi.listTeams(),
        tournamentApi.getGroups(),
        matchApi.listMatches(),
        tournamentApi.getTopScorers(),
        statsApi.getTeamSummaries(),
        tournamentApi.getGroupScheduleSettings(),
      ]);
      setTeams(t);
      setGroups(g);
      setMatches(m);
      setScorers(top);
      setTeamSummaries(teamStats);
      setGroupSettings(settings);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingTeams(false);
    }
    try {
      const s = await tournamentApi.getStandings();
      setStandings(s);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingStandings(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (selectedId != null && !teams.some((t) => t.id === selectedId)) {
      setSelectedId(null);
      setMembers([]);
      setTeamPlayersSummary([]);
    }
  }, [teams, selectedId]);

  useEffect(() => {
    if (selectedId != null) void loadMembers(selectedId);
    else {
      setMembers([]);
      setTeamPlayersSummary([]);
    }
  }, [selectedId, loadMembers]);

  useEffect(() => {
    if (matchSheetId == null) {
      setMatchEvents([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingMatchEvents(true);
      try {
        const ev = await matchApi.listMatchEvents(matchSheetId);
        if (!cancelled) setMatchEvents(ev);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoadingMatchEvents(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matchSheetId]);

  const selected = teams.find((t) => t.id === selectedId) ?? null;
  const selectedMatch = matches.find((m) => m.id === matchSheetId) ?? null;

  const startEditTeam = useCallback((t: Team) => {
    setEditTeamId(t.id);
    setFormName(t.name);
    setFormNotes(t.notes);
    setFormColor(t.color || "#14b8a6");
    setFormShortName(t.short_name || "");
    setView("management");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditTeamId(null);
    setFormName("");
    setFormNotes("");
    setFormColor("#14b8a6");
    setFormShortName("");
  }, []);


  const submitTeam = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const name = formName.trim();
      if (!name) {
        setError("Takım adı zorunludur.");
        return;
      }
      const notes = formNotes.trim();
      const color = formColor.trim() || "#14b8a6";
      const shortName = formShortName.trim();
      setSavingTeam(true);
      try {
        if (editTeamId != null) {
          await teamsApi.updateTeam({ id: editTeamId, name, facultyName: name, notes, color, shortName });
          setSuccessMessage("Takım güncellendi.");
        } else {
          await teamsApi.createTeam({ name, facultyName: name, notes, color, shortName });
          setSuccessMessage("Takım oluşturuldu.");
        }
        cancelEdit();
        await loadAll();
      } catch (err) {
        setError(String(err));
      } finally {
        setSavingTeam(false);
      }
    },
    [cancelEdit, editTeamId, formName, formNotes, formColor, formShortName, loadAll],
  );

  const askDeleteTeam = useCallback((team: Team) => {
    setTeamPendingDelete({ id: team.id, name: team.name });
  }, []);
  const cancelDeleteTeam = useCallback(() => {
    if (!deletingTeam) setTeamPendingDelete(null);
  }, [deletingTeam]);

  const confirmDeleteTeam = useCallback(async () => {
    if (teamPendingDelete == null) return;
    const { id } = teamPendingDelete;
    setError(null);
    setDeletingTeam(true);
    try {
      await teamsApi.deleteTeam(id);
      if (selectedId === id) {
        setSelectedId(null);
      }
      setTeamPendingDelete(null);
      setSuccessMessage("Takım ve kadrosu silindi.");
      await loadAll();
    } catch (e) {
      setError(String(e));
    } finally {
      setDeletingTeam(false);
    }
  }, [loadAll, selectedId, teamPendingDelete]);

  const submitMember = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedId == null) return;
      const full = memberName.trim();
      if (!full) {
        setError("Oyuncu adı zorunludur.");
        return;
      }
      const jerseyNo = memberJerseyNo.trim() ? Number(memberJerseyNo) : null;
      if (jerseyNo != null && (!Number.isInteger(jerseyNo) || jerseyNo < 1 || jerseyNo > 99)) {
        setError("Forma no 1-99 arası tam sayı olmalı.");
        return;
      }
      setError(null);
      setSavingMember(true);
      try {
        await membersApi.addMember({
          teamId: selectedId,
          fullName: full,
          roleHint: memberRole.trim(),
          jerseyNo,
          schoolNo: memberSchoolNo.trim(),
        });
        setMemberName("");
        setMemberRole("");
        setMemberJerseyNo("");
        setMemberSchoolNo("");
        setSuccessMessage("Oyuncu kadroya eklendi.");
        await loadMembers(selectedId);
        await loadAll();
      } catch (err) {
        setError(String(err));
      } finally {
        setSavingMember(false);
      }
    },
    [loadAll, loadMembers, memberJerseyNo, memberName, memberRole, memberSchoolNo, selectedId],
  );

  const askDeleteMember = useCallback((m: TeamMember) => {
    setMemberPendingDelete({ id: m.id, name: m.full_name });
  }, []);
  const cancelDeleteMember = useCallback(() => {
    if (!deletingMember) setMemberPendingDelete(null);
  }, [deletingMember]);

  const confirmDeleteMember = useCallback(async () => {
    if (memberPendingDelete == null || selectedId == null) return;
    setError(null);
    setDeletingMember(true);
    try {
      await membersApi.deleteMember(memberPendingDelete.id);
      setMemberPendingDelete(null);
      setSuccessMessage("Oyuncu listeden çıkarıldı.");
      await loadMembers(selectedId);
      await loadAll();
    } catch (e) {
      setError(String(e));
    } finally {
      setDeletingMember(false);
    }
  }, [loadAll, loadMembers, memberPendingDelete, selectedId]);

  const selectTeam = useCallback(
    (id: number) => {
      setSelectedId(id);
      cancelEdit();
    },
    [cancelEdit],
  );

  const loadPlayerDetail = useCallback(async (teamId: number, playerName: string) => {
    setError(null);
    try {
      const summary = await statsApi.getPlayerSummary(teamId, playerName);
      setSelectedPlayerSummary(summary);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const closePlayerDetail = useCallback(() => {
    setSelectedPlayerSummary(null);
  }, []);

  const resetAllAction = useCallback(async () => {
    setError(null);
    setDrawRunning(true);
    try {
      await tournamentApi.resetAll();
      setMatchSheetId(null);
      await loadAll();
      setSuccessMessage("Turnuva sıfırlandı. Takımlar korundu.");
    } catch (e) {
      setError(String(e));
    } finally {
      setDrawRunning(false);
    }
  }, [loadAll]);

  const resetTeamsAction = useCallback(async () => {
    setError(null);
    setDrawRunning(true);
    try {
      await tournamentApi.resetTeams();
      setMatchSheetId(null);
      setSelectedId(null);
      await loadAll();
      setSuccessMessage("Tüm takımlar ve turnuva verisi silindi.");
    } catch (e) {
      setError(String(e));
    } finally {
      setDrawRunning(false);
    }
  }, [loadAll]);

  const updateMatchSchedule = useCallback(
    async (input: {
      id: number;
      matchdayNo: number;
      scheduledDate: string | null;
      scheduledTime?: string | null;
      calendarSlot: number;
    }) => {
      setPlanningSchedule(true);
      setError(null);
      try {
        await matchApi.updateMatchSchedule(input);
        setMatches(await matchApi.listMatches());
        setSuccessMessage("Tarih ve saat başarıyla güncellendi!");
      } catch (e) {
        setError(String(e));
      } finally {
        setPlanningSchedule(false);
      }
    },
    [],
  );

  const openMatch = useCallback((id: number) => {
    setMatchSheetId(id);
  }, []);
  const closeMatch = useCallback(() => setMatchSheetId(null), []);

  const saveMatchScores = useCallback(
    async (input: { homeScore: number; awayScore: number; status: string }) => {
      if (matchSheetId == null) return;
      setError(null);
      setSavingMatch(true);
      try {
        await matchApi.updateMatch({
          id: matchSheetId,
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          status: input.status,
        });
        setSuccessMessage(input.status === "finished" ? "Maç tamamlandı." : "Maç güncellendi.");
        await loadAll();
      } catch (e) {
        setError(String(e));
      } finally {
        setSavingMatch(false);
      }
    },
    [loadAll, matchSheetId],
  );

  const addEvent = useCallback(
    async (input: { teamId: number; playerName: string; eventType: string; minute: number }) => {
      if (matchSheetId == null) return;
      setError(null);
      try {
        await matchApi.addMatchEvent({
          matchId: matchSheetId,
          teamId: input.teamId,
          playerName: input.playerName,
          eventType: input.eventType,
          minute: input.minute,
        });
        setMatchEvents(await matchApi.listMatchEvents(matchSheetId));
        await loadAll();
      } catch (e) {
        setError(String(e));
      }
    },
    [loadAll, matchSheetId],
  );

  const resetMatchAction = useCallback(async () => {
    if (matchSheetId == null) return;
    setError(null);
    setSavingMatch(true);
    try {
      await matchApi.resetMatch(matchSheetId);
      setSuccessMessage("Maç başarıyla sıfırlandı.");
      setMatchEvents([]);
      await loadAll();
    } catch (e) {
      setError(String(e));
    } finally {
      setSavingMatch(false);
    }
  }, [loadAll, matchSheetId]);

  const deleteMatchAction = useCallback(async () => {
    if (matchSheetId == null) return;
    setError(null);
    setSavingMatch(true);
    try {
      await matchApi.deleteMatch(matchSheetId);
      setSuccessMessage("Maç başarıyla silindi.");
      setMatchSheetId(null);
      await loadAll();
    } catch (e) {
      setError(String(e));
    } finally {
      setSavingMatch(false);
    }
  }, [loadAll, matchSheetId]);

  const addMatchAction = useCallback(
    async (input: {
      homeTeamId: number;
      awayTeamId: number;
      stage: string;
      matchDate: string | null;
      matchTime: string | null;
    }) => {
      setError(null);
      try {
        await matchApi.addMatch(input);
        setSuccessMessage("Maç eklendi.");
        await loadAll();
      } catch (e) {
        setError(String(e));
        throw e;
      }
    },
    [loadAll],
  );

  const removeEvent = useCallback(
    async (id: number) => {
      setError(null);
      try {
        await matchApi.deleteMatchEvent(id);
        if (matchSheetId != null) {
          setMatchEvents(await matchApi.listMatchEvents(matchSheetId));
        }
        await loadAll();
      } catch (e) {
        setError(String(e));
      }
    },
    [loadAll, matchSheetId],
  );

  const generateGenelKnockoutsAction = useCallback(async () => {
    setError(null);
    try {
      await tournamentApi.generateGenelKnockouts();
      setSuccessMessage("Sonraki aşama maçları oluşturuldu.");
      await loadAll();
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, [loadAll]);

  const teamCount = teams.length;
  const finishedMatches = matches.filter((m) => m.status === "finished").length;
  const upcomingMatches = matches
    .filter((m) => m.status !== "finished")
    .slice(0, 6);

  const summaryByTeamId = useMemo(
    () => Object.fromEntries(teamSummaries.map((s) => [s.team_id, s])),
    [teamSummaries],
  );

  return {
    view,
    setView,
    teams,
    groups,
    matches,
    standings,
    scorers,
    teamSummaries,
    groupSettings,
    summaryByTeamId,
    upcomingMatches,
    selectedId,
    members,
    selected,
    teamPlayersSummary,
    selectedPlayerSummary,
    loadPlayerDetail,
    closePlayerDetail,
    error,
    successMessage,
    loadingTeams,
    loadingStandings,
    loadingMembers,
    savingTeam,
    savingMember,
    deletingTeam,
    deletingMember,
    drawRunning,
    planningSchedule,
    teamPendingDelete,
    memberPendingDelete,
    formName,
    setFormName,
    formNotes,
    setFormNotes,
    formColor,
    setFormColor,
    formShortName,
    setFormShortName,
    editTeamId,
    memberName,
    setMemberName,
    memberRole,
    setMemberRole,
    memberJerseyNo,
    setMemberJerseyNo,
    memberSchoolNo,
    setMemberSchoolNo,
    startEditTeam,
    cancelEdit,
    submitTeam,
    selectTeam,
    submitMember,
    askDeleteTeam,
    cancelDeleteTeam,
    confirmDeleteTeam,
    askDeleteMember,
    cancelDeleteMember,
    confirmDeleteMember,
    resetAllAction,
    resetTeamsAction,
    updateMatchSchedule,
    finishedMatches,
    teamCount,
    matchSheetId,
    selectedMatch,
    openMatch,
    closeMatch,
    matchEvents,
    loadingMatchEvents,
    savingMatch,
    saveMatchScores,
    resetMatchAction,
    deleteMatchAction,
    addEvent,
    removeEvent,
    loadAll,
    addMatchAction,
    generateGenelKnockoutsAction,
  };
}

export type TournamentAppState = ReturnType<typeof useTournamentApp>;
