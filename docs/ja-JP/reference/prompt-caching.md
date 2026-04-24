---
read_when:
    - キャッシュ保持でプロンプト token コストを下げたい場合＿日本assistant to=functions.read in commentary  诺果json  content{"path":"../AGENTS.md"}  彩神争霸输钱analysis to=functions.read code  在天天中彩票json  content{"path":"../AGENTS.md"}
    - マルチエージェント構成でエージェントごとのキャッシュ動作が必要な場合
    - Heartbeat と cache-ttl pruning を一緒に調整している場合
summary: プロンプトキャッシュの設定項目、マージ順序、プロバイダー動作、チューニングパターン
title: プロンプトキャッシュ
x-i18n:
    generated_at: "2026-04-24T05:18:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

プロンプトキャッシュとは、モデルプロバイダーが、毎回再処理する代わりに、ターンをまたいで変化しないプロンプト接頭辞（通常は system/developer 指示やその他の安定したコンテキスト）を再利用できることを意味します。OpenClaw は、上流 API がそれらのカウンターを直接公開している場合、プロバイダーの使用量を `cacheRead` と `cacheWrite` に正規化します。

status サーフェスは、ライブセッションスナップショットにキャッシュカウンターが欠けているとき、最新のトランスクリプト
usage ログからそれらを復元することもできます。そのため `/status` は、
部分的にセッションメタデータが失われた後でもキャッシュ行を表示し続けられます。既存の非ゼロのライブ
キャッシュ値は、引き続きトランスクリプト由来のフォールバック値より優先されます。

これが重要な理由: token コストの低減、応答の高速化、長時間セッションにおけるより予測可能なパフォーマンス。キャッシュがない場合、入力の大部分が変化していなくても、繰り返されるプロンプトは毎ターン完全なプロンプトコストを支払います。

このページでは、プロンプト再利用と token コストに影響する、すべてのキャッシュ関連設定項目を扱います。

プロバイダー参照:

- Anthropic prompt caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI prompt caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API headers and request IDs: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic request IDs and errors: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主な設定項目

### `cacheRetention`（グローバルデフォルト、モデル、エージェントごと）

すべてのモデルに対するグローバルデフォルトとしてキャッシュ保持を設定します。

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

モデルごとに上書き:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

エージェントごとの上書き:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

config のマージ順序:

1. `agents.defaults.params`（グローバルデフォルト — すべてのモデルに適用）
2. `agents.defaults.models["provider/model"].params`（モデルごとの上書き）
3. `agents.list[].params`（一致するエージェント ID。キーごとに上書き）

### `contextPruning.mode: "cache-ttl"`

キャッシュ TTL ウィンドウ後に古い tool-result コンテキストを削減し、アイドル後のリクエストで大きすぎる履歴を再キャッシュしないようにします。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完全な動作については [Session Pruning](/ja-JP/concepts/session-pruning) を参照してください。

### Heartbeat keep-warm

Heartbeat はキャッシュウィンドウを温かい状態に保ち、アイドルギャップ後の繰り返しのキャッシュ書き込みを減らせます。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

エージェントごとの Heartbeat は `agents.list[].heartbeat` でサポートされます。

## プロバイダーの動作

### Anthropic（直接 API）

- `cacheRetention` をサポートします。
- Anthropic API キー auth profile では、未設定時に Anthropic model ref に対して OpenClaw が `cacheRetention: "short"` を投入します。
- Anthropic ネイティブ Messages 応答は `cache_read_input_tokens` と `cache_creation_input_tokens` の両方を公開するため、OpenClaw は `cacheRead` と `cacheWrite` の両方を表示できます。
- ネイティブ Anthropic リクエストでは、`cacheRetention: "short"` はデフォルトの 5 分 ephemeral キャッシュに対応し、`cacheRetention: "long"` は直接の `api.anthropic.com` ホスト上でのみ 1 時間 TTL に引き上げられます。

### OpenAI（直接 API）

