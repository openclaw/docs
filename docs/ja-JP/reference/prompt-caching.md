---
read_when:
    - プロンプトのトークンコストをキャッシュ保持で削減したい
    - マルチエージェント構成ではエージェントごとのキャッシュ動作が必要です
    - Heartbeat と cache-ttl のプルーニングを一緒に調整している
summary: プロンプトキャッシュの調整項目、マージ順序、プロバイダーの挙動、チューニングパターン
title: プロンプトキャッシュ
x-i18n:
    generated_at: "2026-06-27T13:00:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

プロンプトキャッシュとは、モデルプロバイダーが毎回再処理する代わりに、変更されていないプロンプト接頭辞（通常は system/developer 指示やその他の安定したコンテキスト）をターン間で再利用できることを意味します。OpenClaw は、上流 API がそれらのカウンターを直接公開している場合、プロバイダー使用量を `cacheRead` と `cacheWrite` に正規化します。

ステータス表示面は、ライブセッションスナップショットにそれらが欠けている場合、直近のトランスクリプト使用量ログからキャッシュカウンターを復元することもできるため、部分的にセッションメタデータが失われた後でも `/status` はキャッシュ行を表示し続けられます。既存の非ゼロのライブキャッシュ値は、引き続きトランスクリプトのフォールバック値より優先されます。

これが重要な理由: トークンコストの低下、応答の高速化、長時間実行セッションでのより予測しやすいパフォーマンスです。キャッシュがない場合、ほとんどの入力が変わっていなくても、繰り返しのプロンプトは毎ターン完全なプロンプトコストを支払います。

以下のセクションでは、プロンプト再利用とトークンコストに影響するすべてのキャッシュ関連ノブを扱います。

プロバイダー参照:

- Anthropic プロンプトキャッシュ: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI プロンプトキャッシュ: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API ヘッダーとリクエスト ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic リクエスト ID とエラー: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要なノブ

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
3. `agents.list[].params`（一致するエージェント ID。キーごとに上書き）

### `contextPruning.mode: "cache-ttl"`

キャッシュ TTL ウィンドウ後に古いツール結果コンテキストを刈り込み、アイドル後のリクエストで肥大化した履歴を再キャッシュしないようにします。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完全な動作については [セッション刈り込み](/ja-JP/concepts/session-pruning) を参照してください。

### Heartbeat の保温

Heartbeat はキャッシュウィンドウを温めたままにし、アイドル間隔後の繰り返しキャッシュ書き込みを減らせます。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

エージェント単位の Heartbeat は `agents.list[].heartbeat` でサポートされます。

## プロバイダーの動作

### Anthropic（直接 API）

- `cacheRetention` がサポートされます。
- Anthropic API キー認証プロファイルでは、未設定の場合、OpenClaw は Anthropic モデル参照に `cacheRetention: "short"` をシードします。
- Anthropic ネイティブ Messages 応答は `cache_read_input_tokens` と `cache_creation_input_tokens` の両方を公開するため、OpenClaw は `cacheRead` と `cacheWrite` の両方を表示できます。
- ネイティブ Anthropic リクエストでは、`cacheRetention: "short"` はデフォルトの 5 分間のエフェメラルキャッシュに対応し、`cacheRetention: "long"` は直接 `api.anthropic.com` ホストでのみ 1 時間 TTL にアップグレードされます。

### OpenAI（直接 API）

- プロンプトキャッシュは、サポートされる最近のモデルでは自動です。OpenClaw がブロックレベルのキャッシュマーカーを挿入する必要はありません。
- OpenClaw は `prompt_cache_key` を使用して、ターン間のキャッシュルーティングを安定させます。直接 OpenAI ホストでは、`cacheRetention: "long"` が選択された場合に `prompt_cache_retention: "24h"` を使用します。
- OpenAI 互換 Completions プロバイダーは、そのモデル設定で `compat.supportsPromptCacheKey: true` が明示的に設定されている場合にのみ `prompt_cache_key` を受け取ります。長期保持の転送は別のケイパビリティです。明示的な `cacheRetention: "long"` は、その compat エントリが長期キャッシュ保持もサポートする場合にのみ `prompt_cache_retention: "24h"` を送信します。Mistral などのプロバイダーは、`compat.supportsLongCacheRetention: false` を設定して長期保持フィールドを抑制しつつ、キャッシュキーにオプトインできます。`cacheRetention: "none"` は両方のフィールドを抑制します。
- OpenAI 応答は、`usage.prompt_tokens_details.cached_tokens`（または Responses API イベントでは `input_tokens_details.cached_tokens`）を通じてキャッシュ済みプロンプトトークンを公開します。OpenClaw はそれを `cacheRead` に対応付けます。
- OpenAI は別個のキャッシュ書き込みトークンカウンターを公開しないため、プロバイダーがキャッシュを温めている場合でも、OpenAI パスでは `cacheWrite` は `0` のままです。
- OpenAI は `x-request-id`、`openai-processing-ms`、`x-ratelimit-*` などの有用なトレースおよびレート制限ヘッダーを返しますが、キャッシュヒットの集計はヘッダーではなく使用量ペイロードから取得するべきです。
- 実際には、OpenAI は Anthropic 風の移動する全履歴再利用というより、初期接頭辞キャッシュのように振る舞うことがよくあります。安定した長い接頭辞テキストのターンは、現在のライブプローブでは `4864` キャッシュ済みトークン付近の高止まりに到達することがあり、ツールが多い、または MCP 風のトランスクリプトでは、完全に同じ繰り返しでも `4608` キャッシュ済みトークン付近で高止まりすることがよくあります。

