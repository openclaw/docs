---
read_when:
    - DM アクセス制御の設定
    - 新しい iOS/Android ノードのペアリング
    - OpenClaw のセキュリティ態勢をレビューする
summary: 'ペアリングの概要: あなたにDMできる相手 + 参加できるノードを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-05-10T19:23:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e26bfd98d9de3b834b737be1aa70eb2272267b3cb9cf6d66b030629111a12fc
    source_path: channels/pairing.md
    workflow: 16
---

「Pairing」は、OpenClawの明示的なアクセス承認ステップです。
これは次の2か所で使用されます。

1. **DMペアリング** (ボットとの会話を許可される人)
2. **Nodeペアリング** (Gatewayネットワークへの参加を許可されるデバイス/Node)

セキュリティコンテキスト: [セキュリティ](/ja-JP/gateway/security)

## 1) DMペアリング (受信チャットアクセス)

チャンネルがDMポリシー `pairing` で設定されている場合、未知の送信者には短いコードが送られ、承認するまでそのメッセージは**処理されません**。

デフォルトのDMポリシーは次に記載されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"` が公開状態になるのは、有効なDM許可リストに `"*"` が含まれている場合だけです。
公開オープン設定では、セットアップと検証にそのワイルドカードが必要です。既存の状態に具体的な `allowFrom` エントリ付きの `open` が含まれている場合でも、ランタイムはそれらの送信者だけを受け入れ、ペアリングストアの承認によって `open` アクセスが広がることはありません。

ペアリングコード:

- 8文字、大文字、紛らわしい文字 (`0O1I`) なし。
- **1時間後に期限切れ**。ボットは新しいリクエストが作成されたときだけペアリングメッセージを送信します (送信者ごとにおおよそ1時間に1回)。
- 保留中のDMペアリングリクエストは、デフォルトで**チャンネルごとに3件**までに制限されます。追加のリクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

コマンド所有者がまだ設定されていない場合、DMペアリングコードを承認すると、承認された送信者 (例: `telegram:123456789`) に対して `commands.ownerAllowFrom` もブートストラップされます。
これにより、初回セットアップで特権コマンドとexec承認プロンプトのための明示的な所有者が得られます。所有者が存在した後は、以降のペアリング承認はDMアクセスだけを付与し、所有者は追加されません。

対応チャンネル: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャンネル、またはDMとグループ許可リストの両方に適用する場合は、トップレベルの `accessGroups` を使用します。

静的グループは `type: "message.senders"` を使用し、チャンネル許可リストから `accessGroup:<name>` で参照されます。

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

アクセスグループの詳細はこちらに記載されています: [アクセスグループ](/ja-JP/channels/access-groups)

### 状態の保存場所

`~/.openclaw/credentials/` の下に保存されます。

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み許可リストストア:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - 非デフォルトアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントスコープの挙動:

- 非デフォルトアカウントは、スコープ付きの許可リストファイルだけを読み書きします。
- デフォルトアカウントは、チャンネルスコープのスコープなし許可リストファイルを使用します。

これらは機密として扱ってください (アシスタントへのアクセスを制御します)。

<Note>
ペアリング許可リストストアはDMアクセス用です。グループ認可は別です。
DMペアリングコードを承認しても、その送信者がグループコマンドを実行したり、グループ内でボットを制御したりできるようには自動的になりません。初回所有者のブートストラップは `commands.ownerAllowFrom` 内の別の設定状態であり、グループチャット配信は引き続きチャンネルのグループ許可リスト (たとえば `groupAllowFrom`, `groups`, またはチャンネルに応じたグループ単位/トピック単位のオーバーライド) に従います。
</Note>

## 2) Nodeデバイスペアリング (iOS/Android/macOS/ヘッドレスNode)

Nodeは `role: node` を持つ**デバイス**としてGatewayに接続します。Gatewayは承認が必要なデバイスペアリングリクエストを作成します。

### Telegram経由でペアリングする (iOSに推奨)

`device-pair` Pluginを使用する場合、初回のデバイスペアリングをすべてTelegramから実行できます。

