---
read_when:
    - OpenClaw での Matrix の設定
    - Matrix E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、設定例
title: Matrix
x-i18n:
    generated_at: "2026-07-14T13:27:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 44ca73642bcf6621f9e02891cfb8c29b87eea635780cc16c123ef9c163e9ad70
    source_path: channels/matrix.md
    workflow: 16
---

Matrix は、公式の `matrix-js-sdk` を基盤とするダウンロード可能なチャンネル Plugin（`@openclaw/matrix`）です。DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## インストール

```bash
openclaw plugins install @openclaw/matrix
```

修飾なしの Plugin 指定では、まず ClawHub を試し、その後 npm にフォールバックします。`openclaw plugins install clawhub:@openclaw/matrix` または `npm:@openclaw/matrix` でソースを強制指定できます。ローカルチェックアウトから使用する場合: `openclaw plugins install ./path/to/local/matrix-plugin`。

`plugins install` は Plugin を登録して有効化するため、別途 `enable` を実行する必要はありません。ただし、以下の設定を行うまでチャンネルは何も実行しません。一般的なインストール規則については、[Plugin](/ja-JP/tools/plugin)を参照してください。

## セットアップ

1. ホームサーバー上に Matrix アカウントを作成します。
2. `channels.matrix` を `homeserver` + `accessToken`、または `homeserver` + `userId` + `password` で設定します。
3. Gateway を再起動します。
4. ボットとの DM を開始するか、ボットをルームに招待します。新しい招待は、[`autoJoin`](#auto-join)で許可されている場合にのみ受け入れられます。

### 対話式セットアップ

```bash
openclaw channels add
openclaw configure --section channels
```

ウィザードでは、ホームサーバー URL、認証方式（トークンまたはパスワード）、ユーザー ID（パスワード認証のみ）、任意のデバイス名、E2EE を有効にするかどうか、およびルームアクセス／自動参加について尋ねられます。一致する `MATRIX_*` 環境変数がすでに存在し、アカウントに保存済みの認証情報がない場合、ウィザードは環境変数を使用するショートカットを提示します。`openclaw channels resolve --channel matrix "Project Room"` で許可リストを保存する前に、ルーム名を解決してください。ウィザードで E2EE を有効にすると、[`openclaw matrix encryption setup`](#encryption-and-verification)と同じブートストラップが実行されます。

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

`channels.matrix.autoJoin` のデフォルトは `"off"` です。手動で参加するまで、新しい招待によるルームや DM にボットは現れません。OpenClaw は招待時点では、その招待が DM かグループかを判別できないため、すべての招待は最初に `autoJoin` を通過します。`dm.policy` が適用されるのは、ボットが参加してルームが分類された後です。

<Warning>
受け入れる招待を制限するには `autoJoin: "allowlist"` と `autoJoinAllowlist` を設定し、すべての招待を受け入れるには `autoJoin: "always"` を設定します。

`autoJoinAllowlist` は、`!roomId:server`、`#alias:server`、または `*` のみを受け入れます。単純なルーム名は拒否されます。エイリアスは、招待されたルームが提示する状態ではなく、ホームサーバーに対して解決されます。
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

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）: `@user:server` を使用します。表示名はデフォルトでは無視されます（変更可能なため）。表示名との明示的な互換性が必要な場合にのみ `dangerouslyAllowNameMatching: true` を設定してください。
- ルーム許可リストのキー（`groups`、従来のエイリアス `rooms`）: `!room:server` または `#alias:server` を使用します。`dangerouslyAllowNameMatching: true` でない限り、単純な名前は無視されます。
- 招待許可リスト（`autoJoinAllowlist`）: `!room:server`、`#alias:server`、または `*` を使用します。単純な名前は常に拒否されます。

### アカウント ID の正規化

ウィザードは、分かりやすい名前を正規化されたアカウント ID に変換します（`Ops Bot` -> `ops-bot`）。アカウント間の衝突を防ぐため、スコープ付き環境変数名では句読記号が 16 進数でエスケープされます。`-`（0x2D）は `_X2D_` になるため、`ops-prod` は環境変数プレフィックス `MATRIX_OPS_X2D_PROD_` に対応します。

### キャッシュされた認証情報

Matrix は `~/.openclaw/credentials/matrix/` 配下に認証情報をキャッシュします。デフォルトアカウントでは `credentials.json`、名前付きアカウントでは `credentials-<account>.json` です。キャッシュされた認証情報が存在する場合、設定ファイルに `accessToken` がなくても、OpenClaw は Matrix が設定済みであると見なします。これは、セットアップ、`openclaw doctor`、およびチャンネル状態のプローブに適用されます。

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
リカバリーキーは、設定に対応する環境変数ではありません。OpenClaw 自体が環境から読み取ることはありません。CLI の案内文では、デフォルトアカウントの場合は `MATRIX_RECOVERY_KEY`、名前付きアカウントの場合は `MATRIX_RECOVERY_KEY_<ID>`（16 進数エスケープなしの、大文字化された単純なアカウント ID）という名前のシェル変数を介して渡す方法を提示しています。[リカバリーキーでこのデバイスを検証する](#verify-this-device-with-a-recovery-key)を参照してください。
</Note>

## 設定例

DM ペアリング、ルーム許可リスト、E2EE を含む実用的な基本設定:

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

Matrix の返信ストリーミングはオプトインです。`streaming.mode` は、生成中のアシスタント返信を OpenClaw が配信する方法を制御します。`streaming.block.enabled` は、完了した各ブロックを個別の Matrix メッセージとして保持するかどうかを制御します。

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

回答のライブプレビューを維持しつつ、途中のツール／進捗行を非表示にするには:

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

完全な設定では `{ mode, chunkMode, block, preview, progress }` を使用できます:

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

- `progress.label`: カスタムラベル。設定済みまたは組み込みのラベルを選択するには `"auto"`/未設定、非表示にするには `false` を指定します。
- `progress.labels`: `label` が `"auto"` または未設定の場合にのみ使用される候補です。
- `progress.maxLines`: 下書きに保持するローリング進捗行の最大数です。これを超えた古い行は削除されます。
- `progress.maxLineChars`: 切り詰める前の、コンパクトな進捗行あたりの最大文字数です。
- `progress.toolProgress`: `true`（デフォルト）の場合、ライブのツール／進捗アクティビティが下書きに表示されます。

| `streaming.mode`  | 動作                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（デフォルト） | 完全な返信を待ってから、1 回だけ送信します。                                                                                                                      |
| `"partial"`       | モデルが現在のブロックを生成している間、通常のテキストメッセージ 1 件をその場で編集します。標準クライアントでは、最終編集時ではなく最初のプレビュー時に通知される場合があります。          |
| `"quiet"`         | `"partial"` と同じですが、メッセージは通知を発生させない notice になります。ユーザーごとのプッシュルールが確定後の編集に一致した時点で、受信者に一度通知されます（以下を参照）。 |
| `"progress"`      | 進捗下書きを使用して、個別のコンパクトな進捗行を送信します。                                                                                          |

`streaming.block.enabled`（デフォルト `false`）は `streaming.mode` とは独立しています:

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false`（デフォルト）                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 現在のブロックにはライブ下書きを使用し、完了したブロックはメッセージとして保持します | 現在のブロックにはライブ下書きを使用し、その場で確定します |
| `"off"`                 | 完了したブロックごとに通知を伴う Matrix メッセージを 1 件送信します                     | 完全な返信に対して通知を伴う Matrix メッセージを 1 件送信します      |

注:

- プレビューが Matrix のイベントごとのサイズ制限を超えると、OpenClaw はプレビューストリーミングを停止し、最終結果のみの配信にフォールバックします。
- メディア返信では、添付ファイルは常に通常どおり送信されます。古くなったプレビューを安全に再利用できない場合、OpenClaw は最終的なメディア返信を送信する前にそのプレビューを秘匿化します。
- プレビューストリーミングが有効な場合、ツール進捗のプレビュー更新はデフォルトで有効です。回答テキストのプレビュー編集を維持しながら、ツール進捗を通常の配信経路に残すには、`streaming.preview.toolProgress: false` を設定します。
- プレビュー編集では、Matrix API 呼び出しが追加で発生します。最も保守的なレート制限プロファイルを使用するには、`streaming.mode: "off"` のままにしてください。
- 従来のスカラー／ブール値の `streaming` と、フラットな `blockStreaming` / `chunkMode` キーは、`openclaw doctor --fix` によってこのネスト形式に書き換えられます。

## 音声メッセージ

受信した Matrix の音声メモは、ルームのメンション判定より前に文字起こしされます。そのため、`requireMention: true` ルームでボット名を発声した音声メモによってエージェントを起動でき、エージェントは音声添付ファイルのプレースホルダーだけでなく、文字起こしを受け取ります。

Matrix は、OpenAI の `gpt-4o-mini-transcribe` など、`tools.media.audio` 配下の共有音声メディアプロバイダーを使用します。プロバイダーのセットアップと制限については、[メディアツールの概要](/ja-JP/tools/media-overview)を参照してください。

- `m.audio` イベント、および `audio/*` MIME タイプの `m.file` イベントが対象です。
- 暗号化されたルームでは、OpenClaw は文字起こしの前に、既存の Matrix メディアパスを通じて添付ファイルを復号します。
- 文字起こしは、エージェントプロンプト内で機械生成かつ信頼できないものとしてマークされます。
- 添付ファイルは文字起こし済みとしてマークされるため、後続のメディアツールが再度文字起こしすることはありません。
- 音声文字起こしをグローバルに無効にするには、`tools.media.audio.enabled: false` を設定します。

## 承認メタデータ

Matrix ネイティブの承認プロンプトは、`com.openclaw.approval` キーの下に OpenClaw 固有のコンテンツを持つ通常の `m.room.message` イベントです。標準クライアントでもテキスト本文は表示されます。OpenClaw 対応クライアントは、構造化された承認 ID、種類、状態、判断、および実行／Plugin の詳細を読み取れます。

プロンプトが長すぎて 1 つの Matrix イベントに収まらない場合、OpenClaw は表示テキストを分割し、最初のチャンクのみに `com.openclaw.approval` を付加します。許可／拒否のリアクションはその最初のイベントに関連付けられるため、長いプロンプトでも単一イベントのプロンプトと同じ承認対象が維持されます。

### 確定済みプレビューを通知しないためのセルフホスト型プッシュルール

`streaming.mode: "quiet"` は、ブロックまたはターンが確定したときにのみ受信者へ通知します。ユーザーごとのプッシュルールで、確定済みプレビューマーカーに一致させる必要があります。完全な手順については、[通知を抑えたプレビュー用の Matrix プッシュルール](/ja-JP/channels/matrix-push-rules)を参照してください。

## Bot 間ルーム

デフォルトでは、設定済みの別の OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。エージェント間の通信を意図的に許可するには、`allowBots` を使用します。

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

- `allowBots: true` は、許可されたルームおよび DM で、設定済みの別の Matrix Bot アカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルーム内でこの Bot へのメンションが表示されている場合に限り、それらのメッセージを受け入れます。DM はメンションの有無にかかわらず引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベルの設定を上書きします。
- 受け入れられた設定済み Bot のメッセージには、共有の [Bot ループ保護](/ja-JP/channels/bot-loop-protection)が適用されます。`channels.defaults.botLoopProtection` を設定し、アカウントごとに `channels.matrix.botLoopProtection`、またはルームごとに `channels.matrix.groups.<room>.botLoopProtection` で上書きします。
- OpenClaw は、自己応答ループを防ぐため、同じ Matrix ユーザー ID からのメッセージを引き続き無視します。
- Matrix にはネイティブの Bot フラグがありません。OpenClaw は「Bot が送信した」を「この OpenClaw Gateway 上で設定された別の Matrix アカウントが送信した」として扱います。

共有ルームで Bot 間通信を有効にする場合は、厳格なルーム許可リストとメンション要件を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントに `thumbnail_file` が使用され、画像プレビューも完全な添付ファイルとともに暗号化されます。暗号化されていないルームでは、通常の `thumbnail_url` が使用されます。設定は不要です。Plugin が E2EE の状態を自動的に検出します。

すべての `openclaw matrix` コマンドは、`--verbose`（完全な診断）、`--json`（機械可読な出力）、および `--account <id>`（複数アカウント構成）を受け付けます。デフォルトでは簡潔な出力になります。

### 暗号化を有効にする

```bash
openclaw matrix encryption setup
```

シークレットストレージとクロス署名を初期化し、必要に応じてルームキーのバックアップを作成してから、状態と次の手順を表示します。便利なフラグ：

- `--recovery-key <key>` 初期化前にリカバリーキーを適用します（以下の標準入力形式を推奨）
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄して新しいものを作成します（意図した場合のみ使用）

新しいアカウントでは、作成時に E2EE を有効にします。

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` は `--enable-e2ee` のエイリアスです。同等の手動設定：

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

`verify status` は、独立した 3 つの信頼シグナルを報告します（`--verbose` はすべてを表示します）。

- `Locally trusted`：このクライアントからのみ信頼されている
- `Cross-signing verified`：SDK がクロス署名による検証を報告している
- `Signed by owner`：自身の自己署名キーで署名されている（診断のみ）

`Verified by owner` が `yes` になるのは、`Cross-signing verified` が `yes` の場合のみです。ローカルの信頼または所有者署名だけでは不十分です。

`--allow-degraded-local-state` は、Matrix アカウントを先に準備せず、ベストエフォートの診断を返します。オフラインまたは部分的に設定された状態の調査に便利です。

### リカバリーキーでこのデバイスを検証する

リカバリーキーをコマンドラインで渡す代わりに、標準入力からパイプします。

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

このコマンドは 3 つの状態を報告します。

- `Recovery key accepted`：Matrix がシークレットストレージまたはデバイスの信頼に使用するキーを受け入れた。
- `Backup usable`：信頼されたリカバリー情報を使用してルームキーのバックアップを読み込める。
- `Device verified by owner`：このデバイスが Matrix のクロス署名 ID から完全に信頼されている。

リカバリーキーでバックアップ情報を解除できた場合でも、ID の完全な信頼が確立されていなければ、終了コードは 0 以外になります。その場合は、別の Matrix クライアントから自己検証を完了してください。

```bash
openclaw matrix verify self
```

`verify self` は、正常終了する前に `Cross-signing verified: yes` を待機します。待機時間を調整するには `--timeout-ms <ms>` を使用します。

キーを直接指定する形式の `openclaw matrix verify device "<recovery-key>"` も使用できますが、キーがシェル履歴に残ります。

### クロス署名を初期化または修復する

```bash
openclaw matrix verify bootstrap
```

暗号化されたアカウント向けの修復／セットアップコマンドです。次の順序で処理します。

- 可能な場合は既存のリカバリーキーを再利用して、シークレットストレージを初期化する
- クロス署名を初期化し、不足している公開キーをアップロードする
- 現在のデバイスをマークし、クロス署名する
- サーバー側のルームキーバックアップがまだ存在しない場合は作成する

ホームサーバーがクロス署名キーのアップロードに UIA を要求する場合、OpenClaw は最初に認証なしを試し、次に `m.login.dummy`、その後 `m.login.password`（`channels.matrix.password` が必要）を試します。

便利なフラグ：

- `--recovery-key-stdin`（`printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...` と組み合わせる）または `--recovery-key <key>`
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄します（意図した場合のみ。アクティブなリカバリーキーが保存されているか、`--recovery-key-stdin` で指定されている必要があります）

### ルームキーのバックアップ

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` は、サーバー側のバックアップが存在するか、およびこのデバイスで復号できるかを表示します。`backup restore` は、バックアップされたルームキーをローカルの暗号化ストアにインポートします。リカバリーキーがすでにディスク上にある場合は、`--recovery-key-stdin` を省略してください。

壊れたバックアップを新しいベースラインに置き換えるには、次を実行します（復元不能な古い履歴が失われることを許容します。現在のバックアップシークレットを読み込めない場合は、シークレットストレージも再作成できます）。

```bash
openclaw matrix verify backup reset --yes
```

以前のリカバリーキーで新しいバックアップのベースラインを意図的に解除できないようにする場合のみ、`--rotate-recovery-key` を追加します。

### 検証の一覧表示、要求、および応答

```bash
openclaw matrix verify list
```

選択したアカウントの保留中の検証要求を一覧表示します。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

このアカウントから検証要求を送信します。`--own-user` は自己検証を要求します（同じユーザーの別の Matrix クライアントでプロンプトを承認してください）。`--user-id`/`--device-id`/`--room-id` は別のユーザーを対象にします。`--own-user` は、他の対象指定フラグと組み合わせられません。

より低レベルのライフサイクル処理では、通常、別のクライアントからの受信要求を追跡する際に、次のコマンドを特定の要求 `<id>`（`verify list` および `verify request` により表示）に対して実行します。

| コマンド                                    | 目的                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 受信した要求を承認する                                           |
| `openclaw matrix verify start <id>`        | SAS フローを開始する                                                  |
| `openclaw matrix verify sas <id>`          | SAS の絵文字または数字を表示する                                     |
| `openclaw matrix verify confirm-sas <id>`  | SAS が別のクライアントに表示された内容と一致することを確認する            |
| `openclaw matrix verify mismatch-sas <id>` | 絵文字または数字が一致しない場合に SAS を拒否する              |
| `openclaw matrix verify cancel <id>`       | キャンセルする。任意の `--reason <text>` および `--code <matrix-code>` を受け付ける |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas`、および `cancel` はすべて、検証が特定のダイレクトメッセージルームに関連付けられている場合、DM のフォローアップ用ヒントとして `--user-id` および `--room-id` を受け付けます。

### 複数アカウントに関する注意事項

`--account <id>` を指定しない場合、Matrix CLI コマンドは暗黙のデフォルトアカウントを使用します。複数の名前付きアカウントがあり、`channels.matrix.defaultAccount` が指定されていない場合、コマンドは推測を拒否し、選択を求めます。名前付きアカウントで E2EE が無効または利用できない場合、エラーにはそのアカウントの設定キーが示されます（例：`channels.matrix.accounts.assistant.encryption`）。

<AccordionGroup>
  <Accordion title="起動時の動作">
    `encryption: true` の場合、`startupVerification` のデフォルトは `"if-unverified"` です。起動時に未検証のデバイスは、別の Matrix クライアントへ自己検証を要求します。重複する要求はスキップされ、クールダウンが適用されます（デフォルトは 24 時間）。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効にします。

    起動時には、現在のシークレットストレージとクロス署名 ID を再利用する、保守的な暗号化初期化処理も実行されます。初期化状態が壊れている場合、OpenClaw は `channels.matrix.password` がなくても保護された修復を試みます。ホームサーバーがパスワード UIA を要求する場合、起動処理は警告をログに記録しますが、致命的エラーにはなりません。すでに所有者署名済みのデバイスは維持されます。

    完全なアップグレード手順については、[Matrix の移行](/ja-JP/channels/matrix-migration)を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は検証ライフサイクル通知を、厳格な DM 検証ルームに `m.notice` メッセージとして投稿します。通知には、要求、準備完了（「Verify by emoji」の案内付き）、開始／完了、および利用可能な場合は SAS（絵文字／数字）の詳細が含まれます。

    別の Matrix クライアントからの受信要求は追跡され、自動的に承認されます。自己検証の場合、OpenClaw は SAS フローを自動的に開始し、絵文字による検証が利用可能になると自身の側を確認します。それでも、Matrix クライアントで絵文字を比較し、「They match」を確定する必要があります。

    検証システムの通知は、エージェントのチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="削除された、または無効な Matrix デバイス">
    `verify status` に現在のデバイスがホームサーバー上の一覧に存在しないと表示される場合は、新しい OpenClaw Matrix デバイスを作成してください。パスワードログインの場合：

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

    失敗したコマンドのアカウント ID で `assistant` を置き換えるか、デフォルトアカウントを使用する場合は `--account` を省略します。

  </Accordion>

  <Accordion title="デバイス管理">
    古い OpenClaw 管理デバイスが蓄積することがあります。次のコマンドで一覧表示し、不要なデバイスを削除します。

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="暗号化ストア">
    Matrix E2EE は、IndexedDB シムとして `fake-indexeddb` を使用し、公式の `matrix-js-sdk` Rust 暗号化パスを使用します。暗号化状態は `crypto-idb-snapshot.json` に永続化されます（ファイル権限は厳しく制限されます）。

    暗号化されたランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下に保存され、同期ストア、暗号化ストア、リカバリーキー、IDB スナップショット、スレッドバインディング、起動時の検証状態が含まれます。トークンが変更されてもアカウント ID が同じ場合、OpenClaw は既存の最適なルートを再利用するため、以前の状態は引き続き表示されます。

    古いトークンハッシュルートが 1 つだけ存在する場合は、通常のトークンローテーション継続パスである可能性があります。OpenClaw が `matrix: multiple populated token-hash storage roots detected` をログに記録した場合は、アカウントディレクトリを調べ、選択されたアクティブルートが正常であることを確認してから、古い兄弟ルートをアーカイブしてください。古いルートをすぐに削除するのではなく、`_archive/` ディレクトリへ移動することを推奨します。

  </Accordion>
</AccordionGroup>

## プロファイル管理

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

両方のオプションを 1 回の呼び出しで渡します。Matrix は `mxc://` アバター URL を直接受け入れます。`http://`/`https://` を渡すと、最初にファイルをアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl`（またはアカウントごとのオーバーライド）に保存します。

## スレッド

Matrix は、自動返信とメッセージツールによる送信の両方でネイティブスレッドをサポートします。動作は、独立した 2 つの設定で制御します。

### セッションルーティング（`sessionScope`）

`dm.sessionScope` は、Matrix の DM ルームを OpenClaw セッションにマッピングする方法を決定します。

- `"per-user"`（デフォルト）: ルーティング先の相手が同じすべての DM ルームで、1 つのセッションを共有します。
- `"per-room"`: 相手が同じ場合でも、Matrix の各 DM ルームに固有のセッションキーを割り当てます。

明示的な会話バインディングは、常に `sessionScope` より優先されます。バインドされたルームとスレッドは、選択したターゲットセッションを維持します。

### 返信のスレッド化（`threadReplies`）

`threadReplies` は、ボットが返信を投稿する場所を決定します。

- `"off"`: 返信をトップレベルに投稿します。受信したスレッド内メッセージは親セッションに残ります。
- `"inbound"`: 受信メッセージがすでにスレッド内にあった場合にのみ、そのスレッド内で返信します。
- `"always"`: トリガーとなったメッセージをルートとするスレッド内で返信します。その会話は、最初のトリガー以降、対応するスレッドスコープのセッションを通じてルーティングされます。

`dm.threadReplies` は、DM に限りこの設定をオーバーライドします。たとえば、ルームのスレッドを分離したまま、DM をフラットに保つことができます。

### スレッドの継承とスラッシュコマンド

- 受信したスレッド内メッセージには、追加のエージェントコンテキストとしてスレッドのルートメッセージが含まれます。
- メッセージツールによる送信では、明示的な `threadId` が指定されていない限り、同じルーム（または同じ DM ユーザーターゲット）を対象とすると、現在の Matrix スレッドを自動的に継承します。
- DM ユーザーターゲットの再利用は、現在のセッションメタデータによって、同じ Matrix アカウント上の同じ DM 相手であることが証明された場合にのみ適用されます。それ以外の場合、OpenClaw は通常のユーザースコープのルーティングにフォールバックします。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドにバインドされた `/acp spawn` は、すべて Matrix のルームと DM で機能します。
- `threadBindings.spawnSessions` が有効な場合、トップレベルの `/focus` は新しい Matrix スレッドを作成し、ターゲットセッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、そのスレッドをその場でバインドします。

同じ共有セッション上で Matrix の DM ルームが別の DM ルームと衝突していることを OpenClaw が検出すると、`/focus` の回避策を案内し、`dm.sessionScope` の変更を提案する `m.notice` を一度だけ投稿します。この通知は、スレッドバインディングが有効な場合にのみ表示されます。

## ACP 会話バインディング

Matrix のルーム、DM、既存の Matrix スレッドは、チャット画面を変更せずに永続的な ACP ワークスペースとして使用できます。

オペレーター向けの簡単な手順:

- 引き続き使用する Matrix の DM、ルーム、または既存のスレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの DM またはルームでは、現在の DM/ルームがチャット画面として維持され、以降のメッセージは生成された ACP セッションにルーティングされます。
- 既存のスレッド内では、`--bind here` によって現在のスレッドがその場でバインドされます。
- `/new` と `/reset` は、バインドされた同じ ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

`--bind here` は子 Matrix スレッドを作成しません。`threadBindings.spawnSessions` は、OpenClaw が子スレッドを作成またはバインドする必要がある `/acp spawn --thread auto|here` を制御します。

### スレッドバインディングの設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャンネルごとのオーバーライドをサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: サブエージェントと ACP の両方のスレッド生成を制御します。
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: サブエージェントのみ、または ACP のみの生成に対する、より限定的なオーバーライドです。
- `threadBindings.defaultSpawnContext`

Matrix のスレッドバインド済みセッションの生成は、デフォルトで有効です。トップレベルの `/focus` と `/acp spawn --thread auto|here` が Matrix スレッドを作成またはバインドしないようにするには、`threadBindings.spawnSessions: false` を設定します。ネイティブのサブエージェントスレッド生成で親のトランスクリプトをフォークしないようにするには、`threadBindings.defaultSpawnContext: "isolated"` を設定します。

## リアクション

Matrix は、送信リアクション、受信リアクション通知、確認リアクションをサポートしています。

送信リアクションツールは `channels.matrix.actions.reactions` によって制限されます。

- `react` は Matrix イベントにリアクションを追加します。
- `reactions` は Matrix イベントの現在のリアクション概要を一覧表示します。
- `emoji=""` は、そのイベントに対するボット自身のリアクションを削除します。
- `remove: true` は、ボットによる指定された絵文字リアクションのみを削除します。

**解決順序**（最初に定義された値が優先されます）：

| 設定                 | 順序                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | アカウントごと -> チャンネル -> `messages.ackReaction` -> エージェント ID の絵文字へのフォールバック   |
| `ackReactionScope`      | アカウントごと -> チャンネル -> `messages.ackReactionScope` -> デフォルト `"group-mentions"` |
| `reactionNotifications` | アカウントごと -> チャンネル -> デフォルト `"own"`                                           |

`reactionNotifications: "own"` は、ボットが作成した Matrix メッセージを対象とする追加済みの `m.reaction` イベントを転送します。`"off"` はリアクションのシステムイベントを無効にします。リアクションの削除からシステムイベントが合成されることはありません。Matrix では、これらは独立した `m.reaction` の削除ではなく、編集取消として扱われます。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、ルームメッセージがエージェントをトリガーしたときに、最近のルームメッセージを `InboundHistory` としていくつ含めるかを制御します。`messages.groupChat.historyLimit` にフォールバックし、両方が未設定の場合の実効デフォルトは `0`（無効）です。
- Matrix のルーム履歴はルーム内に限定されます。DM では引き続き通常のセッション履歴が使用されます。
- ルーム履歴は保留中のメッセージのみを対象とします。OpenClaw は、まだ応答をトリガーしていないルームメッセージをバッファリングし、メンションなどのトリガーが届いた時点でその範囲のスナップショットを取得します。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメインの受信本文に残ります。
- 同じ Matrix イベントを再試行する場合、新しいルームメッセージに合わせて履歴が先へずれることなく、元の履歴スナップショットが再利用されます。

## コンテキストの可視性

Matrix は、取得した返信テキスト、スレッドルート、保留中の履歴など、補足的なルームコンテキストに対する共通の `contextVisibility` 制御をサポートしています。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信時のまま保持されます。
- `contextVisibility: "allowlist"` は、補足コンテキストをフィルタリングし、アクティブなルーム／ユーザーの許可リストチェックで許可された送信者のものだけを残します。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的に引用された返信を 1 件だけ保持します。

これは補足コンテキストの可視性にのみ影響し、受信メッセージ自体が応答をトリガーできるかどうかには影響しません。トリガーの認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、および DM ポリシー設定によって決まります。

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

ルームの動作を維持したまま DM を完全に無効にするには、`dm.enabled: false` を設定します。

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

メンションによる制限と許可リストの動作については、[グループ](/ja-JP/channels/groups)を参照してください。

Matrix DM のペアリング例：

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前にメッセージを送り続けた場合、OpenClaw は同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに、短いクールダウン後にリマインダーの返信を送ることがあります。

共通の DM ペアリングフローとストレージ構成については、[ペアリング](/ja-JP/channels/pairing)を参照してください。

## ダイレクトルームの修復

ダイレクトメッセージの状態にずれが生じると、OpenClaw では、現在の DM ではなく古い単独ルームを指す古い `m.direct` マッピングが残ることがあります。ピアの現在のマッピングを確認します：

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復します：

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

複数アカウント構成では、どちらのコマンドも `--account <id>` を受け付けます。修復フローは次のとおりです：

- `m.direct` にすでにマッピングされている厳密な 1:1 DM を優先する
- そのユーザーと現在参加中の厳密な 1:1 DM があれば、それを代わりに使用する
- 正常な DM が存在しない場合は、新しいダイレクトルームを作成して `m.direct` を書き換える

古いルームは自動的には削除されません。正常な DM を選択してマッピングを更新することで、今後の Matrix 送信、検証通知、その他のダイレクトメッセージフローが正しいルームを対象とするようにします。

## 実行承認

Matrix はネイティブの承認クライアントとして機能できます。`channels.matrix.execApprovals`（アカウントごとに上書きする場合は `channels.matrix.accounts.<account>.execApprovals`）で設定します：

- `enabled`：Matrix ネイティブのプロンプトを通じて承認を配信します。未設定または `"auto"` の場合、少なくとも 1 人の承認者を解決できると自動的に有効になります。明示的に無効にするには `false` を設定します。
- `approvers`：実行リクエストを承認できる Matrix ユーザー ID（`@owner:example.org`）です。`channels.matrix.dm.allowFrom` にフォールバックします。
- `target`：プロンプトの送信先です。`"dm"`（デフォルト）は承認者の DM に送信し、`"channel"` は送信元のルームまたは DM に送信し、`"both"` は両方に送信します。
- `agentFilter` / `sessionFilter`：Matrix 配信をトリガーするエージェント／セッションを指定する任意の許可リストです。

認可方法は承認の種類によって若干異なります：

- **実行承認**では `execApprovals.approvers` を使用し、`dm.allowFrom` にフォールバックします。
- **Plugin 承認**では、`dm.allowFrom` のみを通じて認可します。

どちらの種類でも、Matrix のリアクションショートカットとメッセージ更新を共有します。承認者には、メインの承認メッセージにリアクションショートカットが表示されます：

- ✅ 1回許可
- ❌ 拒否
- ♾️ 常に許可（有効な実行ポリシーで許可されている場合）

フォールバックのスラッシュコマンド: `/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

解決済みの承認者のみが承認または拒否できます。実行承認のチャンネル配信にはコマンドテキストが含まれるため、信頼できるルームでのみ `channel` または `both` を有効にしてください。

関連項目: [実行承認](/ja-JP/tools/exec-approvals)。

## スラッシュコマンド

スラッシュコマンド（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` など）は、DM で直接機能します。ルームでは、OpenClaw はボット自身の Matrix メンションを前置したコマンドも認識するため、`@bot:server /new` はカスタムのメンション正規表現なしでコマンドパスをトリガーします。これにより、ユーザーがコマンドを入力する前にボットをタブ補完した際に Element や同様のクライアントが送信する、ルーム形式の `@mention /command` 投稿にもボットが応答できます。

認可ルールは引き続き適用されます。コマンド送信者は、通常のメッセージと同じ DM またはルームの許可リスト／所有者ポリシーを満たす必要があります。

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
- `groups.<room>.account` を使用すると、継承されたルームエントリを特定のアカウントに限定できます。`account` のないエントリはアカウント間で共有されます。デフォルトアカウントがトップレベルで設定されている場合も、`account: "default"` は引き続き機能します。

**デフォルトアカウントの選択:**

- 暗黙的なルーティング、プローブ、CLI コマンドで優先する名前付きアカウントを選択するには、`defaultAccount` を設定します。
- 複数のアカウントがあり、そのうち1つの名前が文字どおり `default` である場合、`defaultAccount` が未設定でも OpenClaw はそのアカウントを暗黙的に使用します。
- 複数の名前付きアカウントがあり、デフォルトが選択されていない場合、CLI コマンドは推測を拒否します。`defaultAccount` を設定するか、`--account <id>` を渡してください。
- トップレベルの `channels.matrix.*` ブロックが暗黙的な `default` アカウントとして扱われるのは、その認証が完備されている場合（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）のみです。キャッシュ済みの資格情報で認証が満たされると、名前付きアカウントは `homeserver` + `userId` から引き続き検出できます。

**昇格:**

- 修復またはセットアップ中に OpenClaw が単一アカウント設定をマルチアカウント設定へ昇格するとき、既存の名前付きアカウントがある場合、または `defaultAccount` がすでにそのアカウントを指している場合は、それを保持します。昇格されたアカウントに移動するのは Matrix の認証／ブートストラップキーのみで、共有の配信ポリシーキーはトップレベルに残ります。

共有のマルチアカウントパターンについては、[設定リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## プライベート／LAN ホームサーバー

デフォルトでは、OpenClaw は SSRF 対策のため、アカウントごとに明示的に許可しない限り、プライベート／内部 Matrix ホームサーバーをブロックします。

ホームサーバーが localhost、LAN／Tailscale IP、または内部ホスト名で稼働している場合は、そのアカウントで `network.dangerouslyAllowPrivateNetwork` を有効にしてください。

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

このオプトインで許可されるのは、信頼できるプライベート／内部ターゲットのみです。`http://matrix.example.org:8008` のような公開平文ホームサーバーは引き続きブロックされます。可能な限り `https://` を使用してください。

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

名前付きアカウントでは、`channels.matrix.accounts.<id>.proxy` を使用してトップレベルのデフォルトを上書きできます。OpenClaw は、実行時の Matrix トラフィックとアカウント状態プローブの両方に同じプロキシ設定を使用します。

## ターゲット解決

OpenClaw がルームまたはユーザーターゲットを要求するすべての箇所で、Matrix は次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

Matrix のルーム ID は大文字と小文字を区別します。明示的な配信ターゲット、Cron ジョブ、バインディング、または許可リストを設定する際は、Matrix のルーム ID と正確に同じ大文字・小文字を使用してください。OpenClaw は保存用の内部セッションキーを正規化して保持するため、その小文字化されたキーは Matrix 配信 ID の信頼できる情報源ではありません。

ライブディレクトリ検索では、ログイン済みの Matrix アカウントを使用します。

- ユーザー検索では、そのホームサーバー上の Matrix ユーザーディレクトリに問い合わせます。
- ルーム検索では、明示的なルーム ID とエイリアスを直接受け付けます。参加済みルームの名前検索はベストエフォートであり、`dangerouslyAllowNameMatching: true` が設定されている場合にのみ、実行時のルーム許可リストに適用されます。
- ルーム名を ID またはエイリアスに解決できない場合、実行時の許可リスト解決では無視されます。

## 設定リファレンス

許可リスト形式のユーザーフィールド（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）は、完全な Matrix ユーザー ID（最も安全）を受け付けます。ID でないエントリはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` が設定されている場合、Matrix ディレクトリの表示名と完全一致するエントリは、起動時およびモニター実行中に許可リストが変更されるたびに解決されます。解決できないエントリは実行時に無視されます。

ルーム許可リストキー（`groups`、旧 `rooms`）には、ルーム ID またはエイリアスを使用してください。単純なルーム名キーはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` を使用すると、参加済みルーム名に対するベストエフォート検索が復元されます。

### アカウントと接続

- `enabled`: チャンネルを有効または無効にします。
- `name`: アカウントの任意の表示ラベル。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合に優先するアカウント ID。
- `accounts`: アカウントごとの名前付き上書き。トップレベルの `channels.matrix` 値はデフォルトとして継承されます。
- `homeserver`: ホームサーバー URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このアカウントによる `localhost`、LAN／Tailscale IP、または内部ホスト名への接続を許可します。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。アカウントごとの上書きに対応します。
- `userId`: 完全な Matrix ユーザー ID（`@bot:example.org`）。
- `accessToken`: トークンベース認証用のアクセストークン。env／file／exec プロバイダー全体で、平文および SecretRef 値に対応します（[シークレット管理](/ja-JP/gateway/secrets)）。
- `password`: パスワードベースのログイン用パスワード。平文および SecretRef 値に対応します。
- `deviceId`: 明示的な Matrix デバイス ID。
- `deviceName`: パスワードログイン時に使用されるデバイス表示名。
- `avatarUrl`: プロファイル同期および `profile set` 更新用に保存される自己アバター URL。
- `initialSyncLimit`: 起動時の同期で取得するイベントの最大数。

### 暗号化

- `encryption`: E2EE を有効にします。デフォルト: `false`。
- `startupVerification`: `"if-unverified"`（E2EE が有効な場合のデフォルト）または `"off"`。このデバイスが未検証の場合、起動時に自己検証を自動要求します。
- `startupVerificationCooldownHours`: 次回の起動時自動要求までのクールダウン。デフォルト: `24`。

### アクセスとポリシー

- `groupPolicy`: `"open"`、`"allowlist"`、または `"disabled"`。デフォルト: `"allowlist"`。
- `groupAllowFrom`: ルームトラフィック用ユーザー ID の許可リスト。
- `mentionPatterns`: ルームメンション用のスコープ付き正規表現パターン。`{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }` を持つオブジェクト。設定された `agents.list[].groupChat.mentionPatterns` をルームごとに適用するかどうかを制御します。
- `dm.enabled`: `false` の場合、すべての DM を無視します。デフォルト: `true`。
- `dm.policy`: `"pairing"`（デフォルト）、`"allowlist"`、`"open"`、または `"disabled"`。ボットが参加し、ルームを DM として分類した後に適用されます。招待処理には影響しません。
- `dm.allowFrom`: DM トラフィック用ユーザー ID の許可リスト。
- `dm.sessionScope`: `"per-user"`（デフォルト）または `"per-room"`。
- `dm.threadReplies`: 返信のスレッド化に対する DM 専用の上書き（`"off"`、`"inbound"`、`"always"`）。
- `allowBots`: 設定済みの他の Matrix ボットアカウントからのメッセージを受け付けます（`true` または `"mentions"`）。
- `allowlistOnly`: `true` の場合、すべての有効な DM ポリシー（`"disabled"` を除く）と `"open"` グループポリシーを `"allowlist"` に強制します。`"disabled"` ポリシーは変更しません。
- `dangerouslyAllowNameMatching`: `true` の場合、ユーザー許可リストエントリに対する Matrix 表示名ディレクトリ検索と、ルーム許可リストキーに対する参加済みルーム名検索を許可します。完全な `@user:server` ID、およびルーム ID またはエイリアスを優先してください。
- `autoJoin`: `"always"`、`"allowlist"`、または `"off"`。デフォルト: `"off"`。DM 形式の招待を含む、すべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `"allowlist"` の場合に許可されるルーム／エイリアス。エイリアスエントリは、招待されたルームが主張する状態ではなく、ホームサーバーに対して解決されます。
- `contextVisibility`: 補足コンテキストの可視性（デフォルトは `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 返信動作

- `replyToMode`: `"off"`（デフォルト）、`"first"`、`"all"`、または `"batched"`。
- `threadReplies`: `"off"`（明示的に設定しない限り、トップレベルのデフォルトは `"inbound"` に解決されます）、`"inbound"`、または `"always"`。
- `threadBindings`: スレッドに紐づくセッションのルーティングとライフサイクルに対するチャンネル別のオーバーライド。
- `streaming`: ネストされたオブジェクト `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`。`mode` は `"off"`（デフォルト）、`"partial"`、`"quiet"`、または `"progress"`。従来のスカラー／ブール値表記は `openclaw doctor --fix` を介して移行されます。
- `streaming.block.enabled`: `true` の場合、完了したアシスタントブロックは個別の進捗メッセージとして保持されます。デフォルト: `false`。
- `markdown`: 送信テキスト用のオプションの Markdown レンダリング設定。
- `responsePrefix`: 送信返信の先頭に付加するオプションの文字列。
- `textChunkLimit`: `streaming.chunkMode: "length"` の場合の、送信チャンクの文字数。デフォルト: `4000`。
- `streaming.chunkMode`: `"length"`（デフォルト、文字数で分割）または `"newline"`（行の境界で分割）。
- `historyLimit`: ルームメッセージがエージェントをトリガーしたときに、`InboundHistory` として含める直近のルームメッセージ数。`messages.groupChat.historyLimit` にフォールバックします。実効デフォルトは `0`（無効）です。
- `mediaMaxMb`: 送信および受信処理におけるメディアサイズの上限（MB）。デフォルト: `20`。

### リアクション設定

- `ackReaction`: このチャンネル／アカウントの確認リアクションのオーバーライド。
- `ackReactionScope`: スコープのオーバーライド（デフォルトは `"group-mentions"`、ほかに `"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`: 受信リアクションの通知モード（デフォルトは `"own"`、または `"off"`）。

### ツールとルーム別オーバーライド

- `actions`: アクション別のツール制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`: ルーム別のポリシーマップ。セッション識別には、解決後の安定したルーム ID が使用されます。（`rooms` は従来のエイリアスです。）
  - `groups.<room>.account`: 継承されたルームエントリを特定のアカウントに限定します。
  - `groups.<room>.enabled`: ルーム別の切り替え。`false` の場合、そのルームはマップに含まれていないものとして無視されます。
  - `groups.<room>.requireMention`: チャンネルレベルのメンション要件に対するルーム別のオーバーライド。
  - `groups.<room>.allowBots`: チャンネルレベル設定に対するルーム別のオーバーライド（`true` または `"mentions"`）。
  - `groups.<room>.botLoopProtection`: ボット間ループ保護の上限に対するルーム別のオーバーライド。
  - `groups.<room>.users`: ルーム別の送信者許可リスト。
  - `groups.<room>.tools`: ルーム別のツール許可／拒否のオーバーライド。
  - `groups.<room>.autoReply`: ルーム別のメンション制御のオーバーライド。`true` はそのルームのメンション要件を無効にし、`false` は再び強制的に有効にします。
  - `groups.<room>.skills`: ルーム別のスキルフィルター。
  - `groups.<room>.systemPrompt`: ルーム別のシステムプロンプトのスニペット。

### 実行承認設定

- `execApprovals.enabled`: Matrix ネイティブのプロンプトを介して実行承認を配信します。
- `execApprovals.approvers`: 承認を許可された Matrix ユーザー ID。`dm.allowFrom` にフォールバックします。
- `execApprovals.target`: `"dm"`（デフォルト）、`"channel"`、または `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 配信用のオプションのエージェント／セッション許可リスト。

## 関連項目

- [チャンネル概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM の認証とペアリングのフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
