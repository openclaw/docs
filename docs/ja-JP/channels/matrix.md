---
read_when:
    - OpenClawでMatrixを設定する
    - Matrix E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、設定例
title: Matrix
x-i18n:
    generated_at: "2026-05-02T20:41:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f280df31cd26182b50613198642285ede1953b546c1593c0723c523ec96635a1
    source_path: channels/matrix.md
    workflow: 16
---

Matrix は OpenClaw 用のダウンロード可能なチャンネルPluginです。
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## インストール

チャンネルを設定する前に Matrix をインストールします。

```bash
openclaw plugins install @openclaw/matrix
```

ローカルチェックアウトからインストールする場合:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` は Plugin を登録して有効化するため、別途 `openclaw plugins enable matrix` を実行する必要はありません。ただし、下記のチャンネルを設定するまでは Plugin は何もしません。一般的な Plugin の動作とインストールルールについては [Plugins](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. homeserver に Matrix アカウントを作成します。
2. `channels.matrix` を `homeserver` + `accessToken`、または `homeserver` + `userId` + `password` で設定します。
3. gateway を再起動します。
4. bot との DM を開始するか、ルームに招待します（[自動参加](#auto-join) を参照。新しい招待は `autoJoin` が許可している場合にのみ反映されます）。

### 対話式セットアップ

```bash
openclaw channels add
openclaw configure --section channels
```

ウィザードでは、homeserver URL、認証方式（アクセストークンまたはパスワード）、ユーザー ID（パスワード認証のみ）、任意のデバイス名、E2EE を有効にするかどうか、ルームアクセスと自動参加を設定するかどうかを尋ねられます。

一致する `MATRIX_*` 環境変数がすでに存在し、選択したアカウントに保存済みの認証情報がない場合、ウィザードは環境変数のショートカットを提示します。allowlist を保存する前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を実行します。E2EE が有効な場合、ウィザードは設定を書き込み、[`openclaw matrix encryption setup`](#encryption-and-verification) と同じ bootstrap を実行します。

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

`channels.matrix.autoJoin` の既定値は `off` です。既定では、手動で参加するまで、bot は新しい招待からの新規ルームや DM に表示されません。

OpenClaw は招待時点で、招待されたルームが DM かグループかを判別できないため、DM 形式の招待を含むすべての招待はまず `autoJoin` を通過します。`dm.policy` は後で、bot が参加し、ルームが分類された後にのみ適用されます。

<Warning>
bot が受け入れる招待を制限するには `autoJoin: "allowlist"` と `autoJoinAllowlist` を設定し、すべての招待を受け入れるには `autoJoin: "always"` を設定します。

`autoJoinAllowlist` が受け付けるのは安定した対象のみです: `!roomId:server`、`#alias:server`、または `*`。プレーンなルーム名は拒否されます。alias エントリは、招待されたルームが主張する state ではなく homeserver に対して解決されます。
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

すべての招待を受け入れるには、`autoJoin: "always"` を使用します。

### Allowlist 対象形式

DM とルームの allowlist には、安定した ID を入れるのが最適です。

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）: `@user:server` を使用します。表示名は、homeserver ディレクトリが完全に 1 件だけ一致を返す場合にのみ解決されます。
- ルーム（`groups`、`autoJoinAllowlist`）: `!room:server` または `#alias:server` を使用します。名前は参加済みルームに対してベストエフォートで解決されます。未解決のエントリは実行時に無視されます。

### アカウント ID の正規化

