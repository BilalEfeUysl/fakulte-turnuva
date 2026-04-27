import { invoke } from "@tauri-apps/api/core";
import type { Team } from "../types/team";

export function listTeams(): Promise<Team[]> {
  return invoke<Team[]>("list_teams");
}

export function createTeam(input: {
  name: string;
  facultyName: string;
  notes: string;
}): Promise<Team> {
  return invoke<Team>("create_team", { payload: input });
}

export function updateTeam(input: {
  id: number;
  name: string;
  facultyName: string;
  notes: string;
}): Promise<void> {
  return invoke<void>("update_team", { payload: input });
}

export function deleteTeam(id: number): Promise<void> {
  return invoke<void>("delete_team", { id });
}
