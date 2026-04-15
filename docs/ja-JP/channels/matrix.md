---
read_when:
    - OpenClawでのMatrixのセットアップ
    - MatrixのE2EEと検証の設定
summary: Matrixのサポート状況、セットアップ、設定例
title: Matrix
x-i18n:
    generated_at: "2026-04-15T04:43:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 631f6fdcfebc23136c1a66b04851a25c047535d13cceba5650b8b421bc3afcf8
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

MatrixはOpenClawのバンドル済みチャネルPluginです。
公式の`matrix-js-sdk`を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EEをサポートします。

## バンドル済みPlugin

Matrixは現在のOpenClawリリースではバンドル済みPluginとして提供されるため、通常の
パッケージ済みビルドでは別途インストールは不要です。

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
   - 現在のパッケージ済みOpenClawリリースにはすでにバンドルされています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. homeserverでMatrixアカウントを作成します。
3. `channels.matrix`を次のいずれかで設定します:
   - `homeserver` + `accessToken`、または
   - `homeserver` + `userId` + `password`。
4. Gatewayを再起動します。
5. ボットとのDMを開始するか、ルームに招待します。
   - 新規のMatrix招待は、`channels.matrix.autoJoin`で許可されている場合にのみ機能します。

対話型セットアップのパス:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrixウィザードが尋ねる項目:

- homeserver URL
- 認証方法: access token または password
- ユーザーID（password認証のみ）
- 任意のデバイス名
- E2EEを有効にするか
- ルームアクセスと招待自動参加を設定するか

ウィザードの主な動作:

- Matrix認証env varがすでに存在し、そのアカウントの認証情報がまだconfigに保存されていない場合、ウィザードは認証をenv varに保持するためのenvショートカットを提示します。
- アカウント名はアカウントIDに正規化されます。たとえば、`Ops Bot`は`ops-bot`になります。
- DM allowlistエントリは`@user:server`をそのまま受け付けます。表示名は、ライブディレクトリ検索で完全一致が1件見つかった場合にのみ機能します。
- ルームallowlistエントリは、ルームIDとエイリアスをそのまま受け付けます。`!room:server`または`#alias:server`を推奨します。未解決の名前はallowlist解決時に実行時に無視されます。
- 招待自動参加のallowlistモードでは、安定した招待対象のみを使用してください: `!roomId:server`、`#alias:server`、または`*`。通常のルーム名は拒否されます。
- 保存前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"`を使用します。

<Warning>
`channels.matrix.autoJoin`のデフォルトは`off`です。

未設定のままにすると、ボットは招待されたルームや新しいDM形式の招待に参加しないため、手動で先に参加しない限り、新しいグループや招待されたDMには表示されません。

受け入れる招待を制限したい場合は、`autoJoin: "allowlist"`と`autoJoinAllowlist`を一緒に設定するか、すべての招待に参加させたい場合は`autoJoin: "always"`を設定してください。

`allowlist`モードでは、`autoJoinAllowlist`は`!roomId:server`、`#alias:server`、または`*`のみ受け付けます。
</Warning>

allowlistの例:

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

最小構成のトークンベースセットアップ:

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

パスワードベースのセットアップ（ログイン後にトークンがキャッシュされます）:

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

Matrixはキャッシュ済み認証情報を`~/.openclaw/credentials/matrix/`に保存します。
デフォルトアカウントは`credentials.json`を使用し、名前付きアカウントは`credentials-<account>.json`を使用します。
そこにキャッシュ済み認証情報が存在する場合、現在の認証がconfigに直接設定されていなくても、OpenClawはセットアップ、doctor、チャネルステータス検出においてMatrixを設定済みとして扱います。

環境変数の対応（configキーが設定されていない場合に使用されます）:

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

デフォルト以外のアカウントでは、アカウントスコープ付きenv varを使用します:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

アカウント`ops`の例:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

正規化されたアカウントID`ops-bot`では、次を使用します:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

MatrixはアカウントID内の句読点をエスケープして、スコープ付きenv varの衝突を防ぎます。
たとえば、`-`は`_X2D_`になるため、`ops-prod`は`MATRIX_OPS_X2D_PROD_*`にマップされます。

対話型ウィザードがenv-varショートカットを提示するのは、それらの認証env varがすでに存在し、選択したアカウントにMatrix認証がまだconfigへ保存されていない場合のみです。

## 設定例

これは、DM pairing、ルームallowlist、E2EE有効化を含む実用的なベースライン設定です:

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

`autoJoin`はDM形式の招待を含むすべてのMatrix招待に適用されます。OpenClawは招待時点では
招待されたルームをDMかグループかとして確実に分類できないため、すべての招待は最初に`autoJoin`を通過します。
`dm.policy`は、ボットが参加し、そのルームがDMとして分類された後に適用されます。

## ストリーミングプレビュー

Matrixの返信ストリーミングはオプトインです。

