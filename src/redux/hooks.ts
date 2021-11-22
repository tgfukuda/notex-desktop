import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "./store";
import { DOM } from "./write";

/**
 * dispatcher
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * selector
 */
export const useSettings = () => {
  return useAppSelector((state) => state.settings);
};

export const useWrite = () => {
  return useAppSelector((state) => state.write);
};

export const useDOM = (idx: number) => {
  return useAppSelector((state) => state.write.doms[idx] as DOM);
};
