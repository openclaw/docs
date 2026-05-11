---
read_when:
    - OpenClawでMatrixを設定する
    - Matrix E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、設定例
title: マトリックス
x-i18n:
    generated_at: "2026-05-11T20:21:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix は OpenClaw 用のダウンロード可能なチャンネルPluginです。
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## インストール

チャンネルを設定する前に、ClawHub から Matrix をインストールします。

```bash
openclaw plugins install @openclaw/matrix
```

裸のPlugin指定は、まず ClawHub を試し、その後 npm にフォールバックします。レジストリソースを強制するには、`openclaw plugins install clawhub:@openclaw/matrix` または `openclaw plugins install npm:@openclaw/matrix` を使用します。

ローカルのチェックアウトから:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` はPluginを登録して有効化するため、別途 `openclaw plugins enable matrix` を実行する必要はありません。ただし、以下でチャンネルを設定するまではPluginは何もしません。Pluginの一般的な挙動とインストール規則については、[Plugins](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. 自分のホームサーバーで Matrix アカウントを作成します。
2. `channels.matrix` を `homeserver` + `accessToken`、または `homeserver` + `userId` + `password` のどちらかで設定します。
3. Gateway を再起動します。
4. ボットとの DM を開始するか、ルームに招待します（[自動参加](#auto-join) を参照。新しい招待は `autoJoin` が許可した場合にのみ反映されます）。

### 対話型セットアップ

```bash
openclaw channels add
openclaw configure --section channels
```

ウィザードは、ホームサーバー URL、認証方式（アクセストークンまたはパスワード）、ユーザー ID（パスワード認証のみ）、任意のデバイス名、E2EE を有効にするかどうか、ルームアクセスと自動参加を設定するかどうかを尋ねます。

一致する `MATRIX_*` 環境変数がすでに存在し、選択したアカウントに保存済みの認証情報がない場合、ウィザードは環境変数のショートカットを提示します。許可リストを保存する前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を実行します。E2EE が有効な場合、ウィザードは設定を書き込み、[`openclaw matrix encryption setup`](#encryption-and-verification) と同じブートストラップを実行します。

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

`channels.matrix.autoJoin` のデフォルトは `off` です。デフォルトでは、手動で参加するまで、新しい招待からの新しいルームや DM にボットは表示されません。

OpenClaw は招待時点で、招待されたルームが DM なのかグループなのかを判別できないため、DM 形式の招待を含むすべての招待はまず `autoJoin` を通ります。`dm.policy` はその後、ボットが参加し、ルームが分類されてから適用されます。

<Warning>
ボットが受け入れる招待を制限するには `autoJoin: "allowlist"` と `autoJoinAllowlist` を設定し、すべての招待を受け入れるには `autoJoin: "always"` を設定します。

`autoJoinAllowlist` が受け付けるのは安定したターゲットのみです: `!roomId:server`、`#alias:server`、または `*`。プレーンなルーム名は拒否されます。エイリアスのエントリは、招待されたルームが主張する状態ではなく、ホームサーバーに対して解決されます。
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

### 許可リストターゲット形式

DM とルームの許可リストには、安定した ID を設定するのが最適です。

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）: `@user:server` を使用します。表示名は変更可能なため、デフォルトでは無視されます。表示名エントリとの互換性が明示的に必要な場合にのみ、`dangerouslyAllowNameMatching: true` を設定してください。
- ルーム許可リストキー（`groups`、レガシー `rooms`）: `!room:server` または `#alias:server` を使用します。プレーンなルーム名はデフォルトでは無視されます。参加済みルーム名の検索との互換性が明示的に必要な場合にのみ、`dangerouslyAllowNameMatching: true` を設定してください。
- 招待許可リスト（`autoJoinAllowlist`）: `!room:server`、`#alias:server`、または `*` を使用します。プレーンなルーム名は拒否されます。

### アカウント ID の正規化

