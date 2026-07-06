---
read_when:
    - 你需要调试会话 ID、转录 JSONL 或 sessions.json 字段
    - 你正在更改自动压缩行为，或添加“预压缩”清理维护
    - 你想实现记忆刷新或静默系统轮次
summary: 深入解析：会话存储 + 转录、生命周期和（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-07-06T21:50:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84b374402af261ed6d479dac85d44656cb83e52bba04d66153f3d66a608232ec
    source_path: reference/session-management-compaction.md
    workflow: 16
---

单个 **Gateway 网关进程** 端到端拥有会话状态。UI（macOS 应用、Web Control UI、TUI）会向 Gateway 网关查询会话列表和令牌计数。在远程模式下，会话文件位于远程主机上，因此检查你的本地 Mac 文件不会反映 Gateway 网关正在使用的内容。

先阅读概览文档：[会话管理](/zh-CN/concepts/session)、[压缩](/zh-CN/concepts/compaction)、[记忆概览](/zh-CN/concepts/memory)、[记忆搜索](/zh-CN/concepts/memory-search)、[会话清理](/zh-CN/concepts/session-pruning)、[转录卫生](/zh-CN/reference/transcript-hygiene)，完整配置参考见 [Agent 配置](/zh-CN/gateway/config-agents)。

## 两个持久化层

1. **会话存储（`sessions.json`）** - 键/值映射 `sessionKey -> SessionEntry`。体积小、可变，可以安全编辑或删除条目。跟踪元数据：当前会话 ID、最后活动时间、开关、令牌计数器。
2. **转录（`<sessionId>.jsonl`）** - 仅追加、树形结构（条目包含 `id` + `parentId`）。存储对话、工具调用和压缩摘要；为后续轮次重建模型上下文。压缩检查点是压缩后继转录上的元数据 - 新的压缩不会再写入第二份 `.checkpoint.*.jsonl` 副本。

Gateway 网关历史读取器会避免物化整个转录，除非某个表面需要任意历史访问。第一页历史、嵌入式聊天历史、重启恢复以及令牌/用量检查使用有界尾部读取。完整转录扫描通过异步转录索引进行，该索引按文件路径加 `mtimeMs`/`size` 缓存，并在并发读取器之间共享。

## 磁盘位置

每个智能体，在 Gateway 网关主机上（通过 `src/config/sessions.ts` 解析）：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 话题会话：`.../<sessionId>-topic-<threadId>.jsonl`

## 存储维护和磁盘控制

`session.maintenance` 控制 `sessions.json`、转录工件和轨迹边车文件的自动维护：

| 键                      | 默认值                 | 说明                                                                                 |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| `mode`                  | `"enforce"`            | 或 `"warn"`（仅报告，不变更）                                                        |
| `pruneAfter`            | `"30d"`                | 过期条目的年龄截止值                                                                 |
| `maxEntries`            | `500`                  | `sessions.json` 中的条目上限                                                         |
| `resetArchiveRetention` | 与 `pruneAfter` 相同   | `*.reset.<timestamp>` 转录归档的保留期；`false` 会禁用清理                           |
| `maxDiskBytes`          | 未设置                 | 可选的会话目录预算                                                                   |
| `highWaterBytes`        | `maxDiskBytes` 的 80%  | 预算清理后的目标值                                                                   |

Gateway 网关模型运行探测会话（匹配 `agent:*:explicit:model-run-<uuid>` 的键）有独立、固定的 `24h` 保留期。此清理受压力门控：只有在会话条目维护/上限压力达到时才会运行，并且只会在全局过期条目清理/上限步骤之前运行。其他显式会话不使用此保留期。

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先移除最旧的归档工件、孤立转录或孤立轨迹工件。
2. 如果仍高于目标值，则逐出最旧的会话条目及其转录/轨迹文件。
3. 重复，直到用量等于或低于 `highWaterBytes`。

`mode: "warn"` 会报告可能的逐出，但不会变更存储或文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

维护会保留持久的外部对话指针，例如群组会话和线程作用域聊天会话，但合成运行时条目（cron、钩子、heartbeat、ACP、子智能体）一旦超过配置的年龄、数量或磁盘预算，仍可能被移除。隔离的 cron 运行使用单独的 `cron.sessionRetention` 控制，独立于模型运行探测保留期。

