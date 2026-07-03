---
read_when:
    - フィールド単位の正確な設定セマンティクスまたはデフォルトが必要です
    - チャネル、モデル、Gateway、またはツールの設定ブロックを検証する場合
summary: コア OpenClaw キー、デフォルト、および専用サブシステムリファレンスへのリンクに関する Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-07-03T23:26:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Core 設定リファレンス（`~/.openclaw/openclaw.json`）。タスク指向の概要は[構成](/ja-JP/gateway/configuration)を参照してください。

OpenClaw の主要な設定サーフェスを扱い、サブシステムに独自のより詳しいリファレンスがある場合はそちらへリンクします。チャネルおよび Plugin が所有するコマンドカタログや、メモリ/QMD の詳細なノブは、このページではなくそれぞれのページにあります。

コード上の真実:

- `openclaw config schema` は、検証と Control UI に使われるライブ JSON Schema を出力します。利用可能な場合は、バンドル済み/Plugin/チャネルのメタデータもマージされます
- `config.schema.lookup` は、掘り下げツール向けにパス単位のスキーマノードを 1 つ返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のスキーマサーフェスに対して設定ドキュメントのベースラインハッシュを検証します

エージェントの参照パス: 編集前に、正確なフィールド単位のドキュメントと制約を確認するには、`gateway` ツールアクション `config.schema.lookup` を使用してください。タスク指向のガイダンスには[構成](/ja-JP/gateway/configuration)を使用し、より広いフィールドマップ、デフォルト、サブシステムリファレンスへのリンクにはこのページを使用してください。

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)
- 現在の組み込み + バンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)
- チャネル固有のコマンドサーフェスについては、所有元のチャネル/Plugin ページ

設定形式は **JSON5** です（コメントと末尾カンマを使用できます）。すべてのフィールドは任意です - 省略時は OpenClaw が安全なデフォルトを使用します。

---

## チャネル

チャネルごとの設定キーは専用ページに移動しました - Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他のバンドル済みチャネル（認証、アクセス制御、マルチアカウント、メンションゲーティング）を含む `channels.*` については、[構成 - チャネル](/ja-JP/gateway/config-channels)を参照してください。

## エージェントデフォルト、マルチエージェント、セッション、メッセージ

専用ページに移動しました - 次については[構成 - エージェント](/ja-JP/gateway/config-agents)を参照してください。

