---
read_when:
    - ターミナルからライブの OpenClaw ドキュメントを検索したい場合
    - docs CLI がどのホスト型検索 API を呼び出すかを把握する必要があります
summary: '`openclaw docs` のCLIリファレンス（ライブドキュメントインデックスを検索）'
title: Docs
x-i18n:
    generated_at: "2026-07-05T11:08:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

ターミナルからライブOpenClaw docsインデックスを検索します。

## 使用方法

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

| 引数         | 説明                                                                                 |
| ------------ | ------------------------------------------------------------------------------------ |
| `[query...]` | 自由形式の検索クエリ。複数語のクエリはスペースで結合され、1つとして送信されます。 |

クエリなしの場合、`openclaw docs`は検索を実行する代わりに、docsエントリーポイントのURLとサンプル検索コマンドを出力します。

## 例

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## 仕組み

`openclaw docs`は`https://docs.openclaw.ai/api/search`を呼び出し、JSON結果をレンダリングします。検索リクエストは固定の30秒タイムアウトを使用します。

## 出力

リッチな（TTY）ターミナルでは、結果は見出しに続く箇条書きリストとしてレンダリングされます。ページタイトル、リンク付きdocs URL、次の行の短いスニペットです。結果が空の場合は「結果はありません。」と出力されます。

非リッチ出力（パイプ、`--no-color`、スクリプト）では、同じデータがMarkdownとしてレンダリングされます。

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## 終了コード

| コード | 意味                                                                       |
| ------ | -------------------------------------------------------------------------- |
| `0`    | 検索に成功しました。結果が0件のレスポンスも含みます。                      |
| `1`    | ホストされたdocs検索API呼び出しに失敗しました。stderrにエラーメッセージが出力されます。 |

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [ライブdocs](https://docs.openclaw.ai)
