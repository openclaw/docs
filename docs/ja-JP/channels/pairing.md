---
read_when:
    - ダイレクトメッセージのアクセス制御の設定
    - 新しい iOS/Android ノードのペアリング
    - OpenClawのセキュリティ態勢をレビューする
summary: 'ペアリング概要: あなたにDMできる相手 + 参加できるノードを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-05-04T09:37:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2bce4cfba7708b0003f2ffeacada8bc1849cc301f28178b499a9a67bddcf36d
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」はOpenClawの明示的なアクセス承認ステップです。
これは2か所で使われます。

1. **DMペアリング**（botとやり取りできるユーザー）
2. **Nodeペアリング**（Gatewayネットワークへの参加を許可されるデバイス/Node）

セキュリティコンテキスト: [セキュリティ](/ja-JP/gateway/security)

## 1) DMペアリング（受信チャットアクセス）

チャネルがDMポリシー `pairing` で構成されている場合、不明な送信者には短いコードが送られ、承認するまでそのメッセージは**処理されません**。

デフォルトのDMポリシーは次で文書化されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"` が公開状態になるのは、有効なDM許可リストに `"*"` が含まれる場合だけです。
公開オープン構成のセットアップと検証には、このワイルドカードが必要です。既存の
状態に具体的な `allowFrom` エントリ付きの `open` が含まれている場合、ランタイムは
それらの送信者だけを許可し、ペアリングストアの承認によって `open` アクセスが広がることはありません。

ペアリングコード:

- 8文字、大文字、紛らわしい文字（`0O1I`）なし。
- **1時間後に期限切れ**。botは新しいリクエストが作成されたときだけペアリングメッセージを送信します（送信者ごとにおおよそ1時間に1回）。
- 保留中のDMペアリングリクエストは、デフォルトで**チャネルごとに3件**までに制限されます。追加のリクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

コマンド所有者がまだ構成されていない場合、DMペアリングコードの承認によって
`commands.ownerAllowFrom` も、`telegram:123456789` のような承認済み送信者へブートストラップされます。
これにより、初回セットアップで特権コマンドとexec承認プロンプトの明示的な所有者が設定されます。
所有者が存在した後のペアリング承認はDMアクセスだけを付与し、
所有者を追加することはありません。

対応チャネル: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャネル、またはDMとグループ許可リストの両方に
適用する必要がある場合は、トップレベルの `accessGroups` を使用します。

静的グループは `type: "message.senders"` を使用し、チャネル許可リストから
`accessGroup:<name>` で参照されます。

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

アクセスグループの詳細はこちらで文書化されています: [アクセスグループ](/ja-JP/channels/access-groups)

### 状態の保存場所

`~/.openclaw/credentials/` 配下に保存されます。

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み許可リストストア:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - 非デフォルトアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントスコープの動作:

- 非デフォルトアカウントは、スコープ付き許可リストファイルだけを読み書きします。
- デフォルトアカウントは、チャネルスコープのスコープなし許可リストファイルを使用します。

これらは機密情報として扱ってください（アシスタントへのアクセスを制御します）。

<Note>
ペアリング許可リストストアはDMアクセス用です。グループ認可は別です。
DMペアリングコードを承認しても、その送信者がグループ
コマンドを実行したり、グループ内のbotを制御したりできるようにはなりません。初回所有者のブートストラップは
`commands.ownerAllowFrom` 内の別の構成状態であり、グループチャット配信は引き続き
チャネルのグループ許可リストに従います（たとえば `groupAllowFrom`、`groups`、またはチャネルに応じたグループ単位
もしくはトピック単位のオーバーライド）。
</Note>

## 2) Nodeデバイスペアリング（iOS/Android/macOS/headless Node）

Nodeは `role: node` を持つ**デバイス**としてGatewayに接続します。Gatewayは
承認が必要なデバイスペアリングリクエストを作成します。

### Telegramでペアリングする（iOSに推奨）

`device-pair` Pluginを使用している場合、初回デバイスペアリングをTelegramだけで完了できます。

