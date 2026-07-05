---
read_when:
    - OpenClaw のモデル使用状況、メッセージフロー、またはセッションメトリクスを OpenTelemetry コレクターに送信したい場合
    - Grafana、Datadog、Honeycomb、New Relic、Tempo、または別の OTLP バックエンドにトレース、メトリクス、ログを接続している
    - ダッシュボードやアラートを作成するには、正確なメトリック名、スパン名、または属性の形状が必要です
summary: diagnostics-otel Plugin を介して OpenClaw 診断情報を OpenTelemetry collectors または stdout JSONL にエクスポートする
title: OpenTelemetry エクスポート
x-i18n:
    generated_at: "2026-07-05T11:23:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e1ade877873729a7119cde3b819d82016cf4effad72af87e3c45bbc6cc3d48e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw は公式の `diagnostics-otel` plugin を通じて、
**OTLP/HTTP (protobuf)** で診断情報をエクスポートします。ログは、
コンテナおよびサンドボックスのログパイプライン向けに stdout JSONL として
書き込むこともできます。OTLP/HTTP を受け付けるコレクターやバックエンドなら、
コード変更なしで動作します。ローカルファイルログについては
[ログ記録](/ja-JP/logging)を参照してください。

- **診断イベント**は、モデル実行、メッセージフロー、セッション、キュー、
  exec のために Gateway とバンドル済み plugin が発行する、構造化された
  プロセス内レコードです。
- **`diagnostics-otel`** はそれらのイベントを購読し、OTLP/HTTP 経由で
  OpenTelemetry の**メトリクス**、**トレース**、**ログ**としてエクスポートし、
  ログレコードを stdout JSONL にミラーリングできます。
- **プロバイダー呼び出し**は、プロバイダーのトランスポートがカスタムヘッダーを
  受け付ける場合、OpenClaw の信頼済みモデル呼び出し span コンテキストから
  W3C `traceparent` ヘッダーを受け取ります。Plugin が発行したトレースコンテキストは
  伝播されません。
- エクスポーターは、診断サーフェスと plugin の両方が有効な場合にのみ接続されるため、
  デフォルトではプロセス内コストはほぼゼロに保たれます。

## クイックスタート

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

または、CLI から plugin を有効化します: `openclaw plugins enable diagnostics-otel`。

<Note>
`protocol` は `http/protobuf` のみをサポートします。`traces` と `metrics` はデフォルトで有効なため、その他の値（`grpc` を含む）は `unsupported protocol` 警告とともに diagnostics-otel サブスクリプション全体を中止します。これにより stdout ログエクスポートも停止します。非 OTLP の protocol 値で `logsExporter: "stdout"` のみを使いたい場合は、`traces: false` と `metrics: false` を明示的に設定してください。
</Note>

## エクスポートされるシグナル

| シグナル    | 含まれる内容                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **メトリクス** | トークン使用量、コスト、実行時間、フェイルオーバー、skill 使用、メッセージフロー、Talk イベント、キューレーン、セッション状態/リカバリー、ツール実行、exec、メモリ、liveness、エクスポーター健全性のカウンター/ヒストグラム。 |
| **トレース**  | モデル使用、モデル呼び出し、ハーネスライフサイクル、skill 使用、ツール実行、exec、webhook/メッセージ処理、コンテキスト組み立て、ツールループの span。                                                      |
| **ログ**    | `diagnostics.otel.logs` が有効な場合に OTLP または stdout JSONL 経由でエクスポートされる、構造化された `logging.file` レコード。コンテンツキャプチャが明示的に有効化されていない限り、ログ本文は抑制されます。                          |

`traces`、`metrics`、`logs` は個別に切り替えられます。トレースとメトリクスは、
`diagnostics.otel.enabled` が true の場合、デフォルトでオンになります。ログは
デフォルトでオフで、`diagnostics.otel.logs` が明示的に `true` の場合にのみ
エクスポートされます。ログエクスポートはデフォルトで OTLP です。stdout の JSONL には
`diagnostics.otel.logsExporter` を `stdout` に設定し、両方を使う場合は `both` に設定します。

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
      protocol: "http/protobuf", // grpc disables OTLP export
      serviceName: "openclaw-gateway", // unset falls back to OTEL_SERVICE_NAME, then "openclaw"
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

