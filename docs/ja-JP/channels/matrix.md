---
read_when:
    - OpenClaw で Matrix を設定する
    - Matrix E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、構成例
title: マトリックス
x-i18n:
    generated_at: "2026-06-28T20:41:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1291273746e364fb0ca7eafbde3d717ee555c3edfa576eab4fdd3d0048ceedd
    source_path: channels/matrix.md
    workflow: 16
---

Matrix は OpenClaw 用のダウンロード可能なチャネルPluginです。
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## インストール

チャネルを設定する前に、ClawHub から Matrix をインストールします。

```bash
openclaw plugins install @openclaw/matrix
```

素のPlugin指定は、まず ClawHub を試し、その後 npm にフォールバックします。レジストリソースを強制するには、`openclaw plugins install clawhub:@openclaw/matrix` または `openclaw plugins install npm:@openclaw/matrix` を使用します。

ローカルチェックアウトからの場合:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` はPluginを登録して有効化するため、別途 `openclaw plugins enable matrix` の手順は不要です。ただし、以下でチャネルを設定するまではPluginは何もしません。一般的なPluginの動作とインストール規則については、[Plugins](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. ホームサーバーで Matrix アカウントを作成します。
2. `channels.matrix` に `homeserver` + `accessToken`、または `homeserver` + `userId` + `password` を設定します。
3. Gateway を再起動します。
4. ボットとの DM を開始するか、ルームに招待します（[自動参加](#auto-join) を参照。新しい招待は `autoJoin` が許可した場合にのみ反映されます）。

### 対話式セットアップ

```bash
openclaw channels add
openclaw configure --section channels
```

ウィザードは、ホームサーバー URL、認証方式（アクセストークンまたはパスワード）、ユーザー ID（パスワード認証のみ）、任意のデバイス名、E2EE を有効にするかどうか、ルームアクセスと自動参加を設定するかどうかを尋ねます。

一致する `MATRIX_*` 環境変数がすでに存在し、選択したアカウントに保存済み認証がない場合、ウィザードは環境変数ショートカットを提示します。許可リストを保存する前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を実行します。E2EE が有効な場合、ウィザードは設定を書き込み、[`openclaw matrix encryption setup`](#encryption-and-verification) と同じブートストラップを実行します。

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

`channels.matrix.autoJoin` のデフォルトは `off` です。デフォルトでは、新しい招待による新規ルームや DM に、手動で参加するまでボットは表示されません。

OpenClaw は招待時点で、招待されたルームが DM なのかグループなのかを判別できないため、DM 形式の招待を含むすべての招待はまず `autoJoin` を通ります。`dm.policy` は後で、ボットが参加し、ルームが分類された後にのみ適用されます。

<Warning>
ボットが受け入れる招待を制限するには `autoJoin: "allowlist"` と `autoJoinAllowlist` を設定し、すべての招待を受け入れるには `autoJoin: "always"` を設定します。

`autoJoinAllowlist` が受け入れるのは安定した対象のみです: `!roomId:server`、`#alias:server`、または `*`。プレーンなルーム名は拒否されます。エイリアス項目は、招待されたルームが主張する状態ではなく、ホームサーバーに対して解決されます。
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

### 許可リスト対象の形式

DM とルームの許可リストには、安定した ID を設定するのが最適です。

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）: `@user:server` を使用します。表示名は変更可能なため、デフォルトでは無視されます。表示名項目との互換性が明示的に必要な場合にのみ `dangerouslyAllowNameMatching: true` を設定します。
- ルーム許可リストキー（`groups`、レガシー `rooms`）: `!room:server` または `#alias:server` を使用します。プレーンなルーム名はデフォルトでは無視されます。参加済みルーム名の検索との互換性が明示的に必要な場合にのみ `dangerouslyAllowNameMatching: true` を設定します。
- 招待許可リスト（`autoJoinAllowlist`）: `!room:server`、`#alias:server`、または `*` を使用します。プレーンなルーム名は拒否されます。

### アカウント ID の正規化

