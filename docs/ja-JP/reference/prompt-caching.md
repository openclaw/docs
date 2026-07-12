---
read_when:
    - キャッシュ保持によってプロンプトのトークンコストを削減したい場合
    - マルチエージェント構成では、エージェントごとのキャッシュ動作が必要です
    - Heartbeat とキャッシュ TTL のプルーニングを併せて調整しています
summary: プロンプトキャッシュの設定項目、マージ順序、プロバイダーの動作、チューニングパターン
title: プロンプトキャッシュ
x-i18n:
    generated_at: "2026-07-11T22:39:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

プロンプトキャッシュを使用すると、モデルプロバイダーは変更されていないプロンプトのプレフィックス（システム/開発者向け指示、ツール定義、その他の安定したコンテキスト）をターン間で再利用でき、リクエストごとに再処理する必要がなくなります。これにより、コンテキストが繰り返される長時間セッションで、トークンコストとレイテンシーが削減されます。

OpenClaw は、上流 API がこれらのカウンターを公開している場合、プロバイダーの使用量を `cacheRead` と `cacheWrite` に正規化します。使用量の概要（`/status` など）は、ライブセッションのスナップショットにキャッシュカウンターがない場合、最後のトランスクリプト使用量エントリにフォールバックします。ライブ値が 0 でない場合は、常にフォールバックより優先されます。

プロバイダーの参考資料:

- [Anthropic のプロンプトキャッシュ](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI のプロンプトキャッシュ](https://developers.openai.com/api/docs/guides/prompt-caching)

## 主要な設定項目

### `cacheRetention`

値: `"none" | "short" | "long"`。グローバルデフォルト、モデル単位、エージェント単位で設定できます。

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # このモデルではグローバルデフォルトを上書き
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # このエージェントでは両方のデフォルトを上書き
```

マージ順序（後のものが優先）:

1. `agents.defaults.params` - すべてのモデルに対するグローバルデフォルト
2. `agents.defaults.models["provider/model"].params` - モデル単位の上書き
3. `agents.list[].params` - エージェント ID で照合される、エージェント単位の上書き

ソース: `src/agents/embedded-agent-runner/extra-params.ts`（`resolveExtraParams`）。

### `contextPruning.mode: "cache-ttl"`

キャッシュの TTL 期間が経過した後、古いツール結果のコンテキストを削除します。これにより、アイドル後のリクエストで過大な履歴が再びキャッシュされることを防ぎます。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完全な動作については、[セッションのプルーニング](/ja-JP/concepts/session-pruning)を参照してください。

### Heartbeat によるウォーム状態の維持

Heartbeat はキャッシュ期間をウォーム状態に保ち、アイドル期間後に繰り返されるキャッシュ書き込みを削減できます。グローバル（`agents.defaults.heartbeat`）またはエージェント単位（`agents.list[].heartbeat`）で設定できます。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## プロバイダーの動作

### Anthropic（直接 API および Vertex AI）

- `cacheRetention` は、`anthropic` および `anthropic-vertex` プロバイダーでサポートされます。また、`cacheRetention` が明示的に設定されている場合は、`amazon-bedrock` 上の Claude モデルと、カスタムの `anthropic-messages` 互換エンドポイントでもサポートされます。
- 未設定の場合、OpenClaw は直接 Anthropic に対して `cacheRetention: "short"` を初期値として設定します（`anthropic` および `anthropic-vertex` プロバイダーのみ。他の Anthropic 系ルートでは明示的な値が必要です）。
- ネイティブの Anthropic Messages レスポンスでは `cache_read_input_tokens` と `cache_creation_input_tokens` が公開され、それぞれ `cacheRead` と `cacheWrite` にマッピングされます。
- `cacheRetention: "short"` はデフォルトの 5 分間のエフェメラルキャッシュにマッピングされます。`cacheRetention: "long"` を明示的に設定すると、1 時間の TTL（`cache_control: { type: "ephemeral", ttl: "1h" }`）を要求します。暗黙的または環境変数による長期保持（明示的な `cacheRetention` なしで `OPENCLAW_CACHE_RETENTION=long`）が 1 時間の TTL にアップグレードされるのは、`api.anthropic.com` または Vertex AI（`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`）ホストのみです。他のホストでは 5 分間のキャッシュが維持されます。

ソース: `src/agents/anthropic-payload-policy.ts`（`resolveAnthropicEphemeralCacheControl`、`isLongTtlEligibleEndpoint`）。

### OpenAI（直接 API）

- サポート対象の新しいモデルではプロンプトキャッシュが自動的に行われます。OpenClaw はブロック単位のキャッシュマーカーを挿入しません。
- OpenClaw は、ターン間でキャッシュルーティングを安定させるために `prompt_cache_key` を送信します。直接の `api.openai.com` ホストでは、これは自動的に行われます。OpenAI 互換プロキシ（oMLX、llama.cpp、カスタムエンドポイント）で有効にするには、モデル設定に `compat.supportsPromptCacheKey: true` が必要です。プロキシに対して自動検出されることはありません。
- `prompt_cache_retention: "24h"` が追加されるのは、`cacheRetention: "long"` が選択され、解決されたエンドポイントがキャッシュキーと長期保持の両方をサポートしている場合のみです（`compat.supportsLongCacheRetention`、デフォルトは true。Together AI と Cloudflare の互換プロファイルでは無効）。`cacheRetention: "none"` は両方のフィールドを抑制します。
- キャッシュヒットは、`usage.prompt_tokens_details.cached_tokens`（Chat Completions）または `input_tokens_details.cached_tokens`（Responses API）を通じて公開され、`cacheRead` にマッピングされます。
- Responses API のペイロードでは `input_tokens_details.cache_write_tokens` が公開される場合もあり、`cacheWrite` にマッピングされ、モデルのキャッシュ書き込みレートで料金が計算されます。このフィールドが省略された Responses ペイロードでは、`cacheWrite` は `0` のままです。OpenAI の Chat Completions API は `cache_write_tokens` カウンターを文書化も出力もしていませんが、OpenClaw は別個の書き込み数を報告する OpenRouter 互換および DeepSeek 形式のプロキシに対応するため、そこでも `prompt_tokens_details.cache_write_tokens` を読み取ります。
- 実際には、OpenAI は Anthropic の移動する全履歴の再利用よりも、初期プレフィックスキャッシュに近い動作をします。以下の [OpenAI のライブ動作の想定](#openai-live-expectations)を参照してください。

### Amazon Bedrock

- Anthropic Claude のモデル参照（`amazon-bedrock/*anthropic.claude*`、および AWS システム推論プロファイルのプレフィックス `us.`/`eu.`/`global.anthropic.claude*`）は、明示的な `cacheRetention` の引き渡しをサポートします。
- Anthropic 以外の Bedrock モデル（例: `amazon.nova-*`）は、設定された `cacheRetention` 値にかかわらず、実行時にはキャッシュ保持なしとして解決されます。
- 不透明な Bedrock アプリケーション推論プロファイル ARN（`claude` を含まないプロファイル ID）も、ARN だけではモデルファミリーを推測できないため、`cacheRetention` が明示的に設定されていない限り、キャッシュ保持なしとして解決されます。

### OpenRouter

`openrouter/anthropic/*` モデル参照の場合、OpenClaw はシステム/開発者プロンプトブロックに Anthropic の `cache_control` マーカーを挿入します。ただし、リクエストの送信先が検証済みの OpenRouter ルート（デフォルトエンドポイント上の `openrouter`、または `openrouter.ai` に解決される任意のプロバイダー/ベース URL）のままである場合に限ります。モデルの送信先を任意の OpenAI 互換プロキシ URL に変更すると、この挿入は停止します。

`contextPruning.mode: "cache-ttl"` は、`openrouter/anthropic/*`、`openrouter/deepseek/*`、`openrouter/moonshot/*`、`openrouter/moonshotai/*`、`openrouter/zai/*` のモデル参照で使用できます。これらのルートは、OpenClaw がマーカーを挿入しなくても、プロバイダー側でプロンプトキャッシュを処理するためです。

ソース: `extensions/openrouter/index.ts`（`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`）。

OpenRouter での DeepSeek キャッシュの構築はベストエフォートで、数秒かかることがあります。直後のフォローアップリクエストでは、依然として `cached_tokens: 0` と表示される場合があります。少し待ってから同じプレフィックスのリクエストを繰り返し、`usage.prompt_tokens_details.cached_tokens` をキャッシュヒットのシグナルとして使用して検証してください。

### Google Gemini（直接 API）

- Gemini の直接トランスポート（`api: "google-generative-ai"`）は、上流の `cachedContentTokenCount` を通じてキャッシュヒットを報告し、`cacheRead` にマッピングされます。
- 対象モデルファミリー: `gemini-2.5*` および `gemini-3*`（このプレフィックス一致に含まれない Live/プレビューのバリアント、たとえば `gemini-live-2.5-flash-preview` は除外）。
- 対象モデルに `cacheRetention` が設定されている場合、OpenClaw はシステムプロンプト用の `cachedContents` リソースを自動的に作成、再利用、更新します。キャッシュ済みコンテンツのハンドルを手動で指定する必要はありません。TTL は `cacheRetention: "short"` の場合は `300s`、`"long"` の場合は `3600s` です。
- 既存の Gemini キャッシュ済みコンテンツのハンドルを `params.cachedContent`（または旧形式の `params.cached_content`）として渡すこともできます。明示的なハンドルを指定すると、自動キャッシュ管理パスは完全にスキップされます。
- これは Anthropic/OpenAI のプロンプトプレフィックスキャッシュとは異なります。OpenClaw はインラインキャッシュマーカーを挿入する代わりに、Gemini 用のプロバイダーネイティブな `cachedContents` リソースを管理します。

ソース: `src/agents/embedded-agent-runner/google-prompt-cache.ts`。

### CLI ハーネスプロバイダー（Claude Code、Gemini CLI）

JSONL 使用量イベント（`jsonlDialect: "claude-stream-json"` または `"gemini-stream-json"`）を出力する CLI バックエンドは、共有の使用量パーサーを通ります。このパーサーは、`cacheRead` にマッピングされる単純な `cached` カウンターを含む、複数のフィールド名のバリアントを認識します。CLI の JSON ペイロードで直接の入力トークンフィールドが省略されている場合、OpenClaw はそれを `input_tokens - cached` として算出します。これは使用量の正規化のみを行うものであり、これらの CLI 駆動モデル向けに Anthropic/OpenAI 形式のプロンプトキャッシュマーカーを作成するものではありません。

ソース: `src/agents/cli-output.ts`（`toCliUsage`）。

### その他のプロバイダー

プロバイダーが上記のいずれのキャッシュモードもサポートしていない場合、`cacheRetention` は効果を持ちません。

## システムプロンプトのキャッシュ境界

OpenClaw は、内部のキャッシュプレフィックス境界で、システムプロンプトを **安定したプレフィックス** と **変動するサフィックス** に分割します。境界より前のコンテンツ（ツール定義、Skills のメタデータ、ワークスペースファイル）は、ターン間でバイト単位に同一となるように順序付けられます。境界より後のコンテンツ（例: `HEARTBEAT.md`、実行時タイムスタンプ、その他のターン単位のメタデータ）は、キャッシュされたプレフィックスを無効化せずに変更できます。

主な設計上の選択:

- 安定したワークスペースのプロジェクトコンテキストファイルは `HEARTBEAT.md` より前に配置されるため、Heartbeat による変動で安定したプレフィックスが無効化されません。
- この境界は Anthropic 系、OpenAI 系、Google、CLI のトランスポート整形全体に適用されるため、サポートされるすべてのプロバイダーが同じプレフィックスの安定性から恩恵を受けます。
- Codex Responses と Anthropic Vertex のリクエストは、境界を考慮したキャッシュ整形を通じてルーティングされるため、キャッシュの再利用がプロバイダーに実際に送信される内容と一致します。
- システムプロンプトのフィンガープリントは正規化されます（空白、改行、フックによって追加されたコンテキスト、実行時機能の順序）。これにより、意味的に変更されていないプロンプトは、ターン間でキャッシュを共有できます。

設定またはワークスペースの変更後に予期しない `cacheWrite` の急増が見られる場合は、その変更がキャッシュ境界より前か後かを確認してください。変動するコンテンツを境界より後に移動する（または安定化する）ことで、通常は問題を解決できます。

## OpenClaw のキャッシュ安定性ガード

- バンドルされた MCP ツールカタログは、ツール登録前に決定論的にソートされます（まずサーバー名、次にツール名）。そのため、`listTools()` の順序が変わってもツールブロックが変動せず、プロンプトキャッシュのプレフィックスが無効化されません。
- 永続化された画像ブロックを含む旧セッションでは、**直近 3 回の完了済みターン** がそのまま保持されます（画像を含むターンだけでなく、すべての完了済みターンを数えます）。それより古い処理済み画像ブロックはテキストマーカーに置き換えられるため、画像を多用するフォローアップで大きな古いペイロードが繰り返し再送信されることを防ぎます。

## 調整パターン

### 混合トラフィック（推奨デフォルト）

メインエージェントには長期的な基準設定を維持し、バースト的な通知エージェントではキャッシュを無効にします。

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

### コスト優先の基準設定

- 基準となる `cacheRetention: "short"` を設定します。
- `contextPruning.mode: "cache-ttl"` を有効にします。
- ウォームキャッシュの恩恵を受けるエージェントに限り、Heartbeat の間隔を TTL より短く保ちます。

## ライブ回帰テスト

OpenClaw は、繰り返されるプレフィックス、ツールターン、画像ターン、MCP 形式のツールトランスクリプト、Anthropic のキャッシュなし制御を対象とする、統合ライブキャッシュ回帰ゲートを実行します。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

次のコマンドで実行します。

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

ベースラインファイルには、直近で観測されたライブ数値と、テストが確認するプロバイダー固有の回帰下限値が保存されます。各実行では、実行ごとに新しいセッション ID とプロンプト名前空間を使用するため、以前のキャッシュ状態が現在のサンプルを汚染しません。Anthropic と OpenAI では判定方法が異なります。Anthropic で下限値を下回ると重大な回帰としてテストが失敗しますが、OpenAI で下限値を下回った場合は監視のみ（警告として記録され、実行は失敗しません）です。プロバイダー間で単一の共通しきい値を共有することはありません。

### Anthropic のライブ動作の想定

- `cacheWrite` による明示的なウォームアップ書き込みが行われることを想定してください。
- Anthropic のキャッシュ制御では会話の進行に伴ってキャッシュのブレークポイントが移動するため、ターンを繰り返すと履歴のほぼ全体が再利用されることを想定してください。
- 安定、ツール、画像、MCP 形式の各レーンに設定されたベースライン下限値は、厳格なリグレッションゲートです。

### OpenAI のライブ環境での想定

- `cacheRead` のみを想定してください。Chat Completions では `cacheWrite` は `0` のままです。
- ターンを繰り返した際のキャッシュ再利用は、Anthropic のように移動しながら履歴全体を再利用する動作ではなく、プロバイダー固有の上限到達として扱ってください。
- 下限値は監視専用です（未達はテスト失敗ではなく警告として記録されます）。`gpt-5.4-mini` で観測されたライブ動作に基づいています。

| シナリオ             | `cacheRead` 下限値 | ヒット率下限値 |
| -------------------- | -----------------: | -------------: |
| 安定したプレフィックス |              4,608 |           0.90 |
| ツールトランスクリプト |              4,096 |           0.85 |
| 画像トランスクリプト   |              3,840 |           0.82 |
| MCP 形式のトランスクリプト |          4,096 |           0.85 |

直近で観測されたベースライン値（`live-cache-regression-baseline.ts` より）は、安定したプレフィックスが `cacheRead=4864`、ヒット率 `0.966`、ツールトランスクリプトが `cacheRead=4608`、ヒット率 `0.896`、画像トランスクリプトが `cacheRead=4864`、ヒット率 `0.954`、MCP 形式のトランスクリプトが `cacheRead=4608`、ヒット率 `0.891` でした。

アサーションが異なる理由：Anthropic は明示的なキャッシュのブレークポイントと、移動しながら会話履歴を再利用する仕組みを公開しています。一方、OpenAI のライブトラフィックで実際に再利用可能なプレフィックスは、プロンプト全体より前の段階で上限に達する場合があります。2 つのプロバイダーを単一のプロバイダー横断パーセンテージしきい値で比較すると、誤ったリグレッション判定が発生します。

## `diagnostics.cacheTrace` の設定

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # 任意
    includeMessages: false # デフォルトは true
    includePrompt: false # デフォルトは true
    includeSystem: false # デフォルトは true
```

デフォルト値：

| キー              | デフォルト値                                 |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### 環境変数による切り替え（一時的なデバッグ）

| 変数                                 | 効果                                   |
| ------------------------------------ | -------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | キャッシュトレースを有効にする         |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | 出力パスを上書きする                   |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | メッセージペイロード全体の取得を切り替える |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | プロンプトテキストの取得を切り替える   |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | システムプロンプトの取得を切り替える   |

### 確認する項目

- キャッシュトレースイベントは JSONL 形式で、`session:loaded`、`prompt:before`、`stream:context`、`session:after` などの段階別スナップショットを含みます。
- ターンごとのキャッシュトークンへの影響は通常の使用量表示で確認できます。`cacheRead` と `cacheWrite` は、`/usage tokens`、`/status`、セッション使用量の概要、カスタムの `messages.usageTemplate` レイアウトに表示されます。
- Anthropic では、キャッシュが有効な場合に `cacheRead` と `cacheWrite` の両方が記録されることを想定してください。
- OpenAI では、キャッシュヒット時に `cacheRead` が記録されることを想定してください。`cacheWrite` は、それを含む Responses API ペイロードでのみ設定されます（上記の [OpenAI](#openai-direct-api) を参照）。
- OpenAI は、`x-request-id`、`openai-processing-ms`、`x-ratelimit-*` などのトレース用ヘッダーやレート制限ヘッダーも返します。これらはリクエストの追跡に使用できますが、キャッシュヒットの集計にはヘッダーではなく使用量ペイロードを使用してください。

## クイックトラブルシューティング

- **ほとんどのターンで `cacheWrite` が高い**：変動するシステムプロンプト入力がないか確認し、モデルまたはプロバイダーがキャッシュ設定をサポートしていることを検証してください。
- **Anthropic で `cacheWrite` が高い**：キャッシュのブレークポイントが、リクエストごとに変化するコンテンツ上に設定されていることがよくあります。
- **OpenAI の `cacheRead` が低い**：安定したプレフィックスが先頭にあり、繰り返されるプレフィックスが少なくとも 1024 トークンあり、キャッシュを共有すべきターンで同じ `prompt_cache_key` が再利用されていることを確認してください。
- **`cacheRetention` の効果がない**：モデルキーが `agents.defaults.models["provider/model"]` と一致していることを確認してください。
- **キャッシュ設定を含む Bedrock Nova リクエスト**：想定どおりです。実行時にはキャッシュ保持なしとして解決されます。

関連ドキュメント：

- [Anthropic](/ja-JP/providers/anthropic)
- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [セッションのプルーニング](/ja-JP/concepts/session-pruning)
- [Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference)

## 関連項目

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [API の使用量とコスト](/ja-JP/reference/api-usage-costs)
