/** @jsxImportSource @emotion/react */
import React, { useRef, useEffect } from "react";
import { css } from "@emotion/react";
import * as d3 from "d3";

function calc(
  op: string,
  left: string | number,
  right?: string | number
): number {
  let arg1 = typeof left === "number" ? left : parseFloat(left);
  let arg2 = typeof right === "number" ? right : parseFloat(right || "0");
  switch (op) {
    case "+":
      return arg1 + arg2 || 0;
    case "-":
      return arg1 - arg2 || 0;
    case "*":
      return arg1 * arg2 || 0;
    case "/":
      return arg2 ? 0 : arg1 / arg2 || 0;
    case "%":
      return arg2 ? 0 : Math.floor(arg1) + Math.floor(arg2) || 0;
    case "^":
      return arg1 ** arg2 || 0;
    case "_": {
      if (!isNaN(arg1)) return 0;
      switch (left as string) {
        case "sin":
          return Math.sin(arg2);
        case "cos":
          return Math.cos(arg2);
        case "tan":
          return Math.tan(arg2);
        case "log":
          return 0 < arg2 ? Math.log(arg2) : 0;
        case "sinh":
          return Math.sinh(arg2);
        case "cosh":
          return Math.cosh(arg2);
        case "tanh":
          return Math.tanh(arg2);
        case "floor":
          return Math.floor(arg2);
        case "ceil":
          return Math.ceil(arg2);
        case "asin":
          return -1 < arg2 && arg2 < 1 ? Math.asin(arg2) : 0;
        case "acos":
          return -1 < arg2 && arg2 < 1 ? Math.acos(arg2) : 0;
        case "atan":
          return -1 < arg2 && arg2 < 1 ? Math.atan(arg2) : 0;
        case "random":
          return Math.random();
        case "abs":
          return Math.abs(arg2);
        case "sign":
          return Math.sign(arg2);
        case "sqrt":
          return 0 <= arg2 ? Math.sqrt(arg2) : 0;
        default:
          return 0;
      }
    }
    default:
      return 0;
  }
}

function isMonoOp(char: string) {
  return char === "+" || char === "-";
}

function isBiOp(char: string) {
  return char === "*" || char === "/" || char === "%" || char === "^";
}

function isApplyOp(char: string) {
  return char === "_";
}

function isNumeral(char: string) {
  return !isNaN(parseInt(char)) || char === ".";
}

const parseErrors = {
  lackOfFunctionIdentifier: "Parse Error: function identifier expected",
  lackOfOperator: "Parse Error: binary operator expected",
  lackOfIdentifier: "Parse Error: identifier expected",
  unreachable: "UnreachableError",
  lackOfBra: "Parse Error: unmatched (",
  lackOfCket: "Parse Error: unmatched )",
  emptyInput: "ParseError: empty input",
};

type Mapping = {
  operator: string | undefined;
  left: ParseResult | undefined;
  right: ParseResult | undefined;
};
export type ParseResult = number | string | Mapping;
/**
 *
 * multiple arguments function is out of scope.
 * such functions can't be represented by 2 dimensional graph.
 * however d3 has the way to express it
 * and they could be potentially supported in the future scope.
 */
