---
read_when:
    - 你需要调试会话 ID、转录记录 JSONL，或 `sessions.json` 字段
    - 你正在更改自动压缩行为，或添加“预压缩”清理逻辑
    - 你想要实现内存刷新或静默系统轮次
summary: 深入解析：会话存储 + 转录记录、生命周期，以及（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-04-25T03:06:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: eea076da8eecf01a4d88e6d693d936701beb9e57438ea8bfdeede5a3cb549a43
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# 会话管理与压缩（深入解析）

本文档解释了 OpenClaw 如何端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪内容
- **转录记录持久化**（`*.jsonl`）及其结构
- **转录记录清理**（运行前针对特定提供商的修复）
- **上下文限制**（上下文窗口 vs 跟踪的令牌数）
- **压缩**（手动 + 自动压缩）以及在哪里挂接预压缩工作
- **静默清理**（例如不应产生用户可见输出的内存写入）

如果你想先了解更高层级的概览，请从以下内容开始：

- [/concepts/session](/zh-CN/concepts/session)
- [/concepts/compaction](/zh-CN/concepts/compaction)
- [/concepts/memory](/zh-CN/concepts/memory)
- [/concepts/memory-search](/zh-CN/concepts/memory-search)
- [/concepts/session-pruning](/zh-CN/concepts/session-pruning)
- [/reference/transcript-hygiene](/zh-CN/reference/transcript-hygiene)

---

## 事实来源：Gateway 网关

OpenClaw 的设计围绕一个拥有会话状态的单一 **Gateway 网关进程**。

- UI（macOS 应用、Web Control UI、TUI）应查询 Gateway 网关以获取会话列表和令牌计数。
- 在远程模式下，会话文件位于远程主机上；“检查你本地 Mac 上的文件”并不能反映 Gateway 网关实际使用的内容。

---

## 两层持久化

OpenClaw 通过两层来持久化会话：

1. **会话存储（`sessions.json`）**
   - 键值映射：`sessionKey -> SessionEntry`
   - 体积小、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 id、最近活动时间、开关、令牌计数器等）

2. **转录记录（`<sessionId>.jsonl`）**
   - 采用树结构的仅追加转录记录（条目包含 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于为后续轮次重建模型上下文

---

## 磁盘上的位置

在 Gateway 网关主机上，按智能体分别存储：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录记录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 话题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 存储维护和磁盘控制

会话持久化为 `sessions.json` 和转录记录产物提供了自动维护控制（`session.maintenance`）：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：陈旧条目的保留期限截止时间（默认 `30d`）
- `maxEntries`：`sessions.json` 中的条目上限（默认 `500`）
- `rotateBytes`：当 `sessions.json` 过大时进行轮转（默认 `10mb`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 转录记录归档的保留期（默认：与 `pruneAfter` 相同；`false` 禁用清理）
- `maxDiskBytes`：可选的会话目录空间预算
- `highWaterBytes`：清理后的可选目标值（默认是 `maxDiskBytes` 的 `80%`）

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先删除最旧的归档或孤立转录记录产物。
2. 如果仍高于目标值，则驱逐最旧的会话条目及其转录记录文件。
3. 持续执行，直到使用量小于或等于 `highWaterBytes`。

在 `mode: "warn"` 下，OpenClaw 会报告潜在的驱逐操作，但不会修改存储或文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话和运行日志

隔离的 cron 运行也会创建会话条目和转录记录，并且它们有专用的保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中清理旧的隔离 cron 运行会话（`false` 禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认分别为 `2_000_000` 字节和 `2000` 行）。

---

## 会话键（`sessionKey`）

`sessionKey` 用于标识你处于 _哪个对话桶_ 中（路由 + 隔离）。

常见模式：

- 主/直接聊天（每个智能体）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/渠道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则记录在 [/concepts/session](/zh-CN/concepts/session) 中。

---

## 会话 id（`sessionId`）

