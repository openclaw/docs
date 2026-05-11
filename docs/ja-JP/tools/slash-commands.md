---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
sidebarTitle: Slash commands
summary: 'スラッシュコマンド: テキスト方式とネイティブ方式、設定、サポートされているコマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-05-11T20:39:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a9030d88abd04c395369f8f6587632b53f3249ea95a26726fb1f165dae2d0f6
    source_path: tools/slash-commands.md
    workflow: 16
---

コマンドは Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる**単独の**メッセージとして送信する必要があります。ホスト専用の bash チャットコマンドは `! <cmd>` を使用します（`/bash <cmd>` はエイリアスです）。

会話またはスレッドが ACP セッションにバインドされている場合、通常のフォローアップテキストはその ACP ハーネスにルーティングされます。Gateway 管理コマンドは引き続きローカルに留まります。`/acp ...` は常に OpenClaw ACP コマンドハンドラーに届き、サーフェスでコマンド処理が有効な場合、`/status` と `/unfocus` はローカルに留まります。

関連するシステムは2つあります。

<AccordionGroup>
  <Accordion title="コマンド">
    単独の `/...` メッセージ。
  </Accordion>
  <Accordion title="ディレクティブ">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - ディレクティブは、モデルに表示される前にメッセージから取り除かれます。
    - 通常のチャットメッセージ（ディレクティブのみではないメッセージ）では、「インラインヒント」として扱われ、セッション設定としては**永続化されません**。
    - ディレクティブのみのメッセージ（メッセージにディレクティブだけが含まれる場合）では、セッションに永続化され、確認応答が返されます。
    - ディレクティブは**承認済み送信者**にのみ適用されます。`commands.allowFrom` が設定されている場合は、それだけが使用される許可リストです。それ以外の場合、承認はチャンネルの許可リスト/ペアリングと `commands.useAccessGroups` から取得されます。未承認の送信者には、ディレクティブはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="インラインショートカット">
    許可リストに含まれる/承認済みの送信者のみ: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。

    これらは即座に実行され、モデルに表示される前に取り除かれ、残りのテキストは通常のフローを通過します。

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
  ネイティブコマンドを登録します。自動: Discord/Telegram ではオン、Slack ではオフ（スラッシュコマンドを追加するまで）、ネイティブサポートのないプロバイダーでは無視されます。プロバイダーごとに上書きするには、`channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（ブール値または `"auto"`）。Discord では、`false` にすると起動時のスラッシュコマンド登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで表示されたままになる場合があります。Slack コマンドは Slack アプリで管理され、自動的には削除されません。
</ParamField>
Discord では、ネイティブコマンド仕様に `descriptionLocalizations` を含めることができます。OpenClaw はこれを Discord の `description_localizations` として公開し、照合比較に含めます。
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  サポートされている場合、**skill** コマンドをネイティブに登録します。自動: Discord/Telegram ではオン、Slack ではオフ（Slack では skill ごとにスラッシュコマンドを作成する必要があります）。プロバイダーごとに上書きするには、`channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（ブール値または `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` によるホストシェルコマンドの実行を有効にします（`/bash <cmd>` はエイリアスです。`tools.elevated` の許可リストが必要です）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  バックグラウンドモードに切り替えるまで bash が待機する時間を制御します（`0` は即座にバックグラウンド化します）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` を読み書きします）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定を読み書きします）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（plugin の検出/ステータスに加えて、インストールと有効化/無効化の制御）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（ランタイムのみの上書き）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と Gateway 再起動ツールアクションを有効にします。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  オーナー専用コマンド/ツールサーフェスの明示的なオーナー許可リストを設定します。これは危険なアクションを承認し、`/diagnostics`、`/export-trajectory`、`/config` などのコマンドを実行できる人間のオペレーターアカウントです。これは `commands.allowFrom` および DM ペアリングアクセスとは別です。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごと: そのサーフェスでオーナー専用コマンドを実行するには**オーナー ID** を要求します。`true` の場合、送信者は解決済みのオーナー候補（たとえば `commands.ownerAllowFrom` のエントリやプロバイダー固有のオーナーメタデータ）に一致するか、内部メッセージチャンネルで内部 `operator.admin` スコープを保持している必要があります。チャンネル `allowFrom` のワイルドカードエントリ、または空/未解決のオーナー候補リストだけでは**十分ではありません**。そのチャンネルではオーナー専用コマンドは失敗クローズになります。オーナー専用コマンドを `ownerAllowFrom` と標準のコマンド許可リストだけでゲートしたい場合は、これをオフのままにします。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプト内でオーナー ID がどのように表示されるかを制御します。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay="hash"` の場合に使用する HMAC シークレットを任意で設定します。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  コマンド承認のためのプロバイダーごとの許可リストです。設定されている場合、コマンドとディレクティブの唯一の承認ソースになります（チャンネルの許可リスト/ペアリングと `commands.useAccessGroups` は無視されます）。グローバルデフォルトには `"*"` を使用します。プロバイダー固有のキーはそれを上書きします。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合、コマンドに許可リスト/ポリシーを適用します。
</ParamField>

