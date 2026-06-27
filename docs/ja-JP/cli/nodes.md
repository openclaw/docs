---
read_when:
    - ペアリングされたノード（カメラ、画面、キャンバス）を管理しています
    - リクエストを承認するか、node コマンドを呼び出す必要があります
summary: '`openclaw nodes` の CLI リファレンス (status, pairing, invoke, camera/canvas/screen)'
title: Node
x-i18n:
    generated_at: "2026-06-27T10:58:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

ペアリング済みノード（デバイス）を管理し、ノードの機能を呼び出します。

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

`nodes list` は保留中/ペアリング済みの表を出力します。ペアリング済みの行には、直近の接続からの経過時間（最終接続）が含まれます。
現在接続中のノードだけを表示するには `--connected` を使用します。ある期間内（例: `24h`, `7d`）に
接続したノードに絞り込むには `--last-connected <duration>` を使用します。
ノードのペアリングを削除するには `nodes remove --node <id|name|ip>` を使用します。
デバイスに基づくノードの場合、これは `devices/paired.json` でそのデバイスの `node` ロールを取り消し、
そのノードロールのセッションを切断します（混在ロールのデバイスは行を保持し、
`node` ロールだけを失います。ノード専用デバイスは削除されます）。また、一致する
従来の Gateway 所有ノードペアリングレコードも消去します。`operator.pairing` は
非オペレーターのノード行を削除できます。デバイストークンの呼び出し元が混在ロールデバイス上の
自分自身のノードロールを取り消す場合は、追加で `operator.admin` が必要です。

承認に関する注記:

- `openclaw nodes pending` に必要なのはペアリングスコープだけです。
- `gateway.nodes.pairing.autoApproveCidrs` は、明示的に信頼された初回の `role: node` デバイスペアリングに限り、
  保留ステップをスキップできます。デフォルトではオフで、アップグレードは承認しません。
- `openclaw nodes approve <requestId>` は、保留中リクエストから追加のスコープ要件を継承します:
  - コマンドなしリクエスト: ペアリングのみ
  - 非 exec ノードコマンド: ペアリング + 書き込み
  - `system.run` / `system.run.prepare` / `system.which`: ペアリング + 管理者

## 呼び出し

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

呼び出しフラグ:

- `--params <json>`: JSON オブジェクト文字列（デフォルト `{}`）。
- `--invoke-timeout <ms>`: ノード呼び出しタイムアウト（デフォルト `15000`）。
- `--idempotency-key <key>`: 任意の冪等性キー。
- `system.run` と `system.run.prepare` はここではブロックされます。シェル実行には `host=node` で `exec` ツールを使用してください。

ノードでシェル実行を行うには、`openclaw nodes run` の代わりに `host=node` で `exec` ツールを使用してください。
`nodes` CLI は現在、機能に重点を置いています。`nodes invoke` による直接 RPC に加えて、ペアリング、カメラ、
画面、位置情報、Canvas、通知を扱います。Canvas コマンドはバンドルされた実験的な Canvas plugin によって実装されます。core は互換性フックを保持しているため、それらは引き続き `openclaw nodes canvas` の下にあります。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ノード](/ja-JP/nodes)
