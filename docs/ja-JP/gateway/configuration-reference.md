---
read_when:
    - 正確なフィールドレベルの config の意味やデフォルトが必要な場合
    - チャネル、モデル、Gateway、または tool の config ブロックを検証している場合
summary: OpenClaw の中核キー、デフォルト、専用サブシステムリファレンスへのリンクのための Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-24T04:56:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6dc3b920ada38951086908713e9347141d8b11faa007df23a90a2532ac6f3bb2
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` の中核 config リファレンスです。タスク指向の概要については [Configuration](/ja-JP/gateway/configuration) を参照してください。

このページでは OpenClaw の主要な config サーフェスを扱い、サブシステムごとにより深い専用リファレンスがある場合はそこへリンクします。チャネル/Plugin が所有するすべてのコマンドカタログや、深い memory/QMD のすべての設定項目を 1 ページにインラインで載せることは**目的としていません**。

コード上の真実:

- `openclaw config schema` は、検証と Control UI に使われるライブ JSON Schema を表示します。利用可能な場合は bundled/plugin/channel メタデータもマージされます
- `config.schema.lookup` は、掘り下げ用ツール向けに 1 つのパススコープ付き schema node を返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、config-doc ベースラインハッシュを現在の schema サーフェスと照合して検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の Dreaming config については [Memory 設定リファレンス](/ja-JP/reference/memory-config)
- 現在の組み込み + bundled コマンドカタログについては [スラッシュコマンド](/ja-JP/tools/slash-commands)
- チャネル固有のコマンドサーフェスについては各チャネル/Plugin のページ

config 形式は **JSON5** です（コメント + 末尾カンマ可）。すべてのフィールドは任意です。省略された場合、OpenClaw は安全なデフォルトを使います。

---

## チャネル

チャネルごとの config キーは専用ページに移動しました。`channels.*`
（Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、そのほかの
bundled チャネルの auth、アクセス制御、マルチアカウント、メンションゲーティングを含む）については
[設定 — チャネル](/ja-JP/gateway/config-channels) を参照してください。

## エージェントデフォルト、マルチエージェント、セッション、メッセージ

専用ページに移動しました。次については
[設定 — エージェント](/ja-JP/gateway/config-agents) を参照してください。

- `agents.defaults.*`（workspace、model、thinking、Heartbeat、memory、media、Skills、sandbox）
- `multiAgent.*`（マルチエージェントルーティングとバインディング）
- `session.*`（セッションライフサイクル、Compaction、pruning）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk モード）
  - `talk.silenceTimeoutMs`: 未設定時、Talk はトランスクリプト送信前のプラットフォームデフォルトの待機時間を維持します（`macOS と Android では 700 ms、iOS では 900 ms`）

## Tools とカスタムプロバイダー

tool ポリシー、実験的トグル、プロバイダー支援 tool config、およびカスタム
プロバイダー / base-URL のセットアップは専用ページに移動しました。
[設定 — tools とカスタムプロバイダー](/ja-JP/gateway/config-tools) を参照してください。

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // または平文文字列
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: bundled Skills のみを対象にする任意の許可リスト（managed/workspace Skills には影響しません）。
- `load.extraDirs`: 追加の共有 Skill ルート（最も低い優先順位）。
- `install.preferBrew`: true の場合、`brew` が利用可能なら他のインストーラー種類にフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install`
  仕様用の Node インストーラー優先順位（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`: bundled/installed されていても Skill を無効にします。
- `entries.<skillKey>.apiKey`: primary env var を宣言する Skill 用の簡易フィールド（平文文字列または SecretRef オブジェクト）。

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
- 検出では、ネイティブ OpenClaw Plugins に加え、manifest を持たない Claude デフォルトレイアウト bundle を含む互換 Codex bundle と Claude bundle も受け付けます。
- **Config の変更には Gateway の再起動が必要です。**
- `allow`: 任意の許可リスト（列挙された Plugin のみ読み込む）。`deny` が優先します。
- `plugins.entries.<id>.apiKey`: Plugin レベルの API キー簡易フィールド（Plugin がサポートする場合）。
- `plugins.entries.<id>.env`: Plugin スコープの env var マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、旧来の `before_agent_start` からの prompt 変更フィールドを無視します。ただし旧来の `modelOverride` と `providerOverride` は保持されます。ネイティブ Plugin フックと、サポートされる bundle 提供フックディレクトリに適用されます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この Plugin がバックグラウンドサブエージェント実行に対して実行ごとの `provider` と `model` 上書きを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼されたサブエージェント上書きに対する、正規化された `provider/model` ターゲットの任意の許可リスト。意図的に任意のモデルを許可したい場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.config`: Plugin 定義の config オブジェクト（利用可能な場合はネイティブ OpenClaw Plugin schema で検証されます）。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl の Web 取得プロバイダー設定。
  - `apiKey`: Firecrawl API キー（SecretRef を受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、旧来の `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` env var にフォールバックします。
  - `baseUrl`: Firecrawl API ベース URL（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページからメインコンテンツのみ抽出する（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ期間（ミリ秒、デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプリクエストタイムアウト（秒、デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok Web 検索）設定。
  - `enabled`: X Search プロバイダーを有効化。
  - `model`: 検索に使う Grok モデル（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory Dreaming 設定。フェーズと閾値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: Dreaming 全体のスイッチ（デフォルト `false`）。
  - `frequency`: 各フル Dreaming スイープの Cron 頻度（デフォルト `"0 3 * * *"`）。
  - フェーズポリシーと閾値は実装詳細です（ユーザー向け config キーではありません）。