- `agents.defaults.*`（ワークスペース、モデル、思考、Heartbeat、メモリ、メディア、Skills、サンドボックス）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションライフサイクル、Compaction、枝刈り）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk モード）
  - `talk.consultThinkingLevel`: Control UI Talk リアルタイム相談の背後にある OpenClaw エージェント実行全体の思考レベル上書き
  - `talk.consultFastMode`: Control UI Talk リアルタイム相談の 1 回限りの高速モード上書き
  - `talk.speechLocale`: iOS/macOS での Talk 音声認識向けの任意の BCP 47 ロケール id
  - `talk.silenceTimeoutMs`: 未設定の場合、Talk は文字起こし送信前の一時停止ウィンドウにプラットフォームデフォルトを保持します（`macOS と Android では 700 ms、iOS では 900 ms`）
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` をスキップする確定済みリアルタイム Talk 文字起こし向けの Gateway リレーフォールバック

## ツールとカスタムプロバイダー

ツールポリシー、実験的トグル、プロバイダーに裏付けられたツール設定、カスタムプロバイダー / ベース URL 設定は専用ページに移動しました - [構成 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダー設定は、[構成 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls)にあります。`models` ルートは、グローバルなモデルカタログ動作も所有します。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: プロバイダーカタログ動作（`merge` または `replace`）。
- `models.providers`: プロバイダー id をキーにしたカスタムプロバイダーマップ。
- `models.providers.*.localService`: ローカルモデルサーバー向けの任意のオンデマンドプロセスマネージャー。OpenClaw は設定されたヘルスエンドポイントをプローブし、必要に応じて絶対パスの `command` を起動し、準備完了を待ってからモデルリクエストを送信します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。
- `models.pricing.enabled`: サイドカーとチャネルが Gateway ready パスに到達した後に開始されるバックグラウンドの料金ブートストラップを制御します。`false` の場合、Gateway は OpenRouter と LiteLLM の料金カタログ取得をスキップします。設定済みの `models.providers.*.models[].cost` 値は、ローカルのコスト見積もりでは引き続き機能します。

## MCP

OpenClaw 管理の MCP サーバー定義は `mcp.servers` 配下にあり、埋め込み OpenClaw とその他のランタイムアダプターによって消費されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、設定編集時に対象サーバーへ接続せずにこのブロックを管理します。

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: 設定済み MCP ツールを公開するランタイム向けの、名前付き stdio またはリモート MCP サーバー定義。リモートエントリは `transport: "streamable-http"` または `transport: "sse"` を使用します。`type: "http"` は CLI ネイティブのエイリアスで、`openclaw mcp set` と `openclaw doctor --fix` が正規の `transport` フィールドへ正規化します。
- `mcp.servers.<name>.enabled`: 保存済みのサーバー定義を保持しつつ、埋め込み OpenClaw MCP の発見とツール投影から除外するには `false` を設定します。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: サーバーごとの MCP リクエストタイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: サーバーごとの接続タイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.supportsParallelToolCalls`: MCP ツール呼び出しを並列発行するかどうかを選択できるアダプター向けの任意の並行性ヒント。
- `mcp.servers.<name>.auth`: OAuth を必要とする HTTP MCP サーバーには `"oauth"` を設定します。トークンを OpenClaw state 配下に保存するには `openclaw mcp login <name>` を実行します。
- `mcp.servers.<name>.oauth`: 任意の OAuth スコープ、リダイレクト URL、クライアントメタデータ URL の上書き。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`: プライベートエンドポイントと相互 TLS 向けの HTTP TLS 制御。
- `mcp.servers.<name>.toolFilter`: サーバーごとの任意のツール選択。`include` は発見される MCP ツールを一致する名前に制限し、`exclude` は一致する名前を隠します。エントリは正確な MCP ツール名、または単純な `*` glob です。resources または prompts を持つサーバーはユーティリティツール名（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）も生成し、それらの名前にも同じフィルターが適用されます。
- `mcp.servers.<name>.codex`: 任意の Codex app-server 投影制御。このブロックは Codex app-server スレッド専用の OpenClaw メタデータです。ACP セッション、汎用 Codex ハーネス設定、その他のランタイムアダプターには影響しません。空でない `codex.agents` は、サーバーを列挙された OpenClaw エージェント id に制限します。空、空白、または無効なスコープ付きエージェントリストは、グローバルになるのではなく、設定検証で拒否され、ランタイム投影パスで省略されます。`codex.defaultToolsApprovalMode` は、そのサーバー向けに Codex ネイティブの `default_tools_approval_mode` を出力します。OpenClaw は、Codex にネイティブの `mcp_servers` 設定を渡す前に `codex` ブロックを取り除きます。Codex のデフォルト MCP 承認動作で、すべての Codex app-server エージェントへサーバーを投影したままにするには、このブロックを省略します。
- `mcp.sessionIdleTtlMs`: セッションスコープのバンドル済み MCP ランタイム向けのアイドル TTL。1 回限りの埋め込み実行は実行終了時のクリーンアップを要求します。この TTL は、長時間存続するセッションと将来の呼び出し元のための最後の安全策です。
- `mcp.*` 配下の変更は、キャッシュ済みセッション MCP ランタイムを破棄することでホット適用されます。次のツール発見/使用時に新しい設定から再作成されるため、削除された `mcp.servers` エントリはアイドル TTL を待たずに即座に回収されます。
- ランタイム発見は、そのセッションのキャッシュ済みカタログを破棄することで MCP ツールリスト変更通知にも対応します。resources または prompts を通知するサーバーには、resources の一覧表示/読み取りと prompts の一覧表示/取得のためのユーティリティツールが追加されます。ツール呼び出しが繰り返し失敗すると、別の呼び出しを試みる前に、影響を受けたサーバーが短時間一時停止されます。

ランタイム動作については、[MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry) と [CLI バックエンド](/ja-JP/gateway/cli-backends#bundle-mcp-overlays)を参照してください。

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドル済み Skills 専用の任意の許可リスト（管理対象/ワークスペース Skills には影響しません）。
- `load.extraDirs`: 追加の共有 skill ルート（最も低い優先度）。
- `load.allowSymlinkTargets`: skill シンボリックリンクが設定済みソースルート外にある場合に、そのリンクが解決してよい信頼済みの実ターゲットルート。
- `workshop.allowSymlinkTargetWrites`: すでに信頼済みのシンボリックリンクターゲット経由で Skill Workshop apply が書き込むことを許可します（デフォルト: false）。
- `install.preferBrew`: true の場合、`brew` が利用可能であれば、他のインストーラー種別へフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` 仕様向けの Node インストーラー設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`: 信頼済みの `operator.admin` Gateway クライアントが、`skills.upload.*` 経由でステージングされたプライベート zip アーカイブをインストールできるようにします（デフォルト: false）。これはアップロード済みアーカイブのパスだけを有効化します。通常の ClawHub インストールでは必要ありません。
- `entries.<skillKey>.enabled: false` は、バンドル済み/インストール済みであっても skill を無効にします。
- `entries.<skillKey>.apiKey`: 主要な環境変数を宣言する Skills 向けの簡便設定（プレーンテキスト文字列または SecretRef オブジェクト）。

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- `~/.openclaw/extensions` と `<workspace>/.openclaw/extensions` 配下のパッケージまたはバンドルディレクトリ、および `plugins.load.paths` に列挙されたファイルまたはディレクトリから読み込まれます。
- スタンドアロンのPluginファイルは `plugins.load.paths` に置いてください。自動検出される拡張ルートはトップレベルの `.js`、`.mjs`、`.ts` ファイルを無視するため、それらのルート内のヘルパースクリプトが起動を妨げることはありません。
- 検出は、ネイティブのOpenClaw Pluginに加え、互換性のあるCodexバンドルとClaudeバンドルを受け入れます。マニフェストのないClaudeデフォルトレイアウトバンドルも含まれます。
- **設定変更にはGatewayの再起動が必要です。**
- `allow`: 任意の許可リストです。列挙されたPluginのみが読み込まれます。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: PluginレベルのAPIキー簡易フィールドです（Pluginが対応している場合）。
- `plugins.entries.<id>.env`: Pluginスコープの環境変数マップです。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、coreは `before_prompt_build` をブロックし、legacy `before_agent_start` からのプロンプト変更フィールドを無視します。一方でlegacy `modelOverride` と `providerOverride` は保持します。ネイティブPluginフックと、対応バンドルが提供するフックディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼済みの非バンドルPluginは、`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end` などの型付きフックから生の会話内容を読み取れます。
- `plugins.entries.<id>.subagent.allowModelOverride`: このPluginがバックグラウンドsubagent実行ごとの `provider` と `model` の上書きを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼済みsubagent上書き用の正規 `provider/model` ターゲットの任意の許可リストです。任意のモデルを許可する意図がある場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowModelOverride`: このPluginが `api.runtime.llm.complete` のモデル上書きを要求することを明示的に信頼します。
- `plugins.entries.<id>.llm.allowedModels`: 信頼済みPlugin LLM補完上書き用の正規 `provider/model` ターゲットの任意の許可リストです。任意のモデルを許可する意図がある場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowAgentIdOverride`: このPluginがデフォルト以外のagent idに対して `api.runtime.llm.complete` を実行することを明示的に信頼します。
- `plugins.entries.<id>.config`: Plugin定義の設定オブジェクトです（利用可能な場合はネイティブOpenClaw Pluginスキーマで検証されます）。
- チャネルPluginのアカウント/ランタイム設定は `channels.<id>` 配下に置かれ、中央のOpenClawオプションレジストリではなく、所有するPluginのマニフェスト `channelConfigs` メタデータで説明されるべきです。

### CodexハーネスPlugin設定

バンドルされた `codex` Pluginは、ネイティブCodex app-serverハーネス設定を
`plugins.entries.codex.config` 配下で所有します。完全な設定
サーフェスについては[Codexハーネスリファレンス](/ja-JP/plugins/codex-harness-reference)を、ランタイムモデルについては[Codexハーネス](/ja-JP/plugins/codex-harness)を参照してください。

`codexPlugins` は、ネイティブCodexハーネスを選択するセッションにのみ適用されます。
OpenClawプロバイダー実行、ACP
会話バインディング、またはCodex以外のハーネスに対してCodex Pluginを有効化するものではありません。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: Codexハーネス向けのネイティブCodex
  Plugin/app対応を有効化します。デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  移行済みPlugin app要請に対するデフォルトの破壊的アクションポリシーです。
  プロンプトなしで安全なCodex承認スキーマを受け入れるには `true`、拒否するには `false`、
  Codexが要求する承認をOpenClaw
  Plugin承認にルーティングするには `"auto"`、永続承認なしですべてのPlugin書き込み/破壊的
  アクションをプロンプトするには `"ask"` を使用します。`"ask"` モードは、影響を受けるappの
  ツールごとの永続Codex承認上書きをクリアし、Codexスレッド開始前にそのappのhuman
  approvalsレビューアーを選択します。
  デフォルト: `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: グローバルな `codexPlugins.enabled` もtrueの場合に、
  移行済みPluginエントリを有効化します。
  デフォルト: 明示的なエントリでは `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  安定したマーケットプレイスIDです。V1は `"openai-curated"` のみ対応します。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: 移行から得られた安定した
  Codex Plugin IDです。例: `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Pluginごとの破壊的アクション上書きです。省略時は、グローバルな
  `allow_destructive_actions` 値が使用されます。Pluginごとの値は、同じ
  `true`、`false`、`"auto"`、`"ask"` ポリシーを受け入れます。

