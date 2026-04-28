---
read_when:
    - Prometheus、Grafana、VictoriaMetrics、または他の scraper で OpenClaw Gateway メトリクスを収集したい場合
    - ダッシュボードやアラートのために、Prometheus メトリクス名とラベルポリシーが必要な場合
    - OpenTelemetry コレクターを実行せずにメトリクスを取得したい場合
sidebarTitle: Prometheus
summary: diagnostics-prometheus Plugin を通じて OpenClaw の診断情報を Prometheus テキストメトリクスとして公開する
title: Prometheus メトリクス
x-i18n:
    generated_at: "2026-04-26T11:30:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw は、バンドル済みの `diagnostics-prometheus` Plugin を通じて診断メトリクスを公開できます。この Plugin は信頼された内部診断を監視し、次の場所に Prometheus テキストエンドポイントを出力します。

```text
GET /api/diagnostics/prometheus
```

Content type は `text/plain; version=0.0.4; charset=utf-8` で、標準の Prometheus exposition format です。

<Warning>
このルートは Gateway 認証（operator スコープ）を使用します。公開の未認証 `/metrics` エンドポイントとして公開しないでください。他の operator API と同じ認証経路を使って scrape してください。
</Warning>

トレース、ログ、OTLP push、OpenTelemetry GenAI セマンティック属性については [OpenTelemetry export](/ja-JP/gateway/opentelemetry) を参照してください。

## クイックスタート

<Steps>
  <Step title="Plugin を有効化する">
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
  <Step title="Gateway を再起動する">
    HTTP ルートは Plugin 起動時に登録されるため、有効化後に reload してください。
  </Step>
  <Step title="保護されたルートを scrape する">
    operator クライアントで使っているのと同じ Gateway 認証を送信します。

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
`diagnostics.enabled: true` が必要です。これがないと、Plugin は HTTP ルート自体は登録しますが、エクスポーターに診断イベントが流れないため、レスポンスは空になります。
</Note>

## エクスポートされるメトリクス

| メトリクス                                     | 種別      | ラベル                                                                                    |
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
  <Accordion title="制限された低カーディナリティのラベル">
    Prometheus ラベルは、制限され低カーディナリティに保たれます。エクスポーターは `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、message ID、chat ID、provider request ID などの生の診断識別子を出力しません。

    ラベル値は redaction され、OpenClaw の低カーディナリティ文字ポリシーに一致する必要があります。ポリシーに合わない値は、メトリクスに応じて `unknown`、`other`、`none` に置き換えられます。

  </Accordion>
  <Accordion title="シリーズ上限とオーバーフロー計上">
    エクスポーターは、保持するインメモリ時系列を counter、gauge、histogram の合計で **2048** シリーズに制限します。その上限を超える新しいシリーズは破棄され、`openclaw_prometheus_series_dropped_total` が毎回 1 ずつ増加します。

    これは、上流の属性が高カーディナリティ値を漏らしていることを示す強いシグナルとして監視してください。エクスポーターが自動的に上限を引き上げることはありません。増加している場合は、上限を無効化するのではなくソースを修正してください。

  </Accordion>
  <Accordion title="Prometheus 出力に絶対に現れないもの">
    - プロンプトテキスト、レスポンステキスト、ツール入力、ツール出力、システムプロンプト
    - 生の provider request ID（span 上では適用可能な場合に限り制限付きハッシュのみ。メトリクスには決して出ません）
    - セッションキーとセッション ID
    - ホスト名、ファイルパス、シークレット値

  </Accordion>
</AccordionGroup>

## PromQL レシピ

```promql
# 1 分あたりのトークン数、provider ごと
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# 直近 1 時間のコスト（USD）、model ごと
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# model 実行時間の 95 パーセンタイル
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# キュー待ち時間 SLO（95p が 2 秒未満）
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# 破棄された Prometheus シリーズ（カーディナリティ警報）
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
provider 横断のダッシュボードには `gen_ai_client_token_usage` を優先してください。これは OpenTelemetry GenAI セマンティック規約に従っており、OpenClaw 以外の GenAI サービスのメトリクスとも整合します。
</Tip>

## Prometheus と OpenTelemetry export のどちらを選ぶか

OpenClaw は両方のサーフェスを独立してサポートします。どちらか一方、両方、またはどちらも使わないことができます。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull** モデル: Prometheus が `/api/diagnostics/prometheus` を scrape します。
    - 外部コレクター不要。
    - 通常の Gateway 認証を通じて認証されます。
    - サーフェスはメトリクスのみです（トレースやログはなし）。
    - すでに Prometheus + Grafana を標準化しているスタックに最適です。

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push** モデル: OpenClaw が OTLP/HTTP をコレクターまたは OTLP 互換バックエンドに送信します。
    - サーフェスにはメトリクス、トレース、ログが含まれます。
    - 両方必要な場合は、OpenTelemetry Collector（`prometheus` または `prometheusremotewrite` エクスポーター）を通じて Prometheus にブリッジできます。
    - 完全なカタログについては [OpenTelemetry export](/ja-JP/gateway/opentelemetry) を参照してください。

  </Tab>
</Tabs>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="レスポンスボディが空">
    - config で `diagnostics.enabled: true` を確認してください。
    - `openclaw plugins list --enabled` で Plugin が有効かつロードされていることを確認してください。
    - 何らかのトラフィックを発生させてください。counter と histogram は少なくとも 1 件のイベント後にしか行を出力しません。

  </Accordion>
  <Accordion title="401 / unauthorized">
    このエンドポイントには Gateway operator スコープ（`auth: "gateway"` と `gatewayRuntimeScopeSurface: "trusted-operator"`）が必要です。他の Gateway operator ルートで Prometheus が使うのと同じ token または password を使ってください。公開の未認証モードはありません。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` が増え続ける">
    新しい属性が **2048** シリーズ上限を超えています。最近のメトリクスを調べて、予想外に高カーディナリティなラベルを見つけ、ソース側で修正してください。エクスポーターはラベルを書き換えてごまかすのではなく、意図的に新しいシリーズを破棄します。
  </Accordion>
  <Accordion title="Prometheus に再起動後の古いシリーズが残る">
    Plugin は状態をメモリ内にのみ保持します。Gateway 再起動後、counter はゼロに戻り、gauge は次に報告された値から再開します。リセットをきれいに扱うには PromQL の `rate()` と `increase()` を使ってください。
  </Accordion>
</AccordionGroup>

## 関連

- [診断エクスポート](/ja-JP/gateway/diagnostics) — サポートバンドル用のローカル診断 zip
- [ヘルスと readiness](/ja-JP/gateway/health) — `/healthz` と `/readyz` プローブ
- [ロギング](/ja-JP/logging) — ファイルベースのロギング
- [OpenTelemetry export](/ja-JP/gateway/opentelemetry) — トレース、メトリクス、ログ用の OTLP push
