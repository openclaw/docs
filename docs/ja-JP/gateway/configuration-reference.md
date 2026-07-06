---
read_when:
    - 正確なフィールドレベルの設定セマンティクスまたはデフォルトが必要
    - channel、model、gateway、または tool の設定ブロックを検証している
summary: コア OpenClaw キー、デフォルト、専用サブシステムリファレンスへのリンクに関する Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-07-06T21:50:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a3dd1660e23a898ecc3610985a6dcdf0b7a0dee0fbe5e8fb3d1c475ddb0cae6
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` のフィールドレベルリファレンス: キー、デフォルト、より深いサブシステムページへのリンク。タスク指向のセットアップガイダンスについては、[Configuration](/ja-JP/gateway/configuration) を参照してください。チャンネルおよび Plugin 所有のコマンドカタログ、深いメモリ/QMD ノブはここではなく、それぞれのページにあります。

設定形式は **JSON5** です（コメントと末尾カンマを許可）。すべてのフィールドは任意です。省略時、OpenClaw は安全なデフォルトを使用します。

コード上の真実がこのページに優先します:

- `openclaw config schema` は、検証と Control UI に使われるライブ JSON Schema を、同梱/Plugin/チャンネルのメタデータをマージした状態で出力します。
- エージェントは、設定を編集する前に `gateway` ツールアクション `config.schema.lookup` を呼び出し、正確に 1 つのパススコープ付きスキーマノードを取得する必要があります。
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、このドキュメントのベースラインハッシュを現在のスキーマ表面に対して検証します。

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については、[Memory configuration reference](/ja-JP/reference/memory-config)。
- 現在の組み込み + 同梱コマンドカタログについては、[Slash commands](/ja-JP/tools/slash-commands)。
- チャンネル固有のコマンド表面については、所有するチャンネル/Plugin ページ。

---

## チャンネル

チャンネルごとの設定キーは [Configuration - channels](/ja-JP/gateway/config-channels) にあります: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、その他の同梱チャンネルの `channels.*`（認証、アクセス制御、複数アカウント、メンションゲート）。

## エージェントデフォルト、マルチエージェント、セッション、メッセージ

次については [Configuration - agents](/ja-JP/gateway/config-agents) を参照してください:

- `agents.defaults.*`（ワークスペース、モデル、思考、heartbeat、メモリ、メディア、skills、サンドボックス）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションライフサイクル、Compaction、枝刈り）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk モード）
  - `talk.consultThinkingLevel`: Control UI Talk のリアルタイム相談の背後で実行される OpenClaw エージェント全体の思考レベル上書き
  - `talk.consultFastMode`: Control UI Talk のリアルタイム相談に対する 1 回限りの高速モード上書き
  - `talk.speechLocale`: iOS/macOS の Talk 音声認識向けの任意の BCP 47 ロケール ID
  - `talk.silenceTimeoutMs`: 未設定時、Talk は文字起こし送信前にプラットフォーム既定の一時停止ウィンドウを維持します（`macOS と Android では 700 ms、iOS では 900 ms`）
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` をスキップする確定済みリアルタイム Talk 文字起こし向けの Gateway リレーフォールバック

## ツールとカスタムプロバイダー

