---
read_when:
    - チャットコマンドの使用または設定
    - コマンドのルーティングまたは権限のデバッグ
summary: 'スラッシュコマンド: テキストとネイティブ、設定、対応コマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-04-21T13:39:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d90ddee54af7c05b7fdf486590561084581d750e42cd14674d43bbdc0984df5d
    source_path: tools/slash-commands.md
    workflow: 15
---

# スラッシュコマンド

コマンドは Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる**単独の**メッセージとして送信する必要があります。
ホスト専用の bash チャットコマンドは `! <cmd>` を使います（`/bash <cmd>` はその alias です）。

関連する 2 つのシステムがあります。

- **コマンド**: 単独の `/...` メッセージ。
- **ディレクティブ**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`。
  - ディレクティブは、モデルがメッセージを見る前に取り除かれます。
  - 通常のチャットメッセージ内では（ディレクティブのみではない場合）、これらは「インラインヒント」として扱われ、セッション設定は永続化されません。
  - ディレクティブのみのメッセージでは（メッセージがディレクティブだけを含む場合）、セッションに永続化され、確認応答が返されます。
  - ディレクティブは**認可された送信者**に対してのみ適用されます。`commands.allowFrom` が設定されている場合、それが唯一の
    使用される許可リストです。そうでない場合、認可はチャネルの許可リスト/ペアリングと `commands.useAccessGroups` から決まります。
    認可されていない送信者には、ディレクティブは平文テキストとして扱われます。

さらに、いくつかの**インラインショートカット**もあります（許可リスト/認可済み送信者のみ）: `/help`, `/commands`, `/status`, `/whoami`（`/id`）。
これらは即座に実行され、モデルがメッセージを見る前に取り除かれ、残りのテキストは通常のフローを通過し続けます。

## 設定

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text`（デフォルト `true`）は、チャットメッセージ内の `/...` の解析を有効にします。
  - ネイティブコマンドのない surface（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）では、これを `false` に設定してもテキストコマンドは引き続き動作します。
- `commands.native`（デフォルト `"auto"`）は、ネイティブコマンドを登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフ（slash command を追加するまで）。ネイティブサポートのない provider では無視されます。
  - provider ごとに上書きするには `channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（bool または `"auto"`）。
  - `false` は、起動時に Discord/Telegram で以前に登録されたコマンドを消去します。Slack コマンドは Slack アプリ内で管理され、自動では削除されません。
- `commands.nativeSkills`（デフォルト `"auto"`）は、サポートされている場合に **skill** コマンドをネイティブ登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフ（Slack では skill ごとに slash command を作成する必要があります）。
  - provider ごとに上書きするには `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（bool または `"auto"`）。
