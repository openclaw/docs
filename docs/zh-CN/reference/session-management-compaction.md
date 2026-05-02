---
read_when:
    - 你需要调试会话 ID、对话记录 JSONL 或 sessions.json 字段
    - 你正在更改自动压缩行为，或添加“压缩前”整理工作
    - 你想实现记忆刷新或静默系统轮次
summary: 深入解析：会话存储 + 记录、生命周期和（自动）压缩内部机制
title: 会话管理深度解析
x-i18n:
    generated_at: "2026-05-02T06:40:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ca8a35210625051f5051e90a18a005d6103bc1d65d356c34f818d2bfc0058c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 在这些方面端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪的内容
- **对话记录持久化**（`*.jsonl`）及其结构
- **对话记录清理**（运行前的提供商特定修正）
- **上下文限制**（上下文窗口与跟踪的令牌）
- **压缩**（手动和自动压缩）以及在何处挂接压缩前工作
- **静默后台维护**（不应产生用户可见输出的记忆写入）

如果你想先了解更高层概览，请从这里开始：

- [会话管理](/zh-CN/concepts/session)
- [压缩](/zh-CN/concepts/compaction)
- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [对话记录清理](/zh-CN/reference/transcript-hygiene)

---

## 事实来源：Gateway 网关

OpenClaw 围绕单个拥有会话状态的 **Gateway 网关进程**设计。

- UI（macOS 应用、Web Control UI、TUI）应向 Gateway 网关查询会话列表和令牌计数。
- 在远程模式下，会话文件位于远程主机上；“检查你的本地 Mac 文件”不会反映 Gateway 网关正在使用的内容。

---

## 两个持久化层

OpenClaw 在两个层中持久化会话：

1. **会话存储（`sessions.json`）**
   - 键/值映射：`sessionKey -> SessionEntry`
   - 小型、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 id、最近活动、开关、令牌计数器等）

2. **对话记录（`<sessionId>.jsonl`）**
   - 带树结构的仅追加对话记录（条目包含 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于为未来轮次重建模型上下文
   - 一旦活动对话记录超过检查点大小上限，就会跳过大型压缩前调试检查点，避免再生成一份巨大的 `.checkpoint.*.jsonl` 副本。

除非界面明确需要任意历史访问，否则 Gateway 网关历史读取器应避免物化整份对话记录。第一页历史、嵌入式聊天历史、重启恢复以及令牌/用量检查使用有界尾部读取。完整对话记录扫描会经过异步对话记录索引，该索引按文件路径加 `mtimeMs`/`size` 缓存，并在并发读取器之间共享。

---

## 磁盘位置

每个智能体在 Gateway 网关主机上：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 对话记录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些位置。

---

## 存储维护和磁盘控制

会话持久化为 `sessions.json`、对话记录工件和轨迹 sidecar 提供自动维护控制（`session.maintenance`）：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：陈旧条目年龄截止值（默认 `30d`）
- `maxEntries`：`sessions.json` 中的条目上限（默认 `500`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 对话记录归档的保留期（默认：与 `pruneAfter` 相同；`false` 禁用清理）
- `maxDiskBytes`：可选的会话目录预算
- `highWaterBytes`：清理后的可选目标（默认是 `maxDiskBytes` 的 `80%`）

普通 Gateway 网关写入会按生产规模上限批量执行 `maxEntries` 清理，因此存储可能会短暂超过配置的上限，直到下一次高水位清理把它重写回上限以内。Gateway 网关启动期间，会话存储读取不会修剪或限制条目；请使用写入或 `openclaw sessions cleanup --enforce` 进行清理。`openclaw sessions cleanup --enforce` 仍会立即应用配置的上限。

维护会保留持久的外部对话指针，例如群组会话和线程范围的聊天会话，但 cron、钩子、Heartbeat、ACP 和子智能体的合成运行时条目在超过配置的年龄、数量或磁盘预算时仍可被移除。

