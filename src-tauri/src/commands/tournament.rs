use crate::db::DbConn;
use crate::models::{
    AutoSchedulePayload, GroupScheduleSetting, GroupStandings, GroupWithTeams, MoveTeamGroupPayload,
    StandingRow, UpdateGroupDailyLimitPayload,
};
use rand::seq::SliceRandom;
use rand::thread_rng;
use rusqlite::params;
use std::collections::HashMap;

const REQUIRED_TEAMS: i64 = 10;

#[derive(Default, Clone)]
struct Acc {
    played: i64,
    won: i64,
    drawn: i64,
    lost: i64,
    gf: i64,
    ga: i64,
}

#[derive(Default, Clone)]
struct H2H {
    gd: i64,
}

fn team_name(conn: &rusqlite::Connection, id: i64) -> Result<String, String> {
    conn.query_row("SELECT name FROM teams WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())
}

fn date_plus_days(conn: &rusqlite::Connection, start_date: &str, days: i64) -> Result<String, String> {
    conn.query_row(
        "SELECT date(?1, printf('+%d day', ?2))",
        params![start_date, days],
        |r| r.get(0),
    )
    .map_err(|e| e.to_string())
}

fn get_groups_internal(conn: &rusqlite::Connection) -> Result<Vec<GroupWithTeams>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, sort_order FROM groups ORDER BY sort_order, id")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for r in rows {
        let (id, name, sort_order) = r.map_err(|e| e.to_string())?;
        let mut ts = conn
            .prepare(
                "SELECT gt.team_id
                 FROM group_teams gt
                 JOIN teams t ON t.id = gt.team_id
                 WHERE gt.group_id = ?1
                 ORDER BY t.name COLLATE NOCASE",
            )
            .map_err(|e| e.to_string())?;
        let trows = ts
            .query_map(params![id], |row| row.get::<_, i64>(0))
            .map_err(|e| e.to_string())?;
        let mut team_ids = Vec::new();
        for t in trows {
            team_ids.push(t.map_err(|e| e.to_string())?);
        }
        out.push(GroupWithTeams {
            id,
            name,
            sort_order,
            team_ids,
        });
    }
    Ok(out)
}

