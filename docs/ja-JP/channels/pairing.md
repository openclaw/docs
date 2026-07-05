---
read_when:
    - DM アクセス制御の設定
    - 新しい iOS/Android ノードのペアリング
    - OpenClaw のセキュリティ体制をレビューする
summary: 'ペアリングの概要: 自分に DM できるユーザーと参加できるノードを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-07-05T17:39:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a3f76771d40606bf90ecaadef3f5b58f8cdbae9b2132ca5086c444371b61b87
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」は、OpenClaw の明示的なアクセス承認手順です。
これは 2 か所で使われます。

1. **DM ペアリング**（誰がボットと会話できるか）
2. **Node ペアリング**（どのデバイス/ノードが Gateway ネットワークに参加できるか）

セキュリティコンテキスト: [セキュリティ](/ja-JP/gateway/security)

## 1) DM ペアリング（受信チャットアクセス）

チャネルが DM ポリシー `pairing` で構成されている場合、未知の送信者には短いコードが送られ、承認するまでそのメッセージは**処理されません**。

既定の DM ポリシーは次に記載されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"` が公開状態になるのは、有効な DM 許可リストに `"*"` が含まれる場合のみです。
セットアップと検証では、公開オープン構成にこのワイルドカードが必要です。既存の
状態に `open` と具体的な `allowFrom` エントリが含まれる場合でも、ランタイムは
それらの送信者のみを許可し、ペアリングストアの承認によって `open` アクセスが広がることはありません。

ペアリングコード:

- 8 文字、大文字、紛らわしい文字なし（`0O1I`）。
- **1 時間後に期限切れ**。ボットは新しいリクエストが作成されたときのみペアリングメッセージを送信します（送信者ごとにおおよそ 1 時間に 1 回）。
- 保留中の DM ペアリングリクエストは、**チャネルアカウントごとに 3 件**までに制限されます。追加のリクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

同じチャネルでリクエスト元に通知するには、承認コマンドに `--notify` を追加します。複数アカウントのチャネルでは `--account <id>` を使います。

コマンド所有者がまだ構成されていない場合、DM ペアリングコードの承認によって
`commands.ownerAllowFrom` も、たとえば `telegram:123456789` のような承認済み送信者にブートストラップされます。
これにより、初回セットアップ時に特権コマンドと exec 承認プロンプトの明示的な所有者が設定されます。
所有者が存在した後は、それ以降のペアリング承認は DM
アクセスのみを付与し、所有者を追加しません。

対応チャネル（ペアリングを宣言するインストール済みチャネル Plugin。`openclaw-weixin` などの外部 Plugin で追加可能）: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャネル、または DM とグループの許可リストの両方に適用する必要がある場合は、トップレベルの `accessGroups` を使います。

静的グループは `type: "message.senders"` を使い、チャネル許可リストから
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

アクセスグループの詳細はこちらに記載されています: [アクセスグループ](/ja-JP/channels/access-groups)

### 状態の保存場所

`~/.openclaw/credentials/` の下に保存されます。

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み許可リストストア: `<channel>-<accountId>-allowFrom.json`（既定アカウントの承認は
  `<channel>-default-allowFrom.json` を使います）

アカウントスコープの挙動:

- 既定以外のアカウントは、スコープ付き許可リストファイルのみを読み書きします。
- 既定アカウントは、古いインストールからのレガシーなスコープなし `<channel>-allowFrom.json`
  ファイルも引き続き尊重します。読み取り時には両方のファイルのエントリがマージされます。

これらは機密として扱ってください（アシスタントへのアクセスを制御します）。

<Note>
ペアリング許可リストストアは DM アクセス用です。グループ承認は別です。
DM ペアリングコードを承認しても、その送信者がグループ
コマンドを実行したり、グループ内でボットを制御したりすることが自動的に許可されるわけではありません。初回所有者のブートストラップは
`commands.ownerAllowFrom` の別の構成状態であり、グループチャット配信は引き続き
チャネルのグループ許可リスト（たとえば `groupAllowFrom`、`groups`、またはチャネルに応じたグループ単位
またはトピック単位の上書き）に従います。
</Note>

## 2) Node デバイスペアリング（iOS/Android/macOS/ヘッドレスノード）

ノードは `role: node` を持つ**デバイス**として Gateway に接続します。Gateway は
承認が必要なデバイスペアリングリクエストを作成します。

### Control UI からペアリングする（推奨）

`operator.admin` アクセスを持つ、すでに接続済みの Control UI セッションを使います。

1. Control UI を開き、**Nodes** を選択します。
2. **Devices** で **Pair mobile device** をクリックします。
3. スマートフォンで OpenClaw アプリを開き、**Settings** → **Gateway** に進みます。
4. QR コードをスキャンするか、セットアップコードを貼り付けてから接続します。

公式の OpenClaw iOS および Android アプリは、それらの
セットアップコードメタデータが一致すると自動的に承認されます。**Devices** に保留中のリクエストが表示される場合（たとえば
非公式クライアントやメタデータ不一致の場合）は、承認前にそのロールと
スコープを確認してください。

