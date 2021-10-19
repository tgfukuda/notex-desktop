import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const mdTypes = [
  "section",
  "paragraph",
  "table",
  "list",
  "graph",
  "image",
] as const;
type Type = typeof mdTypes[number];

const dataType = ["table", "graph", "image"] as const;
type DataType = typeof dataType[number];

interface Common {
  type: Type;
}

export type SectionType = {
  type: "section";
  header: string;
  depth: number;
} & Common;

export type JSXAttributeType = {
  [attr: string]: string | JSXAttributeType;
};

export type ParagraphType = {
  type: "paragraph";
  contents: string;
  indent: number;
  attr?: JSXAttributeType;
} & Common;

export type ListType = {
  type: "list";
  items: string[];
  header?: string;
} & Common;

type DataId = string;

export type GraphType = {
  type: "graph";
  uuid: DataId;
  name?: string;
} & Common;

export type ImageType = {
  type: "image";
  uuid: DataId;
  name?: string;
} & Common;

export type TableType = {
  type: "table";
  uuid: DataId;
  name?: string;
} & Common;

export type MDtoDOM =
  | SectionType
  | ParagraphType
  | TableType
  | ListType
  | GraphType
  | ImageType;

export type FunctionGraphData = {
  func: string;
  domain: {
    min: number;
    max: number;
    division: number;
  };
};

export type GraphData = {
  type_: "graph";
  data:
    | FunctionGraphData
    | {
        path: string;
      };
  name: string;
};

export type ImageData = {
  type_: "image";
  data:
    | {
        uri: string;
      }
    | {
        extention: "png" | "svg" | "jpg";
        path: string;
      };
  name: string;
};

export type TableInnerData = {
  row_num: number;
  column_num: number;
  headers: string[];
  cells: string[][];
};

export type TableData = {
  type_: "table";
  data: TableInnerData;
  name: string;
};

export type NotexData = GraphData | ImageData | TableData;

export type Meta = {
  filename: string;
  readonly created_at?: string;
  readonly updated_at?: string;
  overwrite: boolean;
  author: string;
  tag: string[];
  data: {
    [id: DataId]: NotexData | undefined; //its value must be NotexData. undefined is attached to get compile error
  };
};

export type Document = {
  meta: Meta;
  docs: (MDtoDOM | undefined)[]; //its value must be MDtoDoM. undefined is attached to get compile error
};

const initialState = {
  meta: {
    filename: "test",
    created_at: "",
    updated_at: "",
    overwrite: false,
    author: "",
    tag: [],
    data: {},
  },
  docs: [],
} as Document;

const writeSlice = createSlice({
  name: "write",
  initialState,
  reducers: {
    addSection(
      state,
      action: PayloadAction<{ id?: number; header?: string; depth?: number }>
    ) {
      const target = {
        type: "section",
        header: action.payload.header || "",
        depth: action.payload.depth || 0,
      } as SectionType;
      if (action.payload.id === undefined) state.docs.push(target);
      else
        state.docs = [
          ...state.docs.slice(0, action.payload.id + 1),
          target,
          ...state.docs.slice(action.payload.id + 1),
        ];
    },
    addParagraph(
      state,
      action: PayloadAction<{
        id?: number;
        contents?: string;
        indent?: number;
        attr?: JSXAttributeType | null;
      }>
    ) {
      const target = {
        type: "paragraph",
        contents: action.payload.contents || "",
        indent: action.payload.indent || 0,
        attr: action.payload.attr || undefined,
      } as ParagraphType;
      if (action.payload.id === undefined) state.docs.push(target);
      else
        state.docs = [
          ...state.docs.slice(0, action.payload.id + 1),
          target,
          ...state.docs.slice(action.payload.id + 1),
        ];
    },
    addList(
      state,
      action: PayloadAction<{ id?: number; items: string[]; header?: string }>
    ) {
      const target = {
        type: "list",
        items: action.payload.items,
        header: action.payload.header || "",
      } as ListType;
      if (action.payload.id === undefined) state.docs.push(target);
      else
        state.docs = [
          ...state.docs.slice(0, action.payload.id + 1),
          target,
          ...state.docs.slice(action.payload.id + 1),
        ];
    },
    addData(
      state,
      action: PayloadAction<{
        id?: number;
        uuid: string;
        type: DataType;
        name?: string;
      }>
    ) {
      let target;
      switch (action.payload.type) {
        case "graph":
          target = {
            type: action.payload.type,
            uuid: action.payload.uuid,
            name: action.payload.name || "",
          } as GraphType;
          break;
        case "image":
          target = {
            type: action.payload.type,
            uuid: action.payload.uuid,
            name: action.payload.name || "",
          } as ImageType;
          break;
        case "table":
          target = {
            type: action.payload.type,
            uuid: action.payload.uuid,
            name: action.payload.name || "",
          } as TableType;
          break;
      }
      if (action.payload.id === undefined) state.docs.push(target);
      else if (target)
        state.docs = [
          ...state.docs.slice(0, action.payload.id + 1),
          target,
          ...state.docs.slice(action.payload.id + 1),
        ];
    },
    emitNotexData(
      state,
      action: PayloadAction<{
        id: DataId;
        data: NotexData;
      }>
    ) {
      console.log(action.payload.id, action.payload.data);
      state.meta.data[action.payload.id] = action.payload.data;
    },
    updateNode(
      state,
      action: PayloadAction<{
        id: number;
        node: MDtoDOM;
      }>
    ) {
      if (state.docs[action.payload.id]?.type === action.payload.node.type)
        state.docs[action.payload.id] = action.payload.node;
    },
    deleteNode(state, action: PayloadAction<number>) {
      state.docs = [
        ...state.docs.slice(0, action.payload),
        ...state.docs.slice(action.payload + 1),
      ];
    },
    clear(state) {
      Object.assign(state, {
        ...initialState,
        meta: {
          ...state.meta,
        },
      });
    },
  },
});

export const Write = writeSlice.actions;
export default writeSlice.reducer;