| 変数                                                                                                              | 目的                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 設定キーが未設定の場合の `diagnostics.otel.endpoint` のフォールバック。                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 対応する `diagnostics.otel.*Endpoint` 設定キーが未設定の場合に使用される、シグナル固有のエンドポイントフォールバック。シグナル固有の設定はシグナル固有の環境変数より優先され、シグナル固有の環境変数は共有エンドポイントより優先されます。                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | 設定キーが未設定の場合の `diagnostics.otel.serviceName` のフォールバック。デフォルトのサービス名は `openclaw` です。                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | `diagnostics.otel.protocol` が未設定の場合のワイヤープロトコルのフォールバック。`http/protobuf` のみがエクスポートを有効にします。                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 最新の GenAI 推論 span 形状を発行するには `gen_ai_latest_experimental` に設定します: `{gen_ai.operation.name} {gen_ai.request.model}` span 名、`CLIENT` span 種別、レガシーの `gen_ai.system` の代わりの `gen_ai.provider.name`。GenAI メトリクスは常に、境界付けられた低カーディナリティ属性を使用します。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 別のプリロードまたはホストプロセスがすでにグローバル OpenTelemetry SDK を登録している場合に `1` に設定します。その場合 plugin は自身の NodeSDK ライフサイクルをスキップしますが、診断リスナーの接続と `traces`/`metrics`/`logs` の反映は引き続き行います。                                                                                    |

## プライバシーとコンテンツキャプチャ

生のモデル/ツールコンテンツはデフォルトではエクスポートされません。span は境界付けられた
識別子（channel、provider、model、error category、ハッシュのみの request id、
tool source、tool owner、skill name/source）を持ち、プロンプトテキスト、
応答テキスト、ツール入力、ツール出力、skill ファイルパス、セッションキーは
決して含みません。スコープ付きエージェントセッションキーのように見える値
（たとえば `agent:` で始まるもの）は、低カーディナリティ属性上では `unknown` に
置き換えられます。OTLP ログレコードはデフォルトで severity、logger、コード位置、
信頼済みトレースコンテキスト、サニタイズ済み属性を保持します。生のログメッセージ本文は、
`diagnostics.otel.captureContent` が boolean `true` の場合にのみエクスポートされます。
細分化された `captureContent.*` サブキーがログ本文を有効にすることはありません。
Talk メトリクスは、境界付けられたイベントメタデータ（mode、transport、provider、
event type）のみをエクスポートします。transcript、audio payload、session id、
turn id、call id、room id、handoff token は含みません。

外向きのモデルリクエストには、アクティブなモデル呼び出しについて OpenClaw 所有の
診断トレースコンテキストからのみ生成された W3C `traceparent` ヘッダーが含まれる場合があります。
既存の呼び出し元指定 `traceparent` ヘッダーは置き換えられるため、plugin や
カスタムプロバイダーオプションがクロスサービスのトレース祖先を偽装することはできません。

プロンプト、応答、ツール、または system-prompt テキストについて、コレクターと保持ポリシーが
承認されている場合にのみ、`diagnostics.otel.captureContent.*` を `true` に設定してください。
各サブキーは独立しています。

- `inputMessages` - ユーザープロンプトコンテンツ。
- `outputMessages` - モデル応答コンテンツ。
- `toolInputs` - ツール引数ペイロード。
- `toolOutputs` - ツール結果ペイロード。
- `systemPrompt` - 組み立て済み system/developer プロンプト。
- `toolDefinitions` - モデルツールの名前、説明、スキーマ。

いずれかのサブキーが有効な場合、そのクラスに限り、モデルとツールの span に
境界付けられ、リダクトされた `openclaw.content.*` 属性が付与されます。

<Note>
Boolean の `captureContent: true` は、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`toolDefinitions`、OTLP ログ本文をまとめて有効にしますが、**`systemPrompt` は有効にしません**。組み立て済みシステムプロンプトも必要な場合は、`captureContent.systemPrompt: true` を明示的に設定してください。
</Note>

