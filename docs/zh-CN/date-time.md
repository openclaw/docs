---
read_when:
    - 你正在更改向模型或用户显示时间戳的方式
    - 你正在调试消息或系统提示输出中的时间格式设置
summary: 跨信封、提示、工具和连接器的日期与时间处理
title: 日期和时间
x-i18n:
    generated_at: "2026-07-05T11:15:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw 使用**主机本地时间作为传输时间戳**，并且在系统提示中**只放入时区**。
保留提供商时间戳，因此工具会保持其原生语义。当智能体需要当前
时间时，它会运行 `session_status` 工具。

## 消息信封（默认本地）

入站消息会用星期和精确到秒的时间戳包装：

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] message text
```

无论提供商时区是什么，信封时间戳**默认都是主机本地时间**。
可在 `agents.defaults` 下覆盖：

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

| 键                  | 值                                                   | 行为                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local`（默认）、`utc`、`user`、显式 IANA 名称       | `user` 使用 `agents.defaults.userTimezone`（未设置时使用主机时区）。显式 IANA 名称（例如 `"America/Chicago"`）会固定到指定时区；无法识别的名称会回退到 UTC。                  |
| `envelopeTimestamp` | `on`（默认）、`off`                                  | `off` 会从信封标头、直接智能体提示前缀和嵌入式模型输入前缀中移除绝对时间戳。                                                                                                  |
| `envelopeElapsed`   | `on`（默认）、`off`                                  | `off` 会移除会话中自上一条消息以来显示的经过时间后缀（`+30s` / `+2m` 样式）。                                                                                                  |

### 示例

**本地（默认）：**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**用户时区：**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**使用 `envelopeTimezone: "utc"` 的经过时间：**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## 系统提示：当前日期和时间

系统提示包含一个 **Current Date & Time** 部分，其中**仅包含时区**
（不包含时钟或时间格式），以保持提示缓存稳定：

```
Time zone: America/Chicago
```

配置后，时区为 `agents.defaults.userTimezone`；否则为主机时区。
提示还会指示智能体在需要当前日期、时间或星期几时运行
`session_status` 工具。

## 系统事件行（默认本地）

插入智能体上下文的排队系统事件会加上时间戳前缀，使用与消息信封相同的
`envelopeTimezone` 选择（默认：主机本地）。

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

- `userTimezone` 为提示上下文设置**用户本地时区**（也用于 `envelopeTimezone: "user"`）。
- `timeFormat` 控制面向提示的时间中的 **12 小时/24 小时显示**。`auto` 会遵循操作系统偏好设置。

## 时间格式检测（auto）

当 `timeFormat: "auto"` 时，OpenClaw 会检查操作系统偏好设置（macOS 和 Windows）
并回退到区域设置格式。检测到的值会**按进程缓存**，
以避免重复系统调用。

## 工具载荷 + 连接器（原始提供商时间 + 规范化字段）

渠道工具会返回**提供商原生时间戳**，并添加规范化字段以保持一致性：

- `timestampMs`：纪元毫秒（UTC）
- `timestampUtc`：ISO 8601 UTC 字符串

原始提供商字段会被保留，确保不会丢失任何内容。

- Discord：UTC ISO 时间戳
- Slack：来自 API 的类纪元字符串
- Telegram/WhatsApp：提供商特定的数字/ISO 时间戳

如果你需要本地时间，请在下游使用已知时区进行转换。

## 相关文档

- [系统提示](/zh-CN/concepts/system-prompt)
- [时区](/zh-CN/concepts/timezone)
- [消息](/zh-CN/concepts/messages)
