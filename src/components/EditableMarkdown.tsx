/** @jsxImportSource @emotion/react */
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import { css, useTheme, Theme } from "@emotion/react";
import { useWrite, useAppDispatch, useDOM } from "../redux/hooks";
import { Write, MdType, DOM } from "../redux/write";
import useKeyAction, { useCaretControl, Caret } from "../hooks/Keyboard";
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
import {
  ComponentType,
  TableRowComponent,
  TableCellComponent,
  ReactMarkdownNames,
  ReactMarkdownProps,
} from "react-markdown/lib/ast-to-react";
/** @typedef {import('remark-directive')} */
import { visit } from "unist-util-visit";
import h from "hastscript";
/** @type {import('unified').Plugin<[], import('mdast').Root>} */
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import rehypeKatex from "rehype-katex";
import remarkDirective from "remark-directive";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import mermaid from "mermaid";
import * as katex from "katex";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

type CustomMarkdown = React.FunctionComponent<{ text: string }>;

/**
 * this component only rewrite code block and not optimized by react-markdown
 * TODO -- create (remark and) rehype plugin.
 * there seems to be no useful rehype plugin for mermaid.
 * https://github.com/remarkjs/react-markdown#architecture
 */
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

  return (
    <Typography
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
const Graph: CustomMarkdown = ({ text }) => {
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

  console.log(domain, func);

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
    console.error(err);
  }

  const [load, setLoad] = useState<Coordinate[]>([]);

  useEffect(() => {
    (async () => {
      const reducer = reduction(parseResult);
      setLoad(
        []
        // await Promise.all(
        //   [...new Array(division)].map(async (_, i) => {
        //     const x = min + (i / division) * (max - min);
        //     const y = await reducer(x).catch((_) => 0);
        //     return { x, y };
        //   })
        // )
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
                    text={(children[0] as React.ReactElement).props.children[0]}
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
                    text={(children[0] as React.ReactElement).props.children[0]}
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
        p: ({ children }) => (
          <div
            css={css`
              width: 100%;
              margin: 0;
              padding: 0;
            `}
          >
            {children}
          </div>
        ),
        table: TableContainer,
        thead: ({ children }) => <div className={"thead"}>{children}</div>,
        tbody: ({ children }) => <div className={"body"}>{children}</div>,
        tr: TableRow,
        th: TableCell,
        td: TableCell,
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
      rehypePlugins={[[rehypeKatex, { throwOnError: false, output: "html" }]]}
    >
      {md}
    </ReactMarkdown>
  );
};

const fullWidth = css`
  width: 100%;
  min-height: 24px;
  margin: 0 0 0 0;
  padding: 0 0 0 0;
`;

const hoverBorder = css`
  position: relative;
  background: #fff;
  border: 0 solid blue;
  box-sizing: border-box;
`;

/**
 * caret-->|(current target)
 */
type ControlSpanProps = {
  idx: number;
  pos: number;
  line: number;
  char: string | null;
  caret: Caret;
  updateCaret: (idx: number, lineDif: number, posDif: number) => void;
  forceUpdateCaret: (idx: number, line: number, pos: number) => void;
};
const ControlSpan: React.FC<ControlSpanProps> = ({
  idx,
  pos,
  line,
  char,
  caret,
  updateCaret,
  forceUpdateCaret,
}) => {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLSpanElement>(null);
  const { handleKeyDown, handleKeyUp } = useKeyAction(
    (keyboard, e) => {
      console.log(e.key, "keydown");
      if (keyboard["Enter"]) {
        e.preventDefault();
        dispatch(
          Write.updateDOM({
            idx,
            line,
            pos,
            char: "\n",
          })
        );
        forceUpdateCaret(idx, line + 1, 1);
      } else if (keyboard["Backspace"]) {
        e.preventDefault();
        dispatch(
          Write.updateDOM({
            idx,
            line,
            pos: pos - 1,
            isDelete: true,
          })
        );
        updateCaret(idx, 0, -1);
      } else if (keyboard["ArrowUp"]) {
        updateCaret(idx, -1, 0);
      } else if (keyboard["ArrowDown"]) {
        updateCaret(idx, +1, 0);
      } else if (keyboard["ArrowLeft"]) {
        updateCaret(idx, 0, -1);
      } else if (keyboard["ArrowRight"]) {
        updateCaret(idx, 0, +1);
      } else if (keyboard["Tab"]) {
        e.preventDefault();
        dispatch(Write.updateDOM({ idx, line, pos, char: "  " }));
        forceUpdateCaret(idx, line, pos + 2);
      } else if (e.key.length === 1) {
        e.preventDefault();
        dispatch(Write.updateDOM({ idx, line, pos, char: e.key }));
        forceUpdateCaret(idx, line, pos + 1);
      }
    },
    (keyboard, e) => {}
  );

  useEffect(() => {
    if (ref.current) ref.current.focus();
  });

  return pos === caret?.pos ? (
    <span
      contentEditable
      ref={ref}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      css={css`
        color: red;
      `}
    >
      {char}
    </span>
  ) : (
    <span onClick={() => forceUpdateCaret(idx, line, pos)}>{char}</span>
  );
};

type ControlDivProps = {
  idx: number;
  line: number;
  caret: ReturnType<typeof useCaret>["caret"];
  str: string;
  endLine: number;
  updateCaret: ReturnType<typeof useCaret>["updateCaret"];
  forceUpdateCaret: ReturnType<typeof useCaret>["forceUpdateCaret"];
};
const ControlDiv: React.FC<ControlDivProps> = ({ idx, line, str, endLine }) => {
  const chars = str.split("");
  const { caret, updateCaret, forceUpdateCaret } = useCaret(
    endLine,
    chars.length + 1
  );

  return (
    <div
      css={css`
        ${fullWidth}
        cursor: text;
      `}
    >
      {chars.map((char, pos) => (
        <ControlSpan
          idx={idx}
          pos={pos + 1}
          line={line}
          caret={caret}
          char={char}
          updateCaret={updateCaret}
          forceUpdateCaret={forceUpdateCaret}
          key={`idx_${idx}_line_${line}_pos_${pos}`}
        />
      ))}
      <ControlSpan
        idx={idx}
        line={line}
        pos={chars.length + 1}
        caret={caret}
        char={null}
        updateCaret={updateCaret}
        forceUpdateCaret={forceUpdateCaret}
      />
    </div>
  );
};

/**
 * handle split with paragraph's blur
 */
const MarkdownWrapper: React.FC<{ idx: number; dom: DOM }> = ({ idx, dom }) => {
  const {
    innerCaret,
    getCaret,
    updateCaretGenerator,
    forceUpdateCaretGenerator,
  } = useContext(CaretControlContext);
  const lines = dom.value.split("\n");
  const endLine = lines.length;
  const line =
    0 < innerCaret.line
      ? Math.min(innerCaret.line, endLine) % (endLine + 1)
      : (Math.max(innerCaret.line, -1 * endLine) % (endLine + 1)) + endLine;
  const chars = lines[line - 1] ? lines[line - 1].split("") : [];
  const caret = getCaret(endLine, chars.length + 1);
  const pos = caret.pos;
  const dispatch = useAppDispatch();
  const updateCaret = updateCaretGenerator(endLine, chars.length + 1);
  const forceUpdateCaret = forceUpdateCaretGenerator(endLine, chars.length + 1);
  const ref = useRef<HTMLDivElement>(null);
  const { handleKeyDown, handleKeyUp } = useKeyAction(
    (keyboard, e) => {
      e.preventDefault();
      if (keyboard["Enter"]) {
        dispatch(
          Write.updateDOM({
            idx,
            line,
            pos,
            char: "\n",
          })
        );
        forceUpdateCaret(idx, line + 1, 1);
      } else if (keyboard["Backspace"]) {
        dispatch(
          Write.updateDOM({
            idx,
            line,
            pos: pos - 1,
            isDelete: true,
          })
        );
        updateCaret(idx, 0, -1);
      } else if (keyboard["ArrowUp"]) {
        updateCaret(idx, -1, 0);
      } else if (keyboard["ArrowDown"]) {
        updateCaret(idx, +1, 0);
      } else if (keyboard["ArrowLeft"]) {
        updateCaret(idx, 0, -1);
      } else if (keyboard["ArrowRight"]) {
        updateCaret(idx, 0, +1);
      } else if (keyboard["Tab"]) {
        dispatch(Write.updateDOM({ idx, line, pos, char: "  " }));
        forceUpdateCaret(idx, line, pos + 2);
      } else if (e.key.length === 1) {
        dispatch(Write.updateDOM({ idx, line, pos, char: e.key }));
        forceUpdateCaret(idx, line, pos + 1);
      }
    },
    (keyboard, e) => {
      console.log("keyup");
    }
  );
  useEffect(() => {
    console.log("lines", lines, " - line: ", line);
    console.log("chars", chars, " - pos: ", pos);
    if (ref.current) ref.current.focus();
  });

  return idx === caret.idx ? (
    <div css={[fullWidth, hoverBorder]}>
      <Markdown md={lines.slice(0, line - 1).join("\n")} />
      <Markdown md={chars.slice(0, pos).join("")} />
      <span
        ref={ref}
        contentEditable
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        css={css`
          color: red;
        `}
      >
        {chars[pos] || null}
      </span>
      <Markdown md={chars.slice(pos + 1).join("")} />
      <Markdown md={lines.slice(line).join("\n")} />
    </div>
  ) : (
    <div onClick={() => forceUpdateCaret(idx, line, pos)}>
      <Markdown md={dom.value} />
    </div>
  );
};

const CaretControlContext = createContext<ReturnType<typeof useCaretControl>>({
  innerCaret: {
    idx: -1,
    line: 0,
    pos: 0,
  },
  getCaret: () => ({
    idx: -1,
    line: 0,
    pos: 0,
  }),
  updateCaretGenerator: () => () => {},
  forceUpdateCaretGenerator: () => () => {},
});

const useCaret = (lineMax: number, posMax: number) => {
  const { getCaret, updateCaretGenerator, forceUpdateCaretGenerator } =
    useContext(CaretControlContext);

  return {
    caret: getCaret(lineMax, posMax),
    updateCaret: updateCaretGenerator(lineMax, posMax),
    forceUpdateCaret: forceUpdateCaretGenerator(lineMax, posMax),
  };
};

const Editable: React.FC = () => {
  const dispatch = useAppDispatch();
  const doms = useWrite().doms;
  const ref = useRef<HTMLDivElement>(null);
  const { handleKeyDown, handleKeyUp } = useKeyAction((keyboard, e) => {
    if (keyboard["Enter"]) {
      e.preventDefault();
      dispatch(
        Write.insertDOM({
          inserts: [{ mdType: "inline", value: ref.current?.innerText + "\n" }],
        })
      );
    }
  });

  return (
    <CaretControlContext.Provider value={useCaretControl()}>
      <div
        css={[
          fullWidth,
          css`
            width: 100%;
            height: 80%;
            overflow: auto;
            background-color: blue;
          `,
        ]}
      >
        {doms.map((dom, idx) => (
          <MarkdownWrapper idx={idx} dom={dom} key={`dom_${idx}`} />
        ))}
      </div>
    </CaretControlContext.Provider>
  );
};

export default Editable;