fn generate_round_robin(
    conn: &rusqlite::Connection,
    group_id: i64,
    team_ids: &[i64],
) -> Result<(), String> {
    let n = team_ids.len();
    if n < 2 {
        return Ok(());
    }
    let mut ord = 0i64;
    for i in 0..n {
        for j in (i + 1)..n {
            ord += 1;
            let (home, away) = if ord % 2 == 0 {
                (team_ids[i], team_ids[j])
            } else {
                (team_ids[j], team_ids[i])
            };
            conn.execute(
                "INSERT INTO matches (
                    group_id, home_team_id, away_team_id, stage, stage_slot,
                    match_order, matchday_no, scheduled_date, calendar_slot, status
                 ) VALUES (?1, ?2, ?3, 'group', '', ?4, 0, NULL, 0, 'scheduled')",
                params![group_id, home, away, ord],
            )
            .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn round_pairings_with_bye(team_ids: &[i64]) -> Vec<Vec<(i64, i64)>> {
    let mut ids = team_ids.to_vec();
    let is_odd = ids.len() % 2 == 1;
    let bye = -1_i64;
    if is_odd {
        ids.push(bye);
    }
    let total = ids.len();
    if total < 2 {
        return vec![];
    }
    let rounds = total - 1;
    let mut arr = ids;
    let mut output = Vec::new();
    for _ in 0..rounds {
        let mut round = Vec::new();
        for i in 0..(total / 2) {
            let a = arr[i];
            let b = arr[total - 1 - i];
            if a != bye && b != bye {
                round.push((a, b));
            }
        }
        output.push(round);
        let first = arr[0];
        let mut rest = arr[1..].to_vec();
        rest.rotate_right(1);
        arr = vec![first];
        arr.extend(rest);
    }
    output
}

fn apply_auto_schedule_for_group(
    conn: &rusqlite::Connection,
    group: &GroupWithTeams,
    start_date: &str,
    daily_limit: i64,
) -> Result<(), String> {
    let rounds = round_pairings_with_bye(&group.team_ids);
    if rounds.is_empty() {
        return Ok(());
    }
    if daily_limit < 1 {
        return Err(format!("Grup {} için günlük limit en az 1 olmalı.", group.name));
    }

    let mut stmt = conn
        .prepare(
            "SELECT id, home_team_id, away_team_id
             FROM matches
             WHERE group_id = ?1 AND stage = 'group'",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![group.id], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, i64>(2)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut map: HashMap<(i64, i64), i64> = HashMap::new();
    for r in rows {
        let (id, h, a) = r.map_err(|e| e.to_string())?;
        let key = if h < a { (h, a) } else { (a, h) };
        map.insert(key, id);
    }

    let mut day_offset = 0_i64;
    for pairings in &rounds {
        let mut slot_in_day = 0_i64;
        for (a, b) in pairings {
            if slot_in_day >= daily_limit {
                day_offset += 1;
                slot_in_day = 0;
            }
            let matchday_no = day_offset + 1;
            let date = date_plus_days(conn, start_date, day_offset)?;
            let key = if a < b { (*a, *b) } else { (*b, *a) };
            if let Some(match_id) = map.get(&key) {
                conn.execute(
                    "UPDATE matches
                     SET matchday_no = ?1, scheduled_date = ?2, calendar_slot = ?3
                     WHERE id = ?4",
                    params![matchday_no, date, slot_in_day + 1, match_id],
                )
                .map_err(|e| e.to_string())?;
            }
            slot_in_day += 1;
        }
        // Keep each round boundary on a fresh day for predictable fixture flow.
        day_offset += 1;
    }
    Ok(())
}

fn all_group_matches_finished(conn: &rusqlite::Connection) -> Result<bool, String> {
    let pending: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM matches WHERE stage = 'group' AND status != 'finished'",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    Ok(pending == 0)
}

fn standings_for_group(
    conn: &rusqlite::Connection,
    g: &GroupWithTeams,
) -> Result<Vec<StandingRow>, String> {
    let mut acc: HashMap<i64, Acc> = HashMap::new();
    for tid in &g.team_ids {
        acc.insert(*tid, Acc::default());
    }
    let mut h2h: HashMap<(i64, i64), H2H> = HashMap::new();

    let mut ms = conn
        .prepare(
            "SELECT home_team_id, away_team_id, home_score, away_score
             FROM matches
             WHERE group_id = ?1 AND stage = 'group' AND status = 'finished'",
        )
        .map_err(|e| e.to_string())?;
    let mrows = ms
        .query_map(params![g.id], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, i64>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    for mr in mrows {
        let (h, a, hs, aws) = mr.map_err(|e| e.to_string())?;
        if let Some(x) = acc.get_mut(&h) {
            x.played += 1;
            x.gf += hs;
            x.ga += aws;
            if hs > aws {
                x.won += 1;
            } else if hs == aws {
                x.drawn += 1;
            } else {
                x.lost += 1;
            }
        }
        if let Some(x) = acc.get_mut(&a) {
            x.played += 1;
            x.gf += aws;
            x.ga += hs;
            if aws > hs {
                x.won += 1;
            } else if aws == hs {
                x.drawn += 1;
            } else {
                x.lost += 1;
            }
        }
        let hk = (h, a);
        let ak = (a, h);
        let mut hh = h2h.get(&hk).cloned().unwrap_or_default();
        let mut aa = h2h.get(&ak).cloned().unwrap_or_default();
        hh.gd += hs - aws;
        aa.gd += aws - hs;
        h2h.insert(hk, hh);
        h2h.insert(ak, aa);
    }

    let mut rows: Vec<StandingRow> = g
        .team_ids
        .iter()
        .filter_map(|tid| {
            let a = acc.get(tid)?.clone();
            let points = a.won * 3 + a.drawn;
            let gd = a.gf - a.ga;
            let name = team_name(conn, *tid).ok()?;
            Some(StandingRow {
                rank: 0,
                team_id: *tid,
                team_name: name,
                played: a.played,
                won: a.won,
                drawn: a.drawn,
                lost: a.lost,
                gf: a.gf,
                ga: a.ga,
                gd,
                points,
            })
        })
        .collect();

    rows.sort_by(|x, y| {
        y.points
            .cmp(&x.points)
            .then_with(|| {
                let xh = h2h.get(&(x.team_id, y.team_id)).cloned().unwrap_or_default();
                let yh = h2h.get(&(y.team_id, x.team_id)).cloned().unwrap_or_default();
                yh.gd.cmp(&xh.gd)
            })
            .then_with(|| y.gd.cmp(&x.gd))
            .then_with(|| y.gf.cmp(&x.gf))
            .then_with(|| x.team_name.cmp(&y.team_name))
    });

    for (i, row) in rows.iter_mut().enumerate() {
        row.rank = (i + 1) as i64;
    }
    Ok(rows)
}

fn upsert_knockout(conn: &rusqlite::Connection) -> Result<(), String> {
    if !all_group_matches_finished(conn)? {
        return Ok(());
    }
    let groups = get_groups_internal(conn)?;
    let a = groups.iter().find(|g| g.name == "A");
    let b = groups.iter().find(|g| g.name == "B");
    if let (Some(ga), Some(gb)) = (a, b) {
        let ar = standings_for_group(conn, ga)?;
        let br = standings_for_group(conn, gb)?;
        if ar.len() < 2 || br.len() < 2 {
            return Ok(());
        }
        conn.execute(
            "DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE stage IN ('semi', 'final'))",
            [],
        )
        .map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM matches WHERE stage IN ('semi', 'final')", [])
            .map_err(|e| e.to_string())?;

        conn.execute(
            "INSERT INTO matches (
                group_id, home_team_id, away_team_id, stage, stage_slot,
                match_order, matchday_no, scheduled_date, calendar_slot, status
             ) VALUES (?1, ?2, ?3, 'semi', 'SF1', 1, 0, NULL, 0, 'scheduled')",
            params![ga.id, ar[0].team_id, br[1].team_id],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO matches (
                group_id, home_team_id, away_team_id, stage, stage_slot,
                match_order, matchday_no, scheduled_date, calendar_slot, status
             ) VALUES (?1, ?2, ?3, 'semi', 'SF2', 2, 0, NULL, 0, 'scheduled')",
            params![gb.id, br[0].team_id, ar[1].team_id],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn run_draw(db: tauri::State<DbConn>) -> Result<Vec<GroupWithTeams>, String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut team_ids: Vec<i64> = {
        let mut stmt = conn.prepare("SELECT id FROM teams").map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| row.get::<_, i64>(0))
            .map_err(|e| e.to_string())?;
        let mut v = Vec::new();
        for r in rows {
            v.push(r.map_err(|e| e.to_string())?);
        }
        v
    };
    if team_ids.len() as i64 != REQUIRED_TEAMS {
        return Err(format!(
            "Kura için tam {REQUIRED_TEAMS} takım gerekir (şu an {}).",
            team_ids.len()
        ));
    }
    team_ids.shuffle(&mut thread_rng());

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute_batch(
        "DELETE FROM match_events;
         DELETE FROM matches;
         DELETE FROM group_schedule_settings;
         DELETE FROM group_teams;
         DELETE FROM groups;",
    )
    .map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO groups (name, sort_order) VALUES ('A', 0), ('B', 1)",
        [],
    )
    .map_err(|e| e.to_string())?;
    let gid_a: i64 = tx
        .query_row("SELECT id FROM groups WHERE name = 'A'", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let gid_b: i64 = tx
        .query_row("SELECT id FROM groups WHERE name = 'B'", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO group_schedule_settings (group_id, daily_limit) VALUES (?1, 1), (?2, 1)",
        params![gid_a, gid_b],
    )
    .map_err(|e| e.to_string())?;

    let half = team_ids.len() / 2;
    let a_teams = &team_ids[..half];
    let b_teams = &team_ids[half..];
    for tid in a_teams {
        tx.execute(
            "INSERT INTO group_teams (group_id, team_id) VALUES (?1, ?2)",
            params![gid_a, tid],
        )
        .map_err(|e| e.to_string())?;
    }
    for tid in b_teams {
        tx.execute(
            "INSERT INTO group_teams (group_id, team_id) VALUES (?1, ?2)",
            params![gid_b, tid],
        )
        .map_err(|e| e.to_string())?;
    }
    generate_round_robin(&tx, gid_a, a_teams)?;
    generate_round_robin(&tx, gid_b, b_teams)?;
    tx.commit().map_err(|e| e.to_string())?;
    get_groups_internal(&conn)
}

#[tauri::command]
pub fn get_groups(db: tauri::State<DbConn>) -> Result<Vec<GroupWithTeams>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_groups_internal(&conn)
}

#[tauri::command]
pub fn move_team_group(
    db: tauri::State<DbConn>,
    payload: MoveTeamGroupPayload,
) -> Result<Vec<GroupWithTeams>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let target = payload.target_group.to_uppercase();
    if target != "A" && target != "B" {
        return Err("Hedef grup A veya B olmalı.".into());
    }
    let target_id: i64 = conn
        .query_row(
            "SELECT id FROM groups WHERE name = ?1",
            params![target],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM group_teams WHERE team_id = ?1", params![payload.team_id])
        .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO group_teams (group_id, team_id) VALUES (?1, ?2)",
        params![target_id, payload.team_id],
    )
    .map_err(|e| e.to_string())?;
    get_groups_internal(&conn)
}

#[tauri::command]
pub fn regenerate_group_fixtures(db: tauri::State<DbConn>) -> Result<Vec<GroupWithTeams>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE stage IN ('group','semi','final'))",
        [],
    )
    .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM matches WHERE stage IN ('group','semi','final')", [])
        .map_err(|e| e.to_string())?;
    let groups = get_groups_internal(&conn)?;
    for g in &groups {
        generate_round_robin(&conn, g.id, &g.team_ids)?;
    }
    Ok(groups)
}

