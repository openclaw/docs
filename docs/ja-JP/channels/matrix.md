---
read_when:
    - OpenClaw で Matrix を設定する
    - Matrix E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、設定例
title: マトリックス
x-i18n:
    generated_at: "2026-05-10T19:22:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111f7d4ce9b1c2ead6a69b5ba2e704cc273e759001f19555f61716f07210d8b2
    source_path: channels/matrix.md
    workflow: 16
---

Matrix は OpenClaw 向けのダウンロード可能なチャネルPluginです。
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## インストール

チャネルを設定する前に、ClawHub から Matrix をインストールします。

```bash
openclaw plugins install @openclaw/matrix
```

ベアPlugin指定は最初に ClawHub を試し、その後 npm にフォールバックします。レジストリソースを強制するには、`openclaw plugins install clawhub:@openclaw/matrix` または `openclaw plugins install npm:@openclaw/matrix` を使用します。

ローカルチェックアウトからインストールする場合:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` はPluginを登録して有効化するため、別途 `openclaw plugins enable matrix` 手順は不要です。ただし、以下でチャネルを設定するまでは、Pluginは何もしません。一般的なPluginの動作とインストールルールについては、[Plugin](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. 自分のホームサーバーで Matrix アカウントを作成します。
2. `homeserver` + `accessToken`、または `homeserver` + `userId` + `password` のどちらかで `channels.matrix` を設定します。
3. Gateway を再起動します。
4. bot と DM を開始するか、ルームに招待します（[自動参加](#auto-join) を参照してください。新しい招待は `autoJoin` が許可する場合にのみ受け付けられます）。

### 対話型セットアップ

```bash
openclaw channels add
openclaw configure --section channels
```

ウィザードでは、ホームサーバーURL、認証方式（アクセストークンまたはパスワード）、ユーザーID（パスワード認証のみ）、任意のデバイス名、E2EE を有効にするかどうか、ルームアクセスと自動参加を設定するかどうかを尋ねます。

一致する `MATRIX_*` 環境変数がすでに存在し、選択したアカウントに保存済み認証情報がない場合、ウィザードは環境変数ショートカットを提示します。許可リストを保存する前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を実行します。E2EE が有効な場合、ウィザードは設定を書き込み、[`openclaw matrix encryption setup`](#encryption-and-verification) と同じブートストラップを実行します。

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

`channels.matrix.autoJoin` のデフォルトは `off` です。デフォルトでは、手動で参加するまで、新しい招待からの新規ルームや DM に bot は現れません。

OpenClaw は、招待時点では招待されたルームが DM なのかグループなのかを判断できないため、DM 形式の招待を含むすべての招待はまず `autoJoin` を通ります。`dm.policy` が適用されるのは、その後、bot が参加してルームが分類されてからです。

<Warning>
bot が受け入れる招待を制限するには `autoJoin: "allowlist"` と `autoJoinAllowlist` を設定し、すべての招待を受け入れるには `autoJoin: "always"` を設定します。

`autoJoinAllowlist` が受け付けるのは、安定したターゲットのみです: `!roomId:server`、`#alias:server`、または `*`。プレーンなルーム名は拒否されます。エイリアスエントリはホームサーバーに対して解決され、招待されたルームが主張する状態に対しては解決されません。
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

DM とルームの許可リストには、安定したIDを入れるのが最適です。

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）: `@user:server` を使用します。表示名は、ホームサーバーディレクトリが完全に1件の一致を返す場合にのみ解決されます。
- ルーム（`groups`、`autoJoinAllowlist`）: `!room:server` または `#alias:server` を使用します。名前は参加済みルームに対してベストエフォートで解決されます。未解決のエントリは実行時に無視されます。

### アカウントIDの正規化

