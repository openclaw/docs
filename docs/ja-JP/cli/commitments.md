---
read_when:
    - 推論されたフォローアップの確約を確認したい場合
    - 保留中のチェックインを取り消したい場合
    - Heartbeat が配信する可能性のある内容を監査しています
summary: '`openclaw commitments` の CLI リファレンス（推定されたフォローアップの確認と却下）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-11T22:06:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

推定されたフォローアップのコミットメントを一覧表示し、管理します。

コミットメントはオプトイン（`commitments.enabled`）であり、会話のコンテキストから作成され、Heartbeat によって配信される短期的なフォローアップメモリです。概念ガイドと設定については、[推定コミットメント](/ja-JP/concepts/commitments)を参照してください。

サブコマンドを指定しない場合、`openclaw commitments` は保留中のコミットメントを一覧表示します。

## 使用方法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## オプション

- `--all`: 保留中のコミットメントだけでなく、すべてのステータスを表示します。
- `--agent <id>`: 1 つのエージェント ID に絞り込みます。
- `--status <status>`: ステータスで絞り込みます。値は `pending`、`sent`、`dismissed`、`snoozed`、または `expired` です。不明な値を指定すると、エラーで終了します。
- `--json`: 機械可読な JSON を出力します。

`dismiss` は、指定されたコミットメント ID を `dismissed` としてマークし、Heartbeat がそれらを配信しないようにします。

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

スヌーズ中のコミットメントを検索します。

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

テキスト出力には、コミットメント数、ストアのパス、有効なフィルター、およびコミットメントごとに 1 行が表示されます。

- コミットメント ID
- ステータス
- 種類（`event_check_in`、`deadline_check`、`care_check_in`、または `open_loop`）
- 最も早い期限
- スコープ（エージェント／チャンネル／ターゲット）
- 提案されるチェックインテキスト

JSON 出力には、件数、有効なステータスフィルターとエージェントフィルター、コミットメントストアのパス、および保存されている完全なレコードが含まれます。

## 関連項目

- [推定コミットメント](/ja-JP/concepts/commitments)
- [メモリの概要](/ja-JP/concepts/memory)
- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュールされたタスク](/ja-JP/automation/cron-jobs)
