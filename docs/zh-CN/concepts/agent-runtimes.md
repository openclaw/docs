---
read_when:
    - 你正在 PI、Codex、ACP 或另一个原生智能体运行时之间做选择
    - 你对状态或配置中的提供商/模型/运行时标签感到困惑
    - 你正在记录原生运行框架的支持对等性
summary: OpenClaw 如何分离模型提供商、模型、渠道和 Agent Runtimes
title: Agent Runtimes
x-i18n:
    generated_at: "2026-05-10T19:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**智能体运行时**是拥有一个已准备模型循环的组件：它
接收提示词，驱动模型输出，处理原生工具调用，并将
完成的轮次返回给 OpenClaw。

运行时很容易和提供商混淆，因为两者都会出现在模型
配置附近。它们是不同层：

| 层级          | 示例                                  | 含义                                                                |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| 提供商        | `openai`, `anthropic`, `openai-codex` | OpenClaw 如何认证、发现模型并命名模型引用。                         |
| 模型          | `gpt-5.5`, `claude-opus-4-6`          | 为智能体轮次选择的模型。                                            |
| 智能体运行时  | `pi`, `codex`, `claude-cli`           | 执行已准备轮次的底层循环或后端。                                    |
| 渠道          | Telegram, Discord, Slack, WhatsApp    | 消息进入和离开 OpenClaw 的位置。                                    |

你也会在代码中看到 **harness** 这个词。harness 是提供智能体运行时的实现。
例如，内置的 Codex harness
实现了 `codex` 运行时。公共配置在提供商或模型条目上使用 `agentRuntime.id`；
整智能体运行时键是旧版配置，会被忽略。
`openclaw doctor --fix` 会移除旧的整智能体运行时固定项，并在需要时将
旧版运行时模型引用重写为规范的提供商/模型引用，加上模型级运行时策略。

运行时分为两类：

- **嵌入式 harness** 在 OpenClaw 已准备的智能体循环内运行。当前包括
  内置的 `pi` 运行时，以及已注册的插件 harness，例如 `codex`。
- **CLI 后端** 会运行本地 CLI 进程，同时保持模型引用规范。例如，
  `anthropic/claude-opus-4-7` 加上模型级 `agentRuntime.id: "claude-cli"`
  表示“选择 Anthropic 模型，通过 Claude CLI 执行”。`claude-cli` 不是嵌入式 harness id，
  不得传给 AgentHarness 选择逻辑。

## Codex 表面

大多数混淆来自多个不同表面共用 Codex 名称：

| 表面                                             | OpenClaw 名称/配置                   | 作用                                                                                                           |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 原生 Codex app-server 运行时                     | `openai/*` 模型引用                  | 通过 Codex app-server 运行 OpenAI 嵌入式智能体轮次。这是常见的 ChatGPT/Codex 订阅设置。                         |
| Codex OAuth 认证配置文件                         | `openai-codex` 认证提供商            | 存储 Codex app-server harness 使用的 ChatGPT/Codex 订阅认证。                                                   |
| Codex ACP 适配器                                 | `runtime: "acp"`, `agentId: "codex"` | 通过外部 ACP/acpx 控制平面运行 Codex。仅在明确要求 ACP/acpx 时使用。                                           |
| 原生 Codex 聊天控制命令集                        | `/codex ...`                         | 从聊天中绑定、恢复、Steer、停止和检查 Codex app-server 线程。                                                  |
| 非智能体表面的 OpenAI Platform API 路由          | `openai/*` 加 API 密钥认证           | 用于直接 OpenAI API，例如图像、嵌入、语音和实时。                                                              |

这些表面有意保持相互独立。启用 `codex` 插件会让原生 app-server 功能可用；
`openclaw doctor --fix` 负责旧版 `openai-codex/*` 路由修复和过期会话固定清理。
现在为智能体模型选择 `openai/*` 表示“通过 Codex 运行它”，除非正在使用
非智能体 OpenAI API 表面。

常见的 ChatGPT/Codex 订阅设置使用 Codex OAuth 做认证，但保持模型引用为
`openai/*` 并选择 `codex` 运行时：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

