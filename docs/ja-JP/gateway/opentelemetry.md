---
read_when:
    - OpenClaw のモデル使用量、メッセージフロー、またはセッションのメトリクスを OpenTelemetry コレクターに送信したい場合
    - Grafana、Datadog、Honeycomb、New Relic、Tempo、またはその他の OTLP バックエンドにトレース、メトリクス、ログを接続する場合
    - ダッシュボードやアラートを構築するには、正確なメトリクス名、スパン名、または属性の形式が必要です
summary: diagnostics-otel Pluginを使用して、OpenClawの診断情報をOpenTelemetryコレクターまたは標準出力のJSONLへエクスポートする
title: OpenTelemetry エクスポート
x-i18n:
    generated_at: "2026-07-12T14:30:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw は、公式の `diagnostics-otel` Plugin を通じて診断情報を
**OTLP/HTTP (protobuf)** でエクスポートします。ログは、コンテナおよび
サンドボックスのログパイプライン向けに stdout JSONL として書き出すこともできます。
OTLP/HTTP を受け付ける任意のコレクターまたはバックエンドを、コードを変更せずに使用できます。
ローカルファイルのログについては、[ロギング](/ja-JP/logging)を参照してください。

- **診断イベント**は、モデル実行、メッセージフロー、セッション、キュー、
  および exec について、Gateway とバンドル済み Plugin が発行する構造化された
  プロセス内レコードです。
- **`diagnostics-otel`** はそれらのイベントを購読し、OpenTelemetry の
  **メトリクス**、**トレース**、および**ログ**として OTLP/HTTP 経由でエクスポートし、
  ログレコードを stdout JSONL にミラーリングすることもできます。
- **プロバイダー呼び出し**は、プロバイダーのトランスポートがカスタムヘッダーを
  受け付ける場合、OpenClaw の信頼されたモデル呼び出しスパンコンテキストから
  W3C `traceparent` ヘッダーを受け取ります。Plugin が発行したトレースコンテキストは
  伝播されません。
- エクスポーターは、診断サーフェスと Plugin の両方が有効な場合にのみ接続されるため、
  デフォルトではプロセス内コストがほぼゼロに保たれます。

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

または、CLI から Plugin を有効にします: `openclaw plugins enable diagnostics-otel`。

<Note>
`protocol` がサポートするのは `http/protobuf` のみです。`traces` と `metrics` はデフォルトで有効なため、その他の値（`grpc` を含む）を指定すると、`unsupported protocol` 警告とともに diagnostics-otel の購読全体が中止されます。これにより、stdout へのログエクスポートも停止します。非 OTLP プロトコル値で `logsExporter: "stdout"` のみを使用する場合は、`traces: false` と `metrics: false` を明示的に設定してください。
</Note>

## エクスポートされるシグナル

| シグナル    | 含まれる内容                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **メトリクス** | トークン使用量、コスト、実行時間、フェイルオーバー、Skills の使用状況、メッセージフロー、Talk イベント、キューレーン、セッションの状態／復旧、ツール実行、exec、メモリ、稼働状態、およびエクスポーターの正常性に関するカウンター／ヒストグラム。 |
| **トレース**  | モデル使用状況、モデル呼び出し、ハーネスのライフサイクル、Skills の使用状況、ツール実行、exec、Webhook／メッセージ処理、コンテキストの組み立て、およびツールループに関するスパン。                                                      |
| **ログ**    | `diagnostics.otel.logs` が有効な場合に、OTLP または stdout JSONL 経由でエクスポートされる構造化された `logging.file` レコード。コンテンツのキャプチャが明示的に有効化されていない限り、ログ本文は除外されます。                          |

`traces`、`metrics`、および `logs` は個別に切り替えられます。トレースとメトリクスは、
`diagnostics.otel.enabled` が true の場合にデフォルトで有効になります。ログはデフォルトで
無効であり、`diagnostics.otel.logs` が明示的に `true` の場合にのみエクスポートされます。
ログエクスポートのデフォルトは OTLP です。stdout に JSONL を出力するには
`diagnostics.otel.logsExporter` を `stdout` に、両方に出力するには `both` に設定します。

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
      protocol: "http/protobuf", // grpc は OTLP エクスポートを無効化
      serviceName: "openclaw-gateway", // 未設定の場合は OTEL_SERVICE_NAME、次に "openclaw" にフォールバック
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // ルートスパンのサンプラー、0.0..1.0
      flushIntervalMs: 60000, // メトリクスのエクスポート間隔（最小 1000ms）
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

