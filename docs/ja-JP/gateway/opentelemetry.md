---
read_when:
    - OpenClaw のモデル使用量、メッセージフロー、またはセッションメトリクスを OpenTelemetry コレクターに送信したい
    - トレース、メトリクス、またはログを Grafana、Datadog、Honeycomb、New Relic、Tempo、または別の OTLP バックエンドに接続している
    - ダッシュボードやアラートを構築するには、正確なメトリック名、スパン名、または属性の形状が必要です
summary: diagnostics-otel Plugin を介して、OpenClaw の診断情報を OpenTelemetry コレクターまたは stdout JSONL にエクスポートする
title: OpenTelemetry エクスポート
x-i18n:
    generated_at: "2026-06-27T11:32:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw は、公式の `diagnostics-otel` Plugin を通じて **OTLP/HTTP (protobuf)** で診断情報をエクスポートします。ログは、コンテナおよびサンドボックスのログパイプライン向けに stdout JSONL として書き出すこともできます。OTLP/HTTP を受け付ける任意のコレクターまたはバックエンドは、コード変更なしで動作します。ローカルファイルログとその読み方については、[Logging](/ja-JP/logging) を参照してください。

## 全体の仕組み

- **診断イベント** は、モデル実行、メッセージフロー、セッション、キュー、exec のために Gateway とバンドル済み Plugin が発行する、構造化されたプロセス内レコードです。
- **`diagnostics-otel` Plugin** はそれらのイベントを購読し、OTLP/HTTP 経由で OpenTelemetry の **メトリクス**、**トレース**、**ログ** としてエクスポートします。診断ログレコードを stdout JSONL にミラーリングすることもできます。
- **プロバイダー呼び出し** は、プロバイダートランスポートがカスタムヘッダーを受け付ける場合、OpenClaw の信頼済みモデル呼び出し span コンテキストから W3C `traceparent` ヘッダーを受け取ります。Plugin が発行したトレースコンテキストは伝播されません。
- エクスポーターは、診断サーフェスと Plugin の両方が有効な場合にのみ接続されるため、プロセス内コストはデフォルトでほぼゼロのままです。

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

| シグナル | 含まれる内容 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **メトリクス** | トークン使用量、コスト、実行時間、フェイルオーバー、skill 使用状況、メッセージフロー、Talk イベント、キューレーン、セッション状態/リカバリー、ツール実行、過大ペイロード、exec、メモリ圧迫に関するカウンターとヒストグラム。 |
| **トレース** | モデル使用、モデル呼び出し、ハーネスライフサイクル、skill 使用状況、ツール実行、exec、webhook/メッセージ処理、コンテキスト組み立て、ツールループの span。 |
| **ログ** | `diagnostics.otel.logs` が有効な場合に OTLP または stdout JSONL 経由でエクスポートされる、構造化された `logging.file` レコード。コンテンツキャプチャが明示的に有効化されていない限り、ログ本文は保留されます。 |

`traces`、`metrics`、`logs` は個別に切り替えられます。トレースとメトリクスは、`diagnostics.otel.enabled` が true の場合、デフォルトでオンになります。ログはデフォルトでオフであり、`diagnostics.otel.logs` が明示的に `true` の場合にのみエクスポートされます。ログエクスポートのデフォルトは OTLP です。stdout に JSONL を出力するには `diagnostics.otel.logsExporter` を `stdout` に設定し、各診断ログレコードを OTLP と stdout の両方に送るには `both` を設定します。

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
| `OTEL_EXPORTER_OTLP_PROTOCOL` | ワイヤプロトコルを上書きします（現在は `http/protobuf` のみが尊重されます）。 |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | `{gen_ai.operation.name} {gen_ai.request.model}` span 名、`CLIENT` span kind、レガシーの `gen_ai.system` の代わりとなる `gen_ai.provider.name` を含む、最新の実験的な GenAI 推論 span 形状を発行するには `gen_ai_latest_experimental` に設定します。GenAI メトリクスは、いずれの場合も有界で低カーディナリティのセマンティック属性を使用します。 |
| `OPENCLAW_OTEL_PRELOADED` | 別の preload またはホストプロセスがすでにグローバル OpenTelemetry SDK を登録している場合は `1` に設定します。その場合 Plugin は自身の NodeSDK ライフサイクルをスキップしますが、診断リスナーは配線し、`traces`/`metrics`/`logs` は尊重します。 |

## プライバシーとコンテンツキャプチャ

