---
read_when:
    - DM アクセス制御の設定
    - 新しい iOS/Android ノードのペアリング
    - OpenClaw のセキュリティ体制のレビュー
summary: 'ペアリングの概要: 誰が自分に DM できるか + どのノードが参加できるかを承認する'
title: ペアリング
x-i18n:
    generated_at: "2026-07-05T11:05:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edb1f7766c1512ed2dd0977bf8e3cce55b0e6ac34ace05921e62792c4c453afd
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」は OpenClaw の明示的なアクセス承認ステップです。
これは 2 つの場所で使われます。

1. **DM ペアリング**（bot と会話できる相手）
2. **Node ペアリング**（Gateway ネットワークへの参加を許可されるデバイス/ノード）

セキュリティコンテキスト: [セキュリティ](/ja-JP/gateway/security)

## 1) DM ペアリング（受信チャットアクセス）

チャンネルが DM ポリシー `pairing` で構成されている場合、不明な送信者には短いコードが送られ、そのメッセージは承認されるまで**処理されません**。

デフォルトの DM ポリシーは次で説明されています: [セキュリティ](/ja-JP/gateway/security)

`dmPolicy: "open"` が公開状態になるのは、有効な DM 許可リストに `"*"` が含まれている場合だけです。
セットアップと検証では、公開オープン構成にそのワイルドカードが必要です。既存の
状態に `open` と具体的な `allowFrom` エントリが含まれている場合、ランタイムは引き続き
それらの送信者だけを許可し、ペアリングストアの承認によって `open` アクセスが拡張されることはありません。

ペアリングコード:

- 8 文字、大文字、紛らわしい文字（`0O1I`）なし。
- **1 時間後に期限切れ**になります。bot は新しいリクエストが作成されたときだけペアリングメッセージを送信します（送信者ごとにおおよそ 1 時間に 1 回）。
- 保留中の DM ペアリングリクエストは **チャンネルアカウントごとに 3 件**までに制限されます。追加のリクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

同じチャンネルでリクエスト元に通知するには、approve コマンドに `--notify` を追加します。複数アカウントのチャンネルでは `--account <id>` を使います。

コマンド所有者がまだ構成されていない場合、DM ペアリングコードを承認すると、
`commands.ownerAllowFrom` も承認済み送信者（例: `telegram:123456789`）にブートストラップされます。
これにより、初回セットアップで特権コマンドと exec 承認プロンプトの明示的な所有者が得られます。
所有者が存在した後は、それ以降のペアリング承認は DM アクセスだけを付与し、
所有者を追加することはありません。

