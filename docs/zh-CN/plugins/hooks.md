---
read_when:
    - 你正在构建一个需要 before_tool_call、before_agent_reply、消息钩子或生命周期钩子的插件
    - 你需要阻止、重写或要求批准来自插件的工具调用
    - 你正在内部钩子和插件钩子之间做选择
summary: 插件钩子：拦截智能体、工具、消息、会话和 Gateway 网关的生命周期事件
title: 插件钩子
x-i18n:
    generated_at: "2026-04-28T11:58:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa6284ea4033fd0da624a794bf7b8b62c0d93d1a4a5a1f7146c8aa55a1dd1c3
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin 钩子是 OpenClaw 插件的进程内扩展点。当插件需要检查或更改智能体运行、工具调用、消息流、会话生命周期、子智能体路由、安装或 Gateway 网关启动时使用它们。

如果你想为 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令和 Gateway 网关事件使用一个小型、由操作员安装的 `HOOK.md` 脚本，请改用 [内部钩子](/zh-CN/automation/hooks)。

## 快速开始

从你的插件入口使用 `api.on(...)` 注册带类型的插件钩子：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

钩子处理程序按 `priority` 降序依次运行。相同优先级的钩子保持注册顺序。

每个钩子都会收到 `event.context.pluginConfig`，即注册该处理程序的插件的已解析配置。将它用于需要当前插件选项的钩子决策；OpenClaw 会按处理程序注入它，而不会改变其他插件看到的共享事件对象。

## 钩子目录

钩子按其扩展的表面分组。**粗体**名称接受决策结果（阻止、取消、覆盖或要求批准）；其他所有钩子仅用于观察。

**智能体轮次**

- `before_model_resolve` — 在加载会话消息之前覆盖提供商或模型
- `agent_turn_prepare` — 消费排队的插件轮次注入，并在提示钩子之前添加同轮次上下文
- `before_prompt_build` — 在模型调用之前添加动态上下文或系统提示文本
- `before_agent_start` — 仅兼容的组合阶段；优先使用上面的两个钩子
- **`before_agent_reply`** — 使用合成回复或静默短路模型轮次
- **`before_agent_finalize`** — 检查自然最终答案并请求再执行一次模型传递
- `agent_end` — 观察最终消息、成功状态和运行时长
- `heartbeat_prompt_contribution` — 为后台监控和生命周期插件添加仅限心跳的上下文

**对话观察**

- `model_call_started` / `model_call_ended` — 观察已清理的提供商/模型调用元数据、计时、结果和有界请求 ID 哈希，不包含提示或响应内容
- `llm_input` — 观察提供商输入（系统提示、提示、历史记录）
- `llm_output` — 观察提供商输出

**工具**

- **`before_tool_call`** — 重写工具参数、阻止执行或要求批准
- `after_tool_call` — 观察工具结果、错误和时长
- **`tool_result_persist`** — 重写由工具结果生成的助手消息
- **`before_message_write`** — 检查或阻止正在进行的消息写入（少见）

**消息和投递**

- **`inbound_claim`** — 在智能体路由之前认领入站消息（合成回复）
- `message_received` — 观察入站内容、发送者、线程和元数据
- **`message_sending`** — 重写出站内容或取消投递
- `message_sent` — 观察出站投递成功或失败
- **`before_dispatch`** — 在渠道交接前检查或重写出站分派
- **`reply_dispatch`** — 参与最终回复分派管线

**会话和压缩**

- `session_start` / `session_end` — 跟踪会话生命周期边界
- `before_compaction` / `after_compaction` — 观察或注释压缩周期
- `before_reset` — 观察会话重置事件（`/reset`、程序化重置）

**子智能体**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 协调子智能体路由和完成投递

**生命周期**

- `gateway_start` / `gateway_stop` — 随 Gateway 网关启动或停止插件拥有的服务
- `cron_changed` — 观察 Gateway 网关拥有的 cron 生命周期变化（已添加、已更新、已移除、已启动、已完成、已计划）
- **`before_install`** — 检查技能或插件安装扫描，并可选择阻止

## 工具调用策略

`before_tool_call` 接收：

- `event.toolName`
- `event.params`
- 可选 `event.runId`
- 可选 `event.toolCallId`
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 cron 驱动的运行中设置）以及诊断用 `ctx.trace`

