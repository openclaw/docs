---
read_when:
    - 你正在构建一个需要 before_tool_call、before_agent_reply、消息钩子或生命周期钩子的插件
    - 你需要阻止、重写来自插件的工具调用，或要求审批
    - 你正在选择内部钩子还是插件钩子
summary: 插件钩子：拦截智能体、工具、消息、会话和 Gateway 网关生命周期事件
title: 插件钩子
x-i18n:
    generated_at: "2026-07-05T11:32:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7526c109b1fe07d36cda945d64577c374539f6ccf3f2ba0a99796939aba6dd9a
    source_path: plugins/hooks.md
    workflow: 16
---

插件钩子是 OpenClaw 插件的进程内扩展点：检查或
更改智能体运行、工具调用、消息流、会话生命周期、子智能体
路由、安装，或 Gateway 网关启动。

如果只需要一个由操作员安装的小型 `HOOK.md` 脚本来响应命令和 Gateway 网关事件，
例如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`，
请改用[内部钩子](/zh-CN/automation/hooks)。

## 快速开始

从插件入口使用 `api.on(...)` 注册类型化钩子：

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

处理程序会按 `priority` 降序依次运行；相同优先级的处理程序
保持注册顺序。

`api.on(name, handler, opts?)` 接受：

| 选项        | 作用                                                                                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | 排序；数值越高越先运行。                                                                                                                                                                    |
| `timeoutMs` | 每个钩子的预算。设置后，运行器会在预算耗尽后中止该处理程序并继续执行，而不是阻塞到已配置的模型超时。省略则使用运行器默认的每钩子超时。 |

操作员可以在不修补插件代码的情况下设置钩子预算：

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

`hooks.timeouts.<hookName>` 会覆盖 `hooks.timeoutMs`，后者会覆盖
插件作者在 `api.on(..., { timeoutMs })` 中设置的值。每个值都必须是
最大为 600000 ms 的正整数。对于已知较慢的钩子，优先使用按钩子的覆盖，
避免某个插件在所有地方都获得更长预算。

每个钩子都会收到 `event.context.pluginConfig`，即注册该处理程序的
插件的已解析配置。OpenClaw 会按处理程序注入该配置，而不会
改变其他插件看到的共享事件对象。

## 钩子目录

钩子按其扩展的表面分组。**粗体**名称接受决策
结果（阻止、取消、覆盖或要求审批）；其余仅用于
观察。

**智能体轮次**

| 钩子                            | 用途                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | 在会话消息加载前覆盖提供商或模型                                  |
| `agent_turn_prepare`            | 消费排队的插件轮次注入，并在提示词钩子前添加同轮次上下文      |
| `before_prompt_build`           | 在模型调用前添加动态上下文或系统提示词文本                          |
| `before_agent_start`            | 仅用于兼容的组合阶段；优先使用上面的两个钩子                            |
| **`before_agent_run`**          | 在提交给模型前检查最终提示词和会话消息；可以阻止运行 |
| **`before_agent_reply`**        | 使用合成回复或静默短路模型轮次                           |
| **`before_agent_finalize`**     | 检查自然最终答案，并请求再执行一次模型传递                         |
| `agent_end`                     | 观察最终消息、成功状态和运行时长                                  |
| `heartbeat_prompt_contribution` | 为后台监控和生命周期插件添加仅 Heartbeat 使用的上下文                  |

**对话观察**

| 钩子                                      | 用途                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | 已清理的提供商/模型调用元数据：计时、结果、有界请求 ID 哈希。不包含提示词或响应内容。 |
| `llm_input`                               | 提供商输入：系统提示词、提示词、历史                                                                     |
| `llm_output`                              | 提供商输出、用量，以及可用时已解析的 `contextTokenBudget`                                       |

**工具**

| 钩子                       | 用途                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | 重写工具参数、阻止执行，或要求审批 |
| `after_tool_call`          | 观察工具结果、错误和时长                |
| `resolve_exec_env`         | 向 `exec` 提供插件拥有的环境变量   |
| **`tool_result_persist`**  | 重写由工具结果生成的助手消息 |
| **`before_message_write`** | 检查或阻止正在进行的消息写入（少见）      |

**消息和投递**

| 钩子                        | 用途                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**         | 在智能体路由前认领入站消息（合成回复） |
| `message_received`          | 观察入站内容、发送者、线程和元数据             |
| **`message_sending`**       | 重写出站内容或取消投递                       |
| **`reply_payload_sending`** | 在投递前变更或取消规范化回复载荷        |
| `message_sent`              | 观察出站投递成功或失败                      |
| **`before_dispatch`**       | 在交接给渠道前检查或重写出站分派    |
| **`reply_dispatch`**        | 参与最终回复分派流水线                  |

**会话和压缩**

| 钩子                                     | 用途                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | 跟踪会话生命周期边界。`reason` 是 `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart` 或 `unknown` 之一。当进程停止或在存在活跃会话时重启，Gateway 网关关闭终结器会触发 `shutdown`/`restart`，因此插件（记忆、转录存储）可以完成幽灵行，而不是让它们在重启后保持打开。终结器有边界限制，因此较慢的插件无法阻塞 SIGTERM/SIGINT。 |
| `before_compaction` / `after_compaction` | 观察或注释压缩周期                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | 观察会话重置事件（`/reset`、程序化重置）                                                                                                                                                                                                                                                                                                                                                                                                     |

**子智能体**

- `subagent_spawned` / `subagent_ended` - 观察子智能体启动和完成。
- `subagent_delivery_target` - 在没有核心会话绑定可以投射路由时，用于完成投递的兼容性钩子。
- `subagent_spawning` - 已弃用的兼容性钩子。现在核心会在 `subagent_spawned` 触发前，通过渠道会话绑定适配器准备 `thread: true` 子智能体绑定。
- 当 OpenClaw 已在启动前解析子会话的原生模型时，`subagent_spawned` 会包含 `resolvedModel` 和 `resolvedProvider`。
- `subagent_ended` 携带 `targetSessionKey`（身份 - 匹配 `subagent_spawned.childSessionKey`）、`targetKind`（`"subagent"` 或 `"acp"`）、`reason`、可选 `outcome`（`"ok"`、`"error"`、`"timeout"`、`"killed"`、`"reset"` 或 `"deleted"`）、可选 `error`、`runId`、`endedAt`、`accountId` 和 `sendFarewell`。它**不**包含 `agentId` 或 `childSessionKey`；请使用 `targetSessionKey` 与匹配的 `subagent_spawned` 事件关联。

**生命周期**

| 钩子                             | 用途                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | 随 Gateway 网关启动或停止插件拥有的服务                                                 |
| `deactivate`                     | `gateway_stop` 的已弃用兼容别名；在新插件中使用 `gateway_stop`                 |
| `cron_changed`                   | 观察 Gateway 网关拥有的 cron 生命周期变化（已添加、已更新、已移除、已启动、已完成、已调度） |
| **`before_install`**             | 从已加载的插件运行时检查暂存的技能或插件安装材料                         |

## 调试运行时钩子

使用 `before_model_resolve` 为智能体轮次切换提供商或模型 - 它
会在模型解析前运行。`llm_output` 只会在模型尝试
产生助手输出后运行。

要证明有效会话模型，请检查运行时注册，然后
使用 `openclaw sessions` 或 Gateway 网关会话/状态表面。要调试
提供商载荷，请使用 `--raw-stream` 和
`--raw-stream-path <path>` 启动 Gateway 网关，将原始模型流事件写入 jsonl 文件。

## 工具调用策略

`before_tool_call` 接收：

- `event.toolName`
- `event.params`
- 可选的 `event.toolKind` 和 `event.toolInputKind`，即主机权威的工具判别器，用于有意共享名称的工具；例如，外层代码模式 `exec` 调用使用 `toolKind: "code_mode_exec"`，并在已知输入语言时包含 `toolInputKind: "javascript" | "typescript"`
- 可选的 `event.derivedPaths`，即由主机尽力推导的目标路径提示，用于 `apply_patch` 等已知工具封套；这些路径可能不完整，或可能过度近似该工具实际会触及的内容（例如，输入格式错误或不完整时）
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.toolKind`、`ctx.toolInputKind`，以及诊断用 `ctx.trace`

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

