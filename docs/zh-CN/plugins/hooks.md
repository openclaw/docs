---
read_when:
    - 你正在构建一个需要 before_tool_call、before_agent_reply、消息钩子或生命周期钩子的插件
    - 你需要阻止、重写或要求批准来自插件的工具调用
    - 你正在内部钩子和插件钩子之间做选择
summary: 插件钩子：拦截智能体、工具、消息、会话和 Gateway 网关生命周期事件
title: 插件钩子
x-i18n:
    generated_at: "2026-05-11T20:31:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

插件钩子是 OpenClaw 插件的进程内扩展点。当插件需要检查或更改智能体运行、工具调用、消息流、会话生命周期、子智能体路由、安装或 Gateway 网关启动时，请使用它们。

如果你想要一个由操作者安装的轻量 `HOOK.md` 脚本，用于命令和 Gateway 网关事件，例如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`，请改用[内部钩子](/zh-CN/automation/hooks)。

## 快速开始

从你的插件入口使用 `api.on(...)` 注册类型化插件钩子：

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

钩子处理器会按 `priority` 降序依次运行。优先级相同的钩子会保留注册顺序。

`api.on(name, handler, opts?)` 接受：

- `priority` - 处理器排序（值越高越先运行）。
- `timeoutMs` - 可选的单钩子预算。设置后，钩子运行器会在预算耗尽后中止该处理器并继续下一个处理器，而不是让缓慢的设置或回忆工作消耗调用方配置的模型超时。省略它则使用钩子运行器通用应用的默认观察/决策超时。

操作者也可以在不修补插件代码的情况下设置钩子预算：

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` 会覆盖 `hooks.timeoutMs`，而后者会覆盖插件作者在 `api.on(..., { timeoutMs })` 中设置的值。每个配置值都必须是正整数，且不大于 600000 毫秒。对于已知较慢的钩子，优先使用单钩子覆盖，这样一个插件不会在所有位置都获得更长预算。

每个钩子都会收到 `event.context.pluginConfig`，即注册该处理器的插件的已解析配置。对于需要当前插件选项的钩子决策，请使用它；OpenClaw 会按处理器注入它，而不会改变其他插件看到的共享事件对象。

## 钩子目录

钩子按其扩展的表面分组。**粗体**名称接受决策结果（阻止、取消、覆盖或要求批准）；其他所有钩子都仅用于观察。

**智能体轮次**

- `before_model_resolve` - 在加载会话消息之前覆盖提供商或模型
- `agent_turn_prepare` - 消耗排队的插件轮次注入，并在提示词钩子之前添加同轮次上下文
- `before_prompt_build` - 在模型调用之前添加动态上下文或系统提示词文本
- `before_agent_start` - 仅兼容用的组合阶段；优先使用上面的两个钩子
- **`before_agent_run`** - 在提交给模型之前检查最终提示词和会话消息，并可选择阻止运行
- **`before_agent_reply`** - 用合成回复或静默短路模型轮次
- **`before_agent_finalize`** - 检查自然最终答案并请求再运行一次模型
- `agent_end` - 观察最终消息、成功状态和运行时长
- `heartbeat_prompt_contribution` - 为后台监控和生命周期插件添加仅限 Heartbeat 的上下文

**对话观察**

- `model_call_started` / `model_call_ended` - 观察经过清理的提供商/模型调用元数据、计时、结果，以及不含提示词或响应内容的有界请求 ID 哈希
- `llm_input` - 观察提供商输入（系统提示词、提示词、历史记录）
- `llm_output` - 观察提供商输出

**工具**

- **`before_tool_call`** - 重写工具参数、阻止执行或要求批准
- `after_tool_call` - 观察工具结果、错误和时长
- **`tool_result_persist`** - 重写由工具结果生成的助手消息
- **`before_message_write`** - 检查或阻止进行中的消息写入（少见）

**消息和投递**

