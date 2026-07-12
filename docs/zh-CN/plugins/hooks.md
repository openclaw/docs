---
read_when:
    - 你正在构建一个需要 `before_tool_call`、`before_agent_reply`、消息钩子或生命周期钩子的插件
    - 你需要阻止、重写插件发出的工具调用，或要求对其进行审批
    - 你正在内部钩子和插件钩子之间做出选择
    - 你正在将 OpenClaw 的 cron 唤醒投射到外部主机调度器中
summary: 插件钩子：拦截智能体、工具、消息、会话和 Gateway 网关生命周期事件
title: 插件钩子
x-i18n:
    generated_at: "2026-07-12T14:37:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e4e94220bca59b710b7b46c87bb889942c88b0d44f723e7133f271d34d9c929
    source_path: plugins/hooks.md
    workflow: 16
---

插件钩子是 OpenClaw 插件的进程内扩展点：可检查或更改智能体运行、工具调用、消息流、会话生命周期、子智能体路由、安装过程或 Gateway 网关启动。

对于由操作员安装的小型 `HOOK.md` 脚本，如果它响应 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup` 等命令和 Gateway 网关事件，请改用[内部钩子](/zh-CN/automation/hooks)。

## 快速开始

在插件入口中使用 `api.on(...)` 注册类型化钩子：

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
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

可以返回决策或修改的处理程序按 `priority` 降序依次运行；优先级相同的处理程序保持注册顺序。仅观察型处理程序并行运行，并且即发即弃的观察分发可能与后续事件重叠。不要使用优先级来安排观察副作用的顺序。

`api.on(name, handler, opts?)` 接受以下选项：

| 选项        | 效果                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `priority`  | 执行顺序；值越高越先运行。                                                                                                                                                                      |
| `timeoutMs` | 每个钩子的等待时限。到期后，OpenClaw 将停止等待该处理程序并继续执行。它不会取消处理程序或其副作用。省略时使用运行器默认的单钩子超时时间。 |

操作员可以设置钩子时限，无需修改插件代码：

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

`hooks.timeouts.<hookName>` 覆盖 `hooks.timeoutMs`，后者又覆盖插件编写的 `api.on(..., { timeoutMs })` 值。每个值都必须是最大为 600000 ms 的正整数。对于已知较慢的钩子，优先使用单钩子覆盖，以免某个插件在所有位置都获得更长的时限。

由于钩子回调不会收到取消信号，已超时的处理程序 Promise 会继续运行。当该插件的工作仍在进行时，钩子分发可以释放其 Gateway 网关准入。拥有长时间运行工作的插件必须自行提供取消和关闭生命周期。

出站修改钩子 `message_sending` 和 `reply_payload_sending` 对每个处理程序采用默认 15 秒时限。如果其中一个超时，OpenClaw 会记录插件错误，并继续使用最新的载荷，以便串行化投递通道完成收尾。对于有意在投递前执行较慢工作的插件，请设置更长的单钩子时限。

使用 `createReplyDispatcher` 的渠道插件也可以通过 `beforeDeliverOptions: { timeoutMs }` 声明更长的正数单阶段时限，或者在使用 `dispatcher.appendBeforeDeliver(handler, { timeoutMs })` 追加工作时声明。如果所有者未声明时限，这些回调将使用相同的默认 15 秒时限，以免挂起的回调持续占用串行化投递通道。

每个钩子都会收到 `event.context.pluginConfig`，即注册该处理程序的插件所对应的已解析配置。OpenClaw 会为每个处理程序单独注入该配置，而不会修改其他插件看到的共享事件对象。

## 钩子目录

钩子按其扩展的功能面分组。**粗体**名称接受决策结果（阻止、取消、覆盖或要求审批）；其余钩子仅用于观察。

**智能体轮次**

| 钩子                            | 用途                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `before_model_resolve`          | 在加载会话消息前覆盖提供商或模型                                  |
| `agent_turn_prepare`            | 使用已排队的插件轮次注入，并在提示词钩子运行前添加同轮次上下文      |
| `before_prompt_build`           | 在模型调用前添加动态上下文或系统提示词文本                          |
| `before_agent_start`            | 仅用于兼容性的组合阶段；优先使用上面的两个钩子                            |
| **`before_agent_run`**          | 在提交模型前检查最终提示词和会话消息；可以阻止运行 |
| **`before_agent_reply`**        | 使用合成回复或静默直接结束模型轮次                           |
| **`before_agent_finalize`**     | 检查自然生成的最终答案，并请求再执行一次模型处理                         |
| `agent_end`                     | 观察最终消息、成功状态和运行时长                                  |
| `heartbeat_prompt_contribution` | 为后台监控和生命周期插件添加仅用于 Heartbeat 的上下文                  |

**对话观察**

| 钩子                                      | 用途                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `model_call_started` / `model_call_ended` | 经过净化的提供商/模型调用元数据：时间、结果、有界的请求 ID 哈希。不包含提示词或响应内容。 |
| `llm_input`                               | 提供商输入：系统提示词、提示词、历史记录                                                                     |
| `llm_output`                              | 提供商输出、用量以及可用时解析出的 `contextTokenBudget`                                       |

**工具**

| 钩子                       | 用途                                                   |
| -------------------------- | --------------------------------------------------------- |
| **`before_tool_call`**     | 重写工具参数、阻止执行或要求审批 |
| `after_tool_call`          | 观察工具结果、错误和耗时                |
| `resolve_exec_env`         | 向 `exec` 提供插件自有的环境变量   |
| **`tool_result_persist`**  | 重写根据工具结果生成的助手消息 |
| **`before_message_write`** | 检查或阻止正在进行的消息写入（少见）      |

**消息和投递**

| 钩子                            | 用途                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| **`inbound_claim`**             | 在智能体路由前接管入站消息（合成回复） |
| **`channel_pairing_requested`** | 观察新创建的私信配对请求                         |
| `message_received`              | 观察入站内容、发送者、话题串和元数据             |
| **`message_sending`**           | 重写出站内容或取消投递                       |
| **`reply_payload_sending`**     | 在投递前修改或取消规范化的回复载荷        |
| `message_sent`                  | 观察出站投递成功或失败                      |
| **`before_dispatch`**           | 在移交给渠道前检查或重写出站分发    |
| **`reply_dispatch`**            | 参与最终的回复分发流水线                  |

**会话和压缩**

| 钩子                                     | 用途                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_start` / `session_end`          | 跟踪会话生命周期边界。`reason` 是 `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart` 或 `unknown` 之一。当进程在存在活跃会话的情况下停止或重启时，Gateway 网关关闭终结器会触发 `shutdown`/`restart`，以便插件（记忆、对话记录存储）可以完成幽灵记录，而不是让它们在重启后仍保持打开状态。终结器有时限，因此缓慢的插件无法阻止 SIGTERM/SIGINT。 |
| `before_compaction` / `after_compaction` | 观察压缩周期或为其添加注释                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `before_reset`                           | 观察会话重置事件（`/reset`、程序化重置）                                                                                                                                                                                                                                                                                                                                                                                                     |

