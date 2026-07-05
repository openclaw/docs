---
read_when:
    - 你想为智能体使用 GitHub Copilot SDK harness
    - 你需要 `copilot` 运行时的配置示例
    - 你正在将智能体接入订阅版 Copilot（github / openclaw / copilot），并希望它通过 Copilot CLI 运行
summary: 通过外部 GitHub Copilot SDK harness 运行 OpenClaw 嵌入式智能体轮次
title: Copilot SDK harness
x-i18n:
    generated_at: "2026-07-05T11:32:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ce0dd8fb69275450b3342a3acd7ec5c1d993a88196c5d0ad2f2fa9a34badf97
    source_path: plugins/copilot.md
    workflow: 16
---

外部 `@openclaw/copilot` 插件通过 GitHub Copilot CLI（`@github/copilot-sdk`）运行嵌入式订阅 Copilot 智能体轮次，而不是使用 OpenClaw 内置的 PI 运行框架。Copilot CLI 会话拥有底层 Agent loop：原生工具执行、原生压缩（`infiniteSessions`），以及 `copilotHome` 下由 CLI 管理的线程状态。OpenClaw 仍然拥有聊天渠道、会话文件、模型选择、动态工具（桥接）、审批、媒体交付、可见转录镜像、`/btw` 旁支问题（见 [旁支问题（`/btw`）](#side-questions-btw)），以及 `openclaw doctor`。

如需了解更广泛的模型/提供商/运行时拆分，请从
[Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。

## 要求

- 已安装 `@openclaw/copilot` 插件的 OpenClaw。
- 如果你的配置使用 `plugins.allow`，请包含 `copilot`（插件声明的清单 id）。npm 包名 `@openclaw/copilot` 的允许列表条目不会匹配，并且即使设置了 `agentRuntime.id: "copilot"`，插件也会保持被阻止状态。
- 一个可驱动 Copilot CLI 的 GitHub Copilot 订阅，或用于无头运行或 cron 运行的 `gitHubToken` 环境变量 / auth-profile 条目。
- 一个可写的 `copilotHome` 目录。当 OpenClaw 提供 Agent 目录时，默认值为 `<agentDir>/copilot`，否则为 `~/.openclaw/agents/<agentId>/copilot`。

`openclaw doctor` 会运行插件的 [doctor contract](#doctor)，用于会话状态所有权和未来配置迁移。它不会探测 Copilot CLI 环境。

## 安装

Copilot 运行时作为外部插件发布，因此核心 `openclaw` 包不会携带 `@github/copilot-sdk` 或其平台特定的 `@github/copilot-<platform>-<arch>` CLI 二进制文件（两者合计约 260 MB）。只为选择使用此运行时的智能体安装它：

```bash
openclaw plugins install @openclaw/copilot
```

当你第一次选择 `github-copilot/*` 模型，并且你的配置通过 `agentRuntime: { id: "copilot" }` 将该模型（或其提供商）路由到 Copilot 运行时时，设置向导会自动安装插件；见[快速开始](#quickstart)。如果没有该选择加入，OpenClaw 会使用内置的 GitHub Copilot provider，并且不会安装此插件。

运行时按以下顺序解析 SDK：

1. 从已安装的 `@openclaw/copilot` 包中 `import("@github/copilot-sdk")`。
2. 回退目录 `~/.openclaw/npm-runtime/copilot/`（旧版按需安装目标）。

缺少 SDK 时会暴露一个代码为 `COPILOT_SDK_MISSING` 的错误，并显示上面的重新安装命令。

## 快速开始

将一个模型（或一个提供商）固定到运行框架：

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

在单个模型条目上设置 `agentRuntime.id`，只将该模型路由到运行框架；或在提供商上设置它，将该提供商下的每个模型都路由过去。

`github-copilot/auto` 是可移植的起点。具名 Copilot 模型取决于账号和组织策略；在固定前，请确认你已认证的 Copilot CLI 确实暴露了该模型。

## 支持的提供商

运行框架支持规范的 `github-copilot` 提供商（由 `extensions/github-copilot` 拥有），以及在模型具有非空 `baseUrl` 且具备以下 `api` 形态之一时的自定义 `models.providers` 条目：

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`（OpenAI 兼容补全）
- `openai-completions`
- `openai-responses`

原生提供商 id（`openai`、`anthropic`、`google`、`ollama`）仍由其原生运行时拥有。请改用一个不同的自定义提供商 id，通过 Copilot BYOK 路由端点。

Copilot BYOK 端点必须是公共 HTTPS URL。运行框架会向 Copilot SDK 提供每次尝试专用的 loopback 代理，然后通过 OpenClaw 的受保护 fetch 路径转发提供商流量，以便 DNS 固定和 SSRF 策略仍由 OpenClaw 拥有。对于本地 Ollama、LM Studio 或 LAN 模型服务器，请使用原生 OpenClaw 运行时。

## BYOK

Copilot BYOK 使用 SDK 的会话级自定义提供商合约。OpenClaw 会传入解析后的模型端点、API key、bearer-token 模式、headers、模型 id，以及上下文/输出限制；提供商传输逻辑保留在 SDK 中，而不是核心中。

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

BYOK 会话会与订阅会话、其他 BYOK 端点或凭证分开键控。轮换 key、headers、模型或端点会启动一个新的 Copilot SDK 会话，而不是恢复不兼容的状态。

## 认证

优先级，在 `runCopilotAttempt` 期间按每个智能体应用：

1. 尝试输入上的**显式 `useLoggedInUser: true`** — 使用智能体 `copilotHome` 下 Copilot CLI 的已登录用户。
2. 尝试输入上的**显式 `gitHubToken`**（需要 `profileId` + `profileVersion`）。用于需要绕过 auth-profile 解析的直接 CLI 调用和测试。
3. **合约解析的 `resolvedApiKey` + `authProfileId`** — 生产主路径。核心会在调用运行框架前解析智能体配置的 `github-copilot` 认证配置文件（`src/infra/provider-usage.auth.ts:resolveProviderAuths`），因此 `github-copilot:<profile>` auth profile 可在无头、cron 或多配置文件设置中端到端工作，无需环境变量。
4. **环境变量回退**，按此顺序检查（第一个非空值获胜，空字符串视为不存在；镜像 `extensions/github-copilot/auth.ts` 中已发布的 `github-copilot` 提供商优先级）：
   1. `OPENCLAW_GITHUB_TOKEN` — 运行框架专用覆盖；允许你为 OpenClaw 运行框架固定一个 token，而不会干扰系统级 `gh` / Copilot CLI 配置。
   2. `COPILOT_GITHUB_TOKEN` — 标准 Copilot SDK / CLI 环境变量。
   3. `GH_TOKEN` — 标准 `gh` CLI 环境变量。
   4. `GITHUB_TOKEN` — 通用 GitHub token 回退。

   合成的池配置文件 id 为 `env:<NAME>`；配置文件版本是 token 的不可逆 sha256 指纹，因此轮换环境变量值会干净地使客户端池失效。

5. 当没有 token 信号可用时，使用**默认 `useLoggedInUser`**。

每个智能体都有自己的 `copilotHome`，因此 Copilot CLI token、会话和配置永远不会在同一台机器上的智能体之间泄漏。默认值：`<agentDir>/copilot`（将 SDK 状态保留在 OpenClaw 的 `models.json` / `auth-profiles.json` 所在目录之外），或在未提供 Agent 目录时使用 `~/.openclaw/agents/<agentId>/copilot`。可在尝试输入中用 `copilotHome: <path>` 覆盖为自定义位置（例如用于迁移的共享挂载）。

实时运行框架测试使用 `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` 作为直接 token。共享实时测试设置会在将真实 auth profile 暂存到隔离测试 home 后清除 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 和 `GITHUB_TOKEN`，因此通过专用变量传入的 `gh auth token` 值可以避免误跳过，同时不会泄漏到无关套件中。

## 配置接口

运行框架从每次尝试输入（`runCopilotAttempt({...})`）以及 `extensions/copilot/src/` 内的一小组环境默认值读取配置：

| 字段                     | 用途                                                                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | 每个智能体的 CLI 状态目录（默认值见上文）。                                                                                                                                                                                                                                                     |
| `model`                  | 字符串或 `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。省略则使用智能体的正常模型选择；运行框架会验证解析后的提供商受支持。                                                                                                                                                         |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`。从 `auto-reply/thinking.ts` 中 OpenClaw 的 `ThinkLevel` / `ReasoningLevel` 解析映射而来。                                                                                                                                                             |
| `infiniteSessionConfig`  | 可选覆盖项，用于由 `harness.compact` 驱动的 SDK `infiniteSessions` 块。保持原样即可。                                                                                                                                                                                                            |
| `hooksConfig`            | 可选的原生 Copilot SDK `SessionHooks` 配置，用于工具/MCP、用户提示、会话和错误回调。独立于 OpenClaw 的可移植生命周期钩子。                                                                                                                                                                      |
| `permissionPolicy`       | SDK 内置工具类型（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）的 `onPermissionRequest` 处理程序可选覆盖项。默认使用 `rejectAllPolicy` 作为安全网；它为什么实际上永远不会触发，见[权限和 ask_user](#permissions-and-ask_user)。 |
| `enableSessionTelemetry` | 可选的 SDK 会话遥测标志。                                                                                                                                                                                                                                                                       |

OpenClaw 插件钩子不需要任何 Copilot 特定的尝试配置。运行框架会通过标准运行框架 helper 运行 `before_prompt_build`（以及旧版 `before_agent_start` 兼容钩子）、`llm_input`、`llm_output` 和 `agent_end`。成功的 SDK 压缩还会运行 `before_compaction` 和 `after_compaction`。桥接的 OpenClaw 工具会运行 `before_tool_call` 并报告 `after_tool_call`；`hooksConfig` 仍用于没有可移植等价项的原生 SDK 专用回调。

OpenClaw 中的其他任何内容都不需要了解这些字段。其他插件、渠道和核心代码只会看到标准的 `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` 形态。

## 压缩

当 `harness.compact` 运行时，Copilot SDK 运行框架会：

1. 恢复被跟踪的 SDK 会话，但不继续待处理工作。
2. 调用 SDK 的会话作用域历史压缩 RPC。
3. 返回 SDK 压缩结果，而不会在工作区下写入兼容性标记文件。

OpenClaw 侧的转录镜像（见下文）会继续接收压缩后的消息，因此面向用户的聊天历史保持一致。

## 转录镜像

`runCopilotAttempt` 会通过 `extensions/copilot/src/dual-write-transcripts.ts` 将每个轮次可镜像的消息双写入 OpenClaw 审计转录。镜像按会话作用域限定（`copilot:${sessionId}`），并按消息键控（`${role}:${sha256_16(role,content)}`），因此重新发出的前序轮次条目会与现有磁盘键冲突，而不是重复写入。

两层故障隔离包裹着镜像，因此转录写入失败永远不会导致尝试失败：一个内部的尽力而为包装器，以及尝试级别的纵深防御 `.catch(...)`。失败会被记录到日志中，而不会浮出。

## 旁路问题（`/btw`）

`/btw` 在这个 harness 上**不是**原生能力。`createCopilotAgentHarness()`
有意让 `harness.runSideQuestion` 保持未定义
（在 `extensions/copilot/harness.test.ts` 的 `describe("runSideQuestion")` 中断言），
因此 OpenClaw 的 `/btw` 分发器（`src/agents/btw.ts`）会落到
它用于所有非 Codex runtime 的相同路径：直接调用已配置的模型提供商，
传入简短的旁路问题提示，并通过 `streamSimple` 流式返回
（没有 CLI 会话，也不占用额外池槽位）。

这会让 Copilot CLI 会话保留给智能体的主轮次循环，
并让 `/btw` 行为与其他非 Codex runtime 保持一致。

## Doctor

`extensions/copilot/doctor-contract-api.ts` 会由
`src/plugins/doctor-contract-registry.ts` 自动加载。它贡献了：

- 一个空的 `legacyConfigRules`（目前还没有退役字段）。
- 一个无操作的 `normalizeCompatibilityConfig`（保留它是为了让未来字段退役
  有一个稳定的仓库内归宿）。
- 一个 `sessionRouteStateOwners` 条目：提供商 `github-copilot`，runtime
  `copilot`，CLI 会话键 `copilot`，凭证配置文件前缀 `github-copilot:`。

## 限制

- 该 harness 声明 `github-copilot` 以及无所有者的自定义 BYOK 提供商 ID。
  清单拥有的原生提供商 ID 会继续留在其所属 runtime 上，即使
  `agentRuntime.id` 被强制设为 `copilot`。
- 没有 TUI 界面；对于没有对等界面的 runtime，PI 的 TUI 仍是回退。
- 当智能体切换到 `copilot` 时，PI 会话状态不会迁移。
  选择按每次尝试生效；现有 PI 会话仍然有效。
- `ask_user` 使用与 Codex harness 相同的 OpenClaw 提示与回复路径：
  当 Copilot SDK 请求用户输入时，OpenClaw 会向活动渠道/TUI 发布一个
  阻塞提示，下一条排队的用户消息会解析该 SDK 请求。

## 权限和 ask_user

桥接的 OpenClaw 工具的权限执行发生在**工具包装器内部**，
而不是通过 SDK 的 `onPermissionRequest` 回调。PI 使用的同一个
`wrapToolWithBeforeToolCallHook`
（`src/agents/agent-tools.before-tool-call.ts`）会由
`createOpenClawCodingTools` 应用于每个代码工具：循环检测、受信插件策略、
before-tool-call 钩子，以及通过 Gateway 网关（`plugin.approval.request`）
进行的两阶段插件审批，全都走与原生 PI 尝试完全相同的代码路径。

`convertOpenClawToolToSdkTool` 返回的 SDK Tool 会标记为：

- `overridesBuiltInTool: true` — 替换 Copilot CLI 中同名的内置工具
  （edit、read、write、bash 等），因此每次工具调用都会路由回
  OpenClaw。
- `skipPermission: true` — 告诉 SDK 在调用工具前不要触发
  `onPermissionRequest({kind: "custom-tool"})`。被包装的 `execute()`
  已经执行了更丰富的 OpenClaw 策略检查；SDK 级提示要么会短路
  OpenClaw 的执行（全部允许），要么会阻塞每次工具调用（全部拒绝）—
  两者都不符合 PI 对等性。

仓库内的 Codex harness 使用相同的拆分：桥接的 OpenClaw 工具会被包装
（`extensions/codex/src/app-server/dynamic-tools.ts`），而
codex-app-server 自己的原生审批类型
（`item/commandExecution/requestApproval`、`item/fileChange/requestApproval`、
`item/permissions/requestApproval`）会通过 `plugin.approval.request`
路由（`extensions/codex/src/app-server/approval-bridge.ts`）。Copilot SDK
的等价方案是：对任何到达 `onPermissionRequest` 的非 `custom-tool`
类型使用 fail-closed 的 `rejectAllPolicy`。这是相同的安全网，而且实际中
不会触发，因为 `overridesBuiltInTool: true` 会替换每一个内置工具。

为了让包装工具层做出与 PI 等价的策略决策，该 harness 会把完整的 PI
尝试工具上下文转发给 `createOpenClawCodingTools`：身份（`senderIsOwner`、
`memberRoleIds`、`ownerOnlyToolAllowlist` 等）、渠道/路由（`groupId`、
`currentChannelId`、`replyToMode`、消息工具开关）、凭证
（`authProfileStore`）、运行身份（从 `sandboxSessionKey`、`runId`
派生的 `sessionKey` / `runSessionKey`）、模型上下文（`modelApi`、
`modelContextWindowTokens`、`modelCompat`、`modelHasVision`），以及运行钩子
（`onToolOutcome`、`onYield`）。缺少这些字段时，仅所有者允许列表会默认静默拒绝，
插件信任策略无法解析到正确的作用域，且 `session_status: "current"`
会解析到陈旧的沙箱键。桥接构建器是 `extensions/copilot/src/tool-bridge.ts`，
它镜像了 `src/agents/embedded-agent-runner/run/attempt.ts:1262` 处 PI
的权威调用。`runAttempt` 通过共享的 `resolveSandboxContext` seam 解析沙箱上下文，
向 SDK 传入有效工作目录，并将 `sandbox` 以及子智能体生成工作空间转发到工具桥接。
该桥接还转发它能在 SDK 边界执行的有界工具构造控制：`includeCoreTools`、
runtime 工具允许列表，以及 `toolConstructionPlan`。

该桥接还使用来自 `openclaw/plugin-sdk/agent-harness-tool-runtime` 的共享
harness 工具界面辅助模块，以保持 PI 对等性。启用工具搜索时，SDK 看到的是
紧凑的控制工具加一个隐藏目录执行器，而不是每个 OpenClaw 工具 schema。
启用代码模式时，该辅助模块会构建其他 agent harness 使用的相同代码模式控制界面
和目录生命周期。本地模型精简默认值、runtime 兼容 schema 过滤、目录水合以及目录清理
都保留在共享辅助模块中，因此 Copilot 和 Codex 相邻 harness 不会漂移。

### 会话级 GitHub 令牌

Copilot SDK 合约区分**客户端级** GitHub 令牌
（`CopilotClientOptions.gitHubToken`，用于认证 CLI 进程本身）和
**会话级**令牌（`SessionConfig.gitHubToken`，决定该会话的内容排除、
模型路由和配额；在 `createSession` 和 `resumeSession` 上都会被遵守）。
该 harness 通过 `resolveCopilotAuth` 解析一次凭证，并在凭证模式为
`gitHubToken` 时设置这两个字段（显式 `auth.gitHubToken`，或来自已配置
`github-copilot` 凭证配置文件、由合约解析出的 `resolvedApiKey`）。
当解析出的模式为 `useLoggedInUser` 时，会省略会话级字段，让 SDK 继续
从已登录身份派生身份。

`ask_user` 使用 `SessionConfig.onUserInputRequest`。桥接会为固定选项请求接受选项索引或标签，
在 SDK 请求允许时接受自由形式答案，并在 OpenClaw 尝试被中止时取消待处理请求。

## 相关

- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [Agent harness plugins (SDK reference)](/zh-CN/plugins/sdk-agent-harness)
