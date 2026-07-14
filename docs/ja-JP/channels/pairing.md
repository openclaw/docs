---
read_when:
    - DMアクセス制御の設定
    - 新しい iOS/Android Node のペアリング
    - OpenClaw のセキュリティ態勢のレビュー
summary: ペアリングの概要：DM を送信できるユーザーと参加できる Node を承認する
title: ペアリング
x-i18n:
    generated_at: "2026-07-14T13:28:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

「ペアリング」は、OpenClawで明示的にアクセスを承認する手順です。
次の2か所で使用されます。

1. **DMペアリング**（ボットとの会話を許可する相手）
2. **Nodeペアリング**（Gatewayネットワークへの参加を許可するデバイス／Node）

セキュリティのコンテキスト：[セキュリティ](/ja-JP/gateway/security)

## 1) DMペアリング（受信チャットへのアクセス）

チャンネルのDMポリシーが`pairing`に設定されている場合、未知の送信者には短いコードが発行され、承認されるまでそのメッセージは**処理されません**。

デフォルトのDMポリシーについては、[セキュリティ](/ja-JP/gateway/security)を参照してください。

`dmPolicy: "open"`が公開状態になるのは、有効なDM許可リストに`"*"`が含まれる場合のみです。
一般公開設定のセットアップと検証には、このワイルドカードが必要です。既存の
状態に具体的な`allowFrom`エントリを持つ`open`が含まれている場合、ランタイムが引き続き許可するのは
それらの送信者のみであり、ペアリングストアでの承認によって`open`へのアクセスが拡大することはありません。

ペアリングコード：

- 8文字の大文字で、紛らわしい文字（`0O1I`）は含まれません。
- **1時間後に期限切れ**になります。ボットがペアリングメッセージを送信するのは、新しいリクエストが作成されたときだけです（送信者ごとにおおむね1時間に1回）。
- 保留中のDMペアリングリクエストは、**チャンネルアカウントごとに3件**までです。いずれかが期限切れになるか承認されるまで、それ以降のリクエストは無視されます。

### 送信者を承認する

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

同じチャンネル上でリクエスト元に通知するには、承認コマンドに`--notify`を追加します。複数アカウント対応チャンネルでは`--account <id>`を指定します。

コマンドの所有者がまだ設定されていない場合、DMペアリングコードを承認すると、
承認された送信者（例：`telegram:123456789`）を対象として`commands.ownerAllowFrom`も初期設定されます。
これにより、初回セットアップ時に、特権コマンドと実行承認プロンプトの明示的な所有者が設定されます。
所有者が存在するようになった後は、それ以降のペアリング承認で付与されるのはDMアクセスのみであり、
所有者が追加されることはありません。

対応チャンネル（ペアリングを宣言するインストール済みの任意のチャンネルPlugin。`openclaw-weixin`などの外部Pluginで追加可能）：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`sms`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 再利用可能な送信者グループ

同じ信頼済み送信者の集合を複数のメッセージチャンネル、またはDMとグループの両方の許可リストに適用する場合は、
トップレベルの`accessGroups`を使用します。

静的グループでは`type: "message.senders"`を使用し、チャンネルの許可リストから
`accessGroup:<name>`で参照します。

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

アクセスグループの詳細については、[アクセスグループ](/ja-JP/channels/access-groups)を参照してください。

### 状態の保存場所

共有SQLite状態データベースの
`~/.openclaw/state/openclaw.sqlite`に保存されます。

- `channel_pairing_requests`内の保留中リクエスト
- `channel_pairing_allow_entries`内の承認済み送信者

アカウントのスコープ動作：

- 各リクエストと承認済み送信者は、チャンネルとアカウントをキーとして管理されます
- ランタイムは正規のSQLite行のみを読み取り、レガシーファイルをマージしません

旧バージョンのGatewayは、`~/.openclaw/credentials/`配下に
`<channel>-pairing.json`と`<channel>-<accountId>-allowFrom.json`を書き込んでいました。
起動時の移行と`openclaw doctor --fix`により、これらのファイルがSQLiteへインポートされ、
インポートに成功すると各ソースファイルが削除されます。これらの行はアシスタントへのアクセスを制御するため、
SQLiteデータベースは機密情報として扱ってください。

