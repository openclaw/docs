---
read_when:
    - バックグラウンドタスク記録を確認、監査、またはキャンセルしたい
    - '`openclaw tasks flow` 配下の TaskFlow コマンドを文書化している'
summary: '`openclaw tasks` の CLI リファレンス（バックグラウンドタスク台帳と TaskFlow 状態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-23T14:02:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 549e07c8a576cb4c5bd48874f16b0daa4a34facb53b102e12d358bdad2191628
    source_path: cli/tasks.md
    workflow: 15
---

# `openclaw tasks`

永続的なバックグラウンドタスクと TaskFlow 状態を確認します。サブコマンドなしでは、`openclaw tasks` は `openclaw tasks list` と同等です。

ライフサイクルと配信モデルについては [Background Tasks](/ja-JP/automation/tasks) を参照してください。

## 使い方

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## ルートオプション

- `--json`: JSON を出力します。
- `--runtime <name>`: 種別で絞り込みます: `subagent`、`acp`、`cron`、または `cli`。
- `--status <name>`: ステータスで絞り込みます: `queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled`、または `lost`。

## サブコマンド

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

追跡中のバックグラウンドタスクを新しい順に一覧表示します。

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

タスク ID、実行 ID、またはセッションキーで 1 つのタスクを表示します。

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

実行中タスクの通知ポリシーを変更します。

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

実行中のバックグラウンドタスクをキャンセルします。

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

古くなった、失われた、配信失敗した、またはその他の不整合なタスクおよび TaskFlow 記録を表面化します。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

タスクおよび TaskFlow の照合、クリーンアップのスタンプ付け、削除のプレビューまたは適用を行います。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

タスク台帳配下の永続的な TaskFlow 状態を確認またはキャンセルします。