現在の Control UI セッションに管理者アクセスがない場合、ボタンは無効になります。
その場合は Gateway ホストから下記の CLI 承認フローを使います。

### Telegram 経由でペアリングする

`device-pair` Plugin を使う場合、初回のデバイスペアリングを Telegram だけで完了できます。

1. Telegram でボットに `/pair` とメッセージを送ります。
2. ボットは 2 つのメッセージで返信します。手順メッセージと、別の**セットアップコード**メッセージ（Telegram でコピー/貼り付けしやすい形式）です。
3. スマートフォンで OpenClaw iOS アプリを開き、Settings → Gateway に進みます。
4. QR コード（`/pair qr`）をスキャンするか、セットアップコードを貼り付けて接続します。
5. 公式モバイルアプリは自動的に接続します。`/pair pending` に
   リクエストが表示される場合は、承認前にそのロールとスコープを確認してください。

セットアップコードは、次を含む base64 エンコード済み JSON ペイロードです。

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `urls`: 利用可能な場合、モバイルアプリが試行できる LAN/Tailnet ルートの順序付きリスト
- `bootstrapToken`: 初回ペアリングハンドシェイク用の単回使用ブートストラップトークン（10 分後に期限切れ。`expiresAtMs` はペイロードに含まれます）

ペアリング完了後に未使用のセットアップコードを無効化するには、`/pair cleanup` を実行します。

そのブートストラップトークンには、組み込みのペアリングブートストラッププロファイルが含まれます。

- 組み込みセットアッププロファイルが許可するのは、新しい QR/セットアップコードのベースラインのみです。
  `node` に加え、範囲が限定された `operator` ハンドオフ
- ハンドオフされた `node` トークンは `scopes: []` のままです
- ハンドオフされた `operator` トークンは、`operator.approvals`、
  `operator.read`、`operator.talk.secrets`、`operator.write` に制限されます
- `operator.admin` は QR/セットアップコードブートストラップでは付与されません。
  別途承認済みの operator ペアリングまたはトークンフローが必要です
- 以降のトークンローテーション/失効は、デバイスの承認済み
  ロール契約と呼び出し元セッションの operator スコープの両方によって引き続き制限されます

セットアップコードは、有効な間はパスワードのように扱ってください。

Tailscale、公開、またはその他のリモートモバイルペアリングには、Tailscale Serve/Funnel
または別の `wss://` Gateway URL を使います。平文の `ws://` セットアップコードは、
ループバック、プライベート LAN アドレス、`.local` Bonjour ホスト、Android
エミュレーターホストの場合のみ受け付けられます。Tailnet CGNAT アドレス、`.ts.net` 名、公開ホストは、QR/セットアップコード発行前に
引き続き fail closed します。

`gateway.bind=lan` セットアップ URL では、OpenClaw はアクティブな Gateway のループバックポートをプロキシする永続的な Tailscale Serve
HTTPS ルートを検出し、それらを LAN ルートと並べて通知します。特定インターフェイスの `custom` および `tailnet` バインドは、
ループバック Serve プロキシがそれらのリスナーに到達できないため、
このフォールバックを受け取りません。iOS アプリは通知されたルートを順番にプローブし、最初に
到達可能なエンドポイントを保存します。

### ノードデバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

承認するペア済みデバイスセッションが pairing-only スコープで開かれていたために明示的な承認が拒否された場合、
CLI は同じリクエストを `operator.admin` で再試行します。これにより、既存の admin 対応ペア済みデバイスは、
`devices/paired.json` を手で編集せずに、新しい
Control UI/ブラウザのペアリングを復旧できます。
Gateway は再試行された接続を引き続き検証します。`operator.admin` で認証できないトークンは
ブロックされたままです。

同じデバイスが異なる認証詳細（たとえば異なる
ロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しい
`requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスが、暗黙的により広いアクセスを得ることはありません。より多くのスコープや広いロールを要求して再接続した場合、OpenClaw は既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認する前に `openclaw devices list` を使って、現在承認済みのアクセスと新しく要求されたアクセスを比較してください。
</Note>

### 任意の信頼済み CIDR ノード自動承認

デバイスペアリングは既定では手動のままです。厳密に制御されたノードネットワークでは、
明示的な CIDR または正確な IP を使って、初回ノード自動承認にオプトインできます。

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
Operator、ブラウザ、Control UI、WebChat クライアントは引き続き手動
承認が必要です。ロール、スコープ、メタデータ、公開鍵の変更も引き続き手動
承認が必要です。

### Node ペアリング状態の保存

`~/.openclaw/devices/` の下に保存されます。

- `pending.json`（短命。保留中のリクエストは 5 分後に期限切れ）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注記

- レガシーの `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|remove|rename`）は、
  Gateway 所有の別のペアリングストアです。WS ノードには引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールの永続的な信頼できる情報源です。アクティブな
  デバイストークンは、その承認済みロールセットに制限されたままです。承認済みロールの外側にある迷い込んだトークンエントリが、
  新しいアクセスを作成することはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全な更新（doctor を実行）: [更新](/ja-JP/install/updating)
- チャネル構成:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - iMessage: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
