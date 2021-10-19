import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { makeStyles, alpha } from "@material-ui/core/styles";
import { Box } from "@material-ui/core";
import * as d3 from "d3";
import { FunctionGraphData, TableInnerData } from "../redux/write";

const useStyles = makeStyles((theme) => ({
  full: {
    width: "99.5%",
  },
  table: {
    display: "flex",
    flexDirection: "column",
  },
  tableHeader: {
    backgroundColor: alpha(theme.palette.common.black, 0.03),
  },
  tableDisabledHeader: {
    display: "none",
  },
  tableRow: {
    margin: 0,
    padding: 0,
    display: "inline-flex",
    width: "100%",
    "&:hover": {
      backgroundColor: alpha(theme.palette.common.white, 0.2),
    },
  },
  input: {
    width: "100%",
  },
  space0: {
    margin: 0,
    padding: 0,
  },
}));

const useTableStyle = makeStyles((theme) => ({
  tableCell: (props: { width: number; border: boolean }) => ({
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "2rem",
    width: props.width + "%",
    borderStyle: "solid",
    borderColor: theme.palette.divider,
    borderWidth: props.border ? "0.5px" : "0px",
    textAlign: "center",
  }),
}));

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

type Mapping = {
  operator: string | undefined;
  left: ParseResult | undefined;
  right: ParseResult | undefined;
};
type ParseResult = number | string | Mapping;
/**
 *
 * multiple arguments function is out of scope.
 * such functions can't be represented by 2 dimensional graph.
 * however d3 has the way to express it
 * and they could be potentially supported in the future scope.
 */
export function parseFormula(
  formula: string,
  initMapping: Mapping = {
    operator: undefined,
    left: undefined,
    right: undefined,
  }
): ParseResult {
  //preprocess
  if (isMonoOp(formula[0])) formula = "0" + formula;
  formula = formula
    .replaceAll("_", "")
    .replaceAll(
      /sinh|cosh|tanh|asin|acos|atan|sin|cos|tan|log|floor|ceil|random|abs|sign|sqrt/gi,
      (r) => r + "_"
    );

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
        else throw "Parse Error";

        _num = "";
        _var = "";
        accumulator = "";
      } else if (isBiOp(char)) {
        if (parseFloat(_num) || _var || accumulator) {
          if (mapping.left === undefined) {
            mapping.operator = char;
            mapping.left = parseFloat(_num) || _var || accumulator;
          } else if (mapping.right === undefined) {
            if (isMonoOp(mapping.operator || "")) {
              const arg2 = parseFormula(formula.slice(i + 1), {
                operator: char,
                left: parseFloat(_num) || _var || accumulator || 0,
                right: undefined,
              });
              return {
                ...mapping,
                right: arg2,
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
          } else throw "Parse Error";
        } else throw "Parse Error";

        _num = "";
        _var = "";
        accumulator = "";
      } else if (isMonoOp(char)) {
        if (parseFloat(_num) || _var || accumulator) {
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
          } else throw "Parse Error";
        } else throw "Parse Error";

        _num = "";
        _var = "";
        accumulator = "";
      } else if (!isNumeral(char) && !_num && !accumulator) _var += char;
      else if (!_var && !accumulator) _num += char;
      else throw "Parse Error";
    } else if (0 < braCnt) {
      if (char === ")") {
        braCnt--;
        if (braCnt === 0) {
          if (flag) {
            if (typeof accumulator === "string") {
              const arg2 = parseFormula(accumulator);
              accumulator = {
                operator: flag.operator,
                left: flag.left,
                right: arg2,
              };
            } else throw "Parse Error";
          } else if (typeof accumulator === "string" && accumulator)
            accumulator = parseFormula(accumulator);
          else throw "Parse Error";
          continue;
        }
      } else if (char === "(") braCnt++;
      accumulator += char;
    } else throw "Parse Error";
  }

  if (mapping.right === undefined)
    mapping.right = parseFloat(_num) || _var || accumulator || 0;

  if (mapping.operator === undefined) {
    const res = mapping.left || mapping.right;
    if (res !== undefined) return res;
    else throw "Parse Error";
  }

  return mapping;
}

/**
 * in this function, tests with regex variable is not working intentionally
 * why?
 */
const ConstantMap = {
  pi: Math.PI,
  e: Math.E,
} as const;
const reduction: (
  x: number
) => (parsedFunction: ParseResult) => Promise<number> =
  (x: number) => async (parsedFunction: ParseResult) => {
    async function __inner(
      x: number,
      parsedFunction: ParseResult
    ): Promise<number | string> {
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
        const { operator: op, left: left, right: right } = parsedFunction;
        if (op === undefined || left === undefined || right === undefined)
          return 0;
        const calculatedArg1 = await __inner(x, left);
        const calculatedArg2 = await __inner(x, right);
        return calc(op, calculatedArg1, calculatedArg2);
      } else return 0;
    }

    const res = await __inner(x, parsedFunction);
    if (typeof res === "string") throw "Invalid Argument";
    else return res;
  };

/**
 * d3 typing with react is a bit painfull
 * TODO -- remove `any`
 */
