---
read_when:
    - バックグラウンドタスクの記録を確認、監査、またはキャンセルしたい場合
    - '`openclaw tasks flow` 配下の Task Flow コマンドについて記述しています'
summary: '`openclaw tasks` の CLI リファレンス（バックグラウンドタスク台帳とタスクフロー状態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

永続的なバックグラウンドタスクと Task Flow の状態を調べます。サブコマンドを指定しない場合、
`openclaw tasks` は `openclaw tasks list` と同等です。

ライフサイクルと配信モデルについては、[バックグラウンドタスク](/ja-JP/automation/tasks)を参照してください。

## 使用方法

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
- `--runtime <name>`: 種類でフィルターします: `subagent`、`acp`、`cron`、または `cli`。
- `--status <name>`: ステータスでフィルターします: `queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled`、または `lost`。

## サブコマンド

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

追跡対象のバックグラウンドタスクを新しい順に一覧表示します。

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

古くなった、失われた、配信に失敗した、またはその他の不整合があるタスクと Task Flow レコードを表面化します。`cleanupAfter` まで保持される失われたタスクは警告です。期限切れ、またはスタンプされていない失われたタスクはエラーです。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

タスクと Task Flow の照合、クリーンアップのスタンプ、枝刈りをプレビューまたは適用します。
cron タスクでは、古いアクティブタスクを `lost` としてマークする前に、照合で永続化された実行ログ/ジョブ状態を使用するため、
インメモリの Gateway ランタイム状態がなくなっただけで、完了済みの cron 実行が誤った監査エラーになることはありません。オフラインの CLI 監査は、
Gateway のプロセスローカルな cron アクティブジョブセットの権威ある情報ではありません。実行 ID/ソース ID を持つ CLI タスクは、
古い子セッション行が残っている場合でも、ライブ Gateway 実行コンテキストがなくなると `lost` としてマークされます。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

タスク台帳配下の永続的な Task Flow 状態を調べるか、キャンセルします。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
