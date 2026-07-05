---
read_when:
    - エージェントの既定値を調整する（モデル、思考、ワークスペース、Heartbeat、メディア、Skills）
    - マルチエージェントのルーティングとバインディングの設定
    - セッション、メッセージ配信、トークモード動作の調整
summary: エージェントのデフォルト、マルチエージェントルーティング、セッション、メッセージ、talk 設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-07-05T01:56:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 28ffd1dbee664b692993a1029732e6d6cc01031864a8784e5c1efb3bdc0a356d
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、`talk.*` 配下のエージェントスコープの設定キー。チャンネル、ツール、Gateway ランタイム、その他の
トップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: 設定されている場合は `OPENCLAW_WORKSPACE_DIR`、それ以外は `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明示的な `agents.defaults.workspace` 値は
`OPENCLAW_WORKSPACE_DIR` より優先されます。設定にそのパスを書き込みたくない場合に、デフォルトエージェントを
マウント済みワークスペースへ向けるには、環境変数を使用します。

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

- デフォルトで Skills を制限しない場合は、`agents.defaults.skills` を省略します。
- デフォルトを継承するには、`agents.list[].skills` を省略します。
- Skills なしにするには、`agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストは、そのエージェントの最終セットです。デフォルトとは
  マージされません。

### `agents.defaults.skipBootstrap`

ワークスペースブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

必須ブートストラップファイルは引き続き書き込みつつ、選択した任意のワークスペースファイルの作成をスキップします。有効な値: `SOUL.md`、`USER.md`、`HEARTBEAT.md`、`IDENTITY.md`。

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

ワークスペースブートストラップファイルをシステムプロンプトへ注入するタイミングを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（完了したアシスタント応答の後）ではワークスペースブートストラップの再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と Compaction 後のリトライでは、引き続きコンテキストを再構築します。
- `"never"`: すべてのターンでワークスペースブートストラップとコンテキストファイル注入を無効にします。これは、プロンプトライフサイクルを完全に所有するエージェント（カスタムコンテキストエンジン、独自コンテキストを構築するネイティブランタイム、またはブートストラップ不要の特殊なワークフロー）にのみ使用します。Heartbeat と Compaction 復旧ターンでも注入をスキップします。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

エージェントごとの上書き: `agents.list[].contextInjection`。省略された値は
`agents.defaults.contextInjection` を継承します。

### `agents.defaults.bootstrapMaxChars`

切り捨て前のワークスペースブートストラップファイルごとの最大文字数。デフォルト: `20000`。

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

ブートストラップコンテキストが切り捨てられた場合に、エージェントに見えるシステムプロンプト通知を制御します。
デフォルト: `"always"`。

- `"off"`: 切り捨て通知テキストをシステムプロンプトに一切注入しません。
- `"once"`: 一意の切り捨てシグネチャごとに、簡潔な通知を 1 回注入します。
- `"always"`: 切り捨てが存在する場合、実行のたびに簡潔な通知を注入します（推奨）。

詳細な raw/注入済み件数と設定チューニングフィールドは、コンテキスト/ステータスレポートやログなどの診断情報に残ります。通常の WebChat ユーザー/ランタイムコンテキストには、簡潔な復旧通知のみが渡されます。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### コンテキスト予算の所有権マップ

OpenClaw には複数の大容量プロンプト/コンテキスト予算があり、それらは
1 つの汎用ノブにすべて流すのではなく、サブシステムごとに意図的に分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常のワークスペースブートストラップ注入。
- `agents.defaults.startupContext.*`:
  1 回限りのリセット/起動モデル実行プレリュード。最近の日次
  `memory/*.md` ファイルを含みます。素のチャット `/new` および `/reset` コマンドは、
  モデルを呼び出さずに確認応答されます。
- `skills.limits.*`:
  システムプロンプトへ注入されるコンパクトな Skills リスト。
- `agents.defaults.contextLimits.*`:
  制限付きランタイム抜粋と、ランタイム所有の注入ブロック。
- `memory.qmd.limits.*`:
  インデックス付きメモリ検索スニペットと注入サイズ。

1 つのエージェントが異なる予算を必要とする場合にのみ、対応するエージェントごとの上書きを使用します。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

リセット/起動モデル実行時に注入される初回ターン起動プレリュードを制御します。
素のチャット `/new` および `/reset` コマンドはモデルを呼び出さずにリセットを確認応答するため、
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

- `memoryGetMaxChars`: 切り捨てメタデータと継続通知が追加される前の、デフォルトの `memory_get` 抜粋上限。
- `memoryGetDefaultLines`: `lines` が省略された場合のデフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果とオーバーフロー復旧に使用される高度なライブツール結果上限。モデルコンテキストの自動上限を使用するには未設定のままにします:
  100K トークン未満では `16000` 文字、100K+ トークンでは `32000` 文字、200K+ トークンでは `64000`
  文字です。長いコンテキストモデル向けに最大 `1000000` までの明示値が受け付けられますが、
  有効上限は引き続きモデルコンテキストウィンドウのおよそ 30% に制限されます。`openclaw doctor --deep` は有効上限を出力し、
  doctor は明示的な上書きが古い、または効果がない場合にのみ警告します。
- `postCompactionMaxChars`: Compaction 後の更新注入中に使用される AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブのエージェントごとの上書き。省略されたフィールドは
`agents.defaults.contextLimits` から継承されます。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
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

システムプロンプトへ注入されるコンパクトな Skills リストのグローバル上限。これは
必要に応じて `SKILL.md` ファイルを読む処理には影響しません。

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

Skills プロンプト予算のエージェントごとの上書き。

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

低い値は通常、スクリーンショットの多い実行でビジョントークン使用量とリクエストペイロードサイズを削減します。
高い値は、より多くの視覚的詳細を保持します。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ファイルパス、URL、メディア参照から読み込まれる画像に対する、画像ツールの圧縮/詳細設定。
デフォルト: `auto`。

