use std::collections::HashMap;

#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
struct FunctionDomain {
  min: f64,
  max: f64,
  division: isize,
}
#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
#[serde(untagged)]
enum GraphData {
  FromFunction {
    func: String,
    domain: FunctionDomain,
  },
  Csv {
    path: String,
  },
}

#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "extention")]
enum ImageExtention {
  #[serde(rename = "png")]
  Png,
  #[serde(rename = "svg")]
  Svg,
  #[serde(rename = "jpg")]
  Jpg,
}
impl ToString for ImageExtention {
  fn to_string(&self) -> String {
    match self {
      ImageExtention::Png => String::from("png"),
      ImageExtention::Svg => String::from("svg"),
      ImageExtention::Jpg => String::from("jpg"),
    }
  }
}

#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
#[serde(untagged)]
enum ImageData {
  Uri {
    uri: String,
  },
  FromFile {
    #[serde(flatten)]
    extention: ImageExtention,
    path: String,
  },
}

#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
struct TableData {
  row_num: usize,
  column_num: usize,
  cells: Vec<Vec<String>>,
}

type DataId = String;
#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type_")]
enum NotexData {
  #[serde(rename = "graph")]
  Graph {
    data: GraphData,
    name: String,
  },
  #[serde(rename = "image")]
  Image {
    data: ImageData,
    name: String,
  },
  #[serde(rename = "table")]
  Table {
    data: TableData,
    name: String,
  },
}

type TimeStamp = String;
type Tag = String;
#[derive(Debug, PartialEq, Clone, serde::Serialize, serde::Deserialize)]
pub struct Meta {
  filename: String,
  created_at: TimeStamp,
  updated_at: Option<TimeStamp>,
  overwrite: bool,
  author: String,
  tag: Vec<Tag>,
  data: HashMap<DataId, NotexData>,
}

static FILE_EXTENTION: &str = ".min.json";

#[derive(Debug, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct Document {
  meta: Meta,
  body: String,
}
impl Document {
  pub fn get_hashed_filename(&self) -> String {
    use sha2::{Digest, Sha256};

    let mut hasher = Sha256::new();
    hasher.update(self.meta.filename.as_bytes());
    format!("{:x}{}", hasher.finalize(), FILE_EXTENTION)
  }

  pub fn stamp(&mut self) {
    use chrono::Local;

    if self.meta.created_at.is_empty() {
      self.meta.created_at = Local::now().to_rfc3339();
      self.meta.updated_at = None
    } else {
      self.meta.updated_at = Some(Local::now().to_rfc3339());
    }
  }

