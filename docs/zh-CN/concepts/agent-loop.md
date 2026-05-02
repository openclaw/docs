---
read_when:
    - 你需要关于智能体循环或生命周期事件的精确逐步说明
    - 你正在更改会话队列处理、会话记录写入或会话写锁行为
summary: Agent loop 生命周期、流式传输和等待语义
title: Agent loop
x-i18n:
    generated_at: "2026-05-02T13:59:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

Agent loop 是智能体的一次完整“真实”运行：接收输入 → 组装上下文 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是把消息转换为动作和最终回复的权威路径，
同时保持会话状态一致。

在 OpenClaw 中，loop 是每个会话单次、串行化的运行，会在模型思考、调用工具和流式输出时
发出生命周期事件和流事件。本文档说明这个真实 loop 如何端到端接线。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作原理（高层）

1. `agent` RPC 校验参数，解析会话（sessionKey/sessionId），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型 + thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式 loop 没有发出生命周期 end/error，则发出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 通过每会话 + 全局队列串行化运行
   - 解析模型 + 凭证配置，并构建 pi 会话
   - 订阅 pi 事件，并流式传输 assistant/tool delta
   - 强制执行超时 -> 超过后中止运行
   - 对于 Codex app-server 轮次，在终端事件之前，如果已接受的轮次停止产生 app-server 进度，则中止该轮次
   - 返回 payload + usage 元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - assistant delta => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行会按会话键（会话通道）串行化，并可选地经过全局通道。
- 这可以防止工具/会话竞态，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup），并接入此通道系统。
  请参阅 [命令队列](/zh-CN/concepts/queue)。
- transcript 写入也受会话文件上的会话写锁保护。该锁感知进程且基于文件，因此能捕获绕过进程内队列或来自另一个进程的写入者。会话 transcript 写入者最多等待 `session.writeLock.acquireTimeoutMs`
  后才会报告会话繁忙；默认值为 `60000` 毫秒。
- 会话写锁默认不可重入。如果某个 helper 有意在保留一个逻辑写入者的同时嵌套获取
  同一个锁，则必须通过 `allowReentrant: true` 显式选择启用。

## 会话 + 工作区准备

- 解析并创建工作区；沙箱隔离的运行可能会重定向到沙箱工作区根目录。
- 加载 Skills（或从快照复用），并注入到环境和提示词中。
- 解析 bootstrap/context 文件，并注入到系统提示词报告中。
- 获取会话写锁；在开始流式传输前打开并准备 `SessionManager`。任何后续的
  transcript 重写、压缩或截断路径，在打开或修改 transcript 文件之前，都必须获取同一个锁。

## 提示词组装 + 系统提示词

- 系统提示词由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文和每次运行的覆盖项构建。
- 会强制执行模型特定限制和压缩预留 token。
- 请参阅[系统提示词](/zh-CN/concepts/system-prompt)，了解模型会看到什么。

## 钩子点（可以拦截的位置）

OpenClaw 有两套钩子系统：

- **内部钩子**（Gateway 网关钩子）：面向命令和生命周期事件的事件驱动脚本。
- **插件钩子**：智能体/工具生命周期和 Gateway 网关流水线中的扩展点。

### 内部钩子（Gateway 网关钩子）

- **`agent:bootstrap`**：在最终确定系统提示词之前构建 bootstrap 文件时运行。
  用它添加/移除 bootstrap 上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 和其他命令事件（请参阅 Hooks 文档）。

设置和示例请参阅 [Hooks](/zh-CN/automation/hooks)。

### 插件钩子（智能体 + Gateway 网关生命周期）

这些钩子在 Agent loop 或 Gateway 网关流水线中运行：

- **`before_model_resolve`**：在会话前运行（没有 `messages`），用于在模型解析前确定性地覆盖提供商/模型。
- **`before_prompt_build`**：在会话加载后运行（带 `messages`），用于在提交提示词前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。将 `prependContext` 用于每轮动态文本，将系统上下文字段用于应放在系统提示词空间中的稳定指导。
- **`before_agent_start`**：旧版兼容钩子，可能在任一阶段运行；优先使用上面的显式钩子。
- **`before_agent_reply`**：在内联动作之后、LLM 调用之前运行，允许插件声明接管该轮并返回合成回复，或完全静默该轮。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或标注压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描发现，并可选地阻止 Skill 或插件安装。
- **`tool_result_persist`**：在工具结果写入 OpenClaw 拥有的会话 transcript 之前，同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息钩子。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

