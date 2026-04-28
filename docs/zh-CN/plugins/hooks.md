---
read_when:
    - 你正在构建一个需要 before_tool_call、before_agent_reply、消息钩子或生命周期钩子的插件
    - 你需要阻止、重写来自插件的工具调用，或要求对其进行批准
    - 你正在在内部钩子和插件钩子之间做选择
summary: 插件钩子：拦截智能体、工具、消息、会话和 Gateway 网关生命周期事件
title: 插件钩子
x-i18n:
    generated_at: "2026-04-28T17:17:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

插件钩子是 OpenClaw 插件的进程内扩展点。当插件需要检查或更改智能体运行、工具调用、消息流、会话生命周期、子智能体路由、安装或 Gateway 网关启动时使用它们。

当你需要一个由操作员安装的小型 `HOOK.md` 脚本来处理命令和 Gateway 网关事件时，例如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`，请改用[内部钩子](/zh-CN/automation/hooks)。

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

钩子处理程序会按 `priority` 降序依次运行。相同优先级的钩子保留注册顺序。

`api.on(name, handler, opts?)` 接受：

- `priority` — 处理程序顺序（数值越高越先运行）。
- `timeoutMs` — 可选的单钩子预算。设置后，钩子运行器会在预算耗尽后中止该处理程序并继续下一个处理程序，而不是让缓慢的设置或召回工作消耗调用方配置的模型超时。省略它则使用钩子运行器通用应用的默认观察/决策超时。

每个钩子都会收到 `event.context.pluginConfig`，即注册该处理程序的插件的已解析配置。将它用于需要当前插件选项的钩子决策；OpenClaw 会按处理程序注入它，而不会改变其他插件看到的共享事件对象。

## 钩子目录

钩子按其扩展的表面分组。**粗体**名称接受决策结果（阻止、取消、覆盖或要求批准）；其他所有钩子仅用于观察。

**智能体轮次**

- `before_model_resolve` — 在会话消息加载前覆盖提供商或模型
- `agent_turn_prepare` — 消耗排队的插件轮次注入，并在提示钩子之前添加同一轮次上下文
- `before_prompt_build` — 在模型调用前添加动态上下文或系统提示文本
- `before_agent_start` — 仅兼容性的组合阶段；优先使用上面两个钩子
- **`before_agent_reply`** — 使用合成回复或静默来短路模型轮次
- **`before_agent_finalize`** — 检查自然最终答案并请求再进行一次模型传递
- `agent_end` — 观察最终消息、成功状态和运行时长
- `heartbeat_prompt_contribution` — 为后台监控器和生命周期插件添加仅心跳上下文

**对话观察**

- `model_call_started` / `model_call_ended` — 观察经过清理的提供商/模型调用元数据、计时、结果和有界请求 ID 哈希，不包含提示或响应内容
- `llm_input` — 观察提供商输入（系统提示、提示、历史记录）
- `llm_output` — 观察提供商输出

**工具**

- **`before_tool_call`** — 重写工具参数、阻止执行或要求批准
- `after_tool_call` — 观察工具结果、错误和时长
- **`tool_result_persist`** — 重写由工具结果生成的助手消息
- **`before_message_write`** — 检查或阻止正在进行的消息写入（少见）

**消息和投递**

- **`inbound_claim`** — 在智能体路由前声明入站消息（合成回复）
- `message_received` — 观察入站内容、发送者、线程和元数据
- **`message_sending`** — 重写出站内容或取消投递
- `message_sent` — 观察出站投递成功或失败
- **`before_dispatch`** — 在渠道交接前检查或重写出站分发
- **`reply_dispatch`** — 参与最终回复分发管线

**会话和压缩**

- `session_start` / `session_end` — 跟踪会话生命周期边界
- `before_compaction` / `after_compaction` — 观察或注释压缩周期
- `before_reset` — 观察会话重置事件（`/reset`、程序化重置）

**子智能体**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 协调子智能体路由和完成投递

**生命周期**

- `gateway_start` / `gateway_stop` — 随 Gateway 网关启动或停止插件拥有的服务
- `cron_changed` — 观察 Gateway 网关拥有的 cron 生命周期变更（已添加、已更新、已移除、已启动、已完成、已计划）
- **`before_install`** — 检查技能或插件安装扫描并可选择阻止

## 工具调用策略

`before_tool_call` 接收：

- `event.toolName`
- `event.params`
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 cron 驱动的运行中设置）以及诊断用的 `ctx.trace`

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

- `block: true` 是终止性的，并跳过较低优先级的处理程序。
- `block: false` 会被视为没有决策。
- `params` 会重写用于执行的工具参数。
- `requireApproval` 会暂停智能体运行，并通过插件批准询问用户。`/approve` 命令可以同时批准 exec 和插件批准。
- 较低优先级的 `block: true` 仍然可以在较高优先级钩子请求批准后阻止。
- `onResolution` 会收到已解析的批准决策 — `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主机级策略的内置插件可以使用 `api.registerTrustedToolPolicy(...)` 注册受信任的工具策略。这些策略会在普通 `before_tool_call` 钩子之前以及外部插件决策之前运行。仅将它们用于主机信任的门控，例如工作区策略、预算执行或保留工作流安全。外部插件应使用普通 `before_tool_call` 钩子。