1. Telegramでbotにメッセージを送ります: `/pair`
2. botは2つのメッセージを返します。手順メッセージと、別の**セットアップコード**メッセージです（Telegramでコピー/貼り付けしやすい形式）。
3. スマートフォンでOpenClaw iOSアプリを開く → Settings → Gateway。
4. QRコードをスキャンするか、セットアップコードを貼り付けて接続します。
5. Telegramに戻ります: `/pair pending`（リクエストID、ロール、スコープを確認）し、承認します。

セットアップコードはbase64エンコードされたJSONペイロードで、次を含みます。

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクに使用される、有効期間の短い単一デバイス用ブートストラップトークン

そのブートストラップトークンには、組み込みのペアリングブートストラッププロファイルが含まれます。

- 引き渡されるプライマリの `node` トークンは `scopes: []` のままです
- 引き渡される `operator` トークンは、ブートストラップ許可リスト内に制限されたままです:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- ブートストラップスコープチェックはロールプレフィックス付きであり、1つのフラットなスコーププールではありません:
  operatorスコープエントリはoperatorリクエストだけを満たし、非operatorロールは
  それぞれのロールプレフィックス配下のスコープを引き続きリクエストする必要があります
- その後のトークンローテーション/取り消しは、デバイスの承認済み
  ロール契約と呼び出し元セッションのoperatorスコープの両方によって引き続き制限されます

セットアップコードは、有効な間はパスワードのように扱ってください。

Tailscale、公開、またはその他の非ループバックのモバイルペアリングでは、Tailscale
Serve/Funnelまたは別の `wss://` Gateway URLを使用してください。直接の非ループバック `ws://` セットアップ
URLは、QR/セットアップコードの発行前に拒否されます。平文の `ws://` セットアップコードは
ループバックURLに限定されます。プライベートネットワークの `ws://` クライアントでは、リモート
Gatewayガイドで説明されている明示的な
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ブレークグラスが引き続き必要です。

### Nodeデバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

承認するペアリング済みデバイスセッションがペアリング専用スコープで開かれていたために
明示的な承認が拒否された場合、CLIは同じリクエストを
`operator.admin` で再試行します。これにより、既存のadmin対応ペアリング済みデバイスは
`devices/paired.json` を手で編集せずに、新しいControl UI/ブラウザのペアリングを復旧できます。
Gatewayは再試行された接続も検証します。`operator.admin` で認証できない
トークンは引き続きブロックされます。

同じデバイスが異なる認証詳細（たとえば異なる
ロール/スコープ/公開鍵）で再試行した場合、以前の保留リクエストは置き換えられ、新しい
`requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスが、黙ってより広いアクセスを得ることはありません。より多くのスコープやより広いロールを要求して再接続した場合、OpenClawは既存の承認をそのまま保持し、新しい保留中のアップグレードリクエストを作成します。承認する前に `openclaw devices list` を使用して、現在承認済みのアクセスと新しく要求されたアクセスを比較してください。
</Note>

### 任意の信頼済みCIDRによるNode自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に制御されたNodeネットワークでは、
明示的なCIDRまたは正確なIPを指定して、初回Node自動承認を有効にできます。

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
Operator、ブラウザ、Control UI、WebChatクライアントは引き続き手動
承認が必要です。ロール、スコープ、メタデータ、公開鍵の変更にも引き続き手動
承認が必要です。

### Nodeペアリング状態の保存場所

`~/.openclaw/devices/` 配下に保存されます。

- `pending.json`（有効期間は短い。保留中のリクエストは期限切れになります）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注記

- レガシーの `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|remove|rename`）は、
  別のGateway所有のペアリングストアです。WS Nodeには引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールの永続的な信頼できる情報源です。アクティブな
  デバイストークンは、その承認済みロールセットに制限されたままです。承認済みロールの外にある
  余分なトークンエントリが新しいアクセスを作成することはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全な更新（doctorを実行）: [更新](/ja-JP/install/updating)
- チャネル構成:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - BlueBubbles（iMessage）: [BlueBubbles](/ja-JP/channels/bluebubbles)
  - iMessage（レガシー）: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
