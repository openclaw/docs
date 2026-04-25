---
read_when:
    - 正確なフィールドレベルの設定セマンティクスまたはデフォルトが必要な場合
    - チャネル、モデル、gateway、またはツールの設定ブロックを検証している場合
summary: コア OpenClaw キー、デフォルト、および専用サブシステムリファレンスへのリンクのための Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-25T18:17:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b7e904455845a9559a0a8ed67b217597819f4a8abc38e6c8ecb69b6481528e8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` 用のコア設定リファレンスです。タスク指向の概要については、[設定](/ja-JP/gateway/configuration) を参照してください。

主な OpenClaw 設定面を扱い、サブシステムに独自のより詳細なリファレンスがある場合はそこへリンクします。チャネルおよび plugin が所有するコマンドカタログや、詳細なメモリ/QMD ノブは、このページではなくそれぞれ専用ページにあります。

コード上の真実:

- `openclaw config schema` は、検証と Control UI に使用されるライブ JSON Schema を出力します。利用可能な場合は、同梱/plugin/チャネルのメタデータもマージされます
- `config.schema.lookup` は、ドリルダウンツール向けにパス単位のスキーマノードを 1 つ返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のスキーマ面に対して config-doc ベースラインハッシュを検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については [メモリ設定リファレンス](/ja-JP/reference/memory-config)
- 現在の組み込み + 同梱コマンドカタログについては [スラッシュコマンド](/ja-JP/tools/slash-commands)
- チャネル固有のコマンド面については各チャネル/plugin の所有ページ

設定形式は **JSON5** です（コメントと末尾カンマを使用可能）。すべてのフィールドは省略可能で、省略時は OpenClaw が安全なデフォルトを使用します。

---

## チャネル

チャネルごとの設定キーは専用ページに移動しました。`channels.*` については
[設定 — チャネル](/ja-JP/gateway/config-channels) を参照してください。
Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、その他の
同梱チャネル（認証、アクセス制御、マルチアカウント、メンションゲーティング）を含みます。

## エージェントのデフォルト、マルチエージェント、セッション、メッセージ

専用ページに移動しました。以下については
[設定 — エージェント](/ja-JP/gateway/config-agents) を参照してください:

- `agents.defaults.*`（ワークスペース、モデル、thinking、Heartbeat、メモリ、メディア、Skills、sandbox）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションライフサイクル、Compaction、プルーニング）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk モード）
  - `talk.silenceTimeoutMs`: 未設定時、Talk は文字起こし送信前にプラットフォーム既定の無音待機ウィンドウを維持します（`macOS と Android では 700 ms、iOS では 900 ms`）

## ツールとカスタムプロバイダー

ツールポリシー、実験的トグル、プロバイダーバックのツール設定、およびカスタム
プロバイダー / ベース URL 設定は専用ページに移動しました。詳しくは
[設定 — ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools) を参照してください。

## MCP

OpenClaw 管理の MCP サーバー定義は `mcp.servers` 配下にあり、
組み込み Pi やその他のランタイムアダプターで消費されます。`openclaw mcp list`、
`show`、`set`、`unset` コマンドは、設定編集時に対象サーバーへ接続せずに
このブロックを管理します。

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
- `mcp.sessionIdleTtlMs`: セッションスコープの同梱 MCP ランタイムに対するアイドル TTL。
  ワンショットの組み込み実行では実行終了時クリーンアップを要求します。この TTL は、
  長寿命セッションや将来の呼び出し元に対するバックストップです。
- `mcp.*` 配下の変更は、キャッシュされたセッション MCP ランタイムを破棄することで即時反映されます。
  次回のツール検出/使用時に新しい設定から再作成されるため、削除された
  `mcp.servers` エントリはアイドル TTL を待たずに即座に回収されます。

ランタイム動作については [MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry) および
[CLI バックエンド](/ja-JP/gateway/cli-backends#bundle-mcp-overlays) を参照してください。

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

- `allowBundled`: 同梱 Skills のみを対象にした任意の allowlist（管理対象/ワークスペース Skills には影響しません）。
- `load.extraDirs`: 追加の共有 skill ルート（優先度は最も低い）。
- `install.preferBrew`: `true` の場合、`brew` が利用可能なら他のインストーラー種別へフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` spec に対する Node インストーラーの優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`: skill が同梱/インストール済みでも無効化します。
- `entries.<skillKey>.apiKey`: 主たる env var を宣言する skill のための簡易 API キー設定（平文文字列または SecretRef オブジェクト）。

---

## プラグイン

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
- 検出では、ネイティブ OpenClaw plugins に加えて、manifest なしの Claude デフォルトレイアウトバンドルを含む互換 Codex バンドルと Claude バンドルを受け付けます。
- **設定変更には gateway の再起動が必要です。**
- `allow`: 任意の allowlist（列挙された plugins のみ読み込み）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: plugin レベルの API キー簡易フィールド（plugin が対応している場合）。
- `plugins.entries.<id>.env`: plugin スコープの env var マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、旧来の `before_agent_start` からのプロンプト変更フィールドを無視します。ただし旧来の `modelOverride` と `providerOverride` は保持します。ネイティブ plugin フックおよび対応するバンドル提供フックディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼された非同梱 plugin は `llm_input`、`llm_output`、`agent_end` などの型付きフックから生の会話内容を読めます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この plugin がバックグラウンド subagent 実行に対して実行ごとの `provider` および `model` オーバーライドを要求できるよう、明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼された subagent オーバーライド向けの任意の正規 `provider/model` ターゲット allowlist。意図的に任意モデルを許可したい場合のみ `"*"` を使用してください。
- `plugins.entries.<id>.config`: plugin 定義の設定オブジェクト（利用可能な場合はネイティブ OpenClaw plugin スキーマで検証されます）。
- チャネル plugin のアカウント/ランタイム設定は `channels.<id>` 配下に置かれ、中央の OpenClaw オプションレジストリではなく、その plugin が所有するマニフェスト `channelConfigs` メタデータで記述されるべきです。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl の web fetch プロバイダー設定。
  - `apiKey`: Firecrawl API キー（SecretRef を受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、旧来の `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` env var にフォールバックします。
  - `baseUrl`: Firecrawl API ベース URL（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: キャッシュの最大保持期間（ミリ秒、デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプリクエストのタイムアウト秒数（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search プロバイダーを有効化します。
  - `model`: 検索に使用する Grok モデル（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: メモリ dreaming 設定。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: dreaming のマスタースイッチ（デフォルト `false`）。
  - `frequency`: 各フル dreaming スイープの Cron 間隔（デフォルトは `"0 3 * * *"`）。
  - フェーズポリシーとしきい値は実装詳細であり、ユーザー向け設定キーではありません。
- 完全なメモリ設定は [メモリ設定リファレンス](/ja-JP/reference/memory-config) にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効な Claude バンドル plugins は、`settings.json` から組み込み Pi のデフォルトも提供できます。OpenClaw はこれを生の OpenClaw 設定パッチではなく、サニタイズ済みエージェント設定として適用します。
- `plugins.slots.memory`: アクティブなメモリ plugin id を選択します。メモリ plugins を無効にするには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブなコンテキストエンジン plugin id を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` です。
- `plugins.installs`: `openclaw plugins update` で使用される CLI 管理のインストールメタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt` を含みます。
  - `plugins.installs.*` は管理対象の状態として扱い、手動編集ではなく CLI コマンドを優先してください。

[プラグイン](/ja-JP/tools/plugin) を参照してください。

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

- `evaluateEnabled: false` は `act:evaluate` と `wait --fn` を無効化します。
- `tabCleanup` は、アイドル時間後、またはセッションが上限を超えたときに、追跡対象のプライマリエージェントタブを回収します。個別のクリーンアップモードを無効にするには、`idleMinutes: 0` または `maxTabsPerSession: 0` を設定します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時は無効のため、ブラウザナビゲーションはデフォルトで strict のままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` は、プライベートネットワークへのブラウザナビゲーションを意図的に信頼する場合にのみ設定してください。
- strict モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）も、到達性/検出チェック時に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` は、旧来のエイリアスとして引き続きサポートされます。
- strict モードでは、明示的な例外には `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルは attach-only です（start/stop/reset は無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用し、
  プロバイダーが直接の DevTools WebSocket URL を提供する場合は WS(S) を使用してください。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび
  `attachOnly` CDP の到達性とタブオープン要求に適用されます。管理された loopback
  プロファイルはローカル CDP のデフォルトを維持します。