- memory 全体の config は [Memory 設定リファレンス](/ja-JP/reference/memory-config) にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効な Claude bundle Plugins は、`settings.json` から埋め込み Pi デフォルトを提供することもできます。OpenClaw はこれらを生の OpenClaw config パッチではなく、サニタイズ済みエージェント設定として適用します。
- `plugins.slots.memory`: アクティブな memory Plugin ID を選択するか、memory Plugins を無効にするには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブな context engine Plugin ID を選択します。別の engine をインストールして選択しない限り、デフォルトは `"legacy"` です。
- `plugins.installs`: `openclaw plugins update` で使われる CLI 管理のインストールメタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt` を含みます。
  - `plugins.installs.*` は管理状態として扱ってください。手動編集より CLI コマンドを推奨します。

[Plugins](/ja-JP/tools/plugin) を参照してください。

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 信頼できるプライベートネットワークアクセスにのみオプトイン
      // allowPrivateNetwork: true, // 旧来のエイリアス
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時は無効なので、browser navigation はデフォルトで strict のままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` は、プライベートネットワークの browser navigation を意図的に信頼する場合にのみ設定してください。
- strict モードでは、リモート CDP プロファイルエンドポイント（`profiles.*.cdpUrl`）も到達性/検出チェック中に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork` も旧来のエイリアスとして引き続きサポートされます。
- strict モードでは、明示的な例外には `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使ってください。
- リモートプロファイルは attach-only です（start/stop/reset は無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  `HTTP(S)` は OpenClaw に `/json/version` を検出させたい場合に使い、`WS(S)` はプロバイダーが直接の DevTools WebSocket URL を提供する場合に使います。
- `existing-session` プロファイルは CDP ではなく Chrome MCP を使い、選択したホスト上または接続済み browser Node 経由でアタッチできます。
- `existing-session` プロファイルは、Brave や Edge など特定の Chromium 系ブラウザープロファイルをターゲットにするために `userDataDir` を設定できます。
- `existing-session` プロファイルは、現在の Chrome MCP ルート制限を維持します。snapshot/ref ベースのアクションであり CSS セレクターターゲティングではないこと、単一ファイルアップロードフック、ダイアログタイムアウト上書きなし、`wait --load networkidle` なし、`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなし、という制限です。
- ローカル管理の `openclaw` プロファイルは `cdpPort` と `cdpUrl` を自動割り当てします。リモート CDP の場合のみ `cdpUrl` を明示的に設定してください。
- 自動検出順序: デフォルトブラウザーが Chromium 系ならそれ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- Control service: loopback のみ（ポートは `gateway.port` から導出、デフォルト `18791`）。
- `extraArgs` は、ローカル Chromium 起動に追加の起動フラグを付加します（たとえば `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグなど）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // 絵文字、短いテキスト、画像 URL、または data URI
    },
  },
}
```

- `seamColor`: ネイティブアプリ UI クロームのアクセントカラー（Talk Mode の吹き出し色など）。
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
      // password: "your-password", // または OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy 用。/gateway/trusted-proxy-auth を参照
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
      // allowExternalEmbedUrls: false, // 危険: 絶対外部 http(s) 埋め込み URL を許可
      // allowedOrigins: ["https://control.example.com"], // non-loopback の Control UI に必須
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危険な Host ヘッダー origin フォールバックモード
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
    // 任意。デフォルトは false。
    allowRealIpFallback: false,
    tools: {
      // 追加の /tools/invoke HTTP deny
      deny: ["browser"],
      // デフォルト HTTP deny リストから tool を除外
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

- `mode`: `local`（Gateway を実行）または `remote`（リモート Gateway に接続）。Gateway は `local` でない限り起動を拒否します。
- `port`: WS + HTTP 用の単一多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IP のみ）、または `custom`。
- **旧来の bind エイリアス**: `gateway.bind` では、ホストエイリアス（`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`）ではなく bind mode 値（`auto`, `loopback`, `lan`, `tailnet`, `custom`）を使ってください。
- **Docker に関する注意**: デフォルトの `loopback` bind は、コンテナ内では `127.0.0.1` で待ち受けます。Docker bridge ネットワーク（`-p 18789:18789`）では、トラフィックは `eth0` に到着するため、Gateway には到達できません。`--network host` を使うか、すべてのインターフェイスで待ち受けるために `bind: "lan"`（または `bind: "custom"` と `customBindHost: "0.0.0.0"`）を設定してください。
- **認証**: デフォルトで必須です。non-loopback bind では Gateway 認証が必要です。実際には、共有 token/password、または `gateway.auth.mode: "trusted-proxy"` を使う identity-aware なリバースプロキシを意味します。オンボーディングウィザードはデフォルトで token を生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合（SecretRef を含む）、`gateway.auth.mode` を明示的に `token` または `password` に設定してください。両方が設定されていて mode が未設定の場合、起動およびサービス install/repair フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモードです。信頼できる local loopback 構成にのみ使用してください。これは意図的にオンボーディングプロンプトでは提示されません。
- `gateway.auth.mode: "trusted-proxy"`: 認証を identity-aware なリバースプロキシに委譲し、`gateway.trustedProxies` からの identity ヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。このモードは **non-loopback** のプロキシソースを前提とします。同一ホストの loopback リバースプロキシでは trusted-proxy 認証要件を満たしません。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve の identity ヘッダーが Control UI/WebSocket 認証を満たせます（`tailscale whois` で検証）。HTTP API エンドポイントはその Tailscale ヘッダー認証を使わず、代わりに Gateway の通常の HTTP 認証モードに従います。この token なしフローは、Gateway ホストが信頼されていることを前提とします。`tailscale.mode = "serve"` の場合、デフォルトで `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗レート制限。クライアント IP ごと、かつ認証スコープごとに適用されます（共有シークレットとデバイストークンは別々に追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, clientIp}` に対する失敗試行は失敗書き込み前に直列化されます。そのため、同じクライアントからの同時の不正試行は、両方が単なる不一致としてすり抜けるのではなく、2 件目でレート制限に達する可能性があります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックも意図的にレート制限したい場合（テスト構成や厳格なプロキシ構成）には `false` に設定してください。
- ブラウザー起点の WS 認証試行は、loopback 免除を無効にした状態で常にスロットルされます（ブラウザーベースの localhost 総当たりに対する多層防御）。
- loopback では、それらのブラウザー起点ロックアウトは正規化された `Origin`
  値ごとに分離されるため、1 つの localhost origin からの繰り返し失敗が、別の origin を自動的にロックアウトすることはありません。
- `tailscale.mode`: `serve`（tailnet のみ、loopback bind）または `funnel`（公開、認証必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的な browser origin 許可リスト。ブラウザークライアントを non-loopback origin から想定する場合に必須です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダーの origin ポリシーに意図的に依存するデプロイ向けの危険モードで、Host ヘッダーベースの origin フォールバックを有効にします。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼できるプライベートネットワーク IP への平文 `ws://` を許可するクライアント側の緊急用オーバーライドです。デフォルトでは、平文は引き続き loopback のみです。
- `gateway.remote.token` / `.password` はリモートクライアント認証情報フィールドです。これ自体では Gateway 認証を設定しません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOS ビルドが relay ベースの登録を Gateway に公開した後に使用される、外部 APNs relay のベース HTTPS URL。この URL は iOS ビルドにコンパイルされた relay URL と一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gateway から relay への送信タイムアウト（ミリ秒）。デフォルトは `10000`。
- relay ベース登録は特定の Gateway アイデンティティに委譲されます。ペアリング済み iOS アプリは `gateway.identity.get` を取得し、そのアイデンティティを relay 登録に含め、登録スコープの send grant を Gateway に転送します。別の Gateway はその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記 relay config 用の一時的な env 上書き。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL 用の開発専用エスケープハッチ。本番 relay URL は HTTPS のままにしてください。
- `gateway.channelHealthCheckMinutes`: チャネルヘルスモニター間隔（分）。ヘルスモニター再起動をグローバルに無効にするには `0` を設定してください。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socket 閾値（分）。これは `gateway.channelHealthCheckMinutes` 以上に保ってください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング 1 時間あたりのチャネル/アカウントごとのヘルスモニター再起動最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルモニターを有効に保ったまま、チャネル単位でヘルスモニター再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャネル用のアカウント単位上書き。設定されている場合、チャネルレベル上書きより優先されます。
- ローカル Gateway 呼び出しパスは、`gateway.auth.*` が未設定のときにのみ `gateway.remote.*` をフォールバックとして使えます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef で明示的に設定されていて未解決の場合、解決は fail-closed になります（リモートフォールバックで隠されません）。
- `trustedProxies`: TLS を終端する、または forwarded-client ヘッダーを注入するリバースプロキシの IP。自分で制御しているプロキシだけを列挙してください。loopback エントリーは、同一ホストのプロキシ/ローカル検出構成（たとえば Tailscale Serve やローカルリバースプロキシ）では有効ですが、loopback リクエストを `gateway.auth.mode: "trusted-proxy"` の対象にすることは**ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに Gateway は `X-Real-IP` を受け入れます。fail-closed 動作のため、デフォルトは `false`。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` に対して追加でブロックする tool 名（デフォルト deny リストを拡張）。
- `gateway.tools.allow`: デフォルト HTTP deny リストから tool 名を除外します。

</Accordion>

### OpenAI 互換エンドポイント

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL 入力ハードニング:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の allowlist は未設定として扱われます。URL 取得を無効にするには `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使ってください。
- 任意のレスポンスハードニングヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（自分で制御する HTTPS origin に対してのみ設定してください。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照）

