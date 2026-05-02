---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
sidebarTitle: Slash commands
summary: 'スラッシュコマンド: テキストとネイティブ、設定、サポートされるコマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-05-02T21:08:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

コマンドは Gateway によって処理されます。ほとんどのコマンドは `/` で始まる**単独**メッセージとして送信する必要があります。ホスト専用の bash チャットコマンドは `! <cmd>` を使用します（`/bash <cmd>` はエイリアスです）。

会話またはスレッドが ACP セッションにバインドされている場合、通常のフォローアップテキストはその ACP ハーネスにルーティングされます。Gateway 管理コマンドは引き続きローカルに留まります。`/acp ...` は常に OpenClaw ACP コマンドハンドラーに届き、`/status` と `/unfocus` は、そのサーフェスでコマンド処理が有効な場合は常にローカルに留まります。

関連するシステムは 2 つあります。

<AccordionGroup>
  <Accordion title="コマンド">
    単独の `/...` メッセージ。
  </Accordion>
  <Accordion title="ディレクティブ">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。

    - ディレクティブは、モデルが参照する前にメッセージから取り除かれます。
    - 通常のチャットメッセージ（ディレクティブのみではないもの）では、「インラインヒント」として扱われ、セッション設定には**永続化されません**。
    - ディレクティブのみのメッセージ（メッセージにディレクティブだけが含まれるもの）では、セッションに永続化され、確認応答が返されます。
    - ディレクティブは**許可された送信者**にのみ適用されます。`commands.allowFrom` が設定されている場合、それだけが使用される許可リストになります。それ以外の場合、認可はチャンネルの許可リスト/ペアリングと `commands.useAccessGroups` から決まります。認可されていない送信者のディレクティブはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="インラインショートカット">
    許可リスト登録済み/認可済みの送信者のみ: `/help`、`/commands`、`/status`、`/whoami`（`/id`）。

    これらは即座に実行され、モデルがメッセージを参照する前に取り除かれ、残りのテキストは通常のフローを継続します。

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
  チャットメッセージ内の `/...` の解析を有効にします。ネイティブコマンドのないサーフェス（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）では、これを `false` に設定してもテキストコマンドは引き続き動作します。
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ネイティブコマンドを登録します。auto: Discord/Telegram ではオン、Slack ではオフ（スラッシュコマンドを追加するまで）、ネイティブサポートのないプロバイダーでは無視されます。プロバイダーごとに上書きするには、`channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（bool または `"auto"`）。`false` は起動時に Discord/Telegram で以前に登録されたコマンドを消去します。Slack コマンドは Slack アプリで管理され、自動的には削除されません。
</ParamField>
Discord では、ネイティブコマンド仕様に `descriptionLocalizations` を含めることができ、OpenClaw はこれを Discord `description_localizations` として公開し、照合比較に含めます。
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  サポートされている場合、**skill** コマンドをネイティブに登録します。auto: Discord/Telegram ではオン、Slack ではオフ（Slack では skill ごとにスラッシュコマンドを作成する必要があります）。プロバイダーごとに上書きするには、`channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（bool または `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` でホストシェルコマンドを実行できるようにします（`/bash <cmd>` はエイリアスです。`tools.elevated` の許可リストが必要です）。
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
  `/plugins` を有効にします（plugin の検出/ステータスに加えて、インストールと有効化/無効化の制御）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（ランタイム専用の上書き）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と gateway 再起動ツールアクションを有効にします。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  オーナー専用のコマンド/ツールサーフェスに対する明示的なオーナー許可リストを設定します。これは危険なアクションを承認し、`/diagnostics`、`/export-trajectory`、`/config` などのコマンドを実行できる人間のオペレーターアカウントです。`commands.allowFrom` や DM ペアリングアクセスとは別です。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごと: そのサーフェスでオーナー専用コマンドを実行するには**オーナー ID** を必須にします。`true` の場合、送信者は解決済みのオーナー候補（たとえば `commands.ownerAllowFrom` のエントリーやプロバイダーのネイティブなオーナーメタデータ）に一致するか、内部メッセージチャンネルで内部 `operator.admin` スコープを保持している必要があります。チャンネル `allowFrom` のワイルドカードエントリー、または空/未解決のオーナー候補リストだけでは十分**ではありません**。そのチャンネルでは、オーナー専用コマンドは閉じた状態で失敗します。オーナー専用コマンドを `ownerAllowFrom` と標準のコマンド許可リストだけで制御したい場合は、これをオフのままにします。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプト内でオーナー ID がどのように表示されるかを制御します。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  必要に応じて、`commands.ownerDisplay="hash"` のときに使用する HMAC シークレットを設定します。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  コマンド認可のためのプロバイダーごとの許可リスト。設定されている場合、コマンドとディレクティブに対する唯一の認可ソースになり、チャンネル許可リスト/ペアリングと `commands.useAccessGroups` は無視されます。グローバルデフォルトには `"*"` を使用します。プロバイダー固有のキーがそれを上書きします。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合に、コマンドに対して許可リスト/ポリシーを適用します。
