---
read_when:
    - OpenClawのモデル使用量、メッセージフロー、またはセッションメトリクスをOpenTelemetryコレクターに送信したい場合
    - Grafana、Datadog、Honeycomb、New Relic、Tempo、またはその他の OTLP バックエンドにトレース、メトリクス、ログを連携する場合
    - ダッシュボードやアラートを構築するには、正確なメトリクス名、スパン名、または属性の構造が必要です
summary: diagnostics-otel Plugin を介して OpenClaw の診断情報を OpenTelemetry コレクターまたは標準出力の JSONL にエクスポートする
title: OpenTelemetry エクスポート
x-i18n:
    generated_at: "2026-07-11T22:15:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw は、公式の `diagnostics-otel` Plugin を使用し、**OTLP/HTTP (protobuf)** 経由で診断情報をエクスポートします。
コンテナおよびサンドボックスのログパイプライン向けに、ログを stdout JSONL として書き出すこともできます。
OTLP/HTTP を受け入れる任意のコレクターまたはバックエンドを、コード変更なしで使用できます。ローカルファイルのログについては、
[ログ](/ja-JP/logging)を参照してください。

- **診断イベント**は、モデル実行、メッセージフロー、セッション、キュー、
  および exec について、Gateway とバンドル済み Plugin が出力する構造化されたプロセス内レコードです。
- **`diagnostics-otel`** はこれらのイベントを購読し、OTLP/HTTP 経由で OpenTelemetry の
  **メトリクス**、**トレース**、**ログ**としてエクスポートします。また、ログレコードを stdout JSONL に
  ミラーリングできます。
- **プロバイダー呼び出し**では、プロバイダーのトランスポートがカスタムヘッダーを受け入れる場合、
  OpenClaw の信頼されたモデル呼び出しスパンコンテキストから W3C `traceparent` ヘッダーを受け取ります。
  Plugin が出力したトレースコンテキストは伝播されません。
- エクスポーターは、診断機能と Plugin の両方が有効な場合にのみ接続されるため、
  デフォルトではプロセス内のコストはほぼゼロに保たれます。

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
`protocol` がサポートするのは `http/protobuf` のみです。`traces` と `metrics` はデフォルトで有効になるため、（`grpc` を含む）その他の値を指定すると、`unsupported protocol` 警告とともに diagnostics-otel の購読全体が中止されます。これにより、stdout へのログエクスポートも停止します。OTLP 以外のプロトコル値で `logsExporter: "stdout"` のみを使用する場合は、`traces: false` と `metrics: false` を明示的に設定してください。
</Note>

## エクスポートされるシグナル

| シグナル      | 含まれる内容                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **メトリクス** | トークン使用量、コスト、実行時間、フェイルオーバー、スキル使用状況、メッセージフロー、Talk イベント、キューレーン、セッションの状態と復旧、ツール実行、exec、メモリ、稼働状況、およびエクスポーターの健全性に関するカウンターとヒストグラム。 |
| **トレース**  | モデル使用、モデル呼び出し、ハーネスのライフサイクル、スキル使用、ツール実行、exec、Webhook/メッセージ処理、コンテキスト構築、およびツールループのスパン。                                                      |
| **ログ**    | `diagnostics.otel.logs` が有効な場合に OTLP または stdout JSONL 経由でエクスポートされる、構造化された `logging.file` レコード。コンテンツのキャプチャを明示的に有効にしない限り、ログ本文は除外されます。                          |

`traces`、`metrics`、`logs` は個別に切り替えられます。`diagnostics.otel.enabled` が true の場合、
トレースとメトリクスはデフォルトで有効です。ログはデフォルトで無効であり、
`diagnostics.otel.logs` が明示的に `true` の場合にのみエクスポートされます。ログのエクスポート先は
デフォルトで OTLP です。stdout に JSONL を出力するには `diagnostics.otel.logsExporter` を `stdout` に、
両方へ出力するには `both` に設定します。

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
      protocol: "http/protobuf", // grpc は OTLP エクスポートを無効にする
      serviceName: "openclaw-gateway", // 未設定の場合は OTEL_SERVICE_NAME、次に "openclaw" へフォールバック
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

