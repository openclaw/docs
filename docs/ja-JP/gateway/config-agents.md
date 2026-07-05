---
read_when:
    - エージェントのデフォルトを調整する（モデル、思考、ワークスペース、Heartbeat、メディア、Skills）
    - 複数エージェントのルーティングとバインディングの設定
    - セッション、メッセージ配信、トークモードの動作調整
summary: エージェントのデフォルト、マルチエージェントルーティング、セッション、メッセージ、talk 設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-07-05T11:18:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75ba6a72eec05731054dd1f7d04cee6f50124375e022d1a51f75e87a453ea3f2
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、`talk.*` 配下のエージェントスコープの設定キー。チャンネル、ツール、Gateway ランタイム、その他のトップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `OPENCLAW_WORKSPACE_DIR` が設定されている場合はそれ、それ以外は `~/.openclaw/workspace`（または `OPENCLAW_PROFILE` がデフォルト以外のプロファイルに設定されている場合は `~/.openclaw/workspace-<profile>`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明示的な `agents.defaults.workspace` 値は
`OPENCLAW_WORKSPACE_DIR` より優先されます。設定にそのパスを書き込みたくない場合に、
デフォルトエージェントをマウント済みワークスペースに向けるには環境変数を使用してください。

### `agents.defaults.repoRoot`

システムプロンプトの Runtime 行に表示される任意のリポジトリルート。未設定の場合、OpenClaw はワークスペースから上方向にたどって自動検出します。

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

- デフォルトで Skills を制限しない場合は `agents.defaults.skills` を省略します。
- デフォルトを継承するには `agents.list[].skills` を省略します。
- Skills なしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストはそのエージェントの最終セットであり、
  デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

ワークスペースブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

必須ブートストラップファイル（`AGENTS.md`、`TOOLS.md`、`BOOTSTRAP.md`）は引き続き書き込みつつ、選択した任意のワークスペースファイルの作成をスキップします。有効な値: `SOUL.md`、`USER.md`、`HEARTBEAT.md`、`IDENTITY.md`。

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

ワークスペースブートストラップファイルをシステムプロンプトに注入するタイミングを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（完了済みのアシスタント応答の後）ではワークスペースブートストラップの再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と Compaction 後の再試行では引き続きコンテキストが再構築されます。
- `"never"`: すべてのターンでワークスペースブートストラップとコンテキストファイル注入を無効にします。これは、自身のプロンプトライフサイクルを完全に所有するエージェント（カスタムコンテキストエンジン、独自のコンテキストを構築するネイティブランタイム、またはブートストラップ不要の特殊なワークフロー）にのみ使用してください。Heartbeat と Compaction リカバリターンでも注入はスキップされます。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

エージェントごとの上書き: `agents.list[].contextInjection`。省略された値は
`agents.defaults.contextInjection` を継承します。

### `agents.defaults.bootstrapMaxChars`

切り詰め前のワークスペースブートストラップファイルごとの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

エージェントごとの上書き: `agents.list[].bootstrapMaxChars`。省略された値は
`agents.defaults.bootstrapMaxChars` を継承します。

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペースブートストラップファイル全体で注入される合計最大文字数。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

エージェントごとの上書き: `agents.list[].bootstrapTotalMaxChars`。省略された値は
`agents.defaults.bootstrapTotalMaxChars` を継承します。

### エージェントごとのブートストラッププロファイル上書き

1 つのエージェントが共有デフォルトとは異なるプロンプト注入動作を必要とする場合は、エージェントごとのブートストラッププロファイル上書きを使用します。省略されたフィールドは
`agents.defaults` から継承します。

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップコンテキストが切り詰められたときの、エージェントに見えるシステムプロンプト通知を制御します。
デフォルト: `"always"`。

- `"off"`: 切り詰め通知テキストをシステムプロンプトに注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに、簡潔な通知を 1 回注入します。
- `"always"`: 切り詰めが存在する場合、実行ごとに簡潔な通知を注入します（推奨）。

詳細な raw/注入済み件数と設定調整フィールドは、コンテキスト/ステータスレポートやログなどの診断に残ります。通常の WebChat ユーザー/ランタイムコンテキストには、簡潔なリカバリ通知のみが渡されます。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### コンテキスト予算の所有権マップ

OpenClaw には複数の大容量プロンプト/コンテキスト予算があり、それらは 1 つの汎用ノブにまとめず、サブシステムごとに意図的に分割されています。

| 予算                                                           | 対象                                                                                                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 通常のワークスペースブートストラップ注入                                                                                                                        |
| `agents.defaults.startupContext.*`                             | 最近の日次 `memory/*.md` ファイルを含む、1 回限りのリセット/起動モデル実行プレリュード。素のチャット `/new` と `/reset` はモデルを呼び出さずに確認応答されます |
| `skills.limits.*`                                              | システムプロンプトに注入されるコンパクトな Skills リスト                                                                                                       |
| `agents.defaults.contextLimits.*`                              | 境界付きランタイム抜粋と、注入されるランタイム所有ブロック                                                                                                      |
| `memory.qmd.limits.*`                                          | インデックス済みメモリ検索スニペットと注入サイズ                                                                                                                |

対応するエージェントごとの上書き:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

リセット/起動モデル実行時に注入される初回ターン起動プレリュードを制御します。
素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずにリセットを確認応答するため、
このプレリュードを読み込みません。

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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: 切り詰めメタデータと継続通知が追加される前の、デフォルトの `memory_get` 抜粋上限。
- `memoryGetDefaultLines`: `lines` が省略された場合の、デフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果とオーバーフローリカバリに使用される、高度なライブツール結果上限。モデルコンテキストの自動上限を使う場合は未設定のままにします:
  100K トークン未満では `16000` 文字、100K+ トークンでは `32000` 文字、200K+ トークンでは `64000`
  文字です。長コンテキストモデルでは `1000000` までの明示値が受け付けられますが、
  有効上限は引き続きモデルコンテキストウィンドウのおよそ 30% に制限されます。`openclaw doctor --deep` は有効上限を出力し、
  doctor は明示的な上書きが古い、または効果がない場合にのみ警告します。
- `postCompactionMaxChars`: Compaction 後のリフレッシュ注入中に使用される AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブに対するエージェントごとの上書き。省略されたフィールドは
`agents.defaults.contextLimits` から継承します。

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

システムプロンプトに注入されるコンパクトな Skills リストのグローバル上限。これはオンデマンドでの `SKILL.md` ファイル読み取りには影響しません。

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills プロンプト予算に対するエージェントごとの上書き。

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前に、トランスクリプト/ツール画像ブロック内の画像の最長辺に適用される最大ピクセルサイズ。
デフォルト: `1200`。

低い値は通常、スクリーンショットが多い実行で vision トークン使用量とリクエストペイロードサイズを削減します。
高い値はより多くの視覚的詳細を保持します。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ファイルパス、URL、メディア参照から読み込まれた画像に対する画像ツールの圧縮/詳細設定。
デフォルト: `auto`。

