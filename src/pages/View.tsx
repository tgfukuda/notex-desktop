/** @jsxImportSource @emotion/react */
import React, { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { css } from "@emotion/react";
import { Button } from "@mui/material";
import { CircularProgress } from "@mui/material";
import useCommand from "../api/command";
import { Meta } from "../redux/write";
import Markdown from "../components/Markdown";

const root = css`
  width: 100%;
`;

const View: React.FC = () => {
  const location = useLocation();
  const container = useRef(null);
  const [load, setLoad] = useState<{
    status: boolean | undefined;
    res: string;
  }>({
    status: undefined,
    res: "",
  });
  const { getDocument } = useCommand();

  useEffect(() => {
    (async () => {
      await getDocument(
        location.state as Meta,
        (res) =>
          setLoad({
            status: true,
            res,
          }),
        (err) =>
          setLoad({
            status: false,
            res: err.message,
          })
      );
    })();
  }, [load.status === undefined]);

  return load.status === undefined ? (
    <CircularProgress css={root} />
  ) : load.status ? (
    <div css={root} ref={container}>
      <Markdown md={load.res} container={container} />
    </div>
  ) : (
    <div css={root}>
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
