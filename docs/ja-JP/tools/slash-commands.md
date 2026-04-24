---
read_when:
    - チャットコマンドを使う、または設定する場合
    - コマンドのルーティングや権限をデバッグする場合
summary: 'Slash Commands: テキスト vs ネイティブ、Config、対応コマンド'
title: Slash Commands
x-i18n:
    generated_at: "2026-04-24T05:26:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f708cb3c4c22dc7a97b62ce5e2283b4ecfa5c44f72eb501934e80f80181953b7
    source_path: tools/slash-commands.md
    workflow: 15
---

コマンドは Gateway によって処理されます。ほとんどのコマンドは `/` で始まる**単独の**メッセージとして送る必要があります。
host 専用の bash チャットコマンドは `! <cmd>` を使います（`/bash <cmd>` はエイリアス）。

関連する 2 つのシステムがあります。

- **Commands**: 単独の `/...` メッセージ。
- **Directives**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`。
  - Directives は、モデルがメッセージを見る前に取り除かれます。
  - 通常のチャットメッセージ（directive のみではない）では、それらは「インラインヒント」として扱われ、セッション設定を永続化しません。
  - directive のみのメッセージ（メッセージが directives のみを含む）では、それらはセッションに永続化され、確認応答を返します。
  - Directives は**認可された送信者**に対してのみ適用されます。`commands.allowFrom` が設定されている場合、それが使用される唯一の
    allowlist です。そうでなければ認可はチャネル allowlist/ペアリングと `commands.useAccessGroups` から来ます。
    認可されていない送信者では、directives は平文として扱われます。

いくつかの**インラインショートカット**（allowlist 済み/認可済み送信者のみ）もあります: `/help`, `/commands`, `/status`, `/whoami`（`/id`）。
これらは即座に実行され、モデルがメッセージを見る前に取り除かれ、残りのテキストは通常フローを続行します。

## Config

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

- `commands.text`（デフォルト `true`）は、チャットメッセージ内での `/...` 解析を有効にします。
  - ネイティブコマンドのないサーフェス（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）では、これを `false` に設定してもテキストコマンドは引き続き動作します。
- `commands.native`（デフォルト `"auto"`）はネイティブコマンドを登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフ（slash command を追加するまで）。ネイティブサポートのない provider では無視されます。
  - provider ごとに上書きするには `channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（bool または `"auto"`）。
  - `false` は起動時に Discord/Telegram で以前登録されたコマンドをクリアします。Slack コマンドは Slack app 内で管理され、自動では削除されません。
- `commands.nativeSkills`（デフォルト `"auto"`）は、サポートされている場合に **skill** コマンドをネイティブ登録します。
  - Auto: Discord/Telegram ではオン、Slack ではオフ（Slack では skill ごとに slash command を作成する必要があります）。
  - provider ごとに上書きするには `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（bool または `"auto"`）。
- `commands.bash`（デフォルト `false`）は、host シェルコマンドを実行する `! <cmd>` を有効にします（`/bash <cmd>` はエイリアス。`tools.elevated` allowlist が必要）。
- `commands.bashForegroundMs`（デフォルト `2000`）は、bash がバックグラウンドモードに切り替わる前にどれだけ待つかを制御します（`0` なら即座にバックグラウンド化）。
- `commands.config`（デフォルト `false`）は `/config` を有効にします（`openclaw.json` を読み書き）。
- `commands.mcp`（デフォルト `false`）は `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP config を読み書き）。
- `commands.plugins`（デフォルト `false`）は `/plugins` を有効にします（Plugin の discovery/status と install + enable/disable 制御）。
- `commands.debug`（デフォルト `false`）は `/debug` を有効にします（ランタイム専用上書き）。
- `commands.restart`（デフォルト `true`）は `/restart` と gateway restart tool アクションを有効にします。
- `commands.ownerAllowFrom`（任意）は、owner 専用コマンド/tool サーフェス向けの明示的な owner allowlist を設定します。これは `commands.allowFrom` とは別です。
- チャネルごとの `channels.<channel>.commands.enforceOwnerForCommands`（任意、デフォルト `false`）は、そのサーフェス上で owner 専用コマンドの実行に**owner identity** を必須にします。`true` の場合、送信者は解決済み owner candidate（たとえば `commands.ownerAllowFrom` のエントリーや provider ネイティブ owner メタデータ）に一致するか、内部メッセージチャネル上で内部 `operator.admin` scope を保持している必要があります。チャネル `allowFrom` のワイルドカードエントリー、または空/未解決の owner-candidate リストでは**不十分**です — owner 専用コマンドはそのチャネルで fail closed します。owner 専用コマンドを `ownerAllowFrom` と標準のコマンド allowlist のみで制御したい場合は、これをオフのままにしてください。
- `commands.ownerDisplay` は、system prompt 内で owner id をどう表示するかを制御します: `raw` または `hash`。
- `commands.ownerDisplaySecret` は、`commands.ownerDisplay="hash"` のときに使う HMAC secret を任意で設定します。
- `commands.allowFrom`（任意）は、コマンド認可のための provider ごとの allowlist を設定します。設定されている場合、それが
  commands と directives に対する唯一の認可ソースになり（チャネル allowlist/ペアリングと `commands.useAccessGroups`
  は無視されます）。グローバルデフォルトには `"*"` を使い、provider 固有キーがそれを上書きします。
