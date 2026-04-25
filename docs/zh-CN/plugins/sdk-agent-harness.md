---
read_when:
    - 你正在更改内嵌智能体运行时或 Harness 注册表
    - 你正在从内置或受信任的插件注册一个智能体 Harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 供替换底层内嵌智能体执行器的插件使用的实验性 SDK 接口
title: 智能体 Harness 插件
x-i18n:
    generated_at: "2026-04-25T01:27:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a451995a18bce70b02eea88e2ac52561e21208c40cf93b88fc921aad49dffec
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**智能体 Harness** 是为单个已准备好的 OpenClaw 智能体轮次提供的底层执行器。它不是模型提供商，不是渠道，也不是工具注册表。

仅将此接口用于内置或受信任的原生插件。该契约仍然是实验性的，因为参数类型有意映射当前的内嵌运行器。

## 何时使用 Harness

当某个模型家族拥有自己的原生会话运行时，而常规的 OpenClaw 提供商传输层并不是合适抽象时，请注册一个智能体 Harness。

示例：

- 拥有线程和压缩能力的原生编码智能体服务器
- 必须流式传输原生计划 / 推理 / 工具事件的本地 CLI 或守护进程
- 除 OpenClaw 会话转录记录之外，还需要自己的恢复 id 的模型运行时

**不要** 只是为了添加一个新的 LLM API 就注册 Harness。对于普通的 HTTP 或 WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责的内容

在选择 Harness 之前，OpenClaw 已经解析了：

- 提供商和模型
- 运行时凭证状态
- 思考级别和上下文预算
- OpenClaw 转录记录 / 会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种划分是有意设计的。Harness 运行的是一个已准备好的尝试；它不会选择提供商、替换渠道投递，或静默切换模型。

## 注册 Harness

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

OpenClaw 会在提供商 / 模型解析完成后选择一个 Harness：

1. 现有会话中记录的 Harness id 优先，因此配置 / 环境变量变更不会将该转录记录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制使用具有该 id 的已注册 Harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置的 PI Harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会询问已注册的 Harness 是否支持已解析的提供商 / 模型。
5. 如果没有匹配的已注册 Harness，除非 PI 回退已被禁用，否则 OpenClaw 会使用 PI。

插件 Harness 失败会表现为运行失败。在 `auto` 模式下，仅当没有任何已注册的插件 Harness 支持已解析的提供商 / 模型时，才会使用 PI 回退。一旦某个插件 Harness 已接管一次运行，OpenClaw 不会再通过 PI 重放同一个轮次，因为那可能改变凭证 / 运行时语义或导致副作用重复。

选中的 Harness id 会在一次内嵌运行后与会话 id 一起持久化。在 Harness 固定机制出现之前创建的旧会话，只要已有转录历史，就会被视为已固定到 PI。在 PI 与原生插件 Harness 之间切换时，请使用新的 / 重置后的会话。`/status` 会在 `Fast` 旁显示诸如 `codex` 之类的非默认 Harness id；PI 因为是默认兼容路径而保持隐藏。如果选中的 Harness 出乎你的预期，请启用 `agents/harness` 调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含选中的 Harness id、选择原因、运行时 / 回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

内置的 Codex 插件将 `codex` 注册为它的 Harness id。核心将其视为普通的插件 Harness id；Codex 专用别名应放在插件或操作员配置中，而不是共享运行时选择器中。

## 提供商与 Harness 配对

大多数 Harness 也应注册一个提供商。提供商会让模型引用、凭证状态、模型元数据和 `/model` 选择对 OpenClaw 的其余部分可见。然后 Harness 在 `supports(...)` 中声明该提供商。

内置的 Codex 插件遵循这一模式：

- provider id：`codex`
- 用户模型引用：`openai/gpt-5.5` 加上 `embeddedHarness.runtime: "codex"`；旧版 `codex/gpt-*` 引用仍然出于兼容性而被接受
- harness id：`codex`
- auth：合成的提供商可用性，因为 Codex Harness 拥有原生 Codex 登录 / 会话
- app-server 请求：OpenClaw 将裸模型 id 发送给 Codex，并让 Harness 与原生 app-server 协议通信

Codex 插件是增量式的。普通的 `openai/gpt-*` 引用会继续使用常规 OpenClaw 提供商路径，除非你通过 `embeddedHarness.runtime: "codex"` 强制使用 Codex Harness。较旧的 `codex/gpt-*` 引用仍会出于兼容性而选择 Codex 提供商和 Harness。

