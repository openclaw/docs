---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
sidebarTitle: Slash commands
summary: 'スラッシュコマンド: テキスト方式とネイティブ方式、設定、サポートされるコマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-05-03T21:39:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fbdd76ccd43159cabfbc3f15f7bddd2a7ada07fcd6eea2e169d2d88df18f28c
    source_path: tools/slash-commands.md
    workflow: 16
---

コマンドは Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる **単独** のメッセージとして送信する必要があります。ホスト専用の bash チャットコマンドは `! <cmd>` を使用します（`/bash <cmd>` はエイリアスです）。

会話またはスレッドが ACP セッションにバインドされている場合、通常のフォローアップテキストはその ACP ハーネスにルーティングされます。Gateway 管理コマンドは引き続きローカルに留まります。`/acp ...` は常に OpenClaw ACP コマンドハンドラーに届き、`/status` と `/unfocus` は、そのサーフェスでコマンド処理が有効な場合は常にローカルに留まります。

関連するシステムは 2 つあります。

<AccordionGroup>
  <Accordion title="コマンド">
    単独の `/...` メッセージ。
  </Accordion>
  <Accordion title="ディレクティブ">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - ディレクティブは、モデルが見る前にメッセージから取り除かれます。
    - 通常のチャットメッセージ（ディレクティブのみではないもの）では、「インラインヒント」として扱われ、セッション設定は永続化されません。
    - ディレクティブのみのメッセージ（メッセージにディレクティブだけが含まれる場合）では、セッションに永続化され、確認応答を返します。
    - ディレクティブは **認可済み送信者** に対してのみ適用されます。`commands.allowFrom` が設定されている場合、それが使用される唯一の許可リストです。それ以外の場合、認可はチャンネル許可リスト/ペアリングと `commands.useAccessGroups` から決まります。認可されていない送信者のディレクティブはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="インラインショートカット">
    許可リスト登録済み/認可済み送信者のみ: `/help`, `/commands`, `/status`, `/whoami` (`/id`)。

    これらは即座に実行され、モデルがメッセージを見る前に取り除かれ、残りのテキストは通常のフローで続行されます。

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
  ネイティブコマンドを登録します。自動: Discord/Telegram ではオン、Slack ではオフ（スラッシュコマンドを追加するまで）、ネイティブ対応のないプロバイダーでは無視されます。プロバイダーごとに上書きするには、`channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（bool または `"auto"`）。Discord では、`false` にすると起動時のスラッシュコマンド登録とクリーンアップをスキップします。以前に登録されたコマンドは、Discord アプリから削除するまで表示されたままになる場合があります。Slack コマンドは Slack アプリで管理され、自動的には削除されません。
</ParamField>
Discord では、ネイティブコマンド仕様に `descriptionLocalizations` を含めることができ、OpenClaw はそれを Discord `description_localizations` として公開し、照合比較に含めます。
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  サポートされている場合、**skill** コマンドをネイティブに登録します。自動: Discord/Telegram ではオン、Slack ではオフ（Slack では skill ごとにスラッシュコマンドを作成する必要があります）。プロバイダーごとに上書きするには、`channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（bool または `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` でホストシェルコマンドを実行できるようにします（`/bash <cmd>` はエイリアスです。`tools.elevated` 許可リストが必要です）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash がバックグラウンドモードに切り替わるまで待つ時間を制御します（`0` は即座にバックグラウンド化します）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` を読み書きします）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定を読み書きします）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（plugin の検出/ステータスに加え、インストールおよび有効化/無効化コントロール）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（実行時のみの上書き）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と gateway 再起動ツールアクションを有効にします。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  オーナー専用コマンド/ツールサーフェス用の明示的なオーナー許可リストを設定します。これは、危険なアクションを承認し、`/diagnostics`、`/export-trajectory`、`/config` などのコマンドを実行できる人間のオペレーターアカウントです。`commands.allowFrom` や DM ペアリングアクセスとは別です。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごと: そのサーフェスでオーナー専用コマンドを実行するには **オーナー ID** を必須にします。`true` の場合、送信者は解決済みのオーナー候補（たとえば `commands.ownerAllowFrom` のエントリーまたはプロバイダーネイティブのオーナーメタデータ）に一致するか、内部メッセージチャンネルで内部 `operator.admin` スコープを保持している必要があります。チャンネル `allowFrom` のワイルドカードエントリー、または空/未解決のオーナー候補リストだけでは **不十分** です。オーナー専用コマンドはそのチャンネルで fail closed します。オーナー専用コマンドを `ownerAllowFrom` と標準のコマンド許可リストだけで制御したい場合は、これをオフのままにしてください。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプトでオーナー ID をどのように表示するかを制御します。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay="hash"` の場合に使用される HMAC シークレットを任意で設定します。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  コマンド認可用のプロバイダーごとの許可リストです。設定されている場合、コマンドとディレクティブの唯一の認可ソースになります（チャンネル許可リスト/ペアリングと `commands.useAccessGroups` は無視されます）。グローバルデフォルトには `"*"` を使用します。プロバイダー固有のキーがそれを上書きします。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合に、コマンドに対して許可リスト/ポリシーを適用します。
</ParamField>

