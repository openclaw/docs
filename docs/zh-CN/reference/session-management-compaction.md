---
read_when:
    - 你需要调试会话 id、转录 JSONL 或 `sessions.json` 字段。
    - 你正在更改自动压缩行为，或添加“压缩前”清理逻辑。
    - 你想实现内存刷新或静默系统回合。
summary: 深入解析：会话存储 + 转录、生命周期，以及（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-04-25T05:56:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

本页解释 OpenClaw 如何端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪内容
- **转录持久化**（`*.jsonl`）及其结构
- **转录清理**（运行前针对不同提供商的特定修正）
- **上下文限制**（上下文窗口与已跟踪 token）
- **压缩**（手动 + 自动压缩）以及应在何处挂接压缩前工作
- **静默清理**（例如不应产生用户可见输出的内存写入）

如果你想先看更高层的概览，请从以下内容开始：

- [会话管理](/zh-CN/concepts/session)
- [压缩](/zh-CN/concepts/compaction)
- [内存概览](/zh-CN/concepts/memory)
- [内存搜索](/zh-CN/concepts/memory-search)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [转录清理](/zh-CN/reference/transcript-hygiene)

---

## 真实来源：Gateway 网关

OpenClaw 围绕一个单一的 **Gateway 网关进程** 设计，它负责持有会话状态。

- UI（macOS 应用、Web Control UI、TUI）应向 Gateway 网关查询会话列表和 token 计数。
- 在远程模式下，会话文件位于远程主机上；“检查你本地 Mac 上的文件”并不能反映 Gateway 网关 实际使用的内容。

---

## 两层持久化

OpenClaw 通过两层来持久化会话：

1. **会话存储（`sessions.json`）**
   - 键值映射：`sessionKey -> SessionEntry`
   - 小型、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 id、最近活动、切换项、token 计数器等）

2. **转录（`<sessionId>.jsonl`）**
   - 带树状结构的仅追加转录（条目具有 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于为后续回合重建模型上下文

---

## 磁盘位置

在 Gateway 网关主机上，按智能体划分：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 存储维护与磁盘控制

会话持久化为 `sessions.json` 和转录产物提供了自动维护控制（`session.maintenance`）：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：陈旧条目的存活时间截止值（默认 `30d`）
- `maxEntries`：`sessions.json` 中的条目上限（默认 `500`）
- `rotateBytes`：当 `sessions.json` 过大时进行轮转（默认 `10mb`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留时间（默认：与 `pruneAfter` 相同；`false` 表示禁用清理）
- `maxDiskBytes`：可选的会话目录预算
- `highWaterBytes`：清理后的可选目标值（默认是 `maxDiskBytes` 的 `80%`）

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先删除最旧的归档或孤立转录产物。
2. 如果仍高于目标值，则驱逐最旧的会话条目及其转录文件。
3. 持续执行，直到使用量小于或等于 `highWaterBytes`。

在 `mode: "warn"` 下，OpenClaw 会报告潜在的驱逐操作，但不会修改存储/文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话与运行日志

隔离的 cron 运行也会创建会话条目/转录，并且它们有专门的保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中修剪旧的隔离 cron 运行会话（`false` 表示禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会修剪 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认值分别为 `2_000_000` 字节和 `2000` 行）。

当 cron 强制创建新的隔离运行会话时，它会在写入新行之前清理旧的
`cron:<jobId>` 会话条目。它会保留安全的偏好设置，例如 thinking/fast/verbose 设置、标签以及用户明确选择的模型/auth 覆盖。它会丢弃环境对话上下文，例如渠道/群组路由、发送或队列策略、提权、来源和 ACP 运行时绑定，这样新的隔离运行就不会继承旧运行中过期的传递或运行时权限。

---

## 会话键（`sessionKey`）

`sessionKey` 用于标识你处于哪个 _对话桶_ 中（路由 + 隔离）。

常见模式：

- 主/直接聊天（按智能体）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/渠道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则记录在 [/concepts/session](/zh-CN/concepts/session)。

