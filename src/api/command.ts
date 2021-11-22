import { invoke } from "@tauri-apps/api";
import { SettingType } from "../redux/settings";
import { Meta } from "../redux/write";

export type Response = {
  code: number;
  message: string;
};

interface ErrorResponse extends Error {
  code: number;
  message: string;
}

class ErrorResponse extends Error {
  code: number;
  message: string;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    this.message = message;
  }
}

export type RequestDocs = {
  offset: number;
  limit: number; //if 0, return all satisfied docs meta. so, ignore offset in the case.
  filename_start?: string; //if empty, ignored
  filename_contain?: string; //if empty, ignored
  created_at?: [string, string]; //left is min, right is max. if invalid format, the one is ignored
  updated_at?: [string, string]; //left is min, right is max. if invalid format, the one is ignored
  tags?: string[]; //if length is 0, ignored
  author?: string; //if empty, ignored
  is_html_src_exists?: boolean | null; //if null,  ignored
};
export type ResponseDocs = {
  list: Meta[]; //returned list length will be limit size if limit does not equal to 0
  page: number; //a total number of documents
  all_tags: string[];
};

/**
 * get running environment and change api.
 * this is future scope for use of this app in a browser.
 * if finished to setup server and db, possibly replace the all related feature like,
 * - git repository
 * - this hooks returning api
 * - header, footer
 * - tauri's dist path
 * - etcetra
 */
const useCommand = () => {
  return {
    getSetting: async () => {
      try {
        return (await invoke("get_setting")) as SettingType;
      } catch (err) {
        throw new ErrorResponse(
          (err as ErrorResponse).message,
          (err as ErrorResponse).code
        );
      }
    },
    updateSetting: async (setting: SettingType) => {
      try {
        return (await invoke("update_setting", {
          setting,
        })) as Response;
      } catch (err) {
        throw new ErrorResponse(
          (err as ErrorResponse).message,
          (err as ErrorResponse).code
        );
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
        throw new ErrorResponse(
          (err as ErrorResponse).message,
          (err as ErrorResponse).code
        );
      }
    },
    deleteFile: async (target: Meta) => {
      try {
        return (await invoke("delete_file", {
          target: target,
        })) as Response;
      } catch (err) {
        throw new ErrorResponse(
          (err as ErrorResponse).message,
          (err as ErrorResponse).code
        );
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
      is_html_src_exists = null,
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
            is_html_src_exists,
          },
        })) as ResponseDocs;
      } catch (err) {
        throw new ErrorResponse(
          (err as ErrorResponse).message,
          (err as ErrorResponse).code
        );
      }
    },
    getDocument: async (meta: Meta) => {
      try {
        return (await invoke("get_document", {
          meta,
        })) as string;
      } catch (err) {
        throw new ErrorResponse(
          (err as ErrorResponse).message,
          (err as ErrorResponse).code
        );
      }
    },
    print: async (meta: Meta, body: string) => {
      return (await invoke("print", {
        meta,
        body,
      })) as undefined;
    },
    html: async (meta: Meta, htmlsrc: string, path: string) => {
      return (await invoke("html", {
        meta,
        htmlsrc,
        path,
      })) as undefined;
    },
  };
};

export default useCommand;
