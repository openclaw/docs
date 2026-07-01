---
read_when:
    - プロンプトのトークンコストをキャッシュ保持で削減したい
    - マルチエージェント構成では、エージェントごとのキャッシュ動作が必要です
    - heartbeat と cache-ttl のプルーニングを一緒に調整している
summary: プロンプトキャッシュの調整項目、マージ順序、プロバイダーの挙動、チューニングパターン
title: プロンプトキャッシュ
x-i18n:
    generated_at: "2026-07-01T18:07:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

プロンプトキャッシュとは、モデルプロバイダーが、変更されていないプロンプト接頭辞（通常は system/developer instructions やその他の安定したコンテキスト）を毎ターン再処理する代わりに、ターン間で再利用できることを意味します。OpenClaw は、上流 API がこれらのカウンターを直接公開している場合、プロバイダー使用量を `cacheRead` と `cacheWrite` に正規化します。

ライブセッションのスナップショットにキャッシュカウンターがない場合でも、ステータス画面は最新の transcript
使用量ログからキャッシュカウンターを復元できるため、部分的にセッションメタデータが失われた後も `/status` は
キャッシュ行を表示し続けられます。既存のゼロでないライブ
キャッシュ値は、引き続き transcript フォールバック値より優先されます。

これが重要な理由: トークンコストが下がり、応答が速くなり、長時間実行セッションのパフォーマンスがより予測しやすくなります。キャッシュがない場合、入力の大半が変わっていなくても、繰り返されるプロンプトは毎ターン完全なプロンプトコストを支払います。

以下のセクションでは、プロンプト再利用とトークンコストに影響するすべてのキャッシュ関連のノブを扱います。

プロバイダー参照:

- Anthropic プロンプトキャッシュ: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI プロンプトキャッシュ: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API ヘッダーとリクエスト ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic リクエスト ID とエラー: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要なノブ

### `cacheRetention`（グローバルデフォルト、モデル、エージェント単位）

すべてのモデルに対するグローバルデフォルトとしてキャッシュ保持を設定します:

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

キャッシュ TTL ウィンドウの後に古いツール結果コンテキストを pruning し、アイドル後のリクエストが肥大化した履歴を再キャッシュしないようにします。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完全な動作については [Session Pruning](/ja-JP/concepts/session-pruning) を参照してください。

### Heartbeat のウォーム維持

Heartbeat はキャッシュウィンドウを温かい状態に保ち、アイドル間隔の後に繰り返されるキャッシュ書き込みを減らせます。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

エージェント単位の heartbeat は `agents.list[].heartbeat` でサポートされています。

## プロバイダーの動作

### Anthropic（直接 API）

- `cacheRetention` がサポートされています。
- Anthropic API キー認証プロファイルでは、OpenClaw は未設定時に Anthropic モデル参照へ `cacheRetention: "short"` を seed します。
- Anthropic ネイティブ Messages レスポンスは `cache_read_input_tokens` と `cache_creation_input_tokens` の両方を公開するため、OpenClaw は `cacheRead` と `cacheWrite` の両方を表示できます。
- ネイティブ Anthropic リクエストでは、`cacheRetention: "short"` はデフォルトの 5 分 ephemeral キャッシュに対応し、`cacheRetention: "long"` は直接 `api.anthropic.com` ホストでのみ 1 時間 TTL にアップグレードされます。

### OpenAI（直接 API）

