---
read_when:
    - OpenClawでMatrixをセットアップする。
    - MatrixのE2EEと検証を設定する。
summary: Matrixのサポート状況、セットアップ、および設定例
title: Matrix
x-i18n:
    generated_at: "2026-04-23T13:58:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14873e9d65994138d26ad0bc1bf9bc6e00bea17f9306d592c757503d363de71a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrixは、OpenClawに同梱されているchannel Pluginです。
公式の`matrix-js-sdk`を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EEをサポートしています。

## 同梱Plugin

Matrixは現在のOpenClawリリースでは同梱Pluginとして提供されるため、通常の
パッケージ版ビルドでは別途インストールは不要です。

古いビルドまたはMatrixを含まないカスタムインストールを使用している場合は、
手動でインストールしてください。

npmからインストール:

```bash
openclaw plugins install @openclaw/matrix
```

ローカルチェックアウトからインストール:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Pluginの動作とインストールルールについては、[Plugins](/ja-JP/tools/plugin)を参照してください。

## セットアップ

1. Matrix Pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースには、すでに同梱されています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. ご利用のhomeserverでMatrixアカウントを作成します。
3. `channels.matrix`を次のいずれかで設定します。
   - `homeserver` + `accessToken`、または
   - `homeserver` + `userId` + `password`
4. Gatewayを再起動します。
5. ボットとのDMを開始するか、ルームに招待します。
   - 新しいMatrix招待が機能するのは、`channels.matrix.autoJoin`がそれを許可している場合のみです。

対話式セットアップ手順:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrixウィザードでは次を確認します:

- homeserver URL
- 認証方法: アクセストークンまたはパスワード
- ユーザーID（パスワード認証時のみ）
- 任意のデバイス名
- E2EEを有効にするかどうか
- ルームアクセスと招待の自動参加を設定するかどうか

ウィザードの主な動作:

- Matrix認証env varsがすでに存在し、そのアカウントにまだ設定内の認証保存がない場合、ウィザードは認証をenv varsに保持するための環境変数ショートカットを提示します。
- アカウント名はアカウントIDに正規化されます。たとえば、`Ops Bot` は `ops-bot` になります。
- DM許可リストのエントリーは `@user:server` を直接受け付けます。表示名が機能するのは、ライブディレクトリ参照で厳密に1件一致した場合のみです。
- ルーム許可リストのエントリーは、ルームIDとエイリアスを直接受け付けます。`!room:server` または `#alias:server` を推奨します。未解決の名前は実行時の許可リスト解決で無視されます。
- 招待自動参加の許可リストモードでは、安定した招待先のみを使用してください: `!roomId:server`、`#alias:server`、または `*`。プレーンなルーム名は拒否されます。
- 保存前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を使用します。

<Warning>
`channels.matrix.autoJoin` のデフォルトは `off` です。

これを未設定のままにすると、ボットは招待されたルームや新しいDM形式の招待に参加しないため、手動で先に参加しない限り、新しいグループや招待されたDMに表示されません。

受け入れる招待を制限したい場合は、`autoJoin: "allowlist"` と `autoJoinAllowlist` を一緒に設定してください。すべての招待に参加させたい場合は、`autoJoin: "always"` を設定してください。

`allowlist` モードでは、`autoJoinAllowlist` は `!roomId:server`、`#alias:server`、または `*` のみを受け付けます。
</Warning>

許可リストの例:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

すべての招待に参加:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

最小限のトークンベース設定:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

パスワードベースの設定（ログイン後にトークンをキャッシュ）:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrixはキャッシュされた認証情報を `~/.openclaw/credentials/matrix/` に保存します。
デフォルトアカウントでは `credentials.json` を使用し、名前付きアカウントでは `credentials-<account>.json` を使用します。
そこにキャッシュ済み認証情報が存在する場合、現在の認証が設定に直接セットされていなくても、OpenClawはセットアップ、doctor、channel-status検出においてMatrixが設定済みであると見なします。

環境変数の対応名（設定キーが未設定のときに使用されます）:

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

デフォルト以外のアカウントでは、アカウント単位のenv varsを使用します:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

アカウント `ops` の例:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

正規化されたアカウントID `ops-bot` では、次を使用します:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrixは、アカウントID内の句読点をエスケープして、アカウント単位のenv varsが衝突しないようにします。
たとえば、`-` は `_X2D_` になるため、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` に対応します。

対話式ウィザードが環境変数ショートカットを提示するのは、それらの認証env varsがすでに存在し、選択したアカウントにMatrix認証がまだ設定内保存されていない場合のみです。

`MATRIX_HOMESERVER` はワークスペースの `.env` からは設定できません。詳しくは [Workspace `.env` files](/ja-JP/gateway/security) を参照してください。

## 設定例

これは、DMペアリング、ルーム許可リスト、E2EE有効化を含む実用的なベースライン設定です:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` は、DM形式の招待を含むすべてのMatrix招待に適用されます。OpenClawは
招待時点でそのルームがDMかグループかを確実には分類できないため、すべての招待はまず `autoJoin`
を通ります。`dm.policy` は、ボットが参加し、そのルームがDMとして分類された後に適用されます。

## ストリーミングプレビュー

Matrixの返信ストリーミングはオプトインです。

