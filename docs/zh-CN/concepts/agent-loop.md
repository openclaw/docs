---
read_when:
    - 你需要智能体循环或生命周期事件的精确演练
    - 你正在更改会话排队、对话记录写入或会话写入锁行为
summary: Agent loop 生命周期、流和等待语义
title: Agent loop
x-i18n:
    generated_at: "2026-05-01T23:59:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Agent loop 是智能体的一次完整“真实”运行：接收输入 → 组装上下文 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是权威路径，会把一条消息转化为行动和最终回复，
同时保持会话状态一致。

在 OpenClaw 中，一个 loop 是每个会话内一次单独的串行运行，会在模型思考、调用工具、
流式输出时发出生命周期事件和流事件。本文档说明这个真实 loop 如何端到端接线。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作方式（高层）

1. `agent` RPC 会校验参数，解析会话（sessionKey/sessionId），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型 + thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式 loop 没有发出生命周期 end/error，则发出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 通过每会话 + 全局队列串行化运行
   - 解析模型 + 凭证配置，并构建 Pi 会话
   - 订阅 Pi 事件，并流式传输助手/工具增量
   - 强制执行超时 -> 如果超出则中止运行
   - 对于 Codex app-server 回合，在终端事件前，如果已接受的回合停止产生 app-server 进度，则中止该回合
   - 返回 payload + 用量元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - 助手增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行会按会话键（会话 lane）串行化，并可选地经过全局 lane。
- 这可以防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup），并送入这个 lane 系统。
  参见 [Command Queue](/zh-CN/concepts/queue)。
- Transcript 写入还会受到会话文件上的会话写锁保护。该锁感知进程并基于文件，
  因此可以捕获绕过进程内队列或来自另一个进程的写入者。
- 会话写锁默认不可重入。如果某个 helper 在保持单一逻辑写入者的同时有意嵌套获取同一把锁，
  必须使用 `allowReentrant: true` 显式选择启用。

## 会话 + 工作区准备

- 解析并创建工作区；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- 加载 Skills（或从快照复用），并注入到环境和提示词中。
- 解析 bootstrap/context 文件，并注入到系统提示词报告中。
- 获取会话写锁；在开始流式传输前打开并准备 `SessionManager`。之后任何 transcript 重写、
  压缩或截断路径，都必须在打开或修改 transcript 文件前获取同一把锁。

## 提示词组装 + 系统提示词

- 系统提示词由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文和每次运行的覆盖项构建而成。
- 会强制执行模型特定限制和压缩预留 token。
- 关于模型会看到什么，参见 [System prompt](/zh-CN/concepts/system-prompt)。

## 钩子点（你可以在哪里拦截）

OpenClaw 有两套钩子系统：

- **内部钩子**（Gateway 网关钩子）：用于命令和生命周期事件的事件驱动脚本。
- **插件钩子**：智能体/工具生命周期和 Gateway 网关管线内的扩展点。

### 内部钩子（Gateway 网关钩子）

- **`agent:bootstrap`**：在系统提示词最终确定前构建 bootstrap 文件时运行。
  用它添加/移除 bootstrap 上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 和其他命令事件（参见 Hooks 文档）。

有关设置和示例，参见 [Hooks](/zh-CN/automation/hooks)。

### 插件钩子（智能体 + Gateway 网关生命周期）

这些钩子在 Agent loop 或 Gateway 网关管线内运行：

- **`before_model_resolve`**：在会话前运行（没有 `messages`），用于在模型解析前以确定性方式覆盖提供商/模型。
- **`before_prompt_build`**：在会话加载后运行（带 `messages`），用于在提交提示词前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。将 `prependContext` 用于每回合动态文本，将系统上下文字段用于应位于系统提示词空间中的稳定指导。
- **`before_agent_start`**：旧版兼容钩子，可能在任一阶段运行；优先使用上面的显式钩子。
- **`before_agent_reply`**：在内联操作之后、LLM 调用之前运行，让插件接管该回合并返回合成回复，或完全静默该回合。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或注释压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描发现，并可选择阻止 skill 或插件安装。
- **`tool_result_persist`**：在工具结果写入 OpenClaw 拥有的会话 transcript 前同步转换这些结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息钩子。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

出站/工具防护的钩子决策规则：