### マルチインスタンス分離

1 台のホストで複数の Gateway を実行するには、ポートと state dir を一意にしてください。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

簡易フラグ: `--dev`（`~/.openclaw-dev` + ポート `19001` を使用）、`--profile <name>`（`~/.openclaw-<name>` を使用）。

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

- `enabled`: Gateway リスナーで TLS 終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカルの自己署名 cert/key ペアを自動生成します。ローカル/開発用のみです。
- `certPath`: TLS 証明書ファイルへのファイルシステムパス。
- `keyPath`: TLS 秘密鍵ファイルへのファイルシステムパス。権限制限を維持してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用の任意の CA bundle パス。

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

- `mode`: 実行時に config 編集をどのように適用するかを制御します。
  - `"off"`: ライブ編集を無視する。変更には明示的な再起動が必要。
  - `"restart"`: config 変更時に常に Gateway プロセスを再起動する。
  - `"hot"`: 再起動せずにプロセス内で変更を適用する。
  - `"hybrid"`（デフォルト）: まず hot reload を試み、必要なら再起動にフォールバックする。
- `debounceMs`: config 変更適用前のデバウンス時間（ms、非負整数）。
- `deferralTimeoutMs`: 進行中の操作を待つ最大時間（ms）。その後は再起動を強制します（デフォルト: `300000` = 5 分）。

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
クエリ文字列の hook token は拒否されます。