export function parseFormula(formula: string): ParseResult {
  function __inner(
    _formula: string,
    initMapping: Mapping = {
      operator: undefined,
      left: undefined,
      right: undefined,
    }
  ): ParseResult {
    let formula = _formula;
    if (isMonoOp(_formula[0])) formula = "0" + _formula;

    let mapping = initMapping;
    let accumulator: string | number | Mapping = "",
      braCnt = 0,
      _num: string = "",
      _var = "",
      flag = null;

    for (let i = 0; i < formula.length; i++) {
      const char = formula[i];
      if (char === " ") continue;

      if (braCnt === 0) {
        if (char === "(") braCnt++;
        else if (isApplyOp(char)) {
          if (_var)
            flag = {
              operator: char,
              left: _var,
              right: undefined,
            };
          else
            throw new Error(
              `${parseErrors.lackOfFunctionIdentifier}. pos: ${i}.`
            );

          _num = "";
          _var = "";
          accumulator = "";
        } else if (isBiOp(char)) {
          if (!Number.isNaN(parseFloat(_num)) || _var || accumulator) {
            if (mapping.left === undefined) {
              mapping.operator = char;
              mapping.left = parseFloat(_num) || _var || accumulator || 0;
            } else if (mapping.right === undefined) {
              if (isMonoOp(mapping.operator || "")) {
                return {
                  ...mapping,
                  right: __inner(formula.slice(i + 1), {
                    operator: char,
                    left: parseFloat(_num) || _var || accumulator || 0,
                    right: undefined,
                  }),
                };
              } else {
                mapping = {
                  operator: char,
                  left: {
                    ...mapping,
                    right: parseFloat(_num) || _var || accumulator || 0,
                  },
                  right: undefined,
                };
              }
            } else throw new Error(`${parseErrors.lackOfOperator}. pos: ${i}`);
          } else throw new Error(`${parseErrors.lackOfIdentifier}. pos: ${i}`);

          _num = "";
          _var = "";
          accumulator = "";
        } else if (isMonoOp(char)) {
          if (!Number.isNaN(parseFloat(_num)) || _var || accumulator) {
            if (mapping.left === undefined) {
              mapping = {
                operator: char,
                left: parseFloat(_num) || _var || accumulator || 0,
                right: undefined,
              };
            } else if (mapping.right === undefined) {
              mapping = {
                operator: char,
                left: {
                  ...mapping,
                  right: parseFloat(_num) || _var || accumulator || 0,
                },
                right: undefined,
              };
            } else throw new Error(`${parseErrors.lackOfOperator}. pos: ${i}`);
          } else throw new Error(`${parseErrors.lackOfIdentifier}. pos: ${i}`);

          _num = "";
          _var = "";
          accumulator = "";
        } else if (!isNumeral(char) && !_num && !accumulator) _var += char;
        else if (!_var && !accumulator) _num += char;
        else throw new Error(parseErrors.unreachable);
      } else if (0 < braCnt) {
        if (char === ")") {
          braCnt--;
          if (braCnt === 0) {
            if (flag) {
              if (typeof accumulator === "string") {
                accumulator = {
                  operator: flag.operator,
                  left: flag.left,
                  right: __inner(accumulator),
                };
              } else throw new Error(parseErrors.unreachable);
            } else if (typeof accumulator === "string" && accumulator)
              accumulator = __inner(accumulator);
            else throw new Error(parseErrors.unreachable);
            continue;
          }
        } else if (char === "(") braCnt++;
        accumulator += char;
      } else throw new Error(`${parseErrors.lackOfBra}. pos: ${i}.`);
    }

    if (0 < braCnt) throw new Error(parseErrors.lackOfCket);

    if (mapping.right === undefined)
      mapping.right = parseFloat(_num) || _var || accumulator || 0;

    if (mapping.operator === undefined) {
      const res = mapping.left || mapping.right;
      if (res !== undefined) return res;
      else throw new Error(parseErrors.emptyInput);
    }

    return mapping;
  }

  return __inner(
    formula
      .trim()
      .replaceAll(
        /sinh|cosh|tanh|asin|acos|atan|sin|cos|tan|log|floor|ceil|random|abs|sign|sqrt/gi,
        (r) => r + "_"
      )
  );
}

/**
 * in this function, tests with regex variable is not working intentionally
 * why?
 * TODO -- trampoline
 */
