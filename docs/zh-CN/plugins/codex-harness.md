---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署失败，而不是回退到 PI
summary: 通过内置的 Codex app-server 运行框架运行 OpenClaw 嵌入式智能体回合
title: Codex harness
x-i18n:
    generated_at: "2026-05-06T00:47:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353812c804c896eccc3415a108e8b9c4628adb8c98bba8978bfc6c3dc57587b5
    source_path: plugins/codex-harness.md
    workflow: 16
---

内置的 `codex` 插件让 OpenClaw 通过 Codex app-server 运行嵌入式智能体轮次，而不是使用内置的 PI harness。

当你希望 Codex 接管底层智能体会话时使用它：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体投递，以及可见的转录镜像。

当源聊天轮次通过 Codex harness 运行时，如果部署没有显式配置 `messages.visibleReplies`，可见回复默认使用 OpenClaw `message` 工具。智能体仍然可以私下完成它的 Codex 轮次；只有在调用 `message(action="send")` 时才会发布到渠道。设置 `messages.visibleReplies: "automatic"` 可让直接聊天的最终回复继续使用旧版自动投递路径。

Codex heartbeat 轮次默认也会获得 `heartbeat_respond` 工具，因此智能体可以记录这次唤醒应保持安静还是发出通知，而无需把该控制流编码进最终文本。

heartbeat 专用的主动性指导会作为 Codex 协作模式 developer instruction 发送到 heartbeat 轮次本身。普通聊天轮次会恢复 Codex Default 模式，而不是在其正常运行时提示中携带 heartbeat 理念。

