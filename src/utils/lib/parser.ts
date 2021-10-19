import { trampoline, Internal } from "./trampoline";
import { JSXAttributeType } from "../../redux/write";

type MathParseResult = {
  type: "katex";
  value: string;
  display: boolean;
};
type LinkParseResult = {
  type: "link";
  surface: string;
  value: string;
};
type TableParseResult = {
  type: "table";
  headers: string[];
  cells: string[][];
  option: string[];
};
type ImageTypeResult = {
  type: "image";
  alt: string;
  value: string;
};
type AttrTypeResult = {
  type: "attr";
  value: JSXAttributeType;
};
type ParseResult =
  | MathParseResult
  | LinkParseResult
  | TableParseResult
  | AttrTypeResult
  | ImageTypeResult
  | {
      type: "normal";
      value: string;
    }
  | {
      type: "break";
    };
type ParseNext = {
  isSuccess: boolean;
  result?: ParseResult;
  newPosition?: number;
};
type ParseFunction = (
  str: string,
  pos: number,
  ...optional: unknown[]
) => ParseNext;

/**
 * parse string with
 * `$ ... $`
 * `$$ ... $$`
 * fragment
 */
function mathParser(str: string, pos: number): ParseNext {
  function _internal(
    tar: string,
    acc: string,
    next: number,
    identifier: string,
    display: boolean
  ): Internal<ParseNext> {
    if (tar.length <= next)
      return {
        isSuccess: false,
      };
    else if (tar[next] === "$") {
      if (tar.slice(next, next + identifier.length) === identifier)
        return {
          isSuccess: true,
          result: {
            type: "katex",
            display: display,
            value: acc,
          },
          newPosition:
            identifier === "$$" && tar[next + identifier.length] === "\n"
              ? next + identifier.length + 1
              : next + identifier.length,
        };
      else
        return () =>
          _internal(tar, acc + tar[next], next + 1, identifier, display);
    } else {
      if (tar[next] === "\n")
        return () => _internal(tar, acc, next + 1, identifier, display);
      else
        return () =>
          _internal(tar, acc + tar[next], next + 1, identifier, display);
    }
  }

  if (str.slice(pos).startsWith("$$"))
    return trampoline(_internal)(str, "", pos + 2, "$$", true);
  else if (str.slice(pos).startsWith("$"))
    return trampoline(_internal)(str, "", pos + 1, "$", false);
  else
    return {
      isSuccess: false,
    };
}

/**
 * parse string with
 * `|th|th|th|`
 * `|:---|:-----:|-----:|`
 * `|td|td|td|`
 * fragment
 */
function tableParser(str: string, pos: number): ParseNext {
  function _internal(
    tar: string,
    acc: string,
    next: number,
    headers: string[],
    cells: string[][],
    option: string[]
  ): Internal<ParseNext> {
    console.log(cells);
    if (tar.length <= next)
      return {
        isSuccess: false,
      };
    else if (tar[next] === "|")
      return () =>
        _internal(
          tar,
          "",
          next + 1,
          headers,
          [
            ...cells.slice(0, cells.length - 1),
            [...cells[cells.length - 1], acc],
          ],
          option
        );
    else if (
      tar[next] === "\n" &&
      cells.length === 2 &&
      cells[1].every((value) => /:?-+:?/.test(value))
    ) {
      if (tar[next + 1] === "|")
        return () => _internal(tar, "", next + 2, cells[0], [[]], cells[1]);
      else
        return {
          isSuccess: false,
        };
    } else if (tar[next] === "\n") {
      if (tar[next + 1] === "|")
        return () =>
          _internal(tar, "", next + 2, headers, [...cells, []], option);
      else {
        if (cells[0].length === 0)
          return {
            isSuccess: false,
          };
        else
          return {
            isSuccess: true,
            result: {
              type: "table",
              headers,
              cells,
              option,
            },
            newPosition: next + 1,
          };
      }
    } else
      return () =>
        _internal(tar, acc + tar[next], next + 1, headers, cells, option);
  }

  if (str.slice(pos).startsWith("|"))
    return trampoline(_internal)(str, "", pos + 1, [], [[]]);
  else
    return {
      isSuccess: false,
    };
}

/**
 * parse string with
 * `[...](,,,)`
 * fragments.
 * [] brackets express surface string
 * () brackets express refered link
 */
function linkParser(str: string, pos: number): ParseNext {
  function _internal(
    tar: string,
    surface: string,
    link: string,
    next: number,
    mode: "surface" | "link" | ""
  ): Internal<ParseNext> {
    if (tar.length <= next)
      return {
        isSuccess: false,
      };
    else if (mode === "surface") {
      if (tar[next] === "]")
        return () => _internal(tar, surface, link, next + 1, "");

      return () => _internal(tar, surface + tar[next], link, next + 1, mode);
    } else if (mode === "link") {
      if (tar[next] === ")")
        return {
          isSuccess: true,
          result: {
            type: "link",
            surface: surface,
            value: link,
          },
          newPosition: next + 1,
        };

      return () => _internal(tar, surface, link + tar[next], next + 1, mode);
    } else {
      if (tar[next] === "(")
        return () => _internal(tar, surface, link, next + 1, "link");

      return () => _internal(tar, surface, link, next + 1, mode);
    }
  }

  if (str.slice(pos).startsWith("["))
    return trampoline(_internal)(str, "", "", pos + 1, "surface");
  else
    return {
      isSuccess: false,
    };
}

