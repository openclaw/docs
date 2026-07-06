---
read_when:
    - チャットコマンドの使用または設定
    - コマンドルーティングまたは権限のデバッグ
    - skill コマンドの登録方法を理解する
sidebarTitle: Slash commands
summary: 利用可能なすべてのスラッシュコマンド、ディレクティブ、インラインショートカット — 設定、ルーティング、各サーフェスの動作。
title: スラッシュコマンド
x-i18n:
    generated_at: "2026-07-06T10:56:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 297d7503c7c8f140279733a8417b1a9d4fd239b5bf7d9944312907d0f2119ba1
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway は、`/` で始まる単独メッセージとして送信されたコマンドを処理します。
ホスト専用の bash コマンドは `! <cmd>` を使用します（`/bash <cmd>` はエイリアスです）。

会話が ACP セッションにバインドされている場合、通常のテキストは ACP
ハーネスにルーティングされます。Gateway 管理コマンドはローカルのままです。`/acp ...` は常に
OpenClaw コマンドハンドラーに届き、サーフェスでコマンド処理が有効な場合は
`/status` と `/unfocus` もローカルのままです。

## 3 種類のコマンド

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    Gateway によって処理される単独の `/...` メッセージです。メッセージ内の
    唯一の内容として送信する必要があります。
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、
    `/exec`、`/model`、`/queue` — モデルが見る前にメッセージから取り除かれます。
    単独で送信された場合はセッション設定を保持し、他のテキストと一緒に送信された場合は
    インラインのヒントとして動作します。
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`、`/commands`、`/status`、`/whoami` — 即座に実行され、
    モデルが残りのテキストを見る前に取り除かれます。許可された送信者のみ。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - ディレクティブは、モデルが見る前にメッセージから取り除かれます。
    - **ディレクティブのみ**のメッセージ（メッセージがディレクティブのみ）の場合、
      セッションに保持され、確認応答を返します。
    - 他のテキストを含む**通常のチャット**メッセージでは、インラインのヒントとして動作し、
      セッション設定は保持**されません**。
    - ディレクティブは**許可された送信者**にのみ適用されます。`commands.allowFrom`
      が設定されている場合、それが使用される唯一の許可リストです。それ以外の場合、認可は
      チャンネルの許可リスト/ペアリングと `commands.useAccessGroups` から行われます。許可されていない
      送信者の場合、ディレクティブはプレーンテキストとして扱われます。
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
  チャットメッセージ内の `/...` の解析を有効にします。ネイティブコマンドのないサーフェス
  （WhatsApp、WebChat、Signal、iMessage、Google Chat、Microsoft Teams）では、`false`
  に設定されていてもテキストコマンドは動作します。
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  ネイティブコマンドを登録します。自動: Discord/Telegram ではオン、Slack ではオフ。
  ネイティブサポートのないプロバイダーでは無視されます。
  `channels.<provider>.commands.native` でチャンネルごとに上書きします。Discord では、`false` にするとスラッシュコマンドの
  登録をスキップします。以前に登録されたコマンドは、削除されるまで表示されたままになる場合があります。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  サポートされている場合、Skills コマンドをネイティブに登録します。自動: 
  Discord/Telegram ではオン、Slack ではオフ。
  `channels.<provider>.commands.nativeSkills` で上書きします。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` でホストシェルコマンドを実行できるようにします（`/bash <cmd>` エイリアス）。 
  `tools.elevated` 許可リストが必要です。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  バックグラウンドモードに切り替えるまで bash が待機する時間です（`0` は
  即座にバックグラウンド化します）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` を有効にします（`openclaw.json` の読み取り/書き込み）。オーナーのみ。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` を有効にします（`mcp.servers` 配下の OpenClaw 管理 MCP 設定の読み取り/書き込み）。オーナーのみ。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` を有効にします（Plugin の検出/ステータスに加え、インストールと有効化/無効化）。書き込みはオーナーのみ。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` を有効にします（ランタイム専用の設定上書き）。オーナーのみ。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` と Gateway 再起動ツールアクションを有効にします。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  オーナー専用コマンドサーフェス向けの明示的なオーナー許可リストです。
  `commands.allowFrom` および DM ペアリングアクセスとは別です。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  チャンネルごとの設定: オーナー専用コマンドにオーナー ID を要求します。`true` の場合、
  送信者は `commands.ownerAllowFrom` に一致するか、内部の `operator.admin`
  スコープを保持している必要があります。ワイルドカードの `allowFrom` エントリだけでは**不十分**です。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  システムプロンプト内で owner id をどのように表示するかを制御します。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` のときに使用される HMAC シークレットです。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  コマンド認可用のプロバイダーごとの allowlist です。設定すると、これはコマンドとディレクティブの
  **唯一の**認可ソースになります。グローバルデフォルトには `"*"` を使用します。プロバイダー固有のキーはそれを上書きします。
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` が設定されていない場合に、コマンドの allowlist/ポリシーを適用します。
</ParamField>

## コマンド一覧

コマンドは 3 つのソースから来ます。

- **Core 組み込み:** `src/auto-reply/commands-registry.shared.ts`
- **生成された dock コマンド:** `src/auto-reply/commands-registry.data.ts`
- **Plugin コマンド:** plugin `registerCommand()` 呼び出し

利用可否は、config フラグ、チャネルサーフェス、インストール済み/有効化済みの
plugins によって決まります。

### Core コマンド

<AccordionGroup>
  <Accordion title="セッションと実行">
    | コマンド | 説明 |
    | --- | --- |
    | `/new [model]` | 現在のセッションをアーカイブし、新しいセッションを開始します |
    | `/reset [soft [message]]` | 現在のセッションをその場でリセットします。`soft` はトランスクリプトを保持し、再利用された CLI バックエンドセッション id を破棄し、起動処理を再実行します |
    | `/name <title>` | 現在のセッションに名前を付ける、または名前を変更します。タイトルを省略すると、現在の名前と提案が表示されます |
    | `/compact [instructions]` | セッションコンテキストをコンパクト化します。[Compaction](/ja-JP/concepts/compaction) を参照してください |
    | `/stop` | 現在の実行を中止します |
    | `/session idle <duration\|off>` | スレッドバインディングのアイドル期限切れを管理します |
    | `/session max-age <duration\|off>` | スレッドバインディングの最大経過時間による期限切れを管理します |
    | `/export-session [path]` | 現在のセッションを HTML にエクスポートします。エイリアス: `/export` |
    | `/export-trajectory [path]` | 現在のセッションの JSONL trajectory バンドルをエクスポートします。エイリアス: `/trajectory` |

    <Note>
      Control UI は入力された `/new` をインターセプトして、新しい
      dashboard セッションを作成して切り替えます。ただし、`session.dmScope: "main"` が設定されていて
      現在の親が agent のメインセッションである場合は例外で、その場合 `/new` は
      メインセッションをその場でリセットします。入力された `/reset` は引き続き Gateway の
      その場でのリセットを実行します。固定されたセッションモデル選択をクリアしたい場合は
      `/model default` を使用してください。
    </Note>

  </Accordion>

  <Accordion title="モデルと実行制御">
    | コマンド | 説明 |
    | --- | --- |
    | `/think <level\|default>` | thinking レベルを設定するか、セッションの上書きをクリアします。エイリアス: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | verbose 出力を切り替えます。エイリアス: `/v` |
    | `/trace on\|off` | 現在のセッションの plugin trace 出力を切り替えます |
    | `/fast [status\|auto\|on\|off\|default]` | fast モードを表示、設定、またはクリアします |
    | `/reasoning [on\|off\|stream]` | reasoning の表示を切り替えます。エイリアス: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | elevated モードを切り替えます。エイリアス: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec デフォルトを表示または設定します |
    | `/login [codex\|openai\|openai-codex]` | プライベートチャットまたは Web UI セッションから Codex/OpenAI ログインをペアリングします。owner/admin のみ |
    | `/model [name\|#\|status]` | モデルを表示または設定します |
    | `/models [provider] [page] [limit=<n>\|all]` | 設定済み/認証利用可能なプロバイダーまたはモデルを一覧表示します |
    | `/queue <mode>` | active-run queue の動作を管理します。[Queue](/ja-JP/concepts/queue) と [Queue steering](/ja-JP/concepts/queue-steering) を参照してください |
    | `/steer <message>` | active run にガイダンスを注入します。エイリアス: `/tell`。[Steer](/ja-JP/tools/steer) を参照してください |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning の安全性">
        - `/verbose` はデバッグ用です。通常使用では **off** のままにしてください。
        - `/trace` は plugin 所有の trace/debug 行のみを表示します。通常の verbose な雑多な出力は off のままです。
        - `/fast auto|on|off` はセッションの上書きを永続化します。クリアするには Sessions UI の `inherit` オプションを使用してください。
        - `/fast` はプロバイダー固有です。OpenAI/Codex では `service_tier=priority` に対応し、直接の Anthropic リクエストでは `service_tier=auto` または `standard_only` に対応します。
        - `/reasoning`、`/verbose`、`/trace` はグループ設定ではリスクがあります。内部 reasoning や plugin diagnostics が表示される可能性があります。グループチャットでは off のままにしてください。

      </Accordion>
      <Accordion title="モデル切り替えの詳細">
        - `/model` は新しいモデルを即座にセッションへ永続化します。
        - agent がアイドル状態の場合、次の実行ですぐに使用されます。
        - 実行中の場合、切り替えは保留としてマークされ、次のクリーンな再試行ポイントで適用されます。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="検出とステータス">
    | コマンド | 説明 |
    | --- | --- |
    | `/help` | 短いヘルプ概要を表示します |
    | `/commands` | 生成されたコマンドカタログを表示します |
    | `/tools [compact\|verbose]` | 現在の agent が今すぐ使用できるものを表示します |
    | `/status` | 実行/runtime ステータス、Gateway と system の uptime、plugin health、さらに provider usage/quota を表示します |
    | `/status plugins` | 詳細な plugin health を表示します: load errors、quarantines、channel plugin failures、dependency issues、compatibility notices。`commands.plugins: true` が必要です |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | 現在のセッションの永続的な [goal](/ja-JP/tools/goal) を管理します |
    | `/diagnostics [note]` | owner 専用の support-report フローです。毎回 exec approval を求めます |
    | `/crestodian <request>` | owner DM から Crestodian setup and repair helper を実行します |
    | `/tasks` | 現在のセッションの active/recent background tasks を一覧表示します |
    | `/context [list\|detail\|map\|json]` | context がどのように組み立てられるかを説明します |
    | `/whoami` | あなたの sender id を表示します。エイリアス: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | per-response usage footer を制御するか（`reset`/`inherit`/`clear`/`default` はセッションの上書きをクリアし、設定済みデフォルトを再継承します）、local cost summary を出力します |
  </Accordion>

  <Accordion title="Skills、allowlists、approvals">
    | コマンド | 説明 |
    | --- | --- |
    | `/skill <name> [input]` | 名前で skill を実行します |
    | `/learn [request]` | 現在の会話または名前付きソースから [Skill Workshop](/ja-JP/tools/skill-workshop) を通じてレビュー可能な skill を 1 つ下書きします |
    | `/allowlist [list\|add\|remove] ...` | allowlist エントリを管理します。テキストのみ |
    | `/approve <id> <decision>` | exec または plugin approval prompts を解決します |
    | `/btw <question>` | セッションコンテキストを変更せずに副次的な質問をします。エイリアス: `/side`。[BTW](/ja-JP/tools/btw) を参照してください |
  </Accordion>

  <Accordion title="サブエージェントと ACP">
    | コマンド | 説明 |
    | --- | --- |
    | `/subagents list\|log\|info` | 現在のセッションのサブエージェント実行を検査する |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP セッションとランタイムオプションを管理する。ランタイム制御には外部オーナーまたは内部 Gateway 管理者 ID が必要 |
    | `/focus <target>` | 現在の Discord スレッドまたは Telegram トピックをセッションターゲットにバインドする |
    | `/unfocus` | 現在のスレッドバインドを削除する |
    | `/agents` | 現在のセッションのスレッドバインド済みエージェントを一覧表示する |
  </Accordion>

  <Accordion title="オーナー限定の書き込みと管理">
    | コマンド | 必要条件 | 説明 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` を読み書きする。オーナー限定 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw 管理の MCP サーバー設定を読み書きする。オーナー限定 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin 状態を検査または変更する。書き込みはオーナー限定。エイリアス: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | ランタイム限定の設定オーバーライド。オーナー限定 |
    | `/restart` | `commands.restart: true` (デフォルト) | OpenClaw を再起動する |
    | `/send on\|off\|inherit` | オーナー | 送信ポリシーを設定する |
  </Accordion>

  <Accordion title="音声、TTS、チャンネル制御">
    | コマンド | 説明 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS を制御する。[TTS](/ja-JP/tools/tts) を参照 |
    | `/activation mention\|always` | グループの起動モードを設定する |
    | `/bash <command>` | ホストシェルコマンドを実行する。エイリアス: `! <command>`。`commands.bash: true` が必要 |
    | `!poll [sessionId]` | バックグラウンドの bash ジョブを確認する |
    | `!stop [sessionId]` | バックグラウンドの bash ジョブを停止する |
  </Accordion>
</AccordionGroup>

### Dock コマンド

Dock コマンドは、アクティブなセッションの返信ルートを別のリンク済みチャンネルへ切り替えます。
セットアップとトラブルシューティングについては、[チャンネルドッキング](/ja-JP/concepts/channel-docking) を参照してください。

ネイティブコマンド対応のチャンネル Plugin から生成されます:

- `/dock-discord` (エイリアス: `/dock_discord`)
- `/dock-mattermost` (エイリアス: `/dock_mattermost`)
- `/dock-slack` (エイリアス: `/dock_slack`)
- `/dock-telegram` (エイリアス: `/dock_telegram`)

Dock コマンドには `session.identityLinks` が必要です。送信元の送信者とターゲットピアは、
同じ ID グループに属している必要があります。

### バンドル済み Plugin コマンド

| コマンド                                                | 説明                                                                                                                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | メモリ Dreaming を切り替える (オーナーまたは Gateway 管理者)。[Dreaming](/ja-JP/concepts/dreaming) を参照                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | デバイスペアリングを管理する。[ペアリング](/ja-JP/channels/pairing) を参照                                                                                                                           |
| `/phone status\|arm ...\|disarm`                        | 高リスクの電話ノードコマンドを一時的に有効化する                                                                                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Talk 音声設定を管理する。Discord ネイティブ名: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | LINE リッチカードプリセットを送信する。[LINE](/ja-JP/channels/line) を参照                                                                                                                           |
| `/codex <action> ...`                                   | Codex アプリサーバーハーネスをバインド、誘導、検査する (status、threads、resume、model、fast、permissions、compact、review、mcp、skills など)。[Codex ハーネス](/ja-JP/plugins/codex-harness) を参照 |

QQBot 限定: `/bot-ping`、`/bot-version`、`/bot-help`、`/bot-upgrade`、`/bot-logs`

### スキルコマンド

ユーザーが呼び出せるスキルはスラッシュコマンドとして公開されます:

- `/skill <name> [input]` は汎用エントリポイントとして常に動作します。
- スキルは直接コマンドとして登録できます (例: OpenProse の `/prose`)。
- ネイティブスキルコマンド登録は `commands.nativeSkills` と
  `channels.<provider>.commands.nativeSkills` で制御されます。
- 名前は `a-z0-9_` にサニタイズされます (最大 32 文字)。衝突した場合は数値サフィックスが付きます。

<AccordionGroup>
  <Accordion title="スキルコマンドのディスパッチ">
    デフォルトでは、スキルコマンドは通常のリクエストとしてモデルにルーティングされます。

    Skills は `command-dispatch: tool` を宣言して、ツールへ直接ルーティングできます
    (決定的で、モデルは関与しません)。例: `/prose` (OpenProse Plugin)
    — [OpenProse](/ja-JP/prose) を参照してください。

  </Accordion>
  <Accordion title="ネイティブコマンド引数">
    Discord は、動的オプションと、必須引数が省略された場合のボタンメニューにオートコンプリートを使用します。
    Telegram と Slack は、選択肢のあるコマンドにボタンメニューを表示します。
    動的な選択肢はターゲットセッションのモデルに対して解決されるため、`/think` レベルのようなモデル
    固有のオプションはセッションの `/model` オーバーライドに従います。
  </Accordion>
</AccordionGroup>

## `/tools`: エージェントが現在使用できるもの

`/tools` はランタイム上の質問、つまり**このエージェントがこの
会話内で今すぐ使用できるもの**に答えます。静的な設定カタログではありません。

```text
/tools         # compact view
/tools verbose # with short descriptions
```

結果はセッションスコープです。エージェント、チャンネル、スレッド、送信者の
認可、またはモデルを変更すると、出力が変わる場合があります。プロファイルとオーバーライドの編集には、
Control UI の Tools パネルまたは設定サーフェスを使用してください。

## `/model`: モデル選択

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

Discord では、`/model` と `/models` がプロバイダーとモデルのドロップダウンを備えた
インタラクティブなピッカーを開きます。ピッカーは `agents.defaults.models` を尊重し、
`provider/*` エントリも含みます。

## `/config`: ディスク上の設定書き込み

<Note>
  オーナー限定。デフォルトでは無効です — `commands.config: true` で有効化します。
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

設定は書き込み前に検証されます。無効な変更は拒否されます。`/config`
の更新は再起動後も保持されます。

## `/mcp`: MCP サーバー設定

<Note>
  オーナー限定。デフォルトでは無効です — `commands.mcp: true` で有効化します。
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` は、埋め込みエージェントのプロジェクト設定ではなく、OpenClaw 設定に設定を保存します。

## `/debug`: ランタイム限定のオーバーライド

<Note>
  オーナー限定。デフォルトでは無効です — `commands.debug: true` で有効化します。
  オーバーライドは新しい設定読み取りに即時適用されますが、ディスクには**書き込まれません**。
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: Plugin 管理

<Note>
  書き込みはオーナー限定。デフォルトでは無効です — `commands.plugins: true` で有効化します。
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` は Plugin 設定を更新し、新しいエージェントターン向けに Gateway
Plugin ランタイムをホットリロードします。`/plugins install` は Plugin ソースモジュールが変更されたため、
管理対象 Gateway を自動的に再起動します。

## `/trace`: Plugin トレース出力

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` は、完全な詳細モードなしで、セッションスコープの Plugin トレース/デバッグ行を表示します。
これは `/debug` (ランタイムオーバーライド) や `/verbose` (通常の
ツール出力) を置き換えるものではありません。

## `/btw`: 横道の質問

`/btw` は現在のセッションコンテキストに関する短い横道の質問です。エイリアス: `/side`。

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

通常のメッセージとは異なります:

- 現在のセッションを背景コンテキストとして使用します。
- Codex ハーネスセッションでは、一時的な Codex サイドスレッドとして実行されます。
- 将来のセッションコンテキストを変更**しません**。
- トランスクリプト履歴には書き込まれません。

完全な挙動については、[BTW 横道の質問](/ja-JP/tools/btw) を参照してください。

## サーフェスの注記

<AccordionGroup>
  <Accordion title="サーフェスごとのセッションスコープ">
    - **テキストコマンド:** 通常のチャットセッションで実行されます (DM は `main` を共有し、グループは独自のセッションを持ちます)。
    - **ネイティブ Discord コマンド:** `agent:<agentId>:discord:slash:<userId>`
    - **ネイティブ Slack コマンド:** `agent:<agentId>:slack:slash:<userId>` (`channels.slack.slashCommand.sessionPrefix` でプレフィックスを設定可能)
    - **ネイティブ Telegram コマンド:** `telegram:slash:<userId>` (`CommandTargetSessionKey` 経由でチャットセッションをターゲットにします)
    - **`/login codex`** は、プライベートチャットまたは Web UI レスポンスパス経由でのみデバイスペアリングコードを送信します。Telegram グループ/トピックからの呼び出しでは、代わりにオーナーへボットに DM するよう求めます。
    - **`/stop`** は現在の実行を中止するためにアクティブなチャットセッションをターゲットにします。

  </Accordion>
  <Accordion title="Slack 固有事項">
    `channels.slack.slashCommand` は単一の `/openclaw` 形式のコマンドをサポートします。
    `commands.native: true` の場合、組み込みコマンドごとに Slack スラッシュコマンドを 1 つ作成します。
    Slack は `/status` を予約しているため、`/agentstatus` (`/status` ではない) を登録します。
    テキストの `/status` は Slack メッセージ内でも引き続き動作します。
  </Accordion>
  <Accordion title="高速パスとインラインショートカット">
    - 許可リストに含まれる送信者からのコマンドのみのメッセージは、即時処理されます (キュー + モデルをバイパス)。
    - インラインショートカット (`/help`、`/commands`、`/status`、`/whoami`) は通常のメッセージに埋め込まれていても動作し、残りのテキストをモデルが見る前に取り除かれます。
    - 認可されていないコマンドのみのメッセージは黙って無視されます。インラインの `/...` トークンは通常のテキストとして扱われます。

  </Accordion>
  <Accordion title="引数の注記">
    - コマンドは、コマンドと引数の間に任意の `:` を受け付けます (`/think: high`、`/send: on`)。
    - `/new <model>` は、モデルエイリアス、`provider/model`、またはプロバイダー名 (あいまい一致) を受け付けます。一致しない場合、そのテキストはメッセージ本文として扱われます。
    - `/allowlist add|remove` には `commands.config: true` が必要で、チャンネルの `configWrites` を尊重します。

  </Accordion>
</AccordionGroup>

## プロバイダー使用量とステータス

- **プロバイダー使用量/クォータ** (例: 「Claude 80% left」) は、使用量追跡が有効な場合、現在のモデルプロバイダーについて `/status` に表示されます。
- `/status` の**トークン/キャッシュ行**は、ライブセッションスナップショットが少ない場合、最新のトランスクリプト使用量エントリへフォールバックできます。
- **実行とランタイム:** `/status` は有効なサンドボックスパスを `Execution` として、セッションを実行している主体を `Runtime` として報告します: `OpenClaw Default`、`OpenAI Codex`、CLI バックエンド、または ACP バックエンド。
- **レスポンスごとのトークン/コスト:** `/usage off|tokens|full` で制御されます。
- `/model status` はモデル/認証/エンドポイントに関するもので、使用量に関するものではありません。

## 関連

<CardGroup cols={2}>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="puzzle-piece">
    skill のスラッシュコマンドがどのように登録され、ゲートされるか。
  </Card>
  <Card title="スキルの作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    独自のスラッシュコマンドを登録する skill を構築します。
  </Card>
  <Card title="BTW" href="/ja-JP/tools/btw" icon="comments">
    セッションコンテキストを変更せずに横道の質問をする。
  </Card>
  <Card title="Steer" href="/ja-JP/tools/steer" icon="compass">
    `/steer` で実行中の agent を誘導します。
  </Card>
</CardGroup>