ツールポリシー、実験的トグル、プロバイダーに裏付けられたツール設定、カスタムプロバイダー / ベース URL セットアップは、[Configuration - tools and custom providers](/ja-JP/gateway/config-tools) にあります。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダーセットアップは、[Configuration - tools and custom providers](/ja-JP/gateway/config-tools#custom-providers-and-base-urls) にあります。
`models` ルートは、グローバルなモデルカタログ動作も所有します。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: プロバイダーカタログの動作（`merge` または `replace`）。
- `models.providers`: プロバイダー ID をキーにしたカスタムプロバイダーマップ。
- `models.providers.*.localService`: ローカルモデルサーバー向けの任意のオンデマンドプロセスマネージャー。OpenClaw は設定されたヘルスエンドポイントをプローブし、必要に応じて絶対パスの `command` を起動し、準備完了を待ってからモデルリクエストを送信します。[Local model services](/ja-JP/gateway/local-model-services) を参照してください。
- `models.pricing.enabled`: サイドカーとチャンネルが Gateway ready パスに到達した後に開始するバックグラウンド価格ブートストラップを制御します。`false` の場合、Gateway は OpenRouter と LiteLLM の価格カタログ取得をスキップします。設定済みの `models.providers.*.models[].cost` 値は、ローカルコスト見積もりで引き続き機能します。

## MCP

OpenClaw 管理の MCP サーバー定義は `mcp.servers` 配下にあり、埋め込み OpenClaw とその他のランタイムアダプターによって利用されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、設定編集時に対象サーバーへ接続せずにこのブロックを管理します。

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

- `mcp.servers`: 設定済み MCP ツールを公開するランタイム向けの、名前付き stdio またはリモート MCP サーバー定義。
  リモートエントリは `transport: "streamable-http"` または `transport: "sse"` を使用します。`type: "http"` は CLI ネイティブのエイリアスであり、`openclaw mcp set` と `openclaw doctor --fix` が正規の `transport` フィールドへ正規化します。
- `mcp.servers.<name>.enabled`: 保存済みサーバー定義を保持しつつ、埋め込み OpenClaw MCP 検出とツール投影から除外するには `false` を設定します。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: サーバーごとの MCP リクエストタイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: サーバーごとの接続タイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.supportsParallelToolCalls`: 並列 MCP ツール呼び出しを発行するかどうかを選択できるアダプター向けの任意の並行性ヒント。
- `mcp.servers.<name>.auth`: OAuth を必要とする HTTP MCP サーバーでは `"oauth"` を設定します。OpenClaw 状態配下にトークンを保存するには `openclaw mcp login <name>` を実行します。
- `mcp.servers.<name>.oauth`: 任意の OAuth スコープ、リダイレクト URL、クライアントメタデータ URL の上書き。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`: プライベートエンドポイントと相互 TLS 向けの HTTP TLS 制御。
- `mcp.servers.<name>.toolFilter`: 任意のサーバーごとのツール選択。`include` は検出された MCP ツールを一致する名前に制限し、`exclude` は一致する名前を非表示にします。エントリは正確な MCP ツール名または単純な `*` glob です。リソースまたはプロンプトを持つサーバーはユーティリティツール名（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）も生成し、それらの名前にも同じフィルターが適用されます。
- `mcp.servers.<name>.codex`: 任意の Codex app-server 投影制御。このブロックは Codex app-server スレッド専用の OpenClaw メタデータです。ACP セッション、汎用 Codex ハーネス設定、その他のランタイムアダプターには影響しません。
  空でない `codex.agents` は、サーバーを列挙された OpenClaw エージェント ID に制限します。
  空、空白、または無効なスコープ付きエージェントリストは設定検証で拒否され、グローバルになるのではなくランタイム投影パスで省略されます。
  `codex.defaultToolsApprovalMode` は、そのサーバー向けに Codex ネイティブの `default_tools_approval_mode` を出力します。OpenClaw は、ネイティブの `mcp_servers` 設定を Codex に渡す前に `codex` ブロックを取り除きます。Codex の既定 MCP 承認動作で、すべての Codex app-server エージェントにサーバーを投影したままにするには、このブロックを省略します。
- `mcp.sessionIdleTtlMs`: セッションスコープの同梱 MCP ランタイム向けアイドル TTL。1 回限りの埋め込み実行は実行終了時クリーンアップを要求します。この TTL は長寿命セッションと将来の呼び出し元のためのバックストップです。
- `mcp.*` 配下の変更は、キャッシュ済みセッション MCP ランタイムを破棄することでホット適用されます。
  次のツール検出/使用時に新しい設定から再作成されるため、削除された `mcp.servers` エントリはアイドル TTL を待たずに即座に回収されます。
- ランタイム検出は、そのセッションのキャッシュ済みカタログを破棄することで、MCP ツールリスト変更通知も尊重します。リソースまたはプロンプトを広告するサーバーには、リソースの一覧/読み取りとプロンプトの一覧/取得のためのユーティリティツールが追加されます。ツール呼び出しの失敗が繰り返されると、別の呼び出しを試行する前に、影響を受けたサーバーを短時間一時停止します。

ランタイム動作については [MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry) と [CLI backends](/ja-JP/gateway/cli-backends#bundle-mcp-overlays) を参照してください。

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

- `allowBundled`: 同梱 Skills のみを対象にする任意の許可リスト（管理対象/ワークスペース Skills には影響しません）。
- `load.extraDirs`: 追加の共有 Skill ルート（最も低い優先順位）。
- `load.allowSymlinkTargets`: Skill シンボリックリンクが設定済みソースルートの外にある場合に、そのリンクが解決してよい信頼済みの実ターゲットルート。
- `workshop.allowSymlinkTargetWrites`: Skill Workshop の適用が、すでに信頼済みのシンボリックリンクターゲットを通じて書き込むことを許可します（デフォルト: false）。
- `install.preferBrew`: true の場合、`brew` が利用可能なら他のインストーラー種別にフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` 仕様向けの Node インストーラー設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`: 信頼済みの `operator.admin` Gateway クライアントが `skills.upload.*` 経由でステージングされたプライベート zip アーカイブをインストールできるようにします（デフォルト: false）。これはアップロード済みアーカイブのパスだけを有効にします。通常の ClawHub インストールでは不要です。
- `entries.<skillKey>.enabled: false` は、同梱/インストール済みであっても Skill を無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数を宣言する Skills 向けの便宜設定（プレーンテキスト文字列または SecretRef オブジェクト）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`: Skill 検出とモデル向け Skills プロンプトに上限を設定します。
- Skill Workshop の自律性/承認設定（`workshop.autonomous.enabled`、`workshop.approvalPolicy`、`workshop.maxPending`、`workshop.maxSkillBytes`）は [Skills configuration](/ja-JP/tools/skills-config) に記載されています。

---

## Plugins

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

- `~/.openclaw/extensions` および `<workspace>/.openclaw/extensions` の下にあるパッケージまたはバンドルディレクトリに加え、`plugins.load.paths` に列挙されたファイルまたはディレクトリから読み込まれます。
- スタンドアロンの Plugin ファイルは `plugins.load.paths` に配置してください。自動検出される拡張ルートでは、トップレベルの `.js`、`.mjs`、`.ts` ファイルは無視されるため、それらのルートにあるヘルパースクリプトが起動を妨げることはありません。
- 検出では、ネイティブ OpenClaw Plugin に加え、互換性のある Codex バンドルと Claude バンドルを受け入れます。マニフェストなしの Claude デフォルトレイアウトバンドルも含まれます。
- **設定変更には gateway の再起動が必要です。**
- `allow`: 任意の許可リストです。列挙された Plugin のみが読み込まれます。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: Plugin レベルの API キー簡易フィールドです（Plugin が対応している場合）。
- `plugins.entries.<id>.env`: Plugin スコープの環境変数マップです。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視します。ただし、レガシー `modelOverride` と `providerOverride` は保持します。ネイティブ Plugin フックと、対応しているバンドル提供のフックディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼された非バンドル Plugin は、`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end` などの型付きフックから生の会話内容を読み取れます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この Plugin が、バックグラウンド subagent 実行ごとの `provider` および `model` 上書きを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼された subagent 上書きに対する正規の `provider/model` ターゲットの任意の許可リストです。任意のモデルを許可する意図がある場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowModelOverride`: この Plugin が `api.runtime.llm.complete` のモデル上書きを要求することを明示的に信頼します。
- `plugins.entries.<id>.llm.allowedModels`: 信頼された Plugin LLM completion 上書きに対する正規の `provider/model` ターゲットの任意の許可リストです。任意のモデルを許可する意図がある場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowAgentIdOverride`: この Plugin がデフォルトではない agent id に対して `api.runtime.llm.complete` を実行することを明示的に信頼します。
- `plugins.entries.<id>.config`: Plugin 定義の設定オブジェクトです（利用可能な場合はネイティブ OpenClaw Plugin スキーマで検証されます）。
- Channel Plugin のアカウント/ランタイム設定は `channels.<id>` の下にあり、中央の OpenClaw オプションレジストリではなく、所有する Plugin のマニフェスト `channelConfigs` メタデータで説明されるべきです。

### Codex ハーネス Plugin 設定

バンドルされた `codex` Plugin は、ネイティブ Codex app-server ハーネス設定を
`plugins.entries.codex.config` の下で所有します。完全な設定サーフェスについては
[Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を、ランタイムモデルについては
[Codex ハーネス](/ja-JP/plugins/codex-harness) を参照してください。

`codexPlugins` は、ネイティブ Codex ハーネスを選択するセッションにのみ適用されます。
OpenClaw provider 実行、ACP 会話バインディング、または Codex 以外のハーネスで
Codex Plugin を有効にするものではありません。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
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

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex ハーネス向けのネイティブ Codex
  Plugin/app サポートを有効にします。デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: 認証済み Codex アカウントに接続されている、
  現在アクセス可能なすべての app を、新しい各ネイティブ Codex スレッドで公開します。
  デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  移行された Plugin app elicitations に対するデフォルトの破壊的アクションポリシーです。
  プロンプトなしで安全な Codex approval スキーマを受け入れるには `true`、拒否するには `false`、
  Codex が要求する approvals を OpenClaw Plugin approvals にルーティングするには `"auto"`、
  永続的な approval なしで Plugin のすべての書き込み/破壊的アクションにプロンプトを出すには `"ask"` を使用します。
  `"ask"` モードは、影響を受ける app の Codex の per-tool approval 上書きを消去し、
  Codex スレッド開始前にその app の human approvals reviewer を選択します。
  デフォルト: `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: グローバルな `codexPlugins.enabled` も true の場合に、
  移行された Plugin エントリを有効にします。
  明示的なエントリのデフォルト: `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  安定した marketplace ID です。V1 は `"openai-curated"` のみをサポートします。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: 移行元の安定した
  Codex Plugin ID です。例: `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Plugin ごとの破壊的アクション上書きです。省略した場合は、グローバルな
  `allow_destructive_actions` 値が使用されます。Plugin ごとの値は、同じ
  `true`、`false`、`"auto"`、`"ask"` ポリシーを受け入れます。

`"ask"` を使用する許可済み Plugin app は、それぞれその app の approval リクエストを
human reviewer にルーティングします。他の app と app 以外のスレッド approvals は
設定済み reviewer を保持するため、混在する Plugin ポリシーが `"ask"` の動作を継承することはありません。

`codexPlugins.enabled` はグローバルな有効化ディレクティブです。移行によって書き込まれた明示的な Plugin
エントリは、永続的な install および repair eligibility set です。
`plugins["*"]` はサポートされておらず、`install` スイッチはありません。また、ローカルの
`marketplacePath` 値はホスト固有であるため、意図的に設定フィールドにはしていません。

`app/list` readiness チェックは 1 時間キャッシュされ、古くなると非同期に更新されます。
Codex スレッド app 設定は、ターンごとではなく Codex ハーネスセッション確立時に計算されます。
ネイティブ Plugin 設定を変更した後は、`/new`、`/reset`、または gateway の再起動を使用してください。

`codexPlugins.allow_all_plugins` は、現在アクセス可能なすべてのアカウント app を
新しい各ネイティブ Codex スレッドにスナップショットします。Plugin や app をインストールするものではなく、
アクセスできない app は除外されたままです。アカウント app はグローバルな
`codexPlugins.allow_destructive_actions` ポリシーを使用します。同じ app が両方のパスに存在する場合、
明示的な Plugin エントリが優先されます。`app/list` を読み取れない場合、アカウント全体の公開は fail closed します。

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider 設定です。
  - `apiKey`: より高い制限用の任意の Firecrawl API キーです（SecretRef を受け入れます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、レガシー `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数にフォールバックします。
  - `baseUrl`: Firecrawl API ベース URL です（デフォルト: `https://api.firecrawl.dev`。セルフホストの上書きは private/internal エンドポイントを対象にする必要があります）。
  - `onlyMainContent`: ページから本文のみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ期間（ミリ秒）です（デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイピングリクエストのタイムアウト（秒）です（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定です。
  - `enabled`: X Search provider を有効にします。
  - `model`: 検索に使用する Grok モデルです（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory dreaming 設定です。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: dreaming のマスタースイッチです（デフォルト `false`）。
  - `frequency`: 各 full dreaming sweep の cron 間隔です（デフォルトは `"0 3 * * *"`）。
  - `model`: 任意の Dream Diary subagent モデル上書きです。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。ターゲットを制限するには `allowedModels` と組み合わせてください。モデル利用不可エラーはセッションのデフォルトモデルで 1 回再試行されます。信頼または許可リストの失敗は暗黙にフォールバックしません。
  - フェーズポリシーとしきい値は実装の詳細です（ユーザー向け設定キーではありません）。
- 完全な memory 設定は [Memory 設定リファレンス](/ja-JP/reference/memory-config) にあります。
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化された Claude バンドル Plugin は、`settings.json` から埋め込み OpenClaw デフォルトを提供することもできます。OpenClaw はそれらを生の OpenClaw 設定パッチとしてではなく、サニタイズ済み agent 設定として適用します。
- `plugins.slots.memory`: アクティブな memory Plugin id を選択します。memory Plugin を無効にするには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブな context engine Plugin id を選択します。別の engine をインストールして選択しない限り、デフォルトは `"legacy"` です。

[Plugins](/ja-JP/tools/plugin) を参照してください。

---

## Commitments

`commitments` は、推論されたフォローアップ memory を制御します。OpenClaw は会話ターンから check-ins を検出し、heartbeat 実行を通じて配信できます。

- `commitments.enabled`: 推論されたフォローアップ commitments に対する非表示 LLM 抽出、保存、heartbeat 配信を有効にします。デフォルト: `false`。
- `commitments.maxPerDay`: ローリング日の agent セッションごとに配信される、推論されたフォローアップ commitments の最大数です。デフォルト: `3`。

[Inferred commitments](/ja-JP/concepts/commitments) を参照してください。

---

## Browser

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
- `tabCleanup` は、アイドル時間後、またはセッションが上限を超えたときに、
  追跡対象のプライマリエージェントタブを回収します。個別のクリーンアップモードを
  無効にするには、`idleMinutes: 0` または `maxTabsPerSession: 0` を設定します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時に無効になるため、ブラウザナビゲーションはデフォルトで厳格なままです。
- プライベートネットワークのブラウザナビゲーションを意図的に信頼する場合にのみ、`ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定してください。
- 厳格モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）は到達性/探索チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはアタッチ専用です（開始/停止/リセットは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  OpenClaw に `/json/version` を探索させたい場合は HTTP(S) を使用し、
  プロバイダーから直接 DevTools WebSocket URL が提供される場合は WS(S) を使用します。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび
  `attachOnly` CDP の到達性に加えて、タブを開くリクエストにも適用されます。管理対象のループバック
  プロファイルはローカル CDP のデフォルトを維持します。永続リモート Playwright タブの
  列挙では、より大きい値を操作期限として使用します。
- 外部管理の CDP サービスがループバック経由で到達可能な場合は、その
  プロファイルの `attachOnly: true` を設定してください。そうしないと、OpenClaw はループバックポートを
  ローカル管理ブラウザプロファイルとして扱い、ローカルポート所有権エラーを報告する場合があります。
- `existing-session` プロファイルは CDP ではなく Chrome MCP を使用し、
  選択されたホスト上、または接続されたブラウザノード経由でアタッチできます。
- `existing-session` プロファイルでは、Brave や Edge など特定の
  Chromium ベースのブラウザプロファイルを対象にするために `userDataDir` を設定できます。
- Chrome が DevTools HTTP(S) 探索エンドポイントまたは直接 WS(S) エンドポイントの背後ですでに実行されている場合、
  `existing-session` プロファイルでは `cdpUrl` を設定できます。その
  モードでは、OpenClaw は自動接続を使用せず、エンドポイントを Chrome MCP に渡します。
  `userDataDir` は Chrome MCP の起動引数では無視されます。
- `existing-session` プロファイルは現在の Chrome MCP ルート制限を維持します:
  CSS セレクター指定ではなくスナップショット/ref 駆動アクション、単一ファイルアップロード
  フック、ダイアログタイムアウト上書きなし、`wait --load networkidle` なし、そして
  `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなし。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。
  `cdpUrl` を明示的に設定するのは、リモート CDP プロファイルまたは existing-session エンドポイント
  アタッチの場合のみにしてください。
- ローカル管理プロファイルでは、そのプロファイルのグローバル
  `browser.executablePath` を上書きするために `executablePath` を設定できます。これを使用すると、1 つのプロファイルを
  Chrome で実行し、別のプロファイルを Brave で実行できます。
- ローカル管理プロファイルは、プロセス開始後の Chrome CDP HTTP
  探索に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP WebSocket 準備完了に
  `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に
  起動するが、準備完了チェックが起動処理と競合する低速なホストでは値を引き上げてください。両方の値は
  `120000` ms 以下の正の整数である必要があります。無効な設定値は拒否されます。
- 自動検出順序: デフォルトブラウザが Chromium ベースの場合 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、
  Chromium 起動前に OS のホームディレクトリとして `~` と `~/...` を受け付けます。
  `existing-session` プロファイルのプロファイル単位 `userDataDir` もチルダ展開されます。
- コントロールサービス: ループバックのみ（ポートは `gateway.port` から派生、デフォルトは `18791`）。
- `extraArgs` はローカル Chromium 起動に追加の起動フラグを追加します（例:
  `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグ）。

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
- `assistant`: Control UI のアイデンティティ上書き。アクティブエージェントのアイデンティティにフォールバックします。

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
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
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

- `mode`: `local` (Gatewayを実行) または `remote` (リモートGatewayへ接続)。`local` でない限り、Gatewayは起動を拒否します。
- `port`: WS + HTTP用の単一多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IPのみ)、または `custom`。
- **レガシーbindエイリアス**: ホストエイリアス (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`) ではなく、`gateway.bind` でbindモード値 (`auto`、`loopback`、`lan`、`tailnet`、`custom`) を使用してください。
- **Dockerの注意**: デフォルトの `loopback` bindはコンテナ内の `127.0.0.1` でリッスンします。Dockerブリッジネットワーク (`-p 18789:18789`) では、トラフィックは `eth0` に到達するため、Gatewayに到達できません。`--network host` を使用するか、すべてのインターフェイスでリッスンするために `bind: "lan"` (または `customBindHost: "0.0.0.0"` を指定した `bind: "custom"`) を設定してください。
- **認証**: デフォルトで必須です。非loopbackのbindにはGateway認証が必要です。実際には、共有トークン/パスワード、または `gateway.auth.mode: "trusted-proxy"` を指定したID認識リバースプロキシを意味します。オンボーディングウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が (SecretRefsを含めて) 構成されている場合は、`gateway.auth.mode` を明示的に `token` または `password` に設定してください。両方が構成され、modeが未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモード。信頼されたローカルlocal loopback設定でのみ使用してください。これは意図的にオンボーディングプロンプトでは提示されません。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザー/ユーザー認証をID認識リバースプロキシへ委任し、`gateway.trustedProxies` からのIDヘッダーを信頼します ([Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照)。このモードはデフォルトで**非loopback**のプロキシ送信元を想定します。同一ホストのloopbackリバースプロキシでは、`gateway.auth.trustedProxy.allowLoopback = true` を明示的に設定する必要があります。内部の同一ホスト呼び出し元は、ローカル直接フォールバックとして `gateway.auth.password` を使用できます。`gateway.auth.token` はtrusted-proxyモードと引き続き相互排他的です。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale ServeのIDヘッダーでControl UI/WebSocket認証を満たせます (`tailscale whois` で検証)。HTTP APIエンドポイントはそのTailscaleヘッダー認証を**使用しません**。代わりにGatewayの通常のHTTP認証モードに従います。このトークンレスフローは、Gatewayホストが信頼されていることを前提とします。`tailscale.mode = "serve"` の場合、デフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアントIPごと、認証スコープごとに適用されます (shared-secretとdevice-tokenは独立して追跡されます)。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期のTailscale Serve Control UIパスでは、同じ `{scope, clientIp}` の失敗試行は、失敗書き込みの前に直列化されます。そのため、同じクライアントからの同時の不正な試行は、どちらも単なる不一致として競合するのではなく、2番目のリクエストでリミッターにかかる可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhostトラフィックにも意図的にレート制限をかけたい場合 (テスト設定や厳格なプロキシデプロイなど) は `false` に設定してください。
- ブラウザーoriginのWS認証試行は、loopback免除を無効にした状態で常にスロットリングされます (ブラウザーベースのlocalhostブルートフォースへの多層防御)。
- loopbackでは、これらのブラウザーoriginロックアウトは正規化された `Origin`
  値ごとに分離されるため、あるlocalhost originからの繰り返し失敗が、別のoriginを自動的に
  ロックアウトすることはありません。
- `tailscale.mode`: `serve` (tailnetのみ、loopback bind) または `funnel` (公開、認証が必要)。
- `tailscale.serviceName`: Serveモード用の任意のTailscale Service名。例:
  `svc:openclaw`。設定すると、OpenClawはそれを `tailscale serve
--service` に渡し、Control UIをデバイスのホスト名ではなく名前付きService経由で公開できます。この値はTailscaleの `svc:<dns-label>`
  Service名形式を使用する必要があります。起動時に導出されたService URLが報告されます。
- `tailscale.preserveFunnel`: `true` かつ `tailscale.mode = "serve"` の場合、OpenClawは
  起動時にServeを再適用する前に `tailscale funnel status` を確認し、外部で構成済みのFunnelルートがすでにGatewayポートをカバーしている場合は
  スキップします。デフォルトは `false`。
- `controlUi.allowedOrigins`: Gateway WebSocket接続用の明示的なブラウザーorigin許可リスト。公開の非loopbackブラウザーoriginには必須です。loopback、RFC1918/link-local、`.local`、`.ts.net`、またはTailscale CGNATホストから読み込まれるプライベートなsame-origin LAN/Tailnet UIは、Hostヘッダーフォールバックを有効にしなくても受け入れられます。
- `controlUi.chatMessageMaxWidth`: グループ化されたControl UIチャットメッセージ用の任意の最大幅。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)` などの制約付きCSS幅値を受け入れます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Hostヘッダーoriginポリシーに意図的に依存するデプロイで、Hostヘッダーoriginフォールバックを有効にする危険なモード。
- `terminal.enabled`: adminスコープのオペレーターターミナルをオプトインします。デフォルト: `false`。ターミナルは選択されたエージェントワークスペース内でホストPTYを開始し、Gatewayプロセス環境を継承します。また、`sandbox.mode: "all"` のエージェントでは拒否されます。信頼されたオペレーターデプロイでのみ有効にしてください。変更するとGatewayが再起動し、Control UIのコンテンツセキュリティポリシーが更新されます。
- `terminal.shell`: 任意のシェル実行可能ファイル。未設定の場合、OpenClawはUnixでは `$SHELL`、Windowsでは `%ComSpec%` を使用します。
- `terminal.detachedSessionTimeoutSeconds`: 接続が切断された後 (ページ再読み込み、ノートPCのスリープ)、ターミナルセッションが存続し、最近の出力を再生して `terminal.attach` で再アタッチ可能な状態を保つ時間。デフォルト: `300`。接続が切断された瞬間にセッションを終了するには `0` に設定します。切断されたセッションはコマンドを実行し続けるため、共有ホストや公開ホストではこの値を短くしてください。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。`direct` では、公開ホストの場合 `remote.url` は `wss://` である必要があります。平文の `ws://` はloopback、LAN、link-local、`.local`、`.ts.net`、およびTailscale CGNATホストでのみ受け入れられます。
- `remote.remotePort`: リモートSSHホスト上のGatewayポート。デフォルトは `18789` です。ローカルトンネルポートがリモートGatewayポートと異なる場合に使用します。
- `remote.sshHostKeyPolicy`: macOS SSHトンネルのホストキー ポリシー。`strict` がデフォルトで、すでに信頼済みのキーが必要です。`openssh` は、管理対象エイリアス向けの有効なOpenSSH構成への明示的なオプトインです。使用前に、一致するユーザーおよびシステムSSH設定を確認してください。macOSアプリと `configure-remote` は、再度明示的にオプトインしない限り、ターゲット変更時にこのポリシーを `strict` にリセットします。
- `gateway.remote.token` / `.password` はリモートクライアント認証情報フィールドです。それ自体ではGateway認証を構成しません。
- `gateway.push.apns.relay.baseUrl`: リレー対応のiOSビルドが登録をGatewayへ公開した後に使用される外部APNsリレーのベースHTTPS URL。公開App StoreビルドはホストされたOpenClawリレーを使用します。カスタムリレーURLは、そのリレーを指すリレーURLを持つ、意図的に分離されたiOSビルド/デプロイパスと一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gatewayからリレーへの送信タイムアウト (ミリ秒)。デフォルトは `10000`。
- リレー対応の登録は、特定のGateway IDに委任されます。ペアリングされたiOSアプリは `gateway.identity.get` を取得し、そのIDをリレー登録に含め、登録スコープの送信許可をGatewayに転送します。別のGatewayはその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記リレー構成の一時的なenvオーバーライド。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTPリレーURL用の開発専用エスケープハッチ。本番リレーURLはHTTPSのままにする必要があります。
- `gateway.handshakeTimeoutMs`: 認証前のGateway WebSocketハンドシェイクタイムアウト (ミリ秒)。デフォルト: `15000`。`OPENCLAW_HANDSHAKE_TIMEOUT_MS` が設定されている場合は優先されます。起動ウォームアップがまだ安定している途中でもローカルクライアントが接続できる、高負荷または低電力のホストでは、この値を増やしてください。
- `gateway.channelHealthCheckMinutes`: チャンネルヘルスモニター間隔 (分)。ヘルスモニター再起動をグローバルに無効にするには `0` に設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: staleソケットしきい値 (分)。これは `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング1時間あたりのチャンネル/アカウントごとのヘルスモニター再起動の最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターを有効にしたまま、チャンネルごとにヘルスモニター再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 複数アカウントチャンネル用のアカウントごとのオーバーライド。設定されている場合、チャンネルレベルのオーバーライドより優先されます。
- ローカルGateway呼び出しパスは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` がSecretRef経由で明示的に構成され、解決されない場合、解決はfail-closedします (リモートフォールバックによるマスキングなし)。
- `trustedProxies`: TLSを終端する、または転送されたクライアントヘッダーを注入するリバースプロキシIP。管理下にあるプロキシのみを列挙してください。loopbackエントリは、同一ホストのプロキシ/ローカル検出設定 (たとえばTailscale Serveやローカルリバースプロキシ) では引き続き有効ですが、loopbackリクエストが `gateway.auth.mode: "trusted-proxy"` の対象になるわけでは**ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がない場合にGatewayは `X-Real-IP` を受け入れます。fail-closed動作のため、デフォルトは `false` です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求されたスコープがない初回ノードデバイスペアリングを自動承認するための任意のCIDR/IP許可リスト。未設定の場合は無効です。これはオペレーター/ブラウザー/Control UI/WebChatのペアリングを自動承認せず、ロール、スコープ、メタデータ、公開鍵のアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングおよびプラットフォーム許可リスト評価後に宣言されたノードコマンド向けのグローバルな許可/拒否の調整。`camera.snap`、`camera.clip`、`screen.record`、`sms.search`、`sms.send` などの危険なノードコマンドにオプトインするには `allowCommands` を使用します。`denyCommands` は、プラットフォームデフォルトまたは明示的な許可に含まれる場合でもコマンドを削除します。Android SMS権限とGatewayコマンド認可は独立しています。ノードが宣言済みコマンドリストを変更した後は、そのデバイスペアリングを拒否して再承認し、Gatewayが更新されたコマンドスナップショットを保存するようにしてください。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` でブロックされる追加のツール名 (デフォルト拒否リストを拡張)。
- `gateway.tools.allow`: owner/admin呼び出し元向けに、デフォルトのHTTP拒否リストから
  ツール名を削除します。これはIDを持つ `operator.write`
  呼び出し元をowner/adminアクセスに昇格させるものではありません。`cron`、`gateway`、`nodes` は
  allowlistされていても非owner呼び出し元には利用できません。

</Accordion>

### OpenAI互換エンドポイント

- Admin HTTP RPC: デフォルトでは `admin-http-rpc` Pluginとしてオフです。Pluginを有効にすると `POST /api/v1/admin/rpc` が登録されます。[Admin HTTP RPC](/ja-JP/plugins/admin-http-rpc) を参照してください。
- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の許可リストは未設定として扱われます。URL取得を無効にするには `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使用してください。
- 任意のレスポンス強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (管理下のHTTPS originにのみ設定してください。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### 複数インスタンスの分離

一意のポートと状態ディレクトリを使って、1つのホスト上で複数のGatewayを実行します:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

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

- `enabled`: Gateway リスナーで TLS 終端 (HTTPS/WSS) を有効にします (デフォルト: `false`)。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカルの自己署名証明書/鍵ペアを自動生成します。ローカル/開発用途専用です。
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
- `debounceMs`: 設定変更を適用する前のデバウンス時間 (ミリ秒) (非負の整数、デフォルト: `300`)。
- `deferralTimeoutMs`: 再起動またはチャンネルのホットリロードを強制する前に、実行中の操作を待つ任意の最大時間 (ミリ秒)。省略するとデフォルトの有界待機 (`300000`) を使用します。`0` に設定すると無期限に待機し、未完了の警告を定期的にログ出力します。

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

検証と安全性に関する注意:

- `hooks.enabled=true` には、空でない `hooks.token` が必要です。
- `hooks.token` は、有効な Gateway 共有シークレット認証 (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) とは別にする必要があります。再利用が検出されると、起動時に致命的でないセキュリティ警告がログ出力されます。
- `openclaw security audit` は、監査時にのみ指定された Gateway パスワード認証 (`--auth password --password <password>`) を含め、フック/Gateway 認証の再利用を重大な検出事項としてフラグします。`openclaw doctor --fix` を実行して、永続化された再利用中の `hooks.token` をローテーションし、その後、外部フック送信元が新しいフックトークンを使うように更新してください。
- `hooks.path` に `/` は使用できません。`/hooks` のような専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合、`hooks.allowedSessionKeyPrefixes` を制限してください (例: `["hook:"]`)。
- マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的マッピングキーには、このオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードからの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け入れられます (デフォルト: `false`)。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されます
  - テンプレートでレンダリングされたマッピングの `sessionKey` 値は外部から提供されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="Mapping details">

- `match.path` は `/hooks` の後のサブパスに一致します (例: `/hooks/gmail` → `gmail`)。
- `match.source` は汎用パスのペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` は、フックアクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスでなければならず、`hooks.transformsDir` 内にとどまります (絶対パスとトラバーサルは拒否されます)。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` 配下に置いてください。ワークスペースの Skills ディレクトリは拒否されます。`openclaw doctor` がこのパスを無効として報告する場合は、変換モジュールをフック変換ディレクトリへ移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントへルーティングします。不明な ID はデフォルトエージェントにフォールバックします。
- `allowedAgentIds`: 有効なエージェントルーティングを制限します。`agentId` が省略された場合のデフォルトエージェントパスも含みます (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: 明示的な `sessionKey` なしのフックエージェント実行に使う任意の固定セッションキー。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元とテンプレート駆動のマッピングセッションキーが `sessionKey` を設定できるようにします (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) に対する任意のプレフィックス許可リスト。例: `["hook:"]`。マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は必須になります。
- `deliver: true` は最終返信をチャンネルへ送信します。`channel` のデフォルトは `last` です。
- `model` は、このフック実行で使用する LLM を上書きします (モデルカタログが設定されている場合は許可されている必要があります)。

</Accordion>

### Gmail 連携

- 組み込みの Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- このメッセージ単位のルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するよう制限してください。例: `["hook:", "hook:gmail:"]`。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化されたデフォルトではなく、静的な `sessionKey` でプリセットを上書きしてください。

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

- 設定されている場合、Gateway は起動時に `gog gmail watch serve` を自動開始します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
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

- Gateway ポート配下の HTTP で、エージェントが編集可能な HTML/CSS/JS と A2UI を提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"` (デフォルト) を維持してください。
- 非 loopback バインド: canvas ルートには、他の Gateway HTTP サーフェスと同様に Gateway 認証 (トークン/パスワード/信頼済みプロキシ) が必要です。
- Node WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされ接続されると、Gateway は canvas/A2UI アクセス用にノードスコープの capability URL を通知します。
- capability URL はアクティブなノード WS セッションに紐づき、すぐに期限切れになります。IP ベースのフォールバックは使用されません。
- 提供される HTML にライブリロードクライアントを注入します。
- 空の場合、スターター `index.html` を自動作成します。
- A2UI も `/__openclaw__/a2ui/` で提供します。
- 変更には Gateway の再起動が必要です。
- 大きなディレクトリまたは `EMFILE` エラーでは、ライブリロードを無効にしてください。

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

- `minimal` (デフォルト): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。LAN マルチキャスト広告には、引き続きバンドルされた `bonjour` plugin が有効である必要があります。
- `off`: plugin の有効化状態を変更せずに、LAN マルチキャスト広告を抑制します。
- バンドルされた `bonjour` plugin は macOS ホストでは自動起動し、Linux、Windows、コンテナ化された Gateway デプロイではオプトインです。
- ホスト名は、有効な DNS ラベルである場合はシステムのホスト名がデフォルトになり、そうでない場合は `openclaw` にフォールバックします。`OPENCLAW_MDNS_HOSTNAME` で上書きします。
- `OPENCLAW_DISABLE_BONJOUR=1` は、`discovery.mdns.mode` を上書きして mDNS 広告を完全に無効化します。

### ワイドエリア (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。ネットワークをまたぐ検出には、DNS サーバー (CoreDNS 推奨) + Tailscale split DNS と組み合わせます。

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
- `shellEnv`: ログインシェルプロファイルから、不足している想定キーをインポートします。
- 完全な優先順位については、[環境](/ja-JP/help/environment) を参照してください。

### 環境変数の置換

任意の設定文字列で `${VAR_NAME}` を使って環境変数を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 不足している変数や空の変数は、設定読み込み時にエラーをスローします。
- リテラルの `${VAR}` には `$${VAR}` でエスケープします。
- `$include` と併用できます。

---

## シークレット

シークレット参照は追加式です。平文値も引き続き機能します。

### `SecretRef`

1 つのオブジェクト形状を使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON ポインター (例: `"/providers/openai/apiKey"`)
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (AWS 形式の `secret#json_key` セレクターをサポート)
- `source: "exec"` の id には、`.` または `..` のスラッシュ区切りパスセグメントを含めてはいけません (例: `a/../b` は拒否されます)

### サポートされる認証情報サーフェス

- 正規マトリックス: [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、サポートされる `openclaw.json` 認証情報パスを対象にします。
- `auth-profiles.json` 参照は、ランタイム解決と監査範囲に含まれます。

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

メモ:

- `file` プロバイダーは `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue モードでは `id` は `"value"` である必要があります）。
- Windows ACL 検証を利用できない場合、file および exec プロバイダーのパスはフェイルクローズします。検証できない信頼済みパスに限り、`allowInsecurePath: true` を設定してください。
- `exec` プロバイダーは絶対 `command` パスを必要とし、stdin/stdout でプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決後のターゲットパスを検証しながらシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、信頼済みディレクトリのチェックは解決後のターゲットパスに適用されます。
- `exec` 子プロセスの環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- シークレット参照は有効化時にメモリ内スナップショットへ解決され、その後リクエストパスはそのスナップショットのみを読み取ります。
- アクティブサーフェスのフィルタリングは有効化中に適用されます。有効なサーフェス上の未解決参照は起動/リロードを失敗させ、非アクティブなサーフェスは診断付きでスキップされます。

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
- `auth-profiles.json` は、静的認証情報モード向けに値レベルの参照（`api_key` の `keyRef`、`token` の `tokenRef`）をサポートします。
- `{ "provider": { "apiKey": "..." } }` のようなレガシーのフラットな `auth-profiles.json` マップはランタイム形式ではありません。`openclaw doctor --fix` は、それらを正規の `provider:default` API キープロファイルへ書き換え、`.legacy-flat.*.bak` バックアップを作成します。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef による認証プロファイル認証情報をサポートしません。
- 静的ランタイム認証情報は、メモリ内で解決済みのスナップショットから取得されます。レガシーの静的 `auth.json` エントリは検出時にスクラブされます。
- レガシー OAuth は `~/.openclaw/credentials/oauth.json` からインポートします。
- [OAuth](/ja-JP/concepts/oauth) を参照してください。
- Secrets のランタイム動作と `audit/configure/apply` ツール: [Secrets Management](/ja-JP/gateway/secrets)。

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

- `billingBackoffHours`: 真の請求/クレジット不足エラーによりプロファイルが失敗した場合の基本バックオフ時間（時間単位、デフォルト: `5`）。明示的な請求関連テキストは、`401`/`403` 応答でもここに分類される場合がありますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーの範囲に留まります（例: OpenRouter の `Key limit exceeded`）。再試行可能な HTTP `402` の使用枠、または組織/ワークスペースの利用上限メッセージは、代わりに `rate_limit` パスに留まります。
- `billingBackoffHoursByProvider`: 請求バックオフ時間のプロバイダーごとの任意の上書き。
- `billingMaxHours`: 請求バックオフの指数増加の上限時間（時間単位、デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高確度の `auth_permanent` 失敗に対する基本バックオフ時間（分単位、デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加の上限時間（分単位、デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用されるローリングウィンドウ（時間単位、デフォルト: `24`）。
- `overloadedProfileRotations`: モデルフォールバックに切り替える前に、過負荷エラーで同一プロバイダー内の認証プロファイルをローテーションする最大回数（デフォルト: `1`）。`ModelNotReadyException` などのプロバイダー混雑形状はここに分類されます。
- `overloadedBackoffMs`: 過負荷のプロバイダー/プロファイルローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: モデルフォールバックに切り替える前に、レート制限エラーで同一プロバイダー内の認証プロファイルをローテーションする最大回数（デフォルト: `1`）。このレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` などのプロバイダー形状のテキストが含まれます。

---

## 監査

```json5
{
  audit: {
    enabled: true,
  },
}
```

Gateway は、エージェント実行とツールアクションについて、**メタデータのみ**の監査イベントを共有状態データベースに記録します。対象は ID、タイミング、ツール名、終端結果であり、プロンプト、メッセージ、ツール引数、結果、生のエラーテキストは決して記録しません。レコードは 30 日後に期限切れになり、台帳は 100,000 行を上限とします。[`openclaw audit`](/ja-JP/cli/audit) または [`audit.list`](/ja-JP/gateway/protocol#audit-ledger-rpc) Gateway RPC で照会してください。

- `enabled`: 新しい監査イベントを記録します（デフォルト: `true`）。インシデント後に初めて有効化された監査証跡ではそのインシデントを説明できないため、台帳はデフォルトでオンです。`false` に設定すると、新しい書き込みは即座に停止します。既存のレコードは期限切れになるまで読み取り可能です。再度オンにすると、その時点から記録を再開します。欠落期間はバックフィルされません。

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
- 安定したパスにするには `logging.file` を設定します。
- `--verbose` の場合、`consoleLevel` は `debug` に上がります。
- `maxFileBytes`: ローテーション前のアクティブなログファイルの最大サイズ（バイト単位、正の整数、デフォルト: `104857600` = 100 MB）。OpenClaw はアクティブファイルの横に最大 5 つの番号付きアーカイブを保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対するベストエフォートのマスキング。`redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効化します。UI/ツール/診断の安全サーフェスは、送出前に引き続きシークレットを秘匿します。

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

- `enabled`: 計装出力のマスタートグル（デフォルト: `true`）。
- `flags`: 対象を絞ったログ出力を有効化するフラグ文字列の配列（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: 長時間実行中の処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` と分類するための進捗なし経過時間しきい値（ミリ秒、デフォルト: `120000`）。返信、ツール、ステータス、ブロック、ACP 進捗はタイマーをリセットします。繰り返される `session.stuck` 診断は、変化がない間バックオフします。
- `stuckSessionAbortMs`: 回復のために、対象となる停滞中のアクティブ作業を中止ドレインできるまでの進捗なし経過時間しきい値（ミリ秒）。未設定の場合、OpenClaw は少なくとも 5 分かつ `stuckSessionWarnMs` の 3 倍の、より安全な拡張埋め込み実行ウィンドウを使用します。
- `memoryPressureSnapshot`: メモリプレッシャーが `critical` に達したとき、秘匿済みの OOM 前安定性スナップショットを取得します（デフォルト: `false`）。通常のメモリプレッシャーイベントは維持しつつ、安定性バンドルのファイルスキャン/書き込みを追加するには `true` に設定します。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効化します（デフォルト: `false`）。完全な設定、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry export](/ja-JP/gateway/opentelemetry) を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 任意のシグナル固有 OTLP エンドポイント。設定すると、そのシグナルに限り `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストで送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効化します。
- `otel.logsExporter`: ログエクスポート先: `"otlp"`（デフォルト）、stdout 1 行につき 1 つの JSON オブジェクトを出力する `"stdout"`、または `"both"`。
- `otel.sampleRate`: トレースサンプリング率 `0`-`1`。
- `otel.flushIntervalMs`: 定期的なテレメトリフラッシュ間隔（ミリ秒）。
- `otel.captureContent`: OTEL スパン属性への生コンテンツ取得をオプトインします。デフォルトはオフです。ブール値 `true` はシステム以外のメッセージ/ツールコンテンツを取得します。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt`、`toolDefinitions` を明示的に有効化できます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新の実験的 GenAI 推論スパン形状用の環境トグルです。これには `{gen_ai.operation.name} {gen_ai.request.model}` スパン名、`CLIENT` スパン種別、レガシーの `gen_ai.system` の代わりとなる `gen_ai.provider.name` が含まれます。デフォルトでは互換性のため、スパンは `openclaw.model.call` と `gen_ai.system` を維持します。GenAI メトリクスは境界付けられたセマンティック属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: グローバル OpenTelemetry SDK をすでに登録しているホスト向けの環境トグルです。その場合、OpenClaw は診断リスナーをアクティブに保ったまま、Plugin所有の SDK 起動/シャットダウンをスキップします。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 対応する設定キーが未設定の場合に使用される、シグナル固有のエンドポイント環境変数。
- `cacheTrace.enabled`: 埋め込み実行のキャッシュトレーススナップショットをログに記録します（デフォルト: `false`）。
- `cacheTrace.filePath`: キャッシュトレース JSONL の出力パス（デフォルト: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: キャッシュトレース出力に含める内容を制御します（すべてデフォルト: `true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
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

- `channel`: リリースチャネル - `"stable"`、`"extended-stable"`、`"beta"`、または `"dev"`。Extended-stable はパッケージ専用のフォアグラウンド/オンデマンドチャネルです。起動時チェックとバックグラウンド自動更新ではスキップされます。
- `checkOnStart`: gateway 起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: パッケージインストールのバックグラウンド自動更新を有効化します（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャネルの自動適用前の最小遅延時間（時間単位、デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャネルのロールアウト分散ウィンドウの追加時間（時間単位、デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャネルのチェック実行頻度（時間単位、デフォルト: `1`、最大: `24`）。

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
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

- `enabled`: グローバル ACP 機能ゲート (デフォルト: `true`; ACP ディスパッチとスポーン操作を非表示にするには `false` を設定)。
- `dispatch.enabled`: ACP セッションターンのディスパッチ用の独立したゲート (デフォルト: `true`)。実行をブロックしつつ ACP コマンドを利用可能なままにするには `false` を設定。
- `backend`: デフォルトの ACP ランタイムバックエンド ID (登録済みの ACP ランタイム Plugin と一致する必要があります)。
  先にバックエンド Plugin をインストールしてください。`plugins.allow` が設定されている場合は、バックエンド Plugin ID (例: `acpx`) を含めないと ACP バックエンドは読み込まれません。
- `fallbacks`: プライマリバックエンドが出力を生成する前に、一時的に見えるエラー (利用不可、レート制限、クォータ枯渇、過負荷) で早期に失敗した場合に試行されるフォールバック ACP バックエンド ID の順序付きリスト。各エントリは登録済みの ACP ランタイム Plugin バックエンドと一致する必要があります。
- `defaultAgent`: スポーンが明示的なターゲットを指定しない場合のフォールバック ACP ターゲットエージェント ID。
- `allowedAgents`: ACP ランタイムセッションで許可されるエージェント ID の許可リスト。空の場合は追加の制限なし。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストのアイドルフラッシュ時間枠 (ミリ秒)。
- `stream.maxChunkChars`: ストリーミングされたブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとに繰り返されるステータス/ツール行を抑制します (デフォルト: `true`)。
- `stream.deliveryMode`: `"live"` は逐次ストリーミングします。`"final_only"` はターン終了イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベント後の可視テキスト前の区切り (デフォルト: `"paragraph"`)。
- `stream.maxOutputChars`: ACP ターンごとに投影されるアシスタント出力文字の最大数。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベントのタグ名から真偽値の表示上書きへのレコード。
- `runtime.ttlMinutes`: ACP セッションワーカーがクリーンアップ対象になるまでのアイドル TTL (分)。
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

- `cli.banner.taglineMode` はバナータグラインのスタイルを制御します:
  - `"random"` (デフォルト): 面白い/季節ごとのタグラインをローテーション表示。
  - `"default"`: 固定の中立的なタグライン (`All your chats, one OpenClaw.`)。
  - `"off"`: タグラインテキストなし (バナータイトル/バージョンは引き続き表示)。
- バナー全体 (タグラインだけでなく) を非表示にするには、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

---

## ウィザード

CLI ガイド付きセットアップフロー (`onboard`, `configure`, `doctor`) によって書き込まれるメタデータ:

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

[エージェントのデフォルト](/ja-JP/gateway/config-agents#agent-defaults) にある `agents.list` のアイデンティティフィールドを参照してください。

---

## ブリッジ (レガシー、削除済み)

現在のビルドには TCP ブリッジは含まれていません。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーは構成スキーマの一部ではなくなりました (削除するまで検証は失敗します。`openclaw doctor --fix` で不明なキーを削除できます)。

<Accordion title="レガシーブリッジ構成 (履歴リファレンス)">

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

- `sessionRetention`: 完了した分離 Cron 実行セッションを `sessions.json` から削除する前に保持する期間。アーカイブ済みの削除された Cron トランスクリプトのクリーンアップも制御します。デフォルト: `24h`; 無効にするには `false` を設定します。
- `runLog.maxBytes`: 古いファイルベースの Cron 実行ログとの互換性のために受け付けられます。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: ジョブごとに保持される最新の SQLite 実行履歴行数。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST 配信 (`delivery.mode = "webhook"`) に使用されるベアラートークン。省略した場合、認証ヘッダーは送信されません。
- `webhook`: `notify: true` がまだ残っている保存済みジョブを `openclaw doctor --fix` で移行するために使用される、非推奨のレガシーフォールバック Webhook URL (http/https)。ランタイム配信では、ジョブごとの `delivery.mode="webhook"` と `delivery.to`、または通知配信を保持する場合は `delivery.completionDestination` を使用します。

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

- `maxAttempts`: 一時的なエラー時の Cron ジョブの最大再試行回数 (デフォルト: `3`; 範囲: `0`-`10`)。
- `backoffMs`: 各再試行のバックオフ遅延 (ミリ秒) の配列 (デフォルト: `[30000, 60000, 300000]`; 1-10 エントリ)。
- `retryOn`: 再試行をトリガーするエラー種別 - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`。省略するとすべての一時的な種別を再試行します。

ワンショットジョブは再試行回数が尽きるまで有効なままで、その後は最終エラー状態を保持しつつ無効化されます。定期ジョブは同じ一時的な再試行ポリシーを使用し、次のスケジュール枠の前にバックオフ後に再実行します。恒久的なエラーまたは一時的な再試行の枯渇後は、エラーバックオフ付きの通常の定期スケジュールに戻ります。

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
- `includeSkipped`: 連続スキップ実行をアラートしきい値にカウントします (デフォルト: `false`)。スキップされた実行は別個に追跡され、実行エラーのバックオフには影響しません。
- `mode`: 配信モード - `"announce"` はチャネルメッセージ経由で送信します。`"webhook"` は構成済みの Webhook に投稿します。
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

- すべてのジョブにわたる Cron 失敗通知のデフォルト宛先。
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータが存在する場合は `"announce"` がデフォルトです。
- `channel`: 通知配信のチャネル上書き。`"last"` は最後に既知の配信チャネルを再利用します。
- `to`: 明示的な通知ターゲットまたは Webhook URL。Webhook モードでは必須です。
- `accountId`: 配信用の任意のアカウント上書き。
- ジョブごとの `delivery.failureDestination` はこのグローバルデフォルトを上書きします。
- グローバルおよびジョブごとの失敗宛先がどちらも設定されていない場合、すでに `announce` 経由で配信しているジョブは、失敗時にそのプライマリ通知ターゲットにフォールバックします。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。分離 Cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

---

## メディアモデルテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 受信メッセージ本文全体                            |
| `{{RawBody}}`      | 生の本文 (履歴/送信者ラッパーなし)                |
| `{{BodyStripped}}` | グループメンションを除去した本文                  |
| `{{From}}`         | 送信者識別子                                      |
| `{{To}}`           | 宛先識別子                                        |
| `{{MessageSid}}`   | チャネルメッセージ ID                             |
| `{{SessionId}}`    | 現在のセッション UUID                             |
| `{{IsNewSession}}` | 新しいセッションが作成された場合は `"true"`       |
| `{{MediaUrl}}`     | 受信メディアの疑似 URL                            |
| `{{MediaPath}}`    | ローカルメディアパス                              |
| `{{MediaType}}`    | メディア種別 (画像/音声/ドキュメント/…)           |
| `{{Transcript}}`   | 音声トランスクリプト                              |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディアプロンプト      |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数          |
| `{{ChatType}}`     | `"direct"` または `"group"`                       |
| `{{GroupSubject}}` | グループの件名 (ベストエフォート)                 |
| `{{GroupMembers}}` | グループメンバーのプレビュー (ベストエフォート)   |
| `{{SenderName}}`   | 送信者表示名 (ベストエフォート)                   |
| `{{SenderE164}}`   | 送信者電話番号 (ベストエフォート)                 |
| `{{Provider}}`     | プロバイダーヒント (whatsapp, telegram, discord など) |

---

## 構成インクルード (`$include`)

構成を複数ファイルに分割します:

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
- ファイル配列: 順番にディープマージされます (後のものが前のものを上書き)。
- 兄弟キー: インクルード後にマージされます (インクルードされた値を上書き)。
- ネストされたインクルード: 最大 10 階層まで。
- パス: インクルードしているファイルからの相対で解決されますが、トップレベル構成ディレクトリ (`openclaw.json` の `dirname`) 内に留まる必要があります。絶対パス/`../` 形式は、その境界内に解決される場合にのみ許可されます。構成ディレクトリ外の追加ルートを許可するには `OPENCLAW_INCLUDE_ROOTS` (絶対パス) を設定します。
- 制限: パスには null バイトを含めてはならず、解決前後のどちらでも 4096 文字未満である必要があります。各インクルードファイルは 2 MB に制限されます。
- 単一ファイルインクルードに支えられたトップレベルセクションを 1 つだけ変更する OpenClaw 所有の書き込みは、そのインクルードファイルに書き込みます。たとえば、`plugins install` は `plugins.json5` 内の `plugins: { $include: "./plugins.json5" }` を更新し、`openclaw.json` はそのまま残します。
- ルートインクルード、インクルード配列、兄弟上書きを含むインクルードは、OpenClaw 所有の書き込みに対して読み取り専用です。これらの書き込みは構成をフラット化せず、フェイルクローズします。
- エラー: ファイル欠落、解析エラー、循環インクルード、無効なパス形式、過度な長さに対して明確なメッセージを表示します。

---

## 関連

- [構成](/ja-JP/gateway/configuration)
- [構成例](/ja-JP/gateway/configuration-examples)
- [Doctor](/ja-JP/gateway/doctor)
