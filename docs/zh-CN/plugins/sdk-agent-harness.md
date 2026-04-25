---
read_when:
    - 你正在更改嵌入式智能体运行时或 harness 注册表
    - 你正在从内置或受信任的插件注册一个智能体 harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 用于替换底层嵌入式智能体执行器的实验性插件 SDK 接口
title: Agent harness plugins
x-i18n:
    generated_at: "2026-04-25T20:41:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9742e8a1e5df64da939452b36767ccb01f25a388fd1307e9d75aeb73f5699947
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**智能体 harness** 是为一次已准备好的 OpenClaw 智能体轮次执行的底层执行器。它不是模型提供商，不是渠道，也不是工具注册表。
关于面向用户的心智模型，请参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

仅对内置或受信任的原生插件使用此接口。该契约仍处于实验阶段，因为其参数类型有意映射当前的嵌入式运行器。

## 何时使用 harness

当某个模型家族拥有自己的原生会话运行时，而普通的 OpenClaw provider 传输层是错误抽象时，请注册一个智能体 harness。

示例：

- 拥有线程和压缩机制的原生编码智能体服务器
- 必须流式传输原生计划 / 推理 / 工具事件的本地 CLI 或守护进程
- 除了 OpenClaw 会话转录之外，还需要自身 resume id 的模型运行时

**不要** 仅仅为了添加一个新的 LLM API 而注册 harness。对于普通的 HTTP 或 WebSocket 模型 API，请构建一个 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责什么

在选择 harness 之前，OpenClaw 已经解析完成：

- provider 和 model
- 运行时认证状态
- 思考级别和上下文预算
- OpenClaw 转录 / 会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种划分是有意设计的。harness 运行的是一次已准备好的尝试；它不会选择提供商、替换渠道投递，或静默切换模型。

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

OpenClaw 会在 provider / model 解析之后选择 harness：

1. 现有会话中记录的 harness id 优先，因此配置 / 环境变更不会将该转录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制使用具有该 id 的已注册 harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置的 PI harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会让已注册的 harness 询问自己是否支持已解析的 provider / model。
5. 如果没有匹配的已注册 harness，除非禁用了 PI 回退，否则 OpenClaw 会使用 PI。

插件 harness 失败会显示为运行失败。在 `auto` 模式下，只有当没有任何已注册的插件 harness 支持已解析的 provider / model 时，才会使用 PI 回退。一旦某个插件 harness 已认领这次运行，OpenClaw 不会再通过 PI 重放同一轮次，因为这可能改变认证 / 运行时语义或造成副作用重复。

嵌入式运行后，所选 harness id 会与 session id 一起持久化。对于在 harness 固定机制出现之前创建的旧会话，一旦它们已有转录历史，就会被视为固定到 PI。若要在 PI 与原生插件 harness 之间切换，请使用新的 / 已重置的会话。`/status` 会在 `Fast` 旁边显示诸如 `codex` 之类的非默认 harness id；PI 会保持隐藏，因为它是默认兼容路径。如果所选 harness 令人意外，请启用 `agents/harness` 调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。其中包含所选 harness id、选择原因、运行时 / 回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

内置 Codex 插件将 `codex` 注册为其 harness id。核心将其视为普通插件 harness id；Codex 特定别名应属于插件或运维配置，而不是共享运行时选择器。

## provider 与 harness 的配对

大多数 harness 也应注册一个 provider。provider 让模型引用、认证状态、模型元数据以及 `/model` 选择对 OpenClaw 的其余部分可见。然后 harness 在 `supports(...)` 中认领该 provider。

内置 Codex 插件遵循此模式：

- 首选用户模型引用：`openai/gpt-5.5` 加上
  `embeddedHarness.runtime: "codex"`
- 兼容性引用：旧版 `codex/gpt-*` 引用仍然被接受，但新配置不应将其作为普通 provider / model 引用使用
- harness id：`codex`
- 认证：合成 provider 可用性，因为 Codex harness 拥有原生 Codex 登录 / 会话
- app-server 请求：OpenClaw 向 Codex 发送裸模型 id，并让 harness 与原生 app-server 协议通信

Codex 插件是增量式的。普通 `openai/gpt-*` 引用仍会使用正常的 OpenClaw provider 路径，除非你通过 `embeddedHarness.runtime: "codex"` 强制使用 Codex harness。旧版 `codex/gpt-*` 引用仍会为了兼容性而选择 Codex provider 和 harness。