ウィザードは親しみやすい名前を正規化されたアカウント ID に変換します。たとえば、`Ops Bot` は `ops-bot` になります。スコープ付き環境変数名では、2 つのアカウントが衝突しないように句読点がエスケープされます: `-` → `_X2D_` となるため、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` に対応します。

### キャッシュされた認証情報

Matrix はキャッシュされた認証情報を `~/.openclaw/credentials/matrix/` の下に保存します。

- 既定のアカウント: `credentials.json`
- 名前付きアカウント: `credentials-<account>.json`

そこにキャッシュされた認証情報が存在する場合、アクセストークンが設定ファイルにない場合でも、OpenClaw は Matrix が設定済みであると扱います。これはセットアップ、`openclaw doctor`、チャンネルステータスの probe をカバーします。

### 環境変数

同等の設定キーが設定されていない場合に使用されます。既定のアカウントは接頭辞なしの名前を使用し、名前付きアカウントは suffix の前にアカウント ID を挿入します。

| 既定のアカウント      | 名前付きアカウント（`<ID>` は正規化されたアカウント ID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

アカウント `ops` の場合、名前は `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` などになります。recovery-key 環境変数は、`--recovery-key-stdin` でキーを pipe した場合に、リカバリー対応の CLI フロー（`verify backup restore`、`verify device`、`verify bootstrap`）によって読み取られます。

`MATRIX_HOMESERVER` はワークスペースの `.env` から設定できません。[ワークスペースの `.env` ファイル](/ja-JP/gateway/security) を参照してください。

## 設定例

DM ペアリング、ルーム allowlist、E2EE を含む実用的なベースライン:

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

Matrix の返信ストリーミングはオプトインです。`streaming` は OpenClaw が進行中の assistant 返信をどのように配信するかを制御し、`blockStreaming` は完了した各ブロックを個別の Matrix メッセージとして保持するかどうかを制御します。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

ライブ回答プレビューを維持しつつ、途中の tool/progress 行を非表示にするには、object
形式を使用します。

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

| `streaming`       | 動作                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（既定）   | 完全な返信を待ってから一度だけ送信します。`true` ↔ `"partial"`、`false` ↔ `"off"`。                                                                                 |
| `"partial"`       | モデルが現在のブロックを書いている間、通常のテキストメッセージ 1 件をその場で編集します。標準の Matrix クライアントは、最終編集ではなく最初のプレビューで通知する場合があります。 |
| `"quiet"`         | `"partial"` と同じですが、メッセージは通知しない notice です。受信者は、ユーザーごとの push rule が確定済み編集に一致したときにだけ通知を受け取ります（下記参照）。 |

`blockStreaming` は `streaming` から独立しています。

| `streaming`             | `blockStreaming: true`                                    | `blockStreaming: false`（既定）                |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 現在のブロックのライブ下書き、完了したブロックはメッセージとして保持 | 現在のブロックのライブ下書き、その場で確定 |
| `"off"`                 | 完了したブロックごとに通知付き Matrix メッセージを 1 件送信 | 完全な返信に対して通知付き Matrix メッセージを 1 件送信 |

注:

- プレビューが Matrix のイベントごとのサイズ上限を超えた場合、OpenClaw はプレビューストリーミングを停止し、最終版のみの配信にフォールバックします。
- メディア返信は常に添付ファイルを通常どおり送信します。古いプレビューを安全に再利用できなくなった場合、OpenClaw は最終メディア返信を送信する前にそれを redact します。
- Matrix プレビューストリーミングが有効な場合、tool-progress プレビュー更新は既定で有効です。回答テキストのプレビュー編集を維持しつつ、tool progress を通常の配信経路に残すには、`streaming.preview.toolProgress: false` を設定します。
- プレビュー編集には追加の Matrix API 呼び出しが必要です。最も保守的なレート制限プロファイルが必要な場合は、`streaming: "off"` のままにしてください。

## 承認メタデータ

Matrix ネイティブの承認プロンプトは、`com.openclaw.approval` の下に OpenClaw 固有のカスタムイベント内容を持つ通常の `m.room.message` イベントです。Matrix はカスタムイベント内容キーを許可するため、標準クライアントは引き続きテキスト本文を表示し、OpenClaw 対応クライアントは構造化された承認 ID、種類、状態、利用可能な判断、exec/Plugin の詳細を読み取れます。

承認プロンプトが 1 つの Matrix イベントには長すぎる場合、OpenClaw は表示テキストを分割し、最初の chunk にのみ `com.openclaw.approval` を付与します。allow/deny 判断のリアクションはその最初のイベントに紐づくため、長いプロンプトでも単一イベントのプロンプトと同じ承認対象を維持します。

### quiet の確定済みプレビュー用のセルフホスト push rule

`streaming: "quiet"` は、ブロックまたは turn が確定したときにだけ受信者へ通知します。ユーザーごとの push rule が確定済みプレビューマーカーに一致する必要があります。完全な手順（受信者トークン、pusher チェック、rule インストール、homeserver ごとの注意事項）については、[quiet プレビュー用の Matrix push rule](/ja-JP/channels/matrix-push-rules) を参照してください。

## bot 間ルーム

既定では、設定済みの他の OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。

意図的に agent 間の Matrix トラフィックを許可したい場合は、`allowBots` を使用します。

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

- `allowBots: true` は、許可されたルームと DM 内で、他の設定済み Matrix bot アカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、それらのメッセージがルーム内でこの bot に見える形でメンションしている場合にのみ受け入れます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベルの設定を上書きします。
- OpenClaw は自己返信ループを避けるため、同じ Matrix ユーザー ID からのメッセージを引き続き無視します。
- Matrix はここでネイティブの bot フラグを公開しません。OpenClaw は「bot が作成した」を「この OpenClaw gateway 上の別の設定済み Matrix アカウントによって送信された」として扱います。

共有ルームで bot 間トラフィックを有効にする場合は、厳格なルーム allowlist とメンション要件を使用してください。

## 暗号化と検証

暗号化（E2EE）ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルとともに暗号化されます。暗号化されていないルームでは、引き続きプレーンな `thumbnail_url` を使用します。設定は不要です。Plugin が E2EE 状態を自動的に検出します。

すべての `openclaw matrix` コマンドは、`--verbose`（完全な診断）、`--json`（機械可読出力）、`--account <id>`（複数アカウント設定）を受け付けます。出力は既定で簡潔で、内部 SDK ログは quiet です。以下の例は標準形を示します。必要に応じてフラグを追加してください。

### 暗号化を有効にする

```bash
openclaw matrix encryption setup
```

シークレットストレージとクロス署名をブートストラップし、必要に応じてルームキーのバックアップを作成してから、ステータスと次の手順を出力します。便利なフラグ:

- `--recovery-key <key>` ブートストラップの前にリカバリキーを適用します（下記の stdin 形式を推奨）
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄して新しい ID を作成します（意図した場合にのみ使用）

新しいアカウントでは、作成時に E2EE を有効にします:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` は `--enable-e2ee` のエイリアスです。

