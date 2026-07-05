---
read_when:
    - 你想让 Prometheus、Grafana、VictoriaMetrics 或其他抓取器收集 OpenClaw Gateway 网关指标
    - 你需要用于仪表板或告警的 Prometheus 指标名称和标签策略
    - 你想要指标，但不想运行 OpenTelemetry 收集器
sidebarTitle: Prometheus
summary: 通过 diagnostics-prometheus 插件将 OpenClaw 诊断公开为 Prometheus 文本指标
title: Prometheus 指标
x-i18n:
    generated_at: "2026-07-05T11:21:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw 可以通过官方 `diagnostics-prometheus` 插件暴露诊断指标。它监听可信诊断，以及由调度器拥有并在内部标记的诊断事件（队列、内存和会话恢复信号），并在以下位置渲染 Prometheus 文本端点：

  ```text
  GET /api/diagnostics/prometheus
  ```

  内容类型为 `text/plain; version=0.0.4; charset=utf-8`，即标准 Prometheus 暴露格式。

  <Warning>
  该路由使用 Gateway 网关身份验证（操作员权限范围，可信操作员接口）。不要将它暴露为公开且未认证的 `/metrics` 端点。请通过你用于其他操作员 API 的相同认证路径抓取它。
  </Warning>

  有关追踪、日志、OTLP 推送和 OpenTelemetry GenAI 语义属性，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

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
  <Step title="抓取受保护路由">
    发送操作员客户端所用的相同 Gateway 网关认证：

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="接入 Prometheus">
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
`diagnostics.enabled` 默认值为 `true`；只有在严格受限的环境中才将它设为 `false`。如果它为 `false`，插件仍会注册 HTTP 路由，但不会有诊断事件流入导出器，因此响应为空。
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
| `openclaw_model_usage_duration_seconds`          | 直方图    | `agent`, `channel`, `model`, `provider`                                                   |
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
| `openclaw_queue_lane_size`                       | 仪表盘    | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | 直方图    | `lane`                                                                                    |
| `openclaw_session_state_total`                   | 计数器    | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | 仪表盘    | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | 计数器    | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | 计数器    | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | 直方图    | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | 计数器    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | 直方图    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | 计数器    | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | 仪表盘    | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | 直方图    | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | 直方图    | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | 直方图    | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | 直方图    | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | 计数器    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | 直方图    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | 仪表盘    | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | 直方图    | 无                                                                                        |
| `openclaw_memory_pressure_total`                 | 计数器    | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | 计数器    | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | 计数器    | 无                                                                                        |
| `openclaw_diagnostic_async_queue_dropped_total`  | 计数器    | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | 仪表盘    | 无                                                                                        |

## 标签策略

<AccordionGroup>
  <Accordion title="有界、低基数标签">
    Prometheus 标签保持有界且低基数。导出器不会发出原始诊断标识符，例如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、消息 ID、聊天 ID 或提供商请求 ID。

    标签值会被脱敏，并且必须匹配 OpenClaw 的低基数字符策略。不符合该策略的值会根据指标替换为 `unknown`、`other` 或 `none`。看起来像限定范围的智能体会话键的标签也会被替换为 `unknown`。

  </Accordion>
  <Accordion title="时间序列上限和溢出计数">
    导出器会将内存中保留的时间序列总数限制在 **2048** 个，涵盖计数器、仪表和直方图。超过该上限的新序列会被丢弃，并且 `openclaw_prometheus_series_dropped_total` 每次递增一。

    将此计数器视为上游某个属性正在泄漏高基数值的明确信号。导出器绝不会自动提高上限；如果它持续增长，请修复源头，而不是禁用上限。

  </Accordion>
  <Accordion title="Prometheus 输出中绝不会出现的内容">
    - 提示文本、响应文本、工具输入、工具输出、系统提示
    - Talk 转录、音频载荷、调用 ID、房间 ID、移交令牌、轮次 ID 和原始会话 ID
    - 原始提供商请求 ID（仅在适用时以有界哈希出现在 span 上，绝不会出现在指标上）
    - 会话键和会话 ID
    - 主机名、文件路径、密钥值

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
对于跨提供商仪表板，请优先使用 `gen_ai_client_token_usage`：它遵循 OpenTelemetry GenAI 语义约定，并且与非 OpenClaw GenAI 服务的指标保持一致。
</Tip>

## 在 Prometheus 和 OpenTelemetry 导出之间选择

OpenClaw 独立支持这两个接口。你可以运行其中任一者、两者都运行，或都不运行。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **拉取**模型：Prometheus 抓取 `/api/diagnostics/prometheus`。
    - 不需要外部收集器。
    - 通过常规 Gateway 网关身份验证完成认证。
    - 接口仅包含指标（没有追踪或日志）。
    - 最适合已经标准化为 Prometheus + Grafana 的技术栈。

  </Tab>
  <Tab title="diagnostics-otel">
    - **推送**模型：OpenClaw 将 OTLP/HTTP 发送到收集器或 OTLP 兼容后端。
    - 接口包含指标、追踪和日志。
    - 当你需要同时使用两者时，可通过 OpenTelemetry Collector（`prometheus` 或 `prometheusremotewrite` 导出器）桥接到 Prometheus。
    - 参见 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) 获取完整目录。

  </Tab>
</Tabs>

## 故障排查

<AccordionGroup>
  <Accordion title="空响应正文">
    - 检查配置中的 `diagnostics.enabled` 未设置为 `false`（默认值为 `true`）。
    - 使用 `openclaw plugins list --enabled` 确认插件已启用并已加载。
    - 生成一些流量；计数器和直方图只有在至少一个事件之后才会发出行。

  </Accordion>
  <Accordion title="401 / 未授权">
    该端点需要 Gateway 网关操作员权限范围（`auth: "gateway"`，且 `gatewayRuntimeScopeSurface: "trusted-operator"`）。使用 Prometheus 用于其他任何 Gateway 网关操作员路由的同一令牌或密码。不存在公开的未认证模式。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` 正在增长">
    某个新属性超过了 **2048** 个序列的上限。检查近期指标，查找意外的高基数标签，并在源头修复。导出器会有意丢弃新序列，而不是静默重写标签。
  </Accordion>
  <Accordion title="重启后 Prometheus 显示陈旧序列">
    该插件仅在内存中保留状态。Gateway 网关重启后，计数器会重置为零，仪表会在下一次报告值时重新开始。使用 PromQL `rate()` 和 `increase()` 来干净地处理重置。
  </Accordion>
</AccordionGroup>

## 相关

- [诊断导出](/zh-CN/gateway/diagnostics) — 用于支持包的本地诊断 zip
- [健康和就绪状态](/zh-CN/gateway/health) — `/healthz` 和 `/readyz` 探针
- [日志](/zh-CN/logging) — 基于文件的日志
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — 用于追踪、指标和日志的 OTLP 推送
