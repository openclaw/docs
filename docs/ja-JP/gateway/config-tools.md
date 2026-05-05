---
read_when:
    - '`tools.*` ポリシー、許可リスト、または実験的機能の設定'
    - カスタムプロバイダーの登録またはベース URL の上書き
    - OpenAI 互換のセルフホストエンドポイントのセットアップ
sidebarTitle: Tools and custom providers
summary: ツール設定（ポリシー、実験的トグル、プロバイダー支援ツール）とカスタムプロバイダー/base-URL のセットアップ
title: 設定 — ツールとカスタムプロバイダー
x-i18n:
    generated_at: "2026-05-05T01:45:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9196bff46d8b0f9447fb46b47fc764f5bbc4f0b19eb252d4db611e94e57b4883
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 設定キーとカスタムプロバイダー / ベース URL のセットアップ。エージェント、チャンネル、その他のトップレベル設定キーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## ツール

### ツールプロファイル

`tools.profile` は、`tools.allow`/`tools.deny` の前にベースの許可リストを設定します。

<Note>
ローカルのオンボーディングでは、未設定の場合、新しいローカル設定のデフォルトを `tools.profile: "coding"` にします（既存の明示的なプロファイルは保持されます）。
</Note>

| プロファイル | 含まれるもの                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | 制限なし（未設定と同じ）                                                                                                  |

### ツールグループ

| グループ           | ツール                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` は `exec` のエイリアスとして受け入れられます）                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | すべての組み込みツール（プロバイダー Plugin は除く）                                                                          |

### `tools.allow` / `tools.deny`

グローバルなツールの許可/拒否ポリシー（拒否が優先）。大文字小文字を区別せず、`*` ワイルドカードに対応します。Docker サンドボックスがオフの場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` と `apply_patch` は別々のツール ID です。`allow: ["write"]` は互換性のあるモデルで `apply_patch` も有効にしますが、`deny: ["write"]` は `apply_patch` を拒否しません。すべてのファイル変更をブロックするには、`group:fs` を拒否するか、変更を行う各ツールを明示的に列挙してください。

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

特定のプロバイダーまたはモデルに対してツールをさらに制限します。順序: ベースプロファイル → プロバイダープロファイル → 許可/拒否。

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

サンドボックス外の elevated exec アクセスを制御します。

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

- エージェントごとのオーバーライド（`agents.list[].tools.elevated`）は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとに状態を保存します。インラインディレクティブは単一メッセージに適用されます。
- elevated `exec` はサンドボックスをバイパスし、設定されたエスケープパスを使用します（デフォルトは `gateway`、または exec ターゲットが `node` の場合は `node`）。

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

ツールループの安全性チェックは**デフォルトで無効**です。検出を有効にするには `enabled: true` を設定します。設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとにオーバーライドできます。

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

<ParamField path="historySize" type="number">
  ループ分析のために保持されるツール呼び出し履歴の最大数。
</ParamField>
<ParamField path="warningThreshold" type="number">
  警告のための、進捗のない繰り返しパターンのしきい値。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  重大なループをブロックするための、より高い繰り返ししきい値。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  進捗のない実行に対する強制停止しきい値。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  同じツール/同じ引数の呼び出しが繰り返された場合に警告します。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  既知のポーリングツール（`process.poll`、`command_status` など）で警告/ブロックします。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  進捗のないペアが交互に繰り返されるパターンで警告/ブロックします。
</ParamField>

