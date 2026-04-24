---
read_when:
    - バックグラウンドタスク記録を確認、監査、またはキャンセルしたい場合
    - '`openclaw tasks flow` 配下の TaskFlow コマンドを文書化しています'
summary: '`openclaw tasks` の CLI リファレンス（バックグラウンドタスク台帳と TaskFlow 状態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T04:52:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

永続的なバックグラウンドタスクと TaskFlow の状態を確認します。サブコマンドなしの場合、
`openclaw tasks` は `openclaw tasks list` と同等です。

ライフサイクルと配信モデルについては、[バックグラウンドタスク](/ja-JP/automation/tasks) を参照してください。

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
- `--runtime <name>`: 種別でフィルタします: `subagent`、`acp`、`cron`、または `cli`。
- `--status <name>`: ステータスでフィルタします: `queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled`、または `lost`。

## サブコマンド

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

追跡されているバックグラウンドタスクを新しい順に一覧表示します。

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

古くなった、失われた、配信に失敗した、またはその他の不整合があるタスクおよび TaskFlow 記録を明らかにします。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

タスクおよび TaskFlow の照合、クリーンアップのスタンピング、削除をプレビューまたは適用します。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

タスク台帳配下の永続的な TaskFlow 状態を確認またはキャンセルします。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