- **`inbound_claim`** - 在智能体路由之前认领入站消息（合成回复）
- `message_received` - 观察入站内容、发送者、线程和元数据
- **`message_sending`** - 重写出站内容或取消投递
- `message_sent` - 观察出站投递成功或失败
- **`before_dispatch`** - 在交给渠道之前检查或重写出站分发
- **`reply_dispatch`** - 参与最终回复分发流水线

**会话和压缩**

- `session_start` / `session_end` - 跟踪会话生命周期边界。事件的 `reason` 是 `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart` 或 `unknown` 之一。当进程在会话仍处于活动状态时被停止或重启，`shutdown` 和 `restart` 值会从 Gateway 网关关闭终结器触发，因此下游插件（例如记忆或转录存储）可以最终确定本来会在重启之间一直处于打开状态的幽灵行。终结器有边界限制，因此缓慢的插件无法阻塞 SIGTERM/SIGINT。
- `before_compaction` / `after_compaction` - 观察或注释压缩周期
- `before_reset` - 观察会话重置事件（`/reset`、程序化重置）

**子智能体**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - 协调子智能体路由和完成投递

**生命周期**

- `gateway_start` / `gateway_stop` - 随 Gateway 网关启动或停止插件拥有的服务
- `cron_changed` - 观察 Gateway 网关拥有的 cron 生命周期变更（已添加、已更新、已移除、已启动、已完成、已调度）
- **`before_install`** - 检查技能或插件安装扫描，并可选择阻止

## 工具调用策略

`before_tool_call` 会收到：

- `event.toolName`
- `event.params`
- 可选的 `event.derivedPaths`，包含尽力而为的主机派生目标路径提示，用于 `apply_patch` 等知名工具信封；存在时，这些路径可能不完整，或可能高估工具实际会触及的内容（例如输入格式错误或不完整时）
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 cron 驱动的运行中设置），以及诊断用 `ctx.trace`

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

