---
read_when:
    - チャットコマンドの使用または設定
    - コマンドのルーティングまたは権限のデバッグ
sidebarTitle: Slash commands
summary: 'スラッシュコマンド: テキスト形式とネイティブ形式、設定、サポートされるコマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-05-04T05:02:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49eb41674c8d0a01dbd28a2df783eb9aba3dde18d8425951a266cede825e9a84
    source_path: tools/slash-commands.md
    workflow: 16
---

コマンドは Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる**単独の**メッセージとして送信する必要があります。ホスト専用の bash チャットコマンドは `! <cmd>` を使用します（`/bash <cmd>` はエイリアスです）。

会話またはスレッドが ACP セッションにバインドされている場合、通常のフォローアップテキストはその ACP ハーネスにルーティングされます。Gateway 管理コマンドは引き続きローカルに留まります。`/acp ...` は常に OpenClaw ACP コマンドハンドラーに届き、`/status` と `/unfocus` は、そのサーフェスでコマンド処理が有効な場合は常にローカルに留まります。

関連するシステムが 2 つあります。

<AccordionGroup>
  <Accordion title="コマンド">
    単独の `/...` メッセージ。
  </Accordion>
  <Accordion title="ディレクティブ">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - ディレクティブは、モデルに見える前にメッセージから取り除かれます。
    - 通常のチャットメッセージ（ディレクティブのみではない）では、「インラインヒント」として扱われ、セッション設定としては**永続化されません**。
    - ディレクティブのみのメッセージ（メッセージにディレクティブだけが含まれる）では、セッションに永続化され、確認応答を返します。
    - ディレクティブは**認可済み送信者**に対してのみ適用されます。`commands.allowFrom` が設定されている場合、それだけが使用される許可リストです。そうでない場合、認可はチャンネル許可リスト/ペアリングと `commands.useAccessGroups` から取得されます。未認可の送信者の場合、ディレクティブはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="インラインショートカット">
    許可リスト済み/認可済み送信者のみ: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。

    これらは即座に実行され、モデルに見える前に取り除かれ、残りのテキストは通常のフローを続行します。

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
  ネイティブコマンドを登録します。自動: Discord/Telegram ではオン、Slack ではオフ（スラッシュコマンドを追加するまで）、ネイティブサポートのないプロバイダーでは無視されます。プロバイダーごとに上書きするには、`channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（bool または `"auto"`）。Discord では、`false` は起動時のスラッシュコマンド登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで表示されたままになる場合があります。Slack コマンドは Slack アプリで管理され、自動的には削除されません。
</ParamField>
Discord では、ネイティブコマンド仕様に `descriptionLocalizations` を含めることができ、OpenClaw はこれを Discord の `description_localizations` として公開し、照合比較に含めます。
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  サポートされている場合、**skill** コマンドをネイティブに登録します。自動: Discord/Telegram ではオン、Slack ではオフ（Slack では skill ごとにスラッシュコマンドを作成する必要があります）。プロバイダーごとに上書きするには、`channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（bool または `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` によるホストシェルコマンドの実行を有効にします（`/bash <cmd>` はエイリアスです。`tools.elevated` 許可リストが必要です）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash がバックグラウンドモードに切り替えるまで待機する時間を制御します（`0` は即座にバックグラウンド化します）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` を読み書きします）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定を読み書きします）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（Plugin の検出/ステータスと、インストールおよび有効化/無効化コントロール）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（実行時限定の上書き）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と Gateway 再起動ツールアクションを有効にします。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  オーナー専用コマンド/ツールサーフェスの明示的なオーナー許可リストを設定します。これは、危険なアクションを承認し、`/diagnostics`、`/export-trajectory`、`/config` などのコマンドを実行できる人間のオペレーターアカウントです。`commands.allowFrom` および DM ペアリングアクセスとは別です。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごと: そのサーフェスでオーナー専用コマンドを実行するには**オーナー ID** を必須にします。`true` の場合、送信者は解決済みのオーナー候補（たとえば `commands.ownerAllowFrom` のエントリやプロバイダー ネイティブのオーナーメタデータ）に一致するか、内部メッセージチャンネルで内部 `operator.admin` スコープを保持している必要があります。チャンネル `allowFrom` のワイルドカードエントリ、または空/未解決のオーナー候補リストだけでは**十分ではありません**。そのチャンネルではオーナー専用コマンドはフェイルクローズします。オーナー専用コマンドを `ownerAllowFrom` と標準のコマンド許可リストだけで制限したい場合は、これをオフのままにしてください。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプト内でオーナー ID がどのように表示されるかを制御します。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  必要に応じて、`commands.ownerDisplay="hash"` の場合に使用される HMAC シークレットを設定します。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  コマンド認可のプロバイダーごとの許可リストです。設定されている場合、コマンドとディレクティブの唯一の認可ソースになります（チャンネル許可リスト/ペアリングと `commands.useAccessGroups` は無視されます）。グローバルデフォルトには `"*"` を使用します。プロバイダー固有キーがこれを上書きします。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合に、コマンドの許可リスト/ポリシーを適用します。
</ParamField>

## コマンド一覧

現在の信頼できる情報源:

- コア組み込みは `src/auto-reply/commands-registry.shared.ts` から取得されます
- 生成された dock コマンドは `src/auto-reply/commands-registry.data.ts` から取得されます
- Plugin コマンドは Plugin の `registerCommand()` 呼び出しから取得されます
- Gateway 上での実際の利用可否は、引き続き設定フラグ、チャンネルサーフェス、インストール済み/有効化済み Plugin に依存します

### コア組み込みコマンド

<AccordionGroup>
  <Accordion title="セッションと実行">
    - `/new [model]` は新しいセッションを開始します。`/reset` はリセットのエイリアスです。
    - Control UI は、入力された `/new` をインターセプトして新しいダッシュボードセッションを作成し、それに切り替えます。入力された `/reset` は引き続き Gateway のインプレースリセットを実行します。
    - `/reset soft [message]` は現在のトランスクリプトを保持し、再利用された CLI バックエンドセッション ID を破棄し、起動/システムプロンプト読み込みをインプレースで再実行します。
    - `/compact [instructions]` はセッションコンテキストを圧縮します。[Compaction](/ja-JP/concepts/compaction) を参照してください。
    - `/stop` は現在の実行を中止します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` はスレッドバインディングの有効期限を管理します。
    - `/export-session [path]` は現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
    - `/export-trajectory [path]` は exec 承認を求め、その後、現在のセッションの JSONL [trajectory bundle](/ja-JP/tools/trajectory) をエクスポートします。1 つの OpenClaw セッションについて、プロンプト、ツール、トランスクリプトのタイムラインが必要な場合に使用します。グループチャットでは、承認プロンプトとエクスポート結果はオーナーに非公開で送信されます。エイリアス: `/trajectory`。

  </Accordion>
  <Accordion title="モデルと実行コントロール">
    - `/think <level>` は思考レベルを設定します。オプションはアクティブモデルのプロバイダープロファイルから取得されます。一般的なレベルは `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max`、またはバイナリの `on` などのカスタムレベルは、サポートされている場合にのみ使用できます。エイリアス: `/thinking`、`/t`。
    - `/verbose on|off|full` は詳細出力を切り替えます。エイリアス: `/v`。
    - `/trace on|off` は現在のセッションの Plugin トレース出力を切り替えます。
    - `/fast [status|on|off]` は高速モードを表示または設定します。
    - `/reasoning [on|off|stream]` は推論の可視性を切り替えます。エイリアス: `/reason`。
    - `/elevated [on|off|ask|full]` は elevated モードを切り替えます。エイリアス: `/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec デフォルトを表示または設定します。
    - `/model [name|#|status]` はモデルを表示または設定します。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` は、設定済み/認証で利用可能なプロバイダー、またはプロバイダーのモデルを一覧表示します。`all` を追加すると、そのプロバイダーの完全なカタログを閲覧できます。
    - `/queue <mode>` はキュー動作（`steer`、レガシー `queue`、`followup`、`collect`、`steer-backlog`、`interrupt`）に加え、`debounce:0.5s cap:25 drop:summarize` のようなオプションを管理します。`/queue default` または `/queue reset` はセッション上書きをクリアします。[コマンドキュー](/ja-JP/concepts/queue) と [Steering キュー](/ja-JP/concepts/queue-steering) を参照してください。
    - `/steer <message>` は、`/queue` モードに依存せず、現在のセッションのアクティブな実行にガイダンスを注入します。セッションがアイドル状態の場合、新しい実行は開始しません。エイリアス: `/tell`。[Steer](/ja-JP/tools/steer) を参照してください。

  </Accordion>
  <Accordion title="検出とステータス">
    - `/help` は短いヘルプ要約を表示します。
    - `/commands` は生成されたコマンドカタログを表示します。
    - `/tools [compact|verbose]` は現在のエージェントが今使用できるものを表示します。
    - `/status` は、`Execution`/`Runtime` ラベルや、利用可能な場合はプロバイダー使用量/クォータを含む実行/ランタイムステータスを表示します。
    - `/diagnostics [note]` は、Gateway バグと Codex ハーネス実行のためのオーナー専用サポートレポートフローです。`openclaw gateway diagnostics export --json` を実行する前に、毎回明示的な exec 承認を求めます。許可すべてのルールで diagnostics を承認しないでください。承認後、ローカルバンドルパス、マニフェスト要約、プライバシーノート、関連するセッション ID を含む貼り付け可能なレポートを送信します。グループチャットでは、承認プロンプトとレポートはオーナーに非公開で送信されます。アクティブセッションが OpenAI Codex ハーネスを使用している場合、同じ承認により関連する Codex フィードバックも OpenAI サーバーに送信され、完了した返信には OpenClaw セッション ID、Codex スレッド ID、`codex resume <thread-id>` コマンドが一覧表示されます。[Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。
    - `/crestodian <request>` は、オーナー DM から Crestodian セットアップおよび修復ヘルパーを実行します。
    - `/tasks` は現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
    - `/context [list|detail|json]` はコンテキストの組み立て方法を説明します。
    - `/whoami` は送信者 ID を表示します。エイリアス: `/id`。
    - `/usage off|tokens|full|cost` はレスポンスごとの使用量フッターを制御するか、ローカルのコスト要約を出力します。

  </Accordion>
  <Accordion title="Skills、許可リスト、承認">
    - `/skill <name> [input]` は名前で skill を実行します。
    - `/allowlist [list|add|remove] ...` は許可リストエントリを管理します。テキストのみ。
    - `/approve <id> <decision>` は exec 承認プロンプトを解決します。
    - `/btw <question>` は、今後のセッションコンテキストを変更せずに副次的な質問をします。エイリアス: `/side`。[BTW](/ja-JP/tools/btw) を参照してください。

  </Accordion>
  <Accordion title="サブエージェントと ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` は現在のセッションのサブエージェント実行を管理します。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は ACP セッションとランタイムオプションを管理します。
    - `/focus <target>` は現在の Discord スレッドまたは Telegram トピック/会話をセッションターゲットにバインドします。
    - `/unfocus` は現在のバインドを削除します。
    - `/agents` は現在のセッションにスレッドバインドされたエージェントを一覧表示します。
    - `/kill <id|#|all>` は実行中のサブエージェントを 1 つまたはすべて中止します。
    - `/subagents steer <id|#> <message>` は実行中のサブエージェントに指示を送信します。[指示](/ja-JP/tools/steer)を参照してください。

  </Accordion>
  <Accordion title="所有者限定の書き込みと管理">
    - `/config show|get|set|unset` は `openclaw.json` を読み取りまたは書き込みます。所有者限定です。`commands.config: true` が必要です。
    - `/mcp show|get|set|unset` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定を読み取りまたは書き込みます。所有者限定です。`commands.mcp: true` が必要です。
    - `/plugins list|inspect|show|get|install|enable|disable` は Plugin の状態を検査または変更します。`/plugin` はエイリアスです。書き込みは所有者限定です。`commands.plugins: true` が必要です。
    - `/debug show|set|unset|reset` はランタイム限定の設定オーバーライドを管理します。所有者限定です。`commands.debug: true` が必要です。
    - `/restart` は有効な場合に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定します。
    - `/send on|off|inherit` は送信ポリシーを設定します。所有者限定です。

  </Accordion>
  <Accordion title="音声、TTS、チャンネル制御">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` は TTS を制御します。[TTS](/ja-JP/tools/tts)を参照してください。
    - `/activation mention|always` はグループのアクティベーションモードを設定します。
    - `/bash <command>` はホストのシェルコマンドを実行します。テキストのみです。エイリアス: `! <command>`。`commands.bash: true` と `tools.elevated` 許可リストが必要です。
    - `!poll [sessionId]` はバックグラウンドの bash ジョブを確認します。
    - `!stop [sessionId]` はバックグラウンドの bash ジョブを停止します。

  </Accordion>
</AccordionGroup>

### 生成された dock コマンド

dock コマンドは、現在のセッションの返信ルートを別のリンク済み
チャンネルへ切り替えます。セットアップ、例、トラブルシューティングについては
[チャンネルのドッキング](/ja-JP/concepts/channel-docking)を参照してください。

dock コマンドは、ネイティブコマンド対応のチャンネル Plugin から生成されます。現在バンドルされているセット:

- `/dock-discord` (エイリアス: `/dock_discord`)
- `/dock-mattermost` (エイリアス: `/dock_mattermost`)
- `/dock-slack` (エイリアス: `/dock_slack`)
- `/dock-telegram` (エイリアス: `/dock_telegram`)

ダイレクトチャットから dock コマンドを使うと、現在のセッションの返信ルートを別のリンク済みチャンネルに切り替えられます。エージェントは同じセッションコンテキストを維持しますが、そのセッションの以降の返信は選択されたチャンネルのピアに配信されます。

dock コマンドには `session.identityLinks` が必要です。送信元送信者とターゲットピアは、たとえば `["telegram:123", "discord:456"]` のように同じ ID グループ内にある必要があります。id `123` の Telegram ユーザーが `/dock_discord` を送信すると、OpenClaw はアクティブなセッションに `lastChannel: "discord"` と `lastTo: "456"` を保存します。送信者が Discord ピアにリンクされていない場合、コマンドは通常のチャットにフォールスルーせず、セットアップのヒントを返信します。

ドッキングはアクティブなセッションルートだけを変更します。チャンネルアカウントの作成、アクセス権の付与、チャンネル許可リストの回避、トランスクリプト履歴の別セッションへの移動は行いません。ルートを再度切り替えるには、`/dock-telegram`、`/dock-slack`、`/dock-mattermost`、または別の生成済み dock コマンドを使用します。

### バンドル済み Plugin コマンド

バンドル済み Plugin はさらに多くのスラッシュコマンドを追加できます。このリポジトリに現在バンドルされているコマンド:

- `/dreaming [on|off|status|help]` はメモリ Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming)を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` はデバイスのペアリング/セットアップフローを管理します。[ペアリング](/ja-JP/channels/pairing)を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` はリスクの高い電話ノードコマンドを一時的に有効化します。
- `/voice status|list [limit]|set <voiceId|name>` は Talk 音声設定を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE リッチカードプリセットを送信します。[LINE](/ja-JP/channels/line)を参照してください。
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` はバンドル済み Codex アプリサーバーハーネスを検査および制御します。[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。
- QQBot 限定コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的 Skills コマンド

ユーザーが呼び出せる Skills もスラッシュコマンドとして公開されます:

- `/skill <name> [input]` は汎用エントリポイントとして常に機能します。
- skill/Plugin が登録している場合、Skills は `/prose` のような直接コマンドとしても表示されることがあります。
- ネイティブ skill コマンド登録は `commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` によって制御されます。
- コマンド仕様では、Discord を含むローカライズ済み説明をサポートするネイティブサーフェス向けに `descriptionLocalizations` を指定できます。

<AccordionGroup>
  <Accordion title="引数とパーサーのメモ">
    - コマンドでは、コマンドと引数の間に省略可能な `:` を受け付けます (例: `/think: high`、`/send: on`、`/help:`)。
    - `/new <model>` はモデルエイリアス、`provider/model`、またはプロバイダー名 (ファジーマッチ) を受け付けます。一致しない場合、テキストはメッセージ本文として扱われます。
    - プロバイダー使用量の完全な内訳を見るには、`openclaw status --usage` を使用します。
    - `/allowlist add|remove` には `commands.config=true` が必要で、チャンネルの `configWrites` に従います。
    - 複数アカウントのチャンネルでは、設定対象を指定する `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も、対象アカウントの `configWrites` に従います。
    - `/usage` は応答ごとの使用量フッターを制御します。`/usage cost` は OpenClaw セッションログからローカルコスト概要を出力します。
    - `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定します。
    - `/plugins install <spec>` は `openclaw plugins install` と同じ Plugin 仕様を受け付けます: ローカルパス/アーカイブ、npm パッケージ、`git:<repo>`、または `clawhub:<pkg>`。その後、Plugin ソースモジュールが変更されたため Gateway の再起動を要求します。
    - `/plugins enable|disable` は Plugin 設定を更新し、新しいエージェントターン向けに Gateway Plugin の再読み込みをトリガーします。

  </Accordion>
  <Accordion title="チャンネル固有の挙動">
    - Discord 限定のネイティブコマンド: `/vc join|leave|status` は音声チャンネルを制御します (テキストとしては利用できません)。`join` にはギルドと選択済みの音声/ステージチャンネルが必要です。`channels.discord.voice` とネイティブコマンドが必要です。
    - Discord スレッドバインディングコマンド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`) には、有効なスレッドバインディングが有効化されている必要があります (`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`)。
    - ACP コマンドリファレンスとランタイム挙動: [ACP エージェント](/ja-JP/tools/acp-agents)。

  </Accordion>
  <Accordion title="verbose / trace / fast / reasoning の安全性">
    - `/verbose` はデバッグと追加の可視性を目的としています。通常利用では **off** のままにしてください。
    - `/trace` は `/verbose` より範囲が狭く、Plugin 所有のトレース/デバッグ行だけを表示し、通常の詳細なツール雑音は off のままにします。
    - `/fast on|off` はセッションオーバーライドを永続化します。これをクリアして設定デフォルトに戻すには、Sessions UI の `inherit` オプションを使用します。
    - `/fast` はプロバイダー固有です。OpenAI/OpenAI Codex はネイティブ Responses エンドポイントでこれを `service_tier=priority` にマッピングします。一方、`api.anthropic.com` に送信される OAuth 認証済みトラフィックを含む直接の公開 Anthropic リクエストでは、`service_tier=auto` または `standard_only` にマッピングされます。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic)を参照してください。
    - ツール失敗の概要は関連がある場合には引き続き表示されますが、詳細な失敗テキストは `/verbose` が `on` または `full` の場合にのみ含まれます。
    - `/reasoning`、`/verbose`、`/trace` はグループ設定ではリスクがあります。公開する意図のない内部 reasoning、ツール出力、または Plugin 診断が表示される可能性があります。特にグループチャットでは、off のままにすることを推奨します。

  </Accordion>
  <Accordion title="モデル切り替え">
    - `/model` は新しいセッションモデルを即座に永続化します。
    - エージェントがアイドル状態の場合、次の実行ですぐに使用されます。
    - 実行がすでにアクティブな場合、OpenClaw はライブ切り替えを保留中としてマークし、クリーンな再試行ポイントでのみ新しいモデルに再起動します。
    - ツールアクティビティまたは返信出力がすでに開始している場合、保留中の切り替えは後の再試行機会または次のユーザーターンまでキューに残ることがあります。
    - ローカル TUI では、`/crestodian [request]` は通常のエージェント TUI から Crestodian に戻ります。これはメッセージチャンネルのレスキューモードとは別であり、リモート設定権限を付与しません。

  </Accordion>
  <Accordion title="高速パスとインラインショートカット">
    - **高速パス:** 許可リスト登録済み送信者からのコマンドのみのメッセージは即座に処理されます (キュー + モデルをバイパス)。
    - **グループメンションゲート:** 許可リスト登録済み送信者からのコマンドのみのメッセージはメンション要件をバイパスします。
    - **インラインショートカット (許可リスト登録済み送信者のみ):** 一部のコマンドは通常のメッセージに埋め込まれていても機能し、モデルが残りのテキストを見る前に取り除かれます。
      - 例: `hey /status` はステータス返信をトリガーし、残りのテキストは通常のフローを続行します。
    - 現在: `/help`、`/commands`、`/status`、`/whoami` (`/id`)。
    - 権限のないコマンドのみのメッセージは黙って無視され、インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="Skill コマンドとネイティブ引数">
    - **Skill コマンド:** `user-invocable` Skills はスラッシュコマンドとして公開されます。名前は `a-z0-9_` にサニタイズされます (最大 32 文字)。衝突には数値サフィックスが付きます (例: `_2`)。
      - `/skill <name> [input]` は名前で Skill を実行します (ネイティブコマンドの制限により Skill ごとのコマンドを使えない場合に便利です)。
      - デフォルトでは、Skill コマンドは通常のリクエストとしてモデルに転送されます。
      - Skills は任意で `command-dispatch: tool` を宣言して、コマンドをツールに直接ルーティングできます (決定的、モデルなし)。
      - 例: `/prose` (OpenProse Plugin) — [OpenProse](/ja-JP/prose)を参照してください。
    - **ネイティブコマンド引数:** Discord は動的オプションにオートコンプリートを使用します (必須引数を省略した場合はボタンメニューも使用します)。Telegram と Slack は、コマンドが選択肢をサポートしていて引数を省略した場合にボタンメニューを表示します。動的な選択肢はターゲットセッションモデルに対して解決されるため、`/think` レベルのようなモデル固有オプションは、そのセッションの `/model` オーバーライドに従います。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` は設定に関する質問ではなく、ランタイムに関する質問に答えます: **この会話で、このエージェントが今使えるもの**。

- デフォルトの `/tools` はコンパクトで、すばやいスキャンに最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンドサーフェスは、`compact|verbose` と同じモード切り替えを公開します。
- 結果はセッションスコープのため、エージェント、チャンネル、スレッド、送信者権限、モデルを変更すると出力が変わることがあります。
- `/tools` には、コアツール、接続済み Plugin ツール、チャンネル所有ツールなど、ランタイムで実際に到達可能なツールが含まれます。

プロファイルとオーバーライドの編集には、`/tools` を静的カタログとして扱うのではなく、Control UI Tools パネルまたは設定/カタログサーフェスを使用します。

## 使用量サーフェス (どこに何が表示されるか)

- **プロバイダーの使用量/クォータ**（例: "Claude 80% left"）は、使用量追跡が有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。OpenClaw はプロバイダーのウィンドウを `% left` に正規化します。MiniMax では、残量のみのパーセントフィールドは表示前に反転され、`model_remains` レスポンスではチャットモデルのエントリとモデルタグ付きのプランラベルが優先されます。
- **トークン/キャッシュ行** は、ライブセッションのスナップショットがまばらな場合、最新のトランスクリプト使用量エントリにフォールバックできます。既存の非ゼロのライブ値が引き続き優先され、トランスクリプトのフォールバックでは、保存済み合計が存在しないか小さい場合に、アクティブなランタイムモデルラベルと、より大きいプロンプト指向の合計も復元できます。
- **実行とランタイム:** `/status` は、有効なサンドボックスパスについて `Execution` を、実際にセッションを実行しているものについて `Runtime` を報告します: `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンド。
- **レスポンスごとのトークン/コスト** は `/usage off|tokens|full` で制御されます（通常の返信に付加されます）。
- `/model status` は **モデル/認証/エンドポイント** に関するものであり、使用量に関するものではありません。

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

注記:

- `/model` と `/model list` は、コンパクトな番号付きピッカー（モデルファミリー + 利用可能なプロバイダー）を表示します。
- Discord では、`/model` と `/models` が、プロバイダーとモデルのドロップダウン、および送信ステップを含むインタラクティブなピッカーを開きます。
- `/model <#>` はそのピッカーから選択します（可能な場合は現在のプロバイダーを優先します）。
- `/model status` は、利用可能な場合に設定済みのプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）を含む詳細ビューを表示します。

## デバッグオーバーライド

`/debug` では **ランタイム専用** の設定オーバーライド（ディスクではなくメモリ）を設定できます。所有者専用です。デフォルトでは無効です。`commands.debug: true` で有効化します。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
オーバーライドは新しい設定読み取りに即時適用されますが、`openclaw.json` には書き込まれません。すべてのオーバーライドをクリアしてディスク上の設定に戻すには、`/debug reset` を使用します。
</Note>

## Plugin トレース出力

`/trace` では、完全な冗長モードをオンにせずに、**セッションスコープの plugin トレース/デバッグ行** を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注記:

- 引数なしの `/trace` は、現在のセッションのトレース状態を表示します。
- `/trace on` は、現在のセッションで plugin トレース行を有効にします。
- `/trace off` は、それらを再び無効にします。
- Plugin トレース行は `/status` に表示されたり、通常のアシスタント返信後のフォローアップ診断メッセージとして表示されたりすることがあります。
- `/trace` は `/debug` を置き換えるものではありません。`/debug` は引き続きランタイム専用の設定オーバーライドを管理します。
- `/trace` は `/verbose` を置き換えるものではありません。通常の冗長なツール/ステータス出力は引き続き `/verbose` に属します。

## 設定更新

`/config` はディスク上の設定（`openclaw.json`）に書き込みます。所有者専用です。デフォルトでは無効です。`commands.config: true` で有効化します。

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

`/mcp` は、OpenClaw 管理の MCP サーバー定義を `mcp.servers` 配下に書き込みます。所有者専用です。デフォルトでは無効です。`commands.mcp: true` で有効化します。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` は設定を Pi 所有のプロジェクト設定ではなく OpenClaw 設定に保存します。実際に実行可能なトランスポートはランタイムアダプターが決定します。
</Note>

## Plugin 更新

`/plugins` では、オペレーターが検出された plugins を調べ、設定内の有効化状態を切り替えられます。読み取り専用フローでは `/plugin` をエイリアスとして使用できます。デフォルトでは無効です。`commands.plugins: true` で有効化します。

例:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` と `/plugins show` は、現在のワークスペースとディスク上の設定に対して実際の plugin 検出を使用します。
- `/plugins install` は ClawHub、npm、git、ローカルディレクトリ、アーカイブからインストールします。
- `/plugins enable|disable` は plugin 設定のみを更新します。plugins をインストールまたはアンインストールするものではありません。
- 有効化と無効化の変更は、新しいエージェントターン向けに Gateway の plugin ランタイムサーフェスをホットリロードします。インストールでは plugin ソースモジュールが変更されるため、Gateway の再起動が要求されます。

</Note>

## サーフェスの注記

<AccordionGroup>
  <Accordion title="サーフェスごとのセッション">
    - **テキストコマンド** は通常のチャットセッションで実行されます（DM は `main` を共有し、グループは独自のセッションを持ちます）。
    - **ネイティブコマンド** は分離されたセッションを使用します:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
      - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` を介してチャットセッションを対象にします）
    - **`/stop`** はアクティブなチャットセッションを対象にするため、現在の実行を中止できます。

  </Accordion>
  <Accordion title="Slack の詳細">
    `channels.slack.slashCommand` は、単一の `/openclaw` スタイルのコマンド向けに引き続きサポートされています。`commands.native` を有効にする場合は、組み込みコマンドごとに 1 つの Slack スラッシュコマンド（`/help` と同じ名前）を作成する必要があります。Slack のコマンド引数メニューは、一時的な Block Kit ボタンとして配信されます。

    Slack ネイティブの例外: Slack は `/status` を予約しているため、`/agentstatus`（`/status` ではない）を登録してください。テキストの `/status` は Slack メッセージ内で引き続き機能します。

  </Accordion>
</AccordionGroup>

## BTW サイド質問

`/btw` は、現在のセッションに関するすばやい **サイド質問** です。`/side` はエイリアスです。

通常のチャットとは異なります:

- 現在のセッションを背景コンテキストとして使用します。
- 別個の **ツールなし** の一回限りの呼び出しとして実行されます。
- 将来のセッションコンテキストを変更しません。
- トランスクリプト履歴には書き込まれません。
- 通常のアシスタントメッセージではなく、ライブのサイド結果として配信されます。

そのため `/btw` は、メインタスクを継続しながら一時的な確認をしたい場合に便利です。

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