ウィザードは、わかりやすい名前を正規化されたアカウント ID に変換します。たとえば、`Ops Bot` は `ops-bot` になります。2 つのアカウントが衝突しないように、スコープ付き環境変数名では句読点がエスケープされます。`-` → `_X2D_` なので、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` にマップされます。

### キャッシュされた認証情報

Matrix はキャッシュされた認証情報を `~/.openclaw/credentials/matrix/` に保存します。

- デフォルトアカウント: `credentials.json`
- 名前付きアカウント: `credentials-<account>.json`

そこにキャッシュされた認証情報が存在する場合、アクセストークンが設定ファイルにない場合でも、OpenClaw は Matrix が設定済みであると扱います。これはセットアップ、`openclaw doctor`、チャンネル状態プローブをカバーします。

### 環境変数

同等の設定キーが設定されていない場合に使用されます。デフォルトアカウントは接頭辞なしの名前を使用し、名前付きアカウントはサフィックスの前にアカウント ID を挿入します。

| デフォルトアカウント  | 名前付きアカウント（`<ID>` は正規化されたアカウント ID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

アカウント `ops` の場合、名前は `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` などになります。リカバリキーの環境変数は、`--recovery-key-stdin` でキーをパイプ入力する場合に、リカバリ対応の CLI フロー（`verify backup restore`、`verify device`、`verify bootstrap`）によって読み取られます。

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

Matrix の返信ストリーミングはオプトインです。`streaming` は OpenClaw が生成中のアシスタント返信をどのように配信するかを制御し、`blockStreaming` は完了した各ブロックをそれぞれ独立した Matrix メッセージとして保持するかどうかを制御します。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

ライブ回答プレビューを維持しつつ、途中のツール/進行状況行を非表示にするには、オブジェクト形式を使用します。

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

| `streaming`       | 挙動                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（デフォルト） | 完全な返信を待ってから一度だけ送信します。`true` ↔ `"partial"`、`false` ↔ `"off"`。                                                                                 |
| `"partial"`       | モデルが現在のブロックを書き込む間、通常のテキストメッセージ 1 件をその場で編集します。標準の Matrix クライアントは、最終編集ではなく最初のプレビューで通知する場合があります。 |
| `"quiet"`         | `"partial"` と同じですが、メッセージは通知しない notice になります。受信者は、ユーザーごとのプッシュルールが確定済み編集に一致した場合にのみ通知を受け取ります（以下を参照）。 |

`blockStreaming` は `streaming` から独立しています。

| `streaming`             | `blockStreaming: true`                                  | `blockStreaming: false`（デフォルト）                 |
| ----------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 現在のブロックのライブ下書き、完了したブロックはメッセージとして保持 | 現在のブロックのライブ下書き、その場で確定             |
| `"off"`                 | 完了したブロックごとに通知する Matrix メッセージ 1 件     | 完全な返信に対して通知する Matrix メッセージ 1 件      |

注:

- プレビューが Matrix のイベントごとのサイズ制限を超えて大きくなった場合、OpenClaw はプレビューストリーミングを停止し、最終版のみの配信にフォールバックします。
- メディア返信は常に通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClaw は最終的なメディア返信を送信する前にそれを redacts します。
- Matrix のプレビューストリーミングが有効な場合、ツール進行状況のプレビュー更新はデフォルトで有効です。回答テキストのプレビュー編集は維持しつつ、ツール進行状況を通常の配信経路のままにするには、`streaming.preview.toolProgress: false` を設定します。
- プレビュー編集には追加の Matrix API 呼び出しが必要です。最も保守的なレート制限プロファイルにしたい場合は、`streaming: "off"` のままにしてください。

## 承認メタデータ

Matrix ネイティブの承認プロンプトは、`com.openclaw.approval` の下に OpenClaw 固有のカスタムイベントコンテンツを持つ通常の `m.room.message` イベントです。Matrix はカスタムイベントコンテンツキーを許可しているため、標準クライアントは引き続きテキスト本文を表示し、OpenClaw 対応クライアントは構造化された承認 ID、種類、状態、利用可能な判断、exec/Plugin の詳細を読み取れます。

承認プロンプトが 1 つの Matrix イベントには長すぎる場合、OpenClaw は表示テキストを分割し、最初のチャンクにのみ `com.openclaw.approval` を添付します。許可/拒否判断のリアクションはその最初のイベントに紐づくため、長いプロンプトでも単一イベントのプロンプトと同じ承認ターゲットを維持します。

### quiet 確定プレビュー向けのセルフホスト型プッシュルール

`streaming: "quiet"` は、ブロックまたはターンが確定したときにのみ受信者へ通知します。ユーザーごとのプッシュルールが、確定済みプレビューマーカーに一致する必要があります。完全な手順（受信者トークン、pusher チェック、ルールのインストール、ホームサーバーごとの注記）については、[quiet プレビュー向け Matrix プッシュルール](/ja-JP/channels/matrix-push-rules) を参照してください。

## ボット間ルーム

デフォルトでは、他の設定済み OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。

意図的にエージェント間の Matrix トラフィックを有効にしたい場合は、`allowBots` を使用します。

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

- `allowBots: true` は、許可されたルームと DM 内で、他の設定済み Matrix ボットアカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルーム内でこのボットに見える形でメンションしている場合にのみ、それらのメッセージを受け入れます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベルの設定を上書きします。
- OpenClaw は自己返信ループを避けるため、同じ Matrix ユーザー ID からのメッセージは引き続き無視します。
- Matrix はここでネイティブなボットフラグを公開していません。OpenClaw は「ボット作成」を「この OpenClaw Gateway 上の別の設定済み Matrix アカウントによって送信されたもの」として扱います。

共有ルームでボット間トラフィックを有効にする場合は、厳密なルーム許可リストとメンション要件を使用してください。

## 暗号化と検証

暗号化された (E2EE) ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューも完全な添付ファイルとともに暗号化されます。暗号化されていないルームでは、引き続き通常の `thumbnail_url` を使用します。設定は不要です - Plugin が E2EE 状態を自動的に検出します。

すべての `openclaw matrix` コマンドは、`--verbose` (完全な診断)、`--json` (機械可読出力)、`--account <id>` (複数アカウント設定) を受け付けます。出力はデフォルトで簡潔で、内部 SDK ログは静かです。以下の例は標準形式を示しています。必要に応じてフラグを追加してください。

### 暗号化を有効化

```bash
openclaw matrix encryption setup
```

シークレットストレージとクロス署名をブートストラップし、必要に応じてルームキーのバックアップを作成してから、状態と次の手順を出力します。有用なフラグ:

- `--recovery-key <key>` ブートストラップ前にリカバリーキーを適用します (以下で説明する stdin 形式を推奨)
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄し、新しいものを作成します (意図した場合のみ使用)

新しいアカウントでは、作成時に E2EE を有効にします:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` は `--enable-e2ee` のエイリアスです。

