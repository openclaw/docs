---
read_when:
    - Prometheus、Grafana、VictoriaMetrics、または別のスクレイパーに OpenClaw Gateway のメトリクスを収集させたい場合
    - ダッシュボードまたはアラート用に Prometheus のメトリクス名とラベルポリシーが必要です
    - OpenTelemetry コレクターを実行せずにメトリクスを取得したい場合
sidebarTitle: Prometheus
summary: diagnostics-prometheus Plugin を通じて、OpenClaw 診断を Prometheus テキストメトリクスとして公開する
title: Prometheus メトリクス
x-i18n:
    generated_at: "2026-04-30T05:15:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClawは、同梱の`diagnostics-prometheus` pluginを通じて診断メトリクスを公開できます。信頼された内部診断をリッスンし、Prometheusテキストエンドポイントを次の場所にレンダリングします。

```text
GET /api/diagnostics/prometheus
```

コンテンツタイプは`text/plain; version=0.0.4; charset=utf-8`で、標準のPrometheus公開形式です。

<Warning>
このルートはGateway認証（operatorスコープ）を使用します。公開された未認証の`/metrics`エンドポイントとして公開しないでください。他のoperator APIに使っているものと同じ認証経路でスクレイプしてください。
</Warning>

トレース、ログ、OTLPプッシュ、OpenTelemetry GenAIセマンティック属性については、[OpenTelemetryエクスポート](/ja-JP/gateway/opentelemetry)を参照してください。

## クイックスタート

<Steps>
  <Step title="pluginを有効にする">
    <Tabs>
      <Tab title="設定">
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
  <Step title="Gatewayを再起動する">
    HTTPルートはpluginの起動時に登録されるため、有効化後に再読み込みしてください。
  </Step>
  <Step title="保護されたルートをスクレイプする">
    operatorクライアントが使用するものと同じgateway認証を送信します。

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheusを接続する">
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
`diagnostics.enabled: true`が必要です。これがない場合、pluginはHTTPルートを登録しますが、診断イベントがエクスポーターに流れ込まないため、レスポンスは空になります。
</Note>

## エクスポートされるメトリクス

| メトリクス                                    | 型        | ラベル                                                                                    |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | counter   | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histogram | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | なし                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | なし                                                                                      |

## ラベルポリシー

<AccordionGroup>
  <Accordion title="境界付けられた低カーディナリティのラベル">
    Prometheusラベルは、境界付けられた低カーディナリティのまま維持されます。エクスポーターは、`runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、メッセージID、チャットID、プロバイダーリクエストIDなどの生の診断識別子を出力しません。

    ラベル値は編集され、OpenClawの低カーディナリティ文字ポリシーに一致する必要があります。ポリシーに失敗した値は、メトリクスに応じて`unknown`、`other`、または`none`に置き換えられます。

  </Accordion>
  <Accordion title="系列上限とオーバーフロー計上">
    エクスポーターは、counter、gauge、histogramを合計して、メモリ内に保持する時系列を**2048**系列に制限します。その上限を超える新しい系列は破棄され、そのたびに`openclaw_prometheus_series_dropped_total`が1増加します。

    このcounterを、上流の属性が高カーディナリティ値を漏らしていることを示す強いシグナルとして監視してください。エクスポーターは上限を自動的に引き上げることはありません。増加している場合は、上限を無効にするのではなく、ソースを修正してください。

  </Accordion>
  <Accordion title="Prometheus出力に決して現れないもの">
    - プロンプトテキスト、レスポンステキスト、ツール入力、ツール出力、システムプロンプト
    - 生のプロバイダーリクエストID（該当する場合、境界付けられたハッシュはspan上にのみ存在し、メトリクスには決して存在しません）
    - セッションキーとセッションID
    - ホスト名、ファイルパス、シークレット値

  </Accordion>
</AccordionGroup>

## PromQLレシピ

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
プロバイダー横断のダッシュボードでは、`gen_ai_client_token_usage`を優先してください。これはOpenTelemetry GenAIセマンティック規約に従っており、OpenClaw以外のGenAIサービスのメトリクスと一貫性があります。
</Tip>

## PrometheusエクスポートとOpenTelemetryエクスポートの選択

OpenClawは両方のサーフェスを独立してサポートします。どちらか一方、両方、またはどちらも実行できます。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **プル**モデル: Prometheusが`/api/diagnostics/prometheus`をスクレイプします。
    - 外部コレクターは不要です。
    - 通常のGateway認証を通じて認証されます。
    - サーフェスはメトリクスのみです（トレースやログはありません）。
    - すでにPrometheus + Grafanaで標準化されているスタックに最適です。

  </Tab>
  <Tab title="diagnostics-otel">
    - **プッシュ**モデル: OpenClawがOTLP/HTTPをコレクターまたはOTLP互換バックエンドに送信します。
    - サーフェスにはメトリクス、トレース、ログが含まれます。
    - 両方が必要な場合は、OpenTelemetry Collector（`prometheus`または`prometheusremotewrite`エクスポーター）を通じてPrometheusに橋渡しします。
    - 完全なカタログについては、[OpenTelemetryエクスポート](/ja-JP/gateway/opentelemetry)を参照してください。

  </Tab>
</Tabs>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="レスポンス本文が空">
    - 設定で`diagnostics.enabled: true`を確認してください。
    - `openclaw plugins list --enabled`でpluginが有効化され、ロードされていることを確認してください。
    - いくらかトラフィックを生成してください。counterとhistogramは、少なくとも1つのイベントが発生した後にのみ行を出力します。

  </Accordion>
  <Accordion title="401 / 未認可">
    このエンドポイントにはGateway operatorスコープ（`auth: "gateway"`と`gatewayRuntimeScopeSurface: "trusted-operator"`）が必要です。他のGateway operatorルートにPrometheusが使うものと同じトークンまたはパスワードを使用してください。公開された未認証モードはありません。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total`が増加している">
    新しい属性が**2048**系列の上限を超えています。最近のメトリクスで、予想外に高カーディナリティのラベルを調べ、ソースで修正してください。エクスポーターは、ラベルを暗黙に書き換えるのではなく、意図的に新しい系列を破棄します。
  </Accordion>
  <Accordion title="再起動後にPrometheusが古い系列を表示する">
    pluginは状態をメモリ内にのみ保持します。Gatewayの再起動後、counterはゼロにリセットされ、gaugeは次に報告された値から再開します。リセットを適切に扱うには、PromQLの`rate()`と`increase()`を使用してください。
  </Accordion>
</AccordionGroup>

## 関連

- [診断エクスポート](/ja-JP/gateway/diagnostics) — サポートバンドル用のローカル診断zip
- [ヘルスと準備完了](/ja-JP/gateway/health) — `/healthz`と`/readyz`プローブ
- [ロギング](/ja-JP/logging) — ファイルベースのロギング
- [OpenTelemetryエクスポート](/ja-JP/gateway/opentelemetry) — トレース、メトリクス、ログ用のOTLPプッシュ
