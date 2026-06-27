---
read_when:
    - バックグラウンドタスクのレコードを確認、監査、またはキャンセルしたい場合
    - '`openclaw tasks flow` 配下のタスクフローコマンドを文書化しています'
summary: '`openclaw tasks` の CLI リファレンス（バックグラウンドタスク台帳とタスクフロー状態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:29:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

永続的なバックグラウンドタスクと Task Flow の状態を調査します。サブコマンドを指定しない場合、
`openclaw tasks` は `openclaw tasks list` と同等です。

ライフサイクルと配信モデルについては、[バックグラウンドタスク](/ja-JP/automation/tasks)を参照してください。

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
- `--runtime <name>`: 種類でフィルタリングします: `subagent`、`acp`、`cron`、または `cli`。
- `--status <name>`: 状態でフィルタリングします: `queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled`、または `lost`。

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

タスク ID、実行 ID、またはセッションキーで 1 件のタスクを表示します。

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

古い、失われた、配信に失敗した、またはその他の一貫性のないタスクおよび Task Flow レコードを表面化します。`cleanupAfter` まで保持される失われたタスクは警告です。期限切れまたはスタンプされていない失われたタスクはエラーです。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

タスクと Task Flow の照合、クリーンアップスタンプ付け、刈り込み、
および古い Cron 実行セッションレジストリのクリーンアップをプレビューまたは適用します。
Cron タスクでは、古いアクティブタスクを `lost` としてマークする前に、照合で永続化された実行ログやジョブ状態を使用するため、メモリ内の Gateway ランタイム状態がなくなっただけで、完了済みの Cron 実行が誤った監査エラーになることはありません。オフライン CLI 監査は、Gateway のプロセスローカルな Cron アクティブジョブセットに対して権威がありません。実行 ID またはソース ID を持つ CLI タスクは、古い子セッション行が残っていても、ライブ Gateway 実行コンテキストがなくなると `lost` としてマークされます。
適用すると、メンテナンスは現在実行中の Cron ジョブを保持し、Cron 以外のセッション行は変更せずに、7 日より古い `cron:<jobId>:run:<uuid>` セッションレジストリ行も刈り込みます。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

タスク台帳の下にある永続的な Task Flow 状態を調査またはキャンセルします。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [バックグラウンドタスク](/ja-JP/automation/tasks)
