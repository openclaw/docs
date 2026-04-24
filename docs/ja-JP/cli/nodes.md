---
read_when:
    - ペアリング済み Node（camera、screen、canvas）を管理している場合
    - リクエストを承認する必要がある場合、または node コマンドを invoke する必要がある場合
summary: '`openclaw nodes` の CLI リファレンス（status、pairing、invoke、camera/canvas/screen）'
title: Nodes
x-i18n:
    generated_at: "2026-04-24T04:51:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

ペアリング済み Node（デバイス）を管理し、Node 機能を invoke します。

関連:

- Nodes 概要: [Nodes](/ja-JP/nodes)
- Camera: [Camera nodes](/ja-JP/nodes/camera)
- Images: [Image nodes](/ja-JP/nodes/images)

共通オプション:

- `--url`、`--token`、`--timeout`、`--json`

## よく使うコマンド

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` は pending/paired テーブルを表示します。paired 行には、直近の接続経過時間（Last Connect）が含まれます。
現在接続中の Node のみ表示するには `--connected` を使ってください。`--last-connected <duration>` を使うと、
指定期間内に接続した Node のみに絞り込めます（例: `24h`、`7d`）。

承認に関する注記:

- `openclaw nodes pending` に必要なのは pairing スコープのみです。
- `openclaw nodes approve <requestId>` は、保留中リクエストから追加スコープ要件を継承します:
  - コマンドなしリクエスト: pairing のみ
  - exec 以外の node コマンド: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Invoke フラグ:

- `--params <json>`: JSON オブジェクト文字列（デフォルト `{}`）。
- `--invoke-timeout <ms>`: Node invoke タイムアウト（デフォルト `15000`）。
- `--idempotency-key <key>`: 任意の冪等性キー。
- `system.run` と `system.run.prepare` はここではブロックされます。シェル実行には `host=node` を指定した `exec` ツールを使ってください。

Node 上でシェル実行するには、`openclaw nodes run` ではなく `host=node` を指定した `exec` ツールを使ってください。
`nodes` CLI は現在、機能重視です: `nodes invoke` による直接 RPC に加え、pairing、camera、
screen、location、canvas、notifications を扱います。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
