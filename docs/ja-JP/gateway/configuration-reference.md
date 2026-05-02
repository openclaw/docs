---
read_when:
    - フィールド単位の正確な設定セマンティクスまたはデフォルトが必要な場合
    - チャンネル、モデル、Gateway、またはツールの設定ブロックを検証している場合
summary: コア OpenClaw キー、デフォルト値、専用サブシステムリファレンスへのリンクを扱う Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-05-02T20:47:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559a52c9ea7428aa0a33b9699eaf144aa114638acf57f813217642319ce77987
    source_path: gateway/configuration-reference.md
    workflow: 16
---

コア設定リファレンス（`~/.openclaw/openclaw.json`）。タスク指向の概要は、[Configuration](/ja-JP/gateway/configuration) を参照してください。

OpenClaw の主要な設定面を扱い、サブシステムに独自の詳細リファレンスがある場合はそこへリンクします。チャネルおよび Plugin 所有のコマンドカタログと、メモリ/QMD の詳細な調整項目は、このページではなくそれぞれのページにあります。

コード上の正:

- `openclaw config schema` は、検証と Control UI に使われる現在の JSON Schema を出力し、利用可能な場合はバンドル済み/Plugin/チャネルのメタデータもマージします
- `config.schema.lookup` は、ドリルダウンツール向けにパススコープのスキーマノードを 1 つ返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のスキーマ面に対して設定ドキュメントのベースラインハッシュを検証します

