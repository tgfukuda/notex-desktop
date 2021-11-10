/** @jsxImportSource @emotion/react */
import React, { useEffect, useState, ChangeEvent } from "react";
import { useHistory } from "react-router";
import { css, useTheme, Theme } from "@emotion/react";
import {
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  InputBase,
} from "@mui/material";
import {
  ReplayRounded,
  ExpandLessRounded,
  ChevronRightRounded,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import useModal from "../context/Modal";
import { useSnackHandler } from "../context/SnackHandler";
import useCommand, { Response } from "../api/command";
import { useSettings } from "../redux/hooks";
import { RequestDocs, ResponseDocs } from "../api/command";
import { Meta } from "../redux/write";
import browseMsg from "../utils/constant/browse";
import utilMsg from "../utils/constant/util";

const full = (theme: Theme) =>
  css({
    width: "100%",
    margin: "1px auto",
    padding: theme.spacing(0.5),
  });

const half = (theme: Theme) =>
  css({
    width: "50%",
    margin: "1px auto",
    padding: theme.spacing(0.5),
  });

const chip = (theme: Theme) =>
  css({
    margin: theme.spacing(0.5),
    backgroundColor: "#E3E3E3",
  });

const ulRoot = (theme: Theme) =>
  css({
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexWrap: "wrap",
    listStyle: "none",
    padding: theme.spacing(0.5),
    margin: 0,
    maxHeight: "30vh",
    overflowY: "scroll",
    "&::-webkit-scrollbar": {
      width: "6px",
      height: "6px",
    },
  });

const row = (width: number, theme: Theme) => {
  return css({
    width: width ? width + "%" : undefined,
    margin: "1px auto",
    padding: theme.spacing(0.5),
  });
};

const previewButton = (theme: Theme) =>
  css({
    backgroundColor: theme.palette.info.main,
    "&:hover": {
      backgroundColor: theme.palette.success.main,
    },
    margin: theme.spacing(1),
  });

const editButton = (theme: Theme) =>
  css({
    backgroundColor: theme.palette.info.main,
    "&:hover": {
      backgroundColor: theme.palette.warning.main,
    },
    margin: theme.spacing(1),
  });

const deleteButton = (theme: Theme) =>
  css({
    backgroundColor: theme.palette.info.main,
    "&:hover": {
      backgroundColor: theme.palette.error.main,
    },
    margin: theme.spacing(1),
  });

const cancelButton = (theme: Theme) =>
  css({
    backgroundColor: theme.palette.info.main,
    "&:hover": {
      backgroundColor: alpha(theme.palette.info.main, 0.05),
    },
    margin: theme.spacing(1),
  });

/**
 * this components send query searching by tag every click.
 * it's on my purpose but this strategy may be too much.
 * so if need, divide taghandler into two part.
 * first is selection.
 * second is reflecting those to the page i.e. history.push
 */
type ControlerProps = {
  handleLoad: () => void;
  handleTag: (tags: string[]) => void;
  allTags: string[];
  selectedTags: string[];
};
const Controler: React.FC<ControlerProps> = ({
  handleLoad,
  handleTag,
  allTags,
  selectedTags,
}) => {
  const theme = useTheme();
  const msgs = browseMsg(useSettings().language);
  const [input, setInput] = useState("");
  const handleInput = (e: ChangeEvent<HTMLInputElement>) =>
    setInput(e.target.value);
  const addTag = (tag: string) => () => {
    handleTag(selectedTags.concat(tag));
  };
  const deleteTag = (tag: string) => () => {
    handleTag(selectedTags.filter((t) => t !== tag));
  };

  const tagList = input
    ? allTags.filter((tag) => RegExp(input, "i").test(tag))
    : allTags;

  return (
    <Grid
      item
      container
      css={css({
        width: "99%",
        backgroundColor: "#86C0CA",
        marginTop: theme.spacing(1),
      })}
    >
      <Grid
        item
        component={Button}
        onClick={handleLoad}
        css={css({
          maxWidth: "10%",
          height: "auto",
          "&:hover": {
            backgroundColor: "#42C0C2",
          },
          borderRadius: theme.shape.borderRadius,
        })}
      >
        <ReplayRounded />
      </Grid>
      <Grid item css={half}>
        <Accordion
          square
          css={css({
            backgroundColor: "inherit",
            "&:hover": {
              backgroundColor: "#42C0C2",
            },
            height: "auto",
            width: "100%",
            cursor: "default",
          })}
        >
          <AccordionSummary>{msgs.searchByTag}</AccordionSummary>
          <Grid container direction={"column"} component={AccordionDetails}>
            <Grid item>
              <InputBase
                value={input}
                onChange={handleInput}
                placeholder={msgs.tagName + "..."}
                css={css`
                  & .MuiInputBase-root {
                    background-color: rgba(48, 48, 48, 0.15);
                    & :hover {
                      backgroundcolor: rgba(200, 200, 200, 0.25);
                    }
                    borderradius: ${theme.shape.borderRadius};
                    minwidth: 40%;
                  }
                `}
              />
            </Grid>
            <Grid item component={Paper}>
              {tagList.map((tag) =>
                selectedTags.indexOf(tag) === -1 ? (
                  <Chip
                    label={tag}
                    onClick={addTag(tag)}
                    clickable={false}
                    css={chip}
                    key={"tag_chip_named_" + tag}
                  />
                ) : (
                  <Chip
                    label={tag}
                    onClick={deleteTag(tag)}
                    clickable={false}
                    css={css({
                      margin: theme.spacing(0.5),
                      backgroundColor: "#33ffcc",
                      "&:hover": {
                        backgroundColor: "#33ff99",
                      },
                    })}
                    key={"tag_chip_named_" + tag}
                  />
                )
              )}
            </Grid>
          </Grid>
        </Accordion>
      </Grid>
    </Grid>
  );
};

type ColumnProps = {
  width: number;
  field: keyof Omit<Meta, "shortcut">;
};
const Column: React.FC<ColumnProps> = ({ width, field }) => {
  const theme = useTheme();
  const msgs = browseMsg(useSettings().language);

  return (
    <Grid item css={row(width, theme)}>
      {msgs[field]}
    </Grid>
  );
};

const columns: MetaDisplay[] = [
  {
    field: "filename",
    width: 60,
  },
  {
    field: "tags",
    width: 30,
  },
];
type RowHeaderProps = {
  idx: number;
  meta: Meta;
  column: MetaDisplay;
};
const RowHeader: React.FC<RowHeaderProps> = ({ idx, meta, column }) => {
  const theme = useTheme();
  switch (column.field) {
    case "filename":
      return (
        <Grid item css={row(column.width, theme)}>
          <Typography variant={"h5"}>{meta[column.field]}</Typography>
        </Grid>
      );
    case "tags":
      return (
        <Grid item css={row(column.width, theme)}>
          <Paper component="ul" variant="outlined">
            {meta[column.field].slice(0, 3).map((tag, i) => (
              <Chip
                label={tag}
                component={"li"}
                css={chip}
                key={"row_property_" + column.field + i + "_of_" + idx}
              />
            ))}
            {3 < meta[column.field].length && (
              <Chip label={"..."} component={"li"} css={chip} />
            )}
          </Paper>
        </Grid>
      );
    default:
      return <React.Fragment />; //unreachable
  }
};

type MetaDisplay = {
  field: keyof Omit<Meta, "shortcut">;
  width: number;
};
const details: MetaDisplay[] = [
  {
    field: "filename",
    width: 60,
  },
  {
    field: "tags",
    width: 30,
  },
  {
    field: "created_at",
    width: 17,
  },
  {
    field: "updated_at",
    width: 17,
  },
  {
    field: "author",
    width: 10,
  },
];
type RowDetailProps = {
  idx: number;
  meta: Meta;
  handlePreview: (meta: Meta) => () => void;
  handleEdit: (meta: Meta) => () => void;
  call: () => void;
};
const RowDetail: React.FC<RowDetailProps> = ({
  idx,
  meta,
  handlePreview,
  handleEdit,
  call,
}) => {
  const lang = useSettings().language;
  const msgs = {
    ...utilMsg(lang),
    ...browseMsg(lang),
  };

  return (
    <Grid container direction={"column"} component={AccordionDetails}>
      {details.map((detail) => {
        switch (detail.field) {
          case "tags":
            return (
              <Grid item key={"detail_wrapper_tag_" + idx}>
                <Paper component="ul" variant="outlined" css={ulRoot}>
                  {meta[detail.field].map((tag, i) => (
                    <Chip
                      label={tag}
                      css={chip}
                      key={"row_property_" + detail.field + i + "_of_" + idx}
                    />
                  ))}
                </Paper>
              </Grid>
            );
          default:
            return (
              <Grid
                item
                key={"row_detail_property_" + detail.field + "_of_" + idx}
              >
                {msgs[detail.field]} : {meta[detail.field]}
              </Grid>
            );
        }
      })}
      <Grid item container direction={"row"} justifyContent={"flex-end"}>
        <Grid
          item
          component={Button}
          onClick={handlePreview(meta)}
          css={previewButton}
        >
          {msgs.view}
        </Grid>
        <Grid
          item
          component={Button}
          onClick={handleEdit(meta)}
          css={editButton}
        >
          {msgs.edit}
        </Grid>
        <Grid item component={Button} onClick={call} css={deleteButton}>
          {msgs.delete}
        </Grid>
      </Grid>
    </Grid>
  );
};

type DeleteModalProps = {
  meta: Meta;
  handleDelete: (meta: Meta) => () => void;
  exit: () => void;
};
const DeleteModal: React.FC<DeleteModalProps> = ({
  meta,
  handleDelete,
  exit,
}) => {
  const lang = useSettings().language;
  const msgs = {
    ...utilMsg(lang),
    ...browseMsg(lang),
  };

  return (
    <>
      <Typography variant={"body1"}>
        {msgs.confirmDelete + " " + meta.filename}
      </Typography>
      <Grid container direction="row-reverse" alignItems={"flex-start"}>
        <Grid
          item
          component={Button}
          onClick={handleDelete(meta)}
          css={deleteButton}
        >
          {msgs.delete}
        </Grid>
        <Grid item component={Button} onClick={exit} css={cancelButton}>
          {msgs.cancel}
        </Grid>
      </Grid>
    </>
  );
};

type FilesProps = {
  list: Meta[];
  handleLoad: () => void;
};
const Files: React.FC<FilesProps> = ({ list, handleLoad }) => {
  const history = useHistory();
  const { handleSuc, handleErr } = useSnackHandler();
  const [expanded, setExpanded] = React.useState("");
  const [setModal, , call, exit] = useModal([]);
  const { deleteFile } = useCommand();

  const handlePreview = (meta: Meta) => () => {
    history.push({
      pathname: "/view",
      search: meta.filename,
      state: meta,
    });
  };

  const handleEdit = (meta: Meta) => () => {
    history.push({
      pathname: "/write",
      search: meta.filename,
      state: meta,
    });
  };

  const handleDelete = (target: Meta) => async () => {
    const res = await deleteFile(target).catch((err) => {
      handleErr((err as Response).message);
      return undefined;
    });

    if (res) {
      handleSuc(res.message);
      exit();
      handleLoad();
    }
  };

  const handleChange =
    (meta: Meta) => (_: React.ChangeEvent<{}>, isExpanded: boolean) => {
      setExpanded(isExpanded ? "controll_of_" + meta.filename : "");
      setModal(
        <DeleteModal meta={meta} handleDelete={handleDelete} exit={exit} />
      );
    };

  return (
    <Grid
      container
      direction={"column"}
      justifyContent={"flex-start"}
      css={css({
        maxWidth: "99.5%",
        overflowX: "scroll",
        "&::-webkit-scrollbar": {
          width: "6px",
          height: "6px",
        },
      })}
    >
      <Grid
        item
        container
        direction={"row"}
        justifyContent={"flex-start"}
        css={full}
      >
        {columns.map((column) => (
          <Column
            field={column.field}
            width={column.width}
            key={"column_property_" + column.field + "_main"}
          />
        ))}
      </Grid>
      {list.map((meta, idx) => (
        <Grid item css={full} key={"row_values_" + meta.filename + "_main"}>
          <Accordion
            expanded={expanded === "controll_of_" + meta.filename}
            onChange={handleChange(meta)}
          >
            <Grid
              container
              component={AccordionSummary}
              expandIcon={
                expanded === "controll_of_" + meta.filename ? (
                  <ExpandLessRounded />
                ) : (
                  <ChevronRightRounded />
                )
              }
              css={[
                full,
                css({
                  "& .MuiAccordionSummary-root": {
                    flexDirection: "row-reverse",
                  },
                }),
              ]}
              aria-controls={"controll_row_of_" + meta.filename}
              id={"controll_row_of_" + meta.filename}
            >
              {columns.map((column) => (
                <RowHeader
                  idx={idx}
                  meta={meta}
                  column={column}
                  key={
                    "table_value_" +
                    meta.filename +
                    "_" +
                    column.field +
                    "_main_"
                  }
                />
              ))}
            </Grid>
            <RowDetail
              idx={idx}
              meta={meta}
              handlePreview={handlePreview}
              handleEdit={handleEdit}
              call={call}
            />
          </Accordion>
        </Grid>
      ))}
    </Grid>
  );
};

const Browse: React.FC = () => {
  const theme = useTheme();
  const lang = useSettings().language;
  const msgs = {
    ...utilMsg(lang),
    ...browseMsg(lang),
  };
  const [result, setResult] = useState<ResponseDocs>({
    list: [],
    page: 0,
    all_tags: [],
  });
  const [load, setLoad] = useState<boolean | undefined>(undefined);
  const handleLoad = () => setLoad(undefined);
  const handleTag = (tags: string[]) => {
    setRequestOption({
      ...requestOption,
      tags,
    });
    setLoad(undefined);
  };
  const { handleErr } = useSnackHandler();
  const { getDocumentsByFilter } = useCommand();
  const [requestOption, setRequestOption] = useState<RequestDocs>({
    offset: 0,
    limit: 15,
    filename_start: "",
    filename_contain: "",
    created_at: ["", ""],
    updated_at: ["", ""],
    tags: [],
    author: "",
  });

  useEffect(() => {
    (async () => {
      const res = await getDocumentsByFilter(requestOption).catch((err) => {
        handleErr((err as Response).message);
        setLoad(false);
        return undefined;
      });

      if (res) {
        setResult(res);
        setLoad(true);
      }
    })();
    // eslint-disable-next-line
  }, [load, requestOption]);

  return (
    <Grid
      container
      direction={"column"}
      alignContent={"center"}
      css={css({
        width: "100%",
      })}
    >
      <Controler
        handleLoad={handleLoad}
        handleTag={handleTag}
        allTags={result.all_tags}
        selectedTags={requestOption.tags || []}
      />
      <Grid
        item
        container
        css={css({
          width: "99%",
          backgroundColor: "#E3E3E3",
          margin: "1px auto",
          padding: theme.spacing(0.5),
        })}
      >
        <Grid item css={full}>
          {load ? (
            <Files list={result.list} handleLoad={handleLoad} />
          ) : load === undefined ? (
            <CircularProgress color={"secondary"} />
          ) : (
            <>{msgs.error}</>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Browse;
