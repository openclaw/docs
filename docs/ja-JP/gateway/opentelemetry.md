---
read_when:
    - OpenClaw のモデル使用量、メッセージフロー、またはセッションメトリクスを OpenTelemetry コレクターに送信したい
    - Grafana、Datadog、Honeycomb、New Relic、Tempo、または別の OTLP バックエンドにトレース、メトリクス、またはログを接続している
    - ダッシュボードやアラートを構築するには、正確なメトリック名、スパン名、または属性の構造が必要です
summary: diagnostics-otel Plugin (OTLP/HTTP) を介して OpenClaw の診断情報を任意の OpenTelemetry コレクターにエクスポートする
title: OpenTelemetry エクスポート
x-i18n:
    generated_at: "2026-05-06T05:05:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d52e5072fcdb097a3dce36a13d9470cea8c169d2af49998cd727814013c411e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw は公式の `diagnostics-otel` Plugin を通じて、**OTLP/HTTP (protobuf)** で診断情報をエクスポートします。OTLP/HTTP を受け付ける任意のコレクターやバックエンドは、コード変更なしで動作します。ローカルファイルログとその読み方については、[ロギング](/ja-JP/logging)を参照してください。

## 仕組み

- **診断イベント**は、モデル実行、メッセージフロー、セッション、キュー、exec に対して Gateway とバンドル済み Plugin が発行する、構造化されたプロセス内レコードです。
- **`diagnostics-otel` Plugin** はそれらのイベントを購読し、OTLP/HTTP 経由で OpenTelemetry の **メトリクス**、**トレース**、**ログ**としてエクスポートします。
- **プロバイダー呼び出し**は、プロバイダー転送がカスタムヘッダーを受け付ける場合、OpenClaw の信頼済みモデル呼び出しスパンコンテキストから W3C `traceparent` ヘッダーを受け取ります。Plugin が発行したトレースコンテキストは伝播されません。
- エクスポーターは、診断サーフェスと Plugin の両方が有効な場合にのみアタッチされるため、デフォルトではプロセス内コストはほぼゼロのままです。

## クイックスタート

パッケージ版インストールでは、まず Plugin をインストールします。

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

| シグナル    | 含まれる内容                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **メトリクス** | トークン使用量、コスト、実行時間、メッセージフロー、キューレーン、セッション状態、exec、メモリ圧迫に関するカウンターとヒストグラム。      |
| **トレース**  | モデル使用量、モデル呼び出し、ハーネスライフサイクル、ツール実行、exec、webhook/メッセージ処理、コンテキスト構築、ツールループのスパン。 |
| **ログ**    | `diagnostics.otel.logs` が有効な場合に OTLP 経由でエクスポートされる、構造化された `logging.file` レコード。                               |

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

| 変数                                                                                                              | 目的                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` を上書きします。値にすでに `/v1/traces`、`/v1/metrics`、または `/v1/logs` が含まれている場合は、そのまま使用されます。                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 対応する `diagnostics.otel.*Endpoint` 設定キーが未設定の場合に使用される、シグナル固有のエンドポイント上書きです。シグナル固有の設定はシグナル固有の環境変数より優先され、シグナル固有の環境変数は共有エンドポイントより優先されます。 |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` を上書きします。                                                                                                                                                                                            |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | ワイヤープロトコルを上書きします（現在は `http/protobuf` のみが有効です）。                                                                                                                                                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | レガシーの `gen_ai.system` ではなく、最新の実験的な GenAI スパン属性（`gen_ai.provider.name`）を発行するには `gen_ai_latest_experimental` に設定します。GenAI メトリクスは常に、有界で低カーディナリティのセマンティック属性を使用します。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 別のプリロードまたはホストプロセスがすでにグローバル OpenTelemetry SDK を登録している場合は `1` に設定します。その場合 Plugin は自身の NodeSDK ライフサイクルをスキップしますが、診断リスナーは引き続き配線し、`traces`/`metrics`/`logs` を尊重します。 |

## プライバシーとコンテンツキャプチャ

生のモデル/ツールコンテンツはデフォルトではエクスポートされません。スパンには有界の識別子（チャンネル、プロバイダー、モデル、エラーカテゴリ、ハッシュのみのリクエスト ID）が含まれ、プロンプトテキスト、レスポンステキスト、ツール入力、ツール出力、セッションキーは含まれません。

送信されるモデルリクエストには W3C `traceparent` ヘッダーが含まれる場合があります。このヘッダーは、アクティブなモデル呼び出しに対する OpenClaw 所有の診断トレースコンテキストからのみ生成されます。既存の呼び出し元指定 `traceparent` ヘッダーは置き換えられるため、Plugin やカスタムプロバイダーオプションがサービス間トレースの祖先関係を偽装することはできません。

