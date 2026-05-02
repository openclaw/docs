---
read_when:
    - Prometheus、Grafana、VictoriaMetrics、または別のスクレイパーで OpenClaw Gateway のメトリクスを収集したい場合
    - ダッシュボードまたはアラート用の Prometheus メトリック名とラベルポリシーが必要な場合
    - OpenTelemetry コレクターを実行せずにメトリクスを取得したい場合
sidebarTitle: Prometheus
summary: diagnostics-prometheus プラグインを通じて、OpenClaw の診断情報を Prometheus テキストメトリクスとして公開する
title: Prometheus メトリクス
x-i18n:
    generated_at: "2026-05-02T20:48:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49df17348c5b63c4b5f3c05f3378d43764e5de985135ad30c1e74ef607e0dd37
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw は公式の `diagnostics-prometheus` Plugin を通じて診断メトリクスを公開できます。信頼された内部診断をリッスンし、Prometheus テキストエンドポイントを次の場所でレンダリングします。

```text
GET /api/diagnostics/prometheus
```

Content type は標準の Prometheus exposition 形式である `text/plain; version=0.0.4; charset=utf-8` です。

<Warning>
このルートは Gateway 認証（operator スコープ）を使用します。公開された未認証の `/metrics` エンドポイントとして公開しないでください。他の operator API に使用しているものと同じ認証パス経由でスクレイプしてください。
</Warning>

トレース、ログ、OTLP プッシュ、OpenTelemetry GenAI セマンティック属性については、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。

## クイックスタート

<Steps>
  <Step title="Plugin をインストール">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Plugin を有効化">
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
  <Step title="Gateway を再起動">
    HTTP ルートは Plugin の起動時に登録されるため、有効化後にリロードしてください。
  </Step>
  <Step title="保護されたルートをスクレイプ">
    operator クライアントが使用しているものと同じ gateway 認証を送信します。

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
`diagnostics.enabled: true` が必要です。これがない場合、Plugin は HTTP ルートを登録しますが、エクスポーターに診断イベントが流れ込まないため、レスポンスは空になります。
</Note>

## エクスポートされるメトリクス

| メトリクス                                    | 種類      | ラベル                                                                                    |
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
| `openclaw_message_delivery_total`             | カウンター | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | ヒストグラム | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | ゲージ     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | ヒストグラム | `lane`                                                                                    |
| `openclaw_session_state_total`                | カウンター | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | ゲージ     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | ゲージ     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | ヒストグラム | なし                                                                                      |
| `openclaw_memory_pressure_total`              | カウンター | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | カウンター | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | カウンター | なし                                                                                      |

## ラベルポリシー

<AccordionGroup>
  <Accordion title="制限された低カーディナリティのラベル">
    Prometheus ラベルは制限され、低カーディナリティに保たれます。エクスポーターは、`runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、メッセージ ID、チャット ID、プロバイダーリクエスト ID などの生の診断識別子を出力しません。

    ラベル値はリダクトされ、OpenClaw の低カーディナリティ文字ポリシーに一致している必要があります。ポリシーに失敗した値は、メトリクスに応じて `unknown`、`other`、または `none` に置き換えられます。

  </Accordion>
  <Accordion title="系列上限とオーバーフロー集計">
    エクスポーターは、カウンター、ゲージ、ヒストグラムを合わせて、メモリ内に保持する時系列を **2048** 系列に制限します。この上限を超える新しい系列は破棄され、そのたびに `openclaw_prometheus_series_dropped_total` が 1 増加します。

    このカウンターは、上流の属性が高カーディナリティ値を漏らしていることを示す強いシグナルとして監視してください。エクスポーターが上限を自動的に引き上げることはありません。増加する場合は、上限を無効化するのではなく、発生元を修正してください。

  </Accordion>
  <Accordion title="Prometheus 出力に決して現れないもの">
    - プロンプトテキスト、レスポンステキスト、ツール入力、ツール出力、システムプロンプト
    - 生のプロバイダーリクエスト ID（該当する場合は span 上の制限されたハッシュのみ。メトリクス上には出ません）
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
プロバイダー横断ダッシュボードには `gen_ai_client_token_usage` を推奨します。これは OpenTelemetry GenAI セマンティック規約に従っており、OpenClaw 以外の GenAI サービスのメトリクスと一貫しています。
</Tip>

## Prometheus と OpenTelemetry エクスポートの選択

OpenClaw は両方のサーフェスを独立してサポートします。どちらか一方、両方、またはどちらも使わない構成にできます。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **プル**モデル: Prometheus が `/api/diagnostics/prometheus` をスクレイプします。
    - 外部コレクターは不要です。
    - 通常の Gateway 認証を通じて認証されます。
    - サーフェスはメトリクスのみです（トレースやログはありません）。
    - すでに Prometheus + Grafana で標準化されているスタックに最適です。

  </Tab>
  <Tab title="diagnostics-otel">
    - **プッシュ**モデル: OpenClaw が OTLP/HTTP をコレクターまたは OTLP 互換バックエンドに送信します。
    - サーフェスにはメトリクス、トレース、ログが含まれます。
    - 両方が必要な場合は、OpenTelemetry Collector（`prometheus` または `prometheusremotewrite` エクスポーター）を通じて Prometheus にブリッジします。
    - 完全なカタログについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。

  </Tab>
</Tabs>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="レスポンスボディが空">
    - config の `diagnostics.enabled: true` を確認してください。
    - `openclaw plugins list --enabled` で Plugin が有効化され、ロードされていることを確認してください。
    - いくらかトラフィックを生成してください。カウンターとヒストグラムは、少なくとも 1 件のイベント後にのみ行を出力します。

  </Accordion>
  <Accordion title="401 / 未認証">
    エンドポイントには Gateway operator スコープ（`auth: "gateway"` と `gatewayRuntimeScopeSurface: "trusted-operator"`）が必要です。他の Gateway operator ルートで Prometheus が使用しているものと同じトークンまたはパスワードを使用してください。公開された未認証モードはありません。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` が増加している">
    新しい属性が **2048** 系列の上限を超えています。直近のメトリクスを調べ、想定外に高カーディナリティのラベルを見つけて発生元で修正してください。エクスポーターは、ラベルを暗黙に書き換えるのではなく、意図的に新しい系列を破棄します。
  </Accordion>
  <Accordion title="再起動後に Prometheus に古い系列が表示される">
    Plugin は状態をメモリ内にのみ保持します。Gateway の再起動後、カウンターは 0 にリセットされ、ゲージは次に報告された値から再開します。リセットをきれいに扱うには PromQL の `rate()` と `increase()` を使用してください。
  </Accordion>
</AccordionGroup>

## 関連

- [診断エクスポート](/ja-JP/gateway/diagnostics) — サポートバンドル用のローカル診断 zip
- [ヘルスと準備状態](/ja-JP/gateway/health) — `/healthz` と `/readyz` プローブ
- [ロギング](/ja-JP/logging) — ファイルベースのロギング
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — トレース、メトリクス、ログ用の OTLP プッシュ