ウィザードはわかりやすい名前を正規化されたアカウントIDに変換します。たとえば、`Ops Bot` は `ops-bot` になります。句読点はスコープ付き環境変数名内でエスケープされるため、2つのアカウントが衝突することはありません: `-` → `_X2D_` のため、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` にマッピングされます。

### キャッシュされた認証情報

Matrix はキャッシュされた認証情報を `~/.openclaw/credentials/matrix/` に保存します。

- デフォルトアカウント: `credentials.json`
- 名前付きアカウント: `credentials-<account>.json`

そこにキャッシュされた認証情報が存在する場合、アクセストークンが設定ファイルに含まれていなくても、OpenClaw は Matrix が設定済みであるものとして扱います。これはセットアップ、`openclaw doctor`、チャネルステータスプローブをカバーします。

### 環境変数

同等の設定キーが設定されていない場合に使用されます。デフォルトアカウントはプレフィックスなしの名前を使用し、名前付きアカウントはサフィックスの前にアカウントIDを挿入します。

| デフォルトアカウント | 名前付きアカウント（`<ID>` は正規化されたアカウントID） |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

アカウント `ops` の場合、名前は `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` などになります。リカバリーキー環境変数は、`--recovery-key-stdin` でキーをパイプ入力する場合に、リカバリー対応CLIフロー（`verify backup restore`、`verify device`、`verify bootstrap`）によって読み取られます。

`MATRIX_HOMESERVER` はワークスペースの `.env` から設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security) を参照してください。

## 設定例

DMペアリング、ルーム許可リスト、E2EE を含む実用的なベースライン:

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

| `streaming`       | 動作                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（デフォルト） | 完全な返信を待ってから1回送信します。`true` ↔ `"partial"`、`false` ↔ `"off"`。                                                                                      |
| `"partial"`       | モデルが現在のブロックを書き込む間、通常のテキストメッセージ1件をその場で編集します。標準の Matrix クライアントは最初のプレビューで通知し、最終編集では通知しない場合があります。 |
| `"quiet"`         | `"partial"` と同じですが、メッセージは通知しないnoticeです。受信者は、ユーザーごとのプッシュルールが確定済み編集に一致した場合にのみ通知を受け取ります（下記参照）。 |

`blockStreaming` は `streaming` から独立しています。

| `streaming`             | `blockStreaming: true`                                      | `blockStreaming: false`（デフォルト）             |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| `"partial"` / `"quiet"` | 現在のブロックのライブ下書き、完了したブロックはメッセージとして保持 | 現在のブロックのライブ下書き、その場で確定       |
| `"off"`                 | 完了したブロックごとに通知ありの Matrix メッセージ1件       | 完全な返信に対して通知ありの Matrix メッセージ1件 |

注記:

- プレビューが Matrix のイベントごとのサイズ制限を超えて大きくなると、OpenClaw はプレビューストリーミングを停止し、最終版のみの配信にフォールバックします。
- メディア返信は常に添付ファイルを通常どおり送信します。古いプレビューを安全に再利用できなくなった場合、OpenClaw は最終メディア返信を送信する前にそれを墨消しします。
- Matrix プレビューストリーミングが有効な場合、ツール進行状況のプレビュー更新はデフォルトで有効です。回答テキストのプレビュー編集は維持しつつ、ツール進行状況を通常の配信経路に残すには、`streaming.preview.toolProgress: false` を設定します。
- プレビュー編集には追加の Matrix API 呼び出しが必要です。最も保守的なレート制限プロファイルにしたい場合は、`streaming: "off"` のままにします。

## 承認メタデータ

Matrix ネイティブの承認プロンプトは、`com.openclaw.approval` 配下に OpenClaw 固有のカスタムイベント内容を持つ通常の `m.room.message` イベントです。Matrix はカスタムイベント内容キーを許可するため、標準クライアントは引き続きテキスト本文を表示し、OpenClaw 対応クライアントは構造化された承認ID、種類、状態、利用可能な判断、exec/Plugin 詳細を読み取れます。

承認プロンプトが1つの Matrix イベントに収まらないほど長い場合、OpenClaw は表示テキストを分割し、`com.openclaw.approval` を最初のチャンクのみに付与します。許可/拒否判断のリアクションはその最初のイベントに紐づくため、長いプロンプトでも単一イベントのプロンプトと同じ承認ターゲットを維持します。

### quiet の確定済みプレビュー向けセルフホストプッシュルール

`streaming: "quiet"` は、ブロックまたはターンが確定した時点でのみ受信者に通知します。ユーザーごとのプッシュルールが、確定済みプレビューマーカーに一致する必要があります。完全な手順（受信者トークン、pusher チェック、ルールインストール、ホームサーバーごとの注記）については、[quiet プレビュー向け Matrix プッシュルール](/ja-JP/channels/matrix-push-rules) を参照してください。

## bot間ルーム

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

- `allowBots: true` は、許可されたルームと DM 内で、他の設定済み Matrix bot アカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルーム内でこの bot が目に見える形でメンションされている場合にのみ、それらのメッセージを受け入れます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1つのルームについてアカウントレベルの設定を上書きします。
- OpenClaw は、自己返信ループを避けるため、同じ Matrix ユーザーIDからのメッセージは引き続き無視します。
- Matrix はここではネイティブの bot フラグを公開しません。OpenClaw は「bot が作成した」とは「この OpenClaw Gateway 上の別の設定済み Matrix アカウントによって送信された」と扱います。

共有ルームで bot 間トラフィックを有効にする場合は、厳格なルーム許可リストとメンション要件を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルとともに暗号化されます。暗号化されていないルームでは、引き続きプレーンな `thumbnail_url` を使用します。設定は不要です。Pluginが E2EE 状態を自動的に検出します。

すべての `openclaw matrix` コマンドは、`--verbose`（完全な診断）、`--json`（機械判読可能な出力）、`--account <id>`（複数アカウント構成）を受け付けます。出力はデフォルトで簡潔で、内部 SDK ログは静かです。以下の例は標準形を示しています。必要に応じてフラグを追加してください。

### 暗号化を有効化する

```bash
openclaw matrix encryption setup
```

シークレットストレージとクロス署名をブートストラップし、必要に応じてルームキーのバックアップを作成してから、状態と次の手順を出力します。便利なフラグ:

- `--recovery-key <key>` ブートストラップ前にリカバリーキーを適用する（下記で説明する stdin 形式を推奨）
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄して新しいものを作成する（意図している場合のみ使用）

新しいアカウントでは、作成時に E2EE を有効化します:

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

### 状態と信頼シグナル

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` は、3 つの独立した信頼シグナルを報告します（`--verbose` ではすべて表示されます）:

- `Locally trusted`: このクライアントのみで信頼されている
- `Cross-signing verified`: SDK がクロス署名による検証を報告している
- `Signed by owner`: 自分の自己署名キーで署名されている（診断専用）

`Verified by owner` は、`Cross-signing verified` が `yes` の場合にのみ `yes` になります。ローカル信頼または所有者署名だけでは不十分です。

`--allow-degraded-local-state` は、Matrix アカウントを先に準備せずにベストエフォートの診断を返します。オフラインまたは部分的に設定されたプローブに便利です。

### リカバリーキーでこのデバイスを検証する

リカバリーキーは機密情報です - コマンドラインで渡す代わりに stdin 経由でパイプしてください。`MATRIX_RECOVERY_KEY`（名前付きアカウントでは `MATRIX_<ID>_RECOVERY_KEY`）を設定します:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

このコマンドは 3 つの状態を報告します:

- `Recovery key accepted`: Matrix がシークレットストレージまたはデバイス信頼用のキーを受け入れた。
- `Backup usable`: 信頼されたリカバリー素材でルームキーのバックアップを読み込める。
- `Device verified by owner`: このデバイスは完全な Matrix クロス署名 ID 信頼を持つ。

リカバリーキーでバックアップ素材のロック解除に成功していても、完全な ID 信頼が未完了の場合は非ゼロで終了します。その場合は、別の Matrix クライアントから自己検証を完了してください:

```bash
openclaw matrix verify self
```

`verify self` は、正常終了する前に `Cross-signing verified: yes` を待ちます。待機時間を調整するには `--timeout-ms <ms>` を使用します。

リテラルキー形式の `openclaw matrix verify device "<recovery-key>"` も受け付けますが、キーはシェル履歴に残ります。

### クロス署名をブートストラップまたは修復する

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` は、暗号化アカウント向けの修復およびセットアップコマンドです。順番に、次を行います:

- 可能な場合は既存のリカバリーキーを再利用して、シークレットストレージをブートストラップする
- クロス署名をブートストラップし、不足している公開鍵をアップロードする
- 現在のデバイスをマークし、クロス署名する
- サーバー側のルームキーバックアップがまだ存在しない場合は作成する

ホームサーバーがクロス署名キーのアップロードに UIA を要求する場合、OpenClaw はまず認証なしを試し、次に `m.login.dummy`、その後 `m.login.password`（`channels.matrix.password` が必要）を試します。

便利なフラグ:

- `--recovery-key-stdin`（`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` と組み合わせる）または `--recovery-key <key>`
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄する（意図している場合のみ）

### ルームキーバックアップ

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` は、サーバー側バックアップが存在するか、およびこのデバイスがそれを復号できるかを示します。`backup restore` は、バックアップ済みのルームキーをローカル暗号ストアにインポートします。リカバリーキーがすでにディスク上にある場合は、`--recovery-key-stdin` を省略できます。

壊れたバックアップを新しいベースラインで置き換えるには（復元不能な古い履歴を失うことを受け入れる。現在のバックアップシークレットを読み込めない場合は、シークレットストレージも再作成できます）:

```bash
openclaw matrix verify backup reset --yes
```

以前のリカバリーキーで新しいバックアップベースラインをロック解除できないようにしたい場合にのみ、`--rotate-recovery-key` を追加します。

### 検証の一覧表示、リクエスト、応答

```bash
openclaw matrix verify list
```

選択したアカウントの保留中の検証リクエストを一覧表示します。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

この OpenClaw アカウントから検証リクエストを送信します。`--own-user` は自己検証をリクエストします（同じユーザーの別の Matrix クライアントでプロンプトを承認します）。`--user-id`/`--device-id`/`--room-id` は他者を対象にします。`--own-user` は他の対象指定フラグと組み合わせることはできません。

