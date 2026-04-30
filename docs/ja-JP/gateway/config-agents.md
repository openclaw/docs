---
read_when:
    - エージェントのデフォルト（モデル、思考、ワークスペース、Heartbeat、メディア、Skills）の調整
    - マルチエージェントルーティングとバインディングの構成
    - セッション、メッセージ配信、トークモード動作の調整
summary: エージェントのデフォルト、マルチエージェントルーティング、セッション、メッセージ、会話設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-04-30T16:28:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6a38f42c35c6c6e46d6d00ad710c6c80d78703e0b7e3388f5631cf91eb17084
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、`talk.*` 配下のエージェントスコープの設定キー。チャンネル、ツール、Gateway ランタイム、その他の
トップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システムプロンプトのランタイム行に表示される任意のリポジトリルート。未設定の場合、OpenClaw はワークスペースから上位方向にたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないエージェント向けの任意のデフォルト Skills 許可リスト。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- デフォルトで Skills を制限しない場合は、`agents.defaults.skills` を省略します。
- デフォルトを継承するには、`agents.list[].skills` を省略します。
- Skills なしにするには、`agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストはそのエージェントの最終的なセットです。デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

ワークスペースのブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

ワークスペースのブートストラップファイルをいつシステムプロンプトに注入するかを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（完了済みのアシスタント応答の後）ではワークスペースブートストラップの再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と Compaction 後の再試行では引き続きコンテキストを再構築します。
- `"never"`: すべてのターンでワークスペースブートストラップとコンテキストファイルの注入を無効にします。これは、プロンプトのライフサイクルを完全に所有するエージェント（カスタムコンテキストエンジン、独自のコンテキストを構築するネイティブランタイム、またはブートストラップ不要の特殊なワークフロー）にのみ使用してください。Heartbeat と Compaction リカバリーターンでも注入をスキップします。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前のワークスペースブートストラップファイル 1 件あたりの最大文字数。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペースブートストラップファイル全体で注入される最大合計文字数。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップコンテキストが切り詰められたときにエージェントに表示される警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システムプロンプトに警告テキストを注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに警告を 1 回注入します（推奨）。
- `"always"`: 切り詰めが存在する場合、実行ごとに警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有権マップ

OpenClaw には複数の大容量プロンプト/コンテキスト予算があり、それらは 1 つの汎用ノブにすべて流し込むのではなく、意図的にサブシステムごとに分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常のワークスペースブートストラップ注入。
- `agents.defaults.startupContext.*`:
  直近の日次 `memory/*.md` ファイルを含む、リセット/起動時のモデル実行用の 1 回限りの前置き。素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずに確認応答されます。
- `skills.limits.*`:
  システムプロンプトに注入されるコンパクトな Skills リスト。
- `agents.defaults.contextLimits.*`:
  境界付きランタイム抜粋と、ランタイム所有の注入ブロック。
- `memory.qmd.limits.*`:
  インデックス化されたメモリ検索スニペットと注入サイズ。

1 つのエージェントだけが異なる予算を必要とする場合にのみ、対応するエージェント単位の上書きを使用します。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

リセット/起動時のモデル実行で注入される初回ターンの起動前置きを制御します。
素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずにリセットを確認応答するため、この前置きを読み込みません。

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

境界付きランタイムコンテキストサーフェスの共有デフォルト。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: 切り詰めメタデータと継続通知が追加される前の、デフォルトの `memory_get` 抜粋上限。
- `memoryGetDefaultLines`: `lines` が省略されたときのデフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果とオーバーフローリカバリーに使用されるライブツール結果の上限。
- `postCompactionMaxChars`: Compaction 後のリフレッシュ注入中に使用される AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブのエージェント単位の上書き。省略されたフィールドは `agents.defaults.contextLimits` から継承します。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

システムプロンプトに注入されるコンパクトな Skills リストのグローバル上限。これはオンデマンドで `SKILL.md` ファイルを読むことには影響しません。

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills プロンプト予算のエージェント単位の上書き。

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前に、トランスクリプト/ツール画像ブロック内の最長画像辺に適用される最大ピクセルサイズ。
デフォルト: `1200`。

低い値は通常、スクリーンショットが多い実行での視覚トークン使用量とリクエストペイロードサイズを減らします。
高い値はより多くの視覚的詳細を保持します。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキスト用のタイムゾーン（メッセージのタイムスタンプではありません）。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプト内の時刻形式。デフォルト: `auto`（OS 設定）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け付けます。
  - 文字列形式は primary モデルのみを設定します。
  - オブジェクト形式は primary と、順序付きのフェイルオーバーモデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け付けます。
  - `image` ツールパスで、その vision モデル設定として使用されます。
  - 選択済みまたはデフォルトのモデルが画像入力を受け付けられない場合のフォールバックルーティングとしても使用されます。
  - 明示的な `provider/model` 参照を推奨します。互換性のためにベア ID も受け付けます。ベア ID が `models.providers.*.models` 内の設定済みで画像対応のエントリに一意に一致する場合、OpenClaw はそのプロバイダーで修飾します。設定済みの一致が曖昧な場合は、明示的なプロバイダー接頭辞が必要です。
- `imageGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け付けます。
  - 共有の画像生成機能と、画像を生成する将来のツール/Plugin サーフェスで使用されます。
  - 一般的な値: ネイティブ Gemini 画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-2`、透明背景の OpenAI PNG/WebP 出力には `openai/gpt-image-1.5`。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証も設定してください (例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` / `openai/gpt-image-1.5` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`)。
  - 省略した場合でも、`image_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み画像生成プロバイダーをプロバイダー ID 順に試します。
- `musicGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け付けます。
  - 共有の音楽生成機能と組み込みの `music_generate` ツールで使用されます。
  - 一般的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み音楽生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け付けます。
  - 共有の動画生成機能と組み込みの `video_generate` ツールで使用されます。
  - 一般的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み動画生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
  - バンドルされている Qwen 動画生成プロバイダーは、最大 1 個の出力動画、1 個の入力画像、4 個の入力動画、10 秒の長さ、およびプロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け付けます。
  - モデルルーティングのために `pdf` ツールで使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルト PDF サイズ上限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮されるデフォルト最大ページ数。
- `verboseDefault`: エージェントのデフォルト verbose レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `reasoningDefault`: エージェントのデフォルト reasoning 可視性。値: `"off"`、`"on"`、`"stream"`。エージェントごとの `agents.list[].reasoningDefault` はこのデフォルトを上書きします。設定済みの reasoning デフォルトは、メッセージごとまたはセッションごとの reasoning 上書きが設定されていない場合に、所有者、承認済み送信者、または operator-admin Gateway コンテキストにのみ適用されます。
- `elevatedDefault`: エージェントのデフォルト elevated-output レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model` (例: API キーアクセスには `openai/gpt-5.5`、Codex OAuth には `openai-codex/gpt-5.5`)。プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に対する一意の設定済みプロバイダー一致を試し、その後にのみ設定済みのデフォルトプロバイダーにフォールバックします (非推奨の互換動作のため、明示的な `provider/model` を推奨します)。そのプロバイダーが設定済みのデフォルトモデルを公開しなくなっている場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表面化させる代わりに、最初に設定されたプロバイダー/モデルへフォールバックします。
- `models`: `/model` のために設定されたモデルカタログと許可リスト。各エントリには `alias` (ショートカット) と `params` (プロバイダー固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`) を含めることができます。
  - 安全な編集: エントリを追加するには `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。`config set` は、`--replace` を渡さない限り、既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダースコープの設定/オンボーディングフローは、選択されたプロバイダーモデルをこのマップにマージし、すでに設定済みの無関係なプロバイダーを保持します。
  - 直接 OpenAI Responses モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management` の注入を停止するには `params.responsesServerCompaction: false` を使用し、しきい値を上書きするには `params.responsesCompactThreshold` を使用します。[OpenAI サーバー側 Compaction](/ja-JP/providers/openai#server-side-compaction-responses-api) を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルトプロバイダーパラメーター。`agents.defaults.params` に設定します (例: `{ cacheRetention: "long" }`)。
- `params` のマージ優先順位 (設定): `agents.defaults.params` (グローバルベース) は `agents.defaults.models["provider/model"].params` (モデルごと) によって上書きされ、その後 `agents.list[].params` (一致するエージェント ID) がキーごとに上書きします。詳細は [プロンプトキャッシュ](/ja-JP/reference/prompt-caching) を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシ向けに、`api: "openai-completions"` リクエスト本文へマージされる高度なパススルー JSON。生成されたリクエストキーと衝突した場合は extra body が優先されます。非ネイティブ completions ルートでは、その後も OpenAI 専用の `store` が取り除かれます。
- `params.chat_template_kwargs`: トップレベルの `api: "openai-completions"` リクエスト本文にマージされる vLLM/OpenAI 互換の chat-template 引数。thinking がオフの `vllm/nemotron-3-*` では、バンドルされている vLLM Plugin が自動的に `enable_thinking: false` と `force_nonempty_content: true` を送信します。明示的な `chat_template_kwargs` は生成されたデフォルトを上書きし、`extra_body.chat_template_kwargs` がなお最終優先になります。vLLM Qwen の thinking 制御では、そのモデルエントリで `params.qwenThinkingFormat` を `"chat-template"` または `"top-level"` に設定します。
- `compat.supportedReasoningEfforts`: モデルごとの OpenAI 互換 reasoning effort リスト。本当に受け付けるカスタムエンドポイントには `"xhigh"` を含めます。すると OpenClaw は、その設定済みプロバイダー/モデルに対して、コマンドメニュー、Gateway セッション行、セッションパッチ検証、エージェント CLI 検証、`llm-task` 検証で `/think xhigh` を公開します。バックエンドが正規レベルに対してプロバイダー固有の値を求める場合は、`compat.reasoningEffortMap` を使用します。
- `params.preserveThinking`: preserved thinking のための Z.AI 専用オプトイン。有効化され、thinking がオンの場合、OpenClaw は `thinking.clear_thinking: false` を送信し、以前の `reasoning_content` を再生します。[Z.AI の thinking と preserved thinking](/ja-JP/providers/zai#thinking-and-preserved-thinking) を参照してください。
- `agentRuntime`: デフォルトの低レベルエージェントランタイムポリシー。ID を省略すると OpenClaw Pi がデフォルトになります。組み込みの PI ハーネスを強制するには `id: "pi"` を使用し、登録済み Plugin ハーネスにサポート対象モデルの要求を許可するには `id: "auto"` を使用し、`id: "codex"` のような登録済みハーネス ID、または `id: "claude-cli"` のようなサポート対象 CLI バックエンドエイリアスを使用します。自動 PI フォールバックを無効にするには `fallback: "none"` を設定します。`codex` のような明示的な Plugin ランタイムは、同じ上書きスコープで `fallback: "pi"` を設定しない限り、デフォルトで fail closed になります。モデル参照は `provider/model` として正規形式を維持してください。Codex、Claude CLI、Gemini CLI、その他の実行バックエンドは、従来のランタイムプロバイダー接頭辞ではなくランタイム設定で選択します。これがプロバイダー/モデル選択とどう異なるかは、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) を参照してください。
- これらのフィールドを変更する設定書き込み処理 (例: `/models set`、`/models set-image`、フォールバックの追加/削除コマンド) は、正規のオブジェクト形式で保存し、可能な場合は既存のフォールバックリストを保持します。
- `maxConcurrent`: セッション間の最大並列エージェント実行数 (各セッション内は引き続き直列化されます)。デフォルト: 4。

### `agents.defaults.agentRuntime`

`agentRuntime` は、どの低レベル実行器がエージェントターンを実行するかを制御します。ほとんどの
デプロイでは、デフォルトの OpenClaw Pi ランタイムを維持するべきです。バンドルされている Codex アプリサーバーハーネスのように、信頼済み
Plugin がネイティブハーネスを提供する場合、または Claude CLI のようなサポート対象 CLI バックエンドを使いたい場合に使用します。メンタル
モデルについては、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) を参照してください。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`、`"pi"`、登録済み Plugin ハーネス ID、またはサポート対象 CLI バックエンドエイリアス。バンドルされている Codex Plugin は `codex` を登録します。バンドルされている Anthropic Plugin は `claude-cli` CLI バックエンドを提供します。
- `fallback`: `"pi"` または `"none"`。`id: "auto"` では、フォールバックを省略するとデフォルトで `"pi"` になり、Plugin ハーネスが実行を要求しない場合でも古い設定が PI を使い続けられます。`id: "codex"` のような明示的な Plugin ランタイムモードでは、フォールバックを省略するとデフォルトで `"none"` になり、ハーネスがない場合に PI を暗黙に使うのではなく失敗します。ランタイム上書きは、より広いスコープからフォールバックを継承しません。その互換フォールバックを意図的に使いたい場合は、明示的なランタイムと一緒に `fallback: "pi"` を設定してください。選択された Plugin ハーネスの失敗は常に直接表面化します。
- 環境上書き: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は `id` を上書きします。`OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` はそのプロセスのフォールバックを上書きします。
- Codex 専用デプロイでは、`model: "openai/gpt-5.5"` と `agentRuntime.id: "codex"` を設定します。読みやすさのために `agentRuntime.fallback: "none"` を明示的に設定してもかまいません。これは明示的な Plugin ランタイムのデフォルトです。
- Claude CLI デプロイでは、`model: "anthropic/claude-opus-4-7"` と `agentRuntime.id: "claude-cli"` を推奨します。従来の `claude-cli/claude-opus-4-7` モデル参照も互換性のために引き続き機能しますが、新しい設定ではプロバイダー/モデル選択を正規形式に保ち、実行バックエンドを `agentRuntime.id` に置くべきです。
- 古いランタイムポリシーキーは、`openclaw doctor --fix` によって `agentRuntime` に書き換えられます。
- ハーネスの選択は、最初の埋め込み実行後にセッション ID ごとに固定されます。設定/env の変更は、新規またはリセットされたセッションに影響し、既存のトランスクリプトには影響しません。トランスクリプト履歴はあるが記録済みの固定情報がない従来セッションは、PI に固定されたものとして扱われます。`/status` は有効なランタイムを報告します。例: `Runtime: OpenClaw Pi Default` または `Runtime: OpenAI Codex`。
- これはテキストのエージェントターン実行のみを制御します。メディア生成、vision、PDF、音楽、動画、TTS は引き続きそれぞれのプロバイダー/モデル設定を使用します。

**組み込みエイリアス短縮形** (`agents.defaults.models` にモデルがある場合にのみ適用):

| エイリアス        | モデル                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` または `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

構成済みのエイリアスは常にデフォルトより優先されます。

Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的に思考モードを有効にします。
Z.AI モデルはツール呼び出しストリーミングのために、デフォルトで `tool_stream` を有効にします。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的な思考レベルが設定されていない場合、デフォルトで `adaptive` 思考になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用の任意の CLI バックエンド（ツール呼び出しなし）。API プロバイダーが失敗した場合のバックアップとして有用です。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI バックエンドはテキスト優先です。ツールは常に無効です。
- `sessionArg` が設定されている場合、セッションがサポートされます。
- `imageArg` がファイルパスを受け付ける場合、画像のパススルーがサポートされます。

### `agents.defaults.systemPromptOverride`

OpenClaw が組み立てたシステムプロンプト全体を固定文字列に置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはエージェントごと（`agents.list[].systemPromptOverride`）に設定します。エージェントごとの値が優先されます。空または空白のみの値は無視されます。制御されたプロンプト実験に有用です。

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

モデルファミリーごとに適用される、プロバイダー非依存のプロンプトオーバーレイ。GPT-5 ファミリーのモデル ID は、プロバイダーをまたいで共有の動作契約を受け取ります。`personality` はフレンドリーな対話スタイル層のみを制御します。

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"`（デフォルト）と `"on"` は、フレンドリーな対話スタイル層を有効にします。
- `"off"` はフレンドリー層のみを無効にします。タグ付けされた GPT-5 動作契約は有効なままです。
- 共有設定が未設定の場合、従来の `plugins.entries.openai.config.personality` は引き続き読み取られます。

### `agents.defaults.heartbeat`

定期的な Heartbeat 実行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API キー認証）または `1h`（OAuth 認証）。無効にするには `0m` に設定します。
- `includeSystemPromptSection`: false の場合、システムプロンプトから Heartbeat セクションを省略し、ブートストラップコンテキストへの `HEARTBEAT.md` 注入をスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。
- `timeoutSeconds`: Heartbeat エージェントターンが中止されるまでに許可される最大秒数。未設定のままにすると `agents.defaults.timeoutSeconds` を使用します。
- `directPolicy`: ダイレクト/DM 配信ポリシー。`allow`（デフォルト）はダイレクトターゲット配信を許可します。`block` はダイレクトターゲット配信を抑制し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、Heartbeat 実行は軽量ブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は以前の会話履歴なしの新しいセッションで実行されます。cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat ごとのトークンコストを約 100K から約 2-5K トークンに削減します。
- `skipWhenBusy`: true の場合、Heartbeat 実行は追加のビジーレーン（サブエージェントまたはネストされたコマンド作業）で延期されます。このフラグがなくても、Cron レーンは常に Heartbeat を延期します。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義している場合、**それらのエージェントのみ** が Heartbeat を実行します。
- Heartbeat は完全なエージェントターンを実行します。間隔が短いほど、より多くのトークンを消費します。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` または `safeguard`（長い履歴向けのチャンク化要約）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済み Compaction プロバイダー Plugin の ID。設定すると、組み込みの LLM 要約の代わりにプロバイダーの `summarize()` が呼び出されます。失敗時は組み込みにフォールバックします。プロバイダーを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: 単一の Compaction 操作に許可される最大秒数。この時間を超えると OpenClaw は中止します。デフォルト: `900`。
- `keepRecentTokens`: 直近のトランスクリプト末尾をそのまま保持するための Pi カットポイント予算。手動 `/compact` は、明示的に設定されている場合にこれを尊重します。それ以外の場合、手動 Compaction はハードチェックポイントです。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は Compaction 要約中に組み込みの不透明識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用される、任意のカスタム識別子保持テキスト。
- `qualityGuard`: safeguard 要約の形式不正出力に対する再試行チェック。safeguard モードではデフォルトで有効です。監査をスキップするには `enabled: false` を設定します。
- `midTurnPrecheck`: 任意の Pi ツールループ圧力チェック。`enabled: true` の場合、OpenClaw はツール結果が追加された後、次のモデル呼び出しの前にコンテキスト圧力をチェックします。コンテキストが収まらなくなっている場合、プロンプトを送信する前に現在の試行を中止し、既存の事前チェック復旧パスを再利用してツール結果を切り詰めるか、Compaction して再試行します。`default` と `safeguard` の両方の Compaction モードで動作します。デフォルト: 無効。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。再注入を無効にするには `[]` に設定します。未設定または明示的にそのデフォルトペアに設定されている場合、古い `Every Session`/`Safety` 見出しもレガシーフォールバックとして受け入れられます。
- `model`: Compaction 要約専用の任意の `provider/model-id` オーバーライド。メインセッションでは 1 つのモデルを維持しつつ、Compaction 要約を別のモデルで実行したい場合に使用します。未設定の場合、Compaction はセッションのプライマリモデルを使用します。
- `maxActiveTranscriptBytes`: アクティブな JSONL がしきい値を超えた場合に、実行前に通常のローカル Compaction をトリガーする任意のバイトしきい値（`number` または `"20mb"` のような文字列）。Compaction 成功後により小さい後続トランスクリプトへローテーションできるように、`truncateAfterCompaction` が必要です。未設定または `0` の場合は無効です。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時に短い通知をユーザーへ送信します（例: 「コンテキストを圧縮しています...」や「Compaction 完了」）。Compaction を静かに保つため、デフォルトでは無効です。
- `memoryFlush`: 自動 Compaction 前に永続メモリを保存するためのサイレントなエージェントターン。この保守ターンをローカルモデルに留めたい場合は、`model` を `ollama/qwen3:8b` のような正確なプロバイダー/モデルに設定します。このオーバーライドは、アクティブセッションのフォールバックチェーンを継承しません。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから**古いツール結果**を枝刈りします。ディスク上のセッション履歴は変更**しません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl モードの動作">

- `mode: "cache-ttl"` は枝刈りパスを有効にします。
- `ttl` は、枝刈りを再実行できる頻度を制御します（最後のキャッシュタッチ後）。
- 枝刈りでは、まず大きすぎるツール結果をソフトトリムし、その後必要に応じて古いツール結果をハードクリアします。

**ソフトトリム** は先頭と末尾を保持し、中央に `...` を挿入します。

**ハードクリア** はツール結果全体をプレースホルダーで置き換えます。

注記:

- 画像ブロックはトリム/クリアされません。
- 比率は文字ベース（概算）であり、正確なトークン数ではありません。
- `keepLastAssistants` 未満のアシスタントメッセージしか存在しない場合、枝刈りはスキップされます。

</Accordion>

動作の詳細については、[Session Pruning](/ja-JP/concepts/session-pruning) を参照してください。

### ブロックストリーミング

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram 以外のチャンネルでブロック返信を有効にするには、明示的に `*.blockStreaming: true` が必要です。
- チャンネルの上書き: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダム化された一時停止。`natural` = 800〜2500ms。エージェントごとの上書き: `agents.list[].humanDelay`。

動作とチャンク化の詳細は [ストリーミング](/ja-JP/concepts/streaming) を参照してください。

### 入力インジケーター

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- デフォルト: ダイレクトチャット/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- セッションごとの上書き: `session.typingMode`、`session.typingIntervalSeconds`。

[入力インジケーター](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みエージェント向けの任意のサンドボックス化。完全なガイドは [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox details">

**バックエンド:**

- `docker`: ローカル Docker ランタイム（デフォルト）
- `ssh`: 汎用 SSH ベースのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` が選択されている場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのワークスペースに使用する絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が実行時に一時ファイルへ実体化するインライン内容または SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH ホストキー ポリシーの調整項目

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先されます
- `certificateData` は `certificateFile` より優先されます
- `knownHostsData` は `knownHostsFile` より優先されます
- SecretRef ベースの `*Data` 値は、サンドボックス セッション開始前にアクティブなシークレット ランタイム スナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成後にリモートワークスペースを一度シードします
- その後、リモート SSH ワークスペースを正本として維持します
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングします
- リモート変更をホストへ自動的には同期しません
- サンドボックス ブラウザー コンテナーはサポートしません

**ワークスペース アクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのサンドボックス ワークスペース
- `ro`: `/workspace` にあるサンドボックス ワークスペース、`/agent` に読み取り専用でマウントされたエージェント ワークスペース
- `rw`: `/workspace` に読み取り/書き込みでマウントされたエージェント ワークスペース

**スコープ:**

- `session`: セッションごとのコンテナー + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナー + ワークスペース（デフォルト）
- `shared`: 共有コンテナーとワークスペース（セッション間の分離なし）

**OpenShell Plugin 設定:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell モード:**

- `mirror`: exec 前にローカルからリモートへシードし、exec 後に同期して戻します。ローカルワークスペースが正本のままです
- `remote`: サンドボックス作成時にリモートを一度シードし、その後はリモートワークスペースを正本として維持します

`remote` モードでは、シード手順の後に OpenClaw の外部で行われたホストローカルの編集は、サンドボックスへ自動的には同期されません。
トランスポートは OpenShell サンドボックスへの SSH ですが、サンドボックスのライフサイクルと任意のミラー同期は Plugin が所有します。

**`setupCommand`** はコンテナー作成後に一度実行されます（`sh -lc` 経由）。ネットワーク送信、書き込み可能なルート、root ユーザーが必要です。

**コンテナーのデフォルトは `network: "none"`** です。エージェントに外向きアクセスが必要な場合は `"bridge"`（またはカスタム ブリッジネットワーク）に設定してください。
`"host"` はブロックされます。`"container:<id>"` は、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急回避）を設定しない限りデフォルトでブロックされます。

**受信添付ファイル** は、アクティブなワークスペース内の `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルおよびエージェントごとの bind はマージされます。

**サンドボックス化されたブラウザー**（`sandbox.browser.enabled`）: コンテナー内の Chromium + CDP。noVNC URL はシステムプロンプトに注入されます。`openclaw.json` の `browser.enabled` は不要です。
noVNC オブザーバー アクセスはデフォルトで VNC 認証を使用し、OpenClaw は共有 URL でパスワードを公開する代わりに短命のトークン URL を発行します。

- `allowHostControl: false`（デフォルト）は、サンドボックス化されたセッションがホストブラウザーを対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用ブリッジネットワーク）です。グローバル ブリッジ接続を明示的に必要とする場合のみ `bridge` に設定してください。
- `cdpSourceRange` は、コンテナー境界での CDP 入力を任意で CIDR 範囲（例: `172.21.0.1/32`）に制限します。
- `sandbox.browser.binds` は、追加のホストディレクトリをサンドボックス ブラウザー コンテナーにのみマウントします。設定されている場合（`[]` を含む）、ブラウザー コンテナーでは `docker.binds` を置き換えます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナーホスト向けに調整されています:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions`（デフォルトで有効）
  - `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu` は
    デフォルトで有効で、WebGL/3D の使用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - ワークフローが拡張機能に依存している場合、
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で拡張機能を再度有効にできます。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    デフォルトのプロセス制限を使用するには `0` を設定します。
  - `noSandbox` が有効な場合は、さらに `--no-sandbox`。
  - デフォルトはコンテナーイメージのベースラインです。コンテナーのデフォルトを変更するには、カスタム
    エントリーポイントを持つカスタム ブラウザー イメージを使用してください。

</Accordion>

ブラウザーのサンドボックス化と `sandbox.docker.binds` は Docker 専用です。

イメージをビルドします:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list`（エージェントごとの上書き）

`agents.list[].tts` を使用して、エージェントに独自の TTS プロバイダー、音声、モデル、
スタイル、または自動 TTS モードを与えます。エージェントブロックはグローバルの
`messages.tts` に対してディープマージされるため、共有認証情報を 1 か所に置いたまま、個々の
エージェントは必要な音声またはプロバイダーフィールドだけを上書きできます。アクティブなエージェントの
上書きは、自動音声返信、`/tts audio`、`/tts status`、および
`tts` エージェントツールに適用されます。プロバイダー例と優先順位については、[テキスト読み上げ](/ja-JP/tools/tts#per-agent-voice-overrides)
を参照してください。

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: 安定したエージェント ID（必須）。
- `default`: 複数設定されている場合は最初のものが優先されます（警告がログに記録されます）。何も設定されていない場合は、リストの最初のエントリがデフォルトです。
- `model`: 文字列形式では、モデルのフォールバックなしでエージェント単位の厳密な primary を設定します。オブジェクト形式 `{ primary }` も、`fallbacks` を追加しない限り厳密です。`{ primary, fallbacks: [...] }` を使うとそのエージェントでフォールバックを有効にでき、`{ primary, fallbacks: [] }` を使うと厳密な動作を明示できます。`primary` だけを上書きする Cron ジョブは、`fallbacks: []` を設定しない限りデフォルトのフォールバックを引き継ぎます。
- `params`: `agents.defaults.models` で選択されたモデルエントリにマージされる、エージェント単位のストリームパラメータです。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有の上書きに使います。
- `tts`: エージェント単位の任意のテキスト読み上げ上書きです。このブロックは `messages.tts` にディープマージされるため、共有プロバイダー資格情報とフォールバックポリシーは `messages.tts` に置き、プロバイダー、音声、モデル、スタイル、自動モードなどのペルソナ固有の値だけをここで設定してください。
- `skills`: エージェント単位の任意の Skills 許可リストです。省略した場合、設定されていればエージェントは `agents.defaults.skills` を引き継ぎます。明示的なリストはデフォルトとマージされず置き換えられ、`[]` は Skills なしを意味します。
- `thinkingDefault`: エージェント単位の任意のデフォルト思考レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）です。メッセージ単位またはセッション単位の上書きが設定されていない場合、このエージェントについて `agents.defaults.thinkingDefault` を上書きします。選択されたプロバイダー/モデルプロファイルが、有効な値を制御します。Google Gemini では、`adaptive` によりプロバイダー所有の動的思考が維持されます（Gemini 3/3.1 では `thinkingLevel` を省略、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: エージェント単位の任意のデフォルト推論表示（`on | off | stream`）です。メッセージ単位またはセッション単位の推論上書きが設定されていない場合、このエージェントについて `agents.defaults.reasoningDefault` を上書きします。
- `fastModeDefault`: 高速モードのエージェント単位の任意のデフォルト（`true | false`）です。メッセージ単位またはセッション単位の高速モード上書きが設定されていない場合に適用されます。
- `agentRuntime`: エージェント単位の任意の低レベルランタイムポリシー上書きです。`{ id: "codex" }` を使うと、他のエージェントは `auto` モードのデフォルト PI フォールバックを維持したまま、1 つのエージェントだけを Codex 専用にできます。
- `runtime`: エージェント単位の任意のランタイム記述子です。エージェントをデフォルトで ACP ハーネスセッションにする必要がある場合は、`runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）とともに `type: "acp"` を使います。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します。`ackReaction` は `emoji` から、`mentionPatterns` は `name`/`emoji` から導出されます。
- `subagents.allowAgents`: 明示的な `sessions_spawn.agentId` ターゲット用のエージェント ID の許可リスト（`["*"]` = 任意、デフォルト: 同じエージェントのみ）。自己ターゲットの `agentId` 呼び出しを許可する必要がある場合は、要求元 ID を含めます。
- サンドボックス継承ガード: 要求元セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します。デフォルト: false）。

---

## マルチエージェントルーティング

1 つの Gateway 内で、分離された複数のエージェントを実行します。[マルチエージェント](/ja-JP/concepts/multi-agent)を参照してください。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### バインディング一致フィールド

- `type`（任意）: 通常のルーティングには `route`（type がない場合のデフォルトは route）、永続 ACP 会話バインディングには `acp`。
- `match.channel`（必須）
- `match.accountId`（任意、`*` = 任意のアカウント、省略 = デフォルトアカウント）
- `match.peer`（任意、`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意、チャンネル固有）
- `acp`（任意、`type: "acp"` の場合のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致、peer/guild/team なし）
5. `match.accountId: "*"`（チャンネル全体）
6. デフォルトエージェント

各階層内では、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリでは、OpenClaw は正確な会話 ID（`match.channel` + アカウント + `match.peer.id`）で解決し、上記のルートバインディング階層順序は使いません。

### エージェント単位のアクセスプロファイル

<Accordion title="フルアクセス（サンドボックスなし）">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="読み取り専用ツール + ワークスペース">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ファイルシステムアクセスなし（メッセージングのみ）">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

優先順位の詳細については、[マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

---

## セッション

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールドの詳細">

- **`scope`**: グループチャットコンテキストの基本セッショングループ化戦略。
  - `per-sender` (デフォルト): 各送信者はチャンネルコンテキスト内で分離されたセッションを持ちます。
  - `global`: チャンネルコンテキスト内のすべての参加者が 1 つのセッションを共有します (共有コンテキストを意図している場合のみ使用)。
- **`dmScope`**: DM のグループ化方法。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャンネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャンネル + 送信者ごとに分離します (マルチユーザー受信箱に推奨)。
  - `per-account-channel-peer`: アカウント + チャンネル + 送信者ごとに分離します (マルチアカウントに推奨)。
- **`identityLinks`**: クロスチャンネルのセッション共有のために、正規 ID をプロバイダープレフィックス付きピアへマップします。`/dock_discord` などのドックコマンドは同じマップを使い、アクティブセッションの返信ルートを別のリンク済みチャンネルピアへ切り替えます。[チャンネルドッキング](/ja-JP/concepts/channel-docking)を参照してください。
- **`reset`**: 主要なリセットポリシー。`daily` は `atHour` のローカル時刻にリセットします。`idle` は `idleMinutes` 後にリセットします。両方が設定されている場合は、先に期限切れになったほうが優先されます。日次リセットの鮮度はセッション行の `sessionStartedAt` を使います。アイドルリセットの鮮度は `lastInteractionAt` を使います。heartbeat、cron ウェイクアップ、exec 通知、gateway の帳簿処理などのバックグラウンド/システムイベント書き込みは `updatedAt` を更新できますが、日次/アイドルセッションを新鮮な状態には保ちません。
- **`resetByType`**: タイプ別の上書き (`direct`、`group`、`thread`)。レガシーの `dm` は `direct` のエイリアスとして受け入れられます。
- **`parentForkMaxTokens`**: フォークされたスレッドセッションを作成するときに許可される親セッションの最大 `totalTokens` (デフォルト `100000`)。
  - 親の `totalTokens` がこの値を超えている場合、OpenClaw は親のトランスクリプト履歴を継承せず、新しいスレッドセッションを開始します。
  - このガードを無効にして親のフォークを常に許可するには `0` を設定します。
- **`mainKey`**: レガシーフィールド。ランタイムはメインの直接チャットバケットに常に `"main"` を使います。
- **`agentToAgent.maxPingPongTurns`**: エージェント間交換中にエージェント間で返信し合う最大ターン数 (整数、範囲: `0`–`5`)。`0` はピンポンチェーンを無効にします。
- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、レガシーの `dm` エイリアスあり)、`keyPrefix`、または `rawKeyPrefix` で照合します。最初の deny が優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを出します。`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの経過時間しきい値 (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` 内の最大エントリ数 (デフォルト `500`)。ランタイムのバッチクリーンアップ書き込みは、本番サイズの上限に対して小さな高水位バッファを使います。`openclaw sessions cleanup --enforce` は上限を即時適用します。
  - `rotateBytes`: 非推奨で無視されます。`openclaw doctor --fix` は古い設定からこれを削除します。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter` です。無効にするには `false` を設定します。
  - `maxDiskBytes`: 任意のセッションディレクトリのディスク容量予算。`warn` モードでは警告をログ出力します。`enforce` モードでは最も古い成果物/セッションから削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッド紐付けセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーは上書き可能。Discord は `channels.discord.threadBindings.enabled` を使います)
  - `idleHours`: 非アクティブ時の自動フォーカス解除のデフォルト時間数 (`0` で無効。プロバイダーは上書き可能)
  - `maxAgeHours`: ハードな最大経過時間のデフォルト時間数 (`0` で無効。プロバイダーは上書き可能)

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

チャンネル/アカウント別の上書き: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順序 (最も具体的なものが優先): アカウント → チャンネル → グローバル。`""` は無効化し、カスケードを停止します。`"auto"` は `[{identity.name}]` を派生します。

**テンプレート変数:**

| 変数              | 説明                   | 例                          |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いモデル名           | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子     | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名         | `anthropic`                 |
| `{thinkingLevel}` | 現在の thinking レベル | `high`, `low`, `off`        |
| `{identity.name}` | エージェント ID 名     | (`"auto"` と同じ)           |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` のエイリアスです。

### Ack リアクション

- デフォルトはアクティブエージェントの `identity.emoji`、なければ `"👀"` です。無効にするには `""` を設定します。
- チャンネル別の上書き: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャンネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram、WhatsApp、BlueBubbles など、リアクション対応チャンネルで返信後に ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram でライフサイクルステータスリアクションを有効にします。
  Slack と Discord では、未設定の場合、ack リアクションがアクティブなときにステータスリアクションが有効のままになります。
  Telegram では、ライフサイクルステータスリアクションを有効にするには明示的に `true` を設定します。

### 受信デバウンス

同じ送信者からの短時間のテキストのみのメッセージを 1 つのエージェントターンにまとめます。メディア/添付ファイルは即時フラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS (テキスト読み上げ)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定を上書きでき、`/tts status` は有効な状態を表示します。
- `summaryModel` は自動要約用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false` (オプトイン) です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` と `OPENAI_API_KEY` にフォールバックします。
- バンドルされた音声プロバイダーは plugin 所有です。`plugins.allow` が設定されている場合は、使いたい各 TTS provider plugin を含めてください。たとえば Edge TTS には `microsoft` を含めます。レガシーの `edge` プロバイダー ID は `microsoft` のエイリアスとして受け入れられます。
- `providers.openai.baseUrl` は OpenAI TTS エンドポイントを上書きします。解決順序は設定、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `providers.openai.baseUrl` が OpenAI 以外のエンドポイントを指す場合、OpenClaw はそれを OpenAI 互換 TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## Talk

Talk モード (macOS/iOS/Android) のデフォルト。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- 複数の Talk プロバイダーが設定されている場合、`talk.provider` は `talk.providers` 内のキーと一致している必要があります。
- レガシーのフラットな Talk キー (`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`) は互換性専用で、`talk.providers.<provider>` に自動移行されます。
- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` は平文文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk ディレクティブで親しみやすい名前を使えます。
- `providers.mlx.modelId` は macOS ローカル MLX ヘルパーが使う Hugging Face リポジトリを選択します。省略した場合、macOS は `mlx-community/Soprano-80M-bf16` を使います。
- macOS MLX 再生は、存在する場合はバンドルされた `openclaw-mlx-tts` ヘルパーを通じて実行され、そうでなければ `PATH` 上の実行可能ファイルを通じて実行されます。`OPENCLAW_MLX_TTS_BIN` は開発用にヘルパーパスを上書きします。
- `speechLocale` は iOS/macOS Talk 音声認識で使う BCP 47 ロケール ID を設定します。デバイスのデフォルトを使うには未設定のままにします。
- `silenceTimeoutMs` は、Talk モードがユーザーの無音後にトランスクリプトを送信するまで待機する時間を制御します。未設定の場合、プラットフォームのデフォルトの一時停止ウィンドウが維持されます (`macOS と Android では 700 ms、iOS では 900 ms`)。

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他すべての設定キー
- [設定](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [設定例](/ja-JP/gateway/configuration-examples)
