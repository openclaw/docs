---
read_when:
    - '`tools.*` ポリシー、許可リスト、または試験的機能の設定'
    - カスタムプロバイダーの登録またはベースURLの上書き
    - OpenAI互換のセルフホストエンドポイントのセットアップ
sidebarTitle: Tools and custom providers
summary: ツール設定（ポリシー、実験的な切り替え、プロバイダー支援ツール）とカスタムプロバイダー/base-URL のセットアップ
title: 設定 — ツールとカスタムプロバイダー
x-i18n:
    generated_at: "2026-07-05T11:20:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5205ff85e78d2eaa8f4eeced902e86383b9f92d8d1762b64d54f1e10c9bc379b
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 設定キーとカスタムプロバイダー / ベース URL セットアップ。エージェント、チャンネル、その他のトップレベル設定キーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## ツール

### ツールプロファイル

`tools.profile` は、`tools.allow`/`tools.deny` の前にベース許可リストを設定します。

<Note>
ローカルオンボーディングでは、未設定の場合、新しいローカル設定のデフォルトが `tools.profile: "coding"` になります（既存の明示的なプロファイルは保持されます）。
</Note>

| プロファイル | 含まれるもの |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `full`      | 制限なし（未設定と同じ） |

`coding` と `messaging` は、`bundle-mcp`（設定済み MCP サーバー）も暗黙的に許可します。

### ツールグループ

| グループ | ツール |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` は `exec` のエイリアスとして受け付けられます） |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch` |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get` |
| `group:web`        | `web_search`, `x_search`, `web_fetch` |
| `group:ui`         | `browser`, `canvas` |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway` |
| `group:messaging`  | `message` |
| `group:nodes`      | `nodes` |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop` |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` |
| `group:openclaw`   | 上記すべての組み込みツール。ただし `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` は除きます（Plugin ツールは除外） |
| `group:plugins`    | 読み込まれた Plugin が所有するツール。`bundle-mcp` を通じて公開される設定済み MCP サーバーを含みます |

### サンドボックスツールポリシー内の MCP と Plugin ツール

設定済み MCP サーバーは、`bundle-mcp` Plugin ID の下で Plugin 所有ツールとして公開されます。通常のツールプロファイルでそれらを許可できますが、`tools.sandbox.tools` はサンドボックス化されたセッション向けの追加ゲートです。サンドボックスモードが `"all"` または `"non-main"` の場合、MCP/Plugin ツールを表示する必要があるときは、サンドボックスツール許可リストに次のいずれかのエントリを含めてください。

- `mcp.servers` からの OpenClaw 管理 MCP サーバーには `bundle-mcp`
- 特定のネイティブ Plugin にはその Plugin ID
- 読み込まれたすべての Plugin 所有ツールには `group:plugins`
- 1 つのサーバーだけが必要な場合は、`outlook__send_mail` や `outlook__*` などの正確な MCP サーバーツール名またはサーバー glob

サーバー glob は、必ずしも生の `mcp.servers` キーではなく、プロバイダーに安全な MCP サーバープレフィックスを使用します。`[A-Za-z0-9_-]` 以外の文字は `-` になり、文字で始まらない名前には `mcp-` プレフィックスが付き、長いプレフィックスや重複するプレフィックスは切り詰められたりサフィックスが付いたりすることがあります。たとえば、`mcp.servers["Outlook Graph"]` は `outlook-graph__*` のような glob を使用します。

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

そのサンドボックス層のエントリがない場合でも、MCP サーバーは正常に読み込まれることがありますが、そのツールはプロバイダーリクエストの前にフィルターされます。`openclaw doctor` を使用して、`mcp.servers` 内の OpenClaw 管理サーバーについてこの形を検出してください。バンドルされた Plugin マニフェストや Claude `.mcp.json` から読み込まれた MCP サーバーも同じサンドボックスゲートを使用しますが、この診断ではまだそれらのソースは列挙されません。サンドボックス化されたターンでそれらのツールが消える場合は、同じ許可リストエントリを使用してください。

### `tools.codeMode`