より低レベルのライフサイクル処理では、通常、別のクライアントからの受信リクエストを追跡している間に、これらのコマンドが特定のリクエスト `<id>`（`verify list` と `verify request` によって出力）に対して動作します:

| コマンド                                   | 目的                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 受信リクエストを承認する                                            |
| `openclaw matrix verify start <id>`        | SAS フローを開始する                                                |
| `openclaw matrix verify sas <id>`          | SAS 絵文字または十進数を出力する                                    |
| `openclaw matrix verify confirm-sas <id>`  | SAS が相手のクライアントに表示されているものと一致することを確認する |
| `openclaw matrix verify mismatch-sas <id>` | 絵文字または十進数が一致しない場合に SAS を拒否する                 |
| `openclaw matrix verify cancel <id>`       | キャンセルする。任意の `--reason <text>` と `--code <matrix-code>` を受け付ける |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas`、`cancel` はすべて、検証が特定のダイレクトメッセージルームに紐づいている場合に、DM フォローアップのヒントとして `--user-id` と `--room-id` を受け付けます。

### 複数アカウントの注意事項

`--account <id>` なしでは、Matrix CLI コマンドは暗黙のデフォルトアカウントを使用します。複数の名前付きアカウントがあり、`channels.matrix.defaultAccount` を設定していない場合、推測を拒否して選択を求めます。名前付きアカウントで E2EE が無効または利用不可の場合、エラーはそのアカウントの設定キーを指します。例: `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="起動時の動作">
    `encryption: true` の場合、`startupVerification` はデフォルトで `"if-unverified"` になります。起動時に未検証のデバイスは、別の Matrix クライアントで自己検証をリクエストし、重複をスキップしてクールダウン（デフォルトでは 24 時間）を適用します。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効化します。

    起動時には、現在のシークレットストレージとクロス署名 ID を再利用する保守的な暗号ブートストラップ処理も実行されます。ブートストラップ状態が壊れている場合、OpenClaw は `channels.matrix.password` がなくても保護された修復を試みます。ホームサーバーがパスワード UIA を要求する場合、起動は警告をログに記録し、非致命的なまま続行します。すでに所有者署名済みのデバイスは保持されます。

    完全なアップグレードフローについては、[Matrix 移行](/ja-JP/channels/matrix-migration)を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は検証ライフサイクル通知を、厳格な DM 検証ルームに `m.notice` メッセージとして投稿します。リクエスト、準備完了（「絵文字で検証」の案内付き）、開始/完了、利用可能な場合は SAS（絵文字/十進数）の詳細です。

    別の Matrix クライアントからの受信リクエストは追跡され、自動承認されます。自己検証では、OpenClaw は SAS フローを自動的に開始し、絵文字検証が利用可能になると自分側を確認します。それでも、Matrix クライアントで比較して「一致する」を確認する必要があります。

    検証システム通知はエージェントチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="削除済みまたは無効な Matrix デバイス">
    `verify status` が現在のデバイスはホームサーバー上にもう一覧表示されていないと示す場合、新しい OpenClaw Matrix デバイスを作成してください。パスワードログインの場合:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    トークン認証の場合は、Matrix クライアントまたは管理 UI で新しいアクセストークンを作成してから、OpenClaw を更新します:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` は失敗したコマンドのアカウント ID に置き換えるか、デフォルトアカウントでは `--account` を省略します。

  </Accordion>

  <Accordion title="デバイスの整理">
    OpenClaw が管理する古いデバイスは蓄積することがあります。一覧表示して整理します:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="暗号ストア">
    Matrix E2EE は、IndexedDB shim として `fake-indexeddb` を使用する公式 `matrix-js-sdk` Rust 暗号パスを使います。暗号状態は `crypto-idb-snapshot.json`（制限付きファイル権限）に永続化されます。

    暗号化されたランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下にあり、同期ストア、暗号ストア、リカバリーキー、IDB スナップショット、スレッドバインディング、起動時検証状態を含みます。トークンが変わってもアカウント ID が同じ場合、OpenClaw は最適な既存ルートを再利用するため、以前の状態が引き続き見えます。

  </Accordion>
</AccordionGroup>

## プロファイル管理

選択したアカウントの Matrix 自己プロファイルを更新します:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

1 回の呼び出しで両方のオプションを渡せます。Matrix は `mxc://` アバター URL を直接受け付けます。`http://` または `https://` を渡すと、OpenClaw はまずファイルをアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl`（またはアカウントごとの上書き）に保存します。

## スレッド

Matrix は、自動返信とメッセージツール送信の両方でネイティブ Matrix スレッドをサポートします。2 つの独立したノブが動作を制御します:

### セッションルーティング（`sessionScope`）

`dm.sessionScope` は、Matrix DM ルームを OpenClaw セッションにどのように対応付けるかを決定します:

