---
read_when:
    - 正確なフィールド単位の設定セマンティクスまたはデフォルト値が必要な場合
    - チャネル、モデル、Gateway、またはツールの設定ブロックを検証しています
summary: OpenClaw のコアキー、デフォルト、および専用サブシステムリファレンスへのリンクに関する Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-05-05T01:45:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82164a3ea7592f667573b643ee9e0ec840b9b622c9d86c382a3feaf192e75684
    source_path: gateway/configuration-reference.md
    workflow: 16
---

OpenClaw の主要設定 `~/.openclaw/openclaw.json` のリファレンス。タスク指向の概要については、[設定](/ja-JP/gateway/configuration)を参照してください。

OpenClaw の主要な設定サーフェスを扱い、サブシステムに独自の詳細リファレンスがある場合はそこへリンクします。チャンネルおよび Plugin が所有するコマンドカタログや、メモリ/QMD の詳細なノブは、このページではなく個別ページにあります。

コード上の正:

- `openclaw config schema` は、検証と Control UI に使用される現在の JSON Schema を出力し、利用可能な場合はバンドル済み/Plugin/チャンネルのメタデータもマージします
- `config.schema.lookup` は、ドリルダウンツール用にパススコープのスキーマノードを 1 つ返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のスキーマサーフェスに対して設定ドキュメントのベースラインハッシュを検証します

エージェント検索パス: 編集前に、正確なフィールドレベルのドキュメントと制約を確認するには、`gateway` ツールアクション `config.schema.lookup` を使用します。タスク指向のガイダンスには[設定](/ja-JP/gateway/configuration)を使用し、より広いフィールドマップ、デフォルト、サブシステムリファレンスへのリンクにはこのページを使用します。

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)
- 現在の組み込み + バンドル済みコマンドカタログについては、[スラッシュコマンド](/ja-JP/tools/slash-commands)
- チャンネル固有のコマンドサーフェスについては、所有するチャンネル/Plugin ページ

設定形式は **JSON5** です（コメント + 末尾カンマが許可されます）。すべてのフィールドは任意です。省略された場合、OpenClaw は安全なデフォルトを使用します。

---

## チャンネル

チャンネルごとの設定キーは専用ページへ移動しました。Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他のバンドル済みチャンネル（認証、アクセス制御、マルチアカウント、メンションゲート）を含む `channels.*` については、[設定 — チャンネル](/ja-JP/gateway/config-channels)を参照してください。

## エージェントデフォルト、マルチエージェント、セッション、メッセージ

専用ページへ移動しました。以下については、[設定 — エージェント](/ja-JP/gateway/config-agents)を参照してください。

- `agents.defaults.*`（ワークスペース、モデル、thinking、heartbeat、メモリ、メディア、Skills、サンドボックス）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションライフサイクル、Compaction、プルーニング）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk モード）
  - `talk.speechLocale`: iOS/macOS の Talk 音声認識用の任意の BCP 47 ロケール ID
  - `talk.silenceTimeoutMs`: 未設定の場合、Talk はトランスクリプト送信前の一時停止ウィンドウにプラットフォーム既定値を維持します（`macOS と Android では 700 ms、iOS では 900 ms`）

## ツールとカスタムプロバイダー

