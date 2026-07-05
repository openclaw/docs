---
read_when:
    - 複数ファイルにわたる構造化されたファイル編集が必要です
    - パッチベースの編集をドキュメント化またはデバッグしたい
summary: apply_patch ツールで複数ファイルのパッチを適用する
title: apply_patch ツール
x-i18n:
    generated_at: "2026-07-05T11:48:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

構造化パッチ形式を使用してファイル変更を適用します。これは、単一の `edit` 呼び出しでは壊れやすい複数ファイルまたは複数ハンクの編集に最適です。

このツールは、1つ以上のファイル操作をラップする単一の `input` 文字列を受け取ります。

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@ optional change context
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## パラメーター

- `input` (必須): `*** Begin Patch` と `*** End Patch` を含む完全なパッチ内容。

## 注記

- パッチパスは、相対パス (ワークスペースディレクトリから) と絶対パスをサポートします。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true` (ワークスペース内に限定) です。`apply_patch` でワークスペースディレクトリ外に書き込み/削除したい場合にのみ、`false` に設定してください。
- ファイル名を変更するには、`*** Update File:` ハンク内で `*** Move to:` を使用します。
- `*** End of File` は、必要な場合に EOF のみの挿入を示します。
- すべてのモデルでデフォルトで有効です。無効にするには `tools.exec.applyPatch.enabled: false`
  を設定するか、`tools.exec.applyPatch.allowModels` で特定のモデルに制限します
  (未加工の ID、たとえば `gpt-5.4`、または完全な ID、たとえば `openai/gpt-5.4` を受け付けます)。
- 設定は `tools.exec.applyPatch.*` の下にあります。

## 例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## 関連

<CardGroup cols={2}>
  <Card title="Diffs" href="/ja-JP/tools/diffs" icon="code-compare">
    変更の提示に使う読み取り専用の差分ビューアー。
  </Card>
  <Card title="Exec tool" href="/ja-JP/tools/exec" icon="terminal">
    エージェントからのシェルコマンド実行。
  </Card>
  <Card title="Code execution" href="/ja-JP/tools/code-execution" icon="square-code">
    xAI を使用したサンドボックス化されたリモート Python 分析。
  </Card>
</CardGroup>