它可以返回：

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

规则：

- `block: true` 是终止性决策，会跳过更低优先级的处理程序。
- `block: false` 会被视为无决策。
- `params` 会重写用于执行的工具参数。
- `requireApproval` 会暂停智能体运行，并通过插件批准向用户询问。`/approve` 命令可以同时批准 exec 和插件批准。
- 较低优先级的 `block: true` 仍然可以在较高优先级钩子请求批准之后阻止执行。
- `onResolution` 接收已解析的批准决策，即 `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主机级策略的内置插件可以使用 `api.registerTrustedToolPolicy(...)` 注册受信任的工具策略。这些策略会在普通 `before_tool_call` 钩子和外部插件决策之前运行。仅将它们用于主机信任的门控，例如工作区策略、预算执行或保留工作流安全。外部插件应使用常规 `before_tool_call` 钩子。

### 工具结果持久化

工具结果可以包含结构化 `details`，用于 UI 渲染、诊断、媒体路由或插件拥有的元数据。将 `details` 视为运行时元数据，而不是提示内容：

- OpenClaw 会在提供商重放和压缩输入之前剥离 `toolResult.details`，因此元数据不会变成模型上下文。
- 持久化的会话条目只保留有界 `details`。过大的 details 会被替换为紧凑摘要和 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 会在最终持久化上限之前运行。钩子仍应保持返回的 `details` 小巧，并避免只在 `details` 中放置与提示相关的文本；将模型可见的工具输出放在 `content` 中。

## 提示和模型钩子

新插件请使用特定阶段的钩子：

- `before_model_resolve`：只接收当前提示和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收当前提示、已准备的会话消息，以及为此会话抽取的任何严格一次性排队注入。返回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收当前提示和会话消息。返回 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：仅在心跳轮次运行，并返回 `prependContext` 或 `appendContext`。它面向需要在不更改用户发起轮次的情况下总结当前状态的后台监控。

`before_agent_start` 会保留用于兼容。优先使用上面的显式钩子，这样你的插件就不会依赖旧版组合阶段。

当 OpenClaw 可以识别活动运行时，`before_agent_start` 和 `agent_end` 会包含 `event.runId`。相同值也可在 `ctx.runId` 上获得。Cron 驱动的运行还会暴露 `ctx.jobId`（发起 cron 作业的 ID），以便插件钩子可以将指标、副作用或状态限定到特定的计划作业。

`agent_end` 是观察钩子，会在轮次结束后即发即忘地运行。钩子运行器会应用 30 秒超时，因此卡住的插件或嵌入端点不会让钩子 promise 永远挂起。超时会被记录，OpenClaw 会继续运行；除非插件也使用自己的 abort signal，否则它不会取消插件拥有的网络工作。

使用 `model_call_started` 和 `model_call_ended` 处理不应接收原始提示、历史记录、响应、标头、请求正文或提供商请求 ID 的提供商调用遥测。这些钩子包含稳定元数据，例如 `runId`、`callId`、`provider`、`model`、可选 `api`/`transport`、终止态 `durationMs`/`outcome`，以及当 OpenClaw 可以派生有界提供商请求 ID 哈希时的 `upstreamRequestIdHash`。

`before_agent_finalize` 只在 harness 即将接受自然最终助手答案时运行。它不是 `/stop` 取消路径，也不会在用户中止轮次时运行。返回 `{ action: "revise", reason }` 可要求 harness 在最终确定前再执行一次模型传递，返回 `{ action: "finalize", reason? }` 可强制最终确定，或省略结果以继续。Codex 原生 `Stop` 钩子会作为 OpenClaw `before_agent_finalize` 决策中继到此钩子。

需要 `llm_input`、`llm_output`、`before_agent_finalize` 或 `agent_end` 的非内置插件必须设置：

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

可按插件通过 `plugins.entries.<id>.hooks.allowPromptInjection=false` 禁用提示变更钩子和持久的下一轮注入。

### 会话扩展和下一轮注入

工作流插件可以使用 `api.registerSessionExtension(...)` 持久化小型 JSON 兼容会话状态，并通过 Gateway 网关 `sessions.pluginPatch` 方法更新它。会话行会通过 `pluginExtensions` 投射已注册的扩展状态，让 Control UI 和其他客户端在不了解插件内部机制的情况下渲染插件拥有的 Status。

当插件需要让持久上下文严格一次性到达下一次模型轮次时，使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 会在提示钩子之前抽取排队注入，丢弃过期注入，并按插件通过 `idempotencyKey` 去重。这是批准恢复、策略摘要、后台监控增量和命令延续的正确扩展点；这些内容应在下一轮对模型可见，但不应成为永久系统提示文本。

清理语义是契约的一部分。会话扩展清理和运行时生命周期清理回调会收到 `reset`、`delete`、`disable` 或 `restart`。主机会在 reset/delete/disable 时移除拥有插件的持久会话扩展状态和待处理下一轮注入；restart 会保留持久会话状态，同时清理回调让插件释放旧运行时世代的调度器作业、运行上下文和其他带外资源。

## 消息钩子

将消息钩子用于渠道级路由和投递策略：

- `message_received`：观察入站内容、发送者、`threadId`、`messageId`、`senderId`、可选运行/会话关联和元数据。
- `message_sending`：重写 `content` 或返回 `{ cancel: true }`。
- `message_sent`：观察最终成功或失败。

对于仅音频的 TTS 回复，即使渠道载荷没有可见文本/字幕，`content` 也可能包含隐藏的朗读转录文本。重写该 `content` 只会更新钩子可见的转录文本；它不会渲染为媒体字幕。

消息钩子上下文会在可用时暴露稳定的关联字段：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。在读取旧版元数据之前，优先使用这些一等字段。

在使用渠道特定元数据之前，优先使用有类型的 `threadId` 和 `replyToId` 字段。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终止决策。
- 带有 `cancel: false` 的 `message_sending` 会被视为未作决策。
- 重写后的 `content` 会继续传递给较低优先级的钩子，除非后续钩子取消投递。

## 安装钩子

`before_install` 会在内置的 Skills 和插件安装扫描之后运行。
返回额外发现，或返回 `{ block: true, blockReason }` 以停止安装。

`block: true` 是终止决策。`block: false` 会被视为未作决策。

## Gateway 网关生命周期

对于需要 Gateway 网关所管理状态的插件服务，使用 `gateway_start`。
上下文会暴露 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，用于
cron 检查和更新。使用 `gateway_stop` 清理长时间运行的资源。

不要依赖内部 `gateway:startup` 钩子来处理插件拥有的运行时服务。

`cron_changed` 会在 Gateway 网关拥有的 cron 生命周期事件中触发，并带有类型化的事件载荷，覆盖 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因。该事件携带一个 `PluginHookGatewayCronJob` 快照（包括存在时的 `state.nextRunAtMs`、`state.lastRunStatus` 和 `state.lastError`），以及一个 `PluginHookGatewayCronDeliveryStatus`，其值为 `not-requested` | `delivered` | `not-delivered` | `unknown`。移除事件仍会携带已删除作业的快照，以便外部调度器协调状态。同步外部唤醒调度器时，使用运行时上下文中的 `ctx.getCron?.()` 和 `ctx.config`，并保持 OpenClaw 作为到期检查和执行的事实来源。

## 即将弃用

少数与钩子相邻的表面已弃用但仍受支持。请在下一个主版本发布前迁移：

- **明文渠道信封**，位于 `inbound_claim` 和 `message_received`
  处理器中。请读取 `BodyForAgent` 和结构化用户上下文块，而不是解析扁平信封文本。参见
  [明文渠道信封 → BodyForAgent](/zh-CN/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 为兼容性而保留。新插件应使用
  `before_model_resolve` 和 `before_prompt_build`，而不是组合阶段。
- **`before_tool_call` 中的 `onResolution`** 现在使用有类型的
  `PluginApprovalResolution` 联合类型（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由形式的 `string`。

完整列表包括内存能力注册、提供商思考配置文件、外部身份验证提供商、提供商发现类型、任务运行时访问器，以及 `command-auth` → `command-status` 重命名，请参见
[插件 SDK 迁移 → 当前弃用项](/zh-CN/plugins/sdk-migration#active-deprecations)。

## 相关内容

- [插件 SDK 迁移](/zh-CN/plugins/sdk-migration) — 当前弃用项和移除时间线
- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [内部钩子](/zh-CN/automation/hooks)
- [插件架构内部机制](/zh-CN/plugins/architecture-internals)
