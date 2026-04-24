---
read_when:
    - 複数ファイルにまたがる構造化されたファイル編集が必要な場合
    - パッチベースの編集をドキュメント化またはデバッグしたい場合
summary: apply_patchツールで複数ファイルのパッチを適用する
title: apply_patchツール
x-i18n:
    generated_at: "2026-04-24T05:22:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

構造化されたパッチ形式を使ってファイル変更を適用します。これは、単一の`edit`呼び出しでは壊れやすい、複数ファイルまたは複数hunkの編集に最適です。

このツールは、1つ以上のファイル操作を包んだ単一の`input`文字列を受け付けます。

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## パラメーター

- `input`（必須）: `*** Begin Patch`と`*** End Patch`を含む完全なパッチ内容。

## 注意

- パッチパスは、相対パス（ワークスペースディレクトリ基準）と絶対パスをサポートします。
- `tools.exec.applyPatch.workspaceOnly`のデフォルトは`true`です（ワークスペース内限定）。`apply_patch`でワークスペースディレクトリ外へ書き込み/削除したい意図がある場合にのみ、これを`false`へ設定してください。
- ファイル名変更には、`*** Update File:` hunk内で`*** Move to:`を使用します。
- 必要に応じて、EOFのみの挿入には`*** End of File`を使います。
- デフォルトでOpenAIおよびOpenAI Codexモデルで利用可能です。
  無効化するには`tools.exec.applyPatch.enabled: false`を設定してください。
- モデルごとの制御も可能です:
  `tools.exec.applyPatch.allowModels`。
- 設定は`tools.exec`配下にのみあります。

## 例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## 関連

- [Diffs](/ja-JP/tools/diffs)
- [Exec tool](/ja-JP/tools/exec)
- [Code execution](/ja-JP/tools/code-execution)
