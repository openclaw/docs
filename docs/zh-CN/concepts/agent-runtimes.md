---
read_when:
    - 你正在 PI、Codex、ACP 或其他原生智能体运行时之间做选择
    - 你对状态或配置中的提供商/模型/运行时标签感到困惑
    - 你正在记录原生运行框架的支持一致性
summary: OpenClaw 如何区分模型提供商、模型、渠道和 Agent Runtimes
title: Agent Runtimes
x-i18n:
    generated_at: "2026-05-07T13:15:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**智能体运行时**是拥有一个已准备好的模型循环的组件：它
接收提示词，驱动模型输出，处理原生工具调用，并将完成后的轮次返回给 OpenClaw。

运行时很容易与提供商混淆，因为两者都会出现在模型配置附近。
它们是不同的层：

| 层级          | 示例                                  | 含义                                                               |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| 提供商        | `openai`, `anthropic`, `openai-codex` | OpenClaw 如何认证、发现模型并命名模型引用。                       |
| 模型          | `gpt-5.5`, `claude-opus-4-6`          | 为智能体轮次选择的模型。                                           |
| 智能体运行时  | `pi`, `codex`, `claude-cli`           | 执行已准备轮次的底层循环或后端。                                   |
| 渠道          | Telegram, Discord, Slack, WhatsApp    | 消息进入和离开 OpenClaw 的位置。                                   |

你还会在代码中看到 **harness** 这个词。harness 是提供智能体运行时的实现。
例如，内置的 Codex harness 实现了 `codex` 运行时。公共配置使用
`agentRuntime.id`；`openclaw doctor --fix` 会将较旧的 runtime-policy 键重写为这种形状。

有两类运行时：

- **嵌入式 harness** 在 OpenClaw 已准备好的智能体循环内运行。当前这包括
  内置的 `pi` 运行时，以及已注册的插件 harness，例如 `codex`。
- **CLI 后端** 运行本地 CLI 进程，同时保持模型引用规范化。例如，
  `anthropic/claude-opus-4-7` 搭配 `agentRuntime.id: "claude-cli"` 表示
  “选择 Anthropic 模型，通过 Claude CLI 执行”。`claude-cli` 不是嵌入式 harness ID，
  也绝不能传给 AgentHarness 选择逻辑。

## Codex 表面

大多数混淆来自多个不同表面共享 Codex 名称：

| 表面                                             | OpenClaw 名称/配置                    | 作用                                                                                                           |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 原生 Codex app-server 运行时                     | `openai/*` 模型引用                  | 通过 Codex app-server 运行 OpenAI 嵌入式智能体轮次。这是常见的 ChatGPT/Codex 订阅设置。                        |
| Codex OAuth 认证配置文件                         | `openai-codex` 认证提供商            | 存储供 Codex app-server harness 使用的 ChatGPT/Codex 订阅认证。                                                |
| Codex ACP 适配器                                 | `runtime: "acp"`, `agentId: "codex"` | 通过外部 ACP/acpx 控制平面运行 Codex。仅在明确要求 ACP/acpx 时使用。                                          |
| 原生 Codex 聊天控制命令集                        | `/codex ...`                         | 从聊天中绑定、恢复、Steer、停止和检查 Codex app-server 线程。                                                  |
| 非智能体表面的 OpenAI Platform API 路由          | `openai/*` 加 API key 认证           | 用于直接 OpenAI API，例如图像、嵌入、语音和实时。                                                             |

这些表面有意保持独立。启用 `codex` 插件会让原生 app-server 功能可用；
`openclaw doctor --fix` 负责修复旧版 `openai-codex/*` 路由并清理过期会话固定项。
现在为智能体模型选择 `openai/*` 表示“通过 Codex 运行此模型”，除非使用的是非智能体 OpenAI API 表面。

常见的 ChatGPT/Codex 订阅设置使用 Codex OAuth 进行认证，但将模型引用保持为
`openai/*`，并选择 `codex` 运行时：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

这表示 OpenClaw 选择一个 OpenAI 模型引用，然后请求 Codex app-server
运行时来运行嵌入式智能体轮次。它不表示“使用 API 计费”，也不表示渠道、
模型提供商目录或 OpenClaw 会话存储会变成 Codex。

