---
read_when:
    - 你需要调试会话 ID、转录 JSONL 或 sessions.json 字段
    - 你正在更改自动压缩行为，或添加“预压缩”内务处理
    - 你想实现记忆刷新或静默系统轮次
summary: 深入解析：会话存储 + 转录记录、生命周期和（自动）压缩内部机制
title: 会话管理深度解析
x-i18n:
    generated_at: "2026-07-04T20:25:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 在以下领域端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪内容
- **转录持久化**（`*.jsonl`）及其结构
- **转录整理**（运行前的提供商特定修正）
- **上下文限制**（上下文窗口与已跟踪 token）
- **压缩**（手动和自动压缩）以及预压缩工作的挂接位置
- **静默内务处理**（不应产生用户可见输出的记忆写入）

如果你想先看更高层次的概览，请从这里开始：

- [会话管理](/zh-CN/concepts/session)
- [压缩](/zh-CN/concepts/compaction)
- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [转录整理](/zh-CN/reference/transcript-hygiene)

---

## 事实来源：Gateway 网关

OpenClaw 围绕一个拥有会话状态的单一 **Gateway 网关进程**设计。

- UI（macOS 应用、Web Control UI、TUI）应向 Gateway 网关查询会话列表和 token 计数。
- 在远程模式下，会话文件位于远程主机；“检查你的本地 Mac 文件”不会反映 Gateway 网关正在使用的内容。

---

## 两个持久化层

OpenClaw 分两层持久化会话：

1. **会话存储（`sessions.json`）**
   - 键值映射：`sessionKey -> SessionEntry`
   - 小型、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 ID、最近活动、开关、token 计数器等）

2. **转录（`<sessionId>.jsonl`）**
   - 仅追加转录，带树结构（条目有 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于为未来轮次重建模型上下文
   - 压缩检查点是已压缩后继转录上的元数据。新的压缩不会再写入第二份 `.checkpoint.*.jsonl`
     副本。

Gateway 网关历史读取器应避免物化整个转录，除非该界面明确需要任意历史访问。首页历史、嵌入式聊天历史、重启恢复以及 token/用量检查使用有界尾部读取。完整转录扫描通过异步转录索引执行，该索引按文件路径加 `mtimeMs`/`size` 缓存，并在并发读取器之间共享。

---

## 磁盘位置

每个智能体在 Gateway 网关主机上：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 话题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些位置。

---

## 存储维护和磁盘控制

会话持久化为 `sessions.json`、转录工件和轨迹旁路文件提供自动维护控制（`session.maintenance`）：