正常 Gateway 网关写入会经过按存储划分的会话写入器，它会串行化进程内变更，而不获取运行时文件锁。热路径补丁辅助函数在持有该写入器槽位时借用已验证的可变缓存，因此大型 `sessions.json` 文件不会因每次元数据更新都被克隆或重新读取。运行时代码中优先使用 `updateSessionStore(...)` / `updateSessionStoreEntry(...)`；直接保存整个存储用于兼容性和离线维护工具。当 Gateway 网关可达时，非 dry-run 的 `openclaw sessions cleanup` 和 `openclaw agents delete` 会把存储变更委托给 Gateway 网关，使清理加入同一个写入器队列；`--store <path>` 是直接文件维护的显式离线修复路径，并且始终保留在本地（`--dry-run` 也是如此）。`maxEntries` 清理会针对生产规模存储进行批处理，因此在下一次高水位清理将其重写到上限以下之前，存储可能会短暂超过配置的上限。读取在 Gateway 网关启动期间绝不会清理或限制条目 - 只有写入或 `openclaw sessions cleanup --enforce` 会这样做，后者还会立即应用上限，并且即使未配置磁盘预算，也会清理旧的未引用转录、检查点和轨迹工件。

OpenClaw 不再在 Gateway 网关写入期间创建自动的 `sessions.json.bak.*` 轮转备份。旧版 `session.maintenance.rotateBytes` 键会被忽略，`openclaw doctor --fix` 会从较旧配置中移除它。

转录变更使用转录文件上的会话写入锁：

| 设置                                 | 默认值    | 环境变量覆盖                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` 是锁等待在放弃前暴露忙碌会话错误的时长；只有当合法的准备、清理、压缩或转录镜像工作在慢速机器上竞争更久时才提高它。`staleMs` 是现有锁可被回收为过期锁的时间。`maxHoldMs` 是进程内看门狗释放阈值。

## Cron 会话和运行日志

隔离的 cron 运行会创建自己的会话条目/转录，并使用专用保留期：

- `cron.sessionRetention`（默认 `"24h"`）会从存储中清理旧的隔离 cron 运行会话；`false` 会禁用。
- `cron.runLog.keepLines` 会按 cron 作业清理保留的 SQLite 运行历史行（默认 `2000`）。`cron.runLog.maxBytes` 仅为兼容较旧的文件型运行日志而接受。

当 cron 强制创建新的隔离运行会话时，它会在写入新行前清理上一个 `cron:<jobId>` 会话条目：它会携带安全偏好（thinking/fast/verbose/reasoning 设置、标签、显示名称）和显式用户选择的模型/凭证覆盖，但会丢弃环境对话上下文（渠道/群组路由、发送/队列策略、提权、来源、ACP 运行时绑定），因此新的隔离运行不会从较旧运行继承过期的投递或运行时权限。

## 会话键（`sessionKey`）

`sessionKey` 标识你所在的对话桶（路由 + 隔离）。规范规则：[/concepts/session](/zh-CN/concepts/session)。

| 模式                         | 示例                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| 主/直接聊天（按智能体）      | `agent:<agentId>:<mainKey>`（默认 `main`）                  |
| 群组                         | `agent:<agentId>:<channel>:group:<id>`                      |
| 房间/渠道（Discord/Slack）   | `agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>`（除非被覆盖）                                |

## 会话 ID（`sessionId`）

每个 `sessionKey` 指向一个当前 `sessionId`（继续对话的转录文件）。决策逻辑位于 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认 Gateway 网关主机本地时间凌晨 4:00）会在越过重置边界后的下一条消息创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes`，或旧版 `session.idleMinutes`）会在空闲窗口之后有消息到达时创建新的 `sessionId`。如果每日重置和空闲过期都已配置，则先过期者生效。
- **Control UI 重新连接恢复** 会在 Gateway 网关从操作员 UI 客户端收到匹配的 `sessionId` 时，为一次重新连接发送保留当前可见会话。这是一次性信号；普通的过期发送仍会创建新的 `sessionId`。
- **系统事件**（heartbeat、cron 唤醒、exec 通知、Gateway 网关记账）可能会变更会话行，但绝不会延长每日/空闲重置的新鲜度。重置滚动会在构建新提示前丢弃上一会话的队列中系统事件通知。
- **父级分叉策略** 在创建线程或子智能体分叉时使用 OpenClaw 的活动分支。如果该分支太大（超过固定内部上限，目前为 100K 令牌），OpenClaw 会以隔离上下文启动子级，而不是失败或继承不可用的历史。大小评估是自动的且不可配置；旧版 `session.parentForkMaxTokens` 配置会被 `openclaw doctor --fix` 移除。
- **操作员分叉**：`sessions.create { parentSessionKey, fork: true }` 会创建一个新会话，其转录从父级当前状态分支出来（与子智能体生成使用相同的分叉机制，包括上面的大小上限）。当父级有活动运行时会拒绝分叉；除非显式传入，否则会继承父级的模型选择，并用新的令牌计数器将子级标记为 `forkedFromParent`。