手動設定の同等例:

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

`verify status` は 3 つの独立した信頼シグナルを報告します (`--verbose` ではすべて表示されます):

- `Locally trusted`: このクライアントでのみ信頼されています
- `Cross-signing verified`: SDK がクロス署名による検証を報告しています
- `Signed by owner`: 自分自身の自己署名キーで署名されています (診断専用)

`Verified by owner` は、`Cross-signing verified` が `yes` の場合にのみ `yes` になります。ローカル信頼またはオーナー署名だけでは不十分です。

`--allow-degraded-local-state` は、Matrix アカウントを事前に準備せずにベストエフォートの診断を返します。オフラインまたは部分的に設定されたプローブに便利です。

### リカバリーキーでこのデバイスを検証

リカバリーキーは機密情報です - コマンドラインで渡すのではなく stdin 経由でパイプしてください。`MATRIX_RECOVERY_KEY` (または名前付きアカウントの場合は `MATRIX_<ID>_RECOVERY_KEY`) を設定します:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

このコマンドは 3 つの状態を報告します:

- `Recovery key accepted`: Matrix がシークレットストレージまたはデバイス信頼のためにキーを受け入れました。
- `Backup usable`: 信頼済みのリカバリー素材でルームキーのバックアップを読み込めます。
- `Device verified by owner`: このデバイスは完全な Matrix クロス署名 ID の信頼を持っています。

リカバリーキーがバックアップ素材のロックを解除した場合でも、完全な ID 信頼が未完了なら非ゼロで終了します。その場合は、別の Matrix クライアントから自己検証を完了してください:

```bash
openclaw matrix verify self
```

`verify self` は、`Cross-signing verified: yes` になるまで待ってから正常終了します。待機時間を調整するには `--timeout-ms <ms>` を使用します。

リテラルキー形式の `openclaw matrix verify device "<recovery-key>"` も受け付けますが、キーはシェル履歴に残ります。

### クロス署名のブートストラップまたは修復

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` は、暗号化アカウント向けの修復およびセットアップコマンドです。順に、次を行います:

- 可能な場合は既存のリカバリーキーを再利用して、シークレットストレージをブートストラップします
- クロス署名をブートストラップし、不足している公開キーをアップロードします
- 現在のデバイスをマークし、クロス署名します
- まだ存在しない場合は、サーバー側のルームキーバックアップを作成します

homeserver がクロス署名キーのアップロードに UIA を必要とする場合、OpenClaw は最初に認証なしを試し、次に `m.login.dummy`、その次に `m.login.password` を試します (`channels.matrix.password` が必要)。

有用なフラグ:

- `--recovery-key-stdin` (`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` と組み合わせる) または `--recovery-key <key>`
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄します (意図した場合のみ)

### ルームキーバックアップ

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` は、サーバー側バックアップが存在するか、このデバイスで復号できるかを示します。`backup restore` は、バックアップ済みのルームキーをローカルの暗号ストアにインポートします。リカバリーキーがすでにディスク上にある場合は、`--recovery-key-stdin` を省略できます。

壊れたバックアップを新しいベースラインに置き換えるには (復旧不能な古い履歴の喪失を受け入れます。現在のバックアップシークレットを読み込めない場合はシークレットストレージも再作成できます):

```bash
openclaw matrix verify backup reset --yes
```

以前のリカバリーキーで新しいバックアップベースラインを解除できないようにしたい場合にのみ、`--rotate-recovery-key` を追加します。

### 検証の一覧表示、要求、応答

```bash
openclaw matrix verify list
```

選択したアカウントの保留中の検証要求を一覧表示します。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

この OpenClaw アカウントから検証要求を送信します。`--own-user` は自己検証を要求します (同じユーザーの別の Matrix クライアントでプロンプトを承認します)。`--user-id`/`--device-id`/`--room-id` は他者を対象にします。`--own-user` は他の対象指定フラグと組み合わせることはできません。

より低レベルのライフサイクル処理では、通常、別のクライアントからの受信要求を追跡しているときに、これらのコマンドは特定の要求 `<id>` (`verify list` と `verify request` によって出力されます) に作用します:

