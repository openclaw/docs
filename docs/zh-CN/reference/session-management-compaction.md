---
read_when:
    - 你需要调试会话 ID、转录 JSONL 或 sessions.json 字段
    - 你正在更改自动压缩行为，或添加“预压缩”内务处理
    - 你想实现记忆刷新或静默系统轮次
summary: 深入解析：会话存储 + 转录、生命周期和（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-06-27T03:18:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw 在以下领域端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪内容
- **转录持久化**（`*.jsonl`）及其结构
- **转录清理**（运行前针对特定提供商的修正）
- **上下文限制**（上下文窗口与已跟踪 token）
- **压缩**（手动压缩和自动压缩）以及在哪里挂接压缩前工作
- **静默内务处理**（不应产生用户可见输出的记忆写入）

如果你想先了解更高层概览，请从这里开始：

- [会话管理](/zh-CN/concepts/session)
- [压缩](/zh-CN/concepts/compaction)
- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [转录清理](/zh-CN/reference/transcript-hygiene)

---

## 事实来源：Gateway 网关

OpenClaw 围绕一个拥有会话状态的单一 **Gateway 网关进程**设计。

- UI（macOS 应用、Web Control UI、TUI）应向 Gateway 网关查询会话列表和 token 计数。
- 在远程模式下，会话文件位于远程主机上；“检查你的本地 Mac 文件”不会反映 Gateway 网关正在使用的内容。

---

## 两个持久化层

OpenClaw 在两个层中持久化会话：

1. **会话存储（`sessions.json`）**
   - 键值映射：`sessionKey -> SessionEntry`
   - 小型、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 ID、上次活动、开关、token 计数器等）

2. **转录（`<sessionId>.jsonl`）**
   - 带树结构的追加式转录（条目包含 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于为后续轮次重建模型上下文
   - 压缩检查点是覆盖已压缩后继转录的元数据。新的压缩不会写入第二份 `.checkpoint.*.jsonl` 副本。

Gateway 网关历史读取器应避免实体化整个转录，除非该表面明确需要任意历史访问。首页历史、嵌入式聊天历史、重启恢复以及 token/用量检查使用有界尾部读取。完整转录扫描通过异步转录索引执行，该索引按文件路径加 `mtimeMs`/`size` 缓存，并在并发读取器之间共享。

---

## 磁盘位置

每个 Agent 在 Gateway 网关主机上：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 话题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些位置。

---

## 存储维护和磁盘控制

会话持久化通过 `session.maintenance` 为 `sessions.json`、转录构件和轨迹旁路文件提供自动维护控制：

