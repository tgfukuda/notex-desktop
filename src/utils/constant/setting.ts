import createMsg from "../lib/msg";

type SettingMsg = {
  targetDir: string;
};

export default createMsg<SettingMsg>({
  japanese: {
    targetDir: "保存先フォルダ",
  },
  english: {
    targetDir: "target directory",
  },
});
