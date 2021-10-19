import React, { useEffect, useRef, useState } from "react";
import { Grid, Button, InputBase } from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import useCommand from "../api/command";
import { useWrite, useAppDispatch, useSettings } from "../redux/hooks";
import { Write } from "../redux/write";
import useKeyAction from "../hooks/Keyboard";
import { EditableSection } from "../components/Section";
import { EditableParagraph } from "../components/Paragraph";
import List from "../components/List";
import { useSnackHandler } from "../context/SnackHandler";
import writeMsg from "../utils/constant/write/write";
import Graph from "../components/Graph";
import Image from "../components/Image";
import Table from "../components/Table";
import { v4 as uuidv4 } from "uuid";
import {TargetContextProvider, useTarget} from "../context/Target";

/**
 * this component enables to live edit
 * WIP
 * not completed
 */

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100vw",
    height: "100%",
    margin: theme.spacing(0.5),
  },
  innerInput: {
    width: "100%",
    height: "50%",
    backgroundColor: "red",
  },
  preview: {
    width: "100%",
    minHeight: "90vh",
    margin: theme.spacing(0.5),
    padding: theme.spacing(1),
    border: "2mm ridge rgba(255, 255, 255, .6)",
    overflowX: "scroll",
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

function isData(str: string, _type: string): boolean {
  if (str === _type + "()") return true;
  else return false;
}

function isListItem(str: string): boolean {
  return str.startsWith("- ");
}

const EditField: React.FC = () => {
  const classes = useStyles();
  const raw = useWrite().docs;
  const dispatch = useAppDispatch();
  const lastIndex = raw.length - 1;
  const lastElement = raw[lastIndex];
  const updater = (arg: string) => {
    let isSec = isSection(arg);
    if (isSec !== -1)
      dispatch(
        Write.addSection({
          header: arg.split(" ").slice(1).join(" "),
          depth: isSec,
        })
      );
    else if (isListItem(arg)) {
      if (lastElement?.type === "list")
        dispatch(
          Write.updateNode({
            id: lastIndex,
            node: {
              ...lastElement,
              items: [...lastElement.items, arg.slice("- ".length)],
            },
          })
        );
      else
        dispatch(
          Write.addList({
            items: [arg],
          })
        );
    } else if (isData(arg, "\\graph"))
      dispatch(
        Write.addData({
          uuid: uuidv4(),
          type: "graph",
        })
      );
    else if (isData(arg, "\\image"))
      dispatch(
        Write.addData({
          uuid: uuidv4(),
          type: "image",
        })
      );
    else if (isData(arg, "\\table"))
      dispatch(
        Write.addData({
          uuid: uuidv4(),
          type: "table",
        })
      );
    else {
      if (lastElement?.type === "paragraph") {
        if (arg)
          dispatch(
            Write.updateNode({
              id: lastIndex,
              node: {
                ...lastElement,
                contents: lastElement.contents + "\n" + arg,
              },
            })
          );
        else
          dispatch(
            Write.updateNode({
              id: lastIndex,
              node: {
                ...lastElement,
                contents: lastElement.contents + "\n",
              },
            })
          );
      } else {
        if (arg)
          dispatch(
            Write.addParagraph({
              contents: arg,
            })
          );
        else
          dispatch(
            Write.addParagraph({
              contents: "\n",
            })
          );
      }
    }
  };
  const [input, setInput] = useState("");
  const { ref, handleKeyDown, handleKeyUp } = useKeyAction(
    {
      line: 0,
      pos: 0,
    },
    (keyboard, e) => {
      if (ref.current) {
        if (keyboard["Enter"]) {
          e.preventDefault();
          updater(input);
          setInput("");
        }
      }
    }
  );
  const { current } = useTarget();

  useEffect(() => {
    console.log("current is ", current);
  }, [current]);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }

    return () => {
      dispatch(Write.clear());
    };
  }, []);

  return (
    <Grid item className={classes.preview}>
      {raw.map((value, id) => {
        if (!value) return <React.Fragment key={"unreachable" + id} />;
        switch (value.type) {
          case "section":
            return (
              <EditableSection
                id={id}
                type={value.type}
                header={value.header}
                depth={value.depth}
                edit={current === id}
              />
            );
          case "paragraph":
            return (
              <EditableParagraph
                id={id}
                type={value.type}
                contents={value.contents}
                indent={value.indent}
                edit={current === id}
              />
            );
          case "list":
            return (
              <List
                id={id}
                type={value.type}
                items={value.items}
                header={value.header}
                edit={current === id}
              />
            );
          case "graph":
            return (
              <Graph
                id={id}
                type={value.type}
                name={value.name}
                uuid={value.uuid}
                edit={current === id}
              />
            );
          case "image":
            return (
              <Image
                id={id}
                type={value.type}
                name={value.name}
                uuid={value.uuid}
                edit={current === id}
              />
            );
          case "table":
            return (
              <Table
                id={id}
                type={value.type}
                name={value.name}
                uuid={value.uuid}
                edit={current === id}
              />
            );
        }
      })}
      <InputBase
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        fullWidth
        className={classes.innerInput}
        inputRef={ref}
      />
    </Grid>
  );
};

type PostButtonProps = {
  inputRef: React.RefObject<HTMLInputElement>;
};
const PostButton: React.FC<PostButtonProps> = ({ inputRef }) => {
  const classes = useStyles();
  const state = useWrite();
  const { handleSuc, handleErr } = useSnackHandler();
  const { saveDocument } = useCommand();

  const handlePost = async () => {
    if (state?.meta?.filename)
      await saveDocument(
        state,
        "",
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
  const ref = useRef(null);

  return (
    <Grid
      container
      direction={"row"}
      justifyContent={"space-evenly"}
      alignItems={"stretch"}
      className={classes.root}
    >
      <TargetContextProvider>
      <EditField />
      </TargetContextProvider>
      <PostButton inputRef={ref} />
    </Grid>
  );
};

export default Edit;
