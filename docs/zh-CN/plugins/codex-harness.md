---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在失败时直接报错，而不是回退到 Pi
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-27T23:52:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: c048ff928fb0b601b6a75631f9e33bbf23d08d1c21ad762b22ac3fb182d862ff
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 通过 Codex app-server，而不是内置的 Pi harness，来运行嵌入式智能体轮次。

当你希望由 Codex 接管底层智能体会话时，请使用此方式：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体投递，以及可见的转录镜像。

如果你正在熟悉这一部分，请先从 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。简而言之：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、
Discord、Slack 或其他渠道仍然是通信界面。

## 此插件会改变什么

内置的 `codex` 插件提供若干彼此独立的能力：

| 能力 | 你的使用方式 | 它的作用 |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式运行时 | `agentRuntime.id: "codex"` | 通过 Codex app-server 运行 OpenClaw 嵌入式智能体轮次。 |
| 原生聊天控制命令 | `/codex bind`, `/codex resume`, `/codex steer`, ... | 在消息会话中绑定并控制 Codex app-server 线程。 |
| Codex app-server 提供商/目录 | `codex` 内部机制，通过 harness 暴露 | 让运行时发现并验证 app-server 模型。 |
| Codex 媒体理解路径 | `codex/*` 图像模型兼容路径 | 为受支持的图像理解模型运行受限的 Codex app-server 轮次。 |
| 原生 hook 转发 | 围绕 Codex 原生事件的插件钩子 | 让 OpenClaw 观察/拦截受支持的 Codex 原生工具/终结事件。 |

启用该插件会使这些能力可用。它**不会**：

- 开始对每个 OpenAI 模型都使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 让 ACP/acpx 成为默认的 Codex 路径
- 热切换已经记录为 Pi 运行时的现有会话
- 替换 OpenClaw 的渠道投递、会话文件、auth-profile 存储或消息路由

同一个插件也负责原生 `/codex` 聊天控制命令界面。如果
插件已启用，并且用户要求从聊天中绑定、恢复、引导、停止或检查
Codex 线程，智能体应优先使用 `/codex ...` 而不是 ACP。只有当用户明确要求 ACP/acpx，或正在测试 ACP
Codex 适配器时，ACP 才是显式回退路径。

原生 Codex 轮次仍将 OpenClaw 插件钩子作为公共兼容层。
这些是进程内的 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- 通过 Codex `Stop` 转发的 `before_agent_finalize`
- `agent_end`

插件还可以注册运行时无关的工具结果中间件，在 OpenClaw 执行工具之后、并在结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公共
`tool_result_persist` 插件钩子不同，后者会转换由 OpenClaw 拥有的转录工具结果写入。

