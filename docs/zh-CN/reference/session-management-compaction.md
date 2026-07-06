---
read_when:
    - 你需要调试会话 ID、转录 JSONL 或 sessions.json 字段
    - 你正在更改自动压缩行为，或添加“预压缩”清理维护
    - 你想要实现记忆刷新或静默系统轮次
summary: 深入解析：会话存储 + 转录、生命周期和（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-07-06T10:52:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb7ac88649e24472bdb00e0f6739dc7885cd713c1497b8be966d2b9dfe1cf1e
    source_path: reference/session-management-compaction.md
    workflow: 16
---

单个 **Gateway 网关进程** 端到端拥有会话状态。UI（macOS 应用、Web Control UI、TUI）会向 Gateway 网关查询会话列表和 token 计数。在远程模式下，会话文件位于远程主机上，因此检查你的本地 Mac 文件不会反映 Gateway 网关正在使用的内容。

先阅读概览文档：[会话管理](/zh-CN/concepts/session)、[压缩](/zh-CN/concepts/compaction)、[记忆概览](/zh-CN/concepts/memory)、[记忆搜索](/zh-CN/concepts/memory-search)、[会话修剪](/zh-CN/concepts/session-pruning)、[转录卫生](/zh-CN/reference/transcript-hygiene)，完整配置参考见 [Agent 配置](/zh-CN/gateway/config-agents)。

## 两个持久化层

1. **会话存储（`sessions.json`）** - 键/值映射 `sessionKey -> SessionEntry`。体积小、可变，可安全编辑或删除条目。跟踪元数据：当前会话 ID、上次活动时间、开关、token 计数器。
2. **转录（`<sessionId>.jsonl`）** - 仅追加、树形结构（条目包含 `id` + `parentId`）。存储对话、工具调用和压缩摘要；为后续轮次重建模型上下文。压缩检查点是压缩后的后继转录上的元数据 - 新的压缩不会写入第二份 `.checkpoint.*.jsonl` 副本。

Gateway 网关历史读取器会避免物化整个转录，除非某个界面需要任意历史访问。首页历史、嵌入式聊天历史、重启恢复以及 token/用量检查会使用有界尾部读取。完整转录扫描会通过异步转录索引进行，该索引按文件路径加 `mtimeMs`/`size` 缓存，并在并发读取器之间共享。

## 磁盘位置

每个智能体在 Gateway 网关主机上（通过 `src/config/sessions.ts` 解析）：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主题会话：`.../<sessionId>-topic-<threadId>.jsonl`

## 存储维护和磁盘控制

`session.maintenance` 控制 `sessions.json`、转录产物和轨迹旁路文件的自动维护：

| 键                      | 默认值                | 说明                                                                               |
| ----------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | 或 `"warn"`（仅报告，不变更）                                                      |
| `pruneAfter`            | `"30d"`               | 过期条目年龄截止值                                                                 |
| `maxEntries`            | `500`                 | `sessions.json` 中的条目上限                                                       |
| `resetArchiveRetention` | 与 `pruneAfter` 相同  | `*.reset.<timestamp>` 转录归档的保留期；`false` 会禁用清理                         |
| `maxDiskBytes`          | 未设置                | 可选的会话目录预算                                                                 |
| `highWaterBytes`        | `maxDiskBytes` 的 80% | 预算清理后的目标值                                                                 |

Gateway 网关模型运行探测会话（匹配 `agent:*:explicit:model-run-<uuid>` 的键）具有单独固定的 `24h` 保留期。此修剪受压力门控：仅在达到会话条目维护/上限压力时运行，并且只在全局过期条目清理/上限步骤之前运行。其他显式会话不使用此保留期。

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先移除最旧的已归档、孤立转录或孤立轨迹产物。
2. 如果仍高于目标值，则逐出最旧的会话条目及其转录/轨迹文件。
3. 重复直到用量小于或等于 `highWaterBytes`。

`mode: "warn"` 会报告潜在逐出项，但不会变更存储或文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

维护会保留持久的外部对话指针，例如群组会话和按线程限定的聊天会话，但合成运行时条目（cron、hooks、heartbeat、ACP、子智能体）在超过配置的年龄、数量或磁盘预算后仍可被移除。隔离 cron 运行使用单独的 `cron.sessionRetention` 控制，独立于模型运行探测保留期。

