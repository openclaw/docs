---
read_when:
    - 你正在更改嵌入式智能体运行时或 harness 注册表
    - 你正在从内置或受信任插件注册一个智能体 harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 用于替换底层嵌入式智能体执行器的插件实验性 SDK 接口
title: 智能体 harness 插件
x-i18n:
    generated_at: "2026-04-23T21:49:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 966d685627b11651fbd0c7fe00a7e3e412c14b39511845ecfcdc4366fa9f8767
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**智能体 harness** 是为一个已准备好的 OpenClaw 智能体轮次提供的底层执行器。它不是模型提供商，不是渠道，也不是工具注册表。

仅对内置或受信任的原生插件使用此接口。该契约仍然是实验性的，因为参数类型有意映射当前的嵌入式运行器。

## 何时使用 harness

当某个模型家族拥有自己的原生会话运行时，而常规的 OpenClaw 提供商传输层并不是合适抽象时，请注册一个智能体 harness。

示例：

- 拥有线程与压缩能力的原生编码智能体服务器
- 必须流式传输原生计划/推理/工具事件的本地 CLI 或守护进程
- 除了 OpenClaw 会话 transcript 之外，还需要自己的 resume id 的模型运行时

**不要** 仅仅为了添加一个新的 LLM API 而注册 harness。对于常规的 HTTP 或 WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍负责的内容

在选择 harness 之前，OpenClaw 已经解析了：

- provider 和 model
- 运行时认证状态
- 思考级别和上下文预算
- OpenClaw transcript/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种拆分是有意设计的。harness 负责运行一个已准备好的尝试；它不会选择提供商、替换渠道投递，也不会静默切换模型。

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

OpenClaw 会在 provider/model 解析之后选择一个 harness：

1. 已有会话中记录的 harness id 优先生效，因此配置/环境变量的变化不会将该 transcript 热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制使用具有该 id 的已注册 harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置的 PI harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会让已注册的 harness 判断它们是否支持已解析的 provider/model。
5. 如果没有匹配的已注册 harness，OpenClaw 会使用 PI，除非已禁用 PI 回退。

插件 harness 失败会以运行失败的形式呈现。在 `auto` 模式下，只有当没有已注册的插件 harness 支持已解析的 provider/model 时，才会使用 PI 回退。一旦某个插件 harness 已经接管一次运行，OpenClaw 就不会再通过 PI 重放同一轮次，因为这可能改变认证/运行时语义或造成副作用重复。

在一次嵌入式运行之后，所选的 harness id 会与 session id 一起持久化。对于在 harness 固定机制出现之前创建的旧会话，一旦其拥有 transcript 历史，就会被视为固定到 PI。要在 PI 与原生插件 harness 之间切换，请使用新的/已重置的会话。`/status` 会在 `Fast` 旁边显示诸如 `codex` 这样的非默认 harness id；由于 PI 是默认兼容路径，因此会被隐藏。如果所选 harness 出乎你的预期，请启用 `agents/harness` 调试日志，并检查 Gateway 网关中的结构化 `agent harness selected` 记录。其中包含所选 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下各插件候选项的支持结果。

内置的 Codex 插件将 `codex` 注册为其 harness id。核心将其视为普通的插件 harness id；Codex 专用别名应放在插件或运维配置中，而不是共享运行时选择器中。

## provider 与 harness 配对

大多数 harness 也应该注册一个 provider。provider 会让模型引用、认证状态、模型元数据和 `/model` 选择对 OpenClaw 的其他部分可见。随后，harness 会在 `supports(...)` 中声明接管该 provider。

内置的 Codex 插件遵循这一模式：

- provider id：`codex`
- 用户模型引用：规范形式为 `openai/gpt-5.5` 加上 `embeddedHarness.runtime: "codex"`；旧版 `codex/gpt-*` 引用仍为兼容性而继续接受
- harness id：`codex`
- 认证：合成的 provider 可用性，因为 Codex harness 负责原生 Codex 登录/会话
- app-server 请求：OpenClaw 会将裸模型 id 发送给 Codex，并让 harness 与原生 app-server 协议通信

Codex 插件是增量式的。普通的 `openai/gpt-*` 引用仍会使用常规的 OpenClaw provider 路径，除非你通过 `embeddedHarness.runtime: "codex"` 强制使用 Codex harness。较旧的 `codex/gpt-*` 引用仍会为兼容性而选择 Codex provider 和 harness。

