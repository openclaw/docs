---
read_when:
    - DM アクセス制御の設定
    - 新しい iOS/Android Node をペアリングする
    - OpenClaw のセキュリティ体制を確認する
summary: 'ペアリングの概要: あなたに DM できる相手と、参加できる Node を承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-04-24T04:47:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 373eaa02865995ada0c906df9bad4e8328f085a8bb3679b0a5820dc397130137
    source_path: channels/pairing.md
    workflow: 15
---

「ペアリング」は、OpenClaw における明示的な**オーナー承認**ステップです。
これは 2 つの場面で使われます。

1. **DM ペアリング**（誰がボットに話しかけられるか）
2. **Node ペアリング**（どのデバイス/Node が Gateway ネットワークに参加できるか）

セキュリティの文脈: [セキュリティ](/ja-JP/gateway/security)

## 1) DM ペアリング（受信チャットアクセス）

チャネルが DM ポリシー `pairing` で設定されている場合、不明な送信者には短いコードが送られ、そのメッセージはあなたが承認するまで**処理されません**。

デフォルトの DM ポリシーは次に記載されています: [セキュリティ](/ja-JP/gateway/security)

ペアリングコード:

- 8 文字、大文字、紛らわしい文字なし（`0O1I`）。
- **1 時間で期限切れ**になります。ボットがペアリングメッセージを送るのは、新しいリクエストが作成されたときだけです（送信者ごとにチャネルあたりおおむね 1 時間に 1 回）。
- 保留中の DM ペアリングリクエストは、デフォルトで**チャネルごとに 3 件**までに制限されます。1 件が期限切れになるか承認されるまで、追加のリクエストは無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

サポートされているチャネル: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 状態の保存場所

`~/.openclaw/credentials/` の下に保存されます。

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み許可リストストア:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - 非デフォルトアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントスコープの動作:

- 非デフォルトアカウントは、自身のスコープ付き許可リストファイルのみを読み書きします。
- デフォルトアカウントは、チャネルスコープのスコープなし許可リストファイルを使います。

これらは機密情報として扱ってください（あなたのアシスタントへのアクセスを制御するためです）。

重要: このストアは DM アクセス用です。グループ認可は別です。
DM ペアリングコードを承認しても、その送信者が自動的にグループコマンドを実行したり、グループ内でボットを操作できるようになったりはしません。グループアクセスについては、チャネルの明示的なグループ許可リスト（たとえば `groupAllowFrom`、`groups`、またはチャネルに応じたグループごと/トピックごとのオーバーライド）を設定してください。

## 2) Node デバイスのペアリング（iOS/Android/macOS/ヘッドレス Node）

Node は `role: node` を持つ**デバイス**として Gateway に接続します。Gateway は承認が必要なデバイスペアリングリクエストを作成します。

### Telegram 経由でペアリングする（iOS に推奨）

`device-pair` Plugin を使っている場合、初回のデバイスペアリングは完全に Telegram から行えます。

1. Telegram でボットに `/pair` と送信します
2. ボットは 2 つのメッセージで返信します。説明メッセージと、別個の**セットアップコード**メッセージです（Telegram で簡単にコピー/貼り付けできます）。
3. スマートフォンで OpenClaw iOS アプリ → Settings → Gateway を開きます。
4. セットアップコードを貼り付けて接続します。
5. Telegram に戻り、`/pair pending` を実行して（request ID、role、scopes を確認し）、承認します。

セットアップコードは、次を含む base64 エンコード済み JSON ペイロードです。

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクに使われる、短命の単一デバイス用ブートストラップトークン

このブートストラップトークンには、組み込みのペアリングブートストラッププロファイルが含まれます。

- 引き渡される主要な `node` トークンは `scopes: []` のままです
- 引き渡される `operator` トークンは常に次のブートストラップ許可リストに制限されたままです:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- ブートストラップのスコープチェックは、1 つのフラットなスコーププールではなく role プレフィックス付きです:
  operator のスコープエントリーは operator リクエストのみを満たし、operator 以外の role は引き続き自身の role プレフィックス配下でスコープを要求する必要があります

セットアップコードは有効な間、パスワードのように扱ってください。

### Node デバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

同じデバイスが異なる認証詳細（たとえば異なる role/scopes/public key）で再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。

重要: すでにペアリング済みのデバイスが、より広いアクセスを黙って得ることはありません。より多くの scopes や、より広い role を要求して再接続した場合、OpenClaw は既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認する前に、`openclaw devices list` を使って現在承認されているアクセスと新たに要求されたアクセスを比較してください。

### Node ペアリング状態の保存場所

`~/.openclaw/devices/` の下に保存されます。

- `pending.json`（短命。保留中リクエストは期限切れになります）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注意

- 旧来の `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|rename`）は、Gateway が所有する別個のペアリングストアです。WS Node でも引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済み role の永続的な信頼できる情報源です。アクティブなデバイストークンは、その承認済み role セットに制限されたままです。承認済み role の外にある不正なトークンエントリーがあっても、新たなアクセスは作成されません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全な更新（doctor を実行）: [更新](/ja-JP/install/updating)
- チャネル設定:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - BlueBubbles（iMessage）: [BlueBubbles](/ja-JP/channels/bluebubbles)
  - iMessage（legacy）: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
