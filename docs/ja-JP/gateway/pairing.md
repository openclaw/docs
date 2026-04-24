---
read_when:
    - macOS UI なしで Node ペアリング承認を実装する შემთხვევაში
    - リモート Node を承認するための CLI フローを追加する შემთხვევაში
    - Gateway protocol を Node 管理で拡張する შემთხვევაში
summary: iOS やその他のリモート Node 向けの Gateway 管理 Node ペアリング（Option B）
title: Gateway 管理ペアリング
x-i18n:
    generated_at: "2026-04-24T04:58:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42e1e927db9dd28c8a37881c5b014809e6286ffc00efe6f1a86dd2d55d360c09
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway 管理ペアリング（Option B）

Gateway 管理ペアリングでは、どの Node の参加を許可するかの正本は **Gateway** です。
UI（macOS アプリ、将来のクライアント）は、保留中のリクエストを承認または拒否するためのフロントエンドにすぎません。

**重要:** WS Node は `connect` 中に **device pairing**（role `node`）を使います。
`node.pair.*` は別のペアリングストアであり、WS handshake を制御しません。
このフローを使うのは、明示的に `node.pair.*` を呼び出すクライアントだけです。

## 概念

- **Pending request**: Node が参加を要求した状態。承認が必要です。
- **Paired node**: 新しい auth token が発行されて承認済みになった Node。
- **Transport**: Gateway WS エンドポイントはリクエストを転送しますが、
  メンバーシップ自体は判断しません。（旧来の TCP bridge サポートは削除されました。）

## ペアリングの仕組み

1. Node が Gateway WS に接続し、ペアリングを要求する。
2. Gateway が **pending request** を保存し、`node.pair.requested` を発行する。
3. リクエストを承認または拒否する（CLI または UI）。
4. 承認時、Gateway は**新しい token** を発行する（再ペアリング時には token はローテーションされます）。
5. Node はその token を使って再接続し、「paired」状態になる。

pending request は **5 分** で自動的に期限切れになります。

## CLI ワークフロー（ヘッドレス向け）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` には paired/connected Node とその capabilities が表示されます。

## API サーフェス（gateway protocol）

event:

- `node.pair.requested` — 新しい pending request が作成されたときに発行される。
- `node.pair.resolved` — リクエストが承認/拒否/期限切れになったときに発行される。

メソッド:

- `node.pair.request` — pending request を作成または再利用する。
- `node.pair.list` — pending + paired Node を一覧表示する（`operator.pairing`）。
- `node.pair.approve` — pending request を承認する（token を発行）。
- `node.pair.reject` — pending request を拒否する。
- `node.pair.verify` — `{ nodeId, token }` を検証する。

注:

- `node.pair.request` は Node ごとに冪等です。繰り返し呼び出しても同じ
  pending request が返ります。
- 同じ pending Node に対する繰り返しリクエストでは、保存済み Node
  メタデータと、operator の可視性のための最新の allowlist 済み declared command snapshot も更新されます。
- 承認時は**常に**新しい token が生成されます。`node.pair.request` から
  token が返されることはありません。