`toolInputs`/`toolOutputs` コンテンツは、組み込みエージェントランタイムの
ツール実行についてキャプチャされます（completed/error span の
`openclaw.content.tool_input`、completed span の `openclaw.content.tool_output`）。
外部ハーネスのツール呼び出し（Codex、Claude CLI）は、コンテンツペイロードなしで
`tool.execution.*` span を発行します。キャプチャされたコンテンツは、信頼済みの
リスナー専用 channel 上を流れ、公開診断イベントバスに置かれることはありません。

## サンプリングとフラッシュ

- **トレース:** `diagnostics.otel.sampleRate` はルートスパンにのみ `TraceIdRatioBasedSampler`
  を設定します（`0.0` はすべて破棄、`1.0` はすべて保持）。未設定の場合は
  OpenTelemetry SDK のデフォルト（常時オン）を使用します。
- **メトリクス:** `diagnostics.otel.flushIntervalMs`（最小値
  `1000` にクランプ）。未設定の場合は SDK の定期エクスポートのデフォルトを使用します。
- **ログ:** OTLP ログは `logging.level`（ファイルログレベル）に従い、
  コンソール形式ではなく、診断ログレコードのリダクション経路を使用します。大量のログが発生する
  インストールでは、ローカル
  サンプリングよりも OTLP コレクター側のサンプリング/フィルタリングを優先してください。プラットフォームがすでに
  stdout/stderr をログプロセッサーに送っており、OTLP ログ
  コレクターがない場合は、`diagnostics.otel.logsExporter: "stdout"` を設定します。Stdout レコードは、1 行につき 1 つの JSON オブジェクトで、`ts`、`signal`、
  `service.name`、重大度、本文、リダクト済み属性、利用可能な場合は信頼済みトレース
  フィールドを含みます。
- **ファイルログ相関:** JSONL ファイルログには、ログ呼び出しが有効な
  診断トレースコンテキストを持つ場合、トップレベルの `traceId`、
  `spanId`、`parentSpanId`、`traceFlags` が含まれ、ログプロセッサーがローカルログ行を
  エクスポート済みスパンと結合できます。
- **リクエスト相関:** Gateway HTTP リクエストと WebSocket フレームは
  内部リクエストトレーススコープを作成します。その
  スコープ内のログと診断イベントはデフォルトでリクエストトレースを継承し、一方でエージェント実行とモデル呼び出し
  スパンは子として作成されるため、プロバイダーの `traceparent` ヘッダーは同じトレース上に維持されます。
- **モデル呼び出し相関:** `openclaw.model.call` スパンには、デフォルトで安全なプロンプト
  コンポーネントサイズが含まれ、プロバイダー
  結果が使用量を公開している場合は呼び出しごとのトークン属性も含まれます。`openclaw.model.usage` は、集計コスト、コンテキスト、チャンネルダッシュボード向けの実行レベル
  会計スパンのままであり、
  発行元ランタイムに信頼済みトレースコンテキストがある場合は同じ診断トレース上に残ります。

## エクスポートされるメトリクス

### モデル使用量

- `openclaw.tokens`（カウンター、属性: `openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（カウンター、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（ヒストグラム、属性: `openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（ヒストグラム、GenAI セマンティック規約メトリクス、属性: `gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（ヒストグラム、秒、GenAI セマンティック規約メトリクス、属性: `gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`、任意の `error.type`）
- `openclaw.model_call.duration_ms`（ヒストグラム、属性: `openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`、分類済みエラーではさらに `openclaw.errorCategory` と `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（ヒストグラム、最終モデルリクエストペイロードの UTF-8 バイトサイズ。生ペイロード内容は含まない）
- `openclaw.model_call.response_bytes`（ヒストグラム、ストリーミングされたレスポンスチャンクペイロードの UTF-8 バイトサイズ。高頻度のテキスト、thinking、ツール呼び出しデルタは増分の `delta` バイトのみをカウント。生レスポンス内容は含まない）
- `openclaw.model_call.time_to_first_byte_ms`（ヒストグラム、最初のストリーミングレスポンスイベントまでの経過時間）
- `openclaw.model.failover`（カウンター、属性: `openclaw.provider`、`openclaw.model`、`openclaw.failover.to_provider`、`openclaw.failover.to_model`、`openclaw.failover.reason`、`openclaw.failover.suspended`、`openclaw.lane`）
- `openclaw.skill.used`（カウンター、属性: `openclaw.skill.name`、`openclaw.skill.source`、`openclaw.skill.activation`、任意の `openclaw.agent`、任意の `openclaw.toolName`）