手動設定で同等の内容:

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

`verify status` は 3 つの独立した信頼シグナルを報告します（`--verbose` ですべて表示されます）:

- `Locally trusted`: このクライアントでのみ信頼されています
- `Cross-signing verified`: SDK がクロス署名による検証を報告しています
- `Signed by owner`: 自分の自己署名キーで署名されています（診断専用）

`Verified by owner` は、`Cross-signing verified` が `yes` の場合にのみ `yes` になります。ローカルの信頼または所有者の署名だけでは不十分です。

`--allow-degraded-local-state` は、Matrix アカウントを事前に準備せずにベストエフォートの診断を返します。オフラインまたは部分的に設定されたプローブに便利です。

### リカバリキーでこのデバイスを検証する

リカバリキーは機密情報です。コマンドラインで渡す代わりに、stdin 経由でパイプしてください。`MATRIX_RECOVERY_KEY`（名前付きアカウントでは `MATRIX_<ID>_RECOVERY_KEY`）を設定します:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

このコマンドは 3 つの状態を報告します:

- `Recovery key accepted`: Matrix がシークレットストレージまたはデバイス信頼のためにキーを受け付けました。
- `Backup usable`: 信頼済みのリカバリ素材を使ってルームキーのバックアップを読み込めます。
- `Device verified by owner`: このデバイスには完全な Matrix クロス署名 ID の信頼があります。

リカバリキーがバックアップ素材のロック解除に成功していても、完全な ID 信頼が未完了の場合は 0 以外で終了します。その場合は、別の Matrix クライアントから自己検証を完了してください:

```bash
openclaw matrix verify self
```

`verify self` は正常終了する前に `Cross-signing verified: yes` を待ちます。待機時間を調整するには `--timeout-ms <ms>` を使用します。

リテラルキー形式の `openclaw matrix verify device "<recovery-key>"` も受け付けますが、キーがシェル履歴に残ります。

### クロス署名をブートストラップまたは修復する

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` は、暗号化アカウントの修復およびセットアップ用コマンドです。順番に次の処理を行います:

- 可能な場合は既存のリカバリキーを再利用して、シークレットストレージをブートストラップします
- クロス署名をブートストラップし、不足している公開キーをアップロードします
- 現在のデバイスをマークし、クロス署名します
- サーバー側のルームキーバックアップがまだ存在しない場合は作成します

ホームサーバーがクロス署名キーのアップロードに UIA を要求する場合、OpenClaw はまず認証なしを試し、次に `m.login.dummy`、その後 `m.login.password` を試します（`channels.matrix.password` が必要）。

便利なフラグ:

- `--recovery-key-stdin`（`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` と組み合わせる）または `--recovery-key <key>`
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄します（意図した場合のみ）

### ルームキーバックアップ

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` は、サーバー側バックアップが存在するか、このデバイスで復号できるかを表示します。`backup restore` は、バックアップされたルームキーをローカルの暗号ストアにインポートします。リカバリキーがすでにディスク上にある場合は、`--recovery-key-stdin` を省略できます。

壊れたバックアップを新しいベースラインで置き換えるには（復元不能な古い履歴の喪失を受け入れます。現在のバックアップシークレットを読み込めない場合は、シークレットストレージも再作成できます）:

```bash
openclaw matrix verify backup reset --yes
```

以前のリカバリキーで新しいバックアップベースラインのロックを解除できないようにしたい場合にのみ、`--rotate-recovery-key` を追加します。

### 検証の一覧表示、リクエスト、応答

```bash
openclaw matrix verify list
```

選択されたアカウントの保留中の検証リクエストを一覧表示します。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

この OpenClaw アカウントから検証リクエストを送信します。`--own-user` は自己検証をリクエストします（同じユーザーの別の Matrix クライアントでプロンプトを承認します）。`--user-id`/`--device-id`/`--room-id` は他の人を対象にします。`--own-user` は他の対象指定フラグと組み合わせることはできません。

