---
read_when:
    - エージェントのデフォルト設定を調整する（モデル、思考、ワークスペース、Heartbeat、メディア、Skills）
    - マルチエージェントのルーティングとバインディングの設定
    - セッション、メッセージ配信、トークモードの動作の調整
summary: エージェントのデフォルト設定、マルチエージェントルーティング、セッション、メッセージ、トーク設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-07-14T13:40:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f32cd37bd152935ae7602d40733cec63273d31b5bc89fc6a9a8390927ac8c95
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、`talk.*` 配下のエージェントスコープ設定キー。
チャンネル、ツール、Gateway ランタイム、およびその他のトップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `OPENCLAW_WORKSPACE_DIR` が設定されている場合はその値、それ以外は `~/.openclaw/workspace`（`OPENCLAW_PROFILE` がデフォルト以外のプロファイルに設定されている場合は `~/.openclaw/workspace-<profile>`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明示的な `agents.defaults.workspace` の値は
`OPENCLAW_WORKSPACE_DIR` より優先されます。設定にパスを書き込みたくない場合は、環境変数を使用してデフォルトのエージェントがマウント済みワークスペースを参照するようにします。

### `agents.defaults.repoRoot`

システムプロンプトの Runtime 行に表示される、オプションのリポジトリルート。未設定の場合、OpenClaw はワークスペースから上位へたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないエージェント向けの、オプションのデフォルト Skills 許可リスト。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github、weatherを継承
      { id: "docs", skills: ["docs-search"] }, // デフォルトを置換
      { id: "locked-down", skills: [] }, // Skillsなし
    ],
  },
}
```

- デフォルトで Skills を無制限にするには、`agents.defaults.skills` を省略します。
- デフォルトを継承するには、`agents.list[].skills` を省略します。
- Skills を無効にするには、`agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストが、そのエージェントの最終的なセットになります。デフォルトとは
  マージされません。

### `agents.defaults.skipBootstrap`

ワークスペースのブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

必須のブートストラップファイル（`AGENTS.md`、`TOOLS.md`、`BOOTSTRAP.md`）は引き続き書き込みながら、選択したオプションのワークスペースファイルの作成をスキップします。有効な値: `SOUL.md`、`USER.md`、`HEARTBEAT.md`、`IDENTITY.md`。

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

- `"continuation-skip"`: 安全に継続できるターン（アシスタントの応答完了後）ではワークスペースブートストラップの再注入をスキップし、プロンプトサイズを削減します。Heartbeat の実行と Compaction 後の再試行では、引き続きコンテキストを再構築します。
- `"never"`: すべてのターンでワークスペースブートストラップとコンテキストファイルの注入を無効にします。プロンプトのライフサイクルを完全に管理するエージェント（カスタムコンテキストエンジン、独自にコンテキストを構築するネイティブランタイム、またはブートストラップ不要の特殊なワークフロー）にのみ使用してください。Heartbeat と Compaction 復旧ターンでも注入をスキップします。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

エージェントごとのオーバーライド: `agents.list[].contextInjection`。省略した値は
`agents.defaults.contextInjection` を継承します。

### `agents.defaults.bootstrapMaxChars`

切り詰め前のワークスペースブートストラップファイルごとの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

エージェントごとのオーバーライド: `agents.list[].bootstrapMaxChars`。省略した値は
`agents.defaults.bootstrapMaxChars` を継承します。

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペースブートストラップファイルから注入される合計最大文字数。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

エージェントごとのオーバーライド: `agents.list[].bootstrapTotalMaxChars`。省略した値は
`agents.defaults.bootstrapTotalMaxChars` を継承します。

### エージェントごとのブートストラッププロファイルのオーバーライド

あるエージェントで共有デフォルトとは異なるプロンプト注入動作が必要な場合は、エージェントごとのブートストラッププロファイルのオーバーライドを使用します。省略したフィールドは
`agents.defaults` から継承されます。

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

ブートストラップコンテキストが切り詰められた場合に、エージェントに表示されるシステムプロンプト通知を制御します。
デフォルト: `"always"`。

- `"off"`: 切り詰め通知テキストをシステムプロンプトに一切注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに、簡潔な通知を1回注入します。
- `"always"`: 切り詰めが存在する場合、実行のたびに簡潔な通知を注入します（推奨）。

生データと注入後の詳細な件数、および設定調整用フィールドは、コンテキスト/ステータスレポートやログなどの診断情報にのみ保持されます。通常の WebChat のユーザー/ランタイムコンテキストには、簡潔な復旧通知のみが含まれます。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### コンテキスト予算の所有範囲

OpenClaw には大容量のプロンプト/コンテキスト予算が複数あり、すべてを1つの汎用設定に集約するのではなく、意図的にサブシステム別に分割されています。

| 予算                                                           | 対象                                                                                                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 通常のワークスペースブートストラップ注入                                                                                                                        |
| `agents.defaults.startupContext.*`                             | 最近の日次 `memory/*.md` ファイルを含む、リセット/起動時の1回限りのモデル実行前置き。単独のチャット `/new` と `/reset` は、モデルを呼び出さずに確認応答されます |
| `skills.limits.*`                                              | システムプロンプトに注入されるコンパクトな Skills リスト                                                                                                        |
| `agents.defaults.contextLimits.*`                              | 上限付きのランタイム抜粋と、注入されるランタイム所有ブロック                                                                                                    |
| `memory.qmd.limits.*`                                          | インデックス化されたメモリ検索スニペットと注入サイズ                                                                                                            |

対応するエージェントごとのオーバーライド:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

リセット/起動時のモデル実行で、最初のターンに注入される起動前置きを制御します。
単独のチャット `/new` および `/reset` コマンドは、モデルを呼び出さずにリセットへの確認応答を行うため、
この前置きを読み込みません。

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

上限付きランタイムコンテキストサーフェスの共有デフォルト。

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
- `memoryGetDefaultLines`: `lines` が省略された場合の、デフォルトの `memory_get` 行範囲。
- `toolResultMaxChars`: 永続化される結果とオーバーフロー復旧に使用する、高度なライブツール結果の上限。モデルコンテキストによる自動上限を使用する場合は未設定のままにします。
  100Kトークン未満では `16000` 文字、100K以上では `32000` 文字、200K以上では `64000`
  文字です。長いコンテキストに対応するモデルでは `1000000` までの明示的な値を指定できますが、
  実効上限は引き続きモデルのコンテキストウィンドウの約30%に制限されます。`openclaw doctor --deep` は実効上限を表示し、
  doctor は明示的なオーバーライドが古いか、効果がない場合にのみ警告します。