| コマンド                                   | 目的                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 受信要求を承認します                                                |
| `openclaw matrix verify start <id>`        | SAS フローを開始します                                              |
| `openclaw matrix verify sas <id>`          | SAS の絵文字または小数を出力します                                  |
| `openclaw matrix verify confirm-sas <id>`  | SAS が相手側クライアントに表示されたものと一致することを確認します  |
| `openclaw matrix verify mismatch-sas <id>` | 絵文字または小数が一致しない場合に SAS を拒否します                 |
| `openclaw matrix verify cancel <id>`       | キャンセルします。任意の `--reason <text>` と `--code <matrix-code>` を取ります |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas`、`cancel` はすべて、検証が特定のダイレクトメッセージルームにひも付いている場合の DM フォローアップヒントとして、`--user-id` と `--room-id` を受け付けます。

### 複数アカウントの注意事項

`--account <id>` なしでは、Matrix CLI コマンドは暗黙のデフォルトアカウントを使用します。複数の名前付きアカウントがあり、`channels.matrix.defaultAccount` を設定していない場合、推測を拒否し、選択を求めます。名前付きアカウントで E2EE が無効または利用不可の場合、エラーはそのアカウントの設定キーを示します。例: `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="起動時の動作">
    `encryption: true` では、`startupVerification` のデフォルトは `"if-unverified"` です。起動時に未検証のデバイスは別の Matrix クライアントで自己検証を要求し、重複をスキップしてクールダウンを適用します (デフォルトは 24 時間)。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効化します。

    起動時には、現在のシークレットストレージとクロス署名 ID を再利用する保守的な暗号ブートストラップ処理も実行されます。ブートストラップ状態が壊れている場合、OpenClaw は `channels.matrix.password` がなくても保護された修復を試みます。homeserver がパスワード UIA を要求する場合、起動時に警告をログ出力し、致命的には扱いません。すでにオーナー署名済みのデバイスは保持されます。

    完全なアップグレードフローについては、[Matrix 移行](/ja-JP/channels/matrix-migration) を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は、厳密な DM 検証ルームに `m.notice` メッセージとして検証ライフサイクル通知を投稿します: 要求、準備完了 (「絵文字で検証」の案内付き)、開始/完了、利用可能な場合は SAS (絵文字/小数) の詳細。

    別の Matrix クライアントからの受信要求は追跡され、自動承認されます。自己検証の場合、OpenClaw は SAS フローを自動的に開始し、絵文字検証が利用可能になると自分側を確認します - それでも Matrix クライアントで比較し、「一致します」を確認する必要があります。

    検証システム通知はエージェントチャットパイプラインに転送されません。

  </Accordion>

  <Accordion title="削除済みまたは無効な Matrix デバイス">
    `verify status` が現在のデバイスは homeserver にもう一覧表示されていないと示す場合、新しい OpenClaw Matrix デバイスを作成します。パスワードログインの場合:

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

    失敗したコマンドのアカウント ID で `assistant` を置き換えるか、デフォルトアカウントの場合は `--account` を省略します。

  </Accordion>

  <Accordion title="デバイス管理">
    古い OpenClaw 管理デバイスが蓄積することがあります。一覧表示して削除します:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="暗号ストア">
    Matrix E2EE は、IndexedDB shim として `fake-indexeddb` を使用する公式の `matrix-js-sdk` Rust 暗号パスを使用します。暗号状態は `crypto-idb-snapshot.json` に永続化されます (制限付きファイル権限)。

    暗号化された実行時状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下にあり、同期ストア、暗号ストア、リカバリーキー、IDB スナップショット、スレッドバインディング、起動時検証状態を含みます。トークンが変わってもアカウント ID が同じままの場合、OpenClaw は最適な既存ルートを再利用するため、以前の状態は引き続き表示されます。

  </Accordion>
</AccordionGroup>

## プロファイル管理

選択したアカウントの Matrix 自己プロファイルを更新します:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

