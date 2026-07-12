---
read_when:
    - 你正在更改嵌入式 Agent Runtimes 或 harness 注册表
    - 你正在从内置或受信任的插件注册 Agent harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 供替换底层嵌入式智能体执行器的插件使用的实验性 SDK 接口
title: Agent harness plugins
x-i18n:
    generated_at: "2026-07-12T14:38:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: be2717d9986c30e931d3443dc6b70542ab20badb4ad0921e797fbad280513d1e
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Agent harness** 是已准备好的单次 OpenClaw 智能体轮次的底层执行器。它不是模型提供商，不是渠道，也不是工具注册表。有关面向用户的心智模型，请参阅 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

仅将此接口用于内置或可信的原生插件。此契约仍处于实验阶段，因为其参数类型有意与当前的嵌入式运行器保持一致。

## 何时使用 harness

当某个模型系列拥有自己的原生会话运行时，并且常规 OpenClaw 提供商传输并非合适的抽象时，请注册 Agent harness：

- 自行管理线程和压缩的原生编码智能体服务器
- 必须以流式方式传输原生计划、推理和工具事件的本地 CLI 或守护进程
- 除 OpenClaw 会话记录外，还需要自身恢复 ID 的模型运行时

不要仅为了添加新的 LLM API 而注册 harness。对于常规 HTTP 或 WebSocket 模型 API，请构建[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍负责的内容

在选择 harness 之前，OpenClaw 已经解析了：

- 提供商和模型
- 运行时身份验证状态，除非 harness 声明由其负责身份验证引导
- 思考级别和上下文预算
- OpenClaw 记录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

harness 运行一次已准备好的尝试；它不会选择提供商、取代渠道交付，也不会静默切换模型。

### harness 负责的身份验证引导

默认情况下，核心会在调用 harness 前解析提供商凭据。能够通过自身原生运行时进行身份验证的可信 harness，可以在其静态 `AgentHarness` 注册中设置 `authBootstrap: "harness"`。随后，对于该 harness 声明处理的每次尝试，核心都会跳过通用的提供商凭据引导和缺少凭据错误。

如果存在兼容且经过明确选择或排序的 OpenClaw 身份验证配置文件及其限定作用域的存储，核心仍会将其转发。harness 必须在发出模型请求前解析该配置文件或其原生凭据，将密钥的作用域限制在本次尝试内，并提供可采取行动的身份验证错误。不要为仅在某些情况下负责身份验证的 harness 设置此能力。

### 已验证的设置运行时工件

能够为首次运行设置提供推理能力的本地 harness，必须证明完成探测的实现。当 `params.captureRuntimeArtifact` 为 true 时，返回包含稳定 ID 和内容指纹的不透明 `result.runtimeArtifact`。注册相匹配的 `runtimeArtifact.validate(...)` 能力，用于重新检查该绑定，而不加载其他 harness 或扫描无关插件。

已验证的 Crestodian 延续也会传入 `params.expectedRuntimeArtifact`。harness 必须将其与实际获取的原生进程进行比较；如果二者不同，必须在启动或恢复原生线程前失败。普通智能体轮次会省略这两个字段，因此内容哈希不会进入常规请求的热路径。远程/WebSocket harness 必须具备服务器证明契约后才能参与；仅有版本字符串不足以作为工件身份。

已准备好的尝试还包含 `params.runtimePlan`，这是 OpenClaw 负责管理的策略包，用于必须在 OpenClaw 与原生 harness 之间保持一致的运行时决策：

- `runtimePlan.tools.normalize(...)` 和 `runtimePlan.tools.logDiagnostics(...)`：用于感知提供商的工具架构策略
- `runtimePlan.transcript.resolvePolicy(...)`：用于记录清理和工具调用修复策略
- `runtimePlan.delivery.isSilentPayload(...)`：用于共享的 `NO_REPLY` 和媒体交付抑制
- `runtimePlan.outcome.classifyRunResult(...)`：用于模型回退分类
- `runtimePlan.observability`：用于已解析的提供商、模型和 harness 元数据

harness 可以使用该计划来执行需要与 OpenClaw 行为保持一致的决策，但应将其视为由宿主负责的尝试状态：不要修改它，也不要利用它在轮次内切换提供商或模型。

### 请求传输契约

`supports(ctx)` 通过 `ctx.modelProvider` 接收已解析的模型传输。以下两个不含密钥、由提供商负责的事实描述了所选路由：

- `runtimePolicy.compatibleIds` 列出提供商声明与该具体路由兼容的运行时 ID。缺少此策略意味着提供商未声明路由级兼容性；这并不表示可以假定支持。
- `requestTransportOverrides: "none"` 表示无需复现任何由提供商/模型定义的请求覆盖。`"present"` 表示存在自定义请求头、身份验证传输、代理、TLS、本地服务、专用网络行为或请求参数。此事实不会公开这些值。

当 harness 无法复现已准备好的传输时，返回 `{ supported: false, reason }`。选择完成后，不要通过读取原始配置来推断支持情况。当身份验证准备过程产生多个重试路由时，必须有同一个 harness 支持所有路由，才能进行分派。如果没有插件能够负责完整路由集合，隐式选择将使用 OpenClaw；明确或持久化的插件选择则会采用失败关闭策略。

## 注册 harness

**导入：** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "我的原生智能体 harness",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "有效路由与 harness 不兼容" };
  },

  async runAttempt(params) {
    // 启动或恢复你的原生线程。
    // 使用 params.prompt、params.tools、params.images、params.onPartialReply、
    // params.onAgentEvent 以及其他已准备的尝试字段。
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "我的原生智能体",
  description: "通过原生智能体守护进程运行选定的模型。",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

此通用示例有意省略了 `authBootstrap`。仅当 harness 满足上述契约时，才添加
`authBootstrap: "harness"`。

### 委托执行

harness 所有者可以将 `delegatedExecutionPluginIds` 设置为需要执行现有模型锁定会话的受信任插件的 ID，例如由语音传输继续 Codex 支持的对话。这是所有者的静态授权，而不是核心允许列表。应严格限制其范围。

被委托方仅获得工作准入和嵌入式执行权限。OpenClaw 要求提供完全匹配的已存储会话键、存储路径和会话 ID；`modelSelectionLocked:
true`；以及匹配的 `agentHarnessId` 和 `agentHarnessRuntimeOverride` 值。随后，此运行将限定在 harness 所有者的权限范围内。会话创建、修补、重置、删除、归档以及 Gateway 网关变更仍仅限所有者执行。

## 选择策略

OpenClaw 在完成提供商/模型解析后选择 harness：

1. 模型范围的运行时策略优先。
2. 其次是提供商范围的运行时策略。
3. `auto` 会询问已注册的 harness 是否支持解析后的有效路由。仅凭提供商/模型前缀绝不会选择 harness。
4. 如果没有匹配的已注册 harness，OpenClaw 将使用其嵌入式运行时。

插件 harness 故障会作为运行故障呈现。在 `auto` 模式下，仅当没有已注册的插件 harness 支持解析后的提供商/模型时，才会使用嵌入式回退。一旦插件 harness 接管某次运行，OpenClaw 就不会通过其他运行时重放同一轮次，因为这可能改变身份验证/运行时语义或造成重复副作用。

配置的运行时策略对所需运行时始终具有权威性。在路由/身份验证准备仍未完成时，持久化会话的 `agentHarnessId` 会继续拥有其原生转录记录。两者都无法使不兼容的路由变得兼容：准备好的事实一旦存在，选定或固定的 harness 就必须支持它们，否则运行将以关闭方式失败。`/status` 会显示根据策略、持久化所有权和路由支持情况选择的有效运行时。
准备状态是明确的：缺少 `runtimePolicy` 时会保持未声明状态，而不会根据恰好存在的传输字段进行推断。
当 harness 所有的身份验证尚未解析出唯一的物理路由时，准备好的支持事实是这些路由的兼容运行时 ID 的交集；如果任何候选路由具有请求覆盖，也会报告该信息。因此，只要其中一个候选路由未声明，原生兼容性就为空；`preparedAuth.source: "harness"` 表示身份验证所有者，并不代表可以据此推断路由支持。

如果选中的 harness 出乎预期，请启用 `agents/harness` 调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录：其中包含选中的 harness ID、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

内置 Codex 插件将 `codex` 注册为其 harness id。核心将其视为普通的插件 harness id；Codex 专用别名应位于插件或操作员配置中，而不是共享运行时选择器中。

## 提供商与 harness 配对

大多数 harness 还应注册提供商。提供商让 OpenClaw 的其余部分能够看到模型引用、身份验证状态、模型元数据和 `/model` 选择。随后，harness 会在 `supports(...)` 中声明支持该提供商。

内置 Codex 插件遵循此模式：

- 首选用户模型引用：`openai/gpt-5.6-sol`
- 兼容性引用：仍接受旧版 `codex/gpt-*` 引用，但新配置不应将其用作常规提供商/模型引用
- harness id：`codex`
- 身份验证：合成的提供商可用性，因为 Codex harness 负责原生 Codex 登录/会话
- app-server 请求：OpenClaw 将不含前缀的模型 id 发送给 Codex，并由 harness 与原生 app-server 协议通信

Codex 插件以增量方式生效。未设置运行时策略或将其设为 `auto` 时，仅当提供商所拥有的路由契约声明与 `codex` 兼容时，OpenAI 才能选择 Codex：即精确匹配官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且没有自行设定的请求覆盖项。仅有 `openai/*` 前缀绝不会选择 Codex。自定义端点、Completions 适配器以及自行设定的请求行为仍由 OpenClaw 处理。明文的官方 HTTP 端点会被拒绝。较旧的 `codex/gpt-*` 引用仍可作为兼容性输入。请参阅
[OpenAI 隐式 Agent runtime](/zh-CN/providers/openai#implicit-agent-runtime)。

有关操作员设置、模型前缀示例和仅限 Codex 的配置，请参阅
[Codex Harness](/zh-CN/plugins/codex-harness)。

Codex 插件会强制执行 [Codex Harness](/zh-CN/plugins/codex-harness) 中记录的最低 app-server 版本。它会检查 initialize 握手并阻止较旧或未标明版本的服务器，从而确保 OpenClaw 仅针对经过测试的协议接口运行。

### 工具结果中间件

当内置插件和明确启用且清单契约匹配的已安装插件在其清单的 `contracts.agentToolResultMiddleware` 中声明目标运行时 id 时，可以通过 `api.registerAgentToolResultMiddleware(...)` 附加不依赖特定运行时的工具结果中间件。这个可信接口用于异步转换工具结果，并且这些转换必须在 OpenClaw 或 Codex 将工具输出反馈给模型之前运行。

旧版内置插件仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 注册仅适用于 Codex app-server 的中间件，但新的结果转换应使用不依赖特定运行时的 API。仅适用于嵌入式运行器的 `api.registerEmbeddedExtensionFactory(...)` 钩子已被移除；嵌入式工具结果转换必须使用不依赖特定运行时的中间件。

### 终端结果分类

拥有自身协议投影的原生 harness，在已完成的轮次未产生可见的助手文本时，可以使用
`openclaw/plugin-sdk/agent-harness-runtime` 中的
`classifyAgentHarnessTerminalOutcome(...)`。该辅助函数返回 `empty`、`reasoning-only` 或
`planning-only`，以便 OpenClaw 的回退策略决定是否使用其他模型重试。
`planning-only` 要求 harness 提供显式的 `planText` 字段；OpenClaw 不会根据助手文本推断该字段。该辅助函数有意不对提示词错误、进行中的轮次以及 `NO_REPLY` 等有意保持静默的回复进行分类。

### Agent 结束时的副作用

原生 harness 必须在完成一次尝试后，调用
`openclaw/plugin-sdk/agent-harness-runtime` 中的
`runAgentEndSideEffects(...)`。它会分派可移植的 `agent_end` 钩子和 OpenClaw 的研究捕获，同时不会延迟交互式回复。对于本地非交互式运行，如果必须等到这些副作用完成后才能结束尝试，请使用 `awaitAgentEndSideEffects(...)`。这两个辅助函数都接受与
`runAgentHarnessAgentEndHook(...)` 相同的 `{ event, ctx }` 载荷；它们的失败不会改变已完成尝试的结果。

### 用户输入和工具表面

公开运行时级用户输入请求的原生 harness 应使用
`openclaw/plugin-sdk/agent-harness-runtime` 中的用户输入辅助函数来格式化提示词、通过 OpenClaw 的阻塞式回复路径进行传递，并将选择题/自由格式答案规范化回运行时的原生响应结构。该辅助函数可保持渠道/TUI 呈现一致，同时各 harness 仍负责自身的协议解析和待处理请求生命周期。

需要类似 PI 的紧凑工具路由的原生 harness 应使用
`openclaw/plugin-sdk/agent-harness-tool-runtime` 中的
`createAgentHarnessToolSurfaceRuntime(...)`。它负责工具搜索/代码模式控制选择、本地模型精简默认值、与运行时兼容的 schema 过滤、隐藏目录执行、目录加载和目录清理。Harness 仍负责其 SDK 特定的工具转换和原生执行回调。

### Native Codex harness 模式

内置的 `codex` harness 是嵌入式 OpenClaw 智能体轮次的原生 Codex 模式。请先启用内置的 `codex` 插件；如果你的配置使用限制性允许列表，还需将 `codex` 加入 `plugins.allow`。原生 app-server 配置应使用 `openai/gpt-*`；仅当有效路由声明兼容 Codex 时，OpenAI 智能体轮次才会选择 Codex harness。旧版 Codex 模型引用应使用 `openclaw doctor --fix` 修复，而旧版 `codex/*` 模型引用仍作为原生 harness 的兼容性别名保留。

此模式运行时，Codex 负责原生线程 ID、恢复行为、压缩和 app-server 执行。OpenClaw 仍负责聊天渠道、可见的对话记录镜像、工具策略、审批、媒体传递和会话选择。当你需要证明只有 Codex app-server 路径能够接管运行时，请使用提供商/模型的 `agentRuntime.id: "codex"`。显式插件运行时采用故障关闭策略；Codex app-server 选择失败和运行时失败不会通过其他运行时重试。

## 运行时严格性

默认情况下，OpenClaw 使用 `auto` 提供商/模型运行时策略：已注册的插件 harness 可以接管兼容的有效路由；如果没有匹配项，则由嵌入式运行时处理该轮次。仅凭提供商/模型前缀绝不会选择 harness。如果缺少 harness 时应失败，而不是路由到嵌入式运行时，请使用显式的提供商/模型插件运行时，例如
`agentRuntime.id: "codex"`。显式选择不会使不兼容的路由变得兼容。所选插件 harness 的失败始终会导致硬失败。这不会阻止显式的提供商/模型
`agentRuntime.id: "openclaw"`。

对于仅使用 Codex 的嵌入式运行：

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
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

如果你想为一个规范模型使用 CLI 后端，请将运行时配置放在该模型条目中：

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

每个智能体的覆盖配置使用相同的模型级结构：

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

类似下面的旧版整智能体运行时示例会被忽略：

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

使用显式插件运行时后，如果请求的 harness 未注册、不支持解析后的提供商/模型，或在产生轮次副作用之前失败，会话将提前失败。对于仅使用 Codex 的部署，以及必须证明 Codex app-server 路径确实正在使用的实时测试，这是有意设计的行为。

此设置仅控制嵌入式智能体 harness。它不会禁用图像、视频、音乐、TTS、PDF 或其他提供商特定的模型路由。

## 原生会话和对话记录镜像

Harness 可以保留原生会话 ID、线程 ID 或守护进程端的恢复令牌。请确保该绑定与 OpenClaw 会话显式关联，并持续将用户可见的助手/工具输出镜像到 OpenClaw 对话记录中。

OpenClaw 对话记录仍是以下功能的兼容层：

- 渠道可见的会话历史记录
- 对话记录搜索和索引
- 在后续轮次中切换回内置 OpenClaw harness
- 通用的 `/new`、`/reset` 和会话删除行为

如果你的 harness 存储了 sidecar 绑定，请实现 `reset(...)`，以便 OpenClaw 在重置所属的 OpenClaw 会话时将其清除。

## 工具和媒体结果

核心会构建 OpenClaw 工具列表，并将其传入准备好的尝试。当 harness 执行动态工具调用时，应通过 harness 结果结构返回工具结果，而不是自行发送渠道媒体。

这样可让文本、图像、视频、音乐、TTS、审批和消息工具输出使用与 OpenClaw 支持的运行相同的传递路径。

## 当前限制

- 公共导入路径是通用的，但某些尝试/结果类型别名仍为兼容性保留旧版名称。
- 第三方 harness 安装仍处于实验阶段。在需要原生会话运行时之前，优先使用提供商插件。
- 支持在不同轮次之间切换 harness。在原生工具、审批、助手文本或消息发送已经开始后，请勿在轮次中途切换 harness。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助函数](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
