---
read_when:
    - 你正在构建一个插件，需要 `before_tool_call`、`before_agent_reply`、消息钩子或生命周期钩子
    - 你需要从插件中阻止、重写或要求批准工具调用
    - 你正在在内部钩子和插件钩子之间做选择
summary: 插件钩子：拦截智能体、工具、消息、会话以及 Gateway 网关 生命周期事件
title: 插件钩子
x-i18n:
    generated_at: "2026-04-25T18:12:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fa7554227cbb5d283e74c16d7e12ef524c494b8bb117a7ff4b37b49daa18af
    source_path: plugins/hooks.md
    workflow: 15
---

插件钩子是 OpenClaw 插件的进程内扩展点。当插件需要检查或更改智能体运行、工具调用、消息流、会话生命周期、子智能体路由、安装过程或 Gateway 网关 启动时，请使用它们。

如果你想要的是一个由操作员安装的小型 `HOOK.md` 脚本，用于处理命令和 Gateway 网关 事件，例如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`，则请改用 [内部钩子](/zh-CN/automation/hooks)。

## 快速开始

在你的插件入口中使用 `api.on(...)` 注册类型化的插件钩子：

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

## 钩子目录

钩子按其扩展的表面进行分组。**加粗** 的名称接受决策结果（阻止、取消、覆盖或要求批准）；其余全部仅用于观察。

**智能体轮次**

- `before_model_resolve` — 在加载会话消息之前覆盖提供商或模型
- `before_prompt_build` — 在模型调用前添加动态上下文或系统提示文本
- `before_agent_start` — 仅用于兼容性的组合阶段；优先使用上面两个钩子
- **`before_agent_reply`** — 使用合成回复或静默来短路模型轮次
- `agent_end` — 观察最终消息、成功状态和运行时长

**对话观察**

- `model_call_started` / `model_call_ended` — 观察已脱敏的提供商/模型调用元数据、耗时、结果以及受限的请求 ID 哈希，不包含提示词或响应内容
- `llm_input` — 观察提供商输入（系统提示、提示、历史记录）
- `llm_output` — 观察提供商输出

**工具**

- **`before_tool_call`** — 重写工具参数、阻止执行或要求批准
- `after_tool_call` — 观察工具结果、错误和耗时
- **`tool_result_persist`** — 重写根据工具结果生成的助手消息
- **`before_message_write`** — 检查或阻止进行中的消息写入（较少见）

**消息与投递**

- **`inbound_claim`** — 在智能体路由之前认领传入消息（合成回复）
- `message_received` — 观察传入内容、发送者、线程和元数据
- **`message_sending`** — 重写传出内容或取消投递
- `message_sent` — 观察传出投递成功或失败
- **`before_dispatch`** — 在交给渠道前检查或重写传出分发
- **`reply_dispatch`** — 参与最终回复分发流水线

**会话与压缩**

- `session_start` / `session_end` — 跟踪会话生命周期边界
- `before_compaction` / `after_compaction` — 观察或注释压缩周期
- `before_reset` — 观察会话重置事件（`/reset`、程序化重置）

**子智能体**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 协调子智能体路由和完成结果投递

**生命周期**

- `gateway_start` / `gateway_stop` — 随 Gateway 网关 启动或停止由插件拥有的服务
- **`before_install`** — 检查 Skills 或插件安装扫描，并可选择阻止

## 工具调用策略

`before_tool_call` 会接收：

- `event.toolName`
- `event.params`
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`，以及诊断字段 `ctx.trace`

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

