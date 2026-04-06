---
read_when:
    - 你需要调试 session id、transcript JSONL 或 sessions.json 字段
    - 你正在修改自动压缩行为，或添加“压缩前”清理逻辑
    - 你想实现 memory flush 或静默 system turn
summary: 深入解析：会话存储 + transcript、生命周期，以及（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-04-06T12:45:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# 会话管理与压缩（深入解析）

本文档解释 OpenClaw 如何端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪内容
- **Transcript 持久化**（`*.jsonl`）及其结构
- **Transcript 清理**（运行前针对特定提供商的修正）
- **上下文限制**（上下文窗口与已跟踪 token 的区别）
- **压缩**（手动 + 自动压缩）以及应在何处挂接压缩前工作
- **静默清理**（例如不应产生用户可见输出的 memory 写入）

如果你想先看更高层级的概览，请从以下内容开始：

- [/concepts/session](/zh-CN/concepts/session)
- [/concepts/compaction](/zh-CN/concepts/compaction)
- [/concepts/memory](/zh-CN/concepts/memory)
- [/concepts/memory-search](/zh-CN/concepts/memory-search)
- [/concepts/session-pruning](/zh-CN/concepts/session-pruning)
- [/reference/transcript-hygiene](/zh-CN/reference/transcript-hygiene)

---

## 单一事实来源：Gateway 网关

OpenClaw 的设计围绕单个**Gateway 网关 进程**展开，由它持有会话状态。

- UI（macOS 应用、网页 Control UI、TUI）应向 Gateway 网关 查询会话列表和 token 计数。
- 在远程模式下，会话文件位于远程主机上；“查看你本地 Mac 上的文件”并不能反映 Gateway 网关 实际使用的内容。

---

## 两层持久化

OpenClaw 以两层方式持久化会话：

1. **会话存储（`sessions.json`）**
   - 键 / 值映射：`sessionKey -> SessionEntry`
   - 体积小、可变、安全可编辑（或删除条目）
   - 跟踪会话元数据（当前 session id、最近活动时间、开关、token 计数器等）

2. **Transcript（`<sessionId>.jsonl`）**
   - 追加写入的 transcript，带树结构（条目具有 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于为后续轮次重建模型上下文

---

## 磁盘上的位置

每个智能体在 Gateway 网关 主机上的位置：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 话题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 存储维护和磁盘控制

会话持久化为 `sessions.json` 和 transcript 工件提供了自动维护控制（`session.maintenance`）：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：陈旧条目的保留期限截止值（默认 `30d`）
- `maxEntries`：`sessions.json` 中条目上限（默认 `500`）
- `rotateBytes`：当 `sessions.json` 过大时进行轮转（默认 `10mb`）
- `resetArchiveRetention`：`*.reset.<timestamp>` transcript 归档的保留期（默认与 `pruneAfter` 相同；`false` 表示禁用清理）
- `maxDiskBytes`：可选的 sessions 目录预算
- `highWaterBytes`：清理后的可选目标值（默认是 `maxDiskBytes` 的 `80%`）

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先移除最旧的归档或孤立 transcript 工件。
2. 如果仍高于目标值，则逐出最旧的会话条目及其 transcript 文件。
3. 持续执行，直到占用量小于或等于 `highWaterBytes`。

在 `mode: "warn"` 下，OpenClaw 会报告潜在的逐出项，但不会修改存储 / 文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话和运行日志

隔离的 cron 运行也会创建会话条目 / transcript，并且它们有专门的保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中清理旧的隔离 cron 运行会话（`false` 表示禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会裁剪 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认：`2_000_000` 字节和 `2000` 行）。

---

## 会话键（`sessionKey`）

`sessionKey` 用于标识你所在的_哪个会话桶_（路由 + 隔离）。

常见模式：

- 主 / 直接聊天（每个智能体）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间 / 渠道（Discord / Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则记录在 [/concepts/session](/zh-CN/concepts/session)。

---

## 会话 id（`sessionId`）

每个 `sessionKey` 都会指向当前的 `sessionId`（用于延续对话的 transcript 文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认是 Gateway 网关 主机本地时间凌晨 4:00）会在越过重置边界后的下一条消息时创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在消息于空闲窗口之后到达时创建新的 `sessionId`。如果同时配置了 daily 和 idle，以先过期者为准。
- **线程父级分叉保护**（`session.parentForkMaxTokens`，默认 `100000`）会在父会话已经过大时跳过父 transcript 分叉；新线程会从头开始。设置为 `0` 可禁用。

实现细节：这一决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 会话存储结构（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（非完整列表）：

- `sessionId`：当前 transcript id（除非设置了 `sessionFile`，否则文件名从这里派生）
- `updatedAt`：最近活动时间戳
- `sessionFile`：可选的显式 transcript 路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：用于群组 / 渠道标签的元数据
- 开关：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（按会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为 / 取决于提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：该会话键完成自动压缩的次数
- `memoryFlushAt`：最近一次压缩前 memory flush 的时间戳
- `memoryFlushCompactionCount`：最近一次 flush 运行时的压缩计数

这个存储可以安全编辑，但 Gateway 网关 才是权威：随着会话运行，它可能会重写或重新填充条目。

---

## Transcript 结构（`*.jsonl`）

Transcripts 由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

该文件采用 JSONL 格式：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选的 `parentSession`）
- 后续内容：带 `id` + `parentId` 的会话条目（树结构）

值得注意的条目类型：