| 変数                                                                                                              | 用途                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 設定キーが未設定の場合の `diagnostics.otel.endpoint` のフォールバック。                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 対応する `diagnostics.otel.*Endpoint` 設定キーが未設定の場合に使用される、シグナル固有のエンドポイントのフォールバック。シグナル固有の設定はシグナル固有の環境変数より優先され、シグナル固有の環境変数は共有エンドポイントより優先されます。                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | 設定キーが未設定の場合の `diagnostics.otel.serviceName` のフォールバック。デフォルトのサービス名は `openclaw` です。                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | `diagnostics.otel.protocol` が未設定の場合のワイヤープロトコルのフォールバック。`http/protobuf` のみがエクスポートを有効にします。                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 最新の GenAI 推論スパン形式を発行するには、`gen_ai_latest_experimental` に設定します。これにより、スパン名は `{gen_ai.operation.name} {gen_ai.request.model}`、スパン種別は `CLIENT` となり、従来の `gen_ai.system` の代わりに `gen_ai.provider.name` が使用されます。GenAI メトリクスでは、常に範囲が限定された低カーディナリティ属性が使用されます。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 別のプリロードまたはホストプロセスがグローバル OpenTelemetry SDK をすでに登録している場合は、`1` に設定します。その場合、Plugin は自身の NodeSDK ライフサイクルをスキップしますが、診断リスナーの接続は引き続き行い、`traces`／`metrics`／`logs` の設定に従います。                                                                                    |

## プライバシーとコンテンツのキャプチャ

モデル／ツールの生コンテンツは、デフォルトではエクスポート**されません**。スパンには、
範囲が限定された識別子（チャンネル、プロバイダー、モデル、エラーカテゴリ、ハッシュのみの
リクエスト ID、ツールソース、ツール所有者、Skills 名／ソース）が含まれますが、
プロンプトテキスト、応答テキスト、ツール入力、ツール出力、Skills ファイルパス、
またはセッションキーは含まれません。スコープ付きエージェントセッションキーに見える値
（たとえば `agent:` で始まる値）は、低カーディナリティ属性では `unknown` に置き換えられます。
OTLP ログレコードでは、デフォルトで重大度、ロガー、コード位置、信頼されたトレースコンテキスト、
およびサニタイズ済み属性が保持されます。生のログメッセージ本文がエクスポートされるのは、
`diagnostics.otel.captureContent` が真偽値の `true` の場合のみです。細粒度の
`captureContent.*` サブキーでログ本文が有効になることはありません。Talk メトリクスは、
範囲が限定されたイベントメタデータ（モード、トランスポート、プロバイダー、イベント種別）のみを
エクスポートし、文字起こし、音声ペイロード、セッション ID、ターン ID、呼び出し ID、
ルーム ID、またはハンドオフトークンはエクスポートしません。

送信モデルリクエストには、アクティブなモデル呼び出しに対する OpenClaw 所有の診断トレース
コンテキストのみから生成された W3C `traceparent` ヘッダーが含まれる場合があります。
呼び出し元が指定した既存の `traceparent` ヘッダーは置き換えられるため、Plugin または
カスタムプロバイダーオプションがサービス間のトレース祖先関係を偽装することはできません。

`diagnostics.otel.captureContent.*` を `true` に設定するのは、コレクターと保持ポリシーが
プロンプト、応答、ツール、またはシステムプロンプトのテキストについて承認されている場合だけに
してください。各サブキーは独立しています。

- `inputMessages` - ユーザープロンプトの内容。
- `outputMessages` - モデル応答の内容。
- `toolInputs` - ツール引数のペイロード。
- `toolOutputs` - ツール結果のペイロード。
- `systemPrompt` - 組み立てられたシステム／開発者プロンプト。
- `toolDefinitions` - モデルツールの名前、説明、およびスキーマ。

いずれかのサブキーを有効にすると、モデルおよびツールのスパンには、そのクラスだけを対象とした、
範囲が限定され編集済みの `openclaw.content.*` 属性が設定されます。

<Note>
真偽値の `captureContent: true` を設定すると、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`toolDefinitions`、および OTLP ログ本文がまとめて有効になりますが、`systemPrompt` は有効に**なりません**。組み立てられたシステムプロンプトも必要な場合は、`captureContent.systemPrompt: true` を明示的に設定してください。
</Note>

