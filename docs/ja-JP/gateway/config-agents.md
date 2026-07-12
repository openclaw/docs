---
read_when:
    - エージェントのデフォルト設定を調整する（モデル、思考、ワークスペース、Heartbeat、メディア、Skills）
    - マルチエージェントのルーティングとバインディングの設定
    - セッション、メッセージ配信、トークモードの動作を調整する
summary: エージェントのデフォルト、マルチエージェントルーティング、セッション、メッセージ、トーク設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-07-12T14:32:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 054fbb866e4c02a64a1e8041421a478e3c1fd01311f57f293c6420a6516ebddb
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、`messages.*`、`talk.*` 配下のエージェントスコープ設定キー。チャンネル、ツール、Gateway ランタイム、その他のトップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `OPENCLAW_WORKSPACE_DIR` が設定されている場合はその値、それ以外は `~/.openclaw/workspace`（`OPENCLAW_PROFILE` がデフォルト以外のプロファイルに設定されている場合は `~/.openclaw/workspace-<profile>`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明示的な `agents.defaults.workspace` の値は、`OPENCLAW_WORKSPACE_DIR` より優先されます。設定にパスを書き込みたくない場合は、環境変数を使用してデフォルトのエージェントがマウント済みワークスペースを参照するようにします。

### `agents.defaults.repoRoot`

システムプロンプトの Runtime 行に表示される、任意指定のリポジトリルート。未設定の場合、OpenClaw はワークスペースから上位ディレクトリへたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないエージェント向けの、任意指定のデフォルト Skills 許可リスト。

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

