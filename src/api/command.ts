import { invoke } from "@tauri-apps/api";
import { SettingType } from "../redux/settings";
import { Meta } from "../redux/write";

export type Response = {
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
  return {
    getSetting: async () => {
      try {
        return (await invoke("get_setting")) as SettingType;
      } catch (err) {
        throw err as Error;
      }
    },
    updateSetting: async (setting: SettingType) => {
      try {
        return (await invoke("update_setting", {
          setting,
        })) as Response;
      } catch (err) {
        throw err as Error;
      }
    },
    saveDocument: async (meta: Meta, body: string, overwrite: boolean) => {
      try {
        return (await invoke("save_document", {
          document: {
            overwrite,
            meta,
            body,
          },
        })) as Response;
      } catch (err) {
        throw err as Error;
      }
    },
    deleteFile: async (target: Meta) => {
      try {
        return (await invoke("delete_file", {
          target: target,
        })) as Response;
      } catch (err) {
        throw err as Error;
      }
    },
    getDocumentsByFilter: async ({
      offset,
      limit = 15,
      filename_start = "",
      filename_contain = "",
      created_at = ["", ""],
      updated_at = ["", ""],
      tags = [],
      author = "",
    }: RequestDocs) => {
      try {
        return (await invoke("get_documents_by_filter", {
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
      } catch (err) {
        throw err as Error;
      }
    },
    getDocument: async (meta: Meta) => {
      try {
        return (await invoke("get_document", {
          meta,
        })) as string;
      } catch (err) {
        throw err as Error;
      }
    },
  };
};

export default useCommand;
