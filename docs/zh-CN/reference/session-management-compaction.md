---
read_when:
    - 你需要调试会话 id、transcript JSONL 或 `sessions.json` 字段
    - 你正在更改自动压缩行为，或添加“压缩前”清理逻辑
    - 你想实现内存刷新或静默 system 轮次
summary: 深入解析：会话存储 + transcript、生命周期，以及（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-04-27T12:56:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c03f8862e12622edce08aac17f3f766b6de9db890136866b6e9ae6ca0dd8768
    source_path: reference/session-management-compaction.md
    workflow: 15
---

OpenClaw 在以下几个方面对会话进行端到端管理：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪内容
- **transcript 持久化**（`*.jsonl`）及其结构
- **transcript 清理**（运行前按提供商进行修复）
- **上下文限制**（上下文窗口与已跟踪 token）
- **压缩**（手动与自动压缩）以及适合挂接压缩前工作的地方
- **静默清理**（不应产生用户可见输出的内存写入）

如果你想先看更高层的概览，请从以下内容开始：

- [会话管理](/zh-CN/concepts/session)
- [压缩](/zh-CN/concepts/compaction)
- [内存概览](/zh-CN/concepts/memory)
- [内存搜索](/zh-CN/concepts/memory-search)
- [会话清理](/zh-CN/concepts/session-pruning)
- [transcript 清理](/zh-CN/reference/transcript-hygiene)

---

## 事实来源：Gateway 网关

OpenClaw 的设计围绕一个拥有会话状态的**Gateway 网关进程**展开。

- UI（macOS 应用、web Control UI、TUI）应通过 Gateway 网关查询会话列表和 token 计数。
- 在远程模式下，会话文件位于远程主机；“检查你本地 Mac 上的文件”无法反映 Gateway 网关实际使用的内容。

---

## 两层持久化

OpenClaw 以两层方式持久化会话：

1. **会话存储（`sessions.json`）**
   - 键/值映射：`sessionKey -> SessionEntry`
   - 小型、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前 session id、最近活动、开关、token 计数器等）

2. **transcript（`<sessionId>.jsonl`）**
   - 具有树结构的仅追加 transcript（条目含有 `id` + `parentId`）
   - 存储实际会话 + 工具调用 + 压缩摘要
   - 用于为后续轮次重建模型上下文
   - 一旦活动
     transcript 超过检查点大小上限，就会跳过大型压缩前调试检查点，
     以避免生成第二个巨大的 `.checkpoint.*.jsonl` 副本。

---

## 磁盘位置

每个智能体在 Gateway 网关宿主机上的位置：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- transcripts：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 话题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 存储维护与磁盘控制

会话持久化具有针对 `sessions.json` 和 transcript 工件的自动维护控制（`session.maintenance`）：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：陈旧条目的年龄截止值（默认 `30d`）
- `maxEntries`：`sessions.json` 中的条目上限（默认 `500`）
- `rotateBytes`：当 `sessions.json` 过大时进行轮转（默认 `10mb`）
- `resetArchiveRetention`：`*.reset.<timestamp>` transcript 归档的保留期（默认：与 `pruneAfter` 相同；`false` 表示禁用清理）
- `maxDiskBytes`：可选的 sessions 目录预算
- `highWaterBytes`：清理后的可选目标值（默认 `maxDiskBytes` 的 `80%`）

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先删除最旧的归档或孤立 transcript 工件。
2. 如果仍高于目标值，则逐出最旧的会话条目及其 transcript 文件。
3. 持续进行，直到使用量低于或等于 `highWaterBytes`。

在 `mode: "warn"` 下，OpenClaw 会报告可能的逐出项，但不会修改存储/文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话和运行日志

隔离的 cron 运行也会创建会话条目/transcript，并具有专用保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中清理旧的隔离 cron 运行会话（`false` 表示禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认：`2_000_000` 字节和 `2000` 行）。

当 cron 强制创建新的隔离运行会话时，它会在写入新行之前清理之前的
`cron:<jobId>` 会话条目。它会保留安全偏好设置，例如 thinking/fast/verbose 设置、标签以及显式
用户选择的 model/auth 覆盖。它会丢弃环境式会话上下文，例如
channel/group 路由、发送或队列策略、提权、来源和 ACP
运行时绑定，这样新的隔离运行就不会继承旧运行中陈旧的投递或
运行时权限。

---

## 会话键（`sessionKey`）

`sessionKey` 用于标识你处于_哪个会话桶_中（路由 + 隔离）。

常见模式：

- 主/私聊（每个智能体）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/频道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

标准规则记录于 [/concepts/session](/zh-CN/concepts/session)。

---

## 会话 id（`sessionId`）

