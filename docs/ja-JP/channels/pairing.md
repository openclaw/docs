---
read_when:
    - DMアクセス制御の設定
    - 新しい iOS/Android ノードのペアリング
    - OpenClaw セキュリティ態勢を確認する
summary: 'ペアリングの概要: 自分にダイレクトメッセージを送れる相手と、参加できるノードを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-05-06T17:52:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcee04ae47bf28caa76c5f6e7218e8b1b24f9ee70bc1b7b65d3f8859797a4645
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」は OpenClaw の明示的なアクセス承認ステップです。
これは 2 つの場所で使われます。

1. **DM ペアリング**（誰がボットと会話できるか）
2. **Node ペアリング**（どのデバイス/Node が Gateway ネットワークに参加できるか）

セキュリティコンテキスト: [セキュリティ](/ja-JP/gateway/security)

## 1) DM ペアリング（受信チャットアクセス）

チャンネルが DM ポリシー `pairing` で設定されている場合、未知の送信者には短いコードが渡され、承認するまでそのメッセージは**処理されません**。

デフォルトの DM ポリシーは次で説明されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"` が公開状態になるのは、有効な DM 許可リストに `"*"` が含まれる場合だけです。
公開 open 設定には、セットアップと検証でそのワイルドカードが必要です。既存の
状態に具体的な `allowFrom` エントリ付きの `open` が含まれている場合、ランタイムは引き続き
それらの送信者だけを許可し、ペアリングストアの承認によって `open` アクセスが広がることはありません。

ペアリングコード:

- 8 文字、大文字、紛らわしい文字（`0O1I`）なし。
- **1 時間後に期限切れ**になります。ボットは新しいリクエストが作成されたときだけペアリングメッセージを送信します（送信者ごとにおおよそ 1 時間に 1 回）。
- 保留中の DM ペアリングリクエストはデフォルトで**チャンネルごとに 3 件**までです。追加リクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

コマンド所有者がまだ設定されていない場合、DM ペアリングコードを承認すると、
`commands.ownerAllowFrom` も承認済み送信者（例: `telegram:123456789`）にブートストラップされます。
これにより、初回セットアップで特権コマンドと exec 承認プロンプトに対する明示的な所有者が与えられます。
所有者が存在した後は、以降のペアリング承認は DM アクセスだけを付与し、
所有者を追加することはありません。

対応チャンネル: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャンネル、または DM とグループの両方の許可リストに
適用する場合は、トップレベルの `accessGroups` を使います。

静的グループは `type: "message.senders"` を使い、チャンネル許可リストから
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

アクセスグループについて詳しくは、こちらで説明しています: [アクセスグループ](/ja-JP/channels/access-groups)

### 状態の保存場所

`~/.openclaw/credentials/` の下に保存されます。

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み許可リストストア:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - 非デフォルトアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントスコープの挙動:

- 非デフォルトアカウントは、スコープ付き許可リストファイルだけを読み書きします。
- デフォルトアカウントは、チャンネルスコープのスコープなし許可リストファイルを使います。

これらは慎重に扱ってください（アシスタントへのアクセスを制御します）。

<Note>
ペアリング許可リストストアは DM アクセス用です。グループ認可は別です。
DM ペアリングコードを承認しても、その送信者がグループでコマンドを実行したり、
グループ内でボットを制御したりできるようには自動的になりません。初回所有者のブートストラップは
`commands.ownerAllowFrom` の別の設定状態であり、グループチャット配信は引き続き
チャンネルのグループ許可リスト（たとえば `groupAllowFrom`、`groups`、またはチャンネルによっては
グループ単位やトピック単位のオーバーライド）に従います。
</Note>

## 2) Node デバイスペアリング（iOS/Android/macOS/ヘッドレス Node）

Node は `role: node` を持つ**デバイス**として Gateway に接続します。Gateway は
承認が必要なデバイスペアリングリクエストを作成します。

### Telegram 経由でペアリングする（iOS では推奨）

`device-pair` Plugin を使う場合、初回デバイスペアリングを Telegram だけで完了できます。

