---
read_when:
    - チャットコマンドの使用または設定
    - コマンドのルーティングまたは権限のデバッグ
sidebarTitle: Slash commands
summary: 'スラッシュコマンド: テキスト方式とネイティブ方式、設定、対応コマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-05-02T05:07:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a00619cc0eff25b81b475eab5b0b3d808bf067e6e004a491a90ec3982149b7
    source_path: tools/slash-commands.md
    workflow: 16
---

コマンドは Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる**単独**メッセージとして送信する必要があります。ホスト専用の bash チャットコマンドは `! <cmd>` を使用します（`/bash <cmd>` はエイリアスです）。

会話またはスレッドが ACP セッションにバインドされている場合、通常のフォローアップテキストはその ACP ハーネスにルーティングされます。Gateway 管理コマンドは引き続きローカルに留まります。`/acp ...` は常に OpenClaw ACP コマンドハンドラに届き、`/status` と `/unfocus` は、そのサーフェスでコマンド処理が有効な場合は常にローカルに留まります。

関連するシステムは 2 つあります。

<AccordionGroup>
  <Accordion title="コマンド">
    単独の `/...` メッセージ。
  </Accordion>
  <Accordion title="ディレクティブ">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`。

    - ディレクティブは、モデルがメッセージを見る前に取り除かれます。
    - 通常のチャットメッセージ（ディレクティブのみではないもの）では、「インラインヒント」として扱われ、セッション設定としては**永続化されません**。
    - ディレクティブのみのメッセージ（メッセージにディレクティブのみが含まれるもの）では、セッションに永続化され、確認応答を返します。
    - ディレクティブは**認可済み送信者**に対してのみ適用されます。`commands.allowFrom` が設定されている場合、それが使用される唯一の許可リストです。それ以外の場合、認可はチャンネル許可リスト/ペアリングに加えて `commands.useAccessGroups` から取得されます。未認可の送信者では、ディレクティブはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="インラインショートカット">
    許可リスト済み/認可済み送信者のみ: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。

    これらは即座に実行され、モデルがメッセージを見る前に取り除かれ、残りのテキストは通常のフローを続行します。

  </Accordion>
</AccordionGroup>

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

<ParamField path="commands.text" type="boolean" default="true">
  チャットメッセージ内の `/...` の解析を有効にします。ネイティブコマンドがないサーフェス（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）では、これを `false` に設定してもテキストコマンドは引き続き動作します。
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ネイティブコマンドを登録します。自動: Discord/Telegram ではオン、Slack ではオフ（スラッシュコマンドを追加するまで）、ネイティブ対応のないプロバイダでは無視されます。プロバイダごとに上書きするには、`channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（ブール値または `"auto"`）。`false` は起動時に Discord/Telegram 上で以前登録されたコマンドを消去します。Slack コマンドは Slack アプリで管理され、自動的には削除されません。
</ParamField>
Discord では、ネイティブコマンド仕様に `descriptionLocalizations` を含めることができ、OpenClaw はこれを Discord `description_localizations` として公開し、照合比較に含めます。
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  対応している場合、**skill** コマンドをネイティブに登録します。自動: Discord/Telegram ではオン、Slack ではオフ（Slack では skill ごとにスラッシュコマンドを作成する必要があります）。プロバイダごとに上書きするには、`channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（ブール値または `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` でホストシェルコマンドを実行できるようにします（`/bash <cmd>` はエイリアスです。`tools.elevated` 許可リストが必要です）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash がバックグラウンドモードへ切り替える前に待機する時間を制御します（`0` は即座にバックグラウンド化します）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` を読み書きします）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定を読み書きします）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（plugin の検出/状態に加えて、インストールと有効化/無効化の制御）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（ランタイムのみの上書き）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と gateway 再起動ツールアクションを有効にします。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  owner 専用のコマンド/ツールサーフェスに対する明示的な owner 許可リストを設定します。これは危険なアクションを承認し、`/diagnostics`、`/export-trajectory`、`/config` などのコマンドを実行できる人間のオペレータアカウントです。`commands.allowFrom` および DM ペアリングアクセスとは別です。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごと: そのサーフェスで owner 専用コマンドを実行するには **owner identity** を必須にします。`true` の場合、送信者は解決済みの owner 候補（たとえば `commands.ownerAllowFrom` のエントリやプロバイダネイティブの owner メタデータ）に一致するか、内部メッセージチャンネルで内部 `operator.admin` スコープを保持している必要があります。チャンネル `allowFrom` のワイルドカードエントリや、空または未解決の owner 候補リストだけでは十分ではありません。そのチャンネルでは owner 専用コマンドは fail closed になります。owner 専用コマンドを `ownerAllowFrom` と標準のコマンド許可リストだけでゲートしたい場合は、これをオフのままにしてください。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプト内で owner id がどのように表示されるかを制御します。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay="hash"` の場合に使用される HMAC シークレットを任意で設定します。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  コマンド認可のためのプロバイダごとの許可リスト。設定されている場合、これはコマンドとディレクティブの唯一の認可ソースです（チャンネル許可リスト/ペアリングと `commands.useAccessGroups` は無視されます）。グローバルデフォルトには `"*"` を使用します。プロバイダ固有のキーはそれを上書きします。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合、コマンドに対して許可リスト/ポリシーを適用します。
</ParamField>

## コマンド一覧

現在の信頼できる情報源:

- core 組み込みは `src/auto-reply/commands-registry.shared.ts` から取得されます
- 生成された dock コマンドは `src/auto-reply/commands-registry.data.ts` から取得されます
- plugin コマンドは plugin の `registerCommand()` 呼び出しから取得されます
- gateway 上で実際に利用できるかは、設定フラグ、チャンネルサーフェス、インストール済み/有効化済み plugins に引き続き依存します

### core 組み込みコマンド

<AccordionGroup>
  <Accordion title="セッションと実行">
    - `/new [model]` は新しいセッションを開始します。`/reset` はリセットのエイリアスです。
    - `/reset soft [message]` は現在のトランスクリプトを保持し、再利用された CLI バックエンドセッション id を破棄し、起動/システムプロンプト読み込みをインプレースで再実行します。
    - `/compact [instructions]` はセッションコンテキストを compact します。[Compaction](/ja-JP/concepts/compaction) を参照してください。
    - `/stop` は現在の実行を中止します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` はスレッドバインディングの有効期限を管理します。
    - `/export-session [path]` は現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
    - `/export-trajectory [path]` は exec 承認を求めた後、現在のセッションの JSONL [trajectory bundle](/ja-JP/tools/trajectory) をエクスポートします。1 つの OpenClaw セッションについて、プロンプト、ツール、トランスクリプトのタイムラインが必要な場合に使用します。グループチャットでは、承認プロンプトとエクスポート結果は owner に非公開で送信されます。エイリアス: `/trajectory`。

  </Accordion>
  <Accordion title="モデルと実行制御">
    - `/think <level>` は思考レベルを設定します。選択肢はアクティブなモデルのプロバイダプロファイルから取得されます。一般的なレベルは `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max` などのカスタムレベルやバイナリの `on` は対応している場合にのみ使用できます。エイリアス: `/thinking`, `/t`。
    - `/verbose on|off|full` は詳細出力を切り替えます。エイリアス: `/v`。
    - `/trace on|off` は現在のセッションの plugin trace 出力を切り替えます。
    - `/fast [status|on|off]` は fast mode を表示または設定します。
    - `/reasoning [on|off|stream]` は reasoning の可視性を切り替えます。エイリアス: `/reason`。
    - `/elevated [on|off|ask|full]` は elevated mode を切り替えます。エイリアス: `/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec デフォルトを表示または設定します。
    - `/model [name|#|status]` はモデルを表示または設定します。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` は、設定済み/認証利用可能なプロバイダ、またはプロバイダのモデルを一覧表示します。`all` を追加すると、そのプロバイダの完全なカタログを閲覧できます。
    - `/queue <mode>` はキューの動作（`steer`、レガシー `queue`、`followup`、`collect`、`steer-backlog`、`interrupt`）と、`debounce:0.5s cap:25 drop:summarize` などのオプションを管理します。`/queue default` または `/queue reset` はセッションの上書きをクリアします。[Command queue](/ja-JP/concepts/queue) と [Steering queue](/ja-JP/concepts/queue-steering) を参照してください。

  </Accordion>
  <Accordion title="検出と状態">
    - `/help` は短いヘルプ概要を表示します。
    - `/commands` は生成されたコマンドカタログを表示します。
    - `/tools [compact|verbose]` は現在のエージェントが今すぐ使用できるものを表示します。
    - `/status` は、利用可能な場合は `Execution`/`Runtime` ラベルとプロバイダ使用量/クォータを含む実行/ランタイム状態を表示します。
    - `/diagnostics [note]` は、Gateway バグと Codex ハーネス実行のための owner 専用サポートレポートフローです。`openclaw gateway diagnostics export --json` を実行する前に、毎回明示的な exec 承認を求めます。allow-all ルールで診断を承認しないでください。承認後、ローカルバンドルパス、マニフェスト概要、プライバシー注記、関連セッション id を含む貼り付け可能なレポートを送信します。グループチャットでは、承認プロンプトとレポートは owner に非公開で送信されます。アクティブなセッションが OpenAI Codex ハーネスを使用している場合、同じ承認で関連する Codex フィードバックも OpenAI サーバーに送信され、完了した返信には OpenClaw セッション id、Codex スレッド id、`codex resume <thread-id>` コマンドが一覧表示されます。[Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。
    - `/crestodian <request>` は owner DM から Crestodian セットアップおよび修復ヘルパーを実行します。
    - `/tasks` は現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
    - `/context [list|detail|json]` はコンテキストがどのように組み立てられるかを説明します。
    - `/whoami` は送信者 id を表示します。エイリアス: `/id`。
    - `/usage off|tokens|full|cost` は応答ごとの使用量フッターを制御するか、ローカルコスト概要を出力します。

  </Accordion>
  <Accordion title="Skills、許可リスト、承認">
    - `/skill <name> [input]` は名前で skill を実行します。
    - `/allowlist [list|add|remove] ...` は許可リストエントリを管理します。テキストのみ。
    - `/approve <id> <decision>` は exec 承認プロンプトを解決します。
    - `/btw <question>` は将来のセッションコンテキストを変更せずに補足質問をします。[BTW](/ja-JP/tools/btw) を参照してください。

  </Accordion>
  <Accordion title="サブエージェントと ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` は現在のセッションのサブエージェント実行を管理します。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は ACP セッションとランタイムオプションを管理します。
    - `/focus <target>` は現在の Discord スレッドまたは Telegram トピック/会話をセッションターゲットにバインドします。
    - `/unfocus` は現在のバインディングを削除します。
    - `/agents` は現在のセッションのスレッドバインド済みエージェントを一覧表示します。
    - `/kill <id|#|all>` は実行中のサブエージェントの 1 つまたはすべてを中止します。
    - `/steer <id|#> <message>` は実行中のサブエージェントに steering を送信します。エイリアス: `/tell`。

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` は `openclaw.json` を読み取りまたは書き込みます。所有者専用です。`commands.config: true` が必要です。
    - `/mcp show|get|set|unset` は、`mcp.servers` 配下にある OpenClaw 管理の MCP サーバー設定を読み取りまたは書き込みます。所有者専用です。`commands.mcp: true` が必要です。
    - `/plugins list|inspect|show|get|install|enable|disable` は Plugin の状態を検査または変更します。`/plugin` はエイリアスです。書き込みは所有者専用です。`commands.plugins: true` が必要です。
    - `/debug show|set|unset|reset` は実行時専用の設定オーバーライドを管理します。所有者専用です。`commands.debug: true` が必要です。
    - `/restart` は、有効な場合に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定します。
    - `/send on|off|inherit` は送信ポリシーを設定します。所有者専用です。

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` は TTS を制御します。[TTS](/ja-JP/tools/tts) を参照してください。
    - `/activation mention|always` はグループのアクティベーションモードを設定します。
    - `/bash <command>` はホストのシェルコマンドを実行します。テキストのみです。エイリアス: `! <command>`。`commands.bash: true` と `tools.elevated` の許可リストが必要です。
    - `!poll [sessionId]` はバックグラウンドの bash ジョブを確認します。
    - `!stop [sessionId]` はバックグラウンドの bash ジョブを停止します。

  </Accordion>
</AccordionGroup>

### 生成されたドックコマンド

ドックコマンドは、現在のセッションの返信ルートを別のリンク済み
チャネルに切り替えます。セットアップ、例、トラブルシューティングについては、[チャネルドッキング](/ja-JP/concepts/channel-docking) を参照してください。

ドックコマンドは、ネイティブコマンド対応のチャネル Plugin から生成されます。現在バンドルされているセット:

- `/dock-discord` (エイリアス: `/dock_discord`)
- `/dock-mattermost` (エイリアス: `/dock_mattermost`)
- `/dock-slack` (エイリアス: `/dock_slack`)
- `/dock-telegram` (エイリアス: `/dock_telegram`)

現在のセッションの返信ルートを別のリンク済みチャネルへ切り替えるには、ダイレクトチャットからドックコマンドを使います。エージェントは同じセッションコンテキストを保持しますが、そのセッションの今後の返信は選択したチャネルピアに配信されます。

ドックコマンドには `session.identityLinks` が必要です。送信元送信者とターゲットピアは、たとえば `["telegram:123", "discord:456"]` のように同じ ID グループに属している必要があります。ID `123` の Telegram ユーザーが `/dock_discord` を送信すると、OpenClaw はアクティブなセッションに `lastChannel: "discord"` と `lastTo: "456"` を保存します。送信者が Discord ピアにリンクされていない場合、このコマンドは通常のチャットにフォールスルーせず、セットアップのヒントを返信します。

ドッキングはアクティブなセッションルートだけを変更します。チャネルアカウントの作成、アクセス権の付与、チャネル許可リストの迂回、トランスクリプト履歴の別セッションへの移動は行いません。ルートを再度切り替えるには、`/dock-telegram`、`/dock-slack`、`/dock-mattermost`、または別の生成されたドックコマンドを使います。

### バンドル済み Plugin コマンド

バンドル済み Plugin は、さらにスラッシュコマンドを追加できます。このリポジトリで現在バンドルされているコマンド:

- `/dreaming [on|off|status|help]` はメモリ Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` はデバイスのペアリング/セットアップフローを管理します。[ペアリング](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` は、高リスクな電話ノードコマンドを一時的に許可状態にします。
- `/voice status|list [limit]|set <voiceId|name>` は Talk 音声設定を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE リッチカードのプリセットを送信します。[LINE](/ja-JP/channels/line) を参照してください。
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` は、バンドル済みの Codex アプリサーバーハーネスを検査および制御します。[Codex ハーネス](/ja-JP/plugins/codex-harness) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的な skill コマンド

ユーザーが呼び出せる skills もスラッシュコマンドとして公開されます:

- `/skill <name> [input]` は汎用エントリポイントとして常に動作します。
- skill/Plugin が登録している場合、skills は `/prose` のような直接コマンドとしても表示されることがあります。
- ネイティブ skill コマンドの登録は、`commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` で制御されます。
- コマンド仕様は、Discord を含むローカライズされた説明に対応するネイティブサーフェス向けに `descriptionLocalizations` を提供できます。

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - コマンドでは、コマンドと引数の間に任意で `:` を置けます (例: `/think: high`、`/send: on`、`/help:`)。
    - `/new <model>` は、モデルエイリアス、`provider/model`、またはプロバイダー名 (あいまい一致) を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - プロバイダー使用量の完全な内訳を見るには、`openclaw status --usage` を使います。
    - `/allowlist add|remove` には `commands.config=true` が必要で、チャネルの `configWrites` に従います。
    - 複数アカウントのチャネルでは、設定対象を指定する `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も、対象アカウントの `configWrites` に従います。
    - `/usage` はレスポンスごとの使用量フッターを制御します。`/usage cost` は OpenClaw セッションログからローカルのコスト概要を出力します。
    - `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定します。
    - `/plugins install <spec>` は、`openclaw plugins install` と同じ Plugin 仕様を受け付けます: ローカルパス/アーカイブ、npm パッケージ、`git:<repo>`、または `clawhub:<pkg>`。
    - `/plugins enable|disable` は Plugin 設定を更新し、再起動を促す場合があります。

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - Discord 専用ネイティブコマンド: `/vc join|leave|status` は音声チャネルを制御します (テキストとしては利用できません)。`join` にはギルドと、選択済みの音声/ステージチャネルが必要です。`channels.discord.voice` とネイティブコマンドが必要です。
    - Discord のスレッドバインディングコマンド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`) には、有効なスレッドバインディングが有効化されている必要があります (`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`)。
    - ACP コマンドリファレンスと実行時の動作: [ACP エージェント](/ja-JP/tools/acp-agents)。

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` はデバッグと追加の可視性のためのものです。通常使用では **off** のままにしてください。
    - `/trace` は `/verbose` より範囲が狭く、Plugin 所有のトレース/デバッグ行だけを表示し、通常の詳細なツール出力はオフのままにします。
    - `/fast on|off` はセッションのオーバーライドを永続化します。これをクリアして設定デフォルトへ戻すには、セッション UI の `inherit` オプションを使います。
    - `/fast` はプロバイダー固有です。OpenAI/OpenAI Codex ではネイティブ Responses エンドポイント上の `service_tier=priority` にマップされます。一方、OAuth 認証済みで `api.anthropic.com` に送信されるトラフィックを含む直接の公開 Anthropic リクエストでは、`service_tier=auto` または `standard_only` にマップされます。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
    - ツール失敗の要約は関連がある場合に引き続き表示されますが、詳細な失敗テキストは `/verbose` が `on` または `full` の場合にのみ含まれます。
    - `/reasoning`、`/verbose`、`/trace` はグループ設定ではリスクがあります。公開する意図のない内部推論、ツール出力、または Plugin 診断情報が表示される可能性があります。特にグループチャットでは、オフのままにすることを推奨します。

  </Accordion>
  <Accordion title="Model switching">
    - `/model` は新しいセッションモデルを即座に永続化します。
    - エージェントがアイドル状態の場合、次の実行ですぐに使われます。
    - 実行がすでにアクティブな場合、OpenClaw はライブ切り替えを保留中としてマークし、クリーンな再試行ポイントでのみ新しいモデルに再起動します。
    - ツールアクティビティまたは返信出力がすでに開始している場合、保留中の切り替えは後続の再試行機会または次のユーザーターンまでキューに残ることがあります。
    - ローカル TUI では、`/crestodian [request]` は通常のエージェント TUI から Crestodian に戻ります。これはメッセージチャネルのレスキューモードとは別であり、リモート設定権限を付与しません。

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **高速パス:** 許可リスト済み送信者からのコマンドのみのメッセージは即座に処理されます (キュー + モデルを迂回)。
    - **グループメンションゲート:** 許可リスト済み送信者からのコマンドのみのメッセージは、メンション要件を迂回します。
    - **インラインショートカット (許可リスト済み送信者のみ):** 一部のコマンドは通常のメッセージ内に埋め込まれていても動作し、モデルが残りのテキストを見る前に取り除かれます。
      - 例: `hey /status` はステータス返信をトリガーし、残りのテキストは通常のフローを継続します。
    - 現在: `/help`、`/commands`、`/status`、`/whoami` (`/id`)。
    - 権限のないコマンドのみのメッセージは黙って無視され、インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **Skill コマンド:** `user-invocable` skills はスラッシュコマンドとして公開されます。名前は `a-z0-9_` にサニタイズされます (最大 32 文字)。衝突した場合は数値サフィックスが付きます (例: `_2`)。
      - `/skill <name> [input]` は名前で skill を実行します (ネイティブコマンドの制限により skill ごとのコマンドを作れない場合に便利です)。
      - デフォルトでは、skill コマンドは通常のリクエストとしてモデルに転送されます。
      - Skills は任意で `command-dispatch: tool` を宣言し、コマンドを直接ツールへルーティングできます (決定的で、モデルを使いません)。
      - 例: `/prose` (OpenProse Plugin) — [OpenProse](/ja-JP/prose) を参照してください。
    - **ネイティブコマンド引数:** Discord は動的オプションにオートコンプリートを使います (必須引数を省略した場合はボタンメニューも使います)。Telegram と Slack は、コマンドが選択肢に対応していて引数を省略した場合にボタンメニューを表示します。動的な選択肢はターゲットセッションモデルに対して解決されるため、`/think` レベルのようなモデル固有のオプションは、そのセッションの `/model` オーバーライドに従います。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` は設定に関する質問ではなく、実行時の質問に答えます: **このエージェントが今この会話で使えるもの**。

- デフォルトの `/tools` はコンパクトで、すばやく確認できるよう最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数に対応するネイティブコマンドサーフェスは、`compact|verbose` と同じモード切り替えを公開します。
- 結果はセッションスコープのため、エージェント、チャネル、スレッド、送信者の認可、またはモデルを変更すると出力が変わることがあります。
- `/tools` には、コアツール、接続済み Plugin ツール、チャネル所有のツールなど、実行時に実際に到達可能なツールが含まれます。

プロファイルとオーバーライドの編集には、`/tools` を静的カタログとして扱うのではなく、Control UI の Tools パネルまたは設定/カタログサーフェスを使います。

## 使用量サーフェス (どこに何が表示されるか)

- **プロバイダー使用量/クォータ** (例: 「Claude 80% left」) は、使用量追跡が有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。OpenClaw はプロバイダーのウィンドウを `% left` に正規化します。MiniMax では、残量のみのパーセントフィールドは表示前に反転され、`model_remains` レスポンスではチャットモデルのエントリとモデルタグ付きのプランラベルが優先されます。
- **トークン/キャッシュ行** は、ライブセッションスナップショットが疎な場合、最新のトランスクリプト使用量エントリへフォールバックできます。既存の非ゼロのライブ値は引き続き優先され、保存された合計が欠落しているか小さい場合、トランスクリプトフォールバックはアクティブなランタイムモデルラベルに加えて、より大きなプロンプト指向の合計も復元できます。
- **実行環境とランタイム:** `/status` は、有効なサンドボックスパスを `Execution` として報告し、実際にセッションを実行している主体を `Runtime` として報告します: `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンド。
- **レスポンスごとのトークン/コスト** は `/usage off|tokens|full` で制御されます (通常の返信に追加されます)。
- `/model status` は **モデル/認証/エンドポイント** に関するもので、使用量ではありません。

## モデル選択 (`/model`)

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

注記:

- `/model` と `/model list` は、コンパクトな番号付きピッカー（モデルファミリー + 利用可能なプロバイダー）を表示します。
- Discord では、`/model` と `/models` がプロバイダーとモデルのドロップダウンに加えて Submit ステップを含むインタラクティブなピッカーを開きます。
- `/model <#>` はそのピッカーから選択します（可能な場合は現在のプロバイダーを優先します）。
- `/model status` は、利用可能な場合は設定済みプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）を含む詳細ビューを表示します。

## デバッグ上書き

`/debug` では、**実行時のみ**の設定上書き（メモリ上、ディスクではない）を設定できます。所有者のみ。デフォルトでは無効です。`commands.debug: true` で有効にします。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
上書きは新しい設定読み取りに即座に適用されますが、`openclaw.json` には**書き込みません**。すべての上書きをクリアしてディスク上の設定に戻すには、`/debug reset` を使用します。
</Note>

## Pluginトレース出力

`/trace` では、完全な詳細モードを有効にせずに、**セッションスコープのPluginトレース/デバッグ行**を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注:

- 引数なしの `/trace` は、現在のセッショントレース状態を表示します。
- `/trace on` は、現在のセッションでPluginトレース行を有効にします。
- `/trace off` は、それらを再び無効にします。
- Pluginトレース行は `/status` に表示されることがあり、通常のアシスタント返信の後にフォローアップの診断メッセージとして表示されることもあります。
- `/trace` は `/debug` を置き換えません。`/debug` は引き続き実行時のみの設定上書きを管理します。
- `/trace` は `/verbose` を置き換えません。通常の詳細なツール/ステータス出力は引き続き `/verbose` に属します。

## 設定の更新

`/config` はディスク上の設定（`openclaw.json`）に書き込みます。所有者のみ。デフォルトでは無効です。`commands.config: true` で有効にします。

例:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
設定は書き込み前に検証されます。無効な変更は拒否されます。`/config` の更新は再起動後も保持されます。
</Note>

## MCPの更新

`/mcp` は、OpenClaw 管理の MCP サーバー定義を `mcp.servers` の下に書き込みます。所有者のみ。デフォルトでは無効です。`commands.mcp: true` で有効にします。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` は設定を Pi 所有のプロジェクト設定ではなく、OpenClaw 設定に保存します。実行時アダプターは、どのトランスポートが実際に実行可能かを決定します。
</Note>

## Pluginの更新

`/plugins` では、オペレーターが検出済みPluginを確認し、設定内で有効化を切り替えられます。読み取り専用フローでは、`/plugin` をエイリアスとして使用できます。デフォルトでは無効です。`commands.plugins: true` で有効にします。

例:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` と `/plugins show` は、現在のワークスペースとディスク上の設定に対して実際のPlugin検出を使用します。
- `/plugins enable|disable` はPlugin設定のみを更新します。Pluginのインストールやアンインストールは行いません。
- 有効化/無効化の変更後、それらを適用するには gateway を再起動します。

</Note>

## サーフェスの注記

<AccordionGroup>
  <Accordion title="サーフェスごとのセッション">
    - **テキストコマンド**は通常のチャットセッションで実行されます（DM は `main` を共有し、グループは独自のセッションを持ちます）。
    - **ネイティブコマンド**は分離されたセッションを使用します:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
      - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` を介してチャットセッションを対象にします）
    - **`/stop`** はアクティブなチャットセッションを対象にするため、現在の実行を中止できます。

  </Accordion>
  <Accordion title="Slack 固有事項">
    `channels.slack.slashCommand` は、単一の `/openclaw` スタイルのコマンド向けに引き続きサポートされています。`commands.native` を有効にする場合は、組み込みコマンドごとに Slack スラッシュコマンドを1つ作成する必要があります（名前は `/help` と同じ）。Slack 向けのコマンド引数メニューは、一時的な Block Kit ボタンとして配信されます。

    Slack ネイティブ例外: Slack が `/status` を予約しているため、`/agentstatus`（`/status` ではなく）を登録してください。テキストの `/status` は Slack メッセージ内で引き続き機能します。

  </Accordion>
</AccordionGroup>

## BTWの補足質問

`/btw` は、現在のセッションについての素早い**補足質問**です。

通常のチャットとは異なり:

- 現在のセッションを背景コンテキストとして使用します。
- 別個の**ツールなし**のワンショット呼び出しとして実行されます。
- 将来のセッションコンテキストを変更しません。
- トランスクリプト履歴に書き込まれません。
- 通常のアシスタントメッセージではなく、ライブの補足結果として配信されます。

これにより、メインタスクを継続しながら一時的な確認をしたい場合に `/btw` が役立ちます。

例:

```text
/btw what are we doing right now?
```

完全な動作とクライアント UX の詳細については、[BTW補足質問](/ja-JP/tools/btw) を参照してください。

## 関連

- [Skillsの作成](/ja-JP/tools/creating-skills)
- [Skills](/ja-JP/tools/skills)
- [Skills設定](/ja-JP/tools/skills-config)
