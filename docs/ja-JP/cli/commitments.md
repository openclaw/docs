---
read_when:
    - 推測されたフォローアップの約束事項を確認したい
    - 保留中のチェックインを閉じたい場合
    - Heartbeat が配信する可能性がある内容を監査しています
summary: '`openclaw commitments` の CLI リファレンス（推論されたフォローアップを確認して却下する）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T05:03:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

推論されたフォローアップのコミットメントを一覧表示し、管理します。

コミットメントは、会話コンテキストから作成される、オプトインで短期間だけ保持されるフォローアップメモリーです。
概念ガイドについては、[推論されたコミットメント](/ja-JP/concepts/commitments)を参照してください。

サブコマンドなしの場合、`openclaw commitments` は保留中のコミットメントを一覧表示します。

## 使用法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## オプション

- `--all`: 保留中のコミットメントだけでなく、すべてのステータスを表示します。
- `--agent <id>`: 1つのエージェント id に絞り込みます。
- `--status <status>`: ステータスで絞り込みます。値: `pending`、`sent`、
  `dismissed`、`snoozed`、または `expired`。
- `--json`: 機械可読な JSON を出力します。

## 例

保留中のコミットメントを一覧表示します。

```bash
openclaw commitments
```

保存済みのすべてのコミットメントを一覧表示します。

```bash
openclaw commitments --all
```

1つのエージェントに絞り込みます。

```bash
openclaw commitments --agent main
```

スヌーズ中のコミットメントを探します。

```bash
openclaw commitments --status snoozed
```

1つ以上のコミットメントを却下します。

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

JSON としてエクスポートします。

```bash
openclaw commitments --all --json
```

## 出力

テキスト出力には次が含まれます。

- コミットメント id
- ステータス
- 種類
- 最も早い期限時刻
- スコープ
- 推奨される確認テキスト

JSON 出力には、コミットメントストアのパスと、保存済みレコード全体も含まれます。

## 関連

- [推論されたコミットメント](/ja-JP/concepts/commitments)
- [メモリーの概要](/ja-JP/concepts/memory)
- [Heartbeat](/ja-JP/gateway/heartbeat)
- [スケジュール済みタスク](/ja-JP/automation/cron-jobs)
