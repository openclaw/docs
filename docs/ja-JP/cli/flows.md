---
read_when:
    - 古いドキュメントやリリースノートで `openclaw flows` を見かける
    - TaskFlow をすばやく確認するためのリファレンスが必要な場合
summary: 'リダイレクト: flow コマンドは `openclaw tasks flow` 配下にあります'
title: フロー（リダイレクト）
x-i18n:
    generated_at: "2026-05-10T19:28:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

トップレベルの `openclaw flows` コマンドはありません。永続的な TaskFlow の検査は `openclaw tasks flow` 配下にあります。

## サブコマンド

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| サブコマンド | 説明                | 引数 / オプション                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | 追跡中の TaskFlow を一覧表示します。    | `--json` 機械可読出力。`--status <name>` フィルター（下記のステータス値を参照）。 |
| `show`     | 1 つの TaskFlow を表示します。         | `<lookup>` フロー ID またはオーナーキー。`--json` 機械可読出力。                    |
| `cancel`   | 実行中の TaskFlow をキャンセルします。 | `<lookup>` フロー ID またはオーナーキー。                                                      |

`<lookup>` には、フロー ID（`list` / `show` によって返されるもの）またはフローのオーナーキー（所有するサブシステムがフローを追跡するために使用する安定した識別子）のいずれかを指定できます。

### ステータスフィルター値

`list` の `--status` には、次のいずれかを指定できます。

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## 例

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

TaskFlow の完全な概念と作成については [TaskFlow](/ja-JP/automation/taskflow) を参照してください。親の `tasks` コマンドについては [tasks CLI リファレンス](/ja-JP/cli/tasks) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [自動化](/ja-JP/automation)
- [TaskFlow](/ja-JP/automation/taskflow)
