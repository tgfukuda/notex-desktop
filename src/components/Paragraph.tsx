import React, { useEffect, useState } from "react";
import { InputBase } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { ParagraphType, Write } from "../redux/write";
import { useAppDispatch } from "../redux/hooks";
import ParseMd from "./ParseMd";
import useKeyAction from "../hooks/Keyboard";
import { useTarget } from "../context/Target";

const useStyles = makeStyles((theme) => ({
  root: (props: { indent: number }) => ({
    width: `calc(99.5% - ${theme.spacing(props.indent + 1)})`,
    margin: theme.spacing(0.2),
    padding: theme.spacing(0.2),
    marginLeft: theme.spacing(props.indent + 1),
  }),
}));

type ParagraphProps = { id: number; edit: boolean } & ParagraphType;

export const EditableParagraph: React.FC<ParagraphProps> = ({
  id,
  type,
  contents,
  indent,
  edit,
}) => {
  const classes = useStyles({ indent: indent });
  const dispatch = useAppDispatch();
  const emit = (arg: string) =>
    dispatch(
      Write.updateNode({
        id: id,
        node: {
          type: type,
          contents: arg,
          indent: indent,
        },
      })
    );
  const deleter = () => dispatch(Write.deleteNode(id));
  const { next, pre, update } = useTarget();
  const { ref, handleKeyDown, handleKeyUp } = useKeyAction(
    {
      line: 0,
      pos: 0,
    },
    (keyboard, e) => {
      if (ref.current) {
        if (keyboard["Tab"]) {
          e.preventDefault();
          keyboard = {};
          emit(contents);
          next();
        } else if (keyboard["Shift"] && keyboard["Tab"]) {
          e.preventDefault();
          keyboard = {};
          emit(contents);
          pre();
        } else if (keyboard["Backspace"] && !contents) {
          deleter();
        }
      }
    }
  );

  useEffect(() => {
    if (ref.current && edit) {
      ref.current.focus();
    }
  });

  return edit ? (
    <InputBase
      multiline
      fullWidth
      value={contents}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onChange={(e) => emit(e.target.value)}
      onBlur={(e) => {
        emit(e.target.value);
        update(-1);
      }}
      inputRef={ref}
      classes={{
        root: classes.root,
      }}
    />
  ) : (
    <p className={classes.root} onClick={() => update(id)}>
      <ParseMd str={contents} id={id.toString()} type={type} deps={[indent]} />
    </p>
  );
};

const Paragraph: React.FC<ParagraphProps> = ({
  id,
  type,
  contents,
  indent,
}) => {
  const classes = useStyles({ indent: indent });

  return (
    <p className={classes.root}>
      <ParseMd str={contents} id={id.toString()} type={type} deps={[indent]} />
    </p>
  );
};

export default Paragraph;