`"ask"` を使用する、許可された各Plugin appは、そのappの承認リクエストを
humanレビューアーにルーティングします。他のappと非appスレッド承認は、設定済みの
レビューアーを維持するため、混在したPluginポリシーが `"ask"` の動作を継承することはありません。

`codexPlugins.enabled` はグローバルな有効化ディレクティブです。移行によって書き込まれた明示的なPlugin
エントリは、永続的なインストールおよび修復適格性セットです。
`plugins["*"]` は対応しておらず、`install` スイッチはありません。また、ローカルの
`marketplacePath` 値はホスト固有であるため、意図的に設定フィールドにはしていません。

`app/list` readinessチェックは1時間キャッシュされ、古くなった場合は
非同期に更新されます。Codexスレッドapp設定は、各ターンではなくCodexハーネス
セッション確立時に計算されます。ネイティブPlugin設定を変更した後は、`/new`、`/reset`、またはGateway
再起動を使用してください。

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetchプロバイダー設定です。
  - `apiKey`: 上限を引き上げるための任意のFirecrawl APIキーです（SecretRefを受け入れます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、legacy `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数にフォールバックします。
  - `baseUrl`: Firecrawl APIベースURLです（デフォルト: `https://api.firecrawl.dev`; self-hostedの上書きはプライベート/内部エンドポイントを対象にする必要があります）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ期間（ミリ秒）です（デフォルト: `172800000` / 2日）。
  - `timeoutSeconds`: スクレイプリクエストのタイムアウト（秒）です（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定です。
  - `enabled`: X Searchプロバイダーを有効化します。
  - `model`: 検索に使用するGrokモデルです（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory dreaming設定です。フェーズとしきい値については[Dreaming](/ja-JP/concepts/dreaming)を参照してください。
  - `enabled`: dreamingのマスタースイッチです（デフォルト `false`）。
  - `frequency`: 各完全dreaming sweepのCron間隔です（デフォルトは `"0 3 * * *"`）。
  - `model`: 任意のDream Diary subagentモデル上書きです。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。ターゲットを制限するには `allowedModels` と組み合わせてください。モデル利用不可エラーはセッションのデフォルトモデルで1回再試行されます。信頼または許可リストの失敗は黙ってフォールバックしません。
  - フェーズポリシーとしきい値は実装詳細です（ユーザー向け設定キーではありません）。
- 完全なmemory設定は[Memory設定リファレンス](/ja-JP/reference/memory-config)にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化されたClaudeバンドルPluginは、`settings.json` から埋め込みOpenClawデフォルトを提供することもできます。OpenClawはそれらを生のOpenClaw設定パッチではなく、サニタイズされたagent設定として適用します。
- `plugins.slots.memory`: 有効なmemory Plugin idを選択します。memory Pluginを無効化するには `"none"` を指定します。
- `plugins.slots.contextEngine`: 有効なコンテキストエンジンPlugin idを選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` です。

[Plugins](/ja-JP/tools/plugin)を参照してください。

---

## コミットメント

`commitments` は推論されたフォローアップmemoryを制御します。OpenClawは会話ターンからチェックインを検出し、Heartbeat実行を通じて配信できます。

- `commitments.enabled`: 推論されたフォローアップコミットメントの非表示LLM抽出、保存、Heartbeat配信を有効化します。デフォルト: `false`。
- `commitments.maxPerDay`: ローリング日単位で、agentセッションごとに配信される推論済みフォローアップコミットメントの最大数です。デフォルト: `3`。

[推論されたコミットメント](/ja-JP/concepts/commitments)を参照してください。

---

## ブラウザー

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` は `act:evaluate` と `wait --fn` を無効にします。
- `tabCleanup` は、アイドル時間の経過後、またはセッションが上限を超えたときに、
  追跡中のプライマリエージェントタブを回収します。個別のクリーンアップモードを
  無効にするには、`idleMinutes: 0` または `maxTabsPerSession: 0` を設定します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定の場合は無効になるため、ブラウザナビゲーションはデフォルトで厳格なままです。
- プライベートネットワークのブラウザナビゲーションを意図的に信頼する場合にのみ、`ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定します。
- 厳格モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）は、到達性/検出チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外には `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはアタッチ専用です（開始/停止/リセットは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用し、プロバイダーが
  直接 DevTools WebSocket URL を提供する場合は WS(S) を使用します。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび
  `attachOnly` CDP の到達性とタブを開くリクエストに適用されます。管理対象の loopback
  プロファイルはローカル CDP のデフォルトを維持します。
- 外部管理の CDP サービスが loopback 経由で到達可能な場合は、そのプロファイルの
  `attachOnly: true` を設定します。そうしないと、OpenClaw は loopback ポートを
  ローカル管理ブラウザプロファイルとして扱い、ローカルポート所有権エラーを報告することがあります。
- `existing-session` プロファイルは CDP の代わりに Chrome MCP を使用し、選択したホストまたは接続済みブラウザノード経由でアタッチできます。
- `existing-session` プロファイルでは、Brave や Edge などの特定の Chromium ベースのブラウザプロファイルを対象にするために `userDataDir` を設定できます。
- `existing-session` プロファイルでは、Chrome が DevTools HTTP(S) 検出エンドポイントまたは直接 WS(S) エンドポイントの背後ですでに実行されている場合に `cdpUrl` を設定できます。その
  モードでは、OpenClaw は自動接続を使用せずにエンドポイントを Chrome MCP に渡します。
  Chrome MCP の起動引数では `userDataDir` は無視されます。
- `existing-session` プロファイルは現在の Chrome MCP ルート制限を維持します:
  CSS セレクターターゲティングの代わりに snapshot/ref 駆動アクション、1 ファイルアップロード
  フック、ダイアログタイムアウトのオーバーライドなし、`wait --load networkidle` なし、
  さらに `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなし。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。
  `cdpUrl` を明示的に設定するのは、リモート CDP プロファイルまたは existing-session エンドポイント
  アタッチの場合のみにしてください。
- ローカル管理プロファイルでは、そのプロファイルのグローバルな
  `browser.executablePath` を上書きするために `executablePath` を設定できます。1 つのプロファイルを
  Chrome で実行し、別のプロファイルを Brave で実行する場合に使用します。
- ローカル管理プロファイルは、プロセス開始後の Chrome CDP HTTP
  検出に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP websocket 準備完了に
  `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に起動するものの
  準備完了チェックが起動と競合する遅いホストでは、これらを引き上げます。両方の値は
  `120000` ms までの正の整数である必要があり、無効な設定値は拒否されます。