OpenClawに単一のライブプレビュー返信を送信させ、
モデルがテキストを生成している間はそのプレビューをその場で編集し、
返信完了時にそれを確定させたい場合は、`channels.matrix.streaming` を `"partial"` に設定します:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` がデフォルトです。OpenClawは最終返信を待って1回だけ送信します。
- `streaming: "partial"` は、現在のassistant block用に通常のMatrixテキストメッセージとして1つの編集可能なプレビューメッセージを作成します。これにより、Matrixの従来の「プレビュー先行」通知動作が維持されるため、標準クライアントでは完成済みブロックではなく最初のストリーミングされたプレビューテキストで通知される場合があります。
- `streaming: "quiet"` は、現在のassistant block用に1つの編集可能な静かなプレビュー通知を作成します。これは、確定済みプレビュー編集に対する受信者のpush rulesも設定する場合にのみ使用してください。
- `blockStreaming: true` は、個別のMatrix進捗メッセージを有効にします。プレビューストリーミングが有効な場合、Matrixは現在のblockのライブ下書きを維持し、完了済みblockを個別メッセージとして保持します。
- プレビューストリーミングがオンで `blockStreaming` がオフの場合、Matrixはライブ下書きをその場で編集し、blockまたはturnの完了時にその同じeventを確定します。
- プレビューが1つのMatrix eventに収まらなくなった場合、OpenClawはプレビューストリーミングを停止し、通常の最終配信にフォールバックします。
- メディア返信では、引き続き通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClawは最終メディア返信を送る前にそれをredactします。
- プレビュー編集には追加のMatrix API呼び出しコストがかかります。最も保守的なレート制限動作を望む場合は、ストリーミングをオフのままにしてください。

`blockStreaming` だけでは下書きプレビューは有効になりません。
プレビュー編集には `streaming: "partial"` または `streaming: "quiet"` を使用し、そのうえで完了したassistant blockも個別の進捗メッセージとして見せたい場合にのみ `blockStreaming: true` を追加してください。

カスタムpush rulesなしで標準のMatrix通知が必要な場合は、プレビュー先行動作には `streaming: "partial"` を使用し、最終のみの配信には `streaming` をオフのままにしてください。`streaming: "off"` の場合:

- `blockStreaming: true` は、完了した各blockを通常の通知対象Matrixメッセージとして送信します。
- `blockStreaming: false` は、最終的に完了した返信のみを通常の通知対象Matrixメッセージとして送信します。

### 静かな確定済みプレビューのためのセルフホストpush rules

独自のMatrixインフラを運用していて、blockまたは
最終返信が完了したときだけ静かなプレビューで通知したい場合は、`streaming: "quiet"` を設定し、確定済みプレビュー編集用のユーザー単位push ruleを追加します。

これは通常、homeserver全体の設定変更ではなく、受信者ユーザー側の設定です:

開始前の簡単な対応表:

- recipient user = 通知を受け取るべき人
- bot user = 返信を送るOpenClaw Matrixアカウント
- 以下のAPI呼び出しではrecipient userのアクセストークンを使用します
- push ruleの `sender` はbot userの完全なMXIDに一致させます

1. OpenClawを静かなプレビューを使うよう設定します:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. recipientアカウントがすでに通常のMatrix push notificationsを受け取れていることを確認します。静かなプレビュー
   ルールは、そのユーザーがすでに動作するpushers/devicesを持っている場合にのみ機能します。

3. recipient userのアクセストークンを取得します。
   - ボットのトークンではなく、受信ユーザーのトークンを使用してください。
   - 既存のクライアントセッショントークンを再利用するのが通常は最も簡単です。
   - 新しいトークンを発行する必要がある場合は、標準のMatrix Client-Server APIからログインできます:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. recipientアカウントにすでにpushersがあることを確認します:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

これでアクティブなpushers/devicesが返らない場合は、以下の
OpenClawルールを追加する前に、まず通常のMatrix通知を修正してください。

OpenClawは、確定済みのテキストのみのプレビュー編集に次を付与します:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. これらの通知を受け取るべき各recipientアカウントに対してoverride push ruleを作成します:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

コマンド実行前に次の値を置き換えてください:

- `https://matrix.example.org`: あなたのhomeserverのベースURL
- `$USER_ACCESS_TOKEN`: 受信ユーザーのアクセストークン
- `openclaw-finalized-preview-botname`: この受信ユーザーに対するこのボット専用の一意なrule ID
- `@bot:example.org`: 受信ユーザーのMXIDではなく、あなたのOpenClaw Matrix botのMXID

複数ボット構成で重要:

- Push rulesは `ruleId` をキーにします。同じrule IDに対して `PUT` を再実行すると、その1つのruleが更新されます。
- 1人の受信ユーザーが複数のOpenClaw Matrix botアカウントからの通知を受け取る必要がある場合は、各 `sender` 一致ごとに一意のrule IDを使って、botごとに1つのruleを作成してください。
- 単純なパターンは `openclaw-finalized-preview-<botname>` です。たとえば `openclaw-finalized-preview-ops` や `openclaw-finalized-preview-support` です。

このruleはevent senderに対して評価されます:

- 受信ユーザーのトークンで認証する
- `sender` をOpenClaw botのMXIDに一致させる

6. ruleが存在することを確認します:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. ストリーミング返信をテストします。quietモードでは、ルームには静かな下書きプレビューが表示され、最終的な
   インプレース編集はblockまたはturnの完了時に1回通知されるはずです。

後でruleを削除する必要がある場合は、受信ユーザーのトークンを使って同じrule IDを削除します:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

注記:

- ruleはbotのものではなく、受信ユーザーのアクセストークンで作成してください。
- 新しいユーザー定義 `override` rulesはデフォルトの抑制rulesより前に挿入されるため、追加の順序パラメーターは不要です。
- これは、OpenClawが安全にインプレース確定できるテキストのみのプレビュー編集にのみ影響します。メディアフォールバックや古いプレビューフォールバックでは、引き続き通常のMatrix配信が使われます。
- `GET /_matrix/client/v3/pushers` でpushersが表示されない場合、そのユーザーはまだこのアカウント/デバイスに対する動作するMatrix push配信を持っていません。

