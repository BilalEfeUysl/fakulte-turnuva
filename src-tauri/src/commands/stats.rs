use crate::db::DbConn;
use crate::models::{PlayerSummaryRow, TeamSummaryRow, TopScorerRow};
use rusqlite::params;

#[tauri::command]
pub fn get_top_scorers(db: tauri::State<DbConn>) -> Result<Vec<TopScorerRow>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT e.player_name, e.team_id, t.name, COUNT(*) AS goals, MAX(e.minute) AS last_min
             FROM match_events e
             JOIN teams t ON t.id = e.team_id
             WHERE e.event_type = 'goal'
             GROUP BY e.player_name, e.team_id
             ORDER BY goals DESC, last_min DESC, e.player_name COLLATE NOCASE",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, Option<i64>>(4)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for (i, r) in rows.enumerate() {
        let (player_name, team_id, team_name, goals, last_goal_minute) =
            r.map_err(|e| e.to_string())?;
        out.push(TopScorerRow {
            rank: (i as i64) + 1,
            player_name,
            team_id,
            team_name,
            goals,
            last_goal_minute,
        });
    }
    Ok(out)
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TeamArg {
    pub team_id: i64,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayerArg {
    pub team_id: i64,
    pub player_name: String,
}

#[tauri::command]
pub fn get_team_summaries(db: tauri::State<DbConn>) -> Result<Vec<TeamSummaryRow>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT
               t.id,
               t.name,
               SUM(CASE WHEN m.status = 'finished' AND (m.home_team_id = t.id OR m.away_team_id = t.id) THEN 1 ELSE 0 END) AS played,
               SUM(CASE WHEN m.status = 'finished' AND m.home_team_id = t.id THEN m.home_score
                        WHEN m.status = 'finished' AND m.away_team_id = t.id THEN m.away_score ELSE 0 END) AS gf,
               SUM(CASE WHEN m.status = 'finished' AND m.home_team_id = t.id THEN m.away_score
                        WHEN m.status = 'finished' AND m.away_team_id = t.id THEN m.home_score ELSE 0 END) AS ga,
               SUM(CASE WHEN e.event_type = 'yellow' AND e.team_id = t.id THEN 1 ELSE 0 END) AS yc,
               SUM(CASE WHEN e.event_type = 'red' AND e.team_id = t.id THEN 1 ELSE 0 END) AS rc
             FROM teams t
             LEFT JOIN matches m ON m.home_team_id = t.id OR m.away_team_id = t.id
             LEFT JOIN match_events e ON e.team_id = t.id
             GROUP BY t.id, t.name
             ORDER BY t.name COLLATE NOCASE",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(TeamSummaryRow {
                team_id: row.get(0)?,
                team_name: row.get(1)?,
                played: row.get(2)?,
                goals_for: row.get(3)?,
                goals_against: row.get(4)?,
                yellow_cards: row.get(5)?,
                red_cards: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[tauri::command]
pub fn get_player_summary(
    db: tauri::State<DbConn>,
    args: PlayerArg,
) -> Result<PlayerSummaryRow, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let team_name: String = conn
        .query_row("SELECT name FROM teams WHERE id = ?1", params![args.team_id], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let goals: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM match_events WHERE team_id = ?1 AND player_name = ?2 AND event_type = 'goal'",
            params![args.team_id, args.player_name],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    let yellow_cards: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM match_events WHERE team_id = ?1 AND player_name = ?2 AND event_type = 'yellow'",
            params![args.team_id, args.player_name],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    let red_cards: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM match_events WHERE team_id = ?1 AND player_name = ?2 AND event_type = 'red'",
            params![args.team_id, args.player_name],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    let matches: i64 = conn
        .query_row(
            "SELECT COUNT(DISTINCT match_id) FROM match_events WHERE team_id = ?1 AND player_name = ?2",
            params![args.team_id, args.player_name],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(PlayerSummaryRow {
        team_id: args.team_id,
        team_name,
        player_name: args.player_name,
        goals,
        yellow_cards,
        red_cards,
        matches,
    })
}

#[tauri::command]
pub fn get_team_players_summary(
    db: tauri::State<DbConn>,
    args: TeamArg,
) -> Result<Vec<PlayerSummaryRow>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let team_name: String = conn
        .query_row("SELECT name FROM teams WHERE id = ?1", params![args.team_id], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT player_name,
                    SUM(CASE WHEN event_type = 'goal' THEN 1 ELSE 0 END) AS goals,
                    SUM(CASE WHEN event_type = 'yellow' THEN 1 ELSE 0 END) AS yellow_cards,
                    SUM(CASE WHEN event_type = 'red' THEN 1 ELSE 0 END) AS red_cards,
                    COUNT(DISTINCT match_id) AS matches
             FROM match_events
             WHERE team_id = ?1
             GROUP BY player_name
             ORDER BY goals DESC, yellow_cards DESC, player_name COLLATE NOCASE",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![args.team_id], |row| {
            Ok(PlayerSummaryRow {
                team_id: args.team_id,
                team_name: team_name.clone(),
                player_name: row.get(0)?,
                goals: row.get(1)?,
                yellow_cards: row.get(2)?,
                red_cards: row.get(3)?,
                matches: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}