- 自動検出の順序: Chromium ベースの場合はデフォルトブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、
  Chromium 起動前に OS のホームディレクトリとして `~` と `~/...` を受け付けます。
  `existing-session` プロファイルのプロファイル単位の `userDataDir` もチルダ展開されます。
- コントロールサービス: loopback のみ（ポートは `gateway.port` から派生、デフォルトは `18791`）。
- `extraArgs` は、ローカル Chromium 起動に追加の起動フラグを付加します（例:
  `--disable-gpu`、ウィンドウサイズ、デバッグフラグ）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: ネイティブアプリ UI クロームのアクセントカラー（Talk Mode バブルの色合いなど）。
- `assistant`: Control UI の ID 上書き。アクティブエージェント ID にフォールバックします。

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list for owner/admin callers
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway field details">

- `mode`: `local`（Gateway を実行）または `remote`（リモート Gateway に接続）。`local` でない限り Gateway は起動を拒否します。
- `port`: WS + HTTP 用の単一多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IP のみ）、または `custom`。
- **レガシー bind エイリアス**: `gateway.bind` ではホストエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind モード値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Docker 注記**: デフォルトの `loopback` bind はコンテナ内の `127.0.0.1` で待ち受けます。Docker ブリッジネットワーク（`-p 18789:18789`）ではトラフィックが `eth0` に到着するため、Gateway に到達できません。`--network host` を使用するか、すべてのインターフェイスで待ち受けるために `bind: "lan"`（または `customBindHost: "0.0.0.0"` とともに `bind: "custom"`）を設定してください。
- **認証**: デフォルトで必須です。非 loopback bind では Gateway 認証が必要です。実際には、共有トークン/パスワード、または `gateway.auth.mode: "trusted-proxy"` を持つ ID 対応リバースプロキシを意味します。オンボーディングウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合（SecretRef を含む）、`gateway.auth.mode` を明示的に `token` または `password` に設定してください。両方が設定され、mode が未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモード。信頼された local loopback セットアップにのみ使用してください。これは意図的にオンボーディングプロンプトでは提示されません。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザー/ユーザー認証を ID 対応リバースプロキシに委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します（[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照）。このモードはデフォルトで **非 loopback** プロキシソースを想定します。同一ホストの loopback リバースプロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。内部の同一ホスト呼び出し元は、ローカル直接フォールバックとして `gateway.auth.password` を使用できます。`gateway.auth.token` は trusted-proxy モードと引き続き相互排他的です。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve ID ヘッダーで Control UI/WebSocket 認証を満たせます（`tailscale whois` で検証）。HTTP API エンドポイントはその Tailscale ヘッダー認証を使用せず、代わりに Gateway の通常の HTTP 認証モードに従います。このトークンなしフローは、Gateway ホストが信頼されていることを前提とします。`tailscale.mode = "serve"` の場合、デフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアント IP ごと、認証スコープごとに適用されます（shared-secret と device-token は独立して追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, clientIp}` の失敗試行は失敗書き込み前にシリアライズされます。そのため、同じクライアントからの同時の不正な試行は、両方が単なる不一致として競合して通過するのではなく、2 回目のリクエストでリミッターに達する可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックも意図的にレート制限したい場合（テストセットアップや厳格なプロキシデプロイなど）は `false` を設定してください。
- ブラウザー origin の WS 認証試行は、loopback 免除を無効にして常にスロットリングされます（ブラウザーベースの localhost 総当たり攻撃に対する多層防御）。
- loopback では、これらのブラウザー origin ロックアウトは正規化された `Origin`
  値ごとに分離されるため、ある localhost origin からの失敗の繰り返しが、別の origin を自動的に
  ロックアウトすることはありません。
- `tailscale.mode`: `serve`（tailnet のみ、loopback bind）または `funnel`（公開、認証必須）。
- `tailscale.serviceName`: Serve モード用の任意の Tailscale Service 名。例:
  `svc:openclaw`。設定すると、OpenClaw はそれを `tailscale serve
--service` に渡し、Control UI をデバイスホスト名ではなく名前付き Service 経由で公開できるようにします。値は Tailscale の `svc:<dns-label>`
  Service 名形式を使用する必要があります。起動時に派生した Service URL が報告されます。
- `tailscale.preserveFunnel`: `true` かつ `tailscale.mode = "serve"` の場合、OpenClaw は
  起動時に Serve を再適用する前に `tailscale funnel status` を確認し、外部で設定された Funnel ルートがすでに Gateway ポートをカバーしていれば
  スキップします。デフォルトは `false` です。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的なブラウザー origin 許可リスト。公開の非 loopback ブラウザー origin には必須です。loopback、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストからのプライベート same-origin LAN/Tailnet UI 読み込みは、Host ヘッダーフォールバックを有効にしなくても受け入れられます。
- `controlUi.chatMessageMaxWidth`: グループ化された Control UI チャットメッセージの任意の max-width。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)` などの制約付き CSS 幅値を受け入れます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダー origin ポリシーに意図的に依存するデプロイ向けに、Host ヘッダー origin フォールバックを有効にする危険なモード。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、公開ホストでは `remote.url` が `wss://` である必要があります。平文の `ws://` は loopback、LAN、link-local、`.local`、`.ts.net`、Tailscale CGNAT ホストでのみ受け入れられます。
- `remote.remotePort`: リモート SSH ホスト上の Gateway ポート。デフォルトは `18789` です。ローカルトンネルポートがリモート Gateway ポートと異なる場合に使用してください。
- `remote.sshHostKeyPolicy`: macOS SSH トンネルのホストキー方針。`strict` がデフォルトで、すでに信頼済みのキーが必要です。`openssh` は、管理されたエイリアスに対して有効な OpenSSH 設定を明示的にオプトインするものです。使用前に、一致するユーザーおよびシステム SSH 設定を確認してください。macOS アプリと `configure-remote` は、明示的に再度オプトインしない限り、ターゲット変更時にこの方針を `strict` にリセットします。
- `gateway.remote.token` / `.password` はリモートクライアントの認証情報フィールドです。それだけで Gateway 認証を設定するものではありません。
- `gateway.push.apns.relay.baseUrl`: relay-backed iOS ビルドが登録を Gateway に公開した後に使用される外部 APNs リレーのベース HTTPS URL。公開 App Store ビルドはホストされた OpenClaw リレーを使用します。カスタムリレー URL は、そのリレーを指すリレー URL を持つ、意図的に分離された iOS ビルド/デプロイパスと一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gateway からリレーへの送信タイムアウト（ミリ秒）。デフォルトは `10000` です。
- relay-backed 登録は特定の Gateway ID に委任されます。ペアリングされた iOS アプリは `gateway.identity.get` を取得し、その ID をリレー登録に含め、登録スコープの送信許可を Gateway に転送します。別の Gateway はその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記リレー設定の一時的な環境変数オーバーライド。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP リレー URL 向けの開発専用エスケープハッチ。本番リレー URL は HTTPS のままにしてください。
- `gateway.handshakeTimeoutMs`: 認証前 Gateway WebSocket ハンドシェイクタイムアウト（ミリ秒）。デフォルト: `15000`。`OPENCLAW_HANDSHAKE_TIMEOUT_MS` が設定されている場合は優先されます。負荷の高いホストや低電力ホストで、起動ウォームアップがまだ落ち着いていない間にローカルクライアントが接続できる場合は、これを増やしてください。
- `gateway.channelHealthCheckMinutes`: チャンネルヘルスモニター間隔（分）。ヘルスモニターによる再起動をグローバルに無効化するには `0` を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: 古いソケットのしきい値（分）。これは `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング 1 時間あたりのチャンネル/アカウントごとのヘルスモニター再起動最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターを有効にしたまま、チャンネルごとにヘルスモニター再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャンネルのアカウントごとのオーバーライド。設定すると、チャンネルレベルのオーバーライドより優先されます。
- ローカル Gateway 呼び出しパスは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、未解決の場合、解決は fail-closed になります（リモートフォールバックによるマスクなし）。
- `trustedProxies`: TLS を終端する、または転送元クライアントヘッダーを注入するリバースプロキシ IP。制御しているプロキシのみを列挙してください。loopback エントリは、同一ホストプロキシ/local-detection セットアップ（例: Tailscale Serve やローカルリバースプロキシ）では引き続き有効ですが、loopback リクエストを `gateway.auth.mode: "trusted-proxy"` の対象にするものではありません。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに Gateway は `X-Real-IP` を受け入れます。fail-closed 動作のため、デフォルトは `false` です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求スコープなしの初回ノードデバイスペアリングを自動承認するための任意の CIDR/IP 許可リスト。未設定の場合は無効です。これは operator/browser/Control UI/WebChat ペアリングを自動承認せず、role、scope、metadata、public-key のアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングおよびプラットフォーム許可リスト評価後の宣言済みノードコマンドに対するグローバルな allow/deny 形成。`camera.snap`、`camera.clip`、`screen.record` などの危険なノードコマンドにオプトインするには `allowCommands` を使用します。`denyCommands` は、プラットフォームデフォルトまたは明示的な許可に含まれる場合でもコマンドを削除します。ノードが宣言済みコマンドリストを変更した後は、そのデバイスペアリングを拒否して再承認し、Gateway が更新されたコマンドスナップショットを保存するようにしてください。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` でブロックされる追加ツール名（デフォルト拒否リストを拡張）。
- `gateway.tools.allow`: owner/admin 呼び出し元向けに、デフォルト HTTP 拒否リストからツール名を削除します。
  これは ID を持つ `operator.write` 呼び出し元を owner/admin アクセスに昇格させません。`cron`、`gateway`、`nodes` は、許可リストに含まれていても
  non-owner 呼び出し元には引き続き利用できません。

