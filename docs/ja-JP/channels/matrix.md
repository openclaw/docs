---
read_when:
    - OpenClaw で Matrix を設定する
    - Matrix E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、設定例
title: Matrix
x-i18n:
    generated_at: "2026-05-06T04:57:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
    source_path: channels/matrix.md
    workflow: 16
---

MatrixはOpenClaw向けのダウンロード可能なチャンネルPluginです。
公式の`matrix-js-sdk`を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EEをサポートします。

## インストール

チャンネルを設定する前にMatrixをインストールします。

```bash
openclaw plugins install @openclaw/matrix
```

ローカルチェックアウトからの場合:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install`はPluginを登録して有効化するため、別途`openclaw plugins enable matrix`の手順は不要です。ただし、下記でチャンネルを設定するまではPluginは何もしません。Pluginの一般的な動作とインストールルールについては[Plugins](/ja-JP/tools/plugin)を参照してください。

## セットアップ

1. 使用するhomeserverでMatrixアカウントを作成します。
2. `channels.matrix`に`homeserver` + `accessToken`、または`homeserver` + `userId` + `password`を設定します。
3. Gatewayを再起動します。
4. ボットとのDMを開始するか、ルームに招待します（[自動参加](#auto-join)を参照。新しい招待は`autoJoin`で許可されている場合にのみ反映されます）。

### 対話式セットアップ

```bash
openclaw channels add
openclaw configure --section channels
```

ウィザードでは、homeserver URL、認証方式（アクセストークンまたはパスワード）、ユーザーID（パスワード認証のみ）、任意のデバイス名、E2EEを有効化するかどうか、ルームアクセスと自動参加を設定するかどうかを尋ねます。

一致する`MATRIX_*`環境変数がすでに存在し、選択したアカウントに保存済み認証がない場合、ウィザードは環境変数のショートカットを提示します。許可リストを保存する前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"`を実行します。E2EEが有効な場合、ウィザードは設定を書き込み、[`openclaw matrix encryption setup`](#encryption-and-verification)と同じブートストラップを実行します。

### 最小設定

トークンベース:

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

パスワードベース（初回ログイン後にトークンがキャッシュされます）:

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

### 自動参加

`channels.matrix.autoJoin`のデフォルトは`off`です。デフォルトでは、手動で参加するまで、新しい招待による新規ルームやDMにボットは表示されません。

OpenClawは招待時点で、招待されたルームがDMかグループかを判別できないため、DM形式の招待を含むすべての招待は、まず`autoJoin`を通過します。`dm.policy`は、ボットが参加してルームが分類された後にのみ適用されます。

<Warning>
ボットが受け入れる招待を制限するには`autoJoin: "allowlist"`と`autoJoinAllowlist`を設定し、すべての招待を受け入れるには`autoJoin: "always"`を設定します。

`autoJoinAllowlist`が受け付けるのは安定したターゲットのみです: `!roomId:server`、`#alias:server`、または`*`。プレーンなルーム名は拒否されます。エイリアスエントリはhomeserverに対して解決され、招待されたルームが主張する状態に対しては解決されません。
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

すべての招待を受け入れるには、`autoJoin: "always"`を使用します。

### 許可リストターゲットの形式

DMとルームの許可リストには、安定したIDを設定するのが最適です。

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）: `@user:server`を使用します。表示名は、homeserverディレクトリが完全に1件の一致を返した場合にのみ解決されます。
- ルーム（`groups`、`autoJoinAllowlist`）: `!room:server`または`#alias:server`を使用します。名前は参加済みルームに対してベストエフォートで解決されます。未解決のエントリは実行時に無視されます。

### アカウントIDの正規化

ウィザードはわかりやすい名前を正規化されたアカウントIDに変換します。たとえば、`Ops Bot`は`ops-bot`になります。スコープ付き環境変数名では、2つのアカウントが衝突しないように句読点がエスケープされます: `-` → `_X2D_`のため、`ops-prod`は`MATRIX_OPS_X2D_PROD_*`に対応します。

### キャッシュされた認証情報

Matrixはキャッシュされた認証情報を`~/.openclaw/credentials/matrix/`に保存します。

- デフォルトアカウント: `credentials.json`
- 名前付きアカウント: `credentials-<account>.json`

そこにキャッシュされた認証情報が存在する場合、アクセストークンが設定ファイルになくても、OpenClawはMatrixが設定済みであると扱います。これはセットアップ、`openclaw doctor`、チャンネルステータスのプローブに適用されます。

### 環境変数

同等の設定キーが設定されていない場合に使用されます。デフォルトアカウントではプレフィックスなしの名前を使用し、名前付きアカウントではサフィックスの前にアカウントIDを挿入します。

| デフォルトアカウント | 名前付きアカウント（`<ID>`は正規化されたアカウントID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

アカウント`ops`の場合、名前は`MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN`などになります。リカバリキーの環境変数は、`--recovery-key-stdin`でキーをパイプ入力する場合に、リカバリ対応のCLIフロー（`verify backup restore`、`verify device`、`verify bootstrap`）によって読み取られます。

`MATRIX_HOMESERVER`はワークスペースの`.env`から設定できません。[ワークスペース`.env`ファイル](/ja-JP/gateway/security)を参照してください。

## 設定例

DMペアリング、ルーム許可リスト、E2EEを含む実用的なベースライン:

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
        "!roomid:example.org": { requireMention: true },
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

## ストリーミングプレビュー

Matrix返信ストリーミングはオプトインです。`streaming`は、OpenClawが進行中のアシスタント返信をどのように配信するかを制御します。`blockStreaming`は、完了した各ブロックを個別のMatrixメッセージとして保持するかどうかを制御します。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

ライブ回答プレビューは維持しつつ、一時的なツール/進行状況行を非表示にするには、オブジェクト形式を使用します。

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming` | 動作 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（デフォルト） | 完全な返信を待ってから一度だけ送信します。`true` ↔ `"partial"`、`false` ↔ `"off"`。 |
| `"partial"` | モデルが現在のブロックを書き込む間、通常のテキストメッセージ1件をその場で編集します。標準のMatrixクライアントは、最終編集ではなく最初のプレビューで通知する場合があります。 |
| `"quiet"` | `"partial"`と同じですが、メッセージは通知しないnoticeです。受信者は、ユーザーごとのプッシュルールが確定済み編集に一致した場合にのみ通知を受け取ります（下記を参照）。 |

`blockStreaming`は`streaming`とは独立しています。

| `streaming` | `blockStreaming: true` | `blockStreaming: false`（デフォルト） |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 現在のブロックのライブ下書き、完了したブロックはメッセージとして保持 | 現在のブロックのライブ下書き、その場で確定 |
| `"off"` | 完了したブロックごとに通知ありのMatrixメッセージを1件 | 完全な返信に対して通知ありのMatrixメッセージを1件 |

注:

- プレビューがMatrixのイベントごとのサイズ制限を超えた場合、OpenClawはプレビューストリーミングを停止し、最終結果のみの配信にフォールバックします。
- メディア返信は常に添付ファイルを通常どおり送信します。古いプレビューを安全に再利用できなくなった場合、OpenClawは最終的なメディア返信を送信する前にそれをredactします。
- Matrixプレビューストリーミングが有効な場合、ツール進行状況のプレビュー更新はデフォルトで有効です。回答テキストのプレビュー編集は維持し、ツール進行状況は通常の配信パスに残すには、`streaming.preview.toolProgress: false`を設定します。
- プレビュー編集には追加のMatrix API呼び出しが必要です。最も保守的なレート制限プロファイルが必要な場合は、`streaming: "off"`のままにしてください。

## 承認メタデータ

Matrixネイティブの承認プロンプトは通常の`m.room.message`イベントであり、`com.openclaw.approval`配下にOpenClaw固有のカスタムイベントコンテンツを持ちます。Matrixはカスタムイベントコンテンツキーを許可しているため、標準クライアントはテキスト本文をそのまま表示し、OpenClaw対応クライアントは構造化された承認ID、種類、状態、利用可能な判断、exec/Pluginの詳細を読み取れます。

承認プロンプトが1つのMatrixイベントには長すぎる場合、OpenClawは表示テキストをチャンク化し、最初のチャンクにのみ`com.openclaw.approval`を添付します。許可/拒否の判断に対するリアクションはその最初のイベントに結び付けられるため、長いプロンプトでも単一イベントのプロンプトと同じ承認ターゲットを維持します。

### quietの確定済みプレビュー用セルフホスト型プッシュルール

`streaming: "quiet"`は、ブロックまたはターンが確定した時点でのみ受信者に通知します。ユーザーごとのプッシュルールが確定済みプレビューマーカーに一致する必要があります。完全な手順（受信者トークン、pusherチェック、ルールインストール、homeserverごとの注記）については、[quietプレビュー用Matrixプッシュルール](/ja-JP/channels/matrix-push-rules)を参照してください。

## ボット間ルーム

デフォルトでは、設定済みの他のOpenClaw MatrixアカウントからのMatrixメッセージは無視されます。

エージェント間のMatrixトラフィックを意図的に有効にしたい場合は、`allowBots`を使用します。

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
- `allowBots: "mentions"`は、それらのメッセージがルーム内でこのボットに明示的にメンションしている場合にのみ受け入れます。DMは引き続き許可されます。
- `groups.<room>.allowBots`は、1つのルームについてアカウントレベルの設定を上書きします。
- OpenClawは、自己返信ループを避けるため、同じMatrixユーザーIDからのメッセージは引き続き無視します。
- Matrixはここでネイティブなボットフラグを公開していません。OpenClawは「ボット作成」とは「このOpenClaw Gateway上で設定済みの別のMatrixアカウントによって送信されたもの」として扱います。

共有ルームでボット間トラフィックを有効にする場合は、厳格なルーム許可リストとメンション要件を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントは`thumbnail_file`を使用するため、画像プレビューも完全な添付ファイルとともに暗号化されます。暗号化されていないルームでは、引き続きプレーンな`thumbnail_url`を使用します。設定は不要です。PluginがE2EE状態を自動的に検出します。

すべての`openclaw matrix`コマンドは、`--verbose`（完全な診断）、`--json`（機械可読出力）、`--account <id>`（マルチアカウント設定）を受け付けます。デフォルトの出力は簡潔で、内部SDKログは抑制されます。以下の例は標準形を示しています。必要に応じてフラグを追加してください。

### 暗号化を有効化

```bash
openclaw matrix encryption setup
```

シークレットストレージとクロス署名をブートストラップし、必要に応じてルームキーのバックアップを作成してから、ステータスと次の手順を出力します。便利なフラグ:

- `--recovery-key <key>` ブートストラップ前にリカバリキーを適用します (下記で説明する stdin 形式を推奨)
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄して新しいものを作成します (意図している場合にのみ使用)

新しいアカウントでは、作成時に E2EE を有効にします:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` は `--enable-e2ee` のエイリアスです。

手動設定での同等例:

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

### ステータスと信頼シグナル

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` は 3 つの独立した信頼シグナルを報告します (`--verbose` ですべて表示):

- `Locally trusted`: このクライアントでのみ信頼されています
- `Cross-signing verified`: SDK がクロス署名による検証を報告しています
- `Signed by owner`: 自分自身の自己署名キーで署名されています (診断用のみ)

`Verified by owner` は `Cross-signing verified` が `yes` の場合にのみ `yes` になります。ローカルの信頼、または所有者署名だけでは不十分です。

`--allow-degraded-local-state` は、先に Matrix アカウントを準備せずにベストエフォートの診断を返します。オフラインまたは部分的に設定されたプローブに便利です。

### リカバリキーでこのデバイスを検証する

リカバリキーは機密情報です。コマンドラインで渡す代わりに stdin 経由でパイプしてください。`MATRIX_RECOVERY_KEY` (または名前付きアカウントでは `MATRIX_<ID>_RECOVERY_KEY`) を設定します:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

このコマンドは 3 つの状態を報告します:

- `Recovery key accepted`: Matrix がシークレットストレージまたはデバイス信頼用のキーを受け入れました。
- `Backup usable`: 信頼済みのリカバリ材料でルームキーのバックアップを読み込めます。
- `Device verified by owner`: このデバイスは Matrix のクロス署名 ID で完全に信頼されています。

リカバリキーでバックアップ材料のロックを解除できた場合でも、完全な ID 信頼が未完了であれば非ゼロで終了します。その場合は、別の Matrix クライアントから自己検証を完了します:

```bash
openclaw matrix verify self
```

`verify self` は `Cross-signing verified: yes` になるまで待機してから正常終了します。待機時間を調整するには `--timeout-ms <ms>` を使用します。

リテラルキー形式の `openclaw matrix verify device "<recovery-key>"` も受け付けますが、キーがシェル履歴に残ります。

### クロス署名をブートストラップまたは修復する

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` は、暗号化されたアカウントの修復およびセットアップ用コマンドです。順に、次を実行します:

- 可能な場合は既存のリカバリキーを再利用して、シークレットストレージをブートストラップします
- クロス署名をブートストラップし、不足している公開鍵をアップロードします
- 現在のデバイスをマークし、クロス署名します
- サーバー側のルームキーバックアップがまだ存在しない場合は作成します

ホームサーバーがクロス署名キーのアップロードに UIA を要求する場合、OpenClaw はまず認証なしを試し、次に `m.login.dummy`、その次に `m.login.password` を試します (`channels.matrix.password` が必要)。

便利なフラグ:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` と組み合わせる) または `--recovery-key <key>`
- 現在のクロス署名 ID を破棄する `--force-reset-cross-signing` (意図している場合のみ)

### ルームキーのバックアップ

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` は、サーバー側バックアップが存在するか、およびこのデバイスで復号できるかを表示します。`backup restore` は、バックアップされたルームキーをローカルの crypto ストアにインポートします。リカバリキーがすでにディスク上にある場合は、`--recovery-key-stdin` を省略できます。

壊れたバックアップを新しいベースラインに置き換えるには (復元不能な古い履歴が失われることを受け入れます。現在のバックアップシークレットを読み込めない場合は、シークレットストレージも再作成できます):

```bash
openclaw matrix verify backup reset --yes
```

以前のリカバリキーで新しいバックアップベースラインをアンロックできないようにしたい場合にのみ、`--rotate-recovery-key` を追加します。

### 検証の一覧表示、要求、応答

```bash
openclaw matrix verify list
```

選択したアカウントの保留中の検証リクエストを一覧表示します。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

この OpenClaw アカウントから検証リクエストを送信します。`--own-user` は自己検証を要求します (同じユーザーの別の Matrix クライアントでプロンプトを受け入れます)。`--user-id`/`--device-id`/`--room-id` は他の相手を対象にします。`--own-user` は他の対象指定フラグと組み合わせることはできません。

より低レベルのライフサイクル処理では、通常は別のクライアントからの受信リクエストを追跡している間に、これらのコマンドが特定のリクエスト `<id>` (`verify list` と `verify request` によって出力されます) に作用します:

| コマンド                                   | 目的                                                             |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 受信リクエストを受け入れる                                       |
| `openclaw matrix verify start <id>`        | SAS フローを開始する                                             |
| `openclaw matrix verify sas <id>`          | SAS の絵文字または数字を出力する                                 |
| `openclaw matrix verify confirm-sas <id>`  | SAS が相手のクライアントに表示されている内容と一致することを確認する |
| `openclaw matrix verify mismatch-sas <id>` | 絵文字または数字が一致しない場合に SAS を拒否する                 |
| `openclaw matrix verify cancel <id>`       | キャンセルする。任意の `--reason <text>` と `--code <matrix-code>` を受け付ける |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas`、`cancel` はすべて、検証が特定のダイレクトメッセージルームに紐づいている場合、DM のフォローアップヒントとして `--user-id` と `--room-id` を受け付けます。

### マルチアカウントの注意

`--account <id>` がない場合、Matrix CLI コマンドは暗黙のデフォルトアカウントを使用します。複数の名前付きアカウントがあり、`channels.matrix.defaultAccount` を設定していない場合、推測せず、選択を求めます。名前付きアカウントで E2EE が無効または利用不可の場合、エラーはそのアカウントの設定キーを指します。例: `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="起動時の動作">
    `encryption: true` の場合、`startupVerification` のデフォルトは `"if-unverified"` です。起動時、未検証のデバイスは別の Matrix クライアントでの自己検証を要求し、重複をスキップしてクールダウン (デフォルトでは 24 時間) を適用します。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効化します。

    起動時には、現在のシークレットストレージとクロス署名 ID を再利用する保守的な crypto ブートストラップ処理も実行されます。ブートストラップ状態が壊れている場合、OpenClaw は `channels.matrix.password` がなくてもガード付き修復を試みます。ホームサーバーがパスワード UIA を要求する場合、起動時は警告をログに記録し、致命的エラーにはしません。すでに所有者署名済みのデバイスは保持されます。

    完全なアップグレードフローについては [Matrix 移行](/ja-JP/channels/matrix-migration) を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は、厳格な DM 検証ルームに検証ライフサイクル通知を `m.notice` メッセージとして投稿します。リクエスト、準備完了 (「絵文字で検証」の案内付き)、開始/完了、および利用可能な場合は SAS (絵文字/数字) の詳細です。

    別の Matrix クライアントからの受信リクエストは追跡され、自動的に受け入れられます。自己検証では、OpenClaw は SAS フローを自動的に開始し、絵文字検証が利用可能になると自分側を確認します。引き続き Matrix クライアントで比較し、「一致しています」を確認する必要があります。

    検証システム通知はエージェントチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="削除済みまたは無効な Matrix デバイス">
    `verify status` が、現在のデバイスがホームサーバーにもう一覧表示されていないと示す場合は、新しい OpenClaw Matrix デバイスを作成します。パスワードログインの場合:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    トークン認証では、Matrix クライアントまたは管理 UI で新しいアクセストークンを作成してから、OpenClaw を更新します:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` を失敗したコマンドのアカウント ID に置き換えるか、デフォルトアカウントでは `--account` を省略します。

  </Accordion>

  <Accordion title="デバイスの整理">
    OpenClaw が管理する古いデバイスは蓄積されることがあります。一覧表示して整理します:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto ストア">
    Matrix E2EE は、IndexedDB シムとして `fake-indexeddb` を使い、公式の `matrix-js-sdk` Rust crypto パスを使用します。Crypto 状態は `crypto-idb-snapshot.json` に永続化されます (制限付きファイル権限)。

    暗号化されたランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下にあり、同期ストア、crypto ストア、リカバリキー、IDB スナップショット、スレッドバインディング、起動時検証状態を含みます。トークンが変わってもアカウント ID が同じ場合、OpenClaw は最適な既存ルートを再利用するため、以前の状態は引き続き表示されます。

  </Accordion>
</AccordionGroup>

## プロファイル管理

選択したアカウントの Matrix セルフプロファイルを更新します:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

1 回の呼び出しで両方のオプションを渡せます。Matrix は `mxc://` アバター URL を直接受け付けます。`http://` または `https://` を渡すと、OpenClaw はまずファイルをアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl` (またはアカウントごとの上書き) に保存します。

## スレッド

Matrix は、自動返信とメッセージツール送信の両方でネイティブ Matrix スレッドをサポートします。2 つの独立したノブが動作を制御します:

### セッションルーティング (`sessionScope`)

`dm.sessionScope` は、Matrix DM ルームを OpenClaw セッションにどのようにマップするかを決定します:

- `"per-user"` (デフォルト): 同じルーティング対象ピアを持つすべての DM ルームが 1 つのセッションを共有します。
- `"per-room"`: ピアが同じ場合でも、各 Matrix DM ルームが独自のセッションキーを持ちます。

明示的な会話バインディングは常に `sessionScope` より優先されるため、バインドされたルームとスレッドは選択された対象セッションを維持します。

### 返信スレッド化 (`threadReplies`)

`threadReplies` は、ボットが返信を投稿する場所を決定します:

- `"off"`: 返信はトップレベルです。受信したスレッド内メッセージは親セッションに留まります。
- `"inbound"`: 受信メッセージがすでにそのスレッド内にあった場合にのみ、スレッド内で返信します。
- `"always"`: トリガーとなったメッセージをルートとするスレッド内で返信します。その会話は最初のトリガー以降、一致するスレッドスコープのセッション経由でルーティングされます。

`dm.threadReplies` は DM に対してのみこれを上書きします。たとえば、ルームスレッドを分離したまま DM はフラットにできます。

### スレッド継承とスラッシュコマンド

- 受信したスレッド付きメッセージには、追加のエージェントコンテキストとしてスレッドのルートメッセージが含まれます。
- message-tool の送信は、同じルーム（または同じ DM ユーザーターゲット）を対象にしている場合、明示的な `threadId` が指定されていない限り、現在の Matrix スレッドを自動的に継承します。
- DM ユーザーターゲットの再利用は、現在のセッションメタデータが同じ Matrix アカウント上の同じ DM 相手であることを証明する場合にのみ有効になります。それ以外の場合、OpenClaw は通常のユーザースコープのルーティングにフォールバックします。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、スレッドにバインドされた `/acp spawn` はすべて、Matrix ルームと DM で動作します。
- トップレベルの `/focus` は、`threadBindings.spawnSessions` が有効な場合、新しい Matrix スレッドを作成し、それをターゲットセッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、そのスレッドがその場でバインドされます。

OpenClaw が、同じ共有セッション上で別の DM ルームと衝突している Matrix DM ルームを検出すると、そのルームに一度だけ `m.notice` を投稿し、`/focus` という回避手段を示して `dm.sessionScope` の変更を提案します。この通知は、スレッドバインディングが有効な場合にのみ表示されます。

## ACP 会話バインディング

Matrix ルーム、DM、既存の Matrix スレッドは、チャット画面を変更せずに永続的な ACP ワークスペースにできます。

高速なオペレーターフロー:

- 使い続けたい Matrix DM、ルーム、または既存スレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM/ルームがチャット画面のまま残り、以後のメッセージは生成された ACP セッションへルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` が現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

注記:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnSessions` は `/acp spawn --thread auto|here` を制御します。この場合、OpenClaw は子 Matrix スレッドを作成またはバインドする必要があります。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャネルごとの上書きにも対応しています。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix のスレッドバインドセッション生成はデフォルトでオンです。

- トップレベルの `/focus` と `/acp spawn --thread auto|here` が Matrix スレッドを作成/バインドするのをブロックするには、`threadBindings.spawnSessions: false` を設定します。
- ネイティブサブエージェントのスレッド生成で親トランスクリプトをフォークしないようにするには、`threadBindings.defaultSpawnContext: "isolated"` を設定します。

## リアクション

Matrix は送信リアクション、受信リアクション通知、ack リアクションに対応しています。

送信リアクションツールは `channels.matrix.actions.reactions` によって制御されます。

- `react` は Matrix イベントにリアクションを追加します。
- `reactions` は Matrix イベントの現在のリアクション概要を一覧表示します。
- `emoji=""` はそのイベント上のボット自身のリアクションを削除します。
- `remove: true` はボットから指定された絵文字リアクションだけを削除します。

**解決順序**（最初に定義された値が優先されます）:

| 設定                    | 順序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | アカウントごと → チャネル → `messages.ackReaction` → エージェント ID 絵文字フォールバック |
| `ackReactionScope`      | アカウントごと → チャネル → `messages.ackReactionScope` → デフォルト `"group-mentions"` |
| `reactionNotifications` | アカウントごと → チャネル → デフォルト `"own"`                                    |

`reactionNotifications: "own"` は、ボットが作成した Matrix メッセージを対象にして追加された `m.reaction` イベントを転送します。`"off"` はリアクションのシステムイベントを無効にします。リアクションの削除は、独立した `m.reaction` 削除としてではなく Matrix ではリダクションとして表面化するため、システムイベントには合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める直近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックします。どちらも未設定の場合、有効なデフォルトは `0` です。無効にするには `0` を設定します。
- Matrix ルーム履歴はルーム専用です。DM は通常のセッション履歴を使い続けます。
- Matrix ルーム履歴は保留中のものだけです。OpenClaw はまだ返信をトリガーしていないルームメッセージをバッファリングし、メンションやその他のトリガーが到着したときにそのウィンドウのスナップショットを作成します。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメイン受信本文に残ります。
- 同じ Matrix イベントの再試行では、新しいルームメッセージへ進むのではなく、元の履歴スナップショットを再利用します。

## コンテキスト可視性

Matrix は、取得した返信テキスト、スレッドルート、保留中履歴などの補足ルームコンテキストに対して、共有の `contextVisibility` 制御に対応しています。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブなルーム/ユーザー allowlist チェックで許可された送信者に補足コンテキストを絞り込みます。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的に引用された返信を 1 つ保持します。

この設定は補足コンテキストの可視性に影響しますが、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガー認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、DM ポリシー設定から決まります。

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
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

ルームを動作させたまま DM を完全に抑止するには、`dm.enabled: false` を設定します。

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

メンション制御と allowlist の動作については [グループ](/ja-JP/channels/groups) を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前にメッセージを送り続けた場合、OpenClaw は同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに、短いクールダウン後にリマインダー返信を送ることがあります。

共有 DM ペアリングフローと保存レイアウトについては [ペアリング](/ja-JP/channels/pairing) を参照してください。

## 直接ルーム修復

ダイレクトメッセージ状態の同期がずれると、OpenClaw は現在の DM ではなく古い 1 対 1 ルームを指す古い `m.direct` マッピングを持つことがあります。相手の現在のマッピングを検査します。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復します。

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

どちらのコマンドも、複数アカウント構成では `--account <id>` を受け付けます。修復フローは次のとおりです。

- `m.direct` にすでにマップされている厳密な 1:1 DM を優先します
- そのユーザーと現在参加中の厳密な 1:1 DM があれば、それにフォールバックします
- 正常な DM が存在しない場合、新しいダイレクトルームを作成して `m.direct` を書き換えます

古いルームは自動的には削除されません。正常な DM を選択してマッピングを更新し、以後の Matrix 送信、検証通知、その他のダイレクトメッセージフローが正しいルームを対象にするようにします。

## Exec 承認

Matrix はネイティブ承認クライアントとして機能できます。`channels.matrix.execApprovals`（アカウントごとの上書きでは `channels.matrix.accounts.<account>.execApprovals`）で設定します。

- `enabled`: Matrix ネイティブのプロンプトを通じて承認を配信します。未設定または `"auto"` の場合、少なくとも 1 人の承認者を解決できると Matrix は自動的に有効になります。明示的に無効にするには `false` を設定します。
- `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID（`@owner:example.org`）。省略可能です。`channels.matrix.dm.allowFrom` にフォールバックします。
- `target`: プロンプトの送信先です。`"dm"`（デフォルト）は承認者の DM に送信し、`"channel"` は発信元の Matrix ルームまたは DM に送信し、`"both"` は両方に送信します。
- `agentFilter` / `sessionFilter`: Matrix 配信をトリガーするエージェント/セッションの任意の allowlist です。

認可は承認の種類によって少し異なります。

- **Exec 承認** は `execApprovals.approvers` を使用し、`dm.allowFrom` にフォールバックします。
- **Plugin 承認** は `dm.allowFrom` のみを通じて認可します。

どちらの種類も Matrix リアクションショートカットとメッセージ更新を共有します。承認者には、主要な承認メッセージ上にリアクションショートカットが表示されます。

- `✅` 1 回だけ許可
- `❌` 拒否
- `♾️` 常に許可（有効な exec ポリシーが許可する場合）

フォールバックのスラッシュコマンド: `/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

解決された承認者だけが承認または拒否できます。exec 承認のチャネル配信にはコマンドテキストが含まれます。`channel` または `both` は信頼できるルームでのみ有効にしてください。

関連: [Exec 承認](/ja-JP/tools/exec-approvals)。

## スラッシュコマンド

スラッシュコマンド（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` など）は DM で直接動作します。ルームでは、OpenClaw はボット自身の Matrix メンションが前置されたコマンドも認識するため、`@bot:server /new` はカスタムメンション正規表現なしでコマンドパスをトリガーします。これにより、Element などのクライアントでユーザーがコマンド入力前にボットをタブ補完したときに発信される、ルーム形式の `@mention /command` 投稿にもボットが応答し続けられます。

認可ルールは引き続き適用されます。コマンド送信者は、通常のメッセージと同じ DM またはルームの allowlist/所有者ポリシーを満たす必要があります。

## 複数アカウント

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

**継承:**

- トップレベルの `channels.matrix` 値は、アカウントが上書きしない限り、名前付きアカウントのデフォルトとして機能します。
- `groups.<room>.account` を使って、継承されたルームエントリのスコープを特定のアカウントに限定します。`account` のないエントリはアカウント間で共有されます。デフォルトアカウントがトップレベルで設定されている場合も、`account: "default"` は引き続き機能します。

**デフォルトアカウント選択:**

- 暗黙のルーティング、プローブ、CLI コマンドで優先される名前付きアカウントを選択するには、`defaultAccount` を設定します。
- 複数のアカウントがあり、そのうち 1 つが文字どおり `default` という名前の場合、`defaultAccount` が未設定でも OpenClaw はそれを暗黙的に使用します。
- 複数の名前付きアカウントがあり、デフォルトが選択されていない場合、CLI コマンドは推測を拒否します。`defaultAccount` を設定するか、`--account <id>` を渡してください。
- トップレベルの `channels.matrix.*` ブロックは、認証が完全な場合（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）にのみ、暗黙の `default` アカウントとして扱われます。名前付きアカウントは、キャッシュされた認証情報が認証をカバーしていれば、`homeserver` + `userId` から引き続き検出できます。

**昇格:**

- 修復またはセットアップ中に OpenClaw が単一アカウント設定を複数アカウントへ昇格するとき、既存の名前付きアカウントがある場合、または `defaultAccount` がすでにそれを指している場合は、それを保持します。Matrix 認証/ブートストラップキーだけが昇格先アカウントへ移動し、共有配信ポリシーキーはトップレベルに残ります。

共有の複数アカウントパターンについては [設定リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels) を参照してください。

## プライベート/LAN ホームサーバー

デフォルトでは、OpenClaw は SSRF 保護のため、アカウントごとに明示的にオプトインしない限り、プライベート/内部 Matrix ホームサーバーをブロックします。

ホームサーバーが localhost、LAN/Tailscale IP、または内部ホスト名で動作している場合は、その Matrix アカウントで `network.dangerouslyAllowPrivateNetwork` を有効にします。

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

このオプトインは、信頼済みのプライベート/内部ターゲットのみを許可します。`http://matrix.example.org:8008` のような公開の平文ホームサーバーはブロックされたままです。可能な場合は常に `https://` を優先してください。

## Matrix トラフィックのプロキシ化

Matrix デプロイで明示的なアウトバウンド HTTP(S) プロキシが必要な場合は、`channels.matrix.proxy` を設定します。

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

名前付きアカウントは、`channels.matrix.accounts.<id>.proxy` でトップレベルのデフォルトを上書きできます。OpenClaw は、実行時の Matrix トラフィックとアカウント状態のプローブに同じプロキシ設定を使用します。

## ターゲット解決

Matrix は、OpenClaw がルームまたはユーザーターゲットを求める場所ならどこでも、次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

Matrix ルーム ID は大文字と小文字を区別します。明示的な配信ターゲット、Cron ジョブ、バインディング、または許可リストを設定するときは、Matrix の正確なルーム ID の大文字小文字を使用してください。OpenClaw は保存用に内部セッションキーを正規化して保持するため、それらの小文字キーは Matrix 配信 ID の信頼できる情報源ではありません。

ライブディレクトリ検索では、ログイン中の Matrix アカウントを使用します。

- ユーザー検索は、そのホームサーバー上の Matrix ユーザーディレクトリに問い合わせます。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け付け、その後そのアカウントが参加済みのルーム名の検索にフォールバックします。
- 参加済みルーム名の検索はベストエフォートです。ルーム名を ID またはエイリアスに解決できない場合、実行時の許可リスト解決では無視されます。

## 設定リファレンス

許可リスト形式のフィールド (`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`) は、完全な Matrix ユーザー ID を受け付けます (最も安全)。完全一致するディレクトリ項目は起動時、およびモニターの実行中に許可リストが変更されるたびに解決されます。解決できないエントリは実行時に無視されます。同じ理由で、ルーム許可リストではルーム ID またはエイリアスを優先します。

### アカウントと接続

- `enabled`: チャンネルを有効化または無効化します。
- `name`: アカウントの任意の表示ラベル。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合の優先アカウント ID。
- `accounts`: アカウントごとの名前付きオーバーライド。トップレベルの `channels.matrix` 値はデフォルトとして継承されます。
- `homeserver`: ホームサーバー URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このアカウントが `localhost`、LAN/Tailscale IP、または内部ホスト名へ接続することを許可します。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。アカウントごとのオーバーライドに対応しています。
- `userId`: 完全な Matrix ユーザー ID (`@bot:example.org`)。
- `accessToken`: トークンベース認証用のアクセストークン。env/file/exec プロバイダー全体でプレーンテキストと SecretRef 値に対応しています（[シークレット管理](/ja-JP/gateway/secrets)）。
- `password`: パスワードベースのログイン用パスワード。プレーンテキストと SecretRef 値に対応しています。
- `deviceId`: 明示的な Matrix デバイス ID。
- `deviceName`: パスワードログイン時に使用されるデバイス表示名。
- `avatarUrl`: プロファイル同期と `profile set` 更新用に保存された自分のアバター URL。
- `initialSyncLimit`: 起動時同期中に取得するイベントの最大数。

### 暗号化

- `encryption`: E2EE を有効化します。デフォルト: `false`。
- `startupVerification`: `"if-unverified"`（E2EE がオンの場合のデフォルト）または `"off"`。このデバイスが未検証の場合、起動時に自己検証を自動要求します。
- `startupVerificationCooldownHours`: 次回の自動起動要求までのクールダウン。デフォルト: `24`。

### アクセスとポリシー

- `groupPolicy`: `"open"`、`"allowlist"`、または `"disabled"`。デフォルト: `"allowlist"`。
- `groupAllowFrom`: ルームトラフィックを許可するユーザー ID の許可リスト。
- `dm.enabled`: `false` の場合、すべての DM を無視します。デフォルト: `true`。
- `dm.policy`: `"pairing"`（デフォルト）、`"allowlist"`、`"open"`、または `"disabled"`。ボットが参加し、ルームを DM として分類した後に適用されます。招待処理には影響しません。
- `dm.allowFrom`: DM トラフィックを許可するユーザー ID の許可リスト。
- `dm.sessionScope`: `"per-user"`（デフォルト）または `"per-room"`。
- `dm.threadReplies`: 返信スレッド化の DM 専用オーバーライド（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`: 他の設定済み Matrix ボットアカウントからのメッセージを受け入れます（`true` または `"mentions"`）。
- `allowlistOnly`: `true` の場合、すべての有効な DM ポリシー（`"disabled"` を除く）と `"open"` グループポリシーを `"allowlist"` に強制します。`"disabled"` ポリシーは変更しません。
- `autoJoin`: `"always"`、`"allowlist"`、または `"off"`。デフォルト: `"off"`。DM 形式の招待を含むすべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `"allowlist"` の場合に許可されるルーム/エイリアス。エイリアス項目は、招待されたルームが主張する状態ではなく、ホームサーバーに対して解決されます。
- `contextVisibility`: 補足コンテキストの可視性（デフォルトは `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 返信動作

- `replyToMode`: `"off"`、`"first"`、`"all"`、または `"batched"`。
- `threadReplies`: `"off"`、`"inbound"`、または `"always"`。
- `threadBindings`: スレッドに紐づくセッションルーティングとライフサイクルのチャンネルごとのオーバーライド。
- `streaming`: `"off"`（デフォルト）、`"partial"`、`"quiet"`、またはオブジェクト形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`、`false` ↔ `"off"`。
- `blockStreaming`: `true` の場合、完了したアシスタントブロックを個別の進行状況メッセージとして保持します。
- `markdown`: 送信テキスト用の任意の Markdown レンダリング設定。
- `responsePrefix`: 送信返信の先頭に付加される任意の文字列。
- `textChunkLimit`: `chunkMode: "length"` の場合の送信チャンクサイズ（文字数）。デフォルト: `4000`。
- `chunkMode`: `"length"`（デフォルト、文字数で分割）または `"newline"`（行境界で分割）。
- `historyLimit`: ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める直近のルームメッセージ数。`messages.groupChat.historyLimit` にフォールバックします。有効なデフォルトは `0`（無効）です。
- `mediaMaxMb`: 送信と受信処理におけるメディアサイズ上限（MB）。

### リアクション設定

- `ackReaction`: このチャンネル/アカウントの確認応答リアクションオーバーライド。
- `ackReactionScope`: スコープのオーバーライド（デフォルトは `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`: 受信リアクション通知モード（デフォルトは `"own"`、`"off"`）。

### ツールとルームごとのオーバーライド

- `actions`: アクションごとのツール制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`: ルームごとのポリシーマップ。セッション ID には解決後の安定したルーム ID を使用します。（`rooms` はレガシーエイリアスです。）
  - `groups.<room>.account`: 継承された 1 つのルーム項目を特定のアカウントに制限します。
  - `groups.<room>.allowBots`: チャンネルレベル設定のルームごとのオーバーライド（`true` または `"mentions"`）。
  - `groups.<room>.users`: ルームごとの送信者許可リスト。
  - `groups.<room>.tools`: ルームごとのツール許可/拒否オーバーライド。
  - `groups.<room>.autoReply`: ルームごとのメンション制御オーバーライド。`true` はそのルームのメンション要件を無効化し、`false` は再度有効にします。
  - `groups.<room>.skills`: ルームごとのスキルフィルター。
  - `groups.<room>.systemPrompt`: ルームごとのシステムプロンプトスニペット。

### Exec 承認設定

- `execApprovals.enabled`: Matrix ネイティブのプロンプトを通じて exec 承認を配信します。
- `execApprovals.approvers`: 承認を許可された Matrix ユーザー ID。`dm.allowFrom` にフォールバックします。
- `execApprovals.target`: `"dm"`（デフォルト）、`"channel"`、または `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 配信用の任意のエージェント/セッション許可リスト。

## 関連

- [チャンネル概要](/ja-JP/channels) - 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化策
