---
read_when:
    - エージェントのデフォルトを調整する（モデル、思考、ワークスペース、Heartbeat、メディア、Skills）
    - マルチエージェントのルーティングとバインディングの設定
    - セッション、メッセージ配信、トークモード動作の調整
summary: Agent のデフォルト設定、マルチエージェントルーティング、セッション、メッセージ、talk 設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-05-06T17:55:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0467260ad61f3d2a0b52cd952154d617a9341a588cdeda38f54bfae5985fa4f
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、`talk.*` 配下のエージェントスコープの構成キー。チャネル、ツール、Gateway ランタイム、その他の
トップレベルキーについては、[構成リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システムプロンプトの Runtime 行に表示される任意のリポジトリルート。未設定の場合、OpenClaw はワークスペースから上位へたどって自動検出します。

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

- デフォルトで Skills を無制限にするには、`agents.defaults.skills` を省略します。
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

必須のブートストラップファイルは書き込みつつ、選択した任意のワークスペースファイルの作成をスキップします。有効な値: `SOUL.md`、`USER.md`、`HEARTBEAT.md`、`IDENTITY.md`。

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

- `"continuation-skip"`: 安全な継続ターン（完了したアシスタント応答の後）では、ワークスペースのブートストラップ再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と Compaction 後の再試行では引き続きコンテキストを再構築します。
- `"never"`: すべてのターンでワークスペースのブートストラップとコンテキストファイル注入を無効にします。これは、プロンプトのライフサイクルを完全に自前で管理するエージェント（カスタムコンテキストエンジン、独自のコンテキストを構築するネイティブランタイム、またはブートストラップ不要の特殊なワークフロー）にのみ使用してください。Heartbeat と Compaction 回復ターンでも注入をスキップします。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り捨て前の、ワークスペースのブートストラップファイルごとの最大文字数。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペースのブートストラップファイル全体で注入される最大合計文字数。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップコンテキストが切り捨てられたときの、エージェントに表示されるシステムプロンプト通知を制御します。
デフォルト: `"once"`。

- `"off"`: 切り捨て通知テキストをシステムプロンプトに注入しません。
- `"once"`: 一意の切り捨てシグネチャごとに、簡潔な通知を一度だけ注入します（推奨）。
- `"always"`: 切り捨てが存在する場合、実行のたびに簡潔な通知を注入します。

詳細な raw/注入後のカウントと構成調整フィールドは、コンテキスト/ステータスレポートやログなどの診断情報に残ります。通常の WebChat ユーザー/ランタイムコンテキストには、簡潔な回復通知のみが渡されます。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有マップ

OpenClaw には複数の大容量プロンプト/コンテキスト予算があり、それらは単一の汎用ノブにすべて流すのではなく、意図的にサブシステムごとに分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常のワークスペースブートストラップ注入。
- `agents.defaults.startupContext.*`:
  最近の日次 `memory/*.md` ファイルを含む、単発のリセット/起動モデル実行プレリュード。素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずに確認応答されます。
- `skills.limits.*`:
  システムプロンプトに注入される圧縮された Skills リスト。
- `agents.defaults.contextLimits.*`:
  境界付きランタイム抜粋と、ランタイム所有の注入ブロック。
- `memory.qmd.limits.*`:
  インデックス化されたメモリ検索スニペットと注入サイズ。

1つのエージェントだけが異なる予算を必要とする場合にのみ、対応するエージェント単位の上書きを使用します。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

リセット/起動モデル実行時の最初のターンに注入される起動プレリュードを制御します。
素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずにリセットを確認応答するため、このプレリュードを読み込みません。

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

境界付きランタイムコンテキストサーフェス向けの共有デフォルト。

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

- `memoryGetMaxChars`: 切り捨てメタデータと継続通知が追加される前の、デフォルトの `memory_get` 抜粋上限。
- `memoryGetDefaultLines`: `lines` が省略された場合の、デフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果とオーバーフロー回復に使用されるライブツール結果の上限。
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

システムプロンプトに注入される圧縮 Skills リストのグローバル上限。これは、必要に応じて `SKILL.md` ファイルを読む動作には影響しません。

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

プロバイダー呼び出し前の、トランスクリプト/ツール画像ブロック内で最も長い画像辺の最大ピクセルサイズ。
デフォルト: `1200`。

低い値は通常、スクリーンショットの多い実行におけるビジョントークン使用量とリクエストペイロードサイズを削減します。
高い値は、より多くの視覚的詳細を保持します。

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

- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - 文字列形式では primary model のみを設定します。
  - オブジェクト形式では primary と、順序付きのフェイルオーバーモデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - `image` ツールパスで、その vision-model 設定として使用されます。
  - 選択されたモデルまたはデフォルトモデルが画像入力を受け入れられない場合のフォールバックルーティングにも使用されます。
  - 明示的な `provider/model` 参照を推奨します。互換性のためにベア ID も受け入れられます。ベア ID が `models.providers.*.models` 内の設定済み画像対応エントリに一意に一致する場合、OpenClaw はそれをそのプロバイダーに修飾します。設定済みの一致が曖昧な場合は、明示的なプロバイダープレフィックスが必要です。
- `imageGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - 共有の画像生成機能、および画像を生成する将来のツール/Plugin サーフェスで使用されます。
  - 一般的な値: ネイティブ Gemini 画像生成の場合は `google/gemini-3.1-flash-image-preview`、fal の場合は `fal/fal-ai/flux/dev`、OpenAI Images の場合は `openai/gpt-image-2`、透明背景の OpenAI PNG/WebP 出力の場合は `openai/gpt-image-1.5`。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証も設定してください (例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` / `openai/gpt-image-1.5` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`)。
  - 省略した場合でも、`image_generate` は認証に裏付けられたプロバイダーのデフォルトを推測できます。まず現在のデフォルトプロバイダーを試し、その後に残りの登録済み画像生成プロバイダーをプロバイダー ID 順に試します。
- `musicGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - 共有の音楽生成機能と組み込みの `music_generate` ツールで使用されます。
  - 一般的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証に裏付けられたプロバイダーのデフォルトを推測できます。まず現在のデフォルトプロバイダーを試し、その後に残りの登録済み音楽生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - 共有の動画生成機能と組み込みの `video_generate` ツールで使用されます。
  - 一般的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証に裏付けられたプロバイダーのデフォルトを推測できます。まず現在のデフォルトプロバイダーを試し、その後に残りの登録済み動画生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
  - バンドルされた Qwen 動画生成プロバイダーは、最大 1 個の出力動画、1 個の入力画像、4 個の入力動画、10 秒の長さ、プロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - モデルルーティングのために `pdf` ツールで使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルト PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮されるデフォルトの最大ページ数。
- `verboseDefault`: エージェントのデフォルト verbose レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `toolProgressDetail`: `/verbose` ツール概要および進捗ドラフトのツール行の詳細モード。値: `"explain"` (デフォルト、コンパクトな人間向けラベル) または `"raw"` (利用可能な場合、生のコマンド/詳細を追加)。エージェントごとの `agents.list[].toolProgressDetail` はこのデフォルトを上書きします。
- `reasoningDefault`: エージェントのデフォルト推論可視性。値: `"off"`、`"on"`、`"stream"`。エージェントごとの `agents.list[].reasoningDefault` はこのデフォルトを上書きします。設定済みの推論デフォルトは、メッセージ単位またはセッション単位の推論上書きが設定されていない場合に限り、所有者、承認済み送信者、または operator-admin gateway コンテキストにのみ適用されます。
- `elevatedDefault`: エージェントのデフォルト elevated-output レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model` (例: API キーアクセスの場合は `openai/gpt-5.5`、Codex OAuth の場合は `openai-codex/gpt-5.5`)。プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に対する一意の設定済みプロバイダー一致を試し、その後にのみ設定済みのデフォルトプロバイダーへフォールバックします (非推奨の互換動作であるため、明示的な `provider/model` を推奨します)。そのプロバイダーが設定済みデフォルトモデルをすでに公開していない場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示せず、最初の設定済みプロバイダー/モデルにフォールバックします。
- `models`: `/model` のための設定済みモデルカタログと allowlist。各エントリには `alias` (ショートカット) と `params` (プロバイダー固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`) を含めることができます。
  - 安全な編集: エントリを追加するには `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。`config set` は、`--replace` を渡さない限り、既存の allowlist エントリを削除する置換を拒否します。
  - プロバイダー範囲の設定/オンボーディングフローは、選択されたプロバイダーモデルをこのマップにマージし、すでに設定済みの無関係なプロバイダーを保持します。
  - 直接 OpenAI Responses モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management` の注入を止めるには `params.responsesServerCompaction: false` を使用し、しきい値を上書きするには `params.responsesCompactThreshold` を使用します。[OpenAI server-side compaction](/ja-JP/providers/openai#server-side-compaction-responses-api) を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルトプロバイダーパラメーター。`agents.defaults.params` に設定します (例: `{ cacheRetention: "long" }`)。
- `params` のマージ優先順位 (設定): `agents.defaults.params` (グローバルベース) は `agents.defaults.models["provider/model"].params` (モデル単位) によって上書きされ、その後 `agents.list[].params` (一致するエージェント ID) がキー単位で上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシ向けに、`api: "openai-completions"` リクエスト本文へマージされる高度なパススルー JSON。生成されたリクエストキーと衝突した場合、追加本文が優先されます。非ネイティブ completions ルートでは、その後も OpenAI 専用の `store` が削除されます。
- `params.chat_template_kwargs`: 最上位の `api: "openai-completions"` リクエスト本文へマージされる vLLM/OpenAI 互換チャットテンプレート引数。thinking がオフの `vllm/nemotron-3-*` では、バンドルされた vLLM Plugin が `enable_thinking: false` と `force_nonempty_content: true` を自動的に送信します。明示的な `chat_template_kwargs` は生成されたデフォルトを上書きし、`extra_body.chat_template_kwargs` は引き続き最終的な優先順位を持ちます。vLLM Qwen の thinking 制御では、そのモデルエントリで `params.qwenThinkingFormat` を `"chat-template"` または `"top-level"` に設定します。
- `compat.supportedReasoningEfforts`: モデル単位の OpenAI 互換 reasoning effort リスト。実際に受け入れるカスタムエンドポイントには `"xhigh"` を含めます。そうすると OpenClaw は、その設定済みプロバイダー/モデルに対して、コマンドメニュー、Gateway セッション行、セッションパッチ検証、エージェント CLI 検証、`llm-task` 検証で `/think xhigh` を公開します。バックエンドが標準レベルに対してプロバイダー固有の値を求める場合は、`compat.reasoningEffortMap` を使用します。
- `params.preserveThinking`: preserved thinking 用の Z.AI 専用オプトイン。有効で thinking がオンの場合、OpenClaw は `thinking.clear_thinking: false` を送信し、以前の `reasoning_content` を再生します。[Z.AI thinking and preserved thinking](/ja-JP/providers/zai#thinking-and-preserved-thinking) を参照してください。
- `agentRuntime`: デフォルトの低レベルエージェントランタイムポリシー。ID を省略すると OpenClaw Pi がデフォルトになります。組み込み PI ハーネスを強制するには `id: "pi"` を使用し、登録済み Plugin ハーネスにサポート対象モデルを要求させ、一致しない場合に PI を使用するには `id: "auto"` を使用し、そのハーネスを必須にするには `id: "codex"` のような登録済みハーネス ID を使用し、サポート対象 CLI バックエンドエイリアスとしては `id: "claude-cli"` などを使用します。明示的な Plugin ランタイムは、ハーネスが利用できない、または失敗した場合に失敗終了します。モデル参照は `provider/model` として正規形式に保ってください。Codex、Claude CLI、Gemini CLI、およびその他の実行バックエンドは、従来のランタイムプロバイダープレフィックスではなく、ランタイム設定を通じて選択してください。これがプロバイダー/モデル選択とどう異なるかは [Agent runtimes](/ja-JP/concepts/agent-runtimes) を参照してください。
- これらのフィールドを変更する設定ライター (例: `/models set`、`/models set-image`、フォールバックの追加/削除コマンド) は、正規のオブジェクト形式で保存し、可能な場合は既存のフォールバックリストを保持します。
- `maxConcurrent`: セッション間での最大並列エージェント実行数 (各セッションは引き続き直列化されます)。デフォルト: 4。

### `agents.defaults.agentRuntime`

`agentRuntime` は、エージェントターンを実行する低レベル executor を制御します。ほとんどの
デプロイでは、デフォルトの OpenClaw Pi ランタイムを維持するべきです。バンドルされた Codex app-server ハーネスのように、信頼済み
Plugin がネイティブハーネスを提供する場合、または Claude CLI のようなサポート対象 CLI バックエンドを使いたい場合に使用します。メンタル
モデルについては、[Agent runtimes](/ja-JP/concepts/agent-runtimes) を参照してください。

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
- `id: "auto"` は、登録済み Plugin ハーネスにサポート対象ターンを要求させ、一致するハーネスがない場合は PI を使用します。`id: "codex"` のような明示的な Plugin ランタイムは、そのハーネスを必須とし、利用できない、または失敗した場合に失敗終了します。
- 環境による上書き: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は、そのプロセスの `id` を上書きします。
- Codex 専用デプロイでは、`model: "openai/gpt-5.5"` と `agentRuntime.id: "codex"` を設定します。
- Claude CLI デプロイでは、`model: "anthropic/claude-opus-4-7"` と `agentRuntime.id: "claude-cli"` の組み合わせを推奨します。従来の `claude-cli/claude-opus-4-7` モデル参照は互換性のために引き続き機能しますが、新しい設定ではプロバイダー/モデル選択を正規形式に保ち、実行バックエンドを `agentRuntime.id` に置くべきです。
- 古いランタイムポリシーキーは、`openclaw doctor --fix` によって `agentRuntime` に書き換えられます。
- ハーネス選択は、最初の埋め込み実行後にセッション ID ごとに固定されます。設定/env の変更は、新規セッションまたはリセットされたセッションに影響し、既存の transcript には影響しません。transcript 履歴があるが記録済みの固定がない従来セッションは、PI 固定として扱われます。`/status` は有効なランタイムを報告します。例: `Runtime: OpenClaw Pi Default` または `Runtime: OpenAI Codex`。
- これはテキストのエージェントターン実行のみを制御します。メディア生成、vision、PDF、音楽、動画、TTS は引き続きそれぞれのプロバイダー/モデル設定を使用します。

**組み込みエイリアスの短縮形** (`agents.defaults.models` にモデルがある場合にのみ適用):

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

Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、thinking モードを自動的に有効にします。
Z.AI モデルは、ツール呼び出しのストリーミング用に、デフォルトで `tool_stream` を有効にします。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` thinking を使用します。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行（ツール呼び出しなし）向けの任意の CLI バックエンド。API プロバイダーが失敗した場合のバックアップとして有用です。

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

OpenClaw が組み立てたシステムプロンプト全体を固定文字列に置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはエージェントごと（`agents.list[].systemPromptOverride`）に設定します。エージェントごとの値が優先されます。空、または空白のみの値は無視されます。制御されたプロンプト実験に有用です。

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

モデルファミリーごとに適用される、プロバイダーに依存しないプロンプトオーバーレイ。GPT-5 ファミリーのモデル ID は、プロバイダーをまたいで共有される動作契約を受け取ります。`personality` は、フレンドリーな対話スタイル層のみを制御します。

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
- 共有設定が未設定の場合、従来の `plugins.entries.openai.config.personality` も引き続き読み取られます。

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
- `includeSystemPromptSection`: false の場合、システムプロンプトから Heartbeat セクションを省略し、ブートストラップコンテキストへの `HEARTBEAT.md` の注入をスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。
- `timeoutSeconds`: Heartbeat エージェントターンが中止されるまでに許可される最大時間（秒）。未設定のままにすると `agents.defaults.timeoutSeconds` が使用されます。
- `directPolicy`: ダイレクト/DM 配信ポリシー。`allow`（デフォルト）はダイレクトターゲット配信を許可します。`block` はダイレクトターゲット配信を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat 実行は軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は、以前の会話履歴のない新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat ごとのトークンコストを約 100K から約 2〜5K トークンに削減します。
- `skipWhenBusy`: true の場合、Heartbeat 実行は追加のビジーなレーン、つまりサブエージェントまたはネストされたコマンド作業でも延期されます。このフラグがなくても、Cron レーンは常に Heartbeat を延期します。
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
- `provider`: 登録済み Compaction プロバイダー Plugin の ID。設定されている場合、組み込み LLM 要約の代わりにプロバイダーの `summarize()` が呼び出されます。失敗時は組み込みにフォールバックします。プロバイダーを設定すると、`mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: 単一の Compaction 操作について、OpenClaw が中止するまでに許可される最大秒数。デフォルト: `900`。
- `keepRecentTokens`: 最新のトランスクリプト末尾を逐語的に保持するための Pi カットポイント予算。明示的に設定されている場合、手動の `/compact` はこれを尊重します。それ以外の場合、手動 Compaction はハードチェックポイントです。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction 要約中に組み込みの不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用される、任意のカスタム識別子保持テキスト。
- `qualityGuard`: safeguard 要約に対する、不正形式出力時の再試行チェック。safeguard モードではデフォルトで有効です。監査をスキップするには `enabled: false` を設定します。
- `midTurnPrecheck`: 任意の Pi ツールループ圧力チェック。`enabled: true` の場合、OpenClaw はツール結果が追加された後、次のモデル呼び出しの前にコンテキスト圧力をチェックします。コンテキストが収まらなくなった場合、プロンプトを送信する前に現在の試行を中止し、既存の事前チェック回復パスを再利用してツール結果を切り詰めるか、Compaction して再試行します。`default` と `safeguard` の両方の Compaction モードで動作します。デフォルト: 無効。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。再注入を無効にするには `[]` を設定します。未設定、またはそのデフォルトペアに明示的に設定されている場合、従来のフォールバックとして古い `Every Session`/`Safety` 見出しも受け入れられます。
- `model`: Compaction 要約専用の任意の `provider/model-id` オーバーライド。メインセッションでは 1 つのモデルを維持しつつ、Compaction 要約を別のモデルで実行したい場合に使用します。未設定の場合、Compaction はセッションのプライマリモデルを使用します。
- `maxActiveTranscriptBytes`: アクティブな JSONL がしきい値を超えたとき、実行前に通常のローカル Compaction をトリガーする任意のバイトしきい値（`number` または `"20mb"` のような文字列）。Compaction 成功時に、より小さな後続トランスクリプトへローテーションできるように `truncateAfterCompaction` が必要です。未設定または `0` の場合は無効です。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時に、ユーザーへ短い通知（例: 「コンテキストを Compact しています...」および「Compaction が完了しました」）を送信します。Compaction をサイレントに保つため、デフォルトでは無効です。
- `memoryFlush`: 自動 Compaction の前に耐久的なメモリーを保存する、サイレントなエージェント的ターン。このハウスキーピングターンをローカルモデル上に留めたい場合は、`model` を `ollama/qwen3:8b` のような正確なプロバイダー/モデルに設定します。このオーバーライドは、アクティブセッションのフォールバックチェーンを継承しません。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから**古いツール結果**をプルーニングします。ディスク上のセッション履歴は変更しません。

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

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` はプルーニングパスを有効にします。
- `ttl` は、プルーニングを再実行できる頻度（最後のキャッシュ接触後）を制御します。
- プルーニングはまず大きすぎるツール結果をソフトトリムし、その後、必要に応じて古いツール結果をハードクリアします。

**ソフトトリム**は先頭と末尾を保持し、中央に `...` を挿入します。

**ハードクリア**はツール結果全体をプレースホルダーに置き換えます。

注記:

- 画像ブロックはトリム/クリアされません。
- 比率は文字ベース（概算）であり、正確なトークン数ではありません。
- `keepLastAssistants` より少ない assistant メッセージしか存在しない場合、プルーニングはスキップされます。

</Accordion>

動作の詳細については、[セッションプルーニング](/ja-JP/concepts/session-pruning) を参照してください。

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

- Telegram 以外のチャンネルでは、ブロック返信を有効にするために明示的な `*.blockStreaming: true` が必要です。
- チャンネルオーバーライド: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダム化された一時停止。`natural` = 800〜2500ms。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細については、[ストリーミング](/ja-JP/concepts/streaming) を参照してください。

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

- デフォルト: 直接チャット/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- セッションごとの上書き: `session.typingMode`、`session.typingIntervalSeconds`。

[入力インジケーター](/ja-JP/concepts/typing-indicators)を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みエージェント用の任意のサンドボックス化。完全なガイドは[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

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

- `docker`: ローカル Docker ランタイム (デフォルト)
- `ssh`: 汎用 SSH ベースのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` が選択されている場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド (デフォルト: `ssh`)
- `workspaceRoot`: スコープごとのワークスペースに使用する絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が実行時に一時ファイルへ具体化するインライン内容または SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH のホストキー・ポリシーノブ

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先されます
- `certificateData` は `certificateFile` より優先されます
- `knownHostsData` は `knownHostsFile` より優先されます
- SecretRef ベースの `*Data` 値は、サンドボックスセッション開始前にアクティブなシークレットランタイムスナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成後にリモートワークスペースを一度シードします
- その後、リモート SSH ワークスペースを正準として維持します
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングします
- リモートの変更をホストへ自動的に同期しません
- サンドボックスブラウザーコンテナをサポートしません

**ワークスペースアクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのサンドボックスワークスペース
- `ro`: `/workspace` のサンドボックスワークスペース、`/agent` に読み取り専用でマウントされたエージェントワークスペース
- `rw`: `/workspace` に読み書き可能でマウントされたエージェントワークスペース

**スコープ:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース (デフォルト)
- `shared`: 共有コンテナとワークスペース (セッション間の分離なし)

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

- `mirror`: exec の前にローカルからリモートへシードし、exec の後に同期して戻します。ローカルワークスペースを正準のままにします
- `remote`: サンドボックス作成時にリモートを一度シードし、その後はリモートワークスペースを正準として維持します

`remote` モードでは、OpenClaw の外部で行われたホストローカルの編集は、シード手順の後にサンドボックスへ自動的に同期されません。
トランスポートは OpenShell サンドボックスへの SSH ですが、Plugin がサンドボックスのライフサイクルと任意のミラー同期を所有します。

**`setupCommand`** はコンテナ作成後に一度実行されます (`sh -lc` 経由)。ネットワーク送信、書き込み可能なルート、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントが外部アクセスを必要とする場合は `"bridge"` (またはカスタムブリッジネットワーク) に設定してください。
`"host"` はブロックされます。`"container:<id>"` は、`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を明示的に設定しない限り、デフォルトでブロックされます (非常時用)。

**受信添付ファイル** はアクティブなワークスペース内の `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルバインドとエージェントごとのバインドはマージされます。

**サンドボックス化されたブラウザー** (`sandbox.browser.enabled`): コンテナ内の Chromium + CDP。noVNC URL がシステムプロンプトに注入されます。`openclaw.json` の `browser.enabled` は不要です。
noVNC オブザーバーアクセスはデフォルトで VNC 認証を使用し、OpenClaw は共有 URL でパスワードを公開する代わりに短命のトークン URL を発行します。

- `allowHostControl: false` (デフォルト) は、サンドボックス化されたセッションがホストブラウザーを対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser` (専用ブリッジネットワーク) です。グローバルブリッジ接続を明示的に必要とする場合にのみ `bridge` に設定してください。
- `cdpSourceRange` は任意で、コンテナ境界での CDP 入力を CIDR 範囲 (例: `172.21.0.1/32`) に制限します。
- `sandbox.browser.binds` は、追加のホストディレクトリをサンドボックスブラウザーコンテナだけにマウントします。設定されている場合 (`[]` を含む)、ブラウザーコンテナでは `docker.binds` を置き換えます。
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
  - `--disable-extensions` (デフォルトで有効)
  - `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu` は
    デフォルトで有効で、WebGL/3D の使用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効にできます。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローが拡張機能に依存している場合に拡張機能を再度有効にします。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    デフォルトプロセス制限を使用するには `0` を設定します。
  - `noSandbox` が有効な場合は、さらに `--no-sandbox`。
  - デフォルトはコンテナイメージのベースラインです。コンテナのデフォルトを変更するには、カスタム
    エントリーポイントを備えたカスタムブラウザーイメージを使用してください。

</Accordion>

ブラウザーのサンドボックス化と `sandbox.docker.binds` は Docker 専用です。

イメージをビルドします (ソースチェックアウトから):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

ソースチェックアウトなしの npm インストールでは、インライン `docker build` コマンドについて[サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup)を参照してください。

### `agents.list` (エージェントごとの上書き)

`agents.list[].tts` を使用して、エージェントに独自の TTS プロバイダー、音声、モデル、
スタイル、または自動 TTS モードを与えます。エージェントブロックはグローバルな
`messages.tts` に対してディープマージされるため、共有認証情報は 1 か所に置いたまま、個々の
エージェントは必要な音声フィールドまたはプロバイダーフィールドだけを上書きできます。アクティブなエージェントの
上書きは、自動読み上げ返信、`/tts audio`、`/tts status`、および
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

- `id`: 安定したエージェント ID（必須）。
- `default`: 複数設定されている場合は、最初のものが優先されます（警告がログに記録されます）。何も設定されていない場合は、リストの最初のエントリがデフォルトです。
- `model`: 文字列形式では、モデルフォールバックなしの厳密なエージェントごとのプライマリを設定します。オブジェクト形式 `{ primary }` も、`fallbacks` を追加しない限り厳密です。`{ primary, fallbacks: [...] }` を使用すると、そのエージェントをフォールバックにオプトインできます。`{ primary, fallbacks: [] }` を使用すると、厳密な動作を明示できます。`primary` だけを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトのフォールバックを引き継ぎます。
- `params`: `agents.defaults.models` で選択されたモデルエントリにマージされる、エージェントごとのストリームパラメータです。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有の上書きに使用します。
- `tts`: 任意のエージェントごとのテキスト読み上げ上書きです。このブロックは `messages.tts` にディープマージされるため、共有プロバイダー認証情報とフォールバックポリシーは `messages.tts` に保持し、ここではプロバイダー、音声、モデル、スタイル、自動モードなどのペルソナ固有の値だけを設定します。
- `skills`: 任意のエージェントごとの Skills 許可リストです。省略すると、設定されている場合はエージェントが `agents.defaults.skills` を継承します。明示的なリストはデフォルトとマージされず置き換えられ、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェントごとのデフォルト思考レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）です。メッセージごとまたはセッションの上書きが設定されていない場合、このエージェントについて `agents.defaults.thinkingDefault` を上書きします。選択されたプロバイダー/モデルプロファイルが有効な値を制御します。Google Gemini では、`adaptive` によりプロバイダー所有の動的思考が維持されます（Gemini 3/3.1 では `thinkingLevel` を省略、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 任意のエージェントごとのデフォルト推論表示（`on | off | stream`）です。メッセージごとまたはセッションの推論上書きが設定されていない場合、このエージェントについて `agents.defaults.reasoningDefault` を上書きします。
- `fastModeDefault`: 任意のエージェントごとの高速モードのデフォルト（`true | false`）です。メッセージごとまたはセッションの高速モード上書きが設定されていない場合に適用されます。
- `agentRuntime`: 任意のエージェントごとの低レベルランタイムポリシー上書きです。`{ id: "codex" }` を使用すると、他のエージェントは `auto` モードのデフォルト PI フォールバックを維持したまま、1 つのエージェントだけを Codex 専用にできます。
- `runtime`: 任意のエージェントごとのランタイム記述子です。エージェントが ACP ハーネスセッションをデフォルトにする必要がある場合は、`runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）とともに `type: "acp"` を使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを派生します。`emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns` を派生します。
- `subagents.allowAgents`: 明示的な `sessions_spawn.agentId` ターゲットのためのエージェント ID の許可リスト（`["*"]` = 任意、デフォルト: 同じエージェントのみ）。自己を対象にする `agentId` 呼び出しを許可する必要がある場合は、リクエスター ID を含めます。
- サンドボックス継承ガード: リクエスターセッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します。デフォルト: false）。

---

## マルチエージェントルーティング

1 つの Gateway 内で複数の分離されたエージェントを実行します。[マルチエージェント](/ja-JP/concepts/multi-agent)を参照してください。

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

- `type`（任意）: 通常のルーティングには `route`（type が未指定の場合は route がデフォルト）、永続 ACP 会話バインディングには `acp`。
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のアカウント、省略 = デフォルトアカウント）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。チャンネル固有）
- `acp`（任意。`type: "acp"` の場合のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致、peer/guild/team なし）
5. `match.accountId: "*"`（チャンネル全体）
6. デフォルトエージェント

各階層内では、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は正確な会話 ID（`match.channel` + account + `match.peer.id`）で解決し、上記のルートバインディング階層順序は使用しません。

### エージェントごとのアクセスプロファイル

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

<Accordion title="ファイルシステムアクセスなし（メッセージのみ）">

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

- **`scope`**: グループチャットコンテキストの基本セッショングループ化戦略。
  - `per-sender`（デフォルト）: 各送信者はチャネルコンテキスト内で分離されたセッションを取得します。
  - `global`: チャネルコンテキスト内のすべての参加者が単一のセッションを共有します（共有コンテキストを意図している場合にのみ使用）。
- **`dmScope`**: DM のグループ化方法。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャネル + 送信者ごとに分離します（マルチユーザーの受信箱に推奨）。
  - `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します（マルチアカウントに推奨）。
- **`identityLinks`**: クロスチャネルのセッション共有のために、正規 ID をプロバイダー接頭辞付きピアにマッピングします。`/dock_discord` などの dock コマンドは、同じマップを使用してアクティブセッションの返信経路を別のリンク済みチャネルピアへ切り替えます。[チャネルドッキング](/ja-JP/concepts/channel-docking)を参照してください。
- **`reset`**: 主要なリセットポリシー。`daily` はローカル時刻の `atHour` にリセットします。`idle` は `idleMinutes` 後にリセットします。両方が設定されている場合は、先に期限切れになった方が優先されます。日次リセットの鮮度はセッション行の `sessionStartedAt` を使用し、アイドルリセットの鮮度は `lastInteractionAt` を使用します。heartbeat、cron ウェイクアップ、exec 通知、gateway bookkeeping などのバックグラウンド/システムイベント書き込みは `updatedAt` を更新できますが、日次/アイドルセッションを新鮮な状態に保つわけではありません。
- **`resetByType`**: タイプ別の上書き（`direct`、`group`、`thread`）。レガシーの `dm` は `direct` のエイリアスとして受け付けられます。
- **`mainKey`**: レガシーフィールド。ランタイムはメインのダイレクトチャットバケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: エージェント間交換中のエージェント間の最大返信ターン数（整数、範囲: `0`–`5`）。`0` はピンポン連鎖を無効化します。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、レガシーの `dm` エイリアスあり）、`keyPrefix`、または `rawKeyPrefix` でマッチします。最初の拒否が優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを出力します。`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの年齢カットオフ（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内の最大エントリ数（デフォルト `500`）。ランタイムは、本番規模の上限向けに小さな高水位バッファを使ってバッチクリーンアップを書き込みます。`openclaw sessions cleanup --enforce` は上限を即時適用します。
  - `rotateBytes`: 非推奨で無視されます。`openclaw doctor --fix` は古い設定からこれを削除します。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter` です。無効にするには `false` に設定します。
  - `maxDiskBytes`: オプションのセッションディレクトリのディスク予算。`warn` モードでは警告をログに記録し、`enforce` モードでは最も古いアーティファクト/セッションから削除します。
  - `highWaterBytes`: 予算クリーンアップ後のオプションの目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッド束縛セッション機能のグローバルデフォルト。
  - `enabled`: マスターのデフォルトスイッチ（プロバイダーは上書き可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時の自動アンフォーカスのデフォルト時間（`0` は無効化。プロバイダーは上書き可能）
  - `maxAgeHours`: ハードな最大年齢のデフォルト時間（`0` は無効化。プロバイダーは上書き可能）
  - `spawnSessions`: `sessions_spawn` と ACP スレッドスポーンからスレッド束縛ワークセッションを作成するためのデフォルトゲート。スレッド束縛が有効な場合、デフォルトは `true` です。プロバイダー/アカウントは上書き可能です。
  - `defaultSpawnContext`: スレッド束縛スポーンのデフォルトネイティブサブエージェントコンテキスト（`"fork"` または `"isolated"`）。デフォルトは `"fork"` です。

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

### レスポンス接頭辞

チャンネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

解決順序（より具体的なものが優先）: アカウント → チャンネル → グローバル。`""` は無効化し、カスケードを停止します。`"auto"` は `[{identity.name}]` から導出します。

**テンプレート変数:**

| 変数              | 説明                     | 例                          |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | 短いモデル名             | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子       | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名           | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル         | `high`, `low`, `off`        |
| `{identity.name}` | エージェントID名         | (`"auto"` と同じ)           |

変数は大文字と小文字を区別しません。`{think}` は `{thinkingLevel}` の別名です。

### Ackリアクション

- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外の場合は `"👀"` です。無効化するには `""` を設定します。
- チャンネルごとのオーバーライド: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- 解決順序: アカウント → チャンネル → `messages.ackReaction` → IDフォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram、WhatsApp、BlueBubbles など、リアクション対応チャンネルで返信後にAckを削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegramでライフサイクルステータスリアクションを有効にします。
  SlackとDiscordでは、未設定の場合、Ackリアクションがアクティブなときにステータスリアクションが有効のままになります。
  Telegramでは、ライフサイクルステータスリアクションを有効にするには明示的に `true` に設定します。

### 受信デバウンス

同じ送信者からの短時間に連続するテキストのみのメッセージを、1回のエージェントターンにまとめます。メディア/添付ファイルは即座にフラッシュされます。制御コマンドはデバウンスをバイパスします。

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

- `auto` はデフォルトの自動TTSモードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` でローカル設定をオーバーライドでき、`/tts status` は有効な状態を表示します。
- `summaryModel` は自動要約用の `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（オプトイン）です。
- APIキーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- 同梱の音声プロバイダーはPlugin所有です。`plugins.allow` が設定されている場合は、使用したい各TTSプロバイダーPluginを含めてください。たとえば Edge TTS には `microsoft` を含めます。従来の `edge` プロバイダーIDは `microsoft` の別名として受け付けられます。
- `providers.openai.baseUrl` は OpenAI TTSエンドポイントをオーバーライドします。解決順序は、config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `providers.openai.baseUrl` がOpenAI以外のエンドポイントを指している場合、OpenClaw はそれをOpenAI互換TTSサーバーとして扱い、モデル/音声の検証を緩和します。

---

## Talk

Talkモード（macOS/iOS/Android）のデフォルト。

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

- 複数のTalkプロバイダーが設定されている場合、`talk.provider` は `talk.providers` 内のキーと一致している必要があります。
- 従来のフラットなTalkキー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性のためだけに用意されています。永続化されたconfigを `talk.providers.<provider>` に書き換えるには `openclaw doctor --fix` を実行してください。
- 音声IDは `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` はプレーンテキスト文字列またはSecretRefオブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk APIキーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talkディレクティブでわかりやすい名前を使用できます。
- `providers.mlx.modelId` は、macOSローカルMLXヘルパーで使用するHugging Faceリポジトリを選択します。省略した場合、macOSは `mlx-community/Soprano-80M-bf16` を使用します。
- macOS MLX再生は、存在する場合は同梱の `openclaw-mlx-tts` ヘルパーを通じて実行され、そうでない場合は `PATH` 上の実行可能ファイルを使用します。`OPENCLAW_MLX_TTS_BIN` は開発用にヘルパーパスをオーバーライドします。
- `speechLocale` は、iOS/macOS Talk音声認識で使用するBCP 47ロケールIDを設定します。デバイスのデフォルトを使用するには未設定のままにします。
- `silenceTimeoutMs` は、ユーザーの無音後にTalkモードがトランスクリプトを送信するまで待機する時間を制御します。未設定の場合、プラットフォームのデフォルトの一時停止ウィンドウ（`macOSおよびAndroidでは700 ms、iOSでは900 ms`）を維持します。

---

## 関連

- [構成リファレンス](/ja-JP/gateway/configuration-reference) — その他すべてのconfigキー
- [構成](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [構成例](/ja-JP/gateway/configuration-examples)
