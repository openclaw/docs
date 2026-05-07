---
read_when:
    - ノードクライアントのビルドまたはデバッグ（iOS/Android/macOS ノードモード）
    - ペアリングまたはブリッジ認証の失敗を調査する
    - Gateway が公開するノードサーフェスの監査
summary: 履歴ブリッジプロトコル（レガシーノード）：TCP JSONL、ペアリング、スコープ付き RPC
title: ブリッジプロトコル
x-i18n:
    generated_at: "2026-05-07T13:16:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP ブリッジは**削除されました**。現在の OpenClaw ビルドにはブリッジリスナーは含まれず、`bridge.*` 設定キーもスキーマに存在しません。このページは過去の参考情報としてのみ保持されています。すべてのノード/オペレータークライアントには [Gateway プロトコル](/ja-JP/gateway/protocol)を使用してください。
</Warning>

## 存在していた理由

- **セキュリティ境界**: ブリッジは完全な Gateway API サーフェスではなく、小さな許可リストを公開します。
- **ペアリング + ノード ID**: ノードの受け入れは Gateway が所有し、ノードごとのトークンに紐づけられます。
- **検出 UX**: ノードは LAN 上の Bonjour 経由で Gateway を検出するか、tailnet 経由で直接接続できます。
- **Loopback WS**: 完全な WS コントロールプレーンは、SSH 経由でトンネルされない限りローカルに留まります。

## トランスポート

- TCP、1 行につき 1 つの JSON オブジェクト (JSONL)。
- 任意の TLS (`bridge.tls.enabled` が true の場合)。
- 過去のデフォルトリスナーポートは `18790` でした (現在のビルドは TCP ブリッジを起動しません)。

TLS が有効な場合、検出 TXT レコードには `bridgeTls=1` と、非機密のヒントとして `bridgeTlsSha256` が含まれます。Bonjour/mDNS TXT レコードは認証されない点に注意してください。クライアントは、明示的なユーザーの意図またはその他の帯域外検証がない限り、通知されたフィンガープリントを権威あるピンとして扱ってはなりません。

## ハンドシェイク + ペアリング

1. クライアントは、ノードメタデータ + トークン (すでにペアリング済みの場合) を含む `hello` を送信します。
2. ペアリングされていない場合、Gateway は `error` (`NOT_PAIRED`/`UNAUTHORIZED`) を返します。
3. クライアントは `pair-request` を送信します。
4. Gateway は承認を待ち、その後 `pair-ok` と `hello-ok` を送信します。

過去には、`hello-ok` は `serverName` を返していました。現在、ホストされた Plugin サーフェスは `pluginSurfaceUrls` を通じて通知されます。Canvas/A2UI は `pluginSurfaceUrls.canvas` を使用します。非推奨の `canvasHostUrl` エイリアスは、リファクタリング後のプロトコルには含まれません。

## フレーム

クライアント → Gateway:

- `req` / `res`: スコープ付き Gateway RPC (チャット、セッション、設定、ヘルス、voicewake、skills.bins)
- `event`: ノードシグナル (音声文字起こし、エージェントリクエスト、チャット購読、exec ライフサイクル)

Gateway → クライアント:

- `invoke` / `invoke-res`: ノードコマンド (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: 購読中セッションのチャット更新
- `ping` / `pong`: keepalive

従来の許可リスト適用は `src/gateway/server-bridge.ts` に存在していました (削除済み)。

## Exec ライフサイクルイベント

ノードは、system.run アクティビティを表面化するために `exec.finished` または `exec.denied` イベントを発行できます。
これらは Gateway 内でシステムイベントにマッピングされます。(従来のノードはまだ `exec.started` を発行する場合があります。)

ペイロードフィールド (明記されていない限りすべて任意):

- `sessionKey` (必須): システムイベントを受け取るエージェントセッション。
- `runId`: グループ化のための一意な exec ID。
- `command`: 生または整形済みのコマンド文字列。
- `exitCode`, `timedOut`, `success`, `output`: 完了の詳細 (finished のみ)。
- `reason`: 拒否理由 (denied のみ)。

## 過去の tailnet 利用

- ブリッジを tailnet IP にバインドします: `~/.openclaw/openclaw.json` 内の `bridge.bind: "tailnet"` (過去の情報のみ。`bridge.*` はもはや有効ではありません)。
- クライアントは MagicDNS 名または tailnet IP 経由で接続します。
- Bonjour はネットワークをまたぎません。必要に応じて、手動のホスト/ポートまたはワイドエリア DNS-SD を使用してください。

## バージョニング

ブリッジは**暗黙の v1** でした (min/max ネゴシエーションなし)。このセクションは過去の参考情報のみです。現在のノード/オペレータークライアントは WebSocket [Gateway プロトコル](/ja-JP/gateway/protocol)を使用します。

## 関連

- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [ノード](/ja-JP/nodes)