- `mode`：`enforce`（默认）或 `warn`
- `pruneAfter`：过期条目的年龄截止值（默认 `30d`）
- `maxEntries`：限制 `sessions.json` 中的条目数（默认 `500`）
- 短生命周期的 Gateway 网关模型运行探测保留固定为 `24h`，但它受压力门控：只有在达到会话条目维护/上限压力时，才会移除过期的严格探测行。这仅适用于匹配 `agent:*:explicit:model-run-<uuid>` 的严格显式探测键，并且在运行时先于全局过期条目清理/封顶执行。
- `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留期（默认：与 `pruneAfter` 相同；`false` 禁用清理）
- `maxDiskBytes`：可选的会话目录预算
- `highWaterBytes`：清理后的可选目标（默认是 `maxDiskBytes` 的 `80%`）

正常 Gateway 网关写入会通过一个按存储划分的会话写入器，该写入器串行化进程内变更，而不获取运行时文件锁。热路径补丁辅助函数在持有该写入器槽位时借用已验证的可变缓存，因此大型 `sessions.json` 文件不会因每次元数据更新而被克隆或重新读取。运行时代码应优先使用 `updateSessionStore(...)` 或 `updateSessionStoreEntry(...)`；直接保存整个存储是兼容性和离线维护工具。当 Gateway 网关可达时，非 dry-run 的 `openclaw sessions cleanup` 和 `openclaw agents delete` 会将存储变更委托给 Gateway 网关，使清理加入同一个写入器队列；`--store <path>` 是用于直接文件维护的显式离线修复路径。对于生产规模的上限，`maxEntries` 清理仍会批处理，因此存储可能会短暂超过配置的上限，直到下一次高水位清理将其重写回上限以下。Gateway 网关启动期间，会话存储读取不会修剪或限制条目；请使用写入或 `openclaw sessions cleanup --enforce` 进行清理。即使未配置磁盘预算，`openclaw sessions cleanup --enforce` 仍会立即应用配置的上限，并修剪旧的未引用转录、检查点和轨迹构件。

维护会保留持久的外部对话指针，例如群组会话和线程范围的聊天会话，但 cron、钩子、Heartbeat、ACP 和子智能体的合成运行时条目在超过配置的年龄、数量或磁盘预算时仍可能被移除。Gateway 网关模型运行探测会话仅在其键精确匹配 `agent:*:explicit:model-run-<uuid>` 时使用单独的 `24h` 模型运行保留；其他显式会话不属于该保留范围。模型运行清理仅在会话条目上限压力下应用。隔离的 cron 运行保留自己的 `cron.sessionRetention` 控制，独立于模型运行探测保留。

OpenClaw 不再在 Gateway 网关写入期间创建自动 `sessions.json.bak.*` 轮转备份。旧版 `session.maintenance.rotateBytes` 键会被忽略，`openclaw doctor --fix` 会从较旧配置中移除它。

转录变更会在转录文件上使用会话写锁。锁获取最多等待 `session.writeLock.acquireTimeoutMs`，之后会暴露忙碌会话错误；默认值是 `60000` ms。只有在合法的准备、清理、压缩或转录镜像工作在较慢机器上竞争更久时，才提高此值。`session.writeLock.staleMs` 控制现有锁何时可被作为过期锁回收；默认值是 `1800000` ms。`session.writeLock.maxHoldMs` 控制进程内看门狗释放阈值；默认值是 `300000` ms。应急环境变量覆盖项为 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`、`OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` 和 `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先移除最旧的已归档、孤立转录或孤立轨迹构件。
2. 如果仍高于目标，则驱逐最旧的会话条目及其转录/轨迹文件。
3. 持续执行，直到用量等于或低于 `highWaterBytes`。

在 `mode: "warn"` 中，OpenClaw 会报告潜在驱逐，但不会变更存储/文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话和运行日志

隔离的 cron 运行也会创建会话条目/转录，并且它们有专用的保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中修剪旧的隔离 cron 运行会话（`false` 禁用）。
- `cron.runLog.keepLines` 会按 cron 作业修剪保留的 SQLite 运行历史行（默认：`2000`）。`cron.runLog.maxBytes` 仍被接受，用于较旧的文件型运行日志。

当 cron 强制创建新的隔离运行会话时，它会在写入新行之前清理先前的 `cron:<jobId>` 会话条目。它会携带安全偏好，例如 thinking/fast/verbose 设置、标签，以及用户显式选择的模型/凭证覆盖。它会丢弃环境对话上下文，例如渠道/群组路由、发送或队列策略、提权、来源和 ACP 运行时绑定，从而让新的隔离运行无法继承旧运行中的过期投递或运行时权限。

---

## 会话键（`sessionKey`）

`sessionKey` 标识你所在的_对话桶_（路由 + 隔离）。

常见模式：

- 主/直接聊天（每个 Agent）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/渠道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则记录在 [/concepts/session](/zh-CN/concepts/session)。

---

## 会话 ID（`sessionId`）

每个 `sessionKey` 指向当前 `sessionId`（继续对话的转录文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认 Gateway 网关主机本地时间上午 4:00）会在越过重置边界后的下一条消息上创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在空闲窗口后消息到达时创建新的 `sessionId`。当每日重置和空闲过期同时配置时，先过期者生效。
- **Control UI 重连恢复**可以在 Gateway 网关从操作员 UI 客户端收到匹配的 `sessionId` 时，为一次重连发送保留当前可见会话。普通的过期发送仍会创建新的 `sessionId`。
- **系统事件**（Heartbeat、cron 唤醒、exec 通知、Gateway 网关内务记录）可能会变更会话行，但不会延长每日/空闲重置新鲜度。重置滚动会在构建新提示前丢弃上一会话的已排队系统事件通知。
- **父级分叉策略**在创建线程或子智能体分叉时使用 OpenClaw 的活动分支。如果该分支过大，OpenClaw 会用隔离上下文启动子级，而不是失败或继承不可用的历史。大小策略是自动的；旧版 `session.parentForkMaxTokens` 配置会被 `openclaw doctor --fix` 移除。

实现细节：决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 会话存储架构（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（并非穷尽）：

- `sessionId`：当前转录 ID（除非设置了 `sessionFile`，否则文件名由此派生）
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置新鲜度使用此字段。旧版行可能从 JSONL 会话头派生它。
- `lastInteractionAt`：上次真实用户/渠道交互时间戳；空闲重置新鲜度使用此字段，因此 Heartbeat、cron 和 exec 事件不会让会话保持活动。缺少此字段的旧版行会回退到恢复出的会话开始时间来判断空闲新鲜度。
- `updatedAt`：上次存储行变更时间戳，用于列表展示、修剪和内务处理。它不是每日/空闲重置新鲜度的权威依据。
- `sessionFile`：可选的显式转录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：用于群组/渠道标签的元数据
- 开关：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（按会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为 / 依赖提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此会话键完成自动压缩的次数
- `memoryFlushAt`：上次压缩前记忆刷新的时间戳
- `memoryFlushCompactionCount`：上次刷新运行时的压缩计数

存储可以安全编辑，但 Gateway 网关是权威来源：会话运行时，它可能会重写或重新水合条目。

---

## 转录结构（`*.jsonl`）

转录由 `openclaw/plugin-sdk/agent-sessions` 的 `SessionManager` 管理。

文件是 JSONL：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选 `parentSession`）
- 然后：带 `id` + `parentId` 的会话条目（树）

值得注意的条目类型：

- `message`：user/assistant/toolResult 消息
- `custom_message`：插件注入的消息，会进入模型上下文（可对 UI 隐藏）
- `custom`：不会进入模型上下文的插件状态
- `compaction`：带有 `firstKeptEntryId` 和 `tokensBefore` 的持久化压缩摘要
- `branch_summary`：导航树分支时的持久化摘要

OpenClaw 有意**不会**“修正”会话记录；Gateway 网关使用 `SessionManager` 读写它们。

---

## 上下文窗口与跟踪的 token

有两个不同概念很重要：

1. **模型上下文窗口**：每个模型的硬性上限（模型可见的 token）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 /status 和仪表板）

如果你在调优限制：

- 上下文窗口来自模型目录（也可以通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算/报告值；不要把它当作严格保证。

更多信息，请参阅 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会把较早的对话总结为会话记录中的一个持久化 `compaction` 条目，并保留最近的消息不变。

压缩后，后续轮次会看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩后重新注入 AGENTS.md 章节需要通过
`agents.defaults.compaction.postCompactionSections` 显式启用；未设置或为 `[]` 时，
OpenClaw 不会在压缩摘要之上追加 AGENTS.md 摘录。

压缩是**持久化的**（不同于会话修剪）。请参阅 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩分块边界和工具配对

当 OpenClaw 将很长的会话记录拆分为压缩分块时，它会让
assistant 工具调用与匹配的 `toolResult` 条目保持配对。

- 如果按 token 占比拆分的位置落在工具调用和其结果之间，OpenClaw
  会把边界移动到 assistant 工具调用消息，而不是拆开这对消息。
- 如果末尾的工具结果块本来会让分块超过目标大小，
  OpenClaw 会保留这个待处理工具块，并保持未总结的尾部不变。
- 已中止/错误的工具调用块不会让待处理拆分保持打开。

---

## 自动压缩何时发生（OpenClaw 运行时）

在嵌入式 OpenClaw agent 中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`，以及类似的提供商形态变体）→ 压缩 → 重试。
   当提供商报告尝试使用的 token 数时，OpenClaw 会把该观测计数转发给
   溢出恢复压缩。如果提供商确认溢出但没有暴露可解析的计数，OpenClaw
   会向压缩引擎和诊断传入一个刚好超出预算的合成计数。
   如果溢出恢复仍然失败，OpenClaw 会向用户显示明确指导，并保留当前会话映射，
   而不是静默地把会话键轮换到新的会话 ID。下一步由操作员控制：
   重试该消息、运行 `/compact`，或在偏好新会话时运行 `/new`。