- `postCompactionMaxChars`: Compaction 後の更新注入時に使用される AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` 設定に対するエージェントごとのオーバーライド。省略したフィールドは
`agents.defaults.contextLimits` から継承されます。

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
          toolResultMaxChars: 8000, // このエージェントの高度な上限
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

システムプロンプトに注入されるコンパクトな Skills リストのグローバル上限。これは、必要に応じた `SKILL.md` ファイルの読み取りには影響しません。

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills プロンプト予算のエージェントごとのオーバーライド。

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前の、トランスクリプト/ツールの画像ブロックにおける画像の長辺の最大ピクセル数。
デフォルト: `1200`。

値を小さくすると、通常、スクリーンショットを多用する実行でビジョントークンの使用量とリクエストペイロードサイズが減少します。
値を大きくすると、より多くの視覚的詳細が維持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ファイルパス、URL、メディア参照から読み込まれる画像に対する、画像ツールの圧縮/詳細度設定。
デフォルト: `auto`。

OpenClaw は、選択した画像モデルに合わせてリサイズ段階を調整します。たとえば、Claude Opus 4.8、OpenAI GPT-5.6 Sol、Qwen VL、およびホスト型 Llama 4 ビジョンモデルでは、従来の/デフォルトの高詳細ビジョンパスより大きな画像を使用できます。一方、複数画像のターンでは、トークンとレイテンシーのコストを制御するため、`auto` モードでより積極的に圧縮されます。

値:

- `auto`: モデルの制限と画像数に適応します。
- `efficient`: トークンとバイトの使用量を減らすため、小さい画像を優先します。
- `balanced`: 標準的な中間設定の段階を使用します。
- `high`: スクリーンショット、図、文書画像の詳細をより多く維持します。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトのコンテキストに使用するタイムゾーン（メッセージのタイムスタンプには使用しません）。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプトの時刻形式。デフォルト: `auto`（OS の設定）。

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
      params: { cacheRetention: "long" }, // プロバイダーのグローバルデフォルトパラメーター
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 文字列形式では、プライマリモデルのみを設定します。
  - オブジェクト形式では、プライマリモデルと順序付きフェイルオーバーモデルを設定します。
- `utilityModel`: 短い内部タスク用の、省略可能な `provider/model` 参照またはエイリアスです。現在は、生成される Control UI のセッションタイトル、Telegram DM のトピックタイトル、Discord の自動スレッドタイトル、および[進行状況ドラフトのナレーション](/ja-JP/concepts/progress-drafts#narrated-status)に使用されます。未設定の場合、OpenClaw はプライマリプロバイダーに宣言済みの小規模モデルのデフォルトがあれば、それを使用します（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）。それ以外の場合、タイトルタスクはエージェントのプライマリモデルにフォールバックし、ナレーションは無効のままです。ユーティリティルーティングを完全に無効にするには、`utilityModel: ""` を設定します。`agents.list[].utilityModel` はデフォルトを上書きし（エージェントごとの値を空にすると、そのエージェントでは無効になります）、操作固有のモデル上書きはその両方より優先されます。ユーティリティタスクは個別にモデルを呼び出し、タスク固有の内容を選択したモデルプロバイダーへ送信します。ダッシュボードのタイトル生成では、コマンドではない最初のメッセージの先頭 1,000 文字までを送信します。ナレーションでは、受信リクエストと簡潔に編集されたツール概要を送信します。コストとデータ処理の要件に合うプロバイダーを選択してください。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - アクティブなモデルが画像を受け付けられない場合に、`image` ツールパスでビジョンモデル設定として使用されます。ネイティブに画像を扱えるモデルには、読み込まれた画像バイトが代わりに直接渡されます。
  - 選択されたモデルまたはデフォルトモデルが画像入力を受け付けられない場合のフォールバックルーティングにも使用されます。
  - 明示的な `provider/model` 参照を推奨します。互換性のため、プロバイダーなしの ID も受け付けます。プロバイダーなしの ID が `models.providers.*.models` に設定された画像対応エントリの 1 つと一意に一致する場合、OpenClaw はそのプロバイダーで修飾します。設定済みの一致候補が複数ある場合は、明示的なプロバイダープレフィックスが必要です。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の画像生成機能、および今後追加される画像生成用のツール／Plugin サーフェスで使用されます。
  - 一般的な値: Gemini のネイティブ画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-2`、透明背景の OpenAI PNG/WebP 出力には `openai/gpt-image-1.5` を使用します。
  - プロバイダー／モデルを直接選択する場合は、対応するプロバイダー認証も設定してください（たとえば、`google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` / `openai/gpt-image-1.5` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証に基づいてプロバイダーのデフォルトを推定できます。まず現在のデフォルトプロバイダーを試し、次に登録済みの残りの画像生成プロバイダーをプロバイダー ID 順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の音楽生成機能と、組み込みの `music_generate` ツールで使用されます。
  - 一般的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証に基づいてプロバイダーのデフォルトを推定できます。まず現在のデフォルトプロバイダーを試し、次に登録済みの残りの音楽生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー／モデルを直接選択する場合は、対応するプロバイダー認証／API キーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の動画生成機能と、組み込みの `video_generate` ツールで使用されます。
  - 一般的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証に基づいてプロバイダーのデフォルトを推定できます。まず現在のデフォルトプロバイダーを試し、次に登録済みの残りの動画生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー／モデルを直接選択する場合は、対応するプロバイダー認証／API キーも設定してください。
  - 公式の Qwen 動画生成 Plugin は、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、およびプロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - モデルルーティング用に `pdf` ツールで使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、次に解決済みのセッション／デフォルトモデルへフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されなかった場合に、`pdf` ツールで使用されるデフォルトの PDF サイズ上限です。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで対象とするデフォルトの最大ページ数です。