`tools.codeMode` は、汎用 OpenClaw コードモードサーフェスを有効にします。ツール付きの実行で有効にすると、モデルには `exec` と `wait` のみが表示されます。通常の OpenClaw ツールは、サンドボックス内の `tools.*` カタログブリッジの背後に移動し、MCP ツールは生成された `MCP` 名前空間を通じて利用できます。

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

短縮形も受け付けられます。

```json5
{
  tools: { codeMode: true },
}
```

MCP 宣言は、コードモードの読み取り専用仮想 API ファイルサーフェスを通じて公開されます。ゲストコードは `MCP.<server>.<tool>()` を呼び出す前に、`API.list("mcp")` と `API.read("mcp/<server>.d.ts")` を呼び出して TypeScript 風のシグネチャを調べることができます。ランタイム契約、制限、デバッグ手順については、[コードモード](/ja-JP/reference/code-mode)を参照してください。

### `tools.allow` / `tools.deny`

グローバルツール許可/拒否ポリシー（拒否が優先）。大文字と小文字は区別されず、`*` ワイルドカードをサポートします。Docker サンドボックスがオフの場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` と `apply_patch` は別々のツール ID です。`allow: ["write"]` は、互換性のあるモデルでは `apply_patch` も有効にしますが、`deny: ["write"]` は `apply_patch` を拒否しません。すべてのファイル変更をブロックするには、`group:fs` を拒否するか、変更を行う各ツールを明示的に列挙します。

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` と `alsoAllow` を同じスコープ（`tools`、`tools.byProvider.<id>`、`agents.list[].tools`）に同時に設定することはできません。設定検証で拒否されます。`alsoAllow` のエントリを `allow` にマージするか、`allow` を削除して代わりに `profile` + `alsoAllow` を使用します。
</Note>

### `tools.byProvider`

特定のプロバイダーまたはモデルのツールをさらに制限します。順序: ベースプロファイル → プロバイダープロファイル → 許可/拒否。

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

特定のリクエスター ID のツールを制限します。これはチャネルアクセス制御に重ねる多層防御です。送信者の値はメッセージ本文ではなく、チャネルアダプターから取得する必要があります。

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

キーは明示的なプレフィックスを使用します: `channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、または `"*"`。チャネル ID は正規の OpenClaw ID です。`teams` のようなエイリアスは `msteams` に正規化されます。従来のプレフィックスなしキーは `id:` としてのみ受け付けられます。照合順序は channel+id、id、e164、username、name、その後にワイルドカードです。

エージェントごとの `agents.list[].tools.toolsBySender` は、一致した場合、空の `{}` ポリシーでもグローバルな送信者照合を上書きします。

### `tools.elevated`

サンドボックス外の昇格された exec アクセスを制御します。

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

- エージェントごとの上書き（`agents.list[].tools.elevated`）は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとに状態を保存します。インラインディレクティブは単一メッセージに適用されます。
- 昇格された `exec` はサンドボックスをバイパスし、設定されたエスケープパス（デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`）を使用します。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

表示されている値は `applyPatch.allowModels` を除いてデフォルトです（デフォルトでは空/未設定で、互換性のある任意のモデルが `apply_patch` を使用できることを意味します）。`approvalRunningNoticeMs` は、承認付き exec の実行が長引いた場合に実行中通知を出します。`0` にすると無効化されます。

### `tools.loopDetection`

ツールループ安全チェックは**デフォルトで無効**です。検出を有効にするには `enabled: true` を設定します。設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとに上書きできます。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  ループ分析のために保持されるツール呼び出し履歴の最大数。
</ParamField>
<ParamField path="warningThreshold" type="number">
  警告対象となる、進捗のない繰り返しパターンのしきい値。
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  利用できない/不明な同じツール名への繰り返し呼び出しを、この回数の失敗後にブロックします。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  重大なループをブロックするための、より高い繰り返ししきい値。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  進捗のない実行を強制停止するしきい値。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  同じツール/同じ引数の呼び出しが繰り返された場合に警告します。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  既知のポーリングツール（`process.poll`、`command_status` など）で警告/ブロックします。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  進捗のないペアが交互に現れるパターンで警告/ブロックします。
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  自動 Compaction 後にガードが有効なままになる試行回数。同じ（ツール、引数、結果）をそのウィンドウ内でエージェントが繰り返した場合は中止します。
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
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
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

