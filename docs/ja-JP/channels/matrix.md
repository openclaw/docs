---
read_when:
    - OpenClaw で Matrix を設定する
    - Matrix E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、設定例
title: マトリックス
x-i18n:
    generated_at: "2026-07-01T12:47:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix は OpenClaw 用にダウンロード可能なチャンネルプラグインです。
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## インストール

チャンネルを設定する前に、ClawHub から Matrix をインストールします。

```bash
openclaw plugins install @openclaw/matrix
```

裸のプラグイン指定は、まず ClawHub を試し、その後 npm にフォールバックします。レジストリソースを強制するには、`openclaw plugins install clawhub:@openclaw/matrix` または `openclaw plugins install npm:@openclaw/matrix` を使用します。

ローカルチェックアウトからインストールする場合:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` はプラグインを登録して有効化するため、別途 `openclaw plugins enable matrix` を実行する必要はありません。ただし、下記のチャンネル設定を行うまではプラグインは何もしません。一般的なプラグインの動作とインストールルールについては [Plugin](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. ホームサーバーに Matrix アカウントを作成します。
2. `channels.matrix` を `homeserver` + `accessToken`、または `homeserver` + `userId` + `password` のいずれかで設定します。
3. Gateway を再起動します。
4. bot と DM を開始するか、ルームに招待します（[自動参加](#auto-join) を参照 - 新しい招待は `autoJoin` が許可した場合にのみ反映されます）。

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

`channels.matrix.autoJoin` のデフォルトは `off` です。デフォルトでは、手動で参加するまで、bot は新しい招待からの新規ルームや DM に現れません。

OpenClaw は招待時点では、招待されたルームが DM なのかグループなのか判別できないため、DM 風の招待も含め、すべての招待はまず `autoJoin` を通ります。`dm.policy` は、bot が参加し、ルームが分類された後にのみ適用されます。

<Warning>
bot が受け入れる招待を制限するには `autoJoin: "allowlist"` と `autoJoinAllowlist` を設定し、すべての招待を受け入れるには `autoJoin: "always"` を設定します。

`autoJoinAllowlist` は安定したターゲットのみを受け付けます: `!roomId:server`、`#alias:server`、または `*`。通常のルーム名は拒否されます。エイリアス項目は、招待されたルームが主張する状態ではなく、ホームサーバーに対して解決されます。
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

### 許可リストのターゲット形式

DM とルームの許可リストには、安定した ID を設定するのが最適です。

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）: `@user:server` を使用します。表示名は変更可能なため、デフォルトでは無視されます。表示名の項目との互換性が明示的に必要な場合にのみ、`dangerouslyAllowNameMatching: true` を設定してください。
- ルーム許可リストキー（`groups`、従来の `rooms`）: `!room:server` または `#alias:server` を使用します。通常のルーム名はデフォルトでは無視されます。参加済みルーム名の検索との互換性が明示的に必要な場合にのみ、`dangerouslyAllowNameMatching: true` を設定してください。
- 招待許可リスト（`autoJoinAllowlist`）: `!room:server`、`#alias:server`、または `*` を使用します。通常のルーム名は拒否されます。

### アカウント ID の正規化

