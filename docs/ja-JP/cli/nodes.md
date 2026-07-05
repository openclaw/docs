---
read_when:
    - ペアリングされたノード（カメラ、画面、キャンバス）を管理しています
    - リクエストを承認するか、node コマンドを呼び出す必要があります
summary: '`openclaw nodes` の CLI リファレンス（status、pairing、invoke、camera/canvas/screen/location/notify）'
title: ノード
x-i18n:
    generated_at: "2026-07-05T11:10:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2542d7cba45fd4db7480baee48370aea5980dc03d683ea28b65c11fef1007c03
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

ペアリング済みノード（デバイス）を管理し、ノード機能を呼び出します。

関連: [ノード概要](/ja-JP/nodes) - [カメラノード](/ja-JP/nodes/camera) - [画像ノード](/ja-JP/nodes/images)

すべてのサブコマンドで共通のオプション: `--url <url>`、`--token <token>`、`--timeout <ms>`（デフォルト `10000`）、`--json`。

## ステータス

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` と `list` はどちらも `--connected`（接続中のノードのみ）と `--last-connected <duration>`（例: `24h`、`7d`。指定期間内に接続したノードのみ）を受け付けます。`list` は保留中ノードとペアリング済みノードを別々のテーブルで表示し、ペアリング済み行には直近の接続経過時間（最終接続）が含まれます。`status` はノードごとの機能とバージョンの詳細を含む 1 つの統合テーブルを表示します。`describe` は 1 つのノードの機能、権限、有効な呼び出しコマンドと保留中の呼び出しコマンドを出力します。

## ペアリング

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

これらのコマンドは、ノードの WS `connect` ハンドシェイクを制御するデバイスペアリング（`openclaw devices approve`）とは別の、Gateway 所有の `node.pair.*` ストアを操作します。両者の関係については [ノード](/ja-JP/nodes) を参照してください。

- `remove` はノードのペアリング済みロールエントリを取り消します。デバイスに裏付けられたノードの場合、これはデバイスペアリングストア内の `node` ロールを取り消し、そのノードロールセッションを切断します。混合ロールのデバイスは行を保持し、`node` ロールだけを失います。ノード専用デバイスの行は削除されます。一致する従来の Gateway 所有ノードペアリングレコードもクリアします。
- `pending` に必要なのは `operator.pairing` スコープのみです。
- `gateway.nodes.pairing.autoApproveCidrs` は、明示的に信頼された初回の `role: node` デバイスペアリングについて、保留ステップを省略できます。デフォルトではオフです。ロールのアップグレードは承認しません。
- `approve` のスコープ要件は、保留中リクエストで宣言されたコマンドに従います。
  - コマンドなしリクエスト: `operator.pairing`
  - exec 以外のノードコマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`
- `remove` のスコープ: `operator.pairing` は非オペレーターノード行を削除できます。混合ロールデバイス上で自分自身のノードロールを取り消すデバイストークン呼び出し元には、追加で `operator.admin` が必要です。

## 呼び出し

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"name":"uname"}'
```

フラグ:

- `--command <command>`（必須）: 例: `canvas.eval`。
- `--params <json>`: JSON オブジェクト文字列（デフォルト `{}`）。
- `--invoke-timeout <ms>`: ノード呼び出しタイムアウト（デフォルト `15000`）。
- `--idempotency-key <key>`: 任意の冪等性キー。

ここでは `system.run` と `system.run.prepare` はブロックされます。代わりにシェル実行には `host=node` の `exec` ツールを使用してください。`system.which` は `invoke` 経由で許可されます。

## 通知、プッシュ、位置情報、画面

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` はノード上でローカル通知を送信します（macOS のみ）。`--title` または `--body` が必要です。オプション: `--sound <name>`、`--priority <passive|active|timeSensitive>`、`--delivery <system|overlay|auto>`（デフォルト `system`）、`--invoke-timeout <ms>`（デフォルト `15000`）。
- `push` は iOS ノードに APNs テストプッシュを送信します。オプション: `--title <text>`（デフォルト `OpenClaw`）、`--body <text>`、検出された APNs 環境を上書きする `--environment <sandbox|production>`。
- `location get` はノードの現在位置を取得します。オプション: `--max-age <ms>`（キャッシュ済みの測位結果を再利用）、`--accuracy <coarse|balanced|precise>`、`--location-timeout <ms>`（デフォルト `10000`）、`--invoke-timeout <ms>`（デフォルト `20000`）。
- `screen record` は短いクリップをキャプチャし、保存先パスを出力します（または `--json` で JSON を書き出します）。オプション: `--screen <index>`（デフォルト `0`）、`--duration <ms|10s>`（デフォルト `10000`）、`--fps <fps>`（デフォルト `10`）、`--no-audio`、`--out <path>`、`--invoke-timeout <ms>`（デフォルト `120000`）。

カメラと Canvas のコマンドには独自のドキュメントがあります: [カメラノード](/ja-JP/nodes/camera)、[Canvas](/ja-JP/platforms/mac/canvas)。Canvas はバンドルされた実験的な Canvas Plugin によって実装されています。core は互換性のあるマウントポイントとして `openclaw nodes canvas` を維持します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ノード](/ja-JP/nodes)