- 外部管理の CDP サービスが loopback 経由で到達可能な場合は、その
  プロファイルに `attachOnly: true` を設定してください。そうしないと OpenClaw はその
  loopback ポートをローカル管理ブラウザプロファイルとして扱い、ローカルポート所有権エラーを報告する可能性があります。
- `existing-session` プロファイルは CDP ではなく Chrome MCP を使用し、
  選択したホスト上または接続済みブラウザ node 経由でアタッチできます。
- `existing-session` プロファイルでは、Brave や Edge などの特定の
  Chromium ベースブラウザプロファイルを対象にするために `userDataDir` を設定できます。
- `existing-session` プロファイルは、現在の Chrome MCP ルート制限を維持します:
  CSS セレクターターゲティングではなく snapshot/ref ベースのアクション、
  単一ファイルアップロードフック、ダイアログタイムアウトオーバーライドなし、
  `wait --load networkidle` なし、さらに `responsebody`、PDF エクスポート、
  ダウンロードインターセプト、バッチアクションもありません。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。`cdpUrl` を明示的に設定するのはリモート CDP の場合のみです。
- ローカル管理プロファイルでは、そのプロファイルに対してグローバルな
  `browser.executablePath` を上書きするために `executablePath` を設定できます。
  これにより、あるプロファイルは Chrome、別のプロファイルは Brave で実行できます。
