---
read_when:
    - OpenClaw のモデル使用量、メッセージフロー、またはセッションメトリクスを OpenTelemetry コレクターに送信したい
    - トレース、メトリクス、またはログを Grafana、Datadog、Honeycomb、New Relic、Tempo、または別の OTLP バックエンドに接続している
    - ダッシュボードやアラートを構築するには、正確なメトリクス名、span 名、または属性の形状が必要です
summary: diagnostics-otel Plugin を介して OpenClaw の診断情報を OpenTelemetry コレクターまたは stdout JSONL にエクスポートする
title: OpenTelemetry エクスポート
x-i18n:
    generated_at: "2026-07-01T05:29:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw は公式の `diagnostics-otel` plugin を通じて **OTLP/HTTP (protobuf)** で診断をエクスポートします。ログは、コンテナやサンドボックスのログパイプライン向けに stdout JSONL として書き込むこともできます。OTLP/HTTP を受け付ける任意のコレクターやバックエンドは、コード変更なしで動作します。ローカルファイルログとその読み方については、[ロギング](/ja-JP/logging) を参照してください。

## 全体の仕組み

- **診断イベント**は、Gateway とバンドル済み plugins がモデル実行、メッセージフロー、セッション、キュー、exec について発行する、構造化されたプロセス内レコードです。
- **`diagnostics-otel` plugin** はこれらのイベントを購読し、OpenTelemetry の **メトリクス**、**トレース**、**ログ**として OTLP/HTTP 経由でエクスポートします。診断ログレコードを stdout JSONL にミラーすることもできます。
- **プロバイダー呼び出し**は、プロバイダートランスポートがカスタムヘッダーを受け付ける場合、OpenClaw の信頼済みモデル呼び出し span コンテキストから W3C `traceparent` ヘッダーを受け取ります。Plugin が発行したトレースコンテキストは伝播されません。
- エクスポーターは、診断サーフェスと plugin の両方が有効な場合にのみアタッチされるため、デフォルトではプロセス内コストはほぼゼロのままです。

## クイックスタート

パッケージ化されたインストールでは、まず plugin をインストールします。

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