普通 Gateway 网关写入会经过每个存储的会话写入器，该写入器会串行化进程内变更，而不获取运行时文件锁。热路径补丁辅助函数在持有该写入器槽位时借用已验证的可变缓存，因此大型 `sessions.json` 文件不会为每次元数据更新都被克隆或重新读取。运行时代码中优先使用 `updateSessionStore(...)` / `updateSessionStoreEntry(...)`；直接保存整个存储用于兼容性和离线维护工具。当 Gateway 网关可访问时，非 dry-run 的 `openclaw sessions cleanup` 和 `openclaw agents delete` 会将存储变更委托给 Gateway 网关，使清理加入同一个写入器队列；`--store <path>` 是用于直接文件维护的显式离线修复路径，并且始终保持本地执行（`--dry-run` 也是如此）。`maxEntries` 清理会按生产规模的存储分批执行，因此在下一次高水位清理将其重写到上限以下之前，某个存储可能会短暂超过配置的上限。Gateway 网关启动期间，读取绝不会修剪条目或应用上限 - 只有写入或 `openclaw sessions cleanup --enforce` 会这样做，后者还会立即应用上限，并且即使未配置磁盘预算，也会修剪旧的未引用转录、检查点和轨迹产物。

OpenClaw 不再在 Gateway 网关写入期间创建自动 `sessions.json.bak.*` 轮转备份。旧版 `session.maintenance.rotateBytes` 键会被忽略，`openclaw doctor --fix` 会将其从旧配置中移除。

转录变更会在转录文件上使用会话写锁：

| 设置                                 | 默认值    | 环境变量覆盖                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` 是锁等待在放弃前暴露忙碌会话错误的时长；仅当合法的准备、清理、压缩或转录镜像工作在慢机器上竞争更久时才提高它。`staleMs` 是现有锁可被回收为过期锁的时间。`maxHoldMs` 是进程内看门狗释放阈值。

## Cron 会话和运行日志

隔离 cron 运行会创建自己的会话条目/转录，并具有专用保留期：

- `cron.sessionRetention`（默认 `"24h"`）会从存储中修剪旧的隔离 cron 运行会话；`false` 会禁用。
- `cron.runLog.keepLines` 会按 cron 作业修剪保留的 SQLite 运行历史行（默认 `2000`）。`cron.runLog.maxBytes` 仅为兼容旧的文件型运行日志而接受。

当 cron 强制创建新的隔离运行会话时，它会在写入新行之前清理上一个 `cron:<jobId>` 会话条目：它会携带安全偏好设置（thinking/fast/verbose/reasoning 设置、标签、显示名称）和用户显式选择的模型/凭证覆盖，但会丢弃环境对话上下文（频道/群组路由、发送/队列策略、提升权限、来源、ACP 运行时绑定），因此新的隔离运行无法从旧运行继承过期的投递或运行时权限。

## 会话键（`sessionKey`）

`sessionKey` 标识你所在的对话桶（路由 + 隔离）。规范规则：[/concepts/session](/zh-CN/concepts/session)。

| 模式                         | 示例                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| 主/直接聊天（按智能体）      | `agent:<agentId>:<mainKey>`（默认 `main`）                  |
| 群组                         | `agent:<agentId>:<channel>:group:<id>`                      |
| 房间/频道（Discord/Slack）   | `agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>`（除非被覆盖）                                |

## 会话 ID（`sessionId`）

每个 `sessionKey` 指向一个当前 `sessionId`（继续该对话的转录文件）。决策逻辑位于 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认 Gateway 网关主机本地时间凌晨 4:00）会在越过重置边界后的下一条消息上创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes`，或旧版 `session.idleMinutes`）会在空闲窗口之后收到消息时创建新的 `sessionId`。如果同时配置了每日和空闲，先过期者生效。
- **Control UI 重连恢复**会在 Gateway 网关从操作员 UI 客户端收到匹配的 `sessionId` 时，为一次重连发送保留当前可见会话。这是一次性信号；普通的过期发送仍会创建新的 `sessionId`。
- **系统事件**（heartbeat、cron 唤醒、exec 通知、Gateway 网关簿记）可以变更会话行，但绝不会延长每日/空闲重置的新鲜度。重置滚动会在构建新提示词之前丢弃上一会话的排队系统事件通知。
- **父级 fork 策略**在创建线程或子智能体 fork 时使用 OpenClaw 的活动分支。如果该分支过大（超过固定内部上限，当前为 100K token），OpenClaw 会以隔离上下文启动子项，而不是失败或继承不可用的历史。大小测算是自动的且不可配置；旧版 `session.parentForkMaxTokens` 配置会被 `openclaw doctor --fix` 移除。

