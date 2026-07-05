---
read_when:
    - 你需要智能体循环或生命周期事件的精确演练
    - 你正在更改会话排队、转录写入或会话写锁行为
summary: Agent loop 生命周期、流和等待语义
title: Agent loop
x-i18n:
    generated_at: "2026-07-05T11:10:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0c8c8c31ae3f821b4186f6353e2e844e12e188f142fdf4ee3cd217050c315c
    source_path: concepts/agent-loop.md
    workflow: 16
---

Agent loop 是按会话串行化的运行流程，会将一条消息转换为
操作和回复：接收、上下文组装、模型推理、工具
执行、流式传输、持久化。

## 入口点

- Gateway RPC：`agent` 和 `agent.wait`。
- CLI：`openclaw agent`。

## 运行序列

1. `agent` RPC 验证参数，解析会话（`sessionKey`/`sessionId`），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行本轮次：解析模型 + thinking/verbose/trace 默认值，加载 Skills 快照，调用 `runEmbeddedAgent`，并在嵌入式循环尚未发出 **生命周期结束/错误** 时发出一个兜底的 **生命周期结束/错误**。
3. `runEmbeddedAgent`：通过按会话和全局队列串行化运行，解析模型 + 凭证配置文件，构建 OpenClaw 会话，订阅运行时事件，流式传输助手/工具增量，强制执行运行超时（到期时中止），并返回 payload 和用量元数据。对于 Codex app-server 轮次，它还会中止一个已接受但在终端事件前停止产生 app-server 进度的轮次。
4. `subscribeEmbeddedAgentSession` 将运行时事件桥接到 `agent` 流：工具事件到 `stream: "tool"`，助手增量到 `stream: "assistant"`，生命周期事件到 `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）。
5. `agent.wait`（`waitForAgentRun`）等待某个 `runId` 上的 **生命周期结束/错误**，并返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`。

## 队列与并发

运行会按会话键（会话通道）串行化，并可选地通过全局通道串行化，以防止工具/会话竞争。消息渠道会选择队列模式（steer/followup/collect/interrupt），并馈入此通道系统；请参阅 [Command Queue](/zh-CN/concepts/queue)。

