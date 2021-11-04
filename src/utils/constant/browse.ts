import createMsg from "../lib/msg";

type BrowseMsg = {
  filename: string,
  tags: string,
  created_at: string,
  updated_at: string,
  author: string,
  searchByTag: string,
  tagName: string,
  confirmDelete: string
}

export default createMsg<BrowseMsg>({
  japanese: {
    filename: "ファイル名",
    tags: "タグ",
    created_at: "作成日時",
    updated_at: "更新日時",
    author: "著者",
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
    searchByTag: "Search by Tag",
    tagName: "Tag name",
    confirmDelete: "Please confirm to delete "
  }
})