- プロンプトキャッシュは、サポートされる最近のモデルで自動的に行われます。OpenClaw がブロック単位のキャッシュマーカーを注入する必要はありません。
- OpenClaw は `prompt_cache_key` を使用して、ターン間のキャッシュルーティングを安定させます。直接 OpenAI ホストでは、`cacheRetention: "long"` が選択された場合に `prompt_cache_retention: "24h"` を使用します。
- OpenAI 互換 Completions プロバイダーは、モデル設定で `compat.supportsPromptCacheKey: true` が明示的に設定されている場合にのみ `prompt_cache_key` を受け取ります。長期保持の転送は別の機能です。明示的な `cacheRetention: "long"` は、その compat エントリが長期キャッシュ保持もサポートする場合にのみ `prompt_cache_retention: "24h"` を送信します。Mistral などのプロバイダーは、`compat.supportsLongCacheRetention: false` を設定して長期保持フィールドを抑制しながら、キャッシュキーに opt in できます。`cacheRetention: "none"` は両方のフィールドを抑制します。
- OpenAI レスポンスは `usage.prompt_tokens_details.cached_tokens`（または Responses API イベントの `input_tokens_details.cached_tokens`）を通じてキャッシュ済みプロンプトトークンを公開します。OpenClaw はそれを `cacheRead` にマップします。
- GPT-5.6 Responses 使用量は `input_tokens_details.cache_write_tokens` も公開できます。OpenClaw はそれを `cacheWrite` にマップし、モデルのキャッシュ書き込みレートで価格計算します。このフィールドを省略する Responses では `cacheWrite` は `0` のままです。
- OpenAI は `x-request-id`、`openai-processing-ms`、`x-ratelimit-*` などの有用なトレースおよびレート制限ヘッダーを返しますが、キャッシュヒットの集計はヘッダーではなく使用量ペイロードから取得する必要があります。
- 実際には、OpenAI は Anthropic スタイルの移動する完全履歴再利用というよりも、初期接頭辞キャッシュのように振る舞うことがよくあります。安定した長い接頭辞テキストのターンは、現在のライブ probe では `4864` キャッシュ済みトークン付近の plateau に達することがあります。一方、ツールが多い transcript や MCP スタイルの transcript は、完全な繰り返しでも `4608` キャッシュ済みトークン付近で plateau になることがよくあります。

### Anthropic Vertex

- Vertex AI 上の Anthropic モデル（`anthropic-vertex/*`）は、直接 Anthropic と同じように `cacheRetention` をサポートします。
- `cacheRetention: "long"` は Vertex AI エンドポイント上の実際の 1 時間プロンプトキャッシュ TTL に対応します。
- `anthropic-vertex` のデフォルトキャッシュ保持は、直接 Anthropic のデフォルトと一致します。
- Vertex リクエストは境界対応のキャッシュ shaping を通してルーティングされるため、キャッシュ再利用はプロバイダーが実際に受け取る内容と揃ったままになります。

### Amazon Bedrock

- Anthropic Claude モデル参照（`amazon-bedrock/*anthropic.claude*`）は、明示的な `cacheRetention` パススルーをサポートします。
- Anthropic 以外の Bedrock モデルは、実行時に `cacheRetention: "none"` に強制されます。

### OpenRouter モデル

`openrouter/anthropic/*` モデル参照では、OpenClaw はプロンプトキャッシュ
再利用を改善するため、system/developer プロンプトブロックに Anthropic
`cache_control` を注入します。ただし、リクエストが検証済みの OpenRouter ルート
（デフォルトエンドポイント上の `openrouter`、または `openrouter.ai` に解決される任意の provider/base URL）をまだ対象としている場合に限ります。

`openrouter/deepseek/*`、`openrouter/moonshot*/*`、および `openrouter/zai/*`
モデル参照では、OpenRouter がプロバイダー側のプロンプトキャッシュを自動的に
処理するため、`contextPruning.mode: "cache-ttl"` が許可されます。OpenClaw はそれらのリクエストに
Anthropic `cache_control` マーカーを注入しません。

DeepSeek のキャッシュ構築はベストエフォートで、数秒かかることがあります。
直後のフォローアップではまだ `cached_tokens: 0` が表示される場合があります。短い遅延の後に
同じ接頭辞のリクエストを繰り返して検証し、キャッシュヒット信号として
`usage.prompt_tokens_details.cached_tokens` を使用してください。

モデルを任意の OpenAI 互換プロキシ URL に向け直すと、OpenClaw は
それらの OpenRouter 固有の Anthropic キャッシュマーカーの注入を停止します。

### その他のプロバイダー

プロバイダーがこのキャッシュモードをサポートしていない場合、`cacheRetention` は効果がありません。

### Google Gemini 直接 API

- 直接 Gemini transport（`api: "google-generative-ai"`）は、上流の `cachedContentTokenCount` を通じてキャッシュヒットを報告します。OpenClaw はそれを `cacheRead` にマップします。
- 直接 Gemini モデルで `cacheRetention` が設定されている場合、OpenClaw は Google AI Studio 実行の system prompts に対して `cachedContents` リソースを自動的に作成、再利用、更新します。つまり、cached-content ハンドルを手動で事前作成する必要はなくなります。
- 既存の Gemini cached-content ハンドルを、設定済みモデルの `params.cachedContent`（またはレガシーの `params.cached_content`）として引き続き渡せます。
- これは Anthropic/OpenAI のプロンプト接頭辞キャッシュとは別です。Gemini では、OpenClaw はリクエストにキャッシュマーカーを注入するのではなく、プロバイダーネイティブの `cachedContents` リソースを管理します。

### Gemini CLI 使用量

