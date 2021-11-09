/** @jsxImportSource @emotion/react */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { css, useTheme, Theme } from "@emotion/react";
import { Typography } from "@mui/material";
import { Variant } from "@mui/material/styles/createTypography";
import { FunctionD3, parseFormula, reduction, Coordinate } from "./D3";
import useScroll from "../hooks/Scroll";
import sectionMsg from "../utils/constant/write/section";
import { useSettings } from "../redux/hooks";
import ReactMarkdown from "react-markdown";
import {
  ComponentType,
  CodeComponent,
  TableRowComponent,
  TableCellComponent,
  ReactMarkdownNames,
  ReactMarkdownProps,
} from "react-markdown/lib/ast-to-react";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import mermaid from "mermaid";
import * as katex from "katex";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

/**
 * this component only rewrite code block and not optimized by react-markdown
 * TODO -- create (remark and) rehype plugin.
 * there seems to be no useful rehype plugin for mermaid.
 * https://github.com/remarkjs/react-markdown#architecture
 */
const Mermaid: CodeComponent = ({ node, children, ...props }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        mermaid.render(
          "mermaid" + uuidv4(),
          String(children),
          (svg) => {
            if (ref.current) ref.current.innerHTML = svg;
          },
          ref.current
        );
      } catch (e) {
        ref.current.innerHTML = String(children);
      }
    }
  });

  return <div className={"mermaid"} ref={ref} />;
};

/**
 * this regex is currently work, but hopefully get it by remark plugin.
 */
const regex = /!|\?|,|\s/g;
type SectionProps = { level: number };
const Section: React.FC<SectionProps> = ({ level, children }) => {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { addEl, removeEl } = useScroll();
  const sectionMsgs = sectionMsg(useSettings()["language"]);
  const idx = crypto
    .createHash("sha256")
    .update(
      String(children)
        .toLowerCase()
        .replaceAll(regex, (match) => {
          switch (match) {
            case " ":
              return "-";
            default:
              return "";
          }
        }),
      "utf8"
    )
    .digest("hex");

  useEffect(() => {
    addEl(idx, ref);

    return () => {
      removeEl(idx);
    };
    //eslint-disable-next-line
  }, []);

  return (
    <Typography
      id={idx}
      variant={("h" + Math.min(6, level + 2)) as Variant}
      ref={ref}
      css={css({
        width: "99.5%",
        minHeight: theme.typography.fontSize * 2,
        margin: theme.spacing(0.2),
        padding: theme.spacing(0.2),
        borderBottomWidth: "2px",
        borderBottomColor: theme.palette.divider,
        borderBottomStyle: "solid",
      })}
    >
      {level === 1
        ? children || sectionMsgs.subject
        : children || sectionMsgs.title}
    </Typography>
  );
};

/**
 * this component also not optimized as Mermaid
 */
type FunctionGraphData = {
  func: string;
  domain: {
    min: number;
    max: number;
    division: number;
  };
};
const Graph: CodeComponent = ({ node, children, ...props }) => {
  const lines = String(children).split("\n");
  let domain = {} as {
    [key in keyof FunctionGraphData["domain"]]: string;
  };
  let func = "";
  for (const line of lines) {
    if (line.startsWith("min=")) {
      domain.min = line.slice(4).trim();
    } else if (line.startsWith("max=")) {
      domain.max = line.slice(4).trim();
    } else if (line.startsWith("division=")) {
      domain.division = line.slice(9).trim();
    } else if (line.startsWith("func=")) {
      func = line.slice(5).trim();
    }
  }

  const min =
    Number.isNaN(domain.min) || Number(domain.max) <= Number(domain.min)
      ? 0
      : Number(domain.min);
  const max =
    Number.isNaN(domain.max) || Number(domain.max) <= Number(domain.min)
      ? 1
      : Number(domain.max);
  const division =
    !Number.isInteger(Number(domain.division)) || Number(domain.division) < 2
      ? 100
      : Number(domain.division);

  const parseResult = useMemo(() => {
    try {
      return parseFormula(func);
    } catch (err) {
      console.error(String(err));
      return 0;
    }
  }, [func]);

  const [load, setLoad] = useState<Coordinate[]>([]);

  useEffect(() => {
    (async () => {
      setLoad(
        await Promise.all(
          [...(Array(division).keys() as unknown as number[])].map(
            async (_, i) => {
              const x = min + (i / division) * (max - min);
              const y = await reduction(x)(parseResult).catch((err) => 0);
              return { x, y };
            }
          )
        )
      );
    })();
  }, [parseResult, min, max, division]);

  return <FunctionD3 data={load} />;
};

const tableClasses = {
  table: css`
    width: 99.5%;
    display: flex;
    flex-direction: column;
    overflow-x: auto;
  `,
  thead: css`
    margin: 0;
    padding: 0;
    display: flex;
    width: 100%;
  `,
  tr: css`
    margin: 0;
    padding: 0;
    display: flex;
    flex-basis: 100%;
  `,
  cell: (theme: Theme, isHeader: boolean, align: any) => css`
    flex-basis: 20%;
    min-height: 2rem;
    background-color: ${isHeader ? "rgba(200, 200, 200, 0.25)" : "inherit"};
    border-style: solid;
    border-color: ${theme.palette.divider};
    border-width: 0.5px;
    text-align: ${align || "center"};
    overflow-x: auto;
    &:hover {
      background-color: rgba(200, 200, 200, 0.05);
    }
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
      background-color: #f5f5f5;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
      backgroundimage: -webkit-gradient(
        linear,
        left bottom,
        left top,
        from(#30cfd0),
        to(#330867)
      );
    }
  `,
};