検証と安全性に関する注意:

- `hooks.enabled=true` には、空でない `hooks.token` が必要です。
- `hooks.token` は `gateway.auth.token` と**異なる**必要があります。Gateway token の再利用は拒否されます。
- `hooks.path` は `/` にできません。`/hooks` のような専用サブパスを使ってください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（たとえば `["hook:"]`）。
- mapping または preset がテンプレート化された `sessionKey` を使う場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的な mapping key にはそのオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け入れられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` を通じて解決されます
  - テンプレートレンダリングされた mapping `sessionKey` 値は外部供給として扱われ、これも `hooks.allowRequestSessionKey=true` を必要とします。

<Accordion title="Mapping 詳細">

- `match.path` は `/hooks` 後のサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パス用のペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` は、hook action を返す JS/TS モジュールを指せます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` 内に留まります（絶対パスと traversal は拒否されます）。
- `agentId` は特定のエージェントへルーティングします。不明な ID はデフォルトへフォールバックします。
- `allowedAgentIds`: 明示的ルーティングを制限します（`*` または省略 = 全許可、`[]` = 全拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` がない hook agent 実行用の任意の固定 session key。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元とテンプレート駆動の mapping session key に `sessionKey` 設定を許可します（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（リクエスト + mapping）に対する任意のプレフィックス許可リスト。例: `["hook:"]`。mapping または preset がテンプレート化 `sessionKey` を使う場合には必須になります。
- `deliver: true` は最終返信をチャネルへ送信します。`channel` のデフォルトは `last` です。
- `model` はこの hook 実行用の LLM を上書きします（model catalog が設定されている場合は許可されている必要があります）。

