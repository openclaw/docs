---
read_when:
    - 你需要调试会话 ID、记录事件或会话行字段
    - 你正在更改自动压缩行为或添加“压缩前”清理操作
    - 你想要实现记忆刷新或静默系统轮次
summary: 深入解析：会话存储与转录、生命周期及（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-07-12T14:44:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2f06b50dcece64a92c2b35a468910b2069622d14649ab24052a5a7956f9d41d1
    source_path: reference/session-management-compaction.md
    workflow: 16
---

单个 **Gateway 网关进程**端到端拥有会话状态。UI（macOS 应用、Web Control UI、TUI）会向 Gateway 网关查询会话列表和令牌计数。在远程模式下，会话文件位于远程主机上，因此检查本地 Mac 上的文件无法反映 Gateway 网关实际使用的内容。

请先阅读概览文档：[会话管理](/zh-CN/concepts/session)、[压缩](/zh-CN/concepts/compaction)、[记忆概览](/zh-CN/concepts/memory)、[记忆搜索](/zh-CN/concepts/memory-search)、[会话清理](/zh-CN/concepts/session-pruning)、[对话记录卫生](/zh-CN/reference/transcript-hygiene)，完整配置参考见 [Agent 配置](/zh-CN/gateway/config-agents)。

## 两个持久化层

1. **会话行（每个 Agent 一个 SQLite）** - 键值映射 `sessionKey -> SessionEntry`。由 Gateway 网关拥有的可变运行时状态。跟踪以下元数据：当前会话 ID、最后活动时间、开关和令牌计数器。
2. **对话记录事件（每个 Agent 一个 SQLite）** - 仅追加的树状结构（条目包含 `id` + `parentId`）。存储对话、工具调用和压缩摘要；为后续轮次重建模型上下文。压缩检查点是已压缩后继对话记录上的元数据——新的压缩不会再写入第二份 `.checkpoint.*.jsonl` 副本。

较旧的安装可能仍在 Agent 的 `sessions/`
目录下保留 `sessions.json` 文件。请将这些文件视为旧版会话行迁移输入或明确的
离线维护目标。Gateway 网关启动和 `openclaw doctor --fix` 会自动将
活跃的旧版行和对话记录历史导入每个 Agent 的 SQLite 存储。
当你需要明确的检查或验证证据时，请运行 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`，然后按照 [Doctor 迁移
顺序](/zh-CN/cli/doctor#session-sqlite-migration)操作。如果旧版对话记录
工件归档后迁移失败，请使用该顺序中的 Doctor 恢复模式。
恢复过程会使用迁移清单，仅还原受影响且已归档的支持
工件，在请求时准备经过净化的 GitHub issue 报告，并且不会
让活跃运行时重新读取 JSONL 文件。

除非相关界面需要任意历史访问，否则 Gateway 网关的历史记录读取器不会将整个对话记录具体化。首页历史记录、嵌入式聊天历史记录、重启恢复以及令牌/用量检查都使用从 SQLite 进行的有界尾部读取。完整对话记录扫描通过异步对话记录索引执行，并由并发读取器共享。

## 磁盘位置

在 Gateway 网关主机上，每个 Agent 的位置如下（通过 `src/config/sessions.ts` 解析）：

- 运行时会话行存储：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 运行时对话记录行：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 旧版/归档对话记录工件：`~/.openclaw/agents/<agentId>/sessions/`
- 旧版行迁移输入：`~/.openclaw/agents/<agentId>/sessions/sessions.json`

## 存储维护和磁盘控制

`session.maintenance` 控制 SQLite 会话行、SQLite 对话记录行、归档工件和轨迹附属文件的自动维护：

| 键                      | 默认值                  | 说明                                                                                              |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`             | 或 `"warn"`（仅报告，不修改）                                                                    |
| `pruneAfter`            | `"30d"`                 | 陈旧条目的时间阈值                                                                                |
| `maxEntries`            | `500`                   | 会话条目数量上限                                                                                  |
| `resetArchiveRetention` | 保留（无时间阈值）      | `*.reset.*`/`*.deleted.*` 对话记录归档的时间阈值；设置时长即启用删除                              |
| `maxDiskBytes`          | `2gb`                   | 每个 Agent 的会话磁盘预算；`false` 表示禁用                                                       |
| `highWaterBytes`        | `maxDiskBytes` 的 80%   | 预算清理后的目标值                                                                                |

