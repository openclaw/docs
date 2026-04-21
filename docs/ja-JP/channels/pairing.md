---
read_when:
    - DMアクセス制御の設定
    - 新しいiOS/Android Nodeのペアリング
    - OpenClawのセキュリティ体制の確認
summary: 'ペアリングの概要: あなたにDMできる相手と、参加できるNodeを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-04-21T04:43:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4161629ead02dc0bdcd283cc125fe6579a579e03740127f4feb22dfe344bd028
    source_path: channels/pairing.md
    workflow: 15
---

# ペアリング

「ペアリング」は、OpenClawの明示的な**所有者承認**ステップです。  
これは次の2か所で使われます。

1. **DMペアリング**（誰がボットと会話できるか）
2. **Nodeペアリング**（どのデバイス/NodeがGatewayネットワークに参加できるか）

セキュリティの背景: [Security](/ja-JP/gateway/security)

## 1) DMペアリング（受信チャットアクセス）

チャネルがDMポリシー `pairing` で設定されている場合、未確認の送信者には短いコードが送られ、あなたが承認するまでそのメッセージは**処理されません**。

デフォルトのDMポリシーは次に記載されています: [Security](/ja-JP/gateway/security)

ペアリングコード:

- 8文字、大文字、紛らわしい文字なし（`0O1I`）。
- **1時間後に期限切れ**になります。ボットがペアリングメッセージを送るのは新しいリクエストが作成されたときだけです（送信者ごとにおおむね1時間に1回）。
- 保留中のDMペアリングリクエストは、デフォルトで**チャネルごとに3件**までに制限されます。1件が期限切れになるか承認されるまで、それ以降のリクエストは無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

対応チャネル: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`。

### 状態の保存場所

`~/.openclaw/credentials/` の下に保存されます:

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み許可リストの保存先:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - デフォルト以外のアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントスコープの動作:

- デフォルト以外のアカウントは、自身のスコープ付き許可リストファイルだけを読み書きします。
- デフォルトアカウントは、チャネル単位のスコープなし許可リストファイルを使います。

これらは機微情報として扱ってください（あなたのアシスタントへのアクセスを制御するためです）。

重要: この保存先はDMアクセス用です。グループの認可は別です。  
DMペアリングコードを承認しても、その送信者がグループコマンドを実行したり、グループ内でボットを操作したりできるようには自動ではなりません。グループアクセスについては、チャネルの明示的なグループ許可リスト（たとえば `groupAllowFrom`、`groups`、またはチャネルに応じたグループ単位/トピック単位のオーバーライド）を設定してください。

## 2) Nodeデバイスペアリング（iOS/Android/macOS/ヘッドレスNode）

Nodeは `role: node` を持つ**デバイス**としてGatewayに接続します。Gatewayは承認が必要なデバイスペアリングリクエストを作成します。

### Telegram経由でペアリングする（iOSに推奨）

`device-pair` Pluginを使う場合、初回のデバイスペアリングはTelegramだけで完結できます。

1. Telegramでボットに `/pair` を送信します
2. ボットは2つのメッセージを返します。1つは案内メッセージ、もう1つは別送の**セットアップコード**メッセージです（Telegramでコピー/貼り付けしやすい形式です）。
3. スマートフォンでOpenClaw iOSアプリを開き、Settings → Gatewayに進みます。
4. セットアップコードを貼り付けて接続します。
5. Telegramに戻って `/pair pending` を実行し、`requestId`、ロール、スコープを確認してから承認します。

セットアップコードは、次を含むbase64エンコード済みJSONペイロードです。

- `url`: GatewayのWebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクで使われる、短時間有効な単一デバイス用ブートストラップトークン

そのブートストラップトークンには、組み込みのペアリング用ブートストラッププロファイルが含まれます。

- 引き渡される主要な `node` トークンは `scopes: []` のままです
- 引き渡される `operator` トークンは、ブートストラップ許可リストに制限されたままです:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- ブートストラップのスコープチェックは、単一のフラットなスコーププールではなくロール接頭辞付きです:
  operatorスコープのエントリはoperatorリクエストだけを満たし、operator以外のロールは引き続き自身のロール接頭辞の下でスコープを要求する必要があります

セットアップコードが有効な間は、パスワードと同様に扱ってください。

### Nodeデバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

同じデバイスが異なる認証詳細（たとえば異なるロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。

重要: すでにペアリング済みのデバイスが、気づかないうちにより広いアクセス権を得ることはありません。より多いスコープやより広いロールを要求して再接続した場合、OpenClawは既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認する前に、`openclaw devices list` を使って現在承認されているアクセス権と、新たに要求されているアクセス権を比較してください。

### Nodeペアリング状態の保存先

`~/.openclaw/devices/` の下に保存されます:

- `pending.json`（短期間のみ有効。保留中リクエストは期限切れになります）
- `paired.json`（ペアリング済みデバイスとトークン）

### 注記

- 旧来の `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|rename`）は、別のGateway所有ペアリングストアです。WS Nodeでも引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールの永続的な正本です。アクティブなデバイストークンは、その承認済みロールセットの範囲内に制限されたままです。承認済みロールの外にある迷い込んだトークンエントリが、新しいアクセスを生み出すことはありません。

## 関連ドキュメント

- セキュリティモデルとプロンプトインジェクション: [Security](/ja-JP/gateway/security)
- 安全な更新（doctorを実行）: [Updating](/ja-JP/install/updating)
- チャネル設定:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - BlueBubbles（iMessage）: [BlueBubbles](/ja-JP/channels/bluebubbles)
  - iMessage（レガシー）: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