</Accordion>

### Gmail 統合

- 組み込みの Gmail preset は `sessionKey: "hook:gmail:{{messages[0].id}}"` を使います。
- このメッセージごとのルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するよう制限してください。たとえば `["hook:", "hook:gmail:"]` です。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化されたデフォルトではなく、静的 `sessionKey` で preset を上書きしてください。

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
    // enabled: false, // または OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- エージェントが編集可能な HTML/CSS/JS と A2UI を、Gateway ポート配下の HTTP で配信します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）のままにしてください。
- non-loopback bind: canvas ルートは、他の Gateway HTTP サーフェスと同様に Gateway 認証（token/password/trusted-proxy）を必要とします。
- Node WebView は通常 auth ヘッダーを送らないため、Node がペアリングされ接続されると、Gateway は canvas/A2UI アクセス用の node スコープ付き capability URL を通知します。
- capability URL はアクティブな Node WS セッションに結び付けられ、短時間で期限切れになります。IP ベースのフォールバックは使われません。
- 配信される HTML に live-reload クライアントを注入します。
- 空の場合は starter `index.html` を自動作成します。
- A2UI も `/__openclaw__/a2ui/` で配信します。
- 変更には Gateway の再起動が必要です。
- 大きなディレクトリや `EMFILE` エラーの場合は live reload を無効にしてください。

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

- `minimal`（デフォルト）: TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。
- ホスト名のデフォルトは `openclaw` です。`OPENCLAW_MDNS_HOSTNAME` で上書きします。

### ワイドエリア（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。クロスネットワーク discovery には、DNS サーバー（CoreDNS 推奨）+ Tailscale split DNS と組み合わせてください。

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

- インライン env var は、プロセス env にそのキーがない場合にのみ適用されます。
- `.env` ファイル: CWD の `.env` + `~/.openclaw/.env`（どちらも既存 var を上書きしません）。
- `shellEnv`: ログインシェルプロファイルから不足している想定キーを取り込みます。
- 完全な優先順位については [Environment](/ja-JP/help/environment) を参照してください。

### Env var 置換

任意の config 文字列内で `${VAR_NAME}` により env var を参照できます。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 不足または空の var は config 読み込み時にエラーになります。
- リテラル `${VAR}` にしたい場合は `$${VAR}` でエスケープします。
- `$include` と一緒にも使えます。

---

## シークレット

SecretRef は追加的です。平文値も引き続き動作します。

### `SecretRef`

1 つのオブジェクト形状を使います:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON pointer（例 `"/providers/openai/apiKey"`）
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` の id には、`.` または `..` のスラッシュ区切りパスセグメントを含めてはいけません（例: `a/../b` は拒否されます）

### サポートされる認証情報サーフェス

- 正規マトリクス: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、サポートされる `openclaw.json` の認証情報パスを対象にします。
- `auth-profiles.json` の ref も、実行時の解決と監査対象に含まれます。

### Secret プロバイダー設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 任意の明示的 env プロバイダー
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
- Windows ACL 検証が利用できない場合、file と exec プロバイダーパスは fail-closed になります。検証できないが信頼できるパスに対してのみ `allowInsecurePath: true` を設定してください。
- `exec` プロバイダーは絶対 `command` パスを必要とし、stdin/stdout 上のプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクの command パスは拒否されます。解決後ターゲットパスを検証しつつシンボリックリンクパスを許可するには `allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、trusted-dir チェックは解決後ターゲットパスに適用されます。
- `exec` 子環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- Secret ref は有効化時にメモリ内スナップショットへ解決され、その後リクエストパスはそのスナップショットのみを読み取ります。
- アクティブサーフェスフィルタリングは有効化中に適用されます。有効なサーフェス上の未解決 ref は起動/再読み込みを失敗させ、非アクティブなサーフェスは診断付きでスキップされます。

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

