import React, { useEffect, useRef } from "react";
import { Typography, InputBase } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Variant } from "@material-ui/core/styles/createTypography";
import { SectionType, Write } from "../redux/write";
import { useAppDispatch } from "../redux/hooks";
import useScroll from "../hooks/Scroll";
import sectionMsg from "../utils/constant/write/section";
import { useSettings } from "../redux/hooks";
import useKeyAction from "../hooks/Keyboard";
import { useTarget } from "../context/Target";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "99.5%",
    minHeight: theme.typography.fontSize * 2,
    margin: theme.spacing(0.2),
    padding: theme.spacing(0.2),
  },
  linkToNoFixed: {
    marginTop: "-8vh",
    paddingTop: "8vh",
    visibility: "hidden",
    height: 0,
  },
  subject: {
    borderBottomWidth: "2px",
    borderBottomColor: theme.palette.divider,
    borderBottomStyle: "solid",
    padding: theme.spacing(0.5),
  },
  title: {
    borderBottomWidth: "2px",
    borderBottomColor: theme.palette.divider,
    borderBottomStyle: "solid",
  },
}));

type SectionProps = { id: number; edit: boolean } & SectionType;

export const EditableSection: React.FC<SectionProps> = ({
  id,
  type,
  header,
  depth,
  edit,
}) => {
  const dispatch = useAppDispatch();
  const { next, pre, update } = useTarget();
  const emit = (arg: string) =>
    dispatch(
      Write.updateNode({
        id: id,
        node: {
          type: type,
          header: arg,
          depth: depth,
        },
      })
    );
  const deleter = () => dispatch(Write.deleteNode(id));
  const { ref, handleKeyDown, handleKeyUp } = useKeyAction(
    {
      line: 0,
      pos: header.length - 1,
    },
    (keyboard, e) => {
      if (ref.current) {
        if (keyboard["Enter"]) {
          e.preventDefault();
          keyboard = {};
          emit(header);
          next();
        } else if (keyboard["Tab"] && keyboard["Shift"]) {
          e.preventDefault();
          keyboard = {};
          emit(header);
          pre();
        } else if (keyboard["Tab"]) {
          e.preventDefault();
          keyboard = {};
          emit(header);
          next();
        } else if (keyboard["Backspace"] && !header) {
          deleter();
          pre();
        }
      }
    }
  );
  const { addEl, removeEl } = useScroll();
  const classes = useStyles();
  const sectionMsgs = sectionMsg(useSettings().language);

  useEffect(() => {
    addEl(id, ref);

    return () => removeEl(id);
  }, []);

  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, [edit]);

  return (
    <Typography
      id={"section_title_of_" + id}
      variant={4 < depth ? "h6" : (("h" + (depth + 2)) as Variant)}
      onClick={() => update(id)}
      className={
        classes.root + " " + (depth === 0 ? classes.subject : classes.title)
      }
    >
      {edit ? (
        <InputBase
          value={header}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onChange={(e) => emit(e.target.value)}
          fullWidth
          ref={ref}
        />
      ) : depth === 0 ? (
        header || sectionMsgs.subject
      ) : (
        "  ".repeat(depth) + " " + (header || sectionMsgs.title)
      )}
    </Typography>
  );
};

const Section: React.FC<SectionProps> = ({ id, type, header, depth }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { addEl, removeEl } = useScroll();
  const classes = useStyles();
  const sectionMsgs = sectionMsg(useSettings()["language"]);

  useEffect(() => {
    addEl(id, ref);

    return () => removeEl(id);
  }, []);

  return (
    <Typography
      id={"section_title_of_" + id}
      variant={4 < depth ? "h6" : (("h" + (depth + 2)) as Variant)}
      ref={ref}
      className={
        classes.root + " " + (depth === 0 ? classes.subject : classes.title)
      }
    >
      {depth === 0
        ? header || sectionMsgs.subject
        : "  ".repeat(depth) + " " + (header || sectionMsgs.title)}
    </Typography>
  );
};

export default Section;
