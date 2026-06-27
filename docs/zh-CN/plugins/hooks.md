---
read_when:
    - 你正在构建一个需要 `before_tool_call`、`before_agent_reply`、消息钩子或生命周期钩子的插件
    - 你需要阻止、重写或要求批准来自插件的工具调用
    - 你正在 internal hooks 和 plugin hooks 之间做选择
summary: 插件钩子：拦截智能体、工具、消息、会话和 Gateway 网关生命周期事件
title: 插件钩子
x-i18n:
    generated_at: "2026-06-27T02:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

插件钩子是 OpenClaw 插件的进程内扩展点。当插件需要检查或更改智能体运行、工具调用、消息流、会话生命周期、子智能体路由、安装或 Gateway 网关启动时使用它们。

如果你想要用于 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令和 Gateway 网关事件的、小型操作员安装的 `HOOK.md` 脚本，请改用[内部钩子](/zh-CN/automation/hooks)。

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

钩子处理器会按 `priority` 降序依次运行。相同优先级的钩子保持注册顺序。

`api.on(name, handler, opts?)` 接受：

- `priority` - 处理器排序（更高的先运行）。
- `timeoutMs` - 可选的单钩子预算。设置后，钩子运行器会在预算耗尽后中止该处理器并继续下一个处理器，而不是让缓慢的设置或召回工作消耗调用方配置的模型超时时间。省略它可使用钩子运行器通用应用的默认观察/决策超时。

操作员也可以在不修补插件代码的情况下设置钩子预算：

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

`hooks.timeouts.<hookName>` 会覆盖 `hooks.timeoutMs`，而后者会覆盖插件作者在 `api.on(..., { timeoutMs })` 中设置的值。每个配置值都必须是正整数，且不大于 600000 毫秒。对于已知较慢的钩子，优先使用单钩子覆盖，避免某个插件在所有位置都获得更长预算。

每个钩子都会收到 `event.context.pluginConfig`，即注册该处理器的插件的已解析配置。需要当前插件选项的钩子决策应使用它；OpenClaw 会按处理器注入它，而不会改变其他插件看到的共享事件对象。

## 钩子目录

钩子按其扩展的表面分组。**粗体**名称接受决策结果（阻止、取消、覆盖或要求审批）；所有其他钩子仅用于观察。

**智能体轮次**

- `before_model_resolve` - 在加载会话消息之前覆盖提供商或模型
- `agent_turn_prepare` - 消耗排队的插件轮次注入，并在提示钩子之前添加同轮次上下文
- `before_prompt_build` - 在模型调用之前添加动态上下文或系统提示文本
- `before_agent_start` - 仅用于兼容性的组合阶段；优先使用上面两个钩子
- **`before_agent_run`** - 在提交给模型前检查最终提示和会话消息，并可选择阻止运行
- **`before_agent_reply`** - 使用合成回复或静默短路模型轮次
- **`before_agent_finalize`** - 检查自然最终答案并请求再执行一次模型传递
- `agent_end` - 观察最终消息、成功状态和运行时长
- `heartbeat_prompt_contribution` - 为后台监视器和生命周期插件添加仅 Heartbeat 的上下文

**对话观察**

- `model_call_started` / `model_call_ended` - 观察已清理的提供商/模型调用元数据、计时、结果，以及有界请求 ID 哈希，不包含提示或响应内容
- `llm_input` - 观察提供商输入（系统提示、提示、历史）
- `llm_output` - 观察提供商输出、用量，以及可用时解析出的 `contextTokenBudget`

**工具**

- **`before_tool_call`** - 重写工具参数、阻止执行或要求审批
- `after_tool_call` - 观察工具结果、错误和时长
- `resolve_exec_env` - 向 `exec` 贡献插件拥有的环境变量
- **`tool_result_persist`** - 重写由工具结果生成的助手消息
- **`before_message_write`** - 检查或阻止正在进行的消息写入（少见）

**消息和递送**

