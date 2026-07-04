---
read_when:
    - DM アクセス制御の設定
    - 新しいiOS/Android Nodeをペアリングする
    - OpenClaw のセキュリティ体制をレビューする
summary: 'ペアリングの概要: DM できる相手と参加できるノードを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-07-04T17:47:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」は、OpenClaw の明示的なアクセス承認ステップです。
これは2か所で使われます。

1. **DM ペアリング**（bot と会話できる人）
2. **Node ペアリング**（gateway ネットワークへの参加を許可されるデバイス/Node）

セキュリティコンテキスト: [セキュリティ](/ja-JP/gateway/security)

## 1) DM ペアリング（受信チャットアクセス）

チャンネルが DM ポリシー `pairing` で設定されている場合、不明な送信者には短いコードが送られ、承認するまでそのメッセージは**処理されません**。

デフォルトの DM ポリシーは次に記載されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"` が公開状態になるのは、有効な DM 許可リストに `"*"` が含まれる場合だけです。
セットアップと検証では、公開 open 設定にこのワイルドカードが必要です。既存の
状態に具体的な `allowFrom` エントリ付きの `open` が含まれている場合でも、ランタイムが許可するのは
それらの送信者だけであり、ペアリングストアの承認によって `open` アクセスが広がることはありません。

ペアリングコード:

- 8文字、大文字、紛らわしい文字なし（`0O1I`）。
- **1時間後に期限切れ**。bot は新しいリクエストが作成されたときだけペアリングメッセージを送信します（送信者ごとにおおよそ1時間に1回）。
- 保留中の DM ペアリングリクエストは、デフォルトで**チャンネルごとに3件**に制限されます。追加のリクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

コマンド所有者がまだ設定されていない場合、DM ペアリングコードを承認すると、
`commands.ownerAllowFrom` も承認済み送信者（例: `telegram:123456789`）でブートストラップされます。
これにより、初回セットアップでは特権コマンドと exec 承認プロンプトに対する明示的な所有者が設定されます。
所有者が存在した後のペアリング承認は DM アクセスだけを付与し、所有者を追加することはありません。

対応チャンネル: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャンネル、または DM とグループの両方の許可リストに適用したい場合は、トップレベルの `accessGroups` を使います。

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

- 非デフォルトアカウントは、スコープ付き許可リストファイルだけを読み書きします。
- デフォルトアカウントは、チャンネルスコープの非スコープ許可リストファイルを使います。

これらは機密として扱ってください（アシスタントへのアクセスを制御します）。

<Note>
ペアリング許可リストストアは DM アクセス用です。グループ認可は別です。
DM ペアリングコードを承認しても、その送信者がグループコマンドを実行したり、
グループ内で bot を制御したりできるようには自動的になりません。初回所有者のブートストラップは
`commands.ownerAllowFrom` 内の別の設定状態であり、グループチャット配信は引き続き
チャンネルのグループ許可リスト（たとえば `groupAllowFrom`、`groups`、またはチャンネルに応じたグループ単位
やトピック単位のオーバーライド）に従います。
</Note>

## 2) Node デバイスペアリング（iOS/Android/macOS/ヘッドレス Node）

Node は `role: node` を持つ**デバイス**として Gateway に接続します。Gateway は
承認が必要なデバイスペアリングリクエストを作成します。

### Control UI からペアリングする（推奨）

`operator.admin` アクセスを持つ、すでに接続済みの Control UI セッションを使います。

1. Control UI を開き、**Node** を選択します。
2. **デバイス**で、**モバイルデバイスをペアリング**をクリックします。
3. スマートフォンで OpenClaw アプリを開きます → **設定** → **Gateway**。
4. QR コードをスキャンするかセットアップコードを貼り付けてから接続します。

公式の OpenClaw iOS および Android アプリは、それらの
セットアップコードメタデータが一致する場合、自動的に承認されます。**デバイス**に保留中のリクエストが表示される場合（
たとえば非公式クライアントやメタデータ不一致の場合）は、承認する前にそのロールと
スコープを確認してください。

