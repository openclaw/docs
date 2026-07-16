---
read_when:
    - 你需要调试会话 ID、转录事件或会话行字段
    - 你正在更改自动压缩行为或添加“压缩前”整理操作
    - 你希望实现记忆刷新或静默系统轮次
summary: 深入解析：会话存储与转录记录、生命周期及（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-07-16T11:57:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

单个 **Gateway 网关进程**端到端管理会话状态。UI（macOS 应用、Web Control UI、TUI）向 Gateway 网关查询会话列表和 token 计数。在远程模式下，会话文件位于远程主机上，因此检查本地 Mac 上的文件无法反映 Gateway 网关实际使用的内容。

请先阅读概览文档：[会话管理](/zh-CN/concepts/session)、[压缩](/zh-CN/concepts/compaction)、[记忆概览](/zh-CN/concepts/memory)、[记忆搜索](/zh-CN/concepts/memory-search)、[会话修剪](/zh-CN/concepts/session-pruning)、[转录记录整理](/zh-CN/reference/transcript-hygiene)；完整配置参考见 [Agent 配置](/zh-CN/gateway/config-agents)。

## 两个持久化层

1. **会话行（每个 Agent 独立的 SQLite）** - 键值映射 `sessionKey -> SessionEntry`。由 Gateway 网关管理的可变运行时状态。跟踪以下元数据：当前会话 ID、上次活动时间、开关和 token 计数器。
2. **转录事件（每个 Agent 独立的 SQLite）** - 仅追加的树形结构（条目包含 `id` + `parentId`）。存储对话、工具调用和压缩摘要；为后续轮次重建模型上下文。压缩检查点是已压缩后继转录记录上的元数据，新一轮压缩不会再写入一份 `.checkpoint.*.jsonl` 副本。

