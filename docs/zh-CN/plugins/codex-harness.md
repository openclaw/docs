---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅 Codex 的部署失败，而不是回退到 PI
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体回合
title: Codex harness
x-i18n:
    generated_at: "2026-05-03T17:03:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

内置的 `codex` 插件让 OpenClaw 通过 Codex 应用服务器而不是内置的 PI harness 运行嵌入式智能体轮次。

当你希望 Codex 接管底层智能体会话时使用它：模型发现、原生线程恢复、原生压缩，以及应用服务器执行。OpenClaw 仍负责聊天渠道、会话文件、模型选择、工具、审批、媒体投递，以及可见转录镜像。

当源聊天轮次通过 Codex harness 运行时，如果部署未显式配置 `messages.visibleReplies`，可见回复默认使用 OpenClaw `message` 工具。智能体仍可私下完成它的 Codex 轮次；只有在调用 `message(action="send")` 时才会发布到渠道。设置 `messages.visibleReplies: "automatic"` 可让直接聊天的最终回复继续走旧版自动投递路径。

Codex heartbeat 轮次默认也会获得 `heartbeat_respond` 工具，因此智能体可以记录本次唤醒应保持安静还是发出通知，而无需在最终文本中编码该控制流。

Heartbeat 专用的主动性指导会作为 Codex 协作模式 developer 指令发送到 heartbeat 轮次本身。普通聊天轮次会恢复 Codex Default 模式，而不会在其常规运行时提示中携带 heartbeat 理念。

