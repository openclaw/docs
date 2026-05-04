---
read_when:
    - OpenClaw のモデル使用状況、メッセージフロー、またはセッションメトリクスを OpenTelemetry コレクターに送信したい場合
    - Grafana、Datadog、Honeycomb、New Relic、Tempo、または別の OTLP バックエンドにトレース、メトリクス、またはログを接続している
    - ダッシュボードやアラートを構築するには、正確なメトリック名、スパン名、または属性構造が必要です
summary: diagnostics-otel Plugin (OTLP/HTTP) 経由で、OpenClaw の診断情報を任意の OpenTelemetry コレクターにエクスポートする
title: OpenTelemetry エクスポート
x-i18n:
    generated_at: "2026-05-04T05:00:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b5be99b29fe5f13132b03cfeaf3ce978ee16f29e307aa76769bc414b5ca35f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw は公式の `diagnostics-otel` Plugin を通じて、**OTLP/HTTP (protobuf)** で診断情報をエクスポートします。OTLP/HTTP を受け付ける任意のコレクターまたはバックエンドは、コード変更なしで動作します。ローカルファイルログとその読み方については、[ログ](/ja-JP/logging)を参照してください。

## 全体の仕組み

- **診断イベント** は、モデル実行、メッセージフロー、セッション、キュー、exec のために Gateway と同梱 Plugin から発行される、構造化されたプロセス内レコードです。
- **`diagnostics-otel` Plugin** はそれらのイベントを購読し、OTLP/HTTP 経由で OpenTelemetry の **メトリクス**、**トレース**、**ログ** としてエクスポートします。
- **プロバイダー呼び出し** は、プロバイダーのトランスポートがカスタムヘッダーを受け付ける場合、OpenClaw の信頼済みモデル呼び出しスパンコンテキストから W3C `traceparent` ヘッダーを受け取ります。Plugin が発行したトレースコンテキストは伝播されません。
- エクスポーターは、診断サーフェスと Plugin の両方が有効な場合にのみ接続されるため、デフォルトではプロセス内コストはほぼゼロのままです。

## クイックスタート

パッケージ版のインストールでは、まず Plugin をインストールします。

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

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