---

## 会话 id（`sessionId`）

每个 `sessionKey` 都指向一个当前 `sessionId`（持续该对话的转录文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认在 Gateway 网关主机本地时间凌晨 4:00）会在越过重置边界后的下一条消息时创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在消息于空闲窗口之后到达时创建新的 `sessionId`。当每日重置与空闲过期同时配置时，以先到期者为准。
- **线程父级分叉保护**（`session.parentForkMaxTokens`，默认 `100000`）会在父会话已过大时跳过父转录分叉；新线程将从头开始。设置为 `0` 可禁用。

实现细节：此决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 会话存储 schema（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（非完整列表）：

- `sessionId`：当前转录 id（除非设置了 `sessionFile`，否则文件名由此派生）
- `updatedAt`：最近活动时间戳
- `sessionFile`：可选的显式转录路径覆盖
- `chatType`：`direct | group | room`（有助于 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：用于群组/渠道标签的元数据
- 切换项：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（按会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- token 计数器（尽力而为 / 依赖提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：该 `sessionKey` 完成自动压缩的次数
- `memoryFlushAt`：最近一次压缩前内存刷新时间戳
- `memoryFlushCompactionCount`：最近一次刷新运行时的压缩计数

该存储可安全编辑，但 Gateway 网关 才是权威：随着会话运行，它可能会重写或重新填充条目。

---

## 转录结构（`*.jsonl`）

转录由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

文件采用 JSONL 格式：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选的 `parentSession`）
- 之后：带有 `id` + `parentId` 的会话条目（树结构）

值得注意的条目类型：

- `message`：用户/助手/toolResult 消息
- `custom_message`：由扩展注入、且 _会_ 进入模型上下文的消息（可在 UI 中隐藏）
- `custom`：_不会_ 进入模型上下文的扩展状态
- `compaction`：持久化的压缩摘要，带有 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：在导航树分支时持久化的摘要

OpenClaw 有意 **不** “修正”转录；Gateway 网关 使用 `SessionManager` 读写它们。

---

## 上下文窗口与已跟踪 token

这里有两个不同但都重要的概念：

1. **模型上下文窗口**：每个模型的硬上限（模型可见的 token）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计信息（用于 `/status` 和仪表盘）

如果你要调优限制：

- 上下文窗口来自模型目录（并且可以通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算/报告值；不要把它当作严格保证。

更多信息，请参见 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会把较早的对话总结成转录中的持久化 `compaction` 条目，并保留最近消息不变。

压缩后，后续回合会看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久化的**（不同于会话修剪）。参见 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩分块边界与工具配对

当 OpenClaw 将较长的转录拆分为多个压缩分块时，它会保持
助手工具调用与其匹配的 `toolResult` 条目成对出现。

- 如果 token 占比分割点恰好落在工具调用和其结果之间，OpenClaw
  会将边界移动到助手工具调用消息，而不是将这一对拆开。
- 如果尾部的 tool-result 块本来会把分块推到超出目标大小，
  OpenClaw 会保留这个待处理工具块，并保持未总结的尾部完整。
- 已中止/出错的工具调用块不会阻止待处理分割继续进行。

---

## 自动压缩何时发生（Pi 运行时）