- プロンプトキャッシュは、サポートされる最近のモデルで自動です。OpenClaw がブロックレベルのキャッシュマーカーを注入する必要はありません。
- OpenClaw はターンをまたいでキャッシュルーティングを安定させるために `prompt_cache_key` を使い、直接の OpenAI ホスト上で `cacheRetention: "long"` が選択された場合にのみ `prompt_cache_retention: "24h"` を使います。
- OpenAI 応答は、`usage.prompt_tokens_details.cached_tokens`（または Responses API イベントの `input_tokens_details.cached_tokens`）経由でキャッシュ済みプロンプト token を公開します。OpenClaw はこれを `cacheRead` にマッピングします。
- OpenAI は separate な cache-write token カウンターを公開しないため、プロバイダーがキャッシュを温めていても OpenAI パスでは `cacheWrite` は `0` のままです。
- OpenAI は `x-request-id`、`openai-processing-ms`、`x-ratelimit-*` のような有用な tracing と rate-limit ヘッダーを返しますが、cache-hit 会計はヘッダーではなく usage ペイロードから取得すべきです。
- 実際には、OpenAI は Anthropic 方式の移動する全履歴再利用より、初期接頭辞キャッシュのように振る舞うことが多いです。安定した長い接頭辞テキストターンは、現在のライブプローブでは `4864` cached token 付近の plateau に達することがあり、一方 tool-heavy または MCP 形式のトランスクリプトは、完全に同じ再実行でも `4608` cached token 付近で plateau することが多いです。

### Anthropic Vertex

- Vertex AI 上の Anthropic モデル（`anthropic-vertex/*`）は、直接 Anthropic と同様に `cacheRetention` をサポートします。
- `cacheRetention: "long"` は、Vertex AI エンドポイント上で実際の 1 時間 prompt-cache TTL に対応します。
- `anthropic-vertex` のデフォルトキャッシュ保持は、直接 Anthropic のデフォルトと一致します。
- Vertex リクエストは boundary-aware なキャッシュ整形を通るため、キャッシュ再利用はプロバイダーが実際に受け取る内容と整合したままになります。

### Amazon Bedrock

- Anthropic Claude model ref（`amazon-bedrock/*anthropic.claude*`）は、明示的な `cacheRetention` のパススルーをサポートします。
- 非 Anthropic の Bedrock モデルは、ランタイム時に `cacheRetention: "none"` に強制されます。

### OpenRouter Anthropic モデル

`openrouter/anthropic/*` model ref に対して、OpenClaw は Anthropic の
`cache_control` を system/developer プロンプトブロックに注入し、OpenRouter 固有の Anthropic キャッシュマーカーを停止せずに、
リクエストがまだ検証済み OpenRouter ルート
（デフォルトエンドポイント上の `openrouter`、または `openrouter.ai` に解決される任意の provider/base URL）を対象にしている場合にのみ prompt-cache
再利用を改善します。

モデルを任意の OpenAI 互換 proxy URL に向け直した場合、OpenClaw は
それらの OpenRouter 固有 Anthropic キャッシュマーカーの注入を停止します。

### その他のプロバイダー

プロバイダーがこのキャッシュモードをサポートしない場合、`cacheRetention` は効果を持ちません。

### Google Gemini 直接 API

- 直接 Gemini トランスポート（`api: "google-generative-ai"`）は、
  上流の `cachedContentTokenCount` を通じて cache hit を報告します。OpenClaw はこれを `cacheRead` にマッピングします。
- 直接 Gemini モデルに `cacheRetention` が設定されている場合、OpenClaw は
  Google AI Studio 実行に対して system プロンプト用の `cachedContents` リソースを自動で
  作成、再利用、更新します。つまり、cached-content ハンドルを手動で事前作成する必要はありません。
- 設定済みモデル上の `params.cachedContent`（または旧来の `params.cached_content`）として、
  既存の Gemini cached-content ハンドルを渡すことも引き続き可能です。
- これは Anthropic/OpenAI の prompt-prefix キャッシュとは別物です。Gemini では、
  OpenClaw はリクエストにキャッシュマーカーを注入するのではなく、プロバイダー固有の
  `cachedContents` リソースを管理します。

### Gemini CLI JSON usage

- Gemini CLI JSON 出力も、`stats.cached` を通じて cache hit を表面化できます。
  OpenClaw はこれを `cacheRead` にマッピングします。
- CLI が直接の `stats.input` 値を省略した場合、OpenClaw は
  `stats.input_tokens - stats.cached` から入力 token を導出します。
- これは usage の正規化にすぎません。OpenClaw が Gemini CLI に対して
  Anthropic/OpenAI 方式の prompt-cache マーカーを作成していることを意味するものではありません。

## システムプロンプトのキャッシュ境界