较旧的安装可能仍在 Agent 的 `sessions/`
目录下保留 `sessions.json` 文件。应将这些文件视为旧版会话行迁移输入或明确的
离线维护目标。Gateway 网关启动和 `openclaw doctor --fix` 会自动将
活跃的旧版行和转录历史导入每个 Agent 的 SQLite 存储。
需要明确的检查或验证证据时，请运行 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`，然后按照 [Doctor 迁移
流程](/zh-CN/cli/doctor#session-sqlite-migration)操作。如果旧版转录
工件归档后迁移失败，请使用该流程中的 Doctor 恢复模式。
恢复过程使用迁移清单，仅还原受影响的已归档支持
工件，在请求时准备经过清理的 GitHub Issue 报告，并且不会
让活跃运行时重新读取 JSONL 文件。

除非相关界面需要任意历史访问，否则 Gateway 网关历史记录读取器不会将整个转录记录载入内存。首页历史记录、嵌入式聊天历史记录、重启恢复以及 token/用量检查均使用 SQLite 的有界尾部读取。完整转录记录扫描通过异步转录索引执行，并在并发读取器之间共享。

## 磁盘位置

在 Gateway 网关主机上，每个 Agent 的位置如下（通过 `src/config/sessions.ts` 解析）：

- 运行时会话行存储：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 运行时转录行：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 旧版/归档转录工件：`~/.openclaw/agents/<agentId>/sessions/`
- 旧版行迁移输入：`~/.openclaw/agents/<agentId>/sessions/sessions.json`

## 存储维护和磁盘控制

`session.maintenance` 控制 SQLite 会话行、SQLite 转录行、归档工件和轨迹旁路文件的自动维护：

| 键                      | 默认值                | 说明                                                                                         |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | 或 `"warn"`（仅报告，不进行修改）                                                      |
| `pruneAfter`            | `"30d"`               | 陈旧条目的年龄截止值                                                                      |
| `maxEntries`            | `500`                 | 会话条目数量上限                                                                      |
| `resetArchiveRetention` | 保留（无年龄截止值）  | `*.reset.*`/`*.deleted.*` 转录归档的年龄截止值；设置持续时间即可启用删除 |
| `maxDiskBytes`          | `2gb`                 | 每个 Agent 的会话磁盘预算；`false` 表示禁用                                            |
| `highWaterBytes`        | `maxDiskBytes` 的 80% | 预算清理后的目标值                                                                 |

归档转录记录默认保留，并在运行时支持时使用 zstd（`*.jsonl.<reason>.<timestamp>.zst`）压缩，因此删除或重置会话绝不会悄然丢弃对话历史。磁盘预算会先逐出最旧的归档，然后才会处理活跃会话。

SQLite 对 `maxDiskBytes` 的主动执行按会话测量会话行 JSON 加转录事件 JSON 的字节数；旧版离线维护执行则测量所选会话目录中的文件。

Gateway 网关模型运行探测会话（键与 `agent:*:explicit:model-run-<uuid>` 匹配）使用独立且固定的 `24h` 保留期。此修剪受压力条件控制：仅在达到会话条目维护/上限压力时运行，并且只在全局陈旧条目清理/上限步骤之前执行。其他显式会话不使用此保留期。

磁盘预算清理（`mode: "enforce"`）的执行顺序：

1. 首先移除最旧的已归档转录工件、孤立的旧版工件或孤立的轨迹工件。
2. 如果仍高于目标值，则逐出最旧的会话条目及其转录行或轨迹工件。
3. 重复执行，直到用量不高于 `highWaterBytes`。

`mode: "warn"` 会报告可能逐出的内容，但不会修改存储或文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

维护操作会保留持久的外部对话指针，例如群组会话和线程范围的聊天会话；但合成运行时条目（cron、hooks、heartbeat、ACP、子智能体）超过配置的年龄、数量或磁盘预算后仍可能被移除。隔离的 cron 运行使用独立的 `cron.sessionRetention` 控制项，与模型运行探测的保留策略无关。

正常的 Gateway 网关写入通过会话访问器进行，该访问器借助运行时写入器路径串行处理每个 Agent 的 SQLite 修改。运行时代码应优先使用 `src/config/sessions/session-accessor.ts` 中的访问器辅助函数；旧版 `sessions.json` 辅助函数用于迁移和离线维护。当 Gateway 网关可访问时，非试运行的 `openclaw sessions cleanup` 和 `openclaw agents delete` 会将存储修改委托给 Gateway 网关，使清理操作加入同一个写入队列；`--store <path>` 是针对选定旧版存储的显式离线修复路径，始终在本地执行（`--dry-run` 亦如此）。`maxEntries` 清理针对生产规模的存储分批执行，因此存储可能短暂超过配置的上限，直到下一次高水位清理将其重写到上限以内。Gateway 网关启动期间，读取操作绝不会修剪条目或限制其数量；只有写入操作或 `openclaw sessions cleanup --enforce` 才会这样做，后者还会立即应用上限，并且即使未配置磁盘预算，也会修剪未被引用的旧版转录、检查点和轨迹工件。

OpenClaw 在 Gateway 网关写入期间不再自动创建 `sessions.json.bak.*` 轮换备份。当前架构会拒绝旧版 `session.maintenance.rotateBytes` 键，而 `openclaw doctor --fix` 会从旧配置中移除该键。

转录记录修改使用会话写入队列写入 SQLite 转录目标：

| 设置                                 | 默认值    | 环境变量覆盖                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` 表示锁等待多久后会报告会话繁忙错误并放弃；仅当合理的准备、清理、压缩或转录镜像工作在较慢的机器上产生更长时间的争用时，才应增大此值。`staleMs` 表示现有锁经过多久后可作为陈旧锁回收。`maxHoldMs` 是进程内看门狗的释放阈值。

### SQLite 切换后降级

运行较旧的文件存储版 OpenClaw 前，请还原已归档的旧版转录工件：

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

迁移会保留旧版 `sessions.json` 文件，以便提供支持和
回滚，但已导入 SQLite 的活跃转录 JSONL 文件会被
重命名到 `session-sqlite-import-archive/` 中。较旧的文件存储运行时会遵循
`sessions.json` 中的 `sessionFile` 路径，因此必须在启动
前还原这些工件。还原操作使用迁移清单，仅移动其中记录且
原始路径已不存在的已归档工件，并保留 SQLite 数据库
以便后续恢复。

SQLite 切换后创建的会话仅存在于 SQLite 中，不会显示在
较旧的文件存储运行时中。如果在降级后再次升级，请重新运行 Doctor
检查和验证流程，以便 OpenClaw 在导入前验证已还原的旧版
工件。

## Cron 会话和运行日志

隔离的 cron 运行会创建自己的会话条目/转录记录，并使用专用保留策略：

- `cron.sessionRetention`（默认为 `"24h"`）会从存储中修剪旧的隔离 cron 运行会话；`false` 表示禁用。
- 运行历史记录会为每个 cron 作业保留最新的 2000 个终止状态行。丢失的行仍保留其 24 小时清理窗口。

