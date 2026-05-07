use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

pub struct DbConn(pub Mutex<Connection>);

pub fn init_db(app: &tauri::AppHandle) -> Result<Connection, Box<dyn std::error::Error>> {
    let dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&dir)?;
    let db_path = dir.join("turnuva.sqlite3");
    let conn = Connection::open(db_path)?;
    conn.execute_batch(
        r"
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            faculty_name TEXT NOT NULL,
            notes TEXT NOT NULL DEFAULT '',
            color TEXT NOT NULL DEFAULT '#14b8a6',
            short_name TEXT NOT NULL DEFAULT '',
            manager_name TEXT,
            manager_phone TEXT,
            manager_email TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            full_name TEXT NOT NULL,
            role_hint TEXT NOT NULL DEFAULT '',
            jersey_no INTEGER,
            school_no TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS group_teams (
            group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            PRIMARY KEY (group_id, team_id)
        );
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            home_team_id INTEGER NOT NULL REFERENCES teams(id),
            away_team_id INTEGER NOT NULL REFERENCES teams(id),
            stage TEXT NOT NULL DEFAULT 'group',
            stage_slot TEXT NOT NULL DEFAULT '',
            match_order INTEGER NOT NULL DEFAULT 0,
            matchday_no INTEGER NOT NULL DEFAULT 0,
            scheduled_date TEXT,
            scheduled_time TEXT,
            calendar_slot INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'scheduled',
            home_score INTEGER NOT NULL DEFAULT 0,
            away_score INTEGER NOT NULL DEFAULT 0,
            played_at TEXT
        );
        CREATE TABLE IF NOT EXISTS group_schedule_settings (
            group_id INTEGER PRIMARY KEY REFERENCES groups(id) ON DELETE CASCADE,
            daily_limit INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS match_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
            team_id INTEGER NOT NULL REFERENCES teams(id),
            player_name TEXT NOT NULL,
            event_type TEXT NOT NULL,
            minute INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_matches_group ON matches(group_id);
        CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
        ",
    )?;
    ensure_column(
        &conn,
        "team_members",
        "jersey_no",
        "INTEGER",
    )?;
    ensure_column(
        &conn,
        "team_members",
        "school_no",
        "TEXT NOT NULL DEFAULT ''",
    )?;
    ensure_column(
        &conn,
        "teams",
        "color",
        "TEXT NOT NULL DEFAULT '#14b8a6'",
    )?;
    ensure_column(
        &conn,
        "teams",
        "short_name",
        "TEXT NOT NULL DEFAULT ''",
    )?;
    ensure_column(&conn, "teams", "manager_name",  "TEXT")?;
    ensure_column(&conn, "teams", "manager_phone", "TEXT")?;
    ensure_column(&conn, "teams", "manager_email", "TEXT")?;
    ensure_column(
        &conn,
        "matches",
        "stage",
        "TEXT NOT NULL DEFAULT 'group'",
    )?;
    ensure_column(
        &conn,
        "matches",
        "stage_slot",
        "TEXT NOT NULL DEFAULT ''",
    )?;
    ensure_column(
        &conn,
        "matches",
        "matchday_no",
        "INTEGER NOT NULL DEFAULT 0",
    )?;
    ensure_column(
        &conn,
        "matches",
        "scheduled_date",
        "TEXT",
    )?;
    ensure_column(
        &conn,
        "matches",
        "scheduled_time",
        "TEXT",
    )?;
    ensure_column(
        &conn,
        "matches",
        "calendar_slot",
        "INTEGER NOT NULL DEFAULT 0",
    )?;
    Ok(conn)
}

fn ensure_column(
    conn: &Connection,
    table: &str,
    column: &str,
    ddl: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({table})"))?;
    let cols = stmt.query_map([], |row| row.get::<_, String>(1))?;
    let mut found = false;
    for c in cols {
        if c? == column {
            found = true;
            break;
        }
    }
    if !found {
        conn.execute(
            &format!("ALTER TABLE {table} ADD COLUMN {column} {ddl}"),
            [],
        )?;
    }
    Ok(())
}
