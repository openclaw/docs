---
read_when:
    - DMアクセス制御の設定
    - 新しい iOS/Android Node のペアリング
    - OpenClaw のセキュリティ態勢のレビュー
summary: ペアリングの概要：DM を送信できる相手と参加可能な Node を承認する
title: ペアリング
x-i18n:
    generated_at: "2026-07-12T14:20:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32fcb7c9031afc1e18c9288c201b80aeee7ce8b44eb345492101949ec7c91358
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」は、OpenClawにおける明示的なアクセス承認手順です。
これは次の2か所で使用されます。

1. **DMペアリング**（ボットとの会話を許可する相手）
2. **Nodeペアリング**（Gatewayネットワークへの参加を許可するデバイス／Node）

セキュリティのコンテキスト：[セキュリティ](/ja-JP/gateway/security)

## 1) DMペアリング（受信チャットへのアクセス）

チャンネルのDMポリシーが`pairing`に設定されている場合、不明な送信者には短いコードが送られ、承認するまでそのメッセージは**処理されません**。

デフォルトのDMポリシーについては、[セキュリティ](/ja-JP/gateway/security)を参照してください。

`dmPolicy: "open"`が公開アクセスになるのは、有効なDM許可リストに`"*"`が含まれている場合のみです。
公開アクセスを許可する設定では、セットアップと検証にこのワイルドカードが必要です。既存の
状態に具体的な`allowFrom`エントリを伴う`open`が含まれている場合、ランタイムが許可するのは
引き続きそれらの送信者のみであり、ペアリングストアでの承認によって`open`のアクセス範囲が広がることはありません。

ペアリングコード：

- 8文字の大文字で、紛らわしい文字（`0O1I`）は含まれません。
- **1時間後に期限切れになります**。ボットがペアリングメッセージを送信するのは、新しいリクエストが作成されたときだけです（送信者ごとにおよそ1時間に1回）。
- 保留中のDMペアリングリクエストは、**チャンネルアカウントごとに3件**が上限です。追加のリクエストは、いずれかが期限切れになるか承認されるまで無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

承認コマンドに`--notify`を追加すると、同じチャンネル上でリクエスト元に通知できます。複数アカウント対応チャンネルでは`--account <id>`を指定します。

コマンド所有者がまだ設定されていない場合、DMペアリングコードを承認すると、
`commands.ownerAllowFrom`にも承認済みの送信者（`telegram:123456789`など）が初期設定されます。
これにより、初回セットアップ時に、特権コマンドおよびexec承認プロンプトの明示的な所有者が設定されます。
所有者が存在するようになった後は、以降のペアリング承認で付与されるのはDMアクセス権のみです。
所有者が追加されることはありません。

対応チャンネル（ペアリング対応を宣言するインストール済みチャンネルPlugin。`openclaw-weixin`などの外部Pluginによって追加可能）：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`sms`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 再利用可能な送信者グループ

同じ信頼済み送信者セットを複数のメッセージチャネル、または DM とグループの両方の許可リストに適用する場合は、トップレベルの `accessGroups` を使用します。

静的グループには `type: "message.senders"` を使用し、チャネルの許可リストから `accessGroup:<name>` で参照します。

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

アクセスグループについては、こちらで詳しく説明しています: [アクセスグループ](/ja-JP/channels/access-groups)

### 状態の保存場所

`~/.openclaw/credentials/` 配下に保存されます。

- 保留中のリクエスト: `<channel>-pairing.json`
- 承認済み許可リストの保存先: `<channel>-<accountId>-allowFrom.json`（デフォルトアカウントの承認には `<channel>-default-allowFrom.json` を使用）

アカウントのスコープ動作:

- デフォルト以外のアカウントは、スコープ指定された自身の許可リストファイルのみを読み書きします。
- デフォルトアカウントは、古いインストール環境の従来のスコープなし `<channel>-allowFrom.json` ファイルも引き続き認識します。読み取り時には、両方のファイルのエントリがマージされます。

これらは機密情報として扱ってください（アシスタントへのアクセスを制御するためです）。

<Note>
ペアリング許可リストの保存先は DM アクセス用です。グループの認可は別に扱われます。
DM ペアリングコードを承認しても、その送信者がグループコマンドを実行したり、グループ内でボットを制御したりすることは自動的には許可されません。最初の所有者のブートストラップは `commands.ownerAllowFrom` にある別の設定状態であり、グループチャットへの配信には、引き続きチャネルのグループ許可リストが適用されます（チャネルに応じて、たとえば `groupAllowFrom`、`groups`、グループ単位またはトピック単位のオーバーライド）。
</Note>

## 2) Node デバイスのペアリング（iOS/Android/macOS/ヘッドレス Node）

Node は `role: node` を持つ**デバイス**として Gateway に接続します。Gateway は、承認が必要なデバイスペアリングリクエストを作成します。

### Control UI からペアリングする（推奨）

`operator.admin` アクセス権を持つ、接続済みの Control UI セッションを使用します。

1. Control UI を開き、**Nodes** を選択します。
2. **Devices** ページで、**Pair mobile device** をクリックします。
3. スマートフォンで OpenClaw アプリを開き、**Settings** → **Gateway** の順に進みます。
4. QR コードをスキャンするかセットアップコードを貼り付けて、接続します。

公式の OpenClaw iOS および Android アプリは、セットアップコードのメタデータが一致すると自動的に承認されます。**Pending approval** にリクエストが表示された場合（非公式クライアントやメタデータの不一致など）は、承認する前にそのロールとスコープを確認してください。

現在の Control UI セッションに管理者アクセス権がない場合、このボタンは無効になります。その場合は、Gateway ホストから以下の CLI 承認フローを使用してください。

### Telegram 経由でペアリングする

