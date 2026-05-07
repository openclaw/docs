---
read_when:
    - 你正在更改嵌入式智能体运行时或运行框架注册表
    - 你正在从内置或受信任的插件注册智能体 harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 用于替换低层嵌入式智能体执行器的插件的实验性 SDK 接口
title: Agent harness plugins
x-i18n:
    generated_at: "2026-05-07T13:21:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

一个**智能体执行框架**是一次已准备好的 OpenClaw 智能体轮次的低层执行器。它不是模型提供商，不是渠道，也不是工具注册表。面向用户的心智模型请参阅 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

仅将这个接口用于内置或可信的原生插件。这个契约仍处于实验阶段，因为参数类型会有意镜像当前的嵌入式运行器。

## 何时使用执行框架

当某个模型系列有自己的原生会话运行时，并且普通的 OpenClaw 提供商传输层不是正确抽象时，注册一个智能体执行框架。

示例：

- 一个拥有线程和压缩逻辑的原生编码智能体服务器
- 一个必须流式传输原生计划/推理/工具事件的本地 CLI 或守护进程
- 一个除了 OpenClaw 会话转录之外，还需要自己的恢复 id 的模型运行时

不要仅为了添加新的 LLM API 而注册执行框架。对于普通的 HTTP 或 WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责什么

在选择执行框架之前，OpenClaw 已经解析了：

- 提供商和模型
- 运行时凭证状态
- 思考级别和上下文预算
- OpenClaw 转录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种拆分是有意为之。执行框架运行一次已准备好的尝试；它不选择提供商，不替换渠道交付，也不会静默切换模型。

已准备好的尝试还包含 `params.runtimePlan`，这是一个由 OpenClaw 拥有的策略包，用于必须在 PI 和原生执行框架之间保持共享的运行时决策：

- `runtimePlan.tools.normalize(...)` 和
  `runtimePlan.tools.logDiagnostics(...)` 用于感知提供商的工具 schema 策略
- `runtimePlan.transcript.resolvePolicy(...)` 用于转录清理和工具调用修复策略
- `runtimePlan.delivery.isSilentPayload(...)` 用于共享的 `NO_REPLY` 和媒体交付抑制
- `runtimePlan.outcome.classifyRunResult(...)` 用于模型回退分类
- `runtimePlan.observability` 用于已解析的提供商/模型/执行框架元数据

执行框架可以将该计划用于需要匹配 PI 行为的决策，但仍应将其视为主机拥有的尝试状态。不要改变它，也不要用它在一个轮次内切换提供商/模型。

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

OpenClaw 会在提供商/模型解析后选择执行框架：

1. 现有会话中记录的执行框架 id 优先，因此配置/环境变量变更不会将该转录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制使用具有该 id 的已注册执行框架。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置 PI 执行框架。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会询问已注册的执行框架是否支持已解析的提供商/模型。
5. 如果没有匹配的已注册执行框架，OpenClaw 会使用 PI，除非 PI 回退已禁用。

插件执行框架失败会表现为运行失败。在 `auto` 模式下，只有当没有已注册的插件执行框架支持已解析的提供商/模型时，才会使用 PI 回退。一旦某个插件执行框架声明处理一次运行，OpenClaw 就不会通过 PI 重放同一个轮次，因为这可能改变凭证/运行时语义或造成副作用重复。

选中的执行框架 id 会在嵌入式运行后随会话 id 一起持久化。执行框架固定机制之前创建的旧版会话，一旦有转录历史，就会被视为已固定到 PI。在 PI 和原生插件执行框架之间切换时，请使用新的/已重置的会话。`/status` 会在 `Fast` 旁边显示非默认执行框架 id，例如 `codex`；PI 保持隐藏，因为它是默认兼容路径。如果选中的执行框架出乎意料，请启用 `agents/harness` 调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含选中的执行框架 id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选的支持结果。

内置 Codex 插件将 `codex` 注册为其执行框架 id。核心会将其视为普通插件执行框架 id；Codex 特定别名应属于插件或操作员配置，而不是共享运行时选择器。

## 提供商加执行框架配对

大多数执行框架也应注册一个提供商。提供商会让模型引用、凭证状态、模型元数据和 `/model` 选择对 OpenClaw 的其余部分可见。然后执行框架会在 `supports(...)` 中声明处理该提供商。

内置 Codex 插件遵循此模式：

- 首选用户模型引用：`openai/gpt-5.5` 加
  `agentRuntime.id: "codex"`
- 兼容性引用：旧版 `codex/gpt-*` 引用仍被接受，但新配置不应将它们用作普通提供商/模型引用
- 执行框架 id：`codex`
- 凭证：合成的提供商可用性，因为 Codex 执行框架拥有原生 Codex 登录/会话
- 应用服务器请求：OpenClaw 会将裸模型 id 发送给 Codex，并让执行框架与原生应用服务器协议通信

