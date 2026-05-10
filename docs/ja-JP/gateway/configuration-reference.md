---
read_when:
    - フィールド単位の正確な設定セマンティクスまたはデフォルトが必要な場合
    - チャネル、モデル、Gateway、またはツールの設定ブロックを検証している場合
summary: コア OpenClaw キー、デフォルト、および専用サブシステムリファレンスへのリンクに関する Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-05-10T19:34:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

OpenClaw の主要設定サーフェスを扱い、サブシステムに独自の詳しいリファレンスがある場合はそこへリンクします。チャンネルおよび plugin が所有するコマンドカタログや、深いメモリ/QMD ノブは、このページではなく各自のページにあります。

コード上の真実:

- `openclaw config schema` は、検証と Control UI に使われるライブ JSON Schema を出力し、利用可能な場合はバンドル/plugin/チャンネルのメタデータをマージします
- `config.schema.lookup` は、ドリルダウンツール向けにパススコープのスキーマノードを 1 つ返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のスキーマサーフェスに対して config-doc ベースラインハッシュを検証します

エージェント検索パス: 編集前に、正確なフィールドレベルのドキュメントと制約を確認するには、`gateway` ツールアクション `config.schema.lookup` を使います。タスク指向のガイダンスには [Configuration](/ja-JP/gateway/configuration) を使い、より広いフィールドマップ、デフォルト、サブシステムリファレンスへのリンクにはこのページを使います。

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については [Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の組み込み + バンドル済みコマンドカタログについては [Slash commands](/ja-JP/tools/slash-commands)
- チャンネル固有のコマンドサーフェスについては、所有するチャンネル/plugin のページ

設定形式は **JSON5** です (コメント + 末尾カンマが許可されます)。すべてのフィールドは任意です - 省略された場合、OpenClaw は安全なデフォルトを使います。

---

## チャンネル

チャンネルごとの設定キーは専用ページへ移動しました - Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他のバンドル済みチャンネル (認証、アクセス制御、マルチアカウント、メンションゲート) を含む `channels.*` については、[Configuration - channels](/ja-JP/gateway/config-channels) を参照してください。

## エージェントデフォルト、マルチエージェント、セッション、メッセージ

専用ページへ移動しました - 以下については [Configuration - agents](/ja-JP/gateway/config-agents) を参照してください:

- `agents.defaults.*` (ワークスペース、モデル、思考、heartbeat、メモリ、メディア、skills、サンドボックス)
- `multiAgent.*` (マルチエージェントのルーティングとバインディング)
- `session.*` (セッションライフサイクル、compaction、プルーニング)
- `messages.*` (メッセージ配信、TTS、markdown レンダリング)
- `talk.*` (Talk モード)
  - `talk.consultThinkingLevel`: Control UI Talk リアルタイム相談の背後にある完全な OpenClaw エージェント実行に対する思考レベルのオーバーライド
  - `talk.consultFastMode`: Control UI Talk リアルタイム相談に対する 1 回限りの fast-mode オーバーライド
  - `talk.speechLocale`: iOS/macOS 上の Talk 音声認識向けの任意の BCP 47 ロケール ID
  - `talk.silenceTimeoutMs`: 未設定の場合、Talk は文字起こしを送信する前にプラットフォームのデフォルト一時停止ウィンドウを維持します (`700 ms on macOS and Android, 900 ms on iOS`)

## ツールとカスタムプロバイダー

ツールポリシー、実験的トグル、プロバイダーに支えられたツール設定、およびカスタムプロバイダー / ベース URL のセットアップは専用ページへ移動しました - [Configuration - tools and custom providers](/ja-JP/gateway/config-tools) を参照してください。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダーのセットアップは [Configuration - tools and custom providers](/ja-JP/gateway/config-tools#custom-providers-and-base-urls) にあります。
`models` ルートはグローバルなモデルカタログ動作も所有します。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: プロバイダーカタログ動作 (`merge` または `replace`)。
- `models.providers`: プロバイダー ID をキーにしたカスタムプロバイダーマップ。
- `models.providers.*.localService`: ローカルモデルサーバー向けの任意のオンデマンドプロセスマネージャー。OpenClaw は設定されたヘルスエンドポイントをプローブし、必要に応じて絶対パスの `command` を起動し、準備完了を待ってからモデルリクエストを送信します。[Local model services](/ja-JP/gateway/local-model-services) を参照してください。
- `models.pricing.enabled`: sidecar とチャンネルが Gateway ready パスに到達した後に開始されるバックグラウンドの pricing ブートストラップを制御します。`false` の場合、Gateway は OpenRouter と LiteLLM の pricing-catalog 取得をスキップします。設定済みの `models.providers.*.models[].cost` 値は、ローカルコスト見積もりでは引き続き機能します。

## MCP

OpenClaw が管理する MCP サーバー定義は `mcp.servers` 配下にあり、組み込み Pi やその他のランタイムアダプターによって消費されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、設定編集時にターゲットサーバーへ接続せずにこのブロックを管理します。

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
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: 設定済み MCP ツールを公開するランタイム向けの名前付き stdio またはリモート MCP サーバー定義。
  リモートエントリは `transport: "streamable-http"` または `transport: "sse"` を使います。
  `type: "http"` は CLI ネイティブのエイリアスで、`openclaw mcp set` と `openclaw doctor --fix` が正規の `transport` フィールドへ正規化します。
- `mcp.sessionIdleTtlMs`: セッションスコープのバンドル済み MCP ランタイムに対するアイドル TTL。
  1 回限りの組み込み実行は実行終了時のクリーンアップを要求します。この TTL は、長期間存続するセッションと将来の呼び出し元のためのバックストップです。
- `mcp.*` 配下の変更は、キャッシュされたセッション MCP ランタイムを破棄することで hot-apply されます。
  次回のツール探索/使用時に新しい設定から再作成されるため、削除された `mcp.servers` エントリはアイドル TTL を待たずに即座に刈り取られます。

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

- `allowBundled`: バンドル済み skills のみに対する任意の許可リスト (管理対象/ワークスペース skills には影響しません)。
- `load.extraDirs`: 追加の共有 skill ルート (最低優先度)。
- `load.allowSymlinkTargets`: skill シンボリックリンクが設定済みソースルートの外にある場合に、そのリンクが解決してもよい信頼済みの実ターゲットルート。
- `install.preferBrew`: true の場合、`brew` が利用可能なら他のインストーラー種別へフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` 仕様向けの node インストーラー優先設定 (`npm` | `pnpm` | `yarn` | `bun`)。
- `install.allowUploadedArchives`: 信頼済みの `operator.admin` Gateway クライアントが、`skills.upload.*` 経由でステージされたプライベート zip アーカイブをインストールできるようにします (デフォルト: false)。これはアップロード済みアーカイブのパスのみを有効にします。通常の ClawHub インストールには不要です。
- `entries.<skillKey>.enabled: false` は、バンドル済み/インストール済みであっても skill を無効化します。
- `entries.<skillKey>.apiKey`: primary env var を宣言する skills 向けの便利フィールド (平文文字列または SecretRef オブジェクト)。

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
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

- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` から読み込まれます。
- 探索は、ネイティブ OpenClaw plugins に加え、互換性のある Codex bundles と Claude bundles を受け入れます。manifestless Claude default-layout bundles も含まれます。
- **設定変更には gateway の再起動が必要です。**
- `allow`: 任意の許可リスト (リストされた plugins のみが読み込まれます)。`deny` が優先されます。
- `bundledDiscovery`: 新規設定ではデフォルトで `"allowlist"` になるため、空でない `plugins.allow` は、web-search ランタイムプロバイダーを含むバンドル済みプロバイダー plugins もゲートします。Doctor は、既存のバンドル済みプロバイダー動作をオプトインまで維持するために、移行済みレガシー許可リスト設定へ `"compat"` を書き込みます。
- `plugins.entries.<id>.apiKey`: plugin レベルの API キー便利フィールド (plugin が対応している場合)。
- `plugins.entries.<id>.env`: plugin スコープの env var マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視します。その一方で、レガシー `modelOverride` と `providerOverride` は保持します。ネイティブ plugin hooks と、対応する bundle 提供の hook ディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼済みの非バンドル plugins は、`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end` などの型付き hooks から生の会話コンテンツを読み取れます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この plugin がバックグラウンド subagent 実行ごとに `provider` と `model` のオーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼済み subagent オーバーライド向けの正規 `provider/model` ターゲットの任意の許可リスト。任意のモデルを許可したいと意図している場合のみ `"*"` を使います。
- `plugins.entries.<id>.llm.allowModelOverride`: この plugin が `api.runtime.llm.complete` のモデルオーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.llm.allowedModels`: 信頼済み plugin LLM completion オーバーライド向けの正規 `provider/model` ターゲットの任意の許可リスト。任意のモデルを許可したいと意図している場合のみ `"*"` を使います。
- `plugins.entries.<id>.llm.allowAgentIdOverride`: この plugin がデフォルト以外のエージェント ID に対して `api.runtime.llm.complete` を実行することを明示的に信頼します。
- `plugins.entries.<id>.config`: plugin 定義の設定オブジェクト (利用可能な場合、ネイティブ OpenClaw plugin スキーマで検証されます)。
- チャンネル plugin のアカウント/ランタイム設定は `channels.<id>` 配下にあり、中央の OpenClaw オプションレジストリではなく、所有する plugin の manifest `channelConfigs` メタデータで記述されるべきです。

### Codex harness plugin 設定

バンドル済みの `codex` plugin は、ネイティブ Codex app-server harness 設定を `plugins.entries.codex.config` 配下に所有します。完全な設定サーフェスについては [Codex harness reference](/ja-JP/plugins/codex-harness-reference) を、ランタイムモデルについては [Codex harness](/ja-JP/plugins/codex-harness) を参照してください。

`codexPlugins` は、ネイティブ Codex harness を選択するセッションのみに適用されます。
Pi、通常の OpenAI プロバイダー実行、ACP 会話バインディング、または Codex 以外の harness に対して Codex plugins を有効化するものではありません。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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
  プラグイン/アプリ対応を有効にします。デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  移行済みプラグインアプリの確認要求に対するデフォルトの破壊的アクションポリシー。
  デフォルト: `false`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: グローバルな
  `codexPlugins.enabled` も true の場合に、移行済みプラグインエントリを有効にします。
  デフォルト: 明示的なエントリでは `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  安定したマーケットプレイス ID。V1 は `"openai-curated"` のみをサポートします。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: 移行から得られる安定した
  Codex プラグイン ID。例: `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  プラグイン単位の破壊的アクションの上書き設定。省略した場合は、グローバルな
  `allow_destructive_actions` 値が使用されます。

`codexPlugins.enabled` はグローバルな有効化ディレクティブです。移行によって書き込まれた明示的なプラグイン
エントリは、永続的なインストールおよび修復対象セットです。
`plugins["*"]` はサポートされず、`install` スイッチはなく、ローカルの
`marketplacePath` 値はホスト固有であるため意図的に設定フィールドにはしていません。

`app/list` の準備状態チェックは 1 時間キャッシュされ、古くなると
非同期に更新されます。Codex スレッドのアプリ設定は、各ターンではなく Codex ハーネス
セッションの確立時に計算されます。ネイティブプラグイン設定を変更した後は、`/new`、`/reset`、または Gateway
の再起動を使用してください。

- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch プロバイダー設定。
  - `apiKey`: Firecrawl API キー（SecretRef を受け入れます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、レガシーの `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数にフォールバックします。
  - `baseUrl`: Firecrawl API ベース URL（デフォルト: `https://api.firecrawl.dev`。セルフホストの上書きはプライベート/内部エンドポイントを対象にする必要があります）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ有効期間（ミリ秒）（デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプ要求のタイムアウト秒数（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search プロバイダーを有効にします。
  - `model`: 検索に使用する Grok モデル（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: メモリの Dreaming 設定。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: Dreaming のマスタースイッチ（デフォルト `false`）。
  - `frequency`: 各完全 Dreaming スイープの cron 間隔（デフォルトは `"0 3 * * *"`）。
  - `model`: 任意の Dream Diary サブエージェントモデル上書き。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。対象を制限するには `allowedModels` と組み合わせます。モデル利用不可エラーはセッションのデフォルトモデルで 1 回再試行されます。信頼または許可リストの失敗は暗黙にはフォールバックしません。
  - フェーズポリシーとしきい値は実装詳細です（ユーザー向け設定キーではありません）。
- 完全なメモリ設定は [メモリ設定リファレンス](/ja-JP/reference/memory-config) にあります。
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効な Claude バンドルプラグインは、`settings.json` から埋め込み Pi デフォルトを提供することもできます。OpenClaw はそれらを生の OpenClaw 設定パッチとしてではなく、サニタイズ済みのエージェント設定として適用します。
- `plugins.slots.memory`: アクティブなメモリプラグイン ID を選択します。メモリプラグインを無効にするには `"none"` を選択します。
- `plugins.slots.contextEngine`: アクティブなコンテキストエンジンプラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` です。

[プラグイン](/ja-JP/tools/plugin) を参照してください。

---

## コミットメント

`commitments` は推定フォローアップメモリを制御します。OpenClaw は会話ターンからチェックインを検出し、Heartbeat 実行を通じて配信できます。

- `commitments.enabled`: 推定フォローアップコミットメントの非表示 LLM 抽出、保存、Heartbeat 配信を有効にします。デフォルト: `false`。
- `commitments.maxPerDay`: ローリング 1 日あたり、エージェントセッションごとに配信される推定フォローアップコミットメントの最大数。デフォルト: `3`。

[推定コミットメント](/ja-JP/concepts/commitments) を参照してください。

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
- `tabCleanup` は、アイドル時間の経過後、またはセッションが上限を超えたときに、追跡対象のプライマリエージェントタブを回収します。個別のクリーンアップモードを無効にするには、`idleMinutes: 0` または `maxTabsPerSession: 0` を設定します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時には無効なので、ブラウザーナビゲーションはデフォルトで厳格なままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` は、プライベートネットワークのブラウザーナビゲーションを意図的に信頼する場合にのみ設定してください。
- 厳格モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）は、到達性/検出チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはアタッチ専用です（開始/停止/リセットは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け入れます。
  OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用し、プロバイダーから直接 DevTools WebSocket URL が提供される場合は WS(S) を使用してください。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび
  `attachOnly` CDP の到達性に加え、タブを開く要求に適用されます。管理対象の loopback
  プロファイルはローカル CDP のデフォルトを維持します。
- 外部管理の CDP サービスが loopback 経由で到達可能な場合は、その
  プロファイルの `attachOnly: true` を設定します。そうしないと、OpenClaw は loopback ポートを
  ローカル管理ブラウザープロファイルとして扱い、ローカルポート所有権エラーを報告する場合があります。
- `existing-session` プロファイルは CDP の代わりに Chrome MCP を使用し、選択したホストまたは接続済みブラウザーノード経由でアタッチできます。
- `existing-session` プロファイルは、Brave や Edge などの特定の Chromium ベースブラウザープロファイルを対象にするために `userDataDir` を設定できます。
- `existing-session` プロファイルは現在の Chrome MCP ルート制限を維持します:
  CSS セレクターターゲティングではなく snapshot/ref 駆動アクション、単一ファイルアップロード
  フック、ダイアログタイムアウト上書きなし、`wait --load networkidle` なし、そして
  `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなし。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。リモート CDP の場合にのみ
  `cdpUrl` を明示的に設定してください。
- ローカル管理プロファイルでは、そのプロファイル用にグローバルな
  `browser.executablePath` を上書きする `executablePath` を設定できます。これを使用して、あるプロファイルを
  Chrome で、別のプロファイルを Brave で実行できます。
- ローカル管理プロファイルは、プロセス開始後の Chrome CDP HTTP
  検出に `browser.localLaunchTimeoutMs` を、起動後の CDP WebSocket 準備状態に
  `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に起動するが準備状態チェックが起動と競合する遅いホストでは、これらを引き上げてください。両方の値は
  `120000` ms 以下の正の整数である必要があります。無効な設定値は拒否されます。
- 自動検出順序: Chromium ベースの場合はデフォルトブラウザー → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、Chromium 起動前に
  OS のホームディレクトリとして `~` と `~/...` を受け入れます。
  `existing-session` プロファイルのプロファイル単位の `userDataDir` もチルダ展開されます。
- 制御サービス: loopback のみ（ポートは `gateway.port` から派生、デフォルト `18791`）。
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
- `assistant`: Control UI ID の上書き。アクティブなエージェント ID にフォールバックします。

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
      url: "ws://gateway.tailnet:18789",
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
      // Remove tools from the default HTTP deny list
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

<Accordion title="Gateway フィールドの詳細">

- `mode`: `local`（gatewayを実行）または`remote`（リモートgatewayに接続）。`local`でない限り、Gatewayは起動を拒否します。
- `port`: WS + HTTP用の単一多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IPのみ）、または`custom`。
- **レガシーbindエイリアス**: `gateway.bind`では、ホストエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bindモード値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Dockerに関する注意**: デフォルトの`loopback` bindは、コンテナ内の`127.0.0.1`で待ち受けます。Dockerブリッジネットワーク（`-p 18789:18789`）では、トラフィックは`eth0`に到着するため、gatewayに到達できません。`--network host`を使用するか、すべてのインターフェイスで待ち受けるために`bind: "lan"`（または`customBindHost: "0.0.0.0"`を指定した`bind: "custom"`）を設定してください。
- **認証**: デフォルトで必須です。非loopback bindではgateway認証が必要です。実際には、共有トークン/パスワード、または`gateway.auth.mode: "trusted-proxy"`を使用するID対応リバースプロキシを意味します。オンボーディングウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token`と`gateway.auth.password`の両方（SecretRefを含む）が設定されている場合は、`gateway.auth.mode`を明示的に`token`または`password`に設定してください。両方が設定され、modeが未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモードです。信頼できるlocal loopbackセットアップでのみ使用してください。これは意図的にオンボーディングプロンプトでは提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザ/ユーザー認証をID対応リバースプロキシに委任し、`gateway.trustedProxies`からのIDヘッダーを信頼します（[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照）。このモードは、デフォルトで**非loopback**プロキシソースを想定します。同一ホストのloopbackリバースプロキシでは、明示的な`gateway.auth.trustedProxy.allowLoopback = true`が必要です。内部の同一ホスト呼び出し元は、ローカル直接フォールバックとして`gateway.auth.password`を使用できます。`gateway.auth.token`はtrusted-proxyモードと引き続き相互排他的です。
- `gateway.auth.allowTailscale`: `true`の場合、Tailscale ServeのIDヘッダーでControl UI/WebSocket認証を満たせます（`tailscale whois`で検証）。HTTP APIエンドポイントは、そのTailscaleヘッダー認証を**使用しません**。代わりにgatewayの通常のHTTP認証モードに従います。このトークンなしフローは、gatewayホストが信頼されていることを前提とします。`tailscale.mode = "serve"`の場合、デフォルトは`true`です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッターです。クライアントIPごと、認証スコープごとに適用されます（shared-secretとdevice-tokenは独立して追跡されます）。ブロックされた試行は`429` + `Retry-After`を返します。
  - 非同期Tailscale Serve Control UIパスでは、同じ`{scope, clientIp}`に対する失敗試行は、失敗を書き込む前に直列化されます。そのため、同じクライアントからの同時の不正な試行は、両方が単なる不一致として競合して通過するのではなく、2番目のリクエストでリミッターにかかる可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback`のデフォルトは`true`です。localhostトラフィックも意図的にレート制限したい場合（テストセットアップや厳格なプロキシデプロイなど）は`false`を設定してください。
- ブラウザオリジンのWS認証試行は、loopback免除を無効にした状態で常にスロットリングされます（ブラウザベースのlocalhost総当たり攻撃に対する多層防御）。
- loopbackでは、これらのブラウザオリジンのロックアウトは正規化された`Origin`
  値ごとに分離されるため、あるlocalhostオリジンからの失敗の繰り返しが、別のオリジンを自動的に
  ロックアウトすることはありません。
- `tailscale.mode`: `serve`（tailnetのみ、loopback bind）または`funnel`（公開、認証必須）。
- `tailscale.preserveFunnel`: `true`かつ`tailscale.mode = "serve"`の場合、OpenClawは
  起動時にServeを再適用する前に`tailscale funnel status`を確認し、外部で設定されたFunnelルートがすでにgatewayポートをカバーしている場合は
  スキップします。デフォルトは`false`です。
- `controlUi.allowedOrigins`: Gateway WebSocket接続用の明示的なブラウザオリジン許可リストです。非loopbackオリジンからブラウザクライアントが想定される場合に必須です。
- `controlUi.chatMessageMaxWidth`: グループ化されたControl UIチャットメッセージの任意の最大幅です。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)`などの制約付きCSS幅値を受け付けます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Hostヘッダーオリジンポリシーに意図的に依存するデプロイで、Hostヘッダーオリジンフォールバックを有効にする危険なモードです。
- `remote.transport`: `ssh`（デフォルト）または`direct`（ws/wss）。`direct`では、`remote.url`は`ws://`または`wss://`である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼済みプライベートネットワーク
  IPへの平文`ws://`を許可する、クライアント側プロセス環境の
  緊急回避オーバーライドです。平文のデフォルトは引き続きloopbackのみです。対応する`openclaw.json`
  設定はなく、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`のような
  ブラウザのプライベートネットワーク設定はGateway
  WebSocketクライアントに影響しません。
- `gateway.remote.token` / `.password`はリモートクライアントの認証情報フィールドです。これら自体はgateway認証を設定しません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOSビルドがrelay-backed登録をgatewayへ公開した後に使用する、外部APNsリレーのベースHTTPS URLです。このURLは、iOSビルドにコンパイルされたリレーURLと一致する必要があります。
- `gateway.push.apns.relay.timeoutMs`: gatewayからリレーへの送信タイムアウト（ミリ秒）です。デフォルトは`10000`です。
- relay-backed登録は、特定のgateway IDに委任されます。ペアリングされたiOSアプリは`gateway.identity.get`を取得し、そのIDをリレー登録に含め、登録スコープの送信許可をgatewayへ転送します。別のgatewayは、その保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記のリレー設定に対する一時的な環境変数オーバーライドです。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTPリレーURL用の開発専用エスケープハッチです。本番リレーURLはHTTPSのままにしてください。
- `gateway.handshakeTimeoutMs`: 認証前Gateway WebSocketハンドシェイクタイムアウト（ミリ秒）です。デフォルト: `15000`。`OPENCLAW_HANDSHAKE_TIMEOUT_MS`が設定されている場合は優先されます。ローカルクライアントが接続できる一方で起動時ウォームアップがまだ落ち着いていない、高負荷または低性能のホストでは、この値を増やしてください。
- `gateway.channelHealthCheckMinutes`: チャネルヘルスモニター間隔（分）です。グローバルにヘルスモニターの再起動を無効にするには`0`を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: staleソケットしきい値（分）です。これは`gateway.channelHealthCheckMinutes`以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング1時間あたりのチャネル/アカウントごとのヘルスモニター再起動の最大数です。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターを有効にしたまま、チャネル単位でヘルスモニター再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 複数アカウントチャネル向けのアカウント単位オーバーライドです。設定されている場合、チャネルレベルのオーバーライドより優先されます。
- ローカルgateway呼び出しパスは、`gateway.auth.*`が未設定の場合にのみ、フォールバックとして`gateway.remote.*`を使用できます。
- `gateway.auth.token` / `gateway.auth.password`がSecretRef経由で明示的に設定され、解決できない場合、解決はフェイルクローズします（リモートフォールバックによるマスキングなし）。
- `trustedProxies`: TLSを終端する、または転送クライアントヘッダーを注入するリバースプロキシIPです。管理下にあるプロキシのみを列挙してください。loopbackエントリは、同一ホストのプロキシ/ローカル検出セットアップ（例: Tailscale Serveまたはローカルリバースプロキシ）では引き続き有効ですが、loopbackリクエストを`gateway.auth.mode: "trusted-proxy"`の対象にするものでは**ありません**。
- `allowRealIpFallback`: `true`の場合、`X-Forwarded-For`がないときにgatewayが`X-Real-IP`を受け入れます。フェイルクローズ動作のため、デフォルトは`false`です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求スコープのない初回ノードデバイスペアリングを自動承認するための任意のCIDR/IP許可リストです。未設定の場合は無効です。これはoperator/browser/Control UI/WebChatペアリングを自動承認せず、ロール、スコープ、メタデータ、公開鍵のアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングおよびプラットフォーム許可リスト評価後に、宣言されたノードコマンドをグローバルに許可/拒否するための整形です。`camera.snap`、`camera.clip`、`screen.record`などの危険なノードコマンドを明示的に許可するには`allowCommands`を使用します。`denyCommands`は、プラットフォームのデフォルトや明示的な許可に含まれる場合でも、コマンドを削除します。ノードが宣言済みコマンドリストを変更した後は、そのデバイスペアリングを拒否して再承認し、gatewayが更新されたコマンドスナップショットを保存するようにしてください。
- `gateway.tools.deny`: HTTP `POST /tools/invoke`でブロックされる追加ツール名です（デフォルト拒否リストを拡張）。
- `gateway.tools.allow`: デフォルトのHTTP拒否リストからツール名を削除します。

</Accordion>

### OpenAI互換エンドポイント

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true`で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の許可リストは未設定として扱われます。URL取得を無効にするには、`gateway.http.endpoints.responses.files.allowUrl=false`
    および/または`gateway.http.endpoints.responses.images.allowUrl=false`を使用してください。
- 任意のレスポンス強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（管理下のHTTPSオリジンにのみ設定してください。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts)を参照）