- エージェントごとの profile は `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は、静的認証モードに対して値レベル ref（`api_key` 用の `keyRef`、`token` 用の `tokenRef`）をサポートします。
- OAuth モードの profile（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef ベースの auth-profile 認証情報をサポートしません。
- 静的な実行時認証情報は、解決済みメモリ内スナップショットから取得されます。旧来の静的 `auth.json` エントリーは発見時に除去されます。
- 旧来の OAuth インポート元は `~/.openclaw/credentials/oauth.json` です。
- [OAuth](/ja-JP/concepts/oauth) を参照してください。
- Secrets の実行時動作と `audit/configure/apply` ツールについては [Secrets Management](/ja-JP/gateway/secrets) を参照してください。

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
  billing/insufficient-credit エラーにより profile が失敗した場合のベースバックオフ時間（時間単位、デフォルト: `5`）。明示的な billing 文言は
  `401`/`403` 応答でもここに入ることがありますが、プロバイダー固有のテキスト
  マッチャーはそれを所有するプロバイダーにスコープされたままです（たとえば OpenRouter の
  `Key limit exceeded`）。再試行可能な HTTP `402` の usage-window や
  organization/workspace spend-limit メッセージは、代わりに `rate_limit` パスに留まります。
- `billingBackoffHoursByProvider`: billing バックオフ時間の任意のプロバイダーごとの上書き。
- `billingMaxHours`: billing バックオフ指数成長の上限時間（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼の `auth_permanent` 失敗に対するベースバックオフ時間（分単位、デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ成長の上限分数（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使われるローリングウィンドウ時間（デフォルト: `24`）。
- `overloadedProfileRotations`: overloaded エラー時に model フォールバックへ切り替える前に行う、同一プロバイダー内 auth-profile ローテーションの最大数（デフォルト: `1`）。`ModelNotReadyException` のような provider-busy 形状はここに入ります。
- `overloadedBackoffMs`: overloaded なプロバイダー/profile ローテーションを再試行する前の固定遅延（ミリ秒、デフォルト: `0`）。
- `rateLimitedProfileRotations`: rate-limit エラー時に model フォールバックへ切り替える前に行う、同一プロバイダー内 auth-profile ローテーションの最大数（デフォルト: `1`）。この rate-limit バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` のようなプロバイダー形状テキストが含まれます。

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
- 安定したパスにするには `logging.file` を設定してください。
- `consoleLevel` は `--verbose` 時に `debug` へ引き上げられます。
- `maxFileBytes`: 書き込み抑制前のログファイル最大サイズ（バイト単位の正の整数。デフォルト: `524288000` = 500 MB）。本番デプロイでは外部ログローテーションを使用してください。

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

- `enabled`: instrumentation 出力のマスタートグル（デフォルト: `true`）。
- `flags`: 対象を絞ったログ出力を有効化するフラグ文字列の配列（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: セッションが processing 状態のままの間に stuck-session 警告を出す年齢閾値（ミリ秒）。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効化します（デフォルト: `false`）。
- `otel.endpoint`: OTel エクスポート用 collector URL。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストで送信する追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: resource 属性用のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: trace、metrics、または logs のエクスポートを有効化。
- `otel.sampleRate`: trace サンプリング率 `0`–`1`。
- `otel.flushIntervalMs`: 定期 telemetry flush 間隔（ミリ秒）。
- `cacheTrace.enabled`: 埋め込み実行用の cache trace スナップショットを記録します（デフォルト: `false`）。
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