### 工具结果持久化

工具结果可以包含结构化的 `details`，用于 UI 渲染、诊断、媒体路由或插件拥有的元数据。将 `details` 视为运行时元数据，而不是提示内容：

- OpenClaw 会在提供商重放和压缩输入前移除 `toolResult.details`，因此元数据不会成为模型上下文。
- 持久化的会话条目仅保留有界的 `details`。过大的 details 会被紧凑摘要和 `persistedDetailsTruncated: true` 替换。
- `tool_result_persist` 和 `before_message_write` 会在最终持久化上限之前运行。钩子仍应保持返回的 `details` 较小，并避免只把与提示相关的文本放在 `details` 中；将模型可见的工具输出放在 `content` 中。

## 提示和模型钩子

新插件请使用特定阶段的钩子：

- `before_model_resolve`：仅接收当前提示和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收当前提示、已准备的会话消息，以及为此会话排空的任何恰好一次的排队注入。返回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收当前提示和会话消息。返回 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：仅在心跳轮次运行，并返回 `prependContext` 或 `appendContext`。它适用于需要汇总当前状态且不改变用户发起轮次的后台监控器。

`before_agent_start` 保留用于兼容。优先使用上面的显式钩子，这样你的插件就不会依赖旧版组合阶段。

当 OpenClaw 可以识别活动运行时，`before_agent_start` 和 `agent_end` 会包含 `event.runId`。同一个值也可在 `ctx.runId` 上获得。Cron 驱动的运行还会暴露 `ctx.jobId`（发起的 cron 作业 ID），以便插件钩子可以将指标、副作用或状态限定到特定的计划作业。

`agent_end` 是观察钩子，并在轮次结束后以即发即弃方式运行。钩子运行器会应用 30 秒超时，因此卡住的插件或嵌入端点不能让钩子 promise 永久挂起。超时会被记录，OpenClaw 会继续；它不会取消插件拥有的网络工作，除非插件也使用自己的中止信号。

将 `model_call_started` 和 `model_call_ended` 用于不应接收原始提示、历史记录、响应、标头、请求正文或提供商请求 ID 的提供商调用遥测。这些钩子包含稳定的元数据，例如 `runId`、`callId`、`provider`、`model`、可选的 `api`/`transport`、终止性的 `durationMs`/`outcome`，以及 OpenClaw 可以推导出有界提供商请求 ID 哈希时的 `upstreamRequestIdHash`。

`before_agent_finalize` 仅在 harness 即将接受自然最终助手答案时运行。它不是 `/stop` 取消路径，并且在用户中止轮次时不会运行。返回 `{ action: "revise", reason }` 以请求 harness 在最终化前再进行一次模型传递，返回 `{ action:
"finalize", reason? }` 以强制最终化，或省略结果以继续。Codex 原生 `Stop` 钩子会作为 OpenClaw `before_agent_finalize` 决策转发到此钩子中。

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

提示变更钩子和持久的下一轮次注入可以按插件通过 `plugins.entries.<id>.hooks.allowPromptInjection=false` 禁用。

### 会话扩展和下一轮次注入

工作流插件可以使用 `api.registerSessionExtension(...)` 持久化小型 JSON 兼容会话状态，并通过 Gateway 网关 `sessions.pluginPatch` 方法更新它。会话行会通过 `pluginExtensions` 投射已注册的扩展状态，使 Control UI 和其他客户端能够渲染插件拥有的状态，而不需要了解插件内部机制。