ウィザードはわかりやすい名前を正規化されたアカウント ID に変換します。たとえば、`Ops Bot` は `ops-bot` になります。スコープ付き環境変数名では、2 つのアカウントが衝突しないように句読点がエスケープされます。`-` → `_X2D_` となるため、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` にマッピングされます。

### キャッシュされた認証情報

Matrix はキャッシュされた認証情報を `~/.openclaw/credentials/matrix/` 配下に保存します。

- デフォルトアカウント: `credentials.json`
- 名前付きアカウント: `credentials-<account>.json`

そこにキャッシュされた認証情報が存在する場合、アクセストークンが設定ファイルにない場合でも、OpenClaw は Matrix が設定済みであると扱います。これはセットアップ、`openclaw doctor`、チャンネルステータスのプローブをカバーします。

### 環境変数

同等の設定キーが設定されていない場合に使用されます。デフォルトアカウントはプレフィックスなしの名前を使用し、名前付きアカウントはサフィックスの前にアカウント ID を挿入します。

| デフォルトアカウント | 名前付きアカウント（`<ID>` は正規化されたアカウント ID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

アカウント `ops` の場合、名前は `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` などになります。リカバリキーの環境変数は、`--recovery-key-stdin` 経由でキーをパイプ入力した場合に、リカバリ対応の CLI フロー（`verify backup restore`、`verify device`、`verify bootstrap`）によって読み取られます。

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

Matrix の返信ストリーミングはオプトインです。`streaming` は OpenClaw が進行中のアシスタント返信をどのように配信するかを制御し、`blockStreaming` は完了した各ブロックをそれぞれ独立した Matrix メッセージとして保持するかどうかを制御します。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

ライブ回答プレビューを維持しつつ、一時的なツール/進捗行を非表示にするには、オブジェクト形式を使用します。

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

完全なオブジェクト形式では `{ mode, preview, progress }` を受け付けます。

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

- `progress.label`: カスタムラベル、設定済みまたは組み込みラベルから選択するための `"auto"` または未設定、あるいはラベル行を非表示にする `false`。
- `progress.labels`: `label` が `"auto"` または未設定の場合にのみ使用される候補ラベル。組み込みのデフォルトを使う場合は未設定のままにします。
- `progress.maxLines`: 下書きに保持されるローリング進捗行の最大数。この上限を超えると、古い行が切り詰められます。
- `progress.maxLineChars`: 切り詰め前のコンパクトな進捗行あたりの最大文字数。
- `progress.toolProgress`: `true`（デフォルト）の場合、ライブのツール/進捗アクティビティが下書きに表示されます。

| `streaming`       | 動作                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（デフォルト） | 完全な返信を待って、一度だけ送信します。`true` ↔ `"partial"`、`false` ↔ `"off"`。                                                                                        |
| `"partial"`       | モデルが現在のブロックを書いている間、通常のテキストメッセージ 1 件をその場で編集します。標準の Matrix クライアントは、最終編集ではなく最初のプレビューで通知する場合があります。              |
| `"quiet"`         | `"partial"` と同じですが、メッセージは通知しない notice になります。受信者は、ユーザーごとのプッシュルールが確定後の編集に一致した場合にのみ通知を受け取ります（下記参照）。 |
| `"progress"`      | 進捗下書きを使用して、個別のコンパクトな進捗行を送信します。                                                                                                     |

`blockStreaming` は `streaming` とは独立しています。

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（デフォルト）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 現在のブロックのライブ下書き、完了したブロックはメッセージとして保持 | 現在のブロックのライブ下書き、その場で確定 |
| `"off"`                 | 完了したブロックごとに通知ありの Matrix メッセージ 1 件                     | 完全な返信に対して通知ありの Matrix メッセージ 1 件      |

注:

- プレビューが Matrix のイベントごとのサイズ上限を超えた場合、OpenClaw はプレビューストリーミングを停止し、最終版のみの配信にフォールバックします。
- メディア返信は常に通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClaw は最終メディア返信を送信する前にそれを redaction します。
- Matrix のプレビューストリーミングが有効な場合、ツール進捗のプレビュー更新はデフォルトで有効です。回答テキストのプレビュー編集は維持しつつ、ツール進捗を通常の配信パスに残すには、`streaming.preview.toolProgress: false` を設定します。
- プレビュー編集は追加の Matrix API 呼び出しを消費します。最も保守的なレート制限プロファイルにしたい場合は、`streaming: "off"` のままにしてください。

## 音声メッセージ

受信した Matrix の音声メモは、ルームのメンションゲートの前に文字起こしされます。これにより、bot 名を含む音声メモが `requireMention: true` のルームでエージェントを起動でき、エージェントには音声添付ファイルのプレースホルダーだけでなく文字起こしが渡されます。

Matrix は、`tools.media.audio` 配下に設定された共有音声メディアプロバイダー（OpenAI `gpt-4o-mini-transcribe` など）を使用します。プロバイダーのセットアップと制限については、[メディアツール概要](/ja-JP/tools/media-overview) を参照してください。

動作の詳細:

- `m.audio` イベントと、`audio/*` MIME type を持つ `m.file` イベントが対象です。
- 暗号化されたルームでは、OpenClaw は文字起こしの前に既存の Matrix メディア経路を通じて添付ファイルを復号します。
- トランスクリプトは、エージェントプロンプト内で機械生成かつ信頼されていないものとしてマークされます。
- 添付ファイルはすでに文字起こし済みとしてマークされるため、下流のメディアツールが同じボイスメモを再度文字起こしすることはありません。
- 音声文字起こしをグローバルに無効化するには、`tools.media.audio.enabled: false` を設定します。

## 承認メタデータ

Matrix ネイティブの承認プロンプトは通常の `m.room.message` イベントであり、`com.openclaw.approval` の下に OpenClaw 固有のカスタムイベント内容を持ちます。Matrix はカスタムイベント内容キーを許可しているため、標準クライアントは引き続きテキスト本文をレンダリングし、OpenClaw 対応クライアントは構造化された承認 ID、種類、状態、利用可能な判断、exec/plugin の詳細を読み取れます。

承認プロンプトが 1 つの Matrix イベントには長すぎる場合、OpenClaw は表示テキストをチャンク化し、最初のチャンクにのみ `com.openclaw.approval` を添付します。許可/拒否の判断に対するリアクションはその最初のイベントに関連付けられるため、長いプロンプトでも単一イベントのプロンプトと同じ承認対象を維持します。

### 静かな確定済みプレビュー向けセルフホスト push rules

`streaming: "quiet"` は、ブロックまたはターンが確定されたときにのみ受信者へ通知します - ユーザーごとの push rule が確定済みプレビューマーカーに一致する必要があります。完全な手順（受信者トークン、pusher チェック、ルールインストール、homeserver ごとのメモ）については、[静かなプレビュー向け Matrix push rules](/ja-JP/channels/matrix-push-rules) を参照してください。

## Bot 間ルーム

デフォルトでは、他の構成済み OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。

エージェント間 Matrix トラフィックを意図的に使いたい場合は、`allowBots` を使用します。

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

- `allowBots: true` は、許可されたルームと DM 内で、他の構成済み Matrix bot アカウントからのメッセージを受け付けます。
- `allowBots: "mentions"` は、ルーム内でこの bot に見える形でメンションしている場合にのみ、それらのメッセージを受け付けます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベルの設定を上書きします。
- 受け付けられた構成済み bot メッセージは、共有の [bot ループ保護](/ja-JP/channels/bot-loop-protection) を使用します。`channels.defaults.botLoopProtection` を構成し、1 つのルームで異なる予算が必要な場合は `channels.matrix.botLoopProtection` または `channels.matrix.groups.<room>.botLoopProtection` で上書きします。
- OpenClaw は自己返信ループを避けるため、同じ Matrix ユーザー ID からのメッセージは引き続き無視します。
- Matrix はここでネイティブの bot フラグを公開しません。OpenClaw は「bot が作成した」を「この OpenClaw gateway 上の別の構成済み Matrix アカウントによって送信された」として扱います。

共有ルームで bot 間トラフィックを有効化する場合は、厳格なルーム許可リストとメンション要件を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルとともに暗号化されます。暗号化されていないルームでは、引き続きプレーンな `thumbnail_url` を使用します。構成は不要です - plugin が E2EE 状態を自動的に検出します。

すべての `openclaw matrix` コマンドは、`--verbose`（完全な診断）、`--json`（機械可読出力）、`--account <id>`（マルチアカウント構成）を受け付けます。出力はデフォルトで簡潔で、内部 SDK ログは静かです。以下の例は標準形を示しています。必要に応じてフラグを追加してください。

### 暗号化を有効化する

```bash
openclaw matrix encryption setup
```

シークレットストレージとクロス署名をブートストラップし、必要に応じてルームキーのバックアップを作成してから、状態と次の手順を出力します。便利なフラグ:

- `--recovery-key <key>` ブートストラップ前にリカバリーキーを適用します（下記で文書化されている stdin 形式を推奨）
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄して新しいものを作成します（意図している場合のみ使用）

新しいアカウントでは、作成時に E2EE を有効化します。

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` は `--enable-e2ee` のエイリアスです。

手動構成の同等例:

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

`verify status` は 3 つの独立した信頼シグナルを報告します（`--verbose` ではそれらすべてが表示されます）。

- `Locally trusted`: このクライアントでのみ信頼されています
- `Cross-signing verified`: SDK がクロス署名による検証を報告しています
- `Signed by owner`: 自分の自己署名キーで署名されています（診断専用）

`Verified by owner` は、`Cross-signing verified` が `yes` の場合にのみ `yes` になります。ローカル信頼または所有者署名だけでは不十分です。

`--allow-degraded-local-state` は、先に Matrix アカウントを準備せずにベストエフォートの診断を返します。オフラインまたは部分的に構成されたプローブに便利です。

### リカバリーキーでこのデバイスを検証する

リカバリーキーは機密情報です - コマンドラインで渡すのではなく stdin 経由でパイプしてください。`MATRIX_RECOVERY_KEY`（または名前付きアカウントの場合は `MATRIX_<ID>_RECOVERY_KEY`）を設定します。

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

このコマンドは 3 つの状態を報告します。

- `Recovery key accepted`: Matrix がシークレットストレージまたはデバイス信頼のためにキーを受け付けました。
- `Backup usable`: 信頼済みのリカバリー素材でルームキーのバックアップを読み込めます。
- `Device verified by owner`: このデバイスには完全な Matrix クロス署名 ID の信頼があります。

リカバリーキーがバックアップ素材をアンロックした場合でも、完全な ID 信頼が未完了の場合は非ゼロで終了します。その場合は、別の Matrix クライアントから自己検証を完了します。

```bash
openclaw matrix verify self
```

`verify self` は、正常に終了する前に `Cross-signing verified: yes` を待ちます。待機時間を調整するには `--timeout-ms <ms>` を使用します。

リテラルキー形式の `openclaw matrix verify device "<recovery-key>"` も受け付けられますが、キーはシェル履歴に残ります。

### クロス署名をブートストラップまたは修復する

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` は、暗号化されたアカウント向けの修復およびセットアップコマンドです。順番に、次を実行します。

- 可能な場合は既存のリカバリーキーを再利用してシークレットストレージをブートストラップします
- クロス署名をブートストラップし、不足している公開鍵をアップロードします
- 現在のデバイスをマークし、クロス署名します
- サーバー側のルームキーバックアップがまだ存在しない場合は作成します

homeserver がクロス署名キーのアップロードに UIA を要求する場合、OpenClaw はまず認証なしを試し、次に `m.login.dummy`、次に `m.login.password` を試します（`channels.matrix.password` が必要）。

便利なフラグ:

- `--recovery-key-stdin`（`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` と組み合わせる）または `--recovery-key <key>`
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄します（意図している場合のみ。アクティブなリカバリーキーが保存済みであるか、`--recovery-key-stdin` で指定されている必要があります）

### ルームキーのバックアップ

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` は、サーバー側バックアップが存在するか、およびこのデバイスがそれを復号できるかを示します。`backup restore` は、バックアップ済みのルームキーをローカル crypto store にインポートします。リカバリーキーがすでにディスク上にある場合は、`--recovery-key-stdin` を省略できます。

壊れたバックアップを新しいベースラインで置き換えるには（回復不能な古い履歴を失うことを受け入れます。現在のバックアップシークレットを読み込めない場合は、シークレットストレージも再作成できます）。

```bash
openclaw matrix verify backup reset --yes
```

以前のリカバリーキーで新しいバックアップベースラインをアンロックできないように意図的にしたい場合にのみ、`--rotate-recovery-key` を追加します。

### 検証の一覧表示、リクエスト、応答

```bash
openclaw matrix verify list
```

選択されたアカウントの保留中の検証リクエストを一覧表示します。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

この OpenClaw アカウントから検証リクエストを送信します。`--own-user` は自己検証をリクエストします（同じユーザーの別の Matrix クライアントでプロンプトを受け入れます）。`--user-id`/`--device-id`/`--room-id` は他のユーザーを対象にします。`--own-user` は他の対象指定フラグと組み合わせることはできません。

より低レベルのライフサイクル処理では、通常、別のクライアントからの受信リクエストを追跡している間に、これらのコマンドが特定のリクエスト `<id>`（`verify list` と `verify request` によって出力される）に作用します。

| コマンド                                   | 目的                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 受信リクエストを受け入れる                                          |
| `openclaw matrix verify start <id>`        | SAS フローを開始する                                                |
| `openclaw matrix verify sas <id>`          | SAS 絵文字または小数を出力する                                      |
| `openclaw matrix verify confirm-sas <id>`  | SAS が他のクライアントに表示されているものと一致することを確認する  |
| `openclaw matrix verify mismatch-sas <id>` | 絵文字または小数が一致しない場合に SAS を拒否する                   |
| `openclaw matrix verify cancel <id>`       | キャンセルする。任意の `--reason <text>` と `--code <matrix-code>` を受け取る |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas`、`cancel` はすべて、検証が特定のダイレクトメッセージルームに関連付けられている場合の DM フォローアップヒントとして、`--user-id` と `--room-id` を受け付けます。

### マルチアカウントのメモ

`--account <id>` なしの場合、Matrix CLI コマンドは暗黙のデフォルトアカウントを使用します。複数の名前付きアカウントがあり、`channels.matrix.defaultAccount` を設定していない場合、推測を拒否して選択を求めます。名前付きアカウントで E2EE が無効または利用できない場合、エラーはそのアカウントの構成キーを指します。例: `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="起動時の動作">
    `encryption: true` の場合、`startupVerification` のデフォルトは `"if-unverified"` です。起動時に未検証のデバイスは別の Matrix クライアントで自己検証をリクエストし、重複をスキップし、クールダウン（デフォルトでは 24 時間）を適用します。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効化します。

    起動時には、現在のシークレットストレージとクロス署名 ID を再利用する保守的な crypto ブートストラップ処理も実行されます。ブートストラップ状態が壊れている場合、OpenClaw は `channels.matrix.password` なしでも保護された修復を試みます。homeserver がパスワード UIA を要求する場合、起動は警告をログに記録し、非致命的なままにします。すでに所有者署名済みのデバイスは保持されます。

    完全なアップグレードフローについては、[Matrix 移行](/ja-JP/channels/matrix-migration) を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は検証ライフサイクル通知を `m.notice` メッセージとして、厳格な DM 検証ルームに投稿します。リクエスト、準備完了（「絵文字で検証」の案内付き）、開始/完了、利用可能な場合は SAS（絵文字/小数）の詳細です。

    別の Matrix クライアントからの受信リクエストは追跡され、自動的に受け入れられます。自己検証では、OpenClaw は SAS フローを自動的に開始し、絵文字検証が利用可能になると自分側を確認します - ただし、Matrix クライアントで比較し、「一致しています」を確認する必要があります。

    検証システム通知は、エージェントチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="削除済みまたは無効な Matrix デバイス">
    `verify status` が現在のデバイスは homeserver にもう一覧表示されていないと言う場合は、新しい OpenClaw Matrix デバイスを作成してください。パスワードログインの場合:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    トークン認証では、Matrix クライアントまたは管理 UI で新しいアクセストークンを作成してから、OpenClaw を更新します。

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    失敗したコマンドのアカウント ID で `assistant` を置き換えるか、デフォルトアカウントの場合は `--account` を省略します。

  </Accordion>

  <Accordion title="Device hygiene">
    古い OpenClaw 管理デバイスは蓄積されることがあります。一覧表示して整理します。

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE は、IndexedDB shim として `fake-indexeddb` を使い、公式の `matrix-js-sdk` Rust crypto パスを使用します。暗号化状態は `crypto-idb-snapshot.json` に永続化されます（制限付きファイル権限）。

    暗号化されたランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下にあり、sync store、crypto store、recovery key、IDB スナップショット、thread bindings、起動時の検証状態が含まれます。トークンが変わってもアカウント ID が同じ場合、OpenClaw は最適な既存 root を再利用するため、以前の状態は引き続き表示されます。

    単一の古い token-hash root は、通常のトークンローテーション継続パスである場合があります。OpenClaw が `matrix: multiple populated token-hash storage roots detected` をログ出力した場合は、アカウントディレクトリを確認し、選択されたアクティブ root が正常であることを確認してから、古い sibling root をアーカイブしてください。すぐに削除するより、古い root を `_archive/` ディレクトリへ移動することを推奨します。

  </Accordion>
</AccordionGroup>

## プロファイル管理

選択したアカウントの Matrix 自己プロファイルを更新します。

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

1 回の呼び出しで両方のオプションを渡せます。Matrix は `mxc://` アバター URL を直接受け付けます。`http://` または `https://` を渡すと、OpenClaw は先にファイルをアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl`（またはアカウントごとの上書き）に保存します。

## スレッド

Matrix は、自動返信と message-tool 送信の両方でネイティブの Matrix スレッドをサポートします。動作は 2 つの独立した設定で制御します。

### セッションルーティング（`sessionScope`）

`dm.sessionScope` は、Matrix DM ルームを OpenClaw セッションにどのように対応付けるかを決定します。

- `"per-user"`（デフォルト）: 同じルーティング先ピアを持つすべての DM ルームが 1 つのセッションを共有します。
- `"per-room"`: ピアが同じでも、各 Matrix DM ルームが独自のセッションキーを持ちます。

明示的な会話バインディングは常に `sessionScope` より優先されるため、バインド済みのルームとスレッドは選択済みのターゲットセッションを維持します。

### 返信スレッド化（`threadReplies`）

`threadReplies` は、bot が返信を投稿する場所を決定します。

- `"off"`: 返信はトップレベルになります。受信したスレッド内メッセージは親セッションに残ります。
- `"inbound"`: 受信メッセージがすでにそのスレッド内にあった場合のみ、スレッド内で返信します。
- `"always"`: トリガーとなったメッセージを root とするスレッド内で返信します。その会話は、最初のトリガー以降、対応するスレッドスコープのセッション経由でルーティングされます。

`dm.threadReplies` は DM のみでこれを上書きします。たとえば、ルームスレッドは分離したまま、DM はフラットにできます。

### スレッド継承と slash commands

- 受信したスレッド内メッセージには、追加のエージェントコンテキストとしてスレッド root メッセージが含まれます。
- Message-tool 送信は、同じルーム（または同じ DM ユーザーターゲット）を対象にする場合、明示的な `threadId` が指定されていない限り、現在の Matrix スレッドを自動継承します。
- DM ユーザーターゲットの再利用は、現在のセッションメタデータが同じ Matrix アカウント上の同じ DM ピアであることを証明する場合にのみ有効になります。それ以外の場合、OpenClaw は通常のユーザースコープルーティングにフォールバックします。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、スレッドバインドされた `/acp spawn` は、すべて Matrix ルームと DM で動作します。
- トップレベルの `/focus` は、`threadBindings.spawnSessions` が有効な場合に新しい Matrix スレッドを作成し、それをターゲットセッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、そのスレッドをその場でバインドします。

OpenClaw が、同じ共有セッション上の別の DM ルームと衝突している Matrix DM ルームを検出すると、そのルームに 1 回限りの `m.notice` を投稿し、`/focus` の退避手段を示して `dm.sessionScope` の変更を提案します。この通知は、thread bindings が有効な場合にのみ表示されます。

## ACP 会話バインディング

Matrix ルーム、DM、既存の Matrix スレッドは、チャット画面を変えずに永続的な ACP ワークスペースへ変換できます。

高速なオペレーターフロー:

- 使い続けたい Matrix DM、ルーム、または既存スレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM/ルームがチャット画面のままになり、今後のメッセージは生成された ACP セッションへルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` が現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

注:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnSessions` は `/acp spawn --thread auto|here` を制御します。ここでは、OpenClaw が子 Matrix スレッドを作成またはバインドする必要があります。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャンネルごとの上書きもサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix スレッドバインドセッションの生成はデフォルトで有効です。

- Matrix スレッドの作成またはバインドをトップレベルの `/focus` と `/acp spawn --thread auto|here` からブロックするには、`threadBindings.spawnSessions: false` を設定します。
- ネイティブ subagent スレッド生成で親トランスクリプトを fork しない場合は、`threadBindings.defaultSpawnContext: "isolated"` を設定します。

## リアクション

Matrix は、送信リアクション、受信リアクション通知、ack リアクションをサポートします。

送信リアクションツールは `channels.matrix.actions.reactions` で制御されます。

- `react` は Matrix イベントにリアクションを追加します。
- `reactions` は Matrix イベントの現在のリアクション要約を一覧表示します。
- `emoji=""` はそのイベント上の bot 自身のリアクションを削除します。
- `remove: true` は bot から指定された絵文字リアクションのみを削除します。

**解決順序**（最初に定義された値が優先）:

| 設定                    | 順序                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | アカウントごと → チャンネル → `messages.ackReaction` → エージェント ID 絵文字フォールバック |
| `ackReactionScope`      | アカウントごと → チャンネル → `messages.ackReactionScope` → デフォルト `"group-mentions"` |
| `reactionNotifications` | アカウントごと → チャンネル → デフォルト `"own"`                                          |

`reactionNotifications: "own"` は、bot が作成した Matrix メッセージを対象に追加された `m.reaction` イベントを転送します。`"off"` はリアクションシステムイベントを無効にします。リアクション削除は、Matrix がそれらを単独の `m.reaction` 削除ではなく redaction として表現するため、システムイベントには合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める直近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックします。両方が未設定の場合、有効なデフォルトは `0` です。無効にするには `0` を設定します。
- Matrix ルーム履歴はルーム専用です。DM は通常のセッション履歴を引き続き使用します。
- Matrix ルーム履歴は pending-only です。OpenClaw はまだ返信をトリガーしていないルームメッセージをバッファし、メンションまたは他のトリガーが到着したときにそのウィンドウのスナップショットを取得します。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメイン受信本文に残ります。
- 同じ Matrix イベントの再試行では、新しいルームメッセージへずれていくのではなく、元の履歴スナップショットを再利用します。

## コンテキスト可視性

Matrix は、取得した返信テキスト、スレッド root、pending 履歴などの補足ルームコンテキストに対して、共有の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信時のまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブなルーム/ユーザー allowlist チェックで許可された送信者に補足コンテキストをフィルターします。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的に引用された返信を 1 つ保持します。

この設定は補足コンテキストの可視性に影響します。受信メッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガー認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、DM ポリシー設定から行われます。

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

メンションゲートと allowlist の動作については、[グループ](/ja-JP/channels/groups) を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前にメッセージを送り続ける場合、OpenClaw は同じ pending ペアリングコードを再利用し、新しいコードを発行する代わりに短いクールダウン後にリマインダー返信を送ることがあります。

共有 DM ペアリングフローとストレージレイアウトについては、[ペアリング](/ja-JP/channels/pairing) を参照してください。

## 直接ルーム修復

ダイレクトメッセージ状態が同期ずれを起こすと、OpenClaw はライブ DM ではなく古い solo ルームを指す stale な `m.direct` マッピングを持つ場合があります。ピアの現在のマッピングを確認します。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復します。

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

どちらのコマンドも、複数アカウント構成では `--account <id>` を受け付けます。修復フローは次のとおりです。

- `m.direct` にすでにマップされている厳密な 1:1 DM を優先します
- そのユーザーと現在参加中の厳密な 1:1 DM があれば、そこへフォールバックします
- 正常な DM が存在しない場合、新しい direct ルームを作成し、`m.direct` を書き換えます

古いルームは自動的には削除しません。正常な DM を選択してマッピングを更新するため、今後の Matrix 送信、検証通知、その他のダイレクトメッセージフローは正しいルームを対象にします。

## Exec 承認

Matrix はネイティブ承認クライアントとして動作できます。`channels.matrix.execApprovals`（またはアカウントごとの上書きでは `channels.matrix.accounts.<account>.execApprovals`）配下に設定します。

- `enabled`: Matrix ネイティブプロンプト経由で承認を配信します。未設定または `"auto"` の場合、少なくとも 1 人の承認者を解決できると Matrix が自動的に有効になります。明示的に無効にするには `false` を設定します。
- `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID（`@owner:example.org`）。任意です。`channels.matrix.dm.allowFrom` にフォールバックします。
- `target`: プロンプトの送信先。`"dm"`（デフォルト）は承認者 DM に送信します。`"channel"` は発信元の Matrix ルームまたは DM に送信します。`"both"` は両方に送信します。
- `agentFilter` / `sessionFilter`: Matrix 配信をトリガーするエージェント/セッションの任意の allowlist。

認可は承認の種類によって少し異なります。

- **Exec 承認** は `execApprovals.approvers` を使用し、`dm.allowFrom` にフォールバックします。
- **Plugin 承認** は `dm.allowFrom` のみで認可します。

どちらの種類も Matrix リアクションショートカットとメッセージ更新を共有します。承認者には、プライマリ承認メッセージ上にリアクションショートカットが表示されます。

- `✅` 1 回だけ許可
- `❌` 拒否
- `♾️` 常に許可（有効な exec ポリシーで許可されている場合）

フォールバックのスラッシュコマンド: `/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

解決済みの承認者だけが承認または拒否できます。exec 承認のチャネル配信にはコマンドテキストが含まれます。信頼済みのルームでのみ `channel` または `both` を有効にしてください。

関連: [Exec 承認](/ja-JP/tools/exec-approvals)。

## スラッシュコマンド

スラッシュコマンド (`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` など) は DM で直接動作します。ルームでは、OpenClaw はボット自身の Matrix メンションが前置されたコマンドも認識するため、`@bot:server /new` はカスタムのメンション正規表現なしでコマンドパスをトリガーします。これにより、ユーザーがコマンド入力前にボットをタブ補完したときに Element などのクライアントが送信する、ルーム形式の `@mention /command` 投稿にボットが応答し続けられます。

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

- トップレベルの `channels.matrix` 値は、アカウント側で上書きされない限り、名前付きアカウントのデフォルトとして機能します。
- `groups.<room>.account` で、継承されたルームエントリを特定のアカウントにスコープします。`account` のないエントリはアカウント間で共有されます。デフォルトアカウントがトップレベルで構成されている場合も、`account: "default"` は引き続き動作します。

**デフォルトアカウントの選択:**

- 暗黙のルーティング、プローブ、CLI コマンドが優先する名前付きアカウントを選ぶには、`defaultAccount` を設定します。
- 複数のアカウントがあり、そのうち 1 つが文字どおり `default` という名前の場合、`defaultAccount` が未設定でも OpenClaw はそれを暗黙的に使用します。
- 複数の名前付きアカウントがあり、デフォルトが選択されていない場合、CLI コマンドは推測を拒否します。`defaultAccount` を設定するか、`--account <id>` を渡してください。
- トップレベルの `channels.matrix.*` ブロックは、その認証が完全な場合 (`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`) にのみ、暗黙の `default` アカウントとして扱われます。名前付きアカウントは、キャッシュ済み認証情報が認証をカバーすると、`homeserver` + `userId` から引き続き検出可能です。

**昇格:**

- OpenClaw が修復またはセットアップ中に単一アカウント構成を複数アカウントへ昇格する場合、既存の名前付きアカウントがあればそれを保持し、または `defaultAccount` がすでに指しているアカウントを保持します。昇格されたアカウントへ移動するのは Matrix の認証/ブートストラップキーだけです。共有の配信ポリシーキーはトップレベルに残ります。

共有の複数アカウントパターンについては、[構成リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## プライベート/LAN ホームサーバー

デフォルトでは、SSRF 保護のため、OpenClaw はプライベート/内部 Matrix ホームサーバーをブロックします。ただし、アカウントごとに明示的にオプトインした場合は除きます。

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

このオプトインは、信頼済みのプライベート/内部ターゲットだけを許可します。`http://matrix.example.org:8008` のような公開平文ホームサーバーは引き続きブロックされます。可能な限り `https://` を優先してください。

## Matrix トラフィックのプロキシ

Matrix デプロイに明示的なアウトバウンド HTTP(S) プロキシが必要な場合は、`channels.matrix.proxy` を設定します。

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
OpenClaw は、実行時の Matrix トラフィックとアカウントステータスのプローブに同じプロキシ設定を使用します。

## ターゲット解決

OpenClaw がルームまたはユーザーターゲットを求める場所では、Matrix は次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

Matrix ルーム ID は大文字と小文字を区別します。明示的な配信ターゲット、cron ジョブ、バインディング、または許可リストを構成するときは、Matrix の正確なルーム ID の大文字小文字を使用してください。OpenClaw は保存用の内部セッションキーを正規化して保持するため、それらの小文字キーは Matrix 配信 ID の信頼できるソースではありません。

ライブディレクトリ検索は、ログイン中の Matrix アカウントを使用します。

- ユーザー検索は、そのホームサーバー上の Matrix ユーザーディレクトリを問い合わせます。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け付けます。参加済みルーム名の検索はベストエフォートで、`dangerouslyAllowNameMatching: true` が設定されている場合にのみ実行時のルーム許可リストへ適用されます。
- ルーム名を ID またはエイリアスに解決できない場合、実行時の許可リスト解決では無視されます。

## 構成リファレンス

許可リスト形式のユーザーフィールド (`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`) は、完全な Matrix ユーザー ID (最も安全) を受け付けます。ID ではないユーザーエントリはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` を設定した場合、正確に一致する Matrix ディレクトリの表示名が起動時、およびモニターの実行中に許可リストが変更されるたびに解決されます。解決できないエントリは実行時に無視されます。

ルーム許可リストキー (`groups`、レガシーの `rooms`) は、ルーム ID またはエイリアスにしてください。プレーンなルーム名キーはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` は、参加済みルーム名に対するベストエフォート検索を復元します。

### アカウントと接続

- `enabled`: チャネルを有効または無効にします。
- `name`: アカウントの任意の表示ラベル。
- `defaultAccount`: 複数の Matrix アカウントが構成されている場合の優先アカウント ID。
- `accounts`: アカウントごとの名前付き上書き。トップレベルの `channels.matrix` 値はデフォルトとして継承されます。
- `homeserver`: ホームサーバー URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このアカウントが `localhost`、LAN/Tailscale IP、または内部ホスト名へ接続することを許可します。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。アカウントごとの上書きをサポートします。
- `userId`: 完全な Matrix ユーザー ID (`@bot:example.org`)。
- `accessToken`: トークンベース認証用のアクセストークン。平文値と SecretRef 値は、env/file/exec プロバイダー全体でサポートされます ([シークレット管理](/ja-JP/gateway/secrets))。
- `password`: パスワードベースログイン用のパスワード。平文値と SecretRef 値をサポートします。
- `deviceId`: 明示的な Matrix デバイス ID。
- `deviceName`: パスワードログイン時に使用されるデバイス表示名。
- `avatarUrl`: プロファイル同期と `profile set` 更新用に保存される自分のアバター URL。
- `initialSyncLimit`: 起動時同期中に取得するイベントの最大数。

### 暗号化

- `encryption`: E2EE を有効にします。デフォルト: `false`。
- `startupVerification`: `"if-unverified"` (E2EE がオンの場合のデフォルト) または `"off"`。このデバイスが未検証の場合、起動時に自己検証を自動リクエストします。
- `startupVerificationCooldownHours`: 次の自動起動時リクエストまでのクールダウン。デフォルト: `24`。

### アクセスとポリシー

- `groupPolicy`: `"open"`、`"allowlist"`、または `"disabled"`。デフォルト: `"allowlist"`。
- `groupAllowFrom`: ルームトラフィック用のユーザー ID の許可リスト。
- `mentionPatterns`: ルームメンション用のスコープ付き正規表現パターン。`{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }` を持つオブジェクト。構成済みの `agents.list[].groupChat.mentionPatterns` をルームごとに適用するかどうかを制御します。
- `dm.enabled`: `false` の場合、すべての DM を無視します。デフォルト: `true`。
- `dm.policy`: `"pairing"` (デフォルト)、`"allowlist"`、`"open"`、または `"disabled"`。ボットが参加し、そのルームを DM と分類した後に適用されます。招待処理には影響しません。
- `dm.allowFrom`: DM トラフィック用のユーザー ID の許可リスト。
- `dm.sessionScope`: `"per-user"` (デフォルト) または `"per-room"`。
- `dm.threadReplies`: 返信スレッド化の DM 専用上書き (`"off"`、`"inbound"`、`"always"`)。
- `allowBots`: 他の構成済み Matrix ボットアカウントからのメッセージを受け付けます (`true` または `"mentions"`)。
- `allowlistOnly`: `true` の場合、すべてのアクティブな DM ポリシー (`"disabled"` を除く) と `"open"` グループポリシーを `"allowlist"` に強制します。`"disabled"` ポリシーは変更しません。
- `dangerouslyAllowNameMatching`: `true` の場合、ユーザー許可リストエントリに対する Matrix 表示名ディレクトリ検索と、ルーム許可リストキーに対する参加済みルーム名検索を許可します。完全な `@user:server` ID とルーム ID またはエイリアスを優先してください。
- `autoJoin`: `"always"`、`"allowlist"`、または `"off"`。デフォルト: `"off"`。DM 形式の招待を含む、すべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `"allowlist"` の場合に許可されるルーム/エイリアス。エイリアスエントリは、招待されたルームが主張する状態ではなく、ホームサーバーに対して解決されます。
- `contextVisibility`: 補足コンテキストの可視性 (`"all"` がデフォルト、`"allowlist"`、`"allowlist_quote"`)。

### 返信動作

- `replyToMode`: `"off"`、`"first"`、`"all"`、または `"batched"`。
- `threadReplies`: `"off"`、`"inbound"`、または `"always"`。
- `threadBindings`: スレッドにバインドされたセッションルーティングとライフサイクルのチャネルごとの上書き。
- `streaming`: `"off"` (デフォルト)、`"partial"`、`"quiet"`、`"progress"`、またはオブジェクト形式 `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`。`true` ↔ `"partial"`、`false` ↔ `"off"`。
- `blockStreaming`: `true` の場合、完了した assistant ブロックは個別の進捗メッセージとして保持されます。
- `markdown`: 送信テキスト用の任意の Markdown レンダリング構成。
- `responsePrefix`: 送信返信の先頭に付加される任意の文字列。
- `textChunkLimit`: `chunkMode: "length"` の場合の、文字数単位の送信チャンクサイズ。デフォルト: `4000`。
- `chunkMode`: `"length"` (デフォルト、文字数で分割) または `"newline"` (行境界で分割)。
- `historyLimit`: ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数。`messages.groupChat.historyLimit` にフォールバックします。有効なデフォルトは `0` (無効)。
- `mediaMaxMb`: 送信と受信処理におけるメディアサイズ上限 (MB)。

### リアクション設定

- `ackReaction`: このチャネル/アカウントの ack リアクション上書き。
- `ackReactionScope`: スコープ上書き (`"group-mentions"` がデフォルト、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`)。
- `reactionNotifications`: 受信リアクション通知モード (`"own"` がデフォルト、`"off"`)。

### ツールとルームごとの上書き

- `actions`: アクションごとのツール制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`: ルームごとのポリシーマップ。セッション ID は解決後の安定したルーム ID を使用します。（`rooms` はレガシーエイリアスです。）
  - `groups.<room>.account`: 継承された単一のルームエントリを特定のアカウントに制限します。
  - `groups.<room>.enabled`: ルームごとの切り替え。`false` の場合、そのルームはマップに存在しないものとして無視されます。
  - `groups.<room>.requireMention`: チャネルレベルのメンション要件に対するルームごとの上書き。
  - `groups.<room>.allowBots`: チャネルレベル設定のルームごとの上書き（`true` または `"mentions"`）。
  - `groups.<room>.botLoopProtection`: ボット間ループ保護予算のルームごとの上書き。
  - `groups.<room>.users`: ルームごとの送信者許可リスト。
  - `groups.<room>.tools`: ルームごとのツール許可/拒否の上書き。
  - `groups.<room>.autoReply`: ルームごとのメンション制御の上書き。`true` はそのルームのメンション要件を無効にし、`false` は再び強制します。
  - `groups.<room>.skills`: ルームごとの skill フィルター。
  - `groups.<room>.systemPrompt`: ルームごとのシステムプロンプトスニペット。

### exec 承認設定

- `execApprovals.enabled`: Matrix ネイティブのプロンプト経由で exec 承認を配信します。
- `execApprovals.approvers`: 承認を許可される Matrix ユーザー ID。`dm.allowFrom` にフォールバックします。
- `execApprovals.target`: `"dm"`（デフォルト）、`"channel"`、または `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 配信対象の任意のエージェント/セッション許可リスト。

## 関連

- [チャネル概要](/ja-JP/channels) - 対応しているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制御
- [チャネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化
