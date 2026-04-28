---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
sidebarTitle: Slash commands
summary: 'スラッシュコマンド: テキスト vs ネイティブ、設定、対応コマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-04-26T11:42:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

コマンドは Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる**単独の**メッセージとして送信する必要があります。ホスト専用の bash チャットコマンドは `! <cmd>` を使用します（`/bash <cmd>` はその別名です）。

会話またはスレッドが ACP セッションにバインドされている場合、通常の後続テキストはその ACP ハーネスにルーティングされます。ただし、Gateway 管理コマンドはローカルのままです。`/acp ...` は常に OpenClaw の ACP コマンドハンドラーに到達し、`/status` と `/unfocus` も、そのサーフェスでコマンド処理が有効である限りローカルのままです。

関連するシステムは 2 つあります。

<AccordionGroup>
  <Accordion title="コマンド">
    単独の `/...` メッセージ。
  </Accordion>
  <Accordion title="ディレクティブ">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。

    - ディレクティブは、モデルがメッセージを見る前にメッセージから取り除かれます。
    - 通常のチャットメッセージでは（ディレクティブのみではない場合）、これらは「インラインヒント」として扱われ、セッション設定は永続化されません。
    - ディレクティブのみのメッセージでは（メッセージがディレクティブだけを含む場合）、セッションに永続化され、確認応答が返されます。
    - ディレクティブは**許可された送信者**にのみ適用されます。`commands.allowFrom` が設定されている場合、それが使用される唯一の allowlist です。そうでなければ、認可はチャネル allowlist/ペアリングと `commands.useAccessGroups` から行われます。未認可の送信者には、ディレクティブはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="インラインショートカット">
    allowlist 登録済み/認可済み送信者のみ: `/help`、`/commands`、`/status`、`/whoami`（`/id`）。

    これらは即座に実行され、モデルがメッセージを見る前に取り除かれ、残りのテキストは通常フローを続行します。

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
  チャットメッセージ内での `/...` の解析を有効にします。ネイティブコマンドのないサーフェス（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）では、これを `false` に設定してもテキストコマンドは引き続き機能します。
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ネイティブコマンドを登録します。auto: Discord/Telegram ではオン、Slack ではオフです（slash commands を追加するまで）。ネイティブサポートのないプロバイダでは無視されます。プロバイダごとに上書きするには `channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（bool または `"auto"`）。`false` にすると、起動時に Discord/Telegram で以前登録されたコマンドがクリアされます。Slack コマンドは Slack app 内で管理され、自動では削除されません。
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  サポートされている場合に **skill** コマンドをネイティブ登録します。auto: Discord/Telegram ではオン、Slack ではオフです（Slack では skill ごとに slash command を作成する必要があります）。プロバイダごとに上書きするには `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（bool または `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` でホスト shell コマンドを実行できるようにします（`/bash <cmd>` は別名です。`tools.elevated` allowlist が必要です）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash がバックグラウンドモードへ切り替わるまで待つ時間を制御します（`0` ですぐにバックグラウンド化）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` を読み書きします）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定を読み書きします）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（Plugin の検出/状態に加え、インストール + 有効/無効制御）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（ランタイム専用の上書き）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と gateway 再起動ツールアクションを有効にします。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  owner 専用コマンド/ツールサーフェス向けの明示的な owner allowlist を設定します。`commands.allowFrom` とは別です。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャネルごと: そのサーフェス上で owner 専用コマンドの実行に **owner identity** を必須にします。`true` の場合、送信者は解決済み owner 候補（たとえば `commands.ownerAllowFrom` のエントリやプロバイダネイティブ owner メタデータ）に一致するか、内部メッセージチャネル上で内部 `operator.admin` スコープを持っていなければなりません。チャネル `allowFrom` のワイルドカードエントリや、空/未解決の owner 候補リストでは**不十分**であり、そのチャネル上では owner 専用コマンドは fail closed します。owner 専用コマンドを `ownerAllowFrom` と標準コマンド allowlist だけで制御したい場合は、これをオフのままにしてください。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  system prompt に owner id をどのように表示するかを制御します。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay="hash"` のときに使用する HMAC secret を任意で設定します。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  コマンド認可用のプロバイダごとの allowlist。設定されている場合、これがコマンドとディレクティブの唯一の認可元になります（チャネル allowlist/ペアリングと `commands.useAccessGroups` は無視されます）。グローバルデフォルトには `"*"` を使用し、プロバイダ固有キーがそれを上書きします。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合に、コマンドに対して allowlist/ポリシーを強制します。
</ParamField>