1 回の呼び出しで両方のオプションを渡せます。Matrix は `mxc://` アバター URL を直接受け付けます。`http://` または `https://` を渡した場合、OpenClaw は最初にファイルをアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl` (またはアカウントごとの上書き) に保存します。

## スレッド

Matrix は、自動返信とメッセージツール送信の両方で、ネイティブ Matrix スレッドをサポートします。2 つの独立したノブで動作を制御します:

### セッションルーティング (`sessionScope`)

`dm.sessionScope` は、Matrix DM ルームを OpenClaw セッションにどのように対応付けるかを決定します:

- `"per-user"` (デフォルト): 同じルーティング先ピアを持つすべての DM ルームが 1 つのセッションを共有します。
- `"per-room"`: ピアが同じでも、各 Matrix DM ルームが独自のセッションキーを持ちます。

明示的な会話バインディングは常に `sessionScope` より優先されるため、バインド済みのルームとスレッドは選択されたターゲットセッションを維持します。

### 返信スレッド化 (`threadReplies`)

`threadReplies` は、bot が返信を投稿する場所を決定します:

- `"off"`: 返信はトップレベルです。受信したスレッド内メッセージは親セッションに残ります。
- `"inbound"`: 受信メッセージがすでにそのスレッド内にある場合にのみ、スレッド内で返信します。
- `"always"`: トリガーとなったメッセージをルートとするスレッド内で返信します。その会話は最初のトリガー以降、対応するスレッドスコープのセッションを通じてルーティングされます。

`dm.threadReplies` は DM のみに対してこれを上書きします - たとえば、ルームスレッドを分離したまま、DM はフラットに保てます。

### スレッド継承とスラッシュコマンド

- インバウンドのスレッド化メッセージには、追加のエージェントコンテキストとしてスレッドルートメッセージが含まれます。
- メッセージツール送信は、同じ部屋（または同じ DM ユーザーターゲット）を対象にする場合、明示的な `threadId` が指定されていなければ、現在の Matrix スレッドを自動的に継承します。
- DM ユーザーターゲットの再利用は、現在のセッションメタデータが同じ Matrix アカウント上の同じ DM 相手であることを証明する場合にのみ有効になります。それ以外の場合、OpenClaw は通常のユーザースコープのルーティングにフォールバックします。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドにバインドされた `/acp spawn` は、すべて Matrix の部屋と DM で動作します。
- トップレベルの `/focus` は、`threadBindings.spawnSessions` が有効な場合、新しい Matrix スレッドを作成し、それをターゲットセッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、そのスレッドがその場でバインドされます。

OpenClaw が、同じ共有セッション上で別の DM 部屋と衝突している Matrix DM 部屋を検出すると、その部屋に 1 回限りの `m.notice` を投稿し、`/focus` という回避手段を示して `dm.sessionScope` の変更を提案します。この通知は、スレッドバインディングが有効な場合にのみ表示されます。

## ACP 会話バインディング

Matrix の部屋、DM、および既存の Matrix スレッドは、チャットサーフェスを変更せずに永続的な ACP ワークスペースに変換できます。

高速なオペレーターフロー:

- 使い続けたい Matrix DM、部屋、または既存スレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM または部屋では、現在の DM/部屋がチャットサーフェスのまま残り、以降のメッセージは生成された ACP セッションにルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` が現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

注意:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnSessions` は `/acp spawn --thread auto|here` を制御します。ここで OpenClaw は子 Matrix スレッドを作成またはバインドする必要があります。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバル既定値を継承し、チャンネルごとの上書きもサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix のスレッドバインドセッション生成は既定で有効です。

- トップレベルの `/focus` と `/acp spawn --thread auto|here` が Matrix スレッドを作成/バインドしないようにするには、`threadBindings.spawnSessions: false` を設定します。
- ネイティブサブエージェントのスレッド生成で親トランスクリプトをフォークしないようにするには、`threadBindings.defaultSpawnContext: "isolated"` を設定します。

## リアクション

Matrix はアウトバウンドリアクション、インバウンドリアクション通知、確認応答リアクションをサポートします。

アウトバウンドリアクションツールは `channels.matrix.actions.reactions` によって制御されます。

- `react` は Matrix イベントにリアクションを追加します。
- `reactions` は Matrix イベントの現在のリアクション要約を一覧表示します。
- `emoji=""` はそのイベント上のボット自身のリアクションを削除します。
- `remove: true` はボットから指定された絵文字リアクションだけを削除します。

**解決順序**（最初に定義された値が優先されます）:

| 設定                    | 順序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | アカウントごと → チャンネル → `messages.ackReaction` → エージェント ID 絵文字フォールバック |
| `ackReactionScope`      | アカウントごと → チャンネル → `messages.ackReactionScope` → 既定値 `"group-mentions"` |
| `reactionNotifications` | アカウントごと → チャンネル → 既定値 `"own"`                                      |

`reactionNotifications: "own"` は、ボットが作成した Matrix メッセージを対象にして追加された `m.reaction` イベントを転送します。`"off"` はリアクションシステムイベントを無効にします。Matrix はリアクションの削除を単独の `m.reaction` 削除としてではなくリダクションとして表すため、リアクション削除はシステムイベントとして合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix の部屋メッセージがエージェントをトリガーしたときに、直近の部屋メッセージをいくつ `InboundHistory` として含めるかを制御します。`messages.groupChat.historyLimit` にフォールバックします。両方が未設定の場合、有効な既定値は `0` です。無効にするには `0` を設定します。
- Matrix の部屋履歴は部屋専用です。DM は通常のセッション履歴を引き続き使用します。
- Matrix の部屋履歴は保留中のみです。OpenClaw はまだ返信をトリガーしていない部屋メッセージをバッファし、メンションまたはその他のトリガーが到着したときにそのウィンドウのスナップショットを取得します。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメインのインバウンド本文に残ります。
- 同じ Matrix イベントの再試行では、新しい部屋メッセージへ進まず、元の履歴スナップショットを再利用します。

## コンテキスト可視性

Matrix は、取得された返信テキスト、スレッドルート、保留中の履歴などの補助的な部屋コンテキストに対して、共有の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` が既定です。補助コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブな部屋/ユーザー許可リストチェックで許可された送信者に補助コンテキストをフィルタリングします。
- `contextVisibility: "allowlist_quote"` は `allowlist` のように動作しますが、明示的に引用された返信を 1 つ保持します。

