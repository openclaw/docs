---
read_when:
    - 你正在 PI、Codex、ACP 或其他原生智能体运行时之间做选择
    - 你对 Status 或配置中的提供商/模型/运行时标签感到困惑
    - 你正在记录原生运行框架的支持对等性
summary: OpenClaw 如何分离模型提供商、模型、渠道和 Agent Runtimes
title: Agent Runtimes
x-i18n:
    generated_at: "2026-05-02T02:37:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**智能体运行时**是拥有一个已准备好模型循环的组件：它接收提示词、驱动模型输出、处理原生工具调用，并将完成的轮次返回给 OpenClaw。

运行时很容易和提供商混淆，因为二者都会出现在模型配置附近。它们是不同的层：

| 层级          | 示例                                  | 含义                                                                |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| 提供商        | `openai`, `anthropic`, `openai-codex` | OpenClaw 如何进行身份验证、发现模型，以及命名模型引用。             |
| 模型          | `gpt-5.5`, `claude-opus-4-6`          | 为智能体轮次选择的模型。                                            |
| 智能体运行时  | `pi`, `codex`, `claude-cli`           | 执行已准备好轮次的底层循环或后端。                                  |
| 渠道          | Telegram, Discord, Slack, WhatsApp    | 消息进入和离开 OpenClaw 的位置。                                    |

你还会在代码中看到 **harness** 这个词。harness 是提供智能体运行时的实现。例如，内置的 Codex harness 实现了 `codex` 运行时。公共配置使用 `agentRuntime.id`；`openclaw
doctor --fix` 会把较旧的运行时策略键重写为这种形状。

运行时分为两个系列：

- **嵌入式 harness** 在 OpenClaw 已准备好的 Agent loop 内运行。目前这包括内置的 `pi` 运行时，以及已注册的插件 harness，例如 `codex`。
- **CLI 后端** 会运行本地 CLI 进程，同时保持模型引用规范化。例如，`anthropic/claude-opus-4-7` 配合 `agentRuntime.id: "claude-cli"` 表示“选择 Anthropic 模型，通过 Claude CLI 执行”。`claude-cli` 不是嵌入式 harness id，不能传给 AgentHarness 选择逻辑。

## Codex 表面

大多数混淆来自几个不同表面都共享 Codex 名称：

| 表面                                                 | OpenClaw 名称/配置                          | 作用                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 原生 Codex 应用服务器运行时                          | `openai/*` plus `agentRuntime.id: "codex"` | 通过 Codex 应用服务器运行嵌入式智能体轮次。这是常见的 ChatGPT/Codex 订阅设置。                            |
| Codex OAuth 提供商路由                               | `openai-codex/*` model refs                | 通过普通 OpenClaw PI runner 使用 ChatGPT/Codex 订阅 OAuth。                                                |
| Codex ACP 适配器                                     | `runtime: "acp"`, `agentId: "codex"`       | 通过外部 ACP/acpx 控制平面运行 Codex。仅在明确要求 ACP/acpx 时使用。                                       |
| 原生 Codex 聊天控制命令集                            | `/codex ...`                               | 从聊天中绑定、恢复、Steering、停止和检查 Codex 应用服务器线程。                                            |
| 面向 GPT/Codex 风格模型的 OpenAI Platform API 路由   | `openai/*` model refs                      | 使用 OpenAI API key 认证，除非有运行时覆盖，例如 `agentRuntime.id: "codex"` 来运行该轮次。                 |

这些表面有意相互独立。启用 `codex` 插件会让原生应用服务器功能可用；它不会把 `openai-codex/*` 重写为 `openai/*`，不会更改现有会话，也不会让 ACP 成为 Codex 默认项。选择 `openai-codex/*` 表示“使用 Codex OAuth 提供商路由”，除非你另行强制指定运行时。

常见的 ChatGPT/Codex 订阅设置使用 Codex OAuth 进行身份验证，但模型引用保持为 `openai/*`，并选择 `codex` 运行时：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

这表示 OpenClaw 选择一个 OpenAI 模型引用，然后要求 Codex 应用服务器运行时运行嵌入式智能体轮次。它不表示“使用 API 计费”，也不表示渠道、模型提供商目录或 OpenClaw 会话存储会变成 Codex。

