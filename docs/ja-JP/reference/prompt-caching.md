---
read_when:
    - プロンプトのトークンコストをキャッシュ保持で削減したい
    - マルチエージェント構成では、エージェントごとのキャッシュ動作が必要です
    - Heartbeat と cache-ttl のプルーニングを一緒に調整している
summary: プロンプトキャッシュのノブ、マージ順序、プロバイダーの動作、チューニングパターン
title: プロンプトキャッシュ
x-i18n:
    generated_at: "2026-07-01T07:51:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

プロンプトキャッシュとは、モデルプロバイダーが、変更されていないプロンプト接頭辞（通常は system/developer 指示やその他の安定したコンテキスト）を毎ターン再処理する代わりに、ターンをまたいで再利用できることを意味します。OpenClaw は、上流 API がそれらのカウンターを直接公開している場合、プロバイダー使用量を `cacheRead` と `cacheWrite` に正規化します。

ステータス表示面は、ライブセッションのスナップショットにキャッシュカウンターがない場合でも、直近のトランスクリプト使用量ログからキャッシュカウンターを復元できるため、セッションメタデータが一部失われた後も `/status` はキャッシュ行を表示し続けられます。既存の非ゼロのライブキャッシュ値は、引き続きトランスクリプトのフォールバック値より優先されます。

これが重要な理由: トークンコストが下がり、応答が速くなり、長時間実行されるセッションのパフォーマンスがより予測しやすくなります。キャッシュがない場合、入力の大半が変わっていなくても、繰り返されるプロンプトは毎ターン完全なプロンプトコストを支払います。

以下のセクションでは、プロンプト再利用とトークンコストに影響する、キャッシュ関連のすべての調整項目を扱います。

プロバイダー参照:

- Anthropic プロンプトキャッシュ: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI プロンプトキャッシュ: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API ヘッダーとリクエスト ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic リクエスト ID とエラー: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要な調整項目

### `cacheRetention`（グローバルデフォルト、モデル、エージェント単位）

すべてのモデルのグローバルデフォルトとしてキャッシュ保持を設定します:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

モデル単位で上書きします:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

エージェント単位の上書き:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

設定のマージ順序:

1. `agents.defaults.params`（グローバルデフォルト — すべてのモデルに適用）
2. `agents.defaults.models["provider/model"].params`（モデル単位の上書き）
3. `agents.list[].params`（一致するエージェント ID。キー単位で上書き）

### `contextPruning.mode: "cache-ttl"`

キャッシュ TTL ウィンドウの後に古いツール結果コンテキストを刈り込み、アイドル後のリクエストで過大な履歴を再キャッシュしないようにします。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完全な動作については [セッション刈り込み](/ja-JP/concepts/session-pruning) を参照してください。

### Heartbeat のウォーム維持

Heartbeat はキャッシュウィンドウを温かい状態に保ち、アイドル期間の後に繰り返されるキャッシュ書き込みを減らせます。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

エージェント単位の Heartbeat は `agents.list[].heartbeat` でサポートされています。

## プロバイダーの動作

### Anthropic（直接 API）

- `cacheRetention` がサポートされています。
- Anthropic API キー認証プロファイルでは、未設定の場合、OpenClaw は Anthropic モデル参照に `cacheRetention: "short"` をシードします。
- Anthropic ネイティブの Messages 応答は `cache_read_input_tokens` と `cache_creation_input_tokens` の両方を公開するため、OpenClaw は `cacheRead` と `cacheWrite` の両方を表示できます。
- ネイティブ Anthropic リクエストでは、`cacheRetention: "short"` はデフォルトの 5 分間のエフェメラルキャッシュに対応し、`cacheRetention: "long"` は直接の `api.anthropic.com` ホストでのみ 1 時間 TTL にアップグレードされます。

### OpenAI（直接 API）

