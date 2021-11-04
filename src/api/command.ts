import { invoke } from "@tauri-apps/api";
import { useAppDispatch } from "../redux/hooks";
import { NoTeXSettings, SettingType } from "../redux/settings";
import { Meta } from "../redux/write";

type Response = {
  code: number;
  message: string;
};

type Error = {
  code: number;
  message: string;
};

export type RequestDocs = {
  offset: number;
  limit?: number;
  filename_start?: string;
  filename_contain?: string;
  created_at?: [string, string];
  updated_at?: [string, string];
  tags?: string[];
  author?: string;
};
export type ResponseDocs = {
  list: Meta[];
  page: number;
  all_tags: string[];
};

const useCommand = () => {
  const dispatch = useAppDispatch();

  return {
    getSetting: async (callBack?: (arg: SettingType) => void) => {
      try {
        const setting = (await invoke("get_setting")) as SettingType;

        console.log(setting);
        if (callBack) callBack(setting);
        else dispatch(NoTeXSettings.setSettings(setting));
      } catch (err) {
        console.error(err);
      }
    },
    updateSetting: async (
      setting: SettingType,
      callBack?: (arg: Response) => void,
      handleErr?: (arg: Error) => void
    ) => {
      try {
        const res = (await invoke("update_setting", {
          setting,
        })) as Response;

        console.log(res);
        if (callBack) callBack(res);
      } catch (err) {
        console.error(err);
        if (handleErr) handleErr(err as Error);
      }
    },
    saveDocument: async (
      meta: Meta,
      body: string,
      overwrite: boolean,
      callBack?: (arg: Response) => void,
      handleErr?: (arg: Error) => void
    ) => {
      try {
        const res = (await invoke("save_document", {
          document: {
            overwrite,
            meta,
            body,
          },
        })) as Response;

        console.log(res);
        if (callBack) callBack(res);
      } catch (err) {
        console.error(err);
        if (handleErr) handleErr(err as Error);
      }
    },
    deleteFile: async (
      target: Meta,
      callBack?: (arg: Response) => void,
      handleErr?: (arg: Error) => void
    ) => {
      try {
        const res = (await invoke("delete_file", {
          target: target,
        })) as Response;

        console.log(res);
        if (callBack) callBack(res);
      } catch (err) {
        console.error(err);
        if (handleErr) handleErr(err as Error);
      }
    },
    getDocumentsByFilter: async (
      {
        offset,
        limit = 15,
        filename_start = "",
        filename_contain = "",
        created_at = ["", ""],
        updated_at = ["", ""],
        tags = [],
        author = "",
      }: RequestDocs,
      callBack?: (res: ResponseDocs) => void,
      handleErr?: (err: Error) => void
    ) => {
      try {
        const res = (await invoke("get_documents_by_filter", {
          req: {
            offset,
            limit,
            filename_start,
            filename_contain,
            created_at,
            updated_at,
            tags,
            author,
          },
        })) as ResponseDocs;

        console.log(res);
        if (callBack) callBack(res);
      } catch (err) {
        console.error(err);
        if (handleErr) handleErr(err as Error);
      }
    },
    getDocument: async (
      meta: Meta,
      callBack?: (arg: string) => void,
      handleErr?: (arg: Error) => void
    ) => {
      try {
        const res = (await invoke("get_document", {
          meta,
        })) as string;

        console.log(res);
        if (callBack) callBack(res);
      } catch (err) {
        console.error(err);
        if (handleErr) handleErr(err as Error);
      }
    },
  };
};

export default useCommand;
