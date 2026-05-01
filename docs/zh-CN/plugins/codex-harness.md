---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅 Codex 部署失败，而不是回退到 Pi
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-05-01T18:34:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: f45f493b224eee3425b48abe7be0803f2b5038c3a131cc6fc69fd75aae3a8be1
    source_path: plugins/codex-harness.md
    workflow: 16
---

内置的 `codex` 插件让 OpenClaw 可以通过 Codex app-server 运行嵌入式智能体轮次，而不是使用内置的 PI harness。

当你希望 Codex 接管底层智能体会话时使用它：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体投递，以及可见的转录镜像。

当源聊天轮次通过 Codex harness 运行时，如果部署未显式配置 `messages.visibleReplies`，可见回复默认使用 OpenClaw `message` 工具。智能体仍然可以私下完成它的 Codex 轮次；只有在调用 `message(action="send")` 时才会发布到渠道。将 `messages.visibleReplies: "automatic"` 设为保留直接聊天最终回复的旧版自动投递路径。

Codex heartbeat 轮次默认也会获得 `heartbeat_respond` 工具，因此智能体可以记录这次唤醒应保持静默还是发出通知，而不必把这种控制流编码到最终文本里。

如果你正在尝试建立整体认识，请从
[Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。简短版本是：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍然是通信界面。

## 快速配置

要为 GPT 智能体轮次使用 Codex harness，请保持模型引用的规范形式为
`openai/gpt-*`，启用内置的 `codex` 插件，并设置
`agentRuntime.id: "codex"`：

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
        fallback: "none",
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

不要为此路径使用 `openai-codex/gpt-*`。除非你单独强制指定运行时，否则那会通过常规 PI runner 选择 Codex OAuth。配置变更会应用于新的或重置后的会话；现有会话会保留它们已记录的运行时。

## 此插件会改变什么

内置的 `codex` 插件提供了几项独立能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式运行时                  | `agentRuntime.id: "codex"`                          | 通过 Codex app-server 运行 OpenClaw 嵌入式智能体轮次。                        |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 从消息对话中绑定并控制 Codex app-server 线程。                                |
| Codex app-server 提供商/目录      | `codex` 内部机制，通过 harness 暴露                 | 让运行时发现并验证 app-server 模型。                                          |
| Codex 媒体理解路径                | `codex/*` 图像模型兼容路径                          | 为受支持的图像理解模型运行有边界的 Codex app-server 轮次。                    |
| 原生钩子中继                      | 围绕 Codex 原生事件的插件钩子                       | 让 OpenClaw 观察/阻止受支持的 Codex 原生工具/最终化事件。                     |

启用插件会让这些能力可用。它**不会**：

- 开始对每个 OpenAI 模型使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 让 ACP/acpx 成为默认 Codex 路径
- 热切换已经记录 PI 运行时的现有会话
- 替换 OpenClaw 渠道投递、会话文件、auth-profile 存储或消息路由

同一个插件还负责原生 `/codex` 聊天控制命令界面。如果插件已启用，且用户要求从聊天中绑定、恢复、引导、停止或检查 Codex 线程，智能体应优先使用 `/codex ...` 而不是 ACP。当用户要求 ACP/acpx 或正在测试 ACP Codex 适配器时，ACP 仍然是显式回退选项。

原生 Codex 轮次保留 OpenClaw 插件钩子作为公开兼容层。这些是进程内 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`，用于镜像转录记录
- 通过 Codex `Stop` 中继的 `before_agent_finalize`
- `agent_end`

插件还可以注册运行时中立的工具结果中间件，用于在 OpenClaw 执行工具之后、结果返回给 Codex 之前改写 OpenClaw 动态工具结果。这与公开的
`tool_result_persist` 插件钩子是分开的，后者会转换 OpenClaw 所有的转录工具结果写入。

关于插件钩子语义本身，请参阅[插件钩子](/zh-CN/plugins/hooks)
和[插件防护行为](/zh-CN/tools/plugin)。

默认情况下，harness 处于关闭状态。新配置应保持 OpenAI 模型引用的规范形式为
`openai/gpt-*`，并在需要原生 app-server 执行时显式强制设置
`agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用仍会为兼容性自动选择 harness，但由运行时支持的旧版提供商前缀不会显示为常规模型/提供商选项。

如果 `codex` 插件已启用，但主模型仍是
`openai-codex/*`，`openclaw doctor` 会发出警告，而不是更改路由。这是有意设计：`openai-codex/*` 仍然是 PI Codex OAuth/订阅路径，而原生 app-server 执行仍然是一个显式运行时选择。

## 路由映射

更改配置前请使用此表：

| 期望行为                                    | 模型引用                   | 运行时配置                             | 插件要求                    | 预期 Status 标签              |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通过常规 OpenClaw runner 使用 OpenAI API    | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI provider             | `Runtime: OpenClaw Pi Default` |
| 通过 PI 使用 Codex OAuth/订阅               | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 嵌入式轮次            | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` 插件                | `Runtime: OpenAI Codex`        |
| 使用保守自动模式的混合提供商                | 提供商特定引用             | `agentRuntime.id: "auto"`              | 可选插件运行时              | 取决于所选运行时               |
| 显式 Codex ACP 适配器会话                   | 取决于 ACP 提示/模型       | 带 `runtime: "acp"` 的 `sessions_spawn` | 健康的 `acpx` 后端          | ACP 任务/会话 Status           |

关键区别是提供商与运行时：

- `openai-codex/*` 回答“PI 应使用哪条提供商/凭证路由？”
- `agentRuntime.id: "codex"` 回答“哪个循环应执行这个嵌入式轮次？”
- `/codex ...` 回答“这个聊天应绑定或控制哪个原生 Codex 对话？”
- ACP 回答“acpx 应启动哪个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 系列路由按前缀区分。当你希望通过 PI 使用 Codex OAuth 时，使用 `openai-codex/*`；当你希望直接访问 OpenAI API，或正在强制使用原生 Codex app-server harness 时，使用 `openai/*`：

| 模型引用                                      | 运行时路径                                  | 适用场景                                                                  |
| --------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 通过 OpenClaw/PI 管道使用 OpenAI provider   | 你希望使用 `OPENAI_API_KEY` 访问当前直接的 OpenAI Platform API。          |
| `openai-codex/gpt-5.5`                        | 通过 OpenClaw/PI 使用 OpenAI Codex OAuth    | 你希望使用默认 PI runner 的 ChatGPT/Codex 订阅凭证。                      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                    | 你希望为嵌入式智能体轮次使用原生 Codex app-server 执行。                  |

GPT-5.5 目前在 OpenClaw 中仅支持订阅/OAuth。为 PI OAuth 使用
`openai-codex/gpt-5.5`，或将 `openai/gpt-5.5` 与 Codex app-server harness 配合使用。一旦 OpenAI 在公共 API 上启用 GPT-5.5，即支持对 `openai/gpt-5.5` 的直接 API key 访问。

旧版 `codex/gpt-*` 引用仍作为兼容别名接受。Doctor 兼容性迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略；而仅作为回退的旧版引用保持不变，因为运行时是为整个智能体容器配置的。新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生 app-server harness 配置应使用 `openai/gpt-*` 加
`agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前缀划分。当图像理解应通过 OpenAI Codex OAuth provider 路径运行时，使用
`openai-codex/gpt-*`。当图像理解应通过有边界的 Codex app-server 轮次运行时，使用 `codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 确认当前会话的有效 harness。如果选择结果令人意外，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

### Doctor 警告的含义

当以下条件全部为真时，`openclaw doctor` 会发出警告：

- 内置 `codex` 插件已启用或允许
- 某个智能体的主模型是 `openai-codex/*`
- 该智能体的有效运行时不是 `codex`

该警告存在的原因是用户经常预期“Codex 插件已启用”就意味着“原生 Codex app-server 运行时”。OpenClaw 不会做这个跳跃。该警告表示：

- 如果你本来就打算通过 PI 使用 ChatGPT/Codex OAuth，**无需更改**。
- 如果你打算使用原生 app-server 执行，请将模型改为 `openai/<model>` 并设置
  `agentRuntime.id: "codex"`。
- 运行时变更后，现有会话仍然需要 `/new` 或 `/reset`，
  因为会话运行时 pin 是粘性的。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，OpenClaw 会在该会话上记录所选 harness id，并在同一会话 id 后续轮次中继续使用它。当你希望未来会话使用另一个 harness 时，请更改 `agentRuntime` 配置或
`OPENCLAW_AGENT_RUNTIME`；在 PI 与 Codex 之间切换现有对话之前，使用 `/new` 或 `/reset` 启动一个新会话。这样可以避免通过两个不兼容的原生会话系统重放同一份转录。

在 harness pin 出现之前创建的旧版会话，一旦已有转录历史，就会被视为已 pin 到 PI。更改配置后，使用 `/new` 或 `/reset` 将该对话选择进入 Codex。

`/status` 会显示有效模型运行时。默认 PI harness 显示为
`Runtime: OpenClaw Pi Default`，Codex app-server harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw 已提供内置 `codex` 插件。
- Codex app-server `0.125.0` 或更新版本。默认情况下，内置插件会管理兼容的 Codex app-server 二进制文件，因此 `PATH` 上的本地 `codex` 命令不会影响常规 harness 启动。
- app-server 进程或 OpenClaw 的 Codex 凭证桥接需要可用的 Codex 凭证。本地 app-server 启动会为每个智能体使用一个由 OpenClaw 管理的 Codex home，并使用隔离的子进程 `HOME`，因此默认不会读取你的个人 `~/.codex` 账户、Skills、插件、配置、线程状态，或原生 `$HOME/.agents/skills`。

插件会阻止较旧或未带版本号的 app-server 握手。这样可以让 OpenClaw 保持在已经测试过的协议表面上。

对于实时和 Docker 冒烟测试，凭证通常来自 Codex CLI 账户或 OpenClaw `openai-codex` 凭证配置。本地 stdio app-server 启动在没有账户时，也可以回退到 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 将 Codex 与其他模型一起添加

如果同一个智能体应该能在 Codex 与非 Codex 提供商模型之间自由切换，请不要全局设置 `agentRuntime.id: "codex"`。强制运行时会应用到该智能体或会话的每个嵌入式轮次。如果你在强制该运行时时选择 Anthropic 模型，OpenClaw 仍会尝试使用 Codex harness 并以关闭方式失败，而不是静默地通过 PI 路由该轮次。

请改用以下结构之一：

- 将 Codex 放在设置了 `agentRuntime.id: "codex"` 的专用智能体上。
- 将默认智能体保持为 `agentRuntime.id: "auto"`，并为普通混合提供商使用保留 PI 回退。
- 仅为兼容性使用旧版 `codex/*` 引用。新配置应优先使用 `openai/*`，并显式设置 Codex 运行时策略。

例如，下面的配置让默认智能体保持常规自动选择，并添加一个单独的 Codex 智能体：

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
        fallback: "pi",
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

使用这种结构时：

- 默认 `main` 智能体使用常规提供商路径和 PI 兼容性回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或不受支持，该轮次会失败，而不是悄悄使用 PI。

## 智能体命令路由

智能体应按意图路由用户请求，而不是仅凭 “Codex” 这个词：

| 用户请求...                                             | 智能体应使用...                                   |
| -------------------------------------------------------- | ------------------------------------------------ |
| “将此聊天绑定到 Codex”                                  | `/codex bind`                                    |
| “在这里恢复 Codex 线程 `<id>`”                          | `/codex resume <id>`                             |
| “显示 Codex 线程”                                       | `/codex threads`                                 |
| “为一次异常的 Codex 运行提交支持报告”                   | `/diagnostics [note]`                            |
| “仅为这个附加线程发送 Codex 反馈”                       | `/codex diagnostics [note]`                      |
| “将 Codex 用作此智能体的运行时”                         | 将配置改为 `agentRuntime.id`                     |
| “在常规 OpenClaw 中使用我的 ChatGPT/Codex 订阅”          | `openai-codex/*` 模型引用                        |
| “通过 ACP/acpx 运行 Codex”                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor”       | ACP/acpx，而不是 `/codex`，也不是原生子智能体    |

只有在 ACP 已启用、可调度，并且由已加载的运行时后端支持时，OpenClaw 才会向智能体公布 ACP spawn 指引。如果 ACP 不可用，系统提示和插件 Skills 不应教智能体 ACP 路由。

## 仅 Codex 部署

当你需要证明每个嵌入式智能体轮次都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认没有 PI 回退，因此 `fallback: "none"` 是可选的，但通常适合作为文档说明：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

环境变量覆盖：

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

强制使用 Codex 时，如果 Codex 插件被禁用、app-server 版本过旧，或 app-server 无法启动，OpenClaw 会提前失败。仅当你明确希望 PI 处理缺失的 harness 选择时，才设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体配置 Codex

你可以让一个智能体仅使用 Codex，同时默认智能体保持常规自动选择：

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

使用常规会话命令来切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，Codex harness 会按需创建或恢复其 sidecar app-server 线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮再次从当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果设备发现失败或超时，它会使用以下模型的内置回退目录：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

你可以在 `plugins.entries.codex.config.discovery` 下调整设备发现：

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

当你希望启动时避免探测 Codex 并坚持使用回退目录时，可以禁用设备发现：

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

默认情况下，插件会用以下命令在本地启动 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

受管二进制文件被声明为内置插件运行时依赖，并与其余 `codex` 插件依赖一起暂存。这样可以让 app-server 版本绑定到内置插件，而不是绑定到本地碰巧安装的任何单独 Codex CLI。只有当你明确想运行不同的可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和 `sandbox: "danger-full-access"`。这是用于自主 Heartbeat 的受信本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停在无人响应的原生批准提示上。

若要选择使用由 Codex guardian 审核的批准，请设置 `appServer.mode: "guardian"`：

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

Guardian 模式使用 Codex 的原生自动审核批准路径。当 Codex 请求离开沙箱、写入工作区之外，或添加网络访问等权限时，Codex 会将该批准请求路由给原生审核器，而不是人工提示。审核器会应用 Codex 的风险框架，并批准或拒绝该具体请求。当你想要比 YOLO 模式更多的防护，但仍需要无人值守的智能体继续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。单独的策略字段仍会覆盖 `mode`，因此高级部署可以混合使用预设和显式选择。较旧的 `guardian_subagent` 审核器值仍作为兼容别名被接受，但新配置应使用 `auto_review`。

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

默认情况下，Stdio app-server 启动会继承 OpenClaw 的进程环境，但 OpenClaw 拥有 Codex app-server 账户桥接，并将 `CODEX_HOME` 和 `HOME` 都设置为该智能体 OpenClaw 状态下的按智能体目录。Codex 自己的 Skill 加载器会读取 `$CODEX_HOME/skills` 和 `$HOME/.agents/skills`，因此本地 app-server 启动会隔离这两个值。这样可以将 Codex 原生 Skills、插件、配置、账户和线程状态限定到 OpenClaw 智能体，而不是从操作员的个人 Codex CLI home 泄漏进来。

OpenClaw 插件和 OpenClaw Skill 快照仍会通过 OpenClaw 自己的插件注册表和 Skill 加载器流转。个人 Codex CLI 资产不会。如果你有应成为 OpenClaw 智能体一部分的有用 Codex CLI Skills 或插件，请显式清点它们：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 迁移提供商会将 Skills 复制到当前 OpenClaw 智能体工作区。Codex 原生插件、钩子和配置文件会被报告或归档，以供人工审核，而不是自动启用，因为它们可能执行命令、暴露 MCP 服务器，或携带凭据。

凭证按以下顺序选择：

1. 该智能体的显式 OpenClaw Codex 凭证配置。
2. 该智能体 Codex home 中 app-server 的现有账户。
3. 仅限本地 stdio app-server 启动：当不存在 app-server 账户且仍需要 OpenAI 凭证时，先使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅式 Codex 凭证配置时，它会从生成的 Codex 子进程中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这样可以让 Gateway 网关级 API key 继续用于嵌入或直接 OpenAI 模型，而不会让原生 Codex app-server 轮次意外通过 API 计费。显式 Codex API key 配置和本地 stdio 环境变量密钥回退会使用 app-server 登录，而不是继承子进程环境。WebSocket app-server 连接不会接收 Gateway 网关环境 API key 回退；请使用显式凭证配置或远程 app-server 自己的账户。

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

Codex 动态工具默认使用 `native-first` 配置。在该模式下，OpenClaw 不会暴露与 Codex 原生工作区操作重复的动态工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。OpenClaw 集成工具（如消息、会话、媒体、cron、浏览器、节点、gateway、`heartbeat_respond` 和 `web_search`）仍可使用。

支持的顶层 Codex 插件字段：

| 字段                       | 默认值           | 含义                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | 使用 `"openclaw-compat"` 向 Codex app-server 暴露完整的 OpenClaw 动态工具集。 |
| `codexDynamicToolsExclude` | `[]`             | 要从 Codex app-server 回合中省略的其他 OpenClaw 动态工具名称。               |

支持的 `appServer` 字段：

| 字段                | 默认值                                   | 含义                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                                                             |
| `command`           | 托管的 Codex 二进制文件                     | stdio 传输协议的可执行文件。保持未设置以使用托管二进制文件；仅在需要显式覆盖时设置。                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 传输协议的参数。                                                                                                                                                                                                       |
| `url`               | 未设置                                    | WebSocket app-server URL。                                                                                                                                                                                                            |
| `authToken`         | 未设置                                    | WebSocket 传输协议的 Bearer token。                                                                                                                                                                                                |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | OpenClaw 构建其继承环境后，从生成的 stdio app-server 进程中移除的额外环境变量名称。`CODEX_HOME` 和 `HOME` 保留给 OpenClaw 在本地启动时使用的每智能体 Codex 隔离。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | YOLO 或经过 guardian 审核执行的预设。                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/回合的原生 Codex 批准策略。                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审核原生批准提示。`guardian_subagent` 仍是旧版别名。                                                                                                                         |
| `serviceTier`       | 未设置                                    | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                                                                                                                            |

OpenClaw 拥有的动态工具调用独立于
`appServer.requestTimeoutMs` 受限：每个 Codex `item/tool/call` 请求都必须在
30 秒内收到 OpenClaw 响应。超时时，OpenClaw 会在支持的位置中止工具
信号，并向 Codex 返回失败的动态工具响应，这样该回合可以继续，而不是让会话停留在 `processing`。

OpenClaw 响应 Codex 回合范围的 app-server 请求后，harness
还会期望 Codex 使用 `turn/completed` 完成原生回合。如果
app-server 在该响应后静默 60 秒，OpenClaw 会尽力
中断 Codex 回合、记录诊断超时，并释放
OpenClaw 会话通道，使后续聊天消息不会排在过期的
原生回合之后。

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，首选配置，
因为它会把插件行为与 Codex harness 设置的其余部分放在同一个已审核文件中。

## 计算机使用

计算机使用在自己的设置指南中介绍：
[Codex 计算机使用](/zh-CN/plugins/codex-computer-use)。

简短说明：OpenClaw 不会内置桌面控制应用，也不会自行执行
桌面操作。它会准备 Codex app-server，验证
`computer-use` MCP 服务器是否可用，然后让 Codex 在 Codex 模式回合期间处理原生
MCP 工具调用。

如需在 Codex marketplace 流程之外直接访问 TryCua 驱动，请用
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 注册
`cua-driver mcp`。请参阅 [Codex 计算机使用](/zh-CN/plugins/codex-computer-use)，了解
Codex 拥有的计算机使用和直接 MCP 注册之间的区别。

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
        fallback: "none",
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

计算机使用是 macOS 专用功能，并且可能需要本地操作系统权限，之后
Codex MCP 服务器才能控制应用。如果 `computerUse.enabled` 为 true 且 MCP
服务器不可用，Codex 模式回合会在线程启动前失败，而不是
在没有原生计算机使用工具的情况下静默运行。请参阅
[Codex 计算机使用](/zh-CN/plugins/codex-computer-use)，了解 marketplace 选择、
远程目录限制、状态原因和故障排除。

当 `computerUse.autoInstall` 为 true 时，如果 Codex
尚未发现本地 marketplace，OpenClaw 可以从
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 注册标准
内置 Codex Desktop marketplace。更改运行时或计算机使用配置后，请使用 `/new` 或 `/reset`，
以免现有会话保留旧的 PI 或 Codex 线程绑定。

## 常用配方

使用默认 stdio 传输协议的本地 Codex：

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

经过 guardian 审核的 Codex 批准：

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

带显式标头的远程 app-server：

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

模型切换仍由 OpenClaw 控制。当 OpenClaw 会话附加到
现有 Codex 线程时，下一个回合会再次向 app-server 发送当前选择的
OpenAI 模型、提供商、批准策略、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留
线程绑定，但要求 Codex 使用新选择的模型继续。

## Codex 命令

内置插件会将 `/codex` 注册为授权的斜杠命令。它是
通用命令，并适用于任何支持 OpenClaw 文本命令的渠道。

常用形式：

- `/codex status` 显示实时 app-server 连接、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 要求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审核。
- `/codex diagnostics [note]` 在发送已附加线程的 Codex 诊断反馈前请求确认。
- `/codex computer-use status` 检查已配置的计算机使用插件和 MCP 服务器。
- `/codex computer-use install` 安装已配置的计算机使用插件并重新加载 MCP 服务器。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

### 常用调试工作流

当 Codex 支持的智能体在 Telegram、Discord、Slack
或其他渠道中出现意外行为时，请从问题发生的对话开始：

1. 运行 `/diagnostics bad tool choice after image upload`，或另一条描述你所见情况的简短说明。
2. 批准一次诊断请求。批准后会创建本地 Gateway 网关诊断 zip；并且因为该会话使用 Codex harness，也会将相关的 Codex 反馈包发送到 OpenAI 服务器。
3. 将完成后的诊断回复复制到 bug 报告或支持讨论串中。它包含本地包路径、隐私摘要、OpenClaw 会话 ID、Codex 讨论串 ID，以及每个 Codex 讨论串对应的一行 `Inspect locally`。
4. 如果你想自行调试这次运行，请在终端中运行打印出的 `Inspect locally` 命令。它看起来像 `codex resume <thread-id>`，会打开原生 Codex 讨论串，这样你可以检查对话、在本地继续它，或询问 Codex 为什么选择了特定工具或计划。

仅当你明确希望为当前附加的讨论串上传 Codex 反馈、且不需要完整的 OpenClaw Gateway 网关诊断包时，才使用 `/codex diagnostics [note]`。对于大多数支持报告，`/diagnostics [note]` 是更好的起点，因为它会在同一条回复中把本地 Gateway 网关状态和 Codex 讨论串 ID 关联起来。完整的隐私模型和群聊行为请参阅 [诊断导出](/zh-CN/gateway/diagnostics)。

OpenClaw 核心还公开仅限所有者使用的 `/diagnostics [note]`，作为通用 Gateway 网关诊断命令。它的批准提示会显示敏感数据前言、链接到 [诊断导出](/zh-CN/gateway/diagnostics)，并且每次都通过显式执行批准请求 `openclaw gateway diagnostics export --json`。不要使用允许全部规则来批准诊断。批准后，OpenClaw 会发送一份可粘贴的报告，其中包含本地包路径和清单摘要。当当前 OpenClaw 会话使用 Codex harness 时，同一次批准还会授权将相关 Codex 反馈包发送到 OpenAI 服务器。批准提示会说明将发送 Codex 反馈，但不会在批准前列出 Codex 会话或讨论串 ID。

如果所有者在群聊中调用 `/diagnostics`，OpenClaw 会保持共享渠道整洁：群组只会收到一条简短通知，而诊断前言、批准提示以及 Codex 会话/讨论串 ID 会通过私有批准路径发送给所有者。如果没有私有所有者路径，OpenClaw 会拒绝群组请求，并要求所有者从私信中运行它。

已批准的 Codex 上传会调用 Codex app-server `feedback/upload`，并要求 app-server 在可用时包含每个列出讨论串及其派生 Codex 子讨论串的日志。上传会通过 Codex 的常规反馈路径发送到 OpenAI 服务器；如果该 app-server 中禁用了 Codex 反馈，该命令会返回 app-server 错误。完成后的诊断回复会列出已发送讨论串对应的渠道、OpenClaw 会话 ID、Codex 讨论串 ID，以及本地 `codex resume <thread-id>` 命令。如果你拒绝或忽略批准，OpenClaw 不会打印这些 Codex ID。此上传不会替代本地 Gateway 网关诊断导出。

`/codex resume` 会写入 harness 用于正常轮次的同一个 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 讨论串，将当前选定的 OpenClaw 模型传入 app-server，并保持扩展历史记录启用。

### 从 CLI 检查 Codex 讨论串

了解一次不良 Codex 运行的最快方式，通常是直接打开原生 Codex 讨论串：

```sh
codex resume <thread-id>
```

当你在渠道对话中发现 bug，并想检查有问题的 Codex 会话、在本地继续它，或询问 Codex 为什么做出某个工具或推理选择时，请使用此命令。最简单的路径通常是先运行 `/diagnostics [note]`：批准后，完成的报告会列出每个 Codex 讨论串，并打印一个 `Inspect locally` 命令，例如 `codex resume <thread-id>`。你可以将该命令直接复制到终端中。

你也可以通过当前聊天的 `/codex binding`，或最近 Codex app-server 讨论串的 `/codex threads [filter]` 获取讨论串 ID，然后在 shell 中运行同一个 `codex resume` 命令。

命令接口要求 Codex app-server `0.125.0` 或更新版本。如果未来版本或自定义 app-server 未公开相应 JSON-RPC 方法，单个控制方法会报告为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                    | OpenClaw                 | 产品/插件在 PI 和 Codex harness 之间的兼容性。                      |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的每轮适配器行为。                            |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。                |

OpenClaw 不使用项目或全局 Codex `hooks.json` 文件来路由 OpenClaw 插件行为。对于受支持的原生工具和权限桥接，OpenClaw 会为 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入按讨论串设置的 Codex 配置。其他 Codex 钩子，例如 `SessionStart` 和 `UserPromptSubmit`，仍然是 Codex 层级的控制；在 v1 合约中，它们不会作为 OpenClaw 插件钩子公开。

对于 OpenClaw 动态工具，OpenClaw 会在 Codex 请求调用后执行该工具，因此 OpenClaw 会在 harness 适配器中触发它所拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范工具记录。OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子回调公开该操作，否则 OpenClaw 无法改写原生 Codex 讨论串。

压缩和 LLM 生命周期投影来自 Codex app-server 通知和 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是适配器层级的观察结果，而不是 Codex 内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为 `codex_app_server.hook` 智能体事件，用于轨迹和调试。它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是在底层换了一个模型调用的 PI。Codex 拥有更多原生模型循环，而 OpenClaw 会围绕该边界适配它的插件和会话表面。

Codex 运行时 v1 中支持：

| 表面                                          | 支持情况                                | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环                 | 支持                                    | Codex app-server 拥有 OpenAI 轮次、原生讨论串恢复和原生工具续接。                                                                                                                                    |
| OpenClaw 渠道路由和递送                      | 支持                                    | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道保持在模型运行时之外。                                                                                                                        |
| OpenClaw 动态工具                            | 支持                                    | Codex 要求 OpenClaw 执行这些工具，因此 OpenClaw 保持在执行路径中。                                                                                                                                   |
| 提示词和上下文插件                            | 支持                                    | OpenClaw 会构建提示词叠加层，并在启动或恢复讨论串之前将上下文投影到 Codex 轮次中。                                                                                                                   |
| 上下文引擎生命周期                            | 支持                                    | Codex 轮次会运行组装、摄取或轮次后维护，以及上下文引擎压缩协调。                                                                                                                                     |
| 动态工具钩子                                  | 支持                                    | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕 OpenClaw 拥有的动态工具运行。                                                                                                           |
| 生命周期钩子                                  | 作为适配器观察结果支持                  | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会使用真实的 Codex 模式载荷触发。                                                                                   |
| 最终回答修订门控                              | 通过原生钩子中继支持                    | Codex `Stop` 会被中继到 `before_agent_finalize`；`revise` 会要求 Codex 在最终确定前再进行一次模型传递。                                                                                               |
| 原生 shell、patch 和 MCP 阻止或观察           | 通过原生钩子中继支持                    | Codex `PreToolUse` 和 `PostToolUse` 会针对已提交的原生工具表面进行中继，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 载荷。支持阻止；不支持参数改写。                                            |
| 原生权限策略                                  | 通过原生钩子中继支持                    | 在运行时公开它的情况下，Codex `PermissionRequest` 可以通过 OpenClaw 策略路由。如果 OpenClaw 未返回决定，Codex 会继续通过其正常 guardian 或用户批准路径。                                             |
| App-server 轨迹捕获                           | 支持                                    | OpenClaw 会记录它发送给 app-server 的请求以及收到的 app-server 通知。                                                                                                                                |

Codex 运行时 v1 中不支持：

| Surface                                             | V1 边界                                                                                                                                     | 未来路径                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                       | Codex 原生工具前置钩子可以阻止，但 OpenClaw 不会重写 Codex 原生工具参数。                                               | 需要 Codex 钩子/架构支持替换工具输入。                            |
| 可编辑的 Codex 原生转录历史            | Codex 拥有规范的原生线程历史。OpenClaw 拥有一份镜像，并且可以投射未来上下文，但不应变更不受支持的内部状态。 | 如果需要原生线程手术式修改，请添加显式 Codex app-server API。                    |
| Codex 原生工具记录的 `tool_result_persist` | 该钩子转换 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。                                                           | 可以镜像转换后的记录，但规范重写需要 Codex 支持。              |
| 丰富的原生压缩元数据                     | OpenClaw 会观察压缩开始和完成，但不会收到稳定的保留/丢弃列表、token 增量或摘要负载。            | 需要更丰富的 Codex 压缩事件。                                                     |
| 压缩干预                             | 当前 OpenClaw 压缩钩子在 Codex 模式下属于通知级别。                                                                         | 如果插件需要否决或重写原生压缩，请添加 Codex 压缩前/后钩子。 |
| 逐字节模型 API 请求捕获             | OpenClaw 可以捕获 app-server 请求和通知，但 Codex core 会在内部构建最终 OpenAI API 请求。                      | 需要 Codex 模型请求跟踪事件或调试 API。                                   |

## 工具、媒体与压缩

Codex harness 只更改底层嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从 harness 接收动态工具结果。文本、图片、视频、音乐、TTS、批准和消息工具输出会继续通过常规 OpenClaw 交付路径传递。

原生钩子中继是有意设计为通用的，但 v1 支持契约仅限于 OpenClaw 测试过的 Codex 原生工具和权限路径。在 Codex 运行时中，这包括 shell、patch 和 MCP `PreToolUse`、`PostToolUse` 以及 `PermissionRequest` 负载。在运行时契约明确命名某个未来 Codex 钩子事件之前，不要假设它是 OpenClaw 插件表面。

对于 `PermissionRequest`，OpenClaw 仅在策略做出决定时返回显式允许或拒绝决定。无决定结果不是允许。Codex 会将其视为没有钩子决定，并继续落入自己的 guardian 或用户批准路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具批准请求会通过 OpenClaw 的插件批准流程路由。Codex `request_user_input` 提示会发回原始聊天，下一条排队的后续消息会回答该原生服务器请求，而不是作为额外上下文被引导。其他 MCP 请求仍会失败关闭。

活动运行队列引导会映射到 Codex app-server `turn/steer`。使用默认的 `messages.queue.mode: "steer"` 时，OpenClaw 会在配置的静默窗口内批处理排队聊天消息，并按到达顺序将它们作为一个 `turn/steer` 请求发送。旧版 `queue` 模式会发送单独的 `turn/steer` 请求。Codex review 和手动压缩轮次可能会拒绝同轮引导，在这种情况下，如果所选模式允许回退，OpenClaw 会使用 followup 队列。请参阅 [Steering queue](/zh-CN/concepts/queue-steering)。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一份转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换。镜像包含用户提示、最终助手文本，以及 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未公开人类可读的压缩摘要，也没有提供可审计列表来说明 Codex 在压缩后保留了哪些条目。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它只在 OpenClaw 写入 OpenClaw 拥有的会话转录工具结果时适用。

媒体生成不需要 PI。图片、视频、音乐、PDF、TTS 和媒体理解会继续使用匹配的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 不会作为普通 `/model` 提供商出现：**对于新配置，这是预期行为。选择带有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：**当没有 Codex harness 声明本次运行时，`agentRuntime.id: "auto"` 仍可能使用 PI 作为兼容性后端。测试时设置 `agentRuntime.id: "codex"` 以强制选择 Codex。除非你显式设置 `agentRuntime.fallback: "pi"`，否则强制的 Codex 运行时现在会失败，而不是回退到 PI。一旦选中 Codex app-server，它的失败会直接浮现，不需要额外回退配置。

**app-server 被拒绝：**升级 Codex，使 app-server 握手报告版本 `0.125.0` 或更新版本。相同版本的预发布版或带构建后缀的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，会被拒绝，因为 OpenClaw 测试的是稳定版 `0.125.0` 协议下限。

**模型发现很慢：**降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。

**WebSocket 传输立即失败：**检查 `appServer.url`、`authToken`，以及远程 app-server 是否使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用 PI：**除非你为该智能体强制设置了 `agentRuntime.id: "codex"`，或选择了旧版 `codex/*` 引用，否则这是预期行为。普通 `openai/gpt-*` 和其他提供商引用在 `auto` 模式下会保留在其正常提供商路径上。如果强制设置 `agentRuntime.id: "codex"`，该智能体的每个嵌入式轮次都必须是 Codex 支持的 OpenAI 模型。

**Computer Use 已安装但工具未运行：**从新会话运行 `/codex computer-use status`。如果工具报告 `Native hook relay unavailable`，请使用 `/new` 或 `/reset`；如果问题持续存在，请重启 Gateway 网关以清除过期的原生钩子注册。如果 `computer-use.list_apps` 超时，请重启 Codex Computer Use 或 Codex Desktop 后重试。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [插件钩子](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