## 会话存储架构（`sessions.json`）

值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。关键字段（并非完整列表）：

- `sessionId`：当前转录 ID（除非设置了 `sessionFile`，否则文件名由此派生）
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置新鲜度使用此值。旧版行可能从 JSONL 会话头派生它。
- `lastInteractionAt`：最后一次真实用户/渠道交互时间戳；空闲重置新鲜度使用此值，因此 heartbeat、cron 和 exec 事件不会让会话保持存活。没有此字段的旧版行会回退到恢复出的会话开始时间。
- `updatedAt`：最后一次存储行变更时间戳，用于列表展示/修剪/记账，而不是每日/空闲新鲜度的权威依据。
- `archivedAt`：可选归档时间戳。已归档会话会保留在存储中，转录保持完整，并从正常活跃列表中排除。
- `pinnedAt`：可选固定时间戳。活跃的已固定会话会排在未固定会话之前；归档会话会清除其固定状态。
- Codex 线程互操作：两个字段都遵循 Codex 线程管理形状，传输层上的 `archived`/`pinned` 布尔值始终从时间戳派生并由服务器端盖戳，匹配 Codex `threads.archived_at` 语义和 camelCase 序列化。OpenClaw 时间戳是纪元毫秒，而 Codex 使用纪元秒，因此桥接器会在 codex 插件边界转换。Codex 目前还没有固定 API（只有 `thread/archive`/`thread/unarchive`）；固定状态会保留在 OpenClaw 侧，直到相应 API 出现，届时匹配的形状会让绑定会话以机械方式往返同步固定状态。
- `sessionFile`：可选的显式转录路径覆盖
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：群组/渠道标签元数据
- 开关：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（按会话覆盖）
- 模型选择：`providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为/依赖提供商）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此会话键完成自动压缩的次数
- `memoryFlushAt` / `memoryFlushCompactionCount`：上一次压缩前记忆刷新的时间戳和压缩计数

存储可以安全编辑，但 Gateway 网关是权威来源：会话运行时，它可能重写或重新水合条目。

## 转录结构（`*.jsonl`）

转录由 `SessionManager`（`openclaw/plugin-sdk/agent-sessions`）管理。文件是 JSONL：

- 第一行：会话头 - `type: "session"`、`id`、`cwd`、`timestamp`、可选 `parentSession`。
- 然后：包含 `id` + `parentId` 的条目（树结构）。

值得注意的条目类型：

- `message`：用户/助手/工具结果消息
- `custom_message`：由扩展注入的消息，_会_进入模型上下文（当 `display: true` 时在 TUI 中渲染，当 `display: false` 时完全隐藏）
- `custom`：_不会_进入模型上下文的扩展状态（用于跨重新加载持久化扩展状态）
- `compaction`：持久化的压缩摘要，包含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：导航树分支时持久化的摘要

OpenClaw 有意不会“修补”转录；Gateway 网关使用 `SessionManager` 读写它们。

## 上下文窗口与跟踪的 token

两个不同概念：

1. **模型上下文窗口**：每个模型的硬上限（模型可见的 token）。来自模型目录，并可通过配置覆盖。
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计信息（用于 `/status` 和仪表板）。`contextTokens` 是运行时估算/报告值，不要把它当成严格保证。

更多限制信息：[/reference/token-use](/zh-CN/reference/token-use)。

## 压缩：它是什么

压缩会把较早的对话汇总为转录中持久化的 `compaction` 条目，并保持最近消息不变。压缩后，未来轮次会看到压缩摘要以及 `firstKeptEntryId` 之后的消息。压缩是**持久化**的，不同于会话修剪，参见 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

压缩后重新注入 AGENTS.md 小节需要通过 `agents.defaults.compaction.postCompactionSections` 显式启用；当未设置或为 `[]` 时，OpenClaw 不会在压缩摘要之上追加 AGENTS.md 摘录。

### 分块边界和工具配对

将长转录拆分为压缩块时，OpenClaw 会让助手工具调用与匹配的 `toolResult` 条目保持配对：

- 如果按 token 占比拆分会落在工具调用和其结果之间，OpenClaw 会把边界移动到助手工具调用消息，而不是拆开这对条目。
- 如果尾部工具结果块本来会让分块超过目标，OpenClaw 会保留该待处理工具块，并保持未摘要的尾部完整。
- 已中止/错误的工具调用块不会让待处理拆分保持打开。

## 自动压缩何时发生

嵌入式 OpenClaw 智能体中有两个触发器：

1. **溢出恢复**：模型返回上下文溢出错误（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded`，以及其他提供商形态的变体）- 压缩，然后重试。当提供商报告尝试的 token 数时，OpenClaw 会把观测到的计数转发到溢出恢复压缩；如果提供商确认溢出但未暴露可解析计数，OpenClaw 会向压缩引擎和诊断传递一个略超预算的合成计数。如果溢出恢复仍然失败，OpenClaw 会显示明确指导，并保留当前会话映射，而不是静默轮换到新的会话 ID：重试该消息、运行 `/compact`，或运行 `/new`。
2. **阈值维护**：成功轮次之后，当 `contextTokens > contextWindow - reserveTokens` 时触发，其中 `contextWindow` 是模型的上下文窗口，`reserveTokens` 是为提示和下一次模型输出预留的余量。