<Warning>
`warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
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

受信メディアの理解（画像/音声/動画）を設定します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
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
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
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

<AccordionGroup>
  <Accordion title="メディアモデルエントリのフィールド">
    **プロバイダーエントリ**（`type: "provider"` または省略）:

    - `provider`: API プロバイダー ID（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
    - `model`: モデル ID のオーバーライド
    - `profile` / `preferredProfile`: `auth-profiles.json` プロファイル選択

    **CLI エントリ**（`type: "cli"`）:

    - `command`: 実行する実行可能ファイル
    - `args`: テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポートします。`openclaw doctor --fix` は非推奨の `{input}` プレースホルダーを `{{MediaPath}}` に移行します）

    **共通フィールド:**

    - `capabilities`: 任意のリスト（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → 画像、`google` → 画像+音声+動画、`groq` → 音声。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとのオーバーライド。
    - `tools.media.image.timeoutSeconds` と対応する画像モデルの `timeoutSeconds` エントリは、エージェントが明示的な `image` ツールを呼び出す場合にも適用されます。
    - 失敗した場合は次のエントリにフォールバックします。

    プロバイダー認証は標準の順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

    **非同期完了フィールド:**

    - `asyncCompletion.directSend`: 非推奨の互換性フラグ。完了した非同期メディアタスクはリクエスターセッション経由のままになり、エージェントが結果を受け取り、ユーザーへの伝え方を決定し、ソース配信で必要な場合はメッセージツールを使用します。

  </Accordion>
</AccordionGroup>

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

セッションツール（`sessions_list`、`sessions_history`、`sessions_send`）の対象にできるセッションを制御します。

デフォルト: `tree`（現在のセッション + サブエージェントなど、そのセッションから生成されたセッション）。

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

<AccordionGroup>
  <Accordion title="可視性スコープ">
    - `self`: 現在のセッションキーのみ。
    - `tree`: 現在のセッション + 現在のセッションから生成されたセッション（サブエージェント）。
    - `agent`: 現在のエージェント ID に属する任意のセッション（同じエージェント ID の下で送信者ごとのセッションを実行している場合、他のユーザーを含むことがあります）。
    - `all`: 任意のセッション。エージェント間の対象指定には引き続き `tools.agentToAgent` が必要です。
    - サンドボックスのクランプ: 現在のセッションがサンドボックス化されていて、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であっても可視性は強制的に `tree` になります。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルサポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="添付ファイルのメモ">
    - 添付ファイルは `runtime: "subagent"` でのみサポートされます。ACP ランタイムはそれらを拒否します。
    - ファイルは子ワークスペース内の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
    - 添付ファイルの内容は、トランスクリプトの永続化から自動的に秘匿されます。
    - Base64 入力は、厳密なアルファベット/パディングチェックとデコード前のサイズガードで検証されます。
    - ファイル権限は、ディレクトリが `0700`、ファイルが `0600` です。
    - クリーンアップは `cleanup` ポリシーに従います。`delete` は常に添付ファイルを削除し、`keep` は `retainOnSessionKeep: true` の場合にのみ保持します。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

実験的な組み込みツールフラグです。strict-agentic GPT-5 の自動有効化ルールが適用されない限り、デフォルトではオフです。

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: 重要な複数ステップ作業の追跡向けに、構造化された `update_plan` ツールを有効にします。
- デフォルト: OpenAI または OpenAI Codex の GPT-5 ファミリー実行で `agents.defaults.embeddedPi.executionContract`（またはエージェントごとのオーバーライド）が `"strict-agentic"` に設定されていない限り、`false` です。その範囲外でツールを強制的にオンにするには `true` を設定し、strict-agentic GPT-5 実行でもオフのままにするには `false` を設定します。
- 有効な場合、システムプロンプトには使用ガイダンスも追加され、モデルが実質的な作業にのみ使用し、`in_progress` のステップを最大 1 つに保つようになります。

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

- `model`: 生成されるサブエージェントのデフォルトモデルです。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `allowAgents`: リクエスト元エージェントが独自の `subagents.allowAgents` を設定していない場合に、`sessions_spawn` の対象エージェント ID に使われるデフォルトの許可リストです（`["*"]` = 任意、デフォルト: 同じエージェントのみ）。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の、`sessions_spawn` のデフォルトタイムアウト（秒）です。`0` はタイムアウトなしを意味します。
- サブエージェントごとのツールポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

OpenClaw は組み込みのモデルカタログを使用します。カスタムプロバイダーは、設定内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` で追加します。

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