- `commands.bash`（デフォルト `false`）は、`! <cmd>` によるホストシェルコマンド実行を有効にします（`/bash <cmd>` は alias。`tools.elevated` の許可リストが必要です）。
- `commands.bashForegroundMs`（デフォルト `2000`）は、bash がバックグラウンドモードに切り替わる前に待機する時間を制御します（`0` は即座にバックグラウンド化）。
- `commands.config`（デフォルト `false`）は `/config` を有効にします（`openclaw.json` の読み書き）。
- `commands.mcp`（デフォルト `false`）は `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP config の読み書き）。
- `commands.plugins`（デフォルト `false`）は `/plugins` を有効にします（Plugin の検出/状態確認、および install + enable/disable 制御）。
- `commands.debug`（デフォルト `false`）は `/debug` を有効にします（ランタイム限定の上書き）。
- `commands.restart`（デフォルト `true`）は `/restart` と Gateway 再起動ツールアクションを有効にします。
- `commands.ownerAllowFrom`（任意）は、owner 専用コマンド/ツール surface 用の明示的な許可リストを設定します。これは `commands.allowFrom` とは別です。
- `commands.ownerDisplay` は、システムプロンプト内で owner id をどう表示するかを制御します: `raw` または `hash`。
- `commands.ownerDisplaySecret` は、`commands.ownerDisplay="hash"` のときに使う HMAC secret を任意で設定します。
- `commands.allowFrom`（任意）は、コマンド認可のための provider ごとの許可リストを設定します。設定されている場合、これがコマンドとディレクティブの唯一の認可ソースになります（チャネルの許可リスト/ペアリングと `commands.useAccessGroups`
  は無視されます）。グローバルデフォルトには `"*"` を使い、provider 固有キーがそれを上書きします。
- `commands.useAccessGroups`（デフォルト `true`）は、`commands.allowFrom` が設定されていない場合に、コマンドに対して許可リスト/ポリシーを適用します。

## コマンド一覧

現在の source-of-truth:

- core の組み込みは `src/auto-reply/commands-registry.shared.ts` から
- 生成された dock コマンドは `src/auto-reply/commands-registry.data.ts` から
- Plugin コマンドは Plugin の `registerCommand()` 呼び出しから
- 実際にあなたの Gateway で使えるかどうかは、依然として config フラグ、チャネル surface、インストール/有効化済み Plugin に依存します

### core の組み込みコマンド

現在利用できる組み込みコマンド:

- `/new [model]` は新しいセッションを開始します。`/reset` は reset alias です。
- `/compact [instructions]` はセッションコンテキストを Compaction します。[ /concepts/compaction ](/ja-JP/concepts/compaction) を参照してください。
- `/stop` は現在の実行を中止します。
- `/session idle <duration|off>` と `/session max-age <duration|off>` は、スレッドバインディングの有効期限を管理します。
- `/think <level>` は thinking レベルを設定します。選択肢はアクティブモデルの provider profile によって決まり、一般的なレベルは `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max`、またはバイナリの `on` のようなカスタムレベルはサポートされる場合のみ使えます。alias: `/thinking`, `/t`。
- `/verbose on|off|full` は verbose 出力を切り替えます。alias: `/v`。
- `/trace on|off` は現在のセッションの Plugin trace 出力を切り替えます。
- `/fast [status|on|off]` は fast mode の表示または設定を行います。
- `/reasoning [on|off|stream]` は reasoning の可視性を切り替えます。alias: `/reason`。
- `/elevated [on|off|ask|full]` は elevated mode を切り替えます。alias: `/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec のデフォルトを表示または設定します。
- `/model [name|#|status]` はモデルを表示または設定します。
- `/models [provider] [page] [limit=<n>|size=<n>|all]` は provider または provider のモデルを一覧表示します。
- `/queue <mode>` はキュー動作（`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`）と、`debounce:2s cap:25 drop:summarize` のようなオプションを管理します。
- `/help` は短いヘルプ概要を表示します。
- `/commands` は生成されたコマンドカタログを表示します。
- `/tools [compact|verbose]` は、現在のエージェントが今使えるものを表示します。
- `/status` は、利用可能な場合は provider の使用量/クォータを含むランタイム状態を表示します。
- `/tasks` は、現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
- `/context [list|detail|json]` は、コンテキストがどのように組み立てられているかを説明します。
- `/export-session [path]` は、現在のセッションを HTML にエクスポートします。alias: `/export`。
- `/whoami` はあなたの sender id を表示します。alias: `/id`。
- `/skill <name> [input]` は、名前で skill を実行します。
- `/allowlist [list|add|remove] ...` は、許可リストエントリを管理します。テキスト専用。
- `/approve <id> <decision>` は、exec の承認プロンプトを解決します。
- `/btw <question>` は、今後のセッションコンテキストを変更せずに横道の質問をします。[ /tools/btw ](/ja-JP/tools/btw) を参照してください。
- `/subagents list|kill|log|info|send|steer|spawn` は、現在のセッションのサブエージェント実行を管理します。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は、ACP セッションとランタイムオプションを管理します。
- `/focus <target>` は、現在の Discord スレッドまたは Telegram topic/conversation をセッションターゲットにバインドします。
- `/unfocus` は、現在のバインディングを解除します。
- `/agents` は、現在のセッションにスレッドバインドされたエージェントを一覧表示します。
- `/kill <id|#|all>` は、1 つまたはすべての実行中サブエージェントを中止します。
- `/steer <id|#> <message>` は、実行中のサブエージェントに steering を送信します。alias: `/tell`。
- `/config show|get|set|unset` は `openclaw.json` を読み書きします。owner 専用。`commands.config: true` が必要です。
- `/mcp show|get|set|unset` は、`mcp.servers` 配下の OpenClaw 管理 MCP server config を読み書きします。owner 専用。`commands.mcp: true` が必要です。
- `/plugins list|inspect|show|get|install|enable|disable` は、Plugin の状態を確認または変更します。`/plugin` は alias です。書き込みは owner 専用。`commands.plugins: true` が必要です。
- `/debug show|set|unset|reset` は、ランタイム限定 config 上書きを管理します。owner 専用。`commands.debug: true` が必要です。
- `/usage off|tokens|full|cost` は、応答ごとの usage footer を制御するか、ローカルのコスト概要を表示します。
- `/tts on|off|status|provider|limit|summary|audio|help` は TTS を制御します。[ /tools/tts ](/ja-JP/tools/tts) を参照してください。
- `/restart` は、有効な場合に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定します。
- `/activation mention|always` は、グループの activation mode を設定します。
- `/send on|off|inherit` は、送信ポリシーを設定します。owner 専用。
- `/bash <command>` はホストシェルコマンドを実行します。テキスト専用。alias: `! <command>`。`commands.bash: true` と `tools.elevated` の許可リストが必要です。
- `!poll [sessionId]` は、バックグラウンド bash ジョブを確認します。
- `!stop [sessionId]` は、バックグラウンド bash ジョブを停止します。