当 cron 强制创建新的隔离运行会话时，它会在写入新行之前清理此前的 `cron:<jobId>` 会话条目：保留安全偏好设置（思考/快速/详细/推理设置、标签、显示名称）和用户显式选择的模型/身份验证覆盖项，但移除环境对话上下文（渠道/群组路由、发送/队列策略、权限提升、来源、ACP 运行时绑定），从而避免新的隔离运行从旧运行中继承过期的交付或运行时权限。

## 会话键（`sessionKey`）

`sessionKey` 用于标识当前所属的对话存储桶（路由 + 隔离）。规范规则见：[/concepts/session](/zh-CN/concepts/session)。

| 模式                         | 示例                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| 主聊天/直接聊天（每个 Agent） | `agent:<agentId>:<mainKey>`（默认为 `main`）                |
| 群组                         | `agent:<agentId>:<channel>:group:<id>`                      |
| 房间/渠道（Discord/Slack）    | `agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>`（除非被覆盖）                           |

## 会话 ID（`sessionId`）

每个 `sessionKey` 都指向当前的 `sessionId`（用于延续对话的 SQLite 转录标识）。决策逻辑位于 `src/auto-reply/reply/session.ts` 的 `initSessionState()` 中。

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认为 Gateway 网关主机本地时间凌晨 4:00）会在越过重置边界后的下一条消息到达时创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes`，或旧版 `session.idleMinutes`）会在空闲窗口结束后有消息到达时创建新的 `sessionId`。如果同时配置了每日重置和空闲过期，则以先过期者为准。
- **Control UI 重连恢复**会保留当前可见会话，以便 Gateway 网关从操作员 UI 客户端收到匹配的 `sessionId` 时，在重连后发送一次。这是一次性信号；普通的过期发送仍会创建新的 `sessionId`。
- **系统事件**（Heartbeat、cron 唤醒、Exec 通知、Gateway 网关内部记录）可能会修改会话行，但绝不会延长每日重置或空闲重置的新鲜度。重置轮转会在构建新提示词之前，丢弃上一会话中排队的系统事件通知。
- **父级分叉策略**在创建线程或子智能体分叉时使用 OpenClaw 的活动分支。如果该分支过大（超过固定的内部上限，当前为 100K tokens），OpenClaw 会使用隔离上下文启动子级，而不是失败或继承无法使用的历史记录。大小计算自动进行且不可配置；旧版 `session.parentForkMaxTokens` 配置会由 `openclaw doctor --fix` 移除。
- **操作员分叉**：`sessions.create { parentSessionKey, fork: true }` 会创建一个新会话，其转录记录从父会话的当前状态分支出来（使用与生成子智能体相同的分叉机制，包括上述大小上限）。当父会话有活动运行时会拒绝分叉；除非显式传入模型，否则会继承父会话的模型选择；并使用全新的 token 计数器将子会话标记为 `forkedFromParent`。

## 会话存储架构

运行时存储在每个智能体的 SQLite 中保存 `SessionEntry` 值。值类型为 `src/config/sessions.ts` 中的 `SessionEntry`。关键字段（并非完整列表）：

- `sessionId`：用于寻址 SQLite 转录记录行的当前转录记录 ID
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置的新鲜度使用此字段。旧版行可能从 JSONL 会话标头中推导该值。
- `lastInteractionAt`：上次真实用户/渠道交互的时间戳；空闲重置的新鲜度使用此字段，因此 Heartbeat、cron 和 Exec 事件不会让会话持续保持活动。缺少此字段的旧版行会回退到恢复出的会话开始时间。
- `updatedAt`：上次存储行修改的时间戳，用于列表、清理和内部记录，而不是每日重置或空闲重置的新鲜度权威来源。
- `archivedAt`：可选的归档时间戳。已归档会话及其完整转录记录仍保留在存储中，但会从普通活动列表中排除。
- `pinnedAt`：可选的固定时间戳。活动且已固定的会话排在未固定会话之前；归档会话会清除其固定状态。
- Codex 线程互操作：两个字段都遵循 Codex 线程管理结构——传输中的 `archived`/`pinned` 布尔值始终根据时间戳派生并由服务器端写入，与 Codex `threads.archived_at` 语义和 camelCase 序列化保持一致。OpenClaw 时间戳使用 epoch 毫秒，而 Codex 使用 epoch 秒，因此桥接器会在 `codex` 插件接缝处进行转换。Codex 尚无固定 API（仅有 `thread/archive`/`thread/unarchive`）；在该 API 出现之前，固定状态会保留在 OpenClaw 端。届时，匹配的结构可让绑定会话以机械方式往返传递固定状态。
- Codex 监督仅列出未归档的原生线程。只有在操作员显式确认没有其他 Codex 进程拥有某个 Gateway 网关本地的 `idle` 或 `notLoaded` 活动状态未知线程后，才能通过原生 `thread/archive` 将其归档；插件会先重新读取一次进程本地状态，随后该线程会从目录中消失。该读取无法证明没有其他 App Server 进程正在使用此线程。OpenClaw 拒绝归档活动行和错误行；在节点桥接能够拥有完整的流式线程生命周期之前，配对节点归档不可用。在原生 Codex 客户端中取消归档后，该线程将可以再次出现。
- `lastReadAt` / `markedUnreadAt`：由 `sessions.patch { unread }` 在服务器端写入的读取状态时间戳——`unread: false` 记录一次读取（设置 `lastReadAt`，清除 `markedUnreadAt`）；`unread: true` 将会话标记为未读，直到下一次读取。会话行会公开派生的 `unread` 布尔值：显式标记为未读，或读取时间早于最新活动。 从未标记为已读的会话保持 `unread: false`，因此现有安装在升级后不会突然显示未读状态。
- `lastActivityAt`：上次已完成且应计为未读活动的智能体运行时间戳（用户、渠道和 cron 运行）。Heartbeat、内部事件轮次和元数据补丁不会更新该值；`updatedAt` 不是活动信号。
- `sessionFile`：为迁移/归档兼容性保留的旧版标记；活动运行时使用 SQLite 身份
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：群组/渠道标签元数据
- 开关：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（按会话覆盖）
- 模型选择：`providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为/取决于提供商）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此会话键完成自动压缩的次数
- `memoryFlushAt` / `memoryFlushCompactionCount`：上次压缩前记忆刷新的时间戳和压缩次数

