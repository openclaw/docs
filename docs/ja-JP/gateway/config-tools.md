---
read_when:
    - '`tools.*` ポリシー、許可リスト、または実験的機能の設定'
    - カスタムプロバイダーの登録またはベース URL の上書き
    - OpenAI 互換のセルフホスト型エンドポイントのセットアップ
sidebarTitle: Tools and custom providers
summary: ツール設定（ポリシー、実験的な切り替え、プロバイダー提供ツール）とカスタムプロバイダー／ベースURLのセットアップ
title: 設定 — ツールとカスタムプロバイダー
x-i18n:
    generated_at: "2026-07-12T14:28:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 設定キーと、カスタムプロバイダー / ベース URL のセットアップ。エージェント、チャネル、およびその他のトップレベル設定キーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## ツール

### ツールプロファイル

`tools.profile` は、`tools.allow`/`tools.deny` より前に基本許可リストを設定します。

<Note>
ローカルのオンボーディングでは、未設定の場合、新しいローカル設定のデフォルトとして `tools.profile: "coding"` が使用されます（既存の明示的なプロファイルは保持されます）。
</Note>

| プロファイル | 含まれるもの                                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ                                                                                                                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | 制限なし（未設定の場合と同じ）                                                                                                                                                                                               |

`coding` と `messaging` は、`bundle-mcp`（設定済みの MCP サーバー）も暗黙的に許可します。

### ツールグループ