在内嵌 Pi 智能体中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`，以及类似的提供商风格变体）→ 压缩 → 重试。
2. **阈值维护**：在成功回合之后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示词 + 下一次模型输出预留的余量

这些属于 Pi 运行时语义（OpenClaw 会消费这些事件，但由 Pi 决定何时压缩）。

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

OpenClaw 还会为内嵌运行强制设置一个安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会将其提高。
- 默认下限为 `20000` token。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用该下限。
- 如果它本来就更高，OpenClaw 会保持不变。
- 手动 `/compact` 会遵循显式的 `agents.defaults.compaction.keepRecentTokens`
  并保留 Pi 最近尾部截断点。若未显式设置保留预算，
  手动压缩仍然是一个硬检查点，重建后的上下文将从新的摘要开始。

原因：在压缩变得不可避免之前，为多回合“清理”工作（例如内存写入）留出足够余量。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 设置为已注册的提供商 id 时，保护扩展会将摘要生成委托给该提供商，而不是使用内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 id。不设置时使用默认 LLM 摘要。
- 设置 `provider` 会强制使用 `mode: "safeguard"`。
- 提供商会接收与内置路径相同的压缩指令和标识符保留策略。
- 在提供商输出之后，safeguard 仍会保留最近回合和拆分回合的后缀上下文。
- 内置 safeguard 摘要会使用新消息重新提炼先前的摘要，
  而不是逐字保留完整旧摘要。
- safeguard 模式默认启用摘要质量审计；设置
  `qualityGuard.enabled: false` 可跳过“输出格式错误时重试”行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要。
- 中止/超时信号会被重新抛出（不会被吞掉），以遵循调用方取消操作。

来源：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 用户可见界面

你可以通过以下方式观察压缩和会话状态：

- `/status`（在任何聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩计数

---

## 静默清理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”回合，在这些场景中用户不应看到中间输出。

约定：

- 助手会以精确的静默 token `NO_REPLY` /
  `no_reply` 开始其输出，以表示“不要向用户传递回复”。
- OpenClaw 会在传递层剥离/抑制这一内容。
- 对精确静默 token 的抑制是大小写不敏感的，因此当整个载荷仅包含这个静默 token 时，`NO_REPLY` 和
  `no_reply` 都会生效。
- 这仅适用于真正的后台/无传递回合；它不是普通可执行用户请求的快捷方式。

从 `2026.1.10` 开始，如果部分分块以 `NO_REPLY` 开头，OpenClaw 还会抑制**草稿/输入中流式传输**，这样静默操作就不会在回合中途泄露部分输出。

---

## 压缩前“内存刷新”（已实现）

目标：在自动压缩发生之前，运行一个静默的智能体回合，将持久状态写入磁盘（例如智能体工作区中的 `memory/YYYY-MM-DD.md`），这样压缩就无法抹掉关键上下文。

OpenClaw 使用**阈值前刷新**方法：

1. 监控会话上下文使用量。
2. 当其越过一个“软阈值”（低于 Pi 的压缩阈值）时，向智能体运行一个静默的
   “立即写入内存”指令。
3. 使用精确的静默 token `NO_REPLY` / `no_reply`，这样用户
   看不到任何内容。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（用于刷新回合的用户消息）
- `systemPrompt`（附加到刷新回合的额外系统提示词）

说明：

- 默认的 prompt/systemPrompt 包含 `NO_REPLY` 提示，以抑制
  传递。
- 每个压缩周期只运行一次刷新（在 `sessions.json` 中跟踪）。
- 仅对内嵌 Pi 会话运行刷新（CLI 后端会跳过）。
- 当会话工作区为只读时（`workspaceAccess: "ro"` 或 `"none"`），会跳过刷新。
- 工作区文件布局和写入模式请参见[内存](/zh-CN/concepts/memory)。

Pi 也会在扩展 API 中暴露 `session_before_compact` 钩子，但目前 OpenClaw 的刷新逻辑位于 Gateway 网关 侧。

---

## 故障排除清单

- 会话键不对？先查看 [/concepts/session](/zh-CN/concepts/session)，并在 `/status` 中确认 `sessionKey`。
- 存储与转录不匹配？确认 Gateway 网关主机，以及 `openclaw status` 中的存储路径。
- 压缩过于频繁？请检查：
  - 模型上下文窗口（是否过小）
  - 压缩设置（对于模型窗口来说，`reserveTokens` 过高会导致更早压缩）
  - tool-result 膨胀：启用/调优会话修剪
- 静默回合仍然泄露？请确认回复以 `NO_REPLY` 开头（大小写不敏感的精确 token），并且你使用的是包含流式抑制修复的构建版本。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