生のモデル/ツールコンテンツはデフォルトではエクスポートされません。Span は有界な識別子（channel、provider、model、error category、ハッシュのみの request ids、tool source、tool owner、skill name/source）を保持し、プロンプト本文、レスポンス本文、ツール入力、ツール出力、skill ファイルパス、セッションキーを含めることはありません。OTLP ログレコードはデフォルトで severity、logger、コード位置、信頼済みトレースコンテキスト、サニタイズ済み属性を保持しますが、生のログメッセージ本文は `diagnostics.otel.captureContent` が boolean `true` に設定されている場合にのみエクスポートされます。粒度の細かい `captureContent.*` サブキーはログ本文を有効化しません。スコープ付きエージェントセッションキーのように見えるラベルは `unknown` に置き換えられます。
Talk メトリクスは、mode、transport、provider、event type などの有界なイベントメタデータのみをエクスポートします。トランスクリプト、音声ペイロード、session ids、turn ids、call ids、room ids、handoff tokens は含まれません。

送信モデルリクエストには W3C `traceparent` ヘッダーが含まれる場合があります。そのヘッダーは、アクティブなモデル呼び出しに対する OpenClaw 所有の診断トレースコンテキストからのみ生成されます。既存の呼び出し元提供 `traceparent` ヘッダーは置き換えられるため、Plugin やカスタムプロバイダーオプションがサービス間トレースの祖先を偽装することはできません。

`diagnostics.otel.captureContent.*` を `true` に設定するのは、コレクターと保持ポリシーがプロンプト、レスポンス、ツール、またはシステムプロンプトのテキストについて承認されている場合のみにしてください。各サブキーは個別にオプトインです。

- `inputMessages` - ユーザープロンプトのコンテンツ。
- `outputMessages` - モデルレスポンスのコンテンツ。
- `toolInputs` - ツール引数ペイロード。
- `toolOutputs` - ツール結果ペイロード。
- `systemPrompt` - 組み立て済みのシステム/開発者プロンプト。
- `toolDefinitions` - モデルツール名、説明、スキーマ。

いずれかのサブキーが有効な場合、モデルおよびツール span には、そのクラスについてのみ有界でリダクト済みの `openclaw.content.*` 属性が付与されます。boolean `captureContent: true` は、OTLP ログメッセージ本文もエクスポート承認済みである広範な診断キャプチャでのみ使用してください。

`toolInputs`/`toolOutputs` コンテンツは、組み込みエージェントランタイムのツール実行（完了/エラー span の `openclaw.content.tool_input`、完了 span の `openclaw.content.tool_output`）でキャプチャされます。外部ハーネスのツール呼び出し（Codex、Claude CLI）は、コンテンツペイロードなしで `tool.execution.*` span を発行します。キャプチャされたコンテンツは、信頼済みのリスナー専用チャネルで伝送され、公開診断イベントバスに置かれることはありません。

## サンプリングとフラッシュ

- **トレース:** `diagnostics.otel.sampleRate`（ルート span のみ、`0.0` はすべて破棄、`1.0` はすべて保持）。
- **メトリクス:** `diagnostics.otel.flushIntervalMs`（最小 `1000`）。
- **ログ:** OTLP ログは `logging.level`（ファイルログレベル）に従います。コンソールフォーマットではなく、診断ログレコードのリダクションパスを使用します。高ボリュームのインストールでは、ローカルサンプリングよりも OTLP コレクターのサンプリング/フィルタリングを優先してください。プラットフォームがすでに stdout/stderr をログプロセッサーに送信しており、OTLP ログコレクターがない場合は、`diagnostics.otel.logsExporter: "stdout"` を設定します。Stdout レコードは、`ts`、`signal`、`service.name`、severity、body、リダクト済み属性、利用可能な場合は信頼済みトレースフィールドを含む、1 行につき 1 つの JSON オブジェクトです。
- **ファイルログ相関:** JSONL ファイルログには、ログ呼び出しが有効な診断トレースコンテキストを保持している場合、トップレベルの `traceId`、`spanId`、`parentSpanId`、`traceFlags` が含まれます。これにより、ログプロセッサーはローカルログ行をエクスポート済み span と結合できます。
- **リクエスト相関:** Gateway HTTP リクエストと WebSocket フレームは、内部リクエストトレーススコープを作成します。そのスコープ内のログと診断イベントはデフォルトでリクエストトレースを継承し、エージェント実行 span とモデル呼び出し span は子として作成されるため、プロバイダー `traceparent` ヘッダーは同じトレースに留まります。

## エクスポートされるメトリクス

### モデル使用量

