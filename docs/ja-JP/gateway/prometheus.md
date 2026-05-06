---
read_when:
    - Prometheus、Grafana、VictoriaMetrics、または別のスクレイパーで OpenClaw Gateway メトリクスを収集したい場合
    - ダッシュボードまたはアラート用の Prometheus メトリクス名とラベルポリシーが必要な場合
    - OpenTelemetry コレクターを実行せずにメトリクスが必要な場合
sidebarTitle: Prometheus
summary: diagnostics-prometheus プラグインを通じて、OpenClaw の診断情報を Prometheus テキストメトリクスとして公開する
title: Prometheus メトリクス
x-i18n:
    generated_at: "2026-05-06T17:56:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 864e2a343266d84baaaaca9d8e494359198a3b43e8663ec8dcfcd4e2e4c6c004
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw は公式の `diagnostics-prometheus` Plugin を通じて診断メトリクスを公開できます。信頼済みの内部診断をリッスンし、Prometheus テキストエンドポイントを次でレンダリングします。

```text
GET /api/diagnostics/prometheus
```

Content type は標準の Prometheus exposition format である `text/plain; version=0.0.4; charset=utf-8` です。

<Warning>
このルートは Gateway 認証（operator スコープ）を使用します。公開の未認証 `/metrics` エンドポイントとして公開しないでください。他の operator API で使うものと同じ認証パスを通じてスクレイプしてください。
</Warning>

トレース、ログ、OTLP push、OpenTelemetry GenAI semantic attributes については、[OpenTelemetry export](/ja-JP/gateway/opentelemetry) を参照してください。

## クイックスタート

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Enable the plugin">
    <Tabs>
      <Tab title="Config">
        ```json5
        {
          plugins: {
            allow: ["diagnostics-prometheus"],
            entries: {
              "diagnostics-prometheus": { enabled: true },
            },
          },
          diagnostics: {
            enabled: true,
          },
        }
        ```
      </Tab>
      <Tab title="CLI">
        ```bash
        openclaw plugins enable diagnostics-prometheus
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Restart the Gateway">
    HTTP ルートは Plugin 起動時に登録されるため、有効化後に再読み込みしてください。
  </Step>
  <Step title="Scrape the protected route">
    operator クライアントが使うものと同じ Gateway 認証を送信します。

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Wire Prometheus">
    ```yaml
    # prometheus.yml
    scrape_configs:
      - job_name: openclaw
        scrape_interval: 30s
        metrics_path: /api/diagnostics/prometheus
        authorization:
          credentials_file: /etc/prometheus/openclaw-gateway-token
        static_configs:
          - targets: ["openclaw-gateway:18789"]
    ```
  </Step>
</Steps>

<Note>
`diagnostics.enabled: true` が必要です。これがない場合でも Plugin は HTTP ルートを登録しますが、診断イベントはエクスポーターに流れないため、レスポンスは空になります。
</Note>

## エクスポートされるメトリクス

| メトリクス                                    | 型        | ラベル                                                                                    |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | カウンター | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | ヒストグラム | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | カウンター | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | ヒストグラム | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | カウンター | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | ヒストグラム | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | カウンター | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | カウンター | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | ヒストグラム | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | カウンター | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | ヒストグラム | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | カウンター | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | ヒストグラム | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`     | カウンター | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`             | カウンター | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | ヒストグラム | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                   | カウンター | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`        | ヒストグラム | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                   | ヒストグラム | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                    | ゲージ    | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | ヒストグラム | `lane`                                                                                    |
| `openclaw_session_state_total`                | カウンター | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | ゲージ    | `state`                                                                                   |
| `openclaw_session_recovery_total`             | カウンター | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`       | ヒストグラム | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_memory_bytes`                       | ゲージ    | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | ヒストグラム | なし                                                                                      |
| `openclaw_memory_pressure_total`              | カウンター | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | カウンター | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | カウンター | なし                                                                                      |

## ラベルポリシー

