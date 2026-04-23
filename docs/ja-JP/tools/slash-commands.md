---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
summary: 'スラッシュコマンド: テキスト vs ネイティブ、設定、サポートされるコマンド'
title: Slash Commands
x-i18n:
    generated_at: "2026-04-23T14:10:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13290dcdf649ae66603a92a0aca68460bb63ff476179cc2dded796aaa841d66c
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash Commands

コマンドは Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる**単独の**メッセージとして送る必要があります。
host 専用の bash チャットコマンドは `! <cmd>` を使います（`/bash <cmd>` はそのエイリアスです）。

関連する 2 つのシステムがあります。

- **Commands**: 単独の `/...` メッセージ。
- **Directives**: `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。
  - Directives は、モデルがメッセージを見る前に取り除かれます。
  - 通常のチャットメッセージ（directive のみではないもの）では、「インラインヒント」として扱われ、セッション設定を永続化**しません**。
  - directive のみのメッセージ（メッセージが directives のみを含む場合）では、セッションに永続化され、確認応答が返されます。
  - Directives は**認可された送信者**に対してのみ適用されます。`commands.allowFrom` が設定されている場合、それが使われる唯一の
    allowlist です。そうでなければ、認可はチャネル allowlist/pairing と `commands.useAccessGroups` から来ます。
    認可されていない送信者には、directives は通常のテキストとして扱われます。

いくつかの **inline shortcut** もあります（allowlist/認可済み送信者のみ）: `/help`、`/commands`、`/status`、`/whoami`（`/id`）。
これらは即座に実行され、モデルがメッセージを見る前に取り除かれ、残りのテキストは通常のフローを続行します。

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

- `commands.text`（既定 `true`）は、チャットメッセージ内の `/...` 解析を有効にします。
  - ネイティブコマンドのない画面（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）では、これを `false` に設定してもテキストコマンドは引き続き動作します。
- `commands.native`（既定 `"auto"`）は、ネイティブコマンドを登録します。
  - Auto: Discord/Telegram では on、Slack では off（slash commands を追加するまでは off）、ネイティブサポートのない provider では無視されます。
  - provider ごとに上書きするには `channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定してください（bool または `"auto"`）。
  - `false` にすると、起動時に Discord/Telegram で以前登録されたコマンドを削除します。Slack コマンドは Slack app で管理され、自動削除はされません。
- `commands.nativeSkills`（既定 `"auto"`）は、サポートされている場合に **skill** コマンドをネイティブ登録します。
  - Auto: Discord/Telegram では on、Slack では off（Slack では skill ごとに slash command 作成が必要）。
  - provider ごとに上書きするには `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定してください（bool または `"auto"`）。
- `commands.bash`（既定 `false`）は、`! <cmd>` による host shell command 実行を有効にします（`/bash <cmd>` はエイリアス。`tools.elevated` allowlist が必要）。
- `commands.bashForegroundMs`（既定 `2000`）は、bash が background mode に切り替わるまで待つ時間を制御します（`0` なら即時に background 化）。
- `commands.config`（既定 `false`）は `/config` を有効にします（`openclaw.json` の読み書き）。
- `commands.mcp`（既定 `false`）は `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP config の読み書き）。
- `commands.plugins`（既定 `false`）は `/plugins` を有効にします（Plugin 発見/状態 + install + enable/disable 制御）。
- `commands.debug`（既定 `false`）は `/debug` を有効にします（ランタイム専用上書き）。
- `commands.restart`（既定 `true`）は `/restart` と gateway restart tool action を有効にします。
- `commands.ownerAllowFrom`（任意）は、owner-only の command/tool 画面向けに明示的な owner allowlist を設定します。これは `commands.allowFrom` とは別です。
- チャネルごとの `channels.<channel>.commands.enforceOwnerForCommands`（任意、既定 `false`）は、その画面上で owner-only コマンドの実行に **owner ID** を要求します。`true` の場合、送信者は解決済みの owner candidate（たとえば `commands.ownerAllowFrom` のエントリや provider ネイティブの owner metadata）に一致するか、内部 message channel 上の内部 `operator.admin` scope を持っている必要があります。チャネル `allowFrom` の wildcard エントリや、空/未解決の owner-candidate 一覧では**不十分**です。owner-only コマンドはそのチャネル上で fail closed します。owner-only コマンドを `ownerAllowFrom` と標準 command allowlist のみで制御したい場合は、これを off のままにしてください。
- `commands.ownerDisplay` は、システムプロンプトで owner id をどう表示するかを制御します: `raw` または `hash`。
- `commands.ownerDisplaySecret` は、`commands.ownerDisplay="hash"` のときに使う HMAC secret を任意で設定します。
- `commands.allowFrom`（任意）は、command 認可のための provider ごとの allowlist を設定します。設定されている場合、これが
  command と directive の唯一の認可ソースになります（チャネル allowlist/pairing と `commands.useAccessGroups`
  は無視されます）。グローバル既定には `"*"` を使い、provider 固有キーがそれを上書きします。