- `"per-user"`（デフォルト）: 同じルーティング済みピアを持つすべての DM ルームが 1 つのセッションを共有します。
- `"per-room"`: ピアが同じでも、各 Matrix DM ルームは独自のセッションキーを持ちます。

明示的な会話バインディングは常に `sessionScope` より優先されるため、バインドされたルームとスレッドは選択済みの対象セッションを維持します。

### 返信スレッド化（`threadReplies`）

`threadReplies` は、ボットが返信を投稿する場所を決定します:

- `"off"`: 返信はトップレベルです。受信したスレッドメッセージは親セッションに残ります。
- `"inbound"`: 受信メッセージがすでにそのスレッド内にあった場合のみ、スレッド内で返信します。
- `"always"`: トリガーとなったメッセージをルートとするスレッド内で返信します。その会話は最初のトリガー以降、一致するスレッドスコープのセッションを通じてルーティングされます。

`dm.threadReplies` は DM のみでこれを上書きします。たとえば、ルームスレッドを分離したまま、DM はフラットに保てます。

### スレッド継承とスラッシュコマンド

- 受信スレッドメッセージには、追加のエージェントコンテキストとしてスレッドのルートメッセージが含まれます。
- message-tool による送信は、明示的な `threadId` が提供されていない限り、同じルーム（または同じ DM ユーザーターゲット）を対象にする場合に現在の Matrix スレッドを自動継承します。
- DM ユーザーターゲットの再利用は、現在のセッションメタデータが同じ Matrix アカウント上の同じ DM ピアであることを証明する場合にのみ有効になります。それ以外の場合、OpenClaw は通常のユーザースコープルーティングにフォールバックします。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドバインドされた `/acp spawn` はすべて Matrix ルームと DM で動作します。
- トップレベルの `/focus` は、`threadBindings.spawnSessions` が有効な場合に新しい Matrix スレッドを作成し、それをターゲットセッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、そのスレッドをその場でバインドします。

OpenClaw が、同じ共有セッション上の別の DM ルームと衝突している Matrix DM ルームを検出すると、そのルームに一度だけ `m.notice` を投稿し、`/focus` の退避手段を示して `dm.sessionScope` の変更を提案します。この通知はスレッドバインディングが有効な場合にのみ表示されます。

## ACP 会話バインディング

Matrix ルーム、DM、既存の Matrix スレッドは、チャット画面を変更せずに永続的な ACP ワークスペースにできます。

高速なオペレーターフロー:

- 使い続けたい Matrix DM、ルーム、または既存のスレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM/ルームがチャット画面のまま維持され、以後のメッセージは生成された ACP セッションにルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` が現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

注記:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnSessions` は `/acp spawn --thread auto|here` を制御します。ここでは OpenClaw が子 Matrix スレッドを作成またはバインドする必要があります。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャンネルごとの上書きもサポートします:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Matrix のスレッドバインドセッション生成はデフォルトで有効です:

- `threadBindings.spawnSessions: false` を設定すると、トップレベルの `/focus` と `/acp spawn --thread auto|here` が Matrix スレッドを作成/バインドすることをブロックします。
- ネイティブサブエージェントのスレッド生成で親トランスクリプトをフォークしないようにする場合は、`threadBindings.defaultSpawnContext: "isolated"` を設定します。

## リアクション

Matrix は送信リアクション、受信リアクション通知、ack リアクションをサポートします。

送信リアクションツールは `channels.matrix.actions.reactions` によって制御されます:

- `react` は Matrix イベントにリアクションを追加します。
- `reactions` は Matrix イベントの現在のリアクションサマリーを一覧表示します。
- `emoji=""` は、そのイベントに対するボット自身のリアクションを削除します。
- `remove: true` は、ボットから指定された絵文字リアクションだけを削除します。

**解決順序**（最初に定義された値が優先）:

| 設定                    | 順序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | アカウントごと → チャンネル → `messages.ackReaction` → エージェント ID 絵文字フォールバック |
| `ackReactionScope`      | アカウントごと → チャンネル → `messages.ackReactionScope` → デフォルト `"group-mentions"` |
| `reactionNotifications` | アカウントごと → チャンネル → デフォルト `"own"`                                 |

`reactionNotifications: "own"` は、ボットが作成した Matrix メッセージを対象にする追加済み `m.reaction` イベントを転送します。`"off"` はリアクションシステムイベントを無効にします。リアクションの削除は、Matrix がそれらを単独の `m.reaction` 削除としてではなく、リダクションとして表面化するため、システムイベントには合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックします。両方が未設定の場合、有効なデフォルトは `0` です。無効にするには `0` を設定します。
- Matrix ルーム履歴はルーム専用です。DM は通常のセッション履歴を引き続き使用します。
- Matrix ルーム履歴は pending-only です。OpenClaw は、まだ返信をトリガーしていないルームメッセージをバッファリングし、メンションまたは他のトリガーが到着したときにそのウィンドウのスナップショットを取得します。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメイン受信本文に残ります。
- 同じ Matrix イベントの再試行では、新しいルームメッセージへずれていくのではなく、元の履歴スナップショットを再利用します。