CLI から Plugin を有効にすることもできます。

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` は現在 `http/protobuf` のみをサポートしています。`grpc` は無視されます。
</Note>

## エクスポートされるシグナル

| シグナル      | 含まれる内容                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **メトリクス** | トークン使用量、コスト、実行時間、メッセージフロー、キューレーン、セッション状態、exec、メモリ圧迫のカウンターとヒストグラム。          |
| **トレース**  | モデル使用量、モデル呼び出し、ハーネスのライフサイクル、ツール実行、exec、webhook/メッセージ処理、コンテキスト構築、ツールループのスパン。 |
| **ログ**    | `diagnostics.otel.logs` が有効な場合に OTLP 経由でエクスポートされる、構造化された `logging.file` レコード。                                              |

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

| 変数                                                                                                          | 目的                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` を上書きします。値にすでに `/v1/traces`、`/v1/metrics`、または `/v1/logs` が含まれている場合は、そのまま使用されます。                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 対応する `diagnostics.otel.*Endpoint` 設定キーが未設定の場合に使用される、シグナル固有のエンドポイント上書きです。シグナル固有の設定はシグナル固有の環境変数より優先され、シグナル固有の環境変数は共有エンドポイントより優先されます。                                     |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` を上書きします。                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | ワイヤープロトコルを上書きします（現在は `http/protobuf` のみが尊重されます）。                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 従来の `gen_ai.system` の代わりに、最新の実験的な GenAI スパン属性（`gen_ai.provider.name`）を発行するには `gen_ai_latest_experimental` に設定します。GenAI メトリクスは、いずれの場合も有界で低カーディナリティのセマンティック属性を使用します。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 別のプリロードまたはホストプロセスがすでにグローバル OpenTelemetry SDK を登録している場合は `1` に設定します。その場合、Plugin は独自の NodeSDK ライフサイクルをスキップしますが、診断リスナーの配線は行い、`traces`/`metrics`/`logs` を尊重します。                |

## プライバシーとコンテンツキャプチャ

生のモデル/ツールコンテンツは、デフォルトではエクスポートされません。スパンは有界の識別子（チャンネル、プロバイダー、モデル、エラーカテゴリ、ハッシュのみのリクエスト ID）を持ち、プロンプトテキスト、レスポンステキスト、ツール入力、ツール出力、セッションキーを含むことはありません。

送信されるモデルリクエストには W3C `traceparent` ヘッダーが含まれる場合があります。このヘッダーは、アクティブなモデル呼び出しに対する OpenClaw 所有の診断トレースコンテキストからのみ生成されます。既存の呼び出し元提供の `traceparent` ヘッダーは置き換えられるため、Plugin やカスタムプロバイダーオプションがサービス間トレースの祖先関係を偽装することはできません。

`diagnostics.otel.captureContent.*` は、コレクターと保持ポリシーがプロンプト、レスポンス、ツール、またはシステムプロンプトのテキストに対して承認されている場合にのみ `true` に設定してください。各サブキーは個別にオプトインします。

- `inputMessages` — ユーザープロンプトのコンテンツ。
- `outputMessages` — モデルレスポンスのコンテンツ。
- `toolInputs` — ツール引数のペイロード。
- `toolOutputs` — ツール結果のペイロード。
- `systemPrompt` — 組み立てられたシステム/開発者プロンプト。

いずれかのサブキーが有効な場合、モデルとツールのスパンには、そのクラスについてのみ有界で秘匿化された `openclaw.content.*` 属性が付与されます。

## サンプリングとフラッシュ

- **トレース:** `diagnostics.otel.sampleRate`（ルートスパンのみ、`0.0` はすべて破棄、`1.0` はすべて保持）。
- **メトリクス:** `diagnostics.otel.flushIntervalMs`（最小 `1000`）。
- **ログ:** OTLP ログは `logging.level`（ファイルログレベル）に従います。コンソール整形ではなく、診断ログレコードの秘匿化パスを使用します。高ボリュームのインストールでは、ローカルサンプリングよりも OTLP コレクターのサンプリング/フィルタリングを優先する必要があります。
- **ファイルログの相関:** JSONL ファイルログには、ログ呼び出しが有効な診断トレースコンテキストを持つ場合、トップレベルの `traceId`、`spanId`、`parentSpanId`、`traceFlags` が含まれます。これにより、ログプロセッサーはローカルログ行をエクスポートされたスパンと結合できます。
- **リクエスト相関:** Gateway HTTP リクエストと WebSocket フレームは、内部リクエストトレーススコープを作成します。そのスコープ内のログと診断イベントはデフォルトでリクエストトレースを継承し、エージェント実行スパンとモデル呼び出しスパンは子として作成されるため、プロバイダーの `traceparent` ヘッダーは同じトレース上に留まります。

## エクスポートされるメトリクス

### モデル使用量

- `openclaw.tokens`（カウンター、属性: `openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（カウンター、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（ヒストグラム、属性: `openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（ヒストグラム、GenAI セマンティック規約メトリクス、属性: `gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（ヒストグラム、秒、GenAI セマンティック規約メトリクス、属性: `gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`、任意の `error.type`）
- `openclaw.model_call.duration_ms`（ヒストグラム、属性: `openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`、さらに分類済みエラーでは `openclaw.errorCategory` と `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（ヒストグラム、最終モデルリクエストペイロードの UTF-8 バイトサイズ。生のペイロードコンテンツは含みません）
- `openclaw.model_call.response_bytes`（ヒストグラム、ストリーミングされたモデルレスポンスイベントの UTF-8 バイトサイズ。生のレスポンスコンテンツは含みません）
- `openclaw.model_call.time_to_first_byte_ms`（ヒストグラム、最初にストリーミングされたレスポンスイベントまでの経過時間）

### メッセージフロー

- `openclaw.webhook.received`（カウンター、属性: `openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（カウンター、属性: `openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（カウンター、属性: `openclaw.channel`、`openclaw.source`）
- `openclaw.message.processed`（カウンター、属性: `openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.delivery.started`（カウンター、属性: `openclaw.channel`、`openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`）

### キューとセッション

- `openclaw.queue.lane.enqueue`（カウンター、属性: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（カウンター、属性: `openclaw.lane`）
- `openclaw.queue.depth`（ヒストグラム、属性: `openclaw.lane` または `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（ヒストグラム、属性: `openclaw.lane`）
- `openclaw.session.state`（カウンター、属性: `openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（カウンター、属性: `openclaw.state`。アクティブな作業がない古いセッションの記録管理についてのみ発行）
- `openclaw.session.stuck_age_ms`（ヒストグラム、属性: `openclaw.state`。アクティブな作業がない古いセッションの記録管理についてのみ発行）
- `openclaw.run.attempt`（カウンター、属性: `openclaw.attempt`）

### セッション生存性テレメトリ

`diagnostics.stuckSessionWarnMs` は、セッション生存性診断における進行なし経過時間のしきい値です。`processing` セッションは、OpenClaw が返信、ツール、ステータス、ブロック、または ACP ランタイム進行を観測している間は、このしきい値に向かって経過時間が進みません。入力中のキープアライブは進行として数えられないため、無音のモデルやハーネスも検出できます。

OpenClaw は、まだ観測できる作業に基づいてセッションを分類します。

- `session.long_running`: アクティブな埋め込み作業、モデル呼び出し、またはツール呼び出しが
  まだ進行中です。
- `session.stalled`: アクティブな作業は存在しますが、アクティブな実行が最近の進捗を報告していません。停止した埋め込み実行は最初は observe-only のままになり、その後、進捗がない状態で少なくとも 10 分かつ `diagnostics.stuckSessionWarnMs` の 5 倍が経過した後に
  abort-drain され、レーンの後ろでキューに入っているターンを再開できるようになります。
- `session.stuck`: アクティブな作業がない古いセッション管理情報です。これにより、
  影響を受けたセッションレーンが即座に解放されます。

`session.stuck` だけが `openclaw.session.stuck` カウンター、
`openclaw.session.stuck_age_ms` ヒストグラム、および `openclaw.session.stuck`
スパンを発行します。セッションが変わらない間、繰り返し発生する `session.stuck` 診断はバックオフするため、ダッシュボードでは heartbeat の各 tick ではなく、継続的な増加に対してアラートを出すべきです。設定ノブとデフォルトについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics)を参照してください。

### ハーネスのライフサイクル

- `openclaw.harness.duration_ms` (ヒストグラム、属性: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, エラー時は `openclaw.harness.phase`)

### 実行

- `openclaw.exec.duration_ms` (ヒストグラム、属性: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### 診断の内部 (メモリとツールループ)

- `openclaw.memory.heap_used_bytes` (ヒストグラム、属性: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ヒストグラム)
- `openclaw.memory.pressure` (カウンター、属性: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (カウンター、属性: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (ヒストグラム、属性: `openclaw.toolName`, `openclaw.outcome`)

## エクスポートされるスパン

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - デフォルトでは `gen_ai.system`、または最新の GenAI セマンティック規約を有効化している場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - デフォルトでは `gen_ai.system`、または最新の GenAI セマンティック規約を有効化している場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - エラー時は `openclaw.errorCategory` と任意の `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (上流プロバイダーのリクエスト ID の SHA ベースの境界付きハッシュ。生の ID はエクスポートされません)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - 完了時: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - エラー時: `openclaw.harness.phase`, `openclaw.errorCategory`, 任意の `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (プロンプト、履歴、レスポンス、セッションキーの内容は含まれません)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ループメッセージ、パラメーター、ツール出力は含まれません)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

コンテンツキャプチャが明示的に有効化されている場合、モデルとツールのスパンには、オプトインした特定のコンテンツクラスについて、境界付きでリダクト済みの `openclaw.content.*` 属性も含めることができます。

## 診断イベントカタログ

以下のイベントは、上記のメトリクスとスパンを支えます。Plugin は OTLP エクスポートなしで、これらを直接購読することもできます。

**モデル使用状況**

- `model.usage` — トークン、コスト、時間、コンテキスト、プロバイダー/モデル/チャンネル、
  セッション ID。`usage` はコストとテレメトリ用のプロバイダー/ターン単位の会計情報です。
  `context.used` は現在のプロンプト/コンテキストのスナップショットであり、キャッシュ済み入力やツールループ呼び出しが関係する場合は、プロバイダーの `usage.total` より低くなることがあります。

**メッセージフロー**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**キューとセッション**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (集約カウンター: webhooks/queue/session)

**ハーネスのライフサイクル**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  エージェントハーネスの実行ごとのライフサイクルです。`harnessId`、任意の
  `pluginId`、プロバイダー/モデル/チャンネル、および実行 ID を含みます。完了時には
  `durationMs`、`outcome`、任意の `resultClassification`、`yieldDetected`,
  および `itemLifecycle` カウントが追加されます。エラー時には `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)、`errorCategory`、および
  任意の `cleanupFailed` が追加されます。