この設定は補助コンテキストの可視性に影響します。インバウンドメッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガー認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、および DM ポリシー設定から決まります。

## DM と部屋のポリシー

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

部屋を動作させたまま DM を完全に抑止するには、`dm.enabled: false` を設定します。

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

メンションゲートと許可リストの動作については、[グループ](/ja-JP/channels/groups)を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前にメッセージを送り続ける場合、OpenClaw は同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに短いクールダウン後にリマインダー返信を送ることがあります。

共有 DM ペアリングフローとストレージレイアウトについては、[ペアリング](/ja-JP/channels/pairing)を参照してください。

## ダイレクト部屋の修復

ダイレクトメッセージ状態が同期しなくなると、OpenClaw は実際の DM ではなく古い単独部屋を指す古い `m.direct` マッピングを持つことがあります。相手の現在のマッピングを検査します。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復します。

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

どちらのコマンドも、マルチアカウント構成向けに `--account <id>` を受け付けます。修復フローは次のとおりです。

- `m.direct` にすでにマッピングされている厳密な 1:1 DM を優先します
- そのユーザーと現在参加中の任意の厳密な 1:1 DM にフォールバックします
- 正常な DM が存在しない場合、新しいダイレクト部屋を作成し、`m.direct` を書き換えます

古い部屋は自動的には削除しません。正常な DM を選択してマッピングを更新し、以降の Matrix 送信、検証通知、およびその他のダイレクトメッセージフローが正しい部屋を対象にするようにします。

## 実行承認

Matrix はネイティブ承認クライアントとして動作できます。`channels.matrix.execApprovals`（またはアカウントごとの上書きには `channels.matrix.accounts.<account>.execApprovals`）配下で設定します。

- `enabled`: Matrix ネイティブのプロンプトを通じて承認を配信します。未設定または `"auto"` の場合、少なくとも 1 人の承認者を解決できると Matrix が自動的に有効になります。明示的に無効にするには `false` を設定します。
- `approvers`: 実行リクエストを承認できる Matrix ユーザー ID（`@owner:example.org`）。省略可能です。`channels.matrix.dm.allowFrom` にフォールバックします。
- `target`: プロンプトの送信先です。`"dm"`（既定）は承認者の DM に送信します。`"channel"` は発信元の Matrix 部屋または DM に送信します。`"both"` は両方に送信します。
- `agentFilter` / `sessionFilter`: どのエージェント/セッションが Matrix 配信をトリガーするかを指定する省略可能な許可リストです。

承認の種類によって、認可は少し異なります。

- **実行承認** は `execApprovals.approvers` を使用し、`dm.allowFrom` にフォールバックします。
- **Plugin 承認** は `dm.allowFrom` のみを通じて認可します。

どちらの種類も、Matrix のリアクションショートカットとメッセージ更新を共有します。承認者は、主要な承認メッセージ上にリアクションショートカットを確認できます。

- `✅` 1 回だけ許可
- `❌` 拒否
- `♾️` 常に許可（有効な実行ポリシーで許可されている場合）

フォールバックのスラッシュコマンド: `/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

解決済みの承認者だけが承認または拒否できます。実行承認のチャンネル配信にはコマンドテキストが含まれます。`channel` または `both` は信頼できる部屋でのみ有効にしてください。

関連: [実行承認](/ja-JP/tools/exec-approvals)。

## スラッシュコマンド

スラッシュコマンド（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` など）は DM で直接動作します。部屋では、OpenClaw はボット自身の Matrix メンションで始まるコマンドも認識するため、`@bot:server /new` はカスタムメンション正規表現なしでコマンドパスをトリガーします。これにより、ユーザーがコマンドを入力する前にボットをタブ補完したときに Element や類似クライアントが発行する、部屋形式の `@mention /command` 投稿にもボットが応答できます。

認可ルールは引き続き適用されます。コマンド送信者は、通常メッセージと同じ DM または部屋の許可リスト/所有者ポリシーを満たす必要があります。

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

- トップレベルの `channels.matrix` の値は、アカウントが上書きしない限り、名前付きアカウントの既定値として動作します。
- 継承された部屋エントリを `groups.<room>.account` で特定のアカウントにスコープします。`account` のないエントリはアカウント間で共有されます。既定アカウントがトップレベルで設定されている場合でも、`account: "default"` は引き続き機能します。

**既定アカウントの選択:**

- 暗黙的なルーティング、プローブ、および CLI コマンドで優先する名前付きアカウントを選ぶには、`defaultAccount` を設定します。
- 複数のアカウントがあり、そのうち 1 つの名前が文字どおり `default` の場合、`defaultAccount` が未設定でも OpenClaw はそれを暗黙的に使用します。
- 複数の名前付きアカウントがあり、既定が選択されていない場合、CLI コマンドは推測を拒否します。`defaultAccount` を設定するか、`--account <id>` を渡してください。
- トップレベルの `channels.matrix.*` ブロックは、認証が完全な場合（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）にのみ、暗黙的な `default` アカウントとして扱われます。名前付きアカウントは、キャッシュされた認証情報が認証をカバーしていれば、`homeserver` + `userId` から引き続き検出できます。