- `channel`: npm/git インストール用のリリースチャネル — `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: Gateway 起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: package install 用のバックグラウンド自動更新を有効化します（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャネル自動適用前の最小遅延時間（デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャネルのロールアウト分散に使う追加時間ウィンドウ（デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャネルの確認実行間隔（時間単位、デフォルト: `1`、最大: `24`）。

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

- `enabled`: ACP 機能全体のゲート（デフォルト: `false`）。
- `dispatch.enabled`: ACP セッションターン dispatch 用の独立したゲート（デフォルト: `true`）。ACP コマンドは利用可能なまま実行だけをブロックしたい場合は `false` に設定します。
- `backend`: デフォルトの ACP ランタイム backend ID（登録済み ACP ランタイム Plugin に一致する必要があります）。
- `defaultAgent`: spawn が明示的なターゲットを指定しない場合のフォールバック ACP ターゲットエージェント ID。
- `allowedAgents`: ACP ランタイムセッションに許可されるエージェント ID の許可リスト。空の場合は追加制限なし。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキストのアイドル flush 時間（ミリ秒）。
- `stream.maxChunkChars`: ストリーミングブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとの繰り返しステータス/tool 行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は段階的にストリーミングし、`"final_only"` はターン終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 隠れた tool イベント後の可視テキストの前に入れる区切り（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影されるアシスタント出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影される ACP ステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベントに対するタグ名から boolean 可視性上書きへの記録。
- `runtime.ttlMinutes`: ACP セッション worker がクリーンアップ対象になるまでのアイドル TTL（分）。
- `runtime.installCommand`: ACP ランタイム環境のブートストラップ時に実行する任意の install コマンド。

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
  - `"random"`（デフォルト）: ローテーションする面白い/季節的なタグライン。
  - `"default"`: 固定の中立的タグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: タグラインテキストなし（バナーのタイトル/バージョンは表示）。
- バナー全体を隠したい場合（タグラインだけでなく）は、env `OPENCLAW_HIDE_BANNER=1` を設定してください。

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

[エージェントデフォルト](/ja-JP/gateway/config-agents#agent-defaults) 配下の `agents.list` identity フィールドを参照してください。

---

## Bridge（旧来、削除済み）

現在のビルドには TCP bridge は含まれていません。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーはもはや config schema の一部ではありません（削除されるまで検証は失敗します。`openclaw doctor --fix` で不明キーを取り除けます）。

<Accordion title="旧来 bridge config（履歴参照）">

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
    webhook: "https://example.invalid/legacy", // 非推奨。保存済み notify:true ジョブ用のフォールバック
    webhookToken: "replace-with-dedicated-token", // 任意。送信 Webhook 認証用 bearer token
    sessionRetention: "24h", // duration 文字列または false
    runLog: {
      maxBytes: "2mb", // デフォルト 2_000_000 バイト
      keepLines: 2000, // デフォルト 2000
    },
  },
}
```

- `sessionRetention`: 完了した分離 Cron 実行セッションを `sessions.json` から削除するまで保持する期間。アーカイブ済み削除 Cron トランスクリプトのクリーンアップも制御します。デフォルト: `24h`。無効にするには `false` を設定してください。
- `runLog.maxBytes`: 実行ログファイル（`cron/runs/<jobId>.jsonl`）ごとの最大サイズ。これを超えると削減されます。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: 実行ログ削減が発生したときに保持される最新行数。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST 配信（`delivery.mode = "webhook"`）に使う bearer token。省略すると認証ヘッダーは送信されません。
- `webhook`: 保存済みジョブで `notify: true` を持つものにのみ使われる、非推奨の旧来フォールバック Webhook URL（http/https）。

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

- `maxAttempts`: 一過性エラー時に one-shot ジョブに対して行う最大リトライ回数（デフォルト: `3`、範囲: `0`–`10`）。
- `backoffMs`: 各リトライ試行に対するバックオフ遅延（ミリ秒）の配列（デフォルト: `[30000, 60000, 300000]`、1–10 エントリー）。
- `retryOn`: リトライを引き起こすエラータイプ — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略すると、すべての一過性タイプをリトライします。

one-shot Cron ジョブにのみ適用されます。繰り返しジョブには別の失敗処理があります。

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