每个 `sessionKey` 都指向一个当前的 `sessionId`（持续承接对话的转录记录文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认在 Gateway 网关主机本地时间凌晨 4:00）会在越过重置边界后的下一条消息到来时创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在空闲窗口后有消息到达时创建新的 `sessionId`。如果同时配置了每日重置和空闲过期，则以先到期者为准。
- **线程父级分叉保护**（`session.parentForkMaxTokens`，默认 `100000`）会在父会话已经过大时跳过父转录记录分叉；新线程将从头开始。设为 `0` 可禁用。

实现细节：该决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 会话存储结构（`sessions.json`）

该存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（并非完整列表）：

- `sessionId`：当前转录记录 id（除非设置了 `sessionFile`，否则文件名由此派生）
- `updatedAt`：最近活动时间戳
- `sessionFile`：可选的显式转录记录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`, `subject`, `room`, `space`, `displayName`：用于群组/渠道标签的元数据
- 开关：
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`（按会话覆盖）
- 模型选择：
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- 令牌计数器（尽力而为 / 依赖提供商）：
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`：此会话键完成自动压缩的次数
- `memoryFlushAt`：最近一次预压缩内存刷新的时间戳
- `memoryFlushCompactionCount`：最近一次刷新运行时对应的压缩次数

该存储可安全编辑，但 Gateway 网关才是权威：随着会话运行，它可能会重写或重新填充条目。

---

## 转录记录结构（`*.jsonl`）

转录记录由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

该文件是 JSONL：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选的 `parentSession`）
- 然后：带有 `id` + `parentId` 的会话条目（树结构）

值得注意的条目类型：

- `message`：用户/助手/`toolResult` 消息
- `custom_message`：由扩展注入并且 _会_ 进入模型上下文的消息（可对 UI 隐藏）
- `custom`：_不会_ 进入模型上下文的扩展状态
- `compaction`：持久化的压缩摘要，带有 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：在导航树分支时持久化的摘要

OpenClaw 有意**不**“修复”转录记录；Gateway 网关使用 `SessionManager` 读取/写入它们。

---

## 上下文窗口 vs 跟踪的令牌数

有两个不同的概念需要注意：

1. **模型上下文窗口**：每个模型的硬上限（模型可见的令牌数）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计数据（用于 `/status` 和仪表板）

如果你正在调整限制：

- 上下文窗口来自模型目录（也可通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算/报告值；不要将其视为严格保证。

更多信息，请参见 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会把较早的对话总结为转录记录中持久化的 `compaction` 条目，并保持最近的消息不变。

压缩之后，后续轮次将看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久化的**（不同于会话修剪）。参见 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩分块边界和工具配对

当 OpenClaw 将较长的转录记录拆分为压缩分块时，它会让
助手工具调用与其对应的 `toolResult` 条目保持配对。

- 如果按令牌占比分割的边界落在工具调用和其结果之间，OpenClaw
  会将边界移动到助手工具调用消息处，而不是将这对条目拆开。
- 如果尾部的工具结果块原本会把分块推到超出目标值，
  OpenClaw 会保留这个待处理的工具块，并让未总结的尾部保持完整。
- 已中止/出错的工具调用块不会让待处理分割持续保持打开状态。

---

## 自动压缩何时发生（Pi 运行时）

在嵌入式 Pi 智能体中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded` 以及类似的提供商风格变体）→ 压缩 → 重试。
2. **阈值维护**：在一次成功轮次之后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示词 + 下一次模型输出预留的余量

这些是 Pi 运行时语义（OpenClaw 会消费这些事件，但由 Pi 决定何时压缩）。

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

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会将其提高。
- 默认下限为 `20000` 个令牌。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用该下限。
- 如果它已经更高，OpenClaw 不会更改。
- 手动 `/compact` 会遵循显式的 `agents.defaults.compaction.keepRecentTokens`，
  并保留 Pi 的最近尾部切点。若未显式设置保留预算，
  手动压缩仍然是一个硬检查点，重建后的上下文会从新的摘要开始。

