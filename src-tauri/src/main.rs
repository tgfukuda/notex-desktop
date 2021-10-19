#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::fs::{DirBuilder, File, OpenOptions};
use std::io::{ErrorKind, Read, Write};
use std::path::{Path, PathBuf};

pub mod command;
pub mod constants;
pub mod model;

use command::{get_document, get_setting, save_document};

#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "language")]
enum Language {
  #[serde(rename = "english")]
  English,
  #[serde(rename = "japanese")]
  Japanese,
}

#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
pub struct Env {
  target_dir: PathBuf,
  username: String,
  password: String,
  is_pass_enabled: bool,
  #[serde(flatten)]
  language: Language,
  key_bindings: Vec<String>,
  is_new: bool,
}
impl Env {
  fn from_string(buf: &str) -> Result<Env, serde_json::Error> {
    let env: Env = serde_json::from_str(buf)?;
    Ok(env)
  }

  fn path_to_file(&self, filename: &str) -> PathBuf {
    self.target_dir.join(filename)
  }
}
impl Default for Env {
  fn default() -> Self {
    Env {
      target_dir: dirs::home_dir()
        .unwrap_or(Path::new(".").to_path_buf())
        .join(constants::ROOT)
        .join(constants::DEFAULT_TARGET),
      username: String::new(),
      password: String::new(),
      is_pass_enabled: true,
      language: Language::English,
      key_bindings: vec![],
      is_new: true,
    }
  }
}

fn initialize() {
  let root = dirs::home_dir()
    .unwrap_or(Path::new(".").to_path_buf())
    .join(constants::ROOT);
  if !root.exists() {
    DirBuilder::new()
      .recursive(true)
      .create(root.clone())
      .unwrap();
  }

  let default_target = root.join(constants::DEFAULT_TARGET);
  if !default_target.exists() {
    if let Err(err) = DirBuilder::new().recursive(true).create(default_target) {
      println!(
        "WARNING: failed to create default target directry for\n{}",
        err.to_string()
      );
    }
  }

  let conf = root.join(constants::CONF);
  if !conf.exists() {
    println!("conf is {:?}", conf.to_str());
    File::create(conf)
      .and_then(|mut f| f.write_all(serde_json::to_string(&Env::default()).unwrap().as_bytes()))
      .unwrap();
  }
}

fn main() {
  initialize();

  let setting = {
    let mut buf = String::new();
    match OpenOptions::new()
      .read(true)
      .write(false)
      .append(false)
      .open(
        dirs::home_dir()
          .unwrap_or(Path::new(".").to_path_buf())
          .join(constants::ROOT)
          .join(constants::CONF),
      )
      .map(|mut file| file.read_to_string(&mut buf).unwrap())
    {
      Ok(_) => Env::from_string(&buf).unwrap_or_default(),
      Err(ref e) if e.kind() == ErrorKind::NotFound => Env::default(),
      Err(e) => {
        panic!("{}", e.to_string());
      }
    }
  };

  println!("hello, tauri");
  tauri::Builder::default()
    .manage(setting)
    .invoke_handler(tauri::generate_handler![
      get_setting,
      save_document,
      get_document
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