启用内置的 `codex` 插件后，自然语言 Codex 控制应使用原生 `/codex` 命令表面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`），而不是 ACP。只有当用户明确要求 ACP/acpx 或正在测试 ACP 适配器路径时，才对 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 和类似的外部 harness 仍然使用 ACP。

这是面向智能体的决策树：

1. 如果用户要求 **Codex 绑定/控制/线程/恢复/Steering/停止**，并且内置 `codex` 插件已启用，则使用原生 `/codex` 命令表面。
2. 如果用户要求 **Codex 作为嵌入式运行时**，或想要普通的订阅支持 Codex 智能体体验，请使用 `openai/<model>` 加 `agentRuntime.id: "codex"`。
3. 如果用户要求在普通 OpenClaw runner 上使用 **Codex OAuth/订阅认证**，请使用 `openai-codex/<model>`，并让运行时保持为 PI。
4. 如果用户明确说 **ACP**、**acpx** 或 **Codex ACP 适配器**，请使用 ACP，并设置 `runtime: "acp"` 和 `agentId: "codex"`。
5. 如果请求针对 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 harness**，请使用 ACP/acpx，而不是原生子智能体运行时。

| 你的意思是……                          | 使用……                                       |
| --------------------------------------- | -------------------------------------------- |
| Codex 应用服务器聊天/线程控制           | 来自内置 `codex` 插件的 `/codex ...`         |
| Codex 应用服务器嵌入式智能体运行时      | `agentRuntime.id: "codex"`                   |
| PI runner 上的 OpenAI Codex OAuth       | `openai-codex/*` model refs                  |
| Claude Code 或其他外部 harness          | ACP/acpx                                     |

关于 OpenAI 系列前缀拆分，请参阅 [OpenAI](/zh-CN/providers/openai) 和
[模型提供商](/zh-CN/concepts/model-providers)。关于 Codex 运行时支持契约，请参阅 [Codex harness](/zh-CN/plugins/codex-harness#v1-support-contract)。

## 运行时所有权

不同运行时拥有循环中不同范围的内容。

| 表面                        | OpenClaw PI 嵌入式                         | Codex 应用服务器                                                            |
| --------------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| 模型循环所有者              | OpenClaw 通过 PI 嵌入式 runner             | Codex 应用服务器                                                            |
| 规范线程状态                | OpenClaw 记录                              | Codex 线程，以及 OpenClaw 记录镜像                                          |
| OpenClaw 动态工具           | 原生 OpenClaw 工具循环                     | 通过 Codex 适配器桥接                                                       |
| 原生 shell 和文件工具       | PI/OpenClaw 路径                           | Codex 原生工具，并在支持时通过原生钩子桥接                                  |
| 上下文引擎                  | 原生 OpenClaw 上下文组装                   | OpenClaw 将项目组装的上下文投射到 Codex 轮次中                              |
| 压缩                        | OpenClaw 或所选上下文引擎                  | Codex 原生压缩，配合 OpenClaw 通知和镜像维护                                |
| 渠道投递                    | OpenClaw                                   | OpenClaw                                                                    |

这种所有权拆分是主要设计规则：

- 如果 OpenClaw 拥有该表面，OpenClaw 可以提供普通插件钩子行为。
- 如果原生运行时拥有该表面，OpenClaw 需要运行时事件或原生钩子。
- 如果原生运行时拥有规范线程状态，OpenClaw 应镜像并投射上下文，而不是重写不受支持的内部机制。

## 运行时选择

OpenClaw 会在提供商和模型解析后选择嵌入式运行时：

1. 会话记录的运行时优先。配置更改不会把现有记录热切换到另一个原生线程系统。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 会为新的或重置的会话强制使用该运行时。
3. `agents.defaults.agentRuntime.id` 或 `agents.list[].agentRuntime.id` 可以设置为 `auto`、`pi`、已注册的嵌入式 harness id（如 `codex`），或受支持的 CLI 后端别名（如 `claude-cli`）。
4. 在 `auto` 模式下，已注册的插件运行时可以声明其支持的提供商/模型配对。
5. 如果在 `auto` 模式下没有运行时声明某个轮次，并且设置了 `fallback: "pi"`（默认值），OpenClaw 会使用 PI 作为兼容性回退。设置 `fallback: "none"` 可让未匹配的 `auto` 模式选择失败。

显式插件运行时默认以关闭方式失败。例如，`agentRuntime.id: "codex"` 表示使用 Codex，否则给出清晰的选择错误，除非你在同一覆盖作用域中设置 `fallback: "pi"`。运行时覆盖不会继承更宽泛的回退设置，因此仅仅因为 defaults 使用了 `fallback: "pi"`，智能体级别的 `agentRuntime.id: "codex"` 并不会被静默路由回 PI。

CLI 后端别名不同于嵌入式 harness id。首选的 Claude CLI 形式是：

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

为了兼容性，仍然支持 `claude-cli/claude-opus-4-7` 等旧版引用，但新配置应保持提供商/模型规范化，并把执行后端放在 `agentRuntime.id` 中。

`auto` 模式有意保持保守。插件运行时可以声明它们理解的提供商/模型配对，但 Codex 插件不会在 `auto` 模式下声明 `openai-codex` 提供商。这会让 `openai-codex/*` 保持为显式的 PI Codex OAuth 路由，并避免把订阅认证配置静默移动到原生应用服务器 harness。

如果 `openclaw doctor` 警告说 `codex` 插件已启用，而 `openai-codex/*` 仍通过 PI 路由，请把它视为诊断，而不是迁移。当 PI Codex OAuth 是你想要的行为时，保持配置不变。只有当你想要原生 Codex 应用服务器执行时，才切换到 `openai/<model>` 加 `agentRuntime.id: "codex"`。

## 兼容性契约

当运行时不是 PI 时，它应记录自己支持哪些 OpenClaw 表面。运行时文档请使用这种形状：

| 问题                                   | 重要原因                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 谁拥有模型循环？                       | 决定重试、工具继续执行和最终答案决策发生在哪里。                                                  |
| 谁拥有规范线程历史？                   | 决定 OpenClaw 是否可以编辑历史，还是只能镜像历史。                                                 |
| OpenClaw 动态工具是否可用？            | 消息、会话、cron 和 OpenClaw 拥有的工具都依赖这一点。                                              |
| 动态工具钩子是否可用？                 | 插件期望围绕 OpenClaw 拥有的工具使用 `before_tool_call`、`after_tool_call` 和中间件。              |
| 原生工具钩子是否可用？                 | Shell、patch 和运行时拥有的工具需要原生钩子支持，以便执行策略和观测。                             |
| 上下文引擎生命周期是否运行？           | 记忆和上下文插件依赖组装、摄取、轮次后处理和压缩生命周期。                                        |
| 暴露了哪些压缩数据？                   | 一些插件只需要通知，而另一些插件需要保留/丢弃的元数据。                                           |
| 哪些内容是有意不支持的？               | 用户不应在原生运行时拥有更多状态的地方假设 PI 等价性。                                            |

Codex 运行时支持契约记录在
[Codex harness](/zh-CN/plugins/codex-harness#v1-support-contract)。

## Status 标签

Status 输出可能同时显示 `Execution` 和 `Runtime` 标签。请将它们视为
诊断信息，而不是提供商名称。

- 像 `openai/gpt-5.5` 这样的模型引用会告诉你选中的提供商/模型。
- 像 `codex` 这样的运行时 ID 会告诉你哪个循环正在执行该轮次。
- 像 Telegram 或 Discord 这样的渠道标签会告诉你对话发生在哪里。

如果更改运行时配置后，会话仍显示 PI，请用 `/new` 启动新会话，
或用 `/reset` 清除当前会话。现有会话会保留其记录的运行时，
这样同一份转录就不会通过两个不兼容的原生会话系统重放。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [OpenAI](/zh-CN/providers/openai)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent loop](/zh-CN/concepts/agent-loop)
- [Models](/zh-CN/concepts/models)
- [Status](/zh-CN/cli/status)