**子智能体**

- `subagent_spawned` / `subagent_ended` - 观察子智能体启动和完成。
- `subagent_delivery_target` - 当没有核心会话绑定能够推导路由时，用于完成结果投递的兼容性钩子。
- `subagent_spawning` - 已弃用的兼容性钩子。现在，核心会在 `subagent_spawned` 触发前，通过渠道会话绑定适配器准备 `thread: true` 子智能体绑定。
- 当 OpenClaw 在启动前已解析子会话的原生模型时，`subagent_spawned` 会包含 `resolvedModel` 和 `resolvedProvider`。
- `subagent_ended` 携带 `targetSessionKey`（标识，与 `subagent_spawned.childSessionKey` 匹配）、`targetKind`（`"subagent"` 或 `"acp"`）、`reason`、可选的 `outcome`（`"ok"`、`"error"`、`"timeout"`、`"killed"`、`"reset"` 或 `"deleted"`）、可选的 `error`、`runId`、`endedAt`、`accountId` 和 `sendFarewell`。它**不**包含 `agentId` 或 `childSessionKey`；请使用 `targetSessionKey` 与匹配的 `subagent_spawned` 事件建立关联。

**生命周期**

| Hook                             | 用途                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `gateway_start` / `gateway_stop` | 随 Gateway 网关启动或停止插件拥有的服务                                                 |
| `deactivate`                     | `gateway_stop` 的已弃用兼容性别名；新插件请使用 `gateway_stop`                 |
| `cron_reconciled`                | 启动或重新加载后，根据完整的 Gateway 网关 cron 状态进行协调                            |
| `cron_changed`                   | 观察 Gateway 网关拥有的 cron 生命周期变化（已添加、已更新、已移除、已启动、已完成、已调度） |
| **`before_install`**             | 从已加载的插件运行时检查暂存的 Skills 或插件安装材料                         |

