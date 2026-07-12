---
read_when:
    - 你正在 OpenClaw、Codex、ACP 或其他原生 Agent Runtimes 之间进行选择
    - 你对状态或配置中的提供商/模型/运行时标签感到困惑
    - 你正在记录原生 harness 的支持一致性
summary: OpenClaw 如何区分模型提供商、模型、渠道和 Agent Runtimes
title: Agent Runtimes
x-i18n:
    generated_at: "2026-07-11T20:26:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**智能体运行时**负责一个已准备好的模型循环：它接收提示词、驱动模型输出、处理原生工具调用，并将完成的轮次返回给 OpenClaw。

运行时很容易与提供商混淆，因为两者都会出现在模型配置附近。它们属于不同的层：

| 层级       | 示例                                         | 含义                                                           |
| ---------- | -------------------------------------------- | -------------------------------------------------------------- |
| 提供商     | `anthropic`、`github-copilot`、`openai`      | OpenClaw 如何进行身份验证、发现模型以及命名模型引用。          |
| 模型       | `claude-opus-4-6`、`gpt-5.6-sol`             | 为智能体轮次选择的模型。                                       |
| 智能体运行时 | `claude-cli`、`codex`、`copilot`、`openclaw` | 执行已准备轮次的底层循环或后端。                               |
| 渠道       | Discord、Slack、Telegram、WhatsApp           | 消息进入和离开 OpenClaw 的位置。                               |

**Harness** 是提供智能体运行时的实现（代码术语）。例如，内置的 Codex harness 实现了 `codex` 运行时。公共配置在提供商或模型条目中使用 `agentRuntime.id`；整个智能体级别的运行时键属于旧版配置，会被忽略。`openclaw doctor --fix` 会移除旧的整个智能体级别运行时固定配置，并将旧版运行时模型引用重写为规范的提供商/模型引用，同时在需要时添加模型级运行时策略。

运行时分为两个系列：

- **嵌入式 harness** 在 OpenClaw 已准备好的智能体循环内运行：包括内置的 `openclaw` 运行时，以及已注册的插件 harness，例如 `codex` 和 `copilot`。
- **CLI 后端** 会运行本地 CLI 进程，同时保持模型引用的规范形式。例如，`anthropic/claude-opus-4-8` 搭配模型级 `agentRuntime.id: "claude-cli"` 表示“选择 Anthropic 模型，通过 Claude CLI 执行”。`claude-cli` 不是嵌入式 harness ID，不得传递给 AgentHarness 选择逻辑。

`copilot` harness 是一个独立的、需主动启用的外部插件 harness，用于 GitHub Copilot CLI；有关在 PI、Codex 和 GitHub Copilot agent runtime 之间进行面向用户的选择，请参阅 [GitHub Copilot agent runtime](/zh-CN/plugins/copilot)。

## Codex 接口

多个接口共用 Codex 名称：

| 接口                                             | OpenClaw 名称/配置                     | 功能                                                                                                       |
| ------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 原生 Codex app-server 运行时                     | `openai/*` 模型引用                    | 通过 Codex app-server 运行 OpenAI 嵌入式智能体轮次。这是常见的 ChatGPT/Codex 订阅设置。                     |
| Codex OAuth 身份验证配置文件                     | `openai` OAuth 配置文件                | 存储供 Codex app-server harness 使用的 ChatGPT/Codex 订阅身份验证信息。                                    |
| Codex ACP 适配器                                 | `runtime: "acp"`、`agentId: "codex"`   | 通过外部 ACP/acpx 控制平面运行 Codex。仅在明确要求使用 ACP/acpx 时使用。                                   |
| 原生 Codex 聊天控制命令集                        | `/codex ...`                           | 从聊天中绑定、恢复、Steer、停止和检查 Codex app-server 线程。                                              |
| 用于非智能体接口的 OpenAI Platform API 路由      | `openai/*` 加 API 密钥身份验证         | 直接调用 OpenAI API，例如图像、嵌入、语音和实时 API。                                                      |

这些接口有意彼此独立。启用 `codex` 插件会提供原生 app-server 功能；`openclaw doctor --fix` 负责修复旧版 Codex 路由并清理过时的会话固定配置。现在，为智能体模型选择 `openai/*` 意味着“通过 Codex 运行此模型”，除非使用的是非智能体 OpenAI API 接口。

常见的 ChatGPT/Codex 订阅设置使用 Codex OAuth 进行身份验证，但将模型引用保留为 `openai/*`，并选择 `codex` 运行时：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

这意味着 OpenClaw 选择一个 OpenAI 模型引用，然后要求 Codex app-server 运行时执行嵌入式智能体轮次。它不表示“使用 API 计费”，也不表示渠道、模型提供商目录或 OpenClaw 会话存储会变成 Codex。

