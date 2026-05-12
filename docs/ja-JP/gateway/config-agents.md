---
read_when:
    - エージェントのデフォルト設定の調整（モデル、思考、ワークスペース、Heartbeat、メディア、Skills）
    - マルチエージェントのルーティングとバインディングの設定
    - セッション、メッセージ配信、トークモードの動作を調整する
summary: エージェントのデフォルト、マルチエージェントルーティング、セッション、メッセージ、talk 設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-05-12T12:51:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 517aec30ff6c65a269c7e5c8baefb5dc371dabe52d4c38a47a41cae1a1a785e1
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、`messages.*`、`talk.*` 配下のエージェントスコープの設定キー。チャネル、ツール、Gateway ランタイム、その他のトップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システムプロンプトのランタイム行に表示される任意のリポジトリルート。未設定の場合、OpenClaw はワークスペースから上位へたどって自動検出します。

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
- 空でない `agents.list[].skills` リストは、そのエージェントの最終的なセットです。デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

ワークスペースのブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

必須のブートストラップファイルは引き続き書き込みつつ、選択した任意のワークスペースファイルの作成をスキップします。有効な値: `SOUL.md`、`USER.md`、`HEARTBEAT.md`、`IDENTITY.md`。

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

ワークスペースのブートストラップファイルをシステムプロンプトへ注入するタイミングを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（完了したアシスタント応答の後）では、ワークスペースのブートストラップ再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と Compaction 後の再試行では、引き続きコンテキストを再構築します。
- `"never"`: すべてのターンで、ワークスペースのブートストラップとコンテキストファイル注入を無効にします。これは、自身のプロンプトライフサイクルを完全に所有するエージェント（カスタムコンテキストエンジン、自身でコンテキストを構築するネイティブランタイム、またはブートストラップ不要の特殊なワークフロー）にのみ使用してください。Heartbeat と Compaction リカバリーターンでも注入をスキップします。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前の、ワークスペースのブートストラップファイルごとの最大文字数。デフォルト: `12000`。

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

ブートストラップコンテキストが切り詰められたときに、エージェントから見えるシステムプロンプト通知を制御します。デフォルト: `"once"`。

- `"off"`: システムプロンプトに切り詰め通知テキストを注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに、簡潔な通知を一度だけ注入します（推奨）。
- `"always"`: 切り詰めが存在するすべての実行で、簡潔な通知を注入します。

詳細な raw/注入済みカウントと設定調整フィールドは、コンテキスト/ステータスレポートやログなどの診断に残ります。通常の WebChat ユーザー/ランタイムコンテキストには、簡潔なリカバリー通知のみが含まれます。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有権マップ

OpenClaw には高容量のプロンプト/コンテキスト予算が複数あり、それらは 1 つの汎用ノブにすべて流し込むのではなく、意図的にサブシステムごとに分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常のワークスペースブートストラップ注入。
- `agents.defaults.startupContext.*`:
  直近の日次 `memory/*.md` ファイルを含む、リセット/起動時のモデル実行に対する一回限りの前置き。素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずに確認応答されます。
- `skills.limits.*`:
  システムプロンプトへ注入されるコンパクトな Skills リスト。
- `agents.defaults.contextLimits.*`:
  境界付けされたランタイム抜粋と、注入されるランタイム所有ブロック。
- `memory.qmd.limits.*`:
  インデックス済みメモリ検索スニペットと注入サイズ。

1 つのエージェントだけが異なる予算を必要とする場合にのみ、対応するエージェント単位のオーバーライドを使用してください。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

リセット/起動時のモデル実行で注入される初回ターンの起動前置きを制御します。素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずにリセットを確認応答するため、この前置きを読み込みません。

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

境界付けされたランタイムコンテキストサーフェス向けの共有デフォルト。

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
- `memoryGetDefaultLines`: `lines` が省略されたときの、デフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果とオーバーフローリカバリーに使われるライブツール結果の上限。
- `postCompactionMaxChars`: Compaction 後の更新注入中に使われる AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブに対するエージェント単位のオーバーライド。省略されたフィールドは `agents.defaults.contextLimits` から継承されます。

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

システムプロンプトへ注入されるコンパクトな Skills リストのグローバル上限。これは必要に応じて `SKILL.md` ファイルを読む動作には影響しません。

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

Skills プロンプト予算に対するエージェント単位のオーバーライド。

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

プロバイダー呼び出し前に、トランスクリプト/ツールの画像ブロック内で最も長い画像辺に許可される最大ピクセルサイズ。デフォルト: `1200`。

