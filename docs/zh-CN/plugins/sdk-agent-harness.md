---
read_when:
    - 你正在更改嵌入式智能体运行时或 harness 注册表
    - 你正在从内置或受信任插件注册智能体运行框架
    - 你需要理解 Codex 插件与模型提供商的关系
sidebarTitle: Agent Harness
summary: 用于替换低层级嵌入式智能体执行器的插件实验性 SDK 接口面
title: Agent harness plugins
x-i18n:
    generated_at: "2026-07-05T11:32:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 969213232ebde462ae20a4f13876f27f778b7d6ace7e7be1ba3d8e04e8fa5ed2
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**agent harness** 是一次已准备好的 OpenClaw agent 轮次的底层执行器。它不是模型提供商，不是渠道，也不是工具注册表。关于面向用户的心智模型，请参阅 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

仅将此接口用于内置或受信任的原生插件。该契约仍处于实验阶段，因为参数类型有意镜像当前嵌入式运行器。

## 何时使用 harness

当某个模型系列拥有自己的原生会话运行时，并且常规 OpenClaw 提供商传输不是合适抽象时，注册 agent harness：

- 拥有线程和压缩的原生代码智能体服务器
- 必须流式传输原生计划、推理和工具事件的本地 CLI 或守护进程
- 除 OpenClaw 会话转录之外，还需要自己的恢复 ID 的模型运行时

不要仅为了添加新的 LLM API 而注册 harness。对于常规 HTTP 或 WebSocket 模型 API，请构建一个 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责什么

在选择 harness 之前，OpenClaw 已经解析了：

- 提供商和模型
- 运行时认证状态
- 思考级别和上下文预算
- OpenClaw 转录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

harness 运行一次已准备好的尝试；它不会选择提供商、替代渠道投递，或静默切换模型。

已准备好的尝试还包含 `params.runtimePlan`，这是 OpenClaw 拥有的运行时决策策略包，必须在 OpenClaw 和原生 harness 之间保持共享：

- `runtimePlan.tools.normalize(...)` 和 `runtimePlan.tools.logDiagnostics(...)` 用于感知提供商的工具 schema 策略
- `runtimePlan.transcript.resolvePolicy(...)` 用于转录清理和工具调用修复策略
- `runtimePlan.delivery.isSilentPayload(...)` 用于共享的 `NO_REPLY` 和媒体投递抑制
- `runtimePlan.outcome.classifyRunResult(...)` 用于模型回退分类
- `runtimePlan.observability` 用于已解析的提供商/模型/harness 元数据

harness 可以将该计划用于需要匹配 OpenClaw 行为的决策，但应将它视为宿主拥有的尝试状态：不要修改它，也不要在一个轮次内用它切换提供商/模型。

## 注册 harness

**导入：** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## 选择策略

OpenClaw 会在提供商/模型解析之后选择 harness：

1. 模型范围的运行时策略优先。
2. 提供商范围的运行时策略其次。
3. `auto` 会询问已注册的 harness 是否支持已解析的提供商/模型。
4. 如果没有匹配的已注册 harness，OpenClaw 会使用其嵌入式运行时。

插件 harness 失败会表现为运行失败。在 `auto` 模式下，只有当没有已注册的插件 harness 支持已解析的提供商/模型时，才会应用嵌入式回退。一旦插件 harness 已认领一次运行，OpenClaw 不会通过另一个运行时重放同一轮次，因为这可能改变认证/运行时语义或重复产生副作用。

选择时会忽略整个会话和整个智能体的运行时固定配置。这包括过期会话 `agentHarnessId` 值、`agents.defaults.agentRuntime`、`agents.list[].agentRuntime` 和 `OPENCLAW_AGENT_RUNTIME`。`/status` 会显示从提供商/模型路由中选择的有效运行时。

如果所选 harness 出乎意料，请启用 `agents/harness` 调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录：它包含所选 harness ID、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

