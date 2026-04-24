---
read_when:
    - 你正在更改嵌入式智能体运行时或 harness 注册表
    - 你正在从内置或受信任的插件注册一个智能体 harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 供替换底层嵌入式智能体执行器的插件使用的实验性 SDK 表面
title: 智能体 harness 插件
x-i18n:
    generated_at: "2026-04-24T19:57:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: ffb57530e6259952c8dde473a69052f578b081f28659e22b72347fa64e497a38
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**智能体 harness** 是针对一次已准备好的 OpenClaw 智能体轮次的底层执行器。它不是模型提供商，不是渠道，也不是工具注册表。

仅将此表面用于内置或受信任的原生插件。该契约仍属实验性，因为参数类型有意映射当前的嵌入式运行器。

## 何时使用 harness

当某个模型家族拥有自己的原生会话运行时，而常规的 OpenClaw 提供商传输抽象并不适合时，请注册一个智能体 harness。

示例：

- 一个拥有线程和压缩能力的原生 coding-agent 服务器
- 一个必须流式传输原生计划/推理/工具事件的本地 CLI 或守护进程
- 一个除了 OpenClaw 会话转录之外，还需要自己的恢复 id 的模型运行时

不要仅为了添加一个新的 LLM API 而注册 harness。对于普通的 HTTP 或 WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责什么

在选择 harness 之前，OpenClaw 已经解析了：

- provider 和 model
- 运行时认证状态
- thinking 级别和上下文预算
- OpenClaw 转录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式回调
- 模型回退和实时模型切换策略

这种划分是有意设计的。harness 运行的是一次已准备好的尝试；它不会选择提供商，不会替换渠道投递，也不会静默切换模型。

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

OpenClaw 会在 provider/model 解析之后选择 harness：

1. 现有会话中记录的 harness id 优先生效，因此配置/环境更改不会将该转录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制使用具有该 id 的已注册 harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置 PI harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会让已注册的 harness 询问它们是否支持已解析的 provider/model。
5. 如果没有匹配的已注册 harness，除非禁用了 PI 回退，否则 OpenClaw 会使用 PI。

插件 harness 失败会表现为运行失败。在 `auto` 模式下，只有当没有任何已注册的插件 harness 支持已解析的 provider/model 时，才会使用 PI 回退。一旦某个插件 harness 已经接管了一次运行，OpenClaw 就不会通过 PI 重放同一轮次，因为那可能改变认证/运行时语义，或导致副作用重复。

选定的 harness id 会在一次嵌入式运行后与会话 id 一起持久化。对于在 harness 固定机制引入之前创建的旧会话，只要它们已有转录历史，就会被视为固定到 PI。若要在 PI 与原生插件 harness 之间切换，请使用新的/重置后的会话。`/status` 会在 `Fast` 旁边显示诸如 `codex` 这样的非默认 harness id；PI 由于是默认兼容路径，因此保持隐藏。如果选定的 harness 出乎你的预期，请启用 `agents/harness` 调试日志，并检查 Gateway 网关中的结构化 `agent harness selected` 记录。它包含选中的 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

内置 Codex 插件将 `codex` 注册为其 harness id。核心将其视为普通的插件 harness id；Codex 专用别名应属于插件或运维配置，而不是共享运行时选择器。

## provider 与 harness 的配对

大多数 harness 也应同时注册一个 provider。provider 负责让模型引用、认证状态、模型元数据和 `/model` 选择对 OpenClaw 其余部分可见。然后 harness 在 `supports(...)` 中声明它支持该 provider。

内置 Codex 插件遵循这种模式：

- provider id：`codex`
- 用户 model 引用：`openai/gpt-5.5` 加 `embeddedHarness.runtime: "codex"`；旧版 `codex/gpt-*` 引用仍会为兼容性继续接受
- harness id：`codex`
- 认证：合成的 provider 可用性，因为 Codex harness 负责原生 Codex 登录/会话
- app-server 请求：OpenClaw 将裸 model id 发送给 Codex，并让 harness 与原生 app-server 协议通信

Codex 插件是增量性的。普通 `openai/gpt-*` 引用会继续使用常规 OpenClaw provider 路径，除非你通过 `embeddedHarness.runtime: "codex"` 强制使用 Codex harness。较旧的 `codex/gpt-*` 引用仍会为兼容性选择 Codex provider 和 harness。

