---
read_when:
    - フィールド単位の設定の意味論またはデフォルトを正確に把握する必要がある
    - チャネル、モデル、Gateway、またはツールの設定ブロックを検証している
summary: OpenClaw コアキー、デフォルト、専用サブシステムリファレンスへのリンクに関する Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-07-06T10:49:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e431290ad59b7b350150149ca603b014c5611751c62162913193a7c470ecd190
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` のフィールドレベルのリファレンス: キー、デフォルト、より詳細なサブシステムページへのリンク。タスク指向のセットアップガイダンスについては、[設定](/ja-JP/gateway/configuration)を参照してください。チャンネルおよび Plugin が所有するコマンドカタログと、詳細なメモリ/QMD ノブは、それぞれのページにあり、ここにはありません。

設定形式は **JSON5** です（コメントと末尾カンマが許可されます）。すべてのフィールドは任意です。省略された場合、OpenClaw は安全なデフォルトを使用します。

このページより実装が優先されます:

- `openclaw config schema` は、検証と Control UI に使われるライブ JSON Schema を、バンドル済み/Plugin/チャンネルのメタデータをマージした状態で出力します。
- エージェントは、設定を編集する前に、`gateway` ツールアクション `config.schema.lookup` を呼び出して、正確なパススコープのスキーマノードを1つ取得する必要があります。
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、このドキュメントのベースラインハッシュを現在のスキーマサーフェスに対して検証します。

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)。
- 現在の組み込み + バンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)。
- チャンネル固有のコマンドサーフェスについては、所有するチャンネル/Plugin ページ。

---

## チャンネル

チャンネルごとの設定キーは [設定 - チャンネル](/ja-JP/gateway/config-channels) にあります: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、その他のバンドル済みチャンネル向けの `channels.*`（認証、アクセス制御、マルチアカウント、メンションゲーティング）。

## エージェントのデフォルト、マルチエージェント、セッション、メッセージ

以下については [設定 - エージェント](/ja-JP/gateway/config-agents) を参照してください:

- `agents.defaults.*`（ワークスペース、モデル、思考、heartbeat、メモリ、メディア、skills、サンドボックス）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションライフサイクル、compaction、プルーニング）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk モード）
  - `talk.consultThinkingLevel`: Control UI Talk のリアルタイム相談の背後で実行される OpenClaw エージェント全体に対する思考レベルのオーバーライド
  - `talk.consultFastMode`: Control UI Talk のリアルタイム相談に対するワンショットの高速モードオーバーライド
  - `talk.speechLocale`: iOS/macOS での Talk 音声認識に使う任意の BCP 47 ロケール ID
  - `talk.silenceTimeoutMs`: 未設定の場合、Talk はトランスクリプトを送信する前にプラットフォーム既定の一時停止ウィンドウを維持します（`macOS と Android では 700 ms、iOS では 900 ms`）
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` をスキップする確定済みリアルタイム Talk トランスクリプト向けの Gateway リレーフォールバック

## ツールとカスタムプロバイダー

ツールポリシー、実験的トグル、プロバイダーに裏付けられたツール設定、カスタムプロバイダー / ベース URL のセットアップは、[設定 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools) にあります。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダーのセットアップは、[設定 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls) にあります。
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
- `models.providers.*.localService`: ローカルモデルサーバー向けの任意のオンデマンドプロセスマネージャー。OpenClaw は設定されたヘルスエンドポイントをプローブし、必要に応じて絶対パスの `command` を起動し、準備完了を待ってからモデルリクエストを送信します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。
- `models.pricing.enabled`: sidecar とチャンネルが Gateway の ready パスに到達した後に開始するバックグラウンド価格ブートストラップを制御します。`false` の場合、Gateway は OpenRouter と LiteLLM の価格カタログ取得をスキップします。設定済みの `models.providers.*.models[].cost` 値は、ローカルコスト見積もりで引き続き機能します。

## MCP

OpenClaw が管理する MCP サーバー定義は `mcp.servers` 配下にあり、組み込み OpenClaw やその他のランタイムアダプターによって使用されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、設定編集時に対象サーバーへ接続せずにこのブロックを管理します。

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
- `mcp.servers.<name>.enabled`: 保存済みのサーバー定義を保持しながら、組み込み OpenClaw MCP の検出とツール投影から除外するには `false` を設定します。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: サーバーごとの MCP リクエストタイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: サーバーごとの接続タイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.supportsParallelToolCalls`: 並列 MCP ツール呼び出しを発行するかどうかを選択できるアダプター向けの任意の並行性ヒント。
- `mcp.servers.<name>.auth`: OAuth を必要とする HTTP MCP サーバーには `"oauth"` を設定します。`openclaw mcp login <name>` を実行して、トークンを OpenClaw 状態配下に保存します。
- `mcp.servers.<name>.oauth`: OAuth スコープ、リダイレクト URL、クライアントメタデータ URL の任意のオーバーライド。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`: プライベートエンドポイントと相互 TLS 向けの HTTP TLS 制御。
- `mcp.servers.<name>.toolFilter`: サーバーごとの任意のツール選択。`include` は検出される MCP ツールを一致する名前に限定し、`exclude` は一致する名前を非表示にします。エントリは正確な MCP ツール名、または単純な `*` グロブです。リソースまたはプロンプトを持つサーバーは、ユーティリティツール名（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）も生成し、それらの名前にも同じフィルターが使われます。
- `mcp.servers.<name>.codex`: 任意の Codex app-server 投影制御。このブロックは Codex app-server スレッド専用の OpenClaw メタデータです。ACP セッション、汎用 Codex ハーネス設定、その他のランタイムアダプターには影響しません。
  空でない `codex.agents` は、サーバーを列挙された OpenClaw エージェント ID に限定します。
  空、空白、または無効なスコープ付きエージェントリストは、グローバルになる代わりに、設定検証で拒否され、ランタイム投影パスで省略されます。
  `codex.defaultToolsApprovalMode` は、そのサーバー向けに Codex ネイティブの `default_tools_approval_mode` を出力します。OpenClaw は、ネイティブの `mcp_servers` 設定を Codex に渡す前に `codex` ブロックを取り除きます。ブロックを省略すると、そのサーバーはすべての Codex app-server エージェントに対して、Codex の既定 MCP 承認動作で投影されます。
