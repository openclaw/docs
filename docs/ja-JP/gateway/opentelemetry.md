---
read_when:
    - OpenClaw のモデル使用状況、メッセージフロー、またはセッションメトリクスを OpenTelemetry コレクターに送信したい場合
    - トレース、メトリクス、またはログを Grafana、Datadog、Honeycomb、New Relic、Tempo、または別の OTLP バックエンドに接続している場合
    - ダッシュボードやアラートを構築するには、正確なメトリック名、span 名、または属性の構造が必要です
summary: diagnostics-otel plugin (OTLP/HTTP) 経由で OpenClaw 診断情報を任意の OpenTelemetry コレクターにエクスポートする
title: OpenTelemetry エクスポート
x-i18n:
    generated_at: "2026-05-02T04:55:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: be58bb48f06e72b5b08d21bf37c0dcc218be8e4c0030b074523794be01f2611a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw は、同梱の `diagnostics-otel` Plugin を使用して
**OTLP/HTTP (protobuf)** で診断情報をエクスポートします。OTLP/HTTP
を受け入れる任意のコレクターまたはバックエンドは、コード変更なしで動作します。ローカルファイルログとその読み方については、
[ログ](/ja-JP/logging)を参照してください。

## 全体の仕組み

- **診断イベント** は、モデル実行、メッセージフロー、セッション、キュー、
  exec のために Gateway と同梱 Plugin が発行する、構造化されたプロセス内レコードです。
- **`diagnostics-otel` Plugin** はそれらのイベントを購読し、OTLP/HTTP 経由で
  OpenTelemetry の **メトリクス**、**トレース**、**ログ** としてエクスポートします。
- **プロバイダー呼び出し** は、プロバイダートランスポートがカスタム
  ヘッダーを受け入れる場合、OpenClaw の信頼済みモデル呼び出し span コンテキストから W3C `traceparent` ヘッダーを受け取ります。Plugin が発行したトレースコンテキストは伝播されません。
- エクスポーターは診断サーフェスと Plugin の両方が有効な場合にのみアタッチされるため、
  プロセス内コストはデフォルトでほぼゼロのままです。

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
| **メトリクス** | トークン使用量、コスト、実行時間、メッセージフロー、キューレーン、セッション状態、exec、メモリ負荷のカウンターとヒストグラム。          |
| **トレース**  | モデル使用、モデル呼び出し、ハーネスライフサイクル、ツール実行、exec、Webhook/メッセージ処理、コンテキスト構築、ツールループの span。 |
| **ログ**    | `diagnostics.otel.logs` が有効な場合に OTLP 経由でエクスポートされる、構造化された `logging.file` レコード。                                              |