値を低くすると、通常、スクリーンショットが多い実行でのビジョントークン使用量とリクエストペイロードサイズが削減されます。値を高くすると、より多くの視覚的詳細を保持します。

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
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - 文字列形式では primary モデルのみを設定します。
  - オブジェクト形式では primary と順序付きのフェイルオーバーモデルを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - `image` ツールパスで、その vision-model 設定として使用されます。
  - 選択済みまたはデフォルトのモデルが画像入力を受け付けられない場合のフォールバックルーティングにも使用されます。
  - 明示的な `provider/model` 参照を推奨します。裸の ID は互換性のために受け付けられます。裸の ID が `models.providers.*.models` 内の設定済みの画像対応エントリに一意に一致する場合、OpenClaw はそのプロバイダーで修飾します。設定済みの一致が曖昧な場合は、明示的なプロバイダープレフィックスが必要です。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - 共有画像生成機能、および画像を生成する将来のツール/Plugin サーフェスで使用されます。
  - 代表的な値: ネイティブ Gemini 画像生成では `google/gemini-3.1-flash-image-preview`、fal では `fal/fal-ai/flux/dev`、OpenAI Images では `openai/gpt-image-2`、透明背景の OpenAI PNG/WebP 出力では `openai/gpt-image-1.5`。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証も設定してください（例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` / `openai/gpt-image-1.5` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、登録済みの残りの画像生成プロバイダーを provider-id 順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - 共有音楽生成機能とビルトインの `music_generate` ツールで使用されます。
  - 代表的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、登録済みの残りの音楽生成プロバイダーを provider-id 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - 共有動画生成機能とビルトインの `video_generate` ツールで使用されます。
  - 代表的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、登録済みの残りの動画生成プロバイダーを provider-id 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
  - バンドルされている Qwen 動画生成プロバイダーは、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、プロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のどちらかを受け付けます。
  - `pdf` ツールのモデルルーティングで使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルト PDF サイズ上限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮されるデフォルトの最大ページ数。
- `verboseDefault`: エージェントのデフォルト verbose レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `toolProgressDetail`: `/verbose` ツール要約と進行中ドラフトのツール行の詳細モード。値: `"explain"`（デフォルト、コンパクトな人間向けラベル）または `"raw"`（利用可能な場合に生のコマンド/詳細を追加）。エージェント単位の `agents.list[].toolProgressDetail` はこのデフォルトを上書きします。
- `reasoningDefault`: エージェントのデフォルト reasoning 表示。値: `"off"`、`"on"`、`"stream"`。エージェント単位の `agents.list[].reasoningDefault` はこのデフォルトを上書きします。設定済みの reasoning デフォルトは、メッセージ単位またはセッションの reasoning 上書きが設定されていない場合に限り、所有者、認可済み送信者、またはオペレーター管理 Gateway コンテキストにのみ適用されます。
- `elevatedDefault`: エージェントのデフォルト elevated-output レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: OpenAI API キーまたは Codex OAuth アクセスでは `openai/gpt-5.5`）。プロバイダーを省略すると、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に対する一意の設定済みプロバイダー一致を試し、その後にのみ設定済みデフォルトプロバイダーへフォールバックします（非推奨の互換性動作のため、明示的な `provider/model` を推奨します）。そのプロバイダーが設定済みデフォルトモデルを公開しなくなった場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示するのではなく、最初の設定済みプロバイダー/モデルにフォールバックします。
- `models`: `/model` 用の設定済みモデルカタログと許可リスト。各エントリには `alias`（ショートカット）と `params`（プロバイダー固有、例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`）を含められます。
  - `"openai-codex/*": {}` や `"vllm/*": {}` のような `provider/*` エントリを使用すると、すべてのモデル ID を手動で列挙せずに、選択したプロバイダーで検出されたすべてのモデルを表示できます。
  - 安全な編集: エントリを追加するには `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。`config set` は、`--replace` を渡さない限り、既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダースコープの設定/オンボーディングフローは、選択したプロバイダーモデルをこのマップにマージし、すでに設定済みの無関係なプロバイダーを保持します。
  - 直接の OpenAI Responses モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management` の挿入を止めるには `params.responsesServerCompaction: false` を使用し、しきい値を上書きするには `params.responsesCompactThreshold` を使用します。[OpenAI サーバー側 Compaction](/ja-JP/providers/openai#server-side-compaction-responses-api)を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルトプロバイダーパラメーター。`agents.defaults.params` で設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）は `agents.defaults.models["provider/model"].params`（モデル単位）で上書きされ、その後 `agents.list[].params`（一致するエージェント ID）がキー単位で上書きします。詳細は[プロンプトキャッシュ](/ja-JP/reference/prompt-caching)を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシの `api: "openai-completions"` リクエストボディにマージされる高度なパススルー JSON。生成されたリクエストキーと衝突する場合、追加ボディが優先されます。非ネイティブの completions ルートでは、その後も OpenAI 専用の `store` が削除されます。
- `params.chat_template_kwargs`: `api: "openai-completions"` リクエストボディのトップレベルにマージされる vLLM/OpenAI 互換の chat-template 引数。thinking がオフの `vllm/nemotron-3-*` では、バンドルされた vLLM Plugin が自動的に `enable_thinking: false` と `force_nonempty_content: true` を送信します。明示的な `chat_template_kwargs` は生成されたデフォルトを上書きし、`extra_body.chat_template_kwargs` が引き続き最終的な優先順位を持ちます。vLLM Qwen の thinking 制御では、そのモデルエントリで `params.qwenThinkingFormat` を `"chat-template"` または `"top-level"` に設定します。
- `compat.thinkingFormat`: OpenAI 互換の thinking ペイロードスタイル。Qwen スタイルのトップレベル `enable_thinking` には `"qwen"` を使用し、vLLM など、リクエストレベルの chat-template kwargs をサポートする Qwen 系バックエンドでの `chat_template_kwargs.enable_thinking` には `"qwen-chat-template"` を使用します。OpenClaw は無効な thinking を `false` に、有効な thinking を `true` にマップします。
- `compat.supportedReasoningEfforts`: モデル単位の OpenAI 互換 reasoning effort リスト。実際に受け付けるカスタムエンドポイントでは `"xhigh"` を含めます。すると OpenClaw は、その設定済みプロバイダー/モデルについて、コマンドメニュー、Gateway セッション行、セッションパッチ検証、エージェント CLI 検証、`llm-task` 検証で `/think xhigh` を公開します。バックエンドが標準レベルに対してプロバイダー固有の値を要求する場合は、`compat.reasoningEffortMap` を使用します。
- `params.preserveThinking`: 保持された thinking のための Z.AI 専用オプトイン。有効で thinking がオンの場合、OpenClaw は `thinking.clear_thinking: false` を送信し、以前の `reasoning_content` を再生します。[Z.AI の thinking と保持された thinking](/ja-JP/providers/zai#thinking-and-preserved-thinking)を参照してください。
- `localService`: ローカル/セルフホストのモデルサーバー用の任意のプロバイダーレベルプロセスマネージャー。選択されたモデルがそのプロバイダーに属する場合、OpenClaw は `healthUrl`（または `baseUrl + "/models"`）をプローブし、エンドポイントが停止していれば `args` 付きで `command` を起動し、最大 `readyTimeoutMs` まで待機してからモデルリクエストを送信します。`command` は絶対パスである必要があります。`idleStopMs: 0` は OpenClaw が終了するまでプロセスを存続させます。正の値は、OpenClaw が生成したプロセスを、そのアイドルミリ秒数の後に停止します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。
- ランタイムポリシーは `agents.defaults` ではなく、プロバイダーまたはモデルに属します。プロバイダー全体のルールには `models.providers.<provider>.agentRuntime` を使用し、モデル固有のルールには `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` を使用します。公式 OpenAI プロバイダー上の OpenAI エージェントモデルは、デフォルトで Codex を選択します。
- これらのフィールドを変更する設定ライター（例: `/models set`、`/models set-image`、フォールバック追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な場合は既存のフォールバックリストを保持します。
- `maxConcurrent`: セッションをまたぐエージェント実行の最大並列数（各セッション自体は引き続き直列化されます）。デフォルト: 4。

### ランタイムポリシー

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`、`"pi"`、登録済みの Plugin ハーネス ID、またはサポートされている CLI バックエンドエイリアス。バンドルされた Codex Plugin は `codex` を登録します。バンドルされた Anthropic Plugin は `claude-cli` CLI バックエンドを提供します。
- `id: "auto"` は、登録済みの Plugin ハーネスがサポート対象のターンを要求できるようにし、一致するハーネスがない場合は PI を使用します。`id: "codex"` のような明示的な Plugin ランタイムはそのハーネスを必要とし、利用不可または失敗した場合は安全側で失敗します。
- エージェント全体のランタイムキーはレガシーです。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、セッションランタイム pin、`OPENCLAW_AGENT_RUNTIME` はランタイム選択で無視されます。古い値を削除するには `openclaw doctor --fix` を実行します。
- OpenAI エージェントモデルはデフォルトで Codex ハーネスを使用します。明示したい場合、プロバイダー/モデルの `agentRuntime.id: "codex"` は引き続き有効です。
- Claude CLI デプロイメントでは、`model: "anthropic/claude-opus-4-7"` とモデルスコープの `agentRuntime.id: "claude-cli"` の組み合わせを推奨します。レガシーの `claude-cli/claude-opus-4-7` モデル参照は互換性のために引き続き動作しますが、新しい設定ではプロバイダー/モデル選択を正規形のままにし、実行バックエンドをプロバイダー/モデルのランタイムポリシーに置くべきです。
- これはテキストのエージェントターン実行のみを制御します。メディア生成、vision、PDF、音楽、動画、TTS は引き続きそれぞれのプロバイダー/モデル設定を使用します。

**ビルトインのエイリアス省略形**（モデルが `agents.defaults.models` にある場合にのみ適用されます）

| エイリアス               | モデル                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定したエイリアスは常にデフォルトより優先されます。

Z.AI GLM-4.x モデルは、`--thinking off` を設定するか `agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、thinking モードを自動的に有効にします。
Z.AI モデルは、ツール呼び出しのストリーミング用にデフォルトで `tool_stream` を有効にします。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` thinking になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行（ツール呼び出しなし）用の任意の CLI バックエンド。API プロバイダーが失敗した場合のバックアップとして有用です。

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

- CLI バックエンドはテキスト優先です。ツールは常に無効化されます。
- `sessionArg` が設定されている場合、セッションがサポートされます。
- `imageArg` がファイルパスを受け付ける場合、画像のパススルーがサポートされます。
- `reseedFromRawTranscriptWhenUncompacted: true` により、最初の Compaction サマリーが存在する前に、バックエンドは境界付きの生の OpenClaw トランスクリプト末尾から、安全な無効化済みセッションを復元できます。認証プロファイルまたは資格情報エポックの変更では、引き続き生の再シードは決して行われません。

### `agents.defaults.systemPromptOverride`

OpenClaw が組み立てたシステムプロンプト全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはエージェントごと（`agents.list[].systemPromptOverride`）に設定します。エージェントごとの値が優先されます。空、または空白のみの値は無視されます。制御されたプロンプト実験に有用です。

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

モデルファミリーごとに適用される、プロバイダー非依存のプロンプトオーバーレイ。GPT-5 ファミリーのモデル ID は、プロバイダーをまたいで共有の動作契約を受け取ります。`personality` は親しみやすい対話スタイル層のみを制御します。

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

- `"friendly"`（デフォルト）と `"on"` は、親しみやすい対話スタイル層を有効にします。
- `"off"` は親しみやすい層のみを無効にします。タグ付けされた GPT-5 の動作契約は有効なままです。
- レガシーの `plugins.entries.openai.config.personality` は、この共有設定が未設定の場合、引き続き読み取られます。

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
- `directPolicy`: 直接/DM 配信ポリシー。`allow`（デフォルト）は直接ターゲット配信を許可します。`block` は直接ターゲット配信を抑制し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、Heartbeat 実行は軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は以前の会話履歴なしの新しいセッションで実行されます。cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat ごとのトークンコストを約 100K から約 2-5K トークンに削減します。
- `skipWhenBusy`: true の場合、Heartbeat 実行は追加のビジーレーン（サブエージェントまたはネストされたコマンド作業）で延期されます。このフラグがなくても、Cron レーンは常に Heartbeat を延期します。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義している場合、**それらのエージェントのみ**が Heartbeat を実行します。
- Heartbeat は完全なエージェントターンを実行します。間隔を短くすると、より多くのトークンを消費します。

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

- `mode`: `default` または `safeguard`（長い履歴向けのチャンク化サマリー）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済み Compaction プロバイダー Plugin の ID。設定されている場合、組み込みの LLM サマリーの代わりにプロバイダーの `summarize()` が呼び出されます。失敗時は組み込みにフォールバックします。プロバイダーを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClaw が中止するまでに、単一の Compaction 操作に許可される最大秒数。デフォルト: `900`。
- `keepRecentTokens`: 最新のトランスクリプト末尾をそのまま保持するための Pi カットポイント予算。手動の `/compact` は、明示的に設定されている場合これを尊重します。それ以外の場合、手動 Compaction は強制チェックポイントです。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction サマリー時に組み込みの不透明識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用される、任意のカスタム識別子保持テキスト。
- `qualityGuard`: safeguard サマリーの不正形式出力に対する再試行チェック。safeguard モードではデフォルトで有効です。監査をスキップするには `enabled: false` を設定します。
- `midTurnPrecheck`: 任意の Pi ツールループ圧力チェック。`enabled: true` の場合、OpenClaw はツール結果が追加された後、次のモデル呼び出しの前にコンテキスト圧力をチェックします。コンテキストが収まらなくなった場合、プロンプト送信前に現在の試行を中止し、既存のプリチェック復旧パスを再利用してツール結果を切り詰めるか、Compaction して再試行します。`default` と `safeguard` の両方の Compaction モードで動作します。デフォルト: 無効。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。再注入を無効にするには `[]` を設定します。未設定、または明示的にこのデフォルトの組み合わせに設定されている場合、古い `Every Session`/`Safety` 見出しもレガシーフォールバックとして受け入れられます。
- `model`: Compaction サマリー専用の任意の `provider/model-id` オーバーライド。メインセッションでは 1 つのモデルを維持しつつ、Compaction サマリーは別のモデルで実行したい場合に使用します。未設定の場合、Compaction はセッションのプライマリモデルを使用します。
- `maxActiveTranscriptBytes`: アクティブな JSONL がしきい値を超えて増大したとき、実行前に通常のローカル Compaction をトリガーする任意のバイトしきい値（`number` または `"20mb"` のような文字列）。Compaction 成功後により小さい後続トランスクリプトへローテーションできるように、`truncateAfterCompaction` が必要です。未設定または `0` の場合は無効です。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時に短い通知をユーザーに送信します（例: 「コンテキストを圧縮中...」や「Compaction が完了しました」）。Compaction を静かに保つため、デフォルトでは無効です。
- `memoryFlush`: 永続メモリを保存するための、自動 Compaction 前のサイレントなエージェントターン。このハウスキーピングターンをローカルモデル上に留めたい場合は、`model` に `ollama/qwen3:8b` のような正確な provider/model を設定します。このオーバーライドは、アクティブセッションのフォールバックチェーンを継承しません。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.runRetries`

失敗復旧中の無限実行ループを防ぐための、組み込み Pi ランナー向け外側実行ループの再試行イテレーション境界。この設定は現在、ACP または CLI ランタイムではなく、組み込みエージェントランタイムにのみ適用される点に注意してください。

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: 外側実行ループの実行再試行イテレーションの基本数。デフォルト: `24`。
- `perProfile`: フォールバックプロファイル候補ごとに付与される追加の実行再試行イテレーション。デフォルト: `8`。
- `min`: 実行再試行イテレーションの絶対最小上限。デフォルト: `32`。
- `max`: 暴走実行を防ぐための、実行再試行イテレーションの絶対最大上限。デフォルト: `160`。

### `agents.defaults.contextPruning`

LLM へ送信する前に、メモリ内コンテキストから**古いツール結果**を刈り込みます。ディスク上のセッション履歴は変更**しません**。

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

- `mode: "cache-ttl"` はプルーニングのパスを有効にします。
- `ttl` は、最後のキャッシュアクセス後にプルーニングを再実行できる頻度を制御します。
- プルーニングはまず大きすぎるツール結果をソフトトリムし、必要に応じて古いツール結果をハードクリアします。

**ソフトトリム** は先頭と末尾を保持し、中央に `...` を挿入します。

**ハードクリア** はツール結果全体をプレースホルダーに置き換えます。

注記:

- 画像ブロックはトリムまたはクリアされません。
- 比率は文字ベース（概算）であり、正確なトークン数ではありません。
- `keepLastAssistants` より少ない assistant メッセージしか存在しない場合、プルーニングはスキップされます。

</Accordion>

動作の詳細は [セッションプルーニング](/ja-JP/concepts/session-pruning) を参照してください。

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

- Telegram 以外のチャネルでは、ブロック返信を有効にするために明示的な `*.blockStreaming: true` が必要です。
- チャネル上書き: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Signal/Slack/Discord/Google Chat の既定値は `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダムな一時停止。`natural` = 800–2500ms。エージェントごとの上書き: `agents.list[].humanDelay`。

動作とチャンク分割の詳細は [ストリーミング](/ja-JP/concepts/streaming) を参照してください。

### 入力中インジケーター

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

- 既定値: ダイレクトチャット/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- セッションごとの上書き: `session.typingMode`、`session.typingIntervalSeconds`。

[入力中インジケーター](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

組み込みエージェント向けの任意のサンドボックス化。完全なガイドは [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。

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

<Accordion title="サンドボックスの詳細">

**バックエンド:**

- `docker`: ローカル Docker ランタイム（既定）
- `ssh`: 汎用 SSH バックのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` が選択されている場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（既定値: `ssh`）
- `workspaceRoot`: スコープごとのワークスペースに使用される絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が実行時に一時ファイルとして実体化するインライン内容または SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH のホスト鍵ポリシー調整項目

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先されます
- `certificateData` は `certificateFile` より優先されます
- `knownHostsData` は `knownHostsFile` より優先されます
- SecretRef バックの `*Data` 値は、サンドボックスセッション開始前にアクティブなシークレットランタイムスナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成後にリモートワークスペースを一度シードします
- その後、リモート SSH ワークスペースを正とします
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングします
- リモート変更をホストへ自動的に同期しません
- サンドボックス化されたブラウザーコンテナーをサポートしません

**ワークスペースアクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのサンドボックスワークスペース
- `ro`: `/workspace` のサンドボックスワークスペース、`/agent` に読み取り専用でマウントされたエージェントワークスペース
- `rw`: `/workspace` に読み書きでマウントされたエージェントワークスペース

**スコープ:**

- `session`: セッションごとのコンテナー + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナー + ワークスペース（既定）
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

- `mirror`: exec 前にローカルからリモートへシードし、exec 後に同期し戻します。ローカルワークスペースが正のままです
- `remote`: サンドボックス作成時にリモートを一度シードし、その後はリモートワークスペースを正とします

`remote` モードでは、シード手順の後に OpenClaw の外部で行われたホストローカルの編集は、サンドボックスへ自動的に同期されません。
トランスポートは OpenShell サンドボックスへの SSH ですが、Plugin がサンドボックスのライフサイクルと任意のミラー同期を所有します。

**`setupCommand`** はコンテナー作成後に一度実行されます（`sh -lc` 経由）。ネットワーク送信、書き込み可能なルート、root ユーザーが必要です。

**コンテナーの既定値は `network: "none"`** です。エージェントが外部アクセスを必要とする場合は `"bridge"`（またはカスタムブリッジネットワーク）に設定してください。
`"host"` はブロックされます。`"container:<id>"` は、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急時用）を設定しない限り、既定でブロックされます。

**受信添付ファイル** はアクティブなワークスペース内の `media/inbound/*` にステージされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルとエージェントごとの bind はマージされます。

**サンドボックス化されたブラウザー**（`sandbox.browser.enabled`）: コンテナー内の Chromium + CDP。noVNC URL がシステムプロンプトに注入されます。`openclaw.json` の `browser.enabled` は不要です。
noVNC の観察者アクセスは既定で VNC 認証を使用し、OpenClaw は共有 URL でパスワードを公開する代わりに短命のトークン URL を発行します。

- `allowHostControl: false`（既定）は、サンドボックス化されたセッションがホストブラウザーを対象にすることをブロックします。
- `network` の既定値は `openclaw-sandbox-browser`（専用ブリッジネットワーク）です。グローバルなブリッジ接続が明示的に必要な場合のみ `bridge` に設定してください。
- `cdpSourceRange` は任意で、コンテナーのエッジで CDP 受信を CIDR 範囲に制限します（例: `172.21.0.1/32`）。
- `sandbox.browser.binds` は追加のホストディレクトリをサンドボックスブラウザーコンテナーにのみマウントします。設定した場合（`[]` を含む）、ブラウザーコンテナーでは `docker.binds` を置き換えます。
- 起動時の既定値は `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナーホスト向けに調整されています:
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
  - `--disable-extensions`（既定で有効）
  - `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu` は
    既定で有効であり、WebGL/3D の使用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - ワークフローが拡張機能に依存する場合、`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で拡張機能を再度有効化します。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    既定のプロセス上限を使うには `0` を設定します。
  - `noSandbox` が有効な場合は、さらに `--no-sandbox` が付きます。
  - 既定値はコンテナーイメージのベースラインです。コンテナーの既定値を変更するには、カスタム
    entrypoint を持つカスタムブラウザーイメージを使用してください。

</Accordion>

ブラウザーのサンドボックス化と `sandbox.docker.binds` は Docker 専用です。

イメージをビルドする（ソースチェックアウトから）:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

ソースチェックアウトなしの npm インストールでは、インラインの `docker build` コマンドについて [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) を参照してください。

### `agents.list`（エージェントごとの上書き）

`agents.list[].tts` を使用すると、エージェントごとに独自の TTS プロバイダー、音声、モデル、
スタイル、または自動 TTS モードを指定できます。エージェントブロックはグローバルな
`messages.tts` の上にディープマージされるため、共有認証情報は 1 か所に置いたまま、個々の
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
- `default`: 複数設定されている場合は、最初のものが優先されます（警告がログに記録されます）。未設定の場合は、リストの最初のエントリーがデフォルトになります。
- `model`: 文字列形式では、モデルフォールバックなしの厳密なエージェント別プライマリを設定します。オブジェクト形式 `{ primary }` も、`fallbacks` を追加しない限り厳密です。そのエージェントでフォールバックを有効にするには `{ primary, fallbacks: [...] }` を使用し、厳密な挙動を明示するには `{ primary, fallbacks: [] }` を使用します。`primary` だけを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトのフォールバックを引き継ぎます。
- `params`: `agents.defaults.models` で選択されたモデルエントリーの上にマージされる、エージェント別ストリームパラメーターです。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有の上書きに使用します。
- `tts`: 任意のエージェント別テキスト読み上げ上書きです。このブロックは `messages.tts` の上にディープマージされるため、共有プロバイダー認証情報とフォールバックポリシーは `messages.tts` に保持し、プロバイダー、音声、モデル、スタイル、自動モードなどのペルソナ固有の値だけをここで設定します。
- `skills`: 任意のエージェント別 Skills 許可リストです。省略すると、設定されている場合はエージェントが `agents.defaults.skills` を引き継ぎます。明示的なリストはデフォルトとマージせずに置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェント別デフォルト思考レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージ別またはセッション別の上書きが設定されていない場合、このエージェントの `agents.defaults.thinkingDefault` を上書きします。選択されたプロバイダー/モデルプロファイルが有効な値を制御します。Google Gemini では、`adaptive` によりプロバイダー所有の動的思考が維持されます（Gemini 3/3.1 では `thinkingLevel` を省略、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 任意のエージェント別デフォルト推論表示（`on | off | stream`）。メッセージ別またはセッション別の推論上書きが設定されていない場合、このエージェントの `agents.defaults.reasoningDefault` を上書きします。
- `fastModeDefault`: 任意のエージェント別ファストモードデフォルト（`true | false`）。メッセージ別またはセッション別のファストモード上書きが設定されていない場合に適用されます。
- `models`: 完全な `provider/model` ID をキーにした、任意のエージェント別モデルカタログ/ランタイム上書きです。エージェント別ランタイム例外には `models["provider/model"].agentRuntime` を使用します。
- `runtime`: 任意のエージェント別ランタイム記述子です。エージェントが ACP ハーネスセッションをデフォルトにする必要がある場合は、`runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）とともに `type: "acp"` を使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを派生します。`emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: 明示的な `sessions_spawn.agentId` ターゲットに対するエージェント ID の許可リスト（`["*"]` = 任意、デフォルト: 同じエージェントのみ）。自分自身を対象にした `agentId` 呼び出しを許可する必要がある場合は、リクエスター ID を含めます。
- サンドボックス継承ガード: リクエスターセッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略する `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制。デフォルト: false）。

---

## マルチエージェントルーティング

1 つの Gateway 内で、複数の分離されたエージェントを実行します。[Multi-Agent](/ja-JP/concepts/multi-agent) を参照してください。

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

- `type`（任意）: 通常のルーティングでは `route`（type 未指定時のデフォルトは route）、永続 ACP 会話バインディングでは `acp`。
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のアカウント。省略 = デフォルトアカウント）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。チャネル固有）
- `acp`（任意。`type: "acp"` の場合のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致、peer/guild/team なし）
5. `match.accountId: "*"`（チャネル全体）
6. デフォルトエージェント

各階層内では、最初に一致した `bindings` エントリーが優先されます。

`type: "acp"` エントリーの場合、OpenClaw は正確な会話 ID（`match.channel` + アカウント + `match.peer.id`）で解決し、上記のルートバインディング階層順序は使用しません。

### エージェント別アクセスプロファイル

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

優先順位の詳細については、[Multi-Agent サンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

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

- **`scope`**: グループチャットのコンテキストにおける基本セッションのグルーピング戦略。
  - `per-sender` (デフォルト): 各送信者は、チャンネルコンテキスト内で分離されたセッションを取得する。
  - `global`: チャンネルコンテキスト内のすべての参加者が単一セッションを共有する（共有コンテキストを意図する場合にのみ使用）。
- **`dmScope`**: DM のグルーピング方法。
  - `main`: すべての DM がメインセッションを共有する。
  - `per-peer`: チャンネルをまたいで送信者 ID ごとに分離する。
  - `per-channel-peer`: チャンネル + 送信者ごとに分離する（複数ユーザーの受信箱に推奨）。
  - `per-account-channel-peer`: アカウント + チャンネル + 送信者ごとに分離する（複数アカウントに推奨）。
- **`identityLinks`**: チャンネル横断のセッション共有のために、正規 ID をプロバイダー接頭辞付きピアにマッピングする。`/dock_discord` などのドックコマンドは同じマップを使用して、アクティブセッションの返信経路を別のリンク済みチャンネルピアへ切り替える。詳しくは [チャンネルのドッキング](/ja-JP/concepts/channel-docking) を参照。
- **`reset`**: 主要なリセットポリシー。`daily` は `atHour` のローカル時刻にリセットする。`idle` は `idleMinutes` 後にリセットする。両方を設定した場合は、先に期限切れになったほうが優先される。日次リセットの鮮度はセッション行の `sessionStartedAt` を使用する。アイドルリセットの鮮度は `lastInteractionAt` を使用する。Heartbeat、Cron のウェイクアップ、exec 通知、Gateway の管理処理などのバックグラウンド/システムイベント書き込みは `updatedAt` を更新できるが、日次/アイドルセッションを新鮮な状態には保たない。
- **`resetByType`**: 種類別の上書き (`direct`, `group`, `thread`)。レガシーの `dm` は `direct` のエイリアスとして受け付けられる。
- **`mainKey`**: レガシーフィールド。ランタイムはメインのダイレクトチャットバケットに常に `"main"` を使用する。
- **`agentToAgent.maxPingPongTurns`**: エージェント間交換中にエージェント間で返信を返し合う最大ターン数（整数、範囲: `0`-`20`、デフォルト: `5`）。`0` はピンポン連鎖を無効化する。
- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、レガシーの `dm` エイリアスあり)、`keyPrefix`、または `rawKeyPrefix` で照合する。最初の拒否が優先される。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを出力する。`enforce` はクリーンアップを適用する。
  - `pruneAfter`: 古いエントリの経過時間しきい値（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内の最大エントリ数（デフォルト `500`）。ランタイムは、本番規模の上限に対して小さな上限バッファ付きでバッチクリーンアップを書き込む。`openclaw sessions cleanup --enforce` は上限を即時適用する。
  - `rotateBytes`: 非推奨で無視される。`openclaw doctor --fix` は古い設定からこれを削除する。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter`。無効化するには `false` を設定する。
  - `maxDiskBytes`: 任意のセッションディレクトリのディスク予算。`warn` モードでは警告をログ出力する。`enforce` モードでは最も古いアーティファクト/セッションから削除する。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%`。
- **`threadBindings`**: スレッド紐づけセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ（プロバイダーは上書き可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時の自動フォーカス解除のデフォルト時間（`0` は無効化。プロバイダーは上書き可能）
  - `maxAgeHours`: デフォルトの厳格な最大経過時間（`0` は無効化。プロバイダーは上書き可能）
  - `spawnSessions`: `sessions_spawn` と ACP スレッド生成からスレッド紐づけ作業セッションを作成するためのデフォルトゲート。スレッド紐づけが有効な場合のデフォルトは `true`。プロバイダー/アカウントは上書き可能。
  - `defaultSpawnContext`: スレッド紐づけ生成のデフォルトのネイティブサブエージェントコンテキスト（`"fork"` または `"isolated"`）。デフォルトは `"fork"`。

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

### 応答接頭辞

チャンネル/アカウント別の上書き: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順序（より具体的なものが優先）: アカウント → チャンネル → グローバル。`""` は無効化し、カスケードを停止する。`"auto"` は `[{identity.name}]` を導出する。

**テンプレート変数:**

| 変数              | 説明                   | 例                          |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いモデル名           | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子     | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名         | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル       | `high`, `low`, `off`        |
| `{identity.name}` | エージェント識別名     | (`"auto"` と同じ)           |

変数は大文字小文字を区別しない。`{think}` は `{thinkingLevel}` のエイリアス。

### Ack リアクション

- デフォルトはアクティブエージェントの `identity.emoji`、それ以外は `"👀"`。無効化するには `""` を設定する。
- チャンネル別の上書き: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャンネル → `messages.ackReaction` → アイデンティティフォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram、WhatsApp、iMessage などのリアクション対応チャンネルで、返信後に Ack を削除する。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram でライフサイクルステータスリアクションを有効にする。
  Slack と Discord では、未設定の場合、Ack リアクションがアクティブなときにステータスリアクションは有効なままになる。
  Telegram では、ライフサイクルステータスリアクションを有効にするには明示的に `true` に設定する。

### 受信デバウンス

同じ送信者からの短時間のテキストのみのメッセージを単一のエージェントターンにまとめる。メディア/添付ファイルは即時フラッシュされる。制御コマンドはデバウンスを迂回する。

### TTS（テキスト読み上げ）

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

- `auto` はデフォルトの自動 TTS モードを制御する: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定を上書きでき、`/tts status` は有効な状態を表示する。
- `summaryModel` は自動要約用に `agents.defaults.model.primary` を上書きする。
- `modelOverrides` はデフォルトで有効。`modelOverrides.allowProvider` のデフォルトは `false`（オプトイン）。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` と `OPENAI_API_KEY` にフォールバックする。
- バンドルされた音声プロバイダーは Plugin が所有する。`plugins.allow` が設定されている場合は、使用したい各 TTS プロバイダー Plugin を含める。たとえば Edge TTS には `microsoft` を含める。レガシーの `edge` プロバイダー ID は `microsoft` のエイリアスとして受け付けられる。
- `providers.openai.baseUrl` は OpenAI TTS エンドポイントを上書きする。解決順序は設定、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1`。
- `providers.openai.baseUrl` が OpenAI 以外のエンドポイントを指す場合、OpenClaw はそれを OpenAI 互換 TTS サーバーとして扱い、モデル/音声の検証を緩和する。

---

## 会話

会話モード（macOS/iOS/Android）のデフォルト。

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
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- 複数の会話プロバイダーが設定されている場合、`talk.provider` は `talk.providers` 内のキーと一致する必要がある。
- レガシーのフラットな会話キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用。永続化された設定を `talk.providers.<provider>` に書き換えるには `openclaw doctor --fix` を実行する。
- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックする。
- `providers.*.apiKey` は平文文字列または SecretRef オブジェクトを受け付ける。
- `ELEVENLABS_API_KEY` フォールバックは、会話 API キーが設定されていない場合にのみ適用される。
- `providers.*.voiceAliases` により、会話ディレクティブでわかりやすい名前を使用できる。
- `providers.mlx.modelId` は、macOS のローカル MLX ヘルパーが使用する Hugging Face リポジトリを選択する。省略した場合、macOS は `mlx-community/Soprano-80M-bf16` を使用する。
- macOS MLX 再生は、存在する場合はバンドルされた `openclaw-mlx-tts` ヘルパーを通じて実行され、そうでなければ `PATH` 上の実行可能ファイルを通じて実行される。`OPENCLAW_MLX_TTS_BIN` は開発用にヘルパーパスを上書きする。
- `consultThinkingLevel` は、Control UI 会話リアルタイムの `openclaw_agent_consult` 呼び出しの背後で実行される完全な OpenClaw エージェント実行の思考レベルを制御する。通常のセッション/モデル動作を保持するには未設定のままにする。
- `consultFastMode` は、セッションの通常の高速モード設定を変更せずに、Control UI 会話リアルタイム相談に対して一回限りの高速モード上書きを設定する。
- `speechLocale` は、iOS/macOS 会話音声認識で使用される BCP 47 ロケール ID を設定する。デバイスのデフォルトを使用するには未設定のままにする。
- `silenceTimeoutMs` は、ユーザーの無音後に会話モードがトランスクリプトを送信するまで待機する時間を制御する。未設定の場合はプラットフォームのデフォルト一時停止時間（`macOS と Android では 700 ms、iOS では 900 ms`）を維持する。
- `realtime.instructions` は、プロバイダー向けのシステム指示を OpenClaw の組み込みリアルタイムプロンプトに追加するため、デフォルトの `openclaw_agent_consult` ガイダンスを失わずに音声スタイルを設定できる。

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他すべての設定キー
- [設定](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [設定例](/ja-JP/gateway/configuration-examples)
