---
read_when:
    - OpenClaw のモデル使用量、メッセージフロー、またはセッションメトリクスを OpenTelemetry コレクターに送信したい
    - Grafana、Datadog、Honeycomb、New Relic、Tempo、または別の OTLP バックエンドにトレース、メトリクス、ログを接続している場合
    - ダッシュボードやアラートを構築するために、正確なメトリック名、スパン名、または属性の形状が必要な場合
summary: diagnostics-otel Plugin (OTLP/HTTP) を介して OpenClaw の診断を任意の OpenTelemetry コレクターにエクスポートする
title: OpenTelemetry エクスポート
x-i18n:
    generated_at: "2026-04-30T05:15:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9d06589d281223ebb57e76f6f19441d30c138b9f7b0636198ab7bae5fad3c8a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw は、同梱の `diagnostics-otel` plugin を通じて **OTLP/HTTP (protobuf)** で診断情報をエクスポートします。OTLP/HTTP を受け付ける任意のコレクターまたはバックエンドは、コード変更なしで動作します。ローカルファイルログとその読み方については、[ログ](/ja-JP/logging)を参照してください。

## 全体の仕組み

- **診断イベント** は、モデル実行、メッセージフロー、セッション、キュー、exec について、Gateway と同梱 plugin が発行する構造化されたインプロセス記録です。
- **`diagnostics-otel` plugin** はそれらのイベントを購読し、OTLP/HTTP 経由で OpenTelemetry の **メトリクス**、**トレース**、**ログ** としてエクスポートします。
- **プロバイダー呼び出し** は、プロバイダーのトランスポートがカスタムヘッダーを受け付ける場合、OpenClaw の信頼済みモデル呼び出しスパンコンテキストから W3C `traceparent` ヘッダーを受け取ります。plugin が発行したトレースコンテキストは伝播されません。
- エクスポーターは、診断サーフェスと plugin の両方が有効な場合にのみ接続されるため、デフォルトではインプロセスのコストはほぼゼロに保たれます。

## クイックスタート

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