## コンテキスト可視性

Matrix は、取得した返信テキスト、スレッドルート、保留中の履歴などの補足ルームコンテキスト向けに共有の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信時のまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブルーム/ユーザーの許可リストチェックで許可された送信者に補足コンテキストをフィルタリングします。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的に引用された返信を 1 つだけ保持します。

この設定は補足コンテキストの可視性に影響し、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガーの承認は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、および DM ポリシー設定から行われます。

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

ルームを動作させたまま DM を完全に無音化するには、`dm.enabled: false` を設定します:

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

メンションゲートと許可リストの挙動については、[グループ](/ja-JP/channels/groups) を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前にメッセージを送り続ける場合、OpenClaw は同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに短いクールダウン後にリマインダー返信を送信することがあります。

共有 DM ペアリングフローとストレージレイアウトについては、[ペアリング](/ja-JP/channels/pairing) を参照してください。

## ダイレクトルーム修復

ダイレクトメッセージの状態が同期から外れると、OpenClaw に古いソロルームを指す古い `m.direct` マッピングが残り、現在の DM を指さないことがあります。ピアの現在のマッピングを確認します:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復します:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

どちらのコマンドも、マルチアカウント構成では `--account <id>` を受け付けます。修復フロー:

- `m.direct` にすでにマッピングされている厳密な 1:1 DM を優先します
- そのユーザーとの現在参加中の厳密な 1:1 DM があれば、それにフォールバックします
- 正常な DM が存在しない場合は、新しいダイレクトルームを作成して `m.direct` を書き換えます

古いルームは自動的には削除しません。正常な DM を選択し、以後の Matrix 送信、検証通知、その他のダイレクトメッセージフローが正しいルームを対象にするようマッピングを更新します。

## Exec 承認

Matrix はネイティブ承認クライアントとして動作できます。`channels.matrix.execApprovals`（またはアカウントごとの上書きでは `channels.matrix.accounts.<account>.execApprovals`）で設定します:

- `enabled`: Matrix ネイティブのプロンプトを通じて承認を配信します。未設定または `"auto"` の場合、少なくとも 1 人の承認者を解決できると Matrix は自動的に有効になります。明示的に無効にするには `false` を設定します。
- `approvers`: exec リクエストを承認できる Matrix ユーザー ID（`@owner:example.org`）。任意です。`channels.matrix.dm.allowFrom` にフォールバックします。
- `target`: プロンプトの送信先。`"dm"`（デフォルト）は承認者の DM に送信します。`"channel"` は発信元の Matrix ルームまたは DM に送信します。`"both"` は両方に送信します。
- `agentFilter` / `sessionFilter`: どのエージェント/セッションが Matrix 配信をトリガーするかの任意の許可リストです。

承認の種類によって承認方法が少し異なります:

- **Exec 承認**は `execApprovals.approvers` を使用し、`dm.allowFrom` にフォールバックします。
- **Plugin 承認**は `dm.allowFrom` のみで承認します。

どちらの種類も Matrix リアクションショートカットとメッセージ更新を共有します。承認者には、主要な承認メッセージ上にリアクションショートカットが表示されます:

- `✅` 1 回だけ許可
- `❌` 拒否
- `♾️` 常に許可（有効な exec ポリシーで許可されている場合）

フォールバックのスラッシュコマンド: `/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

解決済みの承認者だけが承認または拒否できます。exec 承認のチャンネル配信にはコマンドテキストが含まれます。`channel` または `both` は信頼できるルームでのみ有効にしてください。

関連: [Exec 承認](/ja-JP/tools/exec-approvals)。

## スラッシュコマンド

スラッシュコマンド（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` など）は DM で直接動作します。ルームでは、OpenClaw はボット自身の Matrix メンションが前置されたコマンドも認識するため、`@bot:server /new` はカスタムメンション正規表現なしでコマンドパスをトリガーします。これにより、Element などのクライアントでユーザーがコマンド入力前にボットをタブ補完したときに送信される、ルーム形式の `@mention /command` 投稿にボットが応答しやすくなります。

承認ルールは引き続き適用されます。コマンド送信者は、通常のメッセージと同じ DM またはルームの許可リスト/所有者ポリシーを満たす必要があります。

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

