---
read_when:
    - 你正在更改嵌入式智能体运行时或 Harness 注册表
    - 你正在从内置或受信任插件注册一个智能体 Harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 面向替换底层嵌入式智能体执行器的插件的实验性 SDK 界面
title: 智能体 Harness 插件
x-i18n:
    generated_at: "2026-04-23T19:26:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0822248298c61f9dda7ec342558e8cda7c936876060b471ed01dc6c90779010
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# 智能体 Harness 插件

**智能体 Harness** 是为一次已准备好的 OpenClaw 智能体轮次提供底层执行的执行器。
它不是模型提供商，不是渠道，也不是工具注册表。

仅将此界面用于内置或受信任的原生插件。该契约仍然是实验性的，因为其参数类型有意镜像当前的嵌入式运行器。

## 何时使用 Harness

当某个模型家族拥有自己的原生会话运行时，而普通的 OpenClaw 提供商传输层并不是正确抽象时，请注册一个智能体 Harness。

示例：

- 拥有线程和压缩能力的原生编码智能体服务器
- 必须流式传输原生计划/推理/工具事件的本地 CLI 或守护进程
- 除 OpenClaw 会话转录外，还需要维护自己 resume id 的模型运行时

不要仅仅为了添加新的 LLM API 而注册 Harness。对于普通的 HTTP 或 WebSocket 模型 API，请构建一个[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍负责的内容

在选择 Harness 之前，OpenClaw 已经完成了以下解析：

- 提供商和模型
- 运行时认证状态
- thinking 级别和上下文预算
- OpenClaw 转录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种划分是有意为之。Harness 运行的是一次已准备好的尝试；它不会选择提供商、替代渠道投递，也不会静默切换模型。

## 注册一个 Harness

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

OpenClaw 会在提供商/模型解析之后选择 Harness：

1. 现有会话中已记录的 Harness id 优先，这样配置/环境变更就不会将该转录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为尚未固定的会话强制使用具有该 id 的已注册 Harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 会强制使用内置的 PI Harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 会询问已注册的 Harness 是否支持已解析的提供商/模型。
5. 如果没有已注册的 Harness 匹配，OpenClaw 会使用 PI，除非已禁用 PI 回退。

插件 Harness 失败会表现为运行失败。在 `auto` 模式下，只有当没有已注册插件 Harness 支持已解析的提供商/模型时，才会使用 PI 回退。一旦某个插件 Harness 已认领一次运行，OpenClaw 就不会再通过 PI 重放同一轮次，因为这可能会改变认证/运行时语义，或导致副作用重复发生。

选定的 Harness id 会在一次嵌入式运行后，与会话 id 一起持久化保存。对于在 Harness 固定机制出现之前创建的旧会话，只要它们已有转录历史，就会被视为固定到 PI。在 PI 与原生插件 Harness 之间切换时，请使用新的/重置的会话。`/status` 会在 `Fast` 旁边显示诸如 `codex` 之类的非默认 Harness id；PI 不会显示，因为它是默认的兼容路径。

内置 Codex 插件将 `codex` 注册为其 Harness id。核心将其视为普通插件 Harness id；Codex 专用别名应属于插件或操作员配置，而不是共享运行时选择器。

## 提供商与 Harness 配对

大多数 Harness 也应注册一个提供商。提供商会让模型引用、认证状态、模型元数据和 `/model` 选择对 OpenClaw 的其余部分可见。然后 Harness 在 `supports(...)` 中认领该提供商。

内置 Codex 插件采用这种模式：

- provider id：`codex`
- 用户模型引用：`codex/gpt-5.5`、`codex/gpt-5.2`，或 Codex 应用服务器返回的其他模型
- harness id：`codex`
- 认证：合成的提供商可用性，因为 Codex Harness 拥有原生 Codex 登录/会话
- 应用服务器请求：OpenClaw 将裸模型 id 发送给 Codex，并由 Harness 与原生 app-server 协议通信

Codex 插件是增量式的。普通 `openai/gpt-*` 引用仍然是 OpenAI 提供商引用，并继续使用常规 OpenClaw 提供商路径。当你希望使用由 Codex 管理的认证、Codex 模型发现、原生线程和 Codex app-server 执行时，请选择 `codex/gpt-*`。`/model` 可以在 Codex app-server 返回的 Codex 模型之间切换，而无需 OpenAI 提供商凭证。

有关操作员设置、模型前缀示例和仅适用于 Codex 的配置，请参见
[Codex Harness](/zh-CN/plugins/codex-harness)。

OpenClaw 要求 Codex app-server 为 `0.118.0` 或更新版本。Codex 插件会检查 app-server 初始化握手，并阻止较旧或无版本服务器，以确保 OpenClaw 只在它已测试过的协议界面上运行。

### Codex app-server 工具结果中间件

当内置插件的清单声明 `contracts.embeddedExtensionFactories: ["codex-app-server"]` 时，它们还可以通过 `api.registerCodexAppServerExtensionFactory(...)` 附加 Codex app-server 专用的 `tool_result` 中间件。
这是面向受信任插件的扩展点，用于那些需要在原生 Codex Harness 内运行、并在工具输出回投到 OpenClaw 转录之前进行异步工具结果转换的场景。

### 原生 Codex Harness 模式

内置 `codex` Harness 是嵌入式 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置 `codex` 插件；如果你的配置使用受限 allowlist，还需要将 `codex` 包含在 `plugins.allow` 中。它不同于 `openai-codex/*`：

- `openai-codex/*` 通过常规 OpenClaw 提供商路径使用 ChatGPT/Codex OAuth
- `codex/*` 使用内置 Codex 提供商，并通过 Codex app-server 路由该轮次

当该模式运行时，Codex 负责原生线程 id、resume 行为、压缩以及 app-server 执行。OpenClaw 仍然负责聊天渠道、可见转录镜像、工具策略、审批、媒体投递和会话选择。当你需要证明只有 Codex app-server 路径能够认领该运行时，请使用 `embeddedHarness.runtime: "codex"` 并设置
`embeddedHarness.fallback: "none"`。该配置只是选择保护：Codex app-server 失败本来就会直接失败，而不会再通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 使用 `agents.defaults.embeddedHarness`
设为 `{ runtime: "auto", fallback: "pi" }` 来运行嵌入式智能体。在 `auto` 模式下，已注册插件 Harness 可以认领某个提供商/模型对。如果没有匹配项，OpenClaw 会回退到 PI。

当你需要在缺少插件 Harness 选择时直接失败，而不是使用 PI 时，请设置 `fallback: "none"`。已选中的插件 Harness 失败本来就会硬失败。这不会阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅 Codex 的嵌入式运行：

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

如果你希望任何已注册的插件 Harness 都能认领匹配模型，但又不希望 OpenClaw 静默回退到 PI，请保持 `runtime: "auto"` 并禁用回退：

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
        "model": "codex/gpt-5.5",
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
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` 可通过环境变量禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，如果请求的 Harness 未注册、不支持已解析的提供商/模型，或在产生轮次副作用之前就已失败，则会话会提前失败。对于仅 Codex 的部署，以及必须证明实际使用了 Codex app-server 路径的实时测试，这正是预期行为。

此设置仅控制嵌入式智能体 Harness。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商专用模型路由。

## 原生会话与转录镜像

Harness 可以维护原生 session id、thread id 或守护进程侧的 resume token。
请将这种绑定明确关联到 OpenClaw 会话，并持续将用户可见的助手/工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍是以下能力的兼容层：

- 渠道可见的会话历史
- 转录搜索和索引
- 在后续轮次切换回内置 PI Harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 Harness 存储了 sidecar 绑定，请实现 `reset(...)`，以便 OpenClaw 能在所属 OpenClaw 会话被重置时清除它。

## 工具和媒体结果

核心会构建 OpenClaw 工具列表，并将其传入已准备好的尝试中。
当 Harness 执行动态工具调用时，请通过 Harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可以让文本、图像、视频、音乐、TTS、审批和消息工具输出，与由 PI 支持的运行使用同一条投递路径。

## 当前限制

- 公共导入路径是通用的，但部分 attempt/result 类型别名仍然保留 `Pi` 命名以保持兼容性。
- 第三方 Harness 安装仍属实验性功能。在你确实需要原生会话运行时时，才应优先考虑它；否则请优先使用提供商插件。
- 支持跨轮次切换 Harness。不要在某一轮次中途、在原生工具、审批、助手文本或消息发送已经开始之后切换 Harness。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
