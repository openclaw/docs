---
read_when:
    - 你正在构建一个插件，需要 `before_tool_call`、`before_agent_reply`、消息钩子或生命周期钩子
    - 你需要从插件中阻止、改写或要求对工具调用进行审批
    - 你正在内部钩子和插件钩子之间做选择
summary: 插件钩子：拦截智能体、工具、消息、会话以及 Gateway 网关生命周期事件
title: 插件钩子
x-i18n:
    generated_at: "2026-04-28T00:32:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 689f4c15058f03cff1feb2a8aa1450c75cc3f8648d8ac7cc03ea952b3a1975bd
    source_path: plugins/hooks.md
    workflow: 15
---

插件钩子是 OpenClaw 插件的进程内扩展点。当插件需要检查或更改智能体运行、工具调用、消息流、会话生命周期、子智能体路由、安装流程或 Gateway 网关启动时，请使用它们。

如果你想要的是一个由运维安装的小型 `HOOK.md` 脚本，用于处理命令和 Gateway 网关事件，例如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`，则应改用[内部钩子](/zh-CN/automation/hooks)。

## 快速开始

在你的插件入口中使用 `api.on(...)` 注册带类型的插件钩子：

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

钩子处理器会按 `priority` 降序依次运行。优先级相同的钩子会保留其注册顺序。

每个钩子都会收到 `event.context.pluginConfig`，即为注册该处理器的插件解析后的配置。对于需要当前插件选项的钩子决策，请使用它；OpenClaw 会为每个处理器注入它，而不会修改其他插件看到的共享事件对象。

## 钩子目录

钩子按其扩展的表面分组。**加粗**的名称接受决策结果（阻止、取消、覆盖或要求审批）；其余钩子仅用于观察。

**智能体轮次**

- `before_model_resolve` — 在加载会话消息之前覆盖提供商或模型
- `agent_turn_prepare` — 消费已排队的插件轮次注入，并在提示词钩子之前添加同一轮次上下文
- `before_prompt_build` — 在模型调用之前添加动态上下文或系统提示词文本
- `before_agent_start` — 仅用于兼容性的合并阶段；优先使用上面的两个钩子
- **`before_agent_reply`** — 使用合成回复或静默来短路模型轮次
- **`before_agent_finalize`** — 检查自然生成的最终答案，并请求再进行一次模型传递
- `agent_end` — 观察最终消息、成功状态和运行时长
- `heartbeat_prompt_contribution` — 仅为心跳轮次添加上下文，用于后台监控和生命周期插件

**会话观察**

- `model_call_started` / `model_call_ended` — 观察已净化的提供商/模型调用元数据、耗时、结果以及有界的请求 ID 哈希，不包含提示词或响应内容
- `llm_input` — 观察提供商输入（系统提示词、提示词、历史记录）
- `llm_output` — 观察提供商输出

**工具**

- **`before_tool_call`** — 改写工具参数、阻止执行或要求审批
- `after_tool_call` — 观察工具结果、错误和耗时
- **`tool_result_persist`** — 改写由工具结果生成的助手消息
- **`before_message_write`** — 检查或阻止进行中的消息写入（较少见）

**消息与投递**

- **`inbound_claim`** — 在智能体路由之前认领入站消息（合成回复）
- `message_received` — 观察入站内容、发送者、线程和元数据
- **`message_sending`** — 改写出站内容或取消投递
- `message_sent` — 观察出站投递成功或失败
- **`before_dispatch`** — 在交给渠道之前检查或改写出站分发
- **`reply_dispatch`** — 参与最终回复分发流水线

**会话与压缩**

- `session_start` / `session_end` — 跟踪会话生命周期边界
- `before_compaction` / `after_compaction` — 观察或标注压缩周期
- `before_reset` — 观察会话重置事件（`/reset`、程序化重置）

**子智能体**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 协调子智能体路由和完成结果投递

**生命周期**

- `gateway_start` / `gateway_stop` — 随 Gateway 网关启动或停止由插件拥有的服务
- **`before_install`** — 检查 Skills 或插件安装扫描，并可选择阻止

## 工具调用策略

`before_tool_call` 会收到：

- `event.toolName`
- `event.params`
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 cron 驱动的运行中设置）以及诊断字段 `ctx.trace`

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

- `block: true` 是终止性结果，会跳过更低优先级的处理器。
- `block: false` 会被视为没有决策。
- `params` 会改写用于执行的工具参数。
- `requireApproval` 会暂停智能体运行，并通过插件审批向用户发起请求。`/approve` 命令既可以审批 exec，也可以审批插件审批请求。
- 即使更高优先级的钩子请求了审批，更低优先级的 `block: true` 仍然可以阻止执行。
- `onResolution` 会收到已解析的审批决策 —— `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主机级策略的内置插件可以使用 `api.registerTrustedToolPolicy(...)` 注册受信任的工具策略。这些策略会在普通 `before_tool_call` 钩子和外部插件决策之前运行。仅在主机受信任的门控场景中使用它们，例如工作区策略、预算强制或保留工作流安全。外部插件应使用普通的 `before_tool_call` 钩子。