`traces`、`metrics`、`logs` は個別に切り替えられます。`diagnostics.otel.enabled` が true の場合、
3 つすべてがデフォルトでオンになります。

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 対応する `diagnostics.otel.*Endpoint` 設定キーが未設定の場合に使用される、シグナル固有のエンドポイント上書きです。シグナル固有の設定はシグナル固有の環境変数より優先され、それは共有エンドポイントより優先されます。                                     |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` を上書きします。                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | ワイヤープロトコルを上書きします（現在は `http/protobuf` のみが尊重されます）。                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | レガシーの `gen_ai.system` ではなく、最新の実験的 GenAI span 属性（`gen_ai.provider.name`）を発行するには `gen_ai_latest_experimental` に設定します。GenAI メトリクスは常に、有界で低カーディナリティのセマンティック属性を使用します。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 別の preload またはホストプロセスがすでにグローバル OpenTelemetry SDK を登録している場合は `1` に設定します。その場合 Plugin は自身の NodeSDK ライフサイクルをスキップしますが、診断リスナーの配線と `traces`/`metrics`/`logs` の尊重は継続します。                |

## プライバシーとコンテンツキャプチャ

生のモデル/ツールコンテンツはデフォルトではエクスポートされません。span は有界の
識別子（チャンネル、プロバイダー、モデル、エラーカテゴリー、ハッシュのみのリクエスト ID）
を保持し、プロンプトテキスト、レスポンステキスト、ツール入力、ツール出力、
セッションキーを含むことはありません。

送信されるモデルリクエストには W3C `traceparent` ヘッダーが含まれる場合があります。そのヘッダーは、
アクティブなモデル呼び出し用の OpenClaw 所有の診断トレースコンテキストからのみ生成されます。
既存の呼び出し元指定 `traceparent` ヘッダーは置き換えられるため、Plugin や
カスタムプロバイダーオプションがサービス横断トレースの祖先関係を偽装することはできません。

プロンプト、レスポンス、ツール、またはシステムプロンプトのテキストについて、コレクターと
保持ポリシーが承認されている場合にのみ、`diagnostics.otel.captureContent.*` を `true` に設定してください。
各サブキーは個別にオプトインします。

- `inputMessages` — ユーザープロンプトの内容。
- `outputMessages` — モデルレスポンスの内容。
- `toolInputs` — ツール引数のペイロード。
- `toolOutputs` — ツール結果のペイロード。
- `systemPrompt` — 構築されたシステム/開発者プロンプト。

いずれかのサブキーが有効な場合、モデルとツールの span には、そのクラスに対してのみ
有界で編集済みの `openclaw.content.*` 属性が付与されます。

## サンプリングとフラッシュ

- **トレース:** `diagnostics.otel.sampleRate`（root span のみ、`0.0` はすべて破棄、
  `1.0` はすべて保持）。
- **メトリクス:** `diagnostics.otel.flushIntervalMs`（最小 `1000`）。
- **ログ:** OTLP ログは `logging.level`（ファイルログレベル）を尊重します。コンソール整形ではなく、
  診断ログレコードの編集経路を使用します。高ボリュームのインストールでは、
  ローカルサンプリングよりも OTLP コレクターのサンプリング/フィルタリングを優先してください。
- **ファイルログ相関:** JSONL ファイルログは、ログ呼び出しが有効な診断トレースコンテキストを保持している場合、
  トップレベルの `traceId`、`spanId`、`parentSpanId`、`traceFlags` を含みます。これにより、ログプロセッサーはローカルログ行を
  エクスポートされた span と結合できます。
- **リクエスト相関:** Gateway HTTP リクエストと WebSocket フレームは、内部リクエストトレーススコープを作成します。
  そのスコープ内のログと診断イベントはデフォルトでリクエストトレースを継承し、エージェント実行とモデル呼び出しの span は
  子として作成されるため、プロバイダー `traceparent` ヘッダーは同じトレース上に保たれます。

## エクスポートされるメトリクス

### モデル使用量

- `openclaw.tokens`（カウンター、属性: `openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（カウンター、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（ヒストグラム、属性: `openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（ヒストグラム、GenAI セマンティック規約メトリクス、属性: `gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（ヒストグラム、秒、GenAI セマンティック規約メトリクス、属性: `gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`、任意の `error.type`）
- `openclaw.model_call.duration_ms`（ヒストグラム、属性: `openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`、分類済みエラーではさらに `openclaw.errorCategory` と `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（ヒストグラム、最終モデルリクエストペイロードの UTF-8 バイトサイズ。生ペイロードの内容は含まれません）
- `openclaw.model_call.response_bytes`（ヒストグラム、ストリーミングされたモデルレスポンスイベントの UTF-8 バイトサイズ。生レスポンスの内容は含まれません）
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
- `openclaw.session.stuck`（カウンター、属性: `openclaw.state`。アクティブな作業がない古いセッションのブックキーピングに対してのみ発行）
- `openclaw.session.stuck_age_ms`（ヒストグラム、属性: `openclaw.state`。アクティブな作業がない古いセッションのブックキーピングに対してのみ発行）
- `openclaw.run.attempt`（カウンター、属性: `openclaw.attempt`）

### セッション生存性テレメトリ

`diagnostics.stuckSessionWarnMs` は、セッション生存性診断の進捗なし経過時間しきい値です。
`processing` セッションは、OpenClaw が返信、ツール、ステータス、ブロック、または ACP ランタイム進捗を観測している間は、
このしきい値に向かって経過時間を増やしません。
Typing keepalive は進捗としてカウントされないため、無応答のモデルやハーネスは
引き続き検出できます。

OpenClaw は、まだ観測できる作業によってセッションを分類します:

- `session.long_running`: アクティブな埋め込み作業、モデル呼び出し、またはツール呼び出しが
  まだ進行中です。
- `session.stalled`: アクティブな作業は存在しますが、アクティブな実行が最近の進捗を
  報告していません。
- `session.stuck`: アクティブな作業がない古いセッション管理情報です。これは、影響を受けた
  セッションレーンを解放する唯一の liveness 分類です。

`session.stuck` のみが `openclaw.session.stuck` カウンター、
`openclaw.session.stuck_age_ms` ヒストグラム、`openclaw.session.stuck`
span を発行します。セッションが変化しない間、繰り返しの `session.stuck` 診断はバックオフするため、
ダッシュボードでは各 Heartbeat tick ではなく、継続的な増加に対してアラートする必要があります。
設定ノブとデフォルトについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) を参照してください。

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

## エクスポートされる span

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - デフォルトでは `gen_ai.system`、最新の GenAI セマンティック規約を有効にしている場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - デフォルトでは `gen_ai.system`、最新の GenAI セマンティック規約を有効にしている場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - エラー時は `openclaw.errorCategory` と任意の `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (上流プロバイダーのリクエスト ID の SHA ベースの有界ハッシュ。生の ID はエクスポートされません)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (プロンプト、履歴、応答、セッションキーの内容は含まれません)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ループメッセージ、パラメーター、ツール出力は含まれません)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