### Anthropic Vertex

- Vertex AI 上の Anthropic モデル（`anthropic-vertex/*`）は、直接 Anthropic と同じ方法で `cacheRetention` をサポートします。
- `cacheRetention: "long"` は、Vertex AI エンドポイント上の実際の 1 時間プロンプトキャッシュ TTL に対応します。
- `anthropic-vertex` のデフォルトキャッシュ保持は、直接 Anthropic のデフォルトと一致します。
- Vertex リクエストは境界対応のキャッシュ整形を通じてルーティングされるため、キャッシュ再利用はプロバイダーが実際に受け取る内容と揃ったままになります。

### Amazon Bedrock

- Anthropic Claude モデル参照（`amazon-bedrock/*anthropic.claude*`）は、明示的な `cacheRetention` のパススルーをサポートします。
- Anthropic 以外の Bedrock モデルは、ランタイムで `cacheRetention: "none"` に強制されます。

### OpenRouter モデル

`openrouter/anthropic/*` モデル参照では、OpenClaw は、リクエストがまだ検証済みの OpenRouter ルート（デフォルトエンドポイント上の `openrouter`、または `openrouter.ai` に解決される任意のプロバイダー/ベース URL）を対象としている場合にのみ、プロンプトキャッシュ再利用を改善するため、system/developer プロンプトブロックに Anthropic `cache_control` を挿入します。

`openrouter/deepseek/*`、`openrouter/moonshot*/*`、および `openrouter/zai/*` モデル参照では、OpenRouter がプロバイダー側のプロンプトキャッシュを自動的に処理するため、`contextPruning.mode: "cache-ttl"` が許可されます。OpenClaw はこれらのリクエストに Anthropic `cache_control` マーカーを挿入しません。

DeepSeek のキャッシュ構築はベストエフォートで、数秒かかることがあります。直後のフォローアップではまだ `cached_tokens: 0` が表示される場合があります。短い遅延後に同じ接頭辞のリクエストを繰り返して検証し、キャッシュヒットのシグナルとして `usage.prompt_tokens_details.cached_tokens` を使用してください。

モデルを任意の OpenAI 互換プロキシ URL に向け直した場合、OpenClaw はそれらの OpenRouter 固有の Anthropic キャッシュマーカーの挿入を停止します。

### その他のプロバイダー

プロバイダーがこのキャッシュモードをサポートしない場合、`cacheRetention` は効果を持ちません。

### Google Gemini 直接 API

- 直接 Gemini トランスポート（`api: "google-generative-ai"`）は、上流の `cachedContentTokenCount` を通じてキャッシュヒットを報告します。OpenClaw はそれを `cacheRead` に対応付けます。
- 直接 Gemini モデルに `cacheRetention` が設定されている場合、OpenClaw は Google AI Studio 実行上のシステムプロンプト用に `cachedContents` リソースを自動的に作成、再利用、更新します。これにより、キャッシュ済みコンテンツハンドルを手動で事前作成する必要はなくなります。
- 構成済みモデル上で、既存の Gemini キャッシュ済みコンテンツハンドルを `params.cachedContent`（またはレガシーの `params.cached_content`）として渡すことも引き続き可能です。
- これは Anthropic/OpenAI のプロンプト接頭辞キャッシュとは別です。Gemini では、OpenClaw はリクエストにキャッシュマーカーを挿入するのではなく、プロバイダーネイティブの `cachedContents` リソースを管理します。

### Gemini CLI の使用量

