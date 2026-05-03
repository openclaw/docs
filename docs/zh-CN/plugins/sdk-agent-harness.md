---
read_when:
    - 你正在更改嵌入式智能体运行时或框架注册表
    - 你正在从内置或受信任的插件注册智能体运行框架
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 用于替换底层嵌入式智能体执行器的实验性 SDK 接口
title: Agent harness plugins
x-i18n:
    generated_at: "2026-05-03T04:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**智能体执行框架** 是一次已准备好的 OpenClaw agent 回合的低层级执行器。它不是模型提供商，不是渠道，也不是工具注册表。关于面向用户的心智模型，请参阅 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

仅将这个接口用于内置或可信的原生插件。该契约仍处于实验阶段，因为参数类型有意映射当前的嵌入式运行器。

## 何时使用执行框架

当某个模型族有自己的原生会话运行时，并且常规 OpenClaw 提供商传输抽象不适合时，注册一个智能体执行框架。

示例：

- 拥有线程和压缩逻辑的原生编码智能体服务器
- 必须流式传输原生计划、推理和工具事件的本地 CLI 或守护进程
- 除 OpenClaw 会话转录记录之外还需要自己的恢复 ID 的模型运行时

不要仅为了添加新的 LLM API 而注册执行框架。对于常规 HTTP 或 WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## core 仍然负责什么

在选择执行框架之前，OpenClaw 已经解析了：

- 提供商和模型
- 运行时身份验证状态
- 思考级别和上下文预算
- OpenClaw 转录记录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式回调
- 模型回退和实时模型切换策略

这种拆分是有意设计的。执行框架运行一次已准备好的尝试；它不会选择提供商、替换渠道投递，也不会静默切换模型。

已准备好的尝试还包含 `params.runtimePlan`，这是由 OpenClaw 拥有的运行时决策策略包，必须在 PI 和原生执行框架之间保持共享：

- `runtimePlan.tools.normalize(...)` 和
  `runtimePlan.tools.logDiagnostics(...)`，用于具备提供商感知能力的工具 schema 策略
- `runtimePlan.transcript.resolvePolicy(...)`，用于转录记录清理和工具调用修复策略
- `runtimePlan.delivery.isSilentPayload(...)`，用于共享的 `NO_REPLY` 和媒体投递抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用于模型回退分类
- `runtimePlan.observability`，用于已解析的提供商/模型/执行框架元数据

执行框架可以使用该计划来做出需要匹配 PI 行为的决策，但仍应将它视为宿主拥有的尝试状态。不要修改它，也不要用它在一个回合内切换提供商/模型。

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

1. 现有会话记录的执行框架 ID 优先，因此配置/环境变量变更不会将该转录记录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制使用具有该 ID 的已注册执行框架。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置 PI 执行框架。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会询问已注册的执行框架是否支持已解析的提供商/模型。
5. 如果没有匹配的已注册执行框架，除非禁用了 PI 回退，否则 OpenClaw 会使用 PI。

插件执行框架失败会表现为运行失败。在 `auto` 模式下，只有当没有已注册插件执行框架支持已解析的提供商/模型时，才会使用 PI 回退。一旦某个插件执行框架声明接管一次运行，OpenClaw 就不会通过 PI 重放同一个回合，因为这可能改变身份验证/运行时语义，或重复产生副作用。

在嵌入式运行后，所选执行框架 ID 会随会话 ID 一起持久化。执行框架固定机制出现之前创建的旧版会话，一旦已有转录记录历史，就会被视为已固定到 PI。在 PI 和原生插件执行框架之间切换时，请使用新的/重置后的会话。`/status` 会在 `Fast` 旁显示非默认执行框架 ID，例如 `codex`；PI 会保持隐藏，因为它是默认兼容路径。如果所选执行框架出乎意料，请启用 `agents/harness` 调试日志，并检查 gateway 的结构化 `agent harness selected` 记录。它包含所选执行框架 ID、选择原因、运行时/回退策略，并且在 `auto` 模式下还包含每个插件候选项的支持结果。

内置 Codex 插件会将 `codex` 注册为其执行框架 ID。core 会把它视为普通插件执行框架 ID；Codex 专用别名应属于插件或操作员配置，而不是共享运行时选择器。

## 提供商与执行框架配对

大多数执行框架也应该注册一个提供商。提供商会让模型引用、身份验证状态、模型元数据和 `/model` 选择对 OpenClaw 的其他部分可见。然后执行框架在 `supports(...)` 中声明接管该提供商。

内置 Codex 插件遵循此模式：

- 首选用户模型引用：`openai/gpt-5.5` 加
  `agentRuntime.id: "codex"`
- 兼容性引用：旧版 `codex/gpt-*` 引用仍然被接受，但新配置不应将它们用作常规提供商/模型引用
- 执行框架 ID：`codex`
- 身份验证：合成的提供商可用性，因为 Codex 执行框架拥有原生 Codex 登录/会话
- app-server 请求：OpenClaw 会把裸模型 ID 发送给 Codex，并让执行框架与原生 app-server 协议通信

