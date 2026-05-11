---
read_when:
    - エージェントのデフォルト設定の調整（モデル、思考、ワークスペース、Heartbeat、メディア、Skills）
    - マルチエージェントのルーティングとバインディングの設定
    - セッション、メッセージ配信、トークモードの動作を調整する
summary: エージェントのデフォルト、マルチエージェントルーティング、セッション、メッセージ、talk 設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-05-11T20:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbc8f9ff61cb1780dc038c71e3b2f2dd2d5d9fe6582ddf76d44a7dba21d13908
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、`talk.*` 配下のエージェントスコープの設定キー。チャンネル、ツール、Gateway ランタイム、その他のトップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システムプロンプトの Runtime 行に表示される任意のリポジトリルート。未設定の場合、OpenClaw はワークスペースから上方向にたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないエージェント向けの任意のデフォルトスキル許可リスト。

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

- デフォルトで Skills を無制限にするには、`agents.defaults.skills` を省略します。
- デフォルトを継承するには、`agents.list[].skills` を省略します。
- Skills なしにするには、`agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストは、そのエージェントの最終セットです。デフォルトとはマージされません。

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

ワークスペースのブートストラップファイルをシステムプロンプトに注入するタイミングを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（完了したアシスタント応答の後）では、ワークスペースのブートストラップ再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と Compaction 後の再試行では、引き続きコンテキストが再構築されます。
- `"never"`: すべてのターンでワークスペースのブートストラップとコンテキストファイルの注入を無効にします。これは、自分のプロンプトライフサイクルを完全に所有するエージェント（カスタムコンテキストエンジン、独自のコンテキストを構築するネイティブランタイム、または特殊なブートストラップ不要ワークフロー）にのみ使用してください。Heartbeat と Compaction 復旧ターンでも注入はスキップされます。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前のワークスペースブートストラップファイルごとの最大文字数。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペースブートストラップファイル全体で注入される合計最大文字数。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップコンテキストが切り詰められたときの、エージェントに見えるシステムプロンプト通知を制御します。
デフォルト: `"once"`。

- `"off"`: 切り詰め通知テキストをシステムプロンプトへ注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに簡潔な通知を 1 回注入します（推奨）。
- `"always"`: 切り詰めが存在する場合、実行ごとに簡潔な通知を注入します。

詳細な raw/注入済みカウントと設定チューニング項目は、コンテキスト/ステータスレポートやログなどの診断情報に残ります。通常の WebChat ユーザー/ランタイムコンテキストには、簡潔な復旧通知のみが渡されます。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有マップ

OpenClaw には複数の大容量プロンプト/コンテキスト予算があり、それらは 1 つの汎用ノブを通るのではなく、意図的にサブシステムごとに分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常のワークスペースブートストラップ注入。
- `agents.defaults.startupContext.*`:
  最近の日次 `memory/*.md` ファイルを含む、1 回限りのリセット/起動時モデル実行プレリュード。素のチャット `/new` および `/reset` コマンドは、モデルを呼び出さずに確認応答されます。
- `skills.limits.*`:
  システムプロンプトに注入されるコンパクトな Skills リスト。
- `agents.defaults.contextLimits.*`:
  境界付きランタイム抜粋と、注入されるランタイム所有ブロック。
- `memory.qmd.limits.*`:
  インデックス付きメモリ検索スニペットと注入サイズ。

あるエージェントだけが異なる予算を必要とする場合にのみ、対応するエージェント単位の上書きを使用してください。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

リセット/起動時モデル実行で注入される初回ターン起動プレリュードを制御します。素のチャット `/new` および `/reset` コマンドは、モデルを呼び出さずにリセットを確認応答するため、このプレリュードを読み込みません。

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
- `memoryGetDefaultLines`: `lines` が省略された場合のデフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果とオーバーフロー復旧に使用されるライブツール結果上限。
- `postCompactionMaxChars`: Compaction 後の更新注入中に使用される AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブのエージェント単位の上書き。省略されたフィールドは `agents.defaults.contextLimits` から継承されます。

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

システムプロンプトに注入されるコンパクトな Skills リストのグローバル上限。これは必要に応じた `SKILL.md` ファイルの読み取りには影響しません。

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

プロバイダー呼び出し前の、トランスクリプト/ツール画像ブロック内における画像の最長辺の最大ピクセルサイズ。
デフォルト: `1200`。

値を低くすると、通常はスクリーンショットが多い実行でのビジョントークン使用量とリクエストペイロードサイズを削減できます。
値を高くすると、より多くの視覚的詳細が保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキストのタイムゾーン（メッセージタイムスタンプではありません）。ホストのタイムゾーンにフォールバックします。

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

- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - 文字列形式はプライマリモデルのみを設定します。
  - オブジェクト形式はプライマリに加えて順序付きのフェイルオーバーモデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - `image` ツールパスで、そのビジョンモデル設定として使用されます。
  - 選択済み/デフォルトモデルが画像入力を受け付けられない場合のフォールバックルーティングとしても使用されます。
  - 明示的な `provider/model` 参照を推奨します。裸の ID は互換性のため受け付けられます。裸の ID が `models.providers.*.models` 内の設定済み画像対応エントリに一意に一致する場合、OpenClaw はそれをそのプロバイダーに修飾します。設定済みの一致が曖昧な場合は、明示的なプロバイダー接頭辞が必要です。
- `imageGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - 共有画像生成ケイパビリティ、および画像を生成する将来のツール/Plugin サーフェスで使用されます。
  - 典型的な値: Gemini ネイティブ画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-2`、透明背景の OpenAI PNG/WebP 出力には `openai/gpt-image-1.5`。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証も設定してください (例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` / `openai/gpt-image-1.5` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`)。
  - 省略した場合でも、`image_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み画像生成プロバイダーをプロバイダー ID 順に試します。
- `musicGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - 共有音楽生成ケイパビリティと組み込みの `music_generate` ツールで使用されます。
  - 典型的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み音楽生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - 共有動画生成ケイパビリティと組み込みの `video_generate` ツールで使用されます。
  - 典型的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み動画生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
  - バンドルされた Qwen 動画生成プロバイダーは、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、およびプロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - `pdf` ツールでモデルルーティングに使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルト PDF サイズ上限です。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮されるデフォルトの最大ページ数です。
- `verboseDefault`: エージェントのデフォルト verbose レベルです。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `toolProgressDetail`: `/verbose` ツール要約と進捗ドラフトのツール行の詳細モードです。値: `"explain"` (デフォルト、簡潔な人間向けラベル) または `"raw"` (利用可能な場合に生のコマンド/詳細を追加)。エージェントごとの `agents.list[].toolProgressDetail` はこのデフォルトを上書きします。
- `reasoningDefault`: エージェントのデフォルト推論可視性です。値: `"off"`、`"on"`、`"stream"`。エージェントごとの `agents.list[].reasoningDefault` はこのデフォルトを上書きします。設定済みの推論デフォルトは、メッセージ単位またはセッションの推論上書きが設定されていない場合に限り、所有者、承認済み送信者、またはオペレーター管理者の Gateway コンテキストにのみ適用されます。
- `elevatedDefault`: エージェントのデフォルト昇格出力レベルです。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model` です (例: OpenAI API キーまたは Codex OAuth アクセスには `openai/gpt-5.5`)。プロバイダーを省略すると、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に対する設定済みプロバイダーの一意な一致を試し、その後でのみ設定済みデフォルトプロバイダーにフォールバックします (非推奨の互換動作のため、明示的な `provider/model` を推奨します)。そのプロバイダーが設定済みデフォルトモデルを公開しなくなった場合、OpenClaw は削除済みプロバイダーの古いデフォルトを表面化するのではなく、最初の設定済みプロバイダー/モデルにフォールバックします。
- `models`: `/model` 用に設定されたモデルカタログと許可リストです。各エントリには `alias` (ショートカット) と `params` (プロバイダー固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`) を含められます。
  - `"openai-codex/*": {}` や `"vllm/*": {}` のような `provider/*` エントリを使用すると、すべてのモデル ID を手動で列挙せずに、選択したプロバイダーで検出されたすべてのモデルを表示できます。
  - 安全な編集: エントリを追加するには `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。`config set` は、`--replace` を渡さない限り、既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダー単位の configure/オンボーディングフローは、選択されたプロバイダーモデルをこのマップにマージし、すでに設定済みの無関係なプロバイダーを保持します。
  - 直接 OpenAI Responses モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management` の注入を止めるには `params.responsesServerCompaction: false` を使用し、しきい値を上書きするには `params.responsesCompactThreshold` を使用します。[OpenAI サーバー側 Compaction](/ja-JP/providers/openai#server-side-compaction-responses-api) を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルトプロバイダーパラメーターです。`agents.defaults.params` に設定します (例: `{ cacheRetention: "long" }`)。
- `params` のマージ優先順位 (設定): `agents.defaults.params` (グローバル基準) は `agents.defaults.models["provider/model"].params` (モデル単位) によって上書きされ、その後 `agents.list[].params` (一致するエージェント ID) がキーごとに上書きします。詳細は [プロンプトキャッシュ](/ja-JP/reference/prompt-caching) を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシ向けの `api: "openai-completions"` リクエスト本文にマージされる高度なパススルー JSON です。生成されたリクエストキーと衝突した場合は追加本文が優先されます。非ネイティブ completions ルートでは、その後も OpenAI 専用の `store` が削除されます。
- `params.chat_template_kwargs`: 最上位の `api: "openai-completions"` リクエスト本文にマージされる vLLM/OpenAI 互換のチャットテンプレート引数です。thinking がオフの `vllm/nemotron-3-*` では、バンドルされた vLLM Plugin が `enable_thinking: false` と `force_nonempty_content: true` を自動的に送信します。明示的な `chat_template_kwargs` は生成されたデフォルトを上書きし、`extra_body.chat_template_kwargs` が引き続き最終優先されます。vLLM Qwen の thinking 制御では、そのモデルエントリで `params.qwenThinkingFormat` を `"chat-template"` または `"top-level"` に設定します。
- `compat.thinkingFormat`: OpenAI 互換の thinking ペイロードスタイルです。Qwen スタイルの最上位 `enable_thinking` には `"qwen"` を使用し、vLLM など、リクエストレベルのチャットテンプレート kwargs をサポートする Qwen ファミリーのバックエンドで `chat_template_kwargs.enable_thinking` を使うには `"qwen-chat-template"` を使用します。OpenClaw は無効な thinking を `false` に、有効な thinking を `true` にマップします。
- `compat.supportedReasoningEfforts`: モデル単位の OpenAI 互換の推論 effort リストです。実際に受け付けるカスタムエンドポイントには `"xhigh"` を含めてください。その場合、OpenClaw はその設定済みプロバイダー/モデルに対して、コマンドメニュー、Gateway セッション行、セッションパッチ検証、エージェント CLI 検証、`llm-task` 検証で `/think xhigh` を公開します。バックエンドが正規レベルに対してプロバイダー固有の値を必要とする場合は、`compat.reasoningEffortMap` を使用します。
- `params.preserveThinking`: Z.AI 専用の保持 thinking オプトインです。有効化され、thinking がオンの場合、OpenClaw は `thinking.clear_thinking: false` を送信し、以前の `reasoning_content` を再生します。[Z.AI の thinking と保持 thinking](/ja-JP/providers/zai#thinking-and-preserved-thinking) を参照してください。
- `localService`: ローカル/セルフホストのモデルサーバー向けの、任意のプロバイダーレベルのプロセスマネージャーです。選択されたモデルがそのプロバイダーに属する場合、OpenClaw は `healthUrl` (または `baseUrl + "/models"`) をプローブし、エンドポイントがダウンしていれば `args` 付きで `command` を開始し、最大 `readyTimeoutMs` まで待ってからモデルリクエストを送信します。`command` は絶対パスである必要があります。`idleStopMs: 0` は OpenClaw が終了するまでプロセスを生存させます。正の値は、そのアイドルミリ秒数の後に OpenClaw が起動したプロセスを停止します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services) を参照してください。
- ランタイムポリシーは `agents.defaults` ではなく、プロバイダーまたはモデルに属します。プロバイダー全体のルールには `models.providers.<provider>.agentRuntime` を使用し、モデル固有のルールには `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` を使用します。公式 OpenAI プロバイダー上の OpenAI エージェントモデルは、デフォルトで Codex を選択します。
- これらのフィールドを変更する設定ライター (例: `/models set`、`/models set-image`、フォールバック追加/削除コマンド) は、正規のオブジェクト形式で保存し、可能な場合は既存のフォールバックリストを保持します。
- `maxConcurrent`: セッション全体での最大並列エージェント実行数です (各セッション自体は引き続き直列化されます)。デフォルト: 4。

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

- `id`: `"auto"`、`"pi"`、登録済み Plugin ハーネス ID、またはサポートされる CLI バックエンドエイリアスです。バンドルされた Codex Plugin は `codex` を登録します。バンドルされた Anthropic Plugin は `claude-cli` CLI バックエンドを提供します。
- `id: "auto"` は、登録済み Plugin ハーネスがサポート対象のターンを引き受けられるようにし、一致するハーネスがない場合は PI を使用します。`id: "codex"` のような明示的な Plugin ランタイムはそのハーネスを必要とし、利用できない場合または失敗した場合は閉じた状態で失敗します。
- エージェント全体のランタイムキーはレガシーです。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、セッションランタイムピン、`OPENCLAW_AGENT_RUNTIME` はランタイム選択で無視されます。古い値を削除するには `openclaw doctor --fix` を実行してください。
- OpenAI エージェントモデルはデフォルトで Codex ハーネスを使用します。明示したい場合は、プロバイダー/モデルの `agentRuntime.id: "codex"` が引き続き有効です。
- Claude CLI デプロイでは、`model: "anthropic/claude-opus-4-7"` に加え、モデルスコープの `agentRuntime.id: "claude-cli"` を推奨します。レガシーな `claude-cli/claude-opus-4-7` モデル参照も互換性のため引き続き動作しますが、新しい設定ではプロバイダー/モデル選択を正規形のままにし、実行バックエンドはプロバイダー/モデルのランタイムポリシーに置くべきです。
- これはテキストのエージェントターン実行のみを制御します。メディア生成、ビジョン、PDF、音楽、動画、TTS は引き続きそれぞれのプロバイダー/モデル設定を使用します。

**組み込みエイリアス短縮形** (`agents.defaults.models` 内にモデルがある場合にのみ適用):

| エイリアス          | モデル                                 |
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

Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、思考モードを自動的に有効にします。
Z.AI モデルは、ツール呼び出しストリーミングのためにデフォルトで `tool_stream` を有効にします。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的な思考レベルが設定されていない場合、デフォルトで `adaptive` 思考になります。

### `agents.defaults.cliBackends`

テキスト専用フォールバック実行用の任意の CLI バックエンドです（ツール呼び出しなし）。API プロバイダーが失敗したときのバックアップとして有用です。

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
- `reseedFromRawTranscriptWhenUncompacted: true` により、バックエンドは、最初の Compaction 要約が存在する前に、境界付きの生の OpenClaw トランスクリプト末尾から、安全に無効化されたセッションを復旧できます。認証プロファイルまたは認証情報エポックの変更では、依然として生の再シードは行われません。

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

モデルファミリーごとに適用される、プロバイダー非依存のプロンプトオーバーレイです。GPT-5 ファミリーのモデル ID は、プロバイダーをまたいで共有される動作契約を受け取ります。`personality` は、親しみやすい対話スタイルのレイヤーのみを制御します。

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

- `"friendly"`（デフォルト）と `"on"` は、親しみやすい対話スタイルのレイヤーを有効にします。
- `"off"` は親しみやすいレイヤーのみを無効にします。タグ付けされた GPT-5 動作契約は有効なままです。
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

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API キー認証）または `1h`（OAuth 認証）。無効にするには `0m` に設定します。
- `includeSystemPromptSection`: false の場合、システムプロンプトから Heartbeat セクションを省略し、ブートストラップコンテキストへの `HEARTBEAT.md` 注入をスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。
- `timeoutSeconds`: Heartbeat エージェントターンが中止されるまでに許可される最大秒数です。未設定のままにすると `agents.defaults.timeoutSeconds` が使用されます。
- `directPolicy`: ダイレクト/DM 配信ポリシー。`allow`（デフォルト）はダイレクトターゲット配信を許可します。`block` はダイレクトターゲット配信を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat 実行は軽量ブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は以前の会話履歴なしの新しいセッションで実行されます。cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat ごとのトークンコストを約 100K から約 2-5K トークンに削減します。
- `skipWhenBusy`: true の場合、Heartbeat 実行は追加のビジーなレーン、つまりサブエージェントまたはネストされたコマンド作業でも延期されます。Cron レーンは、このフラグがなくても常に Heartbeat を延期します。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義している場合、**それらのエージェントのみ**が Heartbeat を実行します。
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
- `provider`: 登録済み Compaction プロバイダー Plugin の ID。設定すると、組み込み LLM 要約の代わりにプロバイダーの `summarize()` が呼び出されます。失敗時は組み込みにフォールバックします。プロバイダーを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClaw が単一の Compaction 操作を中止するまでに許可される最大秒数です。デフォルト: `900`。
- `keepRecentTokens`: 最新のトランスクリプト末尾をそのまま保持するための Pi カットポイント予算です。手動の `/compact` は、明示的に設定されている場合これを尊重します。それ以外の場合、手動 Compaction は強制チェックポイントです。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction 要約時に組み込みの不透明識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用される、任意のカスタム識別子保持テキストです。
- `qualityGuard`: safeguard 要約に対する不正な形式の出力のリトライ確認です。safeguard モードではデフォルトで有効です。監査をスキップするには `enabled: false` を設定します。
- `midTurnPrecheck`: 任意の Pi ツールループ圧力チェックです。`enabled: true` の場合、OpenClaw はツール結果が追加された後、次のモデル呼び出しの前にコンテキスト圧力を確認します。コンテキストが収まらなくなった場合、プロンプトを送信する前に現在の試行を中止し、既存の事前チェック復旧パスを再利用してツール結果を切り詰めるか、Compaction して再試行します。`default` と `safeguard` の両方の Compaction モードで機能します。デフォルト: 無効。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名です。デフォルトは `["Session Startup", "Red Lines"]` です。再注入を無効にするには `[]` を設定します。未設定またはこのデフォルトのペアが明示的に設定されている場合、古い `Every Session`/`Safety` 見出しもレガシーフォールバックとして受け入れられます。
- `model`: Compaction 要約のみに対する任意の `provider/model-id` オーバーライドです。メインセッションでは 1 つのモデルを維持しつつ、Compaction 要約は別のモデルで実行したい場合に使用します。未設定の場合、Compaction はセッションのプライマリモデルを使用します。
- `maxActiveTranscriptBytes`: アクティブな JSONL がしきい値を超えた場合に、実行前に通常のローカル Compaction をトリガーする任意のバイトしきい値（`number` または `"20mb"` のような文字列）です。Compaction 成功後により小さな後続トランスクリプトへローテートできるように、`truncateAfterCompaction` が必要です。未設定または `0` の場合は無効です。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時に短い通知（例: 「コンテキストを Compaction しています...」や「Compaction が完了しました」）をユーザーに送信します。Compaction を無音に保つため、デフォルトでは無効です。
- `memoryFlush`: 自動 Compaction の前に、永続的な記憶を保存するための無音のエージェントターンです。この整理ターンをローカルモデル上に留めたい場合は、`model` を `ollama/qwen3:8b` のような正確なプロバイダー/モデルに設定します。このオーバーライドはアクティブセッションのフォールバックチェーンを継承しません。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから**古いツール結果**を刈り込みます。ディスク上のセッション履歴は変更**しません**。

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

- `mode: "cache-ttl"` は刈り込みパスを有効にします。
- `ttl` は、刈り込みを再実行できる頻度（最後のキャッシュ接触後）を制御します。
- 刈り込みはまず大きすぎるツール結果をソフトトリムし、その後必要に応じて古いツール結果をハードクリアします。

**ソフトトリム**は先頭 + 末尾を保持し、中央に `...` を挿入します。

**ハードクリア**はツール結果全体をプレースホルダーに置き換えます。

注記:

- 画像ブロックはトリム/クリアされません。
- 比率は文字ベース（近似）であり、正確なトークン数ではありません。
- `keepLastAssistants` より少ない assistant メッセージしか存在しない場合、刈り込みはスキップされます。

</Accordion>

動作の詳細は [Session Pruning](/ja-JP/concepts/session-pruning) を参照してください。

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

- Telegram以外のチャンネルでブロック返信を有効にするには、明示的に `*.blockStreaming: true` が必要です。
- チャンネルのオーバーライド: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信の間にランダムな一時停止を入れます。`natural` = 800〜2500ms。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

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

- デフォルト: 直接チャット/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

組み込みエージェント向けの任意のサンドボックス化です。完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

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

**Backend:**

- `docker`: ローカル Docker ランタイム（デフォルト）
- `ssh`: 汎用の SSH バックリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` が選択されている場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのワークスペースに使用される絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: 実行時に OpenClaw が一時ファイルへ実体化するインライン内容または SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH のホストキー方針の調整項目

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先されます
- `certificateData` は `certificateFile` より優先されます
- `knownHostsData` は `knownHostsFile` より優先されます
- SecretRef ベースの `*Data` 値は、サンドボックスセッションの開始前にアクティブなシークレットランタイムスナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成後に、リモートワークスペースへ一度だけシードします
- その後、リモート SSH ワークスペースを正準として維持します
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングします
- リモート変更をホストへ自動同期しません
- サンドボックスブラウザーコンテナはサポートしません

**ワークスペースアクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのサンドボックスワークスペース
- `ro`: `/workspace` のサンドボックスワークスペース、エージェントワークスペースは `/agent` に読み取り専用でマウント
- `rw`: エージェントワークスペースを `/workspace` に読み書き可能でマウント

**スコープ:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース（デフォルト）
- `shared`: 共有コンテナとワークスペース（セッション間の分離なし）

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

- `mirror`: exec 前にローカルからリモートへシードし、exec 後に同期して戻します。ローカルワークスペースが正準のままです
- `remote`: サンドボックス作成時にリモートへ一度だけシードし、その後はリモートワークスペースを正準として維持します

`remote` モードでは、OpenClaw の外部で行われたホストローカルの編集は、シード手順の後にサンドボックスへ自動同期されません。
トランスポートは OpenShell サンドボックスへの SSH ですが、サンドボックスのライフサイクルと任意のミラー同期は Plugin が所有します。

**`setupCommand`** はコンテナ作成後に一度だけ実行されます（`sh -lc` 経由）。ネットワーク送信、書き込み可能なルート、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントにアウトバウンドアクセスが必要な場合は `"bridge"`（またはカスタムブリッジネットワーク）に設定してください。
`"host"` はブロックされます。`"container:<id>"` は、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を設定しない限りデフォルトでブロックされます（緊急回避）。

**受信添付ファイル** は、アクティブなワークスペース内の `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルバインドとエージェントごとのバインドはマージされます。

**サンドボックス化されたブラウザー**（`sandbox.browser.enabled`）: コンテナ内の Chromium + CDP。noVNC URL はシステムプロンプトへ注入されます。`openclaw.json` の `browser.enabled` は不要です。
noVNC オブザーバーアクセスはデフォルトで VNC 認証を使用し、OpenClaw は共有 URL でパスワードを公開する代わりに短時間有効なトークン URL を発行します。

- `allowHostControl: false`（デフォルト）は、サンドボックス化されたセッションがホストブラウザーをターゲットにすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用ブリッジネットワーク）です。グローバルブリッジ接続を明示的に必要とする場合にのみ `bridge` に設定してください。
- `cdpSourceRange` は、コンテナ境界での CDP 受信を任意で CIDR 範囲（例: `172.21.0.1/32`）に制限します。
- `sandbox.browser.binds` は、追加のホストディレクトリをサンドボックスブラウザーコンテナのみにマウントします。設定されている場合（`[]` を含む）、ブラウザーコンテナでは `docker.binds` を置き換えます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナホスト向けに調整されています:
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
  - `--disable-3d-apis`、`--disable-software-rasterizer`、および `--disable-gpu` は
    デフォルトで有効であり、WebGL/3D の使用に必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効にできます。
  - ワークフローが拡張機能に依存する場合、`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で拡張機能を再度有効化します。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    デフォルトプロセス制限を使用するには `0` を設定します。
  - `noSandbox` が有効な場合は、さらに `--no-sandbox` が追加されます。
  - デフォルトはコンテナイメージのベースラインです。コンテナのデフォルトを変更するには、カスタム
    エントリーポイントを持つカスタムブラウザーイメージを使用してください。

</Accordion>

ブラウザーサンドボックス化と `sandbox.docker.binds` は Docker 専用です。

イメージをビルドします（ソースチェックアウトから）:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

ソースチェックアウトなしの npm インストールについては、インラインの `docker build` コマンドを [Sandboxing § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) で確認してください。

### `agents.list`（エージェントごとのオーバーライド）

エージェントに独自の TTS プロバイダー、音声、モデル、
スタイル、または自動 TTS モードを与えるには `agents.list[].tts` を使用します。エージェントブロックはグローバルな
`messages.tts` に深くマージされるため、共有認証情報を 1 か所に置いたまま、個々の
エージェントは必要な音声またはプロバイダーフィールドだけをオーバーライドできます。アクティブなエージェントの
オーバーライドは、自動の音声返信、`/tts audio`、`/tts status`、および
`tts` エージェントツールに適用されます。プロバイダー例と優先順位については [Text-to-speech](/ja-JP/tools/tts#per-agent-voice-overrides)
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
- `default`: 複数設定されている場合は最初のものが優先されます（警告がログに記録されます）。何も設定されていない場合は、リストの最初のエントリがデフォルトです。
- `model`: 文字列形式では、モデルフォールバックなしの厳密なエージェント単位のプライマリが設定されます。オブジェクト形式の `{ primary }` も、`fallbacks` を追加しない限り厳密です。そのエージェントでフォールバックを有効にするには `{ primary, fallbacks: [...] }` を使用し、厳密な動作を明示するには `{ primary, fallbacks: [] }` を使用します。`primary` だけを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、引き続きデフォルトのフォールバックを継承します。
- `params`: `agents.defaults.models` で選択されたモデルエントリの上にマージされる、エージェント単位のストリームパラメータです。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有の上書きに使用します。
- `tts`: 任意のエージェント単位のテキスト読み上げ上書きです。このブロックは `messages.tts` の上にディープマージされるため、共有プロバイダー認証情報とフォールバックポリシーは `messages.tts` に保持し、ここではプロバイダー、音声、モデル、スタイル、自動モードなど、ペルソナ固有の値だけを設定します。
- `skills`: 任意のエージェント単位の Skills 許可リストです。省略すると、設定されている場合はエージェントが `agents.defaults.skills` を継承します。明示的なリストはデフォルトとマージせずに置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェント単位のデフォルト思考レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージ単位またはセッション単位の上書きが設定されていない場合、このエージェントの `agents.defaults.thinkingDefault` を上書きします。選択されたプロバイダー/モデルプロファイルによって有効な値が制御されます。Google Gemini の場合、`adaptive` はプロバイダー所有の動的思考を維持します（Gemini 3/3.1 では `thinkingLevel` を省略、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 任意のエージェント単位のデフォルト推論可視性（`on | off | stream`）。メッセージ単位またはセッション単位の推論上書きが設定されていない場合、このエージェントの `agents.defaults.reasoningDefault` を上書きします。
- `fastModeDefault`: 任意のエージェント単位の高速モードのデフォルト（`true | false`）。メッセージ単位またはセッション単位の高速モード上書きが設定されていない場合に適用されます。
- `models`: 完全な `provider/model` ID をキーにした、任意のエージェント単位のモデルカタログ/ランタイム上書きです。エージェント単位のランタイム例外には `models["provider/model"].agentRuntime` を使用します。
- `runtime`: 任意のエージェント単位のランタイム記述子です。エージェントが ACP ハーネスセッションをデフォルトにする必要がある場合は、`runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）とともに `type: "acp"` を使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを派生します。`emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns` を派生します。
- `subagents.allowAgents`: 明示的な `sessions_spawn.agentId` ターゲットに対するエージェント ID の許可リスト（`["*"]` = 任意、デフォルト: 同じエージェントのみ）。自己ターゲットの `agentId` 呼び出しを許可する必要がある場合は、リクエスター ID を含めます。
- サンドボックス継承ガード: リクエスターセッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略する `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します。デフォルト: false）。

---

## マルチエージェントルーティング

1 つの Gateway 内で、複数の分離されたエージェントを実行します。[マルチエージェント](/ja-JP/concepts/multi-agent)を参照してください。

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

- `type`（任意）: 通常のルーティングは `route`（type がない場合のデフォルトは route）、永続的な ACP 会話バインディングは `acp`。
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

各階層内では、最初に一致する `bindings` エントリが優先されます。

`type: "acp"` エントリでは、OpenClaw は正確な会話 ID（`match.channel` + アカウント + `match.peer.id`）で解決し、上記のルートバインディング階層順序は使用しません。

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

優先順位の詳細については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

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

- **`scope`**: グループチャットのコンテキストにおける基本セッションのグループ化戦略。
  - `per-sender` (デフォルト): 各送信者は、チャネルコンテキスト内で分離されたセッションを取得します。
  - `global`: チャネルコンテキスト内のすべての参加者が 1 つのセッションを共有します (共有コンテキストを意図している場合のみ使用してください)。
- **`dmScope`**: DM のグループ化方法。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャネル + 送信者ごとに分離します (複数ユーザーの受信箱に推奨)。
  - `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します (複数アカウントに推奨)。
- **`identityLinks`**: チャネルをまたいだセッション共有のために、正規 ID をプロバイダー接頭辞付きピアへマップします。`/dock_discord` などのドックコマンドは同じマップを使用して、アクティブセッションの返信ルートを別のリンク済みチャネルピアへ切り替えます。[チャネルドッキング](/ja-JP/concepts/channel-docking)を参照してください。
- **`reset`**: 主要なリセットポリシー。`daily` は `atHour` の現地時刻にリセットします。`idle` は `idleMinutes` 後にリセットします。両方を設定した場合は、先に期限切れになった方が優先されます。日次リセットの鮮度はセッション行の `sessionStartedAt` を使用します。アイドルリセットの鮮度は `lastInteractionAt` を使用します。Heartbeat、Cron のウェイクアップ、実行通知、Gateway のブックキーピングなどのバックグラウンド/システムイベント書き込みは `updatedAt` を更新できますが、日次/アイドルセッションの鮮度は維持しません。
- **`resetByType`**: タイプ別のオーバーライド (`direct`、`group`、`thread`)。レガシーの `dm` は `direct` のエイリアスとして受け入れられます。
- **`mainKey`**: レガシーフィールド。ランタイムはメインのダイレクトチャットバケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: エージェント間交換中に、エージェント間で返信し合う最大ターン数 (整数、範囲: `0`-`20`、デフォルト: `5`)。`0` はピンポン連鎖を無効にします。
- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、レガシーの `dm` エイリアスあり)、`keyPrefix`、または `rawKeyPrefix` で照合します。最初の拒否が優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを出力します。`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの年齢カットオフ (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` 内の最大エントリ数 (デフォルト `500`)。ランタイムは、本番規模の上限に対して小さな高水位バッファ付きでバッチクリーンアップを書き込みます。`openclaw sessions cleanup --enforce` は上限を即時適用します。
  - `rotateBytes`: 非推奨で無視されます。`openclaw doctor --fix` は古い設定からこれを削除します。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter` です。無効にするには `false` を設定します。
  - `maxDiskBytes`: オプションのセッションディレクトリのディスク予算。`warn` モードでは警告をログに記録します。`enforce` モードでは最も古いアーティファクト/セッションを先に削除します。
  - `highWaterBytes`: 予算クリーンアップ後のオプション目標。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッド紐付けセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーでオーバーライド可能。Discord は `channels.discord.threadBindings.enabled` を使用します)
  - `idleHours`: 非アクティブ時に自動でフォーカス解除するまでのデフォルト時間 (`0` は無効化。プロバイダーでオーバーライド可能)
  - `maxAgeHours`: デフォルトの厳格な最大経過時間 (`0` は無効化。プロバイダーでオーバーライド可能)
  - `spawnSessions`: `sessions_spawn` と ACP スレッドスポーンからスレッド紐付け作業セッションを作成するためのデフォルトゲート。スレッド紐付けが有効な場合、デフォルトは `true` です。プロバイダー/アカウントでオーバーライド可能です。
  - `defaultSpawnContext`: スレッド紐付けスポーンのデフォルトネイティブサブエージェントコンテキスト (`"fork"` または `"isolated"`)。デフォルトは `"fork"` です。

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

チャネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順序 (最も具体的なものが優先): アカウント → チャネル → グローバル。`""` は無効化し、カスケードを停止します。`"auto"` は `[{identity.name}]` から派生します。

**テンプレート変数:**

| 変数              | 説明                 | 例                          |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 短いモデル名         | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子   | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名       | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル     | `high`, `low`, `off`        |
| `{identity.name}` | エージェント ID 名   | (`"auto"` と同じ)           |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` のエイリアスです。

### Ack リアクション

- デフォルトはアクティブエージェントの `identity.emoji`、それ以外は `"👀"` です。無効にするには `""` を設定します。
- チャネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram、WhatsApp、iMessage など、リアクション対応チャネルで返信後に Ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram でライフサイクルステータスリアクションを有効にします。
  Slack と Discord では、未設定の場合、Ack リアクションがアクティブなときにステータスリアクションが有効のままになります。
  Telegram では、ライフサイクルステータスリアクションを有効にするには明示的に `true` に設定してください。

### 受信デバウンス

同じ送信者からの短時間のテキストのみのメッセージを、1 つのエージェントターンにまとめます。メディア/添付ファイルは即時フラッシュされます。制御コマンドはデバウンスを迂回します。

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

- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定をオーバーライドでき、`/tts status` は有効な状態を表示します。
- `summaryModel` は自動要約用に `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false` (オプトイン) です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` と `OPENAI_API_KEY` にフォールバックします。
- バンドルされた音声プロバイダーは Plugin が所有します。`plugins.allow` が設定されている場合は、使用したい各 TTS プロバイダー Plugin を含めてください。たとえば Edge TTS には `microsoft` を指定します。レガシーの `edge` プロバイダー ID は `microsoft` のエイリアスとして受け入れられます。
- `providers.openai.baseUrl` は OpenAI TTS エンドポイントをオーバーライドします。解決順序は、設定、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
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

- 複数の Talk プロバイダーが設定されている場合、`talk.provider` は `talk.providers` 内のキーと一致している必要があります。
- レガシーのフラットな Talk キー (`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`) は互換性専用です。永続化された設定を `talk.providers.<provider>` に書き換えるには、`openclaw doctor --fix` を実行してください。
- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` はプレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk ディレクティブでわかりやすい名前を使用できます。
- `providers.mlx.modelId` は、macOS のローカル MLX ヘルパーが使用する Hugging Face リポジトリを選択します。省略した場合、macOS は `mlx-community/Soprano-80M-bf16` を使用します。
- macOS の MLX 再生は、存在する場合はバンドルされた `openclaw-mlx-tts` ヘルパーを介して実行され、または `PATH` 上の実行可能ファイルを介して実行されます。`OPENCLAW_MLX_TTS_BIN` は開発用にヘルパーパスをオーバーライドします。
- `consultThinkingLevel` は、Control UI Talk リアルタイムの `openclaw_agent_consult` 呼び出しの背後にある完全な OpenClaw エージェント実行の思考レベルを制御します。通常のセッション/モデル動作を維持するには未設定のままにします。
- `consultFastMode` は、セッションの通常の高速モード設定を変更せずに、Control UI Talk リアルタイム相談に対してワンショットの高速モードオーバーライドを設定します。
- `speechLocale` は、iOS/macOS Talk 音声認識で使用される BCP 47 ロケール ID を設定します。デバイスのデフォルトを使用するには未設定のままにします。
- `silenceTimeoutMs` は、ユーザーの無音後に Talk モードがトランスクリプトを送信するまで待機する時間を制御します。未設定の場合、プラットフォームのデフォルト一時停止ウィンドウ (`macOS と Android では 700 ms、iOS では 900 ms`) が維持されます。
- `realtime.instructions` は、プロバイダー向けのシステム指示を OpenClaw の組み込みリアルタイムプロンプトに追加するため、デフォルトの `openclaw_agent_consult` ガイダンスを失わずに音声スタイルを設定できます。

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他すべての設定キー
- [設定](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [設定例](/ja-JP/gateway/configuration-examples)