关于运维设置、模型前缀示例和仅适用于 Codex 的配置，请参见
[Codex harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 为 `0.125.0` 或更高版本。Codex 插件会检查 app-server 初始化握手，并阻止较旧或未标明版本的服务器，从而确保 OpenClaw 只运行在其已测试过的协议接口之上。`0.125.0` 这一最低版本包含了在 Codex `0.124.0` 中落地的原生 MCP hook 负载支持，同时将 OpenClaw 固定在更新且经过测试的稳定版本线上。

### 工具结果中间件

当内置插件的清单在 `contracts.agentToolResultMiddleware` 中声明目标运行时 id 时，它们可以通过 `api.registerAgentToolResultMiddleware(...)` 挂接与运行时无关的工具结果中间件。这个受信任的接口用于异步工具结果转换，且这些转换必须在 PI 或 Codex 将工具输出反馈给模型之前运行。

旧版内置插件仍可使用
`api.registerCodexAppServerExtensionFactory(...)` 来实现仅用于 Codex app-server 的中间件，但新的结果转换应使用与运行时无关的 API。
仅适用于 Pi 的 `api.registerEmbeddedExtensionFactory(...)` hook 已被移除；
Pi 工具结果转换必须使用与运行时无关的中间件。

### 原生 Codex harness 模式

内置的 `codex` harness 是嵌入式 OpenClaw
智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件，如果你的配置使用了限制性 allowlist，则还需在 `plugins.allow` 中包含 `codex`。原生 app-server 配置应使用 `openai/gpt-*` 并配合 `embeddedHarness.runtime: "codex"`。若要通过 PI 使用 Codex OAuth，请改用 `openai-codex/*`。旧版 `codex/*`
模型引用仍作为原生 harness 的兼容别名保留。

在该模式运行时，Codex 负责原生 thread id、resume 行为、压缩和 app-server 执行。OpenClaw 仍负责聊天渠道、可见转录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex app-server 路径能够认领本次运行时，请使用 `embeddedHarness.runtime: "codex"` 且不要覆盖 `fallback`。显式插件运行时默认已经是失败关闭模式。仅当你明确希望由 PI 处理缺失的 harness 选择时，才设置 `fallback: "pi"`。Codex app-server 失败本就会直接失败，而不会再通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 运行嵌入式智能体时，`agents.defaults.embeddedHarness`
会设置为 `{ runtime: "auto", fallback: "pi" }`。在 `auto` 模式下，已注册的插件 harness 可以认领某个 provider / model 配对。如果没有匹配项，OpenClaw 会回退到 PI。

在 `auto` 模式下，当你需要缺失的插件 harness 选择直接失败而不是使用 PI 时，请设置 `fallback: "none"`。像 `runtime: "codex"` 这样的显式插件运行时默认已经是失败关闭模式，除非在同一配置或环境变量覆盖范围中设置了 `fallback: "pi"`。所选插件 harness 失败始终会硬失败。这不会阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅使用 Codex 的嵌入式运行：

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

如果你希望任何已注册的插件 harness 都能认领匹配模型，但绝不希望 OpenClaw 静默回退到 PI，请保留 `runtime: "auto"` 并禁用回退：

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

每个智能体的覆盖使用相同结构：

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

`OPENCLAW_AGENT_RUNTIME` 仍会覆盖已配置的运行时。使用
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可通过环境禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，当请求的 harness 未注册、不支持已解析的 provider / model，或在产生轮次副作用之前失败时，会话会提前失败。这是 Codex 专用部署以及必须证明确实在使用 Codex app-server 路径的实时测试中的有意行为。

此设置只控制嵌入式智能体 harness。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商特定的模型路由。

## 原生会话与转录镜像

harness 可以保留原生 session id、thread id 或守护进程侧 resume token。
请将这种绑定明确地与 OpenClaw 会话关联起来，并持续将用户可见的助手 / 工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍然是以下能力的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮次切回内置 PI harness
- 通用 `/new`、`/reset` 和会话删除行为

如果你的 harness 存储了 sidecar 绑定，请实现 `reset(...)`，以便在所属 OpenClaw 会话被重置时，OpenClaw 能清除它。

## 工具与媒体结果

核心会构建 OpenClaw 工具列表，并将其传入已准备好的尝试。
当 harness 执行动态工具调用时，请通过 harness 结果结构返回工具结果，而不是自己发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批以及消息工具输出与 PI 支持的运行共享同一投递路径。

## 当前限制

- 公共导入路径是通用的，但某些 attempt / result 类型别名仍保留 `Pi` 名称以维持兼容性。
- 第三方 harness 安装仍处于实验阶段。在你确实需要原生会话运行时之前，请优先选择提供商插件。
- 支持跨轮次切换 harness。不要在某一轮次的中途切换 harness，尤其是在原生工具、审批、助手文本或消息发送已经开始之后。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