- ローカル管理プロファイルでは、プロセス起動後の Chrome CDP HTTP 検出に
  `browser.localLaunchTimeoutMs` を使用し、起動後の CDP websocket 準備完了には
  `browser.localCdpReadyTimeoutMs` を使用します。Chrome 自体は正常に起動するが、
  準備完了チェックが起動と競合するような低速ホストでは、これらを引き上げてください。
- 自動検出順序: デフォルトブラウザが Chromium ベースならそれ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` は OS のホームディレクトリを表す `~` を受け付けます。
- Control サービス: loopback のみ（ポートは `gateway.port` から導出され、デフォルトは `18791`）。
- `extraArgs` は、追加の起動フラグをローカル Chromium 起動に付加します（たとえば
  `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグなど）。

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

- `seamColor`: ネイティブアプリ UI クローム用のアクセントカラー（Talk Mode バブルの色合いなど）。
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

<Accordion title="Gateway フィールド詳細">

- `mode`: `local`（gateway を実行）または `remote`（リモート gateway に接続）。gateway は `local` でない限り起動を拒否します。
- `port`: WS + HTTP 用の単一多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IP のみ）、または `custom`。
- **旧来の bind エイリアス**: `gateway.bind` では、ホストエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind モード値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Docker に関する注意**: デフォルトの `loopback` bind は、コンテナ内で `127.0.0.1` に対して listen します。Docker ブリッジネットワーク（`-p 18789:18789`）では、トラフィックは `eth0` に到着するため、gateway には到達できません。`--network host` を使用するか、`bind: "lan"`（または `bind: "custom"` と `customBindHost: "0.0.0.0"`）を設定して、すべてのインターフェースで listen してください。
- **認証**: デフォルトで必須です。非 loopback bind では gateway 認証が必要です。実際には、共有トークン/パスワード、または `gateway.auth.mode: "trusted-proxy"` を使用する ID 対応リバースプロキシを意味します。オンボーディングのウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合（SecretRef を含む）は、`gateway.auth.mode` を `token` または `password` に明示設定してください。両方が設定され、mode が未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 認証なしモードを明示します。信頼された local loopback セットアップでのみ使用してください。これは意図的にオンボーディングプロンプトでは提供されません。
- `gateway.auth.mode: "trusted-proxy"`: 認証を ID 対応リバースプロキシに委譲し、`gateway.trustedProxies` からの ID ヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。このモードは **非 loopback** のプロキシソースを前提とします。同一ホスト上の loopback リバースプロキシは trusted-proxy 認証を満たしません。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve の ID ヘッダーが Control UI/WebSocket 認証を満たせます（`tailscale whois` で検証）。HTTP API エンドポイントはこの Tailscale ヘッダー認証を使用せず、通常の HTTP 認証モードに従います。このトークン不要フローは、gateway ホストが信頼されていることを前提とします。`tailscale.mode = "serve"` の場合、デフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアント IP ごと、および認証スコープごとに適用されます（共有シークレットとデバイストークンは独立して追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期 Tailscale Serve の Control UI パスでは、同じ `{scope, clientIp}` に対する失敗試行は、失敗書き込み前に直列化されます。そのため、同じクライアントからの同時の不正試行は、両方が単なる不一致として競合通過するのではなく、2 回目のリクエストでリミッターに達することがあります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックにも意図的にレート制限をかけたい場合（テスト環境や strict なプロキシデプロイなど）は `false` に設定してください。
- ブラウザ由来の WS 認証試行は常に、loopback 免除を無効化した状態でスロットリングされます（ブラウザベースの localhost 総当たり攻撃に対する多層防御）。
- loopback では、これらのブラウザ由来ロックアウトは正規化された `Origin`
  値ごとに分離されるため、ある localhost origin からの繰り返し失敗が、
  別の origin を自動的にロックアウトすることはありません。