- `before_tool_call`：`{ block: true }` 是终止性的，并会停止优先级较低的处理程序。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除先前的 block。
- `before_install`：`{ block: true }` 是终止性的，并会停止优先级较低的处理程序。
- `before_install`：`{ block: false }` 是无操作，不会清除先前的 block。
- `message_sending`：`{ cancel: true }` 是终止性的，并会停止优先级较低的处理程序。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除先前的 cancel。

有关钩子 API 和注册详情，参见 [插件钩子](/zh-CN/plugins/hooks)。

Harness 可能以不同方式适配这些钩子。Codex app-server harness 将
OpenClaw 插件钩子作为已文档化镜像表面的兼容性契约，而 Codex 原生钩子仍是单独的更底层 Codex 机制。

## 流式传输 + 部分回复

- 助手增量从 pi-agent-core 流式传输，并以 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 发出部分回复。
- 推理流可以作为单独的流发出，也可以作为分块回复发出。
- 关于分块和分块回复行为，参见 [Streaming](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 记录/发出前，会对工具结果按大小和图片 payload 进行清理。
- 会跟踪消息工具发送，以抑制重复的助手确认。

## 回复塑形 + 抑制

- 最终 payload 会由以下内容组装：
  - 助手文本（和可选推理）
  - 内联工具摘要（当 verbose + 允许时）
  - 模型出错时的助手错误文本
- 确切的静默 token `NO_REPLY` / `no_reply` 会从出站
  payload 中过滤。
- 消息工具重复项会从最终 payload 列表中移除。
- 如果没有剩余可渲染 payload 且工具出错，则会发出 fallback 工具错误回复
  （除非某个消息工具已经发送了用户可见回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并可以触发重试。
- 重试时，内存缓冲区和工具摘要会重置，以避免重复输出。
- 关于压缩管线，参见 [Compaction](/zh-CN/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并由 `agentCommand` 作为 fallback 发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- 助手增量会缓冲为聊天 `delta` 消息。
- 在 **lifecycle end/error** 时会发出聊天 `final`。

## 超时

- `agent.wait` 默认值：30s（仅等待）。`timeoutMs` 参数可覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认 172800s（48 小时）；在 `runEmbeddedPiAgent` 中通过中止计时器强制执行。
- Cron 运行时：隔离的智能体回合 `timeoutSeconds` 由 cron 拥有。调度器会在执行开始时启动该计时器，在配置的截止时间中止底层运行，然后运行有界清理，再记录超时，这样过期的子会话不会让 lane 卡住。
- 会话活跃性诊断：启用诊断后，`diagnostics.stuckSessionWarnMs` 会分类长时间处于 `processing` 且没有观察到回复、工具、Status、分块或 ACP 进度的会话。活跃的嵌入式运行、模型调用和工具调用会报告为 `session.long_running`；有活跃工作但近期无进度会报告为 `session.stalled`；`session.stuck` 仅用于没有活跃工作的过期会话记账，并且只有该路径会释放受影响的会话 lane，使排队的启动工作可以排空。当会话保持不变时，重复的 `session.stuck` 诊断会退避。
- 模型空闲超时：如果在空闲窗口前没有响应 chunk 到达，OpenClaw 会中止模型请求。`models.providers.<id>.timeoutSeconds` 会为较慢的本地/自托管提供商延长此空闲 watchdog；否则 OpenClaw 会在已配置时使用 `agents.defaults.timeoutSeconds`，默认上限为 120s。没有显式模型或智能体超时的 cron 触发运行会禁用空闲 watchdog，并依赖 cron 外层超时。
- 提供商 HTTP 请求超时：`models.providers.<id>.timeoutSeconds` 会应用于该提供商的模型 HTTP fetch，包括连接、headers、body、SDK 请求超时、整体受保护 fetch 中止处理，以及模型流空闲 watchdog。在提高整个智能体运行时超时前，请将它用于 Ollama 等较慢的本地/自托管提供商。

## 可能提前结束的位置

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关内容

- [Tools](/zh-CN/tools) — 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [Compaction](/zh-CN/concepts/compaction) — 长对话如何被摘要
- [Exec Approvals](/zh-CN/tools/exec-approvals) — shell 命令的审批门禁
- [Thinking](/zh-CN/tools/thinking) — thinking/reasoning 级别配置
