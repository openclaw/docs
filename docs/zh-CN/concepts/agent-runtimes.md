---
read_when:
    - 你正在 OpenClaw、Codex、ACP 或其他原生智能体运行时之间做选择
    - 你对状态或配置中的提供商/模型/运行时标签感到困惑
    - 你正在记录原生 harness 的支持一致性
summary: OpenClaw 如何分离模型提供商、模型、渠道和 Agent Runtimes
title: Agent Runtimes
x-i18n:
    generated_at: "2026-07-05T11:12:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a4b3c54b9f80e37662dc98f14db8abc4491426695dc9aa081b05bc923cb44ecd
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

一个**智能体运行时**拥有一个准备好的模型循环：它接收提示词，
驱动模型输出，处理原生工具调用，并将完成的轮次返回给
OpenClaw。

运行时很容易与提供商混淆，因为两者都会出现在模型
配置附近。它们属于不同层：

| 层级          | 示例                                         | 含义                                                                |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| 提供商        | `anthropic`, `github-copilot`, `openai`      | OpenClaw 如何认证、发现模型以及命名模型引用。                      |
| 模型          | `claude-opus-4-6`, `gpt-5.5`                 | 为智能体轮次选择的模型。                                            |
| 智能体运行时  | `claude-cli`, `codex`, `copilot`, `openclaw` | 执行已准备轮次的底层循环或后端。                                    |
| 渠道          | Discord, Slack, Telegram, WhatsApp           | 消息进入和离开 OpenClaw 的位置。                                    |

**harness** 是提供智能体运行时的实现（代码术语）。例如，内置的 Codex harness 实现了 `codex` 运行时。
公开配置在提供商或模型条目上使用 `agentRuntime.id`；整智能体
运行时键是旧版配置，会被忽略。`openclaw doctor --fix` 会移除旧的
整智能体运行时固定项，并在需要时将旧版运行时模型引用重写为规范的
提供商/模型引用以及模型作用域的运行时策略。

两类运行时：

- **嵌入式 harness** 在 OpenClaw 准备好的智能体循环内运行：包括
  内置的 `openclaw` 运行时，以及已注册的插件 harness，例如
  `codex` 和 `copilot`。
- **CLI 后端** 运行本地 CLI 进程，同时保持模型引用规范。例如，
  `anthropic/claude-opus-4-8` 搭配模型作用域的
  `agentRuntime.id: "claude-cli"` 表示“选择 Anthropic 模型，并通过
  Claude CLI 执行”。`claude-cli` 不是嵌入式 harness id，不能传给
  AgentHarness 选择逻辑。

`copilot` harness 是一个独立的、可选启用的外部插件 harness，用于
GitHub Copilot CLI；关于 PI、Codex 和 GitHub Copilot agent runtime 之间面向用户的选择，请参阅 [GitHub Copilot agent runtime](/zh-CN/plugins/copilot)。

## Codex 接口面

多个接口面共享 Codex 名称：

| 接口面                                           | OpenClaw 名称/配置                    | 作用                                                                                                           |
| ------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Native Codex app-server 运行时                   | `openai/*` 模型引用                   | 通过 Codex app-server 运行 OpenAI 嵌入式智能体轮次。这是常见的 ChatGPT/Codex 订阅设置。                       |
| Codex OAuth 认证配置文件                         | `openai` OAuth 配置文件               | 存储 Codex app-server harness 使用的 ChatGPT/Codex 订阅认证。                                                  |
| Codex ACP 适配器                                 | `runtime: "acp"`, `agentId: "codex"` | 通过外部 ACP/acpx 控制平面运行 Codex。仅在明确要求 ACP/acpx 时使用。                                           |
| Native Codex 聊天控制命令集                      | `/codex ...`                          | 从聊天中绑定、恢复、Steer、停止和检查 Codex app-server 线程。                                                  |
| 面向非智能体接口面的 OpenAI Platform API 路由    | `openai/*` 加 API key 认证            | 直接 OpenAI API，例如图像、嵌入、语音和实时。                                                                  |

这些接口面有意保持独立。启用 `codex` 插件会让原生 app-server 功能可用；`openclaw doctor --fix` 负责旧版 Codex 路由修复和过期会话固定项清理。现在为智能体模型选择 `openai/*` 表示“通过 Codex 运行它”，除非正在使用非智能体的 OpenAI API 接口面。

常见的 ChatGPT/Codex 订阅设置使用 Codex OAuth 进行认证，但
将模型引用保持为 `openai/*`，并选择 `codex` 运行时：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

这表示 OpenClaw 选择一个 OpenAI 模型引用，然后要求 Codex
app-server 运行时运行嵌入式智能体轮次。它并不表示“使用 API
计费”，也不表示渠道、模型提供商目录或 OpenClaw 会话存储会变成 Codex。

