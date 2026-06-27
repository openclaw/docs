---
read_when:
    - Prometheus、Grafana、VictoriaMetrics、または別のスクレイパーで OpenClaw Gateway メトリクスを収集したい
    - ダッシュボードやアラート用の Prometheus メトリクス名とラベルポリシーが必要です
    - OpenTelemetry コレクターを実行せずにメトリクスを取得したい場合
sidebarTitle: Prometheus
summary: diagnostics-prometheus Plugin を通じて OpenClaw 診断を Prometheus テキストメトリクスとして公開する
title: Prometheus メトリクス
x-i18n:
    generated_at: "2026-06-27T11:32:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw は、公式の `diagnostics-prometheus` Plugin を通じて診断メトリクスを公開できます。信頼済みの診断と、コアが発行する Gateway 安定性イベントをリッスンし、次の Prometheus テキストエンドポイントをレンダリングします。

  ```text
  GET /api/diagnostics/prometheus
  ```

  コンテンツタイプは `text/plain; version=0.0.4; charset=utf-8` で、標準の Prometheus 公開形式です。

  <Warning>
  このルートは Gateway 認証（オペレータースコープ）を使用します。公開された未認証の `/metrics` エンドポイントとして公開しないでください。他のオペレーター API で使用しているものと同じ認証パスを通じてスクレイプしてください。
  </Warning>

  トレース、ログ、OTLP プッシュ、OpenTelemetry GenAI セマンティック属性については、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。

  ## クイックスタート

  <Steps>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Plugin を有効化する">
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
  <Step title="Gateway を再起動する">
    HTTP ルートは Plugin 起動時に登録されるため、有効化後に再読み込みしてください。
  </Step>
  <Step title="保護されたルートをスクレイプする">
    オペレータークライアントが使用するものと同じ Gateway 認証を送信します。

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus を接続">
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
`diagnostics.enabled: true` が必要です。これがない場合、Plugin は引き続き HTTP ルートを登録しますが、診断イベントはエクスポーターに流れないため、レスポンスは空になります。
</Note>

## エクスポートされるメトリクス

| メトリクス                                       | 種類      | ラベル                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | カウンター | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | ヒストグラム | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | カウンター | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | ヒストグラム | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | カウンター | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | カウンター | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | ヒストグラム | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | カウンター | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | カウンター | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | カウンター | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | ヒストグラム | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | カウンター | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | カウンター | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | ヒストグラム | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | カウンター | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | カウンター | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | ヒストグラム | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | カウンター | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | カウンター | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | カウンター | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | ヒストグラム | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | カウンター | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | ヒストグラム | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | カウンター | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | カウンター | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | ヒストグラム | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | カウンター | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | ヒストグラム | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | ヒストグラム | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | ゲージ     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | ヒストグラム | `lane`                                                                                    |
| `openclaw_session_state_total`                   | カウンター | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | ゲージ     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | カウンター | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | カウンター | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | ヒストグラム | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | カウンター | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | ヒストグラム | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | カウンター | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | ゲージ     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | ヒストグラム | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | ヒストグラム | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | ヒストグラム | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | ヒストグラム | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | カウンター | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | ヒストグラム | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | ゲージ     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | ヒストグラム | なし                                                                                      |
| `openclaw_memory_pressure_total`                 | カウンター | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | カウンター | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | カウンター | なし                                                                                      |

## ラベルポリシー