归档的对话记录默认会保留，并在运行时支持时使用 zstd 压缩（`*.jsonl.<reason>.<timestamp>.zst`），因此删除或重置会话绝不会悄无声息地丢弃对话历史记录。在处理活跃会话之前，磁盘预算会先驱逐最旧的归档。

SQLite 对 `maxDiskBytes` 的主动强制执行会按会话统计会话行 JSON 和对话记录事件 JSON 的字节数；旧版离线维护强制执行则统计所选会话目录中的文件。

Gateway 网关模型运行探测会话（键匹配 `agent:*:explicit:model-run-<uuid>`）采用单独且固定的 `24h` 保留期。此清理受压力条件限制：仅在达到会话条目维护/上限压力时运行，并且只在全局陈旧条目清理/上限步骤之前运行。其他显式会话不使用此保留期。

磁盘预算清理的强制执行顺序（`mode: "enforce"`）：

1. 首先移除最旧的归档对话记录工件、孤立的旧版工件或孤立的轨迹工件。
2. 如果仍高于目标值，则驱逐最旧的会话条目及其对话记录行或轨迹工件。
3. 重复执行，直到用量不高于 `highWaterBytes`。

`mode: "warn"` 会报告可能发生的驱逐，但不会修改存储或文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

维护会保留持久的外部对话指针，例如群组会话和线程范围的聊天会话，但合成运行时条目（cron、Hooks、Heartbeat、ACP、子智能体）在超过配置的时间、数量或磁盘预算后仍可能被移除。隔离的 cron 运行使用单独的 `cron.sessionRetention` 控制项，与模型运行探测保留期无关。

Gateway 网关的正常写入会经过会话访问器，该访问器通过运行时写入器路径串行处理每个 Agent 的 SQLite 修改。运行时代码应优先使用 `src/config/sessions/session-accessor.ts` 中的访问器辅助函数；旧版 `sessions.json` 辅助函数是迁移和离线维护工具。当可以连接 Gateway 网关时，非试运行的 `openclaw sessions cleanup` 和 `openclaw agents delete` 会将存储修改委托给 Gateway 网关，使清理加入同一个写入器队列；`--store <path>` 是针对所选旧版存储的显式离线修复路径，并且始终在本地执行（`--dry-run` 也是如此）。对于生产规模的存储，`maxEntries` 清理会分批执行，因此在下一次高水位清理将其重写至上限以内之前，存储可能会短暂超过配置的上限。Gateway 网关启动期间，读取操作绝不会清理条目或对其应用数量上限——只有写入操作或 `openclaw sessions cleanup --enforce` 才会这样做；后者还会立即应用上限，并且即使未配置磁盘预算，也会清理未被引用的旧版对话记录、检查点和轨迹工件。

OpenClaw 在 Gateway 网关写入期间不再自动创建轮换的 `sessions.json.bak.*` 备份。旧版 `session.maintenance.rotateBytes` 键会被忽略，`openclaw doctor --fix` 会将其从旧配置中移除。

对话记录修改通过会话写入队列写入 SQLite 对话记录目标：

