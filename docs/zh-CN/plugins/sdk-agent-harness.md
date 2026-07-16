---
read_when:
    - 你正在更改嵌入式 Agent 运行时或 harness 注册表
    - 你正在从内置或受信任的插件注册 Agent harness
    - 你需要了解 Codex 插件与模型提供商之间的关系
sidebarTitle: Agent Harness
summary: 用于替换底层嵌入式智能体执行器的实验性 SDK 接口面
title: Agent harness plugins
x-i18n:
    generated_at: "2026-07-16T11:53:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 862d53022e48b93c98e98162f76460433b76005cba3188342d0977b951044106
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

一个 **agent harness** 是用于执行单次已准备好的 OpenClaw 智能体轮次的底层执行器。它不是模型提供商，不是渠道，也不是工具注册表。有关面向用户的思维模型，请参阅 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

此接口仅用于内置或受信任的原生插件。该契约仍处于实验阶段，因为其参数类型有意与当前的嵌入式运行器保持一致。

## 何时使用 harness

当模型系列拥有自己的原生会话运行时，而常规 OpenClaw 提供商传输并非正确抽象时，请注册 agent harness：

- 拥有线程和压缩功能的原生编码智能体服务器
- 必须流式传输原生计划、推理和工具事件的本地 CLI 或守护进程
- 除 OpenClaw 会话记录之外还需要自身恢复 ID 的模型运行时

不要仅为了添加新的 LLM API 而注册 harness。对于常规 HTTP 或 WebSocket 模型 API，请构建[提供商插件](/zh-CN/plugins/sdk-provider-plugins)。

## 核心仍负责什么

在选择 harness 之前，OpenClaw 已经解析了：

- 提供商和模型
- 运行时身份验证状态，除非 harness 声明由其负责身份验证引导
- 思考级别和上下文预算
- OpenClaw 会话记录/会话文件
- 工作区、沙箱和工具策略
- 渠道回复回调和流式传输回调
- 模型回退和实时模型切换策略

harness 运行已准备好的尝试；它不会选择提供商、取代渠道交付，也不会静默切换模型。

### harness 负责的身份验证引导

默认情况下，核心会在调用 harness 之前解析提供商凭据。能够通过自身原生运行时完成身份验证的受信任 harness，可以在其静态 `AgentHarness` 注册上设置 `authBootstrap: "harness"`。随后，对于该 harness 声明负责的每次尝试，核心都会跳过通用提供商凭据引导和凭据缺失失败。

如果存在兼容且已明确选择或排序的 OpenClaw 身份验证配置文件及其限定范围的存储，核心仍会将其转发。harness 必须在发出模型请求前解析该配置文件或其原生凭据，将机密限定在本次尝试范围内，并呈现可操作的身份验证失败信息。不要为仅在部分情况下负责身份验证的 harness 设置此能力。

### 已验证的设置运行时工件

能够为首次运行设置提供推理能力的本地 harness，必须证明完成探测的实现。当 `params.captureRuntimeArtifact` 为 true 时，返回一个包含稳定 ID 和内容指纹的不透明 `result.runtimeArtifact`。注册匹配的 `runtimeArtifact.validate(...)` 能力，以便在不加载其他 harness 或扫描无关插件的情况下重新检查该绑定。

已验证的 OpenClaw 后续运行还会传递 `params.expectedRuntimeArtifact`。harness 必须将其与所获取的确切原生进程进行比较，如果二者不同，则必须在启动或恢复原生线程之前失败。普通智能体轮次会省略这两个字段，因此内容哈希不会进入常规请求热路径。远程/WebSocket harness 必须先具备服务器证明契约才能参与；仅有版本字符串不能作为工件身份。

已准备好的尝试还包含 `params.runtimePlan`，这是 OpenClaw 所有的策略包，用于在 OpenClaw 和原生 harness 之间必须保持共享的运行时决策：

- `runtimePlan.tools.normalize(...)` 和 `runtimePlan.tools.logDiagnostics(...)`，用于感知提供商的工具模式策略
- `runtimePlan.transcript.resolvePolicy(...)`，用于会话记录清理和工具调用修复策略
- `runtimePlan.delivery.isSilentPayload(...)`，用于共享 `NO_REPLY` 和媒体交付抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用于模型回退分类
- `runtimePlan.observability`，用于已解析的提供商/模型/harness 元数据

harness 可以将该计划用于需要与 OpenClaw 行为保持一致的决策，但应将其视为宿主所有的尝试状态：不要修改它，也不要用它在轮次内切换提供商/模型。

### 请求传输契约

`supports(ctx)` 在 `ctx.modelProvider` 中接收已解析的模型传输。两个不含机密且由提供商所有的事实用于描述所选路由：