如果你正在试图建立整体认识，请从 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。简短版本是：`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍然是通信界面。

## 快速配置

大多数想要“OpenClaw 中的 Codex”的用户想要这条路径：使用 ChatGPT/Codex 订阅登录，然后通过原生 Codex app-server 运行时运行嵌入式智能体轮次。模型引用仍然保持规范形式 `openai/gpt-*`；订阅凭证来自 Codex 账号/配置档案，而不是来自 `openai-codex/*` 模型前缀。

如果你尚未登录，请先使用 Codex OAuth 登录：

```bash
openclaw models auth login --provider openai-codex
```

然后启用内置的 `codex` 插件，并强制使用 Codex 运行时：

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

如果你的配置使用 `plugins.allow`，也要把 `codex` 加进去：

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

不要在配置中使用 `openai-codex/gpt-*`。该前缀是旧版路由，`openclaw doctor --fix` 会在主模型、fallback、heartbeat/子智能体/压缩覆盖项、钩子、渠道覆盖项，以及陈旧的持久化会话路由固定项中把它重写为 `openai/gpt-*`。

## 此插件会改变什么

内置的 `codex` 插件提供几项独立能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式运行时                  | `agentRuntime.id: "codex"`                          | 通过 Codex app-server 运行 OpenClaw 嵌入式智能体轮次。                        |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 从消息对话中绑定和控制 Codex app-server 线程。                                |
| Codex app-server 提供商/目录      | `codex` 内部机制，通过 harness 暴露                 | 让运行时发现并验证 app-server 模型。                                          |
| Codex 媒体理解路径                | `codex/*` 图像模型兼容路径                          | 为受支持的图像理解模型运行有界的 Codex app-server 轮次。                      |
| 原生钩子中继                      | 围绕 Codex 原生事件的插件钩子                       | 让 OpenClaw 观察/阻止受支持的 Codex 原生工具/最终化事件。                     |

启用该插件会让这些能力可用。它**不会**：

- 对每个 OpenAI 模型都开始使用 Codex
- 在未由 doctor 验证 Codex 已安装、已启用、提供 `codex` harness 且 OAuth 就绪的情况下，把 `openai-codex/*` 模型引用转换为原生运行时
- 让 ACP/acpx 成为默认 Codex 路径
- 热切换已经记录了 PI 运行时的现有会话
- 替换 OpenClaw 渠道投递、会话文件、凭证配置档案存储或消息路由

同一个插件还拥有原生 `/codex` 聊天控制命令界面。如果插件已启用，并且用户要求从聊天中绑定、恢复、steer、停止或检查 Codex 线程，智能体应优先使用 `/codex ...`，而不是 ACP。当用户要求 ACP/acpx 或正在测试 ACP Codex 适配器时，ACP 仍然是显式 fallback。

原生 Codex 轮次会保留 OpenClaw 插件钩子作为公共兼容层。这些是进程内 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`，用于镜像转录记录
- `before_agent_finalize`，通过 Codex `Stop` 中继
- `agent_end`

插件还可以注册运行时中立的工具结果中间件，在 OpenClaw 执行工具之后、结果返回给 Codex 之前重写 OpenClaw 动态工具结果。这不同于公共 `tool_result_persist` 插件钩子，后者转换由 OpenClaw 拥有的转录工具结果写入。

关于插件钩子语义本身，请参阅 [插件钩子](/zh-CN/plugins/hooks) 和 [插件防护行为](/zh-CN/tools/plugin)。

harness 默认关闭。新配置应保持 OpenAI 模型引用的规范形式为 `openai/gpt-*`，并在需要原生 app-server 执行时显式强制设置 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用仍会为了兼容性自动选择该 harness，但运行时支持的旧版提供商前缀不会显示为普通模型/提供商选项。

如果任何已配置的模型路由仍为 `openai-codex/*`，`openclaw doctor --fix` 会把它重写为 `openai/*`。对于匹配的智能体路由，只有当 Codex 插件已安装、已启用、提供 `codex` harness 且有可用 OAuth 时，它才会把智能体运行时设置为 `codex`；否则会设置为 `pi`。

## 路由映射

在更改配置前使用此表：

| 期望行为                                             | 模型引用                   | 运行时配置                             | 凭证/配置档案路由          | 预期 Status 标签              |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | -------------------------- | ------------------------------ |
| 使用原生 Codex 运行时的 ChatGPT/Codex 订阅           | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth 或 Codex 账号  | `Runtime: OpenAI Codex`        |
| 通过普通 OpenClaw runner 使用 OpenAI API             | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI API key             | `Runtime: OpenClaw Pi Default` |
| 需要 doctor 修复的旧版配置                           | `openai-codex/gpt-*`       | 修复为 `codex` 或 `pi`                 | 现有已配置凭证             | `doctor --fix` 后重新检查      |
| 使用保守自动模式的混合提供商                         | 提供商专用引用             | `agentRuntime.id: "auto"`              | 按所选提供商               | 取决于所选运行时               |
| 显式 Codex ACP 适配器会话                            | 取决于 ACP 提示/模型       | `sessions_spawn` 搭配 `runtime: "acp"` | ACP 后端凭证               | ACP 任务/会话状态              |

关键区别是提供商与运行时：

- `openai-codex/*` 是 doctor 会重写的旧版路由。
- `agentRuntime.id: "codex"` 需要 Codex harness；如果不可用，会失败关闭。
- `agentRuntime.id: "auto"` 允许已注册的 harness 认领匹配的提供商路由，但规范 OpenAI 引用仍归 PI 所有，除非某个 harness 支持该提供商/模型组合。
- `/codex ...` 回答“这个聊天应绑定或控制哪个原生 Codex 对话？”
- ACP 回答“acpx 应启动哪个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 系列路由依赖具体前缀。对于常见的订阅加原生 Codex 运行时设置，请使用 `openai/*` 搭配 `agentRuntime.id: "codex"`。把 `openai-codex/*` 视为应由 doctor 重写的旧版配置：

| 模型引用                                      | 运行时路径                                      | 使用场景                                                                  |
| --------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 通过 OpenClaw/PI 管道使用 OpenAI provider       | 你想使用当前直接的 OpenAI Platform API 访问，并提供 `OPENAI_API_KEY`。    |
| `openai-codex/gpt-5.5`                        | 由 doctor 修复的旧版路由                        | 你在使用旧配置；运行 `openclaw doctor --fix` 来重写它。                   |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                        | 你想使用 ChatGPT/Codex 订阅凭证和原生 Codex 执行。                        |

当你的账号公开这些能力时，GPT-5.5 可以同时出现在直接 OpenAI API key 路由和 Codex 订阅路由上。使用 `openai/gpt-5.5` 搭配 Codex app-server harness 可获得原生 Codex 运行时；不带 Codex 运行时覆盖项的 `openai/gpt-5.5` 则用于直接 API key 流量。

旧版 `codex/gpt-*` 引用仍作为兼容别名被接受。Doctor 兼容性迁移会把旧版运行时引用重写为规范模型引用，并单独记录运行时策略。新的原生 app-server harness 配置应使用 `openai/gpt-*` 加 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循同样的前缀拆分。普通 OpenAI 路由使用 `openai/gpt-*`；当图像理解应通过有界的 Codex app-server 轮次运行时，使用 `codex/gpt-*`。不要使用 `openai-codex/gpt-*`；doctor 会把该旧版前缀重写为 `openai/gpt-*`。Codex app-server 模型必须声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 确认当前会话的有效 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/fallback 策略，以及在 `auto` 模式下每个插件候选项的支持结果。

### doctor 警告的含义

当已配置的模型引用或持久化会话路由状态仍使用 `openai-codex/*` 时，`openclaw doctor` 会发出警告。`openclaw doctor --fix` 会把这些路由重写为：

- `openai/<model>`
- 当 Codex 已安装、已启用、提供 `codex` harness 且有可用 OAuth 时，设置为 `agentRuntime.id: "codex"`
- 否则设置为 `agentRuntime.id: "pi"`

`codex` 路由会强制使用原生 Codex harness。`pi` 路由会让智能体继续使用默认 OpenClaw runner，而不是在清理旧版路由时顺带启用或安装 Codex。
Doctor 还会修复已发现的智能体会话存储中的陈旧持久化会话固定项，因此旧对话不会继续卡在已移除的路由上。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，
OpenClaw 会在该会话上记录所选 harness ID，并在同一会话 ID
后续轮次中继续使用它。当你希望未来会话使用另一个 harness 时，请更改 `agentRuntime`
配置或 `OPENCLAW_AGENT_RUNTIME`；在将现有对话从 PI 切换到 Codex
之前，请使用 `/new` 或 `/reset` 启动一个全新会话。这样可以避免通过两个不兼容的原生会话系统重放同一份转录。

在 harness 固定机制之前创建的旧会话，一旦已有转录历史，就会被视为固定到 PI。更改配置后，请使用 `/new` 或 `/reset`
将该对话选择切换到 Codex。

`/status` 会显示实际生效的模型运行时。默认 PI harness 显示为
`Runtime: OpenClaw Pi Default`，Codex app-server harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，且内置 `codex` 插件可用。
- Codex app-server `0.125.0` 或更新版本。内置插件默认会管理一个兼容的
  Codex app-server 二进制文件，因此 `PATH` 上的本地 `codex` 命令不会影响正常的 harness 启动。
- app-server 进程或 OpenClaw 的 Codex 凭证桥接可使用 Codex 凭证。本地 app-server 启动会为每个
  智能体使用一个由 OpenClaw 管理的 Codex 主目录和一个隔离的子 `HOME`，因此默认不会读取你的个人
  `~/.codex` 账户、Skills、插件、配置、线程状态或原生
  `$HOME/.agents/skills`。

该插件会阻止较旧或未带版本的 app-server 握手。这会让
OpenClaw 保持在它已经测试过的协议表面上。

对于实时和 Docker 冒烟测试，凭证通常来自 Codex CLI 账户
或 OpenClaw `openai-codex` 凭证配置档案。没有账户时，本地 stdio app-server 启动也可以回退到
`CODEX_API_KEY` / `OPENAI_API_KEY`。

## 工作区引导文件

Codex 会通过原生项目文档发现自行处理 `AGENTS.md`。OpenClaw
不会写入合成的 Codex 项目文档文件，也不依赖 Codex 用于人格文件的回退文件名，因为 Codex 回退只在缺少
`AGENTS.md` 时适用。

为了保持 OpenClaw 工作区一致性，Codex harness 会解析其他引导文件
（存在时包括 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、
`BOOTSTRAP.md` 和 `MEMORY.md`），并在 `thread/start` 和 `thread/resume` 上通过 Codex
配置指令转发它们。这样无需复制 `AGENTS.md`，也能让
`SOUL.md` 及相关工作区人格/配置上下文可见。

## 将 Codex 与其他模型并用

如果同一个智能体应该能在 Codex 和非 Codex 提供商模型之间自由切换，不要全局设置 `agentRuntime.id: "codex"`。
强制运行时会应用到该智能体或会话的每个嵌入式轮次。如果在强制该运行时时选择 Anthropic 模型，
OpenClaw 仍会尝试 Codex harness，并以关闭失败结束，而不是静默地通过 PI 路由该轮次。

请改用以下形态之一：

- 将 Codex 放在一个专用智能体上，并设置 `agentRuntime.id: "codex"`。
- 让默认智能体保持 `agentRuntime.id: "auto"`，并使用 PI 回退来支持普通的混合提供商用法。
- 仅为兼容性使用旧版 `codex/*` 引用。新配置应优先使用
  `openai/*`，并加上明确的 Codex 运行时策略。

例如，以下配置会让默认智能体保持普通自动选择，并添加一个单独的 Codex 智能体：

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

使用这种形态：

- 默认的 `main` 智能体使用普通提供商路径和 PI 兼容性回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或不支持 Codex，该轮次会失败，
  而不是悄悄使用 PI。

## 智能体命令路由

智能体应按意图路由用户请求，而不是只根据 “Codex” 这个词：

| 用户要求...                                           | 智能体应使用...                                  |
| ------------------------------------------------------ | ------------------------------------------------ |
| “将此聊天绑定到 Codex”                                | `/codex bind`                                    |
| “在这里恢复 Codex 线程 `<id>`”                        | `/codex resume <id>`                             |
| “显示 Codex 线程”                                     | `/codex threads`                                 |
| “为一次异常的 Codex 运行提交支持报告”                 | `/diagnostics [note]`                            |
| “只为这个附加的线程发送 Codex 反馈”                   | `/codex diagnostics [note]`                      |
| “通过 Codex 运行时使用我的 ChatGPT/Codex 订阅”        | `openai/*` 加上 `agentRuntime.id: "codex"`       |
| “修复旧的 `openai-codex/*` 配置/会话固定项”           | `openclaw doctor --fix`                          |
| “通过 ACP/acpx 运行 Codex”                            | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor”     | ACP/acpx，而不是 `/codex`，也不是原生子智能体    |

只有当 ACP 已启用、可分派且由已加载的运行时后端支持时，OpenClaw 才会向智能体公布 ACP 生成指导。
如果 ACP 不可用，系统提示和插件 Skills 不应教智能体关于 ACP 路由的内容。

## 仅 Codex 部署

当你需要证明每个嵌入式智能体轮次都使用 Codex 时，请强制使用 Codex harness。
显式插件运行时会以关闭失败结束，绝不会静默地通过 PI 重试：

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

强制使用 Codex 时，如果 Codex 插件被禁用、app-server 过旧或 app-server 无法启动，OpenClaw 会提前失败。

## 按智能体使用 Codex

你可以让一个智能体仅使用 Codex，同时让默认智能体保持正常自动选择：

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

使用普通会话命令来切换智能体和模型。`/new` 会创建一个新的
OpenClaw 会话，Codex harness 会按需创建或恢复其 sidecar app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮再次从当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果发现失败或超时，它会使用以下内置回退目录：

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

当你希望启动时避免探测 Codex 并坚持使用回退目录时，请禁用发现：

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

默认情况下，插件会使用以下命令在本地启动 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

受管理的二进制文件随 `codex` 插件包一起发布。这会让
app-server 版本绑定到内置插件，而不是绑定到本地碰巧安装的某个单独
Codex CLI。只有在你有意运行不同可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。这是用于自主 Heartbeat 的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，
不会停在无人能响应的原生批准提示上。

要选择使用由 Codex guardian 审核的批准，请设置 `appServer.mode:
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

Guardian 模式使用 Codex 的原生自动审核批准路径。当 Codex 请求离开沙箱、
写入工作区之外，或添加网络访问等权限时，Codex 会将该批准请求路由给原生审核方，而不是人类提示。
审核方会应用 Codex 的风险框架，并批准或拒绝具体请求。当你希望获得比 YOLO 模式更多的防护栏，
但仍需要无人值守的智能体继续推进时，请使用 Guardian。

`guardian` 预设会扩展为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
单独的策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选择混用。较旧的 `guardian_subagent` reviewer 值
仍会作为兼容性别名被接受，但新配置应使用
`auto_review`。

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

Stdio app-server 启动默认继承 OpenClaw 的进程环境，
但 OpenClaw 拥有 Codex app-server 账户桥接，并将 `CODEX_HOME` 和 `HOME`
都设置为该智能体 OpenClaw 状态下的按智能体目录。Codex 自身的 Skills 加载器会读取
`$CODEX_HOME/skills` 和 `$HOME/.agents/skills`，因此本地 app-server 启动的这两个值都是隔离的。
这会让 Codex 原生 Skills、插件、配置、账户和线程状态限定在 OpenClaw 智能体范围内，
而不是从操作员的个人 Codex CLI 主目录泄漏进来。

OpenClaw 插件和 OpenClaw Skills 快照仍然通过 OpenClaw 自己的插件注册表和 Skills 加载器流转。
个人 Codex CLI 资产不会。如果你有有用的 Codex CLI Skills 或插件应该成为某个 OpenClaw 智能体的一部分，
请显式盘点它们：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 迁移提供商会将 Skills 复制到当前 OpenClaw 智能体工作区。Codex 原生插件、钩子和配置文件会被报告或归档以供手动审核，
而不会自动激活，因为它们可能执行命令、暴露 MCP 服务器或携带凭据。

凭证按以下顺序选择：

1. 该智能体的显式 OpenClaw Codex 凭证配置档案。
2. 该智能体 Codex 主目录中 app-server 的现有账户。
3. 仅对于本地 stdio app-server 启动，当不存在 app-server 账户且仍需要 OpenAI 凭证时，使用 `CODEX_API_KEY`，然后使用
   `OPENAI_API_KEY`。

当 OpenClaw 发现 ChatGPT 订阅式 Codex 认证配置文件时，它会从派生的 Codex 子进程中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。这样可以让 Gateway 网关级 API 密钥继续用于嵌入或直接 OpenAI 模型，同时避免原生 Codex app-server 轮次意外通过 API 计费。显式 Codex API 密钥配置文件和本地 stdio 环境变量密钥回退会使用 app-server 登录，而不是继承的子进程环境变量。WebSocket app-server 连接不会接收 Gateway 网关环境变量 API 密钥回退；请使用显式认证配置文件，或使用远程 app-server 自己的账号。

如果部署需要额外的环境隔离，请将这些变量添加到
`appServer.clearEnv`：

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

`appServer.clearEnv` 只影响派生的 Codex app-server 子进程。

Codex 动态工具默认使用 `native-first` 配置。在该模式下，OpenClaw 不会暴露与 Codex 原生工作区操作重复的动态工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。OpenClaw 集成工具（例如消息、会话、媒体、cron、浏览器、节点、gateway、`heartbeat_respond` 和 `web_search`）仍然可用。

支持的顶层 Codex 插件字段：

| 字段                       | 默认值           | 含义                                                                                         |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | 使用 `"openclaw-compat"` 向 Codex app-server 暴露完整的 OpenClaw 动态工具集。               |
| `codexDynamicToolsExclude` | `[]`             | 要从 Codex app-server 轮次中省略的额外 OpenClaw 动态工具名称。                              |

支持的 `appServer` 字段：

| 字段                | 默认值                                   | 含义                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 会派生 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                                                               |
| `command`           | 托管的 Codex 二进制文件                  | stdio 传输的可执行文件。保持未设置以使用托管二进制文件；仅在需要显式覆盖时设置。                                                                                                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 传输的参数。                                                                                                                                                                                                                   |
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                                                                                                                                           |
| `authToken`         | 未设置                                   | WebSocket 传输的 Bearer token。                                                                                                                                                                                                      |
| `headers`           | `{}`                                     | 额外的 WebSocket headers。                                                                                                                                                                                                           |
| `clearEnv`          | `[]`                                     | OpenClaw 构建继承环境后，从派生的 stdio app-server 进程中移除的额外环境变量名称。`CODEX_HOME` 和 `HOME` 由 OpenClaw 保留，用于本地启动时按智能体隔离 Codex。          |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                                                                                                                                                  |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 审核执行的预设。                                                                                                                                                                                                    |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。                                                                                                                                                                                      |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                                                                                                                                          |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审核原生审批提示。`guardian_subagent` 仍是旧版别名。                                                                                                                                                   |
| `serviceTier`       | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                                                                                                                                               |

OpenClaw 拥有的动态工具调用会独立于 `appServer.requestTimeoutMs` 进行限制：每个 Codex `item/tool/call` 请求都必须在 30 秒内收到 OpenClaw 响应。超时时，OpenClaw 会在支持的情况下中止工具信号，并向 Codex 返回失败的动态工具响应，让该轮次可以继续，而不是让会话停留在 `processing`。

OpenClaw 响应 Codex 轮次范围内的 app-server 请求后，harness 还会期望 Codex 使用 `turn/completed` 完成原生轮次。如果 app-server 在该响应后静默 60 秒，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw 会话通道，这样后续聊天消息就不会排在过期原生轮次后面。

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，建议使用配置，因为它会把插件行为保留在与其余 Codex harness 设置相同的已审核文件中。

## 计算机使用

计算机使用在自己的设置指南中说明：
[Codex 计算机使用](/zh-CN/plugins/codex-computer-use)。

简而言之：OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作。它会准备 Codex app-server，验证 `computer-use` MCP 服务器可用，然后让 Codex 在 Codex 模式轮次期间处理原生 MCP 工具调用。

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

可以从命令界面检查或安装该设置：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

计算机使用仅适用于 macOS，并且可能需要本地操作系统权限，Codex MCP 服务器才能控制应用。如果 `computerUse.enabled` 为 true 且 MCP 服务器不可用，Codex 模式轮次会在线程开始前失败，而不是在没有原生计算机使用工具的情况下静默运行。请参阅 [Codex 计算机使用](/zh-CN/plugins/codex-computer-use)，了解 marketplace 选择、远程目录限制、状态原因和故障排除。

当 `computerUse.autoInstall` 为 true 时，如果 Codex 尚未发现本地 marketplace，OpenClaw 可以从 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 注册标准内置 Codex Desktop marketplace。更改运行时或计算机使用配置后，请使用 `/new` 或 `/reset`，这样现有会话就不会保留旧的 Pi 或 Codex 线程绑定。

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

经过 guardian 审核的 Codex 审批：

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

模型切换仍由 OpenClaw 控制。当 OpenClaw 会话附加到现有 Codex 线程时，下一个轮次会再次向 app-server 发送当前选择的 OpenAI 模型、提供商、审批策略、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但要求 Codex 使用新选择的模型继续。

## Codex 命令

内置插件会将 `/codex` 注册为已授权的斜杠命令。它是通用的，并且可用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 要求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生 review。
- `/codex diagnostics [note]` 会在发送已附加线程的 Codex 诊断反馈前请求确认。
- `/codex computer-use status` 检查已配置的 Computer Use 插件和 MCP 服务器。
- `/codex computer-use install` 安装已配置的 Computer Use 插件并重新加载 MCP 服务器。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

当 Codex 报告用量限制失败时，如果 Codex 提供了下一个
app-server 重置时间，OpenClaw 会将其包含在内。在同一个
对话中使用 `/codex account` 来检查当前账户和速率限制窗口。

### 常见调试工作流

当由 Codex 支持的智能体在 Telegram、Discord、Slack、
或其他渠道中出现意外行为时，请从问题发生的对话开始：

1. 运行 `/diagnostics bad tool choice after image upload` 或另一条简短备注，
   描述你看到的情况。
2. 批准一次诊断请求。该批准会创建本地 Gateway 网关
   诊断 zip，并且由于该会话正在使用 Codex harness，也会
   将相关的 Codex 反馈包发送到 OpenAI 服务器。
3. 将完成的诊断回复复制到 bug 报告或支持线程中。
   它包含本地包路径、隐私摘要、OpenClaw 会话 ID、
   Codex 线程 ID，以及每个 Codex 线程的一行 `Inspect locally`。
4. 如果你想自己调试这次运行，请在终端中运行打印出的 `Inspect locally`
   命令。它看起来像 `codex resume <thread-id>`，并会打开
   原生 Codex 线程，这样你就可以检查对话、在本地继续它，
   或询问 Codex 为什么选择了某个特定工具或计划。

仅当你明确想要为当前已附加线程上传 Codex
反馈、但不需要完整 OpenClaw
Gateway 网关诊断包时，才使用 `/codex diagnostics [note]`。对于大多数支持报告，`/diagnostics [note]` 是
更好的起点，因为它会在一个回复中把本地 Gateway 网关状态和 Codex
线程 ID 关联起来。完整的隐私模型和群聊行为请参阅 [诊断导出](/zh-CN/gateway/diagnostics)。

核心 OpenClaw 还将仅限所有者使用的 `/diagnostics [note]` 作为通用
Gateway 网关诊断命令公开。它的批准提示会显示敏感数据
说明，链接到 [诊断导出](/zh-CN/gateway/diagnostics)，并且每次都会通过显式执行批准
请求 `openclaw gateway diagnostics export --json`。不要使用 allow-all 规则批准诊断。批准后，
OpenClaw 会发送一份可粘贴的报告，其中包含本地包路径和清单
摘要。当活动 OpenClaw 会话正在使用 Codex harness 时，同一次
批准也会授权将相关的 Codex 反馈包发送到
OpenAI 服务器。批准提示会说明 Codex 反馈将被发送，但
在批准前不会列出 Codex 会话或线程 ID。

如果所有者在群聊中调用 `/diagnostics`，OpenClaw 会保持
共享渠道简洁：群组只会收到一条简短通知，而
诊断说明、批准提示以及 Codex 会话/线程 ID 会通过
私有批准路径发送给所有者。如果没有私有所有者路径，
OpenClaw 会拒绝该群组请求，并要求所有者从私信中运行它。

已批准的 Codex 上传会调用 Codex app-server `feedback/upload`，并要求
app-server 在可用时包含每个列出线程及派生 Codex 子线程的日志。
上传会通过 Codex 的常规反馈路径发送到 OpenAI
服务器；如果该 app-server 中禁用了 Codex 反馈，该命令会返回
app-server 错误。完成的诊断回复会列出渠道、
OpenClaw 会话 ID、Codex 线程 ID，以及用于已发送线程的本地 `codex resume <thread-id>`
命令。如果你拒绝或忽略批准，
OpenClaw 不会打印这些 Codex ID。此上传不会替代本地
Gateway 网关诊断导出。

`/codex resume` 会写入与 harness 用于正常轮次相同的 sidecar 绑定文件。
在下一条消息中，OpenClaw 会恢复该 Codex 线程，将
当前选择的 OpenClaw 模型传入 app-server，并保持扩展历史记录
启用。

### 从 CLI 检查 Codex 线程

理解一次异常 Codex 运行的最快方式，通常是直接打开原生 Codex
线程：

```sh
codex resume <thread-id>
```

当你在渠道对话中注意到 bug，并想检查有问题的
Codex 会话、在本地继续它，或询问 Codex 为什么做出
某个特定工具或推理选择时，请使用此命令。最简单的路径通常是先运行
`/diagnostics [note]`：你批准后，完成的报告会列出
每个 Codex 线程，并打印一个 `Inspect locally` 命令，例如
`codex resume <thread-id>`。你可以直接将该命令复制到终端。

你也可以通过当前聊天的 `/codex binding` 或最近 Codex app-server 线程的
`/codex threads [filter]` 获取线程 ID，然后在 shell 中运行同一个
`codex resume` 命令。

该命令接口要求 Codex app-server `0.125.0` 或更高版本。如果
未来或自定义 app-server 未公开对应的 JSON-RPC 方法，单个
控制方法会报告为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | PI 和 Codex harness 之间的产品/插件兼容性。                         |
| Codex app-server 插件中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐轮适配器行为。                            |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。                |

OpenClaw 不使用项目或全局 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，
OpenClaw 会为每个线程注入 Codex 配置，用于 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop`。其他 Codex 钩子，例如 `SessionStart` 和
`UserPromptSubmit`，仍然是 Codex 级别的控制；在 v1 合约中，它们不会作为
OpenClaw 插件钩子公开。

对于 OpenClaw 动态工具，OpenClaw 会在 Codex 请求
调用后执行该工具，因此 OpenClaw 会在
harness 适配器中触发其拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范工具记录。
OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子
回调公开该操作，否则它无法重写原生 Codex
线程。

压缩和 LLM 生命周期投影来自 Codex app-server
通知和 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是适配器级别的观察结果，不是 Codex
内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会
投影为 `codex_app_server.hook` 智能体事件，用于轨迹和调试。
它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是在底层换了一个模型调用的 PI。Codex 拥有更多
原生模型循环，OpenClaw 围绕该边界适配它的插件和会话接口。

Codex 运行时 v1 支持：

| 接口                                          | 支持情况                                | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环                 | 支持                                    | Codex app-server 拥有 OpenAI 轮次、原生线程恢复和原生工具继续执行。                                                                                                                                   |
| OpenClaw 渠道路由和交付                       | 支持                                    | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道保持在模型运行时之外。                                                                                                                        |
| OpenClaw 动态工具                             | 支持                                    | Codex 请求 OpenClaw 执行这些工具，因此 OpenClaw 保持在执行路径中。                                                                                                                                     |
| 提示词和上下文插件                            | 支持                                    | OpenClaw 会构建提示词叠加层，并在启动或恢复线程前将上下文投影到 Codex 轮次中。                                                                                                                        |
| 上下文引擎生命周期                            | 支持                                    | Codex 轮次会运行组装、摄取或轮次后维护，以及上下文引擎压缩协调。                                                                                                                                      |
| 动态工具钩子                                  | 支持                                    | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕 OpenClaw 拥有的动态工具运行。                                                                                                             |
| 生命周期钩子                                  | 作为适配器观察结果支持                  | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式载荷触发。                                                                                       |
| 最终答案修订门控                              | 通过原生钩子中继支持                    | Codex `Stop` 会中继到 `before_agent_finalize`；`revise` 会要求 Codex 在最终化前再进行一次模型传递。                                                                                                    |
| 原生 shell、patch 和 MCP 阻止或观察           | 通过原生钩子中继支持                    | Codex `PreToolUse` 和 `PostToolUse` 会针对已提交的原生工具接口中继，包括 Codex app-server `0.125.0` 或更高版本上的 MCP 载荷。支持阻止；不支持参数重写。                                              |
| 原生权限策略                                  | 通过原生钩子中继支持                    | 当运行时公开它时，Codex `PermissionRequest` 可以通过 OpenClaw 策略路由。如果 OpenClaw 不返回决策，Codex 会继续走其常规 guardian 或用户批准路径。                                                     |
| App-server 轨迹捕获                           | 支持                                    | OpenClaw 会记录它发送给 app-server 的请求以及它收到的 app-server 通知。                                                                                                                               |

Codex 运行时 v1 不支持：

| 接口面                                             | V1 边界                                                                                                                                     | 未来路径                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                       | Codex 原生工具执行前钩子可以阻止操作，但 OpenClaw 不会重写 Codex 原生工具参数。                                               | 需要 Codex 钩子/架构支持替换工具输入。                            |
| 可编辑的 Codex 原生转录历史            | Codex 拥有规范的原生线程历史。OpenClaw 拥有镜像并可以投射未来上下文，但不应修改不受支持的内部结构。 | 如果需要对原生线程进行精细修改，请添加明确的 Codex app-server API。                    |
| Codex 原生工具记录的 `tool_result_persist` | 该钩子转换 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。                                                           | 可以镜像转换后的记录，但规范重写需要 Codex 支持。              |
| 丰富的原生压缩元数据                     | OpenClaw 会观察压缩的开始和完成，但不会收到稳定的保留/丢弃列表、token 增量或摘要载荷。            | 需要更丰富的 Codex 压缩事件。                                                     |
| 压缩干预                             | 当前 OpenClaw 压缩钩子在 Codex 模式下处于通知级别。                                                                         | 如果插件需要否决或重写原生压缩，请添加 Codex 压缩前/后钩子。 |
| 逐字节模型 API 请求捕获             | OpenClaw 可以捕获 app-server 请求和通知，但 Codex core 会在内部构建最终的 OpenAI API 请求。                      | 需要 Codex 模型请求跟踪事件或调试 API。                                   |

## 工具、媒体和压缩

Codex harness 只更改底层嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、批准和消息工具输出会继续通过常规 OpenClaw 投递路径。

原生钩子中继有意保持通用，但 v1 支持契约仅限于 OpenClaw 测试过的 Codex 原生工具和权限路径。在 Codex 运行时中，这包括 shell、patch 和 MCP `PreToolUse`、`PostToolUse` 以及 `PermissionRequest` 载荷。在运行时契约明确命名之前，不要假设每个未来的 Codex 钩子事件都是 OpenClaw 插件接口面。

对于 `PermissionRequest`，OpenClaw 只在策略作出决定时返回明确的允许或拒绝决定。没有决定的结果并不代表允许。Codex 会将其视为没有钩子决定，并继续进入自己的守护程序或用户批准路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具批准请求会通过 OpenClaw 的插件批准流程路由。Codex `request_user_input` 提示会被发送回原始聊天，下一条排队的后续消息会回答该原生服务器请求，而不是作为额外上下文被 Steer。其他 MCP 请求仍然会失败关闭。

活跃运行队列 Steering 映射到 Codex app-server `turn/steer`。使用默认 `messages.queue.mode: "steer"` 时，OpenClaw 会在配置的静默窗口内批处理排队的聊天消息，并按到达顺序将它们作为一个 `turn/steer` 请求发送。旧版 `queue` 模式会发送单独的 `turn/steer` 请求。Codex review 和手动压缩轮次可能会拒绝同轮 Steering，在这种情况下，当所选模式允许回退时，OpenClaw 会使用后续队列。请参阅 [Steering queue](/zh-CN/concepts/queue-steering)。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换。该镜像包含用户提示、最终助手文本，以及 app-server 发出时的轻量 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未公开人类可读的压缩摘要，也没有可审计的列表说明 Codex 在压缩后保留了哪些条目。

由于 Codex 拥有规范原生线程，`tool_result_persist` 目前不会重写 Codex 原生工具结果记录。它只在 OpenClaw 写入 OpenClaw 拥有的会话转录工具结果时适用。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解会继续使用匹配的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 不会作为普通 `/model` 提供商出现：**对于新配置，这是预期行为。选择一个带有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：**当没有 Codex harness 声明该运行时，`agentRuntime.id: "auto"` 仍可能使用 PI 作为兼容后端。测试时将 `agentRuntime.id: "codex"` 设置为强制选择 Codex。强制 Codex 运行时会失败，而不是回退到 PI。一旦选择 Codex app-server，其失败会直接显现。

**app-server 被拒绝：**升级 Codex，使 app-server 握手报告版本 `0.125.0` 或更新版本。同版本预发布版或带构建后缀的版本（例如 `0.125.0-alpha.2` 或 `0.125.0+custom`）会被拒绝，因为 OpenClaw 测试的是稳定版 `0.125.0` 协议下限。

**模型发现很慢：**降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。

**WebSocket 传输立即失败：**检查 `appServer.url`、`authToken`，并确认远程 app-server 使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用 PI：**除非你为该智能体强制设置了 `agentRuntime.id: "codex"` 或选择了旧版 `codex/*` 引用，否则这是预期行为。普通 `openai/gpt-*` 和其他提供商引用在 `auto` 模式下仍会走其常规提供商路径。如果你强制设置 `agentRuntime.id: "codex"`，该智能体的每个嵌入式轮次都必须是 Codex 支持的 OpenAI 模型。

**Computer Use 已安装但工具不运行：**从新会话运行 `/codex computer-use status`。如果某个工具报告 `Native hook relay unavailable`，请使用 `/new` 或 `/reset`；如果仍然存在，请重启 Gateway 网关以清除过期的原生钩子注册。如果 `computer-use.list_apps` 超时，请重启 Codex Computer Use 或 Codex Desktop 后重试。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [插件钩子](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
