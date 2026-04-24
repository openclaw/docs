---
read_when:
    - エージェントのデフォルト設定を調整する場合（モデル、thinking、ワークスペース、Heartbeat、メディア、Skills）
    - マルチエージェントのルーティングとバインディングを設定する場合
    - session、メッセージ配信、talk モードの動作を調整する場合
summary: エージェントのデフォルト設定、マルチエージェントルーティング、session、messages、talk の設定
title: 設定 — エージェント
x-i18n:
    generated_at: "2026-04-24T04:56:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: de1587358404808b4a11a92a9392d7cc5bdd2b599773f8a0f7b4331551841991
    source_path: gateway/config-agents.md
    workflow: 15
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*`、`talk.*` 配下のエージェントスコープ設定キーです。チャンネル、ツール、Gateway ランタイム、その他の
トップレベルキーについては、[Configuration reference](/ja-JP/gateway/configuration-reference) を参照してください。

## エージェントのデフォルト設定

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

`agents.list[].skills` を設定していないエージェント向けの、任意のデフォルト Skill 許可リストです。

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
- Skills を使わない場合は `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストは、そのエージェントに対する最終セットであり、
  デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

ワークスペースのブートストラップファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

ワークスペースのブートストラップファイルをシステムプロンプトへ注入するタイミングを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（アシスタント応答完了後）では、ワークスペースブートストラップの再注入をスキップし、プロンプトサイズを削減します。Heartbeat 実行と post-compaction 再試行では引き続きコンテキストを再構築します。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前の、ワークスペースブートストラップファイルごとの最大文字数です。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペースブートストラップファイルで注入される総文字数の最大値です。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップコンテキストが切り詰められたときの、エージェント可視の警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システムプロンプトに警告テキストを注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに 1 回だけ警告を注入します（推奨）。
- `"always"`: 切り詰めが存在する場合、毎回の実行で警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有マップ

OpenClaw には高ボリュームのプロンプト/コンテキスト予算が複数あり、
それらは 1 つの汎用ノブにまとめるのではなく、意図的にサブシステムごとに分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常のワークスペースブートストラップ注入。
- `agents.defaults.startupContext.*`:
  ワンショットの `/new` と `/reset` の起動プレリュード。最近の
  `memory/*.md` ファイルも含みます。
- `skills.limits.*`:
  システムプロンプトに注入されるコンパクトな Skills 一覧。
- `agents.defaults.contextLimits.*`:
  境界付きランタイム抜粋と、ランタイム所有の注入ブロック。
- `memory.qmd.limits.*`:
  インデックス化された memory-search スニペットと注入サイズ。

あるエージェントだけが異なる
予算を必要とする場合にのみ、対応するエージェントごとの override を使用してください。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

生の `/new` と `/reset`
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
  省略されたときの、デフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果と
  オーバーフロー回復に使われるライブツール結果の上限。
- `postCompactionMaxChars`: post-compaction
  更新注入中に使われる AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブのエージェントごとの override です。省略されたフィールドは
`agents.defaults.contextLimits` から継承されます。

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

システムプロンプトに注入されるコンパクトな Skills 一覧のグローバル上限です。これは
必要時に `SKILL.md` ファイルを読むことには影響しません。

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

Skills プロンプト予算のエージェントごとの override です。

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

プロバイダー呼び出し前に transcript/tool の画像ブロックで許可される、最長辺の最大ピクセルサイズです。
デフォルト: `1200`。

