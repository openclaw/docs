---
read_when:
    - チャットコマンドの使用または設定
    - コマンドのルーティングまたは権限のデバッグ
sidebarTitle: Slash commands
summary: 'スラッシュコマンド: テキストとネイティブ、設定、対応コマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-05-10T19:56:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e97154facfa481b0c0d4b595f595d3698ee3e92c0a197794d12d75030a12ecb7
    source_path: tools/slash-commands.md
    workflow: 16
---

Commands は Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる**単独**メッセージとして送信する必要があります。ホスト専用の bash チャットコマンドは `! <cmd>` を使用します（`/bash <cmd>` はエイリアスです）。

会話またはスレッドが ACP セッションにバインドされている場合、通常のフォローアップテキストはその ACP ハーネスにルーティングされます。Gateway 管理コマンドは引き続きローカルに留まります。`/acp ...` は常に OpenClaw ACP コマンドハンドラーに届き、`/status` と `/unfocus` は、そのサーフェスでコマンド処理が有効な場合は常にローカルに留まります。

関連するシステムは 2 つあります。

<AccordionGroup>
  <Accordion title="Commands">
    単独の `/...` メッセージ。
  </Accordion>
  <Accordion title="Directives">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。

    - ディレクティブは、モデルが見る前にメッセージから取り除かれます。
    - 通常のチャットメッセージ（ディレクティブのみではないもの）では、「インラインヒント」として扱われ、セッション設定には**永続化されません**。
    - ディレクティブのみのメッセージ（メッセージにディレクティブだけが含まれるもの）では、セッションに永続化され、確認応答が返されます。
    - ディレクティブは**承認済み送信者**にのみ適用されます。`commands.allowFrom` が設定されている場合、それが使用される唯一の許可リストです。それ以外の場合、認可はチャンネル許可リスト/ペアリングと `commands.useAccessGroups` から取得されます。未承認の送信者には、ディレクティブはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="Inline shortcuts">
    許可リスト入り/承認済み送信者のみ: `/help`、`/commands`、`/status`、`/whoami`（`/id`）。

    これらは即座に実行され、モデルがメッセージを見る前に取り除かれ、残りのテキストは通常のフローを継続します。

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
  ネイティブコマンドを登録します。自動: Discord/Telegram ではオン、Slack ではオフ（スラッシュコマンドを追加するまで）、ネイティブサポートがないプロバイダーでは無視されます。プロバイダーごとに上書きするには、`channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（bool または `"auto"`）。Discord では、`false` にすると起動時のスラッシュコマンド登録とクリーンアップをスキップします。以前登録されたコマンドは、Discord アプリから削除するまで表示されたままになる場合があります。Slack コマンドは Slack アプリで管理され、自動的には削除されません。
</ParamField>
Discord では、ネイティブコマンド仕様に `descriptionLocalizations` を含めることができ、OpenClaw はそれを Discord の `description_localizations` として公開し、照合比較にも含めます。
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  サポートされている場合、**スキル**コマンドをネイティブに登録します。自動: Discord/Telegram ではオン、Slack ではオフ（Slack ではスキルごとにスラッシュコマンドを作成する必要があります）。プロバイダーごとに上書きするには、`channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（bool または `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` でホストシェルコマンドを実行できるようにします（`/bash <cmd>` はエイリアスです。`tools.elevated` 許可リストが必要です）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash がバックグラウンドモードに切り替わるまで待機する時間を制御します（`0` は即座にバックグラウンド化します）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` の読み書き）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定の読み書き）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（Plugin 検出/ステータスに加え、インストールと有効化/無効化の制御）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（実行時のみの上書き）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と Gateway 再起動ツールアクションを有効にします。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  所有者専用のコマンド/ツールサーフェスに対する明示的な所有者許可リストを設定します。これは、危険なアクションを承認し、`/diagnostics`、`/export-trajectory`、`/config` などのコマンドを実行できる人間のオペレーターアカウントです。`commands.allowFrom` や DM ペアリングアクセスとは別です。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごと: 所有者専用コマンドをそのサーフェスで実行するには、**所有者 ID** を必須にします。`true` の場合、送信者は解決済みの所有者候補（たとえば `commands.ownerAllowFrom` のエントリやプロバイダーのネイティブ所有者メタデータ）に一致するか、内部メッセージチャンネルで内部 `operator.admin` スコープを保持している必要があります。チャンネル `allowFrom` のワイルドカードエントリ、または空/未解決の所有者候補リストだけでは十分ではありません。所有者専用コマンドはそのチャンネルでフェイルクローズします。所有者専用コマンドを `ownerAllowFrom` と標準のコマンド許可リストだけでゲートしたい場合は、これをオフのままにします。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  所有者 ID がシステムプロンプトにどのように表示されるかを制御します。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  必要に応じて、`commands.ownerDisplay="hash"` のときに使用される HMAC シークレットを設定します。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  コマンド認可のプロバイダーごとの許可リストです。設定されている場合、これはコマンドとディレクティブの唯一の認可ソースになり、チャンネル許可リスト/ペアリングと `commands.useAccessGroups` は無視されます。グローバルデフォルトには `"*"` を使用します。プロバイダー固有のキーはそれを上書きします。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合に、コマンドに対して許可リスト/ポリシーを適用します。
</ParamField>

## コマンド一覧

現在の信頼できる情報源:

- コア組み込みは `src/auto-reply/commands-registry.shared.ts` から来ます
- 生成されたドックコマンドは `src/auto-reply/commands-registry.data.ts` から来ます
- Plugin コマンドは Plugin の `registerCommand()` 呼び出しから来ます
- Gateway での実際の利用可否は、引き続き設定フラグ、チャンネルサーフェス、インストール済み/有効化済み Plugin に依存します

### コア組み込みコマンド

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` は新しいセッションを開始します。`/reset` はリセット用のエイリアスです。
    - Control UI は、入力された `/new` をインターセプトして新しいダッシュボードセッションを作成し、それに切り替えます。ただし、`session.dmScope: "main"` が設定され、現在の親がエージェントのメインセッションである場合を除きます。その場合、`/new` はメインセッションをその場でリセットします。入力された `/reset` は引き続き Gateway のインプレースリセットを実行します。
    - `/reset soft [message]` は現在のトランスクリプトを保持し、再利用された CLI バックエンドセッション ID を破棄し、起動/システムプロンプト読み込みをその場で再実行します。
    - `/compact [instructions]` はセッションコンテキストを compact します。[Compaction](/ja-JP/concepts/compaction) を参照してください。
    - `/stop` は現在の実行を中止します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` はスレッドバインディングの有効期限を管理します。
    - `/export-session [path]` は現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
    - `/export-trajectory [path]` は exec 承認を要求し、その後、現在のセッションの JSONL [トラジェクトリバンドル](/ja-JP/tools/trajectory) をエクスポートします。1 つの OpenClaw セッションについて、プロンプト、ツール、トランスクリプトのタイムラインが必要な場合に使用します。グループチャットでは、承認プロンプトとエクスポート結果は所有者に非公開で送られます。エイリアス: `/trajectory`。

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level|default>` は思考レベルを設定するか、セッションの上書きをクリアします。オプションはアクティブモデルのプロバイダープロファイルから取得されます。一般的なレベルは `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max`、またはバイナリの `on` などのカスタムレベルはサポートされている場合にのみ使用できます。エイリアス: `/thinking`、`/t`。
    - `/verbose on|off|full` は詳細出力を切り替えます。エイリアス: `/v`。
    - `/trace on|off` は現在のセッションの Plugin トレース出力を切り替えます。
    - `/fast [status|on|off|default]` は高速モードを表示、設定、またはクリアします。
    - `/reasoning [on|off|stream]` は reasoning の表示を切り替えます。エイリアス: `/reason`。
    - `/elevated [on|off|ask|full]` は elevated モードを切り替えます。エイリアス: `/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec のデフォルトを表示または設定します。
    - `/model [name|#|status]` はモデルを表示または設定します。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` は、設定済み/認証利用可能なプロバイダー、またはプロバイダーのモデルを一覧表示します。`all` を追加すると、そのプロバイダーの完全なカタログを閲覧できます。`agents.defaults.models` の `provider/*` エントリにより、`/model` と `/models` はそれらのプロバイダーについて検出済みモデルだけを表示します。
    - `/queue <mode>` はキュー動作（`steer`、レガシーの `queue`、`followup`、`collect`、`steer-backlog`、`interrupt`）と、`debounce:0.5s cap:25 drop:summarize` のようなオプションを管理します。`/queue default` または `/queue reset` はセッションの上書きをクリアします。[Command queue](/ja-JP/concepts/queue) と [Steering queue](/ja-JP/concepts/queue-steering) を参照してください。
    - `/steer <message>` は、`/queue` モードとは独立して、現在のセッションのアクティブな実行にガイダンスを注入します。セッションがアイドル状態の場合、新しい実行は開始しません。エイリアス: `/tell`。[Steer](/ja-JP/tools/steer) を参照してください。

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` は短いヘルプ概要を表示します。
    - `/commands` は生成されたコマンドカタログを表示します。
    - `/tools [compact|verbose]` は現在のエージェントが今すぐ使用できるものを表示します。
    - `/status` は実行/ランタイムステータス、Gateway とシステムの稼働時間、利用可能な場合はプロバイダーの使用量/クォータを表示します。
    - `/diagnostics [note]` は、Gateway バグと Codex ハーネス実行のための所有者専用サポートレポートフローです。`openclaw gateway diagnostics export --json` を実行する前に、毎回明示的な exec 承認を要求します。allow-all ルールで diagnostics を承認しないでください。承認後、ローカルバンドルパス、マニフェスト概要、プライバシーノート、関連するセッション ID を含む貼り付け可能なレポートを送信します。グループチャットでは、承認プロンプトとレポートは所有者に非公開で送られます。アクティブセッションが OpenAI Codex ハーネスを使用している場合、同じ承認により関連する Codex フィードバックも OpenAI サーバーへ送信され、完了した返信には OpenClaw セッション ID、Codex スレッド ID、`codex resume <thread-id>` コマンドが一覧表示されます。[Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。
    - `/crestodian <request>` は、所有者 DM から Crestodian セットアップおよび修復ヘルパーを実行します。
    - `/tasks` は現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
    - `/context [list|detail|map|json]` はコンテキストがどのように組み立てられるかを説明します。`map` は現在のセッションコンテキストのツリーマップ画像を送信します。
    - `/whoami` は送信者 ID を表示します。エイリアス: `/id`。
    - `/usage off|tokens|full|cost` は応答ごとの使用量フッターを制御するか、ローカルのコスト概要を出力します。

  </Accordion>
  <Accordion title="Skills、許可リスト、承認">
    - `/skill <name> [input]` は名前でスキルを実行します。
    - `/allowlist [list|add|remove] ...` は許可リストのエントリを管理します。テキストのみ。
    - `/approve <id> <decision>` は exec 承認プロンプトを解決します。
    - `/btw <question>` は今後のセッションコンテキストを変更せずに補足の質問をします。別名: `/side`。[BTW](/ja-JP/tools/btw) を参照してください。

  </Accordion>
  <Accordion title="サブエージェントと ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` は現在のセッションのサブエージェント実行を管理します。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は ACP セッションとランタイムオプションを管理します。
    - `/focus <target>` は現在の Discord スレッドまたは Telegram トピック/会話をセッションターゲットに紐付けます。
    - `/unfocus` は現在の紐付けを削除します。
    - `/agents` は現在のセッションに対してスレッドに紐付けられたエージェントを一覧表示します。
    - `/kill <id|#|all>` は実行中のサブエージェントを 1 つまたはすべて中止します。
    - `/subagents steer <id|#> <message>` は実行中のサブエージェントに操舵メッセージを送信します。[Steer](/ja-JP/tools/steer) を参照してください。

  </Accordion>
  <Accordion title="所有者専用の書き込みと管理">
    - `/config show|get|set|unset` は `openclaw.json` を読み取りまたは書き込みます。所有者専用。`commands.config: true` が必要です。
    - `/mcp show|get|set|unset` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定を読み取りまたは書き込みます。所有者専用。`commands.mcp: true` が必要です。
    - `/plugins list|inspect|show|get|install|enable|disable` は Plugin の状態を検査または変更します。`/plugin` は別名です。書き込みは所有者専用。`commands.plugins: true` が必要です。
    - `/debug show|set|unset|reset` はランタイム専用の設定オーバーライドを管理します。所有者専用。`commands.debug: true` が必要です。
    - `/restart` は有効な場合に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定します。
    - `/send on|off|inherit` は送信ポリシーを設定します。所有者専用。

  </Accordion>
  <Accordion title="音声、TTS、チャンネル制御">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` は TTS を制御します。[TTS](/ja-JP/tools/tts) を参照してください。
    - `/activation mention|always` はグループのアクティベーションモードを設定します。
    - `/bash <command>` はホストのシェルコマンドを実行します。テキストのみ。別名: `! <command>`。`commands.bash: true` と `tools.elevated` 許可リストが必要です。
    - `!poll [sessionId]` はバックグラウンドの bash ジョブを確認します。
    - `!stop [sessionId]` はバックグラウンドの bash ジョブを停止します。

  </Accordion>
</AccordionGroup>

### 生成された dock コマンド

dock コマンドは、現在のセッションの返信ルートを別のリンク済み
チャンネルへ切り替えます。セットアップ、例、トラブルシューティングについては
[チャンネルドッキング](/ja-JP/concepts/channel-docking) を参照してください。

dock コマンドは、ネイティブコマンド対応のチャンネル Plugin から生成されます。現在バンドルされているセット:

- `/dock-discord` (別名: `/dock_discord`)
- `/dock-mattermost` (別名: `/dock_mattermost`)
- `/dock-slack` (別名: `/dock_slack`)
- `/dock-telegram` (別名: `/dock_telegram`)

ダイレクトチャットから dock コマンドを使うと、現在のセッションの返信ルートを別のリンク済みチャンネルへ切り替えられます。エージェントは同じセッションコンテキストを維持しますが、そのセッションの今後の返信は選択したチャンネルピアへ配信されます。

dock コマンドには `session.identityLinks` が必要です。送信元の送信者とターゲットピアは同じ ID グループ内にある必要があります。たとえば `["telegram:123", "discord:456"]` です。ID `123` の Telegram ユーザーが `/dock_discord` を送信すると、OpenClaw はアクティブセッションに `lastChannel: "discord"` と `lastTo: "456"` を保存します。送信者が Discord ピアにリンクされていない場合、通常のチャットにフォールスルーする代わりに、コマンドはセットアップのヒントを返信します。

ドッキングはアクティブセッションのルートだけを変更します。チャンネルアカウントの作成、アクセス付与、チャンネル許可リストの迂回、トランスクリプト履歴の別セッションへの移動は行いません。ルートを再度切り替えるには、`/dock-telegram`、`/dock-slack`、`/dock-mattermost`、または別の生成済み dock コマンドを使用します。

### バンドルされた Plugin コマンド

バンドルされた Plugin はさらに多くのスラッシュコマンドを追加できます。このリポジトリで現在バンドルされているコマンド:

- `/dreaming [on|off|status|help]` はメモリ Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` はデバイスのペアリング/セットアップフローを管理します。[ペアリング](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` は高リスクの phone node コマンドを一時的にアームします。
- `/voice status|list [limit]|set <voiceId|name>` は Talk の音声設定を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE リッチカードプリセットを送信します。[LINE](/ja-JP/channels/line) を参照してください。
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` はバンドルされた Codex アプリサーバーハーネスを検査および制御します。[Codex ハーネス](/ja-JP/plugins/codex-harness) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的スキルコマンド

ユーザーが呼び出せるスキルもスラッシュコマンドとして公開されます:

- `/skill <name> [input]` は汎用エントリポイントとして常に動作します。
- スキル/Plugin が登録している場合、スキルは `/prose` のような直接コマンドとしても表示されることがあります。
- ネイティブスキルコマンドの登録は `commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` によって制御されます。
- コマンド仕様は、Discord を含むローカライズされた説明をサポートするネイティブサーフェス向けに `descriptionLocalizations` を提供できます。

<AccordionGroup>
  <Accordion title="引数とパーサーに関する注記">
    - コマンドは、コマンドと引数の間に任意の `:` を受け付けます (例: `/think: high`、`/send: on`、`/help:`)。
    - `/new <model>` はモデル別名、`provider/model`、またはプロバイダー名 (あいまい一致) を受け付けます。一致しない場合、テキストはメッセージ本文として扱われます。
    - プロバイダー使用量の完全な内訳を確認するには、`openclaw status --usage` を使用します。
    - `/allowlist add|remove` には `commands.config=true` が必要で、チャンネルの `configWrites` を尊重します。
    - 複数アカウントのチャンネルでは、設定対象の `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` もターゲットアカウントの `configWrites` を尊重します。
    - `/usage` はレスポンスごとの使用量フッターを制御します。`/usage cost` は OpenClaw セッションログからローカルのコスト概要を出力します。
    - `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定します。
    - `/plugins install <spec>` は `openclaw plugins install` と同じ Plugin 仕様を受け付けます: ローカルパス/アーカイブ、npm パッケージ、`git:<repo>`、または `clawhub:<pkg>`。その後、Plugin ソースモジュールが変更されたため Gateway の再起動を要求します。
    - `/plugins enable|disable` は Plugin 設定を更新し、新しいエージェントターンのために Gateway Plugin の再読み込みをトリガーします。

  </Accordion>
  <Accordion title="チャンネル固有の動作">
    - Discord 専用ネイティブコマンド: `/vc join|leave|status` は音声チャンネルを制御します (テキストとしては利用できません)。`join` にはギルドと選択済みの音声/ステージチャンネルが必要です。`channels.discord.voice` とネイティブコマンドが必要です。
    - Discord スレッド紐付けコマンド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`) には、有効なスレッド紐付けが有効化されている必要があります (`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`)。
    - ACP コマンドリファレンスとランタイム動作: [ACP エージェント](/ja-JP/tools/acp-agents)。

  </Accordion>
  <Accordion title="詳細 / トレース / 高速 / 推論の安全性">
    - `/verbose` はデバッグと追加の可視性を目的としています。通常利用では **off** のままにしてください。
    - `/trace` は `/verbose` より範囲が狭く、Plugin が所有するトレース/デバッグ行だけを表示し、通常の詳細なツール出力は off のままにします。
    - `/fast on|off` はセッションオーバーライドを永続化します。クリアして設定デフォルトに戻すには、Sessions UI の `inherit` オプションを使用します。
    - `/fast` はプロバイダー固有です。OpenAI/OpenAI Codex はネイティブ Responses エンドポイントで `service_tier=priority` にマッピングします。一方、OAuth 認証済みで `api.anthropic.com` に送信されるトラフィックを含む直接の公開 Anthropic リクエストでは、`service_tier=auto` または `standard_only` にマッピングします。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
    - ツール失敗の概要は関連がある場合に引き続き表示されますが、詳細な失敗テキストは `/verbose` が `on` または `full` の場合にのみ含まれます。
    - `/reasoning`、`/verbose`、`/trace` はグループ設定ではリスクがあります。公開するつもりのない内部推論、ツール出力、Plugin 診断を明らかにする可能性があります。特にグループチャットでは、off のままにすることを推奨します。

  </Accordion>
  <Accordion title="モデル切り替え">
    - `/model` は新しいセッションモデルをただちに永続化します。
    - エージェントがアイドル状態の場合、次の実行はすぐにそのモデルを使用します。
    - 実行がすでにアクティブな場合、OpenClaw はライブ切り替えを保留中としてマークし、クリーンな再試行ポイントでのみ新しいモデルに再起動します。
    - ツールアクティビティまたは返信出力がすでに開始している場合、保留中の切り替えは後の再試行機会または次のユーザーターンまでキューに残ることがあります。
    - ローカル TUI では、`/crestodian [request]` は通常のエージェント TUI から Crestodian に戻ります。これはメッセージチャンネルのレスキューモードとは別のものであり、リモート設定権限を付与しません。

  </Accordion>
  <Accordion title="高速パスとインラインショートカット">
    - **高速パス:** 許可リストにある送信者からのコマンドのみのメッセージはただちに処理されます (キュー + モデルを迂回)。
    - **グループメンションゲート:** 許可リストにある送信者からのコマンドのみのメッセージはメンション要件を迂回します。
    - **インラインショートカット (許可リストにある送信者のみ):** 特定のコマンドは通常のメッセージ内に埋め込まれていても動作し、残りのテキストをモデルが見る前に取り除かれます。
      - 例: `hey /status` はステータス返信をトリガーし、残りのテキストは通常フローを継続します。
    - 現在: `/help`、`/commands`、`/status`、`/whoami` (`/id`)。
    - 認可されていないコマンドのみのメッセージは黙って無視され、インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="スキルコマンドとネイティブ引数">
    - **スキルコマンド:** `user-invocable` スキルはスラッシュコマンドとして公開されます。名前は `a-z0-9_` にサニタイズされます (最大 32 文字)。衝突した場合は数値サフィックスが付きます (例: `_2`)。
      - `/skill <name> [input]` は名前でスキルを実行します (ネイティブコマンドの制限によりスキルごとのコマンドを使えない場合に便利です)。
      - デフォルトでは、スキルコマンドは通常のリクエストとしてモデルに転送されます。
      - スキルは任意で `command-dispatch: tool` を宣言し、コマンドを直接ツールにルーティングできます (決定的、モデルなし)。
      - 例: `/prose` (OpenProse Plugin) — [OpenProse](/ja-JP/prose) を参照してください。
    - **ネイティブコマンド引数:** Discord は動的オプションにオートコンプリートを使用します (必須引数を省略した場合はボタンメニュー)。Telegram と Slack は、コマンドが選択肢をサポートしていて引数を省略した場合にボタンメニューを表示します。動的な選択肢はターゲットセッションモデルに対して解決されるため、`/think` レベルのようなモデル固有オプションはそのセッションの `/model` オーバーライドに従います。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` は設定の質問ではなく、ランタイムの質問に答えます: **このエージェントがこの会話で今すぐ使えるもの**。

- デフォルトの `/tools` はコンパクトで、すばやく確認できるように最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンドサーフェスは、`compact|verbose` と同じモード切り替えを公開します。
- 結果はセッションスコープであるため、エージェント、チャンネル、スレッド、送信者の認可、またはモデルを変更すると出力が変わることがあります。
- `/tools` には、コアツール、接続済み Plugin ツール、チャンネル所有ツールを含め、ランタイムで実際に到達可能なツールが含まれます。

プロファイルとオーバーライドの編集には、`/tools` を静的カタログとして扱うのではなく、Control UI の Tools パネルまたは設定/カタログサーフェスを使用してください。

## 使用量サーフェス (どこに何が表示されるか)

- **プロバイダーの使用量/クォータ**（例: "Claude 80% left"）は、使用量追跡が有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。OpenClaw はプロバイダーのウィンドウを `% left` に正規化します。MiniMax では、残量のみのパーセントフィールドは表示前に反転され、`model_remains` レスポンスではチャットモデルのエントリとモデルタグ付きのプランラベルが優先されます。
- **トークン/キャッシュ行**は、ライブセッションのスナップショットが疎な場合、`/status` 内で最新のトランスクリプト使用量エントリにフォールバックできます。既存のゼロでないライブ値は引き続き優先され、トランスクリプトへのフォールバックにより、保存済み合計が欠落しているか小さい場合にも、アクティブなランタイムモデルラベルと、より大きいプロンプト指向の合計を復元できます。
- **実行とランタイム:** `/status` は、有効なサンドボックスパスを `Execution` として、実際にセッションを実行している主体を `Runtime` として報告します: `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンド。
- **レスポンスごとのトークン/コスト**は `/usage off|tokens|full` で制御されます（通常の返信に付加されます）。
- `/model status` は **モデル/認証/エンドポイント**に関するものであり、使用量に関するものではありません。

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
- Discord では、`/model` と `/models` により、プロバイダーとモデルのドロップダウン、および送信ステップを備えたインタラクティブなピッカーが開きます。ピッカーは `provider/*` エントリを含む `agents.defaults.models` を尊重するため、プロバイダー単位の検出により、ピッカーを Discord の 25 オプションのコンポーネント制限内に保てます。
- `/model <#>` はそのピッカーから選択します（可能な場合は現在のプロバイダーを優先します）。
- `/model status` は、構成済みのプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）が利用可能な場合、それらを含む詳細ビューを表示します。

## デバッグ上書き

`/debug` では、**ランタイムのみ**の設定上書き（メモリ上で、ディスクではない）を設定できます。所有者専用です。デフォルトでは無効です。`commands.debug: true` で有効にします。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
上書きは新しい設定読み取りに即座に適用されますが、`openclaw.json` には書き込まれません。すべての上書きを消去し、ディスク上の設定に戻すには `/debug reset` を使用します。
</Note>

## Plugin トレース出力

`/trace` では、完全な詳細モードをオンにせずに、**セッション単位の Plugin トレース/デバッグ行**を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注:

- 引数なしの `/trace` は、現在のセッションのトレース状態を表示します。
- `/trace on` は、現在のセッションで Plugin トレース行を有効にします。
- `/trace off` は、それらを再び無効にします。
- Plugin トレース行は `/status` に表示されることがあり、通常のアシスタント返信後のフォローアップ診断メッセージとしても表示されることがあります。
- `/trace` は `/debug` を置き換えるものではありません。`/debug` は引き続きランタイムのみの設定上書きを管理します。
- `/trace` は `/verbose` を置き換えるものではありません。通常の詳細なツール/ステータス出力は引き続き `/verbose` に属します。

## 設定更新

`/config` はディスク上の設定（`openclaw.json`）に書き込みます。所有者専用です。デフォルトでは無効です。`commands.config: true` で有効にします。

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

`/mcp` は、OpenClaw が管理する MCP サーバー定義を `mcp.servers` 配下に書き込みます。所有者専用です。デフォルトでは無効です。`commands.mcp: true` で有効にします。

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

`/plugins` では、オペレーターが検出済み Plugin を検査し、設定内で有効化を切り替えられます。読み取り専用フローでは `/plugin` をエイリアスとして使用できます。デフォルトでは無効です。`commands.plugins: true` で有効にします。

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
- `/plugins install` は ClawHub、npm、git、ローカルディレクトリ、アーカイブからインストールします。
- `/plugins enable|disable` は Plugin 設定のみを更新します。Plugin のインストールやアンインストールは行いません。
- 有効化および無効化の変更は、新しいエージェントターン向けに Gateway Plugin ランタイムサーフェスをホットリロードします。インストールでは Plugin ソースモジュールが変更されるため、Gateway の再起動を要求します。

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
    `channels.slack.slashCommand` は、単一の `/openclaw` 形式のコマンドについて引き続きサポートされています。`commands.native` を有効にする場合は、組み込みコマンドごとに 1 つの Slack スラッシュコマンド（`/help` と同じ名前）を作成する必要があります。Slack のコマンド引数メニューは、一時的な Block Kit ボタンとして配信されます。

    Slack ネイティブの例外: Slack は `/status` を予約しているため、`/agentstatus`（`/status` ではない）を登録します。テキスト `/status` は Slack メッセージ内では引き続き機能します。

  </Accordion>
</AccordionGroup>

## BTW サイド質問

`/btw` は現在のセッションについての簡単な**サイド質問**です。`/side` はエイリアスです。

通常のチャットとは異なります:

- 現在のセッションを背景コンテキストとして使用します。
- 別個の**ツールなし**の一回限りの呼び出しとして実行されます。
- 将来のセッションコンテキストを変更しません。
- トランスクリプト履歴に書き込まれません。
- 通常のアシスタントメッセージではなく、ライブのサイド結果として配信されます。

これにより、メインタスクを進めたまま一時的な確認をしたい場合に `/btw` が役立ちます。

例:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

完全な挙動とクライアント UX の詳細については、[BTW サイド質問](/ja-JP/tools/btw)を参照してください。

## 関連

- [Skills の作成](/ja-JP/tools/creating-skills)
- [Skills](/ja-JP/tools/skills)
- [Skills 設定](/ja-JP/tools/skills-config)