| 设置                                 | 默认值    | 环境变量覆盖                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` 表示锁等待在放弃之前经过多长时间会报告会话忙碌错误；仅当慢速计算机上合法的准备、清理、压缩或对话记录镜像工作竞争锁的时间更长时，才应提高该值。`staleMs` 表示现有锁经过多长时间后可被视为陈旧并回收。`maxHoldMs` 是进程内看门狗的释放阈值。

### 切换到 SQLite 后降级

在运行较旧的
文件后端 OpenClaw 版本之前，请还原已归档的旧版对话记录工件：

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

迁移会保留旧版 `sessions.json` 文件，以便提供支持和
回滚，但导入 SQLite 的活跃对话记录 JSONL 文件会被
重命名并移入 `session-sqlite-import-archive/`。较旧的文件后端运行时会遵循
`sessions.json` 中的 `sessionFile` 路径，因此需要在启动前还原这些工件。
还原过程使用迁移清单，仅移动其中记录且原始路径缺失的已归档
工件，并将 SQLite 数据库留在原处，以便后续恢复。

切换到 SQLite 后创建的会话仅存在于 SQLite 中，不会出现在
较旧的文件后端运行时中。如果你在降级后重新升级，请再次运行 Doctor
检查和验证顺序，以便 OpenClaw 能够在导入前验证已还原的旧版
工件。

## Cron 会话和运行日志

隔离的 cron 运行会创建自己的会话条目/对话记录，并使用专用的保留策略：

- `cron.sessionRetention`（默认值为 `"24h"`）会从存储中清理旧的隔离 cron 运行会话；`false` 表示禁用。
- `cron.runLog.keepLines` 会按 cron 作业清理保留的 SQLite 运行历史记录行（默认值为 `2000`）。仅为兼容较旧的文件后端运行日志而接受 `cron.runLog.maxBytes`。

当 cron 强制创建新的隔离运行会话时，它会在写入新行之前净化先前的 `cron:<jobId>` 会话条目：它会继承安全偏好设置（思考/快速/详细/推理设置、标签、显示名称）以及用户明确选择的模型/身份验证覆盖项，但会丢弃环境对话上下文（渠道/群组路由、发送/队列策略、权限提升、来源、ACP 运行时绑定），从而确保新的隔离运行无法从较旧的运行中继承陈旧的交付信息或运行时权限。

## 会话键（`sessionKey`）

`sessionKey` 标识你所在的对话存储桶（路由 + 隔离）。规范规则见：[/concepts/session](/zh-CN/concepts/session)。

| 模式                         | 示例                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| 主聊天/直接聊天（每个 Agent） | `agent:<agentId>:<mainKey>`（默认值为 `main`）              |
| 群组                         | `agent:<agentId>:<channel>:group:<id>`                      |
| 房间/渠道（Discord/Slack）   | `agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>`（除非被覆盖）                                 |

## 会话 ID（`sessionId`）

每个 `sessionKey` 都指向一个当前的 `sessionId`（用于继续对话的 SQLite 对话记录标识）。决策逻辑位于 `src/auto-reply/reply/session.ts` 的 `initSessionState()` 中。

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认在 Gateway 网关主机本地时间凌晨 4:00）会在越过重置边界后的下一条消息到达时创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes`，或旧版 `session.idleMinutes`）会在空闲时间窗口结束后有消息到达时创建新的 `sessionId`。如果同时配置了每日重置和空闲过期，则以先到期者为准。
- **Control UI 重连恢复**会在 Gateway 网关从操作员 UI 客户端收到匹配的 `sessionId` 时，为重连后发送的一条消息保留当前可见会话。这是一次性信号；普通的过期发送仍会创建新的 `sessionId`。
- **系统事件**（Heartbeat、cron 唤醒、Exec 通知、Gateway 网关内部记录）可能会修改会话行，但绝不会延长每日重置或空闲重置的新鲜度。发生重置切换时，会先丢弃上一会话中排队的系统事件通知，再构建全新的提示词。
- **父级分叉策略**在创建线程或子智能体分叉时使用 OpenClaw 的活动分支。如果该分支过大（超过固定的内部上限，目前为 100K 个 token），OpenClaw 会使用隔离上下文启动子项，而不是失败或继承无法使用的历史记录。大小评估是自动完成的，且不可配置；旧版 `session.parentForkMaxTokens` 配置会由 `openclaw doctor --fix` 移除。
- **操作员分叉**：`sessions.create { parentSessionKey, fork: true }` 会创建一个新会话，其对话记录从父会话的当前状态分支出来（使用与生成子智能体相同的分叉机制，包括上述大小上限）。父会话有活动运行时会拒绝分叉；除非显式传入模型选择，否则会继承父会话的模型选择；同时将子会话标记为 `forkedFromParent`，并使用全新的 token 计数器。

