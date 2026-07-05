---
read_when:
    - 正確なフィールドレベルの設定セマンティクスまたはデフォルト値が必要です
    - チャンネル、モデル、Gateway、またはツールの設定ブロックを検証している
summary: 'Gateway 設定リファレンス: OpenClaw コアキー、デフォルト、専用サブシステムリファレンスへのリンク'
title: 設定リファレンス
x-i18n:
    generated_at: "2026-07-05T11:23:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5b0b2024993778fdd1f390af8dc223b5aa1bc0fb42e8863f09280504f8697301
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` のフィールド単位のリファレンス: キー、デフォルト、より詳しいサブシステムページへのリンク。タスク指向のセットアップガイドについては、[構成](/ja-JP/gateway/configuration)を参照してください。チャンネルおよび Plugin が所有するコマンドカタログと、deep memory/QMD の詳細なノブはここではなく、それぞれのページにあります。

構成形式は **JSON5** です（コメント + 末尾カンマが許可されます）。すべてのフィールドは任意です。省略した場合、OpenClaw は安全なデフォルトを使用します。

コード上の真実がこのページに優先します:

- `openclaw config schema` は、検証と Control UI に使われるライブ JSON Schema を、バンドル済み/Plugin/チャンネルのメタデータをマージした状態で出力します。
- エージェントは、構成を編集する前に、正確なパススコープのスキーマノード 1 つについて `gateway` ツールアクション `config.schema.lookup` を呼び出す必要があります。
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、このドキュメントのベースラインハッシュを現在のスキーマサーフェスに照らして検証します。

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 構成については、[メモリ構成リファレンス](/ja-JP/reference/memory-config)。
- 現在の組み込み + バンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)。
- チャンネル固有のコマンドサーフェスについては、所有元のチャンネル/Plugin ページ。

---

## チャンネル

チャンネルごとの構成キーは [構成 - チャンネル](/ja-JP/gateway/config-channels) にあります: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他のバンドル済みチャンネル向けの `channels.*`（認証、アクセス制御、マルチアカウント、メンションゲーティング）。

## エージェントデフォルト、マルチエージェント、セッション、メッセージ

以下については [構成 - エージェント](/ja-JP/gateway/config-agents) を参照してください:

- `agents.defaults.*`（ワークスペース、モデル、thinking、Heartbeat、メモリ、メディア、Skills、サンドボックス）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションライフサイクル、Compaction、プルーニング）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk モード）
  - `talk.consultThinkingLevel`: Control UI Talk のリアルタイム相談の背後にある OpenClaw エージェント実行全体に対する thinking レベルの上書き
  - `talk.consultFastMode`: Control UI Talk のリアルタイム相談に対するワンショットの高速モード上書き
  - `talk.speechLocale`: iOS/macOS での Talk 音声認識用の任意の BCP 47 ロケール ID
  - `talk.silenceTimeoutMs`: 未設定の場合、Talk はトランスクリプトを送信する前にプラットフォームのデフォルト一時停止ウィンドウを維持します（`macOS と Android では 700 ms、iOS では 900 ms`）
  - `talk.realtime.consultRouting`: `openclaw_agent_consult` をスキップする確定済みリアルタイム Talk トランスクリプト向けの Gateway リレーフォールバック

## ツールとカスタムプロバイダー

ツールポリシー、実験的トグル、プロバイダーに裏付けられたツール構成、カスタムプロバイダー / ベース URL セットアップは、[構成 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools) にあります。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダーセットアップは、[構成 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls) にあります。
`models` ルートは、グローバルなモデルカタログ動作も所有します。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: プロバイダーカタログ動作（`merge` または `replace`）。
- `models.providers`: プロバイダー ID をキーにしたカスタムプロバイダーマップ。
- `models.providers.*.localService`: ローカルモデルサーバー用の任意のオンデマンドプロセスマネージャー。OpenClaw は構成されたヘルスエンドポイントをプローブし、必要に応じて絶対パスの `command` を起動し、準備完了を待ってからモデルリクエストを送信します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services) を参照してください。
- `models.pricing.enabled`: サイドカーとチャンネルが Gateway ready パスに到達した後に開始されるバックグラウンドの価格ブートストラップを制御します。`false` の場合、Gateway は OpenRouter と LiteLLM の価格カタログ取得をスキップします。構成済みの `models.providers.*.models[].cost` 値は、ローカルコスト見積もりでは引き続き機能します。

## MCP

OpenClaw 管理の MCP サーバー定義は `mcp.servers` 配下にあり、埋め込み OpenClaw とその他のランタイムアダプターによって消費されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、構成編集中にターゲットサーバーへ接続せずにこのブロックを管理します。

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

- `mcp.servers`: 構成済み MCP ツールを公開するランタイム向けの、名前付き stdio またはリモート MCP サーバー定義。
  リモートエントリは `transport: "streamable-http"` または `transport: "sse"` を使用します。
  `type: "http"` は CLI ネイティブのエイリアスで、`openclaw mcp set` と `openclaw doctor --fix` が標準の `transport` フィールドへ正規化します。
- `mcp.servers.<name>.enabled`: 保存済みサーバー定義を保持しつつ、埋め込み OpenClaw MCP discovery とツール投影から除外するには `false` に設定します。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: サーバーごとの MCP リクエストタイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: サーバーごとの接続タイムアウト（秒またはミリ秒）。
- `mcp.servers.<name>.supportsParallelToolCalls`: 並列 MCP ツール呼び出しを発行するかどうかを選択できるアダプター向けの任意の同時実行ヒント。
- `mcp.servers.<name>.auth`: OAuth を必要とする HTTP MCP サーバーには `"oauth"` を設定します。トークンを OpenClaw 状態配下に保存するには `openclaw mcp login <name>` を実行します。
- `mcp.servers.<name>.oauth`: 任意の OAuth スコープ、リダイレクト URL、クライアントメタデータ URL の上書き。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`: プライベートエンドポイントと相互 TLS 向けの HTTP TLS 制御。
- `mcp.servers.<name>.toolFilter`: サーバーごとの任意のツール選択。`include` は検出された MCP ツールを一致する名前に制限し、`exclude` は一致する名前を非表示にします。エントリは正確な MCP ツール名または単純な `*` glob です。リソースまたはプロンプトを持つサーバーは、ユーティリティツール名（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）も生成し、それらの名前にも同じフィルターが適用されます。
- `mcp.servers.<name>.codex`: 任意の Codex app-server 投影制御。このブロックは Codex app-server スレッド専用の OpenClaw メタデータです。ACP セッション、汎用 Codex ハーネス構成、その他のランタイムアダプターには影響しません。空でない `codex.agents` は、サーバーを列挙された OpenClaw エージェント ID に制限します。空、空白、または無効なスコープ付きエージェントリストは構成検証で拒否され、グローバルになる代わりにランタイム投影パスから省略されます。`codex.defaultToolsApprovalMode` は、そのサーバー向けに Codex ネイティブの `default_tools_approval_mode` を出力します。OpenClaw は、ネイティブ `mcp_servers` 構成を Codex に渡す前に `codex` ブロックを取り除きます。すべての Codex app-server エージェントに対して Codex のデフォルト MCP 承認動作でサーバーを投影し続けるには、このブロックを省略します。
- `mcp.sessionIdleTtlMs`: セッションスコープのバンドル済み MCP ランタイム向けのアイドル TTL。ワンショットの埋め込み実行は run-end クリーンアップを要求します。この TTL は、長寿命セッションと将来の呼び出し元に対するバックストップです。
- `mcp.*` 配下の変更は、キャッシュ済みセッション MCP ランタイムを破棄することでホット適用されます。次のツール discovery/use で新しい構成から再作成されるため、削除された `mcp.servers` エントリはアイドル TTL を待たずに即座に回収されます。
- ランタイム discovery は、該当セッションのキャッシュ済みカタログを破棄することで、MCP ツールリスト変更通知にも対応します。リソースまたはプロンプトを宣伝するサーバーには、リソースの一覧表示/読み取りと、プロンプトの一覧表示/取得のためのユーティリティツールが追加されます。ツール呼び出しの失敗が繰り返されると、別の呼び出しが試行される前に、影響を受けたサーバーが短時間一時停止されます。