| 変数                                                                                                          | 用途                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | 設定キーが未設定の場合の `diagnostics.otel.endpoint` のフォールバック。                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | 対応する `diagnostics.otel.*Endpoint` 設定キーが未設定の場合に使用される、シグナル固有のエンドポイントのフォールバック。シグナル固有の設定はシグナル固有の環境変数より優先され、シグナル固有の環境変数は共有エンドポイントより優先されます。                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | 設定キーが未設定の場合の `diagnostics.otel.serviceName` のフォールバック。デフォルトのサービス名は `openclaw` です。                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | `diagnostics.otel.protocol` が未設定の場合のワイヤープロトコルのフォールバック。エクスポートを有効にできるのは `http/protobuf` のみです。                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | 最新の GenAI 推論スパン形式を出力するには `gen_ai_latest_experimental` に設定します。これにより、スパン名は `{gen_ai.operation.name} {gen_ai.request.model}`、スパン種別は `CLIENT` となり、従来の `gen_ai.system` の代わりに `gen_ai.provider.name` が使用されます。GenAI メトリクスでは、いずれの場合も制限された低カーディナリティ属性が使用されます。 |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | 別のプリロードまたはホストプロセスがグローバル OpenTelemetry SDK をすでに登録している場合は `1` に設定します。その場合、Plugin は独自の NodeSDK ライフサイクルを省略しますが、診断リスナーの接続と `traces`/`metrics`/`logs` の設定の尊重は引き続き行います。                                                                                    |

## プライバシーとコンテンツのキャプチャ

未加工のモデル/ツールコンテンツは、デフォルトでは**エクスポートされません**。スパンには、制限された
識別子（チャンネル、プロバイダー、モデル、エラーカテゴリ、ハッシュのみのリクエスト ID、
ツールソース、ツール所有者、スキル名/ソース）が含まれますが、プロンプトテキスト、
応答テキスト、ツール入力、ツール出力、スキルファイルパス、セッションキーは一切含まれません。
スコープ付きエージェントセッションキーのように見える値（たとえば
`agent:` で始まる値）は、低カーディナリティ属性では `unknown` に置き換えられます。OTLP ログ
レコードは、デフォルトで重大度、ロガー、コード位置、信頼されたトレースコンテキスト、および
サニタイズ済み属性を保持します。未加工のログメッセージ本文は、
`diagnostics.otel.captureContent` がブール値 `true` の場合にのみエクスポートされます。個別の
`captureContent.*` サブキーでログ本文が有効になることはありません。Talk メトリクスは、
制限されたイベントメタデータ（モード、トランスポート、プロバイダー、イベント種別）のみをエクスポートし、
文字起こし、音声ペイロード、セッション ID、ターン ID、通話 ID、ルーム ID、引き継ぎトークンは
エクスポートしません。

送信モデルリクエストには、アクティブなモデル呼び出しに対する OpenClaw 所有の診断トレースコンテキストのみから
生成された W3C `traceparent` ヘッダーが含まれる場合があります。
呼び出し元が指定した既存の `traceparent` ヘッダーは置き換えられるため、Plugin や
カスタムプロバイダーオプションがサービス間トレースの祖先関係を偽装することはできません。

プロンプト、応答、ツール、またはシステムプロンプトのテキストについて、使用するコレクターと
保持ポリシーが承認されている場合にのみ、`diagnostics.otel.captureContent.*` を `true` に
設定してください。各サブキーは独立しています。

- `inputMessages` - ユーザープロンプトのコンテンツ。
- `outputMessages` - モデル応答のコンテンツ。
- `toolInputs` - ツール引数のペイロード。
- `toolOutputs` - ツール結果のペイロード。
- `systemPrompt` - 構築されたシステム/開発者プロンプト。
- `toolDefinitions` - モデルツールの名前、説明、およびスキーマ。

いずれかのサブキーが有効な場合、モデルスパンとツールスパンには、そのクラスのみを対象とする
制限および編集済みの `openclaw.content.*` 属性が追加されます。

