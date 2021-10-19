import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "./store";

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

export const useNotexData = (id: string) => {
  return useAppSelector((state) => state.write.meta.data[id]);
};

export const useWrite = () => {
  return useAppSelector((state) => state.write);
};
