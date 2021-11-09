import { createSlice } from "@reduxjs/toolkit";

export type Meta = {
  filename: string;
  readonly created_at?: string;
  readonly updated_at?: string;
  author: string;
  tags: string[];
  shortcut: {[command: string]: string}
};

/**
 * DELETE --
 * unused cuz markdown computation is applied to react-markdown (ast, madast, remark, rehype plugin)
 */
const initialState = {
  filename: "test",
  created_at: "",
  updated_at: "",
  overwrite: false,
  author: "",
  tags: [],
  shortcut: {},
} as Meta;

const writeSlice = createSlice({
  name: "write",
  initialState,
  reducers: {
    
  },
});

export const Write = writeSlice.actions;
export default writeSlice.reducer;