### メッセージフロー

- `openclaw.webhook.received`（カウンター、属性: `openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（カウンター、属性: `openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（カウンター、属性: `openclaw.channel`、`openclaw.source`）
- `openclaw.message.received`（カウンター、属性: `openclaw.channel`、`openclaw.source`）
- `openclaw.message.dispatch.started`（カウンター、属性: `openclaw.channel`、`openclaw.source`）
- `openclaw.message.dispatch.completed`（カウンター、属性: `openclaw.channel`、`openclaw.outcome`、`openclaw.reason`、`openclaw.source`）
- `openclaw.message.dispatch.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.outcome`、`openclaw.reason`、`openclaw.source`）
- `openclaw.message.processed`（カウンター、属性: `openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.delivery.started`（カウンター、属性: `openclaw.channel`、`openclaw.delivery.kind`）
- `openclaw.message.delivery.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.delivery.kind`、`openclaw.outcome`、`openclaw.errorCategory`）

### Talk

- `openclaw.talk.event`（カウンター、属性: `openclaw.talk.event_type`、`openclaw.talk.mode`、`openclaw.talk.transport`、`openclaw.talk.brain`、`openclaw.talk.provider`）
- `openclaw.talk.event.duration_ms`（ヒストグラム、属性: `openclaw.talk.event` と同じ。Talk イベントが期間を報告したときに発行）
- `openclaw.talk.audio.bytes`（ヒストグラム、属性: `openclaw.talk.event` と同じ。バイト長を報告する Talk 音声フレームイベントで発行）

### キューとセッション

- `openclaw.queue.lane.enqueue`（カウンター、属性: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（カウンター、属性: `openclaw.lane`）
- `openclaw.queue.depth`（ヒストグラム、属性: `openclaw.lane` または `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（ヒストグラム、属性: `openclaw.lane`）
- `openclaw.session.state`（カウンター、属性: `openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（カウンター、属性: `openclaw.state`。復旧可能な古いセッション記録管理に対して発行）
- `openclaw.session.stuck_age_ms`（ヒストグラム、属性: `openclaw.state`。復旧可能な古いセッション記録管理に対して発行）
- `openclaw.session.turn.created`（カウンター、属性: `openclaw.agent`、`openclaw.channel`、`openclaw.trigger`）
- `openclaw.session.recovery.requested`（カウンター、属性: `openclaw.state`、`openclaw.action`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.completed`（カウンター、属性: `openclaw.state`、`openclaw.action`、`openclaw.status`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.age_ms`（ヒストグラム、属性: 対応する recovery カウンターと同じ）
- `openclaw.run.attempt`（カウンター、属性: `openclaw.attempt`）

### セッション生存性テレメトリ

`diagnostics.stuckSessionWarnMs` は、セッション
生存性診断における進行なし経過時間のしきい値です。`processing` セッションは、OpenClaw が返信、ツール、ステータス、ブロック、または ACP ランタイム
進行を観測している間、この
しきい値に向けて経過しません。入力中 keepalive は進行としてカウントされないため、無音のモデルや
ハーネスも検出できます。

OpenClaw は、まだ観測できる作業に基づいてセッションを分類します。

- `session.long_running`: アクティブな埋め込み作業、モデル呼び出し、またはツール呼び出しが
  まだ進行しています。所有されているモデル呼び出しが
  `diagnostics.stuckSessionWarnMs` を超えて無音のままでも、
  `diagnostics.stuckSessionAbortMs` の前には long-running として報告されるため、低速または非ストリーミングのモデルプロバイダーは、
  中断を観測できる間は停止した Gateway セッションのようには見えません。