- `verboseDefault`: エージェントのデフォルトの詳細出力レベルです。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `toolProgressDetail`: `/verbose` ツール概要および進行状況ドラフトのツール行の詳細モードです。値: `"explain"`（デフォルト、簡潔で人が読みやすいラベル）または `"raw"`（利用可能な場合は生のコマンド／詳細を追加）。エージェントごとの `agents.list[].toolProgressDetail` がこのデフォルトを上書きします。
- `reasoningDefault`: エージェントのデフォルトの推論表示設定です。値: `"off"`、`"on"`、`"stream"`。エージェントごとの `agents.list[].reasoningDefault` がこのデフォルトを上書きします。設定された推論のデフォルトは、メッセージ単位またはセッション単位の推論上書きが設定されていない場合に限り、所有者、認可済み送信者、またはオペレーター管理者の Gateway コンテキストにのみ適用されます。
- `elevatedDefault`: エージェントのデフォルトの昇格出力レベルです。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: Codex OAuth アクセスの場合は `openai/gpt-5.6-sol`）。プロバイダーを省略すると、OpenClaw は最初にエイリアスを試し、次にその正確なモデル ID に対する設定済みプロバイダーの一意の一致を試し、その後にのみ設定済みのデフォルトプロバイダーへフォールバックします（非推奨の互換動作であるため、明示的な `provider/model` を推奨します）。そのプロバイダーが設定済みのデフォルトモデルを提供しなくなった場合、OpenClaw は削除済みプロバイダーの古いデフォルトをエラーとして提示する代わりに、最初の設定済みプロバイダー／モデルへフォールバックします。
- `models`: `/model` 用に設定されたモデルカタログおよび許可リストです。各エントリには、`alias`（ショートカット）と `params`（プロバイダー固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter の `provider` ルーティング、`chat_template_kwargs`、`extra_body`/`extraBody`）を含められます。
  - すべてのモデル ID を手動で列挙せずに、選択したプロバイダーで検出されたすべてのモデルを表示するには、`"openai/*": {}` や `"vllm/*": {}` などの `provider/*` エントリを使用します。
  - そのプロバイダーで動的に検出されるすべてのモデルに同じランタイムを使用する場合は、`provider/*` エントリに `agentRuntime` を追加します。完全一致する `provider/model` のランタイムポリシーが、引き続きワイルドカードより優先されます。
  - 安全な編集: エントリを追加するには `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。`--replace` を渡さない限り、`config set` は既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダー単位の設定／オンボーディングフローは、選択したプロバイダーのモデルをこのマップにマージし、すでに設定されている無関係なプロバイダーを保持します。
  - OpenAI Responses の直接モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management` の注入を停止するには `params.responsesServerCompaction: false` を使用し、しきい値を上書きするには `params.responsesCompactThreshold` を使用します。[OpenAI のサーバー側 Compaction](/ja-JP/providers/openai#advanced-configuration)を参照してください。
- `params`: すべてのモデルに適用される、プロバイダーのグローバルデフォルトパラメーターです。`agents.defaults.params` に設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）は `agents.defaults.models["provider/model"].params`（モデルごと）で上書きされ、次に `agents.list[].params`（一致するエージェント ID）がキー単位で上書きします。詳細は[プロンプトキャッシュ](/ja-JP/reference/prompt-caching)を参照してください。
- `models.providers.openrouter.params.provider`: OpenRouter 全体のデフォルトのプロバイダールーティングポリシーです。OpenClaw はこれを OpenRouter のリクエスト `provider` オブジェクトへ転送します。モデルごとの `agents.defaults.models["openrouter/<model>"].params.provider` とエージェントパラメーターがキー単位で上書きします。[OpenRouter のプロバイダールーティング](/ja-JP/providers/openrouter#advanced-configuration)を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシ向けの `api: "openai-completions"` リクエスト本文にマージされる高度なパススルー JSON です。生成されたリクエストキーと競合する場合、追加の本文が優先されます。非ネイティブの completions ルートでは、その後も OpenAI 専用の `store` が削除されます。
- `params.chat_template_kwargs`: トップレベルの `api: "openai-completions"` リクエスト本文にマージされる、vLLM／OpenAI 互換のチャットテンプレート引数です。思考が無効な `vllm/nemotron-3-*` の場合、同梱の vLLM Plugin は `enable_thinking: false` と `force_nonempty_content: true` を自動的に送信します。明示的な `chat_template_kwargs` は生成されたデフォルトを上書きし、`extra_body.chat_template_kwargs` が引き続き最終的な優先権を持ちます。設定済みの vLLM Qwen および Nemotron 思考モデルでは、多段階の労力レベルの代わりに、二者択一の `/think` 選択肢（`off`、`on`）が公開されます。
- `compat.thinkingFormat`: OpenAI 互換の思考ペイロード形式です。Together 形式の `reasoning.enabled` には `"together"`、Qwen 形式のトップレベル `enable_thinking` には `"qwen"`、vLLM などリクエストレベルのチャットテンプレート kwargs をサポートする Qwen 系バックエンド上の `chat_template_kwargs.enable_thinking` には `"qwen-chat-template"` を使用します。OpenClaw は無効な思考を `false`、有効な思考を `true` にマッピングします。また、設定済みの vLLM Qwen モデルでは、これらの形式に対して二者択一の `/think` 選択肢が公開されます。
- `compat.supportedReasoningEfforts`: モデルごとの OpenAI 互換推論労力リストです。それを実際に受け付けるカスタムエンドポイントでは `"xhigh"` を含めます。これにより OpenClaw は、設定されたプロバイダー／モデルについて、コマンドメニュー、Gateway セッション行、セッションパッチ検証、エージェント CLI 検証、`llm-task` 検証で `/think xhigh` を公開します。バックエンドが標準レベルに対してプロバイダー固有の値を必要とする場合は、`compat.reasoningEffortMap` を使用します。
- `params.preserveThinking`: 思考を保持するための Z.AI 専用のオプトイン設定です。有効で、かつ思考がオンの場合、OpenClaw は `thinking.clear_thinking: false` を送信し、以前の `reasoning_content` を再生します。[Z.AI の思考と保持された思考](/ja-JP/providers/zai#advanced-configuration)を参照してください。
- `localService`: ローカル／セルフホスト型モデルサーバー向けの、省略可能なプロバイダーレベルのプロセスマネージャーです。選択したモデルがそのプロバイダーに属する場合、OpenClaw は `healthUrl`（または `baseUrl + "/models"`）をプローブし、エンドポイントが停止していれば `args` を指定して `command` を起動し、最大 `readyTimeoutMs` 待機してからモデルリクエストを送信します。`command` は絶対パスでなければなりません。`idleStopMs: 0` は、OpenClaw が終了するまでプロセスを維持します。正の値を指定すると、OpenClaw が起動したプロセスを、そのミリ秒数だけアイドル状態が続いた後に停止します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。
- ランタイムポリシーは `agents.defaults` ではなく、プロバイダーまたはモデルに設定します。プロバイダー全体のルールには `models.providers.<provider>.agentRuntime` を、モデル固有のルールには `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` を使用します。プロバイダー/モデルのプレフィックスだけでハーネスが選択されることはありません。ランタイムが未設定または `auto` の場合、作成者によるリクエストのオーバーライドがなく、公式 HTTPS Platform Responses または ChatGPT Responses のルートと完全に一致するときに限り、OpenAI が暗黙的に Codex を選択することがあります。[OpenAI の暗黙的なエージェントランタイム](/ja-JP/providers/openai#implicit-agent-runtime)を参照してください。
- これらのフィールドを変更する設定書き込み処理（例: `/models set`、`/models set-image`、フォールバックの追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な場合は既存のフォールバックリストを保持します。
- `maxConcurrent`: セッションをまたいで並列実行できるエージェント実行の最大数（各セッション内では引き続き直列化されます）。デフォルト: `4`。

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`、`"openclaw"`、登録済みPluginハーネス ID、またはサポートされている CLI バックエンドエイリアス。バンドルされている Codex Plugin は `codex` を登録し、バンドルされている Anthropic Plugin は `claude-cli` CLI バックエンドを提供します。
- `id: "auto"` は、登録済みPluginハーネスが、サポート契約を宣言するか、その他の方法で満たす有効なルートを引き受けられるようにし、一致するハーネスがない場合は OpenClaw を使用します。`id: "codex"` のような明示的なPluginランタイムには、そのハーネスと互換性のある有効なルートが必要です。いずれかが利用できない場合、または実行に失敗した場合は、フェイルクローズします。
- `id: "pi"` は、v2026.5.22 以前のリリース済み設定を維持するために、`openclaw` の非推奨エイリアスとしてのみ受け入れられます。新しい設定では `openclaw` を使用してください。
- ランタイムの優先順位は、最初に完全一致モデルポリシー（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]`、または `models.providers.<provider>.models[]`）、次に `agents.list[]` / `agents.defaults.models["provider/*"]`、最後に `models.providers.<provider>.agentRuntime` のプロバイダー全体のポリシーです。
- エージェント全体のランタイムキーはレガシーです。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、セッションランタイムの固定、および `OPENCLAW_AGENT_RUNTIME` は、ランタイム選択では無視されます。古い値を削除するには `openclaw doctor --fix` を実行してください。
- 作成者によるリクエストのオーバーライドがない、対象となる公式 HTTPS OpenAI Responses/ChatGPT 完全一致ルートでは、Codex ハーネスが暗黙的に使用される場合があります。プロバイダー/モデルの `agentRuntime.id: "codex"` は Codex をフェイルクローズ要件にしますが、互換性のないルートを互換性のあるものにはしません。
- Claude CLI のデプロイでは、`model: "anthropic/claude-opus-4-8"` とモデルスコープの `agentRuntime.id: "claude-cli"` の併用を推奨します。レガシーの `claude-cli/<model>` 参照も互換性のため引き続き機能しますが、新しい設定ではプロバイダー/モデルの選択を正規形に保ち、実行バックエンドをプロバイダー/モデルのランタイムポリシーに配置してください。
- これはテキストエージェントターンの実行のみを制御します。メディア生成、ビジョン、PDF、音楽、動画、TTS では、引き続きそれぞれのプロバイダー/モデル設定が使用されます。

**組み込みエイリアスの短縮形**（モデルが `agents.defaults.models` に含まれる場合にのみ適用）:

| エイリアス               | モデル                           |
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

Z.AI GLM-4.x モデルでは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を独自に定義しない限り、思考モードが自動的に有効になります。
Z.AI モデルでは、ツール呼び出しのストリーミング用に `tool_stream` がデフォルトで有効になります。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude Opus 4.8 では、OpenClaw において思考はデフォルトで無効です。適応的思考を明示的に有効にした場合、Anthropic のプロバイダーが所有するエフォートのデフォルト値は `high` です。Claude 4.6 モデルでは、明示的な思考レベルが設定されていない場合、デフォルトで `adaptive` が使用されます。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用のオプションの CLI バックエンド（ツール呼び出しなし）。API プロバイダーで障害が発生した場合のバックアップとして役立ちます。

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
          // または、CLI がプロンプトファイルのフラグを受け付ける場合は systemPromptFileArg を使用します。
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI バックエンドはテキスト優先であり、ツールは常に無効です。
- `sessionArg` が設定されている場合、セッションがサポートされます。
- `imageArg` がファイルパスを受け付ける場合、画像のパススルーがサポートされます。
- `reseedFromRawTranscriptWhenUncompacted: true` により、最初のCompaction要約が存在する前に、境界が設定された未加工の OpenClaw トランスクリプト末尾から、安全に無効化されたセッションをバックエンドが復旧できます。認証プロファイルまたは認証情報エポックが変更された場合は、引き続き未加工データによる再シードは行われません。

### `agents.defaults.promptOverlays`

OpenClaw が組み立てたプロンプトサーフェスにモデルファミリー単位で適用される、プロバイダー非依存のプロンプトオーバーレイ。GPT-5 ファミリーのモデル ID は、OpenClaw/プロバイダールート全体で共有動作契約を受け取ります。`personality` は、親しみやすい対話スタイルのレイヤーのみを制御します。ネイティブ Codex app-server ルートでは、この OpenClaw GPT-5 オーバーレイの代わりに Codex 所有の基本命令/モデル命令が維持され、OpenClaw はネイティブスレッドで Codex の組み込みパーソナリティを無効にします。

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
- `"off"` は親しみやすいレイヤーのみを無効にします。タグ付けされた GPT-5 動作契約は引き続き有効です。
- この共有設定が未設定の場合、レガシーの `plugins.entries.openai.config.personality` が引き続き読み込まれます。

### `agents.defaults.heartbeat`

定期的なHeartbeat実行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m で無効化
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // デフォルト: true。false の場合、システムプロンプトから Heartbeat セクションを省略
        lightContext: false, // デフォルト: false。true の場合、ワークスペースのブートストラップファイルから HEARTBEAT.md のみを保持
        isolatedSession: false, // デフォルト: false。true の場合、各 Heartbeat を新しいセッションで実行（会話履歴なし）
        skipWhenBusy: false, // デフォルト: false。true の場合、このエージェントのサブエージェント/ネストされたレーンも待機
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（デフォルト）| block
        target: "none", // デフォルト: none | 選択肢: last | whatsapp | telegram | discord | ...
        prompt: "HEARTBEAT.md が存在する場合は読み取ってください...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API キー認証）または `1h`（OAuth 認証）。無効にするには `0m` に設定します。
- `includeSystemPromptSection`: false の場合、システムプロンプトから Heartbeat セクションを省略し、ブートストラップコンテキストへの `HEARTBEAT.md` の挿入をスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat実行中のツールエラー警告ペイロードを抑制します。
- `timeoutSeconds`: Heartbeatエージェントターンが中止されるまでに許容される最大時間（秒）。未設定の場合、`agents.defaults.timeoutSeconds` が設定されていればそれを使用し、そうでなければ最大 600 秒に制限されたHeartbeat間隔を使用します。
- `directPolicy`: ダイレクト/DM 配信ポリシー。`allow`（デフォルト）はダイレクトターゲットへの配信を許可します。`block` はダイレクトターゲットへの配信を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat実行では軽量ブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各Heartbeatは過去の会話履歴がない新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeatごとのトークンコストを約 100K から約 2-5K トークンに削減します。
- `skipWhenBusy`: true の場合、そのエージェントの追加のビジーレーン、つまり自身のセッションキー付きサブエージェントまたはネストされたコマンド処理中は、Heartbeat実行を延期します。このフラグがなくても、Cron レーンは常にHeartbeatを延期します。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、**それらのエージェントのみ**がHeartbeatを実行します。
- Heartbeatは完全なエージェントターンを実行するため、間隔を短くすると消費するトークンが増えます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 登録済み Compaction プロバイダーPluginの ID（任意）
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "デプロイ ID、チケット ID、host:port の組を正確に保持してください。", // identifierPolicy=custom の場合に使用
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // 任意のツールループ負荷チェック
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // AGENTS.md セクションの再挿入をオプトイン
        model: "openrouter/anthropic/claude-sonnet-4-6", // 任意の Compaction 専用モデルオーバーライド
        truncateAfterCompaction: true, // Compaction 後に、より小さい後継 JSONL へローテーション
        maxActiveTranscriptBytes: "20mb", // 任意のプリフライトローカル Compaction トリガー
        notifyUser: true, // Compaction の開始時/完了時、およびメモリフラッシュの機能低下時に通知（デフォルト: false）
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // 任意のメモリフラッシュ専用モデルオーバーライド
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "セッションが Compaction に近づいています。永続的なメモリを今すぐ保存してください。",
          prompt: "永続的に残すメモを memory/YYYY-MM-DD.md に書き込んでください。保存するものがない場合は、正確なサイレントトークン NO_REPLY で応答してください。",
        },
      },
    },
  },
}
```

- `mode`: `default` または `safeguard`（長い履歴向けのチャンク単位の要約）。[Compaction](/ja-JP/concepts/compaction)を参照してください。
- `provider`: 登録済みの Compaction プロバイダー Plugin の ID。設定すると、組み込みの LLM 要約の代わりにプロバイダーの `summarize()` が呼び出されます。失敗した場合は組み込み機能にフォールバックします。プロバイダーを設定すると、`mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction)を参照してください。
- `timeoutSeconds`: OpenClaw が中止するまでに、1 回の Compaction 操作に許可される最大秒数。デフォルト: `180`。
- `reserveTokens`: Compaction 後のモデル出力と将来のツール結果用に確保されるトークンの余裕。モデルのコンテキストウィンドウが既知の場合、OpenClaw は実効予約量がプロンプト予算を消費しないよう上限を設定します。
- `reserveTokensFloor`: 組み込みランタイムによって適用される最小予約量。下限を無効にするには `0` を設定します。この下限には、引き続き有効なコンテキストウィンドウの上限が適用されます。
- `keepRecentTokens`: 最新のトランスクリプト末尾を原文のまま保持するためのエージェント切断点予算。明示的に設定されている場合、手動の `/compact` はこの値に従います。それ以外の場合、手動 Compaction は厳密なチェックポイントになります。
- `recentTurnsPreserve`: セーフガード要約の外側で原文のまま保持される、直近のユーザー／アシスタントターン数。デフォルト: `3`。
- `maxHistoryShare`: Compaction 後に保持される履歴に許可される、コンテキスト予算全体に対する最大比率（範囲 `0.1`～`0.9`）。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction 要約時に組み込みの不透明な識別子を保持するためのガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用される、識別子保持用の任意のカスタムテキスト。
- `qualityGuard`: セーフガード要約の不正な形式の出力に対する再試行チェック。セーフガードモードではデフォルトで有効です。監査を省略するには `enabled: false` を設定します。
- `midTurnPrecheck`: 任意のツールループ負荷チェック。`enabled: true` の場合、OpenClaw はツール結果が追加された後、次のモデル呼び出しの前にコンテキスト負荷を確認します。コンテキストが収まらなくなった場合、プロンプトを送信する前に現在の試行を中止し、既存の事前チェック復旧パスを再利用してツール結果を切り詰めるか、Compaction を実行して再試行します。`default` と `safeguard` の両方の Compaction モードで動作します。デフォルト: 無効。
- `postIndexSync`: Compaction 後のセッションメモリ再インデックスモード。デフォルト: `"async"`。鮮度を最優先する場合は `"await"`、Compaction のレイテンシーを低減する場合は `"async"`、セッションメモリの同期がほかの場所で処理される場合に限り `"off"` を使用します。
- `postCompactionSections`: Compaction 後に再挿入する、任意の AGENTS.md H2/H3 セクション名。未設定または `[]` に設定されている場合、再挿入は無効です。`["Session Startup", "Red Lines"]` を明示的に設定すると、その組み合わせが有効になり、従来の `Every Session`/`Safety` フォールバックが保持されます。追加コンテキストの価値が、Compaction 要約にすでに取り込まれているプロジェクトガイダンスを重複させるリスクに見合う場合にのみ有効にしてください。
- `model`: Compaction 要約のみに使用する、任意の `provider/model-id` または `agents.defaults.models` の単純なエイリアス。単純なエイリアスはディスパッチ前に解決されます。競合時は、設定されたリテラルモデル ID が優先されます。メインセッションではあるモデルを維持しつつ、Compaction 要約を別のモデルで実行する場合に使用します。未設定の場合、Compaction はセッションのプライマリモデルを使用します。
- `truncateAfterCompaction`: Compaction 後にアクティブなセッショントランスクリプトをローテーションし、以後のターンでは要約と未要約の末尾のみを読み込む一方、以前の完全なトランスクリプトはアーカイブに残します。長時間実行されるセッションで、アクティブなトランスクリプトが際限なく増大するのを防ぎます。デフォルト: `false`。
- `maxActiveTranscriptBytes`: トランスクリプト履歴がしきい値を超えた場合、実行前に通常のローカル Compaction を開始する任意のバイトしきい値（`number` または `"20mb"` のような文字列）。Compaction の成功後に、より小さい後続トランスクリプトへローテーションできるようにするため、`truncateAfterCompaction` が必要です。未設定または `0` の場合は無効です。
- `notifyUser`: `true` の場合、簡潔なコンテキスト保守通知をユーザーへ送信します。通知は、Compaction の開始時と完了時（例: 「コンテキストを Compaction 中...」「Compaction が完了しました」）、および Compaction 前のメモリフラッシュを使い果たし、機能が低下した状態で応答を続行する場合（例: 「メモリ保守に一時的に失敗しました。応答を続行します。」）に送信されます。これらの通知を表示しないよう、デフォルトでは無効です。
- `memoryFlush`: 永続的なメモリを保存するため、自動 Compaction の前に実行されるサイレントなエージェントターン。この保守ターンをローカルモデル上に維持する必要がある場合、`model` を `ollama/qwen3:8b` のような正確なプロバイダー／モデルに設定します。このオーバーライドは、アクティブなセッションのフォールバックチェーンを継承しません。`forceFlushTranscriptBytes` は、トークンカウンターが古い場合でも、トランスクリプトサイズがしきい値に達するとフラッシュを強制します。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.runRetries`

障害復旧中の無限実行ループを防ぐための、組み込みエージェントランタイムにおける外側の実行ループの再試行回数境界。この設定は組み込みエージェントランタイムにのみ適用され、ACP または CLI ランタイムには適用されません。

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
        runRetries: { max: 50 }, // エージェントごとの任意のオーバーライド
      },
    ],
  },
}
```