- `mode`：`enforce`（默认）或 `warn`
- `pruneAfter`：陈旧条目的年龄截止值（默认 `30d`）
- `maxEntries`：限制 `sessions.json` 中的条目数量（默认 `500`）
- 短生命周期的 Gateway 网关模型运行探测保留时间固定为 `24h`，但受压力门控：只有在达到会话条目维护/上限压力时，才会移除陈旧的严格探测行。这只适用于匹配 `agent:*:explicit:model-run-<uuid>` 的严格显式探测键，并且在运行时会先于全局陈旧条目清理/封顶执行。
- `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留期（默认：与 `pruneAfter` 相同；`false` 禁用清理）
- `maxDiskBytes`：可选的会话目录预算
- `highWaterBytes`：清理后的可选目标（默认是 `maxDiskBytes` 的 `80%`）

普通 Gateway 网关写入会通过每个存储的会话写入器流转，该写入器会串行化进程内变更，而不获取运行时文件锁。热路径补丁辅助函数会在持有该写入器槽位时借用已验证的可变缓存，因此大型 `sessions.json` 文件不会在每次元数据更新时被克隆或重新读取。运行时代码应优先使用 `updateSessionStore(...)` 或 `updateSessionStoreEntry(...)`；直接保存整个存储是兼容性和离线维护工具。当 Gateway 网关可访问时，非试运行的 `openclaw sessions cleanup` 和 `openclaw agents delete` 会将存储变更委托给 Gateway 网关，使清理加入同一个写入队列；`--store <path>` 是用于直接文件维护的显式离线修复路径。`maxEntries` 清理在生产规模上限下仍会批量执行，因此存储可能会短暂超过已配置上限，直到下一次高水位清理将其重写回上限以下。Gateway 网关启动期间，会话存储读取不会修剪或封顶条目；请使用写入或 `openclaw sessions cleanup --enforce` 进行清理。即使未配置磁盘预算，`openclaw sessions cleanup --enforce` 仍会立即应用已配置上限，并修剪旧的未引用转录、检查点和轨迹工件。

维护会保留持久的外部对话指针，例如群组会话和线程范围聊天会话，但 cron、钩子、Heartbeat、ACP 和子智能体的合成运行时条目在超过已配置年龄、数量或磁盘预算时仍可能被移除。Gateway 网关模型运行探测会话仅在其键精确匹配 `agent:*:explicit:model-run-<uuid>` 时使用单独的 `24h` 模型运行保留；其他显式会话不属于该保留范围。模型运行清理仅在会话条目上限压力下应用。隔离的 cron 运行保留自己的 `cron.sessionRetention` 控制，独立于模型运行探测保留。

OpenClaw 不再在 Gateway 网关写入期间创建自动 `sessions.json.bak.*` 轮换备份。旧版 `session.maintenance.rotateBytes` 键会被忽略，`openclaw doctor --fix` 会将其从旧配置中移除。

转录变更会对转录文件使用会话写锁。锁获取最多等待 `session.writeLock.acquireTimeoutMs`，然后才暴露会话忙错误；默认值为 `60000` ms。只有在合法的准备、清理、压缩或转录镜像工作在慢速机器上争用更久时才提高此值。`session.writeLock.staleMs` 控制何时可将现有锁回收为陈旧锁；默认值为 `1800000` ms。`session.writeLock.maxHoldMs` 控制进程内 watchdog 释放阈值；默认值为 `300000` ms。紧急环境变量覆盖项为 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`、`OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` 和 `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先移除最旧的已归档、孤立转录或孤立轨迹工件。
2. 如果仍高于目标，则逐出最旧的会话条目及其转录/轨迹文件。
3. 持续执行，直到用量等于或低于 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 会报告潜在逐出项，但不会变更存储/文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话和运行日志

隔离的 cron 运行也会创建会话条目/转录，并且它们有专用保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中修剪旧的隔离 cron 运行会话（`false` 禁用）。
- `cron.runLog.keepLines` 会按 cron 作业修剪保留的 SQLite 运行历史行（默认：`2000`）。`cron.runLog.maxBytes` 仍接受用于旧的文件支持运行日志。

当 cron 强制创建新的隔离运行会话时，它会先清理先前的 `cron:<jobId>` 会话条目，然后写入新行。它会保留安全偏好，例如 thinking/fast/verbose 设置、标签，以及显式用户选择的模型/凭证覆盖项。它会丢弃环境对话上下文，例如渠道/群组路由、发送或队列策略、权限提升、来源，以及 ACP 运行时绑定，使新的隔离运行无法从旧运行继承陈旧投递或运行时权限。

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

## 会话 ID（`sessionId`）

每个 `sessionKey` 都指向一个当前 `sessionId`（继续对话的转录文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认是 Gateway 网关主机本地时间凌晨 4:00）会在重置边界之后的下一条消息上创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在空闲窗口之后有消息到达时创建新的 `sessionId`。当每日重置 + 空闲过期同时配置时，先过期者生效。
- **Control UI 重新连接恢复**可以在 Gateway 网关从操作员 UI 客户端收到匹配的 `sessionId` 时，为一次重新连接发送保留当前可见会话。普通陈旧发送仍会创建新的 `sessionId`。
- **系统事件**（Heartbeat、cron 唤醒、exec 通知、Gateway 网关簿记）可能变更会话行，但不会延长每日/空闲重置的新鲜度。重置滚动会在构建新提示之前丢弃上一会话的排队系统事件通知。
- **父级分叉策略**在创建线程或子智能体分叉时使用 OpenClaw 的活动分支。如果该分支过大，OpenClaw 会用隔离上下文启动子级，而不是失败或继承不可用的历史。大小策略是自动的；旧版 `session.parentForkMaxTokens` 配置会被 `openclaw doctor --fix` 移除。

实现细节：该决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 会话存储模式（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（并非详尽）：

- `sessionId`：当前转录 id（除非设置了 `sessionFile`，否则文件名由此派生）
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置
  新鲜度使用此值。旧版行可能会从 JSONL 会话头派生它。
- `lastInteractionAt`：最后一次真实用户/渠道交互时间戳；空闲重置
  新鲜度使用此值，因此 Heartbeat、cron 和 exec 事件不会让会话
  保持存活。没有此字段的旧版行会回退到恢复出的会话开始
  时间来计算空闲新鲜度。
- `updatedAt`：最后一次存储行变更时间戳，用于列表、清理和
  记账。它不是每日/空闲重置新鲜度的权威来源。
- `archivedAt`：可选的归档时间戳。已归档会话会保留在存储中，
  转录保持完整，并且会从普通活动列表中排除。
- `pinnedAt`：可选的置顶时间戳。活动的置顶会话会排在
  未置顶会话之前；归档会话会清除其置顶。
- Codex 线程互操作：两个字段都遵循 Codex 线程管理形状 —
  线上的 `archived`/`pinned` 布尔值始终由时间戳派生并在服务端打戳，
  匹配 Codex `threads.archived_at` 语义和 camelCase 序列化。OpenClaw
  时间戳是 epoch 毫秒，而 Codex 使用 epoch 秒，因此桥接会在 codex
  插件边界进行转换。Codex 目前还没有置顶 API（只有
  `thread/archive`/`thread/unarchive`）；置顶状态会保留在 OpenClaw 侧，
  直到该 API 存在，届时匹配的形状可让绑定会话以机械方式往返置顶状态。
- `sessionFile`：可选的显式转录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：用于群组/渠道标记的元数据
- 开关：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（按会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为 / 取决于提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此会话键完成自动压缩的次数
- `memoryFlushAt`：上一次压缩前记忆刷新的时间戳
- `memoryFlushCompactionCount`：上一次刷新运行时的压缩计数

该存储可以安全编辑，但 Gateway 网关是权威来源：会话运行时，它可能会重写或重新水合条目。

---

## 转录结构（`*.jsonl`）

转录由 `openclaw/plugin-sdk/agent-sessions` 的 `SessionManager` 管理。

文件是 JSONL：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选的 `parentSession`）
- 然后：带有 `id` + `parentId` 的会话条目（树）

值得注意的条目类型：

- `message`：用户/助手/toolResult 消息
- `custom_message`：扩展注入的消息，会进入模型上下文（可以从 UI 隐藏）
- `custom`：不会进入模型上下文的扩展状态
- `compaction`：持久化的压缩摘要，包含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：导航树分支时持久化的摘要

OpenClaw 有意**不会**“修补”转录；Gateway 网关使用 `SessionManager` 读写它们。

---

## 上下文窗口与跟踪的 token

这里有两个不同概念很重要：

1. **模型上下文窗口**：每个模型的硬性上限（模型可见的 token）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 /status 和仪表板）

如果你在调整限制：

- 上下文窗口来自模型目录（也可以通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算/报告值；不要把它当作严格保证。

更多信息，请参阅 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会把较早的对话汇总为转录中持久化的 `compaction` 条目，并保持近期消息不变。

压缩后，未来轮次会看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩后重新注入 AGENTS.md 章节需要通过
`agents.defaults.compaction.postCompactionSections` 选择加入；当未设置或为 `[]` 时，
OpenClaw 不会在压缩摘要之上追加 AGENTS.md 摘录。

压缩是**持久化的**（不同于会话清理）。请参阅 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩分块边界和工具配对

当 OpenClaw 将长转录拆分为压缩块时，它会让
助手工具调用与其匹配的 `toolResult` 条目保持配对。

- 如果 token 占比分割点落在工具调用和其结果之间，OpenClaw
  会将边界移动到助手工具调用消息，而不是拆开这一对。
- 如果尾随的工具结果块原本会让分块超过目标，OpenClaw 会保留该待处理工具块，
  并保持未摘要的尾部完整。
- 已中止/错误的工具调用块不会让待处理分割保持打开。

---

## 自动压缩何时发生（OpenClaw 运行时）

在嵌入式 OpenClaw 智能体中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded` 以及类似的提供商形态变体）→ 压缩 → 重试。
   当提供商报告尝试的 token 计数时，OpenClaw 会把该观察到的计数
   转发给溢出恢复压缩。如果提供商确认溢出但未暴露可解析计数，
   OpenClaw 会向压缩引擎和诊断传递一个最低限度超预算的合成计数。
   如果溢出恢复仍然失败，OpenClaw 会向用户显示明确指引，并保留
   当前会话映射，而不是静默地将会话键轮换到新的会话 id。
   下一步由操作员控制：重试消息、运行 `/compact`，或在偏好新会话时运行 `/new`。