每个 `sessionKey` 都指向一个当前 `sessionId`（继续该会话的 transcript 文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认是 Gateway 网关宿主机本地时间凌晨 4:00）会在越过重置边界后的下一条消息时创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在消息于空闲窗口后到达时创建新的 `sessionId`。如果同时配置了每日 + 空闲，则先到期者优先。
- **系统事件**（心跳、cron 唤醒、exec 通知、Gateway 网关记账）可能会修改会话行，但不会延长每日/空闲重置的新鲜度。重置切换会在构建新的 prompt 之前丢弃前一个会话中已排队的系统事件通知。
- **线程父级分叉保护**（`session.parentForkMaxTokens`，默认 `100000`）会在父会话已过大时跳过父 transcript 分叉；新线程将从头开始。设为 `0` 可禁用。

实现细节：该决定发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 会话存储 schema（`sessions.json`）

该存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（非穷尽）：

- `sessionId`：当前 transcript id（除非设置了 `sessionFile`，否则文件名由此派生）
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置
  新鲜度依赖它。旧版行可能从 JSONL 会话头中推导出该值。
- `lastInteractionAt`：最后一次真实用户/渠道交互的时间戳；空闲重置
  新鲜度依赖它，因此心跳、cron 和 exec 事件不会让会话保持活跃。缺少此字段的旧版行会回退到恢复出的会话开始时间作为空闲新鲜度依据。
- `updatedAt`：最后一次存储行变更的时间戳，用于列表、清理和
  记账。它不是每日/空闲重置新鲜度的权威依据。
- `sessionFile`：可选的显式 transcript 路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：用于群组/渠道标签的元数据
- 开关：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- token 计数器（尽力而为 / 与提供商相关）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：该会话键完成自动压缩的次数
- `memoryFlushAt`：最近一次压缩前内存刷新时间戳
- `memoryFlushCompactionCount`：上一次刷新运行时对应的压缩计数

该存储可安全编辑，但 Gateway 网关才是权威：随着会话运行，它可能会重写或重新水合条目。

---

## transcript 结构（`*.jsonl`）

transcript 由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

该文件是 JSONL：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选的 `parentSession`）
- 之后：带有 `id` + `parentId` 的会话条目（树）

值得注意的条目类型：

- `message`：user/assistant/toolResult 消息
- `custom_message`：由扩展注入且_会_进入模型上下文的消息（可对 UI 隐藏）
- `custom`：_不会_进入模型上下文的扩展状态
- `compaction`：持久化的压缩摘要，带有 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：导航树分支时持久化的摘要

OpenClaw 有意**不**对 transcript 做“修复”；Gateway 网关使用 `SessionManager` 读写它们。

---

## 上下文窗口与已跟踪 token

这里涉及两个不同概念：

1. **模型上下文窗口**：每个模型的硬上限（模型可见的 token）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 /status 和仪表盘）

如果你在调整限制：

- 上下文窗口来自模型目录（也可以通过配置覆盖）。
- 存储中的 `contextTokens` 是一个运行时估计/报告值；不要把它当作严格保证。

更多内容请参见 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会将较早的会话内容总结为 transcript 中持久化的 `compaction` 条目，并保留最近的消息不变。

压缩后，后续轮次会看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久化的**（不同于会话清理）。请参见 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩分块边界与工具配对

当 OpenClaw 将较长 transcript 切分为压缩分块时，它会保持
assistant 工具调用与其匹配的 `toolResult` 条目配对。

- 如果 token 占比分割点恰好落在工具调用与其结果之间，OpenClaw
  会将边界移到 assistant 工具调用消息处，而不是拆开这对条目。
- 如果尾部工具结果块原本会让分块超过目标大小，OpenClaw
  会保留这个待处理工具块，并保持未摘要化的尾部内容完整。
- 已中止/报错的工具调用块不会让待处理分割一直保持打开状态。

---

## 自动压缩何时发生（Pi 运行时）

