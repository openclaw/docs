---
read_when:
    - 正確なフィールド単位の設定セマンティクスまたはデフォルトが必要な場合
    - channel、model、gateway、または tool の設定ブロックを検証している
summary: コア OpenClaw キー、デフォルト、専用サブシステムリファレンスへのリンクに関する Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-07-02T07:57:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` のコア設定リファレンス。タスク指向の概要については、[構成](/ja-JP/gateway/configuration)を参照してください。

OpenClaw の主要な設定サーフェスを扱い、サブシステムに独自の詳細リファレンスがある場合はリンクします。チャンネルおよび plugin が所有するコマンドカタログと、深いメモリ/QMD の調整項目は、このページではなくそれぞれのページにあります。

コード上の真実:

- `openclaw config schema` は、検証と Control UI に使われるライブ JSON Schema を出力し、利用可能な場合はバンドル/plugin/チャンネルのメタデータもマージします
- `config.schema.lookup` は、ドリルダウンツール向けにパススコープのスキーマノードを 1 つ返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のスキーマサーフェスに対して設定ドキュメントのベースラインハッシュを検証します

エージェントの参照パス: 編集前に正確なフィールド単位のドキュメントと制約を確認するには、`gateway` ツールアクション `config.schema.lookup` を使用します。タスク指向のガイダンスには[構成](/ja-JP/gateway/configuration)を、このページはより広いフィールドマップ、デフォルト、サブシステムリファレンスへのリンクに使用します。

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については[メモリ設定リファレンス](/ja-JP/reference/memory-config)
- 現在の組み込み + バンドルのコマンドカタログについては[スラッシュコマンド](/ja-JP/tools/slash-commands)
- チャンネル固有のコマンドサーフェスについては、所有するチャンネル/plugin ページ

設定形式は **JSON5** です（コメント + 末尾カンマを使用できます）。すべてのフィールドは任意です - 省略時は OpenClaw が安全なデフォルトを使用します。

---

## チャンネル

チャンネルごとの設定キーは専用ページに移動しました - Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他のバンドルチャンネル（認証、アクセス制御、マルチアカウント、メンションゲート）を含む `channels.*` については、[構成 - チャンネル](/ja-JP/gateway/config-channels)を参照してください。

## エージェントデフォルト、マルチエージェント、セッション、メッセージ

専用ページに移動しました - 以下については[構成 - エージェント](/ja-JP/gateway/config-agents)を参照してください。

- `agents.defaults.*`（ワークスペース、モデル、思考、heartbeat、メモリ、メディア、skills、サンドボックス）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションライフサイクル、compaction、枝刈り）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk モード）
  - `talk.consultThinkingLevel`: Control UI Talk リアルタイム相談の背後で実行される OpenClaw エージェント全体に対する思考レベルの上書き
  - `talk.consultFastMode`: Control UI Talk リアルタイム相談に対する 1 回限りの高速モード上書き
  - `talk.speechLocale`: iOS/macOS 上の Talk 音声認識向けの任意の BCP 47 ロケール ID
  - `talk.silenceTimeoutMs`: 未設定の場合、Talk はトランスクリプト送信前の一時停止時間としてプラットフォームのデフォルトを維持します（`700 ms on macOS and Android, 900 ms on iOS`）
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` をスキップする確定済みリアルタイム Talk トランスクリプト向けの Gateway リレーフォールバック

## ツールとカスタムプロバイダー

