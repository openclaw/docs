---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在无法使用时直接失败，而不是回退到 PI
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 内嵌智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-27T07:12:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8176ab6de65bf3a1167b4816a5f0f6400c66bd9716da91a5e14038d3a852886c
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 可以通过 Codex app-server 运行内嵌智能体轮次，而不是使用内置的 PI harness。

当你希望由 Codex 接管底层智能体会话时，请使用它：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、批准、媒体投递以及可见的转录镜像。

如果你正在熟悉相关概念，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简短来说：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、
Discord、Slack 或其他渠道仍然是通信界面。

## 这个插件会改变什么

内置的 `codex` 插件提供了几项彼此独立的能力：

| 能力 | 你的使用方式 | 它的作用 |
| --- | --- | --- |
| 原生内嵌运行时 | `agentRuntime.id: "codex"` | 通过 Codex app-server 运行 OpenClaw 内嵌智能体轮次。 |
| 原生聊天控制命令 | `/codex bind`、`/codex resume`、`/codex steer`、... | 在消息会话中绑定并控制 Codex app-server 线程。 |
| Codex app-server 提供商/目录 | `codex` 内部机制，通过 harness 暴露 | 让运行时可以发现并验证 app-server 模型。 |
| Codex 媒体理解路径 | `codex/*` 图像模型兼容路径 | 为受支持的图像理解模型运行受限的 Codex app-server 轮次。 |
| 原生钩子中继 | 围绕 Codex 原生事件的插件钩子 | 让 OpenClaw 可以观察/阻止受支持的 Codex 原生工具/终结事件。 |

启用该插件会使这些能力可用。它**不会**：

- 为每个 OpenAI 模型都开始使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 让 ACP/acpx 成为默认的 Codex 路径
- 对已经记录了 PI 运行时的现有会话进行热切换
- 替换 OpenClaw 的渠道投递、会话文件、auth-profile 存储或消息路由

同一个插件也负责原生 `/codex` 聊天控制命令界面。如果插件已启用，并且用户要求从聊天中绑定、恢复、引导、停止或检查 Codex 线程，智能体应优先使用 `/codex ...`，而不是 ACP。当用户明确要求 ACP/acpx，或正在测试 ACP Codex 适配器时，ACP 仍然是显式回退方案。

原生 Codex 轮次保留 OpenClaw 插件钩子作为公共兼容层。这些是进程内的 OpenClaw 钩子，而不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`、`after_compaction`
- `llm_input`、`llm_output`
- `before_tool_call`、`after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- 通过 Codex `Stop` 中继的 `before_agent_finalize`
- `agent_end`

插件也可以注册运行时中立的工具结果中间件，在 OpenClaw 执行工具之后、结果返回给 Codex 之前重写 OpenClaw 的动态工具结果。这与公共 `tool_result_persist` 插件钩子不同，后者会转换由 OpenClaw 持有的转录工具结果写入。