Gateway 网关是权威来源：它可能会在会话运行时重写或重新填充条目。对于旧版基于文件的安装，请使用
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` 进行迁移，而不要
编辑 `sessions.json` 并期望运行时继续读取该文件。

## 转录事件结构

转录记录由 OpenClaw 会话访问器管理，并通过基于身份的辅助函数公开给运行时代码。事件流仅可追加：

- 第一条记录：会话标头——`type: "session"`、`id`、`cwd`、`timestamp`，以及可选的 `parentSession`。
- 然后：包含 `id` + `parentId` 的条目（树状结构）。

值得注意的条目类型：

- `message`：用户/助手/toolResult 消息
- `custom_message`：由扩展注入且_会_进入模型上下文的消息（当 `display: true` 时在 TUI 中呈现，当 `display: false` 时完全隐藏）
- `custom`：_不会_进入模型上下文的扩展状态（用于在重新加载后持久保存扩展状态）
- `compaction`：包含 `firstKeptEntryId` 和 `tokensBefore` 的持久化压缩摘要
- `branch_summary`：导航树分支时持久化的摘要

OpenClaw 有意不对转录记录进行“修正”；Gateway 网关使用 `SessionManager` 读取/写入转录记录。

## 上下文窗口与跟踪的 token

这是两个不同的概念：

1. **模型上下文窗口**：每个模型的硬上限（模型可见的 token）。该值来自模型目录，并可通过配置覆盖。
2. **会话存储计数器**：写入会话行的滚动统计信息（用于 `/status` 和仪表板）。`contextTokens` 是运行时估算/报告值——不要将其视为严格保证。

有关限制的更多信息：[/reference/token-use](/zh-CN/reference/token-use)。

## 压缩：它是什么

压缩会将较早的对话概括为转录记录中持久化的 `compaction` 条目，同时完整保留最近的消息。压缩后，后续轮次会看到压缩摘要以及 `firstKeptEntryId` 之后的消息。与会话清理不同，压缩是**持久的**——请参阅 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

压缩后重新注入 AGENTS.md 章节可通过 `agents.defaults.compaction.postCompactionSections` 选择启用；当未设置或设为 `[]` 时，OpenClaw 不会在压缩摘要之后附加 AGENTS.md 摘录。

### 分块边界和工具配对

将较长的转录记录拆分为压缩块时，OpenClaw 会将助手工具调用与对应的 `toolResult` 条目保持配对：

- 如果按 token 占比划分时边界会落在工具调用与其结果之间，OpenClaw 会将边界移至助手工具调用消息处，而不是拆散这对条目。
- 如果末尾的工具结果块会使分块超过目标大小，OpenClaw 会保留该待处理工具块，并保持未摘要的尾部不变。
- 已中止/出错的工具调用块不会使待处理拆分保持开启。

## 自动压缩何时发生

嵌入式 OpenClaw 智能体中有两个触发器：

1. **溢出恢复**：模型返回上下文溢出错误（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded`，以及其他提供商特有的变体）——先压缩，再重试。当提供商报告尝试使用的 token 数时，OpenClaw 会将观察到的计数传递给溢出恢复压缩；如果提供商确认发生溢出但没有公开可解析的计数，OpenClaw 会向压缩引擎和诊断传递一个仅略微超出预算的合成计数。如果溢出恢复仍然失败，OpenClaw 会显示明确的指导，并保留当前会话映射，而不是静默轮转到新的会话 ID——请重试该消息、运行 `/compact`，或运行 `/new`。
2. **阈值维护**：成功完成一个轮次后，当 `contextTokens > contextWindow - reserveTokens` 时触发，其中 `contextWindow` 是模型的上下文窗口，`reserveTokens` 是为提示词和模型下一次输出保留的余量。

