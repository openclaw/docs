---
read_when:
    - 您希望使用 Prometheus、Grafana、VictoriaMetrics 或其他擷取工具來收集 OpenClaw 閘道指標
    - 您需要用於儀表板或警示的 Prometheus 指標名稱與標籤政策
    - 您希望在不執行 OpenTelemetry 收集器的情況下取得指標資料
sidebarTitle: Prometheus
summary: 透過 diagnostics-prometheus 外掛，將 OpenClaw 診斷資料公開為 Prometheus 文字格式指標
title: Prometheus 指標
x-i18n:
    generated_at: "2026-07-11T21:22:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw 可透過官方的 `diagnostics-prometheus` 外掛公開診斷指標。它會接收受信任的診斷資料，以及內部已加上標記、由分派器管理的診斷事件（佇列、記憶體及工作階段復原訊號），並在以下位置提供 Prometheus 文字端點：

  ```text
  GET /api/diagnostics/prometheus
  ```

  內容類型為 `text/plain; version=0.0.4; charset=utf-8`，即標準的 Prometheus 公開格式。

  <Warning>
  此路由使用閘道驗證（操作員範圍、受信任操作員介面）。請勿將其公開為無須驗證的 `/metrics` 公開端點。請透過其他操作員 API 所使用的相同驗證路徑來擷取資料。
  </Warning>

  如需追蹤、日誌、OTLP 推送及 OpenTelemetry GenAI 語意屬性，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

  ## 快速開始

  <Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="啟用外掛">
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
      <Tab title="命令列介面">
        ```bash
        openclaw plugins enable diagnostics-prometheus
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="重新啟動閘道">
    HTTP 路由會在外掛啟動時註冊，因此啟用後請重新載入。
  </Step>
  <Step title="擷取受保護的路由">
    傳送操作員用戶端所使用的相同閘道驗證資訊：

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="連接 Prometheus">
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
`diagnostics.enabled` 預設為 `true`；只有在限制嚴格的環境中才將其設為 `false`。如果設為 `false`，外掛仍會註冊 HTTP 路由，但不會有任何診斷事件流入匯出器，因此回應為空。
</Note>

## 匯出的指標

| 指標                                             | 類型      | 標籤                                                                                      |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | 計數器    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | 直方圖    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | 計數器    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | 直方圖    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | 計數器    | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | 計數器    | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | 直方圖    | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | 計數器    | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | 直方圖    | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | 計數器    | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | 計數器    | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | 直方圖    | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | 計數器    | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | 計數器    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | 直方圖    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | 計數器    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | 計數器    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | 直方圖    | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | 計數器    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | 計數器    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | 計數器    | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | 直方圖    | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | 計數器    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | 直方圖    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | 計數器    | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | 計數器    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | 直方圖    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | 計數器    | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | 直方圖    | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | 直方圖    | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | 儀表      | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | 直方圖    | `lane`                                                                                    |
| `openclaw_session_state_total`                   | 計數器    | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | 儀表      | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | 計數器    | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | 計數器    | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | 直方圖    | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | 計數器    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | 直方圖    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | 計數器    | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | 儀表      | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | 直方圖    | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | 直方圖    | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | 直方圖    | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | 直方圖    | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | 計數器    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | 直方圖    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | 儀表      | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | 直方圖    | 無                                                                                        |
| `openclaw_memory_pressure_total`                 | 計數器    | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | 計數器    | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | 計數器    | 無                                                                                        |
| `openclaw_diagnostic_async_queue_dropped_total`  | 計數器    | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | 儀表      | 無                                                                                        |

## 標籤政策

<AccordionGroup>
  <Accordion title="有界且低基數的標籤">
    Prometheus 標籤維持有界且低基數。匯出器不會輸出原始診斷識別碼，例如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、訊息 ID、聊天 ID 或提供者請求 ID。

    標籤值會經過遮蔽處理，且必須符合 OpenClaw 的低基數字元政策。不符合政策的值會依指標替換為 `unknown`、`other` 或 `none`。看起來像具範圍限定的代理程式工作階段金鑰之標籤，也會替換為 `unknown`。

  </Accordion>
  <Accordion title="時間序列上限與溢位計算">
    匯出器在記憶體中保留的時間序列總數上限為 **2048** 個，此上限合併計算計數器、儀表和直方圖。超過上限的新序列會被捨棄，且每次都會讓 `openclaw_prometheus_series_dropped_total` 增加一。

    請監控此計數器；它是上游某個屬性洩漏高基數值的明確訊號。匯出器絕不會自動提高上限；如果此計數器持續上升，請修正來源，而非停用上限。

  </Accordion>
  <Accordion title="Prometheus 輸出中絕不會出現的內容">
    - 提示文字、回應文字、工具輸入、工具輸出、系統提示
    - Talk 逐字稿、音訊承載資料、通話 ID、房間 ID、移交權杖、輪次 ID，以及原始工作階段 ID
    - 原始供應商請求 ID（僅在適用時於追蹤範圍中使用受限雜湊，絕不會用於指標）
    - 工作階段金鑰和工作階段 ID
    - 主機名稱、檔案路徑、機密值

  </Accordion>
</AccordionGroup>

## PromQL 配方

```promql
# 每分鐘的權杖數，依供應商區分
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# 過去一小時的支出（美元），依模型區分
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 模型執行時間的第 95 百分位數
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# 佇列等待時間 SLO（第 95 百分位數低於 2 秒）
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Skill 使用情況，依受限來源區分
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# 被捨棄的 Prometheus 序列（基數警示）
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
跨供應商儀表板建議使用 `gen_ai_client_token_usage`：它遵循 OpenTelemetry GenAI 語意慣例，並與非 OpenClaw GenAI 服務的指標保持一致。
</Tip>