类型化生命周期钩子的守卫行为：

- `block: true` 是终态，并会跳过优先级更低的处理程序。
- `block: false` 会被视为没有决策。
- `params` 会重写用于执行的工具参数。
- `requireApproval` 会暂停智能体运行，并通过插件审批询问用户。`/approve` 可以同时批准 exec 和插件审批。在 Codex app-server report-mode 原生 `PreToolUse` 中继中，这会转交给匹配的 app-server 审批请求；参见 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#hook-boundaries)。
- 在优先级更高的钩子请求审批后，优先级更低的 `block: true` 仍然可以阻止运行。
- `onResolution` 会收到已解析的决策：`allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

有关审批路由、决策行为，以及何时使用 `requireApproval` 而不是可选工具或 exec 审批，请参见 [插件权限请求](/zh-CN/plugins/plugin-permission-requests)。

需要主机级策略的插件可以使用 `api.registerTrustedToolPolicy(...)` 注册受信任工具策略。这些策略会在普通 `before_tool_call` 钩子之前运行，也会在普通钩子决策之前运行。内置受信任策略最先运行；已安装插件的受信任策略随后按插件加载顺序运行；普通 `before_tool_call` 钩子在它们之后运行。内置插件保留现有的受信任策略路径。已安装插件必须显式启用，并在 `contracts.trustedToolPolicies` 中声明每个策略 ID；未声明的 ID 会在注册前被拒绝。策略 ID 的作用域限定为注册该策略的插件，因此不同插件可以复用相同的本地 ID。仅将这一层用于主机信任的关卡，例如工作区策略、预算执行或保留工作流安全。

### Exec 环境钩子

`resolve_exec_env` 允许插件在命令运行之前，为 `exec` 工具调用贡献环境变量。它接收：

- `event.sessionKey`
- `event.toolName`，目前始终为 `"exec"`
- `event.host`，为 `"gateway"`、`"sandbox"` 或 `"node"` 之一
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.messageProvider` 和 `ctx.channelId`

