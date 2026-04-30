use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct Team {
    pub id: i64,
    pub name: String,
    pub faculty_name: String,
    pub notes: String,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct TeamMember {
    pub id: i64,
    pub team_id: i64,
    pub full_name: String,
    pub role_hint: String,
    pub jersey_no: Option<i64>,
    pub school_no: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTeamPayload {
    pub name: String,
    pub faculty_name: String,
    #[serde(default)]
    pub notes: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTeamPayload {
    pub id: i64,
    pub name: String,
    pub faculty_name: String,
    #[serde(default)]
    pub notes: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddMemberPayload {
    pub team_id: i64,
    pub full_name: String,
    #[serde(default)]
    pub role_hint: String,
    #[serde(default)]
    pub jersey_no: Option<i64>,
    #[serde(default)]
    pub school_no: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListMembersArgs {
    pub team_id: i64,
}

#[derive(Debug, Serialize)]
pub struct GroupWithTeams {
    pub id: i64,
    pub name: String,
    pub sort_order: i64,
    pub team_ids: Vec<i64>,
}

#[derive(Debug, Serialize)]
pub struct MatchRow {
    pub id: i64,
    pub group_id: i64,
    pub group_name: String,
    pub stage: String,
    pub stage_slot: String,
    pub home_team_id: i64,
    pub away_team_id: i64,
    pub home_team_name: String,
    pub away_team_name: String,
    pub match_order: i64,
    pub matchday_no: i64,
    pub scheduled_date: Option<String>,
    pub scheduled_time: Option<String>,
    pub calendar_slot: i64,
    pub status: String,
    pub home_score: i64,
    pub away_score: i64,
    pub played_at: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct StandingRow {
    pub rank: i64,
    pub team_id: i64,
    pub team_name: String,
    pub played: i64,
    pub won: i64,
    pub drawn: i64,
    pub lost: i64,
    pub gf: i64,
    pub ga: i64,
    pub gd: i64,
    pub points: i64,
}

#[derive(Debug, Serialize)]
pub struct GroupStandings {
    pub group_id: i64,
    pub group_name: String,
    pub rows: Vec<StandingRow>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMatchPayload {
    pub id: i64,
    pub home_score: i64,
    pub away_score: i64,
    pub status: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMatchSchedulePayload {
    pub id: i64,
    pub matchday_no: i64,
    pub scheduled_date: Option<String>,
    pub scheduled_time: Option<String>,
    pub calendar_slot: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddMatchEventPayload {
    pub match_id: i64,
    pub team_id: i64,
    pub player_name: String,
    pub event_type: String,
    #[serde(default)]
    pub minute: i64,
}

#[derive(Debug, Serialize)]
pub struct MatchEventRow {
    pub id: i64,
    pub match_id: i64,
    pub team_id: i64,
    pub team_name: String,
    pub player_name: String,
    pub event_type: String,
    pub minute: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteEventPayload {
    pub id: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveTeamGroupPayload {
    pub team_id: i64,
    pub target_group: String,
}

#[derive(Debug, Serialize)]
pub struct TopScorerRow {
    pub rank: i64,
    pub player_name: String,
    pub team_id: i64,
    pub team_name: String,
    pub goals: i64,
    pub last_goal_minute: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct GroupScheduleSetting {
    pub group_id: i64,
    pub group_name: String,
    pub daily_limit: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateGroupDailyLimitPayload {
    pub group_id: i64,
    pub daily_limit: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoSchedulePayload {
    pub start_date: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunLeagueDrawPayload {
    pub weeks_count: i64,
}

#[derive(Debug, Serialize)]
pub struct TeamSummaryRow {
    pub team_id: i64,
    pub team_name: String,
    pub played: i64,
    pub goals_for: i64,
    pub goals_against: i64,
    pub yellow_cards: i64,
    pub red_cards: i64,
}

#[derive(Debug, Serialize)]
pub struct PlayerSummaryRow {
    pub team_id: i64,
    pub team_name: String,
    pub player_name: String,
    pub goals: i64,
    pub yellow_cards: i64,
    pub red_cards: i64,
    pub matches: i64,
}
