---
read_when:
    - ノードクライアントのビルドまたはデバッグ（iOS/Android/macOS ノードモード）
    - ペアリングまたはブリッジ認証の失敗を調査する
    - Gateway によって公開されるノードサーフェスの監査
summary: '履歴ブリッジプロトコル（レガシーノード）: TCP JSONL、ペアリング、スコープ付き RPC'
title: ブリッジプロトコル
x-i18n:
    generated_at: "2026-06-27T11:21:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP ブリッジは**削除されました**。現在の OpenClaw ビルドはブリッジリスナーを同梱しておらず、`bridge.*` 設定キーはスキーマに含まれなくなりました。このページは履歴参照用にのみ残されています。すべてのノード/オペレータークライアントには [Gateway プロトコル](/ja-JP/gateway/protocol)を使用してください。
</Warning>

## 存在していた理由

- **セキュリティ境界**: ブリッジは Gateway API サーフェス全体ではなく、
  小さな許可リストを公開します。
- **ペアリング + ノード ID**: ノードの受け入れは Gateway が所有し、
  ノードごとのトークンに紐付けられます。
- **検出 UX**: ノードは LAN 上の Bonjour で Gateway を検出するか、
  tailnet 経由で直接接続できます。
- **ループバック WS**: 完全な WS 制御プレーンは、SSH 経由でトンネルされない限りローカルに留まります。

## トランスポート

- TCP、1 行につき 1 つの JSON オブジェクト (JSONL)。
- 任意の TLS (`bridge.tls.enabled` が true の場合)。
- 履歴上のデフォルトリスナーポートは `18790` でした (現在のビルドは
  TCP ブリッジを起動しません)。

TLS が有効な場合、検出 TXT レコードには非秘密のヒントとして `bridgeTls=1` と
`bridgeTlsSha256` が含まれます。Bonjour/mDNS TXT レコードは認証されない点に注意してください。クライアントは、明示的なユーザー意図または他の帯域外検証なしに、広告されたフィンガープリントを権威あるピンとして扱ってはなりません。

## ハンドシェイク + ペアリング

1. クライアントはノードメタデータ + トークン (すでにペアリング済みの場合) を含む `hello` を送信します。
2. ペアリングされていない場合、Gateway は `error` (`NOT_PAIRED`/`UNAUTHORIZED`) を返します。
3. クライアントは `pair-request` を送信します。
4. Gateway は承認を待ち、その後 `pair-ok` と `hello-ok` を送信します。

履歴上、`hello-ok` は `serverName` を返していました。ホストされた Plugin サーフェスは現在、
`pluginSurfaceUrls` を通じて広告されます。Canvas/A2UI は
`pluginSurfaceUrls.canvas` を使用します。非推奨の `canvasHostUrl` エイリアスは、リファクタリング後のプロトコルの一部ではありません。

## フレーム

クライアント → Gateway:

- `req` / `res`: スコープ付き Gateway RPC (chat, sessions, config, health, voicewake, skills.bins)
- `event`: ノードシグナル (音声トランスクリプト、エージェントリクエスト、チャット購読、exec ライフサイクル)

Gateway → クライアント:

- `invoke` / `invoke-res`: ノードコマンド (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: 購読中のセッションのチャット更新
- `ping` / `pong`: キープアライブ

レガシーの許可リスト適用は `src/gateway/server-bridge.ts` に存在していました (削除済み)。

## Exec ライフサイクルイベント

ノードは `exec.finished` イベントを送出して、完了した `system.run` アクティビティを表面化できます。
これらは Gateway 内でシステムイベントにマッピングされます。(レガシーノードは引き続き `exec.started` を送出する場合があります。)
ノードは拒否された `system.run` 試行に対して `exec.denied` を送出できます。Gateway は
このイベントを終端的な拒否として受け入れ、システムイベントのキュー投入やエージェント作業のウェイクは行いません。

ペイロードフィールド (明記がない限りすべて任意):

- `sessionKey` (必須): イベント相関、および
  `exec.finished` の場合はシステムイベント配信用のエージェントセッション。
- `runId`: グループ化用の一意の exec ID。
- `command`: 生または整形済みのコマンド文字列。
- `exitCode`, `timedOut`, `success`, `output`: 完了の詳細 (finished のみ)。
- `reason`: 拒否理由 (denied のみ)。

## 履歴上の tailnet 利用

- ブリッジを tailnet IP にバインドします:
  `~/.openclaw/openclaw.json` の `bridge.bind: "tailnet"` (履歴上のみ。`bridge.*` は無効になりました)。
- クライアントは MagicDNS 名または tailnet IP 経由で接続します。
- Bonjour はネットワークを**またぎません**。必要に応じて手動のホスト/ポートまたは広域 DNS-SD
  を使用してください。

## バージョニング

ブリッジは**暗黙の v1** でした (min/max ネゴシエーションなし)。このセクションは
履歴参照用のみです。現在のノード/オペレータークライアントは WebSocket
[Gateway プロトコル](/ja-JP/gateway/protocol)を使用します。

## 関連

- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [ノード](/ja-JP/nodes)