内置 Codex 插件将 `codex` 注册为其 harness ID。核心会将其视为普通插件 harness ID；Codex 专属别名应属于插件或操作员配置，而不是共享运行时选择器。

## 提供商与 harness 配对

大多数 harness 也应注册一个提供商。提供商会让模型引用、认证状态、模型元数据和 `/model` 选择对 OpenClaw 的其他部分可见。然后 harness 在 `supports(...)` 中认领该提供商。

内置 Codex 插件遵循此模式：

- 首选用户模型引用：`openai/gpt-5.5`
- 兼容性引用：旧版 `codex/gpt-*` 引用仍被接受，但新配置不应将它们用作常规提供商/模型引用
- harness ID：`codex`
- 认证：合成提供商可用性，因为 Codex harness 拥有原生 Codex 登录/会话
- 应用服务器请求：OpenClaw 将裸模型 ID 发送给 Codex，并让 harness 与原生应用服务器协议通信

Codex 插件是增量式的。官方 OpenAI API 端点（`api.openai.com`）上的普通 `openai/gpt-*` 智能体引用默认选择 Codex harness；自定义 OpenAI 兼容 base URL 则保留其配置的提供商行为。较旧的 `codex/gpt-*` 引用仍会选择 Codex 提供商和 harness 以保持兼容。

