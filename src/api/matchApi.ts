import { invoke } from "@tauri-apps/api/core";
import type { MatchEventRow, MatchRow } from "../types/tournament";

export function listMatches(): Promise<MatchRow[]> {
  return invoke<MatchRow[]>("list_matches");
}

export function updateMatch(input: {
  id: number;
  homeScore: number;
  awayScore: number;
  status: string;
}): Promise<void> {
  return invoke<void>("update_match", { payload: input });
}

export function updateMatchSchedule(input: {
  id: number;
  matchdayNo: number;
  scheduledDate: string | null;
  scheduledTime?: string | null;
  calendarSlot: number;
}): Promise<void> {
  return invoke<void>("update_match_schedule", { payload: input });
}

export function addMatchEvent(input: {
  matchId: number;
  teamId: number;
  playerName: string;
  eventType: string;
  minute: number;
}): Promise<MatchEventRow> {
  return invoke<MatchEventRow>("add_match_event", { payload: input });
}

export function listMatchEvents(matchId: number): Promise<MatchEventRow[]> {
  return invoke<MatchEventRow[]>("list_match_events", { matchId });
}

export function deleteMatchEvent(id: number): Promise<void> {
  return invoke<void>("delete_match_event", { payload: { id } });
}

export function resetMatch(matchId: number): Promise<void> {
  return invoke<void>("reset_match", { matchId });
}

export function deleteMatch(matchId: number): Promise<void> {
  return invoke<void>("delete_match", { matchId });
}

export function addMatch(input: {
  homeTeamId: number;
  awayTeamId: number;
  stage: string;
  matchDate: string | null;
  matchTime: string | null;
}): Promise<MatchRow> {
  return invoke<MatchRow>("add_match", { payload: input });
}
