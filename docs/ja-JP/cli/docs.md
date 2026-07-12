---
read_when:
    - ターミナルから公開中の OpenClaw ドキュメントを検索したい場合
    - ドキュメント CLI がどのホステッド検索 API を呼び出すかを把握する必要があります
summary: '`openclaw docs` の CLI リファレンス（公開中のドキュメントインデックスを検索）'
title: ドキュメント
x-i18n:
    generated_at: "2026-07-11T22:02:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

ターミナルから公開中の OpenClaw ドキュメントインデックスを検索します。

## 使用方法

```bash
openclaw docs                       # ドキュメントのエントリーポイントと検索例を表示
openclaw docs <query...>            # 公開中のドキュメントインデックスを検索
```

| 引数         | 説明                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `[query...]` | 自由形式の検索クエリ。複数単語のクエリはスペースで結合され、1 つのクエリとして送信されます。 |

クエリを指定しない場合、`openclaw docs` は検索を実行せず、ドキュメントのエントリーポイント URL と検索コマンドの例を表示します。

## 例

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## 仕組み

`openclaw docs` は `https://docs.openclaw.ai/api/search` を呼び出し、JSON の結果を表示します。検索リクエストには固定の 30 秒のタイムアウトが設定されています。

## 出力

リッチ（TTY）ターミナルでは、結果は見出しに続く箇条書きとして表示されます。各項目にはページタイトル、リンク付きのドキュメント URL、その次の行に短い抜粋が表示されます。結果が空の場合は「結果がありません。」と表示されます。

非リッチ出力（パイプ、`--no-color`、スクリプト）では、同じデータが Markdown として表示されます。

```markdown
# ドキュメント検索: <query>

- [タイトル](https://docs.openclaw.ai/...) - 抜粋
- [タイトル](https://docs.openclaw.ai/...) - 抜粋
```

## 終了コード

| コード | 意味                                                                                 |
| ------ | ------------------------------------------------------------------------------------ |
| `0`    | 検索に成功しました。結果が 0 件の応答も含まれます。                                  |
| `1`    | ホストされているドキュメント検索 API の呼び出しに失敗し、stderr にエラーメッセージが表示されました。 |

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [公開中のドキュメント](https://docs.openclaw.ai)
