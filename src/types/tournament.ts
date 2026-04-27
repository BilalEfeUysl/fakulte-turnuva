export type GroupWithTeams = {
  id: number;
  name: string;
  sort_order: number;
  team_ids: number[];
};

export type MatchRow = {
  id: number;
  group_id: number;
  group_name: string;
  stage: "group" | "semi" | "final" | string;
  stage_slot: string;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  match_order: number;
  matchday_no: number;
  scheduled_date: string | null;
  calendar_slot: number;
  status: "scheduled" | "finished" | string;
  home_score: number;
  away_score: number;
  played_at: string | null;
};

export type StandingRow = {
  rank: number;
  team_id: number;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export type GroupStandings = {
  group_id: number;
  group_name: string;
  rows: StandingRow[];
};

export type MatchEventRow = {
  id: number;
  match_id: number;
  team_id: number;
  team_name: string;
  player_name: string;
  event_type: "goal" | "yellow" | "red" | string;
  minute: number;
};

export type TopScorerRow = {
  rank: number;
  player_name: string;
  team_id: number;
  team_name: string;
  goals: number;
  last_goal_minute: number | null;
};

export type GroupScheduleSetting = {
  group_id: number;
  group_name: string;
  daily_limit: number;
};

export type TeamSummaryRow = {
  team_id: number;
  team_name: string;
  played: number;
  goals_for: number;
  goals_against: number;
  yellow_cards: number;
  red_cards: number;
};

export type PlayerSummaryRow = {
  team_id: number;
  team_name: string;
  player_name: string;
  goals: number;
  yellow_cards: number;
  red_cards: number;
  matches: number;
};

export type AppView = "home" | "teams" | "draw" | "fixtures" | "standings" | "scorers";
