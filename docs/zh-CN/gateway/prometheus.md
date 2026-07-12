---
read_when:
    - 你希望由 Prometheus、Grafana、VictoriaMetrics 或其他抓取工具收集 OpenClaw Gateway 网关指标
    - 你需要用于仪表板或告警的 Prometheus 指标名称和标签策略
    - 你希望无需运行 OpenTelemetry 收集器即可获取指标
sidebarTitle: Prometheus
summary: 通过 diagnostics-prometheus 插件将 OpenClaw 诊断信息公开为 Prometheus 文本指标
title: Prometheus 指标
x-i18n:
    generated_at: "2026-07-11T20:32:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw 可通过官方 `diagnostics-prometheus` 插件公开诊断指标。该插件监听可信诊断数据以及带内部标签、由调度器所有的诊断事件（队列、内存和会话恢复信号），并在以下地址呈现 Prometheus 文本端点：

  ```text
  GET /api/diagnostics/prometheus
  ```

  内容类型为 `text/plain; version=0.0.4; charset=utf-8`，即标准的 Prometheus 指标公开格式。

  <Warning>
  该路由使用 Gateway 网关身份验证（操作员权限范围、可信操作员接口）。不要将其作为公开且无需身份验证的 `/metrics` 端点暴露。请通过其他操作员 API 所使用的相同身份验证路径抓取该端点。
  </Warning>

  有关跟踪、日志、OTLP 推送和 OpenTelemetry GenAI 语义属性，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

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
    HTTP 路由在插件启动时注册，因此启用后需要重新加载。
  </Step>
  <Step title="抓取受保护的路由">
    发送操作员客户端所使用的相同 Gateway 网关身份验证信息：

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
`diagnostics.enabled` 默认为 `true`；仅在严格受限的环境中将其设置为 `false`。如果它为 `false`，插件仍会注册 HTTP 路由，但不会有诊断事件流入导出器，因此响应为空。
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
| `openclaw_diagnostic_async_queue_dropped_total`  | 计数器    | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | 仪表      | 无                                                                                        |

## 标签策略

<AccordionGroup>
  <Accordion title="有界的低基数标签">
    Prometheus 标签保持有界且为低基数。导出器不会发出原始诊断标识符，例如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、消息 ID、聊天 ID 或提供商请求 ID。

    标签值会经过脱敏，并且必须符合 OpenClaw 的低基数字符策略。未通过策略检查的值将根据指标替换为 `unknown`、`other` 或 `none`。看起来像带作用域的智能体会话键的标签也会替换为 `unknown`。

  </Accordion>
  <Accordion title="序列上限和溢出计数">
    导出器在内存中保留的时间序列总数上限为 **2048**，此上限涵盖计数器、仪表和直方图。超出上限的新序列会被丢弃，每次丢弃时，`openclaw_prometheus_series_dropped_total` 都会加一。

    请监控此计数器，将其视为上游某个属性正在泄漏高基数值的明确信号。导出器绝不会自动提高上限；如果该计数器持续增长，应修复源头，而不是禁用上限。

  </Accordion>
  <Accordion title="Prometheus 输出中绝不会出现的内容">
    - 提示文本、响应文本、工具输入、工具输出、系统提示
    - Talk 转录文本、音频载荷、通话 ID、房间 ID、移交令牌、轮次 ID 和原始会话 ID
    - 原始提供商请求 ID（仅在适用时以有界哈希形式出现在 span 中，绝不会出现在指标中）
    - 会话键和会话 ID
    - 主机名、文件路径、密钥值

  </Accordion>
</AccordionGroup>

## PromQL 配方

```promql
# 每分钟的令牌数，按提供商拆分
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# 过去一小时的支出（美元），按模型统计
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 模型运行时长的第 95 百分位数
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# 队列等待时间 SLO（第 95 百分位数低于 2 秒）
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Skill 使用情况，按有界来源拆分
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# 被丢弃的 Prometheus 序列（基数警报）
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
对于跨提供商仪表板，优先使用 `gen_ai_client_token_usage`：它遵循 OpenTelemetry GenAI 语义约定，并与非 OpenClaw GenAI 服务的指标保持一致。
</Tip>

## 在 Prometheus 和 OpenTelemetry 导出之间进行选择

OpenClaw 独立支持这两种接口。你可以运行其中任意一种、同时运行两种，或两种都不运行。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **拉取**模型：Prometheus 抓取 `/api/diagnostics/prometheus`。
    - 无需外部收集器。
    - 通过常规 Gateway 网关身份验证进行认证。
    - 该接口仅包含指标（不包含跟踪或日志）。
    - 最适合已经统一采用 Prometheus + Grafana 的技术栈。

  </Tab>
  <Tab title="diagnostics-otel">
    - **推送**模型：OpenClaw 通过 OTLP/HTTP 向收集器或兼容 OTLP 的后端发送数据。
    - 该接口包含指标、跟踪和日志。
    - 当你同时需要两者时，可通过 OpenTelemetry Collector（使用 `prometheus` 或 `prometheusremotewrite` 导出器）连接到 Prometheus。
    - 完整目录请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

  </Tab>
</Tabs>

## 故障排查

<AccordionGroup>
  <Accordion title="响应正文为空">
    - 检查配置中的 `diagnostics.enabled` 是否未设置为 `false`（默认为 `true`）。
    - 使用 `openclaw plugins list --enabled` 确认插件已启用并加载。
    - 生成一些流量；计数器和直方图只有在至少发生一个事件后才会输出相应行。

  </Accordion>
  <Accordion title="401 / 未授权">
    该端点需要 Gateway 网关操作员权限范围（`auth: "gateway"`，且 `gatewayRuntimeScopeSurface: "trusted-operator"`）。请使用 Prometheus 访问任何其他 Gateway 网关操作员路由时所用的同一令牌或密码。不存在未经身份验证的公开模式。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` 持续增长">
    某个新属性正在导致序列数超出 **2048** 的上限。检查近期指标，查找基数异常高的标签，并从源头修复。导出器会有意丢弃新序列，而不会静默改写标签。
  </Accordion>
  <Accordion title="重启后 Prometheus 显示陈旧序列">
    插件仅在内存中保存状态。Gateway 网关重启后，计数器会重置为零，仪表则从下一次报告的值重新开始。使用 PromQL 的 `rate()` 和 `increase()` 可以妥善处理重置。
  </Accordion>
</AccordionGroup>

## 相关内容

- [诊断导出](/zh-CN/gateway/diagnostics) — 用于支持包的本地诊断 zip 文件
- [健康和就绪状态](/zh-CN/gateway/health) — `/healthz` 和 `/readyz` 探针
- [日志](/zh-CN/logging) — 基于文件的日志
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — 通过 OTLP 推送跟踪、指标和日志