#### Synapse

Synapseでは、通常は上記のセットアップだけで十分です:

- 確定済みOpenClawプレビュー通知のために特別な `homeserver.yaml` の変更は不要です。
- Synapseデプロイですでに通常のMatrix push notificationsが送信されている場合、主なセットアップ手順は上記のユーザートークン + `pushrules` 呼び出しです。
- Synapseをリバースプロキシまたはworkerの背後で実行している場合は、`/_matrix/client/.../pushrules/` が正しくSynapseに到達することを確認してください。
- Synapse workersを実行している場合は、pushersが健全であることを確認してください。push配信はメインプロセスまたは `synapse.app.pusher` / 設定済みのpusher workersによって処理されます。

#### Tuwunel

Tuwunelでは、上記と同じセットアップフローとpush-rule API呼び出しを使用します:

- 確定済みプレビューマーカー自体のために、Tuwunel固有の設定は不要です。
- そのユーザーに対して通常のMatrix通知がすでに機能している場合、主なセットアップ手順は上記のユーザートークン + `pushrules` 呼び出しです。
- ユーザーが別のデバイスでアクティブな間に通知が消えるように見える場合は、`suppress_push_when_active` が有効になっているか確認してください。Tuwunelは2025年9月12日のTuwunel 1.4.2でこのオプションを追加しており、1つのデバイスがアクティブな間、他のデバイスへのpushを意図的に抑制することがあります。

## Bot-to-botルーム

デフォルトでは、他の設定済みOpenClaw MatrixアカウントからのMatrixメッセージは無視されます。

意図的にagent間のMatrix通信を許可したい場合は、`allowBots` を使用します:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` は、許可されたルームとDMで、他の設定済みMatrix botアカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルームではそれらのメッセージがこのbotに明示的にメンションしている場合にのみ受け入れます。DMは引き続き許可されます。
- `groups.<room>.allowBots` は、1つのルームに対してアカウントレベル設定を上書きします。
- OpenClawは自己返信ループを避けるため、同じMatrix user IDからのメッセージは引き続き無視します。
- Matrixはここでネイティブのbotフラグを公開していません。OpenClawは「bot-authored」を「このOpenClaw Gateway上の別の設定済みMatrixアカウントから送信されたもの」として扱います。

共有ルームでbot-to-bot通信を有効にする場合は、厳格なルーム許可リストとメンション要件を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信する画像eventは `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは、引き続きプレーンな `thumbnail_url` を使用します。設定は不要で、PluginがE2EE状態を自動検出します。

暗号化を有効化:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

検証状態を確認:

```bash
openclaw matrix verify status
```

詳細な状態表示（完全な診断情報）:

```bash
openclaw matrix verify status --verbose
```

保存されたリカバリーキーを機械可読出力に含める:

```bash
openclaw matrix verify status --include-recovery-key --json
```

クロス署名と検証状態をブートストラップ:

```bash
openclaw matrix verify bootstrap
```

詳細なブートストラップ診断:

```bash
openclaw matrix verify bootstrap --verbose
```

ブートストラップ前に新しいクロス署名IDのリセットを強制:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

リカバリーキーでこのデバイスを検証:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

詳細なデバイス検証情報:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

ルームキーbackupの健全性を確認:

```bash
openclaw matrix verify backup status
```

詳細なbackup健全性診断:

```bash
openclaw matrix verify backup status --verbose
```

サーバーbackupからルームキーを復元:

```bash
openclaw matrix verify backup restore
```

詳細な復元診断:

```bash
openclaw matrix verify backup restore --verbose
```

現在のサーバーbackupを削除し、新しいbackupベースラインを作成します。保存された
backupキーを正常に読み込めない場合、このリセットではシークレットストレージも再作成して、
将来のコールドスタートで新しいbackupキーを読み込めるようにすることがあります:

```bash
openclaw matrix verify backup reset --yes
```

すべての `verify` コマンドはデフォルトでは簡潔な出力（静かな内部SDKロギングを含む）で、詳細な診断は `--verbose` を付けた場合のみ表示します。
スクリプトで使用する場合は、完全な機械可読出力のために `--json` を使ってください。

複数アカウント構成では、Matrix CLIコマンドは `--account <id>` を渡さない限り、暗黙のMatrixデフォルトアカウントを使用します。
複数の名前付きアカウントを設定している場合は、まず `channels.matrix.defaultAccount` を設定してください。そうしないと、これらの暗黙的なCLI操作は停止して、明示的にアカウントを選ぶよう求めます。
検証やデバイス操作を明示的に名前付きアカウントに向けたい場合は、`--account` を使用してください:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

名前付きアカウントで暗号化が無効または利用できない場合、Matrixの警告と検証エラーはそのアカウントの設定キーを指します。たとえば `channels.matrix.accounts.assistant.encryption` です。

### 「verified」の意味

OpenClawは、このMatrixデバイスが自分自身のクロス署名IDによって検証された場合にのみ、そのデバイスをverifiedとして扱います。
実際には、`openclaw matrix verify status --verbose` は3つの信頼シグナルを表示します:

- `Locally trusted`: このデバイスは現在のクライアントでのみ信頼されています
- `Cross-signing verified`: SDKはこのデバイスがクロス署名を通じて検証済みであると報告しています
- `Signed by owner`: このデバイスは自分自身のself-signing keyで署名されています