关于操作员设置、模型前缀示例和仅 Codex 配置，请参阅 [Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex 应用服务器版本为 `0.125.0` 或更高。Codex 插件会检查应用服务器 initialize 握手，并阻止较旧或未版本化的服务器，因此 OpenClaw 只会在它已测试的协议接口上运行。

### 工具结果中间件

当清单在 `contracts.agentToolResultMiddleware` 中声明目标运行时 ID 时，内置插件和显式启用且清单契约匹配的已安装插件可以通过 `api.registerAgentToolResultMiddleware(...)` 附加运行时中立的工具结果中间件。这个受信任接口用于异步工具结果转换，必须在 OpenClaw 或 Codex 将工具输出送回模型之前运行。

旧版内置插件仍可将 `api.registerCodexAppServerExtensionFactory(...)` 用于仅 Codex 应用服务器的中间件，但新的结果转换应使用运行时中立 API。仅嵌入式运行器的 `api.registerEmbeddedExtensionFactory(...)` 钩子已被移除；嵌入式工具结果转换必须使用运行时中立中间件。

### 终端结果分类

拥有自己协议投影的原生 harness，可以在已完成轮次没有产生可见助手文本时，使用来自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `classifyAgentHarnessTerminalOutcome(...)`。该辅助函数返回 `empty`、`reasoning-only` 或 `planning-only`，以便 OpenClaw 的回退策略决定是否在不同模型上重试。`planning-only` 需要 harness 的显式 `planText` 字段；OpenClaw 不会从助手正文中推断它。该辅助函数有意不对提示错误、进行中的轮次以及像 `NO_REPLY` 这样的有意静默回复进行分类。

### Agent 结束副作用

原生 harness 在最终确定一次尝试后，必须调用来自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `runAgentEndSideEffects(...)`。它会分发可移植的 `agent_end` 钩子和 OpenClaw 的研究捕获，而不会延迟交互式回复。对于本地、非交互式运行，如果尝试必须等这些副作用完成后才解析，请使用 `awaitAgentEndSideEffects(...)`。两个辅助函数都接受与 `runAgentHarnessAgentEndHook(...)` 相同的 `{ event, ctx }` 载荷；它们的失败不会改变已完成的尝试结果。

### 用户输入和工具接口

暴露运行时级用户输入请求的原生 harness，应使用 `openclaw/plugin-sdk/agent-harness-runtime` 中的用户输入辅助函数来格式化提示，通过 OpenClaw 的阻塞回复路径投递，并将选择题/自由形式答案规范化回运行时的原生响应形状。该辅助函数会保持渠道/TUI 呈现一致，同时每个 harness 保留自己的协议解析和挂起请求生命周期。

需要类似 PI 的紧凑工具路由的原生 harness，应使用来自 `openclaw/plugin-sdk/agent-harness-tool-runtime` 的 `createAgentHarnessToolSurfaceRuntime(...)`。它负责工具搜索/代码模式控制选择、本地模型精简默认值、运行时兼容的 schema 过滤、隐藏目录执行、目录水合以及目录清理。harness 仍负责自己的 SDK 专属工具转换和原生执行回调。

### 原生 Codex harness 模式

内置 `codex` harness 是嵌入式 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件，如果你的配置使用限制性 allowlist，也请在 `plugins.allow` 中包含 `codex`。原生应用服务器配置应使用 `openai/gpt-*`；OpenAI 智能体轮次默认选择 Codex harness。旧版 Codex 模型引用路由应使用 `openclaw doctor --fix` 修复，而旧版 `codex/*` 模型引用仍作为原生 harness 的兼容性别名保留。

当此模式运行时，Codex 拥有原生线程 ID、恢复行为、压缩和应用服务器执行。OpenClaw 仍然拥有聊天渠道、可见转录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex 应用服务器路径可以认领该运行时，请使用提供商/模型 `agentRuntime.id: "codex"`。显式插件运行时会失败关闭；Codex 应用服务器选择失败和运行时失败不会通过另一个运行时重试。

## 运行时严格性

默认情况下，OpenClaw 使用 `auto` 提供商/模型运行时策略：已注册的插件 harness 可以认领一个提供商/模型组合；如果没有匹配项，嵌入式运行时会处理该轮次。官方 OpenAI provider 上的 OpenAI 智能体引用默认使用 Codex。当缺少 harness 选择时应失败而不是路由到嵌入式运行时时，请使用显式提供商/模型插件运行时，例如 `agentRuntime.id: "codex"`。已选择的插件 harness 失败始终会硬失败。这不会阻止显式提供商/模型 `agentRuntime.id: "openclaw"`。

对于仅 Codex 的嵌入式运行：

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

如果你想为一个规范模型使用 CLI 后端，请将运行时放在该模型条目上：

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

按智能体覆盖使用相同的模型范围形状：

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

像这样的旧版整个智能体运行时示例会被忽略：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

使用显式插件运行时后，当请求的运行框架未注册、不支持已解析的提供商/模型，或在产生轮次副作用之前失败时，会话会提前失败。这对于仅 Codex 的部署，以及必须证明 Codex app-server 路径确实正在使用的实时测试，是有意设计的。

此设置只控制嵌入式智能体运行框架。它不会禁用图像、视频、音乐、TTS、PDF 或其他特定提供商的模型路由。

## 原生会话和转录镜像

运行框架可以保留原生会话 ID、线程 ID 或守护进程端的恢复令牌。请将该绑定明确关联到 OpenClaw 会话，并继续将用户可见的助手/工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍是以下内容的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮次切回内置 OpenClaw 运行框架
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的运行框架存储旁路绑定，请实现 `reset(...)`，以便 OpenClaw 在拥有该绑定的 OpenClaw 会话重置时清除它。

## 工具和媒体结果

核心会构造 OpenClaw 工具列表，并将其传入已准备好的尝试。当运行框架执行动态工具调用时，请通过运行框架结果形状返回工具结果，而不是自行发送渠道媒体。

这会让文本、图像、视频、音乐、TTS、审批和消息工具输出与 OpenClaw 支持的运行走同一条交付路径。

## 当前限制

- 公共导入路径是通用的，但某些尝试/结果类型别名仍保留旧名称以实现兼容。
- 第三方运行框架安装仍处于实验阶段。在需要原生会话运行时之前，优先使用提供商插件。
- 支持跨轮次切换运行框架。在原生工具、审批、助手文本或消息发送已经开始后，不要在一个轮次中途切换运行框架。

## 相关

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
