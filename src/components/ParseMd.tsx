import React, { useEffect, useMemo, useRef } from "react";
import * as katex from "katex";
import { makeStyles } from "@material-ui/core";
import { Parser, parsers } from "../utils/lib/parser";
import { TableD3 } from "./D3";

const parser = new Parser(...Object.values(parsers));

const useStyles = makeStyles((theme) => ({
  whiteSpace: {
    whiteSpace: "normal",
    wordBreak: "break-all",
    overflowWrap: "normal",
  },
}));

type CSSPropertyType = {
  [property: string]: string;
};

const useStylesFromParam = makeStyles((theme) => ({
  styled: (props: CSSPropertyType) => props,
}));

interface StyledProps {
  root: keyof JSX.IntrinsicElements;
  style: CSSPropertyType;
  children?: React.ReactNode;
}
const Styled: React.FC<StyledProps> = ({ root, style, children }) => {
  const classes = {
    ...useStyles(),
    ...useStylesFromParam({ ...style }),
  };
  const commonProps = {
    className: classes.whiteSpace + " " + classes.styled,
  };
  const Root = root;

  return <Root {...commonProps}>{children}</Root>;
};

type KaTeXProps = {
  text: string;
  display: boolean;
  style?: CSSPropertyType;
};
const KaTeX: React.FC<KaTeXProps> = ({ text, display, style }) => {
  const classes = {
    ...useStyles(),
    ...useStylesFromParam({ ...style }),
  };
  const ref: React.RefObject<HTMLSpanElement> = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      katex.render(text, ref.current, {
        displayMode: display,
        throwOnError: false,
        output: "html",
      });
    }
  }, [text]);

  return display ? (
    <span className={classes.styled} ref={ref} />
  ) : (
    <span className={classes.whiteSpace + " " + classes.styled} ref={ref} />
  );
};

const ParseMd: React.FC<{
  str: string;
  type?: string; //only used as react internal key
  id?: string; //only used as react internal key
  deps?: unknown[];
}> = ({ str, type = "", id = -1, deps = [] }) => {
  return useMemo(() => {
    let parsedJSX: JSX.Element[] = [];
    let style = {};

    try {
      const parsed = parser.parse(str);
      console.log(parsed)
      for (let i = 0; i < parsed.length; i++) {
        const obj = parsed[i];
        switch (obj.type) {
          case "katex":
            parsedJSX.push(
              <KaTeX
                text={obj.value}
                display={obj.display}
                style={style}
                key={obj.type + "_" + i + "_in_" + type + id}
              />
            );
            break;
          case "break":
            parsedJSX.push(
              <br key={obj.type + "_" + i + "_in_" + type + id} />
            );
            break;
          case "link":
            parsedJSX.push(
              <a
                href={obj.value}
                target={"_blank"}
                rel={"noreferrer"}
                key={obj.type + "_" + i + "_in_" + type + id}
              >
                {obj.surface || obj.value}
              </a>
            );
            break;
          case "attr":
            style = obj.value;
            break;
          case "image":
            parsedJSX.push(
              <img src={obj.value} alt={obj.alt} width={"100%"} />
            );
            break;
          case "table":
            parsedJSX.push(
              <TableD3
                row_num={obj.cells.length}
                column_num={obj.headers.length}
                headers={obj.headers}
                cells={obj.cells}
                mode={"preview"}
                handleCell={() => {}}
              />
            );
            break;
          default:
            parsedJSX.push(
              <Styled
                root={"span"}
                style={style}
                key={obj.type + "_" + i + "_in_" + type + id}
              >
                {obj.value.toString()}
              </Styled>
            );
            break;
        }
      }
    } catch (err) {
      parsedJSX = [
        <React.Fragment key={"parse_error_in_" + type + id}>
          {str}
        </React.Fragment>,
      ];
    }

    return <>{parsedJSX}</>;
  }, [str, ...deps]);
};

export default ParseMd;