`Verified by owner` が `yes` になるのは、クロス署名による検証またはowner署名が存在する場合のみです。
ローカル信頼だけでは、OpenClawがそのデバイスを完全にverifiedとして扱うには不十分です。

### bootstrapが行うこと

`openclaw matrix verify bootstrap` は、暗号化されたMatrixアカウントの修復およびセットアップ用コマンドです。
次のすべてを順に行います:

- 可能なら既存のリカバリーキーを再利用しながら、シークレットストレージをブートストラップする
- クロス署名をブートストラップし、不足している公開クロス署名キーをアップロードする
- 現在のデバイスに印を付けてクロス署名することを試みる
- まだ存在しない場合は、新しいサーバー側ルームキーbackupを作成する

homeserverがクロス署名キーのアップロードに対話型認証を必要とする場合、OpenClawはまず認証なしでアップロードを試し、その後 `m.login.dummy`、さらに `channels.matrix.password` が設定されている場合は `m.login.password` を使って試します。

現在のクロス署名IDを破棄して新しいものを作成したい場合にのみ、`--force-reset-cross-signing` を使用してください。

現在のルームキーbackupを意図的に破棄し、今後のメッセージ向けに新しい
backupベースラインを開始したい場合は、`openclaw matrix verify backup reset --yes` を使用してください。
これは、回復不能な古い暗号化履歴が引き続き利用不能のままであることと、
現在のbackupシークレットを安全に読み込めない場合にOpenClawがシークレットストレージを再作成する可能性があることを受け入れる場合にのみ行ってください。

### 新しいbackupベースライン

将来の暗号化メッセージを機能させ続けつつ、回復不能な古い履歴の喪失を受け入れる場合は、次のコマンドを順に実行してください:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

名前付きMatrixアカウントを明示的に対象にしたい場合は、各コマンドに `--account <id>` を追加してください。

### 起動時の動作

`encryption: true` の場合、Matrixは `startupVerification` のデフォルトを `"if-unverified"` にします。
起動時にこのデバイスがまだ未検証であれば、Matrixは別のMatrixクライアントでの自己検証を要求し、
すでに保留中の要求がある間は重複要求をスキップし、再起動後の再試行前にローカルのクールダウンを適用します。
デフォルトでは、要求の作成に成功した場合よりも、要求試行に失敗した場合の方が早く再試行されます。
起動時の自動要求を無効にするには `startupVerification: "off"` を設定するか、再試行ウィンドウを短くまたは長くしたい場合は `startupVerificationCooldownHours`
を調整してください。

起動時には、保守的なcrypto bootstrapパスも自動で実行されます。
このパスは、まず現在のシークレットストレージとクロス署名IDの再利用を試み、明示的なbootstrap修復フローを実行しない限りクロス署名のリセットを避けます。

起動時にまだ壊れたbootstrap状態が見つかる場合、OpenClawは `channels.matrix.password` が設定されていなくても、保護された修復パスを試みることができます。
homeserverがその修復にパスワードベースのUIAを必要とする場合、OpenClawは警告をログに記録し、botを中断するのではなく、起動を非致命的なまま維持します。
現在のデバイスがすでにowner署名済みである場合、OpenClawはそのIDを自動的にリセットせず保持します。

完全なアップグレードフロー、制限事項、復旧コマンド、一般的な移行メッセージについては、[Matrix migration](/ja-JP/install/migrating-matrix)を参照してください。

### 検証通知

Matrixは、検証ライフサイクル通知を厳格なDM検証ルームに `m.notice` メッセージとして直接投稿します。
これには次が含まれます:

- 検証要求通知
- 検証準備完了通知（明示的な「絵文字で検証」案内付き）
- 検証開始および完了通知
- 利用可能な場合のSAS詳細（絵文字および10進数）

別のMatrixクライアントからの受信検証要求は、OpenClawによって追跡され、自動受諾されます。
自己検証フローでは、絵文字検証が利用可能になるとOpenClawはSASフローも自動開始し、自身の側を確認します。
別のMatrixユーザー/デバイスからの検証要求については、OpenClawは要求を自動受諾し、その後SASフローが通常どおり進むのを待ちます。
検証を完了するには、引き続きMatrixクライアントで絵文字または10進数のSASを比較し、そこで「一致する」を確認する必要があります。

OpenClawは、自己開始の重複フローを無条件には自動受諾しません。自己検証要求がすでに保留中の場合、起動時には新しい要求の作成をスキップします。

検証プロトコル/システム通知はagentチャットパイプラインには転送されないため、`NO_REPLY` は生成されません。

### デバイス衛生

古いOpenClaw管理のMatrixデバイスがアカウントに蓄積し、暗号化ルームの信頼状態が把握しにくくなることがあります。
次のコマンドで一覧表示します:

```bash
openclaw matrix devices list
```

古くなったOpenClaw管理デバイスを削除するには:

```bash
openclaw matrix devices prune-stale
```

### Crypto store

Matrix E2EEは、Nodeで公式の`matrix-js-sdk`のRust cryptoパスを使用し、IndexedDB shimとして`fake-indexeddb`を使います。Crypto状態はスナップショットファイル（`crypto-idb-snapshot.json`）に永続化され、起動時に復元されます。スナップショットファイルは機微なランタイム状態であり、制限的なファイル権限で保存されます。

