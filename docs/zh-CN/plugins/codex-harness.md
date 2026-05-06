---
read_when:
    - 你想使用内置的 Codex app-server 运行框架
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署直接失败，而不是回退到 Pi
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-05-06T08:14:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

内置 `codex` 插件让 OpenClaw 通过 Codex app-server 而不是内置 PI harness 来运行嵌入式 agent 轮次。

当你希望由 Codex 拥有底层 agent 会话时使用此方式：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然拥有聊天渠道、会话文件、模型选择、工具、审批、媒体投递，以及可见对话记录镜像。

当来源聊天轮次通过 Codex harness 运行时，如果部署未显式配置 `messages.visibleReplies`，可见回复默认使用 OpenClaw `message` 工具。agent 仍然可以私下完成其 Codex 轮次；只有在调用 `message(action="send")` 时才会发布到渠道。将 `messages.visibleReplies: "automatic"` 设置为继续在旧版自动投递路径上发送直接聊天的最终回复。

Codex heartbeat 轮次默认也会获得 `heartbeat_respond` 工具，因此 agent 可以记录这次唤醒应保持安静还是发出通知，而不必在最终文本中编码该控制流。

heartbeat 专用的主动性指导会作为 Codex 协作模式开发者指令发送到 heartbeat 轮次本身。普通聊天轮次会恢复 Codex Default 模式，而不会在其正常运行时提示中携带 heartbeat 理念。