有关运维设置、模型前缀示例和仅限 Codex 的配置，请参阅 [Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 为 `0.118.0` 或更新版本。Codex 插件会检查 app-server 初始化握手，并阻止较旧或未标注版本的服务器，以确保 OpenClaw 仅在其已测试过的协议接口上运行。

### Codex app-server tool-result 中间件

当插件清单声明 `contracts.embeddedExtensionFactories: ["codex-app-server"]` 时，内置插件还可以通过 `api.registerCodexAppServerExtensionFactory(...)` 挂载特定于 Codex app-server 的 `tool_result` 中间件。这是一个受信任插件的扩展点，适用于那些需要在原生 Codex harness 内部运行的异步工具结果转换，然后再将工具输出投射回 OpenClaw transcript。

### 原生 Codex harness 模式

内置的 `codex` harness 是嵌入式 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置的 `codex` 插件；如果你的配置使用了严格的 allowlist，还要在 `plugins.allow` 中包含 `codex`。新配置应使用 `openai/gpt-*` 搭配 `embeddedHarness.runtime: "codex"`。旧版 `openai-codex/*` 和 `codex/*` 模型引用仍保留为兼容性别名。

当该模式运行时，Codex 负责原生线程 id、resume 行为、压缩和 app-server 执行。OpenClaw 仍负责聊天渠道、可见 transcript 镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex app-server 路径可以接管该运行时，请使用 `embeddedHarness.runtime: "codex"` 搭配 `embeddedHarness.fallback: "none"`。该配置仅是一个选择保护措施：Codex app-server 失败本来就会直接失败，而不会通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 运行嵌入式智能体时，`agents.defaults.embeddedHarness` 设置为 `{ runtime: "auto", fallback: "pi" }`。在 `auto` 模式下，已注册的插件 harness 可以接管某个 provider/model 组合。如果没有匹配项，OpenClaw 会回退到 PI。

当你需要在缺少插件 harness 选择时直接失败，而不是使用 PI 时，请设置 `fallback: "none"`。已选中的插件 harness 失败本来就会硬失败。这不会阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅使用 Codex 的嵌入式运行：

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

如果你希望任何已注册的插件 harness 都可以接管匹配的模型，但又不希望 OpenClaw 静默回退到 PI，请保留 `runtime: "auto"` 并禁用回退：

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

每个智能体的覆盖项使用相同的结构：

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

`OPENCLAW_AGENT_RUNTIME` 仍会覆盖已配置的运行时。使用 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可以通过环境变量禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，如果请求的 harness 未注册、不支持已解析的 provider/model，或者在产生轮次副作用之前就已失败，则会话会提前失败。对于仅使用 Codex 的部署，以及必须证明 Codex app-server 路径确实在使用中的实时测试，这是有意设计的。

此设置仅控制嵌入式智能体 harness。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商特定的模型路由。

## 原生会话与 transcript 镜像

harness 可能会保留原生 session id、thread id 或守护进程侧的 resume token。请将这种绑定显式地与 OpenClaw 会话关联起来，并继续将用户可见的助手/工具输出镜像到 OpenClaw transcript 中。

OpenClaw transcript 仍然是以下内容的兼容层：

- 渠道可见的会话历史
- transcript 搜索与索引
- 在后续轮次中切换回内置的 PI harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 harness 存储了 sidecar 绑定，请实现 `reset(...)`，以便 OpenClaw 在所属 OpenClaw 会话被重置时可以清除它。

## 工具与媒体结果

核心会构造 OpenClaw 工具列表，并将其传入已准备好的尝试中。当 harness 执行动态工具调用时，请通过 harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批以及消息工具输出，与由 PI 支持的运行使用相同的投递路径。

## 当前限制

- 公共导入路径是通用的，但某些 attempt/result 类型别名仍然保留 `Pi` 命名以维持兼容性。
- 第三方 harness 安装仍是实验性的。在你确实需要原生会话运行时之前，优先使用提供商插件。
- 支持跨轮次切换 harness。不要在一个轮次进行到一半时切换 harness，尤其是在原生工具、审批、助手文本或消息发送已经开始之后。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