关于插件钩子语义本身，请参阅 [Plugin hooks](/zh-CN/plugins/hooks)
和 [Plugin guard behavior](/zh-CN/tools/plugin)。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用的规范形式为 `openai/gpt-*`，并在需要原生 app-server 执行时显式强制设置
`agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。为兼容性起见，旧版 `codex/*` 模型引用仍会自动选择该 harness，但由运行时支持的旧版 provider 前缀不会作为普通模型/提供商选项显示。

如果已启用 `codex` 插件，但主模型仍是
`openai-codex/*`，`openclaw doctor` 会给出警告，而不是修改路由。这是有意为之：`openai-codex/*` 仍然是 PI Codex OAuth/订阅路径，而原生 app-server 执行始终是显式的运行时选择。

## 路由映射

在修改配置前，请先使用此表：

| 期望行为 | 模型引用 | 运行时配置 | 插件要求 | 预期状态标签 |
| --- | --- | --- | --- | --- |
| 通过常规 OpenClaw 运行器使用 OpenAI API | `openai/gpt-*` | 省略或 `runtime: "pi"` | OpenAI provider | `Runtime: OpenClaw Pi Default` |
| 通过 PI 使用 Codex OAuth/订阅 | `openai-codex/gpt-*` | 省略或 `runtime: "pi"` | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 内嵌轮次 | `openai/gpt-*` | `agentRuntime.id: "codex"` | `codex` 插件 | `Runtime: OpenAI Codex` |
| 使用保守自动模式的混合提供商 | provider 特定引用 | `agentRuntime.id: "auto"` | 可选插件运行时 | 取决于选定运行时 |
| 显式 Codex ACP 适配器会话 | ACP prompt/model 依赖 | `sessions_spawn` 搭配 `runtime: "acp"` | 健康的 `acpx` 后端 | ACP 任务/会话状态 |

重要的划分在于 provider 与运行时：

- `openai-codex/*` 回答的是“PI 应该使用哪条 provider/auth 路径？”
- `agentRuntime.id: "codex"` 回答的是“哪一个循环应执行这个内嵌轮次？”
- `/codex ...` 回答的是“这段聊天应绑定或控制哪一个原生 Codex 会话？”
- ACP 回答的是“acpx 应启动哪一个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 家族路由依赖前缀。需要通过 PI 使用 Codex OAuth 时，请使用 `openai-codex/*`；需要直接使用 OpenAI API，或强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| 模型引用 | 运行时路径 | 适用场景 |
| --- | --- | --- |
| `openai/gpt-5.4` | 通过 OpenClaw/PI 管线的 OpenAI provider | 你希望通过 `OPENAI_API_KEY` 使用当前的 OpenAI Platform API 直接访问。 |
| `openai-codex/gpt-5.5` | 通过 OpenClaw/PI 的 OpenAI Codex OAuth | 你希望通过默认 PI 运行器使用 ChatGPT/Codex 订阅认证。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness | 你希望对内嵌智能体轮次使用原生 Codex app-server 执行。 |

GPT-5.5 目前在 OpenClaw 中仅支持订阅/OAuth。PI OAuth 请使用
`openai-codex/gpt-5.5`，或者将 `openai/gpt-5.5` 与 Codex
app-server harness 搭配使用。一旦 OpenAI 在公共 API 上启用 GPT-5.5，就支持对 `openai/gpt-5.5` 使用直接 API key 访问。

旧版 `codex/gpt-*` 引用仍作为兼容别名被接受。Doctor 兼容迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略；而仅用于回退的旧版引用保持不变，因为运行时是针对整个智能体容器配置的。新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生 app-server harness 配置应使用 `openai/gpt-*` 并配合
`agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 也遵循相同的前缀划分。当图像理解应通过 OpenAI Codex OAuth provider 路径运行时，请使用
`openai-codex/gpt-*`。当图像理解应通过受限的 Codex app-server 轮次运行时，请使用 `codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始之前失败。

使用 `/status` 确认当前会话的生效 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 gateway 的结构化 `agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

### Doctor 警告的含义

当以下条件全部为真时，`openclaw doctor` 会发出警告：

- 内置 `codex` 插件已启用或被允许
- 某个智能体的主模型是 `openai-codex/*`
- 该智能体的生效运行时不是 `codex`

之所以发出这个警告，是因为用户经常会认为“已启用 Codex 插件”意味着“使用原生 Codex app-server 运行时”。OpenClaw 不会自动做出这种跳转。该警告的含义是：

- 如果你本来就打算通过 PI 使用 ChatGPT/Codex OAuth，**则无需更改**。
- 如果你本来打算使用原生 app-server 执行，请把模型改为 `openai/<model>`，并设置
  `agentRuntime.id: "codex"`。
- 运行时变更后，现有会话仍然需要执行 `/new` 或 `/reset`，
  因为会话运行时绑定具有粘性。

Harness 选择不是实时会话控制。当某个内嵌轮次运行时，OpenClaw 会在该会话上记录所选 harness id，并在同一会话 id 的后续轮次中继续使用它。当你希望未来会话使用其他 harness 时，请更改 `agentRuntime` 配置或
`OPENCLAW_AGENT_RUNTIME`；在现有会话于 PI 与 Codex 之间切换之前，请使用 `/new` 或 `/reset` 启动新会话。这样可以避免将同一份转录在两个不兼容的原生会话系统之间重放。

在引入 harness pin 之前创建的旧会话，一旦已有转录历史，就会被视为绑定到 PI。更改配置后，如需让该对话切换到 Codex，请使用 `/new` 或 `/reset`。

`/status` 会显示生效的模型运行时。默认 PI harness 显示为
`Runtime: OpenClaw Pi Default`，Codex app-server harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，且内置 `codex` 插件可用。
- Codex app-server `0.125.0` 或更高版本。内置插件默认会管理一个兼容的 Codex app-server 二进制文件，因此 `PATH` 中本地的 `codex` 命令不会影响正常 harness 启动。
- app-server 进程可用的 Codex 认证。

该插件会阻止较旧或无版本的 app-server 握手。这可以确保
OpenClaw 只运行在它已经测试过的协议界面上。

对于实时和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，如 `~/.codex/auth.json` 和
`~/.codex/config.toml`。请使用与你本地 Codex app-server 相同的认证材料。

## 最小配置

使用 `openai/gpt-5.5`，启用内置插件，并强制使用 `codex` harness：

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

如果你的配置使用 `plugins.allow`，也要将 `codex` 包含在内：

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

如果旧版配置将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>`，仍会自动启用内置 `codex` 插件。新配置应优先使用 `openai/<model>`，并配合上面的显式 `agentRuntime` 条目。

## 将 Codex 与其他模型一起使用

如果同一个智能体应在 Codex 和非 Codex provider 模型之间自由切换，请不要全局设置 `agentRuntime.id: "codex"`。强制运行时会应用到该智能体或会话的每一个内嵌轮次。如果你在强制该运行时的情况下选择 Anthropic 模型，OpenClaw 仍会尝试 Codex harness，并以封闭失败的方式终止，而不是悄悄通过 PI 路由该轮次。

请改用以下其中一种结构：

- 将 Codex 放在专用智能体上，并设置 `agentRuntime.id: "codex"`。
- 对于普通的混合 provider 使用，让默认智能体保持 `agentRuntime.id: "auto"` 和 PI 回退。
- 仅将旧版 `codex/*` 引用用于兼容性。新配置应优先使用
  `openai/*`，并配合显式的 Codex 运行时策略。

例如，下面的配置会让默认智能体保持普通自动选择，
并额外添加一个独立的 Codex 智能体：

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

采用这种结构时：

- 默认的 `main` 智能体使用普通 provider 路径和 PI 兼容回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex，或 Codex 对其不受支持，该轮次会直接失败，
  而不是悄悄改用 PI。

## 智能体命令路由

智能体应根据用户意图路由请求，而不应仅仅因为出现了 “Codex” 这个词：

| 用户请求的是... | 智能体应使用... |
| --- | --- |
| “将这段聊天绑定到 Codex” | `/codex bind` |
| “在这里恢复 Codex 线程 `<id>`” | `/codex resume <id>` |
| “显示 Codex 线程” | `/codex threads` |
| “将 Codex 用作这个智能体的运行时” | 将 `agentRuntime.id` 改为相应配置 |
| “用我的 ChatGPT/Codex 订阅配合普通 OpenClaw” | `openai-codex/*` 模型引用 |
| “通过 ACP/acpx 运行 Codex” | ACP `sessions_spawn({ runtime: "acp", ... })` |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor” | ACP/acpx，而不是 `/codex`，也不是原生子智能体 |

只有在 ACP 已启用、可分派，并且背后有已加载的运行时后端时，
OpenClaw 才会向智能体展示 ACP 启动指南。如果 ACP 不可用，
系统提示和插件 Skills 就不应向智能体传授 ACP 路由方式。

## 仅使用 Codex 的部署

当你需要证明每一个内嵌智能体轮次都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不使用 PI 回退，因此
`fallback: "none"` 是可选的，但通常作为文档说明很有帮助：

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

在强制使用 Codex 的情况下，如果 Codex 插件被禁用、app-server 版本过旧，或 app-server 无法启动，OpenClaw 会尽早失败。只有在你明确希望由 PI 处理缺失的 harness 选择时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体使用 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体保持普通自动选择：

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

使用常规会话命令切换智能体和模型。`/new` 会创建一个全新的
OpenClaw 会话，而 Codex harness 会按需创建或恢复其 sidecar
app-server 线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，
并让下一个轮次再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果发现失败或超时，它会使用内置回退目录，包含：

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

## App-server 连接与策略

默认情况下，插件会在本地启动 OpenClaw 管理的 Codex 二进制，并使用：

```bash
codex app-server --listen stdio://
```

托管二进制被声明为内置插件运行时依赖，并与其他 `codex` 插件依赖一起分阶段部署。这样可以让 app-server 版本与内置插件保持绑定，而不是跟随本地恰好安装的某个独立 Codex CLI。只有当你明确希望运行其他可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是受信任的本地操作员姿态，用于自主心跳：Codex 可以使用 shell 和网络工具，而不会停在无人处理的原生批准提示上。

若要选择启用由 Codex guardian 审核的批准，请设置 `appServer.mode:
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

Guardian 模式使用 Codex 的原生自动审核批准路径。当 Codex 请求离开沙箱、写入工作区之外的位置，或添加诸如网络访问之类的权限时，Codex 会将该批准请求路由到原生审核器，而不是人工提示。审核器会应用 Codex 的风险框架，并批准或拒绝具体请求。当你希望比 YOLO 模式有更多护栏，但仍需要无人值守的智能体持续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
各个策略字段仍然可以覆盖 `mode`，因此高级部署可以将该预设与显式选择混合使用。较旧的 `guardian_subagent` 审核器值仍作为兼容别名被接受，但新配置应使用
`auto_review`。

对于已经在运行的 app-server，请使用 WebSocket 传输：

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

受支持的 `appServer` 字段：

| Field | Default | 含义 |
| --- | --- | --- |
| `transport` | `"stdio"` | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command` | 托管 Codex 二进制 | 用于 stdio 传输的可执行文件。保持未设置以使用托管二进制；仅在需要显式覆盖时设置。 |
| `args` | `["app-server", "--listen", "stdio://"]` | stdio 传输的参数。 |
| `url` | unset | WebSocket app-server URL。 |
| `authToken` | unset | WebSocket 传输的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket 头。 |
| `requestTimeoutMs` | `60000` | app-server 控制平面调用的超时时间。 |
| `mode` | `"yolo"` | YOLO 或 guardian 审核执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程 start/resume/turn 的原生 Codex 批准策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程 start/resume 的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"auto_review"` 可让 Codex 审核原生批准提示。`guardian_subagent` 仍是旧版别名。 |
| `serviceTier` | unset | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧值会被忽略。 |

本地测试仍可使用环境变量覆盖：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，
`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，更推荐使用配置方式，因为它能将插件行为与 Codex harness 其余设置保存在同一个经过审查的文件中。

## Computer Use

Computer Use 是一个 Codex 原生 MCP 插件。OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作；它会在请求时启用 Codex app-server 插件、安装已配置的 Codex marketplace 插件、检查 `computer-use` MCP 服务器是否可用，然后在 Codex 模式轮次中让 Codex 自行处理原生 MCP 工具调用。

当你希望 Codex 模式轮次强制要求 Computer Use 时，请设置
`plugins.entries.codex.config.computerUse`：

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
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

如果未提供 marketplace 字段，OpenClaw 会请求 Codex app-server 使用其发现到的 marketplaces。在全新的 Codex 主目录中，app-server 会预置官方精选 marketplace，而 OpenClaw 会遵循与 Codex 相同的加载方式：它会在安装期间轮询 `plugin/list`，然后才将 Computer Use 视为不可用。默认发现等待时间为 60 秒，可通过
`marketplaceDiscoveryTimeoutMs` 调整。如果多个已知 Codex marketplaces 都包含 Computer Use，OpenClaw 会先使用 Codex marketplace 的优先级顺序；如果仍出现未知的歧义匹配，则会以封闭失败的方式终止。

对于非默认的、app-server 可添加的 Codex marketplace 来源，请使用 `marketplaceSource`；对于机器上已经存在的本地 marketplace 文件，请使用 `marketplacePath`。如果该 marketplace 已经在 Codex app-server 中注册，请改用 `marketplaceName`。默认值为
`pluginName: "computer-use"` 和 `mcpServerName: "computer-use"`。
出于安全考虑，轮次开始时的自动安装只会使用 app-server 已发现的 marketplaces。若要从已配置的 `marketplaceSource` 或 `marketplacePath` 显式安装，请使用 `/codex computer-use install`。

也可以通过命令界面检查或安装同一套配置：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use 仅支持 macOS，并且在 Codex MCP 服务器控制应用之前，可能需要本地操作系统权限。如果 `computerUse.enabled` 为 true 且 MCP 服务器不可用，Codex 模式轮次会在线程启动前直接失败，而不是悄悄在没有原生 Computer Use 工具的情况下继续运行。

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

仅使用 Codex 的 harness 验证：

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

由 Guardian 审核的 Codex 批准：

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

带显式头部的远程 app-server：

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

模型切换仍由 OpenClaw 控制。当某个 OpenClaw 会话附加到现有 Codex 线程时，下一个轮次会再次向 app-server 发送当前选定的
OpenAI 模型、provider、批准策略、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选定的模型继续运行。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用的，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时的 app-server 连接性、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时的 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩当前附加的线程。
- `/codex review` 为当前附加的线程启动 Codex 原生审查。
- `/codex computer-use status` 检查已配置的 Computer Use 插件和 MCP 服务器。
- `/codex computer-use install` 安装已配置的 Computer Use 插件并重新加载 MCP 服务器。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 用于正常轮次相同的 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入 app-server，并保持扩展历史记录处于启用状态。

该命令界面要求 Codex app-server `0.125.0` 或更高版本。如果未来版本或自定义 app-server 未暴露对应 JSON-RPC 方法，各个控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层 | 所有者 | 目的 |
| --- | --- | --- |
| OpenClaw 插件钩子 | OpenClaw | 在 PI 和 Codex harness 之间提供产品/插件兼容性。 |
| Codex app-server 扩展中间件 | OpenClaw 内置插件 | 围绕 OpenClaw 动态工具的逐轮适配器行为。 |
| Codex 原生钩子 | Codex | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。 |

OpenClaw 不会使用项目级或全局 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，
OpenClaw 会为每个线程注入 Codex 配置，以处理 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop`。其他 Codex 钩子，例如 `SessionStart` 和
`UserPromptSubmit`，仍然属于 Codex 级控制；在 v1 合约中，它们不会作为
OpenClaw 插件钩子暴露。

对于 OpenClaw 动态工具，Codex 发出调用请求后，OpenClaw 才执行工具，因此
OpenClaw 会在 harness 适配器中触发其自有的插件和中间件行为。对于 Codex 原生工具，Codex 持有规范工具记录。OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子回调暴露该操作，否则它无法重写原生 Codex 线程。

压缩和 LLM 生命周期投影来自 Codex app-server 通知以及 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。OpenClaw 的
`before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是适配器级观察结果，并不是对 Codex 内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为 `codex_app_server.hook` 智能体事件，用于轨迹和调试。它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是“底层换了一个模型调用的 PI”。Codex 接管了更多原生模型循环，而 OpenClaw 会围绕这一边界适配其插件和会话界面。

Codex 运行时 v1 中支持的内容：

| 界面 | 支持情况 | 原因 |
| --- | --- | --- |
| 通过 Codex 运行 OpenAI 模型循环 | 支持 | Codex app-server 持有 OpenAI 轮次、原生线程恢复和原生工具续接。 |
| OpenClaw 渠道路由与投递 | 支持 | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道仍位于模型运行时之外。 |
| OpenClaw 动态工具 | 支持 | Codex 请求 OpenClaw 执行这些工具，因此 OpenClaw 仍在执行路径中。 |
| 提示词和上下文插件 | 支持 | OpenClaw 会在启动或恢复线程之前构建提示词覆盖层，并将上下文投影到 Codex 轮次中。 |
| Context engine 生命周期 | 支持 | 汇编、摄取或轮次后维护，以及 context engine 压缩协调都会对 Codex 轮次运行。 |
| 动态工具钩子 | 支持 | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕 OpenClaw 持有的动态工具运行。 |
| 生命周期钩子 | 作为适配器观察结果支持 | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会携带真实的 Codex 模式载荷触发。 |
| 最终答案修订门 | 通过原生钩子中继支持 | Codex `Stop` 会被中继到 `before_agent_finalize`；`revise` 会要求 Codex 在终结前再执行一次模型轮次。 |
| 原生 shell、patch 和 MCP 的阻止或观察 | 通过原生钩子中继支持 | Codex `PreToolUse` 和 `PostToolUse` 会对已提交的原生工具界面进行中继，包括 Codex app-server `0.125.0` 或更新版本中的 MCP 载荷。支持阻止；不支持参数重写。 |
| 原生权限策略 | 通过原生钩子中继支持 | 在运行时暴露该能力的情况下，Codex `PermissionRequest` 可以通过 OpenClaw 策略进行路由。如果 OpenClaw 未返回决定，Codex 会继续使用其正常的 guardian 或用户批准路径。 |
| App-server 轨迹捕获 | 支持 | OpenClaw 会记录它发送给 app-server 的请求以及收到的 app-server 通知。 |

Codex 运行时 v1 中不支持的内容：

| 界面 | V1 边界 | 未来路径 |
| --- | --- | --- |
| 原生工具参数变更 | Codex 原生预工具钩子可以阻止执行，但 OpenClaw 不会重写 Codex 原生工具参数。 | 需要 Codex 钩子/模式支持替换后的工具输入。 |
| 可编辑的 Codex 原生转录历史 | Codex 持有规范的原生线程历史。OpenClaw 持有镜像并可以投影未来上下文，但不应修改不受支持的内部结构。 | 如果需要对原生线程进行编辑，应添加显式的 Codex app-server API。 |
| 用于 Codex 原生工具记录的 `tool_result_persist` | 该钩子会转换由 OpenClaw 持有的转录写入，而不是 Codex 原生工具记录。 | 可以镜像转换后的记录，但要进行规范重写仍需要 Codex 支持。 |
| 丰富的原生压缩元数据 | OpenClaw 可以观察到压缩开始和完成，但不会收到稳定的保留/丢弃列表、token 增量或摘要载荷。 | 需要更丰富的 Codex 压缩事件。 |
| 压缩干预 | 当前 OpenClaw 的压缩钩子在 Codex 模式下仅处于通知级别。 | 如果插件需要否决或重写原生压缩，则需要添加 Codex 压缩前/后钩子。 |
| 逐字节的模型 API 请求捕获 | OpenClaw 可以捕获 app-server 请求和通知，但最终的 OpenAI API 请求由 Codex core 在内部构建。 | 需要 Codex 模型请求跟踪事件或调试 API。 |

## 工具、媒体和压缩

Codex harness 只改变底层的内嵌智能体执行器。

OpenClaw 仍然会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、批准以及消息工具输出，仍然继续通过常规 OpenClaw 投递路径传递。

原生钩子中继被刻意设计为通用机制，但 v1 支持合约仅限于 OpenClaw 已测试的 Codex 原生工具和权限路径。在 Codex 运行时中，这包括 shell、patch 和 MCP 的 `PreToolUse`、`PostToolUse` 以及 `PermissionRequest` 载荷。不要假设未来的每个 Codex 钩子事件都属于 OpenClaw 插件界面，除非运行时合约已明确命名。

对于 `PermissionRequest`，只有当策略作出决定时，OpenClaw 才会返回显式的允许或拒绝结果。无决定结果并不等于允许。Codex 会将其视为无钩子决定，并回退到自己的 guardian 或用户批准路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具批准征求会通过 OpenClaw 的插件批准流程进行路由。Codex 的 `request_user_input` 提示会被发送回原始聊天，而下一条排队的后续消息会回答该原生服务器请求，而不是作为额外上下文进行引导。其他 MCP 征求请求仍会以封闭失败方式处理。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex
app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换。该镜像包含用户提示词、最终助手文本，以及当 app-server 发出这些内容时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它还不会公开人类可读的压缩摘要，也不会提供 Codex 在压缩后保留了哪些条目的可审计列表。

由于 Codex 持有规范的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它只在 OpenClaw 正在写入由 OpenClaw 持有的会话转录工具结果时适用。

媒体生成不依赖 PI。图像、视频、音乐、PDF、TTS 和媒体理解会继续使用匹配的 provider/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 没有作为普通 `/model` provider 出现：** 这对新配置来说是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`agentRuntime.id: "codex"`（或使用旧版 `codex/*` 引用），启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用了 PI 而不是 Codex：** `agentRuntime.id: "auto"` 在没有任何 Codex harness 声明接管该运行时，仍可能使用 PI 作为兼容后端。测试时请设置 `agentRuntime.id: "codex"` 以强制选择 Codex。现在，强制的 Codex 运行时会直接失败，而不是回退到 PI，除非你显式设置了 `agentRuntime.fallback: "pi"`。一旦选定了 Codex app-server，其故障会直接暴露出来，而不会再经过额外的回退配置。

**app-server 被拒绝：** 请升级 Codex，使 app-server 握手报告的版本为 `0.125.0` 或更高。相同版本号的预发布版或带构建后缀的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，都会被拒绝，因为 OpenClaw 测试的稳定协议下限是 `0.125.0`。

**模型发现速度很慢：** 调低
`plugins.entries.codex.config.discovery.timeoutMs`，或禁用发现。

**WebSocket 传输立即失败：** 请检查 `appServer.url`、`authToken`，以及远程 app-server 是否使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用了 PI：** 这是预期行为，除非你为该智能体强制设置了 `agentRuntime.id: "codex"`，或选择了旧版
`codex/*` 引用。普通的 `openai/gpt-*` 和其他 provider 引用在 `auto` 模式下仍会走它们的常规 provider 路径。如果你强制设置了
`agentRuntime.id: "codex"`，则该智能体的每一个内嵌轮次都必须是 Codex 支持的 OpenAI 模型。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [Plugin hooks](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