CLI から plugin を有効化することもできます。

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` は現在 `http/protobuf` のみをサポートします。`grpc` は無視されます。
</Note>

## エクスポートされるシグナル

| シグナル | 含まれるもの |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **メトリクス** | トークン使用量、コスト、実行時間、フェイルオーバー、skill 使用量、メッセージフロー、Talk イベント、キューレーン、セッション状態/復旧、ツール実行、過大なペイロード、exec、メモリ圧迫に関するカウンターとヒストグラム。 |
| **トレース** | モデル使用量、モデル呼び出し、ハーネスライフサイクル、skill 使用量、ツール実行、exec、webhook/メッセージ処理、コンテキスト組み立て、ツールループの span。 |
| **ログ** | `diagnostics.otel.logs` が有効な場合に OTLP または stdout JSONL 経由でエクスポートされる構造化 `logging.file` レコード。コンテンツキャプチャが明示的に有効化されていない限り、ログ本文は差し控えられます。 |

`traces`、`metrics`、`logs` は個別に切り替えられます。`diagnostics.otel.enabled` が true の場合、トレースとメトリクスはデフォルトでオンです。ログはデフォルトでオフであり、`diagnostics.otel.logs` が明示的に `true` の場合にのみエクスポートされます。ログエクスポートのデフォルトは OTLP です。stdout に JSONL を出すには `diagnostics.otel.logsExporter` を `stdout` に設定し、各診断ログレコードを OTLP と stdout の両方に送るには `both` を設定します。

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
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### 環境変数

| 変数 | 目的 |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `diagnostics.otel.endpoint` を上書きします。値にすでに `/v1/traces`、`/v1/metrics`、または `/v1/logs` が含まれている場合は、そのまま使用されます。 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 対応する `diagnostics.otel.*Endpoint` 設定キーが未設定の場合に使用される、シグナル固有のエンドポイント上書きです。シグナル固有の設定はシグナル固有の環境変数より優先され、それは共有エンドポイントより優先されます。 |
| `OTEL_SERVICE_NAME` | `diagnostics.otel.serviceName` を上書きします。 |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | ワイヤープロトコルを上書きします（現在は `http/protobuf` のみが尊重されます）。 |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | `{gen_ai.operation.name} {gen_ai.request.model}` span 名、`CLIENT` span kind、レガシーの `gen_ai.system` の代わりの `gen_ai.provider.name` を含む、最新の実験的な GenAI 推論 span 形状を発行するには `gen_ai_latest_experimental` に設定します。GenAI メトリクスは常に、境界付けられた低カーディナリティのセマンティック属性を使用します。 |
| `OPENCLAW_OTEL_PRELOADED` | 別の preload またはホストプロセスがすでにグローバル OpenTelemetry SDK を登録している場合は `1` に設定します。その場合 plugin は自身の NodeSDK ライフサイクルをスキップしますが、診断リスナーの配線は行い、`traces`/`metrics`/`logs` を尊重します。 |

## プライバシーとコンテンツキャプチャ

生のモデル/ツールコンテンツはデフォルトではエクスポートされません。span は境界付けられた識別子（チャンネル、プロバイダー、モデル、エラーカテゴリ、ハッシュのみのリクエスト ID、ツールソース、ツール所有者、skill 名/ソース）を持ち、プロンプトテキスト、レスポンステキスト、ツール入力、ツール出力、skill ファイルパス、セッションキーは一切含みません。OTLP ログレコードはデフォルトで重大度、ロガー、コード位置、信頼済みトレースコンテキスト、サニタイズ済み属性を保持しますが、生のログメッセージ本文は `diagnostics.otel.captureContent` が boolean `true` に設定されている場合にのみエクスポートされます。細分化された `captureContent.*` サブキーではログ本文は有効になりません。スコープ付きエージェントセッションキーのように見えるラベルは `unknown` に置き換えられます。
Talk メトリクスは、mode、transport、provider、event type などの境界付けられたイベントメタデータのみをエクスポートします。transcripts、audio payloads、session ids、turn ids、call ids、room ids、handoff tokens は含みません。

送信モデルリクエストには W3C `traceparent` ヘッダーが含まれる場合があります。このヘッダーは、アクティブなモデル呼び出しのための OpenClaw 所有の診断トレースコンテキストからのみ生成されます。既存の呼び出し元指定 `traceparent` ヘッダーは置き換えられるため、plugins やカスタムプロバイダーオプションがサービス間トレースの祖先関係を偽装することはできません。

`diagnostics.otel.captureContent.*` を `true` に設定するのは、コレクターと保持ポリシーがプロンプト、レスポンス、ツール、またはシステムプロンプトのテキストについて承認されている場合のみにしてください。各サブキーは個別にオプトインです。

- `inputMessages` - ユーザープロンプトコンテンツ。
- `outputMessages` - モデルレスポンスコンテンツ。
- `toolInputs` - ツール引数ペイロード。
- `toolOutputs` - ツール結果ペイロード。
- `systemPrompt` - 組み立てられた system/developer プロンプト。
- `toolDefinitions` - モデルツールの名前、説明、スキーマ。

いずれかのサブキーが有効な場合、モデルとツールの span には、そのクラスに限り、境界付けられて編集された `openclaw.content.*` 属性が付与されます。boolean `captureContent: true` は、OTLP ログメッセージ本文もエクスポート承認済みである広範な診断キャプチャの場合にのみ使用してください。

`toolInputs`/`toolOutputs` コンテンツは、組み込みエージェントランタイムのツール実行（完了/エラー span の `openclaw.content.tool_input`、完了 span の `openclaw.content.tool_output`）でキャプチャされます。外部ハーネスのツール呼び出し（Codex、Claude CLI）は、コンテンツペイロードなしで `tool.execution.*` span を発行します。キャプチャされたコンテンツは信頼済みのリスナー専用チャンネルで伝送され、公開診断イベントバスには配置されません。

## サンプリングとフラッシュ

- **トレース:** `diagnostics.otel.sampleRate` (ルート span のみ、`0.0` はすべて破棄、
  `1.0` はすべて保持)。
- **メトリクス:** `diagnostics.otel.flushIntervalMs` (最小 `1000`)。
- **ログ:** OTLP ログは `logging.level` (ファイルログレベル) に従います。コンソール形式ではなく、
  診断ログレコードのリダクション経路を使用します。高ボリュームの
  インストールでは、ローカルサンプリングよりも OTLP コレクターのサンプリング/フィルタリングを優先してください。
  プラットフォームがすでに stdout/stderr をログプロセッサへ送っていて、OTLP ログ
  コレクターがない場合は、`diagnostics.otel.logsExporter: "stdout"` を設定します。
  stdout レコードは 1 行 1 JSON オブジェクトで、利用可能な場合は `ts`、`signal`、
  `service.name`、重大度、本文、リダクト済み属性、信頼済みトレースフィールドを含みます。
- **ファイルログ相関:** JSONL ファイルログは、ログ呼び出しが有効な
  診断トレースコンテキストを持つ場合、トップレベルの `traceId`、
  `spanId`、`parentSpanId`、`traceFlags` を含みます。これにより、ログプロセッサは
  ローカルログ行をエクスポート済み span と結合できます。
- **リクエスト相関:** Gateway HTTP リクエストと WebSocket フレームは、
  内部リクエストトレーススコープを作成します。そのスコープ内のログと診断イベントは
  デフォルトでリクエストトレースを継承し、エージェント実行とモデル呼び出し span は
  子として作成されるため、プロバイダーの `traceparent` ヘッダーは同じトレース上に残ります。
- **モデル呼び出し相関:** `openclaw.model.call` span はデフォルトで安全なプロンプト
  コンポーネントサイズを含み、プロバイダー結果が使用量を公開する場合は呼び出しごとのトークン属性を含みます。
  `openclaw.model.usage` は、集計コスト、コンテキスト、チャンネルダッシュボード向けの
  実行レベルの会計 span のままです。発行元ランタイムに信頼済みトレース
  コンテキストがある場合、同じ診断トレース上に残ります。

## エクスポートされるメトリクス

### モデル使用量

- `openclaw.tokens` (カウンター、属性: `openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`)
- `openclaw.cost.usd` (カウンター、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`)
- `openclaw.run.duration_ms` (ヒストグラム、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`)
- `openclaw.context.tokens` (ヒストグラム、属性: `openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`)
- `gen_ai.client.token.usage` (ヒストグラム、GenAI セマンティック規約メトリクス、属性: `gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`)
- `gen_ai.client.operation.duration` (ヒストグラム、秒、GenAI セマンティック規約メトリクス、属性: `gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`、任意の `error.type`)
- `openclaw.model_call.duration_ms` (ヒストグラム、属性: `openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`、加えて分類済みエラーでは `openclaw.errorCategory` と `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (ヒストグラム、最終モデルリクエストペイロードの UTF-8 バイトサイズ。生のペイロード内容は含まない)
- `openclaw.model_call.response_bytes` (ヒストグラム、ストリーミング応答チャンクペイロードの UTF-8 バイトサイズ。高頻度のテキスト、thinking、ツール呼び出しデルタは増分 `delta` バイトのみを数える。生の応答内容は含まない)
- `openclaw.model_call.time_to_first_byte_ms` (ヒストグラム、最初のストリーミング応答イベントまでの経過時間)
- `openclaw.model.failover` (カウンター、属性: `openclaw.provider`、`openclaw.model`、`openclaw.failover.to_provider`、`openclaw.failover.to_model`、`openclaw.failover.reason`、`openclaw.failover.suspended`、`openclaw.lane`)
- `openclaw.skill.used` (カウンター、属性: `openclaw.skill.name`、`openclaw.skill.source`、`openclaw.skill.activation`、任意の `openclaw.agent`、任意の `openclaw.toolName`)

### メッセージフロー

- `openclaw.webhook.received` (カウンター、属性: `openclaw.channel`、`openclaw.webhook`)
- `openclaw.webhook.error` (カウンター、属性: `openclaw.channel`、`openclaw.webhook`)
- `openclaw.webhook.duration_ms` (ヒストグラム、属性: `openclaw.channel`、`openclaw.webhook`)
- `openclaw.message.queued` (カウンター、属性: `openclaw.channel`、`openclaw.source`)
- `openclaw.message.received` (カウンター、属性: `openclaw.channel`、`openclaw.source`)
- `openclaw.message.dispatch.started` (カウンター、属性: `openclaw.channel`、`openclaw.source`)
- `openclaw.message.dispatch.completed` (カウンター、属性: `openclaw.channel`、`openclaw.outcome`、`openclaw.reason`、`openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (ヒストグラム、属性: `openclaw.channel`、`openclaw.outcome`、`openclaw.reason`、`openclaw.source`)
- `openclaw.message.processed` (カウンター、属性: `openclaw.channel`、`openclaw.outcome`)
- `openclaw.message.duration_ms` (ヒストグラム、属性: `openclaw.channel`、`openclaw.outcome`)
- `openclaw.message.delivery.started` (カウンター、属性: `openclaw.channel`、`openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (ヒストグラム、属性: `openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`)

### Talk

- `openclaw.talk.event` (カウンター、属性: `openclaw.talk.event_type`、`openclaw.talk.mode`、`openclaw.talk.transport`、`openclaw.talk.brain`、`openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (ヒストグラム、属性: `openclaw.talk.event` と同じ。Talk イベントが期間を報告するときに発行)
- `openclaw.talk.audio.bytes` (ヒストグラム、属性: `openclaw.talk.event` と同じ。バイト長を報告する Talk 音声フレームイベントで発行)

### キューとセッション

- `openclaw.queue.lane.enqueue` (カウンター、属性: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (カウンター、属性: `openclaw.lane`)
- `openclaw.queue.depth` (ヒストグラム、属性: `openclaw.lane` または `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (ヒストグラム、属性: `openclaw.lane`)
- `openclaw.session.state` (カウンター、属性: `openclaw.state`、`openclaw.reason`)
- `openclaw.session.stuck` (カウンター、属性: `openclaw.state`。復旧可能な古いセッション管理情報に対して発行)
- `openclaw.session.stuck_age_ms` (ヒストグラム、属性: `openclaw.state`。復旧可能な古いセッション管理情報に対して発行)
- `openclaw.session.turn.created` (カウンター、属性: `openclaw.agent`、`openclaw.channel`、`openclaw.trigger`)
- `openclaw.session.recovery.requested` (カウンター、属性: `openclaw.state`、`openclaw.action`、`openclaw.active_work_kind`、`openclaw.reason`)
- `openclaw.session.recovery.completed` (カウンター、属性: `openclaw.state`、`openclaw.action`、`openclaw.status`、`openclaw.active_work_kind`、`openclaw.reason`)
- `openclaw.session.recovery.age_ms` (ヒストグラム、属性: 対応する recovery カウンターと同じ)
- `openclaw.run.attempt` (カウンター、属性: `openclaw.attempt`)

### セッション生存性テレメトリ

`diagnostics.stuckSessionWarnMs` は、セッション生存性診断における進行なし経過時間のしきい値です。
`processing` セッションは、OpenClaw が返信、ツール、ステータス、ブロック、または ACP ランタイムの進行を観測している間、
このしきい値に向かって経過時間が増えません。
Typing keepalive は進行として数えられないため、無言のモデルやハーネスも
引き続き検出できます。

OpenClaw は、まだ観測できる作業に基づいてセッションを分類します。

- `session.long_running`: アクティブな埋め込み作業、モデル呼び出し、またはツール呼び出しが
  まだ進行しています。所有されているモデル呼び出しが
  `diagnostics.stuckSessionWarnMs` を超えて無言のままである場合も、
  `diagnostics.stuckSessionAbortMs` の前には long-running として報告されます。これにより、
  低速または非ストリーミングのモデルプロバイダーが、abort 観測可能なままである間に
  停滞した Gateway セッションのように見えないようにします。
- `session.stalled`: アクティブな作業は存在しますが、アクティブな実行が最近の進行を
  報告していません。所有されているモデル呼び出しは、`diagnostics.stuckSessionAbortMs` 以降に
  `session.long_running` から `session.stalled` へ切り替わります。所有者のない
  古いモデル/ツール活動は、無害な長時間実行作業として扱われません。
  停滞した埋め込み実行は最初は observe-only のままになり、その後
  `diagnostics.stuckSessionAbortMs` を超えて進行がない場合は abort-drain されるため、
  lane の後ろでキューに入ったターンを再開できます。未設定の場合、abort しきい値は
  少なくとも 5 分かつ `diagnostics.stuckSessionWarnMs` の 3 倍という、より安全な
  延長ウィンドウをデフォルトにします。
- `session.stuck`: アクティブな作業がない古いセッション管理情報、または
  所有者のない古いモデル/ツール活動を伴うアイドル状態のキュー済みセッションです。
  これは復旧ゲート通過後、影響を受けたセッション lane をただちに解放します。

復旧は、構造化された `session.recovery.requested` イベントと
`session.recovery.completed` イベントを発行します。診断セッション状態が idle とマークされるのは、
変更を伴う復旧結果 (`aborted` または `released`) の後で、かつ同じ
processing 世代がまだ現在である場合だけです。

`openclaw.session.stuck` カウンター、
`openclaw.session.stuck_age_ms` ヒストグラム、`openclaw.session.stuck`
span を発行するのは `session.stuck` だけです。繰り返しの `session.stuck`
診断は、セッションが変わらない間バックオフするため、ダッシュボードでは各
heartbeat tick ではなく、継続的な増加に対してアラートを出すべきです。
設定ノブとデフォルトについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) を参照してください。

生存性警告は次も発行します。

- `openclaw.liveness.warning` (カウンター、属性: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (ヒストグラム、属性: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (ヒストグラム、属性: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (ヒストグラム、属性: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (ヒストグラム、属性: `openclaw.liveness.reason`)

### ハーネスライフサイクル

- `openclaw.harness.duration_ms` (ヒストグラム、属性: `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、エラー時は `openclaw.harness.phase`)

### ツール実行

- `openclaw.tool.execution.duration_ms` (ヒストグラム、属性: `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、加えてエラー時は `openclaw.errorCategory`)
- `openclaw.tool.execution.blocked` (カウンター、属性: `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、`openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (ヒストグラム、属性: `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`)

### 診断内部 (メモリとツールループ)

- `openclaw.payload.large` (カウンター、属性: `openclaw.payload.surface`、`openclaw.payload.action`、`openclaw.channel`、`openclaw.plugin`、`openclaw.reason`)
- `openclaw.payload.large_bytes` (ヒストグラム、属性: `openclaw.payload.large` と同じ)
- `openclaw.memory.heap_used_bytes` (ヒストグラム、属性: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (ヒストグラム)
- `openclaw.memory.pressure` (カウンター、属性: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (カウンター、属性: `openclaw.toolName`、`openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (ヒストグラム、属性: `openclaw.toolName`、`openclaw.outcome`)

## エクスポートされる span

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - デフォルトでは `gen_ai.system`、または最新の GenAI semantic conventions にオプトインしている場合は `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - デフォルトでは `gen_ai.system`、または最新の GenAI semantic conventions にオプトインしている場合は `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - エラー時の `openclaw.errorCategory` と任意の `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`、`openclaw.model_call.prompt.input_messages_chars`、`openclaw.model_call.prompt.system_prompt_chars`、`openclaw.model_call.prompt.tool_definitions_count`、`openclaw.model_call.prompt.tool_definitions_chars`、`openclaw.model_call.prompt.total_chars` (安全なコンポーネントサイズのみ、プロンプトテキストは含まない)
  - モデル呼び出し結果にその個別呼び出しのプロバイダー使用量が含まれる場合の `openclaw.model_call.usage.*` と `gen_ai.usage.*`
  - `openclaw.provider.request_id_hash` (上流プロバイダーのリクエスト ID の範囲制限された SHA ベースのハッシュ。生の ID はエクスポートされない)
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` では、モデル呼び出しスパンは `openclaw.model.call` の代わりに、最新の GenAI 推論スパン名 `{gen_ai.operation.name} {gen_ai.request.model}` と `CLIENT` スパン種別を使用する。
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完了時: `openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - エラー時: `openclaw.harness.phase`、`openclaw.errorCategory`、任意の `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.errorCategory`、`openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`、`openclaw.exec.command_length`、`openclaw.exec.exit_code`、`openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`、`openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`、`openclaw.ageMs`、`openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory` (プロンプト、履歴、レスポンス、セッションキーの内容は含まない)
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.outcome`、`openclaw.iterations`、`openclaw.errorCategory` (ループメッセージ、パラメーター、ツール出力は含まない)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.rss_bytes`

コンテンツキャプチャが明示的に有効になっている場合、モデルスパンとツールスパンには、オプトインした特定のコンテンツクラスについて、範囲制限され秘匿化された `openclaw.content.*` 属性も含めることができる。

## 診断イベントカタログ

以下のイベントは、上記のメトリクスとスパンを支える。Plugin は OTLP エクスポートなしで、これらを直接サブスクライブすることもできる。

**モデル使用量**

- `model.usage` - トークン、コスト、所要時間、コンテキスト、プロバイダー/モデル/チャンネル、セッション ID。`usage` はコストとテレメトリーのためのプロバイダー/ターン単位の会計であり、`context.used` は現在のプロンプト/コンテキストのスナップショットで、キャッシュ済み入力やツールループ呼び出しが関与する場合はプロバイダーの `usage.total` より低くなることがある。

**メッセージフロー**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**キューとセッション**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (集約カウンター: Webhook/キュー/セッション)

**ハーネスライフサイクル**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  エージェントハーネスの実行ごとのライフサイクル。`harnessId`、任意の `pluginId`、プロバイダー/モデル/チャンネル、実行 ID を含む。完了時には `durationMs`、`outcome`、任意の `resultClassification`、`yieldDetected`、`itemLifecycle` カウントが追加される。エラー時には `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`)、`errorCategory`、任意の `cleanupFailed` が追加される。

**Exec**

- `exec.process.completed` - 終端結果、所要時間、ターゲット、モード、終了コード、失敗種別。コマンドテキストと作業ディレクトリは含まれない。
- `exec.approval.followup_suppressed` - セッションリバウンド後に古い承認フォローアップが破棄された。`approvalId`、`reason` (`session_rebound`)、`phase` (`direct_delivery` または `gateway_preflight`)、ディスパッチャーのタイムスタンプを含む。セッションキー、ルート、コマンドテキストは含まれない。

## エクスポーターなし

`diagnostics-otel` を実行せずに、診断イベントを Plugin やカスタムシンクで利用可能なままにできる。

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` を上げずに対象を絞ったデバッグ出力を行うには、診断フラグを使用する。フラグは大文字小文字を区別せず、ワイルドカードをサポートする (例: `telegram.*` または `*`)。

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

または、1 回限りの環境変数オーバーライドとして:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

フラグ出力は標準ログファイル (`logging.file`) に送られ、引き続き `logging.redactSensitive` によって秘匿化される。完全なガイド:
[診断フラグ](/ja-JP/diagnostics/flags)。

## 無効化

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

`plugins.allow` から `diagnostics-otel` を外すことも、`openclaw plugins disable diagnostics-otel` を実行することもできる。

## 関連

- [ログ記録](/ja-JP/logging) - ファイルログ、コンソール出力、CLI tailing、Control UI のログタブ
- [Gateway ログ記録の内部構造](/ja-JP/gateway/logging) - WS ログスタイル、サブシステムプレフィックス、コンソールキャプチャ
- [診断フラグ](/ja-JP/diagnostics/flags) - 対象を絞ったデバッグログフラグ
- [診断エクスポート](/ja-JP/gateway/diagnostics) - オペレーター向けサポートバンドルツール (OTEL エクスポートとは別)
- [構成リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) - 完全な `diagnostics.*` フィールドリファレンス