这两个触发器之外还会运行两个额外保护：

- **预检本地压缩**：设置 `agents.defaults.compaction.maxActiveTranscriptBytes`（字节数或类似 `"20mb"` 的字符串），在活跃转录文件达到该大小后、打开下一次运行前触发本地压缩。这是用于降低本地重新打开成本的文件大小保护，不是原始归档；正常语义压缩仍会运行，并且它需要 `truncateAfterCompaction`，这样压缩后的摘要才会成为新的后继转录。
- **轮次中预检查**：设置 `agents.defaults.compaction.midTurnPrecheck.enabled: true`（默认 `false`）以添加工具循环保护。在追加工具结果之后、下一次模型调用之前，OpenClaw 会使用与轮次开始时相同的预检预算逻辑来估算提示压力。如果上下文不再容纳，保护不会内联压缩，而是引发结构化的轮次中预检查信号，停止当前提示提交，并让外层运行循环使用现有恢复路径（当截断过大的工具结果足够时执行截断，或触发已配置的压缩模式并重试）。它同时适用于 `default` 和 `safeguard` 压缩模式，包括由提供商支持的 safeguard 压缩。它独立于 `maxActiveTranscriptBytes`：字节大小保护会在轮次打开前运行，轮次中预检查稍后运行，在新工具结果追加之后运行。

