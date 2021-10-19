import React, { useEffect, useRef, useState } from "react";
import { InputBase, Grid, Button } from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import useCommand from "../api/command";
import { useWrite, useAppDispatch, useSettings } from "../redux/hooks";
import { Write } from "../redux/write";
import Section from "../components/Section";
import Paragraph from "../components/Paragraph";
import List from "../components/List";
import { useSnackHandler } from "../context/SnackHandler";
import writeMsg from "../utils/constant/write/write";
import Graph from "../components/Graph";
import Image from "../components/Image";
import Table from "../components/Table";
import { v4 as uuidv4 } from "uuid";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100vw",
    height: "100%",
    margin: theme.spacing(0.5),
  },
  scrollable: {
    height: "90vh",
    overflow: "scroll",
    "&::-webkit-scrollbar": {
      width: "6px",
      height: "6px",
      backgroundColor: "#F5F5F5",
    },
    "&::-webkit-scrollbar-thumb": {
      borderRadius: "5px",
      "-webkit-box-shadow": "inset 0 0 6px rgba(0, 0, 0, 0.1)",
      backgroundImage:
        "-webkit-gradient(linear, left bottom, left top, from(#30cfd0), to(#330867))",
    },
  },
  rawInput: {
    width: "40%",
    margin: theme.spacing(0.5),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.common.white,
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: theme.shape.borderRadius,
    cursor: "text",
  },
  innerInput: {
    width: "100%",
    minHeight: "100%",
  },
  preview: {
    width: "55%",
    margin: theme.spacing(0.5),
    padding: theme.spacing(1),
    border: "2mm ridge rgba(255, 255, 255, .6)",
  },
  save: {
    backgroundColor: theme.palette.success.main,
    minWidth: "90%",
    margin: theme.spacing(0, 0.3, 0, 1.5),
    "&:hover": {
      backgroundColor: alpha(theme.palette.success.main, 0.5),
    },
  },
}));

function isSection(str: string): number {
  let depth = -1;
  for (const chr of str) {
    if (chr === "#") {
      depth++;
    } else if (0 <= depth && chr === " ") {
      return depth;
    } else break;
  }

  return -1;
}

function isData(str: string, _type: string, id: string) {
  if (str === _type + "()") {
    return uuidv4();
  } else if (
    str.startsWith(_type) &&
    str.length === _type.length + id.length + 2
  ) {
    return id;
  } else return "";
}

function isListItem(str: string): boolean {
  return str.startsWith("- ");
}

type RawInputProps = {
  data: string;
  setData: React.Dispatch<React.SetStateAction<string>>;
};
const RawInput: React.FC<RawInputProps> = ({ data, setData }) => {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const [load, setLoad] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const handleClick = () => ref.current?.focus();

  useEffect(() => {
    dispatch(Write.clear());
    setLoad(false);
    let lines = data.split("\n");
    let depth = 0;
    var flag: string | number;
    let acc = "";
    let items = [];
    let gen = [];

    for (const line of lines) {
      if (isListItem(line)) {
        if (acc) {
          dispatch(
            Write.addParagraph({
              contents: acc,
              indent: depth,
            })
          );
          acc = "";
        }
        gen.push(line);
        items.push(line.slice("- ".length));
        continue;
      } else if (items.length) {
        dispatch(Write.addList({ items }));
        items = [];
      }

      flag = isSection(line);
      if (flag !== -1) {
        gen.push(line);
        if (acc) {
          dispatch(
            Write.addParagraph({
              contents: acc,
              indent: depth,
            })
          );
          acc = "";
        }
        depth = flag;
        dispatch(
          Write.addSection({
            header: line.slice(depth + 1),
            depth: depth,
          })
        );
        continue;
      }

      flag = isData(
        line,
        "\\table",
        line.slice("\\table".length + 1, "\\table".length + 36 + 1)
      );
      if (flag) {
        if (acc) {
          dispatch(
            Write.addParagraph({
              contents: acc,
              indent: depth,
            })
          );
          acc = "";
        }
        gen.push("\\table(" + flag + ")");
        dispatch(
          Write.addData({
            uuid: flag,
            type: "table",
            name: "",
          })
        );
        continue;
      }

      flag = isData(
        line,
        "\\image",
        line.slice("\\image".length + 1, "\\image".length + 36 + 1)
      );
      if (flag) {
        if (acc) {
          dispatch(
            Write.addParagraph({
              contents: acc,
              indent: depth,
            })
          );
          acc = "";
        }
        gen.push("\\image(" + flag + ")");
        dispatch(
          Write.addData({
            uuid: flag,
            type: "image",
            name: "",
          })
        );
        continue;
      }

      flag = isData(
        line,
        "\\graph",
        line.slice("\\graph".length + 1, "\\graph".length + 36 + 1)
      );
      if (flag) {
        if (acc) {
          dispatch(
            Write.addParagraph({
              contents: acc,
              indent: depth,
            })
          );
          acc = "";
        }
        gen.push("\\graph(" + flag + ")");
        dispatch(
          Write.addData({
            uuid: flag,
            type: "graph",
            name: "",
          })
        );
        continue;
      }

      gen.push(line);
      acc += line + "\n";
    }

    if (items.length) {
      dispatch(Write.addList({ items }));
    }

    if (acc) {
      dispatch(
        Write.addParagraph({
          contents: acc,
          indent: depth,
        })
      );
    }

    setData(gen.join("\n"));
  }, [load]);

  return (
    <Grid
      item
      className={classes.rawInput + " " + classes.scrollable}
      onClick={handleClick}
    >
      <InputBase
        value={data}
        multiline
        fullWidth
        minRows={5}
        onChange={(e) => {
          setData(e.target.value);
          setLoad(true);
        }}
        inputRef={ref}
      />
    </Grid>
  );
};

