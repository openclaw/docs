---
read_when:
    - ペアリング済みのNode（カメラ、画面、キャンバス）を管理しています
    - リクエストを承認するか、Node コマンドを呼び出す必要があります
summary: '`openclaw nodes` の CLI リファレンス（ステータス、ペアリング、呼び出し、カメラ／キャンバス／画面／位置情報／通知）'
title: ノード
x-i18n:
    generated_at: "2026-07-12T14:28:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f6b80ca2d82e834280943bcde32f6dfab51ce5566e2174f2d0aa1cd58ca39d6a
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

ペアリング済みの Node（デバイス）を管理し、Node の機能を呼び出します。

関連項目: [Node の概要](/ja-JP/nodes) - [アクティブなコンピューターの存在状態](/ja-JP/nodes/presence) - [カメラ Node](/ja-JP/nodes/camera) - [画像 Node](/ja-JP/nodes/images)

すべてのサブコマンドに共通するオプション: `--url <url>`、`--token <token>`、`--timeout <ms>`（デフォルト `10000`）、`--json`。

## ステータス

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` と `list` はどちらも、`--connected`（接続中の Node のみ）と `--last-connected <duration>`（例: `24h`、`7d`。指定期間内に接続した Node のみ）を受け付けます。`list` は保留中の Node とペアリング済みの Node を別々の表に表示し、ペアリング済みの行には直近の接続からの経過時間（Last Connect）が含まれます。`status` は、Node ごとの機能、バージョン、最終入力の詳細を統合した 1 つの表に表示します。接続中の macOS Node は、アクセシビリティ権限が付与されている間のみ最終入力を報告し、最も新しい行には `active` と表示されます。[アクティブなコンピューターの存在状態](/ja-JP/nodes/presence)を参照してください。`describe` は、1 つの Node の機能、権限、アクティビティ、および有効な呼び出しコマンドと保留中の呼び出しコマンドを表示します。

## ペアリング

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

これらのコマンドは、Node の WS `connect` ハンドシェイクを制御するデバイスペアリング（`openclaw devices approve`）とは別の、Gateway が所有する `node.pair.*` ストアを操作します。両者の関係については、[Node](/ja-JP/nodes)を参照してください。

- `remove` は、Node のペアリング済みロールエントリを取り消します。デバイスを基盤とする Node の場合、デバイスペアリングストア内の `node` ロールを取り消し、その Node ロールのセッションを切断します。複数のロールを持つデバイスでは行が維持され、`node` ロールのみが失われます。Node 専用デバイスの行は削除されます。また、一致する従来の Gateway 所有 Node ペアリングレコードもすべて消去されます。
- `pending` に必要なのは `operator.pairing` スコープのみです。
- `gateway.nodes.pairing.autoApproveCidrs` を使用すると、明示的に信頼された初回の `role: node` デバイスペアリングで、保留中の手順を省略できます。デフォルトでは無効で、ロールのアップグレードは承認しません。
- `gateway.nodes.pairing.sshVerify`（デフォルトで有効）は、Gateway が SSH 経由で Node ホストのデバイスキーを検証できる場合、初回の `role: node` デバイスペアリングを自動承認します。最初の機能サーフェスも同じ手順で承認されます。[Node のペアリング](/ja-JP/gateway/pairing#ssh-verified-device-auto-approval-default)を参照してください。
- `approve` のスコープ要件は、保留中のリクエストで宣言されたコマンドに従います。
  - コマンドなしのリクエスト: `operator.pairing`
  - exec 以外の Node コマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`
- `remove` のスコープ: `operator.pairing` は、operator ではない Node の行を削除できます。複数のロールを持つデバイスで、デバイストークンの呼び出し元が自身の Node ロールを取り消す場合は、追加で `operator.admin` が必要です。

## 呼び出し

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

フラグ:

- `--command <command>`（必須）: 例: `canvas.eval`。
- `--params <json>`: JSON オブジェクト文字列（デフォルト `{}`）。
- `--invoke-timeout <ms>`: Node 呼び出しのタイムアウト（デフォルト `15000`）。
- `--idempotency-key <key>`: 任意の冪等性キー。

ここでは `system.run` と `system.run.prepare` はブロックされます。代わりに、シェルの実行には `host=node` を指定した `exec` ツールを使用してください。`system.which` は `invoke` 経由で使用できます。

## 通知、プッシュ、位置情報、画面

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` は、macOS、iOS、Android、直接接続された watchOS Node を含む、`system.notify` を宣言している Node にローカル通知を送信します。watchOS への直接配信には、OpenClaw がアクティブである必要があります。`--title` または `--body` が必要です。オプション: `--sound <name>`、`--priority <passive|active|timeSensitive>`、`--delivery <system|overlay|auto>`（デフォルト `system`）、`--invoke-timeout <ms>`（デフォルト `15000`）。
- `push` は、iOS Node に APNs テストプッシュを送信します。オプション: `--title <text>`（デフォルト `OpenClaw`）、`--body <text>`、検出された APNs 環境を上書きする `--environment <sandbox|production>`。
- `location get` は、Node の現在位置を取得します。オプション: `--max-age <ms>`（キャッシュ済みの位置情報を再利用）、`--accuracy <coarse|balanced|precise>`、`--location-timeout <ms>`（デフォルト `10000`）、`--invoke-timeout <ms>`（デフォルト `20000`）。
- `screen record` は短いクリップをキャプチャし、保存先のパスを表示します（`--json` を指定した場合は JSON を出力します）。オプション: `--screen <index>`（デフォルト `0`）、`--duration <ms|10s>`（デフォルト `10000`）、`--fps <fps>`（デフォルト `10`）、`--no-audio`、`--out <path>`、`--invoke-timeout <ms>`（デフォルト `120000`）。

カメラと Canvas のコマンドには、それぞれ専用のドキュメントがあります。[カメラ Node](/ja-JP/nodes/camera)、[Canvas](/ja-JP/platforms/mac/canvas)を参照してください。Canvas はバンドルされた実験的な Canvas Plugin によって実装されています。コアでは、互換性のためのマウントポイントとして `openclaw nodes canvas` を維持しています。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Node](/ja-JP/nodes)
