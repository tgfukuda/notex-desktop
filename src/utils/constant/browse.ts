import createMsg from "../lib/msg";
import {Meta} from "../../redux/write"

type BrowseMsg = {
  searchByTag: string;
  tagName: string;
  confirmDelete: string
} & { [key in keyof Omit<Meta, "shortcut">]: string }

export default createMsg<BrowseMsg>({
  japanese: {
    filename: "ファイル名",
    tags: "タグ",
    created_at: "作成日時",
    updated_at: "更新日時",
    author: "著者",
    html_src: "HTMLソース",
    searchByTag: "タグで検索",
    tagName: "タグ名",
    confirmDelete: "次のドキュメントを削除してよろしいですか？"
  },
  english: {
    filename: "File name",
    tags: "Tags",
    created_at: "Created at",
    updated_at: "Updated at",
    author: "Author",
    html_src: "HTML source",
    searchByTag: "Search by Tag",
    tagName: "Tag name",
    confirmDelete: "Please confirm to delete "
  }
})