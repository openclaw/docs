---
read_when:
    - macOS UI なしで Node ペアリング承認を実装する
    - リモート Node を承認するための CLI フローを追加する
    - Gateway プロトコルを Node 管理で拡張する
summary: iOS やその他のリモート Node 向けの Gateway 所有 Node ペアリング（Option B）
title: Gateway 所有のペアリング
x-i18n:
    generated_at: "2026-04-23T14:04:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: f644f2dd9a79140156646a78df2a83f0940e3db8160cb083453e43c108eacf3a
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway 所有のペアリング（Option B）

Gateway 所有のペアリングでは、どの Node の参加を許可するかについての信頼できる情報源は **Gateway** です。UI（macOS アプリ、将来のクライアント）は、保留中リクエストを承認または拒否するためのフロントエンドにすぎません。

**重要:** WS Node は `connect` 中に **device pairing**（role `node`）を使います。`node.pair.*` は別のペアリングストアであり、WS ハンドシェイクを制御しません。このフローを使うのは、明示的に `node.pair.*` を呼び出すクライアントだけです。

## 概念

- **保留中リクエスト**: Node が参加を要求した状態。承認が必要です。
- **ペアリング済み Node**: 承認され、認証トークンが発行された Node。
- **トランスポート**: Gateway WS エンドポイントはリクエストを転送しますが、メンバーシップを決定しません。（従来の TCP ブリッジサポートは削除されています。）

## ペアリングの仕組み

1. Node が Gateway WS に接続し、ペアリングを要求します。
2. Gateway は **保留中リクエスト** を保存し、`node.pair.requested` を発行します。
3. あなたがそのリクエストを承認または拒否します（CLI または UI）。
4. 承認時に Gateway は **新しいトークン** を発行します（再ペアリング時にはトークンがローテーションされます）。
5. Node はそのトークンを使って再接続し、これで「ペアリング済み」になります。

保留中リクエストは **5 分** で自動的に期限切れになります。

## CLI ワークフロー（ヘッドレス向け）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` は、ペアリング済み/接続済み Node とその capabilities を表示します。

## API サーフェス（gateway protocol）

イベント:

- `node.pair.requested` — 新しい保留中リクエストが作成されたときに発行されます。
- `node.pair.resolved` — リクエストが承認/拒否/期限切れになったときに発行されます。

メソッド:

- `node.pair.request` — 保留中リクエストを作成または再利用します。
- `node.pair.list` — 保留中 + ペアリング済み Node を一覧表示します（`operator.pairing`）。
- `node.pair.approve` — 保留中リクエストを承認します（トークンを発行）。
- `node.pair.reject` — 保留中リクエストを拒否します。
- `node.pair.verify` — `{ nodeId, token }` を検証します。

注意:

