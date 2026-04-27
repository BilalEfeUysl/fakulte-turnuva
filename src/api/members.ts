import { invoke } from "@tauri-apps/api/core";
import type { TeamMember } from "../types/team";

export function listMembers(teamId: number): Promise<TeamMember[]> {
  return invoke<TeamMember[]>("list_members", { args: { teamId } });
}

export function addMember(input: {
  teamId: number;
  fullName: string;
  roleHint: string;
  jerseyNo: number | null;
  schoolNo: string;
}): Promise<TeamMember> {
  return invoke<TeamMember>("add_member", { payload: input });
}

export function deleteMember(id: number): Promise<void> {
  return invoke<void>("delete_member", { id });
}