type FunctionD3Props = {
  handleErr: (msg: string) => void;
} & FunctionGraphData;
export const FunctionD3: React.FC<FunctionD3Props> = ({
  func,
  domain,
  handleErr,
}) => {
  type Coordinate = {
    x: number;
    y: number;
  };

  const [min, max, division] =
    Number.isNaN(domain.min) ||
    Number.isNaN(domain.max) ||
    Number.isNaN(domain.division) ||
    domain.max <= domain.min ||
    !Number.isInteger(domain.division)
      ? [0, 1, 100]
      : [domain.min, domain.max, domain.division];

  const data0 = [...(Array(domain.division).keys() as unknown as number[])].map(
    (_, i) => ({
      x: min + (i / division) * (max - min),
      y: 0,
    })
  );
  const [data, setData] = useState(data0);

  const parseResult = useMemo(() => {
    try {
      return parseFormula(func);
    } catch (err) {
      handleErr(err as string);
      return 0;
    }
  }, [func]);
  const updateData = useCallback(
    () =>
      Promise.all(
        [...(Array(division).keys() as unknown as number[])].map(
          async (_, i) => {
            const x = min + (i / division) * (max - min);
            const y = await reduction(x)(parseResult).catch((err) => {
              console.error(err);
              return 0;
            });
            return { x, y };
          }
        ) || []
      ),
    [domain, parseResult]
  );

  useEffect(() => {
    //console.log("rendered Function D3");
    (async () => {
      setData(await updateData());
    })();
  }, [updateData]);

  const chartRef = useD3(
    (svg) => {
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
    },
    [...data]
  );

  return (
    <Box>
      <svg ref={chartRef}>
        <path className="plot-area" />
        <path className="plot-line-0-area" />
        <g className="x-axis" />
        <g className="y-axis" />
      </svg>
    </Box>
  );
};

/**
 * d3 typing with react is a bit painfull
 * TODO -- remove `any`
 */
type TableD3Props = {
  border?: boolean;
  mode: "edit" | "preview";
  handleCell: (i: number, j: number, arg: string) => void;
} & TableInnerData;
export const TableD3: React.FC<TableD3Props> = ({
  row_num,
  column_num,
  headers,
  cells,
  border = true,
  mode,
  handleCell,
}) => {
  const width = 99.5 / column_num;
  const classes = {
    ...useStyles(),
    ...useTableStyle({
      width: width,
      border: border,
    }),
  };
  const [cell, setCell] = useState<[number | undefined, number | undefined]>([
    undefined,
    undefined,
  ]);
  const handleClick = (i: number, j: number) =>
    mode === "edit"
      ? () => {
          if (i !== -1 || j !== -1) setCell([i, j]);
        }
      : () => {};
  const handleBlur = (i: number, j: number) =>
    mode === "edit"
      ? (e: any) => {
          if (i !== -1 || j !== -1) {
            handleCell(i, j, e.target.value);
            setCell([-1, -1]);
          }
        }
      : () => {};

  const tableRef = useD3(
    (table) => {
      try {
        /**
         * @param {selection} div
         * @param {string} selector
         * @param {(i) => string} cls
         */
        const renderRows = (
          div: any,
          selector: string,
          cls: (i: number) => string
        ) =>
          div.each((d: any, i: number, node: any) => {
            //eslint-disable-next-line
            const [, r, c] = d;
            const selection = d3
              .select(node[i])
              .attr("class", cls(i))
              .datum(d[0]);
            if (cell[0] === r && cell[1] === c) {
              const target = selection.enter().merge(selection);
              target.selectAll("." + selector).remove();
              const input = target
                .append("input")
                .attr("class", selector + " " + classes.input)
                .property("value", (d) => d)
                .property("autofocus", "autofocus")
                .on("blur", handleBlur(r, c));
              if (input) input.node()?.focus();
            } else {
              const target = selection
                .enter()
                .merge(selection)
                .on("click", handleClick(r, c));
              target.selectAll("." + selector).remove();
              target
                .append("span")
                .text((d) => d)
                .attr("class", selector + " " + classes.full);
            }
          });

        if (headers.length) {
          const bindH = table
            .select(".thead")
            .select(".tr")
            .data(headers.map((d, j) => [d, -1, j]));
          bindH
            .enter()
            .append("div")
            .merge(bindH)
            .call(renderRows, "td_value", (i: number) => classes.tableCell);
        }

        const bindR = table
          .select(".tbody")
          .selectAll(".tr")
          .data(cells.map((r, i) => r.map((rc, j) => [rc, i, j])));
        bindR.exit().remove();

        const bindRC = bindR
          .enter()
          .append("div")
          .merge(bindR)
          .attr("class", "tr " + classes.tableRow)
          .selectAll("div")
          .data((row: any) => row);

        const dataCells = bindRC.enter().append("div").merge(bindRC);

        dataCells.call(
          renderRows,
          "td_value",
          (i: number) => classes.tableCell
        );
      } catch (e) {
        console.error(e);
      }
    },
    [...cells, ...cell]
  );

  return (
    <div
      ref={tableRef}
      className={"table " + classes.full + " " + classes.table}
    >
      <div className={"thead " + classes.space0}>
        <div className={"tr " + classes.tableHeader} />
      </div>
      <div className={"tbody " + classes.space0} />
    </div>
  );
};

const useD3 = (renderChartFn: (el: any) => void, deps: unknown[]) => {
  const ref: React.RefObject<any> = useRef(null);

  useEffect(() => {
    renderChartFn(d3.select(ref.current));
    return () => {};
    // eslint-disable-next-line
  }, [...deps]);

  return ref;
};

export default useD3;