- `message`：用户 / 助手 / `toolResult` 消息
- `custom_message`：由扩展注入的、_会_进入模型上下文的消息（可对 UI 隐藏）
- `custom`：_不会_进入模型上下文的扩展状态
- `compaction`：持久化的压缩摘要，带 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：在导航树分支时持久化的摘要

OpenClaw 有意**不会**“修正” transcripts；Gateway 网关 使用 `SessionManager` 来读写它们。

---

## 上下文窗口与已跟踪 token

有两个不同的概念很重要：

1. **模型上下文窗口**：每个模型的硬性上限（模型可见的 token）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计值（用于 `/status` 和仪表盘）

如果你要调优限制：

- 上下文窗口来自模型目录（并且可通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算 / 报告值；不要把它当作严格保证。

更多信息见 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会将较早的对话总结为 transcript 中一个持久化的 `compaction` 条目，并保留最近的消息不变。

压缩之后，后续轮次会看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久化的**（不同于会话裁剪）。参见 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩分块边界和工具配对

当 OpenClaw 将较长 transcript 拆分为压缩分块时，它会让助手工具调用与其匹配的 `toolResult` 条目保持配对。

- 如果按 token 占比分割的边界落在工具调用和其结果之间，OpenClaw 会将边界移动到助手工具调用消息，而不是把这一对拆开。
- 如果尾部的工具结果块原本会让分块超过目标大小，OpenClaw 会保留该待处理工具块，并保持未总结的尾部不变。
- 已中止 / 出错的工具调用块不会让待处理分割一直保持打开状态。

---

## 自动压缩何时发生（Pi 运行时）

在嵌入式 Pi 智能体中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`，以及类似的提供商格式变体）→ 压缩 → 重试。
2. **阈值维护**：在一次成功轮次之后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示词 + 下一次模型输出保留的余量

这些是 Pi 运行时语义（OpenClaw 会消费这些事件，但何时压缩由 Pi 决定）。

---

## 压缩设置（`reserveTokens`、`keepRecentTokens`）

Pi 的压缩设置位于 Pi settings 中：

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw 还会为嵌入式运行强制执行一个安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会提升它。
- 默认下限是 `20000` token。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用该下限。
- 如果它本来就更高，OpenClaw 不会改动。

原因：在压缩变得不可避免之前，为多轮“清理”操作（例如 memory 写入）保留足够的余量。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 用户可见界面

你可以通过以下方式观察压缩和会话状态：

- `/status`（在任意聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩计数

---

## 静默清理（`NO_REPLY`）

OpenClaw 支持“静默”轮次，用于用户不应看到中间输出的后台任务。

约定：

- 助手以精确的静默 token `NO_REPLY` /
  `no_reply` 开始其输出，以表示“不要向用户发送回复”。
- OpenClaw 会在发送层剥离 / 抑制它。
- 对精确静默 token 的抑制不区分大小写，因此当整个负载仅为该静默 token 时，`NO_REPLY` 和
  `no_reply` 都算。
- 这仅用于真正的后台 / 不投递轮次；它不是普通可执行用户请求的快捷方式。

自 `2026.1.10` 起，OpenClaw 在部分分块以 `NO_REPLY` 开头时，也会抑制**草稿 / 输入中流式传输**，这样静默操作就不会在轮次中途泄露部分输出。

---

## 压缩前 “memory flush”（已实现）

目标：在自动压缩发生之前，运行一次静默的智能体轮次，将持久状态写入磁盘（例如智能体工作区中的 `memory/YYYY-MM-DD.md`），这样压缩就无法抹掉关键上下文。

OpenClaw 使用**阈值前 flush** 方法：

1. 监控会话上下文使用量。
2. 当它越过一个“软阈值”（低于 Pi 的压缩阈值）时，向智能体运行一个静默的
   “立即写入 memory” 指令。
3. 使用精确的静默 token `NO_REPLY` / `no_reply`，这样用户就
   看不到任何内容。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（用于 flush 轮次的用户消息）
- `systemPrompt`（附加到 flush 轮次的额外系统提示词）

说明：

- 默认 prompt / system prompt 包含 `NO_REPLY` 提示，以抑制
  发送。
- 每个压缩周期只运行一次 flush（记录在 `sessions.json` 中）。
- Flush 仅对嵌入式 Pi 会话运行（CLI 后端会跳过）。
- 当会话工作区为只读时会跳过 flush（`workspaceAccess: "ro"` 或 `"none"`）。
- 关于工作区文件布局和写入模式，请参见 [Memory](/zh-CN/concepts/memory)。

Pi 也会在扩展 API 中暴露一个 `session_before_compact` hook，但 OpenClaw 的
flush 逻辑目前位于 Gateway 网关 侧。

---

## 故障排除清单

- 会话键不对？从 [/concepts/session](/zh-CN/concepts/session) 开始，并在 `/status` 中确认 `sessionKey`。
- 存储与 transcript 不匹配？确认 Gateway 网关 主机，以及 `openclaw status` 中的存储路径。
- 压缩刷屏？检查：
  - 模型上下文窗口（是否太小）
  - 压缩设置（对于模型窗口来说，`reserveTokens` 过高会导致更早压缩）
  - `toolResult` 膨胀：启用 / 调整会话裁剪
- 静默轮次泄露了输出？确认回复以 `NO_REPLY` 开头（大小写不敏感的精确 token），并且你使用的是包含流式抑制修复的构建版本。