コレクターと保持ポリシーがプロンプト、レスポンス、ツール、またはシステムプロンプトのテキストに対して承認されている場合にのみ、`diagnostics.otel.captureContent.*` を `true` に設定してください。各サブキーは個別にオプトインします。

- `inputMessages` - ユーザープロンプトコンテンツ。
- `outputMessages` - モデルレスポンスコンテンツ。
- `toolInputs` - ツール引数ペイロード。
- `toolOutputs` - ツール結果ペイロード。
- `systemPrompt` - 構築されたシステム/開発者プロンプト。

いずれかのサブキーが有効な場合、モデルスパンとツールスパンには、そのクラスのみについて有界でリダクション済みの `openclaw.content.*` 属性が付与されます。

## サンプリングとフラッシュ

- **トレース:** `diagnostics.otel.sampleRate`（ルートスパンのみ、`0.0` はすべて破棄、`1.0` はすべて保持）。
- **メトリクス:** `diagnostics.otel.flushIntervalMs`（最小 `1000`）。
- **ログ:** OTLP ログは `logging.level`（ファイルログレベル）に従います。コンソール整形ではなく、診断ログレコードのリダクション経路を使用します。高ボリュームのインストールでは、ローカルサンプリングよりも OTLP コレクターでのサンプリング/フィルタリングを優先してください。
- **ファイルログ相関:** JSONL ファイルログは、ログ呼び出しが有効な診断トレースコンテキストを持つ場合、トップレベルの `traceId`、`spanId`、`parentSpanId`、`traceFlags` を含みます。これにより、ログプロセッサーはローカルログ行をエクスポート済みスパンと結合できます。
- **リクエスト相関:** Gateway HTTP リクエストと WebSocket フレームは、内部リクエストトレーススコープを作成します。そのスコープ内のログと診断イベントはデフォルトでリクエストトレースを継承し、エージェント実行スパンとモデル呼び出しスパンは子として作成されるため、プロバイダーの `traceparent` ヘッダーは同じトレース上に残ります。

## エクスポートされるメトリクス

### モデル使用量

- `openclaw.tokens`（カウンター、属性: `openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（カウンター、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（ヒストグラム、属性: `openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（ヒストグラム、GenAI セマンティック規約メトリクス、属性: `gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（ヒストグラム、秒、GenAI セマンティック規約メトリクス、属性: `gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`、任意の `error.type`）
- `openclaw.model_call.duration_ms`（ヒストグラム、属性: `openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`、分類済みエラーではさらに `openclaw.errorCategory` と `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（ヒストグラム、最終モデルリクエストペイロードの UTF-8 バイトサイズ。生ペイロードコンテンツは含まれません）
- `openclaw.model_call.response_bytes`（ヒストグラム、ストリーミングされたモデルレスポンスイベントの UTF-8 バイトサイズ。生レスポンスコンテンツは含まれません）
- `openclaw.model_call.time_to_first_byte_ms`（ヒストグラム、最初のストリーミングレスポンスイベントまでの経過時間）

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
- `openclaw.session.stuck`（カウンター、属性: `openclaw.state`。アクティブな作業がない古いセッションの記録管理に対してのみ発行）
- `openclaw.session.stuck_age_ms`（ヒストグラム、属性: `openclaw.state`。アクティブな作業がない古いセッションの記録管理に対してのみ発行）
- `openclaw.run.attempt`（カウンター、属性: `openclaw.attempt`）

### セッション生存性テレメトリ

`diagnostics.stuckSessionWarnMs` は、セッション生存性診断における進行なし経過時間のしきい値です。OpenClaw が返信、ツール、ステータス、ブロック、または ACP ランタイムの進行を観測している間、`processing` セッションはこのしきい値に向かって経過しません。タイピング keepalive は進行としてカウントされないため、無音のモデルやハーネスも引き続き検出できます。

OpenClaw は、引き続き観測できる作業に基づいてセッションを分類します。

- `session.long_running`: アクティブな埋め込み作業、モデル呼び出し、またはツール呼び出しが
  まだ進行中です。
- `session.stalled`: アクティブな作業は存在しますが、アクティブな実行が
  最近の進行状況を報告していません。停止した埋め込み実行は最初は observe-only のままになり、その後
  進行がないまま `diagnostics.stuckSessionAbortMs` を過ぎると abort-drain して、
  そのレーンの後ろにキューされたターンが再開できるようにします。未設定の場合、中止しきい値は
  少なくとも 10 分かつ `diagnostics.stuckSessionWarnMs` の 5 倍という、より安全な拡張ウィンドウが
  既定値になります。
- `session.stuck`: アクティブな作業がない古いセッション管理情報です。これにより
  影響を受けるセッションレーンが即座に解放されます。

リカバリは構造化された `session.recovery.requested` イベントと
`session.recovery.completed` イベントを出力します。診断セッション状態が idle とマークされるのは、
変更を伴うリカバリ結果（`aborted` または `released`）の後だけであり、かつ
同じ処理世代がまだ現在のものである場合だけです。

