---
read_when:
    - 你需要智能体循环或生命周期事件的精确逐步讲解
    - 你正在更改会话排队、转录写入或会话写入锁行为
summary: Agent loop 生命周期、流和等待语义
title: Agent loop
x-i18n:
    generated_at: "2026-04-28T19:41:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f870abbd9ce724e04b32dfe6296ef0df10ebd5cc6d37492457dc77dfb868b8f
    source_path: concepts/agent-loop.md
    workflow: 16
---

智能体式循环是智能体一次完整的“真实”运行：接收 → 上下文组装 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是权威路径，会把一条消息
转换为动作和最终回复，同时保持会话状态一致。

在 OpenClaw 中，循环是每个会话一次单独的串行化运行，会在模型思考、
调用工具和流式输出时发出生命周期和流事件。本文档说明这个真实循环如何
端到端接线。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作方式（高层）

1. `agent` RPC 校验参数，解析会话（sessionKey/sessionId），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型 + thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式循环未发出 **lifecycle end/error**，则发出它
3. `runEmbeddedPiAgent`：
   - 通过每会话 + 全局队列串行化运行
   - 解析模型 + 凭证配置，并构建 pi 会话
   - 订阅 pi 事件，并流式传输 assistant/tool 增量
   - 强制超时 -> 超出后中止运行
   - 返回 payload + usage 元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - assistant 增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行会按会话键（会话通道）串行化，也可选择通过全局通道串行化。
- 这能防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup），这些模式会进入此通道系统。
  请参阅 [Command Queue](/zh-CN/concepts/queue)。
- 记录写入也受会话文件上的会话写锁保护。该锁能感知进程并基于文件，
  因此可捕获绕过进程内队列或来自其他进程的写入者。
- 默认情况下，会话写锁不可重入。如果某个 helper 有意在保持一个逻辑写入者的同时
  嵌套获取同一把锁，它必须通过 `allowReentrant: true` 显式选择启用。

## 会话 + 工作区准备

- 解析并创建工作区；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- 加载 Skills（或从快照复用），并注入到环境和 prompt 中。
- 解析 bootstrap/context 文件，并注入到系统 prompt 报告中。
- 获取会话写锁；在流式传输前打开并准备 `SessionManager`。任何后续的
  记录重写、压缩或截断路径，都必须在打开或修改记录文件前获取同一把锁。

## Prompt 组装 + 系统 prompt

- 系统 prompt 由 OpenClaw 的基础 prompt、Skills prompt、bootstrap 上下文和每次运行的覆盖项构建。
- 会强制执行模型特定限制和压缩预留 token。
- 请参阅 [System prompt](/zh-CN/concepts/system-prompt)，了解模型会看到什么。

## 钩子点（可以拦截的位置）

OpenClaw 有两个钩子系统：

- **内部钩子**（Gateway 网关钩子）：用于命令和生命周期事件的事件驱动脚本。
- **插件钩子**：智能体/工具生命周期和 Gateway 网关流水线中的扩展点。

### 内部钩子（Gateway 网关钩子）

- **`agent:bootstrap`**：在系统 prompt 最终确定前构建 bootstrap 文件时运行。
  用它来添加/移除 bootstrap 上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 和其他命令事件（参见 Hooks 文档）。

请参阅 [Hooks](/zh-CN/automation/hooks) 获取设置方法和示例。

### 插件钩子（智能体 + Gateway 网关生命周期）

这些钩子在智能体循环或 Gateway 网关流水线内运行：

- **`before_model_resolve`**：在会话前运行（没有 `messages`），用于在模型解析前确定性地覆盖提供商/模型。
- **`before_prompt_build`**：在会话加载后运行（带 `messages`），用于在提交 prompt 前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对每轮动态文本使用 `prependContext`；对应放在系统 prompt 空间中的稳定指导，则使用 system-context 字段。
- **`before_agent_start`**：旧版兼容钩子，可能在任一阶段运行；优先使用上面的显式钩子。
- **`before_agent_reply`**：在内联动作之后、LLM 调用之前运行，让插件接管该轮并返回合成回复，或让该轮完全静默。
- **`agent_end`**：完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或标注压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描发现，并可选择阻止 Skills 或插件安装。
- **`tool_result_persist`**：在工具结果写入 OpenClaw 所拥有的会话记录前同步转换它们。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息钩子。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