- `tailscale.mode`: `serve`（tailnet のみ、loopback bind）または `funnel`（公開、認証必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的なブラウザ origin allowlist。非 loopback origin からのブラウザクライアントが想定される場合は必須です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダー origin ポリシーに意図的に依存するデプロイ向けに、Host ヘッダー origin フォールバックを有効にする危険なモードです。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: クライアント側プロセス環境変数による
  緊急回避オーバーライドで、信頼されたプライベートネットワーク IP に対する平文
  `ws://` を許可します。デフォルトでは平文は loopback のみ許可されます。これに相当する
  `openclaw.json` の設定はなく、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
  のようなブラウザのプライベートネットワーク設定も Gateway WebSocket クライアントには影響しません。
- `gateway.remote.token` / `.password` はリモートクライアント認証情報フィールドです。これ自体では gateway 認証を設定しません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOS ビルドが relay バックの登録を gateway に公開した後に使用される、外部 APNs relay のベース HTTPS URL。この URL は、iOS ビルドにコンパイルされた relay URL と一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: gateway から relay への送信タイムアウト（ミリ秒）。デフォルトは `10000`。
- relay バックの登録は特定の gateway ID に委譲されます。ペアリングされた iOS アプリは `gateway.identity.get` を取得し、その ID を relay 登録に含め、登録スコープの送信許可を gateway に転送します。別の gateway は、その保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記 relay 設定に対する一時的な env オーバーライド。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL 用の開発専用エスケープハッチ。production の relay URL は HTTPS のままにしてください。
- `gateway.channelHealthCheckMinutes`: チャネル health-monitor 間隔（分）。グローバルに health-monitor 再起動を無効にするには `0` を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socket しきい値（分）。これは `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: 1 時間のローリングウィンドウ内で、チャネル/アカウントごとに許可される health-monitor 再起動の最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル monitor を有効のまま維持しつつ、そのチャネルだけ health-monitor 再起動をオプトアウトするための設定。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャネル向けのアカウント単位オーバーライド。設定されている場合、チャネルレベルのオーバーライドより優先されます。
- ローカル gateway の呼び出しパスは、`gateway.auth.*` が未設定の場合に限り `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef により明示設定されていて未解決の場合、解決は fail closed します（リモートフォールバックによるマスキングは行いません）。
- `trustedProxies`: TLS を終端する、または転送元クライアントヘッダーを注入するリバースプロキシの IP。自分が管理するプロキシだけを列挙してください。loopback エントリも、同一ホストのプロキシ/ローカル検出セットアップ（たとえば Tailscale Serve やローカルリバースプロキシ）では有効ですが、loopback リクエストが `gateway.auth.mode: "trusted-proxy"` の対象になるわけでは **ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに gateway は `X-Real-IP` を受け入れます。fail closed 動作のため、デフォルトは `false`。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求スコープがない初回 node デバイスペアリングを自動承認するための任意の CIDR/IP allowlist。未設定時は無効です。これは operator/browser/Control UI/WebChat のペアリングを自動承認せず、role、scope、metadata、公開鍵のアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングおよび allowlist 評価後の、宣言済み node コマンドに対するグローバルな allow/deny 形状設定。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` に対して追加でブロックするツール名（デフォルト deny リストを拡張）。
- `gateway.tools.allow`: デフォルト HTTP deny リストからツール名を除外します。

</Accordion>

### OpenAI 互換エンドポイント

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効化します。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の allowlist は未設定として扱われます。URL 取得を無効化するには、
    `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使用してください。
- 任意のレスポンス強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（自分が管理する HTTPS origin にのみ設定してください。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照）

### マルチインスタンス分離