- `commands.useAccessGroups`（デフォルト `true`）は、`commands.allowFrom` が設定されていないときに commands に対する allowlist/ポリシーを強制します。

## コマンド一覧

現在の source-of-truth:

- core の built-in は `src/auto-reply/commands-registry.shared.ts` 由来
- 生成された dock コマンドは `src/auto-reply/commands-registry.data.ts` 由来
- Plugin コマンドは Plugin の `registerCommand()` 呼び出し由来
- あなたの gateway で実際に利用可能かどうかは、引き続き config フラグ、チャネルサーフェス、install/有効化された Plugin に依存します

### core built-in コマンド

現在利用可能な built-in コマンド:

- `/new [model]` は新しいセッションを開始します。`/reset` は reset エイリアスです。
- `/reset soft [message]` は現在の transcript を維持しつつ、再利用される CLI backend セッション ID を破棄し、その場で startup/system-prompt 読み込みを再実行します。
- `/compact [instructions]` はセッションコンテキストを Compaction します。[/concepts/compaction](/ja-JP/concepts/compaction) を参照してください。
- `/stop` は現在の実行を中断します。
- `/session idle <duration|off>` と `/session max-age <duration|off>` は thread-binding expiry を管理します。
- `/think <level>` は thinking level を設定します。選択肢はアクティブモデルの provider profile から取得されます。一般的な level は `off`, `minimal`, `low`, `medium`, `high` で、`xhigh`, `adaptive`, `max` や二値の `on` のような custom level はサポートされる場合にのみ利用できます。エイリアス: `/thinking`, `/t`。
- `/verbose on|off|full` は verbose 出力を切り替えます。エイリアス: `/v`。
- `/trace on|off` は現在のセッションの Plugin trace 出力を切り替えます。
- `/fast [status|on|off]` は fast mode を表示または設定します。
- `/reasoning [on|off|stream]` は reasoning の可視性を切り替えます。エイリアス: `/reason`。
- `/elevated [on|off|ask|full]` は elevated mode を切り替えます。エイリアス: `/elev`。
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec のデフォルトを表示または設定します。
- `/model [name|#|status]` はモデルを表示または設定します。
- `/models [provider] [page] [limit=<n>|size=<n>|all]` は provider 一覧または provider のモデル一覧を表示します。
- `/queue <mode>` は queue 動作（`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`）と、`debounce:2s cap:25 drop:summarize` のようなオプションを管理します。
- `/help` は短い help サマリーを表示します。
- `/commands` は生成されたコマンドカタログを表示します。
- `/tools [compact|verbose]` は、現在の agent が今すぐ使えるものを表示します。
- `/status` は、利用可能な場合に `Runtime`/`Runner` ラベルと provider の usage/quota を含むランタイム状態を表示します。
- `/tasks` は、現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧します。
- `/context [list|detail|json]` は、コンテキストがどのように組み立てられるかを説明します。
- `/export-session [path]` は現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
- `/export-trajectory [path]` は、現在のセッションの JSONL [trajectory bundle](/ja-JP/tools/trajectory) をエクスポートします。エイリアス: `/trajectory`。
- `/whoami` はあなたの sender id を表示します。エイリアス: `/id`。
- `/skill <name> [input]` は、名前で skill を実行します。
- `/allowlist [list|add|remove] ...` は allowlist エントリーを管理します。テキスト専用。
- `/approve <id> <decision>` は exec 承認プロンプトを解決します。
- `/btw <question>` は、将来のセッションコンテキストを変更せずに脇の質問をします。[/tools/btw](/ja-JP/tools/btw) を参照してください。
- `/subagents list|kill|log|info|send|steer|spawn` は、現在のセッションの sub-agent 実行を管理します。
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は ACP セッションとランタイムオプションを管理します。
- `/focus <target>` は、現在の Discord thread または Telegram topic/conversation をセッション対象にバインドします。
- `/unfocus` は現在の binding を削除します。
- `/agents` は現在のセッションの thread-bound agent を一覧します。
- `/kill <id|#|all>` は、1 つまたはすべての実行中 sub-agent を中断します。
- `/steer <id|#> <message>` は、実行中 sub-agent に steering を送ります。エイリアス: `/tell`。
- `/config show|get|set|unset` は `openclaw.json` を読み書きします。owner 専用。`commands.config: true` が必要です。
- `/mcp show|get|set|unset` は `mcp.servers` 配下の OpenClaw 管理 MCP server config を読み書きします。owner 専用。`commands.mcp: true` が必要です。
- `/plugins list|inspect|show|get|install|enable|disable` は Plugin state を確認または変更します。`/plugin` はエイリアスです。書き込みは owner 専用。`commands.plugins: true` が必要です。
- `/debug show|set|unset|reset` はランタイム専用 config 上書きを管理します。owner 専用。`commands.debug: true` が必要です。
- `/usage off|tokens|full|cost` は応答ごとの usage フッターを制御するか、ローカルのコスト概要を表示します。
- `/tts on|off|status|provider|limit|summary|audio|help` は TTS を制御します。[/tools/tts](/ja-JP/tools/tts) を参照してください。
- `/restart` は有効時に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定します。
- `/activation mention|always` はグループ activation mode を設定します。
- `/send on|off|inherit` は send ポリシーを設定します。owner 専用。
- `/bash <command>` は host シェルコマンドを実行します。テキスト専用。エイリアス: `! <command>`。`commands.bash: true` と `tools.elevated` allowlist が必要です。
- `!poll [sessionId]` はバックグラウンド bash ジョブを確認します。
- `!stop [sessionId]` はバックグラウンド bash ジョブを停止します。

