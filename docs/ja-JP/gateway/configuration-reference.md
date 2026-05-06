---
read_when:
    - 正確なフィールドレベルの設定セマンティクスまたはデフォルトが必要な場合
    - チャンネル、モデル、Gateway、またはツールの設定ブロックを検証している
summary: コア OpenClaw キー、デフォルト値、および専用サブシステムリファレンスへのリンクに関する Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-05-06T17:55:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e5f7c2246b28f801d527437ae6242686998f1e8b75fd3977723d240a760d859
    source_path: gateway/configuration-reference.md
    workflow: 16
---

コア設定の `~/.openclaw/openclaw.json` リファレンス。タスク指向の概要は [設定](/ja-JP/gateway/configuration) を参照してください。

OpenClaw の主要な設定サーフェスを扱い、サブシステムに独自の詳細リファレンスがある場合はリンクします。チャネルおよび Plugin が所有するコマンドカタログや詳細なメモリ/QMD ノブは、このページではなく各ページにあります。

コード上の正本:

- `openclaw config schema` は、検証と Control UI に使われるライブ JSON Schema を出力し、利用可能な場合はバンドル/Plugin/チャネルのメタデータもマージします
- `config.schema.lookup` は、ドリルダウンツール用にパススコープのスキーマノードを 1 つ返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のスキーマサーフェスに対して設定ドキュメントのベースラインハッシュを検証します

Agent ルックアップパス: 編集前に正確なフィールドレベルのドキュメントと制約を確認するには、`gateway` ツールアクション `config.schema.lookup` を使用してください。タスク指向のガイダンスには [設定](/ja-JP/gateway/configuration) を、このページはより広いフィールドマップ、既定値、サブシステムリファレンスへのリンクに使用してください。

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については [メモリ設定リファレンス](/ja-JP/reference/memory-config)
- 現在の組み込み + バンドルされたコマンドカタログについては [スラッシュコマンド](/ja-JP/tools/slash-commands)
- チャネル固有のコマンドサーフェスについては、所有するチャネル/Plugin ページ

設定形式は **JSON5** です（コメント + 末尾カンマを使用可能）。すべてのフィールドは任意です - 省略した場合、OpenClaw は安全な既定値を使用します。

---

## チャネル

チャネルごとの設定キーは専用ページに移動しました - Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、その他のバンドルされたチャネル（認証、アクセス制御、マルチアカウント、メンションゲート）を含む `channels.*` については [設定 - チャネル](/ja-JP/gateway/config-channels) を参照してください。

## Agent 既定値、マルチ Agent、セッション、メッセージ

専用ページに移動しました - 次については [設定 - Agent](/ja-JP/gateway/config-agents) を参照してください:

- `agents.defaults.*`（ワークスペース、モデル、思考、Heartbeat、メモリ、メディア、Skills、サンドボックス）
- `multiAgent.*`（マルチ Agent ルーティングとバインディング）
- `session.*`（セッションライフサイクル、Compaction、剪定）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk モード）
  - `talk.speechLocale`: iOS/macOS の Talk 音声認識用の任意の BCP 47 ロケール ID
  - `talk.silenceTimeoutMs`: 未設定の場合、Talk は文字起こしを送信する前にプラットフォーム既定の一時停止時間を保持します（`700 ms on macOS and Android, 900 ms on iOS`）

## ツールとカスタムプロバイダー

ツールポリシー、実験的なトグル、プロバイダーに裏付けられたツール設定、およびカスタムプロバイダー / ベース URL の設定は専用ページに移動しました - [設定 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools) を参照してください。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダー設定は [設定 - ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls) にあります。`models` ルートはグローバルなモデルカタログ動作も所有します。

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
- `models.pricing.enabled`: サイドカーとチャネルが Gateway ready パスに到達した後に開始するバックグラウンド価格ブートストラップを制御します。`false` の場合、Gateway は OpenRouter と LiteLLM の価格カタログ取得をスキップします。構成済みの `models.providers.*.models[].cost` 値は、ローカルのコスト見積もりでは引き続き機能します。

## MCP

OpenClaw 管理の MCP サーバー定義は `mcp.servers` 配下にあり、組み込み Pi やその他のランタイムアダプターによって消費されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、設定編集時にターゲットサーバーへ接続せずにこのブロックを管理します。

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

- `mcp.servers`: 構成済み MCP ツールを公開するランタイム向けの、名前付き stdio またはリモート MCP サーバー定義。
  リモートエントリは `transport: "streamable-http"` または `transport: "sse"` を使用します。`type: "http"` は CLI ネイティブのエイリアスで、`openclaw mcp set` と `openclaw doctor --fix` が正規の `transport` フィールドへ正規化します。
- `mcp.sessionIdleTtlMs`: セッションスコープのバンドル MCP ランタイムのアイドル TTL。
  ワンショットの組み込み実行は実行終了時のクリーンアップを要求します。この TTL は、長時間存続するセッションと将来の呼び出し元のためのバックストップです。
- `mcp.*` 配下の変更は、キャッシュされたセッション MCP ランタイムを破棄することでホット適用されます。
  次回のツール検出/使用時に新しい設定から再作成されるため、削除された `mcp.servers` エントリはアイドル TTL を待たずに即座に回収されます。