### 渠道配对请求

当未配对的私信发送者创建待处理的配对请求后，插件需要通知操作员或
写入审计记录时，请使用 `channel_pairing_requested`。该钩子会在请求创建时分派；
配对回复的渠道投递不会因缓慢或失败的钩子处理程序而延迟。

```typescript
api.on("channel_pairing_requested", async (event) => {
  await notifyOperator({
    text: `来自 ${event.senderId} 的新 ${event.channel} 配对请求：${event.code}`,
  });
});
```

该钩子仅用于观察。它不会批准、拒绝、抑制或重写配对回复。
载荷包含渠道、可选的 `accountId`、渠道范围内的 `senderId`、配对
`code` 和渠道元数据。请将配对码视为有效的单次使用批准凭据，并且仅将其
投递到可信的操作员接收端。请将 `metadata` 视为由不可信发送者提供的身份
文本。该钩子不包含入站消息正文或媒体。

## 调试运行时钩子

使用 `before_model_resolve` 为智能体轮次切换提供商或模型——它在
模型解析之前运行。`llm_output` 仅在一次模型尝试生成助手输出后运行。

要验证会话实际使用的模型，请检查运行时注册信息，然后使用
`openclaw sessions` 或 Gateway 网关会话/状态界面。要调试提供商载荷，请使用
`--raw-stream` 和 `--raw-stream-path <path>` 启动 Gateway 网关，将原始模型流事件
写入 jsonl 文件。

## 工具调用策略

`before_tool_call` 接收：

- `event.toolName`
- `event.params`
- 可选的 `event.toolKind` 和 `event.toolInputKind`，它们是主机权威的
  判别字段，用于有意共享名称的工具；例如，外层代码模式的 `exec` 调用使用
  `toolKind: "code_mode_exec"`，并在输入语言已知时包含
  `toolInputKind: "javascript" | "typescript"`
- 可选的 `event.derivedPaths`，即主机尽力推导的目标路径提示，
  适用于 `apply_patch` 等已知工具封装；这些路径可能不完整，或可能
  过度估计工具实际会触及的内容（例如输入格式错误或不完整时）
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、
  `ctx.runId`、`ctx.toolKind`、`ctx.toolInputKind` 等上下文字段，以及用于诊断的 `ctx.trace`

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
    /** @deprecated 未解决的审批始终拒绝。 */
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

类型化生命周期钩子的防护行为：