原因：为多轮“清理”工作（如内存写入）预留足够余量，避免在压缩变得不可避免之前就耗尽空间。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 设置为某个已注册的提供商 id 时，safeguard 扩展会将摘要生成委托给该提供商，而不是使用内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 id。留空则使用默认的 LLM 摘要生成。
- 设置 `provider` 会强制使用 `mode: "safeguard"`。
- 提供商接收的压缩指令和标识符保留策略，与内置路径相同。
- safeguard 仍会在提供商输出后保留最近轮次和拆分轮次的后缀上下文。
- 内置的 safeguard 摘要生成会用新消息对先前摘要重新提炼，
  而不是原样保留完整的旧摘要。
- safeguard 模式默认启用摘要质量审计；设置
  `qualityGuard.enabled: false` 可跳过输出格式错误时的重试行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置的 LLM 摘要生成。
- 中止/超时信号会被重新抛出（不会被吞掉），以尊重调用方的取消操作。

源码：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 用户可见的界面

你可以通过以下方式观察压缩和会话状态：

- `/status`（在任何聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩次数

---

## 静默清理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，在这些场景中，用户不应看到中间输出。

约定如下：

- 助手以精确的静默标记 `NO_REPLY` /
  `no_reply` 开始其输出，以表示“不要向用户发送回复”。
- OpenClaw 会在交付层剥离/抑制该标记。
- 对精确静默标记的抑制不区分大小写，因此当整个载荷仅为该静默标记时，`NO_REPLY` 和
  `no_reply` 都会生效。
- 这仅用于真正的后台/不交付轮次；它不是普通可执行用户请求的快捷方式。

从 `2026.1.10` 起，如果某个部分分块以 `NO_REPLY` 开头，OpenClaw 还会抑制**草稿/输入中流式传输**，这样静默操作就不会在轮次中途泄露部分输出。

---

## 预压缩“内存刷新”（已实现）

目标：在自动压缩发生之前，运行一个静默的智能体轮次，将持久状态写入磁盘（例如智能体工作区中的 `memory/YYYY-MM-DD.md`），这样压缩就无法擦除关键上下文。

OpenClaw 使用**阈值前刷新**方法：

1. 监控会话上下文使用量。
2. 当它越过“软阈值”（低于 Pi 的压缩阈值）时，向智能体运行一条静默的
   “现在写入内存”指令。
3. 使用精确的静默标记 `NO_REPLY` / `no_reply`，这样用户将
   看不到任何内容。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（用于刷新轮次的用户消息）
- `systemPrompt`（附加到刷新轮次的额外系统提示词）

说明：

- 默认的 prompt/system prompt 包含 `NO_REPLY` 提示，以抑制
  交付。
- 每个压缩周期只运行一次刷新（在 `sessions.json` 中跟踪）。
- 刷新仅对嵌入式 Pi 会话运行（CLI 后端会跳过它）。
- 当会话工作区为只读时会跳过刷新（`workspaceAccess: "ro"` 或 `"none"`）。
- 有关工作区文件布局和写入模式，请参见 [Memory](/zh-CN/concepts/memory)。

Pi 还会在扩展 API 中公开一个 `session_before_compact` 钩子，但 OpenClaw 的
刷新逻辑目前位于 Gateway 网关端。

---

## 故障排除检查清单

- 会话键不对？从 [/concepts/session](/zh-CN/concepts/session) 开始，并在 `/status` 中确认 `sessionKey`。
- 存储与转录记录不匹配？确认 Gateway 网关主机，以及 `openclaw status` 提供的存储路径。
- 压缩过于频繁？检查：
  - 模型上下文窗口（太小）
  - 压缩设置（对于模型窗口而言，`reserveTokens` 过高可能导致更早压缩）
  - 工具结果膨胀：启用/调整会话修剪
- 静默轮次仍有泄露？确认回复以 `NO_REPLY` 开头（不区分大小写的精确标记），并且你使用的是包含流式抑制修复的构建版本。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