<Note>
ペアリング許可リストストアはDMアクセス用です。グループの認可は別に行われます。
DMペアリングコードを承認しても、その送信者がグループ内でコマンドを実行したり、
グループ内のボットを制御したりすることが自動的に許可されるわけではありません。最初の所有者の初期設定は、
`commands.ownerAllowFrom`内の別個の設定状態です。また、グループチャットへの配信は引き続き
チャンネルのグループ許可リスト（例：`groupAllowFrom`、`groups`、またはチャンネルに応じたグループ単位
あるいはトピック単位の上書き）に従います。
</Note>

## 2) Nodeデバイスのペアリング（iOS／Android／macOS／ヘッドレスNode）

Nodeは`role: node`を持つ**デバイス**としてGatewayに接続します。Gatewayは、
承認が必要なデバイスペアリングリクエストを作成します。

### Control UIからペアリングする（推奨）

`operator.admin`アクセス権を持つ、接続済みのControl UIセッションを使用します。

1. Control UIを開き、**Settings → Devices**に移動します。
2. **Devices**ページで、**Pair mobile device**をクリックします。
3. **Full access (recommended)**のままにするか、管理用Gatewayコントロールを除外する場合は
   **Limited access**を選択します。
4. **Create setup code**をクリックします。
5. スマートフォンでOpenClawアプリを開き、**Settings** → **Gateway**に移動します。
6. QRコードをスキャンするかセットアップコードを貼り付けて、接続します。

公式のOpenClaw iOSおよびAndroidアプリは、セットアップコードのメタデータが一致する場合、自動的に承認されます。
**Pending approval**にリクエストが表示された場合（非公式クライアントやメタデータの不一致など）は、
承認前にそのロールとスコープを確認してください。

現在のControl UIセッションに管理者アクセス権がない場合、ボタンは無効になります。
その場合は、Gatewayホストから以下のCLI承認フローを使用してください。

### Telegram経由でペアリングする

`device-pair`Pluginを使用する場合、初回のデバイスペアリングをTelegramだけで完了できます。

1. Telegramでボットに`/pair`とメッセージを送信します。
2. ボットから2件のメッセージが返信されます。1件は手順のメッセージ、もう1件は独立した**セットアップコード**のメッセージです（Telegramで簡単にコピー＆ペーストできます）。
3. スマートフォンでOpenClaw iOSアプリを開き、Settings → Gatewayに移動します。
4. QRコード（`/pair qr`）をスキャンするか、セットアップコードを貼り付けて接続します。
5. 公式モバイルアプリは自動的に接続します。`/pair pending`にリクエストが表示された場合は、
   承認前にそのロールとスコープを確認してください。

セットアップコードは、次の内容を含むbase64エンコード済みのJSONペイロードです。

- `url`：Gateway WebSocket URL（`ws://...`または`wss://...`）
- `urls`：利用可能な場合に、モバイルアプリが試行できる順序付きLAN／Tailnetルート
- `bootstrapToken`：最初のペアリングハンドシェイク用の使い捨てブートストラップトークン。Gatewayにより10分後に期限切れになります

ペアリングの完了後、未使用のセットアップコードを無効にするには`/pair cleanup`を実行します。

このブートストラップトークンには、組み込みのペアリング用ブートストラッププロファイルが含まれます。

- 安全な`wss://`セットアップ（または同一ホストのループバック）では、デフォルトで`node`に加えて完全な
  ネイティブモバイル`operator`アクセスが付与されます
- 引き渡される`node`トークンは`scopes: []`のままです
- デフォルトで引き渡される`operator`トークンには、`operator.admin`、
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、および
  `operator.write`が含まれます
- Control UIの**Limited access**と`openclaw qr --limited`では、
  その他のオペレータースコープを維持しつつ、`operator.admin`が除外されます
- 平文LANの`ws://`セットアップでは、同じ制限付きプロファイルが自動的に使用されます。
  完全なアクセスを得るには、`wss://`またはTailscale Serveを設定し、新しいコードを生成してください
- 後続のトークンローテーション／失効は、デバイスの承認済みロール契約と
  呼び出し元セッションのオペレータースコープの両方によって引き続き制限されます

セットアップコードが有効な間は、パスワードと同様に扱ってください。

iOSおよびAndroidの**Settings → Gateway**ページには、**Full**または**Limited**アクセスが表示されます。
制限付きのスマートフォンをアップグレードするには、まず安全な`wss://`または
Tailscale Serveルートを設定し、完全アクセス用の新しいセットアップコードを生成して、その設定ページでスキャンまたは
貼り付けた後、再接続します。

