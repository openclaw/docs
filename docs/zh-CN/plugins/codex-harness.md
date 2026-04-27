---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在失败时直接报错，而不是回退到 Pi
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-27T23:00:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: d21933bd4646434fdd1d087eaf27e5f230c70df9515ebffd37e2b2ce8c1ab64c
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 通过 Codex app-server，而不是内置的 Pi harness，运行嵌入式智能体轮次。

当你希望 Codex 接管底层智能体会话时，请使用它：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

如果你正在熟悉相关概念，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简而言之：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、
Discord、Slack 或其他渠道仍然是通信界面。

## 这个插件会带来哪些变化

内置的 `codex` 插件提供了几项彼此独立的能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式运行时                  | `agentRuntime.id: "codex"`                          | 通过 Codex app-server 运行 OpenClaw 嵌入式智能体轮次。                        |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 在消息会话中绑定并控制 Codex app-server 线程。                                |
| Codex app-server 提供商/目录      | `codex` internals, surfaced through the harness     | 让运行时能够发现并验证 app-server 模型。                                      |
| Codex 媒体理解路径                | `codex/*` image-model compatibility paths           | 为受支持的图像理解模型运行受限的 Codex app-server 轮次。                      |
| 原生 hook 中继                    | Plugin hooks around Codex-native events             | 让 OpenClaw 观察/拦截受支持的 Codex 原生工具/终结事件。                       |

启用该插件会使这些能力可用。它**不会**：

- 开始对每个 OpenAI 模型都使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 让 ACP/acpx 成为默认的 Codex 路径
- 热切换已经记录为 Pi 运行时的现有会话
- 替换 OpenClaw 的渠道传递、会话文件、auth-profile 存储或消息路由

同一个插件也负责原生 `/codex` 聊天控制命令界面。如果
插件已启用，且用户要求从聊天中绑定、恢复、引导、停止或检查
Codex 线程，智能体应优先使用 `/codex ...`，而不是 ACP。只有当用户明确要求 ACP/acpx，或正在测试 ACP
Codex 适配器时，ACP 才是显式回退选项。