- Gemini CLI の `stream-json` 出力は、`stats.cached` を通じてキャッシュヒットを表面化できます。OpenClaw はそれを `cacheRead` に対応付けます。レガシーの `--output-format json` 上書きも同じ使用量正規化を使用します。
- CLI が直接の `stats.input` 値を省略した場合、OpenClaw は `stats.input_tokens - stats.cached` から入力トークンを導出します。
- これは使用量の正規化のみです。OpenClaw が Gemini CLI のために Anthropic/OpenAI 風のプロンプトキャッシュマーカーを作成していることを意味しません。

## システムプロンプトのキャッシュ境界

OpenClaw は、システムプロンプトを内部のキャッシュ接頭辞境界で区切られた **安定した接頭辞** と **揮発性の接尾辞** に分割します。境界より上のコンテンツ（ツール定義、Skills メタデータ、ワークスペースファイル、その他の比較的静的なコンテキスト）は、ターン間でバイト単位で同一のままになるように順序付けられます。境界より下のコンテンツ（たとえば `HEARTBEAT.md`、ランタイムタイムスタンプ、その他のターン単位メタデータ）は、キャッシュ済み接頭辞を無効化せずに変更できます。

主要な設計上の選択:

- 安定したワークスペースのプロジェクトコンテキストファイルは `HEARTBEAT.md` より前に順序付けられるため、Heartbeat の変動が安定した接頭辞を壊しません。
- 境界は Anthropic 系、OpenAI 系、Google、および CLI トランスポート整形全体に適用されるため、サポートされるすべてのプロバイダーが同じ接頭辞安定性の恩恵を受けます。
- Codex Responses と Anthropic Vertex リクエストは、境界対応のキャッシュ整形を通じてルーティングされるため、キャッシュ再利用はプロバイダーが実際に受け取る内容と揃ったままになります。
- システムプロンプトのフィンガープリントは正規化される（空白、行末、フックで追加されたコンテキスト、ランタイムケイパビリティの順序）ため、意味的に変更されていないプロンプトはターン間で KV/キャッシュを共有します。

設定またはワークスペース変更後に予期しない `cacheWrite` の急増が見られる場合は、その変更がキャッシュ境界の上にあるか下にあるかを確認してください。揮発性コンテンツを境界の下に移動する（または安定化する）ことで、多くの場合この問題は解決します。

## OpenClaw のキャッシュ安定性ガード

OpenClaw は、リクエストがプロバイダーに到達する前に、複数のキャッシュに敏感なペイロード形状も決定論的に保ちます。

- バンドル MCP ツールカタログはツール登録前に決定論的にソートされるため、`listTools()` の順序変更がツールブロックを変動させたり、プロンプトキャッシュ接頭辞を壊したりしません。
- 永続化された画像ブロックを持つレガシーセッションは、**直近 3 件の完了済みターン** をそのまま保持します。より古い処理済み画像ブロックは、画像の多いフォローアップで大きな古いペイロードを再送し続けないよう、マーカーに置き換えられる場合があります。

## チューニングパターン

### 混合トラフィック（推奨デフォルト）

メインエージェントでは長寿命のベースラインを維持し、バースト的な通知エージェントではキャッシュを無効化します:

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
- `contextPruning.mode: "cache-ttl"` を有効にします。
- 温かいキャッシュの恩恵を受けるエージェントに限り、Heartbeat を TTL より短く保ちます。

## キャッシュ診断

OpenClaw は、埋め込みエージェント実行向けに専用のキャッシュトレース診断を公開します。

通常のユーザー向け診断では、ライブセッションエントリにそれらのカウンターがない場合、`/status` やその他の使用量サマリーは、最新のトランスクリプト使用量エントリを `cacheRead` / `cacheWrite` のフォールバックソースとして使用できます。

## ライブ回帰テスト

OpenClaw は、繰り返し接頭辞、ツールターン、画像ターン、MCP 風ツールトランスクリプト、および Anthropic のキャッシュなしコントロールのために、1 つの結合ライブキャッシュ回帰ゲートを保持しています。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

狭いライブゲートを実行するには:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ベースラインファイルには、直近に観測されたライブ数値と、テストで使用されるプロバイダー固有の回帰下限が保存されます。
ランナーは、以前のキャッシュ状態が現在の回帰サンプルを汚染しないよう、実行ごとに新しいセッション ID とプロンプト名前空間も使用します。

これらのテストは、プロバイダー間で同一の成功基準を意図的に使用していません。

### Anthropic ライブ期待値

