---
read_when:
    - 你需要调试会话 ID、记录 JSONL 或 sessions.json 字段
    - 你正在更改自动压缩行为，或添加“预压缩”内务处理
    - 你想实现记忆刷新或静默系统轮次
summary: 深入解析：会话存储 + 对话记录、生命周期和（自动）压缩内部机制
title: 会话管理深度解析
x-i18n:
    generated_at: "2026-04-28T12:03:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 在以下领域端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪的内容
- **转录记录持久化**（`*.jsonl`）及其结构
- **转录记录卫生处理**（运行前的提供商特定修正）
- **上下文限制**（上下文窗口与已跟踪 token）
- **压缩**（手动压缩和自动压缩）以及在何处接入压缩前工作
- **静默维护**（不应产生用户可见输出的记忆写入）

如果你想先了解更高层概览，请从这里开始：

- [会话管理](/zh-CN/concepts/session)
- [压缩](/zh-CN/concepts/compaction)
- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [转录记录卫生处理](/zh-CN/reference/transcript-hygiene)

---

## 事实来源：Gateway 网关

OpenClaw 围绕单个拥有会话状态的 **Gateway 网关进程**设计。

- UI（macOS 应用、Web Control UI、TUI）应向 Gateway 网关查询会话列表和 token 计数。
- 在远程模式下，会话文件位于远程主机上；“检查你的本地 Mac 文件”不会反映 Gateway 网关正在使用的内容。

---

## 两个持久化层

OpenClaw 在两个层中持久化会话：

1. **会话存储（`sessions.json`）**
   - 键/值映射：`sessionKey -> SessionEntry`
   - 小型、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 ID、最后活动时间、开关、token 计数器等）

2. **转录记录（`<sessionId>.jsonl`）**
   - 仅追加的树结构转录记录（条目包含 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于为后续轮次重建模型上下文
   - 一旦活动转录记录超过检查点大小上限，就会跳过大型压缩前调试检查点，避免生成第二份巨大的 `.checkpoint.*.jsonl` 副本。

---

## 磁盘位置

每个智能体在 Gateway 网关主机上的位置：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录记录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 话题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 存储维护和磁盘控制

会话持久化对 `sessions.json`、转录记录制品和轨迹 sidecar 提供自动维护控制（`session.maintenance`）：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：陈旧条目的年龄截止值（默认 `30d`）
- `maxEntries`：限制 `sessions.json` 中的条目数量（默认 `500`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 转录记录归档的保留时间（默认与 `pruneAfter` 相同；`false` 会禁用清理）
- `maxDiskBytes`：可选的会话目录预算
- `highWaterBytes`：清理后的可选目标值（默认为 `maxDiskBytes` 的 `80%`）

普通 Gateway 网关写入会对生产规模上限批量执行 `maxEntries` 清理，因此存储可能会在下一次高水位清理重写并压回上限前短暂超过配置的上限。`openclaw sessions cleanup --enforce` 仍会立即应用配置的上限。

OpenClaw 不再在 Gateway 网关写入期间自动创建 `sessions.json.bak.*` 轮转备份。旧版 `session.maintenance.rotateBytes` 键会被忽略，并且 `openclaw doctor --fix` 会从旧配置中移除它。

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 优先移除最旧的归档制品、孤立转录记录制品或孤立轨迹制品。
2. 如果仍高于目标值，则逐出最旧的会话条目及其转录记录/轨迹文件。
3. 持续执行，直到用量小于或等于 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 会报告潜在逐出项，但不会修改存储/文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话和运行日志

隔离的 cron 运行也会创建会话条目/转录记录，并且它们有专用的保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中修剪旧的隔离 cron 运行会话（`false` 会禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会修剪 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认值：`2_000_000` 字节和 `2000` 行）。

当 cron 强制创建新的隔离运行会话时，它会在写入新行前清理之前的 `cron:<jobId>` 会话条目。它会带上安全偏好，例如 thinking/fast/verbose 设置、标签，以及用户明确选择的模型/凭证覆盖。它会丢弃环境对话上下文，例如渠道/群组路由、发送或队列策略、提权、来源和 ACP 运行时绑定，因此新的隔离运行无法从旧运行继承过期的投递权限或运行时权限。

---

## 会话键（`sessionKey`）

`sessionKey` 标识你所在的_对话桶_（路由 + 隔离）。

常见模式：

- 主聊天/直接聊天（每个智能体）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/渠道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则记录在 [/concepts/session](/zh-CN/concepts/session)。

---

## 会话 ID（`sessionId`）