コンテンツキャプチャを明示的に有効にした場合、モデルとツールの span には、
選択した特定のコンテンツクラスについて、有界で編集済みの `openclaw.content.*`
属性も含めることができます。

## 診断イベントカタログ

以下のイベントは、上記のメトリクスと span を支えます。Plugins は OTLP エクスポートなしで
これらを直接購読することもできます。

**モデル使用量**

- `model.usage` — トークン、コスト、期間、コンテキスト、プロバイダー/モデル/チャンネル、
  セッション ID。`usage` はコストとテレメトリのためのプロバイダー/ターン単位の会計です。
  `context.used` は現在のプロンプト/コンテキストのスナップショットであり、キャッシュ済み入力や
  ツールループ呼び出しが関係する場合、プロバイダーの `usage.total` より低くなることがあります。

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
  `pluginId`、プロバイダー/モデル/チャンネル、実行 ID を含みます。完了時には
  `durationMs`、`outcome`、任意の `resultClassification`、`yieldDetected`、
  `itemLifecycle` カウントが追加されます。エラー時には `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)、`errorCategory`、任意の
  `cleanupFailed` が追加されます。

**実行**

- `exec.process.completed` — ターミナルの結果、期間、ターゲット、モード、終了
  コード、失敗種別です。コマンドテキストと作業ディレクトリは
  含まれません。

## エクスポーターなしの場合

`diagnostics-otel` を実行しなくても、診断イベントを Plugins やカスタムシンクで利用可能にできます。

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

または、1 回限りの env 上書きとして:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

フラグ出力は標準のログファイル (`logging.file`) に送られ、引き続き
`logging.redactSensitive` によって編集されます。完全なガイド:
[診断フラグ](/ja-JP/diagnostics/flags)。

## 無効化

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

`plugins.allow` から `diagnostics-otel` を除外することも、
`openclaw plugins disable diagnostics-otel` を実行することもできます。

## 関連

- [ログ](/ja-JP/logging) — ファイルログ、コンソール出力、CLI tailing、Control UI の Logs タブ
- [Gateway ログ内部](/ja-JP/gateway/logging) — WS ログスタイル、サブシステム接頭辞、コンソールキャプチャ
- [診断フラグ](/ja-JP/diagnostics/flags) — 対象を絞ったデバッグログフラグ
- [診断エクスポート](/ja-JP/gateway/diagnostics) — オペレーター向けサポートバンドルツール (OTEL エクスポートとは別)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) — 完全な `diagnostics.*` フィールドリファレンス
