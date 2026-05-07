mod commands;
mod db;
mod models;

use db::DbConn;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let conn = db::init_db(app.handle()).map_err(|e| e.to_string())?;
            app.manage(DbConn(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::teams::list_teams,
            commands::teams::create_team,
            commands::teams::update_team,
            commands::teams::delete_team,
            commands::members::list_members,
            commands::members::add_member,
            commands::members::delete_member,
            commands::tournament::run_draw,
            commands::tournament::run_league_draw,
            commands::tournament::get_groups,
            commands::tournament::move_team_group,
            commands::tournament::regenerate_group_fixtures,
            commands::tournament::get_group_schedule_settings,
            commands::tournament::update_group_daily_limit,
            commands::tournament::auto_schedule_group_matches,
            commands::tournament::get_standings,
            commands::tournament::reset_all,
            commands::tournament::reset_teams,
            commands::tournament::generate_genel_knockouts,
            commands::matches::add_match,
            commands::matches::list_matches,
            commands::matches::update_match,
            commands::matches::update_match_schedule,
            commands::matches::add_match_event,
            commands::matches::list_match_events,
            commands::matches::delete_match_event,
            commands::matches::reset_match,
            commands::matches::delete_match,
            commands::stats::get_top_scorers,
            commands::stats::get_team_summaries,
            commands::stats::get_player_summary,
            commands::stats::get_team_players_summary,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
