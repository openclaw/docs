---
read_when:
    - 你正在更改嵌入式智能体运行时或 harness 注册表
    - 你正在从内置插件或受信任插件注册智能体运行框架
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 面向替换底层嵌入式智能体执行器的插件的实验性 SDK 接口
title: Agent harness plugins
x-i18n:
    generated_at: "2026-05-10T19:42:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**智能体执行框架**是一个已准备好的 OpenClaw 智能体轮次的底层执行器。它不是模型提供商、不是渠道，也不是工具注册表。关于面向用户的心智模型，请参阅 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

仅将此接口用于内置或受信任的原生插件。该契约仍处于实验阶段，因为参数类型有意镜像当前嵌入式运行器。

## 何时使用执行框架

当某个模型系列拥有自己的原生会话运行时，并且常规 OpenClaw 提供商传输并不是合适抽象时，注册智能体执行框架。

示例：

- 拥有线程和压缩机制的原生编码智能体服务器
- 必须流式传输原生计划、推理和工具事件的本地 CLI 或守护进程
- 除 OpenClaw 会话转录之外，还需要自己的恢复 id 的模型运行时

不要仅为了添加新的 LLM API 而注册执行框架。对于常规 HTTP 或 WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责什么

在选择执行框架之前，OpenClaw 已经解析：

- 提供商和模型
- 运行时凭证状态
- 思考级别和上下文预算
- OpenClaw 转录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式回调
- 模型回退和实时模型切换策略

这种拆分是有意为之。执行框架运行一次已准备好的尝试；它不会选择提供商、替换渠道交付，或静默切换模型。

已准备好的尝试还包含 `params.runtimePlan`，这是 OpenClaw 拥有的策略包，用于必须在 PI 和原生执行框架之间保持共享的运行时决策：

- `runtimePlan.tools.normalize(...)` 和
  `runtimePlan.tools.logDiagnostics(...)`，用于感知提供商的工具架构策略
- `runtimePlan.transcript.resolvePolicy(...)`，用于转录清理和工具调用修复策略
- `runtimePlan.delivery.isSilentPayload(...)`，用于共享的 `NO_REPLY` 和媒体交付抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用于模型回退分类
- `runtimePlan.observability`，用于已解析的提供商/模型/执行框架元数据

执行框架可以将该计划用于需要匹配 PI 行为的决策，但仍应将其视为由宿主拥有的尝试状态。不要修改它，也不要在一个轮次内用它切换提供商/模型。

## 注册执行框架

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

OpenClaw 在提供商/模型解析之后选择执行框架：

1. 模型范围的运行时策略优先。
2. 接下来是提供商范围的运行时策略。
3. `auto` 会询问已注册的执行框架是否支持已解析的提供商/模型。
4. 如果没有已注册的执行框架匹配，OpenClaw 会使用 PI，除非 PI 回退已禁用。

插件执行框架失败会表现为运行失败。在 `auto` 模式下，只有当没有已注册的插件执行框架支持已解析的提供商/模型时，才会使用 PI 回退。一旦插件执行框架已认领某次运行，OpenClaw 不会通过 PI 重放同一个轮次，因为这可能改变凭证/运行时语义，或产生重复副作用。

选择过程会忽略整个会话和整个智能体的运行时固定设置。这包括过期的会话 `agentHarnessId` 值、`agents.defaults.agentRuntime`、`agents.list[].agentRuntime` 和 `OPENCLAW_AGENT_RUNTIME`。`/status` 会显示从提供商/模型路由选择的有效运行时。
如果所选执行框架出乎意料，请启用 `agents/harness` 调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含所选执行框架 id、选择原因、运行时/回退策略，并且在 `auto` 模式下还包含每个插件候选项的支持结果。

内置 Codex 插件将 `codex` 注册为其执行框架 id。核心会将其视为普通插件执行框架 id；Codex 专用别名应属于插件或操作员配置，而不是共享运行时选择器。

## 提供商与执行框架配对

大多数执行框架也应注册一个提供商。提供商会将模型引用、凭证状态、模型元数据和 `/model` 选择暴露给 OpenClaw 的其余部分。随后执行框架在 `supports(...)` 中认领该提供商。

内置 Codex 插件遵循此模式：

- 首选用户模型引用：`openai/gpt-5.5`
- 兼容性引用：旧版 `codex/gpt-*` 引用仍会被接受，但新配置不应将它们用作常规提供商/模型引用
- 执行框架 id：`codex`
- 凭证：合成的提供商可用性，因为 Codex harness 拥有原生 Codex 登录/会话
- 应用服务器请求：OpenClaw 将裸模型 id 发送给 Codex，并让执行框架与原生应用服务器协议通信