返回一个 `Record<string, string>` 以合并到 exec 环境中。处理程序按优先级顺序运行；对于相同键，后面的结果会覆盖前面的结果。

钩子输出在合并前会经过主机 exec 环境键策略过滤。`PATH` 始终会被丢弃（命令解析和 safe-bin 检查依赖它）。无效键和危险的主机覆盖键会被丢弃，例如 `LD_*`、`DYLD_*`、`NODE_OPTIONS`、代理变量（`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY`），以及 TLS 覆盖变量（`NODE_TLS_REJECT_UNAUTHORIZED`、`SSL_CERT_FILE` 及类似变量）。过滤后的插件环境会包含在 Gateway 网关审批/审计元数据中，并转发给节点主机执行请求。

### 工具结果持久化

工具结果可以包含结构化 `details`，用于 UI 渲染、诊断、媒体路由或插件拥有的元数据。将 `details` 视为运行时元数据，而不是提示词内容：

- OpenClaw 会在提供商重放和压缩输入前剥离 `toolResult.details`，因此元数据不会变成模型上下文。
- 持久化的会话条目只保留有界的 `details`。过大的 details 会替换为紧凑摘要，并设置 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 会在最终持久化上限之前运行。保持返回的 `details` 较小，并避免把与提示词相关的文本只放在 `details` 中；将模型可见的工具输出放在 `content` 中。

## 提示词和模型钩子

新插件请使用特定阶段的钩子：

- `before_model_resolve`：只接收当前提示词和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收当前提示词、准备好的会话消息，以及为此会话耗尽的任何精确一次排队注入。返回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收当前提示词和会话消息。返回 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：仅在 Heartbeat 轮次运行，并返回 `prependContext` 或 `appendContext`。适用于需要汇总当前状态而不改变用户发起轮次的后台监视器。

`before_agent_start` 仍保留用于兼容。优先使用上面的显式钩子，这样插件就不依赖旧版组合阶段。

`before_agent_run` 在提示词构建之后、任何模型输入之前运行，包括提示词本地图片加载和 `llm_input` 观察。它接收当前用户输入作为 `prompt`，以及 `messages` 中加载的会话历史和活动系统提示词。返回 `{ outcome: "block", reason, message? }` 可在模型读取提示词前停止运行。`reason` 是内部字段；`message` 是面向用户的替换内容。仅支持 `pass` 和 `block` 结果；不支持的决策形状会失败关闭。