## 会话存储架构

运行时存储在各智能体的 SQLite 中保存 `SessionEntry` 值。其值类型是在 `src/config/sessions.ts` 中定义的 `SessionEntry`。关键字段（并非完整列表）：

- `sessionId`：用于寻址 SQLite 对话记录行的当前对话记录 ID
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置的新鲜度使用此字段。旧版行可能会从 JSONL 会话标头中推导此字段。
- `lastInteractionAt`：最后一次真实用户/渠道交互的时间戳；空闲重置的新鲜度使用此字段，因此 Heartbeat、cron 和 Exec 事件不会让会话持续保持活动状态。缺少此字段的旧版行会回退到恢复得到的会话开始时间。
- `updatedAt`：最后一次修改存储行的时间戳，用于列表展示、清理和内部记录，而不是每日重置或空闲重置新鲜度的权威依据。
- `archivedAt`：可选的归档时间戳。已归档会话会保留在存储中，其对话记录保持完整，但不会出现在普通的活动会话列表中。
- `pinnedAt`：可选的置顶时间戳。活动的置顶会话排序在未置顶会话之前；归档会话会清除其置顶状态。
- Codex 线程互操作：这两个字段都遵循 Codex 的线程管理结构——传输中的 `archived`/`pinned` 布尔值始终从时间戳派生，并由服务端写入，与 Codex 的 `threads.archived_at` 语义和 camelCase 序列化保持一致。OpenClaw 时间戳使用纪元毫秒，而 Codex 使用纪元秒，因此桥接层会在 `codex` 插件边界进行转换。Codex 尚无置顶 API（仅有 `thread/archive`/`thread/unarchive`）；在该 API 出现之前，置顶状态保留在 OpenClaw 侧。届时，匹配的数据结构将使已绑定会话能够以机械方式往返同步置顶状态。
- Codex 监管仅列出未归档的原生线程。对于 Gateway 网关本地活动状态未知、状态为 `idle` 或 `notLoaded` 的线程，只有操作员明确确认没有其他 Codex 进程拥有该线程后，才能通过原生 `thread/archive` 将其归档；插件会先重新读取进程本地状态，随后该线程会从目录中消失。该读取无法证明另一个 App Server 进程未在使用此线程。OpenClaw 拒绝归档活动行和错误行；在节点桥接能够负责完整的流式线程生命周期之前，配对节点无法归档。在原生 Codex 客户端中取消归档后，该线程将能够再次出现。
- `lastReadAt` / `markedUnreadAt`：由 `sessions.patch { unread }` 在服务端写入的已读状态时间戳——`unread: false` 会记录一次已读操作（设置 `lastReadAt` 并清除 `markedUnreadAt`）；`unread: true` 会将会话标记为未读，直到下一次已读操作。会话行会公开一个派生的 `unread` 布尔值：显式标记为未读，或者读取时间早于最新活动时间。未曾标记为已读的会话保持 `unread: false`，因此现有安装升级后不会全部亮起未读提示。
- `lastActivityAt`：最后一次已完成、且应计为未读活动的智能体运行时间戳（用户、渠道和 cron 运行）。Heartbeat 和内部事件轮次以及元数据补丁不会更新此字段；`updatedAt` 不是活动信号。
- `sessionFile`：为迁移/归档兼容性保留的旧版标记；活动运行时使用 SQLite 标识
- `chatType`：`direct | group | room`
- `provider`、`subject`、`room`、`space`、`displayName`：群组/渠道标签元数据
- 开关：`thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`、`sendPolicy`（按会话覆盖）
- 模型选择：`providerOverride`、`modelOverride`、`authProfileOverride`
- token 计数器（尽力而为/取决于提供商）：`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此会话键完成自动压缩的次数
- `memoryFlushAt` / `memoryFlushCompactionCount`：上一次压缩前记忆刷新的时间戳和压缩次数

Gateway 网关是权威来源：会话运行时，它可能会重写或重新加载条目。对于旧版基于文件的安装，请使用
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` 进行迁移，而不要
编辑 `sessions.json` 并期望运行时继续读取该文件。

