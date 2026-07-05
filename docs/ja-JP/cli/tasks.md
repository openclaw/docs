---
read_when:
    - バックグラウンドタスクレコードを検査、監査、またはキャンセルしたい
    - '`openclaw tasks flow` の下でタスクフローコマンドを文書化しています'
summary: '`openclaw tasks` の CLI リファレンス（バックグラウンドタスク台帳とタスクフロー状態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-05T11:14:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

永続的なバックグラウンドタスクと Task Flow の状態を検査します。サブコマンドを指定しない場合、
`openclaw tasks` は `openclaw tasks list` と同等です。

ライフサイクルと配信モデルについては [バックグラウンドタスク](/ja-JP/automation/tasks) を参照し、検出事項の完全な説明についてはその `tasks audit` セクションを参照してください。

## 使用法

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

| フラグ             | 説明                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | JSON を出力します。                                                                                |
| `--runtime <name>` | 種類でフィルタします: `subagent`、`acp`、`cron`、または `cli`。                                      |
| `--status <name>`  | ステータスでフィルタします: `queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled`、または `lost`。 |

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

実行中のタスクの通知ポリシーを変更します。

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

実行中のバックグラウンドタスクをキャンセルします。

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

古い、失われた、配信に失敗した、またはその他の不整合があるタスクと
Task Flow レコードを表面化します。`cleanupAfter` まで保持されている失われたタスクは警告です。
期限切れまたはスタンプされていない失われたタスクはエラーです。

`--code` はタスクコード (`stale_queued`、`stale_running`、`lost`、
`delivery_failed`、`missing_cleanup`、`inconsistent_timestamps`) と Task
Flow コード (`restore_failed`、`stale_waiting`、`stale_blocked`、
`cancel_stuck`、`missing_linked_tasks`、`blocked_task_missing`) を受け付けます。コードごとの重大度とトリガーの詳細については
[バックグラウンドタスク](/ja-JP/automation/tasks) を参照してください。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

タスクと Task Flow の調整、クリーンアップのスタンプ付け、枝刈り、および古い cron 実行セッションレジストリのクリーンアップをプレビューまたは適用します。

cron タスクでは、古いアクティブタスクを `lost` とマークする前に、調整が永続化された実行ログ/ジョブ状態を使用するため、メモリ内の Gateway ランタイム状態がなくなっただけで、完了した cron 実行が誤った監査エラーになることはありません。
オフライン CLI 監査は、Gateway のプロセスローカルな cron アクティブジョブセットについて信頼できる情報源ではありません。実行 ID/ソース ID を持つ CLI タスクは、古い子セッション行が残っている場合でも、ライブの Gateway 実行コンテキストがなくなると `lost` とマークされます。

適用すると、メンテナンスは現在実行中の cron ジョブを保持し、cron 以外のセッション行は変更せずに、7 日より古い `cron:<jobId>:run:<uuid>` セッションレジストリ行も枝刈りします。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

タスク台帳の下にある永続的な Task Flow 状態を検査またはキャンセルします。
`flow list --status` は `queued`、`running`、`waiting`、`blocked`、
`succeeded`、`failed`、`cancelled`、または `lost` を受け付けます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
