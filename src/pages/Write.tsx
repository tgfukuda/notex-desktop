/** @jsxImportSource @emotion/react */
import React, {
  ChangeEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router";
import { css, useTheme, Theme } from "@emotion/react";
import { alpha } from "@mui/material/styles";
import {
  InputBase,
  Grid,
  Paper,
  Chip,
  TextField,
  Collapse,
  FormControlLabel,
  Switch,
  Button,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ImageIcon from "@mui/icons-material/Image";
import LoopIcon from "@mui/icons-material/Loop";
import useCommand, { Response } from "../api/command";
import { useSettings } from "../redux/hooks";
import { Meta } from "../redux/write";
import { useSnackHandler } from "../context/SnackHandler";
import useKeyAction, { useNativeKeyAction } from "../hooks/Keyboard";
import writeMsg from "../utils/constant/write/write";
import Markdown from "../components/Markdown";
import { Z_INDEXES } from "../utils/constant/util";

const contentsHeight = 80;
const hoverAlpha = 0.5;

const scrollable = css`
  height: ${contentsHeight}vh;
  overflow: scroll;
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
    background-color: #f5f5f5;
  }
  &::-webkit-scrollbar-thumb {
    borderradius: 5px;
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
    background-image: -webkit-gradient(
      linear,
      left bottom,
      left top,
      from(#30cfd0),
      to(#330867)
    );
  }
`;

const useFileControll = (handleBlobUrl: (url: string) => void) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const reader = new FileReader();
  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (e.target && typeof e.target.result === "string")
      handleBlobUrl(e.target.result);
  };
  const handleChange = (_: ChangeEvent) => {
    if (fileRef.current && fileRef.current.files?.length)
      reader.readAsDataURL(fileRef.current.files[0]);
  };

  return {
    fileRef,
    handleChange,
  };
};

