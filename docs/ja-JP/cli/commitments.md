---
read_when:
    - 推定されたフォローアップのコミットメントを確認する場合
    - 保留中のチェックインを破棄したい場合
    - Heartbeat が配信する可能性のある内容を監査しています
summary: '`openclaw commitments` の CLI リファレンス（推測されたフォローアップの確認と破棄）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T11:31:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

推論されたフォローアップのコミットメントを一覧表示し、管理します。

コミットメントはオプトイン（`commitments.enabled`）であり、会話のコンテキストから作成され、Heartbeat によって配信される短期間のフォローアップメモリです。概念ガイドと設定については、[推論されたコミットメント](/ja-JP/concepts/commitments)を参照してください。

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
- `--status <status>`: ステータスで絞り込みます。値: `pending`、`sent`、
  `dismissed`、`snoozed`、または `expired`。不明な値の場合はエラーで終了します。
- `--json`: 機械可読な JSON を出力します。

`dismiss` は指定されたコミットメント ID を `dismissed` としてマークし、Heartbeat が
それらを配信しないようにします。

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

テキスト出力には、コミットメント数、共有 SQLite データベースのパス、有効なフィルター、
およびコミットメントごとに 1 行が表示されます。

- コミットメント ID
- ステータス
- 種類（`event_check_in`、`deadline_check`、`care_check_in`、または `open_loop`）
- 最も早い期限
- スコープ（エージェント/チャンネル/ターゲット）
- 提案される確認テキスト

JSON 出力には、件数、有効なステータスとエージェントのフィルター、共有 SQLite データベースのパス、および保存されている完全なレコードが含まれます。

## 関連項目

- [推論されたコミットメント](/ja-JP/concepts/commitments)
- [メモリの概要](/ja-JP/concepts/memory)
- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュールされたタスク](/ja-JP/automation/cron-jobs)
