---
read_when:
    - 推論されたフォローアップのコミットメントを確認したい
    - 保留中のチェックインを却下したい
    - 監査している対象は Heartbeat が配信する可能性のある内容です
summary: '`openclaw commitments` の CLI リファレンス（推測されたフォローアップの確認と却下）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-05T11:10:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

推論されたフォローアップのコミットメントを一覧表示および管理します。

コミットメントはオプトイン（`commitments.enabled`）で、会話コンテキストから作成され、Heartbeat によって配信される短期間のフォローアップメモリです。概念ガイドと設定については、[推論されたコミットメント](/ja-JP/concepts/commitments)を参照してください。

サブコマンドなしの場合、`openclaw commitments` は保留中のコミットメントを一覧表示します。

## 使用方法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## オプション

- `--all`: 保留中のコミットメントだけでなく、すべてのステータスを表示します。
- `--agent <id>`: 1 つのエージェント ID に絞り込みます。
- `--status <status>`: ステータスで絞り込みます。値: `pending`、`sent`、
  `dismissed`、`snoozed`、または `expired`。不明な値はエラーで終了します。
- `--json`: 機械可読な JSON を出力します。

`dismiss` は指定されたコミットメント ID を `dismissed` としてマークし、Heartbeat がそれらを配信しないようにします。

## 例

保留中のコミットメントを一覧表示します。

```bash
openclaw commitments
```

保存されているすべてのコミットメントを一覧表示します。

```bash
openclaw commitments --all
```

1 つのエージェントに絞り込みます。

```bash
openclaw commitments --agent main
```

スヌーズされたコミットメントを検索します。

```bash
openclaw commitments --status snoozed
```

1 つ以上のコミットメントを破棄します。

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

JSON としてエクスポートします。

```bash
openclaw commitments --all --json
```

## 出力

テキスト出力では、コミットメント数、ストアパス、有効なフィルター、
およびコミットメントごとの 1 行が出力されます。

- コミットメント ID
- ステータス
- 種類（`event_check_in`、`deadline_check`、`care_check_in`、または `open_loop`）
- 最短の期限時刻
- スコープ（エージェント/チャンネル/ターゲット）
- 推奨されるチェックインテキスト

JSON 出力には、件数、有効なステータスおよびエージェントのフィルター、
コミットメントストアパス、保存されている完全なレコードが含まれます。

## 関連

- [推論されたコミットメント](/ja-JP/concepts/commitments)
- [メモリの概要](/ja-JP/concepts/memory)
- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュールされたタスク](/ja-JP/automation/cron-jobs)