- `base`: 外側の実行ループにおける基本の実行再試行回数。デフォルト: `24`。
- `perProfile`: フォールバックプロファイル候補ごとに追加される実行再試行回数。デフォルト: `8`。
- `min`: 実行再試行回数の絶対的な最小上限。デフォルト: `32`。
- `max`: 暴走を防ぐための、実行再試行回数の絶対的な最大上限。デフォルト: `160`。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内のコンテキストから**古いツール結果**を削減します。ディスク上のセッション履歴は変更**しません**。デフォルトでは無効です。有効にするには `mode: "cache-ttl"` を設定します。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off（デフォルト）| cache-ttl
        ttl: "1h", // 期間（ms/s/m/h）、デフォルト単位: 分、デフォルト: 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[古いツール結果の内容を消去しました]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl モードの動作">

- `mode: "cache-ttl"` は削減処理を有効にします。
- `ttl` は、最後にキャッシュへアクセスした後、削減処理を再度実行できるまでの間隔を制御します。デフォルト: `5m`。
- 削減処理では、まずサイズの大きいツール結果をソフトトリミングし、必要に応じて古いツール結果をハードクリアします。
- `softTrimRatio` と `hardClearRatio` には、`0.0` から `1.0` までの値を指定できます。設定の検証では、この範囲外の値は拒否されます。