<AccordionGroup>
  <Accordion title="有界で低カーディナリティのラベル">
    Prometheus ラベルは有界で低カーディナリティに保たれます。エクスポーターは、`runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、メッセージ ID、チャット ID、プロバイダーリクエスト ID などの生の診断識別子を出力しません。

    ラベル値は編集され、OpenClaw の低カーディナリティ文字ポリシーに一致する必要があります。ポリシーに合格しない値は、メトリクスに応じて `unknown`、`other`、または `none` に置き換えられます。スコープ付きエージェントセッションキーのように見えるラベルも `unknown` に置き換えられます。

  </Accordion>
  <Accordion title="系列上限とオーバーフローの計上">
    エクスポーターは、カウンター、ゲージ、ヒストグラムを合わせて、メモリ内に保持する時系列を **2048** 系列に制限します。その上限を超える新しい系列は破棄され、そのたびに `openclaw_prometheus_series_dropped_total` が 1 増加します。

    このカウンターは、上流の属性から高カーディナリティ値が漏れていることを示す強いシグナルとして監視してください。エクスポーターが上限を自動的に引き上げることはありません。値が増加する場合は、上限を無効にするのではなく、発生源を修正してください。

  </Accordion>
  <Accordion title="Prometheus 出力に決して現れないもの">
    - プロンプトテキスト、応答テキスト、ツール入力、ツール出力、システムプロンプト
    - Talk の文字起こし、音声ペイロード、通話 ID、ルーム ID、ハンドオフトークン、ターン ID、生のセッション ID
    - 生のプロバイダーリクエスト ID（該当する場合はスパン上の境界づけられたハッシュのみ。メトリクスには決して含めない）
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

# Skill usage, split by bounded source
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
プロバイダー横断のダッシュボードには `gen_ai_client_token_usage` を優先してください。これは OpenTelemetry GenAI セマンティック規約に従っており、OpenClaw 以外の GenAI サービスのメトリクスと一貫しています。
</Tip>

## Prometheus と OpenTelemetry エクスポートの選び方

OpenClaw は両方のサーフェスを独立してサポートします。どちらか一方、両方、またはどちらも使わない構成で実行できます。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **プル**モデル: Prometheus が `/api/diagnostics/prometheus` をスクレイプします。
    - 外部コレクターは不要です。
    - 通常の Gateway 認証で認証されます。
    - サーフェスはメトリクスのみです（トレースやログはありません）。
    - すでに Prometheus + Grafana に標準化されているスタックに最適です。

  </Tab>
  <Tab title="diagnostics-otel">
    - **プッシュ**モデル: OpenClaw が OTLP/HTTP をコレクターまたは OTLP 互換バックエンドへ送信します。
    - サーフェスにはメトリクス、トレース、ログが含まれます。
    - 両方が必要な場合は、OpenTelemetry Collector（`prometheus` または `prometheusremotewrite` エクスポーター）を通じて Prometheus にブリッジします。
    - 完全なカタログについては [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) を参照してください。

  </Tab>
</Tabs>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="空のレスポンスボディ">
    - 設定で `diagnostics.enabled: true` を確認します。
    - Plugin が有効化され、`openclaw plugins list --enabled` で読み込まれていることを確認します。
    - いくらかトラフィックを生成します。カウンターとヒストグラムは、少なくとも 1 件のイベント後にのみ行を出力します。

  </Accordion>
  <Accordion title="401 / 未認可">
    このエンドポイントには Gateway オペレータースコープ（`auth: "gateway"` と `gatewayRuntimeScopeSurface: "trusted-operator"`）が必要です。他の Gateway オペレータールートで Prometheus が使うものと同じトークンまたはパスワードを使用してください。公開の未認証モードはありません。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` が増加している">
    新しい属性が **2048** シリーズの上限を超えています。最近のメトリクスで想定外にカーディナリティの高いラベルを調べ、発生元で修正してください。エクスポーターはラベルを黙って書き換える代わりに、意図的に新しいシリーズをドロップします。
  </Accordion>
  <Accordion title="再起動後に Prometheus が古いシリーズを表示する">
    Plugin は状態をメモリ内のみに保持します。Gateway の再起動後、カウンターはゼロにリセットされ、ゲージは次に報告された値から再開します。リセットをきれいに扱うには PromQL の `rate()` と `increase()` を使用してください。
  </Accordion>
</AccordionGroup>

## 関連

- [診断エクスポート](/ja-JP/gateway/diagnostics) — サポートバンドル用のローカル診断 zip
- [ヘルスと readiness](/ja-JP/gateway/health) — `/healthz` と `/readyz` プローブ
- [ロギング](/ja-JP/logging) — ファイルベースのロギング
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — トレース、メトリクス、ログ用の OTLP プッシュ
