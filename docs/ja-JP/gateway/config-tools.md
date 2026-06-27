---
read_when:
    - '`tools.*` ポリシー、許可リスト、または実験的機能の設定'
    - カスタムプロバイダーの登録またはベース URL の上書き
    - OpenAI 互換のセルフホスト型エンドポイントを設定する
sidebarTitle: Tools and custom providers
summary: ツール設定（ポリシー、実験的な切り替え、プロバイダー基盤のツール）とカスタムプロバイダー/base-URL のセットアップ
title: 設定 — ツールとカスタムプロバイダー
x-i18n:
    generated_at: "2026-06-27T11:22:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 設定キーとカスタムプロバイダー / ベース URL 設定。エージェント、チャンネル、その他のトップレベル設定キーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## ツール

### ツールプロファイル

`tools.profile` は `tools.allow`/`tools.deny` の前にベース許可リストを設定します。

<Note>
ローカルオンボーディングでは、未設定の場合、新しいローカル設定のデフォルトは `tools.profile: "coding"` になります（既存の明示的なプロファイルは保持されます）。
</Note>

| プロファイル | 含まれるもの                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ                                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | 制限なし（未設定と同じ）                                                                                                                          |

### ツールグループ

| グループ           | ツール                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` は `exec` のエイリアスとして受け入れられます）                               |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | すべての組み込みツール（プロバイダー Plugin は除く）                                                                     |
| `group:plugins`    | 読み込まれた Plugin が所有するツール。`bundle-mcp` 経由で公開される設定済み MCP サーバーを含みます                      |

### サンドボックスツールポリシー内の MCP と Plugin ツール

設定済み MCP サーバーは、`bundle-mcp` Plugin ID 配下の Plugin 所有ツールとして公開されます。通常のツールプロファイルで許可できますが、`tools.sandbox.tools` はサンドボックス化されたセッション向けの追加ゲートです。サンドボックスモードが `"all"` または `"non-main"` の場合、MCP/Plugin ツールを表示するには、サンドボックスツール許可リストに次のいずれかのエントリを含めてください。

- `mcp.servers` からの OpenClaw 管理 MCP サーバーには `bundle-mcp`
- 特定のネイティブ Plugin にはその Plugin ID
- 読み込まれたすべての Plugin 所有ツールには `group:plugins`
- 1 つのサーバーだけを許可したい場合は、`outlook__send_mail` や `outlook__*` のような正確な MCP サーバーツール名またはサーバー glob

サーバー glob は、必ずしも生の `mcp.servers` キーではなく、プロバイダーセーフな MCP サーバープレフィックスを使用します。`[A-Za-z0-9_-]` 以外の文字は `-` になり、英字で始まらない名前には `mcp-` プレフィックスが付き、長いプレフィックスや重複するプレフィックスは切り詰められるかサフィックスが付く場合があります。たとえば、`mcp.servers["Outlook Graph"]` は `outlook-graph__*` のような glob を使用します。

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

そのサンドボックス層のエントリがない場合、MCP サーバー自体は正常に読み込まれても、そのツールはプロバイダーリクエストの前にフィルタリングされます。`openclaw doctor` を使用して、`mcp.servers` 内の OpenClaw 管理サーバーについてこの形を検出してください。バンドル Plugin マニフェストや Claude `.mcp.json` から読み込まれる MCP サーバーも同じサンドボックスゲートを使用しますが、この診断はまだそれらのソースを列挙しません。サンドボックス化されたターンでそれらのツールが消える場合は、同じ許可リストエントリを使用してください。

### `tools.codeMode`

`tools.codeMode` は汎用 OpenClaw コードモードサーフェスを有効にします。ツール付きの実行で有効にすると、モデルに見えるのは `exec` と `wait` のみになります。通常の OpenClaw ツールはサンドボックス内の `tools.*` カタログブリッジの背後に移動し、MCP ツールは生成された `MCP` 名前空間を通じて利用できます。

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

短縮形も受け入れられます。

```json5
{
  tools: { codeMode: true },
}
```

MCP 宣言は、コードモードでは読み取り専用の仮想 API ファイルサーフェスを通じて公開されます。ゲストコードは `API.list("mcp")` と `API.read("mcp/<server>.d.ts")` を呼び出して TypeScript 風のシグネチャを確認してから、`MCP.<server>.<tool>()` を呼び出せます。ランタイム契約、制限、デバッグ手順については、[コードモード](/ja-JP/reference/code-mode)を参照してください。

### `tools.allow` / `tools.deny`

グローバルなツール許可/拒否ポリシー（拒否が優先）。大文字小文字を区別せず、`*` ワイルドカードをサポートします。Docker サンドボックスがオフの場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` と `apply_patch` は別々のツール ID です。`allow: ["write"]` は互換モデルで `apply_patch` も有効にしますが、`deny: ["write"]` は `apply_patch` を拒否しません。すべてのファイル変更をブロックするには、`group:fs` を拒否するか、変更を行う各ツールを明示的に列挙してください。

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

