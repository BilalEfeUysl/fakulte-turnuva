use crate::db::DbConn;
use crate::models::{
    AddMatchEventPayload, CreateMatchPayload, DeleteEventPayload, MatchEventRow, MatchRow,
    UpdateMatchPayload, UpdateMatchSchedulePayload,
};
use rusqlite::params;



#[tauri::command]
pub fn add_match(db: tauri::State<DbConn>, payload: CreateMatchPayload) -> Result<MatchRow, String> {
    if payload.home_team_id == payload.away_team_id {
        return Err("Ev sahibi ve deplasman takımı aynı olamaz.".into());
    }
    let stage = payload.stage.trim().to_string();
    if stage.is_empty() {
        return Err("Aşama boş olamaz.".into());
    }
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let group_id: i64 = match conn.query_row(
        "SELECT id FROM groups WHERE name = 'Manuel'",
        [],
        |r| r.get(0),
    ) {
        Ok(id) => id,
        Err(_) => {
            conn.execute(
                "INSERT INTO groups (name, sort_order) VALUES ('Manuel', 99)",
                [],
            )
            .map_err(|e| e.to_string())?;
            conn.last_insert_rowid()
        }
    };

    conn.execute(
        "INSERT INTO matches (group_id, home_team_id, away_team_id, stage, stage_slot, \
         match_order, scheduled_date, scheduled_time, status) \
         VALUES (?1, ?2, ?3, ?4, '', 0, ?5, ?6, 'scheduled')",
        params![
            group_id,
            payload.home_team_id,
            payload.away_team_id,
            stage,
            payload.match_date,
            payload.match_time,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT m.id, m.group_id, g.name, m.stage, m.stage_slot, m.home_team_id, m.away_team_id, \
         th.name, ta.name, m.match_order, m.matchday_no, m.scheduled_date, m.scheduled_time, m.calendar_slot, \
         m.status, m.home_score, m.away_score, m.played_at \
         FROM matches m \
         JOIN groups g ON g.id = m.group_id \
         JOIN teams th ON th.id = m.home_team_id \
         JOIN teams ta ON ta.id = m.away_team_id \
         WHERE m.id = ?1",
        params![id],
        |row| {
            Ok(MatchRow {
                id: row.get(0)?,
                group_id: row.get(1)?,
                group_name: row.get(2)?,
                stage: row.get(3)?,
                stage_slot: row.get(4)?,
                home_team_id: row.get(5)?,
                away_team_id: row.get(6)?,
                home_team_name: row.get(7)?,
                away_team_name: row.get(8)?,
                match_order: row.get(9)?,
                matchday_no: row.get(10)?,
                scheduled_date: row.get(11)?,
                scheduled_time: row.get(12)?,
                calendar_slot: row.get(13)?,
                status: row.get(14)?,
                home_score: row.get(15)?,
                away_score: row.get(16)?,
                played_at: row.get(17)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_matches(db: tauri::State<DbConn>) -> Result<Vec<MatchRow>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT m.id, m.group_id, g.name, m.stage, m.stage_slot, m.home_team_id, m.away_team_id, \
             th.name, ta.name, m.match_order, m.matchday_no, m.scheduled_date, m.scheduled_time, m.calendar_slot, \
             m.status, m.home_score, m.away_score, m.played_at \
             FROM matches m \
             JOIN groups g ON g.id = m.group_id \
             JOIN teams th ON th.id = m.home_team_id \
             JOIN teams ta ON ta.id = m.away_team_id \
             ORDER BY
             CASE m.stage WHEN 'league' THEN 0 WHEN 'group' THEN 0 WHEN 'semi' THEN 1 ELSE 2 END,
             COALESCE(m.scheduled_date, '9999-12-31'),
             COALESCE(m.scheduled_time, '23:59'),
             m.matchday_no, m.calendar_slot, g.sort_order, m.match_order, m.id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(MatchRow {
                id: row.get(0)?,
                group_id: row.get(1)?,
                group_name: row.get(2)?,
                stage: row.get(3)?,
                stage_slot: row.get(4)?,
                home_team_id: row.get(5)?,
                away_team_id: row.get(6)?,
                home_team_name: row.get(7)?,
                away_team_name: row.get(8)?,
                match_order: row.get(9)?,
                matchday_no: row.get(10)?,
                scheduled_date: row.get(11)?,
                scheduled_time: row.get(12)?,
                calendar_slot: row.get(13)?,
                status: row.get(14)?,
                home_score: row.get(15)?,
                away_score: row.get(16)?,
                played_at: row.get(17)?,
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
pub fn update_match_schedule(
    db: tauri::State<DbConn>,
    payload: UpdateMatchSchedulePayload,
) -> Result<(), String> {
    if payload.matchday_no < 0 || payload.calendar_slot < 0 {
        return Err("Maç günü ve slot negatif olamaz.".into());
    }
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let _n = conn
        .execute(
            "UPDATE matches
             SET matchday_no = ?1, scheduled_date = ?2, scheduled_time = ?3, calendar_slot = ?4
             WHERE id = ?5",
            params![
                payload.matchday_no,
                payload.scheduled_date,
                payload.scheduled_time,
                payload.calendar_slot,
                payload.id
            ],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_match(db: tauri::State<DbConn>, payload: UpdateMatchPayload) -> Result<(), String> {
    let st = payload.status.to_lowercase();
    if st != "scheduled" && st != "finished" {
        return Err("Geçersiz maç durumu.".into());
    }
    if payload.home_score < 0 || payload.away_score < 0 {
        return Err("Skor negatif olamaz.".into());
    }
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let _n = conn
        .execute(
            "UPDATE matches SET home_score = ?1, away_score = ?2, status = ?3, \
             played_at = IIF(?3 = 'finished', datetime('now', 'localtime'), NULL) WHERE id = ?4",
            params![payload.home_score, payload.away_score, st, payload.id],
        )
        .map_err(|e| e.to_string())?;
    maybe_generate_final(&conn)?;
    Ok(())
}

fn maybe_generate_final(conn: &rusqlite::Connection) -> Result<(), String> {
    let cnt: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM matches WHERE stage = 'semi' AND status = 'finished'",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if cnt < 2 {
        return Ok(());
    }
    let final_exists: i64 = conn
        .query_row("SELECT COUNT(*) FROM matches WHERE stage = 'final'", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    if final_exists > 0 {
        return Ok(());
    }
    let mut stmt = conn
        .prepare(
            "SELECT group_id, home_team_id, away_team_id, home_score, away_score
             FROM matches WHERE stage = 'semi' ORDER BY stage_slot",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, i64>(4)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    let mut winners: Vec<Option<i64>> = Vec::new();
    let mut group_id = 0i64;
    for r in rows {
        let (gid, h, a, hs, aws) = r.map_err(|e| e.to_string())?;
        group_id = gid;
        let winner = if hs > aws {
            Some(h)
        } else if aws > hs {
            Some(a)
        } else {
            // Berabere => finalist henüz belirlenmez
            None
        };
        winners.push(winner);
    }
    if winners.len() == 2 && winners[0].is_some() && winners[1].is_some() {
        conn.execute(
            "INSERT INTO matches (group_id, home_team_id, away_team_id, stage, stage_slot, match_order, status)
             VALUES (?1, ?2, ?3, 'final', 'F', 1, 'scheduled')",
            params![group_id, winners[0].unwrap(), winners[1].unwrap()],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn add_match_event(
    db: tauri::State<DbConn>,
    payload: AddMatchEventPayload,
) -> Result<MatchEventRow, String> {
    let et = payload.event_type.to_lowercase();
    if et != "goal" && et != "yellow" && et != "red" {
        return Err("Olay tipi: goal, yellow veya red olmalı.".into());
    }
    let name = payload.player_name.trim();
    if name.is_empty() {
        return Err("Oyuncu adı gerekli.".into());
    }
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO match_events (match_id, team_id, player_name, event_type, minute) \
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            payload.match_id,
            payload.team_id,
            name,
            et,
            payload.minute
        ],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT e.id, e.match_id, e.team_id, t.name, e.player_name, e.event_type, e.minute \
         FROM match_events e JOIN teams t ON t.id = e.team_id WHERE e.id = ?1",
        params![id],
        |row| {
            Ok(MatchEventRow {
                id: row.get(0)?,
                match_id: row.get(1)?,
                team_id: row.get(2)?,
                team_name: row.get(3)?,
                player_name: row.get(4)?,
                event_type: row.get(5)?,
                minute: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_match_events(
    db: tauri::State<DbConn>,
    match_id: i64,
) -> Result<Vec<MatchEventRow>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT e.id, e.match_id, e.team_id, t.name, e.player_name, e.event_type, e.minute \
             FROM match_events e \
             JOIN teams t ON t.id = e.team_id \
             WHERE e.match_id = ?1 \
             ORDER BY e.minute, e.id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![match_id], |row| {
            Ok(MatchEventRow {
                id: row.get(0)?,
                match_id: row.get(1)?,
                team_id: row.get(2)?,
                team_name: row.get(3)?,
                player_name: row.get(4)?,
                event_type: row.get(5)?,
                minute: row.get(6)?,
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
pub fn delete_match_event(db: tauri::State<DbConn>, payload: DeleteEventPayload) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let n = conn
        .execute("DELETE FROM match_events WHERE id = ?1", params![payload.id])
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Kayıt bulunamadı.".into());
    }
    Ok(())
}
#[tauri::command]
pub fn reset_match(db: tauri::State<DbConn>, match_id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Skorları sıfırla ve durumu 'scheduled' yap
    conn.execute(
        "UPDATE matches SET home_score = 0, away_score = 0, status = 'scheduled', played_at = NULL WHERE id = ?1",
        params![match_id],
    ).map_err(|e| e.to_string())?;

    // Bu maça ait tüm olayları (gol, kart) sil
    conn.execute(
        "DELETE FROM match_events WHERE match_id = ?1",
        params![match_id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