## 会话存储架构（`sessions.json`）

值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。关键字段（并非详尽）：

- `sessionId`：当前转录 id（除非设置了 `sessionFile`，否则文件名由此派生）
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置的新鲜度使用它。旧版行可能从 JSONL 会话头派生它。
- `lastInteractionAt`：最后一次真实用户/渠道交互时间戳；空闲重置的新鲜度使用它，因此 Heartbeat、cron 和 exec 事件不会让会话保持活跃。没有此字段的旧版行会回退到恢复出的会话开始时间。
- `updatedAt`：最后一次存储行变更时间戳，用于列表展示/裁剪/账务记录 - 不是每日/空闲新鲜度的权威来源。
- `archivedAt`：可选的归档时间戳。已归档会话会保留在存储中，其转录保持完整，并从普通活跃列表中排除。
- `pinnedAt`：可选的置顶时间戳。活跃的置顶会话会排在未置顶会话之前；归档会话会清除其置顶状态。
- Codex 线程互操作：两个字段都遵循 Codex 线程管理形状 - 线路上的 `archived`/`pinned` 布尔值始终从时间戳派生并在服务端盖戳，与 Codex `threads.archived_at` 语义和 camelCase 序列化保持一致。OpenClaw 时间戳是 epoch 毫秒，而 Codex 使用 epoch 秒，因此桥接层会在 codex 插件边界转换。Codex 目前还没有置顶 API（只有 `thread/archive`/`thread/unarchive`）；置顶状态会保留在 OpenClaw 侧，直到相关 API 存在，届时匹配的形状可让绑定会话机械地往返同步置顶状态。
- `lastReadAt` / `markedUnreadAt`：由 `sessions.patch { unread }` 在服务端盖戳的读取状态时间戳 - `unread: false` 记录一次已读（设置 `lastReadAt`，清除 `markedUnreadAt`）；`unread: true` 将会话标记为未读，直到下一次读取。会话行会暴露派生的 `unread` 布尔值：显式标记为未读，或读取时间早于最新活动。从未标记为已读的会话保持 `unread: false`，因此现有安装在升级后不会突然亮起。
- `lastActivityAt`：最后一次计为值得标记未读活动的已完成 Agent 运行时间戳（用户、渠道和 cron 运行）。Heartbeat 和内部事件轮次，以及元数据补丁，都不会更新它；`updatedAt` 不是活动信号。
- `sessionFile`：可选的显式转录路径覆盖
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：群组/渠道标签元数据
- 开关：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（按会话覆盖）
- 模型选择：`providerOverride`、`modelOverride`、`authProfileOverride`
- token 计数器（尽力而为/依赖提供商）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此会话键已完成自动压缩的次数
- `memoryFlushAt` / `memoryFlushCompactionCount`：上一次压缩前记忆刷新的时间戳和压缩计数

存储可以安全编辑，但 Gateway 网关是权威来源：它可能会在会话运行时重写或重新补水条目。

## 转录结构（`*.jsonl`）

转录由 `SessionManager`（`openclaw/plugin-sdk/agent-sessions`）管理。文件是 JSONL：

- 第一行：会话头 - `type: "session"`、`id`、`cwd`、`timestamp`、可选的 `parentSession`。
- 然后：带有 `id` + `parentId`（树结构）的条目。

重要条目类型：

- `message`：用户/助手/工具结果消息
- `custom_message`：插件注入的消息，_会_进入模型上下文（当 `display: true` 时在 TUI 中渲染，当 `display: false` 时完全隐藏）
- `custom`：_不会_进入模型上下文的插件状态（用于跨重新加载持久化插件状态）
- `compaction`：带有 `firstKeptEntryId` 和 `tokensBefore` 的持久化压缩摘要
- `branch_summary`：导航树分支时的持久化摘要

OpenClaw 有意不会“修补”转录；Gateway 网关使用 `SessionManager` 读取/写入它们。

## 上下文窗口与跟踪 token

两个不同概念：

1. **模型上下文窗口**：每个模型的硬上限（模型可见的 token）。来自模型目录，可通过配置覆盖。
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 `/status` 和仪表板）。`contextTokens` 是运行时估算/报告值 - 不要把它当作严格保证。

关于限制的更多信息：[/reference/token-use](/zh-CN/reference/token-use)。

## 压缩：它是什么

压缩会把较早的对话总结为转录中持久化的 `compaction` 条目，并保留最近消息不变。压缩后，未来轮次会看到压缩摘要加上 `firstKeptEntryId` 之后的消息。压缩是**持久的**，不同于会话裁剪 - 请参阅 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