より低レベルのライフサイクル処理では、通常、別のクライアントからの受信リクエストをシャドーイングしている間に、これらのコマンドが特定のリクエスト `<id>`（`verify list` と `verify request` で出力）に対して動作します:

| コマンド                                   | 目的                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 受信リクエストを承認する                                            |
| `openclaw matrix verify start <id>`        | SAS フローを開始する                                                |
| `openclaw matrix verify sas <id>`          | SAS 絵文字または小数を出力する                                      |
| `openclaw matrix verify confirm-sas <id>`  | SAS が相手クライアントの表示内容と一致することを確認する            |
| `openclaw matrix verify mismatch-sas <id>` | 絵文字または小数が一致しない場合に SAS を拒否する                   |
| `openclaw matrix verify cancel <id>`       | キャンセルする。任意で `--reason <text>` と `--code <matrix-code>` を取る |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas`、`cancel` はすべて、検証が特定のダイレクトメッセージルームに紐づく場合の DM フォローアップヒントとして `--user-id` と `--room-id` を受け付けます。

### 複数アカウントに関する注意

`--account <id>` がない場合、Matrix CLI コマンドは暗黙のデフォルトアカウントを使用します。複数の名前付きアカウントがあり、`channels.matrix.defaultAccount` を設定していない場合、推測を拒否して選択を求めます。名前付きアカウントで E2EE が無効または利用できない場合、エラーはそのアカウントの設定キーを示します。例: `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="起動時の動作">
    `encryption: true` の場合、`startupVerification` のデフォルトは `"if-unverified"` です。起動時に未検証のデバイスは別の Matrix クライアントで自己検証をリクエストし、重複をスキップしてクールダウン（デフォルトで 24 時間）を適用します。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効にします。

    起動時には、現在のシークレットストレージとクロス署名 ID を再利用する保守的な暗号ブートストラップパスも実行されます。ブートストラップ状態が壊れている場合、OpenClaw は `channels.matrix.password` がなくても保護された修復を試みます。ホームサーバーがパスワード UIA を要求する場合、起動時に警告をログに記録し、致命的なエラーにはしません。すでに所有者署名済みのデバイスは保持されます。

    完全なアップグレードフローについては、[Matrix 移行](/ja-JP/channels/matrix-migration)を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は検証ライフサイクル通知を、厳格な DM 検証ルームに `m.notice` メッセージとして投稿します。リクエスト、準備完了（「絵文字で検証」の案内付き）、開始/完了、および利用可能な場合は SAS（絵文字/小数）の詳細です。

    別の Matrix クライアントからの受信リクエストは追跡され、自動承認されます。自己検証では、OpenClaw が SAS フローを自動的に開始し、絵文字検証が利用可能になると自分側を確認します。ただし、Matrix クライアントで比較して「一致しています」を確認する必要があります。

    検証システム通知はエージェントチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="削除済みまたは無効な Matrix デバイス">
    `verify status` が現在のデバイスはホームサーバー上にもう存在しないと表示する場合は、新しい OpenClaw Matrix デバイスを作成してください。パスワードログインの場合:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    トークン認証の場合、Matrix クライアントまたは管理 UI で新しいアクセストークンを作成し、OpenClaw を更新します:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    失敗したコマンドのアカウント ID で `assistant` を置き換えるか、デフォルトアカウントでは `--account` を省略します。

  </Accordion>

  <Accordion title="デバイスの衛生管理">
    古い OpenClaw 管理デバイスは蓄積することがあります。一覧表示して整理します:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="暗号ストア">
    Matrix E2EE は、IndexedDB shim として `fake-indexeddb` を使用し、公式の `matrix-js-sdk` Rust 暗号パスを使用します。暗号状態は `crypto-idb-snapshot.json`（制限付きファイル権限）に永続化されます。

    暗号化されたランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下にあり、同期ストア、暗号ストア、リカバリキー、IDB スナップショット、スレッドバインディング、起動時検証状態を含みます。トークンが変わってもアカウント ID が同じままの場合、OpenClaw は最適な既存ルートを再利用するため、以前の状態は引き続き表示されます。

  </Accordion>
</AccordionGroup>

## プロファイル管理

選択されたアカウントの Matrix 自己プロファイルを更新します:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

