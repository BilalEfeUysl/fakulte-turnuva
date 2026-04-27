import { invoke } from "@tauri-apps/api/core";
import type { PlayerSummaryRow, TeamSummaryRow } from "../types/tournament";

export function getTeamSummaries(): Promise<TeamSummaryRow[]> {
  return invoke<TeamSummaryRow[]>("get_team_summaries");
}

export function getTeamPlayersSummary(teamId: number): Promise<PlayerSummaryRow[]> {
  return invoke<PlayerSummaryRow[]>("get_team_players_summary", { args: { teamId } });
}

export function getPlayerSummary(teamId: number, playerName: string): Promise<PlayerSummaryRow> {
  return invoke<PlayerSummaryRow>("get_player_summary", {
    args: { teamId, playerName },
  });
}
