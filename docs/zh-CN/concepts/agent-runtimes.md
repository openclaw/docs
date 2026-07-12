---
read_when:
    - 你正在 OpenClaw、Codex、ACP 或其他原生 Agent Runtimes 之间进行选择
    - 你对状态或配置中的提供商/模型/运行时标签感到困惑
    - 你正在记录原生 harness 的支持对等情况
summary: OpenClaw 如何区分模型提供商、模型、渠道和 Agent Runtimes
title: Agent Runtimes
x-i18n:
    generated_at: "2026-07-12T14:23:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**智能体运行时**负责一个准备就绪的模型循环：它接收提示词、
驱动模型输出、处理原生工具调用，并将完成的轮次
返回给 OpenClaw。

运行时很容易与提供商混淆，因为两者都会出现在模型
配置附近。它们属于不同层：

| 层             | 示例                                         | 含义                                                              |
| -------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| 提供商         | `anthropic`、`github-copilot`、`openai`      | OpenClaw 如何进行身份验证、发现模型以及命名模型引用。             |
| 模型           | `claude-opus-4-6`、`gpt-5.6-sol`             | 为智能体轮次选择的模型。                                          |
| 智能体运行时   | `claude-cli`、`codex`、`copilot`、`openclaw` | 执行准备就绪轮次的底层循环或后端。                                |
| 渠道           | Discord、Slack、Telegram、WhatsApp           | 消息进入和离开 OpenClaw 的位置。                                  |

**Harness** 是提供智能体运行时的实现（代码术语）。例如，
内置 Codex harness 实现了 `codex` 运行时。
公共配置在提供商或模型条目上使用 `agentRuntime.id`；整个智能体级别的
运行时键属于旧版配置，会被忽略。`openclaw doctor --fix` 会移除旧的
整个智能体运行时固定设置，并将旧版运行时模型引用重写为规范的
提供商/模型引用，以及在需要时添加模型级运行时策略。

运行时分为两类：

- **嵌入式 harness** 在 OpenClaw 准备就绪的智能体循环内运行：包括
  内置的 `openclaw` 运行时，以及已注册的插件 harness，例如
  `codex` 和 `copilot`。
- **CLI 后端**运行本地 CLI 进程，同时保持模型引用
  规范化。例如，`anthropic/claude-opus-4-8` 配合模型级
  `agentRuntime.id: "claude-cli"` 表示“选择 Anthropic 模型，并通过
  Claude CLI 执行”。`claude-cli` 不是嵌入式 harness ID，不得
  传递给 AgentHarness 选择逻辑。

`copilot` harness 是一个独立、可选的外部插件 harness，用于
GitHub Copilot CLI；关于在 PI、Codex 和 GitHub Copilot agent runtime 之间
进行面向用户的选择，请参阅 [GitHub Copilot agent runtime](/zh-CN/plugins/copilot)。

## Codex 界面

多个界面共用 Codex 名称：

| 界面                                             | OpenClaw 名称/配置                      | 功能                                                                                                             |
| ------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 原生 Codex app-server 运行时                     | `openai/*` 模型引用                     | 通过 Codex app-server 运行 OpenAI 嵌入式智能体轮次。这是常见的 ChatGPT/Codex 订阅设置。                           |
| Codex OAuth 身份验证配置文件                     | `openai` OAuth 配置文件                 | 存储供 Codex app-server harness 使用的 ChatGPT/Codex 订阅身份验证信息。                                         |
| Codex ACP 适配器                                 | `runtime: "acp"`、`agentId: "codex"`    | 通过外部 ACP/acpx 控制平面运行 Codex。仅在明确要求使用 ACP/acpx 时使用。                                        |
| 原生 Codex 聊天控制命令集                        | `/codex ...`                            | 从聊天中绑定、恢复、Steer、停止和检查 Codex app-server 线程。                                                   |
| 用于非智能体界面的 OpenAI Platform API 路由      | `openai/*` 加 API 密钥身份验证           | 直接使用 OpenAI API，例如图像、嵌入、语音和实时 API。                                                           |

这些界面有意彼此独立。启用 `codex` 插件
会提供原生 app-server 功能；`openclaw doctor --fix` 负责
修复旧版 Codex 路由并清理过时的会话固定设置。现在为智能体模型选择
`openai/*` 表示“通过 Codex 运行”，除非使用的是非智能体
OpenAI API 界面。

常见的 ChatGPT/Codex 订阅设置使用 Codex OAuth 进行身份验证，但
模型引用仍为 `openai/*`，并选择 `codex` 运行时：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

这表示 OpenClaw 选择一个 OpenAI 模型引用，然后要求 Codex
app-server 运行时运行嵌入式智能体轮次。这并不表示“使用 API
计费”，也不表示渠道、模型提供商目录或
OpenClaw 会话存储会变成 Codex。