### 複数インスタンスの分離

一意のポートと状態ディレクトリを使用して、1つのホストで複数のgatewayを実行します:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev`（`~/.openclaw-dev` + ポート`19001`を使用）、`--profile <name>`（`~/.openclaw-<name>`を使用）。

[複数のGateway](/ja-JP/gateway/multiple-gateways)を参照してください。

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

- `enabled`: gatewayリスナーでTLS終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカルの自己署名証明書/鍵ペアを自動生成します。ローカル/開発用途のみです。
- `certPath`: TLS証明書ファイルへのファイルシステムパスです。
- `keyPath`: TLS秘密鍵ファイルへのファイルシステムパスです。権限を制限してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用の任意のCAバンドルパスです。

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
  - `"restart"`: 設定変更時に常にgatewayプロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まずホットリロードを試行し、必要な場合は再起動にフォールバックします。
- `debounceMs`: 設定変更が適用される前のデバウンスウィンドウ（ミリ秒、非負整数）です。
- `deferralTimeoutMs`: 再起動またはチャネルホットリロードを強制する前に、実行中の操作を待つ任意の最大時間（ミリ秒）です。デフォルトの有界待機（`300000`）を使用するには省略します。無期限に待機し、まだ保留中である旨の警告を定期的にログ出力するには`0`を設定します。

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
- `hooks.token` は `gateway.auth.token` と**異なる**必要があります。Gateway トークンの再利用は拒否されます。
- `hooks.path` に `/` は使用できません。`/hooks` などの専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。
- マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的マッピングキーでは、このオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されます
  - テンプレートでレンダリングされたマッピングの `sessionKey` 値は外部から提供されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="Mapping details">

- `match.path` は `/hooks` の後のサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パスのペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` はフックアクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` の内部に留まります（絶対パスとトラバーサルは拒否されます）。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` 配下に置いてください。ワークスペースの Skills ディレクトリは拒否されます。`openclaw doctor` がこのパスを無効として報告した場合は、transform モジュールを hooks transforms ディレクトリに移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントにルーティングします。不明な ID はデフォルトにフォールバックします。
- `allowedAgentIds`: 明示的なルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` なしでフックエージェントを実行するための任意の固定セッションキーです。
- `allowRequestSessionKey`: `/hooks/agent` の呼び出し元とテンプレート駆動のマッピングセッションキーが `sessionKey` を設定できるようにします（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（リクエスト + マッピング）に対する任意のプレフィックス許可リストです。例: `["hook:"]`。いずれかのマッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は必須になります。
- `deliver: true` は最終返信をチャンネルに送信します。`channel` のデフォルトは `last` です。
- `model` はこのフック実行の LLM を上書きします（モデルカタログが設定されている場合は許可されている必要があります）。

</Accordion>

### Gmail 連携

- 組み込みの Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- そのメッセージ単位のルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、Gmail 名前空間に一致するように `hooks.allowedSessionKeyPrefixes` を制限してください。例: `["hook:", "hook:gmail:"]`。
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

- Gateway は設定されている場合、起動時に `gog gmail watch serve` を自動開始します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
- Gateway と並行して別の `gog gmail watch serve` を実行しないでください。

---

## Canvas plugin ホスト

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
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）を維持してください。
- 非 loopback バインド: canvas ルートには、他の Gateway HTTP サーフェスと同様に Gateway 認証（トークン/パスワード/trusted-proxy）が必要です。
- Node WebViews は通常、認証ヘッダーを送信しません。ノードがペアリングされ接続された後、Gateway は canvas/A2UI アクセス用のノードスコープの capability URL を通知します。
- capability URL はアクティブなノード WS セッションに紐づけられ、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
- 提供される HTML に live-reload クライアントを注入します。
- 空の場合はスターター `index.html` を自動作成します。
- A2UI も `/__openclaw__/a2ui/` で提供します。
- 変更には Gateway の再起動が必要です。
- 大きなディレクトリまたは `EMFILE` エラーでは live reload を無効にしてください。

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

- `minimal`（組み込みの `bonjour` plugin が有効な場合のデフォルト）: TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。LAN マルチキャスト広告には引き続き組み込みの `bonjour` plugin が有効である必要があります。
- `off`: plugin の有効化状態を変更せずに LAN マルチキャスト広告を抑制します。
- 組み込みの `bonjour` plugin は macOS ホストで自動開始され、Linux、Windows、コンテナ化された Gateway デプロイメントではオプトインです。
- ホスト名は、有効な DNS ラベルである場合はシステムホスト名がデフォルトになり、そうでない場合は `openclaw` にフォールバックします。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

ユニキャスト DNS-SD ゾーンを `~/.openclaw/dns/` 配下に書き込みます。ネットワークをまたいだ検出には、DNS サーバー（CoreDNS 推奨）+ Tailscale split DNS と組み合わせてください。

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

- インライン環境変数は、プロセス環境にキーがない場合にのみ適用されます。
- `.env` ファイル: CWD の `.env` + `~/.openclaw/.env` (どちらも既存の変数を上書きしません)。
- `shellEnv`: ログインシェルプロファイルから、不足している想定キーをインポートします。
- 完全な優先順位については [環境](/ja-JP/help/environment) を参照してください。

### 環境変数の置換

任意の設定文字列で `${VAR_NAME}` を使って環境変数を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字の名前のみです: `[A-Z_][A-Z0-9_]*`。
- 欠落または空の変数があると、設定の読み込み時にエラーが発生します。
- リテラルの `${VAR}` には `$${VAR}` でエスケープします。
- `$include` と併用できます。

---

## シークレット

シークレット参照は追加的です。プレーンテキスト値も引き続き機能します。

### `SecretRef`

1 つのオブジェクト形状を使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON ポインター (例: `"/providers/openai/apiKey"`)
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` の id には、スラッシュ区切りのパスセグメントとして `.` または `..` を含めることはできません (例: `a/../b` は拒否されます)