OpenClaw は、システムプロンプトを内部のキャッシュ接頭辞境界で区切られた **安定した接頭辞** と **変動するサフィックス** に分割します。境界より上の内容（tool 定義、Skills メタデータ、workspace ファイル、その他の比較的静的なコンテキスト）は、ターンをまたいでバイト列が同一に保たれるよう順序付けされます。境界より下の内容（たとえば `HEARTBEAT.md`、ランタイムタイムスタンプ、その他のターンごとのメタデータ）は、キャッシュ済み接頭辞を無効化せずに変化できるようにします。

主な設計選択:

- 安定した workspace の project-context ファイルは `HEARTBEAT.md` より前に並べられるため、
  heartbeat の変動が安定接頭辞を壊しません。
- 境界は Anthropic 系、OpenAI 系、Google、および
  CLI トランスポート整形全体に適用されるため、サポートされるすべてのプロバイダーが同じ接頭辞安定性の恩恵を受けます。
- Codex Responses と Anthropic Vertex リクエストは
  boundary-aware なキャッシュ整形を通るため、キャッシュ再利用はプロバイダーが実際に受け取る内容と整合したままです。
- システムプロンプトのフィンガープリントは正規化されます（空白、改行、
  フック追加コンテキスト、ランタイム capability 順序）。そのため、意味的に変化していない
  プロンプトはターンをまたいで KV/キャッシュを共有します。

config や workspace 変更後に予期しない `cacheWrite` の急増が見られる場合は、
その変更がキャッシュ境界の上か下かを確認してください。変動する内容を境界の下へ移す
（またはそれを安定化する）ことで、問題が解決することがよくあります。

## OpenClaw のキャッシュ安定性ガード

OpenClaw はまた、プロバイダーに届く前にいくつかのキャッシュ感度の高いペイロード形状を決定的に保ちます。

- Bundle MCP tool カタログは tool
  登録前に決定的にソートされるため、`listTools()` 順序の変化が tools ブロックを変動させて
  prompt-cache 接頭辞を壊すことはありません。
- 永続化された画像ブロックを持つ旧来セッションでは、**直近 3 つの完了ターン**がそのまま保持されます。それより古い、すでに処理済みの画像ブロックは
  マーカーに置き換えられることがあり、画像の多いフォローアップで大きな
  古いペイロードを再送し続けないようにします。

## チューニングパターン

### 混在トラフィック（推奨デフォルト）

メインエージェントでは長寿命のベースラインを保ち、バースト的な notifier エージェントではキャッシュを無効にします。

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

### コスト優先ベースライン

- ベースライン `cacheRetention: "short"` を設定する。
- `contextPruning.mode: "cache-ttl"` を有効にする。
- TTL 未満の Heartbeat は、温かいキャッシュの恩恵を受けるエージェントに対してのみ維持する。

## キャッシュ診断

OpenClaw は、埋め込みエージェント実行に対して専用の cache-trace 診断を公開します。

通常のユーザー向け診断では、ライブセッションエントリーにそれらのカウンターがない場合、
`/status` やその他の usage サマリーは、
`cacheRead` /
`cacheWrite` のフォールバックソースとして最新のトランスクリプト usage エントリーを使えます。

## ライブ回帰テスト

OpenClaw は、繰り返し接頭辞、tool ターン、画像ターン、MCP 形式の tool トランスクリプト、および Anthropic の no-cache コントロールに対する、1 つの統合ライブキャッシュ回帰ゲートを維持しています。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

絞り込まれたライブゲートを実行するには:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

baseline ファイルには、直近で観測されたライブ値と、テストで使われるプロバイダー固有の回帰下限値が保存されます。
runner はまた、以前のキャッシュ state が現在の回帰サンプルを汚染しないように、新しい実行ごとのセッション ID と prompt namespace を使います。

これらのテストは、意図的にプロバイダー間で同一の成功基準を使っていません。

### Anthropic のライブ期待値

- `cacheWrite` による明示的な warmup write を期待する。
- Anthropic の cache control は会話をまたいでキャッシュブレークポイントを進めるため、繰り返しターンでほぼ完全な履歴再利用を期待する。
- 現在のライブアサーションは、安定、tool、画像パスに対して引き続き高い hit-rate 閾値を使う。

### OpenAI のライブ期待値

