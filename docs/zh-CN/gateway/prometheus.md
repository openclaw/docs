---
read_when:
    - 你希望 Prometheus、Grafana、VictoriaMetrics 或其他抓取器收集 OpenClaw Gateway 网关的指标
    - 你需要仪表板或告警所需的 Prometheus 指标名称和标签策略
    - 你想获取指标，但不想运行 OpenTelemetry 采集器
sidebarTitle: Prometheus
summary: 通过 diagnostics-prometheus 插件将 OpenClaw 诊断信息公开为 Prometheus 文本指标
title: Prometheus 指标
x-i18n:
    generated_at: "2026-05-02T15:11:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49df17348c5b63c4b5f3c05f3378d43764e5de985135ad30c1e74ef607e0dd37
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw 可以通过官方 `diagnostics-prometheus` 插件暴露诊断指标。它会监听受信任的内部诊断，并在以下位置呈现 Prometheus 文本端点：

```text
GET /api/diagnostics/prometheus
```

内容类型是 `text/plain; version=0.0.4; charset=utf-8`，即标准的 Prometheus 暴露格式。

<Warning>
该路由使用 Gateway 网关身份验证（operator 作用域）。不要将其作为公开的未认证 `/metrics` 端点暴露。请通过你用于其他 operator API 的同一认证路径抓取它。
</Warning>

关于跟踪、日志、OTLP 推送和 OpenTelemetry GenAI 语义属性，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

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
    HTTP 路由会在插件启动时注册，因此请在启用后重新加载。
  </Step>
  <Step title="抓取受保护路由">
    发送你的 operator 客户端使用的相同网关认证：

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="连接 Prometheus">
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
必须设置 `diagnostics.enabled: true`。如果没有它，插件仍会注册 HTTP 路由，但没有诊断事件流入导出器，因此响应为空。
</Note>

## 导出的指标

| 指标                                          | 类型      | 标签                                                                                      |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | 计数器    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | 直方图    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | 计数器    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | 直方图    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | 计数器    | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | 直方图    | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | 计数器    | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | 计数器    | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | 直方图    | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | 计数器    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | 直方图    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | 计数器    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | 直方图    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | 计数器    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | 直方图    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | 仪表      | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | 直方图    | `lane`                                                                                    |
| `openclaw_session_state_total`                | 计数器    | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | 仪表      | `state`                                                                                   |
| `openclaw_memory_bytes`                       | 仪表      | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | 直方图    | 无                                                                                        |
| `openclaw_memory_pressure_total`              | 计数器    | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | 计数器    | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | 计数器    | 无                                                                                        |

## 标签策略

<AccordionGroup>
  <Accordion title="有界、低基数标签">
    Prometheus 标签保持有界且低基数。导出器不会发出原始诊断标识符，例如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、消息 ID、聊天 ID 或提供商请求 ID。

    标签值会被脱敏，并且必须匹配 OpenClaw 的低基数字符策略。未通过该策略的值会根据指标替换为 `unknown`、`other` 或 `none`。

  </Accordion>
  <Accordion title="序列上限和溢出计数">
    导出器会将内存中保留的时间序列限制在 **2048** 个序列以内，计数器、仪表和直方图合并计算。超过该上限的新序列会被丢弃，并且 `openclaw_prometheus_series_dropped_total` 每次递增一。

    将此计数器作为硬信号来观察上游属性是否正在泄漏高基数值。导出器永远不会自动提高上限；如果它持续上升，请修复源头，而不是禁用上限。

  </Accordion>
  <Accordion title="Prometheus 输出中永远不会出现的内容">
    - 提示文本、响应文本、工具输入、工具输出、系统提示
    - 原始提供商请求 ID（仅在适用时以有界哈希出现在 span 上，绝不出现在指标上）
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

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
对于跨提供商仪表板，优先使用 `gen_ai_client_token_usage`：它遵循 OpenTelemetry GenAI 语义约定，并且与非 OpenClaw GenAI 服务的指标保持一致。
</Tip>

## 在 Prometheus 和 OpenTelemetry 导出之间选择

OpenClaw 独立支持这两种表面。你可以运行其中任意一种、两者都运行，或两者都不运行。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **拉取**模型：Prometheus 抓取 `/api/diagnostics/prometheus`。
    - 不需要外部收集器。
    - 通过正常的 Gateway 网关认证进行身份验证。
    - 表面仅包含指标（不含跟踪或日志）。
    - 最适合已经标准化使用 Prometheus + Grafana 的技术栈。

  </Tab>
  <Tab title="diagnostics-otel">
    - **推送**模型：OpenClaw 将 OTLP/HTTP 发送到收集器或 OTLP 兼容后端。
    - 表面包含指标、跟踪和日志。
    - 当你需要两者时，通过 OpenTelemetry Collector（`prometheus` 或 `prometheusremotewrite` 导出器）桥接到 Prometheus。
    - 有关完整目录，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

  </Tab>
</Tabs>

## 故障排除

<AccordionGroup>
  <Accordion title="响应正文为空">
    - 检查配置中的 `diagnostics.enabled: true`。
    - 使用 `openclaw plugins list --enabled` 确认插件已启用并加载。
    - 生成一些流量；计数器和直方图只有在至少发生一个事件后才会发出行。

  </Accordion>
  <Accordion title="401 / 未授权">
    该端点需要 Gateway 网关 operator 作用域（`auth: "gateway"`，并设置 `gatewayRuntimeScopeSurface: "trusted-operator"`）。使用 Prometheus 用于任何其他 Gateway 网关 operator 路由的相同令牌或密码。没有公开的未认证模式。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` 正在上升">
    有一个新属性超过了 **2048** 序列上限。检查最近的指标中是否存在意外的高基数标签，并在源头修复它。导出器会有意丢弃新序列，而不是静默改写标签。
  </Accordion>
  <Accordion title="Prometheus 在重启后显示过期序列">
    插件只在内存中保留状态。Gateway 网关重启后，计数器会重置为零，仪表会在下一次报告值时重新开始。使用 PromQL `rate()` 和 `increase()` 可以干净地处理重置。
  </Accordion>
</AccordionGroup>

## 相关

- [诊断导出](/zh-CN/gateway/diagnostics) — 用于支持包的本地诊断 zip
- [健康和就绪](/zh-CN/gateway/health) — `/healthz` 和 `/readyz` 探针
- [日志记录](/zh-CN/logging) — 基于文件的日志记录
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — 用于跟踪、指标和日志的 OTLP 推送
