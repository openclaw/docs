---
read_when:
    - 你正在更改时间戳向模型或用户显示的方式
    - 你正在调试消息或系统提示输出中的时间格式
summary: 跨封套、提示词、工具和连接器的日期和时间处理
title: 日期和时间
x-i18n:
    generated_at: "2026-05-05T23:38:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2d273da97a4dfc4218cfa945eeea8a9bae1b046b1c0d4eba5e279bff5d2eba0
    source_path: date-time.md
    workflow: 16
---

# 日期与时间

OpenClaw 默认使用**主机本地时间作为传输时间戳**，并且**仅在系统提示中使用用户时区**。
提供商时间戳会被保留，因此工具会保持其原生语义（当前时间可通过 `session_status` 获取）。

## 消息信封（默认本地）

入站消息会被包装为带有时间戳的格式（精确到分钟）：

```
[Provider ... 2026-01-05 16:26 PST] message text
```

无论提供商时区是什么，这个信封时间戳**默认都是主机本地时间**。

你可以覆盖此行为：

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` 使用 UTC。
- `envelopeTimezone: "local"` 使用主机时区。
- `envelopeTimezone: "user"` 使用 `agents.defaults.userTimezone`（回退到主机时区）。
- 使用显式 IANA 时区（例如 `"America/Chicago"`）来指定固定时区。
- `envelopeTimestamp: "off"` 会从信封头中移除绝对时间戳。
- `envelopeElapsed: "off"` 会移除经过时间后缀（`+2m` 这种样式）。

### 示例

**本地（默认）：**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**用户时区：**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**已启用经过时间：**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## 系统提示：当前日期和时间

如果用户时区已知，系统提示会包含一个专用的
**当前日期与时间**部分，其中**仅包含时区**（没有时钟/时间格式），
以保持提示缓存稳定：

```
Time zone: America/Chicago
```

当智能体需要当前时间时，请使用 `session_status` 工具；Status
卡片中包含一行时间戳。

## 系统事件行（默认本地）

插入到智能体上下文中的排队系统事件会以时间戳为前缀，使用与消息信封相同的时区选择（默认：主机本地）。

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### 配置用户时区 + 格式

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` 设置用于提示上下文的**用户本地时区**。
- `timeFormat` 控制提示中的 **12 小时/24 小时显示**。`auto` 遵循操作系统偏好设置。

## 时间格式检测（auto）

当 `timeFormat: "auto"` 时，OpenClaw 会检查操作系统偏好设置（macOS/Windows），并回退到区域设置格式。检测到的值会**按进程缓存**，以避免重复系统调用。

## 工具负载 + 连接器（原始提供商时间 + 规范化字段）

渠道工具会返回**提供商原生时间戳**，并添加规范化字段以保持一致性：

- `timestampMs`：epoch 毫秒（UTC）
- `timestampUtc`：ISO 8601 UTC 字符串

原始提供商字段会被保留，因此不会丢失任何信息。

- Slack：来自 API 的类 epoch 字符串
- Discord：UTC ISO 时间戳
- Telegram/WhatsApp：提供商特定的数字/ISO 时间戳

如果你需要本地时间，请使用已知时区在下游转换。

## 相关文档

- [系统提示](/zh-CN/concepts/system-prompt)
- [时区](/zh-CN/concepts/timezone)
- [消息](/zh-CN/concepts/messages)