CLI から plugin を有効にすることもできます。

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` は現在 `http/protobuf` のみをサポートします。`grpc` は無視されます。
</Note>

## エクスポートされるシグナル

| シグナル    | 含まれる内容                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **メトリクス** | トークン使用量、コスト、実行時間、メッセージフロー、キューレーン、セッション状態、exec、メモリ負荷に関するカウンターとヒストグラム。          |
| **トレース**  | モデル使用量、モデル呼び出し、ハーネスライフサイクル、ツール実行、exec、webhook/メッセージ処理、コンテキスト組み立て、ツールループのスパン。 |
| **ログ**    | `diagnostics.otel.logs` が有効な場合に OTLP 経由でエクスポートされる、構造化された `logging.file` レコード。                                  |

`traces`、`metrics`、`logs` は個別に切り替えられます。`diagnostics.otel.enabled` が true の場合、3 つすべてがデフォルトでオンになります。

## 設定リファレンス

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### 環境変数

| 変数                                                                                                              | 目的                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` を上書きします。値にすでに `/v1/traces`、`/v1/metrics`、または `/v1/logs` が含まれている場合は、そのまま使用されます。                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 対応する `diagnostics.otel.*Endpoint` 設定キーが未設定の場合に使用される、シグナル固有のエンドポイント上書きです。シグナル固有の設定はシグナル固有の環境変数より優先され、それは共有エンドポイントより優先されます。                         |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` を上書きします。                                                                                                                                                                                               |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | ワイヤープロトコルを上書きします（現在は `http/protobuf` のみが尊重されます）。                                                                                                                                                              |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | レガシーの `gen_ai.system` の代わりに、最新の実験的な GenAI スパン属性（`gen_ai.provider.name`）を発行するには、`gen_ai_latest_experimental` に設定します。GenAI メトリクスは常に、境界付きで低カーディナリティのセマンティック属性を使用します。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 別のプリロードまたはホストプロセスがすでにグローバル OpenTelemetry SDK を登録している場合は `1` に設定します。その場合 plugin は自身の NodeSDK ライフサイクルをスキップしますが、診断リスナーの接続と `traces`/`metrics`/`logs` の尊重は継続します。 |

## プライバシーとコンテンツキャプチャ

生のモデル/ツールコンテンツはデフォルトではエクスポートされません。スパンは境界付きの識別子（チャンネル、プロバイダー、モデル、エラーカテゴリ、ハッシュのみのリクエスト ID）を保持し、プロンプトテキスト、レスポンステキスト、ツール入力、ツール出力、セッションキーを含めることはありません。

送信されるモデルリクエストには W3C `traceparent` ヘッダーが含まれる場合があります。このヘッダーは、アクティブなモデル呼び出しの OpenClaw 所有の診断トレースコンテキストからのみ生成されます。既存の呼び出し元指定の `traceparent` ヘッダーは置き換えられるため、plugin やカスタムプロバイダーオプションがクロスサービストレースの祖先関係を偽装することはできません。

プロンプト、レスポンス、ツール、またはシステムプロンプトのテキストについて、コレクターと保持ポリシーが承認されている場合にのみ、`diagnostics.otel.captureContent.*` を `true` に設定してください。各サブキーは個別にオプトインします。

- `inputMessages` — ユーザープロンプトのコンテンツ。
- `outputMessages` — モデルレスポンスのコンテンツ。
- `toolInputs` — ツール引数のペイロード。
- `toolOutputs` — ツール結果のペイロード。
- `systemPrompt` — 組み立て済みのシステム/開発者プロンプト。

いずれかのサブキーが有効な場合、モデルとツールのスパンには、そのクラスに限って、境界付きで編集済みの `openclaw.content.*` 属性が付与されます。

## サンプリングとフラッシュ

- **トレース:** `diagnostics.otel.sampleRate`（ルートスパンのみ、`0.0` はすべて破棄、`1.0` はすべて保持）。
- **メトリクス:** `diagnostics.otel.flushIntervalMs`（最小 `1000`）。
- **ログ:** OTLP ログは `logging.level`（ファイルログレベル）に従います。コンソール整形ではなく、診断ログレコードの編集パスを使用します。高ボリュームのインストールでは、ローカルサンプリングよりも OTLP コレクターのサンプリング/フィルタリングを優先してください。
- **ファイルログ相関:** JSONL ファイルログは、ログ呼び出しが有効な診断トレースコンテキストを保持している場合、トップレベルの `traceId`、`spanId`、`parentSpanId`、`traceFlags` を含みます。これにより、ログプロセッサーはローカルログ行をエクスポート済みスパンと結合できます。
- **リクエスト相関:** Gateway HTTP リクエストと WebSocket フレームは内部リクエストトレーススコープを作成します。そのスコープ内のログと診断イベントはデフォルトでリクエストトレースを継承し、エージェント実行とモデル呼び出しスパンは子として作成されるため、プロバイダーの `traceparent` ヘッダーは同じトレース上に維持されます。

## エクスポートされるメトリクス

### モデル使用量

- `openclaw.tokens`（カウンター、属性: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`）
- `openclaw.cost.usd`（カウンター、属性: `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `openclaw.run.duration_ms`（ヒストグラム、属性: `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `openclaw.context.tokens`（ヒストグラム、属性: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`）
- `gen_ai.client.token.usage`（ヒストグラム、GenAI セマンティック規約メトリクス、属性: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`）
- `gen_ai.client.operation.duration`（ヒストグラム、秒、GenAI セマンティック規約メトリクス、属性: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, 任意の `error.type`）
- `openclaw.model_call.duration_ms`（ヒストグラム、属性: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`、および分類済みエラーでは `openclaw.errorCategory` と `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（ヒストグラム、最終モデルリクエストペイロードの UTF-8 バイトサイズ。生ペイロードコンテンツは含まれません）
- `openclaw.model_call.response_bytes`（ヒストグラム、ストリーミングされたモデルレスポンスイベントの UTF-8 バイトサイズ。生レスポンスコンテンツは含まれません）
- `openclaw.model_call.time_to_first_byte_ms`（ヒストグラム、最初のストリーミングレスポンスイベントまでの経過時間）

### メッセージフロー

- `openclaw.webhook.received`（カウンター、属性: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.webhook.error`（カウンター、属性: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.webhook.duration_ms`（ヒストグラム、属性: `openclaw.channel`, `openclaw.webhook`）
- `openclaw.message.queued`（カウンター、属性: `openclaw.channel`, `openclaw.source`）
- `openclaw.message.processed`（カウンター、属性: `openclaw.channel`, `openclaw.outcome`）
- `openclaw.message.duration_ms`（ヒストグラム、属性: `openclaw.channel`, `openclaw.outcome`）
- `openclaw.message.delivery.started`（カウンター、属性: `openclaw.channel`, `openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（ヒストグラム、属性: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`）

### キューとセッション

