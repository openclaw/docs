---
read_when:
    - '`tools.*` のポリシー、許可リスト、または実験的機能を設定している場合'
    - カスタムプロバイダを登録する、または base URL を上書きする場合
    - OpenAI 互換のセルフホスト型エンドポイントをセットアップしている場合
summary: ツール設定（ポリシー、実験的トグル、プロバイダバックエンドツール）とカスタムプロバイダ/base-URL のセットアップ
title: 設定 — ツールとカスタムプロバイダ
x-i18n:
    generated_at: "2026-04-24T04:56:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92535fb937f688c7cd39dcf5fc55f4663c8d234388a46611527efad4b7ee85eb
    source_path: gateway/config-tools.md
    workflow: 15
---

`tools.*` 設定キーとカスタムプロバイダ / base-URL のセットアップ。エージェント、
チャネル、その他のトップレベル設定キーについては
[Configuration reference](/ja-JP/gateway/configuration-reference) を参照してください。

## ツール

### ツールプロファイル

`tools.profile` は、`tools.allow` / `tools.deny` の前に適用されるベース許可リストを設定します:

ローカルオンボーディングでは、未設定の場合、新しいローカル設定にデフォルトで `tools.profile: "coding"` が設定されます（既存の明示的なプロファイルは保持されます）。

| プロファイル | 内容                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `minimal`    | `session_status` のみ                                                                                                       |
| `coding`     | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging`  | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                  |
| `full`       | 制限なし（未設定と同じ）                                                                                                    |

### ツールグループ

| グループ           | ツール                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` は `exec` のエイリアスとして受け付けられます）                              |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                   |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                            |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                    |
| `group:ui`         | `browser`, `canvas`                                                                                                      |
| `group:automation` | `cron`, `gateway`                                                                                                        |
| `group:messaging`  | `message`                                                                                                                |
| `group:nodes`      | `nodes`                                                                                                                  |
| `group:agents`     | `agents_list`                                                                                                            |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                       |
| `group:openclaw`   | すべての組み込みツール（プロバイダ Plugin を除く）                                                                       |

### `tools.allow` / `tools.deny`

グローバルなツール許可/拒否ポリシーです（deny が優先）。大文字小文字を区別せず、`*` ワイルドカードをサポートします。Docker sandbox がオフでも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定のプロバイダまたはモデルに対して、さらにツールを制限します。順序: ベースプロファイル → プロバイダプロファイル → allow/deny。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