現在の Control UI セッションに管理者アクセスがない場合、このボタンは無効になります。
その場合は、Gateway ホストから下記の CLI 承認フローを使ってください。

### Telegram 経由でペアリングする

`device-pair` Plugin を使う場合、初回デバイスペアリングを Telegram だけで完結できます。

1. Telegram で bot にメッセージを送信します: `/pair`
2. bot は2つのメッセージを返信します。手順メッセージと、別の**セットアップコード**メッセージです（Telegram でコピー/貼り付けしやすい形式）。
3. スマートフォンで OpenClaw iOS アプリを開きます → Settings → Gateway。
4. QR コードをスキャンするかセットアップコードを貼り付けて接続します。
5. 公式モバイルアプリは自動的に接続します。`/pair pending` に
   リクエストが表示される場合は、承認する前にそのロールとスコープを確認してください。

セットアップコードは base64 エンコードされた JSON ペイロードで、次を含みます。

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイクで使われる、有効期間の短い単一デバイス用ブートストラップトークン

そのブートストラップトークンには、組み込みのペアリングブートストラッププロファイルが含まれます。

- 組み込みセットアッププロファイルは、新しい QR/セットアップコードのベースラインだけを許可します:
  `node` と制限付きの `operator` 引き継ぎ
- 引き継がれた `node` トークンは `scopes: []` のままです
- 引き継がれた `operator` トークンは `operator.approvals`、
  `operator.read`、`operator.talk.secrets`、`operator.write` に制限されます
- `operator.admin` は QR/セットアップコードブートストラップでは付与されません。
  別途承認された operator ペアリングまたはトークンフローが必要です
- 以後のトークンローテーション/失効は、デバイスの承認済み
  ロール契約と呼び出し元セッションの operator スコープの両方によって引き続き制限されます

セットアップコードは、有効な間はパスワードと同じように扱ってください。

Tailscale、公開、またはその他のリモートモバイルペアリングでは、Tailscale Serve/Funnel
または別の `wss://` Gateway URL を使います。平文の `ws://` セットアップコードは、
ループバック、プライベート LAN アドレス、`.local` Bonjour ホスト、Android
エミュレータホストでのみ受け付けられます。Tailnet CGNAT アドレス、`.ts.net` 名、公開ホストは、
QR/セットアップコード発行前に引き続きフェイルクローズします。

### Node デバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

承認するペア済みデバイスセッションがペアリング専用スコープで開かれていたために明示的な承認が拒否された場合、
CLI は同じリクエストを `operator.admin` で再試行します。これにより、既存の管理者権限を持つペア済みデバイスは、
`devices/paired.json` を手作業で編集せずに、新しい Control UI/ブラウザペアリングを復旧できます。
Gateway は再試行された接続を引き続き検証します。`operator.admin` で認証できないトークンは
引き続きブロックされます。

同じデバイスが異なる認証詳細（たとえば異なるロール/スコープ/公開鍵）で再試行した場合、
以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスが、黙ってより広いアクセスを得ることはありません。より多くのスコープやより広いロールを要求して再接続した場合、OpenClaw は既存の承認をそのまま保持し、新しい保留中のアップグレードリクエストを作成します。承認する前に `openclaw devices list` を使って、現在承認されているアクセスと新しく要求されたアクセスを比較してください。
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

これは、要求されたスコープがない新しい `role: node` ペアリングリクエストにのみ適用されます。
Operator、ブラウザ、Control UI、WebChat クライアントは引き続き手動承認が必要です。
ロール、スコープ、メタデータ、公開鍵の変更も引き続き手動承認が必要です。

### Node ペアリング状態ストレージ

`~/.openclaw/devices/` 配下に保存されます。

- `pending.json`（短期間のみ。保留中のリクエストは期限切れになります）
- `paired.json`（ペア済みデバイス + トークン）

### メモ

- レガシーの `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|remove|rename`）は、
  gateway 所有の別のペアリングストアです。WS Node には引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールに関する永続的な信頼できる情報源です。アクティブな
  デバイストークンは、その承認済みロールセットに制限されたままです。承認済みロール外の余分なトークンエントリが
  新しいアクセスを作成することはありません。

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