暗号化されたランタイム状態は、アカウントごと・ユーザーのトークンハッシュごとのルート配下、
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`
に保存されます。
このディレクトリには、sync store（`bot-storage.json`）、crypto store（`crypto/`）、
recovery keyファイル（`recovery-key.json`）、IndexedDBスナップショット（`crypto-idb-snapshot.json`）、
thread bindings（`thread-bindings.json`）、およびstartup verification state（`startup-verification.json`）が含まれます。
トークンが変わってもアカウントIDが同じである場合、OpenClawはそのaccount/homeserver/userタプルに対して最適な既存ルートを再利用するため、以前のsync state、crypto state、thread bindings、
およびstartup verification stateは引き続き見えるままです。

## プロファイル管理

選択したアカウントのMatrix self-profileを更新するには、次を実行します:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

明示的に名前付きMatrixアカウントを対象にしたい場合は、`--account <id>` を追加してください。

Matrixは `mxc://` のavatar URLを直接受け付けます。`http://` または `https://` のavatar URLを渡した場合、OpenClawはまずそれをMatrixにアップロードし、解決された `mxc://` URLを `channels.matrix.avatarUrl`（または選択したアカウントのoverride）に書き戻します。

## スレッド

Matrixは、自動返信とmessage-tool送信の両方について、ネイティブのMatrixスレッドをサポートしています。

- `dm.sessionScope: "per-user"`（デフォルト）は、Matrix DMルーティングを送信者スコープのまま維持するため、同じ相手に解決される複数のDMルームで1つのセッションを共有できます。
- `dm.sessionScope: "per-room"` は、通常のDM認証および許可リストチェックを使いつつ、各Matrix DMルームをそれぞれ独自のセッションキーに分離します。
- 明示的なMatrix conversation bindingsは引き続き `dm.sessionScope` より優先されるため、bind済みのルームとスレッドは選択された対象セッションを維持します。
- `threadReplies: "off"` は、返信をトップレベルに維持し、受信したスレッド付きメッセージを親セッション上に維持します。
- `threadReplies: "inbound"` は、受信メッセージがすでにそのスレッド内にある場合にのみ、そのスレッド内で返信します。
- `threadReplies: "always"` は、ルーム返信をトリガーとなったメッセージをルートとするスレッド内に維持し、その会話を最初のトリガーメッセージから対応するthread-scoped session経由でルーティングします。
- `dm.threadReplies` は、DMに対してのみトップレベル設定を上書きします。たとえば、ルームスレッドは分離したまま、DMはフラットに保てます。
- 受信したスレッド付きメッセージには、追加のagentコンテキストとしてスレッドルートメッセージが含まれます。
- Message-tool送信は、対象が同じルーム、または同じDM user targetである場合、明示的な `threadId` が指定されていなければ、現在のMatrixスレッドを自動継承します。
- 同一セッションでのDM user target再利用は、現在のセッションメタデータが同じMatrixアカウント上の同じDM相手を証明している場合にのみ有効です。そうでない場合、OpenClawは通常のuser-scoped routingにフォールバックします。
- OpenClawが、あるMatrix DMルームが同じ共有Matrix DM session上の別のDMルームと衝突していることを検出すると、thread bindingsが有効で `dm.sessionScope` のヒントがある場合、そのルームに1回限りの `m.notice` を `/focus` エスケープハッチ付きで投稿します。
- Matrixではランタイムthread bindingsがサポートされます。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドにbindされた `/acp spawn` は、MatrixルームとDMで動作します。
- トップレベルのMatrixルーム/DMでの `/focus` は、`threadBindings.spawnSubagentSessions=true` の場合、新しいMatrixスレッドを作成し、それを対象セッションにbindします。
- 既存のMatrixスレッド内で `/focus` または `/acp spawn --thread here` を実行した場合は、代わりにその現在のスレッドをbindします。

## ACP会話bindings

Matrixルーム、DM、および既存のMatrixスレッドは、チャットの見た目を変えずに永続的なACP workspaceに変換できます。

高速なオペレーターフロー:

- 使い続けたいMatrix DM、ルーム、または既存スレッドの中で `/acp spawn codex --bind here` を実行します。
- トップレベルのMatrix DMまたはルームでは、現在のDM/ルームがそのままチャット画面として維持され、以後のメッセージは生成されたACP sessionにルーティングされます。
- 既存のMatrixスレッド内では、`--bind here` はその現在のスレッドをその場でbindします。
- `/new` と `/reset` は、同じbind済みACP sessionをその場でリセットします。
- `/acp close` はACP sessionを閉じてbindingを解除します。

注記:

- `--bind here` は子Matrixスレッドを作成しません。
- `threadBindings.spawnAcpSessions` が必要なのは `/acp spawn --thread auto|here` の場合だけで、このときOpenClawは子Matrixスレッドを作成またはbindする必要があります。

### スレッドbinding設定

Matrixは `session.threadBindings` からグローバルデフォルトを継承し、channelごとのoverrideもサポートします:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrixのスレッドbind付きspawnフラグはオプトインです:

- トップレベルの `/focus` が新しいMatrixスレッドを作成してbindできるようにするには、`threadBindings.spawnSubagentSessions: true` を設定します。
- `/acp spawn --thread auto|here` がACP sessionsをMatrixスレッドにbindできるようにするには、`threadBindings.spawnAcpSessions: true` を設定します。

## リアクション

Matrixは、送信リアクションアクション、受信リアクション通知、および受信ack reactionsをサポートしています。

- 送信リアクションtoolingは `channels["matrix"].actions.reactions` によって制御されます。
- `react` は特定のMatrix eventにリアクションを追加します。
- `reactions` は特定のMatrix eventの現在のリアクション要約を一覧表示します。
- `emoji=""` は、そのevent上のbotアカウント自身のリアクションを削除します。
- `remove: true` は、botアカウントの指定した絵文字リアクションのみを削除します。

Ack reactionsは、標準のOpenClaw解決順序を使用します:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- agent identity絵文字フォールバック

