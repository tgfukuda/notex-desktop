import createMsg from "../lib/msg";

//Document - DnD type constant
export const dndType = {
  section: "SAMEROOTOF",
  never: "NEVER",
};

//Server
export const serverUrl = "http://localhost:5050";

export const version = "v0.0.1";

type UtilMsg = {
  save: string;
  userName: string;
  passWord: string;
  isPassEnabled: string;
  language: string;
  keyBindings: string;
  controller: string;
  setting: string;
  author: string;
  delete: string;
  view: string;
  edit: string;
  enabled: string;
  disabled: string;
  error: string;
  processing: string;
  cancel: string;
  browse: string;
  write: string;
  version: string;
  default: string;
};

export default createMsg<UtilMsg>({
  japanese: {
    save: "保存",
    userName: "ユーザーネーム",
    passWord: "パスワード",
    isPassEnabled: "パスワード確認",
    language: "言語",
    keyBindings: "ショートカット",
    controller: "コントローラー",
    setting: "設定",
    author: "著者",
    delete: "削除",
    view: "ビュー",
    edit: "エディット",
    enabled: "有効",
    disabled: "無効",
    error: "エラー",
    processing: "処理中",
    cancel: "キャンセル",
    browse: "ブラウズ",
    write: "作成",
    version: "バージョン",
    default: "デフォルト",
  },
  english: {
    save: "save",
    userName: "User Name",
    passWord: "Password",
    isPassEnabled: "Pass Confirmation",
    language: "language",
    keyBindings: "Key Bindings",
    controller: "Controller",
    setting: "Settings",
    author: "Author",
    delete: "delete",
    view: "View",
    edit: "Edit",
    enabled: "enabled",
    disabled: "disabled",
    error: "error",
    processing: "Processing",
    cancel: "cancel",
    browse: "browse",
    write: "write",
    version: "version",
    default: "default",
  },
});
