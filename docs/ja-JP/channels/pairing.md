---
read_when:
    - DM アクセス制御の設定
    - 新しい iOS/Android Node をペアリングする
    - OpenClawのセキュリティ態勢をレビューする
summary: 'ペアリングの概要: あなたにダイレクトメッセージを送れる相手 + 参加できるノードを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-04-30T05:00:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfdcaf831aedb122ea85200518b8dc1c6f42eff365444dee6c4b740050b1ce26
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」はOpenClawの明示的なアクセス承認ステップです。
2か所で使用されます。

1. **DMペアリング**（ボットと話すことを許可される相手）
2. **Nodeペアリング**（どのデバイス/NodeがGatewayネットワークへの参加を許可されるか）

セキュリティの文脈: [セキュリティ](/ja-JP/gateway/security)

## 1) DMペアリング（受信チャットアクセス）

チャネルがDMポリシー`pairing`で構成されている場合、不明な送信者には短いコードが送られ、承認するまでそのメッセージは**処理されません**。

デフォルトのDMポリシーは次に記載されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"`は、有効なDM許可リストに`"*"`が含まれる場合にのみ公開状態になります。
公開オープン構成のセットアップと検証には、そのワイルドカードが必要です。既存の
状態に具体的な`allowFrom`エントリ付きの`open`が含まれる場合、ランタイムは引き続き
それらの送信者だけを許可し、ペアリングストアの承認によって`open`アクセスが広がることはありません。

ペアリングコード:

- 8文字、大文字、紛らわしい文字（`0O1I`）なし。
- **1時間後に期限切れ**になります。ボットは新しいリクエストが作成されたときだけペアリングメッセージを送信します（送信者ごとにおおよそ1時間に1回）。
- 保留中のDMペアリングリクエストは、デフォルトで**チャネルごとに3件**までに制限されます。追加リクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

コマンド所有者がまだ構成されていない場合、DMペアリングコードを承認すると、
承認された送信者（例: `telegram:123456789`）で`commands.ownerAllowFrom`もブートストラップされます。
これにより、初回セットアップで特権コマンドとexec承認プロンプト用の明示的な所有者が与えられます。
所有者が存在した後は、以降のペアリング承認はDMアクセスのみを付与し、
所有者は追加されません。

対応チャネル: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 状態の保存場所

`~/.openclaw/credentials/`配下に保存されます。

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み許可リストストア:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - 非デフォルトアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントスコープの挙動:

- 非デフォルトアカウントは、スコープ付きの許可リストファイルのみを読み書きします。
- デフォルトアカウントは、チャネルスコープのスコープなし許可リストファイルを使用します。

これらは機密情報として扱ってください（アシスタントへのアクセスを制御します）。

<Note>
ペアリング許可リストストアはDMアクセス用です。グループ承認は別です。
DMペアリングコードを承認しても、その送信者がグループ内でグループ
コマンドを実行したりボットを制御したりできるようにはなりません。初回所有者のブートストラップは
`commands.ownerAllowFrom`内の別の構成状態であり、グループチャット配信は引き続き
チャネルのグループ許可リスト（たとえば`groupAllowFrom`、`groups`、またはチャネルに応じたグループ単位
やトピック単位のオーバーライド）に従います。
</Note>

## 2) Nodeデバイスペアリング（iOS/Android/macOS/ヘッドレスNode）

Nodeは`role: node`を持つ**デバイス**としてGatewayに接続します。Gatewayは
承認が必要なデバイスペアリングリクエストを作成します。

### Telegram経由でペアリングする（iOSに推奨）

`device-pair` Pluginを使用する場合、初回デバイスペアリングをすべてTelegramから行えます。

1. Telegramでボットにメッセージを送信します: `/pair`
2. ボットは2つのメッセージを返信します。手順メッセージと、別の**セットアップコード**メッセージです（Telegramでコピー/貼り付けしやすい形式）。
3. スマートフォンでOpenClaw iOSアプリを開きます → Settings → Gateway。
4. セットアップコードを貼り付けて接続します。
5. Telegramに戻ります: `/pair pending`（リクエストID、ロール、スコープを確認）してから承認します。

セットアップコードは、次を含むbase64エンコードされたJSONペイロードです。

- `url`: Gateway WebSocket URL（`ws://...`または`wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクに使用される、短命の単一デバイス用ブートストラップトークン

そのブートストラップトークンには、組み込みのペアリングブートストラッププロファイルが含まれます。

- 主要な引き渡し済み`node`トークンは`scopes: []`のままです
- 引き渡し済みの`operator`トークンは、ブートストラップ許可リストに制限されたままです:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- ブートストラップスコープチェックはロール接頭辞付きであり、単一のフラットなスコーププールではありません:
  operatorスコープエントリはoperatorリクエストのみを満たし、operator以外のロールは
  引き続き自身のロール接頭辞配下のスコープをリクエストする必要があります
- 後続のトークンローテーション/失効は、デバイスの承認済み
  ロール契約と呼び出し元セッションのoperatorスコープの両方に制限され続けます

セットアップコードは、有効な間はパスワードのように扱ってください。

### Nodeデバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

同じデバイスが異なる認証詳細（たとえば異なる
ロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しい
`requestId`が作成されます。

<Note>
すでにペアリング済みのデバイスに、暗黙的に広いアクセス権が付与されることはありません。より多くのスコープや広いロールを要求して再接続した場合、OpenClawは既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認する前に、`openclaw devices list`を使用して現在承認されているアクセス権と新しくリクエストされたアクセス権を比較してください。
</Note>

### 任意の信頼済みCIDRによるNode自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に制御されたNodeネットワークでは、
明示的なCIDRまたは正確なIPを指定して、初回Node自動承認にオプトインできます。

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

これは、リクエストされたスコープがない新規の`role: node`ペアリングリクエストにのみ適用されます。
Operator、ブラウザ、Control UI、WebChatクライアントでは引き続き手動承認が必要です。
ロール、スコープ、メタデータ、公開鍵の変更にも引き続き手動承認が必要です。

### Nodeペアリング状態の保存

`~/.openclaw/devices/`配下に保存されます。

- `pending.json`（短命。保留中リクエストは期限切れになります）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注記

- レガシーの`node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|remove|rename`）は、
  Gateway所有の別のペアリングストアです。WS Nodeには引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールに関する永続的な信頼できる情報源です。アクティブな
  デバイストークンは、その承認済みロールセットに制限され続けます。承認済みロール外の
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