OpenClaw は選択された画像モデルに合わせてリサイズ段階を調整します。たとえば、Claude Opus 4.8、OpenAI GPT-5.5、Qwen VL、ホスト型 Llama 4 vision モデルは、古い/デフォルトの高詳細 vision パスより大きな画像を使用できます。一方で、複数画像のターンでは、トークンとレイテンシのコストを制御するために `auto` モードでより積極的に圧縮されます。

値:

- `auto`: モデル制限と画像数に合わせて調整します。
- `efficient`: トークンとバイト使用量を抑えるため、小さめの画像を優先します。
- `balanced`: 標準的な中間のリサイズ段階を使用します。
- `high`: スクリーンショット、図、ドキュメント画像の詳細をより多く保持します。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキスト用のタイムゾーン（メッセージタイムスタンプ用ではありません）。ホストのタイムゾーンにフォールバックします。

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
      utilityModel: "openai/gpt-5.4-mini",
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のどちらかを受け付けます。
  - 文字列形式はプライマリモデルのみを設定します。
  - オブジェクト形式はプライマリに加えて、順序付きのフェイルオーバーモデルを設定します。
- `utilityModel`: 短い内部タスク用の任意の `provider/model` 参照またはエイリアスです。現在は、生成される Control UI セッションタイトル、Telegram DM トピックタイトル、Discord 自動スレッドタイトルに使われています。これらのタスクは未設定の場合、エージェントのプライマリモデルにフォールバックします。`agents.list[].utilityModel` はデフォルトを上書きし、操作固有のモデル上書きはその両方より優先されます。ユーティリティタスクは個別のモデル呼び出しを行い、タスク固有の内容を選択されたモデルプロバイダーへ送信します。ダッシュボードのタイトル生成では、最初の非コマンドメッセージの先頭 1,000 文字までが送信されます。コストとデータ取り扱い要件に合うプロバイダーを選んでください。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のどちらかを受け付けます。
  - `image` ツールパスで vision モデル設定として使われます。
  - 選択済みまたはデフォルトのモデルが画像入力を受け付けられない場合のフォールバックルーティングにも使われます。
  - 明示的な `provider/model` 参照を推奨します。互換性のためベア ID も受け付けます。ベア ID が `models.providers.*.models` 内の設定済み画像対応エントリと一意に一致する場合、OpenClaw はそれをそのプロバイダーに修飾します。設定済みの一致が曖昧な場合は、明示的なプロバイダープレフィックスが必要です。
- `imageGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のどちらかを受け付けます。
  - 共有の画像生成機能と、画像を生成する将来のツール/Plugin サーフェスで使われます。
  - 典型的な値: ネイティブ Gemini 画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-2`、透過背景の OpenAI PNG/WebP 出力には `openai/gpt-image-1.5`。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証も設定してください（例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` / `openai/gpt-image-1.5` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み画像生成プロバイダーをプロバイダー ID 順に試します。
- `musicGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のどちらかを受け付けます。
  - 共有の音楽生成機能と組み込みの `music_generate` ツールで使われます。
  - 典型的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み音楽生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のどちらかを受け付けます。
  - 共有の動画生成機能と組み込みの `video_generate` ツールで使われます。
  - 典型的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み動画生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
  - 公式 Qwen 動画生成 Plugin は、最大で出力動画 1 件、入力画像 1 件、入力動画 4 件、長さ 10 秒、およびプロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のどちらかを受け付けます。
  - `pdf` ツールのモデルルーティングで使われます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルト PDF サイズ上限です。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮されるデフォルトの最大ページ数です。
