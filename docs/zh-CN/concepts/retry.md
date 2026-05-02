---
read_when:
    - 更新提供商重试行为或默认值
    - 调试提供商发送错误或速率限制
summary: 出站提供商调用的重试策略
title: 重试策略
x-i18n:
    generated_at: "2026-05-02T01:52:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
---

## 目标

- 按每个 HTTP 请求重试，而不是按多步骤流程重试。
- 仅重试当前步骤，以保留顺序。
- 避免重复执行非幂等操作。

## 默认值

- 尝试次数：3
- 最大延迟上限：30000 ms
- 抖动：0.1（10%）
- 提供商默认值：
  - Telegram 最小延迟：400 ms
  - Discord 最小延迟：500 ms

## 行为

### 模型提供商

- OpenClaw 让提供商 SDK 处理常规的短重试。
- 对于基于 Stainless 的 SDK（例如 Anthropic 和 OpenAI），可重试响应
  （`408`、`409`、`429` 和 `5xx`）可以包含 `retry-after-ms` 或
  `retry-after`。当该等待时间超过 60 秒时，OpenClaw 会注入
  `x-should-retry: false`，使 SDK 立即暴露错误，并让模型故障转移可以轮换到另一个凭证配置文件或备用模型。
- 使用 `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>` 覆盖上限。
  将其设为 `0`、`false`、`off`、`none` 或 `disabled`，即可让 SDK 在内部遵循较长的
  `Retry-After` 休眠。

### Discord

- 对速率限制错误（HTTP 429）、请求超时、HTTP 5xx 响应，
  以及 DNS 查询失败、连接重置、套接字关闭和 fetch 失败等瞬时传输故障进行重试。
- 可用时使用 Discord `retry_after`，否则使用指数退避。

### Telegram

- 对瞬时错误（429、超时、连接/重置/关闭、暂时不可用）进行重试。
- 可用时使用 `retry_after`，否则使用指数退避。
- Markdown 解析错误不会重试；它们会回退到纯文本。

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

## 备注

- 重试按每个请求应用（发送消息、上传媒体、反应、投票、贴纸）。
- 复合流程不会重试已完成的步骤。

## 相关

- [模型故障转移](/zh-CN/concepts/model-failover)
- [命令队列](/zh-CN/concepts/queue)