<Note>
ブール値の `captureContent: true` は、`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`toolDefinitions`、および OTLP ログ本文をまとめて有効にしますが、`systemPrompt` は**有効にしません**。構築されたシステムプロンプトも必要な場合は、`captureContent.systemPrompt: true` を明示的に設定してください。
</Note>

`toolInputs`/`toolOutputs` のコンテンツは、組み込みエージェント
ランタイムのツール実行でキャプチャされます（完了/エラーのスパンでは
`openclaw.content.tool_input` と `gen_ai.tool.call.arguments`、
完了スパンでは `openclaw.content.tool_output` と `gen_ai.tool.call.result`）。
`openclaw.content.*` の名前は、安定した OpenClaw 属性名として維持されます。
`gen_ai.tool.call.*` のコピーは、セマンティック規約ネイティブのビューアー向けにそれらをミラーリングします。
外部ハーネスのツール呼び出し（Codex、Claude CLI）は、コンテンツペイロードなしで
`tool.execution.*` スパンを出力します。キャプチャされたコンテンツは、
信頼されたリスナー専用チャンネルを経由し、公開診断イベントバスには一切配置されません。

## サンプリングとフラッシュ

- **トレース:** `diagnostics.otel.sampleRate` はルートスパンのみに `TraceIdRatioBasedSampler`
  を設定します（`0.0` はすべて破棄、`1.0` はすべて保持）。未設定の場合は
  OpenTelemetry SDK のデフォルト（常時オン）を使用します。
- **メトリクス:** `diagnostics.otel.flushIntervalMs`（最小値
  `1000` に制限）。未設定の場合は SDK の定期エクスポートのデフォルトを使用します。
- **ログ:** OTLP ログは `logging.level`（ファイルログレベル）に従い、
  コンソール形式ではなく診断ログレコードの秘匿化パスを使用します。大量のログが発生する
  インストール環境では、ローカルサンプリングよりも OTLP コレクターでのサンプリング／フィルタリングを
  優先してください。プラットフォームがすでに stdout/stderr をログプロセッサーへ送信しており、
  OTLP ログコレクターがない場合は、`diagnostics.otel.logsExporter: "stdout"` を設定します。
  stdout の各レコードは、`ts`、`signal`、`service.name`、重大度、本文、
  秘匿化済み属性、および利用可能な場合は信頼済みトレースフィールドを含む、1 行につき 1 つの JSON オブジェクトです。
- **ファイルログの相関付け:** JSONL ファイルログでは、ログ呼び出しに有効な
  診断トレースコンテキストが含まれる場合、トップレベルに `traceId`、
  `spanId`、`parentSpanId`、`traceFlags` が含まれます。これにより、ログプロセッサーは
  ローカルログ行をエクスポート済みスパンと結合できます。
- **リクエストの相関付け:** Gateway の HTTP リクエストと WebSocket フレームは、
  内部リクエストトレーススコープを作成します。そのスコープ内のログと診断イベントは、
  デフォルトでリクエストトレースを継承します。一方、エージェント実行とモデル呼び出しの
  スパンは子として作成されるため、プロバイダーの `traceparent` ヘッダーは同じトレース上に維持されます。
- **モデル呼び出しの相関付け:** `openclaw.model.call` スパンには、デフォルトで安全なプロンプト
  コンポーネントサイズが含まれ、プロバイダーの結果が使用量を公開する場合は呼び出しごとのトークン属性も含まれます。
  `openclaw.model.usage` は、集計コスト、コンテキスト、チャンネルダッシュボード向けの
  実行レベルの集計スパンとして引き続き使用され、イベントを発行するランタイムに信頼済み
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
- `openclaw.model_call.request_bytes`（ヒストグラム、最終モデルリクエストペイロードの UTF-8 バイトサイズ。生のペイロード内容は含まない）
- `openclaw.model_call.response_bytes`（ヒストグラム、ストリーミングされたレスポンスチャンクのペイロードの UTF-8 バイトサイズ。高頻度のテキスト、思考、ツール呼び出しの差分では、増分 `delta` バイトのみをカウント。生のレスポンス内容は含まない）
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
- `openclaw.talk.event.duration_ms`（ヒストグラム、属性: `openclaw.talk.event` と同じ。Talk イベントが継続時間を報告した場合に発行）
- `openclaw.talk.audio.bytes`（ヒストグラム、属性: `openclaw.talk.event` と同じ。バイト長を報告する Talk 音声フレームイベントに対して発行）

### キューとセッション

- `openclaw.queue.lane.enqueue`（カウンター、属性: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（カウンター、属性: `openclaw.lane`）
- `openclaw.queue.depth`（ヒストグラム、属性: `openclaw.lane` または `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（ヒストグラム、属性: `openclaw.lane`）
- `openclaw.session.state`（カウンター、属性: `openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（カウンター、属性: `openclaw.state`。回復可能な古いセッション管理情報に対して発行）
- `openclaw.session.stuck_age_ms`（ヒストグラム、属性: `openclaw.state`。回復可能な古いセッション管理情報に対して発行）
- `openclaw.session.turn.created`（カウンター、属性: `openclaw.agent`、`openclaw.channel`、`openclaw.trigger`）
- `openclaw.session.recovery.requested`（カウンター、属性: `openclaw.state`、`openclaw.action`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.completed`（カウンター、属性: `openclaw.state`、`openclaw.action`、`openclaw.status`、`openclaw.active_work_kind`、`openclaw.reason`）
- `openclaw.session.recovery.age_ms`（ヒストグラム、属性: 対応する回復カウンターと同じ）
- `openclaw.run.attempt`（カウンター、属性: `openclaw.attempt`）