| グループ           | ツール                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` は `exec` のエイリアスとして使用可能）                                                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | 上記のすべての組み込みツール（`read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` を除く。Plugin ツールも除外）                                 |
| `group:plugins`    | `bundle-mcp` を通じて公開される設定済み MCP サーバーを含む、読み込まれた Plugin が所有するツール                                                          |

`spawn_task` を使用すると、コーディングエージェントは、開始せずに確認済みのフォローアップ作業を提案できます。Control UI では、タイトルと概要が操作可能なチップとして表示され、Gateway を使用する TUI では同等の対話型プロンプトが表示されます。いずれかを承認すると、新しい管理対象ワークツリーセッションが作成され、現在のターンを継続しながら、完全なプロンプトがそのセッションに送信されます。`dismiss_task` は、`spawn_task` から返された一時的な `task_id` を使用して、まだ保留中の提案を取り下げます。

これらのツールは、開始元のオペレーターサーフェスが Gateway のタスク提案イベントを受信して操作できる場合にのみ提供されます。チャネルセッションおよびローカル / 組み込み TUI セッションはこれらのイベントを受信しません。このフローを安全に公開するには、チャネル転送にポータブルな型付きタスクアクションが必要です。提案はプロセスローカルであり、Gateway が再起動すると消失します。両方のツールは `coding` プロファイルと `group:sessions` に引き続き含まれるため、サーフェスが対応している場合、通常の `tools.allow` および `tools.deny` ポリシーによって自動的に設定されます。

### サンドボックスのツールポリシー内の MCP と Plugin ツール

設定済みの MCP サーバーは、`bundle-mcp` Plugin ID の下で Plugin 所有のツールとして公開されます。通常のツールプロファイルで許可できますが、サンドボックス化されたセッションでは `tools.sandbox.tools` が追加のゲートになります。サンドボックスモードが `"all"` または `"non-main"` の場合、MCP / Plugin ツールを表示するには、サンドボックスのツール許可リストに次のいずれかのエントリを含めます。

- `mcp.servers` にある OpenClaw 管理の MCP サーバーの場合は `bundle-mcp`
- 特定のネイティブ Plugin の場合はその Plugin ID
- 読み込まれたすべての Plugin 所有ツールの場合は `group:plugins`
- 1 つのサーバーだけを使用する場合は、正確な MCP サーバーツール名または `outlook__send_mail` や `outlook__*` などのサーバー glob

サーバー glob には、生の `mcp.servers` キーとは限らない、プロバイダーで安全に使用できる MCP サーバープレフィックスを使用します。`[A-Za-z0-9_-]` 以外の文字は `-` になり、先頭が文字ではない名前には `mcp-` プレフィックスが付加され、長いプレフィックスや重複するプレフィックスは切り詰められるかサフィックスが付加される場合があります。たとえば、`mcp.servers["Outlook Graph"]` では `outlook-graph__*` のような glob が使用されます。

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

このサンドボックス層のエントリがない場合、MCP サーバーは正常に読み込まれても、そのツールはプロバイダーへのリクエスト前に除外されます。`mcp.servers` 内の OpenClaw 管理サーバーについて、この設定構造を検出するには `openclaw doctor` を使用してください。バンドルされた Plugin マニフェストまたは Claude の `.mcp.json` から読み込まれる MCP サーバーにも同じサンドボックスゲートが適用されますが、この診断ではまだそれらのソースを列挙しません。サンドボックス化されたターンでツールが表示されなくなった場合は、同じ許可リストエントリを使用してください。

### `tools.codeMode`

`tools.codeMode` は、汎用の OpenClaw コードモードサーフェスを有効にします。ツールを使用する実行で有効にすると、通常の OpenClaw ツールはサンドボックス内の `tools.*` カタログブリッジの背後に移動し、MCP ツールは生成された `MCP` 名前空間を通じて利用可能になります。モデルには通常 `exec` と `wait` が表示されます。構造化された結果を JSON 専用ブリッジ経由で渡せない `computer` などのツールは、引き続き直接提供されます。

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

短縮形も使用できます。

```json5
{
  tools: { codeMode: true },
}
```

コードモードでは、MCP 宣言は読み取り専用の仮想 API ファイルサーフェスを通じて公開されます。ゲストコードは、`MCP.<server>.<tool>()` を呼び出す前に、`API.list("mcp")` および `API.read("mcp/<server>.d.ts")` を呼び出して TypeScript 形式のシグネチャを確認できます。ランタイム契約、制限、デバッグ手順については、[コードモード](/ja-JP/reference/code-mode)を参照してください。

### `tools.allow` / `tools.deny`

ツールのグローバルな許可/拒否ポリシー（拒否が優先）。大文字と小文字を区別せず、`*` ワイルドカードをサポートします。Docker サンドボックスが無効な場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` と `apply_patch` は別々のツール ID です。`allow: ["write"]` は互換性のあるモデルで `apply_patch` も有効にしますが、`deny: ["write"]` は `apply_patch` を拒否しません。すべてのファイル変更をブロックするには、`group:fs` を拒否するか、変更を行う各ツールを明示的に列挙します。

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
同じスコープ（`tools`、`tools.byProvider.<id>`、`agents.list[].tools`）で `allow` と `alsoAllow` を同時に設定することはできません。設定検証で拒否されます。`alsoAllow` のエントリを `allow` に統合するか、`allow` を削除して代わりに `profile` + `alsoAllow` を使用してください。
</Note>

### `tools.byProvider`

特定のプロバイダーまたはモデルに対してツールをさらに制限します。順序: 基本プロファイル → プロバイダープロファイル → 許可/拒否。

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

特定のリクエスター ID に対してツールを制限します。これはチャネルのアクセス制御に加える多層防御です。送信者の値はメッセージ本文ではなく、チャネルアダプターから取得する必要があります。

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

