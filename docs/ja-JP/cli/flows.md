---
read_when:
    - 古いドキュメントやリリースノートで `openclaw flows` を見かけることがあります
    - TaskFlow をすばやく確認するためのリファレンスが必要な場合
summary: リダイレクト：フローコマンドは `openclaw tasks flow` 配下にあります
title: フロー（リダイレクト）
x-i18n:
    generated_at: "2026-07-11T22:02:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

トップレベルの `openclaw flows` コマンドはありません。永続的な TaskFlow の確認は `openclaw tasks flow` で行います。

## サブコマンド

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| サブコマンド | 説明                        | 引数 / オプション                                                                                 |
| ------------ | --------------------------- | ------------------------------------------------------------------------------------------------- |
| `list`       | 追跡中の TaskFlow を一覧表示します。 | `--json` は機械可読形式で出力します。`--status <name>` はフィルターです（以下のステータス値を参照）。 |
| `show`       | 1 件の TaskFlow を表示します。      | `<lookup>` はフロー ID または所有者キーです。`--json` は機械可読形式で出力します。                    |
| `cancel`     | 実行中の TaskFlow をキャンセルします。 | `<lookup>` はフロー ID または所有者キーです。                                                        |

`<lookup>` には、フロー ID（`list` / `show` が返すもの）またはフローの所有者キー（所有するサブシステムがフローの追跡に使用する安定した識別子）のいずれかを指定できます。

### ステータスフィルターの値

`list` の `--status` には、`queued`、`running`、`waiting`、`blocked`、`succeeded`、`failed`、`cancelled`、`lost` のいずれかを指定できます。

## 例

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

TaskFlow の概念と作成方法については、[TaskFlow](/ja-JP/automation/taskflow)を参照してください。親の `tasks` コマンドについては、[tasks CLI リファレンス](/ja-JP/cli/tasks)を参照してください。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [自動化](/ja-JP/automation)
- [TaskFlow](/ja-JP/automation/taskflow)