- `cacheWrite` による明示的なウォームアップ書き込みを期待します。
- Anthropic のキャッシュ制御は会話を通じてキャッシュブレークポイントを進めるため、繰り返しターンではほぼ全履歴の再利用を期待します。
- 現在のライブアサーションでは、安定パス、ツールパス、画像パスに対して引き続き高いヒット率しきい値を使用しています。

### OpenAI ライブ期待値

- `cacheRead` のみを期待します。`cacheWrite` は `0` のままです。
- 繰り返しターンでのキャッシュ再利用は、Anthropic 型の移動する全履歴再利用ではなく、プロバイダー固有のプラトーとして扱います。
- 現在のライブアサーションでは、`gpt-5.4-mini` で観測されたライブ挙動から導いた保守的な下限チェックを使用しています。
  - 安定プレフィックス: `cacheRead >= 4608`、ヒット率 `>= 0.90`
  - ツールトランスクリプト: `cacheRead >= 4096`、ヒット率 `>= 0.85`
  - 画像トランスクリプト: `cacheRead >= 3840`、ヒット率 `>= 0.82`
  - MCP スタイルのトランスクリプト: `cacheRead >= 4096`、ヒット率 `>= 0.85`

2026-04-04 の新しい統合ライブ検証は次の結果になりました。

- 安定プレフィックス: `cacheRead=4864`、ヒット率 `0.966`
- ツールトランスクリプト: `cacheRead=4608`、ヒット率 `0.896`
- 画像トランスクリプト: `cacheRead=4864`、ヒット率 `0.954`
- MCP スタイルのトランスクリプト: `cacheRead=4608`、ヒット率 `0.891`

統合ゲートの最近のローカル実時間は約 `88s` でした。

アサーションが異なる理由:

- Anthropic は明示的なキャッシュブレークポイントと、移動する会話履歴の再利用を公開しています。
- OpenAI のプロンプトキャッシュは依然として完全一致プレフィックスに敏感ですが、ライブ Responses トラフィックで実効的に再利用可能なプレフィックスは、プロンプト全体より早い時点でプラトーに達することがあります。
- そのため、単一のプロバイダー横断パーセンテージしきい値で Anthropic と OpenAI を比較すると、誤ったリグレッションが発生します。

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

### 環境変数トグル（一回限りのデバッグ）

- `OPENCLAW_CACHE_TRACE=1` はキャッシュトレースを有効にします。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` は出力パスを上書きします。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` はメッセージペイロード全体のキャプチャを切り替えます。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` はプロンプトテキストのキャプチャを切り替えます。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` はシステムプロンプトのキャプチャを切り替えます。

### 確認する内容

- キャッシュトレースイベントは JSONL で、`session:loaded`、`prompt:before`、`stream:context`、`session:after` のような段階的スナップショットを含みます。
- ターンごとのキャッシュトークン影響は、通常の使用サーフェスで `cacheRead` と `cacheWrite` を通じて確認できます（例: `/usage full` とセッション使用量サマリー）。
- Anthropic では、キャッシュが有効な場合に `cacheRead` と `cacheWrite` の両方を期待します。
- OpenAI では、キャッシュヒット時に `cacheRead` を期待し、`cacheWrite` は `0` のままです。OpenAI は個別のキャッシュ書き込みトークンフィールドを公開していません。
- リクエストトレースが必要な場合は、リクエスト ID とレート制限ヘッダーをキャッシュメトリクスとは別にログに記録してください。OpenClaw の現在のキャッシュトレース出力は、生のプロバイダーレスポンスヘッダーではなく、プロンプト/セッション形状と正規化されたトークン使用量に重点を置いています。

## クイックトラブルシューティング

- ほとんどのターンで `cacheWrite` が高い: 変動しやすいシステムプロンプト入力を確認し、モデル/プロバイダーがキャッシュ設定をサポートしていることを検証します。
- Anthropic で `cacheWrite` が高い: 多くの場合、キャッシュブレークポイントがリクエストごとに変わるコンテンツに着地していることを意味します。
- OpenAI の `cacheRead` が低い: 安定プレフィックスが先頭にあり、繰り返しプレフィックスが少なくとも 1024 トークンであり、キャッシュを共有するべきターンで同じ `prompt_cache_key` が再利用されていることを検証します。
- `cacheRetention` の効果がない: モデルキーが `agents.defaults.models["provider/model"]` と一致していることを確認します。
- キャッシュ設定を含む Bedrock Nova/Mistral リクエスト: 実行時に `none` へ強制されるのが期待される挙動です。

関連ドキュメント:

- [Anthropic](/ja-JP/providers/anthropic)
- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [セッションプルーニング](/ja-JP/concepts/session-pruning)
- [Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference)

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