1 台のホストで複数の gateway を、固有のポートと state dir で実行します:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev`（`~/.openclaw-dev` + ポート `19001` を使用）、`--profile <name>`（`~/.openclaw-<name>` を使用）。

[複数 Gateway](/ja-JP/gateway/multiple-gateways) を参照してください。

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

- `enabled`: gateway リスナーで TLS 終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカル自己署名証明書/鍵ペアを自動生成します。ローカル/開発用途専用です。
- `certPath`: TLS 証明書ファイルのファイルシステムパス。
- `keyPath`: TLS 秘密鍵ファイルのファイルシステムパス。権限を制限してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用の任意の CA バンドルパス。

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: 設定編集をランタイムでどのように適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: 設定変更時に常に gateway プロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まずホットリロードを試み、必要なら再起動にフォールバックします。
- `debounceMs`: 設定変更を適用する前のデバウンス時間（ms、非負整数）。
- `deferralTimeoutMs`: 進行中の操作を待ってから再起動を強制するまでの任意の最大待機時間（ms）。省略するか `0` にすると、無期限に待機し、定期的にまだ保留中であるという警告をログ出力します。

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
- `hooks.token` は `gateway.auth.token` と **別** でなければなりません。Gateway トークンの再利用は拒否されます。
- `hooks.path` は `/` にできません。`/hooks` のような専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（たとえば `["hook:"]`）。
- マッピングまたは preset がテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的マッピングキーにはその opt-in は不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` により解決
  - テンプレート展開されたマッピング `sessionKey` 値は、外部から提供されたものとして扱われ、これも `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="マッピング詳細">

- `match.path` は `/hooks` の後のサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パス向けにペイロードフィールドへ一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` は、フックアクションを返す JS/TS モジュールを指せます。
  - `transform.module` は相対パスでなければならず、`hooks.transformsDir` 内にとどまる必要があります（絶対パスとトラバーサルは拒否されます）。
- `agentId` は特定のエージェントにルーティングします。不明な ID はデフォルトにフォールバックします。
- `allowedAgentIds`: 明示的ルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` がないフックエージェント実行向けの任意の固定 session key。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元とテンプレート駆動のマッピング session key が `sessionKey` を設定できるようにします（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（リクエスト + マッピング）向けの任意のプレフィックス allowlist（例: `["hook:"]`）。いずれかのマッピングまたは preset がテンプレート化された `sessionKey` を使用する場合は必須になります。
- `deliver: true` は最終返信をチャネルに送信します。`channel` のデフォルトは `last` です。
- `model` はこのフック実行の LLM を上書きします（モデルカタログが設定されている場合は許可済みでなければなりません）。

</Accordion>

### Gmail 統合

- 組み込みの Gmail preset は `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- そのメッセージ単位ルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するよう制限してください。たとえば `["hook:", "hook:gmail:"]` です。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化されたデフォルトではなく、静的な `sessionKey` で preset を上書きしてください。

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

## Canvas host

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
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）を維持してください。
- 非 loopback bind: canvas ルートは、他の Gateway HTTP 面と同様に Gateway 認証（token/password/trusted-proxy）が必要です。
- Node WebView は通常認証ヘッダーを送らないため、node がペアリングされ接続されると、Gateway は canvas/A2UI アクセス用の node スコープ capability URL を通知します。
- capability URL はアクティブな node WS セッションに紐付けられ、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
- 配信される HTML に live-reload クライアントを注入します。
- 空の場合はスターター `index.html` を自動作成します。
- A2UI も `/__openclaw__/a2ui/` で配信します。
- 変更には gateway の再起動が必要です。
- 大きなディレクトリや `EMFILE` エラーがある場合は live reload を無効にしてください。

---

## Discovery

### mDNS（Bonjour）

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（デフォルト）: TXT レコードから `cliPath` と `sshPort` を省略します。
- `full`: `cliPath` と `sshPort` を含めます。
- ホスト名のデフォルトは `openclaw` です。`OPENCLAW_MDNS_HOSTNAME` で上書きします。

### 広域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。ネットワークをまたぐ検出には、DNS サーバー（推奨: CoreDNS）+ Tailscale split DNS と組み合わせてください。

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

- インライン env var は、プロセス env にそのキーが存在しない場合にのみ適用されます。
- `.env` ファイル: カレントワーキングディレクトリの `.env` と `~/.openclaw/.env`（いずれも既存の var を上書きしません）。
- `shellEnv`: ログインシェルプロファイルから、期待される不足キーを取り込みます。
- 完全な優先順位については [環境](/ja-JP/help/environment) を参照してください。

### env var 置換

任意の設定文字列で `${VAR_NAME}` を使って env var を参照できます:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 変数が存在しない、または空の場合、設定読み込み時にエラーになります。
- リテラルの `${VAR}` にするには `$${VAR}` でエスケープします。
- `$include` でも機能します。

---

## Secrets

Secret ref は追加的です。平文値も引き続き使用できます。

### `SecretRef`