这两个触发器之外还会运行两个额外防护：

- **预检本地压缩**：将 `agents.defaults.compaction.maxActiveTranscriptBytes` 设置为字节数或类似 `"20mb"` 的字符串，可在活动转录记录达到该大小后，于开始下一次运行前触发本地压缩。这是用于控制本地重新打开成本的大小防护，而不是原始归档——仍会执行普通的语义压缩，并且需要 `truncateAfterCompaction`，以便压缩后的摘要成为新的后继转录记录。
- **轮次中预检查**：设置 `agents.defaults.compaction.midTurnPrecheck.enabled: true`（默认值为 `false`）可添加工具循环防护。在追加工具结果之后、下一次模型调用之前，OpenClaw 会使用与轮次开始时相同的预检预算逻辑来估算提示词压力。如果上下文已无法容纳，该防护不会内联执行压缩——它会引发结构化的轮次中预检查信号，停止当前提示词提交，并让外层运行循环使用现有恢复路径（如果截断过大的工具结果已足够，则进行截断；否则触发配置的压缩模式并重试）。它适用于 `default` 和 `safeguard` 两种压缩模式，包括由提供商支持的防护性压缩。它独立于 `maxActiveTranscriptBytes`：字节大小防护在轮次开始前运行，而轮次中预检查稍后运行，即在追加新的工具结果之后运行。

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

