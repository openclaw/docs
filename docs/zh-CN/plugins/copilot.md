---
read_when:
    - 你想为智能体使用 GitHub Copilot SDK harness
    - 你需要 `copilot` 运行时的配置示例
    - 你正在将智能体接入订阅版 Copilot（github / openclaw / copilot），并希望它通过 Copilot CLI 运行
summary: 通过外部 GitHub Copilot SDK harness 运行 OpenClaw 嵌入式智能体轮次
title: Copilot SDK harness
x-i18n:
    generated_at: "2026-06-27T02:40:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

外部 `@openclaw/copilot` 插件让 OpenClaw 通过 GitHub Copilot CLI（`@github/copilot-sdk`）运行嵌入式订阅 Copilot 智能体轮次，而不是使用内置 PI harness。

当你希望由 Copilot CLI 会话拥有底层 Agent loop 时，请使用 Copilot SDK harness：原生工具执行、原生压缩（`infiniteSessions`），以及 `copilotHome` 下由 CLI 管理的线程状态。OpenClaw 仍然拥有聊天渠道、会话文件、模型选择、OpenClaw 动态工具（桥接）、审批、媒体投递、可见转录镜像、`/btw` 附带问题（由树内 PI fallback 处理，请参阅[附带问题（`/btw`）](#side-questions-btw)），以及 `openclaw doctor`。

如需了解更宽泛的模型/提供商/运行时拆分，请从 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。

## 要求

- 已安装 `@openclaw/copilot` 插件的 OpenClaw。
- 如果你的配置使用 `plugins.allow`，请包含 `copilot`（插件声明的清单 id）。如果限制性允许列表使用 npm 风格的 `@openclaw/copilot` 包名，即使配置了 `agentRuntime.id: "copilot"`，插件也会被阻止，运行时不会加载。
- 一个可驱动 Copilot CLI 的 GitHub Copilot 订阅（或用于无头/cron 运行的 `gitHubToken` 环境变量/凭证配置项）。
- 可写的 `copilotHome` 目录。当 OpenClaw 提供 Agent 目录时，harness 默认使用 `<agentDir>/copilot`；否则使用 `~/.openclaw/agents/<agentId>/copilot`，以实现完整的按 Agent 隔离。

`openclaw doctor` 会运行插件的 [Doctor 合约](#doctor)，用于声明式会话状态所有权和未来的兼容性迁移。它不会运行 Copilot CLI 环境探测。

## 插件安装

Copilot 运行时是外部插件，因此核心 `openclaw` 包不会携带 `@github/copilot-sdk` 依赖或其特定平台的 `@github/copilot-<platform>-<arch>` CLI 二进制文件。二者合计约 260 MB，因此只为选择启用此运行时的智能体安装它们：

```bash
openclaw plugins install @openclaw/copilot
```

当你首次选择 `github-copilot/*` 模型，**并且**你的配置通过 `agentRuntime: { id: "copilot" }` 将该模型（或其提供商）选择加入 Copilot agent runtime 时，向导会安装该插件（见下方[快速开始](#quickstart)）。如果没有选择加入，openclaw 会使用其内置的 GitHub Copilot 提供商，并且永远不会安装运行时插件。

运行时按以下顺序解析 SDK：

1. 从已安装的 `@openclaw/copilot` 包执行 `import("@github/copilot-sdk")`。
2. 知名 fallback 目录 `~/.openclaw/npm-runtime/copilot/`（旧版按需安装目标）。

缺少 SDK 时会抛出单一错误，错误码为 `COPILOT_SDK_MISSING`，并附带上面的插件重装命令。

## 快速开始

将一个模型（或一个提供商）固定到 harness：

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

两种路由方式等价。当只有该模型应通过 harness 路由时，在单个模型条目上使用 `agentRuntime.id`；当该提供商下的所有模型都应使用它时，在提供商上设置 `agentRuntime.id`。

`github-copilot/auto` 是可移植的起点。具名 Copilot 模型取决于账号和组织策略，因此只有在确认已认证的 Copilot CLI 暴露该模型后，才应固定某一个模型。

## 支持的提供商

harness 声明支持规范的 `github-copilot` 提供商（与 `extensions/github-copilot` 拥有的 id 相同）：

- `github-copilot`

当所选模型具有非空 `baseUrl`，并且 API 形态为以下之一时，它也支持自定义 `models.providers` 条目：

- `openai-responses`
- `openai-completions`
- `ollama`（OpenAI 兼容补全）
- `azure-openai-responses`
- `anthropic-messages`

`openai`、`anthropic`、`google` 和 `ollama` 等原生提供商 id 仍由其原生运行时拥有。通过 Copilot BYOK 路由端点时，请使用不同的自定义提供商 id。

Copilot BYOK 端点必须是公网 HTTPS URL。harness 会向 Copilot SDK 提供每次尝试专用的 loopback 代理 URL，然后通过 OpenClaw 的受保护 fetch 路径转发提供商流量，使 DNS 固定和 SSRF 策略仍由 OpenClaw 拥有。对于本地 Ollama、LM Studio 或局域网模型服务器，请使用原生 OpenClaw 运行时。

## BYOK

Copilot BYOK 使用 SDK 的会话级自定义提供商合约。OpenClaw 会传递已解析的模型端点、API key、bearer-token 模式、headers、模型 id，以及上下文/输出限制，而不会把提供商传输逻辑移入核心。

例如：

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

BYOK 会话会与订阅会话以及其他端点或凭据指纹分别建立键。轮换 key、headers、模型或端点会创建新的 Copilot SDK 会话，而不是恢复不兼容的状态。

## 凭证

在 `runCopilotAttempt` 期间应用的按 Agent 优先级：

1. 尝试输入上的**显式 `useLoggedInUser: true`**。使用 Agent 的 `copilotHome` 下解析出的 Copilot CLI 已登录用户。
2. 尝试输入上的**显式 `gitHubToken`**（带 `profileId` + `profileVersion`）。适用于直接 CLI 调用和测试，其中调用方希望绕过凭证配置项解析。
3. 来自 `EmbeddedRunAttemptParams` 形态的**合约解析 `resolvedApiKey` + `authProfileId`**。这是**生产主路径**：核心会在调用 harness 前解析智能体配置的 `github-copilot` 凭证配置项（通过 `src/infra/provider-usage.auth.ts:resolveProviderAuths`），harness 会直接使用这两个字段。这让 `github-copilot:<profile>` 凭证配置项能够在无头/cron/多配置项设置中端到端工作，而无需环境变量。
4. 用于没有配置凭证配置项的直接 CLI/dogfood 运行的**环境变量 fallback**。运行时按以下优先级检查变量，镜像已发布的 `github-copilot` 提供商（`extensions/github-copilot/auth.ts`）以及已记录的 Copilot SDK 设置：
   1. `OPENCLAW_GITHUB_TOKEN` -- harness 专用覆盖；设置它可以为 OpenClaw harness 固定 token，而不干扰系统范围的 `gh` / Copilot CLI 配置。
   2. `COPILOT_GITHUB_TOKEN` -- 标准 Copilot SDK / CLI 环境变量。
   3. `GH_TOKEN` -- 标准 `gh` CLI 环境变量（匹配现有 `github-copilot` 提供商优先级）。
   4. `GITHUB_TOKEN` -- 通用 GitHub token fallback。

   第一个非空值获胜；空字符串视为不存在。合成的池配置项 id 为 `env:<NAME>`，profileVersion 是 token 的不可逆 sha256 指纹，因此轮换环境变量值会干净地使客户端池失效。

5. 没有可用 token 信号时，默认使用 `useLoggedInUser`。

每个智能体都会获得专用的 `copilotHome`，因此同一台机器上的不同智能体之间不会泄露 Copilot CLI token、会话和配置。默认值是在宿主向 harness 交付 Agent 目录时使用 `<agentDir>/copilot`（将 SDK 状态与同一目录中的 OpenClaw `models.json` / `auth-profiles.json` 隔离），否则使用 `~/.openclaw/agents/<agentId>/copilot`。当你需要自定义位置时（例如用于迁移的共享挂载），可在尝试输入上用 `copilotHome: <path>` 覆盖。

当需要直接 token 时，实时 harness 测试使用 `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN`。共享实时测试设置会在把真实凭证配置项暂存进隔离测试 home 后，有意清理 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 和 `GITHUB_TOKEN`，因此通过专用实时测试变量传递 `gh auth token` 值，可以避免误跳过，而不会把 token 暴露给无关套件。

## 配置表面

harness 从每次尝试输入（`runCopilotAttempt({...})`）以及 `extensions/copilot/src/` 内的一小组环境默认值读取配置：

- `copilotHome` — 按 Agent 的 CLI 状态目录（默认值见上文）。
- `model` — 字符串或 `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。省略时，OpenClaw 使用智能体的常规模型选择，并由 harness 验证已解析的提供商是否受支持。
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`。从 `auto-reply/thinking.ts` 中 OpenClaw 的 `ThinkLevel` / `ReasoningLevel` 解析映射而来。
- `infiniteSessionConfig` — SDK `infiniteSessions` 块的可选覆盖，由 `harness.compact` 驱动。默认值可安全保持不变。
- `hooksConfig` — 可选的原生 Copilot SDK `SessionHooks` 兼容性配置，用于工具/MCP、用户提示、会话和错误回调。它与 OpenClaw 的可移植生命周期钩子分离。
- `permissionPolicy` — SDK `onPermissionRequest` 处理器的可选覆盖，用于内置 SDK 工具种类（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）。默认使用 `rejectAllPolicy` 作为安全网；实际上 SDK 从不调用这些种类，因为每个桥接的 OpenClaw 工具都以 `overridesBuiltInTool: true` 和 `skipPermission: true` 注册，因此 100% 的工具调用都会流经 OpenClaw 包装的 `execute()`。参阅[权限和 ask_user](#permissions-and-ask_user)。
- `enableSessionTelemetry` — 可选的 SDK 会话遥测标志。

OpenClaw 插件钩子不需要 Copilot 专用尝试配置。harness 会通过标准 harness helper 运行 `before_prompt_build`（以及旧版 `before_agent_start` 兼容性钩子）、`llm_input`、`llm_output` 和 `agent_end`。成功的 SDK 压缩还会运行 `before_compaction` 和 `after_compaction`。桥接的 OpenClaw 工具继续运行 `before_tool_call` 并报告 `after_tool_call`；`hooksConfig` 保留给没有可移植等价物的原生 SDK 专用回调。

OpenClaw 的其余部分不需要了解这些字段。其他插件、渠道和核心代码只会看到标准 `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` 形态。

## 压缩

当 `harness.compact` 运行时，Copilot SDK harness 会：

1. 恢复已跟踪的 SDK 会话，但不继续挂起的工作。
2. 调用 SDK 的会话级历史压缩 RPC。
3. 返回 SDK 压缩结果，而不会在工作区下写入兼容性标记文件。

OpenClaw 侧转录镜像（见下文）会继续接收压缩后的消息，因此面向用户的聊天历史保持一致。

## 转录镜像

`runCopilotAttempt` 会通过 `extensions/copilot/src/dual-write-transcripts.ts` 将每个轮次中可镜像的消息双写到 OpenClaw 审计转录。镜像按会话限定范围（`copilot:${sessionId}`），并使用按消息身份（`${role}:${sha256_16(role,content)}`），因此先前轮次条目的重新发出会与已有磁盘键冲突，不会重复。

镜像被两层故障遏制包裹，因此转录写入失败不会导致尝试失败：内部尽力而为包装器，以及尝试级别的纵深防御 `.catch(...)`。失败会被记录到日志，但不会暴露。

## 附带问题（`/btw`）

`/btw` 在此 harness 上**不是**原生功能。`createCopilotAgentHarness()`
会有意让 `harness.runSideQuestion` 保持未定义，因此 OpenClaw 的 `/btw`
分发器（`src/agents/btw.ts`）会回退到它为每个非 Codex runtime 使用的同一个树内 PI fallback
路径：直接调用配置好的模型提供商，发送一段简短的旁路问题 prompt，并通过
`streamSimple` 流式返回（没有 CLI 会话，也不占用额外池槽）。

这会把 Copilot CLI 会话保留给智能体的主轮次循环，并让
`/btw` 行为与其他 PI 支持的 runtime 保持一致。该契约在
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
中的 `describe("runSideQuestion")` 下有断言。

## Doctor

`extensions/copilot/doctor-contract-api.ts` 会由
`src/plugins/doctor-contract-registry.ts` 自动加载。它贡献：

- 一个空的 `legacyConfigRules`（MVP 阶段没有已退役字段）。
- 一个无操作的 `normalizeCompatibilityConfig`（保留它，让未来字段退役时有稳定的树内归属）。
- 一个 `sessionRouteStateOwners` 条目，声明 provider `github-copilot`；
  runtime `copilot`；CLI 会话键 `copilot`；auth profile
  前缀 `github-copilot:`。

## 限制

- 该 harness 声明 `github-copilot` 加上无归属的自定义 BYOK provider id。
  manifest 归属的原生 provider id 仍保留在其所属 runtime 上，即使
  `agentRuntime.id` 被强制为 `copilot`。
- 该 harness 不提供 TUI；PI 的 TUI 不受影响，并仍然作为没有对等界面的
  runtime 的 fallback。
- 当智能体切换到 `copilot` 时，不会迁移 PI 会话状态。
  选择按每次 attempt 生效；现有 PI 会话仍然有效。
- `ask_user` 使用与 Codex harness 相同的 OpenClaw prompt-and-reply 路径。
  当 Copilot SDK 请求用户输入时，OpenClaw 会向活动频道/TUI 发布一个阻塞 prompt，
  下一个排队的用户消息会解析该 SDK 请求。

## 权限和 ask_user

桥接的 OpenClaw 工具的权限执行发生在**工具 wrapper 内部**，
而不是通过 SDK 的 `onPermissionRequest` 回调。PI 使用的同一个
`wrapToolWithBeforeToolCallHook`
（`src/agents/pi-tools.before-tool-call.ts`）会由
`createOpenClawCodingTools` 应用于每个 coding tool：循环检测、
可信插件策略、before-tool-call 钩子，以及通过 gateway
（`plugin.approval.request`）进行的两阶段插件审批，都会运行与原生 PI attempt
完全相同的代码路径。

为了让该 wrapper 拥有决策权，`convertOpenClawToolToSdkTool` 返回的 SDK Tool
会标记为：

- `overridesBuiltInTool: true` —— 替换 Copilot CLI 中同名的内置工具
  （edit、read、write、bash，等等），使每次工具调用都路由回 OpenClaw。
- `skipPermission: true` —— 告诉 SDK 不要在调用工具之前触发
  `onPermissionRequest({kind: "custom-tool"})`。
  被包装的 `execute()` 会在内部执行更丰富的 OpenClaw 策略检查；
  SDK 级 prompt 要么会绕过 OpenClaw 的执行（如果我们全部允许），要么会阻塞每次工具调用
  （如果我们全部拒绝）—— 两者都不符合 PI 对等性。

树内 codex harness 使用相同的拆分：桥接的 OpenClaw 工具会被包装
（`extensions/codex/src/app-server/dynamic-tools.ts`），而 codex-app-server
**自己的**原生审批类型
（`item/commandExecution/requestApproval`、
`item/fileChange/requestApproval`、
`item/permissions/requestApproval`）会通过
`plugin.approval.request`
（`extensions/codex/src/app-server/approval-bridge.ts`）路由。Copilot SDK
中的等价做法是：对任何到达 `onPermissionRequest` 的非 `custom-tool`
类型使用失败关闭式 `rejectAllPolicy`；这是相同的安全网，
而且实践中不会触发，因为 `overridesBuiltInTool: true`
会替代每个内置工具。

为了让包装工具层作出与 PI 等价的策略决策，该 harness 会把完整的 PI
attempt-tool 上下文转发给 `createOpenClawCodingTools`：身份
（`senderIsOwner`、`memberRoleIds`、`ownerOnlyToolAllowlist`，等等）、
频道/路由（`groupId`、`currentChannelId`、`replyToMode`、消息工具开关）、
auth（`authProfileStore`）、运行身份
（从 `sandboxSessionKey`、`runId` 派生出的 `sessionKey`/`runSessionKey`）、
模型上下文（`modelApi`、`modelContextWindowTokens`、
`modelCompat`、`modelHasVision`），以及运行钩子（`onToolOutcome`、
`onYield`）。如果没有这些字段，owner-only allowlist 会静默表现为默认拒绝，
插件信任策略无法解析到正确作用域，而 `session_status: "current"`
会解析到过期的 sandbox 键。桥接构建器位于
`extensions/copilot/src/tool-bridge.ts`，并镜像 PI 的权威调用：
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`。`runAttempt`
已经通过共享的 `resolveSandboxContext` seam 解析 sandbox 上下文，
向 SDK 传递有效工作目录，并把 `sandbox` 加上子智能体 spawn 工作区转发进
tool bridge。该 bridge 还会转发它能在 SDK 边界执行的有界工具构造控制：
`includeCoreTools`、runtime 工具 allowlist 和 `toolConstructionPlan`。

该 bridge 还使用来自
`openclaw/plugin-sdk/agent-harness-tool-runtime` 的共享 harness 工具界面 helper
来保持 PI 对等性。启用 tool-search 时，SDK 看到的是紧凑的控制工具加一个隐藏的
catalog executor，而不是每个 OpenClaw 工具 schema。启用代码模式时，该 helper
会构建其他 agent harness 使用的同一套代码模式控制界面和 catalog 生命周期。
本地模型精简默认值、runtime 兼容的 schema 过滤、目录 hydration 和 catalog
清理都保留在共享 helper 中，因此 Copilot 和 Codex 相邻的 harness 不会漂移。

### 会话级 GitHub token

Copilot SDK 契约区分**客户端级** GitHub
token（`CopilotClientOptions.gitHubToken`，用于认证 CLI 进程本身）和**会话级**
token（`SessionConfig.gitHubToken`，决定该会话的内容排除、模型路由和配额，
并在 `createSession` 与 `resumeSession` 上都会被遵守）。该 harness
通过 `resolveCopilotAuth` 解析一次 auth，并在 auth 模式为
`gitHubToken` 时设置这两个字段（显式的 `auth.gitHubToken`，或从配置的
`github-copilot` auth profile 契约解析出的 `resolvedApiKey`）。
当解析出的模式为 `useLoggedInUser` 时，会省略会话级字段，让 SDK 继续从已登录身份派生身份。

`ask_user` 使用 `SessionConfig.onUserInputRequest`。该 bridge
会接受固定选项请求的选项索引或标签，在 SDK 请求允许时接受自由文本答案，
并在 OpenClaw attempt 中止时取消待处理请求。

## 相关

- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [Agent harness plugins (SDK reference)](/zh-CN/plugins/sdk-agent-harness)