表示されている値は、`provider` と `userAgent` を除いてデフォルトです。`maxResponseBytes` は 32000–10000000 にクランプされます。`maxChars` は `maxCharsCap` にクランプされます（より大きな応答を許可するには `maxCharsCap` を引き上げます）。

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

`concurrency`（デフォルト `2`）、`audio.maxBytes`（デフォルト 20 MB）、`video.maxBytes`（デフォルト 50 MB）はデフォルト値で表示されています。`image.maxBytes` のデフォルトは 10 MB です。機能別のリクエストタイムアウトのデフォルトは、画像/音声が `60` 秒、動画が `120` 秒です。

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **プロバイダーエントリ**（`type: "provider"` または省略）:

    - `provider`: API プロバイダー ID（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
    - `model`: モデル ID のオーバーライド
    - `profile` / `preferredProfile`: `auth-profiles.json` プロファイル選択

    **CLI エントリ**（`type: "cli"`）:

    - `command`: 実行する実行可能ファイル
    - `args`: テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポートします。`openclaw doctor --fix` は非推奨の `{input}` プレースホルダーを `{{MediaPath}}` に移行します）

    **共通フィールド:**

    - `capabilities`: 任意のリスト（`image`、`audio`、`video`）。各プロバイダー Plugin は独自のデフォルト機能セットを宣言します。たとえば、バンドルされた `openai` プロバイダーはデフォルトで画像+音声、`anthropic`/`minimax` は画像、`google` は画像+音声+動画、`groq` は音声です。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリ別のオーバーライド。
    - `tools.media.image.timeoutSeconds` と一致する画像モデルの `timeoutSeconds` エントリは、エージェントが明示的な `image` ツールを呼び出す場合にも適用されます。画像理解では、このタイムアウトはリクエスト自体に適用され、先行する準備作業によって短縮されません。
    - 失敗した場合は次のエントリにフォールバックします。

    プロバイダー認証は標準の順序に従います: `auth-profiles.json` → env vars → `models.providers.*.apiKey`。

    **非同期完了フィールド:**

    - `asyncCompletion.directSend`: 非推奨の互換性フラグ。完了した非同期メディアタスクはリクエスターセッション仲介のままになり、エージェントが結果を受け取り、ユーザーへの伝え方を判断し、送信元の配信で必要な場合はメッセージツールを使用します。

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

セッションツール（`sessions_list`、`sessions_history`、`sessions_send`）でターゲットにできるセッションを制御します。

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
    - `agent`: 現在のエージェント ID に属する任意のセッション（同じエージェント ID の下で送信者別セッションを実行している場合、他のユーザーを含むことがあります）。
    - `all`: 任意のセッション。エージェント間ターゲティングには引き続き `tools.agentToAgent` が必要です。
    - サンドボックスのクランプ: 現在のセッションがサンドボックス化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"`（デフォルト）の場合、`tools.sessions.visibility="all"` であっても可視性は強制的に `tree` になります。
    - `all` でない場合、`sessions_list` には有効なモードを説明するコンパクトな `visibility` フィールドと、現在のスコープ外の一部のセッションが省略される可能性があるという警告が含まれます。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイル対応を制御します。

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
    - 添付ファイルには `enabled: true` が必要です。
    - サブエージェント添付ファイルは、子ワークスペース内の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
    - ACP 添付ファイルは画像のみで、同じファイル数、ファイルごとのバイト数、合計バイト数の制限を通過した後、ACP ランタイムへインライン転送されます。
    - 添付ファイルの内容はトランスクリプト永続化から自動的に編集されます。
    - Base64 入力は、厳密なアルファベット/パディングチェックとデコード前サイズガードで検証されます。
    - サブエージェント添付ファイルのファイル権限は、ディレクトリが `0700`、ファイルが `0600` です。
    - サブエージェントのクリーンアップは `cleanup` ポリシーに従います。`delete` は常に添付ファイルを削除し、`keep` は `retainOnSessionKeep: true` の場合にのみ保持します。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

