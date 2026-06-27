---
read_when:
    - 你需要 Agent loop 或生命周期事件的精确演练
    - 你正在更改会话排队、转录写入或会话写锁行为
summary: Agent loop 生命周期、流和等待语义
title: Agent loop
x-i18n:
    generated_at: "2026-06-27T01:45:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

智能体式循环是智能体一次完整的“真实”运行：接收 → 上下文组装 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是将一条消息转化为操作和最终回复的权威路径，
同时保持会话状态一致。

在 OpenClaw 中，一个循环是每个会话一次单一、串行化的运行，会在模型思考、调用工具和流式输出时
发出生命周期和流事件。本文档说明这个真实循环如何端到端串联。

## 入口点

- Gateway RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作方式（高层）

1. `agent` RPC 校验参数，解析会话（sessionKey/sessionId），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型 + thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedAgent`（OpenClaw agent runtime）
   - 如果嵌入式循环没有发出结束事件，则发出 **生命周期 end/error**
3. `runEmbeddedAgent`：
   - 通过每会话 + 全局队列串行化运行
   - 解析模型 + 凭证配置文件，并构建 OpenClaw 会话
   - 订阅运行时事件，并流式传输 assistant/tool 增量
   - 强制执行超时 -> 如果超出则中止运行
   - 对于 Codex app-server 轮次，中止一个已接受但在终端事件前停止产生 app-server 进度的轮次
   - 返回载荷 + 用量元数据
4. `subscribeEmbeddedAgentSession` 将 agent runtime 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - assistant 增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **生命周期 end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行会按会话键（会话通道）串行化，并可选地经过全局通道。
- 这可以防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（steer/followup/collect/interrupt），这些模式会接入这个通道系统。
  参见 [Command Queue](/zh-CN/concepts/queue)。
- 转录写入也受会话文件上的会话写锁保护。该锁
  感知进程并基于文件，因此可以捕获绕过进程内队列或来自
  另一个进程的写入者。会话转录写入者最多等待 `session.writeLock.acquireTimeoutMs`
  后才将会话报告为忙；默认值为 `60000` ms。
- 会话写锁默认不可重入。如果某个 helper 在保持一个逻辑写入者的同时有意嵌套获取
  同一把锁，它必须通过
  `allowReentrant: true` 显式选择加入。

## 会话 + 工作区准备

- 解析并创建工作区；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- 加载 Skills（或复用快照中的 Skills）并注入到环境和提示词中。
- 解析 bootstrap/上下文文件，并注入到系统提示词报告中。
- 获取会话写锁；`SessionManager` 会在流式传输前打开并准备好。任何
  后续转录重写、压缩或截断路径，在打开或
  修改转录文件前都必须获取同一把锁。

## 提示词组装 + 系统提示词

- 系统提示词由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文和每次运行的覆盖项构建。
- 强制执行模型专用限制和压缩预留 token。
- 关于模型会看到什么，参见 [System prompt](/zh-CN/concepts/system-prompt)。

## 钩子点（你可以拦截的位置）

OpenClaw 有两套钩子系统：

- **内部钩子**（Gateway 网关钩子）：用于命令和生命周期事件的事件驱动脚本。
- **插件钩子**：agent/tool 生命周期和 Gateway 网关流水线内的扩展点。

### 内部钩子（Gateway 网关钩子）

- **`agent:bootstrap`**：在系统提示词最终确定前构建 bootstrap 文件时运行。
  用它添加/移除 bootstrap 上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 和其他命令事件（参见 Hooks 文档）。

有关设置和示例，参见 [Hooks](/zh-CN/automation/hooks)。

### 插件钩子（智能体 + Gateway 网关生命周期）

这些钩子在 Agent loop 或 Gateway 网关流水线内运行：

- **`before_model_resolve`**：在会话前运行（没有 `messages`），用于在模型解析前确定性地覆盖提供商/模型。
- **`before_prompt_build`**：在会话加载后运行（带 `messages`），用于在提交提示词前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。将 `prependContext` 用于每轮动态文本，将系统上下文字段用于应位于系统提示词空间中的稳定指导。
- **`before_agent_start`**：旧版兼容钩子，可能在任一阶段运行；优先使用上面的显式钩子。
- **`before_agent_reply`**：在内联操作之后、LLM 调用之前运行，让插件声明接管该轮次并返回合成回复，或完全静默该轮次。
- **`agent_end`**：完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或标注压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：在操作者安装策略运行后，当插件钩子已加载到当前 OpenClaw 进程中时，检查暂存的 Skill 或插件安装材料。
- **`tool_result_persist`**：在工具结果写入 OpenClaw 所拥有的会话转录前，同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息钩子。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

出站/工具防护的钩子决策规则：

- `before_tool_call`：`{ block: true }` 是终止性的，会停止较低优先级的处理器。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除先前的阻止。
- `before_install`：`{ block: true }` 是终止性的，会停止较低优先级的处理器。
- `before_install`：`{ block: false }` 是无操作，不会清除先前的阻止。
- 对于必须覆盖 CLI 安装和更新路径的操作者拥有的安装允许/阻止决策，请使用 `security.installPolicy`，而不是 `before_install`。
- `message_sending`：`{ cancel: true }` 是终止性的，会停止较低优先级的处理器。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除先前的取消。

有关钩子 API 和注册详情，参见 [Plugin hooks](/zh-CN/plugins/hooks)。

Harness 可能会以不同方式适配这些钩子。Codex app-server harness 将
OpenClaw 插件钩子作为已记录镜像
表面的兼容性契约，而 Codex 原生钩子仍然是一个单独的更低层 Codex 机制。

## 流式传输 + 部分回复

- Assistant 增量从 agent runtime 流式传输，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 上发出部分回复。
- 推理流可以作为单独的流发出，也可以作为块回复发出。
- 关于分块和块回复行为，参见 [Streaming](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 工具结果在记录日志/发出前，会按大小和图像载荷进行清理。
- 消息工具发送会被跟踪，以抑制重复的 assistant 确认。

## 回复塑形 + 抑制

- 最终载荷由以下内容组装：
  - assistant 文本（以及可选推理）
  - 内联工具摘要（verbose + 允许时）
  - 模型出错时的 assistant 错误文本
- 精确的静默 token `NO_REPLY` / `no_reply` 会从出站
  载荷中过滤掉。
- 消息工具重复项会从最终载荷列表中移除。
- 如果没有剩余可渲染载荷且工具出错，则会发出回退工具错误回复
  （除非消息工具已经发送了用户可见回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并可触发重试。
- 重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 关于压缩流水线，参见 [Compaction](/zh-CN/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedAgentSession` 发出（也会由 `agentCommand` 作为回退发出）
- `assistant`：来自 agent runtime 的流式增量
- `tool`：来自 agent runtime 的流式工具事件