キーには明示的なプレフィックスを使用します: `channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、または `"*"`。チャネル ID は OpenClaw の正規 ID です。`teams` などのエイリアスは `msteams` に正規化されます。プレフィックスのない従来のキーは、`id:` としてのみ受け付けられます。照合順序は、チャネル+ID、ID、e164、ユーザー名、名前、ワイルドカードです。

エージェントごとの `agents.list[].tools.toolsBySender` が一致した場合は、空の `{}` ポリシーであってもグローバルな送信者照合を上書きします。

### `tools.elevated`

サンドボックス外での昇格された exec アクセスを制御します。

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

- エージェントごとの上書き（`agents.list[].tools.elevated`）では、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとに状態を保存します。インラインディレクティブは単一のメッセージに適用されます。
- 昇格された `exec` はサンドボックス化を回避し、設定されたエスケープパス（デフォルトは `gateway`、exec のターゲットが `node` の場合は `node`）を使用します。

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
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

表示されている値は、`applyPatch.allowModels` を除いてデフォルト値です（デフォルトでは空または未設定であり、互換性のあるすべてのモデルが `apply_patch` を使用できることを意味します）。`approvalRunningNoticeMs` は、承認を伴う exec の実行が長引いた場合に実行中の通知を送信します。`0` にすると無効になります。

### `tools.loopDetection`

ツールループの安全性チェックは**デフォルトで無効**です。検出を有効にするには `enabled: true` を設定します。設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとに上書きできます。

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
  ループ分析用に保持するツール呼び出し履歴の最大数。
</ParamField>
<ParamField path="warningThreshold" type="number">
  進展のないパターンの繰り返しに対して警告を発するしきい値。
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  利用不可または不明な同一ツール名の呼び出しがこの回数失敗すると、それ以降の繰り返しをブロックします。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  重大なループをブロックするための、より高い繰り返ししきい値。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  進展のないあらゆる実行を強制停止するしきい値。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  同一ツールを同一引数で繰り返し呼び出した場合に警告します。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  既知のポーリングツール（`process.poll`、`command_status` など）で進展がない場合に警告またはブロックします。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  進展のないペアを交互に繰り返すパターンに対して警告またはブロックします。
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  自動 Compaction 後にガードが有効なままになる試行回数。この範囲内でエージェントが同じ（ツール、引数、結果）を繰り返すと中止します。
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
        apiKey: "brave_api_key", // または BRAVE_API_KEY 環境変数（Brave プロバイダー）
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 任意。自動検出する場合は省略
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

表示されている値は、`provider` と `userAgent` を除きデフォルトです。`maxResponseBytes` は 32000～10000000 の範囲に制限され、`maxChars` は `maxCharsCap` を上限とします（より大きなレスポンスを許可するには `maxCharsCap` を増やしてください）。

### `tools.media`

受信メディアの理解（画像／音声／動画）を設定します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // 非推奨：完了処理は引き続きエージェントを介します
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

`concurrency`（デフォルト `2`）、`audio.maxBytes`（デフォルト 20 MB）、`video.maxBytes`（デフォルト 50 MB）はデフォルト値を示しています。`image.maxBytes` のデフォルトは 10 MB です。機能ごとのリクエストタイムアウトのデフォルトは、画像／音声が `60` 秒、動画が `120` 秒です。

<AccordionGroup>
  <Accordion title="メディアモデルのエントリフィールド">
    **プロバイダーエントリ**（`type: "provider"` または省略）：

    - `provider`：API プロバイダー ID（`openai`、`anthropic`、`google`／`gemini`、`groq` など）
    - `model`：モデル ID の上書き
    - `profile` / `preferredProfile`：`auth-profiles.json` のプロファイル選択

    **CLI エントリ**（`type: "cli"`）：

    - `command`：実行する実行可能ファイル
    - `args`：テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート。`openclaw doctor --fix` は非推奨の `{input}` プレースホルダーを `{{MediaPath}}` に移行します）

    **共通フィールド：**

    - `capabilities`：任意のリスト（`image`、`audio`、`video`）。各プロバイダー Plugin は独自のデフォルト機能セットを宣言します。たとえば、同梱の `openai` プロバイダーはデフォルトで画像＋音声、`anthropic`／`minimax` は画像、`google` は画像＋音声＋動画、`groq` は音声に対応します。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：エントリごとの上書き。
    - `tools.media.image.timeoutSeconds` と対応する画像モデルの `timeoutSeconds` エントリは、エージェントが明示的な `image` ツールを呼び出す場合にも適用されます。画像理解では、このタイムアウトはリクエスト自体に適用され、それ以前の準備作業によって短縮されません。
    - 失敗した場合は次のエントリにフォールバックします。

    プロバイダー認証は標準の順序に従います：`auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

    **非同期完了フィールド：**

    - `asyncCompletion.directSend`：非推奨の互換性フラグ。完了した非同期メディアタスクは、引き続きリクエスターのセッションを介して処理されます。これにより、エージェントが結果を受け取り、ユーザーへの伝え方を判断し、送信元への配信に必要な場合はメッセージツールを使用します。

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