关于运维设置、模型前缀示例和仅 Codex 配置，请参见 [Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 为 `0.118.0` 或更高版本。Codex 插件会检查 app-server 初始化握手，并阻止较旧或未带版本信息的服务器，以确保 OpenClaw 只针对其已测试过的协议表面运行。

### 工具结果中间件

当插件清单在 `contracts.agentToolResultMiddleware` 中声明了目标 harness id 时，插件可以通过 `api.registerAgentToolResultMiddleware(...)` 附加与 harness 无关的工具结果中间件。这是用于异步工具结果转换的接缝，这类转换必须在 PI 或 Codex 将工具输出反馈回模型之前运行。

旧版内置插件仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 来实现仅适用于 Codex app-server 的中间件，但新的结果转换应使用与 harness 无关的 API。
仅适用于 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 钩子对于工具结果转换已被弃用；仅在仍需要直接 Pi 嵌入式运行器事件的内置兼容代码中继续保留它。

### 原生 Codex harness 模式

内置的 `codex` harness 是嵌入式 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件；如果你的配置使用限制性 allowlist，还需将 `codex` 加入 `plugins.allow`。原生 app-server 配置应使用带有 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-*`。如果要通过 PI 使用 Codex OAuth，请改用 `openai-codex/*`。旧版 `codex/*` model 引用仍保留为原生 harness 的兼容别名。

在该模式运行时，Codex 负责原生线程 id、恢复行为、压缩和 app-server 执行。OpenClaw 仍负责聊天渠道、可见转录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex app-server 路径可以接管该运行时，请使用 `embeddedHarness.runtime: "codex"` 和 `embeddedHarness.fallback: "none"`。该配置只是一个选择保护：Codex app-server 失败本来就会直接失败，而不会通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 运行嵌入式智能体时会将 `agents.defaults.embeddedHarness` 设为 `{ runtime: "auto", fallback: "pi" }`。在 `auto` 模式下，已注册的插件 harness 可以接管某个 provider/model 对。如果没有匹配项，OpenClaw 会回退到 PI。

当你需要在缺少插件 harness 选择时直接失败，而不是使用 PI 时，请设置 `fallback: "none"`。已选中的插件 harness 失败本来就会硬失败。这不会阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅 Codex 的嵌入式运行：

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

如果你希望任何已注册的插件 harness 都能接管匹配的模型，但又不希望 OpenClaw 静默回退到 PI，请保持 `runtime: "auto"` 并禁用回退：

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

每个智能体的覆盖使用相同的结构：

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

`OPENCLAW_AGENT_RUNTIME` 仍会覆盖已配置的运行时。使用 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可从环境变量中禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

在禁用回退后，如果请求的 harness 未注册、不支持已解析的 provider/model，或在产生轮次副作用之前失败，则会话会提前失败。这是有意设计的，适用于仅 Codex 的部署，以及必须证明实际使用了 Codex app-server 路径的实时测试。

此设置只控制嵌入式智能体 harness。它不会禁用图像、视频、音乐、TTS、PDF 或其他 provider 专用的模型路由。

## 原生会话与转录镜像

harness 可以保留原生会话 id、线程 id 或守护进程侧恢复令牌。请将这种绑定明确关联到 OpenClaw 会话，并继续将用户可见的 assistant/tool 输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍是以下内容的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮次切换回内置 PI harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 harness 存储了 sidecar 绑定，请实现 `reset(...)`，以便 OpenClaw 在重置所属 OpenClaw 会话时能够清除它。

## 工具和媒体结果

核心会构建 OpenClaw 工具列表，并将其传入已准备好的尝试中。当 harness 执行动态工具调用时，请通过 harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批和消息工具输出，与基于 PI 的运行共享同一条投递路径。

## 当前限制

- 公共导入路径是通用的，但某些 attempt/result 类型别名仍保留 `Pi` 命名以兼容旧用法。
- 第三方 harness 安装仍属实验性。在你确实需要原生会话运行时时，才优先考虑它；否则请优先使用提供商插件。
- 支持跨轮次切换 harness。不要在某一轮中途、当原生工具、审批、assistant 文本或消息发送已经开始后切换 harness。

## 相关内容

- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