Codex 插件是增量式的。官方 OpenAI provider 上的普通 `openai/gpt-*` 智能体引用默认选择 Codex harness。较旧的 `codex/gpt-*` 引用仍会选择 Codex 提供商和执行框架以保持兼容性。

关于操作员设置、模型前缀示例和仅 Codex 配置，请参阅 [Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex 应用服务器版本为 `0.125.0` 或更新版本。Codex 插件会检查应用服务器初始化握手，并阻止较旧或未标注版本的服务器，以确保 OpenClaw 只运行在已经测试过的协议接口上。`0.125.0` 下限包含在 Codex `0.124.0` 中落地的原生 MCP 钩子载荷支持，同时将 OpenClaw 固定到更新且已测试的稳定线。

### 工具结果中间件

当清单在 `contracts.agentToolResultMiddleware` 中声明目标运行时 id 时，内置插件可以通过 `api.registerAgentToolResultMiddleware(...)` 附加运行时中立的工具结果中间件。这个受信任接口用于异步工具结果转换，必须在 PI 或 Codex 将工具输出反馈给模型之前运行。

旧版内置插件仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 处理仅限 Codex 应用服务器的中间件，但新的结果转换应使用运行时中立 API。仅 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 钩子已移除；Pi 工具结果转换必须使用运行时中立中间件。

### 终端结果分类

拥有自己协议投影的原生执行框架可以在一个已完成轮次没有生成可见助手文本时，使用来自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `classifyAgentHarnessTerminalOutcome(...)`。该助手会返回 `empty`、`reasoning-only` 或 `planning-only`，以便 OpenClaw 的回退策略决定是否在不同模型上重试。它有意不对提示错误、进行中的轮次以及类似 `NO_REPLY` 的有意静默回复进行分类。

### Native Codex harness 模式

内置 `codex` 执行框架是嵌入式 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件；如果你的配置使用限制性允许列表，请在 `plugins.allow` 中包含 `codex`。原生应用服务器配置应使用 `openai/gpt-*`；OpenAI 智能体轮次默认选择 Codex harness。旧版 `openai-codex/*` 路由应使用 `openclaw doctor --fix` 修复，旧版 `codex/*` 模型引用仍作为原生执行框架的兼容性别名保留。

当此模式运行时，Codex 拥有原生线程 id、恢复行为、压缩和应用服务器执行。OpenClaw 仍拥有聊天渠道、可见转录镜像、工具策略、审批、媒体交付和会话选择。当你需要证明只有 Codex 应用服务器路径可以认领运行时，请使用提供商/模型 `agentRuntime.id: "codex"`。显式插件运行时会失败关闭；Codex 应用服务器选择失败和运行时失败不会通过 PI 重试。

## 运行时严格性

默认情况下，OpenClaw 使用 `auto` 提供商/模型运行时策略：已注册的插件执行框架可以认领一个提供商/模型对，没有匹配项时由 PI 处理该轮次。官方 OpenAI provider 上的 OpenAI 智能体引用默认使用 Codex。当缺少执行框架选择时应失败而不是通过 PI 路由时，请使用显式提供商/模型插件运行时，例如 `agentRuntime.id: "codex"`。所选插件执行框架失败始终会硬失败。这不会阻止显式提供商/模型 `agentRuntime.id: "pi"`。

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
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
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

使用显式插件运行时时，如果请求的执行框架未注册、不支持已解析的提供商/模型，或在产生轮次副作用之前失败，会话会提前失败。对于仅 Codex 部署以及必须证明 Codex 应用服务器路径确实在使用中的实时测试，这是有意为之。

此设置只控制嵌入式智能体执行框架。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商特定的模型路由。

## 原生会话和转录镜像

执行框架可以保留原生会话 id、线程 id 或守护进程侧恢复令牌。请将该绑定明确关联到 OpenClaw 会话，并持续将用户可见的助手/工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍然是以下内容的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮次切回内置 PI 执行框架
- 通用 `/new`、`/reset` 和会话删除行为

如果你的执行框架存储旁路绑定，请实现 `reset(...)`，以便 OpenClaw 在所属 OpenClaw 会话被重置时可以清除它。

## 工具和媒体结果

核心会构造 OpenClaw 工具列表，并将其传入已准备好的尝试。当执行框架执行动态工具调用时，请通过执行框架结果形状返回工具结果，而不是自行发送渠道媒体。

这会让文本、图像、视频、音乐、TTS、审批和消息工具输出都走与 PI 支持的运行相同的交付路径。

## 当前限制

- 公共导入路径是通用的，但一些尝试/结果类型别名出于兼容性仍带有 `Pi` 名称。
- 第三方执行框架安装仍处于实验阶段。在需要原生会话运行时之前，请优先使用提供商插件。
- 支持跨轮次切换执行框架。不要在一个轮次中途，在原生工具、审批、助手文本或消息发送已开始后切换执行框架。

## 相关

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