### セッション稼働性テレメトリ

`diagnostics.stuckSessionWarnMs` は、セッション稼働性診断における進行なし経過時間のしきい値です。
OpenClaw が応答、ツール、ステータス、ブロック、または ACP ランタイムの進行を観測している間、
`processing` セッションの経過時間はこのしきい値に向かって増加しません。
入力中状態を維持するためのキープアライブは進行としてカウントされないため、無応答のモデルや
ハーネスも検出できます。

OpenClaw は、引き続き観測可能な処理に基づいてセッションを分類します。

- `session.long_running`: アクティブな組み込み処理、モデル呼び出し、またはツール呼び出しが
  引き続き進行しています。`diagnostics.stuckSessionWarnMs` を超えて無応答のままの
  所有者付きモデル呼び出しも、`diagnostics.stuckSessionAbortMs` より前は長時間実行中として
  報告されます。これにより、低速または非ストリーミングのモデルプロバイダーが、中止を観測可能な間に
  停滞した Gateway セッションのように見えることを防ぎます。
- `session.stalled`: アクティブな処理は存在しますが、アクティブな実行から最近の進行が
  報告されていません。所有者付きモデル呼び出しは、`diagnostics.stuckSessionAbortMs`
  以降に `session.long_running` から `session.stalled` へ切り替わります。所有者のない
  古いモデル／ツールアクティビティは、無害な長時間実行処理として扱われません。
  停滞した組み込み実行は、最初は観測のみの状態を維持し、その後、
  `diagnostics.stuckSessionAbortMs` の間進行がなければ中止して排出するため、
  そのレーンの後方でキューに入っているターンを再開できます。未設定の場合、中止しきい値のデフォルトは、
  5 分以上かつ `diagnostics.stuckSessionWarnMs` の 3 倍以上という、より安全な延長ウィンドウです。
- `session.stuck`: アクティブな処理がない古いセッション管理情報、または
  所有者のない古いモデル／ツールアクティビティを伴うアイドル状態のキュー済みセッションです。
  回復ゲートを通過した直後に、影響を受けるセッションレーンを解放します。

回復処理では、構造化された `session.recovery.requested` および
`session.recovery.completed` イベントを発行します。診断上のセッション状態がアイドルとして
マークされるのは、状態変更を伴う回復結果（`aborted` または `released`）の後であり、
かつ同じ処理世代が引き続き最新である場合に限られます。