每个 `sessionKey` 指向当前 `sessionId`（继续该对话的转录记录文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认在 Gateway 网关主机本地时间凌晨 4:00）会在越过重置边界后的下一条消息创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在空闲窗口后有消息到达时创建新的 `sessionId`。当每日重置和空闲过期都已配置时，先过期者生效。
- **系统事件**（心跳、cron 唤醒、exec 通知、Gateway 网关簿记）可能会修改会话行，但不会延长每日/空闲重置的新鲜度。重置滚转会在构建新提示前丢弃上一会话排队的系统事件通知。
- **线程父级分叉保护**（`session.parentForkMaxTokens`，默认 `100000`）会在父会话已经过大时跳过父转录记录分叉；新线程会重新开始。设置为 `0` 可禁用。

实现细节：该决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 会话存储架构（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（并非完整列表）：

- `sessionId`：当前转录记录 ID（除非设置了 `sessionFile`，否则文件名从它派生）
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置新鲜度使用它。旧版行可能会从 JSONL 会话头派生它。
- `lastInteractionAt`：最后一次真实用户/渠道交互时间戳；空闲重置新鲜度使用它，因此心跳、cron 和 exec 事件不会让会话保持存活。没有此字段的旧版行会回退到恢复出的会话开始时间，用于空闲新鲜度。
- `updatedAt`：最后一次存储行修改时间戳，用于列表展示、修剪和簿记。它不是每日/空闲重置新鲜度的权威来源。
- `sessionFile`：可选的显式转录记录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：用于群组/渠道标注的元数据
- 开关：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（按会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为/依赖提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：该会话键完成自动压缩的次数
- `memoryFlushAt`：上一次压缩前记忆刷新的时间戳
- `memoryFlushCompactionCount`：上一次刷新运行时的压缩计数

存储可以安全编辑，但 Gateway 网关是权威来源：它可能会在会话运行时重写或重新注入条目。

---

## 转录记录结构（`*.jsonl`）

转录记录由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

该文件是 JSONL：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选 `parentSession`）
- 然后是：带 `id` + `parentId` 的会话条目（树）

值得注意的条目类型：

- `message`：用户/助手/工具结果消息
- `custom_message`：插件注入的消息，_会_进入模型上下文（可从 UI 隐藏）
- `custom`：插件状态，_不会_进入模型上下文
- `compaction`：持久化的压缩摘要，包含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：导航树分支时持久化的摘要

OpenClaw 有意**不会**“修正”转录记录；Gateway 网关使用 `SessionManager` 读取/写入它们。

---

## 上下文窗口与已跟踪 token

两个不同概念很重要：

1. **模型上下文窗口**：每个模型的硬性上限（模型可见的 token）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 /status 和仪表板）

如果你正在调整限制：

- 上下文窗口来自模型目录（也可通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算/报告值；不要把它当作严格保证。

更多内容见 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会将较早的对话总结为转录记录中持久化的 `compaction` 条目，并保留最近消息不变。

压缩后，后续轮次会看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久化的**（不同于会话修剪）。见 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩块边界和工具配对

当 OpenClaw 将长转录记录拆分为压缩块时，它会将助手工具调用与对应的 `toolResult` 条目保持配对。

- 如果按 token 占比分割的位置落在工具调用及其结果之间，OpenClaw 会把边界移到助手工具调用消息处，而不是拆开这对条目。
- 如果尾部工具结果块本来会让块超过目标大小，OpenClaw 会保留该待处理工具块，并保持未摘要尾部不变。
- 已中止/错误的工具调用块不会让待处理分割保持打开状态。

---

## 自动压缩何时发生（Pi 运行时）

在嵌入式 Pi 智能体中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误（`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded` 以及类似提供商形态的变体）→ 压缩 → 重试。
2. **阈值维护**：在成功轮次后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示 + 下一次模型输出保留的余量

这些是 Pi 运行时语义（OpenClaw 会消费事件，但由 Pi 决定何时压缩）。

当设置了 `agents.defaults.compaction.maxActiveTranscriptBytes` 且活动转录记录文件达到该大小时，OpenClaw 也可以在打开下一次运行前触发预检本地压缩。这是面向本地重新打开成本的文件大小保护，而不是原始归档：OpenClaw 仍会运行正常的语义压缩，并且它需要 `truncateAfterCompaction`，以便压缩后的摘要可以成为新的后继转录记录。

---

## 压缩设置（`reserveTokens`、`keepRecentTokens`）