- `session.stalled`: アクティブな作業は存在しますが、アクティブな実行が最近の
  進行を報告していません。所有されているモデル呼び出しは、`diagnostics.stuckSessionAbortMs` 以降に `session.long_running` から
  `session.stalled` に切り替わります。所有者のない
  古いモデル/ツールアクティビティは、無害な長時間実行作業として扱われません。
  停止した埋め込み実行は最初は観測のみのままになり、その後
  `diagnostics.stuckSessionAbortMs` を超えて進行がない場合は中断ドレインされるため、
  レーンの後ろにあるキュー済みターンを再開できます。未設定の場合、中断しきい値は、
  少なくとも 5 分かつ
  `diagnostics.stuckSessionWarnMs` の 3 倍という、より安全な延長ウィンドウにデフォルト設定されます。
- `session.stuck`: アクティブな作業のない古いセッション記録管理、または所有者のない古いモデル/ツールアクティビティを持つアイドル状態の
  キュー済みセッションです。これにより、復旧ゲート通過後すぐに
  影響を受けるセッションレーンが解放されます。

復旧は、構造化された `session.recovery.requested` と
`session.recovery.completed` イベントを発行します。診断セッション状態は、変更を伴う復旧結果（`aborted` または `released`）の後、かつ同じ processing 世代がまだ現在のものである場合にのみ
アイドルとしてマークされます。

`session.stuck` だけが、`openclaw.session.stuck` カウンター、
`openclaw.session.stuck_age_ms` ヒストグラム、`openclaw.session.stuck`
スパンを発行します。セッションが変更されない間、繰り返される `session.stuck` 診断はバックオフするため、ダッシュボードでは
Heartbeat の各 tick ではなく、継続的な増加に対してアラートを出すべきです。設定ノブとデフォルトについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics)を参照してください。

生存性警告は以下も発行します。

- `openclaw.liveness.warning`（カウンター、属性: `openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_p99_ms`（ヒストグラム、属性: `openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_max_ms`（ヒストグラム、属性: `openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_utilization`（ヒストグラム、属性: `openclaw.liveness.reason`）
- `openclaw.liveness.cpu_core_ratio`（ヒストグラム、属性: `openclaw.liveness.reason`）

### ハーネスライフサイクル

- `openclaw.harness.duration_ms`（ヒストグラム、属性: `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、エラー時の `openclaw.harness.phase`）

### ツール実行とループ検出

- `openclaw.tool.execution.duration_ms`（ヒストグラム、属性: `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、エラー時の追加属性 `openclaw.errorCategory`）
- `openclaw.tool.execution.blocked`（カウンター、属性: `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、`openclaw.deniedReason`）
- `openclaw.tool.loop`（カウンター、属性: `openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`、任意の `openclaw.loop.paired_tool`。反復的なツール呼び出しループが検出されたときに発行）

### Exec

- `openclaw.exec.duration_ms`（ヒストグラム、属性: `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 診断内部（メモリ、ペイロード、エクスポーター健全性）

- `openclaw.payload.large`（カウンター、属性: `openclaw.payload.surface`、`openclaw.payload.action`、`openclaw.channel`、`openclaw.plugin`、`openclaw.reason`）
- `openclaw.payload.large_bytes`（ヒストグラム、属性: `openclaw.payload.large` と同じ）
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes`（ヒストグラム、属性なし。プロセスメモリサンプル）
- `openclaw.memory.pressure`（カウンター、属性: `openclaw.memory.level`、`openclaw.memory.reason`）
- `openclaw.diagnostic.async_queue.dropped`（カウンター、属性: `openclaw.diagnostic.async_queue.drop_class`。内部診断キューのバックプレッシャーによるドロップ）
- `openclaw.telemetry.exporter.events`（カウンター、属性: `openclaw.exporter`、`openclaw.signal`、`openclaw.status`、任意の `openclaw.reason`、任意の `openclaw.errorCategory`。エクスポーターのライフサイクル/障害自己テレメトリ）

## エクスポートされるスパン

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - デフォルトでは `gen_ai.system`、または最新の GenAI セマンティック規約をオプトインしている場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - デフォルトでは `gen_ai.system`、または最新の GenAI セマンティック規約をオプトインしている場合は `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - エラー時は `openclaw.errorCategory`, `error.type`、および任意の `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (安全なコンポーネントサイズのみ、プロンプト本文は含まない)
  - モデル呼び出し結果がその個別呼び出しのプロバイダー使用量を持つ場合は `openclaw.model_call.usage.*` と `gen_ai.usage.*`
  - 上流プロバイダーの結果がリクエスト ID を公開する場合は、属性 `openclaw.upstreamRequestIdHash` (境界付き、ハッシュベース) を持つスパンイベント `openclaw.provider.request`。生の ID は決してエクスポートされない
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` では、モデル呼び出しスパンは `openclaw.model.call` の代わりに、最新の GenAI 推論スパン名 `{gen_ai.operation.name} {gen_ai.request.model}` と `CLIENT` スパン種別を使用する。
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - 完了時: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - エラー時: `openclaw.harness.phase`, `openclaw.errorCategory`, 任意の `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, 任意の `openclaw.tool.owner`, `openclaw.tool.params.*`
  - エラー時は任意の `openclaw.errorCategory`/`openclaw.errorCode`、ポリシーまたはサンドボックスで拒否された場合は `openclaw.deniedReason` と `openclaw.outcome=blocked`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (プロンプト、履歴、レスポンス、セッションキーの内容は含まない)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, 任意の `openclaw.loop.paired_tool` (ループメッセージ、パラメーター、ツール出力は含まない)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, 任意の `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

