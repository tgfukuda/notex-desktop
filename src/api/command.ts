import { invoke } from "@tauri-apps/api";
import { useAppDispatch } from "../redux/hooks";
import { NoTeXSettings, SettingType } from "../redux/settings";
import { Document } from "../redux/write";

export type Response = {
  message: string;
};

export type Error = {
  message: string;
};

const useCommand = () => {
  const dispatch = useAppDispatch();

  const getSetting = async (callBack?: (arg: SettingType) => void) => {
    await invoke("get_setting")
      ?.then((setting) => {
        console.log(setting);
        if (callBack) callBack(setting as SettingType);
        else dispatch(NoTeXSettings.setSettings(setting as SettingType));
      })
      ?.catch((err) => {});
  };

  const saveDocument = async (
    document: Document,
    raw: string,
    callBack?: (arg: Response) => void,
    handleErr?: (arg: Error) => void
  ) => {
    await invoke("save_document", {
      document: {
        meta: document.meta,
        body: raw,
      },
    })
      ?.then((res) => {
        console.log(res);
        if (callBack) callBack(res as Response);
      })
      ?.catch((err) => {
        console.log(err);
        if (handleErr) handleErr(err as Error);
      });
  };

  const getDocument = async (
    callBack?: (arg: Document) => void,
    handleErr?: (arg: Error) => void
  ) => {
    await invoke("get_document")
      ?.then((res) => {
        console.log(res);
        if (callBack) callBack(res as Document);
      })
      ?.catch((err) => {
        console.log(err);
        if (handleErr) handleErr(err as Error);
      });
  };

  return {
    getSetting: getSetting,
    saveDocument: saveDocument,
    getDocument: getDocument,
  };
};

export default useCommand;
