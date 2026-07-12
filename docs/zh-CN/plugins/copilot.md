---
read_when:
    - 你想为智能体使用 GitHub Copilot SDK harness
    - 你需要 `copilot` 运行时的配置示例
    - 你正在将智能体接入订阅版 Copilot（github / openclaw / copilot），并希望它通过 Copilot CLI 运行
summary: 通过外部 GitHub Copilot SDK harness 运行 OpenClaw 内嵌智能体轮次
title: Copilot SDK harness
x-i18n:
    generated_at: "2026-07-12T14:38:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

外部 `@openclaw/copilot` 插件通过 GitHub Copilot CLI（`@github/copilot-sdk`）运行嵌入式订阅 Copilot 智能体轮次，而不是使用 OpenClaw 的内置 harness。Copilot CLI 会话负责底层 Agent loop：原生工具执行、原生压缩（`infiniteSessions`），以及 `copilotHome` 下由 CLI 管理的线程状态。OpenClaw 仍负责聊天渠道、会话文件、模型选择、动态工具（通过桥接）、审批、媒体交付、可见的对话记录镜像、`/btw` 附加问题（参见[附加问题（`/btw`）](#side-questions-btw)），以及 `openclaw doctor`。

有关更广泛的模型/提供商/运行时划分，请先阅读
[Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

## 要求

- 已安装 `@openclaw/copilot` 插件的 OpenClaw。
- 如果你的配置使用 `plugins.allow`，请加入 `copilot`（插件声明的清单 ID）。即使设置了 `agentRuntime.id: "copilot"`，npm 包名 `@openclaw/copilot` 的允许列表条目也不会匹配，插件仍会被阻止。
- 可以驱动 Copilot CLI 的 GitHub Copilot 订阅，或者用于无头或 cron 运行的 `gitHubToken` 环境变量/身份验证配置文件条目。
- 可写的 `copilotHome` 目录。OpenClaw 提供 Agent 目录时，默认为 `<agentDir>/copilot`；否则默认为 `~/.openclaw/agents/<agentId>/copilot`。

`openclaw doctor` 会针对会话状态所有权和未来的配置迁移运行插件的 [Doctor 契约](#doctor)。它不会探测 Copilot CLI 环境。

## 安装

Copilot 运行时以外部插件形式发布，因此核心 `openclaw` 包不会包含 `@github/copilot-sdk` 或其特定于平台的 `@github/copilot-<platform>-<arch>` CLI 二进制文件（合计约 260 MB）。仅为选择使用此运行时的智能体安装它：

```bash
openclaw plugins install @openclaw/copilot
```

首次选择 `github-copilot/*` 模型，**并且**你的配置通过 `agentRuntime: { id: "copilot" }` 将该模型（或其提供商）路由到 Copilot 运行时时，设置向导会自动安装该插件；参见[快速开始](#quickstart)。如果未选择启用，OpenClaw 会使用其内置 GitHub Copilot 提供商，并且绝不会安装此插件。

运行时按以下顺序解析 SDK：

1. 从已安装的 `@openclaw/copilot` 包中执行 `import("@github/copilot-sdk")`。
2. 回退目录 `~/.openclaw/npm-runtime/copilot/`（旧版按需安装目标）。

缺少 SDK 时会显示一个代码为 `COPILOT_SDK_MISSING` 的错误，以及上面的重新安装命令。

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

在单个模型条目上设置 `agentRuntime.id`，可仅通过 harness 路由该模型；在提供商上设置，则会路由该提供商下的所有模型。

`github-copilot/auto` 是可移植的起点。具名 Copilot 模型取决于账户和组织策略；固定模型之前，请确认经过身份验证的 Copilot CLI 确实公开了该模型。

## 支持的提供商

harness 支持规范的 `github-copilot` 提供商（由 `extensions/github-copilot` 所有），以及模型具有非空 `baseUrl` 且采用以下任一 `api` 形态的自定义 `models.providers` 条目：

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`（OpenAI 兼容的补全）
- `openai-completions`
- `openai-responses`

原生提供商 ID（`openai`、`anthropic`、`google`、`ollama`）仍由其原生运行时所有。若要改为通过 Copilot BYOK 路由端点，请使用不同的自定义提供商 ID。

Copilot BYOK 端点必须是公共 HTTPS URL。harness 会为每次尝试向 Copilot SDK 提供一个 loopback 代理，然后通过 OpenClaw 受保护的 fetch 路径转发提供商流量，从而使 DNS 固定和 SSRF 策略仍由 OpenClaw 所有。本地 Ollama、LM Studio 或局域网模型服务器请使用 OpenClaw 原生运行时。

## BYOK

Copilot BYOK 使用 SDK 的会话级自定义提供商契约。OpenClaw 会传递解析后的模型端点、API 密钥、持有者令牌模式、标头、模型 ID，以及上下文/输出限制；提供商传输逻辑保留在 SDK 中，而不是核心中。

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

BYOK 会话与订阅会话，以及其他 BYOK 端点或凭据分别使用不同的键。轮换密钥、标头、模型或端点时，会启动新的 Copilot SDK 会话，而不是恢复不兼容的状态。

## 身份验证

在 `runCopilotAttempt` 期间按智能体应用以下优先级：

1. 尝试输入中**显式设置 `useLoggedInUser: true`**——使用智能体 `copilotHome` 下 Copilot CLI 的已登录用户。
2. 尝试输入中**显式设置 `gitHubToken`**（需要 `profileId` + `profileVersion`）。用于需要绕过身份验证配置文件解析的直接 CLI 调用和测试。
3. **契约解析的 `resolvedApiKey` + `authProfileId`**——生产环境的主路径。核心会在调用 harness 之前解析智能体配置的 `github-copilot` 身份验证配置文件（`src/infra/provider-usage.auth.ts:resolveProviderAuths`），因此 `github-copilot:<profile>` 身份验证配置文件可以在无头、cron 或多配置文件设置中端到端工作，而无需环境变量。
4. **环境变量回退**，按以下顺序检查（第一个非空值生效，空字符串视为不存在；与 `extensions/github-copilot/auth.ts` 中已发布的 `github-copilot` 提供商优先级一致）：
   1. `OPENCLAW_GITHUB_TOKEN`——harness 专用覆盖；让你可以为 OpenClaw harness 固定令牌，而不干扰系统范围的 `gh` / Copilot CLI 配置。
   2. `COPILOT_GITHUB_TOKEN`——标准 Copilot SDK / CLI 环境变量。
   3. `GH_TOKEN`——标准 `gh` CLI 环境变量。
   4. `GITHUB_TOKEN`——通用 GitHub 令牌回退。

   合成的池配置文件 ID 为 `env:<NAME>`；配置文件版本是令牌不可逆的 sha256 指纹，因此轮换环境变量值时会彻底使客户端池失效。

5. 没有可用的令牌信号时，默认使用 **`useLoggedInUser`**。

每个智能体都有自己的 `copilotHome`，因此同一台机器上的智能体之间绝不会泄露 Copilot CLI 令牌、会话和配置。默认值为 `<agentDir>/copilot`（使 SDK 状态不与 OpenClaw 的 `models.json` / `auth-profiles.json` 位于同一目录），未提供 Agent 目录时则为 `~/.openclaw/agents/<agentId>/copilot`。可在尝试输入中使用 `copilotHome: <path>` 覆盖为自定义位置（例如用于迁移的共享挂载）。

实时 harness 测试使用 `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` 作为直接令牌。共享实时测试设置会在将真实身份验证配置文件暂存到隔离的测试主目录后清除 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 和 `GITHUB_TOKEN`，因此通过专用变量传递的 `gh auth token` 值可以避免错误跳过，而不会泄露到无关测试套件。

## 配置界面

harness 从每次尝试输入（`runCopilotAttempt({...})`）以及 `extensions/copilot/src/` 内的一小组环境变量默认值中读取配置：

| 字段                     | 用途                                                                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | 每个智能体的 CLI 状态目录（默认值见上文）。                                                                                                                                                                                                                                                      |
| `model`                  | 字符串或 `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。省略时使用智能体的常规模型选择；harness 会验证解析后的提供商是否受支持。                                                                                                                                                        |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`。映射自 `auto-reply/thinking.ts` 中 OpenClaw 的 `ThinkLevel` / `ReasoningLevel` 解析结果。                                                                                                                                                                |
| `infiniteSessionConfig`  | 由 `harness.compact` 驱动的 SDK `infiniteSessions` 块的可选覆盖。保持原样即可。                                                                                                                                                                                                                   |
| `hooksConfig`            | 可选的原生 Copilot SDK `SessionHooks` 配置，用于工具/MCP、用户提示词、会话和错误回调。它与 OpenClaw 的可移植生命周期钩子分离。                                                                                                                                                                    |
| `permissionPolicy`       | 对 SDK 内置工具种类（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）的 `onPermissionRequest` 处理程序进行可选覆盖。作为安全保障，默认使用 `rejectAllPolicy`；有关它为何实际上绝不会触发，请参见[权限和 ask_user](#permissions-and-ask_user)。 |
| `enableSessionTelemetry` | 可选的 SDK 会话遥测标志。                                                                                                                                                                                                                                                                       |

OpenClaw 插件钩子无需 Copilot 专用的尝试配置。harness 会通过标准 harness 辅助函数运行 `before_prompt_build`（以及旧版 `before_agent_start` 兼容性钩子）、`llm_input`、`llm_output` 和 `agent_end`。SDK 成功压缩时还会运行 `before_compaction` 和 `after_compaction`。桥接的 OpenClaw 工具会运行 `before_tool_call` 并报告 `after_tool_call`；`hooksConfig` 仍用于没有可移植等效项、仅限原生 SDK 的回调。

OpenClaw 中的其他任何部分都无需了解这些字段。其他插件、渠道和核心代码只能看到标准的 `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` 形态。

## 压缩

运行 `harness.compact` 时，Copilot SDK harness 会：

1. 恢复所跟踪的 SDK 会话，但不继续处理待完成工作。
2. 调用 SDK 的会话范围历史记录压缩 RPC。
3. 返回 SDK 压缩结果，而不会在工作区下写入兼容性标记文件。

OpenClaw 侧的对话记录镜像（见下文）会继续接收压缩后的消息，因此面向用户的聊天历史记录保持一致。

## 对话记录镜像

`runCopilotAttempt` 会通过 `extensions/copilot/src/dual-write-transcripts.ts` 将每个轮次中可镜像的消息双写入 OpenClaw 审计对话记录。镜像按会话限定范围（`copilot:${sessionId}`），并按消息使用键（`${role}:${sha256_16(role,content)}`），因此重新发出的先前轮次条目会与已有的磁盘键冲突，而不会产生重复。

两层故障遏制机制封装了镜像写入，因此转录写入失败绝不会导致本次尝试失败：一层是内部尽力而为的包装器，另一层是在尝试级别用于纵深防御的 `.catch(...)`。失败只会被记录到日志中，不会向上抛出。

## 附带问题（`/btw`）

此 harness **原生不支持** `/btw`。`createCopilotAgentHarness()` 有意将 `harness.runSideQuestion` 保持为未定义状态（在 `extensions/copilot/harness.test.ts` 的 `describe("runSideQuestion")` 中断言），因此 OpenClaw 的 `/btw` 分发器（`src/agents/btw.ts`）会回退到处理所有非 Codex 运行时所用的相同路径：直接调用已配置的模型提供商，传入简短的附带问题提示词，并通过 `streamSimple` 流式返回（无 CLI 会话，也不占用额外的池槽位）。

这样可以将 Copilot CLI 会话留给智能体的主轮次循环，并使 `/btw` 的行为与其他非 Codex 运行时保持一致。

## Doctor

`extensions/copilot/doctor-contract-api.ts` 由 `src/plugins/doctor-contract-registry.ts` 自动加载。它提供：

- 空的 `legacyConfigRules`（目前尚无已停用字段）。
- 不执行任何操作的 `normalizeCompatibilityConfig`（保留它是为了让未来的字段停用逻辑在树内有一个稳定归属）。
- 一个 `sessionRouteStateOwners` 条目：提供商为 `github-copilot`，运行时为 `copilot`，CLI 会话键为 `copilot`，身份验证配置文件前缀为 `github-copilot:`。

## 限制

- 此 harness 声明接管 `github-copilot` 以及无归属的自定义 BYOK 提供商 ID。即使强制将 `agentRuntime.id` 设为 `copilot`，由清单归属的原生提供商 ID 仍由其所属运行时处理。
- 没有 TUI 界面；对于没有对等界面的运行时，PI 的 TUI 仍作为回退界面。
- 当智能体切换到 `copilot` 时，PI 会话状态不会迁移。选择按每次尝试进行；现有 PI 会话仍然有效。
- `ask_user` 使用与 Codex harness 相同的 OpenClaw 提示和回复路径：当 Copilot SDK 请求用户输入时，OpenClaw 会向当前渠道/TUI 发送阻塞式提示，下一条排队的用户消息会完成该 SDK 请求。

## 权限和 ask_user

桥接 OpenClaw 工具的权限执行发生在**工具包装器内部**，而不是通过 SDK 的 `onPermissionRequest` 回调完成。PI 使用的同一个 `wrapToolWithBeforeToolCallHook`（`src/agents/agent-tools.before-tool-call.ts`）由 `createOpenClawCodingTools` 应用于每个编码工具：循环检测、受信任插件策略、工具调用前钩子，以及通过 Gateway 网关进行的两阶段插件审批（`plugin.approval.request`），全部经过与原生 PI 尝试完全相同的代码路径。

`convertOpenClawToolToSdkTool` 返回的 SDK 工具带有以下标记：

- `overridesBuiltInTool: true` — 替换 Copilot CLI 中同名的内置工具（edit、read、write、bash 等），以便每次工具调用都路由回 OpenClaw。
- `skipPermission: true` — 告知 SDK 在调用工具之前不要触发 `onPermissionRequest({kind: "custom-tool"})`。包装后的 `execute()` 已经执行了更丰富的 OpenClaw 策略检查；SDK 级提示要么会绕过 OpenClaw 的执行机制（全部允许），要么会阻止每次工具调用（全部拒绝）——这两种情况都不符合与 PI 对齐的要求。

树内 Codex harness 使用相同的职责拆分：桥接的 OpenClaw 工具会被包装（`extensions/codex/src/app-server/dynamic-tools.ts`），而 codex-app-server 自身的原生审批类型（`item/commandExecution/requestApproval`、`item/fileChange/requestApproval`、`item/permissions/requestApproval`）则通过 `plugin.approval.request`（`extensions/codex/src/app-server/approval-bridge.ts`）进行路由。Copilot SDK 中对应的机制——对于任何到达 `onPermissionRequest` 的非 `custom-tool` 类型，使用故障时关闭的 `rejectAllPolicy`——是同样的安全保障；实际中它永远不会触发，因为 `overridesBuiltInTool: true` 会取代所有内置工具。

为了让工具包装层能够做出与 PI 等效的策略决策，此 harness 会将完整的 PI 尝试工具上下文转发给 `createOpenClawCodingTools`：身份信息（`senderIsOwner`、`memberRoleIds`、`ownerOnlyToolAllowlist` 等）、渠道/路由信息（`groupId`、`currentChannelId`、`replyToMode`、消息工具开关）、身份验证信息（`authProfileStore`）、运行标识（从 `sandboxSessionKey` 派生的 `sessionKey` / `runSessionKey`、`runId`）、模型上下文（`modelApi`、`modelContextWindowTokens`、`modelCompat`、`modelHasVision`），以及运行钩子（`onToolOutcome`、`onYield`）。如果缺少这些字段，仅限所有者的允许列表会默认静默拒绝，插件信任策略无法解析到正确的作用域，而 `session_status: "current"` 会解析到过期的沙箱键。桥接构建器位于 `extensions/copilot/src/tool-bridge.ts`，与 `src/agents/embedded-agent-runner/run/attempt.ts:1262` 中 PI 的权威调用保持一致。`runAttempt` 通过共享的 `resolveSandboxContext` 接缝解析沙箱上下文，向 SDK 传递有效工作目录，并将 `sandbox` 以及子智能体生成工作区转发到工具桥接层。桥接构建器还会转发它能在 SDK 边界执行的有界工具构建控制项：`includeCoreTools`、运行时工具允许列表和 `toolConstructionPlan`。

桥接层还使用来自 `openclaw/plugin-sdk/agent-harness-tool-runtime` 的共享 harness 工具界面辅助函数，以便与 PI 保持一致。启用工具搜索后，SDK 看到的是紧凑的控制工具和一个隐藏的目录执行器，而不是每个 OpenClaw 工具的 schema。启用代码模式后，该辅助函数会构建与其他 agent harness 相同的代码模式控制界面和目录生命周期。本地模型的精简默认值、与运行时兼容的 schema 过滤、目录填充和目录清理全部保留在共享辅助函数中，以免 Copilot 和与 Codex 相邻的 harness 出现偏差。

### 会话级 GitHub 令牌

Copilot SDK 合约区分**客户端级** GitHub 令牌（`CopilotClientOptions.gitHubToken`，用于对 CLI 进程本身进行身份验证）和**会话级**令牌（`SessionConfig.gitHubToken`，用于确定该会话的内容排除、模型路由和配额；`createSession` 和 `resumeSession` 均会采用此设置）。harness 通过 `resolveCopilotAuth` 解析一次身份验证，并在身份验证模式为 `gitHubToken` 时设置这两个字段（显式的 `auth.gitHubToken`，或从已配置的 `github-copilot` 身份验证配置文件中按合约解析出的 `resolvedApiKey`）。当解析后的模式为 `useLoggedInUser` 时，会省略会话级字段，使 SDK 继续从已登录身份派生身份信息。

`ask_user` 使用 `SessionConfig.onUserInputRequest`。对于固定选项请求，桥接层接受选项索引或标签；当 SDK 请求允许自由格式回答时，也接受此类回答；当 OpenClaw 尝试中止时，还会取消待处理的请求。

## 相关内容

- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Codex harness](/zh-CN/plugins/codex-harness)
- [Agent harness plugins (SDK reference)](/zh-CN/plugins/sdk-agent-harness)