- `block: true` 是终止性决定，会跳过优先级更低的处理程序。
- `block: false` 视为未作决定。
- `params` 会重写用于执行的工具参数。
- `requireApproval` 会暂停智能体运行，并通过插件审批询问用户。
  `/approve` 可以批准 Exec 审批和插件审批。在 Codex app-server 报告模式的原生
  `PreToolUse` 中继中，此操作会交由匹配的 app-server 审批请求处理；请参阅
  [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#hook-boundaries)。
- 即使优先级更高的钩子已请求审批，优先级更低的 `block: true` 仍可阻止执行。
- `onResolution` 接收最终决定：`allow-once`、`allow-always`、
  `deny`、`timeout` 或 `cancelled`。

有关审批路由、决定行为以及何时应使用 `requireApproval` 而非
可选工具或 Exec 审批，请参阅[插件权限请求](/zh-CN/plugins/plugin-permission-requests)。

需要主机级策略的插件可以使用 `api.registerTrustedToolPolicy(...)`
注册可信工具策略。这些策略在普通 `before_tool_call` 钩子以及常规钩子决定之前运行。
内置可信策略最先运行；已安装插件的可信策略随后按插件加载顺序运行；
普通 `before_tool_call` 钩子最后运行。内置插件继续使用现有的可信策略路径。
已安装插件必须显式启用，并在 `contracts.trustedToolPolicies` 中声明每个策略 ID；
未声明的 ID 会在注册前被拒绝。策略 ID 的作用域限定在注册该策略的插件内，
因此不同插件可以复用同一本地 ID。仅将此层级用于主机信任的门控，
例如工作区策略、预算强制执行或保留工作流安全性。

### Exec 环境钩子

`resolve_exec_env` 允许插件在命令运行前向 `exec`
工具调用提供环境变量。它接收：

- `event.sessionKey`
- `event.toolName`，当前始终为 `"exec"`
- `event.host`，取值为 `"gateway"`、`"sandbox"` 或 `"node"` 之一
- `ctx.agentId`、`ctx.sessionKey`、
  `ctx.messageProvider` 和 `ctx.channelId` 等上下文字段

返回 `Record<string, string>`，以合并到 Exec 环境中。处理程序按优先级顺序运行；
对于同一键，后面的结果会覆盖前面的结果。

钩子输出在合并前会根据主机 Exec 环境键策略进行过滤。
`PATH` 始终会被丢弃（命令解析和安全二进制检查依赖它）。
无效键和危险的主机覆盖键会被丢弃，例如 `LD_*`、
`DYLD_*`、`NODE_OPTIONS`、代理变量（`HTTP_PROXY`、`HTTPS_PROXY`、
`ALL_PROXY`、`NO_PROXY`）以及 TLS 覆盖变量（`NODE_TLS_REJECT_UNAUTHORIZED`、
`SSL_CERT_FILE` 等）。过滤后的插件环境会包含在
Gateway 网关审批/审计元数据中，并转发到节点主机执行请求。

### 工具结果持久化

工具结果可包含结构化的 `details`，用于 UI 渲染、诊断、
媒体路由或插件拥有的元数据。请将 `details` 视为运行时元数据，
而不是提示词内容：

- OpenClaw 会在提供商重放和压缩输入前移除 `toolResult.details`，
  以免元数据成为模型上下文。
- 持久化的会话条目仅保留有界的 `details`。过大的详情会被
  紧凑摘要替代，并设置 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 在最终
  持久化上限应用前运行。返回的 `details` 应保持精简，并避免仅在
  `details` 中放置与提示词相关的文本；模型可见的工具输出应放在
  `content` 中。

## 提示词和模型钩子

新插件请使用特定阶段的钩子：

- `before_model_resolve`：仅接收当前提示词和附件
  元数据。返回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收当前提示词、准备好的会话
  消息，以及为此会话排空的所有恰好一次排队注入。返回
  `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收当前提示词和会话消息。
  返回 `prependContext`、`appendContext`、`systemPrompt`、
  `prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：仅在 Heartbeat 轮次运行，并返回
  `prependContext` 或 `appendContext`。用于需要汇总当前状态、
  但不应改变用户发起轮次的后台监控器。

`before_agent_start` 继续保留以提供兼容性。优先使用上述明确的钩子，
使插件不依赖旧版的合并阶段。

`before_agent_run` 在提示词构建完成后、任何模型输入之前运行，
包括提示词局部图像加载和 `llm_input` 观察。它接收当前用户输入作为
`prompt`，并接收 `messages` 中已加载的会话历史记录和当前系统提示词。
返回 `{ outcome: "block", reason, message? }` 可在模型读取提示词之前停止运行。
`reason` 供内部使用；`message` 是面向用户的替代文本。仅支持 `pass` 和 `block`
结果；不支持的决定结构会以关闭方式失败。

当运行被阻止时，OpenClaw 仅在 `message.content` 中存储替代文本，
以及阻止操作的插件 ID 和时间戳等非敏感阻止元数据。原始用户文本不会
保留在转录记录或未来上下文中。内部阻止原因被视为敏感信息，并从
转录记录、历史记录、广播、日志和诊断载荷中排除。可观测性应使用
经过清理的字段，例如阻止者 ID、结果、时间戳或安全类别。

当 OpenClaw 能够识别当前运行时，`before_agent_start` 和 `agent_end`
会包含 `event.runId`；相同值也位于 `ctx.runId`。由 cron 驱动的运行还会在
智能体轮次上下文中公开 `ctx.jobId`（发起运行的 cron 作业 ID），使钩子能够
将指标、副作用或状态限定到特定定时作业。`ctx.jobId` 不属于
`before_tool_call` 工具上下文。

对于源自渠道的运行，`ctx.channel` 和 `ctx.messageProvider` 标识
提供商界面，例如 `discord` 或 `telegram`；当 OpenClaw 能够从
会话键或投递元数据中推导时，`ctx.channelId` 是对话目标标识符。

当发送者身份可用时，智能体钩子上下文还包括：

- `ctx.senderId`——渠道范围内的发送者 ID（例如 Feishu `open_id`、Discord
  用户 ID）。当运行源自具有已知发送者元数据的用户消息时填充。
- `ctx.chatId`——传输层原生的对话标识符（例如 Feishu
  `chat_id`、Telegram `chat_id`）。当发起运行的渠道
  提供原生对话 ID 时填充。
- `ctx.channelContext.sender.id`——与 `ctx.senderId` 相同的发送者 ID，位于
  渠道拥有的对象下，插件可以使用渠道特定字段扩展该对象。
- `ctx.channelContext.chat.id`——与 `ctx.chatId` 相同的对话 ID，
  位于渠道拥有的对象下，插件可以使用渠道特定字段扩展该对象。

核心仅定义嵌套的 `id` 字段。通过入站辅助函数传递更丰富
发送者或聊天元数据的渠道插件，可以扩充
`openclaw/plugin-sdk/channel-inbound` 中的
`PluginHookChannelSenderContext` 或 `PluginHookChannelChatContext`：

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

渠道插件通过入站 SDK 辅助函数传递这些字段：

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

这些字段是可选的，对于源自系统的运行（Heartbeat、
cron、Exec 事件）不存在。

`ctx.senderExternalId` 继续作为旧插件的已弃用源码兼容性字段。
核心不会填充它；新的渠道特定发送者身份应通过模块扩充，
存放在 `ctx.channelContext.sender` 下。

`agent_end` 是一个观察钩子。Gateway 网关和持久化 harness 路径会在轮次结束后以即发即弃方式运行它，而短生命周期的一次性 CLI 路径会在进程清理前等待钩子 Promise 完成，以便受信任的插件刷新终端可观测性数据或捕获状态。钩子运行器采用 30 秒超时，因此卡死的插件或嵌入端点无法让钩子 Promise 永远保持待处理状态。超时会被记录到日志中，OpenClaw 将继续运行；除非插件也使用自己的中止信号，否则它不会取消插件所有的网络工作。

对于不应接收原始提示词、历史记录、响应、标头、请求正文或提供商请求 ID 的提供商调用遥测，请使用 `model_call_started` 和 `model_call_ended`。这些钩子包含稳定的元数据，例如 `runId`、`callId`、`provider`、`model`、可选的 `api`/`transport`、终态 `durationMs`/`outcome`，以及 OpenClaw 能够派生有界提供商请求 ID 哈希时的 `upstreamRequestIdHash`。当运行时已解析上下文窗口元数据时，钩子事件和上下文还会包含 `contextTokenBudget`，即应用模型/配置/智能体上限后的有效 token 预算；应用较低上限时，还会包含 `contextWindowSource` 和 `contextWindowReferenceTokens`。

`before_agent_finalize` 仅在 harness 即将接受自然生成的最终助手回答时运行。它不是 `/stop` 取消路径，并且不会在用户中止轮次时运行。返回 `{ action: "revise", reason }` 可要求 harness 在最终定稿前再执行一次模型处理，返回 `{ action:
"finalize", reason? }` 可强制最终定稿，也可以省略结果以继续。处理程序的默认时间预算为 15s；超时后，OpenClaw 会记录失败并继续使用原始最终回答。
Codex 原生 `Stop` 钩子会作为 OpenClaw 的 `before_agent_finalize` 决策中继到此钩子。

返回 `action: "revise"` 时，插件可以包含 `retry` 元数据，使额外的模型处理有界且可安全重放：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 会附加到发送给 harness 的修订原因中。`idempotencyKey` 允许主机跨等价的最终定稿决策统计同一插件请求的重试次数，而 `maxAttempts` 会限制主机在继续使用自然生成的最终回答前所允许的额外处理次数。

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

可以使用 `plugins.entries.<id>.hooks.allowPromptInjection=false` 按插件禁用修改提示词的钩子和持久化的下一轮注入。

### 会话扩展和下一轮注入

工作流插件可以使用 `api.session.state.registerSessionExtension(...)` 持久化少量与 JSON 兼容的会话状态，并通过 Gateway 网关的 `sessions.pluginPatch` 方法更新该状态。会话行通过 `pluginExtensions` 投影已注册的扩展状态，使 Control UI 和其他客户端无需了解插件内部机制即可呈现插件所有的状态。`api.registerSessionExtension(...)` 仍然有效，但已弃用，建议改用 `api.session.state` 命名空间。

当插件需要将持久化上下文恰好一次地传递到下一次模型轮次时，请使用 `api.session.workflow.enqueueNextTurnInjection(...)`（顶层的 `api.enqueueNextTurnInjection(...)` 是具有相同行为的已弃用别名）。OpenClaw 会在提示词钩子之前取出排队的注入、丢弃已过期的注入，并按插件使用 `idempotencyKey` 去重。对于需要在下一轮对模型可见、但不应成为永久系统提示词文本的审批恢复、策略摘要、后台监控增量和命令延续，这是正确的衔接点。

清理语义是契约的一部分。会话扩展清理和运行时生命周期清理回调会接收 `reset`、`delete`、`disable` 或 `restart`。对于 reset/delete/disable，主机会移除所属插件的持久化会话扩展状态和待处理的下一轮注入；restart 会保留持久化会话状态，同时清理回调允许插件释放旧运行时世代的调度器任务、运行上下文和其他带外资源。

## 消息钩子

使用消息钩子处理渠道级路由和投递策略：

- `message_received`：观察入站内容、发送者、`threadId`、`messageId`、`senderId`、可选的运行/会话关联信息和元数据。
- `message_sending`：重写 `content` 或返回 `{ cancel: true }`。
- `reply_payload_sending`：重写规范化的 `ReplyPayload` 对象（包括 `presentation`、`delivery`、媒体引用和文本），或返回 `{ cancel: true }`。
- `message_sent`：观察最终成功或失败。

对于仅含音频的 TTS 回复，即使渠道载荷没有可见文本/字幕，`content` 也可能包含隐藏的口述转录文本。重写该 `content` 只会更新钩子可见的转录文本；它不会呈现为媒体字幕。

`reply_payload_sending` 事件可能包含 `usageState`，这是尽力提供的实时单轮模型/用量/上下文快照。持久化投递、恢复后的重放以及没有精确运行关联信息的回复会省略它。

消息钩子上下文会在可用时公开稳定的关联字段：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。入站和
`before_dispatch` 上下文还会在渠道具有经过可见性过滤的引用消息数据时公开回复元数据：
`replyToId`、`replyToIdFull`、`replyToBody`、`replyToSender` 和
`replyToIsQuote`。读取旧版元数据之前，优先使用这些一等字段。

使用渠道特定元数据之前，优先使用类型化的 `threadId` 和 `replyToId` 字段。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终止性决策。
- 带有 `cancel: false` 的 `message_sending` 视为未作决策。
- 重写后的 `content` 会继续传递给优先级较低的钩子，除非后续钩子取消投递。
- `reply_payload_sending` 在有效载荷规范化之后、渠道投递之前运行，包括路由回原始渠道的回复。
  处理程序按顺序运行，每个处理程序都会看到优先级更高的处理程序所生成的最新有效载荷。
- `reply_payload_sending` 有效载荷不会公开 `trustedLocalMedia` 等运行时信任标记；
  插件可以编辑有效载荷结构，但不能授予本地媒体信任。
- `message_sending` 可以随取消操作返回 `cancelReason` 和有界的 `metadata`。
  新的消息生命周期 API 会将其公开为原因是
  `cancelled_by_message_sending_hook` 的已抑制投递结果；为保持兼容性，旧版直接投递仍返回空结果数组。
- `message_sent` 仅用于观察。处理程序失败会被记录到日志中，并且不会改变投递结果。

## 安装钩子

使用 `security.installPolicy` 处理由操作员控制的允许/阻止决策。该策略从 OpenClaw 配置运行，
覆盖 CLI 安装和更新路径，并且在启用但不可用时采用故障关闭方式。

`before_install` 是插件运行时生命周期钩子。它仅在插件钩子已经加载的 OpenClaw 进程中，
例如由 Gateway 网关支持的安装流程里，才会在 `security.installPolicy` 之后运行。
它适用于插件自身的观察、警告和兼容性检查，但不是安装的主要企业或主机安全边界。
为保持兼容性，事件有效载荷中仍保留 `builtinScan` 字段，但 OpenClaw 不再运行内置的安装时危险代码阻止，
因此该字段是一个空的 `ok` 结果。返回其他发现项或
`{ block: true, blockReason }` 可在该进程中停止安装。

`block: true` 是终止性决策。`block: false` 视为未作决策。处理程序失败会以故障关闭方式阻止安装。

## Gateway 网关生命周期

使用 `gateway_start` 启动通用插件服务，并使用 `gateway_stop` 清理长期运行的资源。
当 `gateway_start` 运行时，cron 调度器可能仍在加载，因此不要将其用作外部 cron 投影的基线信号。

不要依赖内部 `gateway:startup` 钩子来运行插件自身的运行时服务。

`cron_reconciled` 会在 Gateway 网关 cron 调度器及其退出时监视器完成持久状态协调后触发。
它在初始启动和配置重新加载期间替换调度器时都会触发。事件会报告 `reason`
（`startup` 或 `reload`）和实际生效的 `enabled` 状态。禁用的 cron 仍会以
`enabled: false` 触发，从而允许外部投影清除过期的唤醒项。使用 `ctx.getCron?.()`
获取完成协调的确切调度器实例；后续重新加载不会将该回调重新指向其他实例。
`ctx.abortSignal` 属于同一个调度器快照。一旦更新的调度器就绪或开始关闭，
Gateway 网关就会将其中止。将它传递给每个持久化副作用，并且在快照中止后不要接受该快照。
这是调度器生命周期信号，而不是插件激活信号：仅插件热重载不会重放该信号。
新启用的使用方会在下一次调度器替换或 Gateway 网关启动时收到第一个基线。

与其他观察钩子一样，`gateway_start` 和 `cron_reconciled` 回调可能重叠。
如果两个处理程序共享插件初始化，请使用插件本地的就绪 Promise 进行协调，而不要依赖回调顺序。

`cron_changed` 会针对 Gateway 网关拥有的 cron 生命周期事件触发，其类型化事件有效载荷涵盖
`added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因。
事件携带一个 `PluginHookGatewayCronJob` 快照（包括存在时的
`state.nextRunAtMs`、`state.lastRunStatus` 和 `state.lastError`），以及值为
`not-requested` | `delivered` | `not-delivered` | `unknown` 的
`PluginHookGatewayCronDeliveryStatus`。移除事件在提交后触发：它们仅在持久删除成功后触发，
并且仍携带已删除的任务快照，以便外部调度器协调状态。

`scheduled` 事件在提交后触发：它仅在成功的持久写入更改现有任务的实际
`nextRunAtMs` 后触发，并排除该任务显式的 `added`、`updated` 或 `removed` 生命周期事件。
顶层的 `event.nextRunAtMs` 是已提交的下一次唤醒时间；如果该字段不存在，则任务没有下一次唤醒。
应将这些事件视为协调提示，而不是有序的增量日志。将它们用作可合并的提示，以重新读取
`cron_reconciled` 最后捕获的调度器；不要采用 `cron_changed` 上下文中的调度器。
保持由 OpenClaw 作为到期检查和执行的事实来源。

### 安全的外部 cron 投影

应投影完整的唤醒快照，而不是转发 cron 事件增量。外部适配器的 `replaceAll` 操作必须是原子且幂等的，
并且必须仅在主机持久接受快照后才完成。它还必须遵循提供的中止信号：如果信号在持久接受前中止，
适配器不得接受该快照。

此模式只允许一个最新状态工作进程处于运行状态。只有 `cron_reconciled` 会采用调度器实例；
`cron_changed` 只会要求该工作进程重新读取权威实例，因此延迟到达的提示无法恢复较旧的调度器。
更新的修订会中止正在进行的主机尝试，使其无法接受过期快照。

```typescript
import { setTimeout as sleep } from "node:timers/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";

type ExternalWake = { jobId: string; runAtMs: number };

type ExternalWakeHost = {
  replaceAll(wakes: readonly ExternalWake[], options: { signal: AbortSignal }): Promise<void>;
  close(): Promise<void>;
};

type CronReader = {
  list(options: { includeDisabled: true }): Promise<
    Array<{
      id: string;
      enabled?: boolean;
      state?: { nextRunAtMs?: number };
    }>
  >;
};

export function registerCronProjection(api: OpenClawPluginApi, host: ExternalWakeHost) {
  const lifecycle = new AbortController();
  let cron: CronReader | undefined;
  let enabled = false;
  let hasBaseline = false;
  let reconciliationSignal: AbortSignal | undefined;
  let requestedRevision = 0;
  let appliedRevision = 0;
  let worker = Promise.resolve();
  let activeAttempt: AbortController | undefined;

  const projectLatest = async () => {
    let retryMs = 1_000;

    while (!lifecycle.signal.aborted && appliedRevision < requestedRevision) {
      const ownerSignal = reconciliationSignal;
      if (!ownerSignal || ownerSignal.aborted) {
        return;
      }
      const targetRevision = requestedRevision;
      const attempt = new AbortController();
      const signal = AbortSignal.any([lifecycle.signal, ownerSignal, attempt.signal]);
      activeAttempt = attempt;

      try {
        const jobs = enabled && cron ? await cron.list({ includeDisabled: true }) : [];
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        const wakes = jobs
          .flatMap((job): ExternalWake[] => {
            const runAtMs = job.enabled === false ? undefined : job.state?.nextRunAtMs;
            return runAtMs === undefined ? [] : [{ jobId: job.id, runAtMs }];
          })
          .sort((a, b) => a.runAtMs - b.runAtMs || a.jobId.localeCompare(b.jobId));

        await host.replaceAll(wakes, { signal });
        if (signal.aborted || targetRevision !== requestedRevision) {
          continue;
        }
        appliedRevision = targetRevision;
        retryMs = 1_000;
      } catch {
        if (lifecycle.signal.aborted || ownerSignal.aborted) {
          return;
        }
        if (attempt.signal.aborted) {
          continue;
        }
        api.logger.warn(`external cron projection failed; retrying in ${retryMs}ms`);
        try {
          await sleep(retryMs, undefined, { signal });
        } catch {
          if (lifecycle.signal.aborted) {
            return;
          }
          if (attempt.signal.aborted) {
            continue;
          }
        }
        retryMs = Math.min(retryMs * 2, 30_000);
      } finally {
        if (activeAttempt === attempt) {
          activeAttempt = undefined;
        }
      }
    }
  };

  const requestProjection = () => {
    const targetRevision = ++requestedRevision;
    activeAttempt?.abort();
    worker = worker.then(async () => {
      if (!lifecycle.signal.aborted && appliedRevision < targetRevision) {
        await projectLatest();
      }
    });
    return worker;
  };

  api.on("cron_reconciled", (event, ctx) => {
    const reconciledCron = ctx.getCron?.();
    if (event.enabled && !reconciledCron) {
      api.logger.warn("cron reconciliation did not expose a scheduler");
      return;
    }
    cron = reconciledCron;
    enabled = event.enabled;
    hasBaseline = true;
    reconciliationSignal = ctx.abortSignal;
    return requestProjection();
  });

  api.on("cron_changed", () => {
    if (hasBaseline) {
      return requestProjection();
    }
  });

  api.on("gateway_stop", async () => {
    lifecycle.abort();
    await worker;
    await host.close();
  });
}
```

当 `cron_reconciled` 报告 `enabled: false` 时，同一路径会调用
`replaceAll([])` 并清除过期的外部唤醒任务。本示例中的重试/退避机制
仅限当前进程，并将运行时适配器故障视为暂时性故障；请在注册前验证
不可重试的配置。OpenClaw 不为插件钩子的作用提供发件箱。如果进程在
持久接受前退出，Gateway 网关下次启动时会发出新的权威
`cron_reconciled` 快照。`gateway_stop` 会中止正在进行的主机工作，
等待工作器结束，然后关闭适配器。

## 即将弃用的功能

一些与钩子相关的接口已弃用，但仍受支持。请在下一个主版本发布前
完成迁移：

- `inbound_claim` 和 `message_received` 处理程序中的**纯文本渠道信封**。
  请读取 `BodyForAgent` 和结构化用户上下文块，而不是解析扁平的信封文本。请参阅
  [纯文本渠道信封 → BodyForAgent](/zh-CN/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 仍为兼容性保留。新插件应使用
  `before_model_resolve` 和 `before_prompt_build`，而不是合并的
  阶段。
- **`subagent_spawning`** 仍为兼容旧插件而保留，但
  新插件不应通过它返回线程路由。核心会在触发
  `subagent_spawned` 前，通过渠道会话绑定适配器准备
  `thread: true` 子智能体绑定。
- **`deactivate`** 将作为已弃用的清理兼容别名保留至
  2026-08-16 之后。新插件应使用 `gateway_stop`。
- **`before_tool_call` 中的 `onResolution`** 现在使用带类型的
  `PluginApprovalResolution` 联合类型（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由格式的 `string`。
- **`api.registerSessionExtension` / `api.enqueueNextTurnInjection`** 仍
  作为顶层兼容别名保留。新插件应使用
  `api.session.state.registerSessionExtension(...)` 和
  `api.session.workflow.enqueueNextTurnInjection(...)`。

完整列表（包括记忆能力注册、提供商思考配置文件、外部身份验证提供商、
提供商发现类型、任务运行时访问器，以及 `command-auth` → `command-status`
重命名）请参阅
[插件 SDK 迁移 → 当前弃用项](/zh-CN/plugins/sdk-migration#active-deprecations)。

## 相关内容

- [插件 SDK 迁移](/zh-CN/plugins/sdk-migration) - 当前弃用项和移除时间线
- [Building Plugins](/zh-CN/plugins/building-plugins)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [内部钩子](/zh-CN/automation/hooks)
- [插件架构内部机制](/zh-CN/plugins/architecture-internals)