在内置 Pi 智能体中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded` 以及类似的提供商特定变体）→ 压缩 → 重试。
2. **阈值维护**：在某次轮次成功后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为 prompt + 下一次模型输出保留的余量 token

这些是 Pi 运行时语义（OpenClaw 会消费这些事件，但由 Pi 决定何时压缩）。

当设置了 `agents.defaults.compaction.maxActiveTranscriptBytes` 且活动 transcript 文件达到该大小时，OpenClaw 还可以在打开下一次运行前触发一次本地预检压缩。这是针对本地重新打开成本的文件大小保护，而不是原始归档：OpenClaw 仍然会执行正常的语义压缩，并且它要求启用 `truncateAfterCompaction`，这样压缩后的摘要才能成为新的后继 transcript。

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

OpenClaw 还会对内置运行施加一个安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会将其提高。
- 默认下限是 `20000` tokens。
- 将 `agents.defaults.compaction.reserveTokensFloor: 0` 设为 `0` 可禁用该下限。
- 如果它本来就更高，OpenClaw 不会改动。
- 手动 `/compact` 会遵循显式的 `agents.defaults.compaction.keepRecentTokens`，
  并保留 Pi 的最近尾部截断点。若没有显式保留预算，
  手动压缩仍然是一个硬检查点，重建后的上下文会从
  新摘要开始。
- 将 `agents.defaults.compaction.maxActiveTranscriptBytes` 设置为字节值或
  类似 `"20mb"` 的字符串，可在活动 transcript 变大时，于轮次开始前
  运行本地压缩。该保护仅在
  同时启用 `truncateAfterCompaction` 时生效。保持未设置或设为 `0` 可
  禁用。
- 启用 `agents.defaults.compaction.truncateAfterCompaction` 后，
  OpenClaw 会在压缩后将活动 transcript 轮转为一个压缩后的后继 JSONL。
  旧的完整 transcript 会保留为归档，并从压缩检查点链接，
  而不是被原地重写。

原因：在压缩不可避免之前，为多轮“清理”操作（如内存写入）预留足够余量。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 设置为某个已注册提供商 id 时，safeguard 扩展会将摘要生成委托给该提供商，而不是使用内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 id。未设置时使用默认 LLM 摘要。
- 设置 `provider` 会强制使用 `mode: "safeguard"`。
- 提供商会接收与内置路径相同的压缩指令和标识符保留策略。
- safeguard 仍会在提供商输出之后保留最近轮次和分割轮次的后缀上下文。
- 内置 safeguard 摘要会使用新消息重新提炼先前摘要，
  而不是原样保留完整的旧摘要。
- safeguard 模式默认启用摘要质量审计；设置
  `qualityGuard.enabled: false` 可跳过“输出格式错误时重试”的行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要。
- 中止/超时信号会被重新抛出（不会吞掉），以遵守调用方取消请求。

源码：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 面向用户的可见界面

你可以通过以下方式观察压缩和会话状态：

- `/status`（任意聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩计数

---

## 静默清理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，在这些场景中用户不应看到中间输出。

约定：

- assistant 以精确的静默标记 `NO_REPLY` /
  `no_reply` 开始输出，以表示“不要向用户发送回复”。
- OpenClaw 会在投递层剥离/抑制该标记。
- 精确静默标记的抑制不区分大小写，因此当整个负载仅为该静默标记时，
  `NO_REPLY` 和
  `no_reply` 都会生效。
- 这仅适用于真正的后台/不投递轮次；它不是
  普通可执行用户请求的快捷方式。

自 `2026.1.10` 起，当某个
部分分块以 `NO_REPLY` 开头时，OpenClaw 还会抑制**草稿/输入中流式传输**，这样静默操作就不会在轮次中途泄露部分输出。

---

## 压缩前“内存刷新”（已实现）

目标：在自动压缩发生之前，运行一次静默的智能体轮次，将持久状态写入磁盘（例如智能体工作区中的 `memory/YYYY-MM-DD.md`），以便压缩不会
抹去关键上下文。

OpenClaw 使用**阈值前刷新**方法：

1. 监控会话上下文使用量。
2. 当其跨过一个“软阈值”（低于 Pi 的压缩阈值）时，运行一条静默的
   “立即写入内存”指令给智能体。
3. 使用精确静默标记 `NO_REPLY` / `no_reply`，使用户
   什么也看不到。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（刷新轮次的用户消息）
- `systemPrompt`（附加到刷新轮次的额外 system prompt）

说明：

- 默认的 prompt/system prompt 包含一个 `NO_REPLY` 提示，用于抑制
  投递。
- 每个压缩周期只运行一次刷新（在 `sessions.json` 中跟踪）。
- 刷新仅对内置 Pi 会话运行（CLI 后端会跳过）。
- 当会话工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时，会跳过刷新。
- 工作区文件布局和写入模式请参见 [Memory Wiki](/zh-CN/concepts/memory)。

Pi 也在扩展 API 中暴露了一个 `session_before_compact` 钩子，但 OpenClaw 的
刷新逻辑目前仍位于 Gateway 网关侧。

---

## 故障排除清单

- 会话键错误？请先查看 [/concepts/session](/zh-CN/concepts/session)，并确认 `/status` 中的 `sessionKey`。
- 存储与 transcript 不匹配？请确认 Gateway 网关宿主机以及 `openclaw status` 显示的存储路径。
- 压缩过于频繁？请检查：
  - 模型上下文窗口（是否过小）
  - 压缩设置（对于模型窗口来说，`reserveTokens` 过高可能导致更早压缩）
  - tool-result 膨胀：启用/调整会话清理
- 静默轮次泄露？请确认回复以 `NO_REPLY` 开头（精确标记，不区分大小写），并且你使用的是包含流式抑制修复的构建版本。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话清理](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