両方のオプションを 1 回の呼び出しで渡せます。Matrix は `mxc://` アバター URL を直接受け付けます。`http://` または `https://` を渡すと、OpenClaw はまずファイルをアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl`（またはアカウントごとの上書き）に保存します。

## スレッド

Matrix は、自動返信とメッセージツール送信の両方でネイティブ Matrix スレッドをサポートします。2 つの独立したノブが動作を制御します:

### セッションルーティング（`sessionScope`）

`dm.sessionScope` は、Matrix DM ルームを OpenClaw セッションにどのようにマッピングするかを決定します:

- `"per-user"`（デフォルト）: 同じルーティング対象ピアとのすべての DM ルームが 1 つのセッションを共有します。
- `"per-room"`: ピアが同じ場合でも、各 Matrix DM ルームが独自のセッションキーを持ちます。

明示的な会話バインディングは常に `sessionScope` より優先されるため、バインドされたルームとスレッドは選択されたターゲットセッションを保持します。

### 返信スレッド化（`threadReplies`）

`threadReplies` は、ボットが返信を投稿する場所を決定します:

- `"off"`: 返信はトップレベルです。受信したスレッド内メッセージは親セッションに残ります。
- `"inbound"`: 受信メッセージがすでにそのスレッド内にある場合にのみ、スレッド内で返信します。
- `"always"`: トリガーしたメッセージをルートとするスレッド内で返信します。その会話は最初のトリガー以降、対応するスレッドスコープのセッションを通じてルーティングされます。

`dm.threadReplies` は DM に対してのみこれを上書きします。たとえば、ルームスレッドを分離したまま、DM はフラットに保てます。

### スレッド継承とスラッシュコマンド

- インバウンドのスレッド化メッセージには、追加のエージェントコンテキストとしてスレッドのルートメッセージが含まれます。
- メッセージツールの送信は、同じルーム（または同じ DM ユーザーターゲット）を対象にする場合、明示的な `threadId` が指定されていない限り、現在の Matrix スレッドを自動的に継承します。
- DM ユーザーターゲットの再利用は、現在のセッションメタデータによって同じ Matrix アカウント上の同じ DM 相手であることが証明される場合にのみ有効になります。それ以外の場合、OpenClaw は通常のユーザースコープのルーティングにフォールバックします。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、スレッドバインドの `/acp spawn` はすべて Matrix ルームと DM で機能します。
- トップレベルの `/focus` は、`threadBindings.spawnSessions` が有効な場合に新しい Matrix スレッドを作成し、ターゲットセッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、そのスレッドをその場でバインドします。

OpenClaw が、同じ共有セッション上の別の DM ルームと衝突する Matrix DM ルームを検出すると、そのルームに 1 回限りの `m.notice` を投稿し、`/focus` という回避策を示して `dm.sessionScope` の変更を提案します。この通知は、スレッドバインディングが有効な場合にのみ表示されます。

## ACP 会話バインディング

Matrix ルーム、DM、既存の Matrix スレッドは、チャットサーフェスを変更せずに永続的な ACP ワークスペースにできます。

高速な運用フロー:

- 使い続けたい Matrix DM、ルーム、または既存スレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM/ルームがチャットサーフェスのまま維持され、今後のメッセージは生成された ACP セッションにルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` がその現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

注:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnSessions` は、OpenClaw が子 Matrix スレッドを作成またはバインドする必要がある `/acp spawn --thread auto|here` を制御します。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバル既定値を継承し、チャンネルごとの上書きにも対応します。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix のスレッドバインドセッション生成は既定でオンです。

- `threadBindings.spawnSessions: false` を設定すると、トップレベルの `/focus` と `/acp spawn --thread auto|here` が Matrix スレッドを作成/バインドすることをブロックします。
- ネイティブサブエージェントのスレッド生成で親トランスクリプトをフォークしないようにする場合は、`threadBindings.defaultSpawnContext: "isolated"` を設定します。

## リアクション

Matrix はアウトバウンドリアクション、インバウンドリアクション通知、確認応答リアクションに対応しています。

アウトバウンドリアクションツールは `channels.matrix.actions.reactions` で制御されます。

- `react` は Matrix イベントにリアクションを追加します。
- `reactions` は Matrix イベントの現在のリアクション概要を一覧表示します。
- `emoji=""` は、そのイベント上のボット自身のリアクションを削除します。
- `remove: true` は、指定された絵文字リアクションだけをボットから削除します。

**解決順序**（最初に定義された値が優先されます）:

| 設定                    | 順序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | アカウントごと → チャンネル → `messages.ackReaction` → エージェントID絵文字フォールバック |
| `ackReactionScope`      | アカウントごと → チャンネル → `messages.ackReactionScope` → 既定値 `"group-mentions"` |
| `reactionNotifications` | アカウントごと → チャンネル → 既定値 `"own"`                                     |

`reactionNotifications: "own"` は、ボットが作成した Matrix メッセージを対象にする追加済み `m.reaction` イベントを転送します。`"off"` はリアクションシステムイベントを無効にします。リアクション削除は、スタンドアロンの `m.reaction` 削除ではなく Matrix ではリダクションとして表面化されるため、システムイベントには合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックします。両方が未設定の場合、有効な既定値は `0` です。無効にするには `0` を設定します。
- Matrix ルーム履歴はルーム専用です。DM は通常のセッション履歴を引き続き使用します。
- Matrix ルーム履歴は保留中のみです。OpenClaw は、まだ返信をトリガーしていないルームメッセージをバッファリングし、メンションまたは他のトリガーが到着したときにそのウィンドウのスナップショットを取得します。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメインのインバウンド本文に残ります。
- 同じ Matrix イベントの再試行では、新しいルームメッセージへ進むのではなく、元の履歴スナップショットを再利用します。

## コンテキストの可視性

Matrix は、取得した返信テキスト、スレッドルート、保留中の履歴などの補足ルームコンテキストに対する共有の `contextVisibility` 制御に対応しています。

- `contextVisibility: "all"` が既定です。補足コンテキストは受信されたまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブなルーム/ユーザーの許可リストチェックで許可された送信者に補足コンテキストをフィルタリングします。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的に引用された返信を 1 つ保持します。

この設定は補足コンテキストの可視性に影響しますが、インバウンドメッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガー認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、DM ポリシー設定に基づきます。

## DM とルームのポリシー

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

ルームを動作させたまま DM を完全に静かにするには、`dm.enabled: false` を設定します。

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

メンション制御と許可リストの動作については、[グループ](/ja-JP/channels/groups)を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

承認前に未承認の Matrix ユーザーがメッセージを送り続ける場合、OpenClaw は新しいコードを発行する代わりに同じ保留中のペアリングコードを再利用し、短いクールダウン後にリマインダー返信を送ることがあります。

共有 DM ペアリングフローとストレージレイアウトについては、[ペアリング](/ja-JP/channels/pairing)を参照してください。

## ダイレクトルーム修復

ダイレクトメッセージの状態が同期しなくなると、OpenClaw はライブ DM ではなく古いソロルームを指す古い `m.direct` マッピングを持つことがあります。相手の現在のマッピングを検査します。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復します。

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

どちらのコマンドも、複数アカウント設定向けに `--account <id>` を受け付けます。修復フローは次のとおりです。

- `m.direct` にすでにマッピングされている厳密な 1:1 DM を優先します
- そのユーザーとの現在参加中の厳密な 1:1 DM にフォールバックします
- 健全な DM が存在しない場合は、新しいダイレクトルームを作成して `m.direct` を書き換えます

古いルームは自動では削除されません。健全な DM を選択してマッピングを更新し、今後の Matrix 送信、検証通知、その他のダイレクトメッセージフローが正しいルームを対象にするようにします。

## 実行承認

Matrix はネイティブ承認クライアントとして動作できます。`channels.matrix.execApprovals`（またはアカウントごとの上書きには `channels.matrix.accounts.<account>.execApprovals`）で設定します。

- `enabled`: Matrix ネイティブのプロンプトを通じて承認を配信します。未設定または `"auto"` の場合、少なくとも 1 人の承認者を解決できると Matrix は自動的に有効になります。明示的に無効にするには `false` を設定します。
- `approvers`: exec リクエストの承認を許可された Matrix ユーザーID（`@owner:example.org`）。任意です。`channels.matrix.dm.allowFrom` にフォールバックします。
- `target`: プロンプトの送信先。`"dm"`（既定）は承認者の DM に送信します。`"channel"` は発信元の Matrix ルームまたは DM に送信します。`"both"` は両方に送信します。
- `agentFilter` / `sessionFilter`: Matrix 配信をトリガーするエージェント/セッションの任意の許可リスト。

認可は承認の種類によって少し異なります。

- **実行承認**は `execApprovals.approvers` を使用し、`dm.allowFrom` にフォールバックします。
- **Plugin 承認**は `dm.allowFrom` のみを通じて認可されます。

どちらの種類も Matrix リアクションショートカットとメッセージ更新を共有します。承認者には、主要な承認メッセージ上でリアクションショートカットが表示されます。

- `✅` 1 回だけ許可
- `❌` 拒否
- `♾️` 常に許可（有効な exec ポリシーが許可する場合）

フォールバックのスラッシュコマンド: `/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

解決済みの承認者だけが承認または拒否できます。実行承認のチャンネル配信にはコマンドテキストが含まれます。信頼できるルームでのみ `channel` または `both` を有効にしてください。

関連: [実行承認](/ja-JP/tools/exec-approvals)。

## スラッシュコマンド

