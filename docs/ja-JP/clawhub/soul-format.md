---
read_when:
    - 魂の公開
    - soul publish の失敗をデバッグする
summary: ソウルバンドルの形式、必須ファイル、制限。
x-i18n:
    generated_at: "2026-05-13T04:18:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# ソウル形式

## ディスク上

ソウルは単一のファイルです:

- `SOUL.md`（または `soul.md`）

現時点では、onlycrabs.ai は追加ファイルをすべて拒否します。

## `SOUL.md`

- 任意の YAML フロントマターを含む Markdown。
- サーバーは公開時にフロントマターからメタデータを抽出します。
- `description` は UI/検索でソウルの概要として使用されます。

## 制限

- バンドルの合計サイズ: 50MB。
- 埋め込みテキストには `SOUL.md` のみが含まれます。

## スラッグ

- デフォルトではフォルダー名から派生します。
- 小文字で URL セーフである必要があります: `^[a-z0-9][a-z0-9-]*$`。

## バージョン管理 + タグ

- 各公開により新しいバージョン（セマンティックバージョニング）が作成されます。
- タグはバージョンへの文字列ポインターです。`latest` がよく使われます。