sandbox 外での昇格された exec アクセスを制御します:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- エージェント単位のオーバーライド（`agents.list[].tools.elevated`）は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとに状態を保存します。インラインディレクティブは単一メッセージにのみ適用されます。
- 昇格された `exec` は sandbox をバイパスし、設定された escape パス（デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`）を使います。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループ安全チェックは **デフォルトで無効** です。有効にするには `enabled: true` を設定してください。
設定はグローバルに `tools.loopDetection` で定義でき、エージェント単位で `agents.list[].tools.loopDetection` によって上書きできます。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: ループ分析のために保持されるツール呼び出し履歴の最大数。
- `warningThreshold`: 警告を出す、進捗なしの繰り返しパターンのしきい値。
- `criticalThreshold`: 深刻なループをブロックするための、より高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: あらゆる進捗なし実行に対する強制停止しきい値。
- `detectors.genericRepeat`: 同一ツール/同一引数の繰り返し呼び出しで警告します。
- `detectors.knownPollNoProgress`: 既知の poll ツール（`process.poll`、`command_status` など）での進捗なしを警告/ブロックします。
- `detectors.pingPong`: 進捗のない交互ペアパターンを警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // または BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 任意。自動検出する場合は省略
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

受信メディア理解（画像/音声/動画）を設定します:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // オプトイン: 完了した非同期 music/video をチャネルへ直接送信
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="メディアモデルエントリフィールド">

**プロバイダエントリ**（`type: "provider"` または省略）:

- `provider`: API プロバイダ ID（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
- `model`: モデル ID の上書き
- `profile` / `preferredProfile`: `auth-profiles.json` のプロファイル選択

**CLI エントリ**（`type: "cli"`）:

- `command`: 実行する実行ファイル
- `args`: テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート）

**共通フィールド:**

- `capabilities`: 任意のリスト（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗した場合は次のエントリにフォールバックします。

プロバイダ認証は標準順序に従います: `auth-profiles.json` → env vars → `models.providers.*.apiKey`。

**非同期完了フィールド:**

- `asyncCompletion.directSend`: `true` の場合、完了した非同期 `music_generate`
  および `video_generate` タスクは、まず直接チャネル配信を試みます。デフォルトは `false`
  （旧来の requester-session wake/model-delivery パス）。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

セッションツール（`sessions_list`、`sessions_history`、`sessions_send`）が
どのセッションを対象にできるかを制御します。

デフォルト: `tree`（現在のセッション + そこから生成されたセッション、たとえば subagent）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注記:

- `self`: 現在のセッションキーのみ。
- `tree`: 現在のセッション + 現在のセッションから生成されたセッション（subagent）。
- `agent`: 現在のエージェント ID に属する任意のセッション（同じエージェント ID の下で送信者ごとのセッションを運用している場合、他ユーザーも含まれることがあります）。
- `all`: 任意のセッション。エージェント間ターゲティングには依然として `tools.agentToAgent` が必要です。
- Sandbox clamp: 現在のセッションが sandbox 化されていて、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であっても visibility は `tree` に強制されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付サポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // オプトイン: インラインファイル添付を許可するには true に設定
        maxTotalBytes: 5242880, // 全ファイル合計 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 ファイルあたり 1 MB
        retainOnSessionKeep: false, // cleanup="keep" のとき添付を保持
      },
    },
  },
}
```

注記:

- 添付は `runtime: "subagent"` でのみサポートされます。ACP ランタイムでは拒否されます。
- ファイルは子 workspace の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
- 添付内容はトランスクリプト永続化から自動的に秘匿化されます。
- Base64 入力は、厳格な alphabet/padding チェックとデコード前サイズガードで検証されます。
- ファイル権限はディレクトリが `0700`、ファイルが `0600` です。
- クリーンアップは `cleanup` ポリシーに従います: `delete` は常に添付を削除し、`keep` は `retainOnSessionKeep: true` の場合のみ保持します。

<a id="toolsexperimental"></a>

### `tools.experimental`