压缩后重新注入 AGENTS.md 章节需要通过 `agents.defaults.compaction.postCompactionSections` 选择启用；未设置或为 `[]` 时，OpenClaw 不会在压缩摘要之上追加 AGENTS.md 摘录。

### 分块边界和工具配对

将长转录拆分为压缩分块时，OpenClaw 会让助手工具调用与其匹配的 `toolResult` 条目保持配对：

- 如果按 token 份额拆分的边界会落在工具调用和其结果之间，OpenClaw 会把边界移到助手工具调用消息处，而不是拆开这一对。
- 如果尾随工具结果块本来会让分块超过目标，OpenClaw 会保留该待处理工具块，并保持未摘要的尾部不变。
- 已中止/错误的工具调用块不会让待处理拆分保持打开。

## 何时发生自动压缩

嵌入式 OpenClaw 智能体中有两个触发器：

1. **溢出恢复**：模型返回上下文溢出错误（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded` 以及其他提供商形状的变体）- 先压缩，再重试。当提供商报告本次尝试的 token 数时，OpenClaw 会把该观测计数转发到溢出恢复压缩；如果提供商确认溢出但没有暴露可解析的计数，OpenClaw 会向压缩引擎和诊断传递一个略微超出预算的合成计数。如果溢出恢复仍然失败，OpenClaw 会显示明确指引，并保留当前会话映射，而不是静默轮换到新的会话 id - 请重试消息、运行 `/compact`，或运行 `/new`。
2. **阈值维护**：成功完成一轮后，当 `contextTokens > contextWindow - reserveTokens` 时，其中 `contextWindow` 是模型的上下文窗口，`reserveTokens` 是为提示词和下一次模型输出保留的余量。

另外两个守卫在这两个触发器之外运行：

- **预检本地压缩**：设置 `agents.defaults.compaction.maxActiveTranscriptBytes`（字节数或类似 `"20mb"` 的字符串），可在活跃转录文件达到该大小后、打开下一次运行前触发本地压缩。这是针对本地重新打开成本的文件大小守卫，不是原始归档 - 常规语义压缩仍会运行，并且需要 `truncateAfterCompaction`，以便压缩后的摘要成为新的后继转录。
- **轮次中预检查**：设置 `agents.defaults.compaction.midTurnPrecheck.enabled: true`（默认 `false`）以添加工具循环守卫。在追加工具结果之后、下一次模型调用之前，OpenClaw 会使用与轮次开始时相同的预检预算逻辑估算提示词压力。如果上下文已不再适配，守卫不会内联压缩 - 它会抛出结构化的轮次中预检查信号，停止当前提示提交，并让外层运行循环使用现有恢复路径（在足够时截断过大的工具结果，或触发已配置的压缩模式并重试）。同时适用于 `default` 和 `safeguard` 压缩模式，包括提供商支持的 safeguard 压缩。它独立于 `maxActiveTranscriptBytes`：字节大小守卫在轮次打开前运行，轮次中预检查稍后在追加新工具结果后运行。

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

OpenClaw 还会为嵌入式运行强制执行安全下限：如果 `compaction.reserveTokens` 低于 `reserveTokensFloor`（默认 `20000`），OpenClaw 会将其上调。设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用该下限。当活跃模型上下文窗口已知时，下限和最终有效保留量都会被封顶，因此保留量不能耗尽整个提示词预算。这可防止小上下文模型（例如 16K-token 本地模型）从第一个 token 就进入压缩；如果上下文窗口未知，已配置和当前保留预算不会封顶。为什么需要下限：在压缩变得不可避免之前，为多轮“后台维护”（如下方的记忆刷新）留下足够余量。实现：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`，由嵌入式运行器轮次和压缩设置路径调用。

手动 `/compact` 会遵循显式的 `agents.defaults.compaction.keepRecentTokens`，并保留运行时的最近尾部切分点。如果没有显式保留预算，手动压缩是一个硬检查点，重建后的上下文从新摘要开始。

启用 `truncateAfterCompaction` 时，OpenClaw 会在压缩后把活跃转录轮换为压缩后的后继 JSONL。分支/恢复检查点操作使用该压缩后的后继；旧版压缩前检查点文件在被引用时仍可读取。

## 可插拔压缩提供商

