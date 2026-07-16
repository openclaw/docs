---
read_when:
    - OpenClaw での Matrix のセットアップ
    - Matrix E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、設定例
title: Matrix
x-i18n:
    generated_at: "2026-07-16T11:24:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca704ff911dbe97242d42727561fbce59f27e190343d2343dfad46289c1e0b94
    source_path: channels/matrix.md
    workflow: 16
---

Matrix は、公式の `matrix-js-sdk` を基盤とするダウンロード可能なチャンネル Plugin（`@openclaw/matrix`）です。DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## インストール

```bash
openclaw plugins install @openclaw/matrix
```

修飾のない Plugin 指定では、まず ClawHub を試し、その後 npm にフォールバックします。`openclaw plugins install clawhub:@openclaw/matrix` または `npm:@openclaw/matrix` でソースを指定できます。ローカルチェックアウトからの場合は `openclaw plugins install ./path/to/local/matrix-plugin` を使用します。

`plugins install` は Plugin を登録して有効化するため、別途 `enable` を実行する必要はありません。ただし、以下の設定を行うまでチャンネルは動作しません。一般的なインストールルールについては、[Plugin](/ja-JP/tools/plugin)を参照してください。

## セットアップ

1. ホームサーバーに Matrix アカウントを作成します。
2. `channels.matrix` を、`homeserver` + `accessToken`、または `homeserver` + `userId` + `password` で設定します。
3. Gateway を再起動します。
4. ボットとの DM を開始するか、ボットをルームに招待します。新しい招待は、[`autoJoin`](#auto-join) で許可されている場合にのみ参加につながります。

### 対話形式のセットアップ

```bash
openclaw channels add
openclaw configure --section channels
```

ウィザードでは、ホームサーバー URL、認証方式（トークンまたはパスワード）、ユーザー ID（パスワード認証のみ）、任意のデバイス名、E2EE を有効にするかどうか、ルームアクセス／自動参加について尋ねられます。一致する `MATRIX_*` 環境変数がすでに存在し、アカウントに保存済みの認証情報がない場合、ウィザードは環境変数を使用するショートカットを提示します。`openclaw channels resolve --channel matrix "Project Room"` で許可リストを保存する前に、ルーム名を解決してください。ウィザードで E2EE を有効にすると、[`openclaw matrix encryption setup`](#encryption-and-verification) と同じブートストラップが実行されます。

### 最小構成

トークンベース：

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

パスワードベース（初回ログイン後にトークンをキャッシュ）：

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

`channels.matrix.autoJoin` のデフォルトは `"off"` です。手動で参加するまで、ボットは新しい招待によるルームや DM に表示されません。OpenClaw は招待時点では、それが DM かグループかを判別できないため、すべての招待はまず `autoJoin` を通ります。`dm.policy` が適用されるのは、ボットが参加してルームが分類された後です。

<Warning>
受け入れる招待を制限するには `autoJoin: "allowlist"` と `autoJoinAllowlist` を設定し、すべての招待を受け入れるには `autoJoin: "always"` を設定します。

`autoJoinAllowlist` で受け入れられるのは、`!roomId:server`、`#alias:server`、または `*` のみです。単純なルーム名は拒否されます。エイリアスは、招待されたルームが提示する状態ではなく、ホームサーバーに対して解決されます。
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

### 許可リストの対象形式

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：`@user:server` を使用します。表示名は変更可能なため、デフォルトでは無視されます。表示名との明示的な互換性が必要な場合にのみ、`dangerouslyAllowNameMatching: true` を設定してください。
- ルーム許可リストのキー（`groups`、従来のエイリアス `rooms`）：`!room:server` または `#alias:server` を使用します。`dangerouslyAllowNameMatching: true` でない限り、単純な名前は無視されます。
- 招待許可リスト（`autoJoinAllowlist`）：`!room:server`、`#alias:server`、または `*` を使用します。単純な名前は常に拒否されます。

### アカウント ID の正規化

ウィザードは、分かりやすい名前を正規化されたアカウント ID に変換します（`Ops Bot` -> `ops-bot`）。アカウント間の衝突を防ぐため、スコープ付き環境変数名では句読点が 16 進数でエスケープされます。`-`（0x2D）は `_X2D_` になるため、`ops-prod` は環境変数プレフィックス `MATRIX_OPS_X2D_PROD_` に対応します。

### キャッシュされた認証情報

Matrix は `~/.openclaw/credentials/matrix/` 配下に認証情報をキャッシュします。デフォルトアカウントには `credentials.json`、名前付きアカウントには `credentials-<account>.json` を使用します。キャッシュされた認証情報が存在する場合、設定ファイルに `accessToken` がなくても、OpenClaw は Matrix が設定済みであるとみなします。これはセットアップ、`openclaw doctor`、チャンネル状態のプローブに適用されます。

### 環境変数

対応する設定キーが未設定の場合に使用される、設定キーに対応した環境変数です。デフォルトアカウントではプレフィックスなしの名前を使用し、名前付きアカウントではサフィックスの前にアカウントトークンを挿入します（[正規化](#account-id-normalization)を参照）。

| デフォルトアカウント       | 名前付きアカウント（`<ID>` = アカウントトークン） |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

アカウント `ops` の場合、名前は `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` などになります。`MATRIX_HOMESERVER`（およびスコープ付きの `*_HOMESERVER` バリアント）は、ワークスペースの `.env` から設定できません。[ワークスペースの `.env` ファイル](/ja-JP/gateway/security)を参照してください。

<Note>
リカバリーキーは設定に対応する環境変数ではありません。OpenClaw 自体が環境から読み取ることはありません。CLI の案内テキストでは、デフォルトアカウントの場合は `MATRIX_RECOVERY_KEY`、名前付きアカウントの場合は `MATRIX_RECOVERY_KEY_<ID>`（アカウント ID をそのまま大文字にしたもの。16 進数エスケープなし）という名前のシェル変数を介して渡す方法を提示します。[リカバリーキーでこのデバイスを検証する](#verify-this-device-with-a-recovery-key)を参照してください。
</Note>

## 設定例

DM ペアリング、ルーム許可リスト、E2EE を含む実用的な基本構成：

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
      streaming: { mode: "partial" },
    },
  },
}
```

## ストリーミングプレビュー

Matrix の返信ストリーミングはオプトインです。`streaming.mode` は、生成中のアシスタント返信を OpenClaw がどのように配信するかを制御します。`streaming.block.enabled` は、完了した各ブロックを個別の Matrix メッセージとして保持するかどうかを制御します。

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

回答のライブプレビューを維持しつつ、一時的なツール／進捗行を非表示にするには：

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

完全な設定では `{ mode, chunkMode, block, preview, progress }` を使用できます。

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`：カスタムラベル。設定済みまたは組み込みのラベルを選択するには `"auto"`／未設定、非表示にするには `false` を使用します。
- `progress.labels`：`label` が `"auto"` または未設定の場合にのみ使用される候補です。
- `progress.maxLines`：下書きに保持するローリング進捗行の最大数です。これを超える古い行は削除されます。
- `progress.maxLineChars`：切り詰める前の、簡潔な進捗行あたりの最大文字数です。
- `progress.toolProgress`：`true`（デフォルト）の場合、ツール／進捗のライブアクティビティが下書きに表示されます。

| `streaming.mode`  | 動作                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（デフォルト） | 返信全体を待ち、1 回だけ送信します。                                                                                                                      |
| `"partial"`       | モデルが現在のブロックを生成する間、通常のテキストメッセージ 1 件をその場で編集します。標準クライアントでは、最終編集時ではなく最初のプレビュー時に通知される場合があります。          |
| `"quiet"`         | `"partial"` と同じですが、メッセージは通知を発生させない notice です。確定した編集がユーザーごとのプッシュルールに一致した時点で、受信者に 1 回通知されます（後述）。 |
| `"progress"`      | 進捗下書きを使用して、簡潔な進捗行を個別に送信します。                                                                                          |

`streaming.block.enabled`（デフォルト `false`）は `streaming.mode` とは独立しています。

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false`（デフォルト）                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 現在のブロック用のライブ下書き。完了したブロックはメッセージとして保持されます | 現在のブロック用のライブ下書き。その場で確定されます |
| `"off"`                 | 完了したブロックごとに通知を発生させる Matrix メッセージ 1 件                     | 返信全体に対して通知を発生させる Matrix メッセージ 1 件      |

注：

- プレビューが Matrix のイベントあたりのサイズ上限を超えた場合、OpenClaw はプレビューストリーミングを停止し、最終結果のみの配信にフォールバックします。
- メディア返信では、添付ファイルは常に通常どおり送信されます。古いプレビューを安全に再利用できない場合、OpenClaw は最終的なメディア返信を送信する前に、そのプレビューを削除します。
- プレビューストリーミングが有効な場合、ツール進捗のプレビュー更新はデフォルトで有効です。回答テキストのプレビュー編集を維持しつつ、ツール進捗を通常の配信経路に残すには、`streaming.preview.toolProgress: false` を設定します。
- プレビュー編集では Matrix API 呼び出しが追加で発生します。最も保守的なレート制限プロファイルを使用するには、`streaming.mode: "off"` のままにしてください。
- 従来のスカラー／ブール値の `streaming` と、フラットな `blockStreaming`／`chunkMode` キーは、`openclaw doctor --fix` によってこのネストされた形式に書き換えられます。

## ボイスメッセージ

受信した Matrix のボイスメモは、ルームのメンションゲートより前に文字起こしされます。そのため、ボット名を含むボイスメモによって `requireMention: true` ルーム内のエージェントを起動でき、エージェントは音声添付ファイルのプレースホルダーだけでなく文字起こしを受け取ります。

Matrix は、OpenAI の `gpt-4o-mini-transcribe` など、`tools.media.audio` 配下の共有音声メディアプロバイダーを使用します。プロバイダーのセットアップと制限については、[メディアツールの概要](/ja-JP/tools/media-overview)を参照してください。

- `m.audio` イベント、および `audio/*` MIME タイプの `m.file` イベントが対象です。
- 暗号化されたルームでは、OpenClaw は文字起こしの前に、既存の Matrix メディアパスを通じて添付ファイルを復号します。
- 文字起こしは、エージェントプロンプト内で機械生成かつ信頼されていないものとしてマークされます。
- 添付ファイルは文字起こし済みとしてマークされるため、後続のメディアツールが再度文字起こしすることはありません。
- 音声文字起こしをグローバルに無効にするには、`tools.media.audio.enabled: false` を設定します。

## 承認メタデータ

Matrix ネイティブの承認プロンプトは通常の `m.room.message` イベントであり、`com.openclaw.approval` キーの下に OpenClaw 固有のコンテンツを含みます。標準クライアントでもテキスト本文は表示されますが、OpenClaw 対応クライアントは、構造化された承認 ID、種類、状態、決定、および exec/Plugin の詳細を読み取れます。

プロンプトが長すぎて 1 つの Matrix イベントに収まらない場合、OpenClaw は表示テキストを分割し、最初のチャンクだけに `com.openclaw.approval` を付加します。許可または拒否のリアクションはその最初のイベントに紐づくため、長いプロンプトでも単一イベントのプロンプトと同じ承認対象が維持されます。

### 確定済みプレビューを静かに通知するためのセルフホスト型プッシュルール

`streaming.mode: "quiet"` はブロックまたはターンが確定したときにのみ受信者へ通知します。ユーザーごとのプッシュルールで、確定済みプレビューマーカーを照合する必要があります。完全な手順については、[静かなプレビューのための Matrix プッシュルール](/ja-JP/channels/matrix-push-rules)を参照してください。

## ボット間ルーム

デフォルトでは、設定済みの別の OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。エージェント間トラフィックを意図的に許可するには、`allowBots` を使用します。

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

- `allowBots: true` は、許可されたルームと DM で、設定済みの別の Matrix ボットアカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルーム内でこのボットへの明示的なメンションが表示されている場合に限り、それらのメッセージを受け入れます。DM はこれにかかわらず許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベルの設定を上書きします。
- 受け入れられた設定済みボットのメッセージには、共有の[ボットループ保護](/ja-JP/channels/bot-loop-protection)が適用されます。`channels.defaults.botLoopProtection` を設定し、アカウントごとに `channels.matrix.botLoopProtection`、またはルームごとに `channels.matrix.groups.<room>.botLoopProtection` で上書きします。
- 自己応答ループを避けるため、OpenClaw は同じ Matrix ユーザー ID からのメッセージを引き続き無視します。
- Matrix にはネイティブのボットフラグがありません。OpenClaw は「ボットが送信した」を「この OpenClaw Gateway 上の、設定済みの別の Matrix アカウントが送信した」として扱います。

共有ルームでボット間トラフィックを有効にする場合は、厳格なルーム許可リストとメンション要件を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントに `thumbnail_file` が使用されるため、画像プレビューも完全な添付ファイルとともに暗号化されます。暗号化されていないルームでは、プレーンな `thumbnail_url` が使用されます。設定は不要で、Plugin が E2EE の状態を自動的に検出します。

すべての `openclaw matrix` コマンドは、`--verbose`（完全な診断）、`--json`（機械可読出力）、および `--account <id>`（マルチアカウント構成）を受け付けます。デフォルトでは簡潔な出力になります。

### 暗号化を有効にする

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

秘密ストレージとクロス署名を初期化し、必要に応じてルームキーのバックアップを作成してから、状態と次の手順を表示します。便利なフラグ：

- `--recovery-key-stdin` は、プロセス引数に公開せずに標準入力からリカバリーキーを読み取ります。互換性のため、`--recovery-key <key>` も引き続き利用できます
- `--force-reset-cross-signing` は、現在のクロス署名 ID を破棄して新しい ID を作成します（意図的な場合のみ使用）

新しいアカウントでは、作成時に E2EE を有効にします。

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` は `--enable-e2ee` のエイリアスです。対応する手動設定：

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

`verify status` は、独立した 3 つの信頼シグナルを報告します（`--verbose` はそのすべてを表示します）。

- `Locally trusted`：このクライアントによってのみ信頼されています
- `Cross-signing verified`：SDK がクロス署名による検証を報告しています
- `Signed by owner`：自身の自己署名キーによって署名されています（診断専用）

`Verified by owner` が `yes` になるのは、`Cross-signing verified` が `yes` の場合だけです。ローカルの信頼または所有者の署名だけでは不十分です。

`--allow-degraded-local-state` は、Matrix アカウントを先に準備せず、ベストエフォートの診断を返します。オフラインまたは部分的に設定された環境の調査に便利です。

### リカバリーキーを使用してこのデバイスを検証する

リカバリーキーをコマンドラインで渡す代わりに、標準入力へパイプします。

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

このコマンドは 3 つの状態を報告します。

- `Recovery key accepted`：Matrix が秘密ストレージまたはデバイスの信頼に使用するキーを受け入れました。
- `Backup usable`：信頼されたリカバリー情報を使用して、ルームキーのバックアップを読み込めます。
- `Device verified by owner`：このデバイスは Matrix クロス署名 ID によって完全に信頼されています。

リカバリーキーによってバックアップ情報のロックを解除できた場合でも、ID の完全な信頼が未完了なら、終了コードはゼロ以外になります。その場合は、別の Matrix クライアントから自己検証を完了します。

```bash
openclaw matrix verify self
```

`verify self` は、正常終了する前に `Cross-signing verified: yes` を待機します。待機時間を調整するには `--timeout-ms <ms>` を使用します。

キーを直接指定する形式の `openclaw matrix verify device "<recovery-key>"` も使用できますが、キーがシェル履歴に残ります。

### クロス署名を初期化または修復する

```bash
openclaw matrix verify bootstrap
```

暗号化されたアカウント用の修復・セットアップコマンドです。次の順序で処理します。

- 可能な場合は既存のリカバリーキーを再利用して、秘密ストレージを初期化します
- クロス署名を初期化し、不足している公開鍵をアップロードします
- 現在のデバイスをマークしてクロス署名します
- サーバー側のルームキーバックアップがまだ存在しない場合は作成します

ホームサーバーでクロス署名キーのアップロードに UIA が必要な場合、OpenClaw は最初に認証なし、次に `m.login.dummy`、その次に `m.login.password`（`channels.matrix.password` が必要）の順で試行します。

便利なフラグ：

- `--recovery-key-stdin`（`printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...` と組み合わせて使用）または `--recovery-key <key>`
- `--force-reset-cross-signing` は、現在のクロス署名 ID を破棄します（意図的な場合のみ。アクティブなリカバリーキーが保存済みであるか、`--recovery-key-stdin` で指定されている必要があります）

### ルームキーのバックアップ

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` は、サーバー側のバックアップが存在するか、このデバイスで復号できるかを示します。`backup restore` は、バックアップされたルームキーをローカルの暗号ストアにインポートします。リカバリーキーがすでにディスク上にある場合は、`--recovery-key-stdin` を省略します。

壊れたバックアップを新しいベースラインに置き換えるには、次のコマンドを実行します（復元不能な古い履歴が失われることを許容します。現在のバックアップシークレットを読み込めない場合は、秘密ストレージも再作成できます）。

```bash
openclaw matrix verify backup reset --yes
```

以前のリカバリーキーで新しいバックアップベースラインのロックを解除できないようにする場合に限り、`--rotate-recovery-key` を追加します。

### 検証の一覧表示、要求、および応答

```bash
openclaw matrix verify list
```

選択したアカウントの保留中の検証要求を一覧表示します。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

このアカウントから検証要求を送信します。`--own-user` は自己検証を要求します（同じユーザーの別の Matrix クライアントでプロンプトを承認してください）。`--user-id`/`--device-id`/`--room-id` は別のユーザーを対象とします。`--own-user` は、その他の対象指定フラグと組み合わせられません。

より低レベルのライフサイクル処理では、通常、別のクライアントからの受信要求を追跡するときに、これらのコマンドが特定の要求 `<id>`（`verify list` および `verify request` によって表示）に作用します。

| コマンド                                    | 目的                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 受信要求を承認する                                           |
| `openclaw matrix verify start <id>`        | SAS フローを開始する                                                  |
| `openclaw matrix verify sas <id>`          | SAS の絵文字または数値を表示する                                     |
| `openclaw matrix verify confirm-sas <id>`  | SAS がもう一方のクライアントの表示と一致することを確認する            |
| `openclaw matrix verify mismatch-sas <id>` | 絵文字または数値が一致しない場合に SAS を拒否する              |
| `openclaw matrix verify cancel <id>`       | キャンセルする。オプションで `--reason <text>` と `--code <matrix-code>` を指定可能 |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas`、および `cancel` はすべて、検証が特定のダイレクトメッセージルームに紐づいている場合、DM のフォローアップ用ヒントとして `--user-id` と `--room-id` を受け付けます。

### マルチアカウントに関する注意事項

`--account <id>` を指定しない場合、Matrix CLI コマンドは暗黙のデフォルトアカウントを使用します。複数の名前付きアカウントがあり、`channels.matrix.defaultAccount` が指定されていない場合、コマンドは推測を拒否して選択を求めます。名前付きアカウントで E2EE が無効または利用不可の場合、エラーはそのアカウントの設定キーを示します。例：`channels.matrix.accounts.assistant.encryption`

<AccordionGroup>
  <Accordion title="起動時の動作">
    `encryption: true` を指定すると、`startupVerification` のデフォルトは `"if-unverified"` になります。起動時に、未検証のデバイスは別の Matrix クライアントでの自己検証を要求し、重複をスキップしてクールダウンを適用します（デフォルトでは 24 時間）。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効にします。

    起動時には、現在の秘密ストレージとクロス署名 ID を再利用する保守的な暗号初期化処理も実行されます。初期化状態が壊れている場合、OpenClaw は `channels.matrix.password` がなくても保護付きの修復を試みます。ホームサーバーでパスワード UIA が必要な場合、起動時に警告をログへ記録しますが、致命的なエラーにはなりません。すでに所有者によって署名済みのデバイスは維持されます。

    完全なアップグレード手順については、[Matrix の移行](/ja-JP/channels/matrix-migration)を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は、検証ライフサイクルの通知を `m.notice` メッセージとして厳格な DM 検証ルームに投稿します。これには、要求、準備完了（「Verify by emoji」の案内付き）、開始・完了、および利用可能な場合は SAS（絵文字・数値）の詳細が含まれます。

    別の Matrix クライアントからの受信要求は追跡され、自動的に承認されます。自己検証の場合、OpenClaw は SAS フローを自動的に開始し、絵文字による検証が利用可能になると自身の側で確認します。引き続き Matrix クライアントで比較し、「They match」を確認する必要があります。

    検証システムの通知は、エージェントのチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="削除済みまたは無効な Matrix デバイス">
    `verify status` が、現在のデバイスはホームサーバーに一覧表示されていないと示す場合は、新しい OpenClaw Matrix デバイスを作成します。パスワードログインの場合：

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    トークン認証の場合は、Matrix クライアントまたは管理 UI で新しいアクセストークンを作成してから、OpenClaw を更新します。

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` を失敗したコマンドのアカウント ID に置き換えるか、デフォルトアカウントの場合は `--account` を省略します。

  </Accordion>

  <Accordion title="デバイスの整理">
    OpenClaw が管理する古いデバイスが蓄積することがあります。以下のコマンドで一覧表示して整理します。

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="暗号化ストア">
    Matrix E2EE は、IndexedDB シムとして `fake-indexeddb` を使用する公式の `matrix-js-sdk` Rust 暗号化パスを使用します。暗号化状態は `crypto-idb-snapshot.json` に永続化されます（ファイル権限は制限されます）。

    暗号化されたランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 以下に保存され、同期ストア、暗号化ストア、復旧キー、IDB スナップショット、スレッドバインディング、起動時の検証状態が含まれます。アカウントのアイデンティティが同じままトークンが変更された場合、OpenClaw は最適な既存ルートを再利用するため、以前の状態は引き続き参照できます。

    古いトークンハッシュのルートが 1 つだけ存在する場合、通常のトークンローテーション継続パスである可能性があります。OpenClaw が `matrix: multiple populated token-hash storage roots detected` をログに記録した場合は、アカウントディレクトリを調査し、選択されたアクティブルートが正常であることを確認してから、古い兄弟ルートをアーカイブしてください。古いルートはすぐに削除せず、`_archive/` ディレクトリへ移動することを推奨します。

  </Accordion>
</AccordionGroup>

## プロフィール管理

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

両方のオプションを 1 回の呼び出しで渡します。Matrix は `mxc://` アバター URL を直接受け付けます。`http://`/`https://` を渡すと、まずファイルがアップロードされ、解決された `mxc://` URL が `channels.matrix.avatarUrl`（またはアカウントごとのオーバーライド）に保存されます。

## スレッド

Matrix は、自動返信とメッセージツールによる送信の両方でネイティブスレッドをサポートします。動作は 2 つの独立した設定で制御されます。

### セッションルーティング（`sessionScope`）

`dm.sessionScope` は、Matrix の DM ルームを OpenClaw セッションに対応付ける方法を決定します。

- `"per-user"`（デフォルト）：同じルーティング先ピアを持つすべての DM ルームが 1 つのセッションを共有します。
- `"per-room"`：同じピアであっても、Matrix の各 DM ルームに個別のセッションキーが割り当てられます。

明示的な会話バインディングは常に `sessionScope` より優先されます。バインドされたルームとスレッドでは、選択されたターゲットセッションが維持されます。

### 返信のスレッド化（`threadReplies`）

`threadReplies` は、ボットが返信を投稿する場所を決定します。

- `"off"`：返信はトップレベルに投稿されます。受信したスレッド内メッセージは親セッションにとどまります。
- `"inbound"`：受信メッセージがすでにスレッド内にある場合にのみ、そのスレッド内で返信します。
- `"always"`：トリガーとなったメッセージをルートとするスレッド内で返信します。その会話は最初のトリガー以降、対応するスレッドスコープのセッションを通じてルーティングされます。

`dm.threadReplies` は DM に限りこの設定を上書きします。たとえば、ルームのスレッドを分離したまま、DM をフラットに保つことができます。

### スレッドの継承とスラッシュコマンド

- 受信したスレッド内メッセージには、追加のエージェントコンテキストとしてスレッドのルートメッセージが含まれます。
- メッセージツールによる送信は、明示的な `threadId` が指定されていない限り、同じルーム（または同じ DM ユーザーターゲット）を対象とする場合、現在の Matrix スレッドを自動的に継承します。
- DM ユーザーターゲットの再利用は、現在のセッションメタデータによって、同じ Matrix アカウント上の同じ DM ピアであることが証明される場合にのみ有効になります。それ以外の場合、OpenClaw は通常のユーザースコープのルーティングにフォールバックします。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドにバインドされた `/acp spawn` は、すべて Matrix のルームと DM で機能します。
- `threadBindings.spawnSessions` が有効な場合、トップレベルの `/focus` は新しい Matrix スレッドを作成し、ターゲットセッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、そのスレッドがその場でバインドされます。

OpenClaw が、同じ共有セッション上の別の DM ルームと競合する Matrix DM ルームを検出すると、`/focus` の回避策を案内し、`dm.sessionScope` の変更を提案する `m.notice` を 1 回だけ投稿します。この通知は、スレッドバインディングが有効な場合にのみ表示されます。

## ACP 会話バインディング

Matrix のルーム、DM、既存の Matrix スレッドは、チャット画面を変更することなく、永続的な ACP ワークスペースとして使用できます。

オペレーター向けの簡単な手順：

- 引き続き使用する Matrix の DM、ルーム、または既存のスレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの DM またはルームでは、現在の DM／ルームがチャット画面として維持され、以降のメッセージは生成された ACP セッションにルーティングされます。
- 既存のスレッド内では、`--bind here` によって現在のスレッドがその場でバインドされます。
- `/new` と `/reset` は、バインドされた同じ ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを終了し、バインディングを削除します。

`--bind here` は子 Matrix スレッドを作成しません。OpenClaw が子スレッドを作成またはバインドする必要がある `/acp spawn --thread auto|here` は、`threadBindings.spawnSessions` によって制御されます。

### スレッドバインディングの設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャネルごとのオーバーライドをサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`：サブエージェントと ACP の両方のスレッド生成を制御します。
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`：サブエージェントのみ、または ACP のみの生成に対する、より限定的なオーバーライドです。
- `threadBindings.defaultSpawnContext`

Matrix のスレッドにバインドされたセッションの生成は、デフォルトで有効です。トップレベルの `/focus` と `/acp spawn --thread auto|here` が Matrix スレッドを作成またはバインドできないようにするには、`threadBindings.spawnSessions: false` を設定します。ネイティブのサブエージェントスレッド生成で親トランスクリプトをフォークしない場合は、`threadBindings.defaultSpawnContext: "isolated"` を設定します。

## リアクション

Matrix は、送信リアクション、受信リアクション通知、確認応答リアクションをサポートします。

送信リアクションツールは `channels.matrix.actions.reactions` によって制限されます。

- `react` は Matrix イベントにリアクションを追加します。
- `reactions` は Matrix イベントの現在のリアクション概要を一覧表示します。
- `emoji=""` は、そのイベントに対するボット自身のリアクションを削除します。
- `remove: true` は、指定された絵文字リアクションのみをボットから削除します。

**解決順序**（最初に定義された値が優先されます）：

| 設定                 | 順序                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | アカウント単位 -> チャンネル -> `messages.ackReaction` -> エージェント ID の絵文字フォールバック   |
| `ackReactionScope`      | アカウント単位 -> チャンネル -> `messages.ackReactionScope` -> デフォルト `"group-mentions"` |
| `reactionNotifications` | アカウント単位 -> チャンネル -> デフォルト `"own"`                                           |

`reactionNotifications: "own"` は、ボットが作成した Matrix メッセージを対象とする、追加された `m.reaction` イベントを転送します。`"off"` はリアクションのシステムイベントを無効にします。リアクションの削除はシステムイベントとして合成されません。Matrix では、これらは独立した `m.reaction` の削除ではなく、リダクションとして扱われます。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、ルームメッセージがエージェントをトリガーしたときに、最近のルームメッセージを何件 `InboundHistory` として含めるかを制御します。`messages.groupChat.historyLimit` にフォールバックします。両方が未設定の場合、実効デフォルトは `0` です（無効）。
- Matrix のルーム履歴はルーム内だけに適用されます。DM では引き続き通常のセッション履歴を使用します。
- ルーム履歴は保留中のメッセージのみを対象とします。OpenClaw は、まだ返信をトリガーしていないルームメッセージをバッファリングし、メンションなどのトリガーが届いた時点で、その範囲のスナップショットを取得します。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメイン受信本文に残ります。
- 同じ Matrix イベントを再試行する場合、より新しいルームメッセージへ移動することなく、元の履歴スナップショットを再利用します。

## コンテキストの可視性

Matrix は、取得された返信テキスト、スレッドルート、保留中の履歴など、補足的なルームコンテキスト向けの共通 `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、補足コンテキストを、現在有効なルーム／ユーザー許可リストのチェックで許可された送信者に絞り込みます。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的に引用された返信を 1 件だけ保持します。

これは補足コンテキストの可視性にのみ影響し、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。トリガーの認可は、引き続き `groupPolicy`、`groups`、`groupAllowFrom`、および DM ポリシー設定に基づきます。

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

ルームを機能させたまま DM を完全に無効化するには、`dm.enabled: false` を設定します。

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

メンション制限と許可リストの動作については、[グループ](/ja-JP/channels/groups)を参照してください。

Matrix DM のペアリング例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前にメッセージを送り続けた場合、OpenClaw は同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに、短いクールダウン後にリマインダーを返信することがあります。

共通の DM ペアリングフローとストレージ構成については、[ペアリング](/ja-JP/channels/pairing)を参照してください。

## ダイレクトルームの修復

ダイレクトメッセージの状態にずれが生じると、OpenClaw の古い `m.direct` マッピングが、現在の DM ではなく以前の一対一ルームを参照している場合があります。ピアの現在のマッピングを調べます：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復します：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

マルチアカウント構成では、どちらのコマンドも `--account <id>` を受け付けます。修復フローは次のとおりです：

- `m.direct` にすでにマッピングされている厳密な 1:1 DM を優先する
- そのユーザーと現在参加中の厳密な 1:1 DM があれば、それを代わりに使用する
- 正常な DM が存在しない場合、新しいダイレクトルームを作成し、`m.direct` を書き換える

古いルームは自動的には削除されません。正常な DM を選択してマッピングを更新するため、以後の Matrix からの送信、検証通知、その他のダイレクトメッセージフローは正しいルームを対象とします。

## 実行の承認

Matrix はネイティブの承認クライアントとして機能できます。`channels.matrix.execApprovals`（アカウントごとの上書きの場合は `channels.matrix.accounts.<account>.execApprovals`）で設定します：

- `enabled`：Matrix ネイティブのプロンプトを通じて承認を配信します。未設定または `"auto"` の場合、少なくとも 1 人の承認者を解決できるようになると自動的に有効になります。明示的に無効にするには `false` を設定します。
- `approvers`：実行リクエストを承認できる Matrix ユーザー ID（`@owner:example.org`）。`channels.matrix.dm.allowFrom` にフォールバックします。
- `target`：プロンプトの送信先。`"dm"`（デフォルト）は承認者の DM に送信し、`"channel"` は発信元のルームまたは DM に送信し、`"both"` は両方に送信します。
- `agentFilter` / `sessionFilter`：Matrix への配信をトリガーするエージェント／セッションを指定する任意の許可リスト。

認可は承認の種類によって若干異なります：

- **実行の承認**では `execApprovals.approvers` を使用し、`dm.allowFrom` にフォールバックします。
- **Plugin の承認**では、`dm.allowFrom` のみを通じて認可します。

どちらの種類も、Matrix のリアクションショートカットとメッセージ更新を共有します。承認者には、主要な承認メッセージ上にリアクションショートカットが表示されます。

- ✅ 1 回だけ許可
- ❌ 拒否
- ♾️ 常に許可（有効な実行ポリシーで許可されている場合）

フォールバックのスラッシュコマンド: `/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

解決済みの承認者だけが承認または拒否できます。実行承認のチャンネル配信にはコマンドテキストが含まれます。`channel` または `both` は、信頼できるルームでのみ有効にしてください。

関連項目: [実行承認](/ja-JP/tools/exec-approvals)。

## スラッシュコマンド

スラッシュコマンド（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` など）は DM で直接動作します。ルームでは、OpenClaw はボット自身の Matrix メンションを前置したコマンドも認識するため、`@bot:server /new` はカスタムのメンション正規表現なしでコマンドパスを起動します。これにより、ユーザーがコマンドを入力する前にボットをタブ補完した際、Element や同様のクライアントが生成するルーム形式の `@mention /command` 投稿にも、ボットが応答できます。

認可ルールは引き続き適用されます。コマンド送信者は、通常のメッセージと同じ DM またはルームの許可リスト／所有者ポリシーを満たす必要があります。

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

- アカウントで上書きしない限り、トップレベルの `channels.matrix` 値が名前付きアカウントのデフォルトとして機能します。
- `groups.<room>.account` を使用して、継承されたルームエントリのスコープを特定のアカウントに限定します。`account` のないエントリはアカウント間で共有されます。デフォルトアカウントがトップレベルで設定されている場合も、`account: "default"` は引き続き機能します。

**デフォルトアカウントの選択:**

- 暗黙的なルーティング、プローブ、CLI コマンドが優先する名前付きアカウントを選ぶには、`defaultAccount` を設定します。
- 複数のアカウントがあり、そのうち 1 つの名前が文字どおり `default` である場合、`defaultAccount` が未設定でも OpenClaw はそのアカウントを暗黙的に使用します。
- 複数の名前付きアカウントがあり、デフォルトが選択されていない場合、CLI コマンドは推測を拒否します。`defaultAccount` を設定するか、`--account <id>` を渡してください。
- トップレベルの `channels.matrix.*` ブロックが暗黙の `default` アカウントとして扱われるのは、認証が完了している場合（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）のみです。キャッシュ済みの資格情報で認証を満たせる場合、名前付きアカウントは `homeserver` + `userId` から引き続き検出できます。

**昇格:**

- OpenClaw が修復またはセットアップ中に単一アカウント設定を複数アカウント設定へ昇格する場合、既存の名前付きアカウントがあるか、`defaultAccount` がすでにそのアカウントを指していれば、それを保持します。昇格されたアカウントに移動するのは Matrix の認証／ブートストラップキーだけです。共有の配信ポリシーキーはトップレベルに残ります。

共有の複数アカウントパターンについては、[設定リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## プライベート／LAN ホームサーバー

デフォルトでは、SSRF 対策のため、アカウントごとに明示的に許可しない限り、OpenClaw はプライベート／内部 Matrix ホームサーバーをブロックします。

ホームサーバーが localhost、LAN/Tailscale IP、または内部ホスト名で稼働している場合、そのアカウントで `network.dangerouslyAllowPrivateNetwork` を有効にします。

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

この明示的な許可は、信頼できるプライベート／内部ターゲットのみを許可します。`http://matrix.example.org:8008` のような公開の平文ホームサーバーは引き続きブロックされます。可能な限り `https://` を使用してください。

## Matrix トラフィックのプロキシ

Matrix デプロイメントで明示的な送信 HTTP(S) プロキシが必要な場合は、`channels.matrix.proxy` を設定します。

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

名前付きアカウントでは、`channels.matrix.accounts.<id>.proxy` を使用してトップレベルのデフォルトを上書きできます。OpenClaw は、実行時の Matrix トラフィックとアカウント状態プローブに同じプロキシ設定を使用します。

## ターゲットの解決

OpenClaw がルームまたはユーザーのターゲットを要求するすべての箇所で、Matrix は次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

Matrix のルーム ID は大文字と小文字を区別します。明示的な配信ターゲット、Cron ジョブ、バインディング、または許可リストを設定する際は、Matrix のルーム ID と完全に同じ大文字／小文字を使用してください。OpenClaw はストレージ用の内部セッションキーを正規化して保持するため、小文字化されたこれらのキーは Matrix 配信 ID の信頼できる情報源ではありません。

ライブディレクトリ検索では、ログイン済みの Matrix アカウントを使用します。

- ユーザー検索では、そのホームサーバー上の Matrix ユーザーディレクトリを照会します。
- ルーム検索では、明示的なルーム ID とエイリアスを直接受け付けます。参加済みルームの名前検索はベストエフォートであり、`dangerouslyAllowNameMatching: true` が設定されている場合にのみ、実行時のルーム許可リストに適用されます。
- ルーム名を ID またはエイリアスに解決できない場合、実行時の許可リスト解決では無視されます。

## 設定リファレンス

許可リスト形式のユーザーフィールド（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）には、完全な Matrix ユーザー ID を指定できます（最も安全です）。ID ではないエントリはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` が設定されている場合、Matrix ディレクトリの表示名との完全一致が、起動時およびモニター実行中に許可リストが変更されるたびに解決されます。解決できないエントリは実行時に無視されます。

ルーム許可リストのキー（`groups`、旧 `rooms`）には、ルーム ID またはエイリアスを指定してください。単純なルーム名のキーはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` を使用すると、参加済みルーム名に対するベストエフォート検索が復元されます。

### アカウントと接続

- `enabled`: チャンネルを有効または無効にします。
- `name`: アカウントの任意の表示ラベル。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合に優先するアカウント ID。
- `accounts`: 名前付きのアカウント単位の上書き。トップレベルの `channels.matrix` 値はデフォルトとして継承されます。
- `homeserver`: ホームサーバー URL（例: `https://matrix.example.org`）。
- `network.dangerouslyAllowPrivateNetwork`: このアカウントに `localhost`、LAN/Tailscale IP、または内部ホスト名への接続を許可します。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。アカウント単位の上書きをサポートします。
- `userId`: 完全な Matrix ユーザー ID（`@bot:example.org`）。
- `accessToken`: トークンベース認証用のアクセストークン。env/file/exec プロバイダー全体で平文値と SecretRef 値をサポートします（[シークレット管理](/ja-JP/gateway/secrets)）。
- `password`: パスワードベースのログイン用パスワード。平文値と SecretRef 値をサポートします。
- `deviceId`: 明示的な Matrix デバイス ID。
- `deviceName`: パスワードログイン時に使用されるデバイス表示名。
- `avatarUrl`: プロファイル同期および `profile set` 更新用に保存された自己アバター URL。
- `initialSyncLimit`: 起動時の同期中に取得するイベントの最大数。

### 暗号化

- `encryption`: E2EE を有効にします。デフォルト: `false`。
- `startupVerification`: `"if-unverified"`（E2EE が有効な場合のデフォルト）または `"off"`。このデバイスが未検証の場合、起動時に自己検証を自動要求します。
- `startupVerificationCooldownHours`: 次回の自動起動要求までのクールダウン。デフォルト: `24`。

### アクセスとポリシー

- `groupPolicy`: `"open"`、`"allowlist"`、または `"disabled"`。デフォルト: `"allowlist"`。
- `groupAllowFrom`: ルームトラフィック用のユーザー ID 許可リスト。
- `mentionPatterns`: ルームメンション用のスコープ付き正規表現パターン。`{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }` を含むオブジェクト。設定済みの `agents.list[].groupChat.mentionPatterns` をルーム単位で適用するかどうかを制御します。
- `dm.enabled`: `false` の場合、すべての DM を無視します。デフォルト: `true`。
- `dm.policy`: `"pairing"`（デフォルト）、`"allowlist"`、`"open"`、または `"disabled"`。ボットが参加し、ルームを DM として分類した後に適用されます。招待処理には影響しません。
- `dm.allowFrom`: DM トラフィック用のユーザー ID 許可リスト。
- `dm.sessionScope`: `"per-user"`（デフォルト）または `"per-room"`。
- `dm.threadReplies`: 返信スレッド化に対する DM 専用の上書き（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`: 設定済みの他の Matrix ボットアカウントからのメッセージを受け入れます（`true` または `"mentions"`）。
- `allowlistOnly`: `true` の場合、すべての有効な DM ポリシー（`"disabled"` を除く）と `"open"` グループポリシーを `"allowlist"` に強制します。`"disabled"` ポリシーは変更しません。
- `dangerouslyAllowNameMatching`: `true` の場合、ユーザー許可リストエントリに対する Matrix 表示名ディレクトリ検索と、ルーム許可リストキーに対する参加済みルーム名検索を許可します。完全な `@user:server` ID、およびルーム ID またはエイリアスを優先してください。
- `autoJoin`: `"always"`、`"allowlist"`、または `"off"`。デフォルト: `"off"`。DM 形式の招待を含む、すべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `"allowlist"` の場合に許可されるルーム／エイリアス。エイリアスエントリは、招待されたルームが主張する状態ではなく、ホームサーバーに対して解決されます。
- `contextVisibility`: 補足コンテキストの可視性（`"all"` がデフォルト、`"allowlist"`、`"allowlist_quote"`）。

### 返信動作

- `replyToMode`: `"off"`（デフォルト）、`"first"`、`"all"`、または `"batched"`。
- `threadReplies`: `"off"`（明示的に設定しない限り、トップレベルのデフォルトは `"inbound"` に解決されます）、`"inbound"`、または `"always"`。
- `threadBindings`: スレッドに紐づくセッションのルーティングとライフサイクルに対するチャンネル単位のオーバーライド。
- `streaming`: ネストされたオブジェクト `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`。`mode` は `"off"`（デフォルト）、`"partial"`、`"quiet"`、または `"progress"` です。従来のスカラー／ブール表記は `openclaw doctor --fix` によって移行されます。
- `streaming.block.enabled`: `true` の場合、完了したアシスタントブロックは個別の進捗メッセージとして保持されます。デフォルト: `false`。
- `markdown`: 送信テキスト用のオプションの Markdown レンダリング設定。
- `responsePrefix`: 送信する返信の先頭に付加するオプションの文字列。
- `textChunkLimit`: `streaming.chunkMode: "length"` の場合の送信チャンクサイズ（文字数）。デフォルト: `4000`。
- `streaming.chunkMode`: `"length"`（デフォルト、文字数で分割）または `"newline"`（行の境界で分割）。
- `historyLimit`: ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める直近のルームメッセージ数。`messages.groupChat.historyLimit` にフォールバックします。実効デフォルトは `0`（無効）です。
- `mediaMaxMb`: 送信および受信処理におけるメディアサイズの上限（MB）。デフォルト: `20`。

### リアクション設定

- `ackReaction`: このチャンネル／アカウントの確認リアクションのオーバーライド。
- `ackReactionScope`: スコープのオーバーライド（デフォルトは `"group-mentions"`、ほかに `"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`: 受信リアクションの通知モード（デフォルトは `"own"`、ほかに `"off"`）。

### ツール設定とルーム単位のオーバーライド

- `actions`: アクション単位のツール制限（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`: ルーム単位のポリシーマップ。セッション ID には、解決後の安定したルーム ID が使用されます。（`rooms` は従来のエイリアスです。）
  - `groups.<room>.account`: 継承された1つのルームエントリを特定のアカウントに制限します。
  - `groups.<room>.enabled`: ルーム単位の切り替え。`false` の場合、そのルームはマップに存在しないものとして無視されます。
  - `groups.<room>.requireMention`: チャンネルレベルのメンション要件に対するルーム単位のオーバーライド。
  - `groups.<room>.allowBots`: チャンネルレベルの設定（`true` または `"mentions"`）に対するルーム単位のオーバーライド。
  - `groups.<room>.botLoopProtection`: ボット間ループ保護の上限に対するルーム単位のオーバーライド。
  - `groups.<room>.users`: ルーム単位の送信者許可リスト。
  - `groups.<room>.tools`: ルーム単位のツール許可／拒否のオーバーライド。
  - `groups.<room>.autoReply`: ルーム単位のメンション制限のオーバーライド。`true` はそのルームのメンション要件を無効にし、`false` は再び強制的に有効にします。
  - `groups.<room>.skills`: ルーム単位の Skills フィルター。
  - `groups.<room>.systemPrompt`: ルーム単位のシステムプロンプトスニペット。

### Exec 承認設定

- `execApprovals.enabled`: Matrix ネイティブのプロンプトを通じて Exec 承認を配信します。
- `execApprovals.approvers`: 承認を許可する Matrix ユーザー ID。`dm.allowFrom` にフォールバックします。
- `execApprovals.target`: `"dm"`（デフォルト）、`"channel"`、または `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 配信用のオプションのエージェント／セッション許可リスト。

## 関連項目

- [チャンネルの概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングのフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制限
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