出站/工具保护的钩子决策规则：

- `before_tool_call`：`{ block: true }` 是终止性的，会停止低优先级处理器。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除先前的阻止。
- `before_install`：`{ block: true }` 是终止性的，会停止低优先级处理器。
- `before_install`：`{ block: false }` 是无操作，不会清除先前的阻止。
- `message_sending`：`{ cancel: true }` 是终止性的，会停止低优先级处理器。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除先前的取消。

请参阅 [Plugin hooks](/zh-CN/plugins/hooks)，了解钩子 API 和注册详情。

Harness 可能会以不同方式适配这些钩子。Codex app-server harness 将
OpenClaw 插件钩子作为已记录镜像表面的兼容性契约，而 Codex 原生钩子仍是
单独的较低层级 Codex 机制。

## 流式传输 + 部分回复

- Assistant 增量从 pi-agent-core 流式传输，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 上发出部分回复。
- 推理流式传输可以作为单独流发出，也可以作为分块回复发出。
- 请参阅 [Streaming](/zh-CN/concepts/streaming)，了解分块和分块回复行为。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 工具结果在记录/发出前会针对大小和图片 payload 进行清理。
- 会跟踪消息工具发送，以抑制重复的 assistant 确认。

## 回复整形 + 抑制

- 最终 payload 由以下内容组装：
  - assistant 文本（以及可选推理）
  - 内联工具摘要（在 verbose + 允许时）
  - 模型出错时的 assistant 错误文本
- 精确的静默 token `NO_REPLY` / `no_reply` 会从出站
  payload 中过滤掉。
- 消息工具重复项会从最终 payload 列表中移除。
- 如果没有剩余可渲染 payload 且某个工具出错，则会发出后备工具错误回复
  （除非消息工具已发送用户可见回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并可触发重试。
- 重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 请参阅 [Compaction](/zh-CN/concepts/compaction)，了解压缩流水线。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并由 `agentCommand` 作为后备发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- Assistant 增量会缓冲为聊天 `delta` 消息。
- 在 **lifecycle end/error** 上会发出聊天 `final`。

## 超时

- `agent.wait` 默认值：30 秒（只是等待）。`timeoutMs` 参数可覆盖。
- Agent 运行时：`agents.defaults.timeoutSeconds` 默认 172800 秒（48 小时）；在 `runEmbeddedPiAgent` 中通过中止计时器强制执行。
- 卡住会话恢复：启用 diagnostics 时，`diagnostics.stuckSessionWarnMs` 会检测长时间处于 `processing` 的会话。默认情况下，活跃嵌入式运行、活跃回复操作和活跃会话通道任务仍仅发出警告；如果 diagnostics 显示该会话没有活跃工作，watchdog 会释放受影响的会话通道，使排队的启动工作能够排空。
- 模型空闲超时：当响应分块在空闲窗口前没有到达时，OpenClaw 会中止模型请求。`models.providers.<id>.timeoutSeconds` 会为缓慢的本地/自托管提供商延长此空闲 watchdog；否则 OpenClaw 会在配置了 `agents.defaults.timeoutSeconds` 时使用它，默认上限为 120 秒。没有显式模型或智能体超时的 cron 触发运行会禁用空闲 watchdog，并依赖 cron 外层超时。
- 提供商 HTTP 请求超时：`models.providers.<id>.timeoutSeconds` 适用于该提供商的模型 HTTP 获取，包括连接、headers、body、SDK 请求超时、总 guarded-fetch 中止处理，以及模型流空闲 watchdog。对于 Ollama 等缓慢的本地/自托管提供商，请先使用此项，再提高整个智能体运行时超时。

## 可能提前结束的位置

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关

- [Tools](/zh-CN/tools) — 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [Compaction](/zh-CN/concepts/compaction) — 长对话如何被摘要
- [Exec Approvals](/zh-CN/tools/exec-approvals) — shell 命令的审批门禁
- [Thinking](/zh-CN/tools/thinking) — thinking/reasoning 级别配置