const buttonIconDefault = (theme: Theme) => css`
  min-width: 5%;
  height: 100%;
  padding: ${theme.spacing(0.2, 1)};
  background-color: ${theme.palette.info.main};
  vertical-align: middle;
  &:hover {
    background-color: ${alpha(theme.palette.info.main, hoverAlpha)};
  }
`;
const controler = css({
  width: "100%",
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-start",
  alignItems: "center",
});
const field = css({
  width: "90%",
  minHeight: "5vh",
});
type ControlerProps = {
  meta: Meta;
  overwrite: boolean;
  dispatchMeta: React.Dispatch<MetaUpdateAction>;
  handleImageUrl: (url: string) => void;
  handleSave: () => void;
  sync: boolean;
  setSync: React.Dispatch<React.SetStateAction<boolean>>;
  handleSync: () => void;
};
const Controler: React.FC<ControlerProps> = ({
  meta,
  overwrite,
  dispatchMeta,
  handleImageUrl,
  handleSave,
  sync,
  setSync,
  handleSync,
}) => {
  const theme = useTheme();
  const lang = useSettings().language;
  const buttons = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  type TagState = {
    idx: number;
    label: string;
  };
  type TagStateUpdateAction =
    | {
        type: "idx";
        payload: TagState["idx"];
      }
    | {
        type: "label";
        payload: TagState["label"];
      }
    | {
        type: "set";
        payload: TagState;
      }
    | {
        type: "reset";
      };
  const [tagState, dispatchTagState] = useReducer(
    (state: TagState, action: TagStateUpdateAction) => {
      switch (action.type) {
        case "idx":
          return {
            idx: action.payload,
            label: state.label,
          };
        case "label":
          return {
            idx: state.idx,
            label: action.payload,
          };
        case "set":
          return action.payload;
        case "reset":
          return {
            idx: -1,
            label: "",
          };
      }
    },
    {
      idx: -1,
      label: "",
    }
  );
  const handleTag = () => {
    if (tagState.idx === -1 && tagState.label !== "") {
      dispatchMeta({
        type: "tags",
        payload: [...meta.tags, tagState.label],
      });
      dispatchTagState({
        type: "reset",
      });
    } else if (tagState.label !== "") {
      dispatchMeta({
        type: "tags",
        payload: [
          ...meta.tags.slice(0, tagState.idx),
          tagState.label,
          ...meta.tags.slice(tagState.idx + 1),
        ],
      });
      dispatchTagState({
        type: "reset",
      });
    }
  };

  const { handleKeyDown, handleKeyUp, resetKeyBoard } = useKeyAction(
    (keyboard, e) => {
      if (keyboard["Enter"]) {
        e.preventDefault();
        resetKeyBoard();
        handleTag();
      }
    }
  );

  const handleStop = (e: React.MouseEvent) => e.stopPropagation();
  const { fileRef, handleChange } = useFileControll(handleImageUrl);

  return (
    <>
      <div ref={buttons} css={controler}>
        <Button onClick={() => setOpen(!open)} css={buttonIconDefault}>
          <MoreVertIcon />
        </Button>
        <Button
          onClick={() => fileRef.current?.click()}
          css={buttonIconDefault}
        >
          <ImageIcon />
        </Button>
        <FormControlLabel
          control={
            <Switch
              checked={sync}
              onChange={() => {
                setSync(!sync);
                handleSync();
              }}
              name={"sync_switch"}
            />
          }
          label={writeMsg(lang).sync}
          css={css`
            ${buttonIconDefault(theme)}
            margin: 0;
          `}
        />
        <Button onClick={handleSync} css={buttonIconDefault}>
          <LoopIcon />
        </Button>
        <Button
          onClick={handleSave}
          css={css`
            ${buttonIconDefault(theme)}
            background-color: ${theme.palette.success.main};
            &:hover: {
              background-color: ${alpha(
                theme.palette.success.main,
                hoverAlpha
              )};
            }
          `}
        >
          {writeMsg(lang).save}
        </Button>
        <input
          type={"file"}
          accept={".png,.jpg,.jpeg,.gif"}
          ref={fileRef}
          onChange={handleChange}
          css={css({
            display: "none",
          })}
        />
      </div>
      <Collapse
        in={open}
        orientation={"horizontal"}
        css={css`
          position: absolute;
          top: ${buttons.current?.clientHeight || 0}px;
          left: 0;
          ${scrollable}
          width: 50%;
          color: ${theme.palette.text.secondary};
          background-color: ${theme.palette.common.white};
          z-index: ${Z_INDEXES.overlay.ground};
        `}
      >
        <ul
          onClick={handleStop}
          css={css`
            width: 100%;
            z-index: ${Z_INDEXES.overlay.main};
            height: auto;
            list-style: none;
          `}
        >
          <li>
            <TextField
              label={"filename"}
              value={meta.filename}
              onChange={(e) =>
                dispatchMeta({
                  type: "filename",
                  payload: e.target.value,
                })
              }
              css={field}
            />
          </li>
          <li>
            <TextField
              label={"author"}
              value={meta.author}
              disabled={overwrite}
              onChange={(e) =>
                dispatchMeta({
                  type: "author",
                  payload: e.target.value,
                })
              }
              css={field}
            />
          </li>
          <li>
            <Paper
              component={"ul"}
              variant={"outlined"}
              onClick={handleStop}
              css={[
                css({
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  listStyle: "none",
                  padding: theme.spacing(0.5),
                  margin: 0,
                  overflowY: "scroll",
                  "&::-webkit-scrollbar": {
                    width: "6px",
                    height: "6px",
                  },
                }),
                field,
              ]}
            >
              {meta.tags.map((label, idx) => {
                return (
                  <li key={"metadata_tag_" + idx}>
                    {tagState.idx === idx ? (
                      <TextField
                        label={"tag"}
                        value={tagState.label}
                        autoFocus
                        onKeyDown={handleKeyDown}
                        onKeyUp={handleKeyUp}
                        onBlur={handleTag}
                        onChange={(e) =>
                          dispatchTagState({
                            type: "label",
                            payload: e.target.value,
                          })
                        }
                        key={"file_metadata_tag_" + idx}
                      />
                    ) : (
                      <Chip
                        label={
                          20 < label.length ? label.slice(0, 20) + "..." : label
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatchTagState({
                            type: "set",
                            payload: { idx, label },
                          });
                        }}
                        onDelete={() =>
                          dispatchMeta({
                            type: "tags",
                            payload: [
                              ...meta.tags.slice(0, idx),
                              ...meta.tags.slice(idx + 1),
                            ],
                          })
                        }
                        key={"file_metadata_tag_" + idx}
                        css={css({
                          margin: theme.spacing(0.5),
                        })}
                      />
                    )}
                  </li>
                );
              })}
              {tagState.idx === -1 && (
                <li>
                  <TextField
                    label={"tag"}
                    value={tagState.label}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    onBlur={handleTag}
                    onChange={(e) =>
                      dispatchTagState({
                        type: "label",
                        payload: e.target.value,
                      })
                    }
                  />
                </li>
              )}
            </Paper>
          </li>
        </ul>
      </Collapse>
    </>
  );
};

