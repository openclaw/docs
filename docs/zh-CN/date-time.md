---
read_when:
    - 你正在更改时间戳向模型或用户显示的方式
    - 你正在调试消息或系统提示输出中的时间格式。
summary: 封装、提示词、工具和连接器中的日期和时间处理
title: 日期和时间
x-i18n:
    generated_at: "2026-06-27T01:56:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw 默认对**传输时间戳使用主机本地时间**，并且**仅在系统提示词中使用用户时区**。
保留提供商时间戳，因此工具会保持其原生语义（当前时间可通过 `session_status` 获取）。

## 消息封套（默认本地）

入站消息会被包装为带时间戳的形式（精确到秒）：

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

无论提供商时区是什么，这个封套时间戳默认都是**主机本地时间**。

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
- 对固定时区使用显式 IANA 时区（例如 `"America/Chicago"`）。
- `envelopeTimestamp: "off"` 会从封套标头、直接智能体提示词前缀和嵌入式模型输入前缀中移除绝对时间戳。
- `envelopeElapsed: "off"` 会移除经过时间后缀（`+2m` 这种样式）。

### 示例

**本地（默认）：**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**用户时区：**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**已启用经过时间：**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## 系统提示词：当前日期和时间

如果用户时区已知，系统提示词会包含一个专用的
**当前日期和时间**部分，其中**仅包含时区**（不包含时钟/时间格式），
以保持提示词缓存稳定：

```
Time zone: America/Chicago
```

当智能体需要当前时间时，使用 `session_status` 工具；状态卡片
包含一行时间戳。

## 系统事件行（默认本地）

插入智能体上下文的排队系统事件会加上时间戳前缀，使用与消息封套
相同的时区选择（默认：主机本地时间）。

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

- `userTimezone` 为提示词上下文设置**用户本地时区**。
- `timeFormat` 控制提示词中的 **12 小时制/24 小时制显示**。`auto` 遵循操作系统偏好设置。

## 时间格式检测（auto）

当 `timeFormat: "auto"` 时，OpenClaw 会检查操作系统偏好设置（macOS/Windows），
并回退到区域设置格式。检测到的值会**按进程缓存**，以避免重复系统调用。

## 工具载荷 + 连接器（原始提供商时间 + 规范化字段）

频道工具会返回**提供商原生时间戳**，并添加规范化字段以保持一致性：

- `timestampMs`：纪元毫秒数（UTC）
- `timestampUtc`：ISO 8601 UTC 字符串

原始提供商字段会被保留，因此不会丢失任何内容。

- Slack：来自 API 的类似纪元时间的字符串
- Discord：UTC ISO 时间戳
- Telegram/WhatsApp：提供商特定的数字/ISO 时间戳

如果你需要本地时间，请在下游使用已知时区进行转换。

## 相关文档

- [系统提示词](/zh-CN/concepts/system-prompt)
- [时区](/zh-CN/concepts/timezone)
- [消息](/zh-CN/concepts/messages)
