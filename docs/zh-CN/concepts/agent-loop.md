---
read_when:
    - 你需要 Agent loop 或生命周期事件的精确逐步讲解
    - 你正在更改会话排队、会话记录写入或会话写锁行为
summary: Agent loop 生命周期、流和等待语义
title: Agent loop
x-i18n:
    generated_at: "2026-05-05T03:06:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

智能体式循环是一次智能体完整的“真实”运行：接收 → 上下文组装 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是把消息转化为动作和最终回复的权威路径，同时保持会话状态一致。

在 OpenClaw 中，一个循环是每个会话单次、序列化的运行，并在模型思考、调用工具和流式输出时发出生命周期和流事件。本文说明这个真实循环如何端到端串接。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作方式（高层）

1. `agent` RPC 校验参数，解析会话（sessionKey/sessionId），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型 + thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式循环没有发出结束/错误生命周期事件，则发出**生命周期结束/错误**
3. `runEmbeddedPiAgent`：
   - 通过每会话 + 全局队列序列化运行
   - 解析模型 + 凭证配置文件并构建 pi 会话
   - 订阅 pi 事件并流式传输 assistant/tool 增量
   - 强制超时 -> 超过后中止运行
   - 对于 Codex app-server 回合，中止已经接受但在终端事件前停止产生 app-server 进度的回合
   - 返回载荷 + 用量元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - assistant 增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的**生命周期结束/错误**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行按会话键（会话通道）序列化，并可选择再经过全局通道。
- 这可以避免工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup），这些模式会馈入此通道系统。
  参见 [Command Queue](/zh-CN/concepts/queue)。
- 转录写入也受会话文件上的会话写锁保护。该锁感知进程且基于文件，因此可以捕获绕过进程内队列或来自其他进程的写入者。会话转录写入者最多等待 `session.writeLock.acquireTimeoutMs`，然后才报告会话正忙；默认值为 `60000` ms。
- 会话写锁默认不可重入。如果某个辅助函数有意在保留同一个逻辑写入者的同时嵌套获取同一把锁，必须通过 `allowReentrant: true` 显式选择启用。

## 会话 + 工作区准备

- 解析并创建工作区；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- 加载 Skills（或从快照复用），并注入到环境和提示词中。
- 解析 bootstrap/context 文件，并注入到系统提示词报告中。
- 获取会话写锁；在开始流式传输前打开并准备 `SessionManager`。任何后续转录重写、压缩或截断路径，都必须在打开或修改转录文件前获取同一把锁。

## 提示词组装 + 系统提示词

- 系统提示词由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文和每次运行的覆盖项构建。
- 强制执行模型特定限制和压缩保留令牌。
- 参见 [System prompt](/zh-CN/concepts/system-prompt)，了解模型会看到什么。

## 钩子点（可以拦截的位置）

OpenClaw 有两套钩子系统：

- **内部钩子**（Gateway 网关钩子）：用于命令和生命周期事件的事件驱动脚本。
- **插件钩子**：智能体/工具生命周期和 Gateway 网关管线内的扩展点。

### 内部钩子（Gateway 网关钩子）

- **`agent:bootstrap`**：在系统提示词最终确定前构建 bootstrap 文件时运行。
  用它添加/移除 bootstrap 上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 和其他命令事件（参见 Hooks 文档）。

参见 [Hooks](/zh-CN/automation/hooks) 获取设置和示例。

### 插件钩子（智能体 + Gateway 网关生命周期）

这些钩子在智能体循环或 Gateway 网关管线内运行：

- **`before_model_resolve`**：在会话前运行（无 `messages`），用于在模型解析前确定性地覆盖提供商/模型。
- **`before_prompt_build`**：在会话加载后运行（带 `messages`），用于在提交提示词前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。将 `prependContext` 用于每回合动态文本，将系统上下文字段用于应位于系统提示词空间中的稳定指导。
- **`before_agent_start`**：旧版兼容钩子，可能在任一阶段运行；优先使用上面的显式钩子。
- **`before_agent_reply`**：在内联动作之后、LLM 调用之前运行，让插件接管该回合并返回合成回复，或完全静默该回合。
- **`agent_end`**：完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或注释压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描发现，并可选地阻止 Skill 或插件安装。
- **`tool_result_persist`**：在工具结果写入 OpenClaw 拥有的会话转录前，同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息钩子。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

出站/工具守卫的钩子决策规则：