- トップレベルの `channels.matrix` 値は、アカウントがそれらを上書きしない限り、名前付きアカウントのデフォルトとして機能します。
- `groups.<room>.account` を使って、継承されたルームエントリを特定のアカウントにスコープします。`account` のないエントリはアカウント間で共有されます。`account: "default"` は、デフォルトアカウントがトップレベルで設定されている場合も引き続き動作します。

**デフォルトアカウントの選択:**

- `defaultAccount` を設定して、暗黙のルーティング、プローブ、CLI コマンドが優先する名前付きアカウントを選択します。
- 複数のアカウントがあり、そのうち 1 つが文字どおり `default` という名前の場合、`defaultAccount` が未設定でも OpenClaw はそれを暗黙的に使用します。
- 複数の名前付きアカウントがあり、デフォルトが選択されていない場合、CLI コマンドは推測を拒否します。`defaultAccount` を設定するか、`--account <id>` を渡してください。
- トップレベルの `channels.matrix.*` ブロックは、その認証が完全な場合（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）にのみ、暗黙の `default` アカウントとして扱われます。名前付きアカウントは、キャッシュ済み認証情報が認証をカバーしていれば、`homeserver` + `userId` から引き続き検出可能です。

**昇格:**

- OpenClaw が修復またはセットアップ中に単一アカウント設定をマルチアカウントに昇格する場合、既存の名前付きアカウントが存在するか、`defaultAccount` がすでにそれを指していれば、それを保持します。Matrix 認証/ブートストラップキーだけが昇格先アカウントへ移動し、共有配信ポリシーキーはトップレベルに残ります。

共有マルチアカウントパターンについては、[設定リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels) を参照してください。

## プライベート/LAN ホームサーバー

デフォルトでは、OpenClaw は SSRF 保護のため、アカウントごとに明示的にオプトインしない限り、プライベート/内部 Matrix ホームサーバーをブロックします。

ホームサーバーが localhost、LAN/Tailscale IP、または内部ホスト名で動作している場合は、その Matrix アカウントで `network.dangerouslyAllowPrivateNetwork` を有効にしてください:

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

Matrix デプロイで明示的な送信 HTTP(S) プロキシが必要な場合は、`channels.matrix.proxy` を設定します:

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

Matrix は、OpenClaw がルームまたはユーザーターゲットを求める場所ならどこでも、次のターゲット形式を受け付けます:

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

Matrix ルーム ID は大文字と小文字を区別します。明示的な配信ターゲット、cron ジョブ、バインディング、または許可リストを設定するときは、Matrix の正確なルーム ID の大文字小文字を使用してください。
OpenClaw は保存用の内部セッションキーを正規化するため、それらの小文字キーは Matrix 配信 ID の信頼できる情報源ではありません。

ライブディレクトリ検索は、ログイン済みの Matrix アカウントを使用します:

- ユーザー検索は、その homeserver の Matrix ユーザーディレクトリにクエリします。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け付け、その後そのアカウントが参加しているルーム名の検索にフォールバックします。
- 参加済みルーム名の検索はベストエフォートです。ルーム名を ID またはエイリアスに解決できない場合、実行時の許可リスト解決では無視されます。

## 設定リファレンス

許可リスト形式のフィールド (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) は、完全な Matrix ユーザー ID を受け付けます（最も安全）。完全一致するディレクトリエントリは、起動時、およびモニター実行中に許可リストが変更されるたびに解決されます。解決できないエントリは実行時に無視されます。同じ理由で、ルーム許可リストではルーム ID またはエイリアスが推奨されます。

### アカウントと接続

- `enabled`: チャンネルを有効または無効にします。
- `name`: アカウントの任意の表示ラベル。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合の優先アカウント ID。
- `accounts`: 名前付きのアカウント別上書き。トップレベルの `channels.matrix` 値はデフォルトとして継承されます。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このアカウントが `localhost`、LAN/Tailscale IP、または内部ホスト名に接続することを許可します。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。アカウント別の上書きに対応しています。
- `userId`: 完全な Matrix ユーザー ID (`@bot:example.org`)。
- `accessToken`: トークンベース認証用のアクセストークン。env/file/exec プロバイダー全体で平文値と SecretRef 値に対応しています（[シークレット管理](/ja-JP/gateway/secrets)）。
- `password`: パスワードベースログイン用のパスワード。平文値と SecretRef 値に対応しています。
- `deviceId`: 明示的な Matrix デバイス ID。
- `deviceName`: パスワードログイン時に使用されるデバイス表示名。
- `avatarUrl`: プロフィール同期と `profile set` 更新用に保存されるセルフアバター URL。
- `initialSyncLimit`: 起動時同期で取得されるイベントの最大数。

### 暗号化

- `encryption`: E2EE を有効にします。デフォルト: `false`。
- `startupVerification`: `"if-unverified"`（E2EE がオンの場合のデフォルト）または `"off"`。このデバイスが未検証の場合、起動時に自己検証を自動リクエストします。
- `startupVerificationCooldownHours`: 次回の自動起動リクエストまでのクールダウン。デフォルト: `24`。