OpenClaw 在 Gateway 网关写入期间不再创建自动 `sessions.json.bak.*` 轮转备份。旧版 `session.maintenance.rotateBytes` 键会被忽略，`openclaw doctor --fix` 会将其从旧配置中移除。

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 首先移除最旧的已归档、孤立对话记录或孤立轨迹工件。
2. 如果仍高于目标，则逐出最旧的会话条目及其对话记录/轨迹文件。
3. 持续执行，直到用量等于或低于 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 会报告潜在逐出项，但不会修改存储/文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话和运行日志

隔离的 cron 运行也会创建会话条目/对话记录，并且它们有专用的保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中修剪旧的隔离 cron 运行会话（`false` 禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会修剪 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认值：`2_000_000` 字节和 `2000` 行）。

当 cron 强制创建新的隔离运行会话时，它会在写入新行之前清理前一个 `cron:<jobId>` 会话条目。它会携带安全偏好，例如 thinking/fast/verbose 设置、标签，以及用户显式选择的模型/认证覆盖。它会丢弃环境中的对话上下文，例如渠道/群组路由、发送或队列策略、提权、来源和 ACP 运行时绑定，因此新的隔离运行不能从较早运行继承过期的投递或运行时权限。

---

## 会话键（`sessionKey`）

`sessionKey` 标识你所在的_对话桶_（路由 + 隔离）。

常见模式：

- 主/直接聊天（按智能体）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/渠道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则记录在 [/concepts/session](/zh-CN/concepts/session)。

---

## 会话 id（`sessionId`）

每个 `sessionKey` 指向一个当前 `sessionId`（继续对话的对话记录文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认 Gateway 网关主机本地时间凌晨 4:00）会在重置边界后的下一条消息上创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在空闲窗口后收到消息时创建新的 `sessionId`。当每日重置和空闲过期都已配置时，先过期者生效。
- **系统事件**（Heartbeat、cron 唤醒、exec 通知、Gateway 网关簿记）可能会修改会话行，但不会延长每日/空闲重置的新鲜度。重置滚动会在构建新提示前丢弃上一会话的已排队系统事件通知。
- **父级分叉策略**在创建线程或子智能体分叉时使用 PI 的活动分支。如果该分支过大，OpenClaw 会用隔离上下文启动子项，而不是失败或继承不可用的历史。大小策略是自动的；旧版 `session.parentForkMaxTokens` 配置会被 `openclaw doctor --fix` 移除。

实现细节：该决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 会话存储 schema（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（并非完整列表）：

- `sessionId`：当前对话记录 id（除非设置了 `sessionFile`，否则文件名由此派生）
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置新鲜度使用它。旧版行可能从 JSONL 会话头派生它。
- `lastInteractionAt`：最近一次真实用户/渠道交互时间戳；空闲重置新鲜度使用它，因此 Heartbeat、cron 和 exec 事件不会让会话保持活动。没有此字段的旧版行会回退到恢复的会话开始时间来判断空闲新鲜度。
- `updatedAt`：最近一次存储行修改时间戳，用于列表、修剪和簿记。它不是每日/空闲重置新鲜度的权威依据。
- `sessionFile`：可选的显式对话记录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：用于群组/渠道标注的元数据
- 开关：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（按会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- 令牌计数器（尽力而为/依赖提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：该会话键完成自动压缩的次数
- `memoryFlushAt`：最近一次压缩前记忆刷新的时间戳
- `memoryFlushCompactionCount`：最近一次刷新运行时的压缩计数

该存储可以安全编辑，但 Gateway 网关是权威来源：它可能会在会话运行时重写或重新补水条目。

---

## 对话记录结构（`*.jsonl`）

对话记录由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

该文件是 JSONL：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选 `parentSession`）
- 随后：带 `id` + `parentId` 的会话条目（树）

重要条目类型：

- `message`：用户/助手/工具结果消息
- `custom_message`：由扩展注入、_会_进入模型上下文的消息（可对 UI 隐藏）
- `custom`：_不会_进入模型上下文的扩展状态
- `compaction`：持久化的压缩摘要，带有 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：导航树分支时持久化的摘要

OpenClaw 有意**不**“修正”对话记录；Gateway 网关使用 `SessionManager` 读写它们。

---

## 上下文窗口与跟踪令牌

有两个不同概念很重要：

