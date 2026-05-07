---
read_when:
    - DMアクセス制御の設定
    - 新しい iOS/Android Node のペアリング
    - OpenClaw のセキュリティ態勢をレビューする
summary: 'ペアリングの概要: あなたにDMできる相手と参加できるノードを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-05-07T01:50:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1b9082342209b7d37a790ecc61330f74131b070d0560cb71fb533379d9016a
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」は OpenClaw の明示的なアクセス承認ステップです。
これは次の 2 か所で使用されます。

1. **DM ペアリング**（bot と会話できるユーザー）
2. **Node ペアリング**（Gateway ネットワークへの参加を許可されるデバイス/Node）

セキュリティコンテキスト: [セキュリティ](/ja-JP/gateway/security)

## 1) DM ペアリング（受信チャットアクセス）

チャンネルが DM ポリシー `pairing` で設定されている場合、未知の送信者には短いコードが送られ、承認するまでそのメッセージは**処理されません**。

デフォルトの DM ポリシーは次に記載されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"` が公開状態になるのは、有効な DM 許可リストに `"*"` が含まれる場合だけです。
公開オープン設定では、セットアップと検証にこのワイルドカードが必要です。既存の
状態に具体的な `allowFrom` エントリを持つ `open` が含まれる場合、ランタイムは引き続き
それらの送信者だけを許可し、ペアリングストアの承認によって `open` アクセスが広がることはありません。

ペアリングコード:

- 8 文字、大文字、紛らわしい文字（`0O1I`）なし。
- **1 時間後に期限切れ**になります。bot は新しいリクエストが作成された場合にのみペアリングメッセージを送信します（送信者ごとにおおよそ 1 時間に 1 回）。
- 保留中の DM ペアリングリクエストは、デフォルトで**チャンネルごとに 3 件**までです。追加のリクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

コマンド所有者がまだ設定されていない場合、DM ペアリングコードの承認によって
`commands.ownerAllowFrom` も承認済み送信者（例: `telegram:123456789`）へブートストラップされます。
これにより、初回セットアップ時に特権コマンドと exec
承認プロンプトの明示的な所有者が設定されます。所有者が存在した後のペアリング承認は DM
アクセスのみを付与し、所有者は追加されません。

対応チャンネル: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャンネル、または DM とグループ許可リストの両方に適用する場合は、トップレベルの `accessGroups` を使用します。

静的グループは `type: "message.senders"` を使用し、チャンネル許可リストから
`accessGroup:<name>` で参照します。

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

アカウントスコープの動作:

- 非デフォルトアカウントは、そのスコープ付き許可リストファイルだけを読み書きします。
- デフォルトアカウントは、チャンネルスコープのスコープなし許可リストファイルを使用します。

これらは機密情報として扱ってください（アシスタントへのアクセスを制御します）。

<Note>
ペアリング許可リストストアは DM アクセス用です。グループ認可は別です。
DM ペアリングコードを承認しても、その送信者がグループコマンドを実行したり、
グループ内で bot を制御したりできるようには自動的になりません。初回所有者のブートストラップは
`commands.ownerAllowFrom` の別の設定状態であり、グループチャット配信は引き続き
チャンネルのグループ許可リスト（たとえば `groupAllowFrom`, `groups`、またはチャンネルに応じたグループ単位
またはトピック単位の上書き）に従います。
</Note>

## 2) Node デバイスペアリング（iOS/Android/macOS/ヘッドレス Node）

Node は `role: node` を持つ**デバイス**として Gateway に接続します。Gateway は
承認が必要なデバイスペアリングリクエストを作成します。

### Telegram 経由でペアリングする（iOS に推奨）

`device-pair` Plugin を使用すると、初回のデバイスペアリングを Telegram だけで完了できます。