  pub fn can_overwrite(&self) -> bool {
    self.meta.overwrite
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use sha2::{Digest, Sha256};
  use std::{thread, time};

  fn get_random_key() -> String {
    let mut hasher = Sha256::new();
    hasher.update(chrono::Utc::now().to_rfc3339().as_bytes());
    format!("{:x}", hasher.finalize())
  }

  struct Setup {
    graph_ff: GraphData,
    graph_csv: GraphData,
    image_uri: ImageData,
    image_ff: ImageData,
    table: TableData,
    meta: Meta,
  }
  impl Setup {
    fn init() -> Setup {
      Setup {
        graph_ff: GraphData::FromFunction {
          func: String::from("sin(x) + log(x)"),
          domain: FunctionDomain {
            min: 0.0,
            max: 100.0,
            division: 100,
          },
        },
        graph_csv: GraphData::Csv {
          path: String::from("/some/test/path/example.txt"),
        },
        image_uri: ImageData::Uri {
          uri: String::from("https://example.com"),
        },
        image_ff: ImageData::FromFile {
          extention: ImageExtention::Png,
          path: String::from("/some/test/path/example.txt"),
        },
        table: TableData {
          row_num: 3,
          column_num: 2,
          cells: vec![
            vec![String::from("11"), String::from("12"), String::from("13")],
            vec![String::from("21"), String::from("22"), String::from("23")],
          ],
        },
        meta: Meta {
          filename: String::from("test file"),
          created_at: String::from("today"),
          updated_at: None,
          overwrite: false,
          author: String::from("me"),
          tag: vec![String::from("t1"), String::from("t2"), String::from("t3")],
          data: HashMap::new(),
        },
      }
    }

    fn get_notex_graph(&self) -> NotexData {
      NotexData::Graph {
        data: self.graph_ff.clone(),
        name: String::from("test notex graph"),
      }
    }

    fn get_notex_graph2(&self) -> NotexData {
      NotexData::Graph {
        data: self.graph_csv.clone(),
        name: String::from("test notex graph"),
      }
    }

    fn get_notex_image(&self) -> NotexData {
      NotexData::Image {
        data: self.image_ff.clone(),
        name: String::from("test notex image"),
      }
    }

    fn get_notex_image2(&self) -> NotexData {
      NotexData::Image {
        data: self.image_uri.clone(),
        name: String::from("test notex image"),
      }
    }

    fn get_notex_table(&self) -> NotexData {
      NotexData::Table {
        data: self.table.clone(),
        name: String::from("test notex table"),
      }
    }

    fn add_meta_data(&mut self, id: DataId, target: NotexData) {
      self.meta.data.insert(id, target);
    }

    fn move_filename_to(&mut self, target: &str) {
      self.meta.filename = String::from(target);
    }

    fn get_document(&self, body: String) -> Document {
      Document {
        meta: self.meta.clone(),
        body,
      }
    }

    fn build_raw_graph(graph: &GraphData) -> String {
      match graph {
        GraphData::FromFunction { func, domain } => format!(
          "{{\
            \"func\":\"{}\",\
            \"domain\":{{\
              \"min\":{:.1},\
              \"max\":{:.1},\
              \"division\":{}\
            }}\
          }}",
          func, domain.min, domain.max, domain.division
        ),
        GraphData::Csv { path } => format!(
          "{{\
            \"path\":\"{}\"\
          }}",
          path
        ),
      }
    }

    fn build_raw_image(image: &ImageData) -> String {
      match image {
        ImageData::Uri { uri } => format!(
          "{{\
            \"uri\":\"{}\"\
          }}",
          uri
        ),
        ImageData::FromFile { extention, path } => {
          format!(
            "{{\
              \"extention\":\"{}\",\
              \"path\":\"{}\"\
            }}",
            extention.to_string(),
            path
          )
        }
      }
    }

    fn build_raw_table(table: &TableData) -> String {
      format!(
        "{{\
          \"row_num\":{},\
          \"column_num\":{},\
          \"cells\":[{}]\
        }}",
        table.row_num,
        table.column_num,
        {
          let fmt = table.cells.iter().fold(String::new(), |mut vec, v| {
            let row = &v.iter().fold(String::new(), |mut acc, c| {
              acc.push_str(&format!("\"{}\",", c));
              acc
            });
            vec.push_str(&format!("[{}],", &row[..row.len() - 1]));
            vec
          });
          String::from(&fmt[..fmt.len() - 1])
        }
      )
    }

    fn build_raw_data(data: &NotexData) -> String {
      match data {
        NotexData::Graph {  data, name } => format!(
          "{{\
            \"type_\":\"{}\",\
            \"data\":{},\
            \"name\":\"{}\"\
          }}",
          "graph",
          Setup::build_raw_graph(data),
          name
        ),
        NotexData::Image { data, name } => format!(
          "{{\
            \"type_\":\"{}\",\
            \"data\":{},\
            \"name\":\"{}\"\
          }}",
          "image",
          Setup::build_raw_image(data),
          name
        ),
        NotexData::Table { data, name } => format!(
          "{{\
            \"type_\":\"{}\",\
            \"data\":{},\
            \"name\":\"{}\"\
          }}",
          "table",
          Setup::build_raw_table(data),
          name
        ),
      }
    }

    fn build_raw_meta(meta: &Meta) -> String {
      format!(
        "{{\
          \"filename\":\"{}\",\
          \"created_at\":\"{}\",\
          \"updated_at\":{},\
          \"overwrite\":{},\
          \"author\":\"{}\",\
          \"tag\":[{}],\
          \"data\":{{{}}}\
        }}",
        meta.filename,
        meta.created_at,
        match &meta.updated_at {
          Some(t) => t.clone(),
          None => String::from("null"),
        },
        meta.overwrite,
        meta.author,
        {
          let fmt = meta.tag.iter().fold(String::new(), |mut acc, c| {
            acc.push_str(&format!("\"{}\",", c));
            acc
          });
          String::from(&fmt[..fmt.len() - 1])
        },
        {
          let fmt = meta.data.iter().fold(String::new(), |mut acc, c| {
            acc.push_str(&format!("\"{}\":{},", c.0, Setup::build_raw_data(c.1)));
            acc
          });
          String::from(&fmt[..fmt.len() - 1])
        }
      )
    }

    fn build_raw_document(document: &Document) -> String {
      format!(
        "{{\
        \"meta\":{},\
        \"body\":\"{}\"\
        }}",
        Setup::build_raw_meta(&document.meta),
        document.body.replace("\\", "\\\\").replace("\n", "\\n") //this operation is only for the tests
      )
    }
  }

  #[test]
  fn graph_data_serde_test() {
    let setup = Setup::init();

    //ser
    assert_eq!(
      serde_json::to_string(&setup.graph_ff).unwrap(),
      Setup::build_raw_graph(&setup.graph_ff)
    );
    assert_eq!(
      serde_json::to_string(&setup.graph_csv).unwrap(),
      Setup::build_raw_graph(&setup.graph_csv)
    );

    //de
    assert_eq!(
      serde_json::from_str::<GraphData>(&Setup::build_raw_graph(&setup.graph_ff)).unwrap(),
      setup.graph_ff
    );
    assert_eq!(
      serde_json::from_str::<GraphData>(&Setup::build_raw_graph(&setup.graph_csv)).unwrap(),
      setup.graph_csv
    );
  }

  #[test]
  fn image_data_serde_test() {
    let setup = Setup::init();

    //ser
    assert_eq!(
      serde_json::to_string(&setup.image_ff).unwrap(),
      Setup::build_raw_image(&setup.image_ff)
    );
    assert_eq!(
      serde_json::to_string(&setup.image_uri).unwrap(),
      Setup::build_raw_image(&setup.image_uri)
    );

    //de
    assert_eq!(
      serde_json::from_str::<ImageData>(&Setup::build_raw_image(&setup.image_ff)).unwrap(),
      setup.image_ff
    );
    assert_eq!(
      serde_json::from_str::<ImageData>(&Setup::build_raw_image(&setup.image_uri)).unwrap(),
      setup.image_uri
    );
  }

  #[test]
  fn table_data_serde_test() {
    let setup = Setup::init();

    //ser
    assert_eq!(
      serde_json::to_string(&setup.table).unwrap(),
      Setup::build_raw_table(&setup.table)
    );

    //de
    assert_eq!(
      serde_json::from_str::<TableData>(&Setup::build_raw_table(&setup.table)).unwrap(),
      setup.table
    );
  }

  #[test]
  fn notex_data_serde_test() {
    let setup = Setup::init();

    //ser
    assert_eq!(
      serde_json::to_string(&setup.get_notex_graph()).unwrap(),
      Setup::build_raw_data(&setup.get_notex_graph())
    );
    assert_eq!(
      serde_json::to_string(&setup.get_notex_graph2()).unwrap(),
      Setup::build_raw_data(&setup.get_notex_graph2())
    );
    assert_eq!(
      serde_json::to_string(&setup.get_notex_image()).unwrap(),
      Setup::build_raw_data(&setup.get_notex_image())
    );
    assert_eq!(
      serde_json::to_string(&setup.get_notex_image2()).unwrap(),
      Setup::build_raw_data(&setup.get_notex_image2())
    );
    assert_eq!(
      serde_json::to_string(&setup.get_notex_table()).unwrap(),
      Setup::build_raw_data(&setup.get_notex_table())
    );

    //de
    assert_eq!(
      serde_json::from_str::<NotexData>(&Setup::build_raw_data(&setup.get_notex_graph())).unwrap(),
      setup.get_notex_graph()
    );
    assert_eq!(
      serde_json::from_str::<NotexData>(&Setup::build_raw_data(&setup.get_notex_graph2())).unwrap(),
      setup.get_notex_graph2()
    );
    assert_eq!(
      serde_json::from_str::<NotexData>(&Setup::build_raw_data(&setup.get_notex_image())).unwrap(),
      setup.get_notex_image()
    );
    assert_eq!(
      serde_json::from_str::<NotexData>(&Setup::build_raw_data(&setup.get_notex_image2())).unwrap(),
      setup.get_notex_image2()
    );
    assert_eq!(
      serde_json::from_str::<NotexData>(&Setup::build_raw_data(&setup.get_notex_table())).unwrap(),
      setup.get_notex_table()
    );
  }

  #[test]
  fn meta_serde_test() {
    let mut setup = Setup::init();
    setup.add_meta_data(get_random_key(), setup.get_notex_graph());
    thread::sleep(time::Duration::from_millis(10));
    setup.add_meta_data(get_random_key(), setup.get_notex_image());
    thread::sleep(time::Duration::from_millis(10));
    setup.add_meta_data(get_random_key(), setup.get_notex_table());

    //ser
    assert_eq!(
      serde_json::to_string(&setup.meta).unwrap(),
      Setup::build_raw_meta(&setup.meta)
    );

    //de
    assert_eq!(
      serde_json::from_str::<Meta>(&Setup::build_raw_meta(&setup.meta)).unwrap(),
      setup.meta
    );

    setup.add_meta_data(get_random_key(), NotexData::Graph {
      data: GraphData::Csv {
        path: String::from("./w/a/s/d"),
      },
      name: String::from("temp"),
    });

    //ser
    assert_eq!(
      serde_json::to_string(&setup.meta).unwrap(),
      Setup::build_raw_meta(&setup.meta)
    );

    //de
    assert_eq!(
      serde_json::from_str::<Meta>(&Setup::build_raw_meta(&setup.meta)).unwrap(),
      setup.meta
    );
  }

  #[test]
  fn document_serde_test() {
    let mut setup = Setup::init();
    setup.add_meta_data(get_random_key(), setup.get_notex_graph());
    thread::sleep(time::Duration::from_millis(10));
    setup.add_meta_data(get_random_key(), setup.get_notex_image());
    thread::sleep(time::Duration::from_millis(10));
    setup.add_meta_data(get_random_key(), setup.get_notex_table());
    let document = setup.get_document(
      "
    this is a test document.
    this is a test document.
    this is a test document.
    
    \\link[example link](https://example.com)
    crazy sort bubble pour
    json {
    key: value
    }"
      .to_string(),
    );

    //ser
    assert_eq!(
      serde_json::to_string(&document).unwrap(),
      Setup::build_raw_document(&document)
    );

    //de
    assert_eq!(
      serde_json::from_str::<Document>(&Setup::build_raw_document(&document)).unwrap(),
      document
    );
  }

  #[test]
  fn document_filename_hash_test() {
    let mut setup = Setup::init();

    //asserting sha256 with https://emn178.github.io/online-tools/sha256.html

    //default: test file
    assert_eq!(
      setup.get_document("".to_string()).get_hashed_filename(),
      format!(
        "{}{}",
        "9a30a503b2862c51c3c5acd7fbce2f1f784cf4658ccf8e87d5023a90c21c0714", FILE_EXTENTION
      )
    );

    setup.move_filename_to("crazy ambisious");
    assert_eq!(
      setup.get_document("".to_string()).get_hashed_filename(),
      format!(
        "{}{}",
        "b603b0dbb89ec4e02cbdace94ad2d8d5c006246e6eeaaac2d2b2151ba27ed78d", FILE_EXTENTION
      )
    );
  }
}
