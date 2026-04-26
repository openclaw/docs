---
read_when:
    - 你希望 Prometheus、Grafana、VictoriaMetrics 或其他抓取器收集 OpenClaw Gateway 网关指标。
    - 你需要 Prometheus 指标名称和标签策略，用于仪表板或告警。
    - 你希望在不运行 OpenTelemetry 收集器的情况下获取指标。
summary: 通过 diagnostics-prometheus 插件将 OpenClaw 诊断信息公开为 Prometheus 文本指标
title: Prometheus 指标
x-i18n:
    generated_at: "2026-04-26T09:19:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75ef930b0c38d056a462eef3f5c4effdd2515ccbff2b8d2b6235ce171eef8b54
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw 可以通过内置的 `diagnostics-prometheus` 插件公开诊断指标。它会监听受信任的内部诊断信息，并在以下地址渲染一个 Prometheus 文本端点：

```text
/api/diagnostics/prometheus
```

该路由使用 Gateway 网关身份验证。不要将它作为公开的、无需身份验证的 `/metrics` 端点暴露出去。

## 快速开始

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

你也可以通过 CLI 启用该插件：

```bash
openclaw plugins enable diagnostics-prometheus
```

然后，使用与你用于操作员 API 相同的 Gateway 网关身份验证来抓取这个受保护的 Gateway 网关路由。

## 导出的指标

| 指标 | 类型 | 标签 |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | counter   | `channel`、`model`、`outcome`、`provider`、`trigger`                                      |
| `openclaw_run_duration_seconds`               | histogram | `channel`、`model`、`outcome`、`provider`、`trigger`                                      |
| `openclaw_model_call_total`                   | counter   | `api`、`error_category`、`model`、`outcome`、`provider`、`transport`                      |
| `openclaw_model_call_duration_seconds`        | histogram | `api`、`error_category`、`model`、`outcome`、`provider`、`transport`                      |
| `openclaw_model_tokens_total`                 | counter   | `agent`、`channel`、`model`、`provider`、`token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histogram | `model`、`provider`、`token_type`                                                         |
| `openclaw_model_cost_usd_total`               | counter   | `agent`、`channel`、`model`、`provider`                                                   |
| `openclaw_tool_execution_total`               | counter   | `error_category`、`outcome`、`params_kind`、`tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histogram | `error_category`、`outcome`、`params_kind`、`tool`                                        |
| `openclaw_harness_run_total`                  | counter   | `channel`、`error_category`、`harness`、`model`、`outcome`、`phase`、`plugin`、`provider` |
| `openclaw_harness_run_duration_seconds`       | histogram | `channel`、`error_category`、`harness`、`model`、`outcome`、`phase`、`plugin`、`provider` |
| `openclaw_message_processed_total`            | counter   | `channel`、`outcome`、`reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histogram | `channel`、`outcome`、`reason`                                                            |
| `openclaw_message_delivery_total`             | counter   | `channel`、`delivery_kind`、`error_category`、`outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`、`delivery_kind`、`error_category`、`outcome`                                   |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | counter   | `reason`、`state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | 无                                                                                       |
| `openclaw_memory_pressure_total`              | counter   | `level`、`reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`、`reason`、`signal`、`status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | 无                                                                                       |

## 标签策略

Prometheus 标签保持有界且低基数。导出器不会输出原始诊断标识符，例如 `runId`、`sessionKey`、`sessionId`、`callId`、`toolCallId`、消息 ID、聊天 ID 或 provider 请求 ID。

标签值会被脱敏，并且必须符合 OpenClaw 的低基数字符策略。不符合该策略的值会被替换为 `unknown`、`other` 或 `none`，具体取决于指标。

导出器会限制内存中保留的时间序列数量。如果达到上限，新时间序列将被丢弃，并且 `openclaw_prometheus_series_dropped_total` 会递增。

如需完整的追踪、日志、OTLP 导出和 OpenTelemetry GenAI 语义属性，请使用 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