/**
 * parse string with
 * `![...](,,,)`
 * fragments.
 * [] brackets express alt string
 * () brackets express refered link
 */
function imageParser(str: string, pos: number): ParseNext {
  function _internal(
    tar: string,
    alt: string,
    link: string,
    next: number,
    mode: "alt" | "link" | ""
  ): Internal<ParseNext> {
    if (tar.length <= next)
      return {
        isSuccess: false,
      };
    else if (mode === "alt") {
      if (tar[next] === "]")
        return () => _internal(tar, alt, link, next + 1, "");

      return () => _internal(tar, alt + tar[next], link, next + 1, mode);
    } else if (mode === "link") {
      if (tar[next] === ")")
        return {
          isSuccess: true,
          result: {
            type: "image",
            alt: alt,
            value: link,
          },
          newPosition: next + 1,
        };

      return () => _internal(tar, alt, link + tar[next], next + 1, mode);
    } else {
      if (tar[next] === "(")
        return () => _internal(tar, alt, link, next + 1, "link");

      return () => _internal(tar, alt, link, next + 1, mode);
    }
  }

  if (str.slice(pos).startsWith("!["))
    return trampoline(_internal)(str, "", "", pos + 2, "alt");
  else
    return {
      isSuccess: false,
    };
}

/**
 * parse string with
 * `\attr{ ... }`
 * fragments
 * `{...}` should be valid json
 */
function attrParser(str: string, pos: number): ParseNext {
  function _internal(
    tar: string,
    acc: string,
    next: number,
    depth: number
  ): Internal<ParseNext> {
    if (tar.length <= next)
      return {
        isSuccess: false,
      };
    else if (tar[next] === "\n" || tar[next] === " ")
      return () => _internal(tar, acc, next + 1, depth);
    else if (tar[next] === "{")
      return () => _internal(tar, acc + tar[next], next + 1, depth + 1);
    else if (tar[next] === "}") {
      if (0 < depth - 1)
        return () => _internal(tar, acc + tar[next], next + 1, depth - 1);
      else {
        try {
          return {
            isSuccess: true,
            result: {
              type: "attr",
              value: JSON.parse(acc + tar[next]),
            },
            newPosition: tar[next + 1] === "\n" ? next + 2 : next + 1,
          };
        } catch (e) {
          console.error(e);
          return { isSuccess: false };
        }
      }
    } else return () => _internal(tar, acc + tar[next], next + 1, depth);
  }

  if (str.slice(pos).startsWith("\\attr"))
    return trampoline(_internal)(str, "", pos + 5, "{");
  else
    return {
      isSuccess: false,
    };
}

export class Parser {
  parsers: ParseFunction[];

  /**
   * @param parsers former parser is prior to latter
   */
  constructor(...parsers: ParseFunction[]) {
    this.parsers = [...parsers];
  }

  combined(str: string, pos: number): ParseNext {
    for (const ps of this.parsers) {
      const { isSuccess, result, newPosition } = ps(str, pos);
      if (isSuccess) return { isSuccess, result, newPosition };
    }

    return {
      isSuccess: false,
    };
  }

  /**
   * this function can throw the error `no matching parser`
   * when given string can't be parsed.
   */
  parse(str: string): ParseResult[] {
    let curr = 0;
    let acc = "";
    const results: ParseResult[] = [];
    while (curr < str.length) {
      const chr = str[curr];
      if (chr === "\n") {
        if (acc.length)
          results.push({
            type: "normal",
            value: acc,
          } as ParseResult);
        acc = "";
        results.push({
          type: "break",
        } as ParseResult);
        curr++;
      } else if (
        chr === "\\" ||
        chr === "$" ||
        chr === "[" ||
        chr === "!" ||
        chr === "|"
      ) {
        if (acc.length)
          results.push({
            type: "normal",
            value: acc,
          } as ParseResult);
        acc = "";
        const { isSuccess, result, newPosition } = this.combined(str, curr);
        if (!isSuccess) {
          acc += chr;
          curr++;
        } else {
          results.push(result as ParseResult);
          curr = newPosition as number;
        }
      } else {
        if (chr === " ") acc += "\u00A0";
        else acc += chr;
        curr++;
      }
    }
    if (acc.length)
      results.push({
        type: "normal",
        value: acc,
      } as ParseResult);

    return results;
  }
}

export const parsers: {
  [name: string]: ParseFunction;
} = {
  mathParser,
  linkParser,
  tableParser,
  imageParser,
  attrParser,
};