低い値では通常、スクリーンショットの多い実行で vision-token 使用量とリクエストペイロードサイズが減少します。
高い値では、より多くの視覚的詳細が保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキスト用のタイムゾーンです（メッセージタイムスタンプ用ではありません）。ホストタイムゾーンにフォールバックします。

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
      params: { cacheRetention: "long" }, // グローバルなデフォルトプロバイダーパラメータ
      embeddedHarness: {
        runtime: "auto", // auto | pi | 登録済み harness id（例: codex）
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 文字列形式はプライマリモデルのみを設定します。
  - オブジェクト形式はプライマリと順序付きフェイルオーバーモデルを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `image` ツール経路で、その vision-model 設定として使われます。
  - 選択された/デフォルトのモデルが画像入力を受け付けられない場合のフォールバックルーティングにも使われます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有画像生成機能と、将来の画像生成を行うツール/Plugin サーフェスで使われます。
  - 一般的な値: ネイティブ Gemini 画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-2`。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証も設定してください（たとえば `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/gpt-image-2` には `OPENAI_API_KEY` または OpenAI Codex OAuth、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は認証付きプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、登録済みの残りの画像生成プロバイダーを provider-id 順で試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有音楽生成機能と組み込みの `music_generate` ツールで使われます。
  - 一般的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、`minimax/music-2.5+`。
  - 省略した場合でも、`music_generate` は認証付きプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、登録済みの残りの音楽生成プロバイダーを provider-id 順で試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有動画生成機能と組み込みの `video_generate` ツールで使われます。
  - 一般的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、`qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は認証付きプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、登録済みの残りの動画生成プロバイダーを provider-id 順で試します。
  - プロバイダー/モデルを直接選択する場合は、一致するプロバイダー認証/API キーも設定してください。
  - バンドル済みの Qwen 動画生成プロバイダーは、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、およびプロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `pdf` ツールのモデルルーティングに使われます。
  - 省略した場合、PDF ツールは `imageModel`、その次に解決済みのセッション/デフォルトモデルへフォールバックします。
- `pdfMaxBytesMb`: `pdf` ツールで呼び出し時に `maxBytesMb` が渡されない場合の、デフォルト PDF サイズ上限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮するデフォルト最大ページ数。
- `verboseDefault`: エージェントのデフォルト verbose レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: エージェントのデフォルト elevated-output レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: API キーアクセスには `openai/gpt-5.4`、Codex OAuth には `openai-codex/gpt-5.5`）。プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に対する一意な configured-provider 一致を試し、それでもだめなら設定済みのデフォルトプロバイダーにフォールバックします（非推奨の互換動作なので、明示的な `provider/model` を推奨します）。そのプロバイダーが設定済みデフォルトモデルをもう提供していない場合、OpenClaw は古い削除済みプロバイダーデフォルトを表面化する代わりに、最初の configured provider/model へフォールバックします。
- `models`: `/model` 用の設定済みモデルカタログと許可リスト。各エントリには `alias`（ショートカット）と `params`（プロバイダー固有。たとえば `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`）を含められます。
  - 安全な編集: エントリを追加するには `openclaw config set agents.defaults.models '<json>' --strict-json --merge` を使います。`config set` は、`--replace` を渡さない限り、既存の許可リストエントリを削除する置換を拒否します。
  - プロバイダースコープの configure/オンボーディングフローは、選択したプロバイダーモデルをこのマップにマージし、すでに設定されている無関係なプロバイダーは保持します。
  - 直接の OpenAI Responses モデルでは、サーバー側 Compaction が自動的に有効になります。`context_management` の注入を止めるには `params.responsesServerCompaction: false` を、しきい値を上書きするには `params.responsesCompactThreshold` を使います。[OpenAI server-side compaction](/ja-JP/providers/openai#server-side-compaction-responses-api) を参照してください。
- `params`: すべてのモデルに適用されるグローバルなデフォルトプロバイダーパラメータ。`agents.defaults.params` に設定します（例 `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（config）: `agents.defaults.params`（グローバルベース）が `agents.defaults.models["provider/model"].params`（モデルごと）で上書きされ、その後 `agents.list[].params`（一致するエージェント ID）がキーごとに上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `embeddedHarness`: デフォルトの低レベル埋め込みエージェントランタイムポリシー。`runtime: "auto"` を使うと、登録済み Plugin harness がサポート対象モデルを引き受け、`runtime: "pi"` で組み込み PI harness を強制し、`runtime: "codex"` のような登録済み harness id も指定できます。自動 PI フォールバックを無効にするには `fallback: "none"` を設定します。
- これらのフィールドを変更する config writer（たとえば `/models set`、`/models set-image`、フォールバックの追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な限り既存のフォールバックリストを保持します。
- `maxConcurrent`: セッションをまたぐ並列エージェント実行の最大数（各セッションは引き続き直列化されます）。デフォルト: 4。

### `agents.defaults.embeddedHarness`

`embeddedHarness` は、埋め込みエージェントターンを実行する低レベル executor を制御します。
ほとんどのデプロイでは、デフォルトの `{ runtime: "auto", fallback: "pi" }` のままにしてください。
これは、バンドル済みの
Codex app-server harness のように、信頼された Plugin がネイティブ harness を提供する場合に使います。

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

- `runtime`: `"auto"`、`"pi"`、または登録済み Plugin harness id。バンドル済み Codex Plugin は `codex` を登録します。
- `fallback`: `"pi"` または `"none"`。`"pi"` は、Plugin harness が選択されない場合の互換フォールバックとして組み込み PI harness を維持します。`"none"`` は、未登録または未対応の Plugin harness 選択時に、黙って PI を使うのではなく失敗させます。選択された Plugin harness の失敗は常に直接表面化されます。
- 環境変数による上書き: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は `runtime` を上書きします。`OPENCLAW_AGENT_HARNESS_FALLBACK=none` はそのプロセスでの PI フォールバックを無効にします。
- Codex 専用デプロイでは、`model: "openai/gpt-5.5"`、`embeddedHarness.runtime: "codex"`、`embeddedHarness.fallback: "none"` を設定してください。
- Harness の選択は、最初の埋め込み実行後にセッション ID ごとに固定されます。config/env の変更は、新規またはリセットされたセッションには影響しますが、既存の transcript には影響しません。transcript 履歴はあるが記録済みの固定がないレガシーセッションは、PI 固定として扱われます。`/status` では、`Fast` の横に `codex` のような非 PI harness id が表示されます。
- これは埋め込みチャット harness だけを制御します。メディア生成、vision、PDF、音楽、動画、TTS は引き続きそれぞれのプロバイダー/モデル設定を使います。

**組み込みエイリアス省略形**（モデルが `agents.defaults.models` にある場合のみ適用）:

| Alias               | Model                                              |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` または設定済み Codex OAuth GPT-5.5 |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

設定したエイリアスは常にデフォルトより優先されます。

Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的に thinking mode を有効にします。
Z.AI モデルは、ツール呼び出しストリーミングのためにデフォルトで `tool_stream` を有効にします。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude 4.6 モデルは、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` thinking を使います。

### `agents.defaults.cliBackends`

テキスト専用フォールバック実行用の任意の CLI バックエンドです（ツール呼び出しなし）。API プロバイダーが失敗したときのバックアップとして便利です。
__OC_I18N_900018__
- CLI バックエンドはテキスト優先で、ツールは常に無効です。
- `sessionArg` が設定されている場合、セッションをサポートします。
- `imageArg` がファイルパスを受け付ける場合、画像のパススルーをサポートします。

### `agents.defaults.systemPromptOverride`

OpenClaw が組み立てたシステムプロンプト全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはエージェントごと（`agents.list[].systemPromptOverride`）で設定します。エージェントごとの値が優先されます。空文字列または空白のみの値は無視されます。制御されたプロンプト実験に便利です。
__OC_I18N_900019__
### `agents.defaults.promptOverlays`

モデルファミリーごとに適用される、プロバイダー非依存のプロンプト overlay です。GPT-5 ファミリーの model id には、プロバイダーをまたいだ共有の挙動契約が適用されます。`personality` は、フレンドリーな interaction-style レイヤーのみを制御します。
__OC_I18N_900020__
- `"friendly"`（デフォルト）と `"on"` は、フレンドリーな interaction-style レイヤーを有効にします。
- `"off"` はフレンドリーなレイヤーのみを無効にします。タグ付き GPT-5 の挙動契約は引き続き有効です。
- レガシーな `plugins.entries.openai.config.personality` は、この共有設定が未設定の場合に引き続き読み取られます。

### `agents.defaults.heartbeat`

定期的な Heartbeat 実行です。
__OC_I18N_900021__
- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API キー認証）または `1h`（OAuth 認証）。無効にするには `0m` に設定します。
- `includeSystemPromptSection`: false の場合、システムプロンプトから Heartbeat セクションを省略し、ブートストラップコンテキストへの `HEARTBEAT.md` 注入をスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑制します。
- `timeoutSeconds`: 中断される前に Heartbeat エージェントターンに許可される最大秒数。未設定の場合は `agents.defaults.timeoutSeconds` を使います。
- `directPolicy`: direct/DM 配信ポリシー。`allow`（デフォルト）は direct-target 配信を許可します。`block` は direct-target 配信を抑制し、`reason=dm-blocked` を出します。
- `lightContext`: true の場合、Heartbeat 実行は軽量ブートストラップコンテキストを使用し、ワークスペースブートストラップファイルのうち `HEARTBEAT.md` だけを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は会話履歴なしの新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat ごとのトークンコストを約 100K から約 2–5K トークンに削減します。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、Heartbeat を実行するのは**そのエージェントだけ**になります。
- Heartbeat は完全なエージェントターンを実行します。短い間隔ほどトークン消費が増えます。

### `agents.defaults.compaction`
__OC_I18N_900022__
- `mode`: `default` または `safeguard`（長い履歴向けのチャンク化要約）。[Compaction](/concepts/compaction) を参照してください。
- `provider`: 登録済み Compaction provider Plugin の id。設定すると、組み込み LLM 要約の代わりに、その provider の `summarize()` が呼び出されます。失敗時は組み込みにフォールバックします。provider を設定すると `mode: "safeguard"` が強制されます。[Compaction](/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClaw が中断するまでの 1 回の Compaction 操作の最大秒数。デフォルト: `900`。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、Compaction 要約中に組み込みの不透明識別子保持ガイダンスを前置します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使われる、任意のカスタム識別子保持テキスト。
- `postCompactionSections`: Compaction 後に再注入する任意の AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]`。再注入を無効にするには `[]` を設定します。未設定、または明示的にそのデフォルトの組を設定した場合、古い `Every Session`/`Safety` 見出しもレガシーフォールバックとして受け入れられます。
- `model`: Compaction 要約専用の任意の `provider/model-id` 上書き。メインセッションは 1 つのモデルのままにしつつ、Compaction 要約を別のモデルで実行したい場合に使います。未設定の場合、Compaction はセッションのプライマリモデルを使います。
- `notifyUser`: `true` の場合、Compaction の開始時と完了時にユーザーへ短い通知を送信します（たとえば「Compacting context...」「Compaction complete」）。Compaction を無言に保つため、デフォルトでは無効です。
- `memoryFlush`: 耐久性のあるメモリを保存するために、自動 Compaction 前に行う無言のエージェントターン。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM へ送る前に、メモリ上の**古いツール結果**を刈り込みます。ディスク上のセッション履歴は変更**しません**。
__OC_I18N_900023__
<Accordion title="cache-ttl モードの動作">

- `mode: "cache-ttl"` で刈り込みパスを有効にします。
- `ttl` は、最後のキャッシュタッチ後に、次にいつ再び刈り込みを実行できるかを制御します。
- 刈り込みは、必要に応じてまず大きすぎるツール結果をソフトトリムし、その後、より古いツール結果をハードクリアします。

**ソフトトリム** は先頭と末尾を保持し、中間に `...` を挿入します。

**ハードクリア** はツール結果全体をプレースホルダーに置き換えます。

注:

- 画像ブロックはトリム/クリアされません。
- 比率は厳密なトークン数ではなく、文字数ベース（概算）です。
- `keepLastAssistants` 個未満の assistant メッセージしか存在しない場合、刈り込みはスキップされます。

</Accordion>

動作の詳細は [Session Pruning](/concepts/session-pruning) を参照してください。

### ブロックストリーミング
__OC_I18N_900024__
- Telegram 以外のチャンネルでは、ブロック返信を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャンネル上書き: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダム化された待機。`natural` = 800–2500ms。エージェントごとの上書き: `agents.list[].humanDelay`。

動作とチャンク分割の詳細は [Streaming](/concepts/streaming) を参照してください。

### 入力中インジケーター
__OC_I18N_900025__
- デフォルト: direct chat/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- セッションごとの上書き: `session.typingMode`, `session.typingIntervalSeconds`。

[Typing Indicators](/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みエージェント向けの任意のサンドボックス化です。完全なガイドは [Sandboxing](/gateway/sandboxing) を参照してください。
__OC_I18N_900026__
<Accordion title="サンドボックスの詳細">

**バックエンド:**

- `docker`: ローカル Docker ランタイム（デフォルト）
- `ssh`: 汎用 SSH ベースのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` を選択した場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移ります。

**SSH バックエンド設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのワークスペースに使われる絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw がランタイム時に一時ファイルへ実体化するインライン内容または SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH のホストキー方針ノブ

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先
- `certificateData` は `certificateFile` より優先
- `knownHostsData` は `knownHostsFile` より優先
- SecretRef に支えられた `*Data` 値は、サンドボックスセッション開始前にアクティブなシークレットランタイムスナップショットから解決されます

**SSH バックエンドの動作:**

- 作成または再作成後に、リモートワークスペースを一度シードする
- その後、リモート SSH ワークスペースを正規状態として維持する
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティングする
- リモート変更を自動ではホストへ同期しない
- サンドボックス browser コンテナはサポートしない

**ワークスペースアクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのサンドボックスワークスペース
- `ro`: `/workspace` にあるサンドボックスワークスペース、エージェントワークスペースは `/agent` に読み取り専用でマウント
- `rw`: エージェントワークスペースを `/workspace` に読み書き可能でマウント

**スコープ:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース（デフォルト）
- `shared`: 共有コンテナと共有ワークスペース（セッション間の分離なし）

**OpenShell Plugin 設定:**
__OC_I18N_900027__
**OpenShell モード:**

- `mirror`: exec 前にローカルからリモートへシードし、exec 後に同期を戻します。ローカルワークスペースが正となります
- `remote`: サンドボックス作成時に一度だけリモートへシードし、その後はリモートワークスペースを正として維持します

`remote` モードでは、シードステップ後に OpenClaw の外で行われたホストローカル編集は、自動ではサンドボックスに同期されません。
トランスポートは OpenShell サンドボックスへの SSH ですが、サンドボックスのライフサイクルと任意の mirror 同期は Plugin が管理します。

**`setupCommand`** はコンテナ作成後に一度だけ（`sh -lc` 経由で）実行されます。ネットワーク外向き通信、書き込み可能なルート、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントに外向きアクセスが必要な場合は `"bridge"`（またはカスタム bridge ネットワーク）に設定してください。
`"host"` はブロックされます。`"container:<id>"` も、明示的に
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を設定しない限り（非常手段）、デフォルトではブロックされます。

**受信添付ファイル** は、アクティブワークスペース内の `media/inbound/*` にステージされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルとエージェントごとの bind はマージされます。

**サンドボックス化された browser**（`sandbox.browser.enabled`）: コンテナ内で Chromium + CDP を実行します。noVNC URL はシステムプロンプトに注入されます。`openclaw.json` で `browser.enabled` は不要です。
noVNC のオブザーバーアクセスはデフォルトで VNC 認証を使用し、OpenClaw は共有 URL にパスワードを露出する代わりに短命トークン URL を発行します。

- `allowHostControl: false`（デフォルト）は、サンドボックス化セッションがホスト browser を対象にするのをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用 bridge ネットワーク）です。グローバル bridge 接続が明示的に必要な場合のみ `bridge` に設定してください。
- `cdpSourceRange` は、任意で CDP ingress をコンテナ境界で CIDR 範囲に制限します（例 `172.21.0.1/32`）。
- `sandbox.browser.binds` は、追加のホストディレクトリをサンドボックス browser コンテナにのみマウントします。設定された場合（`[]` を含む）、browser コンテナでは `docker.binds` を置き換えます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義されており、コンテナホスト向けに調整されています:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT から導出>`
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
    デフォルトで有効で、WebGL/3D 利用に必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローで必要な場合に
    拡張機能を再有効化します。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    デフォルトプロセス上限を使うには `0` を設定します。
  - さらに、`noSandbox` が有効な場合は `--no-sandbox` と `--disable-setuid-sandbox`。
  - デフォルトはコンテナイメージのベースラインです。コンテナデフォルトを変更するには、カスタム
    entrypoint を持つカスタム browser イメージを使用してください。

</Accordion>

browser のサンドボックス化と `sandbox.docker.binds` は Docker 専用です。

イメージをビルドするには:
__OC_I18N_900028__
### `agents.list`（エージェントごとの上書き）
__OC_I18N_900029__
- `id`: 安定したエージェント ID（必須）。
- `default`: 複数設定されている場合は最初のものが有効になります（警告を記録）。何も設定されていない場合、リストの最初のエントリがデフォルトです。
- `model`: 文字列形式は `primary` のみを上書きし、オブジェクト形式 `{ primary, fallbacks }` は両方を上書きします（`[]` でグローバルフォールバックを無効化）。`primary` だけを上書きする Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトフォールバックを引き続き継承します。
- `params`: `agents.defaults.models` の選択されたモデルエントリにマージされる、エージェントごとのストリーム params。モデルカタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` のようなエージェント固有の上書きに使います。
- `skills`: 任意のエージェントごとの Skill 許可リスト。省略した場合、設定されていれば `agents.defaults.skills` を継承します。明示的なリストはマージではなくデフォルトを置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: 任意のエージェントごとのデフォルト thinking レベル（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージごとまたはセッションの上書きがない場合、このエージェントでは `agents.defaults.thinkingDefault` を上書きします。
- `reasoningDefault`: 任意のエージェントごとのデフォルト reasoning 可視性（`on | off | stream`）。メッセージごとまたはセッションの reasoning 上書きがない場合に適用されます。
- `fastModeDefault`: 任意のエージェントごとの fast mode デフォルト（`true | false`）。メッセージごとまたはセッションの fast-mode 上書きがない場合に適用されます。
- `embeddedHarness`: 任意のエージェントごとの低レベル harness ポリシー上書き。1 つのエージェントだけを Codex 専用にし、他のエージェントはデフォルトの PI フォールバックを維持するには `{ runtime: "codex", fallback: "none" }` を使います。
- `runtime`: 任意のエージェントごとのランタイム記述子。エージェントがデフォルトで ACP harness セッションを使うべき場合は、`type: "acp"` と `runtime.acp` デフォルト（`agent`、`backend`、`mode`、`cwd`）を使います。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します: `ackReaction` は `emoji` から、`mentionPatterns` は `name`/`emoji` から。
- `subagents.allowAgents`: `sessions_spawn` 用のエージェント ID 許可リスト（`["*"]` = 任意。デフォルト: 同じエージェントのみ）。
- サンドボックス継承ガード: 依頼元セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制。デフォルト: false）。

---

## マルチエージェントルーティング

1 つの Gateway 内で複数の分離されたエージェントを実行します。[Multi-Agent](/concepts/multi-agent) を参照してください。
__OC_I18N_900030__
### バインディングの match フィールド

- `type`（任意）: 通常のルーティングには `route`（type がない場合も route 扱い）、永続的 ACP 会話バインディングには `acp`。
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のアカウント、省略 = デフォルトアカウント）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。チャンネル固有）
- `acp`（任意。`type: "acp"` のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（正確一致、peer/guild/team なし）
5. `match.accountId: "*"`（チャンネル全体）
6. デフォルトエージェント

各 tier の中では、最初に一致した `bindings` エントリが有効です。

`type: "acp"` エントリでは、OpenClaw は正確な会話 ID（`match.channel` + account + `match.peer.id`）で解決し、上記の route バインディング tier 順序は使いません。

### エージェントごとのアクセスプロファイル

<Accordion title="フルアクセス（サンドボックスなし）">
__OC_I18N_900031__
</Accordion>

<Accordion title="読み取り専用ツール + ワークスペース">
__OC_I18N_900032__
</Accordion>

<Accordion title="ファイルシステムアクセスなし（メッセージングのみ）">
__OC_I18N_900033__
</Accordion>

優先順位の詳細は [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション
__OC_I18N_900034__
<Accordion title="セッションフィールドの詳細">

- **`scope`**: グループチャット文脈向けのベースセッショングループ化戦略。
  - `per-sender`（デフォルト）: チャンネル文脈内で、各送信者ごとに独立したセッションを持ちます。
  - `global`: チャンネル文脈内のすべての参加者が 1 つのセッションを共有します（共有コンテキストが意図されている場合にのみ使用）。
- **`dmScope`**: DM のグループ化方法。
  - `main`: すべての DM がメインセッションを共有します。
  - `per-peer`: チャンネルをまたいで送信者 ID ごとに分離します。
  - `per-channel-peer`: チャンネル + 送信者ごとに分離します（複数ユーザーの受信箱に推奨）。
  - `per-account-channel-peer`: アカウント + チャンネル + 送信者ごとに分離します（複数アカウントに推奨）。
- **`identityLinks`**: チャンネル間セッション共有のため、正規 ID をプロバイダープレフィックス付き peer にマップします。
- **`reset`**: プライマリ reset ポリシー。`daily` はローカル時刻の `atHour` に reset し、`idle` は `idleMinutes` 後に reset します。両方が設定されている場合、先に期限が来た方が有効です。
- **`resetByType`**: タイプごとの上書き（`direct`、`group`、`thread`）。レガシーの `dm` は `direct` の別名として受け付けられます。
- **`parentForkMaxTokens`**: fork されたスレッドセッション作成時に許可される、親セッション `totalTokens` の最大値（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超える場合、OpenClaw は親 transcript 履歴を継承せず、新しいスレッドセッションを開始します。
  - このガードを無効にして常に親 fork を許可するには `0` を設定します。
- **`mainKey`**: レガシーフィールド。ランタイムはメインの direct-chat バケットに常に `"main"` を使います。
- **`agentToAgent.maxPingPongTurns`**: エージェント間やり取りにおける reply-back ターンの最大数（整数、範囲: `0`–`5`）。`0` は ping-pong 連鎖を無効化します。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`。レガシー `dm` 別名あり）、`keyPrefix`、または `rawKeyPrefix` で一致させます。最初の deny が優先されます。
- **`maintenance`**: セッションストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを出し、`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの期限（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内のエントリ最大数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたらローテーションします（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript アーカイブの保持期間。デフォルトでは `pruneAfter` を使います。無効にするには `false` を設定します。
  - `maxDiskBytes`: 任意の sessions ディレクトリのディスク予算。`warn` モードでは警告を記録し、`enforce` モードでは最も古い artifact/session から削除します。
  - `highWaterBytes`: 任意の予算クリーンアップ後の目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッドに結び付いたセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ（プロバイダーが上書き可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ自動 unfocus のデフォルト時間（`0` で無効。プロバイダーが上書き可能）
  - `maxAgeHours`: ハード最大経過時間のデフォルト（`0` で無効。プロバイダーが上書き可能）

</Accordion>

---

## メッセージ
__OC_I18N_900035__
### 応答プレフィックス

チャンネル/アカウントごとの上書き: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`。

解決順（より具体的なものが優先）: account → channel → global。`""` は無効化し、それ以上のカスケードを止めます。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| Variable          | 説明            | Example                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いモデル名       | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子  | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名          | `anthropic`                 |
| `{thinkingLevel}` | 現在の thinking レベル | `high`, `low`, `off`        |
| `{identity.name}` | エージェント identity 名    | （`"auto"` と同じ）          |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` の別名です。

### 確認用リアクション

- デフォルトはアクティブなエージェントの `identity.emoji`、なければ `"👀"`。無効にするには `""` を設定します。
- チャンネルごとの上書き: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`。
- 解決順: account → channel → `messages.ackReaction` → identity フォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram では返信後に ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram でライフサイクル状態リアクションを有効にします。
  Slack と Discord では、未設定のままだと ack リアクションが有効なときは status reactions も有効のままです。
  Telegram では、ライフサイクル状態リアクションを有効にするには明示的に `true` に設定してください。

### 受信 debounce

同じ送信者からの高速なテキストのみのメッセージを、1 つのエージェントターンにまとめます。メディア/添付ファイルは即座に flush されます。制御コマンドは debouncing をバイパスします。

### TTS（text-to-speech）
__OC_I18N_900036__
- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` でローカル設定を上書きでき、`/tts status` で実効状態を表示します。
- `summaryModel` は、自動要約用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（オプトイン）です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` と `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS エンドポイントを上書きします。解決順は config、次に `OPENAI_TTS_BASE_URL`、最後に `https://api.openai.com/v1` です。
- `openai.baseUrl` が非 OpenAI エンドポイントを指している場合、OpenClaw はそれを OpenAI 互換 TTS サーバーとして扱い、model/voice 検証を緩和します。

---

## Talk

Talk モード（macOS/iOS/Android）のデフォルトです。
__OC_I18N_900037__
- `talk.provider` は、複数の Talk プロバイダーが設定されている場合、`talk.providers` のキーと一致している必要があります。
- レガシーなフラット Talk キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用であり、自動的に `talk.providers.<provider>` へ移行されます。
- Voice ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` は平文文字列または SecretRef オブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk ディレクティブでフレンドリーな名前を使えます。
- `silenceTimeoutMs` は、ユーザーの無音後に Talk モードが transcript を送信するまで待つ時間を制御します。未設定の場合はプラットフォームデフォルトの待機ウィンドウを維持します（`macOS と Android では 700 ms、iOS では 900 ms`）。

---

## 関連

- [Configuration reference](/ja-JP/gateway/configuration-reference) — その他すべての設定キー
- [Configuration](/ja-JP/gateway/configuration) — 一般的なタスクとクイックセットアップ
- [Configuration examples](/ja-JP/gateway/configuration-examples)
