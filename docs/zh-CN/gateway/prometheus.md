---
read_when:
    - 你想让 Prometheus、Grafana、VictoriaMetrics 或其他抓取器收集 OpenClaw Gateway 网关指标
    - 你需要用于仪表板或告警的 Prometheus 指标名称和标签策略
    - 你想在不运行 OpenTelemetry 收集器的情况下获取指标
sidebarTitle: Prometheus
summary: 通过 diagnostics-prometheus 插件将 OpenClaw 诊断信息公开为 Prometheus 文本指标
title: Prometheus 指标
x-i18n:
    generated_at: "2026-04-28T11:53:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw 可以通过内置的 `diagnostics-prometheus` 插件公开诊断指标。它会监听受信任的内部诊断，并在以下位置渲染 Prometheus 文本端点：

```text
GET /api/diagnostics/prometheus
```

内容类型是 `text/plain; version=0.0.4; charset=utf-8`，即标准 Prometheus exposition 格式。

<Warning>
该路由使用 Gateway 网关身份验证（operator 范围）。不要将其作为公开的未认证 `/metrics` 端点暴露。请通过你用于其他 operator API 的相同身份验证路径抓取它。
</Warning>

对于 traces、日志、OTLP 推送和 OpenTelemetry GenAI 语义属性，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。

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
    发送与你的 operator 客户端使用的相同 Gateway 网关身份验证：

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
必须设置 `diagnostics.enabled: true`。如果没有它，插件仍会注册 HTTP 路由，但不会有诊断事件流入导出器，因此响应为空。
</Note>

## 已导出的指标

| 指标                                          | 类型      | 标签                                                                                      |
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
| `openclaw_memory_rss_bytes`                   | histogram | 无                                                                                        |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | 无                                                                                        |

## 标签策略

<AccordionGroup>
  <Accordion title="有界、低基数标签">
    Prometheus 标签保持有界且低基数。导出器不会发出原始诊断标识符，例如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、消息 ID、聊天 ID 或提供商请求 ID。

    标签值会被脱敏，并且必须符合 OpenClaw 的低基数字符策略。不符合该策略的值会根据指标替换为 `unknown`、`other` 或 `none`。

  </Accordion>
  <Accordion title="序列上限和溢出计数">
    导出器在内存中保留的时间序列上限为 **2048** 个序列，计数器、仪表和直方图合并计算。超过该上限的新序列会被丢弃，并且每次都会让 `openclaw_prometheus_series_dropped_total` 加一。

    将此计数器视为上游某个属性正在泄漏高基数值的强信号。导出器绝不会自动提高上限；如果它持续上升，请修复源头，而不是禁用上限。

  </Accordion>
  <Accordion title="Prometheus 输出中绝不会出现的内容">
    - prompt 文本、响应文本、工具输入、工具输出、系统 prompts
    - 原始提供商请求 ID（仅在适用时出现在 spans 上的有界哈希，绝不会出现在指标上）
    - 会话键和会话 ID
    - 主机名、文件路径、密钥值

  </Accordion>
</AccordionGroup>

## PromQL 示例

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
对于跨提供商仪表盘，优先使用 `gen_ai_client_token_usage`：它遵循 OpenTelemetry GenAI 语义约定，并且与非 OpenClaw GenAI 服务的指标一致。
</Tip>

## 在 Prometheus 和 OpenTelemetry 导出之间选择

OpenClaw 独立支持这两个表面。你可以运行其中任意一个、两个都运行，或都不运行。

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **拉取** 模型：Prometheus 抓取 `/api/diagnostics/prometheus`。
    - 不需要外部收集器。
    - 通过常规 Gateway 网关身份验证进行认证。
    - 表面仅包含指标（没有 traces 或日志）。
    - 最适合已经标准化使用 Prometheus + Grafana 的技术栈。

  </Tab>
  <Tab title="diagnostics-otel">
    - **推送** 模型：OpenClaw 将 OTLP/HTTP 发送到收集器或 OTLP 兼容后端。
    - 表面包含指标、traces 和日志。
    - 当你同时需要两者时，可通过 OpenTelemetry Collector（`prometheus` 或 `prometheusremotewrite` 导出器）桥接到 Prometheus。
    - 请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) 获取完整目录。

  </Tab>
</Tabs>

## 故障排除

<AccordionGroup>
  <Accordion title="响应正文为空">
    - 检查配置中的 `diagnostics.enabled: true`。
    - 使用 `openclaw plugins list --enabled` 确认插件已启用并加载。
    - 生成一些流量；计数器和直方图只会在至少发生一个事件后发出行。

  </Accordion>
  <Accordion title="401 / 未授权">
    该端点需要 Gateway 网关 operator 范围（`auth: "gateway"`，并带有 `gatewayRuntimeScopeSurface: "trusted-operator"`）。使用 Prometheus 用于任何其他 Gateway 网关 operator 路由的相同令牌或密码。不存在公开未认证模式。
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` 正在上升">
    某个新属性正在超过 **2048** 个序列的上限。检查最近的指标，查找意外的高基数标签，并在源头修复。导出器会有意丢弃新序列，而不是静默重写标签。
  </Accordion>
  <Accordion title="Prometheus 在重启后显示过期序列">
    插件仅在内存中保留状态。Gateway 网关重启后，计数器会重置为零，仪表会在下一次上报值时重新开始。使用 PromQL `rate()` 和 `increase()` 来干净地处理重置。
  </Accordion>
</AccordionGroup>

## 相关

- [诊断导出](/zh-CN/gateway/diagnostics) — 用于支持包的本地诊断 zip
- [健康和就绪状态](/zh-CN/gateway/health) — `/healthz` 和 `/readyz` probes
- [日志记录](/zh-CN/logging) — 基于文件的日志记录
- [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) — 用于 traces、指标和日志的 OTLP 推送