当一次运行被阻止时，OpenClaw 只会在 `message.content` 中存储替换文本，并附加非敏感阻止元数据，例如执行阻止的插件 ID 和时间戳。原始用户文本不会保留在转录或未来上下文中。内部阻止原因会被视为敏感信息，并从转录、历史、广播、日志和诊断载荷中排除。可观测性应使用经过清理的字段，例如阻止者 ID、结果、时间戳或安全类别。

当 OpenClaw 能识别活动运行时，`before_agent_start` 和 `agent_end` 会包含 `event.runId`；同一值也位于 `ctx.runId`。由 cron 驱动的运行还会在智能体轮次上下文中暴露 `ctx.jobId`（发起的 cron 作业 ID），以便钩子将指标、副作用或状态限定到特定定时作业。`ctx.jobId` 不是 `before_tool_call` 工具上下文的一部分。

对于源自渠道的运行，`ctx.channel` 和 `ctx.messageProvider` 用于标识提供商表面，例如 `discord` 或 `telegram`，而 `ctx.channelId` 是 OpenClaw 能从会话键或投递元数据中推导时的会话目标标识符。

当发送者身份可用时，智能体钩子上下文还会包含：

- `ctx.senderId` - 渠道作用域的发送者 ID（例如 Feishu `open_id`、Discord 用户 ID）。当运行源自具有已知发送者元数据的用户消息时填充。
- `ctx.chatId` - 传输原生会话标识符（例如 Feishu `chat_id`、Telegram `chat_id`）。当发起渠道提供原生会话 ID 时填充。
- `ctx.channelContext.sender.id` - 与 `ctx.senderId` 相同的发送者 ID，位于渠道拥有的对象下，插件可以使用渠道特定字段扩展该对象。
- `ctx.channelContext.chat.id` - 与 `ctx.chatId` 相同的会话 ID，位于渠道拥有的对象下，插件可以使用渠道特定字段扩展该对象。

核心只定义嵌套的 `id` 字段。通过入站 helper 传递更丰富发送者或聊天元数据的渠道插件，可以从 `openclaw/plugin-sdk/channel-inbound` 扩充 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`：

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

渠道插件通过入站 SDK helper 传递这些字段：

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

这些字段是可选的，并且在系统发起的运行（Heartbeat、cron、exec-event）中不存在。

`ctx.senderExternalId` 保留为旧插件的已弃用源兼容字段。核心不会填充它；新的渠道特定发送者身份应通过模块扩充放在 `ctx.channelContext.sender` 下。

`agent_end` 是一个观察钩子。Gateway 网关和持久化 harness 路径会在轮次结束后以即发即忘方式运行它，而短生命周期的一次性 CLI 路径会在进程清理前等待钩子 promise，以便受信任插件刷新终端可观测性或捕获状态。钩子运行器会应用 30 秒超时，因此卡住的插件或嵌入端点不会让钩子 promise 永久挂起。超时会被记录，OpenClaw 会继续；除非插件也使用自己的中止信号，否则它不会取消插件拥有的网络工作。

将 `model_call_started` 和 `model_call_ended` 用于不应接收原始提示词、历史、响应、标头、请求正文或提供商请求 ID 的提供商调用遥测。这些钩子包含稳定元数据，例如 `runId`、`callId`、`provider`、`model`、可选的 `api`/`transport`、终态 `durationMs`/`outcome`，以及当 OpenClaw 能推导出有界提供商请求 ID 哈希时的 `upstreamRequestIdHash`。当运行时已解析上下文窗口元数据时，钩子事件和上下文还会包含 `contextTokenBudget`，即应用模型/配置/智能体上限后的有效 token 预算，以及在应用较低上限时的 `contextWindowSource` 和 `contextWindowReferenceTokens`。

`before_agent_finalize` 仅在 harness 即将接受自然的最终助手回答时运行。它不是 `/stop` 取消路径，并且在用户中止轮次时不会运行。返回 `{ action: "revise", reason }` 可要求 harness 在最终化前再进行一次模型传递；返回 `{ action: "finalize", reason? }` 可强制最终化；或省略结果以继续。Codex 原生 `Stop` 钩子会作为 OpenClaw `before_agent_finalize` 决策中继到此钩子中。

返回 `action: "revise"` 时，插件可以包含 `retry` 元数据，使额外模型传递有界且可安全重放：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 会附加到发送给 harness 的修订原因中。`idempotencyKey` 允许主机跨等价最终化决策统计同一插件请求的重试次数，而 `maxAttempts` 会限制主机在继续使用自然最终答案前允许的额外传递次数。

需要原始会话钩子（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` 或 `before_agent_run`）的非内置插件必须设置：

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