### 対応する資格情報サーフェス

- 正準マトリックス: [SecretRef 資格情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、対応する `openclaw.json` の資格情報パスを対象にします。
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

- `file` プロバイダーは `mode: "json"` と `mode: "singleValue"` に対応しています (singleValue モードでは `id` は `"value"` である必要があります)。
- Windows ACL 検証を利用できない場合、file プロバイダーと exec プロバイダーのパスはフェイルクローズします。検証できない信頼済みパスに対してのみ `allowInsecurePath: true` を設定してください。
- `exec` プロバイダーには絶対 `command` パスが必要で、stdin/stdout 上のプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決後のターゲットパスを検証しつつシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定します。
- `trustedDirs` が設定されている場合、信頼済みディレクトリのチェックは解決後のターゲットパスに適用されます。
- `exec` 子環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡します。
- シークレット参照はアクティベーション時にインメモリスナップショットへ解決され、その後、リクエストパスはスナップショットのみを読み取ります。
- アクティブサーフェスのフィルタリングはアクティベーション中に適用されます。有効なサーフェス上の未解決参照は起動またはリロードを失敗させ、非アクティブなサーフェスは診断付きでスキップされます。

---

## 認証ストレージ

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- エージェントごとのプロファイルは `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は、静的な資格情報モード向けに値レベルの参照 (`api_key` の `keyRef`、`token` の `tokenRef`) に対応しています。
- `{ "provider": { "apiKey": "..." } }` のような従来のフラットな `auth-profiles.json` マップはランタイム形式ではありません。`openclaw doctor --fix` は、それらを `.legacy-flat.*.bak` バックアップ付きの正準 `provider:default` API キープロファイルへ書き換えます。
- OAuth モードのプロファイル (`auth.profiles.<id>.mode = "oauth"`) は、SecretRef による認証プロファイル資格情報に対応していません。
- 静的ランタイム資格情報は、インメモリで解決されたスナップショットから取得されます。従来の静的 `auth.json` エントリは、検出されると削除されます。
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

- `billingBackoffHours`: プロファイルが真の請求/クレジット不足エラーで失敗した場合の基本バックオフ時間（時間単位、デフォルト: `5`）。明示的な請求テキストは `401`/`403` 応答でもここに分類される場合がありますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーにスコープされたままです（例: OpenRouter の `Key limit exceeded`）。再試行可能な HTTP `402` の利用ウィンドウや組織/ワークスペースの利用上限メッセージは、代わりに `rate_limit` パスにとどまります。
- `billingBackoffHoursByProvider`: 請求バックオフ時間に対する任意のプロバイダー別オーバーライド。
- `billingMaxHours`: 請求バックオフの指数的増加に対する上限時間（時間単位、デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼度の `auth_permanent` 失敗に対する基本バックオフ時間（分単位、デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加に対する上限時間（分単位、デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用されるローリングウィンドウ（時間単位、デフォルト: `24`）。
- `overloadedProfileRotations`: モデルフォールバックへ切り替える前に許可される、過負荷エラーに対する同一プロバイダー内の認証プロファイルローテーションの最大回数（デフォルト: `1`）。`ModelNotReadyException` など、プロバイダーがビジーであることを示す形状はここに分類されます。
- `overloadedBackoffMs`: 過負荷状態のプロバイダー/プロファイルローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: モデルフォールバックへ切り替える前に許可される、レート制限エラーに対する同一プロバイダー内の認証プロファイルローテーションの最大回数（デフォルト: `1`）。このレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` など、プロバイダー由来のテキストが含まれます。

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
- `maxFileBytes`: ローテーション前のアクティブなログファイルの最大サイズ（バイト単位、正の整数、デフォルト: `104857600` = 100 MB）。OpenClaw はアクティブファイルの横に、番号付きアーカイブを最大 5 個保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対するベストエフォートのマスキング。`redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効化します。UI/ツール/診断の安全サーフェスでは、送出前に引き続きシークレットが秘匿されます。

---

## 診断

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

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
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
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

- `enabled`: インストルメンテーション出力のマスタートグル（デフォルト: `true`）。
- `flags`: 対象を絞ったログ出力を有効化するフラグ文字列の配列（`"telegram.*"` や `"*"` などのワイルドカードをサポート）。
- `stuckSessionWarnMs`: 長時間実行中の処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` として分類するための、進捗なし経過時間のしきい値（ミリ秒単位）。返信、ツール、ステータス、ブロック、ACP の進捗はタイマーをリセットします。繰り返される `session.stuck` 診断は、変更がない間バックオフします。
- `stuckSessionAbortMs`: 回復のために、条件を満たす停止中のアクティブ作業を中断ドレインできるようになるまでの、進捗なし経過時間のしきい値（ミリ秒単位）。未設定の場合、OpenClaw は少なくとも 10 分かつ `stuckSessionWarnMs` の 5 倍という、より安全な拡張埋め込み実行ウィンドウを使用します。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効化します（デフォルト: `false`）。完全な設定、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 任意のシグナル固有 OTLP エンドポイント。設定すると、そのシグナルに限り `otel.endpoint` をオーバーライドします。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効化します。
- `otel.sampleRate`: トレースサンプリング率 `0`-`1`。
- `otel.flushIntervalMs`: 定期的なテレメトリフラッシュ間隔（ミリ秒単位）。
- `otel.captureContent`: OTEL span 属性に対する生コンテンツキャプチャのオプトイン。デフォルトはオフです。ブール値 `true` は、非システムのメッセージ/ツールコンテンツをキャプチャします。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` を明示的に有効化できます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新の実験的 GenAI span プロバイダー属性の環境トグル。デフォルトでは、互換性のため span はレガシーな `gen_ai.system` 属性を保持します。GenAI メトリクスは境界付きセマンティック属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: グローバル OpenTelemetry SDK をすでに登録しているホスト向けの環境トグル。OpenClaw は診断リスナーをアクティブに保ったまま、Plugin 所有の SDK 起動/シャットダウンをスキップします。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 対応する設定キーが未設定の場合に使用される、シグナル固有のエンドポイント環境変数。
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

- `channel`: npm/git インストール用のリリースチャンネル - `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: gateway 起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: パッケージインストールのバックグラウンド自動更新を有効化します（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャンネルの自動適用前の最小遅延時間（時間単位、デフォルト: `6`、最大: `168`）。
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

- `enabled`: グローバル ACP 機能ゲート（デフォルト: `true`。ACP dispatch と spawn のアフォーダンスを非表示にするには `false` を設定）。
- `dispatch.enabled`: ACP セッションターン dispatch の独立したゲート（デフォルト: `true`）。ACP コマンドを利用可能なまま実行をブロックするには、`false` を設定します。
- `backend`: デフォルトの ACP ランタイムバックエンド ID（登録済みの ACP ランタイム Plugin と一致する必要があります）。
  先にバックエンド Plugin をインストールし、`plugins.allow` が設定されている場合は、バックエンド Plugin ID（例: `acpx`）を含めてください。含めないと ACP バックエンドは読み込まれません。
- `defaultAgent`: spawn が明示的なターゲットを指定しない場合のフォールバック ACP ターゲットエージェント ID。
- `allowedAgents`: ACP ランタイムセッションで許可されるエージェント ID の許可リスト。空の場合、追加の制限はありません。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストのアイドルフラッシュウィンドウ（ミリ秒単位）。
- `stream.maxChunkChars`: ストリーミングされたブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとに繰り返されるステータス/ツール行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` はインクリメンタルにストリーミングします。`"final_only"` はターン終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベントの後、可視テキストの前に置く区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影されるアシスタント出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベントに対する、タグ名からブール値の可視性オーバーライドへのレコード。
- `runtime.ttlMinutes`: クリーンアップ対象になり得る ACP セッションワーカーのアイドル TTL（分単位）。
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

- `cli.banner.taglineMode` はバナーのタグラインスタイルを制御します:
  - `"random"`（デフォルト）: 面白い/季節向けのタグラインをローテーションします。
  - `"default"`: 固定の中立的なタグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: タグラインテキストなし（バナータイトル/バージョンは引き続き表示）。
- バナー全体を非表示にするには（タグラインだけでなく）、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

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
  },
}
```

---

## ID

[エージェントのデフォルト](/ja-JP/gateway/config-agents#agent-defaults)の `agents.list` ID フィールドを参照してください。

---

## ブリッジ（レガシー、削除済み）

現在のビルドには TCP ブリッジは含まれていません。ノードは Gateway WebSocket 経由で接続します。`bridge.*` キーは構成スキーマの一部ではなくなりました（削除されるまで検証に失敗します。`openclaw doctor --fix` で不明なキーを取り除けます）。

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
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: 完了した分離 Cron 実行セッションを `sessions.json` から削除するまで保持する期間。アーカイブ済みの削除された Cron トランスクリプトのクリーンアップも制御します。デフォルト: `24h`; 無効にするには `false` を設定します。
- `runLog.maxBytes`: 削除前の実行ログファイル (`cron/runs/<jobId>.jsonl`) ごとの最大サイズ。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: 実行ログの削除がトリガーされたときに保持される最新行数。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST 配信 (`delivery.mode = "webhook"`) に使用される bearer トークン。省略した場合、認証ヘッダーは送信されません。
- `webhook`: 非推奨のレガシーフォールバック Webhook URL (http/https)。まだ `notify: true` を持つ保存済みジョブにのみ使用されます。

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

- `maxAttempts`: 一時的エラーでのワンショットジョブの最大再試行回数 (デフォルト: `3`; 範囲: `0`-`10`)。
- `backoffMs`: 各再試行のバックオフ遅延を ms で指定する配列 (デフォルト: `[30000, 60000, 300000]`; 1-10 個のエントリ)。
- `retryOn`: 再試行をトリガーするエラー種別 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略するとすべての一時的な種別を再試行します。

ワンショット Cron ジョブにのみ適用されます。繰り返しジョブは別の失敗処理を使用します。

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
- `mode`: 配信モード - `"announce"` はチャネルメッセージ経由で送信します; `"webhook"` は設定済み Webhook に投稿します。
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

- すべてのジョブにまたがる Cron 失敗通知のデフォルト宛先。
- `mode`: `"announce"` または `"webhook"`; 十分なターゲットデータが存在する場合、デフォルトは `"announce"` です。
- `channel`: announce 配信用のチャネル上書き。`"last"` は最後に確認された配信チャネルを再利用します。
- `to`: 明示的な announce ターゲットまたは Webhook URL。Webhook モードでは必須です。
- `accountId`: 配信用の任意のアカウント上書き。
- ジョブごとの `delivery.failureDestination` は、このグローバルデフォルトを上書きします。
- グローバルおよびジョブごとの失敗宛先がどちらも設定されていない場合、すでに `announce` 経由で配信しているジョブは、失敗時にそのプライマリ announce ターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron ジョブ](/ja-JP/automation/cron-jobs)を参照してください。分離 Cron 実行は[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

---

## メディアモデルのテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 受信メッセージ本文全体                            |
| `{{RawBody}}`      | 生の本文 (履歴/送信者ラッパーなし)                |
| `{{BodyStripped}}` | グループメンションが取り除かれた本文              |
| `{{From}}`         | 送信者識別子                                      |
| `{{To}}`           | 宛先識別子                                        |
| `{{MessageSid}}`   | チャネルメッセージ ID                             |
| `{{SessionId}}`    | 現在のセッション UUID                             |
| `{{IsNewSession}}` | 新しいセッションが作成された場合は `"true"`       |
| `{{MediaUrl}}`     | 受信メディアの疑似 URL                            |
| `{{MediaPath}}`    | ローカルメディアパス                              |
| `{{MediaType}}`    | メディア種別 (image/audio/document/…)             |
| `{{Transcript}}`   | 音声トランスクリプト                              |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディアプロンプト      |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数          |
| `{{ChatType}}`     | `"direct"` または `"group"`                       |
| `{{GroupSubject}}` | グループ件名 (ベストエフォート)                   |
| `{{GroupMembers}}` | グループメンバーのプレビュー (ベストエフォート)   |
| `{{SenderName}}`   | 送信者の表示名 (ベストエフォート)                 |
| `{{SenderE164}}`   | 送信者の電話番号 (ベストエフォート)               |
| `{{Provider}}`     | プロバイダーのヒント (whatsapp、telegram、discord など) |

---

## 設定の include (`$include`)

設定を複数のファイルに分割します:

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
- ファイルの配列: 順番にディープマージされます (後のものが前のものを上書き)。
- 兄弟キー: include の後にマージされます (include された値を上書き)。
- ネストされた include: 最大 10 階層まで。
- パス: include しているファイルからの相対パスとして解決されますが、トップレベル設定ディレクトリ (`openclaw.json` の `dirname`) 内に留まる必要があります。絶対パス/`../` 形式は、その境界内に解決される場合にのみ許可されます。
- 1 つのトップレベルセクションのみを変更し、そのセクションが単一ファイル include によって裏付けられている OpenClaw 所有の書き込みは、その include 先ファイルへ書き込みます。たとえば、`plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` で更新し、`openclaw.json` はそのままにします。
- ルート include、include 配列、兄弟上書きがある include は、OpenClaw 所有の書き込みでは読み取り専用です; そのような書き込みは設定をフラット化する代わりに fail closed します。
- エラー: ファイル欠落、解析エラー、循環 include に対する明確なメッセージ。

---

_関連: [設定](/ja-JP/gateway/configuration) · [設定例](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