OpenClawに単一のライブプレビュー返信を送信させ、モデルのテキスト生成中にそのプレビューをその場で編集し、
返信完了時に確定させたい場合は、`channels.matrix.streaming`を`"partial"`に設定します:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"`がデフォルトです。OpenClawは最終返信を待ってから1回だけ送信します。
- `streaming: "partial"`は、現在のアシスタントブロック用に通常のMatrixテキストメッセージを使った編集可能なプレビューメッセージを1つ作成します。これによりMatrixの従来の「プレビュー先行」通知動作が維持されるため、標準クライアントでは完成したブロックではなく、最初のストリーミングプレビューテキストで通知されることがあります。
- `streaming: "quiet"`は、現在のアシスタントブロック用に編集可能な静かなプレビュー通知を1つ作成します。これを使用するのは、確定したプレビュー編集に対する受信者のプッシュルールも設定する場合のみにしてください。
- `blockStreaming: true`は、個別のMatrix進捗メッセージを有効にします。プレビューのストリーミングが有効な場合、Matrixは現在のブロックのライブ下書きを維持し、完了済みブロックを個別のメッセージとして保持します。
- プレビューが有効で`blockStreaming`がoffの場合、Matrixはライブ下書きをその場で編集し、ブロックまたはターンの完了時にその同じイベントを確定します。
- プレビューが1つのMatrixイベントに収まらなくなった場合、OpenClawはプレビューのストリーミングを停止し、通常の最終配信にフォールバックします。
- メディア返信は引き続き通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClawは最終メディア返信を送る前にそのプレビューを削除します。
- プレビュー編集には追加のMatrix API呼び出しコストがかかります。もっとも保守的なレート制限の挙動を望む場合は、ストリーミングをoffのままにしてください。

`blockStreaming`自体では下書きプレビューは有効になりません。
プレビュー編集には`streaming: "partial"`または`streaming: "quiet"`を使用し、完了したアシスタントブロックも個別の進捗メッセージとして表示したい場合にのみ`blockStreaming: true`を追加してください。

カスタムプッシュルールなしで標準のMatrix通知が必要な場合は、プレビュー先行の動作には`streaming: "partial"`を使用するか、最終配信のみでよければ`streaming`をoffのままにしてください。`streaming: "off"`では:

- `blockStreaming: true`は、完了した各ブロックを通常の通知付きMatrixメッセージとして送信します。
- `blockStreaming: false`は、最終的に完成した返信のみを通常の通知付きMatrixメッセージとして送信します。

### 静かな確定プレビュー向けのセルフホストpush rules

独自のMatrixインフラを運用していて、静かなプレビューでブロックまたは
最終返信の完了時のみ通知したい場合は、`streaming: "quiet"`を設定し、確定したプレビュー編集用のユーザーごとのpush ruleを追加します。

これは通常、homeserver全体の設定変更ではなく、受信ユーザー側のセットアップです:

始める前の簡単な対応表:

- recipient user = 通知を受け取る人
- bot user = 返信を送信するOpenClaw Matrixアカウント
- 以下のAPI呼び出しでは受信ユーザーのaccess tokenを使用する
- push rule内の`sender`はbot userの完全なMXIDに一致させる

1. OpenClawで静かなプレビューを使用するよう設定します:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. 受信アカウントがすでに通常のMatrixプッシュ通知を受け取れることを確認します。静かなプレビュー
   ルールが機能するのは、そのユーザーにすでに動作中のpusher/deviceがある場合のみです。

3. 受信ユーザーのaccess tokenを取得します。
   - ボットのトークンではなく、受信ユーザーのトークンを使用します。
   - 既存のクライアントセッショントークンを再利用するのが通常はもっとも簡単です。
   - 新しいトークンを発行する必要がある場合は、標準のMatrix Client-Server API経由でログインできます:

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

4. 受信アカウントにすでにpusherがあることを確認します:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

ここで有効なpusher/deviceが返ってこない場合は、以下の
OpenClawルールを追加する前に、まず通常のMatrix通知を修正してください。

OpenClawは、確定したテキストのみのプレビュー編集に次の印を付けます:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. これらの通知を受け取る各受信アカウントに対してoverride push ruleを作成します:

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

- `https://matrix.example.org`: あなたのhomeserverベースURL
- `$USER_ACCESS_TOKEN`: 受信ユーザーのaccess token
- `openclaw-finalized-preview-botname`: この受信ユーザーに対するこのボット専用の一意なrule ID
- `@bot:example.org`: 受信ユーザーのMXIDではなく、OpenClaw MatrixボットのMXID

マルチボット構成で重要:

- push ruleは`ruleId`で識別されます。同じrule IDに対して`PUT`を再実行すると、その1つのルールが更新されます。
- 1人の受信ユーザーが複数のOpenClaw Matrixボットアカウントからの通知を受ける必要がある場合は、各`sender`一致ごとに一意のrule IDを持つルールをボットごとに1つ作成してください。
- シンプルなパターンは`openclaw-finalized-preview-<botname>`です。たとえば、`openclaw-finalized-preview-ops`や`openclaw-finalized-preview-support`です。

このルールはイベント送信者に対して評価されます:

- 受信ユーザーのトークンで認証する
- `sender`をOpenClawボットのMXIDに一致させる

6. ルールが存在することを確認します:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. ストリーミング返信をテストします。quietモードでは、ルームには静かな下書きプレビューが表示され、
   ブロックまたはターンが完了すると最終的なインプレース編集で1回通知されるはずです。

後でルールを削除する必要がある場合は、受信ユーザーのトークンで同じrule IDを削除します:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

注記:

- ルールはボットのaccess tokenではなく、受信ユーザーのaccess tokenで作成してください。
- 新しいユーザー定義の`override`ルールはデフォルトの抑制ルールより前に挿入されるため、追加の順序パラメータは不要です。
- これは、OpenClawが安全にその場で確定できるテキストのみのプレビュー編集にのみ影響します。メディアフォールバックと古いプレビューフォールバックでは、引き続き通常のMatrix配信が使われます。
- `GET /_matrix/client/v3/pushers`でpusherが表示されない場合、そのユーザーはまだそのアカウント/デバイスで動作するMatrixプッシュ配信を持っていません。