原生 Codex 轮次会保留 OpenClaw 插件钩子作为公共兼容层。
这些是进程内的 OpenClaw 插件钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`，用于镜像转录记录
- `before_agent_finalize`，通过 Codex `Stop` 中继
- `agent_end`

插件还可以注册与运行时无关的工具结果中间件，用于在 OpenClaw 执行工具之后、将结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公共
`tool_result_persist` 插件钩子是分开的，后者会转换由 OpenClaw 持有的转录工具结果写入。

关于插件钩子语义本身，请参见 [Plugin hooks](/zh-CN/plugins/hooks)
和 [Plugin guard behavior](/zh-CN/tools/plugin)。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用
规范为 `openai/gpt-*`，并在需要原生 app-server 执行时
显式强制使用 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。
旧版的 `codex/*` 模型引用仍会自动选择该 harness 以保持兼容，但由运行时支持的旧版提供商前缀不会显示为普通的模型/提供商选项。

如果启用了 `codex` 插件，但主模型仍然是
`openai-codex/*`，`openclaw doctor` 会发出警告，而不是更改路由。这是有意为之：`openai-codex/*` 仍然是 Pi 的 Codex OAuth/订阅路径，而原生 app-server 执行始终是显式的运行时选择。

## 路由映射

修改配置前，请先查看下表：

| 期望行为                                  | 模型引用                   | 运行时配置                             | 插件要求                    | 预期 Status 标签               |
| ----------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通过常规 OpenClaw 运行器使用 OpenAI API   | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI provider             | `Runtime: OpenClaw Pi Default` |
| 通过 Pi 使用 Codex OAuth/订阅             | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 嵌入式轮次          | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` 插件                | `Runtime: OpenAI Codex`        |
| 使用保守自动模式的混合提供商              | 提供商特定引用             | `agentRuntime.id: "auto"`              | 可选插件运行时              | 取决于所选运行时               |
| 显式 Codex ACP 适配器会话                 | 取决于 ACP prompt/model    | `sessions_spawn` with `runtime: "acp"` | 健康的 `acpx` 后端          | ACP 任务/会话 Status           |

关键区别在于提供商与运行时：

- `openai-codex/*` 回答的是“Pi 应该使用哪条提供商/认证路径？”
- `agentRuntime.id: "codex"` 回答的是“这个嵌入式轮次应由哪个循环执行？”
- `/codex ...` 回答的是“这个聊天应绑定或控制哪个原生 Codex 对话？”
- ACP 回答的是“acpx 应该启动哪个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 系列路由对前缀非常敏感。当你希望通过 Pi 使用
Codex OAuth 时，请使用 `openai-codex/*`；当你希望直接使用 OpenAI API，或
强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| 模型引用                                      | 运行时路径                                     | 使用场景                                                                  |
| --------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 通过 OpenClaw/Pi 管道使用 OpenAI provider      | 你希望通过 `OPENAI_API_KEY` 使用当前直接 OpenAI Platform API 访问。       |
| `openai-codex/gpt-5.5`                        | 通过 OpenClaw/Pi 使用 OpenAI Codex OAuth       | 你希望通过默认 Pi 运行器使用 ChatGPT/Codex 订阅认证。                     |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                       | 你希望嵌入式智能体轮次使用原生 Codex app-server 执行。                    |

GPT-5.5 目前在 OpenClaw 中仅支持订阅/OAuth。对于 Pi OAuth，请使用
`openai-codex/gpt-5.5`；对于 Codex
app-server harness，请使用 `openai/gpt-5.5` 并配合 `agentRuntime.id: "codex"`。
一旦 OpenAI 在公共 API 上启用 GPT-5.5，`openai/gpt-5.5` 也将支持直接 API key 访问。

旧版 `codex/gpt-*` 引用仍然作为兼容别名被接受。Doctor
兼容迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略；而仅用于回退的旧版引用将保持不变，因为运行时是针对整个智能体容器配置的。
新的 Pi Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生
app-server harness 配置应使用 `openai/gpt-*`，再加上
`agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 也遵循相同的前缀区分。当图像理解应通过 OpenAI
Codex OAuth provider 路径运行时，请使用
`openai-codex/gpt-*`。当图像理解应通过受限的 Codex app-server 轮次运行时，请使用
`codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；仅文本的 Codex 模型会在媒体轮次开始前直接失败。

使用 `/status` 确认当前会话实际生效的 harness。如果选择结果出乎你的预期，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关的结构化
`agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

### doctor 警告意味着什么

当以下条件全部满足时，`openclaw doctor` 会发出警告：

- 内置的 `codex` 插件已启用或被允许
- 某个智能体的主模型是 `openai-codex/*`
- 该智能体的有效运行时不是 `codex`

之所以会有这个警告，是因为用户常常会认为“已启用 Codex 插件”就意味着“使用原生 Codex app-server 运行时”。OpenClaw 不会自动做出这种推断。该警告意味着：

- 如果你本来就是想通过 Pi 使用 ChatGPT/Codex OAuth，**则无需做任何更改**。
- 如果你本来想使用原生 app-server 执行，请将模型改为 `openai/<model>`，并设置
  `agentRuntime.id: "codex"`。
- 运行时变更后，现有会话仍然需要执行 `/new` 或 `/reset`，
  因为会话运行时固定是粘性的。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，
OpenClaw 会在该会话上记录所选 harness id，并在同一会话 id 的后续轮次中继续使用它。若你希望未来的会话使用其他 harness，请更改 `agentRuntime` 配置或
`OPENCLAW_AGENT_RUNTIME`；若要在现有对话中切换
Pi 与 Codex，请先使用 `/new` 或 `/reset` 启动一个全新会话。
这样可以避免把同一份转录通过两个彼此不兼容的原生会话系统重放。

在引入 harness 固定机制之前创建的旧会话，一旦拥有转录历史，就会被视为固定到 Pi。更改配置后，如需让该对话改用 Codex，请使用 `/new` 或 `/reset`。

`/status` 会显示实际生效的模型运行时。默认的 Pi harness 会显示为
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 会显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，且内置的 `codex` 插件可用。
- Codex app-server `0.125.0` 或更高版本。内置插件默认会管理兼容的
  Codex app-server 二进制文件，因此 `PATH` 上本地的 `codex` 命令不会影响正常的 harness 启动。
- app-server 进程可用的 Codex 认证信息。

该插件会阻止较旧或无版本号的 app-server 握手。这可确保
OpenClaw 始终运行在它已经过测试的协议界面上。

对于 live 和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的
Codex CLI 文件，例如 `~/.codex/auth.json` 和
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

如果你的配置使用 `plugins.allow`，也要把 `codex` 包含进去：

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

旧版配置如果将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>`，仍会自动启用内置的 `codex` 插件。新配置应优先
使用 `openai/<model>`，并配合上面的显式 `agentRuntime` 条目。

## 将 Codex 与其他模型一起使用

如果同一个智能体需要在 Codex 和非 Codex 提供商模型之间自由切换，
不要全局设置 `agentRuntime.id: "codex"`。强制运行时会应用到该智能体或会话的每一次嵌入式轮次。如果你在强制该运行时的情况下选择了一个 Anthropic 模型，OpenClaw 仍然会尝试使用 Codex harness，并以封闭失败方式报错，而不会静默地将该轮次路由回 Pi。

请改用以下其中一种配置形式：

- 将 Codex 放在一个专用智能体上，并设置 `agentRuntime.id: "codex"`。
- 将默认智能体保持为 `agentRuntime.id: "auto"`，并为常规混合
  提供商使用保留 Pi 回退。
- 仅将旧版 `codex/*` 引用用于兼容性。新配置应优先使用
  `openai/*`，并显式设置 Codex 运行时策略。

例如，下面的配置会让默认智能体保持普通自动选择，并新增一个独立的 Codex 智能体：

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

- 默认的 `main` 智能体使用普通提供商路径和 Pi 兼容性回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或不受支持，该轮次会直接失败，
  而不是悄悄改用 Pi。

## 智能体命令路由

智能体应根据用户意图路由请求，而不是仅凭 “Codex” 这个词：

| 用户请求的是……                                       | 智能体应使用……                                  |
| ---------------------------------------------------- | ----------------------------------------------- |
| “将这个聊天绑定到 Codex”                             | `/codex bind`                                   |
| “在这里恢复 Codex 线程 `<id>`”                       | `/codex resume <id>`                            |
| “显示 Codex 线程”                                    | `/codex threads`                                |
| “将 Codex 用作这个智能体的运行时”                    | 将配置更改为 `agentRuntime.id`                  |
| “使用我的 ChatGPT/Codex 订阅配合普通 OpenClaw”       | `openai-codex/*` 模型引用                       |
| “通过 ACP/acpx 运行 Codex”                           | ACP `sessions_spawn({ runtime: "acp", ... })`   |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor”    | ACP/acpx，而不是 `/codex`，也不是原生子智能体   |

只有在 ACP 已启用、可分发，并且背后存在已加载的运行时后端时，
OpenClaw 才会向智能体公开 ACP 启动指导。如果 ACP 不可用，
系统提示和插件 Skills 不应向智能体传授 ACP
路由方式。

## 仅使用 Codex 的部署

当你需要证明每一个嵌入式智能体轮次都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不会回退到 Pi，因此
`fallback: "none"` 虽然是可选项，但通常作为文档说明很有帮助：

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

环境覆盖：

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

强制使用 Codex 时，如果 Codex 插件被禁用、app-server 版本过旧，或 app-server 无法启动，OpenClaw 会提前失败。只有在你明确希望由 Pi 处理缺失的 harness 选择时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体配置 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体保持正常
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

使用普通会话命令来切换智能体和模型。`/new` 会创建一个全新的
OpenClaw 会话，而 Codex harness 会按需创建或恢复其配套的 app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，
并让下一轮再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果
发现失败或超时，它会使用内置的回退目录，其中包括：

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

当你希望启动时避免探测 Codex，并固定使用回退目录时，
请禁用发现：

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

默认情况下，插件会在本地使用以下命令启动 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

该托管二进制文件被声明为内置插件运行时依赖，并与 `codex`
插件的其余依赖一起分阶段准备。这可确保 app-server 版本绑定到内置插件，而不是绑定到本地碰巧安装的某个独立 Codex CLI。
仅当你确实想运行不同的可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自主 heartbeat 的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停在无人应答的原生审批提示上。

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

Guardian 模式使用 Codex 的原生自动审核审批路径。当 Codex 请求离开
沙箱、在工作区外写入，或添加网络访问等权限时，Codex 会将该审批请求路由给原生审核器，而不是发送给人工提示。审核器会应用 Codex 的风险框架，并批准或拒绝该具体请求。当你希望比 YOLO 模式拥有更多防护栏，同时仍需要无人值守的智能体继续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
单独的策略字段仍然会覆盖 `mode`，因此高级部署可以将
该预设与显式选项混合使用。较旧的 `guardian_subagent` 审核器值
仍然接受作为兼容别名，但新配置应使用
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

支持的 `appServer` 字段：

| 字段                | 默认值                                   | 含义                                                                                                         |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                       |
| `command`           | 托管的 Codex 二进制文件                  | 用于 stdio 传输的可执行文件。留空则使用托管二进制文件；仅在明确覆盖时设置。                                  |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                                                      |
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                   |
| `authToken`         | 未设置                                   | 用于 WebSocket 传输的 Bearer token。                                                                         |
| `headers`           | `{}`                                     | 额外的 WebSocket headers。                                                                                   |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                          |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 审核执行的预设。                                                                            |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。                                                              |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                   |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审核原生审批提示。`guardian_subagent` 仍是旧版别名。                           |
| `serviceTier`       | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                      |

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，
`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者
在一次性的本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，更推荐使用配置，因为这样可以将插件行为与 Codex harness 设置的其余部分保存在同一个经过审查的文件中。

## Computer Use

Computer Use 有单独的设置指南：
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

简而言之：OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作。它会准备 Codex app-server，验证
`computer-use` MCP 服务器是否可用，然后让 Codex 在 Codex 模式轮次期间处理原生
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
      embeddedHarness: {
        runtime: "codex",
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

Computer Use 仅适用于 macOS，并且在 Codex MCP 服务器可以控制应用之前，可能需要本地操作系统权限。如果 `computerUse.enabled` 为 true，且 MCP
服务器不可用，则 Codex 模式轮次会在线程启动前直接失败，而不是静默地在没有原生 Computer Use 工具的情况下运行。有关 marketplace 选项、
远程目录限制、Status 原因和故障排除，请参见
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

## 常见用法示例

本地 Codex，使用默认 stdio 传输：

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有的 Codex 线程时，下一轮会再次向
app-server 发送当前选定的
OpenAI 模型、提供商、审批策略、沙箱和服务层级。
从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 继续使用新选定的模型。

## Codex 命令

内置插件将 `/codex` 注册为授权的斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道上使用。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账号、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有的 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩附加的线程。
- `/codex review` 为附加的线程启动 Codex 原生审查。
- `/codex computer-use status` 检查已配置的 Computer Use 插件和 MCP 服务器。
- `/codex computer-use install` 安装已配置的 Computer Use 插件并重新加载 MCP 服务器。
- `/codex account` 显示账号和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 在正常轮次中使用的相同 sidecar 绑定文件。在下一条消息到来时，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入 app-server，并保持启用扩展历史记录。

该命令界面要求 Codex app-server `0.125.0` 或更高版本。如果未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，则各个控制方法会显示为 `unsupported by this Codex app-server`。

## Hook 边界

Codex harness 有三层 hook：

| 层级                                  | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 提供跨 Pi 和 Codex harness 的产品/插件兼容性。                     |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐轮适配器行为。                           |
| Codex 原生 hooks                      | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。              |

OpenClaw 不会使用项目级或全局的 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，
OpenClaw 会为 `PreToolUse`、
`PostToolUse`、`PermissionRequest` 和 `Stop` 注入逐线程的 Codex 配置。其他 Codex hooks，例如 `SessionStart` 和
`UserPromptSubmit`，仍然属于 Codex 级控制；在 v1 合约中，它们不会作为
OpenClaw 插件钩子暴露。

对于 OpenClaw 动态工具，在 Codex 请求调用之后，OpenClaw 才执行该工具，因此
OpenClaw 会在 harness 适配器中触发它所拥有的插件和中间件行为。对于
Codex 原生工具，Codex 持有规范的工具记录。OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生 hook
回调暴露该操作，否则它无法重写原生 Codex
线程。

压缩和 LLM 生命周期投影来自 Codex app-server
通知和 OpenClaw 适配器状态，而不是原生 Codex hook 命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是适配器层面的观察结果，而不是对 Codex 内部请求或压缩负载的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为
`codex_app_server.hook` 智能体事件，用于轨迹和调试。
它们不会触发 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是在底层换了一个模型调用的 Pi。Codex 接管了更多原生模型循环，而 OpenClaw 会围绕这一边界适配其插件和会话界面。

Codex 运行时 v1 中受支持的内容：

| 界面                                          | 支持情况                                | 原因                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 运行 OpenAI 模型循环               | 支持                                    | Codex app-server 负责 OpenAI 轮次、原生线程恢复和原生工具续接。                                                                                                                                       |
| OpenClaw 渠道路由和传递                       | 支持                                    | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道仍位于模型运行时之外。                                                                                                                         |
| OpenClaw 动态工具                             | 支持                                    | Codex 请求 OpenClaw 执行这些工具，因此 OpenClaw 仍然位于执行路径中。                                                                                                                                  |
| Prompt 和上下文插件                           | 支持                                    | OpenClaw 会在启动或恢复线程之前构建 prompt 覆盖层，并将上下文投影到 Codex 轮次中。                                                                                                                    |
| 上下文引擎生命周期                            | 支持                                    | 组装、摄取或轮次后的维护，以及上下文引擎压缩协调，都会在 Codex 轮次中运行。                                                                                                                            |
| 动态工具钩子                                  | 支持                                    | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕 OpenClaw 持有的动态工具运行。                                                                                                            |
| 生命周期钩子                                  | 作为适配器观察结果提供支持              | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以忠实反映 Codex 模式的负载触发。                                                                                 |
| 最终答案修订门控                              | 通过原生 hook 中继提供支持              | Codex `Stop` 会中继到 `before_agent_finalize`；`revise` 会要求 Codex 在最终结束前再进行一次模型处理。                                                                                                  |
| 原生 shell、patch 和 MCP 的拦截或观察         | 通过原生 hook 中继提供支持              | Codex `PreToolUse` 和 `PostToolUse` 会针对已提交的原生工具界面进行中继，包括 Codex app-server `0.125.0` 及以上版本中的 MCP 负载。支持拦截；不支持参数重写。                                         |
| 原生权限策略                                  | 通过原生 hook 中继提供支持              | 在运行时暴露该能力的情况下，Codex `PermissionRequest` 可通过 OpenClaw 策略路由。如果 OpenClaw 未返回决定，Codex 将继续走其常规的 guardian 或用户审批路径。                                             |
| App-server 轨迹捕获                           | 支持                                    | OpenClaw 会记录它发送给 app-server 的请求，以及从 app-server 接收到的通知。                                                                                                                            |

Codex 运行时 v1 中不支持的内容：

| 界面                                              | V1 边界                                                                                                                                       | 未来路径                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                                  | Codex 原生 pre-tool hooks 可以拦截，但 OpenClaw 不会重写 Codex 原生工具参数。                                                                  | 需要 Codex hook/schema 支持替换后的工具输入。                                             |
| 可编辑的 Codex 原生转录历史                       | Codex 持有规范的原生线程历史。OpenClaw 持有一个镜像，并可投影未来上下文，但不应修改不受支持的内部结构。                                         | 如果需要原生线程手术能力，应添加显式的 Codex app-server API。                             |
| 用于 Codex 原生工具记录的 `tool_result_persist`   | 该 hook 转换的是由 OpenClaw 持有的转录写入，而不是 Codex 原生工具记录。                                                                         | 可以镜像转换后的记录，但规范性重写仍需要 Codex 支持。                                     |
| 丰富的原生压缩元数据                              | OpenClaw 可以观察压缩开始和完成，但不会接收到稳定的保留/丢弃列表、token delta 或摘要负载。                                                      | 需要更丰富的 Codex 压缩事件。                                                             |
| 压缩干预                                          | 当前 OpenClaw 的压缩 hooks 在 Codex 模式下仅限于通知层。                                                                                        | 如果插件需要否决或重写原生压缩，需要新增 Codex 的压缩前/后 hooks。                        |
| 逐字节的模型 API 请求捕获                         | OpenClaw 可以捕获 app-server 请求和通知，但最终的 OpenAI API 请求由 Codex 核心在内部构建。                                                      | 需要 Codex 的模型请求追踪事件或调试 API。                                                 |

## 工具、媒体和压缩

Codex harness 只改变底层嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，仍然通过正常的 OpenClaw 传递路径进行。

原生 hook 中继刻意保持通用，但 v1 支持合约仅限于 OpenClaw 已测试的 Codex 原生工具和权限路径。在 Codex 运行时中，这包括 shell、patch 和 MCP 的 `PreToolUse`、
`PostToolUse` 以及 `PermissionRequest` 负载。在运行时合约未明确命名之前，不要假设未来每个 Codex hook 事件都是 OpenClaw 插件界面。

对于 `PermissionRequest`，只有当策略明确作出决定时，OpenClaw 才会返回显式的允许或拒绝结果。无决定结果并不等于允许。Codex 会将其视为无 hook 决定，并回退到它自己的 guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件审批流程进行路由。Codex 的 `request_user_input` 提示会被发送回原始聊天，而下一个排队的后续消息会回答该原生服务器请求，而不是被作为额外上下文进行引导。其他 MCP 征询请求仍会以封闭失败方式处理。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史记录、搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该镜像包括用户 prompt、最终助手文本，以及当 app-server 发出它们时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未公开人类可读的压缩摘要，也无法提供 Codex 压缩后保留了哪些条目的可审计列表。

由于 Codex 持有规范的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它仅在 OpenClaw 正在写入由 OpenClaw 持有的会话转录工具结果时生效。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍继续使用相应的提供商/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和
`messages.tts`。

## 故障排除

**Codex 没有作为普通 `/model` 提供商出现：** 这对新配置来说是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`agentRuntime.id: "codex"`（或使用旧版 `codex/*` 引用），启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用 Pi 而不是 Codex：** 当没有 Codex harness 接管运行时，`agentRuntime.id: "auto"` 仍然可能使用 Pi 作为兼容后端。测试时请设置
`agentRuntime.id: "codex"` 以强制选择 Codex。现在，强制的 Codex 运行时在失败时会直接报错，而不是回退到 Pi，除非你显式设置了
`agentRuntime.fallback: "pi"`。一旦选择了 Codex app-server，其失败会直接暴露出来，而不需要额外的回退配置。

**app-server 被拒绝：** 请升级 Codex，使 app-server 握手报告的版本为
`0.125.0` 或更高。相同版本号的预发布版或带构建后缀的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，都会被拒绝，因为 OpenClaw 测试的协议最低稳定版本是
`0.125.0`。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现功能。

**WebSocket 传输立即失败：** 请检查 `appServer.url`、`authToken`，
以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 Pi：** 这是预期行为，除非你为该智能体强制设置了
`agentRuntime.id: "codex"`，或选择了旧版
`codex/*` 引用。普通的 `openai/gpt-*` 和其他提供商引用在 `auto` 模式下会继续走它们的常规提供商路径。如果你强制设置了 `agentRuntime.id: "codex"`，则该智能体的每个嵌入式轮次都必须使用受 Codex 支持的 OpenAI 模型。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [Plugin hooks](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