- `mcp.sessionIdleTtlMs`: セッションスコープのバンドル済み MCP ランタイムのアイドル TTL。ワンショットの組み込み実行は実行終了時のクリーンアップを要求します。この TTL は、長時間稼働するセッションと将来の呼び出し元に対するバックストップです。
- `mcp.*` 配下の変更は、キャッシュ済みセッション MCP ランタイムを破棄することでホット適用されます。次回のツール検出/使用時に新しい設定から再作成されるため、削除された `mcp.servers` エントリはアイドル TTL を待たずに即座に回収されます。
- ランタイム検出は、MCP ツールリスト変更通知も尊重し、そのセッションのキャッシュ済みカタログを破棄します。リソースまたはプロンプトを広告するサーバーには、リソースの一覧/読み取りとプロンプトの一覧/取得のためのユーティリティツールが与えられます。ツール呼び出しの失敗が繰り返されると、別の呼び出しが試行される前に、影響を受けたサーバーが短時間一時停止されます。

ランタイム動作については [MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry) と [CLI バックエンド](/ja-JP/gateway/cli-backends#bundle-mcp-overlays) を参照してください。

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

- `allowBundled`: バンドル済み Skills のみを対象にした任意の許可リスト（管理対象/ワークスペース Skills には影響しません）。
- `load.extraDirs`: 追加の共有 Skill ルート（最も低い優先順位）。
- `load.allowSymlinkTargets`: Skill のシンボリックリンクが設定済みソースルートの外側にある場合に、そのリンクが解決してよい信頼済みの実ターゲットルート。
- `workshop.allowSymlinkTargetWrites`: すでに信頼済みのシンボリックリンクターゲットを通じて Skill Workshop apply が書き込むことを許可します（デフォルト: false）。
- `install.preferBrew`: true の場合、`brew` が利用可能なら他のインストーラー種別にフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` 仕様の Node インストーラー優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`: 信頼済みの `operator.admin` Gateway クライアントが、`skills.upload.*` を通じてステージされたプライベート zip アーカイブをインストールすることを許可します（デフォルト: false）。これはアップロード済みアーカイブのパスのみを有効にします。通常の ClawHub インストールには不要です。
- `entries.<skillKey>.enabled: false` は、バンドル済み/インストール済みであっても Skill を無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数を宣言する Skills 向けの便利設定（プレーンテキスト文字列または SecretRef オブジェクト）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`: Skill 検出とモデル向け Skills プロンプトを制限します。
- Skill Workshop の自律性/承認設定（`workshop.autonomous.enabled`、`workshop.approvalPolicy`、`workshop.maxPending`、`workshop.maxSkillBytes`）は [Skills 設定](/ja-JP/tools/skills-config) に記載されています。

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
- スタンドアロンのプラグインファイルは `plugins.load.paths` に配置します。自動検出される拡張ルートは最上位の `.js`、`.mjs`、`.ts` ファイルを無視するため、それらのルート内のヘルパースクリプトが起動を妨げることはありません。
- 検出では、ネイティブ OpenClaw プラグインに加えて、互換性のある Codex バンドルと Claude バンドル（マニフェストのない Claude のデフォルトレイアウトバンドルを含む）を受け入れます。
- **設定変更には Gateway の再起動が必要です。**
- `allow`: 任意の許可リスト（列挙されたプラグインのみ読み込まれます）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: プラグインレベルの API キー用の簡便フィールド（プラグインが対応している場合）。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視します。ただし、レガシーの `modelOverride` と `providerOverride` は保持します。ネイティブプラグインフックと、対応バンドルが提供するフックディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼済みの非バンドルプラグインは、`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end` などの型付きフックから生の会話内容を読み取れます。
- `plugins.entries.<id>.subagent.allowModelOverride`: このプラグインがバックグラウンドのサブエージェント実行ごとに `provider` と `model` のオーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼済みサブエージェントのオーバーライドに対する正規の `provider/model` ターゲットの任意の許可リスト。任意のモデルを許可する意図がある場合にのみ `"*"` を使用します。
- `plugins.entries.<id>.llm.allowModelOverride`: このプラグインが `api.runtime.llm.complete` のモデルオーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.llm.allowedModels`: 信頼済みプラグインの LLM 補完オーバーライドに対する正規の `provider/model` ターゲットの任意の許可リスト。任意のモデルを許可する意図がある場合にのみ `"*"` を使用します。
- `plugins.entries.<id>.llm.allowAgentIdOverride`: このプラグインがデフォルト以外のエージェント ID に対して `api.runtime.llm.complete` を実行することを明示的に信頼します。
- `plugins.entries.<id>.config`: プラグイン定義の設定オブジェクト（利用可能な場合はネイティブ OpenClaw プラグインスキーマで検証されます）。
- チャネルプラグインのアカウント/ランタイム設定は `channels.<id>` 配下にあり、中央の OpenClaw オプションレジストリではなく、所有プラグインのマニフェスト `channelConfigs` メタデータで説明されるべきです。

### Codex ハーネスプラグイン設定

バンドルされた `codex` プラグインは、ネイティブ Codex アプリサーバーハーネス設定を
`plugins.entries.codex.config` 配下で所有します。完全な設定
サーフェスについては [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を、ランタイムモデルについては [Codex ハーネス](/ja-JP/plugins/codex-harness) を参照してください。

`codexPlugins` は、ネイティブ Codex ハーネスを選択したセッションにのみ適用されます。
OpenClaw プロバイダー実行、ACP 会話バインディング、または Codex 以外のハーネスで Codex プラグインを有効化するものではありません。

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

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex ハーネスでネイティブ Codex
  プラグイン/アプリ対応を有効にします。デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  移行済みプラグインアプリの elicitations に対するデフォルトの破壊的アクションポリシー。
  プロンプトなしで安全な Codex 承認スキーマを受け入れるには `true`、拒否するには `false`、
  Codex が要求する承認を OpenClaw プラグイン承認にルーティングするには `"auto"`、
  永続承認なしですべてのプラグイン書き込み/破壊的アクションについてプロンプトするには `"ask"` を使用します。
  `"ask"` モードは、影響を受けるアプリの Codex ツールごとの永続承認オーバーライドをクリアし、
  Codex スレッド開始前にそのアプリの人間の承認レビュアーを選択します。
  デフォルト: `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: グローバルの
  `codexPlugins.enabled` も true の場合に、移行済みプラグインエントリを有効にします。
  デフォルト: 明示的なエントリでは `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  安定したマーケットプレイス ID。V1 は `"openai-curated"` のみ対応します。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: 移行元の安定した
  Codex プラグイン ID。例: `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  プラグインごとの破壊的アクションのオーバーライド。省略時は、グローバルの
  `allow_destructive_actions` 値が使用されます。プラグインごとの値は、同じ
  `true`、`false`、`"auto"`、または `"ask"` ポリシーを受け入れます。

`"ask"` を使用する許可済みプラグインアプリはそれぞれ、そのアプリの承認リクエストを
人間のレビュアーにルーティングします。他のアプリやアプリ以外のスレッド承認は設定済みの
レビュアーを維持するため、混在したプラグインポリシーが `"ask"` の挙動を継承することはありません。

`codexPlugins.enabled` はグローバルな有効化ディレクティブです。移行によって書き込まれた明示的なプラグイン
エントリは、永続的なインストールおよび修復対象セットです。
`plugins["*"]` は対応しておらず、`install` スイッチはありません。また、ローカルの
`marketplacePath` 値はホスト固有であるため、意図的に設定フィールドにはしていません。

`app/list` の準備状況チェックは 1 時間キャッシュされ、古くなると非同期に更新されます。
Codex スレッドのアプリ設定は、各ターンではなく Codex ハーネスセッション確立時に計算されます。
ネイティブプラグイン設定を変更した後は、`/new`、`/reset`、または Gateway の再起動を使用してください。

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch プロバイダー設定。
  - `apiKey`: 上限を引き上げるための任意の Firecrawl API キー（SecretRef を受け入れます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、レガシー `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数にフォールバックします。
  - `baseUrl`: Firecrawl API ベース URL（デフォルト: `https://api.firecrawl.dev`。セルフホストのオーバーライドはプライベート/内部エンドポイントを対象にする必要があります）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ期間（ミリ秒）（デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイピングリクエストのタイムアウト（秒）（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search プロバイダーを有効にします。
  - `model`: 検索に使用する Grok モデル（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: メモリの Dreaming 設定。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: Dreaming のマスタースイッチ（デフォルト `false`）。
  - `frequency`: 各完全 Dreaming スイープの cron 間隔（デフォルトは `"0 3 * * *"`）。
  - `model`: 任意の Dream Diary サブエージェントモデルオーバーライド。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。ターゲットを制限するには `allowedModels` と組み合わせてください。モデル利用不可エラーはセッションのデフォルトモデルで 1 回再試行します。信頼または許可リストの失敗は暗黙にフォールバックしません。
  - フェーズポリシーとしきい値は実装の詳細です（ユーザー向け設定キーではありません）。
- 完全なメモリ設定は [メモリ設定リファレンス](/ja-JP/reference/memory-config) にあります。
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化された Claude バンドルプラグインは、`settings.json` から埋め込み OpenClaw デフォルトを提供することもできます。OpenClaw はそれらを生の OpenClaw 設定パッチとしてではなく、サニタイズされたエージェント設定として適用します。
- `plugins.slots.memory`: アクティブなメモリプラグイン ID を選択します。メモリプラグインを無効にするには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブなコンテキストエンジンプラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` です。

[プラグイン](/ja-JP/tools/plugin) を参照してください。

---

## コミットメント

`commitments` は推論されたフォローアップメモリを制御します。OpenClaw は会話ターンからチェックインを検出し、Heartbeat 実行を通じて配信できます。

- `commitments.enabled`: 推論されたフォローアップコミットメントに対する非表示の LLM 抽出、保存、Heartbeat 配信を有効にします。デフォルト: `false`。
- `commitments.maxPerDay`: ローリング 1 日内にエージェントセッションごとに配信される、推論されたフォローアップコミットメントの最大数。デフォルト: `3`。

[推論されたコミットメント](/ja-JP/concepts/commitments) を参照してください。

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
- `tabCleanup` は、アイドル時間後、またはセッションが上限を超えたときに、追跡中のプライマリエージェントタブを回収します。`idleMinutes: 0` または `maxTabsPerSession: 0` を設定すると、それぞれのクリーンアップモードを無効にできます。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時には無効のため、ブラウザナビゲーションはデフォルトで厳格なままです。
- プライベートネットワークのブラウザナビゲーションを意図的に信頼する場合にのみ、`ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定してください。
- strict モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）は到達性/検出チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。
- strict モードでは、明示的な例外には `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはアタッチ専用です（開始/停止/リセットは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け入れます。
  OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用し、プロバイダーが直接の DevTools WebSocket URL を提供する場合は WS(S) を使用します。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび `attachOnly` CDP の到達性に加えて、タブを開くリクエストに適用されます。管理対象の loopback プロファイルはローカル CDP のデフォルトを維持します。永続的なリモート Playwright タブ列挙では、大きい方の値を操作期限として使用します。
- 外部管理の CDP サービスが loopback 経由で到達可能な場合は、そのプロファイルに `attachOnly: true` を設定してください。そうしないと OpenClaw は loopback ポートをローカル管理ブラウザプロファイルとして扱い、ローカルポート所有権エラーを報告する場合があります。
- `existing-session` プロファイルは CDP の代わりに Chrome MCP を使用し、選択されたホスト上または接続済みブラウザノード経由でアタッチできます。
- `existing-session` プロファイルでは、Brave や Edge などの特定の Chromium ベースのブラウザプロファイルを対象にするために `userDataDir` を設定できます。
- Chrome が DevTools HTTP(S) 検出エンドポイントまたは直接 WS(S) エンドポイントの背後ですでに実行されている場合、`existing-session` プロファイルでは `cdpUrl` を設定できます。このモードでは、OpenClaw は自動接続を使用する代わりにエンドポイントを Chrome MCP に渡します。Chrome MCP の起動引数では `userDataDir` は無視されます。
- `existing-session` プロファイルは現在の Chrome MCP ルート制限を維持します。CSS セレクターターゲティングの代わりにスナップショット/ref 駆動のアクション、単一ファイルアップロードフック、ダイアログタイムアウト上書きなし、`wait --load networkidle` なし、さらに `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなしです。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。リモート CDP プロファイルまたは existing-session エンドポイントアタッチの場合にのみ、`cdpUrl` を明示的に設定してください。
- ローカル管理プロファイルでは、そのプロファイルのグローバル `browser.executablePath` を上書きするために `executablePath` を設定できます。1 つのプロファイルを Chrome で、別のプロファイルを Brave で実行する場合に使用します。
- ローカル管理プロファイルは、プロセス開始後の Chrome CDP HTTP 検出に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP websocket 準備完了に `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に起動するものの準備完了チェックが起動と競合する低速なホストでは、これらを引き上げてください。どちらの値も `120000` ms までの正の整数である必要があり、無効な設定値は拒否されます。
- 自動検出順序: デフォルトブラウザが Chromium ベースの場合 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、Chromium 起動前に OS のホームディレクトリとして `~` と `~/...` を受け入れます。
  `existing-session` プロファイルのプロファイルごとの `userDataDir` もチルダ展開されます。
- コントロールサービス: loopback のみ（ポートは `gateway.port` から派生、デフォルトは `18791`）。
- `extraArgs` はローカル Chromium 起動に追加の起動フラグを付加します（例: `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグ）。

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
- `assistant`: Control UI のアイデンティティ上書き。アクティブなエージェントアイデンティティにフォールバックします。

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

<Accordion title="Gateway フィールド詳細">

- `mode`: `local`（Gatewayを実行）または`remote`（リモートGatewayに接続）。`local`でない限り、Gatewayは起動を拒否します。
- `port`: WS + HTTP用の単一多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IPのみ）、または`custom`。
- **レガシーbindエイリアス**: `gateway.bind`では、ホストエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bindモード値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用します。
- **Docker注記**: デフォルトの`loopback` bindは、コンテナ内の`127.0.0.1`でリッスンします。Dockerブリッジネットワーク（`-p 18789:18789`）では、トラフィックは`eth0`に到着するため、Gatewayに到達できません。`--network host`を使用するか、すべてのインターフェイスでリッスンするために`bind: "lan"`（または`customBindHost: "0.0.0.0"`を指定した`bind: "custom"`）を設定します。
- **認証**: デフォルトで必須です。非loopback bindにはGateway認証が必要です。実際には、共有トークン/パスワード、または`gateway.auth.mode: "trusted-proxy"`を指定したID認識リバースプロキシを意味します。オンボーディングウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定されている場合（SecretRefを含む）、`gateway.auth.mode`を明示的に`token`または`password`に設定します。両方が設定されていてmodeが未設定の場合、起動とサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモード。信頼できるlocal loopbackセットアップでのみ使用します。これは意図的にオンボーディングプロンプトでは提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザ/ユーザー認証をID認識リバースプロキシに委任し、`gateway.trustedProxies`からのIDヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)を参照）。このモードはデフォルトで**非loopback**プロキシソースを想定します。同一ホストのloopbackリバースプロキシには、明示的な`gateway.auth.trustedProxy.allowLoopback = true`が必要です。内部の同一ホスト呼び出し元は、ローカル直接フォールバックとして`gateway.auth.password`を使用できます。`gateway.auth.token`はtrusted-proxyモードと引き続き相互排他的です。
- `gateway.auth.allowTailscale`: `true`の場合、Tailscale ServeのIDヘッダーでControl UI/WebSocket認証を満たせます（`tailscale whois`で検証）。HTTP APIエンドポイントはそのTailscaleヘッダー認証を**使用しません**。代わりにGatewayの通常のHTTP認証モードに従います。このトークンなしフローは、Gatewayホストが信頼されていることを前提とします。`tailscale.mode = "serve"`の場合、デフォルトは`true`です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアントIPごと、および認証スコープごとに適用されます（shared-secretとdevice-tokenは独立して追跡されます）。ブロックされた試行は`429` + `Retry-After`を返します。
  - 非同期のTailscale Serve Control UIパスでは、同じ`{scope, clientIp}`に対する失敗試行は、失敗書き込みの前に直列化されます。そのため、同じクライアントからの同時の不正試行は、両方が単なる不一致として競合して通過するのではなく、2回目のリクエストでリミッターに達する可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback`のデフォルトは`true`です。localhostトラフィックも意図的にレート制限したい場合（テストセットアップや厳格なプロキシデプロイなど）は`false`に設定します。
- ブラウザoriginのWS認証試行は、loopback免除を無効にして常にスロットリングされます（ブラウザベースのlocalhost総当たり攻撃に対する多層防御）。
- loopbackでは、これらのブラウザoriginのロックアウトは正規化された`Origin`
  値ごとに分離されるため、あるlocalhost originからの失敗の繰り返しが、
  別のoriginを自動的にロックアウトすることはありません。
- `tailscale.mode`: `serve`（tailnetのみ、loopback bind）または`funnel`（公開、認証が必要）。
- `tailscale.serviceName`: Serveモード用の任意のTailscale Service名。例:
  `svc:openclaw`。設定すると、OpenClawはそれを`tailscale serve
--service`に渡し、Control UIをデバイスホスト名ではなく名前付きService経由で公開できるようにします。この値はTailscaleの`svc:<dns-label>`
  Service名形式を使用する必要があります。起動時に派生したService URLが報告されます。
- `tailscale.preserveFunnel`: `true`かつ`tailscale.mode = "serve"`の場合、OpenClawは起動時にServeを再適用する前に`tailscale funnel status`を確認し、外部で設定されたFunnelルートがすでにGatewayポートをカバーしている場合はスキップします。
  デフォルトは`false`です。
- `controlUi.allowedOrigins`: Gateway WebSocket接続用の明示的なブラウザorigin許可リスト。公開の非loopbackブラウザoriginには必須です。loopback、RFC1918/link-local、`.local`、`.ts.net`、またはTailscale CGNATホストから読み込まれるプライベートな同一origin LAN/Tailnet UIは、Hostヘッダーフォールバックを有効にしなくても受け入れられます。
- `controlUi.chatMessageMaxWidth`: グループ化されたControl UIチャットメッセージの任意の最大幅。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)`など、制約付きCSS幅値を受け入れます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Hostヘッダーoriginポリシーに意図的に依存するデプロイ向けに、Hostヘッダーoriginフォールバックを有効にする危険なモード。
- `terminal.enabled`: 管理者スコープのオペレーター端末にオプトインします。デフォルト: `false`。端末は選択されたエージェントワークスペース内でホストPTYを開始し、Gatewayプロセス環境を継承し、`sandbox.mode: "all"`のエージェントでは拒否されます。信頼できるオペレーターデプロイでのみ有効にしてください。変更するとGatewayが再起動し、Control UIのコンテンツセキュリティポリシーが更新されます。
- `terminal.shell`: 任意のシェル実行ファイル。未設定の場合、OpenClawはUnixでは`$SHELL`、Windowsでは`%ComSpec%`を使用します。
- `terminal.detachedSessionTimeoutSeconds`: 接続が切断された後（ページ再読み込み、ノートPCのスリープ）、端末セッションが存続し、最近の出力を再生して`terminal.attach`で再接続可能な状態を保つ時間。デフォルト: `300`。接続が切断された瞬間にセッションを終了するには`0`を設定します。切断済みセッションはコマンドを実行し続けるため、共有ホストや公開ホストではこの値を短くしてください。
- `remote.transport`: `ssh`（デフォルト）または`direct`（ws/wss）。`direct`では、公開ホストの場合`remote.url`は`wss://`である必要があります。平文の`ws://`は、loopback、LAN、link-local、`.local`、`.ts.net`、およびTailscale CGNATホストでのみ受け入れられます。
- `remote.remotePort`: リモートSSHホスト上のGatewayポート。デフォルトは`18789`です。ローカルトンネルポートがリモートGatewayポートと異なる場合に使用します。
- `remote.sshHostKeyPolicy`: macOS SSHトンネルのホストキー ポリシー。`strict`がデフォルトで、すでに信頼済みのキーが必要です。`openssh`は、管理対象エイリアスに対する有効なOpenSSH設定への明示的なオプトインです。使用前に、一致するユーザーおよびシステムのSSH設定を確認してください。macOSアプリと`configure-remote`は、明示的に再度オプトインしない限り、ターゲット変更時にこのポリシーを`strict`へリセットします。
- `gateway.remote.token` / `.password`はリモートクライアントの資格情報フィールドです。それ自体ではGateway認証を設定しません。
- `gateway.push.apns.relay.baseUrl`: リレー対応iOSビルドがGatewayに登録を公開した後に使用する外部APNsリレーのベースHTTPS URL。公開App StoreビルドはホストされたOpenClawリレーを使用します。カスタムリレーURLは、そのリレーを指すリレーURLを持つ、意図的に分離されたiOSビルド/デプロイパスと一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gatewayからリレーへの送信タイムアウト（ミリ秒）。デフォルトは`10000`です。
- リレー対応登録は特定のGateway IDに委任されます。ペアリングされたiOSアプリは`gateway.identity.get`を取得し、そのIDをリレー登録に含め、登録スコープの送信許可をGatewayへ転送します。別のGatewayはその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記リレー設定の一時的なenv上書き。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTPリレーURL用の開発専用エスケープハッチ。本番リレーURLはHTTPSのままにする必要があります。
- `gateway.handshakeTimeoutMs`: 認証前Gateway WebSocketハンドシェイクのタイムアウト（ミリ秒）。デフォルト: `15000`。`OPENCLAW_HANDSHAKE_TIMEOUT_MS`が設定されている場合は優先されます。起動時のウォームアップがまだ落ち着いていない間にローカルクライアントが接続できる、高負荷または低電力のホストではこの値を増やします。
- `gateway.channelHealthCheckMinutes`: チャネルヘルスモニター間隔（分）。グローバルにヘルスモニター再起動を無効にするには`0`を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: staleソケットしきい値（分）。これは`gateway.channelHealthCheckMinutes`以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング1時間あたり、チャネル/アカウントごとのヘルスモニター再起動の最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターを有効にしたまま、チャネルごとにヘルスモニター再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャネルのアカウントごとの上書き。設定されている場合、チャネルレベルの上書きより優先されます。
- ローカルGateway呼び出しパスは、`gateway.auth.*`が未設定の場合にのみ、フォールバックとして`gateway.remote.*`を使用できます。
- `gateway.auth.token` / `gateway.auth.password`がSecretRef経由で明示的に設定され、解決されていない場合、解決はfail closedします（リモートフォールバックによるマスクなし）。
- `trustedProxies`: TLSを終端する、またはforwarded-clientヘッダーを注入するリバースプロキシIP。管理下にあるプロキシのみを列挙してください。loopbackエントリは、同一ホストのプロキシ/ローカル検出セットアップ（例: Tailscale Serveやローカルリバースプロキシ）では引き続き有効ですが、loopbackリクエストを`gateway.auth.mode: "trusted-proxy"`の対象には**しません**。
- `allowRealIpFallback`: `true`の場合、`X-Forwarded-For`がないときにGatewayは`X-Real-IP`を受け入れます。fail-closed動作のため、デフォルトは`false`です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求スコープなしで初回ノードデバイスペアリングを自動承認するための任意のCIDR/IP許可リスト。未設定の場合は無効です。これはオペレーター/ブラウザ/Control UI/WebChatのペアリングを自動承認せず、ロール、スコープ、メタデータ、または公開鍵のアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングおよびプラットフォーム許可リスト評価後の、宣言済みノードコマンドに対するグローバルな許可/拒否の整形。`camera.snap`、`camera.clip`、`screen.record`などの危険なノードコマンドにオプトインするには`allowCommands`を使用します。`denyCommands`は、プラットフォームデフォルトまたは明示的な許可に含まれる場合でもコマンドを削除します。ノードが宣言済みコマンドリストを変更した後は、そのデバイスペアリングを拒否して再承認し、Gatewayが更新後のコマンドスナップショットを保存するようにします。
- `gateway.tools.deny`: HTTP `POST /tools/invoke`でブロックされる追加ツール名（デフォルト拒否リストを拡張）。
- `gateway.tools.allow`: owner/admin呼び出し元向けに、デフォルトHTTP拒否リストからツール名を削除します。これはIDを持つ`operator.write`
  呼び出し元をowner/adminアクセスへ昇格しません。許可リストに含めても、`cron`、`gateway`、`nodes`は
  非owner呼び出し元には引き続き利用できません。

</Accordion>

### OpenAI互換エンドポイント

- Admin HTTP RPC: `admin-http-rpc` Pluginとしてデフォルトではオフです。Pluginを有効にすると`POST /api/v1/admin/rpc`が登録されます。[Admin HTTP RPC](/ja-JP/plugins/admin-http-rpc)を参照してください。
- Chat Completions: デフォルトで無効です。`gateway.http.endpoints.chatCompletions.enabled: true`で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL入力の堅牢化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の許可リストは未設定として扱われます。URL取得を無効にするには`gateway.http.endpoints.responses.files.allowUrl=false`
    および/または`gateway.http.endpoints.responses.images.allowUrl=false`を使用します。
- 任意のレスポンス堅牢化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（管理下のHTTPS originにのみ設定します。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts)を参照）