- プロンプトキャッシュは、サポートされている最近のモデルで自動的に行われます。OpenClaw がブロックレベルのキャッシュマーカーを注入する必要はありません。
- OpenClaw は、ターンをまたいでキャッシュルーティングを安定させるために `prompt_cache_key` を使用します。直接の OpenAI ホストでは、`cacheRetention: "long"` が選択されている場合に `prompt_cache_retention: "24h"` を使用します。
- OpenAI 互換の Completions プロバイダーは、モデル設定で `compat.supportsPromptCacheKey: true` が明示的に設定されている場合にのみ `prompt_cache_key` を受け取ります。長期保持の転送は別の機能です。明示的な `cacheRetention: "long"` は、その compat エントリが長期キャッシュ保持もサポートしている場合にのみ `prompt_cache_retention: "24h"` を送信します。Mistral などのプロバイダーは、`compat.supportsLongCacheRetention: false` を設定して長期保持フィールドを抑制しながら、キャッシュキーを有効化できます。`cacheRetention: "none"` は両方のフィールドを抑制します。
- OpenAI 応答は、`usage.prompt_tokens_details.cached_tokens`（または Responses API イベント上の `input_tokens_details.cached_tokens`）を通じてキャッシュ済みプロンプトトークンを公開します。OpenClaw はそれを `cacheRead` にマッピングします。
- GPT-5.6 Responses の使用量は `input_tokens_details.cache_write_tokens` も公開できます。OpenClaw はそれを `cacheWrite` にマッピングし、モデルのキャッシュ書き込み料金で価格計算します。このフィールドを省略する Responses では、`cacheWrite` は `0` のままです。
- OpenAI は `x-request-id`、`openai-processing-ms`、`x-ratelimit-*` などの有用なトレースヘッダーやレート制限ヘッダーを返しますが、キャッシュヒットの集計はヘッダーではなく使用量ペイロードから取得する必要があります。
- 実際には、OpenAI は Anthropic 形式の移動する全履歴再利用というより、初期接頭辞キャッシュのように振る舞うことがよくあります。安定した長い接頭辞テキストのターンでは、現在のライブプローブで `4864` キャッシュ済みトークン付近の高止まりに達することがあります。一方、ツールが多い、または MCP 形式のトランスクリプトでは、完全な繰り返しでも `4608` キャッシュ済みトークン付近で高止まりすることがよくあります。

### Anthropic Vertex

- Vertex AI 上の Anthropic モデル（`anthropic-vertex/*`）は、直接 Anthropic と同じ方法で `cacheRetention` をサポートします。
- `cacheRetention: "long"` は、Vertex AI エンドポイント上の実際の 1 時間プロンプトキャッシュ TTL に対応します。
- `anthropic-vertex` のデフォルトキャッシュ保持は、直接 Anthropic のデフォルトと一致します。
- Vertex リクエストは境界を意識したキャッシュ整形を通じてルーティングされるため、キャッシュ再利用はプロバイダーが実際に受け取る内容と揃ったままになります。

### Amazon Bedrock

- Anthropic Claude モデル参照（`amazon-bedrock/*anthropic.claude*`）は、明示的な `cacheRetention` のパススルーをサポートします。
- 非 Anthropic の Bedrock モデルは、ランタイムで `cacheRetention: "none"` に強制されます。

### OpenRouter モデル

`openrouter/anthropic/*` モデル参照では、OpenClaw はシステム/developer プロンプトブロックに Anthropic の `cache_control` を注入し、検証済みの OpenRouter ルート（デフォルトエンドポイント上の `openrouter`、または `openrouter.ai` に解決される任意のプロバイダー/base URL）をリクエストが引き続き対象にしている場合にのみ、プロンプトキャッシュ再利用を改善します。

`openrouter/deepseek/*`、`openrouter/moonshot*/*`、および `openrouter/zai/*` モデル参照では、OpenRouter がプロバイダー側のプロンプトキャッシュを自動的に処理するため、`contextPruning.mode: "cache-ttl"` が許可されます。OpenClaw はそれらのリクエストに Anthropic の `cache_control` マーカーを注入しません。

DeepSeek のキャッシュ構築はベストエフォートで、数秒かかることがあります。直後のフォローアップではまだ `cached_tokens: 0` が表示される場合があります。短い遅延の後、同じ接頭辞のリクエストを繰り返して確認し、キャッシュヒット信号として `usage.prompt_tokens_details.cached_tokens` を使用してください。

モデルを任意の OpenAI 互換プロキシ URL に向け直した場合、OpenClaw はそれらの OpenRouter 固有の Anthropic キャッシュマーカーの注入を停止します。

### その他のプロバイダー

プロバイダーがこのキャッシュモードをサポートしていない場合、`cacheRetention` は効果がありません。

### Google Gemini 直接 API

- 直接 Gemini トランスポート（`api: "google-generative-ai"`）は、上流の `cachedContentTokenCount` を通じてキャッシュヒットを報告します。OpenClaw はそれを `cacheRead` にマッピングします。
- 直接 Gemini モデルに `cacheRetention` が設定されている場合、OpenClaw は Google AI Studio 実行のシステムプロンプト向けに `cachedContents` リソースを自動的に作成、再利用、更新します。つまり、キャッシュ済みコンテンツのハンドルを手動で事前作成する必要はなくなります。
- 設定済みモデル上で `params.cachedContent`（またはレガシーの `params.cached_content`）として、既存の Gemini キャッシュ済みコンテンツハンドルを引き続き渡すこともできます。
- これは Anthropic/OpenAI のプロンプト接頭辞キャッシュとは別物です。Gemini では、OpenClaw はリクエストにキャッシュマーカーを注入するのではなく、プロバイダーネイティブの `cachedContents` リソースを管理します。

