use super::constants::{TARGET_EXTENTION, TIME_FORMAT};
use chrono::{offset::TimeZone, Duration, Local};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

type TimeStamp = String;
type Tag = String;
#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
pub struct Meta {
  filename: String,
  created_at: TimeStamp,
  updated_at: Option<TimeStamp>,
  author: String,
  tags: Vec<Tag>,
  shortcut: HashMap<String, String>,
}
impl Meta {
  pub fn get_hashed_filename(&self) -> String {
    let mut hasher = Sha256::new();
    hasher.update(self.filename.as_bytes());
    format!("{:x}{}", hasher.finalize(), TARGET_EXTENTION)
  }

  pub fn get_hashed_html_name(&self) -> String {
    let mut hasher = Sha256::new();
    hasher.update(self.filename.as_bytes());
    format!("{:x}{}", hasher.finalize(), ".html")
  }

  pub fn get_into_tag(self) -> Vec<String> {
    self.tags
  }

  pub fn stamp(&mut self) {
    if self.created_at.is_empty() {
      self.created_at = Local::now().format(TIME_FORMAT).to_string();
      self.updated_at = None;
    } else {
      self.updated_at = Some(Local::now().format(TIME_FORMAT).to_string());
    }
  }

  pub fn filter_by_filename(&self, start: &str, contain: &str) -> bool {
    if start.is_empty() && contain.is_empty() {
      true
    } else if start.is_empty() {
      self.filename.contains(contain)
    } else if contain.is_empty() {
      self.filename.starts_with(start)
    } else {
      self.filename.contains(contain) && self.filename.starts_with(start)
    }
  }

  pub fn filter_by_created(&self, min: &str, max: &str) -> chrono::ParseResult<bool> {
    let min = Local
      .datetime_from_str(min, TIME_FORMAT)
      .unwrap_or((chrono::MIN_DATETIME + Duration::days(2)).with_timezone(&Local));
    let max = Local
      .datetime_from_str(max, TIME_FORMAT)
      .unwrap_or((chrono::MAX_DATETIME - Duration::days(2)).with_timezone(&Local));

    let created = Local.datetime_from_str(&self.created_at, TIME_FORMAT)?;

    Ok(min <= created && created <= max)
  }

  pub fn filter_by_updated(&self, min: &str, max: &str) -> chrono::ParseResult<bool> {
    if let Some(updated_at) = self.updated_at.clone() {
      let min = Local
        .datetime_from_str(min, TIME_FORMAT)
        .unwrap_or((chrono::MIN_DATETIME + Duration::days(2)).with_timezone(&Local));
      let max = Local
        .datetime_from_str(max, TIME_FORMAT)
        .unwrap_or((chrono::MAX_DATETIME - Duration::days(2)).with_timezone(&Local));

      let created = Local.datetime_from_str(&updated_at, TIME_FORMAT)?;

      Ok(min <= created && created <= max)
    } else {
      Ok(true)
    }
  }

  pub fn filter_by_tags(&self, tags: &Vec<String>) -> bool {
    if tags.len() == 0 {
      true
    } else {
      let mut intersection = self.tags.iter().filter(|t| tags.contains(&t));
      intersection.next().is_some()
    }
  }
  pub fn filter_by_author(&self, author: &str) -> bool {
    if author.len() == 0 {
      true
    } else {
      &self.author == author
    }
  }
}

#[cfg(test)]
pub mod tests {
  use super::*;
  use sha2::{Digest, Sha256};
  use std::{thread, time};

  pub fn get_random_key() -> String {
    let mut hasher = Sha256::new();
    hasher.update(chrono::Utc::now().to_rfc3339().as_bytes());
    format!("{:x}", hasher.finalize())
  }

  pub struct Setup {
    meta: Meta,
  }
  impl Setup {
    pub fn init() -> Setup {
      Setup {
        meta: Meta {
          filename: String::from("test file"),
          created_at: String::from(""),
          updated_at: None,
          author: String::from("me"),
          tags: vec![String::from("t1"), String::from("t2"), String::from("t3")],
          shortcut: HashMap::new(),
        },
      }
    }