`openclaw.session.stuck` カウンター、`openclaw.session.stuck_age_ms`
ヒストグラム、および `openclaw.session.stuck` スパンを発行するのは `session.stuck` のみです。
セッションが変化しない間、繰り返される `session.stuck` 診断の頻度は段階的に抑制されるため、
ダッシュボードでは Heartbeat のティックごとではなく、持続的な増加に対してアラートを設定してください。
設定項目とデフォルトについては、
[設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics)を参照してください。

稼働性警告では、次の項目も発行されます。

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
- `openclaw.tool.loop`（カウンター、属性: `openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`、任意の `openclaw.loop.paired_tool`。反復的なツール呼び出しループを検出した場合に発行）

### Exec

- `openclaw.exec.duration_ms`（ヒストグラム、属性: `openclaw.exec.target`、`openclaw.exec.mode`、`openclaw.outcome`、`openclaw.failureKind`）

### 診断内部情報（メモリ、ペイロード、エクスポーターの正常性）

- `openclaw.payload.large`（カウンター、属性: `openclaw.payload.surface`、`openclaw.payload.action`、`openclaw.channel`、`openclaw.plugin`、`openclaw.reason`）
- `openclaw.payload.large_bytes`（ヒストグラム、属性: `openclaw.payload.large` と同じ）
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes`（ヒストグラム、属性なし。プロセスメモリのサンプル）
- `openclaw.memory.pressure`（カウンター、属性: `openclaw.memory.level`、`openclaw.memory.reason`）
- `openclaw.diagnostic.async_queue.dropped`（カウンター、属性: `openclaw.diagnostic.async_queue.drop_class`。内部診断キューのバックプレッシャーによる破棄）
- `openclaw.telemetry.exporter.events`（カウンター、属性: `openclaw.exporter`、`openclaw.signal`、`openclaw.status`、任意の `openclaw.reason`、任意の `openclaw.errorCategory`。エクスポーターのライフサイクル／障害に関する自己テレメトリ）

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
  - エラー時の `openclaw.errorCategory`、`error.type`、および任意の `openclaw.failureKind`
  - `openclaw.model_call.request_bytes`、`openclaw.model_call.response_bytes`、`openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`、`openclaw.model_call.prompt.input_messages_chars`、`openclaw.model_call.prompt.system_prompt_chars`、`openclaw.model_call.prompt.tool_definitions_count`、`openclaw.model_call.prompt.tool_definitions_chars`、`openclaw.model_call.prompt.total_chars`（安全な構成要素のサイズのみ。プロンプト本文は含まない）
  - モデル呼び出し結果にその個別呼び出しのプロバイダー使用量が含まれる場合の `openclaw.model_call.usage.*` および `gen_ai.usage.*`
  - 上流プロバイダーの結果でリクエスト ID が公開されている場合、属性 `openclaw.upstreamRequestIdHash`（上限付き、ハッシュベース）を持つスパンイベント `openclaw.provider.request`。生の ID は決してエクスポートされない
  - `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` の場合、モデル呼び出しスパンでは `openclaw.model.call` の代わりに、最新の GenAI 推論スパン名 `{gen_ai.operation.name} {gen_ai.request.model}` と `CLIENT` スパン種別を使用する。
- `openclaw.harness.run`
  - `openclaw.harness.id`、`openclaw.harness.plugin`、`openclaw.outcome`、`openclaw.provider`、`openclaw.model`、`openclaw.channel`
  - 完了時：`openclaw.harness.result_classification`、`openclaw.harness.yield_detected`、`openclaw.harness.items.started`、`openclaw.harness.items.completed`、`openclaw.harness.items.active`
  - エラー時：`openclaw.harness.phase`、`openclaw.errorCategory`、任意の `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`、`gen_ai.operation.name`（`execute_tool`）、`openclaw.toolName`、`openclaw.tool.source`、任意の `gen_ai.tool.call.id`、`openclaw.tool.owner`、`openclaw.tool.params.*`
  - エラー時の任意の `openclaw.errorCategory`/`openclaw.errorCode`。ポリシーまたはサンドボックスによって拒否された場合の `openclaw.deniedReason` および `openclaw.outcome=blocked`
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
  - `openclaw.prompt.size`、`openclaw.history.size`、`openclaw.context.tokens`、`openclaw.errorCategory`（プロンプト、履歴、応答、セッションキーの内容は含まない）
- `openclaw.tool.loop`
  - `openclaw.toolName`、`openclaw.loop.level`、`openclaw.loop.action`、`openclaw.loop.detector`、`openclaw.loop.count`、任意の `openclaw.loop.paired_tool`（ループメッセージ、パラメーター、ツール出力は含まない）
- `openclaw.memory.pressure`
  - `openclaw.memory.level`、`openclaw.memory.reason`、`openclaw.memory.rss_bytes`、`openclaw.memory.heap_used_bytes`、`openclaw.memory.heap_total_bytes`、`openclaw.memory.external_bytes`、`openclaw.memory.array_buffers_bytes`、任意の `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