- `block: true` 是终止性决策，会跳过优先级更低的处理器。
- `block: false` 会被视为没有决策。
- `params` 会重写用于执行的工具参数。
- `requireApproval` 会暂停智能体运行，并通过插件批准向用户询问。`/approve` 命令可以批准 exec 和插件批准。
- 在更高优先级钩子请求批准之后，更低优先级的 `block: true` 仍然可以阻止。
- `onResolution` 会收到已解析的批准决策 - `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主机级策略的内置插件可以使用 `api.registerTrustedToolPolicy(...)` 注册可信工具策略。这些策略会在普通 `before_tool_call` 钩子和外部插件决策之前运行。仅将它们用于主机信任的门禁，例如工作区策略、预算执行或保留工作流安全。外部插件应使用普通 `before_tool_call` 钩子。

### 工具结果持久化

工具结果可以包含结构化 `details`，用于 UI 渲染、诊断、媒体路由或插件拥有的元数据。将 `details` 视为运行时元数据，而不是提示词内容：

- OpenClaw 会在提供商回放和压缩输入之前移除 `toolResult.details`，因此元数据不会成为模型上下文。
- 持久化的会话条目只保留有界 `details`。过大的 details 会替换为紧凑摘要和 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 会在最终持久化上限之前运行。钩子仍应保持返回的 `details` 较小，并避免只把与提示词相关的文本放在 `details` 中；请将模型可见的工具输出放在 `content` 中。

## 提示词和模型钩子

新插件请使用特定阶段的钩子：

- `before_model_resolve`：只接收当前提示词和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收当前提示词、已准备的会话消息，以及为此会话排空的任何恰好一次排队注入。返回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收当前提示词和会话消息。返回 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：仅在 Heartbeat 轮次运行，并返回 `prependContext` 或 `appendContext`。它用于需要汇总当前状态、但不改变用户发起轮次的后台监控器。

`before_agent_start` 仍保留用于兼容。优先使用上面的显式钩子，避免你的插件依赖旧版组合阶段。

`before_agent_run` 在提示词构造之后、任何模型输入之前运行，包括提示词本地图片加载和 `llm_input` 观察。它接收当前用户输入作为 `prompt`，并接收加载的会话历史 `messages` 和活动系统提示词。返回 `{ outcome: "block", reason, message? }` 可在模型读取提示词之前停止运行。`reason` 供内部使用；`message` 是面向用户的替代内容。唯一支持的结果是 `pass` 和 `block`；不受支持的决策形状会失败关闭。

当某次运行被阻止时，OpenClaw 只会在 `message.content` 中存储替代文本，以及阻止插件 ID 和时间戳等非敏感阻止元数据。原始用户文本不会保留在转录或未来上下文中。内部阻止原因会被视为敏感信息，并从转录、历史记录、广播、日志和诊断载荷中排除。可观测性应使用清理后的字段，例如阻止者 ID、结果、时间戳或安全类别。

当 OpenClaw 可以识别活动运行时，`before_agent_start` 和 `agent_end` 会包含 `event.runId`。同一值也可通过 `ctx.runId` 获取。cron 驱动的运行还会暴露 `ctx.jobId`（来源 cron 作业 ID），因此插件钩子可以将指标、副作用或状态限定到特定的定时作业。

对于渠道来源的运行，`ctx.messageProvider` 是提供商表面，例如 `discord` 或 `telegram`，而 `ctx.channelId` 是 OpenClaw 可以从会话键或投递元数据派生出的会话目标标识符。

`agent_end` 是观察钩子，会在轮次之后以即发即忘方式运行。钩子运行器会应用 30 秒超时，因此卡住的插件或嵌入端点不会让钩子 promise 永久挂起。超时会被记录，OpenClaw 会继续；除非插件也使用自己的中止信号，否则它不会取消插件拥有的网络工作。

使用 `model_call_started` 和 `model_call_ended` 处理不应接收原始提示词、历史记录、响应、标头、请求正文或提供商请求 ID 的提供商调用遥测。这些钩子包含稳定元数据，例如 `runId`、`callId`、`provider`、`model`、可选的 `api`/`transport`、终止态 `durationMs`/`outcome`，以及当 OpenClaw 能派生有界提供商请求 ID 哈希时的 `upstreamRequestIdHash`。

`before_agent_finalize` 仅在 harness 即将接受自然的最终助手回答时运行。它不是 `/stop` 取消路径，也不会在用户中止某个轮次时运行。返回 `{ action: "revise", reason }` 可要求 harness 在最终确定前再执行一次模型传递，返回 `{ action: "finalize", reason? }` 可强制最终确定，或省略结果以继续。Codex 原生 `Stop` 钩子会作为 OpenClaw `before_agent_finalize` 决策转发到此钩子中。

返回 `action: "revise"` 时，插件可以包含 `retry` 元数据，使额外模型传递有界且可安全重放：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 会附加到发送给 harness 的修订原因中。`idempotencyKey` 让宿主能跨等价的最终确定决策统计同一插件请求的重试次数，而 `maxAttempts` 会限制宿主在继续使用自然最终回答前允许的额外传递次数。

需要原始对话钩子（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` 或 `before_agent_run`）的非内置插件必须设置：

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

可以用 `plugins.entries.<id>.hooks.allowPromptInjection=false` 按插件禁用会修改提示词的钩子和持久的下一轮注入。

### 会话扩展和下一轮注入

工作流插件可以使用 `api.registerSessionExtension(...)` 持久化小型 JSON 兼容会话状态，并通过 Gateway 网关 `sessions.pluginPatch` 方法更新它。会话行会通过 `pluginExtensions` 投影已注册的扩展状态，让 Control UI 和其他客户端无需了解插件内部机制即可渲染插件拥有的状态。

当插件需要让持久上下文恰好一次到达下一次模型轮次时，请使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 会在提示词钩子前清空排队的注入，丢弃过期注入，并按每个插件的 `idempotencyKey` 去重。这是审批恢复、策略摘要、后台监视器增量，以及应在下一轮对模型可见但不应成为永久系统提示词文本的命令续接的正确接入点。

清理语义是契约的一部分。会话扩展清理和运行时生命周期清理回调会接收 `reset`、`delete`、`disable` 或 `restart`。对于 reset/delete/disable，宿主会移除所属插件的持久会话扩展状态和待处理的下一轮注入；restart 会保留持久会话状态，同时清理回调让插件释放旧运行时代际的调度器作业、运行上下文和其他带外资源。