**ソフトトリミング**では先頭と末尾を保持し、その間に `...` を挿入します。

**ハードクリア**では、ツール結果全体をプレースホルダーに置き換えます。

注:

- 画像ブロックはトリミングもクリアもされません。
- 比率は文字数に基づく概算であり、正確なトークン数ではありません。
- アシスタントメッセージが `keepLastAssistants` 件未満の場合、削減処理はスキップされます。

</Accordion>

動作の詳細については、[セッションの削減](/ja-JP/concepts/session-pruning)を参照してください。

### ブロックストリーミング

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off（デフォルト）| natural | custom（minMs/maxMs を使用）
    },
  },
}
```

- Telegram 以外のチャンネルでは、ブロック返信を有効にするために `*.streaming.block.enabled: true` を明示的に設定する必要があります。QQ Bot は例外です。`streaming.block` キーがなく、`channels.qqbot.streaming.mode` が `"off"` でない限りブロック返信をストリーミングします。
- チャンネルごとのオーバーライド: `channels.<channel>.streaming.block.coalesce`（およびアカウントごとのバリエーション）。Discord、Google Chat、Mattermost、MS Teams、Signal、Slack のデフォルトは `minChars: 1500` / `idleMs: 1000` です。
- `blockStreamingChunk.breakPreference`: 優先されるチャンク境界（`"paragraph" | "newline" | "sentence"`）。
- `humanDelay`: ブロック返信間のランダムな一時停止。デフォルト: `off`。`natural` = 800-2500ms。`custom` は `minMs`/`maxMs` を使用します（未設定の境界値には自然な範囲がフォールバックとして使用されます）。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク分割の詳細については、[ストリーミング](/ja-JP/concepts/streaming)を参照してください。

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

- デフォルト: ダイレクトチャット／メンションでは `instant`、メンションのないグループチャットでは `message`。
- `typingIntervalSeconds` のデフォルト: `6`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[入力中インジケーター](/ja-JP/concepts/typing-indicators)を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

組み込みエージェント向けの任意のサンドボックス化。完全なガイドについては、[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off（デフォルト）| non-main | all
        backend: "docker", // docker（デフォルト）| ssh | openshell
        scope: "agent", // session | agent（デフォルト）| shared
        workspaceAccess: "none", // none（デフォルト）| ro | rw
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
          // SecretRefs／インラインコンテンツにも対応:
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

上記に示したデフォルト（`off`/`docker`/`agent`/`none`/`bookworm-slim` イメージ／`none` ネットワークなど）は、単なる例示値ではなく、実際の OpenClaw のデフォルトです。

<Accordion title="サンドボックスの詳細">

**バックエンド:**

- `docker`: ローカル Docker ランタイム（デフォルト）
- `ssh`: 汎用 SSH ベースのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` を選択すると、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのワークスペースに使用するリモートの絶対ルート（デフォルト: `/tmp/openclaw-sandboxes`）
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡す既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が実行時に一時ファイルとして具現化するインラインコンテンツまたは SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH のホストキーポリシー設定（どちらもデフォルトは `true`）

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先されます
- `certificateData` は `certificateFile` より優先されます
- `knownHostsData` は `knownHostsFile` より優先されます
- SecretRef ベースの `*Data` 値は、サンドボックスセッションの開始前に、アクティブなシークレットランタイムのスナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成後に、リモートワークスペースへ一度だけ初期データを投入します
- その後はリモート SSH ワークスペースを正規の状態として維持します
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングします
- リモートでの変更をホストへ自動的に同期しません
- サンドボックス化されたブラウザコンテナには対応しません

**ワークスペースアクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのサンドボックスワークスペース（デフォルト）
- `ro`: `/workspace` にあるサンドボックスワークスペース。エージェントワークスペースは `/agent` に読み取り専用でマウントされます
- `rw`: エージェントワークスペースは `/workspace` に読み書き可能でマウントされます

**スコープ:**

- `session`: セッションごとのコンテナとワークスペース
- `agent`: エージェントごとに 1 つのコンテナとワークスペース（デフォルト）
- `shared`: 共有コンテナとワークスペース（セッション間の分離なし）

**OpenShell Plugin 設定:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror（デフォルト）| remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // 任意
          gatewayEndpoint: "https://lab.example", // 任意
          policy: "strict", // 任意の OpenShell ポリシー ID
          providers: ["openai"], // 任意
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell モード:**

- `mirror`: 実行前にローカルからリモートへ初期データを投入し、実行後に同期して戻します。ローカルワークスペースが正規の状態として維持されます
- `remote`: サンドボックス作成時にリモートへ一度だけ初期データを投入し、その後はリモートワークスペースを正規の状態として維持します

`remote` モードでは、初期データ投入後に OpenClaw の外部で行われたホストローカルの編集は、サンドボックスへ自動的に同期されません。
転送には OpenShell サンドボックスへの SSH を使用しますが、サンドボックスのライフサイクルと任意のミラー同期は Plugin が所有します。

**`setupCommand`** はコンテナ作成後に一度だけ実行されます（`sh -lc` 経由）。ネットワークへの送信アクセス、書き込み可能なルート、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"` です** — エージェントに外部へのアクセスが必要な場合は、`"bridge"`（またはカスタムブリッジネットワーク）に設定します。
`"host"` はブロックされます。`"container:<id>"` は、`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を明示的に設定しない限り、デフォルトでブロックされます（緊急時の制限解除）。
アクティブな OpenClaw サンドボックス内での Codex app-server ターンも、ネイティブコードモードのネットワークアクセスに同じ送信設定を使用します。

**受信添付ファイル**は、アクティブなワークスペースの `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルのバインドとエージェントごとのバインドはマージされます。

**サンドボックス化されたブラウザ**（`sandbox.browser.enabled`、デフォルトは `false`）: コンテナ内の Chromium + CDP。noVNC URL がシステムプロンプトに挿入されます。`openclaw.json` の `browser.enabled` は必要ありません。
noVNC のオブザーバーアクセスではデフォルトで VNC 認証が使用され、OpenClaw は共有 URL にパスワードを公開する代わりに、有効期間の短いトークン URL を発行します。