コンテンツキャプチャを明示的に有効にすると、モデルおよびツールのスパンには、オプトインした特定のコンテンツクラスについて、上限が設定され秘匿化された `openclaw.content.*` 属性も含められます。

## 診断イベントカタログ

以下のイベントは、前述のメトリクスとスパンの基盤です。Plugin は、OTLP エクスポートを使用せずにこれらを直接購読することもできます。

**モデル使用量**

- `model.usage` - トークン、コスト、所要時間、コンテキスト、プロバイダー/モデル/チャンネル、セッション ID。`usage` はコストおよびテレメトリー向けのプロバイダー/ターン単位の集計です。`context.used` は現在のプロンプト/コンテキストのスナップショットであり、キャッシュ済み入力やツールループ呼び出しが関係する場合は、プロバイダーの `usage.total` より小さくなることがあります。

**メッセージフロー**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**キューとセッション**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat`（集約カウンター：Webhook/キュー/セッション）

**ハーネスのライフサイクル**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  エージェントハーネスの実行ごとのライフサイクル。`harnessId`、任意の
  `pluginId`、プロバイダー/モデル/チャンネル、および実行 ID を含みます。完了時には
  `durationMs`、`outcome`、任意の `resultClassification`、`yieldDetected`、
  および `itemLifecycle` の各カウントが追加されます。エラー時には `phase`
  （`prepare`/`start`/`send`/`resolve`/`cleanup`）、`errorCategory`、および
  任意の `cleanupFailed` が追加されます。

**実行**

- `exec.process.completed` - 端末結果、所要時間、対象、モード、終了
  コード、および失敗種別。コマンド本文と作業ディレクトリは
  含まれません。
- `exec.approval.followup_suppressed` - セッションの再バインド後に古くなった承認フォローアップを破棄。
  `approvalId`、`reason`
  （`session_rebound`）、`phase`（`direct_delivery` または `gateway_preflight`）、
  およびディスパッチャーのタイムスタンプを含みます。セッションキー、経路、コマンド本文は
  含まれません。

## エクスポーターを使用しない場合

`diagnostics-otel` を実行せずに、診断イベントを Plugin またはカスタムシンクから利用できる状態に保ちます。

```json5
{
  diagnostics: { enabled: true },
}
```

`logging.level` を上げずに対象を絞ったデバッグ出力を行うには、診断フラグを使用します。フラグでは大文字と小文字が区別されず、ワイルドカード（`telegram.*` または `*`）がサポートされます。

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

または、1 回限りの環境変数オーバーライドとして指定します。

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

フラグの出力先は標準ログファイル（`logging.file`）であり、引き続き `logging.redactSensitive` によって秘匿化されます。完全なガイド：
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

- [ログ](/ja-JP/logging) - ファイルログ、コンソール出力、CLI による追跡、および Control UI の Logs タブ
- [Gateway ログの内部構造](/ja-JP/gateway/logging) - WS ログ形式、サブシステム接頭辞、およびコンソールキャプチャ
- [診断フラグ](/ja-JP/diagnostics/flags) - 対象を絞ったデバッグログフラグ
- [診断エクスポート](/ja-JP/gateway/diagnostics) - オペレーター向けサポートバンドルツール（OTEL エクスポートとは別）
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) - `diagnostics.*` フィールドの完全なリファレンス