可以按插件通过 `plugins.entries.<id>.hooks.allowPromptInjection=false` 禁用提示词变更钩子和持久的下一轮注入。

### 会话扩展和下一轮注入

工作流插件可以通过
`api.session.state.registerSessionExtension(...)` 持久化小型 JSON 兼容的会话状态，并通过
Gateway 网关 `sessions.pluginPatch` 方法更新它。会话行会通过 `pluginExtensions` 投射已注册的扩展状态，让 Control UI 和其他客户端可以呈现插件拥有的状态，而无需了解插件内部机制。
`api.registerSessionExtension(...)` 仍然可用，但已弃用，请改用
`api.session.state` 命名空间。

当插件需要让持久上下文只精确进入下一次模型轮次一次时，请使用 `api.session.workflow.enqueueNextTurnInjection(...)`（顶层
`api.enqueueNextTurnInjection(...)` 是行为相同的已弃用别名）。OpenClaw 会在提示词钩子之前排空排队的注入，丢弃已过期的注入，并按每个插件的 `idempotencyKey` 去重。这是审批恢复、策略摘要、后台监视器增量，以及应在下一轮对模型可见但不应成为永久系统提示词文本的命令延续的正确边界。

清理语义是契约的一部分。会话扩展清理和运行时生命周期清理回调会收到 `reset`、`delete`、`disable` 或
`restart`。对于 reset/delete/disable，宿主会移除所属插件的持久会话扩展状态和待处理的下一轮注入；restart 会保留持久会话状态，同时清理回调会让插件释放旧运行时世代的调度器作业、运行上下文和其他带外资源。

## 消息钩子

使用消息钩子处理渠道级路由和投递策略：

- `message_received`：观察入站内容、发送者、`threadId`、
  `messageId`、`senderId`、可选的运行/会话关联，以及元数据。
- `message_sending`：改写 `content` 或返回 `{ cancel: true }`。
- `reply_payload_sending`：改写规范化的 `ReplyPayload` 对象
  （包括 `presentation`、`delivery`、媒体引用和文本）或返回
  `{ cancel: true }`。
- `message_sent`：观察最终成功或失败。

对于仅音频的 TTS 回复，即使渠道载荷没有可见文本/说明文字，`content` 也可能包含隐藏的语音转录文本。改写该 `content` 只会更新钩子可见的转录文本；它不会作为媒体说明文字呈现。

`reply_payload_sending` 事件可能包含 `usageState`，这是尽力而为的实时单轮模型/用量/上下文快照。持久投递、恢复的重放，以及没有精确运行关联的回复会省略它。

消息钩子上下文在可用时会暴露稳定的关联字段：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。当渠道具有经过可见性过滤的引用消息数据时，入站和 `before_dispatch` 上下文也会暴露回复元数据：`replyToId`、`replyToIdFull`、
`replyToBody`、`replyToSender` 和 `replyToIsQuote`。在读取旧版元数据之前，优先使用这些一等字段。

在使用渠道特定元数据之前，优先使用类型化的 `threadId` 和 `replyToId` 字段。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终止性的。
- 带有 `cancel: false` 的 `message_sending` 会被视为没有决策。
- 改写后的 `content` 会继续传递给较低优先级的钩子，除非后续钩子取消投递。
- `reply_payload_sending` 在载荷规范化之后、渠道投递之前运行，包括路由回原始渠道的回复。处理程序按顺序运行，每个处理程序都会看到较高优先级处理程序生成的最新载荷。
- `reply_payload_sending` 载荷不会暴露运行时信任标记，例如
  `trustedLocalMedia`；插件可以编辑载荷形状，但不能授予本地媒体信任。