    pub fn get_meta(&self) -> &Meta {
      &self.meta
    }

    pub fn get_meta_mut(&mut self) -> &mut Meta {
      &mut self.meta
    }

    fn add_meta_shortcut(&mut self, id: String, target: String) {
      self.meta.shortcut.insert(id, target);
    }

    fn move_filename_to(&mut self, target: &str) {
      self.meta.filename = String::from(target);
    }

    pub fn build_raw_meta(meta: &Meta) -> String {
      format!(
        "{{\
          \"filename\":\"{}\",\
          \"created_at\":\"{}\",\
          \"updated_at\":{},\
          \"author\":\"{}\",\
          \"tags\":[{}],\
          \"shortcut\":{{{}}}\
        }}",
        meta.filename,
        meta.created_at,
        match &meta.updated_at {
          Some(t) => format!("\"{}\"", t.clone()),
          None => String::from("null"),
        },
        meta.author,
        {
          let fmt = meta.tags.iter().fold(String::new(), |mut acc, c| {
            acc.push_str(&format!("\"{}\",", c));
            acc
          });
          String::from(&fmt[..fmt.len() - 1])
        },
        {
          let fmt = meta.shortcut.iter().fold(String::new(), |mut acc, c| {
            acc.push_str(&format!("\"{}\":\"{}\",", c.0, c.1));
            acc
          });
          String::from(&fmt[..if fmt.len() > 0 { fmt.len() - 1 } else { 0 }])
        }
      )
    }
  }

  #[test]
  fn meta_serde_test() {
    let mut setup = Setup::init();
    setup.add_meta_shortcut(get_random_key(), get_random_key());
    thread::sleep(time::Duration::from_millis(10));
    setup.add_meta_shortcut(get_random_key(), get_random_key());
    thread::sleep(time::Duration::from_millis(10));
    setup.add_meta_shortcut(get_random_key(), get_random_key());

    //ser
    assert_eq!(
      serde_json::to_string(setup.get_meta()).unwrap(),
      Setup::build_raw_meta(setup.get_meta())
    );

    //de
    assert_eq!(
      serde_json::from_str::<Meta>(&Setup::build_raw_meta(setup.get_meta())).unwrap(),
      *setup.get_meta()
    );
  }

  #[test]
  fn meta_stamp_test() {
    let mut setup = Setup::init();
    setup.get_meta_mut().stamp();
    //ser
    assert_eq!(
      serde_json::to_string(setup.get_meta()).unwrap(),
      Setup::build_raw_meta(setup.get_meta())
    );

    //de
    assert_eq!(
      serde_json::from_str::<Meta>(&Setup::build_raw_meta(setup.get_meta())).unwrap(),
      *setup.get_meta()
    );

    setup.get_meta_mut().stamp();

    //ser
    assert_eq!(
      serde_json::to_string(setup.get_meta()).unwrap(),
      Setup::build_raw_meta(setup.get_meta())
    );

    //de
    assert_eq!(
      serde_json::from_str::<Meta>(&Setup::build_raw_meta(setup.get_meta())).unwrap(),
      *setup.get_meta()
    );
  }

  #[test]
  fn meta_filename_hash_test() {
    let mut setup = Setup::init();

    //asserting sha256 with https://emn178.github.io/online-tools/sha256.html

    //default: test file
    assert_eq!(
      setup.get_meta().get_hashed_filename(),
      format!(
        "{}{}",
        "9a30a503b2862c51c3c5acd7fbce2f1f784cf4658ccf8e87d5023a90c21c0714", TARGET_EXTENTION
      )
    );

    setup.move_filename_to("crazy ambisious");
    assert_eq!(
      setup.get_meta().get_hashed_filename(),
      format!(
        "{}{}",
        "b603b0dbb89ec4e02cbdace94ad2d8d5c006246e6eeaaac2d2b2151ba27ed78d", TARGET_EXTENTION
      )
    );
  }
}