- `openclaw.queue.lane.enqueue`（カウンター、属性: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（カウンター、属性: `openclaw.lane`）
- `openclaw.queue.depth`（ヒストグラム、属性: `openclaw.lane` または `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（ヒストグラム、属性: `openclaw.lane`）
- `openclaw.session.state`（カウンター、属性: `openclaw.state`, `openclaw.reason`）
- `openclaw.session.stuck`（カウンター、属性: `openclaw.state`）
- `openclaw.session.stuck_age_ms`（ヒストグラム、属性: `openclaw.state`）
- `openclaw.run.attempt`（カウンター、属性: `openclaw.attempt`）

### ハーネスライフサイクル

- `openclaw.harness.duration_ms`（ヒストグラム、属性: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`、エラー時は `openclaw.harness.phase`）

### Exec

- `openclaw.exec.duration_ms`（ヒストグラム、属性: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`）

### 診断内部（メモリとツールループ）

- `openclaw.memory.heap_used_bytes` (ヒストグラム, 属性: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ヒストグラム)
- `openclaw.memory.pressure` (カウンター, 属性: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (カウンター, 属性: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (ヒストグラム, 属性: `openclaw.toolName`, `openclaw.outcome`)

## エクスポートされるスパン

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - デフォルトでは `gen_ai.system`、または最新の GenAI セマンティック規約を有効にしている場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - デフォルトでは `gen_ai.system`、または最新の GenAI セマンティック規約を有効にしている場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - エラー時の `openclaw.errorCategory` と任意の `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (上流プロバイダーリクエスト ID の SHA ベースの境界付きハッシュ。生の ID はエクスポートされない)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - 完了時: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - エラー時: `openclaw.harness.phase`, `openclaw.errorCategory`, 任意の `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (プロンプト、履歴、応答、セッションキーの内容は含まない)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ループメッセージ、パラメーター、ツール出力は含まない)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

コンテンツキャプチャを明示的に有効にすると、モデルとツールのスパンには、オプトインした特定のコンテンツクラスについて、境界付きでリダクト済みの `openclaw.content.*` 属性も含められる。

## 診断イベントカタログ

以下のイベントは、上記のメトリクスとスパンを支える。Plugin は OTLP エクスポートなしで直接サブスクライブすることもできる。

**モデル使用状況**

- `model.usage` — トークン、コスト、所要時間、コンテキスト、プロバイダー/モデル/チャンネル、セッション ID。`usage` はコストとテレメトリ用のプロバイダー/ターン単位の会計であり、`context.used` は現在のプロンプト/コンテキストのスナップショットで、キャッシュ済み入力やツールループ呼び出しが関係する場合はプロバイダーの `usage.total` より低くなることがある。

**メッセージフロー**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**キューとセッション**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (集約カウンター: Webhook/キュー/セッション)

**ハーネスライフサイクル**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  エージェントハーネスの実行ごとのライフサイクル。`harnessId`、任意の
  `pluginId`、プロバイダー/モデル/チャンネル、実行 ID を含む。完了時には
  `durationMs`、`outcome`、任意の `resultClassification`、`yieldDetected`、
  および `itemLifecycle` カウントが追加される。エラー時には `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)、`errorCategory`、および
  任意の `cleanupFailed` が追加される。

**Exec**

- `exec.process.completed` — ターミナルの結果、所要時間、対象、モード、終了
  コード、および失敗種別。コマンドテキストと作業ディレクトリは
  含まれない。

## エクスポーターなしの場合

`diagnostics-otel` を実行せずに、診断イベントを Plugin やカスタムシンクで利用可能なままにできる。

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` を上げずに対象を絞ったデバッグ出力を行うには、診断フラグを使う。フラグは大文字と小文字を区別せず、ワイルドカードをサポートする (例: `telegram.*` または `*`)。

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

または一回限りの環境変数オーバーライドとして:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

フラグ出力は標準のログファイル (`logging.file`) に送られ、引き続き
`logging.redactSensitive` によってリダクトされる。完全なガイド:
[診断フラグ](/ja-JP/diagnostics/flags)。

## 無効化

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

`diagnostics-otel` を `plugins.allow` から外したままにすることも、
`openclaw plugins disable diagnostics-otel` を実行することもできる。

## 関連

- [ロギング](/ja-JP/logging) — ファイルログ、コンソール出力、CLI tailing、Control UI のログタブ
- [Gateway ロギング内部](/ja-JP/gateway/logging) — WS ログスタイル、サブシステムプレフィックス、コンソールキャプチャ
- [診断フラグ](/ja-JP/diagnostics/flags) — 対象を絞ったデバッグログフラグ
- [診断エクスポート](/ja-JP/gateway/diagnostics) — オペレーター向けサポートバンドルツール (OTEL エクスポートとは別)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) — `diagnostics.*` フィールドの完全なリファレンス
