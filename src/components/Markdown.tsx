/** @jsxImportSource @emotion/react */
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { css, Theme, Global } from "@emotion/react";
import { Typography } from "@mui/material";
import { Variant } from "@mui/material/styles/createTypography";
import {
  FunctionD3,
  ParseResult,
  parseFormula,
  reduction,
  Coordinate,
} from "./D3";
import useScroll from "../hooks/Scroll";
import sectionMsg from "../utils/constant/write/section";
import { useSettings } from "../redux/hooks";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import rehypeKatex from "rehype-katex";
/** @typedef {import('remark-directive')} */
import { visit } from "unist-util-visit";
import h from "hastscript";
/** @type {import('unified').Plugin<[], import('mdast').Root>} */
import remarkDirective from "remark-directive";
import rehypeSlug from "rehype-slug";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import mermaid from "mermaid";
import * as katex from "katex";
import { v4 as uuidv4 } from "uuid";

type CustomMarkdown = React.FunctionComponent<{ text: string }>;

const Mermaid: CustomMarkdown = ({ text }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        mermaid.render(
          "mermaid" + uuidv4(),
          text,
          (svg) => {
            if (ref.current) ref.current.innerHTML = svg;
          },
          ref.current
        );
      } catch (e) {
        ref.current.innerHTML = text;
      }
    }
  });

  return <div className={"mermaid"} ref={ref} />;
};

const section = (theme: Theme) =>
  css({
    width: "99.5%",
    minHeight: theme.typography.fontSize * 2,
    margin: theme.spacing(0.2),
    padding: theme.spacing(0.2),
    borderBottomWidth: "2px",
    borderBottomColor: theme.palette.divider,
    borderBottomStyle: "solid",
  });
type SectionProps = { id: string | undefined; level: number };
const Section: React.FC<SectionProps> = ({ id, level, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { addEl, removeEl } = useScroll();
  const sectionMsgs = sectionMsg(useSettings()["language"]);

  useEffect(() => {
    if (id) addEl(id, ref);

    return () => {
      if (id) removeEl(id);
    };
    //eslint-disable-next-line
  }, []);

  return (
    <Typography
      id={id}
      variant={("h" + Math.min(6, level + 2)) as Variant}
      ref={ref}
      css={section}
    >
      {level === 1
        ? children || sectionMsgs.subject
        : children || sectionMsgs.title}
    </Typography>
  );
};

type FunctionGraphData = {
  func: string;
  domain: {
    min: number;
    max: number;
    division: number;
  };
};
const Graph: CustomMarkdown = ({ text }) => {
  const [result, setResult] = useState<Coordinate[]>([]);

  useEffect(() => {
    console.log("graph");

    const lines = text.split("\n");
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

    let parseResult: ParseResult = 0;
    try {
      parseResult = parseFormula(func);
    } catch (err) {
      console.error((err as Error).message);
    }
    const reducer = reduction(parseResult);

    setResult(
      [...new Array(division)].map((_, i) => {
        const x = min + (i / division) * (max - min);
        const y = reducer(x);
        return { x, y };
      })
    );
  }, [text]);

  return <FunctionD3 data={result} />;
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
    <div css={[whiteSpace, css(style)]} ref={ref} />
  ) : (
    <span css={[whiteSpace, css(style)]} ref={ref} />
  );
};

function customMarker() {
  return (tree: any) => {
    visit(
      tree,
      ["textDirective", "leafDirective", "containerDirective"],
      (node) => {
        if (
          node.type === "textDirective" ||
          node.type === "leafDirective" ||
          node.type === "containerDirective"
        ) {
          switch (node.name) {
            case "mermaid": {
              const data = node.data || (node.data = {});
              const attributes = node.attributes || {};
              const hast = h("div", attributes);

              data.hName = hast.tagName;
              data.hProperties = {
                ...hast.properties,
                class: "mermaid",
              };
              break;
            }
            case "d3": {
              const data = node.data || (node.data = {});
              const attributes = node.attributes || {};
              const hast = h("div", attributes);

              data.hName = "div";
              data.hProperties = {
                ...hast,
                class: "d3",
              };
              break;
            }
            default: {
            }
          }
        }
      }
    );
  };
}