実験的な組み込みツールフラグです。strict-agentic GPT-5 の自動有効化ルールが適用される場合を除き、デフォルトはオフです。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 実験的な update_plan を有効化
    },
  },
}
```

注記:

- `planTool`: 非自明な複数ステップ作業の追跡用に、構造化された `update_plan` ツールを有効にします。
- デフォルト: `agents.defaults.embeddedPi.executionContract`（またはエージェント単位の上書き）が OpenAI または OpenAI Codex の GPT-5 系実行に対して `"strict-agentic"` に設定されている場合を除き `false`。この範囲外でも強制的に有効にするには `true`、strict-agentic GPT-5 実行でも無効のままにするには `false` を設定してください。
- 有効時には、システムプロンプトにも使用ガイダンスが追加されるため、モデルはこれを実質的な作業に対してのみ使い、`in_progress` のステップは常に 1 つまでに保ちます。

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: 生成される sub-agent のデフォルトモデル。省略した場合、sub-agent は呼び出し元のモデルを継承します。
- `allowAgents`: リクエスターエージェントが自身の `subagents.allowAgents` を設定していない場合の、`sessions_spawn` 向けターゲットエージェント ID のデフォルト許可リスト（`["*"]` = 任意。デフォルト: 同じエージェントのみ）。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の、`sessions_spawn` のデフォルトタイムアウト（秒）。`0` はタイムアウトなしを意味します。
- subagent ごとのツールポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダと base URL

OpenClaw は組み込みのモデルカタログを使います。カスタムプロバイダは設定内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` で追加します。

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- カスタム認証が必要な場合は `authHeader: true` + `headers` を使ってください。
- エージェント設定ルートを上書きするには `OPENCLAW_AGENT_DIR`（または旧来の環境変数エイリアス `PI_CODING_AGENT_DIR`）を使います。
- 一致するプロバイダ ID に対するマージ優先順位:
  - 空でないエージェント `models.json` の `baseUrl` 値が優先されます。
  - 空でないエージェント `apiKey` 値は、そのプロバイダが現在の config/auth-profile コンテキストで SecretRef 管理されていない場合にのみ優先されます。
  - SecretRef 管理されたプロバイダ `apiKey` 値は、解決済みシークレットを永続化する代わりに、ソースマーカー（env ref の場合は `ENV_VAR_NAME`、file/exec ref の場合は `secretref-managed`）から再取得されます。
  - SecretRef 管理されたプロバイダ header 値は、ソースマーカー（env ref の場合は `secretref-env:ENV_VAR_NAME`、file/exec ref の場合は `secretref-managed`）から再取得されます。
  - 空または欠落したエージェント `apiKey` / `baseUrl` は、設定の `models.providers` にフォールバックします。
  - 一致するモデルの `contextWindow` / `maxTokens` は、明示的な設定値と暗黙のカタログ値のうち高い方を使います。
  - 一致するモデルの `contextTokens` は、存在する場合は明示的なランタイム上限を保持します。ネイティブなモデルメタデータを変えずに有効コンテキストを制限したい場合に使ってください。
  - 設定で `models.json` を完全に書き換えたい場合は `models.mode: "replace"` を使ってください。
  - マーカー永続化はソース主導です。マーカーは解決済みランタイムシークレット値からではなく、アクティブなソース設定スナップショット（解決前）から書き込まれます。

### プロバイダフィールドの詳細

- `models.mode`: プロバイダカタログの動作（`merge` または `replace`）。
- `models.providers`: プロバイダ ID をキーとするカスタムプロバイダマップ。
  - 安全な編集: 追加更新には `openclaw config set models.providers.<id> '<json>' --strict-json --merge` または `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` を使ってください。`config set` は `--replace` を渡さない限り破壊的置換を拒否します。
- `models.providers.*.api`: リクエストアダプタ（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。
- `models.providers.*.apiKey`: プロバイダ認証情報（SecretRef / env 置換を推奨）。
- `models.providers.*.auth`: 認証戦略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 用に、リクエストへ `options.num_ctx` を注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要な場合、認証情報を `Authorization` ヘッダーで送るよう強制します。
- `models.providers.*.baseUrl`: 上流 API の base URL。
- `models.providers.*.headers`: プロキシ / テナントルーティング用の追加静的ヘッダー。
- `models.providers.*.request`: モデルプロバイダ HTTP リクエスト用のトランスポート上書き。
  - `request.headers`: 追加ヘッダー（プロバイダデフォルトとマージ）。値には SecretRef を使えます。
  - `request.auth`: 認証戦略の上書き。モード: `"provider-default"`（プロバイダ組み込み認証を使う）、`"authorization-bearer"`（`token` と併用）、`"header"`（`headerName`、`value`、任意の `prefix` と併用）。
  - `request.proxy`: HTTP プロキシの上書き。モード: `"env-proxy"`（`HTTP_PROXY` / `HTTPS_PROXY` env vars を使う）、`"explicit-proxy"`（`url` と併用）。どちらのモードでも任意の `tls` サブオブジェクトを受け付けます。
  - `request.tls`: 直接接続用 TLS 上書き。フィールド: `ca`、`cert`、`key`、`passphrase`（すべて SecretRef を受け付ける）、`serverName`、`insecureSkipVerify`。
  - `request.allowPrivateNetwork`: `true` の場合、DNS が private、CGNAT、または類似レンジに解決される `baseUrl` への HTTPS を、プロバイダ HTTP fetch ガード経由で許可します（信頼済みセルフホスト OpenAI 互換エンドポイント向けのオペレーター明示許可）。WebSocket では同じ `request` をヘッダー/TLS に使いますが、この fetch SSRF ガードは適用されません。デフォルトは `false`。
