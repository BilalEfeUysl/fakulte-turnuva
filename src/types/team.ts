/** Tauri JSON alanları camelCase (Rust tarafında serde). */

export type Team = {
  id: number;
  name: string;
  faculty_name: string;
  notes: string;
  color: string;
  short_name: string;
  manager_name: string | null;
  manager_phone: string | null;
  manager_email: string | null;
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