<AccordionGroup>
  <Accordion title="Bounded, low-cardinality labels">
    Prometheus ラベルは、境界付きで低カーディナリティに保たれます。エクスポーターは `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、メッセージ ID、チャット ID、プロバイダーリクエスト ID などの生の診断識別子を出力しません。

    ラベル値は秘匿化され、OpenClaw の低カーディナリティ文字ポリシーに一致する必要があります。ポリシーに合わない値は、メトリクスに応じて `unknown`、`other`、または `none` に置き換えられます。

  </Accordion>
  <Accordion title="時系列の上限とオーバーフロー計上">
    エクスポーターは、カウンター、ゲージ、ヒストグラムを合わせてメモリ内に保持する時系列を **2048** 系列に制限します。その上限を超える新しい系列は破棄され、そのたびに `openclaw_prometheus_series_dropped_total` が 1 増加します。

    このカウンターは、上流の属性が高カーディナリティ値を漏らしていることを示す強いシグナルとして監視してください。エクスポーターが上限を自動的に引き上げることはありません。増加している場合は、上限を無効化するのではなく原因を修正してください。

  </Accordion>
  <Accordion title="Prometheus 出力に決して現れないもの">
    - プロンプトテキスト、応答テキスト、ツール入力、ツール出力、システムプロンプト
    - Talk の文字起こし、音声ペイロード、通話 ID、ルーム ID、ハンドオフトークン、ターン ID、生のセッション ID
    - 生のプロバイダーリクエスト ID（該当する場合は、境界付きハッシュのみがスパンに含まれます。メトリクスには決して含まれません）
    - セッションキーとセッション ID
    - ホスト名、ファイルパス、シークレット値

  </Accordion>
</AccordionGroup>

## PromQL レシピ

```promql
# Tokens per minute, split by provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Spend (USD) over the last hour, by model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95th percentile model run duration
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# Queue wait time SLO (95p under 2s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
プロバイダー横断のダッシュボードには `gen_ai_client_token_usage` を優先してください。これは OpenTelemetry GenAI セマンティック規約に従っており、OpenClaw 以外の GenAI サービスからのメトリクスと一貫しています。
</Tip>

## Prometheus エクスポートと OpenTelemetry エクスポートの選択

OpenClaw は両方のサーフェスを独立してサポートしています。どちらか一方、両方、またはどちらも実行しない構成が可能です。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **プル**モデル: Prometheus が `/api/diagnostics/prometheus` をスクレイプします。
    - 外部コレクターは不要です。
    - 通常の Gateway 認証を通じて認証されます。
    - サーフェスはメトリクスのみです（トレースやログはありません）。
    - Prometheus + Grafana で既に標準化されているスタックに最適です。

  </Tab>
  <Tab title="diagnostics-otel">
    - **プッシュ**モデル: OpenClaw が OTLP/HTTP をコレクターまたは OTLP 互換バックエンドへ送信します。
    - サーフェスにはメトリクス、トレース、ログが含まれます。
    - 両方が必要な場合は、OpenTelemetry Collector（`prometheus` または `prometheusremotewrite` エクスポーター）を通じて Prometheus にブリッジします。
    - 完全なカタログについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。

  </Tab>
</Tabs>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="空のレスポンス本文">
    - config で `diagnostics.enabled: true` を確認します。
    - Plugin が有効化され、`openclaw plugins list --enabled` で読み込まれていることを確認します。
    - いくらかのトラフィックを生成します。カウンターとヒストグラムは、少なくとも 1 つのイベントが発生した後にだけ行を出力します。

  </Accordion>
  <Accordion title="401 / 未認可">
    エンドポイントには Gateway オペレータースコープ（`auth: "gateway"` と `gatewayRuntimeScopeSurface: "trusted-operator"`）が必要です。他の Gateway オペレータールートで Prometheus が使用しているものと同じトークンまたはパスワードを使用してください。公開の未認証モードはありません。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` が増加している">
    新しい属性が **2048** 系列の上限を超えています。最近のメトリクスを調べ、予期せず高カーディナリティになっているラベルを見つけ、原因を修正してください。エクスポーターは、ラベルを黙って書き換えるのではなく、意図的に新しい系列を破棄します。
  </Accordion>
  <Accordion title="再起動後に Prometheus が古い系列を表示する">
    Plugin は状態をメモリ内にのみ保持します。Gateway の再起動後、カウンターはゼロにリセットされ、ゲージは次に報告された値から再開します。リセットを適切に扱うには、PromQL の `rate()` と `increase()` を使用してください。
  </Accordion>
</AccordionGroup>

## 関連

- [診断エクスポート](/ja-JP/gateway/diagnostics) — サポートバンドル用のローカル診断 zip
- [ヘルスと準備状態](/ja-JP/gateway/health) — `/healthz` と `/readyz` プローブ
- [ロギング](/ja-JP/logging) — ファイルベースのロギング
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — トレース、メトリクス、ログ向けの OTLP プッシュ
