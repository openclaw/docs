---
read_when:
    - 你想让 Prometheus、Grafana、VictoriaMetrics 或其他抓取器收集 OpenClaw Gateway 网关指标
    - 你需要用于仪表盘或告警的 Prometheus 指标名称和标签策略
    - 你希望获取指标，而无需运行 OpenTelemetry collector
sidebarTitle: Prometheus
summary: 通过 diagnostics-prometheus 插件将 OpenClaw 诊断信息暴露为 Prometheus 文本指标
title: Prometheus 指标
x-i18n:
    generated_at: "2026-06-27T02:05:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw 可以通过官方 `diagnostics-prometheus` 插件暴露诊断指标。它会监听可信诊断以及核心发出的 Gateway 网关稳定性事件，然后在以下位置呈现一个 Prometheus 文本端点：

  ```text
  GET /api/diagnostics/prometheus
  ```

  内容类型为 `text/plain; version=0.0.4; charset=utf-8`，即标准的 Prometheus 暴露格式。

  <Warning>
  该路由使用 Gateway 网关身份验证（操作员作用域）。不要将其作为公开的未认证 `/metrics` 端点暴露。请通过你用于其他操作员 API 的相同身份验证路径抓取它。
  </Warning>

  有关 traces、日志、OTLP 推送和 OpenTelemetry GenAI 语义属性，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

  ## 快速开始

  <Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="启用插件">
    <Tabs>
      <Tab title="配置">
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
  <Step title="重启 Gateway 网关">
    HTTP 路由会在插件启动时注册，因此启用后请重新加载。
  </Step>
  <Step title="抓取受保护的路由">
    发送你的操作员客户端使用的相同 Gateway 网关身份验证：

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
需要 `diagnostics.enabled: true`。没有它，插件仍会注册 HTTP 路由，但不会有诊断事件流入导出器，因此响应为空。
</Note>

## 导出的指标

| 指标                                             | 类型      | 标签                                                                                      |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | 计数器    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | 直方图    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | 计数器    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | 直方图    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | 计数器    | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | 计数器    | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | 直方图    | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | 计数器    | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | 计数器    | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | 计数器    | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | 直方图    | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | 计数器    | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | 计数器    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | 直方图    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | 计数器    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | 计数器    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | 直方图    | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | 计数器    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | 计数器    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | 计数器    | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | 直方图    | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | 计数器    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | 直方图    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | 计数器    | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | 计数器    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | 直方图    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | 计数器    | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | 直方图    | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | 直方图    | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | 仪表      | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | 直方图    | `lane`                                                                                    |
| `openclaw_session_state_total`                   | 计数器    | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | 仪表      | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | 计数器    | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | 计数器    | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | 直方图    | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | 计数器    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | 直方图    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | 计数器    | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | 仪表      | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | 直方图    | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | 直方图    | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | 直方图    | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | 直方图    | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | 计数器    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | 直方图    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | 仪表      | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | 直方图    | 无                                                                                        |
| `openclaw_memory_pressure_total`                 | 计数器    | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | 计数器    | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | 计数器    | 无                                                                                        |

## 标签策略

<AccordionGroup>
  <Accordion title="Bounded, low-cardinality labels">
    Prometheus 标签保持有界且低基数。导出器不会发出原始诊断标识符，例如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、消息 ID、聊天 ID 或提供商请求 ID。

    标签值会被脱敏，并且必须匹配 OpenClaw 的低基数字符策略。不符合该策略的值会根据指标替换为 `unknown`、`other` 或 `none`。看起来像带作用域的智能体会话键名的标签也会替换为 `unknown`。

  </Accordion>
  <Accordion title="Series cap and overflow accounting">
    导出器将内存中保留的时间序列总数限制为 **2048** 个，计数器、仪表和直方图合并计算。超过该上限的新序列会被丢弃，并且每次都会让 `openclaw_prometheus_series_dropped_total` 递增一。

    将这个计数器视为上游某个属性正在泄漏高基数值的强信号。导出器永远不会自动提高上限；如果它持续上升，请修复源头，而不是禁用上限。

  </Accordion>
  <Accordion title="Prometheus 输出中绝不会出现的内容">
    - prompt 文本、response 文本、tool 输入、tool 输出、system prompts
    - Talk 转录、音频载荷、调用 ID、房间 ID、handoff token、turn ID 和原始 session ID
    - 原始 provider request ID（仅在适用时作为 span 上的有界哈希，绝不出现在 metrics 上）
    - session key 和 session ID
    - 主机名、文件路径、secret 值

  </Accordion>
</AccordionGroup>

## PromQL recipes

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
对于跨提供商仪表板，优先使用 `gen_ai_client_token_usage`：它遵循 OpenTelemetry GenAI 语义约定，并且与非 OpenClaw GenAI 服务的 metrics 保持一致。
</Tip>

## 在 Prometheus 和 OpenTelemetry 导出之间选择

OpenClaw 独立支持这两个接口。你可以运行任一接口、同时运行两者，或都不运行。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **拉取**模型：Prometheus 抓取 `/api/diagnostics/prometheus`。
    - 不需要外部 collector。
    - 通过常规 Gateway 网关凭证进行身份验证。
    - 接口仅包含 metrics（不包含 traces 或 logs）。
    - 最适合已经标准化为 Prometheus + Grafana 的技术栈。

  </Tab>
  <Tab title="diagnostics-otel">
    - **推送**模型：OpenClaw 将 OTLP/HTTP 发送到 collector 或 OTLP 兼容后端。
    - 接口包含 metrics、traces 和 logs。
    - 当你同时需要两者时，可通过 OpenTelemetry Collector（`prometheus` 或 `prometheusremotewrite` exporter）桥接到 Prometheus。
    - 完整目录请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

  </Tab>
</Tabs>

## 故障排除

<AccordionGroup>
  <Accordion title="空响应体">
    - 检查配置中的 `diagnostics.enabled: true`。
    - 用 `openclaw plugins list --enabled` 确认插件已启用并加载。
    - 生成一些流量；counter 和 histogram 只有在至少发生一次事件后才会输出行。

  </Accordion>
  <Accordion title="401 / 未授权">
    该端点需要 Gateway 网关操作员作用域（`auth: "gateway"` 且 `gatewayRuntimeScopeSurface: "trusted-operator"`）。使用 Prometheus 访问任何其他 Gateway 网关操作员路由时所用的同一个 token 或密码。没有公开的未认证模式。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` 正在上升">
    新属性超过了 **2048** 个 series 的上限。检查最近的 metrics，查找意外高基数的标签，并从源头修复。exporter 会有意丢弃新的 series，而不是静默重写标签。
  </Accordion>
  <Accordion title="重启后 Prometheus 显示陈旧的 series">
    插件只在内存中保留状态。Gateway 网关重启后，counter 会重置为零，gauge 会在下一次报告值时重新开始。使用 PromQL `rate()` 和 `increase()` 可以干净地处理重置。
  </Accordion>
</AccordionGroup>

## 相关内容

- [诊断导出](/zh-CN/gateway/diagnostics) — 用于支持包的本地诊断 zip
- [健康和就绪](/zh-CN/gateway/health) — `/healthz` 和 `/readyz` 探针
- [日志](/zh-CN/logging) — 基于文件的日志
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — 用于 traces、metrics 和 logs 的 OTLP 推送