转录写入还会受到会话文件上的会话写锁保护。该锁具备进程感知能力且基于文件，因此能捕获绕过进程内队列或来自其他进程的写入者。写入者最多等待 `session.writeLock.acquireTimeoutMs`（默认 `60000` 毫秒；环境变量覆盖 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`），之后报告会话繁忙。

默认情况下，会话写锁不可重入。某个 helper 如果有意在保留同一个逻辑写入者的同时嵌套获取同一把锁，必须通过 `allowReentrant: true` 选择启用。

## 会话和工作区准备

- 工作区会被解析并创建；沙箱隔离的运行可能会重定向到沙箱工作区根目录。
- Skills 会被加载（或从快照复用）并注入到环境和提示词中。
- Bootstrap/上下文文件会被解析并注入到系统提示词中。
- 在流式传输开始前，会获取会话写锁，并打开和准备 `SessionManager`。任何后续的转录重写、压缩或截断路径，都必须在打开或变更转录文件前获取同一把锁。

## 提示词组装

系统提示词由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文和按运行配置的覆盖项构建。会强制执行模型特定限制和压缩预留 token。请参阅 [System prompt](/zh-CN/concepts/system-prompt) 了解模型会看到的内容。

## Hooks

OpenClaw 有两个 hook 系统：

- **内部钩子**（Gateway 钩子）：面向命令和生命周期事件的事件驱动脚本。
- **插件钩子**：Agent loop 和 Gateway 网关流水线内的扩展点。

### 内部钩子（Gateway 钩子）

- **`agent:bootstrap`**：在系统提示词最终确定前构建 bootstrap 文件时运行。使用它添加或移除 bootstrap 上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 和其他命令事件（请参阅 Hooks 文档）。

请参阅 [Hooks](/zh-CN/automation/hooks) 获取设置和示例。

### 插件钩子

这些钩子在 Agent loop 或 Gateway 网关流水线内运行：

| 钩子                                                    | 运行时机                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | 会话前（无 `messages`），用于在解析前确定性地覆盖提供商/模型。                                                                                                                                                                                                |
| `before_prompt_build`                                   | 会话加载后（带 `messages`），用于在提交前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。将 `prependContext` 用于按轮次动态文本，将 system-context 字段用于属于系统提示词空间的稳定指导。 |
| `before_agent_start`                                    | 旧版兼容钩子，可能在任一阶段运行；优先使用上面的显式钩子。                                                                                                                                                                                                    |
| `before_agent_reply`                                    | 在线操作之后、LLM 调用之前运行。允许插件接管该轮次并返回合成回复，或将其完全静默。                                                                                                                                                                |
| `agent_end`                                             | 完成后运行，带有最终消息列表和运行元数据。                                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | 观察或注释压缩周期。                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | 拦截工具参数/结果。                                                                                                                                                                                                                                                              |
| `before_install`                                        | 在操作员安装策略运行后，作用于暂存的 skill/plugin 安装材料；仅当插件钩子已加载到当前进程中时运行。                                                                                                                                                           |
| `tool_result_persist`                                   | 在工具结果写入 OpenClaw 拥有的会话转录之前，同步转换工具结果。                                                                                                                                                                                      |
| `message_received` / `message_sending` / `message_sent` | 入站和出站消息钩子。                                                                                                                                                                                                                                                         |
| `session_start` / `session_end`                         | 会话生命周期边界。                                                                                                                                                                                                                                                               |
| `gateway_start` / `gateway_stop`                        | Gateway 网关生命周期事件。                                                                                                                                                                                                                                                                   |

出站/工具防护的钩子决策规则：

- `before_tool_call`：`{ block: true }` 是终止性结果，并会停止更低优先级的处理程序。`{ block: false }` 是无操作，不会清除先前的阻止。
- `before_install`：与上面相同的终止性/无操作语义。对于必须覆盖 CLI 安装和更新路径、由操作员拥有的安装允许/阻止决策，请使用 `security.installPolicy`，而不是 `before_install`。
- `message_sending`：`{ cancel: true }` 是终止性结果，并会停止更低优先级的处理程序。`{ cancel: false }` 是无操作，不会清除先前的取消。

请参阅 [插件钩子](/zh-CN/plugins/hooks) 获取钩子 API 和注册详情。

Harness 可以适配这些钩子。Codex app-server harness 将 OpenClaw 插件钩子保留为已文档化镜像表面的兼容性契约；Codex 原生钩子是一个单独的、更低层的 Codex 机制。

## 流式传输

- 助手增量会作为 `assistant` 事件从 agent runtime 流式传输。
- 分块流式传输可以在 `text_end` 或 `message_end` 上发出部分回复。
- 推理流式传输可以是单独的流，也可以分块回复。
- 请参阅 [Streaming](/zh-CN/concepts/streaming) 了解分块和分块回复行为。

## 工具执行

- 工具开始/更新/结束事件会在 `tool` 流上发出。
- 工具结果在记录日志/发出前会按大小和图片 payload 进行清理。
- 消息工具发送会被跟踪，以抑制重复的助手确认。

## 回复整形

最终 payload 会由助手文本（加上可选推理）、内联工具摘要（在 verbose 且允许时）以及模型出错时的助手错误文本组装而成。

- 精确静默 token `NO_REPLY` 会从出站 payload 中过滤掉。
- 消息工具重复项会从最终 payload 列表中移除。
- 如果没有剩余可渲染 payload 且某个工具出错，则会发出兜底工具错误回复，除非某个消息工具已经发送了用户可见回复。

## 压缩和重试

自动压缩会发出 `compaction` 流事件，并可触发重试。重试时，内存缓冲区和工具摘要会重置，以避免重复输出。请参阅 [压缩](/zh-CN/concepts/compaction)。

## 事件流

- `lifecycle`：由 `subscribeEmbeddedAgentSession` 发出（并由 `agentCommand` 作为兜底发出）。
- `assistant`：来自 agent runtime 的流式增量。
- `tool`：来自 agent runtime 的流式工具事件。

## 聊天渠道处理

助手增量会缓冲为聊天 `delta` 消息。聊天 `final` 会在 **生命周期结束/错误** 时发出。

## 超时

| 超时                                             | 默认值                                                      | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                                         | 仅等待；`timeoutMs` 参数会覆盖。不会停止底层运行。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Agent 运行时（`agents.defaults.timeoutSeconds`） | 172800s（48h）                                              | 由 `runEmbeddedAgent` 的中止计时器强制执行。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Cron 隔离的智能体轮次                           | 由 cron 拥有                                               | 调度器在执行开始时启动自己的计时器，在配置的截止时间中止运行，然后在记录超时前执行有界清理，避免陈旧的子会话让通道一直卡住。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 模型空闲超时                                    | `agents.defaults.timeoutSeconds`，默认上限为 120s           | 当空闲窗口内没有响应分块到达时，OpenClaw 会中止模型请求。`models.providers.<id>.timeoutSeconds` 会为较慢的本地/自托管提供商延长此空闲看门狗，但仍受任何更低的 `agents.defaults.timeoutSeconds` 或特定运行超时限制，因为这些超时控制整个智能体运行。没有显式模型/智能体超时的 Cron 触发云模型运行使用相同默认值；如果有显式 cron 运行超时，云模型流停滞上限为 60s，以便配置的模型 fallback 仍能在外层 cron 截止时间前运行。Cron 触发的本地/自托管模型运行会禁用隐式看门狗，除非配置了显式超时；请为较慢的本地提供商设置 `models.providers.<id>.timeoutSeconds`。 |
| 提供商 HTTP 请求超时                            | `models.providers.<id>.timeoutSeconds`                      | 覆盖连接、headers、body、SDK 请求超时、guarded-fetch 中止处理，以及该提供商的模型流空闲看门狗。对于较慢的本地/自托管提供商（例如 Ollama），请先使用它，再提高整个智能体运行时超时；当模型请求需要运行更长时间时，请保持智能体/运行时超时至少同样高。                                                                                                                                                                                                                                                                                                                                                                                                                       |

### 卡住会话诊断

启用诊断后，`diagnostics.stuckSessionWarnMs`（默认 `120000` ms）会将长时间处于 `processing` 且没有观察到回复、工具、状态、块或 ACP 进度的会话分类：

- 活跃的嵌入式运行、模型调用和工具调用报告为 `session.long_running`。有拥有者的静默模型调用会保持 `session.long_running`，直到 `diagnostics.stuckSessionAbortMs`，这样较慢或非流式传输的提供商不会过早被标记为停滞。
- 没有近期进度的活跃工作报告为 `session.stalled`。有拥有者的模型调用会在达到或超过中止阈值时切换为 `session.stalled`；没有拥有者的陈旧模型/工具活动不会被隐藏为长时间运行。
- `session.stuck` 保留用于可恢复的陈旧会话记账，包括带有陈旧无拥有者模型/工具活动的空闲排队会话。

`diagnostics.stuckSessionAbortMs` 默认至少为 5 分钟，且为警告阈值的 3 倍。陈旧会话记账会在恢复门控通过后立即释放受影响的会话通道；停滞的嵌入式运行只会在达到中止阈值后进行中止清空，因此排队工作会恢复，而不会切断只是较慢的运行。恢复会发出结构化的 requested/completed 结果；只有同一个 processing 生成仍为当前生成时，诊断状态才会标记为空闲，并且当会话保持不变时，重复的 `session.stuck` 诊断会退避。

## 哪些情况会提前结束

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关

- [工具](/zh-CN/tools) - 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) - 由智能体生命周期事件触发的事件驱动脚本
- [压缩](/zh-CN/concepts/compaction) - 长对话如何被总结
- [Exec 审批](/zh-CN/tools/exec-approvals) - shell 命令的审批门控
- [思考](/zh-CN/tools/thinking) - 思考/推理级别配置