Ack reactionのスコープは次の順序で解決されます:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

リアクション通知モードは次の順序で解決されます:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- デフォルト: `own`

動作:

- `reactionNotifications: "own"` は、botが作成したMatrixメッセージを対象とする追加された `m.reaction` eventsを転送します。
- `reactionNotifications: "off"` は、リアクションのsystem eventsを無効にします。
- リアクション削除はsystem eventsとして合成されません。Matrixではそれらは独立した `m.reaction` 削除ではなくredactionsとして表現されるためです。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrixルームメッセージがagentをトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックし、両方とも未設定の場合の実効デフォルトは `0` です。無効にするには `0` を設定します。
- Matrixルーム履歴はルーム専用です。DMは引き続き通常のセッション履歴を使用します。
- Matrixルーム履歴は保留中のみです。OpenClawはまだ返信をトリガーしていないルームメッセージをバッファし、メンションやその他のトリガーが来たときにそのウィンドウをスナップショットします。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのturnのメインの受信本文に残ります。
- 同じMatrix eventの再試行では、より新しいルームメッセージへ前進してしまうことなく、元の履歴スナップショットを再利用します。

## コンテキスト可視性

Matrixは、取得した返信テキスト、スレッドルート、保留中履歴などの補助的なルームコンテキストに対して、共有の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補助コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブなルーム/ユーザー許可リストチェックで許可された送信者に補助コンテキストを絞り込みます。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、1つの明示的な引用返信は保持します。

この設定は補助コンテキストの可視性に影響し、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガーの認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、およびDM policy設定から行われます。

## DMとルームのポリシー

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

メンション制限と許可リストの動作については、[Groups](/ja-JP/channels/groups)を参照してください。

Matrix DMのペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認のMatrixユーザーが承認前に繰り返しメッセージを送ってきた場合、OpenClawは同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに、短いクールダウン後に再度リマインダー返信を送ることがあります。

共有のDMペアリングフローとストレージレイアウトについては、[Pairing](/ja-JP/channels/pairing)を参照してください。

## ダイレクトルーム修復

ダイレクトメッセージ状態の同期が崩れると、OpenClawはライブDMではなく古いソロルームを指す古い `m.direct` マッピングを持ってしまうことがあります。相手に対する現在のマッピングを確認するには、次を実行します:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修復フローは次のように動作します:

- `m.direct` にすでにマップされている厳格な1対1のDMを優先する
- それがなければ、そのユーザーとの現在参加中の厳格な1対1のDMにフォールバックする
- 健全なDMが存在しない場合は、新しいダイレクトルームを作成し、`m.direct` を書き換える

修復フローは古いルームを自動では削除しません。健全なDMを選んでマッピングを更新するだけなので、新しいMatrix送信、検証通知、その他のダイレクトメッセージフローが再び正しいルームを対象にするようになります。

## Exec approvals

Matrixは、Matrixアカウント用のネイティブapproval clientとして機能できます。ネイティブの
DM/channel routing knobsは、引き続きexec approval設定配下にあります:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（任意。`channels.matrix.dm.allowFrom` にフォールバック）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

承認者は `@owner:example.org` のようなMatrix user IDである必要があります。`enabled` が未設定または `"auto"` で、少なくとも1人の承認者を解決できる場合、Matrixはネイティブapprovalを自動有効化します。Exec approvalsはまず `execApprovals.approvers` を使用し、`channels.matrix.dm.allowFrom` にフォールバックできます。Plugin approvalsは `channels.matrix.dm.allowFrom` を通じて認可されます。Matrixをネイティブapproval clientとして明示的に無効にするには、`enabled: false` を設定してください。それ以外の場合、approval requestsは他の設定済みapproval routesまたはapproval fallback policyにフォールバックします。

Matrixネイティブルーティングは両方のapproval種別をサポートします:

- `channels.matrix.execApprovals.*` は、Matrix approval promptsのネイティブDM/channel fanoutモードを制御します。
- Exec approvalsは、`execApprovals.approvers` または `channels.matrix.dm.allowFrom` からのexec approverセットを使用します。
- Plugin approvalsは、`channels.matrix.dm.allowFrom` のMatrix DM許可リストを使用します。
- Matrixのリアクションショートカットとメッセージ更新は、exec approvalsとplugin approvalsの両方に適用されます。

配信ルール:

- `target: "dm"` は、approval promptsを承認者DMへ送信します
- `target: "channel"` は、プロンプトを元のMatrixルームまたはDMへ送り返します
- `target: "both"` は、承認者DMと元のMatrixルームまたはDMの両方へ送信します

Matrix approval promptsは、主要なapproval message上にリアクションショートカットを設定します:

- `✅` = 今回のみ許可
- `❌` = 拒否
- `♾️` = 実効exec policyでその判断が許可されている場合は常に許可

承認者は、そのメッセージにリアクションするか、フォールバックのスラッシュコマンド `/approve <id> allow-once`、`/approve <id> allow-always`、または `/approve <id> deny` を使えます。

承認または拒否できるのは、解決済みの承認者だけです。exec approvalsでは、channel配信にはコマンドテキストが含まれるため、`channel` または `both` は信頼できるルームでのみ有効にしてください。

アカウントごとのoverride:

- `channels.matrix.accounts.<account>.execApprovals`

関連ドキュメント: [Exec approvals](/ja-JP/tools/exec-approvals)

## スラッシュコマンド