</Accordion>

### OpenAI 互換エンドポイント

- Admin HTTP RPC: `admin-http-rpc` Plugin としてデフォルトではオフです。Plugin を有効にして `POST /api/v1/admin/rpc` を登録します。[Admin HTTP RPC](/ja-JP/plugins/admin-http-rpc) を参照してください。
- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL 入力の堅牢化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の許可リストは未設定として扱われます。URL 取得を無効化するには `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使用してください。
- 任意のレスポンス堅牢化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（制御している HTTPS origin にのみ設定してください。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts)を参照）

### マルチインスタンス分離

一意のポートと状態ディレクトリを使って、1 台のホストで複数の Gateway を実行します:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev`（`~/.openclaw-dev` + ポート `19001` を使用）、`--profile <name>`（`~/.openclaw-<name>` を使用）。

[複数の Gateway](/ja-JP/gateway/multiple-gateways) を参照してください。

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: Gateway リスナーで TLS 終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカルの自己署名証明書/キーのペアを自動生成します。ローカル/開発用途のみです。
- `certPath`: TLS 証明書ファイルへのファイルシステムパス。
- `keyPath`: TLS 秘密鍵ファイルへのファイルシステムパス。権限を制限してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用の任意の CA バンドルパス。

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: 実行時に設定編集を適用する方法を制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: 設定変更時に常に Gateway プロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"` (デフォルト): まずホットリロードを試し、必要な場合は再起動にフォールバックします。
- `debounceMs`: 設定変更が適用される前のデバウンス時間 (ミリ秒、非負の整数)。
- `deferralTimeoutMs`: 再起動またはチャンネルのホットリロードを強制する前に、実行中の操作を待つ最大時間 (ミリ秒、省略可能)。デフォルトの上限付き待機 (`300000`) を使うには省略します。無期限に待機し、まだ保留中であることを示す警告を定期的にログに出すには `0` を設定します。

---

## フック

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。
クエリ文字列のフックトークンは拒否されます。

検証と安全性に関する注記:

- `hooks.enabled=true` には、空でない `hooks.token` が必要です。
- `hooks.token` は、アクティブな Gateway 共有シークレット認証 (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) とは別にする必要があります。再利用を検出すると、起動時に致命的ではないセキュリティ警告がログに記録されます。
- `openclaw security audit` は、監査時にのみ指定された Gateway パスワード認証 (`--auth password --password <password>`) を含め、フック/Gateway 認証の再利用を重大な検出事項として報告します。永続化された再利用中の `hooks.token` をローテーションするには `openclaw doctor --fix` を実行し、その後、外部のフック送信元を新しいフックトークンを使うよう更新します。
- `hooks.path` に `/` は使えません。`/hooks` など専用のサブパスを使ってください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限します (例: `["hook:"]`)。
- マッピングまたはプリセットがテンプレート化された `sessionKey` を使う場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定します。静的なマッピングキーには、このオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードからの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合のみ受け付けられます (デフォルト: `false`)。
- `POST /hooks/<name>` → `hooks.mappings` で解決されます
  - テンプレートでレンダーされたマッピングの `sessionKey` 値は外部から指定されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="Mapping details">

