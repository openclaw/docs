---
read_when:
    - フィールド単位の設定の意味またはデフォルト値を正確に把握する必要がある
    - チャネル、モデル、Gateway、またはツールの設定ブロックを検証している
summary: コア OpenClaw キー、デフォルト値、および専用サブシステムリファレンスへのリンクに関する Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-05-02T22:19:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2963e01c73d1d3dbd218d76d0c0709f58f8b92e4b3d4606105cedd91571b5ed
    source_path: gateway/configuration-reference.md
    workflow: 16
---

コア設定リファレンスは `~/.openclaw/openclaw.json` 用です。タスク指向の概要については、[設定](/ja-JP/gateway/configuration)を参照してください。

OpenClaw の主要な設定サーフェスを扱い、サブシステムにより詳細な独自リファレンスがある場合はリンクします。チャンネルおよび Plugin が所有するコマンドカタログや、メモリ/QMD の詳細ノブは、このページではなくそれぞれのページにあります。

コード上の真実:

- `openclaw config schema` は、検証と Control UI に使われるライブ JSON Schema を出力し、利用可能な場合はバンドル/Plugin/チャンネルのメタデータもマージします
- `config.schema.lookup` は、ドリルダウンツール向けにパススコープのスキーマノードを 1 つ返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のスキーマサーフェスに対して設定ドキュメントのベースラインハッシュを検証します

エージェントの参照パス: 編集前に、正確なフィールドレベルのドキュメントと制約を確認するには、`gateway` ツールアクション `config.schema.lookup` を使用してください。タスク指向のガイダンスには[設定](/ja-JP/gateway/configuration)を使用し、より広いフィールドマップ、デフォルト、サブシステムリファレンスへのリンクにはこのページを使用してください。

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)
- 現在の組み込み + バンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)
- チャンネル固有のコマンドサーフェスについては、所有するチャンネル/Plugin ページ

設定形式は **JSON5** です（コメント + 末尾カンマを許可）。すべてのフィールドは任意です。省略時、OpenClaw は安全なデフォルトを使用します。

---

## チャンネル

チャンネルごとの設定キーは専用ページに移動しました。Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他のバンドル済みチャンネル（認証、アクセス制御、マルチアカウント、メンションゲート）を含む `channels.*` については、[設定 — チャンネル](/ja-JP/gateway/config-channels)を参照してください。

## エージェントデフォルト、マルチエージェント、セッション、メッセージ

専用ページに移動しました。以下については、[設定 — エージェント](/ja-JP/gateway/config-agents)を参照してください。

- `agents.defaults.*`（ワークスペース、モデル、思考、heartbeat、メモリ、メディア、skills、サンドボックス）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションライフサイクル、compaction、枝刈り）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk モード）
  - `talk.speechLocale`: iOS/macOS の Talk 音声認識向けの任意の BCP 47 ロケール ID
  - `talk.silenceTimeoutMs`: 未設定の場合、Talk は文字起こしを送信する前の一時停止ウィンドウとしてプラットフォームのデフォルトを維持します（`macOS と Android では 700 ms、iOS では 900 ms`）

## ツールとカスタムプロバイダー