Agent 参照パス: 編集前に正確なフィールドレベルのドキュメントと制約を確認するには、`gateway` ツールアクション `config.schema.lookup` を使用してください。タスク指向のガイダンスには [Configuration](/ja-JP/gateway/configuration) を使用し、より広いフィールドマップ、デフォルト、サブシステムリファレンスへのリンクにはこのページを使用してください。

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については [Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の組み込み + バンドル済みコマンドカタログについては [Slash commands](/ja-JP/tools/slash-commands)
- チャネル固有のコマンド面については、所有するチャネル/Plugin のページ

設定形式は **JSON5** です（コメントと末尾カンマを使用できます）。すべてのフィールドは任意です。省略時、OpenClaw は安全なデフォルトを使用します。

---

## チャネル

チャネルごとの設定キーは専用ページに移動しました。Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他のバンドル済みチャネル（認証、アクセス制御、複数アカウント、メンションゲーティング）を含む `channels.*` については、[Configuration — channels](/ja-JP/gateway/config-channels) を参照してください。

## Agent defaults、マルチエージェント、セッション、メッセージ

専用ページに移動しました。以下については [Configuration — agents](/ja-JP/gateway/config-agents) を参照してください。

- `agents.defaults.*`（ワークスペース、モデル、thinking、heartbeat、メモリ、メディア、skills、サンドボックス）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションライフサイクル、Compaction、枝刈り）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk モード）
  - `talk.speechLocale`: iOS/macOS の Talk 音声認識向けの任意の BCP 47 ロケール ID
  - `talk.silenceTimeoutMs`: 未設定の場合、Talk はトランスクリプト送信前の一時停止ウィンドウとしてプラットフォームのデフォルトを保持します（`macOS と Android では 700 ms、iOS では 900 ms`）

## ツールとカスタムプロバイダー

ツールポリシー、実験的トグル、プロバイダーに裏付けられたツール設定、カスタムプロバイダー / ベース URL 設定は専用ページに移動しました。[Configuration — tools and custom providers](/ja-JP/gateway/config-tools) を参照してください。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダー設定は [Configuration — tools and custom providers](/ja-JP/gateway/config-tools#custom-providers-and-base-urls) にあります。
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
- `models.providers`: プロバイダー ID をキーとするカスタムプロバイダーマップ。
- `models.pricing.enabled`: sidecar とチャネルが Gateway ready パスに到達した後に開始する、バックグラウンドの価格ブートストラップを制御します。`false` の場合、Gateway は OpenRouter と LiteLLM の価格カタログ取得をスキップします。設定済みの `models.providers.*.models[].cost` 値は、ローカルのコスト見積もりでは引き続き機能します。

## MCP

OpenClaw 管理の MCP サーバー定義は `mcp.servers` 配下にあり、埋め込み Pi やその他のランタイムアダプターにより消費されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、設定編集中に対象サーバーへ接続せずにこのブロックを管理します。

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

- `mcp.servers`: 設定済み MCP ツールを公開するランタイム向けの、名前付き stdio またはリモート MCP サーバー定義。
  リモートエントリは `transport: "streamable-http"` または `transport: "sse"` を使用します。
  `type: "http"` は CLI ネイティブのエイリアスで、`openclaw mcp set` と `openclaw doctor --fix` が正準の `transport` フィールドへ正規化します。
- `mcp.sessionIdleTtlMs`: セッションスコープのバンドル済み MCP ランタイムのアイドル TTL。
  単発の埋め込み実行は実行終了時のクリーンアップを要求します。この TTL は、長時間存続するセッションと将来の呼び出し元に対するバックストップです。
- `mcp.*` 配下の変更は、キャッシュ済みのセッション MCP ランタイムを破棄することでホット適用されます。
  次のツール検出/使用時に、新しい設定からそれらが再作成されるため、削除された `mcp.servers` エントリはアイドル TTL を待たずに即座に回収されます。

ランタイム動作については [MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry) と [CLI backends](/ja-JP/gateway/cli-backends#bundle-mcp-overlays) を参照してください。

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

- `allowBundled`: バンドル済み Skills のみを対象にした任意の許可リスト（管理対象/ワークスペース Skills には影響しません）。
- `load.extraDirs`: 追加の共有 Skills ルート（最も低い優先度）。
- `install.preferBrew`: true の場合、`brew` が利用可能であれば他のインストーラー種別にフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` 仕様向けの Node インストーラー設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、バンドル済み/インストール済みであっても Skills を無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数を宣言する Skills 向けの便利項目（プレーンテキスト文字列または SecretRef オブジェクト）。

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

- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` から読み込まれます。
- 検出は、ネイティブ OpenClaw Plugin に加え、互換性のある Codex バンドルと Claude バンドル（manifest のない Claude デフォルトレイアウトバンドルを含む）を受け付けます。
- **設定変更には gateway の再起動が必要です。**
- `allow`: 任意の許可リスト（一覧にある Plugin のみ読み込みます）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: Plugin レベルの API キー便利フィールド（Plugin が対応している場合）。
- `plugins.entries.<id>.env`: Plugin スコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視します。一方で、レガシーの `modelOverride` と `providerOverride` は保持します。ネイティブ Plugin フックと、対応するバンドル提供フックディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼済みの非バンドル Plugin は、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの型付きフックから生の会話内容を読み取ることができます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この Plugin がバックグラウンドサブエージェント実行ごとに `provider` と `model` のオーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼済みサブエージェントオーバーライド向けの、正準 `provider/model` ターゲットの任意の許可リスト。任意のモデルを意図的に許可したい場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.config`: Plugin 定義の設定オブジェクト（利用可能な場合はネイティブ OpenClaw Plugin スキーマで検証されます）。
- チャネル Plugin のアカウント/ランタイム設定は `channels.<id>` 配下にあり、中央の OpenClaw オプションレジストリではなく、所有する Plugin の manifest `channelConfigs` メタデータで記述されるべきです。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch プロバイダー設定。
  - `apiKey`: Firecrawl API キー（SecretRef を受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、レガシー `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数にフォールバックします。
  - `baseUrl`: Firecrawl API ベース URL（デフォルト: `https://api.firecrawl.dev`; セルフホストのオーバーライドはプライベート/内部エンドポイントを対象にする必要があります）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ期間（ミリ秒）（デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプリクエストのタイムアウト（秒）（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok Web 検索）設定。
  - `enabled`: X Search プロバイダーを有効にします。
  - `model`: 検索に使用する Grok モデル（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: メモリ dreaming 設定。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: dreaming のマスタースイッチ（デフォルト `false`）。
  - `frequency`: 各 dreaming フルスイープの cron 間隔（デフォルトでは `"0 3 * * *"`）。
  - `model`: 任意の Dream Diary サブエージェントモデルオーバーライド。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。ターゲットを制限するには `allowedModels` と組み合わせてください。モデル利用不可エラーは、セッションデフォルトモデルで 1 回再試行されます。信頼または許可リストの失敗は、暗黙にはフォールバックしません。
  - フェーズポリシーとしきい値は実装詳細です（ユーザー向け設定キーではありません）。
- 完全なメモリ設定は [Memory configuration reference](/ja-JP/reference/memory-config) にあります。
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化された Claude バンドル Plugin は、`settings.json` から埋め込み Pi デフォルトを提供することもできます。OpenClaw はそれらを生の OpenClaw 設定パッチとしてではなく、サニタイズ済みのエージェント設定として適用します。
- `plugins.slots.memory`: 有効なメモリ Plugin ID を選択します。メモリ Plugin を無効にするには `"none"` を選択します。
- `plugins.slots.contextEngine`: 有効なコンテキストエンジン Plugin ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` です。

[Plugins](/ja-JP/tools/plugin) を参照してください。

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
- `tabCleanup` は、アイドル時間の経過後、またはセッションが上限を超えたときに、追跡対象のプライマリエージェントのタブを回収します。個別のクリーンアップモードを無効にするには、`idleMinutes: 0` または `maxTabsPerSession: 0` を設定します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定の場合は無効になるため、ブラウザナビゲーションはデフォルトで厳格なままです。
- プライベートネットワークのブラウザナビゲーションを意図的に信頼する場合にのみ、`ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定してください。
- 厳格モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）も、到達性/検出チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外には `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはアタッチ専用です（開始/停止/リセットは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用し、プロバイダーが直接 DevTools WebSocket URL を提供する場合は WS(S) を使用します。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび `attachOnly` CDP の到達性とタブを開くリクエストに適用されます。管理対象のループバックプロファイルは、ローカル CDP のデフォルトを維持します。
- 外部管理の CDP サービスがループバック経由で到達可能な場合は、そのプロファイルに `attachOnly: true` を設定します。そうしないと、OpenClaw はループバックポートをローカル管理ブラウザプロファイルとして扱い、ローカルポートの所有権エラーを報告する場合があります。
- `existing-session` プロファイルは CDP ではなく Chrome MCP を使用し、選択したホストまたは接続済みブラウザノード経由でアタッチできます。
- `existing-session` プロファイルでは、Brave や Edge など特定の Chromium ベースのブラウザプロファイルを対象にするために `userDataDir` を設定できます。
- `existing-session` プロファイルは現在の Chrome MCP ルート制限を維持します:
  CSS セレクターターゲティングではなくスナップショット/ref 駆動のアクション、1 ファイルのアップロードフック、ダイアログタイムアウトの上書きなし、`wait --load networkidle` なし、さらに `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションはありません。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。`cdpUrl` はリモート CDP の場合にのみ明示的に設定してください。
- ローカル管理プロファイルでは、そのプロファイル用にグローバルな `browser.executablePath` を上書きするために `executablePath` を設定できます。これを使用して、あるプロファイルを Chrome で、別のプロファイルを Brave で実行できます。
- ローカル管理プロファイルは、プロセス開始後の Chrome CDP HTTP 検出に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP WebSocket 準備完了に `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に起動するものの準備完了チェックが起動と競合する遅いホストでは、これらを引き上げてください。どちらの値も `120000` ms までの正の整数である必要があり、無効な設定値は拒否されます。
- 自動検出順序: Chromium ベースの場合はデフォルトブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、Chromium 起動前に OS のホームディレクトリとして `~` と `~/...` を受け付けます。
  `existing-session` プロファイルのプロファイル単位の `userDataDir` もチルダ展開されます。
- コントロールサービス: ループバックのみ（ポートは `gateway.port` から派生、デフォルトは `18791`）。
- `extraArgs` はローカル Chromium 起動に追加の起動フラグを追加します（例: `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグ）。

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

- `seamColor`: ネイティブアプリ UI chrome のアクセントカラー（Talk Mode の吹き出しの色合いなど）。
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

<Accordion title="Gateway フィールドの詳細">

- `mode`: `local` (Gateway を実行) または `remote` (リモート Gateway に接続)。`local` でない限り、Gateway は起動を拒否します。
- `port`: WS + HTTP 用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IP のみ)、または `custom`。
- **レガシー bind エイリアス**: `gateway.bind` では、ホストエイリアス (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`) ではなく、bind モード値 (`auto`、`loopback`、`lan`、`tailnet`、`custom`) を使用します。
- **Docker メモ**: デフォルトの `loopback` bind は、コンテナ内の `127.0.0.1` で待ち受けます。Docker ブリッジネットワーク (`-p 18789:18789`) では、トラフィックは `eth0` に到着するため、Gateway に到達できません。すべてのインターフェイスで待ち受けるには、`--network host` を使用するか、`bind: "lan"` (または `customBindHost: "0.0.0.0"` を指定した `bind: "custom"`) を設定します。
- **認証**: デフォルトで必須です。非ループバック bind には Gateway 認証が必要です。実際には、これは共有トークン/パスワード、または `gateway.auth.mode: "trusted-proxy"` を指定した ID 対応リバースプロキシを意味します。オンボーディングウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成されている場合 (SecretRef を含む)、`gateway.auth.mode` を明示的に `token` または `password` に設定します。両方が構成されていて mode が未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモードです。信頼された local loopback 構成にのみ使用してください。これはオンボーディングプロンプトでは意図的に提示されません。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザ/ユーザー認証を ID 対応リバースプロキシに委譲し、`gateway.trustedProxies` からの ID ヘッダーを信頼します ([Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照)。このモードは、デフォルトでは **非ループバック** プロキシ送信元を想定します。同一ホストのループバックリバースプロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。内部の同一ホスト呼び出し元は、ローカル直接フォールバックとして `gateway.auth.password` を使用できます。`gateway.auth.token` は trusted-proxy モードと引き続き相互排他的です。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve ID ヘッダーで Control UI/WebSocket 認証を満たせます (`tailscale whois` によって検証)。HTTP API エンドポイントは、その Tailscale ヘッダー認証を **使用しません**。代わりに Gateway の通常の HTTP 認証モードに従います。このトークンなしフローは、Gateway ホストが信頼されていることを前提とします。`tailscale.mode = "serve"` の場合、デフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアント IP ごと、および認証スコープごとに適用されます (shared-secret と device-token は独立して追跡されます)。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, clientIp}` の失敗試行は、失敗書き込みの前に直列化されます。そのため、同じクライアントからの同時の不正な試行は、どちらも単なる不一致として競合通過するのではなく、2 番目のリクエストでリミッターに達する可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックも意図的にレート制限したい場合 (テスト構成や厳格なプロキシデプロイなど) は、`false` に設定します。
- ブラウザ由来の WS 認証試行は常に、ループバック除外を無効にしてスロットリングされます (ブラウザベースの localhost ブルートフォースに対する多層防御)。
- ループバック上では、これらのブラウザ由来のロックアウトは正規化された `Origin`
  値ごとに分離されるため、ある localhost オリジンからの繰り返し失敗が、別のオリジンを自動的に
  ロックアウトすることはありません。
- `tailscale.mode`: `serve` (tailnet のみ、ループバック bind) または `funnel` (公開、認証が必要)。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的なブラウザオリジン許可リスト。非ループバックオリジンからブラウザクライアントが想定される場合に必要です。
- `controlUi.chatMessageMaxWidth`: グループ化された Control UI チャットメッセージの任意の最大幅。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)` などの制約付き CSS 幅値を受け付けます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダーオリジンポリシーに意図的に依存するデプロイ向けに、Host ヘッダーオリジンフォールバックを有効にする危険なモードです。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。`direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼されたプライベートネットワーク
  IP への平文 `ws://` を許可する、クライアント側プロセス環境の
  緊急回避オーバーライドです。平文のデフォルトは引き続きループバックのみです。対応する `openclaw.json`
  設定はなく、
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` などのブラウザプライベートネットワーク設定は Gateway
  WebSocket クライアントに影響しません。
- `gateway.remote.token` / `.password` はリモートクライアント認証情報フィールドです。それ自体では Gateway 認証を構成しません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOS ビルドがリレー対応登録を Gateway に公開した後で使用する、外部 APNs リレーのベース HTTPS URL。この URL は iOS ビルドにコンパイルされたリレー URL と一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gateway からリレーへの送信タイムアウト (ミリ秒)。デフォルトは `10000` です。
- リレー対応登録は特定の Gateway ID に委譲されます。ペアリングされた iOS アプリは `gateway.identity.get` を取得し、その ID をリレー登録に含め、登録スコープの送信許可を Gateway に転送します。別の Gateway はその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記のリレー設定用の一時的な環境オーバーライドです。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ループバック HTTP リレー URL 用の開発専用エスケープハッチです。本番リレー URL は HTTPS のままにしてください。
- `gateway.handshakeTimeoutMs`: 認証前 Gateway WebSocket ハンドシェイクタイムアウト (ミリ秒)。デフォルト: `15000`。設定されている場合、`OPENCLAW_HANDSHAKE_TIMEOUT_MS` が優先されます。起動ウォームアップがまだ落ち着いていない間にローカルクライアントが接続できる、負荷の高いホストや低電力ホストでは、この値を増やしてください。
- `gateway.channelHealthCheckMinutes`: チャネルヘルスモニター間隔 (分)。ヘルスモニターによる再起動をグローバルに無効化するには `0` を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale ソケットしきい値 (分)。これは `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング 1 時間あたりのチャネル/アカウントごとのヘルスモニター再起動の最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターを有効にしたまま、チャネルごとにヘルスモニター再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャネル向けのアカウントごとのオーバーライド。設定されている場合、チャネルレベルのオーバーライドより優先されます。
- ローカル Gateway 呼び出しパスは、`gateway.auth.*` が未設定の場合にのみ、フォールバックとして `gateway.remote.*` を使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に構成され、解決できない場合、解決はフェイルクローズします (リモートフォールバックによる隠蔽なし)。
- `trustedProxies`: TLS を終端する、または転送クライアントヘッダーを注入するリバースプロキシ IP。管理下にあるプロキシのみを列挙してください。ループバックエントリは、同一ホストのプロキシ/ローカル検出構成 (たとえば Tailscale Serve やローカルリバースプロキシ) でも有効ですが、ループバックリクエストを `gateway.auth.mode: "trusted-proxy"` の対象にするわけでは **ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに Gateway は `X-Real-IP` を受け入れます。フェイルクローズ動作のため、デフォルトは `false` です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求されたスコープがない初回ノードデバイスペアリングを自動承認するための任意の CIDR/IP 許可リスト。未設定の場合は無効です。これはオペレーター/ブラウザ/Control UI/WebChat ペアリングを自動承認せず、ロール、スコープ、メタデータ、公開鍵のアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリング後およびプラットフォーム許可リスト評価後に、宣言されたノードコマンドをグローバルに許可/拒否で整形します。`camera.snap`、`camera.clip`、`screen.record` などの危険なノードコマンドにオプトインするには `allowCommands` を使用します。`denyCommands` は、プラットフォームデフォルトまたは明示的な許可により本来含まれる場合でも、そのコマンドを削除します。ノードが宣言済みコマンドリストを変更した後は、そのデバイスペアリングを拒否して再承認し、Gateway が更新されたコマンドスナップショットを保存するようにしてください。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` でブロックされる追加ツール名 (デフォルト拒否リストを拡張)。
- `gateway.tools.allow`: デフォルト HTTP 拒否リストからツール名を削除します。

</Accordion>

### OpenAI 互換エンドポイント

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効化します。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の許可リストは未設定として扱われます。URL 取得を無効化するには `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使用します。
- 任意のレスポンス強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (管理下の HTTPS オリジンにのみ設定してください。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### マルチインスタンス分離

一意のポートと状態ディレクトリを使用して、1 台のホストで複数の Gateway を実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

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

- `enabled`: Gateway リスナーで TLS 終端 (HTTPS/WSS) を有効化します (デフォルト: `false`)。
- `autoGenerate`: 明示的なファイルが構成されていない場合に、ローカルの自己署名証明書/鍵ペアを自動生成します。ローカル/開発用途のみです。
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

- `mode`: 実行時に構成編集をどのように適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: 構成変更時に常に Gateway プロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"` (デフォルト): まずホットリロードを試行し、必要な場合は再起動にフォールバックします。
- `debounceMs`: 構成変更を適用する前のデバウンス期間 (ミリ秒、非負整数)。
- `deferralTimeoutMs`: 再起動を強制する前に進行中の操作を待機する任意の最大時間 (ミリ秒)。デフォルトの有界待機 (`300000`) を使用するには省略します。無期限に待機し、定期的に未完了警告をログ出力するには `0` を設定します。

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
クエリ文字列の hook トークンは拒否されます。

検証と安全性に関する注意:

- `hooks.enabled=true` には空でない `hooks.token` が必要です。
- `hooks.token` は `gateway.auth.token` と **異なる** 必要があります。Gateway トークンの再利用は拒否されます。
- `hooks.path` に `/` は指定できません。`/hooks` のような専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。
- マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的なマッピングキーでは、このオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け入れられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されます
  - テンプレートでレンダリングされたマッピングの `sessionKey` 値は外部から提供されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="Mapping details">

- `match.path` は `/hooks` の後のサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パス用のペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` は hook アクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` の内部に留まります（絶対パスとトラバーサルは拒否されます）。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` の下に置いてください。ワークスペースの skill ディレクトリは拒否されます。`openclaw doctor` がこのパスを無効と報告する場合は、transform モジュールを hooks transforms ディレクトリに移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントへルーティングします。不明な ID はデフォルトへフォールバックします。
- `allowedAgentIds`: 明示的なルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` なしで hook エージェントを実行するための任意の固定セッションキーです。
- `allowRequestSessionKey`: `/hooks/agent` の呼び出し元とテンプレート駆動のマッピングセッションキーが `sessionKey` を設定できるようにします（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（リクエスト + マッピング）向けの任意のプレフィックス許可リストです（例: `["hook:"]`）。マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は必須になります。
- `deliver: true` は最終返信をチャンネルへ送信します。`channel` のデフォルトは `last` です。
- `model` はこの hook 実行の LLM を上書きします（モデルカタログが設定されている場合は許可されている必要があります）。

</Accordion>

### Gmail 連携

- 組み込みの Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- そのメッセージごとのルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、Gmail 名前空間に一致するように `hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:", "hook:gmail:"]`）。
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

- 設定されている場合、Gateway は起動時に `gog gmail watch serve` を自動開始します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
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

- Gateway ポート配下の HTTP で、エージェントが編集可能な HTML/CSS/JS と A2UI を配信します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル限定: `gateway.bind: "loopback"`（デフォルト）を維持してください。
- 非 loopback バインド: canvas ルートには、他の Gateway HTTP サーフェスと同様に Gateway 認証（トークン/パスワード/trusted-proxy）が必要です。
- Node WebView は通常、認証ヘッダーを送信しません。Node がペアリングされ接続された後、Gateway は canvas/A2UI アクセス用に Node スコープの capability URL を通知します。
- Capability URL はアクティブな Node WS セッションにバインドされ、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
- 配信される HTML にライブリロードクライアントを注入します。
- 空の場合はスターター `index.html` を自動作成します。
- A2UI も `/__openclaw__/a2ui/` で配信します。
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

- `minimal`（デフォルト）: TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。
- ホスト名は、有効な DNS ラベルである場合はシステムホスト名がデフォルトになり、そうでない場合は `openclaw` にフォールバックします。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。クロスネットワーク検出には、DNS サーバー（CoreDNS 推奨）+ Tailscale スプリット DNS と組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env`（インライン env var）

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

- インライン env var は、プロセス環境にそのキーがない場合にのみ適用されます。
- `.env` ファイル: CWD の `.env` + `~/.openclaw/.env`（どちらも既存の変数を上書きしません）。
- `shellEnv`: ログインシェルプロファイルから、欠けている想定キーをインポートします。
- 完全な優先順位については [環境](/ja-JP/help/environment) を参照してください。

### Env var 置換

任意の設定文字列内で `${VAR_NAME}` により env var を参照します:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字の名前のみです: `[A-Z_][A-Z0-9_]*`。
- 変数が存在しない、または空の場合、設定読み込み時にエラーを投げます。
- リテラルの `${VAR}` には `$${VAR}` でエスケープします。
- `$include` と併用できます。

---

## シークレット

Secret ref は追加的です。平文の値も引き続き機能します。

### `SecretRef`

1 つのオブジェクト形状を使用します:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON ポインター（例: `"/providers/openai/apiKey"`）
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` の id には、スラッシュで区切られたパスセグメントとして `.` または `..` を含めてはいけません（例: `a/../b` は拒否されます）

### サポートされる認証情報サーフェス

- 正規マトリクス: [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、サポートされる `openclaw.json` の認証情報パスを対象にします。
- `auth-profiles.json` の ref は、ランタイム解決と監査カバレッジに含まれます。

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
- Windows ACL 検証が利用できない場合、file および exec プロバイダーパスは fail closed します。検証できない信頼済みパスに対してのみ `allowInsecurePath: true` を設定してください。
- `exec` プロバイダーには絶対 `command` パスが必要で、stdin/stdout 上でプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決後のターゲットパスを検証しながらシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、信頼済みディレクトリのチェックは解決後のターゲットパスに適用されます。
- `exec` 子環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- Secret ref はアクティベーション時にインメモリスナップショットへ解決され、その後リクエストパスはスナップショットのみを読み取ります。
- アクティベーション中はアクティブサーフェスフィルタリングが適用されます。有効化されたサーフェス上の未解決 ref は起動/リロードを失敗させ、非アクティブサーフェスは診断付きでスキップされます。

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
- `auth-profiles.json` は、静的な認証情報モード向けに値レベルの ref（`api_key` 用の `keyRef`、`token` 用の `tokenRef`）をサポートします。
- `{ "provider": { "apiKey": "..." } }` のような従来のフラットな `auth-profiles.json` マップはランタイム形式ではありません。`openclaw doctor --fix` は、`.legacy-flat.*.bak` バックアップ付きで正規の `provider:default` API キープロファイルへ書き換えます。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef ベースの認証プロファイル認証情報をサポートしません。
- 静的なランタイム認証情報は、解決済みのインメモリスナップショットから取得されます。従来の静的な `auth.json` エントリは、検出時に削除されます。
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

- `billingBackoffHours`: プロファイルが実際の請求/クレジット不足エラーによって失敗した場合の基本バックオフ時間（時間単位、デフォルト: `5`）。明示的な請求関連の文言は `401`/`403` レスポンスでもここに分類されることがありますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーの範囲内に留まります（例: OpenRouter の `Key limit exceeded`）。再試行可能な HTTP `402` の使用枠、または組織/ワークスペースの利用上限メッセージは、代わりに `rate_limit` パスに留まります。
- `billingBackoffHoursByProvider`: 請求バックオフ時間に対する、任意のプロバイダー別上書き。
- `billingMaxHours`: 請求バックオフの指数的増加の上限（時間単位、デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼度の `auth_permanent` 失敗に対する基本バックオフ時間（分単位、デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加の上限（分単位、デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用されるローリングウィンドウ（時間単位、デフォルト: `24`）。
- `overloadedProfileRotations`: 過負荷エラー時にモデルフォールバックへ切り替える前に行う、同一プロバイダー内の認証プロファイルローテーションの最大数（デフォルト: `1`）。`ModelNotReadyException` などのプロバイダー混雑形状はここに分類されます。
- `overloadedBackoffMs`: 過負荷のプロバイダー/プロファイルローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: レート制限エラー時にモデルフォールバックへ切り替える前に行う、同一プロバイダー内の認証プロファイルローテーションの最大数（デフォルト: `1`）。このレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` などのプロバイダー由来の文言が含まれます。

---

## ログ出力

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
- 安定したパスを使うには `logging.file` を設定します。
- `--verbose` の場合、`consoleLevel` は `debug` に引き上げられます。
- `maxFileBytes`: ローテーション前のアクティブなログファイルの最大サイズ（バイト単位、正の整数、デフォルト: `104857600` = 100 MB）。OpenClaw はアクティブファイルの横に、番号付きアーカイブを最大 5 個保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対するベストエフォートのマスキング。`redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効にします。UI/ツール/診断の安全面では、送出前に引き続きシークレットが秘匿されます。

---

## 診断

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

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

- `enabled`: 計装出力のマスタートグル（デフォルト: `true`）。
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列（`"telegram.*"` や `"*"` などのワイルドカードをサポート）。
- `stuckSessionWarnMs`: 長時間実行中の処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` として分類するための、進行なし経過時間のしきい値（ミリ秒）。返信、ツール、ステータス、ブロック、ACP 進行はタイマーをリセットします。繰り返される `session.stuck` 診断は、変化がない間はバックオフします。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効にします（デフォルト: `false`）。完全な設定、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 任意のシグナル別 OTLP エンドポイント。設定されている場合、そのシグナルに限り `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効にします。
- `otel.sampleRate`: トレースサンプリング率 `0`–`1`。
- `otel.flushIntervalMs`: 定期的なテレメトリフラッシュ間隔（ミリ秒）。
- `otel.captureContent`: OTEL span 属性への生コンテンツキャプチャをオプトインで有効にします。デフォルトはオフです。ブール値 `true` は非システムのメッセージ/ツールコンテンツをキャプチャします。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` を明示的に有効化できます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新の実験的な GenAI span プロバイダー属性のための環境トグル。デフォルトでは互換性のため、span は従来の `gen_ai.system` 属性を保持します。GenAI メトリクスは境界付きのセマンティック属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: グローバル OpenTelemetry SDK をすでに登録しているホスト向けの環境トグル。OpenClaw は診断リスナーをアクティブに保ったまま、Plugin 所有の SDK 起動/シャットダウンをスキップします。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 対応する設定キーが未設定の場合に使用される、シグナル別エンドポイント環境変数。
- `cacheTrace.enabled`: 埋め込み実行用にキャッシュトレーススナップショットをログ出力します（デフォルト: `false`）。
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

- `channel`: npm/git インストールのリリースチャネル — `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: gateway 起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: パッケージインストールのバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャネルの自動適用前の最小遅延時間（時間単位、デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャネルのロールアウト分散ウィンドウの追加時間（時間単位、デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャネルのチェックを実行する頻度（時間単位、デフォルト: `1`、最大: `24`）。

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

- `enabled`: グローバル ACP 機能ゲート（デフォルト: `true`。ACP ディスパッチと spawn affordance を隠すには `false` を設定）。
- `dispatch.enabled`: ACP セッションターンディスパッチ用の独立したゲート（デフォルト: `true`）。ACP コマンドは利用可能なまま、実行をブロックするには `false` を設定します。
- `backend`: デフォルトの ACP ランタイムバックエンド ID（登録済みの ACP ランタイム Plugin と一致している必要があります）。
  先にバックエンド Plugin をインストールし、`plugins.allow` が設定されている場合はバックエンド Plugin ID（例: `acpx`）を含めてください。そうしないと ACP バックエンドは読み込まれません。
- `defaultAgent`: spawn が明示的な対象を指定しない場合のフォールバック ACP 対象エージェント ID。
- `allowedAgents`: ACP ランタイムセッションに許可されるエージェント ID の allowlist。空の場合は追加の制限なしを意味します。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストのアイドルフラッシュウィンドウ（ミリ秒）。
- `stream.maxChunkChars`: ストリーミングブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとに繰り返されるステータス/ツール行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は逐次ストリーミングします。`"final_only"` はターンの終端イベントまでバッファリングします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベントの後に表示テキストを置く前の区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影されるアシスタント出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベントに対するタグ名からブール可視性上書きへのレコード。
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
  - `"random"`（デフォルト）: 面白い/季節のタグラインをローテーションします。
  - `"default"`: 固定の中立的なタグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: タグラインテキストなし（バナータイトル/バージョンは引き続き表示されます）。
- タグラインだけでなくバナー全体を隠すには、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

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

[エージェントデフォルト](/ja-JP/gateway/config-agents#agent-defaults)の `agents.list` ID フィールドを参照してください。

---

## ブリッジ（レガシー、削除済み）

現在のビルドには TCP ブリッジは含まれていません。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーは設定スキーマの一部ではなくなりました（削除されるまで検証は失敗します。`openclaw doctor --fix` で不明なキーを取り除けます）。

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

- `sessionRetention`: 完了した分離 Cron 実行セッションを `sessions.json` から prune するまで保持する期間。アーカイブされた削除済み Cron トランスクリプトのクリーンアップも制御します。デフォルト: `24h`。無効にするには `false` を設定します。
- `runLog.maxBytes`: prune 前の実行ログファイル（`cron/runs/<jobId>.jsonl`）ごとの最大サイズ。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: 実行ログの prune がトリガーされたときに保持される最新行数。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST 配信（`delivery.mode = "webhook"`）に使用されるベアラートークン。省略した場合、認証ヘッダーは送信されません。
- `webhook`: `notify: true` がまだ残っている保存済みジョブにのみ使用される、非推奨のレガシーフォールバック Webhook URL（http/https）。

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

- `maxAttempts`: 一時的なエラーでのワンショットジョブの最大リトライ回数 (デフォルト: `3`; 範囲: `0`–`10`)。
- `backoffMs`: 各リトライ試行のバックオフ遅延を ms で指定する配列 (デフォルト: `[30000, 60000, 300000]`; 1–10 エントリ)。
- `retryOn`: リトライをトリガーするエラータイプ — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`。すべての一時的なタイプをリトライするには省略します。

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
- `cooldownMs`: 同じジョブで繰り返しアラートを送る間の最小ミリ秒数 (非負整数)。
- `includeSkipped`: 連続してスキップされた実行をアラートしきい値にカウントします (デフォルト: `false`)。スキップされた実行は別個に追跡され、実行エラーのバックオフには影響しません。
- `mode`: 配信モード — `"announce"` はチャンネルメッセージ経由で送信し、`"webhook"` は設定済みの Webhook に投稿します。
- `accountId`: アラート配信のスコープを指定する任意のアカウントまたはチャンネル id。

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
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータがある場合はデフォルトで `"announce"` になります。
- `channel`: announce 配信用のチャンネル上書き。`"last"` は最後に判明した配信チャンネルを再利用します。
- `to`: 明示的な announce ターゲットまたは Webhook URL。Webhook モードでは必須です。
- `accountId`: 配信用の任意のアカウント上書き。
- ジョブごとの `delivery.failureDestination` はこのグローバルデフォルトを上書きします。
- グローバルおよびジョブごとの失敗宛先がどちらも設定されていない場合、すでに `announce` で配信しているジョブは失敗時にその主要 announce ターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブの主要 `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron ジョブ](/ja-JP/automation/cron-jobs)を参照してください。分離された Cron 実行は[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

---

## メディアモデルテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完全な受信メッセージ本文                          |
| `{{RawBody}}`      | 生の本文 (履歴/送信者ラッパーなし)                |
| `{{BodyStripped}}` | グループメンションを除去した本文                  |
| `{{From}}`         | 送信者識別子                                      |
| `{{To}}`           | 宛先識別子                                        |
| `{{MessageSid}}`   | チャンネルメッセージ id                           |
| `{{SessionId}}`    | 現在のセッション UUID                             |
| `{{IsNewSession}}` | 新しいセッションが作成された場合は `"true"`       |
| `{{MediaUrl}}`     | 受信メディアの疑似 URL                            |
| `{{MediaPath}}`    | ローカルメディアパス                              |
| `{{MediaType}}`    | メディアタイプ (画像/音声/ドキュメント/…)         |
| `{{Transcript}}`   | 音声トランスクリプト                              |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディアプロンプト      |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数          |
| `{{ChatType}}`     | `"direct"` または `"group"`                       |
| `{{GroupSubject}}` | グループの件名 (ベストエフォート)                 |
| `{{GroupMembers}}` | グループメンバーのプレビュー (ベストエフォート)   |
| `{{SenderName}}`   | 送信者の表示名 (ベストエフォート)                 |
| `{{SenderE164}}`   | 送信者の電話番号 (ベストエフォート)               |
| `{{Provider}}`     | プロバイダーのヒント (WhatsApp、Telegram、Discord など) |

---

## 設定のインクルード (`$include`)

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
- 兄弟キー: インクルード後にマージされます (インクルードされた値を上書き)。
- ネストされたインクルード: 最大 10 階層まで。
- パス: インクルードしているファイルを基準に解決されますが、最上位の設定ディレクトリ (`openclaw.json` の `dirname`) 内に留まる必要があります。絶対パス/`../` 形式は、その境界内に解決される場合にのみ許可されます。
- 1 つの単一ファイルインクルードに裏付けられた最上位セクションだけを変更する OpenClaw 所有の書き込みは、そのインクルード先ファイルへ書き込みます。たとえば、`plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` 内で更新し、`openclaw.json` はそのままにします。
- ルートインクルード、インクルード配列、兄弟上書きを伴うインクルードは、OpenClaw 所有の書き込みでは読み取り専用です。それらの書き込みは設定をフラット化する代わりにフェイルクローズします。
- エラー: ファイル欠落、解析エラー、循環インクルードに対して明確なメッセージを表示します。

---

_関連: [設定](/ja-JP/gateway/configuration) · [設定例](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