## コマンド一覧

現在の信頼できる情報源:

- コア組み込みは `src/auto-reply/commands-registry.shared.ts` から取得されます
- 生成された dock コマンドは `src/auto-reply/commands-registry.data.ts` から取得されます
- plugin コマンドは plugin の `registerCommand()` 呼び出しから取得されます
- Gateway での実際の可用性は、引き続き設定フラグ、チャンネルサーフェス、インストール済み/有効化済みの plugins に依存します

### コア組み込みコマンド

<AccordionGroup>
  <Accordion title="セッションと実行">
    - `/new [model]` は新しいセッションを開始します。`/reset` はリセットのエイリアスです。
    - Control UI は、入力された `/new` をインターセプトして新しいダッシュボードセッションを作成して切り替えます。ただし、`session.dmScope: "main"` が設定され、現在の親がエージェントのメインセッションである場合を除きます。その場合、`/new` はメインセッションをその場でリセットします。入力された `/reset` は引き続き Gateway のインプレースリセットを実行します。
    - `/reset soft [message]` は現在のトランスクリプトを保持し、再利用された CLI バックエンドセッション ID を破棄し、起動/システムプロンプト読み込みをその場で再実行します。
    - `/compact [instructions]` はセッションコンテキストを圧縮します。[Compaction](/ja-JP/concepts/compaction) を参照してください。
    - `/stop` は現在の実行を中止します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` はスレッドバインディングの有効期限を管理します。
    - `/export-session [path]` は現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
    - `/export-trajectory [path]` は exec 承認を要求し、その後、現在のセッションの JSONL [trajectory バンドル](/ja-JP/tools/trajectory) をエクスポートします。1つの OpenClaw セッションについてプロンプト、ツール、トランスクリプトのタイムラインが必要な場合に使用します。グループチャットでは、承認プロンプトとエクスポート結果はオーナーに非公開で送信されます。エイリアス: `/trajectory`。

  </Accordion>
  <Accordion title="モデルと実行の制御">
    - `/think <level|default>` は思考レベルを設定するか、セッションの上書きをクリアします。オプションはアクティブなモデルのプロバイダープロファイルから取得されます。一般的なレベルは `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max`、またはバイナリの `on` などのカスタムレベルは、サポートされている場合にのみ使用できます。エイリアス: `/thinking`, `/t`。
    - `/verbose on|off|full` は詳細出力を切り替えます。エイリアス: `/v`。
    - `/trace on|off` は現在のセッションの plugin トレース出力を切り替えます。
    - `/fast [status|on|off|default]` は高速モードを表示、設定、またはクリアします。
    - `/reasoning [on|off|stream]` は reasoning の表示を切り替えます。エイリアス: `/reason`。
    - `/elevated [on|off|ask|full]` は elevated モードを切り替えます。エイリアス: `/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec のデフォルトを表示または設定します。
    - `/model [name|#|status]` はモデルを表示または設定します。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` は、設定済み/認証利用可能なプロバイダー、またはプロバイダーのモデルを一覧表示します。`all` を追加すると、そのプロバイダーの全カタログを参照できます。`agents.defaults.models` の `provider/*` エントリにより、`/model` と `/models` はそれらのプロバイダーで検出されたモデルだけを表示します。
    - `/queue <mode>` はキュー動作（`steer`、レガシー `queue`、`followup`、`collect`、`steer-backlog`、`interrupt`）に加え、`debounce:0.5s cap:25 drop:summarize` のようなオプションを管理します。`/queue default` または `/queue reset` はセッションの上書きをクリアします。[コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。
    - `/steer <message>` は、`/queue` モードとは独立して、現在のセッションのアクティブな実行にガイダンスを注入します。セッションがアイドル状態の場合、新しい実行は開始しません。エイリアス: `/tell`。[Steer](/ja-JP/tools/steer) を参照してください。

  </Accordion>
  <Accordion title="検出とステータス">
    - `/help` は短いヘルプ要約を表示します。
    - `/commands` は生成されたコマンドカタログを表示します。
    - `/tools [compact|verbose]` は現在のエージェントが今使用できるものを表示します。
    - `/status` は実行/ランタイムステータス、Gateway とシステムの稼働時間、利用可能な場合はプロバイダーの使用量/クォータを表示します。
    - `/diagnostics [note]` は Gateway のバグと Codex ハーネス実行のためのオーナー専用サポートレポートフローです。`openclaw gateway diagnostics export --json` を実行する前に、毎回明示的な exec 承認を求めます。すべて許可するルールで診断を承認しないでください。承認後、ローカルバンドルパス、マニフェスト要約、プライバシーメモ、関連するセッション ID を含む貼り付け可能なレポートを送信します。グループチャットでは、承認プロンプトとレポートはオーナーに非公開で送信されます。アクティブなセッションが OpenAI Codex ハーネスを使用している場合、同じ承認により関連する Codex フィードバックも OpenAI サーバーに送信され、完了した返信には OpenClaw セッション ID、Codex スレッド ID、`codex resume <thread-id>` コマンドが一覧表示されます。[Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。
    - `/crestodian <request>` は、オーナー DM から Crestodian セットアップおよび修復ヘルパーを実行します。
    - `/tasks` は現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
    - `/context [list|detail|map|json]` はコンテキストがどのように組み立てられるかを説明します。`map` は現在のセッションコンテキストのツリーマップ画像を送信します。
    - `/whoami` は送信者 ID を表示します。エイリアス: `/id`。
    - `/usage off|tokens|full|cost` は応答ごとの使用量フッターを制御するか、ローカルのコスト要約を出力します。

  </Accordion>
  <Accordion title="Skills、許可リスト、承認">
    - `/skill <name> [input]` は名前でSkillを実行します。
    - `/allowlist [list|add|remove] ...` は許可リストのエントリを管理します。テキストのみ。
    - `/approve <id> <decision>` はexec承認プロンプトを解決します。
    - `/btw <question>` は今後のセッションコンテキストを変更せずに補足質問をします。エイリアス: `/side`。[BTW](/ja-JP/tools/btw)を参照してください。

  </Accordion>
  <Accordion title="サブエージェントとACP">
    - `/subagents list|kill|log|info|send|steer|spawn` は現在のセッションのサブエージェント実行を管理します。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` はACPセッションとランタイムオプションを管理します。
    - `/focus <target>` は現在のDiscordスレッドまたはTelegramトピック/会話をセッションターゲットにバインドします。
    - `/unfocus` は現在のバインドを削除します。
    - `/agents` は現在のセッションでスレッドにバインドされたエージェントを一覧表示します。
    - `/kill <id|#|all>` は実行中のサブエージェント1つまたはすべてを中止します。
    - `/subagents steer <id|#> <message>` は実行中のサブエージェントに誘導を送信します。[Steer](/ja-JP/tools/steer)を参照してください。

  </Accordion>
  <Accordion title="オーナー専用の書き込みと管理">
    - `/config show|get|set|unset` は`openclaw.json`を読み取りまたは書き込みます。オーナー専用。`commands.config: true`が必要です。
    - `/mcp show|get|set|unset` は`mcp.servers`配下のOpenClaw管理MCPサーバー設定を読み取りまたは書き込みます。オーナー専用。`commands.mcp: true`が必要です。
    - `/plugins list|inspect|show|get|install|enable|disable` はPluginの状態を検査または変更します。`/plugin`はエイリアスです。書き込みはオーナー専用。`commands.plugins: true`が必要です。
    - `/debug show|set|unset|reset` はランタイム専用の設定オーバーライドを管理します。オーナー専用。`commands.debug: true`が必要です。
    - `/restart` は有効な場合にOpenClawを再起動します。デフォルト: 有効。無効にするには`commands.restart: false`を設定します。
    - `/send on|off|inherit` は送信ポリシーを設定します。オーナー専用。

  </Accordion>
  <Accordion title="音声、TTS、チャンネル制御">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` はTTSを制御します。[TTS](/ja-JP/tools/tts)を参照してください。
    - `/activation mention|always` はグループのアクティベーションモードを設定します。
    - `/bash <command>` はホストのシェルコマンドを実行します。テキストのみ。エイリアス: `! <command>`。`commands.bash: true`に加えて`tools.elevated`許可リストが必要です。
    - `!poll [sessionId]` はバックグラウンドbashジョブを確認します。
    - `!stop [sessionId]` はバックグラウンドbashジョブを停止します。

  </Accordion>
</AccordionGroup>

### 生成されたドックコマンド

ドックコマンドは、現在のセッションの返信ルートを別のリンク済みチャンネルへ切り替えます。設定、例、トラブルシューティングについては、[チャンネルドッキング](/ja-JP/concepts/channel-docking)を参照してください。

ドックコマンドは、ネイティブコマンド対応のチャンネルPluginから生成されます。現在バンドルされているセット:

- `/dock-discord` (エイリアス: `/dock_discord`)
- `/dock-mattermost` (エイリアス: `/dock_mattermost`)
- `/dock-slack` (エイリアス: `/dock_slack`)
- `/dock-telegram` (エイリアス: `/dock_telegram`)

ダイレクトチャットからドックコマンドを使うと、現在のセッションの返信ルートを別のリンク済みチャンネルへ切り替えられます。エージェントは同じセッションコンテキストを保持しますが、そのセッションの今後の返信は選択したチャンネルピアへ配信されます。

ドックコマンドには`session.identityLinks`が必要です。送信元の送信者とターゲットピアは同じIDグループに含まれている必要があります。例: `["telegram:123", "discord:456"]`。IDが`123`のTelegramユーザーが`/dock_discord`を送信した場合、OpenClawはアクティブなセッションに`lastChannel: "discord"`と`lastTo: "456"`を保存します。送信者がDiscordピアにリンクされていない場合、コマンドは通常のチャットにフォールスルーせず、設定ヒントを返信します。

ドッキングはアクティブなセッションルートだけを変更します。チャンネルアカウントを作成したり、アクセスを付与したり、チャンネル許可リストを回避したり、トランスクリプト履歴を別のセッションへ移動したりはしません。ルートを再度切り替えるには、`/dock-telegram`、`/dock-slack`、`/dock-mattermost`、または別の生成済みドックコマンドを使用します。

### バンドル済みPluginコマンド

バンドル済みPluginは、さらにスラッシュコマンドを追加できます。このリポジトリで現在バンドルされているコマンド:

- `/dreaming [on|off|status|help]` はメモリDreamingを切り替えます。[Dreaming](/ja-JP/concepts/dreaming)を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` はデバイスのペアリング/設定フローを管理します。[ペアリング](/ja-JP/channels/pairing)を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` はリスクの高い電話ノードコマンドを一時的に有効化します。
- `/voice status|list [limit]|set <voiceId|name>` はTalkの音声設定を管理します。Discordでは、ネイティブコマンド名は`/talkvoice`です。
- `/card ...` はLINEリッチカードプリセットを送信します。[LINE](/ja-JP/channels/line)を参照してください。
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` はバンドル済みCodexアプリサーバーハーネスを検査および制御します。[Codexハーネス](/ja-JP/plugins/codex-harness)を参照してください。
- QQBot専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的Skillコマンド

ユーザーが呼び出せるSkillsはスラッシュコマンドとしても公開されます。

- `/skill <name> [input]` は常に汎用エントリポイントとして機能します。
- Skill/Pluginが登録している場合、Skillsは`/prose`のような直接コマンドとしても表示されることがあります。
- ネイティブSkillコマンド登録は`commands.nativeSkills`と`channels.<provider>.commands.nativeSkills`で制御されます。
- コマンド仕様は、Discordを含むローカライズ済み説明をサポートするネイティブサーフェス向けに`descriptionLocalizations`を提供できます。

<AccordionGroup>
  <Accordion title="引数とパーサーの注意事項">
    - コマンドでは、コマンドと引数の間に任意で`:`を入れられます (例: `/think: high`、`/send: on`、`/help:`)。
    - `/new <model>` はモデルエイリアス、`provider/model`、またはプロバイダー名 (あいまい一致) を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - プロバイダー使用量の完全な内訳を見るには、`openclaw status --usage`を使用します。
    - `/allowlist add|remove` には`commands.config=true`が必要で、チャンネルの`configWrites`を尊重します。
    - 複数アカウントのチャンネルでは、設定対象の`/allowlist --account <id>`と`/config set channels.<provider>.accounts.<id>...`も、対象アカウントの`configWrites`を尊重します。
    - `/usage` はレスポンスごとの使用量フッターを制御します。`/usage cost` はOpenClawセッションログからローカルのコスト概要を出力します。
    - `/restart` はデフォルトで有効です。無効にするには`commands.restart: false`を設定します。
    - `/plugins install <spec>` は`openclaw plugins install`と同じPlugin仕様を受け付けます。ローカルパス/アーカイブ、npmパッケージ、`git:<repo>`、または`clawhub:<pkg>`です。その後、Pluginソースモジュールが変更されたため、Gatewayの再起動を要求します。
    - `/plugins enable|disable` はPlugin設定を更新し、新しいエージェントターンのためにGatewayのPlugin再読み込みをトリガーします。

  </Accordion>
  <Accordion title="チャンネル固有の動作">
    - Discord専用ネイティブコマンド: `/vc join|leave|status` はボイスチャンネルを制御します (テキストとしては利用できません)。`join`にはギルドと選択済みのボイス/ステージチャンネルが必要です。`channels.discord.voice`とネイティブコマンドが必要です。
    - Discordのスレッドバインドコマンド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`) には、有効なスレッドバインドが有効になっている必要があります (`session.threadBindings.enabled`および/または`channels.discord.threadBindings.enabled`)。
    - ACPコマンドリファレンスとランタイム動作: [ACPエージェント](/ja-JP/tools/acp-agents)。

  </Accordion>
  <Accordion title="詳細 / trace / fast / reasoningの安全性">
    - `/verbose` はデバッグと追加の可視性を目的としています。通常の使用では**オフ**のままにしてください。
    - `/trace` は`/verbose`より範囲が狭く、Plugin所有のtrace/debug行だけを表示し、通常の詳細なツール雑談はオフのままにします。
    - `/fast on|off` はセッションオーバーライドを永続化します。これをクリアして設定デフォルトへ戻すには、Sessions UIの`inherit`オプションを使用します。
    - `/fast` はプロバイダー固有です。OpenAI/OpenAI Codexでは、ネイティブResponsesエンドポイントで`service_tier=priority`にマッピングされます。一方、`api.anthropic.com`へ送信されるOAuth認証済みトラフィックを含む直接の公開Anthropicリクエストでは、`service_tier=auto`または`standard_only`にマッピングされます。[OpenAI](/ja-JP/providers/openai)と[Anthropic](/ja-JP/providers/anthropic)を参照してください。
    - ツール失敗の概要は関連がある場合には引き続き表示されますが、詳細な失敗テキストは`/verbose`が`on`または`full`の場合にのみ含まれます。
    - `/reasoning`、`/verbose`、`/trace` はグループ設定ではリスクがあります。公開するつもりのなかった内部reasoning、ツール出力、Plugin診断を明らかにする可能性があります。特にグループチャットでは、オフのままにすることを推奨します。

  </Accordion>
  <Accordion title="モデル切り替え">
    - `/model` は新しいセッションモデルを即座に永続化します。
    - エージェントがアイドル状態の場合、次の実行ですぐに使用されます。
    - 実行がすでにアクティブな場合、OpenClawはライブ切り替えを保留中としてマークし、クリーンな再試行ポイントでのみ新しいモデルに再起動します。
    - ツールアクティビティまたは返信出力がすでに開始している場合、保留中の切り替えは後の再試行機会または次のユーザーターンまでキューに残ることがあります。
    - ローカルTUIでは、`/crestodian [request]` は通常のエージェントTUIからCrestodianへ戻ります。これはメッセージチャンネルのレスキューモードとは別であり、リモート設定権限を付与しません。

  </Accordion>
  <Accordion title="高速パスとインラインショートカット">
    - **高速パス:** 許可リスト登録済み送信者からのコマンドのみのメッセージは即座に処理されます (キュー + モデルをバイパス)。
    - **グループメンションゲーティング:** 許可リスト登録済み送信者からのコマンドのみのメッセージはメンション要件をバイパスします。
    - **インラインショートカット (許可リスト登録済み送信者のみ):** 一部のコマンドは通常のメッセージに埋め込まれている場合にも動作し、モデルが残りのテキストを見る前に取り除かれます。
      - 例: `hey /status` はステータス返信をトリガーし、残りのテキストは通常のフローを通過します。
    - 現在: `/help`、`/commands`、`/status`、`/whoami` (`/id`)。
    - 権限のないコマンドのみのメッセージは黙って無視され、インラインの`/...`トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="Skillコマンドとネイティブ引数">
    - **Skillコマンド:** `user-invocable` Skillsはスラッシュコマンドとして公開されます。名前は`a-z0-9_`にサニタイズされます (最大32文字)。衝突した場合は数値サフィックスが付きます (例: `_2`)。
      - `/skill <name> [input]` は名前でSkillを実行します (ネイティブコマンド制限によりSkillごとのコマンドを作れない場合に有用です)。
      - デフォルトでは、Skillコマンドは通常のリクエストとしてモデルに転送されます。
      - Skillsは任意で`command-dispatch: tool`を宣言し、コマンドをツールへ直接ルーティングできます (決定的、モデルなし)。
      - 例: `/prose` (OpenProse Plugin) — [OpenProse](/ja-JP/prose)を参照してください。
    - **ネイティブコマンド引数:** Discordは動的オプションにオートコンプリートを使用します (必須引数を省略した場合はボタンメニュー)。TelegramとSlackは、コマンドが選択肢をサポートしていて引数を省略した場合にボタンメニューを表示します。動的な選択肢はターゲットセッションモデルに対して解決されるため、`/think`レベルのようなモデル固有オプションは、そのセッションの`/model`オーバーライドに従います。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` は設定の質問ではなく、ランタイムの質問に答えます: **このエージェントがこの会話で今使えるもの**。

- デフォルトの`/tools`はコンパクトで、素早い確認に最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンドサーフェスは、`compact|verbose`と同じモード切り替えを公開します。
- 結果はセッションスコープであるため、エージェント、チャンネル、スレッド、送信者の権限、またはモデルを変更すると出力が変わることがあります。
- `/tools` には、コアツール、接続済みPluginツール、チャンネル所有ツールなど、ランタイムで実際に到達可能なツールが含まれます。

プロファイルとオーバーライド編集には、`/tools`を静的カタログとして扱うのではなく、Control UIのToolsパネルまたは設定/カタログサーフェスを使用します。

## 使用量サーフェス (どこに何が表示されるか)

- **プロバイダー使用量/クォータ**（例: "Claude 80% left"）は、使用量追跡が有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。OpenClaw はプロバイダーのウィンドウを `% left` に正規化します。MiniMax では、残量のみのパーセントフィールドは表示前に反転され、`model_remains` レスポンスではチャットモデルのエントリとモデルタグ付きのプランラベルが優先されます。
- `/status` の **トークン/キャッシュ行** は、ライブセッションのスナップショットが疎な場合、最新のトランスクリプト使用量エントリにフォールバックできます。既存のゼロでないライブ値が引き続き優先され、トランスクリプトのフォールバックは、保存済みの合計が欠落しているか小さい場合に、アクティブなランタイムモデルラベルと、プロンプト指向のより大きな合計も復元できます。
- **実行とランタイム:** `/status` は、有効なサンドボックスパスを `Execution` として報告し、実際にセッションを実行している主体を `Runtime` として報告します: `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンド。
- **レスポンスごとのトークン/コスト** は `/usage off|tokens|full` によって制御されます（通常の返信に追加されます）。
- `/model status` は **モデル/認証/エンドポイント** に関するもので、使用量ではありません。

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

注:

- `/model` と `/model list` は、コンパクトな番号付きピッカー（モデルファミリー + 利用可能なプロバイダー）を表示します。
- Discord では、`/model` と `/models` により、プロバイダーとモデルのドロップダウン、および送信ステップを備えたインタラクティブなピッカーが開きます。このピッカーは `agents.defaults.models`（`provider/*` エントリを含む）を尊重するため、プロバイダー単位の検出により、ピッカーを Discord の 25 オプションのコンポーネント制限内に保てます。
- `/model <#>` はそのピッカーから選択します（可能な場合は現在のプロバイダーを優先します）。
- `/model status` は詳細ビューを表示し、利用可能な場合は設定済みのプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）も含みます。

## デバッグオーバーライド

`/debug` では、**ランタイムのみ** の設定オーバーライド（メモリ上、ディスクではない）を設定できます。所有者のみ。デフォルトでは無効です。`commands.debug: true` で有効にします。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
オーバーライドは新しい設定読み取りに即座に適用されますが、`openclaw.json` には書き込まれません。すべてのオーバーライドを消去してディスク上の設定に戻すには、`/debug reset` を使用します。
</Note>

## Plugin トレース出力

`/trace` では、完全な詳細モードを有効にせずに、**セッションスコープの Plugin トレース/デバッグ行** を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注:

- 引数なしの `/trace` は、現在のセッショントレース状態を表示します。
- `/trace on` は、現在のセッションで Plugin トレース行を有効にします。
- `/trace off` は、それらを再び無効にします。
- Plugin トレース行は `/status` に表示されることがあり、通常のアシスタント返信後の追加診断メッセージとして表示されることもあります。
- `/trace` は `/debug` を置き換えるものではありません。`/debug` は引き続きランタイムのみの設定オーバーライドを管理します。
- `/trace` は `/verbose` を置き換えるものではありません。通常の詳細なツール/ステータス出力は引き続き `/verbose` に属します。

## 設定更新

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

## MCP 更新

`/mcp` は、OpenClaw 管理の MCP サーバー定義を `mcp.servers` の下に書き込みます。所有者のみ。デフォルトでは無効です。`commands.mcp: true` で有効にします。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` は設定を OpenClaw 設定に保存し、Pi が所有するプロジェクト設定には保存しません。実際に実行可能なトランスポートはランタイムアダプターが決定します。
</Note>

## Plugin 更新

`/plugins` では、オペレーターが検出された Plugin を調べ、設定内で有効化を切り替えられます。読み取り専用フローでは、`/plugin` をエイリアスとして使用できます。デフォルトでは無効です。`commands.plugins: true` で有効にします。

例:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` と `/plugins show` は、現在のワークスペースとディスク上の設定に対して実際の Plugin 検出を使用します。
- `/plugins install` は ClawHub、npm、git、ローカルディレクトリ、およびアーカイブからインストールします。
- `/plugins enable|disable` は Plugin 設定のみを更新します。Plugin のインストールやアンインストールは行いません。
- 有効化と無効化の変更は、新しいエージェントターン向けに Gateway Plugin ランタイムサーフェスをホットリロードします。インストールでは Plugin ソースモジュールが変更されるため、Gateway の再起動を要求します。

</Note>

## サーフェスに関する注記

<AccordionGroup>
  <Accordion title="サーフェスごとのセッション">
    - **テキストコマンド** は通常のチャットセッションで実行されます（DM は `main` を共有し、グループは独自のセッションを持ちます）。
    - **ネイティブコマンド** は分離されたセッションを使用します:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
      - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` を介してチャットセッションを対象にします）
    - **`/stop`** はアクティブなチャットセッションを対象にするため、現在の実行を中止できます。

  </Accordion>
  <Accordion title="Slack 固有事項">
    `channels.slack.slashCommand` は、単一の `/openclaw` 形式のコマンド向けに引き続きサポートされています。`commands.native` を有効にする場合は、組み込みコマンドごとに 1 つの Slack スラッシュコマンド（`/help` と同じ名前）を作成する必要があります。Slack 向けのコマンド引数メニューは、一時的な Block Kit ボタンとして配信されます。

    Slack ネイティブの例外: Slack は `/status` を予約しているため、`/agentstatus`（`/status` ではない）を登録します。テキストの `/status` は Slack メッセージ内で引き続き機能します。

  </Accordion>
</AccordionGroup>

## BTW サイド質問

`/btw` は現在のセッションについての簡単な **サイド質問** です。`/side` はエイリアスです。

通常のチャットとは異なり:

- 現在のセッションを背景コンテキストとして使用します。
- Codex ハーネスセッションでは、現在の Codex 権限とネイティブツールサーフェスを使用して、一時的な Codex サイドスレッドとして実行されます。
- Codex 以外のセッションでは、従来の直接的なワンショットのサイドコール動作を維持します。
- 将来のセッションコンテキストは変更しません。
- トランスクリプト履歴には書き込まれません。
- 通常のアシスタントメッセージではなく、ライブのサイド結果として配信されます。

これにより、メインタスクを進めたまま一時的な確認をしたい場合に `/btw` が役立ちます。

例:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

完全な動作とクライアント UX の詳細については、[BTW サイド質問](/ja-JP/tools/btw) を参照してください。

## 関連

- [Skills の作成](/ja-JP/tools/creating-skills)
- [Skills](/ja-JP/tools/skills)
- [Skills 設定](/ja-JP/tools/skills-config)
