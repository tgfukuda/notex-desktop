import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type KeyBindings = {
  [key: string]: any;
};

const languages = ["japanese", "english"] as const;
export type Language = typeof languages[number];

export type SettingType = {
  targetDir: string;
  username: string;
  password: string;
  isPassEnabled: boolean;
  language: Language;
  keyBindings: KeyBindings;
};

const initialState: SettingType = {
  targetDir: "./notex",
  username: "",
  password: "",
  isPassEnabled: false,
  language: "english",
  keyBindings: {},
};

type KeyBindingsAction = {
  key: string;
  value: any;
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
      state.isPassEnabled = action.payload;
    },
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
    updateKeyBindings(state, action: PayloadAction<KeyBindingsAction>) {
      state.keyBindings[action.payload.key] = action.payload.value;
    },
    deleteKeyBindings(state, action) {
      state.keyBindings[action.payload.key] = undefined;
    },
    setSettings(state, action) {
      return action.payload;
    },
  },
});

export const NoTeXSettings = settingsSlice.actions;
export default settingsSlice.reducer;
