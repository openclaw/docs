---
read_when:
    - エージェントのデフォルト設定を調整する（モデル、思考、ワークスペース、Heartbeat、メディア、Skills）
    - マルチエージェントのルーティングとバインディングの設定
    - セッション、メッセージ配信、トークモードの動作を調整する
summary: エージェントのデフォルト、マルチエージェントルーティング、セッション、メッセージ、トーク設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-07-16T11:43:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、および `talk.*` 配下のエージェントスコープ設定キーです。チャンネル、ツール、Gateway ランタイム、およびその他の
トップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: 設定されている場合は `OPENCLAW_WORKSPACE_DIR`、それ以外は `~/.openclaw/workspace`（または `OPENCLAW_PROFILE` がデフォルト以外のプロファイルに設定されている場合は `~/.openclaw/workspace-<profile>`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明示的な `agents.defaults.workspace` の値は、
`OPENCLAW_WORKSPACE_DIR` より優先されます。設定にパスを書き込みたくない場合は、環境変数を使用してデフォルトエージェントが
マウント済みワークスペースを参照するようにします。

### `agents.defaults.repoRoot`

システムプロンプトの Runtime 行に表示される任意のリポジトリルートです。未設定の場合、OpenClaw はワークスペースから上位へたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないエージェント向けの、任意のデフォルト Skills 許可リストです。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github、weather を継承
      { id: "docs", skills: ["docs-search"] }, // デフォルトを置換
      { id: "locked-down", skills: [] }, // Skills なし
    ],
  },
}
```

- デフォルトで Skills を制限しない場合は、`agents.defaults.skills` を省略します。
- デフォルトを継承する場合は、`agents.list[].skills` を省略します。
- Skills なしにする場合は、`agents.list[].skills: []` を設定します。
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

必須のブートストラップファイル（`AGENTS.md`、`TOOLS.md`、`BOOTSTRAP.md`）は引き続き書き込みつつ、選択した任意のワークスペースファイルの作成をスキップします。有効な値: `SOUL.md`、`USER.md`、`HEARTBEAT.md`、および `IDENTITY.md`。

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

ワークスペースのブートストラップファイルをシステムプロンプトに挿入するタイミングを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（アシスタントの応答完了後）では、ワークスペースブートストラップの再挿入をスキップし、プロンプトサイズを削減します。Heartbeat の実行と Compaction 後の再試行では、引き続きコンテキストを再構築します。
- `"never"`: すべてのターンで、ワークスペースブートストラップとコンテキストファイルの挿入を無効にします。プロンプトのライフサイクルを完全に自身で管理するエージェント（カスタムコンテキストエンジン、独自にコンテキストを構築するネイティブランタイム、またはブートストラップを使用しない専用ワークフロー）にのみ使用してください。Heartbeat および Compaction 復旧ターンでも挿入をスキップします。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

エージェントごとの上書き: `agents.list[].contextInjection`。省略した値は
`agents.defaults.contextInjection` を継承します。

### `agents.defaults.bootstrapMaxChars`

切り詰め前の、ワークスペースブートストラップファイルごとの最大文字数です。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

エージェントごとの上書き: `agents.list[].bootstrapMaxChars`。省略した値は
`agents.defaults.bootstrapMaxChars` を継承します。

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペースブートストラップファイルから挿入される合計最大文字数です。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

エージェントごとの上書き: `agents.list[].bootstrapTotalMaxChars`。省略した値は
`agents.defaults.bootstrapTotalMaxChars` を継承します。

### エージェントごとのブートストラッププロファイルの上書き

1 つのエージェントだけで共有デフォルトとは異なるプロンプト挿入動作が必要な場合は、エージェントごとのブートストラッププロファイルの上書きを使用します。省略したフィールドは
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

ブートストラップコンテキストが切り詰められた際にエージェントへ表示される、システムプロンプト内の通知を制御します。
デフォルト: `"always"`。

- `"off"`: 切り詰め通知テキストをシステムプロンプトに一切挿入しません。
- `"once"`: 一意の切り詰めシグネチャごとに、簡潔な通知を 1 回挿入します。
- `"always"`: 切り詰めが発生している場合、実行のたびに簡潔な通知を挿入します（推奨）。

生データと挿入後の詳細な件数、および設定調整用フィールドは、コンテキスト/ステータスレポートやログなどの診断情報にのみ保持されます。通常の WebChat のユーザー/ランタイムコンテキストには、
簡潔な復旧通知のみが表示されます。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### コンテキスト予算の所有範囲

OpenClaw には大容量のプロンプト/コンテキスト予算が複数あり、すべてを 1 つの汎用設定に集約するのではなく、
意図的にサブシステムごとに分割されています。

| 予算                                                           | 対象範囲                                                                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 通常のワークスペースブートストラップ挿入                                                                                                                        |
| `agents.defaults.startupContext.*`                             | 最近の日次 `memory/*.md` ファイルを含む、リセット/起動時に 1 回だけ行われるモデル実行の前置き。チャットで単独実行される `/new` と `/reset` は、モデルを呼び出さずに受理されます |
| `skills.limits.*`                                              | システムプロンプトに挿入される簡潔な Skills リスト                                                                                                               |
| `agents.defaults.contextLimits.*`                              | 上限付きのランタイム抜粋と、ランタイム所有の挿入ブロック                                                                                                        |
| `memory.qmd.limits.*`                                          | インデックス化されたメモリ検索スニペットと挿入サイズ                                                                                                            |

対応するエージェントごとの上書き:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

リセット/起動時のモデル実行で最初のターンに挿入される起動前置きを制御します。
チャットで単独実行される `/new` と `/reset` コマンドは、モデルを呼び出さずにリセットを受理するため、
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

上限付きランタイムコンテキストサーフェスの共有デフォルトです。

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
  100K トークン未満では `16000` 文字、100K+ トークンでは `32000` 文字、200K+ トークンでは `64000`
  文字です。長いコンテキストを持つモデルでは `1000000` までの明示的な値を指定できますが、
  実効上限は引き続きモデルのコンテキストウィンドウの約 30% に制限されます。`openclaw doctor --deep` は実効上限を表示し、
  doctor は明示的な上書きが古いか効果がない場合にのみ警告します。
- `postCompactionMaxChars`: Compaction 後の再読み込み挿入で使用する AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` 設定に対するエージェントごとの上書きです。省略したフィールドは
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
          toolResultMaxChars: 8000, // このエージェント向けの高度な上限
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

システムプロンプトに挿入される簡潔な Skills リストのグローバル上限です。これは、
必要に応じた `SKILL.md` ファイルの読み取りには影響しません。

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills プロンプト予算に対するエージェントごとの上書きです。

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前に、トランスクリプト/ツールの画像ブロック内で画像の最長辺に適用される最大ピクセルサイズです。
デフォルト: `1200`。

値を小さくすると、通常はスクリーンショットの多い実行でビジョントークンの使用量とリクエストペイロードサイズが減少します。
値を大きくすると、視覚的な詳細がより多く保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ファイルパス、URL、およびメディア参照から読み込まれる画像に対する、画像ツールの圧縮/詳細度設定です。
デフォルト: `auto`。

OpenClaw は、選択された画像モデルに合わせてリサイズ段階を調整します。たとえば、Claude Opus 4.8、OpenAI GPT-5.6 Sol、Qwen VL、およびホスト型 Llama 4 ビジョンモデルでは、従来またはデフォルトの高詳細ビジョンパスより大きな画像を使用できます。一方、複数画像を含むターンでは、トークンとレイテンシーのコストを抑えるため、`auto` モードでより積極的に圧縮されます。

値:

- `auto`: モデルの制限と画像数に合わせて調整します。
- `efficient`: トークンとバイトの使用量を抑えるため、小さい画像を優先します。
- `balanced`: 標準的でバランスの取れたリサイズ段階を使用します。
- `high`: スクリーンショット、図、文書画像の詳細をより多く保持します。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトのコンテキストに使用するタイムゾーンです（メッセージのタイムスタンプには使用されません）。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプト内の時刻形式です。デフォルト: `auto`（OS の設定）。

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
      params: { cacheRetention: "long" }, // プロバイダーのグローバルデフォルトパラメータ
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
- `utilityModel`: 短い内部タスク用の、省略可能な`provider/model`参照またはエイリアスです。現在は、生成される Control UI セッションタイトル、Telegram DM トピックタイトル、Discord 自動スレッドタイトル、および[進捗ドラフトのナレーション](/ja-JP/concepts/progress-drafts#narrated-status)に使用されます。未設定の場合、OpenClaw は、プライマリプロバイダーに宣言済みの小規模モデルのデフォルトが存在すれば、それを使用します（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）。それ以外の場合、タイトルタスクはエージェントのプライマリモデルにフォールバックし、ナレーションは無効のままです。ユーティリティルーティングを完全に無効にするには、`utilityModel: ""`を設定します。`agents.list[].utilityModel`はデフォルトを上書きします（エージェントごとの値が空の場合、そのエージェントでは無効になります）。操作固有のモデル上書きは、これらの両方より優先されます。ユーティリティタスクは個別にモデルを呼び出し、タスク固有の内容を選択したモデルプロバイダーへ送信します。ダッシュボードのタイトル生成では、最初の非コマンドメッセージの先頭最大 1,000 文字を送信します。ナレーションでは、受信リクエストと簡潔に編集されたツール概要を送信します。コストとデータ処理の要件に合うプロバイダーを選択してください。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - アクティブなモデルが画像を受け付けられない場合、`image`ツールパスでビジョンモデル設定として使用されます。ネイティブビジョンモデルには、読み込まれた画像のバイト列が代わりに直接渡されます。
  - 選択したモデルまたはデフォルトモデルが画像入力を受け付けられない場合のフォールバックルーティングにも使用されます。
  - 明示的な`provider/model`参照を推奨します。互換性のため、プロバイダーなしの ID も受け付けます。プロバイダーなしの ID が、`models.providers.*.models`に設定されている画像対応エントリのうち 1 つだけに一致する場合、OpenClaw はそのプロバイダーを付加します。設定済みの複数のエントリに一致する場合は、明示的なプロバイダープレフィックスが必要です。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の画像生成機能、および今後画像を生成するあらゆるツール／Plugin サーフェスで使用されます。
  - 一般的な値: ネイティブ Gemini 画像生成には`google/gemini-3.1-flash-image-preview`、fal には`fal/fal-ai/flux/dev`、OpenAI Images には`openai/gpt-image-2`、背景が透明な OpenAI PNG/WebP 出力には`openai/gpt-image-1.5`。
  - プロバイダー／モデルを直接選択する場合は、対応するプロバイダー認証も設定してください（たとえば、`google/*`には`GEMINI_API_KEY`または`GOOGLE_API_KEY`、`openai/gpt-image-2`／`openai/gpt-image-1.5`には`OPENAI_API_KEY`または OpenAI Codex OAuth、`fal/*`には`FAL_KEY`）。
  - 省略した場合でも、`image_generate`は認証設定済みプロバイダーのデフォルトを推測できます。最初に現在のデフォルトプロバイダーを試し、続いて登録済みの残りの画像生成プロバイダーをプロバイダー ID 順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の音楽生成機能、および組み込みの`music_generate`ツールで使用されます。
  - 一般的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または`minimax/music-2.6`。
  - 省略した場合でも、`music_generate`は認証設定済みプロバイダーのデフォルトを推測できます。最初に現在のデフォルトプロバイダーを試し、続いて登録済みの残りの音楽生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー／モデルを直接選択する場合は、対応するプロバイダー認証／API キーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の動画生成機能、および組み込みの`video_generate`ツールで使用されます。
  - 一般的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または`qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate`は認証設定済みプロバイダーのデフォルトを推測できます。最初に現在のデフォルトプロバイダーを試し、続いて登録済みの残りの動画生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー／モデルを直接選択する場合は、対応するプロバイダー認証／API キーも設定してください。
  - 公式 Qwen 動画生成 Plugin は、最大で出力動画 1 本、入力画像 1 枚、入力動画 4 本、再生時間 10 秒、およびプロバイダーレベルの`size`、`aspectRatio`、`resolution`、`audio`、`watermark`オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - モデルルーティングのために`pdf`ツールで使用されます。
  - 省略した場合、PDF ツールは`imageModel`にフォールバックし、次に解決済みのセッションモデル／デフォルトモデルへフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に`maxBytesMb`が渡されなかった場合に、`pdf`ツールで使用されるデフォルトの PDF サイズ制限です。
- `pdfMaxPages`: `pdf`ツールの抽出フォールバックモードで処理対象となる、デフォルトの最大ページ数です。
- `verboseDefault`: エージェントのデフォルトの詳細出力レベルです。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `toolProgressDetail`: `/verbose`ツールの概要および進捗ドラフトのツール行の詳細モードです。値: `"explain"`（デフォルト。簡潔で人間が読みやすいラベル）または`"raw"`（利用可能な場合は生のコマンド／詳細を追加）。エージェントごとの`agents.list[].toolProgressDetail`は、このデフォルトを上書きします。
- `reasoningDefault`: エージェントのデフォルトの推論可視性です。値: `"off"`、`"on"`、`"stream"`。エージェントごとの`agents.list[].reasoningDefault`は、このデフォルトを上書きします。設定された推論のデフォルトは、メッセージ単位またはセッション単位の推論上書きが設定されていない場合に限り、所有者、承認済み送信者、またはオペレーター管理者の Gateway コンテキストにのみ適用されます。
- `elevatedDefault`: エージェントのデフォルトの昇格出力レベルです。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は`provider/model`（例: Codex OAuth アクセス用の`openai/gpt-5.6-sol`）。プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一意に一致する設定済みプロバイダーを試し、その後に限り設定済みのデフォルトプロバイダーへフォールバックします（非推奨の互換動作であるため、明示的な`provider/model`を推奨します）。そのプロバイダーが設定済みのデフォルトモデルを提供しなくなった場合、OpenClaw は削除済みプロバイダーの古いデフォルトをエラーとして提示せず、最初の設定済みプロバイダー／モデルへフォールバックします。
- `models`: `/model`の設定済みモデルカタログおよび許可リストです。各エントリには、`alias`（ショートカット）と`params`（プロバイダー固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter の`provider`ルーティング、`chat_template_kwargs`、`extra_body`／`extraBody`）を含めることができます。
  - すべてのモデル ID を手動で列挙せずに、選択したプロバイダーで検出されたすべてのモデルを表示するには、`"openai/*": {}`や`"vllm/*": {}`などの`provider/*`エントリを使用します。
  - そのプロバイダーで動的に検出されたすべてのモデルが同じランタイムを使用する場合は、`provider/*`エントリに`agentRuntime`を追加します。完全一致する`provider/model`ランタイムポリシーは、引き続きワイルドカードより優先されます。
  - 安全な編集: エントリを追加するには`openclaw config set agents.defaults.models '<json>' --strict-json --merge`を使用します。`--replace`を渡さない限り、`config set`は既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダー単位の設定／オンボーディングフローでは、選択したプロバイダーのモデルをこのマップにマージし、すでに設定されている無関係なプロバイダーを保持します。
  - OpenAI Responses の直接モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management`の挿入を停止するには`params.responsesServerCompaction: false`を使用し、しきい値を上書きするには`params.responsesCompactThreshold`を使用します。[OpenAI のサーバー側 Compaction](/ja-JP/providers/openai#advanced-configuration)を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルトプロバイダーパラメーターです。`agents.defaults.params`に設定します（例: `{ cacheRetention: "long" }`）。
- `params`のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）は`agents.defaults.models["provider/model"].params`（モデル単位）で上書きされ、さらに`agents.list[].params`（一致するエージェント ID）がキー単位で上書きします。詳細は[プロンプトキャッシュ](/ja-JP/reference/prompt-caching)を参照してください。
- `models.providers.openrouter.params.provider`: OpenRouter 全体に適用されるデフォルトのプロバイダールーティングポリシーです。OpenClaw はこれを OpenRouter リクエストの`provider`オブジェクトへ転送します。モデルごとの`agents.defaults.models["openrouter/<model>"].params.provider`およびエージェントパラメーターは、キー単位で上書きします。[OpenRouter のプロバイダールーティング](/ja-JP/providers/openrouter#advanced-configuration)を参照してください。
- `params.extra_body`／`params.extraBody`: OpenAI 互換プロキシの`api: "openai-completions"`リクエスト本文にマージされる、高度なパススルー JSON です。生成されたリクエストキーと競合する場合は、追加本文が優先されます。その後、非ネイティブの completions ルートでは OpenAI 固有の`store`が引き続き除去されます。
- `params.chat_template_kwargs`: トップレベルの`api: "openai-completions"`リクエスト本文にマージされる、vLLM／OpenAI 互換のチャットテンプレート引数です。思考が無効な`vllm/nemotron-3-*`では、同梱の vLLM Plugin が`enable_thinking: false`と`force_nonempty_content: true`を自動的に送信します。明示的な`chat_template_kwargs`は生成されたデフォルトを上書きし、`extra_body.chat_template_kwargs`は引き続き最終的に優先されます。設定済みの vLLM Qwen および Nemotron 思考モデルでは、多段階の推論強度ではなく、二者択一の`/think`（`off`、`on`）が提示されます。
- `compat.thinkingFormat`: OpenAI 互換の思考ペイロード形式です。Together 形式の`reasoning.enabled`には`"together"`、Qwen 形式のトップレベル`enable_thinking`には`"qwen"`、vLLM などリクエスト単位のチャットテンプレート kwargs をサポートする Qwen 系バックエンドの`chat_template_kwargs.enable_thinking`には`"qwen-chat-template"`を使用します。OpenClaw は、思考無効を`false`、思考有効を`true`にマッピングします。また、設定済みの vLLM Qwen モデルでは、これらの形式について二者択一の`/think`が提示されます。
- `compat.supportedReasoningEfforts`: モデルごとの OpenAI 互換の推論強度リストです。実際に受け付けるカスタムエンドポイントでは`"xhigh"`を含めます。これにより OpenClaw は、設定されたプロバイダー／モデルについて、コマンドメニュー、Gateway セッション行、セッションパッチ検証、エージェント CLI 検証、`llm-task`検証で`/think xhigh`を提示します。バックエンドが標準レベルに対するプロバイダー固有の値を必要とする場合は、`compat.reasoningEffortMap`を使用します。
- `params.preserveThinking`: 保持される思考に対する Z.AI 専用のオプトインです。有効で思考がオンの場合、OpenClaw は`thinking.clear_thinking: false`を送信し、以前の`reasoning_content`を再生します。[Z.AI の思考と保持される思考](/ja-JP/providers/zai#advanced-configuration)を参照してください。
- `localService`: ローカル／セルフホスト型モデルサーバー向けの、省略可能なプロバイダーレベルのプロセスマネージャーです。選択したモデルがそのプロバイダーに属する場合、OpenClaw は`healthUrl`（または`baseUrl + "/models"`）をプローブし、エンドポイントが停止していれば`args`を指定して`command`を起動し、最大`readyTimeoutMs`まで待機した後、モデルリクエストを送信します。`command`は絶対パスである必要があります。`idleStopMs: 0`は OpenClaw が終了するまでプロセスを存続させます。正の値を指定すると、そのミリ秒数のアイドル時間が経過した後、OpenClaw が起動したプロセスを停止します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。
- ランタイムポリシーは `agents.defaults` ではなく、プロバイダーまたはモデルに設定します。プロバイダー全体のルールには `models.providers.<provider>.agentRuntime` を、モデル固有のルールには `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` を使用します。プロバイダー/モデルのプレフィックスだけでハーネスが選択されることはありません。ランタイムが未設定または `auto` の場合、作成者によるリクエストのオーバーライドがなく、公式の HTTPS Platform Responses または ChatGPT Responses のルートと完全に一致する場合に限り、OpenAI が暗黙的に Codex を選択することがあります。[OpenAI の暗黙的エージェントランタイム](/ja-JP/providers/openai#implicit-agent-runtime)を参照してください。
- これらのフィールドを変更する設定書き込み処理（例: `/models set`、`/models set-image`、フォールバックの追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な場合は既存のフォールバックリストを保持します。
- `maxConcurrent`: セッション全体で並列実行できるエージェント実行の最大数（各セッション内では引き続き直列化されます）。デフォルト: `4`。

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

- `id`: `"auto"`、`"openclaw"`、登録済みPluginハーネス ID、またはサポートされる CLI バックエンドエイリアス。バンドルされた Codex Plugin は `codex` を登録し、バンドルされた Anthropic Plugin は `claude-cli` CLI バックエンドを提供します。
- `id: "auto"` を使用すると、登録済みPluginハーネスは、サポート契約を宣言するか、その他の方法で満たす有効なルートを引き受けられます。一致するハーネスがない場合は OpenClaw を使用します。`id: "codex"` のような明示的なPluginランタイムには、そのハーネスと互換性のある有効なルートが必要です。いずれかが利用できない場合や実行に失敗した場合は、フェイルクローズします。
- `id: "pi"` は、v2026.5.22 以前でリリースされた設定を維持するため、`openclaw` の非推奨エイリアスとしてのみ受け入れられます。新しい設定では `openclaw` を使用してください。
- ランタイムの優先順位は、最初にモデルの完全一致ポリシー（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]`、または `models.providers.<provider>.models[]`）、次に `agents.list[]` / `agents.defaults.models["provider/*"]`、最後に `models.providers.<provider>.agentRuntime` のプロバイダー全体のポリシーです。
- エージェント全体のランタイムキーはレガシーです。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、セッションランタイムの固定、および `OPENCLAW_AGENT_RUNTIME` は、ランタイム選択では無視されます。古い値を削除するには `openclaw doctor --fix` を実行してください。
- 作成者によるリクエストのオーバーライドがない、対象となる公式 HTTPS OpenAI Responses/ChatGPT 完全一致ルートでは、Codex ハーネスが暗黙的に使用される場合があります。プロバイダーまたはモデルの `agentRuntime.id: "codex"` は Codex をフェイルクローズ要件にしますが、互換性のないルートを互換性のあるものにはしません。
- Claude CLI のデプロイでは、`model: "anthropic/claude-opus-4-8"` とモデルスコープの `agentRuntime.id: "claude-cli"` の併用を推奨します。レガシーの `claude-cli/<model>` 参照も互換性のため引き続き機能しますが、新しい設定ではプロバイダーとモデルの選択を正規形に保ち、実行バックエンドをプロバイダーまたはモデルのランタイムポリシーに配置してください。
- これはテキストエージェントターンの実行のみを制御します。メディア生成、ビジョン、PDF、音楽、動画、TTS では、引き続きそれぞれのプロバイダーとモデルの設定が使用されます。

**組み込みエイリアスの短縮形**（モデルが `agents.defaults.models` に含まれる場合にのみ適用）:

| エイリアス            | モデル                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

設定したエイリアスは、常にデフォルトより優先されます。

Z.AI GLM-4.x モデルでは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を独自に定義しない限り、思考モードが自動的に有効になります。
Z.AI モデルでは、ツール呼び出しのストリーミング用に `tool_stream` がデフォルトで有効になります。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude Opus 4.8 では、OpenClaw における思考はデフォルトで無効です。適応的思考を明示的に有効にした場合、Anthropic のプロバイダーが管理する労力のデフォルト値は `high` です。Claude 4.6 モデルでは、明示的な思考レベルが設定されていない場合、デフォルトで `adaptive` が使用されます。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用の任意の CLI バックエンドです（ツール呼び出しなし）。API プロバイダーで障害が発生した場合のバックアップとして役立ちます。

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

- CLI バックエンドはテキストを優先し、ツールは常に無効になります。
- `sessionArg` が設定されている場合、セッションがサポートされます。
- `imageArg` がファイルパスを受け付ける場合、画像のパススルーがサポートされます。
- `reseedFromRawTranscriptWhenUncompacted: true` を使用すると、最初の Compaction 要約が存在する前に、範囲を制限した未加工の OpenClaw トランスクリプト末尾から、安全に無効化されたセッションをバックエンドで復旧できます。認証プロファイルまたは認証情報エポックが変更された場合は、引き続き未加工データによる再シードは行われません。

### `agents.defaults.promptOverlays`

OpenClaw が組み立てたプロンプトサーフェスに、モデルファミリー単位で適用されるプロバイダー非依存のプロンプトオーバーレイです。GPT-5 ファミリーのモデル ID は、OpenClaw とプロバイダーの各ルートで共有される動作契約を受け取ります。`personality` は、親しみやすい対話スタイルのレイヤーのみを制御します。ネイティブ Codex app-server ルートでは、この OpenClaw GPT-5 オーバーレイの代わりに Codex が管理するベース命令とモデル命令を維持し、OpenClaw はネイティブスレッドで Codex の組み込みパーソナリティを無効にします。

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
- `"off"` は親しみやすいレイヤーのみを無効にします。タグ付けされた GPT-5 の動作契約は引き続き有効です。
- この共有設定が未設定の場合、レガシーの `plugins.entries.openai.config.personality` が引き続き読み取られます。

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
- `includeSystemPromptSection`: false の場合、システムプロンプトから Heartbeat セクションを省略し、ブートストラップコンテキストへの `HEARTBEAT.md` の挿入をスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。
- `timeoutSeconds`: Heartbeat エージェントターンが中止されるまでに許容される最大時間（秒）。未設定のままにすると、`agents.defaults.timeoutSeconds` が設定されている場合はその値を使用し、それ以外の場合は最大 600 秒に制限された Heartbeat 間隔を使用します。
- `directPolicy`: ダイレクト/DM 配信ポリシー。`allow`（デフォルト）はダイレクトターゲットへの配信を許可します。`block` はダイレクトターゲットへの配信を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat 実行では軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は以前の会話履歴がない新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat 1 回あたりのトークンコストを約 100K から約 2-5K トークンに削減します。
- `skipWhenBusy`: true の場合、そのエージェントに追加のビジーレーンがあると Heartbeat 実行を延期します。対象は、そのエージェント自身のセッションキー単位のサブエージェントまたはネストされたコマンド処理です。このフラグがなくても、Cron レーンでは常に Heartbeat が延期されます。
- エージェント単位: `agents.list[].heartbeat` を設定します。いずれかのエージェントで `heartbeat` が定義されている場合、**それらのエージェントのみ**が Heartbeat を実行します。
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
        notifyUser: true, // notices when compaction starts/completes and on memory-flush degradation (default: false)
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

- `mode`: `default` または `safeguard`（長い履歴のチャンク分割要約）。[Compaction](/ja-JP/concepts/compaction)を参照してください。
- `provider`: 登録済みの Compaction プロバイダー Plugin の ID。設定すると、組み込みの LLM 要約の代わりにプロバイダーの `summarize()` が呼び出されます。失敗時は組み込み機能にフォールバックします。プロバイダーを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction)を参照してください。
- `timeoutSeconds`: OpenClaw が中止するまでに、1 回の Compaction 操作に許可される最大秒数。デフォルト: `180`。
- `reserveTokens`: Compaction 後のモデル出力および今後のツール結果用に確保されるトークンの余裕。モデルのコンテキストウィンドウが既知の場合、OpenClaw は有効な予約量を制限し、プロンプト予算を消費しないようにします。
- `reserveTokensFloor`: 組み込みランタイムによって適用される最小予約量。下限を無効にするには `0` を設定します。この下限にも、アクティブなコンテキストウィンドウの上限が適用されます。
- `keepRecentTokens`: 最新のトランスクリプト末尾をそのまま保持するためのエージェント切断点予算。手動の `/compact` では、明示的に設定されている場合にこれが適用されます。それ以外の場合、手動 Compaction は厳格なチェックポイントになります。
- `recentTurnsPreserve`: セーフガード要約の対象外として、そのまま保持される最新のユーザー／アシスタントターン数。デフォルト: `3`。
- `maxHistoryShare`: Compaction 後に保持される履歴に許可される、コンテキスト総予算に対する最大比率（範囲 `0.1`～`0.9`）。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction の要約時に、不透明な識別子を保持するための組み込みガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用される、識別子保持用の省略可能なカスタムテキスト。
- `qualityGuard`: セーフガード要約の不正な形式の出力に対する再試行チェック。セーフガードモードではデフォルトで有効です。監査を省略するには `enabled: false` を設定します。
- `midTurnPrecheck`: 省略可能なツールループの負荷チェック。`enabled: true` の場合、OpenClaw はツール結果の追加後、次のモデル呼び出し前にコンテキストの負荷を確認します。コンテキストが収まらなくなった場合、プロンプトを送信する前に現在の試行を中止し、既存の事前チェック復旧パスを再利用してツール結果を切り詰めるか、Compaction を実行して再試行します。`default` と `safeguard` の両方の Compaction モードで動作します。デフォルト: 無効。
- `postIndexSync`: Compaction 後のセッションメモリ再インデックスモード。デフォルト: `"async"`。鮮度を最大限にするには `"await"`、Compaction のレイテンシを低減するには `"async"`、セッションメモリの同期が別の場所で処理される場合に限り `"off"` を使用します。
- `postCompactionSections`: Compaction 後に再挿入する、省略可能な AGENTS.md の H2/H3 セクション名。未設定または `[]` に設定すると、再挿入は無効になります。`["Session Startup", "Red Lines"]` を明示的に設定すると、その組み合わせが有効になり、従来の `Every Session`/`Safety` フォールバックが維持されます。Compaction の要約にすでに含まれているプロジェクトガイダンスが重複するリスクよりも、追加コンテキストの価値が上回る場合にのみ有効にしてください。
- `model`: Compaction の要約にのみ使用する、省略可能な `provider/model-id` または `agents.defaults.models` の単独エイリアス。単独エイリアスはディスパッチ前に解決されます。衝突時は、設定されたリテラルモデル ID が優先されます。メインセッションではあるモデルを維持しつつ、Compaction の要約を別のモデルで実行する場合に使用します。未設定の場合、Compaction はセッションのプライマリモデルを使用します。
- `truncateAfterCompaction`: Compaction 後にアクティブなセッショントランスクリプトをローテーションし、以降のターンでは要約と未要約の末尾のみを読み込むようにします。以前の完全なトランスクリプトはアーカイブされたままです。長時間実行されるセッションで、アクティブなトランスクリプトが無制限に増大するのを防ぎます。デフォルト: `false`。
- `maxActiveTranscriptBytes`: トランスクリプト履歴がしきい値を超えたとき、実行前に通常のローカル Compaction を開始する、省略可能なバイトしきい値（`number` または `"20mb"` のような文字列）。Compaction の成功後に、より小さい後続トランスクリプトへローテーションできるようにするには `truncateAfterCompaction` が必要です。未設定または `0` の場合は無効です。
- `notifyUser`: `true` の場合、簡潔なコンテキスト保守通知をユーザーに送信します。具体的には、Compaction の開始時と完了時（例: 「コンテキストを圧縮しています...」「Compaction が完了しました」）、および Compaction 前のメモリフラッシュを使い果たし、機能が低下した状態で応答を続行する場合（例: 「メモリの保守に一時的に失敗しました。応答を続行します。」）です。これらの通知を表示しないようにするため、デフォルトでは無効です。
- `memoryFlush`: 永続的なメモリを保存するために、自動 Compaction の前に実行されるサイレントなエージェントターン。この保守ターンをローカルモデル上に維持する必要がある場合は、`model` を `ollama/qwen3:8b` などの正確なプロバイダー／モデルに設定します。このオーバーライドは、アクティブセッションのフォールバックチェーンを継承しません。`forceFlushTranscriptBytes` は、トークンカウンターが古い場合でも、トランスクリプトサイズがしきい値に達するとフラッシュを強制します。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.runRetries`

障害復旧中の無限実行ループを防ぐための、組み込みエージェントランタイムの外側実行ループにおける再試行回数の境界。この設定は組み込みエージェントランタイムにのみ適用され、ACP または CLI ランタイムには適用されません。

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
        runRetries: { max: 50 }, // エージェントごとの省略可能なオーバーライド
      },
    ],
  },
}
```

- `base`: 外側実行ループの基本再試行回数。デフォルト: `24`。
- `perProfile`: フォールバックプロファイル候補ごとに追加される実行再試行回数。デフォルト: `8`。
- `min`: 実行再試行回数の絶対最小上限。デフォルト: `32`。
- `max`: 制御不能な実行を防ぐための、実行再試行回数の絶対最大上限。デフォルト: `160`。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから**古いツール結果**を削減します。ディスク上のセッション履歴は変更**しません**。デフォルトでは無効です。有効にするには `mode: "cache-ttl"` を設定します。

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
- `ttl` は、最後のキャッシュアクセス後に削減処理を再実行できる頻度を制御します。デフォルト: `5m`。
- 削減処理では、まずサイズが大きすぎるツール結果をソフトトリミングし、必要に応じて古いツール結果を完全に消去します。
- `softTrimRatio` と `hardClearRatio` は、`0.0`～`1.0` の値を受け付けます。この範囲外の値は設定検証で拒否されます。

**ソフトトリミング**では先頭と末尾を保持し、中央に `...` を挿入します。

**完全消去**では、ツール結果全体をプレースホルダーに置き換えます。

注:

- 画像ブロックがトリミングまたは消去されることはありません。
- 比率は文字数に基づく概算であり、正確なトークン数ではありません。
- アシスタントメッセージが `keepLastAssistants` 件未満の場合、削減処理はスキップされます。

</Accordion>

動作の詳細については、[セッション削減](/ja-JP/concepts/session-pruning)を参照してください。

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

- Telegram 以外のチャンネルでブロック応答を有効にするには、明示的な `*.streaming.block.enabled: true` が必要です。QQ Bot は例外です。`streaming.block` キーがなく、`channels.qqbot.streaming.mode` が `"off"` でない限りブロック応答をストリーミングします。
- チャンネルごとのオーバーライド: `channels.<channel>.streaming.block.coalesce`（およびアカウントごとのバリエーション）。Discord、Google Chat、Mattermost、MS Teams、Signal、Slack のデフォルトは `minChars: 1500` / `idleMs: 1000` です。
- `blockStreamingChunk.breakPreference`: 優先するチャンク境界（`"paragraph" | "newline" | "sentence"`）。
- `humanDelay`: ブロック応答間のランダムな一時停止。デフォルト: `off`。`natural` = 800-2500ms。`custom` は `minMs`/`maxMs` を使用します（いずれかの境界が未設定の場合は自然な範囲にフォールバックします）。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

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

組み込みエージェント用の省略可能なサンドボックス化。完全なガイドについては、[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

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
          // SecretRefs／インラインの内容もサポート：
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

**バックエンド：**

- `docker`：ローカル Docker ランタイム（デフォルト）
- `ssh`：汎用 SSH ベースのリモートランタイム
- `openshell`：OpenShell ランタイム

`backend: "openshell"` を選択すると、ランタイム固有の設定は
`plugins.entries.openshell.config` に移ります。

**SSH バックエンド設定：**

- `target`：`user@host[:port]` 形式の SSH ターゲット
- `command`：SSH クライアントコマンド（デフォルト：`ssh`）
- `workspaceRoot`：スコープごとのワークスペースに使用する絶対リモートルート（デフォルト：`/tmp/openclaw-sandboxes`）
- `identityFile` / `certificateFile` / `knownHostsFile`：OpenSSH に渡す既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw が実行時に一時ファイルとして具現化するインラインの内容または SecretRef
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH のホストキーポリシー設定（どちらもデフォルトは `true`）

**SSH 認証の優先順位：**

- `identityData` は `identityFile` より優先されます
- `certificateData` は `certificateFile` より優先されます
- `knownHostsData` は `knownHostsFile` より優先されます
- SecretRef ベースの `*Data` 値は、サンドボックスセッションの開始前に、アクティブなシークレットランタイムのスナップショットから解決されます

**SSH バックエンドの動作：**

- 作成または再作成後に、リモートワークスペースへ一度だけ初期データを投入します
- その後はリモート SSH ワークスペースを正規のものとして維持します
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングします
- リモートの変更をホストへ自動的に同期しません
- サンドボックスブラウザーコンテナをサポートしません

**ワークスペースアクセス：**

- `none`：`~/.openclaw/sandboxes` 配下のスコープごとのサンドボックスワークスペース（デフォルト）
- `ro`：サンドボックスワークスペースは `/workspace`、エージェントワークスペースは `/agent` に読み取り専用でマウント
- `rw`：エージェントワークスペースを `/workspace` に読み書き可能でマウント

**スコープ：**

- `session`：セッションごとのコンテナとワークスペース
- `agent`：エージェントごとに 1 つのコンテナとワークスペース（デフォルト）
- `shared`：共有コンテナとワークスペース（セッション間の分離なし）

**OpenShell Plugin 設定：**

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

**OpenShell モード：**

- `mirror`：実行前にローカルからリモートへ初期データを投入し、実行後に同期して戻します。ローカルワークスペースが正規のまま維持されます
- `remote`：サンドボックスの作成時にリモートへ一度だけ初期データを投入し、その後はリモートワークスペースを正規のものとして維持します

`remote` モードでは、初期データ投入後に OpenClaw の外部で行われたホストローカルの編集は、サンドボックスへ自動的に同期されません。
トランスポートには OpenShell サンドボックスへの SSH を使用しますが、サンドボックスのライフサイクルと任意のミラー同期は Plugin が所有します。

**`setupCommand`** はコンテナ作成後に一度だけ実行されます（`sh -lc` 経由）。ネットワークへの送信アクセス、書き込み可能なルート、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"` です** — エージェントが外部へのアクセスを必要とする場合は、`"bridge"`（またはカスタムブリッジネットワーク）に設定してください。
`"host"` はブロックされます。`"container:<id>"` は、
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急時の制限解除）を明示的に設定しない限り、デフォルトでブロックされます。
アクティブな OpenClaw サンドボックス内の Codex app-server ターンでは、ネイティブコードモードのネットワークアクセスにも、この同じ送信アクセス設定が使用されます。

**受信添付ファイル**は、アクティブなワークスペースの `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルとエージェントごとのバインドはマージされます。

**サンドボックス化されたブラウザー**（`sandbox.browser.enabled`、デフォルトは `false`）：コンテナ内の Chromium + CDP。noVNC URL がシステムプロンプトに挿入されます。`openclaw.json` の `browser.enabled` は不要です。
noVNC のオブザーバーアクセスではデフォルトで VNC 認証を使用し、OpenClaw は共有 URL でパスワードを公開する代わりに、有効期間の短いトークン URL を発行します。

- `allowHostControl: false`（デフォルト）は、サンドボックス化されたセッションがホストブラウザーをターゲットにすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用ブリッジネットワーク）です。グローバルなブリッジ接続を明示的に使用する場合にのみ、`bridge` に設定してください。ここでも `"host"` はブロックされます。
- `cdpSourceRange` は、コンテナ境界での CDP 受信を CIDR 範囲（例：`172.21.0.1/32`）に任意で制限します。
- `sandbox.browser.binds` は、サンドボックスブラウザーコンテナにのみ追加のホストディレクトリをマウントします。設定すると（`[]` を含む）、ブラウザーコンテナの `docker.binds` を置き換えます。
- サンドボックスブラウザーコンテナの Chromium は常に `--no-sandbox --disable-setuid-sandbox` を指定して起動します（コンテナには Chrome 自身のサンドボックスに必要なカーネルプリミティブがありません）。これを切り替える設定はありません。
- 起動時のデフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナホスト向けに調整されています：
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
    デフォルトで有効です。WebGL／3D の使用で必要な場合は、
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効にできます。
  - `--disable-extensions`（デフォルトで有効）。ワークフローが拡張機能に依存する場合は、`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で
    拡張機能を再度有効にできます。
  - デフォルトは `--renderer-process-limit=2` です。
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更でき、Chromium のデフォルトプロセス上限を使用するには
    `0` を設定します。
  - `headless` が有効な場合にのみ `--headless=new`。
  - デフォルトはコンテナイメージのベースラインです。コンテナのデフォルトを変更するには、カスタム
    エントリーポイントを備えたカスタムブラウザーイメージを使用してください。

</Accordion>

ブラウザーのサンドボックス化と `sandbox.docker.binds` は Docker 専用です。

イメージをビルドする（ソースチェックアウトから）：

```bash
scripts/sandbox-setup.sh           # メインのサンドボックスイメージ
scripts/sandbox-browser-setup.sh   # 任意のブラウザーイメージ
```

ソースチェックアウトなしで npm インストールを行う場合のインライン `docker build` コマンドについては、[サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup)を参照してください。

### `agents.list`（エージェントごとの上書き）

`agents.list[].tts` を使用すると、エージェントに固有の TTS プロバイダー、音声、モデル、
スタイル、または自動 TTS モードを指定できます。エージェントブロックはグローバルな
`messages.tts` に対してディープマージされるため、共有資格情報を 1 か所に保持しつつ、各
エージェントは必要な音声またはプロバイダーフィールドのみを上書きできます。アクティブなエージェントの
上書きは、自動音声応答、`/tts audio`、`/tts status`、および
`tts` エージェントツールに適用されます。プロバイダーの例と優先順位については、
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
        model: "anthropic/claude-opus-4-6", // または { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // エージェントごとの思考レベルのオーバーライド
        reasoningDefault: "on", // エージェントごとの推論表示のオーバーライド
        fastModeDefault: false, // エージェントごとの高速モードのオーバーライド
        params: { cacheRetention: "none" }, // 一致する defaults.models の params をキー単位でオーバーライド
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // 設定時は agents.defaults.skills を置き換える
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
- `default`: 複数設定されている場合は、最初のものが優先されます（警告がログに記録されます）。1 つも設定されていない場合は、リストの最初のエントリがデフォルトになります。
- `model`: 文字列形式では、モデルのフォールバックを持たない厳密なエージェント単位のプライマリを設定します。オブジェクト形式の `{ primary }` も、`fallbacks` を追加しない限り厳密です。そのエージェントでフォールバックを有効にするには `{ primary, fallbacks: [...] }` を使用し、厳密な動作を明示するには `{ primary, fallbacks: [] }` を使用します。`primary` のみをオーバーライドする Cron ジョブは、`fallbacks: []` を設定しない限り、引き続きデフォルトのフォールバックを継承します。
- `utilityModel`: 生成されるセッションやスレッドのタイトルなど、短い内部タスク向けの任意のエージェント単位オーバーライドです。`agents.defaults.utilityModel`、プライマリプロバイダーが宣言した小規模モデルのデフォルト、このエージェントのプライマリモデルの順にフォールバックします。空文字列を指定すると、このエージェントのユーティリティルーティングが無効になります。
- `params`: `agents.defaults.models` で選択されたモデルエントリにマージされる、エージェント単位のストリームパラメーターです。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有のオーバーライドを指定する場合に使用します。
- `tts`: 任意のエージェント単位のテキスト読み上げオーバーライドです。このブロックは `messages.tts` にディープマージされるため、共有プロバイダーの認証情報とフォールバックポリシーは `messages.tts` に保持し、ここではプロバイダー、音声、モデル、スタイル、自動モードなどのペルソナ固有の値のみを設定します。
- `skills`: 任意のエージェント単位のスキル許可リストです。省略した場合、設定されていればエージェントは `agents.defaults.skills` を継承します。明示的なリストはマージされずにデフォルトを置き換え、`[]` はスキルなしを意味します。
- `thinkingDefault`: 任意のエージェント単位のデフォルト思考レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）です。メッセージ単位またはセッション単位のオーバーライドが設定されていない場合、このエージェントの `agents.defaults.thinkingDefault` をオーバーライドします。有効な値は、選択したプロバイダー／モデルプロファイルによって決まります。Google Gemini では、`adaptive` によってプロバイダー管理の動的思考が維持されます（Gemini 3/3.1 では `thinkingLevel` が省略され、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 任意のエージェント単位のデフォルト推論表示（`on | off | stream`）です。メッセージ単位またはセッション単位の推論オーバーライドが設定されていない場合、このエージェントの `agents.defaults.reasoningDefault` をオーバーライドします。
- `fastModeDefault`: 高速モードの任意のエージェント単位デフォルト（`"auto" | true | false`）です。メッセージ単位またはセッション単位の高速モードオーバーライドが設定されていない場合に適用されます。
- `models`: 完全な `provider/model` ID をキーとする、任意のエージェント単位のモデルカタログ／ランタイムオーバーライドです。エージェント単位のランタイム例外には `models["provider/model"].agentRuntime` を使用します。
- `runtime`: 任意のエージェント単位のランタイム記述子です。エージェントがデフォルトで ACP ハーネスセッションを使用する必要がある場合は、`runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）とともに `type: "acp"` を使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- ローカルのワークスペース相対 `identity.avatar` 画像ファイルは 2 MB に制限されます。`http(s)` URL と `data:` URI には、ローカルファイルサイズの上限は適用されません。
- `identity` はデフォルトを導出します。`ackReaction` は `emoji` から、`mentionPatterns` は `name`/`emoji` から導出されます。
- `subagents.allowAgents`: 明示的な `sessions_spawn.agentId` ターゲットに使用できる、設定済みエージェント ID の許可リストです（`["*"]` = 設定済みの任意のターゲット。デフォルト: 同じエージェントのみ）。自身をターゲットとする `agentId` 呼び出しを許可する場合は、要求元の ID を含めます。エージェント設定が削除された古いエントリは `sessions_spawn` によって拒否され、`agents_list` から除外されます。クリーンアップするには `openclaw doctor --fix` を実行します。または、デフォルトを継承しながらそのターゲットを引き続き生成可能にする場合は、最小限の `agents.list[]` エントリを追加します。
- サンドボックス継承ガード: 要求元のセッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します。デフォルト: false）。
- `subagents.maxConcurrent`: サブエージェントの実行全体で同時に実行できる子エージェントの最大数です。デフォルト: `8`。
- `subagents.maxChildrenPerAgent`: 単一のエージェントセッションが生成できるアクティブな子の最大数です。デフォルト: `5`。
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

- `type`（任意）: 通常のルーティングには `route`（type がない場合のデフォルトは route）、永続的な ACP 会話バインディングには `acp`。
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のアカウント。省略 = デフォルトアカウント）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。チャンネル固有）
- `acp`（任意。`type: "acp"` のみ）: `{ mode, label, cwd, backend }`

**決定論的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致。peer/guild/team なし）
5. `match.accountId: "*"`（チャンネル全体）
6. デフォルトエージェント

各階層内では、最初に一致する `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は正確な会話 ID（`match.channel` + アカウント + `match.peer.id`）によって解決し、前述のルートバインディングの階層順序は使用しません。

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
      idleHours: 24, // 非アクティブ時に自動でフォーカスを解除するデフォルト時間（時間単位。`0` で無効）
      maxAgeHours: 0, // デフォルトの厳格な最大期間（時間単位。`0` で無効）
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

- **`scope`**: グループチャットのコンテキストにおける基本セッショングループ化戦略。
  - `per-sender`（デフォルト）: 各送信者に、チャンネルコンテキスト内で分離されたセッションが割り当てられます。
  - `global`: チャンネルコンテキスト内のすべての参加者が単一のセッションを共有します（共有コンテキストを意図する場合にのみ使用）。
- **`dmScope`**: DM のグループ化方法。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャンネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャンネルと送信者の組み合わせごとに分離します（複数ユーザーの受信トレイに推奨）。
  - `per-account-channel-peer`: アカウント、チャンネル、送信者の組み合わせごとに分離します（複数アカウントに推奨）。
- **`identityLinks`**: チャンネル間でセッションを共有するため、正規 ID をプロバイダー接頭辞付きのピアにマッピングします。`/dock_discord` などのドッキングコマンドも同じマップを使用して、アクティブなセッションの返信経路を別のリンク済みチャンネルピアへ切り替えます。[チャンネルのドッキング](/ja-JP/concepts/channel-docking)を参照してください。
- **`reset`**: プライマリリセットポリシー。`daily` は現地時刻の `atHour` にリセットされ、`idle` は `idleMinutes` 後にリセットされます。両方が設定されている場合は、先に期限切れになる方が優先されます。日次リセットの鮮度判定にはセッション行の `sessionStartedAt` を使用し、アイドルリセットの鮮度判定には `lastInteractionAt` を使用します。Heartbeat、Cron のウェイクアップ、実行通知、Gateway の管理処理などのバックグラウンド／システムイベントによる書き込みは `updatedAt` を更新できますが、日次／アイドルセッションの鮮度は維持しません。
- **`resetByType`**: タイプごとのオーバーライド（`direct`、`group`、`thread`）。従来の `dm` は `direct` のエイリアスとして受け付けられます。
- **`resetByChannel`**: プロバイダー／チャンネル ID をキーとするチャンネルごとのリセットオーバーライド。セッションのチャンネルに一致するエントリがある場合、そのセッションでは `resetByType`/`reset` より無条件に優先されます。1 つのチャンネルだけにタイプ単位のポリシーとは異なるリセット動作が必要な場合にのみ使用してください。
- **`mainKey`**: 従来のフィールド。ランタイムはメインのダイレクトチャット用バケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: エージェント間のやり取りで許可されるエージェント間の最大返信往復回数（整数、範囲: `0`～`20`、デフォルト: `5`）。`0` にすると、ピンポン式の連鎖を無効にします。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、従来の `dm` エイリアスを含む）、`keyPrefix`、または `rawKeyPrefix` で照合します。最初に一致した拒否ルールが優先されます。
- **`maintenance`**: セッションストアのクリーンアップと保持期間の制御。
  - `mode`: `enforce` はクリーンアップを実行し、デフォルトです。`warn` は警告のみを出力します。
  - `pruneAfter`: 古いエントリを判定する経過時間のしきい値（デフォルト `30d`）。
  - `maxEntries`: SQLite セッションエントリの最大数（デフォルト `500`）。ランタイムの書き込みでは、本番規模の上限向けに小さな高水位バッファーを設けて一括クリーンアップを行います。`openclaw sessions cleanup --enforce` は上限を直ちに適用します。
  - 短命な Gateway モデル実行プローブセッションでは、固定の `24h` 保持期間が使用されますが、クリーンアップは負荷に応じて実行されます。セッションエントリのメンテナンスまたは上限到達の圧力が生じた場合にのみ、古くなった厳密なモデル実行プローブ行を削除します。`agent:*:explicit:model-run-<uuid>` に一致する明示的で厳密なプローブキーのみが対象です。通常のダイレクト、グループ、スレッド、Cron、フック、Heartbeat、ACP、サブエージェントの各セッションには、この 24h の保持期間は継承されません。モデル実行のクリーンアップが実行される場合、より広範な `pruneAfter` の古いエントリのクリーンアップおよび `maxEntries` の上限適用より先に実行されます。
  - 従来の `rotateBytes` は現在のスキーマでは拒否されます。`openclaw doctor --fix` は古い設定からこれを削除します。
  - `resetArchiveRetention`: リセット／削除されたトランスクリプトアーカイブの経過時間ベースの保持期間。デフォルトでは、アーカイブはディスク容量予算によって削除されるまで保持されます。実時間に基づく削除を有効にするには期間を設定し、明示的に無効にするには `false` を設定します。
  - `maxDiskBytes`: オプションのセッションディレクトリ用ディスク容量予算。`warn` モードでは警告をログに記録し、`enforce` モードでは古いアーティファクト／セッションから順に削除します。
  - `highWaterBytes`: 容量予算のクリーンアップ後に目標とするオプションの値。デフォルトは `maxDiskBytes` の `80%` です。
- **`writeLock`**: セッショントランスクリプトの書き込みロック制御。正当なトランスクリプト準備、クリーンアップ、Compaction、またはミラー処理の競合がデフォルトポリシーより長く続く場合にのみ調整してください。
  - `acquireTimeoutMs`: ロックの取得中に、セッションがビジーであると報告するまで待機するミリ秒数。デフォルト: `60000`、環境変数によるオーバーライド: `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`。
  - `staleMs`: 既存のロックを古いものとして扱い、回収するまでのミリ秒数。デフォルト: `1800000`、環境変数によるオーバーライド: `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`。
  - `maxHoldMs`: 保持中のプロセス内ロックをウォッチドッグが解放するまでの最大保持時間（ミリ秒）。デフォルト: `300000`、環境変数によるオーバーライド: `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。
- **`threadBindings`**: スレッドに紐付くセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ（プロバイダーによるオーバーライドが可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時に自動でフォーカスを解除するまでのデフォルト時間（時間単位。`0` で無効化。プロバイダーによるオーバーライドが可能）
  - `maxAgeHours`: デフォルトの絶対最大存続時間（時間単位。`0` で無効化。プロバイダーによるオーバーライドが可能）
  - `spawnSessions`: `sessions_spawn` および ACP のスレッド生成から、スレッドに紐付く作業セッションを作成するためのデフォルトゲート。スレッドバインディングが有効な場合、デフォルトは `true` です。プロバイダー／アカウントによるオーバーライドが可能です。
  - `defaultSpawnContext`: スレッドに紐付く生成で使用するデフォルトのネイティブサブエージェントコンテキスト（`"fork"` または `"isolated"`）。デフォルトは `"fork"` です。

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

### 応答接頭辞

チャンネル／アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順序（最も具体的なものが優先）: アカウント → チャンネル → グローバル。`""` は無効化し、カスケードを停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| 変数              | 説明                   | 例                          |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いモデル名           | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子     | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名         | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル       | `high`、`low`、`off`        |
| `{identity.name}` | エージェントの識別名   | （`"auto"` と同じ）          |

変数では大文字と小文字が区別されません。`{think}` は `{thinkingLevel}` のエイリアスです。

### 確認リアクション

- デフォルトはアクティブなエージェントの `identity.emoji` で、それがない場合は `"👀"` です。無効にするには `""` を設定します。
- チャンネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャンネル → `messages.ackReaction` → アイデンティティのフォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`、または `off`/`none`（確認リアクションを完全に無効化）。
- `removeAckAfterReply`: Slack、Discord、Signal、Telegram、WhatsApp、iMessage などのリアクション対応チャンネルで、返信後に確認リアクションを削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Signal、Telegram、WhatsApp でライフサイクル状態リアクションを有効にします。
  Discord では、未設定の場合、確認リアクションが有効なら状態リアクションも有効のままです。
  Slack、Signal、Telegram、WhatsApp では、ライフサイクル状態リアクションを有効にするため、明示的に `true` を設定します。
  Slack はデフォルトでネイティブのアシスタントスレッド状態と切り替わる読み込みメッセージを進捗表示に使用し、設定された確認リアクションは固定したままにします。
- `messages.statusReactions.emojis`: ライフサイクル絵文字キーをオーバーライドします:
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft`、および `stallHard`。
  Telegram では使用可能なリアクションが固定されているため、設定された未対応の絵文字は、そのチャットで使用できる最も近い状態バリエーションにフォールバックします。

### キュー

- `mode`: セッション実行中に到着した受信メッセージのキュー戦略。デフォルト: `"steer"`。
  - `steer`: 新しいプロンプトをアクティブな実行に注入します。
  - `followup`: アクティブな実行の完了後に新しいプロンプトを実行します。
  - `collect`: 互換性のあるメッセージをまとめ、後で一緒に実行します。
  - `interrupt`: 最新のプロンプトを開始する前に、アクティブな実行を中止します。
- `debounceMs`: キューに入った／誘導されたメッセージをディスパッチするまでの遅延。デフォルト: `500`。
- `cap`: 破棄ポリシーが適用されるまでのキュー内メッセージの最大数。デフォルト: `20`。
- `drop`: 上限を超えた場合の戦略。`"summarize"`（デフォルト）は最も古いエントリを破棄しますが、簡潔な要約は保持します。`"old"` は要約を残さず最も古いものを破棄し、`"new"` は最新の項目を拒否します。
- `byChannel`: プロバイダー ID をキーとする、チャンネルごとの `mode` オーバーライド。
- `debounceMsByChannel`: プロバイダー ID をキーとする、チャンネルごとの `debounceMs` オーバーライド。

### 受信デバウンス

同じ送信者から短時間に届いたテキストのみのメッセージを、エージェントの単一ターンにまとめます。メディア／添付ファイルは直ちにフラッシュされます。制御コマンドにはデバウンスを適用しません。デフォルトの `debounceMs`: `2000`。

### その他のメッセージキー

- `messages.messagePrefix`: 受信したユーザーメッセージがエージェントランタイムに到達する前に付加される接頭辞テキスト。チャンネルコンテキストのマーカーとして必要最小限に使用してください。
- `messages.visibleReplies`: ダイレクト、グループ、チャンネルの各会話で表示される送信元返信を制御します（`"message_tool"` で表示出力を行うには `message(action=send)` が必要です。`"automatic"` は従来どおり通常の返信を投稿します）。
- `messages.usageTemplate` / `messages.responseUsage`: カスタム `/usage` フッターテンプレートと、返信ごとのデフォルト使用モード（`off | tokens | full`、および `tokens` に対する従来の `on` エイリアス）。
- `messages.groupChat.mentionPatterns` / `historyLimit`: グループメッセージのメンショントリガーと履歴ウィンドウのサイズ設定。
- `messages.suppressToolErrors`: `true` の場合、ユーザーに表示される `⚠️` ツールエラー警告を抑制します（エージェントは引き続きコンテキスト内でエラーを確認でき、再試行できます）。デフォルト: `false`。

### TTS（テキスト読み上げ）

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

- `auto` は、デフォルトの自動 TTS モード（`off`、`always`、`inbound`、または `tagged`）を制御します。`/tts on|off` でローカル設定を上書きでき、`/tts status` で有効な状態を確認できます。
- `summaryModel` は、自動要約用の `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です（`enabled !== false`）。`modelOverrides.allowProvider` は明示的な有効化が必要です。
- API キーは、`ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- 同梱の音声プロバイダーは Plugin が所有します。`plugins.allow` が設定されている場合は、使用する各 TTS プロバイダー Plugin を含めてください。たとえば、Edge TTS には `microsoft` を使用します。従来のプロバイダー ID `edge` は、`microsoft` のエイリアスとして受け付けられます。
- `providers.openai.baseUrl` は OpenAI TTS エンドポイントを上書きします。解決順序は、設定、`OPENAI_TTS_BASE_URL`、`https://api.openai.com/v1` の順です。
- `providers.openai.baseUrl` が OpenAI 以外のエンドポイントを指す場合、OpenClaw はそれを OpenAI 互換 TTS サーバーとして扱い、モデルと音声の検証を緩和します。

---

## Talk

Talk モード（macOS/iOS/Android およびブラウザーの Control UI）のデフォルト設定です。

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
      instructions: "温かみのある口調で話し、回答は簡潔にしてください。",
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

- 複数の Talk プロバイダーが設定されている場合、`talk.provider` は `talk.providers` 内のキーと一致する必要があります。
- 従来のフラットな Talk キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は、互換性維持専用です。`openclaw doctor --fix` を実行して、永続化された設定を `talk.providers.<provider>` に書き換えてください。
- 音声 ID は、`ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします（macOS Talk クライアントの動作）。
- `providers.*.apiKey` は、プレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` へのフォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` を使用すると、Talk ディレクティブでわかりやすい名前を使用できます。
- `providers.mlx.modelId` は、macOS のローカル MLX ヘルパーが使用する Hugging Face リポジトリを選択します。省略した場合、macOS は `mlx-community/Soprano-80M-bf16` を使用します。
- macOS の MLX 再生では、同梱の `openclaw-mlx-tts` ヘルパーが存在する場合はそれを使用し、存在しない場合は `PATH` 上の実行可能ファイルを使用します。開発時には `OPENCLAW_MLX_TTS_BIN` でヘルパーのパスを上書きできます。
- `consultThinkingLevel` は、Control UI Talk のリアルタイム `openclaw_agent_consult` 呼び出しの背後で実行される完全な OpenClaw エージェント実行について、思考レベルを制御します。通常のセッションおよびモデルの動作を維持するには、未設定のままにしてください。
- `consultFastMode` は、セッションの通常の高速モード設定を変更せずに、Control UI Talk のリアルタイムコンサルトに対する一回限りの高速モード上書きを設定します。
- `speechLocale` は、iOS/macOS の Talk 音声認識で使用する BCP 47 ロケール ID を設定します。デバイスのデフォルトを使用するには、未設定のままにしてください。
- `silenceTimeoutMs` は、ユーザーの発話が途切れてから Talk モードが文字起こしを送信するまでの待機時間を制御します。未設定の場合、プラットフォームのデフォルトの一時停止時間（`700 ms on macOS and Android, 900 ms on iOS`）が維持されます。
- `realtime.instructions` は、OpenClaw に組み込まれたリアルタイムプロンプトにプロバイダー向けのシステム指示を追加します。これにより、デフォルトの `openclaw_agent_consult` ガイダンスを失わずに音声スタイルを設定できます。
- `realtime.vadThreshold` は、プロバイダーの音声アクティビティしきい値を `0`（最高感度）から `1`（最低感度）の範囲で設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.silenceDurationMs` は、プロバイダーがリアルタイムのユーザーターンを確定するまでの無音時間を正の整数で設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.prefixPaddingMs` は、音声の検出開始前に保持するオーディオ量を非負の整数で設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.reasoningEffort` は、リアルタイムセッションにおけるプロバイダー固有の推論レベルを設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.consultRouting`: `"provider-direct"`（デフォルト）は、リアルタイムプロバイダーが `openclaw_agent_consult` なしでユーザーの最終文字起こしを生成した場合に、プロバイダーからの直接応答を維持します。代わりに `"force-agent-consult"` は、確定したリクエストを OpenClaw 経由でルーティングします。

---

## 関連項目

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他すべての設定キー
- [設定](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [設定例](/ja-JP/gateway/configuration-examples)
