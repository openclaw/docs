---
read_when:
    - 你需要一个用于理解时区处理的快速心智模型
    - 你正在决定要在哪里设置或覆盖时区
summary: OpenClaw 中时区出现的位置——信封、工具载荷、系统提示词
title: 时区
x-i18n:
    generated_at: "2026-05-05T16:51:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 041b207a0fa2758a20e8f3c4eca852d3dd416560d045459cb4d86709b45449e3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw 会标准化时间戳，让模型看到的是**单一参考时间**，而不是混杂的提供商本地时钟。时区会出现在三个层面，每个层面都有自己的用途：

## 三个时区层面

| 层面              | 显示内容                                                                                                | 默认值                                  | 配置方式                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| 消息信封          | 包装传入的渠道消息：`[Signal +1555 2026-01-18 00:19 PST] hello`                                         | 主机本地                                | `agents.defaults.envelopeTimezone`                      |
| 工具载荷          | 渠道 `readMessages` 风格的工具返回原始提供商时间 + 标准化的 `timestampMs` / `timestampUtc`              | 始终存在 UTC 字段                       | 不可配置；保留提供商原生时间戳                         |
| 系统提示词        | 一个小型 `Current Date & Time` 块，只包含**时区**（不含时钟值，以保持缓存稳定）                         | 未设置 `userTimezone` 时使用主机时区    | `agents.defaults.userTimezone`                          |

系统提示词会有意省略实时时钟，以保持提示词缓存在多轮对话中的稳定性。当智能体需要当前时间时，它会调用 `session_status`。

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

如果未设置 `userTimezone`，OpenClaw 会在运行时解析主机时区（不会写入配置）。`agents.defaults.timeFormat`（`auto` | `12` | `24`）控制信封和下游层面的 12 小时制/24 小时制渲染，而不控制系统提示词部分。

## 何时覆盖

- **使用 UTC 信封**（`envelopeTimezone: "utc"`）：当你希望不同区域的主机之间使用稳定时间戳，或者希望 UTC 对齐的日志匹配诊断输出时使用。
- **使用固定 IANA 时区**（例如 `"Europe/Vienna"`）：当 Gateway 网关主机位于一个时区，但用户位于另一个时区，并且你希望信封无论主机如何迁移都按用户时区显示时使用。
- **设置 `envelopeTimestamp: "off"`**：当时间戳上下文对对话没有帮助，并希望使用低 token 信封时使用。

如需完整行为参考、各提供商示例以及经过时间格式化，请参阅 [日期和时间](/zh-CN/date-time)。

## 相关

- [日期和时间](/zh-CN/date-time) — 完整的信封/工具/提示词行为和示例。
- [Heartbeat](/zh-CN/gateway/heartbeat) — 活跃时段使用时区进行调度。
- [Cron 任务](/zh-CN/automation/cron-jobs) — cron 表达式使用时区进行调度。
