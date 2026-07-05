---
read_when:
    - キャッシュ保持でプロンプトのトークンコストを削減したい
    - マルチエージェント構成では、エージェントごとのキャッシュ動作が必要です
    - Heartbeat と cache-ttl のプルーニングを一緒に調整しています
summary: プロンプトキャッシュのノブ、マージ順序、プロバイダーの動作、チューニングパターン
title: プロンプトキャッシュ
x-i18n:
    generated_at: "2026-07-05T11:45:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

プロンプトキャッシュにより、モデルプロバイダーは変更されていないプロンプト接頭辞（system/developer 指示、ツール定義、その他の安定したコンテキスト）をリクエストごとに再処理する代わりに、ターン間で再利用できます。これにより、コンテキストが繰り返される長時間セッションのトークンコストとレイテンシが削減されます。

OpenClaw は、上流 API がそれらのカウンターを公開している場合、プロバイダー使用量を `cacheRead` と `cacheWrite` に正規化します。使用量サマリー（`/status` など）は、ライブセッションのスナップショットにキャッシュカウンターがない場合、最後のトランスクリプト使用量エントリにフォールバックします。ゼロでないライブ値は常にフォールバックより優先されます。

プロバイダー参照:

- [Anthropic プロンプトキャッシュ](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI プロンプトキャッシュ](https://developers.openai.com/api/docs/guides/prompt-caching)

## 主要なノブ

### `cacheRetention`

値: `"none" | "short" | "long"`。グローバルデフォルト、モデルごと、エージェントごとに設定できます。

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # このモデルのグローバルデフォルトを上書きします
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # このエージェントの両方のデフォルトを上書きします
```

マージ順序（後のものが優先）:

1. `agents.defaults.params` - すべてのモデルのグローバルデフォルト
2. `agents.defaults.models["provider/model"].params` - モデルごとの上書き
3. `agents.list[].params` - エージェントごとの上書き。エージェント ID で照合

ソース: `src/agents/embedded-agent-runner/extra-params.ts`（`resolveExtraParams`）。

### `contextPruning.mode: "cache-ttl"`

キャッシュ TTL ウィンドウが経過した後に古いツール結果コンテキストを刈り込むため、アイドル後のリクエストで過大な履歴を再キャッシュしません。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完全な動作については [セッションの刈り込み](/ja-JP/concepts/session-pruning) を参照してください。

### Heartbeat のウォーム維持

Heartbeat はキャッシュウィンドウを暖かく保ち、アイドル間隔後のキャッシュ書き込みの繰り返しを減らせます。グローバル（`agents.defaults.heartbeat`）またはエージェントごと（`agents.list[].heartbeat`）に設定できます。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## プロバイダーの動作

### Anthropic（直接 API と Vertex AI）

- `cacheRetention` は `anthropic` と `anthropic-vertex` プロバイダー、および `cacheRetention` が明示的に設定されている場合の `amazon-bedrock` 上の Claude モデルとカスタム `anthropic-messages` 互換エンドポイントでサポートされます。
- 未設定の場合、OpenClaw は直接 Anthropic（`anthropic` と `anthropic-vertex` プロバイダーのみ。他の Anthropic 系ルートには明示的な値が必要）に `cacheRetention: "short"` をシードします。
- ネイティブ Anthropic Messages レスポンスは `cache_read_input_tokens` と `cache_creation_input_tokens` を公開し、`cacheRead` と `cacheWrite` にマッピングされます。
- `cacheRetention: "short"` はデフォルトの 5 分間のエフェメラルキャッシュにマッピングされます。`cacheRetention: "long"` は、明示的に設定されている場合に 1 時間 TTL（`cache_control: { type: "ephemeral", ttl: "1h" }`）を要求します。暗黙的または環境変数由来の long retention（明示的な `cacheRetention` なしの `OPENCLAW_CACHE_RETENTION=long`）は、`api.anthropic.com` または Vertex AI（`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`）ホストでのみ 1 時間 TTL にアップグレードされます。その他のホストは 5 分間キャッシュを維持します。

ソース: `src/agents/anthropic-payload-policy.ts`（`resolveAnthropicEphemeralCacheControl`、`isLongTtlEligibleEndpoint`）。

### OpenAI（直接 API）

- プロンプトキャッシュは、対応する最近のモデルで自動的に行われます。OpenClaw はブロックレベルのキャッシュマーカーを注入しません。
- OpenClaw は、ターン間のキャッシュルーティングを安定させるために `prompt_cache_key` を送信します。直接 `api.openai.com` ホストではこれは自動的に行われます。OpenAI 互換プロキシ（oMLX、llama.cpp、カスタムエンドポイント）は、オプトインするためにモデル設定で `compat.supportsPromptCacheKey: true` が必要です。これはプロキシに対して自動検出されることはありません。
- `prompt_cache_retention: "24h"` は、`cacheRetention: "long"` が選択され、解決済みエンドポイントがキャッシュキーと長期保持の両方をサポートしている場合（`compat.supportsLongCacheRetention`、デフォルトで true。ただし Together AI と Cloudflare の互換プロファイルでは無効）のみ追加されます。`cacheRetention: "none"` は両方のフィールドを抑制します。
- キャッシュヒットは `usage.prompt_tokens_details.cached_tokens`（Chat Completions）または `input_tokens_details.cached_tokens`（Responses API）経由で表面化し、`cacheRead` にマッピングされます。
- Responses API ペイロードは `input_tokens_details.cache_write_tokens` も公開する場合があり、これは `cacheWrite` にマッピングされ、モデルのキャッシュ書き込みレートで価格付けされます。このフィールドを省略する Responses ペイロードは `cacheWrite` を `0` のままにします。OpenAI の Chat Completions API は `cache_write_tokens` カウンターを文書化または出力しませんが、OpenClaw は、別個の書き込み数を報告する OpenRouter 互換および DeepSeek スタイルのプロキシ向けに、そこで `prompt_tokens_details.cache_write_tokens` を引き続き読み取ります。
- 実際には、OpenAI は Anthropic の移動する全履歴再利用というより、初期接頭辞キャッシュに近い動作をします。下の [OpenAI ライブ期待値](#openai-live-expectations) を参照してください。

### Amazon Bedrock

- Anthropic Claude モデル参照（`amazon-bedrock/*anthropic.claude*` に加え、AWS システム推論プロファイル接頭辞 `us.`/`eu.`/`global.anthropic.claude*`）は、明示的な `cacheRetention` のパススルーをサポートします。
- 非 Anthropic Bedrock モデル（例: `amazon.nova-*`）は、設定された `cacheRetention` 値に関係なく、ランタイムではキャッシュ保持なしに解決されます。
- 不透明な Bedrock アプリケーション推論プロファイル ARN（`claude` を含まないプロファイル ID）も、ARN だけではモデルファミリーを推論できないため、`cacheRetention` が明示的に設定されていない限りキャッシュ保持なしに解決されます。

### OpenRouter

`openrouter/anthropic/*` モデル参照では、OpenClaw は system/developer プロンプトブロックに Anthropic `cache_control` マーカーを注入します。ただし、リクエストが検証済みの OpenRouter ルート（デフォルトエンドポイント上の `openrouter`、または `openrouter.ai` に解決される任意のプロバイダー/ベース URL）を引き続き対象にしている場合に限ります。モデルを任意の OpenAI 互換プロキシ URL に向け直すと、この注入は停止します。

`contextPruning.mode: "cache-ttl"` は、`openrouter/anthropic/*`、`openrouter/deepseek/*`、`openrouter/moonshot/*`、`openrouter/moonshotai/*`、`openrouter/zai/*` モデル参照で許可されます。これらのルートは、OpenClaw の注入マーカーを必要とせずにプロバイダー側のプロンプトキャッシュを処理するためです。

ソース: `extensions/openrouter/index.ts`（`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`）。

OpenRouter 上の DeepSeek キャッシュ構築はベストエフォートで、数秒かかる場合があります。直後のフォローアップリクエストでは、まだ `cached_tokens: 0` が表示されることがあります。短い遅延の後に同じ接頭辞のリクエストを繰り返し、`usage.prompt_tokens_details.cached_tokens` をキャッシュヒットシグナルとして使用して検証してください。

### Google Gemini（直接 API）

- 直接 Gemini トランスポート（`api: "google-generative-ai"`）は、上流の `cachedContentTokenCount` を通じてキャッシュヒットを報告し、`cacheRead` にマッピングされます。
- 対象モデルファミリー: `gemini-2.5*` と `gemini-3*`（その接頭辞一致から外れる Live/preview バリアント、例: `gemini-live-2.5-flash-preview` は除外）。
- 対象モデルで `cacheRetention` が設定されている場合、OpenClaw はシステムプロンプト用の `cachedContents` リソースを自動的に作成、再利用、更新します。手動の cached-content ハンドルは不要です。TTL は `cacheRetention: "short"` では `300s`、`"long"` では `3600s` です。
- 既存の Gemini cached-content ハンドルを `params.cachedContent`（またはレガシー `params.cached_content`）として引き続き渡せます。明示的なハンドルは自動キャッシュ管理パスを完全にスキップします。
- これは Anthropic/OpenAI のプロンプト接頭辞キャッシュとは別です。OpenClaw は Gemini 用に、インラインキャッシュマーカーを注入する代わりにプロバイダーネイティブの `cachedContents` リソースを管理します。

ソース: `src/agents/embedded-agent-runner/google-prompt-cache.ts`。

### CLI ハーネスプロバイダー（Claude Code、Gemini CLI）

JSONL 使用量イベント（`jsonlDialect: "claude-stream-json"` または `"gemini-stream-json"`）を出力する CLI バックエンドは、複数のフィールド名バリアントを認識する共有使用量パーサーを通ります。これには、`cacheRead` にマッピングされるプレーンな `cached` カウンターも含まれます。CLI の JSON ペイロードが直接の入力トークンフィールドを省略している場合、OpenClaw はそれを `input_tokens - cached` として導出します。これは使用量の正規化のみであり、これらの CLI 駆動モデル向けに Anthropic/OpenAI スタイルのプロンプトキャッシュマーカーを作成するものではありません。

ソース: `src/agents/cli-output.ts`（`toCliUsage`）。

### その他のプロバイダー

プロバイダーが上記のキャッシュモードのいずれもサポートしていない場合、`cacheRetention` は効果がありません。

## システムプロンプトのキャッシュ境界

OpenClaw は、内部のキャッシュ接頭辞境界でシステムプロンプトを **安定接頭辞** と **揮発性接尾辞** に分割します。境界より上のコンテンツ（ツール定義、Skills メタデータ、ワークスペースファイル）は、ターン間でバイト単位で同一に保たれるように順序付けられます。境界より下のコンテンツ（例: `HEARTBEAT.md`、ランタイムタイムスタンプ、その他のターンごとのメタデータ）は、キャッシュ済み接頭辞を無効化せずに変更できます。

主な設計上の選択:

- 安定したワークスペースのプロジェクトコンテキストファイルは `HEARTBEAT.md` より前に順序付けられるため、heartbeat の変動で安定接頭辞が壊れません。
- この境界は Anthropic 系、OpenAI 系、Google、CLI トランスポート整形全体に適用されるため、対応するすべてのプロバイダーが同じ接頭辞安定性の恩恵を受けます。
- Codex Responses と Anthropic Vertex リクエストは、境界を認識したキャッシュ整形を通じてルーティングされるため、キャッシュ再利用はプロバイダーが実際に受け取る内容と整合します。
- システムプロンプトのフィンガープリントは正規化される（空白、行末、フックで追加されたコンテキスト、ランタイム機能の順序）ため、意味的に変更されていないプロンプトはターン間でキャッシュを共有します。

設定やワークスペースの変更後に予期しない `cacheWrite` スパイクが見られる場合は、その変更がキャッシュ境界の上か下かを確認してください。揮発性コンテンツを境界より下へ移動する（または安定化する）ことで、通常は問題が解決します。

## OpenClaw のキャッシュ安定性ガード

- バンドルされた MCP ツールカタログは、ツール登録前に決定的に（サーバー名、次にツール名で）ソートされるため、`listTools()` の順序変更で tools ブロックが変動してプロンプトキャッシュ接頭辞が壊れることはありません。
- 永続化された画像ブロックを持つレガシーセッションは、**直近 3 件の完了済みターン**をそのまま保持します（画像を含むものだけでなく、すべての完了済みターンを数えます）。それ以前の処理済み画像ブロックはテキストマーカーに置き換えられるため、画像の多いフォローアップで大きな古いペイロードを再送し続けません。

## チューニングパターン

### 混合トラフィック（推奨デフォルト）

メインエージェントで長寿命のベースラインを維持し、バースト的な通知エージェントではキャッシュを無効にします。

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### コスト優先のベースライン

- ベースラインに `cacheRetention: "short"` を設定します。
- `contextPruning.mode: "cache-ttl"` を有効にします。
- 暖かいキャッシュの恩恵を受けるエージェントに限り、heartbeat を TTL 未満に保ちます。

## ライブ回帰テスト

OpenClaw は、繰り返し接頭辞、ツールターン、画像ターン、MCP スタイルのツールトランスクリプト、Anthropic の no-cache コントロールをカバーする 1 つの統合ライブキャッシュ回帰ゲートを実行します。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

実行方法:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ベースラインファイルには、直近に観測されたライブ数値と、テストが照合するプロバイダー固有の回帰フロアが保存されます。各実行では、以前のキャッシュ状態が現在のサンプルを汚染しないように、新しい実行ごとのセッション ID とプロンプト名前空間を使用します。Anthropic と OpenAI では適用方法が異なります。Anthropic のフロア未達はハード回帰（テスト失敗）である一方、OpenAI のフロア未達は監視のみ（警告として記録され、実行は失敗しない）です。単一のプロバイダー横断しきい値を共有していません。

### Anthropic ライブ期待値

- `cacheWrite` による明示的なウォームアップ書き込みを想定します。
- Anthropic のキャッシュ制御は会話を通じてキャッシュのブレークポイントを進めるため、繰り返しターンではほぼ完全な履歴再利用を想定します。
- stable、tool、image、MCP 形式レーンのベースライン下限は、厳格なリグレッションゲートです。

### OpenAI ライブでの期待値

- `cacheRead` のみを想定します。Chat Completions では `cacheWrite` は `0` のままです。
- 繰り返しターンでのキャッシュ再利用は、Anthropic 形式の移動する全履歴再利用ではなく、プロバイダー固有のプラトーとして扱います。
- 下限は監視のみです（ミスはテスト失敗ではなく警告として記録されます）。これは `gpt-5.4-mini` で観測されたライブ挙動に基づきます。

| シナリオ             | `cacheRead` の下限 | ヒット率の下限 |
| -------------------- | ----------------: | -------------: |
| 安定プレフィックス        |             4,608 |           0.90 |
| ツールトランスクリプト      |             4,096 |           0.85 |
| 画像トランスクリプト       |             3,840 |           0.82 |
| MCP 形式トランスクリプト |             4,096 |           0.85 |

直近で観測されたベースライン値（`live-cache-regression-baseline.ts` 由来）は次のとおりです。安定プレフィックス `cacheRead=4864`、ヒット率 `0.966`。ツールトランスクリプト `cacheRead=4608`、ヒット率 `0.896`。画像トランスクリプト `cacheRead=4864`、ヒット率 `0.954`。MCP 形式トランスクリプト `cacheRead=4608`、ヒット率 `0.891`。

アサーションが異なる理由: Anthropic は明示的なキャッシュブレークポイントと、移動する会話履歴再利用を公開しています。一方、OpenAI のライブトラフィックで実効的に再利用可能なプレフィックスは、完全なプロンプトより手前でプラトーに達することがあります。2 つのプロバイダーを単一のプロバイダー横断パーセンテージしきい値で比較すると、誤ったリグレッションが発生します。

## `diagnostics.cacheTrace` 設定

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

デフォルト:

| キー               | デフォルト                                      |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### 環境変数トグル（一回限りのデバッグ）

| 変数                             | 効果                               |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | キャッシュトレースを有効化します                |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | 出力パスを上書きします                |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | 完全なメッセージペイロードの取得を切り替えます |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | プロンプトテキストの取得を切り替えます          |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | システムプロンプトの取得を切り替えます        |

### 確認する内容

- キャッシュトレースイベントは、`session:loaded`、`prompt:before`、`stream:context`、`session:after` のような段階的スナップショットを含む JSONL です。
- ターンごとのキャッシュトークンへの影響は、通常の使用量サーフェスで確認できます。`cacheRead` と `cacheWrite` は `/usage tokens`、`/status`、セッション使用量サマリー、カスタム `messages.usageTemplate` レイアウトに表示されます。
- Anthropic では、キャッシュが有効な場合に `cacheRead` と `cacheWrite` の両方を想定します。
- OpenAI では、キャッシュヒット時に `cacheRead` を想定します。`cacheWrite` は、それを含む Responses API ペイロードでのみ入力されます（上の [OpenAI](#openai-direct-api) を参照）。
- OpenAI は `x-request-id`、`openai-processing-ms`、`x-ratelimit-*` などのトレースヘッダーやレート制限ヘッダーも返します。リクエストトレースにはそれらを使用しますが、キャッシュヒットの集計はヘッダーではなく、引き続き使用量ペイロードから取得する必要があります。

## クイックトラブルシューティング

- **ほとんどのターンで `cacheWrite` が高い**: 変動しやすいシステムプロンプト入力がないか確認し、モデル/プロバイダーがキャッシュ設定をサポートしていることを確認してください。
- **Anthropic で `cacheWrite` が高い**: 多くの場合、キャッシュブレークポイントがリクエストごとに変化するコンテンツに置かれていることを意味します。
- **OpenAI の `cacheRead` が低い**: 安定プレフィックスが先頭にあり、繰り返されるプレフィックスが少なくとも 1024 トークンで、キャッシュを共有すべきターンで同じ `prompt_cache_key` が再利用されていることを確認してください。
- **`cacheRetention` の効果がない**: モデルキーが `agents.defaults.models["provider/model"]` と一致していることを確認してください。
- **キャッシュ設定を含む Bedrock Nova リクエスト**: 想定どおりです。これらは実行時にキャッシュ保持なしとして解決されます。

関連ドキュメント:

- [Anthropic](/ja-JP/providers/anthropic)
- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [セッションプルーニング](/ja-JP/concepts/session-pruning)
- [Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference)

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
