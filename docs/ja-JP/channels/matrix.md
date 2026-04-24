---
read_when:
    - OpenClaw で Matrix をセットアップする
    - Matrix E2EE と検証を設定する
summary: Matrix のサポート状況、セットアップ、設定例
title: Matrix
x-i18n:
    generated_at: "2026-04-24T04:46:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix は OpenClaw のバンドル済みチャンネル Plugin です。
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートしています。

## バンドル済み Plugin

Matrix は現在の OpenClaw リリースではバンドル済み Plugin として提供されるため、通常のパッケージ済みビルドでは別途インストールは不要です。

古いビルドまたは Matrix を除外したカスタムインストールを使用している場合は、手動でインストールしてください。

npm からインストール:

```bash
openclaw plugins install @openclaw/matrix
```

ローカルチェックアウトからインストール:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin の動作とインストールルールについては、[Plugins](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. Matrix Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースには、すでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. homeserver 上で Matrix アカウントを作成します。
3. 次のいずれかで `channels.matrix` を設定します。
   - `homeserver` + `accessToken`、または
   - `homeserver` + `userId` + `password`
4. Gateway を再起動します。
5. ボットと DM を開始するか、ルームに招待します。
   - 新しい Matrix 招待は、`channels.matrix.autoJoin` がそれを許可している場合にのみ機能します。

対話型セットアップのパス:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix ウィザードが確認する内容:

- homeserver URL
- 認証方式: アクセストークンまたはパスワード
- ユーザー ID（パスワード認証のみ）
- 任意のデバイス名
- E2EE を有効にするかどうか
- ルームアクセスと招待の自動参加を設定するかどうか

ウィザードの主な挙動:

- Matrix 認証 env var がすでに存在し、そのアカウントの認証がまだ設定に保存されていない場合、ウィザードは認証を env var に保持するための env ショートカットを提示します。
- アカウント名はアカウント ID に正規化されます。たとえば、`Ops Bot` は `ops-bot` になります。
- DM 許可リストのエントリーは `@user:server` を直接受け付けます。表示名が機能するのは、ライブのディレクトリ検索で正確に 1 件一致した場合のみです。
- ルーム許可リストのエントリーはルーム ID とエイリアスを直接受け付けます。`!room:server` または `#alias:server` を推奨します。解決できない名前は、許可リスト解決時にランタイムで無視されます。
- 招待自動参加の許可リストモードでは、安定した招待先のみを使用してください: `!roomId:server`、`#alias:server`、または `*`。プレーンなルーム名は拒否されます。
- 保存前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を使用します。

<Warning>
`channels.matrix.autoJoin` のデフォルトは `off` です。

未設定のままにすると、ボットは招待されたルームや新しい DM スタイルの招待に参加しないため、手動で先に参加しない限り、新しいグループや招待された DM に表示されません。

受け入れる招待を制限したい場合は、`autoJoinAllowlist` と一緒に `autoJoin: "allowlist"` を設定するか、すべての招待に参加させたい場合は `autoJoin: "always"` を設定してください。

`allowlist` モードでは、`autoJoinAllowlist` は `!roomId:server`、`#alias:server`、または `*` のみ受け付けます。
</Warning>

許可リストの例:

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

すべての招待に参加する:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

最小限のトークンベースセットアップ:

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

パスワードベースのセットアップ（ログイン後にトークンがキャッシュされます）:

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

Matrix はキャッシュされた認証情報を `~/.openclaw/credentials/matrix/` に保存します。
デフォルトアカウントでは `credentials.json`、名前付きアカウントでは `credentials-<account>.json` を使用します。
そこにキャッシュ済み認証情報が存在する場合、現在の認証が設定内に直接指定されていなくても、OpenClaw はセットアップ、doctor、チャンネル状態の検出において Matrix が設定済みであるとみなします。

設定キーが未設定のときに使用される環境変数の対応:

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

デフォルト以外のアカウントでは、アカウントスコープ付きの env var を使用します。

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

アカウント `ops` の例:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

正規化されたアカウント ID `ops-bot` では、次を使用します。

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix はアカウント ID 内の句読点をエスケープして、スコープ付き env var の衝突を防ぎます。
たとえば、`-` は `_X2D_` になるため、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` に対応します。

対話型ウィザードが env var ショートカットを提示するのは、それらの認証 env var がすでに存在し、選択したアカウントに Matrix 認証がまだ設定内に保存されていない場合のみです。

`MATRIX_HOMESERVER` はワークスペースの `.env` からは設定できません。詳細は [Workspace `.env` files](/ja-JP/gateway/security) を参照してください。

## 設定例

これは、DM ペアリング、ルーム許可リスト、E2EE 有効化を含む実用的なベースライン設定です。

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

`autoJoin` は DM スタイルの招待を含むすべての Matrix 招待に適用されます。OpenClaw は招待時点で招待されたルームが DM かグループかを確実に分類できないため、すべての招待はまず `autoJoin` を通ります。`dm.policy` は、ボットが参加してルームが DM と分類された後に適用されます。

## ストリーミングプレビュー

Matrix の返信ストリーミングはオプトインです。

`channels.matrix.streaming` を `"partial"` に設定すると、OpenClaw は 1 件のライブプレビュー返信を送信し、モデルがテキストを生成している間はそのプレビューをその場で編集し、返信完了時に確定します。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` がデフォルトです。OpenClaw は最終返信を待って 1 回だけ送信します。
- `streaming: "partial"` は、通常の Matrix テキストメッセージを使って、現在の assistant ブロック用に 1 件の編集可能なプレビューメッセージを作成します。これにより Matrix の従来の「プレビュー先行」通知動作が維持されるため、標準クライアントでは完成したブロックではなく、最初のストリーミングプレビューテキストで通知されることがあります。
- `streaming: "quiet"` は、現在の assistant ブロック用に 1 件の編集可能な quiet プレビュー通知を作成します。これを使うのは、確定済みプレビュー編集用の受信者 push ルールも設定する場合だけにしてください。
- `blockStreaming: true` は、個別の Matrix 進行メッセージを有効にします。プレビューストリーミングが有効な場合、Matrix は現在のブロックのライブドラフトを維持し、完了したブロックは別メッセージとして保持します。
- プレビューストリーミングがオンで `blockStreaming` がオフの場合、Matrix はライブドラフトをその場で編集し、ブロックまたはターンの終了時にその同じイベントを確定します。
- プレビューが 1 つの Matrix イベントに収まらなくなった場合、OpenClaw はプレビューストリーミングを停止し、通常の最終配信にフォールバックします。
- メディア返信は通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClaw は最終メディア返信を送る前にそれを redact します。
- プレビュー編集には追加の Matrix API 呼び出しコストがかかります。最も保守的なレート制限動作を望む場合は、ストリーミングをオフのままにしてください。

`blockStreaming` だけではドラフトプレビューは有効になりません。
プレビュー編集には `streaming: "partial"` または `streaming: "quiet"` を使用し、さらに完了した assistant ブロックも別個の進行メッセージとして表示したい場合にのみ `blockStreaming: true` を追加してください。

カスタム push ルールなしで標準の Matrix 通知が必要な場合は、プレビュー先行の動作には `streaming: "partial"` を使用するか、最終結果のみ配信するには `streaming` をオフのままにしてください。`streaming: "off"` の場合:

- `blockStreaming: true` は、完了した各ブロックを通常の通知対象 Matrix メッセージとして送信します。
- `blockStreaming: false` は、最終的に完成した返信だけを通常の通知対象 Matrix メッセージとして送信します。

### quiet な確定済みプレビューのためのセルフホスト push ルール

quiet ストリーミング（`streaming: "quiet"`）は、ブロックまたはターンが確定したときにのみ受信者へ通知します。確定済みプレビューマーカーに一致するユーザー単位の push ルールが必要です。完全なセットアップ（受信者トークン、pusher 確認、ルールインストール、homeserver ごとの注意点）については、[Matrix push rules for quiet previews](/ja-JP/channels/matrix-push-rules) を参照してください。

## ボット間ルーム

デフォルトでは、他の設定済み OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。

エージェント間の Matrix 通信を意図的に許可したい場合は、`allowBots` を使用します。

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
- `allowBots: "mentions"` は、ルーム内でこのボットへの明示的なメンションがある場合にのみ、それらのメッセージを受け入れます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームに対してアカウントレベル設定を上書きします。
- OpenClaw は、自己返信ループを避けるため、同じ Matrix ユーザー ID からのメッセージは引き続き無視します。
- Matrix はここでネイティブな bot フラグを公開しないため、OpenClaw は「bot が作成した」を「この OpenClaw Gateway 上で別の設定済み Matrix アカウントが送信した」として扱います。

共有ルームでボット間通信を有効にする場合は、厳格なルーム許可リストとメンション必須設定を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。非暗号化ルームでは、引き続きプレーンな `thumbnail_url` を使用します。設定は不要で、Plugin が E2EE 状態を自動検出します。

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

検証コマンド（すべて診断用の `--verbose` と、機械可読出力用の `--json` を受け付けます）:

| コマンド | 目的 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | クロスサイニングとデバイス検証の状態を確認する |
| `openclaw matrix verify status --include-recovery-key --json`  | 保存されているリカバリーキーを含める |
| `openclaw matrix verify bootstrap`                             | クロスサイニングと検証を bootstrap する（下記参照） |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | 現在のクロスサイニング ID を破棄して新しく作成する |
| `openclaw matrix verify device "<recovery-key>"`               | リカバリーキーでこのデバイスを検証する |
| `openclaw matrix verify backup status`                         | ルームキーのバックアップ状態を確認する |
| `openclaw matrix verify backup restore`                        | サーバーバックアップからルームキーを復元する |
| `openclaw matrix verify backup reset --yes`                    | 現在のバックアップを削除し、新しいベースラインを作成する（シークレットストレージを再作成する場合があります） |

マルチアカウント構成では、`--account <id>` を渡さない限り、Matrix CLI コマンドは暗黙の Matrix デフォルトアカウントを使用します。
複数の名前付きアカウントを設定する場合は、まず `channels.matrix.defaultAccount` を設定してください。そうしないと、それらの暗黙的な CLI 操作は停止して、明示的にアカウントを選ぶよう求められます。
検証やデバイス操作の対象を明示的に名前付きアカウントにしたい場合は、常に `--account` を使用してください。

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

名前付きアカウントで暗号化が無効または利用できない場合、Matrix の警告と検証エラーは、そのアカウントの設定キーを指します。たとえば `channels.matrix.accounts.assistant.encryption` のようになります。

<AccordionGroup>
  <Accordion title="検証済みの意味">
    OpenClaw は、あなた自身のクロスサイニング ID が署名した場合にのみ、デバイスを検証済みとして扱います。`verify status --verbose` は 3 つの信頼シグナルを表示します。

    - `Locally trusted`: このクライアントでのみ信頼されている
    - `Cross-signing verified`: SDK がクロスサイニング経由で検証済みと報告している
    - `Signed by owner`: あなた自身の self-signing キーで署名されている

    `Verified by owner` が `yes` になるのは、クロスサイニングまたは owner-signing が存在する場合だけです。ローカル信頼だけでは不十分です。

  </Accordion>

  <Accordion title="bootstrap が行うこと">
    `verify bootstrap` は、暗号化アカウント用の修復およびセットアップコマンドです。順番に次を行います。

    - シークレットストレージを bootstrap し、可能であれば既存のリカバリーキーを再利用する
    - クロスサイニングを bootstrap し、不足している公開クロスサイニングキーをアップロードする
    - 現在のデバイスをマークしてクロスサインする
    - サーバー側のルームキーバックアップがまだ存在しない場合は作成する

    homeserver がクロスサイニングキーのアップロードに UIA を要求する場合、OpenClaw はまず no-auth を試し、次に `m.login.dummy`、その次に `m.login.password` を試します（`channels.matrix.password` が必要です）。`--force-reset-cross-signing` は、現在の ID を意図的に破棄する場合にのみ使用してください。

  </Accordion>

  <Accordion title="新しいバックアップベースライン">
    将来の暗号化メッセージを引き続き使えるようにしつつ、復元不能な古い履歴が失われることを受け入れる場合:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    名前付きアカウントを対象にするには `--account <id>` を追加してください。現在のバックアップシークレットを安全に読み込めない場合、これによりシークレットストレージも再作成されることがあります。

  </Accordion>

  <Accordion title="起動時の挙動">
    `encryption: true` の場合、`startupVerification` のデフォルトは `"if-unverified"` です。起動時に未検証のデバイスは、別の Matrix クライアントで自己検証を要求し、重複をスキップしてクールダウンを適用します。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効にできます。

    起動時には、現在のシークレットストレージとクロスサイニング ID を再利用する保守的な crypto bootstrap パスも実行されます。bootstrap 状態が壊れている場合、OpenClaw は `channels.matrix.password` がなくてもガード付き修復を試みます。homeserver がパスワード UIA を要求する場合、起動時に警告をログへ出しますが、致命的にはなりません。すでに owner-signed のデバイスは保持されます。

    完全なアップグレードフローについては、[Matrix migration](/ja-JP/install/migrating-matrix) を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は検証ライフサイクル通知を、厳格な DM 検証ルームに `m.notice` メッセージとして投稿します。内容は、リクエスト、ready（「絵文字で検証」の案内付き）、開始/完了、利用可能な場合は SAS（絵文字/10 進数）の詳細です。

    別の Matrix クライアントからの受信リクエストは追跡され、自動承認されます。自己検証では、OpenClaw は SAS フローを自動的に開始し、絵文字検証が利用可能になると自身側を確認します。ただし、Matrix クライアント側で「一致している」を比較・確認する必要はあります。

    検証システム通知はエージェントのチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="デバイス衛生">
    OpenClaw 管理の古いデバイスが蓄積することがあります。一覧表示して整理します。

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto ストア">
    Matrix E2EE は、公式の `matrix-js-sdk` の Rust crypto パスを使用し、IndexedDB shim として `fake-indexeddb` を使います。crypto 状態は `crypto-idb-snapshot.json` に永続化されます（制限的なファイル権限）。

    暗号化ランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下にあり、sync ストア、crypto ストア、リカバリーキー、IDB スナップショット、スレッドバインディング、起動時検証状態を含みます。トークンが変わってもアカウント ID が同じであれば、OpenClaw は最適な既存ルートを再利用するため、以前の状態を引き続き参照できます。

  </Accordion>
</AccordionGroup>

## プロファイル管理

選択したアカウントの Matrix セルフプロフィールを更新するには、次を使用します。

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

明示的に名前付き Matrix アカウントを対象にしたい場合は、`--account <id>` を追加してください。

Matrix は `mxc://` アバター URL を直接受け付けます。`http://` または `https://` のアバター URL を渡すと、OpenClaw はまずそれを Matrix にアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl`（または選択したアカウントの上書き設定）に保存します。

## スレッド

Matrix は、自動返信と message-tool 送信の両方でネイティブ Matrix スレッドをサポートしています。

- `dm.sessionScope: "per-user"`（デフォルト）は、Matrix DM ルーティングを送信者スコープに保つため、同じ peer に解決される複数の DM ルームで 1 つのセッションを共有できます。
- `dm.sessionScope: "per-room"` は、通常の DM 認証と許可リストチェックを引き続き使用しつつ、各 Matrix DM ルームを個別のセッションキーに分離します。
- 明示的な Matrix 会話バインディングは引き続き `dm.sessionScope` より優先されるため、バインド済みのルームやスレッドは選択された対象セッションを維持します。
- `threadReplies: "off"` は返信をトップレベルに保ち、受信したスレッドメッセージも親セッション上に保ちます。
- `threadReplies: "inbound"` は、受信メッセージがすでにそのスレッド内にある場合にのみ、そのスレッド内で返信します。
- `threadReplies: "always"` は、ルーム返信をトリガーメッセージをルートとするスレッド内に保ち、その会話を最初のトリガーメッセージから一致するスレッドスコープセッションを通してルーティングします。
- `dm.threadReplies` は DM に対してのみトップレベル設定を上書きします。たとえば、ルームスレッドは分離したまま、DM はフラットに保てます。
- 受信したスレッドメッセージには、追加のエージェントコンテキストとしてスレッドルートメッセージが含まれます。
- message-tool 送信は、対象が同じルーム、または同じ DM ユーザー対象である場合、明示的な `threadId` が指定されていなければ、現在の Matrix スレッドを自動継承します。
- 同一セッションでの DM ユーザー対象再利用は、現在のセッションメタデータが同じ Matrix アカウント上の同じ DM peer を示している場合にのみ有効です。そうでなければ、OpenClaw は通常のユーザースコープルーティングにフォールバックします。
- OpenClaw が、同じ共有 Matrix DM セッション上で Matrix DM ルームが別の DM ルームと衝突していることを検出した場合、thread bindings が有効で `dm.sessionScope` ヒントがあると、そのルームに `/focus` の回避手段を示す 1 回限りの `m.notice` を投稿します。
- Matrix ではランタイムスレッドバインディングがサポートされています。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドバインドされた `/acp spawn` は、Matrix のルームと DM で機能します。
- トップレベルの Matrix ルーム/DM の `/focus` は、`threadBindings.spawnSubagentSessions=true` のとき、新しい Matrix スレッドを作成し、それを対象セッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行した場合は、その現在のスレッドをそのままバインドします。

## ACP 会話バインディング

Matrix のルーム、DM、既存の Matrix スレッドは、チャットの表面を変えずに永続的な ACP ワークスペースに変換できます。

高速なオペレーターフロー:

- 使い続けたい Matrix DM、ルーム、または既存のスレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM/ルームがチャットの表面として残り、以後のメッセージは生成された ACP セッションにルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` はその現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じて、バインディングを削除します。

注意:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnAcpSessions` が必要になるのは `/acp spawn --thread auto|here` の場合だけで、このとき OpenClaw は子 Matrix スレッドを作成またはバインドする必要があります。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャンネルごとの上書きもサポートしています。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix のスレッドバインド生成フラグはオプトインです。

- トップレベルの `/focus` で新しい Matrix スレッドを作成してバインドできるようにするには、`threadBindings.spawnSubagentSessions: true` を設定します。
- `/acp spawn --thread auto|here` で ACP セッションを Matrix スレッドにバインドできるようにするには、`threadBindings.spawnAcpSessions: true` を設定します。

## リアクション

Matrix は、送信リアクションアクション、受信リアクション通知、受信 ack リアクションをサポートしています。

- 送信リアクションツールは `channels["matrix"].actions.reactions` によって制御されます。
- `react` は特定の Matrix イベントにリアクションを追加します。
- `reactions` は特定の Matrix イベントに対する現在のリアクション要約を一覧表示します。
- `emoji=""` は、そのイベントに対するボットアカウント自身のリアクションを削除します。
- `remove: true` は、ボットアカウントから指定された絵文字リアクションのみを削除します。

ack リアクションは、標準の OpenClaw 解決順序を使用します。

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- エージェント ID の絵文字フォールバック

ack リアクションスコープは、次の順序で解決されます。

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

リアクション通知モードは、次の順序で解決されます。

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- デフォルト: `own`

挙動:

- `reactionNotifications: "own"` は、ボットが作成した Matrix メッセージを対象とする追加済み `m.reaction` イベントを転送します。
- `reactionNotifications: "off"` はリアクションのシステムイベントを無効にします。
- Matrix ではリアクション削除が独立した `m.reaction` 削除ではなく redaction として扱われるため、リアクション削除はシステムイベントに合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックし、どちらも未設定の場合の実効デフォルトは `0` です。無効にするには `0` を設定します。
- Matrix ルーム履歴はルーム専用です。DM は引き続き通常のセッション履歴を使用します。
- Matrix ルーム履歴は pending-only です。OpenClaw はまだ返信をトリガーしていないルームメッセージをバッファし、メンションやその他のトリガーが到着したときにそのウィンドウをスナップショットします。
- 現在のトリガーメッセージは `InboundHistory` には含まれません。そのターンのメインの受信本文に残ります。
- 同じ Matrix イベントの再試行では、新しいルームメッセージへ前進してずれることなく、元の履歴スナップショットを再利用します。

## コンテキストの可視性

Matrix は、取得した返信テキスト、スレッドルート、保留中履歴などの補足ルームコンテキストに対して、共有の `contextVisibility` 制御をサポートしています。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、補足コンテキストを、アクティブなルーム/ユーザー許可リストチェックで許可された送信者に絞り込みます。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的に引用された返信を 1 件だけ保持します。

この設定が影響するのは補足コンテキストの可視性であり、受信メッセージ自体が返信をトリガーできるかどうかではありません。
トリガーの認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、および DM ポリシー設定から決まります。

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
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

メンションゲーティングと許可リストの動作については、[グループ](/ja-JP/channels/groups) を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前にメッセージを送り続けた場合、OpenClaw は新しいコードを発行する代わりに、同じ保留中のペアリングコードを再利用し、短いクールダウン後に再びリマインダー返信を送ることがあります。

共有の DM ペアリングフローと保存レイアウトについては、[ペアリング](/ja-JP/channels/pairing) を参照してください。

## ダイレクトルーム修復

ダイレクトメッセージ状態の同期がずれると、OpenClaw はライブ DM ではなく古い単独ルームを指す古い `m.direct` マッピングを持ってしまうことがあります。peer の現在のマッピングを確認するには、次を実行します。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには、次を実行します。

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修復フロー:

- まず、すでに `m.direct` にマップされている厳密な 1:1 DM を優先します
- それがなければ、そのユーザーとの現在参加中の厳密な 1:1 DM にフォールバックします
- 正常な DM が存在しない場合は、新しいダイレクトルームを作成して `m.direct` を書き換えます

修復フローは古いルームを自動削除しません。正常な DM を選び、マッピングを更新するだけなので、新しい Matrix 送信、検証通知、その他のダイレクトメッセージフローが再び正しいルームを対象にするようになります。

## Exec 承認

Matrix は、Matrix アカウント用のネイティブ承認クライアントとして動作できます。ネイティブの
DM/チャンネルルーティングノブは、引き続き exec 承認設定配下にあります。

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（任意。`channels.matrix.dm.allowFrom` にフォールバック）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

承認者は `@owner:example.org` のような Matrix ユーザー ID である必要があります。`enabled` が未設定または `"auto"` で、少なくとも 1 人の承認者を解決できる場合、Matrix はネイティブ承認を自動有効化します。Exec 承認はまず `execApprovals.approvers` を使用し、`channels.matrix.dm.allowFrom` にフォールバックできます。Plugin 承認は `channels.matrix.dm.allowFrom` を通じて認可されます。Matrix をネイティブ承認クライアントとして明示的に無効にするには、`enabled: false` を設定します。それ以外の場合、承認リクエストは他の設定済み承認ルートまたは承認フォールバックポリシーにフォールバックします。

Matrix ネイティブルーティングは両方の承認種別をサポートしています。

- `channels.matrix.execApprovals.*` は、Matrix 承認プロンプトのネイティブ DM/チャンネル配信モードを制御します。
- Exec 承認は `execApprovals.approvers` または `channels.matrix.dm.allowFrom` から exec 承認者セットを使用します。
- Plugin 承認は `channels.matrix.dm.allowFrom` から Matrix DM 許可リストを使用します。
- Matrix のリアクションショートカットとメッセージ更新は、exec 承認と plugin 承認の両方に適用されます。

配信ルール:

- `target: "dm"` は承認プロンプトを承認者の DM に送信します
- `target: "channel"` はプロンプトを元の Matrix ルームまたは DM に送り返します
- `target: "both"` は承認者の DM と元の Matrix ルームまたは DM の両方に送信します

Matrix 承認プロンプトは、主要な承認メッセージにリアクションショートカットを設定します。

- `✅` = 1 回だけ許可
- `❌` = 拒否
- `♾️` = 有効な exec ポリシーでその判断が許可される場合は常に許可

承認者はそのメッセージにリアクションするか、フォールバックスラッシュコマンド `/approve <id> allow-once`、`/approve <id> allow-always`、または `/approve <id> deny` を使用できます。

承認または拒否できるのは、解決済みの承認者だけです。Exec 承認では、チャンネル配信にコマンドテキストが含まれるため、`channel` または `both` を有効にするのは信頼できるルームだけにしてください。

アカウントごとの上書き:

- `channels.matrix.accounts.<account>.execApprovals`

関連ドキュメント: [Exec 承認](/ja-JP/tools/exec-approvals)

## スラッシュコマンド

Matrix のスラッシュコマンド（たとえば `/new`、`/reset`、`/model`）は DM で直接機能します。ルームでは、OpenClaw はボット自身の Matrix メンションが前置されたスラッシュコマンドも認識するため、`@bot:server /new` はカスタムメンション正規表現がなくてもコマンドパスをトリガーします。これにより、Element などのクライアントでユーザーがコマンド入力前にボットをタブ補完したときに送出される、ルーム形式の `@mention /command` 投稿にもボットが応答できます。

認可ルールは引き続き適用されます。コマンド送信者は、通常メッセージと同様に DM またはルームの許可リスト/オーナーポリシーを満たす必要があります。

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

トップレベルの `channels.matrix` 値は、アカウント側で上書きされない限り、名前付きアカウントのデフォルトとして機能します。
継承されたルームエントリーを 1 つの Matrix アカウントにスコープするには、`groups.<room>.account` を使用できます。
`account` を持たないエントリーはすべての Matrix アカウントで共有され、`account: "default"` を持つエントリーは、デフォルトアカウントがトップレベルの `channels.matrix.*` に直接設定されている場合でも引き続き機能します。
共有の部分認証デフォルトだけでは、それ自体で別個の暗黙のデフォルトアカウントは作成されません。OpenClaw がトップレベルの `default` アカウントを合成するのは、そのデフォルトに新しい認証（`homeserver` + `accessToken`、または `homeserver` + `userId` + `password`）がある場合のみです。名前付きアカウントは、その後キャッシュ済み認証情報が認証を満たすなら、`homeserver` + `userId` から引き続き検出可能です。
Matrix にすでにちょうど 1 つの名前付きアカウントがある場合、または `defaultAccount` が既存の名前付きアカウントキーを指している場合、単一アカウントからマルチアカウントへの修復/セットアップ昇格では、新しい `accounts.default` エントリーを作らずにそのアカウントを保持します。その昇格アカウントへ移動するのは Matrix の認証/bootstrap キーだけで、共有配信ポリシーキーはトップレベルに残ります。
暗黙のルーティング、プロービング、CLI 操作で 1 つの名前付き Matrix アカウントを優先したい場合は、`defaultAccount` を設定します。
複数の Matrix アカウントが設定されていて、そのうち 1 つのアカウント ID が `default` の場合、`defaultAccount` が未設定でも OpenClaw はそのアカウントを暗黙的に使用します。
複数の名前付きアカウントを設定する場合は、暗黙のアカウント選択に依存する CLI コマンドのために `defaultAccount` を設定するか、`--account <id>` を渡してください。
`openclaw matrix verify ...` と `openclaw matrix devices ...` で、その暗黙選択を 1 つのコマンドだけ上書きしたい場合は `--account <id>` を渡します。

共有のマルチアカウントパターンについては、[設定リファレンス](/ja-JP/gateway/config-channels#multi-account-all-channels) を参照してください。

## プライベート/LAN homeserver

デフォルトでは、OpenClaw は SSRF 保護のため、アカウントごとに明示的にオプトインしない限り、プライベート/内部 Matrix homeserver をブロックします。

homeserver が localhost、LAN/Tailscale IP、または内部ホスト名上で動作している場合は、その Matrix アカウントに対して
`network.dangerouslyAllowPrivateNetwork` を有効にしてください。

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

このオプトインで許可されるのは、信頼されたプライベート/内部ターゲットだけです。
`http://matrix.example.org:8008` のような公開プレーンテキスト homeserver は引き続きブロックされます。可能な限り `https://` を推奨します。

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

名前付きアカウントは `channels.matrix.accounts.<id>.proxy` でトップレベルのデフォルトを上書きできます。
OpenClaw は、ランタイムの Matrix トラフィックとアカウント状態プローブの両方で同じプロキシ設定を使用します。

## ターゲット解決

OpenClaw がルームまたはユーザーターゲットを要求する場所では、Matrix は次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

ライブディレクトリ検索では、ログイン中の Matrix アカウントを使用します。

- ユーザー検索は、その homeserver 上の Matrix ユーザーディレクトリを問い合わせます。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け付け、その後、そのアカウントで参加中のルーム名検索にフォールバックします。
- 参加済みルーム名の検索はベストエフォートです。ルーム名を ID またはエイリアスに解決できない場合、ランタイムの許可リスト解決では無視されます。

## 設定リファレンス

- `enabled`: チャンネルを有効または無効にします。
- `name`: アカウントの任意ラベルです。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合の優先アカウント ID です。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: この Matrix アカウントがプライベート/内部 homeserver に接続できるようにします。homeserver が `localhost`、LAN/Tailscale IP、または `matrix-synapse` のような内部ホストに解決される場合に有効にしてください。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL です。名前付きアカウントは、自身の `proxy` でトップレベルのデフォルトを上書きできます。
- `userId`: 完全な Matrix ユーザー ID。例: `@bot:example.org`。
- `accessToken`: トークンベース認証用のアクセストークンです。プレーンテキスト値と SecretRef 値は、env/file/exec プロバイダー全体で `channels.matrix.accessToken` および `channels.matrix.accounts.<id>.accessToken` に対応しています。詳しくは [Secrets Management](/ja-JP/gateway/secrets) を参照してください。
- `password`: パスワードベースログイン用のパスワードです。プレーンテキスト値と SecretRef 値に対応しています。
- `deviceId`: 明示的な Matrix デバイス ID です。
- `deviceName`: パスワードログイン用のデバイス表示名です。
- `avatarUrl`: プロファイル同期および `profile set` 更新用に保存される self-avatar URL です。
- `initialSyncLimit`: 起動時 sync で取得するイベントの最大数です。
- `encryption`: E2EE を有効にします。
- `allowlistOnly`: `true` の場合、`open` ルームポリシーを `allowlist` に引き上げ、`disabled` を除くすべてのアクティブな DM ポリシー（`pairing` と `open` を含む）を `allowlist` に強制します。`disabled` ポリシーには影響しません。
- `allowBots`: 他の設定済み OpenClaw Matrix アカウントからのメッセージを許可します（`true` または `"mentions"`）。
- `groupPolicy`: `open`、`allowlist`、または `disabled`。
- `contextVisibility`: 補足ルームコンテキストの可視性モード（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`: ルームトラフィック用のユーザー ID 許可リストです。完全な Matrix ユーザー ID が最も安全です。完全一致するディレクトリ一致は、起動時およびモニター実行中に許可リストが変更されたときに解決されます。解決できない名前は無視されます。
- `historyLimit`: グループ履歴コンテキストとして含めるルームメッセージの最大数です。`messages.groupChat.historyLimit` にフォールバックし、どちらも未設定の場合の実効デフォルトは `0` です。無効にするには `0` を設定します。
- `replyToMode`: `off`、`first`、`all`、または `batched`。
- `markdown`: 送信 Matrix テキスト用の任意の Markdown レンダリング設定です。
- `streaming`: `off`（デフォルト）、`"partial"`、`"quiet"`、`true`、または `false`。`"partial"` と `true` は通常の Matrix テキストメッセージによるプレビュー先行のドラフト更新を有効にします。`"quiet"` はセルフホストの push-rule セットアップ向けに通知しないプレビュー通知を使用します。`false` は `"off"` と同等です。
- `blockStreaming`: `true` の場合、ドラフトプレビューストリーミングが有効な間、完了した assistant ブロックごとに個別の進行メッセージを有効にします。
- `threadReplies`: `off`、`inbound`、または `always`。
- `threadBindings`: スレッドにバインドされたセッションルーティングとライフサイクルに対するチャンネルごとの上書きです。
- `startupVerification`: 起動時の自動自己検証リクエストモード（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`: 起動時の自動検証リクエストを再試行するまでのクールダウンです。
- `textChunkLimit`: 文字数単位の送信メッセージチャンクサイズです（`chunkMode` が `length` の場合に適用）。
- `chunkMode`: `length` は文字数でメッセージを分割し、`newline` は行境界で分割します。
- `responsePrefix`: このチャンネルのすべての送信返信の前に付加される任意の文字列です。
- `ackReaction`: このチャンネル/アカウント用の任意の ack リアクション上書きです。
- `ackReactionScope`: 任意の ack リアクションスコープ上書きです（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`: 受信リアクション通知モード（`own`、`off`）。
- `mediaMaxMb`: 送信と受信メディア処理におけるメディアサイズ上限（MB）です。
- `autoJoin`: 招待の自動参加ポリシー（`always`、`allowlist`、`off`）。デフォルト: `off`。DM スタイルの招待を含むすべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `allowlist` のときに許可されるルーム/エイリアスです。エイリアスエントリーは招待処理中にルーム ID に解決されます。OpenClaw は招待されたルームが主張するエイリアス状態を信頼しません。
- `dm`: DM ポリシーブロック（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`: OpenClaw がルームに参加し、それを DM と分類した後の DM アクセスを制御します。招待が自動参加されるかどうかは変更しません。
- `dm.allowFrom`: DM トラフィック用のユーザー ID 許可リストです。完全な Matrix ユーザー ID が最も安全です。完全一致するディレクトリ一致は、起動時およびモニター実行中に許可リストが変更されたときに解決されます。解決できない名前は無視されます。
- `dm.sessionScope`: `per-user`（デフォルト）または `per-room`。peer が同じでも各 Matrix DM ルームで別々のコンテキストを保持したい場合は `per-room` を使用します。
- `dm.threadReplies`: DM 専用のスレッドポリシー上書き（`off`、`inbound`、`always`）。DM における返信配置とセッション分離の両方で、トップレベルの `threadReplies` 設定を上書きします。
- `execApprovals`: Matrix ネイティブの exec 承認配信（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`: exec リクエストを承認できる Matrix ユーザー ID です。`dm.allowFrom` がすでに承認者を識別している場合は任意です。
- `execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。
- `accounts`: 名前付きのアカウントごとの上書きです。トップレベルの `channels.matrix` 値は、これらのエントリーのデフォルトとして機能します。
- `groups`: ルームごとのポリシーマップです。ルーム ID またはエイリアスを推奨します。解決できないルーム名はランタイムで無視されます。セッション/グループ ID は、解決後の安定したルーム ID を使用します。
- `groups.<room>.account`: マルチアカウント構成で、継承された 1 つのルームエントリーを特定の Matrix アカウントに制限します。
- `groups.<room>.allowBots`: 設定済みボット送信者に対するルームレベルの上書き（`true` または `"mentions"`）。
- `groups.<room>.users`: ルームごとの送信者許可リストです。
- `groups.<room>.tools`: ルームごとのツール許可/拒否上書きです。
- `groups.<room>.autoReply`: ルームレベルのメンションゲーティング上書きです。`true` はそのルームのメンション要件を無効にし、`false` は再度有効にします。
- `groups.<room>.skills`: 任意のルームレベル Skills フィルターです。
- `groups.<room>.systemPrompt`: 任意のルームレベル system prompt スニペットです。
- `rooms`: `groups` のレガシーエイリアスです。
- `actions`: アクションごとのツール制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化策
