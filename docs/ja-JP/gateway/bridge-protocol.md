---
read_when:
    - Nodeクライアント（iOS/Android/macOSのNodeモード）を構築またはデバッグしている場合
    - ペアリングまたはブリッジ認証の失敗を調査している場合
    - gatewayが公開するNodeインターフェースを監査している場合
summary: '履歴ブリッジプロトコル（レガシーNode）: TCP JSONL、ペアリング、スコープ付きRPC'
title: ブリッジプロトコル
x-i18n:
    generated_at: "2026-04-24T04:55:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# ブリッジプロトコル（レガシーNodeトランスポート）

<Warning>
TCPブリッジは**削除されました**。現在のOpenClawビルドにはブリッジリスナーは含まれておらず、`bridge.*`設定キーもスキーマから削除されています。このページは履歴参照専用として保持されています。すべてのNode/オペレータークライアントには[Gateway Protocol](/ja-JP/gateway/protocol)を使用してください。
</Warning>

## なぜ存在していたか

- **セキュリティ境界**: ブリッジは、gateway API全体ではなく、限定された許可リストのみを公開します。
- **ペアリング + Nodeアイデンティティ**: Node受け入れはgatewayが管理し、Nodeごとのトークンに結び付けられています。
- **発見UX**: NodeはLAN上でBonjour経由でgatewayを発見するか、tailnet上で直接接続できます。
- **Loopback WS**: SSH経由でトンネルしない限り、完全なWS control planeはローカルのままです。

## トランスポート

- TCP、1行につき1つのJSONオブジェクト（JSONL）。
- オプションのTLS（`bridge.tls.enabled`がtrueの場合）。
- 履歴上のデフォルトリスナーポートは`18790`でした（現在のビルドではTCPブリッジは起動しません）。

TLSが有効な場合、discovery TXTレコードには、非シークレットのヒントとして`bridgeTls=1`および`bridgeTlsSha256`が含まれます。Bonjour/mDNS TXTレコードは認証されないことに注意してください。クライアントは、明示的なユーザー意図またはその他の帯域外検証なしに、広告されたフィンガープリントを権威あるピンとして扱ってはなりません。

## ハンドシェイク + ペアリング

1. クライアントは、Nodeメタデータ + トークン（すでにペアリング済みの場合）を含む`hello`を送信します。
2. ペアリングされていない場合、gatewayは`error`（`NOT_PAIRED`/`UNAUTHORIZED`）を返します。
3. クライアントは`pair-request`を送信します。
4. gatewayは承認を待ち、その後`pair-ok`と`hello-ok`を送信します。

履歴上、`hello-ok`は`serverName`を返し、`canvasHostUrl`を含む場合もありました。

## フレーム

クライアント → Gateway:

- `req` / `res`: スコープ付きgateway RPC（chat、sessions、config、health、voicewake、skills.bins）
- `event`: Nodeシグナル（音声transcript、agent request、chat subscribe、exec lifecycle）

Gateway → クライアント:

- `invoke` / `invoke-res`: Nodeコマンド（`canvas.*`、`camera.*`、`screen.record`、`location.get`、`sms.send`）
- `event`: 購読済みセッションのチャット更新
- `ping` / `pong`: keepalive

レガシーの許可リスト強制は`src/gateway/server-bridge.ts`にありました（現在は削除済み）。

## Execライフサイクルイベント

Nodeは、system.runアクティビティを表面化するために`exec.finished`または`exec.denied`イベントを送出できます。
これらはgateway内でシステムイベントにマッピングされます。（レガシーNodeは`exec.started`を送出する場合もあります。）

ペイロードフィールド（特記ない限りすべて省略可能）:

- `sessionKey`（必須）: システムイベントを受け取るエージェントセッション。
- `runId`: グループ化用の一意なexec ID。
- `command`: 生の、または整形済みのコマンド文字列。
- `exitCode`、`timedOut`、`success`、`output`: 完了詳細（finishedのみ）。
- `reason`: 拒否理由（deniedのみ）。

## 履歴上のtailnet利用

- ブリッジをtailnet IPにbindするには、`~/.openclaw/openclaw.json`で`bridge.bind: "tailnet"`を設定していました（履歴上のみ。`bridge.*`は現在無効です）。
- クライアントはMagicDNS名またはtailnet IP経由で接続していました。
- Bonjourはネットワークをまたがないため、必要に応じて手動のhost/portまたは広域DNS‑SDを使用していました。

## バージョニング

ブリッジは**暗黙のv1**でした（min/maxネゴシエーションなし）。このセクションは
履歴参照専用です。現在のNode/オペレータークライアントはWebSocketの
[Gateway Protocol](/ja-JP/gateway/protocol)を使用します。

## 関連

- [Gateway protocol](/ja-JP/gateway/protocol)
- [Nodes](/ja-JP/nodes)