## 在 Prometheus 與 OpenTelemetry 匯出之間選擇

OpenClaw 分別支援這兩種介面。你可以執行其中任一種、同時執行兩種，或都不執行。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **拉取**模型：Prometheus 抓取 `/api/diagnostics/prometheus`。
    - 不需要外部收集器。
    - 透過一般閘道驗證進行驗證。
    - 此介面僅提供指標（不含追蹤或日誌）。
    - 最適合已標準化採用 Prometheus + Grafana 的技術堆疊。

  </Tab>
  <Tab title="diagnostics-otel">
    - **推送**模型：OpenClaw 將 OTLP/HTTP 傳送至收集器或與 OTLP 相容的後端。
    - 此介面包含指標、追蹤和日誌。
    - 若同時需要兩者，可透過 OpenTelemetry Collector（使用 `prometheus` 或 `prometheusremotewrite` 匯出器）橋接至 Prometheus。
    - 完整目錄請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

  </Tab>
</Tabs>

## 疑難排解

<AccordionGroup>
  <Accordion title="回應本文為空">
    - 檢查設定中的 `diagnostics.enabled` 未設為 `false`（預設為 `true`）。
    - 使用 `openclaw plugins list --enabled` 確認外掛已啟用並載入。
    - 產生一些流量；計數器和直方圖至少發生一次事件後才會輸出資料列。

  </Accordion>
  <Accordion title="401／未授權">
    此端點需要閘道操作員範圍（`auth: "gateway"` 搭配 `gatewayRuntimeScopeSurface: "trusted-operator"`）。請使用 Prometheus 存取其他閘道操作員路由時所用的相同權杖或密碼。不提供公開的免驗證模式。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` 持續上升">
    某個新屬性正超過 **2048** 個序列的上限。請檢查近期指標是否有基數異常高的標籤，並從來源修正。匯出器會刻意捨棄新序列，而非無提示地重寫標籤。
  </Accordion>
  <Accordion title="重新啟動後，Prometheus 顯示過時序列">
    外掛只在記憶體中保留狀態。閘道重新啟動後，計數器會重設為零，儀表則會從下一個回報值重新開始。請使用 PromQL 的 `rate()` 和 `increase()` 妥善處理重設。
  </Accordion>
</AccordionGroup>

## 相關內容

- [診斷匯出](/zh-TW/gateway/diagnostics) — 用於支援套件的本機診斷 ZIP 檔
- [健康狀態與就緒狀態](/zh-TW/gateway/health) — `/healthz` 和 `/readyz` 探針
- [日誌記錄](/zh-TW/logging) — 以檔案為基礎的日誌記錄
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — 透過 OTLP 推送追蹤、指標和日誌