1. **模型上下文窗口**：每个模型的硬性上限（模型可见的令牌）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 /status 和仪表盘）

如果你正在调优限制：

- 上下文窗口来自模型目录（并且可通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算/报告值；不要把它当作严格保证。

更多信息请参见 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会把较早的对话摘要到对话记录中持久化的 `compaction` 条目，并保留最近消息不变。

压缩后，未来轮次会看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久的**（不同于会话修剪）。参见 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩块边界和工具配对

当 OpenClaw 将长对话记录拆分为压缩块时，它会保持助手工具调用与对应的 `toolResult` 条目配对。

- 如果按令牌占比分割的位置落在工具调用和其结果之间，OpenClaw 会把边界移动到助手工具调用消息，而不是拆开这对条目。
- 如果尾随工具结果块本来会让块超过目标，OpenClaw 会保留该待处理工具块，并让未摘要的尾部保持完整。
- 已中止/错误的工具调用块不会让待处理分割保持打开。

---

## 自动压缩何时发生（Pi 运行时）

在嵌入式 Pi 智能体中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`，以及类似的提供商形态变体）→ 压缩 → 重试。
2. **阈值维护**：在一个回合成功后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示词 + 下一次模型输出预留的余量

这些是 Pi 运行时语义（OpenClaw 会消费这些事件，但由 Pi 决定何时压缩）。

当设置了 `agents.defaults.compaction.maxActiveTranscriptBytes` 且活跃转录文件达到该大小时，OpenClaw 也可以在打开下一次运行前触发预检本地压缩。这是针对本地重新打开成本的文件大小保护，而不是原始归档：OpenClaw 仍会运行正常的语义压缩，并且它要求启用 `truncateAfterCompaction`，这样压缩后的摘要才能成为新的后继转录。

对于嵌入式 Pi 运行，`agents.defaults.compaction.midTurnPrecheck.enabled: true` 会添加一个可选启用的工具循环保护。在追加工具结果后、下一次模型调用前，OpenClaw 会使用与回合开始时相同的预检预算逻辑来估算提示词压力。如果上下文不再能容纳，保护不会在 Pi 的 `transformContext` 钩子内压缩。它会发出结构化的回合中预检信号，停止当前提示词提交，并让外层运行循环使用现有恢复路径：当截断过大的工具结果足够时就截断，否则触发已配置的压缩模式并重试。该选项默认禁用，并且可与 `default` 和 `safeguard` 压缩模式配合使用，包括由提供商支持的 safeguard 压缩。
这独立于 `maxActiveTranscriptBytes`：字节大小保护在回合打开前运行，而回合中预检会在嵌入式 Pi 工具循环中追加新工具结果后稍后运行。

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

OpenClaw 还会对嵌入式运行强制执行安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会将其提高。
- 默认下限是 `20000` 个 token。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用该下限。
- 如果它已经更高，OpenClaw 会保持不变。
- 手动 `/compact` 会遵循显式的 `agents.defaults.compaction.keepRecentTokens`
  并保留 Pi 的近期尾部截断点。如果没有显式保留预算，
  手动压缩仍是硬检查点，重建后的上下文会从
  新摘要开始。
- 设置 `agents.defaults.compaction.midTurnPrecheck.enabled: true` 可在新工具结果之后、下一次模型
  调用之前运行可选的工具循环预检。这只是一个触发器；摘要生成仍使用已配置的
  压缩路径。它独立于 `maxActiveTranscriptBytes`，后者是一个
  回合开始时的活跃转录字节大小保护。
- 将 `agents.defaults.compaction.maxActiveTranscriptBytes` 设置为字节值或
  `"20mb"` 这样的字符串，可在活跃
  转录变大时于回合前运行本地压缩。此保护仅在同时启用
  `truncateAfterCompaction` 时生效。保持未设置或设为 `0` 可
  禁用。
- 当启用 `agents.defaults.compaction.truncateAfterCompaction` 时，
  OpenClaw 会在压缩后将活跃转录轮换为压缩后的后继 JSONL。
  旧的完整转录会保持归档，并从
  压缩检查点链接，而不是在原处重写。

原因：在压缩变得不可避免之前，为多回合“内务处理”（例如记忆写入）留出足够余量。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（从 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 被设置为已注册的提供商 id 时，safeguard 插件会将摘要生成委托给该提供商，而不是使用内置的 `summarizeInStages` 管线。

- `provider`：已注册压缩提供商插件的 id。保持未设置则使用默认 LLM 摘要生成。
- 设置 `provider` 会强制 `mode: "safeguard"`。
- 提供商会收到与内置路径相同的压缩指令和标识符保留策略。
- safeguard 在提供商输出后仍会保留最近回合和拆分回合的后缀上下文。
- 内置 safeguard 摘要生成会用新消息重新提炼先前摘要，
  而不是逐字保留完整的先前摘要。
- safeguard 模式默认启用摘要质量审计；设置
  `qualityGuard.enabled: false` 可跳过输出格式异常时重试的行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要生成。
- 中止/超时信号会被重新抛出（不会被吞掉），以遵循调用方取消。

来源：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 用户可见界面

你可以通过以下方式观察压缩和会话状态：

- `/status`（在任何聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩次数

---

## 静默内务处理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”回合，这些任务不应让用户看到中间输出。

约定：

- 助手以精确的静默令牌 `NO_REPLY` /
  `no_reply` 开始输出，用来表示“不要向用户交付回复”。
- OpenClaw 会在交付层剥离/抑制它。
- 精确静默令牌抑制不区分大小写，因此当整个载荷只有静默令牌时，`NO_REPLY` 和
  `no_reply` 都会生效。
- 这仅用于真正的后台/不交付回合；它不是处理
  普通可执行用户请求的捷径。

自 `2026.1.10` 起，当
部分分块以 `NO_REPLY` 开头时，OpenClaw 也会抑制**草稿/输入中流式传输**，因此静默操作不会在回合中途泄漏部分
输出。

---

## 压缩前“记忆刷新”（已实现）

目标：在自动压缩发生前，运行一个静默的 agentic 回合，将持久
状态写入磁盘（例如智能体工作区中的 `memory/YYYY-MM-DD.md`），这样压缩不会
擦除关键上下文。

OpenClaw 使用**预阈值刷新**方法：

1. 监控会话上下文用量。
2. 当它越过“软阈值”（低于 Pi 的压缩阈值）时，向智能体运行一条静默
   “立即写入记忆”指令。
3. 使用精确的静默令牌 `NO_REPLY` / `no_reply`，这样用户不会看到
   任何内容。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `model`（可选的精确提供商/模型覆盖，用于刷新回合，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（刷新回合的用户消息）
- `systemPrompt`（为刷新回合追加的额外系统提示词）

注意：

- 默认提示词/系统提示词包含 `NO_REPLY` 提示，用于抑制
  交付。
- 设置 `model` 后，刷新回合会使用该模型，而不会继承
  活跃会话的回退链，因此仅本地的内务处理不会静默
  回退到付费对话模型。
- 每个压缩周期只运行一次刷新（在 `sessions.json` 中跟踪）。
- 刷新仅针对嵌入式 Pi 会话运行（CLI 后端会跳过）。
- 当会话工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时，会跳过刷新。
- 请参阅 [记忆](/zh-CN/concepts/memory) 了解工作区文件布局和写入模式。

Pi 还在插件 API 中公开了 `session_before_compact` 钩子，但 OpenClaw 的
刷新逻辑目前位于 Gateway 网关侧。

---

## 故障排除清单

- 会话键错误？从 [/concepts/session](/zh-CN/concepts/session) 开始，并确认 `/status` 中的 `sessionKey`。
- 存储与转录不匹配？通过 `openclaw status` 确认 Gateway 网关主机和存储路径。
- 压缩刷屏？检查：
  - 模型上下文窗口（太小）
  - 压缩设置（`reserveTokens` 对模型窗口来说过高可能导致更早压缩）
  - 工具结果膨胀：启用/调整会话剪枝
- 静默回合泄漏？确认回复以 `NO_REPLY` 开头（不区分大小写的精确令牌），并且你使用的是包含流式传输抑制修复的构建。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话剪枝](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