Matrixのスラッシュコマンド（たとえば `/new`、`/reset`、`/model`）はDMで直接動作します。ルームでは、OpenClawはボット自身のMatrixメンションを前置したスラッシュコマンドも認識するため、`@bot:server /new` はカスタムのメンション正規表現を必要とせずにコマンドパスをトリガーします。これにより、ユーザーがコマンド入力前にタブ補完でボットを指定したときにElementなどのクライアントが送信する、ルーム形式の `@mention /command` 投稿にもボットが反応し続けられます。

認可ルールは引き続き適用されます。コマンド送信者は、通常のメッセージと同様にDMまたはルームの許可リスト/ownerポリシーを満たす必要があります。

## マルチアカウント

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

トップレベルの `channels.matrix` の値は、アカウント側で上書きされない限り、名前付きアカウントのデフォルトとして機能します。
継承されたルームエントリーを1つのMatrixアカウントに限定するには `groups.<room>.account` を使います。
`account` を持たないエントリーはすべてのMatrixアカウント間で共有されたままとなり、`account: "default"` を持つエントリーも、デフォルトアカウントがトップレベルの `channels.matrix.*` に直接設定されている場合は引き続き機能します。
共有された部分的な認証デフォルトだけでは、それ自体で別個の暗黙のデフォルトアカウントは作成されません。OpenClawがトップレベルの `default` アカウントを合成するのは、そのデフォルトに新しい認証情報（`homeserver` + `accessToken`、または `homeserver` + `userId` と `password`）がある場合のみです。名前付きアカウントは、後でキャッシュ済み認証情報が認証を満たす場合、`homeserver` + `userId` からでも引き続き検出可能です。
Matrixにすでにちょうど1つの名前付きアカウントがある場合、または `defaultAccount` が既存の名前付きアカウントキーを指している場合、単一アカウントからマルチアカウントへの修復/セットアップ昇格では、新しい `accounts.default` エントリーを作る代わりにそのアカウントが保持されます。昇格されたアカウントに移動するのはMatrixの認証/bootstrapキーだけで、共有の配信ポリシーキーはトップレベルに残ります。
暗黙的なルーティング、probe、CLI操作でOpenClawに特定の名前付きMatrixアカウントを優先させたい場合は、`defaultAccount` を設定してください。
複数のMatrixアカウントが設定されていて、そのうち1つのアカウントidが `default` である場合、`defaultAccount` が未設定でもOpenClawはそのアカウントを暗黙的に使用します。
複数の名前付きアカウントを設定する場合は、暗黙的なアカウント選択に依存するCLIコマンドでは `defaultAccount` を設定するか、`--account <id>` を渡してください。
1つのコマンドだけその暗黙選択を上書きしたい場合は、`openclaw matrix verify ...` と `openclaw matrix devices ...` に `--account <id>` を渡してください。