セッションツール（`sessions_list`、`sessions_history`、`sessions_send`）が対象にできるセッションを制御します。

デフォルト：`tree`（現在のセッション＋そこから生成されたサブエージェントなどのセッション）。

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
    - `self`：現在のセッションキーのみ。
    - `tree`：現在のセッション＋現在のセッションから生成されたセッション（サブエージェント）。
    - `agent`：現在のエージェント ID に属する任意のセッション（同じエージェント ID で送信者ごとのセッションを実行している場合、ほかのユーザーを含むことがあります）。
    - `all`：任意のセッション。エージェントをまたいで対象を指定するには、引き続き `tools.agentToAgent` が必要です。
    - サンドボックスによる制限：現在のセッションがサンドボックス化され、`agents.defaults.sandbox.sessionToolsVisibility="spawned"`（デフォルト）の場合、`tools.sessions.visibility="all"` であっても可視性は強制的に `tree` になります。
    - `all` 以外の場合、`sessions_list` には有効なモードを示す簡潔な `visibility` フィールドと、現在のスコープ外にある一部のセッションが
      省略される可能性があるという警告が含まれます。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイル対応を制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // オプトイン：インラインファイル添付を許可するには true に設定
        maxTotalBytes: 5242880, // 全ファイル合計 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 ファイルあたり 1 MB
        retainOnSessionKeep: false, // cleanup="keep" の場合に添付ファイルを保持
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="添付ファイルに関する注意事項">
    - 添付ファイルには `enabled: true` が必要です。
    - サブエージェントの添付ファイルは、子ワークスペース内の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
    - ACP の添付ファイルは画像のみに対応し、同じファイル数、ファイルごとのバイト数、合計バイト数の制限を満たした後、ACP ランタイムへインライン転送されます。
    - 添付ファイルの内容は、トランスクリプトを永続化する際に自動的に秘匿されます。
    - Base64 入力は、厳密なアルファベット／パディング検査とデコード前のサイズガードによって検証されます。
    - サブエージェントの添付ファイル権限は、ディレクトリが `0700`、ファイルが `0600` です。
    - サブエージェントのクリーンアップは `cleanup` ポリシーに従います。`delete` は常に添付ファイルを削除し、`keep` は `retainOnSessionKeep: true` の場合にのみ保持します。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

