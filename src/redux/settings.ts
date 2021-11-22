import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * there may not need to save setting as state = request every time
 * then, only type required
 */

type Command = "save" | "insertImage" | "syncDoc"

type KeyBindings = {
  [command in Command]?: string;
};

export const languages = ["japanese", "english"] as const;
export type Language = typeof languages[number];

export type SettingType = {
  target_dir: string;
  username: string;
  password: string;
  is_pass_enabled: boolean;
  language: Language;
  autosave: number | null;
  key_bindings: KeyBindings;
};

const initialState: SettingType = {
  target_dir: "",
  username: "",
  password: "",
  is_pass_enabled: false,
  language: "english",
  autosave: null,
  key_bindings: {},
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    updateUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
    },
    updatePassword(state, action: PayloadAction<string>) {
      state.password = action.payload;
    },
    setPassEnabled(state, action: PayloadAction<boolean>) {
      state.is_pass_enabled = action.payload;
    },
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
    updateKeyBindings(
      state,
      action: PayloadAction<{
        key: Command;
        value: string;
      }>
    ) {
      state.key_bindings[action.payload.key] = action.payload.value;
    },
    deleteKeyBindings(
      state,
      action: PayloadAction<{
        key: Command;
      }>
    ) {
      state.key_bindings[action.payload.key] = "";
    },
    setSettings(state, action: PayloadAction<SettingType>) {
      return action.payload;
    },
  },
});

export const NoTeXSettings = settingsSlice.actions;
export default settingsSlice.reducer;