- `cacheRead` のみを期待する。`cacheWrite` は `0` のまま。
- 繰り返しターンのキャッシュ再利用は、Anthropic 方式の移動する全履歴再利用ではなく、プロバイダー固有の plateau として扱う。
- 現在のライブアサーションは、`gpt-5.4-mini` 上の観測済みライブ動作から導出された保守的な下限チェックを使う:
  - 安定接頭辞: `cacheRead >= 4608`, hit rate `>= 0.90`
  - tool トランスクリプト: `cacheRead >= 4096`, hit rate `>= 0.85`
  - 画像トランスクリプト: `cacheRead >= 3840`, hit rate `>= 0.82`
  - MCP 形式トランスクリプト: `cacheRead >= 4096`, hit rate `>= 0.85`

2026-04-04 の新しい統合ライブ検証結果:

- 安定接頭辞: `cacheRead=4864`, hit rate `0.966`
- tool トランスクリプト: `cacheRead=4608`, hit rate `0.896`
- 画像トランスクリプト: `cacheRead=4864`, hit rate `0.954`
- MCP 形式トランスクリプト: `cacheRead=4608`, hit rate `0.891`

統合ゲートの最近のローカル実測 wall-clock time は約 `88s` でした。

アサーションが異なる理由:

- Anthropic は明示的なキャッシュブレークポイントと、会話履歴の移動する再利用を公開します。
- OpenAI の prompt caching も依然として正確な接頭辞に敏感ですが、ライブ Responses トラフィックで実際に再利用可能な接頭辞は、完全なプロンプトより早く plateau することがあります。
- そのため、Anthropic と OpenAI を 1 つのプロバイダー横断パーセンテージ閾値で比較すると、偽の回帰が生じます。

### `diagnostics.cacheTrace` config

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # 任意
    includeMessages: false # デフォルト true
    includePrompt: false # デフォルト true
    includeSystem: false # デフォルト true
```

デフォルト:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env トグル（単発デバッグ）

- `OPENCLAW_CACHE_TRACE=1` で cache tracing を有効化。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` で出力パスを上書き。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` で完全なメッセージペイロード取得を切り替え。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` でプロンプトテキスト取得を切り替え。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` でシステムプロンプト取得を切り替え。

### 確認すべきこと

- Cache trace イベントは JSONL で、`session:loaded`、`prompt:before`、`stream:context`、`session:after` のような段階的スナップショットを含みます。
- ターンごとのキャッシュ token 影響は、通常の usage サーフェスを通じて `cacheRead` と `cacheWrite` で確認できます（たとえば `/usage full` や session usage サマリー）。
- Anthropic では、キャッシュが有効なら `cacheRead` と `cacheWrite` の両方が出ることを期待してください。
- OpenAI では、cache hit 時に `cacheRead` が出て、`cacheWrite` は `0` のままであることを期待してください。OpenAI は separate な cache-write token フィールドを公開しません。
- リクエスト tracing が必要なら、request ID と rate-limit ヘッダーはキャッシュメトリクスとは別に記録してください。OpenClaw の現在の cache-trace 出力は、生の provider 応答ヘッダーより、prompt/session 形状と正規化された token usage に焦点を当てています。

## クイックトラブルシューティング

- 多くのターンで `cacheWrite` が高い: 変動するシステムプロンプト入力を確認し、モデル/プロバイダーがそのキャッシュ設定をサポートしていることを検証してください。
- Anthropic で `cacheWrite` が高い: 多くの場合、キャッシュブレークポイントが毎回変化する内容に着地していることを意味します。
- OpenAI で `cacheRead` が低い: 安定した接頭辞が先頭にあること、繰り返される接頭辞が少なくとも 1024 token あること、およびキャッシュを共有すべきターンで同じ `prompt_cache_key` が再利用されていることを確認してください。
- `cacheRetention` が効かない: モデルキーが `agents.defaults.models["provider/model"]` と一致していることを確認してください。
- キャッシュ設定付きの Bedrock Nova/Mistral リクエスト: ランタイムで `none` に強制されるのは想定された動作です。

関連ドキュメント:

- [Anthropic](/ja-JP/providers/anthropic)
- [Token Use and Costs](/ja-JP/reference/token-use)
- [Session Pruning](/ja-JP/concepts/session-pruning)
- [Gateway Configuration Reference](/ja-JP/gateway/configuration-reference)

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