### 生成された dock コマンド

Dock コマンドは、ネイティブコマンドサポートを持つチャネル Plugin から生成されます。現在のバンドルセット:

- `/dock-discord`（alias: `/dock_discord`）
- `/dock-mattermost`（alias: `/dock_mattermost`）
- `/dock-slack`（alias: `/dock_slack`）
- `/dock-telegram`（alias: `/dock_telegram`）

### バンドル Plugin コマンド

バンドル Plugin は、さらに多くのスラッシュコマンドを追加できます。このリポジトリにある現在のバンドルコマンド:

- `/dreaming [on|off|status|help]` はメモリ Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` は、デバイスのペアリング/セットアップフローを管理します。[Pairing](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` は、高リスクの phone node コマンドを一時的に有効化します。
- `/voice status|list [limit]|set <voiceId|name>` は Talk voice config を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE rich card プリセットを送信します。[LINE](/ja-JP/channels/line) を参照してください。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` は、バンドルされた Codex app-server harness を確認および制御します。[Codex Harness](/ja-JP/plugins/codex-harness) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的 skill コマンド

ユーザーが呼び出せる Skills もスラッシュコマンドとして公開されます。

- `/skill <name> [input]` は、汎用エントリポイントとして常に動作します。
- skill/plugin が登録していれば、Skills は `/prose` のような直接コマンドとして表示されることもあります。
- ネイティブ skill-command の登録は `commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` によって制御されます。

注意:

- コマンドでは、コマンドと引数の間に任意で `:` を入れられます（例: `/think: high`, `/send: on`, `/help:`）。
- `/new <model>` はモデル alias、`provider/model`、または provider 名（あいまい一致）を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
- provider 使用量の完全な内訳を確認するには、`openclaw status --usage` を使用します。
- `/allowlist add|remove` には `commands.config=true` が必要で、チャネルの `configWrites` を尊重します。
- マルチアカウントチャネルでは、config 対象の `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も、対象アカウントの `configWrites` を尊重します。
- `/usage` は応答ごとの usage footer を制御します。`/usage cost` は OpenClaw セッションログからローカルのコスト概要を表示します。
- `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定します。
- `/plugins install <spec>` は `openclaw plugins install` と同じ Plugin spec を受け付けます: ローカルパス/アーカイブ、npm パッケージ、または `clawhub:<pkg>`。
- `/plugins enable|disable` は Plugin config を更新し、再起動を促す場合があります。
- Discord 専用のネイティブコマンド: `/vc join|leave|status` はボイスチャネルを制御します（`channels.discord.voice` とネイティブコマンドが必要。テキストでは利用不可）。
- Discord のスレッドバインディングコマンド（`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`）には、有効なスレッドバインディングが有効になっている必要があります（`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`）。
- ACP コマンドのリファレンスとランタイム動作: [ACP Agents](/ja-JP/tools/acp-agents)。
- `/verbose` はデバッグと追加可視化のためのものです。通常使用では **off** のままにしてください。
- `/trace` は `/verbose` よりも限定的です。Plugin 所有の trace/debug 行のみを表示し、通常の verbose なツール chatter は無効のままにします。
- `/fast on|off` はセッション上書きを永続化します。Sessions UI の `inherit` オプションを使うと、それをクリアして config のデフォルトに戻せます。
- `/fast` は provider 固有です。OpenAI/OpenAI Codex ではネイティブ Responses endpoint 上で `service_tier=priority` にマッピングされ、`api.anthropic.com` に送信される OAuth 認証トラフィックを含む直接の公開 Anthropic リクエストでは `service_tier=auto` または `standard_only` にマッピングされます。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
- ツール失敗の要約は関連があれば引き続き表示されますが、詳細な失敗テキストが含まれるのは `/verbose` が `on` または `full` のときだけです。
- `/reasoning`、`/verbose`、`/trace` はグループ設定ではリスクがあります。意図せず内部 reasoning、ツール出力、または Plugin diagnostics を公開してしまう可能性があります。特にグループチャットでは、オフのままにしておくことを推奨します。
- `/model` は新しいセッションモデルを即座に永続化します。
- エージェントがアイドル状態なら、次の実行ですぐに使われます。
- すでに実行がアクティブな場合、OpenClaw はライブ切り替えを pending としてマークし、クリーンな再試行ポイントでのみ新しいモデルに切り替えて再開します。
- ツール動作または応答出力がすでに始まっている場合、その pending 切り替えは、後の再試行機会または次のユーザーターンまでキューに残ることがあります。
- **Fast path:** 許可リスト入り送信者からのコマンドのみメッセージは即座に処理されます（キュー + モデルをバイパス）。
- **グループ mention ゲーティング:** 許可リスト入り送信者からのコマンドのみメッセージは mention 要件をバイパスします。
- **インラインショートカット（許可リスト入り送信者のみ）:** 特定のコマンドは通常メッセージに埋め込まれていても動作し、残りのテキストがモデルに見える前に取り除かれます。
  - 例: `hey /status` は status 応答をトリガーし、残りのテキストは通常のフローを継続します。
- 現在: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。
- 認可されていないコマンドのみメッセージは黙って無視され、インラインの `/...` トークンは平文テキストとして扱われます。
- **skill コマンド:** `user-invocable` の Skills はスラッシュコマンドとして公開されます。名前は `a-z0-9_` にサニタイズされ（最大 32 文字）、衝突時には数字の接尾辞が付きます（例: `_2`）。
  - `/skill <name> [input]` は名前で skill を実行します（ネイティブコマンドの制限により skill ごとのコマンドが使えないときに便利です）。
  - デフォルトでは、skill コマンドは通常のリクエストとしてモデルに転送されます。
  - Skills は、任意で `command-dispatch: tool` を宣言し、コマンドを直接ツールにルーティングできます（決定的で、モデルなし）。
  - 例: `/prose`（OpenProse Plugin）— [OpenProse](/ja-JP/prose) を参照してください。
- **ネイティブコマンド引数:** Discord は動的オプションに autocomplete を使います（必須引数を省略した場合はボタンメニューも使います）。Telegram と Slack では、コマンドが選択肢をサポートしていて引数を省略するとボタンメニューが表示されます。

## `/tools`

`/tools` は設定上の質問ではなく、ランタイム上の質問に答えます: **この会話でこのエージェントが今使えるものは何か**。

- デフォルトの `/tools` はコンパクトで、素早く確認できるよう最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンド surface では、`compact|verbose` として同じモード切り替えが公開されます。
- 結果はセッション単位です。そのため、エージェント、チャネル、スレッド、送信者認可、またはモデルを変えると、出力が変わることがあります。
- `/tools` には、core ツール、接続された Plugin ツール、チャネル所有ツールを含め、ランタイムで実際に到達可能なツールが含まれます。

profile や override の編集には、`/tools` を静的カタログとして扱うのではなく、Control UI の Tools パネルまたは config/catalog surface を使用してください。

## 使用量 surface（どこに何が表示されるか）

- **provider 使用量/クォータ**（例: 「Claude 80% left」）は、使用量追跡が有効な場合、現在のモデル provider に対して `/status` に表示されます。OpenClaw は provider ウィンドウを `% left` に正規化します。MiniMax では、残量のみの percent フィールドは表示前に反転され、`model_remains` 応答ではチャットモデルのエントリが優先され、モデルタグ付きの plan ラベルが付きます。
- `/status` 内の **トークン/キャッシュ行** は、ライブセッションスナップショットが乏しい場合、最新の transcript usage エントリにフォールバックできます。既存のゼロ以外のライブ値は引き続き優先され、保存済み合計が欠けているか小さい場合には、transcript フォールバックによってアクティブなランタイムモデルラベルと、より大きなプロンプト指向の合計も復元できます。
- **応答ごとのトークン/コスト** は `/usage off|tokens|full` で制御されます（通常の応答に追記されます）。
- `/model status` は使用量ではなく、**モデル/認証/endpoint** に関するものです。

## モデル選択（`/model`）

`/model` はディレクティブとして実装されています。

例:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

注意:

- `/model` と `/model list` は、コンパクトな番号付き picker（モデルファミリー + 利用可能な provider）を表示します。
- Discord では、`/model` と `/models` は provider とモデルのドロップダウン、および Submit ステップを持つインタラクティブ picker を開きます。
- `/model <#>` はその picker から選択します（可能なら現在の provider を優先します）。
- `/model status` は詳細ビューを表示し、利用可能であれば設定済み provider endpoint（`baseUrl`）と API mode（`api`）も含みます。