启用内置 `codex` 插件后，请使用原生 `/codex` 命令
界面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、
`/codex stop`）进行自然语言 Codex 控制，而不是使用 ACP。仅当
用户明确要求使用 ACP/acpx 或正在测试 ACP
适配器路径时，才对 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor
以及类似的外部 harness 仍使用 ACP。

决策树：

1. **Codex 绑定/控制/线程/恢复/Steer/停止** -> 启用内置 `codex` 插件时，使用原生 `/codex` 命令界面。
2. **将 Codex 用作嵌入式运行时**或常规的订阅支持型 Codex 智能体体验 -> `openai/<model>`。
3. **为 OpenAI 模型明确选择 OpenClaw** -> 保持模型引用为 `openai/<model>`，并将提供商/模型运行时策略设置为 `agentRuntime.id: "openclaw"`。选中的 `openai` OAuth 配置文件会在内部通过 OpenClaw 的 Codex 身份验证传输进行路由。
4. **配置中的旧版 Codex 模型引用** -> 使用 `openclaw doctor --fix` 修复为 `openai/<model>`；当旧模型引用隐含使用 Codex 身份验证路由时，Doctor 会通过添加提供商/模型级 `agentRuntime.id: "codex"` 来保留该路由。旧版 **`codex-cli/*`** 模型引用会修复为同一个 `openai/<model>` Codex app-server 路由；OpenClaw 不再保留内置 Codex CLI 后端。
5. **明确请求 ACP、acpx 或 Codex ACP 适配器** -> `runtime: "acp"` 和 `agentId: "codex"`。
6. **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 harness** -> 使用 ACP/acpx，而不是原生子智能体运行时。

| 你的意思是……                            | 使用……                                          |
| ---------------------------------------- | ----------------------------------------------- |
| Codex app-server 聊天/线程控制           | 内置 `codex` 插件提供的 `/codex ...`            |
| Codex app-server 嵌入式智能体运行时      | `openai/*` 智能体模型引用                       |
| OpenAI Codex OAuth                       | `openai` OAuth 配置文件                         |
| Claude Code 或其他外部 harness           | ACP/acpx                                        |

有关 OpenAI 系列前缀的拆分，请参阅 [OpenAI](/zh-CN/providers/openai) 和
[模型提供商](/zh-CN/concepts/model-providers)。有关 Codex 运行时支持
契约，请参阅 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#v1-support-contract)。

## 运行时所有权

不同的运行时负责循环中不同范围的工作：

| 界面                      | OpenClaw 嵌入式                                   | Codex app-server                                                              |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| 模型循环所有者            | OpenClaw，通过 OpenClaw 嵌入式运行器              | Codex app-server                                                              |
| 规范线程状态              | OpenClaw 对话记录                                  | Codex 线程，以及 OpenClaw 对话记录镜像                                        |
| OpenClaw 动态工具         | 原生 OpenClaw 工具循环                            | 通过 Codex 适配器桥接                                                         |
| 原生 Shell 和文件工具     | OpenClaw 路径                                     | Codex 原生工具，在支持时通过原生钩子桥接                                      |
| 上下文引擎                | 原生 OpenClaw 上下文组装                          | OpenClaw 将组装的上下文投射到 Codex 轮次中                                    |
| 压缩                      | OpenClaw 或选定的上下文引擎                       | Codex 原生压缩，并由 OpenClaw 提供通知和维护镜像                              |
| 渠道交付                  | OpenClaw                                          | OpenClaw                                                                      |

设计规则：如果界面由 OpenClaw 负责，它就可以提供常规插件钩子
行为。如果界面由原生运行时负责，OpenClaw 就需要运行时
事件或原生钩子。如果规范线程状态由原生运行时负责，
OpenClaw 会镜像和投射上下文，而不是重写不受支持的
内部机制。

## 运行时选择

OpenClaw 在解析提供商和模型后，按以下
顺序解析嵌入式运行时：

1. **模型级运行时策略**优先。它位于已配置的提供商
   模型条目中，或位于 `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime` 中。诸如
   `agents.defaults.models["vllm/*"].agentRuntime` 的提供商
   通配符会在精确模型策略之后应用，因此动态发现的提供商模型可以
   共用一个运行时，而不会覆盖精确的逐模型例外。
2. **提供商级运行时策略**：`models.providers.<provider>.agentRuntime`。
3. **`auto` 模式**：已注册的插件运行时可以声明支持的提供商/模型组合。
4. 如果在 `auto` 模式下没有任何运行时声明该轮次，OpenClaw 会回退到
   `openclaw` 作为兼容运行时。如果运行必须严格匹配，请使用明确的运行时 ID。