### 生成された dock コマンド

Dock コマンドは、ネイティブコマンド対応のチャネル Plugin から生成されます。現在の bundled セット:

- `/dock-discord`（エイリアス: `/dock_discord`）
- `/dock-mattermost`（エイリアス: `/dock_mattermost`）
- `/dock-slack`（エイリアス: `/dock_slack`）
- `/dock-telegram`（エイリアス: `/dock_telegram`）

### bundled Plugin コマンド

bundled Plugin はさらに slash command を追加できます。この repo にある現在の bundled コマンド:

- `/dreaming [on|off|status|help]` は memory Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` はデバイスのペアリング/セットアップフローを管理します。[Pairing](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` は、高リスクの phone Node コマンドを一時的に有効化します。
- `/voice status|list [limit]|set <voiceId|name>` は Talk voice config を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE rich card プリセットを送信します。[LINE](/ja-JP/channels/line) を参照してください。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` は、bundled Codex app-server harness を確認および制御します。[Codex Harness](/ja-JP/plugins/codex-harness) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的 skill コマンド

ユーザーが呼び出せる skills も slash command として公開されます。

- `/skill <name> [input]` は、常に汎用エントリーポイントとして機能します。
- skills は、skill/Plugin がそれらを登録すると `/prose` のような直接コマンドとして現れることもあります。
- ネイティブ skill-command 登録は `commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` で制御されます。

メモ:

- コマンドは、コマンドと引数の間に任意で `:` を受け付けます（例: `/think: high`, `/send: on`, `/help:`）。
- `/new <model>` は model alias、`provider/model`、または provider 名（fuzzy match）を受け付けます。マッチしない場合、そのテキストはメッセージ本文として扱われます。
- provider usage の完全な内訳には `openclaw status --usage` を使ってください。
- `/allowlist add|remove` には `commands.config=true` が必要で、チャネルの `configWrites` を尊重します。
- マルチアカウントチャネルでは、config 対象の `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も、対象アカウントの `configWrites` を尊重します。
- `/usage` は応答ごとの usage フッターを制御します。`/usage cost` は OpenClaw セッションログからローカルのコスト概要を表示します。
- `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定してください。
- `/plugins install <spec>` は `openclaw plugins install` と同じ Plugin spec を受け付けます: ローカル path/archive、npm package、または `clawhub:<pkg>`。
- `/plugins enable|disable` は Plugin config を更新し、再起動を促すことがあります。
- Discord 専用ネイティブコマンド: `/vc join|leave|status` は voice channel を制御します（`channels.discord.voice` とネイティブコマンドが必要。テキストとしては利用不可）。
- Discord の thread-binding コマンド（`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`）には、有効な thread bindings（`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`）が必要です。
- ACP コマンドリファレンスとランタイム動作: [ACP Agents](/ja-JP/tools/acp-agents)。
- `/verbose` はデバッグと追加可視性向けです。通常利用では **off** のままにしてください。
- `/trace` は `/verbose` より狭いです。Plugin 所有の trace/debug 行だけを表示し、通常の verbose tool chatter はオフのままにします。
- `/fast on|off` はセッション上書きを永続化します。これをクリアして config デフォルトへ戻すには、Sessions UI の `inherit` オプションを使ってください。
- `/fast` は provider 固有です: OpenAI/OpenAI Codex はネイティブ Responses エンドポイントでこれを `service_tier=priority` にマップし、公開 Anthropic への直接リクエスト（`api.anthropic.com` に送られる OAuth 認証トラフィックを含む）は `service_tier=auto` または `standard_only` にマップします。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
- 関連する場合、tool failure サマリーは引き続き表示されますが、詳細な failure テキストは `/verbose` が `on` または `full` のときにのみ含まれます。
- `/reasoning`, `/verbose`, `/trace` はグループ設定では危険です。意図せず内部 reasoning、tool 出力、Plugin 診断を露出する可能性があります。特にグループチャットでは、オフのままにしておくことを推奨します。
- `/model` は新しいセッションモデルを即座に永続化します。
- agent がアイドルなら、次の実行でただちに使われます。
- すでに実行がアクティブなら、OpenClaw はライブ切り替えを pending としてマークし、クリーンなリトライポイントでのみ新しいモデルに再起動します。
- tool 活動や reply 出力がすでに始まっている場合、pending 切り替えは後のリトライ機会または次のユーザーターンまでキューされたままになることがあります。
- **Fast path:** allowlist 済み送信者からのコマンド専用メッセージは即座に処理されます（queue + model をバイパス）。
- **グループ mention ゲート:** allowlist 済み送信者からのコマンド専用メッセージは mention 要件をバイパスします。
- **インラインショートカット（allowlist 済み送信者のみ）:** 一部のコマンドは通常メッセージに埋め込んでも機能し、残りのテキストがモデルに見える前に取り除かれます。
  - 例: `hey /status` は status 応答を発火し、残りのテキストは通常フローを続行します。
- 現在: `/help`, `/commands`, `/status`, `/whoami`（`/id`）。
- 認可されていないコマンド専用メッセージは静かに無視され、インラインの `/...` トークンは平文として扱われます。
- **skill コマンド:** `user-invocable` skills は slash command として公開されます。名前は `a-z0-9_` にサニタイズされ（最大 32 文字）、衝突時は数値サフィックスが付与されます（例: `_2`）。
  - `/skill <name> [input]` は、名前で skill を実行します（ネイティブコマンド制限により skill ごとのコマンドを作れない場合に有用）。
  - デフォルトでは、skill コマンドは通常リクエストとしてモデルへ転送されます。
  - skills は、コマンドを tool へ直接ルーティングするために、オプションで `command-dispatch: tool` を宣言できます（決定的、モデルなし）。
  - 例: `/prose`（OpenProse Plugin）— [OpenProse](/ja-JP/prose) を参照してください。
- **ネイティブコマンド引数:** Discord は動的オプションに autocomplete を使います（必須引数を省略するとボタンメニューも表示）。Telegram と Slack は、コマンドが選択肢をサポートし、かつ引数を省略した場合にボタンメニューを表示します。

## `/tools`

`/tools` は config の質問ではなく、ランタイムの質問に答えます: **この会話でこの agent が今すぐ使えるものは何か**。

- デフォルトの `/tools` は compact で、素早く見渡せるよう最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンドサーフェスでは、同じ `compact|verbose` モード切り替えが公開されます。
- 結果はセッションスコープなので、agent、channel、thread、sender 認可、または model を変えると
  出力が変わることがあります。
- `/tools` には、core tools、接続された
  Plugin tools、チャネル所有 tools を含め、ランタイムで実際に到達可能な tools が含まれます。

profile や override の編集には、`/tools` を静的カタログとして扱うのではなく、Control UI の Tools パネルまたは config/catalog サーフェスを使ってください。

## Usage サーフェス（どこに何が表示されるか）

- **Provider usage/quota**（例: 「Claude 80% left」）は、usage tracking が有効な場合、現在のモデル provider について `/status` に表示されます。OpenClaw は provider window を `% left` に正規化します。MiniMax では、remaining-only percent フィールドは表示前に反転され、`model_remains` 応答では chat-model エントリーと model-tagged plan label が優先されます。
- `/status` の **token/cache 行** は、ライブセッションスナップショットが疎な場合、最新のトランスクリプト usage エントリーにフォールバックできます。既存の非ゼロのライブ値が引き続き優先され、トランスクリプトフォールバックはアクティブなランタイムモデルラベルと、保存済み合計が欠けているか小さい場合のより大きな prompt 指向合計も復元できます。
- **Runtime vs runner:** `/status` は有効な実行パスと sandbox state について `Runtime` を、実際にセッションを実行している主体について `Runner` を報告します: 埋め込み Pi、CLI-backed provider、または ACP harness/backend。
- **応答ごとのトークン/コスト** は `/usage off|tokens|full` で制御されます（通常の返信に追加されます）。
- `/model status` は usage ではなく **models/auth/endpoints** に関するものです。

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

メモ:

- `/model` と `/model list` は compact な番号付き picker（model family + 利用可能 provider）を表示します。
- Discord では、`/model` と `/models` は provider と model のドロップダウン、および Submit ステップを持つ対話型 picker を開きます。
- `/model <#>` はその picker から選択します（可能なら現在の provider を優先します）。
- `/model status` は、設定された provider endpoint（`baseUrl`）と API mode（`api`）を含む詳細ビューを表示します（利用可能な場合）。