`toolInputs`／`toolOutputs` の内容は、組み込みエージェントランタイムの
ツール実行についてキャプチャされます（完了／エラーのスパンでは
`openclaw.content.tool_input` および `gen_ai.tool.call.arguments`、
完了スパンでは `openclaw.content.tool_output` および
`gen_ai.tool.call.result`）。`openclaw.content.*` の名前は、安定した
OpenClaw 属性名として維持されます。`gen_ai.tool.call.*` のコピーは、
semconv ネイティブのビューアー向けにそれらをミラーリングします。
外部ハーネスのツール呼び出し（Codex、Claude CLI）は、コンテンツペイロードを含まない
`tool.execution.*` スパンを発行します。キャプチャされたコンテンツは、信頼された
リスナー専用チャンネルを通じて送信され、公開診断イベントバスには一切配置されません。

## サンプリングとフラッシュ

- **トレース:** `diagnostics.otel.sampleRate` は、ルートスパンのみに
  `TraceIdRatioBasedSampler` を設定します（`0.0` はすべて破棄、`1.0` はすべて保持）。
  未設定の場合は、OpenTelemetry SDK のデフォルト（常時オン）を使用します。
- **メトリクス:** `diagnostics.otel.flushIntervalMs`（最小値
  `1000` に制限）。未設定の場合は、SDK の定期エクスポートのデフォルトを使用します。
- **ログ:** OTLP ログは `logging.level`（ファイルログレベル）に従い、
  コンソールのフォーマットではなく、診断ログレコードの秘匿化処理を使用します。大量のログが発生する
  インストール環境では、ローカルサンプリングよりも OTLP コレクターでのサンプリングやフィルタリングを
  推奨します。プラットフォームが stdout/stderr をすでにログプロセッサーへ転送しており、OTLP ログ
  コレクターがない場合は、`diagnostics.otel.logsExporter: "stdout"` を設定します。
  stdout レコードは、`ts`、`signal`、`service.name`、重大度、本文、秘匿化された属性、および利用可能な場合は
  信頼済みトレースフィールドを含む、1 行につき 1 つの JSON オブジェクトです。
- **ファイルログの相関付け:** JSONL ファイルログには、ログ呼び出しが有効な
  診断トレースコンテキストを保持している場合、トップレベルの `traceId`、
  `spanId`、`parentSpanId`、`traceFlags` が含まれます。これにより、ログプロセッサーは
  ローカルのログ行をエクスポートされたスパンと結合できます。
- **リクエストの相関付け:** Gateway の HTTP リクエストと WebSocket フレームは、
  内部リクエストトレーススコープを作成します。そのスコープ内のログと診断イベントは、
  デフォルトでリクエストトレースを継承します。一方、エージェント実行スパンとモデル呼び出し
  スパンは子として作成されるため、プロバイダーの `traceparent` ヘッダーは同じ
  トレースに維持されます。
- **モデル呼び出しの相関付け:** `openclaw.model.call` スパンには、デフォルトで安全なプロンプト
  コンポーネントサイズが含まれ、プロバイダーの結果に使用量が含まれる場合は呼び出しごとのトークン属性も
  含まれます。`openclaw.model.usage` は、集計コスト、コンテキスト、チャンネルダッシュボード向けの
  実行レベルの集計スパンであり続け、イベントを発行するランタイムに信頼済み
  トレースコンテキストがある場合は、同じ診断トレース上に維持されます。

## エクスポートされるメトリクス

### モデル使用量