整个会话和整个智能体的运行时固定设置会被忽略：`OPENCLAW_AGENT_RUNTIME`、
会话 `agentHarnessId`/`agentRuntimeOverride` 状态、`agents.defaults.agentRuntime`
以及 `agents.list[].agentRuntime`。运行 `openclaw doctor --fix` 可移除过时的
整个智能体运行时配置，并在能够保留意图时转换旧版运行时模型引用。

明确配置的提供商/模型插件运行时会采用失败关闭策略：提供商或模型上的
`agentRuntime.id: "codex"` 表示使用 Codex，否则会返回清晰的选择/运行时错误——
绝不会静默路由回 OpenClaw。只有 `auto` 可以将不匹配的
轮次路由到 OpenClaw。

CLI 后端别名不同于嵌入式 harness ID。推荐的 Claude CLI 形式：

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

为保持兼容，仍支持 `claude-cli/claude-opus-4-7` 等
旧版引用，但新配置应保持提供商/模型引用规范化，并
将执行后端放入提供商/模型运行时策略中。

旧版 `codex-cli/*` 引用有所不同：Doctor 会将其迁移到 `openai/*`，使其
通过 Codex app-server harness 运行，而不是保留 Codex
CLI 后端。

对于大多数提供商，`auto` 模式有意采用保守策略。OpenAI 智能体
模型是例外：未设置运行时和使用 `auto` 都会解析到 Codex
harness。明确的 OpenClaw 运行时配置仍是 `openai/*` 智能体轮次的可选
兼容路由；当它与选中的 `openai` OAuth
配置文件搭配时，OpenClaw 会在内部通过 Codex 身份验证
传输来路由该路径，同时将公共模型引用保持为 `openai/*`。过时的 OpenAI
运行时会话固定设置会被运行时选择逻辑忽略，并可使用
`openclaw doctor --fix` 清理。

如果 `openclaw doctor` 警告 `codex` 插件已启用，但配置中仍存在旧版
Codex 模型引用，请将其视为旧版路由状态，并运行
`openclaw doctor --fix`，将其重写为使用 Codex 运行时的 `openai/*`。

## GitHub Copilot agent runtime

外部 `@openclaw/copilot` 插件注册了一个由 GitHub Copilot CLI（`@github/copilot-sdk`）支持的、需选择启用的 `copilot` 运行时。它声明了规范的订阅 `github-copilot` 提供商，并且**绝不会**由 `auto` 选择。通过 `agentRuntime.id` 按模型或按提供商选择启用：

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

该 harness 在 `extensions/copilot/doctor-contract-api.ts` 中声明其提供商、运行时、CLI 会话键和身份验证配置文件前缀，`openclaw doctor` 会自动加载这些声明。有关配置、身份验证、对话记录镜像、压缩、声明式 Doctor 契约，以及更广泛的 PI、Codex 与 Copilot SDK 选型，请参阅 [GitHub Copilot agent runtime](/zh-CN/plugins/copilot)。

## 兼容性契约

当运行时不是 OpenClaw 时，其文档应说明它支持哪些 OpenClaw 功能面：

| 问题 | 重要性 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 谁负责模型循环？ | 决定重试、工具继续执行和最终答案决策发生在何处。 |
| 谁负责规范的线程历史记录？ | 决定 OpenClaw 能否编辑历史记录，还是只能进行镜像。 |
| OpenClaw 动态工具是否可用？ | 消息、会话、定时任务和 OpenClaw 自有工具依赖此功能。 |
| 动态工具钩子是否可用？ | 插件依赖 OpenClaw 自有工具外围的 `before_tool_call`、`after_tool_call` 和中间件。 |
| 原生工具钩子是否可用？ | Shell、补丁和运行时自有工具需要原生钩子支持，才能执行策略和进行观测。 |
| 上下文引擎生命周期是否运行？ | 记忆和上下文插件依赖组装、摄取、轮次结束后处理和压缩生命周期。 |
| 会公开哪些压缩数据？ | 某些插件只需要通知；其他插件则需要保留/丢弃的元数据。 |
| 哪些功能明确不受支持？ | 当原生运行时负责更多状态时，用户不应假定它与 OpenClaw 等效。 |

Codex 运行时支持契约记录在 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#v1-support-contract) 中。

## 状态标签

状态输出可以同时显示 `Execution` 和 `Runtime` 标签。应将它们视为诊断信息，而不是提供商名称：

- `openai/gpt-5.6-sol` 等模型引用表示所选的提供商/模型。
- `codex` 等运行时 ID 表示正在执行该轮次的循环。
- Telegram 或 Discord 等渠道标签表示对话发生的位置。

如果运行显示了意外的运行时，请先检查所选提供商/模型的运行时策略。旧版会话运行时固定设置不再决定路由。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [GitHub Copilot agent runtime](/zh-CN/plugins/copilot)
- [OpenAI](/zh-CN/providers/openai)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Models](/zh-CN/concepts/models)
- [状态](/zh-CN/cli/status)