<AccordionGroup>
  <Accordion title="認証とマージの優先順位">
    - カスタム認証が必要な場合は、`authHeader: true` + `headers` を使用します。
    - エージェント設定ルートは `OPENCLAW_AGENT_DIR`（またはレガシー環境変数エイリアスの `PI_CODING_AGENT_DIR`）でオーバーライドします。
    - 一致するプロバイダー ID のマージ優先順位:
      - 空でないエージェントの `models.json` の `baseUrl` 値が優先されます。
      - 空でないエージェントの `apiKey` 値は、そのプロバイダーが現在の設定/認証プロファイルコンテキストで SecretRef 管理されていない場合にのみ優先されます。
      - SecretRef 管理のプロバイダー `apiKey` 値は、解決済みシークレットを永続化する代わりに、ソースマーカー（環境変数参照の場合は `ENV_VAR_NAME`、file/exec 参照の場合は `secretref-managed`）から更新されます。
      - SecretRef 管理のプロバイダーヘッダー値は、ソースマーカー（環境変数参照の場合は `secretref-env:ENV_VAR_NAME`、file/exec 参照の場合は `secretref-managed`）から更新されます。
      - 空または欠落したエージェントの `apiKey`/`baseUrl` は、設定内の `models.providers` にフォールバックします。
      - 一致するモデルの `contextWindow`/`maxTokens` は、明示的な設定値と暗黙のカタログ値のうち高い方を使用します。
      - 一致するモデルの `contextTokens` は、存在する場合は明示的なランタイム上限を保持します。ネイティブモデルメタデータを変更せずに有効コンテキストを制限するために使用します。
      - 設定で `models.json` を完全に書き換えたい場合は、`models.mode: "replace"` を使用します。
      - マーカーの永続化はソースを正とします。マーカーは、解決済みランタイムシークレット値からではなく、アクティブなソース設定スナップショット（解決前）から書き込まれます。

  </Accordion>
</AccordionGroup>

### プロバイダーフィールドの詳細