如果你正在尝试建立整体认识，请从 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。简短版本是：`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍是通信界面。

## 快速配置

大多数想要“OpenClaw 中的 Codex”的用户需要这条路径：使用 ChatGPT/Codex 订阅登录，然后通过原生 Codex 应用服务器运行时运行嵌入式智能体轮次。模型引用仍保持规范形式 `openai/gpt-*`；订阅凭证来自 Codex 账号/配置文件，而不是来自 `openai-codex/*` 模型前缀。

如果尚未登录，请先使用 Codex OAuth 登录：

```bash
openclaw models auth login --provider openai-codex
```

然后启用内置的 `codex` 插件并强制使用 Codex 运行时：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
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

如果你的配置使用 `plugins.allow`，也请在那里包含 `codex`：

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

当你的意思是原生 Codex 运行时时，不要使用 `openai-codex/gpt-*`。该前缀是显式的“通过 PI 使用 Codex OAuth”路径。配置变更适用于新会话或重置后的会话；现有会话会保留其已记录的运行时。

## 此插件会改变什么

内置的 `codex` 插件提供若干独立能力：

| 能力                              | 使用方式                                            | 作用                                                                 |
| --------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| 原生嵌入式运行时                  | `agentRuntime.id: "codex"`                          | 通过 Codex 应用服务器运行 OpenClaw 嵌入式智能体轮次。                |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 从消息对话中绑定和控制 Codex 应用服务器线程。                        |
| Codex 应用服务器提供商/目录       | `codex` 内部机制，通过 harness 暴露                 | 让运行时发现和验证应用服务器模型。                                   |
| Codex 媒体理解路径                | `codex/*` 图像模型兼容路径                          | 为支持的图像理解模型运行有边界的 Codex 应用服务器轮次。              |
| 原生钩子中继                      | 围绕 Codex 原生事件的插件钩子                       | 让 OpenClaw 观察/阻止受支持的 Codex 原生工具/最终化事件。            |

启用该插件会让这些能力可用。它**不会**：

- 开始对每个 OpenAI 模型都使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 让 ACP/acpx 成为默认 Codex 路径
- 热切换已经记录 PI 运行时的现有会话
- 替换 OpenClaw 渠道投递、会话文件、凭证配置文件存储或消息路由

同一个插件也拥有原生 `/codex` 聊天控制命令界面。如果插件已启用，并且用户要求从聊天中绑定、恢复、引导、停止或检查 Codex 线程，智能体应优先使用 `/codex ...` 而不是 ACP。当用户明确要求 ACP/acpx，或正在测试 ACP Codex 适配器时，ACP 仍是显式后备方案。

原生 Codex 轮次会保留 OpenClaw 插件钩子作为公共兼容层。这些是在进程内运行的 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`，用于镜像转录记录
- 通过 Codex `Stop` 中继的 `before_agent_finalize`
- `agent_end`

插件还可以注册运行时中立的工具结果中间件，用于在 OpenClaw 执行工具之后、结果返回给 Codex 之前改写 OpenClaw 动态工具结果。这与公共 `tool_result_persist` 插件钩子相互独立，后者转换由 OpenClaw 拥有的转录工具结果写入。

关于插件钩子语义本身，请参阅 [插件钩子](/zh-CN/plugins/hooks) 和 [插件守卫行为](/zh-CN/tools/plugin)。

harness 默认关闭。新配置应将 OpenAI 模型引用保持为规范形式 `openai/gpt-*`，并在需要原生应用服务器执行时显式强制设置 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用仍会为了兼容性自动选择该 harness，但由运行时支持的旧版提供商前缀不会显示为普通模型/提供商选项。

如果 `codex` 插件已启用，但主模型仍是 `openai-codex/*`，`openclaw doctor` 会发出警告，而不是更改路径。这是有意设计：`openai-codex/*` 仍是 PI Codex OAuth/订阅路径，而原生应用服务器执行仍是显式的运行时选择。

## 路由映射

更改配置前请使用此表：

| 期望行为                                           | 模型引用                   | 运行时配置                             | 凭证/配置文件路径          | 预期状态标签                   |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | -------------------------- | ------------------------------ |
| 使用原生 Codex 运行时的 ChatGPT/Codex 订阅         | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth 或 Codex 账号  | `Runtime: OpenAI Codex`        |
| 通过常规 OpenClaw runner 使用 OpenAI API           | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI API key             | `Runtime: OpenClaw Pi Default` |
| 通过 PI 使用 ChatGPT/Codex 订阅                    | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth 提供商  | `Runtime: OpenClaw Pi Default` |
| 使用保守自动模式的混合提供商                       | 提供商专用引用             | `agentRuntime.id: "auto"`              | 按所选提供商               | 取决于所选运行时               |
| 显式 Codex ACP 适配器会话                          | 取决于 ACP 提示/模型       | 带有 `runtime: "acp"` 的 `sessions_spawn` | ACP 后端凭证            | ACP 任务/会话状态              |

重要区别是提供商与运行时：

- `openai-codex/*` 回答“PI 应使用哪个提供商/凭证路径？”
- `agentRuntime.id: "codex"` 回答“哪个 loop 应执行此嵌入式轮次？”
- `/codex ...` 回答“此聊天应绑定或控制哪个原生 Codex 对话？”
- ACP 回答“acpx 应启动哪个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 系列路径按前缀区分。对于常见的订阅加原生 Codex 运行时设置，请使用带 `agentRuntime.id: "codex"` 的 `openai/*`。仅当你有意希望通过 PI 使用 Codex OAuth 时，才使用 `openai-codex/*`：

| 模型引用                                      | 运行时路径                                   | 适用场景                                                                 |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`                              | 通过 OpenClaw/PI 管线使用 OpenAI provider    | 你想使用带 `OPENAI_API_KEY` 的当前直接 OpenAI Platform API 访问。         |
| `openai-codex/gpt-5.5`                        | 通过 OpenClaw/PI 使用 OpenAI Codex OAuth     | 你想使用 ChatGPT/Codex 订阅凭证和默认 PI runner。                        |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex 应用服务器 harness                     | 你想使用 ChatGPT/Codex 订阅凭证和原生 Codex 执行。                       |

当你的账号暴露这些路径时，GPT-5.5 可以同时出现在直接 OpenAI API key 和 Codex 订阅路径上。对于原生 Codex 运行时，请将 `openai/gpt-5.5` 与 Codex 应用服务器 harness 配合使用；对于 PI OAuth，请使用 `openai-codex/gpt-5.5`；对于直接 API key 流量，请使用没有 Codex 运行时覆盖的 `openai/gpt-5.5`。

旧版 `codex/gpt-*` 引用仍作为兼容别名被接受。Doctor 兼容性迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略；仅作为后备的旧版引用会保持不变，因为运行时是为整个智能体容器配置的。新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生应用服务器 harness 配置应使用 `openai/gpt-*` 加 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循同样的前缀区分。当图像理解应通过 OpenAI Codex OAuth 提供商路径运行时，请使用 `openai-codex/gpt-*`。当图像理解应通过有边界的 Codex 应用服务器轮次运行时，请使用 `codex/gpt-*`。Codex 应用服务器模型必须声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 确认当前会话的有效 harness。如果选择结果令人意外，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/后备策略，并且在 `auto` 模式下包含每个插件候选项的支持结果。

### Doctor 警告的含义

当以下条件全部为真时，`openclaw doctor` 会发出警告：

- 内置的 `codex` 插件已启用或已允许
- 某个智能体的主模型是 `openai-codex/*`
- 该智能体的有效运行时不是 `codex`

此警告存在，是因为用户经常期望“已启用 Codex 插件”意味着“原生 Codex 应用服务器运行时”。OpenClaw 不会做这个跳跃式推断。该警告表示：

- 如果你有意通过 PI 使用 ChatGPT/Codex OAuth，**无需更改**。
- 如果你有意使用原生应用服务器执行，请将模型改为 `openai/<model>` 并设置 `agentRuntime.id: "codex"`。
- 运行时更改后，现有会话仍需要 `/new` 或 `/reset`，因为会话运行时固定是粘性的。

harness 选择不是实时会话控制。当嵌入式轮次运行时，OpenClaw 会在该会话上记录所选 harness id，并在同一会话 id 的后续轮次中继续使用它。当你希望未来会话使用另一个 harness 时，请更改 `agentRuntime` 配置或 `OPENCLAW_AGENT_RUNTIME`；在现有对话于 PI 与 Codex 之间切换前，请使用 `/new` 或 `/reset` 启动一个全新会话。这样可避免用两个不兼容的原生会话系统重放同一份转录。

具有 transcript 历史的旧版会话在 harness 固定配置出现前创建，会被视为已固定到 PI。更改配置后，请使用 `/new` 或 `/reset` 将该对话切换到 Codex。

`/status` 会显示生效的模型运行时。默认 PI harness 显示为
`Runtime: OpenClaw Pi Default`，Codex app-server harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，并且内置 `codex` 插件可用。
- Codex app-server `0.125.0` 或更新版本。默认情况下，内置插件会管理兼容的 Codex app-server 二进制文件，因此 `PATH` 上的本地 `codex` 命令不会影响正常的 harness 启动。
- app-server 进程或 OpenClaw 的 Codex 凭证桥接可使用 Codex 凭证。本地 app-server 启动会为每个智能体使用一个由 OpenClaw 管理的 Codex home，并使用隔离的子进程 `HOME`，因此默认不会读取你的个人 `~/.codex` 账号、Skills、插件、配置、线程状态或原生 `$HOME/.agents/skills`。

该插件会阻止较旧或无版本的 app-server 握手。这会让 OpenClaw 保持在已经测试过的协议表面上。

对于实时和 Docker 冒烟测试，凭证通常来自 Codex CLI 账号或 OpenClaw `openai-codex` 凭证配置。本地 stdio app-server 启动在没有账号时也可以回退到 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 工作区引导文件

Codex 会通过原生项目文档发现自行处理 `AGENTS.md`。OpenClaw 不会写入合成的 Codex 项目文档文件，也不依赖 Codex 针对 persona 文件的回退文件名，因为 Codex 回退仅在缺少 `AGENTS.md` 时适用。

为了保持 OpenClaw 工作区一致性，Codex harness 会解析其他引导文件（存在时包括 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`），并在 `thread/start` 与 `thread/resume` 上通过 Codex 配置指令转发它们。这样可以让 `SOUL.md` 及相关工作区 persona/profile 上下文保持可见，而无需复制 `AGENTS.md`。

## 将 Codex 与其他模型一起添加

如果同一个智能体应在 Codex 和非 Codex 提供商模型之间自由切换，不要全局设置 `agentRuntime.id: "codex"`。强制运行时会应用于该智能体或会话的每个嵌入式轮次。如果你在强制该运行时时选择 Anthropic 模型，OpenClaw 仍会尝试 Codex harness，并以关闭失败结束，而不是静默地通过 PI 路由该轮次。

请改用以下结构之一：

- 将 Codex 放在带有 `agentRuntime.id: "codex"` 的专用智能体上。
- 将默认智能体保持在 `agentRuntime.id: "auto"`，并为普通混合提供商使用保留 PI 回退。
- 仅为兼容性使用旧版 `codex/*` 引用。新配置应优先使用 `openai/*` 加上显式 Codex 运行时策略。

例如，以下配置会让默认智能体保持正常自动选择，并添加一个单独的 Codex 智能体：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

采用这种结构时：

- 默认 `main` 智能体使用普通提供商路径和 PI 兼容性回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或不受支持，该轮次会失败，而不是悄悄使用 PI。

## 智能体命令路由

智能体应按意图路由用户请求，而不应只根据 “Codex” 这个词：

| 用户请求... | 智能体应使用... |
| ------------------------------------------------------ | ------------------------------------------------ |
| “将此聊天绑定到 Codex” | `/codex bind` |
| “在这里恢复 Codex 线程 `<id>`” | `/codex resume <id>` |
| “显示 Codex 线程” | `/codex threads` |
| “为一次糟糕的 Codex 运行提交支持报告” | `/diagnostics [note]` |
| “仅为这个附加线程发送 Codex 反馈” | `/codex diagnostics [note]` |
| “通过 Codex 运行时使用我的 ChatGPT/Codex 订阅” | `openai/*` 加上 `agentRuntime.id: "codex"` |
| “通过 PI 使用我的 ChatGPT/Codex 订阅” | `openai-codex/*` 模型引用 |
| “通过 ACP/acpx 运行 Codex” | ACP `sessions_spawn({ runtime: "acp", ... })` |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor” | ACP/acpx，而不是 `/codex`，也不是原生子智能体 |

只有当 ACP 已启用、可分发，并由已加载的运行时后端支持时，OpenClaw 才会向智能体发布 ACP spawn 指引。如果 ACP 不可用，系统提示和插件 Skills 不应教智能体 ACP 路由。

## 仅 Codex 部署

当你需要证明每个嵌入式智能体轮次都使用 Codex 时，强制使用 Codex harness。显式插件运行时会以关闭失败结束，绝不会静默地通过 PI 重试：

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

环境变量覆盖：

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

强制使用 Codex 时，如果 Codex 插件被禁用、app-server 过旧，或 app-server 无法启动，OpenClaw 会提前失败。

## 单智能体 Codex

你可以让一个智能体仅使用 Codex，同时让默认智能体保留正常自动选择：

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

使用普通会话命令切换智能体和模型。`/new` 会创建新的 OpenClaw 会话，Codex harness 会按需创建或恢复其 sidecar app-server 线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮次重新从当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 查询可用模型。如果发现失败或超时，它会使用内置回退目录，包含：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

你可以在 `plugins.entries.codex.config.discovery` 下调整发现：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

当你希望启动时避免探测 Codex 并固定使用回退目录时，请禁用发现：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## App-server 连接和策略

默认情况下，该插件会用以下命令在本地启动 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

托管二进制文件随 `codex` 插件包一起发布。这样会将 app-server 版本绑定到内置插件，而不是绑定到本地碰巧安装的某个单独 Codex CLI。只有在你有意运行不同可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。这是用于自主 Heartbeat 的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会因为无人回答的原生批准提示而停下。

要选择由 Codex guardian 审核的批准，请设置 `appServer.mode:
"guardian"`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian 模式使用 Codex 的原生自动审核批准路径。当 Codex 请求离开沙箱、写入工作区之外，或添加网络访问等权限时，Codex 会将该批准请求路由到原生审核者，而不是人工提示。审核者会应用 Codex 的风险框架，并批准或拒绝该具体请求。当你需要比 YOLO 模式更多的防护，但仍需要无人值守智能体持续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
单独的策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选择混合使用。较旧的 `guardian_subagent` 审核者值仍作为兼容别名被接受，但新配置应使用 `auto_review`。

对于已经运行的 app-server，请使用 WebSocket 传输：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

stdio app-server 启动默认继承 OpenClaw 的进程环境，但 OpenClaw 拥有 Codex app-server 账号桥接，并将 `CODEX_HOME` 和 `HOME` 都设置为该智能体 OpenClaw 状态下的逐智能体目录。Codex 自身的 skill loader 会读取 `$CODEX_HOME/skills` 和 `$HOME/.agents/skills`，因此本地 app-server 启动会隔离这两个值。这样可以让 Codex 原生 Skills、插件、配置、账号和线程状态限定在 OpenClaw 智能体范围内，而不会从操作员的个人 Codex CLI home 泄漏进来。

OpenClaw 插件和 OpenClaw skill 快照仍会通过 OpenClaw 自己的插件注册表和 skill loader 流转。个人 Codex CLI 资产不会流转。如果你有应成为 OpenClaw 智能体一部分的有用 Codex CLI Skills 或插件，请显式盘点它们：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 迁移提供商会将 Skills 复制到当前 OpenClaw 智能体工作区。Codex 原生插件、钩子和配置文件会被报告或归档以供人工审查，而不是自动激活，因为它们可能执行命令、暴露 MCP 服务器，或携带凭证。

凭证按以下顺序选择：

1. 该智能体的显式 OpenClaw Codex 凭证配置。
2. 该智能体 Codex home 中的 app-server 现有账号。
3. 仅对本地 stdio app-server 启动，当不存在 app-server 账号且仍需要 OpenAI 凭证时，先使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅风格的 Codex 凭证配置时，它会从生成的 Codex 子进程中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这样可以让 Gateway 网关级 API key 继续用于 embeddings 或直接 OpenAI 模型，而不会意外让原生 Codex app-server 轮次通过 API 计费。显式 Codex API-key 配置和本地 stdio 环境变量 key 回退会使用 app-server 登录，而不是继承的子进程环境。WebSocket app-server 连接不会收到 Gateway 网关环境 API-key 回退；请使用显式凭证配置或远程 app-server 自己的账号。

如果部署需要额外的环境隔离，请将这些变量添加到 `appServer.clearEnv`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` 只影响生成的 Codex app-server 子进程。

Codex 动态工具默认使用 `native-first` 配置文件。在该模式下，OpenClaw 不会暴露与 Codex 原生工作区操作重复的动态工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。OpenClaw 集成工具，例如 messaging、会话、media、cron、browser、nodes、gateway、`heartbeat_respond` 和 `web_search` 仍然可用。

支持的顶层 Codex 插件字段：

| 字段                       | 默认值           | 含义                                                                                         |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | 使用 `"openclaw-compat"` 向 Codex app-server 暴露完整的 OpenClaw 动态工具集。                |
| `codexDynamicToolsExclude` | `[]`             | 需要从 Codex app-server 轮次中省略的其他 OpenClaw 动态工具名称。                             |

支持的 `appServer` 字段：

| 字段                | 默认值                                   | 含义                                                                                                                                                                                                                                  |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 会生成 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                                                                |
| `command`           | 托管的 Codex 二进制文件                  | stdio 传输的可执行文件。保持未设置以使用托管二进制文件；仅在需要显式覆盖时设置。                                                                                                                                                     |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 传输的参数。                                                                                                                                                                                                                    |
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                                                                                                                                            |
| `authToken`         | 未设置                                   | WebSocket 传输的 Bearer 令牌。                                                                                                                                                                                                       |
| `headers`           | `{}`                                     | 额外的 WebSocket 头。                                                                                                                                                                                                                |
| `clearEnv`          | `[]`                                     | 在 OpenClaw 构建继承环境后，从生成的 stdio app-server 进程中移除的额外环境变量名称。`CODEX_HOME` 和 `HOME` 保留用于本地启动时 OpenClaw 的每智能体 Codex 隔离。                                                                       |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | YOLO 或经 guardian 审查执行的预设。                                                                                                                                                                                                  |
| `approvalPolicy`    | `"never"`                                | 发送到线程开始/恢复/轮次的原生 Codex approval policy。                                                                                                                                                                               |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程开始/恢复的原生 Codex 沙箱模式。                                                                                                                                                                                          |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审查原生 approval prompt。`guardian_subagent` 仍是旧版别名。                                                                                                                                           |
| `serviceTier`       | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                                                                                                                                               |

OpenClaw 拥有的动态工具调用独立于 `appServer.requestTimeoutMs` 进行限制：每个 Codex `item/tool/call` 请求都必须在 30 秒内收到 OpenClaw 响应。超时时，OpenClaw 会在支持的位置中止工具信号，并向 Codex 返回失败的动态工具响应，以便该轮次可以继续，而不是让会话停留在 `processing`。

OpenClaw 响应 Codex 轮次作用域的 app-server 请求后，harness 还期望 Codex 以 `turn/completed` 完成原生轮次。如果 app-server 在该响应后静默 60 秒，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw 会话 lane，使后续聊天消息不会排在过期的原生轮次之后。

本地测试仍可使用环境覆盖：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，建议使用配置，因为它会把插件行为与其余 Codex harness 设置保留在同一个经过审查的文件中。

## 计算机使用

计算机使用在单独的设置指南中说明：[Codex 计算机使用](/zh-CN/plugins/codex-computer-use)。

简短说明：OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作。它会准备 Codex app-server，验证 `computer-use` MCP 服务器可用，然后让 Codex 在 Codex 模式轮次期间处理原生 MCP 工具调用。

如需在 Codex marketplace 流程之外直接访问 TryCua 驱动，请使用 `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 注册 `cua-driver mcp`。请参阅 [Codex 计算机使用](/zh-CN/plugins/codex-computer-use)，了解 Codex 拥有的计算机使用与直接 MCP 注册之间的区别。

最小配置：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
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

可通过命令界面检查或安装该设置：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

计算机使用是 macOS 专用功能，在 Codex MCP 服务器能够控制应用之前，可能需要本地操作系统权限。如果 `computerUse.enabled` 为 true 且 MCP 服务器不可用，Codex 模式轮次会在线程开始前失败，而不是在没有原生计算机使用工具的情况下静默运行。请参阅 [Codex 计算机使用](/zh-CN/plugins/codex-computer-use)，了解 marketplace 选项、远程目录限制、状态原因和故障排除。

当 `computerUse.autoInstall` 为 true 时，如果 Codex 尚未发现本地 marketplace，OpenClaw 可以从 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 注册标准内置 Codex Desktop marketplace。更改运行时或计算机使用配置后，请使用 `/new` 或 `/reset`，让现有会话不会保留旧的 PI 或 Codex 线程绑定。

## 常见配方

使用默认 stdio 传输的本地 Codex：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

仅 Codex 的 harness 验证：

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
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

经 Guardian 审查的 Codex approvals：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

带显式 headers 的远程 app-server：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

模型切换仍由 OpenClaw 控制。当 OpenClaw 会话附加到现有 Codex 线程时，下一个轮次会再次向 app-server 发送当前选定的 OpenAI 模型、提供商、approval policy、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但要求 Codex 使用新选择的模型继续。

## Codex 命令

内置插件会将 `/codex` 注册为授权斜杠命令。它是通用命令，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接性、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生 review。
- `/codex diagnostics [note]` 在发送已附加线程的 Codex 诊断反馈前请求确认。
- `/codex computer-use status` 检查已配置的 Computer Use 插件和 MCP 服务器。
- `/codex computer-use install` 安装已配置的 Computer Use 插件并重新加载 MCP 服务器。
- `/codex account` 显示账户和速率限制 Status。
- `/codex mcp` 列出 Codex app-server MCP 服务器 Status。
- `/codex skills` 列出 Codex app-server Skills。

### 常见调试工作流

当由 Codex 支持的智能体在 Telegram、Discord、Slack
或其他渠道中做出意外行为时，从出现问题的对话开始：

1. 运行 `/diagnostics bad tool choice after image upload`，或写另一条简短备注
   描述你看到的情况。
2. 批准一次诊断请求。批准会创建本地 Gateway 网关
   诊断 zip，并且因为该会话正在使用 Codex harness，还会
   将相关 Codex 反馈包发送到 OpenAI 服务器。
3. 将完成后的诊断回复复制到 bug 报告或支持线程中。
   它包含本地包路径、隐私摘要、OpenClaw 会话 ID、
   Codex 线程 ID，以及每个 Codex 线程的一行 `Inspect locally`。
4. 如果你想自行调试这次运行，请在终端中运行打印出的 `Inspect locally`
   命令。它看起来像 `codex resume <thread-id>`，会打开
   原生 Codex 线程，便于你检查对话、在本地继续对话，
   或询问 Codex 为什么选择了某个特定工具或计划。

仅当你明确想为当前附加的线程上传 Codex
反馈，而不需要完整 OpenClaw
Gateway 网关诊断包时，才使用 `/codex diagnostics [note]`。对于大多数支持报告，`/diagnostics [note]` 是
更好的起点，因为它会在一条回复中把本地 Gateway 网关状态和 Codex
线程 ID 关联起来。完整的隐私模型和群聊行为见 [诊断导出](/zh-CN/gateway/diagnostics)。

核心 OpenClaw 也暴露仅限所有者使用的 `/diagnostics [note]`，作为通用
Gateway 网关诊断命令。它的批准提示会显示敏感数据
说明，链接到 [诊断导出](/zh-CN/gateway/diagnostics)，并且每次都通过显式 exec 批准请求
`openclaw gateway diagnostics export --json`。不要用 allow-all 规则批准诊断。批准后，
OpenClaw 会发送一份可粘贴报告，其中包含本地包路径和清单
摘要。当活动的 OpenClaw 会话正在使用 Codex harness 时，同一次
批准也会授权将相关 Codex 反馈包发送到
OpenAI 服务器。批准提示会说明将发送 Codex 反馈，但
在批准前不会列出 Codex 会话或线程 ID。

如果 `/diagnostics` 由所有者在群聊中调用，OpenClaw 会保持
共享渠道整洁：群组只会收到一条简短通知，而
诊断说明、批准提示以及 Codex 会话/线程 ID 会通过
私有批准路径发送给所有者。如果没有私有所有者路径，
OpenClaw 会拒绝群组请求，并要求所有者从私信中运行。

已批准的 Codex 上传会调用 Codex app-server `feedback/upload`，并请求
app-server 在可用时为每个列出的线程和派生的 Codex 子线程
包含日志。上传会通过 Codex 的正常反馈路径发送到 OpenAI
服务器；如果该 app-server 中禁用了 Codex 反馈，该命令会返回
app-server 错误。完成后的诊断回复会列出已发送线程的渠道、
OpenClaw 会话 ID、Codex 线程 ID，以及本地 `codex resume <thread-id>`
命令。如果你拒绝或忽略批准，
OpenClaw 不会打印这些 Codex ID。此次上传不会替代本地
Gateway 网关诊断导出。

`/codex resume` 会写入与 harness 正常轮次使用的同一个 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将
当前选定的 OpenClaw 模型传入 app-server，并保持启用扩展历史。

### 从 CLI 检查 Codex 线程

理解一次异常 Codex 运行的最快方式，通常是直接打开原生 Codex
线程：

```sh
codex resume <thread-id>
```

当你在渠道对话中发现 bug，并想检查有问题的
Codex 会话、在本地继续它，或询问 Codex 为什么做出
某个特定工具或推理选择时，使用此命令。最简单的路径通常是先运行
`/diagnostics [note]`：在你批准后，完成的报告会列出
每个 Codex 线程，并打印一个 `Inspect locally` 命令，例如
`codex resume <thread-id>`。你可以将该命令直接复制到终端中。

你也可以从当前聊天的 `/codex binding` 获取线程 ID，或从
`/codex threads [filter]` 获取最近 Codex app-server 线程的线程 ID，然后在 shell 中运行同一个
`codex resume` 命令。

该命令表面要求 Codex app-server `0.125.0` 或更新版本。如果未来或自定义
app-server 没有暴露相应 JSON-RPC 方法，单个
控制方法会报告为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 所有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 跨 PI 和 Codex harness 的产品/插件兼容性。                          |
| Codex app-server extension middleware | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的每轮适配器行为。                            |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。                |

OpenClaw 不使用项目级或全局 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，
OpenClaw 会为 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop` 注入每线程 Codex 配置。其他 Codex 钩子，如 `SessionStart` 和
`UserPromptSubmit` 仍然是 Codex 级控制；它们不会作为
OpenClaw 插件钩子暴露在 v1 契约中。

对于 OpenClaw 动态工具，OpenClaw 会在 Codex 请求
调用后执行工具，因此 OpenClaw 会在
harness 适配器中触发它拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范工具记录。
OpenClaw 可以镜像选定事件，但无法重写原生 Codex
线程，除非 Codex 通过 app-server 或原生钩子
回调暴露该操作。

压缩和 LLM 生命周期投影来自 Codex app-server
通知和 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是适配器级观察，而不是对
Codex 内部请求或压缩 payload 的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被
投影为 `codex_app_server.hook` agent 事件，用于轨迹和调试。
它们不会调用 OpenClaw 插件钩子。

## V1 支持契约

Codex 模式不是在底层换了模型调用的 PI。Codex 拥有更多
原生模型循环，而 OpenClaw 会围绕该边界适配其插件和会话表面。

Codex 运行时 v1 中支持：

| 表面                                          | 支持情况                                | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环                 | 支持                                    | Codex app-server 拥有 OpenAI 轮次、原生线程恢复和原生工具继续执行。                                                                                                                                    |
| OpenClaw 渠道路由和投递                       | 支持                                    | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道保留在模型运行时之外。                                                                                                                          |
| OpenClaw 动态工具                             | 支持                                    | Codex 请求 OpenClaw 执行这些工具，因此 OpenClaw 保持在执行路径中。                                                                                                                                     |
| Prompt 和上下文插件                           | 支持                                    | OpenClaw 在启动或恢复线程前构建 prompt 覆盖层，并将上下文投影到 Codex 轮次中。                                                                                                                         |
| 上下文引擎生命周期                            | 支持                                    | 组装、摄取或轮次后维护，以及上下文引擎压缩协调会为 Codex 轮次运行。                                                                                                                                     |
| 动态工具钩子                                  | 支持                                    | `before_tool_call`、`after_tool_call` 和工具结果中间件围绕 OpenClaw 拥有的动态工具运行。                                                                                                               |
| 生命周期钩子                                  | 作为适配器观察支持                      | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会携带真实的 Codex 模式 payload 触发。                                                                                |
| 最终答案修订门控                              | 通过原生钩子转发支持                    | Codex `Stop` 会被转发到 `before_agent_finalize`；`revise` 会请求 Codex 在最终化前再进行一次模型 pass。                                                                                                  |
| 原生 shell、patch 和 MCP 阻止或观察           | 通过原生钩子转发支持                    | Codex `PreToolUse` 和 `PostToolUse` 会为已提交的原生工具表面转发，包括 Codex app-server `0.125.0` 或更新版本上的 MCP payload。支持阻止；不支持参数重写。 |
| 原生权限策略                                  | 通过原生钩子转发支持                    | 在运行时暴露它的情况下，Codex `PermissionRequest` 可以通过 OpenClaw 策略路由。如果 OpenClaw 未返回决策，Codex 会继续走其正常 guardian 或用户批准路径。                                                  |
| App-server 轨迹捕获                           | 支持                                    | OpenClaw 会记录它发送给 app-server 的请求，以及它收到的 app-server 通知。                                                                                                                              |

Codex 运行时 v1 中不支持：

| 表面                                             | V1 边界                                                                                                                                     | 未来路径                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                       | Codex 原生前置工具钩子可以阻止操作，但 OpenClaw 不会重写 Codex 原生工具参数。                                               | 需要 Codex 钩子/架构支持替换工具输入。                            |
| 可编辑的 Codex 原生转录历史            | Codex 拥有规范的原生线程历史。OpenClaw 拥有一个镜像，并且可以投射未来上下文，但不应变更不受支持的内部结构。 | 如果需要原生线程修整，请添加明确的 Codex app-server API。                    |
| Codex 原生工具记录的 `tool_result_persist` | 该钩子转换 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。                                                           | 可以镜像转换后的记录，但规范重写需要 Codex 支持。              |
| 丰富的原生压缩元数据                     | OpenClaw 会观察压缩开始和完成，但不会收到稳定的保留/丢弃列表、token 增量或摘要负载。            | 需要更丰富的 Codex 压缩事件。                                                     |
| 压缩干预                             | 当前 OpenClaw 压缩钩子在 Codex 模式中属于通知级别。                                                                         | 如果插件需要否决或重写原生压缩，请添加 Codex 压缩前/后钩子。 |
| 逐字节捕获模型 API 请求             | OpenClaw 可以捕获 app-server 请求和通知，但 Codex 核心会在内部构建最终 OpenAI API 请求。                      | 需要 Codex 模型请求跟踪事件或调试 API。                                   |

## 工具、媒体和压缩

Codex harness 只会更改低层嵌入式 agent 执行器。

OpenClaw 仍会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批和消息工具输出会继续通过正常的 OpenClaw 交付路径。

原生钩子中继有意保持通用，但 v1 支持契约仅限于 OpenClaw 已测试的 Codex 原生工具和权限路径。在 Codex 运行时中，这包括 shell、patch 和 MCP `PreToolUse`、`PostToolUse`、`PermissionRequest` 负载。在运行时契约明确命名之前，不要假设未来每个 Codex 钩子事件都是 OpenClaw 插件表面。

对于 `PermissionRequest`，OpenClaw 只会在策略作出决定时返回明确允许或拒绝决策。无决策结果并不是允许。Codex 会将其视为没有钩子决策，并继续回退到自己的 guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件审批流路由。Codex `request_user_input` 提示会被发回原始聊天，下一条排队的后续消息会回答该原生服务器请求，而不是作为额外上下文进行 Steering。其他 MCP 征询请求仍会按失败关闭处理。

活跃运行队列 Steering 会映射到 Codex app-server `turn/steer`。使用默认的 `messages.queue.mode: "steer"` 时，OpenClaw 会在配置的静默窗口内批处理排队聊天消息，并按到达顺序将它们作为一个 `turn/steer` 请求发送。旧版 `queue` 模式会发送单独的 `turn/steer` 请求。Codex review 和手动压缩轮次可能会拒绝同轮 Steering；在这种情况下，如果所选模式允许回退，OpenClaw 会使用 followup 队列。参见 [Steering queue](/zh-CN/concepts/queue-steering)。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换。该镜像包含用户提示、最终 assistant 文本，以及 app-server 发出时的轻量级 Codex reasoning 或 plan 记录。如今，OpenClaw 只记录原生压缩开始和完成信号。它还没有公开人类可读的压缩摘要，也没有公开可审计的列表来说明 Codex 在压缩后保留了哪些条目。

因为 Codex 拥有规范的原生线程，`tool_result_persist` 目前不会重写 Codex 原生工具结果记录。它只在 OpenClaw 写入 OpenClaw 拥有的会话转录工具结果时适用。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解会继续使用匹配的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 未显示为普通 `/model` 提供商：** 对于新配置，这是预期行为。选择一个带有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 当没有 Codex harness 接管运行时，`agentRuntime.id: "auto"` 仍可将 PI 用作兼容性后端。设置 `agentRuntime.id: "codex"` 可在测试时强制选择 Codex。强制 Codex 运行时会失败，而不是回退到 PI。一旦选择了 Codex app-server，其失败会直接显示。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手报告版本 `0.125.0` 或更新版本。同版本预发布版本或带构建后缀的版本（例如 `0.125.0-alpha.2` 或 `0.125.0+custom`）会被拒绝，因为稳定版 `0.125.0` 协议下限才是 OpenClaw 测试的目标。

**模型发现较慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程 app-server 是否使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用 PI：** 除非你为该 agent 强制设置了 `agentRuntime.id: "codex"`，或选择了旧版 `codex/*` 引用，否则这是预期行为。普通 `openai/gpt-*` 和其他提供商引用在 `auto` 模式中会保持在其正常提供商路径上。如果你强制设置 `agentRuntime.id: "codex"`，该 agent 的每个嵌入式轮次都必须是 Codex 支持的 OpenAI 模型。

**已安装 Computer Use 但工具未运行：** 从新会话运行 `/codex computer-use status`。如果某个工具报告 `Native hook relay unavailable`，请使用 `/new` 或 `/reset`；如果问题仍然存在，请重启 Gateway 网关以清除陈旧的原生钩子注册。如果 `computer-use.list_apps` 超时，请重启 Codex Computer Use 或 Codex Desktop 后重试。

## 相关

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [插件钩子](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