対応チャンネル（ペアリングを宣言するインストール済みチャンネル Plugin。`openclaw-weixin` などの外部 Plugin でさらに追加可能）: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`。

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャンネル、または DM とグループの両方の許可リストに適用する場合は、トップレベルの `accessGroups` を使います。

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

アクセスグループの詳細はこちらで説明しています: [アクセスグループ](/ja-JP/channels/access-groups)

### 状態の保存場所

`~/.openclaw/credentials/` の下に保存されます。

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み許可リストストア: `<channel>-<accountId>-allowFrom.json`（デフォルトアカウントの承認では
  `<channel>-default-allowFrom.json` を使います）

アカウントスコープの動作:

- デフォルト以外のアカウントは、スコープ付き許可リストファイルだけを読み書きします。
- デフォルトアカウントは、古いインストールからのレガシーなスコープなし `<channel>-allowFrom.json`
  ファイルも引き続き尊重します。読み取り時には両方のファイルのエントリがマージされます。

これらは機密情報として扱ってください（アシスタントへのアクセスを制御します）。

<Note>
ペアリング許可リストストアは DM アクセス用です。グループ認可は別です。
DM ペアリングコードを承認しても、その送信者がグループコマンドを実行したり、
グループ内で bot を制御したりできるようには自動的になりません。初回所有者のブートストラップは
`commands.ownerAllowFrom` の別の構成状態であり、グループチャット配信は引き続き
チャンネルのグループ許可リスト（たとえば `groupAllowFrom`、`groups`、またはチャンネルに応じたグループ単位
またはトピック単位のオーバーライド）に従います。
</Note>

## 2) Node デバイスペアリング（iOS/Android/macOS/ヘッドレスノード）

ノードは `role: node` を持つ**デバイス**として Gateway に接続します。Gateway は
承認が必要なデバイスペアリングリクエストを作成します。

### Control UI からペアリングする（推奨）

`operator.admin` アクセスを持つ、すでに接続済みの Control UI セッションを使います。

1. Control UI を開き、**Nodes** を選択します。
2. **Devices** で **Pair mobile device** をクリックします。
3. スマートフォンで OpenClaw アプリを開き、**Settings** → **Gateway** に移動します。
4. QR コードをスキャンするか、セットアップコードを貼り付けてから接続します。

公式の OpenClaw iOS および Android アプリは、そのセットアップコードメタデータが一致する場合、自動的に承認されます。
**Devices** に保留中のリクエストが表示される場合（たとえば、非公式クライアントやメタデータの不一致）、承認する前にそのロールと
スコープを確認してください。

現在の Control UI セッションに管理者アクセスがない場合、ボタンは無効になります。その場合は、
Gateway ホストから以下の CLI 承認フローを使います。

### Telegram 経由でペアリングする

`device-pair` Plugin を使っている場合、初回のデバイスペアリングを Telegram だけで完了できます。

1. Telegram で bot にメッセージを送ります: `/pair`
2. bot は 2 つのメッセージで返信します。説明メッセージと、別の**セットアップコード**メッセージです（Telegram で簡単にコピー/貼り付けできます）。
3. スマートフォンで OpenClaw iOS アプリを開き、Settings → Gateway に移動します。
4. QR コード（`/pair qr`）をスキャンするか、セットアップコードを貼り付けて接続します。
5. 公式モバイルアプリは自動的に接続します。`/pair pending` にリクエストが表示される場合は、
   承認する前にそのロールとスコープを確認してください。

セットアップコードは base64 エンコードされた JSON ペイロードで、次を含みます。

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `bootstrapToken`: 初回ペアリングハンドシェイク用の単回使用ブートストラップトークン（10 分後に期限切れ。`expiresAtMs` がペイロードに含まれます）

ペアリングが完了したら、未使用のセットアップコードを無効化するために `/pair cleanup` を実行します。

そのブートストラップトークンには、組み込みのペアリングブートストラッププロファイルが含まれます。

- 組み込みセットアッププロファイルが許可するのは、新しい QR/セットアップコードのベースラインだけです:
  `node` と制限付きの `operator` 引き継ぎ
- 引き継がれた `node` トークンは `scopes: []` のままです
- 引き継がれた `operator` トークンは `operator.approvals`、
  `operator.read`、`operator.talk.secrets`、`operator.write` に制限されます
- `operator.admin` は QR/セットアップコードのブートストラップでは付与されません。
  別途承認済みの operator ペアリングまたはトークンフローが必要です
- その後のトークンローテーション/失効は、デバイスの承認済み
  ロール契約と呼び出し元セッションの operator スコープの両方によって引き続き制限されます

セットアップコードは有効な間、パスワードのように扱ってください。

Tailscale、公開、またはその他のリモートモバイルペアリングでは、Tailscale Serve/Funnel
または別の `wss://` Gateway URL を使います。平文の `ws://` セットアップコードが受け付けられるのは、
ループバック、プライベート LAN アドレス、`.local` Bonjour ホスト、Android エミュレータホストだけです。
Tailnet CGNAT アドレス、`.ts.net` 名、公開ホストは、QR/セットアップコード発行前に引き続きフェイルクローズします。

### ノードデバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

承認を行うペアリング済みデバイスセッションがペアリング専用スコープで開かれていたために明示的な承認が拒否された場合、
CLI は同じリクエストを `operator.admin` で再試行します。これにより、既存の管理者権限を持つペアリング済みデバイスは、
`devices/paired.json` を手で編集せずに新しい Control UI/ブラウザペアリングを復旧できます。
Gateway は再試行された接続も引き続き検証します。`operator.admin` で認証できないトークンはブロックされたままです。

同じデバイスが異なる認証詳細（たとえば異なるロール/スコープ/公開鍵）で再試行した場合、以前の保留中リクエストは置き換えられ、新しい
`requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスが、暗黙により広いアクセスを得ることはありません。より多くのスコープやより広いロールを要求して再接続した場合、OpenClaw は既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認する前に `openclaw devices list` を使って、現在承認されているアクセスと新しく要求されたアクセスを比較してください。
</Note>

### 任意の信頼済み CIDR ノード自動承認

デバイスペアリングはデフォルトでは手動のままです。厳密に管理されたノードネットワークでは、
明示的な CIDR または正確な IP による初回ノード自動承認にオプトインできます。

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

これは、要求されたスコープがない新規の `role: node` ペアリングリクエストにのみ適用されます。
Operator、ブラウザ、Control UI、WebChat クライアントは引き続き手動承認が必要です。
ロール、スコープ、メタデータ、公開鍵の変更も引き続き手動承認が必要です。

### Node ペアリング状態ストレージ

`~/.openclaw/devices/` の下に保存されます。

- `pending.json`（短命。保留中のリクエストは 5 分後に期限切れ）
- `paired.json`（ペアリング済みデバイス + トークン）

### 注記

- レガシーな `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|remove|rename`）は、
  Gateway 所有の別のペアリングストアです。WS ノードには引き続きデバイスペアリングが必要です。
- ペアリングレコードは、承認済みロールに関する永続的な信頼できる情報源です。アクティブな
  デバイストークンは、その承認済みロールセットに制限されたままです。承認済みロールの外側にある孤立したトークンエントリによって、
  新しいアクセスが作成されることはありません。

## 関連ドキュメント

- セキュリティモデル + プロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全な更新（doctor を実行）: [更新](/ja-JP/install/updating)
- チャンネル構成:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - iMessage: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
