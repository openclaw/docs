---
read_when:
    - DMアクセス制御の設定
    - 新しいiOS/Androidノードのペアリング
    - OpenClawのセキュリティ態勢をレビューする
summary: 'ペアリングの概要: あなたにダイレクトメッセージを送れる相手 + 参加できるノードを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-05-04T02:21:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb27840f7c9ef55e7270cc29f813e6db90b240aa2180f30952eb9485f0f8874
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」は OpenClaw の明示的なアクセス承認ステップです。
これは 2 か所で使われます。

1. **DMペアリング**（bot と会話できるユーザー）
2. **Nodeペアリング**（Gateway ネットワークへの参加を許可されるデバイス/Node）

セキュリティコンテキスト: [セキュリティ](/ja-JP/gateway/security)

## 1) DMペアリング（受信チャットアクセス）

チャネルが DM ポリシー `pairing` で構成されている場合、不明な送信者には短いコードが届き、承認するまでそのメッセージは**処理されません**。

デフォルトの DM ポリシーは次に記載されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"` が公開になるのは、有効な DM 許可リストに `"*"` が含まれている場合だけです。
セットアップと検証では、公開オープン構成にこのワイルドカードが必要です。既存の
状態に具体的な `allowFrom` エントリを持つ `open` が含まれている場合でも、ランタイムは
それらの送信者だけを許可し、ペアリングストアの承認によって `open` アクセスが広がることはありません。

ペアリングコード:

- 8 文字、大文字、紛らわしい文字（`0O1I`）なし。
- **1 時間後に期限切れ**。bot は新しいリクエストが作成されたときだけペアリングメッセージを送信します（送信者ごとにおおよそ 1 時間に 1 回）。
- 保留中の DM ペアリングリクエストはデフォルトで**チャネルあたり 3 件**に制限されます。追加のリクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

コマンド所有者がまだ構成されていない場合、DM ペアリングコードを承認すると、
`commands.ownerAllowFrom` も、`telegram:123456789` のような承認済み送信者でブートストラップされます。
これにより、初回セットアップでは特権コマンドと exec
承認プロンプトのための明示的な所有者が設定されます。所有者が存在した後は、以後のペアリング承認は DM
アクセスだけを付与し、所有者を追加しません。

対応チャネル: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`。

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャネル、または DM とグループの両方の許可リストに適用する場合は、トップレベルの `accessGroups` を使用します。

静的グループは `type: "message.senders"` を使用し、チャネル許可リストから
`accessGroup:<name>` で参照します:

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

アクセスグループの詳細はここに記載されています: [アクセスグループ](/ja-JP/channels/access-groups)

### 状態の保存場所

`~/.openclaw/credentials/` 配下に保存されます:

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み許可リストストア:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - 非デフォルトアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントスコープの動作:

- 非デフォルトアカウントは、スコープ付き許可リストファイルだけを読み書きします。
- デフォルトアカウントは、チャネルスコープでスコープなしの許可リストファイルを使用します。

これらは機密として扱ってください（アシスタントへのアクセスを制御します）。

<Note>
ペアリング許可リストストアは DM アクセス用です。グループ認可は別です。
DM ペアリングコードを承認しても、その送信者がグループで
コマンドを実行したり bot を制御したりできるようには自動的になりません。初回所有者のブートストラップは
`commands.ownerAllowFrom` 内の別の構成状態であり、グループチャット配信は引き続き
チャネルのグループ許可リスト（たとえば `groupAllowFrom`、`groups`、またはチャネルに応じたグループ単位
やトピック単位のオーバーライド）に従います。
</Note>

## 2) Nodeデバイスペアリング（iOS/Android/macOS/ヘッドレスNode）

Node は `role: node` の**デバイス**として Gateway に接続します。Gateway は
承認が必要なデバイスペアリングリクエストを作成します。

### Telegram 経由でペアリングする（iOS に推奨）

`device-pair` Plugin を使用すると、初回のデバイスペアリングを Telegram だけで完結できます:

1. Telegram で bot にメッセージを送ります: `/pair`
2. bot は 2 つのメッセージで返信します。手順メッセージと、別の**セットアップコード**メッセージ（Telegram でコピー/貼り付けしやすい形式）です。
3. 電話で OpenClaw iOS アプリを開きます → 設定 → Gateway。
4. セットアップコードを貼り付けて接続します。
5. Telegram に戻ります: `/pair pending`（リクエスト ID、ロール、スコープを確認）、その後承認します。

セットアップコードは base64 エンコードされた JSON ペイロードで、次を含みます:

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクに使用される、短命の単一デバイス用ブートストラップトークン

そのブートストラップトークンには、組み込みのペアリングブートストラッププロファイルが含まれます:

- 引き渡される主要な `node` トークンは `scopes: []` のまま
- 引き渡されるすべての `operator` トークンは、ブートストラップ許可リストに制限されたまま:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- ブートストラップのスコープチェックはロール接頭辞付きであり、単一のフラットなスコーププールではありません:
  operator スコープエントリは operator リクエストだけを満たし、非 operator ロールは
  引き続き自身のロール接頭辞配下のスコープをリクエストする必要があります
- 以後のトークンローテーション/失効は、デバイスの承認済み
  ロール契約と呼び出し元セッションの operator スコープの両方によって制限されたままです

セットアップコードは有効な間、パスワードのように扱ってください。

### Nodeデバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

承認するペアリング済みデバイスセッションがペアリング専用スコープで
開かれていたために明示的な承認が拒否された場合、CLI は同じリクエストを
`operator.admin` で再試行します。これにより、既存の admin 対応ペアリング済みデバイスは、
`devices/paired.json` を手動編集せずに新しい
Control UI/ブラウザペアリングを復旧できます。Gateway は再試行された接続を引き続き検証します。
`operator.admin` で認証できないトークンはブロックされたままです。

同じデバイスが異なる認証詳細（たとえば異なる
ロール/スコープ/公開鍵）で再試行した場合、以前の保留リクエストは置き換えられ、新しい
`requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスが、密かにより広いアクセスを得ることはありません。より多くのスコープやより広いロールを要求して再接続した場合、OpenClaw は既存の承認をそのまま保持し、新しい保留中のアップグレードリクエストを作成します。承認する前に、`openclaw devices list` を使用して、現在承認されているアクセスと新しく要求されたアクセスを比較してください。
</Note>

### 任意の信頼済みCIDRによるNode自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に制御された Node ネットワークでは、
明示的な CIDR または正確な IP による初回 Node 自動承認をオプトインできます:

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

これは、要求スコープのない新規の `role: node` ペアリングリクエストにのみ適用されます。
Operator、ブラウザ、Control UI、WebChat クライアントは引き続き手動承認が必要です。
ロール、スコープ、メタデータ、公開鍵の変更も引き続き手動承認が必要です。

### Nodeペアリング状態のストレージ

`~/.openclaw/devices/` 配下に保存されます:

- `pending.json`（短命。保留中のリクエストは期限切れになります）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注記

- レガシーの `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|remove|rename`）は、
  Gateway 所有の別個のペアリングストアです。WS Node には引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールの永続的な信頼できる情報源です。アクティブな
  デバイストークンは、その承認済みロールセットに制限されたままです。承認済みロール外の stray token エントリが
  新しいアクセスを作成することはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全な更新（doctor を実行）: [更新](/ja-JP/install/updating)
- チャネル構成:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - BlueBubbles（iMessage）: [BlueBubbles](/ja-JP/channels/bluebubbles)
  - iMessage（レガシー）: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
