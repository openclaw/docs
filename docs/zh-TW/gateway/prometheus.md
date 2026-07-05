---
read_when:
    - 你想讓 Prometheus、Grafana、VictoriaMetrics 或其他 scraper 收集 OpenClaw 閘道指標
    - 你需要用於儀表板或警示的 Prometheus 指標名稱與標籤政策
    - 想要在不執行 OpenTelemetry Collector 的情況下取得指標
sidebarTitle: Prometheus
summary: 透過 diagnostics-prometheus 外掛將 OpenClaw 診斷公開為 Prometheus 文字指標
title: Prometheus 指標
x-i18n:
    generated_at: "2026-07-05T11:22:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw 可以透過官方
  `diagnostics-prometheus` 外掛公開診斷指標。它會監聽受信任的診斷，以及
  內部標記、由分派器擁有的診斷事件（佇列、記憶體與
  工作階段復原訊號），並在以下位置呈現 Prometheus 文字端點：

  ```text
  GET /api/diagnostics/prometheus
  ```

  內容類型為 `text/plain; version=0.0.4; charset=utf-8`，也就是標準
  Prometheus 曝露格式。

  <Warning>
  此路由使用閘道驗證（操作者範圍、受信任操作者介面）。請勿將其公開為未經驗證的公用 `/metrics` 端點。請透過你用於其他操作者 API 的相同驗證路徑來抓取它。
  </Warning>

  如需追蹤、記錄、OTLP 推送與 OpenTelemetry GenAI 語意屬性，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

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
  <Step title="抓取受保護的路由">
    傳送與你的操作者用戶端相同的閘道驗證：

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
`diagnostics.enabled` 預設為 `true`；只有在嚴格受限的環境中才將其設為 `false`。如果其值為 `false`，外掛仍會註冊 HTTP 路由，但不會有診斷事件流入匯出器，因此回應會是空的。
</Note>

## 匯出的指標

| 指標                                             | 類型      | 標籤                                                                                      |
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
| `openclaw_memory_rss_bytes`                      | histogram | 無                                                                                        |
| `openclaw_memory_pressure_total`                 | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | counter   | 無                                                                                        |
| `openclaw_diagnostic_async_queue_dropped_total`  | counter   | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | gauge     | 無                                                                                        |

## 標籤政策

<AccordionGroup>
  <Accordion title="有界且低基數的標籤">
    Prometheus 標籤會保持有界且低基數。匯出器不會發出原始診斷識別碼，例如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、訊息 ID、聊天 ID 或提供者請求 ID。

    標籤值會經過遮蔽，且必須符合 OpenClaw 的低基數字元政策。不符合該政策的值會依指標而被替換為 `unknown`、`other` 或 `none`。看起來像是具範圍的代理工作階段金鑰的標籤，也會被替換為 `unknown`。

  </Accordion>
  <Accordion title="序列上限與溢位計算">
    匯出器會將記憶體中保留的時間序列上限限制為計數器、量測器和直方圖合計 **2048** 個序列。超過該上限的新序列會被捨棄，且 `openclaw_prometheus_series_dropped_total` 每次都會遞增一。

    將此計數器視為上游屬性正在洩漏高基數值的明確訊號。匯出器永遠不會自動提高上限；如果它持續上升，請修正來源，而不是停用上限。

  </Accordion>
  <Accordion title="Prometheus 輸出中絕不會出現的內容">
    - 提示文字、回應文字、工具輸入、工具輸出、系統提示
    - Talk 轉錄、音訊承載、通話 ID、房間 ID、交接權杖、回合 ID，以及原始工作階段 ID
    - 原始提供者請求 ID（僅在適用時於 span 上使用有界雜湊，絕不在指標上使用）
    - 工作階段金鑰與工作階段 ID
    - 主機名稱、檔案路徑、祕密值

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

# Skill usage, split by bounded source
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
跨提供者儀表板請優先使用 `gen_ai_client_token_usage`：它遵循 OpenTelemetry GenAI 語意慣例，並且與非 OpenClaw GenAI 服務的指標一致。
</Tip>

## 在 Prometheus 與 OpenTelemetry 匯出之間選擇

OpenClaw 獨立支援這兩種介面。你可以執行其中之一、兩者都執行，或兩者都不執行。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **拉取**模型：Prometheus 會抓取 `/api/diagnostics/prometheus`。
    - 不需要外部收集器。
    - 透過一般閘道驗證進行驗證。
    - 介面僅包含指標（沒有追蹤或日誌）。
    - 最適合已標準化採用 Prometheus + Grafana 的技術堆疊。

  </Tab>
  <Tab title="diagnostics-otel">
    - **推送**模型：OpenClaw 會將 OTLP/HTTP 傳送到收集器或 OTLP 相容後端。
    - 介面包含指標、追蹤與日誌。
    - 當你兩者都需要時，可透過 OpenTelemetry Collector（`prometheus` 或 `prometheusremotewrite` 匯出器）橋接到 Prometheus。
    - 完整目錄請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

  </Tab>
</Tabs>

## 疑難排解

<AccordionGroup>
  <Accordion title="空白回應主體">
    - 檢查設定中的 `diagnostics.enabled` 未設為 `false`（預設為 `true`）。
    - 使用 `openclaw plugins list --enabled` 確認外掛已啟用並載入。
    - 產生一些流量；計數器和直方圖只有在至少發生一個事件後才會輸出行。

  </Accordion>
  <Accordion title="401 / 未授權">
    端點需要閘道操作員範圍（`auth: "gateway"` 搭配 `gatewayRuntimeScopeSurface: "trusted-operator"`）。請使用 Prometheus 用於任何其他閘道操作員路由的相同權杖或密碼。沒有公開的未驗證模式。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` 正在上升">
    新屬性超過了 **2048** 個序列的上限。檢查最近的指標，找出基數異常高的標籤，並在來源修正。匯出器會刻意捨棄新序列，而不是默默重寫標籤。
  </Accordion>
  <Accordion title="重新啟動後 Prometheus 顯示過時序列">
    外掛只在記憶體中保留狀態。閘道重新啟動後，計數器會重設為零，而量測器會在下一次回報值時重新開始。使用 PromQL `rate()` 和 `increase()` 來乾淨地處理重設。
  </Accordion>
</AccordionGroup>

## 相關

- [診斷匯出](/zh-TW/gateway/diagnostics) — 用於支援套件的本機診斷 zip
- [健康狀態與就緒狀態](/zh-TW/gateway/health) — `/healthz` 與 `/readyz` 探針
- [日誌記錄](/zh-TW/logging) — 以檔案為基礎的日誌記錄
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — 用於追蹤、指標與日誌的 OTLP 推送