- `match.path` は `/hooks` の後のサブパスに一致します (例: `/hooks/gmail` → `gmail`)。
- `match.source` は汎用パス用にペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` は、フックアクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` 内にとどまります (絶対パスとトラバーサルは拒否されます)。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` 配下に置いてください。ワークスペースのスキルディレクトリは拒否されます。`openclaw doctor` がこのパスを無効として報告する場合は、変換モジュールをフック変換ディレクトリに移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントへルーティングします。不明な ID はデフォルトエージェントにフォールバックします。
- `allowedAgentIds`: 有効なエージェントルーティングを制限します。`agentId` が省略された場合のデフォルトエージェントパスも含みます (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: 明示的な `sessionKey` がないフックエージェント実行用の、省略可能な固定セッションキー。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元とテンプレート駆動のマッピングセッションキーが `sessionKey` を設定できるようにします (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) に対する、省略可能なプレフィックス許可リスト。例: `["hook:"]`。マッピングまたはプリセットがテンプレート化された `sessionKey` を使う場合は必須になります。
- `deliver: true` は最終返信をチャンネルへ送信します。`channel` のデフォルトは `last` です。
- `model` はこのフック実行の LLM を上書きします (モデルカタログが設定されている場合は許可されている必要があります)。

</Accordion>

### Gmail 連携

- 組み込みの Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使います。
- そのメッセージごとのルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するよう制限します。例: `["hook:", "hook:gmail:"]`。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化されたデフォルトの代わりに静的な `sessionKey` でプリセットを上書きします。

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway は、設定されている場合、起動時に `gog gmail watch serve` を自動起動します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します。
- Gateway と並行して別の `gog gmail watch serve` を実行しないでください。

---

## Canvas Plugin ホスト

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- エージェントが編集可能な HTML/CSS/JS と A2UI を、Gateway ポート配下の HTTP で提供します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"` (デフォルト) を維持してください。
- 非ループバックのバインド: Canvas ルートには、他の Gateway HTTP サーフェスと同様に Gateway 認証 (トークン/パスワード/信頼済みプロキシ) が必要です。
- Node WebViews は通常、認証ヘッダーを送信しません。Node がペアリングされ接続された後、Gateway は Canvas/A2UI アクセス用の Node スコープ付き Capability URL を通知します。
- Capability URL はアクティブな Node WS セッションにバインドされ、短時間で期限切れになります。IP ベースのフォールバックは使われません。
- 提供される HTML にライブリロードクライアントを注入します。
- 空の場合はスターター `index.html` を自動作成します。
- A2UI も `/__openclaw__/a2ui/` で提供します。
- 変更には Gateway の再起動が必要です。
- 大きなディレクトリや `EMFILE` エラーではライブリロードを無効にしてください。

---

## 検出

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (組み込みの `bonjour` Plugin が有効な場合のデフォルト): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。LAN マルチキャスト広告には、引き続き組み込みの `bonjour` Plugin が有効である必要があります。
- `off`: Plugin の有効化状態を変えずに LAN マルチキャスト広告を抑制します。
- 組み込みの `bonjour` Plugin は macOS ホストでは自動起動し、Linux、Windows、コンテナ化された Gateway デプロイではオプトインです。
- ホスト名は、有効な DNS ラベルである場合はシステムホスト名がデフォルトになり、そうでなければ `openclaw` にフォールバックします。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。クロスネットワーク検出には、DNS サーバー (CoreDNS 推奨) + Tailscale スプリット DNS と組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env` (インライン環境変数)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- インライン環境変数は、プロセス環境にそのキーがない場合にのみ適用されます。
- `.env` ファイル: CWD の `.env` + `~/.openclaw/.env` (どちらも既存の変数を上書きしません)。
- `shellEnv`: ログインシェルプロファイルから、欠けている想定キーをインポートします。
- 完全な優先順位については [環境](/ja-JP/help/environment) を参照してください。

### 環境変数の置換

任意の設定文字列で `${VAR_NAME}` を使って環境変数を参照します:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 欠落または空の変数は、設定読み込み時にエラーを投げます。
- リテラルの `${VAR}` には `$${VAR}` でエスケープします。
- `$include` と連携します。

---

## シークレット

シークレット参照は追加的です。平文の値も引き続き機能します。

### `SecretRef`

次のいずれかのオブジェクト形状を使います:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON ポインター (例: `"/providers/openai/apiKey"`)
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (AWS 形式の `secret#json_key` セレクターをサポート)
- `source: "exec"` の ID には、スラッシュ区切りのパスセグメントとして `.` または `..` を含めてはいけません (例: `a/../b` は拒否されます)

### サポートされる認証情報サーフェス