ツールポリシー、実験的トグル、プロバイダーに裏付けられたツール設定、カスタムプロバイダー / ベース URL 設定は専用ページに移動しました - [構成 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダー設定は[構成 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls)にあります。
`models` ルートはグローバルなモデルカタログ動作も所有します。

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
- `models.providers.*.localService`: ローカルモデルサーバー向けの任意のオンデマンドプロセスマネージャー。OpenClaw は設定されたヘルスエンドポイントを検査し、必要に応じて絶対パスの `command` を起動し、準備完了を待ってからモデルリクエストを送信します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。
- `models.pricing.enabled`: サイドカーとチャンネルが Gateway の準備完了パスに到達した後に開始される、バックグラウンドの価格ブートストラップを制御します。`false` の場合、Gateway は OpenRouter と LiteLLM の価格カタログ取得をスキップします。設定済みの `models.providers.*.models[].cost` 値は、ローカルコスト見積もりでは引き続き機能します。

## MCP

OpenClaw が管理する MCP サーバー定義は `mcp.servers` 配下にあり、埋め込み OpenClaw とその他のランタイムアダプターによって使用されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、設定編集時に対象サーバーへ接続せずにこのブロックを管理します。

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
- `mcp.servers.<name>.enabled`: 保存済みサーバー定義を保持しながら、埋め込み OpenClaw MCP の検出とツール投影から除外するには `false` に設定します。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: サーバーごとの MCP リクエストタイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: サーバーごとの接続タイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.supportsParallelToolCalls`: 並列 MCP ツール呼び出しを発行するかどうかを選択できるアダプター向けの任意の並行性ヒント。
- `mcp.servers.<name>.auth`: OAuth を必要とする HTTP MCP サーバーでは `"oauth"` に設定します。トークンを OpenClaw 状態配下に保存するには `openclaw mcp login <name>` を実行します。
- `mcp.servers.<name>.oauth`: 任意の OAuth スコープ、リダイレクト URL、クライアントメタデータ URL 上書き。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`: プライベートエンドポイントと相互 TLS 向けの HTTP TLS 制御。
- `mcp.servers.<name>.toolFilter`: 任意のサーバーごとのツール選択。`include` は検出された MCP ツールを一致する名前に制限します。`exclude` は一致する名前を隠します。エントリは正確な MCP ツール名、または単純な `*` グロブです。リソースまたはプロンプトを持つサーバーはユーティリティツール名（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）も生成し、それらの名前にも同じフィルターが使われます。
- `mcp.servers.<name>.codex`: 任意の Codex app-server 投影制御。このブロックは Codex app-server スレッド専用の OpenClaw メタデータです。ACP セッション、汎用 Codex ハーネス設定、その他のランタイムアダプターには影響しません。空でない `codex.agents` は、サーバーを列挙された OpenClaw エージェント ID に制限します。空、空白、または無効なスコープ付きエージェントリストは設定検証で拒否され、グローバル化される代わりにランタイム投影パスで省略されます。`codex.defaultToolsApprovalMode` は、そのサーバー向けに Codex ネイティブの `default_tools_approval_mode` を出力します。OpenClaw はネイティブの `mcp_servers` 設定を Codex に渡す前に `codex` ブロックを取り除きます。Codex のデフォルト MCP 承認動作で、すべての Codex app-server エージェントにサーバーを投影し続けるには、このブロックを省略します。
- `mcp.sessionIdleTtlMs`: セッションスコープのバンドル MCP ランタイムのアイドル TTL。1 回限りの埋め込み実行は実行終了時のクリーンアップを要求します。この TTL は長寿命セッションと将来の呼び出し元のためのバックストップです。
- `mcp.*` 配下の変更は、キャッシュされたセッション MCP ランタイムを破棄することでホット適用されます。次回のツール検出/使用時に新しい設定から再作成されるため、削除された `mcp.servers` エントリはアイドル TTL を待たずに即座に回収されます。
- ランタイム検出は、MCP ツールリスト変更通知も尊重し、そのセッションのキャッシュ済みカタログを破棄します。リソースまたはプロンプトを通知するサーバーには、リソースの一覧表示/読み取りとプロンプトの一覧表示/取得用のユーティリティツールが付与されます。ツール呼び出しの失敗が繰り返されると、別の呼び出しが試行される前に、影響を受けたサーバーが短時間一時停止されます。

ランタイム動作については、[MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry)と[CLI バックエンド](/ja-JP/gateway/cli-backends#bundle-mcp-overlays)を参照してください。

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

- `allowBundled`: バンドル Skills のみを対象にした任意の許可リスト（管理対象/ワークスペース Skills には影響しません）。
- `load.extraDirs`: 追加の共有 Skill ルート（最も低い優先順位）。
- `load.allowSymlinkTargets`: Skill シンボリックリンクが設定済みソースルートの外にある場合に、解決先として許可される信頼済み実ターゲットルート。
- `workshop.allowSymlinkTargetWrites`: Skill Workshop の適用時に、すでに信頼済みのシンボリックリンクターゲットを通じた書き込みを許可します（デフォルト: false）。
- `install.preferBrew`: true の場合、`brew` が利用可能なら他のインストーラー種別へフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` 仕様向けの Node インストーラー設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`: 信頼済みの `operator.admin` Gateway クライアントが `skills.upload.*` 経由でステージングされた非公開 zip アーカイブをインストールできるようにします（デフォルト: false）。これはアップロード済みアーカイブのパスだけを有効化します。通常の ClawHub インストールでは不要です。
- `entries.<skillKey>.enabled: false` は、バンドル済み/インストール済みであっても Skill を無効化します。
- `entries.<skillKey>.apiKey`: 主要な env var を宣言する Skills 向けの便宜設定（平文文字列または SecretRef オブジェクト）。

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

- `~/.openclaw/extensions` と `<workspace>/.openclaw/extensions` の下にある package または bundle ディレクトリ、および `plugins.load.paths` に列挙されたファイルまたはディレクトリから読み込まれます。
- スタンドアロン Plugin ファイルは `plugins.load.paths` に置きます。自動検出される extension ルートでは、トップレベルの `.js`、`.mjs`、`.ts` ファイルは無視されるため、それらのルート内のヘルパースクリプトが起動を妨げることはありません。
- 検出では、ネイティブ OpenClaw plugins に加えて、互換性のある Codex bundle と Claude bundle を受け付けます。manifest のない Claude のデフォルトレイアウト bundle も含まれます。
- **設定変更には Gateway の再起動が必要です。**
- `allow`: 任意の許可リストです（列挙された plugins のみ読み込まれます）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: Plugin レベルの API キー用の簡便フィールドです（Plugin が対応している場合）。
- `plugins.entries.<id>.env`: Plugin スコープの環境変数マップです。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、legacy `before_agent_start` からのプロンプト変更フィールドを無視します。一方で legacy の `modelOverride` と `providerOverride` は保持します。ネイティブ Plugin hooks と、対応 bundle が提供する hook ディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼済みの非 bundle plugins は、`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end` などの typed hooks から raw conversation content を読み取ることができます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この Plugin が background subagent runs に対して run ごとの `provider` と `model` の override を要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼済み subagent override に対する canonical `provider/model` ターゲットの任意の許可リストです。任意の model を許可する意図がある場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowModelOverride`: この Plugin が `api.runtime.llm.complete` に対する model override を要求することを明示的に信頼します。
- `plugins.entries.<id>.llm.allowedModels`: 信頼済み Plugin LLM completion override に対する canonical `provider/model` ターゲットの任意の許可リストです。任意の model を許可する意図がある場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowAgentIdOverride`: この Plugin がデフォルト以外の agent id に対して `api.runtime.llm.complete` を実行することを明示的に信頼します。
- `plugins.entries.<id>.config`: Plugin 定義の config object です（利用可能な場合はネイティブ OpenClaw Plugin schema により検証されます）。
- Channel Plugin の account/runtime settings は `channels.<id>` の下にあり、中央の OpenClaw option registry ではなく、所有元 Plugin の manifest `channelConfigs` metadata によって説明されるべきです。

### Codex harness Plugin config

bundle された `codex` Plugin は、ネイティブ Codex app-server harness settings を
`plugins.entries.codex.config` の下で所有します。完全な config
surface については [Codex harness reference](/ja-JP/plugins/codex-harness-reference) を、
runtime model については [Codex harness](/ja-JP/plugins/codex-harness) を参照してください。

`codexPlugins` は、ネイティブ Codex harness を選択する session にのみ適用されます。
OpenClaw provider runs、ACP conversation bindings、または Codex 以外の harness に対して
Codex plugins を有効化するものではありません。

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

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex harness 向けのネイティブ Codex
  Plugin/app support を有効化します。デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  移行済み Plugin app elicitations のデフォルト destructive-action policy です。
  prompt なしで safe Codex approval schemas を受け入れるには `true`、拒否するには `false`、
  Codex-required approvals を OpenClaw Plugin approvals 経由に route するには `"auto"`、
  durable approval なしで every plugin write/destructive action を prompt するには `"ask"` を使用します。
  `"ask"` mode は、対象 app の durable Codex
  per-tool approval overrides をクリアし、Codex thread 開始前にその app の
  human approvals reviewer を選択します。
  デフォルト: `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: global `codexPlugins.enabled` も true の場合に、
  移行済み Plugin entry を有効化します。
  デフォルト: 明示的な entries では `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  安定した marketplace identity です。V1 は `"openai-curated"` のみ対応します。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: migration から得られる安定した
  Codex Plugin identity です。例: `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Plugin ごとの destructive-action override です。省略された場合は、global
  `allow_destructive_actions` value が使用されます。Plugin ごとの値は、同じ
  `true`、`false`、`"auto"`、`"ask"` policies を受け付けます。

`"ask"` を使用する admitted Plugin app はそれぞれ、その app の approval requests を
human reviewer に route します。他の apps と non-app thread approvals は設定済みの
reviewer を維持するため、混在する Plugin policies が `"ask"` behavior を継承することはありません。

`codexPlugins.enabled` は global enablement directive です。migration によって書き込まれる明示的な Plugin
entries は、durable install と repair eligibility set です。
`plugins["*"]` は対応しておらず、`install` switch は存在せず、local
`marketplacePath` values は host-specific であるため、意図的に config fields ではありません。

`app/list` readiness checks は 1 時間 cache され、stale になると
非同期に refresh されます。Codex thread app config は Codex harness
session establishment 時に計算され、turn ごとには計算されません。ネイティブ Plugin config を変更した後は
`/new`、`/reset`、または Gateway restart を使用してください。

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider settings。
  - `apiKey`: 上限を高めるための任意の Firecrawl API key です（SecretRef を受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、legacy `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` env var に fallback します。
  - `baseUrl`: Firecrawl API base URL（デフォルト: `https://api.firecrawl.dev`。self-hosted overrides は private/internal endpoints を対象にする必要があります）。
  - `onlyMainContent`: ページから main content のみ抽出します（デフォルト: `true`）。
  - `maxAgeMs`: ミリ秒単位の最大 cache age（デフォルト: `172800000` / 2 days）。
  - `timeoutSeconds`: 秒単位の scrape request timeout（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）settings。
  - `enabled`: X Search provider を有効化します。
  - `model`: search に使用する Grok model（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory dreaming settings。phases と thresholds については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: master dreaming switch（デフォルト `false`）。
  - `frequency`: 各 full dreaming sweep の cron cadence（デフォルトは `"0 3 * * *"`）。
  - `model`: 任意の Dream Diary subagent model override。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。targets を制限するには `allowedModels` と組み合わせます。Model-unavailable errors は session default model で 1 回 retry されます。trust または allowlist failures は黙って fallback しません。
  - phase policy と thresholds は実装詳細です（user-facing config keys ではありません）。
- 完全な memory config は [Memory configuration reference](/ja-JP/reference/memory-config) にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化された Claude bundle plugins は、`settings.json` から埋め込み OpenClaw defaults を提供することもできます。OpenClaw はそれらを raw OpenClaw config patches としてではなく、sanitized agent settings として適用します。
- `plugins.slots.memory`: active memory Plugin id を選択するか、memory plugins を無効化するには `"none"` を選択します。
- `plugins.slots.contextEngine`: active context engine Plugin id を選択します。別の engine を install して選択しない限り、デフォルトは `"legacy"` です。

[Plugins](/ja-JP/tools/plugin) を参照してください。

---

## Commitments

`commitments` は推論された follow-up memory を制御します。OpenClaw は conversation turns から check-ins を検出し、Heartbeat runs を通じて配信できます。

- `commitments.enabled`: 推論された follow-up commitments のための hidden LLM extraction、storage、Heartbeat delivery を有効化します。デフォルト: `false`。
- `commitments.maxPerDay`: rolling day 内で agent session ごとに配信される推論された follow-up commitments の最大数。デフォルト: `3`。

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
- `tabCleanup` は、アイドル時間後、またはセッションが上限を超えたときに、追跡対象のプライマリエージェントタブを回収します。`idleMinutes: 0` または `maxTabsPerSession: 0` を設定すると、それぞれのクリーンアップモードを無効にできます。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時に無効になるため、ブラウザナビゲーションはデフォルトで厳格なままです。
- プライベートネットワークのブラウザナビゲーションを意図的に信頼する場合にのみ、`ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定してください。
- 厳格モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）は、到達性/検出チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはアタッチ専用です（開始/停止/リセットは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用し、プロバイダーから直接 DevTools WebSocket URL が提供される場合は WS(S) を使用します。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび `attachOnly` CDP の到達性に加え、タブを開くリクエストに適用されます。管理対象のループバックプロファイルは、ローカル CDP のデフォルトを維持します。
- 外部管理の CDP サービスがループバック経由で到達可能な場合は、そのプロファイルの `attachOnly: true` を設定してください。そうしないと、OpenClaw はループバックポートをローカル管理ブラウザプロファイルとして扱い、ローカルポート所有権エラーを報告する場合があります。
- `existing-session` プロファイルは CDP の代わりに Chrome MCP を使用し、選択したホストまたは接続済みブラウザノード経由でアタッチできます。
- `existing-session` プロファイルは、Brave や Edge などの特定の Chromium ベースのブラウザプロファイルを対象にするために `userDataDir` を設定できます。
- Chrome が DevTools HTTP(S) 検出エンドポイントまたは直接 WS(S) エンドポイントの背後ですでに実行されている場合、`existing-session` プロファイルは `cdpUrl` を設定できます。このモードでは、OpenClaw は自動接続を使用する代わりにエンドポイントを Chrome MCP に渡します。Chrome MCP の起動引数では `userDataDir` は無視されます。
- `existing-session` プロファイルは、現在の Chrome MCP ルート制限を維持します。CSS セレクターターゲティングの代わりに snapshot/ref 駆動のアクション、単一ファイルアップロードフック、ダイアログタイムアウトの上書きなし、`wait --load networkidle` なし、`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなしです。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。`cdpUrl` を明示的に設定するのは、リモート CDP プロファイルまたは existing-session エンドポイントアタッチの場合だけにしてください。
- ローカル管理プロファイルでは、そのプロファイルに対してグローバルな `browser.executablePath` を上書きするために `executablePath` を設定できます。1 つのプロファイルを Chrome で、別のプロファイルを Brave で実行する場合に使用します。
- ローカル管理プロファイルは、プロセス開始後の Chrome CDP HTTP 検出に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP websocket 準備完了に `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に起動するものの、準備完了チェックが起動と競合する遅いホストでは、これらを引き上げてください。どちらの値も `120000` ms までの正の整数である必要があります。無効な設定値は拒否されます。
- 自動検出順序: デフォルトブラウザが Chromium ベースの場合 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、Chromium 起動前に OS のホームディレクトリとして `~` と `~/...` を受け付けます。
  `existing-session` プロファイルのプロファイル単位の `userDataDir` もチルダ展開されます。
- コントロールサービス: ループバックのみ（ポートは `gateway.port` から派生、デフォルトは `18791`）。
- `extraArgs` は、ローカル Chromium 起動に追加の起動フラグを追加します（例: `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグ）。

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

- `mode`: `local`（gateway を実行）または `remote`（リモート gateway に接続）。Gateway は `local` でない限り起動を拒否します。
- `port`: WS + HTTP 用の単一 multiplexed ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IP のみ）、または `custom`。
- **レガシー bind エイリアス**: `gateway.bind` ではホストエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind モード値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用します。
- **Docker の注意**: デフォルトの `loopback` bind はコンテナ内の `127.0.0.1` で待ち受けます。Docker ブリッジネットワーク（`-p 18789:18789`）ではトラフィックが `eth0` に到達するため、gateway に到達できません。すべてのインターフェイスで待ち受けるには、`--network host` を使用するか、`bind: "lan"`（または `customBindHost: "0.0.0.0"` を指定した `bind: "custom"`）を設定します。
- **認証**: デフォルトで必須です。非 loopback bind には gateway 認証が必要です。実際には、共有トークン/パスワード、または `gateway.auth.mode: "trusted-proxy"` を指定した identity-aware リバースプロキシを意味します。オンボーディングウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が（SecretRefs を含めて）設定されている場合は、`gateway.auth.mode` を明示的に `token` または `password` に設定します。両方が設定され、mode が未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモード。信頼できる local loopback セットアップにのみ使用します。これは意図的にオンボーディングプロンプトでは提示されません。
- `gateway.auth.mode: "trusted-proxy"`: browser/user 認証を identity-aware リバースプロキシに委譲し、`gateway.trustedProxies` からの identity ヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。このモードはデフォルトで **非 loopback** プロキシソースを想定します。同一ホストの loopback リバースプロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。内部の同一ホスト呼び出し元は、ローカル直接フォールバックとして `gateway.auth.password` を使用できます。`gateway.auth.token` は trusted-proxy モードと引き続き相互排他的です。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve identity ヘッダーで Control UI/WebSocket 認証を満たせます（`tailscale whois` で検証）。HTTP API エンドポイントは、その Tailscale ヘッダー認証を使用**しません**。代わりに gateway の通常の HTTP 認証モードに従います。このトークンなしフローは、gateway ホストが信頼されていることを前提にします。`tailscale.mode = "serve"` の場合、デフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアント IP ごと、認証スコープごとに適用されます（shared-secret と device-token は独立して追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, clientIp}` の失敗試行は失敗書き込みの前に直列化されます。そのため、同じクライアントからの同時の不正な試行は、どちらも単なる不一致として競合して通過するのではなく、2 番目のリクエストでリミッターにかかる可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックも意図的に rate-limit したい場合（テストセットアップや厳格なプロキシデプロイなど）は `false` に設定します。
- browser-origin WS 認証試行は、loopback 免除を無効にした状態で常にスロットリングされます（ブラウザー経由の localhost ブルートフォースに対する多層防御）。
- loopback では、これらの browser-origin ロックアウトは正規化された `Origin`
  値ごとに分離されるため、ある localhost origin からの失敗が繰り返されても、別の origin が自動的に
  ロックアウトされることはありません。
- `tailscale.mode`: `serve`（tailnet のみ、loopback bind）または `funnel`（公開、認証が必要）。
- `tailscale.serviceName`: Serve モード用の任意の Tailscale Service 名。例:
  `svc:openclaw`。設定すると、OpenClaw はそれを `tailscale serve
--service` に渡し、Control UI をデバイスホスト名ではなく名前付き Service 経由で公開できるようにします。
  値は Tailscale の `svc:<dns-label>` Service 名形式を使用する必要があります。起動時に派生した Service URL が報告されます。
- `tailscale.preserveFunnel`: `true` かつ `tailscale.mode = "serve"` の場合、OpenClaw は
  起動時に Serve を再適用する前に `tailscale funnel status` を確認し、外部設定された Funnel ルートがすでに gateway ポートをカバーしている場合は
  スキップします。デフォルトは `false` です。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的な browser-origin allowlist。公開された非 loopback browser origin には必須です。loopback、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストから読み込まれるプライベートな same-origin LAN/Tailnet UI は、Host-header フォールバックを有効にしなくても受け入れられます。
- `controlUi.chatMessageMaxWidth`: グループ化された Control UI チャットメッセージの任意の max-width。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)` などの制約付き CSS 幅値を受け入れます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header origin ポリシーに意図的に依存するデプロイ向けに、Host-header origin フォールバックを有効にする危険なモード。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` では、公開ホストの場合 `remote.url` は `wss://` でなければなりません。平文の `ws://` は、loopback、LAN、link-local、`.local`、`.ts.net`、および Tailscale CGNAT ホストでのみ受け入れられます。
- `remote.remotePort`: リモート SSH ホスト上の gateway ポート。デフォルトは `18789` です。ローカルトンネルポートがリモート gateway ポートと異なる場合に使用します。
- `gateway.remote.token` / `.password` はリモートクライアントの資格情報フィールドです。それ自体では gateway 認証を設定しません。
- `gateway.push.apns.relay.baseUrl`: relay-backed iOS ビルドが gateway に登録を公開した後に使用される外部 APNs relay のベース HTTPS URL。公開 App Store ビルドはホストされた OpenClaw relay を使用します。カスタム relay URL は、その relay を指す relay URL を持つ、意図的に分離された iOS ビルド/デプロイパスと一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: gateway から relay への送信タイムアウト（ミリ秒）。デフォルトは `10000` です。
- relay-backed 登録は特定の gateway identity に委譲されます。ペアリングされた iOS アプリは `gateway.identity.get` を取得し、その identity を relay 登録に含め、登録スコープの送信許可を gateway に転送します。別の gateway がその保存済み登録を再利用することはできません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記 relay 設定の一時的な env オーバーライド。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL 用の開発専用エスケープハッチ。本番 relay URL は HTTPS のままにする必要があります。
- `gateway.handshakeTimeoutMs`: 認証前 Gateway WebSocket ハンドシェイクタイムアウト（ミリ秒）。デフォルト: `15000`。`OPENCLAW_HANDSHAKE_TIMEOUT_MS` が設定されている場合は優先されます。起動時のウォームアップがまだ落ち着いていない間にローカルクライアントが接続できる、高負荷または低電力のホストでは、この値を増やします。
- `gateway.channelHealthCheckMinutes`: チャンネル health-monitor 間隔（分）。health-monitor による再起動をグローバルに無効にするには `0` を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socket しきい値（分）。これは `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: rolling hour におけるチャンネル/アカウントごとの health-monitor 再起動の最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル monitor を有効にしたまま、チャンネルごとに health-monitor 再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャンネル向けのアカウントごとのオーバーライド。設定されている場合、チャンネルレベルのオーバーライドより優先されます。
- ローカル gateway 呼び出しパスは、`gateway.auth.*` が未設定の場合にのみ、フォールバックとして `gateway.remote.*` を使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決されない場合、解決は fail-closed になります（リモートフォールバックによる隠蔽なし）。
- `trustedProxies`: TLS を終端する、または forwarded-client ヘッダーを注入するリバースプロキシ IP。制御しているプロキシのみを列挙してください。loopback エントリは、同一ホストのプロキシ/local-detection セットアップ（例: Tailscale Serve またはローカルリバースプロキシ）では引き続き有効ですが、loopback リクエストを `gateway.auth.mode: "trusted-proxy"` の対象にするものでは**ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに gateway は `X-Real-IP` を受け入れます。fail-closed 動作のため、デフォルトは `false` です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求スコープのない初回 node device pairing を自動承認するための任意の CIDR/IP allowlist。未設定の場合は無効です。これは operator/browser/Control UI/WebChat pairing を自動承認せず、role、scope、metadata、public-key のアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pairing およびプラットフォーム allowlist 評価後の、宣言済み node コマンドに対するグローバルな allow/deny 形成。`camera.snap`、`camera.clip`、`screen.record` などの危険な node コマンドをオプトインするには `allowCommands` を使用します。`denyCommands` は、プラットフォームデフォルトまたは明示的な allow によって含まれる場合でもコマンドを削除します。node が宣言済みコマンドリストを変更した後は、その device pairing を拒否して再承認し、gateway が更新されたコマンドスナップショットを保存するようにします。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` でブロックされる追加の tool 名（デフォルト deny list を拡張）。
- `gateway.tools.allow`: owner/admin 呼び出し元向けに、デフォルト HTTP deny list から
  tool 名を削除します。これは identity を持つ `operator.write`
  呼び出し元を owner/admin アクセスに昇格させるものではありません。allowlist されていても、`cron`、`gateway`、`nodes` は
  non-owner 呼び出し元には利用できません。

</Accordion>

### OpenAI 互換エンドポイント

- Admin HTTP RPC: `admin-http-rpc` plugin としてデフォルトではオフです。`POST /api/v1/admin/rpc` を登録するには plugin を有効にします。[Admin HTTP RPC](/ja-JP/plugins/admin-http-rpc) を参照してください。
- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL-input hardening:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の allowlist は未設定として扱われます。URL 取得を無効にするには、`gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使用します。
- 任意の response hardening ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（制御している HTTPS origin にのみ設定します。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照）

### マルチインスタンス分離

一意のポートと state dir を使って、1 つのホストで複数の gateway を実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev`（`~/.openclaw-dev` + ポート `19001` を使用）、`--profile <name>`（`~/.openclaw-<name>` を使用）。

[Multiple Gateways](/ja-JP/gateway/multiple-gateways) を参照してください。

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

- `enabled`: gateway listener で TLS termination（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカルの自己署名 cert/key ペアを自動生成します。local/dev 用のみです。
- `certPath`: TLS 証明書ファイルへのファイルシステムパス。
- `keyPath`: TLS private key ファイルへのファイルシステムパス。権限を制限してください。
- `caPath`: client verification または custom trust chain 用の任意の CA bundle パス。

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
  - `"hybrid"` (既定): まずホットリロードを試み、必要な場合は再起動にフォールバックします。
- `debounceMs`: 設定変更が適用される前のデバウンス時間 (ミリ秒、非負の整数)。
- `deferralTimeoutMs`: 再起動またはチャンネルのホットリロードを強制する前に、進行中の操作を待つ任意の最大時間 (ミリ秒)。既定の有界待機 (`300000`) を使うには省略します。無期限に待機し、まだ保留中であることを示す警告を定期的にログ出力するには `0` を設定します。

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

- `hooks.enabled=true` には空でない `hooks.token` が必要です。
- `hooks.token` は、有効な Gateway 共有シークレット認証 (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) とは別にする必要があります。再利用を検出すると、起動時に致命的ではないセキュリティ警告がログ出力されます。
- `openclaw security audit` は、監査時にのみ指定された Gateway パスワード認証 (`--auth password --password <password>`) を含め、フック/Gateway 認証の再利用を重大な検出事項としてフラグします。永続化された再利用済みの `hooks.token` をローテーションするには `openclaw doctor --fix` を実行し、その後、外部のフック送信側を新しいフックトークンを使うように更新します。
- `hooks.path` を `/` にすることはできません。`/hooks` などの専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください (例: `["hook:"]`)。
- マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定します。静的なマッピングキーには、このオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け入れられます (既定: `false`)。
- `POST /hooks/<name>` → `hooks.mappings` を介して解決されます
  - テンプレートでレンダリングされたマッピングの `sessionKey` 値は、外部から指定されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="Mapping details">

- `match.path` は `/hooks` の後のサブパスに一致します (例: `/hooks/gmail` → `gmail`)。
- `match.source` は汎用パス用のペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` は、フックアクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` 内に留まります (絶対パスとトラバーサルは拒否されます)。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` の下に置いてください。ワークスペースの Skills ディレクトリは拒否されます。`openclaw doctor` がこのパスを無効と報告した場合は、変換モジュールをフック変換ディレクトリに移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントにルーティングします。不明な ID は既定のエージェントにフォールバックします。
- `allowedAgentIds`: `agentId` が省略された場合の既定エージェントパスを含め、有効なエージェントルーティングを制限します (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: 明示的な `sessionKey` のないフックエージェント実行用の任意の固定セッションキー。
- `allowRequestSessionKey`: `/hooks/agent` の呼び出し元とテンプレート駆動のマッピングセッションキーが `sessionKey` を設定することを許可します (既定: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) に対する任意のプレフィックス許可リスト。例: `["hook:"]`。マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は必須になります。
- `deliver: true` は最終返信をチャンネルに送信します。`channel` の既定は `last` です。
- `model` は、このフック実行の LLM を上書きします (モデルカタログが設定されている場合は許可されている必要があります)。

</Accordion>

### Gmail 連携

- 組み込みの Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- そのメッセージごとのルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するよう制限します。例: `["hook:", "hook:gmail:"]`。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化された既定値ではなく、静的な `sessionKey` でプリセットを上書きしてください。

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

- 設定されている場合、Gateway は起動時に `gog gmail watch serve` を自動起動します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します。
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
- ローカルのみ: `gateway.bind: "loopback"` (既定) のままにしてください。
- local loopback 以外のバインド: canvas ルートには、他の Gateway HTTP サーフェスと同様に Gateway 認証 (トークン/パスワード/信頼済みプロキシ) が必要です。
- Node WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされ接続されると、Gateway は canvas/A2UI アクセス用の Node スコープの機能 URL を通知します。
- 機能 URL はアクティブなノード WS セッションにバインドされ、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
- 提供される HTML にライブリロードクライアントを挿入します。
- 空の場合はスターター `index.html` を自動作成します。
- A2UI も `/__openclaw__/a2ui/` で提供します。
- 変更には Gateway の再起動が必要です。
- 大きなディレクトリや `EMFILE` エラーでは、ライブリロードを無効にしてください。

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

- `minimal` (組み込みの `bonjour` Plugin が有効な場合の既定): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。LAN マルチキャスト広告には、引き続き組み込みの `bonjour` Plugin が有効である必要があります。
- `off`: Plugin の有効化状態を変更せずに LAN マルチキャスト広告を抑制します。
- 組み込みの `bonjour` Plugin は macOS ホストでは自動起動し、Linux、Windows、コンテナ化された Gateway デプロイではオプトインです。
- ホスト名は、有効な DNS ラベルである場合はシステムのホスト名が既定になり、そうでない場合は `openclaw` にフォールバックします。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` の下にユニキャスト DNS-SD ゾーンを書き込みます。ネットワークをまたいだ検出には、DNSサーバー（CoreDNS 推奨）+ Tailscale split DNS と組み合わせます。

セットアップ: `openclaw dns setup --apply`.

---

## 環境

### `env`（インライン環境変数）

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
- `.env` ファイル: CWD `.env` + `~/.openclaw/.env`（どちらも既存の変数を上書きしません）。
- `shellEnv`: ログインシェルプロファイルから、不足している想定キーをインポートします。
- 完全な優先順位については [環境](/ja-JP/help/environment) を参照してください。

### 環境変数の置換

任意の設定文字列内で `${VAR_NAME}` を使って環境変数を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字の名前のみです: `[A-Z_][A-Z0-9_]*`.
- 変数が不足している、または空の場合は、設定読み込み時にエラーを投げます。
- リテラルの `${VAR}` には `$${VAR}` でエスケープします。
- `$include` と併用できます。

---

## シークレット

シークレット参照は追加的です。平文の値も引き続き動作します。

### `SecretRef`

1つのオブジェクト形状を使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON ポインター（例: `"/providers/openai/apiKey"`）
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（AWS 形式の `secret#json_key` セレクターをサポート）
- `source: "exec"` の id には、スラッシュ区切りのパスセグメントとして `.` または `..` を含めてはいけません（例: `a/../b` は拒否されます）

### サポートされる認証情報サーフェス

- 正規マトリクス: [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、サポートされる `openclaw.json` の認証情報パスを対象にします。
- `auth-profiles.json` の参照は、ランタイム解決と監査カバレッジに含まれます。

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

- `file` プロバイダーは `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue モードでは `id` は `"value"` である必要があります）。
- Windows ACL 検証を利用できない場合、file および exec プロバイダーのパスはフェイルクローズします。検証できない信頼済みパスにのみ `allowInsecurePath: true` を設定してください。
- `exec` プロバイダーには絶対 `command` パスが必要で、stdin/stdout 上のプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決先のターゲットパスを検証しつつシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定します。
- `trustedDirs` が設定されている場合、信頼済みディレクトリチェックは解決先のターゲットパスに適用されます。
- `exec` 子環境はデフォルトでは最小限です。必要な変数は `passEnv` で明示的に渡してください。
- シークレット参照は有効化時にメモリ内スナップショットへ解決され、その後リクエストパスはスナップショットのみを読み取ります。
- 有効化中にアクティブサーフェスのフィルタリングが適用されます。有効なサーフェス上の未解決参照は起動/リロードに失敗し、非アクティブなサーフェスは診断付きでスキップされます。

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
- `auth-profiles.json` は静的認証情報モード向けに、値レベルの参照（`api_key` には `keyRef`、`token` には `tokenRef`）をサポートします。
- `{ "provider": { "apiKey": "..." } }` のような従来のフラットな `auth-profiles.json` マップはランタイム形式ではありません。`openclaw doctor --fix` は、それらを正規の `provider:default` API キープロファイルへ書き換え、`.legacy-flat.*.bak` バックアップを作成します。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef を使った auth-profile 認証情報をサポートしません。
- 静的ランタイム認証情報は、メモリ内で解決済みのスナップショットから取得されます。従来の静的 `auth.json` エントリは、検出時に消去されます。
- 従来の OAuth は `~/.openclaw/credentials/oauth.json` からインポートします。
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

- `billingBackoffHours`: プロファイルが実際の請求/クレジット不足エラーで失敗した場合の、時間単位の基本バックオフ（デフォルト: `5`）。明示的な請求関連テキストは `401`/`403` レスポンスでもここに分類される場合がありますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーのスコープ内に留まります（たとえば OpenRouter の `Key limit exceeded`）。再試行可能な HTTP `402` の使用枠や組織/ワークスペースの利用上限メッセージは、代わりに `rate_limit` パスに留まります。
- `billingBackoffHoursByProvider`: 請求バックオフ時間に対する、任意のプロバイダー別オーバーライド。
- `billingMaxHours`: 請求バックオフの指数的増加に対する、時間単位の上限（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼度の `auth_permanent` 失敗に対する、分単位の基本バックオフ（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加に対する、分単位の上限（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用される、時間単位のローリングウィンドウ（デフォルト: `24`）。
- `overloadedProfileRotations`: モデルフォールバックへ切り替える前に許可する、過負荷エラー向けの同一プロバイダー auth-profile ローテーションの最大数（デフォルト: `1`）。`ModelNotReadyException` のようなプロバイダー高負荷の形状はここに分類されます。
- `overloadedBackoffMs`: 過負荷のプロバイダー/プロファイルローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: モデルフォールバックへ切り替える前に許可する、レート制限エラー向けの同一プロバイダー auth-profile ローテーションの最大数（デフォルト: `1`）。そのレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` のようなプロバイダー形式のテキストが含まれます。

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
- `--verbose` の場合、`consoleLevel` は `debug` に上がります。
- `maxFileBytes`: ローテーション前のアクティブログファイルの最大サイズ（バイト単位、正の整数。デフォルト: `104857600` = 100 MB）。OpenClaw はアクティブファイルの横に、番号付きアーカイブを最大 5 個保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対するベストエフォートのマスキング。`redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効化します。UI/ツール/診断の安全性サーフェスは、出力前に引き続きシークレットを編集します。

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
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: 長時間実行中の処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` として分類するための、進行なし経過時間しきい値（ミリ秒）。返信、ツール、ステータス、ブロック、ACP の進行によりタイマーはリセットされます。繰り返し発生する `session.stuck` 診断は、変更がない間バックオフします。
- `stuckSessionAbortMs`: 回復のために、対象となる停止中のアクティブ作業を abort-drain できるようになるまでの、進行なし経過時間しきい値（ミリ秒）。未設定の場合、OpenClaw は少なくとも 5 分かつ `stuckSessionWarnMs` の 3 倍という、より安全な拡張 embedded-run ウィンドウを使用します。
- `memoryPressureSnapshot`: メモリ圧迫が `critical` に達したとき、編集済みの OOM 前安定性スナップショットを取得します（デフォルト: `false`）。通常のメモリ圧迫イベントを維持しつつ、安定性バンドルファイルのスキャン/書き込みを追加するには `true` に設定します。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効化します（デフォルト: `false`）。完全な設定、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 任意のシグナル別 OTLP エンドポイント。設定すると、そのシグナルに限り `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性用のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効化します。
- `otel.logsExporter`: ログエクスポート先: `"otlp"`（デフォルト）、標準出力 1 行につき 1 つの JSON オブジェクトを出す `"stdout"`、または `"both"`。
- `otel.sampleRate`: トレースサンプリング率 `0`-`1`。
- `otel.flushIntervalMs`: 定期的なテレメトリーフラッシュ間隔（ミリ秒）。
- `otel.captureContent`: OTEL span 属性向けの生コンテンツ取得をオプトインします。デフォルトはオフです。ブール値 `true` は、システム以外のメッセージ/ツールコンテンツを取得します。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt`、`toolDefinitions` を明示的に有効化できます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新の実験的 GenAI 推論 span 形状を有効にする環境トグル。`{gen_ai.operation.name} {gen_ai.request.model}` span 名、`CLIENT` span kind、従来の `gen_ai.system` の代わりの `gen_ai.provider.name` を含みます。デフォルトでは、互換性のため span は `openclaw.model.call` と `gen_ai.system` を維持します。GenAI メトリクスは境界付きのセマンティック属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: グローバル OpenTelemetry SDK をすでに登録しているホスト向けの環境トグル。その場合 OpenClaw は、診断リスナーをアクティブに保ちながら、Plugin 所有の SDK 起動/シャットダウンをスキップします。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 対応する設定キーが未設定の場合に使用される、シグナル別エンドポイント環境変数。
- `cacheTrace.enabled`: embedded run のキャッシュトレーススナップショットをログに記録します（デフォルト: `false`）。
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

- `channel`: npm/git インストール向けのリリースチャンネル - `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: gateway の起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: パッケージインストール向けのバックグラウンド自動更新を有効化します（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャンネルで自動適用する前の最小遅延時間（時間単位、デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャンネルのロールアウトを分散する追加ウィンドウ（時間単位、デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャンネルの確認を実行する頻度（時間単位、デフォルト: `1`、最大: `24`）。

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

- `enabled`: グローバル ACP 機能ゲート（デフォルト: `true`。ACP dispatch と spawn の affordance を非表示にするには `false` を設定）。
- `dispatch.enabled`: ACP セッションターン dispatch の独立したゲート（デフォルト: `true`）。ACP コマンドを利用可能に保ちながら実行をブロックするには `false` を設定します。
- `backend`: デフォルトの ACP ランタイムバックエンド ID（登録済みの ACP ランタイム Plugin と一致する必要があります）。
  先にバックエンド Plugin をインストールし、`plugins.allow` が設定されている場合は、バックエンド Plugin ID（たとえば `acpx`）を含めてください。そうしないと ACP バックエンドは読み込まれません。
- `defaultAgent`: spawn が明示的なターゲットを指定しない場合の、フォールバック ACP ターゲットエージェント ID。
- `allowedAgents`: ACP ランタイムセッションに許可されるエージェント ID の許可リスト。空の場合、追加の制限はありません。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストのアイドルフラッシュウィンドウ（ミリ秒）。
- `stream.maxChunkChars`: ストリーミングブロック projection を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとの繰り返しステータス/ツール行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は増分ストリーミングします。`"final_only"` はターン終端イベントまでバッファリングします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベント後の可視テキスト前に置く区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影される assistant 出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベントに対する、タグ名からブール可視性オーバーライドへのレコード。
- `runtime.ttlMinutes`: ACP セッションワーカーがクリーンアップ対象になるまでの、アイドル TTL（分単位）。
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
  - `"random"` (デフォルト): 面白い/季節ごとのタグラインをローテーションします。
  - `"default"`: 固定の中立的なタグライン (`All your chats, one OpenClaw.`)。
  - `"off"`: タグラインテキストなし (バナーのタイトル/バージョンは引き続き表示されます)。
- バナー全体 (タグラインだけでなく) を非表示にするには、env `OPENCLAW_HIDE_BANNER=1` を設定します。

---

## ウィザード

CLI のガイド付きセットアップフロー (`onboard`, `configure`, `doctor`) によって書き込まれるメタデータ:

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

## ID

[エージェントのデフォルト](/ja-JP/gateway/config-agents#agent-defaults) の `agents.list` ID フィールドを参照してください。

---

## ブリッジ (レガシー、削除済み)

現在のビルドには TCP ブリッジは含まれていません。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーは config スキーマの一部ではなくなりました (削除されるまで検証は失敗します。`openclaw doctor --fix` で不明なキーを取り除けます)。

<Accordion title="レガシーブリッジ config (履歴参照)">

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
    maxConcurrentRuns: 8, // デフォルト; cron ディスパッチ + 分離された cron エージェントターンの実行
    webhook: "https://example.invalid/legacy", // 保存済み notify:true ジョブ用の非推奨フォールバック
    webhookToken: "replace-with-dedicated-token", // アウトバウンド Webhook 認証用の任意の bearer token
    sessionRetention: "24h", // duration 文字列または false
    runLog: {
      maxBytes: "2mb", // デフォルト 2_000_000 バイト
      keepLines: 2000, // デフォルト 2000
    },
  },
}
```

- `sessionRetention`: 完了した分離 cron 実行セッションを `sessions.json` から削除する前に保持する期間。アーカイブ済みの削除済み cron トランスクリプトのクリーンアップも制御します。デフォルト: `24h`; 無効にするには `false` を設定します。
- `runLog.maxBytes`: 古いファイルベースの cron 実行ログとの互換性のために受け付けられます。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: ジョブごとに保持される最新の SQLite 実行履歴行数。デフォルト: `2000`。
- `webhookToken`: cron Webhook POST 配信 (`delivery.mode = "webhook"`) に使用される bearer token。省略した場合、認証ヘッダーは送信されません。
- `webhook`: 非推奨のレガシーフォールバック Webhook URL (http/https)。まだ `notify: true` を持つ保存済みジョブを移行するために `openclaw doctor --fix` が使用します。ランタイム配信ではジョブごとの `delivery.mode="webhook"` と `delivery.to`、またはアナウンス配信を保持する場合は `delivery.completionDestination` を使用します。

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

- `maxAttempts`: 一時的なエラー時の cron ジョブの最大リトライ回数 (デフォルト: `3`; 範囲: `0`-`10`)。
- `backoffMs`: 各リトライ試行のバックオフ遅延 (ミリ秒) の配列 (デフォルト: `[30000, 60000, 300000]`; 1-10 個のエントリ)。
- `retryOn`: リトライをトリガーするエラー種別 - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`。省略すると、すべての一時的な種別をリトライします。

ワンショットジョブはリトライ試行が尽きるまで有効のままになり、その後、最終エラー状態を保持したまま無効化されます。繰り返しジョブは同じ一時的リトライポリシーを使用し、次のスケジュール枠の前にバックオフ後に再実行します。永続的エラーまたは一時的リトライの枯渇時は、通常の繰り返しスケジュールにエラーバックオフ付きで戻ります。

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

- `enabled`: cron ジョブの失敗アラートを有効にします (デフォルト: `false`)。
- `after`: アラートが発火するまでの連続失敗回数 (正の整数、最小: `1`)。
- `cooldownMs`: 同じジョブに対する繰り返しアラート間の最小ミリ秒数 (非負整数)。
- `includeSkipped`: 連続スキップ実行をアラートしきい値にカウントします (デフォルト: `false`)。スキップ実行は別個に追跡され、実行エラーのバックオフには影響しません。
- `mode`: 配信モード - `"announce"` はチャネルメッセージ経由で送信し、`"webhook"` は設定済み Webhook に投稿します。
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

- すべてのジョブにわたる cron 失敗通知のデフォルト宛先。
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータが存在する場合、デフォルトは `"announce"` です。
- `channel`: アナウンス配信用のチャネル上書き。`"last"` は最後に確認された配信チャネルを再利用します。
- `to`: 明示的なアナウンスターゲットまたは Webhook URL。Webhook モードでは必須です。
- `accountId`: 配信用の任意のアカウント上書き。
- ジョブごとの `delivery.failureDestination` はこのグローバルデフォルトを上書きします。
- グローバルとジョブごとの失敗宛先がどちらも設定されていない場合、すでに `announce` 経由で配信しているジョブは、失敗時にそのプライマリアナウンスターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。分離された cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

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
| `{{MediaUrl}}`     | 受信メディアの疑似 URL                            |
| `{{MediaPath}}`    | ローカルメディアパス                              |
| `{{MediaType}}`    | メディア種別 (画像/音声/ドキュメント/…)           |
| `{{Transcript}}`   | 音声トランスクリプト                              |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディアプロンプト      |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数          |
| `{{ChatType}}`     | `"direct"` または `"group"`                       |
| `{{GroupSubject}}` | グループ件名 (ベストエフォート)                   |
| `{{GroupMembers}}` | グループメンバーのプレビュー (ベストエフォート)   |
| `{{SenderName}}`   | 送信者の表示名 (ベストエフォート)                 |
| `{{SenderE164}}`   | 送信者の電話番号 (ベストエフォート)               |
| `{{Provider}}`     | Provider ヒント (whatsapp, telegram, discord など) |

---

## Config include (`$include`)

config を複数のファイルに分割します:

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
- ファイルの配列: 順番に深くマージされます (後のものが前のものを上書きします)。
- 兄弟キー: include 後にマージされます (include された値を上書きします)。
- ネストされた include: 最大 10 レベルの深さまで。
- パス: include しているファイルからの相対パスとして解決されますが、トップレベル config ディレクトリ (`openclaw.json` の `dirname`) 内に収まっている必要があります。絶対パス/`../` 形式は、その境界内に解決される場合にのみ許可されます。パスには null バイトを含めてはならず、解決前後のどちらでも 4096 文字未満である必要があります。
- 単一ファイル include で裏付けられた 1 つのトップレベルセクションだけを変更する OpenClaw 所有の書き込みは、その include 先ファイルへ書き込みます。たとえば、`plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` 内で更新し、`openclaw.json` はそのまま残します。
- ルート include、include 配列、兄弟上書きを伴う include は、OpenClaw 所有の書き込みでは読み取り専用です。これらの書き込みは config をフラット化する代わりに fail closed します。
- エラー: ファイル欠落、解析エラー、循環 include、無効なパス形式、過度な長さに対して明確なメッセージを出します。

---

_関連: [設定](/ja-JP/gateway/configuration) · [設定例](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