const TableContainer:
  | ComponentType<
      React.ClassAttributes<HTMLTableElement> &
        React.TableHTMLAttributes<HTMLTableElement> &
        ReactMarkdownProps
    >
  | ReactMarkdownNames = ({ node, children, ...props }) => {
  return (
    <div {...props} css={tableClasses.table} className={"table"}>
      {children}
    </div>
  );
};
const TableRow: TableRowComponent | ReactMarkdownNames = ({
  node,
  isHeader,
  children,
  ...props
}) => {
  return (
    <div
      {...props}
      className={"tr"}
      css={isHeader ? tableClasses.thead : tableClasses.tr}
    >
      {children}
    </div>
  );
};
const TableCell: TableCellComponent | ReactMarkdownNames = ({
  node,
  isHeader,
  children,
  ...props
}) => {
  const theme = useTheme();
  return (
    <div
      {...props}
      className={isHeader ? "th" : "td"}
      css={tableClasses.cell(theme, isHeader, node.properties?.align)}
    >
      {children}
    </div>
  );
};

const whiteSpace = css({
  whiteSpace: "normal",
  wordBreak: "break-all",
  overflowWrap: "normal",
});

type CSSPropertyType = {
  [property: string]: string;
};
interface StyledProps {
  root: keyof JSX.IntrinsicElements;
  style: CSSPropertyType;
}
//eslint-disable-next-line
const Styled: React.FC<StyledProps> = ({ root, style, children }) => {
  const Root = root;

  return <Root css={css([whiteSpace, css(style)])}>{children}</Root>;
};

/**
 * unused by now
 * if rehypeKatex is not meet for my demands, write rehype plugin by myself
 */
type KaTeXProps = {
  display: boolean;
  style?: CSSPropertyType;
};
//eslint-disable-next-line
const KaTeX: React.FC<KaTeXProps> = ({ display, style, children }) => {
  const ref: React.RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      katex.render(String(children), ref.current, {
        displayMode: display,
        throwOnError: false,
        output: "html",
      });
    }
  }, [children, display]);

  return display ? (
    <div css={whiteSpace} ref={ref} />
  ) : (
    <span css={[whiteSpace, css(style)]} ref={ref} />
  );
};

type MarkdownProps = {
  md: string;
  container?: React.RefObject<HTMLDivElement>;
};
const Markdown: React.FC<MarkdownProps> = ({ md, container }) => {
  const { pickEl } = useScroll(container?.current || undefined);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "neutral",
    });
  }, []);

  return (
    <ReactMarkdown
      components={{
        h1: ({ level, children }) => (
          <Section level={level}>{children}</Section>
        ),
        h2: ({ level, children }) => (
          <Section level={level}>{children}</Section>
        ),
        h3: ({ level, children }) => (
          <Section level={level}>{children}</Section>
        ),
        h4: ({ level, children }) => (
          <Section level={level}>{children}</Section>
        ),
        h5: ({ level, children }) => (
          <Section level={level}>{children}</Section>
        ),
        h6: ({ level, children }) => (
          <Section level={level}>{children}</Section>
        ),
        table: TableContainer,
        thead: ({ children }) => <div className={"thead"}>{children}</div>,
        tbody: ({ children }) => <div className={"body"}>{children}</div>,
        tr: TableRow,
        th: TableCell,
        td: TableCell,
        a: ({ node, href, children, ...props }) => {
          if (href && href[0] === "#") {
            return (
              <a
                {...props}
                onClick={(e) => {
                  e.preventDefault();
                  pickEl(
                    crypto
                      .createHash("sha256")
                      .update(href.slice(1), "utf8")
                      .digest("hex")
                  );
                }}
              >
                {children}
              </a>
            );
          } else {
            return (
              <a href={href} {...props}>
                {children}
              </a>
            );
          }
        },
        img: ({ alt, ...props }) => (
          <img
            {...props}
            alt={alt ?? "maybe invalid format or unavailable url"}
            width={"100%"}
          />
        ),
        code: ({ node, inline, className, children, ref, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          if (!inline) {
            if (match) {
              if (match[1] === "mermaid") {
                return <Mermaid node={node}>{children}</Mermaid>;
              } else if (match[1] === "d3") {
                return <Graph node={node}>{children}</Graph>;
              } else {
                return (
                  <SyntaxHighlighter
                    style={dark}
                    language={match[1]}
                    showLineNumbers
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                );
              }
            } else {
              return (
                <SyntaxHighlighter style={dark} PreTag="div" {...props}>
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }
          } else {
            return <code {...props}>{children}</code>;
          }
        },
      }}
      linkTarget={"_blank"}
      remarkPlugins={[remarkGfm, remarkMath, remarkToc]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, output: "html" }]]}
    >
      {md}
    </ReactMarkdown>
  );
};

export default Markdown;