2. **阈值维护**：成功完成一个轮次后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示 + 下一次模型输出预留的余量

这些是 OpenClaw 运行时语义。

当设置了 `agents.defaults.compaction.maxActiveTranscriptBytes` 且活动转录文件
达到该大小时，OpenClaw 也可以在打开下一次运行前触发预检本地压缩。
这是用于本地重新打开成本的文件大小保护，而不是原始归档：OpenClaw
仍会运行普通语义压缩，并且它要求启用 `truncateAfterCompaction`，
这样压缩后的摘要才能成为新的后继转录。

对于嵌入式 OpenClaw 运行，`agents.defaults.compaction.midTurnPrecheck.enabled: true`
会添加一个选择加入的工具循环保护。在追加工具结果之后、下一次模型调用之前，
OpenClaw 会使用与轮次开始时相同的预检预算逻辑来估算提示压力。
如果上下文不再适配，该保护不会在 OpenClaw 运行时的 `transformContext` 钩子内压缩。
它会抛出结构化的轮次中预检信号，停止当前提示提交，并让外层运行循环使用
现有恢复路径：在足够时截断过大的工具结果，或触发配置的压缩模式并重试。
该选项默认禁用，并且同时适用于 `default` 和 `safeguard`
压缩模式，包括由提供商支持的 safeguard 压缩。
这独立于 `maxActiveTranscriptBytes`：字节大小保护在轮次打开前运行，
而轮次中预检会在嵌入式 OpenClaw 工具循环中追加新工具结果后稍后运行。

