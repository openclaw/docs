---
read_when:
    - ペアリングされた Node（カメラ、画面、キャンバス）を管理している場合
    - リクエストを承認するか、Node コマンドを実行する必要があります
summary: '`openclaw nodes` の CLI リファレンス（ステータス、ペアリング、呼び出し、カメラ／キャンバス／画面／位置情報／通知）'
title: ノード
x-i18n:
    generated_at: "2026-07-16T11:31:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

ペアリング済みのノード（デバイス）を管理し、ノードの機能を呼び出します。

関連項目: [ノードの概要](/ja-JP/nodes) - [アクティブなコンピューターのプレゼンス](/ja-JP/nodes/presence) - [カメラノード](/ja-JP/nodes/camera) - [画像ノード](/ja-JP/nodes/images)

すべてのサブコマンドで共通のオプション: `--url <url>`、`--token <token>`、`--timeout <ms>`（デフォルトは `10000`）、`--json`。

## ステータス

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` と `list` はどちらも、`--connected`（接続中のノードのみ）と `--last-connected <duration>`（例: `24h`、`7d`。指定期間内に接続したノードのみ）を受け付けます。`list` は保留中のノードとペアリング済みのノードを別々の表に表示し、ペアリング済みの行には最新の接続からの経過時間（Last Connect）が含まれます。`status` は、ノードごとの機能、バージョン、最終入力の詳細を1つの統合表に表示します。接続中の macOS ノードは、アクセシビリティ権限が付与されている間のみ最終入力を報告し、最新の行には `active` が表示されます。[アクティブなコンピューターのプレゼンス](/ja-JP/nodes/presence)を参照してください。`describe` は、1つのノードの機能、権限、アクティビティ、および有効な呼び出しコマンドと保留中の呼び出しコマンドを出力します。

## ペアリング

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

これらのコマンドは Gateway が所有する `node.pair.*` ストアを操作します。このストアは、ノードの WS `connect` ハンドシェイクを制御するデバイスペアリング（`openclaw devices approve`）とは別のものです。両者の関係については、[ノード](/ja-JP/nodes)を参照してください。

- `remove` は、ノードのペアリング済みロールエントリを取り消します。デバイスを基盤とするノードの場合、デバイスペアリングストアの `node` ロールを取り消し、そのノードロールのセッションを切断します。複数のロールを持つデバイスは行を維持し、`node` ロールのみを失います。ノード専用デバイスの行は削除されます。また、一致する従来の Gateway 所有ノードペアリングレコードもすべて消去されます。
- `pending` に必要なのは `operator.pairing` スコープのみです。
- `gateway.nodes.pairing.autoApproveCidrs` は、明示的に信頼された初回の `role: node` デバイスペアリングで保留ステップを省略できます。デフォルトでは無効であり、ロールのアップグレードは承認しません。
- `gateway.nodes.pairing.sshVerify`（デフォルトで有効）は、Gateway がノードホストへの SSH 経由でデバイスキーを検証できる場合、初回の `role: node` デバイスペアリングを自動承認します。最初の機能サーフェスも同じステップで承認されます。[ノードのペアリング](/ja-JP/gateway/pairing#ssh-verified-device-auto-approval-default)を参照してください。
- `approve` スコープの要件は、保留中のリクエストで宣言されたコマンドに従います。
  - コマンドなしのリクエスト: `operator.pairing`
  - 通常のノードコマンド: `operator.pairing` + `operator.write`
  - 管理者権限を要するコマンド（`system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`fs.listDir`、および `system.execApprovals.get/set`）: `operator.pairing` + `operator.admin`
- `remove` スコープ: `operator.pairing` はオペレーター以外のノード行を削除できます。複数のロールを持つデバイスで、自身のノードロールを取り消すデバイストークンの呼び出し元には、さらに `operator.admin` が必要です。

## 呼び出し

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

フラグ:

- `--command <command>`（必須）: 例: `canvas.eval`。
- `--params <json>`: JSON オブジェクト文字列（デフォルトは `{}`）。
- `--invoke-timeout <ms>`: ノード呼び出しのタイムアウト（デフォルトは `15000`）。
- `--idempotency-key <key>`: オプションの冪等性キー。

`system.run` と `system.run.prepare` はここではブロックされます。代わりに、シェル実行には `host=node` を指定した `exec` ツールを使用してください。`system.which` は `invoke` を介して許可されます。

## 通知、プッシュ、位置情報、画面

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` は、`system.notify` を宣言するノードにローカル通知を送信します。対象には macOS、iOS、Android、および直接接続された watchOS ノードが含まれます。watchOS への直接配信には、OpenClaw がアクティブである必要があります。`--title` または `--body` が必要です。オプション: `--sound <name>`、`--priority <passive|active|timeSensitive>`、`--delivery <system|overlay|auto>`（デフォルトは `system`）、`--invoke-timeout <ms>`（デフォルトは `15000`）。
- `push` は、iOS ノードに APNs テストプッシュを送信します。オプション: `--title <text>`（デフォルトは `OpenClaw`）、`--body <text>`、検出された APNs 環境を上書きする `--environment <sandbox|production>`。
- `location get` は、ノードの現在位置を取得します。オプション: `--max-age <ms>`（キャッシュされた位置情報を再利用）、`--accuracy <coarse|balanced|precise>`、`--location-timeout <ms>`（デフォルトは `10000`）、`--invoke-timeout <ms>`（デフォルトは `20000`）。
- `screen record` は短いクリップをキャプチャし、保存先のパスを出力します（または `--json` を使用して JSON を出力します）。オプション: `--screen <index>`（デフォルトは `0`）、`--duration <ms|10s>`（デフォルトは `10000`）、`--fps <fps>`（デフォルトは `10`）、`--no-audio`、`--out <path>`、`--invoke-timeout <ms>`（デフォルトは `120000`）。

カメラコマンドと Canvas コマンドには、それぞれ専用のドキュメントがあります。[カメラノード](/ja-JP/nodes/camera)、[Canvas](/ja-JP/platforms/mac/canvas)を参照してください。Canvas はバンドルされた実験的な Canvas Plugin によって実装されており、コアは互換性のためのマウントポイントとして `openclaw nodes canvas` を維持します。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [ノード](/ja-JP/nodes)