Codex 插件是增量式的。普通 `openai/gpt-*` 引用会继续使用常规 OpenClaw 提供商路径，除非你通过 `agentRuntime.id: "codex"` 强制使用 Codex 执行框架。较旧的 `codex/gpt-*` 引用仍会选择 Codex 提供商和执行框架以保持兼容。

关于操作员设置、模型前缀示例和 Codex 专用配置，请参阅 [Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 为 `0.125.0` 或更新版本。Codex 插件会检查 app-server 初始化握手，并阻止较旧或未带版本的服务器，因此 OpenClaw 只会针对它已经测试过的协议接口运行。`0.125.0` 下限包含 Codex `0.124.0` 中落地的原生 MCP 钩子载荷支持，同时将 OpenClaw 固定到更新的、已测试的稳定线。

### 工具结果中间件

内置插件可以在其清单的 `contracts.agentToolResultMiddleware` 中声明目标运行时 ID 后，通过 `api.registerAgentToolResultMiddleware(...)` 挂接运行时中立的工具结果中间件。这个可信接口用于在 PI 或 Codex 将工具输出反馈给模型之前必须运行的异步工具结果转换。

旧版内置插件仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 处理仅限 Codex app-server 的中间件，但新的结果转换应使用运行时中立 API。仅限 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 钩子已被移除；Pi 工具结果转换必须使用运行时中立中间件。

### 终端结果分类

拥有自己协议投影的原生执行框架，在已完成回合未产生可见 assistant 文本时，可以使用来自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `classifyAgentHarnessTerminalOutcome(...)`。该辅助函数会返回 `empty`、`reasoning-only` 或 `planning-only`，让 OpenClaw 的回退策略决定是否在不同模型上重试。它有意不对提示错误、进行中的回合以及 `NO_REPLY` 等有意的静默回复进行分类。

### 原生 Codex 执行框架模式

内置 `codex` 执行框架是嵌入式 OpenClaw agent 回合的原生 Codex 模式。先启用内置 `codex` 插件；如果你的配置使用限制性允许列表，请在 `plugins.allow` 中包含 `codex`。原生 app-server 配置应使用带有 `agentRuntime.id: "codex"` 的 `openai/gpt-*`。请使用 `openai-codex/*` 通过 PI 使用 Codex OAuth。旧版 `codex/*` 模型引用仍然是原生执行框架的兼容性别名。

当此模式运行时，Codex 拥有原生线程 ID、恢复行为、压缩和 app-server 执行。OpenClaw 仍然拥有聊天渠道、可见转录记录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex app-server 路径可以声明接管运行时，请使用 `agentRuntime.id: "codex"`。显式插件运行时会失败关闭；Codex app-server 选择失败和运行时失败不会通过 PI 重试。

## 运行时严格性

默认情况下，OpenClaw 使用 OpenClaw Pi 运行嵌入式智能体。在 `auto` 模式下，已注册插件执行框架可以声明接管某个提供商/模型组合；如果没有匹配项，则由 PI 处理该回合。当缺失执行框架选择应失败而不是路由到 PI 时，请使用显式插件运行时，例如 `agentRuntime.id: "codex"`。所选插件执行框架失败始终会硬失败。这不会阻止显式的 `agentRuntime.id: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅限 Codex 的嵌入式运行：

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

如果你希望任何已注册插件执行框架声明接管匹配模型，并在其他情况下使用 PI，请设置 `id: "auto"`：

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

按智能体覆盖使用相同结构：

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

使用显式插件运行时时，如果请求的执行框架未注册、不支持已解析的提供商/模型，或在产生回合副作用之前失败，会话会提前失败。这对仅限 Codex 的部署以及必须证明 Codex app-server 路径确实正在使用的实时测试是有意设计的。

此设置只控制嵌入式智能体执行框架。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商专用模型路由。

## 原生会话和转录记录镜像

执行框架可以保留原生会话 ID、线程 ID 或守护进程端恢复 token。请将该绑定明确关联到 OpenClaw 会话，并持续将用户可见的 assistant/工具输出镜像到 OpenClaw 转录记录中。

OpenClaw 转录记录仍是以下内容的兼容层：

- 渠道可见的会话历史
- 转录记录搜索和索引
- 在后续回合切换回内置 PI 执行框架
- 通用 `/new`、`/reset` 和会话删除行为

如果你的执行框架存储旁路绑定，请实现 `reset(...)`，这样 OpenClaw 就可以在所属 OpenClaw 会话被重置时清除它。

## 工具和媒体结果

core 会构造 OpenClaw 工具列表，并将其传入已准备好的尝试。当执行框架执行动态工具调用时，请通过执行框架结果形状返回工具结果，而不是自行发送渠道媒体。

这会让文本、图像、视频、音乐、TTS、审批和消息工具输出与 PI 支持的运行保持在同一条投递路径上。

## 当前限制

- 公共导入路径是通用的，但一些 attempt/result 类型别名仍然保留 `Pi` 名称以保持兼容。
- 第三方 harness 安装仍处于实验阶段。优先使用提供商插件，直到你需要原生会话运行时。
- 支持跨轮次切换 harness。不要在原生工具、审批、智能体文本或消息发送开始之后，在同一轮中途切换 harness。

## 相关

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