- Gemini CLI `stream-json` 出力は、`stats.cached` を通じてキャッシュヒットを表面化できます。OpenClaw はそれを `cacheRead` にマップします。レガシーの `--output-format json` 上書きでも同じ使用量正規化を使用します。
- CLI が直接の `stats.input` 値を省略した場合、OpenClaw は `stats.input_tokens - stats.cached` から入力トークンを導出します。
- これは使用量の正規化のみです。OpenClaw が Gemini CLI のために Anthropic/OpenAI スタイルのプロンプトキャッシュマーカーを作成しているという意味ではありません。

## システムプロンプトのキャッシュ境界

OpenClaw はシステムプロンプトを、内部キャッシュ接頭辞境界で分離された **安定した接頭辞** と **揮発的な接尾辞** に分割します。境界より上のコンテンツ（ツール定義、Skills メタデータ、ワークスペースファイル、その他比較的静的なコンテキスト）は、ターン間でバイト単位で同一のままになるように順序付けされます。境界より下のコンテンツ（たとえば `HEARTBEAT.md`、ランタイムタイムスタンプ、その他のターン単位メタデータ）は、キャッシュ済み接頭辞を無効化せずに変更できます。

主要な設計上の選択:

- 安定したワークスペースプロジェクトコンテキストファイルは `HEARTBEAT.md` より前に順序付けされるため、heartbeat の変動が安定した接頭辞を壊しません。
- 境界は Anthropic ファミリー、OpenAI ファミリー、Google、および CLI transport shaping 全体に適用されるため、サポートされるすべてのプロバイダーが同じ接頭辞の安定性から恩恵を受けます。
- Codex Responses と Anthropic Vertex リクエストは、境界対応のキャッシュ shaping を通してルーティングされるため、キャッシュ再利用はプロバイダーが実際に受け取る内容と揃ったままになります。
- システムプロンプトの fingerprint は正規化されます（空白、改行、hook で追加されたコンテキスト、ランタイム機能の順序）。これにより、意味的に変更されていないプロンプトはターン間で KV/キャッシュを共有します。

設定やワークスペースの変更後に予期しない `cacheWrite` スパイクが見られる場合は、その変更がキャッシュ境界の上か下のどちらに入るかを確認してください。揮発的なコンテンツを境界より下に移動する（または安定化する）ことで、問題が解決することがよくあります。

## OpenClaw のキャッシュ安定性ガード

OpenClaw はまた、リクエストがプロバイダーに到達する前に、複数のキャッシュに敏感なペイロード形状を決定的に保ちます:

- Bundle MCP ツールカタログはツール登録前に決定的にソートされるため、`listTools()` の順序変更が tools ブロックを変動させたり、プロンプトキャッシュ接頭辞を壊したりしません。
- 永続化された画像ブロックを持つレガシーセッションでは、**直近 3 件の完了済みターン** はそのまま保持されます。古い処理済み画像ブロックは、画像の多いフォローアップで大きな古いペイロードを再送し続けないように、マーカーに置き換えられる場合があります。

## チューニングパターン

### 混在トラフィック（推奨デフォルト）

メインエージェントでは長寿命のベースラインを維持し、バースト的な notifier エージェントではキャッシュを無効化します:

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
- warm cache の恩恵を受けるエージェントに対してのみ、TTL より短い heartbeat を維持します。

## キャッシュ診断

OpenClaw は、埋め込みエージェント実行用の専用キャッシュトレース診断を公開します。

通常のユーザー向け診断では、ライブセッションエントリにそれらのカウンターがない場合、
`/status` やその他の使用量サマリーは、最新の transcript 使用量エントリを
`cacheRead` / `cacheWrite` のフォールバックソースとして使用できます。

## ライブ回帰テスト

OpenClaw は、繰り返し接頭辞、ツールターン、画像ターン、MCP スタイルのツール transcript、および Anthropic の no-cache control に対して、1 つの統合ライブキャッシュ回帰ゲートを維持しています。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

狭いライブゲートを次のように実行します:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ベースラインファイルには、直近で観測されたライブ数値と、テストで使用するプロバイダー固有の回帰下限が保存されます。
ランナーは、過去のキャッシュ状態が現在の回帰サンプルを汚染しないように、新しい実行ごとのセッション ID とプロンプト名前空間も使用します。

これらのテストでは、プロバイダー間で同一の成功基準を意図的に使用していません。

### Anthropic ライブ期待値

