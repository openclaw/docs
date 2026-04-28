---
read_when:
    - DM アクセス制御の設定
    - 新しい iOS/Android Node をペアリングする
    - OpenClaw のセキュリティ体制を確認する
summary: 'ペアリングの概要: あなたに DM できる相手と参加できる Node を承認する'
title: ペアリング
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:24:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d28547baacce638347ce0062e3bc4f194704eb369b4ca45f7158d5e16cee93
    source_path: channels/pairing.md
    workflow: 15
---

「ペアリング」は OpenClaw の明示的な**所有者承認**ステップです。  
これは 2 つの場所で使われます。

1. **DM ペアリング**（誰がボットと会話できるか）
2. **Node ペアリング**（どのデバイス/Node が Gateway ネットワークに参加できるか）

セキュリティコンテキスト: [Security](/ja-JP/gateway/security)

## 1) DM ペアリング（受信チャットアクセス）

チャネルが DM ポリシー `pairing` で設定されている場合、未確認の送信者には短いコードが返され、あなたが承認するまでそのメッセージは**処理されません**。

デフォルトの DM ポリシーは次に記載されています: [Security](/ja-JP/gateway/security)

ペアリングコード:

- 8 文字、大文字、紛らわしい文字なし（`0O1I`）。
- **1 時間で期限切れ**になります。ボットがペアリングメッセージを送るのは、新しいリクエストが作成されたときだけです（送信者ごとにおおむね 1 時間に 1 回）。
- 保留中の DM ペアリングリクエストは、デフォルトで**チャネルごとに 3 件**までです。1 件が期限切れになるか承認されるまで、追加のリクエストは無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

対応チャネル: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 状態の保存場所

`~/.openclaw/credentials/` 配下に保存されます。

- 保留中リクエスト: `<channel>-pairing.json`
- 承認済み allowlist ストア:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - 非デフォルトアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントスコープの挙動:

- 非デフォルトアカウントは、自身のスコープ付き allowlist ファイルのみを読み書きします。
- デフォルトアカウントは、チャネルスコープのスコープなし allowlist ファイルを使用します。

これらは機密情報として扱ってください（あなたのアシスタントへのアクセスを制御します）。

重要: このストアは DM アクセス用です。グループ認可は別です。  
DM ペアリングコードを承認しても、その送信者が自動的にグループコマンドを実行したり、グループ内でボットを操作できるようにはなりません。グループアクセスについては、チャネルの明示的なグループ allowlist（たとえば `groupAllowFrom`、`groups`、またはチャネルごとのグループ/トピック単位のオーバーライド）を設定してください。

## 2) Node デバイスのペアリング（iOS/Android/macOS/headless Node）

Node は `role: node` を持つ**デバイス**として Gateway に接続します。Gateway は承認が必要なデバイスペアリングリクエストを作成します。

### Telegram でペアリングする（iOS に推奨）

`device-pair` Plugin を使っている場合、初回デバイスペアリングは Telegram だけで完結できます。

1. Telegram でボットに `/pair` を送信します
2. ボットは 2 つのメッセージを返します。説明メッセージと、別個の**セットアップコード**メッセージです（Telegram でコピー/貼り付けしやすくなっています）。
3. 電話で OpenClaw iOS アプリを開き、Settings → Gateway に進みます。
4. セットアップコードを貼り付けて接続します。
5. Telegram に戻り、`/pair pending` を実行して（リクエスト ID、role、scopes を確認し）、承認します。

セットアップコードは、次を含む JSON ペイロードを base64 エンコードしたものです。

- `url`: Gateway の WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクで使われる、短命の単一デバイス用 bootstrap token

この bootstrap token は、組み込みのペアリング bootstrap プロファイルを持ちます。

- 最初に引き渡される `node` token は `scopes: []` のままです
- 引き渡される `operator` token は、bootstrap allowlist に制限されたままです:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap のスコープチェックは、1 つのフラットなスコーププールではなく role 接頭辞付きです:
  operator のスコープ項目は operator リクエストだけを満たし、operator 以外の role も引き続き自分自身の role 接頭辞の下で scopes を要求する必要があります
- 後続の token ローテーション/失効も、デバイスの承認済み role 契約と、呼び出し元セッションの operator scopes の両方によって制限されたままです

有効な間は、このセットアップコードをパスワードのように扱ってください。

### Node デバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

同じデバイスが異なる認証詳細（たとえば異なる role/scopes/public key）で再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。

重要: すでにペアリング済みのデバイスが、黙ってより広いアクセス権を得ることはありません。より多くの scopes や、より広い role を要求して再接続した場合、OpenClaw は既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認する前に、`openclaw devices list` を使って、現在承認されているアクセスと新たに要求されたアクセスを比較してください。

### オプションの trusted-CIDR Node 自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に管理された Node ネットワークでは、明示的な CIDR または正確な IP による初回 Node 自動承認を有効にできます。

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

これは、要求された scopes を持たない新規の `role: node` ペアリングリクエストにのみ適用されます。operator、browser、Control UI、WebChat クライアントは引き続き手動承認が必要です。role、scope、metadata、public-key の変更も引き続き手動承認が必要です。

### Node ペアリング状態の保存

`~/.openclaw/devices/` 配下に保存されます。

- `pending.json`（短命。保留中リクエストは期限切れになります）
- `paired.json`（ペアリング済みデバイス + token）

### 注意

- 旧来の `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|rename`）は、別の Gateway 管理ペアリングストアです。WS Node では引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済み role の永続的な信頼できる情報源です。アクティブなデバイス token は、その承認済み role セットに引き続き制限されます。承認済み role の外にある stray token エントリが、新しいアクセスを作り出すことはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [Security](/ja-JP/gateway/security)
- 安全な更新（doctor を実行）: [Updating](/ja-JP/install/updating)
- チャネル設定:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/ja-JP/channels/bluebubbles)
  - iMessage（旧版）: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