実験的な組み込みツールフラグ。厳格エージェント型 GPT-5 の自動有効化ルールが適用されない限り、デフォルトではオフです。

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: 自明でない複数ステップ作業の追跡のために、構造化された `update_plan` ツールを有効にします。
- デフォルト: `agents.defaults.embeddedAgent.executionContract`（またはエージェント別のオーバーライド）が、GPT-5 ファミリーのモデル ID に対して `openai` プロバイダーで実行する `"strict-agentic"` に設定されていない限り `false` です（OpenAI Codex CLI 実行も対象です。Codex の認証/モデルルーティングは `openai` プロバイダー配下にあるためです）。そのスコープ外でツールを強制的にオンにするには `true` を設定し、厳格エージェント型 GPT-5 実行でもオフのままにするには `false` を設定します。
- 有効にすると、システムプロンプトにも使用ガイダンスが追加され、モデルは実質的な作業にのみ使用し、`in_progress` のステップを最大 1 つに保ちます。

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

- `model`: 生成されたサブエージェントのデフォルトモデル。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `allowAgents`: リクエスターエージェントが独自の `subagents.allowAgents` を設定していない場合の、`sessions_spawn` 用に設定済みターゲットエージェント ID のデフォルト許可リスト（`["*"]` = 任意の設定済みターゲット。デフォルト: 同じエージェントのみ）。エージェント設定が削除された古いエントリは `sessions_spawn` によって拒否され、`agents_list` から省略されます。クリーンアップするには `openclaw doctor --fix` を実行します。
- `maxConcurrent`: サブエージェント実行の最大同時数。デフォルト: `8`。
- `runTimeoutSeconds`: 呼び出し元が独自のオーバーライドを渡さない場合の、`sessions_spawn` のタイムアウト（秒）。デフォルト: `0`（タイムアウトなし）。上に示した `900` は一般的なオプトイン値であり、組み込みのデフォルトではありません。
- `announceTimeoutMs`: Gateway `agent` アナウンス配信試行の呼び出し別タイムアウト（ミリ秒）。デフォルト: `120000`。一時的な再試行により、合計アナウンス待機時間が設定された 1 回分のタイムアウトより長くなることがあります。
- `archiveAfterMinutes`: サブエージェントセッション完了後、自動アーカイブされるまでの分数。デフォルト: `60`。`0` は自動アーカイブを無効にします。
- サブエージェント別ツールポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

プロバイダー Plugin は独自のモデルカタログ行を公開します。設定内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` からカスタムプロバイダーを追加します。

カスタム/ローカルプロバイダーの `baseUrl` を設定することは、モデル HTTP リクエストに対する限定的なネットワーク信頼判断でもあります。OpenClaw は、別の設定オプションを追加したり他のプライベートオリジンを信頼したりすることなく、その正確な `scheme://host:port` オリジンをガード付き fetch パスで許可します。

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
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
    - カスタム認証が必要な場合は `authHeader: true` + `headers` を使用します。
    - エージェント設定ルートは `OPENCLAW_AGENT_DIR` でオーバーライドします。
    - 一致するプロバイダー ID のマージ優先順位:
      - 空でないエージェント `models.json` の `baseUrl` 値が優先されます。
      - 空でないエージェント `apiKey` 値は、そのプロバイダーが現在の設定/認証プロファイルコンテキストで SecretRef 管理されていない場合にのみ優先されます。
      - SecretRef 管理のプロバイダー `apiKey` 値は、解決済みシークレットを永続化する代わりに、ソースマーカー（env 参照の場合は `ENV_VAR_NAME`、file/exec 参照の場合は `secretref-managed`）から更新されます。
      - SecretRef 管理のプロバイダーヘッダー値は、ソースマーカー（env 参照の場合は `secretref-env:ENV_VAR_NAME`、file/exec 参照の場合は `secretref-managed`）から更新されます。
      - 空または欠落しているエージェント `apiKey`/`baseUrl` は、設定内の `models.providers` にフォールバックします。
      - 一致するモデル `contextWindow`/`maxTokens`: 明示的な設定値が存在し有効（正の有限数）な場合はそれが優先されます。それ以外の場合は暗黙的/生成されたカタログ値が使用されます。
      - 一致するモデル `contextTokens` は同じ明示値優先、それ以外は暗黙値のルールに従います。ネイティブモデルメタデータを変更せずに有効コンテキストを制限するために使用します。
      - プロバイダー Plugin カタログは、エージェントの Plugin 状態配下に、生成された Plugin 所有のカタログシャードとして保存されます。
      - 設定で `models.json` を完全に書き換え、Plugin 所有のカタログシャードのマージをスキップしたい場合は、`models.mode: "replace"` を使用します。
      - マーカー永続化はソースを権威とします。マーカーは解決済みランタイムシークレット値からではなく、アクティブなソース設定スナップショット（解決前）から書き込まれます。

  </Accordion>