## コマンド一覧

現在の信頼できる情報源:

- コア組み込みは `src/auto-reply/commands-registry.shared.ts` から来ます
- 生成される dock コマンドは `src/auto-reply/commands-registry.data.ts` から来ます
- Plugin コマンドは Plugin の `registerCommand()` 呼び出しから来ます
- 実際にあなたの gateway で利用可能かどうかは、依然として設定フラグ、チャネルサーフェス、インストール/有効化された Plugin に依存します

### コア組み込みコマンド

<AccordionGroup>
  <Accordion title="セッションと実行">
    - `/new [model]` は新しいセッションを開始します。`/reset` は reset の別名です。
    - `/reset soft [message]` は現在の transcript を保持し、再利用される CLI バックエンドセッション id を破棄して、起動/system-prompt 読み込みをその場で再実行します。
    - `/compact [instructions]` はセッションコンテキストを Compaction します。[Compaction](/ja-JP/concepts/compaction) を参照してください。
    - `/stop` は現在の実行を中断します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` はスレッドバインディングの有効期限を管理します。
    - `/export-session [path]` は現在のセッションを HTML にエクスポートします。別名: `/export`。
    - `/export-trajectory [path]` は現在のセッションの JSONL [trajectory bundle](/ja-JP/tools/trajectory) をエクスポートします。別名: `/trajectory`。

  </Accordion>
  <Accordion title="モデルと実行制御">
    - `/think <level>` は thinking level を設定します。選択肢はアクティブモデルのプロバイダプロファイルに依存します。一般的な level は `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max`、または二値の `on` のようなカスタム level はサポートされている場合にのみ利用できます。別名: `/thinking`、`/t`。
    - `/verbose on|off|full` は詳細出力を切り替えます。別名: `/v`。
    - `/trace on|off` は現在のセッションの Plugin trace 出力を切り替えます。
    - `/fast [status|on|off]` は高速モードの表示または設定を行います。
    - `/reasoning [on|off|stream]` は reasoning の可視性を切り替えます。別名: `/reason`。
    - `/elevated [on|off|ask|full]` は elevated mode を切り替えます。別名: `/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec のデフォルトを表示または設定します。
    - `/model [name|#|status]` はモデルの表示または設定を行います。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` はプロバイダ一覧、または特定プロバイダのモデル一覧を表示します。
    - `/queue <mode>` はキュー動作（`steer`、`interrupt`、`followup`、`collect`、`steer-backlog`）と、`debounce:2s cap:25 drop:summarize` のようなオプションを管理します。

  </Accordion>
  <Accordion title="検出とステータス">
    - `/help` は短いヘルプ要約を表示します。
    - `/commands` は生成されたコマンドカタログを表示します。
    - `/tools [compact|verbose]` は現在のエージェントが今使えるものを表示します。
    - `/status` は実行/ランタイム状態を表示し、利用可能な場合は `Execution`/`Runtime` ラベルとプロバイダ使用量/クォータも含みます。
    - `/crestodian <request>` は owner DM から Crestodian のセットアップ/修復ヘルパーを実行します。
    - `/tasks` は現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
    - `/context [list|detail|json]` はコンテキストがどのように組み立てられるかを説明します。
    - `/whoami` はあなたの sender id を表示します。別名: `/id`。
    - `/usage off|tokens|full|cost` はレスポンスごとの使用量フッターを制御するか、ローカルコスト要約を表示します。

  </Accordion>
  <Accordion title="Skills、allowlist、承認">
    - `/skill <name> [input]` は名前で Skill を実行します。
    - `/allowlist [list|add|remove] ...` は allowlist エントリを管理します。テキスト専用です。
    - `/approve <id> <decision>` は exec 承認プロンプトを解決します。
    - `/btw <question>` は将来のセッションコンテキストを変更せずにサイドクエスチョンを行います。[BTW](/ja-JP/tools/btw) を参照してください。

  </Accordion>
  <Accordion title="Subagents と ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` は現在のセッションの sub-agent 実行を管理します。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は ACP セッションとランタイムオプションを管理します。
    - `/focus <target>` は現在の Discord スレッドまたは Telegram topic/会話をセッションターゲットにバインドします。
    - `/unfocus` は現在のバインディングを解除します。
    - `/agents` は現在のセッションのスレッドバインドされたエージェントを一覧表示します。
    - `/kill <id|#|all>` は実行中の 1 つまたはすべての sub-agent を中断します。
    - `/steer <id|#> <message>` は実行中の sub-agent にステアリングを送信します。別名: `/tell`。

  </Accordion>
  <Accordion title="owner 専用の書き込みと管理">
    - `/config show|get|set|unset` は `openclaw.json` を読み書きします。owner 専用です。`commands.config: true` が必要です。
    - `/mcp show|get|set|unset` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定を読み書きします。owner 専用です。`commands.mcp: true` が必要です。
    - `/plugins list|inspect|show|get|install|enable|disable` は Plugin 状態を検査または変更します。`/plugin` は別名です。書き込みは owner 専用です。`commands.plugins: true` が必要です。
    - `/debug show|set|unset|reset` はランタイム専用設定上書きを管理します。owner 専用です。`commands.debug: true` が必要です。
    - `/restart` は有効な場合に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定します。
    - `/send on|off|inherit` は送信ポリシーを設定します。owner 専用です。

  </Accordion>
  <Accordion title="音声、TTS、チャネル制御">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` は TTS を制御します。[TTS](/ja-JP/tools/tts) を参照してください。
    - `/activation mention|always` はグループアクティベーションモードを設定します。
    - `/bash <command>` はホスト shell コマンドを実行します。テキスト専用です。別名: `! <command>`。`commands.bash: true` と `tools.elevated` allowlist が必要です。
    - `!poll [sessionId]` はバックグラウンド bash ジョブを確認します。
    - `!stop [sessionId]` はバックグラウンド bash ジョブを停止します。

  </Accordion>
</AccordionGroup>

### 生成される dock コマンド

Dock コマンドは、ネイティブコマンドサポートを持つチャネル Plugin から生成されます。現在の同梱セット:

- `/dock-discord`（別名: `/dock_discord`）
- `/dock-mattermost`（別名: `/dock_mattermost`）
- `/dock-slack`（別名: `/dock_slack`）
- `/dock-telegram`（別名: `/dock_telegram`）

### 同梱 Plugin コマンド

同梱 Plugin は追加の slash command を追加できます。このリポジトリで現在同梱されているコマンド:

- `/dreaming [on|off|status|help]` はメモリ Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` はデバイスのペアリング/セットアップフローを管理します。[Pairing](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` は高リスクな phone Node コマンドを一時的に有効化します。
- `/voice status|list [limit]|set <voiceId|name>` は Talk の音声設定を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE rich card のプリセットを送信します。[LINE](/ja-JP/channels/line) を参照してください。
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` は同梱の Codex app-server harness を検査および制御します。[Codex harness](/ja-JP/plugins/codex-harness) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的 Skill コマンド

ユーザーが呼び出せる Skills も slash command として公開されます。

- `/skill <name> [input]` は常に汎用エントリポイントとして機能します。
- skill/plugin が登録すると、Skills は `/prose` のような直接コマンドとして現れることもあります。
- ネイティブ skill-command 登録は `commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` によって制御されます。

<AccordionGroup>
  <Accordion title="引数とパーサーに関する注記">
    - コマンドは、コマンドと引数の間に任意の `:` を受け付けます（例: `/think: high`、`/send: on`、`/help:`）。
    - `/new <model>` は model の別名、`provider/model`、またはプロバイダ名（あいまい一致）を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - 完全なプロバイダ使用量内訳には `openclaw status --usage` を使用してください。
    - `/allowlist add|remove` には `commands.config=true` が必要で、チャネルの `configWrites` を尊重します。
    - マルチアカウントチャネルでは、設定対象の `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も対象アカウントの `configWrites` を尊重します。
    - `/usage` はレスポンスごとの使用量フッターを制御します。`/usage cost` は OpenClaw セッションログからローカルコスト要約を表示します。
    - `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定します。
    - `/plugins install <spec>` は `openclaw plugins install` と同じ Plugin spec を受け付けます: ローカルパス/アーカイブ、npm package、または `clawhub:<pkg>`。
    - `/plugins enable|disable` は Plugin 設定を更新し、再起動を求める場合があります。

  </Accordion>
  <Accordion title="チャネル固有の動作">
    - Discord 専用ネイティブコマンド: `/vc join|leave|status` は voice channel を制御します（テキストでは利用不可）。`join` には guild と選択された voice/stage channel が必要です。`channels.discord.voice` とネイティブコマンドが必要です。
    - Discord のスレッドバインディングコマンド（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）には、有効な thread bindings（`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`）が必要です。
    - ACP コマンドリファレンスとランタイム動作: [ACP agents](/ja-JP/tools/acp-agents)。

  </Accordion>
  <Accordion title="verbose / trace / fast / reasoning の安全性">
    - `/verbose` はデバッグと追加可視性を目的としています。通常使用では **off** のままにしてください。
    - `/trace` は `/verbose` より狭い範囲です。Plugin 所有の trace/debug 行だけを公開し、通常の verbose なツール出力はオフのままです。
    - `/fast on|off` はセッション上書きを永続化します。これをクリアして設定デフォルトに戻すには、Sessions UI の `inherit` オプションを使用してください。
    - `/fast` はプロバイダ固有です。OpenAI/OpenAI Codex ではネイティブ Responses エンドポイント上の `service_tier=priority` に対応し、OAuth 認証済みで `api.anthropic.com` に送られるトラフィックを含む直接の公開 Anthropic リクエストでは `service_tier=auto` または `standard_only` に対応します。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
    - ツール失敗要約は必要に応じて引き続き表示されますが、詳細な失敗テキストは `/verbose` が `on` または `full` の場合にのみ含まれます。
    - `/reasoning`、`/verbose`、`/trace` はグループ設定では危険です。意図していない内部 reasoning、ツール出力、Plugin 診断を露出する可能性があります。特にグループチャットではオフのままを推奨します。

  </Accordion>
  <Accordion title="モデル切り替え">
    - `/model` は新しいセッションモデルを即座に永続化します。
    - エージェントがアイドルなら、次の実行でただちに使用されます。
    - すでに実行がアクティブな場合、OpenClaw は live 切り替えを保留として記録し、クリーンなリトライポイントでのみ新しいモデルに再起動します。
    - ツール動作または返信出力がすでに始まっている場合、その保留切り替えは後のリトライ機会または次のユーザーターンまで待機することがあります。
    - ローカル TUI では、`/crestodian [request]` は通常のエージェント TUI から Crestodian に戻ります。これはメッセージチャネルの rescue mode とは別で、リモート設定権限を付与するものではありません。

  </Accordion>
  <Accordion title="高速パスとインラインショートカット">
    - **高速パス:** allowlist 登録済み送信者からのコマンドのみのメッセージは即座に処理されます（キュー + モデルをバイパス）。
    - **グループメンションゲーティング:** allowlist 登録済み送信者からのコマンドのみのメッセージはメンション要件をバイパスします。
    - **インラインショートカット（allowlist 登録済み送信者のみ）:** 一部のコマンドは通常メッセージに埋め込まれていても機能し、残りのテキストをモデルが見る前に取り除かれます。
      - 例: `hey /status` は status 返信を発生させ、残りのテキストは通常フローを続行します。
    - 現在対象: `/help`、`/commands`、`/status`、`/whoami`（`/id`）。
    - 未認可のコマンドのみメッセージは黙って無視され、インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="Skill コマンドとネイティブ引数">
    - **Skill コマンド:** `user-invocable` Skills は slash command として公開されます。名前は `a-z0-9_` にサニタイズされ（最大 32 文字）、衝突には数値サフィックスが付きます（例: `_2`）。
      - `/skill <name> [input]` は名前で Skill を実行します（ネイティブコマンド制限により skill ごとのコマンドが作れない場合に便利です）。
      - デフォルトでは、skill コマンドは通常のリクエストとしてモデルに転送されます。
      - Skills は任意で `command-dispatch: tool` を宣言し、コマンドを直接ツールへルーティングできます（決定的、モデルなし）。
      - 例: `/prose`（OpenProse Plugin）— [OpenProse](/ja-JP/prose) を参照してください。
    - **ネイティブコマンド引数:** Discord は動的オプションに autocomplete を使用します（必須引数を省略した場合はボタンメニューも表示）。Telegram と Slack は、コマンドが選択肢をサポートしていて引数を省略した場合にボタンメニューを表示します。動的選択肢は対象セッションモデルに対して解決されるため、`/think` level のようなモデル固有オプションはそのセッションの `/model` 上書きに従います。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` は設定の問いではなく、ランタイムの問いに答えます: **この会話でこのエージェントが今使えるものは何か**。

- デフォルトの `/tools` は簡潔で、素早く確認できるよう最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンドサーフェスでは、同じ `compact|verbose` モード切り替えを公開します。
- 結果はセッション単位です。そのため、エージェント、チャネル、スレッド、送信者認可、モデルの変更で出力が変わることがあります。
- `/tools` には、コアツール、接続済み Plugin ツール、チャネル所有ツールを含め、ランタイムで実際に到達可能なツールが含まれます。

プロファイルや上書きの編集には、`/tools` を静的カタログとして扱うのではなく、Control UI の Tools パネルまたは設定/カタログサーフェスを使用してください。

## 使用量サーフェス（どこに何が表示されるか）

- **プロバイダ使用量/クォータ**（例: 「Claude 80% left」）は、使用量追跡が有効な場合、現在のモデルプロバイダについて `/status` に表示されます。OpenClaw はプロバイダのウィンドウを `% left` に正規化します。MiniMax では、残量のみの percent フィールドは表示前に反転され、`model_remains` レスポンスでは chat-model エントリとモデルタグ付き plan ラベルが優先されます。
- `/status` の **トークン/キャッシュ行** は、live セッションスナップショットが疎な場合、最新の transcript 使用量エントリにフォールバックできます。既存のゼロ以外の live 値が依然として優先され、transcript フォールバックは、保存済み合計が欠けているか小さい場合に、アクティブなランタイムモデルラベルと、より大きな prompt 指向の合計も復元できます。
- **Execution と runtime:** `/status` は有効な sandbox パスについて `Execution` を、実際にセッションを実行している主体について `Runtime` を報告します: `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンドです。
- **レスポンスごとのトークン/コスト** は `/usage off|tokens|full` で制御されます（通常の返信に追記されます）。
- `/model status` は使用量ではなく、**モデル/認証/エンドポイント** に関するものです。

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

- `/model` と `/model list` は、簡潔で番号付きのピッカー（model family + 利用可能なプロバイダ）を表示します。
- Discord では、`/model` と `/models` は、プロバイダおよびモデルのドロップダウンと Submit ステップを持つ対話型ピッカーを開きます。
- `/model <#>` はそのピッカーから選択します（可能な場合は現在のプロバイダを優先します）。
- `/model status` は詳細ビューを表示し、利用可能な場合は設定済みプロバイダ endpoint（`baseUrl`）と API mode（`api`）も含みます。

## デバッグ上書き

`/debug` を使うと、**ランタイム専用**の設定上書き（ディスクではなくメモリ）を設定できます。owner 専用です。デフォルトでは無効で、`commands.debug: true` で有効化します。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
上書きは新しい設定読み取りに即座に適用されますが、`openclaw.json` には書き込みません。すべての上書きをクリアしてディスク上の設定に戻るには `/debug reset` を使用してください。
</Note>

## Plugin trace 出力

`/trace` を使うと、完全な verbose mode を有効にせずに、**セッション単位の Plugin trace/debug 行** を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注記:

- 引数なしの `/trace` は現在のセッション trace 状態を表示します。
- `/trace on` は現在のセッションで Plugin trace 行を有効にします。
- `/trace off` はそれを再度無効にします。
- Plugin trace 行は `/status` と、通常の assistant 返信後のフォローアップ診断メッセージに表示されることがあります。
- `/trace` は `/debug` の代わりにはなりません。`/debug` は引き続きランタイム専用設定上書きを管理します。
- `/trace` は `/verbose` の代わりにもなりません。通常の verbose なツール/ステータス出力は依然として `/verbose` に属します。

## 設定更新

`/config` はディスク上の設定（`openclaw.json`）に書き込みます。owner 専用です。デフォルトでは無効で、`commands.config: true` で有効化します。

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

`/mcp` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー定義を書き込みます。owner 専用です。デフォルトでは無効で、`commands.mcp: true` で有効化します。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` は Pi 所有のプロジェクト設定ではなく、OpenClaw 設定に保存します。どの transport が実際に実行可能かはランタイムアダプターが決定します。
</Note>

## Plugin 更新

`/plugins` を使うと、operator は検出された Plugin を確認し、設定内で有効状態を切り替えられます。読み取り専用フローでは `/plugin` を別名として使用できます。デフォルトでは無効で、`commands.plugins: true` で有効化します。

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
- `/plugins enable|disable` は Plugin 設定のみを更新します。Plugin のインストールやアンインストールは行いません。
- enable/disable の変更後は、適用のために gateway を再起動してください。

</Note>

## サーフェス注記

<AccordionGroup>
  <Accordion title="サーフェスごとのセッション">
    - **テキストコマンド** は通常のチャットセッションで実行されます（DM は `main` を共有し、グループは独自のセッションを持ちます）。
    - **ネイティブコマンド** は分離されたセッションを使用します:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>`（prefix は `channels.slack.slashCommand.sessionPrefix` で設定可能）
      - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` を介してチャットセッションを対象にします）
    - **`/stop`** は現在のチャットセッションを対象にし、現在の実行を中断できるようにします。

  </Accordion>
  <Accordion title="Slack 固有事項">
    `channels.slack.slashCommand` は、単一の `/openclaw` 形式コマンド向けとして今もサポートされています。`commands.native` を有効にする場合は、組み込みコマンドごとに 1 つの Slack slash command を作成する必要があります（名前は `/help` と同じです）。Slack 向けのコマンド引数メニューは ephemeral な Block Kit ボタンとして配信されます。

    Slack のネイティブ例外: Slack は `/status` を予約しているため、`/status` ではなく `/agentstatus` を登録します。テキストの `/status` は Slack メッセージ内でも引き続き機能します。

  </Accordion>
</AccordionGroup>

## BTW サイドクエスチョン

`/btw` は、現在のセッションに対する手早い**サイドクエスチョン**です。

通常のチャットとは異なり、これは次の特徴があります。

- 現在のセッションを背景コンテキストとして使用する
- 別個の **ツールなし** one-shot 呼び出しとして実行される
- 将来のセッションコンテキストを変更しない
- transcript 履歴には書き込まれない
- 通常の assistant メッセージではなく、ライブのサイド結果として配信される

そのため、`/btw` はメインタスクを続けながら一時的な確認を取りたいときに便利です。

例:

```text
/btw what are we doing right now?
```

完全な動作とクライアント UX の詳細については、[BTW Side Questions](/ja-JP/tools/btw) を参照してください。

## 関連

- [Creating skills](/ja-JP/tools/creating-skills)
- [Skills](/ja-JP/tools/skills)
- [Skills config](/ja-JP/tools/skills-config)