## 对话记录事件结构

对话记录由 OpenClaw 会话访问器管理，并通过基于标识的辅助函数提供给运行时代码。事件流只能追加：

- 第一条记录：会话标头——`type: "session"`、`id`、`cwd`、`timestamp`，以及可选的 `parentSession`。
- 后续记录：包含 `id` + `parentId`（树形结构）的条目。

重要的条目类型：

- `message`：用户/助手/toolResult 消息
- `custom_message`：由扩展注入且_会_进入模型上下文的消息（当 `display: true` 时在 TUI 中呈现；当 `display: false` 时完全隐藏）
- `custom`：_不会_进入模型上下文的扩展状态（用于在重新加载后持久保留扩展状态）
- `compaction`：持久化的压缩摘要，包含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：浏览树分支时持久化的摘要

OpenClaw 有意不对对话记录进行“修正”；Gateway 网关使用 `SessionManager` 读写这些记录。

## 上下文窗口与跟踪的 token

这是两个不同的概念：

1. **模型上下文窗口**：每个模型的硬性上限（模型可见的 token）。该值来自模型目录，并可通过配置覆盖。
2. **会话存储计数器**：写入会话行的滚动统计信息（用于 `/status` 和仪表板）。`contextTokens` 是运行时估算值/报告值——不要将其视为严格保证。

关于限制的更多信息：[/reference/token-use](/zh-CN/reference/token-use)。

## 压缩：什么是压缩

压缩会将较早的对话汇总为转录记录中持久化的 `compaction` 条目，并完整保留近期消息。压缩后，后续轮次会看到压缩摘要以及 `firstKeptEntryId` 之后的消息。与会话修剪不同，压缩是**持久的**——请参阅 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

压缩后重新注入 AGENTS.md 章节需通过 `agents.defaults.compaction.postCompactionSections` 显式启用；未设置或设为 `[]` 时，OpenClaw 不会在压缩摘要之后追加 AGENTS.md 摘录。

### 分块边界和工具配对

将较长的转录记录拆分为压缩块时，OpenClaw 会确保助手工具调用与其对应的 `toolResult` 条目保持配对：

- 如果按 token 占比划分的位置会落在工具调用与其结果之间，OpenClaw 会将边界移到助手的工具调用消息处，而不会拆开这一对条目。
- 如果末尾的工具结果块会导致分块超出目标大小，OpenClaw 会保留该待处理工具块，并完整保留尚未汇总的尾部内容。
- 已中止或出错的工具调用块不会使待处理的拆分持续处于打开状态。

## 自动压缩何时发生

嵌入式 OpenClaw 智能体中有两个触发条件：

1. **溢出恢复**：模型返回上下文溢出错误（`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded` 以及其他提供商特有的变体）——先压缩，然后重试。当提供商报告此次尝试的 token 数时，OpenClaw 会将观测到的数量传入溢出恢复压缩流程；如果提供商确认发生溢出，但未提供可解析的数量，OpenClaw 会向压缩引擎和诊断功能传入一个略微超出预算的最小合成数量。如果溢出恢复仍然失败，OpenClaw 会显示明确的操作指引，并保留当前会话映射，而不是悄无声息地切换到新的会话 ID——请重试该消息、运行 `/compact` 或运行 `/new`。
2. **阈值维护**：成功完成一个轮次后，当 `contextTokens > contextWindow - reserveTokens` 时触发，其中 `contextWindow` 是模型的上下文窗口，`reserveTokens` 是为提示词和下一次模型输出预留的余量。

除这两个触发条件外，还会运行两个额外的保护机制：