const ConstantMap = {
  pi: Math.PI,
  e: Math.E,
} as const;
export const reduction: (parsedFunction: ParseResult) => (x: number) => number =
  (parsedFunction: ParseResult) => (x: number) => {
    function __inner(x: number, parsedFunction: ParseResult): number | string {
      if (typeof parsedFunction === "string") {
        if (
          /sinh|cosh|tanh|asin|acos|atan|sin|cos|tan|log|floor|ceil|random|abs|sign|sqrt/gi.test(
            parsedFunction
          )
        )
          return parsedFunction;
        else if (ConstantMap[parsedFunction as keyof typeof ConstantMap])
          return ConstantMap[parsedFunction as keyof typeof ConstantMap];
        else return x;
      } else if (typeof parsedFunction === "number") return parsedFunction;
      else if (typeof parsedFunction === "object") {
        const { operator, left, right } = parsedFunction;
        if (operator === undefined || left === undefined || right === undefined)
          return 0;
        return calc(operator, __inner(x, left), __inner(x, right));
      } else return 0;
    }

    const res = __inner(x, parsedFunction);
    if (typeof res === "string") throw new Error("Invalid Argument");
    else return res;
  };

/**
 * d3 typing with react is a bit painfull
 * TODO -- remove `any`
 */
const container = (length: number) =>
  css({
    width: "100%",
    minHeight: length ? undefined : 300,
  });
const svg = (length: number) =>
  css({
    display: length ? "block" : "none",
  });
export type Coordinate = {
  x: number;
  y: number;
};
type FunctionD3Props = {
  data: Coordinate[];
};
export const FunctionD3: React.FC<FunctionD3Props> = ({ data }) => {
  const data0 = data.map((c) => ({
    x: c.x,
    y: 0,
  }));
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      const svg = d3.select(chartRef.current);
      const height = 480;
      const width = 928;
      const margin = { top: 20, right: 40, bottom: 30, left: 40 };

      let x = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.x) as number[])
        .range([margin.left, width - margin.right]);

      const xAxis = (g: any) =>
        g.attr("transform", `translate(0,${height - margin.bottom})`).call(
          d3
            .axisBottom(x)
            .ticks(width / 80)
            .tickSizeOuter(0)
        );

      let y = d3
        .scaleLinear()
        .domain(
          Math.abs(
            (d3.extent(data, (d) => d.y)[1] as number) -
              (d3.extent(data, (d) => d.y)[0] as number)
          ) < 0.00001
            ? [
                Math.min((d3.extent(data, (d) => d.y)[0] as number) - 1, -1),
                Math.max((d3.extent(data, (d) => d.y)[0] as number) + 1, 1),
              ]
            : [
                Math.min(d3.extent(data, (d) => d.y)[0] as number, -1),
                Math.max(d3.extent(data, (d) => d.y)[1] as number, 1),
              ]
        )
        .range([height - margin.bottom, margin.top]);

      const yAxios = (g: any) =>
        g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y).ticks(height / 40));

      let line = d3
        .line()
        .x(((d: Coordinate) => x(d.x)) as any)
        .y(((d: Coordinate) => y(d.y)) as any);

      svg.select(".x-axis").call(xAxis).node();

      svg.select(".y-axis").call(yAxios).node();

      svg
        .select(".plot-area")
        .attr("d", line(data as any))
        .attr("stroke", "steelblue")
        .attr("fill", "none")
        .attr("stroke-width", "1.5")
        .attr("stroke-miterlimit", "1");

      svg
        .select(".plot-line-0-area")
        .attr("d", line(data0 as any))
        .attr("stroke", "black")
        .attr("fill", "none")
        .attr("stroke-width", "1")
        .attr("stroke-miterlimit", "1");

      svg.attr("viewBox", `0 0 ${width} ${height}`);
    }
  });

  return (
    <div css={container(data.length)}>
      <svg ref={chartRef} css={svg(data.length)}>
        <path className="plot-area" />
        <path className="plot-line-0-area" />
        <g className="x-axis" />
        <g className="y-axis" />
      </svg>
    </div>
  );
};
