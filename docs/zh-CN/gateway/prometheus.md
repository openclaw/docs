---
read_when:
    - 你希望 Prometheus、Grafana、VictoriaMetrics 或其他抓取器收集 OpenClaw Gateway 网关指标
    - 你需要 Prometheus 指标名称和标签策略来构建仪表板或告警
    - 你希望在不运行 OpenTelemetry 收集器的情况下获取指标
sidebarTitle: Prometheus
summary: 通过 diagnostics-prometheus 插件将 OpenClaw 诊断信息作为 Prometheus 文本指标暴露出来
title: Prometheus 指标
x-i18n:
    generated_at: "2026-04-26T09:32:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw 可以通过内置的 `diagnostics-prometheus` 插件暴露诊断指标。它会监听受信任的内部诊断事件，并在以下地址渲染一个 Prometheus 文本端点：

```text
GET /api/diagnostics/prometheus
```

内容类型为 `text/plain; version=0.0.4; charset=utf-8`，即标准的 Prometheus 暴露格式。

<Warning>
该路由使用 Gateway 网关身份验证（operator scope）。不要将它作为公开的、无需身份验证的 `/metrics` 端点暴露。应通过与你的其他 operator API 相同的身份验证路径来抓取它。
</Warning>

关于追踪、日志、OTLP 推送和 OpenTelemetry GenAI 语义属性，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

## 快速开始

<Steps>
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
    HTTP 路由会在插件启动时注册，因此启用后需要重新加载。
  </Step>
  <Step title="抓取受保护的路由">
    发送与你的 operator 客户端使用的相同 gateway auth：

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="配置 Prometheus">
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
必须设置 `diagnostics.enabled: true`。如果未设置，插件仍会注册 HTTP 路由，但不会有任何诊断事件流入导出器，因此响应将为空。
</Note>

## 已导出的指标

| 指标 | 类型 | 标签 |
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
| `openclaw_memory_rss_bytes`                   | histogram | none                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | none                                                                                      |

## 标签策略

<AccordionGroup>
  <Accordion title="有界、低基数标签">
    Prometheus 标签会保持有界和低基数。导出器不会发出原始诊断标识符，例如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、消息 ID、聊天 ID 或提供商请求 ID。

    标签值会被脱敏，并且必须符合 OpenClaw 的低基数字符策略。不符合该策略的值会根据指标不同，被替换为 `unknown`、`other` 或 `none`。

  </Accordion>
  <Accordion title="时间序列上限与溢出统计">
    导出器会将内存中保留的时间序列总数限制为 **2048**，该上限覆盖 counter、gauge 和 histogram 的总和。超出该上限的新时间序列会被丢弃，并且每次丢弃时，`openclaw_prometheus_series_dropped_total` 都会加一。

    你应将这个计数器视为上游属性泄漏高基数值的强信号。导出器绝不会自动提高上限；如果它持续增长，应修复源头，而不是禁用上限。

  </Accordion>
  <Accordion title="哪些内容绝不会出现在 Prometheus 输出中">
    - 提示词文本、响应文本、工具输入、工具输出、系统提示词
    - 原始提供商请求 ID（如适用，仅在 span 上使用有界哈希——绝不会出现在指标上）
    - 会话键和会话 ID
    - 主机名、文件路径、密钥值

  </Accordion>
</AccordionGroup>

## PromQL 示例

```promql
# 每分钟 token 数，按 provider 拆分
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# 最近一小时花费（USD），按 model 统计
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 模型运行时长 95 分位数
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# 队列等待时间 SLO（95 分位低于 2 秒）
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# 被丢弃的 Prometheus 时间序列（基数告警）
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
对于跨 provider 仪表板，优先使用 `gen_ai_client_token_usage`：它遵循 OpenTelemetry GenAI 语义约定，并且与非 OpenClaw GenAI 服务的指标保持一致。
</Tip>

## 在 Prometheus 导出与 OpenTelemetry 导出之间进行选择

OpenClaw 独立支持这两种方式。你可以只使用其中一种、同时使用两种，或者都不用。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **拉取** 模式：Prometheus 抓取 `/api/diagnostics/prometheus`。
    - 不需要外部收集器。
    - 通过常规 Gateway 网关身份验证进行认证。
    - 仅提供指标（不包含追踪或日志）。
    - 最适合已经标准化使用 Prometheus + Grafana 的技术栈。

  </Tab>
  <Tab title="diagnostics-otel">
    - **推送** 模式：OpenClaw 将 OTLP/HTTP 发送到收集器或兼容 OTLP 的后端。
    - 覆盖指标、追踪和日志。
    - 当你同时需要两者时，可通过 OpenTelemetry Collector（`prometheus` 或 `prometheusremotewrite` exporter）桥接到 Prometheus。
    - 完整目录请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

  </Tab>
</Tabs>

## 故障排除

<AccordionGroup>
  <Accordion title="响应体为空">
    - 检查配置中是否设置了 `diagnostics.enabled: true`。
    - 使用 `openclaw plugins list --enabled` 确认插件已启用并加载。
    - 生成一些流量；counter 和 histogram 只有在至少发生一次事件后才会输出内容。

  </Accordion>
  <Accordion title="401 / 未授权">
    该端点要求 Gateway 网关 operator scope（`auth: "gateway"` 且 `gatewayRuntimeScopeSurface: "trusted-operator"`）。请使用 Prometheus 访问其他 Gateway 网关 operator 路由时所用的相同 token 或密码。不存在公开的免认证模式。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` 持续增长">
    某个新属性超出了 **2048** 条时间序列上限。检查最近的指标中是否存在意外的高基数标签，并从源头修复。导出器会有意丢弃新时间序列，而不是静默改写标签。
  </Accordion>
  <Accordion title="Prometheus 在重启后显示过期时间序列">
    该插件仅在内存中保存状态。Gateway 网关重启后，counter 会重置为零，gauge 会在下一次上报时从新的值重新开始。请使用 PromQL 的 `rate()` 和 `increase()` 来正确处理重置。
  </Accordion>
</AccordionGroup>

## 相关内容

- [诊断导出](/zh-CN/gateway/diagnostics) — 用于支持包的本地诊断 zip
- [健康检查与就绪检查](/zh-CN/gateway/health) — `/healthz` 和 `/readyz` 探针
- [日志记录](/zh-CN/logging) — 基于文件的日志记录
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — 用于追踪、指标和日志的 OTLP 推送
