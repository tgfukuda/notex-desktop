import { configureStore } from "@reduxjs/toolkit";
import settingsReducer from "./settings";
import writeReducer from "./write";

/**
 * is redux needed for desktop?
 * to get some data can also be done by tauri command.
 * it's useful but consideration is necessary.
 */
export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    write: writeReducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