插件通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 设置为已注册的提供商 id 时，safeguard 扩展会把摘要委托给该提供商，而不是内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 id。留空则使用默认 LLM 摘要。设置 `provider` 会强制 `mode: "safeguard"`。
- 提供商会收到与内置路径相同的压缩说明和标识符保留策略，并且 safeguard 仍会在提供商输出之后保留最近轮次和拆分轮次的后缀上下文。
- 内置 safeguard 摘要会用新消息重新蒸馏既有摘要，而不是逐字保留完整的前一个摘要。
- Safeguard 模式默认启用摘要质量审计；设置 `qualityGuard.enabled: false` 可跳过格式异常输出时重试的行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要。调用方显式触发的中止/超时信号会重新抛出，而不会被吞掉，因此取消始终会被尊重。

来源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## 用户可见界面

- 任意聊天会话中的 `/status`
- `openclaw status`（CLI）
- `openclaw sessions` / `openclaw sessions --json`
- Gateway 网关日志（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 详细模式：`🧹 Auto-compaction complete` 加上压缩计数

## 静默后台维护（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，此时用户不应看到中间输出。

- assistant 以精确的静默令牌 `NO_REPLY` / `no_reply` 开始输出，表示“不要向用户投递回复”。OpenClaw 会在投递层剥离/抑制它。
- 精确静默令牌抑制不区分大小写：当整个载荷只有静默令牌时，`NO_REPLY` 和 `no_reply` 都会生效。
- 自 `2026.1.10` 起，当部分分块以 `NO_REPLY` 开头时，OpenClaw 也会抑制草稿/正在输入流式传输，因此静默操作不会在轮次中途泄漏部分输出。
- 这仅用于真正的后台/不投递轮次，不是普通可执行用户请求的捷径。

## 预压缩记忆刷新

在自动压缩发生之前，OpenClaw 可以运行一个静默的 agentic 轮次，将持久状态写入磁盘（例如 Agent 工作区中的 `memory/YYYY-MM-DD.md`），这样压缩就不会擦除关键上下文。它会监控会话上下文使用量，一旦超过低于压缩阈值的软阈值，就会使用精确静默令牌 `NO_REPLY` / `no_reply` 发送静默的“立即写入记忆”指令，因此用户不会看到任何内容。

配置（`agents.defaults.compaction.memoryFlush`），完整参考见 [/gateway/config-agents](/zh-CN/gateway/config-agents#agentsdefaultscompaction)：

| 键名                        | 默认值           | 说明                                                                                                                                   |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未设置           | 仅用于刷新轮次的精确提供商/模型覆盖，例如 `ollama/qwen3:8b`                                                                            |
| `softThresholdTokens`       | `4000`           | 低于压缩阈值并触发刷新的差值                                                                                                           |
| `forceFlushTranscriptBytes` | 未设置（已禁用） | 一旦转录文件达到此字节大小（或类似 `"2mb"` 的字符串）就强制刷新，即使令牌计数器已过期；`0` 会禁用                                      |
| `prompt`                    | 内置             | 刷新轮次的用户消息                                                                                                                     |
| `systemPrompt`              | 内置             | 为刷新轮次追加的额外系统提示                                                                                                           |

说明：

- 默认提示/系统提示包含一个 `NO_REPLY` 提示，用于抑制投递。
- 设置 `model` 时，刷新轮次会使用该模型，而不会继承活动会话的 fallback 链，因此仅本地的 housekeeping 不会在失败时静默 fallback 到付费对话模型。
- 每个压缩周期只运行一次刷新（在 `sessions.json` 中跟踪）。
- 刷新仅对嵌入式 OpenClaw 会话运行；CLI 后端和 Heartbeat 轮次会跳过它。
- 当会话工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时，会跳过刷新。
- 工作区文件布局和写入模式见 [Memory](/zh-CN/concepts/memory)。

OpenClaw 在扩展 API 中暴露了 `session_before_compact` 钩子，但上面的刷新逻辑位于 Gateway 网关侧（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`），不在该钩子上。

## 故障排查清单

- **会话键错误？** 从 [/concepts/session](/zh-CN/concepts/session) 开始，并确认 `/status` 中的 `sessionKey`。
- **存储与转录不匹配？** 从 `openclaw status` 确认 Gateway 网关主机和存储路径。
- **压缩刷屏？** 检查模型的上下文窗口（太小会迫使频繁压缩）、`reserveTokens`（相对于模型窗口过高会导致更早压缩）以及工具结果膨胀（调整会话修剪）。
- **每个提示在小型本地模型上似乎都会溢出？** 确认提供商报告了正确的模型上下文窗口。OpenClaw 只有在知道该窗口时，才能限制有效预留量。
- **静默轮次泄漏？** 确认回复以精确静默令牌 `NO_REPLY` 开头（不区分大小写），并且你使用的构建包含流式传输抑制修复（`2026.1.10`+）。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
- [Agent 配置参考](/zh-CN/gateway/config-agents)