const tableCellBase = (theme: Theme) => css`
  min-height: 2rem;
  margin: 0;
  padding: ${theme.spacing(1, 1)};
  background-color: rgba(200, 200, 200, 0.25);
  border-style: solid;
  border-color: ${theme.palette.divider};
  border-width: 0.5px;
  &:hover {
    background-color: rgba(200, 200, 200, 0.05);
  }
`;
const globalTableStyle = (theme: Theme) => css`
  table {
    border-collapse: collapse;
  }
  tr {
    margin: 0px;
  }
  th {
    ${tableCellBase(theme)}
    background-color: rgba(200, 200, 200, 0.25);
  }
  td {
    ${tableCellBase(theme)}
    background-color: inherit;
  }
`;
const tableContainer = css`
  width: 100%;
  overflow-x: scroll;
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
const paragraph = (theme: Theme) => css`
  width: 100%;
  margin: ${theme.spacing(0, 0, 2)};
  padding: 0;
`;
type MarkdownProps = {
  md: string;
  container?: React.RefObject<HTMLDivElement>;
};
const Markdown = forwardRef<HTMLDivElement, MarkdownProps>(
  ({ md, container }, ref) => {
    const { pickEl } = useScroll(container?.current || undefined);

    useEffect(() => {
      mermaid.initialize({
        startOnLoad: true,
        theme: "neutral",
      });
    }, []);

    return (
      <div className={"markdown"} ref={ref}>
        <Global styles={globalTableStyle} />
        <ReactMarkdown
          components={{
            div: ({ className, children, node, ...props }) => {
              switch (className) {
                case "mermaid": {
                  if (
                    children[0] &&
                    typeof children[0] === "object" &&
                    typeof (children[0] as React.ReactElement).props
                      ?.children[0] === "string"
                  ) {
                    return (
                      <Mermaid
                        text={
                          (children[0] as React.ReactElement).props.children[0]
                        }
                      />
                    );
                  } else {
                    return (
                      <div className={className} {...props}>
                        {children}
                      </div>
                    );
                  }
                }
                case "d3": {
                  if (
                    children[0] &&
                    typeof children[0] === "object" &&
                    typeof (children[0] as React.ReactElement).props
                      ?.children[0] === "string"
                  ) {
                    return (
                      <Graph
                        text={
                          (children[0] as React.ReactElement).props.children[0]
                        }
                      />
                    );
                  } else {
                    return (
                      <div className={className} {...props}>
                        {children}
                      </div>
                    );
                  }
                }
                default:
                  return (
                    <div className={className} {...props}>
                      {children}
                    </div>
                  );
              }
            },
            h1: ({ id, level, children }) => (
              <Section id={id} level={level}>
                {children}
              </Section>
            ),
            h2: ({ id, level, children }) => (
              <Section id={id} level={level}>
                {children}
              </Section>
            ),
            h3: ({ id, level, children }) => (
              <Section id={id} level={level}>
                {children}
              </Section>
            ),
            h4: ({ id, level, children }) => (
              <Section id={id} level={level}>
                {children}
              </Section>
            ),
            h5: ({ id, level, children }) => (
              <Section id={id} level={level}>
                {children}
              </Section>
            ),
            h6: ({ id, level, children }) => (
              <Section id={id} level={level}>
                {children}
              </Section>
            ),
            p: ({ children }) => <div css={paragraph}>{children}</div>,
            table: ({ node, children, ...props }) => (
              <div css={tableContainer}>
                <table {...props}>{children}</table>
              </div>
            ),
            a: ({ node, href, children, id, ...props }) => {
              if (href && href[0] === "#") {
                return (
                  <a
                    {...props}
                    id={id}
                    onClick={(e) => {
                      e.preventDefault();
                      pickEl(href.slice(1));
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
          remarkPlugins={[
            remarkGfm,
            remarkMath,
            remarkToc,
            remarkDirective,
            customMarker,
          ]}
          rehypePlugins={[
            [rehypeKatex, { throwOnError: false, output: "html" }],
            rehypeSlug,
          ]}
        >
          {md}
        </ReactMarkdown>
      </div>
    );
  }
);

export default Markdown;
