---
read_when:
    - OpenClaw で Matrix をセットアップする
    - Matrix の E2EE と認証を設定する
summary: Matrix のサポート状況、セットアップ、および設定例
title: Matrix
x-i18n:
    generated_at: "2026-04-21T04:43:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00fa6201d2ee4ac4ae5be3eb18ff687c5c2c9ef70cff12af1413b4c311484b24
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix は OpenClaw に同梱された channel Plugin です。  
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートしています。

## 同梱 Plugin

Matrix は現在の OpenClaw リリースでは同梱 Plugin として提供されるため、通常のパッケージ化されたビルドでは別途インストールは不要です。

古いビルドや、Matrix を含まないカスタムインストールを使用している場合は、手動でインストールしてください。

npm からインストールする場合:

```bash
openclaw plugins install @openclaw/matrix
```

ローカルのチェックアウトからインストールする場合:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin の動作とインストールルールについては、[Plugins](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. Matrix Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースには、すでに同梱されています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. あなたの homeserver で Matrix アカウントを作成します。
3. `channels.matrix` を次のいずれかで設定します:
   - `homeserver` + `accessToken`、または
   - `homeserver` + `userId` + `password`。
4. Gateway を再起動します。
5. ボットとの DM を開始するか、ルームに招待します。
   - 新しい Matrix 招待は、`channels.matrix.autoJoin` が許可している場合にのみ機能します。

対話型セットアップ手順:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix のウィザードでは、次の項目を尋ねられます:

- homeserver URL
- 認証方式: アクセストークンまたはパスワード
- ユーザー ID（パスワード認証時のみ）
- 任意のデバイス名
- E2EE を有効にするかどうか
- ルームアクセスと招待自動参加を設定するかどうか

主なウィザードの挙動:

- Matrix の認証 env vars がすでに存在し、そのアカウントの認証がまだ config に保存されていない場合、ウィザードは認証情報を env vars に保持するための env ショートカットを提案します。
- アカウント名はアカウント ID に正規化されます。たとえば、`Ops Bot` は `ops-bot` になります。
- DM の許可リスト項目には `@user:server` を直接指定できます。表示名は、ライブディレクトリ検索で完全一致 1 件が見つかった場合にのみ機能します。
- ルームの許可リスト項目にはルーム ID とエイリアスを直接指定できます。`!room:server` または `#alias:server` を推奨します。解決できない名前は、許可リスト解決時に実行時に無視されます。
- 招待自動参加の allowlist モードでは、安定した招待先のみを使用してください: `!roomId:server`、`#alias:server`、または `*`。単純なルーム名は拒否されます。
- 保存前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を使用します。

<Warning>
`channels.matrix.autoJoin` のデフォルトは `off` です。

未設定のままにすると、ボットは招待されたルームや新しい DM 形式の招待に参加しないため、最初に手動で参加しない限り、新しいグループや招待された DM に表示されません。

受け入れる招待を制限するには、`autoJoin: "allowlist"` を `autoJoinAllowlist` と併せて設定するか、すべての招待に参加させたい場合は `autoJoin: "always"` を設定します。

`allowlist` モードでは、`autoJoinAllowlist` は `!roomId:server`、`#alias:server`、または `*` のみ受け付けます。
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

すべての招待に参加する場合:

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

パスワードベース設定（ログイン後にトークンはキャッシュされます）:

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

Matrix はキャッシュされた認証情報を `~/.openclaw/credentials/matrix/` に保存します。  
デフォルトアカウントでは `credentials.json` を使用し、名前付きアカウントでは `credentials-<account>.json` を使用します。  
そこにキャッシュ済み認証情報が存在する場合、現在の認証が config に直接設定されていなくても、OpenClaw はセットアップ、doctor、channel-status 検出において Matrix が設定済みであるとみなします。

環境変数の対応先（config キーが未設定の場合に使用）:

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

デフォルト以外のアカウントでは、アカウントごとの env vars を使用します:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

アカウント `ops` の例:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

正規化されたアカウント ID `ops-bot` では、次を使用します:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix はアカウント ID 内の句読点をエスケープし、アカウント単位の env vars が衝突しないようにします。  
たとえば、`-` は `_X2D_` になるため、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` に対応します。

対話型ウィザードが env-var ショートカットを提案するのは、それらの認証 env vars がすでに存在し、かつ選択したアカウントに Matrix 認証がまだ config に保存されていない場合のみです。

## 設定例

これは、DM ペアリング、ルーム許可リスト、E2EE 有効化を含む実用的なベースライン設定です:

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

`autoJoin` は DM 形式の招待を含むすべての Matrix 招待に適用されます。OpenClaw は招待時点でそのルームが DM かグループかを確実に分類できないため、すべての招待は最初に `autoJoin` を通ります。`dm.policy` は、ボットが参加してルームが DM と分類されたあとに適用されます。

## ストリーミングプレビュー

Matrix の返信ストリーミングはオプトインです。

`channels.matrix.streaming` を `"partial"` に設定すると、OpenClaw は 1 つのライブプレビュー返信を送信し、モデルがテキストを生成している間はそのプレビューをその場で編集し、返信完了時に確定します:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` がデフォルトです。OpenClaw は最終返信を待ってから 1 回だけ送信します。
- `streaming: "partial"` は、現在の assistant ブロック用に 1 つの編集可能なプレビューメッセージを通常の Matrix テキストメッセージとして作成します。これにより Matrix の従来の「プレビュー先行」通知挙動が維持されるため、標準クライアントでは完成済みブロックではなく、最初のストリーミングプレビューテキストで通知される場合があります。
- `streaming: "quiet"` は、現在の assistant ブロック用に 1 つの編集可能な静かなプレビュー通知を作成します。これは、確定済みプレビュー編集に対する受信者側 push rule も設定する場合にのみ使用してください。
- `blockStreaming: true` は、個別の Matrix 進行状況メッセージを有効にします。プレビュー ストリーミングが有効な場合、Matrix は現在のブロックのライブ下書きを保持し、完了済みブロックを個別メッセージとして保持します。
- プレビュー ストリーミングが有効で `blockStreaming` が off の場合、Matrix はライブ下書きをその場で編集し、ブロックまたはターンの完了時にその同じイベントを確定します。
- プレビューが 1 つの Matrix イベントに収まらなくなった場合、OpenClaw はプレビュー ストリーミングを停止し、通常の最終配信にフォールバックします。
- メディア返信は引き続き通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できない場合、OpenClaw は最終メディア返信を送信する前にそれを redact します。
- プレビュー編集では追加の Matrix API 呼び出しが発生します。最も保守的なレート制限挙動を望む場合は、ストリーミングを off のままにしてください。

`blockStreaming` 自体では下書きプレビューは有効になりません。  
プレビュー編集には `streaming: "partial"` または `streaming: "quiet"` を使用し、完了済み assistant ブロックも個別の進行状況メッセージとして表示したい場合にのみ `blockStreaming: true` を追加してください。

カスタム push rule を使わずに標準の Matrix 通知が必要な場合は、プレビュー先行の挙動には `streaming: "partial"` を使用するか、最終のみ配信するには `streaming` を off のままにしてください。`streaming: "off"` の場合:

- `blockStreaming: true` は、完了した各ブロックを通常の通知付き Matrix メッセージとして送信します。
- `blockStreaming: false` は、最終的に完成した返信のみを通常の通知付き Matrix メッセージとして送信します。

### セルフホスト環境での、静かな確定済みプレビュー用 push rule

独自の Matrix インフラを運用していて、静かなプレビューがブロックまたは最終返信の完了時にのみ通知されるようにしたい場合は、`streaming: "quiet"` を設定し、確定済みプレビュー編集に対するユーザーごとの push rule を追加してください。

これは通常、homeserver 全体の設定変更ではなく、受信側ユーザーの設定です。

開始前の簡単な対応表:

- recipient user = 通知を受け取る人
- bot user = 返信を送信する OpenClaw の Matrix アカウント
- 以下の API 呼び出しでは recipient user のアクセストークンを使用する
- push rule の `sender` には bot user の完全な MXID を一致させる

1. OpenClaw を静かなプレビューを使うよう設定します:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. recipient アカウントがすでに通常の Matrix push 通知を受信していることを確認します。静かなプレビューのルールは、そのユーザーにすでに動作する pusher/デバイスがある場合にのみ機能します。

3. recipient user のアクセストークンを取得します。
   - ボットのトークンではなく、受信ユーザーのトークンを使用します。
   - 既存のクライアントセッショントークンを再利用するのが通常は最も簡単です。
   - 新しいトークンを発行する必要がある場合は、標準の Matrix Client-Server API でログインできます:

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

4. recipient アカウントにすでに pusher があることを確認します:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

これで有効な pusher/デバイスが返らない場合は、以下の OpenClaw ルールを追加する前に、まず通常の Matrix 通知を修正してください。

OpenClaw は、確定済みのテキストのみのプレビュー編集に次の印を付けます:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. これらの通知を受け取る必要がある各 recipient アカウントについて、override push rule を作成します:

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

コマンド実行前に、以下の値を置き換えてください:

- `https://matrix.example.org`: あなたの homeserver のベース URL
- `$USER_ACCESS_TOKEN`: 受信ユーザーのアクセストークン
- `openclaw-finalized-preview-botname`: この受信ユーザーに対する、このボット固有の rule ID
- `@bot:example.org`: 受信ユーザーの MXID ではなく、あなたの OpenClaw Matrix bot MXID

複数ボット構成で重要な点:

- Push rule は `ruleId` をキーにしています。同じ rule ID に対して `PUT` を再実行すると、その 1 つのルールが更新されます。
- 1 人の受信ユーザーが複数の OpenClaw Matrix bot アカウントについて通知を受ける必要がある場合は、送信者一致ごとに一意の rule ID を使って、bot ごとに 1 つのルールを作成してください。
- シンプルなパターンは `openclaw-finalized-preview-<botname>` です。たとえば `openclaw-finalized-preview-ops` や `openclaw-finalized-preview-support` などです。

このルールはイベント送信者に対して評価されます:

- 受信ユーザーのトークンで認証する
- `sender` を OpenClaw bot の MXID と照合する

6. ルールが存在することを確認します:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. ストリーミング返信をテストします。quiet モードでは、ルームには静かな下書きプレビューが表示され、ブロックまたはターンが完了すると最後のインプレース編集で 1 回通知されるはずです。

後でルールを削除する必要がある場合は、受信ユーザーのトークンを使って同じ rule ID を削除します:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

注記:

- ルールは bot のトークンではなく、受信ユーザーのアクセストークンで作成してください。
- 新しいユーザー定義の `override` ルールはデフォルトの抑制ルールより前に挿入されるため、追加の順序パラメーターは不要です。
- これは、OpenClaw が安全にその場で確定できるテキストのみのプレビュー編集にのみ影響します。メディアのフォールバックや古いプレビューのフォールバックでは、引き続き通常の Matrix 配信を使用します。
- `GET /_matrix/client/v3/pushers` で pusher が表示されない場合、そのユーザーはまだそのアカウント/デバイスで動作する Matrix push 配信を持っていません。

#### Synapse

Synapse では、通常は上記のセットアップだけで十分です:

- OpenClaw の確定済みプレビュー通知のために、特別な `homeserver.yaml` の変更は不要です。
- Synapse デプロイで通常の Matrix push 通知がすでに送信されている場合、主なセットアップ手順は上記のユーザートークン + `pushrules` 呼び出しです。
- Synapse をリバースプロキシや worker の背後で運用している場合は、`/_matrix/client/.../pushrules/` が正しく Synapse に到達することを確認してください。
- Synapse worker を運用している場合は、pusher が正常であることを確認してください。push 配信はメインプロセスまたは `synapse.app.pusher` / 設定済み pusher worker によって処理されます。

#### Tuwunel

Tuwunel では、上記と同じセットアップフローと push-rule API 呼び出しを使用してください:

- 確定済みプレビューマーカー自体のために、Tuwunel 固有の設定は不要です。
- そのユーザーに対して通常の Matrix 通知がすでに動作している場合、主なセットアップ手順は上記のユーザートークン + `pushrules` 呼び出しです。
- ユーザーが別のデバイスでアクティブな間に通知が消えるように見える場合は、`suppress_push_when_active` が有効になっているか確認してください。Tuwunel は 2025 年 9 月 12 日の Tuwunel 1.4.2 でこのオプションを追加しており、1 つのデバイスがアクティブな間、他のデバイスへの push を意図的に抑制することがあります。

## bot 間ルーム

デフォルトでは、他の設定済み OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。

意図的に agent 間の Matrix トラフィックを有効にしたい場合は、`allowBots` を使用します:

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

- `allowBots: true` は、許可されたルームと DM で他の設定済み Matrix bot アカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルーム内でそれらのメッセージがこの bot への明示的なメンションを含む場合にのみ受け入れます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームに対してアカウントレベル設定を上書きします。
- OpenClaw は自己返信ループを避けるため、同じ Matrix user ID からのメッセージは引き続き無視します。
- Matrix はここでネイティブの bot フラグを公開していません。OpenClaw は「bot によって作成された」を「この OpenClaw Gateway 上の別の設定済み Matrix アカウントによって送信された」として扱います。

共有ルームで bot 間トラフィックを有効にする場合は、厳格なルーム許可リストとメンション必須設定を使用してください。

## 暗号化と認証

暗号化された（E2EE）ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは、引き続き通常の `thumbnail_url` を使用します。設定は不要です — Plugin が E2EE 状態を自動検出します。

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

認証状態を確認する:

```bash
openclaw matrix verify status
```

詳細な状態表示（完全な診断）:

```bash
openclaw matrix verify status --verbose
```

保存されている復旧キーを machine-readable 出力に含める:

```bash
openclaw matrix verify status --include-recovery-key --json
```

クロス署名と認証状態をブートストラップする:

```bash
openclaw matrix verify bootstrap
```

詳細なブートストラップ診断:

```bash
openclaw matrix verify bootstrap --verbose
```

ブートストラップ前に新しいクロス署名 ID リセットを強制する:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

復旧キーでこのデバイスを認証する:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

詳細なデバイス認証情報:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

ルームキー backup の健全性を確認する:

```bash
openclaw matrix verify backup status
```

詳細な backup 健全性診断:

```bash
openclaw matrix verify backup status --verbose
```

サーバー backup からルームキーを復元する:

```bash
openclaw matrix verify backup restore
```

詳細な復元診断:

```bash
openclaw matrix verify backup restore --verbose
```

現在のサーバー backup を削除し、新しい backup ベースラインを作成します。保存されている backup キーを正常に読み込めない場合、このリセットにより secret storage も再作成され、今後のコールドスタートで新しい backup キーを読み込めるようになります:

```bash
openclaw matrix verify backup reset --yes
```

すべての `verify` コマンドはデフォルトでは簡潔です（内部 SDK の静かなログ出力を含む）で、詳細な診断は `--verbose` を付けたときのみ表示されます。  
スクリプトで使う場合は、完全な machine-readable 出力に `--json` を使用してください。

マルチアカウント構成では、`--account <id>` を渡さない限り、Matrix CLI コマンドは暗黙の Matrix デフォルトアカウントを使用します。  
複数の名前付きアカウントを設定している場合は、まず `channels.matrix.defaultAccount` を設定してください。そうしないと、それらの暗黙的な CLI 操作は停止して、明示的にアカウントを選ぶよう求めます。  
認証やデバイス操作の対象を明示的に名前付きアカウントにしたい場合は、常に `--account` を使ってください:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

暗号化が無効、または名前付きアカウントで利用できない場合、Matrix の警告と認証エラーはそのアカウントの config キーを指します。たとえば `channels.matrix.accounts.assistant.encryption` のようになります。

### 「認証済み」の意味

OpenClaw は、この Matrix デバイスがあなた自身のクロス署名 ID によって認証されている場合にのみ、そのデバイスを認証済みとして扱います。  
実際には、`openclaw matrix verify status --verbose` は次の 3 つの信頼シグナルを表示します:

- `Locally trusted`: このデバイスは現在のクライアントによってのみ信頼されています
- `Cross-signing verified`: SDK はこのデバイスがクロス署名によって認証されていると報告しています
- `Signed by owner`: このデバイスはあなた自身の self-signing key によって署名されています

`Verified by owner` が `yes` になるのは、クロス署名認証または owner-signing が存在する場合のみです。  
ローカル信頼だけでは、OpenClaw はそのデバイスを完全に認証済みとは扱いません。

### bootstrap が行うこと

`openclaw matrix verify bootstrap` は、暗号化された Matrix アカウントの修復およびセットアップ用コマンドです。  
これは順番に次のすべてを行います:

- 可能であれば既存の復旧キーを再利用して、secret storage をブートストラップする
- クロス署名をブートストラップし、不足している公開クロス署名キーをアップロードする
- 現在のデバイスにマークを付けてクロス署名することを試みる
- サーバー側の新しいルームキー backup がまだ存在しない場合は作成する

homeserver がクロス署名キーのアップロードに対して対話型認証を要求する場合、OpenClaw はまず認証なしでアップロードを試し、次に `m.login.dummy`、`channels.matrix.password` が設定されている場合は `m.login.password` で試します。

現在のクロス署名 ID を破棄して新しいものを作成したい場合にのみ、`--force-reset-cross-signing` を使用してください。

現在のルームキー backup を意図的に破棄して、今後のメッセージのために新しい backup ベースラインを開始したい場合は、`openclaw matrix verify backup reset --yes` を使用してください。  
これは、復旧不能な古い暗号化履歴が利用不可のままになること、および現在の backup secret を安全に読み込めない場合に OpenClaw が secret storage を再作成する可能性があることを受け入れる場合にのみ行ってください。

### 新しい backup ベースライン

今後の暗号化メッセージを引き続き機能させつつ、復旧不能な古い履歴を失うことを受け入れる場合は、次のコマンドを順に実行します:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

名前付き Matrix アカウントを明示的に対象にしたい場合は、各コマンドに `--account <id>` を追加してください。

### 起動時の挙動

`encryption: true` の場合、Matrix は `startupVerification` のデフォルトを `"if-unverified"` にします。  
起動時にこのデバイスがまだ未認証であれば、Matrix は別の Matrix クライアントで自己認証を要求し、すでに保留中の要求がある場合は重複要求をスキップし、再起動後に再試行する前にローカルのクールダウンを適用します。  
デフォルトでは、要求作成に成功した場合よりも、要求試行に失敗した場合の方が早く再試行されます。  
自動起動時要求を無効にしたい場合は `startupVerification: "off"` を設定するか、再試行ウィンドウを短くまたは長くしたい場合は `startupVerificationCooldownHours` を調整してください。

起動時には、保守的な crypto bootstrap パスも自動的に実行されます。  
このパスは、まず現在の secret storage とクロス署名 ID の再利用を試み、明示的な bootstrap 修復フローを実行しない限り、クロス署名のリセットを避けます。

起動時にそれでも壊れた bootstrap 状態が見つかった場合、OpenClaw は `channels.matrix.password` が設定されていなくても、保護された修復パスを試行できます。  
その修復に homeserver がパスワードベースの UIA を要求する場合、OpenClaw は警告を記録し、bot を中断するのではなく起動を非致命的なまま維持します。  
現在のデバイスがすでに owner-signed である場合、OpenClaw はその ID を自動でリセットせず保持します。

完全なアップグレードフロー、制限、復旧コマンド、一般的な移行メッセージについては、[Matrix migration](/ja-JP/install/migrating-matrix) を参照してください。

### 認証通知

Matrix は認証ライフサイクル通知を、厳格な DM 認証ルームに `m.notice` メッセージとして直接投稿します。  
これには次が含まれます:

- 認証要求通知
- 認証準備完了通知（明示的な「絵文字で認証する」案内付き）
- 認証開始および完了通知
- 利用可能な場合の SAS 詳細（絵文字および 10 進数）

別の Matrix クライアントからの受信認証要求は、OpenClaw が追跡し、自動受諾します。  
自己認証フローでは、絵文字認証が利用可能になると OpenClaw は SAS フローも自動開始し、自身の側を確認します。  
別の Matrix ユーザー/デバイスからの認証要求では、OpenClaw は要求を自動受諾し、その後 SAS フローが通常どおり進むのを待ちます。  
認証を完了するには、引き続きあなたの Matrix クライアントで絵文字または 10 進数の SAS を比較し、そこで「一致している」を確認する必要があります。

OpenClaw は自己開始の重複フローを無条件には自動受諾しません。起動時には、自己認証要求がすでに保留中である場合、新しい要求の作成をスキップします。

認証プロトコル/システム通知は agent chat pipeline には転送されないため、`NO_REPLY` は生成されません。

### デバイス衛生

古い OpenClaw 管理の Matrix デバイスがアカウント上に蓄積し、暗号化ルームの信頼状態を把握しづらくなることがあります。  
次のコマンドで一覧表示します:

```bash
openclaw matrix devices list
```

古い OpenClaw 管理デバイスを削除するには次を使用します:

```bash
openclaw matrix devices prune-stale
```

### Crypto store

Matrix E2EE は、Node 上で公式の `matrix-js-sdk` の Rust crypto パスを使用し、IndexedDB shim として `fake-indexeddb` を使用します。crypto 状態はスナップショットファイル（`crypto-idb-snapshot.json`）に永続化され、起動時に復元されます。スナップショットファイルは機密性の高い実行時状態であり、厳格なファイル権限で保存されます。

暗号化された実行時状態は、アカウントごと・ユーザーごと・トークンハッシュごとのルート配下に保存されます:
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`。  
このディレクトリには、sync store（`bot-storage.json`）、crypto store（`crypto/`）、
復旧キーファイル（`recovery-key.json`）、IndexedDB スナップショット（`crypto-idb-snapshot.json`）、
スレッドバインディング（`thread-bindings.json`）、起動時認証状態（`startup-verification.json`）が含まれます。  
トークンが変わってもアカウント ID が同じである場合、OpenClaw はその account/homeserver/user タプルに対して最適な既存ルートを再利用するため、以前の sync 状態、crypto 状態、スレッドバインディング、および起動時認証状態が引き続き参照可能です。

## プロファイル管理

選択したアカウントの Matrix 自己プロファイルを更新するには、次を使用します:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

名前付き Matrix アカウントを明示的に対象にしたい場合は、`--account <id>` を追加してください。

Matrix は `mxc://` のアバター URL をそのまま受け入れます。`http://` または `https://` のアバター URL を渡した場合、OpenClaw はまずそれを Matrix にアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl`（または選択したアカウント上書き設定）に書き戻します。

## スレッド

Matrix は、自動返信と message-tool 送信の両方でネイティブ Matrix スレッドをサポートします。

- `dm.sessionScope: "per-user"`（デフォルト）は Matrix DM ルーティングを送信者単位で維持するため、同じ相手に解決される複数の DM ルームが 1 つのセッションを共有できます。
- `dm.sessionScope: "per-room"` は、通常の DM 認証と allowlist チェックを引き続き使用しながら、各 Matrix DM ルームをそれぞれ独立したセッションキーに分離します。
- 明示的な Matrix 会話バインディングは引き続き `dm.sessionScope` より優先されるため、バインド済みルームやスレッドは選択された対象セッションを維持します。
- `threadReplies: "off"` は返信をトップレベルのままにし、受信したスレッド付きメッセージも親セッション上で処理します。
- `threadReplies: "inbound"` は、受信メッセージがすでにそのスレッド内にあった場合にのみ、スレッド内で返信します。
- `threadReplies: "always"` は、ルーム返信をトリガーメッセージをルートとするスレッド内に維持し、その会話を最初のトリガーメッセージから対応するスレッド単位セッション経由でルーティングします。
- `dm.threadReplies` はトップレベル設定を DM に対してのみ上書きします。たとえば、ルームスレッドは分離したまま、DM はフラットに保てます。
- 受信したスレッド付きメッセージには、追加の agent コンテキストとしてスレッドルートメッセージが含まれます。
- 対象が同じルーム、または同じ DM ユーザー対象である場合、message-tool 送信は、明示的な `threadId` が指定されていない限り、現在の Matrix スレッドを自動継承します。
- 同一セッションの DM ユーザー対象再利用は、現在のセッションメタデータが同一 Matrix アカウント上の同一 DM 相手であることを証明できる場合にのみ有効になります。それ以外の場合、OpenClaw は通常のユーザー単位ルーティングにフォールバックします。
- OpenClaw が、ある Matrix DM ルームが同じ共有 Matrix DM セッション上の別の DM ルームと衝突していることを検出した場合、thread bindings が有効で `dm.sessionScope` のヒントがあると、そのルームに `/focus` エスケープハッチを案内する 1 回限りの `m.notice` を投稿します。
- Matrix は実行時 thread bindings をサポートします。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドバインドされた `/acp spawn` は、Matrix ルームと DM で機能します。
- トップレベルの Matrix ルーム/DM での `/focus` は、`threadBindings.spawnSubagentSessions=true` の場合、新しい Matrix スレッドを作成して対象セッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行した場合は、その現在のスレッドが代わりにバインドされます。

## ACP 会話バインディング

Matrix ルーム、DM、および既存の Matrix スレッドは、チャット画面を変えずに永続的な ACP ワークスペースにできます。

高速なオペレーターフロー:

- 引き続き使いたい Matrix DM、ルーム、または既存スレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM/ルームがそのままチャット画面として維持され、以後のメッセージは生成された ACP セッションにルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` はその現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じて、バインディングを削除します。

注記:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnAcpSessions` は、OpenClaw が子 Matrix スレッドを作成またはバインドする必要がある `/acp spawn --thread auto|here` の場合にのみ必要です。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャネルごとの上書きもサポートします:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix のスレッドバインドされた spawn フラグはオプトインです:

- `threadBindings.spawnSubagentSessions: true` を設定すると、トップレベルの `/focus` で新しい Matrix スレッドを作成してバインドできるようになります。
- `threadBindings.spawnAcpSessions: true` を設定すると、`/acp spawn --thread auto|here` で ACP セッションを Matrix スレッドにバインドできるようになります。

## リアクション

Matrix は、送信リアクションアクション、受信リアクション通知、および受信 ack リアクションをサポートします。

- 送信リアクションツールは `channels["matrix"].actions.reactions` によって制御されます。
- `react` は特定の Matrix イベントにリアクションを追加します。
- `reactions` は特定の Matrix イベントに対する現在のリアクション要約を一覧表示します。
- `emoji=""` は、そのイベント上の bot アカウント自身のリアクションを削除します。
- `remove: true` は、bot アカウントによる指定した絵文字リアクションのみを削除します。

ack リアクションは、標準の OpenClaw 解決順序を使用します:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- agent identity の絵文字フォールバック

ack リアクションのスコープは次の順序で解決されます:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

リアクション通知モードは次の順序で解決されます:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- デフォルト: `own`

挙動:

- `reactionNotifications: "own"` は、bot が作成した Matrix メッセージを対象とする追加済み `m.reaction` イベントを転送します。
- `reactionNotifications: "off"` はリアクションのシステムイベントを無効化します。
- リアクションの削除は、Matrix ではそれが独立した `m.reaction` の削除ではなく redact として扱われるため、システムイベントとして合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージが agent をトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックし、両方未設定の場合の有効デフォルトは `0` です。無効化するには `0` を設定します。
- Matrix ルーム履歴はルームのみです。DM は引き続き通常のセッション履歴を使用します。
- Matrix ルーム履歴は pending-only です。OpenClaw はまだ返信をトリガーしていないルームメッセージをバッファし、メンションやその他のトリガーが届いたときにそのウィンドウをスナップショットします。
- 現在のトリガーメッセージは `InboundHistory` には含まれません。そのターンのメインの受信本文に残ります。
- 同じ Matrix イベントの再試行では、より新しいルームメッセージへずれていくのではなく、元の履歴スナップショットを再利用します。

## コンテキスト可視性

Matrix は、取得した返信テキスト、スレッドルート、pending 履歴などの補助ルームコンテキストに対して、共通の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補助コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブなルーム/ユーザー allowlist チェックで許可された送信者に補助コンテキストを絞り込みます。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、1 件の明示的な引用返信は引き続き保持します。

この設定が影響するのは補助コンテキストの可視性であり、受信メッセージ自体が返信をトリガーできるかどうかではありません。  
トリガー認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、および DM policy 設定から決まります。

## DM とルームポリシー

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

メンションゲートと allowlist の挙動については、[Groups](/ja-JP/channels/groups) を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前に引き続きメッセージを送ってきた場合、OpenClaw は同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに、短いクールダウン後に再度リマインダー返信を送ることがあります。

共通の DM ペアリングフローと保存レイアウトについては、[Pairing](/ja-JP/channels/pairing) を参照してください。

## ダイレクトルーム修復

ダイレクトメッセージ状態の同期がずれると、OpenClaw がライブ DM ではなく古い単独ルームを指す古い `m.direct` マッピングを保持してしまうことがあります。相手に対する現在のマッピングを調べるには、次を実行します:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには次を実行します:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修復フロー:

- すでに `m.direct` にマップされている厳密な 1:1 DM を優先する
- それがなければ、そのユーザーとの現在参加中の厳密な 1:1 DM にフォールバックする
- 健全な DM が存在しない場合は、新しいダイレクトルームを作成して `m.direct` を書き換える

修復フローは古いルームを自動削除しません。健全な DM を選択してマッピングを更新するだけなので、新しい Matrix 送信、認証通知、およびその他のダイレクトメッセージフローが再び正しいルームを対象にするようになります。

## Exec 承認

Matrix は Matrix アカウント用のネイティブ承認クライアントとして機能できます。ネイティブの
DM/channel ルーティング knobs は引き続き exec approval config 配下にあります:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（任意。未設定時は `channels.matrix.dm.allowFrom` にフォールバック）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

承認者は `@owner:example.org` のような Matrix user ID である必要があります。Matrix は、`enabled` が未設定または `"auto"` で、かつ少なくとも 1 人の承認者を解決できる場合に、ネイティブ承認を自動有効化します。Exec 承認は最初に `execApprovals.approvers` を使用し、`channels.matrix.dm.allowFrom` にフォールバックできます。Plugin 承認は `channels.matrix.dm.allowFrom` を通じて認可されます。Matrix をネイティブ承認クライアントとして明示的に無効化するには、`enabled: false` を設定してください。それ以外の場合、承認要求は他の設定済み承認ルートまたは承認フォールバックポリシーにフォールバックします。

Matrix ネイティブルーティングは両方の承認種別をサポートします:

- `channels.matrix.execApprovals.*` は、Matrix 承認プロンプトのネイティブ DM/channel ファンアウトモードを制御します。
- Exec 承認は `execApprovals.approvers` または `channels.matrix.dm.allowFrom` からの exec approver セットを使用します。
- Plugin 承認は `channels.matrix.dm.allowFrom` からの Matrix DM allowlist を使用します。
- Matrix のリアクションショートカットとメッセージ更新は、exec 承認と Plugin 承認の両方に適用されます。

配信ルール:

- `target: "dm"` は承認プロンプトを approver DM に送信します
- `target: "channel"` はプロンプトを元の Matrix ルームまたは DM に送り返します
- `target: "both"` は approver DM と元の Matrix ルームまたは DM の両方に送信します

Matrix 承認プロンプトは、主要な承認メッセージにリアクションショートカットを初期設定します:

- `✅` = 1 回だけ許可
- `❌` = 拒否
- `♾️` = 有効な exec ポリシーでその判断が許可されている場合に常に許可

承認者はそのメッセージにリアクションするか、フォールバックのスラッシュコマンド `/approve <id> allow-once`、`/approve <id> allow-always`、または `/approve <id> deny` を使用できます。

承認または拒否できるのは、解決済み承認者のみです。exec 承認では、channel 配信にはコマンドテキストが含まれるため、`channel` または `both` は信頼できるルームでのみ有効にしてください。

アカウント単位の上書き:

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

トップレベルの `channels.matrix` の値は、アカウント側で上書きされない限り、名前付きアカウントのデフォルトとして機能します。  
継承されたルームエントリを 1 つの Matrix アカウントに限定するには、`groups.<room>.account` を使用できます。  
`account` を持たないエントリはすべての Matrix アカウントで共有されたままとなり、`account: "default"` を持つエントリも、デフォルトアカウントがトップレベルの `channels.matrix.*` に直接設定されている場合は引き続き機能します。  
共有された部分的な認証デフォルトだけでは、それ自体で別個の暗黙的デフォルトアカウントは作成されません。OpenClaw がトップレベルの `default` アカウントを合成するのは、そのデフォルトに新しい認証情報（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）がある場合のみです。名前付きアカウントは、後でキャッシュされた認証情報が認証要件を満たす場合、`homeserver` + `userId` だけでも引き続き検出可能です。  
Matrix にすでに 1 つだけ名前付きアカウントがある場合、または `defaultAccount` が既存の名前付きアカウントキーを指している場合、シングルアカウントからマルチアカウントへの修復/セットアップ昇格では、新しい `accounts.default` エントリを作成せず、そのアカウントを保持します。昇格されたアカウントに移動するのは Matrix の auth/bootstrap キーのみで、共有配信ポリシーキーはトップレベルに残ります。  
暗黙的なルーティング、プロービング、および CLI 操作で OpenClaw に特定の名前付き Matrix アカウントを優先させたい場合は、`defaultAccount` を設定してください。  
複数の Matrix アカウントが設定されていて、そのうち 1 つのアカウント ID が `default` である場合、`defaultAccount` が未設定でも OpenClaw はそのアカウントを暗黙的に使用します。  
複数の名前付きアカウントを設定する場合は、暗黙的なアカウント選択に依存する CLI コマンドで `defaultAccount` を設定するか、`--account <id>` を渡してください。  
1 つのコマンドだけでその暗黙的選択を上書きしたい場合は、`openclaw matrix verify ...` と `openclaw matrix devices ...` に `--account <id>` を渡してください。

共有のマルチアカウントパターンについては、[Configuration reference](/ja-JP/gateway/configuration-reference#multi-account-all-channels) を参照してください。

## プライベート/LAN homeserver

デフォルトでは、OpenClaw は SSRF 保護のために、プライベート/内部 Matrix homeserver をブロックします。アカウント単位で明示的にオプトインした場合のみ接続できます。

homeserver が localhost、LAN/Tailscale IP、または内部ホスト名で動作している場合は、その Matrix アカウントに対して
`network.dangerouslyAllowPrivateNetwork` を有効にしてください:

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

CLI セットアップ例:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

このオプトインで許可されるのは、信頼できるプライベート/内部ターゲットのみです。  
`http://matrix.example.org:8008` のような公開クリアテキスト homeserver は引き続きブロックされます。可能な限り `https://` を推奨します。

## Matrix トラフィックのプロキシ

Matrix デプロイで明示的な送信 HTTP(S) プロキシが必要な場合は、`channels.matrix.proxy` を設定してください:

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
OpenClaw は、実行時の Matrix トラフィックとアカウント状態のプローブの両方で同じプロキシ設定を使用します。

## ターゲット解決

Matrix は、OpenClaw がルームまたはユーザーのターゲットを求めるすべての場面で、次のターゲット形式を受け付けます:

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

ライブディレクトリ検索は、ログイン中の Matrix アカウントを使用します:

- ユーザー検索は、その homeserver 上の Matrix ユーザーディレクトリを問い合わせます。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け付け、その後そのアカウントで参加中のルーム名検索にフォールバックします。
- 参加中ルーム名検索はベストエフォートです。ルーム名を ID またはエイリアスに解決できない場合、実行時の allowlist 解決では無視されます。

## 設定リファレンス

- `enabled`: channel を有効または無効にします。
- `name`: アカウントの任意ラベル。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合の優先アカウント ID。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: この Matrix アカウントがプライベート/内部 homeserver に接続することを許可します。homeserver が `localhost`、LAN/Tailscale IP、または `matrix-synapse` のような内部ホストに解決される場合に有効にしてください。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。名前付きアカウントは独自の `proxy` でトップレベルデフォルトを上書きできます。
- `userId`: 完全な Matrix user ID。例: `@bot:example.org`。
- `accessToken`: トークンベース認証用のアクセストークン。`channels.matrix.accessToken` と `channels.matrix.accounts.<id>.accessToken` では、env/file/exec provider 全体でプレーンテキスト値と SecretRef 値をサポートします。[Secrets Management](/ja-JP/gateway/secrets) を参照してください。
- `password`: パスワードベースログイン用のパスワード。プレーンテキスト値と SecretRef 値をサポートします。
- `deviceId`: 明示的な Matrix device ID。
- `deviceName`: パスワードログイン時のデバイス表示名。
- `avatarUrl`: プロファイル同期と `profile set` 更新用に保存される self-avatar URL。
- `initialSyncLimit`: 起動時 sync 中に取得するイベントの最大数。
- `encryption`: E2EE を有効にします。
- `allowlistOnly`: `true` の場合、`open` ルームポリシーを `allowlist` に引き上げ、`disabled` を除くすべてのアクティブ DM ポリシー（`pairing` と `open` を含む）を `allowlist` に強制します。`disabled` ポリシーには影響しません。
- `allowBots`: 他の設定済み OpenClaw Matrix アカウントからのメッセージを許可します（`true` または `"mentions"`）。
- `groupPolicy`: `open`、`allowlist`、または `disabled`。
- `contextVisibility`: 補助ルームコンテキストの可視性モード（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`: ルームトラフィック用の user ID allowlist。完全な Matrix user ID が最も安全です。完全一致のディレクトリ一致は、起動時および monitor 実行中に allowlist が変更されたときに解決されます。解決できない名前は無視されます。
- `historyLimit`: グループ履歴コンテキストとして含めるルームメッセージ数の上限。`messages.groupChat.historyLimit` にフォールバックし、両方未設定の場合の有効デフォルトは `0` です。無効化するには `0` を設定します。
- `replyToMode`: `off`、`first`、`all`、または `batched`。
- `markdown`: 送信 Matrix テキスト用の任意の Markdown レンダリング設定。
- `streaming`: `off`（デフォルト）、`"partial"`、`"quiet"`、`true`、または `false`。`"partial"` と `true` は、通常の Matrix テキストメッセージによるプレビュー先行の下書き更新を有効にします。`"quiet"` は、セルフホスト push-rule 構成向けに通知なしのプレビュー notice を使用します。`false` は `"off"` と同等です。
- `blockStreaming`: `true` の場合、下書きプレビュー ストリーミングが有効な間、完了済み assistant ブロック用の個別進行状況メッセージを有効にします。
- `threadReplies`: `off`、`inbound`、または `always`。
- `threadBindings`: スレッドバインドされたセッションルーティングとライフサイクル用の channel 単位上書き。
- `startupVerification`: 起動時の自動自己認証要求モード（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`: 起動時自動認証要求を再試行するまでのクールダウン。
- `textChunkLimit`: 文字単位の送信メッセージ chunk サイズ（`chunkMode` が `length` のときに適用）。
- `chunkMode`: `length` は文字数でメッセージを分割し、`newline` は行境界で分割します。
- `responsePrefix`: この channel のすべての送信返信の先頭に付ける任意文字列。
- `ackReaction`: この channel/アカウント用の任意の ack リアクション上書き。
- `ackReactionScope`: 任意の ack リアクションスコープ上書き（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`: 受信リアクション通知モード（`own`、`off`）。
- `mediaMaxMb`: 送信と受信メディア処理におけるメディアサイズ上限（MB）。
- `autoJoin`: 招待自動参加ポリシー（`always`、`allowlist`、`off`）。デフォルト: `off`。DM 形式の招待を含むすべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `allowlist` のときに許可されるルーム/エイリアス。エイリアス項目は招待処理中にルーム ID に解決されます。OpenClaw は、招待されたルームが主張するエイリアス状態を信頼しません。
- `dm`: DM ポリシーブロック（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`: OpenClaw がルームに参加し、それを DM と分類した後の DM アクセスを制御します。招待を自動参加するかどうかは変更しません。
- `dm.allowFrom`: DM トラフィック用の user ID allowlist。完全な Matrix user ID が最も安全です。完全一致のディレクトリ一致は、起動時および monitor 実行中に allowlist が変更されたときに解決されます。解決できない名前は無視されます。
- `dm.sessionScope`: `per-user`（デフォルト）または `per-room`。相手が同じでも各 Matrix DM ルームで個別のコンテキストを保持したい場合は `per-room` を使用してください。
- `dm.threadReplies`: DM 専用のスレッドポリシー上書き（`off`、`inbound`、`always`）。DM における返信配置とセッション分離の両方で、トップレベルの `threadReplies` 設定を上書きします。
- `execApprovals`: Matrix ネイティブ exec 承認配信（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`: exec 要求を承認できる Matrix user ID。`dm.allowFrom` がすでに承認者を特定している場合は任意です。
- `execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。
- `accounts`: 名前付きのアカウント単位上書き。トップレベルの `channels.matrix` 値はこれらのエントリのデフォルトとして機能します。
- `groups`: ルーム単位ポリシーマップ。ルーム ID またはエイリアスを推奨します。解決できないルーム名は実行時に無視されます。解決後のセッション/グループ ID には安定したルーム ID が使用されます。
- `groups.<room>.account`: マルチアカウント構成で、1 つの継承ルームエントリを特定の Matrix アカウントに制限します。
- `groups.<room>.allowBots`: 設定済み bot 送信者に対するルームレベル上書き（`true` または `"mentions"`）。
- `groups.<room>.users`: ルーム単位の送信者 allowlist。
- `groups.<room>.tools`: ルーム単位のツール許可/拒否上書き。
- `groups.<room>.autoReply`: ルームレベルのメンションゲート上書き。`true` はそのルームのメンション必須を無効にし、`false` は再び有効にします。
- `groups.<room>.skills`: 任意のルームレベル skill フィルター。
- `groups.<room>.systemPrompt`: 任意のルームレベル system prompt スニペット。
- `rooms`: `groups` の旧エイリアス。
- `actions`: アクション単位のツール制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべての channel
- [Pairing](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの挙動とメンションゲート
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