ランタイム動作については [MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry) と [CLI バックエンド](/ja-JP/gateway/cli-backends#bundle-mcp-overlays) を参照してください。

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
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

- `allowBundled`: バンドルされた Skills のみを対象にする任意の許可リスト（管理対象/ワークスペース Skills には影響しません）。
- `load.extraDirs`: 追加の共有 Skill ルート（最も低い優先順位）。
- `install.preferBrew`: true の場合、`brew` が利用可能なら他のインストーラー種別へフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` 仕様向けの Node インストーラー優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、バンドル済み/インストール済みであっても Skill を無効化します。
- `entries.<skillKey>.apiKey`: 主要な環境変数を宣言する Skills 向けの便利設定（平文文字列または SecretRef オブジェクト）。

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
- 検出はネイティブ OpenClaw Plugin に加え、互換性のある Codex バンドルと Claude バンドル（マニフェストなしの Claude 既定レイアウトバンドルを含む）を受け入れます。
- **設定変更には gateway の再起動が必要です。**
- `allow`: 任意の許可リスト（リストされた Plugin のみ読み込み）。`deny` が優先されます。
- `bundledDiscovery`: 新しい設定では既定で `"allowlist"` です。そのため、空でない `plugins.allow` は、web-search ランタイムプロバイダーを含むバンドルされたプロバイダー Plugin もゲートします。Doctor は、既存のバンドル済みプロバイダー動作をオプトインまで保持するため、移行済みのレガシー許可リスト設定に `"compat"` を書き込みます。
- `plugins.entries.<id>.apiKey`: Plugin レベルの API キー便利フィールド（Plugin が対応している場合）。
- `plugins.entries.<id>.env`: Plugin スコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、レガシー `before_agent_start` のプロンプト変更フィールドを無視します。一方で、レガシー `modelOverride` と `providerOverride` は保持します。ネイティブ Plugin フックと、対応するバンドル提供フックディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼済みの非バンドル Plugin は、`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end` などの型付きフックから生の会話内容を読み取れます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この Plugin がバックグラウンド subagent 実行ごとに `provider` と `model` の上書きを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼済み subagent 上書き向けの正規 `provider/model` ターゲットの任意の許可リスト。任意のモデルを許可する意図がある場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.config`: Plugin 定義の設定オブジェクト（利用可能な場合はネイティブ OpenClaw Plugin スキーマで検証されます）。
- チャネル Plugin のアカウント/ランタイム設定は `channels.<id>` 配下にあり、中央の OpenClaw オプションレジストリではなく、所有する Plugin のマニフェスト `channelConfigs` メタデータで説明されるべきです。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch プロバイダー設定。
  - `apiKey`: Firecrawl API キー（SecretRef を受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、レガシー `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数にフォールバックします。
  - `baseUrl`: Firecrawl API ベース URL（既定: `https://api.firecrawl.dev`。セルフホストの上書きは private/internal エンドポイントを対象にする必要があります）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（既定: `true`）。
  - `maxAgeMs`: 最大キャッシュ期間（ミリ秒）（既定: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプ要求のタイムアウト（秒）（既定: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search プロバイダーを有効化します。
  - `model`: 検索に使用する Grok モデル（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: メモリ dreaming 設定。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: dreaming のマスタースイッチ（既定 `false`）。
  - `frequency`: 各完全 dreaming スイープの cron 間隔（既定では `"0 3 * * *"`）。
  - `model`: 任意の Dream Diary subagent モデル上書き。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。ターゲットを制限するには `allowedModels` と組み合わせてください。モデルを利用できないエラーは、セッションの既定モデルで 1 回再試行します。信頼または許可リストの失敗は黙ってフォールバックしません。
  - フェーズポリシーとしきい値は実装の詳細です（ユーザー向け設定キーではありません）。
- 完全なメモリ設定は [メモリ設定リファレンス](/ja-JP/reference/memory-config) にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化された Claude バンドル Plugin は、`settings.json` から組み込み Pi の既定値を提供することもできます。OpenClaw はそれらを生の OpenClaw 設定パッチとしてではなく、サニタイズ済み Agent 設定として適用します。
- `plugins.slots.memory`: アクティブなメモリ Plugin ID を選択するか、メモリ Plugin を無効化するには `"none"` を選択します。
- `plugins.slots.contextEngine`: アクティブなコンテキストエンジン Plugin ID を選択します。別のエンジンをインストールして選択しない限り、既定は `"legacy"` です。

[Plugins](/ja-JP/tools/plugin) を参照してください。

---

## コミットメント

`commitments` は推定されたフォローアップメモリを制御します。OpenClaw は会話ターンからチェックインを検出し、Heartbeat 実行を通じて配信できます。

- `commitments.enabled`: 推定フォローアップコミットメントの隠し LLM 抽出、保存、Heartbeat 配信を有効化します。既定: `false`。
- `commitments.maxPerDay`: ローリング 1 日で Agent セッションごとに配信される推定フォローアップコミットメントの最大数。既定: `3`。

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
- `tabCleanup` は、アイドル時間の経過後、またはセッションが上限を超えたときに、追跡対象のプライマリエージェントのタブを回収します。これらの個別のクリーンアップモードを無効にするには、`idleMinutes: 0` または `maxTabsPerSession: 0` を設定します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定の場合は無効になるため、ブラウザーのナビゲーションはデフォルトで厳格なままです。
- プライベートネットワークのブラウザーナビゲーションを意図的に信頼する場合にのみ、`ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定してください。
- 厳格モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）は、到達可能性チェックと検出チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` は、レガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはアタッチ専用です（開始/停止/リセットは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用し、プロバイダーが直接 DevTools WebSocket URL を提供する場合は WS(S) を使用してください。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび `attachOnly` CDP の到達可能性に加え、タブを開くリクエストに適用されます。管理対象の loopback プロファイルは、ローカル CDP のデフォルトを維持します。
- 外部管理の CDP サービスが loopback 経由で到達可能な場合は、そのプロファイルに `attachOnly: true` を設定します。そうしないと、OpenClaw は loopback ポートをローカル管理ブラウザープロファイルとして扱い、ローカルポートの所有権エラーを報告する場合があります。
- `existing-session` プロファイルは CDP の代わりに Chrome MCP を使用し、選択されたホストまたは接続済みブラウザーノード経由でアタッチできます。
- `existing-session` プロファイルでは、Brave や Edge などの特定の Chromium ベースのブラウザープロファイルを対象にするために `userDataDir` を設定できます。
- `existing-session` プロファイルは、現在の Chrome MCP ルート制限を維持します。CSS セレクターターゲティングの代わりに snapshot/ref 駆動のアクション、単一ファイルアップロードフック、ダイアログタイムアウトのオーバーライドなし、`wait --load networkidle` なし、`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなしです。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。リモート CDP の場合にのみ `cdpUrl` を明示的に設定してください。
- ローカル管理プロファイルでは、そのプロファイルのグローバルな `browser.executablePath` を上書きするために `executablePath` を設定できます。これを使用すると、1 つのプロファイルを Chrome で、別のプロファイルを Brave で実行できます。
- ローカル管理プロファイルは、プロセス開始後の Chrome CDP HTTP 検出に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP WebSocket 準備完了に `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に起動するものの、準備完了チェックが起動処理と競合する低速なホストでは、これらの値を引き上げてください。どちらの値も `120000` ミリ秒以下の正の整数である必要があり、無効な設定値は拒否されます。
- 自動検出順序: デフォルトブラウザーが Chromium ベースの場合 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、Chromium 起動前に OS のホームディレクトリとして `~` と `~/...` を受け付けます。`existing-session` プロファイルのプロファイル別 `userDataDir` もチルダ展開されます。
- コントロールサービス: loopback のみ（ポートは `gateway.port` から派生、デフォルトは `18791`）。
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

- `seamColor`: ネイティブアプリ UI chrome のアクセントカラー（Talk Mode のバブルの色合いなど）。
- `assistant`: Control UI の ID 上書き。アクティブなエージェント ID にフォールバックします。

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

<Accordion title="Gateway field details">

- `mode`: `local`（Gateway を実行）または `remote`（リモート Gateway に接続）。`local` でない限り Gateway は起動を拒否します。
- `port`: WS + HTTP 用の単一多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IP のみ）、または `custom`。
- **レガシー bind エイリアス**: `gateway.bind` ではホストエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind モード値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用します。
- **Docker の注意**: デフォルトの `loopback` bind はコンテナ内の `127.0.0.1` で待ち受けます。Docker ブリッジネットワーク（`-p 18789:18789`）ではトラフィックが `eth0` に到着するため、gateway に到達できません。すべてのインターフェイスで待ち受けるには、`--network host` を使用するか、`bind: "lan"`（または `customBindHost: "0.0.0.0"` とともに `bind: "custom"`）を設定します。
- **認証**: デフォルトで必須です。非 loopback bind には Gateway 認証が必要です。実際には、共有トークン/パスワード、または `gateway.auth.mode: "trusted-proxy"` を使う ID 認識リバースプロキシを意味します。オンボーディング ウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が（SecretRefs を含めて）設定されている場合は、`gateway.auth.mode` を明示的に `token` または `password` に設定してください。両方が設定され、mode が未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモード。信頼済みの local loopback 構成にのみ使用してください。これは意図的にオンボーディングプロンプトでは提示されません。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザ/ユーザー認証を ID 認識リバースプロキシに委譲し、`gateway.trustedProxies` からの ID ヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。このモードはデフォルトで **非 loopback** のプロキシソースを想定します。同一ホストの loopback リバースプロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。内部の同一ホスト呼び出し元は、ローカル直接フォールバックとして `gateway.auth.password` を使用できます。`gateway.auth.token` は trusted-proxy モードと引き続き相互排他的です。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve の ID ヘッダーで Control UI/WebSocket 認証を満たせます（`tailscale whois` で検証）。HTTP API エンドポイントは、その Tailscale ヘッダー認証を**使用しません**。代わりに Gateway の通常の HTTP 認証モードに従います。このトークンレスフローは、Gateway ホストが信頼されていることを前提とします。`tailscale.mode = "serve"` の場合、デフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアント IP ごと、および認証スコープごと（shared-secret と device-token は個別に追跡）に適用されます。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, clientIp}` の失敗試行は、失敗を書き込む前に直列化されます。そのため、同じクライアントからの同時の不正な試行は、単なる不一致として両方が通過するのではなく、2 つ目のリクエストでリミッターに達する可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックも意図的にレート制限したい場合（テスト構成や厳格なプロキシデプロイなど）は `false` を設定します。
- ブラウザ起点の WS 認証試行は、loopback 免除を無効にして常にスロットリングされます（ブラウザベースの localhost 総当たり攻撃に対する多層防御）。
- loopback では、これらのブラウザ起点ロックアウトは正規化された `Origin`
  値ごとに分離されるため、ある localhost origin からの失敗が繰り返されても、別の origin が自動的に
  ロックアウトされることはありません。
- `tailscale.mode`: `serve`（tailnet のみ、loopback bind）または `funnel`（公開、認証必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的なブラウザ origin 許可リスト。ブラウザクライアントが非 loopback origin から想定される場合に必要です。
- `controlUi.chatMessageMaxWidth`: グループ化された Control UI チャットメッセージの任意の最大幅。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)` などの制約付き CSS 幅値を受け付けます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダー origin ポリシーに意図的に依存するデプロイで、Host ヘッダー origin フォールバックを有効にする危険なモード。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: クライアント側プロセス環境の
  緊急回避オーバーライドで、信頼済みプライベートネットワーク
  IP への平文 `ws://` を許可します。平文のデフォルトは引き続き loopback のみです。同等の `openclaw.json`
  設定はなく、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` などのブラウザのプライベートネットワーク設定は Gateway
  WebSocket クライアントに影響しません。
- `gateway.remote.token` / `.password` はリモートクライアントの認証情報フィールドです。それだけでは Gateway 認証を設定しません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOS ビルドがリレー支援登録を Gateway に公開した後に使用する外部 APNs リレーのベース HTTPS URL。この URL は iOS ビルドにコンパイルされたリレー URL と一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gateway からリレーへの送信タイムアウト（ミリ秒）。デフォルトは `10000` です。
- リレー支援登録は、特定の Gateway ID に委譲されます。ペアリング済み iOS アプリは `gateway.identity.get` を取得し、その ID をリレー登録に含め、登録スコープの送信許可を Gateway に転送します。別の Gateway は、その保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記のリレー設定に対する一時的な環境オーバーライド。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP リレー URL 用の開発専用エスケープハッチ。本番リレー URL は HTTPS のままにする必要があります。
- `gateway.handshakeTimeoutMs`: 認証前 Gateway WebSocket ハンドシェイクタイムアウト（ミリ秒）。デフォルト: `15000`。`OPENCLAW_HANDSHAKE_TIMEOUT_MS` が設定されている場合は優先されます。起動時のウォームアップがまだ落ち着いていない間でもローカルクライアントが接続できる、高負荷または低電力のホストでは、この値を増やしてください。
- `gateway.channelHealthCheckMinutes`: チャネルヘルスモニター間隔（分）。グローバルにヘルスモニター再起動を無効にするには `0` を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socket しきい値（分）。これは `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング 1 時間におけるチャネル/アカウントごとのヘルスモニター再起動の最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターを有効にしたまま、チャネルごとにヘルスモニター再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャネル用のアカウントごとのオーバーライド。設定されている場合、チャネルレベルのオーバーライドより優先されます。
- ローカル Gateway 呼び出しパスは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決されていない場合、解決はクローズドに失敗します（リモートフォールバックによる隠蔽なし）。
- `trustedProxies`: TLS を終端する、または転送元クライアントヘッダーを注入するリバースプロキシ IP。制御下にあるプロキシのみを列挙してください。loopback エントリは同一ホストのプロキシ/ローカル検出構成（例: Tailscale Serve やローカルリバースプロキシ）でも有効ですが、loopback リクエストを `gateway.auth.mode: "trusted-proxy"` の対象にするものでは**ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに Gateway が `X-Real-IP` を受け入れます。フェイルクローズ動作用のデフォルトは `false` です。
- `gateway.nodes.pairing.autoApproveCidrs`: 初回ノードデバイスペアリングを、要求スコープなしで自動承認するための任意の CIDR/IP 許可リスト。未設定の場合は無効です。これは operator/browser/Control UI/WebChat のペアリングを自動承認せず、role、scope、metadata、public-key のアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングおよびプラットフォーム許可リスト評価後に、宣言済みノードコマンドをグローバルに許可/拒否で整形します。`camera.snap`、`camera.clip`、`screen.record` などの危険なノードコマンドを有効にするには `allowCommands` を使用します。`denyCommands` は、プラットフォームのデフォルトまたは明示的な許可で含まれる場合でも、そのコマンドを削除します。ノードが宣言済みコマンドリストを変更した後は、そのデバイスペアリングを拒否して再承認し、Gateway が更新済みコマンドスナップショットを保存するようにしてください。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` でブロックされる追加のツール名（デフォルト拒否リストを拡張）。
- `gateway.tools.allow`: デフォルトの HTTP 拒否リストからツール名を削除します。

</Accordion>

### OpenAI 互換エンドポイント

- Chat Completions: デフォルトで無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効化します。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の許可リストは未設定として扱われます。URL 取得を無効にするには、`gateway.http.endpoints.responses.files.allowUrl=false`
    や `gateway.http.endpoints.responses.images.allowUrl=false` を使用します。
- 任意のレスポンス強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（制御下にある HTTPS origin にのみ設定してください。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照）

### マルチインスタンス分離

一意のポートと状態ディレクトリを使用して、1 台のホストで複数の Gateway を実行します:

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

- `enabled`: Gateway リスナー（HTTPS/WSS）で TLS 終端を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカルの自己署名 cert/key ペアを自動生成します。ローカル/開発用途のみ。
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
  - `"restart"`: 設定変更時に Gateway プロセスを常に再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まず hot reload を試し、必要な場合は再起動にフォールバックします。
- `debounceMs`: 設定変更が適用される前のデバウンス期間（ミリ秒、非負整数）。
- `deferralTimeoutMs`: 再起動を強制する前に進行中の操作を待機する最大時間（ミリ秒、任意）。デフォルトの有界待機（`300000`）を使用するには省略します。無期限に待機し、保留中であることを定期的に警告ログへ出力するには `0` を設定します。

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

- `hooks.enabled=true` には空でない `hooks.token` が必要です。
- `hooks.token` は `gateway.auth.token` と**別の値**である必要があります。Gateway トークンの再利用は拒否されます。
- `hooks.path` に `/` は指定できません。`/hooks` のような専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。
- マッピングまたはプリセットでテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定します。静的なマッピングキーでは、このオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け入れられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されます
  - テンプレートでレンダリングされたマッピングの `sessionKey` 値は外部から指定されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="マッピングの詳細">

- `match.path` は `/hooks` の後のサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パスのペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` はフックアクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` の内側に留まります（絶対パスとトラバーサルは拒否されます）。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` 配下に置いてください。ワークスペースの skill ディレクトリは拒否されます。`openclaw doctor` がこのパスを無効として報告する場合は、変換モジュールをフック変換ディレクトリへ移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントへルーティングします。不明な ID はデフォルトにフォールバックします。
- `allowedAgentIds`: 明示的なルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` なしでフックエージェントを実行するための任意の固定セッションキーです。
- `allowRequestSessionKey`: `/hooks/agent` の呼び出し元とテンプレート駆動のマッピングセッションキーが `sessionKey` を設定できるようにします（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（リクエスト + マッピング）に対する任意のプレフィックス許可リストです。例: `["hook:"]`。マッピングまたはプリセットのいずれかでテンプレート化された `sessionKey` を使用する場合は必須になります。
- `deliver: true` は最終返信をチャンネルへ送信します。`channel` のデフォルトは `last` です。
- `model` はこのフック実行の LLM を上書きします（モデルカタログが設定されている場合は許可されている必要があります）。

</Accordion>

### Gmail 連携

- 組み込みの Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- このメッセージ単位のルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するよう制限してください。例: `["hook:", "hook:gmail:"]`。
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

- 設定されている場合、Gateway は起動時に `gog gmail watch serve` を自動起動します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
- Gateway と並行して別の `gog gmail watch serve` を実行しないでください。

---

## Canvas ホスト

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- エージェントが編集可能な HTML/CSS/JS と A2UI を、Gateway ポート配下の HTTP で提供します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル限定: `gateway.bind: "loopback"`（デフォルト）を維持してください。
- 非ループバックのバインド: Canvas ルートには、他の Gateway HTTP サーフェスと同様に Gateway 認証（トークン/パスワード/信頼済みプロキシ）が必要です。
- Node WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされ接続されると、Gateway は Canvas/A2UI アクセス用にノードスコープの capability URL を通知します。
- capability URL はアクティブなノード WS セッションに紐づき、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
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

- `minimal`（バンドルされた `bonjour` plugin が有効な場合のデフォルト）: TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。LAN マルチキャスト広告には、引き続きバンドルされた `bonjour` plugin が有効である必要があります。
- `off`: plugin の有効化状態を変更せずに LAN マルチキャスト広告を抑制します。
- バンドルされた `bonjour` plugin は macOS ホストで自動起動し、Linux、Windows、コンテナ化された Gateway デプロイではオプトインです。
- ホスト名は、有効な DNS ラベルである場合はシステムホスト名がデフォルトになり、そうでない場合は `openclaw` にフォールバックします。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。ネットワークをまたいだ検出には、DNS サーバー（CoreDNS 推奨）+ Tailscale split DNS と組み合わせてください。

セットアップ: `openclaw dns setup --apply`.

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

- インライン環境変数は、プロセス環境にそのキーが存在しない場合にのみ適用されます。
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
- 存在しない、または空の変数は、設定読み込み時にエラーを発生させます。
- リテラルの `${VAR}` には `$${VAR}` でエスケープします。
- `$include` と連携します。

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
- `source: "file"` の id: 絶対 JSON ポインター (例 `"/providers/openai/apiKey"`)
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` の id には、スラッシュ区切りのパスセグメントとして `.` または `..` を含めてはいけません (例 `a/../b` は拒否されます)