</AccordionGroup>

### プロバイダーフィールドの詳細

<AccordionGroup>
  <Accordion title="トップレベルカタログ">
    - `models.mode`: プロバイダーカタログの動作（`merge` または `replace`）。
    - `models.providers`: プロバイダー ID をキーにしたカスタムプロバイダーマップ。
      - 安全な編集: 追加更新には `openclaw config set models.providers.<id> '<json>' --strict-json --merge` または `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` を使用します。`--replace` を渡さない限り、`config set` は破壊的な置換を拒否します。

  </Accordion>
  <Accordion title="プロバイダー接続と認証">
    - `models.providers.*.api`: リクエストアダプター（`openai-completions`、`openai-responses`、`openai-chatgpt-responses`、`anthropic-messages`、`google-generative-ai`、`google-vertex`、`github-copilot`、`bedrock-converse-stream`、`ollama`、`azure-openai-responses`）。MLX、vLLM、SGLang、多くの OpenAI 互換ローカルサーバーなど、セルフホストの `/v1/chat/completions` バックエンドには `openai-completions` を使用します。`baseUrl` はあるが `api` がないカスタムプロバイダーは、デフォルトで `openai-completions` になります。バックエンドが `/v1/responses` をサポートしている場合にのみ `openai-responses` を設定します。
    - `models.providers.*.apiKey`: プロバイダー認証情報（SecretRef/env 置換を推奨）。
    - `models.providers.*.auth`: 認証方式（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`: モデルエントリーが `contextWindow` を設定していない場合に、このプロバイダー配下のモデルに使われるデフォルトのネイティブコンテキストウィンドウ。
    - `models.providers.*.contextTokens`: モデルエントリーが `contextTokens` を設定していない場合に、このプロバイダー配下のモデルに使われるデフォルトの有効ランタイムコンテキスト上限。
    - `models.providers.*.maxTokens`: モデルエントリーが `maxTokens` を設定していない場合に、このプロバイダー配下のモデルに使われるデフォルトの出力トークン上限。
    - `models.providers.*.timeoutSeconds`: 接続、ヘッダー、本文、リクエスト全体の中断処理を含む、任意のプロバイダー単位モデル HTTP リクエストタイムアウト秒数。
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` の場合、リクエストに `options.num_ctx` を注入します（デフォルト: `true`）。
    - `models.providers.*.authHeader`: 必要な場合に、認証情報の転送を `Authorization` ヘッダーに強制します。
    - `models.providers.*.baseUrl`: 上流 API のベース URL。
    - `models.providers.*.headers`: プロキシ/テナントルーティング用の追加の静的ヘッダー。

  </Accordion>
  <Accordion title="リクエスト転送の上書き">
    `models.providers.*.request`: モデルプロバイダー HTTP リクエストの転送上書き。

    - `request.headers`: 追加ヘッダー（プロバイダーのデフォルトとマージされます）。値は SecretRef を受け付けます。
    - `request.auth`: 認証方式の上書き。モード: `"provider-default"`（プロバイダー組み込みの認証を使用）、`"authorization-bearer"`（`token` と併用）、`"header"`（`headerName`、`value`、任意の `prefix` と併用）。
    - `request.proxy`: HTTP プロキシの上書き。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` 環境変数を使用）、`"explicit-proxy"`（`url` と併用）。どちらのモードも任意の `tls` サブオブジェクトを受け付けます。
    - `request.tls`: 直接接続用の TLS 上書き。フィールド: `ca`、`cert`、`key`、`passphrase`（すべて SecretRef を受け付けます）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`: `true` の場合、プロバイダー HTTP fetch ガードを通じて、モデルプロバイダー HTTP リクエストがプライベート、CGNAT、または類似の範囲に送信されることを許可します。カスタム/ローカルプロバイダーのベース URL は、メタデータ/link-local オリジンを除き、設定済みの正確なオリジンをすでに信頼します。メタデータ/link-local オリジンは、明示的にオプトインしない限りブロックされたままです。この正確なオリジンの信頼をオプトアウトするには、これを `false` に設定します。WebSocket はヘッダー/TLS には同じ `request` を使用しますが、その fetch SSRF ゲートは使用しません。デフォルトは `false` です。

  </Accordion>
  <Accordion title="モデルカタログエントリー">
    - `models.providers.*.models`: 明示的なプロバイダーモデルカタログエントリー。
    - `models.providers.*.models.*.input`: モデル入力モダリティ。テキスト専用モデルには `["text"]` を、ネイティブ画像/ビジョンモデルには `["text", "image"]` を使用します。画像添付は、選択されたモデルが画像対応としてマークされている場合にのみエージェントターンへ注入されます。
    - `models.providers.*.models.*.contextWindow`: ネイティブモデルコンテキストウィンドウのメタデータ。このモデルについて、プロバイダーレベルの `contextWindow` を上書きします。
    - `models.providers.*.models.*.contextTokens`: 任意のランタイムコンテキスト上限。これはプロバイダーレベルの `contextTokens` を上書きします。モデルのネイティブ `contextWindow` よりも小さい有効コンテキスト予算にしたい場合に使用します。`openclaw models list` は、両方の値が異なる場合に両方を表示します。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性ヒント。空でない非ネイティブの `baseUrl`（ホストが `api.openai.com` ではない）を持つ `api: "openai-completions"` では、OpenClaw はランタイムでこれを `false` に強制します。空または省略された `baseUrl` は、デフォルトの OpenAI 動作を維持します。
    - `models.providers.*.models.*.compat.requiresStringContent`: 文字列専用の OpenAI 互換チャットエンドポイント向けの任意の互換性ヒント。`true` の場合、OpenClaw はリクエスト送信前に純粋なテキストの `messages[].content` 配列をプレーン文字列へ平坦化します。
    - `models.providers.*.models.*.compat.strictMessageKeys`: 厳格な OpenAI 互換チャットエンドポイント向けの任意の互換性ヒント。`true` の場合、OpenClaw はリクエスト送信前に送信 Chat Completions メッセージオブジェクトを `role` と `content` に絞り込みます。
    - `models.providers.*.models.*.compat.thinkingFormat`: 任意の thinking ペイロードヒント。Together 形式の `reasoning.enabled` には `"together"`、トップレベルの `enable_thinking` には `"qwen"`、vLLM など、リクエストレベルのチャットテンプレート kwargs をサポートする Qwen 系 OpenAI 互換サーバーでの `chat_template_kwargs.enable_thinking` には `"qwen-chat-template"` を使用します。設定済みの vLLM Qwen モデルは、これらの形式に対してバイナリの `/think` 選択肢（`off`、`on`）を公開します。
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: DeepSeek 形式の Chat Completions バックエンド向けの任意の互換性ヒント。リプレイ時に以前の assistant メッセージが `reasoning_content` を保持する必要がある場合に使います。`true` の場合、OpenClaw は送信 assistant メッセージ上でそのフィールドを保持します。reasoning を削除した後のリクエストを拒否するカスタム DeepSeek 互換プロキシを接続する場合に使用します。デフォルトは `false` です。

  </Accordion>
  <Accordion title="Amazon Bedrock 検出">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 自動検出設定のルート。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙的な検出をオン/オフにします。
    - `plugins.entries.amazon-bedrock.config.discovery.region`: 検出用の AWS リージョン。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象を絞った検出用の任意のプロバイダー ID フィルター。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 検出更新のポーリング間隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出されたモデル用のフォールバックコンテキストウィンドウ。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出されたモデル用のフォールバック最大出力トークン数。

  </Accordion>
