/** @jsxImportSource @emotion/react */
import React, { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { css, useTheme, Theme } from "@emotion/react";
import { Button } from "@mui/material";
import { CircularProgress } from "@mui/material";
import useCommand, { Response } from "../api/command";
import { Meta } from "../redux/write";
import Markdown from "../components/Markdown";

const root = (theme: Theme) => css`
  width: 100%;
  margin: ${theme.spacing(2)};
`;

const View: React.FC = () => {
  const location = useLocation<Meta>();
  const theme = useTheme();
  const container = useRef(null);
  const [load, setLoad] = useState<{
    status: boolean | undefined;
    res: string;
  }>({
    status: undefined,
    res: "",
  });
  const { getDocument, print } = useCommand();
  const meta = location.state;

  useEffect(() => {
    if (load.status === undefined)
      (async () => {
        const res = await getDocument(meta).catch((err) => {
          setLoad({
            status: false,
            res: (err as Response).message,
          });
          return undefined;
        });

        if (res) {
          setLoad({
            status: true,
            res,
          });
        }
      })();
    //eslint-disable-next-line
  }, [load.status === undefined]);

  return load.status === undefined ? (
    <CircularProgress css={root(theme)} />
  ) : load.status ? (
    <div css={root(theme)} ref={container}>
      <Button
        css={css`
          width: 100%;
        `}
        onClick={() =>
          print(meta, load.res)
            .then(() => {})
            .catch(() => {})
        }
      >
        pdf
      </Button>
      <Markdown md={load.res} container={container} />
    </div>
  ) : (
    <div css={root(theme)}>
      <Button
        onClick={() =>
          setLoad({
            status: undefined,
            res: "",
          })
        }
        color={"info"}
        css={css({})}
      >
        Retry
      </Button>
      Failed to load file due to <br /> {load.res}
    </div>
  );
};

export default View;
