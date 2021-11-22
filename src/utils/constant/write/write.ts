import createMsg from "../../lib/msg";

type WriteMainMsg = {
  save: string;
  sync: string;
};

export default createMsg<WriteMainMsg>({
  japanese: {
    save: "保存",
    sync: "同期",
  },
  english: {
    save: "save",
    sync: "sync",
  },
});