特定のプロバイダーまたはモデルについてツールをさらに制限します。順序: ベースプロファイル → プロバイダープロファイル → 許可/拒否。

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

### `tools.toolsBySender`

特定のリクエスト元 ID についてツールを制限します。これはチャンネルアクセス制御の上に重ねる多層防御です。sender 値はメッセージ本文ではなく、チャンネルアダプターから来る必要があります。

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

キーは明示的なプレフィックスを使用します: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, または `"*"`。チャンネル ID は正規の OpenClaw ID です。`teams` などのエイリアスは `msteams` に正規化されます。従来のプレフィックスなしキーは `id:` としてのみ受け入れられます。照合順序は channel+id、id、e164、username、name、最後にワイルドカードです。

エージェント単位の `agents.list[].tools.toolsBySender` は、空の `{}` ポリシーであっても、一致した場合はグローバルな sender 照合を上書きします。

### `tools.elevated`

サンドボックス外の昇格 `exec` アクセスを制御します。

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

- エージェント単位の上書き（`agents.list[].tools.elevated`）では、さらに制限することしかできません。
- `/elevated on|off|ask|full` は状態をセッションごとに保存します。インラインディレクティブは単一メッセージに適用されます。
- 昇格 `exec` はサンドボックス化をバイパスし、設定されたエスケープパス（デフォルトは `gateway`、exec 対象が `node` の場合は `node`）を使用します。

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
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループ安全チェックは**デフォルトで無効**です。検出を有効にするには `enabled: true` を設定します。設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェント単位に上書きできます。

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
  進捗のない繰り返しパターンに対する警告しきい値。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  重大なループをブロックするための、より高い繰り返ししきい値。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  進捗のない実行に対するハード停止しきい値。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  同じツール/同じ引数の呼び出しが繰り返された場合に警告します。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  既知のポーリングツール（`process.poll`, `command_status` など）で警告/ブロックします。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  進捗のないペアが交互に現れるパターンで警告/ブロックします。
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

受信メディア理解（画像/音声/動画）を設定します。

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
  <Accordion title="Media model entry fields">
    **プロバイダーエントリ**（`type: "provider"` または省略）:

    - `provider`: API プロバイダー ID（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
    - `model`: モデル ID の上書き
    - `profile` / `preferredProfile`: `auth-profiles.json` のプロファイル選択

    **CLI エントリ**（`type: "cli"`）:

    - `command`: 実行する実行可能ファイル
    - `args`: テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート。`openclaw doctor --fix` は非推奨の `{input}` プレースホルダーを `{{MediaPath}}` に移行する）

    **共通フィールド:**

    - `capabilities`: 任意のリスト（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → 画像、`google` → 画像+音声+動画、`groq` → 音声。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
    - `tools.media.image.timeoutSeconds` と一致する画像モデルの `timeoutSeconds` エントリは、エージェントが明示的な `image` ツールを呼び出す場合にも適用される。画像理解では、このタイムアウトはリクエスト自体に適用され、事前の準備作業によって短縮されない。
    - 失敗した場合は次のエントリにフォールバックする。

    プロバイダー認証は標準の順序に従う: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

    **非同期完了フィールド:**

    - `asyncCompletion.directSend`: 非推奨の互換性フラグ。完了した非同期メディアタスクはリクエスト元セッション経由のまま維持されるため、エージェントが結果を受け取り、ユーザーへの伝え方を決定し、ソース配信で必要な場合はメッセージツールを使用する。

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

