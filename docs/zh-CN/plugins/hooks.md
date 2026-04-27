---
read_when:
    - 你正在构建一个插件，需要 `before_tool_call`、`before_agent_reply`、消息钩子或生命周期钩子
    - 你需要从插件中阻止、重写或要求批准工具调用
    - 你正在内部钩子和插件钩子之间做选择
summary: 插件钩子：拦截智能体、工具、消息、会话和 Gateway 网关生命周期事件
title: 插件钩子
x-i18n:
    generated_at: "2026-04-27T22:37:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0aae1c2321491ed0eb82b6306be61cd7e4bffccf8e22d1455267110fdf4fc62b
    source_path: plugins/hooks.md
    workflow: 15
---

插件钩子是 OpenClaw 插件的进程内扩展点。当插件需要检查或更改智能体运行、工具调用、消息流、会话生命周期、子智能体路由、安装流程或 Gateway 网关启动时，请使用它们。

如果你想为命令和 Gateway 网关事件（如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`）使用一个由运维安装的小型 `HOOK.md` 脚本，请改用 [内部钩子](/zh-CN/automation/hooks)。

## 快速开始

在你的插件入口中，使用 `api.on(...)` 注册类型化的插件钩子：

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

钩子处理程序会按 `priority` 降序依次运行。同一优先级的钩子会保留注册顺序。

每个钩子都会接收 `event.context.pluginConfig`，即注册该处理程序的插件的已解析配置。当钩子决策需要当前插件选项时，请使用它；OpenClaw 会按处理程序注入它，而不会修改其他插件看到的共享事件对象。

## 钩子目录

钩子按其扩展的表面分组。**粗体**中的名称接受决策结果（阻止、取消、覆盖或要求批准）；其他所有钩子仅用于观察。

**智能体轮次**

- `before_model_resolve` — 在加载会话消息之前覆盖提供商或模型
- `before_prompt_build` — 在模型调用之前添加动态上下文或系统提示文本
- `before_agent_start` — 仅为兼容性保留的合并阶段；优先使用上面的两个钩子
- **`before_agent_reply`** — 用合成回复或静默短路模型轮次
- **`before_agent_finalize`** — 检查自然生成的最终答案，并请求再进行一次模型传递
- `agent_end` — 观察最终消息、成功状态和运行时长

**对话观察**

- `model_call_started` / `model_call_ended` — 观察已脱敏的提供商/模型调用元数据、计时、结果和有界请求 ID 哈希，不包含提示或响应内容
- `llm_input` — 观察提供商输入（系统提示、提示、历史记录）
- `llm_output` — 观察提供商输出

**工具**

- **`before_tool_call`** — 重写工具参数、阻止执行或要求批准
- `after_tool_call` — 观察工具结果、错误和持续时间
- **`tool_result_persist`** — 重写根据工具结果生成的助手消息
- **`before_message_write`** — 检查或阻止正在进行中的消息写入（较少见）

**消息与投递**

- **`inbound_claim`** — 在智能体路由之前认领入站消息（合成回复）
- `message_received` — 观察入站内容、发送者、线程和元数据
- **`message_sending`** — 重写出站内容或取消投递
- `message_sent` — 观察出站投递成功或失败
- **`before_dispatch`** — 在移交给渠道之前检查或重写出站分发
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

`before_tool_call` 接收：

- `event.toolName`
- `event.params`
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- 上下文字段，如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、
  `ctx.runId`、`ctx.jobId`（在 cron 驱动的运行中设置），以及诊断用的 `ctx.trace`

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

- `block: true` 是终止性决定，会跳过更低优先级的处理程序。
- `block: false` 会被视为无决策。
- `params` 会重写用于执行的工具参数。
- `requireApproval` 会暂停智能体运行，并通过插件批准机制向用户发起请求。`/approve` 命令既可以批准 exec 批准，也可以批准插件批准。
- 即使更高优先级的钩子请求了批准，更低优先级的 `block: true` 仍然可以阻止执行。
- `onResolution` 会接收已解析的批准决定 —— `allow-once`、
  `allow-always`、`deny`、`timeout` 或 `cancelled`。

### 工具结果持久化

工具结果可以包含结构化的 `details`，用于 UI 渲染、诊断、媒体路由或插件自有元数据。请将 `details` 视为运行时元数据，而不是提示内容：

- OpenClaw 会在提供商重放和压缩输入之前去除 `toolResult.details`，以避免元数据成为模型上下文。
- 持久化的会话条目只保留有界的 `details`。过大的 details 会被替换为紧凑摘要，并设置 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 会在最终持久化上限之前运行。钩子仍应保持返回的 `details` 足够小，并避免只将与提示相关的文本放在 `details` 中；把模型可见的工具输出放在 `content` 中。

## 提示和模型钩子

对于新插件，请使用按阶段划分的钩子：

- `before_model_resolve`：只接收当前提示和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `before_prompt_build`：接收当前提示和会话消息。返回 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。

`before_agent_start` 仍为兼容性保留。优先使用上面的显式钩子，这样你的插件就不会依赖旧的合并阶段。

当 OpenClaw 能识别当前活动运行时，`before_agent_start` 和 `agent_end` 会包含 `event.runId`。同样的值也可以从 `ctx.runId` 获取。

由 cron 驱动的运行还会公开 `ctx.jobId`（源 cron 作业 ID），以便插件钩子将指标、副作用或状态限定到特定的定时作业。

如果你需要不接收原始提示、历史记录、响应、标头、请求体或提供商请求 ID 的提供商调用遥测，请使用 `model_call_started` 和 `model_call_ended`。这些钩子包含稳定元数据，例如
`runId`、`callId`、`provider`、`model`、可选的 `api`/`transport`、终态的
`durationMs`/`outcome`，以及当 OpenClaw 能推导时的
`upstreamRequestIdHash`（有界的提供商请求 ID 哈希）。

`before_agent_finalize` 仅在某个 harness 即将接受一个自然生成的最终助手答案时运行。它不是 `/stop` 取消路径，也不会在用户中止某轮时运行。返回 `{ action: "revise", reason }` 可请求 harness 在最终确定前再进行一次模型传递；返回 `{ action:
"finalize", reason? }` 可强制最终确定；也可以省略返回结果以继续。Codex 原生 `Stop` 钩子会作为 OpenClaw 的
`before_agent_finalize` 决策转发到这里。

需要使用 `llm_input`、`llm_output`、
`before_agent_finalize` 或 `agent_end` 的非内置插件，必须设置：

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

可以通过
`plugins.entries.<id>.hooks.allowPromptInjection=false`
按插件禁用会修改提示的钩子。

## 消息钩子

将消息钩子用于渠道级路由和投递策略：

- `message_received`：观察入站内容、发送者、`threadId`、`messageId`、
  `senderId`、可选的运行/会话关联以及元数据。
- `message_sending`：重写 `content` 或返回 `{ cancel: true }`。
- `message_sent`：观察最终成功或失败。

对于仅音频的 TTS 回复，即使渠道负载中没有可见文本/标题，`content` 也可能包含隐藏的语音转录文本。重写该 `content` 只会更新钩子可见的转录文本；它不会作为媒体标题呈现。

消息钩子的上下文在可用时会公开稳定的关联字段：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。优先使用这些一等字段，而不是读取旧版元数据。

优先使用类型化的 `threadId` 和 `replyToId` 字段，而不是使用渠道特定的元数据。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终止性决定。
- 带有 `cancel: false` 的 `message_sending` 会被视为无决策。
- 被重写的 `content` 会继续传递给更低优先级的钩子，除非后续钩子取消投递。

## 安装钩子

`before_install` 会在内置的 Skills 和插件安装扫描之后运行。返回附加发现项，或返回 `{ block: true, blockReason }` 以停止安装。

`block: true` 是终止性决定。`block: false` 会被视为无决策。

## Gateway 网关生命周期

对于需要 Gateway 网关自有状态的插件服务，请使用 `gateway_start`。上下文会公开 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，用于 cron 检查和更新。使用 `gateway_stop` 清理长时间运行的资源。

不要依赖内部的 `gateway:startup` 钩子来运行插件自有的运行时服务。

## 即将弃用的内容

有一些与钩子相邻的表面已弃用，但仍受支持。请在下一个主要版本发布前迁移：

- **`inbound_claim` 和 `message_received` 处理程序中的纯文本渠道封套**。请读取 `BodyForAgent` 和结构化的用户上下文块，而不是解析扁平封套文本。参见
  [纯文本渠道封套 → BodyForAgent](/zh-CN/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 仍为兼容性保留。新插件应使用
  `before_model_resolve` 和 `before_prompt_build`，而不是这个合并阶段。
- **`before_tool_call` 中的 `onResolution`** 现在使用类型化的
  `PluginApprovalResolution` 联合类型（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由格式的 `string`。

完整列表——内存能力注册、提供商 thinking
profile、外部身份验证提供商、提供商发现类型、任务运行时访问器，以及 `command-auth` → `command-status` 重命名——请参见
[插件 SDK 迁移 → 当前弃用项](/zh-CN/plugins/sdk-migration#active-deprecations)。

## 相关内容

- [插件 SDK 迁移](/zh-CN/plugins/sdk-migration) — 当前弃用项和移除时间线
- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [内部钩子](/zh-CN/automation/hooks)
- [插件架构内部机制](/zh-CN/plugins/architecture-internals)