### マルチインスタンス分離

一意のポートと状態ディレクトリを使用して、1つのホスト上で複数のGatewayを実行します:

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

- `mode`: 実行時に設定編集をどのように適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: 設定変更時に常に Gateway プロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"` (デフォルト): まずホットリロードを試し、必要な場合は再起動にフォールバックします。
- `debounceMs`: 設定変更が適用される前のデバウンス時間 (ミリ秒) (非負整数。デフォルト: `300`)。
- `deferralTimeoutMs`: 再起動またはチャンネルのホットリロードを強制する前に、進行中の操作を待つ任意の最大時間 (ミリ秒)。デフォルトの上限付き待機 (`300000`) を使用するには省略します。無期限に待機し、まだ保留中であることを示す警告を定期的にログ出力するには `0` を設定します。

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

検証と安全上の注意:

- `hooks.enabled=true` には、空でない `hooks.token` が必要です。
- `hooks.token` は、アクティブな Gateway 共有シークレット認証 (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) とは別にする必要があります。再利用が検出されると、起動時に致命的ではないセキュリティ警告がログ出力されます。
- `openclaw security audit` は、監査時にのみ指定された Gateway パスワード認証 (`--auth password --password <password>`) も含め、フック/Gateway 認証の再利用を重大な検出事項としてフラグします。永続化された再利用中の `hooks.token` をローテーションするには `openclaw doctor --fix` を実行し、その後、外部のフック送信元を新しいフックトークンを使うように更新してください。
- `hooks.path` を `/` にすることはできません。`/hooks` などの専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください (例: `["hook:"]`)。
- マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的マッピングキーにはそのオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け入れられます (デフォルト: `false`)。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されます
  - テンプレートでレンダリングされたマッピングの `sessionKey` 値は外部から提供されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="マッピングの詳細">