- `openclaw.tokens`（カウンター、属性: `openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.agent`）
- `openclaw.cost.usd`（カウンター、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（ヒストグラム、属性: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（ヒストグラム、属性: `openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `gen_ai.client.token.usage`（ヒストグラム、GenAI セマンティック規約メトリクス、属性: `gen_ai.token.type` = `input`/`output`、`gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`）
- `gen_ai.client.operation.duration`（ヒストグラム、秒、GenAI セマンティック規約メトリクス、属性: `gen_ai.provider.name`、`gen_ai.operation.name`、`gen_ai.request.model`、任意の `error.type`）
- `openclaw.model_call.duration_ms`（ヒストグラム、属性: `openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`、および分類済みエラーの場合は `openclaw.errorCategory` と `openclaw.failureKind`）
- `openclaw.model_call.request_bytes`（ヒストグラム、最終的なモデルリクエストペイロードの UTF-8 バイトサイズ。生のペイロード内容は含みません）
- `openclaw.model_call.response_bytes`（ヒストグラム、ストリーミング応答チャンクペイロードの UTF-8 バイトサイズ。高頻度のテキスト、思考、ツール呼び出しの差分では、増分 `delta` バイトのみをカウントします。生の応答内容は含みません）
- `openclaw.model_call.time_to_first_byte_ms`（ヒストグラム、最初のストリーミング応答イベントまでの経過時間）
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
- `openclaw.talk.event.duration_ms`（ヒストグラム、属性: `openclaw.talk.event` と同じ。Talk イベントが継続時間を報告した場合に発行）
- `openclaw.talk.audio.bytes`（ヒストグラム、属性: `openclaw.talk.event` と同じ。バイト長を報告する Talk 音声フレームイベントに対して発行）

### キューとセッション

- `openclaw.queue.lane.enqueue`（カウンター、属性: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（カウンター、属性: `openclaw.lane`）
- `openclaw.queue.depth`（ヒストグラム、属性: `openclaw.lane` または `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（ヒストグラム、属性: `openclaw.lane`）
- `openclaw.session.state`（カウンター、属性: `openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（カウンター、属性: `openclaw.state`。回復可能な古いセッション管理状態に対して発行）
- `openclaw.session.stuck_age_ms`（ヒストグラム、属性: `openclaw.state`。回復可能な古いセッション管理状態に対して発行）
- `openclaw.session.turn.created`（カウンター、属性: `openclaw.agent`、`openclaw.channel`、`openclaw.trigger`）
- `openclaw.session.recovery.requested`（カウンター、属性: `openclaw.state`、`openclaw.action`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.completed`（カウンター、属性: `openclaw.state`、`openclaw.action`、`openclaw.status`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.age_ms`（ヒストグラム、属性: 対応する回復カウンターと同じ）
- `openclaw.run.attempt`（カウンター、属性: `openclaw.attempt`）

### セッション生存性テレメトリ

`diagnostics.stuckSessionWarnMs` は、セッション生存性診断で進捗なしとみなす経過時間のしきい値です。
OpenClaw が返信、ツール、ステータス、ブロック、または ACP ランタイムの進捗を
観測している間、`processing` セッションの経過時間はこのしきい値に向かって
増加しません。入力中状態を維持するキープアライブは進捗としてカウントされないため、応答しないモデルや
ハーネスも引き続き検出できます。

OpenClaw は、引き続き観測できる作業に基づいてセッションを分類します。

- `session.long_running`: アクティブな埋め込み作業、モデル呼び出し、またはツール呼び出しが
  引き続き進行しています。所有者が存在するモデル呼び出しが
  `diagnostics.stuckSessionWarnMs` を超えて無応答のままの場合も、
  `diagnostics.stuckSessionAbortMs` より前は長時間実行中として報告されます。これにより、低速または非ストリーミングのモデルプロバイダーが、
  中止を観測可能な間に停止した Gateway セッションのように見えることを防ぎます。
- `session.stalled`: アクティブな作業は存在しますが、アクティブな実行から最近の
  進捗が報告されていません。所有者が存在するモデル呼び出しは、
  `diagnostics.stuckSessionAbortMs` 以降に `session.long_running` から
  `session.stalled` に切り替わります。所有者のない古いモデルまたはツールのアクティビティは、
  無害な長時間実行中の作業として扱われません。
  停滞した埋め込み実行は当初は観測のみを継続し、その後、
  `diagnostics.stuckSessionAbortMs` を超えて進捗がない場合は中止してドレインするため、
  そのレーンの後方で待機しているターンを再開できます。未設定の場合、中止しきい値は、
  少なくとも 5 分かつ `diagnostics.stuckSessionWarnMs` の 3 倍という、
  より安全な延長ウィンドウをデフォルトで使用します。
- `session.stuck`: アクティブな作業がない古いセッション管理状態、または所有者のない古い
  モデルまたはツールのアクティビティがあるアイドル状態のキュー済みセッションです。回復ゲートを通過すると、
  影響を受けるセッションレーンを直ちに解放します。

回復時には、構造化された `session.recovery.requested` および
`session.recovery.completed` イベントが発行されます。診断セッション状態がアイドルと
マークされるのは、状態を変更する回復結果（`aborted` または `released`）の後であり、かつ
同じ処理世代が引き続き最新である場合のみです。

`openclaw.session.stuck` カウンター、
`openclaw.session.stuck_age_ms` ヒストグラム、および `openclaw.session.stuck`
スパンを発行するのは `session.stuck` のみです。セッションが変更されない間、繰り返される
`session.stuck` 診断にはバックオフが適用されるため、ダッシュボードでは
Heartbeat の各ティックではなく、継続的な増加に対してアラートを設定する必要があります。設定項目とデフォルトについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics)を参照してください。

生存性警告では、以下も発行されます。

- `openclaw.liveness.warning`（カウンター、属性: `openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_p99_ms`（ヒストグラム、属性: `openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_delay_max_ms`（ヒストグラム、属性: `openclaw.liveness.reason`）
- `openclaw.liveness.event_loop_utilization`（ヒストグラム、属性: `openclaw.liveness.reason`）
- `openclaw.liveness.cpu_core_ratio`（ヒストグラム、属性: `openclaw.liveness.reason`）

### ハーネスのライフサイクル

- `openclaw.harness.duration_ms`（ヒストグラム、属性: `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、エラー時は `openclaw.harness.phase`）