</AccordionGroup>

対話型のカスタムプロバイダーオンボーディングは、GPT-4o/GPT-4.1/GPT-5+、`o1`/`o3`/`o4` reasoning ファミリー、Claude、Gemini、任意の `-vl` サフィックス付き ID（Qwen-VL など）、LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V、GLM-4V などの名前付きファミリーを含む、既知のビジョンモデル ID パターンについて画像入力を推論します。また、既知のテキスト専用ファミリー（Llama、DeepSeek、Mistral/Mixtral、Kimi/Moonshot、Codestral、Devstral、Phi、QwQ、CodeLlama、および vl/vision サフィックスのない素の Qwen ID）では追加の質問をスキップします。不明なモデル ID では引き続き画像サポートを確認します。非対話型オンボーディングは同じ推論を使用します。画像対応メタデータを強制するには `--custom-image-input` を、テキスト専用メタデータを強制するには `--custom-text-input` を渡します。

### プロバイダー例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7 / GPT OSS）">
    公式の外部 `cerebras` プロバイダー Plugin は、`openclaw onboard --auth-choice cerebras-api-key` でこれを設定できます。デフォルトを上書きする場合にのみ、明示的なプロバイダー設定を使用します。

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

    Cerebras には `cerebras/zai-glm-4.7` を使用し、Z.AI 直接接続には `zai/glm-4.7` を使用します。

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
  <Accordion title="ローカルモデル（LM Studio）">
    [ローカルモデル](/ja-JP/gateway/local-models) を参照してください。要約: 十分なハードウェア上で LM Studio Responses API 経由で大規模ローカルモデルを実行し、フォールバック用にホスト型モデルをマージしたままにします。
  </Accordion>
  <Accordion title="MiniMax M3（直接）">
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

    `MINIMAX_API_KEY` を設定します。ショートカット: `openclaw onboard --auth-choice minimax-global-api` または `openclaw onboard --auth-choice minimax-cn-api`。モデルカタログはデフォルトで M3 を使用し、M2.7 バリアントも含みます。Anthropic 互換のストリーミングパスでは、明示的に `thinking` を自分で設定しない限り、OpenClaw はデフォルトで MiniMax M2.x thinking を無効化します。MiniMax-M3（および M3.x）は、デフォルトでプロバイダーの省略/適応型 thinking パスのままです。`/fast on` または `params.fastMode: true` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

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

    中国エンドポイントの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

    ネイティブの Moonshot エンドポイントは、共有 `openai-completions` トランスポート上でストリーミング使用量の互換性を通知し、OpenClaw は組み込みプロバイダー ID だけではなく、エンドポイントの機能に基づいてそれを判定します。

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

    ベース URL では `/v1` を省略する必要があります（Anthropic クライアントが追加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

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

    `ZAI_API_KEY` を設定します。モデル参照では正規の `zai/*` プロバイダー ID を使用します。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

    - 汎用エンドポイント: `https://api.z.ai/api/paas/v4`
    - コーディングエンドポイント: `https://api.z.ai/api/coding/paas/v4`
    - デフォルトの `zai-api-key` 認証選択はキーをプローブし、それがどのエンドポイントに属するかを自動検出します（検出が結論に至らない場合はプロンプトにフォールバックし、デフォルトはグローバルです）。明示的な選択用に、専用の CN および Coding-Plan 認証選択も利用できます。
    - 汎用エンドポイントでは、ベース URL オーバーライドを含むカスタムプロバイダーを定義します。

  </Accordion>
</AccordionGroup>

---

## 関連

- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [設定 — チャンネル](/ja-JP/gateway/config-channels)
- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他のトップレベルキー
- [ツールと plugins](/ja-JP/tools)
