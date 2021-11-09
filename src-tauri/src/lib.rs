pub mod cmd;
pub mod constants;
pub mod model;

use std::{
  collections::{HashMap, HashSet},
  fs::{DirBuilder, File, OpenOptions},
  io::{ErrorKind, Read, Write},
  path::{Path, PathBuf},
  sync::{Arc, Mutex},
};
use tauri::Window;

#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "language")]
enum Language {
  #[serde(rename = "english")]
  English,
  #[serde(rename = "japanese")]
  Japanese,
}
impl ToString for Language {
  fn to_string(&self) -> String {
    match self {
      Language::English => String::from("english"),
      Language::Japanese => String::from("japanese"),
    }
  }
}

#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
pub struct Setting {
  target_dir: PathBuf,
  username: String,
  password: String,
  is_pass_enabled: bool,
  #[serde(flatten)]
  language: Language,
  autosave: Option<usize>,
  key_bindings: HashMap<String, String>,
  #[serde(skip)]
  is_new: bool,
}
impl Setting {
  fn from_string(buf: &str) -> Result<Setting, serde_json::Error> {
    Ok(serde_json::from_str(buf)?)
  }

  fn path_to_file(&self, filename: &str) -> PathBuf {
    self.target_dir.join(filename)
  }
}
impl Default for Setting {
  fn default() -> Self {
    let commands = vec!["save".to_string(), "insertImage".to_string()];
    let short_cuts = vec!["Control s".to_string(), "Control i".to_string()];

    Setting {
      target_dir: dirs::home_dir()
        .unwrap_or(Path::new(".").to_path_buf())
        .join(constants::ROOT)
        .join(constants::DEFAULT_TARGET),
      username: whoami::username(),
      password: String::new(),
      is_pass_enabled: true,
      language: Language::English,
      autosave: None,
      key_bindings: commands
        .into_iter()
        .zip(short_cuts.into_iter())
        .collect::<HashMap<String, String>>(),
      is_new: true,
    }
  }
}

pub struct Env(Mutex<Setting>);

#[derive(Debug, PartialEq, Clone)]
pub struct Memo {
  pub all_tags: HashSet<String>,
  pub page: usize
}
pub struct Casher(Mutex<Memo>);
impl Casher {
  pub fn new() -> Casher {
    Casher(Mutex::new(Memo {
      all_tags: HashSet::new(),
      page: 0usize
    }))
  }
}

pub struct MainWindow(Arc<Mutex<Window>>);
impl MainWindow {
  pub fn new(window: Window) -> MainWindow {
    MainWindow(Arc::new(Mutex::new(window)))
  }
}
pub struct HiddenWindow(Arc<Mutex<Window>>);
impl HiddenWindow {
  pub fn new(window: Window) -> HiddenWindow {
    HiddenWindow(Arc::new(Mutex::new(window)))
  }
}

fn root_path() -> PathBuf {
  dirs::home_dir()
    .unwrap_or(Path::new(".").to_path_buf())
    .join(constants::ROOT)
}

pub fn conf_path() -> PathBuf {
  root_path().join(constants::CONF)
}

pub fn index_path() -> PathBuf {
  root_path().join(constants::INDEX)
}

pub fn initialize() -> Env {
  let root = root_path();
  let conf = conf_path();
  let default_target = root.join(constants::DEFAULT_TARGET);
  let index = index_path();
  let mut is_new = false;

  if !root.exists() {
    is_new = true;
    DirBuilder::new()
      .create(root.clone())
      .unwrap();
    DirBuilder::new().create(default_target.clone()).unwrap();
    
    File::create(conf.clone())
        .and_then(|mut f| {
          f.write_all(
            serde_json::to_string(&Setting::default())
              .unwrap()
              .as_bytes(),
          )
        })
        .unwrap();
  
    File::create(index.clone()).unwrap();
  }

  if !default_target.exists() {
    if let Err(err) = DirBuilder::new().recursive(true).create(default_target) {
      println!(
        "WARNING: failed to create default target directry for\n{}",
        err.to_string()
      );
    }
  }

  if !conf.exists() {
    File::create(conf.clone())
      .and_then(|mut f| {
        f.write_all(
          serde_json::to_string(&Setting::default())
            .unwrap()
            .as_bytes(),
        )
      })
      .unwrap();
  }

  if !index.exists() {
    if let Err(err) = File::create(index) {
      println!(
        "WARNING: failed to create index directry for\n{}",
        err.to_string()
      );
    }
  }

  println!("devicename: {}", whoami::devicename());
  println!("distrobution: {}", whoami::distro());
  println!("hostname: {}", whoami::hostname());
  println!(
    "language: {}",
    whoami::lang().collect::<String>()
  );
  println!("realname: {}", whoami::realname());
  println!("platform: {}", whoami::platform());
  println!("hello {}!", whoami::username());
  let mut buf = String::new();
  let mut setting = match OpenOptions::new()
    .read(true)
    .write(false)
    .append(false)
    .open(conf)
    .map(|mut file| file.read_to_string(&mut buf).unwrap())
  {
    Ok(_) => Setting::from_string(&buf).unwrap_or_default(),
    Err(ref e) if e.kind() == ErrorKind::NotFound => Setting::default(),
    Err(e) => {
      panic!("{}", e.to_string());
    }
  };
  setting.is_new = is_new;

  Env(Mutex::new(setting))
}
