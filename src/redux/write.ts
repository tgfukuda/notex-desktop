import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * this represents block as section, table, d3, mermaid, code and inline as others
 */
export type MdType = "block" | "inline";

export type DOM = {
  mdType: MdType;
  value: string; //the value is idx'th markdown content
};

export type Document = {
  doms: DOM[];
  max: number; //current max dom idx + 1 (if null, 0)
};

export type Meta = {
  filename: string;
  readonly created_at?: string;
  readonly updated_at?: string;
  author: string;
  tags: string[];
  shortcut: { [command: string]: string };
  html_src: boolean;
};

const initialState: Document = {
  doms: [
    {
      mdType: "inline",
      value: "",
    },
  ],
  max: 0,
};

const writeSlice = createSlice({
  name: "write",
  initialState,
  reducers: {
    insertDOM(state, action: PayloadAction<{ inserts: DOM[]; idx?: number }>) {
      if (action.payload.idx === undefined) {
        state.doms = [...state.doms, ...action.payload.inserts];
      } else {
        state.doms = [
          ...state.doms.slice(0, action.payload.idx),
          ...action.payload.inserts,
          ...state.doms.slice(action.payload.idx),
        ];
      }
      state.max++;
    },
    updateDOM(
      state,
      action: PayloadAction<{
        idx: number;
        line: number;
        pos: number;
        char?: string;
        isDelete?: boolean;
        delete_min?: number;
        delete_max?: number;
      }>
    ) {
      let { idx, line, pos, char, isDelete, delete_min, delete_max } =
        action.payload;
      line--;
      pos--;
      if (delete_min) delete_min--;
      if (delete_max) delete_max--;
      if (isDelete) {
        let target = state.doms[idx].value.split("\n");
        const min = delete_min || pos;
        const max = delete_max || pos;
        if (target[line].length) {
          target[line] =
            target[line].slice(0, min) + target[line].slice(max + 1);
        } else {
          target = [...target.slice(0, line), ...target.slice(line + 1)];
        }
        state.doms[idx].value = target.join("\n");
      } else {
        let target = state.doms[idx].value.split("\n");
        target[line] =
          target[line].slice(0, pos) + char + target[line].slice(pos);
        state.doms[idx].value = target.join("\n");
      }
    },
    deleteDOM(state, action: PayloadAction<number>) {
      state.doms = [
        ...state.doms.slice(0, action.payload),
        ...state.doms.slice(action.payload + 1),
      ];
    },
    setDom(state, action: PayloadAction<DOM[]>) {
      state.doms = action.payload;
    },
    reset() {
      return initialState;
    },
  },
});

export const Write = writeSlice.actions;
export default writeSlice.reducer;