### 対応する認証情報サーフェス

- 正規マトリクス: [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、対応する `openclaw.json` 認証情報パスを対象にします。
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

- `file` プロバイダーは `mode: "json"` と `mode: "singleValue"` に対応します (singleValue モードでは `id` は `"value"` でなければなりません)。
- Windows ACL 検証を利用できない場合、file および exec プロバイダーのパスは安全側に倒れて失敗します。検証できない信頼済みパスにのみ `allowInsecurePath: true` を設定してください。
- `exec` プロバイダーには絶対 `command` パスが必要で、stdin/stdout でプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決済みターゲットパスを検証しつつシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定します。
- `trustedDirs` が設定されている場合、信頼済みディレクトリチェックは解決済みターゲットパスに適用されます。
- `exec` 子環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- シークレット参照はアクティベーション時にインメモリスナップショットへ解決され、その後リクエストパスはスナップショットのみを読み取ります。
- アクティベーション中にアクティブサーフェスのフィルタリングが適用されます。有効なサーフェス上の未解決参照は起動/再読み込みを失敗させ、非アクティブなサーフェスは診断付きでスキップされます。

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
- `auth-profiles.json` は、静的認証情報モードに対して値レベルの参照 (`api_key` では `keyRef`、`token` では `tokenRef`) に対応します。
- `{ "provider": { "apiKey": "..." } }` のような従来のフラットな `auth-profiles.json` マップはランタイム形式ではありません。`openclaw doctor --fix` は `.legacy-flat.*.bak` バックアップ付きで、正規の `provider:default` API キープロファイルに書き換えます。
- OAuth モードのプロファイル (`auth.profiles.<id>.mode = "oauth"`) は、SecretRef ベースの認証プロファイル認証情報に対応していません。
- 静的ランタイム認証情報は、インメモリの解決済みスナップショットから取得されます。従来の静的な `auth.json` エントリは、検出時に消去されます。
- 従来の OAuth は `~/.openclaw/credentials/oauth.json` からインポートされます。
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

- `billingBackoffHours`: 実際の請求/クレジット不足エラーによりプロファイルが失敗したときの、時間単位の基本バックオフ (デフォルト: `5`)。明示的な請求関連テキストは `401`/`403` レスポンスでもここに分類されることがありますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーの範囲内にとどまります (例: OpenRouter の `Key limit exceeded`)。再試行可能な HTTP `402` の使用量ウィンドウまたは組織/ワークスペースの支出上限メッセージは、代わりに `rate_limit` パスに残ります。
- `billingBackoffHoursByProvider`: 請求バックオフ時間の任意のプロバイダー別オーバーライド。
- `billingMaxHours`: 請求バックオフの指数的増加に対する時間単位の上限 (デフォルト: `24`)。
- `authPermanentBackoffMinutes`: 高確度の `auth_permanent` 失敗に対する、分単位の基本バックオフ (デフォルト: `10`)。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加に対する分単位の上限 (デフォルト: `60`)。
- `failureWindowHours`: バックオフカウンターに使用される、時間単位のローリングウィンドウ (デフォルト: `24`)。
- `overloadedProfileRotations`: モデルフォールバックへ切り替える前に、過負荷エラーに対して許可される同一プロバイダー内の認証プロファイルローテーションの最大数 (デフォルト: `1`)。`ModelNotReadyException` などのプロバイダー混雑形状はここに分類されます。
- `overloadedBackoffMs`: 過負荷のプロバイダー/プロファイルローテーションを再試行する前の固定遅延 (デフォルト: `0`)。
- `rateLimitedProfileRotations`: モデルフォールバックへ切り替える前に、レート制限エラーに対して許可される同一プロバイダー内の認証プロファイルローテーションの最大数 (デフォルト: `1`)。このレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` など、プロバイダー形状のテキストが含まれます。

---

## ログ記録

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
- `--verbose` のとき、`consoleLevel` は `debug` に上がります。
- `maxFileBytes`: ローテーション前のアクティブなログファイルの最大サイズ (バイト単位、正の整数。デフォルト: `104857600` = 100 MB)。OpenClaw はアクティブファイルの横に、番号付きアーカイブを最大 5 個保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対するベストエフォートのマスク処理。`redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効にします。UI/ツール/診断の安全面では、出力前に引き続きシークレットを伏せます。

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

- `enabled`: 計装出力のマスタートグル (デフォルト: `true`)。
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列 (`"telegram.*"` や `"*"` などのワイルドカードをサポート)。
- `stuckSessionWarnMs`: 長時間実行中の処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` と分類するための、進行なしの経過時間しきい値 (ミリ秒)。返信、ツール、ステータス、ブロック、ACP の進行によりタイマーはリセットされます。繰り返される `session.stuck` 診断は、変化がない間バックオフします。
- `stuckSessionAbortMs`: 回復のため、対象となる停止中のアクティブ作業を中断ドレインできるようになる前の、進行なしの経過時間しきい値 (ミリ秒)。未設定の場合、OpenClaw は少なくとも 10 分かつ `stuckSessionWarnMs` の 5 倍の、より安全な拡張埋め込み実行ウィンドウを使用します。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効にします (デフォルト: `false`)。完全な構成、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 任意のシグナル固有 OTLP エンドポイント。設定すると、そのシグナルについてのみ `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"` (デフォルト) または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効にします。
- `otel.sampleRate`: トレースサンプリングレート `0`-`1`。
- `otel.flushIntervalMs`: 定期テレメトリフラッシュ間隔 (ミリ秒)。
- `otel.captureContent`: OTEL スパン属性に対する生コンテンツキャプチャのオプトイン。デフォルトはオフです。ブール値 `true` はシステム以外のメッセージ/ツールコンテンツをキャプチャします。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` を明示的に有効化できます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新の実験的 GenAI スパンプロバイダー属性用の環境トグル。デフォルトでは、互換性のためスパンは従来の `gen_ai.system` 属性を保持します。GenAI メトリクスは境界付きのセマンティック属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: グローバル OpenTelemetry SDK をすでに登録しているホスト向けの環境トグル。OpenClaw は診断リスナーをアクティブに保ちながら、Plugin 所有の SDK 起動/シャットダウンをスキップします。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 一致する構成キーが未設定のときに使用される、シグナル固有のエンドポイント環境変数。
- `cacheTrace.enabled`: 埋め込み実行のキャッシュトレーススナップショットをログに記録します (デフォルト: `false`)。
- `cacheTrace.filePath`: キャッシュトレース JSONL の出力パス (デフォルト: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: キャッシュトレース出力に含める内容を制御します (すべてのデフォルト: `true`)。

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
- `checkOnStart`: gateway 起動時に npm 更新を確認します (デフォルト: `true`)。
- `auto.enabled`: パッケージインストールのバックグラウンド自動更新を有効にします (デフォルト: `false`)。
- `auto.stableDelayHours`: 安定チャンネルの自動適用前の最小遅延時間 (デフォルト: `6`、最大: `168`)。
- `auto.stableJitterHours`: 安定チャンネルのロールアウト分散用の追加ウィンドウ時間 (デフォルト: `12`、最大: `168`)。
- `auto.betaCheckIntervalHours`: ベータチャンネルのチェックを実行する頻度 (時間単位、デフォルト: `1`、最大: `24`)。

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

- `enabled`: グローバル ACP 機能ゲート (デフォルト: `true`。ACP ディスパッチとスポーン操作を隠すには `false` に設定)。
- `dispatch.enabled`: ACP セッションターンディスパッチ用の独立したゲート (デフォルト: `true`)。ACP コマンドを利用可能にしたまま実行をブロックするには `false` に設定します。
- `backend`: デフォルトの ACP ランタイムバックエンド ID (登録済みの ACP ランタイム Plugin と一致している必要があります)。
  先にバックエンド Plugin をインストールし、`plugins.allow` が設定されている場合はバックエンド Plugin ID (例: `acpx`) を含めてください。含めないと ACP バックエンドは読み込まれません。
- `defaultAgent`: スポーンで明示的な対象が指定されない場合の、フォールバック ACP 対象エージェント ID。
- `allowedAgents`: ACP ランタイムセッションに許可されるエージェント ID の許可リスト。空の場合、追加の制限はありません。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングされたテキストのアイドルフラッシュウィンドウ (ミリ秒)。
- `stream.maxChunkChars`: ストリーミングブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとに繰り返されるステータス/ツール行を抑制します (デフォルト: `true`)。
- `stream.deliveryMode`: `"live"` は増分ストリーミングし、`"final_only"` はターン終端イベントまでバッファリングします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベント後の可視テキスト前に置く区切り (デフォルト: `"paragraph"`)。
- `stream.maxOutputChars`: ACP ターンごとに投影されるアシスタント出力文字の最大数。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベントに対するタグ名からブール値の可視性オーバーライドへのレコード。
- `runtime.ttlMinutes`: ACP セッションワーカーがクリーンアップ対象になるまでのアイドル TTL (分単位)。
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
  - `"random"` (デフォルト): 面白い/季節的なタグラインをローテーションします。
  - `"default"`: 固定の中立的なタグライン (`All your chats, one OpenClaw.`)。
  - `"off"`: タグラインテキストなし (バナータイトル/バージョンは引き続き表示)。
- バナー全体 (タグラインだけでなく) を隠すには、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

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
  },
}
```

---

## アイデンティティ

[エージェントのデフォルト](/ja-JP/gateway/config-agents#agent-defaults) の `agents.list` アイデンティティフィールドを参照してください。

---

## ブリッジ (レガシー、削除済み)

現在のビルドには TCP ブリッジは含まれていません。ノードは Gateway WebSocket 経由で接続します。`bridge.*` キーは構成スキーマの一部ではなくなりました (削除されるまで検証は失敗します。`openclaw doctor --fix` で不明なキーを除去できます)。

<Accordion title="レガシーブリッジ構成 (履歴参照)">

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

- `sessionRetention`: 完了した分離 Cron 実行セッションを `sessions.json` から pruning する前に保持する期間。アーカイブされた削除済み Cron transcript のクリーンアップも制御します。デフォルト: `24h`; 無効にするには `false` を設定します。
- `runLog.maxBytes`: pruning 前の実行ログファイル (`cron/runs/<jobId>.jsonl`) ごとの最大サイズ。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: run-log pruning がトリガーされたときに保持される最新行数。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST 配信 (`delivery.mode = "webhook"`) に使用される bearer token。省略した場合、auth ヘッダーは送信されません。
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

- `maxAttempts`: transient error に対する one-shot ジョブの最大再試行回数 (デフォルト: `3`; 範囲: `0`-`10`)。
- `backoffMs`: 各再試行試行のバックオフ遅延を ms で指定する配列 (デフォルト: `[30000, 60000, 300000]`; 1-10 エントリ)。
- `retryOn`: 再試行をトリガーするエラー種別 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略するとすべての transient 種別を再試行します。

one-shot Cron ジョブにのみ適用されます。繰り返しジョブは別の失敗処理を使用します。

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
- `includeSkipped`: 連続したスキップ実行をアラートしきい値にカウントします (デフォルト: `false`)。スキップされた実行は個別に追跡され、実行エラーのバックオフには影響しません。
- `mode`: 配信モード - `"announce"` はチャンネルメッセージ経由で送信します; `"webhook"` は設定済み Webhook に投稿します。
- `accountId`: アラート配信をスコープするための任意のアカウントまたはチャンネル id。

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
- `mode`: `"announce"` または `"webhook"`; 十分なターゲットデータが存在する場合、デフォルトは `"announce"` です。
- `channel`: announce 配信のチャンネル上書き。`"last"` は最後に確認された配信チャンネルを再利用します。
- `to`: 明示的な announce ターゲットまたは Webhook URL。Webhook モードでは必須です。
- `accountId`: 配信用の任意のアカウント上書き。
- ジョブごとの `delivery.failureDestination` はこのグローバルデフォルトを上書きします。
- グローバルおよびジョブごとの失敗宛先がどちらも設定されていない場合、すでに `announce` 経由で配信しているジョブは、失敗時にそのプライマリ announce ターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron ジョブ](/ja-JP/automation/cron-jobs)を参照してください。分離 Cron 実行は[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

---

## メディアモデルテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                             |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | 完全な受信メッセージ本文                         |
| `{{RawBody}}`      | 生の本文 (履歴/送信者ラッパーなし)               |
| `{{BodyStripped}}` | グループメンションを除去した本文                 |
| `{{From}}`         | 送信者識別子                                     |
| `{{To}}`           | 宛先識別子                                       |
| `{{MessageSid}}`   | チャンネルメッセージ id                          |
| `{{SessionId}}`    | 現在のセッション UUID                            |
| `{{IsNewSession}}` | 新しいセッションが作成された場合は `"true"`      |
| `{{MediaUrl}}`     | 受信メディアの疑似 URL                           |
| `{{MediaPath}}`    | ローカルメディアパス                             |
| `{{MediaType}}`    | メディア種別 (image/audio/document/…)            |
| `{{Transcript}}`   | 音声 transcript                                  |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディアプロンプト     |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数         |
| `{{ChatType}}`     | `"direct"` または `"group"`                      |
| `{{GroupSubject}}` | グループ件名 (ベストエフォート)                  |
| `{{GroupMembers}}` | グループメンバーのプレビュー (ベストエフォート)  |
| `{{SenderName}}`   | 送信者の表示名 (ベストエフォート)                |
| `{{SenderE164}}`   | 送信者の電話番号 (ベストエフォート)              |
| `{{Provider}}`     | Provider ヒント (whatsapp、telegram、discord など) |

---

## Config include (`$include`)

config を複数ファイルに分割します:

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
- ファイルの配列: 順番に deep-merge されます (後のものが前のものを上書き)。
- 兄弟キー: include の後にマージされます (include された値を上書き)。
- ネストされた include: 最大 10 階層まで。
- パス: include しているファイルからの相対として解決されますが、トップレベル config ディレクトリ (`openclaw.json` の `dirname`) の内側に留まる必要があります。絶対パス/`../` 形式は、その境界内に解決される場合にのみ許可されます。
- 単一ファイル include によって裏付けられた 1 つのトップレベルセクションのみを変更する OpenClaw 所有の書き込みは、その include 先ファイルへ書き込みます。たとえば、`plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` 内で更新し、`openclaw.json` はそのまま残します。
- ルート include、include 配列、兄弟上書きを持つ include は、OpenClaw 所有の書き込みでは読み取り専用です; それらの書き込みは config を平坦化する代わりに fail closed します。
- エラー: ファイル欠落、parse error、循環 include に対して明確なメッセージを表示します。

---

_関連: [設定](/ja-JP/gateway/configuration) · [設定例](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
