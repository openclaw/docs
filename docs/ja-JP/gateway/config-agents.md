---
read_when:
    - エージェントのデフォルト設定を調整する（モデル、thinking、workspace、Heartbeat、メディア、Skills）
    - マルチエージェントルーティングとバインディングを設定する
    - セッション、メッセージ配信、talk モードの動作を調整する
summary: エージェントのデフォルト設定、マルチエージェントルーティング、セッション、メッセージ、talk 設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-04-25T18:17:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb090bad584cab0d22bc4788652f0fd6d7f2931be1fe40d3907f8ef2123a433b
    source_path: gateway/config-agents.md
    workflow: 15
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、`talk.*` 配下のエージェントスコープ設定キー。channels、tools、gateway ランタイム、その他の
トップレベルキーについては、[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

## エージェントのデフォルト設定

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システムプロンプトの Runtime 行に表示される任意のリポジトリルートです。未設定の場合、OpenClaw は workspace から上方向にたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないエージェント向けの、
任意のデフォルト Skill 許可リストです。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // デフォルトを置き換え
      { id: "locked-down", skills: [] }, // Skills なし
    ],
  },
}
```

- デフォルトで Skills を無制限にするには `agents.defaults.skills` を省略します。
- デフォルトを継承するには `agents.list[].skills` を省略します。
- Skills をなしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` のリストは、そのエージェントの最終セットです。
  デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

workspace bootstrap ファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrap ファイルをシステムプロンプトにいつ注入するかを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（assistant の応答完了後）では workspace bootstrap の再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と Compaction 後の再試行では引き続きコンテキストを再構築します。
- `"never"`: すべてのターンで workspace bootstrap と context-file の注入を無効にします。これは、プロンプトライフサイクルを完全に管理するエージェント（カスタムコンテキストエンジン、独自にコンテキストを構築するネイティブランタイム、または特殊な bootstrap 不要ワークフロー）でのみ使用してください。Heartbeat と Compaction 回復ターンでも注入をスキップします。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前の、workspace bootstrap ファイルごとの最大文字数です。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべての workspace bootstrap ファイルで注入される合計最大文字数です。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap コンテキストが切り詰められた際の、エージェントに見える警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システムプロンプトに警告テキストを一切注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに 1 回警告を注入します（推奨）。
- `"always"`: 切り詰めが存在する場合、毎回警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有マップ

OpenClaw には大容量のプロンプト/コンテキスト予算が複数あり、
それらは 1 つの汎用ノブにすべて流し込むのではなく、意図的にサブシステムごとに
分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常の workspace bootstrap 注入。
- `agents.defaults.startupContext.*`:
  最近の毎日
  `memory/*.md` ファイルを含む、1 回限りの `/new` および `/reset` 起動プレリュード。
- `skills.limits.*`:
  システムプロンプトに注入されるコンパクトな Skills リスト。
- `agents.defaults.contextLimits.*`:
  境界付きランタイム抜粋と、注入されるランタイム所有ブロック。
- `memory.qmd.limits.*`:
  インデックス化されたメモリ検索スニペットと注入サイズ。

あるエージェントだけが異なる
予算を必要とする場合にのみ、一致するエージェント単位のオーバーライドを使ってください:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

素の `/new` および `/reset`
実行時に注入される最初のターンの起動プレリュードを制御します。

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

境界付きランタイムコンテキストサーフェス用の共有デフォルトです。

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

- `memoryGetMaxChars`: 切り詰め
  メタデータと継続通知が追加される前の、デフォルトの `memory_get` 抜粋上限。
- `memoryGetDefaultLines`: `lines` が
  省略された場合の、デフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果と
  オーバーフロー回復に使われる、ライブのツール結果上限。
- `postCompactionMaxChars`: Compaction 後の
  リフレッシュ注入中に使われる AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブに対するエージェント単位のオーバーライドです。省略されたフィールドは
`agents.defaults.contextLimits` から継承します。

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

システムプロンプトに注入されるコンパクトな Skills リストのグローバル上限です。これは
必要に応じて `SKILL.md` ファイルを読み込む動作には影響しません。

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

Skills プロンプト予算に対するエージェント単位のオーバーライドです。

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