- `models.providers.*.models`: 明示的なプロバイダモデルカタログエントリ。
- `models.providers.*.models.*.contextWindow`: ネイティブモデルのコンテキストウィンドウメタデータ。
- `models.providers.*.models.*.contextTokens`: 任意のランタイムコンテキスト上限。モデルのネイティブ `contextWindow` より小さい有効コンテキスト予算を使いたい場合に使ってください。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性ヒント。`api: "openai-completions"` で、空でない非ネイティブ `baseUrl`（host が `api.openai.com` ではない）の場合、OpenClaw は実行時にこれを `false` に強制します。空または省略した `baseUrl` では、OpenAI のデフォルト動作が維持されます。
- `models.providers.*.models.*.compat.requiresStringContent`: 文字列のみを受け付ける OpenAI 互換チャットエンドポイント向けの任意の互換性ヒント。`true` の場合、OpenClaw はリクエスト送信前に、純テキストの `messages[].content` 配列を平文文字列にフラット化します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 自動検出設定のルート。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙検出をオン/オフします。
- `plugins.entries.amazon-bedrock.config.discovery.region`: 検出用 AWS リージョン。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象限定検出用の任意の provider-id フィルタ。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 検出更新のポーリング間隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出モデル用のフォールバックコンテキストウィンドウ。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出モデル用のフォールバック最大出力トークン数。

### プロバイダ例

<Accordion title="Cerebras（GLM 4.6 / 4.7）">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Cerebras には `cerebras/zai-glm-4.7` を、Z.AI 直結には `zai/glm-4.7` を使ってください。

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定してください。Zen カタログには `opencode/...` 参照、Go カタログには `opencode-go/...` 参照を使います。ショートカット: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` を設定してください。`z.ai/*` と `z-ai/*` は受け付けられるエイリアスです。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- 一般エンドポイントを使う場合は、base URL 上書きを持つカスタムプロバイダを定義してください。

</Accordion>

<Accordion title="Moonshot AI（Kimi）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

中国エンドポイントでは `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn` を使ってください。

ネイティブ Moonshot エンドポイントは、共有の
`openai-completions` トランスポート上でストリーミング使用量互換性を通知し、OpenClaw は組み込みプロバイダ ID のみではなく、エンドポイント機能に基づいてそれを判定します。

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic 互換の組み込みプロバイダです。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic（Anthropic 互換）">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

base URL には `/v1` を含めないでください（Anthropic クライアントが追加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7（直結）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` を設定してください。ショートカット:
`openclaw onboard --auth-choice minimax-global-api` または
`openclaw onboard --auth-choice minimax-cn-api`。
モデルカタログのデフォルトは M2.7 のみです。
Anthropic 互換ストリーミングパスでは、OpenClaw は `thinking` を明示的に
設定していない限り、デフォルトで MiniMax thinking を無効にします。`/fast on` または
`params.fastMode: true` は `MiniMax-M2.7` を
`MiniMax-M2.7-highspeed` に書き換えます。

</Accordion>

<Accordion title="ローカルモデル（LM Studio）">

[Local Models](/ja-JP/gateway/local-models) を参照してください。要点: 十分なハードウェア上で
LM Studio Responses API 経由の大規模ローカルモデルを実行し、フォールバック用に
ホスト型モデルをマージしたままにしてください。

</Accordion>

---

## 関連

- [Configuration reference](/ja-JP/gateway/configuration-reference) — その他のトップレベルキー
- [Configuration — agents](/ja-JP/gateway/config-agents)
- [Configuration — channels](/ja-JP/gateway/config-channels)
- [ツールと Plugins](/ja-JP/tools)