ウィザードは、分かりやすい名前を正規化されたアカウント ID に変換します。たとえば、`Ops Bot` は `ops-bot` になります。2つのアカウントが衝突しないように、スコープ付き環境変数名では句読点がエスケープされます。`-` → `_X2D_` なので、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` に対応します。

### キャッシュされた資格情報

Matrix はキャッシュされた資格情報を `~/.openclaw/credentials/matrix/` 配下に保存します。

- デフォルトアカウント: `credentials.json`
- 名前付きアカウント: `credentials-<account>.json`

そこにキャッシュされた資格情報が存在する場合、アクセストークンが設定ファイルに含まれていなくても、OpenClaw は Matrix が設定済みであると扱います。これはセットアップ、`openclaw doctor`、チャネルステータスのプローブに適用されます。

### 環境変数

対応する設定キーが設定されていない場合に使用されます。デフォルトアカウントは接頭辞なしの名前を使用し、名前付きアカウントはサフィックスの前にアカウント ID を挿入します。

| デフォルトアカウント  | 名前付きアカウント（`<ID>` は正規化されたアカウント ID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

アカウント `ops` の場合、名前は `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` などになります。リカバリーキー環境変数は、`--recovery-key-stdin` でキーをパイプ入力するときに、リカバリー対応 CLI フロー（`verify backup restore`、`verify device`、`verify bootstrap`）によって読み取られます。

`MATRIX_HOMESERVER` はワークスペースの `.env` から設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security) を参照してください。

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

Matrix の返信ストリーミングはオプトインです。`streaming` は OpenClaw が進行中のアシスタント返信をどのように配信するかを制御し、`blockStreaming` は完了した各ブロックを独自の Matrix メッセージとして保持するかどうかを制御します。

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

| `streaming`       | 動作                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（デフォルト） | 完全な返信を待ってから1回送信します。`true` ↔ `"partial"`、`false` ↔ `"off"`。                                                                                      |
| `"partial"`       | モデルが現在のブロックを書いている間、通常のテキストメッセージ1件をインプレースで編集します。標準の Matrix クライアントは、最終編集ではなく最初のプレビューで通知する場合があります。 |
| `"quiet"`         | `"partial"` と同じですが、メッセージは通知しない通知メッセージです。受信者は、ユーザーごとのプッシュルールが確定済み編集に一致した場合にのみ通知を受け取ります（下記参照）。 |

`blockStreaming` は `streaming` から独立しています。

| `streaming`             | `blockStreaming: true`                                      | `blockStreaming: false`（デフォルト）              |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 現在のブロックのライブ下書き、完了したブロックはメッセージとして保持 | 現在のブロックのライブ下書き、インプレースで確定 |
| `"off"`                 | 完了したブロックごとに通知ありの Matrix メッセージ1件              | 完全な返信に対して通知ありの Matrix メッセージ1件 |

注記:

- プレビューが Matrix のイベントごとのサイズ上限を超えた場合、OpenClaw はプレビューストリーミングを停止し、最終版のみの配信にフォールバックします。
- メディア返信は常に通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClaw は最終メディア返信を送信する前にそれを削除します。
- Matrix プレビューストリーミングが有効な場合、ツール進捗のプレビュー更新はデフォルトで有効です。回答テキストのプレビュー編集は維持しつつ、ツール進捗を通常の配信経路に残すには、`streaming.preview.toolProgress: false` を設定します。
- プレビュー編集には追加の Matrix API 呼び出しが必要です。最も保守的なレート制限プロファイルが必要な場合は、`streaming: "off"` のままにします。

## 音声メッセージ

受信した Matrix 音声メモは、ルームのメンションゲートの前に文字起こしされます。これにより、ボット名を含む音声メモが `requireMention: true` のルームでエージェントを起動でき、エージェントには音声添付ファイルのプレースホルダーだけでなく文字起こしが渡されます。

Matrix は、`tools.media.audio` 配下に設定された共有音声メディアプロバイダー（OpenAI `gpt-4o-mini-transcribe` など）を使用します。プロバイダーのセットアップと制限については、[メディアツール概要](/ja-JP/tools/media-overview) を参照してください。

動作の詳細:

- `m.audio` イベントと、`audio/*` MIME タイプを持つ `m.file` イベントが対象です。
- 暗号化されたルームでは、OpenClaw は既存の Matrix メディア経路を通じて添付ファイルを復号してから文字起こしします。
- 文字起こしは、エージェントプロンプト内で機械生成かつ信頼できないものとしてマークされます。
- 添付ファイルはすでに文字起こし済みとしてマークされるため、下流のメディアツールが同じ音声メモを再度文字起こしすることはありません。
- 音声文字起こしをグローバルに無効化するには、`tools.media.audio.enabled: false` を設定します。

## 承認メタデータ

Matrix ネイティブの承認プロンプトは通常の `m.room.message` イベントであり、`com.openclaw.approval` 配下に OpenClaw 固有のカスタムイベント内容を持ちます。Matrix はカスタムイベント内容キーを許可するため、標準クライアントは引き続きテキスト本文を表示し、OpenClaw 対応クライアントは構造化された承認 ID、種類、状態、利用可能な判断、実行/Plugin の詳細を読み取れます。

承認プロンプトが1つの Matrix イベントには長すぎる場合、OpenClaw は表示テキストを分割し、`com.openclaw.approval` を最初のチャンクにのみ付与します。許可/拒否の判断用リアクションはその最初のイベントに紐付けられるため、長いプロンプトでも単一イベントのプロンプトと同じ承認対象を維持します。

### 静かな確定済みプレビュー用のセルフホスト型プッシュルール

`streaming: "quiet"` は、ブロックまたはターンが確定した時点でのみ受信者に通知します。ユーザーごとのプッシュルールが確定済みプレビューマーカーに一致する必要があります。完全な手順（受信者トークン、プッシャーチェック、ルールインストール、ホームサーバーごとの注記）については、[静かなプレビュー用の Matrix プッシュルール](/ja-JP/channels/matrix-push-rules) を参照してください。

## ボット間ルーム

デフォルトでは、他の設定済み OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。

エージェント間の Matrix トラフィックを意図的に許可したい場合は、`allowBots` を使用します。

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

- `allowBots: true` は、許可されたルームと DM 内の、設定済みの他の Matrix ボットアカウントからのメッセージを受け付けます。
- `allowBots: "mentions"` は、ルーム内でこのボットが見える形でメンションされている場合にのみ、それらのメッセージを受け付けます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベルの設定を上書きします。
- 受け付けられた設定済みボットのメッセージには、共有の [ボットループ保護](/ja-JP/channels/bot-loop-protection) が使われます。`channels.defaults.botLoopProtection` を設定し、1 つのルームで異なる予算が必要な場合は `channels.matrix.botLoopProtection` または `channels.matrix.groups.<room>.botLoopProtection` で上書きします。
- OpenClaw は、自己返信ループを避けるため、同じ Matrix ユーザー ID からのメッセージを引き続き無視します。
- Matrix はここではネイティブのボットフラグを公開しません。OpenClaw は「ボット作成」を「この OpenClaw gateway 上の別の設定済み Matrix アカウントによって送信された」として扱います。

共有ルームでボット間トラフィックを有効にする場合は、厳密なルーム許可リストとメンション要件を使用してください。

## 暗号化と検証

暗号化された (E2EE) ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは、引き続きプレーンな `thumbnail_url` が使われます。設定は不要です - plugin が E2EE 状態を自動的に検出します。

すべての `openclaw matrix` コマンドは、`--verbose` (完全な診断)、`--json` (機械可読出力)、`--account <id>` (複数アカウント構成) を受け付けます。出力はデフォルトで簡潔で、内部 SDK ログは静かです。以下の例は正規形を示しています。必要に応じてフラグを追加してください。

### 暗号化を有効にする

```bash
openclaw matrix encryption setup
```

秘密ストレージとクロス署名をブートストラップし、必要に応じてルームキーのバックアップを作成してから、ステータスと次の手順を出力します。有用なフラグ:

- `--recovery-key <key>` ブートストラップ前にリカバリキーを適用します (後述の stdin 形式を推奨)
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄して新しいものを作成します (意図した場合にのみ使用)

新しいアカウントでは、作成時に E2EE を有効にします:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` は `--enable-e2ee` のエイリアスです。

手動設定での同等内容:

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

`verify status` は 3 つの独立した信頼シグナルを報告します (`--verbose` はそれらすべてを表示します):

- `Locally trusted`: このクライアントでのみ信頼済み
- `Cross-signing verified`: SDK がクロス署名による検証を報告している
- `Signed by owner`: 自分自身の自己署名キーで署名済み (診断のみ)

`Verified by owner` は、`Cross-signing verified` が `yes` の場合にのみ `yes` になります。ローカル信頼または所有者署名だけでは不十分です。

`--allow-degraded-local-state` は、Matrix アカウントを先に準備せずにベストエフォートの診断を返します。オフラインまたは部分的に設定されたプローブに有用です。

### リカバリキーでこのデバイスを検証する

リカバリキーは機密情報です - コマンドラインで渡すのではなく stdin 経由でパイプしてください。`MATRIX_RECOVERY_KEY` (名前付きアカウントの場合は `MATRIX_<ID>_RECOVERY_KEY`) を設定します:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

このコマンドは 3 つの状態を報告します:

- `Recovery key accepted`: Matrix が秘密ストレージまたはデバイス信頼のためにキーを受け付けました。
- `Backup usable`: 信頼済みのリカバリ素材でルームキーのバックアップを読み込めます。
- `Device verified by owner`: このデバイスには完全な Matrix クロス署名 ID 信頼があります。

リカバリキーがバックアップ素材のロックを解除した場合でも、完全な ID 信頼が未完了なら非ゼロで終了します。その場合は、別の Matrix クライアントから自己検証を完了してください:

```bash
openclaw matrix verify self
```

`verify self` は、正常終了する前に `Cross-signing verified: yes` を待ちます。待機時間を調整するには `--timeout-ms <ms>` を使用します。

リテラルキー形式の `openclaw matrix verify device "<recovery-key>"` も受け付けられますが、キーはシェル履歴に残ります。

### クロス署名をブートストラップまたは修復する

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` は、暗号化されたアカウント向けの修復およびセットアップコマンドです。順番に、次を行います:

- 可能な場合は既存のリカバリキーを再利用して秘密ストレージをブートストラップする
- クロス署名をブートストラップし、不足している公開キーをアップロードする
- 現在のデバイスをマークし、クロス署名する
- まだ存在しない場合は、サーバー側のルームキーバックアップを作成する

ホームサーバーがクロス署名キーのアップロードに UIA を要求する場合、OpenClaw はまず認証なしを試し、次に `m.login.dummy`、次に `m.login.password` を試します (`channels.matrix.password` が必要)。

有用なフラグ:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` と組み合わせる) または `--recovery-key <key>`
- `--force-reset-cross-signing` で現在のクロス署名 ID を破棄します (意図した場合のみ。アクティブなリカバリキーが保存済みであるか、`--recovery-key-stdin` で指定されている必要があります)

### ルームキーバックアップ

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` は、サーバー側バックアップが存在するか、およびこのデバイスがそれを復号できるかを表示します。`backup restore` は、バックアップされたルームキーをローカル暗号ストアにインポートします。リカバリキーがすでにディスク上にある場合は、`--recovery-key-stdin` を省略できます。

壊れたバックアップを新しいベースラインに置き換えるには (復元不能な古い履歴の喪失を許容します。現在のバックアップシークレットを読み込めない場合は秘密ストレージも再作成できます):

```bash
openclaw matrix verify backup reset --yes
```

以前のリカバリキーで新しいバックアップベースラインのロックを解除できなくしたい場合にのみ、`--rotate-recovery-key` を追加します。

### 検証の一覧表示、要求、応答

```bash
openclaw matrix verify list
```

選択したアカウントの保留中の検証要求を一覧表示します。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

この OpenClaw アカウントから検証要求を送信します。`--own-user` は自己検証を要求します (同じユーザーの別の Matrix クライアントでプロンプトを受け付けます)。`--user-id`/`--device-id`/`--room-id` は他の人を対象にします。`--own-user` は他の対象指定フラグと組み合わせることはできません。

より低レベルのライフサイクル処理では、通常は別のクライアントからの受信要求をシャドーイングしている間に、これらのコマンドは特定の要求 `<id>` (`verify list` と `verify request` によって出力されます) に作用します:

| コマンド                                   | 目的                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 受信要求を受け付ける                                                |
| `openclaw matrix verify start <id>`        | SAS フローを開始する                                                |
| `openclaw matrix verify sas <id>`          | SAS の絵文字または数字を出力する                                    |
| `openclaw matrix verify confirm-sas <id>`  | SAS が相手のクライアントに表示されているものと一致することを確認する |
| `openclaw matrix verify mismatch-sas <id>` | 絵文字または数字が一致しない場合に SAS を拒否する                   |
| `openclaw matrix verify cancel <id>`       | キャンセルする。任意の `--reason <text>` と `--code <matrix-code>` を受け付ける |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas`、`cancel` はすべて、検証が特定のダイレクトメッセージルームに紐付いている場合の DM フォローアップヒントとして、`--user-id` と `--room-id` を受け付けます。

### 複数アカウントの注意点

`--account <id>` がない場合、Matrix CLI コマンドは暗黙のデフォルトアカウントを使用します。複数の名前付きアカウントがあり、`channels.matrix.defaultAccount` を設定していない場合、推測を拒否して選択を求めます。名前付きアカウントで E2EE が無効または利用不可の場合、エラーはそのアカウントの設定キーを指します。例: `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="起動時の動作">
    `encryption: true` の場合、`startupVerification` のデフォルトは `"if-unverified"` です。起動時に未検証のデバイスは別の Matrix クライアントで自己検証を要求し、重複をスキップし、クールダウン (デフォルトで 24 時間) を適用します。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効にします。

    起動時には、現在の秘密ストレージとクロス署名 ID を再利用する保守的な暗号ブートストラップパスも実行されます。ブートストラップ状態が壊れている場合、OpenClaw は `channels.matrix.password` なしでも保護付き修復を試みます。ホームサーバーがパスワード UIA を要求する場合、起動時に警告をログに記録し、非致命的なままにします。すでに所有者署名済みのデバイスは保持されます。

    完全なアップグレードフローについては [Matrix 移行](/ja-JP/channels/matrix-migration) を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は、厳密な DM 検証ルームに検証ライフサイクル通知を `m.notice` メッセージとして投稿します。要求、準備完了 (「絵文字で検証」のガイダンス付き)、開始/完了、利用可能な場合は SAS (絵文字/数字) の詳細です。

    別の Matrix クライアントからの受信要求は追跡され、自動受け付けされます。自己検証では、OpenClaw が SAS フローを自動的に開始し、絵文字検証が利用可能になると自分側を確認します - それでも、Matrix クライアントで比較し、「一致する」を確認する必要があります。

    検証システム通知はエージェントチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="削除済みまたは無効な Matrix デバイス">
    `verify status` が現在のデバイスはホームサーバーに一覧表示されていないと言う場合は、新しい OpenClaw Matrix デバイスを作成してください。パスワードログインの場合:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    トークン認証の場合は、Matrix クライアントまたは管理 UI で新しいアクセストークンを作成し、OpenClaw を更新します:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    失敗したコマンドのアカウント ID で `assistant` を置き換えるか、デフォルトアカウントでは `--account` を省略します。

  </Accordion>

  <Accordion title="デバイス管理">
    OpenClaw 管理の古いデバイスが蓄積することがあります。一覧表示して整理します:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="暗号ストア">
    Matrix E2EE は、IndexedDB シムとして `fake-indexeddb` を使い、公式の `matrix-js-sdk` Rust 暗号パスを使用します。暗号状態は `crypto-idb-snapshot.json` (制限的なファイル権限) に永続化されます。

    暗号化されたランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` の下にあり、同期ストア、暗号ストア、リカバリキー、IDB スナップショット、スレッドバインディング、起動時検証状態を含みます。トークンが変わってもアカウント ID が同じままの場合、OpenClaw は最適な既存ルートを再利用するため、以前の状態は引き続き見えます。

    単一の古いトークンハッシュルートは、通常のトークンローテーション継続パスである場合があります。OpenClaw が `matrix: multiple populated token-hash storage roots detected` をログに記録した場合は、アカウントディレクトリを調査し、選択されたアクティブルートが健全であることを確認した後にのみ、古い兄弟ルートをアーカイブしてください。すぐに削除するよりも、古いルートを `_archive/` ディレクトリに移動することを推奨します。

  </Accordion>
</AccordionGroup>

## プロファイル管理

選択したアカウントの Matrix セルフプロフィールを更新します。

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

1 回の呼び出しで両方のオプションを渡せます。Matrix は `mxc://` アバター URL を直接受け付けます。`http://` または `https://` を渡すと、OpenClaw は先にファイルをアップロードし、解決済みの `mxc://` URL を `channels.matrix.avatarUrl`（またはアカウント単位の上書き）に保存します。

## スレッド

Matrix は、自動返信とメッセージツール送信の両方でネイティブ Matrix スレッドをサポートします。動作は 2 つの独立したノブで制御します。

### セッションルーティング（`sessionScope`）

`dm.sessionScope` は、Matrix DM ルームを OpenClaw セッションにどのように対応付けるかを決めます。

- `"per-user"`（デフォルト）: 同じルーティング先ピアを持つすべての DM ルームが 1 つのセッションを共有します。
- `"per-room"`: ピアが同じ場合でも、各 Matrix DM ルームが独自のセッションキーを持ちます。

明示的な会話バインディングは常に `sessionScope` より優先されるため、バインド済みのルームとスレッドは選択済みのターゲットセッションを維持します。

### 返信スレッド化（`threadReplies`）

`threadReplies` は、ボットが返信をどこに投稿するかを決めます。

- `"off"`: 返信はトップレベルです。受信したスレッド内メッセージは親セッションに残ります。
- `"inbound"`: 受信メッセージがすでにそのスレッド内にあった場合にのみ、スレッド内で返信します。
- `"always"`: トリガー元メッセージをルートとするスレッド内で返信します。その会話は最初のトリガー以降、一致するスレッドスコープのセッション経由でルーティングされます。

`dm.threadReplies` は DM のみでこれを上書きします。たとえば、ルームのスレッドを分離したまま、DM はフラットに保てます。

### スレッド継承とスラッシュコマンド

- 受信したスレッド内メッセージには、追加のエージェントコンテキストとしてスレッドルートメッセージが含まれます。
- メッセージツール送信は、明示的な `threadId` が指定されていない限り、同じルーム（または同じ DM ユーザーターゲット）を対象にすると現在の Matrix スレッドを自動継承します。
- DM ユーザーターゲットの再利用は、現在のセッションメタデータによって同じ Matrix アカウント上の同じ DM ピアであることが証明される場合にのみ有効になります。それ以外の場合、OpenClaw は通常のユーザースコープルーティングにフォールバックします。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドバインドされた `/acp spawn` は、すべて Matrix ルームと DM で動作します。
- トップレベルの `/focus` は、`threadBindings.spawnSessions` が有効な場合、新しい Matrix スレッドを作成し、それをターゲットセッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、そのスレッドをその場でバインドします。

OpenClaw が、同じ共有セッション上の別の DM ルームと衝突している Matrix DM ルームを検出すると、そのルームに 1 回限りの `m.notice` を投稿し、`/focus` の退避手段を示して `dm.sessionScope` の変更を提案します。この通知は、スレッドバインディングが有効な場合にのみ表示されます。

## ACP 会話バインディング

Matrix ルーム、DM、既存の Matrix スレッドは、チャット面を変えずに永続的な ACP ワークスペースに変換できます。

オペレーター向けの手早いフロー:

- 使い続けたい Matrix DM、ルーム、または既存スレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM/ルームがチャット面として残り、以後のメッセージは生成された ACP セッションへルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` がその現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

注記:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnSessions` は `/acp spawn --thread auto|here` を制御します。この場合、OpenClaw は子 Matrix スレッドを作成またはバインドする必要があります。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャンネル単位の上書きもサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix のスレッドバインドセッション生成はデフォルトでオンです。

- トップレベルの `/focus` と `/acp spawn --thread auto|here` が Matrix スレッドを作成またはバインドするのをブロックするには、`threadBindings.spawnSessions: false` を設定します。
- ネイティブサブエージェントのスレッド生成で親トランスクリプトをフォークさせたくない場合は、`threadBindings.defaultSpawnContext: "isolated"` を設定します。

## リアクション

Matrix は、送信リアクション、受信リアクション通知、ack リアクションをサポートします。

送信リアクションツールは `channels.matrix.actions.reactions` によって制御されます。

- `react` は Matrix イベントにリアクションを追加します。
- `reactions` は Matrix イベントの現在のリアクションサマリーを一覧表示します。
- `emoji=""` は、そのイベント上のボット自身のリアクションを削除します。
- `remove: true` は、ボットから指定した絵文字リアクションのみを削除します。

**解決順序**（最初に定義された値が優先）:

| 設定                    | 順序                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `ackReaction`           | アカウント単位 → チャンネル → `messages.ackReaction` → エージェント ID 絵文字フォールバック |
| `ackReactionScope`      | アカウント単位 → チャンネル → `messages.ackReactionScope` → デフォルト `"group-mentions"` |
| `reactionNotifications` | アカウント単位 → チャンネル → デフォルト `"own"`                                      |

`reactionNotifications: "own"` は、ボットが作成した Matrix メッセージを対象とする追加済み `m.reaction` イベントを転送します。`"off"` はリアクションシステムイベントを無効にします。Matrix はリアクション削除を単独の `m.reaction` 削除としてではなく redaction として表すため、リアクション削除はシステムイベントとして合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める直近ルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックします。どちらも未設定の場合、有効なデフォルトは `0` です。無効にするには `0` を設定します。
- Matrix ルーム履歴はルーム専用です。DM は通常のセッション履歴を引き続き使用します。
- Matrix ルーム履歴は保留中のみです。OpenClaw はまだ返信をトリガーしていないルームメッセージをバッファし、メンションまたはその他のトリガーが到着した時点でそのウィンドウのスナップショットを取ります。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメイン受信本文に残ります。
- 同じ Matrix イベントの再試行では、新しいルームメッセージへずれていくのではなく、元の履歴スナップショットを再利用します。

## コンテキストの可視性

Matrix は、取得した返信テキスト、スレッドルート、保留中履歴などの補足ルームコンテキストに対して、共有の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブなルーム/ユーザーの allowlist チェックで許可された送信者に補足コンテキストを絞り込みます。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的な引用返信を 1 つだけ保持します。

この設定は補足コンテキストの可視性に影響します。受信メッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガー認可は引き続き、`groupPolicy`、`groups`、`groupAllowFrom`、および DM ポリシー設定から決まります。

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

ルームを動作させたまま DM を完全に無効にするには、`dm.enabled: false` を設定します。

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

メンションゲートと allowlist の動作については、[グループ](/ja-JP/channels/groups) を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前にメッセージを送り続ける場合、OpenClaw は同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに、短いクールダウン後にリマインダー返信を送ることがあります。

共有 DM ペアリングフローとストレージレイアウトについては、[ペアリング](/ja-JP/channels/pairing) を参照してください。

## ダイレクトルーム修復

ダイレクトメッセージ状態の同期がずれると、OpenClaw はライブ DM ではなく古い単独ルームを指す古い `m.direct` マッピングを持つことがあります。ピアの現在のマッピングを確認します。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復します。

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

どちらのコマンドも、マルチアカウント設定向けに `--account <id>` を受け付けます。修復フローは次のとおりです。

- すでに `m.direct` にマッピングされている厳密な 1:1 DM を優先します
- そのユーザーとの現在参加中の厳密な 1:1 DM にフォールバックします
- 正常な DM が存在しない場合は、新しいダイレクトルームを作成し、`m.direct` を書き換えます

古いルームは自動的には削除されません。正常な DM を選び、以後の Matrix 送信、検証通知、その他のダイレクトメッセージフローが正しいルームを対象にするようにマッピングを更新します。

## Exec 承認

Matrix はネイティブ承認クライアントとして動作できます。`channels.matrix.execApprovals`（またはアカウント単位の上書きとして `channels.matrix.accounts.<account>.execApprovals`）で設定します。

- `enabled`: Matrix ネイティブプロンプト経由で承認を配信します。未設定または `"auto"` の場合、少なくとも 1 人の承認者を解決できると Matrix が自動有効化されます。明示的に無効にするには `false` を設定します。
- `approvers`: exec リクエストの承認を許可する Matrix ユーザー ID（`@owner:example.org`）。任意です。`channels.matrix.dm.allowFrom` にフォールバックします。
- `target`: プロンプトの送信先です。`"dm"`（デフォルト）は承認者 DM に送信します。`"channel"` は発信元の Matrix ルームまたは DM に送信します。`"both"` は両方に送信します。
- `agentFilter` / `sessionFilter`: Matrix 配信をトリガーするエージェント/セッションを絞り込む任意の allowlist です。

認可は承認の種類によって少し異なります。

- **Exec 承認** は `execApprovals.approvers` を使用し、`dm.allowFrom` にフォールバックします。
- **Plugin 承認** は `dm.allowFrom` のみで認可します。

両方の種類で、Matrix リアクションショートカットとメッセージ更新を共有します。承認者はプライマリ承認メッセージ上にリアクションショートカットを確認できます。

- `✅` 1 回だけ許可
- `❌` 拒否
- `♾️` 常に許可（有効な exec ポリシーが許可する場合）

フォールバックスラッシュコマンド: `/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

解決済みの承認者のみが承認または拒否できます。exec 承認のチャンネル配信にはコマンドテキストが含まれます。`channel` または `both` は信頼できるルームでのみ有効にしてください。

関連: [Exec 承認](/ja-JP/tools/exec-approvals)。

## スラッシュコマンド

スラッシュコマンド（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` など）は DM で直接動作します。ルームでは、OpenClaw はボット自身の Matrix メンションが前置されたコマンドも認識するため、`@bot:server /new` はカスタムメンション regex なしでコマンドパスをトリガーします。これにより、ユーザーがコマンドを入力する前にボットをタブ補完したときに Element などのクライアントが送出する、ルーム形式の `@mention /command` 投稿にもボットが反応できます。

認可ルールは引き続き適用されます。コマンド送信者は、通常メッセージと同じ DM またはルームの allowlist/所有者ポリシーを満たす必要があります。

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

- トップレベルの `channels.matrix` 値は、アカウント側で上書きされない限り、名前付きアカウントのデフォルトとして機能します。
- 継承されたルームエントリは、`groups.<room>.account` で特定のアカウントにスコープできます。`account` のないエントリはアカウント間で共有されます。デフォルトアカウントがトップレベルで構成されている場合、`account: "default"` も引き続き機能します。

**デフォルトアカウントの選択:**

- 暗黙的なルーティング、プローブ、CLI コマンドが優先する名前付きアカウントを選ぶには、`defaultAccount` を設定します。
- 複数のアカウントがあり、そのうち 1 つが文字どおり `default` という名前の場合、`defaultAccount` が未設定でも OpenClaw はそれを暗黙的に使用します。
- 複数の名前付きアカウントがあり、デフォルトが選択されていない場合、CLI コマンドは推測を拒否します。`defaultAccount` を設定するか、`--account <id>` を渡してください。
- トップレベルの `channels.matrix.*` ブロックは、その認証が完全な場合（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）にのみ、暗黙的な `default` アカウントとして扱われます。名前付きアカウントは、キャッシュ済み認証情報で認証を満たせるようになると、`homeserver` + `userId` から引き続き検出できます。

**昇格:**

- 修復またはセットアップ中に OpenClaw が単一アカウント構成を複数アカウント構成へ昇格する場合、既存の名前付きアカウントが存在するか、`defaultAccount` がすでにそれを指していれば、それを保持します。昇格後のアカウントへ移動するのは Matrix の認証/bootstrap キーだけです。共有される配信ポリシーキーはトップレベルに残ります。

共有の複数アカウントパターンについては、[構成リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

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

このオプトインでは、信頼済みのプライベート/内部ターゲットのみが許可されます。`http://matrix.example.org:8008` のような公開の平文ホームサーバーは引き続きブロックされます。可能な限り `https://` を優先してください。

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

名前付きアカウントは、`channels.matrix.accounts.<id>.proxy` でトップレベルのデフォルトを上書きできます。OpenClaw は、実行時の Matrix トラフィックとアカウントステータスのプローブに同じプロキシ設定を使用します。

## ターゲット解決

Matrix は、OpenClaw がルームまたはユーザーターゲットを求める場所であればどこでも、次のターゲット形式を受け入れます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

Matrix ルーム ID は大文字と小文字を区別します。明示的な配信ターゲット、cron ジョブ、バインディング、許可リストを構成する場合は、Matrix の正確なルーム ID の大文字小文字を使用してください。OpenClaw は内部セッションキーを保存用に正規化するため、それらの小文字キーは Matrix 配信 ID の信頼できる情報源ではありません。

ライブのディレクトリ検索は、ログイン済みの Matrix アカウントを使用します。

- ユーザー検索は、そのホームサーバー上の Matrix ユーザーディレクトリを照会します。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け入れます。参加済みルーム名の検索はベストエフォートであり、`dangerouslyAllowNameMatching: true` が設定されている場合にのみ、実行時のルーム許可リストに適用されます。
- ルーム名を ID またはエイリアスに解決できない場合、実行時の許可リスト解決では無視されます。

## 構成リファレンス

許可リスト形式のユーザーフィールド（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）は、完全な Matrix ユーザー ID を受け入れます（最も安全です）。ID ではないユーザーエントリはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` を設定すると、完全一致する Matrix ディレクトリ表示名が起動時、およびモニター実行中に許可リストが変更されたときに解決されます。解決できないエントリは実行時に無視されます。

ルーム許可リストキー（`groups`、レガシーの `rooms`）は、ルーム ID またはエイリアスにしてください。プレーンなルーム名キーはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` により、参加済みルーム名に対するベストエフォート検索が復元されます。

### アカウントと接続

- `enabled`: channel を有効または無効にします。
- `name`: アカウントの任意の表示ラベル。
- `defaultAccount`: 複数の Matrix アカウントが構成されている場合の優先アカウント ID。
- `accounts`: 名前付きのアカウント別上書き。トップレベルの `channels.matrix` 値はデフォルトとして継承されます。
- `homeserver`: ホームサーバー URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このアカウントが `localhost`、LAN/Tailscale IP、または内部ホスト名へ接続できるようにします。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。アカウント別の上書きに対応しています。
- `userId`: 完全な Matrix ユーザー ID（`@bot:example.org`）。
- `accessToken`: トークンベース認証用のアクセストークン。env/file/exec プロバイダー全体で、平文および SecretRef 値に対応しています（[シークレット管理](/ja-JP/gateway/secrets)）。
- `password`: パスワードベースログイン用のパスワード。平文および SecretRef 値に対応しています。
- `deviceId`: 明示的な Matrix デバイス ID。
- `deviceName`: パスワードログイン時に使用するデバイス表示名。
- `avatarUrl`: プロファイル同期と `profile set` 更新用に保存される自分のアバター URL。
- `initialSyncLimit`: 起動時同期で取得されるイベントの最大数。

### 暗号化

- `encryption`: E2EE を有効にします。デフォルト: `false`。
- `startupVerification`: `"if-unverified"`（E2EE がオンの場合のデフォルト）または `"off"`。このデバイスが未検証の場合、起動時に自己検証を自動リクエストします。
- `startupVerificationCooldownHours`: 次回の自動起動リクエストまでのクールダウン。デフォルト: `24`。

### アクセスとポリシー

- `groupPolicy`: `"open"`、`"allowlist"`、または `"disabled"`。デフォルト: `"allowlist"`。
- `groupAllowFrom`: ルームトラフィック用のユーザー ID 許可リスト。
- `dm.enabled`: `false` の場合、すべての DM を無視します。デフォルト: `true`。
- `dm.policy`: `"pairing"`（デフォルト）、`"allowlist"`、`"open"`、または `"disabled"`。bot が参加し、そのルームを DM として分類した後に適用されます。招待処理には影響しません。
- `dm.allowFrom`: DM トラフィック用のユーザー ID 許可リスト。
- `dm.sessionScope`: `"per-user"`（デフォルト）または `"per-room"`。
- `dm.threadReplies`: 返信スレッド化の DM 限定上書き（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`: 他の構成済み Matrix bot アカウントからのメッセージを受け入れます（`true` または `"mentions"`）。
- `allowlistOnly`: `true` の場合、すべてのアクティブな DM ポリシー（`"disabled"` を除く）と `"open"` グループポリシーを `"allowlist"` に強制します。`"disabled"` ポリシーは変更しません。
- `dangerouslyAllowNameMatching`: `true` の場合、ユーザー許可リストエントリに対する Matrix 表示名ディレクトリ検索と、ルーム許可リストキーに対する参加済みルーム名検索を許可します。完全な `@user:server` ID と、ルーム ID またはエイリアスを優先してください。
- `autoJoin`: `"always"`、`"allowlist"`、または `"off"`。デフォルト: `"off"`。DM 形式の招待を含む、すべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `"allowlist"` の場合に許可されるルーム/エイリアス。エイリアスエントリは、招待されたルームが主張する状態ではなく、ホームサーバーに対して解決されます。
- `contextVisibility`: 補足コンテキストの可視性（デフォルトは `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 返信動作

- `replyToMode`: `"off"`、`"first"`、`"all"`、または `"batched"`。
- `threadReplies`: `"off"`、`"inbound"`、または `"always"`。
- `threadBindings`: スレッドに紐づくセッションルーティングとライフサイクルの channel 別上書き。
- `streaming`: `"off"`（デフォルト）、`"partial"`、`"quiet"`、またはオブジェクト形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`、`false` ↔ `"off"`。
- `blockStreaming`: `true` の場合、完了した assistant ブロックは個別の進行メッセージとして保持されます。
- `markdown`: 送信テキスト用の任意の Markdown レンダリング構成。
- `responsePrefix`: 送信返信の先頭に付加される任意の文字列。
- `textChunkLimit`: `chunkMode: "length"` の場合の送信チャンクサイズ（文字数）。デフォルト: `4000`。
- `chunkMode`: `"length"`（デフォルト、文字数で分割）または `"newline"`（行境界で分割）。
- `historyLimit`: ルームメッセージが agent をトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数。`messages.groupChat.historyLimit` にフォールバックします。有効なデフォルトは `0`（無効）です。
- `mediaMaxMb`: 送信および受信処理におけるメディアサイズ上限（MB）。

### リアクション設定

- `ackReaction`: この channel/アカウント用の ack リアクション上書き。
- `ackReactionScope`: スコープ上書き（デフォルトは `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`: 受信リアクション通知モード（デフォルトは `"own"`、`"off"`）。

### ツールとルーム別上書き

- `actions`: アクション別のツール制限（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`: ルーム別ポリシーマップ。セッション ID は解決後の安定したルーム ID を使用します。（`rooms` はレガシーエイリアスです。）
  - `groups.<room>.account`: 継承された 1 つのルームエントリを特定のアカウントに制限します。
  - `groups.<room>.allowBots`: channel レベル設定のルーム別上書き（`true` または `"mentions"`）。
  - `groups.<room>.users`: ルーム別の送信者許可リスト。
  - `groups.<room>.tools`: ルーム別のツール許可/拒否上書き。
  - `groups.<room>.autoReply`: ルーム別のメンション制限上書き。`true` はそのルームでメンション要件を無効にし、`false` は再び強制します。
  - `groups.<room>.skills`: ルーム別の skill フィルター。
  - `groups.<room>.systemPrompt`: ルーム別のシステムプロンプトスニペット。

### Exec 承認設定

- `execApprovals.enabled`: Matrix ネイティブのプロンプトを通じて exec 承認を配信します。
- `execApprovals.approvers`: 承認を許可される Matrix ユーザー ID。`dm.allowFrom` にフォールバックします。
- `execApprovals.target`: `"dm"`（デフォルト）、`"channel"`、または `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 配信用の任意の agent/セッション許可リスト。

## 関連

- [Channels 概要](/ja-JP/channels) - 対応しているすべての channel
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャット動作とメンション制限
- [Channel ルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