这意味着 OpenClaw 选择一个 OpenAI 模型引用，然后请求 Codex app-server
运行时运行嵌入式智能体轮次。它不表示“使用 API 计费”，也不表示渠道、
模型提供商目录或 OpenClaw 会话存储会变成 Codex。

启用内置 `codex` 插件时，自然语言 Codex 控制应使用原生 `/codex` 命令表面
（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`），
而不是 ACP。仅当用户明确要求 ACP/acpx 或正在测试 ACP 适配器路径时，
才对 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 和类似外部
harness 仍使用 ACP。

这是面向智能体的决策树：

1. 如果用户要求 **Codex 绑定/控制/线程/恢复/Steer/停止**，在启用内置
   `codex` 插件时使用原生 `/codex` 命令表面。
2. 如果用户要求 **Codex 作为嵌入式运行时**，或想要正常的订阅支持 Codex
   智能体体验，使用 `openai/<model>`。
3. 如果用户明确为 **OpenAI 模型选择 PI**，保持模型引用为 `openai/<model>`，
   并将提供商/模型运行时策略设置为 `agentRuntime.id: "pi"`。选中的
   `openai-codex` 认证配置文件会在内部通过 PI 的旧版 Codex 认证传输路由。
4. 如果旧版配置仍包含 **`openai-codex/*` 模型引用**，用
   `openclaw doctor --fix` 将其修复为 `openai/<model>`；doctor 会在旧模型引用隐含
   Codex 认证路由的位置，通过添加提供商/模型级 `agentRuntime.id: "codex"` 来保留该意图。
5. 如果用户明确说 **ACP**、**acpx** 或 **Codex ACP 适配器**，使用
   `runtime: "acp"` 和 `agentId: "codex"` 的 ACP。
6. 如果请求面向 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部
   harness**，使用 ACP/acpx，而不是原生子智能体运行时。

| 你的意思是...                         | 使用...                                      |
| ------------------------------------- | -------------------------------------------- |
| Codex app-server 聊天/线程控制        | 内置 `codex` 插件的 `/codex ...`             |
| Codex app-server 嵌入式智能体运行时   | `openai/*` 智能体模型引用                    |
| OpenAI Codex OAuth                    | `openai-codex` 认证配置文件                  |
| Claude Code 或其他外部 harness        | ACP/acpx                                     |

关于 OpenAI 系列前缀拆分，请参阅 [OpenAI](/zh-CN/providers/openai) 和
[模型提供商](/zh-CN/concepts/model-providers)。关于 Codex 运行时支持契约，请参阅
[Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#v1-support-contract)。

## 运行时所有权

不同运行时拥有循环中不同范围的内容。

| 表面                       | OpenClaw PI 嵌入式                     | Codex app-server                                                            |
| -------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| 模型循环所有者             | OpenClaw 通过 PI 嵌入式运行器          | Codex app-server                                                            |
| 规范线程状态               | OpenClaw transcript                    | Codex 线程，加上 OpenClaw transcript 镜像                                   |
| OpenClaw 动态工具          | 原生 OpenClaw 工具循环                 | 通过 Codex 适配器桥接                                                       |
| 原生 shell 和文件工具      | PI/OpenClaw 路径                       | Codex 原生工具，在支持的位置通过原生钩子桥接                                |
| 上下文引擎                 | 原生 OpenClaw 上下文组装               | OpenClaw 将项目上下文组装到 Codex 轮次中                                    |
| 压缩                       | OpenClaw 或选定的上下文引擎            | Codex 原生压缩，带 OpenClaw 通知和镜像维护                                  |
| 渠道投递                   | OpenClaw                               | OpenClaw                                                                    |

这种所有权拆分是主要设计规则：

- 如果 OpenClaw 拥有该表面，OpenClaw 就可以提供正常的插件钩子行为。
- 如果原生运行时拥有该表面，OpenClaw 需要运行时事件或原生钩子。
- 如果原生运行时拥有规范线程状态，OpenClaw 应镜像并投射上下文，而不是重写不受支持的内部实现。

## 运行时选择

OpenClaw 在提供商和模型解析之后选择嵌入式运行时：

1. 模型级运行时策略优先。它可以位于已配置的提供商模型条目中，也可以位于
   `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`。
2. 其次是提供商级运行时策略，位于
   `models.providers.<provider>.agentRuntime`。
3. 在 `auto` 模式下，已注册的插件运行时可以声明支持的提供商/模型组合。
4. 如果在 `auto` 模式下没有运行时声明某个轮次，OpenClaw 会使用 PI 作为
   兼容性运行时。如果运行必须严格，请使用显式运行时 id。

整会话和整智能体运行时固定项会被忽略。这包括
`OPENCLAW_AGENT_RUNTIME`、会话 `agentHarnessId`/`agentRuntimeOverride` 状态、
`agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。运行
`openclaw doctor --fix` 可移除过期的整智能体运行时配置，并在 OpenClaw 能够保留意图时转换
旧版运行时模型引用。

显式提供商/模型插件运行时会失败关闭。例如，提供商或模型上的
`agentRuntime.id: "codex"` 表示 Codex，或明确的选择/运行时错误；
它绝不会被静默路由回 PI。

CLI 后端别名不同于嵌入式 harness id。首选的 Claude CLI 形式是：

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

为兼容性仍支持 `claude-cli/claude-opus-4-7` 等旧版引用，但新配置应保持
提供商/模型规范，并将执行后端放入提供商/模型运行时策略中。

对大多数提供商而言，`auto` 模式有意保持保守。OpenAI 智能体模型是例外：
未设置运行时和 `auto` 都会解析到 Codex harness。显式 PI 运行时配置仍是
`openai/*` 智能体轮次的选择性兼容路径；当它与选中的 `openai-codex` 认证配置文件配对时，
OpenClaw 会在内部通过旧版 Codex 认证传输路由 PI，同时保持公共模型引用为
`openai/*`。过期的 OpenAI PI 会话固定项会被运行时选择忽略，并可用
`openclaw doctor --fix` 清理。

如果 `openclaw doctor` 警告 `codex` 插件已启用，但配置中仍有
`openai-codex/*`，请将其视为旧版路由状态。运行
`openclaw doctor --fix` 将其重写为带 Codex 运行时的 `openai/*`。

## 兼容性契约

当运行时不是 PI 时，它应记录它支持哪些 OpenClaw 表面。
运行时文档请使用这种结构：

| 问题                                   | 为什么重要                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 谁拥有模型循环？                       | 决定重试、工具继续执行和最终答案决策发生在哪里。                                                   |
| 谁拥有规范线程历史？                   | 决定 OpenClaw 能否编辑历史，还是只能镜像历史。                                                      |
| OpenClaw 动态工具是否可用？            | 消息、会话、cron 和 OpenClaw 拥有的工具都依赖它。                                                   |
| 动态工具钩子是否可用？                 | 插件期望在 OpenClaw 拥有的工具周围使用 `before_tool_call`、`after_tool_call` 和中间件。             |
| 原生工具钩子是否可用？                 | Shell、patch 和运行时拥有的工具需要原生钩子支持，以便执行策略和观察。                              |
| 上下文引擎生命周期是否运行？           | 记忆和上下文插件依赖组装、摄取、轮次后处理和压缩生命周期。                                         |
| 暴露了哪些压缩数据？                   | 某些插件只需要通知，而其他插件需要保留/丢弃的元数据。                                              |
| 哪些内容是有意不支持的？               | 用户不应在原生运行时拥有更多状态的地方假定 PI 等价性。                                             |

Codex 运行时支持契约记录在
[Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#v1-support-contract) 中。

## Status 标签

Status 输出可能同时显示 `Execution` 和 `Runtime` 标签。应将它们视为
诊断信息，而不是提供商名称。

- 像 `openai/gpt-5.5` 这样的模型引用会告诉你选中的提供商/模型。
- 像 `codex` 这样的运行时 id 会告诉你哪个循环正在执行该轮次。
- 像 Telegram 或 Discord 这样的渠道标签会告诉你对话发生在哪里。

如果一次运行仍显示意外的运行时，请先检查所选提供商/模型的
运行时策略。旧版会话运行时固定不再决定路由。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [OpenAI](/zh-CN/providers/openai)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Models](/zh-CN/concepts/models)
- [Status](/zh-CN/cli/status)