セッションツール（`sessions_list`、`sessions_history`、`sessions_send`）で対象にできるセッションを制御する。

デフォルト: `tree`（現在のセッション + サブエージェントなど、それによって生成されたセッション）。

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
  <Accordion title="Visibility scopes">
    - `self`: 現在のセッションキーのみ。
    - `tree`: 現在のセッション + 現在のセッションによって生成されたセッション（サブエージェント）。
    - `agent`: 現在のエージェント ID に属する任意のセッション（同じエージェント ID の下で送信者ごとのセッションを実行している場合、他のユーザーを含む可能性がある）。
    - `all`: 任意のセッション。エージェント間の対象指定には引き続き `tools.agentToAgent` が必要。
    - サンドボックスの制限: 現在のセッションがサンドボックス化されていて、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であっても可視性は `tree` に強制される。
    - `all` でない場合、`sessions_list` には、有効なモードを説明し、現在のスコープ外の一部セッションが省略される可能性があることを警告する、コンパクトな `visibility` フィールドが含まれる。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルサポートを制御する。

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
  <Accordion title="Attachment notes">
    - 添付ファイルには `enabled: true` が必要。
    - サブエージェントの添付ファイルは、子ワークスペース内の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化される。
    - ACP 添付ファイルは画像のみであり、同じファイル数、ファイルごとのバイト数、合計バイト数の制限を通過した後、ACP ランタイムへインライン転送される。
    - 添付ファイルの内容はトランスクリプト永続化から自動的に秘匿される。
    - Base64 入力は、厳密なアルファベット/パディングチェックとデコード前のサイズガードで検証される。
    - サブエージェント添付ファイルの権限は、ディレクトリが `0700`、ファイルが `0600`。
    - サブエージェントのクリーンアップは `cleanup` ポリシーに従う: `delete` は常に添付ファイルを削除し、`keep` は `retainOnSessionKeep: true` の場合にのみ保持する。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

実験的な組み込みツールフラグ。厳密なエージェント型 GPT-5 自動有効化ルールが適用されない限り、デフォルトはオフ。

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: 重要な複数ステップ作業の追跡向けに、構造化された `update_plan` ツールを有効にする。
- デフォルト: OpenAI または OpenAI Codex の GPT-5 系実行で、`agents.defaults.embeddedAgent.executionContract`（またはエージェントごとの上書き）が `"strict-agentic"` に設定されている場合を除き、`false`。そのスコープ外でツールを強制的にオンにするには `true` を設定し、厳密なエージェント型 GPT-5 実行でもオフのままにするには `false` を設定する。
- 有効な場合、システムプロンプトにも使用ガイダンスが追加され、モデルが大きな作業にのみ使用し、`in_progress` のステップを最大 1 つに保つようにする。

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
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: 生成されたサブエージェントのデフォルトモデル。省略すると、サブエージェントは呼び出し元のモデルを継承する。
- `allowAgents`: リクエスト元エージェントが独自の `subagents.allowAgents` を設定していない場合に、`sessions_spawn` で構成済みの対象エージェント ID に対するデフォルト許可リスト（`["*"]` = 構成済みの任意の対象。デフォルト: 同じエージェントのみ）。エージェント設定が削除された古いエントリは `sessions_spawn` によって拒否され、`agents_list` から省略される。クリーンアップするには `openclaw doctor --fix` を実行する。
- `runTimeoutSeconds`: `sessions_spawn` のデフォルトタイムアウト（秒）。`0` はタイムアウトなしを意味する。
- `announceTimeoutMs`: Gateway の `agent` アナウンス配信試行ごとのタイムアウト（ミリ秒）。デフォルト: `120000`。一時的な再試行により、アナウンスの総待機時間が設定済みの 1 回分のタイムアウトより長くなる場合がある。
- サブエージェントごとのツールポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