- `message_sending` 可以在取消时返回 `cancelReason` 和有界的 `metadata`。新的消息生命周期 API 会将其暴露为原因是 `cancelled_by_message_sending_hook` 的受抑制投递结果；旧版直接投递为了兼容性会继续返回空结果数组。
- `message_sent` 仅用于观察。处理程序失败会被记录到日志中，并且不会改变投递结果。

## 安装钩子

使用 `security.installPolicy` 处理操作员拥有的允许/阻止决策。该策略从 OpenClaw 配置运行，覆盖 CLI 安装和更新路径，并且在已启用但不可用时以失败关闭方式处理。

`before_install` 是插件运行时生命周期钩子。它仅在插件钩子已加载的 OpenClaw 进程中，在 `security.installPolicy` 之后运行，例如由 Gateway 网关支撑的安装流程。它适用于插件拥有的观察、警告和兼容性检查，但不是安装的主要企业或宿主安全边界。`builtinScan` 字段会为了兼容性保留在事件载荷中，但 OpenClaw 不再运行内置的安装时危险代码阻止，因此它是一个空的 `ok` 结果。返回额外发现或
`{ block: true, blockReason }` 可停止该进程中的安装。

`block: true` 是终止性的。`block: false` 会被视为没有决策。处理程序失败会以失败关闭方式阻止安装。

## Gateway 网关生命周期

对于需要 Gateway 网关拥有的状态的插件服务，请使用 `gateway_start`。上下文会暴露 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，用于 cron 检查和更新。使用 `gateway_stop` 清理长时间运行的资源。

不要依赖内部 `gateway:startup` 钩子来运行插件拥有的运行时服务。

`cron_changed` 会针对 Gateway 网关拥有的 cron 生命周期事件触发，并携带类型化事件载荷，涵盖 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因。事件会携带一个 `PluginHookGatewayCronJob`
快照（包括存在时的 `state.nextRunAtMs`、`state.lastRunStatus` 和
`state.lastError`），以及一个值为 `not-requested` | `delivered` | `not-delivered` | `unknown` 的 `PluginHookGatewayCronDeliveryStatus`。移除事件仍会携带已删除的作业快照，以便外部调度器协调状态。同步外部唤醒调度器时，请使用运行时上下文中的 `ctx.getCron?.()` 和 `ctx.config`，并将 OpenClaw 保持为到期检查和执行的事实来源。

## 即将弃用的内容

一些钩子相邻的表面已弃用但仍受支持。请在下一个主要版本之前迁移：

- **纯文本渠道信封**，位于 `inbound_claim` 和 `message_received`
  处理程序中。请读取 `BodyForAgent` 和结构化用户上下文块，而不是解析扁平信封文本。参见
  [纯文本渠道信封 → BodyForAgent](/zh-CN/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 会为兼容性保留。新插件应使用
  `before_model_resolve` 和 `before_prompt_build`，而不是组合阶段。
- **`subagent_spawning`** 会为兼容旧插件而保留，但新插件不应从中返回线程路由。核心会在 `subagent_spawned` 触发之前，通过渠道会话绑定适配器准备
  `thread: true` 子智能体绑定。
- **`deactivate`** 作为已弃用的清理兼容性别名，会保留到
  2026-08-16 之后。新插件应使用 `gateway_stop`。
- **`before_tool_call` 中的 `onResolution`** 现在使用类型化的
  `PluginApprovalResolution` 联合类型（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由形式的 `string`。
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** 会作为顶层兼容性别名保留。新插件应使用
  `api.session.state.registerSessionExtension(...)` 和
  `api.session.workflow.enqueueNextTurnInjection(...)`。

如需完整列表，包括记忆能力注册、提供商思考配置、外部凭证提供商、提供商发现类型、任务运行时访问器，以及 `command-auth` → `command-status` 重命名，请参见
[插件 SDK 迁移 → 活跃弃用项](/zh-CN/plugins/sdk-migration#active-deprecations)。

## 相关

- [插件 SDK 迁移](/zh-CN/plugins/sdk-migration) - 活跃弃用项和移除时间线
- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [内部钩子](/zh-CN/automation/hooks)
- [插件架构内部机制](/zh-CN/plugins/architecture-internals)