enum ShouldUpdate {
  USERIN = 0,
  WAIT,
  DONE,
}

type RawInputProps = {
  raw: string;
  handleRaw: (arg: string) => void;
};
type RawInputHandle = {
  selectionEnd: () => number | null | undefined;
};
const RawInputBase: React.ForwardRefRenderFunction<
  RawInputHandle,
  RawInputProps
> = ({ raw, handleRaw }, forwardedRef) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState({
    start: 0,
    end: 0
  })
  useImperativeHandle(forwardedRef, () => ({
    selectionEnd: () => inputRef.current?.selectionEnd,
  }));
  const { handleKeyDown, handleKeyUp, resetKeyBoard } = useKeyAction(
    (keyboard, e) => {
      if (keyboard["Tab"]) {
        if (inputRef.current && inputRef.current.selectionEnd !== null) {
          e.preventDefault();
          resetKeyBoard();
          const caretpos = inputRef.current.selectionEnd || raw.length;
          handleRaw(`${raw.slice(0, caretpos)}${"  "}${raw.slice(caretpos)}`);
          inputRef.current.selectionStart = inputRef.current.selectionEnd =
            caretpos + 2;
          console.log(caretpos)
        }
      }
    }
  );
  const handleClick = () => inputRef.current?.focus();

  useEffect(() => {
    if (inputRef.current && inputRef.current === document.activeElement) {
      
    }
  })

  return (
    <Grid
      item
      css={css([
        scrollable,
        css({
          width: "40%",
          margin: theme.spacing(0.5),
          padding: theme.spacing(1),
          borderStyle: "solid",
          borderWidth: "1px",
          borderRadius: theme.shape.borderRadius,
          cursor: "text",
        }),
      ])}
      onClick={handleClick}
    >
      <InputBase
        value={raw}
        multiline
        fullWidth
        minRows={5}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onChange={(e) => handleRaw(e.target.value)}
        inputRef={inputRef}
      />
    </Grid>
  );
};
const RawInput = forwardRef(RawInputBase);

const Preview: React.FC<{
  data: Data;
  setLoad: React.Dispatch<React.SetStateAction<ShouldUpdate>>;
  sync: boolean;
}> = ({ data, setLoad, sync }) => {
  const theme = useTheme();
  const timer = useRef<number | null>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.load === ShouldUpdate.USERIN) {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = window.setTimeout(
        () => {
          timer.current = null;
          setLoad(ShouldUpdate.DONE);
        },
        sync ? 1500 : 100 //too short interval results in no effect?
      );
    }
    setLoad(ShouldUpdate.WAIT);
  });

  return (
    <Grid
      item
      css={css([
        scrollable,
        css({
          width: "55%",
          margin: theme.spacing(0.5),
          padding: theme.spacing(1),
          border: "2mm ridge rgba(255, 255, 255, .6)",
        }),
      ])}
      ref={container}
    >
      {useMemo(
        () => (
          <Markdown container={container} md={data.raw} />
        ),
        //eslint-disable-next-line
        [data.load !== ShouldUpdate.DONE]
      )}
    </Grid>
  );
};

type MetaUpdateAction =
  | {
      type: "filename";
      payload: Meta["filename"];
    }
  | {
      type: "author";
      payload: Meta["author"];
    }
  | {
      type: "tags";
      payload: Meta["tags"];
    }
  | {
      type: "shortcut";
      payload: Meta["shortcut"];
    }
  | {
      type: "set";
      payload: Meta;
    };