#### Synapse

Synapseでは、通常は上記のセットアップだけで十分です:

- 確定したOpenClawプレビュー通知のために特別な`homeserver.yaml`変更は不要です。
- Synapseデプロイですでに通常のMatrixプッシュ通知が送信されている場合、主なセットアップ手順は上記のユーザートークン + `pushrules`呼び出しです。
- Synapseをリバースプロキシまたはworkerの背後で動かしている場合は、`/_matrix/client/.../pushrules/`が正しくSynapseに到達することを確認してください。
- Synapse workerを使用している場合は、pusherが正常であることを確認してください。プッシュ配信はメインプロセスまたは`synapse.app.pusher` / 設定されたpusher workerによって処理されます。

#### Tuwunel

Tuwunelでは、上記と同じセットアップフローとpush-rule API呼び出しを使用します:

- 確定プレビューマーカー自体に対して、Tuwunel固有の設定は不要です。
- そのユーザーに対して通常のMatrix通知がすでに機能している場合、主なセットアップ手順は上記のユーザートークン + `pushrules`呼び出しです。
- ユーザーが別のデバイスでアクティブな間に通知が消えるように見える場合は、`suppress_push_when_active`が有効になっていないか確認してください。Tuwunelは2025年9月12日のTuwunel 1.4.2でこのオプションを追加しており、1つのデバイスがアクティブな間、他のデバイスへのプッシュを意図的に抑制することがあります。

## ボット同士のルーム

デフォルトでは、設定済みの他のOpenClaw MatrixアカウントからのMatrixメッセージは無視されます。

エージェント間のMatrixトラフィックを意図的に許可したい場合は、`allowBots`を使用します:

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

- `allowBots: true`は、許可されたルームとDMで、設定済みの他のMatrixボットアカウントからのメッセージを受け入れます。
- `allowBots: "mentions"`は、ルーム内でそれらのメッセージがこのボットに明示的にメンションしている場合にのみ受け入れます。DMは引き続き許可されます。
- `groups.<room>.allowBots`は、1つのルームに対してアカウントレベル設定を上書きします。
- OpenClawは自己返信ループを避けるため、同じMatrixユーザーIDからのメッセージは引き続き無視します。
- Matrixはここでネイティブのボットフラグを公開していません。OpenClawは「ボット作成」とは「このOpenClaw Gateway上の別の設定済みMatrixアカウントによって送信されたもの」と見なします。

共有ルームでボット同士のトラフィックを有効にする場合は、厳格なルームallowlistとメンション必須設定を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信する画像イベントは`thumbnail_file`を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは、引き続き通常の`thumbnail_url`を使用します。設定は不要です — PluginがE2EE状態を自動検出します。

暗号化を有効にする:

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

検証ステータスを確認する:

```bash
openclaw matrix verify status
```

詳細ステータス（完全な診断情報）:

```bash
openclaw matrix verify status --verbose
```

保存済みのrecovery keyを機械可読出力に含める:

```bash
openclaw matrix verify status --include-recovery-key --json
```

cross-signingと検証状態をbootstrapする:

```bash
openclaw matrix verify bootstrap
```

詳細なbootstrap診断情報:

```bash
openclaw matrix verify bootstrap --verbose
```

bootstrap前に新しいcross-signing IDリセットを強制する:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

recovery keyでこのデバイスを検証する:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

詳細なデバイス検証情報:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

ルームキーbackupの健全性を確認する:

```bash
openclaw matrix verify backup status
```

詳細なbackup健全性診断情報:

```bash
openclaw matrix verify backup status --verbose
```

サーバーbackupからルームキーを復元する:

```bash
openclaw matrix verify backup restore
```

詳細な復元診断情報:

```bash
openclaw matrix verify backup restore --verbose
```

現在のサーバーbackupを削除し、新しいbackupベースラインを作成します。保存済みの
backup keyを正常に読み込めない場合、このリセットによってsecret storageも再作成され、
将来のコールドスタートで新しいbackup keyを読み込めるようになることがあります:

```bash
openclaw matrix verify backup reset --yes
```

すべての`verify`コマンドはデフォルトで簡潔です（quietな内部SDKロギングを含む）で、詳細な診断情報は`--verbose`を付けた場合のみ表示されます。
スクリプトで使用する場合は、完全な機械可読出力のために`--json`を使用してください。

マルチアカウント構成では、Matrix CLIコマンドは`--account <id>`を渡さない限り暗黙のMatrixデフォルトアカウントを使用します。
複数の名前付きアカウントを設定する場合は、先に`channels.matrix.defaultAccount`を設定してください。設定しないと、それらの暗黙のCLI操作は停止して、どのアカウントを使うか明示的に選ぶよう求めます。
検証またはデバイス操作を明示的に名前付きアカウントに向けたい場合は、常に`--account`を使用してください:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

暗号化が無効または名前付きアカウントで利用不可の場合、Matrixの警告と検証エラーはそのアカウントのconfigキー、たとえば`channels.matrix.accounts.assistant.encryption`を指します。

### 「検証済み」の意味

OpenClawは、このMatrixデバイスがあなた自身のcross-signing IDによって検証されている場合にのみ、このデバイスを検証済みとして扱います。
実際には、`openclaw matrix verify status --verbose`は3つの信頼シグナルを表示します:

- `Locally trusted`: このデバイスは現在のクライアントでのみ信頼されています
- `Cross-signing verified`: SDKがこのデバイスをcross-signing経由で検証済みとして報告します
- `Signed by owner`: このデバイスはあなた自身のself-signing keyで署名されています