### ツール実行とループ検出

- `openclaw.tool.execution.duration_ms`（ヒストグラム、属性: `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、およびエラー時は `openclaw.errorCategory`）
- `openclaw.tool.execution.blocked`（カウンター、属性: `gen_ai.tool.name`、`openclaw.toolName`、`openclaw.tool.source`、`openclaw.tool.owner`、`openclaw.tool.params.kind`、`openclaw.deniedReason`）
- `openclaw.tool.loop`（カウンター、属性: `openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`、任意の `openclaw.loop.paired_tool`。反復的なツール呼び出しループが検出された場合に発行）

### Exec

- `openclaw.exec.duration_ms`（ヒストグラム、属性: `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 診断内部情報（メモリ、ペイロード、エクスポーターの健全性）

- `openclaw.payload.large`（カウンター、属性: `openclaw.payload.surface`、`openclaw.payload.action`、`openclaw.channel`、`openclaw.plugin`、`openclaw.reason`）
- `openclaw.payload.large_bytes`（ヒストグラム、属性: `openclaw.payload.large` と同じ）
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes`（ヒストグラム、属性なし。プロセスメモリのサンプル）
- `openclaw.memory.pressure`（カウンター、属性: `openclaw.memory.level`、`openclaw.memory.reason`）
- `openclaw.diagnostic.async_queue.dropped`（カウンター、属性: `openclaw.diagnostic.async_queue.drop_class`。内部診断キューのバックプレッシャーによる破棄）
- `openclaw.telemetry.exporter.events`（カウンター、属性: `openclaw.exporter`、`openclaw.signal`、`openclaw.status`、任意の `openclaw.reason`、任意の `openclaw.errorCategory`。エクスポーターのライフサイクルおよび障害に関する自己テレメトリ）

## エクスポートされるスパン

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.tokens.*`（input/output/cache_read/cache_write/total）
  - デフォルトでは `gen_ai.system`。最新の GenAI セマンティック規約をオプトインした場合は `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`、`openclaw.errorCategory`
- `openclaw.model.call`
  - デフォルトでは `gen_ai.system`。最新の GenAI セマンティック規約をオプトインした場合は `gen_ai.provider.name`
  - `gen_ai.request.model`、`gen_ai.operation.name`、`openclaw.provider`、`openclaw.model`、`openclaw.api`、`openclaw.transport`
  - エラー時は `openclaw.errorCategory`、`error.type`、および任意の `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`、`openclaw.model_call.prompt.input_messages_chars`、`openclaw.model_call.prompt.system_prompt_chars`、`openclaw.model_call.prompt.tool_definitions_count`、`openclaw.model_call.prompt.tool_definitions_chars`、`openclaw.model_call.prompt.total_chars`（安全なコンポーネントサイズのみ。プロンプトテキストは含まない）
  - モデル呼び出し結果に、その個別呼び出しに対するプロバイダーの使用量が含まれる場合は、`openclaw.model_call.usage.*` および `gen_ai.usage.*`
  - 上流プロバイダーの結果でリクエスト ID が公開される場合は、属性 `openclaw.upstreamRequestIdHash`（サイズ制限付き、ハッシュベース）を持つスパンイベント `openclaw.provider.request`。生の ID は一切エクスポートされない
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` を設定すると、モデル呼び出しスパンでは `openclaw.model.call` の代わりに、最新の GenAI 推論スパン名 `{gen_ai.operation.name} {gen_ai.request.model}` と `CLIENT` スパン種別が使用される。
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完了時：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - エラー時：`openclaw.harness.phase`、`openclaw.errorCategory`、任意の `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`gen_ai.operation.name`（`execute_tool`）、`openclaw.toolName`、`openclaw.tool.source`、任意の `gen_ai.tool.call.id`、`openclaw.tool.owner`、`openclaw.tool.params.*`
  - エラー時は任意の `openclaw.errorCategory`/`openclaw.errorCode`。ポリシーまたはサンドボックスによって拒否された場合は、`openclaw.deniedReason` および `openclaw.outcome=blocked`