`session.stuck` だけが `openclaw.session.stuck` カウンター、
`openclaw.session.stuck_age_ms` ヒストグラム、および `openclaw.session.stuck`
span を出力します。繰り返される `session.stuck` 診断は、セッションが変更されない間は
バックオフするため、ダッシュボードでは heartbeat の各 tick ではなく、継続的な増加に対して
アラートする必要があります。設定ノブと既定値については、
[設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics)を参照してください。

### ハーネスのライフサイクル

- `openclaw.harness.duration_ms`（ヒストグラム、属性: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, エラー時は `openclaw.harness.phase`）

### 実行

- `openclaw.exec.duration_ms`（ヒストグラム、属性: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`）

### 診断内部（メモリとツールループ）

- `openclaw.memory.heap_used_bytes`（ヒストグラム、属性: `openclaw.memory.kind`）
- `openclaw.memory.rss_bytes`（ヒストグラム）
- `openclaw.memory.pressure`（カウンター、属性: `openclaw.memory.level`）
- `openclaw.tool.loop.iterations`（カウンター、属性: `openclaw.toolName`, `openclaw.outcome`）
- `openclaw.tool.loop.duration_ms`（ヒストグラム、属性: `openclaw.toolName`, `openclaw.outcome`）

## エクスポートされる span

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - 既定では `gen_ai.system`、または最新の GenAI セマンティック規約を選択している場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - 既定では `gen_ai.system`、または最新の GenAI セマンティック規約を選択している場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - エラー時は `openclaw.errorCategory` と任意の `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash`（上流プロバイダーのリクエスト ID に基づく境界付き SHA ベースのハッシュ。生の ID はエクスポートされません）
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory`（プロンプト、履歴、応答、またはセッションキーの内容は含まれません）
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory`（ループメッセージ、params、またはツール出力は含まれません）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

コンテンツキャプチャが明示的に有効になっている場合、モデルとツールの span には、
選択した特定のコンテンツクラスについて、境界付きで秘匿化された `openclaw.content.*`
属性も含めることができます。

## 診断イベントカタログ

以下のイベントは、上記のメトリクスと span の裏付けになります。Plugin は OTLP エクスポートなしで
これらを直接購読することもできます。

**モデル使用量**

- `model.usage` - トークン、コスト、期間、コンテキスト、プロバイダー/モデル/チャンネル、
  セッション ID。`usage` はコストとテレメトリ用のプロバイダー/ターン会計です。
  `context.used` は現在のプロンプト/コンテキストのスナップショットであり、
  キャッシュ済み入力やツールループ呼び出しが関係する場合は、プロバイダーの `usage.total` より
  小さくなることがあります。

**メッセージフロー**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**キューとセッション**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（集計カウンター: webhooks/queue/session）

**ハーネスのライフサイクル**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  エージェントハーネスの実行ごとのライフサイクル。`harnessId`、任意の
  `pluginId`、プロバイダー/モデル/チャンネル、および実行 ID を含みます。完了時には
  `durationMs`、`outcome`、任意の `resultClassification`、`yieldDetected`、
  および `itemLifecycle` カウントが追加されます。エラー時には `phase`
  （`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`、および
  任意の `cleanupFailed` が追加されます。

**実行**

- `exec.process.completed` - ターミナル結果、期間、ターゲット、モード、終了
  コード、および失敗の種類。コマンドテキストと作業ディレクトリは
  含まれません。

## エクスポーターなし

`diagnostics-otel` を実行しなくても、診断イベントを Plugin やカスタムシンクで利用可能なままにできます。

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` を上げずに対象を絞ったデバッグ出力を行うには、診断
フラグを使用します。フラグは大文字と小文字を区別せず、ワイルドカード（例: `telegram.*` または
`*`）をサポートします。

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

または、一度だけの env 上書きとして使用します。

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

フラグ出力は標準ログファイル（`logging.file`）に送られ、引き続き
`logging.redactSensitive` によって秘匿化されます。完全なガイド:
[診断フラグ](/ja-JP/diagnostics/flags)。

## 無効化

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

`plugins.allow` から `diagnostics-otel` を除外したままにすることも、
`openclaw plugins disable diagnostics-otel` を実行することもできます。

## 関連

- [ロギング](/ja-JP/logging) - ファイルログ、コンソール出力、CLI tail、および Control UI Logs タブ
- [Gateway ロギング内部](/ja-JP/gateway/logging) - WS ログスタイル、サブシステム接頭辞、およびコンソールキャプチャ
- [診断フラグ](/ja-JP/diagnostics/flags) - 対象を絞ったデバッグログフラグ
- [診断エクスポート](/ja-JP/gateway/diagnostics) - 運用者向けサポートバンドルツール（OTEL エクスポートとは別）
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) - `diagnostics.*` フィールドの完全なリファレンス