`Verified by owner`が`yes`になるのは、cross-signingによる検証またはowner-signingが存在する場合のみです。
ローカル信頼だけでは、OpenClawはこのデバイスを完全に検証済みとは見なしません。

### bootstrapが行うこと

`openclaw matrix verify bootstrap`は、暗号化されたMatrixアカウントの修復およびセットアップコマンドです。
次のすべてを順に実行します:

- secret storageをbootstrapし、可能であれば既存のrecovery keyを再利用する
- cross-signingをbootstrapし、不足している公開cross-signing keyをアップロードする
- 現在のデバイスに印を付けてcross-signingすることを試みる
- まだ存在しない場合は、新しいサーバー側のルームキーbackupを作成する

homeserverがcross-signing keyのアップロードに対して対話的認証を要求する場合、OpenClawはまず認証なしでアップロードを試行し、次に`m.login.dummy`で、`channels.matrix.password`が設定されている場合は`m.login.password`でも試行します。

`--force-reset-cross-signing`は、現在のcross-signing IDを破棄して新しいものを作成したい場合にのみ使用してください。

現在のルームキーbackupを意図的に破棄し、今後のメッセージ用に新しい
backupベースラインを開始したい場合は、`openclaw matrix verify backup reset --yes`を使用してください。
これは、回復不能な古い暗号化履歴が引き続き利用できないままであることと、
現在のbackup secretを安全に読み込めない場合にOpenClawがsecret storageを再作成する可能性があることを受け入れる場合にのみ行ってください。

### 新しいbackupベースライン

今後の暗号化メッセージを機能させ続けつつ、回復不能な古い履歴の喪失を受け入れる場合は、次のコマンドを順に実行してください:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

名前付きMatrixアカウントを明示的に対象にしたい場合は、各コマンドに`--account <id>`を追加してください。

### 起動時の動作

`encryption: true`の場合、Matrixは`startupVerification`のデフォルトを`"if-unverified"`にします。
起動時にこのデバイスがまだ未検証であれば、Matrixは別のMatrixクライアントで自己検証を要求し、
すでに保留中の要求がある場合は重複要求をスキップし、再起動後の再試行前にローカルクールダウンを適用します。
失敗した要求試行は、デフォルトでは要求作成の成功後よりも早く再試行されます。
自動起動時要求を無効にするには`startupVerification: "off"`を設定するか、再試行ウィンドウを短くまたは長くしたい場合は`startupVerificationCooldownHours`を調整してください。

起動時には、保守的なcrypto bootstrapパスも自動的に実行されます。
このパスは、最初に現在のsecret storageとcross-signing IDの再利用を試み、明示的なbootstrap修復フローを実行しない限りcross-signingのリセットを避けます。

起動時に壊れたbootstrap状態が見つかり、`channels.matrix.password`が設定されている場合、OpenClawはより厳格な修復パスを試みることがあります。
現在のデバイスがすでにowner-signedである場合、OpenClawはそれを自動的にリセットせず、そのIDを保持します。

完全なアップグレードフロー、制限、回復コマンド、一般的な移行メッセージについては、[Matrix migration](/ja-JP/install/migrating-matrix)を参照してください。

### 検証通知

Matrixは、厳格なDM検証ルームに検証ライフサイクル通知を`m.notice`メッセージとして直接投稿します。
これには次が含まれます:

- 検証要求通知
- 検証準備完了通知（明示的な「絵文字で検証」ガイダンス付き）
- 検証開始および完了通知
- 利用可能な場合のSAS詳細（絵文字と10進数）

別のMatrixクライアントからの受信検証要求は、OpenClawによって追跡され自動承認されます。
自己検証フローでは、OpenClawは絵文字検証が利用可能になるとSASフローも自動的に開始し、自身の側を確認します。
別のMatrixユーザー/デバイスからの検証要求については、OpenClawは要求を自動承認し、その後SASフローが通常どおり進行するのを待ちます。
検証を完了するには、引き続きMatrixクライアントで絵文字または10進数のSASを比較し、そこで「一致する」を確認する必要があります。

OpenClawは、自己開始された重複フローを無条件に自動承認しません。自己検証要求がすでに保留中の場合、起動時に新しい要求の作成はスキップされます。

検証プロトコル/システム通知はエージェントチャットパイプラインには転送されないため、`NO_REPLY`は生成されません。

### デバイス衛生

古いOpenClaw管理のMatrixデバイスがアカウントに蓄積し、暗号化ルームの信頼性を把握しにくくなることがあります。
次のコマンドで一覧表示します:

```bash
openclaw matrix devices list
```

古くなったOpenClaw管理デバイスを削除するには:

```bash
openclaw matrix devices prune-stale
```

### Crypto store

Matrix E2EEは、Node上で公式の`matrix-js-sdk` Rust cryptoパスを使用し、IndexedDB shimとして`fake-indexeddb`を使います。Crypto状態はスナップショットファイル（`crypto-idb-snapshot.json`）に永続化され、起動時に復元されます。スナップショットファイルは、制限されたファイル権限で保存される機密性の高いランタイム状態です。

