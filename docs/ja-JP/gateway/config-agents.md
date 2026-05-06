---
read_when:
    - エージェントの既定値（モデル、思考、ワークスペース、Heartbeat、メディア、Skills）の調整
    - マルチエージェントのルーティングとバインディングの設定
    - セッション、メッセージ配信、トークモードの動作の調整
summary: エージェントのデフォルト、マルチエージェントルーティング、セッション、メッセージ、talk 設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-05-06T05:04:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b864cc3985db2f3ab2e82b18bcd1b1590a387d7474f5f0d0da3a1d36d9a276b9
    source_path: gateway/config-agents.md
    workflow: 16
---

エージェントスコープの設定キーは `agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、`talk.*` 配下にあります。チャンネル、ツール、Gateway ランタイム、その他の
トップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システムプロンプトの Runtime 行に表示される任意のリポジトリルートです。未設定の場合、OpenClaw はワークスペースから上方向にたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないエージェント向けの任意のデフォルト Skills 許可リストです。

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

必須のブートストラップファイルは引き続き書き込みながら、選択した任意のワークスペースファイルの作成をスキップします。有効な値: `SOUL.md`、`USER.md`、`HEARTBEAT.md`、`IDENTITY.md`。

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

ワークスペースのブートストラップファイルをいつシステムプロンプトへ注入するかを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（完了したアシスタント応答の後）では、ワークスペースブートストラップの再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と Compaction 後のリトライでは、引き続きコンテキストを再構築します。
- `"never"`: すべてのターンで、ワークスペースブートストラップとコンテキストファイルの注入を無効にします。これは、プロンプトのライフサイクルを完全に自前で管理するエージェント（カスタムコンテキストエンジン、独自のコンテキストを構築するネイティブランタイム、またはブートストラップ不要の特殊なワークフロー）にのみ使用してください。Heartbeat と Compaction リカバリのターンでも注入をスキップします。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り捨て前のワークスペースブートストラップファイルごとの最大文字数です。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペースブートストラップファイル全体で注入される最大合計文字数です。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップコンテキストが切り捨てられたときに、エージェントに表示されるシステムプロンプト通知を制御します。
デフォルト: `"once"`。

- `"off"`: 切り捨て通知テキストをシステムプロンプトへ注入しません。
- `"once"`: 一意の切り捨てシグネチャごとに、簡潔な通知を 1 回注入します（推奨）。
- `"always"`: 切り捨てが存在する場合、実行のたびに簡潔な通知を注入します。

詳細な raw/注入済みカウントと設定チューニングフィールドは、コンテキスト/ステータスレポートやログなどの診断に残ります。通常の WebChat ユーザー/ランタイムコンテキストには、簡潔な復旧通知だけが渡されます。

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
  最近の日次 `memory/*.md` ファイルを含む、1 回限りのリセット/起動モデル実行プレリュード。素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずに受理されます。
- `skills.limits.*`:
  システムプロンプトへ注入されるコンパクトな Skills リスト。
- `agents.defaults.contextLimits.*`:
  境界付きランタイム抜粋と、注入されるランタイム所有ブロック。
- `memory.qmd.limits.*`:
  インデックス化されたメモリ検索スニペットと注入サイズ。

あるエージェントだけが異なる予算を必要とする場合にのみ、対応するエージェントごとのオーバーライドを使用してください。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

リセット/起動モデル実行時の最初のターンに注入される起動プレリュードを制御します。
素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずにリセットを受理するため、このプレリュードを読み込みません。

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

境界付きランタイムコンテキスト面の共有デフォルトです。

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

- `memoryGetMaxChars`: 切り捨てメタデータと継続通知が追加される前の、デフォルトの `memory_get` 抜粋上限です。
- `memoryGetDefaultLines`: `lines` が省略されたときの、デフォルトの `memory_get` 行ウィンドウです。
- `toolResultMaxChars`: 永続化された結果とオーバーフロー復旧に使用されるライブツール結果の上限です。
- `postCompactionMaxChars`: Compaction 後の更新注入中に使用される AGENTS.md 抜粋上限です。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブのエージェントごとのオーバーライドです。省略されたフィールドは `agents.defaults.contextLimits` から継承されます。

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

システムプロンプトへ注入されるコンパクトな Skills リストのグローバル上限です。これはオンデマンドで `SKILL.md` ファイルを読むことには影響しません。

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

Skills プロンプト予算のエージェントごとのオーバーライドです。

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

プロバイダー呼び出し前に、トランスクリプト/ツール画像ブロック内の画像の最長辺に適用される最大ピクセルサイズです。
デフォルト: `1200`。

値を小さくすると、通常、スクリーンショットの多い実行でビジョントークン使用量とリクエストペイロードサイズが減ります。
値を大きくすると、より多くの視覚的詳細が保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキスト用のタイムゾーンです（メッセージのタイムスタンプではありません）。ホストのタイムゾーンへフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプト内の時刻形式です。デフォルト: `auto`（OS 設定）。

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
      },
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 文字列形式はプライマリモデルのみを設定します。
  - オブジェクト形式はプライマリと、順序付きフェイルオーバーモデルを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `image` ツールパスで視覚モデル設定として使用されます。
  - 選択済みまたはデフォルトのモデルが画像入力を受け付けられない場合のフォールバックルーティングにも使用されます。
  - 明示的な `provider/model` 参照を推奨します。裸の ID は互換性のために受け付けられます。裸の ID が `models.providers.*.models` 内で設定済みの画像対応エントリに一意に一致する場合、OpenClaw はそのプロバイダーに修飾します。設定済みの一致が曖昧な場合は、明示的なプロバイダープレフィックスが必要です。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の画像生成機能と、画像を生成する将来のツール/Plugin サーフェスで使用されます。
  - 典型的な値: ネイティブ Gemini 画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-2`、透明背景の OpenAI PNG/WebP 出力には `openai/gpt-image-1.5`。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証も設定してください（例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` / `openai/gpt-image-1.5` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み画像生成プロバイダーをプロバイダー ID 順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の音楽生成機能と組み込みの `music_generate` ツールで使用されます。
  - 典型的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み音楽生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の動画生成機能と組み込みの `video_generate` ツールで使用されます。
  - 典型的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み動画生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
  - バンドルされた Qwen 動画生成プロバイダーは、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、プロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - モデルルーティングのために `pdf` ツールで使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルト PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮されるデフォルト最大ページ数。
- `verboseDefault`: エージェントのデフォルト詳細レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `toolProgressDetail`: `/verbose` ツール要約と進行状況ドラフトのツール行の詳細モード。値: `"explain"`（デフォルト、簡潔な人間向けラベル）または `"raw"`（利用可能な場合は生のコマンド/詳細を追加）。エージェントごとの `agents.list[].toolProgressDetail` はこのデフォルトを上書きします。
- `reasoningDefault`: エージェントのデフォルト推論表示。値: `"off"`、`"on"`、`"stream"`。エージェントごとの `agents.list[].reasoningDefault` はこのデフォルトを上書きします。設定された推論デフォルトは、メッセージ単位またはセッションの推論上書きが設定されていない場合にのみ、所有者、認可済み送信者、または operator-admin Gateway コンテキストに適用されます。
- `elevatedDefault`: エージェントのデフォルト昇格出力レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: API キーアクセスには `openai/gpt-5.5`、Codex OAuth には `openai-codex/gpt-5.5`）。プロバイダーを省略すると、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一意に一致する設定済みプロバイダーを試し、その後にのみ設定済みのデフォルトプロバイダーへフォールバックします（非推奨の互換動作のため、明示的な `provider/model` を推奨します）。そのプロバイダーが設定済みのデフォルトモデルをもう公開していない場合、OpenClaw は古い削除済みプロバイダーデフォルトを表示する代わりに、最初に設定されたプロバイダー/モデルへフォールバックします。
- `models`: `/model` のための設定済みモデルカタログと許可リスト。各エントリには `alias`（ショートカット）と `params`（プロバイダー固有、例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`）を含めることができます。
  - 安全な編集: エントリを追加するには `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。`config set` は、`--replace` を渡さない限り、既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダースコープの設定/オンボーディングフローは、選択されたプロバイダーモデルをこのマップにマージし、すでに設定されている無関係なプロバイダーを保持します。
  - 直接の OpenAI Responses モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management` の注入を止めるには `params.responsesServerCompaction: false` を使用し、しきい値を上書きするには `params.responsesCompactThreshold` を使用します。[OpenAI サーバー側 Compaction](/ja-JP/providers/openai#server-side-compaction-responses-api)を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルトプロバイダーパラメーター。`agents.defaults.params` に設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）は `agents.defaults.models["provider/model"].params`（モデルごと）によって上書きされ、その後 `agents.list[].params`（一致するエージェント ID）がキーごとに上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシ向けに `api: "openai-completions"` リクエスト本文へマージされる高度なパススルー JSON。生成されたリクエストキーと衝突した場合は追加本文が優先されます。非ネイティブの completions ルートでは、その後も OpenAI 専用の `store` が取り除かれます。
- `params.chat_template_kwargs`: `api: "openai-completions"` リクエスト本文のトップレベルへマージされる vLLM/OpenAI 互換チャットテンプレート引数。思考がオフの `vllm/nemotron-3-*` では、バンドルされた vLLM Plugin が自動的に `enable_thinking: false` と `force_nonempty_content: true` を送信します。明示的な `chat_template_kwargs` は生成されたデフォルトを上書きし、`extra_body.chat_template_kwargs` がなお最終優先されます。vLLM Qwen の思考制御では、そのモデルエントリで `params.qwenThinkingFormat` を `"chat-template"` または `"top-level"` に設定します。
- `compat.supportedReasoningEfforts`: モデルごとの OpenAI 互換推論エフォートリスト。実際に受け付けるカスタムエンドポイントには `"xhigh"` を含めてください。すると OpenClaw は、その設定済みプロバイダー/モデルに対して、コマンドメニュー、Gateway セッション行、セッションパッチ検証、エージェント CLI 検証、`llm-task` 検証で `/think xhigh` を公開します。バックエンドが正規レベルに対してプロバイダー固有の値を求める場合は、`compat.reasoningEffortMap` を使用します。
- `params.preserveThinking`: 保存された思考のための Z.AI 専用オプトイン。有効で思考がオンの場合、OpenClaw は `thinking.clear_thinking: false` を送信し、以前の `reasoning_content` を再生します。[Z.AI の思考と保存された思考](/ja-JP/providers/zai#thinking-and-preserved-thinking)を参照してください。
- `agentRuntime`: デフォルトの低レベルエージェントランタイムポリシー。ID を省略するとデフォルトは OpenClaw Pi になります。組み込みの PI ハーネスを強制するには `id: "pi"`、登録済み Plugin ハーネスにサポート対象モデルを要求させ、一致がない場合は PI を使用するには `id: "auto"`、そのハーネスを必須にするには `id: "codex"` などの登録済みハーネス ID、または `id: "claude-cli"` などのサポート対象 CLI バックエンドエイリアスを使用します。明示的な Plugin ランタイムは、ハーネスが利用不可または失敗した場合にクローズドに失敗します。モデル参照は `provider/model` として正規形式に保ち、レガシーなランタイムプロバイダープレフィックスの代わりに、ランタイム設定で Codex、Claude CLI、Gemini CLI、その他の実行バックエンドを選択してください。これがプロバイダー/モデル選択とどう異なるかは、[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を参照してください。
- これらのフィールドを変更する設定書き込み機能（例: `/models set`、`/models set-image`、フォールバック追加/削除コマンド）は、正規のオブジェクト形式を保存し、可能な場合は既存のフォールバックリストを保持します。
- `maxConcurrent`: セッション全体での最大並列エージェント実行数（各セッションは引き続き直列化されます）。デフォルト: 4。

### `agents.defaults.agentRuntime`

`agentRuntime` は、どの低レベル実行器がエージェントターンを実行するかを制御します。ほとんどのデプロイでは、デフォルトの OpenClaw Pi ランタイムを維持するべきです。バンドルされた Codex アプリサーバーハーネスなど、信頼済み Plugin がネイティブハーネスを提供する場合や、Claude CLI などのサポート対象 CLI バックエンドを使いたい場合に使用します。メンタルモデルについては、[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を参照してください。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`、`"pi"`、登録済み Plugin ハーネス ID、またはサポート対象 CLI バックエンドエイリアス。バンドルされた Codex Plugin は `codex` を登録します。バンドルされた Anthropic Plugin は `claude-cli` CLI バックエンドを提供します。
- `id: "auto"` は、登録済み Plugin ハーネスにサポート対象ターンを要求させ、一致するハーネスがない場合は PI を使用します。`id: "codex"` などの明示的な Plugin ランタイムは、そのハーネスを必須にし、利用不可または失敗した場合にクローズドに失敗します。
- 環境による上書き: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は、そのプロセスの `id` を上書きします。
- Codex のみのデプロイでは、`model: "openai/gpt-5.5"` と `agentRuntime.id: "codex"` を設定します。
- Claude CLI デプロイでは、`model: "anthropic/claude-opus-4-7"` と `agentRuntime.id: "claude-cli"` の組み合わせを推奨します。レガシーな `claude-cli/claude-opus-4-7` モデル参照は互換性のために引き続き機能しますが、新しい設定ではプロバイダー/モデル選択を正規形式に保ち、実行バックエンドを `agentRuntime.id` に置くべきです。
- 古いランタイムポリシーキーは `openclaw doctor --fix` によって `agentRuntime` に書き換えられます。
- ハーネス選択は、最初の埋め込み実行後にセッション ID ごとに固定されます。設定/環境の変更は新しいセッションまたはリセットされたセッションに影響し、既存のトランスクリプトには影響しません。トランスクリプト履歴があるものの記録済みの固定がないレガシーセッションは、PI 固定として扱われます。`/status` は有効なランタイムを報告します。例: `Runtime: OpenClaw Pi Default` または `Runtime: OpenAI Codex`。
- これはテキストのエージェントターン実行のみを制御します。メディア生成、視覚、PDF、音楽、動画、TTS は引き続きそれぞれのプロバイダー/モデル設定を使用します。

**組み込みエイリアス短縮形**（モデルが `agents.defaults.models` 内にある場合にのみ適用）:

| エイリアス          | モデル                                     |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

設定済みのエイリアスは常にデフォルトより優先されます。

Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、thinking mode を自動的に有効にします。
Z.AI モデルは、tool call streaming のためにデフォルトで `tool_stream` を有効にします。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的な thinking level が設定されていない場合、デフォルトで `adaptive` thinking になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用の任意の CLI バックエンドです（tool call なし）。API プロバイダーが失敗した場合のバックアップとして便利です。

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

- CLI バックエンドはテキスト優先です。tools は常に無効です。
- `sessionArg` が設定されている場合、Sessions がサポートされます。
- `imageArg` がファイルパスを受け付ける場合、画像のパススルーがサポートされます。

### `agents.defaults.systemPromptOverride`

OpenClaw が組み立てた system prompt 全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）または agent ごと（`agents.list[].systemPromptOverride`）に設定します。agent ごとの値が優先されます。空または空白のみの値は無視されます。制御された prompt 実験に便利です。

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

モデルファミリー別に適用される、プロバイダー非依存の prompt overlays です。GPT-5 ファミリーのモデル ID は、プロバイダー間で共有される behavior contract を受け取ります。`personality` は、親しみやすい interaction-style レイヤーのみを制御します。

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

- `"friendly"`（デフォルト）と `"on"` は、親しみやすい interaction-style レイヤーを有効にします。
- `"off"` は親しみやすいレイヤーのみを無効にします。タグ付けされた GPT-5 behavior contract は有効なままです。
- 共有設定が未設定の場合、従来の `plugins.entries.openai.config.personality` も引き続き読み取られます。

### `agents.defaults.heartbeat`

定期的な Heartbeat 実行です。

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

- `every`: duration 文字列（ms/s/m/h）。デフォルト: `30m`（API キー認証）または `1h`（OAuth 認証）。無効にするには `0m` に設定します。
- `includeSystemPromptSection`: false の場合、system prompt から Heartbeat セクションを省略し、bootstrap context への `HEARTBEAT.md` 注入をスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中の tool error warning payload を抑制します。
- `timeoutSeconds`: Heartbeat agent turn が中止されるまでに許可される最大秒数。未設定のままにすると `agents.defaults.timeoutSeconds` を使用します。
- `directPolicy`: direct/DM 配信ポリシー。`allow`（デフォルト）は direct-target delivery を許可します。`block` は direct-target delivery を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat 実行は lightweight bootstrap context を使用し、workspace bootstrap files から `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は以前の conversation history なしの新しい session で実行されます。cron `sessionTarget: "isolated"` と同じ isolation pattern です。Heartbeat ごとの token cost を約 100K から約 2〜5K tokens に削減します。
- `skipWhenBusy`: true の場合、Heartbeat 実行は追加の busy lane（subagent または nested command work）でも延期されます。Cron lanes は、このフラグがなくても常に Heartbeat を延期します。
- agent ごと: `agents.list[].heartbeat` を設定します。いずれかの agent が `heartbeat` を定義している場合、Heartbeat を実行するのは**それらの agent のみ**です。
- Heartbeat は完全な agent turn を実行します。間隔が短いほど、より多くの tokens を消費します。

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

- `mode`: `default` または `safeguard`（長い履歴向けの chunked summarization）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済み Compaction provider Plugin の ID。設定すると、組み込みの LLM summarization の代わりにプロバイダーの `summarize()` が呼び出されます。失敗時は組み込みにフォールバックします。プロバイダーを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: 単一の Compaction 操作に許可される最大秒数。この時間を超えると OpenClaw は中止します。デフォルト: `900`。
- `keepRecentTokens`: 最新の transcript tail をそのまま保持するための Pi cut-point budget。手動の `/compact` は、明示的に設定されている場合にこれを尊重します。それ以外の場合、手動 Compaction は hard checkpoint です。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction summarization 中に組み込みの opaque identifier retention guidance を前置します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用される、任意の custom identifier-preservation text。
- `qualityGuard`: safeguard summaries 向けの retry-on-malformed-output checks。safeguard mode ではデフォルトで有効です。audit をスキップするには `enabled: false` を設定します。
- `midTurnPrecheck`: 任意の Pi tool-loop pressure check。`enabled: true` の場合、OpenClaw は tool results が追加された後、次の model call の前に context pressure を確認します。context が収まらなくなった場合、prompt を送信する前に現在の試行を中止し、既存の precheck recovery path を再利用して tool results を truncate するか、Compact して再試行します。`default` と `safeguard` の両方の Compaction mode で動作します。デフォルト: 無効。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名です。デフォルトは `["Session Startup", "Red Lines"]` です。再注入を無効にするには `[]` を設定します。未設定またはそのデフォルトの組みに明示的に設定されている場合、古い `Every Session`/`Safety` 見出しも legacy fallback として受け付けます。
- `model`: Compaction summarization のみに使う任意の `provider/model-id` override。main session は 1 つのモデルを維持しつつ、Compaction summaries は別のモデルで実行したい場合に使用します。未設定の場合、Compaction は session の primary model を使用します。
- `maxActiveTranscriptBytes`: active JSONL が閾値を超えて増えた場合に実行前の通常の local Compaction をトリガーする、任意の byte threshold（`number` または `"20mb"` のような文字列）。Compaction が成功したら、より小さい successor transcript に rotate できるように `truncateAfterCompaction` が必要です。未設定または `0` の場合は無効です。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時に短い通知をユーザーへ送信します（例: 「Compacting context...」および「Compaction complete」）。Compaction をサイレントに保つため、デフォルトでは無効です。
- `memoryFlush`: auto-compaction の前に durable memories を保存するための silent agentic turn です。この housekeeping turn をローカルモデルに留めたい場合は、`model` を `ollama/qwen3:8b` のような正確な provider/model に設定します。この override は active session fallback chain を継承しません。workspace が read-only の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、in-memory context から**古い tool results**を prune します。ディスク上の session history は変更**しません**。

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

- `mode: "cache-ttl"` は pruning pass を有効にします。
- `ttl` は、pruning を再実行できる頻度を制御します（最後の cache touch 後）。
- Pruning はまず過大な tool results を soft-trim し、必要に応じて古い tool results を hard-clear します。

**Soft-trim** は先頭と末尾を保持し、中央に `...` を挿入します。

**Hard-clear** は tool result 全体を placeholder に置き換えます。

注記:

- Image blocks は trim/clear されません。
- 比率は文字ベース（概算）であり、正確な token 数ではありません。
- `keepLastAssistants` より少ない assistant messages しか存在しない場合、pruning はスキップされます。

</Accordion>

動作の詳細は [Session Pruning](/ja-JP/concepts/session-pruning) を参照してください。

### Block streaming

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

- Telegram 以外の channels では、block replies を有効にするために明示的な `*.blockStreaming: true` が必要です。
- Channel overrides: `channels.<channel>.blockStreamingCoalesce`（および account ごとの variant）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: block replies 間のランダムな一時停止。`natural` = 800〜2500ms。agent ごとの override: `agents.list[].humanDelay`。

動作と chunking の詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

### Typing indicators

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

- デフォルト: 直接チャット/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- セッション単位のオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[入力インジケーター](/ja-JP/concepts/typing-indicators)を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

組み込みエージェント向けの任意のサンドボックス化。完全なガイドは[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

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
- `ssh`: 汎用の SSH ベースのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` が選択されている場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープ単位のワークスペースに使われる絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: 実行時に OpenClaw が一時ファイルとして具現化するインラインコンテンツまたは SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH ホストキー ポリシーの調整項目

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先されます
- `certificateData` は `certificateFile` より優先されます
- `knownHostsData` は `knownHostsFile` より優先されます
- SecretRef ベースの `*Data` 値は、サンドボックスセッションの開始前に、アクティブなシークレットランタイムスナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成の後にリモートワークスペースを一度シードします
- その後はリモート SSH ワークスペースを正とします
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングします
- リモート変更をホストへ自動的には同期しません
- サンドボックスブラウザーコンテナはサポートしません

**ワークスペースアクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープ単位サンドボックスワークスペース
- `ro`: `/workspace` のサンドボックスワークスペース、`/agent` に読み取り専用でマウントされたエージェントワークスペース
- `rw`: `/workspace` に読み書き可能でマウントされたエージェントワークスペース

**スコープ:**

- `session`: セッション単位のコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース（デフォルト）
- `shared`: 共有コンテナおよびワークスペース（セッション間の分離なし）

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

- `mirror`: exec の前にローカルからリモートへシードし、exec の後に同期して戻します。ローカルワークスペースを正とします
- `remote`: サンドボックス作成時にリモートを一度シードし、その後はリモートワークスペースを正とします

`remote` モードでは、OpenClaw の外部で行われたホストローカルの編集は、シード手順の後にサンドボックスへ自動的には同期されません。
転送は OpenShell サンドボックスへの SSH ですが、サンドボックスのライフサイクルと任意のミラー同期は Plugin が所有します。

**`setupCommand`** はコンテナ作成後に一度実行されます（`sh -lc` 経由）。ネットワーク送信、書き込み可能な root、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントが外向きアクセスを必要とする場合は `"bridge"`（またはカスタムブリッジネットワーク）に設定してください。
`"host"` はブロックされます。`"container:<id>"` は、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急時用）を設定しない限り、デフォルトでブロックされます。

**受信添付ファイル** はアクティブなワークスペース内の `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルのバインドとエージェント単位のバインドはマージされます。

**サンドボックス化されたブラウザー**（`sandbox.browser.enabled`）: コンテナ内の Chromium + CDP。noVNC URL がシステムプロンプトに注入されます。`openclaw.json` の `browser.enabled` は不要です。
noVNC オブザーバーアクセスはデフォルトで VNC 認証を使い、OpenClaw は共有 URL にパスワードを公開する代わりに、短命のトークン URL を発行します。

- `allowHostControl: false`（デフォルト）は、サンドボックス化されたセッションがホストブラウザーを対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用ブリッジネットワーク）です。グローバルブリッジ接続を明示的に求める場合にのみ `bridge` に設定してください。
- `cdpSourceRange` は任意で、コンテナ境界での CDP 受信を CIDR 範囲（例: `172.21.0.1/32`）に制限します。
- `sandbox.browser.binds` は追加のホストディレクトリをサンドボックスブラウザーコンテナにのみマウントします。設定した場合（`[]` を含む）、ブラウザーコンテナについては `docker.binds` を置き換えます。
- 起動時のデフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナホスト向けに調整されています:
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
    デフォルトで有効になっており、WebGL/3D の使用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローが拡張機能に
    依存している場合に拡張機能を再度有効にします。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    デフォルトのプロセス制限を使うには `0` を設定します。
  - `noSandbox` が有効な場合は、加えて `--no-sandbox`。
  - デフォルトはコンテナイメージのベースラインです。コンテナのデフォルトを変更するには、カスタム
    エントリーポイントを含むカスタムブラウザーイメージを使ってください。

</Accordion>

ブラウザーのサンドボックス化と `sandbox.docker.binds` は Docker 専用です。

イメージをビルドする（ソースチェックアウトから）:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

ソースチェックアウトなしの npm インストールでは、インラインの `docker build` コマンドについて[サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup)を参照してください。

### `agents.list`（エージェント単位のオーバーライド）

`agents.list[].tts` を使って、エージェントに専用の TTS プロバイダー、音声、モデル、
スタイル、または自動 TTS モードを与えます。エージェントブロックはグローバルの
`messages.tts` の上にディープマージされるため、共有認証情報を 1 か所に置いたまま、個々の
エージェントは必要な音声またはプロバイダーフィールドだけをオーバーライドできます。アクティブなエージェントの
オーバーライドは、自動音声返信、`/tts audio`、`/tts status`、および
`tts` エージェントツールに適用されます。プロバイダー例と優先順位については
[テキスト読み上げ](/ja-JP/tools/tts#per-agent-voice-overrides)を参照してください。

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
        agentRuntime: { id: "auto" },
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

- `id`: 安定したエージェント id（必須）。
- `default`: 複数設定されている場合は、最初のものが優先されます（警告がログに記録されます）。何も設定されていない場合は、リストの最初の項目がデフォルトになります。
- `model`: 文字列形式では、モデルフォールバックのない厳格なエージェント別プライマリを設定します。オブジェクト形式 `{ primary }` も、`fallbacks` を追加しない限り厳格です。そのエージェントでフォールバックを有効にするには `{ primary, fallbacks: [...] }` を使い、厳格な動作を明示するには `{ primary, fallbacks: [] }` を使います。`primary` だけをオーバーライドする Cron ジョブは、`fallbacks: []` を設定しない限りデフォルトのフォールバックを引き継ぎます。
- `params`: `agents.defaults.models` で選択されたモデル項目にマージされる、エージェント別のストリームパラメータ。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有のオーバーライドに使います。
- `tts`: 省略可能なエージェント別のテキスト読み上げオーバーライド。このブロックは `messages.tts` にディープマージされるため、共有プロバイダー認証情報とフォールバックポリシーは `messages.tts` に置き、プロバイダー、音声、モデル、スタイル、自動モードなど、ペルソナ固有の値だけをここで設定します。
- `skills`: 省略可能なエージェント別 Skills 許可リスト。省略した場合、設定されていればエージェントは `agents.defaults.skills` を継承します。明示的なリストはデフォルトとマージせずに置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 省略可能なエージェント別のデフォルト思考レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージ別またはセッション別のオーバーライドが設定されていない場合、このエージェントの `agents.defaults.thinkingDefault` をオーバーライドします。選択されたプロバイダー/モデルプロファイルが有効な値を制御します。Google Gemini では、`adaptive` によりプロバイダー所有の動的思考が維持されます（Gemini 3/3.1 では `thinkingLevel` は省略、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 省略可能なエージェント別のデフォルト推論表示（`on | off | stream`）。メッセージ別またはセッション別の推論オーバーライドが設定されていない場合、このエージェントの `agents.defaults.reasoningDefault` をオーバーライドします。
- `fastModeDefault`: 省略可能なエージェント別の高速モードのデフォルト（`true | false`）。メッセージ別またはセッション別の高速モードオーバーライドが設定されていない場合に適用されます。
- `agentRuntime`: 省略可能なエージェント別の低レベルランタイムポリシーオーバーライド。`auto` モードで他のエージェントがデフォルトの PI フォールバックを維持する一方、1 つのエージェントだけを Codex 専用にするには `{ id: "codex" }` を使います。
- `runtime`: 省略可能なエージェント別ランタイム記述子。エージェントがデフォルトで ACP ハーネスセッションを使うべき場合は、`runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）とともに `type: "acp"` を使います。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します。`ackReaction` は `emoji` から、`mentionPatterns` は `name`/`emoji` から導出されます。
- `subagents.allowAgents`: 明示的な `sessions_spawn.agentId` ターゲットに対するエージェント id の許可リスト（`["*"]` = 任意、デフォルト: 同じエージェントのみ）。自己ターゲットの `agentId` 呼び出しを許可する必要がある場合は、リクエスター id を含めます。
- サンドボックス継承ガード: リクエスターセッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス外で実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します。デフォルト: false）。

---

## マルチエージェントルーティング

1 つの Gateway 内で複数の分離されたエージェントを実行します。詳しくは[マルチエージェント](/ja-JP/concepts/multi-agent)を参照してください。

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

- `type`（省略可）: 通常のルーティングには `route`（type がない場合のデフォルトは route）、永続 ACP 会話バインディングには `acp`。
- `match.channel`（必須）
- `match.accountId`（省略可。`*` = 任意のアカウント、省略 = デフォルトアカウント）
- `match.peer`（省略可。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（省略可。チャネル固有）
- `acp`（省略可。`type: "acp"` の場合のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致、peer/guild/team なし）
5. `match.accountId: "*"`（チャネル全体）
6. デフォルトエージェント

各階層内では、最初に一致した `bindings` 項目が優先されます。

`type: "acp"` 項目では、OpenClaw は完全な会話 ID（`match.channel` + account + `match.peer.id`）で解決し、上記のルートバインディング階層順序は使いません。

### エージェント別アクセルプロファイル

<Accordion title="Full access (no sandbox)">

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

<Accordion title="Read-only tools + workspace">

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

<Accordion title="No filesystem access (messaging only)">

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

優先順位の詳細は[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

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

<Accordion title="Session field details">

- **`scope`**: グループチャットコンテキストでの基本セッショングループ化戦略。
  - `per-sender`（デフォルト）: 各送信者はチャンネルコンテキスト内で分離されたセッションを持ちます。
  - `global`: チャンネルコンテキスト内のすべての参加者が単一のセッションを共有します（共有コンテキストを意図している場合のみ使用）。
- **`dmScope`**: DM をグループ化する方法。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャンネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャンネル + 送信者ごとに分離します（複数ユーザーの受信箱に推奨）。
  - `per-account-channel-peer`: アカウント + チャンネル + 送信者ごとに分離します（複数アカウントに推奨）。
- **`identityLinks`**: クロスチャンネルのセッション共有のために、正規 ID をプロバイダー接頭辞付きピアへ対応付けます。`/dock_discord` などの Dock コマンドは、同じマップを使用してアクティブセッションの返信ルートを別のリンク済みチャンネルピアへ切り替えます。[チャンネルドッキング](/ja-JP/concepts/channel-docking)を参照してください。
- **`reset`**: 主要なリセットポリシー。`daily` はローカル時刻の `atHour` にリセットします。`idle` は `idleMinutes` 後にリセットします。両方が設定されている場合、先に期限切れになったほうが優先されます。日次リセットの鮮度はセッション行の `sessionStartedAt` を使用します。アイドルリセットの鮮度は `lastInteractionAt` を使用します。Heartbeat、Cron のウェイクアップ、exec 通知、Gateway の記録管理などのバックグラウンド/システムイベントの書き込みは `updatedAt` を更新することがありますが、日次/アイドルセッションを新鮮な状態には保ちません。
- **`resetByType`**: タイプごとの上書き（`direct`、`group`、`thread`）。レガシーの `dm` は `direct` のエイリアスとして受け入れられます。
- **`mainKey`**: レガシーフィールド。ランタイムはメインの直接チャットバケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: エージェント間のやり取り中に、エージェント間で返信し返す最大ターン数（整数、範囲: `0`–`5`）。`0` はピンポン連鎖を無効にします。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、レガシー `dm` エイリアスあり）、`keyPrefix`、または `rawKeyPrefix` で照合します。最初の deny が優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを出力します。`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの年齢カットオフ（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内のエントリ最大数（デフォルト `500`）。ランタイムは、本番サイズの上限に対して小さな高水位バッファ付きでバッチクリーンアップを書き込みます。`openclaw sessions cleanup --enforce` は上限を即時適用します。
  - `rotateBytes`: 非推奨で無視されます。`openclaw doctor --fix` は古い設定からこれを削除します。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter` です。無効にするには `false` を設定します。
  - `maxDiskBytes`: 任意のセッションディレクトリのディスク予算。`warn` モードでは警告をログに記録します。`enforce` モードでは、最も古いアーティファクト/セッションから削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッド紐付けセッション機能のグローバルデフォルト。
  - `enabled`: マスターのデフォルトスイッチ（プロバイダーで上書き可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時の自動フォーカス解除のデフォルト時間数（`0` は無効。プロバイダーで上書き可能）
  - `maxAgeHours`: 強制的な最大存続期間のデフォルト時間数（`0` は無効。プロバイダーで上書き可能）
  - `spawnSessions`: `sessions_spawn` と ACP スレッドスポーンからスレッド紐付け作業セッションを作成するためのデフォルトゲート。スレッド紐付けが有効な場合、デフォルトは `true` です。プロバイダー/アカウントで上書き可能です。
  - `defaultSpawnContext`: スレッド紐付けスポーンのデフォルトのネイティブサブエージェントコンテキスト（`"fork"` または `"isolated"`）。デフォルトは `"fork"` です。

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

チャンネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

解決順序（最も具体的なものが優先）: アカウント → チャンネル → グローバル。`""` は無効化し、カスケードを停止します。`"auto"` は `[{identity.name}]` から導出します。

**テンプレート変数:**

| 変数              | 説明                   | 例                          |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いモデル名           | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子     | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名         | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル       | `high`, `low`, `off`        |
| `{identity.name}` | エージェント ID 名     | (`"auto"` と同じ)           |

変数は大文字と小文字を区別しません。`{think}` は `{thinkingLevel}` のエイリアスです。

### Ack リアクション

- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外は `"👀"` です。無効にするには `""` を設定します。
- チャンネルごとのオーバーライド: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャンネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram、WhatsApp、BlueBubbles などリアクション対応チャンネルで、返信後に Ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram でライフサイクルステータスリアクションを有効にします。
  Slack と Discord では、未設定の場合、Ack リアクションがアクティブなときにステータスリアクションを有効のままにします。
  Telegram では、ライフサイクルステータスリアクションを有効にするには明示的に `true` に設定します。

### 受信デバウンス

同じ送信者からの短時間のテキストのみのメッセージを、1 つのエージェントターンにまとめます。メディア/添付ファイルは即座にフラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS（音声合成）

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

- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定をオーバーライドでき、`/tts status` は有効な状態を表示します。
- `summaryModel` は自動要約用の `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（オプトイン）です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` と `OPENAI_API_KEY` にフォールバックします。
- バンドルされた音声プロバイダーは Plugin が所有します。`plugins.allow` が設定されている場合は、使用する各 TTS プロバイダー Plugin を含めます。たとえば Edge TTS には `microsoft` を含めます。レガシーな `edge` プロバイダー ID は `microsoft` のエイリアスとして受け付けられます。
- `providers.openai.baseUrl` は OpenAI TTS エンドポイントをオーバーライドします。解決順序は、設定、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `providers.openai.baseUrl` が OpenAI 以外のエンドポイントを指す場合、OpenClaw はそれを OpenAI 互換 TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## Talk

Talk モード（macOS/iOS/Android）のデフォルト。

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- 複数の Talk プロバイダーが設定されている場合、`talk.provider` は `talk.providers` 内のキーと一致する必要があります。
- レガシーなフラット Talk キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用であり、`talk.providers.<provider>` に自動移行されます。
- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` はプレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk ディレクティブでわかりやすい名前を使用できます。
- `providers.mlx.modelId` は macOS local MLX ヘルパーで使用される Hugging Face リポジトリを選択します。省略した場合、macOS は `mlx-community/Soprano-80M-bf16` を使用します。
- macOS MLX 再生は、存在する場合はバンドルされた `openclaw-mlx-tts` ヘルパーを通じて、または `PATH` 上の実行ファイルを通じて実行されます。`OPENCLAW_MLX_TTS_BIN` は開発用にヘルパーパスをオーバーライドします。
- `speechLocale` は iOS/macOS Talk 音声認識で使用される BCP 47 ロケール ID を設定します。デバイスのデフォルトを使用するには未設定のままにします。
- `silenceTimeoutMs` は、ユーザーの無音後に Talk モードが文字起こしを送信するまで待機する時間を制御します。未設定の場合、プラットフォームのデフォルト一時停止時間（`macOS と Android では 700 ms、iOS では 900 ms`）を維持します。

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他すべての設定キー
- [設定](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [設定例](/ja-JP/gateway/configuration-examples)
