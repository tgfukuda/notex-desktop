use super::model::Meta;
use super::{Casher, Env, Memo, Setting};
use std::{
  collections::HashSet,
  fs::{self, File, OpenOptions},
  io::{BufRead, BufReader, Write},
};
use tauri::State;

#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]
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

#[derive(Debug, PartialEq, serde::Serialize)]
pub struct Response {
  #[serde(flatten)]
  code: Code,
  message: String,
}
impl Response {
  fn new<T: ToString + std::fmt::Debug>(message: T) -> Response {
    println!("{:?}", message);
    Response {
      code: Code::Success,
      message: message.to_string(),
    }
  }

  fn client_error<T: ToString + std::fmt::Debug>(message: T) -> Response {
    println!("{:?}", message);
    Response {
      code: Code::ClientError,
      message: message.to_string(),
    }
  }

  fn process_error<T: ToString + std::fmt::Debug>(message: T) -> Response {
    println!("{:?}", message);
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
  let Memo {
    mut all_tags,
    mut page,
  } = cashe.0.lock().map_err(Response::process_error)?.clone();
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
      all_tags = all_tags
        .union(&meta.get_into_tag().into_iter().collect())
        .map(|s| s.clone())
        .collect();
      page += 1;
      println!("page: {}, all_tags: {:?}", page, all_tags);
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
  let Memo {
    mut all_tags,
    mut page,
  } = cashe.0.lock().map_err(Response::process_error)?.clone();
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

  println!("{:?}", new_index);

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
      all_tags = all_tags
        .difference(&target.get_into_tag().into_iter().collect())
        .map(|s| s.clone())
        .collect();
      if 0 < page {
        page -= 1;
      }
      println!("page: {}, all_tags: {:?}", page, all_tags);
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
  let Memo {
    mut all_tags,
    mut page,
  } = cashe.0.lock().map_err(Response::process_error)?.clone();
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

  if page == 0 {
    while let Some(line) = lines.next() {
      if 0 < offset {
        offset -= 1;
      }
      page += 1;
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
      all_tags = all_tags
        .union(&meta.get_into_tag().into_iter().collect::<HashSet<String>>())
        .map(|s| s.clone())
        .collect();
    }
    println!("page: {}, all_tags: {:?}", page, all_tags);
    Ok(ResponseDocs {
      list,
      page,
      all_tags,
    })
  } else {
    while let Some(line) = lines.next() {
      if list.len() == limit {
        break;
      }

      let meta = serde_json::from_str::<Meta>(&line.map_err(Response::process_error)?)
        .map_err(Response::process_error)?;
      if list.len() < limit //must be unnecessary
        && meta.filter_by_filename(&filename_start, &filename_contain)
        && meta
          .filter_by_created(&created_at.0, &created_at.1)
          .map_err(Response::client_error)?
        && meta
          .filter_by_updated(&updated_at.0, &updated_at.1)
          .map_err(Response::client_error)?
        && meta.filter_by_tags(&tags)
        && meta.filter_by_author(&author)
      {
        if 0 < offset {
          offset -= 1;
        } else {
          list.push(meta);
        }
      }
    }
    println!("page: {}, all_tags: {:?}", page, all_tags);
    Ok(ResponseDocs {
      list,
      page,
      all_tags,
    })
  }
}

#[tauri::command]
pub fn get_document(meta: Meta, env: State<Env>) -> Result<String, Response> {
  let setting = env.0.lock().map_err(Response::process_error)?;
  let path = setting.path_to_file(&meta.get_hashed_filename());
  fs::read_to_string(path).map_err(Response::process_error)
}
