---
read_when:
    - 你想讓 Prometheus、Grafana、VictoriaMetrics 或其他抓取工具收集 OpenClaw Gateway 指標
    - 你需要用於儀表板或警示的 Prometheus 指標名稱與標籤政策
    - 你想在不執行 OpenTelemetry 收集器的情況下取得指標
sidebarTitle: Prometheus
summary: 透過 diagnostics-prometheus Plugin 將 OpenClaw 診斷公開為 Prometheus 文字指標
title: Prometheus 指標
x-i18n:
    generated_at: "2026-04-30T03:08:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw 可以透過隨附的 `diagnostics-prometheus` Plugin 公開診斷指標。它會監聽受信任的內部診斷，並在以下位置呈現 Prometheus 文字端點：

```text
GET /api/diagnostics/prometheus
```

內容類型為 `text/plain; version=0.0.4; charset=utf-8`，也就是標準的 Prometheus exposition 格式。

<Warning>
此路由使用 Gateway 驗證（operator 範圍）。請勿將其公開為未經驗證的公開 `/metrics` 端點。請透過你用於其他 operator API 的相同驗證路徑進行抓取。
</Warning>

若要了解追蹤、日誌、OTLP 推送，以及 OpenTelemetry GenAI 語意屬性，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

## 快速開始

<Steps>
  <Step title="啟用 Plugin">
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
  <Step title="重新啟動 Gateway">
    HTTP 路由會在 Plugin 啟動時註冊，因此啟用後請重新載入。
  </Step>
  <Step title="抓取受保護的路由">
    傳送你的 operator 用戶端所使用的相同 gateway 驗證：

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="串接 Prometheus">
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
必須設定 `diagnostics.enabled: true`。若未設定，Plugin 仍會註冊 HTTP 路由，但不會有診斷事件流入匯出器，因此回應會是空的。
</Note>

## 匯出的指標

| 指標                                          | 類型      | 標籤                                                                                      |
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
| `openclaw_memory_rss_bytes`                   | histogram | 無                                                                                        |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | 無                                                                                        |

## 標籤政策

<AccordionGroup>
  <Accordion title="有界、低基數標籤">
    Prometheus 標籤會保持有界且低基數。匯出器不會發出原始診斷識別碼，例如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、訊息 ID、聊天 ID，或 provider request ID。

    標籤值會被遮罩，且必須符合 OpenClaw 的低基數字元政策。未通過政策的值會依指標替換為 `unknown`、`other` 或 `none`。

  </Accordion>
  <Accordion title="序列上限與溢出計量">
    匯出器會將記憶體中保留的時間序列上限限制為 **2048** 個，包含計數器、量表和直方圖合計。超過此上限的新序列會被丟棄，且 `openclaw_prometheus_series_dropped_total` 每次會遞增一。

    請將此計數器視為上游屬性正在洩漏高基數值的明確訊號。匯出器絕不會自動提高上限；如果它持續上升，請修正來源，而不是停用上限。

  </Accordion>
  <Accordion title="Prometheus 輸出中絕不會出現的內容">
    - 提示文字、回應文字、工具輸入、工具輸出、系統提示
    - 原始 provider request ID（僅在適用時於 span 上使用有界雜湊，絕不出現在指標上）
    - 工作階段金鑰與工作階段 ID
    - 主機名稱、檔案路徑、秘密值

  </Accordion>
</AccordionGroup>

## PromQL 範例

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
跨 provider 儀表板建議使用 `gen_ai_client_token_usage`：它遵循 OpenTelemetry GenAI 語意慣例，並與非 OpenClaw GenAI 服務的指標保持一致。
</Tip>

## 在 Prometheus 與 OpenTelemetry 匯出之間選擇

OpenClaw 獨立支援兩種介面。你可以執行其中一種、兩種都執行，或兩者都不執行。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **拉取**模型：Prometheus 抓取 `/api/diagnostics/prometheus`。
    - 不需要外部 collector。
    - 透過一般 Gateway 驗證進行驗證。
    - 介面僅包含指標（沒有追蹤或日誌）。
    - 最適合已標準化使用 Prometheus + Grafana 的堆疊。

  </Tab>
  <Tab title="diagnostics-otel">
    - **推送**模型：OpenClaw 將 OTLP/HTTP 傳送到 collector 或 OTLP 相容後端。
    - 介面包含指標、追蹤與日誌。
    - 當你需要兩者時，可透過 OpenTelemetry Collector（`prometheus` 或 `prometheusremotewrite` 匯出器）橋接到 Prometheus。
    - 完整目錄請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

  </Tab>
</Tabs>

## 疑難排解

<AccordionGroup>
  <Accordion title="空的回應本文">
    - 檢查設定中的 `diagnostics.enabled: true`。
    - 使用 `openclaw plugins list --enabled` 確認 Plugin 已啟用並載入。
    - 產生一些流量；計數器和直方圖只有在至少一個事件發生後才會發出行。

  </Accordion>
  <Accordion title="401 / 未授權">
    端點需要 Gateway operator 範圍（`auth: "gateway"` 搭配 `gatewayRuntimeScopeSurface: "trusted-operator"`）。使用 Prometheus 用於任何其他 Gateway operator 路由的相同 token 或密碼。沒有公開未驗證模式。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` 正在上升">
    新屬性超過 **2048** 序列上限。檢查近期指標是否有非預期的高基數標籤，並在來源修正。匯出器會刻意丟棄新序列，而不是靜默改寫標籤。
  </Accordion>
  <Accordion title="Prometheus 在重新啟動後顯示過期序列">
    Plugin 僅在記憶體中保留狀態。Gateway 重新啟動後，計數器會重設為零，而量表會在下一次回報值時重新開始。使用 PromQL `rate()` 和 `increase()` 來乾淨處理重設。
  </Accordion>
</AccordionGroup>

## 相關內容

- [診斷匯出](/zh-TW/gateway/diagnostics) — 用於支援套件組合的本機診斷 zip
- [健康狀態與就緒狀態](/zh-TW/gateway/health) — `/healthz` 和 `/readyz` 探測
- [記錄](/zh-TW/logging) — 以檔案為基礎的記錄
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — 用於追蹤、指標和日誌的 OTLP 推送
