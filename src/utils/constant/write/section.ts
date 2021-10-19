import createMsg from "../../lib/msg";

type SectionMsg = {
  subject: string;
  title: string;
};

export default createMsg<SectionMsg>({
  japanese: {
    subject: "主題",
    title: "タイトル",
  },
  english: {
    subject: "subject",
    title: "title",
  },
});