<AccordionGroup>
  <Accordion title="トップレベルカタログ">
    - `models.mode`: プロバイダーカタログの動作（`merge` または `replace`）です。
    - `models.providers`: プロバイダー ID をキーにしたカスタムプロバイダーマップです。
      - 安全な編集: 追加更新には、`openclaw config set models.providers.<id> '<json>' --strict-json --merge` または `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` を使用します。`config set` は、`--replace` を渡さない限り破壊的な置換を拒否します。

  </Accordion>
  <Accordion title="プロバイダー接続と認証">
    - `models.providers.*.api`: リクエストアダプター（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）です。MLX、vLLM、SGLang、およびほとんどの OpenAI 互換ローカルサーバーのようなセルフホストの `/v1/chat/completions` バックエンドには、`openai-completions` を使用します。`baseUrl` があり `api` がないカスタムプロバイダーは、デフォルトで `openai-completions` になります。バックエンドが `/v1/responses` をサポートする場合にのみ `openai-responses` を設定します。
    - `models.providers.*.apiKey`: プロバイダー認証情報です（SecretRef/env 置換を推奨）。
    - `models.providers.*.auth`: 認証方式（`api-key`、`token`、`oauth`、`aws-sdk`）です。
    - `models.providers.*.contextWindow`: モデルエントリで `contextWindow` が設定されていない場合に、このプロバイダー配下のモデルに使われるデフォルトのネイティブコンテキストウィンドウです。
    - `models.providers.*.contextTokens`: モデルエントリで `contextTokens` が設定されていない場合に、このプロバイダー配下のモデルに使われるデフォルトの有効ランタイムコンテキスト上限です。
    - `models.providers.*.maxTokens`: モデルエントリで `maxTokens` が設定されていない場合に、このプロバイダー配下のモデルに使われるデフォルトの出力トークン上限です。
    - `models.providers.*.timeoutSeconds`: 接続、ヘッダー、本文、リクエスト全体の中止処理を含む、プロバイダーごとの任意のモデル HTTP リクエストタイムアウト秒数です。
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` の場合、リクエストに `options.num_ctx` を挿入します（デフォルト: `true`）。
    - `models.providers.*.authHeader`: 必要な場合、`Authorization` ヘッダーで認証情報を送信するよう強制します。
    - `models.providers.*.baseUrl`: 上流 API のベース URL です。
    - `models.providers.*.headers`: プロキシ/テナントルーティング用の追加静的ヘッダーです。

  </Accordion>
  <Accordion title="リクエスト転送のオーバーライド">
    `models.providers.*.request`: モデルプロバイダー HTTP リクエストの転送オーバーライドです。

    - `request.headers`: 追加ヘッダーです（プロバイダーのデフォルトとマージされます）。値は SecretRef を受け付けます。
    - `request.auth`: 認証方式のオーバーライドです。モード: `"provider-default"`（プロバイダー組み込みの認証を使用）、`"authorization-bearer"`（`token` を使用）、`"header"`（`headerName`、`value`、任意の `prefix` を使用）。
    - `request.proxy`: HTTP プロキシのオーバーライドです。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` 環境変数を使用）、`"explicit-proxy"`（`url` を使用）。どちらのモードも任意の `tls` サブオブジェクトを受け付けます。
    - `request.tls`: 直接接続用の TLS オーバーライドです。フィールド: `ca`、`cert`、`key`、`passphrase`（すべて SecretRef を受け付けます）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`: `true` の場合、プロバイダー HTTP fetch ガード経由で、DNS がプライベート、CGNAT、または類似の範囲に解決されるときでも `baseUrl` への HTTPS を許可します（信頼されたセルフホスト OpenAI 互換エンドポイント向けの運用者オプトイン）。`localhost`、`127.0.0.1`、`[::1]` のようなループバックのモデルプロバイダーストリーム URL は、これが明示的に `false` に設定されていない限り自動的に許可されます。LAN、tailnet、プライベート DNS ホストは引き続きオプトインが必要です。WebSocket はヘッダー/TLS に同じ `request` を使用しますが、その fetch SSRF ゲートは使用しません。デフォルトは `false` です。

  </Accordion>
  <Accordion title="モデルカタログエントリ">
    - `models.providers.*.models`: 明示的なプロバイダーモデルカタログエントリです。
    - `models.providers.*.models.*.input`: モデル入力モダリティです。テキストのみのモデルには `["text"]` を使用し、ネイティブ画像/ビジョンモデルには `["text", "image"]` を使用します。画像添付ファイルは、選択されたモデルが画像対応としてマークされている場合にのみエージェントターンに挿入されます。
    - `models.providers.*.models.*.contextWindow`: ネイティブモデルのコンテキストウィンドウメタデータです。これは、そのモデルについてプロバイダーレベルの `contextWindow` をオーバーライドします。
    - `models.providers.*.models.*.contextTokens`: 任意のランタイムコンテキスト上限です。これはプロバイダーレベルの `contextTokens` をオーバーライドします。モデルのネイティブ `contextWindow` より小さい有効コンテキスト予算にしたい場合に使用します。`openclaw models list` は、両方の値が異なる場合にその両方を表示します。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性ヒントです。空でない非ネイティブ `baseUrl`（ホストが `api.openai.com` ではない）を持つ `api: "openai-completions"` の場合、OpenClaw はランタイムでこれを `false` に強制します。空または省略された `baseUrl` は、デフォルトの OpenAI 動作を維持します。
    - `models.providers.*.models.*.compat.requiresStringContent`: 文字列のみの OpenAI 互換チャットエンドポイント向けの任意の互換性ヒントです。`true` の場合、OpenClaw はリクエスト送信前に純粋なテキストの `messages[].content` 配列をプレーン文字列へ平坦化します。

  </Accordion>
  <Accordion title="Amazon Bedrock ディスカバリー">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 自動ディスカバリー設定のルートです。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙のディスカバリーをオン/オフにします。
    - `plugins.entries.amazon-bedrock.config.discovery.region`: ディスカバリー用の AWS リージョンです。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象を絞ったディスカバリー向けの任意のプロバイダー ID フィルターです。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ディスカバリー更新のポーリング間隔です。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出されたモデル向けのフォールバックコンテキストウィンドウです。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出されたモデル向けのフォールバック最大出力トークン数です。

  </Accordion>
</AccordionGroup>

インタラクティブなカスタムプロバイダーのオンボーディングは、GPT-4o、Claude、Gemini、Qwen-VL、LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V、GLM-4V のような一般的なビジョンモデル ID に対して画像入力を推測し、既知のテキストのみのファミリーでは追加の質問をスキップします。不明なモデル ID では、引き続き画像サポートの入力を求めます。非インタラクティブなオンボーディングも同じ推測を使用します。画像対応メタデータを強制するには `--custom-image-input` を渡し、テキストのみのメタデータを強制するには `--custom-text-input` を渡します。

### プロバイダー例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7 / GPT OSS）">
    バンドルされている `cerebras` プロバイダー Plugin は、`openclaw onboard --auth-choice cerebras-api-key` 経由でこれを設定できます。明示的なプロバイダー設定は、デフォルトをオーバーライドする場合にのみ使用します。

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
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
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Cerebras には `cerebras/zai-glm-4.7` を使用し、Z.AI 直接には `zai/glm-4.7` を使用します。

  </Accordion>
  <Accordion title="Kimi コーディング">
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

    Anthropic 互換の組み込みプロバイダーです。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="ローカルモデル (LM Studio)">
    [ローカルモデル](/ja-JP/gateway/local-models)を参照してください。要約: 本格的なハードウェア上で LM Studio Responses API 経由の大規模ローカルモデルを実行し、フォールバック用にホスト型モデルをマージしたままにします。
  </Accordion>
  <Accordion title="MiniMax M2.7 (直接)">
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
                input: ["text"],
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

    `MINIMAX_API_KEY` を設定します。ショートカット: `openclaw onboard --auth-choice minimax-global-api` または `openclaw onboard --auth-choice minimax-cn-api`。モデルカタログはデフォルトで M2.7 のみです。Anthropic 互換ストリーミングパスでは、自分で明示的に `thinking` を設定しない限り、OpenClaw はデフォルトで MiniMax の thinking を無効にします。`/fast on` または `params.fastMode: true` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
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

    中国エンドポイントの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

    ネイティブ Moonshot エンドポイントは、共有 `openai-completions` トランスポート上でのストリーミング使用量互換性を公開し、OpenClaw は組み込みプロバイダー ID だけでなくエンドポイント機能に基づいてそれを判定します。

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

    `OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) を設定します。Zen カタログには `opencode/...` 参照を、Go カタログには `opencode-go/...` 参照を使用します。ショートカット: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

  </Accordion>
  <Accordion title="Synthetic (Anthropic 互換)">
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

    ベース URL では `/v1` を省略する必要があります (Anthropic クライアントが付加します)。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
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

    `ZAI_API_KEY` を設定します。`z.ai/*` と `z-ai/*` は受け入れられるエイリアスです。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

    - 汎用エンドポイント: `https://api.z.ai/api/paas/v4`
    - コーディングエンドポイント (デフォルト): `https://api.z.ai/api/coding/paas/v4`
    - 汎用エンドポイントの場合は、ベース URL の上書きを持つカスタムプロバイダーを定義します。

  </Accordion>
</AccordionGroup>

---

## 関連

- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [設定 — チャンネル](/ja-JP/gateway/config-channels)
- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他のトップレベルキー
- [ツールと plugins](/ja-JP/tools)
