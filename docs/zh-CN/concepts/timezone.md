---
read_when:
    - 你需要一个关于时区处理的快速心智模型
    - 你正在决定在哪里设置或覆盖时区
summary: 时区在 OpenClaw 中出现的位置 —— 信封、工具负载、系统提示词
title: 时区
x-i18n:
    generated_at: "2026-07-05T11:16:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw 会标准化时间戳，让模型看到的是**单一参考时间**，而不是混杂的提供商本地时钟。三个界面会显示时区，每个都有自己的用途：

## 三个时区界面

| 界面              | 显示内容                                                                                                   | 默认值                                | 配置方式                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| 消息信封          | 封装传入的渠道消息：`[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                     | 主机本地                              | `agents.defaults.envelopeTimezone`                     |
| 工具载荷          | 渠道 `readMessages` 风格的工具返回原始提供商时间，以及标准化的 `timestampMs` / `timestampUtc`              | 始终包含 UTC 字段                     | 不可配置；保留提供商原生时间戳                         |
| 系统提示词        | 一个小型 `当前日期和时间` 区块，只包含**时区**（不含时钟值，以保持缓存稳定）                               | 未设置 `userTimezone` 时使用主机时区  | `agents.defaults.userTimezone`                         |

系统提示词会有意省略实时时钟，以保持各轮次之间的提示词缓存稳定。当智能体需要当前时间时，它会调用 `session_status`。

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

如果未设置 `userTimezone`，OpenClaw 会在运行时通过 `Intl.DateTimeFormat().resolvedOptions().timeZone` 解析主机时区（不会写入配置）。`agents.defaults.timeFormat`（`auto` | `12` | `24`）控制消息信封和下游界面中的 12 小时/24 小时渲染，不控制系统提示词部分。

## 消息信封时区值

`agents.defaults.envelopeTimezone` 接受：

- `"local"`（默认）或 `"host"` - 主机的时区。
- `"utc"` 或 `"gmt"` - UTC。
- `"user"` - 解析后的 `agents.defaults.userTimezone`（未设置时回退到主机时区）。
- 任意显式 IANA 时区字符串，例如 `"Europe/Vienna"`。

## 何时覆盖

- **使用 `"utc"`** 可在不同地区的主机之间获得稳定时间戳，或匹配按 UTC 对齐的诊断/日志输出。
- **使用 `"user"`** 可让消息信封与配置的用户时区保持一致，无论 Gateway 网关主机运行在哪个时区。
- **使用固定 IANA 时区**，适用于 Gateway 网关主机位于一个时区，但无论主机迁移到哪里，消息信封都应始终按另一个时区读取的情况。
- **设置 `envelopeTimestamp: "off"`**，适用于时间戳上下文对对话没有帮助的情况。这会从消息信封、直接智能体提示词前缀和嵌入式模型输入前缀中移除绝对时间戳。

如需完整行为参考、各提供商示例和经过时间格式化，请参阅[日期和时间](/zh-CN/date-time)。

## 相关

- [日期和时间](/zh-CN/date-time) - 完整的消息信封/工具/提示词行为和示例。
- [Heartbeat](/zh-CN/gateway/heartbeat) - 活跃时段使用时区进行调度。
- [Cron 作业](/zh-CN/automation/cron-jobs) - cron 表达式使用时区进行调度。