プロバイダー Plugin は独自のモデルカタログ行を公開する。カスタムプロバイダーは、設定内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` で追加する。

カスタム/ローカルプロバイダーの `baseUrl` の設定は、モデル HTTP リクエストに対する狭いネットワーク信頼の判断でもある。OpenClaw は、別の設定オプションを追加したり他のプライベートオリジンを信頼したりせずに、その正確な `scheme://host:port` オリジンを保護された fetch パスで許可する。

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
  <Accordion title="Auth and merge precedence">
    - カスタム認証が必要な場合は `authHeader: true` + `headers` を使用する。
    - エージェント設定ルートは `OPENCLAW_AGENT_DIR` で上書きする。
    - 一致するプロバイダー ID のマージ優先順位:
      - 空でないエージェント `models.json` の `baseUrl` 値が優先される。
      - 空でないエージェント `apiKey` 値は、そのプロバイダーが現在の設定/認証プロファイルコンテキストで SecretRef 管理されていない場合にのみ優先される。
      - SecretRef 管理のプロバイダー `apiKey` 値は、解決済みシークレットを永続化する代わりに、ソースマーカー（環境変数参照の場合は `ENV_VAR_NAME`、ファイル/exec 参照の場合は `secretref-managed`）から更新される。
      - SecretRef 管理のプロバイダーヘッダー値は、ソースマーカー（環境変数参照の場合は `secretref-env:ENV_VAR_NAME`、ファイル/exec 参照の場合は `secretref-managed`）から更新される。
      - 空または欠落しているエージェント `apiKey`/`baseUrl` は、設定内の `models.providers` にフォールバックする。
      - 一致するモデルの `contextWindow`/`maxTokens` は、明示的な設定値と暗黙的なカタログ値のうち高い方を使用する。
      - 一致するモデルの `contextTokens` は、明示的なランタイム上限が存在する場合にそれを保持する。ネイティブのモデルメタデータを変更せずに有効コンテキストを制限するために使用する。
      - プロバイダー Plugin カタログは、エージェントの Plugin 状態の下に、生成された Plugin 所有のカタログシャードとして保存される。
      - 設定で `models.json` とアクティブな Plugin カタログシャードを完全に書き換えたい場合は、`models.mode: "replace"` を使用する。
      - マーカー永続化はソースを正とする。マーカーは、解決済みランタイムシークレット値ではなく、アクティブなソース設定スナップショット（解決前）から書き込まれる。

  </Accordion>
</AccordionGroup>