2. **阈值维护**：成功完成一轮后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示词 + 下一次模型输出预留的余量

这些是 OpenClaw 运行时语义。

当设置了 `agents.defaults.compaction.maxActiveTranscriptBytes` 且活跃会话记录文件达到该大小时，
OpenClaw 也可以在打开下一次运行前触发一次预检本地压缩。这是用于降低本地
重新打开成本的文件大小保护，而不是原始归档：OpenClaw 仍会运行正常的语义压缩，
并且要求启用 `truncateAfterCompaction`，这样压缩后的摘要才能成为新的后继会话记录。

对于嵌入式 OpenClaw 运行，`agents.defaults.compaction.midTurnPrecheck.enabled: true`
会添加一个可选的工具循环保护。在追加工具结果后、下一次模型调用前，
OpenClaw 会使用与轮次开始时相同的预检预算逻辑来估算提示词压力。
如果上下文不再适配，该保护不会在 OpenClaw 运行时的 `transformContext` 钩子中压缩。
它会抛出结构化的轮次中预检信号，停止当前提示词提交，并让外层运行循环使用现有恢复路径：
在足够时截断过大的工具结果，或触发已配置的压缩模式并重试。该选项默认禁用，
同时适用于 `default` 和 `safeguard` 压缩模式，包括提供商支持的 safeguard 压缩。
这独立于 `maxActiveTranscriptBytes`：字节大小保护在轮次打开前运行，
而轮次中预检会在嵌入式 OpenClaw 工具循环中追加新工具结果后稍后运行。