- `allowHostControl: false`（デフォルト）は、サンドボックス化されたセッションがホストブラウザを対象にすることを防ぎます。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用ブリッジネットワーク）です。グローバルなブリッジ接続を明示的に必要とする場合にのみ、`bridge` に設定してください。ここでも `"host"` はブロックされます。
- `cdpSourceRange` は、コンテナ境界での CDP 受信アクセスを任意で CIDR 範囲（例: `172.21.0.1/32`）に制限します。
- `sandbox.browser.binds` は、追加のホストディレクトリをサンドボックスブラウザコンテナにのみマウントします。設定すると（`[]` を含む）、ブラウザコンテナでは `docker.binds` が置き換えられます。
- サンドボックスブラウザコンテナの Chromium は常に `--no-sandbox --disable-setuid-sandbox` を指定して起動します（コンテナには Chrome 自身のサンドボックスに必要なカーネルプリミティブがありません）。これを切り替える設定はありません。
- 起動時のデフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナホスト向けに調整されています:
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
    デフォルトで有効です。WebGL／3D の利用で必要な場合は、
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - `--disable-extensions`（デフォルトで有効）。ワークフローが拡張機能に依存する場合は、`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で
    拡張機能を再度有効にできます。
  - デフォルトは `--renderer-process-limit=2` です。変更するには
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` を使用し、Chromium のデフォルトのプロセス制限を使用するには `0` を
    設定します。
  - `headless` が有効な場合にのみ `--headless=new`。
  - デフォルトはコンテナイメージのベースラインです。コンテナのデフォルトを変更するには、カスタム
    エントリポイントを備えたカスタムブラウザイメージを使用してください。

</Accordion>

ブラウザのサンドボックス化と `sandbox.docker.binds` は Docker でのみ利用できます。

イメージをビルドする（ソースチェックアウトから）:

```bash
scripts/sandbox-setup.sh           # メインのサンドボックスイメージ
scripts/sandbox-browser-setup.sh   # 任意のブラウザイメージ
```

ソースチェックアウトを使用しない npm インストールについては、インラインの `docker build` コマンドを [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup)で確認してください。

### `agents.list`（エージェントごとのオーバーライド）