- `block: true` 是终止性决策，并会跳过更低优先级的处理器。
- `block: false` 会被视为未做决定。
- `params` 会重写执行时使用的工具参数。
- `requireApproval` 会暂停智能体运行，并通过插件批准机制向用户发起请求。`/approve` 命令既可批准 exec 批准，也可批准插件批准。
- 即使更高优先级的钩子请求了批准，更低优先级的 `block: true` 仍然可以阻止调用。
- `onResolution` 会接收最终的批准决策 — `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

## 提示与模型钩子

对于新插件，请使用分阶段钩子：

- `before_model_resolve`：仅接收当前提示和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `before_prompt_build`：接收当前提示和会话消息。返回 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。

`before_agent_start` 仍保留用于兼容性。优先使用上面的显式钩子，这样你的插件就不会依赖旧的组合阶段。

当 OpenClaw 能识别当前活动运行时，`before_agent_start` 和 `agent_end` 会包含 `event.runId`。同一个值也可通过 `ctx.runId` 获取。

如果你需要的是不接收原始提示、历史记录、响应、头信息、请求体或提供商请求 ID 的提供商调用遥测，请使用 `model_call_started` 和 `model_call_ended`。这些钩子包含稳定元数据，例如 `runId`、`callId`、`provider`、`model`、可选的 `api` / `transport`、终态 `durationMs` / `outcome`，以及当 OpenClaw 能推导时提供的 `upstreamRequestIdHash`（受限的提供商请求 ID 哈希）。

需要 `llm_input`、`llm_output` 或 `agent_end` 的非内置插件必须设置：

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

可修改提示的钩子可通过 `plugins.entries.<id>.hooks.allowPromptInjection=false` 为单个插件禁用。

## 消息钩子

使用消息钩子来处理渠道级路由和投递策略：

- `message_received`：观察传入内容、发送者、`threadId`、`messageId`、`senderId`、可选的运行/会话关联信息以及元数据。
- `message_sending`：重写 `content` 或返回 `{ cancel: true }`。
- `message_sent`：观察最终成功或失败。

对于仅音频的 TTS 回复，即使渠道负载中没有可见文本/说明，`content` 也可能包含隐藏的语音转录文本。重写该 `content` 只会更新钩子可见的转录文本；它不会被渲染为媒体说明。

消息钩子上下文在可用时会公开稳定的关联字段：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。在读取旧版元数据之前，优先使用这些一等字段。

在使用特定于渠道的元数据之前，优先使用类型化的 `threadId` 和 `replyToId` 字段。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终止性决策。
- 带有 `cancel: false` 的 `message_sending` 会被视为未做决定。
- 被重写的 `content` 会继续传递给更低优先级的钩子，除非后续钩子取消投递。

## 安装钩子

`before_install` 会在内置的 Skills 和插件安装扫描之后运行。返回附加发现结果，或返回 `{ block: true, blockReason }` 以停止安装。

`block: true` 是终止性决策。`block: false` 会被视为未做决定。

## Gateway 网关 生命周期

对于需要 Gateway 网关 所属状态的插件服务，请使用 `gateway_start`。该上下文会公开 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，用于检查和更新 cron。使用 `gateway_stop` 清理长期运行的资源。

不要依赖内部的 `gateway:startup` 钩子来运行插件自有的运行时服务。

## 即将弃用的内容

有一些与钩子相邻的表面已被弃用，但仍受支持。请在下一个主要版本发布前迁移：

- **`inbound_claim` 和 `message_received` 处理器中的纯文本渠道信封**。请读取 `BodyForAgent` 和结构化用户上下文块，而不是解析扁平的信封文本。参见
  [Plaintext channel envelopes → BodyForAgent](/zh-CN/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 仍保留用于兼容性。新插件应使用 `before_model_resolve` 和 `before_prompt_build`，而不是这个组合阶段。
- **`before_tool_call` 中的 `onResolution`** 现在使用类型化的
  `PluginApprovalResolution` 联合类型（`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`），而不是自由格式的 `string`。

完整列表 — memory capability registration、provider thinking
profile、external auth providers、provider discovery types、task runtime
accessors，以及 `command-auth` → `command-status` 重命名 — 请参见
[Plugin SDK migration → Active deprecations](/zh-CN/plugins/sdk-migration#active-deprecations)。

## 相关内容

- [Plugin SDK migration](/zh-CN/plugins/sdk-migration) — 当前弃用项和移除时间线
- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [内部钩子](/zh-CN/automation/hooks)
- [插件架构内部机制](/zh-CN/plugins/architecture-internals)
