/** @jsxImportSource @emotion/react */
import React, { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { css, useTheme, Theme } from "@emotion/react";
import { Button, CircularProgress } from "@mui/material";
import { alpha } from "@mui/material/styles";
import useCommand, { Response } from "../api/command";
import { Meta } from "../redux/write";
import { Language } from "../redux/settings";
import Markdown from "../components/Markdown";
import { useSettings } from "../redux/hooks";
import { dialog } from "@tauri-apps/api";

const createHTMLSource = (
  meta: Meta,
  styles: HTMLCollectionOf<HTMLStyleElement>,
  contents: string,
  lang?: Language
) => {
  const html = document.createElement("html");
  switch (lang) {
    case "english":
      html.setAttribute("lang", "en");
      break;
    case "japanese":
      html.setAttribute("lang", "ja");
      break;
  }
  const head = document.createElement("head");
  const body = document.createElement("body");
  {
    const encoding = document.createElement("meta");
    encoding.setAttribute("charset", "utf-8");
    head.appendChild(encoding);
    if (meta.author) {
      const author = document.createElement("meta");
      author.setAttribute("author", meta.author);
      head.appendChild(author);
    }
  }
  for (const style of styles) {
    head.appendChild(style.cloneNode(true));
  }
  body.innerHTML = contents;
  html.appendChild(head);
  html.appendChild(body);

  return html.outerHTML;
};

const hoverAlpha = 0.5;
const root = (theme: Theme) => css`
  width: 100%;
  margin: ${theme.spacing(2)};
`;
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
const Controler: React.FC<{ handlePDF: () => void; handleHTML: () => void }> =
  ({ handlePDF, handleHTML }) => {
    return (
      <div css={controler}>
        <Button onClick={handlePDF} css={buttonIconDefault}>
          export PDF
        </Button>
        <Button onClick={handleHTML} css={buttonIconDefault}>
          export HTML
        </Button>
      </div>
    );
  };

const View: React.FC = () => {
  const location = useLocation<Meta>();
  const theme = useTheme();
  const container = useRef(null);
  const markdown = useRef<HTMLDivElement>(null);
  const { language: lang, target_dir: defaultPath } = useSettings();
  const [load, setLoad] = useState<{
    status: boolean | undefined;
    res: string;
  }>({
    status: undefined,
    res: "",
  });
  const { getDocument, print, html } = useCommand();
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
      <Controler
        handlePDF={() =>
          print(meta, load.res)
            .then(() => {})
            .catch(() => {})
        }
        handleHTML={async () => {
          const path = await dialog
            .open({
              defaultPath,
              directory: true,
              multiple: false,
            })
            .catch(() => "");

          if (path && typeof path === "string") {
            const htmlsrc = createHTMLSource(
              meta,
              document.head.getElementsByTagName("style"),
              markdown.current?.innerHTML || "",
              lang
            );

            html(meta, htmlsrc, path)
              .then(() => {
                console.log("success")
              })
              .catch((err) => {
                console.error(err)
              });
          }
        }}
      />
      <Markdown md={load.res} container={container} ref={markdown} />
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