スラッシュコマンド（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` など）は DM で直接機能します。ルームでは、OpenClaw はボット自身の Matrix メンションが前置されたコマンドも認識します。そのため、`@bot:server /new` はカスタムメンション正規表現なしでコマンドパスをトリガーします。これにより、Element などのクライアントでユーザーがコマンド入力前にボットをタブ補完したときに送信される、ルーム形式の `@mention /command` 投稿にもボットが応答できます。

認可ルールは引き続き適用されます。コマンド送信者は、通常のメッセージと同じ DM またはルームの許可リスト/所有者ポリシーを満たす必要があります。

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

- トップレベルの `channels.matrix` 値は、アカウントが上書きしない限り、名前付きアカウントの既定値として機能します。
- 継承されたルームエントリは、`groups.<room>.account` で特定のアカウントにスコープできます。`account` のないエントリはアカウント間で共有されます。既定アカウントがトップレベルで設定されている場合でも、`account: "default"` は引き続き機能します。

**既定アカウントの選択:**

- `defaultAccount` を設定すると、暗黙的なルーティング、プロービング、CLI コマンドが優先する名前付きアカウントを選択できます。
- 複数のアカウントがあり、その 1 つが文字どおり `default` という名前の場合、`defaultAccount` が未設定でも OpenClaw はそれを暗黙的に使用します。
- 複数の名前付きアカウントがあり、既定が選択されていない場合、CLI コマンドは推測を拒否します。`defaultAccount` を設定するか、`--account <id>` を渡してください。
- トップレベルの `channels.matrix.*` ブロックは、認証が完全な場合（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）にのみ暗黙的な `default` アカウントとして扱われます。名前付きアカウントは、キャッシュ済み資格情報が認証をカバーすると、`homeserver` + `userId` から引き続き検出できます。

**昇格:**

- OpenClaw が修復またはセットアップ中に単一アカウント設定を複数アカウントに昇格するとき、既存の名前付きアカウントがある場合、または `defaultAccount` がすでに名前付きアカウントを指している場合は、それを保持します。Matrix 認証/ブートストラップキーだけが昇格されたアカウントに移動し、共有配信ポリシーキーはトップレベルに残ります。

共有の複数アカウントパターンについては、[設定リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## プライベート/LAN ホームサーバー

既定では、OpenClaw は SSRF 保護のため、アカウントごとに明示的にオプトインしない限り、プライベート/内部 Matrix ホームサーバーをブロックします。

ホームサーバーが localhost、LAN/Tailscale IP、または内部ホスト名で動作している場合は、その Matrix アカウントで `network.dangerouslyAllowPrivateNetwork` を有効にしてください。

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

このオプトインは、信頼済みのプライベート/内部ターゲットのみを許可します。
`http://matrix.example.org:8008` のような公開の平文 homeserver は引き続きブロックされます。可能な限り `https://` を優先してください。

## Matrix トラフィックのプロキシ

Matrix デプロイで明示的な送信 HTTP(S) プロキシが必要な場合は、`channels.matrix.proxy` を設定します。

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
OpenClaw は、実行時の Matrix トラフィックとアカウント状態プローブに同じプロキシ設定を使用します。

## ターゲット解決

Matrix は、OpenClaw がルームまたはユーザーのターゲットを求める任意の場所で、次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

Matrix ルーム ID は大文字小文字を区別します。明示的な配信ターゲット、cron ジョブ、バインディング、allowlist を構成するときは、Matrix の正確なルーム ID の大文字小文字を使用してください。
OpenClaw は保存用の内部セッションキーを正規化して保持するため、それらの小文字キーは Matrix 配信 ID の信頼できる情報源ではありません。

ライブディレクトリ検索は、ログイン済みの Matrix アカウントを使用します。

- ユーザー検索は、その homeserver 上の Matrix ユーザーディレクトリに問い合わせます。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け付け、その後、そのアカウントが参加しているルーム名の検索にフォールバックします。
- 参加済みルーム名の検索はベストエフォートです。ルーム名を ID またはエイリアスに解決できない場合、実行時の allowlist 解決では無視されます。

## 設定リファレンス

allowlist 形式のフィールド（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）は完全な Matrix ユーザー ID を受け付けます（最も安全）。正確なディレクトリ一致は、起動時と、モニターの実行中に allowlist が変更されるたびに解決されます。解決できないエントリは実行時に無視されます。同じ理由で、ルーム allowlist ではルーム ID またはエイリアスを優先します。

### アカウントと接続

- `enabled`: チャンネルを有効化または無効化します。
- `name`: アカウントの任意の表示ラベル。
- `defaultAccount`: 複数の Matrix アカウントが構成されている場合の優先アカウント ID。
- `accounts`: 名前付きのアカウント別上書き。トップレベルの `channels.matrix` 値はデフォルトとして継承されます。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このアカウントが `localhost`、LAN/Tailscale IP、または内部ホスト名へ接続することを許可します。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。アカウント別の上書きをサポートします。
- `userId`: 完全な Matrix ユーザー ID（`@bot:example.org`）。
- `accessToken`: トークンベース認証用のアクセストークン。平文と SecretRef 値は、env/file/exec プロバイダー全体でサポートされます（[シークレット管理](/ja-JP/gateway/secrets)）。
- `password`: パスワードベースログイン用のパスワード。平文と SecretRef 値をサポートします。
- `deviceId`: 明示的な Matrix デバイス ID。
- `deviceName`: パスワードログイン時に使用されるデバイス表示名。
- `avatarUrl`: プロファイル同期と `profile set` 更新用に保存される自分のアバター URL。
- `initialSyncLimit`: 起動時同期中に取得されるイベントの最大数。

