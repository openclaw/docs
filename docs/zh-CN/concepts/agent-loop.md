---
read_when:
    - 你需要 Agent loop 或生命周期事件的准确演练
    - 你正在更改会话队列、转录写入或会话写入锁行为
summary: Agent loop 生命周期、流和等待语义
title: Agent loop
x-i18n:
    generated_at: "2026-07-06T21:47:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd171ab1f8defa4c3e65305786fb247bb37379471876f29da52a46ade9fa2699
    source_path: concepts/agent-loop.md
    workflow: 16
---

智能体循环是按会话序列化的运行过程，用于将一条消息转换为
操作和回复：接收、上下文组装、模型推理、工具
执行、流式传输、持久化。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`openclaw agent`。

## 运行序列

1. `agent` RPC 校验参数，解析会话（`sessionKey`/`sessionId`），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行该轮次：解析模型 + thinking/verbose/trace 默认值，加载 Skills 快照，调用 `runEmbeddedAgent`，并在嵌入式循环尚未发出 **生命周期结束/错误** 时发出一个回退的 **生命周期结束/错误**。
3. `runEmbeddedAgent`：通过按会话和全局队列序列化运行，解析模型 + 凭证配置文件，构建 OpenClaw 会话，订阅运行时事件，流式传输助手/工具增量，强制执行运行超时（到期时中止），并返回载荷以及用量元数据。对于 Codex app-server 轮次，它还会中止已接受但在终端事件之前停止产生 app-server 进度的轮次。
4. `subscribeEmbeddedAgentSession` 将运行时事件桥接到 `agent` 流：工具事件到 `stream: "tool"`，助手增量到 `stream: "assistant"`，生命周期事件到 `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）。
5. `agent.wait`（`waitForAgentRun`）等待某个 `runId` 上的 **生命周期结束/错误**，并返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`。

## 排队和并发

运行按会话键（会话通道）序列化，并可选地通过全局通道，防止工具/会话竞争。消息渠道会选择一种队列模式（steer/followup/collect/interrupt），并将其送入这一通道系统；参见 [Command Queue](/zh-CN/concepts/queue)。

