#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

extern crate app;

use app::{
  cmd::{self, Response},
  Casher, HiddenWindow, MainWindow,
};
use std::{fs, thread, time};
use tauri::{CustomMenuItem, Manager, Menu, Window, WindowEvent};

/*
* event "success", "fail" is setup on frontend -- see /src/pages/Top.tsx
*/
fn emit_success(main_window: &Window, msg: Response) {
  match main_window.emit("success", msg.clone()) {
    Ok(()) => (),
    Err(_) => emit_success(main_window, msg),
  }
}
fn emit_fail(main_window: &Window, err: Response) {
  match main_window.emit("fail", err.clone()) {
    Ok(()) => (),
    Err(_) => emit_fail(main_window, err.clone()),
  }
}

#[derive(Debug, PartialEq, serde::Serialize)]
struct Template<'a> {
  html: &'a str,
  css: &'a str,
  js: &'a str,
}

fn main() {
  let fail_msg = "error while running tauri application";
  let main_menu = {
    let new = CustomMenuItem::new(String::from("new"), "New");
    let browse = CustomMenuItem::new(String::from("browse"), "Browse");
    let setting = CustomMenuItem::new(String::from("setting"), "Setting");
    Menu::new().add_item(new).add_item(browse).add_item(setting)
  };
  let context = tauri::generate_context!();

  tauri::Builder::default()
    .menu(main_menu)
    .setup(move |app| {
      let main_window = app.get_window("main").expect(fail_msg);
      let main_window_ = main_window.clone();
      main_window.on_menu_event(move |e| {
        println!("eventId: {}", e.menu_item_id());
        match e.menu_item_id() {
          "new" => match main_window_.emit("routing", "/write") {
            Ok(()) => (),
            Err(err) => println!("{}", err),
          },
          "browse" => match main_window_.emit("routing", "/browse") {
            Ok(()) => (),
            Err(err) => println!("{}", err),
          },
          "setting" => match main_window_.emit("routing", "/setting") {
            Ok(()) => (),
            Err(err) => println!("{}", err),
          },
          _ => (),
        }
      });

      let hidden_window = app.get_window("hidden").expect(fail_msg);
      let main_window_ = main_window.clone();
      let hidden_window_ = hidden_window.clone();
      /*
       * event "ready" is emitted when emitting event "print" and the setup finish,
       * that is, the hidden web page's js loading and executing finish.
       * see, cmd::print and /src/page/Listner.tsx
       */
      hidden_window.listen("ready", move |e| {
        if let Some(status) = e.payload() {
          if status == "success" {
            emit_success(&main_window_, Response::new("preparing printer..."));
            thread::sleep(time::Duration::from_millis(2000));
            /*
             * if hidden window would not be showed once, the page execution is still not complete
             * though the reason is unknown.
             * the problem may be tauri's hidden window processing but not sure (also may be frontend implementation).
             * need splitting process more to get what the problem is.
             */
            match hidden_window_
              .show()
              .and_then(|_| hidden_window_.print())
              .and_then(|_| hidden_window_.hide())
            {
              Ok(()) => (),
              Err(err) => emit_fail(&main_window_, Response::process_error(err)),
            }
          } else {
            emit_fail(&main_window_, Response::process_error(status))
          }
        }
      });

      let html = fs::read_to_string(
        app
          .path_resolver()
          .resource_dir()
          .expect("unknown error")
          .join("assets/template.html"),
      )
      .unwrap();
      let css = fs::read_to_string(
        app
          .path_resolver()
          .resource_dir()
          .expect("unknown error")
          .join("assets/template.css"),
      )
      .unwrap()
      .replace("\n", "");
      let js = fs::read_to_string(
        app
          .path_resolver()
          .resource_dir()
          .expect("unknown error")
          .join("assets/template.js"),
      )
      .unwrap()
      .replace("\n", "");
      let main_window_ = main_window.clone();
      main_window.listen("template", move |_| {
        let html = &html;
        let css = &css;
        let js = &js;
        main_window_
          .emit("return_template", Template { html, css, js })
          .unwrap();
      });

      let main_window_ = main_window.clone();
      let hidden_window_ = hidden_window.clone();
      main_window.on_window_event(move |e| match e {
        WindowEvent::CloseRequested => {
          println!("close requested");
          hidden_window_.close().unwrap();
          main_window_.close().unwrap();
        }
        _ => (),
      });

      app.manage(HiddenWindow::new(hidden_window.clone()));
      app.manage(MainWindow::new(main_window.clone()));

      Ok(())
    })
    .manage(app::initialize())
    .manage(Casher::new())
    .invoke_handler(tauri::generate_handler![
      cmd::get_setting,
      cmd::update_setting,
      cmd::save_document,
      cmd::delete_file,
      cmd::get_documents_by_filter,
      cmd::get_document,
      cmd::ls_dir,
      cmd::print,
      cmd::html
    ])
    .run(context)
    .expect(fail_msg);
}