当插件需要让持久上下文恰好一次到达下一个模型轮次时，使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 会在提示钩子之前排空排队的注入，丢弃过期注入，并按插件使用 `idempotencyKey` 去重。这是批准恢复、策略摘要、后台监控器增量，以及应在下一轮次对模型可见但不应成为永久系统提示文本的命令延续的正确扩展点。

清理语义是契约的一部分。会话扩展清理和运行时生命周期清理回调会收到 `reset`、`delete`、`disable` 或 `restart`。对于 reset/delete/disable，主机会移除所属插件的持久会话扩展状态和待处理的下一轮次注入；restart 会保留持久会话状态，同时清理回调允许插件释放旧运行时生成的调度器作业、运行上下文和其他带外资源。

## 消息钩子

使用消息钩子处理渠道级路由和投递策略：

- `message_received`：观察入站内容、发送者、`threadId`、`messageId`、`senderId`、可选的运行/会话关联以及元数据。
- `message_sending`：重写 `content` 或返回 `{ cancel: true }`。
- `message_sent`：观察最终成功或失败。

对于仅音频 TTS 回复，即使渠道载荷没有可见文本/说明文字，`content` 也可能包含隐藏的口播转录。
重写该 `content` 只会更新钩子可见的转录；它不会渲染为媒体说明文字。

消息钩子上下文在可用时会暴露稳定的关联字段：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。读取旧版元数据之前，优先使用
这些一等字段。

在使用渠道特定元数据之前，优先使用类型化的 `threadId` 和 `replyToId` 字段。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终止性决策。
- 带有 `cancel: false` 的 `message_sending` 会被视为无决策。
- 重写后的 `content` 会继续传递给较低优先级的钩子，除非后续钩子
  取消投递。

## 安装钩子

`before_install` 会在内置扫描 Skills 和插件安装之后运行。
返回额外发现，或返回 `{ block: true, blockReason }` 来停止
安装。

`block: true` 是终止性决策。`block: false` 会被视为无决策。

## Gateway 网关生命周期

对于需要 Gateway 网关拥有的状态的插件服务，使用 `gateway_start`。
上下文会暴露 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，用于
cron 检查和更新。使用 `gateway_stop` 清理长时间运行的
资源。

不要依赖内部 `gateway:startup` 钩子来承载插件拥有的运行时
服务。

`cron_changed` 会针对 Gateway 网关拥有的 cron 生命周期事件触发，并带有类型化的
事件载荷，覆盖 `added`、`updated`、`removed`、`started`、`finished`
和 `scheduled` 原因。该事件携带一个 `PluginHookGatewayCronJob`
快照（存在时包含 `state.nextRunAtMs`、`state.lastRunStatus` 和
`state.lastError`），以及一个 `PluginHookGatewayCronDeliveryStatus`
值：`not-requested` | `delivered` | `not-delivered` | `unknown`。已移除
事件仍会携带已删除的作业快照，以便外部调度器能够
协调状态。同步外部唤醒调度器时，使用运行时
上下文中的 `ctx.getCron?.()` 和 `ctx.config`，并让 OpenClaw 作为
到期检查和执行的事实来源。

## 即将废弃

少数与钩子相邻的表面已废弃但仍受支持。请在下一个主版本发布前
迁移：

- **纯文本渠道信封**，位于 `inbound_claim` 和 `message_received`
  处理程序中。请读取 `BodyForAgent` 和结构化用户上下文块，
  而不是解析扁平信封文本。参见
  [纯文本渠道信封 → BodyForAgent](/zh-CN/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 仍保留用于兼容性。新插件应改用
  `before_model_resolve` 和 `before_prompt_build`，而不是组合
  阶段。
- **`before_tool_call` 中的 `onResolution`** 现在使用类型化的
  `PluginApprovalResolution` 联合（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由格式的 `string`。

完整列表包括内存能力注册、提供商思考
配置文件、外部认证提供商、提供商设备发现类型、任务运行时
访问器，以及 `command-auth` → `command-status` 重命名；请参见
[插件 SDK 迁移 → 活跃废弃项](/zh-CN/plugins/sdk-migration#active-deprecations)。

## 相关

- [插件 SDK 迁移](/zh-CN/plugins/sdk-migration) — 活跃废弃项和移除时间线
- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [内部钩子](/zh-CN/automation/hooks)
- [插件架构内部机制](/zh-CN/plugins/architecture-internals)