1 つのオブジェクト形状を使用します:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON pointer（例: `"/providers/openai/apiKey"`）
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` の id には、スラッシュ区切りの `.` または `..` パスセグメントを含めてはいけません（例: `a/../b` は拒否されます）

### 対応する認証情報面

- 正規マトリクス: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、対応する `openclaw.json` の認証情報パスを対象にします。
- `auth-profiles.json` の ref も、ランタイム解決と監査対象に含まれます。

### Secret プロバイダー設定

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

注意:

- `file` プロバイダーは `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue モードでは `id` は `"value"` でなければなりません）。
- file および exec プロバイダーのパスは、Windows ACL 検証が利用できない場合は fail closed します。検証できないが信頼されたパスに対してのみ `allowInsecurePath: true` を設定してください。
- `exec` プロバイダーは絶対 `command` パスを必要とし、stdin/stdout 上のプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクの command パスは拒否されます。解決後のターゲットパスを検証しつつシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定します。
- `trustedDirs` が設定されている場合、trusted-dir チェックは解決後のターゲットパスに適用されます。
- `exec` 子プロセス環境はデフォルトで最小です。必要な変数は `passEnv` で明示的に渡してください。
- Secret ref はアクティベーション時にインメモリスナップショットへ解決され、その後リクエストパスはそのスナップショットのみを読み取ります。
- アクティブ面フィルタリングはアクティベーション中に適用されます。有効な面上の未解決 ref は起動/リロードを失敗させ、非アクティブ面は diagnostics を出しつつスキップされます。

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

- エージェント単位のプロファイルは `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は、静的認証情報モード向けに値レベル ref（`api_key` 用の `keyRef`、`token` 用の `tokenRef`）をサポートします。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef ベースの auth-profile 認証情報をサポートしません。
- 静的ランタイム認証情報は、解決済みのインメモリスナップショットから取得されます。旧来の静的 `auth.json` エントリは、見つかると除去されます。
- 旧来の OAuth インポート元は `~/.openclaw/credentials/oauth.json` です。
- [OAuth](/ja-JP/concepts/oauth) を参照してください。
- Secrets のランタイム動作と `audit/configure/apply` ツールについては [Secrets Management](/ja-JP/gateway/secrets) を参照してください。

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

- `billingBackoffHours`: 真の
  課金/残高不足エラーでプロファイルが失敗したときの基準バックオフ時間（時間単位、デフォルト: `5`）。明示的な課金文言は
  `401`/`403` レスポンスでもここに入る場合がありますが、プロバイダー固有の文言マッチャーは、それを所有するプロバイダーの範囲内にとどまります（例: OpenRouter
  `Key limit exceeded`）。再試行可能な HTTP `402` の利用ウィンドウや
  organization/workspace の利用上限メッセージは、代わりに `rate_limit` パスに残ります。
- `billingBackoffHoursByProvider`: 課金バックオフ時間に対する任意のプロバイダー別オーバーライド。
- `billingMaxHours`: 課金バックオフの指数的増加に対する上限時間（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼度の `auth_permanent` 失敗に対する基準バックオフ時間（分単位、デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加に対する上限分数（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用されるローリングウィンドウ時間（デフォルト: `24`）。
- `overloadedProfileRotations`: 過負荷エラー時に、モデルフォールバックへ切り替える前に許可される同一プロバイダー auth-profile ローテーションの最大数（デフォルト: `1`）。`ModelNotReadyException` のような provider-busy 形状はここに入ります。
- `overloadedBackoffMs`: 過負荷のプロバイダー/プロファイルローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: レート制限エラー時に、モデルフォールバックへ切り替える前に許可される同一プロバイダー auth-profile ローテーションの最大数（デフォルト: `1`）。この rate-limit バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` のようなプロバイダー形状の文言が含まれます。

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
- 安定したパスにするには `logging.file` を設定します。
- `consoleLevel` は `--verbose` のとき `debug` に上がります。
- `maxFileBytes`: 書き込みを抑止する前のログファイル最大サイズ（バイト、正の整数、デフォルト: `524288000` = 500 MB）。production デプロイでは外部ログローテーションを使用してください。

---

## Diagnostics

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
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

