import { invoke } from "@tauri-apps/api/core";
import type {
  GroupScheduleSetting,
  GroupStandings,
  GroupWithTeams,
  TopScorerRow,
} from "../types/tournament";

export function runDraw(): Promise<GroupWithTeams[]> {
  return invoke<GroupWithTeams[]>("run_draw");
}

export function runLeagueDraw(input: { weeksCount: number }): Promise<GroupWithTeams[]> {
  return invoke<GroupWithTeams[]>("run_league_draw", { payload: { weeksCount: input.weeksCount } });
}

export function getGroups(): Promise<GroupWithTeams[]> {
  return invoke<GroupWithTeams[]>("get_groups");
}

export function moveTeamGroup(input: { teamId: number; targetGroup: "A" | "B" }): Promise<GroupWithTeams[]> {
  return invoke<GroupWithTeams[]>("move_team_group", { payload: input });
}

export function regenerateGroupFixtures(): Promise<GroupWithTeams[]> {
  return invoke<GroupWithTeams[]>("regenerate_group_fixtures");
}

export function getStandings(): Promise<GroupStandings[]> {
  return invoke<GroupStandings[]>("get_standings");
}

export function getTopScorers(): Promise<TopScorerRow[]> {
  return invoke<TopScorerRow[]>("get_top_scorers");
}

export function getGroupScheduleSettings(): Promise<GroupScheduleSetting[]> {
  return invoke<GroupScheduleSetting[]>("get_group_schedule_settings");
}

export function updateGroupDailyLimit(input: {
  groupId: number;
  dailyLimit: number;
}): Promise<GroupScheduleSetting[]> {
  return invoke<GroupScheduleSetting[]>("update_group_daily_limit", { payload: input });
}

export function autoScheduleGroupMatches(startDate: string): Promise<void> {
  return invoke<void>("auto_schedule_group_matches", { payload: { startDate } });
}

export function resetAll(): Promise<void> {
  return invoke<void>("reset_all");
}

export function resetTeams(): Promise<void> {
  return invoke<void>("reset_teams");
}

export function generateGenelKnockouts(): Promise<void> {
  return invoke<void>("generate_genel_knockouts");
}
