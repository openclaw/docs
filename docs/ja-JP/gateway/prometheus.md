---
read_when:
    - Prometheus、Grafana、VictoriaMetrics、または別のスクレイパーでOpenClaw Gatewayメトリクスを収集したい
    - ダッシュボードまたはアラート用の Prometheus メトリクス名とラベルポリシーが必要です
    - OpenTelemetry コレクターを実行せずにメトリクスを取得したい
sidebarTitle: Prometheus
summary: diagnostics-prometheus Plugin を通じて OpenClaw 診断を Prometheus テキストメトリクスとして公開する
title: Prometheus メトリクス
x-i18n:
    generated_at: "2026-07-05T11:23:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw は、公式の
  `diagnostics-prometheus` Plugin を通じて診断メトリクスを公開できます。信頼済み診断に加えて、内部でタグ付けされたディスパッチャー所有の診断イベント（キュー、メモリ、セッションリカバリ信号）をリッスンし、次の場所で Prometheus テキストエンドポイントをレンダリングします。

  ```text
  GET /api/diagnostics/prometheus
  ```

  コンテンツタイプは `text/plain; version=0.0.4; charset=utf-8` で、標準の
  Prometheus 公開形式です。

  <Warning>
  このルートは Gateway 認証（オペレータースコープ、信頼済みオペレーターサーフェス）を使用します。公開の未認証 `/metrics` エンドポイントとして公開しないでください。他のオペレーター API で使用しているものと同じ認証パスを通じてスクレイプしてください。
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
    オペレータークライアントが使用するものと同じ Gateway 認証を送信します:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus を接続する">
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
`diagnostics.enabled` のデフォルトは `true` です。厳しく制約された環境でのみ `false` に設定してください。`false` の場合でも、Plugin は HTTP ルートを登録しますが、診断イベントは exporter に流れないため、レスポンスは空になります。
</Note>

## エクスポートされるメトリクス

| メトリクス                                       | 種類      | ラベル                                                                                    |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | counter   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | histogram | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | counter   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | counter   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | counter   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | counter   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | counter   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | counter   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | gauge     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | counter   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | counter   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | counter   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | gauge     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | counter   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | なし                                                                                      |
| `openclaw_memory_pressure_total`                 | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | counter   | なし                                                                                      |
| `openclaw_diagnostic_async_queue_dropped_total`  | counter   | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | gauge     | なし                                                                                      |

## ラベルポリシー

<AccordionGroup>
  <Accordion title="境界があり低カーディナリティのラベル">
    Prometheus のラベルは境界があり、低カーディナリティに保たれます。exporter は `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、メッセージ ID、チャット ID、プロバイダーリクエスト ID などの生の診断識別子を出力しません。

    ラベル値は秘匿化され、OpenClaw の低カーディナリティ文字ポリシーに一致する必要があります。ポリシーに失敗した値は、メトリクスに応じて `unknown`、`other`、または `none` に置き換えられます。スコープ付きエージェントセッションキーのように見えるラベルも `unknown` に置き換えられます。

  </Accordion>
  <Accordion title="シリーズ上限とオーバーフロー計上">
    エクスポーターは、カウンター、ゲージ、ヒストグラムを合わせて、メモリ内に保持する時系列を **2048** シリーズに制限します。その上限を超える新しいシリーズは破棄され、そのたびに `openclaw_prometheus_series_dropped_total` が 1 増加します。

    このカウンターは、上流の属性が高カーディナリティ値を漏らしていることを示す明確なシグナルとして監視してください。エクスポーターが上限を自動的に引き上げることはありません。増加する場合は、上限を無効にするのではなく発生元を修正してください。

  </Accordion>
  <Accordion title="Prometheus 出力に決して現れないもの">
    - プロンプト本文、応答本文、ツール入力、ツール出力、システムプロンプト
    - Talk の文字起こし、音声ペイロード、通話 ID、ルーム ID、ハンドオフトークン、ターン ID、生のセッション ID
    - 生のプロバイダーリクエスト ID（該当する場合はスパン上の境界付きハッシュのみ。メトリクス上には決して出ません）
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
クロスプロバイダーダッシュボードには `gen_ai_client_token_usage` を推奨します。これは OpenTelemetry GenAI セマンティック規約に従い、OpenClaw 以外の GenAI サービスのメトリクスとも一貫しています。
</Tip>

## Prometheus エクスポートと OpenTelemetry エクスポートの選択

OpenClaw は両方のサーフェスを独立してサポートします。どちらか一方、両方、またはどちらも使わない構成で実行できます。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **プル**モデル: Prometheus が `/api/diagnostics/prometheus` をスクレイプします。
    - 外部コレクターは不要です。
    - 通常の Gateway 認証を通じて認証されます。
    - サーフェスはメトリクスのみです（トレースやログはありません）。
    - すでに Prometheus + Grafana で標準化されているスタックに最適です。

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
  <Accordion title="レスポンスボディが空">
    - config で `diagnostics.enabled` が `false` に設定されていないことを確認してください（デフォルトは `true` です）。
    - Plugin が有効化され、`openclaw plugins list --enabled` で読み込まれていることを確認してください。
    - いくらかのトラフィックを生成してください。カウンターとヒストグラムは、少なくとも 1 件のイベントが発生した後にのみ行を出力します。

  </Accordion>
  <Accordion title="401 / 未認可">
    エンドポイントには Gateway オペレータースコープ（`gatewayRuntimeScopeSurface: "trusted-operator"` を伴う `auth: "gateway"`）が必要です。他の Gateway オペレータールートで Prometheus が使用するものと同じトークンまたはパスワードを使用してください。公開の未認証モードはありません。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` が増加している">
    新しい属性が **2048** シリーズの上限を超えています。最近のメトリクスを調べて、想定外に高カーディナリティなラベルを見つけ、発生元で修正してください。エクスポーターは、ラベルを黙って書き換えるのではなく、意図的に新しいシリーズを破棄します。
  </Accordion>
  <Accordion title="再起動後に Prometheus が古いシリーズを表示する">
    Plugin はメモリ内にのみ状態を保持します。Gateway の再起動後、カウンターはゼロにリセットされ、ゲージは次に報告された値から再開します。リセットをきれいに扱うには、PromQL の `rate()` と `increase()` を使用してください。
  </Accordion>
</AccordionGroup>

## 関連

- [診断エクスポート](/ja-JP/gateway/diagnostics) — サポートバンドル用のローカル診断 zip
- [ヘルスと準備状態](/ja-JP/gateway/health) — `/healthz` と `/readyz` プローブ
- [ログ記録](/ja-JP/logging) — ファイルベースのログ記録
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — トレース、メトリクス、ログ向けの OTLP プッシュ