暗号化されたランタイム状態は、アカウントごと・ユーザーのtoken-hashごとのルートの下に
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`として保存されます。
このディレクトリには、sync store（`bot-storage.json`）、crypto store（`crypto/`）、
recovery keyファイル（`recovery-key.json`）、IndexedDB snapshot（`crypto-idb-snapshot.json`）、
thread binding（`thread-bindings.json`）、およびstartup verification state（`startup-verification.json`）が含まれます。
トークンが変わってもアカウントIDが同じままであれば、OpenClawはそのアカウント/homeserver/user組み合わせに対して最適な既存ルートを再利用するため、以前のsync state、crypto state、thread binding、
およびstartup verification stateは引き続き参照できます。

## プロファイル管理

選択したアカウントのMatrixセルフプロファイルを更新するには、次を実行します:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

名前付きMatrixアカウントを明示的に対象にしたい場合は、`--account <id>`を追加してください。

Matrixは`mxc://` avatar URLをそのまま受け付けます。`http://`または`https://`のavatar URLを渡した場合、OpenClawはまずそれをMatrixにアップロードし、解決された`mxc://` URLを`channels.matrix.avatarUrl`（または選択したアカウントのoverride）に保存します。

## スレッド

Matrixは、自動返信とmessage-tool送信の両方についてネイティブのMatrixスレッドをサポートします。

- `dm.sessionScope: "per-user"`（デフォルト）は、Matrix DMルーティングを送信者スコープのままにするため、同じ相手に解決される複数のDMルームで1つのセッションを共有できます。
- `dm.sessionScope: "per-room"`は、通常のDM認証とallowlistチェックを使いながら、各Matrix DMルームを独自のセッションキーに分離します。
- 明示的なMatrix会話bindingは引き続き`dm.sessionScope`より優先されるため、binding済みのルームとスレッドは選択された対象セッションを維持します。
- `threadReplies: "off"`は、返信をトップレベルのままにし、受信したスレッドメッセージを親セッション上に維持します。
- `threadReplies: "inbound"`は、受信メッセージがすでにそのスレッド内にあった場合にのみ、スレッド内で返信します。
- `threadReplies: "always"`は、トリガーとなったメッセージをルートとするスレッド内にルーム返信を維持し、その会話を最初のトリガーメッセージから対応するスレッドスコープのセッション経由でルーティングします。
- `dm.threadReplies`は、DMに対してのみトップレベル設定を上書きします。たとえば、ルームスレッドは分離したまま、DMはフラットに保てます。
- 受信したスレッドメッセージには、追加のagentコンテキストとしてスレッドのルートメッセージが含まれます。
- message-tool送信は、明示的な`threadId`が指定されていない限り、対象が同じルームまたは同じDMユーザー対象であれば、現在のMatrixスレッドを自動継承します。
- 同一セッションのDMユーザー対象再利用が有効になるのは、現在のセッションmetadataによって、同じMatrixアカウント上の同じDM相手であることが証明される場合のみです。それ以外では、OpenClawは通常のユーザースコープルーティングにフォールバックします。
- OpenClawが、同じ共有Matrix DMセッション上で1つのMatrix DMルームが別のDMルームと衝突していることを検出すると、thread bindingが有効で`dm.sessionScope`ヒントがある場合、そのルームに`/focus`の退避手段を含む1回限りの`m.notice`を投稿します。
- Matrixではランタイムthread bindingがサポートされます。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドにbindingされた`/acp spawn`は、MatrixルームとDMで動作します。
- トップレベルのMatrixルーム/DMでの`/focus`は、`threadBindings.spawnSubagentSessions=true`のとき、新しいMatrixスレッドを作成し、それを対象セッションにbindします。
- 既存のMatrixスレッド内で`/focus`または`/acp spawn --thread here`を実行すると、代わりにその現在のスレッドがbindされます。

## ACP会話binding

Matrixルーム、DM、既存のMatrixスレッドは、チャットの表面を変えずに永続的なACP workspaceにできます。

高速なオペレーターフロー:

- 使い続けたいMatrix DM、ルーム、または既存スレッドの中で`/acp spawn codex --bind here`を実行します。
- トップレベルのMatrix DMまたはルームでは、現在のDM/ルームがチャットの表面として維持され、以後のメッセージは生成されたACPセッションにルーティングされます。
- 既存のMatrixスレッド内では、`--bind here`がその現在のスレッドをその場でbindします。
- `/new`と`/reset`は、同じbinding済みACPセッションをその場でリセットします。
- `/acp close`はACPセッションを閉じてbindingを削除します。

注記:

- `--bind here`は子Matrixスレッドを作成しません。
- `threadBindings.spawnAcpSessions`が必要なのは、OpenClawが子Matrixスレッドを作成またはbindする必要がある`/acp spawn --thread auto|here`の場合のみです。

### スレッドbinding設定

Matrixは`session.threadBindings`からグローバルデフォルトを継承し、チャネルごとのoverrideもサポートします:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrixのスレッドbinding付きspawnフラグはオプトインです:

- トップレベルの`/focus`で新しいMatrixスレッドを作成してbindできるようにするには、`threadBindings.spawnSubagentSessions: true`を設定します。
- `/acp spawn --thread auto|here`でACPセッションをMatrixスレッドにbindできるようにするには、`threadBindings.spawnAcpSessions: true`を設定します。

## リアクション

Matrixは、送信リアクションアクション、受信リアクション通知、および受信ackリアクションをサポートします。

- 送信リアクションtoolingは`channels["matrix"].actions.reactions`で制御されます。
- `react`は、特定のMatrixイベントにリアクションを追加します。
- `reactions`は、特定のMatrixイベントに対する現在のリアクション要約を一覧表示します。
- `emoji=""`は、そのイベント上のボットアカウント自身のリアクションを削除します。
- `remove: true`は、ボットアカウントから指定した絵文字リアクションのみを削除します。

ackリアクションは標準のOpenClaw解決順序を使用します:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- agent identity emoji fallback