### 工具结果持久化

工具结果可以包含结构化的 `details`，用于 UI 渲染、诊断、媒体路由或由插件拥有的元数据。请将 `details` 视为运行时元数据，而不是提示词内容：

- OpenClaw 会在提供商重放和压缩输入前移除 `toolResult.details`，以避免元数据进入模型上下文。
- 持久化的会话条目只会保留有界的 `details`。过大的 details 会被替换为紧凑摘要，并附带 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 会在最终持久化上限之前运行。钩子仍应保持返回的 `details` 较小，并避免只在 `details` 中放置与提示词相关的文本；应将模型可见的工具输出放在 `content` 中。

## 提示词和模型钩子

对于新插件，请使用特定阶段的钩子：

- `before_model_resolve`：仅接收当前提示词和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收当前提示词、已准备的会话消息，以及为该会话提取的任何“恰好一次”排队注入。返回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收当前提示词和会话消息。返回 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：仅在心跳轮次运行，并返回 `prependContext` 或 `appendContext`。它适用于需要汇总当前状态、但不应更改用户发起轮次的后台监控器。

`before_agent_start` 仍然保留用于兼容性。请优先使用上面明确的钩子，这样你的插件就不会依赖旧式的合并阶段。

当 OpenClaw 能识别活动运行时，`before_agent_start` 和 `agent_end` 会包含 `event.runId`。同样的值也可在 `ctx.runId` 上获取。由 cron 驱动的运行还会暴露 `ctx.jobId`（来源 cron 作业 ID），以便插件钩子将指标、副作用或状态限定到特定的计划作业。

`agent_end` 是一个观察型钩子，会在轮次结束后以 fire-and-forget 方式运行。钩子运行器会施加 30 秒超时，因此卡住的插件或嵌入端点不会让钩子 Promise 永久挂起。超时会被记录，OpenClaw 会继续运行；除非插件自身也使用了自己的 abort signal，否则这不会取消插件拥有的网络工作。

对于不应接收原始提示词、历史记录、响应、请求头、请求体或提供商请求 ID 的提供商调用遥测，请使用 `model_call_started` 和 `model_call_ended`。这些钩子包含稳定元数据，例如 `runId`、`callId`、`provider`、`model`、可选的 `api` / `transport`、最终的 `durationMs` / `outcome`，以及当 OpenClaw 能推导出有界提供商请求 ID 哈希时的 `upstreamRequestIdHash`。

`before_agent_finalize` 仅在某个 harness 即将接受自然生成的最终助手答案时运行。它不是 `/stop` 取消路径，也不会在用户中止轮次时运行。返回 `{ action: "revise", reason }` 可请求 harness 在最终确认前再进行一次模型传递；返回 `{ action: "finalize", reason? }` 可强制最终确认；省略结果则继续正常流程。Codex native `Stop` 钩子会作为 OpenClaw `before_agent_finalize` 决策中继到此钩子。

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

可修改提示词的钩子和持久化的下一轮注入，可以通过 `plugins.entries.<id>.hooks.allowPromptInjection=false` 为单个插件禁用。

