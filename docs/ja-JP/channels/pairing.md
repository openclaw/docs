---
read_when:
    - DM アクセス制御の設定
    - 新しい iOS/Android ノードをペアリングする
    - OpenClaw のセキュリティ体制のレビュー
summary: 'ペアリング概要: DMを許可する相手 + 参加できるノード'
title: ペアリング
x-i18n:
    generated_at: "2026-07-03T13:15:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c62f42116b71467576b2c1e005fa2e606a3d0f40cbf7b92fc4a7dd47c8f0568e
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」は、OpenClaw の明示的なアクセス承認ステップです。
これは 2 つの場所で使われます。

1. **DM ペアリング**（誰がボットと会話できるか）
2. **Node ペアリング**（どのデバイス/ノードが Gateway ネットワークに参加できるか）

セキュリティコンテキスト: [セキュリティ](/ja-JP/gateway/security)

## 1) DM ペアリング（受信チャットアクセス）

チャンネルが DM ポリシー `pairing` で設定されている場合、不明な送信者には短いコードが発行され、承認するまでそのメッセージは**処理されません**。

デフォルトの DM ポリシーは次で文書化されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"` が公開状態になるのは、有効な DM allowlist に `"*"` が含まれる場合のみです。
セットアップと検証では、公開オープン設定にこのワイルドカードが必要です。既存の
状態に concrete な `allowFrom` エントリ付きの `open` が含まれる場合でも、ランタイムは
それらの送信者だけを許可し、ペアリングストアの承認によって `open` アクセスが広がることはありません。

ペアリングコード:

- 8 文字、大文字、紛らわしい文字なし（`0O1I`）。
- **1 時間後に期限切れ**になります。ボットがペアリングメッセージを送信するのは、新しいリクエストが作成されたときだけです（送信者ごとにおおよそ 1 時間に 1 回）。
- 保留中の DM ペアリングリクエストは、デフォルトで**チャンネルごとに 3 件**に制限されます。追加のリクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

コマンド所有者がまだ設定されていない場合、DM ペアリングコードの承認により、
`commands.ownerAllowFrom` も承認済み送信者（例: `telegram:123456789`）でブートストラップされます。
これにより、初回セットアップに特権コマンドと exec 承認プロンプト用の明示的な所有者が与えられます。
所有者が存在した後は、以降のペアリング承認は DM アクセスだけを付与し、
所有者を追加しません。