- **`inbound_claim`** - 在智能体路由之前认领入站消息（合成回复）
- `message_received` — 观察入站内容、发送者、线程和元数据
- **`message_sending`** — 重写出站内容或取消递送
- **`reply_payload_sending`** — 在递送前变更或取消规范化回复载荷
- `message_sent` — 观察出站递送成功或失败
- **`before_dispatch`** - 在渠道交接前检查或重写出站分发
- **`reply_dispatch`** - 参与最终回复分发管线

**会话和压缩**

- `session_start` / `session_end` - 跟踪会话生命周期边界。事件的 `reason` 是 `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart` 或 `unknown` 之一。当进程在会话仍处于活动状态时停止或重启，`shutdown` 和 `restart` 值会从 Gateway 网关关闭终结器触发，因此下游插件（例如记忆或转录存储）可以终结那些否则会在重启后继续保持打开状态的幽灵行。终结器有边界，因此缓慢的插件无法阻塞 SIGTERM/SIGINT。
- `before_compaction` / `after_compaction` - 观察或注释压缩周期
- `before_reset` - 观察会话重置事件（`/reset`、程序化重置）

**子智能体**

- `subagent_spawned` / `subagent_ended` - 观察子智能体启动和完成。
- `subagent_delivery_target` - 当没有核心会话绑定可以投射路由时，用于完成递送的兼容性钩子。
- `subagent_spawning` - 已弃用的兼容性钩子。核心现在会在 `subagent_spawned` 触发之前，通过渠道会话绑定适配器准备 `thread: true` 子智能体绑定。
- 当 OpenClaw 在启动前已解析子会话的原生模型时，`subagent_spawned` 会包含 `resolvedModel` 和 `resolvedProvider`。
- `subagent_ended` 携带 `targetSessionKey`（身份 — 这与 `subagent_spawned.childSessionKey` 匹配）、`targetKind`（`"subagent"` 或 `"acp"`）、`reason`、可选 `outcome`（`"ok"`、`"error"`、`"timeout"`、`"killed"`、`"reset"` 或 `"deleted"`）、可选 `error`、`runId`、`endedAt`、`accountId` 和 `sendFarewell`。它**不**包含 `agentId` 或 `childSessionKey`；请使用 `targetSessionKey` 与对应的 `subagent_spawned` 事件关联。

**生命周期**

- `gateway_start` / `gateway_stop` - 随 Gateway 网关启动或停止插件拥有的服务
- `deactivate` - `gateway_stop` 的已弃用兼容性别名；新插件中请使用 `gateway_stop`
- `cron_changed` - 观察 Gateway 网关拥有的 cron 生命周期变更（已添加、已更新、已移除、已启动、已完成、已计划）
- **`before_install`** - 从已加载的插件运行时检查暂存的技能或插件安装材料

## 调试运行时钩子

当插件需要为智能体轮次切换提供商或模型时，使用 `before_model_resolve`。它在模型解析之前运行；`llm_output` 只会在一次模型尝试生成助手输出后运行。

要证明有效会话模型，请检查运行时注册，然后使用 `openclaw sessions` 或 Gateway 网关会话/状态表面。调试提供商载荷时，使用 `--raw-stream` 和 `--raw-stream-path <path>` 启动 Gateway 网关；这些标志会将原始模型流事件写入 jsonl 文件。

## 工具调用策略

`before_tool_call` 接收：

- `event.toolName`
- `event.params`
- 可选的 `event.toolKind` 和 `event.toolInputKind`，它们是主机权威判别字段，适用于有意共享名称的工具；例如，外层代码模式 `exec` 调用使用 `toolKind: "code_mode_exec"`，并且在输入语言已知时包含 `toolInputKind: "javascript" | "typescript"`
- 可选的 `event.derivedPaths`，包含主机尽力推导出的目标路径提示，用于 `apply_patch` 等已知工具信封；存在时，这些路径可能不完整，也可能过度近似工具实际会触及的内容（例如在输入格式错误或不完整时）
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 cron 驱动的运行中设置）、`ctx.toolKind`、`ctx.toolInputKind` 和诊断 `ctx.trace`

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

类型化生命周期钩子的钩子守卫行为：

