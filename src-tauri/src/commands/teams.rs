use crate::db::DbConn;
use crate::models::{CreateTeamPayload, Team, UpdateTeamPayload};
use rusqlite::params;

#[tauri::command]
pub fn list_teams(db: tauri::State<DbConn>) -> Result<Vec<Team>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, faculty_name, notes, color, short_name, created_at FROM teams \
             ORDER BY name COLLATE NOCASE",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Team {
                id: row.get(0)?,
                name: row.get(1)?,
                faculty_name: row.get(2)?,
                notes: row.get(3)?,
                color: row.get(4)?,
                short_name: row.get(5)?,
                created_at: row.get(6)?,
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
pub fn create_team(
    db: tauri::State<DbConn>,
    payload: CreateTeamPayload,
) -> Result<Team, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM teams", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    if count >= 10 {
        return Err("En fazla 10 takım ekleyebilirsiniz (turnuva düzeni).".into());
    }
    conn.execute(
        "INSERT INTO teams (name, faculty_name, notes, color, short_name) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![payload.name, payload.faculty_name, payload.notes, payload.color, payload.short_name],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, name, faculty_name, notes, color, short_name, created_at FROM teams WHERE id = ?1",
        params![id],
        |row| {
            Ok(Team {
                id: row.get(0)?,
                name: row.get(1)?,
                faculty_name: row.get(2)?,
                notes: row.get(3)?,
                color: row.get(4)?,
                short_name: row.get(5)?,
                created_at: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_team(
    db: tauri::State<DbConn>,
    payload: UpdateTeamPayload,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let n = conn
        .execute(
            "UPDATE teams SET name = ?1, faculty_name = ?2, notes = ?3, color = ?4, short_name = ?5 WHERE id = ?6",
            params![
                payload.name,
                payload.faculty_name,
                payload.notes,
                payload.color,
                payload.short_name,
                payload.id
            ],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Takım bulunamadı.".into());
    }
    Ok(())
}

#[tauri::command]
pub fn delete_team(db: tauri::State<DbConn>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM teams WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