const Preview: React.FC = () => {
  const classes = useStyles();
  const state = useWrite();
  const keys = state.docs;

  return (
    <Grid item className={classes.preview + " " + classes.scrollable}>
      {keys.map((value, id) => {
        if (!value) return <React.Fragment key={"unreachable" + id} />;
        switch (value.type) {
          case "section":
            return (
              <Section
                id={id}
                type={value.type}
                header={value.header}
                depth={value.depth}
                edit={false}
                key={value.type + "_" + id}
              />
            );
          case "paragraph":
            return (
              <Paragraph
                id={id}
                type={value.type}
                contents={value.contents}
                indent={value.indent}
                edit={false}
                key={value.type + "_" + id}
              />
            );
          case "list":
            return (
              <List
                id={id}
                type={value.type}
                items={value.items}
                header={value.header}
                edit={false}
                key={value.type + "_" + id}
              />
            );
          case "graph":
            return (
              <Graph
                id={id}
                type={value.type}
                name={value.name}
                uuid={value.uuid}
                edit={false}
                key={value.type + "_" + id}
              />
            );
          case "image":
            return (
              <Image
                id={id}
                type={value.type}
                name={value.name}
                uuid={value.uuid}
                edit={false}
                key={value.type + "_" + id}
              />
            );
          case "table":
            return (
              <Table
                id={id}
                type={value.type}
                name={value.name}
                uuid={value.uuid}
                edit={false}
                key={value.type + "_" + id}
              />
            );
        }
      })}
    </Grid>
  );
};

type PostButtonProps = {
  data: string;
  inputRef: React.RefObject<HTMLInputElement>;
};
const PostButton: React.FC<PostButtonProps> = ({ data, inputRef }) => {
  const classes = useStyles();
  const state = useWrite();
  const { handleSuc, handleErr } = useSnackHandler();
  const { saveDocument } = useCommand();

  const handlePost = async () => {
    if (state?.meta?.filename)
      await saveDocument(
        state,
        data,
        (res) => handleSuc(res.message),
        (err) => handleErr(err.message)
      );
    else {
      handleErr("File Name must contain at least one character");
      inputRef.current?.focus();
    }
  };

  return (
    <Grid
      item
      component={Button}
      onClick={handlePost}
      className={"success " + classes.save}
    >
      {writeMsg(useSettings().language).save}
    </Grid>
  );
};

const Edit: React.FC = () => {
  const classes = useStyles();
  const [data, setData] = useState("");
  const ref = useRef(null);

  return (
    <Grid
      container
      direction={"row"}
      justifyContent={"space-evenly"}
      alignItems={"stretch"}
      className={classes.root}
    >
      <RawInput data={data} setData={setData} />
      <Preview />
      <PostButton data={data} inputRef={ref} />
    </Grid>
  );
};

export default Edit;