プロバイダー呼び出し前の transcript/tool 画像ブロックにおける、画像の長辺の最大ピクセルサイズです。
デフォルト: `1200`。

低い値にすると、通常はスクリーンショット中心の実行で vision token 使用量とリクエストペイロードサイズを削減できます。
高い値にすると、より多くの視覚的詳細を保持できます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキスト用のタイムゾーンです（メッセージタイムスタンプ用ではありません）。ホストのタイムゾーンにフォールバックします。

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
      params: { cacheRetention: "long" }, // グローバルなデフォルトのプロバイダーパラメータ
      embeddedHarness: {
        runtime: "pi", // pi | auto | 登録済み harness id、たとえば codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 文字列形式ではプライマリモデルのみを設定します。
  - オブジェクト形式では、プライマリに加えて順序付きのフェイルオーバーモデルを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - `image` ツールパスで、その vision-model 設定として使われます。
  - 選択済み/デフォルトのモデルが画像入力を受け付けられない場合のフォールバックルーティングにも使われます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共有画像生成機能、および将来の画像生成を行うすべてのツール/Plugin サーフェスで使われます。
  - 典型的な値: ネイティブな Gemini 画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-2`。
  - provider/model を直接選択する場合は、一致するプロバイダー認証も設定してください（たとえば `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証済みプロバイダーのデフォルトを推論できます。最初に現在のデフォルトプロバイダーを試し、その後で登録済みの残りの画像生成プロバイダーを provider-id 順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共有音楽生成機能と組み込みの `music_generate` ツールで使われます。
  - 典型的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.6`。
  - 省略した場合でも、`music_generate` は認証済みプロバイダーのデフォルトを推論できます。最初に現在のデフォルトプロバイダーを試し、その後で登録済みの残りの音楽生成プロバイダーを provider-id 順に試します。
  - provider/model を直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共有動画生成機能と組み込みの `video_generate` ツールで使われます。
  - 典型的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証済みプロバイダーのデフォルトを推論できます。最初に現在のデフォルトプロバイダーを試し、その後で登録済みの残りの動画生成プロバイダーを provider-id 順に試します。
  - provider/model を直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
  - 同梱の Qwen 動画生成プロバイダーは、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、およびプロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - `pdf` ツールでのモデルルーティングに使われます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後、解決済みの session/default model にフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルト PDF サイズ上限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮されるデフォルト最大ページ数。
- `verboseDefault`: エージェントのデフォルト verbose レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: エージェントのデフォルト elevated-output レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: API キーアクセスなら `openai/gpt-5.5`、Codex OAuth なら `openai-codex/gpt-5.5`）。provider を省略すると、OpenClaw は最初に alias を試し、次にその正確な model id に対する一意の configured-provider 一致を試し、それでもだめなら configured default provider にフォールバックします（非推奨の互換動作なので、明示的な `provider/model` を推奨します）。そのプロバイダーが設定済みのデフォルト model をもう公開していない場合、OpenClaw は古くなった削除済みプロバイダーのデフォルトを表面化する代わりに、最初に設定された provider/model にフォールバックします。
- `models`: `/model` 向けの、設定済み model catalog および許可リスト。各エントリには `alias`（ショートカット）と `params`（プロバイダー固有。たとえば `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`extra_body`/`extraBody`）を含められます。
  - 安全な編集: エントリ追加には `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使います。`config set` は、`--replace` を渡さない限り、既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダースコープの configure/onboarding フローは、選択したプロバイダーモデルをこのマップにマージし、すでに設定されている無関係なプロバイダーは保持します。
  - 直接の OpenAI Responses モデルでは、サーバーサイド Compaction が自動的に有効になります。`context_management` の注入を止めるには `params.responsesServerCompaction: false` を使い、しきい値を上書きするには `params.responsesCompactThreshold` を使ってください。[OpenAI サーバーサイド Compaction](/ja-JP/providers/openai#server-side-compaction-responses-api) を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルトプロバイダーパラメータ。`agents.defaults.params` に設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）は、`agents.defaults.models["provider/model"].params`（モデル単位）で上書きされ、その後 `agents.list[].params`（一致する agent id）がキー単位で上書きします。詳しくは [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `params.extra_body`/`params.extraBody`: OpenAI 互換プロキシ向けの `api: "openai-completions"` リクエストボディにマージされる高度なパススルー JSON。生成されたリクエストキーと衝突した場合は extra body が優先されます。ネイティブでない completions ルートでは、その後も OpenAI 専用の `store` が除去されます。
- `embeddedHarness`: デフォルトの低レベル埋め込みエージェントランタイムポリシー。runtime を省略した場合のデフォルトは OpenClaw Pi です。組み込み PI harness を強制するには `runtime: "pi"`、登録済み Plugin harness に対応モデルの実行を委ねるには `runtime: "auto"`、`runtime: "codex"` のような登録済み harness id を指定します。PI への自動フォールバックを無効にするには `fallback: "none"` を設定します。`codex` のような明示的な Plugin ランタイムは、同じオーバーライドスコープで `fallback: "pi"` を設定しない限り、デフォルトで失敗時に閉じます。model 参照は `provider/model` の正規形に保ち、Codex、Claude CLI、Gemini CLI、その他の実行バックエンドは、古い runtime provider prefix ではなく runtime 設定で選択してください。これは provider/model 選択とどう異なるかについては、[Agent runtimes](/ja-JP/concepts/agent-runtimes) を参照してください。
- これらのフィールドを変更する設定ライター（たとえば `/models set`、`/models set-image`、fallback の追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な場合は既存の fallback リストを保持します。
- `maxConcurrent`: session 間で並列に実行できる最大エージェント数（各 session 自体は引き続き直列化されます）。デフォルト: 4。

### `agents.defaults.embeddedHarness`

`embeddedHarness` は、埋め込みエージェントターンを実行する低レベル executor を制御します。
ほとんどのデプロイでは、デフォルトの OpenClaw Pi ランタイムのままにするべきです。
同梱の
Codex app-server harness のように、信頼できる Plugin がネイティブ harness を提供する場合に使います。考え方については、
[Agent runtimes](/ja-JP/concepts/agent-runtimes) を参照してください。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`、`"pi"`、または登録済み Plugin harness id。同梱の Codex Plugin は `codex` を登録します。
- `fallback`: `"pi"` または `"none"`。`runtime: "auto"` では、省略時の fallback は `"pi"` で、古い設定はどの Plugin harness も実行を引き受けない場合に引き続き PI を使えます。`runtime: "codex"` のような明示的な Plugin ランタイムモードでは、省略時の fallback は `"none"` なので、harness がない場合は PI を黙って使うのではなく失敗します。runtime オーバーライドはより広いスコープから fallback を継承しません。意図的にその互換フォールバックが必要な場合は、明示的 runtime と一緒に `fallback: "pi"` を設定してください。選択された Plugin harness の失敗は常に直接表面化します。
- 環境オーバーライド: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は `runtime` を上書きします。`OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` はそのプロセスの fallback を上書きします。
- Codex 専用デプロイでは、`model: "openai/gpt-5.5"` と `embeddedHarness.runtime: "codex"` を設定します。可読性のために `embeddedHarness.fallback: "none"` を明示的に設定しても構いません。これは明示的 Plugin ランタイムのデフォルトです。
- harness の選択は、最初の埋め込み実行後に session id ごとに固定されます。設定/環境の変更は新規またはリセット済み session にのみ影響し、既存の transcript には影響しません。transcript 履歴はあるが記録済み pin がない古い session は、PI に pin されたものとして扱われます。`/status` は有効な runtime を報告します。たとえば `Runtime: OpenClaw Pi Default` や `Runtime: OpenAI Codex` です。
- これは埋め込み chat harness のみを制御します。メディア生成、vision、PDF、音楽、動画、TTS は引き続きそれぞれの provider/model 設定を使います。

**組み込み alias 省略形**（model が `agents.defaults.models` にある場合のみ適用されます）:

| Alias | Model |
| ------------------- | ------------------------------------------ |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.5` または `openai-codex/gpt-5.5` |
| `gpt-mini` | `openai/gpt-5.4-mini` |
| `gpt-nano` | `openai/gpt-5.4-nano` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定した alias は常にデフォルトより優先されます。

Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的に thinking mode を有効にします。
Z.AI モデルは、ツール呼び出しストリーミングのためにデフォルトで `tool_stream` を有効にします。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude 4.6 モデルは、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` thinking を使います。

### `agents.defaults.cliBackends`

テキスト専用フォールバック実行用の任意の CLI バックエンドです（ツール呼び出しなし）。API プロバイダーが失敗したときのバックアップとして便利です。

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
          // または、CLI がプロンプトファイルフラグを受け付ける場合は systemPromptFileArg を使います。
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI バックエンドはテキスト優先で、ツールは常に無効です。
- `sessionArg` が設定されている場合は session をサポートします。
- `imageArg` がファイルパスを受け付ける場合は画像パススルーをサポートします。

### `agents.defaults.systemPromptOverride`

OpenClaw が組み立てたシステムプロンプト全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはエージェント単位（`agents.list[].systemPromptOverride`）で設定します。エージェント単位の値が優先され、空または空白のみの値は無視されます。制御されたプロンプト実験に便利です。

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

モデルファミリーごとに適用される、プロバイダー非依存のプロンプトオーバーレイです。GPT-5 ファミリーの model id は、プロバイダーをまたいで共有の動作契約を受け取ります。`personality` が制御するのは、フレンドリーな対話スタイルのレイヤーのみです。

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

- `"friendly"`（デフォルト）と `"on"` は、フレンドリーな対話スタイルのレイヤーを有効にします。
- `"off"` はフレンドリーなレイヤーのみを無効にします。タグ付き GPT-5 動作契約は引き続き有効です。
- 共有設定が未設定の場合、古い `plugins.entries.openai.config.personality` も引き続き読み取られます。

### `agents.defaults.heartbeat`

定期的な Heartbeat 実行です。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m で無効化
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // デフォルト: true。false にするとシステムプロンプトから Heartbeat セクションを省略
        lightContext: false, // デフォルト: false。true にすると workspace bootstrap ファイルでは HEARTBEAT.md のみ保持
        isolatedSession: false, // デフォルト: false。true にすると各 Heartbeat を新しい session で実行（会話履歴なし）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（デフォルト）| block
        target: "none", // デフォルト: none | オプション: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API キー認証）または `1h`（OAuth 認証）。無効にするには `0m` を設定します。
- `includeSystemPromptSection`: false の場合、システムプロンプトから Heartbeat セクションを省略し、bootstrap コンテキストへの `HEARTBEAT.md` 注入をスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。
- `timeoutSeconds`: 中断されるまでに Heartbeat エージェントターンに許可される最大秒数。未設定の場合は `agents.defaults.timeoutSeconds` を使います。
- `directPolicy`: direct/DM 配信ポリシー。`allow`（デフォルト）は direct-target 配信を許可します。`block` は direct-target 配信を抑止し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat 実行は軽量 bootstrap コンテキストを使い、workspace bootstrap ファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は過去の会話履歴なしの新しい session で実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat ごとのトークンコストを約 100K から約 2～5K トークンに削減します。
- エージェント単位: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、**そのエージェントだけ** が Heartbeat を実行します。
- Heartbeat は完全なエージェントターンを実行するため、間隔を短くすると消費トークンが増えます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 登録済み Compaction プロバイダー Plugin の id（任意）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom のとき使用
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入を無効化
        model: "openrouter/anthropic/claude-sonnet-4-6", // Compaction 専用の model オーバーライド（任意）
        notifyUser: true, // Compaction 開始時と完了時に短い通知を送信（デフォルト: false）
        memoryFlush: {
          enabled: true,
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
- `provider`: 登録済み Compaction プロバイダー Plugin の id。設定すると、組み込み LLM 要約の代わりにそのプロバイダーの `summarize()` が呼び出されます。失敗時は組み込みにフォールバックします。provider を設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClaw が中断するまでに 1 回の Compaction 操作に許可される最大秒数。デフォルト: `900`。
- `keepRecentTokens`: 最新の transcript 末尾をそのまま保持するための Pi cut-point 予算。手動 `/compact` は明示的に設定されている場合これを尊重し、それ以外では手動 Compaction はハードチェックポイントです。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は Compaction 要約時に、組み込みの不透明識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使う、任意のカスタム識別子保持テキスト。
- `qualityGuard`: safeguard 要約に対する不正形式出力時の再試行チェック。safeguard モードではデフォルトで有効です。監査をスキップするには `enabled: false` を設定します。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` で、無効化するには `[]` を設定します。未設定、または明示的にこのデフォルトペアに設定されている場合、古い `Every Session`/`Safety` 見出しもレガシーフォールバックとして受け付けられます。
- `model`: Compaction 要約専用の任意の `provider/model-id` オーバーライド。メイン session では 1 つの model を維持しつつ、Compaction 要約は別の model で実行したい場合に使います。未設定の場合、Compaction は session のプライマリモデルを使います。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時にユーザーへ短い通知を送ります（例: 「Compacting context...」および「Compaction complete」）。デフォルトでは無効で、Compaction を無言に保ちます。
- `memoryFlush`: 自動 Compaction 前に永続メモリを保存するためのサイレントなエージェントターン。workspace が読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから **古いツール結果** を刈り込みます。ディスク上の session 履歴は**変更しません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 期間（ms/s/m/h）、デフォルト単位: 分
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
- `ttl` は、次に刈り込みを再実行できる頻度を制御します（最後のキャッシュ接触後）。
- 刈り込みでは、まず大きすぎるツール結果をソフトトリムし、必要に応じて古いツール結果をハードクリアします。

**ソフトトリム** は先頭と末尾を保持し、中間に `...` を挿入します。

**ハードクリア** はツール結果全体をプレースホルダーに置き換えます。

注記:

- 画像ブロックはトリム/クリアされません。
- 比率はトークン数そのものではなく、文字数ベース（概算）です。
- assistant メッセージが `keepLastAssistants` 未満の場合、刈り込みはスキップされます。

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
      humanDelay: { mode: "natural" }, // off | natural | custom（minMs/maxMs を使用）
    },
  },
}
```

- Telegram 以外の channels では、ブロック返信を有効にするには明示的な `*.blockStreaming: true` が必要です。
- channel オーバーライド: `channels.<channel>.blockStreamingCoalesce`（およびアカウント単位バリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダムな待機。`natural` = 800～2500ms。エージェント単位のオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

### タイピングインジケーター

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

- デフォルト: direct チャット/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- session 単位のオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みエージェント向けの任意のサンドボックス化です。完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

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
          // SecretRefs / インライン内容もサポート:
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
- `ssh`: 汎用 SSH バックエンドのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` を選択した場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH target
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープ単位 workspace に使われる絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が実行時に一時ファイルへ実体化するインライン内容または SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH の host-key ポリシーノブ

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先
- `certificateData` は `certificateFile` より優先
- `knownHostsData` は `knownHostsFile` より優先
- SecretRef バックの `*Data` 値は、サンドボックス session 開始前にアクティブな secrets runtime スナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成後に、リモート workspace を 1 回だけシードする
- その後は、リモート SSH workspace を正規のものとして維持する
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングする
- リモートの変更を自動でホストへ同期しない
- サンドボックス browser container はサポートしない

**Workspace access:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープ単位 sandbox workspace
- `ro`: `/workspace` に sandbox workspace、`/agent` に読み取り専用でマウントされた agent workspace
- `rw`: `/workspace` に読み書き可能でマウントされた agent workspace

**Scope:**

- `session`: session 単位の container + workspace
- `agent`: agent ごとに 1 つの container + workspace（デフォルト）
- `shared`: 共有 container と workspace（session 間分離なし）

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
          policy: "strict", // 任意の OpenShell policy id
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

- `mirror`: 実行前にローカルからリモートへシードし、実行後に同期し戻す。ローカル workspace が正規のものとして維持される
- `remote`: サンドボックス作成時に 1 回だけリモートをシードし、その後はリモート workspace を正規のものとして維持する

`remote` モードでは、シード手順後に OpenClaw の外部で行われたホストローカル編集は、自動ではサンドボックスへ同期されません。
トランスポートは OpenShell サンドボックスへの SSH ですが、サンドボックスのライフサイクルと任意の mirror 同期は Plugin が管理します。

**`setupCommand`** は container 作成後に 1 回だけ実行されます（`sh -lc` 経由）。ネットワーク送信、書き込み可能ルート、root ユーザーが必要です。

**Containers のデフォルトは `network: "none"`** です。agent に送信アクセスが必要な場合は `"bridge"`（またはカスタム bridge network）に設定してください。
`"host"` はブロックされます。`"container:<id>"` は、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を設定しない限り、デフォルトでブロックされます（緊急用）。

**受信添付ファイル** は、アクティブ workspace の `media/inbound/*` にステージされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルおよびエージェント単位の bind はマージされます。

**サンドボックス browser**（`sandbox.browser.enabled`）: container 内の Chromium + CDP。noVNC URL はシステムプロンプトに注入されます。`openclaw.json` で `browser.enabled` を必要としません。
noVNC オブザーバーアクセスはデフォルトで VNC 認証を使い、OpenClaw は共有 URL にパスワードを露出する代わりに短命トークン URL を出力します。

- `allowHostControl: false`（デフォルト）は、サンドボックス化 session がホスト browser を対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用 bridge network）です。グローバル bridge 接続を明示的に望む場合にのみ `bridge` を設定してください。
- `cdpSourceRange` は、container エッジでの CDP 受信元を CIDR 範囲に制限するための任意設定です（例: `172.21.0.1/32`）。
- `sandbox.browser.binds` は追加のホストディレクトリを sandbox browser container のみにマウントします。設定された場合（`[]` を含む）、browser container では `docker.binds` を置き換えます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` に定義され、container ホスト向けに調整されています:
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
    デフォルトで有効で、WebGL/3D 利用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - ワークフローが拡張機能に依存する場合は、`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で
    拡張機能を再有効化できます。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    デフォルト process 制限を使うには `0` を設定してください。
  - 加えて、`noSandbox` が有効な場合は `--no-sandbox`。
  - デフォルトは container image のベースラインです。container デフォルトを変更するには、
    カスタム entrypoint を持つカスタム browser image を使ってください。

</Accordion>

Browser のサンドボックス化と `sandbox.docker.binds` は Docker 専用です。

イメージをビルドします:

```bash
scripts/sandbox-setup.sh           # メイン sandbox image
scripts/sandbox-browser-setup.sh   # 任意の browser image
```

### `agents.list`（エージェント単位のオーバーライド）

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
        thinkingDefault: "high", // エージェント単位の thinking レベルオーバーライド
        reasoningDefault: "on", // エージェント単位の reasoning 表示オーバーライド
        fastModeDefault: false, // エージェント単位の fast mode オーバーライド
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 一致する defaults.models params をキー単位で上書き
        skills: ["docs-search"], // 設定時は agents.defaults.skills を置き換え
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

- `id`: 安定した agent id（必須）。
- `default`: 複数設定されている場合は最初のものが勝ちます（警告を記録）。何も設定されていない場合、最初のリストエントリがデフォルトです。
- `model`: 文字列形式は `primary` のみを上書きし、オブジェクト形式 `{ primary, fallbacks }` は両方を上書きします（`[]` でグローバル fallback を無効化）。`primary` のみを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、引き続きデフォルト fallback を継承します。
- `params`: エージェント単位のストリーム params で、`agents.defaults.models` の選択された model エントリにマージされます。`cacheRetention`、`temperature`、`maxTokens` のようなエージェント固有オーバーライドに使い、model catalog 全体の重複を避けます。
- `skills`: 任意のエージェント単位 Skill 許可リスト。省略時は、設定されていれば agent は `agents.defaults.skills` を継承します。明示的なリストはマージではなくデフォルトを置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェント単位デフォルト thinking レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージ単位または session 単位のオーバーライドが設定されていない場合、この agent の `agents.defaults.thinkingDefault` を上書きします。どの値が有効かは選択された provider/model プロファイルによって決まります。Google Gemini では、`adaptive` はプロバイダー管理の動的 thinking を維持します（Gemini 3/3.1 では `thinkingLevel` 省略、Gemini 2.5 では `thinkingBudget: -1`）。
- `reasoningDefault`: 任意のエージェント単位デフォルト reasoning 表示（`on | off | stream`）。メッセージ単位または session 単位の reasoning オーバーライドが設定されていない場合に適用されます。
- `fastModeDefault`: 任意のエージェント単位デフォルト fast mode（`true | false`）。メッセージ単位または session 単位の fast-mode オーバーライドが設定されていない場合に適用されます。
- `embeddedHarness`: 任意のエージェント単位の低レベル harness ポリシーオーバーライド。他の agent は `auto` モードでデフォルト PI fallback を維持しつつ、1 つの agent を Codex 専用にするには `{ runtime: "codex" }` を使います。
- `runtime`: 任意のエージェント単位 runtime 記述子。agent がデフォルトで ACP harness session を使う場合は、`type: "acp"` と `runtime.acp` デフォルト（`agent`、`backend`、`mode`、`cwd`）を使います。
- `identity.avatar`: workspace 相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` 用の agent id 許可リスト（`["*"]` = 任意、デフォルト: 同じ agent のみ）。
- サンドボックス継承ガード: 要求元 session がサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行される target を拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制。デフォルト: false）。

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

### Binding の一致フィールド

- `type`（任意）: 通常ルーティング用の `route`（type 省略時のデフォルト）、永続 ACP 会話 binding 用の `acp`
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意の account、省略 = デフォルト account）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。channel 固有）
- `acp`（任意。`type: "acp"` のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致、peer/guild/team なし）
5. `match.accountId: "*"`（channel 全体）
6. デフォルト agent

各 tier 内では、最初に一致した `bindings` エントリが勝ちます。

`type: "acp"` エントリでは、OpenClaw は正確な会話 ID（`match.channel` + account + `match.peer.id`）で解決し、上記の route binding tier 順序は使いません。

### エージェント単位アクセスプロファイル

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

<Accordion title="読み取り専用ツール + workspace">

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
    parentForkMaxTokens: 100000, // このトークン数を超える親スレッド fork はスキップされる（0 で無効化）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 期間または false
      maxDiskBytes: "500mb", // 任意のハード予算
      highWaterBytes: "400mb", // 任意のクリーンアップ目標
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 非アクティブ時の自動フォーカス解除までのデフォルト時間（0 で無効）
      maxAgeHours: 0, // ハード最大存続時間のデフォルト時間（0 で無効）
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

- **`scope`**: グループチャットコンテキスト向けの基本 session グループ化戦略。
  - `per-sender`（デフォルト）: channel コンテキスト内で、各送信者ごとに分離された session を持ちます。
  - `global`: channel コンテキスト内の全参加者が 1 つの session を共有します（共有コンテキストを意図している場合にのみ使用）。
- **`dmScope`**: DM をどのようにグループ化するか。
  - `main`: すべての DM がメイン session を共有します。
  - `per-peer`: channels をまたいで送信者 id ごとに分離します。
  - `per-channel-peer`: channel + 送信者ごとに分離します（複数ユーザーの受信箱に推奨）。
  - `per-account-channel-peer`: account + channel + 送信者ごとに分離します（複数 account に推奨）。
- **`identityLinks`**: channels をまたいだ session 共有のため、正規 id を provider 接頭辞付き peer にマップします。
- **`reset`**: 主要なリセットポリシー。`daily` はローカル時刻の `atHour` にリセットし、`idle` は `idleMinutes` 後にリセットします。両方設定されている場合は、先に期限切れになる方が優先されます。
- **`resetByType`**: タイプ単位のオーバーライド（`direct`、`group`、`thread`）。レガシーの `dm` は `direct` の alias として受け付けられます。
- **`parentForkMaxTokens`**: fork された thread session を作成するときに許可される親 session `totalTokens` の最大値（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超えている場合、OpenClaw は親 transcript 履歴を継承せず、新しい thread session を開始します。
  - このガードを無効化して常に親 fork を許可するには `0` を設定します。
- **`mainKey`**: レガシーフィールド。ランタイムはメイン direct-chat バケットに常に `"main"` を使います。
- **`agentToAgent.maxPingPongTurns`**: agent 間のやり取りにおける、agent 同士の返信往復の最大ターン数（整数、範囲: `0`–`5`）。`0` は ping-pong 連鎖を無効化します。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、レガシーの `dm` alias あり）、`keyPrefix`、または `rawKeyPrefix` で一致させます。最初の deny が優先されます。
- **`maintenance`**: session-store のクリーンアップと保持制御。
  - `mode`: `warn` は警告のみを出し、`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの経過時間しきい値（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内の最大エントリ数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたらローテーションします（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript アーカイブの保持期間。デフォルトは `pruneAfter` で、無効化するには `false` を設定します。
  - `maxDiskBytes`: 任意の sessions ディレクトリのディスク予算。`warn` モードでは警告を記録し、`enforce` モードでは最も古いアーティファクト/session から削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは `maxDiskBytes` の `80%`。
- **`threadBindings`**: thread にバインドされた session 機能のグローバルデフォルト。
  - `enabled`: マスターのデフォルトスイッチ（プロバイダーはオーバーライド可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時の自動フォーカス解除までのデフォルト時間（`0` で無効。プロバイダーはオーバーライド可能）
  - `maxAgeHours`: ハード最大存続時間のデフォルト時間（`0` で無効。プロバイダーはオーバーライド可能）

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // または "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
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

### 応答プレフィックス

channel/account 単位のオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順（最も具体的なものが優先）: account → channel → グローバル。`""` は無効化してカスケードを停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| 変数 | 説明 | 例 |
| ----------------- | ---------------------- | --------------------------- |
| `{model}` | 短いモデル名 | `claude-opus-4-6` |
| `{modelFull}` | 完全なモデル識別子 | `anthropic/claude-opus-4-6` |
| `{provider}` | プロバイダー名 | `anthropic` |
| `{thinkingLevel}` | 現在の thinking レベル | `high`、`low`、`off` |
| `{identity.name}` | エージェント identity 名 | （`"auto"` と同じ） |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` の alias です。

### 確認リアクション

- デフォルトはアクティブな agent の `identity.emoji`、それ以外は `"👀"` です。無効化するには `""` を設定します。
- channel 単位のオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順: account → channel → `messages.ackReaction` → identity フォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram で返信後に ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram でライフサイクル status reaction を有効にします。
  Slack と Discord では、未設定の場合、ack reaction が有効なら status reaction も有効のままです。
  Telegram では、ライフサイクル status reaction を有効にするには明示的に `true` を設定してください。

### 受信 debounce

同じ送信者からの連続するテキストのみのメッセージを 1 つの agent turn にまとめます。メディア/添付ファイルは即座にフラッシュされます。制御コマンドは debounce をバイパスします。

### TTS

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

- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、`tagged`。`/tts on|off` はローカル設定を上書きでき、`/tts status` は有効な状態を表示します。
- `summaryModel` は自動要約用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（オプトイン）です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- 同梱の音声プロバイダーは Plugin が管理します。`plugins.allow` が設定されている場合は、使用したい各 TTS プロバイダー Plugin を含めてください。たとえば Edge TTS 用の `microsoft` です。レガシーの `edge` provider id は `microsoft` の alias として受け付けられます。
- `providers.openai.baseUrl` は OpenAI TTS エンドポイントを上書きします。解決順は設定、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `providers.openai.baseUrl` が OpenAI 以外のエンドポイントを指している場合、OpenClaw はそれを OpenAI 互換 TTS サーバーとして扱い、model/voice の検証を緩和します。

---

## talk

Talk モード（macOS/iOS/Android）のデフォルトです。

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
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` は、複数の Talk プロバイダーが設定されている場合、`talk.providers` 内のキーと一致する必要があります。
- レガシーのフラットな Talk キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用で、自動的に `talk.providers.<provider>` に移行されます。
- Voice ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` は平文文字列または SecretRef オブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` を使うと、Talk ディレクティブでフレンドリー名を使えます。
- `providers.mlx.modelId` は、macOS ローカル MLX helper が使う Hugging Face リポジトリを選択します。省略時、macOS は `mlx-community/Soprano-80M-bf16` を使います。
- macOS の MLX 再生は、存在する場合は同梱の `openclaw-mlx-tts` helper、存在しない場合は `PATH` 上の実行ファイルを通じて実行されます。開発用には `OPENCLAW_MLX_TTS_BIN` で helper パスを上書きします。
- `silenceTimeoutMs` は、Talk モードがユーザーの無音後に transcript を送信するまで待機する時間を制御します。未設定の場合、プラットフォームデフォルトの待機ウィンドウが維持されます（`macOS と Android では 700 ms、iOS では 900 ms`）。

---

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference) — その他すべての設定キー
- [設定](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [設定例](/ja-JP/gateway/configuration-examples)
