---
read_when:
    - 魂を公開する
    - soul publish の失敗のデバッグ
summary: Soul バンドルの形式、必須ファイル、制限。
x-i18n:
    generated_at: "2026-05-11T20:25:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# soul 形式

## ディスク上

soul は単一のファイルです。

- `SOUL.md`（または `soul.md`）

現時点では、onlycrabs.ai は追加ファイルを拒否します。

## `SOUL.md`

- 任意の YAML frontmatter を含む Markdown。
- サーバーは公開時に frontmatter からメタデータを抽出します。
- `description` は UI/検索で soul の概要として使用されます。

## 制限

- バンドルの合計サイズ: 50MB。
- 埋め込みテキストには `SOUL.md` のみが含まれます。

## スラッグ

- デフォルトではフォルダー名から派生します。
- 小文字かつ URL セーフである必要があります: `^[a-z0-9][a-z0-9-]*$`。

## バージョン管理 + タグ

- 各公開で新しいバージョン（semver）が作成されます。
- タグはバージョンへの文字列ポインターです。`latest` が一般的に使用されます。