- `block: true` 是终止性的，并跳过较低优先级的处理器。
- `block: false` 会被视为无决策。
- `params` 会重写用于执行的工具参数。
- `requireApproval` 会暂停智能体运行，并通过插件审批询问用户。`/approve` 命令可以同时批准 exec 和插件审批。在 Codex app-server 报告模式原生 `PreToolUse` 中继中，这会推迟到匹配的 app-server 审批请求；请参阅 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#hook-boundaries)。
- 即使较高优先级的钩子已请求审批，较低优先级的 `block: true` 仍然可以阻止。
- `onResolution` 接收已解析的审批决策 - `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

有关审批路由、决策行为，以及何时使用 `requireApproval` 而不是可选工具或 exec 审批，请参阅[插件权限请求](/zh-CN/plugins/plugin-permission-requests)。

需要主机级策略的插件可以使用 `api.registerTrustedToolPolicy(...)` 注册受信任工具策略。它们会在普通 `before_tool_call` 钩子之前以及普通钩子决策之前运行。内置受信任策略最先运行；已安装插件的受信任策略随后按插件加载顺序运行；普通 `before_tool_call` 钩子在它们之后运行。内置插件保留现有的受信任策略路径。已安装插件必须显式启用，并在 `contracts.trustedToolPolicies` 中声明每个策略 ID；未声明的 ID 会在注册前被拒绝。策略 ID 的作用域限定为注册它的插件，因此不同插件可以复用同一个本地 ID。仅将这一层用于主机信任的门控，例如工作区策略、预算执行或保留工作流安全。

### Exec 环境钩子

`resolve_exec_env` 允许插件在基础 exec 环境构建之后、命令运行之前，向 `exec` 工具调用贡献环境变量。它接收：

- `event.sessionKey`
- `event.toolName`，当前始终为 `"exec"`
- `event.host`，是 `"gateway"`、`"sandbox"` 或 `"node"` 之一
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.messageProvider` 和 `ctx.channelId`

返回一个 `Record<string, string>` 以合并到 exec 环境中。处理器按优先级顺序运行，对于同一个键，后续钩子结果会覆盖先前钩子结果。

Hook 输出会先经过主机 exec 环境键策略过滤，然后才会合并。无效键、`PATH`，以及危险的主机覆盖键（例如 `LD_*`、`DYLD_*`、`NODE_OPTIONS`、代理变量和 TLS 覆盖变量）都会被丢弃。过滤后的插件 env 会包含在 Gateway 网关审批/审计元数据中，并转发给 node-host 执行请求。

### 工具结果持久化

工具结果可以包含结构化 `details`，用于 UI 渲染、诊断、媒体路由或插件拥有的元数据。将 `details` 视为运行时元数据，而不是提示内容：

- OpenClaw 会在提供商重放和压缩输入之前剥离 `toolResult.details`，这样元数据不会变成模型上下文。
- 持久化的会话条目只保留有界的 `details`。过大的 details 会替换为紧凑摘要和 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 会在最终持久化上限之前运行。Hook 仍应保持返回的 `details` 足够小，并避免只把与提示相关的文本放在 `details` 中；模型可见的工具输出应放在 `content` 中。

## 提示和模型 hook

新插件请使用按阶段划分的 hook：

- `before_model_resolve`：只接收当前提示和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收当前提示、已准备好的会话消息，以及为该会话排空的任何 exactly-once 队列注入。返回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收当前提示和会话消息。返回 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：只在 Heartbeat 轮次运行，并返回 `prependContext` 或 `appendContext`。它面向需要汇总当前状态、但不改变用户发起轮次的后台监视器。

`before_agent_start` 仍保留用于兼容。优先使用上面的显式 hook，这样你的插件就不会依赖旧版合并阶段。

`before_agent_run` 会在提示构建之后、任何模型输入之前运行，包括提示本地图片加载和 `llm_input` 观察。它接收当前用户输入作为 `prompt`，以及 `messages` 中加载的会话历史和当前活动的系统提示。返回 `{ outcome: "block", reason, message? }` 可在模型读取提示之前停止本次运行。`reason` 是内部字段；`message` 是面向用户的替换文本。唯一支持的 outcome 是 `pass` 和 `block`；不受支持的决策形状会按 fail closed 处理。