</ParamField>

## コマンド一覧

現在の信頼できる情報源:

- コアの組み込みは `src/auto-reply/commands-registry.shared.ts` から来ます
- 生成された dock コマンドは `src/auto-reply/commands-registry.data.ts` から来ます
- plugin コマンドは plugin の `registerCommand()` 呼び出しから来ます
- あなたの gateway で実際に利用できるかどうかは、設定フラグ、チャンネルサーフェス、インストール済み/有効化済みの plugins に引き続き依存します

### コア組み込みコマンド

<AccordionGroup>
  <Accordion title="セッションと実行">
    - `/new [model]` は新しいセッションを開始します。`/reset` はリセットのエイリアスです。
    - Control UI は入力された `/new` をインターセプトして、新しいダッシュボードセッションを作成して切り替えます。入力された `/reset` は引き続き Gateway のインプレースリセットを実行します。
    - `/reset soft [message]` は現在のトランスクリプトを保持し、再利用された CLI バックエンドセッション ID を破棄し、起動/システムプロンプトの読み込みをインプレースで再実行します。
    - `/compact [instructions]` はセッションコンテキストを圧縮します。[Compaction](/ja-JP/concepts/compaction) を参照してください。
    - `/stop` は現在の実行を中止します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` はスレッドバインディングの有効期限を管理します。
    - `/export-session [path]` は現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
    - `/export-trajectory [path]` は exec 承認を求めた後、現在のセッション用の JSONL [trajectory bundle](/ja-JP/tools/trajectory) をエクスポートします。1 つの OpenClaw セッションについて、プロンプト、ツール、トランスクリプトのタイムラインが必要な場合に使用します。グループチャットでは、承認プロンプトとエクスポート結果はオーナーへ非公開で送信されます。エイリアス: `/trajectory`。

  </Accordion>
  <Accordion title="モデルと実行制御">
    - `/think <level>` は思考レベルを設定します。選択肢はアクティブモデルのプロバイダープロファイルから来ます。一般的なレベルは `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max` などのカスタムレベルやバイナリの `on` はサポートされている場合のみ利用できます。エイリアス: `/thinking`、`/t`。
    - `/verbose on|off|full` は詳細出力を切り替えます。エイリアス: `/v`。
    - `/trace on|off` は現在のセッションの plugin トレース出力を切り替えます。
    - `/fast [status|on|off]` は高速モードを表示または設定します。
    - `/reasoning [on|off|stream]` は推論の可視性を切り替えます。エイリアス: `/reason`。
    - `/elevated [on|off|ask|full]` は昇格モードを切り替えます。エイリアス: `/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec のデフォルトを表示または設定します。
    - `/model [name|#|status]` はモデルを表示または設定します。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` は設定済み/認証利用可能なプロバイダー、またはプロバイダーのモデルを一覧表示します。`all` を追加すると、そのプロバイダーの全カタログを閲覧できます。
    - `/queue <mode>` はキューの動作（`steer`、レガシー `queue`、`followup`、`collect`、`steer-backlog`、`interrupt`）と、`debounce:0.5s cap:25 drop:summarize` のようなオプションを管理します。`/queue default` または `/queue reset` はセッションの上書きをクリアします。[Command queue](/ja-JP/concepts/queue) と [Steering queue](/ja-JP/concepts/queue-steering) を参照してください。

  </Accordion>
  <Accordion title="検出とステータス">
    - `/help` は短いヘルプ要約を表示します。
    - `/commands` は生成されたコマンドカタログを表示します。
    - `/tools [compact|verbose]` は現在のエージェントが今使用できるものを表示します。
    - `/status` は実行/ランタイムステータスを表示します。利用可能な場合は `Execution`/`Runtime` ラベルとプロバイダー使用量/クォータも含まれます。
    - `/diagnostics [note]` は Gateway のバグと Codex ハーネス実行のためのオーナー専用サポートレポートフローです。`openclaw gateway diagnostics export --json` を実行する前に、毎回明示的な exec 承認を求めます。allow-all ルールで diagnostics を承認しないでください。承認後、ローカルバンドルパス、マニフェスト要約、プライバシーノート、関連するセッション ID を含む貼り付け可能なレポートを送信します。グループチャットでは、承認プロンプトとレポートはオーナーへ非公開で送信されます。アクティブセッションが OpenAI Codex ハーネスを使用している場合、同じ承認によって関連する Codex フィードバックも OpenAI サーバーへ送信され、完了した返信には OpenClaw セッション ID、Codex スレッド ID、`codex resume <thread-id>` コマンドが一覧表示されます。[Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。
    - `/crestodian <request>` はオーナー DM から Crestodian セットアップおよび修復ヘルパーを実行します。
    - `/tasks` は現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
    - `/context [list|detail|json]` はコンテキストがどのように組み立てられるかを説明します。
    - `/whoami` はあなたの送信者 ID を表示します。エイリアス: `/id`。
    - `/usage off|tokens|full|cost` はレスポンスごとの使用量フッターを制御するか、ローカルのコスト要約を出力します。

  </Accordion>
  <Accordion title="Skills、許可リスト、承認">
    - `/skill <name> [input]` は名前で skill を実行します。
    - `/allowlist [list|add|remove] ...` は許可リストエントリーを管理します。テキスト専用です。
    - `/approve <id> <decision>` は exec 承認プロンプトを解決します。
    - `/btw <question>` は将来のセッションコンテキストを変更せずに補足質問を行います。[BTW](/ja-JP/tools/btw) を参照してください。

  </Accordion>
  <Accordion title="サブエージェントと ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` は現在のセッションのサブエージェント実行を管理します。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は ACP セッションとランタイムオプションを管理します。
    - `/focus <target>` は現在の Discord スレッドまたは Telegram トピック/会話をセッションターゲットに結び付けます。
    - `/unfocus` は現在のバインドを削除します。
    - `/agents` は現在のセッションのスレッドバインドされたエージェントを一覧表示します。
    - `/kill <id|#|all>` は実行中のサブエージェントを1つ、またはすべて中止します。
    - `/steer <id|#> <message>` は実行中のサブエージェントにステアリングを送信します。エイリアス: `/tell`。

  </Accordion>
  <Accordion title="所有者専用の書き込みと管理">
    - `/config show|get|set|unset` は `openclaw.json` を読み書きします。所有者専用です。`commands.config: true` が必要です。
    - `/mcp show|get|set|unset` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定を読み書きします。所有者専用です。`commands.mcp: true` が必要です。
    - `/plugins list|inspect|show|get|install|enable|disable` は Plugin の状態を検査または変更します。`/plugin` はエイリアスです。書き込みは所有者専用です。`commands.plugins: true` が必要です。
    - `/debug show|set|unset|reset` はランタイム専用の設定オーバーライドを管理します。所有者専用です。`commands.debug: true` が必要です。
    - `/restart` は有効な場合に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定します。
    - `/send on|off|inherit` は送信ポリシーを設定します。所有者専用です。

  </Accordion>
  <Accordion title="音声、TTS、チャンネル制御">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` は TTS を制御します。[TTS](/ja-JP/tools/tts) を参照してください。
    - `/activation mention|always` はグループのアクティベーションモードを設定します。
    - `/bash <command>` はホストのシェルコマンドを実行します。テキストのみです。エイリアス: `! <command>`。`commands.bash: true` と `tools.elevated` の許可リストが必要です。
    - `!poll [sessionId]` はバックグラウンドの bash ジョブを確認します。
    - `!stop [sessionId]` はバックグラウンドの bash ジョブを停止します。

  </Accordion>
</AccordionGroup>

### 生成された dock コマンド

dock コマンドは、現在のセッションの返信ルートを別のリンク済みチャンネルへ切り替えます。セットアップ、例、トラブルシューティングについては [チャンネル docking](/ja-JP/concepts/channel-docking) を参照してください。

dock コマンドは、ネイティブコマンド対応のチャンネル Plugin から生成されます。現在バンドルされているセット:

- `/dock-discord` (エイリアス: `/dock_discord`)
- `/dock-mattermost` (エイリアス: `/dock_mattermost`)
- `/dock-slack` (エイリアス: `/dock_slack`)
- `/dock-telegram` (エイリアス: `/dock_telegram`)

ダイレクトチャットから dock コマンドを使うと、現在のセッションの返信ルートを別のリンク済みチャンネルへ切り替えられます。エージェントは同じセッションコンテキストを保持しますが、そのセッションの以後の返信は選択したチャンネルの相手に配信されます。

dock コマンドには `session.identityLinks` が必要です。送信元の送信者とターゲットの相手は、同じ ID グループに含まれている必要があります。たとえば `["telegram:123", "discord:456"]` です。id `123` の Telegram ユーザーが `/dock_discord` を送信すると、OpenClaw はアクティブセッションに `lastChannel: "discord"` と `lastTo: "456"` を保存します。送信者が Discord の相手にリンクされていない場合、コマンドは通常チャットにフォールスルーせず、セットアップのヒントを返信します。

docking はアクティブセッションのルートだけを変更します。チャンネルアカウントの作成、アクセス権の付与、チャンネル許可リストのバイパス、トランスクリプト履歴の別セッションへの移動は行いません。ルートを再度切り替えるには `/dock-telegram`、`/dock-slack`、`/dock-mattermost`、または別の生成済み dock コマンドを使います。

### バンドル Plugin コマンド

バンドル Plugin はさらにスラッシュコマンドを追加できます。このリポジトリで現在バンドルされているコマンド:

- `/dreaming [on|off|status|help]` はメモリの Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` はデバイスのペアリング/セットアップフローを管理します。[ペアリング](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` はリスクの高い電話ノードコマンドを一時的にアームします。
- `/voice status|list [limit]|set <voiceId|name>` は Talk 音声設定を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE リッチカードプリセットを送信します。[LINE](/ja-JP/channels/line) を参照してください。
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` はバンドルされた Codex アプリサーバーハーネスを検査および制御します。[Codex ハーネス](/ja-JP/plugins/codex-harness) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的 skill コマンド

ユーザーが呼び出せる Skills もスラッシュコマンドとして公開されます:

- `/skill <name> [input]` は汎用エントリーポイントとして常に機能します。
- skill/Plugin が登録している場合、Skills は `/prose` のような直接コマンドとしても表示されることがあります。
- ネイティブ skill コマンド登録は `commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` で制御されます。
- コマンド仕様は、Discord などローカライズされた説明に対応するネイティブサーフェス向けに `descriptionLocalizations` を提供できます。

<AccordionGroup>
  <Accordion title="引数とパーサーに関する注記">
    - コマンドは、コマンドと引数の間に任意で `:` を受け付けます (例: `/think: high`、`/send: on`、`/help:`)。
    - `/new <model>` は、モデルエイリアス、`provider/model`、またはプロバイダー名 (あいまい一致) を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - プロバイダー使用状況の完全な内訳を見るには、`openclaw status --usage` を使います。
    - `/allowlist add|remove` には `commands.config=true` が必要で、チャンネルの `configWrites` に従います。
    - 複数アカウントのチャンネルでは、設定を対象にする `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も対象アカウントの `configWrites` に従います。
    - `/usage` は応答ごとの使用量フッターを制御します。`/usage cost` は OpenClaw セッションログからローカルのコスト概要を出力します。
    - `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定します。
    - `/plugins install <spec>` は `openclaw plugins install` と同じ Plugin 仕様を受け付けます: ローカルパス/アーカイブ、npm パッケージ、`git:<repo>`、または `clawhub:<pkg>`。その後、Plugin ソースモジュールが変更されたため Gateway の再起動を要求します。
    - `/plugins enable|disable` は Plugin 設定を更新し、新しいエージェントターン向けに Gateway Plugin のリロードをトリガーします。

  </Accordion>
  <Accordion title="チャンネル固有の動作">
    - Discord 専用ネイティブコマンド: `/vc join|leave|status` は音声チャンネルを制御します (テキストとしては利用できません)。`join` にはギルドと選択済みの音声/ステージチャンネルが必要です。`channels.discord.voice` とネイティブコマンドが必要です。
    - Discord スレッドバインドコマンド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`) には、有効なスレッドバインドが有効化されている必要があります (`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`)。
    - ACP コマンドリファレンスとランタイム動作: [ACP エージェント](/ja-JP/tools/acp-agents)。

  </Accordion>
  <Accordion title="verbose / trace / fast / reasoning の安全性">
    - `/verbose` はデバッグと追加の可視性のためのものです。通常利用では **off** のままにしてください。
    - `/trace` は `/verbose` より範囲が狭く、Plugin 所有の trace/debug 行だけを表示し、通常の verbose ツールの雑音は off のままにします。
    - `/fast on|off` はセッションオーバーライドを永続化します。クリアして設定デフォルトへ戻すには、Sessions UI の `inherit` オプションを使います。
    - `/fast` はプロバイダー固有です。OpenAI/OpenAI Codex はネイティブ Responses エンドポイントで `service_tier=priority` にマッピングします。一方、OAuth 認証済みで `api.anthropic.com` に送信されるトラフィックを含む直接の公開 Anthropic リクエストでは、`service_tier=auto` または `standard_only` にマッピングします。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
    - ツール失敗の概要は関連がある場合に引き続き表示されますが、詳細な失敗テキストは `/verbose` が `on` または `full` の場合にのみ含まれます。
    - `/reasoning`、`/verbose`、`/trace` はグループ設定では危険です。公開する意図のなかった内部推論、ツール出力、Plugin 診断が表示される可能性があります。特にグループチャットでは off のままにすることを推奨します。

  </Accordion>
  <Accordion title="モデル切り替え">
    - `/model` は新しいセッションモデルをすぐに永続化します。
    - エージェントがアイドル状態なら、次の実行ですぐに使用されます。
    - 実行がすでにアクティブな場合、OpenClaw はライブ切り替えを保留としてマークし、クリーンな再試行ポイントでのみ新しいモデルへ再起動します。
    - ツール活動または返信出力がすでに開始している場合、保留中の切り替えは、後の再試行機会または次のユーザーターンまでキューに残ることがあります。
    - ローカル TUI では、`/crestodian [request]` は通常のエージェント TUI から Crestodian に戻ります。これはメッセージチャンネルのレスキューモードとは別であり、リモート設定権限を付与しません。

  </Accordion>
  <Accordion title="高速パスとインラインショートカット">
    - **高速パス:** 許可リスト登録済み送信者からのコマンドのみのメッセージは即時処理されます (キュー + モデルをバイパス)。
    - **グループメンションゲート:** 許可リスト登録済み送信者からのコマンドのみのメッセージはメンション要件をバイパスします。
    - **インラインショートカット (許可リスト登録済み送信者のみ):** 一部のコマンドは通常メッセージに埋め込まれている場合も機能し、モデルが残りのテキストを見る前に取り除かれます。
      - 例: `hey /status` はステータス返信をトリガーし、残りのテキストは通常フローを通過し続けます。
    - 現在: `/help`、`/commands`、`/status`、`/whoami` (`/id`)。
    - 未認可のコマンドのみのメッセージは黙って無視され、インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="Skill コマンドとネイティブ引数">
    - **Skill コマンド:** `user-invocable` Skills はスラッシュコマンドとして公開されます。名前は `a-z0-9_` にサニタイズされます (最大32文字)。衝突には数値サフィックスが付きます (例: `_2`)。
      - `/skill <name> [input]` は名前で skill を実行します (ネイティブコマンド制限により skill ごとのコマンドを使えない場合に便利です)。
      - デフォルトでは、skill コマンドは通常のリクエストとしてモデルに転送されます。
      - Skills は任意で `command-dispatch: tool` を宣言し、コマンドをツールへ直接ルーティングできます (決定的で、モデルなし)。
      - 例: `/prose` (OpenProse Plugin) — [OpenProse](/ja-JP/prose) を参照してください。
    - **ネイティブコマンド引数:** Discord は動的オプションにオートコンプリートを使います (必須引数を省略した場合はボタンメニューも使います)。Telegram と Slack は、コマンドが選択肢に対応していて引数を省略した場合にボタンメニューを表示します。動的な選択肢は対象セッションモデルに対して解決されるため、`/think` レベルなどのモデル固有オプションは、そのセッションの `/model` オーバーライドに従います。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` は設定に関する質問ではなく、ランタイムに関する質問、つまり **このエージェントがこの会話で今使えるもの** に答えます。

- デフォルトの `/tools` はコンパクトで、すばやい確認に最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数に対応するネイティブコマンドサーフェスは、`compact|verbose` と同じモード切り替えを公開します。
- 結果はセッションスコープのため、エージェント、チャンネル、スレッド、送信者認可、またはモデルを変更すると出力が変わることがあります。
- `/tools` には、コアツール、接続済み Plugin ツール、チャンネル所有ツールなど、ランタイムで実際に到達可能なツールが含まれます。

プロファイルとオーバーライドの編集には、`/tools` を静的カタログとして扱うのではなく、Control UI の Tools パネルまたは設定/カタログサーフェスを使ってください。

## 使用状況サーフェス (どこに何が表示されるか)

- **プロバイダー使用量/クォータ**（例: 「Claude 残り 80%」）は、使用量追跡が有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。OpenClaw はプロバイダーのウィンドウを「残り %」に正規化します。MiniMax では、残量のみのパーセントフィールドは表示前に反転され、`model_remains` 応答ではチャットモデルのエントリとモデルタグ付きのプランラベルが優先されます。
- `/status` の **トークン/キャッシュ行** は、ライブセッションスナップショットが疎な場合、最新のトランスクリプト使用量エントリにフォールバックできます。既存の非ゼロのライブ値は引き続き優先され、トランスクリプトのフォールバックでは、保存済み合計が欠落しているか小さい場合に、アクティブなランタイムモデルラベルと、より大きいプロンプト指向の合計も復元できます。
- **実行とランタイム:** `/status` は有効なサンドボックスパスを `Execution` として報告し、実際にセッションを実行しているものを `Runtime` として報告します: `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンドです。
- **応答ごとのトークン/コスト** は `/usage off|tokens|full` で制御します（通常の返信に追加されます）。
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
- Discord では、`/model` と `/models` がプロバイダーとモデルのドロップダウンに加えて Submit ステップを備えた対話型ピッカーを開きます。
- `/model <#>` はそのピッカーから選択します（可能な場合は現在のプロバイダーを優先します）。
- `/model status` は詳細ビューを表示し、利用可能な場合は設定済みプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）も含みます。

## デバッグ上書き

`/debug` では **ランタイムのみ** の設定上書き（ディスクではなくメモリ）を設定できます。所有者のみ。デフォルトでは無効です。`commands.debug: true` で有効にします。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
上書きは新しい設定読み取りに即時適用されますが、`openclaw.json` には書き込まれません。すべての上書きをクリアしてディスク上の設定に戻すには、`/debug reset` を使用します。
</Note>

## Plugin トレース出力

`/trace` では、完全な詳細モードをオンにせずに、**セッションスコープの Plugin トレース/デバッグ行** を切り替えられます。

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
- Plugin トレース行は `/status` に表示されることがあり、通常のアシスタント返信後の追加診断メッセージとしても表示されることがあります。
- `/trace` は `/debug` を置き換えるものではありません。`/debug` は引き続きランタイムのみの設定上書きを管理します。
- `/trace` は `/verbose` を置き換えるものではありません。通常の詳細なツール/ステータス出力は引き続き `/verbose` の役割です。

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

`/mcp` は OpenClaw 管理の MCP サーバー定義を `mcp.servers` の下に書き込みます。所有者のみ。デフォルトでは無効です。`commands.mcp: true` で有効にします。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` は Pi 所有のプロジェクト設定ではなく、OpenClaw 設定に設定を保存します。どのトランスポートが実際に実行可能かはランタイムアダプターが決定します。
</Note>

## Plugin 更新

`/plugins` では、オペレーターが検出された Plugin を検査し、設定内の有効化を切り替えられます。読み取り専用フローでは `/plugin` をエイリアスとして使用できます。デフォルトでは無効です。`commands.plugins: true` で有効にします。

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
- 有効化と無効化の変更は、新しいエージェントターン向けに Gateway の Plugin ランタイムサーフェスをホットリロードします。インストールでは Plugin ソースモジュールが変更されるため、Gateway の再起動が要求されます。

</Note>

## サーフェス注記

<AccordionGroup>
  <Accordion title="サーフェスごとのセッション">
    - **テキストコマンド** は通常のチャットセッションで実行されます（DM は `main` を共有し、グループには独自のセッションがあります）。
    - **ネイティブコマンド** は分離されたセッションを使用します:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
      - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` 経由でチャットセッションを対象にします）
    - **`/stop`** は現在の実行を中止できるよう、アクティブなチャットセッションを対象にします。

  </Accordion>
  <Accordion title="Slack 固有事項">
    `channels.slack.slashCommand` は、単一の `/openclaw` 形式のコマンドとして引き続きサポートされています。`commands.native` を有効にする場合は、組み込みコマンドごとに 1 つの Slack スラッシュコマンドを作成する必要があります（`/help` と同じ名前）。Slack のコマンド引数メニューは、一時的な Block Kit ボタンとして配信されます。

    Slack のネイティブ例外: Slack は `/status` を予約しているため、`/agentstatus`（`/status` ではなく）を登録してください。テキストの `/status` は Slack メッセージ内で引き続き機能します。

  </Accordion>
</AccordionGroup>

## ついでのサイド質問

`/btw` は、現在のセッションについての簡単な **サイド質問** です。

通常のチャットとは異なり:

- 現在のセッションを背景コンテキストとして使用します。
- 別個の **ツールなし** の 1 回限りの呼び出しとして実行されます。
- 今後のセッションコンテキストを変更しません。
- トランスクリプト履歴には書き込まれません。
- 通常のアシスタントメッセージではなく、ライブのサイド結果として配信されます。

そのため `/btw` は、メインタスクを進めながら一時的な確認をしたい場合に便利です。

例:

```text
/btw what are we doing right now?
```

完全な動作とクライアント UX の詳細については、[BTW サイド質問](/ja-JP/tools/btw) を参照してください。

## 関連

- [Skills の作成](/ja-JP/tools/creating-skills)
- [Skills](/ja-JP/tools/skills)
- [Skills 設定](/ja-JP/tools/skills-config)