OpenClaw 还会对嵌入式运行强制设置安全下限：如果 `compaction.reserveTokens` 低于 `reserveTokensFloor`（默认值为 `20000`），OpenClaw 会将其提高到该下限。设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用此下限。当已知当前模型的上下文窗口时，下限和最终有效预留量都会受到限制，以确保预留量不会耗尽整个提示预算。这可以防止小上下文模型（例如具有 16K token 的本地模型）从第一个 token 起就进入压缩；如果上下文窗口未知，配置的预留预算和当前预留预算均不设上限。为何需要下限：在压缩不可避免之前，为多轮“内务处理”（如下文的记忆刷新）留出足够余量。实现：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`，由嵌入式运行器的轮次和压缩设置路径调用。

手动 `/compact` 会遵循显式的 `agents.defaults.compaction.keepRecentTokens`，并保留运行时最近尾部的截断点。如果未显式指定保留预算，手动压缩将作为硬检查点，重建的上下文会从新摘要开始。

启用 `truncateAfterCompaction` 后，OpenClaw 会在压缩后将当前转录轮换为压缩后的后继转录。分支/恢复检查点操作会使用该压缩后的后继转录；只要仍被引用，旧版压缩前检查点文件仍可读取。

## 可插拔压缩提供商

插件通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 设置为已注册的提供商 ID 时，保护扩展会将摘要生成委托给该提供商，而不是使用内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 ID。保持未设置可使用默认的 LLM 摘要生成。设置 `provider` 会强制使用 `mode: "safeguard"`。
- 提供商会收到与内置路径相同的压缩指令和标识符保留策略，并且在提供商输出后，保护机制仍会保留最近轮次和拆分轮次的后缀上下文。
- 内置保护摘要会将先前摘要与新消息重新提炼，而不是逐字保留完整的旧摘要。
- 保护模式默认启用摘要质量审核；设置 `qualityGuard.enabled: false` 可跳过输出格式异常时的重试行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要生成。调用方显式触发的中止/超时信号会被重新抛出，而不会被吞掉，因此取消操作始终会得到遵循。

来源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## 用户可见界面

- 任何聊天会话中的 `/status`
- `openclaw status`（CLI）
- `openclaw sessions` / `openclaw sessions --json`
- Gateway 网关日志（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 详细模式：`🧹 Auto-compaction complete` 加压缩次数

## 静默内务处理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，在此类轮次中，用户不应看到中间输出。

- 助手以精确的静默 token `NO_REPLY` / `no_reply` 开始输出，表示“不向用户发送回复”。OpenClaw 会在传递层移除/抑制此内容。
- 精确静默 token 的抑制不区分大小写：当整个载荷仅包含静默 token 时，`NO_REPLY` 和 `no_reply` 均视为有效。
- 自 `2026.1.10` 起，如果部分分块以 `NO_REPLY` 开头，OpenClaw 还会抑制草稿/输入状态的流式传输，防止静默操作在轮次中途泄露部分输出。
- 这仅用于真正的后台/不传递轮次，不是处理普通可执行用户请求的捷径。

## 压缩前记忆刷新

在自动压缩发生前，OpenClaw 可以运行一个静默的智能体轮次，将持久状态写入磁盘（例如 Agent 工作区中的 `memory/YYYY-MM-DD.md`），从而防止压缩清除关键上下文。它会监控会话上下文用量，一旦超过低于压缩阈值的软阈值，就会使用精确的静默 token `NO_REPLY` / `no_reply` 发送一条静默的“立即写入记忆”指令，使用户看不到任何内容。

配置（`agents.defaults.compaction.memoryFlush`），完整参考见 [/gateway/config-agents](/zh-CN/gateway/config-agents#agentsdefaultscompaction)：

| 键                          | 默认值           | 说明                                                                                                                                   |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未设置           | 仅用于刷新轮次的精确提供商/模型覆盖，例如 `ollama/qwen3:8b`                                                   |
| `softThresholdTokens`       | `4000`           | 低于压缩阈值多少时触发刷新                                                                               |
| `forceFlushTranscriptBytes` | 未设置（已禁用） | 一旦转录文件达到此字节大小（或 `"2mb"` 之类的字符串），即使 token 计数器已过期也强制刷新；`0` 会禁用 |
| `prompt`                    | 内置             | 刷新轮次的用户消息                                                                                                        |
| `systemPrompt`              | 内置             | 为刷新轮次附加的额外系统提示词                                                                                        |

注意：

- 默认提示词/系统提示词包含 `NO_REPLY` 提示，用于抑制传递。
- 设置 `model` 后，刷新轮次会使用该模型，而不继承当前会话的回退链，因此纯本地内务处理失败时，不会悄然回退到付费对话模型。
- 每个压缩周期只运行一次刷新（在会话行中跟踪）。
- 刷新仅对嵌入式 OpenClaw 会话运行；CLI 后端和 Heartbeat 轮次会跳过刷新。
- 当会话工作区为只读时（`workspaceAccess: "ro"` 或 `"none"`），会跳过刷新。
- 有关工作区文件布局和写入模式，请参阅[记忆](/zh-CN/concepts/memory)。

OpenClaw 在扩展 API 中公开了 `session_before_compact` 钩子，但上述刷新逻辑位于 Gateway 网关侧（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`），而不是该钩子上。

## 故障排查清单

- **会话键有误？** 从[/concepts/session](/zh-CN/concepts/session)开始，并确认 `/status` 中的 `sessionKey`。
- **存储与转录不匹配？** 根据 `openclaw status` 确认 Gateway 网关主机和存储路径。
- **频繁压缩？** 检查模型的上下文窗口（过小会迫使系统频繁压缩）、`reserveTokens`（相对于模型窗口过高会导致更早压缩）以及工具结果膨胀（调整会话剪枝）。
- **小型本地模型似乎每个提示都会溢出？** 确认提供商报告了正确的模型上下文窗口。OpenClaw 仅在已知该窗口时才能限制有效预留量。
- **静默轮次发生泄露？** 确认回复以精确的静默 token `NO_REPLY` 开头（不区分大小写），并且使用的构建版本包含流式传输抑制修复（`2026.1.10`+）。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话剪枝](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
- [Agent 配置参考](/zh-CN/gateway/config-agents)
