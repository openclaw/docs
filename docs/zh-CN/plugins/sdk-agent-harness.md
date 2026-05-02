---
read_when:
    - 你正在更改嵌入式智能体运行时或 harness 注册表
    - 你正在从内置或受信任的插件注册智能体运行框架
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 用于替换低层嵌入式智能体执行器的插件实验性 SDK 表面
title: Agent harness plugins
x-i18n:
    generated_at: "2026-05-02T02:37:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**智能体执行器**是一次已准备好的 OpenClaw 智能体轮次的低级执行器。它不是模型提供商，不是渠道，也不是工具注册表。关于面向用户的心智模型，请参阅 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

仅将此表面用于内置或可信的原生插件。该契约仍处于实验阶段，因为参数类型有意镜像当前嵌入式运行器。

## 何时使用执行器

当某个模型系列拥有自己的原生会话运行时，并且常规 OpenClaw 提供商传输不是合适抽象时，注册智能体执行器。

示例：

- 拥有线程和压缩逻辑的原生编码智能体服务器
- 必须流式传输原生计划、推理、工具事件的本地 CLI 或守护进程
- 除 OpenClaw 会话转录之外，还需要自己的恢复 ID 的模型运行时

不要仅为了添加新的 LLM API 而注册执行器。对于常规 HTTP 或 WebSocket 模型 API，请构建[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责什么

在选择执行器之前，OpenClaw 已经解析了：

- 提供商和模型
- 运行时身份验证状态
- 思考级别和上下文预算
- OpenClaw 转录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种拆分是有意设计的。执行器运行一次已准备好的尝试；它不会选择提供商、替代渠道投递，也不会静默切换模型。

已准备好的尝试还包含 `params.runtimePlan`，这是 OpenClaw 拥有的策略包，用于必须在 PI 和原生执行器之间保持共享的运行时决策：

- `runtimePlan.tools.normalize(...)` 和
  `runtimePlan.tools.logDiagnostics(...)`，用于感知提供商的工具 schema 策略
- `runtimePlan.transcript.resolvePolicy(...)`，用于转录清理和工具调用修复策略
- `runtimePlan.delivery.isSilentPayload(...)`，用于共享的 `NO_REPLY` 和媒体投递抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用于模型回退分类
- `runtimePlan.observability`，用于已解析的提供商/模型/执行器元数据

执行器可以将该计划用于需要匹配 PI 行为的决策，但仍应将其视为宿主拥有的尝试状态。不要修改它，也不要在一个轮次内用它切换提供商/模型。

## 注册执行器

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

OpenClaw 在提供商/模型解析之后选择执行器：

1. 现有会话记录的执行器 ID 优先，因此配置/环境变量变更不会将该转录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制使用具有该 ID 的已注册执行器。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置 PI 执行器。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会询问已注册执行器是否支持已解析的提供商/模型。
5. 如果没有已注册执行器匹配，除非禁用了 PI 回退，否则 OpenClaw 会使用 PI。

插件执行器失败会表现为运行失败。在 `auto` 模式下，只有在没有已注册插件执行器支持已解析的提供商/模型时，才会使用 PI 回退。一旦某个插件执行器声明了一次运行，OpenClaw 就不会通过 PI 重放同一轮次，因为那可能改变身份验证/运行时语义，或造成副作用重复。

选定的执行器 ID 会在嵌入式运行后随会话 ID 一起持久化。在执行器固定机制之前创建的旧会话，一旦有转录历史，就会被视为已固定到 PI。在 PI 与原生插件执行器之间切换时，请使用新的/重置后的会话。`/status` 会在 `Fast` 旁边显示非默认执行器 ID，例如 `codex`；PI 会保持隐藏，因为它是默认兼容路径。如果选中的执行器出乎意料，请启用 `agents/harness` 调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含选定的执行器 ID、选择原因、运行时/回退策略，并且在 `auto` 模式下还包含每个插件候选的支持结果。

内置 Codex 插件将 `codex` 注册为其执行器 ID。核心将其视为普通插件执行器 ID；Codex 专用别名属于插件或操作员配置，而不属于共享运行时选择器。

## 提供商加执行器配对

大多数执行器也应该注册一个提供商。提供商会让模型引用、身份验证状态、模型元数据和 `/model` 选择对 OpenClaw 的其余部分可见。然后，执行器在 `supports(...)` 中声明该提供商。

内置 Codex 插件遵循此模式：

- 首选用户模型引用：`openai/gpt-5.5` 加上
  `agentRuntime.id: "codex"`
- 兼容性引用：旧版 `codex/gpt-*` 引用仍会被接受，但新配置不应将它们用作常规提供商/模型引用
- 执行器 ID：`codex`
- 身份验证：合成的提供商可用性，因为 Codex 执行器拥有原生 Codex 登录/会话
- 应用服务器请求：OpenClaw 将裸模型 ID 发送给 Codex，并让执行器与原生应用服务器协议通信

Codex 插件是增量式的。普通 `openai/gpt-*` 引用会继续使用常规 OpenClaw 提供商路径，除非你用 `agentRuntime.id: "codex"` 强制使用 Codex 执行器。较旧的 `codex/gpt-*` 引用仍会选择 Codex 提供商和执行器以保持兼容。

关于操作员设置、模型前缀示例和仅 Codex 配置，请参阅 [Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex 应用服务器版本为 `0.125.0` 或更高。Codex 插件会检查应用服务器初始化握手，并阻止更旧或未标版本的服务器，从而确保 OpenClaw 只在已经过测试的协议表面上运行。`0.125.0` 下限包含在 Codex `0.124.0` 中落地的原生 MCP 钩子载荷支持，同时将 OpenClaw 固定到更新且已测试的稳定线。

### 工具结果中间件

当内置插件的清单在 `contracts.agentToolResultMiddleware` 中声明了目标运行时 ID 时，它们可以通过 `api.registerAgentToolResultMiddleware(...)` 附加运行时中立的工具结果中间件。这个可信接口用于异步工具结果转换，这些转换必须在 PI 或 Codex 将工具输出送回模型之前运行。

旧版内置插件仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 来实现仅 Codex 应用服务器的中间件，但新的结果转换应使用运行时中立 API。仅 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 钩子已被移除；Pi 工具结果转换必须使用运行时中立中间件。

### 终端结果分类

拥有自身协议投影的原生执行器，可以在已完成轮次没有产生可见助手文本时，使用 `openclaw/plugin-sdk/agent-harness-runtime` 中的 `classifyAgentHarnessTerminalOutcome(...)`。该辅助函数会返回 `empty`、`reasoning-only` 或 `planning-only`，以便 OpenClaw 的回退策略决定是否在不同模型上重试。它有意不对提示错误、正在进行的轮次，以及诸如 `NO_REPLY` 之类的有意静默回复进行分类。

### 原生 Codex 执行器模式

内置 `codex` 执行器是嵌入式 OpenClaw 智能体轮次的原生 Codex 模式。先启用内置 `codex` 插件；如果你的配置使用限制性允许列表，请在 `plugins.allow` 中包含 `codex`。原生应用服务器配置应使用带有 `agentRuntime.id: "codex"` 的 `openai/gpt-*`。请使用 `openai-codex/*` 通过 PI 进行 Codex OAuth。旧版 `codex/*` 模型引用仍是原生执行器的兼容性别名。

当此模式运行时，Codex 拥有原生线程 ID、恢复行为、压缩和应用服务器执行。OpenClaw 仍负责聊天渠道、可见转录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex 应用服务器路径可以声明该运行时，请使用不带 `fallback` 覆盖的 `agentRuntime.id: "codex"`。显式插件运行时默认已经是封闭失败。仅当你有意希望 PI 处理缺失的执行器选择时，才设置 `fallback: "pi"`。Codex 应用服务器失败已经会直接失败，而不会通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 以 `agents.defaults.agentRuntime` 设置为 `{ id: "auto", fallback: "pi" }` 的方式运行嵌入式智能体。在 `auto` 模式下，已注册插件执行器可以声明提供商/模型对。如果没有匹配项，OpenClaw 会回退到 PI。

在 `auto` 模式下，当你需要缺失的插件执行器选择失败而不是使用 PI 时，请设置 `fallback: "none"`。显式插件运行时（例如 `agentRuntime.id: "codex"`）默认已经是封闭失败，除非在相同配置或环境覆盖范围中设置了 `fallback: "pi"`。选定插件执行器的失败始终会硬失败。这不会阻止显式的 `agentRuntime.id: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅 Codex 的嵌入式运行：

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

如果你希望任何已注册插件执行器都能声明匹配模型，但绝不希望 OpenClaw 静默回退到 PI，请保留 `runtime: "auto"` 并禁用回退：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

按智能体覆盖使用相同结构：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` 仍会覆盖已配置的运行时。使用 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 从环境中禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，当请求的执行器未注册、不支持已解析的提供商/模型，或在产生轮次副作用之前失败时，会话会提前失败。这对于仅 Codex 部署以及必须证明 Codex 应用服务器路径确实正在使用的实时测试来说是有意设计的。

此设置只控制嵌入式智能体执行器。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商专用模型路由。

## 原生会话和转录镜像

执行器可以保留原生会话 ID、线程 ID 或守护进程侧恢复令牌。请将该绑定明确关联到 OpenClaw 会话，并持续将用户可见的助手/工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍是以下内容的兼容层：

- 渠道可见会话历史
- 转录搜索和索引
- 在之后的轮次切换回内置 PI 执行器
- 通用 `/new`、`/reset` 和会话删除行为

如果你的执行器存储边车绑定，请实现 `reset(...)`，以便在所属 OpenClaw 会话重置时，OpenClaw 可以清除它。

## 工具和媒体结果

核心会构建 OpenClaw 工具列表，并将其传入准备好的尝试。
当运行框架执行动态工具调用时，请通过运行框架的结果形状返回工具结果，
而不是自行发送渠道媒体。

这会让文本、图片、视频、音乐、TTS、审批和消息工具输出
与 PI 支持的运行使用相同的交付路径。

## 当前限制

- 公共导入路径是通用的，但某些尝试/结果类型别名为了兼容性仍然
  带有 `Pi` 名称。
- 第三方运行框架安装仍处于实验阶段。优先使用提供商插件，
  直到你需要原生会话运行时。
- 支持跨轮次切换运行框架。不要在原生工具、审批、助手文本或消息
  发送已经开始后，在同一轮中途切换运行框架。

## 相关内容

- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时助手](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