**昇格:**

- OpenClaw が修復またはセットアップ中に単一アカウント設定をマルチアカウントへ昇格するとき、既存の名前付きアカウントが存在する場合、または `defaultAccount` がすでにその 1 つを指している場合は、それを保持します。Matrix の認証/ブートストラップキーだけが昇格後のアカウントへ移動し、共有配信ポリシーキーはトップレベルに残ります。

共有マルチアカウントパターンについては、[設定リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## プライベート/LAN ホームサーバー

既定では、OpenClaw は SSRF 保護のため、アカウントごとに明示的にオプトインしない限り、プライベート/内部 Matrix ホームサーバーをブロックします。

ホームサーバーが localhost、LAN/Tailscale IP、または内部ホスト名で稼働している場合は、その Matrix アカウントで `network.dangerouslyAllowPrivateNetwork` を有効にします。

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
`http://matrix.example.org:8008` のような公開クリアテキスト homeserver は引き続きブロックされます。可能な限り `https://` を優先してください。

## Matrix トラフィックのプロキシ

Matrix デプロイメントに明示的な送信 HTTP(S) プロキシが必要な場合は、`channels.matrix.proxy` を設定します。

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

名前付きアカウントは、`channels.matrix.accounts.<id>.proxy` でトップレベルのデフォルトをオーバーライドできます。
OpenClaw は、ランタイムの Matrix トラフィックとアカウント状態プローブに同じプロキシ設定を使用します。

## ターゲット解決

OpenClaw がルームまたはユーザーターゲットを要求する任意の場所で、Matrix は次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

Matrix ルーム ID は大文字小文字を区別します。明示的な配信ターゲット、cron ジョブ、バインディング、または許可リストを設定するときは、Matrix の正確なルーム ID の大文字小文字を使用してください。
OpenClaw はストレージ用に内部セッションキーを正規化して保持するため、それらの小文字キーは Matrix 配信 ID の信頼できる情報源ではありません。

ライブディレクトリ検索は、ログイン済みの Matrix アカウントを使用します。

- ユーザー検索は、その homeserver 上の Matrix ユーザーディレクトリに問い合わせます。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け付けます。参加済みルーム名の検索はベストエフォートであり、`dangerouslyAllowNameMatching: true` が設定されている場合にのみランタイムのルーム許可リストへ適用されます。
- ルーム名を ID またはエイリアスに解決できない場合、ランタイムの許可リスト解決では無視されます。

## 設定リファレンス

許可リスト形式のユーザーフィールド (`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`) は、完全な Matrix ユーザー ID を受け付けます（最も安全）。ID ではないユーザーエントリはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` を設定すると、起動時およびモニター実行中に許可リストが変更されるたびに、Matrix ディレクトリの完全一致表示名が解決されます。解決できないエントリはランタイムで無視されます。

ルーム許可リストキー (`groups`、レガシーの `rooms`) は、ルーム ID またはエイリアスにする必要があります。プレーンなルーム名キーはデフォルトで無視されます。`dangerouslyAllowNameMatching: true` により、参加済みルーム名に対するベストエフォート検索が復元されます。

### アカウントと接続

- `enabled`: チャンネルを有効または無効にします。
- `name`: アカウントの任意の表示ラベル。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合の優先アカウント ID。
- `accounts`: 名前付きのアカウントごとのオーバーライド。トップレベルの `channels.matrix` 値はデフォルトとして継承されます。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このアカウントが `localhost`、LAN/Tailscale IP、または内部ホスト名へ接続することを許可します。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。アカウントごとのオーバーライドに対応しています。
- `userId`: 完全な Matrix ユーザー ID (`@bot:example.org`)。
- `accessToken`: トークンベース認証用のアクセストークン。プレーンテキストおよび SecretRef 値は、env/file/exec プロバイダー全体でサポートされます（[シークレット管理](/ja-JP/gateway/secrets)）。
- `password`: パスワードベースログイン用のパスワード。プレーンテキストおよび SecretRef 値に対応しています。
- `deviceId`: 明示的な Matrix デバイス ID。
- `deviceName`: パスワードログイン時に使用されるデバイス表示名。
- `avatarUrl`: プロファイル同期および `profile set` 更新用に保存される自己アバター URL。
- `initialSyncLimit`: 起動時同期中に取得されるイベントの最大数。

### 暗号化

- `encryption`: E2EE を有効にします。デフォルト: `false`。
- `startupVerification`: `"if-unverified"`（E2EE がオンの場合のデフォルト）または `"off"`。このデバイスが未検証の場合、起動時に自己検証を自動要求します。
- `startupVerificationCooldownHours`: 次の自動起動時リクエストまでのクールダウン。デフォルト: `24`。

### アクセスとポリシー

- `groupPolicy`: `"open"`、`"allowlist"`、または `"disabled"`。デフォルト: `"allowlist"`。
- `groupAllowFrom`: ルームトラフィック用のユーザー ID の許可リスト。
- `dm.enabled`: `false` の場合、すべての DM を無視します。デフォルト: `true`。
- `dm.policy`: `"pairing"`（デフォルト）、`"allowlist"`、`"open"`、または `"disabled"`。ボットが参加し、ルームを DM として分類した後に適用されます。招待処理には影響しません。
- `dm.allowFrom`: DM トラフィック用のユーザー ID の許可リスト。
- `dm.sessionScope`: `"per-user"`（デフォルト）または `"per-room"`。
- `dm.threadReplies`: 返信スレッド化の DM 専用オーバーライド (`"off"`、`"inbound"`、`"always"`)。
- `allowBots`: 他の設定済み Matrix ボットアカウントからのメッセージを受け付けます (`true` または `"mentions"`)。
- `allowlistOnly`: `true` の場合、すべてのアクティブな DM ポリシー（`"disabled"` を除く）と `"open"` グループポリシーを `"allowlist"` に強制します。`"disabled"` ポリシーは変更しません。
- `dangerouslyAllowNameMatching`: `true` の場合、ユーザー許可リストエントリに対する Matrix 表示名ディレクトリ検索と、ルーム許可リストキーに対する参加済みルーム名検索を許可します。完全な `@user:server` ID と、ルーム ID またはエイリアスを優先してください。
- `autoJoin`: `"always"`、`"allowlist"`、または `"off"`。デフォルト: `"off"`。DM 形式の招待を含む、すべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `"allowlist"` の場合に許可されるルーム/エイリアス。エイリアスエントリは、招待されたルームが主張する状態ではなく、homeserver に対して解決されます。
- `contextVisibility`: 補足コンテキストの可視性（`"all"` がデフォルト、`"allowlist"`、`"allowlist_quote"`）。

### 返信動作

- `replyToMode`: `"off"`、`"first"`、`"all"`、または `"batched"`。
- `threadReplies`: `"off"`、`"inbound"`、または `"always"`。
- `threadBindings`: スレッドに紐づくセッションルーティングとライフサイクルのチャンネルごとのオーバーライド。
- `streaming`: `"off"`（デフォルト）、`"partial"`、`"quiet"`、またはオブジェクト形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`、`false` ↔ `"off"`。
- `blockStreaming`: `true` の場合、完了したアシスタントブロックは個別の進捗メッセージとして保持されます。
- `markdown`: 送信テキスト用の任意の Markdown レンダリング設定。
- `responsePrefix`: 送信返信の前に付加される任意の文字列。
- `textChunkLimit`: `chunkMode: "length"` の場合の、文字単位の送信チャンクサイズ。デフォルト: `4000`。
- `chunkMode`: `"length"`（デフォルト、文字数で分割）または `"newline"`（行境界で分割）。
- `historyLimit`: ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含められる最近のルームメッセージ数。`messages.groupChat.historyLimit` にフォールバックします。有効なデフォルトは `0`（無効）。
- `mediaMaxMb`: 送信および受信処理のメディアサイズ上限（MB）。

### リアクション設定

- `ackReaction`: このチャンネル/アカウント用の ack リアクションオーバーライド。
- `ackReactionScope`: スコープオーバーライド（`"group-mentions"` がデフォルト、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`: 受信リアクション通知モード（`"own"` がデフォルト、`"off"`）。

### ツールとルームごとのオーバーライド

- `actions`: アクションごとのツールゲート制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`: ルームごとのポリシーマップ。セッション ID は解決後の安定したルーム ID を使用します。（`rooms` はレガシーエイリアスです。）
  - `groups.<room>.account`: 継承された 1 つのルームエントリを特定のアカウントに制限します。
  - `groups.<room>.allowBots`: チャンネルレベル設定のルームごとのオーバーライド (`true` または `"mentions"`)。
  - `groups.<room>.users`: ルームごとの送信者許可リスト。
  - `groups.<room>.tools`: ルームごとのツール許可/拒否オーバーライド。
  - `groups.<room>.autoReply`: ルームごとのメンションゲート制御オーバーライド。`true` はそのルームのメンション要件を無効にし、`false` は再び有効にします。
  - `groups.<room>.skills`: ルームごとのスキルフィルター。
  - `groups.<room>.systemPrompt`: ルームごとのシステムプロンプトスニペット。

### exec 承認設定

- `execApprovals.enabled`: Matrix ネイティブのプロンプトを通じて exec 承認を配信します。
- `execApprovals.approvers`: 承認を許可される Matrix ユーザー ID。`dm.allowFrom` にフォールバックします。
- `execApprovals.target`: `"dm"`（デフォルト）、`"channel"`、または `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 配信用の任意のエージェント/セッション許可リスト。

## 関連

- [チャンネル概要](/ja-JP/channels) - すべての対応チャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャット動作とメンションゲート制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