1. Telegram でボットにメッセージを送ります: `/pair`
2. ボットは 2 つのメッセージを返信します。手順メッセージと、別の**セットアップコード**メッセージです（Telegram でコピー/ペーストしやすい形式）。
3. 電話で OpenClaw iOS アプリを開きます → Settings → Gateway。
4. QR コードをスキャンするか、セットアップコードを貼り付けて接続します。
5. Telegram に戻ります: `/pair pending`（リクエスト ID、ロール、スコープを確認）してから承認します。

セットアップコードは、次を含む base64 エンコード済み JSON ペイロードです。

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクに使われる、短命の単一デバイス用ブートストラップトークン

そのブートストラップトークンには、組み込みのペアリングブートストラッププロファイルがあります。

- 引き渡される主要な `node` トークンは `scopes: []` のままです
- 引き渡される `operator` トークンは、ブートストラップ許可リストの範囲に制限されたままです:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- ブートストラップスコープチェックはロール接頭辞付きであり、単一のフラットなスコーププールではありません:
  operator スコープエントリは operator リクエストだけを満たし、operator 以外のロールは
  引き続き自身のロール接頭辞の下でスコープを要求する必要があります
- 以降のトークンローテーション/失効は、デバイスの承認済みロール契約と
  呼び出し元セッションの operator スコープの両方によって引き続き制限されます

セットアップコードは有効な間、パスワードのように扱ってください。

Tailscale、公開、またはその他のリモートモバイルペアリングでは、Tailscale Serve/Funnel
または別の `wss://` Gateway URL を使います。平文の `ws://` セットアップコードは、
loopback、プライベート LAN アドレス、`.local` Bonjour ホスト、Android
エミュレーターホストに対してのみ受け付けられます。Tailnet CGNAT アドレス、`.ts.net` 名、公開ホストは、
QR/セットアップコード発行前に引き続きフェイルクローズされます。

### Node デバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

承認するペアリング済みデバイスセッションがペアリング専用スコープで開かれていたために
明示的な承認が拒否された場合、CLI は同じリクエストを `operator.admin` で再試行します。
これにより、既存の admin 対応ペアリング済みデバイスは、`devices/paired.json` を手で編集せずに
新しい Control UI/ブラウザペアリングを復旧できます。Gateway は再試行された接続も引き続き検証します。
`operator.admin` で認証できないトークンはブロックされたままです。

同じデバイスが異なる認証詳細（たとえば異なるロール/スコープ/公開鍵）で再試行した場合、
以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスが、気付かないうちにより広いアクセスを得ることはありません。より多くのスコープやより広いロールを求めて再接続した場合、OpenClaw は既存の承認をそのまま維持し、新しい保留中アップグレードリクエストを作成します。承認する前に、`openclaw devices list` を使って現在承認されているアクセスと新しく要求されたアクセスを比較してください。
</Note>

### オプションの信頼済み CIDR Node 自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に制御された Node ネットワークでは、
明示的な CIDR または正確な IP を使って、初回 Node 自動承認にオプトインできます。

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

これは、要求スコープのない新しい `role: node` ペアリングリクエストにのみ適用されます。
Operator、ブラウザ、Control UI、WebChat クライアントでは引き続き手動承認が必要です。
ロール、スコープ、メタデータ、公開鍵の変更でも引き続き手動承認が必要です。

### Node ペアリング状態の保存

`~/.openclaw/devices/` の下に保存されます。

- `pending.json`（短命。保留中リクエストは期限切れになります）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注記

- レガシーの `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|remove|rename`）は、
  Gateway 所有の別のペアリングストアです。WS Node には引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールに関する永続的な信頼できる情報源です。アクティブな
  デバイストークンはその承認済みロールセットに制限されたままです。承認済みロール外の余分なトークンエントリが
  新しいアクセスを作成することはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全な更新（doctor を実行）: [更新](/ja-JP/install/updating)
- チャンネル設定:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - BlueBubbles（iMessage）: [BlueBubbles](/ja-JP/channels/bluebubbles)
  - iMessage（レガシー）: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
