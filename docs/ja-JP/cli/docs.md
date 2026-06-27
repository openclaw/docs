---
read_when:
    - ターミナルからライブ版の OpenClaw ドキュメントを検索したい
    - docs CLI がどのホスト型検索 API を呼び出すかを知っておく必要があります
summary: '`openclaw docs` の CLI リファレンス（ライブドキュメント索引を検索）'
title: ドキュメント
x-i18n:
    generated_at: "2026-06-27T10:54:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

ターミナルからライブの OpenClaw ドキュメントインデックスを検索します。このコマンドは、OpenClaw の Cloudflare ホスト型ドキュメント検索 API を呼び出し、結果をターミナルに表示します。

## 使用方法

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

引数:

| 引数         | 説明                                                                                 |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | 自由形式の検索クエリ。複数語のクエリはスペースで結合され、1 つとして送信されます。 |

## 例

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

クエリがない場合、`openclaw docs` は検索を実行せず、ドキュメントのエントリポイント URL とサンプル検索コマンドを出力します。

## 仕組み

`openclaw docs` は `https://docs.openclaw.ai/api/search` を呼び出し、JSON 結果を表示します。検索呼び出しでは固定の 30 秒タイムアウトを使用します。

## 出力

リッチな (TTY) ターミナルでは、結果は見出しに続く箇条書きリストとして表示されます。各項目にはページタイトル、リンクされたドキュメント URL、次の行に短いスニペットが表示されます。結果が空の場合は「結果がありません。」と出力されます。

非リッチ出力 (パイプ、`--no-color`、スクリプト) では、同じデータが Markdown として表示されます。

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## 終了コード

| コード | 意味                                                              |
| ---- | ----------------------------------------------------------------- |
| `0`  | 検索が成功しました (結果 0 件の応答を含む)。                      |
| `1`  | ホスト型ドキュメント検索 API 呼び出しに失敗しました。stderr はインラインで出力されます。 |

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ライブドキュメント](https://docs.openclaw.ai)