- **预检本地压缩**：设置 `agents.defaults.compaction.maxActiveTranscriptBytes`（字节数或类似 `"20mb"` 的字符串），即可在活跃转录记录达到该大小后、打开下一次运行之前触发本地压缩。这是用于控制本地重新打开成本的大小保护机制，而不是直接归档——正常的语义压缩仍会运行，并且它要求启用 `truncateAfterCompaction`，以便将压缩摘要作为新的后继转录记录。
- **轮次中途预检**：设置 `agents.defaults.compaction.midTurnPrecheck.enabled: true`（默认为 `false`），以添加工具循环保护机制。在追加工具结果后、下一次调用模型之前，OpenClaw 会使用与轮次开始时相同的预检预算逻辑估算提示词压力。如果上下文已无法容纳，该保护机制不会就地执行压缩——它会发出结构化的轮次中途预检信号，停止提交当前提示词，并让外层运行循环使用现有恢复路径（如果截断过大的工具结果即可解决问题，则执行截断；否则触发已配置的压缩模式并重试）。它同时支持 `default` 和 `safeguard` 压缩模式，包括由提供商支持的 safeguard 压缩。此机制独立于 `maxActiveTranscriptBytes`：字节大小保护机制在轮次打开前运行，而轮次中途预检稍后运行，即在追加新的工具结果之后运行。

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

OpenClaw 还会为嵌入式运行强制设置一个安全下限：如果 `compaction.reserveTokens` 低于 `reserveTokensFloor`（默认值为 `20000`），OpenClaw 会将其提高到该下限。设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用此下限。当已知当前模型的上下文窗口时，下限和最终生效的预留量都会受到上限限制，以防预留量占用全部提示词预算。这可避免小上下文模型（例如 16K token 的本地模型）从第一个 token 开始就进入压缩；如果上下文窗口未知，配置的预留预算和当前预留预算均不设上限。为什么需要设置下限：在压缩不可避免之前，为多轮“内部维护”（如下文的记忆刷新）留出足够余量。实现：`src/agents/agent-settings.ts` 中的 `applyAgentCompactionSettingsFromConfig()`，由嵌入式运行器的轮次和压缩设置路径调用。

手动 `/compact` 会遵循显式设置的 `agents.defaults.compaction.keepRecentTokens`，并保留运行时的近期尾部截断点。如果未显式设置保留预算，手动压缩将作为硬检查点，重建的上下文会从新摘要开始。

启用 `truncateAfterCompaction` 后，OpenClaw 会在压缩后将当前记录轮换为压缩后的后继记录。分支/恢复检查点操作会使用该压缩后的后继记录；旧版压缩前检查点文件在被引用期间仍可读取。

## 可插拔压缩提供商

插件通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 设置为已注册的提供商 ID 时，安全保障扩展会将摘要生成委托给该提供商，而不是使用内置的 `summarizeInStages` 流水线。

- `provider`：已注册的压缩提供商插件 ID。保持未设置则使用默认的 LLM 摘要生成。设置 `provider` 会强制使用 `mode: "safeguard"`。
- 提供商接收与内置路径相同的压缩指令和标识符保留策略，并且安全保障机制仍会在提供商输出后保留近期轮次和拆分轮次的后缀上下文。
- 内置安全保障摘要会将之前的摘要与新消息一起重新提炼，而不是逐字保留完整的先前摘要。
- 安全保障模式默认启用摘要质量审核；设置 `qualityGuard.enabled: false` 可跳过输出格式错误时的重试行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要生成。调用方显式触发的中止/超时信号会被重新抛出，而不会被吞掉，因此取消操作始终会得到遵循。

来源：`src/plugins/compaction-provider.ts`、`src/agents/agent-hooks/compaction-safeguard.ts`。

## 用户可见界面

- 任意聊天会话中的 `/status`
- `openclaw status`（CLI）
- `openclaw sessions` / `openclaw sessions --json`
- Gateway 网关日志（`pnpm gateway:watch` 或 `openclaw logs --follow`）：`embedded run auto-compaction start` + `complete`
- 详细模式：`🧹 Auto-compaction complete`，外加压缩次数

## 静默内部维护（`NO_REPLY`）

OpenClaw 支持为不应向用户显示中间输出的后台任务执行“静默”轮次。