- `before_tool_call`：`{ block: true }` 是终止性的，会停止更低优先级的处理器。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除先前的阻止。
- `before_install`：`{ block: true }` 是终止性的，会停止更低优先级的处理器。
- `before_install`：`{ block: false }` 是空操作，不会清除先前的阻止。
- `message_sending`：`{ cancel: true }` 是终止性的，会停止更低优先级的处理器。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除先前的取消。

参见 [Plugin hooks](/zh-CN/plugins/hooks) 获取钩子 API 和注册详情。

运行框架可能会以不同方式适配这些钩子。Codex app-server 运行框架将 OpenClaw 插件钩子保留为已文档化镜像表面的兼容性契约，而 Codex 原生钩子仍是一个单独的更低层级 Codex 机制。

## 流式传输 + 部分回复

- Assistant 增量从 pi-agent-core 流式传输，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 上发出部分回复。
- 推理流可以作为单独的流发出，也可以作为分块回复发出。
- 参见 [Streaming](/zh-CN/concepts/streaming) 获取分块和分块回复行为。

## 工具执行 + 消息工具

- 工具 start/update/end 事件在 `tool` 流上发出。
- 工具结果在记录/发出前会按大小和图像载荷进行清理。
- 消息工具发送会被跟踪，以抑制重复的 assistant 确认。

## 回复塑形 + 抑制

- 最终载荷由以下内容组装：
  - assistant 文本（以及可选推理）
  - 内联工具摘要（verbose + 允许时）
  - 模型出错时的 assistant 错误文本
- 精确静默令牌 `NO_REPLY` / `no_reply` 会从出站载荷中过滤掉。
- 消息工具重复项会从最终载荷列表中移除。
- 如果没有剩余可渲染载荷且工具出错，则会发出后备工具错误回复（除非消息工具已经发送了用户可见的回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并可能触发重试。
- 重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 参见 [Compaction](/zh-CN/concepts/compaction) 了解压缩管线。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并由 `agentCommand` 作为后备发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- Assistant 增量会缓冲为聊天 `delta` 消息。
- 在**生命周期结束/错误**时发出聊天 `final`。

## 超时

- `agent.wait` 默认值：30s（仅等待）。`timeoutMs` 参数会覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认 172800s（48 小时）；在 `runEmbeddedPiAgent` 中由中止定时器强制执行。
- Cron 运行时：隔离智能体回合的 `timeoutSeconds` 由 cron 拥有。调度器在执行开始时启动该定时器，在配置的截止时间中止底层运行，然后在记录超时前运行有界清理，避免陈旧子会话让通道卡住。
- 会话活性诊断：启用诊断后，`diagnostics.stuckSessionWarnMs` 会对没有观察到回复、工具、状态、分块或 ACP 进度的长时间 `processing` 会话进行分类。活跃嵌入式运行、模型调用和工具调用会报告为 `session.long_running`；有活跃工作但近期没有进度会报告为 `session.stalled`；`session.stuck` 保留给没有活跃工作的陈旧会话记账。陈旧会话记账会立即释放受影响的会话通道；停滞的嵌入式运行只会在 `diagnostics.stuckSessionAbortMs` 之后才中止并排空（默认：至少 10 分钟且为警告阈值的 5 倍），以便排队工作可以恢复，而不会切断只是较慢的运行。恢复会发出结构化的 requested/completed 结果，并且只有在同一个 processing 代际仍为当前时，诊断状态才会标记为空闲。重复的 `session.stuck` 诊断会在会话保持不变时退避。
- 模型空闲超时：如果在空闲窗口前没有响应分块到达，OpenClaw 会中止模型请求。`models.providers.<id>.timeoutSeconds` 会为较慢的本地/自托管提供商扩展该空闲看门狗；否则，OpenClaw 会在已配置时使用 `agents.defaults.timeoutSeconds`，默认上限为 120s。没有显式模型或智能体超时的 cron 触发运行会禁用空闲看门狗，并依赖 cron 外层超时。
- 提供商 HTTP 请求超时：`models.providers.<id>.timeoutSeconds` 适用于该提供商的模型 HTTP 获取，包括连接、标头、正文、SDK 请求超时、总 guarded-fetch 中止处理和模型流空闲看门狗。对于 Ollama 等较慢的本地/自托管提供商，先使用此项，再提高整个智能体运行时超时。

## 可能提前结束的位置

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关

- [Tools](/zh-CN/tools) — 可用智能体工具
- [Hooks](/zh-CN/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [Compaction](/zh-CN/concepts/compaction) — 长对话如何被摘要
- [Exec Approvals](/zh-CN/tools/exec-approvals) — shell 命令的审批门禁
- [Thinking](/zh-CN/tools/thinking) — thinking/reasoning 级别配置
