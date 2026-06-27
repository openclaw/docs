---
read_when:
    - 你需要一个关于时区处理的快速心智模型
    - 你正在决定在哪里设置或覆盖时区
summary: 时区在 OpenClaw 中出现的位置 — 信封、工具 payload、系统提示词
title: 时区
x-i18n:
    generated_at: "2026-06-27T01:55:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw 会标准化时间戳，让模型看到**单一参考时间**，而不是混合的提供商本地时钟。时区会出现在三个呈现面中，每个呈现面都有自己的用途：

## 三个时区呈现面

| 呈现面 | 显示内容 | 默认值 | 配置方式 |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| 消息封套 | 包装入站渠道消息：`[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello` | 主机本地 | `agents.defaults.envelopeTimezone` |
| 工具载荷 | 渠道 `readMessages` 风格的工具会返回原始提供商时间 + 标准化的 `timestampMs` / `timestampUtc` | UTC 字段始终存在 | 不可配置 — 保留提供商原生时间戳 |
| 系统提示词 | 一个小的 `Current Date & Time` 区块，只包含**时区**（不包含时钟值，以保持缓存稳定） | 如果未设置 `userTimezone`，则使用主机时区 | `agents.defaults.userTimezone` |

系统提示词会有意省略实时钟点，以保持跨轮次的提示词缓存稳定。当智能体需要当前时间时，它会调用 `session_status`。

## 设置用户时区

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

如果未设置 `userTimezone`，OpenClaw 会在运行时解析主机时区（不会写入配置）。`agents.defaults.timeFormat`（`auto` | `12` | `24`）控制封套和下游呈现面中的 12h/24h 渲染，而不控制系统提示词部分。

## 何时覆盖

- **使用 UTC 封套**（`envelopeTimezone: "utc"`）：当你希望不同区域的主机之间时间戳保持稳定，或者希望与 UTC 对齐的日志匹配诊断输出时使用。
- **使用固定 IANA 时区**（例如 `"Europe/Vienna"`）：当 Gateway 网关主机位于一个时区，而用户位于另一个时区，并且你希望封套无论主机如何迁移都按用户时区显示时使用。
- **设置 `envelopeTimestamp: "off"`**：当时间戳上下文对对话没有帮助时使用。这会从封套、直接智能体提示词前缀和嵌入式模型输入前缀中移除绝对时间戳。

完整行为参考、各提供商示例以及经过时间格式化，请参阅[日期和时间](/zh-CN/date-time)。

## 相关

- [日期和时间](/zh-CN/date-time) — 完整的封套/工具/提示词行为和示例。
- [Heartbeat](/zh-CN/gateway/heartbeat) — 活跃时间使用时区进行调度。
- [Cron 任务](/zh-CN/automation/cron-jobs) — cron 表达式使用时区进行调度。