## 消息钩子

使用消息钩子处理渠道级路由和投递策略：

- `message_received`：观察入站内容、发送者、`threadId`、`messageId`、`senderId`、可选的运行/会话关联和元数据。
- `message_sending`：重写 `content` 或返回 `{ cancel: true }`。
- `message_sent`：观察最终成功或失败。

对于仅音频的 TTS 回复，即使渠道载荷没有可见文本/说明，`content` 也可能包含隐藏的朗读转录文本。重写该 `content` 只会更新钩子可见的转录文本；它不会渲染为媒体说明。

可用时，消息钩子上下文会暴露稳定的关联字段：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。请优先使用这些一等字段，再读取旧版元数据。

在使用渠道特定元数据前，优先使用带类型的 `threadId` 和 `replyToId` 字段。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终止性的。
- 带有 `cancel: false` 的 `message_sending` 会被视为没有决策。
- 重写后的 `content` 会继续传递给较低优先级的钩子，除非后续钩子取消投递。
- `message_sending` 可以随取消返回 `cancelReason` 和有界 `metadata`。新的消息生命周期 API 会将其暴露为原因为 `cancelled_by_message_sending_hook` 的受抑制投递结果；旧版直接投递为兼容性继续返回空结果数组。
- `message_sent` 仅用于观察。处理器失败会被记录，但不会更改投递结果。

## 安装钩子

`before_install` 会在内置的技能和插件安装扫描后运行。返回额外发现项，或返回 `{ block: true, blockReason }` 以停止安装。

`block: true` 是终止性的。`block: false` 会被视为没有决策。

## Gateway 网关生命周期

对于需要 Gateway 网关所拥有状态的插件服务，请使用 `gateway_start`。上下文会暴露 `ctx.config`、`ctx.workspaceDir` 和用于 cron 检查与更新的 `ctx.getCron?.()`。使用 `gateway_stop` 清理长期运行资源。

不要依赖内部 `gateway:startup` 钩子来运行插件拥有的运行时服务。

`cron_changed` 会针对 Gateway 网关拥有的 cron 生命周期事件触发，并带有类型化事件载荷，涵盖 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因。该事件携带 `PluginHookGatewayCronJob` 快照（包括存在时的 `state.nextRunAtMs`、`state.lastRunStatus` 和 `state.lastError`）以及 `PluginHookGatewayCronDeliveryStatus`，其值为 `not-requested` | `delivered` | `not-delivered` | `unknown`。移除事件仍会携带已删除的作业快照，以便外部调度器协调状态。同步外部唤醒调度器时，请使用运行时上下文中的 `ctx.getCron?.()` 和 `ctx.config`，并让 OpenClaw 成为到期检查和执行的事实来源。

## 即将废弃

一些钩子相邻的接口已废弃但仍受支持。请在下一个主版本发布前迁移：

- **明文渠道信封**，位于 `inbound_claim` 和 `message_received` 处理器中。请读取 `BodyForAgent` 和结构化用户上下文块，而不是解析扁平信封文本。参见 [明文渠道信封 → BodyForAgent](/zh-CN/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 为兼容性仍然保留。新插件应使用 `before_model_resolve` 和 `before_prompt_build`，而不是组合阶段。
- **`before_tool_call` 中的 `onResolution`** 现在使用带类型的 `PluginApprovalResolution` 联合（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`），而不是自由格式的 `string`。

完整列表包括记忆能力注册、提供商 thinking 配置文件、外部认证提供商、提供商发现类型、任务运行时访问器，以及 `command-auth` → `command-status` 重命名；请参见 [插件 SDK 迁移 → 活跃废弃项](/zh-CN/plugins/sdk-migration#active-deprecations)。

## 相关

- [插件 SDK 迁移](/zh-CN/plugins/sdk-migration) - 活跃废弃项和移除时间线
- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [内部钩子](/zh-CN/automation/hooks)
- [插件架构内部机制](/zh-CN/plugins/architecture-internals)