### 暗号化

- `encryption`: E2EE を有効化します。デフォルト: `false`。
- `startupVerification`: `"if-unverified"`（E2EE がオンの場合のデフォルト）または `"off"`。このデバイスが未検証の場合、起動時に自己検証を自動要求します。
- `startupVerificationCooldownHours`: 次の自動起動リクエストまでのクールダウン。デフォルト: `24`。

### アクセスとポリシー

- `groupPolicy`: `"open"`、`"allowlist"`、または `"disabled"`。デフォルト: `"allowlist"`。
- `groupAllowFrom`: ルームトラフィック用のユーザー ID の allowlist。
- `dm.enabled`: `false` の場合、すべての DM を無視します。デフォルト: `true`。
- `dm.policy`: `"pairing"`（デフォルト）、`"allowlist"`、`"open"`、または `"disabled"`。ボットが参加し、ルームを DM として分類した後に適用されます。招待の処理には影響しません。
- `dm.allowFrom`: DM トラフィック用のユーザー ID の allowlist。
- `dm.sessionScope`: `"per-user"`（デフォルト）または `"per-room"`。
- `dm.threadReplies`: 返信スレッド化の DM 専用上書き（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`: 他の構成済み Matrix ボットアカウントからのメッセージを受け付けます（`true` または `"mentions"`）。
- `allowlistOnly`: `true` の場合、すべてのアクティブな DM ポリシー（`"disabled"` を除く）と `"open"` グループポリシーを `"allowlist"` に強制します。`"disabled"` ポリシーは変更しません。
- `autoJoin`: `"always"`、`"allowlist"`、または `"off"`。デフォルト: `"off"`。DM 形式の招待を含む、すべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `"allowlist"` の場合に許可されるルーム/エイリアス。エイリアスエントリは、招待されたルームが主張する状態ではなく、homeserver に対して解決されます。
- `contextVisibility`: 補足コンテキストの可視性（デフォルトは `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 返信動作

- `replyToMode`: `"off"`、`"first"`、`"all"`、または `"batched"`。
- `threadReplies`: `"off"`、`"inbound"`、または `"always"`。
- `threadBindings`: スレッド紐付けセッションのルーティングとライフサイクルに対するチャンネル別上書き。
- `streaming`: `"off"`（デフォルト）、`"partial"`、`"quiet"`、またはオブジェクト形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`、`false` ↔ `"off"`。
- `blockStreaming`: `true` の場合、完了した assistant ブロックは個別の進捗メッセージとして保持されます。
- `markdown`: 送信テキスト用の任意の Markdown レンダリング設定。
- `responsePrefix`: 送信返信の先頭に付加される任意の文字列。
- `textChunkLimit`: `chunkMode: "length"` の場合の送信チャンクサイズ（文字数）。デフォルト: `4000`。
- `chunkMode`: `"length"`（デフォルト、文字数で分割）または `"newline"`（行境界で分割）。
- `historyLimit`: ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含まれる直近のルームメッセージ数。`messages.groupChat.historyLimit` にフォールバックします。有効なデフォルトは `0`（無効）。
- `mediaMaxMb`: 送信と受信処理のメディアサイズ上限（MB）。

### リアクション設定

- `ackReaction`: このチャンネル/アカウント用の ack リアクション上書き。
- `ackReactionScope`: スコープの上書き（デフォルトは `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`: 受信リアクション通知モード（デフォルトは `"own"`、`"off"`）。

### ツールとルーム別上書き

- `actions`: アクション別のツール制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`: ルーム別ポリシーマップ。セッション ID には、解決後の安定したルーム ID が使用されます。（`rooms` はレガシーエイリアスです。）
  - `groups.<room>.account`: 継承された 1 つのルームエントリを特定のアカウントに制限します。
  - `groups.<room>.allowBots`: チャンネルレベル設定のルーム別上書き（`true` または `"mentions"`）。
  - `groups.<room>.users`: ルーム別の送信者 allowlist。
  - `groups.<room>.tools`: ルーム別のツール許可/拒否の上書き。
  - `groups.<room>.autoReply`: ルーム別の mention 制御上書き。`true` はそのルームの mention 要件を無効化し、`false` は要件を再度強制します。
  - `groups.<room>.skills`: ルーム別の skill フィルター。
  - `groups.<room>.systemPrompt`: ルーム別のシステムプロンプトスニペット。

### Exec 承認設定

- `execApprovals.enabled`: Matrix ネイティブプロンプトを通じて exec 承認を配信します。
- `execApprovals.approvers`: 承認を許可された Matrix ユーザー ID。`dm.allowFrom` にフォールバックします。
- `execApprovals.target`: `"dm"`（デフォルト）、`"channel"`、または `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 配信用の任意のエージェント/セッション allowlist。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作と mention 制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
