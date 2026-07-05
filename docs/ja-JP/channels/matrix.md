---
read_when:
    - OpenClaw で Matrix を設定する
    - Matrix E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、構成例
title: マトリックス
x-i18n:
    generated_at: "2026-07-05T11:03:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix は、公式の `matrix-js-sdk` 上に構築されたダウンロード可能なチャンネルPlugin（`@openclaw/matrix`）です。DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## インストール

```bash
openclaw plugins install @openclaw/matrix
```

裸のPlugin指定は、まず ClawHub を試し、その後 npm にフォールバックします。`openclaw plugins install clawhub:@openclaw/matrix` または `npm:@openclaw/matrix` でソースを強制できます。ローカルチェックアウトからは、`openclaw plugins install ./path/to/local/matrix-plugin` を使用します。

`plugins install` はPluginを登録して有効化します。別途 `enable` ステップは不要です。ただし、以下で設定するまではチャンネルは何もしません。一般的なインストール規則については [Plugins](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. ホームサーバー上に Matrix アカウントを作成します。
2. `channels.matrix` を `homeserver` + `accessToken`、または `homeserver` + `userId` + `password` で設定します。
3. Gateway を再起動します。
4. ボットとの DM を開始するか、ルームに招待します。新しい招待は、[`autoJoin`](#auto-join) が許可した場合にのみ参加します。

### 対話型セットアップ

```bash
openclaw channels add
openclaw configure --section channels
```

ウィザードは、ホームサーバーURL、認証方式（トークンまたはパスワード）、ユーザーID（パスワード認証のみ）、任意のデバイス名、E2EE を有効にするかどうか、ルームアクセス/自動参加について尋ねます。一致する `MATRIX_*` 環境変数がすでに存在し、アカウントに保存済み認証がない場合、ウィザードは環境変数ショートカットを提示します。許可リストを保存する前に、`openclaw channels resolve --channel matrix "Project Room"` でルーム名を解決してください。ウィザードで E2EE を有効にすると、[`openclaw matrix encryption setup`](#encryption-and-verification) と同じブートストラップが実行されます。

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

`channels.matrix.autoJoin` のデフォルトは `"off"` です。手動で参加するまで、ボットは新しい招待からの新規ルームや DM に表示されません。OpenClaw は招待時点で、その招待が DM かグループかを判断できないため、すべての招待はまず `autoJoin` を通過します。`dm.policy` は、ボットが参加してルームが分類された後にのみ適用されます。

<Warning>
受け入れる招待を制限するには、`autoJoin: "allowlist"` と `autoJoinAllowlist` を設定します。すべての招待を受け入れるには、`autoJoin: "always"` を設定します。

`autoJoinAllowlist` が受け入れるのは、`!roomId:server`、`#alias:server`、または `*` のみです。プレーンなルーム名は拒否されます。エイリアスは、招待されたルームが主張する状態ではなく、ホームサーバーに対して解決されます。
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

### 許可リスト対象の形式

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）: `@user:server` を使用します。表示名はデフォルトでは無視されます（変更可能なため）。明示的な表示名互換性が必要な場合にのみ、`dangerouslyAllowNameMatching: true` を設定してください。
- ルーム許可リストキー（`groups`、レガシーエイリアス `rooms`）: `!room:server` または `#alias:server` を使用します。`dangerouslyAllowNameMatching: true` でない限り、プレーンな名前は無視されます。
- 招待許可リスト（`autoJoinAllowlist`）: `!room:server`、`#alias:server`、または `*` を使用します。プレーンな名前は常に拒否されます。

### アカウントIDの正規化

ウィザードは、分かりやすい名前を正規化されたアカウントID（`Ops Bot` -> `ops-bot`）に変換します。スコープ付き環境変数名では句読点が16進エスケープされるため、アカウントは衝突できません。`-`（0x2D）は `_X2D_` になり、`ops-prod` は環境変数プレフィックス `MATRIX_OPS_X2D_PROD_` に対応します。

### キャッシュされた認証情報

Matrix は認証情報を `~/.openclaw/credentials/matrix/` にキャッシュします。デフォルトアカウントは `credentials.json`、名前付きアカウントは `credentials-<account>.json` です。キャッシュされた認証情報が存在する場合、設定ファイルに `accessToken` がなくても、OpenClaw は Matrix が設定済みとして扱います。これはセットアップ、`openclaw doctor`、チャンネルステータスプローブをカバーします。

### 環境変数

対応する設定キーが未設定の場合に使用される、設定キーベースの環境変数です。デフォルトアカウントはプレフィックスなしの名前を使用します。名前付きアカウントは、サフィックスの前にアカウントトークンを挿入します（[正規化](#account-id-normalization) を参照）。

| デフォルトアカウント  | 名前付きアカウント（`<ID>` = アカウントトークン） |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

アカウント `ops` の場合、名前は `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` などになります。`MATRIX_HOMESERVER`（および任意の `*_HOMESERVER` スコープ付きバリアント）は、ワークスペースの `.env` から設定できません。[ワークスペースの `.env` ファイル](/ja-JP/gateway/security) を参照してください。

<Note>
リカバリキーは設定ベースの環境変数ではありません。OpenClaw はそれを環境から直接読み取ることはありません。CLI の案内テキストでは、デフォルトアカウントの場合は `MATRIX_RECOVERY_KEY` という名前のシェル変数、名前付きアカウントの場合は `MATRIX_RECOVERY_KEY_<ID>`（プレーンな大文字アカウントID、16進エスケープなし）を通じて渡すことを提案しています。[リカバリキーでこのデバイスを検証する](#verify-this-device-with-a-recovery-key) を参照してください。
</Note>

## 設定例

DM ペアリング、ルーム許可リスト、E2EE を含む実用的なベースライン:

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

Matrix の返信ストリーミングはオプトインです。`streaming` は、OpenClaw が進行中のアシスタント返信をどのように配信するかを制御します。`blockStreaming` は、完了した各ブロックをそれぞれ独立した Matrix メッセージとして保持するかどうかを制御します。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

ライブ回答プレビューを維持しつつ、中間のツール/進捗行を非表示にするには、オブジェクト形式を使用します。

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

完全なオブジェクト形式は `{ mode, preview, progress }` を受け入れます。

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // 設定済みまたは組み込みラベルから選択（非表示にするには false）
          labels: ["Thinking", "Writing", "Searching"], // label: "auto" の候補
          maxLines: 8, // 最大ローリング進捗行数（デフォルト: 8）
          maxLineChars: 120, // 切り捨て前の1行あたり最大文字数（デフォルト: 120）
          toolProgress: true, // ツール/進捗アクティビティを表示（デフォルト: true）
        },
      },
    },
  },
}
```

- `progress.label`: カスタムラベル、設定済みまたは組み込みラベルを選ぶ `"auto"`/未設定、または非表示にする `false`。
- `progress.labels`: `label` が `"auto"` または未設定の場合にのみ使用される候補。
- `progress.maxLines`: 下書きに保持される最大ローリング進捗行数。これを超える古い行はトリムされます。
- `progress.maxLineChars`: コンパクトな進捗行1行あたりの、切り捨て前の最大文字数。
- `progress.toolProgress`: `true`（デフォルト）の場合、ライブのツール/進捗アクティビティが下書きに表示されます。

| `streaming`       | 動作                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（デフォルト） | 完全な返信を待ってから一度送信します。`true` <-> `"partial"`、`false` <-> `"off"`。                                                                         |
| `"partial"`       | モデルが現在のブロックを書き込む間、通常のテキストメッセージ1件をその場で編集します。標準クライアントは、最終編集ではなく最初のプレビューで通知する場合があります。          |
| `"quiet"`         | `"partial"` と同じですが、メッセージは通知しない notice です。受信者は、ユーザーごとのプッシュルールが確定編集に一致した時点で一度通知されます（下記参照）。 |
| `"progress"`      | 進捗下書きを使用して、個別のコンパクトな進捗行を送信します。                                                                                          |

`blockStreaming`（デフォルト `false`）は `streaming` から独立しています。

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（デフォルト）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 現在のブロックのライブ下書き、完了したブロックはメッセージとして保持 | 現在のブロックのライブ下書き、その場で確定 |
| `"off"`                 | 完了したブロックごとに通知付き Matrix メッセージ1件                     | 完全な返信に対して通知付き Matrix メッセージ1件      |

注:

- プレビューが Matrix のイベントごとのサイズ上限を超えると、OpenClaw はプレビューストリーミングを停止し、最終版のみの配信にフォールバックします。
- メディア返信は常に通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できない場合、OpenClaw は最終メディア返信を送信する前にそれを取り消します。
- プレビューストリーミングがアクティブな場合、ツール進捗プレビュー更新はデフォルトでオンです。回答テキストのプレビュー編集は維持しつつ、ツール進捗を通常の配信経路に残すには、`streaming.preview.toolProgress: false` を設定します。
- プレビュー編集は追加の Matrix API 呼び出しを消費します。最も保守的なレート制限プロファイルには、`streaming: "off"` のままにしてください。

## 音声メッセージ

受信した Matrix 音声ノートは、ルームのメンションゲートの前に文字起こしされます。そのため、ボット名を含む音声ノートは `requireMention: true` のルームでエージェントをトリガーでき、エージェントは音声添付ファイルのプレースホルダーだけでなく文字起こしを受け取ります。

Matrix は、OpenAI `gpt-4o-mini-transcribe` など、`tools.media.audio` 配下の共有音声メディアプロバイダーを使用します。プロバイダーのセットアップと制限については、[メディアツール概要](/ja-JP/tools/media-overview) を参照してください。

- `m.audio` イベントと、`audio/*` MIME タイプを持つ `m.file` イベントが対象です。
- 暗号化されたルームでは、OpenClaw は文字起こし前に既存の Matrix メディア経路を通じて添付ファイルを復号します。
- 文字起こしは、エージェントプロンプト内で機械生成かつ信頼できないものとしてマークされます。
- 添付ファイルはすでに文字起こし済みとしてマークされるため、下流のメディアツールは再度文字起こししません。
- 音声文字起こしをグローバルに無効化するには、`tools.media.audio.enabled: false` を設定します。

## 承認メタデータ

Matrix ネイティブの承認プロンプトは、`com.openclaw.approval` キー配下に OpenClaw 固有のコンテンツを持つ通常の `m.room.message` イベントです。標準クライアントは引き続きテキスト本文をレンダリングします。OpenClaw 対応クライアントは、構造化された承認ID、種別、状態、判断、exec/Plugin の詳細を読み取れます。

プロンプトが1つの Matrix イベントには長すぎる場合、OpenClaw は表示テキストをチャンク化し、最初のチャンクにのみ `com.openclaw.approval` を添付します。許可/拒否リアクションはその最初のイベントに紐づくため、長いプロンプトでも単一イベントのプロンプトと同じ承認対象を維持します。

### `quiet` な確定済みプレビュー向けセルフホスト push ルール

`streaming: "quiet"` は、ブロックまたはターンが確定された時点でのみ受信者に通知します。ユーザーごとの push ルールが、確定済みプレビューマーカーに一致する必要があります。完全な手順は [quiet プレビュー用の Matrix push ルール](/ja-JP/channels/matrix-push-rules) を参照してください。

## bot 間ルーム

デフォルトでは、他の設定済み OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。エージェント間トラフィックを意図的に許可するには `allowBots` を使用します。

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

- `allowBots: true` は、許可されたルームと DM で、他の設定済み Matrix bot アカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルーム内でこの bot への可視のメンションがある場合にのみそれらのメッセージを受け入れます。DM は引き続き無条件で許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベルの設定を上書きします。
- 受け入れられた設定済み bot メッセージには、共有の [bot ループ保護](/ja-JP/channels/bot-loop-protection) が使用されます。`channels.defaults.botLoopProtection` を設定し、アカウントごとに `channels.matrix.botLoopProtection`、またはルームごとに `channels.matrix.groups.<room>.botLoopProtection` で上書きします。
- OpenClaw は、自己返信ループを避けるため、同じ Matrix ユーザー ID からのメッセージを引き続き無視します。
- Matrix にはネイティブの bot フラグがありません。OpenClaw は「bot が作成した」を「この OpenClaw gateway 上の別の設定済み Matrix アカウントによって送信された」として扱います。

共有ルームで bot 間トラフィックを有効にするときは、厳密なルーム許可リストとメンション要件を使用してください。

## 暗号化と検証

暗号化された (E2EE) ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは通常の `thumbnail_url` を使用します。設定は不要です。plugin が E2EE 状態を自動的に検出します。

すべての `openclaw matrix` コマンドは、`--verbose` (完全な診断)、`--json` (機械可読出力)、`--account <id>` (複数アカウント設定) を受け付けます。出力はデフォルトで簡潔です。

### 暗号化を有効にする

```bash
openclaw matrix encryption setup
```

シークレットストレージとクロス署名をブートストラップし、必要に応じてルームキーのバックアップを作成してから、状態と次の手順を出力します。便利なフラグ:

- `--recovery-key <key>` ブートストラップ前にリカバリキーを適用します (下記の stdin 形式を推奨)
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄して新しいものを作成します (意図的な使用のみ)

新しいアカウントでは、作成時に E2EE を有効にします。

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` は `--enable-e2ee` のエイリアスです。手動設定での同等の内容:

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

### 状態と信頼シグナル

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` は 3 つの独立した信頼シグナルを報告します (`--verbose` はそれらすべてを表示します)。

- `Locally trusted`: このクライアントでのみ信頼済み
- `Cross-signing verified`: SDK がクロス署名による検証を報告
- `Signed by owner`: 自分の自己署名キーで署名済み (診断のみ)

`Verified by owner` は、`Cross-signing verified` が `yes` の場合にのみ `yes` になります。ローカル信頼または所有者署名だけでは不十分です。

`--allow-degraded-local-state` は、Matrix アカウントを事前に準備せずにベストエフォートの診断を返します。オフラインまたは部分的に設定された調査に便利です。

### リカバリキーでこのデバイスを検証する

コマンドラインで渡す代わりに、stdin 経由でリカバリキーをパイプします。

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

このコマンドは 3 つの状態を報告します。

- `Recovery key accepted`: Matrix がシークレットストレージまたはデバイス信頼用のキーを受け入れました。
- `Backup usable`: 信頼済みのリカバリ情報でルームキーのバックアップを読み込めます。
- `Device verified by owner`: このデバイスは完全な Matrix クロス署名 ID 信頼を持っています。

リカバリキーによってバックアップ情報のロックが解除された場合でも、完全な ID 信頼が未完了であれば非ゼロで終了します。その場合は、別の Matrix クライアントから自己検証を完了してください。

```bash
openclaw matrix verify self
```

`verify self` は、正常終了する前に `Cross-signing verified: yes` を待ちます。待機時間を調整するには `--timeout-ms <ms>` を使用します。

リテラルキー形式の `openclaw matrix verify device "<recovery-key>"` も機能しますが、キーがシェル履歴に残ります。

### クロス署名をブートストラップまたは修復する

```bash
openclaw matrix verify bootstrap
```

暗号化アカウント用の修復/セットアップコマンドです。順に、次を実行します。

- 可能な場合は既存のリカバリキーを再利用して、シークレットストレージをブートストラップします
- クロス署名をブートストラップし、不足している公開キーをアップロードします
- 現在のデバイスをマークし、クロス署名します
- サーバー側のルームキーバックアップがまだ存在しない場合は作成します

homeserver がクロス署名キーのアップロードに UIA を要求する場合、OpenClaw は最初に認証なし、次に `m.login.dummy`、次に `m.login.password` を試します (`channels.matrix.password` が必要)。

便利なフラグ:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...` と組み合わせる) または `--recovery-key <key>`
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄します (意図的な場合のみ。保存済みまたは `--recovery-key-stdin` で指定された有効なリカバリキーが必要)

### ルームキーのバックアップ

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` は、サーバー側バックアップが存在するか、このデバイスで復号できるかを表示します。`backup restore` は、バックアップ済みのルームキーをローカルの暗号ストアにインポートします。リカバリキーがすでにディスク上にある場合は `--recovery-key-stdin` を省略してください。

壊れたバックアップを新しいベースラインに置き換えるには (復元不能な古い履歴の喪失を許容します。現在のバックアップシークレットを読み込めない場合は、シークレットストレージも再作成できます)。

```bash
openclaw matrix verify backup reset --yes
```

以前のリカバリキーで新しいバックアップベースラインを意図的にロック解除できないようにする場合にのみ、`--rotate-recovery-key` を追加します。

### 検証の一覧表示、リクエスト、応答

```bash
openclaw matrix verify list
```

選択されたアカウントの保留中の検証リクエストを一覧表示します。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

このアカウントから検証リクエストを送信します。`--own-user` は自己検証をリクエストします (同じユーザーの別の Matrix クライアントでプロンプトを承認します)。`--user-id`/`--device-id`/`--room-id` は別の相手を対象にします。`--own-user` は他の対象指定フラグと組み合わせることはできません。

より低レベルなライフサイクル処理では、通常は別のクライアントからの受信リクエストを追跡している間に、これらのコマンドが特定のリクエスト `<id>` (`verify list` と `verify request` によって出力されます) に作用します。

| コマンド                                   | 目的                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 受信リクエストを承認します                                          |
| `openclaw matrix verify start <id>`        | SAS フローを開始します                                              |
| `openclaw matrix verify sas <id>`          | SAS 絵文字または小数を出力します                                    |
| `openclaw matrix verify confirm-sas <id>`  | SAS が相手のクライアントに表示されているものと一致することを確認します |
| `openclaw matrix verify mismatch-sas <id>` | 絵文字または小数が一致しない場合に SAS を拒否します                 |
| `openclaw matrix verify cancel <id>`       | キャンセルします。任意の `--reason <text>` と `--code <matrix-code>` を受け取ります |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas`、`cancel` はすべて、検証が特定のダイレクトメッセージルームに紐づいている場合の DM フォローアップヒントとして、`--user-id` と `--room-id` を受け付けます。

### 複数アカウントに関する注意

`--account <id>` がない場合、Matrix CLI コマンドは暗黙のデフォルトアカウントを使用します。複数の名前付きアカウントがあり、`channels.matrix.defaultAccount` がない場合、コマンドは推測を拒否し、選択を求めます。名前付きアカウントで E2EE が無効または利用できない場合、エラーはそのアカウントの設定キーを指します。例: `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="起動時の動作">
    `encryption: true` の場合、`startupVerification` はデフォルトで `"if-unverified"` になります。起動時に未検証のデバイスは別の Matrix クライアントで自己検証をリクエストし、重複をスキップしてクールダウン (デフォルトは 24 時間) を適用します。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効にします。

    起動時には、現在のシークレットストレージとクロス署名 ID を再利用する保守的な暗号ブートストラップパスも実行されます。ブートストラップ状態が壊れている場合、OpenClaw は `channels.matrix.password` なしでも保護された修復を試みます。homeserver がパスワード UIA を要求する場合、起動時に警告をログに記録し、致命的には扱いません。すでに所有者署名済みのデバイスは保持されます。

    完全なアップグレードフローについては [Matrix 移行](/ja-JP/channels/matrix-migration) を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は検証ライフサイクル通知を、厳密な DM 検証ルームに `m.notice` メッセージとして投稿します。リクエスト、準備完了 (「絵文字で検証」の案内付き)、開始/完了、利用可能な場合は SAS (絵文字/小数) の詳細です。

    別の Matrix クライアントからの受信リクエストは追跡され、自動承認されます。自己検証の場合、OpenClaw は SAS フローを自動的に開始し、絵文字検証が利用可能になると自分側を確認します。ただし、Matrix クライアントで比較し、「一致している」を確認する必要があります。

    検証システム通知はエージェントチャットパイプラインに転送されません。

  </Accordion>

  <Accordion title="削除済みまたは無効な Matrix デバイス">
    `verify status` が現在のデバイスは homeserver にもう一覧表示されていないと示す場合は、新しい OpenClaw Matrix デバイスを作成します。パスワードログインの場合:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    トークン認証の場合は、Matrix クライアントまたは管理 UI で新しいアクセストークンを作成し、OpenClaw を更新します。

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    失敗したコマンドのアカウント ID で `assistant` を置き換えるか、デフォルトアカウントでは `--account` を省略します。

  </Accordion>

  <Accordion title="デバイスの衛生管理">
    OpenClaw 管理デバイスが古くなって蓄積することがあります。一覧表示して剪定します。

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="暗号ストア">
    Matrix E2EE は、IndexedDB shim として `fake-indexeddb` を使用し、公式の `matrix-js-sdk` Rust 暗号パスを使用します。暗号状態は `crypto-idb-snapshot.json` に永続化されます (制限的なファイル権限)。

    暗号化されたランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下にあり、同期ストア、暗号ストア、リカバリキー、IDB スナップショット、スレッドバインディング、起動時検証状態を含みます。トークンが変わってもアカウント ID が同じ場合、OpenClaw は最適な既存ルートを再利用するため、以前の状態は引き続き表示されます。

    古いトークンハッシュルートが 1 つだけある場合は、通常のトークンローテーション継続パスである可能性があります。OpenClaw が `matrix: multiple populated token-hash storage roots detected` をログに記録した場合は、アカウントディレクトリを調べ、選択されたアクティブルートが正常であることを確認してから、古い兄弟ルートをアーカイブしてください。すぐに削除するよりも、古いルートを `_archive/` ディレクトリへ移動することを推奨します。

  </Accordion>
</AccordionGroup>

## プロファイル管理

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

両方のオプションを 1 回の呼び出しで渡します。Matrix は `mxc://` アバター URL を直接受け付けます。`http://`/`https://` を渡すと、先にファイルをアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl`（またはアカウントごとの上書き）に保存します。

## スレッド

Matrix は、自動返信とメッセージツール送信の両方でネイティブスレッドをサポートします。動作は 2 つの独立したノブで制御します。

### セッションルーティング（`sessionScope`）

`dm.sessionScope` は、Matrix DM ルームを OpenClaw セッションへどう対応付けるかを決定します。

- `"per-user"`（デフォルト）: 同じルーティング先ピアを持つすべての DM ルームが 1 つのセッションを共有します。
- `"per-room"`: 同じピアであっても、Matrix DM ルームごとに独自のセッションキーを取得します。

明示的な会話バインディングは常に `sessionScope` より優先されます。バインドされたルームとスレッドは、選択済みのターゲットセッションを維持します。

### 返信スレッド化（`threadReplies`）

`threadReplies` は、ボットが返信を投稿する場所を決定します。

- `"off"`: 返信はトップレベルになります。受信したスレッド内メッセージは親セッションに残ります。
- `"inbound"`: 受信メッセージがすでにそのスレッド内にあった場合のみ、スレッド内で返信します。
- `"always"`: トリガー元メッセージをルートとするスレッド内で返信します。その会話は、最初のトリガー以降、一致するスレッドスコープのセッションを通じてルーティングされます。

`dm.threadReplies` は DM のみに対してこれを上書きします。たとえば、ルームのスレッドを分離したまま、DM はフラットに保てます。

### スレッド継承とスラッシュコマンド

- 受信したスレッド内メッセージには、追加のエージェントコンテキストとしてスレッドルートメッセージが含まれます。
- メッセージツール送信は、同じルーム（または同じ DM ユーザーターゲット）を対象にする場合、明示的な `threadId` が指定されていない限り、現在の Matrix スレッドを自動継承します。
- DM ユーザーターゲットの再利用は、現在のセッションメタデータが同じ Matrix アカウント上の同じ DM ピアを証明する場合にのみ有効になります。それ以外の場合、OpenClaw は通常のユーザースコープルーティングへフォールバックします。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、スレッドバインドされた `/acp spawn` はすべて Matrix ルームと DM で動作します。
- トップレベルの `/focus` は、`threadBindings.spawnSessions` が有効な場合、新しい Matrix スレッドを作成し、ターゲットセッションへバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、そのスレッドがその場でバインドされます。

OpenClaw が、同じ共有セッション上の別の DM ルームと衝突している Matrix DM ルームを検出すると、`/focus` の退避手段を示し、`dm.sessionScope` の変更を提案する 1 回限りの `m.notice` を投稿します。この通知は、スレッドバインディングが有効な場合にのみ表示されます。

## ACP 会話バインディング

Matrix ルーム、DM、既存の Matrix スレッドは、チャットサーフェスを変更せずに永続的な ACP ワークスペースになれます。

高速なオペレーターフロー:

- 使い続けたい Matrix DM、ルーム、または既存スレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの DM またはルームでは、現在の DM/ルームがチャットサーフェスのままになり、今後のメッセージは生成された ACP セッションへルーティングされます。
- 既存スレッド内では、`--bind here` がその現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

`--bind here` は子 Matrix スレッドを作成しません。`threadBindings.spawnSessions` は `/acp spawn --thread auto|here` を制御します。この場合、OpenClaw は子スレッドを作成またはバインドする必要があります。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャンネルごとの上書きをサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: サブエージェントと ACP の両方のスレッド生成を制御します。
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: サブエージェントのみ、または ACP のみの生成に対する、より狭い上書きです。
- `threadBindings.defaultSpawnContext`

Matrix のスレッドバインドセッション生成はデフォルトで有効です。トップレベルの `/focus` と `/acp spawn --thread auto|here` が Matrix スレッドを作成/バインドするのをブロックするには、`threadBindings.spawnSessions: false` を設定します。ネイティブのサブエージェントスレッド生成で親トランスクリプトをフォークしてはいけない場合は、`threadBindings.defaultSpawnContext: "isolated"` を設定します。

## リアクション

Matrix は、送信リアクション、受信リアクション通知、ACK リアクションをサポートします。

送信リアクションツールは `channels.matrix.actions.reactions` によって制御されます。

- `react` は Matrix イベントにリアクションを追加します。
- `reactions` は Matrix イベントの現在のリアクション概要を一覧表示します。
- `emoji=""` は、そのイベント上のボット自身のリアクションを削除します。
- `remove: true` は、ボットから指定された絵文字リアクションのみを削除します。

**解決順序**（最初に定義された値が優先）:

| 設定                    | 順序                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | アカウントごと -> チャンネル -> `messages.ackReaction` -> エージェント ID 絵文字フォールバック |
| `ackReactionScope`      | アカウントごと -> チャンネル -> `messages.ackReactionScope` -> デフォルト `"group-mentions"` |
| `reactionNotifications` | アカウントごと -> チャンネル -> デフォルト `"own"`                                  |

`reactionNotifications: "own"` は、ボットが作成した Matrix メッセージを対象とする追加済み `m.reaction` イベントを転送します。`"off"` はリアクションシステムイベントを無効にします。リアクション削除はシステムイベントとして合成されません。Matrix では、それらは独立した `m.reaction` 削除ではなくリダクションとして表現されます。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める直近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` へフォールバックします。どちらも未設定の場合の有効なデフォルトは `0`（無効）です。
- Matrix ルーム履歴はルーム専用です。DM は通常のセッション履歴を使い続けます。
- ルーム履歴は保留中のみです。OpenClaw はまだ返信をトリガーしていないルームメッセージをバッファリングし、メンションまたはその他のトリガーが到着したときにそのウィンドウのスナップショットを取得します。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメイン受信本文に残ります。
- 同じ Matrix イベントの再試行では、新しいルームメッセージへ進むのではなく、元の履歴スナップショットを再利用します。

## コンテキスト可視性

Matrix は、取得した返信テキスト、スレッドルート、保留中履歴などの補足ルームコンテキストに対して、共有の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブなルーム/ユーザー allowlist チェックで許可された送信者に補足コンテキストを絞り込みます。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的に引用された返信を 1 つだけ保持します。

これは補足コンテキストの可視性にのみ影響し、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。トリガー認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、DM ポリシー設定から決まります。

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

ルームを動作させたまま DM を完全に停止するには、`dm.enabled: false` を設定します。

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

メンションゲートと allowlist の動作については、[グループ](/ja-JP/channels/groups)を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前にメッセージを送り続ける場合、OpenClaw は同じ保留中ペアリングコードを再利用し、新しいコードを発行する代わりに、短いクールダウン後にリマインダー返信を送信することがあります。

共有 DM ペアリングフローとストレージレイアウトについては、[ペアリング](/ja-JP/channels/pairing)を参照してください。

## 直接ルーム修復

ダイレクトメッセージ状態がずれると、OpenClaw はライブ DM ではなく古いソロルームを指す古い `m.direct` マッピングを持つことがあります。ピアの現在のマッピングを調べます。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復します。

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

どちらのコマンドも、マルチアカウント構成向けに `--account <id>` を受け付けます。修復フローは次のとおりです。

- `m.direct` にすでにマッピングされている厳密な 1:1 DM を優先します。
- そのユーザーとの、現在参加中の任意の厳密な 1:1 DM へフォールバックします。
- 正常な DM が存在しない場合は、新しいダイレクトルームを作成し、`m.direct` を書き換えます。

古いルームは自動的には削除しません。正常な DM を選び、今後の Matrix 送信、検証通知、その他のダイレクトメッセージフローが正しいルームを対象にするようマッピングを更新します。

## Exec 承認

Matrix はネイティブ承認クライアントとして動作できます。`channels.matrix.execApprovals`（またはアカウントごとの上書きでは `channels.matrix.accounts.<account>.execApprovals`）で設定します。

- `enabled`: Matrix ネイティブプロンプト経由で承認を配信します。未設定または `"auto"` の場合、少なくとも 1 人の承認者を解決できると自動有効化されます。明示的に無効化するには `false` を設定します。
- `approvers`: exec リクエストを承認できる Matrix ユーザー ID（`@owner:example.org`）。`channels.matrix.dm.allowFrom` へフォールバックします。
- `target`: プロンプトの送信先です。`"dm"`（デフォルト）は承認者 DM へ送信します。`"channel"` は発信元のルームまたは DM へ送信します。`"both"` は両方へ送信します。
- `agentFilter` / `sessionFilter`: Matrix 配信をトリガーするエージェント/セッションの任意の allowlist です。

認可は承認種別によって少し異なります。

- **Exec 承認**は `execApprovals.approvers` を使い、`dm.allowFrom` へフォールバックします。
- **Plugin 承認**は `dm.allowFrom` のみを通じて認可します。

どちらの種別も Matrix リアクションショートカットとメッセージ更新を共有します。承認者には、主要な承認メッセージ上でリアクションショートカットが表示されます。

- ✅ 1 回だけ許可
- ❌ 拒否
- ♾️ 常に許可（有効な exec ポリシーが許可する場合）

フォールバックのスラッシュコマンド: `/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

解決済みの承認者のみが承認または拒否できます。exec 承認のチャンネル配信にはコマンドテキストが含まれます。信頼されたルームでのみ `channel` または `both` を有効にしてください。

関連: [Exec 承認](/ja-JP/tools/exec-approvals)。

## スラッシュコマンド

スラッシュコマンド（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` など）は DM 内で直接動作します。ルームでは、OpenClaw はボット自身の Matrix メンションが前置されたコマンドも認識します。そのため、`@bot:server /new` はカスタムメンション正規表現なしでコマンドパスをトリガーします。これにより、Element などのクライアントでユーザーがコマンド入力前にボットをタブ補完したときに送出される、ルーム形式の `@mention /command` 投稿にボットが応答し続けられます。

認可ルールは引き続き適用されます。コマンド送信者は、通常メッセージと同じ DM またはルームの allowlist/オーナーポリシーを満たす必要があります。

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

**継承:**

- トップレベルの `channels.matrix` 値は、アカウントが上書きしない限り、名前付きアカウントのデフォルトとして機能します。
- `groups.<room>.account` で、継承されたルーム項目を特定のアカウントにスコープします。`account` のない項目はアカウント間で共有されます。デフォルトアカウントがトップレベルで設定されている場合、`account: "default"` も引き続き機能します。

**デフォルトアカウントの選択:**

- `defaultAccount` を設定して、暗黙のルーティング、プローブ、CLI コマンドが優先する名前付きアカウントを選びます。
- 複数のアカウントがあり、そのうち 1 つが文字どおり `default` という名前の場合、`defaultAccount` が未設定でも OpenClaw はそれを暗黙的に使用します。
- 複数の名前付きアカウントがあり、デフォルトが選択されていない場合、CLI コマンドは推測を拒否します。`defaultAccount` を設定するか、`--account <id>` を渡してください。
- トップレベルの `channels.matrix.*` ブロックは、認証が完全な場合（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）にのみ、暗黙の `default` アカウントとして扱われます。名前付きアカウントは、キャッシュ済みの認証情報が認証を補えるようになると、`homeserver` + `userId` から引き続き検出できます。

**昇格:**

- OpenClaw が修復またはセットアップ中に単一アカウント設定をマルチアカウントへ昇格する場合、既存の名前付きアカウントがあるか、`defaultAccount` がすでにそれを指していれば、そのアカウントを保持します。Matrix の認証/ブートストラップキーだけが昇格先アカウントに移動し、共有の配信ポリシーキーはトップレベルに残ります。

共有マルチアカウントパターンについては、[設定リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## プライベート/LAN ホームサーバー

デフォルトでは、OpenClaw は SSRF 保護のため、アカウントごとに明示的にオプトインしない限り、プライベート/内部 Matrix ホームサーバーをブロックします。

ホームサーバーが localhost、LAN/Tailscale IP、または内部ホスト名で実行されている場合、そのアカウントで `network.dangerouslyAllowPrivateNetwork` を有効にします。

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

このオプトインは、信頼済みのプライベート/内部ターゲットのみを許可します。`http://matrix.example.org:8008` のような公開の平文ホームサーバーは引き続きブロックされます。可能な限り `https://` を優先してください。

## Matrix トラフィックのプロキシ

Matrix デプロイメントで明示的なアウトバウンド HTTP(S) プロキシが必要な場合は、`channels.matrix.proxy` を設定します。

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

名前付きアカウントは、`channels.matrix.accounts.<id>.proxy` でトップレベルのデフォルトを上書きできます。OpenClaw は、ランタイムの Matrix トラフィックとアカウント状態プローブに同じプロキシ設定を使用します。

## ターゲット解決

OpenClaw がルームまたはユーザーターゲットを要求する場所では、Matrix は次のターゲット形式を受け付けます。

- ユーザー: `@user:server`, `user:@user:server`, または `matrix:user:@user:server`
- ルーム: `!room:server`, `room:!room:server`, または `matrix:room:!room:server`
- エイリアス: `#alias:server`, `channel:#alias:server`, または `matrix:channel:#alias:server`

Matrix ルーム ID は大文字と小文字が区別されます。明示的な配信先、cron ジョブ、バインディング、許可リストを設定するときは、Matrix の正確なルーム ID の大文字小文字を使用してください。OpenClaw はストレージ用に内部セッションキーを正規化して保持するため、それらの小文字キーは Matrix 配信 ID の信頼できる情報源ではありません。

ライブディレクトリ検索は、ログイン済みの Matrix アカウントを使用します。

- ユーザー検索は、そのホームサーバー上の Matrix ユーザーディレクトリに問い合わせます。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け付けます。参加済みルーム名の検索はベストエフォートで、`dangerouslyAllowNameMatching: true` が設定されている場合にのみランタイムのルーム許可リストへ適用されます。
- ルーム名を ID またはエイリアスへ解決できない場合、ランタイムの許可リスト解決では無視されます。

## 設定リファレンス

許可リスト形式のユーザーフィールド（`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`）は、完全な Matrix ユーザー ID を受け付けます（最も安全）。ID ではないエントリはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` が設定されている場合、Matrix ディレクトリの表示名との完全一致が起動時、およびモニター実行中に許可リストが変更されるたびに解決されます。解決できないエントリはランタイムで無視されます。

ルーム許可リストキー（`groups`, レガシーの `rooms`）は、ルーム ID またはエイリアスにする必要があります。プレーンなルーム名キーはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` は、参加済みルーム名に対するベストエフォート検索を復元します。

### アカウントと接続

- `enabled`: チャンネルを有効または無効にします。
- `name`: アカウントの任意の表示ラベル。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合の優先アカウント ID。
- `accounts`: 名前付きのアカウント別オーバーライド。トップレベルの `channels.matrix` 値はデフォルトとして継承されます。
- `homeserver`: ホームサーバー URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このアカウントが `localhost`、LAN/Tailscale IP、または内部ホスト名へ接続することを許可します。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。アカウント別オーバーライドに対応しています。
- `userId`: 完全な Matrix ユーザー ID（`@bot:example.org`）。
- `accessToken`: トークンベース認証用のアクセストークン。プレーンテキスト値と SecretRef 値は、env/file/exec プロバイダー全体で対応しています（[シークレット管理](/ja-JP/gateway/secrets)）。
- `password`: パスワードベースログイン用のパスワード。プレーンテキスト値と SecretRef 値に対応しています。
- `deviceId`: 明示的な Matrix デバイス ID。
- `deviceName`: パスワードログイン時に使用されるデバイス表示名。
- `avatarUrl`: プロファイル同期と `profile set` 更新用に保存される自分のアバター URL。
- `initialSyncLimit`: 起動時同期で取得するイベントの最大数。

### 暗号化

- `encryption`: E2EE を有効にします。デフォルト: `false`。
- `startupVerification`: `"if-unverified"`（E2EE が有効な場合のデフォルト）または `"off"`。このデバイスが未検証の場合、起動時に自己検証を自動要求します。
- `startupVerificationCooldownHours`: 次の自動起動時要求までのクールダウン。デフォルト: `24`。

### アクセスとポリシー

- `groupPolicy`: `"open"`、`"allowlist"`、または `"disabled"`。デフォルト: `"allowlist"`。
- `groupAllowFrom`: ルームトラフィック用ユーザー ID の許可リスト。
- `mentionPatterns`: ルームメンション用のスコープ付き正規表現パターン。`{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }` を持つオブジェクト。設定済みの `agents.list[].groupChat.mentionPatterns` をルームごとに適用するかどうかを制御します。
- `dm.enabled`: `false` の場合、すべての DM を無視します。デフォルト: `true`。
- `dm.policy`: `"pairing"`（デフォルト）、`"allowlist"`、`"open"`、または `"disabled"`。ボットが参加し、ルームを DM と分類した後に適用されます。招待処理には影響しません。
- `dm.allowFrom`: DM トラフィック用ユーザー ID の許可リスト。
- `dm.sessionScope`: `"per-user"`（デフォルト）または `"per-room"`。
- `dm.threadReplies`: 返信スレッド化の DM 専用オーバーライド（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`: 他の設定済み Matrix ボットアカウントからのメッセージを受け付けます（`true` または `"mentions"`）。
- `allowlistOnly`: `true` の場合、すべての有効な DM ポリシー（`"disabled"` を除く）と `"open"` グループポリシーを `"allowlist"` に強制します。`"disabled"` ポリシーは変更しません。
- `dangerouslyAllowNameMatching`: `true` の場合、ユーザー許可リストエントリに対する Matrix 表示名ディレクトリ検索と、ルーム許可リストキーに対する参加済みルーム名検索を許可します。完全な `@user:server` ID と、ルーム ID またはエイリアスを優先してください。
- `autoJoin`: `"always"`、`"allowlist"`、または `"off"`。デフォルト: `"off"`。DM 形式の招待を含む、すべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `"allowlist"` の場合に許可されるルーム/エイリアス。エイリアスエントリは、招待されたルームが主張する状態ではなく、ホームサーバーに対して解決されます。
- `contextVisibility`: 補足コンテキストの可視性（デフォルトは `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 返信動作

- `replyToMode`: `"off"`（デフォルト）、`"first"`、`"all"`、または `"batched"`。
- `threadReplies`: `"off"`（トップレベルのデフォルトは明示的に設定されない限り `"inbound"` に解決されます）、`"inbound"`、または `"always"`。
- `threadBindings`: スレッドにバインドされたセッションルーティングとライフサイクルのチャンネル別オーバーライド。
- `streaming`: `"off"`（デフォルト）、`"partial"`、`"quiet"`、`"progress"`、またはオブジェクト形式 `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`。`true` <-> `"partial"`、`false` <-> `"off"`。
- `blockStreaming`: `true` の場合、完了したアシスタントブロックは個別の進捗メッセージとして保持されます。デフォルト: `false`。
- `markdown`: 送信テキスト用の任意の Markdown レンダリング設定。
- `responsePrefix`: 送信返信の先頭に付加される任意の文字列。
- `textChunkLimit`: `chunkMode: "length"` の場合の送信チャンクサイズ（文字数）。デフォルト: `4000`。
- `chunkMode`: `"length"`（デフォルト、文字数で分割）または `"newline"`（行境界で分割）。
- `historyLimit`: ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数。`messages.groupChat.historyLimit` にフォールバックします。有効なデフォルトは `0`（無効）。
- `mediaMaxMb`: 送信と受信処理におけるメディアサイズ上限（MB）。デフォルト: `20`。

### リアクション設定

- `ackReaction`: このチャンネル/アカウント用の ack リアクションオーバーライド。
- `ackReactionScope`: スコープオーバーライド（デフォルトは `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`: 受信リアクション通知モード（デフォルトは `"own"`、`"off"`）。

### ツールとルーム別オーバーライド

- `actions`: アクション別ツール制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`: ルーム別ポリシーマップ。セッション ID は、解決後の安定したルーム ID を使用します。（`rooms` はレガシーエイリアスです。）
  - `groups.<room>.account`: 継承された 1 つのルームエントリを特定のアカウントに制限します。
  - `groups.<room>.enabled`: ルーム別トグル。`false` の場合、そのルームはマップに存在しないかのように無視されます。
  - `groups.<room>.requireMention`: チャンネルレベルのメンション要件のルーム別オーバーライド。
  - `groups.<room>.allowBots`: チャンネルレベル設定のルーム別オーバーライド（`true` または `"mentions"`）。
  - `groups.<room>.botLoopProtection`: ボット間ループ保護予算のルーム別オーバーライド。
  - `groups.<room>.users`: ルーム別送信者許可リスト。
  - `groups.<room>.tools`: ルーム別ツールの許可/拒否オーバーライド。
  - `groups.<room>.autoReply`: ルーム別メンション制御オーバーライド。`true` はそのルームのメンション要件を無効にします。`false` は再び有効化を強制します。
  - `groups.<room>.skills`: ルーム別 Skills フィルター。
  - `groups.<room>.systemPrompt`: ルーム別システムプロンプトスニペット。

### Exec 承認設定

- `execApprovals.enabled`: Matrix ネイティブプロンプトを通じて exec 承認を配信します。
- `execApprovals.approvers`: 承認を許可された Matrix ユーザー ID。`dm.allowFrom` にフォールバックします。
- `execApprovals.target`: `"dm"`（デフォルト）、`"channel"`、または `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 配信用の任意のエージェント/セッション許可リスト。

## 関連

- [チャンネル概要](/ja-JP/channels) - 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャット動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