---

## 压缩设置（`reserveTokens`、`keepRecentTokens`）

OpenClaw 运行时的压缩设置位于智能体设置中：

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw 还会为嵌入式运行强制执行安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会将其调高。
- 默认下限是 `20000` token。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用该下限。
- 如果它已经更高，OpenClaw 会保持不变。
- 手动 `/compact` 会遵循显式的 `agents.defaults.compaction.keepRecentTokens`，
  并保留 OpenClaw 运行时的近期尾部切分点。没有显式保留预算时，
  手动压缩仍然是硬检查点，重建的上下文会从新摘要开始。
- 设置 `agents.defaults.compaction.midTurnPrecheck.enabled: true` 可在新工具结果之后、
  下一次模型调用之前运行可选的工具循环预检。这只是触发器；摘要生成仍然使用
  配置的压缩路径。它独立于 `maxActiveTranscriptBytes`，后者是
  轮次开始时的活动转录字节大小保护。
- 将 `agents.defaults.compaction.maxActiveTranscriptBytes` 设置为字节值或
  `"20mb"` 这样的字符串，可在活动转录变大时于轮次前运行本地压缩。
  只有同时启用 `truncateAfterCompaction` 时，此保护才会生效。
  保持未设置或设置为 `0` 可禁用。
- 启用 `agents.defaults.compaction.truncateAfterCompaction` 时，
  OpenClaw 会在压缩后将活动转录轮换为压缩后的后继 JSONL。
  分支/恢复检查点操作会使用该压缩后继；旧版压缩前检查点文件
  在被引用时仍可读取。

原因：在压缩变得不可避免之前，为多轮“内务处理”（如记忆写入）留下足够余量。