#[tauri::command]
pub fn get_group_schedule_settings(db: tauri::State<DbConn>) -> Result<Vec<GroupScheduleSetting>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT g.id, g.name, COALESCE(s.daily_limit, 1)
             FROM groups g
             LEFT JOIN group_schedule_settings s ON s.group_id = g.id
             ORDER BY g.sort_order, g.id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(GroupScheduleSetting {
                group_id: row.get(0)?,
                group_name: row.get(1)?,
                daily_limit: row.get(2)?,
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
pub fn update_group_daily_limit(
    db: tauri::State<DbConn>,
    payload: UpdateGroupDailyLimitPayload,
) -> Result<Vec<GroupScheduleSetting>, String> {
    if payload.daily_limit < 1 {
        return Err("Günlük limit en az 1 olmalı.".into());
    }
    {
        let conn = db.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO group_schedule_settings (group_id, daily_limit)
             VALUES (?1, ?2)
             ON CONFLICT(group_id) DO UPDATE SET daily_limit = excluded.daily_limit",
            params![payload.group_id, payload.daily_limit],
        )
        .map_err(|e| e.to_string())?;
    }
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT g.id, g.name, COALESCE(s.daily_limit, 1)
             FROM groups g
             LEFT JOIN group_schedule_settings s ON s.group_id = g.id
             ORDER BY g.sort_order, g.id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(GroupScheduleSetting {
                group_id: row.get(0)?,
                group_name: row.get(1)?,
                daily_limit: row.get(2)?,
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
pub fn auto_schedule_group_matches(
    db: tauri::State<DbConn>,
    payload: AutoSchedulePayload,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let groups = get_groups_internal(&conn)?;
    for g in &groups {
        let daily_limit: i64 = conn
            .query_row(
                "SELECT COALESCE((SELECT daily_limit FROM group_schedule_settings WHERE group_id = ?1), 1)",
                params![g.id],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        apply_auto_schedule_for_group(&conn, g, &payload.start_date, daily_limit)?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_standings(db: tauri::State<DbConn>) -> Result<Vec<GroupStandings>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let groups = get_groups_internal(&conn)?;
    let mut result = Vec::new();
    for g in groups {
        let rows = standings_for_group(&conn, &g)?;
        result.push(GroupStandings {
            group_id: g.id,
            group_name: g.name.clone(),
            rows,
        });
    }
    upsert_knockout(&conn)?;
    Ok(result)
}