- `runtimePolicy.compatibleIds` 列出提供商声明与该具体路由兼容的运行时 ID。策略缺失表示提供商未声明路由级兼容性；这并不意味着可以假定支持。
- `requestTransportOverrides: "none"` 表示无需复现任何编写的提供商/模型请求覆盖。`"present"` 表示存在编写的标头、身份验证传输、代理、TLS、本地服务、专用网络行为或请求参数。该事实不会公开这些值。

当 harness 无法复现已准备好的传输时，返回 `{ supported: false, reason }`。不要在选择完成后通过读取原始配置来推断支持情况。当身份验证准备产生多个重试路由时，单个 harness 必须支持所有这些路由才能分派。如果没有插件能够负责完整路由集，隐式选择将使用 OpenClaw；明确选择或持久化的插件选择则会以失败关闭。

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
    // params.onAgentEvent 以及其他已准备好的尝试字段。
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "我的原生智能体",
  description: "通过原生智能体守护进程运行所选模型。",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

此通用示例有意省略 `authBootstrap`。仅当 harness 满足上述契约时，才添加 `authBootstrap: "harness"`。

### 委托执行

harness 所有者可以将 `delegatedExecutionPluginIds` 设置为需要执行现有模型锁定会话的受信任插件 ID，例如由语音传输继续进行基于 Codex 的对话。这是静态所有者同意，而不是核心允许列表。请保持范围狭窄。

委托方仅获得工作准入和嵌入式执行权限。OpenClaw 要求提供完全匹配的已存储会话键、存储路径和会话 ID；`modelSelectionLocked:
true`；以及匹配的 `agentHarnessId` 和 `agentHarnessRuntimeOverride` 值。随后，运行将通过 harness 所有者限定范围。会话创建、修补、重置、删除、归档和 Gateway 网关变更仍仅限所有者执行。

## 选择策略

OpenClaw 在解析提供商/模型后选择 harness：

1. 模型范围的运行时策略优先。
2. 其次是提供商范围的运行时策略。
3. `auto` 会询问已注册的 harness 是否支持已解析的有效路由。仅凭提供商/模型前缀绝不会选择 harness。
4. 如果没有已注册的 harness 匹配，OpenClaw 将使用其嵌入式运行时。

插件 harness 失败会呈现为运行失败。在 `auto` 模式下，仅当没有已注册的插件 harness 支持已解析的提供商/模型时，才应用嵌入式回退。一旦插件 harness 声明负责某次运行，OpenClaw 就不会通过另一个运行时重放同一轮次，因为这可能改变身份验证/运行时语义或造成重复副作用。

配置的运行时策略对所需运行时仍具有权威性。持久化会话的 `agentHarnessId` 会在路由/身份验证准备仍待完成时保留其原生会话记录的所有权。二者都不能使不兼容的路由变得兼容：准备好的事实存在后，所选或固定的 harness 必须支持这些事实，否则运行将以失败关闭。`/status` 显示根据策略、持久化所有权和路由支持选择的有效运行时。
准备状态是显式的：缺少 `runtimePolicy` 时会保持未声明，而不会根据恰好存在的传输字段进行推断。
当 harness 负责的身份验证使多个物理路由仍未解析时，准备好的支持事实是它们兼容运行时 ID 的交集，并且只要任一候选项存在请求覆盖，就会报告请求覆盖。因此，一个未声明的候选项会使原生兼容集为空；`preparedAuth.source: "harness"` 是身份验证所有者，而不是推断路由支持的许可。

如果所选 harness 出乎预期，请启用 `agents/harness` 调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录：其中包括所选 harness ID、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

内置 Codex 插件将 `codex` 注册为其 harness ID。核心将其视为普通插件 harness ID；Codex 专用别名应位于插件或操作员配置中，而不是共享运行时选择器中。

## 提供商与 harness 配对

大多数 harness 还应注册提供商。提供商使模型引用、身份验证状态、模型元数据和 `/model` 选择对 OpenClaw 的其余部分可见。随后，harness 在 `supports(...)` 中声明负责该提供商。

内置 Codex 插件遵循此模式：

- 首选用户模型引用：`openai/gpt-5.6-sol`
- 兼容性引用：仍接受旧版 `codex/gpt-*` 引用，但新配置不应将其用作常规模型提供商/模型引用
- harness ID：`codex`
- 身份验证：合成的提供商可用性，因为 Codex harness 负责原生 Codex 登录/会话
- app-server 请求：OpenClaw 将裸模型 ID 发送给 Codex，并由 harness 与原生 app-server 协议通信