出站/工具保护的钩子决策规则：

- `before_tool_call`：`{ block: true }` 是终态，会停止较低优先级的处理程序。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除之前的阻止。
- `before_install`：`{ block: true }` 是终态，会停止较低优先级的处理程序。
- `before_install`：`{ block: false }` 是无操作，不会清除之前的阻止。
- `message_sending`：`{ cancel: true }` 是终态，会停止较低优先级的处理程序。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除之前的取消。

钩子 API 和注册详情请参阅[插件钩子](/zh-CN/plugins/hooks)。

Harness 可能会以不同方式适配这些钩子。Codex app-server harness 将
OpenClaw 插件钩子作为已文档化镜像表面的兼容性契约，而 Codex 原生钩子仍是单独的更低层 Codex 机制。

## 流式传输 + 部分回复

- assistant delta 从 pi-agent-core 流式传输，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 上发出部分回复。
- 推理流可以作为单独的流发出，也可以作为分块回复发出。
- 分块和分块回复行为请参阅[流式传输](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 工具结果在记录/发出之前会针对大小和图像 payload 进行清理。
- 会跟踪消息工具发送，以抑制重复的 assistant 确认。

## 回复塑形 + 抑制

- 最终 payload 由以下内容组装：
  - assistant 文本（以及可选推理）
  - 内联工具摘要（当 verbose + 允许时）
  - 模型出错时的 assistant 错误文本
- 精确的静默 token `NO_REPLY` / `no_reply` 会从出站
  payload 中过滤掉。
- 消息工具重复项会从最终 payload 列表中移除。
- 如果没有剩余可渲染的 payload，且某个工具出错，则会发出后备工具错误回复
  （除非消息工具已经发送了用户可见的回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并可触发重试。
- 重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 压缩流水线请参阅[压缩](/zh-CN/concepts/compaction)。

## 事件流（目前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并由 `agentCommand` 作为后备发出）
- `assistant`：来自 pi-agent-core 的流式 delta
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- assistant delta 会缓冲为聊天 `delta` 消息。
- 聊天 `final` 会在 **lifecycle end/error** 时发出。

## 超时

- `agent.wait` 默认：30 秒（仅等待）。`timeoutMs` 参数会覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认 172800 秒（48 小时）；在 `runEmbeddedPiAgent` 中由中止计时器强制执行。
- Cron 运行时：隔离的智能体轮次 `timeoutSeconds` 归 cron 所有。调度器在执行开始时启动该计时器，在配置的截止时间中止底层运行，然后运行有界清理，最后记录超时，确保过期的子会话不会让通道卡住。
- 会话活性诊断：启用诊断后，`diagnostics.stuckSessionWarnMs` 会分类长时间 `processing` 且没有观测到回复、工具、Status、block 或 ACP 进度的会话。活跃的嵌入式运行、模型调用和工具调用会报告为 `session.long_running`；有活跃工作但最近没有进度会报告为 `session.stalled`；`session.stuck` 仅用于没有活跃工作的过期会话记账，并且只有该路径会释放受影响的会话通道，以便排队的启动工作可以排空。重复的 `session.stuck` 诊断会在会话保持不变时退避。
- 模型空闲超时：OpenClaw 会在空闲窗口之前没有响应分块到达时中止模型请求。`models.providers.<id>.timeoutSeconds` 会为慢速本地/自托管提供商扩展此空闲看门狗；否则，OpenClaw 会在配置时使用 `agents.defaults.timeoutSeconds`，默认上限为 120 秒。没有显式模型或智能体超时的 cron 触发运行会禁用空闲看门狗，并依赖 cron 外层超时。
- 提供商 HTTP 请求超时：`models.providers.<id>.timeoutSeconds` 适用于该提供商的模型 HTTP fetch，包括连接、headers、body、SDK 请求超时、总 guarded-fetch 中止处理和模型流空闲看门狗。对于 Ollama 等慢速本地/自托管提供商，请先使用此项，再提高整个智能体运行时超时。

## 可能提前结束的位置

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关

- [工具](/zh-CN/tools) — 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [压缩](/zh-CN/concepts/compaction) — 长对话如何被摘要
- [Exec Approvals](/zh-CN/tools/exec-approvals) — shell 命令的审批门禁
- [Thinking](/zh-CN/tools/thinking) — thinking/reasoning 级别配置