关于插件钩子语义本身，请参见 [Plugin hooks](/zh-CN/plugins/hooks)
和 [Plugin guard behavior](/zh-CN/tools/plugin)。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用
规范为 `openai/gpt-*`，并在希望使用原生 app-server 执行时显式强制
`agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。
旧版 `codex/*` 模型引用仍会自动选择该 harness 以保持兼容，但由运行时支持的旧版提供商前缀不会显示为普通模型/提供商选项。

如果启用了 `codex` 插件，但主模型仍然是
`openai-codex/*`，`openclaw doctor` 会给出警告，而不是更改路由。这是
有意为之：`openai-codex/*` 仍然是 Pi Codex OAuth/订阅路径，而
原生 app-server 执行仍然是一个显式的运行时选择。

## 路由映射

在更改配置之前，请先使用此表：

| 期望行为 | 模型引用 | 运行时配置 | 插件要求 | 预期 Status 标签 |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通过普通 OpenClaw 运行器使用 OpenAI API | `openai/gpt-*` | 省略或 `runtime: "pi"` | OpenAI provider | `Runtime: OpenClaw Pi Default` |
| 通过 Pi 使用 Codex OAuth/订阅 | `openai-codex/gpt-*` | 省略或 `runtime: "pi"` | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 嵌入式轮次 | `openai/gpt-*` | `agentRuntime.id: "codex"` | `codex` 插件 | `Runtime: OpenAI Codex` |
| 启用保守自动模式的混合提供商 | 提供商特定引用 | `agentRuntime.id: "auto"` | 可选插件运行时 | 取决于所选运行时 |
| 显式 Codex ACP 适配器会话 | 取决于 ACP prompt/model | `sessions_spawn` 搭配 `runtime: "acp"` | 健康的 `acpx` 后端 | ACP 任务/会话状态 |

这里最重要的区分是提供商与运行时：

- `openai-codex/*` 回答的是“Pi 应该使用哪条提供商/认证路径？”
- `agentRuntime.id: "codex"` 回答的是“哪个 loop 应该执行这次
  嵌入式轮次？”
- `/codex ...` 回答的是“此聊天应绑定或控制哪个原生 Codex 会话？”
- ACP 回答的是“acpx 应启动哪个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 系列路由对前缀很敏感。当你希望
通过 Pi 使用 Codex OAuth 时，请使用 `openai-codex/*`；当你希望直接使用 OpenAI API，或
当你强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| 模型引用 | 运行时路径 | 使用场景 |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | 通过 OpenClaw/Pi 流程使用 OpenAI provider | 你希望使用 `OPENAI_API_KEY` 访问当前的 OpenAI Platform API。 |
| `openai-codex/gpt-5.5` | 通过 OpenClaw/Pi 使用 OpenAI Codex OAuth | 你希望使用默认 Pi 运行器，通过 ChatGPT/Codex 订阅认证。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness | 你希望为嵌入式智能体轮次使用原生 Codex app-server 执行。 |

GPT-5.5 目前在 OpenClaw 中仅支持订阅/OAuth。请使用
`openai-codex/gpt-5.5` 进行 Pi OAuth，或使用 `openai/gpt-5.5` 搭配 Codex
app-server harness。一旦 OpenAI 在公共 API 上启用 GPT-5.5，
就支持通过 API key 直接访问 `openai/gpt-5.5`。

旧版 `codex/gpt-*` 引用仍然接受为兼容性别名。Doctor
兼容迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略；而仅用于回退的旧版引用则保持不变，因为运行时是针对整个智能体容器配置的。
新的 Pi Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生
app-server harness 配置应使用 `openai/gpt-*`，并加上
`agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 也遵循相同的前缀区分。如果你希望图像理解通过 OpenAI
Codex OAuth 提供商路径运行，请使用 `openai-codex/gpt-*`。如果你希望图像理解通过受限的 Codex app-server 轮次运行，请使用
`codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始之前失败。

使用 `/status` 来确认当前会话实际使用的 harness。如果结果出乎意料，请为 `agents/harness` 子系统启用调试日志，
并检查 Gateway 网关中的结构化 `agent harness selected` 记录。它
包含所选 harness id、选择原因、运行时/回退策略，以及在
`auto` 模式下，每个插件候选项的支持结果。

### doctor 警告意味着什么

当以下条件全部满足时，`openclaw doctor` 会发出警告：

- 内置的 `codex` 插件已启用或被允许
- 某个智能体的主模型是 `openai-codex/*`
- 该智能体的实际运行时不是 `codex`

之所以有这个警告，是因为用户经常认为“已启用 Codex 插件”就意味着
“使用原生 Codex app-server 运行时”。OpenClaw 不会自动做出这种推断。这个警告表示：

- 如果你本来就打算通过 Pi 使用 ChatGPT/Codex OAuth，**则无需更改**。
- 如果你想使用原生 app-server
  执行，请将模型改为 `openai/<model>`，并设置
  `agentRuntime.id: "codex"`。
- 现有会话在运行时更改后仍需要 `/new` 或 `/reset`，
  因为会话运行时固定是粘性的。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，
OpenClaw 会在该会话上记录所选的 harness id，并在同一会话 id 的后续轮次中继续使用它。当你希望未来的会话使用另一个 harness 时，请更改 `agentRuntime` 配置或
`OPENCLAW_AGENT_RUNTIME`；在现有会话于 Pi 和 Codex 之间切换之前，请使用 `/new` 或 `/reset` 启动新会话。
这样可以避免通过两个不兼容的原生会话系统来重放同一份转录。

在 harness 固定机制引入之前创建的旧会话，只要它们已有转录历史，
就会被视为固定到 Pi。更改配置后，如需让该会话改用
Codex，请使用 `/new` 或 `/reset`。

`/status` 会显示实际的模型运行时。默认的 Pi harness 显示为
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，且内置 `codex` 插件可用。
- Codex app-server `0.125.0` 或更高版本。内置插件默认会管理兼容的
  Codex app-server 二进制文件，因此 `PATH` 上本地的 `codex` 命令
  不会影响正常的 harness 启动。
- app-server 进程或 OpenClaw 的 Codex auth
  bridge 可用的 Codex 认证。

该插件会阻止较旧或未带版本的 app-server 握手。这能让
OpenClaw 保持在它已测试过的协议接口上。

对于 live 和 Docker 冒烟测试，认证通常来自 Codex CLI 账户
或 OpenClaw `openai-codex` auth profile。本地 stdio app-server 启动
在没有账户时，也可以回退到 `CODEX_API_KEY` / `OPENAI_API_KEY`。

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

如果你的配置使用 `plugins.allow`，也请将 `codex` 包含进去：

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

旧配置如果将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>`，仍会自动启用内置 `codex` 插件。新配置应优先
使用 `openai/<model>`，并配合上面的显式 `agentRuntime` 条目。

## 将 Codex 与其他模型一起使用

如果同一个智能体应该在 Codex 和非 Codex 提供商模型之间自由切换，请不要全局设置 `agentRuntime.id: "codex"`。
强制运行时会应用到该智能体或会话的每一次
嵌入式轮次。如果你在强制该运行时的情况下选择了 Anthropic 模型，
OpenClaw 仍会尝试使用 Codex harness，并且会以失败关闭的方式报错，而不是静默地通过 Pi 路由该轮次。

请改用以下其中一种方式：

- 将 Codex 放到一个专用智能体上，并设置 `agentRuntime.id: "codex"`。
- 将默认智能体保持为 `agentRuntime.id: "auto"`，并为常规混合
  提供商使用保留 Pi 回退。
- 仅将旧版 `codex/*` 引用用于兼容性。新配置应优先使用
  `openai/*`，再加上显式的 Codex 运行时策略。

例如，下面的配置会让默认智能体保持正常的自动选择，
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

采用这种方式：

- 默认的 `main` 智能体使用常规提供商路径和 Pi 兼容性回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex，或 Codex 对其不受支持，该轮次会直接失败，
  而不是悄悄改为使用 Pi。

## 智能体命令路由

智能体应根据用户意图来路由请求，而不只是看到 “Codex” 这个词：

| 用户要求的是... | 智能体应使用... |
| -------------------------------------------------------- | ------------------------------------------------ |
| “将此聊天绑定到 Codex” | `/codex bind` |
| “在这里恢复 Codex 线程 `<id>`” | `/codex resume <id>` |
| “显示 Codex 线程” | `/codex threads` |
| “将 Codex 用作此智能体的运行时” | 将配置改为 `agentRuntime.id` |
| “用我的 ChatGPT/Codex 订阅配合普通 OpenClaw” | `openai-codex/*` 模型引用 |
| “通过 ACP/acpx 运行 Codex” | ACP `sessions_spawn({ runtime: "acp", ... })` |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor” | ACP/acpx，而不是 `/codex`，也不是原生子智能体 |

只有在 ACP 已启用、可分发，并且由已加载的运行时后端支持时，
OpenClaw 才会向智能体公开 ACP 启动指引。如果 ACP 不可用，
系统提示和插件 Skills 不应向智能体传授 ACP
路由方式。

## 仅使用 Codex 的部署

当你需要证明每个嵌入式智能体轮次
都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不会回退到 Pi，因此
`fallback: "none"` 是可选的，但通常有助于作为文档说明：

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

强制使用 Codex 后，如果 Codex 插件被禁用、app-server
版本过旧，或 app-server 无法启动，OpenClaw 会尽早失败。只有在你确实希望 Pi 处理
缺失的 harness 选择时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体配置 Codex

你可以让某一个智能体仅使用 Codex，同时让默认智能体保持正常的
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

使用普通会话命令即可切换智能体和模型。`/new` 会创建一个全新的
OpenClaw 会话，而 Codex harness 会根据需要创建或恢复其附属 app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，
并让下一轮再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果
发现失败或超时，它会使用内置的回退目录，包含：

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

如果你希望启动时避免探测 Codex，并固定使用
回退目录，请禁用发现：

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

默认情况下，插件会在本地使用以下命令启动 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

该受管二进制文件被声明为内置插件运行时依赖，并与
`codex` 插件的其他依赖一起暂存。
这样可以将 app-server 版本绑定到内置插件，而不是绑定到本地碰巧安装的独立 Codex CLI。
只有在你明确希望运行其他可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于
自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而无需停下来等待
无人可答复的原生审批提示。

若要启用由 Codex guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 模式使用 Codex 原生自动审核审批路径。当 Codex 请求
离开沙箱、在工作区外写入，或添加网络访问等权限时，
Codex 会将该审批请求路由给原生审核者，而不是向人类发出提示。
审核者会应用 Codex 的风险框架，并批准或拒绝该具体请求。当你希望有比 YOLO 模式更多的防护，
但仍需要无人值守的智能体持续推进工作时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
各个策略字段仍然可以覆盖 `mode`，因此高级部署可以将
该预设与显式选择混用。较旧的 `guardian_subagent` 审核者值
仍接受为兼容性别名，但新配置应使用
`auto_review`。

对于已在运行的 app-server，请使用 WebSocket 传输：

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

默认情况下，stdio app-server 启动会继承 OpenClaw 的进程环境，
但 OpenClaw 负责 Codex app-server 账户 bridge。认证按以下顺序选择：

1. 智能体的显式 OpenClaw Codex auth profile。
2. app-server 现有的账户，例如本地 Codex CLI ChatGPT 登录。
3. 仅对本地 stdio app-server 启动，当不存在 app-server 账户且仍需要 OpenAI 认证时，依次使用 `CODEX_API_KEY`，然后
   `OPENAI_API_KEY`。

当 OpenClaw 识别到 ChatGPT 订阅风格的 Codex auth profile 时，它会从已启动的 Codex 子进程中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。
这样既能保留 Gateway 网关级别的 API key 供 embeddings 或直接 OpenAI 模型使用，
又能避免原生 Codex app-server 轮次意外通过 API 计费。
显式的 Codex API-key profile 和本地 stdio 环境变量 key 回退会使用
app-server 登录，而不是继承子进程环境。WebSocket app-server 连接
不会接收 Gateway 网关环境变量 API key 回退；请使用显式 auth profile，或使用远程
app-server 自身的账户。

如果某个部署需要额外的环境隔离，请将这些变量添加到
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

`appServer.clearEnv` 只会影响已启动的 Codex app-server 子进程。

支持的 `appServer` 字段：

| 字段 | 默认值 | 含义 |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport` | `"stdio"` | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command` | 受管 Codex 二进制文件 | 用于 stdio 传输的可执行文件。保持未设置即可使用受管二进制文件；仅在明确覆盖时设置。 |
| `args` | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。 |
| `url` | 未设置 | WebSocket app-server URL。 |
| `authToken` | 未设置 | 用于 WebSocket 传输的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket headers。 |
| `clearEnv` | `[]` | 在 OpenClaw 构建完继承环境后，从已启动的 stdio app-server 进程中额外移除的环境变量名。 |
| `requestTimeoutMs` | `60000` | app-server 控制平面调用的超时时间。 |
| `mode` | `"yolo"` | 用于 YOLO 或 guardian 审核执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程启动/恢复的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"auto_review"` 可让 Codex 审核原生审批提示。`guardian_subagent` 仍是旧版别名。 |
| `serviceTier` | 未设置 | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧值会被忽略。 |

环境变量覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过受管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，更推荐使用配置，
因为这样可以将插件行为与 Codex harness 设置的其余部分保存在同一个经审查的文件中。

## Computer Use

Computer Use 在其单独的设置指南中说明：
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

简而言之：OpenClaw 不会内置桌面控制应用，也不会自行执行
桌面操作。它会准备 Codex app-server，验证
`computer-use` MCP 服务器是否可用，然后在 Codex 模式轮次期间让 Codex 处理原生
MCP 工具调用。

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

可以通过命令界面检查或安装该设置：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use 仅适用于 macOS，并且在 Codex MCP
服务器能够控制应用之前，可能需要本地操作系统权限。如果 `computerUse.enabled` 为 true，而 MCP
服务器不可用，则 Codex 模式轮次会在线程启动前失败，而不是在没有原生 Computer Use 工具的情况下静默运行。有关
marketplace 选择、远程目录限制、状态原因和故障排除，请参见
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

当 `computerUse.autoInstall` 为 true 时，如果 Codex 尚未发现本地 marketplace，
OpenClaw 可以从
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 注册标准的内置 Codex Desktop marketplace。更改运行时或 Computer Use 配置后，请使用 `/new` 或 `/reset`，
以免现有会话继续保留旧的 Pi 或 Codex 线程绑定。

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

由 Guardian 审核的 Codex 审批：

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有的 Codex 线程时，
下一轮会再次将当前选定的
OpenAI 模型、提供商、审批策略、沙箱和服务层级发送给
app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留
线程绑定，但会要求 Codex 使用新选定的模型继续。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用的，
可在任何支持 OpenClaw 文本命令的渠道上工作。

常见形式：

- `/codex status` 显示实时 app-server 连通性、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加线程启动 Codex 原生审查。
- `/codex computer-use status` 检查已配置的 Computer Use 插件和 MCP 服务器。
- `/codex computer-use install` 安装已配置的 Computer Use 插件并重新加载 MCP 服务器。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 在
正常轮次中使用的同一个附属绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，向
app-server 传入当前选定的 OpenClaw 模型，并保持启用扩展历史记录。

该命令界面要求使用 Codex app-server `0.125.0` 或更高版本。如果未来或自定义的 app-server 未暴露相应的 JSON-RPC 方法，
各个控制方法会显示为 `unsupported by this Codex app-server`。

## Hook 边界

Codex harness 有三层 hook：

| 层级 | 所有者 | 目的 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子 | OpenClaw | 提供跨 Pi 和 Codex harness 的产品/插件兼容性。 |
| Codex app-server 扩展中间件 | OpenClaw 内置插件 | 围绕 OpenClaw 动态工具的逐轮适配器行为。 |
| Codex 原生 hooks | Codex | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。 |

OpenClaw 不会使用项目级或全局 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，
OpenClaw 会为 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop` 注入逐线程 Codex 配置。其他 Codex hooks，如 `SessionStart` 和
`UserPromptSubmit`，仍然是 Codex 级控制；在 v1 合约中，它们不会作为
OpenClaw 插件钩子暴露。

对于 OpenClaw 动态工具，在 Codex 请求调用后，OpenClaw 才会执行该工具，因此
OpenClaw 会在
harness 适配器中触发其所拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范的工具记录。
OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生 hook
回调暴露该操作，否则它无法改写原生 Codex
线程。

压缩和 LLM 生命周期投影来自 Codex app-server
通知以及 OpenClaw 适配器状态，而不是原生 Codex hook 命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是适配器级观察结果，而不是对
Codex 内部请求或压缩负载的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知
会投影为 `codex_app_server.hook` 智能体事件，用于轨迹记录和调试。
它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是仅仅在底层换了模型调用的 Pi。Codex 接管了更多
原生模型 loop，而 OpenClaw 会围绕这一边界来适配其插件和会话界面。

Codex runtime v1 中支持的内容：

| 界面 | 支持情况 | 原因 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型 loop | 支持 | Codex app-server 负责 OpenAI 轮次、原生线程恢复和原生工具续接。 |
| OpenClaw 渠道路由与投递 | 支持 | Telegram、Discord、Slack、WhatsApp、iMessage 及其他渠道保持在模型运行时之外。 |
| OpenClaw 动态工具 | 支持 | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍在执行路径中。 |
| Prompt 和上下文插件 | 支持 | OpenClaw 会在启动或恢复线程前构建 prompt 覆盖层，并将上下文投射到 Codex 轮次中。 |
| 上下文引擎生命周期 | 支持 | Codex 轮次会运行 assemble、ingest 或轮次后维护，以及上下文引擎压缩协调。 |
| 动态工具 hooks | 支持 | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕 OpenClaw 拥有的动态工具运行。 |
| 生命周期 hooks | 作为适配器观察结果受支持 | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式负载触发。 |
| 最终答案修订门控 | 通过原生 hook 转发支持 | Codex `Stop` 会转发到 `before_agent_finalize`；`revise` 会在最终完成前请求 Codex 再进行一次模型轮次。 |
| 原生 shell、patch 和 MCP 的拦截或观察 | 通过原生 hook 转发支持 | Codex `PreToolUse` 和 `PostToolUse` 会为已提交的原生工具界面进行转发，包括 Codex app-server `0.125.0` 或更高版本中的 MCP 负载。支持拦截；不支持参数改写。 |
| 原生权限策略 | 通过原生 hook 转发支持 | 当运行时暴露该能力时，Codex `PermissionRequest` 可以通过 OpenClaw 策略路由。如果 OpenClaw 不返回决定，Codex 会继续走其正常的 guardian 或用户审批路径。 |
| App-server 轨迹捕获 | 支持 | OpenClaw 会记录其发送给 app-server 的请求，以及从 app-server 接收到的通知。 |

Codex runtime v1 中不支持的内容：

| 界面 | V1 边界 | 未来路径 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更 | Codex 原生 pre-tool hooks 可以拦截，但 OpenClaw 不会改写 Codex 原生工具参数。 | 需要 Codex hook/schema 支持替换工具输入。 |
| 可编辑的 Codex 原生转录历史 | Codex 拥有规范的原生线程历史。OpenClaw 拥有一个镜像，并可以投射未来上下文，但不应修改不受支持的内部结构。 | 如果需要原生线程手术能力，应添加显式的 Codex app-server API。 |
| 用于 Codex 原生工具记录的 `tool_result_persist` | 该 hook 转换的是由 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。 | 可以镜像转换后的记录，但规范改写需要 Codex 支持。 |
| 丰富的原生压缩元数据 | OpenClaw 可以观察到压缩开始和完成，但不会收到稳定的保留/丢弃列表、token 差值或摘要负载。 | 需要更丰富的 Codex 压缩事件。 |
| 压缩干预 | 当前 OpenClaw 的压缩 hooks 在 Codex 模式下仅为通知级。 | 如果插件需要否决或改写原生压缩，则需要添加 Codex pre/post compaction hooks。 |
| 逐字节的模型 API 请求捕获 | OpenClaw 可以捕获 app-server 请求和通知，但最终的 OpenAI API 请求由 Codex 核心在内部构建。 | 需要 Codex 模型请求追踪事件或调试 API。 |

## 工具、媒体与压缩

Codex harness 只改变底层的嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从
harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批和消息工具输出
仍然通过正常的 OpenClaw 投递路径继续处理。

原生 hook 转发被有意设计为通用机制，但 v1 支持合约仅限于 OpenClaw 已测试的 Codex 原生工具和权限路径。在
Codex runtime 中，这包括 shell、patch 和 MCP 的 `PreToolUse`、
`PostToolUse` 以及 `PermissionRequest` 负载。不要假设未来每个
Codex hook 事件都会成为 OpenClaw 插件界面，除非运行时合约明确命名了它。

对于 `PermissionRequest`，只有在策略做出决定时，OpenClaw 才会返回明确的允许或拒绝决定。
无决定结果并不等于允许。Codex 会将其视为没有
hook 决定，并回退到其自身的 guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件
审批流程进行路由。Codex 的 `request_user_input` 提示会被发回
发起聊天，而下一条排队的后续消息会回答该原生
服务器请求，而不是作为额外上下文进行引导。其他 MCP 征询请求仍会以失败关闭方式处理。

当所选模型使用 Codex harness 时，原生线程压缩会委托给
Codex app-server。OpenClaw 仍会保留一个转录镜像，用于渠道
历史记录、搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该
镜像包括用户 prompt、最终助手文本，以及当 app-server 发出时的轻量级 Codex
推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未公开
人类可读的压缩摘要，也未提供 Codex 在压缩后保留了哪些条目的
可审计列表。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前不会
改写 Codex 原生工具结果记录。它仅适用于
OpenClaw 正在写入由 OpenClaw 拥有的会话转录工具结果时。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解
仍然继续使用匹配的提供商/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和
`messages.tts`。

## 故障排除

**Codex 没有显示为普通的 `/model` 提供商：** 这对于
新配置是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`agentRuntime.id: "codex"`（或使用旧版 `codex/*` 引用），启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用的是 Pi 而不是 Codex：** 当没有 Codex harness 认领该运行时，`agentRuntime.id: "auto"` 仍可能使用 Pi 作为
兼容性后端。测试时请设置
`agentRuntime.id: "codex"` 以强制选择 Codex。现在，强制的 Codex
运行时会直接失败，而不是回退到 Pi，除非你
显式设置 `agentRuntime.fallback: "pi"`。一旦选择了 Codex app-server，
其失败会直接暴露出来，而不需要额外的回退配置。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手
报告版本 `0.125.0` 或更高。相同版本号的预发布版或带构建后缀的
版本，如 `0.125.0-alpha.2` 或 `0.125.0+custom`，都会被拒绝，因为
OpenClaw 测试的是稳定版 `0.125.0` 协议下限。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现功能。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，
以及远程 app-server 是否使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用了 Pi：** 这是预期行为，除非你为该智能体强制设置了
`agentRuntime.id: "codex"`，或者选择了旧版
`codex/*` 引用。普通的 `openai/gpt-*` 和其他提供商引用在 `auto` 模式下仍会走其正常
提供商路径。如果你强制设置了 `agentRuntime.id: "codex"`，那么该智能体的每一次嵌入式
轮次都必须是 Codex 支持的 OpenAI 模型。

**Computer Use 已安装，但工具无法运行：** 请在新会话中检查
`/codex computer-use status`。如果某个工具报告
`Native hook relay unavailable`，请使用 `/new` 或 `/reset`；如果仍然存在，请重启
Gateway 网关以清除过期的原生 hook 注册。如果 `computer-use.list_apps`
超时，请重启 Codex Computer Use 或 Codex Desktop 后重试。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Model providers](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [Plugin hooks](/zh-CN/plugins/hooks)
- [Configuration reference](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
