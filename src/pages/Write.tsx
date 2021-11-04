/** @jsxImportSource @emotion/react */
import React, {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router";
import { css, useTheme } from "@emotion/react";
import { alpha } from "@mui/material/styles";
import {
  InputBase,
  Grid,
  Button,
  Paper,
  Chip,
  TextField,
  Collapse,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ImageIcon from "@mui/icons-material/Image";
import useCommand from "../api/command";
import { useWrite, useAppDispatch, useSettings } from "../redux/hooks";
import { Write, Meta } from "../redux/write";
import { useSnackHandler } from "../context/SnackHandler";
import useKeyAction, { useNativeKeyAction } from "../hooks/Keyboard";
import writeMsg from "../utils/constant/write/write";
import Markdown from "../components/Markdown";
import { Z_INDEXES } from "../utils/constant/util";

const scrollable = css({
  height: "80vh",
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
});

const useInputControll = (handleImageUrl: (url: string) => void) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reader = new FileReader();
  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (e.target && typeof e.target.result === "string")
      handleImageUrl(e.target.result);
  };
  const handleChange = (_: ChangeEvent) => {
    if (inputRef.current && inputRef.current.files)
      reader.readAsDataURL(inputRef.current.files[0]);
  };

  return {
    inputRef,
    handleChange,
  };
};

type PostButtonProps = {
  handleSave: () => void;
};
const PostButton: React.FC<PostButtonProps> = ({ handleSave }) => {
  const theme = useTheme();

  return (
    <Button
      onClick={handleSave}
      css={css({
        backgroundColor: theme.palette.success.main,
        "&:hover": {
          backgroundColor: alpha(theme.palette.success.main, 0.5),
        },
      })}
    >
      {writeMsg(useSettings().language).save}
    </Button>
  );
};

type ControlerProps = {
  meta: Meta;
  setMeta: React.Dispatch<React.SetStateAction<Meta>>;
  handleImageUrl: (url: string) => void;
  handleSave: () => void;
};
const Controler: React.FC<ControlerProps> = ({
  meta,
  setMeta,
  handleImageUrl,
  handleSave,
}) => {
  const theme = useTheme();
  const field = css({
    width: "30vw",
    minHeight: "5vh",
  });
  const [open, setOpen] = useState(false);
  const [tagIdx, setTagIdx] = useState<number>(-1);
  const [tag, setTag] = useState("");
  const handleTag = () => {
    if (tagIdx === -1 && tag !== "") {
      setMeta({
        ...meta,
        tags: [...meta.tags, tag],
      });
      setTagIdx(-1);
      setTag("");
    } else if (tag !== "") {
      setMeta({
        ...meta,
        tags: [
          ...meta.tags.slice(0, tagIdx),
          tag,
          ...meta.tags.slice(tagIdx + 1),
        ],
      });
      setTagIdx(-1);
      setTag("");
    }
  };

  const { handleKeyDown, handleKeyUp } = useKeyAction((keyboard, e) => {
    if (keyboard["Enter"]) {
      e.preventDefault();
      keyboard = {};
      handleTag();
    }
  });

  const handleStop = (e: React.MouseEvent) => e.stopPropagation();
  const { inputRef, handleChange } = useInputControll(handleImageUrl);

  return (
    <>
      <div
        css={css({
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
        })}
      >
        <Button
          onClick={() => setOpen(!open)}
          css={css`
            max-width: 5%;
            background-color: rgba(71, 120, 211, 0.568);
          `}
        >
          <MoreVertIcon />
        </Button>
        <Button
          onClick={() => inputRef.current?.click()}
          css={css`
            max-width: 5%;
            background-color: rgba(71, 120, 211, 0.568);
          `}
        >
          <ImageIcon />
        </Button>
        <PostButton handleSave={handleSave} />
        <input
          type={"file"}
          accept={".png,.jpg,.jpeg,.gif,.pdf"}
          ref={inputRef}
          onChange={handleChange}
          css={css({
            display: "none",
          })}
        />
      </div>
      <div
        css={css`
          postion: sticky;
          display: ${open ? "block" : "none"};
          top: 0;
          left: 0;
          height: 100vh;
          width: 100vw;
          background-color: rgba(100, 100, 100, 0.8);
          z-index: ${Z_INDEXES.overlay.ground};
        `}
        onClick={() => setOpen(false)}
      >
        <Collapse
          in={open}
          orientation={"horizontal"}
          css={css`
            position: relative;
            top: 10%;
            left: 0;
            height: 100vh;
            z-index: ${Z_INDEXES.overlay.main};
          `}
        >
          <ul>
            <li>
              <TextField
                label={"filename"}
                defaultValue={meta.filename}
                onClick={handleStop}
                onBlur={(e) =>
                  setMeta({
                    ...meta,
                    filename: e.target.value,
                  })
                }
                css={field}
              />
            </li>
            <li>
              <TextField
                label={"author"}
                defaultValue={meta.author}
                onClick={handleStop}
                onBlur={(e) =>
                  setMeta({
                    ...meta,
                    author: e.target.value,
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
                {meta.tags.map((tagName, i) => {
                  return (
                    <li key={"metadata_tag_" + i}>
                      {tagIdx === i ? (
                        <TextField
                          label={"tag"}
                          value={tag}
                          autoFocus
                          onKeyDown={handleKeyDown}
                          onKeyUp={handleKeyUp}
                          onChange={(e) => setTag(e.target.value)}
                          key={"file_metadata_tag_" + i}
                        />
                      ) : (
                        <Chip
                          label={
                            20 < tagName.length
                              ? tagName.slice(0, 20) + "..."
                              : tagName
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            setTagIdx(i);
                            setTag(tagName);
                          }}
                          onDelete={() =>
                            setMeta({
                              ...meta,
                              tags: [
                                ...meta.tags.slice(0, i),
                                ...meta.tags.slice(i + 1),
                              ],
                            })
                          }
                          key={"file_metadata_tag_" + i}
                          css={css({
                            margin: theme.spacing(0.5),
                            backgroundColor: "#E3E3E3",
                          })}
                        />
                      )}
                    </li>
                  );
                })}
                {tagIdx === -1 && (
                  <li>
                    <TextField
                      label={"tag"}
                      value={tag}
                      onClick={handleStop}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyUp}
                      onChange={(e) => setTag(e.target.value)}
                    />
                  </li>
                )}
              </Paper>
            </li>
          </ul>
        </Collapse>
      </div>
    </>
  );
};

type RawInputProps = {
  raw: string;
  handleRaw: (arg: string) => void;
};
const RawInput: React.FC<RawInputProps> = ({ raw, handleRaw }) => {
  const theme = useTheme();
  const { ref, handleKeyDown, handleKeyUp } = useKeyAction((keyboard, e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      keyboard = {};
      handleRaw(raw + "  ");
    }
  });
  const handleClick = () => ref.current?.focus();

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
        onChange={(e) => {
          handleRaw(e.target.value);
        }}
        inputRef={ref}
      />
    </Grid>
  );
};

