import { configureStore } from "@reduxjs/toolkit";
import settingsReducer from "./settings";
import writeReducer from "./write";

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    write: writeReducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