---

## 压缩设置（`reserveTokens`、`keepRecentTokens`）

OpenClaw 运行时的压缩设置位于 agent 设置中：

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

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会将其提升。
- 默认下限为 `20000` token。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用该下限。
- 如果它已经更高，OpenClaw 会保持不变。
- 手动 `/compact` 会遵循显式的 `agents.defaults.compaction.keepRecentTokens`，
  并保留 OpenClaw 运行时的最近尾部截断点。没有显式保留预算时，
  手动压缩仍是硬检查点，重建后的上下文会从新摘要开始。
- 设置 `agents.defaults.compaction.midTurnPrecheck.enabled: true` 可在新工具结果之后、
  下一次模型调用之前运行可选工具循环预检。这只是一个触发器；摘要生成仍会使用已配置的
  压缩路径。它独立于 `maxActiveTranscriptBytes`，后者是轮次开始时的活跃会话记录字节大小保护。
- 将 `agents.defaults.compaction.maxActiveTranscriptBytes` 设置为字节值或
  `"20mb"` 这样的字符串，可在活跃会话记录变大时于轮次前运行本地压缩。该保护仅在同时启用
  `truncateAfterCompaction` 时生效。保持未设置或设为 `0` 可禁用。
- 启用 `agents.defaults.compaction.truncateAfterCompaction` 时，
  OpenClaw 会在压缩后把活跃会话记录轮换为压缩后的后继 JSONL。
  分支/恢复检查点操作会使用该压缩后继；旧版压缩前检查点文件在被引用时仍可读取。

原因：在压缩变得不可避免之前，为多轮“内务处理”（例如记忆写入）留出足够余量。