const Preview: React.FC<{
  data: Data;
  setLoad: React.Dispatch<React.SetStateAction<ShouldUpdate>>;
}> = ({ data, setLoad }) => {
  const theme = useTheme();
  const timer = useRef<NodeJS.Timeout | null>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.load === ShouldUpdate.USERIN) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        setLoad(ShouldUpdate.DONE);
      }, 1500);
    }
    setLoad(ShouldUpdate.WAIT);
  }, [data.load]);

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
        [data.load !== ShouldUpdate.DONE]
      )}
    </Grid>
  );
};

enum ShouldUpdate {
  USERIN = 0,
  WAIT,
  DONE,
}

type Data = {
  raw: string;
  load: ShouldUpdate;
};
const Edit: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const [raw, setRaw] = useState("");
  const [load, setLoad] = useState<ShouldUpdate>(ShouldUpdate.DONE);
  const overwrite = useRef(false);
  const handleRaw = (arg: string) => {
    setRaw(arg);
    setLoad(ShouldUpdate.USERIN);
  };
  const handleImageUrl = (url: string) => {
    setRaw(raw + `\n![may be invalid file type](${url})`);
    setLoad(ShouldUpdate.USERIN);
  };
  const [meta, setMeta] = useState<Meta>({
    filename: "",
    created_at: "",
    updated_at: "",
    author: "",
    tags: [],
    shortcut: {},
  });
  const { handleSuc, handleErr } = useSnackHandler();
  const { saveDocument, getDocument } = useCommand();
  const handleSave = async () => {
    if (meta?.filename) {
      await saveDocument(
        meta,
        raw,
        overwrite.current,
        (res) => {
          handleSuc(res.message);
          overwrite.current = true;
        },
        (err) => handleErr(err.message)
      );
    } else {
      handleErr("File Name must contain at least one character");
    }
  };
  const { handleKeyDown, handleKeyUp } = useNativeKeyAction(
    async (keyboard, evt) => {
      if (keyboard["Control"] && keyboard["s"]) {
        evt.preventDefault();
        await handleSave();
      }
    }
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    const autosave = setInterval(async () => {
      await handleSave();
    }, 1000 * 60 * 30);

    if (location.search) {
      (async () => {
        await getDocument(
          location.state as Meta,
          (body) => setRaw(body),
          (err) => handleErr(err.message)
        ).then(() => {
          setMeta(location.state as Meta);
          overwrite.current = true;
        });
      })();
    }

    return () => {
      clearInterval(autosave);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <Grid
      container
      direction={"row"}
      justifyContent={"space-evenly"}
      alignItems={"stretch"}
      css={css({
        width: "100vw",
        height: "100%",
        margin: theme.spacing(0.5),
      })}
    >
      <Controler
        meta={meta}
        setMeta={setMeta}
        handleImageUrl={handleImageUrl}
        handleSave={handleSave}
      />
      <RawInput raw={raw} handleRaw={handleRaw} />
      <Preview data={{ raw, load }} setLoad={setLoad} />
      <PostButton handleSave={handleSave} />
    </Grid>
  );
};

export default Edit;
