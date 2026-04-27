use crate::db::DbConn;
use crate::models::{AddMemberPayload, ListMembersArgs, TeamMember};
use rusqlite::params;

#[tauri::command]
pub fn list_members(
    db: tauri::State<DbConn>,
    args: ListMembersArgs,
) -> Result<Vec<TeamMember>, String> {
    let team_id = args.team_id;
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, team_id, full_name, role_hint, jersey_no, school_no, created_at FROM team_members \
             WHERE team_id = ?1 ORDER BY full_name COLLATE NOCASE",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![team_id], |row| {
            Ok(TeamMember {
                id: row.get(0)?,
                team_id: row.get(1)?,
                full_name: row.get(2)?,
                role_hint: row.get(3)?,
                jersey_no: row.get(4)?,
                school_no: row.get(5)?,
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
pub fn add_member(
    db: tauri::State<DbConn>,
    payload: AddMemberPayload,
) -> Result<TeamMember, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM teams WHERE id = ?1",
            params![payload.team_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    if exists == 0 {
        return Err("Takım bulunamadı.".into());
    }
    conn.execute(
        "INSERT INTO team_members (team_id, full_name, role_hint, jersey_no, school_no) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            payload.team_id,
            payload.full_name,
            payload.role_hint,
            payload.jersey_no,
            payload.school_no
        ],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, team_id, full_name, role_hint, jersey_no, school_no, created_at FROM team_members WHERE id = ?1",
        params![id],
        |row| {
            Ok(TeamMember {
                id: row.get(0)?,
                team_id: row.get(1)?,
                full_name: row.get(2)?,
                role_hint: row.get(3)?,
                jersey_no: row.get(4)?,
                school_no: row.get(5)?,
                created_at: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_member(db: tauri::State<DbConn>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM team_members WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