启用内置的 `codex` 插件后，应使用原生 `/codex` 命令接口（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`）进行自然语言 Codex 控制，而不是使用 ACP。仅当用户明确要求使用 ACP/acpx 或正在测试 ACP 适配器路径时，才对 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 和类似的外部 harness 仍使用 ACP。

决策树：

1. **Codex 绑定/控制/线程/恢复/Steer/停止** -> 启用内置 `codex` 插件时，使用原生 `/codex` 命令接口。
2. **将 Codex 用作嵌入式运行时**或使用常规的订阅支持型 Codex 智能体体验 -> `openai/<model>`。
3. **为 OpenAI 模型明确选择 OpenClaw** -> 将模型引用保留为 `openai/<model>`，并将提供商/模型运行时策略设置为 `agentRuntime.id: "openclaw"`。所选的 `openai` OAuth 配置文件会通过 OpenClaw 的 Codex 身份验证传输层在内部进行路由。
4. **配置中的旧版 Codex 模型引用** -> 使用 `openclaw doctor --fix` 修复为 `openai/<model>`；如果旧模型引用隐含使用 Codex 身份验证路由，Doctor 会通过添加提供商/模型级 `agentRuntime.id: "codex"` 来保留该路由。旧版 **`codex-cli/*`** 模型引用会修复到相同的 `openai/<model>` Codex app-server 路由；OpenClaw 不再保留内置的 Codex CLI 后端。
5. **明确要求使用 ACP、acpx 或 Codex ACP 适配器** -> `runtime: "acp"` 和 `agentId: "codex"`。
6. **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 harness** -> 使用 ACP/acpx，而不是原生子智能体运行时。

| 你的意图是……                           | 使用……                                       |
| -------------------------------------- | -------------------------------------------- |
| Codex app-server 聊天/线程控制         | 内置 `codex` 插件提供的 `/codex ...`         |
| Codex app-server 嵌入式智能体运行时    | `openai/*` 智能体模型引用                    |
| OpenAI Codex OAuth                     | `openai` OAuth 配置文件                      |
| Claude Code 或其他外部 harness         | ACP/acpx                                     |

有关 OpenAI 系列前缀的拆分，请参阅 [OpenAI](/zh-CN/providers/openai) 和[模型提供商](/zh-CN/concepts/model-providers)。有关 Codex 运行时支持契约，请参阅 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#v1-support-contract)。

## 运行时所有权

不同运行时负责不同范围的循环：

| 接口                       | OpenClaw 嵌入式                                  | Codex app-server                                                              |
| -------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| 模型循环所有者             | OpenClaw，通过 OpenClaw 嵌入式运行器             | Codex app-server                                                              |
| 规范线程状态               | OpenClaw 对话记录                                 | Codex 线程，加上 OpenClaw 对话记录镜像                                        |
| OpenClaw 动态工具          | 原生 OpenClaw 工具循环                           | 通过 Codex 适配器桥接                                                        |
| 原生 shell 和文件工具      | OpenClaw 路径                                    | Codex 原生工具，在支持时通过原生钩子桥接                                     |
| 上下文引擎                 | 原生 OpenClaw 上下文组装                         | OpenClaw 将组装后的上下文投射到 Codex 轮次中                                 |
| 压缩                       | OpenClaw 或所选上下文引擎                        | Codex 原生压缩，同时由 OpenClaw 提供通知并维护镜像                           |
| 渠道传递                   | OpenClaw                                         | OpenClaw                                                                      |

设计规则：如果某个接口由 OpenClaw 所有，它便可以提供常规插件钩子行为。如果该接口由原生运行时所有，OpenClaw 就需要运行时事件或原生钩子。如果规范线程状态由原生运行时所有，OpenClaw 会镜像并投射上下文，而不是重写不受支持的内部状态。

## 运行时选择

OpenClaw 会在解析提供商和模型后，按以下顺序解析嵌入式运行时：

1. **模型级运行时策略**优先。该策略位于已配置的提供商模型条目中，或位于 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` 中。提供商通配符（例如 `agents.defaults.models["vllm/*"].agentRuntime`）会在精确模型策略之后应用，因此动态发现的提供商模型可以共享同一个运行时，而不会覆盖精确的逐模型例外。
2. **提供商级运行时策略**：`models.providers.<provider>.agentRuntime`。
3. **`auto` 模式**：已注册的插件运行时可以声明支持的提供商/模型组合。
4. 如果在 `auto` 模式下没有运行时声明该轮次，OpenClaw 会回退到 `openclaw`，将其作为兼容性运行时。如果必须严格执行该轮次，请使用明确的运行时 ID。

整个会话级别和整个智能体级别的运行时固定配置会被忽略：包括 `OPENCLAW_AGENT_RUNTIME`、会话 `agentHarnessId`/`agentRuntimeOverride` 状态、`agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。运行 `openclaw doctor --fix` 可移除过时的整个智能体级别运行时配置，并在可以保留原始意图时转换旧版运行时模型引用。

明确指定的提供商/模型插件运行时会采用失败关闭策略：在提供商或模型上设置 `agentRuntime.id: "codex"` 表示必须使用 Codex，否则返回清晰的选择/运行时错误——绝不会静默路由回 OpenClaw。只有 `auto` 可以将未匹配的轮次路由到 OpenClaw。

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

出于兼容性考虑，仍支持 `claude-cli/claude-opus-4-7` 等旧版引用，但新配置应保持提供商/模型的规范形式，并将执行后端放入提供商/模型运行时策略中。

旧版 `codex-cli/*` 引用有所不同：Doctor 会将其迁移到 `openai/*`，使其通过 Codex app-server harness 运行，而不是保留 Codex CLI 后端。

对于大多数提供商，`auto` 模式有意采取保守策略。OpenAI 智能体模型是例外：未设置运行时和使用 `auto` 都会解析到 Codex harness。对于 `openai/*` 智能体轮次，明确配置 OpenClaw 运行时仍是一条需主动启用的兼容性路由；当它与所选的 `openai` OAuth 配置文件配合使用时，OpenClaw 会通过 Codex 身份验证传输层在内部路由该路径，同时将公共模型引用保留为 `openai/*`。过时的 OpenAI 运行时会话固定配置会被运行时选择逻辑忽略，并可使用 `openclaw doctor --fix` 清理。

如果 `openclaw doctor` 发出警告，提示 `codex` 插件已启用但配置中仍存在旧版 Codex 模型引用，请将其视为旧版路由状态，并运行 `openclaw doctor --fix`，将其重写为使用 Codex 运行时的 `openai/*`。

## GitHub Copilot agent runtime

外部 `@openclaw/copilot` 插件注册了一个需显式启用的 `copilot` 运行时，
该运行时由 GitHub Copilot CLI（`@github/copilot-sdk`）提供支持。它声明使用
规范的订阅提供商 `github-copilot`，并且**绝不会**被 `auto` 选中。
通过 `agentRuntime.id` 按模型或按提供商启用：

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

该 harness 在 `extensions/copilot/doctor-contract-api.ts` 中声明其提供商、
运行时、CLI 会话键和身份验证配置文件前缀，`openclaw doctor` 会自动加载这些声明。
有关配置、身份验证、对话记录镜像、压缩、声明式 Doctor 契约，以及更广泛的
PI、Codex 与 Copilot SDK 选型决策，请参阅
[GitHub Copilot agent runtime](/zh-CN/plugins/copilot)。

## 兼容性契约

当运行时并非 OpenClaw 时，其文档应说明它支持哪些 OpenClaw 功能面：

| 问题 | 重要原因 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 谁负责模型循环？ | 决定重试、工具延续和最终回答决策在何处执行。 |
| 谁负责规范的线程历史记录？ | 决定 OpenClaw 能否编辑历史记录，还是只能进行镜像。 |
| OpenClaw 动态工具是否可用？ | 消息、会话、定时任务和 OpenClaw 自有工具依赖此功能。 |
| 动态工具钩子是否可用？ | 插件需要围绕 OpenClaw 自有工具使用 `before_tool_call`、`after_tool_call` 和中间件。 |
| 原生工具钩子是否可用？ | Shell、补丁和运行时自有工具需要原生钩子支持，以实施策略和进行观测。 |
| 上下文引擎生命周期是否运行？ | 记忆和上下文插件依赖组装、摄取、轮次后处理及压缩生命周期。 |
| 会公开哪些压缩数据？ | 一些插件只需要通知；另一些则需要保留项和丢弃项的元数据。 |
| 哪些功能明确不受支持？ | 当原生运行时管理更多状态时，用户不应假定其与 OpenClaw 等效。 |

Codex 运行时支持契约记录于
[Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#v1-support-contract)。

## 状态标签

状态输出可以同时显示 `Execution` 和 `Runtime` 标签。应将它们视为诊断信息，
而非提供商名称：

- `openai/gpt-5.6-sol` 之类的模型引用表示选中的提供商/模型。
- `codex` 之类的运行时 ID 表示正在执行该轮次的循环。
- Telegram 或 Discord 之类的渠道标签表示对话发生的位置。

如果某次运行显示了非预期的运行时，请先检查所选提供商/模型的运行时策略。
旧版会话运行时固定设置不再决定路由。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [GitHub Copilot agent runtime](/zh-CN/plugins/copilot)
- [OpenAI](/zh-CN/providers/openai)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Models](/zh-CN/concepts/models)
- [状态](/zh-CN/cli/status)