試験的な組み込みツールのフラグ。strict-agentic GPT-5 の自動有効化ルールが適用されない限り、デフォルトでは無効です。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 試験的な update_plan を有効化
    },
  },
}
```

- `planTool`：複雑な複数ステップ作業を追跡するための、構造化された `update_plan` ツールを有効にします。
- デフォルト：`agents.defaults.embeddedAgent.executionContract`（またはエージェントごとの上書き）が、`openai` プロバイダーで GPT-5 ファミリーのモデル ID を使用する実行に対して `"strict-agentic"` に設定されている場合を除き、`false` です（Codex の認証／モデルルーティングは `openai` プロバイダー配下にあるため、OpenAI Codex CLI の実行も対象です）。このスコープ外でもツールを強制的に有効にするには `true`、strict-agentic GPT-5 の実行でも無効に保つには `false` を設定します。
- 有効にすると、システムプロンプトにも使用ガイダンスが追加され、モデルは重要な作業にのみこのツールを使用し、`in_progress` のステップを常に最大 1 件に保ちます。

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

- `model`：生成されるサブエージェントのデフォルトモデル。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `allowAgents`：リクエスターのエージェントが独自の `subagents.allowAgents` を設定していない場合に、`sessions_spawn` で指定できる設定済み対象エージェント ID のデフォルト許可リスト（`["*"]` = 設定済みの任意の対象、デフォルト：同じエージェントのみ）。エージェント設定が削除済みの古いエントリは `sessions_spawn` によって拒否され、`agents_list` から省略されます。クリーンアップするには `openclaw doctor --fix` を実行してください。
- `maxConcurrent`：同時に実行できるサブエージェントの最大数。デフォルト：`8`。
- `runTimeoutSeconds`：呼び出し元が独自の上書きを渡さない場合の `sessions_spawn` のタイムアウト（秒）。デフォルト：`0`（タイムアウトなし）。上記の `900` は一般的なオプトイン値であり、組み込みのデフォルトではありません。
- `announceTimeoutMs`：Gateway の `agent` アナウンス配信試行ごとのタイムアウト（ミリ秒）。デフォルト：`120000`。一時的な再試行により、アナウンスの合計待機時間が設定された 1 回分のタイムアウトより長くなる場合があります。
- `archiveAfterMinutes`：サブエージェントのセッション完了後、自動アーカイブされるまでの分数。デフォルト：`60`。`0` にすると自動アーカイブが無効になります。
- サブエージェントごとのツールポリシー：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

プロバイダー Plugin は独自のモデルカタログ行を公開します。設定内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` を使用して、カスタムプロバイダーを追加します。

カスタム／ローカルプロバイダーの `baseUrl` を設定することは、モデルの HTTP リクエストに対する限定的なネットワーク信頼の決定でもあります。OpenClaw は、別の設定オプションを追加したり、ほかのプライベートオリジンを信頼したりすることなく、ガード付きフェッチ経路を通じて、その正確な `scheme://host:port` オリジンを許可します。