当一次运行被阻止时，OpenClaw 只会在 `message.content` 中存储替换文本，以及非敏感的阻止元数据，例如阻止插件 id 和时间戳。原始用户文本不会保留在 transcript 或未来上下文中。内部阻止原因会被视为敏感信息，并从 transcript、历史、广播、日志和诊断载荷中排除。可观测性应使用已清理字段，例如 blocker id、outcome、timestamp 或安全类别。

当 OpenClaw 能识别活动运行时，`before_agent_start` 和 `agent_end` 会包含 `event.runId`。同一个值也可通过 `ctx.runId` 获取。由 cron 驱动的运行还会暴露 `ctx.jobId`（来源 cron job id），以便插件 hook 将指标、副作用或状态限定到特定定时任务。

对于来自渠道的运行，`ctx.channel` 和 `ctx.messageProvider` 会标识提供商表面，例如 `discord` 或 `telegram`，而 `ctx.channelId` 是 OpenClaw 能从会话键或投递元数据推导出来时的会话目标标识符。

当发送者身份可用时，智能体 hook 上下文还会包含：

- `ctx.senderId` — 渠道作用域的发送者 ID（例如 Feishu `open_id`、Discord 用户 ID）。当运行来源于带有已知发送者元数据的用户消息时填充。
- `ctx.chatId` — 传输原生会话标识符（例如 Feishu `chat_id`、Telegram `chat_id`）。当来源渠道提供原生会话 ID 时填充。
- `ctx.channelContext.sender.id` — 与 `ctx.senderId` 相同的发送者 ID，位于渠道拥有的对象下，插件可用渠道特定字段扩展该对象。
- `ctx.channelContext.chat.id` — 与 `ctx.chatId` 相同的会话 ID，位于渠道拥有的对象下，插件可用渠道特定字段扩展该对象。

核心只定义嵌套的 `id` 字段。通过入站辅助工具传递更丰富发送者或聊天元数据的渠道插件，可以从 `openclaw/plugin-sdk/channel-inbound` 增强 `PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`：

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

渠道插件会通过入站 SDK 辅助工具传递这些字段：

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

这些字段是可选的，并且对于系统发起的运行（Heartbeat、cron、exec-event）不存在。

`ctx.senderExternalId` 仍作为旧插件的已弃用源码兼容字段保留。核心不会填充它；新的渠道特定发送者身份应通过模块增强放在 `ctx.channelContext.sender` 下。

`agent_end` 是观察 hook。Gateway 网关和持久化 harness 路径会在轮次之后以 fire-and-forget 方式运行它，而短生命周期的一次性 CLI 路径会在进程清理之前等待 hook promise，以便可信插件刷新终端可观测性或捕获状态。hook runner 会应用 30 秒超时，因此卡住的插件或嵌入端点无法让 hook promise 永远挂起。超时会被记录，OpenClaw 会继续；除非插件也使用自己的中止信号，否则它不会取消插件拥有的网络工作。

对不应接收原始提示、历史、响应、header、请求体或提供商请求 ID 的提供商调用遥测，请使用 `model_call_started` 和 `model_call_ended`。这些 hook 包含稳定元数据，例如 `runId`、`callId`、`provider`、`model`、可选的 `api`/`transport`、终端 `durationMs`/`outcome`，以及当 OpenClaw 能推导出有界提供商 request-id 哈希时的 `upstreamRequestIdHash`。当运行时已解析上下文窗口元数据时，hook 事件和上下文还会包含 `contextTokenBudget`，即应用模型/配置/智能体上限后的有效 token 预算；如果应用了更低上限，还会包含 `contextWindowSource` 和 `contextWindowReferenceTokens`。