- `match.path` は `/hooks` の後のサブパスに一致します (例: `/hooks/gmail` → `gmail`)。
- `match.source` は汎用パス用のペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` は、フックアクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` の内部に留まります (絶対パスとトラバーサルは拒否されます)。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` の下に置いてください。ワークスペースの skill ディレクトリは拒否されます。`openclaw doctor` がこのパスを無効として報告する場合は、transform モジュールを hooks transforms ディレクトリに移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントへルーティングします。不明な ID はデフォルトエージェントにフォールバックします。
- `allowedAgentIds`: `agentId` が省略された場合のデフォルトエージェントパスを含め、有効なエージェントルーティングを制限します (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: 明示的な `sessionKey` がないフックエージェント実行用の任意の固定セッションキー。
- `allowRequestSessionKey`: `/hooks/agent` の呼び出し元とテンプレート駆動のマッピングセッションキーが `sessionKey` を設定することを許可します (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) 用の任意のプレフィックス許可リスト。例: `["hook:"]`。いずれかのマッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は必須になります。
- `deliver: true` は最終応答をチャンネルに送信します。`channel` のデフォルトは `last` です。
- `model` は、このフック実行の LLM を上書きします (モデルカタログが設定されている場合は許可されている必要があります)。

</Accordion>

### Gmail 連携

- 組み込みの Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- メッセージごとのルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するように制限してください。例: `["hook:", "hook:gmail:"]`。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化されたデフォルトの代わりに静的な `sessionKey` でプリセットを上書きしてください。

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

- 設定されている場合、Gateway は起動時に `gog gmail watch serve` を自動起動します。無効化するには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
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

- エージェントが編集可能な HTML/CSS/JS と A2UI を、Gateway ポート配下の HTTP で提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカルのみ: `gateway.bind: "loopback"` (デフォルト) を維持してください。
- 非 loopback バインド: canvas ルートには、他の Gateway HTTP サーフェスと同様に Gateway 認証 (トークン/パスワード/trusted-proxy) が必要です。
- Node WebViews は通常、認証ヘッダーを送信しません。ノードがペアリングされ接続された後、Gateway は canvas/A2UI アクセス用のノードスコープ付き capability URL を通知します。
- capability URL はアクティブなノード WS セッションにバインドされ、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
- 提供する HTML にライブリロードクライアントを注入します。
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
- `full`: `cliPath` + `sshPort` を含めます。LAN マルチキャスト広告には、同梱の `bonjour` Plugin が引き続き有効である必要があります。
- `off`: Plugin の有効化状態を変更せずに LAN マルチキャスト広告を抑制します。
- 同梱の `bonjour` Plugin は macOS ホストでは自動起動し、Linux、Windows、コンテナ化された Gateway デプロイではオプトインです。
- ホスト名は、有効な DNS ラベルである場合はシステムのホスト名がデフォルトになり、そうでない場合は `openclaw` にフォールバックします。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。
- `OPENCLAW_DISABLE_BONJOUR=1` は mDNS 広告を完全に無効化し、`discovery.mdns.mode` を上書きします。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。クロスネットワーク検出には、DNS サーバー (CoreDNS 推奨) + Tailscale 分割 DNS と組み合わせます。

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
- 欠落または空の変数は、設定の読み込み時にエラーをスローします。
- リテラルの `${VAR}` には `$${VAR}` でエスケープします。
- `$include` と連携します。

---

## シークレット

シークレット参照は追加的です。プレーンテキスト値も引き続き機能します。

### `SecretRef`

次の 1 つのオブジェクト形状を使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON ポインター (例: `"/providers/openai/apiKey"`)
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (AWS 形式の `secret#json_key` セレクターをサポート)
- `source: "exec"` の id には、スラッシュで区切られた `.` または `..` のパスセグメントを含めてはいけません (例: `a/../b` は拒否されます)