ランタイム動作については [MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry) と
[CLI バックエンド](/ja-JP/gateway/cli-backends#bundle-mcp-overlays) を参照してください。

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

- `allowBundled`: バンドル済み Skills のみを対象とする任意の許可リスト（管理対象/ワークスペース Skills には影響しません）。
- `load.extraDirs`: 追加の共有 Skill ルート（最低優先度）。
- `load.allowSymlinkTargets`: Skill シンボリックリンクが構成済みソースルートの外にある場合に、解決先として許可される信頼済みの実ターゲットルート。
- `workshop.allowSymlinkTargetWrites`: すでに信頼済みのシンボリックリンクターゲットを通じて Skill Workshop apply が書き込むことを許可します（デフォルト: false）。
- `install.preferBrew`: true の場合、`brew` が利用可能なら他のインストーラー種別にフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` 仕様向けの Node インストーラー設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`: 信頼済みの `operator.admin` Gateway クライアントが、`skills.upload.*` 経由でステージングされたプライベート zip アーカイブをインストールできるようにします（デフォルト: false）。これはアップロード済みアーカイブパスのみを有効化します。通常の ClawHub インストールには不要です。
- `entries.<skillKey>.enabled: false` は、バンドル済み/インストール済みであっても Skill を無効化します。
- `entries.<skillKey>.apiKey`: プライマリ環境変数を宣言する Skills 向けの便利設定（平文文字列または SecretRef オブジェクト）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`: Skill discovery とモデル向け Skills プロンプトに上限を設定します。
- Skill Workshop の自律性/承認設定（`workshop.autonomous.enabled`、`workshop.approvalPolicy`、`workshop.maxPending`、`workshop.maxSkillBytes`）は [Skills 構成](/ja-JP/tools/skills-config) に記載されています。

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

- `~/.openclaw/extensions` と `<workspace>/.openclaw/extensions` 配下のパッケージまたはバンドルディレクトリ、および `plugins.load.paths` に列挙されたファイルまたはディレクトリから読み込まれます。
- スタンドアロンの Plugin ファイルは `plugins.load.paths` に配置してください。自動検出される拡張ルートはトップレベルの `.js`、`.mjs`、`.ts` ファイルを無視するため、それらのルート内のヘルパースクリプトが起動を妨げることはありません。
- 検出はネイティブ OpenClaw Plugin に加え、互換性のある Codex バンドルと Claude バンドルを受け入れます。マニフェストなしの Claude デフォルトレイアウトバンドルも含まれます。
- **設定変更には Gateway の再起動が必要です。**
- `allow`: 任意の許可リストです（列挙された Plugin のみ読み込まれます）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: Plugin レベルの API キー簡易フィールドです（Plugin が対応している場合）。
- `plugins.entries.<id>.env`: Plugin スコープの環境変数マップです。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視します。一方で、レガシー `modelOverride` と `providerOverride` は保持します。ネイティブ Plugin フックと、対応するバンドル提供のフックディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼済みの非バンドル Plugin は、`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end` などの型付きフックから生の会話内容を読み取れます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この Plugin が、バックグラウンドサブエージェント実行ごとの `provider` と `model` の上書きを要求できるように明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼済みサブエージェント上書き向けの正規 `provider/model` ターゲットの任意の許可リストです。任意のモデルを許可する意図がある場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowModelOverride`: この Plugin が `api.runtime.llm.complete` のモデル上書きを要求できるように明示的に信頼します。
- `plugins.entries.<id>.llm.allowedModels`: 信頼済み Plugin の LLM completion 上書き向けの正規 `provider/model` ターゲットの任意の許可リストです。任意のモデルを許可する意図がある場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.llm.allowAgentIdOverride`: この Plugin がデフォルト以外のエージェント ID に対して `api.runtime.llm.complete` を実行できるように明示的に信頼します。
- `plugins.entries.<id>.config`: Plugin 定義の設定オブジェクトです（利用可能な場合、ネイティブ OpenClaw Plugin スキーマで検証されます）。
- チャネル Plugin のアカウント/ランタイム設定は `channels.<id>` 配下にあり、中央の OpenClaw オプションレジストリではなく、所有する Plugin のマニフェスト `channelConfigs` メタデータで説明されるべきです。

### Codex ハーネス Plugin 設定

バンドルされた `codex` Plugin は、ネイティブ Codex アプリサーバーハーネス設定を
`plugins.entries.codex.config` 配下で所有します。完全な設定
サーフェスについては [Codex ハーネスリファレンス](/ja-JP/plugins/codex-harness-reference) を、ランタイムモデルについては [Codex ハーネス](/ja-JP/plugins/codex-harness) を参照してください。

`codexPlugins` は、ネイティブ Codex ハーネスを選択するセッションにのみ適用されます。
OpenClaw provider 実行、ACP 会話バインディング、または Codex 以外のハーネスで Codex Plugin を有効化するものではありません。

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

- `plugins.entries.codex.config.codexPlugins.enabled`: Codex ハーネス向けにネイティブ Codex
  Plugin/アプリ対応を有効化します。デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  移行された Plugin アプリ elicitations のデフォルト破壊的操作ポリシーです。
  安全な Codex 承認スキーマをプロンプトなしで受け入れるには `true`、拒否するには `false`、
  Codex が必要とする承認を OpenClaw Plugin 承認経由にルーティングするには `"auto"`、
  永続承認なしで Plugin の書き込み/破壊的操作ごとにプロンプトするには `"ask"` を使用します。
  `"ask"` モードは、影響を受けるアプリについて永続的な Codex
  ツールごとの承認上書きをクリアし、Codex スレッド開始前にそのアプリの人間の
  承認レビュアーを選択します。
  デフォルト: `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: グローバルな `codexPlugins.enabled` も true の場合に、
  移行された Plugin エントリを有効化します。
  デフォルト: 明示エントリでは `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  安定した marketplace identity です。V1 は `"openai-curated"` のみ対応します。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: 移行元の安定した
  Codex Plugin identity です。例: `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  Plugin ごとの破壊的操作上書きです。省略した場合は、グローバルな
  `allow_destructive_actions` 値が使用されます。Plugin ごとの値は、同じ
  `true`、`false`、`"auto"`、`"ask"` ポリシーを受け入れます。

`"ask"` を使用する許可済み Plugin アプリごとに、そのアプリの承認リクエストは
人間のレビュアーへルーティングされます。他のアプリおよびアプリ以外のスレッド承認は、
設定済みのレビュアーを維持するため、混在した Plugin ポリシーが `"ask"` の挙動を継承することはありません。

`codexPlugins.enabled` はグローバルな有効化ディレクティブです。移行によって書き込まれた明示的な Plugin
エントリは、永続的なインストールおよび修復適格性セットです。
`plugins["*"]` は対応しておらず、`install` スイッチはありません。また、ローカルの
`marketplacePath` 値はホスト固有であるため、意図的に設定フィールドにはしていません。

`app/list` readiness チェックは 1 時間キャッシュされ、古くなると
非同期に更新されます。Codex スレッドアプリ設定は、ターンごとではなく Codex ハーネス
セッション確立時に計算されます。ネイティブ Plugin 設定を変更した後は、`/new`、`/reset`、または Gateway
再起動を使用してください。

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider 設定です。
  - `apiKey`: 上限引き上げ用の任意の Firecrawl API キーです（SecretRef を受け入れます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、レガシー `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数にフォールバックします。
  - `baseUrl`: Firecrawl API ベース URL です（デフォルト: `https://api.firecrawl.dev`。セルフホストの上書きはプライベート/内部エンドポイントを対象にする必要があります）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: ミリ秒単位の最大キャッシュ期間です（デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプリクエストのタイムアウト秒数です（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定です。
  - `enabled`: X Search provider を有効化します。
  - `model`: 検索に使用する Grok モデルです（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory dreaming 設定です。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: マスター dreaming スイッチです（デフォルト `false`）。
  - `frequency`: dreaming 全体スイープごとの cron cadence です（デフォルトは `"0 3 * * *"`）。
  - `model`: 任意の Dream Diary サブエージェントモデル上書きです。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。ターゲットを制限するには `allowedModels` と組み合わせてください。モデル利用不可エラーはセッションのデフォルトモデルで 1 回再試行されます。信頼または許可リストの失敗は黙ってフォールバックしません。
  - フェーズポリシーとしきい値は実装詳細です（ユーザー向け設定キーではありません）。
- 完全な memory 設定は [Memory 設定リファレンス](/ja-JP/reference/memory-config) にあります。
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化された Claude バンドル Plugin は、`settings.json` から埋め込み OpenClaw デフォルトを提供することもできます。OpenClaw はそれらを生の OpenClaw 設定パッチとしてではなく、サニタイズ済みエージェント設定として適用します。
- `plugins.slots.memory`: アクティブな memory Plugin ID を選択します。memory Plugin を無効化するには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブな context engine Plugin ID を選択します。別の engine をインストールして選択しない限り、デフォルトは `"legacy"` です。

[Plugins](/ja-JP/tools/plugin) を参照してください。

---

## Commitments

`commitments` は推論されたフォローアップ memory を制御します。OpenClaw は会話ターンからチェックインを検出し、それらを Heartbeat 実行を通じて配信できます。

- `commitments.enabled`: 推論されたフォローアップ commitments の hidden LLM 抽出、保存、Heartbeat 配信を有効化します。デフォルト: `false`。
- `commitments.maxPerDay`: ローリング 1 日あたり、エージェントセッションごとに配信される推論フォローアップ commitments の最大数です。デフォルト: `3`。

[推論 commitments](/ja-JP/concepts/commitments) を参照してください。

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
- `tabCleanup` は、アイドル時間後、またはセッションが上限を超えたときに、追跡対象のプライマリエージェントタブを回収します。個別のクリーンアップモードを無効にするには、`idleMinutes: 0` または `maxTabsPerSession: 0` を設定します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時には無効になるため、ブラウザナビゲーションはデフォルトで厳格なままです。
- プライベートネットワークのブラウザナビゲーションを意図的に信頼する場合にのみ、`ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定します。
- 厳格モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）は、到達性/探索チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはアタッチ専用です（開始/停止/リセットは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  OpenClaw に `/json/version` を探索させたい場合は HTTP(S) を使用し、プロバイダーが直接の DevTools WebSocket URL を提供する場合は WS(S) を使用します。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび
  `attachOnly` CDP の到達性に加えて、タブを開くリクエストに適用されます。マネージドループバック
  プロファイルはローカル CDP のデフォルトを維持します。
- 外部管理の CDP サービスがループバック経由で到達可能な場合は、そのプロファイルの
  `attachOnly: true` を設定します。それ以外の場合、OpenClaw はループバックポートを
  ローカル管理ブラウザプロファイルとして扱い、ローカルポート所有権エラーを報告することがあります。
- `existing-session` プロファイルは CDP の代わりに Chrome MCP を使用し、選択したホストまたは接続済みブラウザノード経由でアタッチできます。
- `existing-session` プロファイルでは、Brave や Edge などの特定の
  Chromium ベースのブラウザプロファイルを対象にするために `userDataDir` を設定できます。
- Chrome がすでに DevTools HTTP(S) 探索エンドポイントまたは直接 WS(S) エンドポイントの背後で実行されている場合、`existing-session` プロファイルでは `cdpUrl` を設定できます。そのモードでは、OpenClaw は自動接続を使用する代わりにエンドポイントを Chrome MCP に渡します。
  Chrome MCP の起動引数では `userDataDir` は無視されます。
- `existing-session` プロファイルは、現在の Chrome MCP ルート制限を維持します。
  CSS セレクターターゲット指定の代わりにスナップショット/ref 駆動のアクション、1ファイルアップロード
  フック、ダイアログタイムアウト上書きなし、`wait --load networkidle` なし、
  `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなしです。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。
  リモート CDP プロファイルまたは existing-session エンドポイントアタッチの場合にのみ、`cdpUrl` を明示的に設定します。
- ローカル管理プロファイルでは、そのプロファイルについてグローバルな
  `browser.executablePath` を上書きするために `executablePath` を設定できます。これを使用すると、あるプロファイルを
  Chrome で、別のプロファイルを Brave で実行できます。
- ローカル管理プロファイルでは、プロセス開始後の Chrome CDP HTTP
  探索に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP websocket 準備完了に
  `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に起動するものの準備完了チェックが起動処理と競合する低速なホストでは、これらを引き上げます。両方の値は `120000` ms までの正の整数でなければならず、無効な設定値は拒否されます。
- 自動検出順序: Chromium ベースの場合はデフォルトブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、
  Chromium 起動前に OS のホームディレクトリとして `~` と `~/...` を受け付けます。
  `existing-session` プロファイルのプロファイルごとの `userDataDir` もチルダ展開されます。
- コントロールサービス: ループバックのみ（ポートは `gateway.port` から導出、デフォルトは `18791`）。
- `extraArgs` はローカル Chromium の起動に追加の起動フラグを付加します（例:
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

<Accordion title="Gateway field details">

- `mode`: `local` (Gateway を実行) または `remote` (リモート Gateway に接続)。`local` でない限り、Gateway は起動を拒否します。
- `port`: WS + HTTP 用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IP のみ)、または `custom`。
- **レガシー bind エイリアス**: `gateway.bind` ではホストエイリアス (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`) ではなく、bind モード値 (`auto`、`loopback`、`lan`、`tailnet`、`custom`) を使用します。
- **Docker 注記**: デフォルトの `loopback` bind はコンテナ内の `127.0.0.1` でリッスンします。Docker ブリッジネットワーク (`-p 18789:18789`) では、トラフィックは `eth0` に到着するため、Gateway に到達できません。すべてのインターフェイスでリッスンするには、`--network host` を使用するか、`bind: "lan"` (または `customBindHost: "0.0.0.0"` と併せて `bind: "custom"`) を設定します。
- **認証**: デフォルトで必須です。非 loopback bind では Gateway 認証が必要です。実際には、共有トークン/パスワード、または `gateway.auth.mode: "trusted-proxy"` を指定した ID 対応リバースプロキシを意味します。オンボーディングウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合 (SecretRefs を含む)、`gateway.auth.mode` を明示的に `token` または `password` に設定します。両方が設定されていて mode が未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモード。信頼できる local loopback セットアップにのみ使用してください。これは意図的にオンボーディングプロンプトでは提示されません。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザ/ユーザー認証を ID 対応リバースプロキシに委譲し、`gateway.trustedProxies` からの ID ヘッダーを信頼します ([Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照)。このモードはデフォルトで **非 loopback** プロキシソースを想定します。同一ホストの loopback リバースプロキシでは、明示的に `gateway.auth.trustedProxy.allowLoopback = true` が必要です。内部の同一ホスト呼び出し元は、ローカル直接フォールバックとして `gateway.auth.password` を使用できます。`gateway.auth.token` は trusted-proxy モードと引き続き相互排他的です。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve の ID ヘッダーで Control UI/WebSocket 認証を満たせます (`tailscale whois` で検証)。HTTP API エンドポイントはその Tailscale ヘッダー認証を**使用しません**。代わりに Gateway の通常の HTTP 認証モードに従います。このトークンレスフローは、Gateway ホストが信頼されていることを前提とします。`tailscale.mode = "serve"` の場合、デフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアント IP ごと、かつ認証スコープごとに適用されます (shared-secret と device-token は個別に追跡されます)。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, clientIp}` の失敗試行は失敗書き込みの前に直列化されます。そのため、同じクライアントからの並行した不正な試行は、どちらも単なる不一致として競合して通過するのではなく、2 つ目のリクエストでリミッターに到達する可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックも意図的にレート制限したい場合 (テストセットアップや厳格なプロキシデプロイなど) は `false` に設定します。
- ブラウザオリジンの WS 認証試行は、loopback 免除を無効にした状態で常にスロットリングされます (ブラウザベースの localhost ブルートフォースに対する多層防御)。
- loopback では、それらのブラウザオリジンのロックアウトは正規化された `Origin`
  値ごとに分離されるため、ある localhost オリジンからの失敗の繰り返しが、別のオリジンを自動的に
  ロックアウトすることはありません。
- `tailscale.mode`: `serve` (tailnet のみ、loopback bind) または `funnel` (公開、認証が必要)。
- `tailscale.serviceName`: Serve モード用の任意の Tailscale Service 名。たとえば
  `svc:openclaw`。設定すると、OpenClaw はそれを `tailscale serve
