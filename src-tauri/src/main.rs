#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

extern crate app;

/**
 * there's only command related to fs for now
 * but potentialy other like exec, multiple window, ...etc
 */
use app::command;
use app::Casher;

fn main() {
  let env = app::initialize();

  tauri::Builder::default()
    .manage(env)
    .manage(Casher::new())
    .invoke_handler(tauri::generate_handler![
      command::get_setting,
      command::update_setting,
      command::save_document,
      command::delete_file,
      command::get_documents_by_filter,
      command::get_document
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