- デフォルトで Skills を無制限にするには、`agents.defaults.skills` を省略します。
- デフォルトを継承するには、`agents.list[].skills` を省略します。
- Skills を使用しない場合は、`agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストが、そのエージェントの最終的なセットになります。デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

ワークスペースのブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

必須のブートストラップファイル（`AGENTS.md`、`TOOLS.md`、`BOOTSTRAP.md`）は書き込みつつ、選択した任意のワークスペースファイルの作成を省略します。有効な値: `SOUL.md`、`USER.md`、`HEARTBEAT.md`、`IDENTITY.md`。

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

- `"continuation-skip"`: 安全な継続ターン（アシスタントの応答完了後）ではワークスペースのブートストラップを再注入せず、プロンプトサイズを削減します。Heartbeat の実行と Compaction 後の再試行では、引き続きコンテキストを再構築します。
- `"never"`: すべてのターンで、ワークスペースのブートストラップおよびコンテキストファイルの注入を無効にします。プロンプトのライフサイクルを完全に管理するエージェント（カスタムコンテキストエンジン、独自にコンテキストを構築するネイティブランタイム、ブートストラップを使用しない特殊なワークフロー）でのみ使用してください。Heartbeat および Compaction 復旧ターンでも注入を省略します。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

エージェントごとのオーバーライド: `agents.list[].contextInjection`。省略した値は `agents.defaults.contextInjection` を継承します。

### `agents.defaults.bootstrapMaxChars`

切り詰め前の、ワークスペースのブートストラップファイルごとの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

エージェントごとのオーバーライド: `agents.list[].bootstrapMaxChars`。省略した値は `agents.defaults.bootstrapMaxChars` を継承します。

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペースブートストラップファイルから注入される合計最大文字数。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

エージェントごとのオーバーライド: `agents.list[].bootstrapTotalMaxChars`。省略した値は `agents.defaults.bootstrapTotalMaxChars` を継承します。

### エージェントごとのブートストラッププロファイルのオーバーライド

あるエージェントで共有デフォルトとは異なるプロンプト注入動作が必要な場合は、エージェントごとのブートストラッププロファイルのオーバーライドを使用します。省略したフィールドは `agents.defaults` から継承します。

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

ブートストラップコンテキストが切り詰められた際に、エージェントに表示されるシステムプロンプト通知を制御します。
デフォルト: `"always"`。

- `"off"`: 切り詰め通知テキストをシステムプロンプトに一切注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに、簡潔な通知を一度だけ注入します。
- `"always"`: 切り詰めが発生している場合、実行のたびに簡潔な通知を注入します（推奨）。

未加工および注入後の詳細なカウントと設定調整フィールドは、コンテキスト／ステータスレポートやログなどの診断情報にのみ保持されます。通常の WebChat のユーザー／ランタイムコンテキストには、簡潔な復旧通知のみが含まれます。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### コンテキスト予算の所有権マップ

OpenClaw には大容量のプロンプト／コンテキスト予算が複数あり、1 つの汎用設定ですべてを制御するのではなく、意図的にサブシステムごとに分割されています。

| 予算                                                           | 対象範囲                                                                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 通常のワークスペースブートストラップ注入                                                                                                                        |
| `agents.defaults.startupContext.*`                             | 最近の `memory/*.md` 日次ファイルを含む、リセット／起動時のモデル実行における一回限りの前置き。単独のチャット `/new` と `/reset` は、モデルを呼び出さずに受け付けられます |
| `skills.limits.*`                                              | システムプロンプトに注入されるコンパクトな Skills リスト                                                                                                        |
| `agents.defaults.contextLimits.*`                              | 制限付きのランタイム抜粋と、ランタイム所有の注入ブロック                                                                                                        |
| `memory.qmd.limits.*`                                          | インデックス化されたメモリ検索スニペットと注入サイズ                                                                                                            |

対応するエージェントごとのオーバーライド:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

リセット／起動時のモデル実行で、最初のターンに注入される起動前置きを制御します。
単独のチャットコマンド `/new` と `/reset` は、モデルを呼び出さずにリセットを受け付けるため、この前置きを読み込みません。

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

制限付きランタイムコンテキストサーフェスの共有デフォルト。

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
- `toolResultMaxChars`: 永続化される結果とオーバーフロー復旧に使用される、高度なライブツール結果の上限。モデルコンテキストの自動上限を使用する場合は未設定のままにします。100K トークン未満では `16000` 文字、100K+ トークンでは `32000` 文字、200K+ トークンでは `64000` 文字です。長いコンテキストを持つモデルでは、`1000000` までの明示的な値が受け付けられますが、実効上限は引き続きモデルのコンテキストウィンドウの約 30% に制限されます。`openclaw doctor --deep` は実効上限を出力し、doctor は明示的なオーバーライドが古いか、効果がない場合にのみ警告します。
- `postCompactionMaxChars`: Compaction 後の更新注入時に使用される AGENTS.md 抜粋の上限。

#### `agents.list[].contextLimits`

共有の `contextLimits` 設定に対するエージェントごとのオーバーライド。省略したフィールドは `agents.defaults.contextLimits` から継承します。

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

システムプロンプトに注入されるコンパクトな Skills リストのグローバル上限。これは、必要に応じて `SKILL.md` ファイルを読み込む処理には影響しません。

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills プロンプト予算に対するエージェントごとのオーバーライド。

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前の、トランスクリプト／ツール画像ブロックにおける画像の最長辺の最大ピクセル数。
デフォルト: `1200`。

通常、値を小さくすると、スクリーンショットを多用する実行でビジョントークン使用量とリクエストペイロードサイズが削減されます。
値を大きくすると、より多くの視覚的詳細が保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ファイルパス、URL、メディア参照から読み込まれる画像に対する、画像ツールの圧縮／詳細度の設定。
デフォルト: `auto`。

OpenClaw は、選択された画像モデルに応じてリサイズ段階を調整します。たとえば、Claude Opus 4.8、OpenAI GPT-5.6 Sol、Qwen VL、ホスト型 Llama 4 ビジョンモデルでは、旧式／デフォルトの高詳細ビジョン経路より大きな画像を使用できます。一方、複数画像を含むターンでは、トークンとレイテンシのコストを制御するため、`auto` モードでより積極的に圧縮されます。

値:

- `auto`: モデルの制限と画像数に適応します。
- `efficient`: トークンとバイトの使用量を抑えるため、より小さい画像を優先します。
- `balanced`: 標準的な中間のリサイズ段階を使用します。
- `high`: スクリーンショット、図、文書画像の詳細をより多く保持します。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトのコンテキストに使用するタイムゾーン（メッセージのタイムスタンプには使用されません）。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプト内の時刻形式。デフォルト: `auto`（OS の設定）。

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
      params: { cacheRetention: "long" }, // グローバルなデフォルトのプロバイダーパラメーター
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け入れます。
  - 文字列形式では、プライマリモデルのみを設定します。
  - オブジェクト形式では、プライマリモデルと、順序付けされたフェイルオーバーモデルを設定します。
- `utilityModel`: 短い内部タスク用の、省略可能な `provider/model` 参照またはエイリアスです。現在は、生成される Control UI セッションタイトル、Telegram DM トピックタイトル、Discord 自動スレッドタイトル、[進捗ドラフトのナレーション](/ja-JP/concepts/progress-drafts#narrated-status)に使用されます。未設定の場合、OpenClaw は、プライマリプロバイダーに宣言済みの小規模モデルのデフォルトがあればそれを使用します（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）。それ以外の場合、タイトルタスクはエージェントのプライマリモデルにフォールバックし、ナレーションは無効のままです。ユーティリティルーティングを完全に無効にするには、`utilityModel: ""` を設定します。`agents.list[].utilityModel` はデフォルトを上書きし（エージェント単位で空の値を指定すると、そのエージェントでは無効になります）、操作固有のモデル上書きはこれらの両方より優先されます。ユーティリティタスクは個別のモデル呼び出しを行い、タスク固有の内容を選択したモデルプロバイダーに送信します。ダッシュボードのタイトル生成では、最初のコマンド以外のメッセージから最大で先頭 1,000 文字を送信します。ナレーションでは、受信リクエストと簡潔に編集されたツール概要を送信します。コストとデータ処理の要件に合うプロバイダーを選択してください。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け入れます。
  - `image` ツールパスで、ビジョンモデル設定として使用されます。
  - 選択されたモデルまたはデフォルトモデルが画像入力を受け入れられない場合のフォールバックルーティングにも使用されます。
  - 明示的な `provider/model` 参照を推奨します。互換性のため、プロバイダーなしの ID も受け入れられます。プロバイダーなしの ID が `models.providers.*.models` 内に設定された画像対応エントリと一意に一致する場合、OpenClaw はそのプロバイダーを付加します。設定済みの一致が複数ある場合は、明示的なプロバイダープレフィックスが必要です。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け入れます。
  - 共有の画像生成機能と、将来画像を生成するすべてのツール／Plugin サーフェスで使用されます。
  - 一般的な値: Gemini ネイティブ画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-2`、透明背景の OpenAI PNG/WebP 出力には `openai/gpt-image-1.5`。
  - プロバイダー／モデルを直接選択する場合は、対応するプロバイダー認証も設定してください（たとえば、`google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2`／`openai/gpt-image-1.5` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証情報に基づくプロバイダーのデフォルトを推測できます。まず現在のデフォルトプロバイダーを試し、次に登録済みの残りの画像生成プロバイダーをプロバイダー ID 順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け入れます。
  - 共有の音楽生成機能と、組み込みの `music_generate` ツールで使用されます。
  - 一般的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証情報に基づくプロバイダーのデフォルトを推測できます。まず現在のデフォルトプロバイダーを試し、次に登録済みの残りの音楽生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー／モデルを直接選択する場合は、対応するプロバイダー認証／API キーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け入れます。
  - 共有の動画生成機能と、組み込みの `video_generate` ツールで使用されます。
  - 一般的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証情報に基づくプロバイダーのデフォルトを推測できます。まず現在のデフォルトプロバイダーを試し、次に登録済みの残りの動画生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー／モデルを直接選択する場合は、対応するプロバイダー認証／API キーも設定してください。
  - 公式の Qwen 動画生成 Plugin は、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、およびプロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け入れます。
  - `pdf` ツールのモデルルーティングに使用されます。
  - 省略した場合、PDF ツールは `imageModel`、次に解決済みのセッションモデル／デフォルトモデルへフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されなかった場合に `pdf` ツールが使用する、デフォルトの PDF サイズ上限です。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで処理対象とする、デフォルトの最大ページ数です。
- `verboseDefault`: エージェントのデフォルト詳細レベルです。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `toolProgressDetail`: `/verbose` のツール概要と進捗ドラフトのツール行で使用する詳細モードです。値: `"explain"`（デフォルト。簡潔で人が理解しやすいラベル）または `"raw"`（利用可能な場合は生のコマンド／詳細を追加）。エージェント単位の `agents.list[].toolProgressDetail` はこのデフォルトを上書きします。
- `reasoningDefault`: エージェントのデフォルトの推論表示設定です。値: `"off"`、`"on"`、`"stream"`。エージェント単位の `agents.list[].reasoningDefault` はこのデフォルトを上書きします。設定された推論のデフォルトは、メッセージ単位またはセッション単位の推論上書きが設定されていない場合に限り、所有者、承認済み送信者、またはオペレーター管理者の Gateway コンテキストにのみ適用されます。
- `elevatedDefault`: エージェントのデフォルトの昇格出力レベルです。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model` です（例: Codex OAuth アクセスには `openai/gpt-5.6-sol`）。プロバイダーを省略すると、OpenClaw は最初にエイリアスを試し、次にその正確なモデル ID と一意に一致する設定済みプロバイダーを試し、その後に限り設定済みのデフォルトプロバイダーへフォールバックします（非推奨の互換動作であるため、明示的な `provider/model` を推奨します）。そのプロバイダーが設定済みのデフォルトモデルを提供しなくなった場合、OpenClaw は削除済みプロバイダーの古いデフォルトをエラーとして表示する代わりに、最初に設定されたプロバイダー／モデルへフォールバックします。
- `models`: `/model` 用に設定されたモデルカタログおよび許可リストです。各エントリには `alias`（ショートカット）と `params`（プロバイダー固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter の `provider` ルーティング、`chat_template_kwargs`、`extra_body`／`extraBody`）を含めることができます。
  - `"openai/*": {}` や `"vllm/*": {}` などの `provider/*` エントリを使用すると、すべてのモデル ID を手動で列挙せずに、選択したプロバイダーで検出されたすべてのモデルを表示できます。
  - そのプロバイダーで動的に検出されるすべてのモデルに同じランタイムを使用する場合は、`provider/*` エントリに `agentRuntime` を追加します。完全一致する `provider/model` のランタイムポリシーは、引き続きワイルドカードより優先されます。
  - 安全な編集: エントリを追加するには、`openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。`--replace` を渡さない限り、`config set` は既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダー単位の設定／オンボーディングフローでは、選択したプロバイダーのモデルをこのマップにマージし、すでに設定されている無関係なプロバイダーを保持します。
  - OpenAI Responses モデルを直接使用する場合、サーバー側の Compaction は自動的に有効になります。`context_management` の注入を停止するには `params.responsesServerCompaction: false` を使用し、しきい値を上書きするには `params.responsesCompactThreshold` を使用します。[OpenAI のサーバー側 Compaction](/ja-JP/providers/openai#advanced-configuration)を参照してください。
- `params`: すべてのモデルに適用される、プロバイダーのグローバルなデフォルトパラメーターです。`agents.defaults.params` に設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルな基底値）は `agents.defaults.models["provider/model"].params`（モデル単位）で上書きされ、次に `agents.list[].params`（一致するエージェント ID）がキー単位で上書きします。詳細は[プロンプトキャッシュ](/ja-JP/reference/prompt-caching)を参照してください。
- `models.providers.openrouter.params.provider`: OpenRouter 全体のデフォルトのプロバイダールーティングポリシーです。OpenClaw はこれを OpenRouter のリクエストの `provider` オブジェクトに転送します。モデル単位の `agents.defaults.models["openrouter/<model>"].params.provider` とエージェントパラメーターはキー単位で上書きします。[OpenRouter のプロバイダールーティング](/ja-JP/providers/openrouter#advanced-configuration)を参照してください。
- `params.extra_body`／`params.extraBody`: OpenAI 互換プロキシ向けの `api: "openai-completions"` リクエストボディにマージされる、高度なパススルー JSON です。生成されたリクエストキーと競合する場合は追加ボディが優先されます。ネイティブではない completions ルートでは、その後も OpenAI 専用の `store` が削除されます。
- `params.chat_template_kwargs`: トップレベルの `api: "openai-completions"` リクエストボディにマージされる、vLLM／OpenAI 互換のチャットテンプレート引数です。思考がオフの `vllm/nemotron-3-*` では、同梱の vLLM Plugin が `enable_thinking: false` と `force_nonempty_content: true` を自動送信します。明示的な `chat_template_kwargs` は生成されたデフォルトを上書きし、`extra_body.chat_template_kwargs` は引き続き最終的に優先されます。設定済みの vLLM Qwen および Nemotron 思考モデルでは、複数レベルのエフォート段階ではなく、2 値の `/think` 選択肢（`off`、`on`）が公開されます。
- `compat.thinkingFormat`: OpenAI 互換の思考ペイロード形式です。Together 形式の `reasoning.enabled` には `"together"`、Qwen 形式のトップレベル `enable_thinking` には `"qwen"`、vLLM などリクエスト単位のチャットテンプレート kwargs をサポートする Qwen 系バックエンドでの `chat_template_kwargs.enable_thinking` には `"qwen-chat-template"` を使用します。OpenClaw は無効な思考を `false`、有効な思考を `true` に対応付けます。また、設定済みの vLLM Qwen モデルでは、これらの形式に対して 2 値の `/think` 選択肢が公開されます。
- `compat.supportedReasoningEfforts`: モデル単位の OpenAI 互換推論エフォートリストです。実際に受け入れるカスタムエンドポイントでは `"xhigh"` を含めてください。これにより OpenClaw は、その設定済みプロバイダー／モデルについて、コマンドメニュー、Gateway セッション行、セッションパッチ検証、エージェント CLI 検証、`llm-task` 検証で `/think xhigh` を公開します。バックエンドが標準レベルに対してプロバイダー固有の値を必要とする場合は、`compat.reasoningEffortMap` を使用します。
- `params.preserveThinking`: 保存された思考を使用するための、Z.AI 専用のオプトイン設定です。有効で思考がオンの場合、OpenClaw は `thinking.clear_thinking: false` を送信し、以前の `reasoning_content` を再送します。[Z.AI の思考と保存された思考](/ja-JP/providers/zai#advanced-configuration)を参照してください。
- `localService`: ローカル／セルフホスト型モデルサーバー向けの、省略可能なプロバイダーレベルのプロセスマネージャーです。選択したモデルがそのプロバイダーに属する場合、OpenClaw は `healthUrl`（または `baseUrl + "/models"`）をプローブし、エンドポイントが停止していれば `command` を `args` とともに起動し、最大 `readyTimeoutMs` まで待機してからモデルリクエストを送信します。`command` は絶対パスである必要があります。`idleStopMs: 0` は OpenClaw が終了するまでプロセスを稼働させ続けます。正の値を指定すると、そのミリ秒数だけアイドル状態が続いた後、OpenClaw が起動したプロセスを停止します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。
- ランタイムポリシーは `agents.defaults` ではなく、プロバイダーまたはモデルに設定します。プロバイダー全体のルールには `models.providers.<provider>.agentRuntime`、モデル固有のルールには `agents.defaults.models["provider/model"].agentRuntime`／`agents.list[].models["provider/model"].agentRuntime` を使用します。プロバイダー／モデルのプレフィックスだけでハーネスが選択されることはありません。ランタイムが未設定または `auto` の場合、OpenAI が Codex を暗黙的に選択できるのは、作成者によるリクエスト上書きがなく、公式の HTTPS Platform Responses または ChatGPT Responses ルートと完全に一致する場合だけです。[OpenAI の暗黙的なエージェントランタイム](/ja-JP/providers/openai#implicit-agent-runtime)を参照してください。
- これらのフィールドを変更する設定ライター（例: `/models set`、`/models set-image`、フォールバックの追加／削除コマンド）は、標準のオブジェクト形式で保存し、可能な場合は既存のフォールバックリストを保持します。
- `maxConcurrent`: セッション間で並列実行できるエージェント実行の最大数です（各セッション内では引き続き直列化されます）。デフォルト: `4`。

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

- `id`: `"auto"`、`"openclaw"`、登録済みPluginハーネスID、またはサポートされているCLIバックエンドのエイリアス。バンドルされたCodex Pluginは`codex`を登録し、バンドルされたAnthropic Pluginは`claude-cli` CLIバックエンドを提供します。
- `id: "auto"`では、登録済みPluginハーネスが、サポート契約を宣言するか、その他の方法で満たす有効なルートを引き受けることができ、どのハーネスも一致しない場合はOpenClawを使用します。`id: "codex"`のようにPluginランタイムを明示すると、そのハーネスと互換性のある有効なルートが必須になります。いずれかが利用できない場合、または実行に失敗した場合は、フェイルクローズします。
- `id: "pi"`は、v2026.5.22以前から出荷済みの設定を維持するため、`openclaw`の非推奨エイリアスとしてのみ受け付けられます。新しい設定では`openclaw`を使用してください。
- ランタイムの優先順位は、まずモデル完全一致ポリシー（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]`、または`models.providers.<provider>.models[]`）、次に`agents.list[]` / `agents.defaults.models["provider/*"]`、最後に`models.providers.<provider>.agentRuntime`のプロバイダー全体のポリシーです。
- エージェント全体のランタイムキーはレガシーです。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、セッションのランタイム固定、`OPENCLAW_AGENT_RUNTIME`はランタイム選択で無視されます。`openclaw doctor --fix`を実行して古い値を削除してください。
- 作成者によるリクエストオーバーライドがない、対象となる公式HTTPS OpenAI Responses/ChatGPT完全一致ルートでは、Codexハーネスが暗黙的に使用される場合があります。プロバイダー/モデルの`agentRuntime.id: "codex"`はCodexをフェイルクローズ要件にしますが、互換性のないルートを互換にするものではありません。
- Claude CLIのデプロイでは、`model: "anthropic/claude-opus-4-8"`とモデルスコープの`agentRuntime.id: "claude-cli"`を組み合わせることを推奨します。レガシーの`claude-cli/<model>`参照も互換性のために引き続き機能しますが、新しい設定ではプロバイダー/モデルの選択を正規形に保ち、実行バックエンドをプロバイダー/モデルのランタイムポリシーに配置してください。
- これはテキストのエージェントターン実行のみを制御します。メディア生成、ビジョン、PDF、音楽、動画、TTSは、引き続きそれぞれのプロバイダー/モデル設定を使用します。

**組み込みエイリアスの短縮形**（モデルが`agents.defaults.models`に含まれる場合にのみ適用）:

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

Z.AI GLM-4.xモデルは、`--thinking off`を設定するか、`agents.defaults.models["zai/<model>"].params.thinking`を独自に定義しない限り、自動的に思考モードを有効にします。
Z.AIモデルでは、ツール呼び出しのストリーミング用に`tool_stream`がデフォルトで有効になります。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream`を`false`に設定してください。
Anthropic Claude Opus 4.8では、OpenClaw内の思考はデフォルトでオフのままです。適応型思考を明示的に有効にすると、Anthropicのプロバイダー所有のエフォートのデフォルトは`high`になります。Claude 4.6モデルでは、思考レベルが明示的に設定されていない場合、デフォルトは`adaptive`になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行（ツール呼び出しなし）に使用する任意のCLIバックエンド。APIプロバイダーが失敗した場合の予備として便利です。

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
          // または、CLIがプロンプトファイルのフラグを受け付ける場合はsystemPromptFileArgを使用します。
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLIバックエンドはテキスト優先であり、ツールは常に無効です。
- `sessionArg`が設定されている場合、セッションがサポートされます。
- `imageArg`がファイルパスを受け付ける場合、画像のパススルーがサポートされます。
- `reseedFromRawTranscriptWhenUncompacted: true`を設定すると、最初のCompaction要約が存在する前に、バックエンドが範囲を制限したOpenClawの生トランスクリプト末尾から、安全に無効化されたセッションを復旧できます。認証プロファイルまたは認証情報エポックの変更時には、引き続き生データからの再シードは決して行われません。

### `agents.defaults.promptOverlays`

OpenClawが組み立てるプロンプト面に、モデルファミリーごとに適用されるプロバイダー非依存のプロンプトオーバーレイ。GPT-5ファミリーのモデルIDは、OpenClaw/プロバイダールート全体で共有の動作契約を受け取ります。`personality`が制御するのは、親しみやすい対話スタイルのレイヤーのみです。ネイティブCodex app-serverルートでは、このOpenClaw GPT-5オーバーレイの代わりにCodex所有のベース/モデル指示が維持され、OpenClawはネイティブスレッドでCodexの組み込みパーソナリティを無効にします。

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

- `"friendly"`（デフォルト）と`"on"`は、親しみやすい対話スタイルのレイヤーを有効にします。
- `"off"`は親しみやすいレイヤーのみを無効にします。タグ付きのGPT-5動作契約は有効なままです。
- この共有設定が未設定の場合、レガシーの`plugins.entries.openai.config.personality`が引き続き読み取られます。

### `agents.defaults.heartbeat`

定期的なHeartbeat実行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0mで無効化
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // デフォルト: true。falseの場合、システムプロンプトからHeartbeatセクションを省略
        lightContext: false, // デフォルト: false。trueの場合、ワークスペースのブートストラップファイルからHEARTBEAT.mdのみを保持
        isolatedSession: false, // デフォルト: false。trueの場合、各Heartbeatを新しいセッションで実行（会話履歴なし）
        skipWhenBusy: false, // デフォルト: false。trueの場合、このエージェントのサブエージェント/ネストされたレーンの完了も待機
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（デフォルト）| block
        target: "none", // デフォルト: none | 選択肢: last | whatsapp | telegram | discord | ...
        prompt: "HEARTBEAT.mdが存在する場合は読み取ってください...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（APIキー認証）または`1h`（OAuth認証）。無効にするには`0m`に設定します。
- `includeSystemPromptSection`: falseの場合、システムプロンプトからHeartbeatセクションを省略し、ブートストラップコンテキストへの`HEARTBEAT.md`の挿入をスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: trueの場合、Heartbeat実行中のツールエラー警告ペイロードを抑制します。
- `timeoutSeconds`: Heartbeatのエージェントターンが中止されるまでに許容される最大時間（秒）。未設定の場合、`agents.defaults.timeoutSeconds`が設定されていればその値を使用し、それ以外では最大600秒に制限されたHeartbeat間隔を使用します。
- `directPolicy`: ダイレクト/DM配信ポリシー。`allow`（デフォルト）はダイレクトターゲットへの配信を許可します。`block`はダイレクトターゲットへの配信を抑制し、`reason=dm-blocked`を出力します。
- `lightContext`: trueの場合、Heartbeat実行は軽量なブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから`HEARTBEAT.md`のみを保持します。
- `isolatedSession`: trueの場合、各Heartbeatは過去の会話履歴がない新しいセッションで実行されます。Cronの`sessionTarget: "isolated"`と同じ分離パターンです。Heartbeatあたりのトークンコストを約100Kから約2～5Kトークンに削減します。
- `skipWhenBusy`: trueの場合、Heartbeat実行はそのエージェントの追加のビジーレーン、つまり自身のセッションキーに紐づくサブエージェントまたはネストされたコマンド処理が完了するまで延期されます。Cronレーンでは、このフラグがなくても常にHeartbeatが延期されます。
- エージェント単位: `agents.list[].heartbeat`を設定します。いずれかのエージェントが`heartbeat`を定義すると、**それらのエージェントのみ**がHeartbeatを実行します。
- Heartbeatは完全なエージェントターンを実行します。間隔を短くすると、より多くのトークンを消費します。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 登録済みCompactionプロバイダーPluginのID（任意）
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "デプロイID、チケットID、host:portのペアを正確に保持してください。", // identifierPolicy=customの場合に使用
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // 任意のツールループ負荷チェック
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // AGENTS.mdセクションの再挿入をオプトイン
        model: "openrouter/anthropic/claude-sonnet-4-6", // 任意のCompaction専用モデルオーバーライド
        truncateAfterCompaction: true, // Compaction後に、より小さい後続JSONLへローテーション
        maxActiveTranscriptBytes: "20mb", // 任意の事前チェック用ローカルCompactionトリガー
        notifyUser: true, // Compactionの開始時/完了時およびメモリフラッシュの劣化時に通知（デフォルト: false）
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // 任意のメモリフラッシュ専用モデルオーバーライド
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "セッションがCompactionに近づいています。永続的な記憶を今すぐ保存してください。",
          prompt: "長期的に残すべきメモをmemory/YYYY-MM-DD.mdに書き込んでください。保存するものがない場合は、正確なサイレントトークンNO_REPLYで応答してください。",
        },
      },
    },
  },
}
```

- `mode`: `default` または `safeguard`（長い履歴向けのチャンク化された要約）。[Compaction](/ja-JP/concepts/compaction)を参照してください。
- `provider`: 登録済み Compaction プロバイダー Plugin の ID。設定すると、組み込みの LLM 要約の代わりにプロバイダーの `summarize()` が呼び出されます。失敗時は組み込み機能にフォールバックします。プロバイダーを設定すると、`mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction)を参照してください。
- `timeoutSeconds`: OpenClaw が中止するまでに、単一の Compaction 操作に許可される最大秒数。デフォルト: `180`。
- `reserveTokens`: Compaction 後のモデル出力と今後のツール結果用に確保されるトークンの余裕。モデルのコンテキストウィンドウが既知の場合、OpenClaw は有効な予約量がプロンプト予算を消費しないように上限を設定します。
- `reserveTokensFloor`: 組み込みランタイムによって適用される最小予約量。下限を無効にするには `0` を設定します。この下限にも、アクティブなコンテキストウィンドウの上限が適用されます。
- `keepRecentTokens`: 最新のトランスクリプト末尾をそのまま保持するためのエージェント切断点予算。明示的に設定されている場合、手動の `/compact` はこの値に従います。それ以外の場合、手動 Compaction は厳密なチェックポイントになります。
- `recentTurnsPreserve`: safeguard 要約の対象外として、そのまま保持する最新のユーザー／アシスタントターン数。デフォルト: `3`。
- `maxHistoryShare`: Compaction 後に保持される履歴に許可される、コンテキスト予算全体に対する最大割合（範囲 `0.1`～`0.9`）。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction 要約時に組み込みの不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用される、任意のカスタム識別子保持テキスト。
- `qualityGuard`: safeguard 要約に対する、不正な形式の出力時の再試行チェック。safeguard モードではデフォルトで有効です。監査を省略するには `enabled: false` を設定します。
- `midTurnPrecheck`: 任意のツールループ負荷チェック。`enabled: true` の場合、OpenClaw はツール結果の追加後、次のモデル呼び出し前にコンテキスト負荷を確認します。コンテキストが収まらなくなった場合、プロンプトを送信する前に現在の試行を中止し、既存の事前チェック復旧パスを再利用してツール結果を切り詰めるか、Compaction 後に再試行します。`default` と `safeguard` の両方の Compaction モードで機能します。デフォルト: 無効。
- `postIndexSync`: Compaction 後のセッションメモリ再インデックスモード。デフォルト: `"async"`。鮮度を最優先する場合は `"await"`、Compaction のレイテンシーを低減する場合は `"async"`、セッションメモリ同期を別の場所で処理する場合に限り `"off"` を使用します。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名。未設定または `[]` に設定されている場合、再注入は無効です。`["Session Startup", "Red Lines"]` を明示的に設定すると、この組み合わせが有効になり、従来の `Every Session`／`Safety` フォールバックも維持されます。Compaction 要約にすでに取り込まれたプロジェクトガイダンスが重複するリスクに見合うだけの追加コンテキストが必要な場合にのみ有効にしてください。
- `model`: Compaction 要約専用の任意の `provider/model-id`、または `agents.defaults.models` の単純なエイリアス。単純なエイリアスはディスパッチ前に解決され、衝突時は設定済みのリテラルモデル ID が優先されます。メインセッションではあるモデルを維持しつつ、Compaction 要約を別のモデルで実行する場合に使用します。未設定の場合、Compaction はセッションのプライマリモデルを使用します。
- `truncateAfterCompaction`: Compaction 後にアクティブなセッショントランスクリプトをローテーションし、以後のターンでは要約と未要約の末尾のみを読み込みます。以前の完全なトランスクリプトはアーカイブされたままです。長時間実行されるセッションで、アクティブなトランスクリプトが無制限に増大するのを防ぎます。デフォルト: `false`。
- `maxActiveTranscriptBytes`: トランスクリプト履歴がしきい値を超えた場合に、実行前に通常のローカル Compaction を開始する任意のバイトしきい値（`number` または `"20mb"` のような文字列）。Compaction 成功後に、より小さい後続トランスクリプトへローテーションできるよう、`truncateAfterCompaction` が必要です。未設定または `0` の場合は無効です。
- `notifyUser`: `true` の場合、簡潔なコンテキスト保守通知をユーザーへ送信します。Compaction の開始時と完了時（例: 「コンテキストを圧縮しています...」「Compaction が完了しました」）、および Compaction 前のメモリフラッシュを使い切り、機能が低下した状態で応答を続行する場合（例: 「メモリ保守が一時的に失敗しました。応答を続行します。」）に通知されます。これらの通知を表示しないよう、デフォルトでは無効です。
- `memoryFlush`: 永続的なメモリを保存するため、自動 Compaction 前に実行されるサイレントなエージェントターン。この保守ターンをローカルモデル上に維持する場合は、`model` に `ollama/qwen3:8b` のような正確なプロバイダー／モデルを設定します。このオーバーライドは、アクティブセッションのフォールバックチェーンを継承しません。`forceFlushTranscriptBytes` は、トークンカウンターが古くなっていても、トランスクリプトサイズがしきい値に達した時点でフラッシュを強制します。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.runRetries`

失敗からの復旧中に無限実行ループが発生するのを防ぐための、組み込みエージェントランタイムの外側実行ループにおける再試行反復境界。この設定は組み込みエージェントランタイムにのみ適用され、ACP または CLI ランタイムには適用されません。

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

- `base`: 外側実行ループの再試行反復の基本回数。デフォルト: `24`。
- `perProfile`: フォールバックプロファイル候補ごとに追加される実行再試行回数。デフォルト: `8`。
- `min`: 実行再試行回数の絶対最小値。デフォルト: `32`。
- `max`: 暴走を防ぐための実行再試行回数の絶対最大値。デフォルト: `160`。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから**古いツール結果**を除去します。ディスク上のセッション履歴は変更**しません**。デフォルトでは無効です。有効にするには `mode: "cache-ttl"` を設定します。

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
        hardClear: { enabled: true, placeholder: "[古いツール結果の内容は消去されました]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl モードの動作">

- `mode: "cache-ttl"` は除去処理を有効にします。
- `ttl` は、最後にキャッシュへアクセスしてから除去処理を再実行できるまでの間隔を制御します。デフォルト: `5m`。
- 除去処理は、まずサイズ超過のツール結果をソフトトリミングし、必要に応じて古いツール結果をハードクリアします。
- `softTrimRatio` と `hardClearRatio` は `0.0`～`1.0` の値を受け付けます。この範囲外の値は設定検証で拒否されます。

**ソフトトリミング**では先頭と末尾を保持し、中央に `...` を挿入します。

**ハードクリア**ではツール結果全体をプレースホルダーで置き換えます。

注意:

- 画像ブロックはトリミングもクリアもされません。
- 比率は文字数ベースの概算であり、正確なトークン数ではありません。
- アシスタントメッセージが `keepLastAssistants` 未満の場合、除去処理はスキップされます。

</Accordion>

動作の詳細については、[セッション除去](/ja-JP/concepts/session-pruning)を参照してください。

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

- Telegram 以外のチャンネルでブロック応答を有効にするには、`*.blockStreaming: true` を明示的に設定する必要があります。
- チャンネルのオーバーライド: `channels.<channel>.blockStreamingCoalesce`（アカウントごとのバリエーションも含む）。Discord、Google Chat、Mattermost、MS Teams、Signal、Slack のデフォルトは `minChars: 1500`／`idleMs: 1000` です。
- `blockStreamingChunk.breakPreference`: 優先するチャンク境界（`"paragraph" | "newline" | "sentence"`）。
- `humanDelay`: ブロック応答間のランダムな一時停止。デフォルト: `off`。`natural` = 800-2500ms。`custom` は `minMs`／`maxMs` を使用します（未設定の境界値には自然な範囲が使用されます）。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細については、[ストリーミング](/ja-JP/concepts/streaming)を参照してください。

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

- デフォルト: ダイレクトチャット／メンションでは `instant`、メンションされていないグループチャットでは `message`。
- `typingIntervalSeconds` のデフォルト: `6`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[入力中インジケーター](/ja-JP/concepts/typing-indicators)を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

組み込みエージェント用の任意のサンドボックス機能。完全なガイドについては、[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

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
          // SecretRefs／インライン内容にも対応:
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

上記に示したデフォルト（`off`/`docker`/`agent`/`none`/`bookworm-slim`イメージ/`none`ネットワークなど）は、単なる例示値ではなく、実際のOpenClawのデフォルトです。

<Accordion title="サンドボックスの詳細">

**バックエンド：**

- `docker`：ローカルDockerランタイム（デフォルト）
- `ssh`：汎用SSHベースのリモートランタイム
- `openshell`：OpenShellランタイム

`backend: "openshell"`を選択すると、ランタイム固有の設定は
`plugins.entries.openshell.config`に移動します。

**SSHバックエンド設定：**

- `target`：`user@host[:port]`形式のSSHターゲット
- `command`：SSHクライアントコマンド（デフォルト：`ssh`）
- `workspaceRoot`：スコープごとのワークスペースに使用するリモートの絶対ルート（デフォルト：`/tmp/openclaw-sandboxes`）
- `identityFile` / `certificateFile` / `knownHostsFile`：OpenSSHに渡す既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`：OpenClawがランタイムに一時ファイルとして実体化するインラインコンテンツまたはSecretRef
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSHのホストキーポリシー設定（いずれもデフォルトは`true`）

**SSH認証の優先順位：**

- `identityData`は`identityFile`より優先されます
- `certificateData`は`certificateFile`より優先されます
- `knownHostsData`は`knownHostsFile`より優先されます
- SecretRefを使用する`*Data`値は、サンドボックスセッションの開始前に、アクティブなシークレットランタイムスナップショットから解決されます

**SSHバックエンドの動作：**

- 作成または再作成後に、リモートワークスペースへ一度だけ初期データを投入します
- その後は、リモートSSHワークスペースを正規のものとして維持します
- `exec`、ファイルツール、メディアパスをSSH経由で処理します
- リモートの変更をホストへ自動的に同期しません
- サンドボックスブラウザコンテナをサポートしません

**ワークスペースへのアクセス：**

- `none`：`~/.openclaw/sandboxes`配下のスコープごとのサンドボックスワークスペース（デフォルト）
- `ro`：サンドボックスワークスペースは`/workspace`、エージェントワークスペースは`/agent`に読み取り専用でマウント
- `rw`：エージェントワークスペースを`/workspace`に読み書き可能でマウント

**スコープ：**

- `session`：セッションごとのコンテナとワークスペース
- `agent`：エージェントごとに1つのコンテナとワークスペース（デフォルト）
- `shared`：共有コンテナとワークスペース（セッション間の分離なし）

**OpenShell Plugin設定：**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // ミラー（デフォルト） | リモート
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // 任意
          gatewayEndpoint: "https://lab.example", // 任意
          policy: "strict", // 任意のOpenShellポリシーID
          providers: ["openai"], // 任意
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShellモード：**

- `mirror`：実行前にローカルからリモートへ初期データを投入し、実行後に同期して戻します。ローカルワークスペースが正規のものとして維持されます
- `remote`：サンドボックスの作成時にリモートへ一度だけ初期データを投入し、その後はリモートワークスペースを正規のものとして維持します

`remote`モードでは、初期データ投入後にOpenClawの外部で行われたホストローカルの編集は、サンドボックスへ自動的に同期されません。
転送はOpenShellサンドボックスへのSSH経由ですが、サンドボックスのライフサイクルと任意のミラー同期はPluginが管理します。

**`setupCommand`**は、コンテナ作成後に一度だけ（`sh -lc`経由で）実行されます。ネットワークへの送信、書き込み可能なルート、rootユーザーが必要です。

**コンテナのデフォルトは`network: "none"`です** — エージェントが外部アクセスを必要とする場合は、`"bridge"`（またはカスタムブリッジネットワーク）に設定します。
`"host"`はブロックされます。`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`を明示的に設定しない限り、`"container:<id>"`もデフォルトでブロックされます（緊急時の制限解除）。
アクティブなOpenClawサンドボックス内でのCodex app-serverターンは、ネイティブコードモードのネットワークアクセスにも同じ外部通信設定を使用します。

**受信添付ファイル**は、アクティブなワークスペースの`media/inbound/*`に配置されます。

**`docker.binds`**は追加のホストディレクトリをマウントします。グローバルバインドとエージェントごとのバインドはマージされます。

**サンドボックス化されたブラウザ**（`sandbox.browser.enabled`、デフォルトは`false`）：コンテナ内のChromium + CDP。noVNC URLがシステムプロンプトに挿入されます。`openclaw.json`で`browser.enabled`を有効にする必要はありません。
noVNCオブザーバーアクセスではデフォルトでVNC認証が使用され、OpenClawは共有URLでパスワードを公開する代わりに、有効期間の短いトークンURLを発行します。

- `allowHostControl: false`（デフォルト）は、サンドボックス化されたセッションがホストブラウザを対象にすることをブロックします。
- `network`のデフォルトは`openclaw-sandbox-browser`（専用ブリッジネットワーク）です。グローバルブリッジ接続を明示的に必要とする場合にのみ`bridge`に設定してください。ここでも`"host"`はブロックされます。
- `cdpSourceRange`は、必要に応じてコンテナ境界でのCDP受信をCIDR範囲（例：`172.21.0.1/32`）に制限します。
- `sandbox.browser.binds`は、追加のホストディレクトリをサンドボックスブラウザコンテナにのみマウントします。設定した場合（`[]`を含む）、ブラウザコンテナでは`docker.binds`の代わりに使用されます。
- サンドボックスブラウザコンテナのChromiumは常に`--no-sandbox --disable-setuid-sandbox`付きで起動します（コンテナにはChrome独自のサンドボックスに必要なカーネルプリミティブがありません）。これを変更する設定トグルはありません。
- 起動時のデフォルトは`scripts/sandbox-browser-entrypoint.sh`で定義され、コンテナホスト向けに調整されています：
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
  - `--disable-3d-apis`、`--disable-gpu`、`--disable-software-rasterizer`は
    デフォルトで有効です。WebGL/3Dの使用に必要な場合は、
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`で無効にできます。
  - `--disable-extensions`（デフォルトで有効）。ワークフローが拡張機能に依存する場合は、
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`で拡張機能を再度有効にできます。
  - デフォルトでは`--renderer-process-limit=2`です。
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`で変更でき、`0`に設定するとChromiumの
    デフォルトのプロセス制限を使用します。
  - `headless`が有効な場合にのみ`--headless=new`。
  - デフォルトはコンテナイメージのベースラインです。コンテナのデフォルトを変更するには、カスタム
    エントリポイントを備えたカスタムブラウザイメージを使用してください。

</Accordion>

ブラウザのサンドボックス化と`sandbox.docker.binds`はDockerでのみ使用できます。

イメージをビルドする場合（ソースチェックアウトから）：

```bash
scripts/sandbox-setup.sh           # メインのサンドボックスイメージ
scripts/sandbox-browser-setup.sh   # 任意のブラウザイメージ
```

ソースチェックアウトなしでnpmインストールする場合は、インラインの`docker build`コマンドについて[サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup)を参照してください。

### `agents.list`（エージェントごとのオーバーライド）

`agents.list[].tts`を使用すると、エージェントごとに独自のTTSプロバイダー、音声、モデル、
スタイル、または自動TTSモードを設定できます。エージェントブロックはグローバルな
`messages.tts`にディープマージされるため、共有認証情報を1か所に保持しながら、個々の
エージェントは必要な音声またはプロバイダーフィールドのみをオーバーライドできます。アクティブなエージェントの
オーバーライドは、自動音声応答、`/tts audio`、`/tts status`、および
`tts`エージェントツールに適用されます。プロバイダーの例と優先順位については、[テキスト読み上げ](/ja-JP/tools/tts#per-agent-voice-overrides)
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
        model: "anthropic/claude-opus-4-6", // または { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // エージェントごとの思考レベルのオーバーライド
        reasoningDefault: "on", // エージェントごとの推論可視性のオーバーライド
        fastModeDefault: false, // エージェントごとの高速モードのオーバーライド
        params: { cacheRetention: "none" }, // 一致するdefaults.modelsのparamsをキー単位でオーバーライド
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // 設定時はagents.defaults.skillsを置き換えます
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

- `id`: 安定したエージェント ID（必須）。
- `default`: 複数指定されている場合は、最初のものが優先されます（警告がログに記録されます）。指定がない場合は、リストの最初のエントリがデフォルトになります。
- `model`: 文字列形式では、モデルフォールバックなしの厳密なエージェント単位のプライマリを設定します。オブジェクト形式 `{ primary }` も、`fallbacks` を追加しない限り厳密です。エージェントでフォールバックを有効にするには `{ primary, fallbacks: [...] }` を使用し、厳密な動作を明示するには `{ primary, fallbacks: [] }` を使用します。`primary` のみを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、引き続きデフォルトのフォールバックを継承します。
- `utilityModel`: 生成されるセッション名やスレッド名など、短い内部タスク向けの省略可能なエージェント単位のオーバーライドです。`agents.defaults.utilityModel`、プライマリプロバイダーが宣言した小規模モデルのデフォルト、このエージェントのプライマリモデルの順にフォールバックします。空文字列を指定すると、このエージェントのユーティリティルーティングが無効になります。
- `params`: `agents.defaults.models` で選択されたモデルエントリにマージされる、エージェント単位のストリームパラメーターです。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などをエージェントごとに上書きするために使用します。
- `tts`: 省略可能なエージェント単位のテキスト読み上げオーバーライドです。このブロックは `messages.tts` にディープマージされるため、共有プロバイダー認証情報とフォールバックポリシーは `messages.tts` に保持し、ここではプロバイダー、音声、モデル、スタイル、自動モードなど、ペルソナ固有の値のみを設定します。
- `skills`: 省略可能なエージェント単位のスキル許可リストです。省略した場合、設定されていればエージェントは `agents.defaults.skills` を継承します。明示的なリストはデフォルトとマージされずに置き換えられ、`[]` はスキルなしを意味します。
- `thinkingDefault`: 省略可能なエージェント単位のデフォルト思考レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）です。メッセージ単位またはセッション単位のオーバーライドが設定されていない場合、このエージェントでは `agents.defaults.thinkingDefault` を上書きします。選択されたプロバイダー／モデルプロファイルによって有効な値が決まります。Google Gemini では、`adaptive` によりプロバイダー管理の動的思考が維持されます（Gemini 3/3.1 では `thinkingLevel` を省略し、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 省略可能なエージェント単位のデフォルト推論表示設定（`on | off | stream`）です。メッセージ単位またはセッション単位の推論オーバーライドが設定されていない場合、このエージェントでは `agents.defaults.reasoningDefault` を上書きします。
- `fastModeDefault`: 省略可能なエージェント単位の高速モードのデフォルト（`"auto" | true | false`）です。メッセージ単位またはセッション単位の高速モードオーバーライドが設定されていない場合に適用されます。
- `models`: 完全な `provider/model` ID をキーとする、省略可能なエージェント単位のモデルカタログ／ランタイムオーバーライドです。エージェント単位のランタイム例外には `models["provider/model"].agentRuntime` を使用します。
- `runtime`: 省略可能なエージェント単位のランタイム記述子です。エージェントで ACP ハーネスセッションをデフォルトにする場合は、`runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）とともに `type: "acp"` を使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- ローカルのワークスペース相対 `identity.avatar` 画像ファイルは 2 MB に制限されます。`http(s)` URL と `data:` URI には、ローカルファイルサイズ制限のチェックは適用されません。
- `identity` はデフォルト値を導出します。`ackReaction` は `emoji` から、`mentionPatterns` は `name`／`emoji` から導出されます。
- `subagents.allowAgents`: 明示的な `sessions_spawn.agentId` ターゲットとして設定済みエージェント ID を許可するリスト（`["*"]` = 設定済みの任意のターゲット、デフォルト: 同じエージェントのみ）。自身をターゲットとする `agentId` 呼び出しを許可する場合は、リクエスター ID を含めます。エージェント設定が削除された古いエントリは `sessions_spawn` によって拒否され、`agents_list` から除外されます。これらを削除するには `openclaw doctor --fix` を実行します。または、デフォルトを継承しつつそのターゲットを引き続きスポーン可能にする必要がある場合は、最小限の `agents.list[]` エントリを追加します。
- サンドボックス継承ガード: リクエスターセッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します。デフォルト: false）。
- `subagents.maxConcurrent`: サブエージェント実行全体で同時に実行できる子エージェントの最大数。デフォルト: `8`。
- `subagents.maxChildrenPerAgent`: 単一のエージェントセッションがスポーンできるアクティブな子の最大数。デフォルト: `5`。
- `subagents.maxSpawnDepth`: サブエージェントをスポーンする際の最大ネスト深度（`1`-`5`）。デフォルト: `1`（ネストなし）。
- `subagents.archiveAfterMinutes`: 完了したサブエージェントの状態がアーカイブされるまでの経過時間。デフォルト: `60`。

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

### バインディングの照合フィールド

- `type`（省略可能）: 通常のルーティングには `route`（type を省略した場合のデフォルトは route）、永続的な ACP 会話バインディングには `acp`。
- `match.channel`（必須）
- `match.accountId`（省略可能。`*` = 任意のアカウント。省略 = デフォルトアカウント）
- `match.peer`（省略可能。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（省略可能。チャンネル固有）
- `acp`（省略可能。`type: "acp"` の場合のみ）: `{ mode, label, cwd, backend }`

**決定論的な照合順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致、peer/guild/team なし）
5. `match.accountId: "*"`（チャンネル全体）
6. デフォルトエージェント

各階層内では、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は会話 ID（`match.channel` + アカウント + `match.peer.id`）の完全一致で解決し、上記のルートバインディング階層順序は使用しません。

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
      maxDiskBytes: "500mb", // 省略可能なハード上限
      highWaterBytes: "400mb", // 省略可能なクリーンアップ目標
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 非アクティブ状態による自動フォーカス解除までのデフォルト時間（時間単位。`0` で無効）
      maxAgeHours: 0, // デフォルトの厳格な最大有効期間（時間単位。`0` で無効）
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

- **`scope`**: グループチャットコンテキストにおける基本セッションのグループ化戦略。
  - `per-sender`（デフォルト）: 各送信者に、チャネルコンテキスト内で分離されたセッションを割り当てます。
  - `global`: チャネルコンテキスト内のすべての参加者が単一のセッションを共有します（共有コンテキストを意図する場合にのみ使用してください）。
- **`dmScope`**: DM のグループ化方法。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャネル + 送信者ごとに分離します（マルチユーザーの受信トレイに推奨）。
  - `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します（マルチアカウントに推奨）。
- **`identityLinks`**: チャネル間でセッションを共有するため、正規 ID をプロバイダー接頭辞付きのピアにマッピングします。`/dock_discord` などのドッキングコマンドは同じマップを使用し、アクティブなセッションの返信経路を別のリンク済みチャネルピアへ切り替えます。[チャネルのドッキング](/ja-JP/concepts/channel-docking)を参照してください。
- **`reset`**: 基本リセットポリシー。`daily` はローカル時刻の `atHour` にリセットし、`idle` は `idleMinutes` 後にリセットします。両方が設定されている場合、先に期限を迎えた方が適用されます。日次リセットの鮮度判定にはセッション行の `sessionStartedAt` を使用し、アイドルリセットの鮮度判定には `lastInteractionAt` を使用します。Heartbeat、Cron ウェイクアップ、exec 通知、Gateway の記録処理などのバックグラウンドイベントやシステムイベントによる書き込みは `updatedAt` を更新する場合がありますが、日次セッションやアイドルセッションの鮮度は維持しません。
- **`resetByType`**: タイプ別のオーバーライド（`direct`、`group`、`thread`）。従来の `dm` は `direct` のエイリアスとして使用できます。
- **`resetByChannel`**: プロバイダーまたはチャネル ID をキーとする、チャネル別のリセットオーバーライド。セッションのチャネルに一致するエントリがある場合、そのセッションでは `resetByType`/`reset` より無条件に優先されます。タイプ単位のポリシーとは異なるリセット動作が必要なチャネルが 1 つだけある場合に使用してください。
- **`mainKey`**: 従来のフィールド。ランタイムはメインのダイレクトチャット用バケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: エージェント間のやり取り中にエージェント同士が返信を返し合う最大ターン数（整数、範囲: `0`～`20`、デフォルト: `5`）。`0` にするとピンポン連鎖が無効になります。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、従来の `dm` エイリアスにも対応）、`keyPrefix`、または `rawKeyPrefix` で照合します。最初の拒否ルールが優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持期間の制御。
  - `mode`: `enforce` はクリーンアップを適用するデフォルト値です。`warn` は警告のみを出力します。
  - `pruneAfter`: 古いエントリを削除する経過時間のしきい値（デフォルト `30d`）。
  - `maxEntries`: SQLite セッションエントリの最大数（デフォルト `500`）。ランタイム書き込み時のバッチクリーンアップでは、実運用規模の上限に対して小さな高水位バッファーを使用します。`openclaw sessions cleanup --enforce` は上限を即座に適用します。
  - 短時間のみ使用される Gateway のモデル実行プローブセッションには固定の `24h` 保持期間が適用されますが、クリーンアップは負荷に応じて実行されます。セッションエントリのメンテナンスまたは上限による負荷が発生した場合にのみ、古くなった厳密なモデル実行プローブ行を削除します。対象となるのは、`agent:*:explicit:model-run-<uuid>` に一致する厳密で明示的なプローブキーのみです。通常のダイレクト、グループ、スレッド、Cron、フック、Heartbeat、ACP、およびサブエージェントのセッションには、この 24h の保持期間は適用されません。モデル実行のクリーンアップが実行される場合、より広範な `pruneAfter` による古いエントリのクリーンアップおよび `maxEntries` 上限の適用より先に実行されます。
  - `rotateBytes`: 非推奨であり、無視されます。`openclaw doctor --fix` は古い設定からこれを削除します。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter` です。無効にするには `false` を設定します。
  - `maxDiskBytes`: オプションのセッションディレクトリ用ディスク容量上限。`warn` モードでは警告をログに記録し、`enforce` モードでは古いアーティファクトやセッションから順に削除します。
  - `highWaterBytes`: 容量上限のクリーンアップ後に目標とするオプション値。デフォルトは `maxDiskBytes` の `80%` です。
- **`writeLock`**: セッショントランスクリプトの書き込みロック制御。正当なトランスクリプトの準備、クリーンアップ、Compaction、またはミラー処理がデフォルトポリシーより長く競合する場合にのみ調整してください。
  - `acquireTimeoutMs`: ロックの取得中、セッションをビジーと報告するまで待機するミリ秒数。デフォルト: `60000`、環境変数によるオーバーライド: `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`。
  - `staleMs`: 既存のロックを古いものとして扱い、回収するまでのミリ秒数。デフォルト: `1800000`、環境変数によるオーバーライド: `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`。
  - `maxHoldMs`: プロセス内で保持されているロックを、ウォッチドッグが解放するまで保持できるミリ秒数。デフォルト: `300000`、環境変数によるオーバーライド: `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。
- **`threadBindings`**: スレッドに紐づくセッション機能のグローバルデフォルト。
  - `enabled`: 全体のデフォルトスイッチ（プロバイダーによるオーバーライドが可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ状態によって自動的にフォーカスを解除するデフォルト時間（時間単位。`0` で無効。プロバイダーによるオーバーライドが可能）
  - `maxAgeHours`: デフォルトの厳格な最大有効期間（時間単位。`0` で無効。プロバイダーによるオーバーライドが可能）
  - `spawnSessions`: `sessions_spawn` および ACP スレッド生成から、スレッドに紐づく作業セッションを作成するためのデフォルトゲート。スレッドバインディングが有効な場合、デフォルトは `true` です。プロバイダーやアカウントによるオーバーライドが可能です。
  - `defaultSpawnContext`: スレッドに紐づく生成で使用する、ネイティブサブエージェントのデフォルトコンテキスト（`"fork"` または `"isolated"`）。デフォルトは `"fork"` です。

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
      debounceMs: 2000, // 0 で無効
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 返信の接頭辞

チャネル/アカウント別のオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順序（最も具体的なものが優先）: アカウント → チャネル → グローバル。`""` は無効化し、カスケードを停止します。`"auto"` は `[{identity.name}]` を生成します。

**テンプレート変数:**

| 変数              | 説明                     | 例                          |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | 短いモデル名             | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子       | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名           | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル         | `high`, `low`, `off`        |
| `{identity.name}` | エージェントの ID 名     | (`"auto"` と同じ)           |

変数では大文字と小文字が区別されません。`{think}` は `{thinkingLevel}` のエイリアスです。

### 確認リアクション

- デフォルトではアクティブなエージェントの `identity.emoji` を使用し、それがない場合は `"👀"` を使用します。無効にするには `""` を設定します。
- チャネル別のオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID のフォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`、または `off`/`none`（確認リアクションを完全に無効化）。
- `removeAckAfterReply`: Slack、Discord、Signal、Telegram、WhatsApp、iMessage など、リアクションに対応したチャネルで返信後に確認リアクションを削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Signal、Telegram、WhatsApp でライフサイクルステータスのリアクションを有効にします。
  Discord では、確認リアクションが有効な場合、未設定でもステータスリアクションが有効なままになります。
  Slack、Signal、Telegram、WhatsApp では、ライフサイクルステータスのリアクションを有効にするため、明示的に `true` を設定してください。
  Slack はデフォルトでネイティブのアシスタントスレッドステータスと切り替わる読み込みメッセージを進捗表示に使用し、設定された確認リアクションは固定されたままにします。
- `messages.statusReactions.emojis`: ライフサイクル絵文字のキーをオーバーライドします:
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft`、`stallHard`。
  Telegram では使用可能なリアクションが固定されているため、設定された未対応の絵文字は、そのチャットで対応している最も近いステータスのバリエーションにフォールバックします。

### キュー

- `mode`: セッション実行中に到着した受信メッセージのキュー戦略。デフォルト: `"steer"`。
  - `steer`: 新しいプロンプトをアクティブな実行に注入します。
  - `followup`: アクティブな実行が完了した後に新しいプロンプトを実行します。
  - `collect`: 互換性のあるメッセージをまとめ、後で一緒に実行します。
  - `interrupt`: 最新のプロンプトを開始する前にアクティブな実行を中止します。
- `debounceMs`: キューに入れたメッセージまたは誘導するメッセージをディスパッチするまでの遅延。デフォルト: `500`。
- `cap`: ドロップポリシーが適用されるまでのキュー内メッセージの最大数。デフォルト: `20`。
- `drop`: 上限を超えた場合の戦略。`"summarize"`（デフォルト）は最も古いエントリを削除しますが、簡潔な要約を保持します。`"old"` は要約を残さず最も古いエントリを削除します。`"new"` は最新の項目を拒否します。
- `byChannel`: プロバイダー ID をキーとする、チャネル別の `mode` オーバーライド。
- `debounceMsByChannel`: プロバイダー ID をキーとする、チャネル別の `debounceMs` オーバーライド。

### 受信デバウンス

同じ送信者から短時間に連続して届くテキストのみのメッセージを、エージェントの 1 ターンにまとめます。メディアや添付ファイルは即座にフラッシュされます。制御コマンドはデバウンスを迂回します。デフォルトの `debounceMs`: `2000`。

### その他のメッセージキー

- `messages.messagePrefix`: エージェントランタイムに到達する前に、受信したユーザーメッセージの先頭へ追加される接頭辞テキスト。チャネルコンテキストのマーカーとして控えめに使用してください。
- `messages.visibleReplies`: ダイレクト、グループ、およびチャネルでの会話における、ソースへの表示可能な返信を制御します（`"message_tool"` では表示可能な出力に `message(action=send)` が必要です。`"automatic"` は従来どおり通常の返信を投稿します）。
- `messages.usageTemplate` / `messages.responseUsage`: カスタムの `/usage` フッターテンプレートと、返信ごとのデフォルト使用量モード（`off | tokens | full`、および `tokens` の従来のエイリアス `on`）。
- `messages.groupChat.mentionPatterns` / `historyLimit`: グループメッセージのメンショントリガーと履歴ウィンドウのサイズ。
- `messages.suppressToolErrors`: `true` の場合、ユーザーに表示される `⚠️` ツールエラー警告を抑制します（エージェントは引き続きコンテキスト内でエラーを確認でき、再試行できます）。デフォルト: `false`。

### TTS（テキスト読み上げ）

```json5
{
  messages: {
    tts: {
      auto: "off", // off（デフォルト）| always | inbound | tagged
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

- `auto` はデフォルトの自動 TTS モードを制御します：`off`、`always`、`inbound`、`tagged`。`/tts on|off` でローカル設定を上書きでき、`/tts status` で有効な状態を確認できます。
- `summaryModel` は自動要約に使用する `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です（`enabled !== false`）。`modelOverrides.allowProvider` はオプトインです。
- API キーが設定されていない場合は、`ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` が使用されます。
- バンドルされた音声プロバイダーは Plugin が所有します。`plugins.allow` が設定されている場合は、使用する各 TTS プロバイダー Plugin を含めてください。たとえば、Edge TTS には `microsoft` を指定します。従来のプロバイダー ID `edge` は、`microsoft` のエイリアスとして受け付けられます。
- `providers.openai.baseUrl` は OpenAI TTS エンドポイントを上書きします。解決順序は、設定、`OPENAI_TTS_BASE_URL`、`https://api.openai.com/v1` の順です。
- `providers.openai.baseUrl` が OpenAI 以外のエンドポイントを指す場合、OpenClaw はそれを OpenAI 互換 TTS サーバーとして扱い、モデルと音声の検証を緩和します。

---

## Talk

Talk モード（macOS/iOS/Android およびブラウザー版 Control UI）のデフォルト設定。

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
      instructions: "温かみのある話し方で、回答は簡潔にしてください。",
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
- 従来のフラットな Talk キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性維持専用です。`openclaw doctor --fix` を実行して、永続化された設定を `talk.providers.<provider>` に書き換えてください。
- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします（macOS Talk クライアントの動作）。
- `providers.*.apiKey` は、プレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` のフォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk ディレクティブで分かりやすい名前を使用できます。
- `providers.mlx.modelId` は、macOS のローカル MLX ヘルパーが使用する Hugging Face リポジトリを選択します。省略した場合、macOS は `mlx-community/Soprano-80M-bf16` を使用します。
- macOS の MLX 再生は、同梱の `openclaw-mlx-tts` ヘルパーが存在する場合はそれを介して実行され、存在しない場合は `PATH` 上の実行可能ファイルを使用します。`OPENCLAW_MLX_TTS_BIN` は、開発用にヘルパーのパスを上書きします。
- `consultThinkingLevel` は、Control UI Talk のリアルタイム `openclaw_agent_consult` 呼び出しの背後で実行される OpenClaw エージェント全体の思考レベルを制御します。通常のセッション／モデルの動作を維持するには、未設定のままにしてください。
- `consultFastMode` は、セッションの通常の高速モード設定を変更せずに、Control UI Talk のリアルタイム相談に対する一度限りの高速モード上書きを設定します。
- `speechLocale` は、iOS/macOS Talk の音声認識で使用する BCP 47 ロケール ID を設定します。デバイスのデフォルトを使用するには、未設定のままにしてください。
- `silenceTimeoutMs` は、Talk モードがユーザーの無音を検出してからトランスクリプトを送信するまで待機する時間を制御します。未設定の場合、プラットフォームのデフォルトの一時停止時間（`700 ms on macOS and Android, 900 ms on iOS`）が維持されます。
- `realtime.instructions` は、プロバイダー向けのシステム指示を OpenClaw の組み込みリアルタイムプロンプトに追加します。これにより、デフォルトの `openclaw_agent_consult` ガイダンスを失うことなく音声スタイルを設定できます。
- `realtime.vadThreshold` は、プロバイダーの音声アクティビティしきい値を `0`（最高感度）から `1`（最低感度）までの範囲で設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.silenceDurationMs` は、プロバイダーがリアルタイムのユーザーターンを確定するまでの無音時間を正の整数で設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.prefixPaddingMs` は、音声の検出開始前に保持するオーディオ量を非負の整数で設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.reasoningEffort` は、リアルタイムセッションに対するプロバイダー固有の推論レベルを設定します。未設定の場合、プロバイダーのデフォルトが維持されます。
- `realtime.consultRouting`: `"provider-direct"`（デフォルト）は、リアルタイムプロバイダーが `openclaw_agent_consult` なしで最終的なユーザートランスクリプトを生成した場合に、プロバイダーからの直接応答を維持します。`"force-agent-consult"` は、代わりに確定したリクエストを OpenClaw 経由で処理します。

---

## 関連項目

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他のすべての設定キー
- [設定](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [設定例](/ja-JP/gateway/configuration-examples)