- `enabled`: 計測出力のマスタートグルです（デフォルト: `true`）。
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列です（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: セッションが処理状態のままである間に、stuck-session 警告を出力するまでの経過時間しきい値（ms）。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効にします（デフォルト: `false`）。
- `otel.endpoint`: OTel エクスポート先の collector URL。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性用のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: trace、metrics、または log エクスポートを有効にします。
- `otel.sampleRate`: trace サンプリング率 `0`–`1`。
- `otel.flushIntervalMs`: 定期的な telemetry flush 間隔（ms）。
- `otel.captureContent`: OTEL span 属性向けの生コンテンツ取得を opt in する設定です。デフォルトは無効です。真偽値 `true` は非 system メッセージ/ツールコンテンツを取得します。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` を明示的に有効化できます。
- `OPENCLAW_OTEL_PRELOADED=1`: すでにグローバル OpenTelemetry SDK を登録済みのホスト向けの環境トグルです。OpenClaw は plugin 所有の SDK 起動/終了処理をスキップしつつ、diagnostic リスナーは有効のままにします。
- `cacheTrace.enabled`: 組み込み実行向けに cache trace スナップショットをログ出力します（デフォルト: `false`）。
- `cacheTrace.filePath`: cache trace JSONL の出力パス（デフォルト: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: cache trace 出力に何を含めるかを制御します（すべてデフォルト: `true`）。

---

## Update

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

- `channel`: npm/git インストール向けのリリースチャネル — `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: gateway 起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: パッケージインストール向けのバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャネルで自動適用するまでの最小遅延時間（時間、デフォルト: `6`; 最大: `168`）。
- `auto.stableJitterHours`: stable チャネルのロールアウトを分散させる追加ウィンドウ時間（時間、デフォルト: `12`; 最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャネルの確認を実行する頻度（時間、デフォルト: `1`; 最大: `24`）。

---

## ACP

```json5
{
  acp: {
    enabled: false,
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

- `enabled`: グローバル ACP 機能ゲートです（デフォルト: `false`）。
- `dispatch.enabled`: ACP セッションターンのディスパッチ用の独立したゲートです（デフォルト: `true`）。ACP コマンドを利用可能なまま実行をブロックしたい場合は `false` に設定します。
- `backend`: デフォルトの ACP ランタイム backend id（登録済み ACP ランタイム plugin と一致する必要があります）。
- `defaultAgent`: spawn が明示的なターゲットを指定しない場合のフォールバック ACP 対象エージェント id。
- `allowedAgents`: ACP ランタイムセッションで許可されるエージェント id の allowlist。空の場合、追加の制限はありません。
- `maxConcurrentSessions`: 同時にアクティブな ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリームされたテキストに対するアイドル flush ウィンドウ（ms）。
- `stream.maxChunkChars`: ストリームされたブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとの重複するステータス/ツール行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は増分でストリームし、`"final_only"` はターンの終端イベントまでバッファリングします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベントの後、可視テキストの前に挿入する区切り文字です（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影されるアシスタント出力文字数の上限。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリームイベントに対するタグ名ごとの真偽値可視性オーバーライドの記録。
- `runtime.ttlMinutes`: ACP セッションワーカーがクリーンアップ対象になるまでのアイドル TTL（分）。
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
  - `"random"`（デフォルト）: ローテーションするユーモラス/季節的なタグライン。
  - `"default"`: 固定の中立的なタグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: タグラインテキストを表示しません（バナーのタイトル/バージョンは引き続き表示）。
- バナー全体を非表示にするには（タグラインだけではなく）、env `OPENCLAW_HIDE_BANNER=1` を設定してください。

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

## Identity

[エージェントのデフォルト](/ja-JP/gateway/config-agents#agent-defaults) の `agents.list` identity フィールドを参照してください。

---

## Bridge（旧来、削除済み）

現在のビルドには TCP bridge は含まれていません。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーは設定スキーマの一部ではなくなっています（削除するまで検証は失敗します。`openclaw doctor --fix` で未知キーを除去できます）。

<Accordion title="旧来の bridge 設定（歴史的参照）">

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
    maxConcurrentRuns: 2,
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

- `sessionRetention`: 完了した分離 cron 実行セッションを `sessions.json` からプルーニングするまで保持する期間です。アーカイブされた削除済み cron transcript のクリーンアップもこれで制御します。デフォルト: `24h`。無効にするには `false` を設定します。
- `runLog.maxBytes`: プルーニング前の実行ログファイル（`cron/runs/<jobId>.jsonl`）ごとの最大サイズ。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: 実行ログのプルーニングが発生したときに保持される最新行数。デフォルト: `2000`。
- `webhookToken`: cron Webhook POST 配信（`delivery.mode = "webhook"`）に使用される bearer token です。省略時は認証ヘッダーは送信されません。
- `webhook`: 非推奨の旧来フォールバック Webhook URL（http/https）で、保存済みジョブのうち `notify: true` が残っているものにのみ使用されます。

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

- `maxAttempts`: 一時的エラー時のワンショットジョブに対する最大リトライ回数（デフォルト: `3`; 範囲: `0`–`10`）。
- `backoffMs`: 各リトライ試行に対するバックオフ遅延（ms）の配列（デフォルト: `[30000, 60000, 300000]`; 1–10 エントリ）。
- `retryOn`: リトライを発生させるエラー種別 — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略するとすべての一時的種別をリトライします。

ワンショット cron ジョブにのみ適用されます。定期ジョブでは別の失敗処理が使われます。

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: cron ジョブの失敗アラートを有効にします（デフォルト: `false`）。
- `after`: アラート発火までの連続失敗回数（正の整数、最小: `1`）。
- `cooldownMs`: 同じジョブに対する繰り返しアラートの最小間隔（ms、非負整数）。
- `mode`: 配信モード — `"announce"` はチャネルメッセージ経由で送信し、`"webhook"` は設定済み Webhook に POST します。
- `accountId`: アラート配信先を限定する任意のアカウントまたはチャネル id。

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

- すべてのジョブにまたがる cron 失敗通知のデフォルト宛先です。
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータがある場合、デフォルトは `"announce"` です。
- `channel`: announce 配信向けのチャネル上書き。`"last"` は最後に既知の配信チャネルを再利用します。
- `to`: 明示的な announce ターゲットまたは Webhook URL。webhook モードでは必須です。
- `accountId`: 配信向けの任意のアカウント上書き。
- ジョブ単位の `delivery.failureDestination` は、このグローバルデフォルトを上書きします。
- グローバルにもジョブ単位にも失敗宛先が設定されていない場合、すでに `announce` で配信するジョブは、失敗時にそのプライマリ announce ターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` のジョブでのみサポートされます。