`before_agent_finalize` 只在 harness 即将接受自然的最终助手回答时运行。它不是 `/stop` 取消路径，并且不会在用户中止某个轮次时运行。返回 `{ action: "revise", reason }` 可要求 harness 在最终确定之前再进行一次模型 pass，返回 `{ action:
"finalize", reason? }` 可强制最终确定，或省略结果以继续。Codex 原生 `Stop` hook 会作为 OpenClaw `before_agent_finalize` 决策中继到这个 hook。

返回 `action: "revise"` 时，插件可以包含 `retry` 元数据，让额外模型 pass 有界且可安全重放：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 会附加到发送给 harness 的修订原因中。`idempotencyKey` 允许主机跨等价 finalize 决策统计同一个插件请求的重试次数，而 `maxAttempts` 会限制主机在继续使用自然最终答案之前允许的额外 pass 数量。

需要原始会话 hook（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` 或 `before_agent_run`）的非内置插件必须设置：

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

可按插件用 `plugins.entries.<id>.hooks.allowPromptInjection=false` 禁用提示变更 hook 和持久的下一轮注入。

### 会话扩展和下一轮注入

工作流插件可以用 `api.registerSessionExtension(...)` 持久化小型 JSON 兼容会话状态，并通过 Gateway 网关 `sessions.pluginPatch` 方法更新它。会话行会通过 `pluginExtensions` 投射已注册的扩展状态，让 Control UI 和其他客户端无需了解插件内部机制也能渲染插件拥有的状态。

当插件需要让持久上下文准确一次到达下一次模型轮次时，请使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 会在提示 hook 之前排空队列注入，丢弃过期注入，并按每个插件的 `idempotencyKey` 去重。这是审批恢复、策略摘要、后台监视器增量，以及应在下一轮对模型可见、但不应成为永久系统提示文本的命令延续的正确边界。

清理语义是契约的一部分。会话扩展清理和运行时生命周期清理回调会接收 `reset`、`delete`、`disable` 或 `restart`。对于 reset/delete/disable，主机会移除拥有插件的持久会话扩展状态和待处理下一轮注入；restart 会保留持久会话状态，同时清理回调允许插件释放旧运行时世代的 scheduler job、运行上下文和其他带外资源。

## 消息 hook

使用消息 hook 处理渠道级路由和投递策略：

- `message_received`：观察入站内容、发送者、`threadId`、`messageId`、`senderId`、可选的运行/会话关联以及元数据。
- `message_sending`：重写 `content` 或返回 `{ cancel: true }`。
- `reply_payload_sending`：重写规范化的 `ReplyPayload` 对象（包括 `presentation`、`delivery`、媒体 ref 和文本）或返回 `{ cancel: true }`。
- `message_sent`：观察最终成功或失败。

对于仅音频 TTS 回复，即使渠道载荷没有可见文本/说明文字，`content` 也可能包含隐藏的朗读 transcript。重写该 `content` 只会更新 hook 可见的 transcript；它不会渲染为媒体说明文字。

`reply_payload_sending` 事件可能包含 `usageState`，这是尽力而为的实时单轮模型/用量/上下文快照。持久投递、恢复的重放，以及没有精确运行关联的回复会省略它。

消息 hook 上下文会在可用时暴露稳定的关联字段：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。当渠道具备经过可见性过滤的引用消息数据时，入站和 `before_dispatch` 上下文还会暴露回复元数据：`replyToId`、`replyToIdFull`、`replyToBody`、`replyToSender` 和 `replyToIsQuote`。请优先使用这些一等字段，再读取旧版元数据。

优先使用类型化的 `threadId` 和 `replyToId` 字段，再使用渠道特定元数据。

决策规则：

- `message_sending` 带有 `cancel: true` 时是终止性的。
- `message_sending` 带有 `cancel: false` 时会被视为没有决策。
- 重写后的 `content` 会继续传递给较低优先级的钩子，除非后续钩子取消投递。
- `reply_payload_sending` 在 payload 规范化之后、渠道投递之前运行，包括路由回原始渠道的回复。处理器按顺序运行，每个处理器都会看到较高优先级处理器生成的最新 payload。
- `reply_payload_sending` payload 不会暴露运行时信任标记，例如 `trustedLocalMedia`；插件可以编辑 payload 形状，但不能授予本地媒体信任。
- `message_sending` 可以在取消时返回 `cancelReason` 和有界 `metadata`。新的消息生命周期 API 会将其暴露为原因是 `cancelled_by_message_sending_hook` 的被抑制投递结果；旧版直接投递会继续返回空结果数组以保持兼容性。
- `message_sent` 仅用于观察。处理器失败会被记录到日志中，并且不会改变投递结果。

## 安装钩子

使用 `security.installPolicy` 处理由操作者拥有的允许/阻止决策。该策略从 OpenClaw 配置运行，覆盖 CLI 安装和更新路径，并且在启用但不可用时按失败关闭处理。

`before_install` 是插件运行时生命周期钩子。它只会在插件钩子已加载的 OpenClaw 进程中，在 `security.installPolicy` 之后运行，例如由 Gateway 网关支持的安装流程。它适用于插件拥有的观察、警告和兼容性检查，但不是安装的主要企业或主机安全边界。`builtinScan` 字段会保留在事件 payload 中以保持兼容性，但 OpenClaw 不再运行内置的安装时危险代码阻止，因此它是一个空的 `ok` 结果。返回额外发现或 `{ block: true, blockReason }` 可在该进程中停止安装。

`block: true` 是终止性的。`block: false` 会被视为没有决策。处理器失败会按失败关闭方式阻止安装。

## Gateway 网关生命周期

对需要 Gateway 网关拥有的状态的插件服务使用 `gateway_start`。上下文会暴露 `ctx.config`、`ctx.workspaceDir` 和用于 cron 检查与更新的 `ctx.getCron?.()`。使用 `gateway_stop` 清理长期运行的资源。

不要依赖内部 `gateway:startup` 钩子来实现插件拥有的运行时服务。

`cron_changed` 会针对 Gateway 网关拥有的 cron 生命周期事件触发，并带有覆盖 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因的类型化事件 payload。事件会携带一个 `PluginHookGatewayCronJob` 快照（存在时包括 `state.nextRunAtMs`、`state.lastRunStatus` 和 `state.lastError`），以及一个 `PluginHookGatewayCronDeliveryStatus`，其值为 `not-requested` | `delivered` | `not-delivered` | `unknown`。移除事件仍会携带已删除任务的快照，以便外部调度器协调状态。同步外部唤醒调度器时，请使用运行时上下文中的 `ctx.getCron?.()` 和 `ctx.config`，并让 OpenClaw 成为到期检查和执行的事实来源。

## 即将废弃

少数与钩子相邻的表面已废弃但仍受支持。请在下一个主版本发布前迁移：

- **明文渠道信封**，位于 `inbound_claim` 和 `message_received` 处理器中。请读取 `BodyForAgent` 和结构化用户上下文块，而不是解析扁平信封文本。参见 [明文渠道信封 → BodyForAgent](/zh-CN/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 会保留以保持兼容性。新插件应使用 `before_model_resolve` 和 `before_prompt_build`，而不是组合阶段。
- **`subagent_spawning`** 会保留以兼容较旧插件，但新插件不应从中返回线程路由。核心会在 `subagent_spawned` 触发之前，通过渠道会话绑定适配器准备 `thread: true` 子智能体绑定。
- **`deactivate`** 会作为已废弃的清理兼容别名保留到 2026-08-16 之后。新插件应使用 `gateway_stop`。
- **`before_tool_call` 中的 `onResolution`** 现在使用类型化的 `PluginApprovalResolution` 联合类型（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`），而不是自由格式 `string`。

完整列表，包括记忆能力注册、提供商思考配置文件、外部认证提供商、提供商发现类型、任务运行时访问器，以及 `command-auth` → `command-status` 重命名，请参见 [插件 SDK 迁移 → 活跃废弃项](/zh-CN/plugins/sdk-migration#active-deprecations)。

## 相关

- [插件 SDK 迁移](/zh-CN/plugins/sdk-migration) - 活跃废弃项和移除时间线
- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [内部钩子](/zh-CN/automation/hooks)
- [插件架构内部机制](/zh-CN/plugins/architecture-internals)