`device-pair` Plugin を使用している場合、初回のデバイスペアリングを Telegram 内だけで完了できます。

1. Telegram でボットに `/pair` とメッセージを送信します。
2. ボットから、説明メッセージと個別の **setup code** メッセージ（Telegram で簡単にコピー＆ペースト可能）の 2 通が返信されます。
3. スマートフォンで OpenClaw iOS アプリを開き、Settings → Gateway の順に進みます。
4. QR コード（`/pair qr`）をスキャンするかセットアップコードを貼り付けて、接続します。
5. 公式モバイルアプリは自動的に接続されます。`/pair pending` にリクエストが表示された場合は、承認する前にそのロールとスコープを確認してください。

セットアップコードは、次の内容を含む base64 エンコードされた JSON ペイロードです。

- `url`: Gateway WebSocket URL（`ws://...` または `wss://...`）
- `urls`: 利用可能な場合、モバイルアプリが試行できる、順序付けされた LAN/Tailnet ルート
- `bootstrapToken`: 初回ペアリングのハンドシェイクに使用する使い捨てブートストラップトークン。Gateway は 10 分後にこれを期限切れにします

ペアリング完了後、未使用のセットアップコードを無効化するには `/pair cleanup` を実行します。

このブートストラップトークンには、組み込みのペアリング用ブートストラッププロファイルが設定されています。

- 組み込みセットアッププロファイルで許可されるのは、新しい QR/セットアップコードのベースラインのみです。つまり、`node` と制限された `operator` への引き継ぎです
- 引き継がれた `node` トークンは `scopes: []` のままです
- 引き継がれた `operator` トークンは、`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write` のみに制限されます
- QR/セットアップコードのブートストラップでは `operator.admin` は付与されません。別途承認された operator のペアリングまたはトークンフローが必要です
- その後のトークンのローテーションや失効も、デバイスで承認されたロールの契約と、呼び出し元セッションの operator スコープの両方によって引き続き制限されます

セットアップコードが有効な間は、パスワードと同様に扱ってください。

Tailscale、公開接続、またはその他のリモートモバイルペアリングでは、Tailscale Serve/Funnel または別の `wss://` Gateway URL を使用します。平文の `ws://` セットアップコードは、loopback、プライベート LAN アドレス、`.local` Bonjour ホスト、Android エミュレーターホストでのみ受け入れられます。Tailnet CGNAT アドレス、`.ts.net` 名、公開ホストでは、引き続き QR/セットアップコードの発行前にフェイルクローズします。

`gateway.bind=lan` のセットアップ URL では、OpenClaw はアクティブな Gateway の loopback ポートをプロキシする永続的な Tailscale Serve HTTPS ルートを検出し、LAN ルートとともに通知します。セットアップコマンドがこのフォールバックを追加するのは `lan` の場合のみです。`custom` と `tailnet` は、明示的に通知されたルートを維持します。iOS アプリは通知されたルートを順番にプローブし、最初に到達可能なエンドポイントを保存します。

### Node デバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

承認を行うペアリング済みデバイスのセッションがペアリング専用スコープで開かれていたために明示的な承認が拒否された場合、CLI は同じリクエストを `operator.admin` で再試行します。これにより、管理者権限を持つ既存のペアリング済みデバイスから、ペアリングストアを手動で編集することなく、新しい Control UI/ブラウザのペアリングを復旧できます。Gateway は再試行された接続も引き続き検証します。`operator.admin` で認証できないトークンはブロックされたままです。

同じデバイスが異なる認証情報（異なるロール、スコープ、公開鍵など）で再試行した場合、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。

<Note>
すでにペアリング済みのデバイスに、より広いアクセス権が暗黙的に付与されることはありません。より多くのスコープや、より広いロールを要求して再接続した場合、OpenClaw は既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認する前に `openclaw devices list` を使用し、現在承認されているアクセス権と新しく要求されたアクセス権を比較してください。
</Note>

### 信頼済み CIDR による Node の自動承認（任意）

デバイスペアリングはデフォルトでは手動のままです。厳密に管理された Node ネットワークでは、CIDR または正確な IP を明示して、初回の Node 自動承認を有効にできます。

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

これは、スコープを要求しない新規の `role: node` ペアリングリクエストにのみ適用されます。Operator、ブラウザ、Control UI、WebChat クライアントでは、引き続き手動承認が必要です。ロール、スコープ、メタデータ、公開鍵の変更にも、引き続き手動承認が必要です。

### Node ペアリング状態の保存

共有 SQLite 状態データベース `~/.openclaw/state/openclaw.sqlite` に保存されます。

- 保留中のデバイスペアリングリクエスト（短期間のみ有効で、5 分後に期限切れになります）
- ペアリング済みデバイスとトークン

以前の Gateway では、この状態を `~/.openclaw/devices/*.json` に保持していました。これらのファイルは Gateway の起動時に SQLite にインポートされ、`.migrated` サフィックスを付けてアーカイブされます。

### 注記

- `node.pair.*` API（CLI: `openclaw nodes pending|approve|reject|remove|rename`）は、同じペアリング済みデバイスレコードに保存される Node 機能の承認を管理します。WS Node にもデバイスペアリングが必要です。[Node のペアリング](/ja-JP/gateway/pairing)を参照してください。
- ペアリングレコードは、承認済みロールの永続的な信頼できる唯一の情報源です。アクティブなデバイストークンは、承認されたロールセットの範囲内に制限され続けます。承認済みロールの外部に孤立したトークンエントリがあっても、新しいアクセス権は作成されません。

## 関連ドキュメント

- セキュリティモデルとプロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全な更新（doctor を実行）: [更新](/ja-JP/install/updating)
- チャンネル設定:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - iMessage: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