- `node.pair.request` は Node 単位で冪等です。繰り返し呼び出すと同じ保留中リクエストが返ります。
- 同じ保留中 Node への繰り返しリクエストでは、保存済み Node メタデータと、operator 可視性のための最新の allowlist 済み declared command スナップショットも更新されます。
- 承認では **常に** 新しいトークンが生成されます。`node.pair.request` からトークンが返されることはありません。
- リクエストには、自動承認フロー向けのヒントとして `silent: true` を含められます。
- `node.pair.approve` は、保留中リクエストの declared commands を使って追加の承認スコープを強制します:
  - コマンドなしリクエスト: `operator.pairing`
  - 非 exec コマンドリクエスト: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` リクエスト:
    `operator.pairing` + `operator.admin`

重要:

- Node ペアリングは、信頼/アイデンティティフローにトークン発行を組み合わせたものです。
- これは Node 単位で live の Node コマンドサーフェスを固定するものでは **ありません**。
- live の Node コマンドは、Node が接続時に申告したものに、gateway のグローバル Node コマンドポリシー（`gateway.nodes.allowCommands` / `denyCommands`）が適用された結果から決まります。
- Node 単位の `system.run` の allow/ask ポリシーは、ペアリングレコードではなく Node 側の `exec.approvals.node.*` にあります。

## Node コマンド制御（2026.3.31+）

<Warning>
**破壊的変更:** `2026.3.31` 以降、Node コマンドは Node ペアリングが承認されるまで無効です。device pairing だけでは declared node commands は公開されなくなりました。
</Warning>

Node が初めて接続すると、ペアリングが自動的に要求されます。そのペアリングリクエストが承認されるまでは、その Node からの保留中 Node コマンドはすべてフィルタリングされ、実行されません。ペアリング承認によって信頼が確立されると、その Node の declared commands は通常のコマンドポリシーに従って利用可能になります。

これは次を意味します。

- これまで device pairing のみでコマンド公開を行っていた Node は、今後 Node ペアリングも完了する必要があります。
- ペアリング承認前にキューされたコマンドは延期されず、破棄されます。

## Node イベントの信頼境界（2026.3.31+）

<Warning>
**破壊的変更:** Node 起点の実行は、より制限された信頼サーフェスに留まるようになりました。
</Warning>

Node 起点の要約および関連するセッションイベントは、意図された信頼サーフェスに制限されます。以前はより広いホストまたはセッションツールアクセスに依存していた通知駆動または Node トリガーのフローでは、調整が必要になることがあります。この強化により、Node イベントが Node の信頼境界を超えてホストレベルのツールアクセスへ昇格することを防ぎます。

## 自動承認（macOS アプリ）

macOS アプリは、次の場合にオプションで **silent approval** を試行できます。

- リクエストが `silent` としてマークされている
- アプリが、同じユーザーを使った gateway ホストへの SSH 接続を検証できる

silent approval に失敗した場合は、通常の「承認/拒否」プロンプトにフォールバックします。

## メタデータアップグレードの自動承認

すでにペアリング済みのデバイスが、非機密なメタデータ変更のみ（たとえば表示名やクライアントプラットフォームのヒント）で再接続した場合、OpenClaw はそれを `metadata-upgrade` とみなします。silent auto-approval は狭く限定されており、loopback 経由で共有トークンまたはパスワードの所持をすでに証明している、信頼済みのローカル CLI/helper 再接続にのみ適用されます。ブラウザ/Control UI クライアントとリモートクライアントでは、引き続き明示的な再承認フローが使われます。スコープのアップグレード（read から write/admin）や公開鍵の変更は、**metadata-upgrade auto-approval の対象外** です。これらは引き続き明示的な再承認リクエストになります。

## QR ペアリング補助

`/pair qr` は、モバイルおよびブラウザクライアントが直接スキャンできるように、ペアリングペイロードを構造化メディアとしてレンダリングします。

デバイスを削除すると、そのデバイス ID に対応する古い保留中ペアリングリクエストもあわせて削除されるため、取り消し後に `nodes pending` に孤立した行が残りません。

## ローカリティと転送ヘッダー

Gateway ペアリングでは、生ソケットと upstream proxy の証拠の両方が一致する場合にのみ、その接続を loopback とみなします。リクエストが loopback 上に到着しても、`X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` ヘッダーに非ローカルな接続元が示されている場合、その転送ヘッダーの証拠によって loopback ローカリティの主張は無効化されます。その場合、ペアリング経路では同一ホスト接続として黙って扱うのではなく、明示的な承認が必要になります。operator 認証における同等ルールについては [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

## ストレージ（ローカル、プライベート）

ペアリング状態は Gateway の状態ディレクトリ（デフォルト `~/.openclaw`）配下に保存されます。

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` を上書きすると、`nodes/` フォルダーも一緒に移動します。

セキュリティ上の注意:

- トークンは secret です。`paired.json` は機密として扱ってください。
- トークンをローテーションするには再承認（または Node エントリの削除）が必要です。

## トランスポート動作

- トランスポートは **ステートレス** であり、メンバーシップを保存しません。
- Gateway がオフライン、またはペアリングが無効な場合、Node はペアリングできません。
- Gateway がリモートモードでも、ペアリングは引き続きそのリモート Gateway のストアに対して行われます。
