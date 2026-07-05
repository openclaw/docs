---
read_when:
    - 古いドキュメントやリリースノートで `openclaw flows` に遭遇する
    - TaskFlow をすばやく確認するためのリファレンスが必要
summary: 'リダイレクト: flow コマンドは `openclaw tasks flow` 配下にあります'
title: フロー（リダイレクト）
x-i18n:
    generated_at: "2026-07-05T11:12:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

トップレベルの `openclaw flows` コマンドはありません。永続的な TaskFlow の検査は `openclaw tasks flow` の下にあります。

## サブコマンド

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| サブコマンド | 説明                | 引数 / オプション                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | 追跡中の TaskFlow を一覧表示します。    | `--json` は機械可読出力、`--status <name>` はフィルターです（下記のステータス値を参照）。 |
| `show`     | 1 つの TaskFlow を表示します。         | `<lookup>` はフロー ID または所有者キーです。`--json` は機械可読出力です。                    |
| `cancel`   | 実行中の TaskFlow をキャンセルします。 | `<lookup>` はフロー ID または所有者キーです。                                                      |

`<lookup>` は、フロー ID（`list` / `show` が返すもの）またはフローの所有者キー（所有するサブシステムがフローを追跡するために使う安定した識別子）のどちらも受け付けます。

### ステータスフィルター値

`list` の `--status` は、`queued`、`running`、`waiting`、`blocked`、`succeeded`、`failed`、`cancelled`、`lost` のいずれかを受け付けます。

## 例

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

TaskFlow の概念と作成については、[TaskFlow](/ja-JP/automation/taskflow) を参照してください。親の `tasks` コマンドについては、[tasks CLI リファレンス](/ja-JP/cli/tasks) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [自動化](/ja-JP/automation)
- [TaskFlow](/ja-JP/automation/taskflow)