- `verboseDefault`: エージェントのデフォルト verbose レベルです。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `toolProgressDetail`: `/verbose` ツール要約と進行中ドラフトのツール行の詳細モードです。値: `"explain"`（デフォルト、コンパクトな人間向けラベル）または `"raw"`（利用可能な場合は生のコマンド/詳細を追加）。エージェントごとの `agents.list[].toolProgressDetail` はこのデフォルトを上書きします。
- `reasoningDefault`: エージェントのデフォルト推論可視性です。値: `"off"`、`"on"`、`"stream"`。エージェントごとの `agents.list[].reasoningDefault` はこのデフォルトを上書きします。設定済みの推論デフォルトは、メッセージごとまたはセッションごとの推論上書きが設定されていない場合にのみ、所有者、承認済み送信者、または operator-admin gateway コンテキストに適用されます。
- `elevatedDefault`: エージェントのデフォルト elevated-output レベルです。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: OpenAI API キーまたは Codex OAuth アクセス用の `openai/gpt-5.5`）です。プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に対して一意の設定済みプロバイダー一致を試し、その後でのみ設定済みデフォルトプロバイダーにフォールバックします（非推奨の互換動作のため、明示的な `provider/model` を推奨します）。そのプロバイダーが設定済みデフォルトモデルをもう公開していない場合、OpenClaw は古い削除済みプロバイダーデフォルトを表面化する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。
- `models`: `/model` 用に設定されたモデルカタログと許可リストです。各エントリには `alias`（ショートカット）と `params`（プロバイダー固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` ルーティング、`chat_template_kwargs`、`extra_body`/`extraBody`）を含められます。
  - `"openai/*": {}` や `"vllm/*": {}` のような `provider/*` エントリを使うと、すべてのモデル ID を手動で列挙しなくても、選択したプロバイダーで検出されたすべてのモデルを表示できます。
  - そのプロバイダーで動的に検出されるすべてのモデルに同じランタイムを使わせる場合は、`provider/*` エントリに `agentRuntime` を追加します。正確な `provider/model` ランタイムポリシーは引き続きワイルドカードより優先されます。
  - 安全な編集: エントリを追加するには `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使います。`config set` は、`--replace` を渡さない限り、既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダー単位の configure/オンボーディングフローは、選択されたプロバイダーモデルをこのマップにマージし、すでに設定済みの無関係なプロバイダーを保持します。
  - 直接 OpenAI Responses モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management` の注入を止めるには `params.responsesServerCompaction: false` を使い、しきい値を上書きするには `params.responsesCompactThreshold` を使います。[OpenAI サーバー側 Compaction](/ja-JP/providers/openai#advanced-configuration) を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルトプロバイダーパラメーターです。`agents.defaults.params` で設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）は `agents.defaults.models["provider/model"].params`（モデルごと）で上書きされ、その後 `agents.list[].params`（一致するエージェント ID）がキーごとに上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `models.providers.openrouter.params.provider`: OpenRouter 全体のデフォルトプロバイダールーティングポリシーです。OpenClaw はこれを OpenRouter のリクエスト `provider` オブジェクトへ転送します。モデルごとの `agents.defaults.models["openrouter/<model>"].params.provider` とエージェントパラメーターはキーごとに上書きします。[OpenRouter プロバイダールーティング](/ja-JP/providers/openrouter#advanced-configuration) を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシ向けの `api: "openai-completions"` リクエスト本文にマージされる高度なパススルー JSON です。生成されたリクエストキーと衝突した場合は、追加本文が優先されます。非ネイティブ completions ルートでは、その後も OpenAI 専用の `store` が取り除かれます。
- `params.chat_template_kwargs`: vLLM/OpenAI 互換の chat-template 引数で、トップレベルの `api: "openai-completions"` リクエスト本文にマージされます。thinking がオフの `vllm/nemotron-3-*` では、同梱 vLLM Plugin が自動的に `enable_thinking: false` と `force_nonempty_content: true` を送信します。明示的な `chat_template_kwargs` は生成済みデフォルトを上書きし、`extra_body.chat_template_kwargs` が引き続き最終的な優先権を持ちます。設定済みの vLLM Qwen および Nemotron thinking モデルは、多段階の effort ラダーではなく、バイナリの `/think` 選択肢（`off`、`on`）を公開します。
- `compat.thinkingFormat`: OpenAI 互換の thinking ペイロード形式です。Together 形式の `reasoning.enabled` には `"together"`、Qwen 形式のトップレベル `enable_thinking` には `"qwen"`、vLLM など、リクエストレベルの chat-template kwargs をサポートする Qwen 系バックエンドでの `chat_template_kwargs.enable_thinking` には `"qwen-chat-template"` を使います。OpenClaw は無効化された thinking を `false` に、有効化された thinking を `true` にマップし、設定済みの vLLM Qwen モデルはこれらの形式に対してバイナリの `/think` 選択肢を公開します。
- `compat.supportedReasoningEfforts`: モデルごとの OpenAI 互換推論 effort リストです。実際に受け付けるカスタムエンドポイントには `"xhigh"` を含めます。すると OpenClaw は、その設定済みプロバイダー/モデルについて、コマンドメニュー、Gateway セッション行、セッションパッチ検証、エージェント CLI 検証、`llm-task` 検証で `/think xhigh` を公開します。バックエンドが正規レベルに対してプロバイダー固有の値を必要とする場合は `compat.reasoningEffortMap` を使います。
- `params.preserveThinking`: preserved thinking のための Z.AI 専用オプトインです。有効で thinking がオンの場合、OpenClaw は `thinking.clear_thinking: false` を送信し、以前の `reasoning_content` を再生します。[Z.AI thinking と preserved thinking](/ja-JP/providers/zai#advanced-configuration) を参照してください。
- `localService`: ローカル/セルフホストのモデルサーバー向けの任意のプロバイダーレベルプロセスマネージャーです。選択されたモデルがそのプロバイダーに属する場合、OpenClaw は `healthUrl`（または `baseUrl + "/models"`）をプローブし、エンドポイントがダウンしていれば `command` を `args` 付きで開始し、最大 `readyTimeoutMs` まで待機してからモデルリクエストを送信します。`command` は絶対パスである必要があります。`idleStopMs: 0` は OpenClaw が終了するまでプロセスを起動したままにします。正の値は、OpenClaw が起動したプロセスをそのアイドルミリ秒数の後に停止します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services) を参照してください。
- ランタイムポリシーは `agents.defaults` ではなく、プロバイダーまたはモデルに属します。プロバイダー全体のルールには `models.providers.<provider>.agentRuntime` を使い、モデル固有のルールには `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` を使います。公式 OpenAI プロバイダー上の OpenAI エージェントモデルは、デフォルトで Codex を選択します。
- これらのフィールドを変更する設定ライター（例: `/models set`、`/models set-image`、フォールバック追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な場合は既存のフォールバックリストを保持します。
- `maxConcurrent`: セッションをまたぐエージェント実行の最大並列数です（各セッション自体は引き続き直列化されます）。デフォルト: `4`。

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
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`、`"openclaw"`、登録済み Plugin ハーネス id、またはサポートされている CLI バックエンドエイリアス。バンドルされた Codex Plugin は `codex` を登録し、バンドルされた Anthropic Plugin は `claude-cli` CLI バックエンドを提供します。
- `id: "auto"` は、登録済み Plugin ハーネスにサポート対象のターンを引き受けさせ、どのハーネスにも一致しない場合は OpenClaw を使用します。`id: "codex"` のような明示的な Plugin ランタイムはそのハーネスを必要とし、利用できない場合や失敗した場合はフェイルクローズします。
- `id: "pi"` は、v2026.5.22 以前から出荷済みの設定を保持するため、`openclaw` の非推奨エイリアスとしてのみ受け入れられます。新しい設定では `openclaw` を使用してください。
- ランタイムの優先順位は、まず正確なモデルポリシー（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]`、または `models.providers.<provider>.models[]`）、次に `agents.list[]` / `agents.defaults.models["provider/*"]`、最後に `models.providers.<provider>.agentRuntime` のプロバイダー全体ポリシーです。
- エージェント全体のランタイムキーはレガシーです。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、セッションのランタイム固定、`OPENCLAW_AGENT_RUNTIME` はランタイム選択で無視されます。古い値を削除するには `openclaw doctor --fix` を実行してください。
- OpenAI エージェントモデルはデフォルトで Codex ハーネスを使用します。明示したい場合、provider/model の `agentRuntime.id: "codex"` は引き続き有効です。
- Claude CLI デプロイでは、`model: "anthropic/claude-opus-4-8"` と、モデルスコープの `agentRuntime.id: "claude-cli"` の組み合わせを推奨します。レガシーの `claude-cli/<model>` 参照は互換性のため引き続き機能しますが、新しい設定では provider/model 選択を正規形のままにし、実行バックエンドは provider/model ランタイムポリシーに置いてください。
- これはテキストのエージェントターン実行のみを制御します。メディア生成、ビジョン、PDF、音楽、動画、TTS は引き続きそれぞれの provider/model 設定を使用します。

**組み込みエイリアス省略形**（モデルが `agents.defaults.models` にある場合にのみ適用されます）:

| エイリアス          | モデル                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

設定したエイリアスは常にデフォルトより優先されます。

Z.AI GLM-4.x モデルは、`--thinking off` を設定するか `agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、thinking モードを自動的に有効にします。
Z.AI モデルは、ツール呼び出しストリーミングのためにデフォルトで `tool_stream` を有効にします。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude Opus 4.8 は OpenClaw ではデフォルトで thinking をオフに保ちます。adaptive thinking が明示的に有効化されている場合、Anthropic のプロバイダー所有の effort デフォルトは `high` です。Claude 4.6 モデルは、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行（ツール呼び出しなし）向けの任意の CLI バックエンド。API プロバイダーが失敗した場合のバックアップとして便利です。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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
- `imageArg` がファイルパスを受け入れる場合、画像のパススルーがサポートされます。
- `reseedFromRawTranscriptWhenUncompacted: true` により、バックエンドは最初の Compaction サマリーが存在する前に、範囲を限定した生の OpenClaw トランスクリプト末尾から、安全に無効化されたセッションを復旧できます。認証プロファイルまたは認証情報エポックの変更では、引き続き生データによる再シードは行われません。

### `agents.defaults.promptOverlays`

OpenClaw が組み立てたプロンプト面に、モデルファミリー単位で適用されるプロバイダー非依存のプロンプトオーバーレイ。GPT-5 ファミリーのモデル id は、OpenClaw/プロバイダールート全体で共有される動作契約を受け取ります。`personality` は親しみやすい対話スタイル層のみを制御します。ネイティブ Codex app-server ルートは、この OpenClaw GPT-5 オーバーレイの代わりに Codex 所有の base/model instructions を保持し、OpenClaw はネイティブスレッドで Codex の組み込み personality を無効化します。

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
- `"off"` は親しみやすい層のみを無効にします。タグ付き GPT-5 動作契約は有効なままです。
- レガシーの `plugins.entries.openai.config.personality` は、この共有設定が未設定の場合に引き続き読み取られます。

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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
- `timeoutSeconds`: Heartbeat エージェントターンが中止されるまでに許可される最大時間（秒）。未設定の場合は、設定されていれば `agents.defaults.timeoutSeconds` を使用し、それ以外は Heartbeat 間隔を最大 600 秒に制限します。
- `directPolicy`: ダイレクト/DM 配信ポリシー。`allow`（デフォルト）はダイレクトターゲット配信を許可します。`block` はダイレクトターゲット配信を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat 実行は軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は過去の会話履歴なしの新しいセッションで実行されます。cron `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat あたりのトークンコストを約 100K から約 2-5K トークンに削減します。
- `skipWhenBusy`: true の場合、Heartbeat 実行はそのエージェントの追加のビジーなレーン、つまり自身のセッションキー付きサブエージェントまたはネストされたコマンド作業を待って延期されます。Cron レーンは、このフラグがなくても常に Heartbeat を延期します。
- エージェント単位: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義している場合、**それらのエージェントのみ**が Heartbeat を実行します。
- Heartbeat は完全なエージェントターンを実行します。間隔を短くすると、より多くのトークンを消費します。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` または `safeguard`（長い履歴向けのチャンク化された要約）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済みの Compaction プロバイダーPluginの ID。設定すると、組み込みの LLM 要約の代わりにそのプロバイダーの `summarize()` が呼び出されます。失敗時は組み込みにフォールバックします。プロバイダーを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClaw が単一の Compaction 操作を中止するまでに許可する最大秒数。デフォルト: `180`。
- `keepRecentTokens`: 最新のトランスクリプト末尾を逐語的に保持するためのエージェントのカットポイント予算。手動 `/compact` は、明示的に設定されている場合これを尊重します。それ以外の場合、手動 Compaction はハードチェックポイントです。
- `recentTurnsPreserve`: safeguard 要約の外で逐語的に保持する最新のユーザー/アシスタントターン数。デフォルト: `3`。
- `maxHistoryShare`: Compaction 後に保持される履歴に許可する総コンテキスト予算の最大割合（範囲 `0.1`-`0.9`）。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction 要約中に組み込みの不透明な識別子保持ガイダンスを先頭に付けます。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用する、任意のカスタム識別子保持テキスト。
- `qualityGuard`: safeguard 要約に対する不正形式出力時の再試行チェック。safeguard モードではデフォルトで有効です。監査をスキップするには `enabled: false` を設定します。
- `midTurnPrecheck`: 任意のツールループ圧力チェック。`enabled: true` の場合、OpenClaw はツール結果の追加後、次のモデル呼び出し前にコンテキスト圧力をチェックします。コンテキストが収まらなくなった場合、プロンプトを送信する前に現在の試行を中止し、既存の事前チェック復旧パスを再利用してツール結果を切り詰めるか、Compaction して再試行します。`default` と `safeguard` の両方の Compaction モードで動作します。デフォルト: 無効。
- `postIndexSync`: Compaction 後のセッションメモリ再インデックスモード。デフォルト: `"async"`。最も強い鮮度には `"await"`、Compaction レイテンシを下げるには `"async"`、セッションメモリ同期が別の場所で処理される場合のみ `"off"` を使用します。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名。未設定または `[]` に設定されている場合、再注入は無効です。明示的に `["Session Startup", "Red Lines"]` を設定すると、その組み合わせが有効になり、従来の `Every Session`/`Safety` フォールバックが保持されます。追加コンテキストが、Compaction 要約にすでに取り込まれているプロジェクトガイダンスを重複させるリスクに見合う場合にのみ有効にしてください。
- `model`: Compaction 要約専用の任意の `provider/model-id`、または `agents.defaults.models` からの素のエイリアス。素のエイリアスはディスパッチ前に解決されます。設定済みのリテラルモデル ID は、衝突時に優先されます。メインセッションでは 1 つのモデルを維持しつつ、Compaction 要約を別のモデルで実行したい場合に使用します。未設定の場合、Compaction はセッションのプライマリモデルを使用します。
- `truncateAfterCompaction`: Compaction 後にアクティブなセッション JSONL をローテーションし、以後のターンが要約と未要約の末尾のみを読み込むようにします。以前の完全なトランスクリプトはアーカイブされたままです。長時間実行セッションでアクティブなトランスクリプトが無制限に増えるのを防ぎます。デフォルト: `false`。
- `maxActiveTranscriptBytes`: アクティブな JSONL がしきい値を超えた場合、実行前に通常のローカル Compaction をトリガーする任意のバイトしきい値（`number` または `"20mb"` のような文字列）。成功した Compaction がより小さい後続トランスクリプトへローテーションできるよう、`truncateAfterCompaction` が必要です。未設定または `0` の場合は無効です。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時に短い通知をユーザーへ送信します（例: 「コンテキストを Compaction 中...」および「Compaction 完了」）。Compaction を静かに保つため、デフォルトでは無効です。
- `memoryFlush`: 自動 Compaction の前に永続メモリを保存する、サイレントなエージェント的ターン。このハウスキーピングターンをローカルモデルに留めたい場合は、`model` を `ollama/qwen3:8b` のような正確なプロバイダー/モデルに設定します。この上書きは、アクティブセッションのフォールバックチェーンを継承しません。`forceFlushTranscriptBytes` は、トークンカウンターが古い場合でも、トランスクリプトファイルサイズがしきい値に達したときにフラッシュを強制します。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.runRetries`

失敗復旧中の無限実行ループを防ぐための、埋め込みエージェントランタイム向け外側実行ループの再試行イテレーション境界。この設定は埋め込みエージェントランタイムにのみ適用され、ACP や CLI ランタイムには適用されません。

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
- `perProfile`: フォールバックプロファイル候補ごとに付与される追加の実行再試行イテレーション数。デフォルト: `8`。
- `min`: 実行再試行イテレーションの絶対最小制限。デフォルト: `32`。
- `max`: 暴走実行を防ぐための、実行再試行イテレーションの絶対最大制限。デフォルト: `160`。

### `agents.defaults.contextPruning`

LLM に送信する前に、インメモリコンテキストから**古いツール結果**を枝刈りします。ディスク上のセッション履歴は変更**しません**。デフォルトでは無効です。有効にするには `mode: "cache-ttl"` を設定します。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (default) | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes; default: 5m
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
- `ttl` は（最後のキャッシュタッチ後に）枝刈りを再度実行できる頻度を制御します。デフォルト: `5m`。
- 枝刈りはまずサイズ超過のツール結果をソフトトリムし、必要に応じて古いツール結果をハードクリアします。
- `softTrimRatio` と `hardClearRatio` は `0.0` から `1.0` までの値を受け付けます。設定検証はその範囲外の値を拒否します。

**ソフトトリム**は先頭 + 末尾を保持し、中央に `...` を挿入します。

**ハードクリア**はツール結果全体をプレースホルダーに置き換えます。

注記:

- 画像ブロックはトリム/クリアされません。
- 比率は文字ベース（概算）であり、正確なトークン数ではありません。
- `keepLastAssistants` 未満のアシスタントメッセージしか存在しない場合、枝刈りはスキップされます。

</Accordion>

動作の詳細は [セッション枝刈り](/ja-JP/concepts/session-pruning) を参照してください。

### ブロックストリーミング

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (default) | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram 以外のチャンネルでは、ブロック返信を有効にするために明示的な `*.blockStreaming: true` が必要です。
- チャンネル上書き: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Discord、Google Chat、Mattermost、MS Teams、Signal、Slack のデフォルトは `minChars: 1500` / `idleMs: 1000` です。
- `blockStreamingChunk.breakPreference`: 優先チャンク境界（`"paragraph" | "newline" | "sentence"`）。
- `humanDelay`: ブロック返信間のランダム化された一時停止。デフォルト: `off`。`natural` = 800-2500ms。`custom` は `minMs`/`maxMs` を使用します（未設定の境界は自然範囲へフォールバック）。エージェントごとの上書き: `agents.list[].humanDelay`。

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

- デフォルト: ダイレクトチャット/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- `typingIntervalSeconds` のデフォルト: `6`。
- セッションごとの上書き: `session.typingMode`、`session.typingIntervalSeconds`。

[入力中インジケーター](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みエージェント向けの任意のサンドボックス化。完全なガイドは [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (default) | non-main | all
        backend: "docker", // docker (default) | ssh | openshell
        scope: "agent", // session | agent (default) | shared
        workspaceAccess: "none", // none (default) | ro | rw
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
          gpus: "all",
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

上に示したデフォルト（`off`/`docker`/`agent`/`none`/`bookworm-slim` イメージ/`none` ネットワークなど）は、単なる例示値ではなく、実際の OpenClaw のデフォルトです。

<Accordion title="サンドボックスの詳細">

**バックエンド:**

- `docker`: ローカル Docker ランタイム（デフォルト）
- `ssh`: 汎用 SSH バックエンドのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` が選択されている場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのワークスペースに使う絶対リモートルート（デフォルト: `/tmp/openclaw-sandboxes`）
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が実行時に一時ファイルへ具体化するインライン内容または SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH のホストキー ポリシー調整項目（どちらもデフォルトは `true`）

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先される
- `certificateData` は `certificateFile` より優先される
- `knownHostsData` は `knownHostsFile` より優先される
- SecretRef に基づく `*Data` 値は、サンドボックスセッション開始前にアクティブなシークレット ランタイム スナップショットから解決される

**SSH バックエンドの動作:**

- 作成または再作成後に、リモートワークスペースを一度シードする
- その後はリモート SSH ワークスペースを正とする
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングする
- リモート変更をホストへ自動同期しない
- サンドボックス ブラウザー コンテナはサポートしない

**ワークスペースアクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのサンドボックス ワークスペース（デフォルト）
- `ro`: `/workspace` にサンドボックス ワークスペース、`/agent` に読み取り専用でマウントされたエージェント ワークスペース
- `rw`: `/workspace` に読み書き可能でマウントされたエージェント ワークスペース

**スコープ:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース（デフォルト）
- `shared`: 共有コンテナとワークスペース（セッション間分離なし）

**OpenShell Plugin 設定:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (default) | remote
          command: "openshell",
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

- `mirror`: exec 前にローカルからリモートへシードし、exec 後に同期して戻す。ローカルワークスペースを正とする
- `remote`: サンドボックス作成時にリモートへ一度シードし、その後はリモートワークスペースを正とする

`remote` モードでは、OpenClaw の外で行われたホストローカルの編集は、シード手順後にサンドボックスへ自動同期されない。
トランスポートは OpenShell サンドボックスへの SSH だが、Plugin がサンドボックスのライフサイクルと任意のミラー同期を所有する。

**`setupCommand`** はコンテナ作成後に一度実行される（`sh -lc` 経由）。ネットワーク送信、書き込み可能なルート、root ユーザーが必要。

**コンテナのデフォルトは `network: "none"`** — エージェントがアウトバウンドアクセスを必要とする場合は `"bridge"`（またはカスタム ブリッジネットワーク）に設定する。
`"host"` はブロックされる。`"container:<id>"` は、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急用）を設定しない限り、デフォルトでブロックされる。
アクティブな OpenClaw サンドボックス内の Codex アプリサーバー ターンは、ネイティブ コードモードのネットワークアクセスに同じ送信設定を使用する。

**受信添付ファイル** は、アクティブなワークスペース内の `media/inbound/*` にステージングされる。

**`docker.binds`** は追加のホストディレクトリをマウントする。グローバルのバインドとエージェントごとのバインドはマージされる。

**サンドボックス化ブラウザー**（`sandbox.browser.enabled`、デフォルト `false`）: コンテナ内の Chromium + CDP。noVNC URL がシステムプロンプトに注入される。`openclaw.json` の `browser.enabled` は不要。
noVNC オブザーバーアクセスはデフォルトで VNC 認証を使い、OpenClaw は共有 URL でパスワードを公開する代わりに短命のトークン URL を発行する。

- `allowHostControl: false`（デフォルト）は、サンドボックス化セッションがホストブラウザーをターゲットにすることをブロックする。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用ブリッジネットワーク）。グローバルなブリッジ接続を明示的に必要とする場合のみ `bridge` に設定する。ここでも `"host"` はブロックされる。
- `cdpSourceRange` は任意で、コンテナ境界での CDP 入力を CIDR 範囲に制限する（例: `172.21.0.1/32`）。
- `sandbox.browser.binds` は追加のホストディレクトリをサンドボックス ブラウザー コンテナだけにマウントする。設定されている場合（`[]` を含む）、ブラウザー コンテナでは `docker.binds` を置き換える。
- サンドボックス ブラウザー コンテナの Chromium は常に `--no-sandbox --disable-setuid-sandbox` 付きで起動する（コンテナには Chrome 自身のサンドボックスが必要とするカーネル プリミティブがない）。これに対する設定トグルはない。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナホスト向けに調整されている:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`、`--disable-gpu`、`--disable-software-rasterizer` は
    デフォルトで有効であり、WebGL/3D の使用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効にできる。
  - `--disable-extensions`（デフォルトで有効）。ワークフローが拡張機能に依存する場合は
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で拡張機能を再有効化できる。
  - `--renderer-process-limit=2` がデフォルト。変更するには
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` を使い、Chromium の
    デフォルトのプロセス制限を使うには `0` を設定する。
  - `--headless=new` は `headless` が有効な場合のみ。
  - デフォルトはコンテナイメージのベースラインである。コンテナのデフォルトを変更するには、カスタム
    エントリポイントを持つカスタム ブラウザー イメージを使う。

</Accordion>

ブラウザーのサンドボックス化と `sandbox.docker.binds` は Docker 専用。

イメージをビルドする（ソースチェックアウトから）:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

ソースチェックアウトなしで npm インストールを行う場合は、インラインの `docker build` コマンドについて [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) を参照。

### `agents.list`（エージェントごとの上書き）

エージェントに専用の TTS プロバイダー、音声、モデル、
スタイル、または自動 TTS モードを与えるには `agents.list[].tts` を使う。エージェント ブロックはグローバルな
`messages.tts` にディープマージされるため、共有資格情報は 1 か所に置いたまま、個々の
エージェントは必要な音声またはプロバイダー フィールドだけを上書きできる。アクティブなエージェントの
上書きは、自動音声返信、`/tts audio`、`/tts status`、および
`tts` エージェントツールに適用される。プロバイダー例と優先順位については [Text-to-speech](/ja-JP/tools/tts#per-agent-voice-overrides)
を参照。

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
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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
            mode: "persistent", // persistent | oneshot
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

- `id`: 安定したエージェント id (必須)。
- `default`: 複数設定されている場合は、最初のものが優先されます (警告がログに記録されます)。何も設定されていない場合は、リストの最初のエントリがデフォルトになります。
- `model`: 文字列形式は、モデルフォールバックなしの厳密なエージェント単位のプライマリを設定します。オブジェクト形式 `{ primary }` も、`fallbacks` を追加しない限り厳密です。`{ primary, fallbacks: [...] }` を使用すると、そのエージェントでフォールバックを有効にできます。または `{ primary, fallbacks: [] }` を使用すると、厳密な動作を明示できます。`primary` だけを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトのフォールバックを引き継ぎます。
- `utilityModel`: 生成されるセッションやスレッドのタイトルなど、短い内部タスク向けの任意のエージェント単位オーバーライドです。`agents.defaults.utilityModel` にフォールバックし、その後このエージェントのプライマリモデルにフォールバックします。
- `params`: `agents.defaults.models` 内の選択されたモデルエントリにマージされる、エージェント単位のストリームパラメータです。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有のオーバーライドに使用します。
- `tts`: 任意のエージェント単位のテキスト読み上げオーバーライドです。このブロックは `messages.tts` にディープマージされるため、共有プロバイダー認証情報とフォールバックポリシーは `messages.tts` に保持し、プロバイダー、音声、モデル、スタイル、自動モードなど、ペルソナ固有の値だけをここに設定します。
- `skills`: 任意のエージェント単位の Skills 許可リストです。省略すると、設定されている場合はエージェントが `agents.defaults.skills` を継承します。明示的なリストはデフォルトをマージせずに置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェント単位のデフォルト思考レベル (`off | minimal | low | medium | high | xhigh | adaptive | max`) です。メッセージ単位またはセッション単位のオーバーライドが設定されていない場合、このエージェントでは `agents.defaults.thinkingDefault` を上書きします。選択されたプロバイダー/モデルプロファイルによって有効な値が制御されます。Google Gemini では、`adaptive` はプロバイダー所有の動的思考を維持します (Gemini 3/3.1 では `thinkingLevel` を省略し、Gemini 2.5 では `thinkingBudget: -1`)。
- `reasoningDefault`: 任意のエージェント単位のデフォルト推論可視性 (`on | off | stream`) です。メッセージ単位またはセッション単位の推論オーバーライドが設定されていない場合、このエージェントでは `agents.defaults.reasoningDefault` を上書きします。
- `fastModeDefault`: 任意のエージェント単位の高速モードのデフォルト (`"auto" | true | false`) です。メッセージ単位またはセッション単位の高速モードオーバーライドが設定されていない場合に適用されます。
- `models`: 完全な `provider/model` id をキーとする、任意のエージェント単位のモデルカタログ/ランタイムオーバーライドです。エージェント単位のランタイム例外には `models["provider/model"].agentRuntime` を使用します。
- `runtime`: 任意のエージェント単位のランタイム記述子です。エージェントがデフォルトで ACP ハーネスセッションを使用する必要がある場合は、`runtime.acp` のデフォルト (`agent`、`backend`、`mode`、`cwd`) とともに `type: "acp"` を使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- ローカルのワークスペース相対 `identity.avatar` 画像ファイルは 2 MB に制限されます。`http(s)` URL と `data:` URI は、ローカルファイルサイズ制限に対してチェックされません。
- `identity` はデフォルトを派生します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: 明示的な `sessions_spawn.agentId` ターゲットに対する、設定済みエージェント id の許可リスト (`["*"]` = 任意の設定済みターゲット、デフォルト: 同じエージェントのみ)。自己ターゲットの `agentId` 呼び出しを許可する必要がある場合は、リクエスター id を含めます。エージェント設定が削除された古いエントリは `sessions_spawn` によって拒否され、`agents_list` から省略されます。クリーンアップするには `openclaw doctor --fix` を実行するか、デフォルトを継承しながらそのターゲットを spawn 可能なままにする必要がある場合は最小限の `agents.list[]` エントリを追加します。
- サンドボックス継承ガード: リクエスターセッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします (明示的なプロファイル選択を強制します。デフォルト: false)。
- `subagents.maxConcurrent`: サブエージェント実行全体での同時子エージェント実行の最大数。デフォルト: `8`。
- `subagents.maxChildrenPerAgent`: 単一のエージェントセッションが spawn できるアクティブな子の最大数。デフォルト: `5`。
- `subagents.maxSpawnDepth`: サブエージェント spawn の最大ネスト深度 (`1`-`5`)。デフォルト: `1` (ネストなし)。
- `subagents.archiveAfterMinutes`: 完了したサブエージェント状態がアーカイブされるまでの経過時間。デフォルト: `60`。

---

## マルチエージェントルーティング

1 つの Gateway 内で、複数の分離されたエージェントを実行します。[マルチエージェント](/ja-JP/concepts/multi-agent) を参照してください。

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

### バインディング match フィールド

- `type` (任意): 通常のルーティングでは `route` (type がない場合は route がデフォルト)、永続的な ACP 会話バインディングでは `acp`。
- `match.channel` (必須)
- `match.accountId` (任意。`*` = 任意のアカウント、省略 = デフォルトアカウント)
- `match.peer` (任意。`{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (任意。チャネル固有)
- `acp` (任意。`type: "acp"` の場合のみ): `{ mode, label, cwd, backend }`

**決定的な match 順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (完全一致、peer/guild/team なし)
5. `match.accountId: "*"` (チャネル全体)
6. デフォルトエージェント

各階層内では、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリでは、OpenClaw は厳密な会話 ID (`match.channel` + account + `match.peer.id`) によって解決し、上記の route バインディング階層順序は使用しません。

### エージェント単位のアクセスプロファイル

<Accordion title="フルアクセス (サンドボックスなし)">

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

<Accordion title="ファイルシステムアクセスなし (メッセージングのみ)">

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

優先順位の詳細については、[マルチエージェント サンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (default) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
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

- **`scope`**: グループチャットコンテキストの基本セッション分割戦略。
  - `per-sender` (デフォルト): 各送信者はチャネルコンテキスト内で分離されたセッションを取得します。
  - `global`: チャネルコンテキスト内のすべての参加者が単一セッションを共有します (共有コンテキストを意図する場合のみ使用)。
- **`dmScope`**: DM の分割方法。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャネル + 送信者ごとに分離します (複数ユーザーの受信箱に推奨)。
  - `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します (複数アカウントに推奨)。
- **`identityLinks`**: チャネル横断セッション共有のため、正規 ID をプロバイダー接頭辞付きピアへマップします。`/dock_discord` などの dock コマンドは同じマップを使い、アクティブセッションの返信経路を別のリンク済みチャネルピアへ切り替えます。[チャネルドッキング](/ja-JP/concepts/channel-docking)を参照してください。
- **`reset`**: 主要なリセットポリシー。`daily` は `atHour` のローカル時刻でリセットします。`idle` は `idleMinutes` 後にリセットします。両方を設定した場合は、先に期限切れになった方が優先されます。日次リセットの鮮度判定にはセッション行の `sessionStartedAt` を使います。アイドルリセットの鮮度判定には `lastInteractionAt` を使います。heartbeat、cron ウェイクアップ、exec 通知、Gateway の帳簿処理などのバックグラウンド/システムイベント書き込みは `updatedAt` を更新できますが、日次/アイドルセッションの鮮度は維持しません。
- **`resetByType`**: タイプ別の上書き (`direct`, `group`, `thread`)。レガシーの `dm` は `direct` のエイリアスとして受け付けられます。
- **`resetByChannel`**: プロバイダー/チャネル ID をキーにしたチャネル別リセット上書き。セッションのチャネルに一致するエントリがある場合、そのセッションでは `resetByType`/`reset` より完全に優先されます。タイプレベルのポリシーと異なるリセット動作が必要なチャネルが 1 つだけある場合にのみ使用してください。
- **`mainKey`**: レガシーフィールド。ランタイムはメインの直接チャットバケットに常に `"main"` を使います。
- **`agentToAgent.maxPingPongTurns`**: エージェント間交換中にエージェント間で返信を返し合う最大ターン数 (整数、範囲: `0`-`20`、デフォルト: `5`)。`0` はピンポン連鎖を無効にします。
- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、レガシーの `dm` エイリアスあり)、`keyPrefix`、または `rawKeyPrefix` で照合します。最初の拒否が優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `enforce` はクリーンアップを適用し、デフォルトです。`warn` は警告のみを出力します。
  - `pruneAfter`: 古いエントリの経過時間しきい値 (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` 内の最大エントリ数 (デフォルト `500`)。ランタイムは本番サイズの上限向けに小さな高水位バッファを使ってバッチクリーンアップを書き込みます。`openclaw sessions cleanup --enforce` は上限を即時適用します。
  - 短命の Gateway モデル実行プローブセッションは固定の `24h` 保持を使いますが、クリーンアップは圧力ゲート付きです。つまり、セッションエントリのメンテナンス/上限圧力に達した場合にのみ、古い厳密なモデル実行プローブ行を削除します。`agent:*:explicit:model-run-<uuid>` に一致する厳密な明示プローブキーのみが対象です。通常の direct、group、thread、cron、hook、heartbeat、ACP、サブエージェントセッションはこの 24h 保持を継承しません。モデル実行クリーンアップが走る場合、より広範な `pruneAfter` の古いエントリクリーンアップと `maxEntries` 上限より前に実行されます。
  - `rotateBytes`: 非推奨で無視されます。`openclaw doctor --fix` は古い設定からこれを削除します。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter` です。無効にするには `false` を設定します。
  - `maxDiskBytes`: 任意のセッションディレクトリのディスク予算。`warn` モードでは警告をログに記録します。`enforce` モードでは最も古いアーティファクト/セッションから削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`writeLock`**: セッショントランスクリプトの書き込みロック制御。正当なトランスクリプト準備、クリーンアップ、Compaction、またはミラー処理がデフォルトポリシーより長く競合する場合のみ調整してください。
  - `acquireTimeoutMs`: ロック取得中に、セッションをビジーとして報告するまで待機するミリ秒数。デフォルト: `60000`。env 上書き `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`。
  - `staleMs`: 既存のロックを古いものとして扱い回収するまでのミリ秒数。デフォルト: `1800000`。env 上書き `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`。
  - `maxHoldMs`: 保持中のプロセス内ロックを、ウォッチドッグが解放するまで保持できるミリ秒数。デフォルト: `300000`。env 上書き `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。
- **`threadBindings`**: スレッド束縛セッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーは上書き可能。Discord は `channels.discord.threadBindings.enabled` を使います)
  - `idleHours`: 非アクティブ時に自動でフォーカス解除するデフォルト時間 (`0` は無効化。プロバイダーは上書き可能)
  - `maxAgeHours`: デフォルトの厳格な最大経過時間 (`0` は無効化。プロバイダーは上書き可能)
  - `spawnSessions`: `sessions_spawn` と ACP スレッド生成からスレッド束縛ワークセッションを作成するためのデフォルトゲート。スレッド束縛が有効な場合、デフォルトは `true` です。プロバイダー/アカウントは上書き可能です。
  - `defaultSpawnContext`: スレッド束縛生成のデフォルトネイティブサブエージェントコンテキスト (`"fork"` または `"isolated"`)。デフォルトは `"fork"` です。

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // または "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (デフォルト) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (デフォルト)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 は無効化
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 返信プレフィックス

チャネル/アカウント別の上書き: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

解決順序 (最も具体的なものが優先): アカウント → チャネル → グローバル。`""` は無効化し、カスケードを止めます。`"auto"` は `[{identity.name}]` から導出します。

**テンプレート変数:**

| 変数              | 説明                   | 例                          |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いモデル名           | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子     | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名         | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル       | `high`, `low`, `off`        |
| `{identity.name}` | エージェント ID 名     | (`"auto"` と同じ)           |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` のエイリアスです。

### Ack リアクション

- デフォルトはアクティブエージェントの `identity.emoji`、それ以外は `"👀"` です。無効にするには `""` を設定します。
- チャネル別の上書き: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`、または `off`/`none` (ack リアクションを完全に無効化)。
- `removeAckAfterReply`: Slack、Discord、Signal、Telegram、WhatsApp、iMessage など、リアクション対応チャネルで返信後に ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Signal、Telegram、WhatsApp でライフサイクルステータスリアクションを有効にします。
  Slack と Discord では、未設定の場合、ack リアクションがアクティブなときステータスリアクションは有効のままです。
  Signal、Telegram、WhatsApp では、ライフサイクルステータスリアクションを有効にするには明示的に `true` を設定します。
- `messages.statusReactions.emojis`: ライフサイクル絵文字キーを上書きします:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft`, `stallHard`.
  Telegram では固定のリアクションセットのみが許可されるため、設定された非対応の絵文字は
  そのチャットで最も近い対応ステータスバリアントへフォールバックします。

### キュー

- `mode`: セッション実行中に到着した受信メッセージのキュー戦略。デフォルト: `"steer"`。
  - `steer`: 新しいプロンプトをアクティブな実行に注入します。
  - `followup`: アクティブな実行が完了した後に新しいプロンプトを実行します。
  - `collect`: 互換性のあるメッセージをバッチ化し、後でまとめて実行します。
  - `interrupt`: 最新のプロンプトを開始する前にアクティブな実行を中止します。
- `debounceMs`: キュー済み/steer されたメッセージをディスパッチする前の遅延。デフォルト: `500`。
- `cap`: ドロップポリシーが適用される前のキュー済みメッセージの最大数。デフォルト: `20`。
- `drop`: 上限を超えた場合の戦略。`"summarize"` (デフォルト) は最古のエントリをドロップしますが、圧縮サマリーを保持します。`"old"` はサマリーなしで最古をドロップします。`"new"` は最新項目を拒否します。
- `byChannel`: プロバイダー ID をキーにしたチャネル別 `mode` 上書き。
- `debounceMsByChannel`: プロバイダー ID をキーにしたチャネル別 `debounceMs` 上書き。

### 受信デバウンス

同じ送信者からの短時間のテキストのみのメッセージを、単一のエージェントターンにまとめます。メディア/添付ファイルは即時フラッシュされます。制御コマンドはデバウンスをバイパスします。デフォルトの `debounceMs`: `2000`。

### その他のメッセージキー

- `messages.messagePrefix`: エージェントランタイムに到達する前に受信ユーザーメッセージへ付加されるプレフィックステキスト。チャネルコンテキストマーカーには控えめに使用してください。
- `messages.visibleReplies`: direct、group、channel 会話をまたぐ表示可能なソース返信を制御します (`"message_tool"` は表示出力に `message(action=send)` を必要とします。`"automatic"` は従来どおり通常の返信を投稿します)。
- `messages.usageTemplate` / `messages.responseUsage`: カスタム `/usage` フッターテンプレートと、返信ごとのデフォルト使用量モード (`off | tokens | full`、および `tokens` のレガシーエイリアス `on`)。
- `messages.groupChat.mentionPatterns` / `historyLimit`: グループメッセージのメンショントリガーと履歴ウィンドウサイズ。
- `messages.suppressToolErrors`: `true` の場合、ユーザーに表示される `⚠️` ツールエラー警告を抑制します (エージェントは引き続きコンテキスト内でエラーを確認でき、再試行できます)。デフォルト: `false`。

### TTS (テキスト読み上げ)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (デフォルト) | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` でローカル設定を上書きでき、`/tts status` は有効な状態を表示します。
- `summaryModel` は自動要約用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です (`enabled !== false`); `modelOverrides.allowProvider` はオプトインです。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` と `OPENAI_API_KEY` にフォールバックします。
- バンドルされた音声プロバイダーは Plugin が所有します。`plugins.allow` が設定されている場合は、使用したい各 TTS プロバイダー Plugin を含めます。たとえば Edge TTS には `microsoft` を含めます。従来の `edge` プロバイダー id は `microsoft` のエイリアスとして受け入れられます。
- `providers.openai.baseUrl` は OpenAI TTS エンドポイントを上書きします。解決順序は、config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `providers.openai.baseUrl` が OpenAI 以外のエンドポイントを指している場合、OpenClaw はそれを OpenAI 互換 TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## 会話

会話モード (macOS/iOS/Android) のデフォルト。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_multilingual_v2",
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
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` は、複数の会話プロバイダーが設定されている場合、`talk.providers` 内のキーと一致する必要があります。
- 従来のフラットな会話キー (`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`) は互換性専用です。永続化された config を `talk.providers.<provider>` に書き換えるには、`openclaw doctor --fix` を実行します。
- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` (macOS 会話クライアントの動作) にフォールバックします。
- `providers.*.apiKey` はプレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、会話 API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、会話ディレクティブでわかりやすい名前を使用できます。
- `providers.mlx.modelId` は、macOS ローカル MLX ヘルパーで使用される Hugging Face リポジトリを選択します。省略した場合、macOS は `mlx-community/Soprano-80M-bf16` を使用します。
- macOS MLX 再生は、存在する場合はバンドルされた `openclaw-mlx-tts` ヘルパーを通じて実行され、または `PATH` 上の実行可能ファイルを通じて実行されます。`OPENCLAW_MLX_TTS_BIN` は開発用にヘルパーパスを上書きします。
- `consultThinkingLevel` は、Control UI 会話リアルタイム `openclaw_agent_consult` 呼び出しの背後にある完全な OpenClaw エージェント実行の思考レベルを制御します。通常のセッション/モデル動作を維持するには未設定のままにします。
- `consultFastMode` は、セッションの通常の高速モード設定を変更せずに、Control UI 会話リアルタイム相談のためのワンショット高速モード上書きを設定します。
- `speechLocale` は、iOS/macOS 会話音声認識で使用される BCP 47 ロケール id を設定します。デバイスのデフォルトを使用するには未設定のままにします。
- `silenceTimeoutMs` は、ユーザーの無音後に会話モードが文字起こしを送信するまで待機する時間を制御します。未設定の場合、プラットフォームのデフォルトの一時停止ウィンドウ (`macOS と Android では 700 ms、iOS では 900 ms`) が維持されます。
- `realtime.instructions` は、プロバイダー向けのシステム指示を OpenClaw の組み込みリアルタイムプロンプトに追加するため、デフォルトの `openclaw_agent_consult` ガイダンスを失わずに音声スタイルを設定できます。
- `realtime.consultRouting`: `"provider-direct"` (デフォルト) は、リアルタイムプロバイダーが `openclaw_agent_consult` なしで最終的なユーザー文字起こしを生成した場合に、直接のプロバイダー応答を維持します。`"force-agent-consult"` は、確定したリクエストを代わりに OpenClaw 経由でルーティングします。

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他すべての config キー
- [設定](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [設定例](/ja-JP/gateway/configuration-examples)