type Data = {
  raw: string;
  load: ShouldUpdate;
};
const Edit: React.FC = () => {
  const theme = useTheme();
  const location = useLocation<Meta>();
  const [raw, setRaw] = useState("");
  const rawInputRef = useRef<RawInputHandle>(null);
  const [load, setLoad] = useState<ShouldUpdate>(ShouldUpdate.DONE);
  const overwrite = useRef(false);
  const [sync, setSync] = useState(false);
  const handleSync = () => setLoad(ShouldUpdate.USERIN);
  const handleRaw = (arg: string) => {
    setRaw(arg);
    if (sync) handleSync();
  };
  const handleImageUrl = (url: string) => {
    const caretpos = rawInputRef.current?.selectionEnd() || raw.length;
    setRaw(
      `${raw.slice(0, caretpos)}![may not be image](${url})${raw.slice(
        caretpos
      )}`
    );
    handleSync();
  };
  const [meta, dispatchMeta] = useReducer(
    (state: Meta, action: MetaUpdateAction) => {
      switch (action.type) {
        case "filename": {
          overwrite.current = location.state?.filename === state.filename;
          return {
            ...state,
            filename: action.payload,
          };
        }
        case "author":
          return {
            ...state,
            author: action.payload,
          };
        case "tags":
          return {
            ...state,
            tags: [...new Set(action.payload)],
          };
        case "shortcut":
          return {
            ...state,
            shortcut: action.payload,
          };
        case "set":
          return action.payload;
      }
    },
    {
      filename: "",
      created_at: "",
      updated_at: "",
      author: "",
      tags: [],
      shortcut: {},
      html_src: false,
    }
  );
  const { handleSuc, handleErr } = useSnackHandler();
  const { saveDocument, getDocument } = useCommand();
  const handleSave = async () => {
    if (meta?.filename) {
      const res = await saveDocument(meta, raw, overwrite.current).catch(
        (err) => {
          handleErr((err as Response).message);
          return undefined;
        }
      );
      if (res) {
        handleSuc(res.message);
        location.state = meta;
        overwrite.current = true;
      }
    } else {
      handleErr("File Name must contain at least one character");
    }
  };
  const { handleKeyDown, handleKeyUp } = useNativeKeyAction(
    async (keyboard, evt) => {
      if (keyboard["Control"] && keyboard["s"]) {
        evt.preventDefault();
        keyboard = {};
        await handleSave();
      } else if (keyboard["Control"] && keyboard["l"]) {
        evt.preventDefault();
        keyboard = {};
        handleSync();
      }
    }
  );
  const autosaveInterval = useSettings().autosave;

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    let autosave: number | null = null;
    if (autosaveInterval) {
      autosave = window.setInterval(
        async () => await handleSave(),
        autosaveInterval
      );
    }

    if (location.state) {
      (async () => {
        const body = await getDocument(location.state).catch((err) => {
          handleErr((err as Response).message);
          return undefined;
        });

        if (body !== undefined) {
          setRaw(body);
          dispatchMeta({
            type: "set",
            payload: location.state,
          });
          overwrite.current = true;
        }
        handleSync();
      })();
    }

    return () => {
      if (autosave) {
        clearInterval(autosave);
      }
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
    //eslint-disable-next-line
  }, []);

  return (
    <Grid
      container
      direction={"row"}
      justifyContent={"space-evenly"}
      alignItems={"stretch"}
      css={css({
        position: "relative",
        width: "100%",
        height: "100%",
        margin: theme.spacing(0.5),
      })}
    >
      <Controler
        meta={meta}
        overwrite={overwrite.current}
        dispatchMeta={dispatchMeta}
        handleImageUrl={handleImageUrl}
        handleSave={handleSave}
        sync={sync}
        setSync={setSync}
        handleSync={handleSync}
      />
      <RawInput raw={raw} handleRaw={handleRaw} ref={rawInputRef} />
      <Preview data={{ raw, load }} setLoad={setLoad} sync={sync} />
    </Grid>
  );
};

export default Edit;
