---
read_when:
    - 你需要一份关于智能体循环或生命周期事件的精确演练说明
    - 你正在更改会话排队、转录写入，或会话写锁行为
summary: 智能体循环生命周期、流，以及等待语义
title: 智能体循环
x-i18n:
    generated_at: "2026-04-24T03:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c124684b8f252440f096f5075a2a5b99071d89f9b1d2a6970b178a0bc15ea69
    source_path: concepts/agent-loop.md
    workflow: 15
---

# 智能体循环（OpenClaw）

智能体循环是智能体一次完整且“真实”的运行过程：输入接收 → 上下文组装 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是将一条消息转换为操作和最终回复的权威路径，同时保持会话状态一致。

在 OpenClaw 中，一个循环是每个会话的一次单独、串行化运行；当模型思考、调用工具并流式输出内容时，它会发出生命周期和流事件。本文档解释了这一真实循环是如何端到端连接起来的。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作原理（高层概览）

1. `agent` RPC 验证参数，解析会话（sessionKey/sessionId），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型以及 thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果内嵌循环没有发出 **lifecycle end/error**，则发出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 通过每会话队列和全局队列对运行进行串行化
   - 解析模型和 auth profile，并构建 pi 会话
   - 订阅 pi 事件并流式传输 assistant/tool 增量
   - 强制执行超时；超过时中止运行
   - 返回负载和 usage 元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - assistant 增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 队列 + 并发

- 运行会按会话键（会话通道）串行化，并且可选地通过一个全局通道。
- 这可以防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup）来接入这一通道系统。
  参见 [Command Queue](/zh-CN/concepts/queue)。
- 转录写入也受到会话文件上的会话写锁保护。该锁是进程感知且基于文件的，因此它可以捕获绕过进程内队列或来自其他进程的写入者。
- 会话写锁默认是非可重入的。如果某个辅助函数在保持单一逻辑写入者的同时，有意嵌套获取同一把锁，则必须显式选择启用
  `allowReentrant: true`。

## 会话 + 工作区准备

- 工作区会被解析并创建；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- Skills 会被加载（或从快照复用），并注入到环境变量和提示词中。
- Bootstrap/上下文文件会被解析并注入到系统提示词报告中。
- 会获取一个会话写锁；`SessionManager` 会在流式传输开始前打开并完成准备。任何后续的转录重写、压缩或截断路径，都必须在打开或修改转录文件之前获取同一把锁。

## 提示词组装 + 系统提示词

- 系统提示词由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文和每次运行的覆盖项构建而成。
- 会强制执行特定模型的限制和压缩预留 token。
- 关于模型能看到什么，参见 [System prompt](/zh-CN/concepts/system-prompt)。

## Hook 点（你可以在哪里拦截）

OpenClaw 有两套 Hook 系统：

- **内部 Hook**（Gateway 网关 Hook）：用于命令和生命周期事件的事件驱动脚本。
- **插件 Hook**：位于智能体/工具生命周期和 Gateway 网关流水线中的扩展点。

### 内部 Hook（Gateway 网关 Hook）

- **`agent:bootstrap`**：在系统提示词最终确定之前、构建 bootstrap 文件期间运行。
  用它来添加/删除 bootstrap 上下文文件。
- **命令 Hook**：`/new`、`/reset`、`/stop` 以及其他命令事件（参见 Hooks 文档）。

设置和示例参见 [Hooks](/zh-CN/automation/hooks)。

### 插件 Hook（智能体 + Gateway 网关生命周期）

这些 Hook 在智能体循环或 Gateway 网关流水线内部运行：

- **`before_model_resolve`**：在会话前运行（无 `messages`），用于在模型解析前以确定性方式覆盖 provider/model。
- **`before_prompt_build`**：在会话加载后运行（带有 `messages`），用于在提交提示词前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对每轮动态文本使用 `prependContext`，对应该位于系统提示词空间中的稳定指导使用系统上下文字段。
- **`before_agent_start`**：用于兼容旧版本的 Hook，可能在任一阶段运行；优先使用上面更明确的 Hook。
- **`before_agent_reply`**：在内联操作之后、LLM 调用之前运行，允许插件接管该轮并返回一个合成回复，或者完全让该轮保持静默。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或标注压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描结果，并可选择阻止 Skills 或插件安装。
- **`tool_result_persist`**：在工具结果写入会话转录之前，同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息 Hook。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

用于出站/工具保护的 Hook 决策规则：

- `before_tool_call`：`{ block: true }` 是终局结果，会阻止较低优先级的处理器继续执行。
- `before_tool_call`：`{ block: false }` 为无操作，不会清除先前的阻止状态。
- `before_install`：`{ block: true }` 是终局结果，会阻止较低优先级的处理器继续执行。
- `before_install`：`{ block: false }` 为无操作，不会清除先前的阻止状态。
- `message_sending`：`{ cancel: true }` 是终局结果，会阻止较低优先级的处理器继续执行。
- `message_sending`：`{ cancel: false }` 为无操作，不会清除先前的取消状态。

关于 Hook API 和注册细节，参见 [Plugin hooks](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。

## 流式传输 + 部分回复

- assistant 增量由 pi-agent-core 流式传输，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 时发出部分回复。
- reasoning 流式传输可以作为单独的流发出，也可以作为块回复发出。
- 关于分块和块回复行为，参见 [Streaming](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 在记录/发出前，工具结果会针对大小和图像负载进行清理。
- 会跟踪消息工具发送，以抑制重复的 assistant 确认信息。

## 回复整形 + 抑制

- 最终负载由以下内容组装而成：
  - assistant 文本（以及可选的 reasoning）
  - 内联工具摘要（在 verbose + 允许时）
  - 模型报错时的 assistant 错误文本
- 精确的静默 token `NO_REPLY` / `no_reply` 会从出站
  负载中过滤掉。
- 消息工具重复项会从最终负载列表中移除。
- 如果没有可渲染的负载剩余且某个工具报错，则会发出回退工具错误回复
  （除非某个消息工具已经发送了用户可见的回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并且可能触发重试。
- 重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 关于压缩流水线，参见 [Compaction](/zh-CN/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并由 `agentCommand` 作为回退发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- assistant 增量会被缓冲为聊天 `delta` 消息。
- 在 **lifecycle end/error** 时会发出聊天 `final`。

## 超时

- `agent.wait` 默认值：30 秒（仅等待）。可由 `timeoutMs` 参数覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认值为 172800 秒（48 小时）；在 `runEmbeddedPiAgent` 的中止计时器中强制执行。
- LLM 空闲超时：`agents.defaults.llm.idleTimeoutSeconds` 会在空闲窗口内未收到任何响应分块时中止模型请求。对于较慢的本地模型或 reasoning/工具调用 provider，请显式设置它；将其设为 0 可禁用。如果未设置，OpenClaw 会在已配置时使用 `agents.defaults.timeoutSeconds`，否则使用 120 秒。对于没有显式 LLM 或智能体超时的 cron 触发运行，会禁用空闲看门狗，并依赖 cron 外层超时。

## 可能提前结束的地方

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关内容

- [Tools](/zh-CN/tools) — 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [Compaction](/zh-CN/concepts/compaction) — 长对话如何被总结
- [Exec Approvals](/zh-CN/tools/exec-approvals) — shell 命令的审批门控
- [Thinking](/zh-CN/tools/thinking) — thinking/reasoning 级别配置
