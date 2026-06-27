---
read_when:
    - 你想要 Prometheus、Grafana、VictoriaMetrics 或其他 scraper 收集 OpenClaw 閘道指標
    - 你需要用於儀表板或警示的 Prometheus 指標名稱與標籤政策
    - 你想要在不執行 OpenTelemetry 收集器的情況下取得指標
sidebarTitle: Prometheus
summary: 透過 diagnostics-prometheus 外掛將 OpenClaw 診斷資料公開為 Prometheus 文字指標
title: Prometheus 指標
x-i18n:
    generated_at: "2026-06-27T19:20:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw 可以透過官方 `diagnostics-prometheus` 外掛公開診斷指標。它會監聽受信任的診斷以及核心發出的閘道穩定性事件，然後在以下位置呈現 Prometheus 文字端點：

  ```text
  GET /api/diagnostics/prometheus
  ```

  內容類型為 `text/plain; version=0.0.4; charset=utf-8`，也就是標準的 Prometheus exposition 格式。

  <Warning>
  此路由使用閘道驗證（操作者範圍）。請勿將它公開為未驗證的公開 `/metrics` 端點。請透過你用於其他操作者 API 的相同驗證路徑來抓取它。
  </Warning>

  如需追蹤、日誌、OTLP 推送，以及 OpenTelemetry GenAI 語意屬性，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

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
    傳送操作者用戶端所使用的相同閘道驗證：

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
必須設定 `diagnostics.enabled: true`。若未設定，外掛仍會註冊 HTTP 路由，但不會有診斷事件流入匯出器，因此回應會是空的。
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
| `openclaw_memory_rss_bytes`                      | histogram | none                                                                                      |
| `openclaw_memory_pressure_total`                 | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | counter   | none                                                                                      |

## 標籤政策

<AccordionGroup>
  <Accordion title="有界、低基數標籤">
    Prometheus 標籤會保持有界且低基數。匯出器不會發出原始診斷識別碼，例如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、訊息 ID、聊天 ID 或提供者請求 ID。

    標籤值會經過遮蔽，且必須符合 OpenClaw 的低基數字元政策。不符合政策的值會依指標不同，替換為 `unknown`、`other` 或 `none`。看起來像有範圍的代理工作階段金鑰的標籤，也會替換為 `unknown`。

  </Accordion>
  <Accordion title="序列上限與溢位計算">
    匯出器會將記憶體中保留的時間序列總數限制在 **2048** 個序列，包含 counter、gauge 和 histogram。超過該上限的新序列會被丟棄，且每次都會讓 `openclaw_prometheus_series_dropped_total` 增加一。

    將這個計數器視為上游屬性正在洩漏高基數值的強訊號。匯出器絕不會自動提高上限；如果它持續攀升，請修正來源，而不是停用上限。

  </Accordion>
  <Accordion title="What never appears in Prometheus output">
    - 提示文字、回應文字、工具輸入、工具輸出、系統提示
    - 通話逐字稿、音訊酬載、通話 ID、房間 ID、交接權杖、回合 ID，以及原始工作階段 ID
    - 原始提供者請求 ID（僅在適用時於 span 上使用有界雜湊，絕不出現在指標上）
    - 工作階段金鑰和工作階段 ID
    - 主機名稱、檔案路徑、秘密值

  </Accordion>
</AccordionGroup>

## PromQL 配方

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
跨提供者儀表板建議優先使用 `gen_ai_client_token_usage`：它遵循 OpenTelemetry GenAI 語意慣例，並且與非 OpenClaw GenAI 服務的指標一致。
</Tip>

## 在 Prometheus 與 OpenTelemetry 匯出之間選擇

OpenClaw 獨立支援這兩種介面。你可以執行其中一種、兩種都執行，或兩者都不執行。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull** 模型：Prometheus 抓取 `/api/diagnostics/prometheus`。
    - 不需要外部收集器。
    - 透過一般閘道驗證進行驗證。
    - 介面僅提供指標（沒有追蹤或日誌）。
    - 最適合已標準化採用 Prometheus + Grafana 的堆疊。

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push** 模型：OpenClaw 將 OTLP/HTTP 傳送到收集器或 OTLP 相容後端。
    - 介面包含指標、追蹤和日誌。
    - 當你兩者都需要時，可透過 OpenTelemetry Collector（`prometheus` 或 `prometheusremotewrite` 匯出器）橋接到 Prometheus。
    - 完整目錄請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。

  </Tab>
</Tabs>

## 疑難排解

<AccordionGroup>
  <Accordion title="Empty response body">
    - 檢查設定中的 `diagnostics.enabled: true`。
    - 使用 `openclaw plugins list --enabled` 確認外掛已啟用且已載入。
    - 產生一些流量；計數器和直方圖只會在至少一個事件之後才輸出行。

  </Accordion>
  <Accordion title="401 / unauthorized">
    此端點需要閘道操作員範圍（`auth: "gateway"` 搭配 `gatewayRuntimeScopeSurface: "trusted-operator"`）。請使用 Prometheus 用於任何其他閘道操作員路由的相同權杖或密碼。沒有公開的未驗證模式。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` is climbing">
    新屬性超出了 **2048** 個序列的上限。檢查近期指標中是否有非預期的高基數標籤，並在來源修正。匯出器會刻意丟棄新序列，而不是默默重寫標籤。
  </Accordion>
  <Accordion title="Prometheus shows stale series after a restart">
    外掛只將狀態保留在記憶體中。閘道重新啟動後，計數器會重設為零，而量表會從下一個回報值重新開始。使用 PromQL `rate()` 和 `increase()` 可乾淨處理重設。
  </Accordion>
</AccordionGroup>

## 相關內容

- [診斷匯出](/zh-TW/gateway/diagnostics) — 用於支援套件的本機診斷 zip
- [健康狀態與就緒狀態](/zh-TW/gateway/health) — `/healthz` 和 `/readyz` 探針
- [記錄](/zh-TW/logging) — 以檔案為基礎的記錄
- [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry) — 用於追蹤、指標和日誌的 OTLP 推送
