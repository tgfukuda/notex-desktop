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
import { getCurrent } from "@tauri-apps/api/window";
import { Event as TauriEvent } from "@tauri-apps/api/event";
import { useSnackHandler } from "../context/SnackHandler";
import scrollRegister from "../utils/lib/scrollRegister";

const notexScripts: Function[] = [scrollRegister];
/**
 * created html may cause xss
 */
const createHTMLSource = (
  meta: Meta,
  templateHtml: string,
  templateCss: string,
  styles: HTMLCollectionOf<HTMLStyleElement>, //stylesheet required by mui, katex, ...etc and created by emotion
  contents: string, //html rendered from markdown
  lang?: Language
) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(templateHtml, "text/html");
  const html = doc.documentElement;
  switch (lang) {
    case "english":
      html.setAttribute("lang", "en");
      break;
    case "japanese":
      html.setAttribute("lang", "ja");
      break;
  }

  /**
   * head building
   */
  {
    const head = doc.head;
    if (!head.querySelector("meta[charset]")) {
      const encoding = document.createElement("meta");
      encoding.setAttribute("charset", "UTF-8");
      head.appendChild(encoding);
    }
    if (meta.author && !head.querySelector('meta[name="author"]')) {
      const author = document.createElement("meta");
      author.setAttribute("author", meta.author);
      head.appendChild(author);
    }
    const katexCdn = document.createElement("link");
    katexCdn.setAttribute("rel", "stylesheet");
    katexCdn.setAttribute(
      "href",
      "https://cdn.jsdelivr.net/npm/katex@0.15.1/dist/katex.min.css"
    );
    katexCdn.setAttribute(
      "integrity",
      "sha384-R4558gYOUz8mP9YWpZJjofhk+zx0AS11p36HnD2ZKj/6JR5z27gSSULCNHIRReVs"
    );
    katexCdn.setAttribute("crossorigin", "anonymous");
    head.appendChild(katexCdn);

    const muiCdn = document.createElement("link");
    muiCdn.setAttribute("rel", "stylesheet");
    muiCdn.setAttribute(
      "href",
      "https://cdnjs.cloudflare.com/ajax/libs/mui/3.7.1/css/mui.min.css"
    );
    muiCdn.setAttribute("type", "text/css");
    muiCdn.setAttribute("media", "screen");
    head.appendChild(muiCdn);

    const mermaidCdn = document.createElement("link");
    mermaidCdn.setAttribute("rel", "stylesheet");
    mermaidCdn.setAttribute(
      "href",
      "https://cdnjs.cloudflare.com/ajax/libs/mermaid/7.0.10/mermaid.min.css"
    );
    head.appendChild(mermaidCdn);

    for (const style of styles) {
      if (!!style.dataset["emotion"]) {
        head.appendChild(style.cloneNode(true));
      }
    }
    const css = document.createElement("style");
    css.innerText = templateCss;
    head.appendChild(css);
  }

  /**
   * notex main building
   */
  const notex = doc.getElementById("notex");
  if (notex) notex.innerHTML = contents.replaceAll("\n", "");

  /**
   * script building
   */
  {
    const scripts = document.createElement("script");
    const loadScripts = notexScripts.reduce(
      (pre, curr) => `${pre}(${curr.toString().replaceAll("\n", "")})();`,
      ""
    );
    scripts.innerText = loadScripts;
    doc.body.appendChild(scripts);
  }

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
  const { handleSuc, handleErr } = useSnackHandler();
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
  const handlePDF = () =>
    print(meta, load.res)
      .then(() => {})
      .catch(() => {});
  const handleHTML = async () => {
    const mainWindow = getCurrent();
    const path = await dialog
      .open({
        defaultPath,
        directory: true,
        multiple: false,
      })
      .catch(() => "");

    if (path && typeof path === "string") {
      console.log("template waiting");
      const ulf = await mainWindow
        .once(
          "return_template",
          (
            e: TauriEvent<{
              html: string;
              css: string;
              js: string;
            }>
          ) => {
            try {
              const htmlsrc = createHTMLSource(
                meta,
                e.payload.html,
                e.payload.css,
                document.head.getElementsByTagName("style"),
                markdown.current?.innerHTML || "",
                lang
              );

              html(meta, htmlsrc, path)
                .then(() => handleSuc("html file successfully created"))
                .catch((err) => handleErr(err.message));
            } catch (err) {
              handleErr((err as Error).message);
            }
          }
        )
        .catch(() => undefined);

      if (ulf !== undefined) {
        await mainWindow.emit("template").catch((err) => {
          handleErr(err.message);
          return undefined;
        });
      }
    }
  };

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
    <div css={root(theme)}>
      <Controler handlePDF={handlePDF} handleHTML={handleHTML} />
      <Markdown md={load.res} ref={markdown} />
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