转录写入还会受到会话文件上的会话写锁保护。该锁感知进程且基于文件，因此可以捕获绕过进程内队列或来自另一个进程的写入者。写入者最多等待 `session.writeLock.acquireTimeoutMs`（默认 `60000` 毫秒；环境变量覆盖 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`），然后报告会话忙碌。

会话写锁默认不可重入。若某个辅助函数有意嵌套获取同一把锁，同时保留一个逻辑写入者，则必须使用 `allowReentrant: true` 显式启用。

## 会话和工作区准备

- 解析并创建工作区；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- 加载 Skills（或从快照复用）并注入到环境变量和提示词中。
- 解析 bootstrap/上下文文件并注入到系统提示词中。
- 在流式传输开始前，获取会话写锁并打开和准备 `SessionManager`。任何后续转录重写、压缩或截断路径，都必须在打开或变更转录文件之前获取同一把锁。

## 提示词组装

系统提示词由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文和按运行覆盖项构建。会强制执行特定模型的限制和压缩预留 token。参见 [系统提示词](/zh-CN/concepts/system-prompt) 了解模型会看到什么。

## Hooks

OpenClaw 有两套钩子系统：

- **内部钩子**（Gateway 网关钩子）：用于命令和生命周期事件的事件驱动脚本。
- **插件钩子**：智能体/工具生命周期和 Gateway 网关流水线中的扩展点。

### 内部钩子（Gateway 网关钩子）

- **`agent:bootstrap`**：在系统提示词最终确定之前构建 bootstrap 文件时运行。可用于添加或移除 bootstrap 上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 和其他命令事件（参见 Hooks 文档）。

参见 [Hooks](/zh-CN/automation/hooks) 获取设置方式和示例。

### 插件钩子

这些钩子在智能体循环或 Gateway 网关流水线中运行：

| 钩子                                                    | 运行时机                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | 会话前（无 `messages`），用于在解析前确定性地覆盖提供商/模型。                                                                                                                                                                                                |
| `before_prompt_build`                                   | 会话加载后（带 `messages`），用于在提交前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。将 `prependContext` 用于按轮次动态文本，将系统上下文字段用于属于系统提示词空间的稳定指导。 |
| `before_agent_start`                                    | 旧版兼容钩子，可能在任一阶段运行；优先使用上面的显式钩子。                                                                                                                                                                                                    |
| `before_agent_reply`                                    | 在线操作之后、LLM 调用之前。允许插件接管该轮次并返回合成回复，或完全静默。                                                                                                                                                                |
| `agent_end`                                             | 完成后运行，携带最终消息列表和运行元数据。                                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | 观察或标注压缩周期。                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | 拦截工具参数/结果。                                                                                                                                                                                                                                                              |
| `before_install`                                        | 操作员安装策略运行后，在暂存的 Skills/插件安装材料上运行，前提是当前进程中已加载插件钩子。                                                                                                                                                           |
| `tool_result_persist`                                   | 在工具结果写入 OpenClaw 拥有的会话转录之前同步转换这些结果。                                                                                                                                                                                      |
| `message_received` / `message_sending` / `message_sent` | 入站和出站消息钩子。                                                                                                                                                                                                                                                         |
| `session_start` / `session_end`                         | 会话生命周期边界。                                                                                                                                                                                                                                                               |
| `gateway_start` / `gateway_stop`                        | Gateway 网关生命周期事件。                                                                                                                                                                                                                                                                   |

出站/工具防护的钩子决策规则：

- `before_tool_call`：`{ block: true }` 是终端决策，会停止更低优先级的处理器。`{ block: false }` 是无操作，不会清除先前的阻止。
- `before_install`：与上面相同的终端/无操作语义。对于必须覆盖 CLI 安装和更新路径的操作员拥有的安装允许/阻止决策，请使用 `security.installPolicy`，而不是 `before_install`。
- `message_sending`：`{ cancel: true }` 是终端决策，会停止更低优先级的处理器。`{ cancel: false }` 是无操作，不会清除先前的取消。

参见 [插件钩子](/zh-CN/plugins/hooks) 获取钩子 API 和注册详情。

harness 可以适配这些钩子。Codex app-server harness 将 OpenClaw 插件钩子作为已文档化镜像表面的兼容性契约；Codex 原生钩子是另一套更低层级的 Codex 机制。

## 流式传输

- 助手增量从智能体运行时作为 `assistant` 事件流式传输。
- 分块流式传输可以在 `text_end` 或 `message_end` 发出部分回复。
- 推理流式传输可以是单独的流，也可以阻塞回复。
- 参见 [流式传输](/zh-CN/concepts/streaming) 了解分块和块回复行为。

## 工具执行

- 工具开始/更新/结束事件会在 `tool` 流上发出。
- 工具结果在记录/发出之前，会针对大小和图片载荷进行清理。
- 消息工具发送会被跟踪，以抑制重复的助手确认。

## 回复成形

最终载荷由助手文本（加上可选推理）、内联工具摘要（在 verbose 且允许时）以及模型出错时的助手错误文本组装而成。

- 精确的静默 token `NO_REPLY` 会从出站载荷中过滤掉。
- 消息工具重复项会从最终载荷列表中移除。
- 如果没有剩余可渲染载荷且某个工具出错，除非消息工具已经发送了用户可见回复，否则会发出回退工具错误回复。

## 压缩和重试

自动压缩会发出 `compaction` 流事件，并可能触发重试。重试时，内存缓冲区和工具摘要会重置，以避免重复输出。参见 [压缩](/zh-CN/concepts/compaction)。

## 事件流

- `lifecycle`：由 `subscribeEmbeddedAgentSession` 发出（并由 `agentCommand` 作为回退发出）。
- `assistant`：来自智能体运行时的流式增量。
- `tool`：来自智能体运行时的流式工具事件。

Gateway 网关会将生命周期和工具开始/终端事件投影到有界、
仅包含元数据的 [审计账本](/cli/audit)。此投影会记录来源和
结果代码，而不会将提示词、消息、工具参数、工具结果
或原始错误从转录/运行时路径复制出去。

## 聊天渠道处理

助手增量会缓冲为聊天 `delta` 消息。聊天 `final` 会在 **生命周期结束/错误** 时发出。

## 超时

| 超时                                             | 默认值                                                      | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                                         | 仅等待；`timeoutMs` 参数会覆盖。不会停止底层运行。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Agent runtime (`agents.defaults.timeoutSeconds`) | 172800s（48h）                                              | 由 `runEmbeddedAgent` 的中止计时器强制执行。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Cron 隔离的 Agent 轮次                           | 由 cron 拥有                                                | 调度器在执行开始时启动自己的计时器，在配置的截止时间中止运行，然后在记录超时前运行有界清理，避免陈旧的子会话让通道一直卡住。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 模型空闲超时                                     | `agents.defaults.timeoutSeconds`，默认上限为 120s           | 当空闲窗口内没有响应块到达时，OpenClaw 会中止模型请求。`models.providers.<id>.timeoutSeconds` 会为较慢的本地/自托管提供商扩展此空闲看门狗，但仍受任何更低的 `agents.defaults.timeoutSeconds` 或特定运行超时约束，因为它们控制整个智能体运行。没有显式模型/智能体超时的 cron 触发云模型运行使用相同默认值；如果有显式 cron 运行超时，云模型流停滞的上限为 60s，以便配置的模型回退仍可在外层 cron 截止时间前运行。cron 触发的本地/自托管模型运行会禁用隐式看门狗，除非配置了显式超时；请为较慢的本地提供商设置 `models.providers.<id>.timeoutSeconds`。 |
| 提供商 HTTP 请求超时                             | `models.providers.<id>.timeoutSeconds`                      | 覆盖连接、标头、正文、SDK 请求超时、受保护的 fetch 中止处理，以及该提供商的模型流空闲看门狗。对于较慢的本地/自托管提供商（例如 Ollama），请先使用它，再提高整个 Agent runtime 超时；当模型请求需要运行更久时，请保持智能体/运行时超时至少同样高。                                                                                                                                                                                                                                                                                                                                                                                                                       |

### 卡住会话诊断

启用诊断后，`diagnostics.stuckSessionWarnMs`（默认 `120000` ms）会将长时间处于 `processing` 且未观察到回复、工具、状态、分块或 ACP 进度的会话分类：

- 活跃的嵌入式运行、模型调用和工具调用会报告为 `session.long_running`。有归属的静默模型调用会保持为 `session.long_running`，直到达到 `diagnostics.stuckSessionAbortMs`，这样较慢或非流式提供商不会过早被标记为停滞。
- 没有近期进度的活跃工作会报告为 `session.stalled`。有归属的模型调用会在达到或超过中止阈值时切换为 `session.stalled`；无归属的陈旧模型/工具活动不会被隐藏为长时间运行。
- `session.stuck` 保留用于可恢复的陈旧会话记账，包括带有陈旧无归属模型/工具活动的空闲排队会话。

`diagnostics.stuckSessionAbortMs` 默认为至少 5 分钟且为警告阈值的 3 倍。陈旧会话记账会在恢复门槛通过后立即释放受影响的会话通道；停滞的嵌入式运行只有在达到中止阈值后才会中止并排空，因此排队工作会恢复，而不会切断只是较慢的运行。恢复会发出结构化的 requested/completed 结果；只有当同一个 processing 生成仍是当前生成时，诊断状态才会标记为空闲，并且重复的 `session.stuck` 诊断会在会话保持不变时退避。

## 可能提前结束的位置

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关

- [工具](/zh-CN/tools) - 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) - 由智能体生命周期事件触发的事件驱动脚本
- [压缩](/zh-CN/concepts/compaction) - 长对话如何被汇总
- [Exec 审批](/zh-CN/tools/exec-approvals) - shell 命令的审批门槛
- [Thinking](/zh-CN/tools/thinking) - 思考/推理级别配置
