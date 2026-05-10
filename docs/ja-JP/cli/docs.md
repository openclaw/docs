---
read_when:
    - ターミナルから公開中の OpenClaw ドキュメントを検索したい
    - docs CLI が外部コマンドとして呼び出すヘルパーバイナリを把握する必要があります
summary: '`openclaw docs` の CLI リファレンス（ライブドキュメントインデックスを検索）'
title: ドキュメント
x-i18n:
    generated_at: "2026-05-10T19:27:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0f733083bf455695ed24b13db6fe53e95aa3804fa8696a2fd29e749f24324c8
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

ターミナルからライブの OpenClaw ドキュメントインデックスを検索します。このコマンドは、`https://docs.openclaw.ai/mcp.SearchOpenClaw` にある公開の Mintlify ホストの docs MCP 検索エンドポイントをシェル経由で呼び出し、結果をターミナルに表示します。

## 使い方

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

引数:

| 引数         | 説明                                                                                 |
| ------------ | ------------------------------------------------------------------------------------ |
| `[query...]` | 自由形式の検索クエリ。複数語のクエリはスペースで結合され、1つとして送信されます。 |

## 例

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

クエリがない場合、`openclaw docs` は検索を実行する代わりに、ドキュメントのエントリポイント URL とサンプル検索コマンドを表示します。

## 仕組み

`openclaw docs` は `mcporter` CLI を呼び出して docs 検索 MCP ツールを実行し、その後ツール出力の `Title: / Link: / Content:` ブロックを解析して結果リストにします。

`mcporter` を解決するために、OpenClaw は次の順序で確認します。

1. `PATH` 上の `mcporter` (存在する場合は直接使用)。
2. `pnpm` がインストールされている場合は `pnpm dlx mcporter ...`。
3. `npx` がインストールされている場合は `npx -y mcporter ...`。

いずれも利用できない場合、コマンドは `pnpm` (`npm install -g pnpm`) のインストールを促すヒントとともに失敗します。

検索呼び出しには固定の30秒タイムアウトが使用されます。結果スニペットは各項目あたり約220文字に切り詰められます。

## 出力

リッチな (TTY) ターミナルでは、結果は見出しに続く箇条書きリストとして表示されます。各箇条書きにはページタイトル、リンクされた docs URL、次の行に短いスニペットが表示されます。空の結果では "No results." と表示されます。

非リッチ出力 (パイプ、`--no-color`、スクリプト) では、同じデータが Markdown として表示されます。

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## 終了コード

| コード | 意味                                                    |
| ------ | ------------------------------------------------------- |
| `0`    | 検索に成功しました (結果が0件の応答を含む)。           |
| `1`    | MCP ツール呼び出しに失敗しました。stderr はインラインで出力されます。 |

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ライブドキュメント](https://docs.openclaw.ai)
