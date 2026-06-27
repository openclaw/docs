---
read_when:
    - エージェントのデフォルト（モデル、thinking、ワークスペース、Heartbeat、メディア、Skills）を調整する
    - マルチエージェントのルーティングとバインディングの設定
    - セッション、メッセージ配信、トークモードの動作を調整する
summary: エージェントのデフォルト、マルチエージェントルーティング、セッション、メッセージ、talk 設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-06-27T11:21:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、`talk.*` 配下のエージェントスコープの設定キー。チャネル、ツール、Gateway ランタイム、その他の
トップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `OPENCLAW_WORKSPACE_DIR` が設定されている場合はそれ、それ以外は `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明示的な `agents.defaults.workspace` 値は
`OPENCLAW_WORKSPACE_DIR` より優先されます。デフォルトエージェントをマウント済みワークスペースに向けたいが、そのパスを設定に書き込みたくない場合は、環境変数を使用してください。

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
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // デフォルトを置き換える
      { id: "locked-down", skills: [] }, // skills なし
    ],
  },
}
```

- デフォルトで Skills を無制限にするには、`agents.defaults.skills` を省略します。
- デフォルトを継承するには、`agents.list[].skills` を省略します。
- Skills なしにするには、`agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストはそのエージェントの最終セットです。デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

ワークスペースブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

必須ブートストラップファイルは書き込みつつ、選択した任意のワークスペースファイルの作成をスキップします。有効な値: `SOUL.md`、`USER.md`、`HEARTBEAT.md`、`IDENTITY.md`。

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

- `"continuation-skip"`: 安全な継続ターン（完了したアシスタント応答の後）ではワークスペースブートストラップの再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と Compaction 後の再試行では引き続きコンテキストを再構築します。
- `"never"`: すべてのターンでワークスペースブートストラップとコンテキストファイル注入を無効にします。これは、自身のプロンプトライフサイクルを完全に所有するエージェント（カスタムコンテキストエンジン、独自のコンテキストを構築するネイティブランタイム、またはブートストラップ不要の特殊なワークフロー）にのみ使用してください。Heartbeat と Compaction リカバリーターンでも注入をスキップします。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

エージェントごとの上書き: `agents.list[].contextInjection`。省略した値は
`agents.defaults.contextInjection` を継承します。

### `agents.defaults.bootstrapMaxChars`

切り捨て前のワークスペースブートストラップファイルごとの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

エージェントごとの上書き: `agents.list[].bootstrapMaxChars`。省略した値は
`agents.defaults.bootstrapMaxChars` を継承します。

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペースブートストラップファイル全体で注入される合計最大文字数。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

エージェントごとの上書き: `agents.list[].bootstrapTotalMaxChars`。省略した値は
`agents.defaults.bootstrapTotalMaxChars` を継承します。

### エージェントごとのブートストラッププロファイル上書き

1 つのエージェントに共有デフォルトとは異なるプロンプト注入動作が必要な場合は、エージェントごとのブートストラッププロファイル上書きを使用します。省略したフィールドは
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

ブートストラップコンテキストが切り捨てられたときの、エージェントに見えるシステムプロンプト通知を制御します。
デフォルト: `"always"`。

- `"off"`: 切り捨て通知テキストをシステムプロンプトに注入しません。
- `"once"`: 一意の切り捨てシグネチャごとに、簡潔な通知を 1 回注入します。
- `"always"`: 切り捨てが存在する場合、実行ごとに簡潔な通知を注入します（推奨）。

詳細な raw/injected カウントと設定チューニングフィールドは、コンテキスト/ステータスレポートやログなどの診断に保持されます。通常の WebChat ユーザー/ランタイムコンテキストには、簡潔なリカバリー通知のみが含まれます。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### コンテキスト予算の所有権マップ

OpenClaw には複数の大容量プロンプト/コンテキスト予算があり、それらは 1 つの汎用ノブにすべて流すのではなく、意図的にサブシステムごとに分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常のワークスペースブートストラップ注入。
- `agents.defaults.startupContext.*`:
  最近の日次 `memory/*.md` ファイルを含む、1 回限りのリセット/起動モデル実行プレリュード。素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずに受け付けられます。
- `skills.limits.*`:
  システムプロンプトへ注入されるコンパクトな Skills リスト。
- `agents.defaults.contextLimits.*`:
  境界付きランタイム抜粋と、ランタイムが所有して注入するブロック。
- `memory.qmd.limits.*`:
  インデックス済みメモリ検索スニペットと注入サイズ。

1 つのエージェントに異なる予算が必要な場合にのみ、対応するエージェントごとの上書きを使用してください。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

リセット/起動モデル実行時に注入される、初回ターンの起動プレリュードを制御します。
素のチャット `/new` と `/reset` コマンドは、モデルを呼び出さずにリセットを受け付けるため、このプレリュードを読み込みません。

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

- `memoryGetMaxChars`: 切り捨てメタデータと継続通知が追加される前の、デフォルトの `memory_get` 抜粋上限。
- `memoryGetDefaultLines`: `lines` が省略された場合の、デフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果とオーバーフローリカバリーに使用される高度なライブツール結果上限。モデルコンテキスト自動上限を使うには未設定のままにしてください:
  100K トークン未満では `16000` 文字、100K+ トークンでは `32000` 文字、200K+ トークンでは `64000`
  文字。長いコンテキストのモデル向けに最大 `1000000` までの明示値を受け付けますが、有効上限は引き続きモデルコンテキストウィンドウのおよそ 30% に制限されます。`openclaw doctor --deep` は有効上限を出力し、doctor は明示的な上書きが古いか効果がない場合にのみ警告します。
- `postCompactionMaxChars`: Compaction 後の更新注入時に使用される
  AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブに対するエージェントごとの上書き。省略したフィールドは
`agents.defaults.contextLimits` から継承します。

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
          toolResultMaxChars: 8000, // このエージェント向けの高度な上限
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

プロバイダー呼び出し前の、トランスクリプト/ツール画像ブロック内の画像最長辺の最大ピクセルサイズ。
デフォルト: `1200`。

低い値は通常、スクリーンショットが多い実行で vision-token 使用量とリクエストペイロードサイズを削減します。
高い値はより多くの視覚的詳細を保持します。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ファイルパス、URL、メディア参照から読み込まれる画像に対する画像ツールの圧縮/詳細設定。
デフォルト: `auto`。

OpenClaw は、選択された画像モデルに合わせてリサイズラダーを調整します。たとえば、Claude Opus 4.8、OpenAI GPT-5.5、Qwen VL、ホスト型 Llama 4 vision モデルは、古い/デフォルトの高詳細 vision パスより大きな画像を使用できます。一方、複数画像ターンでは、トークンとレイテンシのコストを制御するために `auto` モードでより積極的に圧縮されます。

値:

- `auto`: モデル制限と画像数に適応します。
- `efficient`: トークンとバイト使用量を抑えるため、より小さい画像を優先します。
- `balanced`: 標準的な中間ラダーを使用します。
- `high`: スクリーンショット、図、ドキュメント画像の詳細をより多く保持します。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキスト用のタイムゾーン（メッセージタイムスタンプではありません）。ホストのタイムゾーンにフォールバックします。

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
      params: { cacheRetention: "long" }, // グローバルデフォルトのプロバイダーパラメーター
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
  - オブジェクト形式はプライマリに加えて、順序付きのフェイルオーバーモデルを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `image` ツールパスで、ビジョンモデル設定として使用されます。
  - 選択済みまたはデフォルトのモデルが画像入力を受け付けられない場合のフォールバックルーティングにも使用されます。
  - 明示的な `provider/model` 参照を推奨します。互換性のためにベア ID も受け付けます。ベア ID が `models.providers.*.models` 内の設定済み画像対応エントリに一意に一致する場合、OpenClaw はそれをそのプロバイダーに修飾します。設定済みの一致が曖昧な場合は、明示的なプロバイダープレフィックスが必要です。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有画像生成機能と、画像を生成する将来のツールまたは Plugin サーフェスで使用されます。
  - 典型的な値: ネイティブ Gemini 画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-2`、透明背景の OpenAI PNG/WebP 出力には `openai/gpt-image-1.5`。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証も設定してください（例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` / `openai/gpt-image-1.5` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み画像生成プロバイダーをプロバイダー ID 順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有音楽生成機能と組み込みの `music_generate` ツールで使用されます。
  - 典型的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み音楽生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有動画生成機能と組み込みの `video_generate` ツールで使用されます。
  - 典型的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み動画生成プロバイダーをプロバイダー ID 順に試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
  - 公式 Qwen 動画生成 Plugin は、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、およびプロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `pdf` ツールでモデルルーティングに使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルト PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮されるデフォルトの最大ページ数。
- `verboseDefault`: エージェントのデフォルト詳細レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `toolProgressDetail`: `/verbose` ツール要約と進行状況ドラフトのツール行の詳細モード。値: `"explain"`（デフォルト、コンパクトな人間向けラベル）または `"raw"`（利用可能な場合は生のコマンド/詳細を追加）。エージェント単位の `agents.list[].toolProgressDetail` はこのデフォルトを上書きします。
- `reasoningDefault`: エージェントのデフォルト reasoning 表示。値: `"off"`、`"on"`、`"stream"`。エージェント単位の `agents.list[].reasoningDefault` はこのデフォルトを上書きします。設定済みの reasoning デフォルトは、メッセージ単位またはセッションの reasoning 上書きが設定されていない場合にのみ、所有者、承認済み送信者、またはオペレーター管理者の Gateway コンテキストに適用されます。
- `elevatedDefault`: エージェントのデフォルト昇格出力レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: OpenAI API キーまたは Codex OAuth アクセスには `openai/gpt-5.5`）。プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に対する一意の設定済みプロバイダー一致を試し、その後にのみ設定済みデフォルトプロバイダーへフォールバックします（非推奨の互換動作のため、明示的な `provider/model` を推奨）。そのプロバイダーが設定済みデフォルトモデルを公開しなくなった場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表面化する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。
- `models`: `/model` 用に設定されたモデルカタログと許可リスト。各エントリには `alias`（ショートカット）と `params`（プロバイダー固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` ルーティング、`chat_template_kwargs`、`extra_body`/`extraBody`）を含められます。
  - 各モデル ID を手動で列挙せずに、選択したプロバイダーで検出されたすべてのモデルを表示するには、`"openai/*": {}` や `"vllm/*": {}` などの `provider/*` エントリを使用します。
  - そのプロバイダーで動的に検出されるすべてのモデルが同じランタイムを使用すべき場合は、`provider/*` エントリに `agentRuntime` を追加します。正確な `provider/model` ランタイムポリシーは、引き続きワイルドカードより優先されます。
  - 安全な編集: エントリを追加するには `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使用します。`config set` は、`--replace` を渡さない限り、既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダー範囲の configure/オンボーディングフローは、選択したプロバイダーモデルをこのマップにマージし、すでに設定されている無関係なプロバイダーを保持します。
  - 直接の OpenAI Responses モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management` の注入を止めるには `params.responsesServerCompaction: false` を使用し、しきい値を上書きするには `params.responsesCompactThreshold` を使用します。[OpenAI サーバー側 Compaction](/ja-JP/providers/openai#server-side-compaction-responses-api) を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルトプロバイダーパラメーター。`agents.defaults.params` で設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）は `agents.defaults.models["provider/model"].params`（モデル単位）で上書きされ、その後 `agents.list[].params`（一致するエージェント ID）がキー単位で上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `models.providers.openrouter.params.provider`: OpenRouter 全体のデフォルトプロバイダールーティングポリシー。OpenClaw はこれを OpenRouter リクエストの `provider` オブジェクトへ転送します。モデル単位の `agents.defaults.models["openrouter/<model>"].params.provider` とエージェントパラメーターはキー単位で上書きします。[OpenRouter プロバイダールーティング](/ja-JP/providers/openrouter#advanced-configuration) を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシ向けに、`api: "openai-completions"` リクエスト本文へマージされる高度なパススルー JSON。生成されたリクエストキーと衝突した場合、追加本文が優先されます。非ネイティブ completions ルートでは、その後も OpenAI 専用の `store` が削除されます。
- `params.chat_template_kwargs`: vLLM/OpenAI 互換のチャットテンプレート引数で、トップレベルの `api: "openai-completions"` リクエスト本文へマージされます。thinking がオフの `vllm/nemotron-3-*` では、バンドルされた vLLM Plugin が自動的に `enable_thinking: false` と `force_nonempty_content: true` を送信します。明示的な `chat_template_kwargs` は生成されたデフォルトを上書きし、`extra_body.chat_template_kwargs` が引き続き最終優先されます。設定済みの vLLM Qwen と Nemotron thinking モデルは、複数レベルの effort ラダーではなく、バイナリの `/think` 選択肢（`off`、`on`）を公開します。
- `compat.thinkingFormat`: OpenAI 互換 thinking ペイロード形式。Together 形式の `reasoning.enabled` には `"together"`、Qwen 形式のトップレベル `enable_thinking` には `"qwen"`、vLLM など、リクエストレベルのチャットテンプレート kwargs をサポートする Qwen ファミリーバックエンド上の `chat_template_kwargs.enable_thinking` には `"qwen-chat-template"` を使用します。OpenClaw は無効な thinking を `false` に、有効な thinking を `true` にマップし、設定済みの vLLM Qwen モデルはこれらの形式向けにバイナリの `/think` 選択肢を公開します。
- `compat.supportedReasoningEfforts`: モデル単位の OpenAI 互換 reasoning effort リスト。実際に受け付けるカスタムエンドポイントには `"xhigh"` を含めてください。OpenClaw はその設定済みプロバイダー/モデルについて、コマンドメニュー、Gateway セッション行、セッションパッチ検証、エージェント CLI 検証、`llm-task` 検証で `/think xhigh` を公開します。バックエンドが標準レベルに対してプロバイダー固有の値を求める場合は、`compat.reasoningEffortMap` を使用します。
- `params.preserveThinking`: Z.AI 専用の、保持された thinking へのオプトイン。有効で thinking がオンの場合、OpenClaw は `thinking.clear_thinking: false` を送信し、以前の `reasoning_content` を再生します。[Z.AI thinking と保持された thinking](/ja-JP/providers/zai#thinking-and-preserved-thinking) を参照してください。
- `localService`: ローカル/セルフホスト型モデルサーバー用の任意のプロバイダーレベルプロセスマネージャー。選択されたモデルがそのプロバイダーに属する場合、OpenClaw は `healthUrl`（または `baseUrl + "/models"`）をプローブし、エンドポイントがダウンしていれば `args` 付きで `command` を起動し、最大 `readyTimeoutMs` まで待ってからモデルリクエストを送信します。`command` は絶対パスである必要があります。`idleStopMs: 0` は OpenClaw が終了するまでプロセスを稼働させ続けます。正の値は、そのミリ秒数のアイドル後に OpenClaw が生成したプロセスを停止します。[ローカルモデルサービス](/ja-JP/gateway/local-model-services) を参照してください。
- ランタイムポリシーは、`agents.defaults` ではなく、プロバイダーまたはモデルに属します。プロバイダー全体のルールには `models.providers.<provider>.agentRuntime` を使用し、モデル固有のルールには `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` を使用します。公式 OpenAI プロバイダー上の OpenAI エージェントモデルは、デフォルトで Codex を選択します。
- これらのフィールドを変更する設定ライター（例: `/models set`、`/models set-image`、フォールバックの追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な場合は既存のフォールバックリストを保持します。
- `maxConcurrent`: セッション全体での最大並列エージェント実行数（各セッションは引き続きシリアル化されます）。デフォルト: 4。

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

- `id`: `"auto"`、`"openclaw"`、登録済みPluginハーネスID、またはサポートされているCLIバックエンドエイリアス。バンドルされたCodex Pluginは`codex`を登録し、バンドルされたAnthropic Pluginは`claude-cli` CLIバックエンドを提供します。
- `id: "auto"`は、登録済みPluginハーネスがサポート対象のターンを要求できるようにし、一致するハーネスがない場合はOpenClawを使用します。`id: "codex"`のような明示的なPluginランタイムはそのハーネスを要求し、利用できない場合や失敗した場合はフェイルクローズします。
- `id: "pi"`は、v2026.5.22以前から出荷済みの設定を維持するため、`openclaw`の非推奨エイリアスとしてのみ受け入れられます。新しい設定では`openclaw`を使用してください。
- ランタイムの優先順位は、まず完全一致のモデルポリシー（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]`、または`models.providers.<provider>.models[]`）、次に`agents.list[]` / `agents.defaults.models["provider/*"]`、最後に`models.providers.<provider>.agentRuntime`のプロバイダー全体ポリシーです。
- エージェント全体のランタイムキーはレガシーです。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、セッションランタイムの固定、`OPENCLAW_AGENT_RUNTIME`はランタイム選択で無視されます。古い値を削除するには`openclaw doctor --fix`を実行してください。
- OpenAIエージェントモデルはデフォルトでCodexハーネスを使用します。provider/modelの`agentRuntime.id: "codex"`は、それを明示したい場合に引き続き有効です。
- Claude CLIデプロイでは、`model: "anthropic/claude-opus-4-8"`と、モデルスコープの`agentRuntime.id: "claude-cli"`を推奨します。レガシーの`claude-cli/claude-opus-4-7`モデル参照は互換性のため引き続き動作しますが、新しい設定ではprovider/modelの選択を正規の形に保ち、実行バックエンドをprovider/modelランタイムポリシーに置いてください。
- これはテキストのエージェントターン実行のみを制御します。メディア生成、ビジョン、PDF、音楽、動画、TTSは引き続きそれぞれのprovider/model設定を使用します。

**組み込みエイリアス短縮形**（モデルが`agents.defaults.models`内にある場合にのみ適用）:

| エイリアス          | モデル                          |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

設定したエイリアスは常にデフォルトより優先されます。

Z.AI GLM-4.xモデルは、`--thinking off`を設定するか、`agents.defaults.models["zai/<model>"].params.thinking`を自分で定義しない限り、自動的に思考モードを有効にします。
Z.AIモデルは、ツール呼び出しのストリーミング用にデフォルトで`tool_stream`を有効にします。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream`を`false`に設定します。
Anthropic Claude Opus 4.8は、OpenClawではデフォルトで思考をオフにします。適応型思考を明示的に有効にした場合、Anthropicのプロバイダー所有のエフォートのデフォルトは`high`です。Claude 4.6モデルは、明示的な思考レベルが設定されていない場合、デフォルトで`adaptive`になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行（ツール呼び出しなし）向けの任意のCLIバックエンド。APIプロバイダーが失敗した場合のバックアップとして有用です。

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

- CLIバックエンドはテキスト優先です。ツールは常に無効化されます。
- `sessionArg`が設定されている場合、セッションがサポートされます。
- `imageArg`がファイルパスを受け付ける場合、画像のパススルーがサポートされます。
- `reseedFromRawTranscriptWhenUncompacted: true`を使うと、最初のCompaction要約が存在する前に、バックエンドは境界付きの生のOpenClawトランスクリプト末尾から、安全に無効化されたセッションを復旧できます。認証プロファイルや認証情報エポックの変更では、引き続き生データによる再シードは絶対に行われません。

### `agents.defaults.promptOverlays`

OpenClawが組み立てたプロンプト面に、モデルファミリー別に適用されるプロバイダー非依存のプロンプトオーバーレイ。GPT-5ファミリーのモデルIDは、OpenClaw/providerルート全体で共有の動作契約を受け取ります。`personality`は、親しみやすい対話スタイル層のみを制御します。ネイティブCodexアプリサーバールートは、このOpenClaw GPT-5オーバーレイではなくCodex所有のベース/モデル指示を維持し、OpenClawはネイティブスレッドでCodexの組み込みpersonalityを無効にします。

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

- `"friendly"`（デフォルト）と`"on"`は、親しみやすい対話スタイル層を有効にします。
- `"off"`は親しみやすい層のみを無効にします。タグ付けされたGPT-5動作契約は有効なままです。
- レガシーの`plugins.entries.openai.config.personality`は、この共有設定が未設定の場合に引き続き読み取られます。

### `agents.defaults.heartbeat`

定期的なHeartbeat実行。

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

- `every`: 期間文字列（ms/s/m/h）。デフォルトは`30m`（APIキー認証）または`1h`（OAuth認証）です。無効にするには`0m`に設定します。
- `includeSystemPromptSection`: falseの場合、システムプロンプトからHeartbeatセクションを省略し、ブートストラップコンテキストへの`HEARTBEAT.md`注入をスキップします。デフォルトは`true`です。
- `suppressToolErrorWarnings`: trueの場合、Heartbeat実行中のツールエラー警告ペイロードを抑制します。
- `timeoutSeconds`: Heartbeatエージェントターンが中断されるまでに許可される最大秒数です。未設定の場合、`agents.defaults.timeoutSeconds`が設定されていればそれを使用し、それ以外はHeartbeatの間隔を上限600秒で使用します。
- `directPolicy`: ダイレクト/DM配信ポリシー。`allow`（デフォルト）はダイレクトターゲット配信を許可します。`block`はダイレクトターゲット配信を抑制し、`reason=dm-blocked`を出力します。
- `lightContext`: trueの場合、Heartbeat実行は軽量ブートストラップコンテキストを使用し、ワークスペースのブートストラップファイルから`HEARTBEAT.md`のみを保持します。
- `isolatedSession`: trueの場合、各Heartbeatは過去の会話履歴のない新しいセッションで実行されます。cronの`sessionTarget: "isolated"`と同じ分離パターンです。Heartbeatごとのトークンコストを約100Kから約2-5Kトークンに削減します。
- `skipWhenBusy`: trueの場合、Heartbeat実行はそのエージェントの追加ビジーレーン、つまり自身のセッションキー付きサブエージェントまたはネストされたコマンド作業で延期されます。Cronレーンは、このフラグがなくても常にHeartbeatを延期します。
- エージェント単位: `agents.list[].heartbeat`を設定します。いずれかのエージェントが`heartbeat`を定義している場合、**それらのエージェントのみ**がHeartbeatを実行します。
- Heartbeatは完全なエージェントターンを実行します。間隔を短くすると、より多くのトークンを消費します。

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

- `mode`: `default` または `safeguard`（長い履歴向けのチャンク化された要約）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済み Compaction プロバイダー Plugin の id。設定すると、組み込み LLM 要約の代わりにプロバイダーの `summarize()` が呼び出されます。失敗時は組み込みにフォールバックします。プロバイダーを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClaw が単一の Compaction 操作を中止するまでに許可する最大秒数。デフォルト: `180`。
- `keepRecentTokens`: 直近の transcript 末尾をそのまま保持するためのエージェントのカットポイント予算。手動 `/compact` は明示的に設定されている場合これを尊重します。それ以外の場合、手動 Compaction はハードチェックポイントです。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は Compaction 要約中に、組み込みの不透明識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使用される、任意のカスタム識別子保持テキスト。
- `qualityGuard`: safeguard 要約に対する、不正形式出力時のリトライチェック。safeguard モードではデフォルトで有効です。監査をスキップするには `enabled: false` を設定します。
- `midTurnPrecheck`: 任意のツールループ圧力チェック。`enabled: true` の場合、OpenClaw はツール結果が追加された後、次のモデル呼び出しの前にコンテキスト圧力をチェックします。コンテキストが収まらなくなった場合、プロンプトを送信する前に現在の試行を中止し、既存の事前チェック復旧パスを再利用してツール結果を切り詰めるか、Compaction してリトライします。`default` と `safeguard` の両方の Compaction モードで動作します。デフォルト: 無効。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名。未設定または `[]` に設定されている場合、再注入は無効です。`["Session Startup", "Red Lines"]` を明示的に設定すると、そのペアが有効になり、従来の `Every Session`/`Safety` フォールバックが保持されます。追加コンテキストが、Compaction 要約にすでに取り込まれているプロジェクトガイダンスと重複するリスクに見合う場合のみ有効にしてください。
- `model`: Compaction 要約専用の任意の `provider/model-id`、または `agents.defaults.models` の裸のエイリアス。裸のエイリアスはディスパッチ前に解決されます。設定済みのリテラルモデル ID は、衝突時に優先されます。メインセッションでは 1 つのモデルを維持し、Compaction 要約は別のモデルで実行したい場合に使用します。未設定の場合、Compaction はセッションのプライマリモデルを使用します。
- `maxActiveTranscriptBytes`: アクティブな JSONL がしきい値を超えたとき、実行前に通常のローカル Compaction をトリガーする任意のバイトしきい値（`number` または `"20mb"` のような文字列）。Compaction 成功後に、より小さい後継 transcript へローテーションできるように `truncateAfterCompaction` が必要です。未設定または `0` の場合は無効です。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時に短い通知をユーザーへ送信します（例: 「コンテキストを Compaction しています...」や「Compaction が完了しました」）。Compaction をサイレントに保つため、デフォルトでは無効です。
- `memoryFlush`: auto-Compaction の前に耐久的なメモリを保存する、サイレントなエージェントターン。この保守ターンをローカルモデル上に留めたい場合は、`model` を `ollama/qwen3:8b` のような正確な provider/model に設定します。このオーバーライドはアクティブセッションのフォールバックチェーンを継承しません。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.runRetries`

失敗からの復旧中に無限実行ループを防ぐための、組み込みエージェントランタイム向け外側実行ループのリトライ反復境界。この設定は現在、組み込みエージェントランタイムにのみ適用され、ACP や CLI ランタイムには適用されない点に注意してください。

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

- `base`: 外側実行ループの実行リトライ反復の基本数。デフォルト: `24`。
- `perProfile`: フォールバックプロファイル候補ごとに付与される追加の実行リトライ反復数。デフォルト: `8`。
- `min`: 実行リトライ反復の絶対最小上限。デフォルト: `32`。
- `max`: 暴走実行を防ぐための、実行リトライ反復の絶対最大上限。デフォルト: `160`。

### `agents.defaults.contextPruning`

LLM へ送信する前に、インメモリコンテキストから**古いツール結果**を剪定します。ディスク上のセッション履歴は変更**しません**。

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

- `mode: "cache-ttl"` は剪定パスを有効にします。
- `ttl` は、剪定を再実行できる頻度（最後のキャッシュ接触後）を制御します。
- 剪定はまず過大なツール結果をソフトトリムし、その後必要に応じて古いツール結果をハードクリアします。
- `softTrimRatio` と `hardClearRatio` は `0.0` から `1.0` までの値を受け入れます。設定検証は、その範囲外の値を拒否します。

**ソフトトリム** は先頭 + 末尾を保持し、中央に `...` を挿入します。

**ハードクリア** はツール結果全体をプレースホルダーで置き換えます。

注記:

- 画像ブロックはトリム/クリアされません。
- 比率は文字ベース（概算）であり、正確なトークン数ではありません。
- `keepLastAssistants` 未満の assistant メッセージしか存在しない場合、剪定はスキップされます。

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

- Telegram 以外のチャネルでは、ブロック返信を有効にするために明示的な `*.blockStreaming: true` が必要です。
- チャネルのオーバーライド: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダム化された一時停止。`natural` = 800〜2500ms。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

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

- デフォルト: ダイレクトチャット/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

組み込みエージェント向けの任意のサンドボックス化。完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

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

- `docker`: ローカル Docker ランタイム（デフォルト）
- `ssh`: 汎用 SSH ベースのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` が選択されている場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのワークスペースに使用される絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が実行時に一時ファイルへ実体化するインライン内容または SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH ホストキー ポリシーのノブ

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先されます
- `certificateData` は `certificateFile` より優先されます
- `knownHostsData` は `knownHostsFile` より優先されます
- SecretRef ベースの `*Data` 値は、サンドボックスセッションの開始前に、アクティブなシークレットランタイムスナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成後にリモートワークスペースを一度シードします
- その後、リモート SSH ワークスペースを正準として保持します
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングします
- リモート変更をホストへ自動同期しません
- サンドボックスブラウザーコンテナをサポートしません

**ワークスペースアクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのサンドボックスワークスペース
- `ro`: `/workspace` のサンドボックスワークスペース、`/agent` に読み取り専用でマウントされたエージェントワークスペース
- `rw`: `/workspace` に読み書き可能でマウントされたエージェントワークスペース

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
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // 任意
          gatewayEndpoint: "https://lab.example", // 任意
          policy: "strict", // 任意の OpenShell ポリシー id
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

- `mirror`: 実行前にローカルからリモートへシードし、実行後に同期して戻す。ローカルワークスペースが正とされる
- `remote`: サンドボックス作成時に一度リモートへシードし、その後はリモートワークスペースを正とする

`remote` モードでは、シード手順の後に OpenClaw の外で行われたホストローカルの編集は、サンドボックスへ自動同期されません。
トランスポートは OpenShell サンドボックスへの SSH ですが、Plugin がサンドボックスのライフサイクルと任意のミラー同期を所有します。

**`setupCommand`** はコンテナ作成後に一度だけ実行されます（`sh -lc` 経由）。ネットワーク送信、書き込み可能な root、root ユーザーが必要です。

**コンテナはデフォルトで `network: "none"`** です。エージェントが外向きアクセスを必要とする場合は `"bridge"`（またはカスタムブリッジネットワーク）に設定します。
`"host"` はブロックされます。`"container:<id>"` は、`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急用）を明示的に設定しない限り、デフォルトでブロックされます。
アクティブな OpenClaw サンドボックス内の Codex app-server ターンは、ネイティブコードモードのネットワークアクセスに同じ送信設定を使用します。

**受信添付ファイル** は、アクティブなワークスペース内の `media/inbound/*` にステージされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルおよびエージェントごとの bind はマージされます。

**サンドボックス化ブラウザー**（`sandbox.browser.enabled`）: コンテナ内の Chromium + CDP。noVNC URL がシステムプロンプトに注入されます。`openclaw.json` の `browser.enabled` は不要です。
noVNC オブザーバーアクセスはデフォルトで VNC 認証を使用し、OpenClaw は共有 URL でパスワードを公開する代わりに短命のトークン URL を発行します。

- `allowHostControl: false`（デフォルト）は、サンドボックス化セッションがホストブラウザーを対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用ブリッジネットワーク）です。グローバルブリッジ接続を明示的に必要とする場合にのみ `bridge` に設定します。
- `cdpSourceRange` は、コンテナエッジでの CDP 受信を CIDR 範囲（例: `172.21.0.1/32`）に任意で制限します。
- `sandbox.browser.binds` は、サンドボックスブラウザーコンテナのみに追加のホストディレクトリをマウントします。設定した場合（`[]` を含む）、ブラウザーコンテナでは `docker.binds` を置き換えます。
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
  - `--disable-3d-apis`、`--disable-software-rasterizer`、および `--disable-gpu` はデフォルトで有効で、WebGL/3D の使用で必要な場合は `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - ワークフローが拡張機能に依存している場合、`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で拡張機能を再有効化します。
  - `--renderer-process-limit=2` は `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium のデフォルトプロセス制限を使用するには `0` を設定します。
  - さらに、`noSandbox` が有効な場合は `--no-sandbox`。
  - デフォルトはコンテナイメージのベースラインです。コンテナデフォルトを変更するには、カスタム entrypoint を持つカスタムブラウザーイメージを使用してください。

</Accordion>

ブラウザーのサンドボックス化と `sandbox.docker.binds` は Docker 専用です。

イメージをビルドします（ソースチェックアウトから）:

```bash
scripts/sandbox-setup.sh           # メインサンドボックスイメージ
scripts/sandbox-browser-setup.sh   # 任意のブラウザーイメージ
```

ソースチェックアウトなしで npm インストールする場合は、インラインの `docker build` コマンドについて [サンドボックス化 § イメージとセットアップ](/ja-JP/gateway/sandboxing#images-and-setup) を参照してください。

### `agents.list`（エージェントごとの上書き）

`agents.list[].tts` を使用して、エージェントごとに独自の TTS プロバイダー、音声、モデル、スタイル、または自動 TTS モードを指定します。エージェントブロックはグローバルな `messages.tts` の上にディープマージされるため、共有認証情報は 1 か所に置いたまま、個々のエージェントは必要な音声またはプロバイダーフィールドだけを上書きできます。アクティブエージェントの上書きは、自動音声応答、`/tts audio`、`/tts status`、および `tts` エージェントツールに適用されます。プロバイダー例と優先順位については [テキスト読み上げ](/ja-JP/tools/tts#per-agent-voice-overrides) を参照してください。

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
        thinkingDefault: "high", // エージェントごとの思考レベル上書き
        reasoningDefault: "on", // エージェントごとの推論可視性上書き
        fastModeDefault: false, // エージェントごとの高速モード上書き
        params: { cacheRetention: "none" }, // 一致する defaults.models params をキーごとに上書き
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // 設定時は agents.defaults.skills を置き換える
        identity: {
          name: "Samantha",
          theme: "役立つナマケモノ",
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
- `default`: 複数設定された場合は最初が優先されます（警告がログ出力されます）。未設定の場合、リストの最初のエントリーがデフォルトです。
- `model`: 文字列形式はモデル fallback なしの厳密なエージェントごとの primary を設定します。オブジェクト形式 `{ primary }` も、`fallbacks` を追加しない限り厳密です。`{ primary, fallbacks: [...] }` を使用すると、そのエージェントで fallback を有効化できます。または `{ primary, fallbacks: [] }` で厳密な動作を明示できます。`primary` のみを上書きする Cron ジョブは、`fallbacks: []` を設定しない限りデフォルト fallback を引き継ぎます。
- `params`: `agents.defaults.models` 内の選択されたモデルエントリーの上にマージされる、エージェントごとのストリームパラメーターです。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有の上書きに使用します。
- `tts`: 任意のエージェントごとのテキスト読み上げ上書きです。このブロックは `messages.tts` の上にディープマージされるため、共有プロバイダー認証情報と fallback ポリシーは `messages.tts` に保持し、プロバイダー、音声、モデル、スタイル、自動モードなどのペルソナ固有値のみをここで設定します。
- `skills`: 任意のエージェントごとの skill 許可リストです。省略した場合、設定されていればエージェントは `agents.defaults.skills` を継承します。明示的なリストはマージではなくデフォルトを置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェントごとのデフォルト思考レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージごとまたはセッションごとの上書きが設定されていない場合、このエージェントについて `agents.defaults.thinkingDefault` を上書きします。選択されたプロバイダー/モデルプロファイルが有効な値を制御します。Google Gemini では、`adaptive` はプロバイダー所有の動的思考を維持します（Gemini 3/3.1 では `thinkingLevel` を省略、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 任意のエージェントごとのデフォルト推論可視性（`on | off | stream`）。メッセージごとまたはセッションごとの reasoning 上書きが設定されていない場合、このエージェントについて `agents.defaults.reasoningDefault` を上書きします。
- `fastModeDefault`: 高速モードの任意のエージェントごとのデフォルト（`"auto" | true | false`）。メッセージごとまたはセッションごとの高速モード上書きが設定されていない場合に適用されます。
- `models`: 完全な `provider/model` id をキーとする、任意のエージェントごとのモデルカタログ/ランタイム上書きです。エージェントごとのランタイム例外には `models["provider/model"].agentRuntime` を使用します。
- `runtime`: 任意のエージェントごとのランタイム記述子です。エージェントが ACP ハーネスセッションをデフォルトにする必要がある場合は、`runtime.acp` デフォルト（`agent`、`backend`、`mode`、`cwd`）とともに `type: "acp"` を使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- ローカルのワークスペース相対 `identity.avatar` 画像ファイルは 2 MB に制限されます。`http(s)` URL と `data:` URI はローカルファイルサイズ制限ではチェックされません。
- `identity` はデフォルトを導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: 明示的な `sessions_spawn.agentId` ターゲットに対する、設定済みエージェント id の許可リスト（`["*"]` = 任意の設定済みターゲット、デフォルト: 同じエージェントのみ）。自分自身を対象にした `agentId` 呼び出しを許可する必要がある場合は、リクエスター id を含めます。エージェント設定が削除された古いエントリーは `sessions_spawn` で拒否され、`agents_list` から省略されます。クリーンアップするには `openclaw doctor --fix` を実行するか、デフォルトを継承しつつそのターゲットを spawn 可能なままにする必要がある場合は最小限の `agents.list[]` エントリーを追加します。
- サンドボックス継承ガード: リクエスターセッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制。デフォルト: false）。

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

### バインディング一致フィールド

- `type`（任意）: 通常ルーティングの場合は `route`（type がない場合は route がデフォルト）、永続 ACP 会話バインディングの場合は `acp`。
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

各階層内では、最初に一致した `bindings` エントリーが優先されます。

`type: "acp"` エントリーの場合、OpenClaw は正確な会話 ID（`match.channel` + account + `match.peer.id`）で解決し、上記の route binding 階層順序は使用しません。

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

優先順位の詳細は [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

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

<Accordion title="Session field details">

- **`scope`**: グループチャットのコンテキストにおける基本セッションのグループ化戦略。
  - `per-sender` (デフォルト): 各送信者はチャネルコンテキスト内で隔離されたセッションを持ちます。
  - `global`: チャネルコンテキスト内の全参加者が単一のセッションを共有します (共有コンテキストを意図する場合のみ使用)。
- **`dmScope`**: DM のグループ化方法。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャネルをまたいで送信者 ID ごとに隔離します。
  - `per-channel-peer`: チャネル + 送信者ごとに隔離します (複数ユーザーの受信箱に推奨)。
  - `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに隔離します (複数アカウントに推奨)。
- **`identityLinks`**: チャネル横断のセッション共有のために、正規 ID をプロバイダープレフィックス付きピアへマッピングします。`/dock_discord` などのドックコマンドは同じマップを使用して、アクティブセッションの返信ルートを別のリンク済みチャネルピアへ切り替えます。[チャネルのドッキング](/ja-JP/concepts/channel-docking) を参照してください。
- **`reset`**: 主なリセットポリシー。`daily` はローカル時刻の `atHour` にリセットします。`idle` は `idleMinutes` 経過後にリセットします。両方が設定されている場合、先に期限切れになった方が優先されます。日次リセットの鮮度はセッション行の `sessionStartedAt` を使用します。アイドルリセットの鮮度は `lastInteractionAt` を使用します。Heartbeat、Cron ウェイクアップ、exec 通知、Gateway の記録処理などのバックグラウンド/システムイベント書き込みは `updatedAt` を更新できますが、日次/アイドルセッションを新鮮な状態に保つことはありません。
- **`resetByType`**: タイプ別の上書き (`direct`、`group`、`thread`)。レガシーの `dm` は `direct` のエイリアスとして受け付けられます。
- **`mainKey`**: レガシーフィールド。ランタイムはメインのダイレクトチャットバケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: エージェント間交換中のエージェント間返信バックターンの最大数 (整数、範囲: `0`-`20`、デフォルト: `5`)。`0` はピンポン連鎖を無効にします。
- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、レガシー `dm` エイリアスあり)、`keyPrefix`、または `rawKeyPrefix` で照合します。最初の拒否が優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持の制御。
  - `mode`: `enforce` はクリーンアップを適用し、デフォルトです。`warn` は警告のみを出力します。
  - `pruneAfter`: 古いエントリの経過時間しきい値 (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` 内のエントリ最大数 (デフォルト `500`)。ランタイムは本番サイズの上限に対して小さなハイウォーターバッファ付きでバッチクリーンアップを書き込みます。`openclaw sessions cleanup --enforce` は上限を即時適用します。
  - 短命の Gateway モデル実行プローブセッションは固定の `24h` 保持を使用しますが、クリーンアップは圧力ゲート付きです。セッションエントリのメンテナンス/上限圧力に達した場合にのみ、古い厳格なモデル実行プローブ行を削除します。`agent:*:explicit:model-run-<uuid>` に一致する厳格な明示的プローブキーのみが対象です。通常の direct、group、thread、Cron、hook、Heartbeat、ACP、サブエージェントセッションはこの 24h 保持を継承しません。モデル実行クリーンアップが実行される場合、より広範な `pruneAfter` の古いエントリクリーンアップと `maxEntries` 上限より前に実行されます。
  - `rotateBytes`: 非推奨で無視されます。`openclaw doctor --fix` は古い設定からこれを削除します。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter` です。無効にするには `false` を設定します。
  - `maxDiskBytes`: 任意のセッションディレクトリのディスク予算。`warn` モードでは警告をログに記録します。`enforce` モードでは最も古い成果物/セッションから削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッドにバインドされたセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーは上書き可能。Discord は `channels.discord.threadBindings.enabled` を使用)
  - `idleHours`: 非アクティブ時に自動でフォーカス解除するデフォルト時間数 (`0` で無効。プロバイダーは上書き可能)
  - `maxAgeHours`: デフォルトの強制最大経過時間 (時間単位、`0` で無効。プロバイダーは上書き可能)
  - `spawnSessions`: `sessions_spawn` と ACP スレッド生成からスレッドバインド作業セッションを作成するためのデフォルトゲート。スレッドバインディングが有効な場合、デフォルトは `true` です。プロバイダー/アカウントは上書きできます。
  - `defaultSpawnContext`: スレッドバインド生成用のデフォルトネイティブサブエージェントコンテキスト (`"fork"` または `"isolated"`)。デフォルトは `"fork"` です。

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

チャネル/アカウントごとの上書き: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

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

- デフォルトはアクティブエージェントの `identity.emoji`、それ以外の場合は `"👀"` です。無効にするには `""` を設定します。
- チャネルごとの上書き: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram、WhatsApp、iMessage などリアクション対応チャネルで、返信後に Ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram、WhatsApp でライフサイクルステータスリアクションを有効にします。
  Slack と Discord では、未設定の場合、Ack リアクションがアクティブなときにステータスリアクションが有効のままになります。
  Telegram と WhatsApp では、ライフサイクルステータスリアクションを有効にするには明示的に `true` に設定します。
- `messages.statusReactions.emojis`: ライフサイクル絵文字キーを上書きします:
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft`、`stallHard`。
  Telegram では固定のリアクションセットのみが許可されるため、サポートされていない設定済み絵文字は
  そのチャットで最も近いサポート済みステータスバリアントへフォールバックします。

### 受信デバウンス

同じ送信者からの高速なテキストのみのメッセージを、単一のエージェントターンにまとめます。メディア/添付ファイルは即時にフラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS (テキスト読み上げ)

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

- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` でローカル設定を上書きでき、`/tts status` は有効な状態を表示します。
- `summaryModel` は自動サマリー用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false` です（オプトイン）。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` と `OPENAI_API_KEY` にフォールバックします。
- バンドルされた音声プロバイダーは Plugin が所有します。`plugins.allow` が設定されている場合は、使用したい各 TTS プロバイダー Plugin を含めてください。たとえば Edge TTS には `microsoft` を含めます。従来の `edge` プロバイダー ID は `microsoft` のエイリアスとして受け入れられます。
- `providers.openai.baseUrl` は OpenAI TTS エンドポイントを上書きします。解決順序は、設定、`OPENAI_TTS_BASE_URL`、`https://api.openai.com/v1` の順です。
- `providers.openai.baseUrl` が OpenAI 以外のエンドポイントを指す場合、OpenClaw はそれを OpenAI 互換の TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## 会話

会話モード（macOS/iOS/Android）のデフォルト。

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

- 複数の会話プロバイダーが設定されている場合、`talk.provider` は `talk.providers` 内のキーと一致する必要があります。
- 従来のフラットな会話キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用です。永続化された設定を `talk.providers.<provider>` に書き換えるには、`openclaw doctor --fix` を実行します。
- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` はプレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、会話 API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、会話ディレクティブでわかりやすい名前を使用できます。
- `providers.mlx.modelId` は、macOS ローカル MLX ヘルパーで使用される Hugging Face リポジトリを選択します。省略した場合、macOS は `mlx-community/Soprano-80M-bf16` を使用します。
- macOS の MLX 再生は、存在する場合はバンドルされた `openclaw-mlx-tts` ヘルパーを通じて実行され、そうでない場合は `PATH` 上の実行可能ファイルを通じて実行されます。開発用には `OPENCLAW_MLX_TTS_BIN` でヘルパーパスを上書きできます。
- `consultThinkingLevel` は、Control UI の会話リアルタイム `openclaw_agent_consult` 呼び出しの背後にある OpenClaw エージェント実行全体の思考レベルを制御します。通常のセッション/モデル動作を保持するには未設定のままにします。
- `consultFastMode` は、セッションの通常の高速モード設定を変更せずに、Control UI の会話リアルタイム相談に対して一回限りの高速モード上書きを設定します。
- `speechLocale` は、iOS/macOS の会話音声認識で使用される BCP 47 ロケール ID を設定します。デバイスのデフォルトを使用するには未設定のままにします。
- `silenceTimeoutMs` は、会話モードがユーザーの無音後に文字起こしを送信するまで待機する時間を制御します。未設定の場合、プラットフォームのデフォルト一時停止ウィンドウ（`macOS と Android では 700 ms、iOS では 900 ms`）が維持されます。
- `realtime.instructions` は、プロバイダー向けのシステム指示を OpenClaw の組み込みリアルタイムプロンプトに追加します。これにより、デフォルトの `openclaw_agent_consult` ガイダンスを失わずに音声スタイルを設定できます。
- `realtime.consultRouting` は、リアルタイムプロバイダーが `openclaw_agent_consult` なしで最終的なユーザー文字起こしを生成した場合の Gateway リレーフォールバックを制御します。`provider-direct` はプロバイダーの直接返信を保持し、`force-agent-consult` は確定したリクエストを OpenClaw 経由でルーティングします。

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他すべての設定キー
- [設定](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [設定例](/ja-JP/gateway/configuration-examples)
