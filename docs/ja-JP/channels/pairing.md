---
read_when:
    - DM アクセス制御の設定
    - 新しい iOS/Android ノードのペアリング
    - OpenClaw のセキュリティ体制をレビューする
summary: 'ペアリング概要: DMできる相手と参加できるノードを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-06-27T10:40:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92870489b62aeec710f49ec92908f4b83c7d9ee2ce34174b42e283839748e549
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」は、OpenClaw の明示的なアクセス承認ステップです。
これは次の2箇所で使用されます。

1. **DM ペアリング**（bot と会話できるユーザー）
2. **Node ペアリング**（Gateway ネットワークへの参加を許可されるデバイス/ノード）

セキュリティコンテキスト: [セキュリティ](/ja-JP/gateway/security)

## 1) DM ペアリング（受信チャットアクセス）

チャンネルが DM ポリシー `pairing` で設定されている場合、不明な送信者には短いコードが送られ、承認するまでそのメッセージは**処理されません**。

デフォルトの DM ポリシーは次に記載されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"` が公開状態になるのは、有効な DM 許可リストに `"*"` が含まれる場合だけです。
公開 open 設定では、セットアップと検証にこのワイルドカードが必要です。既存の状態に
具体的な `allowFrom` エントリを持つ `open` が含まれている場合でも、ランタイムが受け入れるのは
それらの送信者だけであり、ペアリングストアの承認によって `open` アクセスが広がることはありません。

ペアリングコード:

- 8文字、大文字、曖昧な文字（`0O1I`）なし。
- **1時間後に期限切れ**。bot は新しいリクエストが作成されたときだけペアリングメッセージを送信します（送信者ごとにおおむね1時間に1回）。
- 保留中の DM ペアリングリクエストは、デフォルトで**チャンネルごとに3件**に制限されます。追加のリクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

コマンドオーナーがまだ設定されていない場合、DM ペアリングコードを承認すると、
承認された送信者（例: `telegram:123456789`）で `commands.ownerAllowFrom` もブートストラップされます。
これにより、初回セットアップでは特権コマンドと exec 承認プロンプトの明示的なオーナーが設定されます。
オーナーが存在した後は、以降のペアリング承認は DM アクセスだけを付与し、オーナーは追加しません。

対応チャンネル: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャンネル、または DM とグループの両方の許可リストに適用する場合は、
トップレベルの `accessGroups` を使用します。

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

`~/.openclaw/credentials/` 配下に保存されます。

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
グループ内で bot を制御したりできるようには自動的になりません。初回オーナーのブートストラップは
`commands.ownerAllowFrom` 内の別の設定状態であり、グループチャット配信は引き続き
チャンネルのグループ許可リスト（例: `groupAllowFrom`、`groups`、またはチャンネルに応じたグループ単位
またはトピック単位のオーバーライド）に従います。
</Note>

## 2) Node デバイスペアリング（iOS/Android/macOS/ヘッドレス Node）

Node は `role: node` を持つ**デバイス**として Gateway に接続します。Gateway は、
承認が必要なデバイスペアリングリクエストを作成します。

### Telegram 経由でペアリングする（iOS 推奨）

`device-pair` Plugin を使用する場合、初回デバイスペアリングは Telegram だけで完了できます。

1. Telegram で bot にメッセージを送ります: `/pair`
2. bot は2つのメッセージを返します。手順メッセージと、別の**セットアップコード**メッセージです（Telegram でコピー/貼り付けしやすい形式）。
3. スマートフォンで OpenClaw iOS アプリを開きます → Settings → Gateway。
4. QR コードをスキャンするか、セットアップコードを貼り付けて接続します。
5. Telegram に戻ります: `/pair pending`（リクエスト ID、ロール、スコープを確認）してから承認します。

セットアップコードは base64 エンコードされた JSON ペイロードで、次を含みます。

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクに使用される、短命の単一デバイス用ブートストラップトークン

このブートストラップトークンには、組み込みのペアリングブートストラッププロファイルが含まれます。

- 組み込みセットアッププロファイルが許可するのは、新しい QR/セットアップコードのベースラインのみです:
  `node` と、範囲が限定された `operator` ハンドオフ
- ハンドオフされた `node` トークンは `scopes: []` のままです
- ハンドオフされた `operator` トークンは、`operator.approvals`、
  `operator.read`、`operator.write` に制限されます
- `operator.admin` と `operator.pairing` は QR/セットアップコードの
  ブートストラップでは付与されません。別途承認済みの operator ペアリングまたはトークンフローが必要です
- 以降のトークンローテーション/失効は、デバイスの承認済み
  ロール契約と呼び出し元セッションの operator スコープの両方によって引き続き制限されます

セットアップコードは、有効な間はパスワードと同じように扱ってください。

Tailscale、公開、またはその他のリモートモバイルペアリングでは、Tailscale Serve/Funnel
または別の `wss://` Gateway URL を使用します。平文の `ws://` セットアップコードは、
ループバック、プライベート LAN アドレス、`.local` Bonjour ホスト、Android
エミュレータホストに対してのみ受け入れられます。Tailnet CGNAT アドレス、`.ts.net` 名、公開ホストは、
QR/セットアップコード発行前に引き続き fail closed になります。

### Node デバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

明示的な承認が拒否された理由が、承認側のペアリング済みデバイスセッションが
ペアリング専用スコープで開かれていたことにある場合、CLI は同じリクエストを
`operator.admin` で再試行します。これにより、既存の admin 対応ペアリング済みデバイスは、
`devices/paired.json` を手動編集せずに新しい Control UI/ブラウザペアリングを復旧できます。
Gateway は再試行された接続も引き続き検証します。`operator.admin` で認証できないトークンは
ブロックされたままです。

同じデバイスが異なる認証詳細（たとえば異なるロール/スコープ/公開鍵）で再試行した場合、
以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスが、暗黙的により広いアクセスを得ることはありません。より多くのスコープや広いロールを要求して再接続した場合、OpenClaw は既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認する前に、`openclaw devices list` を使用して、現在承認されているアクセスと新しく要求されたアクセスを比較してください。
</Note>

### 任意の信頼済み CIDR Node 自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に管理された Node ネットワークでは、
明示的な CIDR または正確な IP による初回 Node 自動承認にオプトインできます。

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

これは、要求スコープがない新しい `role: node` ペアリングリクエストにのみ適用されます。
Operator、ブラウザ、Control UI、WebChat クライアントでは引き続き手動承認が必要です。
ロール、スコープ、メタデータ、公開鍵の変更にも引き続き手動承認が必要です。

### Node ペアリング状態ストレージ

`~/.openclaw/devices/` 配下に保存されます。

- `pending.json`（短命。保留中のリクエストは期限切れになります）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注記

- レガシーの `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|remove|rename`）は、
  Gateway 所有の別個のペアリングストアです。WS Node には引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールの永続的な信頼できる情報源です。アクティブな
  デバイストークンは、その承認済みロールセットに制限されたままです。承認済みロールの外にある
  迷い込んだトークンエントリによって、新しいアクセスが作成されることはありません。

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