- 正規マトリックス: [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、サポートされている `openclaw.json` 認証情報パスを対象にします。
- `auth-profiles.json` の参照は、実行時の解決と監査カバレッジに含まれます。

### シークレットプロバイダー設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

注記:

- `file` プロバイダーは `mode: "json"` と `mode: "singleValue"` をサポートします (`singleValue` モードでは `id` は `"value"` である必要があります)。
- Windows ACL 検証が利用できない場合、ファイルおよび exec プロバイダーのパスはフェイルクローズします。`allowInsecurePath: true` は、検証できない信頼済みパスに対してのみ設定してください。
- `exec` プロバイダーには絶対 `command` パスが必要で、stdin/stdout でプロトコルペイロードを使います。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決後のターゲットパスを検証しつつシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定します。
- `trustedDirs` が設定されている場合、信頼済みディレクトリチェックは解決後のターゲットパスに適用されます。
- `exec` 子環境はデフォルトで最小構成です。必要な変数は `passEnv` で明示的に渡してください。
- シークレット参照はアクティベーション時にメモリ内スナップショットへ解決され、その後、リクエストパスはスナップショットのみを読み取ります。
- アクティベーション中にアクティブサーフェスのフィルタリングが適用されます。有効なサーフェス上の未解決参照は起動/リロードを失敗させ、一方で非アクティブなサーフェスは診断付きでスキップされます。

---

## 認証ストレージ

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- エージェントごとのプロファイルは `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は、静的認証情報モード向けに値レベルの参照（`api_key` には `keyRef`、`token` には `tokenRef`）をサポートします。
- `{ "provider": { "apiKey": "..." } }` のようなレガシーのフラットな `auth-profiles.json` マップはランタイム形式ではありません。`openclaw doctor --fix` は、`.legacy-flat.*.bak` バックアップを作成したうえで、標準の `provider:default` API キープロファイルに書き換えます。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef による認証プロファイル認証情報をサポートしません。
- 静的ランタイム認証情報は、メモリ内で解決されたスナップショットから取得されます。レガシーの静的 `auth.json` エントリは、検出時に消去されます。
- レガシー OAuth は `~/.openclaw/credentials/oauth.json` からインポートします。
- [OAuth](/ja-JP/concepts/oauth) を参照してください。
- シークレットのランタイム動作と `audit/configure/apply` ツール: [シークレット管理](/ja-JP/gateway/secrets)。

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: プロファイルが実際の請求/クレジット不足エラーで失敗した場合の、時間単位の基本バックオフ（デフォルト: `5`）。明示的な請求関連テキストは、`401`/`403` レスポンスでもここに分類されることがありますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーに限定されます（例: OpenRouter の `Key limit exceeded`）。再試行可能な HTTP `402` の使用量ウィンドウまたは組織/ワークスペースの利用上限メッセージは、代わりに `rate_limit` パスに分類されます。
- `billingBackoffHoursByProvider`: 請求バックオフ時間に対する任意のプロバイダー別上書き。
- `billingMaxHours`: 請求バックオフの指数的増加に対する時間単位の上限（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 確度の高い `auth_permanent` 失敗に対する分単位の基本バックオフ（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加に対する分単位の上限（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用される時間単位のローリングウィンドウ（デフォルト: `24`）。
- `overloadedProfileRotations`: モデルフォールバックに切り替える前に、過負荷エラーに対して行う同一プロバイダー内の認証プロファイルローテーションの最大回数（デフォルト: `1`）。`ModelNotReadyException` のようなプロバイダー混雑状態はここに分類されます。
- `overloadedBackoffMs`: 過負荷のプロバイダー/プロファイルローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: モデルフォールバックに切り替える前に、レート制限エラーに対して行う同一プロバイダー内の認証プロファイルローテーションの最大回数（デフォルト: `1`）。このレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` のようなプロバイダー形式のテキストが含まれます。

---

## ロギング

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- デフォルトのログファイル: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 安定したパスには `logging.file` を設定します。
- `--verbose` の場合、`consoleLevel` は `debug` に引き上げられます。
- `maxFileBytes`: ローテーション前のアクティブなログファイルの最大サイズ（バイト単位、正の整数、デフォルト: `104857600` = 100 MB）。OpenClaw は、アクティブなファイルの横に番号付きアーカイブを最大 5 個保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対する可能な範囲でのマスキング。`redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効にします。UI/ツール/診断の安全性サーフェスは、送出前に引き続きシークレットを編集します。

---

## 診断

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: インストルメンテーション出力の全体トグル（デフォルト: `true`）。
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: 長時間実行中の処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` として分類するための、進捗なし経過時間しきい値（ミリ秒）。返信、ツール、ステータス、ブロック、ACP 進捗はタイマーをリセットします。状態が変わらない間、繰り返しの `session.stuck` 診断はバックオフします。
- `stuckSessionAbortMs`: 復旧のために対象の停滞中アクティブ作業を中止ドレインできるようになるまでの、進捗なし経過時間しきい値（ミリ秒）。未設定の場合、OpenClaw は少なくとも 5 分かつ `stuckSessionWarnMs` の 3 倍という、より安全な拡張埋め込み実行ウィンドウを使用します。
- `memoryPressureSnapshot`: メモリ圧迫が `critical` に達したとき、編集済みの OOM 前安定性スナップショットを取得します（デフォルト: `false`）。通常のメモリ圧迫イベントを維持しつつ、安定性バンドルのファイルスキャン/書き込みを追加するには `true` に設定します。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効にします（デフォルト: `false`）。完全な設定、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 任意のシグナル固有 OTLP エンドポイント。設定すると、そのシグナルについてのみ `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストで送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効にします。
- `otel.logsExporter`: ログエクスポート先: `"otlp"`（デフォルト）、標準出力の 1 行ごとに 1 つの JSON オブジェクトを出力する `"stdout"`、または `"both"`。
- `otel.sampleRate`: トレースサンプリング率 `0`-`1`。
- `otel.flushIntervalMs`: 定期的なテレメトリフラッシュ間隔（ミリ秒）。
- `otel.captureContent`: OTEL span 属性向けの生コンテンツ取得のオプトイン。デフォルトはオフです。Boolean の `true` は、非システムメッセージ/ツールコンテンツを取得します。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt`、`toolDefinitions` を明示的に有効化できます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新の実験的な GenAI 推論 span 形式のための環境トグルです。`{gen_ai.operation.name} {gen_ai.request.model}` span 名、`CLIENT` span 種類、レガシーの `gen_ai.system` の代わりの `gen_ai.provider.name` を含みます。デフォルトでは、互換性のために span は `openclaw.model.call` と `gen_ai.system` を維持します。GenAI メトリクスは境界付けられたセマンティック属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: グローバル OpenTelemetry SDK をすでに登録しているホスト向けの環境トグルです。OpenClaw は、診断リスナーをアクティブに保ったまま、Plugin 所有の SDK 起動/シャットダウンをスキップします。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 一致する設定キーが未設定の場合に使用される、シグナル固有のエンドポイント環境変数。
- `cacheTrace.enabled`: 埋め込み実行のキャッシュトレーススナップショットをログに記録します（デフォルト: `false`）。
- `cacheTrace.filePath`: キャッシュトレース JSONL の出力パス（デフォルト: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: キャッシュトレース出力に含める内容を制御します（すべてデフォルト: `true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: npm/git インストールのリリースチャネル - `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: Gateway 起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: パッケージインストールのバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャネルの自動適用前の最小遅延時間（時間単位、デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャネルのロールアウト分散ウィンドウの追加時間（時間単位、デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャネルのチェック実行間隔（時間単位、デフォルト: `1`、最大: `24`）。

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: グローバル ACP 機能ゲート（デフォルト: `true`。ACP ディスパッチとスポーンの操作要素を非表示にするには `false` を設定）。
- `dispatch.enabled`: ACP セッションターンディスパッチの独立したゲート（デフォルト: `true`）。ACP コマンドを利用可能にしたまま実行をブロックするには `false` を設定します。
- `backend`: デフォルトの ACP ランタイムバックエンド ID（登録済みの ACP ランタイム Plugin と一致している必要があります）。
  先にバックエンド Plugin をインストールしてください。`plugins.allow` が設定されている場合は、バックエンド Plugin ID（例: `acpx`）を含めてください。含めないと ACP バックエンドは読み込まれません。
- `defaultAgent`: スポーンが明示的なターゲットを指定しない場合のフォールバック ACP ターゲットエージェント ID。
- `allowedAgents`: ACP ランタイムセッションで許可されるエージェント ID の許可リスト。空の場合、追加の制限はありません。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストのアイドル時フラッシュウィンドウ（ミリ秒）。
- `stream.maxChunkChars`: ストリーミングブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとの重複したステータス/ツール行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は逐次ストリーミングし、`"final_only"` はターンの終端イベントまでバッファリングします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベントの後、可視テキストの前に置く区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影されるアシスタント出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベントに対するタグ名から Boolean の可視性上書きへのレコード。
- `runtime.ttlMinutes`: ACP セッションワーカーがクリーンアップ対象になるまでのアイドル TTL（分単位）。
- `runtime.installCommand`: ACP ランタイム環境をブートストラップするときに実行する任意のインストールコマンド。

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` はバナーのタグラインスタイルを制御します:
  - `"random"` (デフォルト): 面白い/季節に応じたタグラインをローテーションします。
  - `"default"`: 固定の中立的なタグライン (`All your chats, one OpenClaw.`)。
  - `"off"`: タグラインテキストなし (バナータイトル/バージョンは引き続き表示されます)。
- バナー全体 (タグラインだけでなく) を非表示にするには、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

---

## ウィザード

CLI のガイド付きセットアップフロー (`onboard`、`configure`、`doctor`) によって書き込まれるメタデータ:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## アイデンティティ

[エージェントのデフォルト](/ja-JP/gateway/config-agents#agent-defaults)の `agents.list` アイデンティティフィールドを参照してください。

---

## ブリッジ (レガシー、削除済み)

現在のビルドには TCP ブリッジは含まれなくなりました。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーは構成スキーマの一部ではなくなりました (削除されるまで検証は失敗します。`openclaw doctor --fix` で不明なキーを取り除けます)。

<Accordion title="Legacy bridge config (historical reference)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: 完了した分離 Cron 実行セッションを `sessions.json` から剪定するまで保持する期間です。アーカイブ済みの削除済み Cron トランスクリプトのクリーンアップも制御します。デフォルト: `24h`; 無効にするには `false` を設定します。
- `runLog.maxBytes`: 古いファイルベースの Cron 実行ログとの互換性のために受け付けられます。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: ジョブごとに保持される最新の SQLite 実行履歴行数です。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST 配信 (`delivery.mode = "webhook"`) に使用される bearer トークンです。省略した場合、認証ヘッダーは送信されません。
- `webhook`: 非推奨のレガシーフォールバック Webhook URL (http/https) です。まだ `notify: true` を持つ保存済みジョブを移行するために `openclaw doctor --fix` が使用します。実行時配信では、ジョブごとの `delivery.mode="webhook"` と `delivery.to`、またはアナウンス配信を保持する場合は `delivery.completionDestination` を使用します。

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: 一時的なエラーで Cron ジョブを再試行する最大回数 (デフォルト: `3`; 範囲: `0`-`10`)。
- `backoffMs`: 各再試行のバックオフ遅延を ms 単位で表す配列 (デフォルト: `[30000, 60000, 300000]`; 1-10 個のエントリ)。
- `retryOn`: 再試行をトリガーするエラー種別 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略すると、すべての一時的な種別を再試行します。

ワンショットジョブは再試行回数を使い切るまで有効のままになり、その後、最終エラー状態を保持したまま無効化されます。繰り返しジョブは同じ一時的な再試行ポリシーを使用し、次のスケジュール枠の前にバックオフ後に再実行します。恒久的なエラー、または一時的な再試行の枯渇時には、エラーバックオフ付きの通常の繰り返しスケジュールに戻ります。

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: Cron ジョブの失敗アラートを有効にします (デフォルト: `false`)。
- `after`: アラートが発火するまでの連続失敗回数 (正の整数、最小: `1`)。
- `cooldownMs`: 同じジョブに対する繰り返しアラート間の最小ミリ秒数 (非負整数)。
- `includeSkipped`: 連続スキップ実行をアラートしきい値に数えるかどうか (デフォルト: `false`)。スキップされた実行は別個に追跡され、実行エラーのバックオフには影響しません。
- `mode`: 配信モード - `"announce"` はチャネルメッセージ経由で送信し、`"webhook"` は構成済み Webhook に投稿します。
- `accountId`: アラート配信のスコープを指定する任意のアカウントまたはチャネル ID。

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- すべてのジョブにまたがる Cron 失敗通知のデフォルト宛先です。
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータが存在する場合は `"announce"` がデフォルトです。
- `channel`: アナウンス配信のチャネルオーバーライド。`"last"` は最後に把握された配信チャネルを再利用します。
- `to`: 明示的なアナウンスターゲットまたは Webhook URL。Webhook モードでは必須です。
- `accountId`: 配信用の任意のアカウントオーバーライド。
- ジョブごとの `delivery.failureDestination` は、このグローバルデフォルトをオーバーライドします。
- グローバルにもジョブごとにも失敗宛先が設定されていない場合、すでに `announce` 経由で配信しているジョブは、失敗時にそのプライマリアナウンスターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron ジョブ](/ja-JP/automation/cron-jobs)を参照してください。分離 Cron 実行は[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

---

## メディアモデルテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完全な受信メッセージ本文                          |
| `{{RawBody}}`      | 生の本文 (履歴/送信者ラッパーなし)                |
| `{{BodyStripped}}` | グループメンションを取り除いた本文                |
| `{{From}}`         | 送信者識別子                                      |
| `{{To}}`           | 宛先識別子                                        |
| `{{MessageSid}}`   | チャネルメッセージ ID                             |
| `{{SessionId}}`    | 現在のセッション UUID                             |
| `{{IsNewSession}}` | 新しいセッションが作成された場合は `"true"`       |
| `{{MediaUrl}}`     | 受信メディア疑似 URL                              |
| `{{MediaPath}}`    | ローカルメディアパス                              |
| `{{MediaType}}`    | メディア種別 (画像/音声/ドキュメント/…)           |
| `{{Transcript}}`   | 音声トランスクリプト                              |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディアプロンプト      |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数          |
| `{{ChatType}}`     | `"direct"` または `"group"`                       |
| `{{GroupSubject}}` | グループ件名 (ベストエフォート)                   |
| `{{GroupMembers}}` | グループメンバーのプレビュー (ベストエフォート)   |
| `{{SenderName}}`   | 送信者表示名 (ベストエフォート)                   |
| `{{SenderE164}}`   | 送信者電話番号 (ベストエフォート)                 |
| `{{Provider}}`     | プロバイダーのヒント (whatsapp、telegram、discord など) |

---

## 構成インクルード (`$include`)

構成を複数のファイルに分割します:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**マージ動作:**

- 単一ファイル: 含んでいるオブジェクトを置き換えます。
- ファイル配列: 順番にディープマージされます (後のものが前のものをオーバーライドします)。
- 兄弟キー: インクルード後にマージされます (インクルードされた値をオーバーライドします)。
- ネストされたインクルード: 最大 10 階層まで。
- パス: インクルードしているファイルからの相対パスとして解決されますが、最上位構成ディレクトリ (`openclaw.json` の `dirname`) の内側に留まる必要があります。絶対パス/`../` 形式は、その境界内に解決される場合にのみ許可されます。パスに null バイトを含めてはならず、解決前後のどちらでも 4096 文字未満でなければなりません。
- 1 つのトップレベルセクションのみを変更し、そのセクションが単一ファイルのインクルードで裏付けられている OpenClaw 所有の書き込みは、そのインクルードファイルに書き込みます。たとえば、`plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` 内で更新し、`openclaw.json` はそのままにします。
- ルートインクルード、インクルード配列、兄弟オーバーライドを持つインクルードは、OpenClaw 所有の書き込みでは読み取り専用です。これらの書き込みは構成を平坦化する代わりにフェイルクローズします。
- エラー: 欠落ファイル、解析エラー、循環インクルード、無効なパス形式、過度な長さに対して明確なメッセージを出します。

---

_関連: [構成](/ja-JP/gateway/configuration) · [構成例](/ja-JP/gateway/configuration-examples) · [診断](/ja-JP/gateway/doctor)_

## 関連

- [構成](/ja-JP/gateway/configuration)
- [構成例](/ja-JP/gateway/configuration-examples)