1. Telegramでボットにメッセージを送信します: `/pair`
2. ボットは2つのメッセージで返信します。手順メッセージと、別の**セットアップコード**メッセージです (Telegramでコピー/貼り付けしやすい形式)。
3. 電話でOpenClaw iOSアプリを開きます → Settings → Gateway。
4. QRコードをスキャンするか、セットアップコードを貼り付けて接続します。
5. Telegramに戻ります: `/pair pending` (リクエストID、ロール、スコープを確認)、その後承認します。

セットアップコードは、次を含むbase64エンコードされたJSONペイロードです。

- `url`: Gateway WebSocket URL (`ws://...` または `wss://...`)
- `bootstrapToken`: 初回ペアリングハンドシェイクで使用される、短命の単一デバイス用ブートストラップトークン

そのブートストラップトークンには、組み込みのペアリングブートストラッププロファイルが含まれます。

- 引き渡されるプライマリの `node` トークンは `scopes: []` のままです
- 引き渡される `operator` トークンは、ブートストラップ許可リストに制限されたままです:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- ブートストラップのスコープチェックはロール接頭辞付きであり、単一のフラットなスコーププールではありません:
  operatorスコープエントリはoperatorリクエストだけを満たし、operator以外のロールは引き続き自身のロール接頭辞配下のスコープを要求する必要があります
- その後のトークンローテーション/失効は、デバイスの承認済みロール契約と呼び出し元セッションのoperatorスコープの両方によって引き続き制限されます

有効な間は、セットアップコードをパスワードのように扱ってください。

Tailscale、公開、またはその他のリモートモバイルペアリングでは、Tailscale Serve/Funnelまたは別の `wss://` Gateway URLを使用します。平文の `ws://` セットアップコードは、ループバック、プライベートLANアドレス、`.local` Bonjourホスト、Androidエミュレーターホストに対してのみ受け入れられます。Tailnet CGNATアドレス、`.ts.net` 名、公開ホストは、QR/セットアップコード発行前に引き続きフェイルクローズします。

### Nodeデバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

明示的な承認が拒否される理由が、承認しているペアリング済みデバイスセッションがペアリング専用スコープで開かれていたためである場合、CLIは同じリクエストを `operator.admin` で再試行します。これにより、既存の管理可能なペアリング済みデバイスは、`devices/paired.json` を手で編集せずに新しいControl UI/ブラウザーペアリングを回復できます。Gatewayは再試行された接続を引き続き検証します。`operator.admin` で認証できないトークンはブロックされたままです。

同じデバイスが異なる認証詳細 (たとえば異なるロール/スコープ/公開鍵) で再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスが、黙ってより広いアクセスを得ることはありません。より多くのスコープやより広いロールを要求して再接続した場合、OpenClawは既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認する前に `openclaw devices list` を使用して、現在承認されているアクセスと新しく要求されたアクセスを比較してください。
</Note>

### 任意の信頼済みCIDRによるNode自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に管理されたNodeネットワークでは、明示的なCIDRまたは正確なIPを使って、初回Node自動承認にオプトインできます。

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

これは、要求スコープのない新規の `role: node` ペアリングリクエストにだけ適用されます。Operator、ブラウザー、Control UI、WebChatクライアントは引き続き手動承認が必要です。ロール、スコープ、メタデータ、公開鍵の変更も引き続き手動承認が必要です。

### Nodeペアリング状態の保存

`~/.openclaw/devices/` の下に保存されます。

- `pending.json` (短命。保留中のリクエストは期限切れになります)
- `paired.json` (ペアリング済みデバイス + トークン)

### 注記

- レガシーの `node.pair.*` API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) は、Gateway所有の別のペアリングストアです。WS Nodeには引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールに関する永続的な信頼できる情報源です。アクティブなデバイストークンは、その承認済みロールセットに制限されたままです。承認済みロール外の余分なトークンエントリが新しいアクセスを作成することはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全な更新 (doctorを実行): [更新](/ja-JP/install/updating)
- チャンネル設定:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - iMessage: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