共有マルチアカウントパターンについては、[Configuration reference](/ja-JP/gateway/configuration-reference#multi-account-all-channels)を参照してください。

## プライベート/LAN homeserver

デフォルトでは、OpenClawはSSRF保護のため、プライベート/内部Matrix homeserverへの接続をブロックします。アカウントごとに
明示的にオプトインした場合のみ許可されます。

homeserverがlocalhost、LAN/Tailscale IP、または内部ホスト名で動作している場合は、
そのMatrixアカウントで `network.dangerouslyAllowPrivateNetwork` を有効にしてください:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLIセットアップ例:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

このオプトインで許可されるのは、信頼されたプライベート/内部ターゲットのみです。`http://matrix.example.org:8008` のような
公開プレーンテキストhomeserverは引き続きブロックされます。可能な限り `https://` を使用してください。

## Matrixトラフィックのプロキシ

Matrixデプロイで明示的な送信HTTP(S)プロキシが必要な場合は、`channels.matrix.proxy` を設定してください:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

名前付きアカウントは、`channels.matrix.accounts.<id>.proxy` でトップレベルのデフォルトを上書きできます。
OpenClawは、ランタイムのMatrixトラフィックとアカウント状態probeの両方に同じプロキシ設定を使用します。

## ターゲット解決

Matrixは、OpenClawがルームまたはユーザーターゲットを求めるあらゆる場所で、次のターゲット形式を受け付けます:

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

ライブディレクトリ参照は、ログイン中のMatrixアカウントを使用します:

- ユーザー参照は、そのhomeserver上のMatrix user directoryに問い合わせます。
- ルーム参照は、明示的なルームIDとエイリアスを直接受け付け、その後、そのアカウントの参加済みルーム名の検索にフォールバックします。
- 参加済みルーム名の参照はベストエフォートです。ルーム名をIDまたはエイリアスに解決できない場合、ランタイムの許可リスト解決では無視されます。

## 設定リファレンス

- `enabled`: channelを有効または無効にします。
- `name`: アカウントの任意ラベル。
- `defaultAccount`: 複数のMatrixアカウントが設定されている場合の優先アカウントID。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このMatrixアカウントがプライベート/内部homeserverに接続することを許可します。homeserverが `localhost`、LAN/Tailscale IP、または `matrix-synapse` のような内部ホストに解決される場合に有効化してください。
- `proxy`: Matrixトラフィック用の任意のHTTP(S)プロキシURL。名前付きアカウントは独自の `proxy` でトップレベルデフォルトを上書きできます。
- `userId`: 完全なMatrix user ID。例: `@bot:example.org`。
- `accessToken`: トークンベース認証用のアクセストークン。プレーンテキスト値とSecretRef値は、env/file/exec providers全体で `channels.matrix.accessToken` および `channels.matrix.accounts.<id>.accessToken` に対応しています。詳しくは [Secrets Management](/ja-JP/gateway/secrets) を参照してください。
- `password`: パスワードベースログイン用パスワード。プレーンテキスト値とSecretRef値に対応しています。
- `deviceId`: 明示的なMatrix device ID。
- `deviceName`: パスワードログイン用のデバイス表示名。
- `avatarUrl`: プロファイル同期および `profile set` 更新用に保存されるself-avatar URL。
- `initialSyncLimit`: 起動時syncで取得するeventの最大数。
- `encryption`: E2EEを有効にします。
- `allowlistOnly`: `true` の場合、`open` ルームポリシーを `allowlist` に引き上げ、`disabled` 以外のすべてのアクティブなDMポリシー（`pairing` と `open` を含む）を `allowlist` に強制します。`disabled` ポリシーには影響しません。
- `allowBots`: 他の設定済みOpenClaw Matrixアカウントからのメッセージを許可します（`true` または `"mentions"`）。
- `groupPolicy`: `open`、`allowlist`、または `disabled`。
- `contextVisibility`: 補助的なルームコンテキストの可視性モード（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`: ルームトラフィック用のユーザーID許可リスト。完全なMatrix user IDが最も安全です。厳密なディレクトリ一致は、起動時およびmonitor実行中に許可リストが変更されたときに解決されます。未解決の名前は無視されます。
- `historyLimit`: グループ履歴コンテキストとして含めるルームメッセージの最大数。`messages.groupChat.historyLimit` にフォールバックし、両方とも未設定の場合の実効デフォルトは `0` です。無効にするには `0` を設定します。
- `replyToMode`: `off`、`first`、`all`、または `batched`。
- `markdown`: 送信Matrixテキスト用の任意のMarkdownレンダリング設定。
- `streaming`: `off`（デフォルト）、`"partial"`、`"quiet"`、`true`、または `false`。`"partial"` と `true` は、通常のMatrixテキストメッセージによるプレビュー先行の下書き更新を有効にします。`"quiet"` は、セルフホストpush-rule構成向けに通知しないプレビュー通知を使います。`false` は `"off"` と同等です。
- `blockStreaming`: `true` は、下書きプレビューストリーミングが有効な間、完了したassistant blockごとに個別の進捗メッセージを有効にします。
- `threadReplies`: `off`、`inbound`、または `always`。
- `threadBindings`: スレッドにbindされたセッションルーティングとライフサイクルに対するchannelごとのoverride。
- `startupVerification`: 起動時の自動自己検証要求モード（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`: 自動起動時検証要求の再試行前クールダウン。
- `textChunkLimit`: 送信メッセージの文字数ベースchunkサイズ（`chunkMode` が `length` の場合に適用）。
- `chunkMode`: `length` は文字数でメッセージを分割し、`newline` は改行境界で分割します。
- `responsePrefix`: このchannelのすべての送信返信の先頭に付ける任意の文字列。
- `ackReaction`: このchannel/アカウント用の任意のack reaction override。
- `ackReactionScope`: 任意のack reactionスコープoverride（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`: 受信リアクション通知モード（`own`、`off`）。
- `mediaMaxMb`: 送信および受信メディア処理のメディアサイズ上限（MB）。
- `autoJoin`: 招待の自動参加ポリシー（`always`、`allowlist`、`off`）。デフォルト: `off`。DM形式の招待を含むすべてのMatrix招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `allowlist` のときに許可されるルーム/エイリアス。エイリアスエントリーは招待処理中にルームIDへ解決されます。OpenClawは、招待されたルームが主張するエイリアス状態を信頼しません。
- `dm`: DMポリシーブロック（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`: OpenClawがルームに参加し、それをDMとして分類した後のDMアクセスを制御します。招待を自動参加するかどうかは変更しません。
- `dm.allowFrom`: DMトラフィック用のユーザーID許可リスト。完全なMatrix user IDが最も安全です。厳密なディレクトリ一致は、起動時およびmonitor実行中に許可リストが変更されたときに解決されます。未解決の名前は無視されます。
- `dm.sessionScope`: `per-user`（デフォルト）または `per-room`。相手が同じでも各Matrix DMルームで別々のコンテキストを維持したい場合は `per-room` を使用します。
- `dm.threadReplies`: DM専用のスレッドポリシーoverride（`off`、`inbound`、`always`）。DMにおける返信配置とセッション分離の両方について、トップレベルの `threadReplies` 設定を上書きします。
- `execApprovals`: Matrixネイティブのexec approval配信（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`: exec requestを承認できるMatrix user ID。`dm.allowFrom` がすでに承認者を特定している場合は任意です。
- `execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。
- `accounts`: 名前付きのアカウントごとのoverride。トップレベルの `channels.matrix` 値は、これらのエントリーのデフォルトとして機能します。
- `groups`: ルームごとのポリシーマップ。ルームIDまたはエイリアスを推奨します。未解決のルーム名はランタイムで無視されます。セッション/グループIDは、解決後の安定したルームIDを使用します。
- `groups.<room>.account`: マルチアカウント構成で、継承された1つのルームエントリーを特定のMatrixアカウントに制限します。
- `groups.<room>.allowBots`: 設定済みbot送信者に対するルームレベルoverride（`true` または `"mentions"`）。
- `groups.<room>.users`: ルームごとの送信者許可リスト。
- `groups.<room>.tools`: ルームごとのtool許可/拒否override。
- `groups.<room>.autoReply`: ルームレベルのメンション制限override。`true` はそのルームのメンション必須を無効化し、`false` は再び有効化します。
- `groups.<room>.skills`: 任意のルームレベルskillフィルター。
- `groups.<room>.systemPrompt`: 任意のルームレベルsystem promptスニペット。
- `rooms`: `groups` のレガシーエイリアス。
- `actions`: アクションごとのtool制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのchannel
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション制限
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
