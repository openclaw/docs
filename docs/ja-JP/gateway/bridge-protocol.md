---
read_when:
    - node クライアントのビルドまたはデバッグ（iOS/Android/macOS node モード）
    - ペアリングまたはブリッジ認証の失敗を調査する
    - Gateway が公開するノードサーフェスの監査
summary: 過去のブリッジプロトコル（レガシーノード）：TCP JSONL、ペアリング、スコープ付き RPC
title: ブリッジプロトコル
x-i18n:
    generated_at: "2026-05-06T17:55:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP ブリッジは**削除されました**。現在の OpenClaw ビルドにはブリッジリスナーは同梱されておらず、`bridge.*` 設定キーもスキーマに存在しなくなりました。このページは履歴参照用としてのみ保持されています。すべてのノード/オペレータークライアントには [Gateway Protocol](/ja-JP/gateway/protocol) を使用してください。
</Warning>

## 存在していた理由

- **セキュリティ境界**: ブリッジは Gateway API サーフェス全体ではなく、
  小さな許可リストを公開します。
- **ペアリング + ノード ID**: ノードの受け入れは Gateway が所有し、
  ノードごとのトークンに紐付けられます。
- **検出 UX**: ノードは LAN 上の Bonjour 経由で Gateway を検出するか、
  tailnet 経由で直接接続できます。
- **ループバック WS**: SSH 経由でトンネルされない限り、完全な WS 制御プレーンはローカルに留まります。

## トランスポート

- TCP、1 行につき 1 つの JSON オブジェクト (JSONL)。
- 任意の TLS (`bridge.tls.enabled` が true の場合)。
- 履歴上のデフォルトリスナーポートは `18790` でした (現在のビルドは
  TCP ブリッジを起動しません)。

TLS が有効な場合、検出 TXT レコードには `bridgeTls=1` と、非秘密のヒントとして `bridgeTlsSha256` が含まれます。Bonjour/mDNS TXT レコードは認証されない点に注意してください。クライアントは、明示的なユーザー意図または他の帯域外検証なしに、広告されたフィンガープリントを権威あるピンとして扱ってはなりません。

## ハンドシェイク + ペアリング

1. クライアントはノードメタデータ + トークン (すでにペアリング済みの場合) を含む `hello` を送信します。
2. ペアリングされていない場合、Gateway は `error` (`NOT_PAIRED`/`UNAUTHORIZED`) を返します。
3. クライアントは `pair-request` を送信します。
4. Gateway は承認を待ってから、`pair-ok` と `hello-ok` を送信します。

履歴上、`hello-ok` は `serverName` を返し、
`canvasHostUrl` を含めることができました。

## フレーム

クライアント → Gateway:

- `req` / `res`: スコープ付き Gateway RPC (chat、sessions、config、health、voicewake、skills.bins)
- `event`: ノードシグナル (音声文字起こし、エージェントリクエスト、チャット購読、exec ライフサイクル)

Gateway → クライアント:

- `invoke` / `invoke-res`: ノードコマンド (`canvas.*`、`camera.*`、`screen.record`、
  `location.get`、`sms.send`)
- `event`: 購読済みセッションのチャット更新
- `ping` / `pong`: keepalive

従来の許可リスト強制は `src/gateway/server-bridge.ts` にありました (削除済み)。

## Exec ライフサイクルイベント

ノードは system.run アクティビティを表面化するために、`exec.finished` または `exec.denied` イベントを発行できます。
これらは Gateway 内でシステムイベントにマッピングされます。(従来のノードはまだ `exec.started` を発行する場合があります。)

ペイロードフィールド (記載がない限りすべて任意):

- `sessionKey` (必須): システムイベントを受け取るエージェントセッション。
- `runId`: グループ化用の一意な exec ID。
- `command`: 生または整形済みのコマンド文字列。
- `exitCode`、`timedOut`、`success`、`output`: 完了詳細 (finished のみ)。
- `reason`: 拒否理由 (denied のみ)。

## 履歴上の tailnet 使用

- ブリッジを tailnet IP にバインドします: `~/.openclaw/openclaw.json` 内の
  `bridge.bind: "tailnet"` (履歴上のみ。`bridge.*` はもはや有効ではありません)。
- クライアントは MagicDNS 名または tailnet IP 経由で接続します。
- Bonjour はネットワークをまたぎません。必要に応じて手動のホスト/ポートまたは広域 DNS-SD
  を使用してください。

## バージョニング

ブリッジは**暗黙の v1** でした (min/max ネゴシエーションなし)。このセクションは
履歴参照専用です。現在のノード/オペレータークライアントは WebSocket
[Gateway Protocol](/ja-JP/gateway/protocol) を使用します。

## 関連

- [Gateway protocol](/ja-JP/gateway/protocol)
- [Nodes](/ja-JP/nodes)
