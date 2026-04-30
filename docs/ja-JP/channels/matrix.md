---
read_when:
    - OpenClaw で Matrix を設定する
    - Matrix E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、設定例
title: マトリックス
x-i18n:
    generated_at: "2026-04-30T04:59:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix は OpenClaw に同梱されるチャンネル Plugin です。
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE に対応しています。

## 同梱 Plugin

現在パッケージ化されている OpenClaw リリースには Matrix Plugin が標準で含まれています。インストールは不要です。`channels.matrix.*` を設定すること（[セットアップ](#setup)を参照）で有効化されます。

Matrix を除外した古いビルドやカスタムインストールでは、公開されている場合は現在の npm
パッケージをインストールしてください。

```bash
openclaw plugins install @openclaw/matrix
```

npm が OpenClaw 所有のパッケージを非推奨として報告する場合は、新しい npm パッケージが公開されるまで、現在パッケージ化されている
OpenClaw ビルドまたはローカルチェックアウトを使用してください。

ローカルチェックアウトから:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` は Plugin を登録して有効化するため、別途 `openclaw plugins enable matrix` を実行する必要はありません。ただし、下記のチャンネルを設定するまで Plugin は何もしません。一般的な Plugin の動作とインストール規則については [Plugins](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. ホームサーバー上に Matrix アカウントを作成します。
2. `homeserver` + `accessToken`、または `homeserver` + `userId` + `password` のどちらかで `channels.matrix` を設定します。
3. Gateway を再起動します。
4. ボットと DM を開始するか、ルームに招待します（[自動参加](#auto-join)を参照。新しい招待は `autoJoin` が許可した場合にのみ反映されます）。

### 対話型セットアップ

```bash
openclaw channels add
openclaw configure --section channels
```

ウィザードでは、ホームサーバー URL、認証方式（アクセストークンまたはパスワード）、ユーザー ID（パスワード認証のみ）、任意のデバイス名、E2EE を有効にするかどうか、ルームアクセスと自動参加を設定するかどうかを尋ねます。

一致する `MATRIX_*` 環境変数がすでに存在し、選択したアカウントに保存済みの認証情報がない場合、ウィザードは環境変数のショートカットを提示します。許可リストを保存する前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を実行します。E2EE が有効な場合、ウィザードは設定を書き込み、[`openclaw matrix encryption setup`](#encryption-and-verification) と同じブートストラップを実行します。

### 最小構成

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

`channels.matrix.autoJoin` のデフォルトは `off` です。デフォルトでは、手動で参加するまで、ボットは新しい招待からの新しいルームや DM に表示されません。

OpenClaw は招待時点では、招待されたルームが DM かグループかを判別できないため、DM 形式の招待を含むすべての招待はまず `autoJoin` を通ります。`dm.policy` は、ボットが参加し、ルームが分類された後にのみ適用されます。

<Warning>
ボットが受け入れる招待を制限するには、`autoJoin: "allowlist"` と `autoJoinAllowlist` を設定します。すべての招待を受け入れるには `autoJoin: "always"` を設定します。

`autoJoinAllowlist` が受け入れるのは安定したターゲットのみです: `!roomId:server`、`#alias:server`、または `*`。プレーンなルーム名は拒否されます。エイリアスエントリは、招待されたルームが主張する状態ではなく、ホームサーバーに対して解決されます。
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

DM とルームの許可リストには、安定した ID を登録するのが最適です。

- DM（`dm.allowFrom`、`groupAllowFrom`、`groups.<room>.users`）: `@user:server` を使用します。表示名は、ホームサーバーディレクトリが完全に 1 件だけ一致を返した場合にのみ解決されます。
- ルーム（`groups`、`autoJoinAllowlist`）: `!room:server` または `#alias:server` を使用します。名前は参加済みルームに対してベストエフォートで解決されます。未解決のエントリは実行時に無視されます。

### アカウント ID の正規化

ウィザードはフレンドリー名を正規化されたアカウント ID に変換します。たとえば、`Ops Bot` は `ops-bot` になります。スコープ付き環境変数名では句読点がエスケープされるため、2 つのアカウントが衝突することはありません。`-` → `_X2D_` なので、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` に対応します。

### キャッシュされた認証情報

Matrix はキャッシュされた認証情報を `~/.openclaw/credentials/matrix/` 配下に保存します。

- デフォルトアカウント: `credentials.json`
- 名前付きアカウント: `credentials-<account>.json`

キャッシュされた認証情報がそこに存在する場合、アクセストークンが設定ファイルになくても、OpenClaw は Matrix が設定済みであると扱います。これはセットアップ、`openclaw doctor`、チャンネルステータスのプローブに適用されます。

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

アカウント `ops` の場合、名前は `MATRIX_OPS_HOMESERVER`、`MATRIX_OPS_ACCESS_TOKEN` などになります。リカバリーキー環境変数は、`--recovery-key-stdin` でキーをパイプ入力するときに、リカバリー対応 CLI フロー（`verify backup restore`、`verify device`、`verify bootstrap`）によって読み取られます。

`MATRIX_HOMESERVER` はワークスペースの `.env` から設定できません。[ワークスペース `.env` ファイル](/ja-JP/gateway/security)を参照してください。

## 設定例

DM ペアリング、ルーム許可リスト、E2EE を備えた実用的なベースライン:

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

Matrix の返信ストリーミングはオプトインです。`streaming` は、OpenClaw が進行中のアシスタント返信を配信する方法を制御します。`blockStreaming` は、完了した各ブロックを個別の Matrix メッセージとして保持するかどうかを制御します。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

ライブ回答プレビューを維持しつつ、途中のツール/進行状況行を非表示にするには、オブジェクト
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

| `streaming`       | 動作                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"`（デフォルト） | 完全な返信を待ってから一度送信します。`true` ↔ `"partial"`、`false` ↔ `"off"`。                                                                                        |
| `"partial"`       | モデルが現在のブロックを書き込む間、1 つの通常のテキストメッセージをその場で編集します。標準の Matrix クライアントは、最終編集ではなく最初のプレビューで通知する場合があります。              |
| `"quiet"`         | `"partial"` と同じですが、メッセージは通知なしの通知メッセージです。受信者は、ユーザーごとのプッシュルールが確定済み編集に一致した場合にのみ通知を受け取ります（下記参照）。 |

`blockStreaming` は `streaming` とは独立しています。

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false`（デフォルト）                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | 現在のブロックのライブ下書き、完了したブロックはメッセージとして保持 | 現在のブロックのライブ下書き、その場で確定 |
| `"off"`                 | 完了したブロックごとに通知ありの Matrix メッセージを 1 件送信                     | 完全な返信に対して通知ありの Matrix メッセージを 1 件送信      |

注:

- プレビューが Matrix のイベントごとのサイズ制限を超えた場合、OpenClaw はプレビューストリーミングを停止し、最終結果のみの配信にフォールバックします。
- メディア返信は常に通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClaw は最終メディア返信を送信する前にそれを削除します。
- Matrix プレビューストリーミングが有効な場合、ツール進行状況のプレビュー更新はデフォルトで有効です。回答テキストのプレビュー編集は維持しつつ、ツール進行状況を通常の配信パスに残すには、`streaming.preview.toolProgress: false` を設定します。
- プレビュー編集には追加の Matrix API 呼び出しが必要です。最も保守的なレート制限プロファイルにしたい場合は、`streaming: "off"` のままにしてください。

## 承認メタデータ

Matrix ネイティブの承認プロンプトは通常の `m.room.message` イベントであり、OpenClaw 固有のカスタムイベント内容を `com.openclaw.approval` 配下に持ちます。Matrix はカスタムイベント内容キーを許可しているため、標準クライアントは引き続きテキスト本文を表示し、OpenClaw 対応クライアントは構造化された承認 ID、種類、状態、利用可能な判断、exec/Plugin の詳細を読み取れます。

承認プロンプトが 1 つの Matrix イベントには長すぎる場合、OpenClaw は表示テキストを分割し、最初のチャンクにのみ `com.openclaw.approval` を付与します。許可/拒否の判断に対するリアクションはその最初のイベントに紐付けられるため、長いプロンプトでも単一イベントのプロンプトと同じ承認ターゲットを維持します。

### quiet の確定済みプレビュー向けセルフホストプッシュルール

`streaming: "quiet"` は、ブロックまたはターンが確定した時点でのみ受信者に通知します。ユーザーごとのプッシュルールが、確定済みプレビューマーカーに一致する必要があります。完全な手順（受信者トークン、プッシャーチェック、ルールインストール、ホームサーバーごとの注意事項）については、[quiet プレビュー向け Matrix プッシュルール](/ja-JP/channels/matrix-push-rules)を参照してください。

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

- `allowBots: true` は、許可されたルームと DM で、他の設定済み Matrix ボットアカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルーム内でこのボットを視覚的にメンションしている場合にのみ、それらのメッセージを受け入れます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベルの設定を上書きします。
- OpenClaw は自己返信ループを避けるため、同じ Matrix ユーザー ID からのメッセージは引き続き無視します。
- Matrix はここでネイティブのボットフラグを公開しません。OpenClaw は「ボット作成」とは「この OpenClaw Gateway 上の別の設定済み Matrix アカウントによって送信されたもの」として扱います。

共有ルームでボット間トラフィックを有効にする場合は、厳格なルーム許可リストとメンション要件を使用してください。

## 暗号化と検証

暗号化済み（E2EE）ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは、引き続きプレーンな `thumbnail_url` を使用します。設定は不要です。Plugin が E2EE 状態を自動的に検出します。

すべての `openclaw matrix` コマンドは、`--verbose`（完全な診断）、`--json`（機械可読出力）、`--account <id>`（マルチアカウント構成）を受け付けます。出力はデフォルトで簡潔で、内部 SDK ログは静かです。以下の例は標準形式を示しています。必要に応じてフラグを追加してください。

### 暗号化を有効にする

```bash
openclaw matrix encryption setup
```

秘密ストレージとクロス署名をブートストラップし、必要に応じてルーム鍵バックアップを作成してから、ステータスと次の手順を表示します。有用なフラグ:

- `--recovery-key <key>` ブートストラップ前にリカバリキーを適用する（下記の stdin 形式を推奨）
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄して新しい ID を作成する（意図した場合のみ使用）

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

`verify status` は 3 つの独立した信頼シグナルを報告します（`--verbose` はそれらすべてを表示します）:

- `Locally trusted`: このクライアントのみで信頼されている
- `Cross-signing verified`: SDK がクロス署名による検証を報告している
- `Signed by owner`: 自分自身の自己署名鍵で署名されている（診断のみ）

`Verified by owner` は、`Cross-signing verified` が `yes` の場合にのみ `yes` になります。ローカル信頼または所有者署名だけでは不十分です。

`--allow-degraded-local-state` は、先に Matrix アカウントを準備せずにベストエフォートの診断を返します。オフラインまたは部分的に設定されたプローブに役立ちます。

### リカバリキーでこのデバイスを検証する

リカバリキーは機密情報です。コマンドラインで渡すのではなく、stdin 経由でパイプしてください。`MATRIX_RECOVERY_KEY`（名前付きアカウントでは `MATRIX_<ID>_RECOVERY_KEY`）を設定します:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

このコマンドは 3 つの状態を報告します:

- `Recovery key accepted`: Matrix が秘密ストレージまたはデバイス信頼のためにキーを受け入れた。
- `Backup usable`: 信頼済みリカバリ素材でルーム鍵バックアップを読み込める。
- `Device verified by owner`: このデバイスが完全な Matrix クロス署名 ID の信頼を持っている。

完全な ID 信頼が未完了の場合、リカバリキーでバックアップ素材を解除できたとしても、非ゼロで終了します。その場合は、別の Matrix クライアントから自己検証を完了します:

```bash
openclaw matrix verify self
```

`verify self` は、`Cross-signing verified: yes` になるまで待ってから正常終了します。待機を調整するには `--timeout-ms <ms>` を使用します。

リテラルキー形式の `openclaw matrix verify device "<recovery-key>"` も受け付けますが、キーはシェル履歴に残ります。

### クロス署名をブートストラップまたは修復する

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` は、暗号化アカウントの修復およびセットアップコマンドです。順番に、次を実行します:

- 可能な場合は既存のリカバリキーを再利用して秘密ストレージをブートストラップする
- クロス署名をブートストラップし、不足している公開鍵をアップロードする
- 現在のデバイスをマークし、クロス署名する
- まだ存在しない場合はサーバー側ルーム鍵バックアップを作成する

ホームサーバーがクロス署名鍵のアップロードに UIA を要求する場合、OpenClaw はまず認証なしを試し、次に `m.login.dummy`、続いて `m.login.password`（`channels.matrix.password` が必要）を試します。

有用なフラグ:

- `--recovery-key-stdin`（`printf '%s\n' "$MATRIX_RECOVERY_KEY" | …` と組み合わせる）または `--recovery-key <key>`
- `--force-reset-cross-signing` 現在のクロス署名 ID を破棄する（意図した場合のみ）

### ルーム鍵バックアップ

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` は、サーバー側バックアップが存在するか、およびこのデバイスがそれを復号できるかを表示します。`backup restore` は、バックアップ済みルーム鍵をローカル暗号ストアにインポートします。リカバリキーがすでにディスク上にある場合は、`--recovery-key-stdin` を省略できます。

壊れたバックアップを新しいベースラインに置き換えるには（復元不能な古い履歴を失うことを受け入れる。現在のバックアップシークレットを読み込めない場合は秘密ストレージも再作成可能）:

```bash
openclaw matrix verify backup reset --yes
```

以前のリカバリキーで新しいバックアップベースラインを解除できないように意図的にしたい場合にのみ、`--rotate-recovery-key` を追加します。

### 検証の一覧表示、要求、応答

```bash
openclaw matrix verify list
```

選択したアカウントの保留中の検証要求を一覧表示します。

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

この OpenClaw アカウントから検証要求を送信します。`--own-user` は自己検証を要求します（同じユーザーの別の Matrix クライアントでプロンプトを承認します）。`--user-id`/`--device-id`/`--room-id` は他者を対象にします。`--own-user` は他の対象指定フラグと組み合わせることはできません。

より低レベルのライフサイクル処理では、通常、別のクライアントからの受信要求を追跡している間に、これらのコマンドが特定の要求 `<id>`（`verify list` と `verify request` で表示）に対して動作します:

| コマンド                                   | 目的                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | 受信要求を承認する                                                  |
| `openclaw matrix verify start <id>`        | SAS フローを開始する                                                |
| `openclaw matrix verify sas <id>`          | SAS 絵文字または十進数を表示する                                    |
| `openclaw matrix verify confirm-sas <id>`  | SAS が相手クライアントに表示されているものと一致することを確認する  |
| `openclaw matrix verify mismatch-sas <id>` | 絵文字または十進数が一致しない場合に SAS を拒否する                 |
| `openclaw matrix verify cancel <id>`       | キャンセルする。任意の `--reason <text>` と `--code <matrix-code>` を受け付ける |

`accept`、`start`、`sas`、`confirm-sas`、`mismatch-sas`、`cancel` はすべて、検証が特定のダイレクトメッセージルームに紐づいている場合の DM フォローアップヒントとして、`--user-id` と `--room-id` を受け付けます。

### マルチアカウントの注意事項

`--account <id>` がない場合、Matrix CLI コマンドは暗黙のデフォルトアカウントを使用します。複数の名前付きアカウントがあり、`channels.matrix.defaultAccount` を設定していない場合、推測を拒否して選択を求めます。名前付きアカウントで E2EE が無効または利用不可の場合、エラーはそのアカウントの設定キーを指します。例: `channels.matrix.accounts.assistant.encryption`。

<AccordionGroup>
  <Accordion title="起動時の動作">
    `encryption: true` の場合、`startupVerification` はデフォルトで `"if-unverified"` になります。起動時に、未検証のデバイスは別の Matrix クライアントで自己検証を要求し、重複をスキップしてクールダウン（デフォルトで 24 時間）を適用します。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効にします。

    起動時には、現在の秘密ストレージとクロス署名 ID を再利用する保守的な暗号ブートストラップ処理も実行されます。ブートストラップ状態が壊れている場合、OpenClaw は `channels.matrix.password` がなくてもガード付き修復を試みます。ホームサーバーがパスワード UIA を要求する場合、起動時は警告をログに記録し、致命的扱いにはしません。すでに所有者署名済みのデバイスは保持されます。

    完全なアップグレードフローについては、[Matrix 移行](/ja-JP/channels/matrix-migration)を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は、厳格な DM 検証ルームに、検証ライフサイクル通知を `m.notice` メッセージとして投稿します: 要求、準備完了（「絵文字で検証」の案内付き）、開始/完了、および利用可能な場合は SAS（絵文字/十進数）の詳細。

    別の Matrix クライアントからの受信要求は追跡され、自動承認されます。自己検証では、OpenClaw は SAS フローを自動的に開始し、絵文字検証が利用可能になると自分側を確認します。ただし、Matrix クライアントで比較し、「一致します」を確認する必要があります。

    検証システム通知は、エージェントチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="削除済みまたは無効な Matrix デバイス">
    `verify status` が現在のデバイスはホームサーバー上にもう一覧されていないと表示する場合、新しい OpenClaw Matrix デバイスを作成します。パスワードログインの場合:

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

    失敗したコマンドのアカウント ID で `assistant` を置き換えるか、デフォルトアカウントでは `--account` を省略します。

  </Accordion>

  <Accordion title="デバイス管理">
    古い OpenClaw 管理デバイスは蓄積することがあります。一覧表示して整理します:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="暗号ストア">
    Matrix E2EE は、IndexedDB シムとして `fake-indexeddb` を使用する公式 `matrix-js-sdk` Rust 暗号パスを使用します。暗号状態は `crypto-idb-snapshot.json`（制限的なファイル権限）に永続化されます。

    暗号化されたランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下にあり、同期ストア、暗号ストア、リカバリキー、IDB スナップショット、スレッドバインディング、起動時検証状態が含まれます。トークンが変わってもアカウント ID が同じ場合、OpenClaw は最適な既存ルートを再利用するため、以前の状態は引き続き見えるままです。

  </Accordion>
</AccordionGroup>

## プロファイル管理

選択したアカウントの Matrix 自己プロファイルを更新します:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

1 回の呼び出しで両方のオプションを渡せます。Matrix は `mxc://` アバター URL を直接受け付けます。`http://` または `https://` を渡すと、OpenClaw は先にファイルをアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl`（またはアカウントごとの上書き）に保存します。

## スレッド

Matrix は、自動返信とメッセージツール送信の両方でネイティブの Matrix スレッドをサポートします。2 つの独立したノブで動作を制御します:

### セッションルーティング（`sessionScope`）

`dm.sessionScope` は、Matrix DM ルームを OpenClaw セッションにどのようにマッピングするかを決定します:

- `"per-user"`（デフォルト）: 同じルーティング済み相手を持つすべての DM ルームが 1 つのセッションを共有します。
- `"per-room"`: 相手が同じでも、各 Matrix DM ルームが独自のセッションキーを持ちます。

明示的な会話バインディングは常に `sessionScope` より優先されるため、バインドされたルームとスレッドは選択された対象セッションを維持します。

### 返信スレッド化（`threadReplies`）

`threadReplies` は、ボットが返信を投稿する場所を決定します:

- `"off"`: 返信はトップレベルです。受信したスレッド化メッセージは親セッションに残ります。
- `"inbound"`: 受信メッセージがすでにそのスレッド内にあった場合のみ、スレッド内で返信します。
- `"always"`: トリガーしたメッセージをルートとするスレッド内で返信します。その会話は最初のトリガー以降、対応するスレッドスコープのセッションを通じてルーティングされます。

`dm.threadReplies` は DM のみでこれを上書きします。たとえば、ルームスレッドを分離したまま、DM はフラットに保てます。

### スレッド継承とスラッシュコマンド

- インバウンドのスレッド付きメッセージには、追加のエージェントコンテキストとしてスレッドのルートメッセージが含まれます。
- message-tool による送信は、同じルーム（または同じ DM ユーザーターゲット）を対象にする場合、明示的な `threadId` が指定されていない限り、現在の Matrix スレッドを自動的に継承します。
- DM ユーザーターゲットの再利用は、現在のセッションメタデータが同じ Matrix アカウント上の同じ DM 相手であることを証明する場合にのみ有効になります。それ以外の場合、OpenClaw は通常のユーザースコープのルーティングにフォールバックします。
- `/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドにバインドされた `/acp spawn` は、すべて Matrix のルームと DM で動作します。
- トップレベルの `/focus` は、`threadBindings.spawnSubagentSessions: true` の場合、新しい Matrix スレッドを作成し、それを対象セッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、そのスレッドをその場でバインドします。

OpenClaw が、同じ共有セッション上の別の DM ルームと衝突している Matrix DM ルームを検出すると、そのルームに一度だけ `m.notice` を投稿し、`/focus` という退避手段を示して `dm.sessionScope` の変更を提案します。この通知は、スレッドバインディングが有効な場合にのみ表示されます。

## ACP 会話バインディング

Matrix のルーム、DM、および既存の Matrix スレッドは、チャットサーフェスを変更せずに永続的な ACP ワークスペースに変換できます。

高速なオペレーターフロー:

- 使い続けたい Matrix DM、ルーム、または既存スレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM/ルームがチャットサーフェスのまま維持され、以後のメッセージは生成された ACP セッションにルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` がその現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

注:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnAcpSessions` が必要なのは `/acp spawn --thread auto|here` の場合だけです。この場合、OpenClaw は子 Matrix スレッドを作成またはバインドする必要があります。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバル既定値を継承し、チャネルごとの上書きにも対応します。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix のスレッドバインド付き spawn フラグはオプトインです。

- トップレベルの `/focus` が新しい Matrix スレッドを作成してバインドできるようにするには、`threadBindings.spawnSubagentSessions: true` を設定します。
- `/acp spawn --thread auto|here` が ACP セッションを Matrix スレッドにバインドできるようにするには、`threadBindings.spawnAcpSessions: true` を設定します。

## リアクション

Matrix はアウトバウンドリアクション、インバウンドリアクション通知、および ack リアクションに対応します。

アウトバウンドリアクションのツール機能は、`channels.matrix.actions.reactions` によって制御されます。

- `react` は Matrix イベントにリアクションを追加します。
- `reactions` は Matrix イベントの現在のリアクション概要を一覧表示します。
- `emoji=""` は、そのイベント上のボット自身のリアクションを削除します。
- `remove: true` は、指定した絵文字リアクションだけをボットから削除します。

**解決順序**（最初に定義された値が優先されます）:

| 設定                    | 順序                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | アカウントごと → チャネル → `messages.ackReaction` → エージェント ID の絵文字フォールバック |
| `ackReactionScope`      | アカウントごと → チャネル → `messages.ackReactionScope` → 既定値 `"group-mentions"` |
| `reactionNotifications` | アカウントごと → チャネル → 既定値 `"own"`                                          |

`reactionNotifications: "own"` は、ボットが作成した Matrix メッセージを対象に追加された `m.reaction` イベントを転送します。`"off"` はリアクションシステムイベントを無効にします。リアクションの削除は、スタンドアロンの `m.reaction` 削除ではなく Matrix では redaction として表面化するため、システムイベントとして合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める直近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックします。両方とも未設定の場合、有効な既定値は `0` です。無効にするには `0` を設定します。
- Matrix ルーム履歴はルーム専用です。DM は通常のセッション履歴を引き続き使用します。
- Matrix ルーム履歴は保留中のみです。OpenClaw はまだ返信をトリガーしていないルームメッセージをバッファリングし、メンションまたは他のトリガーが到着したときにそのウィンドウのスナップショットを取得します。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメインのインバウンド本文に残ります。
- 同じ Matrix イベントの再試行では、新しいルームメッセージへ前方にずれるのではなく、元の履歴スナップショットを再利用します。

## コンテキスト可視性

Matrix は、取得した返信テキスト、スレッドルート、保留中履歴などの補足ルームコンテキストに対して、共有の `contextVisibility` 制御に対応します。

- `contextVisibility: "all"` が既定です。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブなルーム/ユーザーの許可リストチェックで許可された送信者に補足コンテキストをフィルタリングします。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的に引用された返信を1つ保持します。

この設定は補足コンテキストの可視性に影響しますが、インバウンドメッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガー認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、および DM ポリシー設定から決まります。

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

ルームは動作させたまま DM を完全に停止するには、`dm.enabled: false` を設定します。

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

メンションゲートと許可リストの動作については、[グループ](/ja-JP/channels/groups) を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前にメッセージを送り続けた場合、OpenClaw は同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに短いクールダウン後にリマインダー返信を送信することがあります。

共有の DM ペアリングフローとストレージレイアウトについては、[ペアリング](/ja-JP/channels/pairing) を参照してください。

## ダイレクトルーム修復

ダイレクトメッセージの状態が同期から外れると、OpenClaw はライブの DM ではなく古い単独ルームを指す古い `m.direct` マッピングを持つことがあります。相手の現在のマッピングを確認します。

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
- 正常な DM が存在しない場合、新しいダイレクトルームを作成して `m.direct` を書き換えます

古いルームは自動的には削除されません。正常な DM を選択してマッピングを更新し、今後の Matrix 送信、検証通知、およびその他のダイレクトメッセージフローが正しいルームを対象にするようにします。

## Exec 承認

Matrix はネイティブ承認クライアントとして機能できます。`channels.matrix.execApprovals`（またはアカウントごとの上書きには `channels.matrix.accounts.<account>.execApprovals`）の下で設定します。

- `enabled`: Matrix ネイティブプロンプトを通じて承認を配信します。未設定または `"auto"` の場合、少なくとも1人の承認者を解決できると Matrix が自動的に有効になります。明示的に無効にするには `false` を設定します。
- `approvers`: exec リクエストの承認を許可された Matrix ユーザー ID（`@owner:example.org`）。任意です。`channels.matrix.dm.allowFrom` にフォールバックします。
- `target`: プロンプトの送信先。`"dm"`（既定）は承認者の DM に送信します。`"channel"` は発信元の Matrix ルームまたは DM に送信します。`"both"` は両方に送信します。
- `agentFilter` / `sessionFilter`: どのエージェント/セッションが Matrix 配信をトリガーするかを制御する任意の許可リスト。

認可は承認の種類によって少し異なります。

- **Exec 承認** は `execApprovals.approvers` を使用し、`dm.allowFrom` にフォールバックします。
- **Plugin 承認** は `dm.allowFrom` のみを通じて認可します。

どちらの種類も Matrix リアクションショートカットとメッセージ更新を共有します。承認者には、主要な承認メッセージ上にリアクションショートカットが表示されます。

- `✅` 1回だけ許可
- `❌` 拒否
- `♾️` 常に許可（有効な exec ポリシーが許可する場合）

フォールバックのスラッシュコマンド: `/approve <id> allow-once`、`/approve <id> allow-always`、`/approve <id> deny`。

解決済みの承認者だけが承認または拒否できます。exec 承認のチャネル配信にはコマンドテキストが含まれます。`channel` または `both` は信頼できるルームでのみ有効にしてください。

関連: [Exec 承認](/ja-JP/tools/exec-approvals)。

## スラッシュコマンド

スラッシュコマンド（`/new`、`/reset`、`/model`、`/focus`、`/unfocus`、`/agents`、`/session`、`/acp`、`/approve` など）は DM で直接動作します。ルームでは、OpenClaw はボット自身の Matrix メンションが先頭に付いたコマンドも認識するため、`@bot:server /new` はカスタムメンション正規表現なしでコマンドパスをトリガーします。これにより、Element などのクライアントで、ユーザーがコマンド入力前にボットをタブ補完したときに生成されるルーム形式の `@mention /command` 投稿に、ボットが応答し続けられます。

認可ルールは引き続き適用されます。コマンド送信者は、通常メッセージと同じ DM またはルームの許可リスト/所有者ポリシーを満たす必要があります。

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

- トップレベルの `channels.matrix` 値は、アカウントが上書きしない限り、名前付きアカウントの既定値として機能します。
- `groups.<room>.account` を使用して、継承されたルームエントリを特定のアカウントにスコープします。`account` のないエントリはアカウント間で共有されます。既定アカウントがトップレベルで設定されている場合も、`account: "default"` は引き続き動作します。

**既定アカウントの選択:**

- 暗黙的なルーティング、プロービング、および CLI コマンドが優先する名前付きアカウントを選ぶには、`defaultAccount` を設定します。
- 複数のアカウントがあり、その1つが文字どおり `default` という名前の場合、`defaultAccount` が未設定でも OpenClaw はそれを暗黙的に使用します。
- 複数の名前付きアカウントがあり、既定が選択されていない場合、CLI コマンドは推測を拒否します。`defaultAccount` を設定するか、`--account <id>` を渡してください。
- トップレベルの `channels.matrix.*` ブロックは、認証が完了している場合（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）にのみ、暗黙的な `default` アカウントとして扱われます。名前付きアカウントは、キャッシュ済み資格情報が認証をカバーしていれば、`homeserver` + `userId` から引き続き検出可能です。

**昇格:**

- OpenClaw が修復またはセットアップ中に単一アカウント設定をマルチアカウントへ昇格する場合、既存の名前付きアカウントが存在するか `defaultAccount` がすでにそれを指している場合は、それを保持します。Matrix の認証/bootstrap キーだけが昇格先アカウントに移動し、共有の配信ポリシーキーはトップレベルに残ります。

共有のマルチアカウントパターンについては、[設定リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels) を参照してください。

## プライベート/LAN homeserver

既定では、SSRF 保護のため、OpenClaw はプライベート/内部 Matrix homeserver をブロックします。ただし、アカウントごとに明示的にオプトインした場合を除きます。

homeserver が localhost、LAN/Tailscale IP、または内部ホスト名で稼働している場合は、その Matrix アカウントで `network.dangerouslyAllowPrivateNetwork` を有効にします。

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
OpenClaw は実行時の Matrix トラフィックとアカウント状態プローブに同じプロキシ設定を使用します。

## ターゲット解決

Matrix は、OpenClaw がルームまたはユーザーターゲットを求める任意の場所で、次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

Matrix ルーム ID は大文字と小文字を区別します。明示的な配信ターゲット、cron ジョブ、バインディング、または許可リストを設定するときは、Matrix の正確なルーム ID の大文字小文字を使用してください。
OpenClaw は保存用の内部セッションキーを正規化して保持するため、これらの小文字キーは Matrix 配信 ID の信頼できる情報源ではありません。

ライブディレクトリ検索では、ログイン済みの Matrix アカウントを使用します。

- ユーザー検索は、その homeserver 上の Matrix ユーザーディレクトリに問い合わせます。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け付けた後、そのアカウントが参加しているルーム名の検索にフォールバックします。
- 参加済みルーム名の検索はベストエフォートです。ルーム名を ID またはエイリアスに解決できない場合、実行時の許可リスト解決では無視されます。

## 設定リファレンス

許可リスト形式のフィールド (`groupAllowFrom`、`dm.allowFrom`、`groups.<room>.users`) は完全な Matrix ユーザー ID を受け付けます (最も安全です)。完全一致するディレクトリ項目は起動時、およびモニターの実行中に許可リストが変更されるたびに解決されます。解決できないエントリは実行時に無視されます。同じ理由で、ルーム許可リストではルーム ID またはエイリアスを優先します。

### アカウントと接続

- `enabled`: チャンネルを有効または無効にします。
- `name`: アカウントの任意の表示ラベル。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合に優先するアカウント ID。
- `accounts`: 名前付きのアカウント別オーバーライド。トップレベルの `channels.matrix` 値はデフォルトとして継承されます。
- `homeserver`: ホームサーバー URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このアカウントが `localhost`、LAN/Tailscale IP、または内部ホスト名に接続することを許可します。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。アカウント別のオーバーライドに対応しています。
- `userId`: 完全な Matrix ユーザー ID (`@bot:example.org`)。
- `accessToken`: トークンベース認証用のアクセストークン。プレーンテキスト値と SecretRef 値は env/file/exec プロバイダー全体で対応しています ([シークレット管理](/ja-JP/gateway/secrets))。
- `password`: パスワードベースログイン用のパスワード。プレーンテキスト値と SecretRef 値に対応しています。
- `deviceId`: 明示的な Matrix デバイス ID。
- `deviceName`: パスワードログイン時に使用されるデバイス表示名。
- `avatarUrl`: プロファイル同期と `profile set` 更新用に保存される自己アバター URL。
- `initialSyncLimit`: 起動時同期中に取得するイベントの最大数。

### 暗号化

- `encryption`: E2EE を有効にします。デフォルト: `false`。
- `startupVerification`: `"if-unverified"` (E2EE がオンの場合のデフォルト) または `"off"`。このデバイスが未検証の場合、起動時に自己検証を自動要求します。
- `startupVerificationCooldownHours`: 次回の自動起動時リクエストまでのクールダウン。デフォルト: `24`。

### アクセスとポリシー

- `groupPolicy`: `"open"`、`"allowlist"`、または `"disabled"`。デフォルト: `"allowlist"`。
- `groupAllowFrom`: ルームトラフィックを許可するユーザー ID の許可リスト。
- `dm.enabled`: `false` の場合、すべての DM を無視します。デフォルト: `true`。
- `dm.policy`: `"pairing"` (デフォルト)、`"allowlist"`、`"open"`、または `"disabled"`。ボットが参加し、ルームを DM として分類した後に適用されます。招待処理には影響しません。
- `dm.allowFrom`: DM トラフィックを許可するユーザー ID の許可リスト。
- `dm.sessionScope`: `"per-user"` (デフォルト) または `"per-room"`。
- `dm.threadReplies`: 返信スレッド化の DM 専用オーバーライド (`"off"`、`"inbound"`、`"always"`)。
- `allowBots`: 他の設定済み Matrix ボットアカウントからのメッセージを受け入れます (`true` または `"mentions"`)。
- `allowlistOnly`: `true` の場合、すべてのアクティブな DM ポリシー (`"disabled"` を除く) と `"open"` グループポリシーを `"allowlist"` に強制します。`"disabled"` ポリシーは変更しません。
- `autoJoin`: `"always"`、`"allowlist"`、または `"off"`。デフォルト: `"off"`。DM 形式の招待を含む、すべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `"allowlist"` の場合に許可されるルーム/エイリアス。エイリアスエントリはホームサーバーに対して解決され、招待されたルームが主張する状態に対しては解決されません。
- `contextVisibility`: 補助コンテキストの可視性 (`"all"` デフォルト、`"allowlist"`、`"allowlist_quote"`)。

### 返信動作

- `replyToMode`: `"off"`、`"first"`、`"all"`、または `"batched"`。
- `threadReplies`: `"off"`、`"inbound"`、または `"always"`。
- `threadBindings`: スレッドに紐づくセッションルーティングとライフサイクルのチャンネル別オーバーライド。
- `streaming`: `"off"` (デフォルト)、`"partial"`、`"quiet"`、またはオブジェクト形式 `{ mode, preview: { toolProgress } }`。`true` ↔ `"partial"`、`false` ↔ `"off"`。
- `blockStreaming`: `true` の場合、完了したアシスタントブロックは個別の進行状況メッセージとして保持されます。
- `markdown`: 送信テキスト用の任意の Markdown レンダリング設定。
- `responsePrefix`: 送信返信の先頭に追加する任意の文字列。
- `textChunkLimit`: `chunkMode: "length"` の場合の送信チャンクサイズ (文字数)。デフォルト: `4000`。
- `chunkMode`: `"length"` (デフォルト、文字数で分割) または `"newline"` (行境界で分割)。
- `historyLimit`: ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数。`messages.groupChat.historyLimit` にフォールバックします。有効なデフォルトは `0` (無効)。
- `mediaMaxMb`: 送信および受信処理のメディアサイズ上限 (MB)。

### リアクション設定

- `ackReaction`: このチャンネル/アカウントの ack リアクションオーバーライド。
- `ackReactionScope`: スコープオーバーライド (`"group-mentions"` デフォルト、`"group-all"`、`"direct"`、`"all"`、`"none"`、`"off"`)。
- `reactionNotifications`: 受信リアクション通知モード (`"own"` デフォルト、`"off"`)。

### ツールとルーム別オーバーライド

- `actions`: アクション別のツール制御 (`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`)。
- `groups`: ルーム別ポリシーマップ。セッション ID には解決後の安定したルーム ID が使用されます。(`rooms` はレガシーエイリアスです。)
  - `groups.<room>.account`: 継承されたルームエントリ 1 つを特定のアカウントに制限します。
  - `groups.<room>.allowBots`: チャンネルレベル設定のルーム別オーバーライド (`true` または `"mentions"`)。
  - `groups.<room>.users`: ルーム別の送信者許可リスト。
  - `groups.<room>.tools`: ルーム別のツール許可/拒否オーバーライド。
  - `groups.<room>.autoReply`: ルーム別のメンション制御オーバーライド。`true` はそのルームのメンション要件を無効にし、`false` は再び強制します。
  - `groups.<room>.skills`: ルーム別の skill フィルター。
  - `groups.<room>.systemPrompt`: ルーム別のシステムプロンプトスニペット。

### exec 承認設定

- `execApprovals.enabled`: Matrix ネイティブのプロンプトを通じて exec 承認を配信します。
- `execApprovals.approvers`: 承認を許可された Matrix ユーザー ID。`dm.allowFrom` にフォールバックします。
- `execApprovals.target`: `"dm"` (デフォルト)、`"channel"`、または `"both"`。
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: 配信用の任意のエージェント/セッション許可リスト。

## 関連

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