- `cacheWrite` による明示的なウォームアップ書き込みを期待します。
- Anthropic のキャッシュ制御は会話を通じてキャッシュブレークポイントを進めるため、繰り返しターンでほぼ完全な履歴再利用を期待します。
- 現在のライブアサーションでは、stable、tool、image パスに対して引き続き高いヒット率しきい値を使用します。

### OpenAI ライブ期待値

- `cacheRead` のみを期待します。`cacheWrite` は `0` のままです。
- 繰り返しターンのキャッシュ再利用は、Anthropic 形式の移動する全履歴再利用ではなく、プロバイダー固有のプラトーとして扱います。
- 現在のライブアサーションでは、`gpt-5.4-mini` で観測されたライブ動作から導出した保守的な下限チェックを使用します。
  - stable prefix: `cacheRead >= 4608`、ヒット率 `>= 0.90`
  - tool transcript: `cacheRead >= 4096`、ヒット率 `>= 0.85`
  - image transcript: `cacheRead >= 3840`、ヒット率 `>= 0.82`
  - MCP-style transcript: `cacheRead >= 4096`、ヒット率 `>= 0.85`

2026-04-04 の新しい統合ライブ検証の結果は次のとおりです。

- stable prefix: `cacheRead=4864`、ヒット率 `0.966`
- tool transcript: `cacheRead=4608`、ヒット率 `0.896`
- image transcript: `cacheRead=4864`、ヒット率 `0.954`
- MCP-style transcript: `cacheRead=4608`、ヒット率 `0.891`

統合ゲートの最近のローカル実時間は約 `88s` でした。

アサーションが異なる理由:

- Anthropic は明示的なキャッシュブレークポイントと、移動する会話履歴の再利用を公開します。
- OpenAI のプロンプトキャッシュは引き続き完全一致プレフィックスに依存しますが、ライブ Responses トラフィックで実際に再利用可能なプレフィックスは、完全なプロンプトより早い段階でプラトーに達することがあります。
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

### 環境トグル（一回限りのデバッグ）

- `OPENCLAW_CACHE_TRACE=1` はキャッシュトレースを有効にします。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` は出力パスを上書きします。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` は完全なメッセージペイロードのキャプチャを切り替えます。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` はプロンプトテキストのキャプチャを切り替えます。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` はシステムプロンプトのキャプチャを切り替えます。

### 確認する内容

- キャッシュトレースイベントは JSONL で、`session:loaded`、`prompt:before`、`stream:context`、`session:after` のような段階的なスナップショットを含みます。
- ターンごとのキャッシュトークンへの影響は、通常の利用サーフェスで `cacheRead` と `cacheWrite` を通じて確認できます（例: `/usage tokens`、`/status`、セッション使用量サマリー、カスタム `messages.usageTemplate` レイアウト）。
- Anthropic では、キャッシュがアクティブなときに `cacheRead` と `cacheWrite` の両方を期待します。
- OpenAI では、キャッシュヒット時に `cacheRead` を期待します。GPT-5.6 Responses はプロンプトセグメントが書き込まれる間に `cacheWrite` も報告できます。書き込みカウンターを省略するその他の Responses ペイロードでは、それは `0` のままです。
- リクエストトレースが必要な場合は、リクエスト ID とレート制限ヘッダーをキャッシュメトリクスとは別にログに記録してください。OpenClaw の現在のキャッシュトレース出力は、生のプロバイダーレスポンスヘッダーではなく、プロンプト/セッション形状と正規化されたトークン使用量に焦点を当てています。

## クイックトラブルシューティング

- ほとんどのターンで `cacheWrite` が高い: 変動するシステムプロンプト入力を確認し、モデル/プロバイダーがキャッシュ設定をサポートしていることを検証してください。
- Anthropic で `cacheWrite` が高い: 多くの場合、キャッシュブレークポイントがリクエストごとに変化する内容に到達していることを意味します。
- OpenAI の `cacheRead` が低い: stable prefix が先頭にあること、繰り返しプレフィックスが少なくとも 1024 トークンであること、キャッシュを共有すべきターンで同じ `prompt_cache_key` が再利用されていることを検証してください。
- `cacheRetention` の効果がない: モデルキーが `agents.defaults.models["provider/model"]` と一致することを確認してください。
- キャッシュ設定を含む Bedrock Nova/Mistral リクエスト: ランタイムで `none` に強制されることが期待されます。

関連ドキュメント:

- [Anthropic](/ja-JP/providers/anthropic)
- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [セッションプルーニング](/ja-JP/concepts/session-pruning)
- [Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference)

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API 使用量とコスト](/ja-JP/reference/api-usage-costs)