ツールポリシー、実験的トグル、プロバイダー支援ツール設定、およびカスタムプロバイダー / ベース URL セットアップは専用ページへ移動しました。[設定 — ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

## モデル

プロバイダー定義、モデル許可リスト、カスタムプロバイダーセットアップは、[設定 — ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools#custom-providers-and-base-urls)にあります。
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
- `models.pricing.enabled`: サイドカーとチャンネルが Gateway ready パスに到達した後に開始されるバックグラウンド料金ブートストラップを制御します。`false` の場合、Gateway は OpenRouter と LiteLLM の料金カタログ取得をスキップします。設定済みの `models.providers.*.models[].cost` 値は、ローカルのコスト見積もりでは引き続き機能します。

## MCP

OpenClaw 管理の MCP サーバー定義は `mcp.servers` 配下にあり、組み込み Pi およびその他のランタイムアダプターによって使用されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、設定編集時に対象サーバーへ接続せずにこのブロックを管理します。

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
  リモートエントリは `transport: "streamable-http"` または `transport: "sse"` を使用します。`type: "http"` は CLI ネイティブのエイリアスで、`openclaw mcp set` と `openclaw doctor --fix` が正規の `transport` フィールドへ正規化します。
- `mcp.sessionIdleTtlMs`: セッションスコープのバンドル済み MCP ランタイムのアイドル TTL。
  ワンショットの組み込み実行は実行終了時のクリーンアップを要求します。この TTL は長時間存続するセッションと将来の呼び出し元のためのバックストップです。
- `mcp.*` 配下の変更は、キャッシュされたセッション MCP ランタイムを破棄することでホット適用されます。
  次のツール探索/使用時に新しい設定から再作成されるため、削除された `mcp.servers` エントリはアイドル TTL を待たずに即座に回収されます。

ランタイム動作については、[MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry) と [CLI バックエンド](/ja-JP/gateway/cli-backends#bundle-mcp-overlays)を参照してください。

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

- `allowBundled`: バンドル済み Skills のみに対する任意の許可リスト（管理対象/ワークスペース Skills には影響しません）。
- `load.extraDirs`: 追加の共有 Skill ルート（最も低い優先度）。
- `install.preferBrew`: true の場合、`brew` が利用可能なら他のインストーラー種別へフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` 仕様の Node インストーラー設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、バンドル済み/インストール済みであっても Skill を無効化します。
- `entries.<skillKey>.apiKey`: プライマリ環境変数を宣言する Skills のための便宜項目（平文文字列または SecretRef オブジェクト）。

---

## Plugin

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
- 探索は、ネイティブ OpenClaw Plugin に加えて、互換性のある Codex バンドルと Claude バンドル（マニフェストなしの Claude 既定レイアウトバンドルを含む）を受け入れます。
- **設定変更には gateway の再起動が必要です。**
- `allow`: 任意の許可リスト（一覧にある Plugin のみ読み込まれます）。`deny` が優先します。
- `bundledDiscovery`: 新規設定では既定で `"allowlist"` になるため、空でない `plugins.allow` は、web-search ランタイムプロバイダーを含むバンドル済みプロバイダー Plugin も制御します。Doctor は、既存のバンドル済みプロバイダー動作を明示的にオプトインするまで保持するために、移行されたレガシー許可リスト設定へ `"compat"` を書き込みます。
- `plugins.entries.<id>.apiKey`: Plugin レベルの API キー便宜フィールド（Plugin がサポートする場合）。
- `plugins.entries.<id>.env`: Plugin スコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、レガシー `before_agent_start` からプロンプトを変更するフィールドを無視します。一方でレガシー `modelOverride` と `providerOverride` は保持します。ネイティブ Plugin hooks と、サポートされるバンドル提供 hook ディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼された非バンドル Plugin は、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの型付き hooks から生の会話内容を読み取れます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この Plugin が、バックグラウンドサブエージェント実行ごとに `provider` と `model` のオーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼されたサブエージェントオーバーライドのための、正規 `provider/model` ターゲットの任意の許可リスト。任意のモデルを許可する意図がある場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.config`: Plugin 定義の設定オブジェクト（利用可能な場合はネイティブ OpenClaw Plugin スキーマで検証されます）。
- チャンネル Plugin のアカウント/ランタイム設定は `channels.<id>` 配下にあり、中央の OpenClaw オプションレジストリではなく、所有する Plugin のマニフェスト `channelConfigs` メタデータで記述されるべきです。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch プロバイダー設定。
  - `apiKey`: Firecrawl API キー（SecretRef を受け入れます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、レガシー `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` 環境変数へフォールバックします。
  - `baseUrl`: Firecrawl API ベース URL（既定: `https://api.firecrawl.dev`。セルフホストのオーバーライドはプライベート/内部エンドポイントを対象にする必要があります）。
  - `onlyMainContent`: ページから主要コンテンツのみを抽出します（既定: `true`）。
  - `maxAgeMs`: 最大キャッシュ期間（ミリ秒）（既定: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプリクエストのタイムアウト（秒）（既定: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search プロバイダーを有効化します。
  - `model`: 検索に使用する Grok モデル（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: メモリ dreaming 設定。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: dreaming のマスタースイッチ（既定 `false`）。
  - `frequency`: 各フル dreaming sweep の Cron 間隔（既定では `"0 3 * * *"`）。
  - `model`: 任意の Dream Diary サブエージェントモデルオーバーライド。`plugins.entries.memory-core.subagent.allowModelOverride: true` が必要です。ターゲットを制限するには `allowedModels` と組み合わせます。モデル利用不可エラーはセッション既定モデルで 1 回再試行されます。信頼または許可リストの失敗は暗黙にフォールバックしません。
  - フェーズポリシーとしきい値は実装詳細です（ユーザー向け設定キーではありません）。
- 完全なメモリ設定は[メモリ設定リファレンス](/ja-JP/reference/memory-config)にあります。
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化された Claude バンドル Plugin は、`settings.json` から組み込み Pi デフォルトを提供することもできます。OpenClaw はそれらを生の OpenClaw 設定パッチとしてではなく、サニタイズ済みのエージェント設定として適用します。
- `plugins.slots.memory`: アクティブなメモリ Plugin ID、またはメモリ Plugin を無効化する `"none"` を選択します。
- `plugins.slots.contextEngine`: アクティブなコンテキストエンジン Plugin ID を選択します。別のエンジンをインストールして選択しない限り、既定は `"legacy"` です。

[Plugin](/ja-JP/tools/plugin)を参照してください。

---

## コミットメント

`commitments` は推論されたフォローアップメモリを制御します。OpenClaw は会話ターンからチェックインを検出し、heartbeat 実行を通じてそれらを配信できます。

- `commitments.enabled`: 推論されたフォローアップコミットメントのための隠し LLM 抽出、保存、heartbeat 配信を有効化します。既定: `false`。
- `commitments.maxPerDay`: ローリング日単位で、エージェントセッションごとに配信される推論済みフォローアップコミットメントの最大数。既定: `3`。

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
- `tabCleanup` は、アイドル時間後またはセッションが上限を超えたときに、追跡中のプライマリエージェントのタブを回収します。個別のクリーンアップモードを無効にするには、`idleMinutes: 0` または `maxTabsPerSession: 0` を設定します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時には無効になるため、ブラウザーナビゲーションはデフォルトで厳格なままです。
- プライベートネットワークのブラウザーナビゲーションを意図的に信頼する場合にのみ、`ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定してください。
- 厳格モードでは、リモート CDP プロファイルエンドポイント (`profiles.*.cdpUrl`) は、到達性/検出チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` はレガシーエイリアスとして引き続きサポートされます。
- 厳格モードでは、明示的な例外には `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモートプロファイルはアタッチ専用です (開始/停止/リセットは無効)。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用します。プロバイダーが直接の DevTools WebSocket URL を提供する場合は WS(S) を使用します。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび `attachOnly` CDP の到達性に加え、タブを開くリクエストに適用されます。管理対象の loopback プロファイルはローカル CDP のデフォルトを維持します。
- 外部管理の CDP サービスに loopback 経由で到達できる場合は、そのプロファイルの `attachOnly: true` を設定します。それ以外の場合、OpenClaw は loopback ポートをローカル管理ブラウザープロファイルとして扱い、ローカルポートの所有権エラーを報告することがあります。
- `existing-session` プロファイルは CDP の代わりに Chrome MCP を使用し、選択されたホストまたは接続済みブラウザーノード経由でアタッチできます。
- `existing-session` プロファイルは、Brave や Edge などの特定の Chromium ベースのブラウザープロファイルを対象にするために `userDataDir` を設定できます。
- `existing-session` プロファイルは現在の Chrome MCP ルート制限を維持します。CSS セレクター指定ではなく snapshot/ref 駆動のアクション、1 ファイルのアップロードフック、ダイアログタイムアウト上書きなし、`wait --load networkidle` なし、さらに `responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなしです。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。リモート CDP の場合のみ `cdpUrl` を明示的に設定します。
- ローカル管理プロファイルは、そのプロファイルのグローバルな `browser.executablePath` を上書きするために `executablePath` を設定できます。これを使用すると、1 つのプロファイルを Chrome で、別のプロファイルを Brave で実行できます。
- ローカル管理プロファイルは、プロセス開始後の Chrome CDP HTTP 検出に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP websocket 準備完了に `browser.localCdpReadyTimeoutMs` を使用します。Chrome は正常に起動するものの、準備完了チェックが起動と競合する低速なホストでは、これらを引き上げてください。両方の値は `120000` ms までの正の整数である必要があります。無効な設定値は拒否されます。
- 自動検出順: Chromium ベースの場合はデフォルトブラウザー → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` はどちらも、Chromium 起動前に OS のホームディレクトリとして `~` と `~/...` を受け付けます。`existing-session` プロファイルのプロファイルごとの `userDataDir` もチルダ展開されます。
- コントロールサービス: loopback のみ (`gateway.port` から派生するポート、デフォルトは `18791`)。
- `extraArgs` は、ローカル Chromium 起動に追加の起動フラグを付加します (例: `--disable-gpu`、ウィンドウサイズ、デバッグフラグ)。

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

- `seamColor`: ネイティブアプリ UI クロームのアクセントカラー (Talk Mode の吹き出しの色合いなど)。
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

- `mode`: `local` (gatewayを実行) または `remote` (リモートgatewayへ接続)。Gatewayは`local`でない限り起動を拒否します。
- `port`: WS + HTTP用の単一多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IPのみ)、または`custom`。
- **レガシーbindエイリアス**: ホストエイリアス (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`) ではなく、`gateway.bind`ではbindモード値 (`auto`、`loopback`、`lan`、`tailnet`、`custom`) を使用します。
- **Dockerに関する注意**: デフォルトの`loopback` bindはコンテナ内の`127.0.0.1`で待ち受けます。Dockerブリッジネットワーク (`-p 18789:18789`) では、トラフィックは`eth0`に到着するため、gatewayに到達できません。`--network host`を使用するか、すべてのインターフェイスで待ち受けるために`bind: "lan"` (または`customBindHost: "0.0.0.0"`を指定した`bind: "custom"`) を設定します。
- **認証**: デフォルトで必須です。非loopback bindにはgateway認証が必要です。実際には、共有トークン/パスワード、または`gateway.auth.mode: "trusted-proxy"`を使うID認識リバースプロキシを意味します。オンボーディング ウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定されている場合 (SecretRefを含む)、`gateway.auth.mode`を明示的に`token`または`password`に設定します。両方が設定されていてmodeが未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモードです。信頼済みのlocal loopbackセットアップにのみ使用します。これは意図的にオンボーディングプロンプトでは提示されません。
- `gateway.auth.mode: "trusted-proxy"`: ブラウザ/ユーザー認証をID認識リバースプロキシに委任し、`gateway.trustedProxies`からのIDヘッダーを信頼します ([Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)を参照)。このモードはデフォルトで**非loopback**プロキシソースを想定します。同一ホストのloopbackリバースプロキシには、明示的な`gateway.auth.trustedProxy.allowLoopback = true`が必要です。内部の同一ホスト呼び出し元は、ローカル直接フォールバックとして`gateway.auth.password`を使用できます。`gateway.auth.token`はtrusted-proxyモードと引き続き相互排他的です。
- `gateway.auth.allowTailscale`: `true`の場合、Tailscale ServeのIDヘッダーでControl UI/WebSocket認証を満たせます (`tailscale whois`で検証)。HTTP APIエンドポイントはそのTailscaleヘッダー認証を**使用しません**。代わりにgatewayの通常のHTTP認証モードに従います。このトークンなしフローは、gatewayホストが信頼されていることを前提とします。`tailscale.mode = "serve"`の場合、デフォルトは`true`です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアントIPごと、および認証スコープごとに適用されます (shared-secretとdevice-tokenは独立して追跡されます)。ブロックされた試行は`429` + `Retry-After`を返します。
  - 非同期Tailscale Serve Control UIパスでは、同じ`{scope, clientIp}`の失敗試行は失敗書き込み前に直列化されます。そのため、同じクライアントからの同時不正試行は、単なる不一致として両方が競合して通過するのではなく、2番目のリクエストでリミッターを発動することがあります。
  - `gateway.auth.rateLimit.exemptLoopback`のデフォルトは`true`です。localhostトラフィックも意図的にレート制限したい場合 (テストセットアップや厳格なプロキシデプロイなど) は`false`に設定します。
- ブラウザoriginのWS認証試行は、loopback免除を無効にして常にスロットルされます (ブラウザベースのlocalhostブルートフォースに対する多層防御)。
- loopbackでは、これらのブラウザoriginロックアウトは正規化された`Origin`
  値ごとに分離されるため、あるlocalhost originからの繰り返し失敗が、
  別のoriginを自動的にロックアウトすることはありません。
- `tailscale.mode`: `serve` (tailnetのみ、loopback bind) または`funnel` (公開、認証が必要)。
- `controlUi.allowedOrigins`: Gateway WebSocket接続用の明示的なブラウザorigin許可リスト。非loopback originからブラウザクライアントが想定される場合に必須です。
- `controlUi.chatMessageMaxWidth`: グループ化されたControl UIチャットメッセージの任意の最大幅。`960px`、`82%`、`min(1280px, 82%)`、`calc(100% - 2rem)`などの制約付きCSS幅値を受け付けます。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Hostヘッダーoriginポリシーに意図的に依存するデプロイのために、Hostヘッダーoriginフォールバックを有効にする危険なモードです。
- `remote.transport`: `ssh` (デフォルト) または`direct` (ws/wss)。`direct`の場合、`remote.url`は`ws://`または`wss://`である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼済みプライベートネットワーク
  IPへの平文`ws://`を許可する、クライアント側プロセス環境の
  緊急オーバーライドです。平文のデフォルトは引き続きloopbackのみです。対応する`openclaw.json`
  設定はなく、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`のような
  ブラウザのプライベートネットワーク設定はGateway
  WebSocketクライアントに影響しません。
- `gateway.remote.token` / `.password`はリモートクライアントの認証情報フィールドです。それ自体でgateway認証を設定するものではありません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOSビルドがリレー対応登録をgatewayへ公開した後に使用する、外部APNsリレーのベースHTTPS URL。このURLはiOSビルドにコンパイルされたリレーURLと一致する必要があります。
- `gateway.push.apns.relay.timeoutMs`: gatewayからリレーへの送信タイムアウト (ミリ秒)。デフォルトは`10000`です。
- リレー対応登録は特定のgateway IDに委任されます。ペアリング済みiOSアプリは`gateway.identity.get`を取得し、そのIDをリレー登録に含め、登録スコープの送信許可をgatewayへ転送します。別のgatewayは、その保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記リレー設定用の一時的なenvオーバーライド。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTPリレーURL用の開発専用回避手段。本番リレーURLはHTTPSのままにしてください。
- `gateway.handshakeTimeoutMs`: 認証前Gateway WebSocketハンドシェイクタイムアウト (ミリ秒)。デフォルト: `15000`。`OPENCLAW_HANDSHAKE_TIMEOUT_MS`が設定されている場合は優先されます。負荷が高いホストや低性能ホストで、起動ウォームアップがまだ安定しきっていない間にローカルクライアントが接続できる場合は、この値を増やします。
- `gateway.channelHealthCheckMinutes`: チャンネルヘルスモニター間隔 (分)。ヘルスモニターによる再起動をグローバルに無効化するには`0`を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: 古いソケットとみなすしきい値 (分)。これは`gateway.channelHealthCheckMinutes`以上に保ちます。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング1時間内のチャンネル/アカウントごとのヘルスモニター最大再起動回数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターは有効にしたまま、チャンネルごとにヘルスモニター再起動を無効化する設定。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャンネルのアカウントごとのオーバーライド。設定されている場合、チャンネルレベルのオーバーライドより優先されます。
- ローカルgateway呼び出しパスは、`gateway.auth.*`が未設定の場合にのみ`gateway.remote.*`をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password`がSecretRef経由で明示的に設定され、解決できない場合、解決はフェイルクローズします (リモートフォールバックによるマスクはありません)。
- `trustedProxies`: TLSを終端する、または転送元クライアントヘッダーを注入するリバースプロキシIP。自分が管理するプロキシのみを列挙してください。loopbackエントリは、同一ホストのプロキシ/ローカル検出セットアップ (例: Tailscale Serveやローカルリバースプロキシ) では引き続き有効ですが、loopbackリクエストを`gateway.auth.mode: "trusted-proxy"`の対象にするものでは**ありません**。
- `allowRealIpFallback`: `true`の場合、`X-Forwarded-For`がないときにgatewayは`X-Real-IP`を受け付けます。フェイルクローズ動作のため、デフォルトは`false`です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求スコープがない初回ノードデバイスペアリングを自動承認するための任意のCIDR/IP許可リスト。未設定の場合は無効です。これはoperator/browser/Control UI/WebChatペアリングを自動承認せず、role、scope、metadata、public-keyのアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングとプラットフォーム許可リスト評価の後に、宣言されたノードコマンドに対して適用されるグローバルな許可/拒否制御。`camera.snap`、`camera.clip`、`screen.record`のような危険なノードコマンドを明示的に有効化するには`allowCommands`を使用します。`denyCommands`は、プラットフォームのデフォルトや明示的な許可に含まれる場合でもコマンドを削除します。ノードが宣言済みコマンドリストを変更した後は、そのデバイスペアリングを拒否して再承認し、gatewayに更新済みコマンドスナップショットを保存させます。
- `gateway.tools.deny`: HTTP `POST /tools/invoke`でブロックされる追加ツール名 (デフォルトの拒否リストを拡張)。
- `gateway.tools.allow`: デフォルトHTTP拒否リストからツール名を削除します。

</Accordion>

### OpenAI互換エンドポイント

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true`で有効化します。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の許可リストは未設定として扱われます。URL取得を無効化するには`gateway.http.endpoints.responses.files.allowUrl=false`
    および/または`gateway.http.endpoints.responses.images.allowUrl=false`を使用します。
- 任意のresponse強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (管理しているHTTPS originにのみ設定します。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts)を参照)

### 複数インスタンスの分離

一意のポートとstate dirで、1つのホスト上に複数のgatewayを実行します:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート`19001`を使用)、`--profile <name>` (`~/.openclaw-<name>`を使用)。

[Multiple Gateways](/ja-JP/gateway/multiple-gateways)を参照してください。

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

- `enabled`: gatewayリスナー (HTTPS/WSS) でTLS終端を有効にします (デフォルト: `false`)。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカルの自己署名cert/keyペアを自動生成します。ローカル/開発用途のみです。
- `certPath`: TLS証明書ファイルへのファイルシステムパス。
- `keyPath`: TLS秘密鍵ファイルへのファイルシステムパス。権限を制限してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用の任意のCAバンドルパス。

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

- `mode`: 実行時にconfig編集を適用する方法を制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: config変更時に常にgatewayプロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"` (デフォルト): まずhot reloadを試し、必要な場合はrestartへフォールバックします。
- `debounceMs`: config変更を適用する前のデバウンス期間 (ms、非負整数)。
- `deferralTimeoutMs`: 再起動を強制する前に進行中の操作を待つ任意の最大時間 (ms)。省略するとデフォルトの上限付き待機 (`300000`) を使用します。無期限に待機し、定期的に未完了警告をログするには`0`を設定します。

---

## Hooks

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
- `hooks.token` は `gateway.auth.token` と**別の値**である必要があります。Gateway トークンの再利用は拒否されます。
- `hooks.path` に `/` は使えません。`/hooks` のような専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。
- マッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的なマッピングキーにはこのオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合のみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されます
  - テンプレートでレンダリングされたマッピングの `sessionKey` 値は外部から提供されたものとして扱われ、同様に `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="Mapping details">

- `match.path` は `/hooks` の後のサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パスのペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` はフックアクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` 内にとどまります（絶対パスとトラバーサルは拒否されます）。
  - `hooks.transformsDir` は `~/.openclaw/hooks/transforms` の配下に置いてください。ワークスペースの skill ディレクトリは拒否されます。`openclaw doctor` がこのパスを無効として報告する場合は、transform モジュールを hooks transforms ディレクトリへ移動するか、`hooks.transformsDir` を削除してください。
- `agentId` は特定のエージェントへルーティングします。不明な ID はデフォルトへフォールバックします。
- `allowedAgentIds`: 明示的なルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` なしで実行されるフックエージェント用の任意の固定セッションキーです。
- `allowRequestSessionKey`: `/hooks/agent` の呼び出し元とテンプレート駆動のマッピングセッションキーに `sessionKey` の設定を許可します（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（リクエスト + マッピング）用の任意のプレフィックス許可リストです。例: `["hook:"]`。いずれかのマッピングまたはプリセットがテンプレート化された `sessionKey` を使用する場合は必須になります。
- `deliver: true` は最終返信をチャンネルへ送信します。`channel` のデフォルトは `last` です。
- `model` はこのフック実行の LLM を上書きします（モデルカタログが設定されている場合は許可されている必要があります）。

</Accordion>

### Gmail 統合

- 組み込み Gmail プリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- そのメッセージごとのルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するよう制限してください。例: `["hook:", "hook:gmail:"]`。
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

- Gateway は設定済みの場合、起動時に `gog gmail watch serve` を自動起動します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
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
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）を維持してください。
- 非ループバックの bind: canvas ルートには、他の Gateway HTTP サーフェスと同じく Gateway 認証（トークン/パスワード/trusted-proxy）が必要です。
- Node WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされ接続された後、Gateway は canvas/A2UI アクセス用にノードスコープの capability URL を通知します。
- capability URL はアクティブなノード WS セッションに紐付き、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
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
- `off`: plugin の有効化状態を変更せずに LAN マルチキャスト広告を抑止します。
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
- `shellEnv`: ログインシェルのプロファイルから、不足している想定キーをインポートします。
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

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 欠落している、または空の変数は、設定の読み込み時にエラーを発生させます。
- リテラルの `${VAR}` には `$${VAR}` でエスケープします。
- `$include` と組み合わせて動作します。

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
- `source: "file"` の id: 絶対 JSON ポインター（例: `"/providers/openai/apiKey"`）
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` の id には、スラッシュで区切られたパスセグメントとして `.` または `..` を含めてはいけません（例: `a/../b` は拒否されます）

### サポートされる認証情報サーフェス

- 正規マトリックス: [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` はサポートされている `openclaw.json` 認証情報パスを対象にします。
- `auth-profiles.json` の参照は、ランタイム解決と監査範囲に含まれます。

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

- `file` プロバイダーは `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue モードでは `id` は `"value"` でなければなりません）。
- Windows ACL 検証を利用できない場合、file および exec プロバイダーのパスはフェイルクローズします。検証できない信頼済みパスに対してのみ `allowInsecurePath: true` を設定してください。
- `exec` プロバイダーは絶対 `command` パスを必要とし、stdin/stdout 上のプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのコマンドパスは拒否されます。解決先のターゲットパスを検証しながらシンボリックリンクパスを許可するには、`allowSymlinkCommand: true` を設定します。
- `trustedDirs` が設定されている場合、信頼済みディレクトリのチェックは解決先のターゲットパスに適用されます。
- `exec` 子環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- シークレット参照はアクティベーション時にメモリ内スナップショットへ解決され、その後リクエストパスはスナップショットのみを読み取ります。
- アクティブサーフェスのフィルタリングはアクティベーション中に適用されます。有効なサーフェス上の未解決参照は起動/再読み込みを失敗させますが、非アクティブなサーフェスは診断付きでスキップされます。

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
- `auth-profiles.json` は、静的な認証情報モードに対して値レベルの参照（`api_key` の `keyRef`、`token` の `tokenRef`）をサポートします。
- `{ "provider": { "apiKey": "..." } }` のようなレガシーのフラットな `auth-profiles.json` マップはランタイム形式ではありません。`openclaw doctor --fix` は、`.legacy-flat.*.bak` バックアップ付きで、それらを正規の `provider:default` API キープロファイルに書き換えます。
- OAuth モードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef に基づく認証プロファイル認証情報をサポートしません。
- 静的ランタイム認証情報は、メモリ内の解決済みスナップショットから取得されます。レガシーの静的 `auth.json` エントリは、検出時に削除されます。
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

- `billingBackoffHours`: 実際の
  billing/insufficient-credit エラーによりプロファイルが失敗したときの、時間単位の基本バックオフ (デフォルト: `5`)。明示的な請求関連テキストは、`401`/`403` 応答でもここに分類されることがありますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーのスコープに留まります (たとえば OpenRouter の
  `Key limit exceeded`)。再試行可能な HTTP `402` の使用ウィンドウまたは
  組織/ワークスペースの利用上限メッセージは、代わりに `rate_limit` パスに留まります。
- `billingBackoffHoursByProvider`: プロバイダーごとの請求バックオフ時間を上書きする任意設定。
- `billingMaxHours`: 請求バックオフの指数的増加に対する時間単位の上限 (デフォルト: `24`)。
- `authPermanentBackoffMinutes`: 信頼度の高い `auth_permanent` 失敗に対する分単位の基本バックオフ (デフォルト: `10`)。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加に対する分単位の上限 (デフォルト: `60`)。
- `failureWindowHours`: バックオフカウンターに使用される時間単位のローリングウィンドウ (デフォルト: `24`)。
- `overloadedProfileRotations`: モデルフォールバックに切り替える前に許可される、過負荷エラーに対する同一プロバイダー内の auth-profile ローテーション最大回数 (デフォルト: `1`)。`ModelNotReadyException` などのプロバイダー混雑形状はここに分類されます。
- `overloadedBackoffMs`: 過負荷のプロバイダー/プロファイルローテーションを再試行する前の固定遅延 (デフォルト: `0`)。
- `rateLimitedProfileRotations`: モデルフォールバックに切り替える前に許可される、レート制限エラーに対する同一プロバイダー内の auth-profile ローテーション最大回数 (デフォルト: `1`)。このレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` などのプロバイダー形式のテキストが含まれます。

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
- `--verbose` の場合、`consoleLevel` は `debug` に引き上げられます。
- `maxFileBytes`: ローテーション前のアクティブログファイルの最大サイズ (バイト単位、正の整数、デフォルト: `104857600` = 100 MB)。OpenClaw はアクティブファイルの横に番号付きアーカイブを最大 5 件保持します。
- `redactSensitive` / `redactPatterns`: コンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキストに対するベストエフォートのマスキング。`redactSensitive: "off"` はこの一般的なログ/トランスクリプトポリシーのみを無効化します。UI/ツール/診断の安全性サーフェスでは、送出前に引き続きシークレットが秘匿されます。

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

- `enabled`: インストルメンテーション出力のマスタートグル (デフォルト: `true`)。
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列 (`"telegram.*"` や `"*"` などのワイルドカードをサポート)。
- `stuckSessionWarnMs`: 長時間実行中の処理セッションを `session.long_running`、`session.stalled`、または `session.stuck` として分類するための、進行なし経過時間のしきい値 (ms)。返信、ツール、ステータス、ブロック、ACP の進行はタイマーをリセットします。繰り返し発生する `session.stuck` 診断は、未変更の間バックオフします。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効にします (デフォルト: `false`)。完全な設定、シグナルカタログ、プライバシーモデルについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。
- `otel.endpoint`: OTel エクスポート用のコレクター URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 任意のシグナル固有 OTLP エンドポイント。設定すると、そのシグナルについてのみ `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"` (デフォルト) または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効にします。
- `otel.sampleRate`: トレースサンプリングレート `0`〜`1`。
- `otel.flushIntervalMs`: 定期的なテレメトリフラッシュ間隔 (ms)。
- `otel.captureContent`: OTEL span 属性への生コンテンツ取得をオプトインします。デフォルトはオフです。ブール値 `true` は非システムのメッセージ/ツールコンテンツを取得します。オブジェクト形式では、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` を明示的に有効にできます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新の実験的 GenAI span プロバイダー属性のための環境トグル。デフォルトでは、互換性のため span は従来の `gen_ai.system` 属性を保持します。GenAI メトリクスは境界付きセマンティック属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: グローバル OpenTelemetry SDK をすでに登録しているホストのための環境トグル。OpenClaw は診断リスナーを有効に保ったまま、Plugin 所有の SDK 起動/シャットダウンをスキップします。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 対応する設定キーが未設定の場合に使用される、シグナル固有のエンドポイント環境変数。
- `cacheTrace.enabled`: 埋め込み実行用のキャッシュトレーススナップショットをログに記録します (デフォルト: `false`)。
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

- `channel`: npm/git インストールのリリースチャンネル — `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: Gateway 起動時に npm 更新を確認します (デフォルト: `true`)。
- `auto.enabled`: パッケージインストールのバックグラウンド自動更新を有効にします (デフォルト: `false`)。
- `auto.stableDelayHours`: stable チャンネルの自動適用前の最小遅延時間 (デフォルト: `6`、最大: `168`)。
- `auto.stableJitterHours`: stable チャンネルのロールアウトを分散する追加ウィンドウ時間 (デフォルト: `12`、最大: `168`)。
- `auto.betaCheckIntervalHours`: beta チャンネルの確認を実行する頻度 (時間単位、デフォルト: `1`、最大: `24`)。

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

- `enabled`: グローバル ACP 機能ゲート (デフォルト: `true`、ACP dispatch と spawn affordance を非表示にするには `false` を設定)。
- `dispatch.enabled`: ACP セッションターン dispatch の独立したゲート (デフォルト: `true`)。ACP コマンドを利用可能なまま実行をブロックするには `false` を設定します。
- `backend`: デフォルトの ACP ランタイムバックエンド id (登録済み ACP ランタイム Plugin と一致する必要があります)。
  先にバックエンド Plugin をインストールし、`plugins.allow` が設定されている場合は、バックエンド Plugin id (たとえば `acpx`) を含めてください。含めない場合、ACP バックエンドは読み込まれません。
- `defaultAgent`: spawn が明示的なターゲットを指定しない場合の、フォールバック ACP ターゲット agent id。
- `allowedAgents`: ACP ランタイムセッションで許可される agent id の許可リスト。空の場合は追加の制限なしを意味します。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストのアイドル時フラッシュウィンドウ (ms)。
- `stream.maxChunkChars`: ストリーミングブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとの繰り返しステータス/ツール行を抑制します (デフォルト: `true`)。
- `stream.deliveryMode`: `"live"` は逐次ストリーミングし、`"final_only"` はターン終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベント後の可視テキスト前に置く区切り (デフォルト: `"paragraph"`)。
- `stream.maxOutputChars`: ACP ターンごとに投影される assistant 出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベントに対するタグ名からブール値の可視性上書きへのレコード。
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
  - `"off"`: タグラインテキストなし (バナーのタイトル/バージョンは引き続き表示されます)。
- バナー全体を非表示にするには (タグラインだけではなく)、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定します。

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

[Agent デフォルト](/ja-JP/gateway/config-agents#agent-defaults)の下にある `agents.list` identity フィールドを参照してください。

---

## ブリッジ (レガシー、削除済み)

現在のビルドには TCP ブリッジは含まれていません。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーは設定スキーマの一部ではなくなりました (削除されるまで検証は失敗します。`openclaw doctor --fix` で未知のキーを取り除けます)。

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

- `sessionRetention`: 完了した分離 Cron 実行セッションを `sessions.json` から刈り込むまで保持する期間。削除済み Cron トランスクリプトのアーカイブのクリーンアップも制御します。デフォルト: `24h`。無効化するには `false` を設定します。
- `runLog.maxBytes`: 刈り込み前の実行ログファイル (`cron/runs/<jobId>.jsonl`) ごとの最大サイズ。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: 実行ログの刈り込みがトリガーされたときに保持される最新行数。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST 配信 (`delivery.mode = "webhook"`) に使用される bearer token。省略した場合、auth ヘッダーは送信されません。
- `webhook`: まだ `notify: true` を持つ保存済みジョブにのみ使用される、非推奨のレガシーフォールバック Webhook URL (http/https)。

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

- `maxAttempts`: 一時的なエラーでの単発ジョブに対する最大再試行回数（デフォルト: `3`、範囲: `0`–`10`）。
- `backoffMs`: 各再試行に対するバックオフ遅延の配列（ミリ秒）（デフォルト: `[30000, 60000, 300000]`、1～10個のエントリ）。
- `retryOn`: 再試行をトリガーするエラー種別 — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略すると、すべての一時的な種別を再試行します。

単発のcronジョブにのみ適用されます。繰り返しジョブは別の失敗処理を使用します。

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

- `enabled`: cronジョブの失敗アラートを有効にします（デフォルト: `false`）。
- `after`: アラートが発火するまでの連続失敗回数（正の整数、最小: `1`）。
- `cooldownMs`: 同じジョブに対する繰り返しアラート間の最小ミリ秒数（非負の整数）。
- `includeSkipped`: 連続してスキップされた実行をアラートしきい値にカウントします（デフォルト: `false`）。スキップされた実行は別途追跡され、実行エラーのバックオフには影響しません。
- `mode`: 配信モード — `"announce"` はチャンネルメッセージで送信します。`"webhook"` は設定されたWebhookに投稿します。
- `accountId`: アラート配信のスコープを絞るための任意のアカウントまたはチャンネルID。

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

- すべてのジョブに対するcron失敗通知のデフォルト宛先です。
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータがある場合はデフォルトで `"announce"` になります。
- `channel`: announce配信のチャンネル上書きです。`"last"` は最後に確認された配信チャンネルを再利用します。
- `to`: 明示的なannounceターゲットまたはWebhook URLです。Webhookモードでは必須です。
- `accountId`: 配信用の任意のアカウント上書きです。
- ジョブごとの `delivery.failureDestination` は、このグローバルデフォルトを上書きします。
- グローバルまたはジョブごとの失敗宛先がどちらも設定されていない場合、すでに `announce` で配信しているジョブは、失敗時にそのプライマリannounceターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cronジョブ](/ja-JP/automation/cron-jobs)を参照してください。分離されたcron実行は[バックグラウンドタスク](/ja-JP/automation/tasks)として追跡されます。

---

## メディアモデルのテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 受信メッセージ本文全体                            |
| `{{RawBody}}`      | 生の本文（履歴/送信者ラッパーなし）               |
| `{{BodyStripped}}` | グループメンションを除去した本文                  |
| `{{From}}`         | 送信者識別子                                      |
| `{{To}}`           | 宛先識別子                                        |
| `{{MessageSid}}`   | チャンネルメッセージID                            |
| `{{SessionId}}`    | 現在のセッションUUID                              |
| `{{IsNewSession}}` | 新しいセッションが作成された場合は `"true"`       |
| `{{MediaUrl}}`     | 受信メディアの擬似URL                             |
| `{{MediaPath}}`    | ローカルメディアパス                              |
| `{{MediaType}}`    | メディア種別（image/audio/document/…）            |
| `{{Transcript}}`   | 音声トランスクリプト                              |
| `{{Prompt}}`       | CLIエントリ用に解決されたメディアプロンプト       |
| `{{MaxChars}}`     | CLIエントリ用に解決された最大出力文字数           |
| `{{ChatType}}`     | `"direct"` または `"group"`                       |
| `{{GroupSubject}}` | グループ件名（ベストエフォート）                  |
| `{{GroupMembers}}` | グループメンバーのプレビュー（ベストエフォート）  |
| `{{SenderName}}`   | 送信者の表示名（ベストエフォート）                |
| `{{SenderE164}}`   | 送信者の電話番号（ベストエフォート）              |
| `{{Provider}}`     | プロバイダーヒント（whatsapp、telegram、discordなど） |

---

## 設定インクルード（`$include`）

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
- ファイルの配列: 順番に深くマージされます（後のものが前のものを上書きします）。
- 兄弟キー: インクルード後にマージされます（インクルードされた値を上書きします）。
- ネストされたインクルード: 最大10階層まで。
- パス: インクルード元ファイルからの相対パスとして解決されますが、最上位の設定ディレクトリ（`openclaw.json` の `dirname`）内にとどまる必要があります。絶対パス/`../` 形式は、その境界内に解決される場合にのみ許可されます。
- 1つのトップレベルセクションのみを変更し、そのセクションが単一ファイルのインクルードに裏付けられているOpenClaw所有の書き込みは、そのインクルード先ファイルへ書き込みます。たとえば、`plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` 内で更新し、`openclaw.json` はそのままにします。
- ルートインクルード、インクルード配列、兄弟上書きを持つインクルードは、OpenClaw所有の書き込みでは読み取り専用です。これらの書き込みは、設定を平坦化するのではなくフェイルクローズします。
- エラー: ファイルが見つからない場合、解析エラー、循環インクルードに対して明確なメッセージを表示します。

---

_関連: [設定](/ja-JP/gateway/configuration) · [設定例](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [設定](/ja-JP/gateway/configuration)
- [設定例](/ja-JP/gateway/configuration-examples)
