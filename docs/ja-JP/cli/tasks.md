---
read_when:
    - バックグラウンドタスクの記録を確認、監査、またはキャンセルしたい場合
    - '`openclaw tasks flow` 配下のTaskFlowコマンドについて説明しています'
summary: '`openclaw tasks` の CLI リファレンス（バックグラウンドタスク台帳と Task Flow の状態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-11T22:09:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

永続的なバックグラウンドタスクと Task Flow の状態を調査します。サブコマンドを指定しない場合、
`openclaw tasks` は `openclaw tasks list` と同等です。

ライフサイクルと配信モデルについては [バックグラウンドタスク](/ja-JP/automation/tasks)を、すべての検出項目の説明については、その `tasks audit` セクションを参照してください。

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

| フラグ             | 説明                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | JSON を出力します。                                                                                |
| `--runtime <name>` | 種別で絞り込みます: `subagent`、`acp`、`cron`、または `cli`。                                      |
| `--status <name>`  | 状態で絞り込みます: `queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled`、または `lost`。 |

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

タスク ID、実行 ID、またはセッションキーを使用して、1 件のタスクを表示します。

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

古くなった、消失した、配信に失敗した、またはその他の不整合があるタスクと
Task Flow のレコードを明示します。`cleanupAfter` まで保持される消失タスクは警告であり、
期限切れまたはタイムスタンプが付与されていない消失タスクはエラーです。

`--code` には、タスクコード（`stale_queued`、`stale_running`、`lost`、
`delivery_failed`、`missing_cleanup`、`inconsistent_timestamps`）および Task
Flow コード（`restore_failed`、`stale_waiting`、`stale_blocked`、
`cancel_stuck`、`missing_linked_tasks`、`blocked_task_missing`）を指定できます。
コードごとの重大度とトリガーの詳細については、[バックグラウンドタスク](/ja-JP/automation/tasks)を参照してください。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

タスクと Task Flow の照合、クリーンアップ用タイムスタンプの付与、
刈り込み、および古くなった cron 実行セッションレジストリのクリーンアップをプレビューまたは適用します。

cron タスクでは、古いアクティブタスクを `lost` としてマークする前に、永続化された実行ログとジョブ状態を照合に使用します。これにより、メモリ内の Gateway ランタイム状態がなくなったという理由だけで、完了済みの cron 実行が誤った監査エラーになることを防ぎます。
オフライン CLI 監査は、Gateway のプロセスローカルなアクティブ cron ジョブセットに対する信頼できる情報源ではありません。実行 ID またはソース ID を持つ CLI タスクは、古い子セッション行が残っていても、ライブ Gateway 実行コンテキストがなくなると `lost` としてマークされます。

適用時には、現在実行中の cron ジョブを保持し、cron 以外のセッション行には変更を加えずに、7 日より古い `cron:<jobId>:run:<uuid>` セッションレジストリ行も刈り込みます。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

タスク台帳にある永続的な Task Flow の状態を調査またはキャンセルします。
`flow list --status` には、`queued`、`running`、`waiting`、`blocked`、
`succeeded`、`failed`、`cancelled`、または `lost` を指定できます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
