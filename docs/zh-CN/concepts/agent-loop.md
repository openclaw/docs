---
read_when:
    - 你需要关于智能体循环或生命周期事件的精确分步说明
summary: 智能体循环生命周期、流和等待语义
title: 智能体循环
x-i18n:
    generated_at: "2026-04-05T08:20:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e562e63c494881e9c345efcb93c5f972d69aaec61445afc3d4ad026b2d26883
    source_path: concepts/agent-loop.md
    workflow: 15
---

# 智能体循环（OpenClaw）

一个 agentic loop 是智能体完整的“真实”运行过程：输入接收 → 上下文组装 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是将一条消息转换为动作和最终回复的权威路径，同时保持会话状态一致。

在 OpenClaw 中，一个循环是每个会话的单次串行运行；当模型思考、调用工具和流式输出时，它会发出生命周期和流事件。本文档解释这个真实循环是如何端到端连接起来的。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作原理（高层）

1. `agent` RPC 校验参数，解析会话（sessionKey/sessionId），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型 + thinking/verbose 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式循环未发出 **生命周期 end/error**，则发出 **生命周期 end/error**
3. `runEmbeddedPiAgent`：
   - 通过按会话和全局队列实现运行串行化
   - 解析模型 + auth 配置档并构建 pi 会话
   - 订阅 pi 事件并流式传输助手/工具增量
   - 强制执行超时 -> 如果超出则中止运行
   - 返回负载 + usage 元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - 助手增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的**生命周期 end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 队列 + 并发

- 运行会按会话键（会话通道）串行化，并可选地再经过全局通道。
- 这样可以防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup），并接入这个通道系统。
  参见 [命令队列](/concepts/queue)。

## 会话 + 工作区准备

- 工作区会被解析并创建；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- Skills 会被加载（或从快照复用），并注入到环境变量和提示中。
- Bootstrap/上下文文件会被解析，并注入到系统提示报告中。
- 会获取会话写锁；`SessionManager` 会在流式传输前打开并完成准备。

## 提示组装 + 系统提示

- 系统提示由 OpenClaw 的基础提示、Skills 提示、bootstrap 上下文和每次运行的覆盖项构建而成。
- 会强制执行特定于模型的限制和压缩保留 token。
- 关于模型实际看到的内容，参见 [系统提示](/concepts/system-prompt)。

## Hook 点（你可以在哪里拦截）

OpenClaw 有两套 hook 系统：

- **内部 hooks**（Gateway hooks）：用于命令和生命周期事件的事件驱动脚本。
- **插件 hooks**：智能体/工具生命周期和 Gateway 网关管道内部的扩展点。

### 内部 hooks（Gateway hooks）

- **`agent:bootstrap`**：在系统提示最终确定之前、构建 bootstrap 文件时运行。
  可用于添加/删除 bootstrap 上下文文件。
- **命令 hooks**：`/new`、`/reset`、`/stop` 和其他命令事件（见 Hooks 文档）。

设置和示例请参见 [Hooks](/automation/hooks)。

### 插件 hooks（智能体 + Gateway 网关生命周期）

这些会在智能体循环或 Gateway 网关管道内部运行：

- **`before_model_resolve`**：在会话前运行（无 `messages`），用于在模型解析前以确定性方式覆盖 provider/model。
- **`before_prompt_build`**：在会话加载后运行（带 `messages`），用于在提交提示前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对于每轮动态文本请使用 `prependContext`，对于应位于系统提示空间中的稳定指导请使用系统上下文字段。
- **`before_agent_start`**：旧版兼容 hook，可能在任一阶段运行；优先使用上面的显式 hooks。
- **`before_agent_reply`**：在内联动作之后、LLM 调用之前运行，让插件可以接管该轮并返回合成回复，或完全静默该轮。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或注释压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描结果，并可选择阻止 Skills 或插件安装。
- **`tool_result_persist`**：在工具结果写入会话转录之前，同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息 hooks。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

出站/工具守卫的 hook 决策规则：

- `before_tool_call`：`{ block: true }` 为终局结果，并会停止更低优先级处理器。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除之前的阻止。
- `before_install`：`{ block: true }` 为终局结果，并会停止更低优先级处理器。
- `before_install`：`{ block: false }` 是空操作，不会清除之前的阻止。
- `message_sending`：`{ cancel: true }` 为终局结果，并会停止更低优先级处理器。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除之前的取消。

关于 hook API 和注册细节，参见 [插件 hooks](/plugins/architecture#provider-runtime-hooks)。

## 流式传输 + 部分回复

- 助手增量从 pi-agent-core 流式传输，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 时发出部分回复。
- 推理流式传输可以作为单独的流发出，也可以作为块回复发出。
- 关于分块和块回复行为，参见 [流式传输](/concepts/streaming)。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 工具结果在记录/发出前会按大小和图片负载进行清理。
- 消息工具发送会被跟踪，以抑制重复的助手确认。

## 回复整形 + 抑制

- 最终负载由以下内容组装：
  - 助手文本（以及可选的推理）
  - 内联工具摘要（当 verbose + 允许时）
  - 当模型出错时的助手错误文本
- 精确的静默 token `NO_REPLY` / `no_reply` 会从出站负载中过滤掉。
- 消息工具重复项会从最终负载列表中移除。
- 如果没有可渲染负载剩余且工具出错，则会发出回退工具错误回复
  （除非某个消息工具已经发送了用户可见回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并可触发重试。
- 重试时，会重置内存缓冲区和工具摘要，以避免重复输出。
- 关于压缩管道，参见 [压缩](/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（以及由 `agentCommand` 作为回退发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- 助手增量会被缓冲为聊天 `delta` 消息。
- 聊天 `final` 会在**生命周期 end/error** 时发出。

## 超时

- `agent.wait` 默认值：30 秒（仅等待）。可用 `timeoutMs` 参数覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认 172800 秒（48 小时）；在 `runEmbeddedPiAgent` 中通过中止计时器强制执行。

## 可能提前结束的情况

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关内容

- [工具](/tools) — 可用的智能体工具
- [Hooks](/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [压缩](/concepts/compaction) — 长对话如何被总结
- [Exec 批准](/tools/exec-approvals) — shell 命令的批准门控
- [Thinking](/tools/thinking) — thinking/推理级别配置