- 助手以精确的静默令牌 `NO_REPLY` / `no_reply` 开始输出，表示“不要向用户发送回复”。OpenClaw 会在交付层将其剥离或抑制。
- 精确静默令牌的抑制不区分大小写：当整个有效载荷仅包含静默令牌时，`NO_REPLY` 和 `no_reply` 都有效。
- 自 `2026.1.10` 起，如果部分数据块以 `NO_REPLY` 开头，OpenClaw 还会抑制草稿/输入状态的流式传输，因此静默操作不会在轮次进行期间泄露部分输出。
- 此功能仅用于真正的后台/不交付轮次，不能作为处理普通可操作用户请求的捷径。

## 压缩前记忆刷新

在自动压缩发生之前，OpenClaw 可以运行一个静默的智能体轮次，将持久状态写入磁盘（例如 Agent 工作区中的 `memory/YYYY-MM-DD.md`），以免压缩清除关键上下文。它会监控会话上下文用量；一旦用量超过低于压缩阈值的软阈值，就会使用精确的静默令牌 `NO_REPLY` / `no_reply` 发送一条静默的“立即写入记忆”指令，使用户不会看到任何内容。

配置（`agents.defaults.compaction.memoryFlush`），完整参考见 [/gateway/config-agents](/zh-CN/gateway/config-agents#agentsdefaultscompaction)：

| 键                          | 默认值           | 说明                                                                                                                                   |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 未设置           | 仅用于刷新轮次的精确提供商/模型覆盖，例如 `ollama/qwen3:8b`                                                                            |
| `softThresholdTokens`       | `4000`           | 触发刷新的阈值与压缩阈值之间的差值                                                                                                     |
| `forceFlushTranscriptBytes` | 未设置（已禁用） | 当转录文件达到此字节大小（或 `"2mb"` 之类的字符串）时强制刷新，即使令牌计数器已过时；`0` 表示禁用                                        |
| `prompt`                    | 内置             | 刷新轮次的用户消息                                                                                                                     |
| `systemPrompt`              | 内置             | 为刷新轮次追加的额外系统提示词                                                                                                         |

注意：

- 默认提示词/系统提示词包含用于抑制交付的 `NO_REPLY` 提示。
- 设置 `model` 后，刷新轮次会使用该模型，而不继承活跃会话的回退链，因此仅限本地的维护操作失败时不会静默回退到付费对话模型。
- 每个压缩周期仅运行一次刷新（在会话行中跟踪）。
- 刷新仅针对嵌入式 OpenClaw 会话运行；CLI 后端和 Heartbeat 轮次会跳过它。
- 当会话工作区为只读时（`workspaceAccess: "ro"` 或 `"none"`），会跳过刷新。
- 有关工作区文件布局和写入模式，请参阅[记忆概览](/zh-CN/concepts/memory)。

OpenClaw 在扩展 API 中公开了 `session_before_compact` 钩子，但上述刷新逻辑位于 Gateway 网关侧（`src/auto-reply/reply/memory-flush.ts`、`src/auto-reply/reply/agent-runner-memory.ts`），而不在该钩子上。

## 故障排查清单

- **会话键错误？** 从 [/concepts/session](/zh-CN/concepts/session) 开始，并确认 `/status` 中的 `sessionKey`。
- **存储与转录不匹配？** 确认 Gateway 网关主机以及 `openclaw status` 显示的存储路径。
- **频繁压缩？** 检查模型的上下文窗口（太小会迫使频繁压缩）、`reserveTokens`（相对于模型窗口过高会导致更早压缩）以及工具结果膨胀（调整会话裁剪）。
- **小型本地模型上的每个提示词似乎都会溢出？** 确认提供商报告了正确的模型上下文窗口。仅当该窗口已知时，OpenClaw 才能限制有效预留量。
- **静默轮次发生泄露？** 确认回复以精确的静默令牌 `NO_REPLY`（不区分大小写）开头，并且你使用的构建版本包含流式传输抑制修复（`2026.1.10`+）。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话裁剪](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
- [Agent 配置参考](/zh-CN/gateway/config-agents)