Codex 插件是增量式的。普通 `openai/gpt-*` 引用会继续使用正常的 OpenClaw 提供商路径，除非你通过 `agentRuntime.id: "codex"` 强制使用 Codex 执行框架。较旧的 `codex/gpt-*` 引用仍会为了兼容性选择 Codex 提供商和执行框架。

操作员设置、模型前缀示例和仅 Codex 配置，请参阅 [Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex 应用服务器版本为 `0.125.0` 或更新。Codex 插件会检查应用服务器初始化握手，并阻止较旧或未标明版本的服务器，因此 OpenClaw 只会在已经测试过的协议接口上运行。`0.125.0` 下限包含 Codex `0.124.0` 中落地的原生 MCP 钩子载荷支持，同时将 OpenClaw 固定到更新且经过测试的稳定线。

### 工具结果中间件

当清单在 `contracts.agentToolResultMiddleware` 中声明了目标运行时 id 时，内置插件可以通过 `api.registerAgentToolResultMiddleware(...)` 附加运行时中立的工具结果中间件。这个可信接口适用于异步工具结果转换，这些转换必须在 PI 或 Codex 将工具输出反馈给模型之前运行。

旧版内置插件仍可以将 `api.registerCodexAppServerExtensionFactory(...)` 用于仅限 Codex 应用服务器的中间件，但新的结果转换应使用运行时中立 API。仅限 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 钩子已移除；Pi 工具结果转换必须使用运行时中立中间件。

### 终止结果分类

拥有自身协议投影的原生执行框架，可以在已完成的轮次没有产生可见助手文本时，使用来自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `classifyAgentHarnessTerminalOutcome(...)`。该辅助函数会返回 `empty`、`reasoning-only` 或 `planning-only`，以便 OpenClaw 的回退策略决定是否在不同模型上重试。它会有意不分类提示错误、进行中的轮次，以及诸如 `NO_REPLY` 这样的有意静默回复。

### 原生 Codex 执行框架模式

内置 `codex` 执行框架是嵌入式 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件；如果你的配置使用限制性允许列表，还要将 `codex` 包含在 `plugins.allow` 中。原生应用服务器配置应使用 `openai/gpt-*`；OpenAI 智能体轮次默认选择 Codex 执行框架。旧版 `openai-codex/*` 路由应使用 `openclaw doctor --fix` 修复，而旧版 `codex/*` 模型引用仍作为原生执行框架的兼容性别名保留。

当此模式运行时，Codex 拥有原生线程 id、恢复行为、压缩逻辑和应用服务器执行。OpenClaw 仍拥有聊天渠道、可见转录镜像、工具策略、审批、媒体交付和会话选择。当你需要证明只有 Codex 应用服务器路径可以声明处理这次运行时，请使用 `agentRuntime.id: "codex"`。显式插件运行时会故障关闭；Codex 应用服务器选择失败和运行时失败不会通过 PI 重试。

## 运行时严格性

默认情况下，OpenClaw 使用 OpenClaw Pi 运行嵌入式智能体。在 `auto` 模式下，已注册的插件执行框架可以声明处理提供商/模型配对；如果没有匹配项，PI 会处理该轮次。当缺少执行框架选择应失败而不是路由到 PI 时，请使用显式插件运行时，例如 `agentRuntime.id: "codex"`。选中的插件执行框架失败总是硬失败。这不会阻止显式的 `agentRuntime.id: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

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

如果你希望任何已注册的插件执行框架声明处理匹配模型，否则使用 PI，请设置 `id: "auto"`：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

每个智能体的覆盖使用相同形状：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` 仍会覆盖已配置的运行时。

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

使用显式插件运行时时，如果请求的执行框架未注册、不支持已解析的提供商/模型，或在产生轮次副作用前失败，会话会提前失败。这对仅 Codex 部署以及必须证明 Codex 应用服务器路径确实在使用的实时测试来说是有意设计的。

此设置只控制嵌入式智能体执行框架。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商特定的模型路由。

## 原生会话和转录镜像

执行框架可以保留原生会话 id、线程 id 或守护进程侧恢复令牌。请将该绑定明确关联到 OpenClaw 会话，并持续将用户可见的助手/工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍是以下内容的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮次切回内置 PI 执行框架
- 通用 `/new`、`/reset` 和会话删除行为

如果你的执行框架存储一个旁路绑定，请实现 `reset(...)`，这样 OpenClaw 在重置拥有它的 OpenClaw 会话时可以清除该绑定。

## 工具和媒体结果

核心会构建 OpenClaw 工具列表，并将其传入已准备好的尝试。当执行框架执行动态工具调用时，请通过执行框架结果形状返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批和消息工具输出，与 PI 支持的运行保持在同一交付路径上。

## 当前限制

- 公共导入路径是通用的，但某些 attempt/result 类型别名仍然
  保留 `Pi` 名称以保持兼容性。
- 第三方运行框架安装仍处于实验阶段。在你需要原生会话运行时之前，
  优先使用提供商插件。
- 支持跨轮次切换运行框架。原生工具、审批、assistant 文本或消息
  发送开始后，不要在同一轮次中途切换运行框架。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