## コマンド一覧

現在の信頼できるソース:

- core 組み込みは `src/auto-reply/commands-registry.shared.ts` から取得されます
- 生成された dock コマンドは `src/auto-reply/commands-registry.data.ts` から取得されます
- plugin コマンドは plugin の `registerCommand()` 呼び出しから取得されます
- gateway での実際の利用可否は、引き続き設定フラグ、チャンネルサーフェス、インストール済み/有効化済み plugin に依存します

### Core 組み込みコマンド

<AccordionGroup>
  <Accordion title="セッションと実行">
    - `/new [model]` は新しいセッションを開始します。`/reset` はリセットエイリアスです。
    - Control UI は、入力された `/new` をインターセプトして新しいダッシュボードセッションを作成し、それに切り替えます。入力された `/reset` は引き続き Gateway のインプレースリセットを実行します。
    - `/reset soft [message]` は現在のトランスクリプトを保持し、再利用された CLI バックエンドセッション ID を破棄し、起動/システムプロンプト読み込みをインプレースで再実行します。
    - `/compact [instructions]` はセッションコンテキストを compact します。[Compaction](/ja-JP/concepts/compaction) を参照してください。
    - `/stop` は現在の実行を中止します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` はスレッドバインディングの有効期限を管理します。
    - `/export-session [path]` は現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
    - `/export-trajectory [path]` は exec 承認を要求してから、現在のセッション用に JSONL の [trajectory bundle](/ja-JP/tools/trajectory) をエクスポートします。1 つの OpenClaw セッションのプロンプト、ツール、トランスクリプトのタイムラインが必要な場合に使用します。グループチャットでは、承認プロンプトとエクスポート結果はオーナーに非公開で送信されます。エイリアス: `/trajectory`。

  </Accordion>
  <Accordion title="モデルと実行コントロール">
    - `/think <level>` は思考レベルを設定します。オプションはアクティブモデルのプロバイダープロファイルから取得されます。一般的なレベルは `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max`、またはバイナリの `on` などのカスタムレベルはサポートされている場合にのみ使用できます。エイリアス: `/thinking`, `/t`。
    - `/verbose on|off|full` は詳細出力を切り替えます。エイリアス: `/v`。
    - `/trace on|off` は現在のセッションの plugin トレース出力を切り替えます。
    - `/fast [status|on|off]` は高速モードを表示または設定します。
    - `/reasoning [on|off|stream]` は reasoning の可視性を切り替えます。エイリアス: `/reason`。
    - `/elevated [on|off|ask|full]` は elevated モードを切り替えます。エイリアス: `/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec のデフォルトを表示または設定します。
    - `/model [name|#|status]` はモデルを表示または設定します。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` は設定済み/認証利用可能なプロバイダー、またはプロバイダーのモデルを一覧表示します。`all` を追加すると、そのプロバイダーの完全なカタログを参照できます。
    - `/queue <mode>` はキュー動作（`steer`、レガシー `queue`、`followup`、`collect`、`steer-backlog`、`interrupt`）に加え、`debounce:0.5s cap:25 drop:summarize` のようなオプションを管理します。`/queue default` または `/queue reset` はセッション上書きをクリアします。[コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

  </Accordion>
  <Accordion title="検出とステータス">
    - `/help` は短いヘルプ概要を表示します。
    - `/commands` は生成されたコマンドカタログを表示します。
    - `/tools [compact|verbose]` は現在のエージェントが今使えるものを表示します。
    - `/status` は実行/ランタイムステータスを表示します。利用可能な場合は `Execution`/`Runtime` ラベルとプロバイダーの使用量/クォータを含みます。
    - `/diagnostics [note]` は、Gateway バグと Codex ハーネス実行向けのオーナー専用サポートレポートフローです。`openclaw gateway diagnostics export --json` を実行する前に、毎回明示的な exec 承認を要求します。allow-all ルールで diagnostics を承認しないでください。承認後、ローカルバンドルパス、マニフェスト概要、プライバシーノート、関連するセッション ID を含む貼り付け可能なレポートを送信します。グループチャットでは、承認プロンプトとレポートはオーナーに非公開で送信されます。アクティブセッションが OpenAI Codex ハーネスを使用している場合、同じ承認によって関連する Codex フィードバックも OpenAI サーバーに送信され、完了した返信には OpenClaw セッション ID、Codex スレッド ID、`codex resume <thread-id>` コマンドが一覧表示されます。[Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。
    - `/crestodian <request>` はオーナー DM から Crestodian セットアップおよび修復ヘルパーを実行します。
    - `/tasks` は現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
    - `/context [list|detail|json]` はコンテキストがどのように組み立てられるかを説明します。
    - `/whoami` は送信者 ID を表示します。エイリアス: `/id`。
    - `/usage off|tokens|full|cost` は応答ごとの使用量フッターを制御するか、ローカルコスト概要を出力します。

  </Accordion>
  <Accordion title="Skills、許可リスト、承認">
    - `/skill <name> [input]` は名前で skill を実行します。
    - `/allowlist [list|add|remove] ...` は許可リストエントリーを管理します。テキストのみ。
    - `/approve <id> <decision>` は exec 承認プロンプトを解決します。
    - `/btw <question>` は今後のセッションコンテキストを変更せずに補足質問を行います。エイリアス: `/side`。[BTW](/ja-JP/tools/btw) を参照してください。

  </Accordion>
  <Accordion title="サブエージェントと ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` は現在のセッションのサブエージェント実行を管理します。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は ACP セッションとランタイムオプションを管理します。
    - `/focus <target>` は現在の Discord スレッドまたは Telegram トピック/会話をセッションターゲットに紐付けます。
    - `/unfocus` は現在の紐付けを削除します。
    - `/agents` は現在のセッションにスレッド紐付けされたエージェントを一覧表示します。
    - `/kill <id|#|all>` は実行中のサブエージェントを1つまたはすべて中止します。
    - `/steer <id|#> <message>` は実行中のサブエージェントに誘導メッセージを送信します。エイリアス: `/tell`。

  </Accordion>
  <Accordion title="オーナー専用の書き込みと管理">
    - `/config show|get|set|unset` は `openclaw.json` を読み書きします。オーナー専用です。`commands.config: true` が必要です。
    - `/mcp show|get|set|unset` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定を読み書きします。オーナー専用です。`commands.mcp: true` が必要です。
    - `/plugins list|inspect|show|get|install|enable|disable` は Plugin の状態を検査または変更します。`/plugin` はエイリアスです。書き込みはオーナー専用です。`commands.plugins: true` が必要です。
    - `/debug show|set|unset|reset` はランタイム専用の設定オーバーライドを管理します。オーナー専用です。`commands.debug: true` が必要です。
    - `/restart` は有効な場合に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定します。
    - `/send on|off|inherit` は送信ポリシーを設定します。オーナー専用です。

  </Accordion>
  <Accordion title="音声、TTS、チャネル制御">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` は TTS を制御します。[TTS](/ja-JP/tools/tts) を参照してください。
    - `/activation mention|always` はグループのアクティベーションモードを設定します。
    - `/bash <command>` はホストのシェルコマンドを実行します。テキスト専用です。エイリアス: `! <command>`。`commands.bash: true` と `tools.elevated` の許可リストが必要です。
    - `!poll [sessionId]` はバックグラウンドの bash ジョブを確認します。
    - `!stop [sessionId]` はバックグラウンドの bash ジョブを停止します。

  </Accordion>
</AccordionGroup>

### 生成されるドックコマンド

ドックコマンドは、現在のセッションの返信先ルートを別のリンク済み
チャネルへ切り替えます。設定、例、トラブルシューティングについては
[チャネルドッキング](/ja-JP/concepts/channel-docking) を参照してください。

ドックコマンドは、ネイティブコマンド対応のチャネル Plugin から生成されます。現在バンドルされているセット:

- `/dock-discord` (エイリアス: `/dock_discord`)
- `/dock-mattermost` (エイリアス: `/dock_mattermost`)
- `/dock-slack` (エイリアス: `/dock_slack`)
- `/dock-telegram` (エイリアス: `/dock_telegram`)

ダイレクトチャットからドックコマンドを使うと、現在のセッションの返信先ルートを別のリンク済みチャネルに切り替えられます。エージェントは同じセッションコンテキストを保持しますが、そのセッションの以後の返信は選択したチャネルピアに配信されます。

ドックコマンドには `session.identityLinks` が必要です。送信元の送信者とターゲットピアは、たとえば `["telegram:123", "discord:456"]` のように同じ ID グループに属している必要があります。id `123` の Telegram ユーザーが `/dock_discord` を送信すると、OpenClaw はアクティブなセッションに `lastChannel: "discord"` と `lastTo: "456"` を保存します。送信者が Discord ピアにリンクされていない場合、通常のチャットにフォールスルーするのではなく、セットアップのヒントを返します。

ドッキングはアクティブなセッションルートだけを変更します。チャネルアカウントの作成、アクセス権の付与、チャネル許可リストのバイパス、トランスクリプト履歴の別セッションへの移動は行いません。ルートを再度切り替えるには、`/dock-telegram`、`/dock-slack`、`/dock-mattermost`、または別の生成済みドックコマンドを使います。

### バンドル Plugin コマンド

バンドル Plugin はさらにスラッシュコマンドを追加できます。このリポジトリに現在バンドルされているコマンド:

- `/dreaming [on|off|status|help]` はメモリ Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` はデバイスのペアリング/セットアップフローを管理します。[ペアリング](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` は高リスクの電話ノードコマンドを一時的に有効化します。
- `/voice status|list [limit]|set <voiceId|name>` は Talk 音声設定を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE リッチカードプリセットを送信します。[LINE](/ja-JP/channels/line) を参照してください。
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` は、バンドルされている Codex アプリサーバーハーネスを検査および制御します。[Codex ハーネス](/ja-JP/plugins/codex-harness) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的 Skills コマンド

ユーザーが呼び出せる Skills もスラッシュコマンドとして公開されます。

- `/skill <name> [input]` は汎用エントリポイントとして常に機能します。
- Skill/Plugin が登録している場合、Skills は `/prose` のような直接コマンドとしても表示されることがあります。
- ネイティブ Skill コマンドの登録は `commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` で制御されます。
- コマンド仕様は、Discord などローカライズ済み説明に対応するネイティブサーフェス向けに `descriptionLocalizations` を提供できます。

<AccordionGroup>
  <Accordion title="引数とパーサーに関する注記">
    - コマンドは、コマンドと引数の間に任意で `:` を受け付けます (例: `/think: high`、`/send: on`、`/help:`)。
    - `/new <model>` はモデルエイリアス、`provider/model`、またはプロバイダー名 (あいまい一致) を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - プロバイダー使用状況の完全な内訳を見るには、`openclaw status --usage` を使います。
    - `/allowlist add|remove` には `commands.config=true` が必要で、チャネルの `configWrites` に従います。
    - マルチアカウントチャネルでは、設定を対象にした `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も、対象アカウントの `configWrites` に従います。
    - `/usage` はレスポンスごとの使用状況フッターを制御します。`/usage cost` は OpenClaw セッションログからローカルコスト概要を出力します。
    - `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定します。
    - `/plugins install <spec>` は `openclaw plugins install` と同じ Plugin 仕様を受け付けます: ローカルパス/アーカイブ、npm パッケージ、`git:<repo>`、または `clawhub:<pkg>`。その後、Plugin ソースモジュールが変更されたため Gateway の再起動を要求します。
    - `/plugins enable|disable` は Plugin 設定を更新し、新しいエージェントターン向けに Gateway Plugin の再読み込みをトリガーします。

  </Accordion>
  <Accordion title="チャネル固有の動作">
    - Discord 専用ネイティブコマンド: `/vc join|leave|status` は音声チャネルを制御します (テキストとしては利用できません)。`join` には guild と選択済みの音声/ステージチャネルが必要です。`channels.discord.voice` とネイティブコマンドが必要です。
    - Discord のスレッド紐付けコマンド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`) には、有効なスレッド紐付けが有効化されている必要があります (`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`)。
    - ACP コマンドリファレンスとランタイム動作: [ACP エージェント](/ja-JP/tools/acp-agents)。

  </Accordion>
  <Accordion title="詳細 / トレース / 高速 / reasoning の安全性">
    - `/verbose` はデバッグと追加の可視性を目的としています。通常利用では **off** のままにしてください。
    - `/trace` は `/verbose` より範囲が狭く、Plugin 所有の trace/debug 行だけを表示し、通常の詳細なツール出力はオフのままにします。
    - `/fast on|off` はセッションオーバーライドを永続化します。クリアして設定デフォルトに戻すには、Sessions UI の `inherit` オプションを使います。
    - `/fast` はプロバイダー固有です。OpenAI/OpenAI Codex はネイティブ Responses エンドポイントで `service_tier=priority` にマップします。一方、`api.anthropic.com` に送信される OAuth 認証済みトラフィックを含む直接のパブリック Anthropic リクエストは、`service_tier=auto` または `standard_only` にマップします。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
    - ツール失敗の概要は関連する場合に引き続き表示されますが、詳細な失敗テキストは `/verbose` が `on` または `full` の場合のみ含まれます。
    - `/reasoning`、`/verbose`、`/trace` はグループ設定ではリスクがあります。公開するつもりのなかった内部 reasoning、ツール出力、または Plugin 診断を表示する可能性があります。特にグループチャットでは、オフのままにすることを推奨します。

  </Accordion>
  <Accordion title="モデル切り替え">
    - `/model` は新しいセッションモデルを即座に永続化します。
    - エージェントがアイドル状態の場合、次の実行はすぐにそれを使用します。
    - 実行がすでにアクティブな場合、OpenClaw はライブ切り替えを保留中としてマークし、クリーンなリトライポイントでのみ新しいモデルに再起動します。
    - ツールアクティビティまたは返信出力がすでに開始している場合、保留中の切り替えは後のリトライ機会または次のユーザーターンまでキューに残ることがあります。
    - ローカル TUI では、`/crestodian [request]` は通常のエージェント TUI から Crestodian に戻ります。これはメッセージチャネルのレスキューモードとは別であり、リモート設定権限を付与しません。

  </Accordion>
  <Accordion title="高速パスとインラインショートカット">
    - **高速パス:** 許可リストに含まれる送信者からのコマンドのみのメッセージは即座に処理されます (キュー + モデルをバイパス)。
    - **グループメンションゲーティング:** 許可リストに含まれる送信者からのコマンドのみのメッセージはメンション要件をバイパスします。
    - **インラインショートカット (許可リストに含まれる送信者のみ):** 特定のコマンドは通常のメッセージに埋め込まれている場合も機能し、モデルが残りのテキストを見る前に取り除かれます。
      - 例: `hey /status` はステータス返信をトリガーし、残りのテキストは通常フローで継続します。
    - 現在: `/help`、`/commands`、`/status`、`/whoami` (`/id`)。
    - 未承認のコマンドのみのメッセージは黙って無視され、インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="Skill コマンドとネイティブ引数">
    - **Skill コマンド:** `user-invocable` Skills はスラッシュコマンドとして公開されます。名前は `a-z0-9_` にサニタイズされます (最大32文字)。衝突した場合は数値サフィックスが付きます (例: `_2`)。
      - `/skill <name> [input]` は名前で Skill を実行します (ネイティブコマンドの制限により Skill ごとのコマンドを使えない場合に便利です)。
      - デフォルトでは、Skill コマンドは通常のリクエストとしてモデルに転送されます。
      - Skills は任意で `command-dispatch: tool` を宣言し、コマンドを直接ツールにルーティングできます (決定的、モデルなし)。
      - 例: `/prose` (OpenProse Plugin) — [OpenProse](/ja-JP/prose) を参照してください。
    - **ネイティブコマンド引数:** Discord は動的オプションにオートコンプリートを使います (必須引数を省略した場合はボタンメニューも使います)。Telegram と Slack は、コマンドが選択肢をサポートしていて引数を省略した場合にボタンメニューを表示します。動的な選択肢はターゲットセッションモデルに対して解決されるため、`/think` レベルなどのモデル固有オプションはそのセッションの `/model` オーバーライドに従います。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` は設定に関する質問ではなく、ランタイムに関する質問、つまり **このエージェントがこの会話で今すぐ何を使えるか** に答えます。

- デフォルトの `/tools` はコンパクトで、素早く確認しやすいよう最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンドサーフェスは、`compact|verbose` と同じモード切り替えを公開します。
- 結果はセッションスコープのため、エージェント、チャネル、スレッド、送信者の認可、またはモデルを変更すると出力が変わる可能性があります。
- `/tools` には、コアツール、接続済み Plugin ツール、チャネル所有ツールなど、ランタイムで実際に到達可能なツールが含まれます。

プロファイルとオーバーライドを編集する場合は、`/tools` を静的カタログとして扱うのではなく、Control UI の Tools パネルまたは設定/カタログサーフェスを使います。

## 使用状況サーフェス (どこに何が表示されるか)

- **プロバイダーの使用量/クォータ**（例: "Claude 80% left"）は、使用量トラッキングが有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。OpenClaw はプロバイダーのウィンドウを `% left` に正規化します。MiniMax では、残量のみのパーセントフィールドは表示前に反転され、`model_remains` 応答ではチャットモデルのエントリと、モデルタグ付きのプランラベルが優先されます。
- **トークン/キャッシュ行** は、ライブセッションのスナップショットが疎な場合、最新のトランスクリプト使用量エントリへフォールバックできます。既存の非ゼロのライブ値は引き続き優先されます。また、保存された合計が欠落しているか小さい場合、トランスクリプトのフォールバックは、アクティブなランタイムモデルラベルと、プロンプト向けのより大きい合計も復元できます。
- **実行とランタイム:** `/status` は、有効なサンドボックスパスについて `Execution` を、セッションを実際に実行している主体について `Runtime` を報告します: `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンド。
- **応答ごとのトークン/コスト** は `/usage off|tokens|full` で制御されます（通常の返信に追加されます）。
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
- Discord では、`/model` と `/models` がプロバイダーとモデルのドロップダウン、および Submit ステップを含むインタラクティブなピッカーを開きます。
- `/model <#>` はそのピッカーから選択します（可能な場合は現在のプロバイダーを優先します）。
- `/model status` は、利用可能な場合、設定済みのプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）を含む詳細ビューを表示します。

## デバッグオーバーライド

`/debug` では、**ランタイムのみ** の設定オーバーライド（メモリ、ディスクではない）を設定できます。所有者のみ。デフォルトでは無効です。`commands.debug: true` で有効化します。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
オーバーライドは新しい設定読み取りに即座に適用されますが、`openclaw.json` には書き込まれません。すべてのオーバーライドをクリアしてディスク上の設定に戻すには、`/debug reset` を使用します。
</Note>

## Plugin トレース出力

`/trace` では、完全な verbose モードを有効にせずに、**セッションスコープの Plugin トレース/デバッグ行** を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注記:

- 引数なしの `/trace` は、現在のセッショントレース状態を表示します。
- `/trace on` は、現在のセッションで Plugin トレース行を有効にします。
- `/trace off` は、それらを再び無効にします。
- Plugin トレース行は `/status` に表示される場合があり、通常のアシスタント返信の後にフォローアップ診断メッセージとして表示される場合もあります。
- `/trace` は `/debug` を置き換えるものではありません。`/debug` は引き続きランタイムのみの設定オーバーライドを管理します。
- `/trace` は `/verbose` を置き換えるものではありません。通常の verbose ツール/ステータス出力は引き続き `/verbose` に属します。

## 設定更新

`/config` はディスク上の設定（`openclaw.json`）に書き込みます。所有者のみ。デフォルトでは無効です。`commands.config: true` で有効化します。

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

`/mcp` は、OpenClaw が管理する MCP サーバー定義を `mcp.servers` 配下に書き込みます。所有者のみ。デフォルトでは無効です。`commands.mcp: true` で有効化します。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` は設定を Pi 所有のプロジェクト設定ではなく、OpenClaw 設定に保存します。実際に実行可能なトランスポートは、ランタイムアダプターが決定します。
</Note>

## Plugin 更新

`/plugins` では、オペレーターが検出された plugins を確認し、設定内の有効化を切り替えられます。読み取り専用フローでは、`/plugin` をエイリアスとして使用できます。デフォルトでは無効です。`commands.plugins: true` で有効化します。

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
- `/plugins enable|disable` は Plugin 設定のみを更新します。plugins のインストールやアンインストールは行いません。
- 有効化と無効化の変更は、新しいエージェントターン向けに Gateway の Plugin ランタイムサーフェスをホットリロードします。インストールでは Plugin ソースモジュールが変更されるため、Gateway の再起動を要求します。

</Note>

## サーフェス注記

<AccordionGroup>
  <Accordion title="サーフェスごとのセッション">
    - **テキストコマンド** は通常のチャットセッションで実行されます（DM は `main` を共有し、グループは独自のセッションを持ちます）。
    - **ネイティブコマンド** は分離されたセッションを使用します:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
      - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` 経由でチャットセッションを対象にします）
    - **`/stop`** はアクティブなチャットセッションを対象にするため、現在の実行を中止できます。

  </Accordion>
  <Accordion title="Slack 固有事項">
    `channels.slack.slashCommand` は、単一の `/openclaw` 形式のコマンドとして引き続きサポートされています。`commands.native` を有効にする場合は、組み込みコマンドごとに 1 つの Slack スラッシュコマンド（`/help` と同じ名前）を作成する必要があります。Slack 向けのコマンド引数メニューは、一時的な Block Kit ボタンとして配信されます。

    Slack のネイティブ例外: Slack は `/status` を予約しているため、`/agentstatus`（`/status` ではない）を登録します。テキストの `/status` は Slack メッセージ内で引き続き機能します。

  </Accordion>
</AccordionGroup>

## BTW サイド質問

`/btw` は、現在のセッションに関する簡単な **サイド質問** です。`/side` はエイリアスです。

通常のチャットとは異なります:

- 現在のセッションを背景コンテキストとして使用します。
- 別個の **ツールなし** の一回限りの呼び出しとして実行されます。
- 将来のセッションコンテキストを変更しません。
- トランスクリプト履歴に書き込まれません。
- 通常のアシスタントメッセージではなく、ライブのサイド結果として配信されます。

これにより、メインタスクを継続しながら一時的な確認をしたい場合に `/btw` が役立ちます。

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
