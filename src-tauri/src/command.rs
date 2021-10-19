use crate::model::Document;
use crate::Env;
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use tauri::State;

#[derive(Debug, PartialEq, serde::Serialize)]
pub struct Response {
  message: String,
}
impl Response {
  fn new<T: ToString + std::fmt::Debug>(message: T) -> Response {
    println!("{:?}", message);
    Response {
      message: message.to_string(),
    }
  }
}

#[tauri::command]
pub fn get_setting<'a>(env: State<Env>) -> Env {
  env.inner().clone()
}

#[tauri::command]
pub fn save_document(document: Document, env: State<Env>) -> Result<Response, Response> {
  let mut document = document;
  let filename = document.get_hashed_filename();
  document.stamp();

  let path = env.path_to_file(&filename);

  println!("file + {}", path.display());
  let mut file = if !document.can_overwrite() && path.exists() {
    Err(Response::new("File already exists"))
  } else {
    Ok(())
  }
  .and_then(|_| {
    OpenOptions::new()
      .write(true)
      .truncate(true)
      .create(true)
      .open(path.clone())
      .map_err(|err| Response::new(err))
  })?;

  println!("serialize");
  let document = serde_json::to_string(&document).map_err(|e| Response::new(e))?;
  println!("writing");
  match file.write_all(document.as_bytes()) {
    Ok(_) => Ok(Response::new("Successfully created")),
    Err(err) => Err(Response::new(err)),
  }
}

#[tauri::command]
pub fn get_document(filename: String, env: Env) -> Result<Document, Response> {
  let path = env.path_to_file(&filename);
  File::open(path)
    .map_err(|err| Response::new(err))
    .and_then(|mut file| {
      let mut buf = String::new();
      file
        .read_to_string(&mut buf)
        .map_err(|err| Response::new(err))?;
      Ok(serde_json::from_str::<'_, Document>(&buf).map_err(|err| Response::new(err))?)
    })
}