## 聊天渠道处理

- Assistant 增量会缓冲为聊天 `delta` 消息。
- 聊天 `final` 会在 **生命周期 end/error** 时发出。

## 超时

- `agent.wait` 默认值：30s（仅等待）。`timeoutMs` 参数会覆盖。
- Agent runtime：`agents.defaults.timeoutSeconds` 默认值 172800s（48 小时）；在 `runEmbeddedAgent` 中通过中止计时器强制执行。
- Cron 运行时：隔离的智能体轮次 `timeoutSeconds` 由 cron 拥有。调度器在执行开始时启动该计时器，在配置的截止时间中止底层运行，然后在记录超时前运行有界清理，避免过时的子会话让通道一直卡住。
- 会话活性诊断：启用诊断后，`diagnostics.stuckSessionWarnMs` 会将没有观察到回复、工具、状态、块或 ACP 进度的长时间 `processing` 会话分类。活跃的嵌入式运行、模型调用和工具调用会报告为 `session.long_running`；拥有者明确的静默模型调用也会保持为 `session.long_running`，直到 `diagnostics.stuckSessionAbortMs`，这样慢速或非流式提供商不会过早报告为停滞。没有近期进度的活跃工作会报告为 `session.stalled`；拥有者明确的模型调用会在达到或超过中止阈值时切换为 `session.stalled`，没有拥有者的过时模型/工具活动不会被隐藏为长期运行。`session.stuck` 保留用于可恢复的过时会话簿记，包括带有过时无拥有者模型/工具活动的空闲排队会话。过时会话簿记会在恢复门槛通过后立即释放受影响的会话通道；停滞的嵌入式运行只会在 `diagnostics.stuckSessionAbortMs`（默认：至少 5 分钟且为警告阈值的 3 倍）之后进行 abort-drain，这样排队工作可以恢复，而不会切断只是较慢的运行。恢复会发出结构化的 requested/completed 结果，并且只有同一个 processing generation 仍然是当前 generation 时，诊断状态才会标记为空闲。重复的 `session.stuck` 诊断会在会话保持不变时退避。
- 模型空闲超时：当在空闲窗口之前没有响应块到达时，OpenClaw 会中止模型请求。`models.providers.<id>.timeoutSeconds` 会为慢速本地/自托管提供商延长这个空闲 watchdog，但它仍受任何更低的 `agents.defaults.timeoutSeconds` 或运行专用超时约束，因为这些控制整个智能体运行。否则，在已配置时 OpenClaw 会使用 `agents.defaults.timeoutSeconds`，默认上限为 120s。没有显式模型或智能体超时的 cron 触发云模型运行使用相同的默认空闲 watchdog；带有显式 cron 运行超时时，云模型流停滞上限为 60s，以便配置的模型回退可以在外层 cron 截止时间前运行。cron 触发的本地或自托管模型运行会禁用隐式 watchdog，除非配置了显式超时；显式 cron 运行超时仍是本地/自托管提供商的空闲窗口，因此慢速本地提供商应设置 `models.providers.<id>.timeoutSeconds`。
- 提供商 HTTP 请求超时：`models.providers.<id>.timeoutSeconds` 适用于该提供商的模型 HTTP fetch，包括连接、标头、正文、SDK 请求超时、整体 guarded-fetch 中止处理，以及模型流空闲 watchdog。对于 Ollama 等慢速本地/自托管提供商，请先使用这个选项，再提高整个 agent runtime 超时，并在模型请求需要运行更久时保持智能体/运行时超时至少同样高。

## 可以提前结束的位置

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关

- [工具](/zh-CN/tools) — 可用的智能体工具
- [钩子](/zh-CN/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [压缩](/zh-CN/concepts/compaction) — 长对话如何被总结
- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批门禁
- [思考](/zh-CN/tools/thinking) — 思考/推理级别配置
