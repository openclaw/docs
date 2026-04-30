---
read_when:
    - ペアリング済みノード（カメラ、画面、キャンバス）を管理しています
    - リクエストを承認するか、node コマンドを実行する必要があります
summary: '`openclaw nodes` の CLI リファレンス（status、pairing、invoke、camera/canvas/screen）'
title: ノード
x-i18n:
    generated_at: "2026-04-30T05:05:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

ペアリング済みノード（デバイス）を管理し、ノード機能を呼び出します。

関連:

- ノード概要: [ノード](/ja-JP/nodes)
- カメラ: [カメラノード](/ja-JP/nodes/camera)
- 画像: [画像ノード](/ja-JP/nodes/images)

共通オプション:

- `--url`, `--token`, `--timeout`, `--json`

## 共通コマンド

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` は保留中/ペアリング済みのテーブルを出力します。ペアリング済み行には、直近の接続からの経過時間（最終接続）が含まれます。
現在接続中のノードのみを表示するには `--connected` を使用します。一定期間内（例: `24h`, `7d`）に接続したノードに
絞り込むには `--last-connected <duration>` を使用します。
古くなった Gateway 所有のノードペアリング記録を削除するには、`nodes remove --node <id|name|ip>` を使用します。

承認に関する注意:

- `openclaw nodes pending` に必要なのはペアリングスコープのみです。
- `gateway.nodes.pairing.autoApproveCidrs` は、明示的に信頼された初回の `role: node` デバイスペアリングに限り、
  保留中ステップを省略できます。これはデフォルトではオフであり、
  アップグレードは承認しません。
- `openclaw nodes approve <requestId>` は、保留中リクエストから追加のスコープ要件を継承します:
  - コマンドなしリクエスト: ペアリングのみ
  - exec 以外のノードコマンド: ペアリング + 書き込み
  - `system.run` / `system.run.prepare` / `system.which`: ペアリング + 管理者

## 呼び出し

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

呼び出しフラグ:

- `--params <json>`: JSON オブジェクト文字列（デフォルト `{}`）。
- `--invoke-timeout <ms>`: ノード呼び出しタイムアウト（デフォルト `15000`）。
- `--idempotency-key <key>`: 任意の冪等性キー。
- `system.run` と `system.run.prepare` はここではブロックされます。シェル実行には、`host=node` 付きの `exec` ツールを使用してください。

ノード上でシェル実行を行うには、`openclaw nodes run` ではなく、`host=node` 付きの `exec` ツールを使用してください。
`nodes` CLI は現在、機能中心です。`nodes invoke` による直接 RPC に加えて、ペアリング、カメラ、
画面、位置情報、キャンバス、通知を扱います。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ノード](/ja-JP/nodes)
