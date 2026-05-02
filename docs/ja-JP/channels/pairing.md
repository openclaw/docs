---
read_when:
    - DMアクセス制御の設定
    - 新しい iOS/Android ノードのペアリング
    - OpenClaw のセキュリティ態勢をレビューする
summary: 'ペアリングの概要: 誰があなたにDMを送れるか + どのノードが参加できるかを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-05-02T04:49:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb68d87c0e1dfe7c9a6a6d9415f4c63625755fb43a2e22a1d1374ff0a63e49c4
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」は OpenClaw の明示的なアクセス承認ステップです。
これは 2 つの場所で使われます。

1. **DM ペアリング** (ボットとの会話を許可される相手)
2. **Node ペアリング** (Gateway ネットワークへの参加を許可されるデバイス/Node)

セキュリティコンテキスト: [セキュリティ](/ja-JP/gateway/security)

## 1) DM ペアリング (インバウンドチャットアクセス)

チャンネルが DM ポリシー `pairing` で設定されている場合、不明な送信者には短いコードが届き、承認するまでそのメッセージは**処理されません**。

デフォルトの DM ポリシーは次に記載されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"` が公開状態になるのは、有効な DM 許可リストに `"*"` が含まれる場合だけです。
公開オープン設定では、セットアップと検証にこのワイルドカードが必要です。既存の
状態に具体的な `allowFrom` エントリ付きの `open` が含まれる場合、ランタイムは引き続き
その送信者だけを許可し、ペアリングストアの承認によって `open` アクセスが広がることはありません。

ペアリングコード:

- 8 文字、大文字、紛らわしい文字 (`0O1I`) なし。
- **1 時間後に期限切れ**。ボットは新しいリクエストが作成されたときだけペアリングメッセージを送信します (送信者ごとにおおよそ 1 時間に 1 回)。
- 保留中の DM ペアリングリクエストは、デフォルトで**チャンネルあたり 3 件**に制限されます。追加のリクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

コマンド所有者がまだ設定されていない場合、DM ペアリングコードを承認すると、
`commands.ownerAllowFrom` も `telegram:123456789` のような承認済み送信者でブートストラップされます。
これにより、初回セットアップでは特権コマンドと exec
承認プロンプトの明示的な所有者が設定されます。所有者が存在した後は、以降のペアリング承認は DM
アクセスのみを付与し、所有者を追加しません。

対応チャンネル: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャンネル、または DM とグループ許可リストの両方に適用する必要がある場合は、トップレベルの `accessGroups` を使います。

静的グループは `type: "message.senders"` を使い、チャンネル許可リストから
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

`~/.openclaw/credentials/` 配下に保存されます。

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み許可リストストア:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - 非デフォルトアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントスコープの動作:

- 非デフォルトアカウントは、スコープ付きの許可リストファイルのみを読み書きします。
- デフォルトアカウントは、チャンネルスコープのスコープなし許可リストファイルを使います。

これらは機密として扱ってください (アシスタントへのアクセスを制御します)。

<Note>
ペアリング許可リストストアは DM アクセス用です。グループ承認は別です。
DM ペアリングコードを承認しても、その送信者がグループで
コマンドを実行したりボットを制御したりできるようにはなりません。初回所有者のブートストラップは `commands.ownerAllowFrom` の別の設定
状態であり、グループチャット配信は引き続きチャンネルの
グループ許可リストに従います (たとえば `groupAllowFrom`, `groups`, またはチャンネルに応じたグループ単位
またはトピック単位のオーバーライド)。
</Note>

## 2) Node デバイスペアリング (iOS/Android/macOS/ヘッドレス Node)

Node は `role: node` を持つ**デバイス**として Gateway に接続します。Gateway
は承認が必要なデバイスペアリングリクエストを作成します。

### Telegram 経由でペアリングする (iOS で推奨)

`device-pair` plugin を使う場合、初回デバイスペアリングを Telegram だけで完了できます。

1. Telegram でボットにメッセージを送ります: `/pair`
2. ボットは 2 通のメッセージを返信します。手順メッセージと、別の**セットアップコード**メッセージです (Telegram でコピー/貼り付けしやすい形式)。
3. スマートフォンで OpenClaw iOS アプリを開きます → Settings → Gateway。
4. セットアップコードを貼り付けて接続します。
5. Telegram に戻ります: `/pair pending` (リクエスト ID、ロール、スコープを確認)、その後承認します。

セットアップコードは base64 エンコードされた JSON ペイロードで、次を含みます。

- `url`: Gateway WebSocket URL (`ws://...` または `wss://...`)
- `bootstrapToken`: 初回ペアリングハンドシェイクに使う、短命の単一デバイス用ブートストラップトークン

そのブートストラップトークンには、組み込みのペアリングブートストラッププロファイルがあります。

- 引き渡されるプライマリ `node` トークンは `scopes: []` のままです
- 引き渡される `operator` トークンは、ブートストラップ許可リストに制限されたままです:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- ブートストラップスコープチェックはロールプレフィックス付きであり、単一のフラットなスコーププールではありません:
  operator スコープエントリは operator リクエストだけを満たし、非 operator ロールは
  それぞれ自身のロールプレフィックス配下でスコープをリクエストする必要があります
- 以降のトークンローテーション/失効は、デバイスの承認済み
  ロール契約と呼び出し元セッションの operator スコープの両方によって引き続き制限されます

セットアップコードは、有効な間はパスワードのように扱ってください。

### Node デバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

同じデバイスが異なる認証詳細 (たとえば異なる
ロール/スコープ/公開鍵) で再試行した場合、以前の保留中リクエストは置き換えられ、新しい
`requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスが、黙ってより広いアクセスを得ることはありません。より多くのスコープやより広いロールを要求して再接続した場合、OpenClaw は既存の承認をそのまま維持し、新しい保留中アップグレードリクエストを作成します。承認する前に `openclaw devices list` を使って、現在承認済みのアクセスと新しくリクエストされたアクセスを比較してください。
</Note>

### 任意の信頼済み CIDR Node 自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に制御された Node ネットワークでは、
明示的な CIDR または正確な IP で、初回 Node 自動承認をオプトインできます。

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

これは、リクエストされたスコープがない新規の `role: node` ペアリングリクエストにのみ適用されます。Operator、ブラウザ、Control UI、WebChat クライアントは引き続き手動承認が必要です。ロール、スコープ、メタデータ、公開鍵の変更も引き続き手動承認が必要です。

### Node ペアリング状態の保存

`~/.openclaw/devices/` 配下に保存されます。

- `pending.json` (短命。保留中のリクエストは期限切れになります)
- `paired.json` (ペアリング済みデバイス + トークン)

### 注記

- レガシーの `node.pair.*` API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) は、
  Gateway 所有の別のペアリングストアです。WS Node には引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールの永続的な信頼できる情報源です。アクティブな
  デバイストークンは、その承認済みロールセットに引き続き制限されます。承認済みロールの外にある迷い込んだトークンエントリが
  新しいアクセスを作成することはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全な更新 (doctor を実行): [更新](/ja-JP/install/updating)
- チャンネル設定:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/ja-JP/channels/bluebubbles)
  - iMessage (レガシー): [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