Pi 的压缩设置位于 Pi 设置中：

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw 还会为嵌入式运行强制设置安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会将其提高。
- 默认下限是 `20000` 个 token。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用该下限。
- 如果它已经更高，OpenClaw 会保持不变。
- 手动 `/compact` 会遵循显式的 `agents.defaults.compaction.keepRecentTokens`，并保留 Pi 的最近尾部截断点。如果没有显式保留预算，手动压缩仍然是硬检查点，重建后的上下文会从新的摘要开始。
- 将 `agents.defaults.compaction.maxActiveTranscriptBytes` 设置为字节值或类似 `"20mb"` 的字符串，可在活跃转录变大时，于某一轮开始前运行本地压缩。此保护仅在同时启用 `truncateAfterCompaction` 时生效。保持未设置或设为 `0` 可禁用。
- 启用 `agents.defaults.compaction.truncateAfterCompaction` 时，OpenClaw 会在压缩后将活跃转录轮换为一个压缩后的后继 JSONL。旧的完整转录会保持归档状态，并从压缩检查点链接，而不是原地重写。

原因：在压缩不可避免之前，为多轮“清理维护”（例如写入记忆）保留足够余量。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 设置为已注册的提供商 id 时，保护扩展会把摘要生成委托给该提供商，而不是使用内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 id。保持未设置则使用默认 LLM 摘要生成。
- 设置 `provider` 会强制 `mode: "safeguard"`。
- 提供商会收到与内置路径相同的压缩指令和标识符保留策略。
- 保护机制仍会在提供商输出后保留最近轮次和拆分轮次的后缀上下文。
- 内置保护摘要会用新消息重新提炼先前摘要，而不是逐字保留完整的上一份摘要。
- 保护模式默认启用摘要质量审计；设置 `qualityGuard.enabled: false` 可跳过格式异常输出时的重试行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要生成。
- 中止/超时信号会被重新抛出（不会被吞掉），以尊重调用方取消。

来源：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 用户可见界面

你可以通过以下方式观察压缩和会话状态：

- `/status`（任意聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩次数

---

## 静默清理维护（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，用户不应看到其中间输出。

约定：

- 助手以精确的静默 token `NO_REPLY` / `no_reply` 开始输出，表示“不向用户交付回复”。
- OpenClaw 会在交付层剥离/抑制它。
- 精确静默 token 抑制不区分大小写，因此当整个载荷只有静默 token 时，`NO_REPLY` 和 `no_reply` 都会生效。
- 这仅用于真正的后台/不交付轮次；它不是普通可执行用户请求的捷径。

自 `2026.1.10` 起，当部分分块以 `NO_REPLY` 开头时，OpenClaw 也会抑制**草稿/输入中流式传输**，因此静默操作不会在轮次中途泄漏部分输出。

---

## 压缩前“记忆刷新”（已实现）

目标：在自动压缩发生前，运行一个静默的 agentic 轮次，将持久状态写入磁盘（例如 Agent 工作区中的 `memory/YYYY-MM-DD.md`），避免压缩擦除关键上下文。

OpenClaw 使用**预阈值刷新**方案：

1. 监控会话上下文使用量。
2. 当它跨过“软阈值”（低于 Pi 的压缩阈值）时，向智能体运行一条静默的“立即写入记忆”指令。
3. 使用精确静默 token `NO_REPLY` / `no_reply`，让用户看不到任何内容。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `model`（可选的精确提供商/模型覆盖，用于刷新轮次，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（刷新轮次的用户消息）
- `systemPrompt`（为刷新轮次追加的额外系统提示）

说明：

- 默认提示/系统提示包含 `NO_REPLY` 提示，用于抑制交付。
- 设置 `model` 时，刷新轮次会使用该模型，而不会继承活跃会话的回退链，因此仅本地的清理维护不会静默回退到付费对话模型。
- 每个压缩周期只运行一次刷新（记录在 `sessions.json` 中）。
- 刷新仅针对嵌入式 Pi 会话运行（CLI 后端会跳过）。
- 当会话工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时，会跳过刷新。
- 请参阅 [Memory](/zh-CN/concepts/memory) 了解工作区文件布局和写入模式。

Pi 还在扩展 API 中暴露了 `session_before_compact` 钩子，但 OpenClaw 的刷新逻辑目前位于 Gateway 网关侧。

---

## 故障排除检查清单

- 会话键错误？从 [/concepts/session](/zh-CN/concepts/session) 开始，并确认 `/status` 中的 `sessionKey`。
- 存储与转录不匹配？从 `openclaw status` 确认 Gateway 网关主机和存储路径。
- 压缩刷屏？检查：
  - 模型上下文窗口（太小）
  - 压缩设置（`reserveTokens` 对模型窗口来说过高可能导致更早压缩）
  - 工具结果膨胀：启用/调整会话修剪
- 静默轮次泄漏？确认回复以 `NO_REPLY` 开头（不区分大小写的精确 token），并且你使用的构建包含流式传输抑制修复。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