- `openclaw.exec`
  - `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`、`openclaw.exec.command_length`、`openclaw.exec.exit_code`、`openclaw.exec.exit_signal`、`openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（プロンプト、履歴、レスポンス、セッションキーの内容は含まない）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`、任意の `openclaw.loop.paired_tool`（ループメッセージ、パラメーター、ツール出力は含まない）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.reason`、`openclaw.memory.rss_bytes`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.heap_total_bytes`、`openclaw.memory.external_bytes`、`openclaw.memory.array_buffers_bytes`、任意の `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

コンテンツキャプチャを明示的に有効にすると、モデルおよびツールのスパンには、
オプトインした特定のコンテンツクラスに対する、サイズ制限および秘匿化済みの
`openclaw.content.*` 属性も含められます。

## 診断イベントカタログ

以下のイベントは、前述のメトリクスとスパンを支えています。Plugin は、
OTLP エクスポートを使用せずに、これらを直接サブスクライブすることもできます。

**モデル使用量**

- `model.usage` - トークン、コスト、所要時間、コンテキスト、プロバイダー/モデル/チャンネル、
  セッション ID。`usage` は、コストとテレメトリ用のプロバイダー/ターン単位の集計です。
  `context.used` は現在のプロンプト/コンテキストのスナップショットであり、
  キャッシュされた入力やツールループ呼び出しが関係する場合は、
  プロバイダーの `usage.total` より小さくなることがあります。

**メッセージフロー**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**キューとセッション**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（集計カウンター：Webhook/キュー/セッション）

**ハーネスのライフサイクル**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  エージェントハーネスの実行ごとのライフサイクル。`harnessId`、任意の
  `pluginId`、プロバイダー/モデル/チャンネル、実行 ID が含まれます。完了時には
  `durationMs`、`outcome`、任意の `resultClassification`、`yieldDetected`、
  および `itemLifecycle` のカウントが追加されます。エラー時には `phase`
  （`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`、
  および任意の `cleanupFailed` が追加されます。

**実行**

- `exec.process.completed` - ターミナルの結果、所要時間、ターゲット、モード、終了
  コード、および失敗種別。コマンドテキストと作業ディレクトリは
  含まれません。
- `exec.approval.followup_suppressed` - セッションの再バインド後に古くなった承認フォローアップを
  破棄。`approvalId`、`reason`
  （`session_rebound`）、`phase`（`direct_delivery` または `gateway_preflight`）、
  およびディスパッチャーのタイムスタンプが含まれます。セッションキー、ルート、コマンドテキストは
  含まれません。

## エクスポーターを使用しない場合

`diagnostics-otel` を実行せずに、診断イベントを Plugin やカスタムシンクから
利用できるようにします。

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` を引き上げずに対象を絞ったデバッグ出力を行うには、診断
フラグを使用します。フラグでは大文字と小文字が区別されず、ワイルドカード（`telegram.*` または
`*`）がサポートされます。

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

または、1 回限りの環境変数オーバーライドとして指定します。

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

フラグ出力は標準ログファイル（`logging.file`）に書き込まれ、引き続き
`logging.redactSensitive` によって秘匿化されます。完全なガイド：
[診断フラグ](/ja-JP/diagnostics/flags)。

## 無効化

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

または、`plugins.allow` から `diagnostics-otel` を除外するか、
`openclaw plugins disable diagnostics-otel` を実行します。

## 関連項目

- [ロギング](/ja-JP/logging) - ファイルログ、コンソール出力、CLI の追跡表示、Control UI の Logs タブ
- [Gateway ロギングの内部構造](/ja-JP/gateway/logging) - WS ログ形式、サブシステムのプレフィックス、コンソールキャプチャ
- [診断フラグ](/ja-JP/diagnostics/flags) - 対象を絞ったデバッグログフラグ
- [診断エクスポート](/ja-JP/gateway/diagnostics) - オペレーター向けサポートバンドルツール（OTEL エクスポートとは別）
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) - `diagnostics.*` フィールドの完全なリファレンス
