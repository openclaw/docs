---
read_when:
    - 你正在更改嵌入式智能体运行时或 harness 注册表
    - 你正在从内置或受信任插件注册一个智能体 harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 面向替换底层嵌入式智能体执行器的插件的实验性 SDK 接口
title: Agent harness plugins
x-i18n:
    generated_at: "2026-04-25T01:51:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**智能体 harness** 是为一个已准备好的 OpenClaw 智能体轮次提供底层执行的组件。它不是模型提供商，不是渠道，也不是工具注册表。
关于面向用户的心智模型，请参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

仅将此接口用于内置或受信任的原生插件。该契约
仍然是实验性的，因为其参数类型有意映射当前的
嵌入式运行器。

## 何时使用 harness

当某个模型家族拥有自己的原生会话
运行时，而常规的 OpenClaw 提供商传输层是错误抽象时，请注册一个智能体 harness。

示例：

- 拥有线程和压缩能力的原生编码智能体服务器
- 必须流式传输原生计划 / 推理 / 工具事件的本地 CLI 或守护进程
- 除 OpenClaw
  会话转录之外，还需要自己恢复 id 的模型运行时

不要只是为了添加一个新的 LLM API 而注册 harness。对于普通的 HTTP 或
WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍然负责什么

在选择 harness 之前，OpenClaw 已经解析了：

- 提供商和模型
- 运行时认证状态
- 思考级别和上下文预算
- OpenClaw 转录 / 会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种划分是有意为之。harness 负责执行一个已准备好的尝试；它不会选择
提供商、替换渠道投递，或静默切换模型。

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

OpenClaw 会在提供商 / 模型解析之后选择一个 harness：

1. 现有会话中记录的 harness id 优先，因此配置 / 环境变化不会
   将该转录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为
   尚未被固定的会话强制使用具有该 id 的已注册 harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置的 PI harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会询问已注册的 harness，它们是否支持已解析的
   提供商 / 模型。
5. 如果没有匹配的已注册 harness，OpenClaw 会使用 PI，除非禁用了 PI 回退。

插件 harness 故障会表现为运行失败。在 `auto` 模式下，只有当没有已注册的插件 harness 支持已解析的
提供商 / 模型时，才会使用 PI 回退。一旦某个插件 harness 已经接管了一次运行，OpenClaw 就不会通过 PI 重新执行同一轮次，因为这可能改变认证 / 运行时语义
或导致副作用重复。

在一次嵌入式运行之后，所选的 harness id 会与会话 id 一起持久化。
在 harness 固定机制出现之前创建的旧会话，只要已有转录历史，就会被视为已固定到 PI。
在 PI 和原生插件 harness 之间切换时，请使用新的 / 已重置的会话。`/status` 会在 `Fast` 旁边显示诸如 `codex`
这样的非默认 harness id；PI 因为是默认兼容路径而保持隐藏。
如果所选 harness 让你感到意外，请启用 `agents/harness` 调试日志，并检查 Gateway 网关 的结构化 `agent harness selected` 记录。它包含
所选 harness id、选择原因、运行时 / 回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

内置的 Codex 插件会将 `codex` 注册为其 harness id。核心将其视为普通的插件 harness id；Codex 专用别名应放在插件
或操作员配置中，而不是放在共享的运行时选择器中。

## 提供商与 harness 的配对

大多数 harness 也应该注册一个提供商。提供商使模型引用、
认证状态、模型元数据以及 `/model` 选择对 OpenClaw 的其余部分可见。
然后，harness 在 `supports(...)` 中声明支持该提供商。

内置的 Codex 插件遵循此模式：

- 首选的用户模型引用：`openai/gpt-5.5` 加上
  `embeddedHarness.runtime: "codex"`
- 兼容性引用：旧版 `codex/gpt-*` 引用仍然被接受，但新的
  配置不应将其用作普通提供商 / 模型引用
- harness id：`codex`
- 认证：合成的提供商可用性，因为 Codex harness 拥有
  原生 Codex 登录 / 会话
- app-server 请求：OpenClaw 向 Codex 发送裸模型 id，并让
  harness 与原生 app-server 协议通信

Codex 插件是增量式的。普通的 `openai/gpt-*` 引用仍会使用
常规 OpenClaw 提供商路径，除非你通过
`embeddedHarness.runtime: "codex"` 强制使用 Codex harness。较旧的 `codex/gpt-*` 引用
出于兼容性考虑仍会选择 Codex 提供商和 harness。