Codex 插件是增量式的。当运行时策略未设置或为 `auto` 时，OpenAI 仅可在其提供商所有的路由契约声明与 `codex` 兼容时选择 Codex：即无编写的请求覆盖、完全匹配的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由。仅凭 `openai/*` 前缀绝不会选择 Codex。自定义端点、Completions 适配器和编写的请求行为仍由 OpenClaw 处理。明文官方 HTTP 端点会被拒绝。旧版 `codex/gpt-*` 引用仍作为兼容性输入。请参阅
[OpenAI 隐式 agent runtime](/zh-CN/providers/openai#implicit-agent-runtime)。

有关操作员设置、模型前缀示例和仅限 Codex 的配置，请参阅
[Codex Harness](/zh-CN/plugins/codex-harness)。

Codex 插件强制执行 [Codex Harness](/zh-CN/plugins/codex-harness) 中记录的最低 app-server 版本。它会检查初始化握手并阻止旧版或无版本服务器，从而确保 OpenClaw 仅针对其已测试的协议接口运行。

### 工具结果中间件

内置插件以及显式启用且清单契约匹配的已安装插件，可以通过 `api.registerAgentToolResultMiddleware(...)` 附加与运行时无关的工具结果中间件，前提是其清单在 `contracts.agentToolResultMiddleware` 中声明了目标运行时 ID。此受信任接口用于执行异步工具结果转换，这些转换必须在 OpenClaw 或 Codex 将工具输出反馈给模型之前运行。

旧版内置插件仍可将
`api.registerCodexAppServerExtensionFactory(...)` 用于仅限 Codex app-server 的
中间件，但新的结果转换应使用运行时中立的 API。仅限嵌入式运行器的 `api.registerEmbeddedExtensionFactory(...)` 钩子已被
移除；嵌入式工具结果转换必须使用运行时中立的中间件。

### 终止结果分类

拥有自身协议投影的原生 harness 可以在已完成的轮次未产生
可见的助手文本时，使用
`openclaw/plugin-sdk/agent-harness-runtime` 中的
`classifyAgentHarnessTerminalOutcome(...)`。该辅助函数返回 `empty`、`reasoning-only` 或
`planning-only`，以便 OpenClaw 的回退策略决定是否使用
其他模型重试。`planning-only` 要求 harness 提供显式的 `planText`
字段；OpenClaw 不会根据助手文本推断该字段。该辅助函数有意不对提示词错误、进行中的轮次以及
`NO_REPLY` 等有意保持静默的
回复进行分类。

### Agent 结束时的副作用

原生 harness 在完成一次尝试后，必须调用
`openclaw/plugin-sdk/agent-harness-runtime` 中的
`runAgentEndSideEffects(...)`。它会分派可移植的 `agent_end` 钩子和 OpenClaw 的研究捕获，
且不会延迟交互式回复。对于本地非交互式运行，如果必须等这些
副作用完成后才能结束尝试，请使用 `awaitAgentEndSideEffects(...)`。
这两个辅助函数都接受与
`runAgentHarnessAgentEndHook(...)` 相同的 `{ event, ctx }` 载荷；它们的失败不会改变已完成的
尝试结果。

### 用户输入和工具表面

暴露运行时级用户输入请求的原生 harness 应使用
`openclaw/plugin-sdk/agent-harness-runtime` 中的用户输入辅助函数来格式化
提示，通过 OpenClaw 的阻塞式回复路径传递提示，并将
选项或自由格式答案规范化回运行时的原生响应形态。
该辅助函数可保持渠道/TUI 的呈现一致，同时各 harness 继续自行管理
协议解析和待处理请求的生命周期。

需要类似 PI 的紧凑工具路由的原生 harness 应使用
`openclaw/plugin-sdk/agent-harness-tool-runtime` 中的
`createAgentHarnessToolSurfaceRuntime(...)`。它负责
工具搜索/代码模式控制选择、本地模型的精简默认值、
运行时兼容的 schema 过滤、隐藏目录执行、目录
填充以及目录清理。Harness 仍负责其 SDK 特有的工具
转换和原生执行回调。

### 原生 Codex harness 模式

内置的 `codex` harness 是嵌入式 OpenClaw
智能体轮次的原生 Codex 模式。请先启用内置的 `codex` 插件；如果配置使用限制性允许列表，请在
`plugins.allow` 中加入 `codex`。原生 app-server
配置应使用 `openai/gpt-*`；只有当生效路由声明兼容 Codex 时，OpenAI 智能体轮次才会选择 Codex harness。
旧版 Codex 模型引用应使用 `openclaw doctor --fix` 修复，而旧版 `codex/*`
模型引用仍作为原生 harness 的兼容别名保留。

此模式运行时，Codex 负责原生线程 ID、恢复行为、
压缩和 app-server 执行。OpenClaw 仍负责聊天渠道、
可见的记录镜像、工具策略、审批、媒体传递和会话
选择。当需要证明只有 Codex app-server 路径可以接管本次运行时，请使用提供商/模型
`agentRuntime.id: "codex"`。显式插件
运行时会采取故障关闭策略；Codex app-server 选择失败和运行时失败
不会通过其他运行时重试。

## 运行时严格性

默认情况下，OpenClaw 使用 `auto` 提供商/模型运行时策略：已注册的
插件 harness 可以接管兼容的生效路由；如果没有匹配项，则由嵌入式
运行时处理该轮次。仅凭提供商/模型前缀绝不会
选择 harness。当缺少 harness 时应直接失败，而不是
路由到嵌入式运行时，请使用显式的提供商/模型插件运行时，例如
`agentRuntime.id: "codex"`。显式选择不会让
不兼容的路由变得兼容。选定的插件 harness 发生故障时始终会
直接失败。这不会阻止显式的提供商/模型
`agentRuntime.id: "openclaw"`。

对于仅限 Codex 的嵌入式运行：

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

如果希望一个规范模型使用 CLI 后端，请将运行时配置到该
模型条目中：

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

按智能体覆盖时使用相同的模型作用域结构：

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

如下所示的旧版整个智能体运行时示例会被忽略：

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

使用显式插件运行时后，如果请求的
harness 未注册、不支持解析后的提供商/模型，或在产生轮次副作用之前
失败，会话将提前失败。对于仅限 Codex 的
部署以及必须证明 Codex app-server 路径确实正在
使用的实时测试，这是有意设计的行为。

此设置仅控制嵌入式智能体 harness。它不会禁用
图像、视频、音乐、TTS、PDF 或其他特定于提供商的模型路由。

## 原生会话和记录镜像

Harness 可以保留原生会话 ID、线程 ID 或守护进程端的恢复
令牌。请明确保持该绑定与 OpenClaw 会话的关联，并
继续将用户可见的助手/工具输出镜像到 OpenClaw
记录中。

OpenClaw 记录仍是以下功能的兼容层：

- 渠道可见的会话历史记录
- 记录搜索和索引
- 在后续轮次切换回内置 OpenClaw harness
- 通用 `/new`、`/reset` 和会话删除行为

如果 harness 存储旁路绑定，请实现 `reset(...)`，以便 OpenClaw
在重置其所属的 OpenClaw 会话时将其清除。

## 工具和媒体结果

核心会构建 OpenClaw 工具列表，并将其传入准备好的
尝试。当 harness 执行动态工具调用时，请通过 harness 结果结构
返回工具结果，而不是自行发送渠道媒体。

这样可确保文本、图像、视频、音乐、TTS、审批和消息工具
输出与由 OpenClaw 支持的运行使用同一条传递路径。

### 终止工具结果

`AgentHarnessAttemptParams.observeToolTerminal` 是由宿主负责的终止
结果累加器。执行 OpenClaw 动态工具或原生
工具的 harness，必须在每个工具达到一个终止结果时、尝试结果最终确定前调用它。不执行工具的 harness 无需
调用它。

从执行边界报告事实：

- 如果存在协议调用 ID，请传入该 ID、规范工具名称以及
  经过准备或钩子重写后实际传递给工具的参数。
- 当验证、审批或其他防护措施
  在工具实现开始前阻止调用时，请设置 `executionStarted: false`。一旦可能已经发生分派，
  请保守地报告 `true`。
- 报告 `outcome: "success"` 或 `outcome: "failure"`。请包含运行时可用的结构化
  失败字段，而不是根据显示文本推断失败。
- 仅对未使用 OpenClaw 工具
  定义的原生工具使用 `nativeMutation`。在此提供协议负责的变更和重放事实；不要
  将 OpenClaw 的变更分类器复制到 harness 中。

该回调返回对应调用的规范解析结果。请将其
`lastToolError` 传递至 `AgentHarnessAttemptResult`，并在 harness 投影中使用其执行、
参数和副作用事实，而不是派生
并行状态。宿主会在无关工具成功后继续保留尚未解决的变更失败，
仅在匹配的操作成功后才将其清除。

为了与较旧的实验性
harness 保持源代码兼容，该回调仍为可选。对于执行工具的 harness，可选并不意味着可以忽略：
如果没有终止报告，OpenClaw 就无法在后续工具调用中保留变更工具失败的真实状态，
包括安静完成的 Heartbeat。

## 当前限制

- 公共导入路径是通用的，但部分尝试/结果类型别名
  仍为兼容性保留旧版名称。
- 第三方 harness 安装仍属实验性功能。在需要原生会话运行时之前，请优先使用提供商插件。
- 支持跨轮次切换 harness。在原生工具、审批、助手文本或消息
  发送已经开始后，请勿在轮次中途切换 harness。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview)
- [运行时辅助函数](/zh-CN/plugins/sdk-runtime)
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-CN/plugins/codex-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