实现：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`
（由嵌入式运行器轮次和压缩设置路径调用）。

---

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 设置为已注册的提供商 ID 时，safeguard 扩展会把摘要生成委托给该提供商，而不是内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 ID。保持未设置则使用默认 LLM 摘要。
- 设置 `provider` 会强制 `mode: "safeguard"`。
- 提供商会收到与内置路径相同的压缩指令和标识符保留策略。
- safeguard 在提供商输出之后仍会保留最近轮次和拆分轮次的后缀上下文。
- 内置 safeguard 摘要会用新消息重新提炼先前摘要，
  而不是逐字保留完整的上一个摘要。
- safeguard 模式默认启用摘要质量审计；设置
  `qualityGuard.enabled: false` 可跳过格式异常输出时重试的行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要。
- 中止/超时信号会被重新抛出（不会吞掉），以尊重调用方取消。

来源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

---

## 用户可见界面

你可以通过以下方式观察压缩和会话状态：

- `/status`（在任意聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- Gateway 网关日志（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 详细模式：`🧹 Auto-compaction complete` + 压缩计数

---

## 静默内务处理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，其中用户不应看到中间输出。

约定：

- assistant 以精确静默 token `NO_REPLY` /
  `no_reply` 开始输出，表示“不要向用户交付回复”。
- OpenClaw 会在交付层剥离/抑制它。
- 精确静默 token 抑制不区分大小写，因此当整个载荷只是静默 token 时，
  `NO_REPLY` 和 `no_reply` 都有效。
- 这仅用于真正的后台/不交付轮次；它不是普通可执行用户请求的快捷方式。

自 `2026.1.10` 起，当部分分块以 `NO_REPLY` 开头时，OpenClaw 还会抑制**草稿/正在输入流式传输**，
因此静默操作不会在轮次中途泄露部分输出。

---

## 压缩前“记忆刷新”（已实现）

目标：在自动压缩发生之前，运行一个静默的 agentic 轮次，将持久状态写入磁盘
（例如 agent 工作区中的 `memory/YYYY-MM-DD.md`），这样压缩就不会抹除关键上下文。

OpenClaw 使用**预阈值刷新**方法：

1. 监控会话上下文使用量。
2. 当它越过“软阈值”（低于 OpenClaw 运行时的压缩阈值）时，向 agent 运行一条静默的
   “立即写入记忆”指令。
3. 使用精确静默 token `NO_REPLY` / `no_reply`，使用户看不到任何内容。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `model`（可选的精确提供商/模型覆盖，用于刷新轮次，例如 `ollama/qwen3:8b`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（刷新轮次的用户消息）
- `systemPrompt`（为刷新轮次追加的额外系统提示词）

说明：

- 默认 prompt/system prompt 包含 `NO_REPLY` 提示，用于抑制交付。
- 设置 `model` 时，刷新轮次会使用该模型，而不继承活跃会话回退链，
  因此仅本地的内务处理不会静默回退到付费对话模型。
- 每个压缩周期只运行一次刷新（在 `sessions.json` 中跟踪）。
- 刷新仅对嵌入式 OpenClaw 会话运行（CLI 后端会跳过）。
- 当会话工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时会跳过刷新。
- 有关工作区文件布局和写入模式，请参阅 [Memory](/zh-CN/concepts/memory)。

OpenClaw 还在插件 API 中暴露了 `session_before_compact` 钩子，但 OpenClaw 的
刷新逻辑目前位于 Gateway 网关侧。

---

## 故障排除清单

- 会话键错误？从 [/concepts/session](/zh-CN/concepts/session) 开始，并确认 `/status` 中的 `sessionKey`。
- 存储与会话记录不匹配？通过 `openclaw status` 确认 Gateway 网关主机和存储路径。
- 压缩过于频繁？检查：
  - 模型上下文窗口（太小）
  - 压缩设置（`reserveTokens` 对模型窗口来说过高可能导致更早压缩）
  - 工具结果膨胀：启用/调优会话修剪
- 静默轮次泄露？确认回复以 `NO_REPLY` 开头（不区分大小写的精确 token），并且你使用的构建包含流式传输抑制修复。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