Tailscale、公開環境、またはその他のリモートモバイルペアリングでは、Tailscale Serve／Funnel
または別の`wss://` Gateway URLを使用します。平文の`ws://`セットアップコードが受け入れられるのは、
ループバック、プライベートLANアドレス、`.local` Bonjourホスト、およびAndroid
エミュレーターホストに限られます。ループバック以外の平文ルートには制限付きアクセスが付与されます。Tailnetの
CGNATアドレス、`.ts.net`名、および公開ホストについては、QR／セットアップコードが発行される前に引き続きフェイルクローズします。

`gateway.bind=lan`セットアップURLの場合、OpenClawは、アクティブなGatewayのループバックポートをプロキシする
永続的なTailscale Serve HTTPSルートを検出し、LANルートと併せて通知します。セットアップコマンドがこのフォールバックを追加するのは
`lan`の場合のみです。`custom`と`tailnet`では、明示的に通知されたルートが維持されます。
iOSアプリは通知されたルートを順番にプローブし、最初に到達できた
エンドポイントを保存します。

### Nodeデバイスを承認する

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

明示的な承認が拒否された理由が、承認側のペアリング済みデバイスセッションが
ペアリング専用スコープで開かれていたことである場合、CLIは`operator.admin`を使用して
同じリクエストを再試行します。これにより、管理者権限を持つ既存のペアリング済みデバイスは、
ペアリングストアを手動で編集せずに、新しいControl UI／ブラウザのペアリングを復旧できます。
Gatewayは再試行された接続も引き続き検証します。`operator.admin`で認証できないトークンは
ブロックされたままです。

同じデバイスが異なる認証情報（異なるロール／スコープ／公開鍵など）で再試行した場合、
以前の保留中リクエストは置き換えられ、新しい`requestId`が作成されます。

<Note>
すでにペアリング済みのデバイスに、より広いアクセス権が暗黙的に付与されることはありません。より多くのスコープや、より広いロールを要求して再接続した場合、OpenClawは既存の承認をそのまま維持し、新しい保留中のアップグレードリクエストを作成します。承認する前に、`openclaw devices list`を使用して、現在承認されているアクセス権と新たに要求されたアクセス権を比較してください。
</Note>

### 信頼済みCIDRによるNodeの自動承認（任意）

デバイスのペアリングはデフォルトでは手動のままです。厳密に管理されたNodeネットワークでは、
明示的なCIDRまたは正確なIPを指定して、初回のNode自動承認を有効にできます。

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

これは、要求されたスコープを持たない新規の`role: node`ペアリングリクエストにのみ適用されます。
オペレーター、ブラウザ、Control UI、およびWebChatクライアントには、引き続き手動承認が必要です。
ロール、スコープ、メタデータ、および公開鍵の変更にも、引き続き手動承認が必要です。

### Nodeペアリング状態の保存

共有SQLite状態データベースの`~/.openclaw/state/openclaw.sqlite`に保存されます。

- 保留中のデバイスペアリングリクエスト（短期間のみ保持され、5分後に期限切れになります）
- ペアリング済みデバイスとトークン

旧バージョンのGatewayでは、この状態を`~/.openclaw/devices/*.json`に保持していました。これらのファイルは
Gatewayの起動時にSQLiteへインポートされ、`.migrated`サフィックスを付けてアーカイブされます。

### 注記

- `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）は、
  同じペアリング済みデバイスレコードに保存されたNode機能の承認を管理します。WS Nodeには
  引き続きデバイスのペアリングが必要です。[Nodeペアリング](/ja-JP/gateway/pairing)を参照してください。
- ペアリングレコードは、承認済みロールに関する永続的な信頼できる唯一の情報源です。アクティブな
  デバイストークンは、その承認済みロールセットの範囲内に制限されます。承認済みロール外の孤立したトークンエントリによって、
  新しいアクセス権が作成されることはありません。

## 関連ドキュメント

- セキュリティモデルとプロンプトインジェクション: [セキュリティ](/ja-JP/gateway/security)
- 安全なアップデート（doctor を実行）: [アップデート](/ja-JP/install/updating)
- チャンネル設定:
  - Telegram: [Telegram](/ja-JP/channels/telegram)
  - WhatsApp: [WhatsApp](/ja-JP/channels/whatsapp)
  - Signal: [Signal](/ja-JP/channels/signal)
  - iMessage: [iMessage](/ja-JP/channels/imessage)
  - Discord: [Discord](/ja-JP/channels/discord)
  - Slack: [Slack](/ja-JP/channels/slack)