实现：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`
（从嵌入式运行器轮次和压缩设置路径调用）。

---

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。
当 `agents.defaults.compaction.provider` 设置为已注册提供商 id 时，
safeguard 扩展会将摘要委托给该提供商，而不是使用内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 id。保持未设置则使用默认 LLM 摘要。
- 设置 `provider` 会强制 `mode: "safeguard"`。
- 提供商会收到与内置路径相同的压缩指令和标识符保留策略。
- safeguard 仍会在提供商输出后保留近期轮次和分割轮次后缀上下文。
- 内置 safeguard 摘要会用新消息重新蒸馏先前摘要，
  而不是逐字保留完整的先前摘要。
- safeguard 模式默认启用摘要质量审核；设置
  `qualityGuard.enabled: false` 可跳过格式错误输出时重试的行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要。
- 中止/超时信号会被重新抛出（不会被吞掉），以尊重调用方取消。

来源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

---

## 用户可见表面

你可以通过以下方式观察压缩和会话状态：

- `/status`（在任何聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- Gateway 网关日志（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 详细模式：`🧹 Auto-compaction complete` + 压缩计数

---

## 静默内务处理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，此时用户不应看到中间输出。

约定：

- 助手以精确的静默令牌 `NO_REPLY` /
  `no_reply` 开始输出，用来表示“不要向用户发送回复”。
- OpenClaw 会在投递层剥离/抑制它。
- 精确静默令牌抑制不区分大小写，因此当整个载荷只有静默令牌时，`NO_REPLY` 和
  `no_reply` 都会生效。
- 这仅用于真正的后台/不投递轮次；它不是普通可执行用户请求的快捷方式。

截至 `2026.1.10`，当部分分块以 `NO_REPLY` 开头时，OpenClaw 也会抑制**草稿/正在输入流式传输**，因此静默操作不会在轮次中途泄露部分输出。

---

## 预压缩“记忆刷写”（已实现）

目标：在自动压缩发生前，运行一个静默的智能体式轮次，将持久状态写入磁盘（例如智能体工作区中的 `memory/YYYY-MM-DD.md`），这样压缩就无法抹除关键上下文。

OpenClaw 使用**预阈值刷写**方法：

1. 监控会话上下文使用量。
2. 当它越过“软阈值”（低于 OpenClaw 运行时的压缩阈值）时，向智能体运行一条静默的“立即写入记忆”指令。
3. 使用精确的静默令牌 `NO_REPLY` / `no_reply`，这样用户什么也看不到。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `model`（可选的精确提供商/模型覆盖，用于刷写轮次，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（用于刷写轮次的用户消息）
- `systemPrompt`（为刷写轮次追加的额外系统提示）

说明：

- 默认提示/系统提示包含一个 `NO_REPLY` 提示，用于抑制投递。
- 设置 `model` 后，刷写轮次会使用该模型，而不会继承活动会话的回退链，因此仅本地的内务处理不会静默回退到付费对话模型。
- 每个压缩周期只运行一次刷写（在 `sessions.json` 中跟踪）。
- 刷写仅针对嵌入式 OpenClaw 会话运行（CLI 后端会跳过它）。
- 当会话工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时，会跳过刷写。
- 有关工作区文件布局和写入模式，请参阅[记忆](/zh-CN/concepts/memory)。

OpenClaw 还在扩展 API 中暴露了一个 `session_before_compact` 钩子，但 OpenClaw 的刷写逻辑目前位于 Gateway 网关侧。

---

## 故障排除清单

- 会话键错误？从 [/concepts/session](/zh-CN/concepts/session) 开始，并确认 `/status` 中的 `sessionKey`。
- 存储与转录不匹配？从 `openclaw status` 确认 Gateway 网关主机和存储路径。
- 压缩刷屏？检查：
  - 模型上下文窗口（过小）
  - 压缩设置（`reserveTokens` 对于模型窗口过高可能导致更早压缩）
  - 工具结果膨胀：启用/调优会话剪枝
- 静默轮次泄露？确认回复以 `NO_REPLY` 开头（不区分大小写的精确令牌），并且你使用的构建包含流式传输抑制修复。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话剪枝](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
