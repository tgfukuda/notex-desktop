import { Language } from "../../redux/settings";

export default function createMsg<
  T extends { [key: string]: string }
>(mapping: { [lang in Language]: T }) {
  return (lang: Language) => {
    switch (lang) {
      case "japanese":
        return mapping.japanese;
      case "english":
        return mapping.english;
    }
  };
}