### プロバイダーフィールドの詳細

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: プロバイダーカタログの動作（`merge` または `replace`）。
    - `models.providers`: プロバイダー ID をキーとするカスタムプロバイダーマップ。
      - 安全な編集: 追加更新には `openclaw config set models.providers.<id> '<json>' --strict-json --merge` または `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` を使用する。`config set` は、`--replace` を渡さない限り破壊的な置換を拒否する。

  </Accordion>
  <Accordion title="プロバイダー接続と認証">
    - `models.providers.*.api`: リクエストアダプター（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。MLX、vLLM、SGLang、ほとんどの OpenAI 互換ローカルサーバーなど、セルフホストの `/v1/chat/completions` バックエンドには `openai-completions` を使用します。`baseUrl` はあるが `api` がないカスタムプロバイダーは、デフォルトで `openai-completions` になります。バックエンドが `/v1/responses` をサポートしている場合のみ `openai-responses` を設定してください。
    - `models.providers.*.apiKey`: プロバイダー認証情報（SecretRef/env 置換を推奨）。
    - `models.providers.*.auth`: 認証戦略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`: モデルエントリで `contextWindow` が設定されていない場合に、このプロバイダー配下のモデルに使うデフォルトのネイティブコンテキストウィンドウ。
    - `models.providers.*.contextTokens`: モデルエントリで `contextTokens` が設定されていない場合に、このプロバイダー配下のモデルに使うデフォルトの実効ランタイムコンテキスト上限。
    - `models.providers.*.maxTokens`: モデルエントリで `maxTokens` が設定されていない場合に、このプロバイダー配下のモデルに使うデフォルトの出力トークン上限。
    - `models.providers.*.timeoutSeconds`: 接続、ヘッダー、本文、リクエスト全体の中断処理を含む、プロバイダー単位の任意のモデル HTTP リクエストタイムアウト（秒）。
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` で、リクエストに `options.num_ctx` を注入します（デフォルト: `true`）。
    - `models.providers.*.authHeader`: 必要な場合に、`Authorization` ヘッダーでの認証情報転送を強制します。
    - `models.providers.*.baseUrl`: 上流 API のベース URL。
    - `models.providers.*.headers`: プロキシ/テナントルーティング用の追加の静的ヘッダー。

  </Accordion>
  <Accordion title="リクエスト転送のオーバーライド">
    `models.providers.*.request`: モデルプロバイダー HTTP リクエストの転送オーバーライド。

    - `request.headers`: 追加ヘッダー（プロバイダーのデフォルトとマージされます）。値には SecretRef を使用できます。
    - `request.auth`: 認証戦略のオーバーライド。モード: `"provider-default"`（プロバイダーの組み込み認証を使用）、`"authorization-bearer"`（`token` と併用）、`"header"`（`headerName`、`value`、任意の `prefix` と併用）。
    - `request.proxy`: HTTP プロキシのオーバーライド。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` 環境変数を使用）、`"explicit-proxy"`（`url` と併用）。どちらのモードも任意の `tls` サブオブジェクトを受け付けます。
    - `request.tls`: 直接接続用の TLS オーバーライド。フィールド: `ca`、`cert`、`key`、`passphrase`（すべて SecretRef を受け付けます）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`: `true` の場合、モデルプロバイダー HTTP fetch ガードを通して、プライベート、CGNAT、または類似の範囲へのモデルプロバイダー HTTP リクエストを許可します。カスタム/ローカルプロバイダーのベース URL は、明示的に設定された正確なオリジンをすでに信頼します。ただし、メタデータ/リンクローカルオリジンは明示的なオプトインなしでは引き続きブロックされます。正確なオリジンの信頼を無効にするには、これを `false` に設定します。WebSocket はヘッダー/TLS には同じ `request` を使用しますが、その fetch SSRF ゲートは使用しません。デフォルトは `false` です。

  </Accordion>
  <Accordion title="モデルカタログエントリ">
    - `models.providers.*.models`: 明示的なプロバイダーモデルカタログエントリ。
    - `models.providers.*.models.*.input`: モデル入力モダリティ。テキスト専用モデルには `["text"]` を、ネイティブ画像/ビジョンモデルには `["text", "image"]` を使用します。選択されたモデルが画像対応としてマークされている場合にのみ、画像添付がエージェントターンに注入されます。
    - `models.providers.*.models.*.contextWindow`: ネイティブモデルのコンテキストウィンドウメタデータ。このモデルについて、プロバイダーレベルの `contextWindow` を上書きします。
    - `models.providers.*.models.*.contextTokens`: 任意のランタイムコンテキスト上限。プロバイダーレベルの `contextTokens` を上書きします。モデルのネイティブ `contextWindow` より小さい実効コンテキスト予算が必要な場合に使用してください。`openclaw models list` は値が異なる場合に両方を表示します。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性ヒント。`api: "openai-completions"` で、空でない非ネイティブの `baseUrl`（ホストが `api.openai.com` ではない）の場合、OpenClaw はランタイムでこれを `false` に強制します。空または省略された `baseUrl` はデフォルトの OpenAI 動作を維持します。
    - `models.providers.*.models.*.compat.requiresStringContent`: 文字列専用の OpenAI 互換チャットエンドポイント向けの任意の互換性ヒント。`true` の場合、OpenClaw は純粋なテキストの `messages[].content` 配列を、リクエスト送信前にプレーン文字列へ平坦化します。
    - `models.providers.*.models.*.compat.strictMessageKeys`: 厳格な OpenAI 互換チャットエンドポイント向けの任意の互換性ヒント。`true` の場合、OpenClaw は送信する Chat Completions メッセージオブジェクトを、リクエスト送信前に `role` と `content` に絞り込みます。
    - `models.providers.*.models.*.compat.thinkingFormat`: 任意の thinking ペイロードヒント。Together 形式の `reasoning.enabled` には `"together"`、トップレベルの `enable_thinking` には `"qwen"`、vLLM など、リクエストレベルのチャットテンプレート kwargs をサポートする Qwen 系 OpenAI 互換サーバー上の `chat_template_kwargs.enable_thinking` には `"qwen-chat-template"` を使用します。設定済みの vLLM Qwen モデルは、これらの形式でバイナリの `/think` 選択肢（`off`、`on`）を公開します。
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: DeepSeek 形式の Chat Completions バックエンド向けの任意の互換性ヒントです。これらのバックエンドでは、リプレイ時に以前のアシスタントメッセージが `reasoning_content` を保持する必要があります。`true` の場合、OpenClaw は送信するアシスタントメッセージ上のそのフィールドを保持します。reasoning が削除された後のリクエストを拒否するカスタム DeepSeek 互換プロキシを接続する場合に使用します。デフォルトは `false` です。

  </Accordion>
  <Accordion title="Amazon Bedrock 検出">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 自動検出設定のルート。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙的な検出のオン/オフを切り替えます。
    - `plugins.entries.amazon-bedrock.config.discovery.region`: 検出に使用する AWS リージョン。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象を絞った検出用の任意のプロバイダー ID フィルター。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 検出更新のポーリング間隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出されたモデルのフォールバックコンテキストウィンドウ。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出されたモデルのフォールバック最大出力トークン数。

  </Accordion>
