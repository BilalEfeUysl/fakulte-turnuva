use crate::db::DbConn;
use rusqlite::params;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct TeamRow {
    pub id: i64,
    pub name: String,
    pub faculty_name: String,
    pub notes: String,
    pub color: String,
    pub short_name: String,
    pub manager_name: Option<String>,
    pub manager_phone: Option<String>,
    pub manager_email: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct TeamMemberRow {
    pub id: i64,
    pub team_id: i64,
    pub full_name: String,
    pub role_hint: String,
    pub jersey_no: Option<i64>,
    pub school_no: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct GroupRow {
    pub id: i64,
    pub name: String,
    pub sort_order: i64,
}

#[derive(Serialize, Deserialize)]
pub struct GroupTeamRow {
    pub group_id: i64,
    pub team_id: i64,
}

#[derive(Serialize, Deserialize)]
pub struct MatchRow {
    pub id: i64,
    pub group_id: i64,
    pub home_team_id: i64,
    pub away_team_id: i64,
    pub stage: String,
    pub stage_slot: String,
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

#[derive(Serialize, Deserialize)]
pub struct GroupScheduleSettingRow {
    pub group_id: i64,
    pub daily_limit: i64,
}

#[derive(Serialize, Deserialize)]
pub struct MatchEventRow {
    pub id: i64,
    pub match_id: i64,
    pub team_id: i64,
    pub player_name: String,
    pub event_type: String,
    pub minute: i64,
}

#[derive(Serialize, Deserialize)]
pub struct BackupBundle {
    pub version: u32,
    pub exported_at: String,
    pub teams: Vec<TeamRow>,
    pub team_members: Vec<TeamMemberRow>,
    pub groups: Vec<GroupRow>,
    pub group_teams: Vec<GroupTeamRow>,
    pub matches: Vec<MatchRow>,
    pub group_schedule_settings: Vec<GroupScheduleSettingRow>,
    pub match_events: Vec<MatchEventRow>,
}

fn query_teams(conn: &rusqlite::Connection) -> Result<Vec<TeamRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, faculty_name, notes, color, short_name,
                    manager_name, manager_phone, manager_email, created_at
             FROM teams ORDER BY id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| {
            Ok(TeamRow {
                id: r.get(0)?,
                name: r.get(1)?,
                faculty_name: r.get(2)?,
                notes: r.get(3)?,
                color: r.get(4)?,
                short_name: r.get(5)?,
                manager_name: r.get(6)?,
                manager_phone: r.get(7)?,
                manager_email: r.get(8)?,
                created_at: r.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

fn query_team_members(conn: &rusqlite::Connection) -> Result<Vec<TeamMemberRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, team_id, full_name, role_hint, jersey_no, school_no, created_at
             FROM team_members ORDER BY id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| {
            Ok(TeamMemberRow {
                id: r.get(0)?,
                team_id: r.get(1)?,
                full_name: r.get(2)?,
                role_hint: r.get(3)?,
                jersey_no: r.get(4)?,
                school_no: r.get(5)?,
                created_at: r.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

fn query_groups(conn: &rusqlite::Connection) -> Result<Vec<GroupRow>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, sort_order FROM groups ORDER BY id")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| {
            Ok(GroupRow {
                id: r.get(0)?,
                name: r.get(1)?,
                sort_order: r.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

fn query_group_teams(conn: &rusqlite::Connection) -> Result<Vec<GroupTeamRow>, String> {
    let mut stmt = conn
        .prepare("SELECT group_id, team_id FROM group_teams ORDER BY group_id, team_id")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| {
            Ok(GroupTeamRow {
                group_id: r.get(0)?,
                team_id: r.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

fn query_matches(conn: &rusqlite::Connection) -> Result<Vec<MatchRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, group_id, home_team_id, away_team_id, stage, stage_slot,
                    match_order, matchday_no, scheduled_date, scheduled_time,
                    calendar_slot, status, home_score, away_score, played_at
             FROM matches ORDER BY id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| {
            Ok(MatchRow {
                id: r.get(0)?,
                group_id: r.get(1)?,
                home_team_id: r.get(2)?,
                away_team_id: r.get(3)?,
                stage: r.get(4)?,
                stage_slot: r.get(5)?,
                match_order: r.get(6)?,
                matchday_no: r.get(7)?,
                scheduled_date: r.get(8)?,
                scheduled_time: r.get(9)?,
                calendar_slot: r.get(10)?,
                status: r.get(11)?,
                home_score: r.get(12)?,
                away_score: r.get(13)?,
                played_at: r.get(14)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

fn query_group_schedule_settings(conn: &rusqlite::Connection) -> Result<Vec<GroupScheduleSettingRow>, String> {
    let mut stmt = conn
        .prepare("SELECT group_id, daily_limit FROM group_schedule_settings ORDER BY group_id")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| {
            Ok(GroupScheduleSettingRow {
                group_id: r.get(0)?,
                daily_limit: r.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

fn query_match_events(conn: &rusqlite::Connection) -> Result<Vec<MatchEventRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, match_id, team_id, player_name, event_type, minute
             FROM match_events ORDER BY id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| {
            Ok(MatchEventRow {
                id: r.get(0)?,
                match_id: r.get(1)?,
                team_id: r.get(2)?,
                player_name: r.get(3)?,
                event_type: r.get(4)?,
                minute: r.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

#[tauri::command]
pub fn export_data(db: tauri::State<DbConn>) -> Result<BackupBundle, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let teams = query_teams(&conn)?;
    let team_members = query_team_members(&conn)?;
    let groups = query_groups(&conn)?;
    let group_teams = query_group_teams(&conn)?;
    let matches = query_matches(&conn)?;
    let group_schedule_settings = query_group_schedule_settings(&conn)?;
    let match_events = query_match_events(&conn)?;

    let exported_at: String = conn
        .query_row("SELECT datetime('now')", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    Ok(BackupBundle {
        version: 1,
        exported_at,
        teams,
        team_members,
        groups,
        group_teams,
        matches,
        group_schedule_settings,
        match_events,
    })
}

#[tauri::command]
pub fn import_data(db: tauri::State<DbConn>, payload: BackupBundle) -> Result<(), String> {
    if payload.version != 1 {
        return Err("Desteklenmeyen yedek sürümü.".to_string());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute_batch(
        "BEGIN;
         DELETE FROM match_events;
         DELETE FROM matches;
         DELETE FROM group_schedule_settings;
         DELETE FROM group_teams;
         DELETE FROM groups;
         DELETE FROM team_members;
         DELETE FROM teams;
         DELETE FROM sqlite_sequence
           WHERE name IN ('teams','team_members','groups','matches','match_events');",
    )
    .map_err(|e| e.to_string())?;

    let result = (|| -> Result<(), String> {
        for t in &payload.teams {
            conn.execute(
                "INSERT INTO teams (id, name, faculty_name, notes, color, short_name,
                    manager_name, manager_phone, manager_email, created_at)
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
                params![
                    t.id, t.name, t.faculty_name, t.notes, t.color, t.short_name,
                    t.manager_name, t.manager_phone, t.manager_email, t.created_at
                ],
            )
            .map_err(|e| e.to_string())?;
        }
        for m in &payload.team_members {
            conn.execute(
                "INSERT INTO team_members (id, team_id, full_name, role_hint, jersey_no, school_no, created_at)
                 VALUES (?1,?2,?3,?4,?5,?6,?7)",
                params![m.id, m.team_id, m.full_name, m.role_hint, m.jersey_no, m.school_no, m.created_at],
            )
            .map_err(|e| e.to_string())?;
        }
        for g in &payload.groups {
            conn.execute(
                "INSERT INTO groups (id, name, sort_order) VALUES (?1,?2,?3)",
                params![g.id, g.name, g.sort_order],
            )
            .map_err(|e| e.to_string())?;
        }
        for gt in &payload.group_teams {
            conn.execute(
                "INSERT INTO group_teams (group_id, team_id) VALUES (?1,?2)",
                params![gt.group_id, gt.team_id],
            )
            .map_err(|e| e.to_string())?;
        }
        for ma in &payload.matches {
            conn.execute(
                "INSERT INTO matches (id, group_id, home_team_id, away_team_id, stage, stage_slot,
                    match_order, matchday_no, scheduled_date, scheduled_time,
                    calendar_slot, status, home_score, away_score, played_at)
                 VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)",
                params![
                    ma.id, ma.group_id, ma.home_team_id, ma.away_team_id,
                    ma.stage, ma.stage_slot, ma.match_order, ma.matchday_no,
                    ma.scheduled_date, ma.scheduled_time, ma.calendar_slot,
                    ma.status, ma.home_score, ma.away_score, ma.played_at
                ],
            )
            .map_err(|e| e.to_string())?;
        }
        for gs in &payload.group_schedule_settings {
            conn.execute(
                "INSERT INTO group_schedule_settings (group_id, daily_limit) VALUES (?1,?2)",
                params![gs.group_id, gs.daily_limit],
            )
            .map_err(|e| e.to_string())?;
        }
        for ev in &payload.match_events {
            conn.execute(
                "INSERT INTO match_events (id, match_id, team_id, player_name, event_type, minute)
                 VALUES (?1,?2,?3,?4,?5,?6)",
                params![ev.id, ev.match_id, ev.team_id, ev.player_name, ev.event_type, ev.minute],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(())
    })();

    match result {
        Ok(_) => conn.execute_batch("COMMIT;").map_err(|e| e.to_string()),
        Err(e) => {
            let _ = conn.execute_batch("ROLLBACK;");
            Err(e)
        }
    }
}
