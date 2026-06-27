---
read_when:
    - 複数のファイルにわたる構造化されたファイル編集が必要です
    - パッチベースの編集を文書化またはデバッグしたい場合
summary: apply_patch ツールで複数ファイルにまたがるパッチを適用する
title: apply_patch ツール
x-i18n:
    generated_at: "2026-05-06T05:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

構造化されたパッチ形式を使用してファイル変更を適用します。これは、単一の `edit` 呼び出しでは壊れやすくなる複数ファイルまたは複数ハンクの編集に最適です。

このツールは、1 つ以上のファイル操作をラップする単一の `input` 文字列を受け取ります。

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

- `input`（必須）: `*** Begin Patch` と `*** End Patch` を含む完全なパッチ内容。

## 注意事項

- パッチパスは相対パス（ワークスペースディレクトリから）と絶対パスに対応しています。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true`（ワークスペース内に限定）です。意図的に `apply_patch` でワークスペースディレクトリ外へ書き込みまたは削除したい場合にのみ、`false` に設定してください。
- ファイル名を変更するには、`*** Update File:` ハンク内で `*** Move to:` を使用します。
- `*** End of File` は、必要な場合に EOF のみの挿入を示します。
- OpenAI および OpenAI Codex モデルではデフォルトで利用できます。無効にするには、
  `tools.exec.applyPatch.enabled: false` を設定します。
- 必要に応じて、モデル別に
  `tools.exec.applyPatch.allowModels` で制限できます。
- 設定は `tools.exec` の下にのみあります。

## 例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## 関連

<CardGroup cols={2}>
  <Card title="差分" href="/ja-JP/tools/diffs" icon="code-compare">
    変更内容の表示用の読み取り専用差分ビューアー。
  </Card>
  <Card title="Exec ツール" href="/ja-JP/tools/exec" icon="terminal">
    エージェントからのシェルコマンド実行。
  </Card>
  <Card title="コード実行" href="/ja-JP/tools/code-execution" icon="square-code">
    xAI によるサンドボックス化されたリモート Python 解析。
  </Card>
</CardGroup>