## 压缩设置

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw 还会为嵌入式运行强制设置安全下限：如果 `compaction.reserveTokens` 低于 `reserveTokensFloor`（默认 `20000`），OpenClaw 会将其上调。设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用此下限。当活跃模型上下文窗口已知时，下限和最终有效预留都会被封顶，以免预留消耗整个提示预算。这会防止小上下文模型（例如 16K-token 本地模型）从第一个 token 就进入压缩；如果上下文窗口未知，已配置和当前预留预算保持不封顶。为什么需要下限：在压缩不可避免之前，为多轮“内务处理”（比如下面的记忆刷新）留下足够余量。实现：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`，由嵌入式运行器轮次和压缩设置路径调用。

手动 `/compact` 会遵循显式的 `agents.defaults.compaction.keepRecentTokens`，并保留运行时的最近尾部切点。没有显式保留预算时，手动压缩是一个硬检查点，重建后的上下文会从新摘要开始。

启用 `truncateAfterCompaction` 时，OpenClaw 会在压缩后将活跃转录轮换为一个压缩后的后继 JSONL。分支/恢复检查点操作会使用该压缩后的后继；旧版压缩前检查点文件在被引用期间仍可读取。

## 可插拔压缩提供商

插件通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 设置为已注册的提供商 ID 时，safeguard 扩展会把摘要委托给该提供商，而不是使用内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 ID。未设置时使用默认 LLM 摘要。设置 `provider` 会强制 `mode: "safeguard"`。
- 提供商接收与内置路径相同的压缩指令和标识符保留策略，并且 safeguard 仍会在提供商输出之后保留最近轮次和拆分轮次的后缀上下文。
- 内置 safeguard 摘要会将先前摘要与新消息重新提炼，而不是逐字保留完整的先前摘要。
- Safeguard 模式默认启用摘要质量审计；设置 `qualityGuard.enabled: false` 可跳过格式异常输出时重试的行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要。调用方显式触发的中止/超时信号会被重新抛出，而不是被吞掉，因此取消始终会受到尊重。

来源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## 用户可见表面

- 任意聊天会话中的 `/status`
- `openclaw status`（CLI）
- `openclaw sessions` / `openclaw sessions --json`
- Gateway 网关日志（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 详细模式：`🧹 Auto-compaction complete` 加上压缩计数

## 静默内务处理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，此时用户不应看到中间输出。

- 助手以精确静默 token `NO_REPLY` / `no_reply` 开始其输出，表示“不要向用户发送回复”。OpenClaw 会在投递层剥离/抑制它。
- 精确静默 token 抑制不区分大小写：当整个载荷只是静默 token 时，`NO_REPLY` 和 `no_reply` 都会计入。
- 自 `2026.1.10` 起，当部分分块以 `NO_REPLY` 开头时，OpenClaw 也会抑制草稿/输入中流式传输，因此静默操作不会在轮次中泄漏部分输出。
- 这只用于真正的后台/不投递轮次，不是普通可执行用户请求的捷径。

## 压缩前记忆刷新

自动压缩发生前，OpenClaw 可以运行一个静默的智能体轮次，将持久状态写入磁盘（例如 Agent 工作区中的 `memory/YYYY-MM-DD.md`），这样压缩就无法抹除关键上下文。它会监控会话上下文用量，一旦超过压缩阈值下方的软阈值，就使用精确静默 token `NO_REPLY` / `no_reply` 发送静默“立即写入记忆”指令，因此用户什么也看不到。

配置（`agents.defaults.compaction.memoryFlush`），完整参考见 [/gateway/config-agents](/zh-CN/gateway/config-agents#agentsdefaultscompaction)：

| 键名                        | 默认值           | 说明                                                                                                                                   |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未设置           | 仅用于刷写轮次的精确提供商/模型覆盖，例如 `ollama/qwen3:8b`                                                                            |
| `softThresholdTokens`       | `4000`           | 低于压缩阈值并会触发刷写的差值                                                                                                         |
| `forceFlushTranscriptBytes` | 未设置（禁用）   | 一旦转录文件达到此字节大小（或类似 `"2mb"` 的字符串）就强制刷写，即使 token 计数器已过期；`0` 会禁用                                   |
| `prompt`                    | 内置             | 刷写轮次的用户消息                                                                                                                     |
| `systemPrompt`              | 内置             | 为刷写轮次追加的额外系统提示词                                                                                                         |

说明：

- 默认提示词/系统提示词包含 `NO_REPLY` 提示，用于抑制投递。
- 设置 `model` 后，刷写轮次会使用该模型，且不会继承当前会话的回退链，因此仅本地的维护任务不会在失败时静默回退到付费对话模型。
- 每个压缩周期只运行一次刷写（记录在 `sessions.json` 中）。
- 刷写仅对嵌入式 OpenClaw 会话运行；CLI 后端和 Heartbeat 轮次会跳过它。
- 当会话工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时，会跳过刷写。
- 有关工作区文件布局和写入模式，请参阅 [Memory](/zh-CN/concepts/memory)。

OpenClaw 在扩展 API 中暴露了 `session_before_compact` 钩子，但上面的刷写逻辑位于 Gateway 网关侧（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`），而不是该钩子中。

## 故障排查清单

- **会话键错误？** 从 [/concepts/session](/zh-CN/concepts/session) 开始，并确认 `/status` 中的 `sessionKey`。
- **存储与转录不匹配？** 确认 Gateway 网关主机以及 `openclaw status` 中的存储路径。
- **压缩过于频繁？** 检查模型的上下文窗口（过小会导致频繁压缩）、`reserveTokens`（对模型窗口来说过高会导致更早压缩）以及工具结果膨胀（调整会话裁剪）。
- **在小型本地模型上，每个提示词似乎都会溢出？** 确认提供商报告了正确的模型上下文窗口。只有在已知该窗口时，OpenClaw 才能限制有效预留量。
- **静默轮次泄漏？** 确认回复以精确的静默 token `NO_REPLY` 开头（不区分大小写），并且你使用的构建包含流式传输抑制修复（`2026.1.10`+）。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话裁剪](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
- [Agent 配置参考](/zh-CN/gateway/config-agents)