启用内置 `codex` 插件后，自然语言 Codex 控制应使用原生 `/codex` 命令表面
（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`），
而不是 ACP。仅当用户明确要求 ACP/acpx 或正在测试 ACP 适配器路径时，才对 Codex 使用 ACP。
Claude Code、Gemini CLI、OpenCode、Cursor 以及类似的外部 harness 仍使用 ACP。

这是面向智能体的决策树：

1. 如果用户要求 **Codex 绑定/控制/线程/恢复/Steer/停止**，并且已启用内置
   `codex` 插件，则使用原生 `/codex` 命令表面。
2. 如果用户要求 **Codex 作为嵌入式运行时**，或想要普通的订阅支持 Codex 智能体体验，
   请使用 `openai/<model>`。
3. 如果用户明确为 **OpenAI 模型选择 PI**，保持模型引用为 `openai/<model>`，
   并设置 `agentRuntime.id: "pi"`。选中的 `openai-codex` 认证配置文件会在内部通过
   PI 的旧版 Codex-auth 传输路由。
4. 如果旧版配置仍包含 **`openai-codex/*` 模型引用**，请用
   `openclaw doctor --fix` 将其修复为 `openai/<model>`。
5. 如果用户明确说 **ACP**、**acpx** 或 **Codex ACP 适配器**，请使用 ACP，
   并设置 `runtime: "acp"` 和 `agentId: "codex"`。
6. 如果请求针对 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 harness**，
   使用 ACP/acpx，而不是原生子智能体运行时。

| 你的意思是...                          | 使用...                                      |
| -------------------------------------- | -------------------------------------------- |
| Codex app-server 聊天/线程控制         | 来自内置 `codex` 插件的 `/codex ...`         |
| Codex app-server 嵌入式智能体运行时    | `openai/*` 智能体模型引用                    |
| OpenAI Codex OAuth                     | `openai-codex` 认证配置文件                  |
| Claude Code 或其他外部 harness         | ACP/acpx                                     |

关于 OpenAI 系列前缀拆分，请参阅 [OpenAI](/zh-CN/providers/openai) 和
[模型提供商](/zh-CN/concepts/model-providers)。关于 Codex 运行时支持契约，请参阅
[Codex harness](/zh-CN/plugins/codex-harness#v1-support-contract)。

## 运行时所有权

不同运行时拥有循环的不同部分。

| 表面                        | OpenClaw PI 嵌入式                     | Codex app-server                                                            |
| --------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| 模型循环所有者              | OpenClaw 通过 PI 嵌入式 runner         | Codex app-server                                                            |
| 规范线程状态                | OpenClaw transcript                    | Codex 线程，加上 OpenClaw transcript 镜像                                   |
| OpenClaw 动态工具           | 原生 OpenClaw 工具循环                 | 通过 Codex 适配器桥接                                                       |
| 原生 shell 和文件工具       | PI/OpenClaw 路径                       | Codex 原生工具，在支持时通过原生钩子桥接                                    |
| 上下文引擎                  | 原生 OpenClaw 上下文组装               | OpenClaw 将项目上下文组装进 Codex 轮次                                      |
| 压缩                        | OpenClaw 或选中的上下文引擎            | Codex 原生压缩，带 OpenClaw 通知和镜像维护                                  |
| 渠道投递                    | OpenClaw                               | OpenClaw                                                                    |

这种所有权拆分是主要设计规则：

- 如果 OpenClaw 拥有该表面，OpenClaw 可以提供正常的插件钩子行为。
- 如果原生运行时拥有该表面，OpenClaw 需要运行时事件或原生钩子。
- 如果原生运行时拥有规范线程状态，OpenClaw 应该镜像并投射上下文，而不是重写不受支持的内部状态。

## 运行时选择

OpenClaw 在提供商和模型解析后选择嵌入式运行时：

1. 会话记录的运行时优先。配置变更不会把现有 transcript 热切换到不同的原生线程系统。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为新的或重置的会话强制使用该运行时。
3. `agents.defaults.agentRuntime.id` 或 `agents.list[].agentRuntime.id` 可以设置
   `auto`、`pi`、已注册的嵌入式 harness ID（例如 `codex`），或受支持的 CLI 后端别名
   （例如 `claude-cli`）。
4. 在 `auto` 模式下，已注册的插件运行时可以声明支持的提供商/模型组合。
5. 如果在 `auto` 模式下没有运行时声明某个轮次，OpenClaw 会使用 PI 作为兼容性运行时。
   当运行必须严格时，请使用显式运行时 ID。

显式插件运行时会失败关闭。例如，`agentRuntime.id: "codex"` 表示 Codex，
或清晰的选择/运行时错误；它绝不会被静默路由回 PI。

CLI 后端别名不同于嵌入式 harness ID。推荐的 Claude CLI 形式是：

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

旧版引用（例如 `claude-cli/claude-opus-4-7`）仍因兼容性而受支持，
但新配置应保持提供商/模型规范化，并将执行后端放入 `agentRuntime.id`。

对于大多数提供商，`auto` 模式有意保持保守。OpenAI 智能体模型是例外：
未设置运行时和 `auto` 都会解析到 Codex harness。显式 PI 运行时配置仍是
`openai/*` 智能体轮次的可选兼容路径；当搭配选中的 `openai-codex` 认证配置文件时，
OpenClaw 会在内部通过旧版 Codex-auth 传输路由 PI，同时保持公共模型引用为 `openai/*`。
没有显式配置的过期 OpenAI PI 会话固定项会被修复回 Codex。

如果 `openclaw doctor` 警告 `codex` 插件已启用，而配置中仍保留
`openai-codex/*`，请将其视为旧版路由状态。运行 `openclaw doctor --fix`
将其重写为带 Codex 运行时的 `openai/*`。

## 兼容性契约

当运行时不是 PI 时，它应记录自己支持哪些 OpenClaw 表面。
运行时文档请使用这种形状：

| 问题                                  | 为什么重要                                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 谁拥有模型循环？                      | 决定重试、工具续接和最终答案决策发生在哪里。                                                       |
| 谁拥有规范线程历史？                  | 决定 OpenClaw 能否编辑历史，还是只能镜像它。                                                        |
| OpenClaw 动态工具是否可用？           | 消息、会话、cron 和 OpenClaw 拥有的工具依赖于此。                                                   |
| 动态工具钩子是否可用？                | 插件期望 `before_tool_call`、`after_tool_call` 以及围绕 OpenClaw 拥有工具的中间件。                 |
| 原生工具钩子是否可用？                | shell、patch 和运行时拥有的工具需要原生钩子支持，以便执行策略和观察。                              |
| 上下文引擎生命周期是否运行？          | 记忆和上下文插件依赖 assemble、ingest、after-turn 和 compaction 生命周期。                          |
| 会公开哪些压缩数据？                  | 一些插件只需要通知，而另一些需要保留/丢弃的元数据。                                                |
| 哪些内容有意不支持？                  | 用户不应在原生运行时拥有更多状态的地方假定其等同于 PI。                                            |

Codex 运行时支持契约记录于
[Codex harness](/zh-CN/plugins/codex-harness#v1-support-contract)。

## Status 标签

Status 输出可能同时显示 `Execution` 和 `Runtime` 标签。请把它们视为
诊断信息，而不是提供商名称。

- 像 `openai/gpt-5.5` 这样的模型引用会告诉你所选的提供商/模型。
- 像 `codex` 这样的运行时 ID 会告诉你哪个循环正在执行该轮次。
- 像 Telegram 或 Discord 这样的渠道标签会告诉你对话发生在哪里。

如果在更改运行时配置后，会话仍显示 PI，请用 `/new` 启动新会话，
或用 `/reset` 清除当前会话。现有会话会保留其记录的运行时，因此转录不会通过两个不兼容的原生
会话系统重放。

## 相关

- [Codex harness](/zh-CN/plugins/codex-harness)
- [OpenAI](/zh-CN/providers/openai)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Models](/zh-CN/concepts/models)
- [Status](/zh-CN/cli/status)