启用内置 `codex` 插件时，请使用原生 `/codex` 命令接口面
（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、
`/codex stop`）进行自然语言 Codex 控制，而不是 ACP。仅当用户明确要求
ACP/acpx 或正在测试 ACP 适配器路径时，才将 ACP 用于 Codex。Claude Code、Gemini CLI、OpenCode、Cursor 和类似外部 harness 仍然使用 ACP。

决策树：

1. **Codex 绑定/控制/线程/恢复/Steer/停止** -> 启用内置 `codex` 插件时，使用原生 `/codex` 命令接口面。
2. **Codex 作为嵌入式运行时**，或普通的订阅支持 Codex 智能体体验 -> `openai/<model>`。
3. **为 OpenAI 模型明确选择 OpenClaw** -> 将模型引用保持为 `openai/<model>`，并将提供商/模型运行时策略设置为 `agentRuntime.id: "openclaw"`。选中的 `openai` OAuth 配置文件会在内部通过 OpenClaw 的 Codex 认证传输路由。
4. **配置中的旧版 Codex 模型引用** -> 使用 `openclaw doctor --fix` 修复为 `openai/<model>`；当旧模型引用隐含该意图时，Doctor 会通过添加提供商/模型作用域的 `agentRuntime.id: "codex"` 来保留 Codex 认证路由。旧版 **`codex-cli/*`** 模型引用会修复为相同的 `openai/<model>` Codex app-server 路由；OpenClaw 不再保留内置 Codex CLI 后端。
5. **明确请求 ACP、acpx 或 Codex ACP 适配器** -> `runtime: "acp"` 和 `agentId: "codex"`。
6. **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 harness** -> ACP/acpx，而不是原生子智能体运行时。

| 你的意思是...                         | 使用...                                      |
| -------------------------------------- | -------------------------------------------- |
| Codex app-server 聊天/线程控制         | 来自内置 `codex` 插件的 `/codex ...`         |
| Codex app-server 嵌入式智能体运行时    | `openai/*` 智能体模型引用                    |
| OpenAI Codex OAuth                     | `openai` OAuth 配置文件                      |
| Claude Code 或其他外部 harness         | ACP/acpx                                     |

关于 OpenAI 系列前缀拆分，请参阅 [OpenAI](/zh-CN/providers/openai) 和
[模型提供商](/zh-CN/concepts/model-providers)。关于 Codex 运行时支持
契约，请参阅 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#v1-support-contract)。

## 运行时所有权

不同运行时拥有循环中的不同部分：

| 接口面                      | OpenClaw 嵌入式                              | Codex app-server                                                            |
| --------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| 模型循环所有者              | OpenClaw，通过 OpenClaw 嵌入式运行器         | Codex app-server                                                            |
| 规范线程状态                | OpenClaw 转录                                | Codex 线程，加 OpenClaw 转录镜像                                            |
| OpenClaw 动态工具           | 原生 OpenClaw 工具循环                       | 通过 Codex 适配器桥接                                                       |
| 原生 shell 和文件工具       | OpenClaw 路径                                | Codex 原生工具，在支持处通过原生钩子桥接                                    |
| 上下文引擎                  | 原生 OpenClaw 上下文组装                     | OpenClaw 将组装好的上下文投射到 Codex 轮次中                                |
| 压缩                        | OpenClaw 或选定的上下文引擎                  | Codex 原生压缩，配合 OpenClaw 通知和镜像维护                                |
| 渠道投递                    | OpenClaw                                     | OpenClaw                                                                    |

设计规则：如果 OpenClaw 拥有该接口面，它可以提供正常的插件钩子
行为。如果原生运行时拥有该接口面，OpenClaw 需要运行时
事件或原生钩子。如果原生运行时拥有规范线程状态，
OpenClaw 会镜像并投射上下文，而不是重写不受支持的
内部机制。

## 运行时选择

OpenClaw 在提供商和模型解析之后，按以下顺序解析嵌入式运行时：

1. **模型作用域运行时策略** 优先。它位于已配置的提供商
   模型条目中，或位于 `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime` 中。像
   `agents.defaults.models["vllm/*"].agentRuntime` 这样的提供商
   通配符会在精确模型策略之后应用，因此动态发现的提供商模型可以
   共享一个运行时，而不会覆盖精确的逐模型例外。
2. **提供商作用域运行时策略**：`models.providers.<provider>.agentRuntime`。
3. **`auto` 模式**：已注册的插件运行时可以声明支持的提供商/模型组合。
4. 如果在 `auto` 模式下没有任何运行时声明该轮次，OpenClaw 会回退到
   `openclaw` 作为兼容运行时。当运行必须严格时，请使用明确的运行时 id。