ackリアクションスコープは次の順で解決されます:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

リアクション通知モードは次の順で解決されます:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- デフォルト: `own`

動作:

- `reactionNotifications: "own"`は、ボット作成のMatrixメッセージを対象とする追加された`m.reaction`イベントを転送します。
- `reactionNotifications: "off"`はリアクションシステムイベントを無効にします。
- リアクション削除は、Matrixがそれらを独立した`m.reaction`削除ではなくredactionとして表現するため、システムイベントには合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit`は、Matrixルームメッセージがagentをトリガーしたときに`InboundHistory`として含める最近のルームメッセージ数を制御します。`messages.groupChat.historyLimit`にフォールバックし、両方とも未設定の場合、実効デフォルトは`0`です。無効化するには`0`を設定してください。
- Matrixルーム履歴はルーム専用です。DMは通常のセッション履歴を引き続き使用します。
- Matrixルーム履歴は保留中のみです。OpenClawはまだ返信をトリガーしていないルームメッセージをバッファし、メンションや他のトリガーが来たときにそのウィンドウをスナップショットします。
- 現在のトリガーメッセージは`InboundHistory`に含まれません。そのターンのメイン受信本文に残ります。
- 同じMatrixイベントの再試行では、新しいルームメッセージへ前進してずれることなく、元の履歴スナップショットが再利用されます。

## コンテキスト可視性

Matrixは、取得した返信テキスト、スレッドルート、保留中の履歴などの補助的なルームコンテキストに対する共有の`contextVisibility`制御をサポートします。

- `contextVisibility: "all"`がデフォルトです。補助コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"`は、アクティブなルーム/ユーザーallowlistチェックで許可された送信者に補助コンテキストを絞り込みます。
- `contextVisibility: "allowlist_quote"`は`allowlist`と同様に動作しますが、1つの明示的な引用返信は保持します。

この設定は補助コンテキストの可視性に影響し、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガーの認可は引き続き`groupPolicy`、`groups`、`groupAllowFrom`、およびDM policy設定から行われます。

## DMとルームポリシー

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

メンション制御とallowlistの動作については、[Groups](/ja-JP/channels/groups)を参照してください。

Matrix DMのpairing例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認のMatrixユーザーが承認前に繰り返しメッセージを送ってきた場合、OpenClawは同じ保留中のpairing codeを再利用し、新しいコードを発行する代わりに、短いクールダウン後に再度リマインダー返信を送ることがあります。

共有のDM pairingフローと保存レイアウトについては、[Pairing](/ja-JP/channels/pairing)を参照してください。

## ダイレクトルーム修復

ダイレクトメッセージ状態の同期が崩れると、OpenClawがライブDMではなく古い単独ルームを指す古い`m.direct`マッピングを保持してしまうことがあります。相手の現在のマッピングを確認するには、次を実行します:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修復フロー:

- `m.direct`にすでにマッピングされている厳密な1:1 DMを優先する
- それがない場合、そのユーザーとの現在参加中の厳密な1:1 DMにフォールバックする
- 健全なDMが存在しない場合は、新しいダイレクトルームを作成して`m.direct`を書き換える

修復フローは古いルームを自動削除しません。健全なDMを選び、新しいMatrix送信、検証通知、その他のダイレクトメッセージフローが再び正しいルームを対象にするよう、マッピングを更新するだけです。

## Exec承認

Matrixは、Matrixアカウントのネイティブ承認クライアントとして機能できます。ネイティブの
DM/チャネルルーティング設定は、引き続きexec approval configの下にあります:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（任意。`channels.matrix.dm.allowFrom`にフォールバック）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

承認者は`@owner:example.org`のようなMatrix user IDである必要があります。`enabled`が未設定または`"auto"`で、少なくとも1人の承認者を解決できる場合、Matrixはネイティブ承認を自動有効化します。Exec承認は最初に`execApprovals.approvers`を使用し、`channels.matrix.dm.allowFrom`にフォールバックできます。Plugin承認は`channels.matrix.dm.allowFrom`を通じて認可されます。Matrixをネイティブ承認クライアントとして明示的に無効化するには、`enabled: false`を設定してください。そうしない場合、承認要求は他の設定済み承認ルートまたは承認フォールバックポリシーにフォールバックします。

Matrixネイティブルーティングは両方の承認種別をサポートします:

- `channels.matrix.execApprovals.*`は、Matrix承認プロンプトのネイティブDM/チャネルfanoutモードを制御します。
- Exec承認は、`execApprovals.approvers`または`channels.matrix.dm.allowFrom`からexec approver setを使用します。
- Plugin承認は、`channels.matrix.dm.allowFrom`のMatrix DM allowlistを使用します。
- Matrixリアクションショートカットとメッセージ更新は、exec承認とPlugin承認の両方に適用されます。

配信ルール:

- `target: "dm"`は、承認プロンプトを承認者のDMに送信します
- `target: "channel"`は、プロンプトを発信元のMatrixルームまたはDMに送り返します
- `target: "both"`は、承認者のDMと発信元のMatrixルームまたはDMの両方に送信します

Matrix承認プロンプトは、主要な承認メッセージにリアクションショートカットを設定します:

- `✅` = 1回だけ許可
- `❌` = 拒否
- `♾️` = 実効exec policyでその決定が許可されている場合は常に許可

承認者はそのメッセージにリアクションするか、フォールバックのスラッシュコマンド`/approve <id> allow-once`、`/approve <id> allow-always`、または`/approve <id> deny`を使用できます。