### 会话扩展与下一轮注入

工作流插件可以使用 `api.registerSessionExtension(...)` 持久化小型的 JSON 兼容会话状态，并通过 Gateway 网关 `sessions.pluginPatch` 方法更新它。会话行会通过 `pluginExtensions` 投影已注册的扩展状态，让 Control UI 和其他客户端无需了解插件内部实现也能渲染插件拥有的状态。

当插件需要让持久化上下文“恰好一次”地进入下一次模型轮次时，请使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 会在提示词钩子之前提取已排队注入，丢弃过期注入，并按每个插件的 `idempotencyKey` 去重。对于审批恢复、策略摘要、后台监控增量以及应在下一轮对模型可见、但不应成为永久系统提示词文本的命令续接，这是合适的扩展点。

清理语义是契约的一部分。会话扩展清理和运行时生命周期清理回调会接收 `reset`、`delete`、`disable` 或 `restart`。对于 reset / delete / disable，主机会移除所属插件的持久化会话扩展状态和待处理的下一轮注入；对于 restart，则保留持久化会话状态，同时清理回调让插件释放调度器作业、运行上下文以及旧运行时代际的其他带外资源。

## 消息钩子

对渠道级路由和投递策略，请使用消息钩子：

- `message_received`：观察入站内容、发送者、`threadId`、`messageId`、`senderId`、可选的运行/会话关联以及元数据。
- `message_sending`：改写 `content` 或返回 `{ cancel: true }`。
- `message_sent`：观察最终成功或失败。

对于仅音频的 TTS 回复，即使渠道负载中没有可见文本或说明，`content` 也可能包含隐藏的语音转写文本。改写该 `content` 只会更新钩子可见的转写文本；它不会作为媒体说明渲染出来。

消息钩子上下文会在可用时暴露稳定的关联字段：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。在读取旧版元数据之前，请优先使用这些一等字段。

在使用渠道特定元数据之前，优先使用带类型的 `threadId` 和 `replyToId` 字段。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终止性结果。
- 带有 `cancel: false` 的 `message_sending` 会被视为没有决策。
- 被改写的 `content` 会继续传递给更低优先级的钩子，除非后续钩子取消了投递。

## 安装钩子

`before_install` 会在内置的 Skills 和插件安装扫描之后运行。
返回额外的发现结果，或返回 `{ block: true, blockReason }` 来停止安装。

`block: true` 是终止性结果。`block: false` 会被视为没有决策。

## Gateway 网关生命周期

对于需要 Gateway 网关拥有状态的插件服务，请使用 `gateway_start`。上下文会暴露 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，用于检查和更新 cron。使用 `gateway_stop` 清理长时间运行的资源。

不要依赖内部的 `gateway:startup` 钩子来运行由插件拥有的运行时服务。

## 即将弃用的内容

有一些与钩子相邻的表面已被弃用，但仍受支持。请在下一个主要版本发布前完成迁移：

- **`inbound_claim` 和 `message_received` 处理器中的纯文本渠道信封**。请读取 `BodyForAgent` 和结构化的用户上下文块，而不要解析扁平的信封文本。参见
  [纯文本渠道信封 → BodyForAgent](/zh-CN/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 仍保留用于兼容性。新插件应使用 `before_model_resolve` 和 `before_prompt_build`，而不是这个合并阶段。
- **`before_tool_call` 中的 `onResolution`** 现在使用带类型的
  `PluginApprovalResolution` 联合类型（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由形式的 `string`。

完整列表 —— 内存能力注册、提供商 thinking 配置文件、外部认证提供商、提供商发现类型、任务运行时访问器，以及 `command-auth` → `command-status` 重命名 —— 参见
[插件 SDK 迁移 → 当前弃用项](/zh-CN/plugins/sdk-migration#active-deprecations)。

## 相关内容

- [插件 SDK 迁移](/zh-CN/plugins/sdk-migration) — 当前弃用项和移除时间线
- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [内部钩子](/zh-CN/automation/hooks)
- [插件架构内部机制](/zh-CN/plugins/architecture-internals)
