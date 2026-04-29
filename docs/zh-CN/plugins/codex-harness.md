---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅 Codex 部署失败，而不是回退到 PI
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体回合
title: Codex harness
x-i18n:
    generated_at: "2026-04-29T18:46:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8eba5cb48c94fe38392d85c9d5c79a7829a2fa7eaba81715f4449d39d7d0dea
    source_path: plugins/codex-harness.md
    workflow: 16
---

内置的 `codex` 插件让 OpenClaw 通过 Codex app-server 运行嵌入式智能体轮次，而不是使用内置的 PI 执行框架。

当你希望 Codex 拥有底层智能体会话时使用它：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体投递，以及可见转录镜像。

如果你想先了解整体方向，请从 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。简短版本是：`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍然是通信界面。

## 这个插件会改变什么

内置的 `codex` 插件提供若干相互独立的能力：

| 能力                              | 使用方式                                            | 作用                                                                            |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| 原生嵌入式运行时                  | `agentRuntime.id: "codex"`                          | 通过 Codex app-server 运行 OpenClaw 嵌入式智能体轮次。                          |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 从消息对话中绑定和控制 Codex app-server 线程。                                  |
| Codex app-server 提供商/目录      | `codex` 内部机制，通过执行框架暴露                  | 让运行时发现并验证 app-server 模型。                                            |
| Codex 媒体理解路径                | `codex/*` 图像模型兼容路径                          | 针对受支持的图像理解模型运行有界的 Codex app-server 轮次。                      |
| 原生钩子中继                      | 围绕 Codex 原生事件的插件钩子                       | 让 OpenClaw 观察/阻止受支持的 Codex 原生工具/结束事件。                         |

启用插件会让这些能力可用。它**不会**：

- 对每个 OpenAI 模型都开始使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 让 ACP/acpx 成为默认 Codex 路径
- 热切换已经记录 PI 运行时的现有会话
- 替换 OpenClaw 渠道投递、会话文件、认证配置文件存储或消息路由

同一个插件也拥有原生 `/codex` 聊天控制命令界面。如果插件已启用，并且用户要求从聊天中绑定、恢复、引导、停止或检查 Codex 线程，智能体应优先使用 `/codex ...`，而不是 ACP。当用户明确要求 ACP/acpx 或正在测试 ACP Codex 适配器时，ACP 仍然是显式回退。

原生 Codex 轮次将 OpenClaw 插件钩子保留为公共兼容层。这些是进程内 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` 用于镜像转录记录
- `before_agent_finalize` 通过 Codex `Stop` 中继
- `agent_end`

插件还可以注册运行时中立的工具结果中间件，用于在 OpenClaw 执行工具之后、结果返回给 Codex 之前重写 OpenClaw 动态工具结果。这与公共 `tool_result_persist` 插件钩子是分开的，后者会转换 OpenClaw 拥有的转录工具结果写入。

插件钩子语义本身见 [插件钩子](/zh-CN/plugins/hooks) 和 [插件保护行为](/zh-CN/tools/plugin)。

该执行框架默认关闭。新配置应将 OpenAI 模型引用保持为规范的 `openai/gpt-*`，并在需要原生 app-server 执行时显式强制设置 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用仍会为了兼容性自动选择该执行框架，但运行时支持的旧版提供商前缀不会作为普通模型/提供商选项显示。

如果 `codex` 插件已启用，但主模型仍是 `openai-codex/*`，`openclaw doctor` 会发出警告，而不是更改路由。这是有意设计：`openai-codex/*` 仍然是 PI Codex OAuth/订阅路径，而原生 app-server 执行仍是显式运行时选择。

## 路由映射

更改配置前请使用这张表：

| 期望行为                                    | 模型引用                   | 运行时配置                             | 插件要求                    | 预期 Status 标签              |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通过普通 OpenClaw runner 使用 OpenAI API    | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI provider             | `Runtime: OpenClaw Pi Default` |
| 通过 PI 使用 Codex OAuth/订阅               | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth 提供商   | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 嵌入式轮次            | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` 插件                | `Runtime: OpenAI Codex`        |
| 以保守自动模式混合提供商                    | 提供商特定引用             | `agentRuntime.id: "auto"`              | 可选插件运行时              | 取决于所选运行时               |
| 显式 Codex ACP 适配器会话                   | 取决于 ACP 提示词/模型     | `sessions_spawn` 搭配 `runtime: "acp"` | 健康的 `acpx` 后端          | ACP 任务/会话 Status           |

重要区别在于提供商与运行时：

- `openai-codex/*` 回答“PI 应使用哪条提供商/认证路由？”
- `agentRuntime.id: "codex"` 回答“哪个循环应执行这个嵌入式轮次？”
- `/codex ...` 回答“这个聊天应绑定或控制哪个原生 Codex 对话？”
- ACP 回答“acpx 应启动哪个外部执行框架进程？”

## 选择正确的模型前缀

OpenAI 系列路由按前缀区分。想通过 PI 使用 Codex OAuth 时使用 `openai-codex/*`；想要直接 OpenAI API 访问，或正在强制使用原生 Codex app-server 执行框架时使用 `openai/*`：

| 模型引用                                      | 运行时路径                                   | 适用场景                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 通过 OpenClaw/PI 管线使用 OpenAI provider    | 你希望使用当前的直接 OpenAI Platform API 访问，并配置 `OPENAI_API_KEY`。 |
| `openai-codex/gpt-5.5`                        | 通过 OpenClaw/PI 使用 OpenAI Codex OAuth     | 你希望通过默认 PI runner 使用 ChatGPT/Codex 订阅认证。                   |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server 执行框架                    | 你希望为嵌入式智能体轮次使用原生 Codex app-server 执行。                 |

GPT-5.5 目前在 OpenClaw 中仅支持订阅/OAuth。对 PI OAuth 使用 `openai-codex/gpt-5.5`，或将 `openai/gpt-5.5` 搭配 Codex app-server 执行框架使用。一旦 OpenAI 在公共 API 上启用 GPT-5.5，`openai/gpt-5.5` 的直接 API key 访问就会受支持。

旧版 `codex/gpt-*` 引用仍会作为兼容别名被接受。Doctor 兼容性迁移会将旧版主运行时引用改写为规范模型引用，并单独记录运行时策略；仅作为回退的旧版引用会保持不变，因为运行时是为整个智能体容器配置的。新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生 app-server 执行框架配置应使用 `openai/gpt-*` 加上 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循同样的前缀区分。图像理解应通过 OpenAI Codex OAuth 提供商路径运行时，使用 `openai-codex/gpt-*`。图像理解应通过有界 Codex app-server 轮次运行时，使用 `codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 确认当前会话的有效执行框架。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含所选执行框架 ID、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

### Doctor 警告的含义

当以下条件全部为真时，`openclaw doctor` 会发出警告：

- 内置 `codex` 插件已启用或允许
- 某个智能体的主模型是 `openai-codex/*`
- 该智能体的有效运行时不是 `codex`

该警告存在的原因是，用户常常以为“已启用 Codex 插件”就意味着“原生 Codex app-server 运行时”。OpenClaw 不会做出这个跳跃。该警告表示：

- 如果你的意图是通过 PI 使用 ChatGPT/Codex OAuth，**无需更改**。
- 如果你的意图是原生 app-server 执行，请将模型改为 `openai/<model>` 并设置 `agentRuntime.id: "codex"`。
- 运行时更改后，现有会话仍需要 `/new` 或 `/reset`，因为会话运行时固定是粘性的。

执行框架选择不是实时会话控制。嵌入式轮次运行时，OpenClaw 会在该会话上记录所选执行框架 ID，并在同一会话 ID 的后续轮次中继续使用它。当你希望未来会话使用另一个执行框架时，更改 `agentRuntime` 配置或 `OPENCLAW_AGENT_RUNTIME`；在将现有对话从 PI 切换到 Codex 之前，使用 `/new` 或 `/reset` 启动一个新会话。这样可以避免通过两个不兼容的原生会话系统重放同一份转录。

在执行框架固定存在之前创建的旧版会话，一旦有转录历史，就会被视为固定到 PI。更改配置后，使用 `/new` 或 `/reset` 让该对话选择进入 Codex。

`/status` 会显示有效模型运行时。默认 PI 执行框架显示为 `Runtime: OpenClaw Pi Default`，Codex app-server 执行框架显示为 `Runtime: OpenAI Codex`。

## 要求

- OpenClaw 中可用的内置 `codex` 插件。
- Codex app-server `0.125.0` 或更高版本。内置插件默认会管理兼容的 Codex app-server 二进制文件，因此 `PATH` 上的本地 `codex` 命令不会影响正常的执行框架启动。
- app-server 进程或 OpenClaw 的 Codex 认证桥可用的 Codex 认证。

该插件会阻止较旧或未带版本的 app-server 握手。这能让 OpenClaw 保持在已测试过的协议界面上。

对于实时测试和 Docker 冒烟测试，认证通常来自 Codex CLI 账户或 OpenClaw `openai-codex` 认证配置文件。在没有账户时，本地 stdio app-server 启动也可以回退到 `CODEX_API_KEY` / `OPENAI_API_KEY`。

## 最小配置

使用 `openai/gpt-5.5`，启用内置插件，并强制使用 `codex` 执行框架：

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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 的旧版配置仍会自动启用内置 `codex` 插件。新配置应优先使用 `openai/<model>` 加上上面的显式 `agentRuntime` 条目。

## 将 Codex 与其他模型一起添加

如果同一个智能体应在 Codex 和非 Codex 提供商模型之间自由切换，不要全局设置 `agentRuntime.id: "codex"`。强制运行时会应用于该智能体或会话的每个嵌入式轮次。如果在强制该运行时时选择 Anthropic 模型，OpenClaw 仍会尝试 Codex 执行框架并关闭失败，而不是静默地通过 PI 路由该轮次。

请改用以下形式之一：

- 将 Codex 放在专用智能体上，并设置 `agentRuntime.id: "codex"`。
- 将默认智能体保留在 `agentRuntime.id: "auto"` 上，并为常规混合
  提供商使用保留 PI 回退。
- 仅为兼容性使用旧版 `codex/*` 引用。新配置应优先使用
  `openai/*`，并显式配置 Codex 运行时策略。

例如，以下配置会让默认智能体使用常规自动选择，并
添加一个单独的 Codex 智能体：

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

使用这种形式时：

- 默认的 `main` 智能体使用常规提供商路径和 PI 兼容性回退。
- `codex` 智能体使用 Codex 应用服务器 harness。
- 如果 `codex` 智能体缺少 Codex 或不支持 Codex，该轮次会失败，
  而不是静默改用 PI。

## 智能体命令路由

智能体应按意图路由用户请求，而不是只看 “Codex” 这个词：

| 用户请求...                                             | 智能体应使用...                                  |
| -------------------------------------------------------- | ------------------------------------------------ |
| “将此聊天绑定到 Codex”                                  | `/codex bind`                                    |
| “在这里继续 Codex 线程 `<id>`”                           | `/codex resume <id>`                             |
| “显示 Codex 线程”                                       | `/codex threads`                                 |
| “为一次糟糕的 Codex 运行提交支持报告”                   | `/diagnostics [note]`                            |
| “只为这个附加线程发送 Codex 反馈”                       | `/codex diagnostics [note]`                      |
| “将 Codex 用作此智能体的运行时”                         | 将配置改为 `agentRuntime.id`                     |
| “用我的 ChatGPT/Codex 订阅运行常规 OpenClaw”             | `openai-codex/*` 模型引用                        |
| “通过 ACP/acpx 运行 Codex”                              | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor”       | ACP/acpx，而不是 `/codex`，也不是原生子智能体    |

只有当 ACP 已启用、可分发，并由已加载的运行时后端支持时，
OpenClaw 才会向智能体公布 ACP 启动指引。如果 ACP 不可用，
系统提示和插件 Skills 不应教智能体 ACP 路由。

## 仅 Codex 部署

当你需要证明每个嵌入式智能体轮次都使用 Codex 时，强制使用 Codex harness。
显式插件运行时默认没有 PI 回退，因此
`fallback: "none"` 是可选的，但通常适合作为文档说明：

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

强制使用 Codex 后，如果 Codex 插件被禁用、
应用服务器版本过旧，或应用服务器无法启动，OpenClaw 会提前失败。
只有在你有意让 PI 处理缺失的 harness 选择时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体配置 Codex

你可以让一个智能体仅使用 Codex，同时让默认智能体保留常规
自动选择：

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

使用常规会话命令切换智能体和模型。`/new` 会创建一个新的
OpenClaw 会话，Codex harness 会按需创建或继续其侧车应用服务器
线程。`/reset` 会清除此线程的 OpenClaw 会话绑定，
并让下一轮重新从当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向应用服务器请求可用模型。如果
发现失败或超时，它会对以下模型使用内置回退目录：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

你可以在 `plugins.entries.codex.config.discovery` 下调整发现行为：

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

如果你希望启动时避免探测 Codex，并固定使用回退目录，
可以禁用发现：

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

默认情况下，插件会使用以下命令在本地启动 OpenClaw 托管的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

托管二进制文件会声明为内置插件运行时依赖，并随其他 `codex`
插件依赖一起暂存。这会让应用服务器版本与内置插件绑定，
而不是使用本地碰巧安装的任何独立 Codex CLI。只有当你
有意运行不同的可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：
Codex 可以使用 shell 和网络工具，而不会因无人响应的原生审批提示而停止。

若要选择使用 Codex guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 模式使用 Codex 的原生自动审核审批路径。当 Codex 请求
离开沙箱、写入工作区外部，或添加网络访问等权限时，
Codex 会将该审批请求路由到原生审核器，而不是人工提示。
审核器会应用 Codex 的风险框架，并批准或拒绝具体请求。
当你希望获得比 YOLO 模式更多的保护，但仍需要无人值守智能体继续推进时，
请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
单独的策略字段仍会覆盖 `mode`，因此高级部署可以将
该预设与显式选择混合使用。较旧的 `guardian_subagent` 审核器值
仍作为兼容别名接受，但新配置应使用
`auto_review`。

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

默认情况下，Stdio 应用服务器启动会继承 OpenClaw 的进程环境，
但 OpenClaw 拥有 Codex 应用服务器账号桥接。凭证按以下顺序选择：

1. 智能体的显式 OpenClaw Codex 凭证配置文件。
2. 应用服务器的现有账号，例如本地 Codex CLI ChatGPT 登录。
3. 仅限本地 stdio 应用服务器启动：当没有应用服务器账号且仍需要 OpenAI 凭证时，
   使用 `CODEX_API_KEY`，然后使用
   `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅风格的 Codex 凭证配置文件时，它会从生成的
Codex 子进程中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。
这会让 Gateway 网关级 API key 仍可用于嵌入或直接 OpenAI 模型，
同时避免原生 Codex 应用服务器轮次意外通过 API 计费。
显式 Codex API key 配置文件和本地 stdio 环境键回退会使用应用服务器
登录，而不是继承的子进程环境。WebSocket 应用服务器连接
不会收到 Gateway 网关环境 API key 回退；请使用显式凭证配置文件或
远程应用服务器自己的账号。

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

`appServer.clearEnv` 只影响生成的 Codex 应用服务器子进程。

支持的 `appServer` 字段：

| 字段                | 默认值                                   | 含义                                                                                                                                    |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 会生成 Codex；`"websocket"` 会连接到 `url`。                                                                                  |
| `command`           | 托管的 Codex 二进制文件                  | stdio 传输的可执行文件。保持未设置以使用托管二进制文件；仅在需要显式覆盖时设置它。                                                      |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 传输的参数。                                                                                                                      |
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                                              |
| `authToken`         | 未设置                                   | WebSocket 传输的 Bearer 令牌。                                                                                                          |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。                                                                                                                 |
| `clearEnv`          | `[]`                                     | 在 OpenClaw 构建继承的环境之后，从生成的 stdio app-server 进程中移除的额外环境变量名称。                                                |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                                                     |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 审核执行的预设。                                                                                                       |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/轮次的原生 Codex 批准策略。                                                                                         |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                                              |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审核原生批准提示。`guardian_subagent` 仍是旧版别名。                                                      |
| `serviceTier`       | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                                                   |

OpenClaw 拥有的动态工具调用独立受限于
`appServer.requestTimeoutMs`：每个 Codex `item/tool/call` 请求必须在 30 秒内收到
OpenClaw 响应。超时时，OpenClaw 会在支持的位置中止工具信号，并向 Codex 返回失败的动态工具响应，以便该轮次可以继续，而不是让会话停留在 `processing`。

在 OpenClaw 响应 Codex 的轮次范围 app-server 请求后，harness 还期望 Codex 以 `turn/completed` 完成原生轮次。如果 app-server 在该响应之后静默 60 秒，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw 会话通道，以便后续聊天消息不会排在过期的原生轮次之后。

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或将
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 用于一次性本地测试。对于可重复的部署，更推荐配置，因为它会把插件行为与其余 Codex harness 设置保留在同一个经过审核的文件中。

## 计算机使用

计算机使用在自己的设置指南中介绍：
[Codex 计算机使用](/zh-CN/plugins/codex-computer-use)。

简短版本：OpenClaw 不会 vendoring 桌面控制应用，也不会自行执行桌面操作。它会准备 Codex app-server，验证 `computer-use` MCP 服务器可用，然后在 Codex 模式轮次期间让 Codex 处理原生 MCP 工具调用。

若要在 Codex marketplace 流程之外直接访问 TryCua 驱动，请使用 `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'` 注册 `cua-driver mcp`。
请参阅 [Codex 计算机使用](/zh-CN/plugins/codex-computer-use)，了解 Codex 拥有的计算机使用与直接 MCP 注册之间的区别。

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

可从命令界面检查或安装该设置：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

计算机使用是 macOS 专用功能，并且在 Codex MCP 服务器能够控制应用之前，可能需要本地操作系统权限。如果 `computerUse.enabled` 为 true 且 MCP 服务器不可用，Codex 模式轮次会在线程启动前失败，而不是在没有原生计算机使用工具的情况下静默运行。请参阅 [Codex 计算机使用](/zh-CN/plugins/codex-computer-use)，了解 marketplace 选择、远程目录限制、Status 原因和故障排除。

当 `computerUse.autoInstall` 为 true 时，如果 Codex 尚未发现本地 marketplace，OpenClaw 可以从
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 注册标准内置 Codex Desktop marketplace。更改运行时或计算机使用配置后，请使用 `/new` 或 `/reset`，以免现有会话保留旧的 PI 或 Codex 线程绑定。

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

guardian 审核的 Codex 批准：

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

模型切换仍由 OpenClaw 控制。当 OpenClaw 会话附加到现有 Codex 线程时，下一轮会再次向 app-server 发送当前选择的 OpenAI 模型、提供商、批准策略、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但要求 Codex 使用新选择的模型继续。

## Codex 命令

内置插件会将 `/codex` 注册为授权斜杠命令。它是通用的，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接性、模型、账号、速率限制、MCP 服务器和 skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审核。
- `/codex diagnostics [note]` 在发送已附加线程的 Codex 诊断反馈前请求确认。
- `/codex computer-use status` 检查已配置的计算机使用插件和 MCP 服务器。
- `/codex computer-use install` 安装已配置的计算机使用插件并重新加载 MCP 服务器。
- `/codex account` 显示账号和速率限制 Status。
- `/codex mcp` 列出 Codex app-server MCP 服务器 Status。
- `/codex skills` 列出 Codex app-server skills。

### 常见调试工作流

当由 Codex 支持的智能体在 Telegram、Discord、Slack 或其他渠道中出现意外行为时，请从问题发生的对话开始：

1. 运行 `/diagnostics bad tool choice after image upload` 或另一条简短说明，描述你看到的内容。
2. 批准一次诊断请求。该批准会创建本地 Gateway 网关诊断 zip，并且由于会话正在使用 Codex harness，还会将相关 Codex 反馈包发送到 OpenAI 服务器。
3. 将完成的诊断回复复制到缺陷报告或支持线程中。它包括本地包路径、隐私摘要、OpenClaw 会话 ID、Codex 线程 ID，以及每个 Codex 线程的 `Inspect locally` 行。
4. 如果你想自行调试该运行，请在终端中运行打印出的 `Inspect locally` 命令。它看起来像 `codex resume <thread-id>`，并会打开原生 Codex 线程，以便你检查对话、在本地继续，或询问 Codex 为什么选择了特定工具或计划。

仅当你明确希望为当前附加的线程上传 Codex 反馈，而不包含完整 OpenClaw Gateway 网关诊断包时，才使用 `/codex diagnostics [note]`。对于大多数支持报告，`/diagnostics [note]` 是更好的起点，因为它会在一条回复中把本地 Gateway 网关状态和 Codex 线程 ID 关联起来。请参阅 [诊断导出](/zh-CN/gateway/diagnostics)，了解完整的隐私模型和群聊行为。

核心 OpenClaw 还公开仅限所有者使用的 `/diagnostics [note]`，作为通用 Gateway 网关诊断命令。它的批准提示会显示敏感数据前言，链接到 [诊断导出](/zh-CN/gateway/diagnostics)，并且每次都通过显式 exec 批准请求 `openclaw gateway diagnostics export --json`。不要使用允许全部的规则批准诊断。批准后，OpenClaw 会发送一份可粘贴的报告，其中包含本地包路径和清单摘要。当活动 OpenClaw 会话使用 Codex harness 时，同一次批准还会授权将相关 Codex 反馈包发送到 OpenAI 服务器。批准提示会说明将发送 Codex 反馈，但不会在批准前列出 Codex 会话或线程 ID。

如果 `/diagnostics` 由群聊中的所有者调用，OpenClaw 会保持共享渠道整洁：群组只会收到一条简短通知，而诊断前言、批准提示以及 Codex 会话/线程 ID 会通过私有批准路由发送给所有者。如果没有私有所有者路由，OpenClaw 会拒绝群组请求，并要求所有者从私信中运行它。

获批的 Codex 上传会调用 Codex app-server `feedback/upload`，并请求 app-server 在可用时为每个列出的线程和派生的 Codex 子线程包含日志。上传会通过 Codex 的常规反馈路径发送到 OpenAI 服务器；如果该 app-server 中禁用了 Codex 反馈，该命令会返回 app-server 错误。完成后的诊断回复会列出已发送线程的渠道、OpenClaw 会话 ID、Codex 线程 ID，以及本地 `codex resume <thread-id>` 命令。如果你拒绝或忽略批准，OpenClaw 不会打印这些 Codex ID。此上传不会替代本地 Gateway 网关诊断导出。

`/codex resume` 会写入 harness 在正常轮次中使用的同一个 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，把当前选择的 OpenClaw 模型传给 app-server，并保持扩展历史记录启用。

### 从 CLI 检查 Codex 线程

了解一次异常 Codex 运行的最快方式，通常是直接打开原生 Codex 线程：

```sh
codex resume <thread-id>
```

当你在渠道对话中注意到 bug，并想检查有问题的 Codex 会话、在本地继续它，或询问 Codex 为什么做出特定工具或推理选择时，请使用此命令。最简单的路径通常是先运行 `/diagnostics [note]`：你批准后，完成的报告会列出每个 Codex 线程，并打印一个 `Inspect locally` 命令，例如 `codex resume <thread-id>`。你可以直接把该命令复制到终端中。

你也可以通过当前聊天的 `/codex binding`，或近期 Codex app-server 线程的 `/codex threads [filter]` 获取线程 ID，然后在 shell 中运行相同的 `codex resume` 命令。

该命令界面需要 Codex app-server `0.125.0` 或更新版本。如果未来版或自定义 app-server 未公开对应的 JSON-RPC 方法，单个控制方法会报告为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 所有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 跨 PI 和 Codex harness 的产品/插件兼容性。                          |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐轮适配器行为。                            |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。                |

OpenClaw 不使用项目级或全局 Codex `hooks.json` 文件来路由 OpenClaw 插件行为。对于受支持的原生工具和权限桥接，OpenClaw 会为 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入逐线程 Codex 配置。其他 Codex 钩子（如 `SessionStart` 和 `UserPromptSubmit`）仍是 Codex 级控制；它们不会在 v1 契约中作为 OpenClaw 插件钩子公开。

对于 OpenClaw 动态工具，OpenClaw 会在 Codex 请求调用后执行该工具，因此 OpenClaw 会在 harness 适配器中触发其拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范工具记录。OpenClaw 可以镜像部分事件，但除非 Codex 通过 app-server 或原生钩子回调公开该操作，否则 OpenClaw 不能重写原生 Codex 线程。

压缩和 LLM 生命周期投影来自 Codex app-server 通知以及 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是适配器级观察结果，并不是 Codex 内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为 `codex_app_server.hook` 智能体事件，用于轨迹记录和调试。它们不会调用 OpenClaw 插件钩子。

## V1 支持契约

Codex 模式不是在底层换了模型调用的 PI。Codex 拥有更多原生模型循环，OpenClaw 会围绕该边界适配其插件和会话界面。

Codex 运行时 v1 支持：

| 界面                                          | 支持情况                                | 原因                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环                 | 支持                                    | Codex app-server 拥有 OpenAI 轮次、原生线程恢复和原生工具继续执行。                                                                                                                                  |
| OpenClaw 渠道路由和交付                       | 支持                                    | Telegram、Discord、Slack、WhatsApp、iMessage 以及其他渠道仍位于模型运行时之外。                                                                                                                       |
| OpenClaw 动态工具                             | 支持                                    | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍在执行路径中。                                                                                                                                   |
| 提示词和上下文插件                            | 支持                                    | OpenClaw 会构建提示词覆盖层，并在启动或恢复线程前把上下文投影进 Codex 轮次。                                                                                                                         |
| 上下文引擎生命周期                            | 支持                                    | 组装、摄取或轮次后维护，以及上下文引擎压缩协调会为 Codex 轮次运行。                                                                                                                                  |
| 动态工具钩子                                  | 支持                                    | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕 OpenClaw 拥有的动态工具运行。                                                                                                            |
| 生命周期钩子                                  | 作为适配器观察结果支持                  | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式载荷触发。                                                                                     |
| 最终答案修订门禁                              | 通过原生钩子中继支持                    | Codex `Stop` 会中继到 `before_agent_finalize`；`revise` 会请求 Codex 在最终确定前再执行一次模型处理。                                                                                                 |
| 原生 shell、patch 和 MCP 阻止或观察           | 通过原生钩子中继支持                    | Codex `PreToolUse` 和 `PostToolUse` 会为已承诺的原生工具界面中继，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 载荷。支持阻止；不支持参数重写。                                                |
| 原生权限策略                                  | 通过原生钩子中继支持                    | 在运行时公开该能力时，Codex `PermissionRequest` 可以通过 OpenClaw 策略路由。如果 OpenClaw 未返回决策，Codex 会继续走其正常 guardian 或用户批准路径。                                                 |
| App-server 轨迹捕获                           | 支持                                    | OpenClaw 会记录发送给 app-server 的请求，以及收到的 app-server 通知。                                                                                                                                |

Codex 运行时 v1 不支持：

| 界面                                                | V1 边界                                                                                                                                       | 未来路径                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                                    | Codex 原生工具前置钩子可以阻止，但 OpenClaw 不会重写 Codex 原生工具参数。                                                                    | 需要 Codex 钩子/模式支持替换工具输入。                                                    |
| 可编辑的 Codex 原生转录历史                         | Codex 拥有规范原生线程历史。OpenClaw 拥有镜像并可以投影未来上下文，但不应变更不受支持的内部机制。                                           | 如果需要原生线程手术式修改，请添加明确的 Codex app-server API。                           |
| Codex 原生工具记录的 `tool_result_persist`          | 该钩子转换的是 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。                                                                          | 可以镜像转换后的记录，但规范重写需要 Codex 支持。                                         |
| 丰富的原生压缩元数据                                | OpenClaw 会观察压缩开始和完成，但不会收到稳定的保留/丢弃列表、token delta 或摘要载荷。                                                      | 需要更丰富的 Codex 压缩事件。                                                             |
| 压缩干预                                            | 当前 OpenClaw 压缩钩子在 Codex 模式下是通知级别。                                                                                            | 如果插件需要否决或重写原生压缩，请添加 Codex 压缩前/后钩子。                              |
| 逐字节模型 API 请求捕获                             | OpenClaw 可以捕获 app-server 请求和通知，但 Codex core 会在内部构建最终 OpenAI API 请求。                                                    | 需要 Codex 模型请求追踪事件或调试 API。                                                   |

## 工具、媒体和压缩

Codex harness 仅改变底层嵌入式智能体执行器。

OpenClaw 仍会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、批准和消息工具输出会继续通过常规 OpenClaw 交付路径。

原生钩子中继有意保持通用，但 v1 支持契约仅限于 OpenClaw 测试过的 Codex 原生工具和权限路径。在 Codex 运行时中，这包括 shell、patch 和 MCP 的 `PreToolUse`、`PostToolUse` 与 `PermissionRequest` 载荷。在运行时契约明确命名前，不要假定未来每个 Codex 钩子事件都是 OpenClaw 插件界面。

对于 `PermissionRequest`，OpenClaw 仅在策略作出决定时返回明确允许或拒绝决策。无决策结果不是允许。Codex 会将其视为没有钩子决策，并回退到自己的 guardian 或用户批准路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具批准征询会通过 OpenClaw 的插件批准流程路由。Codex `request_user_input` 提示会被发送回发起聊天，下一条排队的后续消息会回答该原生服务器请求，而不是被当作额外上下文引导。其他 MCP 征询请求仍会失败关闭。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一份 transcript 镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来切换模型或 harness。该镜像包含用户提示词、最终助手文本，以及当 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩的开始和完成信号。它尚未公开可读的压缩摘要，也未公开可审计的条目列表来说明 Codex 在压缩后保留了哪些条目。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 目前不会重写 Codex 原生工具结果记录。它只在 OpenClaw 写入由 OpenClaw 拥有的会话 transcript 工具结果时适用。

媒体生成不需要 PI。图片、视频、音乐、PDF、TTS 和媒体理解会继续使用匹配的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 没有作为普通 `/model` 提供商出现：** 对于新配置，这是预期行为。选择一个带有 `agentRuntime.id: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 当没有 Codex harness 接管运行时，`agentRuntime.id: "auto"` 仍然可以使用 PI 作为兼容性后端。测试时将 `agentRuntime.id: "codex"` 设为强制选择 Codex。现在，强制使用 Codex 运行时会失败，而不是回退到 PI，除非你显式设置 `agentRuntime.fallback: "pi"`。一旦选择了 Codex app-server，它的失败会直接暴露出来，不需要额外的回退配置。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手报告版本 `0.125.0` 或更新版本。同版本预发布版或带构建后缀的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，会被拒绝，因为 OpenClaw 测试的是稳定版 `0.125.0` 协议下限。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`，或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，并确认远程 app-server 使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用 PI：** 除非你为该智能体强制设置了 `agentRuntime.id: "codex"`，或选择了旧版 `codex/*` 引用，否则这是预期行为。普通 `openai/gpt-*` 和其他提供商引用在 `auto` 模式下会保持在其正常提供商路径上。如果你强制设置 `agentRuntime.id: "codex"`，该智能体的每个嵌入回合都必须是 Codex 支持的 OpenAI 模型。

**已安装 Computer Use，但工具不运行：** 从新的会话运行 `/codex computer-use status`。如果某个工具报告 `Native hook relay unavailable`，请使用 `/new` 或 `/reset`；如果问题仍然存在，请重启 Gateway 网关以清除过期的原生钩子注册。如果 `computer-use.list_apps` 超时，请重启 Codex Computer Use 或 Codex Desktop 后重试。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [插件钩子](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