対応チャンネル: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`。

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャンネル、または DM allowlist とグループ allowlist の両方に適用する場合は、トップレベルの `accessGroups` を使います。

静的グループは `type: "message.senders"` を使い、チャンネル allowlist から
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

アクセスグループの詳細はこちらに文書化されています: [アクセスグループ](/ja-JP/channels/access-groups)

### 状態の保存場所

`~/.openclaw/credentials/` の下に保存されます。

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み allowlist ストア:
  - デフォルトアカウント: `<channel>-allowFrom.json`
  - 非デフォルトアカウント: `<channel>-<accountId>-allowFrom.json`

アカウントスコープの動作:

- 非デフォルトアカウントは、スコープ付き allowlist ファイルのみを読み書きします。
- デフォルトアカウントは、チャンネルスコープのスコープなし allowlist ファイルを使います。

これらは機密として扱ってください（アシスタントへのアクセスを制御します）。

<Note>
ペアリング allowlist ストアは DM アクセス用です。グループ認可は別です。
DM ペアリングコードを承認しても、その送信者がグループでコマンドを実行したり、
グループ内でボットを制御したりできるようには自動的になりません。最初の所有者のブートストラップは、
`commands.ownerAllowFrom` 内の別の設定状態であり、グループチャット配信は引き続き
チャンネルのグループ allowlist（例: `groupAllowFrom`, `groups`、またはチャンネルに応じたグループ単位
またはトピック単位のオーバーライド）に従います。
</Note>

## 2) Node デバイスペアリング（iOS/Android/macOS/ヘッドレスノード）

ノードは `role: node` の**デバイス**として Gateway に接続します。Gateway は
承認が必要なデバイスペアリングリクエストを作成します。

### Telegram でペアリングする（iOS に推奨）

`device-pair` Plugin を使う場合、初回のデバイスペアリングを Telegram だけで完了できます。

1. Telegram でボットにメッセージを送ります: `/pair`
2. ボットは 2 つのメッセージで返信します。手順メッセージと、別の**セットアップコード**メッセージです（Telegram でコピー/ペーストしやすい形式）。
3. 電話で OpenClaw iOS アプリを開きます → Settings → Gateway。
4. QR コードをスキャンするか、セットアップコードを貼り付けて接続します。
5. Telegram に戻ります: `/pair pending`（リクエスト ID、ロール、スコープを確認）、その後承認します。

セットアップコードは base64 エンコードされた JSON ペイロードで、次を含みます。

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクに使われる、短命の単一デバイス用ブートストラップトークン

このブートストラップトークンには、組み込みのペアリングブートストラッププロファイルが含まれます。

- 組み込みセットアッププロファイルが許可するのは、新規 QR/セットアップコードのベースラインのみです:
  `node` と、制限付きの `operator` 引き継ぎ
- 引き継がれた `node` トークンは `scopes: []` のままです
- 引き継がれた `operator` トークンは `operator.approvals`,
  `operator.read`, `operator.talk.secrets`, `operator.write` に制限されます
- `operator.admin` は QR/セットアップコードのブートストラップでは付与されません。別途承認済みの
  operator ペアリングまたはトークンフローが必要です
- 以降のトークンローテーション/失効は、デバイスの承認済みロール契約と
  呼び出し元セッションの operator スコープの両方によって引き続き制限されます

セットアップコードは、有効な間はパスワードのように扱ってください。

Tailscale、公開、またはその他のリモートモバイルペアリングでは、Tailscale Serve/Funnel
または別の `wss://` Gateway URL を使います。平文の `ws://` セットアップコードが受け入れられるのは、
loopback、プライベート LAN アドレス、`.local` Bonjour ホスト、Android
エミュレータホストのみです。Tailnet CGNAT アドレス、`.ts.net` 名、公開ホストは、
QR/セットアップコード発行前に引き続き fail closed になります。

### Node デバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

承認するペア済みデバイスセッションが pairing-only スコープで開かれていたために明示的な承認が拒否された場合、
CLI は同じリクエストを `operator.admin` で再試行します。これにより、既存の admin-capable なペア済みデバイスは、
`devices/paired.json` を手で編集せずに、新しい Control UI/ブラウザペアリングを復旧できます。
Gateway は再試行された接続も引き続き検証します。`operator.admin` で認証できないトークンは
ブロックされたままです。

同じデバイスが異なる認証詳細（たとえば異なるロール/スコープ/公開鍵）で再試行した場合、
以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスが、暗黙的により広いアクセスを得ることはありません。より多くのスコープやより広いロールを要求して再接続した場合、OpenClaw は既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認する前に `openclaw devices list` を使って、現在承認されているアクセスと新しく要求されたアクセスを比較してください。
</Note>

### 任意の信頼済み CIDR Node 自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に管理されたノードネットワークでは、
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

これは、リクエストされたスコープがない新規の `role: node` ペアリングリクエストにのみ適用されます。
Operator、ブラウザ、Control UI、WebChat クライアントは引き続き手動承認が必要です。
ロール、スコープ、メタデータ、公開鍵の変更も引き続き手動承認が必要です。

### Node ペアリング状態の保存

`~/.openclaw/devices/` の下に保存されます。

- `pending.json`（短命。保留中のリクエストは期限切れになります）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注記

- レガシーの `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|remove|rename`）は、
  Gateway 所有の別のペアリングストアです。WS ノードには引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールに関する永続的な信頼できる情報源です。アクティブな
  デバイストークンは、その承認済みロールセットに制限されたままです。承認済みロール外の
  迷い込んだトークンエントリが新しいアクセスを作成することはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全な更新（doctor を実行）: [更新](/ja-JP/install/updating)
- チャンネル設定:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - iMessage: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