- リクエストには、自動承認フロー向けのヒントとして `silent: true` を含めることができます。
- `node.pair.approve` は、pending request の declared command を使って
  追加の承認スコープを強制します:
  - コマンドなしリクエスト: `operator.pairing`
  - 非 exec コマンドリクエスト: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` リクエスト:
    `operator.pairing` + `operator.admin`

重要:

- Node ペアリングは信頼/identity フローと token 発行です。
- これは Node ごとのライブ command サーフェスを pin するものでは**ありません**。
- ライブ Node command は、gateway のグローバル Node command policy（`gateway.nodes.allowCommands` /
  `denyCommands`）が適用された後に、その Node が connect 時に宣言した内容から決まります。
- Node ごとの `system.run` allow/ask policy はペアリングレコードではなく、Node 側の
  `exec.approvals.node.*` にあります。

## Node command ゲーティング（2026.3.31+）

<Warning>
**破壊的変更:** `2026.3.31` 以降、Node command は Node ペアリングが承認されるまで無効になります。device pairing だけでは declared Node command を公開するのに十分ではなくなりました。
</Warning>

Node が初回接続すると、自動的にペアリングが要求されます。そのペアリング要求が承認されるまでは、その Node からの保留中 Node command はすべてフィルターされ、実行されません。ペアリング承認によって信頼が確立されると、Node の declared command は通常の command policy に従って利用可能になります。

これは次を意味します。

- これまで device pairing だけに依存して command を公開していた Node は、今後は Node pairing を完了する必要があります。
- ペアリング承認前にキューされた command は、延期されずに破棄されます。

## Node event の信頼境界（2026.3.31+）

<Warning>
**破壊的変更:** Node 起点の run は、より縮小された trusted surface にとどまるようになりました。
</Warning>

Node 起点の要約および関連するセッション event は、意図された trusted surface に制限されます。以前はより広いホストまたはセッション tool アクセスに依存していた通知駆動または Node トリガーのフローは、調整が必要になる場合があります。このハードニングにより、Node event が Node の trust boundary を超えてホストレベル tool アクセスへ昇格することを防ぎます。

## 自動承認（macOS アプリ）

macOS アプリは、次の場合に**silent approval** を任意で試行できます。

- リクエストに `silent` が付いている、かつ
- 同じユーザーで gateway ホストへの SSH 接続を検証できる

silent approval に失敗した場合は、通常の「Approve/Reject」プロンプトにフォールバックします。

## メタデータアップグレード自動承認

すでにペアリング済みのデバイスが、機密でないメタデータ変更だけを伴って再接続した場合
（たとえば表示名やクライアントプラットフォームのヒント）、OpenClaw はそれを `metadata-upgrade` として扱います。silent 自動承認は限定的で、loopback 上で共有 token または password の所有をすでに証明した、信頼済みのローカル CLI/helper 再接続にのみ適用されます。Browser/Control UI クライアントとリモートクライアントは、引き続き明示的な再承認フローを使います。スコープのアップグレード（read から
write/admin）や公開鍵の変更は、**metadata-upgrade 自動承認の対象ではありません**。これらは引き続き明示的な再承認リクエストになります。

## QR ペアリング helper

`/pair qr` は、モバイルやブラウザクライアントが直接スキャンできるよう、
ペアリング payload を構造化メディアとして描画します。

デバイスを削除すると、そのデバイス id に対応する stale な pending pairing request も同時に掃除されるため、`nodes pending` に revoke 後の孤立行は表示されません。

## ローカリティと forwarded headers

Gateway ペアリングは、生ソケットと上流 proxy の証拠が両方一致する場合にのみ、
接続を loopback とみなします。リクエストが loopback 上で到着しても、
非ローカル origin を指す `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
ヘッダーを持っている場合、その forwarded-header の証拠によって
loopback ローカリティの主張は無効になります。その場合、ペアリング経路は
同一ホスト接続として黙って扱うのではなく、明示的な承認を要求します。
operator 認証での同等ルールについては
[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。

## 保存先（ローカル、非公開）

ペアリング状態は Gateway の状態ディレクトリ配下（デフォルト `~/.openclaw`）に保存されます。

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` を上書きした場合、`nodes/` フォルダーも一緒に移動します。

セキュリティ注記:

- token はシークレットです。`paired.json` は機密として扱ってください。
- token をローテーションするには再承認（または Node エントリー削除）が必要です。

## トランスポート動作

- トランスポートは**ステートレス**で、メンバーシップを保存しません。
- Gateway がオフライン、またはペアリングが無効な場合、Node はペアリングできません。
- Gateway が remote mode であっても、ペアリングは引き続きリモート Gateway のストアに対して行われます。

## 関連

- [チャンネルペアリング](/ja-JP/channels/pairing)
- [Nodes](/ja-JP/nodes)
- [Devices CLI](/ja-JP/cli/devices)