### Gemini CLI 使用量

- Gemini CLI の `stream-json` 出力は、`stats.cached` を通じてキャッシュヒットを表面化できます。OpenClaw はそれを `cacheRead` にマッピングします。レガシーの `--output-format json` 上書きも同じ使用量正規化を使用します。
- CLI が直接の `stats.input` 値を省略した場合、OpenClaw は `stats.input_tokens - stats.cached` から入力トークンを導出します。
- これは使用量の正規化のみです。OpenClaw が Gemini CLI 向けに Anthropic/OpenAI 形式のプロンプトキャッシュマーカーを作成しているという意味ではありません。

## システムプロンプトのキャッシュ境界

OpenClaw はシステムプロンプトを、内部キャッシュ接頭辞境界で分離された **安定した接頭辞** と **揮発性の接尾辞** に分割します。境界より上のコンテンツ（ツール定義、Skills メタデータ、ワークスペースファイル、その他の比較的静的なコンテキスト）は、ターンをまたいでバイト単位で同一のままになるように順序付けされます。境界より下のコンテンツ（たとえば `HEARTBEAT.md`、ランタイムタイムスタンプ、その他のターン単位のメタデータ）は、キャッシュ済み接頭辞を無効化せずに変更できます。

主な設計上の選択:

- 安定したワークスペースのプロジェクトコンテキストファイルは `HEARTBEAT.md` より前に順序付けされるため、Heartbeat の変動が安定した接頭辞を壊しません。
- この境界は Anthropic 系、OpenAI 系、Google、CLI トランスポート整形全体に適用されるため、サポートされるすべてのプロバイダーが同じ接頭辞安定性の恩恵を受けます。
- Codex Responses と Anthropic Vertex リクエストは、境界を意識したキャッシュ整形を通じてルーティングされるため、キャッシュ再利用はプロバイダーが実際に受け取る内容と揃ったままになります。
- システムプロンプトのフィンガープリントは正規化されるため（空白、行末、フックによって追加されたコンテキスト、ランタイム機能の順序付け）、意味的に変更されていないプロンプトはターンをまたいで KV/キャッシュを共有します。

設定またはワークスペースの変更後に予期しない `cacheWrite` の急増が見られる場合は、その変更がキャッシュ境界の上に入っているか下に入っているかを確認してください。揮発性コンテンツを境界より下へ移動する（または安定化する）ことで、問題が解決することがよくあります。

## OpenClaw のキャッシュ安定性ガード

OpenClaw はまた、リクエストがプロバイダーに到達する前に、いくつかのキャッシュに敏感なペイロード形状を決定論的に保ちます:

- バンドル MCP ツールカタログはツール登録前に決定論的にソートされるため、`listTools()` の順序変更がツールブロックを変動させ、プロンプトキャッシュ接頭辞を壊すことはありません。
- 永続化された画像ブロックを含むレガシーセッションでは、**直近 3 件の完了済みターン** をそのまま保持します。それより古い処理済みの画像ブロックは、画像が多いフォローアップで大きな古いペイロードを再送し続けないよう、マーカーに置き換えられる場合があります。

## チューニングパターン

### 混在トラフィック（推奨デフォルト）

メインエージェントでは長期間有効なベースラインを維持し、バースト的な通知エージェントではキャッシュを無効化します:

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

- ベースラインの `cacheRetention: "short"` を設定します。
- `contextPruning.mode: "cache-ttl"` を有効化します。
- ウォームキャッシュの恩恵を受けるエージェントにのみ、Heartbeat を TTL より短く保ちます。

## キャッシュ診断

OpenClaw は、埋め込みエージェント実行向けに専用のキャッシュトレース診断を公開します。

通常のユーザー向け診断では、ライブセッションエントリにそれらのカウンターがない場合、`/status` やその他の使用量サマリーは、最新のトランスクリプト使用量エントリを `cacheRead` / `cacheWrite` のフォールバックソースとして使用できます。

## ライブ回帰テスト

OpenClaw は、繰り返し接頭辞、ツールターン、画像ターン、MCP 形式のツールトランスクリプト、および Anthropic のキャッシュなし制御に対して、1 つの統合ライブキャッシュ回帰ゲートを保持しています。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

狭いライブゲートは次で実行します:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ベースラインファイルには、直近で観測されたライブ値と、テストで使うプロバイダー固有の回帰下限値が保存されます。
ランナーは実行ごとに新しいセッション ID とプロンプト名前空間も使うため、以前のキャッシュ状態が現在の回帰サンプルを汚染しません。

これらのテストは、意図的にプロバイダー間で同一の成功基準を使っていません。