- `enabled`: Cron ジョブの失敗アラートを有効化します（デフォルト: `false`）。
- `after`: アラート発火までの連続失敗回数（正の整数、最小: `1`）。
- `cooldownMs`: 同じジョブに対する繰り返しアラート間の最小ミリ秒数（非負整数）。
- `mode`: 配信モード — `"announce"` はチャネルメッセージで送信し、`"webhook"` は設定済み Webhook へ POST します。
- `accountId`: アラート配信をスコープする任意のアカウントまたはチャネル ID。

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

- 全ジョブに共通する Cron 失敗通知のデフォルト送信先。
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータが存在する場合のデフォルトは `"announce"` です。
- `channel`: announce 配信用のチャネル上書き。`"last"` は最後に分かっている配信チャネルを再利用します。
- `to`: 明示的な announce ターゲットまたは Webhook URL。Webhook モードでは必須です。
- `accountId`: 配信用の任意のアカウント上書き。
- ジョブごとの `delivery.failureDestination` は、このグローバルデフォルトを上書きします。
- グローバルにもジョブごとにも失敗送信先が設定されていない場合、すでに `announce` で配信するジョブは、失敗時にその主要 announce ターゲットへフォールバックします。
- `delivery.failureDestination` は、`sessionTarget="isolated"` ジョブに対してのみサポートされます。ただし、そのジョブの主要 `delivery.mode` が `"webhook"` の場合は除きます。

[Cron ジョブ](/ja-JP/automation/cron-jobs) を参照してください。分離された Cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) として追跡されます。

---

## メディアモデルテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| 変数               | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完全な受信メッセージ本文                          |
| `{{RawBody}}`      | 生の本文（履歴/送信者ラッパーなし）               |
| `{{BodyStripped}}` | グループメンションを除去した本文                  |
| `{{From}}`         | 送信者識別子                                      |
| `{{To}}`           | 宛先識別子                                        |
| `{{MessageSid}}`   | チャネルメッセージ ID                             |
| `{{SessionId}}`    | 現在のセッション UUID                             |
| `{{IsNewSession}}` | 新しいセッションが作成されたとき `"true"`         |
| `{{MediaUrl}}`     | 受信メディアの疑似 URL                            |
| `{{MediaPath}}`    | ローカルメディアパス                              |
| `{{MediaType}}`    | メディアタイプ（image/audio/document/…）          |
| `{{Transcript}}`   | 音声トランスクリプト                              |
| `{{Prompt}}`       | CLI エントリー用に解決されたメディアプロンプト    |
| `{{MaxChars}}`     | CLI エントリー用に解決された最大出力文字数        |
| `{{ChatType}}`     | `"direct"` または `"group"`                       |
| `{{GroupSubject}}` | グループ件名（ベストエフォート）                  |
| `{{GroupMembers}}` | グループメンバーのプレビュー（ベストエフォート）  |
| `{{SenderName}}`   | 送信者表示名（ベストエフォート）                  |
| `{{SenderE164}}`   | 送信者電話番号（ベストエフォート）                |
| `{{Provider}}`     | プロバイダーヒント（whatsapp、telegram、discord など） |

---

## Config include（`$include`）

config を複数ファイルに分割できます。

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

- 単一ファイル: その包含オブジェクトを置き換えます。
- ファイル配列: 順番に deep merge されます（後のものが前のものを上書き）。
- 兄弟キー: include の後にマージされます（include された値を上書き）。
- ネストされた include: 最大 10 レベルまで。
- パス: include 元ファイルからの相対で解決されますが、トップレベル config ディレクトリ（`openclaw.json` の `dirname`）内に留まる必要があります。絶対パスや `../` 形式も、その境界内に解決される場合にのみ許可されます。
- 1 つのトップレベルセクションだけを変更する OpenClaw 所有の書き込みで、そのセクションが単一ファイル include によって支えられている場合、書き込みはその include 先ファイルに反映されます。たとえば `plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` に更新し、`openclaw.json` はそのままにします。
- ルート include、include 配列、兄弟上書きを伴う include は、OpenClaw 所有の書き込みに対して読み取り専用です。そのような書き込みは config をフラット化するのではなく、fail-closed で失敗します。
- エラー: 不足ファイル、パースエラー、循環 include に対して明確なメッセージが出ます。

---

_関連: [Configuration](/ja-JP/gateway/configuration) · [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [Configuration](/ja-JP/gateway/configuration)
- [Configuration examples](/ja-JP/gateway/configuration-examples)