</AccordionGroup>

インタラクティブなカスタムプロバイダーオンボーディングは、GPT-4o、Claude、Gemini、Qwen-VL、LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V、GLM-4V などの一般的なビジョンモデル ID について画像入力を推定し、既知のテキスト専用ファミリーでは追加の質問を省略します。不明なモデル ID では、引き続き画像サポートを確認します。非インタラクティブオンボーディングも同じ推定を使用します。画像対応メタデータを強制するには `--custom-image-input` を、テキスト専用メタデータを強制するには `--custom-text-input` を渡します。

### プロバイダー例

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    公式の外部 `cerebras` プロバイダーPluginは、`openclaw onboard --auth-choice cerebras-api-key` でこれを設定できます。デフォルトを上書きする場合のみ、明示的なプロバイダー設定を使用してください。

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
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic 互換の組み込みプロバイダーです。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="ローカルモデル (LM Studio)">
    [ローカルモデル](/ja-JP/gateway/local-models) を参照してください。要約: 本格的なハードウェア上で LM Studio Responses API 経由で大規模ローカルモデルを実行し、フォールバック用にホスト型モデルをマージしたままにします。
  </Accordion>
  <Accordion title="MiniMax M3 (直接)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
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
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    `MINIMAX_API_KEY` を設定します。ショートカット: `openclaw onboard --auth-choice minimax-global-api` または `openclaw onboard --auth-choice minimax-cn-api`。モデルカタログはデフォルトで M3 を使用し、M2.7 バリアントも含みます。Anthropic 互換のストリーミングパスでは、`thinking` を明示的に設定しない限り、OpenClaw はデフォルトで MiniMax M2.x thinking を無効化します。MiniMax-M3（および M3.x）は、デフォルトでプロバイダーの省略/適応型 thinking パスのままです。`/fast on` または `params.fastMode: true` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

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

    ネイティブ Moonshot エンドポイントは、共有 `openai-completions` 転送でストリーミング usage 互換性を通知します。OpenClaw は組み込みプロバイダー ID のみではなく、エンドポイント機能に基づいてそれを判定します。

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

    `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定します。Zen カタログには `opencode/...` 参照を、Go カタログには `opencode-go/...` 参照を使用します。ショートカット: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

  </Accordion>
  <Accordion title="Synthetic（Anthropic互換）">
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

    ベース URL では `/v1` を省略してください（Anthropic クライアントが追加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

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

    `ZAI_API_KEY` を設定します。モデル参照は正規の `zai/*` プロバイダー ID を使用します。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

    - 汎用エンドポイント: `https://api.z.ai/api/paas/v4`
    - コーディングエンドポイント（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
    - 汎用エンドポイントでは、ベース URL の上書きを含むカスタムプロバイダーを定義します。

  </Accordion>
</AccordionGroup>

---

## 関連

- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [設定 — チャンネル](/ja-JP/gateway/config-channels)
- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他のトップレベルキー
- [ツールとplugins](/ja-JP/tools)
