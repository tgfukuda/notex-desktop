use super::model::Meta;
use super::{Casher, Env, HiddenWindow, Setting};
use std::{
  collections::HashSet,
  fs::{self, File, OpenOptions},
  io::{BufRead, BufReader, Write},
  path::{Path, PathBuf},
};
use tauri::State;

#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "code")]
enum Code {
  #[serde(rename = "200")]
  Success,
  #[serde(rename = "300")]
  Redirect,
  #[serde(rename = "400")]
  ClientError,
  #[serde(rename = "500")]
  ProcessError,
}

#[derive(Debug, PartialEq, Clone, serde::Serialize)]
pub struct Response {
  #[serde(flatten)]
  code: Code,
  message: String,
}
impl Response {
  pub fn new<T: ToString + std::fmt::Debug>(message: T) -> Response {
    println!("{:?}", message);
    Response {
      code: Code::Success,
      message: message.to_string(),
    }
  }

  pub fn client_error<T: ToString + std::fmt::Debug>(message: T) -> Response {
    println!("client error: {:?}", message);
    Response {
      code: Code::ClientError,
      message: message.to_string(),
    }
  }

  pub fn process_error<T: ToString + std::fmt::Debug>(message: T) -> Response {
    println!("process error: {:?}", message);
    Response {
      code: Code::ProcessError,
      message: format!("{}\n{}", "Internal Process Error", message.to_string()),
    }
  }
}

#[tauri::command]
pub fn get_setting(env: State<'_, Env>) -> Setting {
  match env.0.lock() {
    Ok(setting) => setting.clone(),
    Err(_) => get_setting(env.clone()),
  }
}

#[tauri::command]
pub fn update_setting(setting: Setting, env: State<'_, Env>) -> Result<Response, Response> {
  let conf = OpenOptions::new()
    .create(false)
    .write(true)
    .open(crate::conf_path())
    .map_err(Response::process_error)?;
  let mut inner = env.0.lock().map_err(Response::process_error)?;
  *inner = setting;
  match serde_json::to_writer(conf, &*inner) {
    Ok(_) => Ok(Response::new("Setting successfully updated.")),
    Err(_) => Err(Response::client_error("Invalid format")),
  }
}

/**
 * TODO -- update Cashe and Tags
 **/
#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct SaveDoc {
  overwrite: bool,
  meta: Meta,
  body: String,
}
#[tauri::command]
pub fn save_document(
  document: SaveDoc,
  env: State<'_, Env>,
  cashe: State<'_, Casher>,
) -> Result<Response, Response> {
  let setting = env.0.lock().map_err(Response::new)?.clone();
  let mut memo = cashe.0.lock().map_err(Response::process_error)?;
  let SaveDoc {
    overwrite,
    mut meta,
    body,
  } = document;
  meta.stamp();
  let filename = meta.get_hashed_filename();
  let mut new_index = vec![];

  let lines =
    BufReader::new(File::open(crate::index_path()).map_err(Response::process_error)?).lines();
  for line in lines {
    let line = line.map_err(Response::new)?;
    let line_meta = serde_json::from_str::<Meta>(&line).map_err(Response::process_error)?;
    if !line.is_empty() && meta.get_hashed_filename() != line_meta.get_hashed_filename() {
      new_index.push(line);
    }
  }
  new_index
    .push(serde_json::to_string(&meta).map_err(|_| Response::client_error("Invalid format."))?);

  let path = setting.path_to_file(&filename);
  OpenOptions::new()
    .write(true)
    .append(false)
    .truncate(true)
    .create_new(!overwrite)
    .open(path)
    .map_err(Response::process_error)
    .and_then(|mut writer| {
      writer
        .write_all(&body.as_bytes())
        .map_err(Response::process_error)
    })
    .and_then(|_| {
      OpenOptions::new()
        .write(true)
        .append(false)
        .truncate(true)
        .create(false)
        .open(crate::index_path())
        .map_err(Response::process_error)
    })
    .and_then(|mut writer| {
      writer
        .write_all(new_index.join("\n").as_bytes())
        .map_err(Response::process_error)
    })
    .map(|_| {
      memo.all_tags = memo
        .all_tags
        .union(&meta.get_into_tag().into_iter().collect())
        .map(|s| s.clone())
        .collect();
      memo.page += 1;
      println!("page: {}, all_tags: {:?}", memo.page, memo.all_tags);
      Response::new("File successfully saved")
    })
}

/**
 * TODO -- update Cashe and Tags
 **/
#[tauri::command]
pub fn delete_file(
  target: Meta,
  env: State<Env>,
  cashe: State<Casher>,
) -> Result<Response, Response> {
  let setting = env.0.lock().map_err(Response::process_error)?;
  let mut memo = cashe.0.lock().map_err(Response::process_error)?;
  let target_name = target.get_hashed_filename();
  let path = setting.path_to_file(&target_name);
  let mut new_index = vec![];
  let lines =
    BufReader::new(File::open(crate::index_path()).map_err(Response::process_error)?).lines();

  for line in lines {
    let line = line.map_err(Response::process_error)?;
    let meta = serde_json::from_str::<Meta>(&line).map_err(Response::process_error)?;
    if target_name != meta.get_hashed_filename() {
      new_index.push(line);
    }
  }

  fs::remove_file(path)
    .map_err(Response::process_error)
    .and_then(|_| {
      OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(crate::index_path())
        .map_err(Response::process_error)
    })
    .and_then(|mut writer| {
      writer
        .write_all(new_index.join("\n").as_bytes())
        .map_err(Response::process_error)
    })
    .map(|_| {
      memo.all_tags = memo
        .all_tags
        .difference(&target.get_into_tag().into_iter().collect())
        .map(|s| s.clone())
        .collect();
      if 0 < memo.page {
        memo.page -= 1;
      }
      println!("page: {}, all_tags: {:?}", memo.page, memo.all_tags);
      Response::new("File successfully deleted")
    })
}