### アクセスとポリシー

- `groupPolicy`: `"open"`、`"allowlist"`、または `"disabled"`。デフォルト: `"allowlist"`。
- `groupAllowFrom`: ルームトラフィック用のユーザー ID 許可リスト。
- `dm.enabled`: `false` の場合、すべての DM を無視します。デフォルト: `true`。
- `dm.policy`: `"pairing"`（デフォルト）、`"allowlist"`、`"open"`、または `"disabled"`。ボットが参加し、ルームを DM として分類した後に適用されます。招待処理には影響しません。
- `dm.allowFrom`: DM トラフィック用のユーザー ID 許可リスト。
- `dm.sessionScope`: `"per-user"`（デフォルト）または `"per-room"`。
- `dm.threadReplies`: 返信スレッド化の DM 専用上書き (`"off"`、`"inbound"`、`"always"`)。
- `allowBots`: 他の設定済み Matrix ボットアカウントからのメッセージを受け付けます (`true` または `"mentions"`)。
- `allowlistOnly`: `true` の場合、すべてのアクティブな DM ポリシー（`"disabled"` を除く）と `"open"` グループポリシーを `"allowlist"` に強制します。`"disabled"` ポリシーは変更しません。
- `autoJoin`: `"always"`、`"allowlist"`、または `"off"`。デフォルト: `"off"`。DM 形式の招待を含む、すべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `"allowlist"` の場合に許可されるルーム/エイリアス。エイリアスエントリは、招待されたルームが主張する状態ではなく、homeserver に対して解決されます。
- `contextVisibility`: 補足コンテキストの可視性（デフォルトは `"all"`、`"allowlist"`、`"allowlist_quote"`）。

### 返信動作

- `replyToMode`: `"off"`、`"first"`、`"all"`、または `"batched"`。
- `threadReplies`: `"off"`、`"inbound"`、または `"always"`。
- `threadBindings`: スレッドに紐づくセッションルーティングとライフサイクルのチャンネル別上書き。
- `streaming`: `"off"`（デフォルト）、`"partial"`、`"quiet"`、またはオブジェクト形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`、`false` ↔ `"off"`。
- `blockStreaming`: `true` の場合、完了したアシスタントブロックは個別の進捗メッセージとして保持されます。
- `markdown`: 送信テキスト用の任意の Markdown レンダリング設定。
- `responsePrefix`: 送信返信の先頭に付加される任意の文字列。
- `textChunkLimit`: `chunkMode: "length"` の場合の送信チャンクサイズ（文字数）。デフォルト: `4000`。
- `chunkMode`: `"length"`（デフォルト、文字数で分割）または `"newline"`（行境界で分割）。
- `historyLimit`: ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数。`messages.groupChat.historyLimit` にフォールバックします。実効デフォルトは `0`（無効）。
- `mediaMaxMb`: 送信および受信処理でのメディアサイズ上限（MB）。

### リアクション設定

- `ackReaction`: このチャンネル/アカウントの ack リアクション上書き。
- `ackReactionScope`: スコープ上書き（デフォルトは `"group-mentions"`、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`）。
- `reactionNotifications`: 受信リアクション通知モード（デフォルトは `"own"`、`"off"`）。

### ツールとルーム別上書き

- `actions`: アクション別のツール制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。
- `groups`: ルーム別ポリシーマップ。セッション ID は解決後の安定したルーム ID を使用します。（`rooms` はレガシーエイリアスです。）
  - `groups.<room>.account`: 継承された 1 つのルームエントリを特定のアカウントに制限します。
  - `groups.<room>.allowBots`: チャンネルレベル設定のルーム別上書き（`true` または `"mentions"`）。
  - `groups.<room>.users`: ルーム別の送信者許可リスト。
  - `groups.<room>.tools`: ルーム別のツール許可/拒否上書き。
  - `groups.<room>.autoReply`: ルーム別のメンション制御上書き。`true` はそのルームでメンション要件を無効にし、`false` は再び強制します。
  - `groups.<room>.skills`: ルーム別の skill フィルター。
  - `groups.<room>.systemPrompt`: ルーム別のシステムプロンプトスニペット。

### Exec 承認設定

- `execApprovals.enabled`: Matrix ネイティブのプロンプトを通じて exec 承認を配信します。
- `execApprovals.approvers`: 承認を許可された Matrix ユーザー ID。`dm.allowFrom` にフォールバックします。
- `execApprovals.target`: `"dm"`（デフォルト）、`"channel"`、または `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 配信用の任意のエージェント/セッション許可リスト。

## 関連

- [チャンネル概要](/ja-JP/channels) - 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャット動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