关于操作员设置、模型前缀示例和仅限 Codex 的配置，请参见 [Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 为 `0.118.0` 或更高版本。Codex 插件会检查 app-server 初始化握手，并阻止更旧或未带版本号的服务器，以确保 OpenClaw 仅在它已测试过的协议接口上运行。

### 工具结果中间件

当内置插件的清单在 `contracts.agentToolResultMiddleware` 中声明了目标运行时 id 时，它们可以通过 `api.registerAgentToolResultMiddleware(...)` 附加运行时无关的工具结果中间件。这个受信任接口用于异步工具结果转换，这些转换必须在 PI 或 Codex 将工具输出反馈给模型之前运行。

旧版内置插件仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 来实现仅适用于 Codex app-server 的中间件，但新的结果转换应使用运行时无关 API。
仅限 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 钩子已被移除；Pi 工具结果转换必须使用运行时无关中间件。

### 原生 Codex Harness 模式

内置的 `codex` Harness 是内嵌 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置的 `codex` 插件；如果你的配置使用了限制性 allowlist，还需要在 `plugins.allow` 中包含 `codex`。原生 app-server 配置应使用 `openai/gpt-*` 并设置 `embeddedHarness.runtime: "codex"`。若要通过 PI 使用 Codex OAuth，请改用 `openai-codex/*`。旧版 `codex/*` 模型引用仍保留为原生 Harness 的兼容别名。

当该模式运行时，Codex 负责原生线程 id、恢复行为、压缩和 app-server 执行。OpenClaw 仍然负责聊天渠道、可见转录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex app-server 路径可以接管运行时，请使用 `embeddedHarness.runtime: "codex"` 并配合 `embeddedHarness.fallback: "none"`。该配置只是一个选择保护措施：Codex app-server 失败本来就会直接失败，而不是通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 运行内嵌智能体时，`agents.defaults.embeddedHarness` 设置为 `{ runtime: "auto", fallback: "pi" }`。在 `auto` 模式下，已注册的插件 Harness 可以接管某个提供商 / 模型对。如果没有匹配项，OpenClaw 会回退到 PI。

当你需要在缺少插件 Harness 选择时直接失败，而不是使用 PI 时，请设置 `fallback: "none"`。已选中的插件 Harness 失败本来就会硬失败。这不会阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅限 Codex 的内嵌运行：

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

如果你希望任何已注册的插件 Harness 都可以接管匹配的模型，但绝不希望 OpenClaw 静默回退到 PI，请保持 `runtime: "auto"` 并禁用回退：

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

按智能体覆盖使用相同的结构：

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` 仍会覆盖已配置的运行时。使用 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可通过环境变量禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

在禁用回退的情况下，如果请求的 Harness 未注册、不支持已解析的提供商 / 模型，或在产生轮次副作用之前失败，会话会尽早失败。这是 Codex 专用部署以及必须证明 Codex app-server 路径确实在使用中的实时测试所期望的行为。

此设置仅控制内嵌智能体 Harness。它不会禁用图像、视频、音乐、TTS、PDF 或其他特定提供商的模型路由。

## 原生会话与转录镜像

Harness 可以保留原生会话 id、线程 id 或守护进程侧恢复令牌。请将这种绑定显式地与 OpenClaw 会话关联，并持续将用户可见的助手 / 工具输出镜像到 OpenClaw 转录记录中。

OpenClaw 转录记录仍然是以下内容的兼容层：

- 渠道可见的会话历史
- 转录记录搜索与索引
- 在后续轮次切换回内置 PI Harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 Harness 存储了一个 sidecar 绑定，请实现 `reset(...)`，以便 OpenClaw 在所属 OpenClaw 会话被重置时清除它。

## 工具和媒体结果

核心会构造 OpenClaw 工具列表并将其传入已准备好的尝试中。当 Harness 执行动态工具调用时，请通过 Harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批以及消息工具输出与基于 PI 的运行共享同一条投递路径。

## 当前限制

- 公共导入路径是通用的，但某些 attempt / result 类型别名仍然保留 `Pi` 命名以维持兼容性。
- 第三方 Harness 安装仍是实验性的。在你确实需要原生会话运行时之前，请优先使用提供商插件。
- 支持跨轮次切换 Harness。不要在一个轮次中途、在原生工具、审批、助手文本或消息发送已经开始后切换 Harness。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
