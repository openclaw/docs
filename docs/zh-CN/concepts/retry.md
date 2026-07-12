---
read_when:
    - 更新提供商重试行为或默认设置
    - 调试提供商发送错误或速率限制
summary: 出站提供商调用的重试策略
title: 重试策略
x-i18n:
    generated_at: "2026-07-11T20:30:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## 目标

- 按每个 HTTP 请求重试，而不是按多步骤流程重试。
- 仅重试当前步骤，以保持顺序。
- 避免重复执行非幂等操作。

## 默认值

| 设置               | 默认值    |
| ------------------ | --------- |
| 尝试次数           | 3         |
| 最大延迟上限       | 30000 ms  |
| 抖动               | 0.1 (10%) |
| Telegram 最小延迟 | 400 ms    |
| Discord 最小延迟  | 500 ms    |

## 行为

### 模型提供商

- OpenClaw 让提供商 SDK 处理常规的短时重试。
- 对于 Anthropic 和 OpenAI 等基于 Stainless 的 SDK，可重试响应（`408`、`409`、`429` 和 `5xx`）可能包含 `retry-after-ms` 或 `retry-after`。当等待时间超过 60 秒时，OpenClaw 会注入 `x-should-retry: false`，让 SDK 立即返回错误，以便模型故障转移能够切换到另一个身份验证配置文件或备用模型。
- 使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` 覆盖上限。将其设置为 `0`、`false`、`off`、`none` 或 `disabled`，可让 SDK 在内部遵循较长的 `Retry-After` 等待时间。

### Discord

- 遇到速率限制错误（HTTP 429）、请求超时、HTTP 5xx 响应，以及 DNS 查询失败、连接重置、套接字关闭和获取失败等临时传输故障时进行重试。
- 如果有 Discord `retry_after`，则使用该值；否则使用指数退避。

### Telegram

- 遇到临时错误（429、超时、连接失败/重置/关闭、暂时不可用）时进行重试。
- 如果有 `retry_after`，则使用该值；否则使用指数退避。
- HTML/Markdown 解析错误不会重试；首次尝试失败后会回退到纯文本。

## 配置

在 `~/.openclaw/openclaw.json` 中按提供商设置重试策略：

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## 注意事项

- 重试按每个请求应用（发送消息、上传媒体、表情回应、投票、贴纸）。
- 组合流程不会重试已完成的步骤。

## 相关内容

- [模型故障转移](/zh-CN/concepts/model-failover)
- [命令队列](/zh-CN/concepts/queue)