[Cron Jobs](/ja-JP/automation/cron-jobs) を参照してください。分離された cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

---

## メディアモデルテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| 変数 | 説明 |
| ------------------ | ------------------------------------------------- |
| `{{Body}}` | 完全な受信メッセージ本文 |
| `{{RawBody}}` | 生の本文（履歴/送信者ラッパーなし） |
| `{{BodyStripped}}` | グループメンションを除去した本文 |
| `{{From}}` | 送信者識別子 |
| `{{To}}` | 宛先識別子 |
| `{{MessageSid}}` | チャネルメッセージ id |
| `{{SessionId}}` | 現在のセッション UUID |
| `{{IsNewSession}}` | 新しいセッションが作成されたとき `"true"` |
| `{{MediaUrl}}` | 受信メディアの疑似 URL |
| `{{MediaPath}}` | ローカルメディアパス |
| `{{MediaType}}` | メディア種別（image/audio/document/…） |
| `{{Transcript}}` | 音声文字起こし |
| `{{Prompt}}` | CLI エントリ向けに解決されたメディアプロンプト |
| `{{MaxChars}}` | CLI エントリ向けに解決された最大出力文字数 |
| `{{ChatType}}` | `"direct"` または `"group"` |
| `{{GroupSubject}}` | グループ件名（ベストエフォート） |
| `{{GroupMembers}}` | グループメンバーのプレビュー（ベストエフォート） |
| `{{SenderName}}` | 送信者表示名（ベストエフォート） |
| `{{SenderE164}}` | 送信者電話番号（ベストエフォート） |
| `{{Provider}}` | プロバイダーヒント（whatsapp、telegram、discord など） |

---

## 設定 include (`$include`)

設定を複数ファイルに分割できます:

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

- 単一ファイル: そのオブジェクト全体を置き換えます。
- ファイル配列: 順番にディープマージされます（後のものが前を上書き）。
- 兄弟キー: include 後にマージされます（include された値を上書き）。
- ネストされた include: 最大 10 レベルまで。
- パス: include 元ファイルからの相対パスで解決されますが、トップレベル設定ディレクトリ（`openclaw.json` の `dirname`）内にとどまる必要があります。絶対パスや `../` 形式も、その境界内に解決される場合のみ許可されます。
- 1 つのトップレベルセクションのみを変更する OpenClaw 所有の書き込みで、そのセクションが単一ファイル include によって支えられている場合、その include 先ファイルへ書き込みます。たとえば、`plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` で更新し、`openclaw.json` はそのままにします。
- ルート include、include 配列、兄弟オーバーライド付き include は、OpenClaw 所有の書き込みでは読み取り専用です。これらの書き込みは設定をフラット化せず、fail closed します。
- エラー: ファイル欠落、パースエラー、循環 include に対して明確なメッセージを出します。

---

_関連: [設定](/ja-JP/gateway/configuration) · [設定例](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