关于操作员设置、模型前缀示例和仅 Codex 配置，请参见
[Codex harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 为 `0.118.0` 或更高版本。Codex 插件会检查
app-server 初始化握手，并阻止较旧或未标明版本的服务器，以便
OpenClaw 仅针对其已测试过的协议接口运行。

### 工具结果中间件

内置插件可以通过
`api.registerAgentToolResultMiddleware(...)` 附加运行时无关的工具结果中间件，前提是
其清单在 `contracts.agentToolResultMiddleware` 中声明了目标运行时 id。这个受信任的接口
用于必须在 PI 或 Codex 将
工具输出送回模型之前运行的异步工具结果转换。

旧版内置插件仍然可以使用
`api.registerCodexAppServerExtensionFactory(...)` 来实现仅适用于 Codex app-server 的
中间件，但新的结果转换应使用运行时无关 API。
仅适用于 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 钩子已被移除；
Pi 工具结果转换必须使用运行时无关中间件。

### 原生 Codex harness 模式

内置的 `codex` harness 是嵌入式 OpenClaw
智能体轮次的原生 Codex 模式。请先启用内置的 `codex` 插件，并在
你的配置使用限制性 allowlist 时，将 `codex` 包含在
`plugins.allow` 中。原生 app-server 配置应使用 `openai/gpt-*`，并设置 `embeddedHarness.runtime: "codex"`。
如果要通过 PI 使用 Codex OAuth，请改用 `openai-codex/*`。旧版 `codex/*`
模型引用仍然保留为原生 harness 的兼容性别名。

当此模式运行时，Codex 负责原生线程 id、恢复行为、
压缩以及 app-server 执行。OpenClaw 仍然负责聊天渠道、
可见转录镜像、工具策略、批准、媒体投递和会话选择。
当你需要证明只有 Codex app-server 路径能够接管该运行时，请使用 `embeddedHarness.runtime: "codex"`，且不要设置 `fallback` 覆盖。
显式插件运行时默认已经是失败即关闭。只有在你明确希望缺失的 harness 选择由 PI 处理时，才设置 `fallback: "pi"`。
Codex app-server 故障本来就会直接失败，而不会通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 会以 `agents.defaults.embeddedHarness`
设置为 `{ runtime: "auto", fallback: "pi" }` 的方式运行嵌入式智能体。在 `auto` 模式下，已注册的插件
harness 可以声明接管某个提供商 / 模型对。如果没有匹配项，OpenClaw 会回退到 PI。

在 `auto` 模式下，当你需要在缺失插件 harness
选择时直接失败而不是使用 PI，请设置 `fallback: "none"`。显式插件运行时，例如
`runtime: "codex"`，默认已经是失败即关闭，除非在同一配置或环境覆盖作用域中设置了 `fallback: "pi"`。
所选插件 harness 的故障始终会硬失败。这不会阻止显式的 `runtime: "pi"` 或
`OPENCLAW_AGENT_RUNTIME=pi`。

对于仅 Codex 的嵌入式运行：

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

如果你希望任何已注册的插件 harness 都可以接管匹配的模型，但又绝不希望 OpenClaw 静默回退到 PI，请保持 `runtime: "auto"` 并禁用
回退：

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

`OPENCLAW_AGENT_RUNTIME` 仍然会覆盖已配置的运行时。使用
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可通过
环境变量禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

在禁用回退后，如果请求的 harness 未注册、
不支持已解析的提供商 / 模型，或在产生轮次副作用之前失败，会话就会提前失败。这对于仅 Codex 的部署以及必须证明
Codex app-server 路径确实在使用中的在线测试来说，是有意设计的行为。

此设置只控制嵌入式智能体 harness。它不会禁用
图像、视频、音乐、TTS、PDF 或其他提供商特定的模型路由。

## 原生会话和转录镜像

harness 可以保留原生会话 id、线程 id 或守护进程侧恢复令牌。
请让这种绑定明确关联到 OpenClaw 会话，并继续将用户可见的助手 / 工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍然是以下场景的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮次切换回内置 PI harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 harness 存储了 sidecar 绑定，请实现 `reset(...)`，以便 OpenClaw 能够在所属 OpenClaw 会话被重置时
清除它。

## 工具和媒体结果

核心会构造 OpenClaw 工具列表，并将其传入已准备好的尝试中。
当 harness 执行动态工具调用时，请通过
harness 结果结构返回工具结果，而不是自己发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、批准以及消息工具输出
与基于 PI 的运行使用相同的投递路径。

## 当前限制

- 公共导入路径是通用的，但一些 attempt / result 类型别名
  出于兼容性考虑仍然带有 `Pi` 名称。
- 第三方 harness 安装仍处于实验阶段。在你确实需要原生会话运行时之前，
  优先使用提供商插件。
- 支持跨轮次切换 harness。不要在一个轮次进行到一半时切换 harness，
  特别是在原生工具、批准、助手文本或消息发送已经开始之后。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
