---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
sidebarTitle: Slash commands
summary: 'スラッシュコマンド: テキストとネイティブ、設定、対応コマンド'
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-04-30T05:39:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

コマンドは Gateway によって処理されます。ほとんどのコマンドは、`/` で始まる**単独**メッセージとして送信する必要があります。ホスト専用の bash チャットコマンドは `! <cmd>` を使用します（`/bash <cmd>` はエイリアスです）。

会話またはスレッドが ACP セッションにバインドされている場合、通常のフォローアップテキストはその ACP ハーネスへルーティングされます。Gateway 管理コマンドは引き続きローカルに留まります。`/acp ...` は常に OpenClaw ACP コマンドハンドラーに届き、`/status` と `/unfocus` は、そのサーフェスでコマンド処理が有効な場合はローカルに留まります。

関連するシステムは 2 つあります。

<AccordionGroup>
  <Accordion title="コマンド">
    単独の `/...` メッセージ。
  </Accordion>
  <Accordion title="ディレクティブ">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。

    - ディレクティブは、モデルがメッセージを見る前に取り除かれます。
    - 通常のチャットメッセージ（ディレクティブのみではないもの）では、「インラインヒント」として扱われ、セッション設定は**永続化されません**。
    - ディレクティブのみのメッセージ（メッセージがディレクティブだけを含むもの）では、セッションに永続化され、確認応答が返されます。
    - ディレクティブは**認可された送信者**にのみ適用されます。`commands.allowFrom` が設定されている場合、それが使用される唯一の許可リストです。それ以外の場合、認可はチャンネルの許可リスト/ペアリングと `commands.useAccessGroups` から得られます。認可されていない送信者のディレクティブはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="インラインショートカット">
    許可リスト登録済み/認可済みの送信者のみ: `/help`、`/commands`、`/status`、`/whoami`（`/id`）。

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
  チャットメッセージ内の `/...` の解析を有効にします。ネイティブコマンドのないサーフェス（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）では、これを `false` に設定してもテキストコマンドは引き続き動作します。
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ネイティブコマンドを登録します。自動: Discord/Telegram ではオン、Slack ではオフ（スラッシュコマンドを追加するまで）、ネイティブサポートのないプロバイダーでは無視されます。プロバイダーごとに上書きするには、`channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します（bool または `"auto"`）。`false` は、起動時に Discord/Telegram で以前に登録されたコマンドを消去します。Slack コマンドは Slack アプリで管理され、自動的には削除されません。
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  サポートされている場合、**skill** コマンドをネイティブに登録します。自動: Discord/Telegram ではオン、Slack ではオフ（Slack では skill ごとにスラッシュコマンドを作成する必要があります）。プロバイダーごとに上書きするには、`channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します（bool または `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` によるホストシェルコマンドの実行を有効にします（`/bash <cmd>` はエイリアスです。`tools.elevated` 許可リストが必要です）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  バックグラウンドモードに切り替える前に bash が待機する時間を制御します（`0` は即座にバックグラウンド化します）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` を読み書きします）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定を読み書きします）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（plugin の検出/ステータスに加え、インストールと有効化/無効化の制御）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（ランタイム専用の上書き）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と gateway 再起動ツールアクションを有効にします。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  所有者専用のコマンド/ツールサーフェスに対する明示的な所有者許可リストを設定します。これは、危険なアクションを承認し、`/diagnostics`、`/export-trajectory`、`/config` などのコマンドを実行できる人間のオペレーターアカウントです。`commands.allowFrom` や DM ペアリングアクセスとは別です。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごと: そのサーフェスで所有者専用コマンドを実行するには**所有者 ID** を要求します。`true` の場合、送信者は解決済みの所有者候補（たとえば `commands.ownerAllowFrom` のエントリまたはプロバイダーネイティブの所有者メタデータ）と一致するか、内部メッセージチャンネルで内部 `operator.admin` スコープを保持している必要があります。チャンネル `allowFrom` のワイルドカードエントリ、または空/未解決の所有者候補リストは十分ではありません。所有者専用コマンドはそのチャンネルでフェイルクローズします。所有者専用コマンドを `ownerAllowFrom` と標準のコマンド許可リストだけでゲートしたい場合は、これをオフのままにしてください。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプトに所有者 ID がどのように表示されるかを制御します。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  必要に応じて、`commands.ownerDisplay="hash"` のときに使用される HMAC シークレットを設定します。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  コマンド認可用のプロバイダーごとの許可リストです。設定されている場合、コマンドとディレクティブの唯一の認可ソースになります（チャンネル許可リスト/ペアリングと `commands.useAccessGroups` は無視されます）。グローバルデフォルトには `"*"` を使用します。プロバイダー固有のキーはそれを上書きします。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合に、コマンドに対して許可リスト/ポリシーを強制します。
</ParamField>

## コマンド一覧

現在の信頼できる情報源:

- コア組み込みは `src/auto-reply/commands-registry.shared.ts` から取得されます
- 生成された dock コマンドは `src/auto-reply/commands-registry.data.ts` から取得されます
- plugin コマンドは plugin の `registerCommand()` 呼び出しから取得されます
- gateway 上で実際に利用できるかどうかは、設定フラグ、チャンネルサーフェス、インストール済み/有効化済み plugins にも依存します

### コア組み込みコマンド

<AccordionGroup>
  <Accordion title="セッションと実行">
    - `/new [model]` は新しいセッションを開始します。`/reset` はリセットのエイリアスです。
    - `/reset soft [message]` は現在のトランスクリプトを保持し、再利用された CLI バックエンドセッション ID を破棄し、起動/システムプロンプトの読み込みをその場で再実行します。
    - `/compact [instructions]` はセッションコンテキストを compact します。[Compaction](/ja-JP/concepts/compaction) を参照してください。
    - `/stop` は現在の実行を中止します。
    - `/session idle <duration|off>` と `/session max-age <duration|off>` はスレッドバインディングの有効期限を管理します。
    - `/export-session [path]` は現在のセッションを HTML にエクスポートします。エイリアス: `/export`。
    - `/export-trajectory [path]` は exec 承認を求め、その後現在のセッションの JSONL [trajectory バンドル](/ja-JP/tools/trajectory) をエクスポートします。1 つの OpenClaw セッションについて、プロンプト、ツール、トランスクリプトのタイムラインが必要なときに使用します。グループチャットでは、承認プロンプトとエクスポート結果は所有者へ非公開で送信されます。エイリアス: `/trajectory`。

  </Accordion>
  <Accordion title="モデルと実行制御">
    - `/think <level>` は思考レベルを設定します。選択肢はアクティブなモデルのプロバイダープロファイルから取得されます。一般的なレベルは `off`、`minimal`、`low`、`medium`、`high` で、`xhigh`、`adaptive`、`max`、またはバイナリの `on` などのカスタムレベルはサポートされる場合にのみ使用できます。エイリアス: `/thinking`、`/t`。
    - `/verbose on|off|full` は詳細出力を切り替えます。エイリアス: `/v`。
    - `/trace on|off` は現在のセッションの plugin トレース出力を切り替えます。
    - `/fast [status|on|off]` は高速モードを表示または設定します。
    - `/reasoning [on|off|stream]` は推論の可視性を切り替えます。エイリアス: `/reason`。
    - `/elevated [on|off|ask|full]` は elevated モードを切り替えます。エイリアス: `/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` は exec のデフォルトを表示または設定します。
    - `/model [name|#|status]` はモデルを表示または設定します。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` は、設定済み/認証利用可能なプロバイダー、またはプロバイダーのモデルを一覧表示します。そのプロバイダーの完全なカタログを参照するには `all` を追加します。
    - `/queue <mode>` はキューの動作（`steer`、レガシー `queue`、`followup`、`collect`、`steer-backlog`、`interrupt`）に加え、`debounce:0.5s cap:25 drop:summarize` などのオプションを管理します。`/queue default` または `/queue reset` はセッションの上書きを消去します。[コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

  </Accordion>
  <Accordion title="検出とステータス">
    - `/help` は短いヘルプ概要を表示します。
    - `/commands` は生成されたコマンドカタログを表示します。
    - `/tools [compact|verbose]` は現在のエージェントが今すぐ使用できるものを表示します。
    - `/status` は実行/ランタイムのステータスを表示します。利用可能な場合は `Execution`/`Runtime` ラベルとプロバイダーの使用量/クォータも含まれます。
    - `/diagnostics [note]` は、Gateway バグと Codex ハーネス実行のための所有者専用サポートレポートフローです。`openclaw gateway diagnostics export --json` を実行する前に、毎回明示的な exec 承認を求めます。allow-all ルールで diagnostics を承認しないでください。承認後、ローカルバンドルパス、マニフェスト概要、プライバシー注記、関連セッション ID を含む、貼り付け可能なレポートを送信します。グループチャットでは、承認プロンプトとレポートは所有者へ非公開で送信されます。アクティブなセッションが OpenAI Codex ハーネスを使用している場合、同じ承認により関連する Codex フィードバックも OpenAI サーバーへ送信され、完了した返信には OpenClaw セッション ID、Codex スレッド ID、`codex resume <thread-id>` コマンドが列挙されます。[Diagnostics Export](/ja-JP/gateway/diagnostics) を参照してください。
    - `/crestodian <request>` は所有者 DM から Crestodian セットアップおよび修復ヘルパーを実行します。
    - `/tasks` は現在のセッションのアクティブ/最近のバックグラウンドタスクを一覧表示します。
    - `/context [list|detail|json]` はコンテキストがどのように組み立てられるかを説明します。
    - `/whoami` は送信者 ID を表示します。エイリアス: `/id`。
    - `/usage off|tokens|full|cost` はレスポンスごとの使用量フッターを制御するか、ローカルのコスト概要を出力します。

  </Accordion>
  <Accordion title="Skills、許可リスト、承認">
    - `/skill <name> [input]` は名前で skill を実行します。
    - `/allowlist [list|add|remove] ...` は許可リストエントリを管理します。テキスト専用です。
    - `/approve <id> <decision>` は exec 承認プロンプトを解決します。
    - `/btw <question>` は今後のセッションコンテキストを変更せずに副次的な質問をします。[BTW](/ja-JP/tools/btw) を参照してください。

  </Accordion>
  <Accordion title="サブエージェントと ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` は現在のセッションのサブエージェント実行を管理します。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` は ACP セッションとランタイムオプションを管理します。
    - `/focus <target>` は現在の Discord スレッドまたは Telegram トピック/会話をセッションターゲットにバインドします。
    - `/unfocus` は現在のバインディングを削除します。
    - `/agents` は現在のセッションのスレッドバインドされたエージェントを一覧表示します。
    - `/kill <id|#|all>` は 1 つまたはすべての実行中サブエージェントを中止します。
    - `/steer <id|#> <message>` は実行中のサブエージェントにステアリングを送信します。エイリアス: `/tell`。

  </Accordion>
  <Accordion title="所有者専用の書き込みと管理">
    - `/config show|get|set|unset` は `openclaw.json` を読み書きします。所有者専用です。`commands.config: true` が必要です。
    - `/mcp show|get|set|unset` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定を読み書きします。所有者専用です。`commands.mcp: true` が必要です。
    - `/plugins list|inspect|show|get|install|enable|disable` は Plugin の状態を検査または変更します。`/plugin` はエイリアスです。書き込みは所有者専用です。`commands.plugins: true` が必要です。
    - `/debug show|set|unset|reset` は実行時限定の設定上書きを管理します。所有者専用です。`commands.debug: true` が必要です。
    - `/restart` は有効な場合に OpenClaw を再起動します。デフォルト: 有効。無効にするには `commands.restart: false` を設定します。
    - `/send on|off|inherit` は送信ポリシーを設定します。所有者専用です。

  </Accordion>
  <Accordion title="音声、TTS、チャンネル制御">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` は TTS を制御します。[TTS](/ja-JP/tools/tts) を参照してください。
    - `/activation mention|always` はグループ有効化モードを設定します。
    - `/bash <command>` はホストのシェルコマンドを実行します。テキストのみです。エイリアス: `! <command>`。`commands.bash: true` と `tools.elevated` の許可リストが必要です。
    - `!poll [sessionId]` はバックグラウンドの bash ジョブを確認します。
    - `!stop [sessionId]` はバックグラウンドの bash ジョブを停止します。

  </Accordion>
</AccordionGroup>

### 生成された dock コマンド

dock コマンドは、現在のセッションの返信ルートを別のリンク済みチャンネルへ切り替えます。セットアップ、例、トラブルシューティングについては、[チャンネルドッキング](/ja-JP/concepts/channel-docking) を参照してください。

dock コマンドは、ネイティブコマンド対応のチャンネル Plugin から生成されます。現在バンドルされているセット:

- `/dock-discord` (エイリアス: `/dock_discord`)
- `/dock-mattermost` (エイリアス: `/dock_mattermost`)
- `/dock-slack` (エイリアス: `/dock_slack`)
- `/dock-telegram` (エイリアス: `/dock_telegram`)

ダイレクトチャットから dock コマンドを使用すると、現在のセッションの返信ルートを別のリンク済みチャンネルへ切り替えられます。エージェントは同じセッションコンテキストを保持しますが、そのセッションの以降の返信は選択したチャンネルの相手に配信されます。

dock コマンドには `session.identityLinks` が必要です。送信元の送信者とターゲットの相手は、同じ ID グループ内に存在する必要があります。例: `["telegram:123", "discord:456"]`。id `123` の Telegram ユーザーが `/dock_discord` を送信した場合、OpenClaw はアクティブなセッションに `lastChannel: "discord"` と `lastTo: "456"` を保存します。送信者が Discord の相手にリンクされていない場合、コマンドは通常のチャットにフォールスルーせず、セットアップのヒントを返信します。

ドッキングはアクティブなセッションルートだけを変更します。チャンネルアカウントを作成したり、アクセス権を付与したり、チャンネル許可リストを迂回したり、トランスクリプト履歴を別のセッションへ移動したりすることはありません。ルートを再度切り替えるには、`/dock-telegram`、`/dock-slack`、`/dock-mattermost`、または別の生成済み dock コマンドを使用します。

### バンドル済み Plugin コマンド

バンドル済み Plugin はさらにスラッシュコマンドを追加できます。このリポジトリ内の現在のバンドル済みコマンド:

- `/dreaming [on|off|status|help]` はメモリ Dreaming を切り替えます。[Dreaming](/ja-JP/concepts/dreaming) を参照してください。
- `/pair [qr|status|pending|approve|cleanup|notify]` はデバイスのペアリング/セットアップフローを管理します。[ペアリング](/ja-JP/channels/pairing) を参照してください。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` は高リスクな電話ノードコマンドを一時的に有効化します。
- `/voice status|list [limit]|set <voiceId|name>` は Talk 音声設定を管理します。Discord では、ネイティブコマンド名は `/talkvoice` です。
- `/card ...` は LINE リッチカードプリセットを送信します。[LINE](/ja-JP/channels/line) を参照してください。
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` はバンドル済み Codex アプリサーバーハーネスを検査および制御します。[Codex ハーネス](/ja-JP/plugins/codex-harness) を参照してください。
- QQBot 専用コマンド:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動的 Skills コマンド

ユーザーが呼び出せる Skills もスラッシュコマンドとして公開されます。

- `/skill <name> [input]` は汎用エントリポイントとして常に動作します。
- Skills は、その Skill/Plugin が登録している場合、`/prose` のような直接コマンドとしても表示されることがあります。
- ネイティブ Skill コマンド登録は `commands.nativeSkills` と `channels.<provider>.commands.nativeSkills` で制御されます。

<AccordionGroup>
  <Accordion title="引数とパーサーの注意事項">
    - コマンドは、コマンドと引数の間に任意で `:` を受け付けます (例: `/think: high`、`/send: on`、`/help:`)。
    - `/new <model>` はモデルエイリアス、`provider/model`、またはプロバイダー名 (あいまい一致) を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - プロバイダー使用状況の完全な内訳には、`openclaw status --usage` を使用します。
    - `/allowlist add|remove` には `commands.config=true` が必要で、チャンネルの `configWrites` に従います。
    - 複数アカウントのチャンネルでは、設定対象を指定する `/allowlist --account <id>` と `/config set channels.<provider>.accounts.<id>...` も、対象アカウントの `configWrites` に従います。
    - `/usage` はレスポンスごとの使用量フッターを制御します。`/usage cost` は OpenClaw セッションログからローカルのコスト概要を出力します。
    - `/restart` はデフォルトで有効です。無効にするには `commands.restart: false` を設定します。
    - `/plugins install <spec>` は `openclaw plugins install` と同じ Plugin 仕様を受け付けます: ローカルパス/アーカイブ、npm パッケージ、または `clawhub:<pkg>`。
    - `/plugins enable|disable` は Plugin 設定を更新し、再起動を促す場合があります。

  </Accordion>
  <Accordion title="チャンネル固有の動作">
    - Discord 専用ネイティブコマンド: `/vc join|leave|status` は音声チャンネルを制御します (テキストとしては利用できません)。`join` には guild と選択済みの音声/ステージチャンネルが必要です。`channels.discord.voice` とネイティブコマンドが必要です。
    - Discord スレッドバインディングコマンド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`) には、有効なスレッドバインディングが有効化されている必要があります (`session.threadBindings.enabled` および/または `channels.discord.threadBindings.enabled`)。
    - ACP コマンドリファレンスと実行時動作: [ACP エージェント](/ja-JP/tools/acp-agents)。

  </Accordion>
  <Accordion title="verbose / trace / fast / reasoning の安全性">
    - `/verbose` はデバッグと追加の可視性を目的としています。通常利用では **オフ** にしてください。
    - `/trace` は `/verbose` より範囲が狭く、Plugin 所有のトレース/デバッグ行だけを公開し、通常の verbose なツールの雑音はオフのままにします。
    - `/fast on|off` はセッション上書きを永続化します。これをクリアして設定デフォルトに戻すには、Sessions UI の `inherit` オプションを使用します。
    - `/fast` はプロバイダー固有です。OpenAI/OpenAI Codex はネイティブ Responses エンドポイントで `service_tier=priority` にマップします。一方、`api.anthropic.com` に送信される OAuth 認証済みトラフィックを含む直接の公開 Anthropic リクエストでは、`service_tier=auto` または `standard_only` にマップします。[OpenAI](/ja-JP/providers/openai) と [Anthropic](/ja-JP/providers/anthropic) を参照してください。
    - ツール失敗の概要は関連がある場合は引き続き表示されますが、詳細な失敗テキストは `/verbose` が `on` または `full` の場合にのみ含まれます。
    - `/reasoning`、`/verbose`、`/trace` はグループ設定ではリスクがあります。公開する意図のなかった内部推論、ツール出力、Plugin 診断を公開する可能性があります。特にグループチャットでは、オフのままにすることを推奨します。

  </Accordion>
  <Accordion title="モデル切り替え">
    - `/model` は新しいセッションモデルを即座に永続化します。
    - エージェントがアイドル状態の場合、次の実行はすぐにそのモデルを使用します。
    - 実行がすでにアクティブな場合、OpenClaw はライブ切り替えを保留中としてマークし、クリーンなリトライポイントでのみ新しいモデルへ再起動します。
    - ツールアクティビティまたは返信出力がすでに開始している場合、保留中の切り替えは後続のリトライ機会または次のユーザーターンまでキューに残ることがあります。
    - ローカル TUI では、`/crestodian [request]` は通常のエージェント TUI から Crestodian に戻ります。これはメッセージチャンネルのレスキューモードとは別であり、リモート設定権限を付与しません。

  </Accordion>
  <Accordion title="高速パスとインラインショートカット">
    - **高速パス:** 許可リストに含まれる送信者からのコマンドのみのメッセージは即座に処理されます (キュー + モデルをバイパス)。
    - **グループメンションゲーティング:** 許可リストに含まれる送信者からのコマンドのみのメッセージはメンション要件をバイパスします。
    - **インラインショートカット (許可リストに含まれる送信者のみ):** 一部のコマンドは通常のメッセージに埋め込まれていても動作し、モデルが残りのテキストを見る前に取り除かれます。
      - 例: `hey /status` はステータス返信をトリガーし、残りのテキストは通常のフローを継続します。
    - 現在: `/help`、`/commands`、`/status`、`/whoami` (`/id`)。
    - 認可されていないコマンドのみのメッセージは黙って無視され、インラインの `/...` トークンはプレーンテキストとして扱われます。

  </Accordion>
  <Accordion title="Skill コマンドとネイティブ引数">
    - **Skill コマンド:** `user-invocable` Skills はスラッシュコマンドとして公開されます。名前は `a-z0-9_` に正規化されます (最大 32 文字)。衝突した場合は数値サフィックスが付きます (例: `_2`)。
      - `/skill <name> [input]` は名前で Skill を実行します (ネイティブコマンドの制限により Skill ごとのコマンドを作れない場合に便利です)。
      - デフォルトでは、Skill コマンドは通常のリクエストとしてモデルに転送されます。
      - Skills は任意で `command-dispatch: tool` を宣言し、コマンドを直接ツールへルーティングできます (決定的、モデルなし)。
      - 例: `/prose` (OpenProse Plugin) — [OpenProse](/ja-JP/prose) を参照してください。
    - **ネイティブコマンド引数:** Discord は動的オプションにオートコンプリートを使用します (必須引数を省略した場合はボタンメニューも使用します)。Telegram と Slack は、コマンドが選択肢をサポートしていて引数を省略した場合にボタンメニューを表示します。動的選択肢はターゲットセッションモデルに対して解決されるため、`/think` レベルなどのモデル固有オプションは、そのセッションの `/model` 上書きに従います。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` は設定の質問ではなく、実行時の質問に答えます: **このエージェントがこの会話で今すぐ使えるもの**。

- デフォルトの `/tools` はコンパクトで、すばやく確認できるよう最適化されています。
- `/tools verbose` は短い説明を追加します。
- 引数をサポートするネイティブコマンド面は、`compact|verbose` と同じモード切り替えを公開します。
- 結果はセッションスコープのため、エージェント、チャンネル、スレッド、送信者の認可、またはモデルを変更すると出力が変わる場合があります。
- `/tools` には、実行時に実際に到達可能なツールが含まれます。これにはコアツール、接続済み Plugin ツール、チャンネル所有ツールが含まれます。

プロファイルや上書きの編集には、`/tools` を静的カタログとして扱うのではなく、Control UI の Tools パネルまたは設定/カタログ面を使用してください。

## 使用状況の表示面 (どこに何が表示されるか)

- **プロバイダー使用状況/クォータ** (例: "Claude 80% left") は、使用状況追跡が有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。OpenClaw はプロバイダーのウィンドウを `% left` に正規化します。MiniMax では、残量のみのパーセントフィールドは表示前に反転され、`model_remains` レスポンスではチャットモデルエントリとモデルタグ付きプランラベルが優先されます。
- **トークン/キャッシュ行** は、ライブセッションスナップショットが疎な場合、最新のトランスクリプト使用状況エントリにフォールバックできます。既存の非ゼロのライブ値は引き続き優先され、トランスクリプトフォールバックは、保存済み合計が欠落しているか小さい場合に、アクティブなランタイムモデルラベルと、より大きなプロンプト指向の合計も復元できます。
- **実行とランタイム:** `/status` は有効なサンドボックスパスを `Execution` として、セッションを実際に実行している主体を `Runtime` として報告します: `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンド。
- **レスポンスごとのトークン/コスト** は `/usage off|tokens|full` で制御されます (通常の返信に追加されます)。
- `/model status` は **モデル/認証/エンドポイント** に関するものであり、使用状況ではありません。

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

注意:

- `/model` と `/model list` は、コンパクトな番号付きピッカー (モデルファミリー + 利用可能なプロバイダー) を表示します。
- Discord では、`/model` と `/models` はプロバイダーとモデルのドロップダウンに加え、Submit ステップを含むインタラクティブピッカーを開きます。
- `/model <#>` はそのピッカーから選択します (可能な場合は現在のプロバイダーを優先します)。
- `/model status` は、設定済みプロバイダーエンドポイント (`baseUrl`) と API モード (`api`) が利用可能な場合、それらを含む詳細ビューを表示します。

## デバッグ上書き

`/debug` では、**runtime-only** な設定オーバーライド（ディスクではなくメモリ）を設定できます。所有者専用です。デフォルトでは無効です。`commands.debug: true` で有効化します。

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

## Plugin trace 出力

`/trace` では、完全な verbose モードを有効にせずに、**セッションスコープの Plugin trace/debug 行**を切り替えられます。

例:

```text
/trace
/trace on
/trace off
```

注記:

- 引数なしの `/trace` は、現在のセッションの trace 状態を表示します。
- `/trace on` は、現在のセッションで Plugin trace 行を有効にします。
- `/trace off` は、それらを再び無効にします。
- Plugin trace 行は、`/status` 内や、通常のアシスタント返信後のフォローアップ診断メッセージとして表示される場合があります。
- `/trace` は `/debug` を置き換えるものではありません。`/debug` は引き続き runtime-only 設定オーバーライドを管理します。
- `/trace` は `/verbose` を置き換えるものではありません。通常の verbose ツール/ステータス出力は引き続き `/verbose` の対象です。

## 設定の更新

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

## MCP の更新

`/mcp` は、OpenClaw 管理の MCP サーバー定義を `mcp.servers` 配下に書き込みます。所有者専用です。デフォルトでは無効です。`commands.mcp: true` で有効化します。

例:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` は設定を OpenClaw 設定に保存し、Pi 所有のプロジェクト設定には保存しません。実際に実行可能なトランスポートは runtime アダプターが決定します。
</Note>

## Plugin の更新

`/plugins` では、オペレーターが検出済み Plugin を確認し、設定内の有効化状態を切り替えられます。読み取り専用フローでは、`/plugin` をエイリアスとして使用できます。デフォルトでは無効です。`commands.plugins: true` で有効化します。

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
- 有効化/無効化の変更後、それらを適用するには gateway を再起動してください。

</Note>

## サーフェスに関する注記

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **テキストコマンド**は通常のチャットセッションで実行されます（DM は `main` を共有し、グループはそれぞれ独自のセッションを持ちます）。
    - **ネイティブコマンド**は分離されたセッションを使用します:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>`（プレフィックスは `channels.slack.slashCommand.sessionPrefix` で設定可能）
      - Telegram: `telegram:slash:<userId>`（`CommandTargetSessionKey` 経由でチャットセッションを対象にします）
    - **`/stop`** はアクティブなチャットセッションを対象にするため、現在の実行を中断できます。

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` は、単一の `/openclaw` スタイルのコマンド向けに引き続きサポートされています。`commands.native` を有効にする場合、組み込みコマンドごとに Slack スラッシュコマンドを 1 つ作成する必要があります（名前は `/help` と同じです）。Slack のコマンド引数メニューは、一時的な Block Kit ボタンとして配信されます。

    Slack ネイティブの例外: Slack は `/status` を予約しているため、`/agentstatus`（`/status` ではなく）を登録します。Slack メッセージ内ではテキストの `/status` は引き続き機能します。

  </Accordion>
</AccordionGroup>

## BTW サイド質問

`/btw` は、現在のセッションに関する簡単な**サイド質問**です。

通常のチャットとは異なります:

- 現在のセッションを背景コンテキストとして使用します。
- 別個の **tool-less** な 1 回限りの呼び出しとして実行されます。
- 将来のセッションコンテキストを変更しません。
- transcript 履歴には書き込まれません。
- 通常のアシスタントメッセージではなく、ライブのサイド結果として配信されます。

そのため `/btw` は、メインタスクを進めたまま一時的な確認をしたい場合に役立ちます。

例:

```text
/btw what are we doing right now?
```

完全な動作とクライアント UX の詳細については、[BTW サイド質問](/ja-JP/tools/btw) を参照してください。

## 関連

- [Skills の作成](/ja-JP/tools/creating-skills)
- [Skills](/ja-JP/tools/skills)
- [Skills 設定](/ja-JP/tools/skills-config)
