/** Tauri JSON alanları camelCase (Rust tarafında serde). */

export type Team = {
  id: number;
  name: string;
  faculty_name: string;
  notes: string;
  created_at: string;
};

export type TeamMember = {
  id: number;
  team_id: number;
  full_name: string;
  role_hint: string;
  jersey_no: number | null;
  school_no: string;
  created_at: string;
};