1. Telegram で bot にメッセージを送信します: `/pair`
2. bot は 2 つのメッセージを返信します。手順メッセージと、別の**セットアップコード**メッセージ（Telegram でコピー/貼り付けしやすい形式）です。
3. 電話で OpenClaw iOS アプリを開きます → Settings → Gateway。
4. QR コードをスキャンするか、セットアップコードを貼り付けて接続します。
5. Telegram に戻ります: `/pair pending`（リクエスト ID、ロール、スコープを確認）、その後承認します。

セットアップコードは、次を含む base64 エンコードされた JSON ペイロードです。

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクに使用される、有効期間の短い単一デバイス用ブートストラップトークン

そのブートストラップトークンには、組み込みのペアリングブートストラッププロファイルが含まれます。

- 引き渡される主要な `node` トークンは `scopes: []` のままです
- 引き渡される任意の `operator` トークンは、ブートストラップ許可リストに制限されたままです:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- ブートストラップスコープチェックはロール接頭辞付きであり、単一のフラットなスコーププールではありません:
  operator スコープエントリは operator リクエストだけを満たし、非 operator ロールは
  引き続き自分のロール接頭辞の下でスコープをリクエストする必要があります
- 以降のトークンローテーション/失効は、デバイスの承認済み
  ロール契約と呼び出し元セッションの operator スコープの両方に引き続き制限されます

セットアップコードは、有効な間はパスワードのように扱ってください。

Tailscale、公開、またはその他のリモートモバイルペアリングでは、Tailscale Serve/Funnel
または別の `wss://` Gateway URL を使用してください。平文の `ws://` セットアップコードが受け入れられるのは、
loopback、プライベート LAN アドレス、`.local` Bonjour ホスト、Android
エミュレータホストのみです。Tailnet CGNAT アドレス、`.ts.net` 名、公開ホストは、QR/セットアップコード発行前に引き続きフェイルクローズします。

### Node デバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

明示的な承認が、承認を行うペアリング済みデバイスセッションがペアリング専用スコープで開かれていたため拒否された場合、
CLI は同じリクエストを
`operator.admin` で再試行します。これにより、既存の admin 対応ペアリング済みデバイスは、
`devices/paired.json` を手で編集せずに新しい
Control UI/ブラウザペアリングを回復できます。Gateway は再試行された接続を引き続き検証します。
`operator.admin` で認証できないトークンはブロックされたままです。

同じデバイスが異なる認証詳細（たとえば異なる
ロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しい
`requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスが、暗黙的により広いアクセスを得ることはありません。より多くのスコープまたはより広いロールを要求して再接続した場合、OpenClaw は既存の承認をそのまま維持し、新しい保留中アップグレードリクエストを作成します。承認する前に、`openclaw devices list` を使用して、現在承認されているアクセスと新たに要求されたアクセスを比較してください。
</Note>

### 任意の信頼済み CIDR Node 自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に制御された Node ネットワークでは、
明示的な CIDR または正確な IP による初回 Node 自動承認をオプトインできます。

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

これは、リクエストされたスコープがない新規の `role: node` ペアリングリクエストにのみ適用されます。
Operator、ブラウザ、Control UI、WebChat クライアントは引き続き手動承認が必要です。
ロール、スコープ、メタデータ、公開鍵の変更も引き続き手動承認が必要です。

### Node ペアリング状態の保存

`~/.openclaw/devices/` の下に保存されます。

- `pending.json`（短命。保留中のリクエストは期限切れになります）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注記

- 従来の `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|remove|rename`）は、
  Gateway 所有の別のペアリングストアです。WS Node には引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールの永続的な信頼できる情報源です。アクティブな
  デバイストークンは、その承認済みロールセットに制限されたままです。承認済みロールの外にある余分なトークンエントリが、
  新しいアクセスを作成することはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全な更新（doctor を実行）: [更新](/ja-JP/install/updating)
- チャンネル設定:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - iMessage: [iMessage](/ja-JP/channels/imessage)
  - BlueBubbles（従来の iMessage ブリッジ）: [BlueBubbles](/ja-JP/channels/bluebubbles)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