--service` に渡し、Control UI をデバイスホスト名ではなく名前付き Service 経由で公開できるようにします。
  値は Tailscale の `svc:<dns-label>`
  Service 名形式を使用する必要があります。起動時には派生した Service URL が報告されます。
- `tailscale.preserveFunnel`: `true` かつ `tailscale.mode = "serve"` の場合、OpenClaw は
  起動時に Serve を再適用する前に `tailscale funnel status` を確認し、外部で設定済みの Funnel ルートが Gateway ポートをすでにカバーしている場合は
  スキップします。
  デフォルトは `false`。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的なブラウザオリジン許可リスト。公開の非 loopback ブラウザオリジンでは必須です。loopback、RFC1918/link-local、`.local`、`.ts.net`、または Tailscale CGNAT ホストから読み込まれるプライベートな same-origin LAN/Tailnet UI は、Host ヘッダーフォールバックを有効にしなくても受け入れられます。
- `controlUi.chatMessageMaxWidth`: グループ化された Control UI チャットメッセージ用の任意の max-width。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)` など、制約付き CSS 幅値を受け付けます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダーオリジンポリシーに意図的に依存するデプロイで、Host ヘッダーオリジンフォールバックを有効にする危険なモード。
- `terminal.enabled`: 管理者スコープのオペレーターターミナルをオプトインします。デフォルト: `false`。ターミナルは選択されたエージェントワークスペースでホスト PTY を起動し、Gateway プロセス環境を継承します。また、`sandbox.mode: "all"` のエージェントでは拒否されます。信頼できるオペレーターデプロイでのみ有効にしてください。変更すると Gateway が再起動され、Control UI のコンテンツセキュリティポリシーが更新されます。
- `terminal.shell`: 任意のシェル実行ファイル。未設定の場合、OpenClaw は Unix では `$SHELL`、Windows では `%ComSpec%` を使用します。
- `terminal.detachedSessionTimeoutSeconds`: 接続が切断された後 (ページ再読み込み、ノート PC のスリープ)、ターミナルセッションがどのくらい存続し、最近の出力を再生して `terminal.attach` で再アタッチ可能な状態を保つか。デフォルト: `300`。接続が切断された瞬間にセッションを終了するには `0` を設定します。デタッチされたセッションはコマンドを実行し続けるため、共有ホストまたは公開ホストではこれを短くしてください。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。`direct` では、公開ホストの場合 `remote.url` は `wss://` である必要があります。平文の `ws://` は、loopback、LAN、link-local、`.local`、`.ts.net`、および Tailscale CGNAT ホストでのみ受け入れられます。
- `remote.remotePort`: リモート SSH ホスト上の Gateway ポート。デフォルトは `18789` です。ローカルトンネルポートがリモート Gateway ポートと異なる場合に使用します。
- `remote.sshHostKeyPolicy`: macOS SSH トンネルのホストキー ポリシー。`strict` がデフォルトで、すでに信頼されたキーが必要です。`openssh` は、管理対象エイリアス向けの有効な OpenSSH 設定への明示的なオプトインです。使用する前に、一致するユーザーおよびシステム SSH 設定を確認してください。macOS アプリと `configure-remote` は、明示的に再度オプトインしない限り、ターゲット変更時にこのポリシーを `strict` にリセットします。
- `gateway.remote.token` / `.password` はリモートクライアントの認証情報フィールドです。それ自体では Gateway 認証を設定しません。
- `gateway.push.apns.relay.baseUrl`: リレーバック iOS ビルドが登録を Gateway に公開した後に使用される外部 APNs リレーのベース HTTPS URL。公開 App Store ビルドはホストされた OpenClaw リレーを使用します。カスタムリレー URL は、そのリレーを指すリレー URL を持つ、意図的に別個の iOS ビルド/デプロイパスと一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gateway からリレーへの送信タイムアウト (ミリ秒)。デフォルトは `10000`。
- リレーバック登録は特定の Gateway ID に委譲されます。ペアリングされた iOS アプリは `gateway.identity.get` を取得し、その ID をリレー登録に含め、登録スコープの送信許可を Gateway に転送します。別の Gateway は、その保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記リレー設定の一時的な環境変数オーバーライド。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP リレー URL 用の開発専用の回避ハッチ。本番リレー URL は HTTPS のままにする必要があります。
- `gateway.handshakeTimeoutMs`: 認証前の Gateway WebSocket ハンドシェイクタイムアウト (ミリ秒)。デフォルト: `15000`。`OPENCLAW_HANDSHAKE_TIMEOUT_MS` が設定されている場合は優先されます。ローカルクライアントが接続できる一方で起動ウォームアップがまだ落ち着いていない、高負荷または低性能のホストではこれを増やしてください。
- `gateway.channelHealthCheckMinutes`: チャネルヘルスモニター間隔 (分)。ヘルスモニターによる再起動をグローバルに無効にするには `0` を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: 古いソケットのしきい値 (分)。これは `gateway.channelHealthCheckMinutes` 以上に保ってください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング 1 時間あたりのチャネル/アカウントごとのヘルスモニター再起動の最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターは有効のまま、チャネルごとにヘルスモニター再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 複数アカウントチャネル向けのアカウントごとのオーバーライド。設定されている場合、チャネルレベルのオーバーライドより優先されます。
- ローカル Gateway 呼び出しパスは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決されない場合、解決は fail-closed になります (リモートフォールバックによるマスクなし)。
- `trustedProxies`: TLS を終端する、または転送クライアントヘッダーを注入するリバースプロキシ IP。自分が管理するプロキシのみを列挙してください。loopback エントリは、同一ホストのプロキシ/ローカル検出セットアップ (たとえば Tailscale Serve やローカルリバースプロキシ) では引き続き有効ですが、loopback リクエストを `gateway.auth.mode: "trusted-proxy"` の対象にするものでは**ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに Gateway は `X-Real-IP` を受け入れます。fail-closed 動作のため、デフォルトは `false` です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求されたスコープがない初回ノードデバイスペアリングを自動承認するための任意の CIDR/IP 許可リスト。未設定の場合は無効です。これはオペレーター/ブラウザ/Control UI/WebChat ペアリングを自動承認せず、ロール、スコープ、メタデータ、公開鍵のアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングおよびプラットフォーム許可リスト評価後に、宣言されたノードコマンドに適用されるグローバルな許可/拒否の調整。`camera.snap`、`camera.clip`、`screen.record` などの危険なノードコマンドにオプトインするには `allowCommands` を使用します。`denyCommands` は、プラットフォームデフォルトまたは明示的な許可に含まれる場合でもコマンドを削除します。ノードが宣言済みコマンドリストを変更した後は、そのデバイスペアリングを拒否して再承認し、Gateway が更新されたコマンドスナップショットを保存するようにします。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` でブロックされる追加のツール名 (デフォルト拒否リストを拡張)。
- `gateway.tools.allow`: オーナー/管理者呼び出し元について、デフォルトの HTTP 拒否リストからツール名を削除します。
  これは、ID を持つ `operator.write`
  呼び出し元をオーナー/管理者アクセスに昇格させるものではありません。`cron`、`gateway`、`nodes` は許可リストに含めても
  非オーナー呼び出し元には引き続き利用できません。

</Accordion>

### OpenAI 互換エンドポイント

- 管理者 HTTP RPC: `admin-http-rpc` Plugin としてデフォルトでオフです。Plugin を有効にすると `POST /api/v1/admin/rpc` が登録されます。[Admin HTTP RPC](/ja-JP/plugins/admin-http-rpc) を参照してください。
- Chat Completions: デフォルトで無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL 入力の堅牢化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の許可リストは未設定として扱われます。URL 取得を無効にするには `gateway.http.endpoints.responses.files.allowUrl=false`
    や `gateway.http.endpoints.responses.images.allowUrl=false` を使用します。
- 任意のレスポンス堅牢化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (自分が管理する HTTPS オリジンにのみ設定してください。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### 複数インスタンスの分離

一意のポートと状態ディレクトリを使って、1 台のホスト上で複数の Gateway を実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利フラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

[複数の Gateway](/ja-JP/gateway/multiple-gateways)を参照してください。

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
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカルの自己署名証明書/キーのペアを自動生成します。ローカル/開発用途専用です。
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
- `debounceMs`: 設定変更を適用する前のデバウンス期間 (ms) (非負整数、デフォルト: `300`)。
- `deferralTimeoutMs`: 再起動またはチャンネルのホットリロードを強制する前に、処理中の操作を待機する任意の最大時間 (ms)。省略するとデフォルトの上限付き待機 (`300000`) を使用します。`0` を設定すると無期限に待機し、未完了の警告を定期的にログに記録します。

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

検証と安全性に関するメモ:

- `hooks.enabled=true` には空でない `hooks.token` が必要です。
- `hooks.token` は、アクティブな Gateway 共有シークレット認証 (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) とは別にする必要があります。再利用を検出すると、起動時に致命的でないセキュリティ警告がログに記録されます。
- `openclaw security audit` は、監査時にのみ指定された Gateway パスワード認証 (`--auth password --password <password>`) を含め、フック/Gateway 認証の再利用を重大な検出事項として報告します。永続化された再利用済み `hooks.token` をローテーションするには `openclaw doctor --fix` を実行し、その後外部フック送信元を新しいフックトークンを使用するよう更新してください。
- `hooks.path` を `/` にすることはできません。`/hooks` などの専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください (例: `["hook:"]`)。
- マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的マッピングキーではこのオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け付けられます (デフォルト: `false`)。
- `POST /hooks/<name>` → `hooks.mappings` 経由で解決されます
  - テンプレートでレンダリングされたマッピングの `sessionKey` 値は、外部から指定されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="マッピングの詳細">

- `match.path` は `/hooks` の後のサブパスに一致します (例: `/hooks/gmail` → `gmail`)。
- `match.source` は汎用パスのペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` はフックアクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` 内に留まります (絶対パスとトラバーサルは拒否されます)。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` 配下に置いてください。ワークスペースの Skills ディレクトリは拒否されます。`openclaw doctor` がこのパスを無効として報告した場合は、変換モジュールをフック変換ディレクトリに移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントへルーティングします。不明な ID はデフォルトエージェントにフォールバックします。
- `allowedAgentIds`: 有効なエージェントルーティングを制限します。`agentId` が省略された場合のデフォルトエージェントパスも含みます (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: 明示的な `sessionKey` がないフックエージェント実行用の任意の固定セッションキー。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元とテンプレート駆動のマッピングセッションキーが `sessionKey` を設定できるようにします (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) に対する任意のプレフィックス許可リスト。例: `["hook:"]`。マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は必須になります。
- `deliver: true` は最終返信をチャンネルに送信します。`channel` のデフォルトは `last` です。
- `model` はこのフック実行の LLM を上書きします (モデルカタログが設定されている場合は許可されている必要があります)。

</Accordion>

### Gmail 連携

- 組み込みの Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- そのメッセージ単位のルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するよう制限してください。例: `["hook:", "hook:gmail:"]`。
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

- Gateway ポート配下の HTTP で、エージェントが編集可能な HTML/CSS/JS と A2UI を提供します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"` (デフォルト) のままにしてください。
- 非 loopback バインド: canvas ルートには、他の Gateway HTTP サーフェスと同様に Gateway 認証 (トークン/パスワード/信頼済みプロキシ) が必要です。
- Node WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされ接続されると、Gateway は canvas/A2UI アクセス用のノードスコープのケイパビリティ URL を通知します。
- ケイパビリティ URL はアクティブなノード WS セッションにバインドされ、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
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

- `minimal` (デフォルト): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。LAN マルチキャスト広告には、同梱の `bonjour` plugin が有効になっている必要があります。
- `off`: plugin の有効化状態を変更せずに、LAN マルチキャスト広告を抑制します。
- 同梱の `bonjour` plugin は macOS ホストでは自動起動し、Linux、Windows、コンテナ化された Gateway デプロイではオプトインです。
- ホスト名は、有効な DNS ラベルの場合はシステムのホスト名がデフォルトになり、それ以外は `openclaw` にフォールバックします。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。
- `OPENCLAW_DISABLE_BONJOUR=1` は mDNS 広告を完全に無効化し、`discovery.mdns.mode` を上書きします。

### ワイドエリア (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。クロスネットワーク検出には、DNS サーバー (CoreDNS 推奨) + Tailscale split DNS と組み合わせます。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env` (インライン env vars)

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

- インライン env vars は、プロセス env にそのキーがない場合にのみ適用されます。
- `.env` ファイル: CWD の `.env` + `~/.openclaw/.env` (どちらも既存の vars を上書きしません)。
- `shellEnv`: ログインシェルプロファイルから、不足している想定キーをインポートします。
- 完全な優先順位については [環境](/ja-JP/help/environment) を参照してください。

### Env var 置換

任意の設定文字列で `${VAR_NAME}` を使って env vars を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字の名前のみです: `[A-Z_][A-Z0-9_]*`。
- 欠落または空の vars は、設定読み込み時にエラーを投げます。
- リテラルの `${VAR}` には `$${VAR}` でエスケープします。
- `$include` と併用できます。

---

## シークレット

Secret refs は追加的です。プレーンテキスト値も引き続き機能します。

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
- `source: "exec"` の ids には、スラッシュ区切りのパスセグメントとして `.` または `..` を含めてはいけません (例: `a/../b` は拒否されます)

### サポートされる認証情報サーフェス

- 正規マトリクス: [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、サポートされる `openclaw.json` 認証情報パスを対象にします。
- `auth-profiles.json` refs は、ランタイム解決と監査カバレッジに含まれます。

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

注:

- `file` provider は `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue モードでは `id` は `"value"` である必要があります）。
- Windows ACL 検証を利用できない場合、file provider と exec provider のパスはフェイルクローズします。検証できない信頼済みパスに対してのみ `allowInsecurePath: true` を設定してください。
- `exec` provider には絶対 `command` パスが必要で、stdin/stdout 上でプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決済みターゲットパスを検証しながらシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定します。
- `trustedDirs` が設定されている場合、信頼済みディレクトリのチェックは解決済みターゲットパスに適用されます。
- `exec` の子環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- Secret refs はアクティベーション時にメモリ内スナップショットへ解決され、その後リクエストパスはスナップショットのみを読み取ります。
- アクティブサーフェスのフィルタリングはアクティベーション中に適用されます。有効なサーフェス上の未解決 refs は起動/再読み込みを失敗させ、非アクティブなサーフェスは診断付きでスキップされます。

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
- `auth-profiles.json` は、静的認証情報モードで値レベルの refs（`api_key` には `keyRef`、`token` には `tokenRef`）をサポートします。
- `{ "provider": { "apiKey": "..." } }` のようなレガシーなフラット `auth-profiles.json` マップはランタイム形式ではありません。`openclaw doctor --fix` はそれらを正規の `provider:default` API キープロファイルに書き換え、`.legacy-flat.*.bak` バックアップを作成します。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef による auth-profile 認証情報をサポートしません。
- 静的ランタイム認証情報は、メモリ内の解決済みスナップショットから取得されます。レガシーな静的 `auth.json` エントリは検出時に除去されます。
- レガシー OAuth は `~/.openclaw/credentials/oauth.json` からインポートされます。
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

- `billingBackoffHours`: 実際の請求/クレジット不足エラーによりプロファイルが失敗した場合の基本バックオフ時間（時間単位、デフォルト: `5`）。明示的な請求関連テキストは `401`/`403` レスポンスでもここに分類される場合がありますが、provider 固有のテキストマッチャーは、それを所有する provider にスコープされたままです（例: OpenRouter の `Key limit exceeded`）。再試行可能な HTTP `402` の使用量ウィンドウまたは組織/ワークスペースの使用額制限メッセージは、代わりに `rate_limit` パスに残ります。
- `billingBackoffHoursByProvider`: 請求バックオフ時間の provider ごとの任意のオーバーライド。
- `billingMaxHours`: 請求バックオフの指数的増加の上限時間（時間単位、デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 確度の高い `auth_permanent` 失敗に対する基本バックオフ時間（分単位、デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加の上限時間（分単位、デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用されるローリングウィンドウ（時間単位、デフォルト: `24`）。
- `overloadedProfileRotations`: モデルフォールバックへ切り替える前の、過負荷エラーに対する同一 provider 内 auth-profile ローテーションの最大数（デフォルト: `1`）。`ModelNotReadyException` などの provider ビジー形状はここに分類されます。
- `overloadedBackoffMs`: 過負荷の provider/profile ローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: モデルフォールバックへ切り替える前の、レート制限エラーに対する同一 provider 内 auth-profile ローテーションの最大数（デフォルト: `1`）。このレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` などの provider 形式のテキストが含まれます。

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
- `maxFileBytes`: ローテーション前のアクティブログファイルの最大サイズ（バイト単位、正の整数、デフォルト: `104857600` = 100 MB）。OpenClaw はアクティブファイルの横に番号付きアーカイブを最大 5 個保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対するベストエフォートのマスキング。`redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効化します。UI/ツール/診断の安全性サーフェスは、発行前に引き続き Secrets をリダクトします。

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
- `stuckSessionWarnMs`: 長時間実行中の処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` と分類するための、進捗なし経過時間しきい値（ms 単位、デフォルト: `120000`）。返信、ツール、ステータス、ブロック、ACP の進捗はタイマーをリセットします。繰り返しの `session.stuck` 診断は、変化がない間バックオフします。
- `stuckSessionAbortMs`: 回復のために対象の停止中アクティブ作業を abort-drain できるようになる前の、進捗なし経過時間しきい値（ms 単位）。未設定の場合、OpenClaw は少なくとも 5 分かつ `stuckSessionWarnMs` の 3 倍の、より安全な拡張埋め込み実行ウィンドウを使用します。
- `memoryPressureSnapshot`: メモリ圧迫が `critical` に達したとき、リダクト済みの OOM 前安定性スナップショットを取得します（デフォルト: `false`）。通常のメモリ圧迫イベントを維持しつつ、安定性バンドルファイルのスキャン/書き込みを追加するには `true` に設定します。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効にします（デフォルト: `false`）。完全な設定、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry export](/ja-JP/gateway/opentelemetry) を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 任意のシグナル固有 OTLP エンドポイント。設定すると、そのシグナルに限り `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効にします。
- `otel.logsExporter`: ログエクスポート先: `"otlp"`（デフォルト）、stdout 行ごとに 1 つの JSON オブジェクトを出力する `"stdout"`、または `"both"`。
- `otel.sampleRate`: トレースサンプリング率 `0`-`1`。
- `otel.flushIntervalMs`: 定期的なテレメトリフラッシュ間隔（ms 単位）。
- `otel.captureContent`: OTEL span 属性用の生コンテンツキャプチャのオプトイン。デフォルトはオフです。ブール値 `true` は非システムメッセージ/ツールコンテンツをキャプチャします。オブジェクト形式では `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt`、`toolDefinitions` を明示的に有効化できます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新の実験的 GenAI 推論 span 形状を有効にする環境トグル。`{gen_ai.operation.name} {gen_ai.request.model}` span 名、`CLIENT` span 種類、レガシーな `gen_ai.system` の代わりの `gen_ai.provider.name` が含まれます。デフォルトでは、互換性のため span は `openclaw.model.call` と `gen_ai.system` を維持します。GenAI メトリクスは境界付きセマンティック属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: グローバル OpenTelemetry SDK をすでに登録しているホスト向けの環境トグル。その場合 OpenClaw は、診断リスナーをアクティブに保ちながら Plugin 所有 SDK の起動/シャットダウンをスキップします。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、および `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 一致する設定キーが未設定の場合に使用される、シグナル固有のエンドポイント環境変数。
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

- `channel`: リリースチャネル - `"stable"`、`"extended-stable"`、`"beta"`、または `"dev"`。extended-stable はパッケージのみのフォアグラウンド/オンデマンドチャネルです。起動時チェックとバックグラウンド自動更新ではスキップされます。
- `checkOnStart`: Gateway 起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: パッケージインストールのバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャネルの自動適用前の最小遅延（時間単位、デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャネルのロールアウト分散を追加する時間ウィンドウ（時間単位、デフォルト: `12`、最大: `168`）。
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

- `enabled`: グローバル ACP 機能ゲート（デフォルト: `true`; ACP ディスパッチとスポーンの操作表示を非表示にするには `false` を設定）。
- `dispatch.enabled`: ACP セッションターンのディスパッチ用の独立したゲート（デフォルト: `true`）。実行をブロックしつつ ACP コマンドは利用可能に保つには `false` を設定。
- `backend`: デフォルトの ACP runtime backend id（登録済みの ACP runtime Plugin と一致する必要があります）。
  先に backend Plugin をインストールし、`plugins.allow` が設定されている場合は backend plugin id（例: `acpx`）を含めてください。含めないと ACP backend は読み込まれません。
- `fallbacks`: プライマリ backend が出力を生成する前に、一時的に見えるエラー（利用不可、レート制限、クォータ枯渇、過負荷）で早期失敗した場合に試行される、フォールバック ACP backend id の順序付きリスト。各エントリは登録済みの ACP runtime Plugin backend と一致する必要があります。
- `defaultAgent`: スポーンで明示的なターゲットを指定しない場合のフォールバック ACP ターゲット agent id。
- `allowedAgents`: ACP runtime セッションで許可される agent id の allowlist。空の場合は追加制限なし。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストのアイドルフラッシュ時間枠（ミリ秒）。
- `stream.maxChunkChars`: ストリーミングブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとに繰り返されるステータス/ツール行を抑制（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は逐次ストリーミングし、`"final_only"` はターン終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベントの後、可視テキストの前に入れる区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影される assistant 出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベント用のタグ名から boolean の可視性上書きへのレコード。
- `runtime.ttlMinutes`: ACP セッション worker がクリーンアップ対象になるまでのアイドル TTL（分）。
- `runtime.installCommand`: ACP runtime 環境のブートストラップ時に実行する任意のインストールコマンド。

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
  - `"random"`（デフォルト）: 面白い/季節ごとのタグラインをローテーション。
  - `"default"`: 固定の中立的なタグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: タグラインテキストなし（バナーのタイトル/バージョンは引き続き表示）。
- バナー全体（タグラインだけではなく）を非表示にするには、env `OPENCLAW_HIDE_BANNER=1` を設定します。

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

## アイデンティティ

[エージェントデフォルト](/ja-JP/gateway/config-agents#agent-defaults) の `agents.list` アイデンティティフィールドを参照してください。

---

## ブリッジ（レガシー、削除済み）

現在のビルドには TCP ブリッジは含まれなくなりました。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーは config schema の一部ではなくなりました（削除されるまで検証に失敗します。`openclaw doctor --fix` で不明なキーを取り除けます）。

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

- `sessionRetention`: 完了した分離 Cron 実行セッションを `sessions.json` から剪定するまで保持する期間。アーカイブ済みの削除された Cron transcript のクリーンアップも制御します。デフォルト: `24h`; 無効にするには `false` を設定。
- `runLog.maxBytes`: 古いファイルベースの Cron 実行ログとの互換性のために受け付けられます。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: ジョブごとに保持される最新の SQLite 実行履歴行。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST 配信（`delivery.mode = "webhook"`）に使用される bearer token。省略した場合、auth header は送信されません。
- `webhook`: 非推奨のレガシーフォールバック Webhook URL（http/https）。`openclaw doctor --fix` が、まだ `notify: true` を持つ保存済みジョブを移行するために使用します。runtime 配信では、ジョブごとの `delivery.mode="webhook"` と `delivery.to`、または announce 配信を保持する場合は `delivery.completionDestination` を使用します。

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

- `maxAttempts`: 一時的なエラーで Cron ジョブをリトライする最大回数（デフォルト: `3`; 範囲: `0`-`10`）。
- `backoffMs`: 各リトライ試行のバックオフ遅延（ミリ秒）の配列（デフォルト: `[30000, 60000, 300000]`; 1-10 エントリ）。
- `retryOn`: リトライをトリガーするエラー種別 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略すると、すべての一時的な種別をリトライします。

ワンショットジョブは、リトライ試行が尽きるまで有効のまま残り、その後、最終エラー状態を保持して無効化されます。定期ジョブは同じ一時的リトライポリシーを使用し、次のスケジュール枠の前にバックオフ後に再実行します。永続的エラー、または一時的リトライの枯渇時は、エラーバックオフ付きの通常の定期スケジュールに戻ります。

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

- `enabled`: Cron ジョブの失敗アラートを有効化（デフォルト: `false`）。
- `after`: アラートが発火するまでの連続失敗数（正の整数、最小: `1`）。
- `cooldownMs`: 同じジョブについて繰り返しアラートを出す間の最小ミリ秒数（非負整数）。
- `includeSkipped`: 連続したスキップ実行をアラートしきい値にカウントします（デフォルト: `false`）。スキップ実行は別に追跡され、実行エラーのバックオフには影響しません。
- `mode`: 配信モード - `"announce"` はチャネルメッセージ経由で送信し、`"webhook"` は設定済み Webhook に投稿します。
- `accountId`: アラート配信のスコープを指定する任意のアカウントまたはチャネル id。

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

- 全ジョブにまたがる Cron 失敗通知のデフォルト送信先。
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータがある場合は `"announce"` がデフォルト。
- `channel`: announce 配信のチャネル上書き。`"last"` は最後に確認された配信チャネルを再利用します。
- `to`: 明示的な announce ターゲットまたは Webhook URL。Webhook mode では必須です。
- `accountId`: 配信用の任意のアカウント上書き。
- ジョブごとの `delivery.failureDestination` は、このグローバルデフォルトを上書きします。
- グローバルの失敗送信先もジョブごとの失敗送信先も設定されていない場合、すでに `announce` で配信するジョブは、失敗時にそのプライマリ announce ターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。分離 Cron 実行は [background tasks](/ja-JP/automation/tasks) として追跡されます。

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
| `{{SessionId}}`    | 現在のセッション UUID                             |
| `{{IsNewSession}}` | 新しいセッションが作成された場合は `"true"`       |
| `{{MediaUrl}}`     | 受信メディアの擬似 URL                            |
| `{{MediaPath}}`    | ローカルメディアパス                              |
| `{{MediaType}}`    | メディア種別（image/audio/document/…）            |
| `{{Transcript}}`   | 音声 transcript                                   |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディア prompt         |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数          |
| `{{ChatType}}`     | `"direct"` または `"group"`                       |
| `{{GroupSubject}}` | グループの件名（ベストエフォート）                |
| `{{GroupMembers}}` | グループメンバーのプレビュー（ベストエフォート）  |
| `{{SenderName}}`   | 送信者の表示名（ベストエフォート）                |
| `{{SenderE164}}`   | 送信者の電話番号（ベストエフォート）              |
| `{{Provider}}`     | Provider ヒント（whatsapp、telegram、discord など） |

---

## Config include（`$include`）

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
- ファイル配列: 順番に deep-merge されます（後のものが前のものを上書き）。
- sibling keys: include 後にマージされます（include された値を上書き）。
- ネストされた include: 最大 10 階層まで。
- パス: include しているファイルからの相対で解決されますが、最上位 config ディレクトリ（`openclaw.json` の `dirname`）内に留まる必要があります。絶対パス/`../` 形式は、その境界内に解決される場合にのみ許可されます。config ディレクトリ外の追加 root を許可するには `OPENCLAW_INCLUDE_ROOTS`（絶対パス）を設定します。
- 制限: パスには null byte を含めてはならず、解決前後の両方で 4096 文字未満である必要があります。各 include ファイルは 2 MB に制限されます。
- 単一ファイル include によって裏付けられている 1 つのトップレベルセクションだけを変更する OpenClaw 所有の書き込みは、その include ファイルに書き込みます。たとえば、`plugins install` は `plugins.json5` 内の `plugins: { $include: "./plugins.json5" }` を更新し、`openclaw.json` はそのままにします。
- root include、include 配列、sibling override を持つ include は、OpenClaw 所有の書き込みでは読み取り専用です。これらの書き込みは config をフラット化する代わりに fail closed します。
- エラー: ファイル欠落、parse error、循環 include、無効な path format、過大な長さに対して明確なメッセージを表示します。

---

## 関連

- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
- [Doctor](/ja-JP/gateway/doctor)