**実行**

- `exec.process.completed` — ターミナルの結果、時間、ターゲット、モード、終了
  コード、および失敗種別。コマンドテキストと作業ディレクトリは
  含まれません。

## エクスポーターなしの場合

`diagnostics-otel` を実行せずに、診断イベントを Plugin やカスタムシンクで利用できる状態に保てます。

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` を上げずに対象を絞ったデバッグ出力を行うには、診断
フラグを使用します。フラグは大文字と小文字を区別せず、ワイルドカードをサポートします (例: `telegram.*` または
`*`)。

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

または、1 回限りの環境変数オーバーライドとして指定します。

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

フラグ出力は標準ログファイル (`logging.file`) に送られ、引き続き
`logging.redactSensitive` によってリダクトされます。完全なガイド:
[診断フラグ](/ja-JP/diagnostics/flags)。

## 無効化

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

`plugins.allow` から `diagnostics-otel` を外したままにすることも、`openclaw plugins disable diagnostics-otel` を実行することもできます。

## 関連

- [ロギング](/ja-JP/logging) — ファイルログ、コンソール出力、CLI の追跡、および Control UI の Logs タブ
- [Gateway ロギングの内部](/ja-JP/gateway/logging) — WS ログスタイル、サブシステム接頭辞、およびコンソールキャプチャ
- [診断フラグ](/ja-JP/diagnostics/flags) — 対象を絞ったデバッグログフラグ
- [診断のエクスポート](/ja-JP/gateway/diagnostics) — 運用者向けサポートバンドルツール (OTEL エクスポートとは別)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) — `diagnostics.*` フィールドの完全なリファレンス