## デバッグ上書き

`/debug` では **ランタイム専用** の config 上書き（ディスクではなくメモリ）を設定できます。owner 専用。デフォルトでは無効で、`commands.debug: true` で有効化します。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

メモ:

- 上書きは新しい config 読み取りにただちに適用されますが、`openclaw.json` には書き込みません。
- すべての上書きをクリアしてディスク上の config に戻るには `/debug reset` を使ってください。

## Plugin trace 出力

`/trace` では、完全な verbose mode をオンにせずに、**セッションスコープの Plugin trace/debug 行**を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

メモ:

- 引数なしの `/trace` は、現在のセッショントレース状態を表示します。
- `/trace on` は、現在のセッションで Plugin trace 行を有効化します。
- `/trace off` は、それを再び無効化します。
- Plugin trace 行は `/status` や通常のアシスタント返信の後続診断メッセージとして現れることがあります。
- `/trace` は `/debug` の代わりではありません。ランタイム専用 config 上書きは引き続き `/debug` が管理します。
- `/trace` は `/verbose` の代わりでもありません。通常の verbose tool/status 出力は引き続き `/verbose` の役割です。

## Config 更新

`/config` は、ディスク上の config（`openclaw.json`）に書き込みます。owner 専用。デフォルトでは無効で、`commands.config: true` で有効化します。

例:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

メモ:

- config は書き込み前に検証されます。無効な変更は拒否されます。
- `/config` 更新は再起動後も保持されます。

## MCP 更新

`/mcp` は、`mcp.servers` 配下の OpenClaw 管理 MCP server 定義を書き込みます。owner 専用。デフォルトでは無効で、`commands.mcp: true` で有効化します。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

メモ:

- `/mcp` は config を OpenClaw config に保存し、Pi 所有の project 設定には保存しません。
- 実際にどの transport が実行可能かはランタイムアダプターが決定します。

## Plugin 更新

`/plugins` では、運用者が検出済み Plugin を確認し、config 内で有効化を切り替えられます。読み取り専用フローでは `/plugin` をエイリアスとして使えます。デフォルトでは無効で、`commands.plugins: true` で有効化します。

例:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

メモ:

- `/plugins list` と `/plugins show` は、現在の workspace とディスク上 config に対する実際の Plugin discovery を使います。
- `/plugins enable|disable` は Plugin config のみを更新し、Plugin の install や uninstall は行いません。
- enable/disable の変更後、それらを適用するには gateway を再起動してください。

## サーフェスに関するメモ

- **テキストコマンド** は通常のチャットセッションで実行されます（DM は `main` を共有し、グループは独自のセッションを持ちます）。
- **ネイティブコマンド** は分離されたセッションを使います:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
  - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` 経由でチャットセッションを対象にする）
- **`/stop`** は、現在の実行を中断できるようにアクティブなチャットセッションを対象にします。
- **Slack:** `channels.slack.slashCommand` は、単一の `/openclaw` 形式コマンドとして引き続きサポートされます。`commands.native` を有効にする場合、built-in コマンドごとに 1 つの Slack slash command を作成する必要があります（名前は `/help` と同じ）。Slack のコマンド引数メニューは ephemeral Block Kit ボタンとして配信されます。
  - Slack ネイティブ例外: Slack は `/status` を予約しているため、`/status` ではなく `/agentstatus` を登録してください。テキスト `/status` は引き続き Slack メッセージ内で機能します。

## BTW 脇質問

`/btw` は、現在のセッションに関する素早い**脇質問**です。

通常のチャットとは違って、これは:

- 現在のセッションを背景コンテキストとして使い、
- 別個の **tool なし** の one-shot call として実行され、
- 将来のセッションコンテキストを変更せず、
- transcript 履歴には書き込まれず、
- 通常のアシスタントメッセージではなくライブの脇結果として配信されます。

そのため、メイン
タスクを進めたまま一時的な確認をしたいときに `/btw` は役立ちます。

例:

```text
/btw what are we doing right now?
```

完全な動作とクライアント UX
の詳細は [BTW Side Questions](/ja-JP/tools/btw) を参照してください。

## 関連

- [Skills](/ja-JP/tools/skills)
- [Skills config](/ja-JP/tools/skills-config)
- [Creating skills](/ja-JP/tools/creating-skills)