承認または拒否できるのは、解決済みの承認者だけです。Exec承認では、チャネル配信にコマンドテキストが含まれるため、`channel`または`both`は信頼されたルームでのみ有効にしてください。

アカウントごとのoverride:

- `channels.matrix.accounts.<account>.execApprovals`

関連ドキュメント: [Exec approvals](/ja-JP/tools/exec-approvals)

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

トップレベルの`channels.matrix`の値は、アカウント側でoverrideされない限り、名前付きアカウントのデフォルトとして機能します。
継承されたルームエントリは、`groups.<room>.account`で1つのMatrixアカウントにスコープできます。
`account`のないエントリはすべてのMatrixアカウント間で共有されたままとなり、`account: "default"`を持つエントリは、デフォルトアカウントがトップレベルの`channels.matrix.*`に直接設定されている場合にも引き続き機能します。
共有された部分的な認証デフォルトだけでは、それ自体で別個の暗黙のデフォルトアカウントは作成されません。OpenClawがトップレベルの`default`アカウントを合成するのは、そのデフォルトに新しい認証情報（`homeserver` + `accessToken`、または`homeserver` + `userId` + `password`）がある場合のみです。名前付きアカウントは、後でキャッシュ済み認証情報が認証要件を満たすなら、`homeserver` + `userId`から引き続き検出可能なままにできます。
Matrixにすでにちょうど1つの名前付きアカウントがある場合、または`defaultAccount`が既存の名前付きアカウントキーを指している場合、単一アカウントからマルチアカウントへの修復/セットアップ昇格では、新しい`accounts.default`エントリを作成する代わりにそのアカウントが保持されます。昇格されたアカウントに移動するのはMatrix認証/bootstrapキーのみで、共有配信ポリシーキーはトップレベルに残ります。
OpenClawに暗黙のルーティング、プローブ、CLI操作で1つの名前付きMatrixアカウントを優先させたい場合は、`defaultAccount`を設定してください。
複数のMatrixアカウントが設定されていて、そのうち1つのアカウントIDが`default`である場合、`defaultAccount`が未設定でもOpenClawはそのアカウントを暗黙的に使用します。
複数の名前付きアカウントを設定する場合は、暗黙のアカウント選択に依存するCLIコマンドのために`defaultAccount`を設定するか、`--account <id>`を渡してください。
1つのコマンドだけでその暗黙選択を上書きしたい場合は、`openclaw matrix verify ...`と`openclaw matrix devices ...`に`--account <id>`を渡してください。

