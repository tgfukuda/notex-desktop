import createMsg from "../../lib/msg";

type WriteMainMsg = {
  save: string;
};

export default createMsg<WriteMainMsg>({
  japanese: {
    save: "保存",
  },
  english: {
    save: "save",
  },
});