- `commands.useAccessGroups`（既定 `true`）は、`commands.allowFrom` が未設定のとき、command に allowlist/policy を適用します。

## コマンド一覧

現在の source-of-truth:

- core 組み込みは `src/auto-reply/commands-registry.shared.ts` から来ます
- 生成された dock command は `src/auto-reply/commands-registry.data.ts` から来ます
- plugin command は Plugin の `registerCommand()` 呼び出しから来ます
- ただし、あなたの gateway 上での実際の可用性は、引き続き config flag、チャネル画面、インストール/有効化された Plugin に依存します

### Core 組み込みコマンド

現在利用可能な組み込みコマンド:

- `/new [model]` は新しいセッションを開始します。`/reset` は reset のエイリアスです。
- `/reset soft [message]` は現在の transcript を保持し、再利用される CLI backend session id を破棄し、startup/system-prompt の読み込みをその場で再実行します。
- `/compact [instructions]` はセッションコンテキストを Compaction します。[/concepts/compaction](/ja-JP/concepts/compaction) を参照してください。
- `/stop` は現在の実行を中止します。
- `/session idle <duration|off>` と `/session max-age <duration|off>` はスレッドバインディングの有効期限を管理します。
- `/think <level>` は思考レベルを設定します。選択肢はアクティブモデルの provider profile から来ます。一般的なレベルは `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max`、またはバイナリの `on` のようなカスタムレベルはサポートされている場合のみ使えます。エイリアス: `/thinking`、`/t`。
- `/verbose on|off|full` は verbose 出力を切り替えます。エイリアス: `/v`。
- `/trace on|off` は現在のセッションの Plugin trace 出力を切り替えます。
- `/fast [status|on|off]` は fast mode を表示または設定します。
- `/reasoning [on|off|stream]` は reasoning の可視性を切り替えます。エイリアス: `/reason`。
- `/elevated [on|off|ask|full]` は elevated mode を切り替えます。エイリアス: `/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec 既定値を表示または設定します。
- `/model [name|#|status]` はモデルを表示または設定します。
- `/models [provider] [page] [limit=<n>|size=<n>|all]` は provider 一覧または provider のモデル一覧を表示します。
- `/queue <mode>` はキュー動作（`steer`、`interrupt`、`followup`、`collect`、`steer-backlog`）と、`debounce:2s cap:25 drop:summarize` のようなオプションを管理します。
- `/help` は短いヘルプ要約を表示します。
- `/commands` は生成されたコマンドカタログを表示します。
- `/tools [compact|verbose]` は、現在の agent が今使えるものを表示します。
- `/status` はランタイム状態を表示します。利用可能な場合は `Runtime`/`Runner` ラベルと provider usage/quota も含みます。
- `/tasks` は現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
- `/context [list|detail|json]` はコンテキストがどのように組み立てられるかを説明します。
- `/export-session [path]` は現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
- `/export-trajectory [path]` は現在のセッションの JSONL [trajectory bundle](/ja-JP/tools/trajectory) をエクスポートします。エイリアス: `/trajectory`。
- `/whoami` は自分の sender id を表示します。エイリアス: `/id`。
- `/skill <name> [input]` は名前で skill を実行します。
- `/allowlist [list|add|remove] ...` は allowlist エントリを管理します。テキスト専用です。
- `/approve <id> <decision>` は exec approval prompt を解決します。
- `/btw <question>` は将来のセッションコンテキストを変更せずに脇道の質問をします。[/tools/btw](/ja-JP/tools/btw) を参照してください。
- `/subagents list|kill|log|info|send|steer|spawn` は現在のセッションの sub-agent 実行を管理します。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は ACP セッションとランタイムオプションを管理します。
- `/focus <target>` は現在の Discord スレッドまたは Telegram topic/conversation をセッションターゲットにバインドします。
- `/unfocus` は現在のバインディングを削除します。
- `/agents` は現在のセッションにスレッドバインドされた agent を一覧表示します。
- `/kill <id|#|all>` は 1 つまたはすべての実行中 sub-agent を中止します。
- `/steer <id|#> <message>` は実行中の sub-agent にステアリングを送ります。エイリアス: `/tell`。
- `/config show|get|set|unset` は `openclaw.json` を読み書きします。owner-only。`commands.config: true` が必要です。
- `/mcp show|get|set|unset` は `mcp.servers` 配下の OpenClaw 管理 MCP server config を読み書きします。owner-only。`commands.mcp: true` が必要です。
- `/plugins list|inspect|show|get|install|enable|disable` は Plugin state を確認または変更します。`/plugin` はエイリアスです。書き込みは owner-only。`commands.plugins: true` が必要です。
- `/debug show|set|unset|reset` はランタイム専用 config override を管理します。owner-only。`commands.debug: true` が必要です。
- `/usage off|tokens|full|cost` はレスポンスごとの usage footer を制御するか、ローカル cost summary を表示します。
- `/tts on|off|status|provider|limit|summary|audio|help` は TTS を制御します。[/tools/tts](/ja-JP/tools/tts) を参照してください。
- `/restart` は有効な場合に OpenClaw を再起動します。既定は有効です。無効化するには `commands.restart: false` を設定してください。
- `/activation mention|always` はグループ activation mode を設定します。
- `/send on|off|inherit` は send policy を設定します。owner-only。
- `/bash <command>` は host shell command を実行します。テキスト専用です。エイリアス: `! <command>`。`commands.bash: true` と `tools.elevated` allowlist が必要です。
- `!poll [sessionId]` はバックグラウンド bash job を確認します。
- `!stop [sessionId]` はバックグラウンド bash job を停止します。

### 生成された dock コマンド

dock コマンドは、ネイティブコマンド対応のチャネル Plugin から生成されます。現在のバンドル済みセット:

- `/dock-discord`（エイリアス: `/dock_discord`）
- `/dock-mattermost`（エイリアス: `/dock_mattermost`）
- `/dock-slack`（エイリアス: `/dock_slack`）
- `/dock-telegram`（エイリアス: `/dock_telegram`）

### バンドル済み Plugin コマンド

バンドル済み Plugin は追加の slash command を加えられます。このリポジトリで現在バンドルされているコマンド:

- `/dreaming [on|off|status|help]` はメモリ Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` はデバイス pairing/setup フローを管理します。[Pairing](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` は、高リスクの phone node command を一時的に有効化します。
- `/voice status|list [limit]|set <voiceId|name>` は Talk voice config を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE rich card preset を送信します。[LINE](/ja-JP/channels/line) を参照してください。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` は、バンドル済み Codex app-server harness を確認および制御します。[Codex Harness](/ja-JP/plugins/codex-harness) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的 skill コマンド

ユーザーが呼び出せる skill も slash command として公開されます。

- `/skill <name> [input]` は常に汎用エントリーポイントとして動作します。
- skill/plugin が登録していれば、`/prose` のような直接コマンドとして現れることもあります。
- ネイティブ skill-command 登録は `commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` で制御されます。

注意:

- コマンドは、コマンドと引数の間に任意で `:` を受け付けます（例: `/think: high`、`/send: on`、`/help:`）。
- `/new <model>` はモデルエイリアス、`provider/model`、または provider 名（あいまい一致）を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
- 完全な provider usage 内訳には、`openclaw status --usage` を使ってください。
- `/allowlist add|remove` には `commands.config=true` が必要で、チャネルの `configWrites` を尊重します。
- マルチアカウントチャネルでは、config 対象の `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も、対象アカウントの `configWrites` を尊重します。
- `/usage` はレスポンスごとの usage footer を制御します。`/usage cost` は OpenClaw セッションログからローカル cost summary を表示します。
- `/restart` は既定で有効です。無効化するには `commands.restart: false` を設定してください。
- `/plugins install <spec>` は、`openclaw plugins install` と同じ Plugin spec を受け付けます。ローカル path/archive、npm package、または `clawhub:<pkg>` です。
- `/plugins enable|disable` は Plugin config を更新し、再起動を求めることがあります。
- Discord 専用ネイティブコマンド: `/vc join|leave|status` は voice channel を制御します（`channels.discord.voice` とネイティブコマンドが必要。テキストでは利用不可）。
- Discord のスレッドバインディングコマンド（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）には、有効なスレッドバインディングが有効であることが必要です（`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`）。
- ACP のコマンドリファレンスとランタイム動作: [ACP Agents](/ja-JP/tools/acp-agents)。
- `/verbose` はデバッグと追加可視性のためのものです。通常利用では **off** のままにしてください。
- `/trace` は `/verbose` より狭いです。Plugin 所有の trace/debug 行だけを表示し、通常の verbose な tool chatter は off のままにします。
- `/fast on|off` はセッション上書きを永続化します。これをクリアして config 既定値に戻すには、Sessions UI の `inherit` オプションを使ってください。
- `/fast` は provider 固有です。OpenAI/OpenAI Codex はこれをネイティブ Responses endpoint 上の `service_tier=priority` にマップし、一方で `api.anthropic.com` に送られる OAuth 認証トラフィックを含む直接の public Anthropic リクエストでは、`service_tier=auto` または `standard_only` にマップされます。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
- Tool failure summary は関連する場合に引き続き表示されますが、詳細な failure text が含まれるのは `/verbose` が `on` または `full` の場合だけです。
- `/reasoning`、`/verbose`、`/trace` はグループ設定では危険です。意図せず内部 reasoning、tool output、または Plugin 診断を露出する可能性があります。特にグループチャットでは off のままにしておくことを推奨します。
- `/model` は新しいセッションモデルを即座に永続化します。
- agent が idle なら、次の実行で直ちに使われます。
- すでに実行がアクティブな場合、OpenClaw はライブ切り替えを pending としてマークし、クリーンな retry point でのみ新しいモデルに再起動します。
- tool activity または reply output がすでに始まっている場合、この pending switch は、後の retry 機会または次のユーザーターンまでキューに残ることがあります。
- **Fast path:** allowlist 済み送信者からの command-only メッセージは即時処理されます（queue + model をバイパス）。
- **グループ mention gating:** allowlist 済み送信者からの command-only メッセージは mention 要件をバイパスします。
- **Inline shortcut（allowlist 済み送信者のみ）:** 一部コマンドは通常メッセージに埋め込まれていても動作し、残りのテキストをモデルが見る前に取り除かれます。
  - 例: `hey /status` は status reply をトリガーし、残りのテキストは通常フローを続行します。
- 現在: `/help`、`/commands`、`/status`、`/whoami`（`/id`）。
- 認可されていない command-only メッセージは黙って無視され、inline の `/...` token は通常テキストとして扱われます。
- **Skill コマンド:** `user-invocable` な Skills は slash command として公開されます。名前は `a-z0-9_` にサニタイズされ（最大 32 文字）、衝突時には数値サフィックスが付きます（例: `_2`）。
  - `/skill <name> [input]` は名前で skill を実行します（ネイティブコマンド制限により skill ごとのコマンドが使えないときに有用）。
  - 既定では、skill コマンドは通常リクエストとしてモデルに転送されます。
  - Skills は任意で `command-dispatch: tool` を宣言でき、その場合コマンドは直接 tool にルーティングされます（決定的、モデルなし）。
  - 例: `/prose`（OpenProse Plugin）— [OpenProse](/ja-JP/prose) を参照してください。
- **ネイティブコマンド引数:** Discord は動的オプションに autocomplete を使います（必須引数を省略したときは button menu も使います）。Telegram と Slack は、コマンドが選択肢をサポートしていて引数を省略した場合に button menu を表示します。

## `/tools`

`/tools` が答えるのは config の質問ではなく、ランタイムの質問です: **この会話で、この agent が今使えるものは何か**。

- 既定の `/tools` は compact で、素早く確認するのに最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンド画面では、同じ mode 切り替え `compact|verbose` が公開されます。
- 結果はセッションスコープなので、agent、channel、thread、sender 認可、または model を変えると出力も変わることがあります。
- `/tools` には、runtime で実際に到達可能なツールが含まれます。core tool、接続済み Plugin tool、チャネル所有 tool を含みます。

profile や override の編集には、`/tools` を静的カタログとして扱うのではなく、Control UI の Tools パネルまたは config/catalog 画面を使ってください。

## Usage 画面（どこに何が表示されるか）

- **Provider usage/quota**（例: 「Claude 80% left」）は、usage tracking が有効な場合、現在の model provider に対して `/status` に表示されます。OpenClaw は provider の window を `% left` に正規化します。MiniMax では、remaining-only の percent field は表示前に反転され、`model_remains` レスポンスでは chat-model エントリと model-tagged plan label が優先されます。
- `/status` 内の **token/cache 行** は、ライブセッションスナップショットが乏しい場合、最新の transcript usage エントリにフォールバックできます。既存の非ゼロのライブ値が引き続き優先され、transcript フォールバックは、保存済み合計が欠けているか小さい場合に、アクティブランタイムの model label とより大きな prompt 指向合計も復元できます。
- **Runtime vs runner:** `/status` は、有効な実行経路と sandbox state については `Runtime` を、実際にセッションを実行している主体については `Runner` を報告します。embedded Pi、CLI-backed provider、または ACP harness/backend のいずれかです。
- **レスポンスごとの token/cost** は `/usage off|tokens|full` で制御されます（通常の返信に追記されます）。
- `/model status` は usage ではなく、**model/auth/endpoint** に関するものです。

## モデル選択（`/model`）

`/model` は directive として実装されています。

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

- `/model` と `/model list` は compact な番号付き picker（model family + 利用可能 provider）を表示します。
- Discord では、`/model` と `/models` は provider と model の dropdown、および Submit ステップを持つ対話 picker を開きます。
- `/model <#>` はその picker から選択します（可能なら現在の provider を優先します）。
- `/model status` は、設定済み provider endpoint（`baseUrl`）および利用可能な場合は API mode（`api`）を含む詳細表示を示します。

## デバッグ上書き

`/debug` では、**runtime 専用**の config override（ディスクではなくメモリ）を設定できます。owner-only。既定では無効で、有効化には `commands.debug: true` が必要です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注意:

- override は新しい config read に即座に適用されますが、`openclaw.json` には書き込みません。
- すべての override を消してディスク上 config に戻るには `/debug reset` を使ってください。

## Plugin trace 出力

`/trace` を使うと、完全な verbose mode を有効にせずに、**セッションスコープの Plugin trace/debug 行**を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注意:

- 引数なしの `/trace` は現在のセッション trace 状態を表示します。
- `/trace on` は現在のセッションで Plugin trace 行を有効にします。
- `/trace off` はそれを再び無効にします。
- Plugin trace 行は `/status` 内や、通常の assistant reply の後に続く診断メッセージとして現れることがあります。
- `/trace` は `/debug` の代わりではありません。`/debug` は引き続き runtime 専用 config override を管理します。
- `/trace` は `/verbose` の代わりでもありません。通常の verbose な tool/status 出力は引き続き `/verbose` に属します。

## Config 更新

`/config` はディスク上の config（`openclaw.json`）に書き込みます。owner-only。既定では無効で、有効化には `commands.config: true` が必要です。

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
- `/config` 更新は再起動後も永続化されます。

## MCP 更新

`/mcp` は、`mcp.servers` 配下の OpenClaw 管理 MCP server 定義を書き込みます。owner-only。既定では無効で、有効化には `commands.mcp: true` が必要です。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

注意:

- `/mcp` は Pi 所有のプロジェクト設定ではなく、OpenClaw config に保存します。
- 実際にどの transport が実行可能かは runtime adapter が決定します。

## Plugin 更新

`/plugins` では、オペレーターが検出済み Plugin を確認し、config 内で enablement を切り替えられます。読み取り専用フローでは `/plugin` をエイリアスとして使えます。既定では無効で、有効化には `commands.plugins: true` が必要です。

例:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

注意:

- `/plugins list` と `/plugins show` は、現在の workspace とディスク上 config に対して実際の Plugin 発見を使います。
- `/plugins enable|disable` は Plugin config だけを更新し、Plugin の install/uninstall は行いません。
- enable/disable の変更後は、適用のために gateway を再起動してください。

## 画面に関する注意

- **テキストコマンド** は通常のチャットセッションで実行されます（DM は `main` を共有し、グループは独自セッションを持ちます）。
- **ネイティブコマンド** は分離セッションを使います:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
  - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` を通じて chat session を対象にします）
- **`/stop`** はアクティブな chat session を対象にし、現在の実行を中止できるようにします。
- **Slack:** `channels.slack.slashCommand` は、単一の `/openclaw` 風コマンド向けに引き続きサポートされています。`commands.native` を有効にする場合は、組み込みコマンドごとに 1 つの Slack slash command を作成する必要があります（名前は `/help` と同じ）。Slack のコマンド引数メニューは ephemeral Block Kit button として配信されます。
  - Slack のネイティブ例外: Slack が `/status` を予約しているため、`/status` ではなく `/agentstatus` を登録してください。テキスト `/status` は Slack メッセージ内では引き続き動作します。

## BTW の脇道質問

`/btw` は、現在のセッションに対する素早い **脇道の質問** です。

通常の chat とは異なり:

- 現在のセッションを背景コンテキストとして使い、
- 別個の **tool なし** ワンショット呼び出しとして実行され、
- 将来のセッションコンテキストを変更せず、
- transcript history に書き込まれず、
- 通常の assistant message ではなく、ライブの side result として配信されます。

これにより、`/btw` は main
task を継続したまま一時的な確認をしたいときに便利です。

例:

```text
/btw 今、私たちは何をしているんだっけ？
```

完全な動作とクライアント UX
の詳細は [BTW Side Questions](/ja-JP/tools/btw) を参照してください。