コンテンツキャプチャが明示的に有効化されている場合、モデルとツールのスパンには、オプトインした特定のコンテンツクラスについて、境界付きでリダクション済みの `openclaw.content.*` 属性も含めることができる。

## 診断イベントカタログ

以下のイベントは、上記のメトリクスとスパンを支える。Plugin は OTLP エクスポートなしでも、これらを直接サブスクライブできる。

**モデル使用量**

- `model.usage` - トークン、コスト、期間、コンテキスト、プロバイダー/モデル/チャンネル、セッション ID。`usage` はコストとテレメトリー用のプロバイダー/ターンの会計情報であり、`context.used` は現在のプロンプト/コンテキストのスナップショットである。キャッシュ済み入力やツールループ呼び出しが関係する場合、プロバイダーの `usage.total` より低くなることがある。

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
  エージェントハーネスの実行ごとのライフサイクル。`harnessId`、任意の `pluginId`、プロバイダー/モデル/チャンネル、実行 ID を含む。完了時には `durationMs`、`outcome`、任意の `resultClassification`、`yieldDetected`、および `itemLifecycle` カウントが追加される。エラー時には `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`)、`errorCategory`、任意の `cleanupFailed` が追加される。

**Exec**

- `exec.process.completed` - ターミナル結果、期間、ターゲット、モード、終了コード、失敗種別。コマンドテキストと作業ディレクトリは含まれない。
- `exec.approval.followup_suppressed` - セッションリバウンド後に古い承認フォローアップが破棄された。`approvalId`、`reason` (`session_rebound`)、`phase` (`direct_delivery` または `gateway_preflight`)、およびディスパッチャーのタイムスタンプを含む。セッションキー、ルート、コマンドテキストは含まれない。

## エクスポーターなし

`diagnostics-otel` を実行せずに、診断イベントを Plugin またはカスタムシンクで利用できる状態にしておく:

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` を上げずに対象を絞ったデバッグ出力を行うには、診断フラグを使用する。フラグは大文字小文字を区別せず、ワイルドカード (`telegram.*` または `*`) をサポートする:

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

または、一回限りの環境変数オーバーライドとして:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

フラグ出力は標準ログファイル (`logging.file`) に送られ、引き続き `logging.redactSensitive` によってリダクションされる。完全なガイド:
[診断フラグ](/ja-JP/diagnostics/flags)。

## 無効化

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

または、`plugins.allow` から `diagnostics-otel` を外すか、`openclaw plugins disable diagnostics-otel` を実行する。

## 関連

- [ログ記録](/ja-JP/logging) - ファイルログ、コンソール出力、CLI の追尾表示、Control UI の Logs タブ
- [Gateway ログ記録の内部](/ja-JP/gateway/logging) - WS ログスタイル、サブシステム接頭辞、コンソールキャプチャ
- [診断フラグ](/ja-JP/diagnostics/flags) - 対象を絞ったデバッグログフラグ
- [診断エクスポート](/ja-JP/gateway/diagnostics) - オペレーター向けサポートバンドルツール (OTEL エクスポートとは別)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) - `diagnostics.*` フィールドの完全なリファレンス