### サポートされる認証情報サーフェス

- 正規マトリックス: [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、サポートされている `openclaw.json` の認証情報パスを対象にします。
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
- `exec` プロバイダーには絶対 `command` パスが必要で、stdin/stdout でプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決後のターゲットパスを検証しながらシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、信頼済みディレクトリのチェックは解決後のターゲットパスに適用されます。
- `exec` 子環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- シークレット参照は有効化時にメモリ内スナップショットへ解決され、その後リクエストパスはスナップショットのみを読み取ります。
- 有効化中にアクティブサーフェスのフィルタリングが適用されます。有効なサーフェス上の未解決参照は起動/再読み込みを失敗させ、非アクティブなサーフェスは診断付きでスキップされます。

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
- `auth-profiles.json` は、静的認証情報モードで値レベルの参照（`api_key` には `keyRef`、`token` には `tokenRef`）をサポートします。
- `{ "provider": { "apiKey": "..." } }` のようなレガシーなフラット `auth-profiles.json` マップはランタイム形式ではありません。`openclaw doctor --fix` は、それらを正規の `provider:default` API キープロファイルへ書き換え、`.legacy-flat.*.bak` バックアップを作成します。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef による認証プロファイル認証情報をサポートしません。
- 静的ランタイム認証情報は、メモリ内で解決済みのスナップショットから取得されます。レガシーな静的 `auth.json` エントリは、検出時に削除されます。
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

- `billingBackoffHours`: 真の請求/クレジット不足エラーによってプロファイルが失敗した場合の、時間単位の基本バックオフ（デフォルト: `5`）。明示的な請求関連テキストは `401`/`403` レスポンス上でもここに分類される場合がありますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーの範囲に留まります（たとえば OpenRouter の `Key limit exceeded`）。再試行可能な HTTP `402` の使用枠、または組織/ワークスペースの利用上限メッセージは、代わりに `rate_limit` パスに留まります。
- `billingBackoffHoursByProvider`: 請求バックオフ時間の任意のプロバイダー別オーバーライド。
- `billingMaxHours`: 請求バックオフの指数関数的な増加に対する時間単位の上限（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼度の `auth_permanent` 失敗に対する、分単位の基本バックオフ（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加に対する分単位の上限（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用される時間単位のローリングウィンドウ（デフォルト: `24`）。
- `overloadedProfileRotations`: モデルフォールバックへ切り替える前の、過負荷エラーに対する同一プロバイダー認証プロファイルの最大ローテーション数（デフォルト: `1`）。`ModelNotReadyException` のようなプロバイダー混雑状態はここに分類されます。
- `overloadedBackoffMs`: 過負荷状態のプロバイダー/プロファイルローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: モデルフォールバックへ切り替える前の、レート制限エラーに対する同一プロバイダー認証プロファイルの最大ローテーション数（デフォルト: `1`）。このレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` のようなプロバイダー形式のテキストが含まれます。

---

## ログ

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
- `maxFileBytes`: ローテーション前のアクティブなログファイルの最大サイズ（バイト単位、正の整数、デフォルト: `104857600` = 100 MB）。OpenClaw はアクティブファイルの横に、番号付きアーカイブを最大 5 個保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対するベストエフォートのマスキング。`redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効にします。UI/ツール/診断の安全性サーフェスでは、送出前に引き続きシークレットが秘匿されます。

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
- `flags`: 対象ログ出力を有効にするフラグ文字列の配列（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: 長時間実行中の処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` と分類するための、進捗なし経過時間しきい値（ms 単位、デフォルト: `120000`）。返信、ツール、ステータス、ブロック、ACP 進捗はタイマーをリセットします。繰り返される `session.stuck` 診断は、変化がない間はバックオフします。
- `stuckSessionAbortMs`: 回復のために対象となる停滞中のアクティブ作業を中止ドレインできるようになるまでの、進捗なし経過時間しきい値（ms 単位）。未設定の場合、OpenClaw は少なくとも 5 分かつ `stuckSessionWarnMs` の 3 倍である、より安全な拡張埋め込み実行ウィンドウを使用します。
- `memoryPressureSnapshot`: メモリ圧力が `critical` に達したとき、秘匿済みの OOM 前安定性スナップショットを取得します（デフォルト: `false`）。通常のメモリ圧力イベントを維持しつつ、安定性バンドルファイルのスキャン/書き込みを追加するには `true` に設定します。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効にします（デフォルト: `false`）。完全な設定、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 任意のシグナル固有 OTLP エンドポイント。設定すると、そのシグナルについてのみ `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性用のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効にします。
- `otel.logsExporter`: ログエクスポート先: `"otlp"`（デフォルト）、stdout 行ごとに 1 つの JSON オブジェクトを出力する `"stdout"`、または `"both"`。
- `otel.sampleRate`: トレースサンプリング率 `0`-`1`。
- `otel.flushIntervalMs`: 定期テレメトリフラッシュ間隔（ms 単位）。
- `otel.captureContent`: OTEL スパン属性の生コンテンツ取得へのオプトイン。デフォルトはオフです。ブール値 `true` はシステム以外のメッセージ/ツールコンテンツを取得します。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt`、`toolDefinitions` を明示的に有効化できます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: `{gen_ai.operation.name} {gen_ai.request.model}` スパン名、`CLIENT` スパン種別、レガシー `gen_ai.system` の代わりの `gen_ai.provider.name` を含む、最新の実験的 GenAI 推論スパン形状のための環境トグル。デフォルトでは、互換性のためにスパンは `openclaw.model.call` と `gen_ai.system` を維持します。GenAI メトリクスは境界付きセマンティック属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: すでにグローバル OpenTelemetry SDK を登録しているホスト向けの環境トグル。この場合 OpenClaw は、診断リスナーをアクティブに保ちながら、Plugin 所有の SDK 起動/シャットダウンをスキップします。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 対応する設定キーが未設定の場合に使用される、シグナル固有のエンドポイント環境変数。
- `cacheTrace.enabled`: 埋め込み実行用のキャッシュトレーススナップショットをログに記録します（デフォルト: `false`）。
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

- `channel`: リリースチャンネル - `"stable"`、`"extended-stable"`、`"beta"`、または `"dev"`。extended-stable はパッケージ専用のフォアグラウンド/オンデマンドチャンネルです。起動時チェックとバックグラウンド自動更新ではスキップされます。
- `checkOnStart`: Gateway の起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: パッケージインストールのバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャンネルの自動適用前の最小遅延時間（時間単位、デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャンネルのロールアウト拡散ウィンドウの追加時間（時間単位、デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャンネルチェックの実行頻度（時間単位、デフォルト: `1`、最大: `24`）。

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

- `enabled`: グローバル ACP 機能ゲート（デフォルト: `true`。`false` に設定すると ACP ディスパッチと spawn アフォーダンスを非表示にする）。
- `dispatch.enabled`: ACP セッションターンのディスパッチ用の独立したゲート（デフォルト: `true`）。`false` に設定すると、ACP コマンドは利用可能なまま実行をブロックする。
- `backend`: デフォルトの ACP ランタイムバックエンド id（登録済みの ACP ランタイム Plugin と一致する必要がある）。
  先にバックエンド Plugin をインストールし、`plugins.allow` が設定されている場合は、バックエンド Plugin id（例: `acpx`）を含める。含めないと ACP バックエンドは読み込まれない。
- `fallbacks`: プライマリバックエンドが出力を生成する前に、一時的に見えるエラー（利用不可、レート制限、クォータ枯渇、過負荷）で早期に失敗した場合に試行される、フォールバック ACP バックエンド id の順序付きリスト。各エントリは登録済みの ACP ランタイム Plugin バックエンドと一致する必要がある。
- `defaultAgent`: spawn が明示的なターゲットを指定しない場合のフォールバック ACP ターゲットエージェント id。
- `allowedAgents`: ACP ランタイムセッションで許可されるエージェント id の許可リスト。空の場合は追加の制限なし。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストのアイドルフラッシュウィンドウ（ms）。
- `stream.maxChunkChars`: ストリーミングブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとに繰り返されるステータス/ツール行を抑制する（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は逐次ストリーミングする。`"final_only"` はターン終端イベントまでバッファする。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベント後の可視テキストの前に入れる区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影されるアシスタント出力文字の最大数。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベントに対するタグ名から boolean 可視性オーバーライドへのレコード。
- `runtime.ttlMinutes`: ACP セッションワーカーがクリーンアップ対象になるまでのアイドル TTL（分）。
- `runtime.installCommand`: ACP ランタイム環境のブートストラップ時に実行する任意のインストールコマンド。

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

- `cli.banner.taglineMode` はバナーのタグラインスタイルを制御する:
  - `"random"`（デフォルト）: 面白い/季節のタグラインをローテーションする。
  - `"default"`: 固定の中立的なタグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: タグラインテキストなし（バナータイトル/バージョンは引き続き表示）。
- バナー全体（タグラインだけでなく）を非表示にするには、env `OPENCLAW_HIDE_BANNER=1` を設定する。

---

## ウィザード

CLI のガイド付きセットアップフロー（`onboard`、`configure`、`doctor`）によって書き込まれるメタデータ:

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

[エージェントのデフォルト](/ja-JP/gateway/config-agents#agent-defaults) の `agents.list` ID フィールドを参照。

---

## ブリッジ（レガシー、削除済み）

現在のビルドには TCP ブリッジは含まれない。ノードは Gateway WebSocket 経由で接続する。`bridge.*` キーは config schema の一部ではなくなっている（削除されるまで検証は失敗する。`openclaw doctor --fix` で未知のキーを取り除ける）。

<Accordion title="レガシーブリッジ設定（履歴参照）">

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

- `sessionRetention`: 完了した分離 cron 実行セッションを `sessions.json` から刈り込むまで保持する期間。アーカイブ済みの削除された cron トランスクリプトのクリーンアップも制御する。デフォルト: `24h`。無効にするには `false` を設定する。
- `runLog.maxBytes`: 古いファイルベースの cron 実行ログとの互換性のために受け入れられる。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: ジョブごとに保持される最新の SQLite 実行履歴行数。デフォルト: `2000`。
- `webhookToken`: cron Webhook POST 配信（`delivery.mode = "webhook"`）に使用される bearer token。省略した場合、auth header は送信されない。
- `webhook`: `notify: true` がまだある保存済みジョブを移行するために `openclaw doctor --fix` が使用する、非推奨のレガシーフォールバック Webhook URL（http/https）。ランタイム配信は、ジョブごとの `delivery.mode="webhook"` と `delivery.to`、または announce 配信を保持する場合は `delivery.completionDestination` を使用する。

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

- `maxAttempts`: 一時的なエラー時の cron ジョブの最大再試行回数（デフォルト: `3`。範囲: `0`-`10`）。
- `backoffMs`: 各再試行ごとのバックオフ遅延（ms）の配列（デフォルト: `[30000, 60000, 300000]`。1-10 エントリ）。
- `retryOn`: 再試行をトリガーするエラー種別 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略するとすべての一時的な種別を再試行する。

ワンショットジョブは再試行が尽きるまで有効なままで、その後、最終エラー状態を保持したまま無効化される。繰り返しジョブは同じ一時的な再試行ポリシーを使用し、次のスケジュール枠の前にバックオフ後に再実行する。永続的エラー、または一時的な再試行の枯渇は、エラーバックオフ付きの通常の繰り返しスケジュールに戻る。

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

- `enabled`: cron ジョブの失敗アラートを有効にする（デフォルト: `false`）。
- `after`: アラートが発火するまでの連続失敗回数（正の整数、最小: `1`）。
- `cooldownMs`: 同じジョブに対する繰り返しアラート間の最小ミリ秒数（非負整数）。
- `includeSkipped`: 連続スキップ実行をアラートしきい値に数える（デフォルト: `false`）。スキップ実行は別個に追跡され、実行エラーのバックオフには影響しない。
- `mode`: 配信モード - `"announce"` はチャネルメッセージ経由で送信し、`"webhook"` は設定済み Webhook に投稿する。
- `accountId`: アラート配信のスコープにする任意のアカウントまたはチャネル id。

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
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータが存在する場合、デフォルトは `"announce"`。
- `channel`: announce 配信のチャネルオーバーライド。`"last"` は最後に認識された配信チャネルを再利用する。
- `to`: 明示的な announce ターゲットまたは Webhook URL。webhook モードでは必須。
- `accountId`: 配信用の任意のアカウントオーバーライド。
- ジョブごとの `delivery.failureDestination` はこのグローバルデフォルトをオーバーライドする。
- グローバルとジョブごとの失敗宛先のどちらも設定されていない場合、すでに `announce` 経由で配信しているジョブは、失敗時にそのプライマリ announce ターゲットへフォールバックする。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされる。

[Cron ジョブ](/ja-JP/automation/cron-jobs) を参照。分離 cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡される。

---

## メディアモデルテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完全な受信メッセージ本文                          |
| `{{RawBody}}`      | 生の本文（履歴/送信者ラッパーなし）               |
| `{{BodyStripped}}` | グループメンションを取り除いた本文                |
| `{{From}}`         | 送信者識別子                                      |
| `{{To}}`           | 宛先識別子                                        |
| `{{MessageSid}}`   | チャネルメッセージ id                             |
| `{{SessionId}}`    | 現在のセッション UUID                            |
| `{{IsNewSession}}` | 新しいセッションが作成された場合は `"true"`       |
| `{{MediaUrl}}`     | 受信メディア擬似 URL                              |
| `{{MediaPath}}`    | ローカルメディアパス                              |
| `{{MediaType}}`    | メディア種別（image/audio/document/…）            |
| `{{Transcript}}`   | 音声トランスクリプト                              |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディアプロンプト      |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数          |
| `{{ChatType}}`     | `"direct"` または `"group"`                       |
| `{{GroupSubject}}` | グループ件名（ベストエフォート）                  |
| `{{GroupMembers}}` | グループメンバープレビュー（ベストエフォート）    |
| `{{SenderName}}`   | 送信者表示名（ベストエフォート）                  |
| `{{SenderE164}}`   | 送信者電話番号（ベストエフォート）                |
| `{{Provider}}`     | Provider ヒント（whatsapp、telegram、discord など） |

---

## Config includes（`$include`）

config を複数ファイルに分割する:

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

- 単一ファイル: それを含むオブジェクトを置き換える。
- ファイルの配列: 順番に deep merge される（後のものが前のものをオーバーライド）。
- 兄弟キー: include の後にマージされる（include された値をオーバーライド）。
- ネストされた include: 最大 10 階層まで。
- パス: include するファイルからの相対パスとして解決されるが、トップレベル config ディレクトリ（`openclaw.json` の `dirname`）内に留まる必要がある。絶対パス/`../` 形式は、その境界内に解決される場合にのみ許可される。config ディレクトリ外の追加ルートを許可するには、`OPENCLAW_INCLUDE_ROOTS`（絶対パス）を設定する。
- 制限: パスに null バイトを含めることはできず、解決前後で厳密に 4096 文字未満である必要がある。各 include ファイルは 2 MB に制限される。
- 単一ファイル include によって裏付けられた 1 つのトップレベルセクションだけを変更する OpenClaw 所有の書き込みは、その include ファイルへ書き込まれる。たとえば、`plugins install` は `plugins.json5` 内の `plugins: { $include: "./plugins.json5" }` を更新し、`openclaw.json` はそのまま残す。
- ルート include、include 配列、兄弟オーバーライド付き include は、OpenClaw 所有の書き込みでは読み取り専用である。これらの書き込みは config をフラット化する代わりに fail closed する。
- エラー: ファイル欠落、parse errors、循環 include、無効なパス形式、過剰な長さについて明確なメッセージ。

---

## 関連

- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
- [Doctor](/ja-JP/gateway/doctor)