OpenClaw は、選択された画像モデルに合わせてリサイズラダーを調整します。たとえば、Claude Opus 4.8、OpenAI GPT-5.5、Qwen VL、ホスト型 Llama 4 ビジョンモデルでは、古い/デフォルトの高詳細ビジョンパスより大きな画像を使用できます。一方、複数画像のターンでは、トークンとレイテンシのコストを抑えるために `auto` モードでより積極的に圧縮されます。

値:

- `auto`: モデル上限と画像数に適応します。
- `efficient`: トークンとバイト使用量を減らすため、小さめの画像を優先します。
- `balanced`: 標準的な中間ラダーを使用します。
- `high`: スクリーンショット、図、ドキュメント画像の詳細をより多く保持します。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
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
      maxConcurrent: 3,
    },
  },
}
```

- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - 文字列形式ではプライマリモデルのみを設定します。
  - オブジェクト形式ではプライマリに加えて、順序付きのフェイルオーバーモデルを設定します。
- `utilityModel`: 短い内部タスク用の任意の `provider/model` 参照またはエイリアスです。現在は、生成される Control UI セッションタイトル、Telegram DM トピックタイトル、Discord 自動スレッドタイトルに使われます。未設定の場合、これらのタスクはエージェントのプライマリモデルにフォールバックします。`agents.list[].utilityModel` はデフォルトを上書きし、操作固有のモデル上書きはその両方より優先されます。
  ユーティリティタスクは別個のモデル呼び出しを行い、タスク固有の内容を選択されたモデルプロバイダーに送信します。ダッシュボードのタイトル生成では、最初の非コマンドメッセージの先頭最大1,000文字を送信します。コストとデータ取り扱い要件に合うプロバイダーを選択してください。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - `image` ツールパスで、そのビジョンモデル設定として使われます。
  - 選択済みまたはデフォルトのモデルが画像入力を受け付けられない場合のフォールバックルーティングにも使われます。
  - 明示的な `provider/model` 参照を推奨します。互換性のために裸の ID も受け付けます。裸の ID が `models.providers.*.models` 内の設定済み画像対応エントリと一意に一致する場合、OpenClaw はそれをそのプロバイダーに修飾します。設定済みの一致が曖昧な場合は、明示的なプロバイダープレフィックスが必要です。
- `imageGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - 共有画像生成機能、および画像を生成する将来のツール/Plugin サーフェスで使われます。
  - 代表的な値: Gemini ネイティブ画像生成用の `google/gemini-3.1-flash-image-preview`、fal 用の `fal/fal-ai/flux/dev`、OpenAI Images 用の `openai/gpt-image-2`、または透明背景の OpenAI PNG/WebP 出力用の `openai/gpt-image-1.5`。
  - プロバイダー/モデルを直接選択する場合は、対応するプロバイダー認証も設定してください（例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` / `openai/gpt-image-1.5` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み画像生成プロバイダーを provider-id 順に試します。
- `musicGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - 共有音楽生成機能、および組み込みの `music_generate` ツールで使われます。
  - 代表的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み音楽生成プロバイダーを provider-id 順に試します。
  - プロバイダー/モデルを直接選択する場合は、対応するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - 共有動画生成機能、および組み込みの `video_generate` ツールで使われます。
  - 代表的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証に裏付けられたプロバイダーデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み動画生成プロバイダーを provider-id 順に試します。
  - プロバイダー/モデルを直接選択する場合は、対応するプロバイダー認証/API キーも設定してください。
  - 公式 Qwen 動画生成 Plugin は、最大1本の出力動画、1枚の入力画像、4本の入力動画、10秒の長さ、およびプロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) のいずれかを受け付けます。
  - `pdf` ツールのモデルルーティングで使われます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルト PDF サイズ上限です。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮されるデフォルト最大ページ数です。