共有のマルチアカウントパターンについては、[Configuration reference](/ja-JP/gateway/configuration-reference#multi-account-all-channels)を参照してください。

## Private/LAN homeserver

デフォルトでは、OpenClawはSSRF保護のため、private/internal Matrix homeserverをブロックします。
明示的にアカウントごとにオプトインした場合のみ許可されます。

homeserverがlocalhost、LAN/Tailscale IP、または内部ホスト名で動作している場合は、そのMatrixアカウントで
`network.dangerouslyAllowPrivateNetwork`を有効にしてください:

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

このオプトインは、信頼されたprivate/internalターゲットのみを許可します。`http://matrix.example.org:8008`のような
公開クリアテキストhomeserverは引き続きブロックされます。可能な限り`https://`を推奨します。

## Matrixトラフィックのプロキシ

Matrixデプロイで明示的な送信HTTP(S)プロキシが必要な場合は、`channels.matrix.proxy`を設定してください:

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

名前付きアカウントは、`channels.matrix.accounts.<id>.proxy`でトップレベルのデフォルトをoverrideできます。
OpenClawは、ランタイムのMatrixトラフィックとアカウントステータスのプローブの両方で同じプロキシ設定を使用します。

## ターゲット解決

Matrixは、OpenClawがルームまたはユーザーのターゲットを求めるすべての場所で、次のターゲット形式を受け付けます:

- ユーザー: `@user:server`、`user:@user:server`、または`matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または`matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または`matrix:channel:#alias:server`

ライブディレクトリ検索は、ログイン済みのMatrixアカウントを使用します:

- ユーザー検索は、そのhomeserver上のMatrixユーザーディレクトリに問い合わせます。
- ルーム検索は、明示的なルームIDとエイリアスをそのまま受け付け、その後そのアカウントの参加済みルーム名の検索にフォールバックします。
- 参加済みルーム名検索はベストエフォートです。ルーム名をIDまたはエイリアスに解決できない場合、ランタイムのallowlist解決で無視されます。

## 設定リファレンス

- `enabled`: チャネルを有効または無効にします。
- `name`: アカウントの任意ラベル。
- `defaultAccount`: 複数のMatrixアカウントが設定されている場合の優先アカウントID。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このMatrixアカウントがprivate/internal homeserverに接続できるようにします。homeserverが`localhost`、LAN/Tailscale IP、または`matrix-synapse`のような内部ホストに解決される場合に有効にしてください。
- `proxy`: Matrixトラフィック用の任意のHTTP(S)プロキシURL。名前付きアカウントは独自の`proxy`でトップレベルのデフォルトをoverrideできます。
- `userId`: 完全なMatrix user ID。例: `@bot:example.org`。
- `accessToken`: トークンベース認証用のaccess token。プレーンテキスト値とSecretRef値は、env/file/exec provider全体で`channels.matrix.accessToken`および`channels.matrix.accounts.<id>.accessToken`に対してサポートされます。[Secrets Management](/ja-JP/gateway/secrets)を参照してください。
- `password`: パスワードベースログイン用のpassword。プレーンテキスト値とSecretRef値がサポートされます。
- `deviceId`: 明示的なMatrix device ID。
- `deviceName`: パスワードログイン用のデバイス表示名。
- `avatarUrl`: プロファイル同期および`profile set`更新用の保存済みself-avatar URL。
- `initialSyncLimit`: 起動時sync中に取得されるイベントの最大数。
- `encryption`: E2EEを有効にします。
- `allowlistOnly`: `true`の場合、`open`ルームポリシーを`allowlist`に昇格し、`disabled`以外のすべてのアクティブなDM policy（`pairing`および`open`を含む）を`allowlist`に強制します。`disabled`ポリシーには影響しません。
- `allowBots`: 他の設定済みOpenClaw Matrixアカウントからのメッセージを許可します（`true`または`"mentions"`）。
- `groupPolicy`: `open`、`allowlist`、または`disabled`。
- `contextVisibility`: 補助的なルームコンテキストの可視性モード（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`: ルームトラフィック用のallowlist user ID。エントリは完全なMatrix user IDにしてください。未解決の名前は実行時に無視されます。
- `historyLimit`: グループ履歴コンテキストとして含めるルームメッセージの最大数。`messages.groupChat.historyLimit`にフォールバックし、両方とも未設定の場合、実効デフォルトは`0`です。無効化するには`0`を設定してください。
- `replyToMode`: `off`、`first`、`all`、または`batched`。
- `markdown`: 送信Matrixテキスト用の任意のMarkdownレンダリング設定。
- `streaming`: `off`（デフォルト）、`"partial"`、`"quiet"`、`true`、または`false`。`"partial"`と`true`は、通常のMatrixテキストメッセージによるプレビュー先行の下書き更新を有効にします。`"quiet"`は、セルフホストのpush-ruleセットアップ向けに通知しないプレビューノーティスを使用します。`false`は`"off"`と同等です。
- `blockStreaming`: `true`は、下書きプレビューのストリーミングが有効な間、完了したassistantブロックごとに個別の進捗メッセージを有効にします。
- `threadReplies`: `off`、`inbound`、または`always`。
- `threadBindings`: スレッドにbindingされたセッションルーティングとライフサイクルに対するチャネルごとのoverride。
- `startupVerification`: 起動時の自動自己検証要求モード（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`: 起動時の自動検証要求を再試行する前のクールダウン時間。
- `textChunkLimit`: 送信メッセージの文字数ベースのチャンクサイズ（`chunkMode`が`length`の場合に適用）。
- `chunkMode`: `length`はメッセージを文字数で分割し、`newline`は行境界で分割します。
- `responsePrefix`: このチャネルのすべての送信返信の前に付加される任意の文字列。
- `ackReaction`: このチャネル/アカウント用の任意のackリアクションoverride。
- `ackReactionScope`: 任意のackリアクションスコープoverride（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`: 受信リアクション通知モード（`own`、`off`）。
- `mediaMaxMb`: 送信と受信メディア処理におけるメディアサイズ上限（MB）。
- `autoJoin`: 招待への自動参加ポリシー（`always`、`allowlist`、`off`）。デフォルト: `off`。DM形式の招待を含むすべてのMatrix招待に適用されます。
- `autoJoinAllowlist`: `autoJoin`が`allowlist`のときに許可されるルーム/エイリアス。エイリアスエントリは招待処理中にルームIDへ解決されます。OpenClawは、招待されたルームが主張するエイリアス状態を信頼しません。
- `dm`: DM policyブロック（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`: OpenClawがルームに参加し、それをDMとして分類した後のDMアクセスを制御します。招待に自動参加するかどうかは変更しません。
- `dm.allowFrom`: ライブディレクトリ検索で解決済みでない限り、エントリは完全なMatrix user IDにしてください。
- `dm.sessionScope`: `per-user`（デフォルト）または`per-room`。相手が同じでも各Matrix DMルームに別々のコンテキストを持たせたい場合は`per-room`を使用してください。
- `dm.threadReplies`: DM専用のスレッドポリシーoverride（`off`、`inbound`、`always`）。DMにおける返信配置とセッション分離の両方について、トップレベルの`threadReplies`設定をoverrideします。
- `execApprovals`: Matrixネイティブのexec承認配信（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`: exec要求を承認できるMatrix user ID。`dm.allowFrom`がすでに承認者を特定している場合は任意です。
- `execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。
- `accounts`: 名前付きのアカウントごとのoverride。トップレベルの`channels.matrix`値はこれらのエントリのデフォルトとして機能します。
- `groups`: ルームごとのポリシーマップ。ルームIDまたはエイリアスを推奨します。未解決のルーム名は実行時に無視されます。セッション/グループIDには、解決後の安定したルームIDが使用されます。
- `groups.<room>.account`: マルチアカウント構成で、1つの継承ルームエントリを特定のMatrixアカウントに限定します。
- `groups.<room>.allowBots`: 設定済みボット送信者に対するルームレベルoverride（`true`または`"mentions"`）。
- `groups.<room>.users`: ルームごとの送信者allowlist。
- `groups.<room>.tools`: ルームごとのtool許可/拒否override。
- `groups.<room>.autoReply`: ルームレベルのメンション制御override。`true`はそのルームのメンション必須を無効にし、`false`は再び有効にします。
- `groups.<room>.skills`: 任意のルームレベルskill filter。
- `groups.<room>.systemPrompt`: 任意のルームレベルsystem promptスニペット。
- `rooms`: `groups`のレガシーエイリアス。
- `actions`: アクションごとのtool制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とpairingフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
