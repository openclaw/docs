---
read_when:
    - OpenClaw で Matrix を設定する
    - Matrix E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、設定例
title: マトリックス
x-i18n:
    generated_at: "2026-07-11T21:57:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix は、公式の `matrix-js-sdk` を基盤として構築された、ダウンロード可能なチャンネル Plugin（`@openclaw/matrix`）です。DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## インストール

```bash
openclaw plugins install @openclaw/matrix
```

修飾されていない Plugin 指定では、最初に ClawHub を試し、次に npm へフォールバックします。ソースを強制するには、`openclaw plugins install clawhub:@openclaw/matrix` または `npm:@openclaw/matrix` を使用します。ローカルのチェックアウトからインストールする場合は、`openclaw plugins install ./path/to/local/matrix-plugin` を使用します。

`plugins install` は Plugin を登録して有効化するため、別途 `enable` を実行する必要はありません。ただし、以下の設定を行うまでチャンネルは何も実行しません。一般的なインストール規則については、[Plugin](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. ホームサーバー上に Matrix アカウントを作成します。
2. `channels.matrix` に `homeserver` + `accessToken`、または `homeserver` + `userId` + `password` を設定します。
3. Gateway を再起動します。
4. ボットとの DM を開始するか、ボットをルームに招待します。新しい招待から参加するのは、[`autoJoin`](#auto-join) で許可されている場合のみです。

### 対話式セットアップ

```bash
openclaw channels add
openclaw configure --section channels
```

ウィザードでは、ホームサーバーの URL、認証方式（トークンまたはパスワード）、ユーザー ID（パスワード認証の場合のみ）、任意のデバイス名、E2EE を有効にするかどうか、ルームへのアクセスと自動参加について確認されます。一致する `MATRIX_*` 環境変数がすでに存在し、アカウントに保存済みの認証情報がない場合、ウィザードは環境変数を使用するショートカットを提示します。`openclaw channels resolve --channel matrix "Project Room"` を使用してルーム名を解決してから、許可リストを保存してください。ウィザードで E2EE を有効にすると、[`openclaw matrix encryption setup`](#encryption-and-verification) と同じブートストラップが実行されます。

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

パスワードベース（初回ログイン後にトークンがキャッシュされます）：

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

`channels.matrix.autoJoin` のデフォルトは `"off"` です。手動で参加するまで、ボットは新しいルームや新しい招待による DM に参加しません。OpenClaw は招待を受けた時点では、その招待が DM かグループかを判別できないため、すべての招待に最初に `autoJoin` が適用されます。`dm.policy` が適用されるのは、その後ボットが参加し、ルームが分類されてからです。

<Warning>
受け入れる招待を制限するには、`autoJoin: "allowlist"` と `autoJoinAllowlist` を設定します。すべての招待を受け入れるには、`autoJoin: "always"` を設定します。

`autoJoinAllowlist` で使用できるのは、`!roomId:server`、`#alias:server`、または `*` のみです。単純なルーム名は拒否されます。エイリアスは、招待されたルームが提示する状態ではなく、ホームサーバーに対して解決されます。
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

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）：`@user:server` を使用します。表示名はデフォルトで無視されます（変更可能なため）。表示名との明示的な互換性が必要な場合にのみ、`dangerouslyAllowNameMatching: true` を設定してください。
- ルーム許可リストのキー（`groups`、旧エイリアス `rooms`）：`!room:server` または `#alias:server` を使用します。`dangerouslyAllowNameMatching: true` が設定されていない限り、単純な名前は無視されます。
- 招待許可リスト（`autoJoinAllowlist`）：`!room:server`、`#alias:server`、または `*` を使用します。単純な名前は常に拒否されます。

### アカウント ID の正規化

ウィザードは、わかりやすい名前を正規化されたアカウント ID に変換します（`Ops Bot` -> `ops-bot`）。アカウント間の衝突を防ぐため、スコープ付き環境変数名では句読記号が 16 進数でエスケープされます。`-`（0x2D）は `_X2D_` になるため、`ops-prod` は環境変数プレフィックス `MATRIX_OPS_X2D_PROD_` に対応します。

### キャッシュされた認証情報

Matrix は、認証情報を `~/.openclaw/credentials/matrix/` 以下にキャッシュします。デフォルトアカウントでは `credentials.json`、名前付きアカウントでは `credentials-<account>.json` を使用します。キャッシュされた認証情報が存在する場合、設定ファイルに `accessToken` がなくても、OpenClaw は Matrix が設定済みであるとみなします。これは、セットアップ、`openclaw doctor`、チャンネル状態のプローブに適用されます。

### 環境変数

対応する設定キーが未設定の場合に使用される、設定キーに対応した環境変数です。デフォルトアカウントではプレフィックスなしの名前を使用し、名前付きアカウントではサフィックスの前にアカウントトークンが挿入されます（[正規化](#account-id-normalization)を参照）。

| デフォルトアカウント  | 名前付きアカウント（`<ID>` = アカウントトークン） |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

アカウント `ops` の場合、名前は `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` などになります。`MATRIX_HOMESERVER`（およびスコープ付きの任意の `*_HOMESERVER` バリアント）は、ワークスペースの `.env` から設定できません。[ワークスペースの `.env` ファイル](/ja-JP/gateway/security)を参照してください。

<Note>
リカバリーキーには、設定に対応した環境変数はありません。OpenClaw 自体が環境からリカバリーキーを読み取ることはありません。CLI の案内文では、デフォルトアカウントの場合は `MATRIX_RECOVERY_KEY`、名前付きアカウントの場合は `MATRIX_RECOVERY_KEY_<ID>`（単純に大文字化したアカウント ID。16 進数エスケープなし）という名前のシェル変数を介して渡す方法を提示します。[リカバリーキーを使用してこのデバイスを検証する](#verify-this-device-with-a-recovery-key)を参照してください。
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
      streaming: "partial",
    },
  },
}
```

## ストリーミングプレビュー

Matrix の返信ストリーミングはオプトインです。`streaming` は、生成中のアシスタントの返信を OpenClaw が配信する方法を制御します。`blockStreaming` は、完了した各ブロックを個別の Matrix メッセージとして保持するかどうかを制御します。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

リアルタイムの回答プレビューを維持しながら、途中のツールや進捗の行を非表示にするには、オブジェクト形式を使用します。

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

完全なオブジェクト形式では `{ mode, preview, progress }` を使用できます。

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

- `progress.label`：カスタムラベル、設定済みまたは組み込みのラベルを選択する `"auto"`／未設定、あるいは非表示にする `false`。
- `progress.labels`：`label` が `"auto"` または未設定の場合にのみ使用される候補。
- `progress.maxLines`：下書きに保持される進捗行の最大数。この数を超えた古い行は削除されます。
- `progress.maxLineChars`：切り詰められるまでの、コンパクトな各進捗行の最大文字数。
- `progress.toolProgress`：`true`（デフォルト）の場合、リアルタイムのツール／進捗アクティビティが下書きに表示されます。

| `streaming`       | 動作                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（デフォルト） | 返信全体を待ってから、一度だけ送信します。`true` <-> `"partial"`、`false` <-> `"off"`。                                                                         |
| `"partial"`       | モデルが現在のブロックを生成している間、1 件の通常のテキストメッセージをその場で編集します。標準クライアントでは、最終編集時ではなく最初のプレビュー時に通知される場合があります。          |
| `"quiet"`         | `"partial"` と同じですが、メッセージは通知を発生させない告知として扱われます。ユーザーごとのプッシュルールが確定後の編集に一致すると、受信者に一度通知されます（以下を参照）。 |
| `"progress"`      | 進捗用の下書きを使用して、コンパクトな進捗行を個別に送信します。                                                                                          |

`blockStreaming`（デフォルトは `false`）は `streaming` とは独立しています。

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（デフォルト）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 現在のブロックをリアルタイムで下書き表示し、完了したブロックをメッセージとして保持します | 現在のブロックをリアルタイムで下書き表示し、その場で確定します |
| `"off"`                 | 完了したブロックごとに通知付き Matrix メッセージを 1 件送信します                     | 返信全体に対して通知付き Matrix メッセージを 1 件送信します      |

注：

- プレビューが Matrix のイベントあたりのサイズ上限を超えると、OpenClaw はプレビューストリーミングを停止し、最終結果のみの配信にフォールバックします。
- メディア返信では、添付ファイルは常に通常どおり送信されます。古いプレビューを安全に再利用できない場合、OpenClaw は最終的なメディア返信を送信する前にそのプレビューを墨消しします。
- プレビューストリーミングが有効な場合、ツール進捗のプレビュー更新はデフォルトで有効です。回答テキストのプレビュー編集を維持しながら、ツール進捗を通常の配信経路に残すには、`streaming.preview.toolProgress: false` を設定します。
- プレビューの編集では、追加の Matrix API 呼び出しが発生します。最も保守的なレート制限プロファイルを使用するには、`streaming: "off"` のままにしてください。

## 音声メッセージ

受信した Matrix の音声メモは、ルームのメンションゲートより前に文字起こしされます。そのため、ボット名を含む音声メモによって、`requireMention: true` のルームでもエージェントを起動できます。また、エージェントには音声添付ファイルのプレースホルダーだけでなく、文字起こし結果が渡されます。

Matrix は、OpenAI `gpt-4o-mini-transcribe` など、`tools.media.audio` で設定された共有音声メディアプロバイダーを使用します。プロバイダーのセットアップと制限については、[メディアツールの概要](/ja-JP/tools/media-overview)を参照してください。

- `m.audio` イベント、および MIME タイプが `audio/*` の `m.file` イベントが対象です。
- 暗号化されたルームでは、OpenClaw は文字起こしの前に、既存の Matrix メディア経路を通じて添付ファイルを復号します。
- 文字起こし結果は、機械生成かつ信頼できないものとしてエージェントプロンプト内で明示されます。
- 下流のメディアツールが再度文字起こししないように、添付ファイルは文字起こし済みとしてマークされます。
- 音声の文字起こしをグローバルに無効にするには、`tools.media.audio.enabled: false` を設定します。

## 承認メタデータ

Matrix ネイティブの承認プロンプトは、`com.openclaw.approval` キー以下に OpenClaw 固有のコンテンツを持つ通常の `m.room.message` イベントです。標準クライアントでもテキスト本文は表示されます。OpenClaw 対応クライアントは、構造化された承認 ID、種類、状態、判断、実行／Plugin の詳細を読み取れます。

プロンプトが長すぎて 1 件の Matrix イベントに収まらない場合、OpenClaw は表示テキストを分割し、最初のチャンクにのみ `com.openclaw.approval` を付加します。許可／拒否のリアクションはその最初のイベントに関連付けられるため、長いプロンプトでも、単一イベントのプロンプトと同じ承認対象が維持されます。

### 確定済みプレビューを静かに通知するセルフホスト型プッシュルール

`streaming: "quiet"` は、ブロックまたはターンが確定したときにのみ受信者へ通知します。ユーザーごとのプッシュルールが、確定済みプレビューのマーカーに一致する必要があります。完全な設定手順については、[静かなプレビュー用の Matrix プッシュルール](/ja-JP/channels/matrix-push-rules)を参照してください。

## ボット間ルーム

デフォルトでは、設定済みの別の OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。エージェント間通信を意図的に許可するには、`allowBots` を使用します。

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
- `allowBots: "mentions"` は、ルーム内でこのボットへのメンションが明示的に含まれる場合にのみ、それらのメッセージを受け入れます。DM は引き続き無条件で許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベルの設定を上書きします。
- 受け入れられた設定済みボットのメッセージには、共通の[ボットループ保護](/ja-JP/channels/bot-loop-protection)が適用されます。`channels.defaults.botLoopProtection` を設定し、アカウント単位では `channels.matrix.botLoopProtection`、ルーム単位では `channels.matrix.groups.<room>.botLoopProtection` で上書きします。
- OpenClaw は、自己応答ループを避けるため、同じ Matrix ユーザー ID からのメッセージを引き続き無視します。
- Matrix にはネイティブのボットフラグがありません。OpenClaw は「ボットが送信した」メッセージを、「この OpenClaw Gateway 上で設定されている別の Matrix アカウントが送信した」メッセージとして扱います。

共有ルームでボット間通信を有効にする場合は、厳格なルーム許可リストとメンション要件を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントに `thumbnail_file` が使用されるため、画像プレビューも完全な添付ファイルとともに暗号化されます。暗号化されていないルームでは、通常の `thumbnail_url` が使用されます。設定は不要です。Plugin が E2EE の状態を自動的に検出します。

すべての `openclaw matrix` コマンドで、`--verbose`（完全な診断）、`--json`（機械可読出力）、`--account <id>`（複数アカウント構成）を使用できます。デフォルトの出力は簡潔です。

### 暗号化を有効にする

```bash
openclaw matrix encryption setup
```

シークレットストレージとクロス署名を初期化し、必要に応じてルームキーのバックアップを作成してから、状態と次の手順を表示します。便利なフラグは次のとおりです。

- `--recovery-key <key>` 初期化前にリカバリーキーを適用します（後述の標準入力形式を推奨）
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄して、新しい ID を作成します（意図した場合にのみ使用）

新しいアカウントでは、作成時に E2EE を有効にします。

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` は `--enable-e2ee` の別名です。同等の手動設定は次のとおりです。

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

`verify status` は、独立した 3 つの信頼シグナルを報告します（`--verbose` ではすべて表示されます）。

- `ローカルで信頼済み`: このクライアントだけが信頼しています
- `クロス署名で検証済み`: SDK がクロス署名による検証を報告しています
- `所有者による署名済み`: 自分自身の自己署名キーで署名されています（診断専用）

`所有者による検証済み` が `yes` になるのは、`クロス署名で検証済み` が `yes` の場合だけです。ローカルでの信頼または所有者の署名だけでは不十分です。

`--allow-degraded-local-state` は、最初に Matrix アカウントを準備せず、ベストエフォートの診断結果を返します。オフラインまたは一部のみ設定された状態の調査に役立ちます。

### リカバリーキーでこのデバイスを検証する

コマンドラインで渡す代わりに、標準入力からリカバリーキーをパイプします。

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

このコマンドは、次の 3 つの状態を報告します。

- `リカバリーキーを受理`: Matrix が、シークレットストレージまたはデバイスの信頼に使用するキーを受け入れました。
- `バックアップを利用可能`: 信頼済みのリカバリー情報を使用して、ルームキーのバックアップを読み込めます。
- `所有者がデバイスを検証済み`: このデバイスは、Matrix のクロス署名 ID によって完全に信頼されています。

リカバリーキーでバックアップ情報を復号できた場合でも、完全な ID の信頼が確立されていなければ、0 以外の終了コードで終了します。その場合は、別の Matrix クライアントから自己検証を完了してください。

```bash
openclaw matrix verify self
```

`verify self` は、`クロス署名で検証済み: yes` になるまで待機してから正常終了します。待機時間を調整するには、`--timeout-ms <ms>` を使用します。

キーを直接指定する形式の `openclaw matrix verify device "<recovery-key>"` も使用できますが、キーがシェル履歴に残ります。

### クロス署名を初期化または修復する

```bash
openclaw matrix verify bootstrap
```

暗号化されたアカウント用の修復・セットアップコマンドです。次の処理を順番に実行します。

- 可能な場合は既存のリカバリーキーを再利用して、シークレットストレージを初期化します
- クロス署名を初期化し、不足している公開キーをアップロードします
- 現在のデバイスをマークし、クロス署名します
- サーバー側のルームキーバックアップがまだ存在しない場合は作成します

ホームサーバーがクロス署名キーのアップロードに UIA を要求する場合、OpenClaw は最初に認証なし、次に `m.login.dummy`、最後に `m.login.password` を試行します（`channels.matrix.password` が必要です）。

便利なフラグは次のとおりです。

- `--recovery-key-stdin`（`printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...` と組み合わせます）または `--recovery-key <key>`
- `--force-reset-cross-signing` は、現在のクロス署名 ID を破棄します（意図した場合にのみ使用してください。現在有効なリカバリーキーが保存されているか、`--recovery-key-stdin` で指定されている必要があります）

### ルームキーのバックアップ

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` は、サーバー側のバックアップが存在するか、このデバイスで復号できるかを表示します。`backup restore` は、バックアップ済みのルームキーをローカルの暗号化ストアへインポートします。リカバリーキーがすでにディスク上にある場合は、`--recovery-key-stdin` を省略してください。

破損したバックアップを新しい基準状態に置き換えるには、次のコマンドを実行します（復元不能な古い履歴が失われることを許容します。現在のバックアップシークレットを読み込めない場合は、シークレットストレージも再作成できます）。

```bash
openclaw matrix verify backup reset --yes
```

以前のリカバリーキーで新しいバックアップの基準状態を意図的に復号できないようにする場合にのみ、`--rotate-recovery-key` を追加してください。

### 検証の一覧表示、要求、応答

```bash
openclaw matrix verify list
```

選択したアカウントの保留中の検証要求を一覧表示します。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

このアカウントから検証要求を送信します。`--own-user` は自己検証を要求します（同じユーザーの別の Matrix クライアントで確認を受け入れてください）。`--user-id`、`--device-id`、`--room-id` は別の相手を対象にします。`--own-user` を他の対象指定フラグと組み合わせることはできません。

より低レベルのライフサイクル処理では、通常、別のクライアントからの受信要求を追跡しながら、これらのコマンドを特定の要求 `<id>` に対して実行します（`<id>` は `verify list` と `verify request` で表示されます）。

| コマンド                                   | 目的                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 受信した要求を受け入れる                                               |
| `openclaw matrix verify start <id>`        | SAS フローを開始する                                                    |
| `openclaw matrix verify sas <id>`          | SAS の絵文字または数字を表示する                                        |
| `openclaw matrix verify confirm-sas <id>`  | SAS が別のクライアントに表示された内容と一致することを確認する           |
| `openclaw matrix verify mismatch-sas <id>` | 絵文字または数字が一致しない場合に SAS を拒否する                        |
| `openclaw matrix verify cancel <id>`       | キャンセルする。任意の `--reason <text>` と `--code <matrix-code>` を取る |

検証が特定のダイレクトメッセージルームに紐付いている場合、`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas`、`cancel` はすべて、DM の後続処理のヒントとして `--user-id` と `--room-id` を受け付けます。

### 複数アカウントに関する注意事項

`--account <id>` を指定しない場合、Matrix CLI コマンドは暗黙のデフォルトアカウントを使用します。名前付きアカウントが複数あり、`channels.matrix.defaultAccount` が設定されていない場合、コマンドは推測を拒否して、アカウントの選択を求めます。名前付きアカウントで E2EE が無効または利用できない場合、エラーにはそのアカウントの設定キーが示されます。たとえば、`channels.matrix.accounts.assistant.encryption` です。

<AccordionGroup>
  <Accordion title="起動時の動作">
    `encryption: true` の場合、`startupVerification` のデフォルトは `"if-unverified"` です。起動時に、未検証のデバイスが別の Matrix クライアントへ自己検証を要求します。重複する要求は省略され、クールダウンが適用されます（デフォルトは 24 時間）。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効にできます。

    起動時には、現在のシークレットストレージとクロス署名 ID を再利用する、保守的な暗号化初期化処理も実行されます。初期化状態が破損している場合、`channels.matrix.password` がなくても、OpenClaw は保護された修復を試行します。ホームサーバーがパスワード UIA を要求する場合、起動処理は警告をログに記録しますが、致命的エラーにはなりません。すでに所有者によって署名されているデバイスは維持されます。

    完全なアップグレード手順については、[Matrix の移行](/ja-JP/channels/matrix-migration)を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は、厳格な DM 検証ルームに検証ライフサイクル通知を `m.notice` メッセージとして投稿します。これには、要求、準備完了（「絵文字で検証」の案内を含む）、開始と完了、および利用可能な場合の SAS（絵文字または数字）の詳細が含まれます。

    別の Matrix クライアントからの受信要求は追跡され、自動的に受け入れられます。自己検証では、OpenClaw が SAS フローを自動的に開始し、絵文字による検証が利用可能になると自身の側を確認します。引き続き Matrix クライアントで内容を比較し、「一致します」を確認する必要があります。

    検証システムの通知は、エージェントのチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="削除済みまたは無効な Matrix デバイス">
    `verify status` で現在のデバイスがホームサーバーの一覧に存在しないと表示された場合は、新しい OpenClaw Matrix デバイスを作成してください。パスワードでログインする場合は、次を実行します。

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

    `assistant` を失敗したコマンドに含まれるアカウント ID に置き換えるか、デフォルトアカウントの場合は `--account` を省略します。

  </Accordion>

  <Accordion title="デバイス管理">
    OpenClaw が管理する古いデバイスは蓄積することがあります。一覧表示して整理するには、次を実行します。

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="暗号化ストア">
    Matrix E2EE は、IndexedDB の代替実装として `fake-indexeddb` を使用し、公式の `matrix-js-sdk` Rust 暗号化パスを利用します。暗号化状態は `crypto-idb-snapshot.json` に永続化されます（厳格なファイル権限が適用されます）。

    暗号化されたランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下に保存され、同期ストア、暗号化ストア、リカバリーキー、IDB スナップショット、スレッドの紐付け、起動時の検証状態が含まれます。トークンが変更されてもアカウント ID が同じ場合、OpenClaw は最適な既存ルートを再利用するため、以前の状態を引き続き参照できます。

    単一の古いトークンハッシュルートは、通常のトークンローテーション継続経路である可能性があります。OpenClaw が `matrix: multiple populated token-hash storage roots detected` をログに記録した場合は、アカウントディレクトリを調べ、選択されたアクティブなルートが正常であることを確認してから、古い兄弟ルートをアーカイブしてください。古いルートはすぐに削除せず、`_archive/` ディレクトリへ移動することを推奨します。

  </Accordion>
</AccordionGroup>

## プロフィール管理

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

1 回の呼び出しで両方のオプションを渡してください。Matrix は `mxc://` アバター URL を直接受け付けます。`http://`/`https://` を渡すと、まずファイルがアップロードされ、解決後の `mxc://` URL が `channels.matrix.avatarUrl`（またはアカウント単位のオーバーライド）に保存されます。

## スレッド

Matrix は、自動応答とメッセージツールによる送信の両方でネイティブスレッドをサポートします。動作は、互いに独立した 2 つの設定で制御します。

### セッションルーティング（`sessionScope`）

`dm.sessionScope` は、Matrix の DM ルームを OpenClaw セッションに対応付ける方法を決定します。

- `"per-user"`（デフォルト）: ルーティング先の相手が同じであるすべての DM ルームで、1 つのセッションを共有します。
- `"per-room"`: 相手が同じでも、Matrix の各 DM ルームに個別のセッションキーを割り当てます。

明示的な会話バインディングは常に `sessionScope` より優先されます。バインドされたルームとスレッドでは、選択した対象セッションが維持されます。

### 返信のスレッド化（`threadReplies`）

`threadReplies` は、ボットが返信を投稿する場所を決定します。

- `"off"`: 返信をトップレベルに投稿します。受信したスレッド内メッセージは親セッションに留まります。
- `"inbound"`: 受信メッセージがすでにスレッド内にある場合に限り、そのスレッド内で返信します。
- `"always"`: トリガーとなったメッセージをルートとするスレッド内で返信します。その会話は最初のトリガー以降、対応するスレッドスコープのセッションを通じてルーティングされます。

`dm.threadReplies` は DM に限りこの設定をオーバーライドします。たとえば、ルームのスレッドを分離したまま、DM をフラットに保つことができます。

### スレッドの継承とスラッシュコマンド

- 受信したスレッド内メッセージには、スレッドのルートメッセージが追加のエージェントコンテキストとして含まれます。
- 同じルーム（または同じ DM ユーザーターゲット）を対象とするメッセージツール送信は、明示的な `threadId` が指定されていない限り、現在の Matrix スレッドを自動的に継承します。
- DM ユーザーターゲットの再利用は、現在のセッションメタデータによって、同じ Matrix アカウント上の同じ DM 相手であることが確認できる場合にのみ行われます。それ以外の場合、OpenClaw は通常のユーザースコープのルーティングにフォールバックします。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドにバインドされた `/acp spawn` は、いずれも Matrix のルームと DM で動作します。
- `threadBindings.spawnSessions` が有効な場合、トップレベルの `/focus` は新しい Matrix スレッドを作成し、対象セッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、そのスレッドがその場でバインドされます。

OpenClaw が、同じ共有セッション上で Matrix の DM ルームが別の DM ルームと競合していることを検出すると、`/focus` という回避手段を案内し、`dm.sessionScope` の変更を提案する 1 回限りの `m.notice` を投稿します。この通知は、スレッドバインディングが有効な場合にのみ表示されます。

## ACP 会話バインディング

Matrix のルーム、DM、および既存の Matrix スレッドは、チャット画面を変更することなく、永続的な ACP ワークスペースとして使用できます。

オペレーター向けの簡単な手順:

- 引き続き使用する Matrix の DM、ルーム、または既存のスレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの DM またはルームでは、現在の DM／ルームがチャット画面として維持され、以後のメッセージは生成された ACP セッションにルーティングされます。
- 既存のスレッド内では、`--bind here` によって現在のスレッドがその場でバインドされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

`--bind here` は子 Matrix スレッドを作成しません。`threadBindings.spawnSessions` は、OpenClaw が子スレッドを作成またはバインドする必要がある `/acp spawn --thread auto|here` を制御します。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャンネル単位のオーバーライドをサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: サブエージェントと ACP の両方のスレッド生成を制御します。
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: サブエージェントのみ、または ACP のみの生成に対する、より限定的なオーバーライドです。
- `threadBindings.defaultSpawnContext`

Matrix のスレッドにバインドされたセッション生成は、デフォルトで有効です。トップレベルの `/focus` と `/acp spawn --thread auto|here` による Matrix スレッドの作成／バインドを禁止するには、`threadBindings.spawnSessions: false` を設定します。ネイティブなサブエージェントのスレッド生成時に親のトランスクリプトをフォークさせない場合は、`threadBindings.defaultSpawnContext: "isolated"` を設定します。

## リアクション

Matrix は、送信リアクション、受信リアクション通知、および確認リアクションをサポートします。

送信リアクション用ツールは `channels.matrix.actions.reactions` によって制御されます。

- `react` は Matrix イベントにリアクションを追加します。
- `reactions` は Matrix イベントの現在のリアクション概要を一覧表示します。
- `emoji=""` は、そのイベントに対するボット自身のリアクションを削除します。
- `remove: true` は、ボットによる指定された絵文字のリアクションのみを削除します。

**解決順序**（最初に定義されている値が優先されます）:

| 設定                    | 順序                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | アカウント単位 -> チャンネル -> `messages.ackReaction` -> エージェント ID の絵文字へのフォールバック |
| `ackReactionScope`      | アカウント単位 -> チャンネル -> `messages.ackReactionScope` -> デフォルト `"group-mentions"` |
| `reactionNotifications` | アカウント単位 -> チャンネル -> デフォルト `"own"`                                  |

`reactionNotifications: "own"` は、ボットが作成した Matrix メッセージを対象とする、追加された `m.reaction` イベントを転送します。`"off"` はリアクションのシステムイベントを無効にします。リアクションの削除はシステムイベントとして生成されません。Matrix では、これは独立した `m.reaction` 削除ではなく、リダクションとして公開されます。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、ルームメッセージがエージェントをトリガーしたときに、最近のルームメッセージを何件 `InboundHistory` として含めるかを制御します。`messages.groupChat.historyLimit` にフォールバックし、両方とも未設定の場合の実効デフォルトは `0`（無効）です。
- Matrix のルーム履歴はルーム専用です。DM では引き続き通常のセッション履歴を使用します。
- ルーム履歴には保留中のものだけが含まれます。OpenClaw は、まだ返信をトリガーしていないルームメッセージをバッファリングし、メンションまたはその他のトリガーが到着した時点で、その範囲のスナップショットを取得します。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメインの受信本文に残ります。
- 同じ Matrix イベントを再試行する場合は、より新しいルームメッセージへずれることなく、元の履歴スナップショットを再利用します。

## コンテキストの可視性

Matrix は、取得した返信テキスト、スレッドルート、保留中の履歴など、ルームの補足コンテキストに対する共通の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信時のまま維持されます。
- `contextVisibility: "allowlist"` は、補足コンテキストを、アクティブなルーム／ユーザーの許可リストチェックで許可された送信者のものに限定します。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的に引用された返信を 1 件だけ維持します。

これは補足コンテキストの可視性にのみ影響し、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。トリガーの認可には、引き続き `groupPolicy`、`groups`、`groupAllowFrom`、および DM ポリシー設定が使用されます。

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

メンションによる制御と許可リストの動作については、[グループ](/ja-JP/channels/groups)を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前にメッセージを送り続けた場合、OpenClaw は同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに、短いクールダウン後にリマインダーの返信を送信することがあります。

共通の DM ペアリングフローとストレージ構成については、[ペアリング](/ja-JP/channels/pairing)を参照してください。

## ダイレクトルームの修復

ダイレクトメッセージの状態にずれが生じると、OpenClaw の古い `m.direct` マッピングが、現在使用中の DM ではなく、以前の 1 対 1 ルームを指すことがあります。相手の現在のマッピングを調べるには、次を実行します。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには、次を実行します。

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

どちらのコマンドも、複数アカウント構成では `--account <id>` を使用できます。修復フローは次のとおりです。

- `m.direct` にすでにマッピングされている厳密な 1 対 1 DM を優先します
- 見つからない場合は、そのユーザーと現在参加中の任意の厳密な 1 対 1 DM にフォールバックします
- 正常な DM が存在しない場合は、新しいダイレクトルームを作成し、`m.direct` を書き換えます

古いルームが自動的に削除されることはありません。正常な DM を選択してマッピングを更新することで、以後の Matrix 送信、検証通知、およびその他のダイレクトメッセージフローが正しいルームを対象とするようにします。

## 実行承認

Matrix はネイティブな承認クライアントとして機能できます。`channels.matrix.execApprovals`（アカウント単位でオーバーライドする場合は `channels.matrix.accounts.<account>.execApprovals`）で設定します。

- `enabled`: Matrix ネイティブのプロンプトを通じて承認を配信します。未設定または `"auto"` の場合、少なくとも 1 人の承認者を解決できるようになると自動的に有効になります。明示的に無効にするには `false` を設定します。
- `approvers`: 実行リクエストを承認できる Matrix ユーザー ID（`@owner:example.org`）です。`channels.matrix.dm.allowFrom` にフォールバックします。
- `target`: プロンプトの送信先です。`"dm"`（デフォルト）は承認者の DM に送信し、`"channel"` は送信元のルームまたは DM に送信し、`"both"` は両方に送信します。
- `agentFilter` / `sessionFilter`: Matrix 配信をトリガーするエージェント／セッションを限定する任意の許可リストです。

認可方法は承認の種類によって若干異なります。

- **実行承認**では `execApprovals.approvers` を使用し、設定されていない場合は `dm.allowFrom` にフォールバックします。
- **Plugin 承認**では `dm.allowFrom` のみを使用して認可します。

どちらの種類でも、Matrix のリアクションショートカットとメッセージ更新を共有します。承認者には、主要な承認メッセージ上に次のリアクションショートカットが表示されます。

- ✅ 1 回のみ許可
- ❌ 拒否
- ♾️ 常に許可（有効な実行ポリシーで許可されている場合）

代替のスラッシュコマンド: `/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

解決済みの承認者だけが承認または拒否できます。実行承認をチャンネルに配信すると、コマンドテキストも含まれます。`channel` または `both` は、信頼できるルームでのみ有効にしてください。

関連項目: [実行承認](/ja-JP/tools/exec-approvals)。

## スラッシュコマンド

スラッシュコマンド（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` など）は、DM で直接動作します。ルームでは、OpenClaw はボット自身の Matrix メンションを前置したコマンドも認識します。そのため、`@bot:server /new` はカスタムのメンション正規表現なしでコマンド経路をトリガーします。これにより、Element などのクライアントで、ユーザーがコマンドを入力する前にボット名をタブ補完したときに送信される、ルーム形式の `@mention /command` 投稿にもボットが応答できます。

認可ルールは引き続き適用されます。コマンドの送信者は、通常のメッセージと同じ DM またはルームの許可リスト／所有者ポリシーを満たす必要があります。

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

- アカウント側で上書きされない限り、トップレベルの `channels.matrix` の値が名前付きアカウントのデフォルトとして機能します。
- 継承されたルームエントリを特定のアカウントに限定するには、`groups.<room>.account` を使用します。`account` のないエントリはアカウント間で共有されます。デフォルトアカウントがトップレベルで設定されている場合も、`account: "default"` は引き続き機能します。

**デフォルトアカウントの選択:**

- 暗黙的なルーティング、プローブ、CLI コマンドで優先する名前付きアカウントを選択するには、`defaultAccount` を設定します。
- 複数のアカウントがあり、そのうちの 1 つが文字どおり `default` という名前の場合、`defaultAccount` が未設定でも OpenClaw はそのアカウントを暗黙的に使用します。
- 複数の名前付きアカウントがあり、デフォルトが選択されていない場合、CLI コマンドは推測を拒否します。`defaultAccount` を設定するか、`--account <id>` を渡してください。
- トップレベルの `channels.matrix.*` ブロックは、認証情報が完全な場合（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）にのみ、暗黙的な `default` アカウントとして扱われます。キャッシュ済みの認証情報で認証を満たせるようになると、名前付きアカウントは `homeserver` + `userId` から引き続き検出できます。

**昇格:**

- 修復またはセットアップ中に OpenClaw が単一アカウント設定を複数アカウント設定へ昇格する際、既存の名前付きアカウントがある場合、または `defaultAccount` がすでに名前付きアカウントを指している場合は、そのアカウントを維持します。昇格したアカウントへ移動するのは Matrix の認証およびブートストラップ用キーのみで、共有の配信ポリシー用キーはトップレベルに残ります。

共有の複数アカウントパターンについては、[設定リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## プライベート/LAN ホームサーバー

デフォルトでは、アカウントごとに明示的に許可しない限り、OpenClaw は SSRF 対策としてプライベートまたは内部の Matrix ホームサーバーをブロックします。

ホームサーバーが localhost、LAN/Tailscale IP、または内部ホスト名で稼働している場合は、そのアカウントで `network.dangerouslyAllowPrivateNetwork` を有効にします。

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

この明示的な許可は、信頼されたプライベートまたは内部のターゲットのみを許可します。`http://matrix.example.org:8008` のようなパブリックな平文通信のホームサーバーは、引き続きブロックされます。可能な限り `https://` を使用してください。

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

名前付きアカウントでは、`channels.matrix.accounts.<id>.proxy` を使用してトップレベルのデフォルトを上書きできます。OpenClaw は、実行時の Matrix トラフィックとアカウント状態のプローブに同じプロキシ設定を使用します。

## ターゲットの解決

OpenClaw がルームまたはユーザーのターゲットを要求する箇所では、Matrix は次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

MatrixルームIDでは大文字と小文字が区別されます。明示的な配信先、Cronジョブ、バインディング、許可リストを設定する際は、MatrixのルームIDと大文字・小文字が完全に一致するものを使用してください。OpenClawは保存用の内部セッションキーを正規化するため、小文字化されたキーはMatrix配信IDの信頼できる情報源にはなりません。

ライブディレクトリ検索では、ログイン中のMatrixアカウントを使用します。

- ユーザー検索では、そのホームサーバーのMatrixユーザーディレクトリに問い合わせます。
- ルーム検索では、明示的なルームIDとエイリアスを直接受け付けます。参加済みルームの名前検索はベストエフォートであり、`dangerouslyAllowNameMatching: true`が設定されている場合に限り、実行時のルーム許可リストに適用されます。
- ルーム名をIDまたはエイリアスに解決できない場合、実行時の許可リスト解決では無視されます。

## 設定リファレンス

許可リスト形式のユーザーフィールド（`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`）には、完全なMatrixユーザーIDを指定できます（最も安全です）。ID以外のエントリはデフォルトで無視されます。`dangerouslyAllowNameMatching: true`が設定されている場合、Matrixディレクトリ内の表示名との完全一致が、起動時およびモニター実行中に許可リストが変更されるたびに解決されます。解決できないエントリは実行時に無視されます。

ルーム許可リストのキー（`groups`、従来の`rooms`）には、ルームIDまたはエイリアスを使用してください。単純なルーム名のキーはデフォルトで無視されます。`dangerouslyAllowNameMatching: true`を設定すると、参加済みルーム名に対するベストエフォート検索が再び有効になります。

### アカウントと接続

- `enabled`: チャンネルを有効または無効にします。
- `name`: アカウントの任意の表示ラベルです。
- `defaultAccount`: 複数のMatrixアカウントが設定されている場合に優先するアカウントIDです。
- `accounts`: 名前付きのアカウントごとのオーバーライドです。トップレベルの`channels.matrix`の値がデフォルトとして継承されます。
- `homeserver`: ホームサーバーのURLです（例: `https://matrix.example.org`）。
- `network.dangerouslyAllowPrivateNetwork`: このアカウントに`localhost`、LAN/Tailscale IP、または内部ホスト名への接続を許可します。
- `proxy`: Matrixトラフィック用の任意のHTTP(S)プロキシURLです。アカウントごとのオーバーライドに対応しています。
- `userId`: 完全なMatrixユーザーID（`@bot:example.org`）です。
- `accessToken`: トークンベース認証用のアクセストークンです。env/file/execプロバイダーでプレーンテキスト値とSecretRef値に対応しています（[シークレット管理](/ja-JP/gateway/secrets)）。
- `password`: パスワードベースのログインに使用するパスワードです。プレーンテキスト値とSecretRef値に対応しています。
- `deviceId`: 明示的なMatrixデバイスIDです。
- `deviceName`: パスワードログイン時に使用するデバイス表示名です。
- `avatarUrl`: プロフィール同期および`profile set`による更新に使用する、保存済みの自身のアバターURLです。
- `initialSyncLimit`: 起動時の同期で取得するイベントの最大数です。

### 暗号化

- `encryption`: E2EEを有効にします。デフォルト: `false`。
- `startupVerification`: `"if-unverified"`（E2EEが有効な場合のデフォルト）または`"off"`です。このデバイスが未検証の場合、起動時に自己検証を自動で要求します。
- `startupVerificationCooldownHours`: 次回の自動起動時要求までのクールダウン時間です。デフォルト: `24`。

### アクセスとポリシー

- `groupPolicy`: `"open"`、`"allowlist"`、または`"disabled"`です。デフォルト: `"allowlist"`。
- `groupAllowFrom`: ルームトラフィックを許可するユーザーIDの許可リストです。
- `mentionPatterns`: ルームメンション用のスコープ付き正規表現パターンです。`{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`形式のオブジェクトです。設定された`agents.list[].groupChat.mentionPatterns`をルームごとに適用するかどうかを制御します。
- `dm.enabled`: `false`の場合、すべてのDMを無視します。デフォルト: `true`。
- `dm.policy`: `"pairing"`（デフォルト）、`"allowlist"`、`"open"`、または`"disabled"`です。ボットが参加し、そのルームをDMとして分類した後に適用されます。招待処理には影響しません。
- `dm.allowFrom`: DMトラフィックを許可するユーザーIDの許可リストです。
- `dm.sessionScope`: `"per-user"`（デフォルト）または`"per-room"`です。
- `dm.threadReplies`: 返信のスレッド化に対するDM専用のオーバーライド（`"off"`、`"inbound"`、`"always"`）です。
- `allowBots`: 設定済みの他のMatrixボットアカウントからのメッセージを受け入れます（`true`または`"mentions"`）。
- `allowlistOnly`: `true`の場合、すべての有効なDMポリシー（`"disabled"`を除く）および`"open"`のグループポリシーを`"allowlist"`に強制します。`"disabled"`ポリシーは変更しません。
- `dangerouslyAllowNameMatching`: `true`の場合、ユーザー許可リストのエントリに対するMatrix表示名のディレクトリ検索と、ルーム許可リストのキーに対する参加済みルーム名の検索を許可します。完全な`@user:server` ID、およびルームIDまたはエイリアスを優先してください。
- `autoJoin`: `"always"`、`"allowlist"`、または`"off"`です。デフォルト: `"off"`。DM形式の招待を含む、すべてのMatrix招待に適用されます。
- `autoJoinAllowlist`: `autoJoin`が`"allowlist"`の場合に許可されるルームまたはエイリアスです。エイリアスのエントリは、招待されたルームが提示する状態ではなく、ホームサーバーに対して解決されます。
- `contextVisibility`: 補足コンテキストの可視性（デフォルトは`"all"`、ほかに`"allowlist"`、`"allowlist_quote"`）です。

### 返信動作

- `replyToMode`: `"off"`（デフォルト）、`"first"`、`"all"`、または`"batched"`です。
- `threadReplies`: `"off"`（明示的に設定されていない場合、トップレベルのデフォルトは`"inbound"`に解決されます）、`"inbound"`、または`"always"`です。
- `threadBindings`: スレッドに紐づくセッションのルーティングとライフサイクルに対するチャンネルごとのオーバーライドです。
- `streaming`: `"off"`（デフォルト）、`"partial"`、`"quiet"`、`"progress"`、またはオブジェクト形式`{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`です。`true` <-> `"partial"`、`false` <-> `"off"`です。
- `blockStreaming`: `true`の場合、完了したアシスタントブロックを個別の進捗メッセージとして保持します。デフォルト: `false`。
- `markdown`: 送信テキスト用の任意のMarkdownレンダリング設定です。
- `responsePrefix`: 送信する返信の先頭に付加する任意の文字列です。
- `textChunkLimit`: `chunkMode: "length"`の場合の、文字数単位の送信チャンクサイズです。デフォルト: `4000`。
- `chunkMode`: `"length"`（デフォルト、文字数で分割）または`"newline"`（行の境界で分割）です。
- `historyLimit`: ルームメッセージがエージェントを起動した際に、`InboundHistory`として含める直近のルームメッセージ数です。`messages.groupChat.historyLimit`にフォールバックします。実効デフォルトは`0`（無効）です。
- `mediaMaxMb`: 送信および受信処理におけるメディアサイズの上限（MB）です。デフォルト: `20`。

### リアクション設定

- `ackReaction`: このチャンネルまたはアカウントに対する確認リアクションのオーバーライドです。
- `ackReactionScope`: スコープのオーバーライド（デフォルトは`"group-mentions"`、ほかに`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）です。
- `reactionNotifications`: 受信リアクションの通知モード（デフォルトは`"own"`、ほかに`"off"`）です。

### ツールとルームごとのオーバーライド

- `actions`: アクションごとのツール利用制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）です。
- `groups`: ルームごとのポリシーマップです。セッションIDには、解決後の安定したルームIDが使用されます。（`rooms`は従来のエイリアスです。）
  - `groups.<room>.account`: 継承された1つのルームエントリを特定のアカウントに制限します。
  - `groups.<room>.enabled`: ルームごとの切り替えです。`false`の場合、そのルームはマップに含まれていないものとして無視されます。
  - `groups.<room>.requireMention`: チャンネルレベルのメンション要件に対するルームごとのオーバーライドです。
  - `groups.<room>.allowBots`: チャンネルレベル設定に対するルームごとのオーバーライド（`true`または`"mentions"`）です。
  - `groups.<room>.botLoopProtection`: ボット間ループ保護の上限に対するルームごとのオーバーライドです。
  - `groups.<room>.users`: ルームごとの送信者許可リストです。
  - `groups.<room>.tools`: ルームごとのツール許可・拒否のオーバーライドです。
  - `groups.<room>.autoReply`: ルームごとのメンションゲートのオーバーライドです。`true`の場合、そのルームではメンション要件を無効にします。`false`の場合、メンション要件を強制的に再有効化します。
  - `groups.<room>.skills`: ルームごとのSkillsフィルターです。
  - `groups.<room>.systemPrompt`: ルームごとのシステムプロンプト断片です。

### Exec承認設定

- `execApprovals.enabled`: Matrixネイティブのプロンプトを通じてExec承認を配信します。
- `execApprovals.approvers`: 承認を許可されたMatrixユーザーIDです。`dm.allowFrom`にフォールバックします。
- `execApprovals.target`: `"dm"`（デフォルト）、`"channel"`、または`"both"`です。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 配信用の任意のエージェントまたはセッション許可リストです。

## 関連項目

- [チャンネルの概要](/ja-JP/channels) - 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM認証とペアリングのフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