- `verboseDefault`: エージェントのデフォルト詳細レベルです。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `toolProgressDetail`: `/verbose` ツール要約および進行中ドラフトのツール行の詳細モードです。値: `"explain"`（デフォルト、コンパクトな人間向けラベル）または `"raw"`（利用可能な場合は生のコマンド/詳細を追加）。エージェントごとの `agents.list[].toolProgressDetail` はこのデフォルトを上書きします。
- `reasoningDefault`: エージェントのデフォルト reasoning 表示です。値: `"off"`、`"on"`、`"stream"`。エージェントごとの `agents.list[].reasoningDefault` はこのデフォルトを上書きします。設定済みの reasoning デフォルトは、メッセージ単位またはセッションの reasoning 上書きが設定されていない場合に限り、所有者、承認済み送信者、または operator-admin Gateway コンテキストにのみ適用されます。
- `elevatedDefault`: エージェントのデフォルト elevated-output レベルです。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: OpenAI API キーまたは Codex OAuth アクセス用の `openai/gpt-5.5`）。プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に対して一意に一致する設定済みプロバイダーを試し、その後でのみ設定済みデフォルトプロバイダーにフォールバックします（非推奨の互換動作のため、明示的な `provider/model` を推奨します）。そのプロバイダーが設定済みのデフォルトモデルをすでに公開していない場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表面化する代わりに、最初に設定されたプロバイダー/モデルにフォールバックします。
- `models`: `/model` 用の設定済みモデルカタログおよび許可リストです。各エントリには `alias`（ショートカット）と `params`（プロバイダー固有、例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` ルーティング、`chat_template_kwargs`、`extra_body`/`extraBody`）を含められます。
  - `"openai/*": {}` や `"vllm/*": {}` などの `provider/*` エントリを使うと、すべてのモデル ID を手動で列挙せずに、選択したプロバイダーで検出されたすべてのモデルを表示できます。
  - そのプロバイダーで動的に検出されるすべてのモデルに同じランタイムを使わせる場合は、`provider/*` エントリに `agentRuntime` を追加します。正確な `provider/model` ランタイムポリシーは、引き続きワイルドカードより優先されます。
  - 安全な編集: エントリを追加するには `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使います。`config set` は、`--replace` を渡さない限り、既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダー範囲の configure/オンボーディングフローは、選択したプロバイダーモデルをこのマップにマージし、すでに設定済みの無関係なプロバイダーを保持します。
  - 直接の OpenAI Responses モデルでは、サーバー側 Compaction が自動的に有効化されます。`context_management` の注入を止めるには `params.responsesServerCompaction: false` を使い、しきい値を上書きするには `params.responsesCompactThreshold` を使います。[OpenAI server-side compaction](/ja-JP/providers/openai#server-side-compaction-responses-api) を参照してください。
- `params`: すべてのモデルに適用されるグローバルデフォルトのプロバイダーパラメーターです。`agents.defaults.params` で設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）は `agents.defaults.models["provider/model"].params`（モデルごと）で上書きされ、その後 `agents.list[].params`（一致するエージェント ID）がキー単位で上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `models.providers.openrouter.params.provider`: OpenRouter 全体のデフォルトプロバイダールーティングポリシーです。OpenClaw はこれを OpenRouter のリクエスト `provider` オブジェクトに転送します。モデルごとの `agents.defaults.models["openrouter/<model>"].params.provider` とエージェントパラメーターはキー単位で上書きします。[OpenRouter provider routing](/ja-JP/providers/openrouter#advanced-configuration) を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシ向けの `api: "openai-completions"` リクエスト本文にマージされる、高度なパススルー JSON です。生成されたリクエストキーと衝突した場合は、追加本文が優先されます。非ネイティブ completions ルートでは、その後も OpenAI 専用の `store` が除去されます。
- `params.chat_template_kwargs`: トップレベルの `api: "openai-completions"` リクエスト本文にマージされる、vLLM/OpenAI 互換の chat-template 引数です。thinking がオフの `vllm/nemotron-3-*` では、同梱 vLLM Plugin が `enable_thinking: false` と `force_nonempty_content: true` を自動送信します。明示的な `chat_template_kwargs` は生成されたデフォルトを上書きし、`extra_body.chat_template_kwargs` は引き続き最終的に優先されます。設定済みの vLLM Qwen および Nemotron thinking モデルは、複数段階の effort ラダーの代わりに、二値の `/think` 選択肢（`off`、`on`）を公開します。
- `compat.thinkingFormat`: OpenAI 互換 thinking ペイロードスタイルです。Together 形式の `reasoning.enabled` には `"together"`、Qwen 形式のトップレベル `enable_thinking` には `"qwen"`、vLLM などリクエストレベルの chat-template kwargs をサポートする Qwen 系バックエンドでの `chat_template_kwargs.enable_thinking` には `"qwen-chat-template"` を使います。OpenClaw は thinking 無効を `false` に、有効を `true` にマップし、設定済みの vLLM Qwen モデルはこれらの形式に対して二値の `/think` 選択肢を公開します。
- `compat.supportedReasoningEfforts`: モデルごとの OpenAI 互換 reasoning effort リストです。実際に `"xhigh"` を受け付けるカスタムエンドポイントには `"xhigh"` を含めてください。すると OpenClaw は、その設定済みプロバイダー/モデルに対して、コマンドメニュー、Gateway セッション行、セッションパッチ検証、エージェント CLI 検証、`llm-task` 検証で `/think xhigh` を公開します。バックエンドが標準レベルに対してプロバイダー固有の値を求める場合は、`compat.reasoningEffortMap` を使います。
- `params.preserveThinking`: thinking の保持に対する Z.AI 専用のオプトインです。有効で thinking がオンの場合、OpenClaw は `thinking.clear_thinking: false` を送信し、以前の `reasoning_content` を再生します。[Z.AI thinking and preserved thinking](/ja-JP/providers/zai#thinking-and-preserved-thinking) を参照してください。
- `localService`: ローカル/セルフホストモデルサーバー用の任意のプロバイダーレベルプロセスマネージャーです。選択されたモデルがそのプロバイダーに属する場合、OpenClaw は `healthUrl`（または `baseUrl + "/models"`）をプローブし、エンドポイントが停止していれば `command` を `args` 付きで起動し、最大 `readyTimeoutMs` まで待機してからモデルリクエストを送信します。`command` は絶対パスである必要があります。`idleStopMs: 0` は OpenClaw が終了するまでプロセスを稼働させ続けます。正の値は、そのミリ秒数だけアイドル状態が続いた後、OpenClaw が起動したプロセスを停止します。[Local model services](/ja-JP/gateway/local-model-services) を参照してください。
- ランタイムポリシーは `agents.defaults` ではなく、プロバイダーまたはモデルに属します。プロバイダー全体のルールには `models.providers.<provider>.agentRuntime` を使い、モデル固有のルールには `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` を使います。公式 OpenAI プロバイダー上の OpenAI エージェントモデルは、デフォルトで Codex を選択します。
- これらのフィールドを変更する設定ライター（例: `/models set`、`/models set-image`、フォールバックの追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な場合は既存のフォールバックリストを保持します。
- `maxConcurrent`: セッション間での最大並列エージェント実行数（各セッション自体は引き続き直列化されます）。デフォルト: 4。

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

- `id`: `"auto"`、`"openclaw"`、登録済み Plugin ハーネス ID、またはサポートされている CLI バックエンドエイリアス。バンドルされた Codex Plugin は `codex` を登録します。バンドルされた Anthropic Plugin は `claude-cli` CLI バックエンドを提供します。
- `id: "auto"` は、登録済み Plugin ハーネスがサポート対象のターンを要求できるようにし、どのハーネスにも一致しない場合は OpenClaw を使用します。`id: "codex"` のような明示的な Plugin ランタイムはそのハーネスを必須とし、利用できない場合や失敗した場合はフェイルクローズします。
- `id: "pi"` は、v2026.5.22 以前から出荷済みの設定を保持するため、`openclaw` の非推奨エイリアスとしてのみ受け付けられます。新しい設定では `openclaw` を使用してください。
- ランタイムの優先順位は、まず厳密なモデルポリシー（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]`、または `models.providers.<provider>.models[]`）、次に `agents.list[]` / `agents.defaults.models["provider/*"]`、最後に `models.providers.<provider>.agentRuntime` のプロバイダー全体のポリシーです。
- エージェント全体のランタイムキーはレガシーです。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、セッションランタイムの固定、`OPENCLAW_AGENT_RUNTIME` はランタイム選択では無視されます。古い値を削除するには `openclaw doctor --fix` を実行してください。
- OpenAI エージェントモデルはデフォルトで Codex ハーネスを使用します。明示したい場合は、provider/model の `agentRuntime.id: "codex"` は引き続き有効です。
- Claude CLI デプロイでは、`model: "anthropic/claude-opus-4-8"` とモデルスコープの `agentRuntime.id: "claude-cli"` を推奨します。レガシーな `claude-cli/claude-opus-4-7` モデル参照は互換性のため引き続き動作しますが、新しい設定では provider/model 選択を正規のままにし、実行バックエンドは provider/model ランタイムポリシーに置いてください。
- これはテキストのエージェントターン実行のみを制御します。メディア生成、ビジョン、PDF、音楽、動画、TTS は引き続きそれぞれの provider/model 設定を使用します。

**組み込みエイリアス短縮形**（モデルが `agents.defaults.models` にある場合にのみ適用されます）:

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

設定済みのエイリアスは常にデフォルトより優先されます。

Z.AI GLM-4.x モデルは、`--thinking off` を設定するか `agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的に思考モードを有効にします。
Z.AI モデルは、ツール呼び出しストリーミングのためにデフォルトで `tool_stream` を有効にします。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude Opus 4.8 は OpenClaw ではデフォルトで思考をオフのままにします。適応型思考が明示的に有効化されている場合、Anthropic のプロバイダー所有の effort デフォルトは `high` です。Claude 4.6 モデルは、明示的な思考レベルが設定されていない場合、デフォルトで `adaptive` になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用の任意の CLI バックエンド（ツール呼び出しなし）。API プロバイダーが失敗した場合のバックアップとして有用です。

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

- CLI バックエンドはテキスト優先です。ツールは常に無効です。
- `sessionArg` が設定されている場合、セッションがサポートされます。
- `imageArg` がファイルパスを受け付ける場合、画像のパススルーがサポートされます。
- `reseedFromRawTranscriptWhenUncompacted: true` により、バックエンドは最初の Compaction 要約が存在する前に、境界付きの生の OpenClaw トランスクリプト末尾から、安全に無効化されたセッションを回復できます。認証プロファイルまたは資格情報エポックの変更では、生の再シードは引き続き一切行われません。

### `agents.defaults.promptOverlays`

OpenClaw が組み立てたプロンプト面に、モデルファミリーごとに適用されるプロバイダー非依存のプロンプトオーバーレイ。GPT-5 ファミリーのモデル ID は、OpenClaw/プロバイダールート全体で共有の動作契約を受け取ります。`personality` は親しみやすい対話スタイル層のみを制御します。ネイティブ Codex app-server ルートは、この OpenClaw GPT-5 オーバーレイの代わりに Codex 所有のベース/モデル指示を保持し、OpenClaw はネイティブスレッドでは Codex の組み込み personality を無効にします。

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
- レガシーな `plugins.entries.openai.config.personality` は、この共有設定が未設定の場合に引き続き読み取られます。

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
- `timeoutSeconds`: Heartbeat エージェントターンが中止されるまでに許可される最大時間（秒）。未設定の場合、設定されていれば `agents.defaults.timeoutSeconds` を使用し、それ以外は Heartbeat 間隔を上限 600 秒にした値を使用します。
- `directPolicy`: ダイレクト/DM 配信ポリシー。`allow`（デフォルト）は直接ターゲット配信を許可します。`block` は直接ターゲット配信を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat 実行は軽量ブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は以前の会話履歴のない新しいセッションで実行されます。cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat ごとのトークンコストを約 100K から約 2-5K トークンに削減します。
- `skipWhenBusy`: true の場合、Heartbeat 実行は、そのエージェントの追加のビジーなレーン、つまり自身のセッションキー付きサブエージェントまたはネストされたコマンド作業があると延期されます。Cron レーンは、このフラグがなくても常に Heartbeat を延期します。
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
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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

- `mode`: `default` または `safeguard`（長い履歴向けのチャンク化された要約）。[Compaction](/ja-JP/concepts/compaction) を参照。
- `provider`: 登録済みの Compaction プロバイダープラグインの id。設定すると、組み込みの LLM 要約の代わりにプロバイダーの `summarize()` が呼び出されます。失敗時は組み込みにフォールバックします。プロバイダーを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照。
- `timeoutSeconds`: OpenClaw が単一の Compaction 操作を中止するまでに許可する最大秒数。デフォルト: `180`。
- `keepRecentTokens`: 最新のトランスクリプト末尾をそのまま保持するためのエージェントのカットポイント予算。手動の `/compact` は明示的に設定されている場合これを尊重します。それ以外の場合、手動 Compaction はハードチェックポイントです。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は Compaction 要約時に、組み込みの不透明識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使われる、省略可能なカスタム識別子保持テキスト。
- `qualityGuard`: safeguard 要約に対する、不正な形式の出力時の再試行チェック。safeguard モードではデフォルトで有効です。監査をスキップするには `enabled: false` を設定します。
- `midTurnPrecheck`: 省略可能なツールループ負荷チェック。`enabled: true` の場合、OpenClaw はツール結果が追加された後、次のモデル呼び出しの前にコンテキスト負荷をチェックします。コンテキストが収まらなくなっている場合、プロンプトを送信する前に現在の試行を中止し、既存の事前チェック復旧パスを再利用してツール結果を切り詰めるか、Compaction して再試行します。`default` と `safeguard` の両方の Compaction モードで動作します。デフォルト: 無効。
- `postCompactionSections`: Compaction 後に再注入する、省略可能な AGENTS.md H2/H3 セクション名。未設定または `[]` に設定されている場合、再注入は無効です。`["Session Startup", "Red Lines"]` を明示的に設定すると、そのペアが有効になり、従来の `Every Session`/`Safety` フォールバックが保持されます。追加コンテキストが、Compaction 要約にすでに取り込まれているプロジェクトガイダンスを重複させるリスクに見合う場合にのみ有効化してください。
- `model`: Compaction 要約専用の、省略可能な `provider/model-id` または `agents.defaults.models` のベアエイリアス。ベアエイリアスはディスパッチ前に解決されます。衝突時は、設定されたリテラルモデル ID が優先されます。メインセッションではあるモデルを維持しつつ、Compaction 要約は別のモデルで実行したい場合に使用します。未設定の場合、Compaction はセッションのプライマリモデルを使用します。
- `maxActiveTranscriptBytes`: アクティブな JSONL がしきい値を超えたとき、実行前に通常のローカル Compaction をトリガーする、省略可能なバイトしきい値（`number` または `"20mb"` のような文字列）。Compaction 成功後に、より小さな後続トランスクリプトへローテーションできるようにするため、`truncateAfterCompaction` が必要です。未設定または `0` の場合は無効です。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時に短い通知をユーザーへ送信します（例: 「コンテキストを Compaction 中...」「Compaction 完了」）。Compaction をサイレントに保つため、デフォルトでは無効です。
- `memoryFlush`: 永続メモリを保存するために、自動 Compaction の前に行われるサイレントなエージェントターン。このハウスキーピングターンをローカルモデルに留めたい場合は、`model` を `ollama/qwen3:8b` のような正確なプロバイダー/モデルに設定します。この上書きは、アクティブセッションのフォールバックチェーンを継承しません。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.runRetries`

失敗復旧中の無限実行ループを防ぐための、組み込みエージェントランタイムの外側の実行ループ再試行反復境界。この設定は現在、組み込みエージェントランタイムにのみ適用され、ACP や CLI ランタイムには適用されないことに注意してください。

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

- `base`: 外側の実行ループの実行再試行反復の基本数。デフォルト: `24`。
- `perProfile`: フォールバックプロファイル候補ごとに付与される追加の実行再試行反復。デフォルト: `8`。
- `min`: 実行再試行反復の絶対最小上限。デフォルト: `32`。
- `max`: 暴走実行を防ぐための、実行再試行反復の絶対最大上限。デフォルト: `160`。

### `agents.defaults.contextPruning`

LLM に送信する前に、インメモリコンテキストから**古いツール結果**を刈り込みます。ディスク上のセッション履歴は変更**しません**。

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

- `mode: "cache-ttl"` は刈り込みパスを有効にします。
- `ttl` は、刈り込みを再度実行できる頻度を制御します（最後のキャッシュ接触後）。
- 刈り込みはまず過大なツール結果をソフトトリムし、その後必要に応じて古いツール結果をハードクリアします。
- `softTrimRatio` と `hardClearRatio` は `0.0` から `1.0` までの値を受け付けます。設定検証はその範囲外の値を拒否します。

**ソフトトリム**は先頭 + 末尾を保持し、中央に `...` を挿入します。

**ハードクリア**はツール結果全体をプレースホルダーに置き換えます。

注記:

- 画像ブロックはトリムまたはクリアされません。
- 比率は文字ベース（概算）であり、正確なトークン数ではありません。
- `keepLastAssistants` より少ないアシスタントメッセージしか存在しない場合、刈り込みはスキップされます。

</Accordion>

動作の詳細については、[セッション刈り込み](/ja-JP/concepts/session-pruning) を参照してください。

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

- Telegram 以外のチャンネルでブロック返信を有効にするには、明示的な `*.blockStreaming: true` が必要です。
- チャンネル上書き: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダム化された一時停止。`natural` = 800〜2500ms。エージェントごとの上書き: `agents.list[].humanDelay`。

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

[入力中インジケーター](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

組み込みエージェント向けの省略可能なサンドボックス化。完全なガイドについては、[サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。

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
- `workspaceRoot`: スコープごとのワークスペースに使用される絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が実行時に一時ファイルへ実体化するインライン内容または SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH ホストキー ポリシーの調整項目

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先されます
- `certificateData` は `certificateFile` より優先されます
- `knownHostsData` は `knownHostsFile` より優先されます
- SecretRef ベースの `*Data` 値は、サンドボックスセッション開始前に、アクティブな secrets ランタイムスナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成後に、リモートワークスペースを一度シードします
- その後、リモート SSH ワークスペースを正準として維持します
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングします
- リモートの変更をホストへ自動同期しません
- サンドボックスブラウザーコンテナをサポートしません

**ワークスペースアクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのサンドボックスワークスペース
- `ro`: `/workspace` にあるサンドボックスワークスペース、`/agent` に読み取り専用でマウントされたエージェントワークスペース
- `rw`: `/workspace` に読み書き可能でマウントされたエージェントワークスペース

**スコープ:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース（デフォルト）
- `shared`: 共有コンテナとワークスペース（セッション間の分離なし）

**OpenShell プラグイン設定:**

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

- `mirror`: 実行前にローカルからリモートへシードし、実行後に同期して戻す。ローカルワークスペースが正準のままになる
- `remote`: サンドボックス作成時に一度だけリモートへシードし、その後はリモートワークスペースを正準として維持する

`remote` モードでは、シード手順の後に OpenClaw の外で行われたホストローカルの編集は、サンドボックスへ自動的に同期されません。
トランスポートは OpenShell サンドボックスへの SSH ですが、サンドボックスのライフサイクルと任意のミラー同期は Plugin が所有します。

**`setupCommand`** はコンテナ作成後に一度だけ実行されます（`sh -lc` 経由）。ネットワークへの送信、書き込み可能な root、root ユーザーが必要です。

**コンテナの既定値は `network: "none"`** です。エージェントに外向きアクセスが必要な場合は `"bridge"`（またはカスタムブリッジネットワーク）に設定します。
`"host"` はブロックされます。`"container:<id>"` は、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急時の例外）を設定しない限り、既定でブロックされます。
アクティブな OpenClaw サンドボックス内の Codex アプリサーバーターンは、ネイティブコードモードのネットワークアクセスに同じ送信設定を使用します。

**受信添付ファイル** は、アクティブなワークスペース内の `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルバインドとエージェントごとのバインドはマージされます。

**サンドボックス化されたブラウザー**（`sandbox.browser.enabled`）: コンテナ内の Chromium + CDP。noVNC URL がシステムプロンプトに挿入されます。`openclaw.json` の `browser.enabled` は不要です。
noVNC のオブザーバーアクセスは既定で VNC 認証を使用し、OpenClaw は共有 URL でパスワードを公開する代わりに、短命のトークン URL を発行します。

- `allowHostControl: false`（既定）は、サンドボックス化されたセッションがホストブラウザーを対象にすることをブロックします。
- `network` の既定値は `openclaw-sandbox-browser`（専用ブリッジネットワーク）です。グローバルブリッジ接続を明示的に必要とする場合にのみ `bridge` に設定します。
- `cdpSourceRange` は、コンテナ境界での CDP 受信を任意で CIDR 範囲（例: `172.21.0.1/32`）に制限します。
- `sandbox.browser.binds` は、サンドボックスブラウザーコンテナにのみ追加のホストディレクトリをマウントします。設定した場合（`[]` を含む）、ブラウザーコンテナでは `docker.binds` を置き換えます。
- 起動時の既定値は `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナホスト向けに調整されています:
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
  - `--disable-3d-apis`、`--disable-software-rasterizer`、および `--disable-gpu` は
    既定で有効で、WebGL/3D の使用に必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効にできます。
  - ワークフローが拡張機能に依存する場合、`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で拡張機能を再有効化します。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    既定のプロセス制限を使用するには `0` を設定します。
  - さらに、`noSandbox` が有効な場合は `--no-sandbox`。
  - 既定値はコンテナイメージのベースラインです。コンテナの既定値を変更するには、カスタム
    エントリポイントを持つカスタムブラウザーイメージを使用します。

</Accordion>

ブラウザーのサンドボックス化と `sandbox.docker.binds` は Docker 専用です。

イメージをビルドします（ソースチェックアウトから）:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

ソースチェックアウトなしの npm インストールについては、インラインの `docker build` コマンドは [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) を参照してください。

### `agents.list`（エージェントごとの上書き）

`agents.list[].tts` を使用して、エージェントに独自の TTS プロバイダー、音声、モデル、
スタイル、または自動 TTS モードを与えます。エージェントブロックはグローバルな
`messages.tts` にディープマージされるため、共有資格情報を 1 か所に保持しつつ、個々の
エージェントは必要な音声またはプロバイダーフィールドだけを上書きできます。アクティブなエージェントの
上書きは、自動音声返信、`/tts audio`、`/tts status`、および
`tts` エージェントツールに適用されます。プロバイダー例と優先順位については [テキスト読み上げ](/ja-JP/tools/tts#per-agent-voice-overrides)
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
- `default`: 複数設定された場合は最初が優先されます（警告がログに記録されます）。設定がない場合、リストの最初のエントリが既定です。
- `model`: 文字列形式はモデルフォールバックなしの厳密なエージェントごとのプライマリを設定します。オブジェクト形式 `{ primary }` も、`fallbacks` を追加しない限り厳密です。`{ primary, fallbacks: [...] }` を使用してそのエージェントをフォールバックにオプトインするか、`{ primary, fallbacks: [] }` を使用して厳密な動作を明示します。`primary` だけを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、引き続き既定のフォールバックを継承します。
- `utilityModel`: 生成されるセッションやスレッドのタイトルなど、短い内部タスク用の任意のエージェントごとの上書き。`agents.defaults.utilityModel`、次にこのエージェントのプライマリモデルへフォールバックします。
- `params`: `agents.defaults.models` で選択されたモデルエントリにマージされる、エージェントごとのストリームパラメーター。モデルカタログ全体を重複させずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有の上書きに使用します。
- `tts`: 任意のエージェントごとのテキスト読み上げ上書き。このブロックは `messages.tts` にディープマージされるため、共有プロバイダー資格情報とフォールバックポリシーは `messages.tts` に保持し、プロバイダー、音声、モデル、スタイル、自動モードなど、ペルソナ固有の値だけをここに設定します。
- `skills`: 任意のエージェントごとの Skills 許可リスト。省略した場合、設定されていればエージェントは `agents.defaults.skills` を継承します。明示的なリストはマージではなく既定値を置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェントごとの既定の思考レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージごとまたはセッションごとの上書きが設定されていない場合、このエージェントの `agents.defaults.thinkingDefault` を上書きします。選択されたプロバイダー/モデルプロファイルが有効な値を制御します。Google Gemini では、`adaptive` はプロバイダー所有の動的思考を維持します（Gemini 3/3.1 では `thinkingLevel` を省略、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 任意のエージェントごとの既定の推論可視性（`on | off | stream`）。メッセージごとまたはセッションごとの推論上書きが設定されていない場合、このエージェントの `agents.defaults.reasoningDefault` を上書きします。
- `fastModeDefault`: 高速モードの任意のエージェントごとの既定値（`"auto" | true | false`）。メッセージごとまたはセッションごとの高速モード上書きが設定されていない場合に適用されます。
- `models`: 完全な `provider/model` ID をキーにした、任意のエージェントごとのモデルカタログ/ランタイム上書き。エージェントごとのランタイム例外には `models["provider/model"].agentRuntime` を使用します。
- `runtime`: 任意のエージェントごとのランタイム記述子。エージェントが ACP ハーネスセッションを既定にする必要がある場合は、`runtime.acp` の既定値（`agent`、`backend`、`mode`、`cwd`）とともに `type: "acp"` を使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- ローカルのワークスペース相対 `identity.avatar` 画像ファイルは 2 MB に制限されます。`http(s)` URL と `data:` URI はローカルファイルサイズ制限ではチェックされません。
- `identity` は既定値を導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: 明示的な `sessions_spawn.agentId` ターゲットに対する、設定済みエージェント ID の許可リスト（`["*"]` = 任意の設定済みターゲット、既定: 同じエージェントのみ）。自己ターゲットの `agentId` 呼び出しを許可する必要がある場合は、リクエスター ID を含めます。エージェント設定が削除された古いエントリは `sessions_spawn` によって拒否され、`agents_list` から省略されます。クリーンアップするには `openclaw doctor --fix` を実行するか、そのターゲットが既定値を継承しながら生成可能なままであるべき場合は、最小限の `agents.list[]` エントリを追加します。
- サンドボックス継承ガード: リクエスターセッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制します。既定: false）。

---

## マルチエージェントルーティング

1 つの Gateway 内で複数の分離されたエージェントを実行します。[マルチエージェント](/ja-JP/concepts/multi-agent) を参照してください。

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

### バインド一致フィールド

- `type`（任意）: 通常のルーティングには `route`（type 未指定の場合は route が既定）、永続 ACP 会話バインドには `acp`。
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のアカウント、省略 = 既定のアカウント）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。チャネル固有）
- `acp`（任意。`type: "acp"` の場合のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致、peer/guild/team なし）
5. `match.accountId: "*"`（チャネル全体）
6. 既定のエージェント

各階層内では、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリについては、OpenClaw は正確な会話 ID（`match.channel` + アカウント + `match.peer.id`）で解決し、上記のルートバインド階層順序は使用しません。

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
      mode: "enforce", // enforce (default) | warn
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
  - `global`: チャネルコンテキスト内のすべての参加者が単一セッションを共有します（共有コンテキストを意図している場合にのみ使用）。
- **`dmScope`**: DM のグループ化方法。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャネル + 送信者ごとに分離します（マルチユーザー受信箱に推奨）。
  - `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します（マルチアカウントに推奨）。
- **`identityLinks`**: クロスチャネルのセッション共有のため、正規 ID をプロバイダー接頭辞付きのピアにマッピングします。`/dock_discord` などの Dock コマンドは、同じマップを使ってアクティブセッションの返信経路を別のリンク済みチャネルピアへ切り替えます。[チャネルドッキング](/ja-JP/concepts/channel-docking)を参照してください。
- **`reset`**: 主要なリセットポリシー。`daily` はローカル時刻の `atHour` にリセットします。`idle` は `idleMinutes` 後にリセットします。両方が設定されている場合は、先に期限切れになった方が優先されます。日次リセットの鮮度はセッション行の `sessionStartedAt` を使用します。アイドルリセットの鮮度は `lastInteractionAt` を使用します。Heartbeat、Cron のウェイクアップ、exec 通知、Gateway の記録管理などのバックグラウンド/システムイベント書き込みは `updatedAt` を更新することがありますが、日次/アイドルセッションの鮮度は維持しません。
- **`resetByType`**: タイプ別のオーバーライド（`direct`、`group`、`thread`）。レガシーの `dm` は `direct` のエイリアスとして受け入れられます。
- **`mainKey`**: レガシーフィールド。ランタイムはメインの直接チャットバケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: エージェント間のやり取り中に許可されるエージェント間の返信往復ターンの最大数（整数、範囲: `0`-`20`、デフォルト: `5`）。`0` はピンポン連鎖を無効にします。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、レガシーの `dm` エイリアスあり）、`keyPrefix`、または `rawKeyPrefix` で照合します。最初の deny が優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `enforce` はクリーンアップを適用し、デフォルトです。`warn` は警告のみを出力します。
  - `pruneAfter`: 古いエントリの経過時間カットオフ（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内のエントリ最大数（デフォルト `500`）。ランタイムは本番サイズの上限に対して小さな高水位バッファ付きでバッチクリーンアップを書き込みます。`openclaw sessions cleanup --enforce` は上限を即時適用します。
  - 短命な Gateway model-run プローブセッションは固定の `24h` 保持を使用しますが、クリーンアップは負荷しきい値付きです。つまり、セッションエントリのメンテナンス/上限の圧力に達した場合にのみ、古い strict model-run プローブ行を削除します。`agent:*:explicit:model-run-<uuid>` に一致する strict explicit プローブキーのみが対象です。通常の direct、group、thread、Cron、hook、Heartbeat、ACP、サブエージェントセッションは、この 24h 保持を継承しません。model-run クリーンアップが実行される場合、より広範な `pruneAfter` の古いエントリクリーンアップと `maxEntries` 上限の前に実行されます。
  - `rotateBytes`: 非推奨で無視されます。`openclaw doctor --fix` は古い設定からこれを削除します。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter` です。無効にするには `false` を設定します。
  - `maxDiskBytes`: 任意のセッションディレクトリのディスク予算。`warn` モードでは警告をログに記録します。`enforce` モードでは最も古いアーティファクト/セッションから削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッドに紐づくセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ（プロバイダーはオーバーライド可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時に自動でフォーカス解除するデフォルト時間（`0` は無効。プロバイダーはオーバーライド可能）
  - `maxAgeHours`: デフォルトの厳密な最大経過時間（`0` は無効。プロバイダーはオーバーライド可能）
  - `spawnSessions`: `sessions_spawn` と ACP スレッドスポーンからスレッドに紐づく作業セッションを作成するためのデフォルトゲート。スレッドバインディングが有効な場合、デフォルトは `true` です。プロバイダー/アカウントはオーバーライド可能です。
  - `defaultSpawnContext`: スレッドに紐づくスポーンのデフォルトのネイティブサブエージェントコンテキスト（`"fork"` または `"isolated"`）。デフォルトは `"fork"` です。

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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

解決順序（最も具体的なものが優先）: アカウント → チャネル → グローバル。`""` は無効化し、カスケードを停止します。`"auto"` は `[{identity.name}]` から派生します。

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

- デフォルトはアクティブエージェントの `identity.emoji`、それ以外は `"👀"` です。無効にするには `""` を設定します。
- チャネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Signal、Telegram、WhatsApp、iMessage など、リアクション対応チャネルで返信後に ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Signal、Telegram、WhatsApp でライフサイクルステータスリアクションを有効にします。
  Slack と Discord では、未設定の場合、ack リアクションがアクティブなときにステータスリアクションが有効なままになります。
  Signal、Telegram、WhatsApp では、ライフサイクルステータスリアクションを有効にするには明示的に `true` に設定します。
- `messages.statusReactions.emojis`: ライフサイクル絵文字キーをオーバーライドします:
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft`、`stallHard`。
  Telegram は固定されたリアクションセットのみを許可するため、設定された未対応の絵文字は
  そのチャットで最も近い対応済みステータスバリアントにフォールバックします。

### 受信デバウンス

同じ送信者からの短時間のテキストのみのメッセージを、単一のエージェントターンにまとめます。メディア/添付ファイルは即時にフラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS（テキスト読み上げ）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定を上書きでき、`/tts status` は有効な状態を表示します。
- `summaryModel` は自動要約用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false` です (オプトイン)。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` と `OPENAI_API_KEY` にフォールバックします。
- バンドルされた音声プロバイダーは Plugin が所有します。`plugins.allow` が設定されている場合は、使用したい各 TTS プロバイダー Plugin を含めます。たとえば Edge TTS には `microsoft` を指定します。従来の `edge` プロバイダー ID は `microsoft` のエイリアスとして受け付けられます。
- `providers.openai.baseUrl` は OpenAI TTS エンドポイントを上書きします。解決順序は、設定、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `providers.openai.baseUrl` が OpenAI 以外のエンドポイントを指す場合、OpenClaw はそれを OpenAI 互換の TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## Talk

Talk モード (macOS/iOS/Android) のデフォルトです。

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
          speakerVoice: "cedar",
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

- 複数の Talk プロバイダーが設定されている場合、`talk.provider` は `talk.providers` 内のキーと一致する必要があります。
- 従来のフラットな Talk キー (`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`) は互換性専用です。永続化された設定を `talk.providers.<provider>` に書き換えるには、`openclaw doctor --fix` を実行します。
- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` はプレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk ディレクティブで親しみやすい名前を使用できます。
- `providers.mlx.modelId` は macOS ローカル MLX ヘルパーで使用される Hugging Face リポジトリを選択します。省略した場合、macOS は `mlx-community/Soprano-80M-bf16` を使用します。
- macOS MLX 再生は、存在する場合はバンドルされた `openclaw-mlx-tts` ヘルパーを通じて実行され、存在しない場合は `PATH` 上の実行可能ファイルを通じて実行されます。`OPENCLAW_MLX_TTS_BIN` は開発用にヘルパーパスを上書きします。
- `consultThinkingLevel` は、Control UI Talk realtime の `openclaw_agent_consult` 呼び出しの背後にある完全な OpenClaw エージェント実行の thinking level を制御します。通常のセッション/モデル動作を維持するには未設定のままにします。
- `consultFastMode` は、セッションの通常の fast-mode 設定を変更せずに、Control UI Talk realtime consults 用のワンショット fast-mode 上書きを設定します。
- `speechLocale` は、iOS/macOS Talk 音声認識で使用される BCP 47 ロケール ID を設定します。デバイスのデフォルトを使用するには未設定のままにします。
- `silenceTimeoutMs` は、ユーザーの無音後に Talk モードが文字起こしを送信するまで待つ時間を制御します。未設定の場合、プラットフォームのデフォルトの一時停止ウィンドウ (`macOS と Android では 700 ms、iOS では 900 ms`) が維持されます。
- `realtime.instructions` は、プロバイダー向けのシステム指示を OpenClaw の組み込み realtime プロンプトに追加します。これにより、デフォルトの `openclaw_agent_consult` ガイダンスを失わずに音声スタイルを設定できます。
- `realtime.consultRouting` は、realtime プロバイダーが `openclaw_agent_consult` なしで最終的なユーザー文字起こしを生成した場合の Gateway リレーフォールバックを制御します: `provider-direct` はプロバイダーからの直接返信を維持し、`force-agent-consult` は確定したリクエストを OpenClaw 経由でルーティングします。

---

## 関連項目

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他すべての設定キー
- [設定](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [設定例](/ja-JP/gateway/configuration-examples)