## デバッグ上書き

`/debug` では、**ランタイムのみ**の config 上書き（ディスクではなくメモリ）を設定できます。owner 専用。デフォルトでは無効で、`commands.debug: true` で有効にします。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注意:

- 上書きは新しい config 読み取りに即座に適用されますが、`openclaw.json` には書き込みません。
- `/debug reset` を使うとすべての上書きをクリアし、ディスク上の config に戻れます。

## Plugin trace 出力

`/trace` を使うと、完全な verbose mode を有効にせずに、**セッション単位の Plugin trace/debug 行** を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注意:

- 引数なしの `/trace` は現在のセッション trace 状態を表示します。
- `/trace on` は現在のセッションの Plugin trace 行を有効にします。
- `/trace off` は再び無効にします。
- Plugin trace 行は `/status` 内や、通常のアシスタント応答の後続の診断メッセージとして表示されることがあります。
- `/trace` は `/debug` の代わりではありません。`/debug` は引き続きランタイムのみの config 上書きを管理します。
- `/trace` は `/verbose` の代わりでもありません。通常の verbose なツール/status 出力は引き続き `/verbose` に属します。

## Config の更新

`/config` はディスク上の config（`openclaw.json`）に書き込みます。owner 専用。デフォルトでは無効で、`commands.config: true` で有効にします。

例:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

注意:

- config は書き込み前に検証され、無効な変更は拒否されます。
- `/config` の更新は再起動後も保持されます。

## MCP の更新

`/mcp` は、`mcp.servers` 配下の OpenClaw 管理 MCP server 定義を書き込みます。owner 専用。デフォルトでは無効で、`commands.mcp: true` で有効にします。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

注意:

- `/mcp` は config を OpenClaw config に保存し、Pi 所有の project settings には保存しません。
- 実際にどの転送が実行可能かは、ランタイムアダプターが決定します。

## Plugin の更新

`/plugins` では、オペレーターが検出された Plugin を確認し、config 内で有効化を切り替えられます。読み取り専用フローでは `/plugin` を alias として使えます。デフォルトでは無効で、`commands.plugins: true` で有効にします。

例:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

注意:

- `/plugins list` と `/plugins show` は、現在のワークスペースとディスク上 config に対して実際の Plugin 検出を行います。
- `/plugins enable|disable` は Plugin config のみを更新し、Plugin を install または uninstall しません。
- enable/disable の変更後は、適用するために Gateway を再起動してください。

## surface に関する注意

- **テキストコマンド** は通常のチャットセッションで実行されます（DM は `main` を共有し、グループは独自セッションを持ちます）。
- **ネイティブコマンド** は分離されたセッションを使います:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
  - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` を介してチャットセッションを対象にします）
- **`/stop`** はアクティブなチャットセッションを対象にするため、現在の実行を中止できます。
- **Slack:** `channels.slack.slashCommand` は、単一の `/openclaw` 形式コマンド用として引き続きサポートされています。`commands.native` を有効にする場合、組み込みコマンドごとに 1 つの Slack slash command を作成する必要があります（名前は `/help` と同じ）。Slack 用のコマンド引数メニューは、一時的な Block Kit ボタンとして配信されます。
  - Slack のネイティブ例外: Slack は `/status` を予約しているため、`/status` ではなく `/agentstatus` を登録してください。テキストの `/status` は Slack メッセージ内で引き続き動作します。

## BTW 横道質問

`/btw` は、現在のセッションに対する素早い**横道質問**です。

通常のチャットとは異なり、これは:

- 現在のセッションを背景コンテキストとして使い、
- 別個の**ツールなし**ワンショット呼び出しとして実行され、
- 今後のセッションコンテキストを変更せず、
- transcript 履歴に書き込まれず、
- 通常のアシスタントメッセージではなく、ライブの横道結果として配信されます。

そのため、`/btw` はメインタスクを進めたまま一時的な確認をしたいときに便利です。

例:

```text
/btw what are we doing right now?
```

完全な動作とクライアント UX の詳細については、[BTW 横道質問](/ja-JP/tools/btw) を参照してください。