### Anthropic ライブ期待値

- `cacheWrite` による明示的なウォームアップ書き込みを期待します。
- Anthropic のキャッシュ制御は会話を通じてキャッシュブレークポイントを進めるため、反復ターンではほぼ完全な履歴再利用を期待します。
- 現在のライブアサーションでは、stable、tool、image パスに対して引き続き高いヒット率しきい値を使います。

### OpenAI ライブ期待値

- `cacheRead` のみを期待します。`cacheWrite` は `0` のままです。
- 反復ターンのキャッシュ再利用は、Anthropic 風の移動する全履歴再利用ではなく、プロバイダー固有のプラトーとして扱います。
- 現在のライブアサーションでは、`gpt-5.4-mini` で観測されたライブ挙動から導いた保守的な下限チェックを使います。
  - stable prefix: `cacheRead >= 4608`、ヒット率 `>= 0.90`
  - tool transcript: `cacheRead >= 4096`、ヒット率 `>= 0.85`
  - image transcript: `cacheRead >= 3840`、ヒット率 `>= 0.82`
  - MCP-style transcript: `cacheRead >= 4096`、ヒット率 `>= 0.85`

2026-04-04 の新しい統合ライブ検証結果は次のとおりでした。

- stable prefix: `cacheRead=4864`、ヒット率 `0.966`
- tool transcript: `cacheRead=4608`、ヒット率 `0.896`
- image transcript: `cacheRead=4864`、ヒット率 `0.954`
- MCP-style transcript: `cacheRead=4608`、ヒット率 `0.891`

統合ゲートの最近のローカル実時間は約 `88s` でした。

アサーションが異なる理由:

- Anthropic は、明示的なキャッシュブレークポイントと移動する会話履歴再利用を公開しています。
- OpenAI プロンプトキャッシュは依然として厳密なプレフィックス一致に敏感ですが、ライブ Responses トラフィックで有効に再利用できるプレフィックスは、完全なプロンプトより早い位置でプラトーに達することがあります。
- そのため、単一のプロバイダー横断パーセンテージしきい値で Anthropic と OpenAI を比較すると、誤った回帰が発生します。

### `diagnostics.cacheTrace` 設定

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

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### 環境トグル（一時的なデバッグ）

- `OPENCLAW_CACHE_TRACE=1` はキャッシュトレースを有効にします。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` は出力パスを上書きします。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` は完全なメッセージペイロードの取得を切り替えます。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` はプロンプトテキストの取得を切り替えます。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` はシステムプロンプトの取得を切り替えます。

### 確認する内容

- キャッシュトレースイベントは JSONL で、`session:loaded`、`prompt:before`、`stream:context`、`session:after` のような段階別スナップショットを含みます。
- ターンごとのキャッシュトークンへの影響は、通常の使用状況画面で `cacheRead` と `cacheWrite` を通じて確認できます（例: `/usage full` やセッション使用状況サマリー）。
- Anthropic では、キャッシュが有効な場合に `cacheRead` と `cacheWrite` の両方を期待します。
- OpenAI では、キャッシュヒット時に `cacheRead` を期待します。GPT-5.6 Responses は、プロンプトセグメントが書き込まれる間に `cacheWrite` も報告できます。書き込みカウンターを省略する他の Responses ペイロードでは、値は `0` のままです。
- リクエストトレースが必要な場合は、リクエスト ID とレート制限ヘッダーをキャッシュメトリクスとは別にログに記録してください。OpenClaw の現在のキャッシュトレース出力は、生のプロバイダー応答ヘッダーではなく、プロンプト/セッション形状と正規化されたトークン使用量に重点を置いています。

## クイックトラブルシューティング

- ほとんどのターンで `cacheWrite` が高い: 変動するシステムプロンプト入力を確認し、モデル/プロバイダーがキャッシュ設定をサポートしていることを確認してください。
- Anthropic で `cacheWrite` が高い: 多くの場合、キャッシュブレークポイントがリクエストごとに変わるコンテンツに置かれていることを意味します。
- OpenAI の `cacheRead` が低い: stable prefix が先頭にあること、反復プレフィックスが少なくとも 1024 トークンあること、キャッシュを共有すべきターンで同じ `prompt_cache_key` が再利用されていることを確認してください。
- `cacheRetention` の効果がない: モデルキーが `agents.defaults.models["provider/model"]` と一致していることを確認してください。
- キャッシュ設定付きの Bedrock Nova/Mistral リクエスト: 実行時に `none` へ強制されるのは想定どおりです。

関連ドキュメント:

- [Anthropic](/ja-JP/providers/anthropic)
- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [セッションプルーニング](/ja-JP/concepts/session-pruning)
- [Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference)

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