整会话和整智能体运行时固定项会被忽略：`OPENCLAW_AGENT_RUNTIME`、
会话 `agentHarnessId`/`agentRuntimeOverride` 状态、`agents.defaults.agentRuntime`
以及 `agents.list[].agentRuntime`。运行 `openclaw doctor --fix` 可移除过期的
整智能体运行时配置，并在可以保留意图时转换旧版运行时模型引用。

显式的提供商/模型插件运行时会失败关闭：提供商或模型上的
`agentRuntime.id: "codex"` 表示 Codex，或者返回明确的选择/运行时错误；
它绝不会被静默路由回 OpenClaw。只有 `auto` 可以将未匹配的
轮次路由到 OpenClaw。

CLI 后端别名不同于嵌入式 harness id。推荐的 Claude CLI 形式：

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

为兼容性起见，仍支持 `claude-cli/claude-opus-4-7` 等旧版引用，
但新配置应保持提供商/模型规范，并将执行后端放在提供商/模型运行时策略中。

旧版 `codex-cli/*` 引用不同：Doctor 会将它们迁移到 `openai/*`，
使其通过 Codex app-server harness 运行，而不是保留 Codex
CLI 后端。

对于大多数提供商，`auto` 模式有意保持保守。OpenAI 智能体
模型是例外：未设置运行时和 `auto` 都会解析到 Codex
harness。显式 OpenClaw 运行时配置仍然是 `openai/*` 智能体轮次的
可选兼容路由；当它与选中的 `openai` OAuth 配置文件配对时，
OpenClaw 会在内部通过 Codex 认证传输路由该路径，同时将公开
模型引用保持为 `openai/*`。过期的 OpenAI 运行时会话固定项会被
运行时选择忽略，并可通过 `openclaw doctor --fix` 清理。

如果 `openclaw doctor` 警告 `codex` 插件已启用，而配置中仍存在旧版
Codex 模型引用，请将其视为旧版路由状态，并运行
`openclaw doctor --fix` 将其重写为带 Codex 运行时的 `openai/*`。

## GitHub Copilot agent runtime

外部 `@openclaw/copilot` 插件会注册一个可选启用的 `copilot` 运行时，
由 GitHub Copilot CLI（`@github/copilot-sdk`）提供支持。它声明规范订阅
`github-copilot` 提供商，并且**绝不会**被 `auto` 选中。通过 `agentRuntime.id`
按模型或按提供商选择启用：

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

该 harness 在 `extensions/copilot/doctor-contract-api.ts` 中声明它的提供商、运行时、CLI 会话键和认证配置前缀，`openclaw doctor` 会自动加载它。关于配置、认证、转录镜像、压缩、声明式 Doctor 契约，以及更广泛的 PI vs Codex vs Copilot SDK 决策，请参阅 [GitHub Copilot agent runtime](/zh-CN/plugins/copilot)。

## 兼容性契约

当运行时不是 OpenClaw 时，其文档应说明它支持哪些 OpenClaw 表面：

| 问题                                   | 重要原因                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 谁拥有模型循环？                       | 决定重试、工具继续执行和最终回答决策发生在哪里。                                                  |
| 谁拥有规范线程历史？                   | 决定 OpenClaw 能否编辑历史，还是只能镜像历史。                                                     |
| OpenClaw 动态工具能否工作？            | 消息、会话、cron 和 OpenClaw 拥有的工具依赖此能力。                                                |
| 动态工具钩子能否工作？                 | 插件期望在 OpenClaw 拥有的工具周围使用 `before_tool_call`、`after_tool_call` 和中间件。            |
| 原生工具钩子能否工作？                 | shell、patch 和运行时拥有的工具需要原生钩子支持来实现策略和观察。                                  |
| 上下文引擎生命周期是否运行？           | 记忆和上下文插件依赖 assemble、ingest、after-turn 和压缩生命周期。                                 |
| 暴露了哪些压缩数据？                   | 有些插件只需要通知；其他插件需要保留/丢弃的元数据。                                                |
| 哪些内容是有意不支持的？               | 用户不应在原生运行时拥有更多状态的地方假设它与 OpenClaw 等价。                                     |

Codex 运行时支持契约记录在
[Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#v1-support-contract) 中。

## 状态标签

状态输出可以同时显示 `Execution` 和 `Runtime` 标签。请将它们视为诊断信息，而不是提供商名称：

- 像 `openai/gpt-5.5` 这样的模型引用是选中的提供商/模型。
- 像 `codex` 这样的运行时 ID 是执行该轮次的循环。
- 像 Telegram 或 Discord 这样的渠道标签表示对话发生的位置。

如果某次运行显示了意外的运行时，请先检查所选提供商/模型的运行时策略。旧版会话运行时固定项不再决定路由。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [GitHub Copilot agent runtime](/zh-CN/plugins/copilot)
- [OpenAI](/zh-CN/providers/openai)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Models](/zh-CN/concepts/models)
- [状态](/zh-CN/cli/status)