- `openclaw.tokens` (カウンター、属性: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (カウンター、属性: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (ヒストグラム、属性: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (ヒストグラム、属性: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (ヒストグラム、GenAI セマンティック規約メトリック、属性: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (ヒストグラム、秒、GenAI セマンティック規約メトリック、属性: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, 任意の `error.type`)
- `openclaw.model_call.duration_ms` (ヒストグラム、属性: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`、さらに分類済みエラーでは `openclaw.errorCategory` と `openclaw.failureKind`)
- `openclaw.model_call.request_bytes` (ヒストグラム、最終的なモデルリクエストペイロードの UTF-8 バイトサイズ。生のペイロード内容は含まない)
- `openclaw.model_call.response_bytes` (ヒストグラム、ストリーミングされたレスポンスチャンクペイロードの UTF-8 バイトサイズ。高頻度のテキスト、思考、ツール呼び出しの差分は増分の `delta` バイトのみをカウントする。生のレスポンス内容は含まない)
- `openclaw.model_call.time_to_first_byte_ms` (ヒストグラム、最初のストリーミングレスポンスイベントまでの経過時間)
- `openclaw.model.failover` (カウンター、属性: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (カウンター、属性: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, 任意の `openclaw.agent`, 任意の `openclaw.toolName`)

### メッセージフロー

- `openclaw.webhook.received` (カウンター、属性: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (カウンター、属性: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (ヒストグラム、属性: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (カウンター、属性: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (カウンター、属性: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (カウンター、属性: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (カウンター、属性: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (ヒストグラム、属性: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (カウンター、属性: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (ヒストグラム、属性: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (カウンター、属性: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (ヒストグラム、属性: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### 会話

- `openclaw.talk.event` (カウンター、属性: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (ヒストグラム、属性: `openclaw.talk.event` と同じ。会話イベントが継続時間を報告したときに発行される)
- `openclaw.talk.audio.bytes` (ヒストグラム、属性: `openclaw.talk.event` と同じ。バイト長を報告する会話音声フレームイベントで発行される)

### キューとセッション

- `openclaw.queue.lane.enqueue` (カウンター、属性: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (カウンター、属性: `openclaw.lane`)
- `openclaw.queue.depth` (ヒストグラム、属性: `openclaw.lane` または `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (ヒストグラム、属性: `openclaw.lane`)
- `openclaw.session.state` (カウンター、属性: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (カウンター、属性: `openclaw.state`。復旧可能な古いセッション管理情報に対して発行される)
- `openclaw.session.stuck_age_ms` (ヒストグラム、属性: `openclaw.state`。復旧可能な古いセッション管理情報に対して発行される)
- `openclaw.session.turn.created` (カウンター、属性: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (カウンター、属性: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (カウンター、属性: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (ヒストグラム、属性: 対応する復旧カウンターと同じ)
- `openclaw.run.attempt` (カウンター、属性: `openclaw.attempt`)

### セッション生存性テレメトリ

`diagnostics.stuckSessionWarnMs` は、セッション生存性診断における進捗なし経過時間のしきい値です。`processing` セッションは、OpenClaw が返信、ツール、ステータス、ブロック、または ACP ランタイム進捗を観測している間、このしきい値に向けて経過時間を加算しません。入力中のキープアライブは進捗としてカウントされないため、無音のモデルやハーネスも検出できます。

OpenClaw は、まだ観測できる作業に基づいてセッションを分類します。

- `session.long_running`: アクティブな埋め込み作業、モデル呼び出し、またはツール呼び出しがまだ進捗しています。所有されているモデル呼び出しが `diagnostics.stuckSessionWarnMs` を超えて無音のままでも、`diagnostics.stuckSessionAbortMs` の前は長時間実行中として報告されるため、低速または非ストリーミングのモデルプロバイダーは、中止を観測できる状態である限り、停止した Gateway セッションのようには見えません。
- `session.stalled`: アクティブな作業は存在しますが、アクティブな実行が最近の進捗を報告していません。所有されているモデル呼び出しは、`diagnostics.stuckSessionAbortMs` 以降に `session.long_running` から `session.stalled` に切り替わります。所有者のない古いモデルまたはツールアクティビティは、無害な長時間実行作業として扱われません。停止した埋め込み実行は最初は観測のみのままになり、その後、進捗がない状態で `diagnostics.stuckSessionAbortMs` を超えると中止排出されるため、そのレーンの後ろでキューに入っているターンを再開できます。未設定の場合、中止しきい値は少なくとも 5 分かつ `diagnostics.stuckSessionWarnMs` の 3 倍という、より安全な延長ウィンドウにデフォルト設定されます。
- `session.stuck`: アクティブな作業がない古いセッション管理情報、または所有者のない古いモデルまたはツールアクティビティを伴うアイドル状態のキュー済みセッションです。これにより、復旧ゲートの通過直後に影響を受けたセッションレーンが解放されます。

復旧では、構造化された `session.recovery.requested` と `session.recovery.completed` イベントが発行されます。診断セッション状態は、変更を伴う復旧結果 (`aborted` または `released`) の後で、かつ同じ処理世代がまだ現在のものである場合にのみアイドルとしてマークされます。

`openclaw.session.stuck` カウンター、`openclaw.session.stuck_age_ms` ヒストグラム、`openclaw.session.stuck` スパンを発行するのは `session.stuck` だけです。繰り返される `session.stuck` 診断は、セッションが変更されないままの間バックオフするため、ダッシュボードでは Heartbeat の各ティックではなく、継続的な増加に対してアラートを出すべきです。設定ノブとデフォルトについては、[設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics)を参照してください。

生存性警告では次も発行されます。

- `openclaw.liveness.warning` (カウンター、属性: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (ヒストグラム、属性: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (ヒストグラム、属性: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (ヒストグラム、属性: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (ヒストグラム、属性: `openclaw.liveness.reason`)

### ハーネスのライフサイクル

- `openclaw.harness.duration_ms` (ヒストグラム、属性: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, エラー時の `openclaw.harness.phase`)

### ツール実行

- `openclaw.tool.execution.duration_ms` (ヒストグラム、属性: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`、さらにエラー時の `openclaw.errorCategory`)
- `openclaw.tool.execution.blocked` (カウンター、属性: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### 実行

- `openclaw.exec.duration_ms` (ヒストグラム、属性: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### 診断内部（メモリとツールループ）

- `openclaw.payload.large` (カウンター、属性: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (ヒストグラム、属性: `openclaw.payload.large` と同じ)
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
  - エラー時の `openclaw.errorCategory` と任意の `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (上流プロバイダーのリクエスト ID の SHA ベースの境界付きハッシュ。未加工の ID はエクスポートされません)
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` を指定すると、モデル呼び出し span は `openclaw.model.call` の代わりに、最新の GenAI 推論 span 名 `{gen_ai.operation.name} {gen_ai.request.model}` と `CLIENT` span kind を使用します。
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (プロンプト、履歴、応答、またはセッションキーの内容は含まれません)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (ループメッセージ、params、またはツール出力は含まれません)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

コンテンツキャプチャを明示的に有効化している場合、モデルとツールの span には、オプトインした特定のコンテンツクラスについて、境界付きで編集済みの `openclaw.content.*` 属性も含めることができます。

## 診断イベントカタログ

以下のイベントは、上記のメトリクスと span を支えます。Plugin は OTLP エクスポートなしで、これらを直接サブスクライブすることもできます。

**モデル使用量**

- `model.usage` - トークン、コスト、期間、コンテキスト、プロバイダー/モデル/チャンネル、セッション ID。`usage` はコストとテレメトリ用のプロバイダー/ターン会計です。`context.used` は現在のプロンプト/コンテキストのスナップショットであり、キャッシュ済み入力やツールループ呼び出しが関係する場合、プロバイダーの `usage.total` より低くなることがあります。

**メッセージフロー**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**キューとセッション**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (集計カウンター: Webhook/キュー/セッション)

**ハーネスライフサイクル**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  エージェントハーネスの実行ごとのライフサイクル。`harnessId`、任意の `pluginId`、プロバイダー/モデル/チャンネル、実行 ID を含みます。完了時には `durationMs`、`outcome`、任意の `resultClassification`、`yieldDetected`、および `itemLifecycle` のカウントが追加されます。エラー時には `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`)、`errorCategory`、および任意の `cleanupFailed` が追加されます。

**Exec**

- `exec.process.completed` - ターミナル結果、期間、ターゲット、モード、終了コード、失敗種別。コマンドテキストと作業ディレクトリは含まれません。

## エクスポーターなし

`diagnostics-otel` を実行しなくても、診断イベントを Plugin またはカスタムシンクで利用可能にできます。

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` を上げずに対象を絞ったデバッグ出力を行うには、診断フラグを使用します。フラグは大文字と小文字を区別せず、ワイルドカードをサポートします (例: `telegram.*` または `*`)。

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

または、一回限りの環境変数オーバーライドとして指定します。

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

フラグ出力は標準ログファイル (`logging.file`) に書き込まれ、引き続き `logging.redactSensitive` によって編集されます。完全なガイド:
[診断フラグ](/ja-JP/diagnostics/flags)。

## 無効化

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

`diagnostics-otel` を `plugins.allow` から外すことも、`openclaw plugins disable diagnostics-otel` を実行することもできます。

## 関連

- [ロギング](/ja-JP/logging) - ファイルログ、コンソール出力、CLI tailing、Control UI Logs タブ
- [Gateway ロギング内部](/ja-JP/gateway/logging) - WS ログスタイル、サブシステム接頭辞、コンソールキャプチャ
- [診断フラグ](/ja-JP/diagnostics/flags) - 対象を絞ったデバッグログフラグ
- [診断エクスポート](/ja-JP/gateway/diagnostics) - 運用者向けサポートバンドルツール (OTEL エクスポートとは別)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) - 完全な `diagnostics.*` フィールドリファレンス