`agents.list[].tts` を使用すると、エージェントごとに独自の TTS プロバイダー、音声、モデル、
スタイル、または自動 TTS モードを指定できます。エージェントブロックはグローバルな
`messages.tts` にディープマージされるため、共有認証情報を 1 か所に保持したまま、個々の
エージェントは必要な音声またはプロバイダーフィールドのみをオーバーライドできます。アクティブなエージェントの
オーバーライドは、自動音声応答、`/tts audio`、`/tts status`、および
`tts` エージェントツールに適用されます。プロバイダーの例と優先順位については、
[テキスト読み上げ](/ja-JP/tools/tts#per-agent-voice-overrides)を参照してください。

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "メインエージェント",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // または { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // エージェントごとの思考レベルの上書き
        reasoningDefault: "on", // エージェントごとの推論表示の上書き
        fastModeDefault: false, // エージェントごとの高速モードの上書き
        params: { cacheRetention: "none" }, // 一致する defaults.models のパラメーターをキー単位で上書き
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // 設定した場合は agents.defaults.skills を置き換える
        identity: {
          name: "Samantha",
          theme: "親切なナマケモノ",
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

- `id`: 安定したエージェント ID（必須）。
- `default`: 複数設定されている場合は、最初のものが優先されます（警告がログに記録されます）。どれも設定されていない場合は、リストの最初のエントリがデフォルトになります。
- `model`: 文字列形式では、モデルのフォールバックを使用しない厳密なエージェントごとのプライマリが設定されます。オブジェクト形式の `{ primary }` も、`fallbacks` を追加しない限り厳密です。`{ primary, fallbacks: [...] }` を使用すると、そのエージェントでフォールバックを有効にできます。また、`{ primary, fallbacks: [] }` を使用すると厳密な動作を明示できます。`primary` のみを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、引き続きデフォルトのフォールバックを継承します。
- `utilityModel`: 生成されるセッション名やスレッド名など、短い内部タスク向けの任意のエージェントごとの上書きです。`agents.defaults.utilityModel`、プライマリプロバイダーが宣言した小型モデルのデフォルト、このエージェントのプライマリモデルの順にフォールバックします。空文字列を指定すると、このエージェントのユーティリティルーティングが無効になります。
- `params`: `agents.defaults.models` で選択されたモデルエントリにマージされる、エージェントごとのストリームパラメーターです。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有の上書きを設定する場合に使用します。
- `tts`: 任意のエージェントごとのテキスト読み上げ設定の上書きです。このブロックは `messages.tts` にディープマージされるため、共有プロバイダーの認証情報とフォールバックポリシーは `messages.tts` に保持し、プロバイダー、音声、モデル、スタイル、自動モードなど、ペルソナ固有の値のみをここに設定してください。
- `skills`: 任意のエージェントごとの Skills 許可リストです。省略した場合、設定されていればエージェントは `agents.defaults.skills` を継承します。明示的なリストはデフォルトとマージせずに置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェントごとのデフォルト思考レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）です。メッセージ単位またはセッション単位の上書きが設定されていない場合、このエージェントでは `agents.defaults.thinkingDefault` を上書きします。選択したプロバイダー／モデルプロファイルによって、有効な値が決まります。Google Gemini では、`adaptive` によってプロバイダー管理の動的思考が維持されます（Gemini 3/3.1 では `thinkingLevel` を省略し、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 任意のエージェントごとのデフォルト推論表示（`on | off | stream`）です。メッセージ単位またはセッション単位の推論の上書きが設定されていない場合、このエージェントでは `agents.defaults.reasoningDefault` を上書きします。
- `fastModeDefault`: 任意のエージェントごとの高速モードのデフォルト（`"auto" | true | false`）です。メッセージ単位またはセッション単位の高速モードの上書きが設定されていない場合に適用されます。
- `models`: 完全な `provider/model` ID をキーとする、任意のエージェントごとのモデルカタログ／ランタイムの上書きです。エージェントごとのランタイム例外には `models["provider/model"].agentRuntime` を使用します。
- `runtime`: 任意のエージェントごとのランタイム記述子です。エージェントで ACP ハーネスセッションをデフォルトにする場合は、`runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）とともに `type: "acp"` を使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- ローカルのワークスペース相対 `identity.avatar` 画像ファイルは 2 MB に制限されます。`http(s)` URL と `data:` URI は、ローカルファイルサイズの制限に対して検査されません。
- `identity` はデフォルトを導出します。`ackReaction` は `emoji` から、`mentionPatterns` は `name`/`emoji` から導出されます。
- `subagents.allowAgents`: 明示的な `sessions_spawn.agentId` ターゲットとして設定済みエージェント ID を指定する許可リストです（`["*"]` = 設定済みの任意のターゲット。デフォルト: 同じエージェントのみ）。自身をターゲットとする `agentId` 呼び出しを許可する場合は、要求元の ID を含めます。エージェント設定が削除された古いエントリは `sessions_spawn` によって拒否され、`agents_list` から除外されます。これらをクリーンアップするには `openclaw doctor --fix` を実行します。または、デフォルトを継承しながらそのターゲットを引き続き生成可能にする場合は、最小限の `agents.list[]` エントリを追加します。
- サンドボックス継承ガード: 要求元セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス外で実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します。デフォルト: false）。
- `subagents.maxConcurrent`: サブエージェント実行全体における子エージェントの最大同時実行数です。デフォルト: `8`。
- `subagents.maxChildrenPerAgent`: 1 つのエージェントセッションが生成できるアクティブな子の最大数です。デフォルト: `5`。
- `subagents.maxSpawnDepth`: サブエージェント生成の最大ネスト深度（`1`～`5`）です。デフォルト: `1`（ネストなし）。
- `subagents.archiveAfterMinutes`: 完了したサブエージェントの状態がアーカイブされるまでの期間です。デフォルト: `60`。

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

### バインディングの一致フィールド

- `type`（任意）: 通常のルーティングには `route`（type を省略すると route がデフォルト）、永続的な ACP 会話バインディングには `acp`。
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のアカウント。省略 = デフォルトアカウント）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。チャネル固有）
- `acp`（任意。`type: "acp"` のみ）: `{ mode, label, cwd, backend }`

**決定論的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致。ピア／ギルド／チームなし）
5. `match.accountId: "*"`（チャネル全体）
6. デフォルトエージェント

各階層内では、最初に一致する `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は正確な会話 ID（`match.channel` + アカウント + `match.peer.id`）によって解決し、前述のルートバインディングの階層順序は使用しません。

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

<Accordion title="ファイルシステムへのアクセスなし（メッセージングのみ）">

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce（デフォルト）| warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // 期間または false
      maxDiskBytes: "500mb", // 任意のハード上限
      highWaterBytes: "400mb", // 任意のクリーンアップ目標
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 非アクティブ時に自動的にフォーカスを解除するまでのデフォルト時間（時間単位。`0` で無効）
      maxAgeHours: 0, // デフォルトの絶対最大存続時間（時間単位。`0` で無効）
    },
    mainKey: "main", // レガシー（ランタイムは常に "main" を使用）
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
  - `per-sender`（デフォルト）: 各送信者に、チャンネルコンテキスト内で分離されたセッションが割り当てられます。
  - `global`: チャンネルコンテキスト内のすべての参加者が単一のセッションを共有します（共有コンテキストを意図する場合にのみ使用してください）。
- **`dmScope`**: DM のグループ化方法。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャンネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャンネルと送信者の組み合わせごとに分離します（複数ユーザーの受信トレイに推奨）。
  - `per-account-channel-peer`: アカウント、チャンネル、送信者の組み合わせごとに分離します（複数アカウントに推奨）。
- **`identityLinks`**: チャンネル間でセッションを共有するため、正規 ID をプロバイダー接頭辞付きピアにマッピングします。`/dock_discord` などのドッキングコマンドも同じマップを使用し、アクティブセッションの返信ルートをリンク済みの別チャンネルピアへ切り替えます。[チャンネルのドッキング](/ja-JP/concepts/channel-docking)を参照してください。
- **`reset`**: 主要なリセットポリシー。`daily` は現地時刻の `atHour` にリセットし、`idle` は `idleMinutes` 後にリセットします。両方を設定した場合、先に期限切れになる方が優先されます。日次リセットの鮮度判定にはセッション行の `sessionStartedAt` を使用し、アイドルリセットの鮮度判定には `lastInteractionAt` を使用します。Heartbeat、Cron のウェイクアップ、exec 通知、Gateway の管理処理などのバックグラウンド／システムイベントによる書き込みは `updatedAt` を更新する場合がありますが、日次／アイドルセッションの鮮度は維持しません。
- **`resetByType`**: タイプごとのオーバーライド（`direct`、`group`、`thread`）。従来の `dm` は `direct` のエイリアスとして受け付けられます。
- **`resetByChannel`**: プロバイダー／チャンネル ID をキーとするチャンネルごとのリセットオーバーライド。セッションのチャンネルに一致するエントリがある場合、そのセッションでは `resetByType`/`reset` より無条件に優先されます。1 つのチャンネルだけにタイプ単位のポリシーとは異なるリセット動作が必要な場合にのみ使用してください。
- **`mainKey`**: 従来のフィールド。ランタイムはメインのダイレクトチャット用バケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: エージェント間のやり取りにおける、エージェント同士の返信往復回数の上限（整数、範囲: `0`～`20`、デフォルト: `5`）。`0` にすると、ピンポン形式の連鎖が無効になります。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、従来の `dm` エイリアスを含む）、`keyPrefix`、または `rawKeyPrefix` で照合します。最初に一致した拒否ルールが優先されます。
- **`maintenance`**: セッションストアのクリーンアップと保持期間の制御。
  - `mode`: `enforce` はクリーンアップを適用するデフォルト値で、`warn` は警告のみを出力します。
  - `pruneAfter`: 古いエントリを判定する経過時間のしきい値（デフォルト `30d`）。
  - `maxEntries`: SQLite セッションエントリの最大数（デフォルト `500`）。ランタイム書き込みでは、本番規模の上限向けに小さな高水位バッファを設けて一括クリーンアップします。`openclaw sessions cleanup --enforce` は上限を直ちに適用します。
  - 短時間のみ存続する Gateway モデル実行プローブセッションには固定の `24h` 保持期間が適用されますが、クリーンアップは負荷状況によって制御されます。セッションエントリのメンテナンスまたは上限の負荷に達した場合にのみ、古くなった厳密なモデル実行プローブ行を削除します。`agent:*:explicit:model-run-<uuid>` に一致する厳密かつ明示的なプローブキーのみが対象です。通常のダイレクト、グループ、スレッド、Cron、フック、Heartbeat、ACP、サブエージェントのセッションには、この 24h の保持期間は継承されません。モデル実行のクリーンアップが行われる場合、より広範な `pruneAfter` の古いエントリのクリーンアップおよび `maxEntries` の上限処理より先に実行されます。
  - 従来の `rotateBytes` は現在のスキーマでは拒否されます。`openclaw doctor --fix` は古い設定からこれを削除します。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter` です。無効にするには `false` を設定します。
  - `maxDiskBytes`: セッションディレクトリの任意のディスク容量予算。`warn` モードでは警告をログに記録し、`enforce` モードでは古いアーティファクト／セッションから順に削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`writeLock`**: セッショントランスクリプトの書き込みロック制御。正当なトランスクリプトの準備、クリーンアップ、Compaction、またはミラー処理で、競合がデフォルトポリシーより長く続く場合にのみ調整してください。
  - `acquireTimeoutMs`: ロックの取得中、セッションをビジーとして報告するまで待機するミリ秒数。デフォルト: `60000`、環境変数によるオーバーライド: `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`。
  - `staleMs`: 既存のロックを古いものと見なして回収するまでのミリ秒数。デフォルト: `1800000`、環境変数によるオーバーライド: `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`。
  - `maxHoldMs`: プロセス内で保持されているロックを、ウォッチドッグが解放するまで保持できるミリ秒数。デフォルト: `300000`、環境変数によるオーバーライド: `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。
- **`threadBindings`**: スレッドにバインドされたセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ（プロバイダーによるオーバーライドが可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ状態が続いた場合に自動的にフォーカスを解除するデフォルト時間（時間単位。`0` で無効化。プロバイダーによるオーバーライドが可能）
  - `maxAgeHours`: デフォルトの最大存続時間（時間単位。`0` で無効化。プロバイダーによるオーバーライドが可能）
  - `spawnSessions`: `sessions_spawn` および ACP スレッド生成から、スレッドにバインドされた作業セッションを作成するためのデフォルトゲート。スレッドバインディングが有効な場合のデフォルトは `true` です。プロバイダー／アカウントによるオーバーライドが可能です。
  - `defaultSpawnContext`: スレッドにバインドされた生成のデフォルトネイティブサブエージェントコンテキスト（`"fork"` または `"isolated"`）。デフォルトは `"fork"` です。

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
      mode: "steer", // steer（デフォルト）| followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize（デフォルト）
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 で無効化
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答の接頭辞

チャンネル／アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順序（最も具体的な設定が優先）: アカウント → チャンネル → グローバル。`""` は無効化し、カスケードを停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| 変数              | 説明                   | 例                          |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | モデルの短縮名         | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子     | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名         | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル       | `high`、`low`、`off`        |
| `{identity.name}` | エージェントの識別名   | （`"auto"` と同じ）          |

変数では大文字と小文字を区別しません。`{think}` は `{thinkingLevel}` のエイリアスです。

### 確認リアクション

- デフォルトではアクティブなエージェントの `identity.emoji` を使用し、それがなければ `"👀"` を使用します。無効にするには `""` を設定します。
- チャンネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャンネル → `messages.ackReaction` → アイデンティティのフォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`、または `off`/`none`（確認リアクションを完全に無効化）。
- `removeAckAfterReply`: Slack、Discord、Signal、Telegram、WhatsApp、iMessage など、リアクションに対応するチャンネルで返信後に確認リアクションを削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Signal、Telegram、WhatsApp でライフサイクルステータスのリアクションを有効にします。
  Discord では、未設定の場合、確認リアクションがアクティブであればステータスリアクションも有効のままになります。
  Slack、Signal、Telegram、WhatsApp では、ライフサイクルステータスのリアクションを有効にするため、明示的に `true` を設定してください。
  Slack はデフォルトで、進行状況にネイティブのアシスタントスレッドステータスと切り替わる読み込みメッセージを使用し、設定された確認リアクションは固定のまま維持します。
- `messages.statusReactions.emojis`: ライフサイクル絵文字キーをオーバーライドします:
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft`、および `stallHard`。
  Telegram では使用できるリアクションが固定されているため、設定された未対応の絵文字は、
  そのチャットでサポートされる最も近いステータスの種類にフォールバックします。

### キュー

- `mode`: セッション実行中に到着した受信メッセージのキュー戦略。デフォルト: `"steer"`。
  - `steer`: 新しいプロンプトをアクティブな実行に挿入します。
  - `followup`: アクティブな実行が完了した後に、新しいプロンプトを実行します。
  - `collect`: 互換性のあるメッセージをまとめ、後で一括して実行します。
  - `interrupt`: 最新のプロンプトを開始する前に、アクティブな実行を中止します。
- `debounceMs`: キューに入れられた、または誘導されたメッセージをディスパッチするまでの遅延。デフォルト: `500`。
- `cap`: ドロップポリシーを適用するまでにキューへ格納できるメッセージの最大数。デフォルト: `20`。
- `drop`: 上限を超えた場合の戦略。`"summarize"`（デフォルト）は最も古いエントリを削除しますが、簡潔な要約は保持します。`"old"` は要約を残さずに最も古いエントリを削除し、`"new"` は最新の項目を拒否します。
- `byChannel`: プロバイダー ID をキーとする、チャンネルごとの `mode` オーバーライド。
- `debounceMsByChannel`: プロバイダー ID をキーとする、チャンネルごとの `debounceMs` オーバーライド。

### 受信デバウンス

同じ送信者から短時間に連続して届くテキストのみのメッセージを、エージェントの単一ターンにまとめます。メディア／添付ファイルは直ちにフラッシュされます。制御コマンドはデバウンスを迂回します。デフォルトの `debounceMs`: `2000`。

### その他のメッセージキー

- `messages.messagePrefix`: 受信したユーザーメッセージがエージェントランタイムに到達する前に付加される接頭辞テキスト。チャンネルコンテキストのマーカーとして必要最小限に使用してください。
- `messages.visibleReplies`: ダイレクト、グループ、チャンネルの各会話に表示される送信元への返信を制御します（`"message_tool"` で表示出力を行うには `message(action=send)` が必要です。`"automatic"` は従来どおり通常の返信を投稿します）。
- `messages.usageTemplate` / `messages.responseUsage`: カスタム `/usage` フッターテンプレートと、返信ごとのデフォルト使用モード（`off | tokens | full`、および `tokens` の従来のエイリアス `on`）。
- `messages.groupChat.mentionPatterns` / `historyLimit`: グループメッセージのメンショントリガーと履歴ウィンドウのサイズ指定。
- `messages.suppressToolErrors`: `true` の場合、ユーザーに表示される `⚠️` ツールエラー警告を抑制します（エージェントは引き続きコンテキスト内でエラーを認識し、再試行できます）。デフォルト: `false`。

### TTS（テキスト読み上げ）

```json5
{
  messages: {
    tts: {
      auto: "off", // off (default) | always | inbound | tagged
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

- `auto`は、デフォルトの自動TTSモード（`off`、`always`、`inbound`、または`tagged`）を制御します。`/tts on|off`でローカル設定を上書きでき、`/tts status`で有効な状態を確認できます。
- `summaryModel`は、自動要約で使用する`agents.defaults.model.primary`を上書きします。
- `modelOverrides`はデフォルトで有効です（`enabled !== false`）。`modelOverrides.allowProvider`は明示的な有効化が必要です。
- APIキーは、`ELEVENLABS_API_KEY`/`XI_API_KEY`および`OPENAI_API_KEY`にフォールバックします。
- 同梱の音声プロバイダーはPluginが所有します。`plugins.allow`が設定されている場合は、使用する各TTSプロバイダーPluginを含めてください。たとえば、Edge TTSには`microsoft`を指定します。従来のプロバイダーID `edge`は、`microsoft`のエイリアスとして受け入れられます。
- `providers.openai.baseUrl`は、OpenAI TTSエンドポイントを上書きします。解決順序は、設定、`OPENAI_TTS_BASE_URL`、`https://api.openai.com/v1`です。
- `providers.openai.baseUrl`がOpenAI以外のエンドポイントを指す場合、OpenClawはそれをOpenAI互換TTSサーバーとして扱い、モデルと音声の検証を緩和します。

---

## Talk

Talkモード（macOS/iOS/AndroidおよびブラウザーのControl UI）のデフォルト設定です。

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- 複数のTalkプロバイダーを設定する場合、`talk.provider`は`talk.providers`内のキーと一致する必要があります。
- 従来のフラットなTalkキー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性維持専用です。`openclaw doctor --fix`を実行して、保存済み設定を`talk.providers.<provider>`に書き換えてください。
- 音声IDは、`ELEVENLABS_VOICE_ID`または`SAG_VOICE_ID`にフォールバックします（macOS Talkクライアントの動作）。
- `providers.*.apiKey`は、プレーンテキスト文字列またはSecretRefオブジェクトを受け入れます。
- `ELEVENLABS_API_KEY`へのフォールバックは、Talk APIキーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases`を使用すると、Talkディレクティブでわかりやすい名前を使用できます。
- `providers.mlx.modelId`は、macOSのローカルMLXヘルパーが使用するHugging Faceリポジトリを選択します。省略した場合、macOSは`mlx-community/Soprano-80M-bf16`を使用します。
- macOSでのMLX再生は、同梱の`openclaw-mlx-tts`ヘルパーが存在する場合はそれを経由し、存在しない場合は`PATH`上の実行可能ファイルを経由します。`OPENCLAW_MLX_TTS_BIN`は、開発時のヘルパーパスを上書きします。
- `consultThinkingLevel`は、Control UI Talkのリアルタイム`openclaw_agent_consult`呼び出しの背後で実行される完全なOpenClawエージェント実行の思考レベルを制御します。通常のセッションおよびモデルの動作を維持するには、未設定のままにしてください。
- `consultFastMode`は、セッションの通常の高速モード設定を変更せずに、Control UI Talkのリアルタイムコンサルトに対して1回限りの高速モード上書きを設定します。
- `speechLocale`は、iOS/macOSのTalk音声認識で使用するBCP 47ロケールIDを設定します。デバイスのデフォルトを使用するには、未設定のままにしてください。
- `silenceTimeoutMs`は、ユーザーが話し終えてからTalkモードが文字起こしを送信するまでの待機時間を制御します。未設定の場合、プラットフォームのデフォルトの一時停止時間（`700 ms on macOS and Android, 900 ms on iOS`）が維持されます。
- `realtime.instructions`は、OpenClawに組み込まれたリアルタイムプロンプトにプロバイダー向けのシステム指示を追加します。これにより、デフォルトの`openclaw_agent_consult`ガイダンスを失うことなく音声スタイルを設定できます。
- `realtime.vadThreshold`は、プロバイダーの音声アクティビティしきい値を`0`（最も高感度）から`1`（最も低感度）の範囲で設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.silenceDurationMs`は、プロバイダーがリアルタイムのユーザーターンを確定するまでの無音時間を正の整数で設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.prefixPaddingMs`は、音声の検出開始前に保持する音声量を負でない整数で設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.reasoningEffort`は、リアルタイムセッションに対するプロバイダー固有の推論レベルを設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.consultRouting`：`"provider-direct"`（デフォルト）は、リアルタイムプロバイダーが`openclaw_agent_consult`なしで最終的なユーザー文字起こしを生成した場合に、プロバイダーからの直接応答を維持します。代わりに、`"force-agent-consult"`は確定したリクエストをOpenClaw経由で処理します。

---

## 関連項目

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他すべての設定キー
- [設定](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [設定例](/ja-JP/gateway/configuration-examples)