ツールポリシー、実験的トグル、プロバイダーに裏付けられたツール設定、カスタムプロバイダー / ベース URL のセットアップは専用ページに移動しました。[設定 — ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダーのセットアップは、[設定 — ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls)にあります。
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
- `models.pricing.enabled`: サイドカーとチャンネルが Gateway の準備完了パスに到達した後に開始する、バックグラウンドの価格ブートストラップを制御します。`false` の場合、Gateway は OpenRouter と LiteLLM の価格カタログ取得をスキップします。設定済みの `models.providers.*.models[].cost` 値は、ローカルのコスト見積もりでは引き続き機能します。

## MCP

OpenClaw 管理の MCP サーバー定義は `mcp.servers` 配下にあり、埋め込み Pi やその他のランタイムアダプターによって消費されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、設定編集時に対象サーバーへ接続せずにこのブロックを管理します。

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
  `type: "http"` は CLI ネイティブのエイリアスで、`openclaw mcp set` と `openclaw doctor --fix` が正規の `transport` フィールドへ正規化します。
- `mcp.sessionIdleTtlMs`: セッションスコープのバンドル済み MCP ランタイムのアイドル TTL。
  ワンショットの埋め込み実行は実行終了時のクリーンアップを要求します。この TTL は、長時間存続するセッションと将来の呼び出し元に対するバックストップです。
- `mcp.*` 配下の変更は、キャッシュ済みセッション MCP ランタイムを破棄することでホット適用されます。
  次回のツール検出/使用時に新しい設定から再作成されるため、削除された `mcp.servers` エントリはアイドル TTL を待たずに即座に刈り取られます。

ランタイム動作については、[MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry)と[CLI バックエンド](/ja-JP/gateway/cli-backends#bundle-mcp-overlays)を参照してください。

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

- `allowBundled`: バンドル済み Skills のみを対象にする任意の許可リスト（管理対象/ワークスペース Skills には影響しません）。
- `load.extraDirs`: 追加の共有 Skill ルート（最も低い優先順位）。
- `install.preferBrew`: true の場合、`brew` が利用可能なら、他のインストーラー種別へフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` 仕様に対する Node インストーラーの優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、バンドル済み/インストール済みであっても Skill を無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数を宣言する Skills 向けの簡易指定（プレーンテキスト文字列または SecretRef オブジェクト）。

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

- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` から読み込まれます。
- 検出では、ネイティブ OpenClaw Plugin に加えて、互換性のある Codex バンドルと Claude バンドル（マニフェストなしの Claude デフォルトレイアウトバンドルを含む）を受け付けます。
- **設定変更には Gateway の再起動が必要です。**
- `allow`: 任意の許可リスト（リストされた Plugin のみ読み込み）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: Plugin レベルの API キー簡易フィールド（Plugin がサポートする場合）。
- `plugins.entries.<id>.env`: Plugin スコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視します。一方で、レガシーの `modelOverride` と `providerOverride` は維持します。ネイティブ Plugin フックと、サポートされるバンドル提供フックディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼された非バンドル Plugin は、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの型付きフックから生の会話内容を読み取れます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この Plugin がバックグラウンドサブエージェント実行ごとの `provider` と `model` のオーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼されたサブエージェントオーバーライド向けの、正規の `provider/model` ターゲットの任意許可リスト。任意のモデルを許可する意図がある場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.config`: Plugin 定義の設定オブジェクト（利用可能な場合はネイティブ OpenClaw Plugin スキーマで検証されます）。
- チャンネル Plugin のアカウント/ランタイム設定は `channels.<id>` 配下にあり、中央の OpenClaw オプションレジストリではなく、所有する Plugin のマニフェスト `channelConfigs` メタデータによって記述されるべきです。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl Web フェッチプロバイダー設定。
  - `apiKey`: Firecrawl API キー（SecretRef を受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、レガシー `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数へフォールバックします。
  - `baseUrl`: Firecrawl API ベース URL（デフォルト: `https://api.firecrawl.dev`。セルフホストのオーバーライドはプライベート/内部エンドポイントを対象にする必要があります）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ期間（ミリ秒）（デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプリクエストのタイムアウト秒数（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok Web 検索）設定。
  - `enabled`: X Search プロバイダーを有効にします。
  - `model`: 検索に使用する Grok モデル（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: メモリ dreaming 設定。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: dreaming のマスタースイッチ（デフォルト `false`）。
  - `frequency`: 各完全 dreaming スイープの cron 間隔（デフォルトは `"0 3 * * *"`）。
  - `model`: 任意の Dream Diary サブエージェントモデルオーバーライド。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。ターゲットを制限するには `allowedModels` と組み合わせてください。モデル利用不可エラーはセッションデフォルトモデルで 1 回再試行します。信頼または許可リストの失敗は黙ってフォールバックしません。
  - フェーズポリシーとしきい値は実装詳細です（ユーザー向け設定キーではありません）。
- 完全なメモリ設定は[メモリ設定リファレンス](/ja-JP/reference/memory-config)にあります。
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化された Claude バンドル Plugin は、`settings.json` から埋め込み Pi デフォルトを提供することもできます。OpenClaw はそれらを生の OpenClaw 設定パッチとしてではなく、サニタイズされたエージェント設定として適用します。
- `plugins.slots.memory`: アクティブなメモリ Plugin ID を選択します。メモリ Plugin を無効にするには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブなコンテキストエンジン Plugin ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` です。

[Plugin](/ja-JP/tools/plugin)を参照してください。

---

## コミットメント

`commitments` は、推論されたフォローアップメモリを制御します。OpenClaw は会話ターンからチェックインを検出し、heartbeat 実行を通じて配信できます。

- `commitments.enabled`: 推論されたフォローアップコミットメントの隠れた LLM 抽出、保存、heartbeat 配信を有効にします。デフォルト: `false`。
- `commitments.maxPerDay`: ローリング 1 日の中で、エージェントセッションごとに配信される推論済みフォローアップコミットメントの最大数。デフォルト: `3`。

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
- `tabCleanup` は、アイドル時間の経過後、またはセッションが上限を超えたときに、追跡対象の primary-agent タブを回収します。これら個別のクリーンアップモードを無効にするには、`idleMinutes: 0` または `maxTabsPerSession: 0` を設定します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定の場合は無効のため、ブラウザナビゲーションはデフォルトで厳格なままです。
- プライベートネットワークのブラウザナビゲーションを意図的に信頼する場合にのみ、`ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定してください。
- 厳格モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）は、到達可能性/検出チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはアタッチ専用です（開始/停止/リセットは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用し、プロバイダーが直接 DevTools WebSocket URL を提供する場合は WS(S) を使用します。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび `attachOnly` CDP の到達可能性とタブを開くリクエストに適用されます。管理対象のループバックプロファイルはローカル CDP のデフォルトを維持します。
- 外部管理の CDP サービスにループバック経由で到達できる場合は、そのプロファイルに `attachOnly: true` を設定してください。そうしないと、OpenClaw はそのループバックポートをローカル管理ブラウザプロファイルとして扱い、ローカルポートの所有権エラーを報告することがあります。
- `existing-session` プロファイルは CDP の代わりに Chrome MCP を使用し、選択されたホスト上、または接続済みブラウザノード経由でアタッチできます。
- `existing-session` プロファイルでは、Brave や Edge など特定の Chromium ベースのブラウザプロファイルを対象にするために `userDataDir` を設定できます。
- `existing-session` プロファイルは現在の Chrome MCP ルート制限を維持します。CSS セレクターターゲットではなく snapshot/ref 駆動アクション、単一ファイルアップロードフック、ダイアログタイムアウト上書きなし、`wait --load networkidle` なし、さらに `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションはありません。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。リモート CDP の場合にのみ `cdpUrl` を明示的に設定してください。
- ローカル管理プロファイルでは、そのプロファイルについてグローバルな `browser.executablePath` を上書きするために `executablePath` を設定できます。1 つのプロファイルを Chrome で、別のプロファイルを Brave で実行する場合に使用します。
- ローカル管理プロファイルは、プロセス開始後の Chrome CDP HTTP 検出に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP websocket 準備完了に `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に起動するものの準備完了チェックが起動処理と競合する低速なホストでは、これらを増やしてください。どちらの値も `120000` ms 以下の正の整数である必要があります。無効な設定値は拒否されます。
- 自動検出順序: デフォルトブラウザが Chromium ベースの場合 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、Chromium 起動前に OS のホームディレクトリとして `~` と `~/...` を受け付けます。`existing-session` プロファイルのプロファイルごとの `userDataDir` もチルダ展開されます。
- コントロールサービス: ループバックのみ（ポートは `gateway.port` から派生、デフォルトは `18791`）。
- `extraArgs` はローカル Chromium 起動に追加の起動フラグ（例: `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグ）を追加します。

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

- `mode`: `local`（gateway を実行）または `remote`（リモート gateway に接続）。`local` でない限り Gateway は起動を拒否します。
- `port`: WS + HTTP 用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IP のみ）、または `custom`。
- **レガシー bind エイリアス**: `gateway.bind` ではホストエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind モード値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用します。
- **Docker の注意**: デフォルトの `loopback` bind はコンテナ内の `127.0.0.1` で待ち受けます。Docker ブリッジネットワーク（`-p 18789:18789`）ではトラフィックが `eth0` に到着するため、gateway に到達できません。`--network host` を使用するか、すべてのインターフェイスで待ち受けるために `bind: "lan"`（または `customBindHost: "0.0.0.0"` を指定した `bind: "custom"`）を設定します。
- **認証**: デフォルトで必須です。非 loopback bind では gateway 認証が必要です。実際には、共有トークン/パスワード、または `gateway.auth.mode: "trusted-proxy"` を使う ID 対応のリバースプロキシを意味します。オンボーディングウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方（SecretRef を含む）が設定されている場合は、`gateway.auth.mode` を明示的に `token` または `password` に設定します。両方が設定され、mode が未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモードです。信頼済みの local loopback 構成にのみ使用してください。これは意図的にオンボーディングプロンプトでは提示されません。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザ/ユーザー認証を ID 対応のリバースプロキシに委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。このモードはデフォルトで **非 loopback** プロキシ送信元を想定します。同一ホストの loopback リバースプロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。内部の同一ホスト呼び出し元は、ローカル直接フォールバックとして `gateway.auth.password` を使用できます。`gateway.auth.token` は trusted-proxy モードと引き続き相互排他的です。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve の ID ヘッダーで Control UI/WebSocket 認証を満たせます（`tailscale whois` で検証）。HTTP API エンドポイントはその Tailscale ヘッダー認証を使用せず、代わりに gateway の通常の HTTP 認証モードに従います。このトークンなしフローは、gateway ホストが信頼済みであることを前提にしています。`tailscale.mode = "serve"` の場合、デフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッターです。クライアント IP ごと、および認証スコープごとに適用されます（shared-secret と device-token は個別に追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, clientIp}` の失敗試行は失敗書き込み前に直列化されます。そのため、同じクライアントからの並行した不正試行は、どちらも単なる不一致として競合通過するのではなく、2 回目のリクエストでリミッターに達する可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックも意図的にレート制限したい場合（テスト構成や厳格なプロキシデプロイなど）は `false` に設定します。
- ブラウザ origin の WS 認証試行は、常に loopback 免除を無効にしてスロットリングされます（ブラウザベースの localhost 総当たりに対する多層防御）。
- loopback では、それらのブラウザ origin ロックアウトは正規化された `Origin`
  値ごとに分離されるため、ある localhost origin からの繰り返し失敗が別の origin を自動的に
  ロックアウトすることはありません。
- `tailscale.mode`: `serve`（tailnet のみ、loopback bind）または `funnel`（公開、認証必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的なブラウザ origin 許可リスト。ブラウザクライアントが非 loopback origin から想定される場合に必須です。
- `controlUi.chatMessageMaxWidth`: グループ化された Control UI チャットメッセージの任意の最大幅です。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)` などの制約付き CSS width 値を受け付けます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダー origin ポリシーに意図的に依存するデプロイ向けに、Host ヘッダー origin フォールバックを有効にする危険なモードです。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼済みプライベートネットワーク
  IP への平文 `ws://` を許可する、クライアント側プロセス環境の
  緊急用オーバーライドです。平文のデフォルトは引き続き loopback のみです。対応する
  `openclaw.json` はなく、
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` のようなブラウザのプライベートネットワーク設定は Gateway
  WebSocket クライアントに影響しません。
- `gateway.remote.token` / `.password` はリモートクライアントの認証情報フィールドです。それ自体では gateway 認証を設定しません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOS ビルドが relay-backed 登録を gateway に公開した後に使用する、外部 APNs relay のベース HTTPS URL です。この URL は iOS ビルドにコンパイルされた relay URL と一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: gateway から relay への送信タイムアウト（ミリ秒）。デフォルトは `10000` です。
- relay-backed 登録は特定の gateway ID に委任されます。ペアリングされた iOS アプリは `gateway.identity.get` を取得し、その ID を relay 登録に含め、登録スコープの送信 grant を gateway に転送します。別の gateway はその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記の relay 設定に対する一時的な環境変数オーバーライドです。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL 用の開発専用エスケープハッチです。本番の relay URL は HTTPS のままにしてください。
- `gateway.handshakeTimeoutMs`: 認証前 Gateway WebSocket ハンドシェイクタイムアウト（ミリ秒）。デフォルト: `15000`。`OPENCLAW_HANDSHAKE_TIMEOUT_MS` が設定されている場合は優先されます。ローカルクライアントが接続できる一方で起動時ウォームアップがまだ安定していない、高負荷または低性能のホストではこれを増やしてください。
- `gateway.channelHealthCheckMinutes`: チャンネルヘルスモニター間隔（分）。グローバルにヘルスモニター再起動を無効にするには `0` を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socket しきい値（分）。これは `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング 1 時間におけるチャンネル/アカウントごとの最大ヘルスモニター再起動回数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターを有効にしたまま、チャンネル単位でヘルスモニター再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャンネル向けのアカウント単位のオーバーライドです。設定されている場合、チャンネルレベルのオーバーライドより優先されます。
- ローカル gateway 呼び出しパスは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決できない場合、解決はフェイルクローズします（リモートフォールバックで覆い隠されません）。
- `trustedProxies`: TLS を終端する、または転送クライアントヘッダーを注入するリバースプロキシ IP です。管理下にあるプロキシのみを列挙してください。loopback エントリは、同一ホストのプロキシ/ローカル検出構成（たとえば Tailscale Serve やローカルリバースプロキシ）では引き続き有効ですが、loopback リクエストを `gateway.auth.mode: "trusted-proxy"` の対象にするものでは**ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに gateway は `X-Real-IP` を受け付けます。フェイルクローズ動作のため、デフォルトは `false` です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求スコープのない初回ノードデバイスペアリングを自動承認するための任意の CIDR/IP 許可リストです。未設定の場合は無効です。これはオペレーター/ブラウザ/Control UI/WebChat ペアリングを自動承認せず、ロール、スコープ、メタデータ、公開鍵のアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングおよびプラットフォーム許可リスト評価後に、宣言されたノードコマンドをグローバルに allow/deny 形成します。`camera.snap`、`camera.clip`、`screen.record` などの危険なノードコマンドにオプトインするには `allowCommands` を使用します。`denyCommands` は、プラットフォームデフォルトまたは明示的な allow によって含まれる場合でもコマンドを削除します。ノードが宣言済みコマンドリストを変更した後は、そのデバイスペアリングを拒否して再承認し、gateway が更新済みコマンドスナップショットを保存するようにしてください。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` でブロックする追加ツール名（デフォルト deny リストを拡張）。
- `gateway.tools.allow`: デフォルトの HTTP deny リストからツール名を削除します。

</Accordion>

### OpenAI 互換エンドポイント

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の許可リストは未設定として扱われます。URL 取得を無効にするには、`gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使用します。
- 任意のレスポンス強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（管理下にある HTTPS origin にのみ設定してください。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照）

### 複数インスタンスの分離

一意のポートと状態ディレクトリを使って、1 つのホスト上で複数の gateway を実行します:

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

- `enabled`: gateway リスナーでの TLS 終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合、ローカルの自己署名 cert/key ペアを自動生成します。ローカル/開発用途のみ。
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

- `mode`: 設定編集を実行時にどう適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: 設定変更時に常に gateway プロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まずホットリロードを試み、必要な場合は再起動にフォールバックします。
- `debounceMs`: 設定変更が適用される前のデバウンス期間（ミリ秒、非負整数）。
- `deferralTimeoutMs`: 再起動を強制する前に進行中の操作を待機する任意の最大時間（ミリ秒）。デフォルトの有界待機（`300000`）を使用するには省略します。無期限に待機し、定期的に未完了警告をログ出力するには `0` を設定します。

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

検証と安全性の注意:

- `hooks.enabled=true` には空でない `hooks.token` が必要です。
- `hooks.token` は `gateway.auth.token` と**異なる**必要があります。Gateway トークンの再利用は拒否されます。
- `hooks.path` に `/` は使用できません。`/hooks` のような専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。
- マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的なマッピングキーには、このオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されます
  - テンプレートでレンダリングされたマッピングの `sessionKey` 値は外部から提供されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="マッピングの詳細">

- `match.path` は `/hooks` の後のサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パス用にペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` はフックアクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` 内に留まります（絶対パスとトラバーサルは拒否されます）。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` 配下に維持してください。ワークスペースの Skills ディレクトリは拒否されます。`openclaw doctor` がこのパスを無効として報告した場合は、変換モジュールをフック変換ディレクトリへ移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントへルーティングします。不明な ID はデフォルトへフォールバックします。
- `allowedAgentIds`: 明示的なルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` なしでフックエージェントを実行するための任意の固定セッションキーです。
- `allowRequestSessionKey`: `/hooks/agent` の呼び出し元とテンプレート駆動のマッピングセッションキーが `sessionKey` を設定できるようにします（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（リクエスト + マッピング）用の任意のプレフィックス許可リストです。例: `["hook:"]`。テンプレート化された `sessionKey` を使用するマッピングまたはプリセットがある場合は必須になります。
- `deliver: true` は最終返信をチャンネルへ送信します。`channel` のデフォルトは `last` です。
- `model` はこのフック実行の LLM を上書きします（モデルカタログが設定されている場合は許可されている必要があります）。

</Accordion>

### Gmail 連携

- 組み込みの Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- そのメッセージごとのルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するように制限してください。例: `["hook:", "hook:gmail:"]`。
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

- 設定されている場合、Gateway は起動時に `gog gmail watch serve` を自動開始します。無効化するには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
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

- Gateway ポート配下の HTTP で、エージェントが編集可能な HTML/CSS/JS と A2UI を提供します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）を維持してください。
- 非 loopback バインド: canvas ルートには、他の Gateway HTTP サーフェスと同様に Gateway 認証（トークン/パスワード/信頼済みプロキシ）が必要です。
- Node WebView は通常、認証ヘッダーを送信しません。Node がペアリングされ接続されると、Gateway は canvas/A2UI アクセス用に Node スコープのケイパビリティ URL を通知します。
- ケイパビリティ URL はアクティブな Node WS セッションにバインドされ、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
- 提供される HTML にライブリロードクライアントを注入します。
- 空の場合はスターター `index.html` を自動作成します。
- `/__openclaw__/a2ui/` でも A2UI を提供します。
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
- ホスト名は、有効な DNS ラベルである場合はシステムホスト名がデフォルトになり、それ以外の場合は `openclaw` にフォールバックします。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。

### ワイドエリア (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。ネットワークをまたいだ検出には、DNS サーバー（CoreDNS 推奨）+ Tailscale スプリット DNS と組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

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
- `.env` ファイル: CWD の `.env` + `~/.openclaw/.env`（どちらも既存の変数を上書きしません）。
- `shellEnv`: ログインシェルプロファイルから不足している期待キーをインポートします。
- 完全な優先順位については [環境](/ja-JP/help/environment) を参照してください。

### 環境変数の置換

任意の設定文字列で `${VAR_NAME}` により環境変数を参照します:

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

Secret ref は加算的です。プレーンテキスト値も引き続き動作します。

### `SecretRef`

次の 1 つのオブジェクト形状を使用してください:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON ポインター（例: `"/providers/openai/apiKey"`）
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` の id には、スラッシュ区切りのパスセグメントとして `.` または `..` を含めてはいけません（例: `a/../b` は拒否されます）

### サポートされる認証情報サーフェス

- 正規マトリクス: [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` はサポートされる `openclaw.json` 認証情報パスを対象にします。
- `auth-profiles.json` ref は、ランタイム解決と監査範囲に含まれます。

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

注意:

- `file` プロバイダーは `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue モードでは `id` は `"value"` である必要があります）。
- Windows ACL 検証が利用できない場合、file および exec プロバイダーのパスはフェイルクローズします。検証できない信頼済みパスにのみ `allowInsecurePath: true` を設定してください。
- `exec` プロバイダーには絶対 `command` パスが必要で、stdin/stdout 上のプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決後のターゲットパスを検証しながらシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、信頼済みディレクトリチェックは解決後のターゲットパスに適用されます。
- `exec` 子環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- Secret ref は有効化時にインメモリスナップショットへ解決され、その後リクエストパスはスナップショットのみを読み取ります。
- 有効化中にアクティブサーフェスのフィルタリングが適用されます。有効なサーフェス上の未解決 ref は起動/リロードを失敗させ、非アクティブなサーフェスは診断付きでスキップされます。

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
- `auth-profiles.json` は、静的な認証情報モード用に値レベルの ref（`api_key` 用の `keyRef`、`token` 用の `tokenRef`）をサポートします。
- `{ "provider": { "apiKey": "..." } }` のようなレガシーなフラット `auth-profiles.json` マップはランタイム形式ではありません。`openclaw doctor --fix` は、それらを `.legacy-flat.*.bak` バックアップ付きの正規 `provider:default` API キープロファイルへ書き換えます。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef による auth-profile 認証情報をサポートしません。
- 静的ランタイム認証情報は、インメモリの解決済みスナップショットから取得されます。レガシーな静的 `auth.json` エントリは検出時にスクラブされます。
- レガシー OAuth は `~/.openclaw/credentials/oauth.json` からインポートされます。
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

- `billingBackoffHours`: true
  billing/insufficient-credit エラーが原因でプロファイルが失敗した場合の、時間単位の基本バックオフ（デフォルト: `5`）。明示的な課金テキストは
  `401`/`403` 応答でもここに入る場合がありますが、プロバイダー固有のテキスト
  マッチャーは、それを所有するプロバイダーのスコープに留まります（例: OpenRouter
  `Key limit exceeded`）。再試行可能な HTTP `402` の使用量ウィンドウまたは
  組織/ワークスペースの使用額上限メッセージは、代わりに `rate_limit` パスに
  留まります。
- `billingBackoffHoursByProvider`: 課金バックオフ時間に対する、任意のプロバイダー別上書き。
- `billingMaxHours`: 課金バックオフの指数的増加に対する時間単位の上限（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼度の `auth_permanent` 失敗に対する、分単位の基本バックオフ（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加に対する分単位の上限（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用する時間単位のローリングウィンドウ（デフォルト: `24`）。
- `overloadedProfileRotations`: モデルフォールバックへ切り替える前に行う、過負荷エラーに対する同一プロバイダーの認証プロファイルローテーション最大回数（デフォルト: `1`）。`ModelNotReadyException` などのプロバイダー混雑形状はここに入ります。
- `overloadedBackoffMs`: 過負荷のプロバイダー/プロファイルローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: モデルフォールバックへ切り替える前に行う、レート制限エラーに対する同一プロバイダーの認証プロファイルローテーション最大回数（デフォルト: `1`）。そのレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` など、プロバイダー形状のテキストが含まれます。

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
- `maxFileBytes`: ローテーション前のアクティブなログファイルの最大サイズ（バイト単位）（正の整数、デフォルト: `104857600` = 100 MB）。OpenClaw はアクティブなファイルの横に、番号付きアーカイブを最大 5 個保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対するベストエフォートのマスキング。`redactSensitive: "off"` はこの一般的なログ/トランスクリプトポリシーのみを無効にします。UI/ツール/診断の安全性サーフェスでは、送信前に引き続きシークレットを墨消しします。

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

- `enabled`: インストルメンテーション出力のマスタートグル（デフォルト: `true`）。
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列（`"telegram.*"` や `"*"` などのワイルドカードをサポート）。
- `stuckSessionWarnMs`: 長時間実行中の処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` として分類するための、進捗なし経過時間のしきい値（ms）。返信、ツール、ステータス、ブロック、ACP の進捗はタイマーをリセットします。繰り返される `session.stuck` 診断は、変化がない間はバックオフします。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効にします（デフォルト: `false`）。完全な構成、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 任意のシグナル固有 OTLP エンドポイント。設定すると、そのシグナルに限って `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストと一緒に送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性用のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効にします。
- `otel.sampleRate`: トレースサンプリング率 `0`–`1`。
- `otel.flushIntervalMs`: 定期的なテレメトリフラッシュ間隔（ms）。
- `otel.captureContent`: OTEL span 属性への生コンテンツキャプチャをオプトインします。デフォルトはオフです。Boolean `true` は非システムメッセージ/ツールコンテンツをキャプチャします。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` を明示的に有効にできます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新の実験的 GenAI span プロバイダー属性用の環境トグル。デフォルトでは、互換性のために span は従来の `gen_ai.system` 属性を維持します。GenAI メトリクスは有界のセマンティック属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: グローバル OpenTelemetry SDK をすでに登録済みのホスト用の環境トグル。OpenClaw は診断リスナーをアクティブに保ちながら、Plugin 所有の SDK 起動/シャットダウンをスキップします。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 対応する設定キーが未設定の場合に使用される、シグナル固有エンドポイント環境変数。
- `cacheTrace.enabled`: 組み込み実行のキャッシュトレーススナップショットをログに記録します（デフォルト: `false`）。
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

- `channel`: npm/git インストール用のリリースチャンネル — `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: Gateway 起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: パッケージインストールのバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャンネルの自動適用前の最小遅延時間（デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャンネルのロールアウトを分散する追加ウィンドウ時間（デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャンネルのチェックを実行する頻度（時間単位）（デフォルト: `1`、最大: `24`）。

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

- `enabled`: グローバル ACP 機能ゲート（デフォルト: `true`。`false` に設定すると ACP ディスパッチと spawn アフォーダンスを非表示にします）。
- `dispatch.enabled`: ACP セッションターンディスパッチの独立したゲート（デフォルト: `true`）。`false` に設定すると、実行をブロックしつつ ACP コマンドは利用可能なままにします。
- `backend`: デフォルトの ACP ランタイムバックエンド ID（登録済みの ACP ランタイム Plugin と一致する必要があります）。
  先にバックエンド Plugin をインストールし、`plugins.allow` が設定されている場合はバックエンド Plugin ID（例: `acpx`）を含めてください。そうしないと ACP バックエンドは読み込まれません。
- `defaultAgent`: spawn が明示的なターゲットを指定しない場合の、フォールバック ACP ターゲットエージェント ID。
- `allowedAgents`: ACP ランタイムセッションに許可されるエージェント ID の許可リスト。空の場合は追加制限なしを意味します。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストのアイドルフラッシュウィンドウ（ms）。
- `stream.maxChunkChars`: ストリーミングブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとに繰り返されるステータス/ツール行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は増分ストリーミングします。`"final_only"` はターン終端イベントまでバッファリングします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベントの後に見えるテキストを出す前の区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影されるアシスタント出力文字の最大数。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベント用のタグ名から boolean 可視性上書きへのレコード。
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
  - `"random"`（デフォルト）: 面白い/季節向けタグラインをローテーションします。
  - `"default"`: 固定の中立的なタグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: タグラインテキストなし（バナーのタイトル/バージョンは引き続き表示）。
- バナー全体（タグラインだけではなく）を非表示にするには、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

---

## ウィザード

CLI ガイド付きセットアップフロー（`onboard`、`configure`、`doctor`）によって書き込まれるメタデータ:

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

[エージェントのデフォルト](/ja-JP/gateway/config-agents#agent-defaults)の `agents.list` アイデンティティフィールドを参照してください。

---

## ブリッジ（レガシー、削除済み）

現在のビルドには TCP ブリッジは含まれなくなりました。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーは設定スキーマの一部ではなくなりました（削除されるまで検証は失敗します。`openclaw doctor --fix` で不明なキーを取り除けます）。

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

- `sessionRetention`: 完了した隔離 cron 実行セッションを `sessions.json` から刈り取るまで保持する期間。削除済み cron トランスクリプトのアーカイブのクリーンアップも制御します。デフォルト: `24h`。無効にするには `false` を設定します。
- `runLog.maxBytes`: 刈り取り前の実行ログファイル（`cron/runs/<jobId>.jsonl`）ごとの最大サイズ。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: 実行ログの刈り取りがトリガーされたときに保持される最新行数。デフォルト: `2000`。
- `webhookToken`: cron Webhook POST 配信（`delivery.mode = "webhook"`）に使用される bearer トークン。省略すると auth ヘッダーは送信されません。
- `webhook`: まだ `notify: true` を持つ保存済みジョブにのみ使用される、非推奨のレガシーフォールバック Webhook URL（http/https）。

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

- `maxAttempts`: 一時的なエラーでのワンショットジョブの最大再試行回数 (デフォルト: `3`; 範囲: `0`–`10`)。
- `backoffMs`: 各再試行でのバックオフ遅延の配列 (ミリ秒) (デフォルト: `[30000, 60000, 300000]`; 1–10 個のエントリ)。
- `retryOn`: 再試行をトリガーするエラー種別 — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略すると、すべての一時的な種別を再試行します。

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
- `cooldownMs`: 同じジョブで繰り返しアラートを送る間の最小ミリ秒数 (非負の整数)。
- `includeSkipped`: 連続してスキップされた実行をアラートしきい値に数えます (デフォルト: `false`)。スキップされた実行は別に追跡され、実行エラーのバックオフには影響しません。
- `mode`: 配信モード — `"announce"` はチャンネルメッセージ経由で送信し、`"webhook"` は設定済みの Webhook に投稿します。
- `accountId`: アラート配信のスコープを指定する任意のアカウントまたはチャンネル ID。

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

- すべてのジョブにわたる Cron 失敗通知のデフォルト送信先。
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータがある場合はデフォルトで `"announce"` になります。
- `channel`: announce 配信用のチャンネル上書き。`"last"` は最後に確認された配信チャンネルを再利用します。
- `to`: 明示的な announce ターゲットまたは Webhook URL。Webhook モードでは必須です。
- `accountId`: 配信用の任意のアカウント上書き。
- ジョブごとの `delivery.failureDestination` はこのグローバルデフォルトを上書きします。
- グローバルまたはジョブごとの失敗送信先がどちらも設定されていない場合、すでに `announce` で配信しているジョブは、失敗時にそのプライマリ announce ターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron ジョブ](/ja-JP/automation/cron-jobs)を参照してください。分離された Cron 実行は[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

---

## メディアモデルテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 受信メッセージ本文全体                            |
| `{{RawBody}}`      | 生の本文 (履歴/送信者ラッパーなし)                |
| `{{BodyStripped}}` | グループメンションを取り除いた本文                |
| `{{From}}`         | 送信者識別子                                      |
| `{{To}}`           | 宛先識別子                                        |
| `{{MessageSid}}`   | チャンネルメッセージ ID                           |
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
| `{{Provider}}`     | プロバイダーのヒント (whatsapp、telegram、discord など) |

---

## Config includes (`$include`)

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

- 単一ファイル: それを含むオブジェクトを置き換えます。
- ファイルの配列: 順番にディープマージされます (後のものが前のものを上書きします)。
- 兄弟キー: include の後にマージされます (含まれた値を上書きします)。
- ネストされた include: 最大 10 レベルまで。
- パス: include しているファイルを基準に解決されますが、最上位の設定ディレクトリ (`openclaw.json` の `dirname`) の内側にとどまる必要があります。絶対パス/`../` 形式は、その境界内に解決される場合にのみ許可されます。
- 単一ファイル include で支えられた 1 つの最上位セクションだけを変更する OpenClaw 所有の書き込みは、その include 先ファイルへ書き込みます。たとえば、`plugins install` は `plugins.json5` 内の `plugins: { $include: "./plugins.json5" }` を更新し、`openclaw.json` はそのままにします。
- ルート include、include 配列、兄弟上書きを持つ include は、OpenClaw 所有の書き込みでは読み取り専用です。これらの書き込みは、設定をフラット化する代わりにフェイルクローズします。
- エラー: 不足ファイル、パースエラー、循環 include に対して明確なメッセージを表示します。

---

_関連: [設定](/ja-JP/gateway/configuration) · [設定例](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
