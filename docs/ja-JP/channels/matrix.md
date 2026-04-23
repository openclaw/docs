---
read_when:
    - OpenClaw で Matrix をセットアップする
    - Matrix の E2EE と検証を設定する
summary: Matrix のサポート状況、セットアップ、および設定例
title: Matrix
x-i18n:
    generated_at: "2026-04-23T15:00:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e9d4d656b47aca2dacb00e591378cb26631afc5b634074bc26e21741b418b47
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix は OpenClaw のバンドル済み channel plugin です。
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## バンドル済み plugin

Matrix は現在の OpenClaw リリースではバンドル済み plugin として提供されるため、通常の
パッケージ版ビルドでは別途インストールは不要です。

古いビルドや、Matrix が除外されたカスタムインストールを使用している場合は、
手動でインストールしてください。

npm からインストール:

```bash
openclaw plugins install @openclaw/matrix
```

ローカルチェックアウトからインストール:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

plugin の動作とインストール規則については、[Plugins](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. Matrix plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースには、すでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. homeserver 上で Matrix アカウントを作成します。
3. `channels.matrix` を次のいずれかで設定します。
   - `homeserver` + `accessToken`、または
   - `homeserver` + `userId` + `password`。
4. Gateway を再起動します。
5. ボットとの DM を開始するか、ルームに招待します。
   - 新しい Matrix 招待は、`channels.matrix.autoJoin` がそれを許可している場合にのみ機能します。

対話式セットアップ手順:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix ウィザードでは次を尋ねます:

- homeserver URL
- 認証方式: アクセストークンまたはパスワード
- ユーザー ID（パスワード認証のみ）
- 任意のデバイス名
- E2EE を有効にするかどうか
- ルームアクセスと招待自動参加を設定するかどうか

ウィザードの主な動作:

- Matrix 認証 env var がすでに存在し、そのアカウントの認証情報がまだ config に保存されていない場合、ウィザードは認証を env var に保持するための env ショートカットを提示します。
- アカウント名はアカウント ID に正規化されます。たとえば、`Ops Bot` は `ops-bot` になります。
- DM allowlist エントリでは `@user:server` を直接受け付けます。表示名は、ライブディレクトリ検索で完全一致が 1 件見つかった場合のみ機能します。
- ルーム allowlist エントリではルーム ID とエイリアスを直接受け付けます。`!room:server` または `#alias:server` を推奨します。未解決の名前は、allowlist 解決時に実行時には無視されます。
- 招待自動参加の allowlist モードでは、安定した招待対象のみを使用してください: `!roomId:server`、`#alias:server`、または `*`。単純なルーム名は拒否されます。
- 保存前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を使用します。

<Warning>
`channels.matrix.autoJoin` のデフォルトは `off` です。

未設定のままにすると、ボットは招待されたルームや新しい DM スタイルの招待に参加しないため、先に手動で参加しない限り、新しいグループや招待された DM に表示されません。

受け入れる招待を制限したい場合は、`autoJoin: "allowlist"` を `autoJoinAllowlist` と組み合わせて設定するか、すべての招待に参加させたい場合は `autoJoin: "always"` を設定してください。

`allowlist` モードでは、`autoJoinAllowlist` は `!roomId:server`、`#alias:server`、または `*` だけを受け付けます。
</Warning>

allowlist の例:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

すべての招待に参加:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

最小のトークンベース設定:

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

パスワードベース設定（ログイン後にトークンはキャッシュされます）:

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

Matrix はキャッシュ済み認証情報を `~/.openclaw/credentials/matrix/` に保存します。
デフォルトアカウントでは `credentials.json` を使用し、名前付きアカウントでは `credentials-<account>.json` を使用します。
そこにキャッシュ済み認証情報が存在する場合、現在の認証が config に直接設定されていなくても、OpenClaw はセットアップ、doctor、および channel-status 検出において Matrix を設定済みとして扱います。

環境変数の対応関係（config キーが設定されていない場合に使用されます）:

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

デフォルト以外のアカウントでは、アカウント単位の env var を使用します:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

アカウント `ops` の例:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

正規化済みアカウント ID `ops-bot` では次を使用します:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix はアカウント ID 内の句読点をエスケープして、アカウント単位の env var が衝突しないようにします。
たとえば、`-` は `_X2D_` になるため、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` に対応します。

対話式ウィザードは、それらの認証 env var がすでに存在し、選択したアカウントに Matrix 認証がまだ config に保存されていない場合にのみ、env-var ショートカットを提示します。

`MATRIX_HOMESERVER` は workspace の `.env` からは設定できません。詳細は [Workspace `.env` files](/ja-JP/gateway/security) を参照してください。

## 設定例

これは、DM pairing、ルーム allowlist、E2EE を有効にした実用的なベースライン設定です:

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
        "!roomid:example.org": {
          requireMention: true,
        },
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

`autoJoin` は、DM スタイルの招待を含むすべての Matrix 招待に適用されます。OpenClaw は
招待時点で招待されたルームを DM かグループか確実に分類できないため、すべての招待はまず `autoJoin`
を通過します。`dm.policy` は、ボットが参加してルームが DM と分類された後に適用されます。

## ストリーミングプレビュー

Matrix の返信ストリーミングはオプトインです。

OpenClaw に、単一のライブプレビュー
返信を送信し、モデルがテキストを生成している間はそのプレビューをその場で編集し、返信完了時に確定させたい場合は、
`channels.matrix.streaming` を `"partial"` に設定します:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` がデフォルトです。OpenClaw は最終返信を待ってから 1 回だけ送信します。
- `streaming: "partial"` は、通常の Matrix テキストメッセージを使って、現在の assistant ブロック用の編集可能なプレビューメッセージを 1 件作成します。これにより、Matrix の従来の「プレビュー先行」通知動作が維持されるため、標準クライアントでは完成済みブロックではなく、最初にストリーミングされたプレビューテキストで通知されることがあります。
- `streaming: "quiet"` は、現在の assistant ブロック用に編集可能な静かなプレビュー通知を 1 件作成します。これは、確定済みプレビュー編集用の受信者プッシュルールも設定する場合にのみ使用してください。
- `blockStreaming: true` は個別の Matrix 進捗メッセージを有効にします。プレビュー ストリーミングが有効な場合、Matrix は現在のブロックのライブ下書きを保持し、完了済みブロックを別メッセージとして保持します。
- プレビュー ストリーミングがオンで `blockStreaming` がオフの場合、Matrix はライブ下書きをその場で編集し、ブロックまたはターンの完了時にその同じイベントを確定します。
- プレビューが 1 つの Matrix イベントに収まらなくなった場合、OpenClaw はプレビュー ストリーミングを停止し、通常の最終配信にフォールバックします。
- メディア返信は引き続き通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClaw は最終メディア返信を送信する前にそれを redact します。
- プレビュー編集は Matrix API 呼び出しを追加で消費します。最も保守的な rate-limit 動作を望む場合は、ストリーミングをオフのままにしてください。

`blockStreaming` 自体では下書きプレビューは有効になりません。
プレビュー編集には `streaming: "partial"` または `streaming: "quiet"` を使用し、そのうえで完了済み assistant ブロックも個別の進捗メッセージとして表示したい場合にのみ `blockStreaming: true` を追加してください。

カスタムプッシュルールなしで標準の Matrix 通知が必要な場合は、プレビュー先行動作のために `streaming: "partial"` を使用するか、最終のみの配信のために `streaming` をオフのままにしてください。`streaming: "off"` の場合:

- `blockStreaming: true` は、完了した各ブロックを通常の通知付き Matrix メッセージとして送信します。
- `blockStreaming: false` は、最終的に完成した返信のみを通常の通知付き Matrix メッセージとして送信します。

### 静かな確定済みプレビュー向けのセルフホスト push rules

静かなストリーミング（`streaming: "quiet"`）では、ブロックまたはターンが確定したときにのみ受信者へ通知されます。確定済みプレビューのマーカーに一致するユーザーごとの push rule が必要です。完全なセットアップ（受信者トークン、pusher チェック、ルールインストール、homeserver ごとの注意点）については、[静かなプレビュー向け Matrix push rules](/ja-JP/channels/matrix-push-rules) を参照してください。

## ボット間ルーム

デフォルトでは、他の設定済み OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。

意図的にエージェント間の Matrix トラフィックを許可したい場合は `allowBots` を使用します:

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

- `allowBots: true` は、許可されたルームと DM において、他の設定済み Matrix ボットアカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルーム内でこのボットへの明示的なメンションがある場合にのみ、それらのメッセージを受け入れます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベル設定を上書きします。
- OpenClaw は自己返信ループを避けるため、同じ Matrix ユーザー ID からのメッセージは引き続き無視します。
- Matrix はここでネイティブの bot フラグを公開していないため、OpenClaw は「bot によって送信された」を「この OpenClaw Gateway 上で設定された別の Matrix アカウントによって送信された」として扱います。

共有ルームでボット間トラフィックを有効にする場合は、厳格なルーム allowlist とメンション要件を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは、引き続きプレーンな `thumbnail_url` を使用します。設定は不要です。plugin が E2EE 状態を自動検出します。

暗号化を有効にする:

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

検証コマンド（すべて診断用の `--verbose` と機械可読出力用の `--json` を受け取ります）:

| コマンド                                                        | 目的                                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | cross-signing とデバイス検証の状態を確認する                                        |
| `openclaw matrix verify status --include-recovery-key --json`  | 保存済みの recovery key を含める                                                    |
| `openclaw matrix verify bootstrap`                             | cross-signing と検証を bootstrap する（下記参照）                                   |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | 現在の cross-signing ID を破棄して新しいものを作成する                              |
| `openclaw matrix verify device "<recovery-key>"`               | recovery key を使ってこのデバイスを検証する                                         |
| `openclaw matrix verify backup status`                         | room-key backup の健全性を確認する                                                  |
| `openclaw matrix verify backup restore`                        | サーバーバックアップから room keys を復元する                                       |
| `openclaw matrix verify backup reset --yes`                    | 現在のバックアップを削除して新しいベースラインを作成する（secret storage を再作成する場合があります） |

マルチアカウント構成では、Matrix CLI コマンドは `--account <id>` を渡さない限り、暗黙の Matrix デフォルトアカウントを使用します。
複数の名前付きアカウントを設定している場合は、最初に `channels.matrix.defaultAccount` を設定してください。そうしないと、それらの暗黙的な CLI 操作は停止して、明示的にアカウントを選ぶよう求めます。
検証またはデバイス操作の対象を明示的に名前付きアカウントにしたい場合は、常に `--account` を使用してください。

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

暗号化が無効、または名前付きアカウントで利用できない場合、Matrix の警告と検証エラーはそのアカウントの config キーを指します。たとえば `channels.matrix.accounts.assistant.encryption` です。

<AccordionGroup>
  <Accordion title="verified の意味">
    OpenClaw は、あなた自身の cross-signing ID が署名した場合にのみ、デバイスを verified と見なします。`verify status --verbose` は 3 つの trust signal を表示します。

    - `Locally trusted`: このクライアントでのみ信頼されている
    - `Cross-signing verified`: SDK が cross-signing による検証を報告している
    - `Signed by owner`: あなた自身の self-signing key によって署名されている

    `Verified by owner` は、cross-signing または owner-signing が存在する場合にのみ `yes` になります。ローカル信頼だけでは不十分です。

  </Accordion>

  <Accordion title="bootstrap が行うこと">
    `verify bootstrap` は、暗号化アカウント向けの修復およびセットアップコマンドです。順に次を実行します。

    - secret storage を bootstrap し、可能な場合は既存の recovery key を再利用する
    - cross-signing を bootstrap し、不足している公開 cross-signing keys をアップロードする
    - 現在のデバイスに印を付けて cross-sign する
    - サーバー側の room-key backup がまだ存在しない場合は作成する

    homeserver が cross-signing keys のアップロードに UIA を要求する場合、OpenClaw はまず no-auth を試し、その後 `m.login.dummy`、さらに `m.login.password` を試します（`channels.matrix.password` が必要です）。`--force-reset-cross-signing` は、現在の ID を意図的に破棄する場合にのみ使用してください。

  </Accordion>

  <Accordion title="新しいバックアップベースライン">
    今後の暗号化メッセージを動作させ続けつつ、復元不能な古い履歴を失っても構わない場合:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    名前付きアカウントを対象にするには `--account <id>` を追加します。現在の backup secret を安全に読み込めない場合、これにより secret storage も再作成されることがあります。

  </Accordion>

  <Accordion title="起動時の動作">
    `encryption: true` の場合、`startupVerification` のデフォルトは `"if-unverified"` です。起動時に未検証デバイスは、別の Matrix クライアントでの自己検証を要求し、重複を避けつつクールダウンを適用します。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効化できます。

    起動時には、現在の secret storage と cross-signing ID を再利用する保守的な crypto bootstrap パスも実行されます。bootstrap 状態が壊れている場合、OpenClaw は `channels.matrix.password` がなくても保護付き修復を試みます。homeserver が password UIA を要求する場合、起動時に警告をログ出力し、致命的エラーにはなりません。すでに owner-signed 済みのデバイスは保持されます。

    完全なアップグレード手順については、[Matrix migration](/ja-JP/install/migrating-matrix) を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は検証ライフサイクル通知を、厳格な DM 検証ルームへ `m.notice` メッセージとして投稿します。内容は request、ready（「Verify by emoji」の案内付き）、start/completion、および利用可能な場合の SAS（emoji/decimal）詳細です。

    別の Matrix クライアントからの受信リクエストは追跡され、自動承認されます。自己検証では、OpenClaw は emoji 検証が利用可能になると自動で SAS フローを開始し、自身の側を確認します。ただし、Matrix クライアント側で「They match」を比較して確認する必要があります。

    検証システム通知は agent chat pipeline には転送されません。

  </Accordion>

  <Accordion title="デバイスの衛生管理">
    OpenClaw 管理下の古いデバイスが蓄積することがあります。一覧表示と削除は次を使用します。

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE は、IndexedDB shim として `fake-indexeddb` を使用する公式の `matrix-js-sdk` Rust crypto path を使用します。crypto state は `crypto-idb-snapshot.json` に永続化されます（制限されたファイル権限）。

    暗号化された実行時 state は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下にあり、sync store、crypto store、recovery key、IDB snapshot、thread bindings、startup verification state を含みます。トークンが変わってもアカウント ID が同じ場合、OpenClaw は既存の最適な root を再利用するため、以前の state は引き続き参照できます。

  </Accordion>
</AccordionGroup>

## プロファイル管理

選択したアカウントの Matrix self-profile を更新するには、次を使用します。

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

名前付き Matrix アカウントを明示的に対象にしたい場合は、`--account <id>` を追加します。

Matrix は `mxc://` avatar URL を直接受け付けます。`http://` または `https://` の avatar URL を渡した場合、OpenClaw は最初にそれを Matrix にアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl`（または選択したアカウントの override）に書き戻します。

## スレッド

Matrix は、自動返信と message-tool 送信の両方でネイティブ Matrix スレッドをサポートします。

- `dm.sessionScope: "per-user"`（デフォルト）は Matrix DM ルーティングを送信者スコープで維持するため、同じ相手に解決される複数の DM ルームが 1 つのセッションを共有できます。
- `dm.sessionScope: "per-room"` は、通常の DM 認証と allowlist チェックを使用しつつ、各 Matrix DM ルームを独自のセッションキーに分離します。
- 明示的な Matrix conversation bindings は引き続き `dm.sessionScope` より優先されるため、bind 済みのルームとスレッドは選択された対象セッションを維持します。
- `threadReplies: "off"` は返信をトップレベルに保ち、受信したスレッドメッセージを親セッション上に維持します。
- `threadReplies: "inbound"` は、受信メッセージがすでにそのスレッド内にある場合にのみ、スレッド内で返信します。
- `threadReplies: "always"` は、トリガーとなったメッセージをルートとするスレッド内にルーム返信を維持し、その会話を最初のトリガーメッセージから対応する thread-scoped session にルーティングします。
- `dm.threadReplies` は、DM に対してのみトップレベル設定を上書きします。たとえば、ルームスレッドは分離したまま、DM はフラットに保てます。
- 受信したスレッドメッセージには、追加の agent context としてスレッドルートメッセージが含まれます。
- Message-tool 送信は、明示的な `threadId` が指定されていない限り、対象が同じルーム、または同じ DM ユーザー対象である場合、自動的に現在の Matrix スレッドを継承します。
- 同一セッションの DM ユーザー対象再利用は、現在のセッション metadata が同じ Matrix アカウント上の同じ DM peer であることを証明する場合にのみ有効です。そうでない場合、OpenClaw は通常のユーザースコープルーティングにフォールバックします。
- OpenClaw が、Matrix DM ルームが同じ共有 Matrix DM セッション上の別の DM ルームと衝突していることを検出した場合、thread bindings が有効で `dm.sessionScope` ヒントがあると、そのルームに `/focus` エスケープハッチ付きの一度限りの `m.notice` を投稿します。
- 実行時 thread bindings は Matrix でサポートされています。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、および thread-bound `/acp spawn` は Matrix ルームと DM で動作します。
- トップレベルの Matrix ルーム/DM での `/focus` は、`threadBindings.spawnSubagentSessions=true` のとき、新しい Matrix スレッドを作成し、それを対象セッションに bind します。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、代わりにその現在のスレッドが bind されます。

## ACP conversation bindings

Matrix ルーム、DM、および既存の Matrix スレッドは、チャット surface を変更せずに永続的な ACP workspace にできます。

高速な operator フロー:

- 使い続けたい Matrix DM、ルーム、または既存スレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM/ルームがそのまま chat surface となり、以後のメッセージは生成された ACP セッションにルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` はその現在のスレッドをその場で bind します。
- `/new` と `/reset` は、同じ bind 済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じて binding を削除します。

注意:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnAcpSessions` は `/acp spawn --thread auto|here` にのみ必要です。この場合、OpenClaw は子 Matrix スレッドを作成または bind する必要があります。

### スレッド binding 設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、channel ごとの override もサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix の thread-bound spawn フラグはオプトインです。

- トップレベルの `/focus` で新しい Matrix スレッドの作成と bind を許可するには、`threadBindings.spawnSubagentSessions: true` を設定します。
- `/acp spawn --thread auto|here` が ACP セッションを Matrix スレッドに bind できるようにするには、`threadBindings.spawnAcpSessions: true` を設定します。

## リアクション

Matrix は、送信リアクションアクション、受信リアクション通知、および受信 ack リアクションをサポートします。

- 送信リアクション tooling は `channels["matrix"].actions.reactions` によって制御されます。
- `react` は特定の Matrix event にリアクションを追加します。
- `reactions` は特定の Matrix event に対する現在のリアクション要約を一覧表示します。
- `emoji=""` は、その event 上の bot アカウント自身のリアクションを削除します。
- `remove: true` は、bot アカウントから指定した emoji リアクションのみを削除します。

Ack リアクションは、標準の OpenClaw 解決順序を使用します。

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- agent ID の emoji フォールバック

Ack リアクションスコープは次の順で解決されます。

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

リアクション通知モードは次の順で解決されます。

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- デフォルト: `own`

動作:

- `reactionNotifications: "own"` は、bot が作成した Matrix メッセージを対象にした `m.reaction` event の追加を転送します。
- `reactionNotifications: "off"` はリアクション system events を無効にします。
- リアクション削除は、Matrix ではそれらが独立した `m.reaction` 削除ではなく redactions として扱われるため、system events には合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージが agent をトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックし、両方とも未設定の場合の実効デフォルトは `0` です。無効にするには `0` を設定します。
- Matrix ルーム履歴はルーム専用です。DM は引き続き通常のセッション履歴を使用します。
- Matrix ルーム履歴は pending-only です。OpenClaw はまだ返信をトリガーしていないルームメッセージをバッファし、メンションやその他のトリガーが到着したときにそのウィンドウをスナップショットします。
- 現在のトリガーメッセージは `InboundHistory` には含まれません。そのターンのメインの受信本文に残ります。
- 同じ Matrix event の再試行では、新しいルームメッセージへずれていくのではなく、元の履歴スナップショットを再利用します。

## コンテキスト可視性

Matrix は、取得した返信テキスト、スレッドルート、pending history などの補足ルームコンテキストに対して、共有の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブなルーム/ユーザー allowlist チェックで許可された送信者に、補足コンテキストを絞り込みます。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、1 件の明示的な引用返信は保持します。

この設定は補足コンテキストの可視性に影響するものであり、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガーの認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、および DM policy 設定から決まります。

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
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

メンションゲートと allowlist の動作については、[Groups](/ja-JP/channels/groups) を参照してください。

Matrix DM の pairing 例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前に何度もメッセージを送ってきた場合、OpenClaw は同じ保留中の pairing code を再利用し、新しいコードを発行する代わりに、短いクールダウン後に再度リマインダー返信を送ることがあります。

共有の DM pairing フローと保存レイアウトについては、[Pairing](/ja-JP/channels/pairing) を参照してください。

## ダイレクトルーム修復

ダイレクトメッセージ state が同期ずれを起こすと、OpenClaw は、ライブ DM ではなく古い 1 対 1 ルームを指す stale な `m.direct` マッピングを持つことがあります。相手の現在のマッピングを確認するには、次を実行します。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには、次を実行します。

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修復フロー:

- すでに `m.direct` にマップされている厳密な 1:1 DM を優先する
- そのユーザーとの、現在参加中の厳密な 1:1 DM にフォールバックする
- 正常な DM が存在しない場合は、新しいダイレクトルームを作成して `m.direct` を書き換える

修復フローは古いルームを自動削除しません。正常な DM を選択し、マッピングを更新するだけなので、新しい Matrix 送信、検証通知、その他のダイレクトメッセージフローが再び正しいルームを対象にするようになります。

## Exec approvals

Matrix は、Matrix アカウント向けのネイティブ承認クライアントとして動作できます。ネイティブの
DM/channel ルーティング設定は、引き続き exec approval config 配下にあります。

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（任意。`channels.matrix.dm.allowFrom` にフォールバックします）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

承認者は `@owner:example.org` のような Matrix ユーザー ID である必要があります。`enabled` が未設定または `"auto"` で、少なくとも 1 人の承認者を解決できる場合、Matrix はネイティブ承認を自動有効化します。Exec approvals は最初に `execApprovals.approvers` を使用し、`channels.matrix.dm.allowFrom` にフォールバックできます。Plugin approvals は `channels.matrix.dm.allowFrom` を通じて認可されます。Matrix をネイティブ承認クライアントとして明示的に無効化するには、`enabled: false` を設定します。それ以外の場合、承認リクエストは他の設定済み承認ルートまたは承認フォールバックポリシーにフォールバックします。

Matrix のネイティブルーティングは、両方の承認種別をサポートします。

- `channels.matrix.execApprovals.*` は、Matrix 承認プロンプトのネイティブ DM/channel ファンアウトモードを制御します。
- Exec approvals は、`execApprovals.approvers` または `channels.matrix.dm.allowFrom` からの exec 承認者セットを使用します。
- Plugin approvals は、`channels.matrix.dm.allowFrom` からの Matrix DM allowlist を使用します。
- Matrix リアクションショートカットとメッセージ更新は、exec approvals と plugin approvals の両方に適用されます。

配信ルール:

- `target: "dm"` は承認プロンプトを承認者 DM に送信します
- `target: "channel"` はプロンプトを元の Matrix ルームまたは DM に送り返します
- `target: "both"` は承認者 DM と元の Matrix ルームまたは DM の両方に送信します

Matrix 承認プロンプトは、主要な承認メッセージにリアクションショートカットを設定します。

- `✅` = 1 回だけ許可
- `❌` = 拒否
- `♾️` = 実効 exec policy でその判断が許可されている場合に常に許可

承認者はそのメッセージにリアクションするか、フォールバックのスラッシュコマンド `/approve <id> allow-once`、`/approve <id> allow-always`、または `/approve <id> deny` を使用できます。

承認または拒否できるのは、解決済み承認者だけです。Exec approvals では channel 配信にコマンドテキストが含まれるため、`channel` または `both` は信頼できるルームでのみ有効にしてください。

アカウント単位の override:

- `channels.matrix.accounts.<account>.execApprovals`

関連ドキュメント: [Exec approvals](/ja-JP/tools/exec-approvals)

## スラッシュコマンド

Matrix のスラッシュコマンド（たとえば `/new`、`/reset`、`/model`）は DM で直接動作します。ルームでは、OpenClaw はボット自身の Matrix メンションが前置されたスラッシュコマンドも認識するため、`@bot:server /new` はカスタムメンション regex を必要とせずにコマンドパスをトリガーします。これにより、Element や類似クライアントで、ユーザーがコマンド入力前にボットをタブ補完したときに送信されるルーム形式の `@mention /command` 投稿にも、ボットが応答できるようになります。

認可ルールは引き続き適用されます。コマンド送信者は、通常メッセージと同様に DM またはルームの allowlist/owner policy を満たす必要があります。

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

トップレベルの `channels.matrix` の値は、アカウント側で override されない限り、名前付きアカウントのデフォルトとして動作します。
`groups.<room>.account` を使うと、継承されたルームエントリを 1 つの Matrix アカウントに限定できます。
`account` を持たないエントリはすべての Matrix アカウントで共有されたままとなり、`account: "default"` を持つエントリは、デフォルトアカウントがトップレベルの `channels.matrix.*` に直接設定されている場合でも引き続き動作します。
共有認証デフォルトが部分的にあるだけでは、それ自体で別の暗黙的デフォルトアカウントは作成されません。OpenClaw がトップレベルの `default` アカウントを合成するのは、そのデフォルトに新しい認証情報（`homeserver` と `accessToken`、または `homeserver` と `userId` および `password`）がある場合だけです。名前付きアカウントは、後でキャッシュ済み認証情報が認証を満たす場合、`homeserver` と `userId` からでも引き続き検出可能です。
Matrix にすでにちょうど 1 つの名前付きアカウントがある場合、または `defaultAccount` が既存の名前付きアカウントキーを指している場合、単一アカウントからマルチアカウントへの修復/セットアップ昇格では、新しい `accounts.default` エントリを作成する代わりにそのアカウントが保持されます。昇格されたそのアカウントに移動するのは Matrix の auth/bootstrap キーだけであり、共有配信ポリシーキーはトップレベルに残ります。
暗黙的ルーティング、プローブ、および CLI 操作で OpenClaw に 1 つの名前付き Matrix アカウントを優先させたい場合は、`defaultAccount` を設定してください。
複数の Matrix アカウントが設定されていて、アカウント ID の 1 つが `default` である場合、`defaultAccount` が未設定でも OpenClaw はそのアカウントを暗黙的に使用します。
複数の名前付きアカウントを設定する場合は、暗黙的なアカウント選択に依存する CLI コマンドのために、`defaultAccount` を設定するか `--account <id>` を渡してください。
1 つのコマンドについてその暗黙的選択を上書きしたい場合は、`openclaw matrix verify ...` と `openclaw matrix devices ...` に `--account <id>` を渡してください。

共有のマルチアカウントパターンについては、[Configuration reference](/ja-JP/gateway/configuration-reference#multi-account-all-channels) を参照してください。

## プライベート/LAN homeserver

デフォルトでは、OpenClaw は SSRF 保護のため、アカウントごとに
明示的にオプトインしない限り、プライベート/内部 Matrix homeserver をブロックします。

homeserver が localhost、LAN/Tailscale IP、または内部ホスト名で動作している場合は、
その Matrix アカウントに対して `network.dangerouslyAllowPrivateNetwork` を有効にしてください。

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

このオプトインは、信頼されたプライベート/内部ターゲットのみを許可します。
`http://matrix.example.org:8008` のような公開プレーンテキスト homeserver は引き続きブロックされます。可能な限り `https://` を使用してください。

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

名前付きアカウントは、`channels.matrix.accounts.<id>.proxy` でトップレベルのデフォルトを override できます。
OpenClaw は、実行時の Matrix トラフィックとアカウントステータスプローブの両方で同じプロキシ設定を使用します。

## ターゲット解決

OpenClaw がルームまたはユーザーのターゲット指定を求める箇所では、Matrix は次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

ライブディレクトリ検索は、ログイン済み Matrix アカウントを使用します。

- ユーザー検索は、その homeserver 上の Matrix user directory を問い合わせます。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け付け、その後そのアカウントで参加中のルーム名検索にフォールバックします。
- 参加中ルーム名の検索はベストエフォートです。ルーム名を ID またはエイリアスに解決できない場合、実行時 allowlist 解決では無視されます。

## 設定リファレンス

- `enabled`: channel を有効または無効にします。
- `name`: アカウントの任意ラベルです。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合の優先アカウント ID です。
- `homeserver`: homeserver URL。たとえば `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: この Matrix アカウントがプライベート/内部 homeserver に接続できるようにします。homeserver が `localhost`、LAN/Tailscale IP、または `matrix-synapse` のような内部ホストに解決される場合に有効化してください。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL です。名前付きアカウントは独自の `proxy` でトップレベルのデフォルトを override できます。
- `userId`: 完全な Matrix ユーザー ID。たとえば `@bot:example.org`。
- `accessToken`: トークンベース認証用のアクセストークンです。平文値と SecretRef 値は、env/file/exec provider 全体で `channels.matrix.accessToken` および `channels.matrix.accounts.<id>.accessToken` に対応しています。[Secrets Management](/ja-JP/gateway/secrets) を参照してください。
- `password`: パスワードベースログイン用のパスワードです。平文値と SecretRef 値に対応しています。
- `deviceId`: 明示的な Matrix デバイス ID。
- `deviceName`: パスワードログイン用のデバイス表示名。
- `avatarUrl`: プロファイル同期と `profile set` 更新用に保存される self-avatar URL。
- `initialSyncLimit`: 起動時 sync 中に取得するイベントの最大数。
- `encryption`: E2EE を有効にします。
- `allowlistOnly`: `true` の場合、`open` ルーム policy を `allowlist` に引き上げ、`disabled` 以外のすべてのアクティブな DM policy（`pairing` と `open` を含む）を `allowlist` に強制します。`disabled` policy には影響しません。
- `allowBots`: 他の設定済み OpenClaw Matrix アカウントからのメッセージを許可します（`true` または `"mentions"`）。
- `groupPolicy`: `open`、`allowlist`、または `disabled`。
- `contextVisibility`: 補足ルームコンテキストの可視性モード（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`: ルームトラフィック用のユーザー ID allowlist。完全な Matrix ユーザー ID が最も安全です。完全一致のディレクトリ解決は起動時、および monitor 実行中に allowlist が変更されたときに行われます。未解決の名前は無視されます。
- `historyLimit`: グループ履歴コンテキストとして含めるルームメッセージの最大数。`messages.groupChat.historyLimit` にフォールバックし、両方とも未設定の場合の実効デフォルトは `0` です。無効にするには `0` を設定します。
- `replyToMode`: `off`、`first`、`all`、または `batched`。
- `markdown`: 送信 Matrix テキスト用の任意の Markdown レンダリング設定。
- `streaming`: `off`（デフォルト）、`"partial"`、`"quiet"`、`true`、または `false`。`"partial"` と `true` は通常の Matrix テキストメッセージによるプレビュー先行の下書き更新を有効にします。`"quiet"` はセルフホスト push-rule 構成向けに非通知のプレビュー通知を使用します。`false` は `"off"` と同等です。
- `blockStreaming`: `true` にすると、下書きプレビュー ストリーミングが有効な間、完了済み assistant ブロックごとに個別の進捗メッセージを有効にします。
- `threadReplies`: `off`、`inbound`、または `always`。
- `threadBindings`: thread-bound session ルーティングとライフサイクル用の channel 単位 override。
- `startupVerification`: 起動時の自動自己検証リクエストモード（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`: 自動起動時検証リクエストを再試行するまでのクールダウン。
- `textChunkLimit`: 文字数単位の送信メッセージ chunk サイズ（`chunkMode` が `length` の場合に適用）。
- `chunkMode`: `length` は文字数でメッセージを分割し、`newline` は行境界で分割します。
- `responsePrefix`: この channel のすべての送信返信の先頭に付ける任意の文字列。
- `ackReaction`: この channel/account 用の任意の ack リアクション override。
- `ackReactionScope`: 任意の ack リアクションスコープ override（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`: 受信リアクション通知モード（`own`、`off`）。
- `mediaMaxMb`: 送信時と受信メディア処理時のメディアサイズ上限（MB）。
- `autoJoin`: 招待自動参加 policy（`always`、`allowlist`、`off`）。デフォルト: `off`。DM スタイルの招待を含むすべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `allowlist` のときに許可されるルーム/エイリアス。エイリアスエントリは招待処理中にルーム ID に解決されます。OpenClaw は、招待されたルームが主張するエイリアス state を信用しません。
- `dm`: DM policy ブロック（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`: OpenClaw がルームに参加し、それを DM と分類した後の DM アクセスを制御します。招待を自動参加するかどうかは変更しません。
- `dm.allowFrom`: DM トラフィック用のユーザー ID allowlist。完全な Matrix ユーザー ID が最も安全です。完全一致のディレクトリ解決は起動時、および monitor 実行中に allowlist が変更されたときに行われます。未解決の名前は無視されます。
- `dm.sessionScope`: `per-user`（デフォルト）または `per-room`。相手が同じでも各 Matrix DM ルームで別々のコンテキストを維持したい場合は `per-room` を使用します。
- `dm.threadReplies`: DM 専用のスレッド policy override（`off`、`inbound`、`always`）。DM における返信配置と session 分離の両方について、トップレベルの `threadReplies` 設定を override します。
- `execApprovals`: Matrix ネイティブの exec approval 配信（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`: exec リクエストを承認できる Matrix ユーザー ID。`dm.allowFrom` がすでに承認者を特定している場合は任意です。
- `execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。
- `accounts`: 名前付きのアカウント単位 override。トップレベルの `channels.matrix` 値は、これらのエントリのデフォルトとして機能します。
- `groups`: ルーム単位の policy map。ルーム ID またはエイリアスを推奨します。未解決のルーム名は実行時に無視されます。session/group ID は解決後の安定したルーム ID を使用します。
- `groups.<room>.account`: マルチアカウント構成で、1 つの継承ルームエントリを特定の Matrix アカウントに限定します。
- `groups.<room>.allowBots`: 設定済み bot 送信者に対するルームレベル override（`true` または `"mentions"`）。
- `groups.<room>.users`: ルーム単位の送信者 allowlist。
- `groups.<room>.tools`: ルーム単位の tools 許可/拒否 override。
- `groups.<room>.autoReply`: ルームレベルのメンションゲート override。`true` はそのルームでメンション要件を無効にし、`false` は再び有効にします。
- `groups.<room>.skills`: 任意のルームレベル skill filter。
- `groups.<room>.systemPrompt`: 任意のルームレベル system prompt スニペット。
- `rooms`: `groups` の従来エイリアス。
- `actions`: アクション単位の tool 制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべての channel
- [Pairing](/ja-JP/channels/pairing) — DM 認証と pairing フロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージの session ルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