如果你正在尝试确定方向，请从 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。简短版本是：`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍然是通信界面。

## 快速配置

大多数想要“OpenClaw 中的 Codex”的用户想要这条路线：使用 ChatGPT/Codex 订阅登录，然后通过原生 Codex app-server 运行时运行嵌入式 agent 轮次。模型引用仍然以 `openai/gpt-*` 作为规范形式；订阅凭证来自 Codex 账号/配置文件，而不是来自 `openai-codex/*` 模型前缀。

如果你尚未登录，请先使用 Codex OAuth 登录：

```bash
openclaw models auth login --provider openai-codex
```

然后启用内置 `codex` 插件并强制使用 Codex 运行时：

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

如果你的配置使用 `plugins.allow`，也要在其中包含 `codex`：

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

不要在配置中使用 `openai-codex/gpt-*`。该前缀是一条旧版路线，`openclaw doctor --fix` 会在主模型、回退项、heartbeat/subagent/compaction 覆盖、钩子、渠道覆盖，以及过时的持久化会话路线固定项中，将其重写为 `openai/gpt-*`。

## 此插件会改变什么

内置 `codex` 插件提供若干独立能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式运行时                  | `agentRuntime.id: "codex"`                          | 通过 Codex app-server 运行 OpenClaw 嵌入式 agent 轮次。                       |
| 原生聊天控制命令                  | `/codex bind`、`/codex resume`、`/codex steer`、... | 从消息对话绑定并控制 Codex app-server 线程。                                  |
| Codex app-server 提供商/目录      | `codex` 内部机制，通过 harness 暴露                 | 让运行时发现并验证 app-server 模型。                                          |
| Codex 媒体理解路径                | `codex/*` 图像模型兼容路径                          | 为受支持的图像理解模型运行有界 Codex app-server 轮次。                        |
| 原生钩子中继                      | 围绕 Codex 原生事件的插件钩子                       | 让 OpenClaw 观察/阻止受支持的 Codex 原生工具/最终化事件。                     |

启用插件会使这些能力可用。它**不会**：

- 开始对每个 OpenAI 模型使用 Codex
- 在 Doctor 验证 Codex 已安装、已启用、提供 `codex` harness 且 OAuth 就绪之前，将 `openai-codex/*` 模型引用转换为原生运行时
- 将 ACP/acpx 设为默认 Codex 路径
- 热切换已记录 PI 运行时的现有会话
- 替换 OpenClaw 渠道投递、会话文件、凭证配置文件存储或消息路由

同一插件还拥有原生 `/codex` 聊天控制命令界面。如果插件已启用，并且用户要求从聊天中绑定、恢复、Steer、停止或检查 Codex 线程，agent 应优先使用 `/codex ...` 而不是 ACP。当用户要求使用 ACP/acpx 或正在测试 ACP Codex 适配器时，ACP 仍然是显式回退。

原生 Codex 轮次会保留 OpenClaw 插件钩子作为公开兼容层。这些是在进程内运行的 OpenClaw 钩子，而不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`，用于镜像的对话记录
- 通过 Codex `Stop` 中继触发的 `before_agent_finalize`
- `agent_end`

插件也可以注册运行时中立的工具结果中间件，在 OpenClaw 执行工具之后、结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这不同于公开的 `tool_result_persist` 插件钩子，后者会转换 OpenClaw 所拥有的对话记录工具结果写入。

关于插件钩子语义本身，请参阅[插件钩子](/zh-CN/plugins/hooks)和[插件保护行为](/zh-CN/tools/plugin)。

harness 默认关闭。新配置应继续将 OpenAI 模型引用保持为 `openai/gpt-*` 的规范形式，并在需要原生 app-server 执行时显式强制使用 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用仍会自动选择 harness 以保持兼容，但由运行时支持的旧版提供商前缀不会作为普通模型/提供商选项显示。

如果任何已配置的模型路线仍为 `openai-codex/*`，`openclaw doctor --fix` 会将其重写为 `openai/*`。对于匹配的 agent 路线，只有在 Codex 插件已安装、已启用、提供 `codex` harness 且有可用 OAuth 时，它才会将 agent 运行时设置为 `codex`；否则会将运行时设置为 `pi`。

## 路线映射

更改配置前请使用此表：

| 期望行为                                             | 模型引用                   | 运行时配置                             | 凭证/配置文件路线          | 预期 Status 标签              |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | -------------------------- | ------------------------------ |
| 使用原生 Codex 运行时的 ChatGPT/Codex 订阅          | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth 或 Codex 账号  | `Runtime: OpenAI Codex`        |
| 通过正常 OpenClaw runner 使用 OpenAI API             | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI API key             | `Runtime: OpenClaw Pi Default` |
| 需要 Doctor 修复的旧版配置                           | `openai-codex/gpt-*`       | 修复为 `codex` 或 `pi`                 | 现有已配置凭证             | 在 `doctor --fix` 后重新检查   |
| 使用保守自动模式的混合提供商                         | 提供商特定引用             | `agentRuntime.id: "auto"`              | 按所选提供商               | 取决于所选运行时               |
| 显式 Codex ACP 适配器会话                            | 取决于 ACP 提示/模型       | 带有 `runtime: "acp"` 的 `sessions_spawn` | ACP 后端凭证              | ACP 任务/会话 Status           |

重要区别是提供商与运行时：

- `openai-codex/*` 是 Doctor 会重写的旧版路线。
- `agentRuntime.id: "codex"` 需要 Codex harness，并且在不可用时会关闭失败。
- `agentRuntime.id: "auto"` 允许已注册的 harness 声明匹配的提供商路线，但规范 OpenAI 引用仍由 PI 拥有，除非某个 harness 支持该提供商/模型组合。
- `/codex ...` 回答“此聊天应绑定或控制哪个原生 Codex 对话？”
- ACP 回答“acpx 应启动哪个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 系列路线与前缀相关。对于常见的订阅加原生 Codex 运行时设置，请将 `openai/*` 与 `agentRuntime.id: "codex"` 配合使用。将 `openai-codex/*` 视为应由 Doctor 重写的旧版配置：

| 模型引用                                      | 运行时路径                                   | 使用场景                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 通过 OpenClaw/PI 管道使用 OpenAI provider    | 你想通过 `OPENAI_API_KEY` 使用当前直接 OpenAI Platform API 访问。         |
| `openai-codex/gpt-5.5`                        | 由 Doctor 修复的旧版路线                     | 你正在使用旧配置；运行 `openclaw doctor --fix` 来重写它。                 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                     | 你想使用 ChatGPT/Codex 订阅凭证并进行原生 Codex 执行。                   |

当你的账号公开这些路线时，GPT-5.5 可以同时出现在直接 OpenAI API key 路线和 Codex 订阅路线中。对于原生 Codex 运行时，请将 `openai/gpt-5.5` 与 Codex app-server harness 配合使用；对于直接 API key 流量，请使用不带 Codex 运行时覆盖的 `openai/gpt-5.5`。

旧版 `codex/gpt-*` 引用仍作为兼容别名被接受。Doctor 兼容性迁移会将旧版运行时引用重写为规范模型引用，并单独记录运行时策略。新的原生 app-server harness 配置应使用 `openai/gpt-*` 加 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前缀区分。普通 OpenAI 路线使用 `openai/gpt-*`，需要通过有界 Codex app-server 轮次运行图像理解时使用 `codex/gpt-*`。不要使用 `openai-codex/gpt-*`；Doctor 会将该旧版前缀重写为 `openai/gpt-*`。Codex app-server 模型必须声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 确认当前会话的有效 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

### Doctor 警告的含义

当已配置的模型引用或持久化会话路线状态仍使用 `openai-codex/*` 时，`openclaw doctor` 会发出警告。`openclaw doctor --fix` 会将这些路线重写为：

- `openai/<model>`
- 当 Codex 已安装、已启用、提供 `codex` harness 且有可用 OAuth 时，使用 `agentRuntime.id: "codex"`
- 否则使用 `agentRuntime.id: "pi"`

`codex` 路线会强制使用原生 Codex harness。`pi` 路线会将 agent 保留在默认 OpenClaw runner 上，而不是作为旧版路线清理的副作用启用或安装 Codex。
Doctor 还会修复已发现 agent 会话存储中的过时持久化会话固定项，确保旧对话不会继续卡在已移除的路线。

harness 选择不是实时会话控制。当嵌入式轮次运行时，
OpenClaw 会在该会话上记录所选 harness id，并在同一会话 id 的
后续轮次中继续使用它。当你希望未来会话使用另一个 harness 时，
请更改 `agentRuntime` 配置或 `OPENCLAW_AGENT_RUNTIME`；在将现有
对话从 PI 切换到 Codex 之前，使用 `/new` 或 `/reset` 启动一个全新会话。
这可以避免通过两个不兼容的原生会话系统重放同一份 transcript。

在 harness 固定功能之前创建的旧会话，一旦已有 transcript 历史，
就会被视为已固定到 PI。更改配置后，使用 `/new` 或 `/reset` 将该对话
切换到 Codex。

`/status` 会显示生效的模型运行时。默认 PI harness 显示为
`Runtime: OpenClaw Pi Default`，Codex 应用服务器 harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，并且内置 `codex` 插件可用。
- Codex 应用服务器 `0.125.0` 或更新版本。内置插件默认会管理兼容的
  Codex 应用服务器二进制文件，因此 `PATH` 上的本地 `codex` 命令
  不会影响正常的 harness 启动。
- 应用服务器进程或 OpenClaw 的 Codex 凭证桥接可使用 Codex 凭证。
  本地应用服务器启动会为每个智能体使用一个由 OpenClaw 管理的 Codex home，
  以及一个隔离的子进程 `HOME`，因此默认不会读取你的个人
  `~/.codex` 账号、Skills、插件、配置、线程状态，或原生
  `$HOME/.agents/skills`。

插件会阻止较旧或未带版本的应用服务器握手。这会让 OpenClaw 停留在
已经过测试的协议表面上。

对于实时和 Docker smoke 测试，凭证通常来自 Codex CLI 账号或
OpenClaw `openai-codex` 凭证配置文件。本地 stdio 应用服务器启动在没有账号时，
也可以回退到 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 工作区引导文件

Codex 会通过原生项目文档发现自行处理 `AGENTS.md`。OpenClaw 不会写入
合成的 Codex 项目文档文件，也不会依赖 Codex 的 persona 文件回退文件名，
因为 Codex 回退只在缺少 `AGENTS.md` 时适用。

为了保持 OpenClaw 工作区一致性，Codex harness 会解析其他引导文件
（存在时包括 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、
`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`），并通过 `thread/start`
和 `thread/resume` 上的 Codex developer instructions 转发它们。这会让
`SOUL.md` 及相关工作区 persona/profile 上下文在原生 Codex 行为塑形通道上
可见，同时不会重复 `AGENTS.md`。

## 将 Codex 与其他模型一起添加

如果同一个智能体应当能在 Codex 和非 Codex 提供商模型之间自由切换，
不要全局设置 `agentRuntime.id: "codex"`。强制运行时会应用到该智能体或会话的
每个嵌入式轮次。如果你在该运行时被强制时选择 Anthropic 模型，OpenClaw 仍会尝试
Codex harness，并以失败关闭结束，而不是静默地通过 PI 路由该轮次。

请改用以下形态之一：

- 将 Codex 放在一个带有 `agentRuntime.id: "codex"` 的专用智能体上。
- 让默认智能体保持 `agentRuntime.id: "auto"`，并保留 PI 回退用于正常的混合
  提供商使用。
- 仅为兼容性使用旧版 `codex/*` 引用。新配置应优先使用
  `openai/*`，并显式指定 Codex 运行时策略。

例如，以下配置会让默认智能体保持正常自动选择，并添加一个独立的 Codex 智能体：

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

使用这种形态时：

- 默认 `main` 智能体使用正常提供商路径和 PI 兼容性回退。
- `codex` 智能体使用 Codex 应用服务器 harness。
- 如果 `codex` 智能体缺少 Codex 或不受支持，该轮次会失败，
  而不是悄悄使用 PI。

## 智能体命令路由

智能体应按意图路由用户请求，而不是仅凭 “Codex” 这个词：

| 用户请求...                                            | 智能体应使用...                                   |
| ------------------------------------------------------ | ------------------------------------------------ |
| “将此聊天绑定到 Codex”                                | `/codex bind`                                    |
| “在这里恢复 Codex 线程 `<id>`”                         | `/codex resume <id>`                             |
| “显示 Codex 线程”                                      | `/codex threads`                                 |
| “为一次异常 Codex 运行提交支持报告”                    | `/diagnostics [note]`                            |
| “仅为此附加线程发送 Codex 反馈”                        | `/codex diagnostics [note]`                      |
| “将我的 ChatGPT/Codex 订阅与 Codex 运行时一起使用”     | `openai/*` 加上 `agentRuntime.id: "codex"`       |
| “修复旧的 `openai-codex/*` 配置/会话固定”              | `openclaw doctor --fix`                          |
| “通过 ACP/acpx 运行 Codex”                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor”      | ACP/acpx，而不是 `/codex`，也不是原生子智能体    |

OpenClaw 只会在 ACP 已启用、可调度且由已加载的运行时后端支撑时，
向智能体宣传 ACP 生成指导。如果 ACP 不可用，系统提示和插件 Skills
不应教智能体 ACP 路由。

## 仅 Codex 部署

当你需要证明每个嵌入式智能体轮次都使用 Codex 时，强制使用 Codex harness。
显式插件运行时会以失败关闭结束，并且绝不会静默通过 PI 重试：

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

强制使用 Codex 时，如果 Codex 插件被禁用、应用服务器过旧，或应用服务器无法启动，
OpenClaw 会提前失败。

## 按智能体使用 Codex

你可以让一个智能体仅使用 Codex，同时默认智能体保持正常自动选择：

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

使用正常会话命令来切换智能体和模型。`/new` 会创建一个全新的
OpenClaw 会话，而 Codex harness 会按需创建或恢复其 sidecar 应用服务器线程。
`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮再次从当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向应用服务器询问可用模型。如果发现失败或超时，
它会为以下模型使用内置回退目录：

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

当你希望启动时避免探测 Codex，并固定使用回退目录时，请禁用发现：

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

## 应用服务器连接和策略

默认情况下，插件会使用以下命令在本地启动 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

托管二进制文件随 `codex` 插件包一起发布。这会让应用服务器版本与内置插件绑定，
而不是与本地碰巧安装的任何单独 Codex CLI 绑定。只有当你有意运行不同可执行文件时，
才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。这是用于自主 Heartbeat 的受信任本地操作员姿态：
Codex 可以使用 shell 和网络工具，而不会停在无人响应的原生审批提示上。

要选择使用 Codex guardian 审查的审批，请设置 `appServer.mode:
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

Guardian 模式使用 Codex 的原生自动审查审批路径。当 Codex 请求离开沙箱、
写入工作区外部，或添加网络访问等权限时，Codex 会将该审批请求路由到原生审查器，
而不是人类提示。审查器会应用 Codex 的风险框架，并批准或拒绝该特定请求。
当你需要比 YOLO 模式更多的护栏，但仍需要无人值守智能体继续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
单独的策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选择混用。
较旧的 `guardian_subagent` 审查器值仍作为兼容别名被接受，
但新配置应使用 `auto_review`。

对于已经运行的应用服务器，请使用 WebSocket 传输：

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

stdio 应用服务器启动默认会继承 OpenClaw 的进程环境，
但 OpenClaw 拥有 Codex 应用服务器账号桥接，并将 `CODEX_HOME` 和 `HOME`
都设置为该智能体 OpenClaw 状态下的按智能体目录。Codex 自身的 skill 加载器会读取
`$CODEX_HOME/skills` 和 `$HOME/.agents/skills`，因此对于本地应用服务器启动，
这两个值都是隔离的。这样可以让 Codex 原生 Skills、插件、配置、账号和线程状态
限定在 OpenClaw 智能体内，而不会从操作员的个人 Codex CLI home 泄漏进来。

OpenClaw 插件和 OpenClaw skill 快照仍会通过 OpenClaw 自己的插件注册表和
skill 加载器流转。个人 Codex CLI 资产不会。如果你有有用的 Codex CLI Skills 或插件
应成为 OpenClaw 智能体的一部分，请显式盘点它们：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 迁移提供商会将 Skills 复制到当前 OpenClaw 智能体工作区。
Codex 原生插件、钩子和配置文件会被报告或归档以供手动审查，而不会自动激活，
因为它们可以执行命令、暴露 MCP 服务器，或携带凭证。

凭证按以下顺序选择：

1. 智能体的显式 OpenClaw Codex 凭证配置文件。
2. 该智能体 Codex home 中应用服务器的现有账号。
3. 仅对本地 stdio 应用服务器启动，在没有应用服务器账号且仍需要 OpenAI 凭证时，
   使用 `CODEX_API_KEY`，然后使用 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅式 Codex 凭证配置文件时，它会从生成的 Codex 子进程中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这样可以让 Gateway 网关级 API key 继续可用于嵌入或直接 OpenAI 模型，而不会意外让原生 Codex app-server 轮次通过 API 计费。显式 Codex API-key 配置文件和本地 stdio 环境键回退会使用 app-server 登录，而不是继承的子进程环境。WebSocket app-server 连接不会接收 Gateway 网关环境 API-key 回退；请使用显式凭证配置文件，或使用远程 app-server 自己的账户。

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

Codex 动态工具默认使用 `native-first` 配置文件。在该模式下，OpenClaw 不会暴露与 Codex 原生工作区操作重复的动态工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。OpenClaw 集成工具（例如消息、会话、媒体、cron、浏览器、节点、gateway、`heartbeat_respond` 和 `web_search`）仍然可用。

支持的顶层 Codex 插件字段：

| 字段                       | 默认值           | 含义                                                                                      |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | 使用 `"openclaw-compat"` 向 Codex app-server 暴露完整的 OpenClaw 动态工具集。             |
| `codexDynamicToolsExclude` | `[]`             | 要从 Codex app-server 轮次中省略的其他 OpenClaw 动态工具名称。                            |

支持的 `appServer` 字段：

| 字段                | 默认值                                   | 含义                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 会生成 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                                                               |
| `command`           | 托管的 Codex 二进制文件                  | stdio 传输的可执行文件。保持未设置以使用托管二进制文件；只有在需要显式覆盖时才设置它。                                                                                                                                              |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 传输的参数。                                                                                                                                                                                                                   |
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                                                                                                                                           |
| `authToken`         | 未设置                                   | WebSocket 传输的 Bearer token。                                                                                                                                                                                                      |
| `headers`           | `{}`                                     | 额外的 WebSocket 头。                                                                                                                                                                                                                |
| `clearEnv`          | `[]`                                     | OpenClaw 构建其继承环境后，从生成的 stdio app-server 进程中移除的额外环境变量名称。`CODEX_HOME` 和 `HOME` 保留用于 OpenClaw 在本地启动时对每个智能体进行 Codex 隔离。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian-reviewed 执行的预设。                                                                                                                                                                                              |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/轮次的原生 Codex approval policy。                                                                                                                                                                              |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                                                                                                                                          |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审核原生 approval prompt。`guardian_subagent` 仍是旧版别名。                                                                                                                                          |
| `serviceTier`       | 未设置                                   | 可选 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                                                                                                                                                |

OpenClaw 所属的动态工具调用独立于 `appServer.requestTimeoutMs` 受限：每个 Codex `item/tool/call` 请求都必须在 30 秒内收到 OpenClaw 响应。超时时，OpenClaw 会在支持时中止工具信号，并向 Codex 返回失败的动态工具响应，使轮次可以继续，而不是让会话停留在 `processing`。

OpenClaw 响应 Codex 轮次范围内的 app-server 请求后，harness 还会期望 Codex 以 `turn/completed` 完成原生轮次。如果 app-server 在该响应后静默 60 秒，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw 会话通道，使后续聊天消息不会排队等待陈旧的原生轮次。

本地测试仍可使用环境覆盖：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或将 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 用于一次性本地测试。对于可重复部署，优先使用配置，因为它会把插件行为与其余 Codex harness 设置保存在同一个经过审核的文件中。

## 计算机使用

计算机使用在自己的设置指南中说明：
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

简短版本：OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作。它会准备 Codex app-server，验证 `computer-use` MCP 服务器可用，然后让 Codex 在 Codex 模式轮次期间处理原生 MCP 工具调用。

如需在 Codex marketplace 流程之外直接访问 TryCua driver，请使用 `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 注册 `cua-driver mcp`。请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)，了解 Codex 所属的计算机使用与直接 MCP 注册之间的区别。

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

可以从命令界面检查或安装该设置：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use 是 macOS 专用的，并且在 Codex MCP 服务器能够控制应用之前，可能需要本地 OS 权限。如果 `computerUse.enabled` 为 true 且 MCP 服务器不可用，Codex 模式轮次会在线程启动前失败，而不是在没有原生 Computer Use 工具的情况下静默运行。请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)，了解 marketplace 选择、远程 catalog 限制、Status 原因和故障排除。

当 `computerUse.autoInstall` 为 true 时，如果 Codex 尚未发现本地 marketplace，OpenClaw 可以从 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 注册标准内置 Codex Desktop marketplace。更改运行时或 Computer Use 配置后，请使用 `/new` 或 `/reset`，这样现有会话就不会保留旧的 PI 或 Codex 线程绑定。

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

仅 Codex harness 验证：

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

Guardian-reviewed Codex approvals：

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

带显式头的远程 app-server：

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

模型切换仍由 OpenClaw 控制。当 OpenClaw 会话附加到现有 Codex 线程时，下一个轮次会再次向 app-server 发送当前选择的 OpenAI 模型、提供商、approval policy、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选择的模型继续。

## Codex 命令

内置插件将 `/codex` 注册为授权斜杠命令。它是通用的，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时应用服务器连接状态、模型、账号、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex 应用服务器压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审查。
- `/codex diagnostics [note]` 会在发送已附加线程的 Codex 诊断反馈前询问。
- `/codex computer-use status` 检查已配置的 Computer Use 插件和 MCP 服务器。
- `/codex computer-use install` 安装已配置的 Computer Use 插件并重新加载 MCP 服务器。
- `/codex account` 显示账号和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器 Skills。

当 Codex 报告使用限制失败时，如果 Codex 提供了下一次应用服务器重置时间，OpenClaw 会包含该时间。在同一对话中使用 `/codex account` 查看当前账号和速率限制窗口。

### 常见调试工作流

当 Codex 驱动的智能体在 Telegram、Discord、Slack 或其他渠道中做出意外行为时，从问题发生的对话开始：

1. 运行 `/diagnostics bad tool choice after image upload` 或另一条简短备注来描述你看到的情况。
2. 批准一次诊断请求。批准后会创建本地 Gateway 网关诊断 zip，并且由于该会话正在使用 Codex harness，也会将相关的 Codex 反馈包发送到 OpenAI 服务器。
3. 将完成后的诊断回复复制到错误报告或支持线程中。它包含本地包路径、隐私摘要、OpenClaw 会话 ID、Codex 线程 ID，以及每个 Codex 线程对应的 `Inspect locally` 行。
4. 如果你想自行调试该运行，请在终端中运行打印出的 `Inspect locally` 命令。它看起来像 `codex resume <thread-id>`，并会打开原生 Codex 线程，以便你检查对话、在本地继续，或询问 Codex 为什么选择了特定工具或计划。

仅当你明确想为当前附加线程上传 Codex 反馈，而不需要完整的 OpenClaw Gateway 网关诊断包时，才使用 `/codex diagnostics [note]`。对于大多数支持报告，`/diagnostics [note]` 是更好的起点，因为它会在一条回复中把本地 Gateway 网关状态和 Codex 线程 ID 关联起来。完整的隐私模型和群聊行为见[诊断导出](/zh-CN/gateway/diagnostics)。

OpenClaw 核心也公开仅所有者可用的 `/diagnostics [note]`，作为通用 Gateway 网关诊断命令。它的批准提示会显示敏感数据前言，链接到[诊断导出](/zh-CN/gateway/diagnostics)，并且每次都通过显式 exec 批准请求 `openclaw gateway diagnostics export --json`。不要用全允许规则批准诊断。批准后，OpenClaw 会发送一份可粘贴报告，其中包含本地包路径和清单摘要。当活动 OpenClaw 会话正在使用 Codex harness 时，同一次批准也会授权将相关 Codex 反馈包发送到 OpenAI 服务器。批准提示会说明将发送 Codex 反馈，但在批准前不会列出 Codex 会话或线程 ID。

如果 `/diagnostics` 由群聊中的所有者调用，OpenClaw 会保持共享渠道整洁：群组只会收到一条简短通知，而诊断前言、批准提示以及 Codex 会话/线程 ID 会通过私有批准路径发送给所有者。如果不存在私有所有者路径，OpenClaw 会拒绝群组请求，并要求所有者从私信中运行它。

批准的 Codex 上传会调用 Codex 应用服务器 `feedback/upload`，并要求应用服务器在可用时为每个列出的线程和派生的 Codex 子线程包含日志。上传会通过 Codex 的常规反馈路径发送到 OpenAI 服务器；如果该应用服务器禁用了 Codex 反馈，命令会返回应用服务器错误。完成后的诊断回复会列出已发送线程的渠道、OpenClaw 会话 ID、Codex 线程 ID，以及本地 `codex resume <thread-id>` 命令。如果你拒绝或忽略批准，OpenClaw 不会打印这些 Codex ID。此上传不会替代本地 Gateway 网关诊断导出。

`/codex resume` 会写入 harness 在正常轮次中使用的同一个 sidecar 绑定文件。下一条消息时，OpenClaw 会恢复该 Codex 线程，将当前选择的 OpenClaw 模型传递给应用服务器，并保持启用扩展历史。

### 从 CLI 检查 Codex 线程

理解一次糟糕 Codex 运行的最快方式，通常是直接打开原生 Codex 线程：

```sh
codex resume <thread-id>
```

当你在渠道对话中发现错误，并想检查有问题的 Codex 会话、在本地继续，或询问 Codex 为什么做出特定工具或推理选择时，请使用它。最简单的路径通常是先运行 `/diagnostics [note]`：你批准后，完成的报告会列出每个 Codex 线程，并打印一个 `Inspect locally` 命令，例如 `codex resume <thread-id>`。你可以将该命令直接复制到终端中。

你也可以通过当前聊天的 `/codex binding` 或最近 Codex 应用服务器线程的 `/codex threads [filter]` 获取线程 ID，然后在 shell 中运行同一个 `codex resume` 命令。

命令界面需要 Codex 应用服务器 `0.125.0` 或更新版本。如果未来版本或自定义应用服务器未公开某个 JSON-RPC 方法，单个控制方法会报告为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 跨 PI 和 Codex harness 的产品/插件兼容性。                          |
| Codex 应用服务器扩展中间件            | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐轮适配器行为。                            |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。                |

OpenClaw 不使用项目级或全局 Codex `hooks.json` 文件来路由 OpenClaw 插件行为。对于受支持的原生工具和权限桥接，OpenClaw 会为 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入每线程 Codex 配置。其他 Codex 钩子，如 `SessionStart` 和 `UserPromptSubmit`，仍然是 Codex 级控制；它们不会在 v1 契约中作为 OpenClaw 插件钩子公开。

对于 OpenClaw 动态工具，OpenClaw 会在 Codex 请求调用后执行该工具，因此 OpenClaw 会在 harness 适配器中触发它拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有权威工具记录。OpenClaw 可以镜像选定事件，但除非 Codex 通过应用服务器或原生钩子回调公开该操作，否则它无法重写原生 Codex 线程。

压缩和 LLM 生命周期投影来自 Codex 应用服务器通知和 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是适配器级观察，而不是 Codex 内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` 应用服务器通知会被投影为 `codex_app_server.hook` 智能体事件，用于轨迹记录和调试。它们不会调用 OpenClaw 插件钩子。

## V1 支持契约

Codex 模式并不是在底层换了一个模型调用的 PI。Codex 拥有更多原生模型循环，而 OpenClaw 会围绕该边界适配它的插件和会话界面。

Codex 运行时 v1 支持：

| 界面                                          | 支持情况                                | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环                 | 支持                                    | Codex 应用服务器拥有 OpenAI 轮次、原生线程恢复和原生工具续接。                                                                                                                                        |
| OpenClaw 渠道路由和交付                       | 支持                                    | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道保持在模型运行时之外。                                                                                                                         |
| OpenClaw 动态工具                             | 支持                                    | Codex 请求 OpenClaw 执行这些工具，因此 OpenClaw 保持在执行路径中。                                                                                                                                    |
| 提示和上下文插件                              | 支持                                    | OpenClaw 在启动或恢复线程之前构建提示覆盖层，并将上下文投影到 Codex 轮次中。                                                                                                                          |
| 上下文引擎生命周期                            | 支持                                    | 组装、摄取或轮次后维护，以及上下文引擎压缩协调会为 Codex 轮次运行。                                                                                                                                  |
| 动态工具钩子                                  | 支持                                    | `before_tool_call`、`after_tool_call` 和工具结果中间件围绕 OpenClaw 拥有的动态工具运行。                                                                                                              |
| 生命周期钩子                                  | 作为适配器观察受支持                    | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式载荷触发。                                                                                       |
| 最终答案修订门                                | 通过原生钩子中继支持                    | Codex `Stop` 会中继到 `before_agent_finalize`；`revise` 会要求 Codex 在最终确定前再执行一次模型传递。                                                                                                  |
| 原生 shell、patch 和 MCP 阻止或观察           | 通过原生钩子中继支持                    | Codex `PreToolUse` 和 `PostToolUse` 会针对已承诺的原生工具界面中继，包括 Codex 应用服务器 `0.125.0` 或更新版本上的 MCP 载荷。支持阻止；不支持参数重写。                                                |
| 原生权限策略                                  | 通过原生钩子中继支持                    | 在运行时公开该能力的地方，Codex `PermissionRequest` 可以通过 OpenClaw 策略路由。如果 OpenClaw 不返回决定，Codex 会继续通过它的常规 guardian 或用户批准路径。                                           |
| 应用服务器轨迹捕获                            | 支持                                    | OpenClaw 会记录它发送给应用服务器的请求以及它收到的应用服务器通知。                                                                                                                                  |

Codex 运行时 v1 不支持：

| 适用范围                                             | V1 边界                                                                                                                                     | 未来路径                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                       | Codex 原生工具前置钩子可以阻止操作，但 OpenClaw 不会重写 Codex 原生工具参数。                                               | 需要 Codex 钩子/架构支持替换工具输入。                            |
| 可编辑的 Codex 原生转录历史            | Codex 拥有规范的原生线程历史。OpenClaw 拥有一个镜像，可以投射未来上下文，但不应变更不受支持的内部机制。 | 如果需要原生线程改写，添加显式的 Codex app-server API。                    |
| Codex 原生工具记录的 `tool_result_persist` | 该钩子会转换 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。                                                           | 可以镜像转换后的记录，但规范重写需要 Codex 支持。              |
| 丰富的原生压缩元数据                     | OpenClaw 会观察压缩开始和完成，但不会收到稳定的保留/丢弃列表、token 变化量或摘要载荷。            | 需要更丰富的 Codex 压缩事件。                                                     |
| 压缩干预                             | 当前 OpenClaw 压缩钩子在 Codex 模式下属于通知级别。                                                                         | 如果插件需要否决或重写原生压缩，添加 Codex 压缩前/后钩子。 |
| 逐字节捕获模型 API 请求             | OpenClaw 可以捕获 app-server 请求和通知，但 Codex 核心会在内部构建最终的 OpenAI API 请求。                      | 需要 Codex 模型请求追踪事件或调试 API。                                   |

## 工具、媒体和压缩

Codex harness 只会更改低层嵌入式智能体执行器。

OpenClaw 仍会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批和消息工具输出会继续通过正常的 OpenClaw 交付路径。

原生钩子中继有意保持通用，但 v1 支持合同仅限于 OpenClaw 测试过的 Codex 原生工具和权限路径。在 Codex 运行时中，这包括 shell、patch 和 MCP `PreToolUse`、`PostToolUse` 以及 `PermissionRequest` 载荷。不要假设每个未来的 Codex 钩子事件都是 OpenClaw 插件表面，除非运行时合同明确命名它。

对于 `PermissionRequest`，OpenClaw 仅在策略做出决定时返回显式允许或拒绝决定。无决定结果并不表示允许。Codex 会将其视为没有钩子决定，并回退到自己的 guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批 elicitations 会通过 OpenClaw 的插件审批流路由。Codex `request_user_input` 提示会发送回原始聊天，下一条排队的后续消息会回答该原生服务器请求，而不是作为额外上下文进行 Steer。其他 MCP elicitation 请求仍会失败关闭。

活动运行队列 Steering 会映射到 Codex app-server `turn/steer`。使用默认的 `messages.queue.mode: "steer"` 时，OpenClaw 会在配置的静默窗口内批处理排队的聊天消息，并按到达顺序将它们作为一个 `turn/steer` 请求发送。旧版 `queue` 模式会发送单独的 `turn/steer` 请求。Codex review 和手动压缩轮次可能会拒绝同一轮次 Steering，在这种情况下，当所选模式允许回退时，OpenClaw 会使用后续队列。参见 [Steering queue](/zh-CN/concepts/queue-steering)。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个用于渠道历史、搜索、`/new`、`/reset` 以及未来模型或 harness 切换的转录镜像。该镜像包含用户提示、最终助手文本，以及 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未公开人类可读的压缩摘要，也未公开可审计的列表来说明 Codex 在压缩后保留了哪些条目。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它只在 OpenClaw 写入 OpenClaw 拥有的会话转录工具结果时适用。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解会继续使用匹配的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 不会显示为普通的 `/model` 提供商：** 对于新配置，这是预期行为。选择一个带有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 当没有 Codex harness 声明本次运行时，`agentRuntime.id: "auto"` 仍可将 PI 用作兼容性后端。设置 `agentRuntime.id: "codex"` 可在测试时强制选择 Codex。强制 Codex 运行时会失败，而不是回退到 PI。一旦选中 Codex app-server，它的失败会直接暴露出来。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手报告版本 `0.125.0` 或更新版本。相同版本的预发布版或带构建后缀的版本（如 `0.125.0-alpha.2` 或 `0.125.0+custom`）会被拒绝，因为 OpenClaw 测试的是稳定版 `0.125.0` 协议下限。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，并确认远程 app-server 使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用 PI：** 这是预期行为，除非你为该智能体强制设置了 `agentRuntime.id: "codex"`，或选择了旧版 `codex/*` 引用。普通 `openai/gpt-*` 和其他提供商引用在 `auto` 模式下会继续走其正常提供商路径。如果强制设置 `agentRuntime.id: "codex"`，该智能体的每个嵌入式轮次都必须使用 Codex 支持的 OpenAI 模型。

**Computer Use 已安装但工具不运行：** 在新会话中检查 `/codex computer-use status`。如果某个工具报告 `Native hook relay unavailable`，使用 `/new` 或 `/reset`；如果问题仍然存在，重启 Gateway 网关以清除过期的原生钩子注册。如果 `computer-use.list_apps` 超时，重启 Codex Computer Use 或 Codex Desktop，然后重试。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [插件钩子](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