```json5
{
  models: {
    mode: "merge", // merge（デフォルト）| replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | など
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
    - `OPENCLAW_AGENT_DIR` でエージェント設定のルートを上書きします。
    - 一致するプロバイダー ID のマージ優先順位:
      - エージェントの `models.json` にある空でない `baseUrl` 値が優先されます。
      - エージェントの空でない `apiKey` 値は、現在の設定/認証プロファイルのコンテキストでそのプロバイダーが SecretRef によって管理されていない場合にのみ優先されます。
      - SecretRef で管理されるプロバイダーの `apiKey` 値は、解決済みシークレットを永続化する代わりに、ソースマーカー（環境変数参照では `ENV_VAR_NAME`、ファイル/exec 参照では `secretref-managed`）から更新されます。
      - SecretRef で管理されるプロバイダーのヘッダー値は、ソースマーカー（環境変数参照では `secretref-env:ENV_VAR_NAME`、ファイル/exec 参照では `secretref-managed`）から更新されます。
      - エージェントの `apiKey`/`baseUrl` が空または欠落している場合、設定内の `models.providers` にフォールバックします。
      - 一致するモデルの `contextWindow`/`maxTokens`: 明示的な設定値が存在し、有効（正の有限数）であれば、その値が優先されます。それ以外の場合は、暗黙的な値または生成されたカタログ値が使用されます。
      - 一致するモデルの `contextTokens` も、同じく「明示値が優先され、なければ暗黙値」というルールに従います。ネイティブのモデルメタデータを変更せずに有効なコンテキストを制限するために使用します。
      - プロバイダー Plugin のカタログは、エージェントの Plugin 状態内に、生成された Plugin 所有のカタログシャードとして保存されます。
      - 設定で `models.json` を完全に書き換え、Plugin 所有のカタログシャードをマージしない場合は、`models.mode: "replace"` を使用します。
      - マーカーの永続化ではソースが正となります。マーカーは、解決済みのランタイムシークレット値ではなく、アクティブなソース設定のスナップショット（解決前）から書き込まれます。

  </Accordion>
</AccordionGroup>

### プロバイダーフィールドの詳細

<AccordionGroup>
  <Accordion title="最上位カタログ">
    - `models.mode`: プロバイダーカタログの動作（`merge` または `replace`）。
    - `models.providers`: プロバイダー ID をキーとするカスタムプロバイダーマップ。
      - 安全な編集: 追加更新には `openclaw config set models.providers.<id> '<json>' --strict-json --merge` または `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` を使用します。`--replace` を渡さない限り、`config set` は破壊的な置換を拒否します。

  </Accordion>
  <Accordion title="プロバイダー接続と認証">
    - `models.providers.*.api`: リクエストアダプター（`openai-completions`、`openai-responses`、`openai-chatgpt-responses`、`anthropic-messages`、`google-generative-ai`、`google-vertex`、`github-copilot`、`bedrock-converse-stream`、`ollama`、`azure-openai-responses`）。MLX、vLLM、SGLang、および大半の OpenAI 互換ローカルサーバーのようなセルフホスト型の `/v1/chat/completions` バックエンドには、`openai-completions` を使用します。`baseUrl` があり `api` がないカスタムプロバイダーのデフォルトは `openai-completions` です。バックエンドが `/v1/responses` をサポートする場合にのみ `openai-responses` を設定します。
    - `models.providers.*.apiKey`: プロバイダーの認証情報（SecretRef/環境変数置換を推奨）。
    - `models.providers.*.auth`: 認証方式（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`: モデルエントリで `contextWindow` が設定されていない場合に、このプロバイダー配下のモデルに適用されるデフォルトのネイティブコンテキストウィンドウ。
    - `models.providers.*.contextTokens`: モデルエントリで `contextTokens` が設定されていない場合に、このプロバイダー配下のモデルに適用されるデフォルトの有効ランタイムコンテキスト上限。
    - `models.providers.*.maxTokens`: モデルエントリで `maxTokens` が設定されていない場合に、このプロバイダー配下のモデルに適用されるデフォルトの出力トークン上限。
    - `models.providers.*.timeoutSeconds`: 接続、ヘッダー、本文、およびリクエスト全体の中止処理を含む、プロバイダーごとのモデル HTTP リクエストの任意のタイムアウト（秒）。
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` の場合、リクエストに `options.num_ctx` を挿入します（デフォルト: `true`）。
    - `models.providers.*.authHeader`: 必要な場合、`Authorization` ヘッダーで認証情報を強制的に送信します。
    - `models.providers.*.baseUrl`: 上流 API のベース URL。
    - `models.providers.*.headers`: プロキシ/テナントルーティング用の追加静的ヘッダー。

  </Accordion>
  <Accordion title="リクエスト転送の上書き">
    `models.providers.*.request`: モデルプロバイダーへの HTTP リクエストに対する転送設定の上書き。

    - `request.headers`: 追加ヘッダー（プロバイダーのデフォルトとマージされます）。値には SecretRef を指定できます。
    - `request.auth`: 認証方式の上書き。モード: `"provider-default"`（プロバイダー内蔵の認証を使用）、`"authorization-bearer"`（`token` とともに使用）、`"header"`（`headerName`、`value`、任意の `prefix` とともに使用）。
    - `request.proxy`: HTTP プロキシの上書き。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` 環境変数を使用）、`"explicit-proxy"`（`url` とともに使用）。どちらのモードでも任意の `tls` サブオブジェクトを指定できます。
    - `request.tls`: 直接接続の TLS 上書き。フィールド: `ca`、`cert`、`key`、`passphrase`（すべて SecretRef を指定可能）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`: `true` の場合、プロバイダー HTTP フェッチガードを通じて、プライベート、CGNAT、または同様の範囲へのモデルプロバイダー HTTP リクエストを許可します。カスタム/ローカルプロバイダーのベース URL では、明示的なオプトインなしでは引き続きブロックされるメタデータ/link-local オリジンを除き、設定された正確なオリジンがすでに信頼されます。正確なオリジンの信頼を無効にするには、これを `false` に設定します。WebSocket はヘッダー/TLS に同じ `request` を使用しますが、このフェッチ SSRF ゲートは使用しません。デフォルトは `false` です。

  </Accordion>
  <Accordion title="モデルカタログエントリ">
    - `models.providers.*.models`: 明示的なプロバイダーモデルカタログエントリ。
    - `models.providers.*.models.*.input`: モデルの入力モダリティ。テキスト専用モデルには `["text"]`、ネイティブの画像/ビジョンモデルには `["text", "image"]` を使用します。選択されたモデルが画像対応としてマークされている場合にのみ、画像添付がエージェントターンに挿入されます。
    - `models.providers.*.models.*.contextWindow`: ネイティブモデルのコンテキストウィンドウメタデータ。このモデルについて、プロバイダーレベルの `contextWindow` を上書きします。
    - `models.providers.*.models.*.contextTokens`: 任意のランタイムコンテキスト上限。プロバイダーレベルの `contextTokens` を上書きします。モデルのネイティブ `contextWindow` よりも小さい有効コンテキスト予算を使用する場合に設定します。値が異なる場合、`openclaw models list` には両方の値が表示されます。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性ヒント。空でない非ネイティブの `baseUrl`（ホストが `api.openai.com` ではない）を持つ `api: "openai-completions"` の場合、OpenClaw はランタイムでこれを `false` に強制します。`baseUrl` が空または省略されている場合、OpenAI のデフォルト動作が維持されます。
    - `models.providers.*.models.*.compat.requiresStringContent`: 文字列のみを受け付ける OpenAI 互換チャットエンドポイント向けの任意の互換性ヒント。`true` の場合、OpenClaw は純粋なテキストの `messages[].content` 配列を、リクエスト送信前にプレーン文字列へ平坦化します。
    - `models.providers.*.models.*.compat.strictMessageKeys`: 厳密な OpenAI 互換チャットエンドポイント向けの任意の互換性ヒント。`true` の場合、OpenClaw はリクエスト送信前に、送信する Chat Completions メッセージオブジェクトを `role` と `content` のみに絞り込みます。
    - `models.providers.*.models.*.compat.thinkingFormat`: 任意の思考ペイロードヒント。Together 形式の `reasoning.enabled` には `"together"`、最上位の `enable_thinking` には `"qwen"`、vLLM などリクエストレベルのチャットテンプレート kwargs をサポートする Qwen 系 OpenAI 互換サーバー上の `chat_template_kwargs.enable_thinking` には `"qwen-chat-template"` を使用します。設定済みの vLLM Qwen モデルでは、これらの形式に対して二択の `/think` オプション（`off`、`on`）が公開されます。
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: 再生時に以前のアシスタントメッセージで `reasoning_content` を保持する必要がある、DeepSeek 形式の Chat Completions バックエンド向けの任意の互換性ヒント。`true` の場合、OpenClaw は送信するアシスタントメッセージでそのフィールドを維持します。推論内容が除去された後のリクエストを拒否するカスタム DeepSeek 互換プロキシを接続する場合に使用します。デフォルトは `false` です。

  </Accordion>
  <Accordion title="Amazon Bedrock の検出">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 自動検出設定のルート。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙的な検出のオン/オフ。
    - `plugins.entries.amazon-bedrock.config.discovery.region`: 検出に使用する AWS リージョン。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象を絞った検出用の任意のプロバイダー ID フィルター。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 検出更新のポーリング間隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出されたモデル用のフォールバックコンテキストウィンドウ。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出されたモデル用のフォールバック最大出力トークン数。

  </Accordion>
</AccordionGroup>

対話型のカスタムプロバイダーのオンボーディングでは、GPT-4o/GPT-4.1/GPT-5+、`o1`/`o3`/`o4` 推論ファミリー、Claude、Gemini、`-vl` 接尾辞を持つ任意の ID（Qwen-VL など）、および LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V、GLM-4V などの名前付きファミリーを含む、既知のビジョンモデル ID パターンに対して画像入力を推論します。既知のテキスト専用ファミリー（Llama、DeepSeek、Mistral/Mixtral、Kimi/Moonshot、Codestral、Devstral、Phi、QwQ、CodeLlama、および vl/vision 接尾辞のない単独の Qwen ID）では、追加の質問を省略します。不明なモデル ID の場合は、引き続き画像サポートについて確認します。非対話型のオンボーディングでも同じ推論を使用します。画像対応メタデータを強制するには `--custom-image-input`、テキスト専用メタデータを強制するには `--custom-text-input` を渡します。

### プロバイダーの例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7 / GPT OSS）">
    公式の外部 `cerebras` プロバイダー Plugin では、`openclaw onboard --auth-choice cerebras-api-key` を使用してこれを設定できます。デフォルトを上書きする場合にのみ、明示的なプロバイダー設定を使用してください。

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

    Cerebras には `cerebras/zai-glm-4.7`、Z.AI への直接接続には `zai/glm-4.7` を使用します。

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

    Anthropic 互換の内蔵プロバイダーです。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="ローカルモデル（LM Studio）">
    [ローカルモデル](/ja-JP/gateway/local-models)を参照してください。要約：高性能なハードウェア上で、LM Studio Responses APIを介して大規模なローカルモデルを実行します。フォールバック用にホスト型モデルもマージしたままにしてください。
  </Accordion>
  <Accordion title="MiniMax M3（直接接続）">
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

    `MINIMAX_API_KEY`を設定します。ショートカット：`openclaw onboard --auth-choice minimax-global-api`または`openclaw onboard --auth-choice minimax-cn-api`。モデルカタログはデフォルトでM3を使用し、M2.7の各バリアントも含まれます。Anthropic互換のストリーミングパスでは、`thinking`を明示的に設定しない限り、OpenClawはMiniMax M2.xの思考機能をデフォルトで無効にします。MiniMax-M3（およびM3.x）は、デフォルトでプロバイダーの省略時／適応型思考パスを引き続き使用します。`/fast on`または`params.fastMode: true`を指定すると、`MiniMax-M2.7`が`MiniMax-M2.7-highspeed`に書き換えられます。

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

    中国向けエンドポイントの場合：`baseUrl: "https://api.moonshot.cn/v1"`または`openclaw onboard --auth-choice moonshot-api-key-cn`。

    Moonshotのネイティブエンドポイントは、共有の`openai-completions`トランスポート上でストリーミング使用量との互換性を通知します。OpenClawは、組み込みプロバイダーIDだけではなく、エンドポイントの機能に基づいてこの機能を有効化します。

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

    `OPENCODE_API_KEY`（または`OPENCODE_ZEN_API_KEY`）を設定します。Zenカタログには`opencode/...`参照を、Goカタログには`opencode-go/...`参照を使用します。ショートカット：`openclaw onboard --auth-choice opencode-zen`または`openclaw onboard --auth-choice opencode-go`。

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

    ベースURLでは`/v1`を省略する必要があります（Anthropicクライアントが付加します）。ショートカット：`openclaw onboard --auth-choice synthetic-api-key`。

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

    `ZAI_API_KEY`を設定します。モデル参照では、正規の`zai/*`プロバイダーIDを使用します。ショートカット：`openclaw onboard --auth-choice zai-api-key`。

    - 汎用エンドポイント：`https://api.z.ai/api/paas/v4`
    - コーディング用エンドポイント：`https://api.z.ai/api/coding/paas/v4`
    - デフォルトの`zai-api-key`認証選択では、キーを検査し、それがどのエンドポイントに属するかを自動検出します（検出結果が確定できない場合は入力を求め、デフォルトでGlobalを選択します）。明示的に選択するための専用のCNおよびCoding-Plan認証選択も利用できます。
    - 汎用エンドポイントの場合は、ベースURLを上書きしたカスタムプロバイダーを定義します。

  </Accordion>
</AccordionGroup>

---

## 関連項目

- [設定 — エージェント](/ja-JP/gateway/config-agents)
- [設定 — チャンネル](/ja-JP/gateway/config-channels)
- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他のトップレベルキー
- [ツールとPlugin](/ja-JP/tools)