#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct RequestDocs {
  offset: usize,
  limit: usize,
  filename_start: String,
  filename_contain: String,
  created_at: (String, String),
  updated_at: (String, String),
  tags: Vec<String>,
  author: String,
}
#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct ResponseDocs {
  list: Vec<Meta>,
  page: usize,
  all_tags: HashSet<String>,
}
#[tauri::command]
pub fn get_documents_by_filter(
  req: RequestDocs,
  cashe: State<Casher>,
) -> Result<ResponseDocs, Response> {
  let mut memo = cashe.0.lock().map_err(Response::process_error)?;
  let mut list = vec![];
  let RequestDocs {
    mut offset,
    limit,
    filename_start,
    filename_contain,
    created_at,
    updated_at,
    tags,
    author,
  } = req;
  let mut lines =
    BufReader::new(File::open(crate::index_path()).map_err(Response::process_error)?).lines();

  if memo.page == 0 {
    while let Some(line) = lines.next() {
      if 0 < offset {
        offset -= 1;
      }
      memo.page += 1;
      let meta = serde_json::from_str::<Meta>(&line.map_err(Response::process_error)?)
        .map_err(Response::process_error)?;
      if offset == 0
        && list.len() < limit
        && meta.filter_by_filename(&filename_start, &filename_contain)
        && meta
          .filter_by_created(&created_at.0, &created_at.1)
          .map_err(Response::process_error)?
        && meta
          .filter_by_updated(&updated_at.0, &updated_at.1)
          .map_err(Response::process_error)?
        && meta.filter_by_tags(&tags)
        && meta.filter_by_author(&author)
      {
        list.push(meta.clone())
      }
      memo.all_tags = memo
        .all_tags
        .union(&meta.get_into_tag().into_iter().collect::<HashSet<String>>())
        .map(|s| s.clone())
        .collect();
    }
    println!("page: {}, all_tags: {:?}", memo.page, memo.all_tags);
    Ok(ResponseDocs {
      list,
      page: memo.page,
      all_tags: memo.all_tags.clone(),
    })
  } else {
    while let Some(line) = lines.next() {
      if list.len() == limit {
        break;
      }

      let meta = serde_json::from_str::<Meta>(&line.map_err(Response::process_error)?)
        .map_err(Response::process_error)?;
      if meta.filter_by_filename(&filename_start, &filename_contain)
        && meta
          .filter_by_created(&created_at.0, &created_at.1)
          .map_err(Response::client_error)?
        && meta
          .filter_by_updated(&updated_at.0, &updated_at.1)
          .map_err(Response::client_error)?
        && meta.filter_by_tags(&tags)
        && meta.filter_by_author(&author)
        && list.len() < limit
      //must be unnecessary
      {
        if 0 < offset {
          offset -= 1;
        } else {
          list.push(meta);
        }
      }
    }
    println!("page: {}, all_tags: {:?}", memo.page, memo.all_tags);
    Ok(ResponseDocs {
      list,
      page: memo.page,
      all_tags: memo.all_tags.clone(),
    })
  }
}

#[tauri::command]
pub fn get_document(meta: Meta, env: State<Env>) -> Result<String, Response> {
  let setting = env.0.lock().map_err(Response::process_error)?;
  let path = setting.path_to_file(&meta.get_hashed_filename());
  fs::read_to_string(path).map_err(Response::process_error)
}

#[tauri::command]
pub fn ls_dir(search: &Path) -> Result<Vec<PathBuf>, Response> {
  let mut res = vec![];
  if !search.exists() || !search.is_dir() {
    Ok(res)
  } else {
    let list = fs::read_dir(search).map_err(Response::process_error)?;
    for path in list {
      let path = path.map_err(Response::process_error)?.path();
      if path.is_dir() {
        res.push(path)
      }
    }

    Ok(res)
  }
}

/*
 * finish this command don't mean whole process finish.
 * improve response with tauri event.
 */ 
#[derive(Debug, PartialEq, serde::Serialize)]
struct PayloadPDF<'a> {
  meta: Meta,
  body: &'a str,
}
#[tauri::command]
pub fn print(meta: Meta, body: &str, hidden: State<'_, HiddenWindow>) -> Result<(), Response> {
  let hidden = hidden.0.lock().map_err(Response::process_error)?;
  println!("{:?}, {}", meta, body);
  hidden
    .emit("print", PayloadPDF { meta, body })
    .map_err(Response::process_error)?;
  Ok(())
}

#[tauri::command]
pub fn html(meta: Meta, htmlsrc: &str, path: PathBuf) -> Result<(), Response> {
  if !path.exists() {
    return Err(Response::client_error("given path can't be found"));
  }

  if !path.is_dir() {
    return Err(Response::client_error("given path is not a directory"));
  }

  println!("{:?}\n{}\n{:?}", meta, htmlsrc, path);

  OpenOptions::new()
    .write(true)
    .truncate(true)
    .create(true)
    .open(path.join(&meta.get_hashed_html_name()))
    .map_err(Response::process_error)?
    .write_all(htmlsrc.as_bytes())
    .map_err(Response::process_error)
}
