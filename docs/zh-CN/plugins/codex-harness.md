---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在无法使用时直接失败，而不是回退到 PI
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-28T00:32:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4275f06cfaba2cc1f3f03204993c5c8678939979f734aca08b8053bbc14d7d8f
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 通过 Codex app-server 而不是内置的 Pi harness 运行嵌入式智能体轮次。

当你希望 Codex 接管底层智能体会话时，请使用此功能：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

如果你正在尝试了解整体结构，请先阅读
[Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简而言之：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、
Discord、Slack 或其他渠道仍然是通信界面。

## 此插件会带来哪些变化

内置的 `codex` 插件提供了几项彼此独立的能力：

| 能力                              | 使用方式                                            | 作用                                                                          |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式运行时                  | `agentRuntime.id: "codex"`                          | 通过 Codex app-server 运行 OpenClaw 嵌入式智能体轮次。                        |
| 原生聊天控制命令                  | `/codex bind`, `/codex resume`, `/codex steer`, ... | 从消息对话中绑定并控制 Codex app-server 线程。                                |
| Codex app-server 提供商/目录      | `codex` 内部机制，通过 harness 暴露                 | 让运行时能够发现并校验 app-server 模型。                                      |
| Codex 媒体理解路径                | `codex/*` 图像模型兼容路径                          | 为受支持的图像理解模型运行受限的 Codex app-server 轮次。                      |
| 原生钩子中继                      | 围绕 Codex 原生事件的插件钩子                       | 让 OpenClaw 可以观察/拦截受支持的 Codex 原生工具/最终化事件。                 |

启用该插件后，这些能力就会可用。但它**不会**：

- 为每个 OpenAI 模型都开始使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 让 ACP/acpx 成为默认的 Codex 路径
- 热切换已经记录了 Pi 运行时的现有会话
- 替换 OpenClaw 的渠道投递、会话文件、auth-profile 存储或消息路由

同一个插件也负责原生 `/codex` 聊天控制命令界面。如果启用了该插件，并且用户要求从聊天中绑定、恢复、引导、停止或检查 Codex 线程，智能体应优先使用 `/codex ...`，而不是 ACP。只有在用户明确要求 ACP/acpx，或正在测试 ACP Codex 适配器时，ACP 才应作为显式回退方案。

原生 Codex 轮次会继续把 OpenClaw 插件钩子作为公共兼容层保留。这些是进程内的 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- 通过 Codex `Stop` 中继的 `before_agent_finalize`
- `agent_end`

插件还可以注册运行时无关的工具结果中间件，在 OpenClaw 执行工具之后、并在结果返回给 Codex 之前，重写 OpenClaw 的动态工具结果。这与公共的
`tool_result_persist` 插件钩子是分开的，后者会转换由 OpenClaw 持有的转录工具结果写入。

有关插件钩子语义本身，请参阅 [Plugin hooks](/zh-CN/plugins/hooks)
和 [Plugin guard behavior](/zh-CN/tools/plugin)。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用的规范形式为
`openai/gpt-*`，并在需要原生 app-server 执行时，显式强制设置
`agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。为了兼容性，旧版 `codex/*` 模型引用仍会自动选择该 harness，但由运行时支持的旧版 provider 前缀不会作为常规模型/提供商选项显示。

如果启用了 `codex` 插件，但主模型仍然是
`openai-codex/*`，`openclaw doctor` 会发出警告，而不是更改路由。这是有意为之：`openai-codex/*` 仍然是 Pi 的 Codex OAuth/订阅路径，而原生 app-server 执行仍然是一个显式的运行时选择。

## 路由映射

在修改配置之前，请先使用此表：

| 期望行为                                  | 模型引用                   | 运行时配置                             | 插件要求                    | 预期的 Status 标签            |
| ----------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通过普通 OpenClaw 运行器使用 OpenAI API   | `openai/gpt-*`             | 省略或 `runtime: "pi"`                 | OpenAI provider             | `Runtime: OpenClaw Pi Default` |
| 通过 Pi 使用 Codex OAuth/订阅             | `openai-codex/gpt-*`       | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 嵌入式轮次          | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | `codex` 插件                | `Runtime: OpenAI Codex`        |
| 带保守自动模式的混合提供商                | provider 专属引用          | `agentRuntime.id: "auto"`              | 可选的插件运行时            | 取决于所选运行时               |
| 显式 Codex ACP 适配器会话                 | ACP prompt/model dependent | `sessions_spawn` 配合 `runtime: "acp"` | 健康的 `acpx` 后端          | ACP task/session status        |

关键区别在于 provider 与运行时：

- `openai-codex/*` 回答的是“Pi 应使用哪条 provider/auth 路径？”
- `agentRuntime.id: "codex"` 回答的是“此嵌入式轮次应由哪个循环执行？”
- `/codex ...` 回答的是“此聊天应绑定或控制哪个原生 Codex 对话？”
- ACP 回答的是“acpx 应启动哪个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 系列路由对前缀非常敏感。当你希望通过 Pi 使用 Codex OAuth 时，请使用 `openai-codex/*`；当你希望直接使用 OpenAI API，或强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| 模型引用                                      | 运行时路径                                     | 使用场景                                                                  |
| --------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | 通过 OpenClaw/Pi 管道使用 OpenAI provider      | 你希望使用 `OPENAI_API_KEY` 访问当前的 OpenAI Platform API。              |
| `openai-codex/gpt-5.5`                        | 通过 OpenClaw/Pi 使用 OpenAI Codex OAuth       | 你希望通过默认的 Pi 运行器使用 ChatGPT/Codex 订阅认证。                   |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness                       | 你希望为嵌入式智能体轮次使用原生 Codex app-server 执行。                  |

GPT-5.5 目前在 OpenClaw 中仅支持订阅/OAuth。对于 Pi OAuth，请使用
`openai-codex/gpt-5.5`；对于 Codex app-server harness，请使用 `openai/gpt-5.5` 搭配 Codex app-server harness。一旦 OpenAI 在公共 API 上启用 GPT-5.5，`openai/gpt-5.5` 就会支持直接通过 API key 访问。

旧版 `codex/gpt-*` 引用仍然可作为兼容别名使用。Doctor 兼容性迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略；而仅用于回退的旧版引用则保持不变，因为运行时是为整个智能体容器配置的。新的 Pi Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生 app-server harness 配置应使用 `openai/gpt-*` 加上
`agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 也遵循同样的前缀划分。当图像理解应通过 OpenAI Codex OAuth provider 路径运行时，请使用
`openai-codex/gpt-*`。当图像理解应通过受限的 Codex app-server 轮次运行时，请使用 `codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 确认当前会话实际使用的 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关中的结构化 `agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

### Doctor 警告意味着什么

当以下条件全部满足时，`openclaw doctor` 会发出警告：

- 内置的 `codex` 插件已启用或被允许
- 某个智能体的主模型是 `openai-codex/*`
- 该智能体的实际运行时不是 `codex`

之所以有这个警告，是因为用户常常会认为“启用了 Codex 插件”就意味着“使用原生 Codex app-server 运行时”。OpenClaw 不会自动做出这个跳转。这个警告意味着：

- 如果你本来就打算通过 Pi 使用 ChatGPT/Codex OAuth，**则无需更改**。
- 如果你原本想使用原生 app-server 执行，请把模型改成 `openai/<model>`，并设置
  `agentRuntime.id: "codex"`。
- 现有会话在运行时变更后仍然需要 `/new` 或 `/reset`，因为会话运行时固定是粘性的。

Harness 选择并不是实时会话控制。当嵌入式轮次运行时，OpenClaw 会把所选 harness id 记录到该会话上，并在同一会话 id 的后续轮次中继续使用它。当你希望未来的新会话使用其他 harness 时，请修改 `agentRuntime` 配置或
`OPENCLAW_AGENT_RUNTIME`；在将现有对话在 Pi 和 Codex 之间切换之前，请使用 `/new` 或 `/reset` 启动一个全新会话。这样可以避免让同一份转录通过两个不兼容的原生会话系统重放。

在引入 harness 固定机制之前创建的旧会话，只要已经有转录历史，就会被视为固定到 Pi。修改配置后，请使用 `/new` 或 `/reset`，让该对话切换到 Codex。

`/status` 会显示实际生效的模型运行时。默认的 Pi harness 会显示为
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 会显示为
`Runtime: OpenAI Codex`。

## 要求

- 安装了 OpenClaw，且内置 `codex` 插件可用。
- Codex app-server `0.125.0` 或更高版本。内置插件默认会管理一个兼容的 Codex app-server 二进制文件，因此 `PATH` 上本地的 `codex` 命令不会影响正常的 harness 启动。
- app-server 进程或 OpenClaw 的 Codex auth bridge 可用的 Codex 认证。

该插件会拦截较旧或未标明版本的 app-server 握手。这可以确保 OpenClaw 运行在它已经测试过的协议表面上。

对于 live 和 Docker smoke 测试，认证通常来自 Codex CLI 账户或 OpenClaw 的 `openai-codex` auth profile。本地 stdio app-server 启动在没有账户时，也可以回退到 `CODEX_API_KEY` / `OPENAI_API_KEY`。

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

如果你的配置使用了 `plugins.allow`，也需要把 `codex` 加进去：

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

对于把 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>` 的旧配置，仍会自动启用内置 `codex` 插件。新配置应优先使用 `openai/<model>`，并配合上面的显式 `agentRuntime` 条目。

## 将 Codex 与其他模型一起使用

如果同一个智能体应在 Codex 和非 Codex provider 模型之间自由切换，请不要全局设置 `agentRuntime.id: "codex"`。强制运行时会应用到该智能体或会话的每一个嵌入式轮次。如果你在强制该运行时的情况下选择了一个 Anthropic 模型，OpenClaw 仍然会尝试使用 Codex harness，并以失败关闭，而不是悄悄地通过 Pi 路由该轮次。

请改用以下其中一种结构：

- 为 Codex 配置一个专用智能体，并设置 `agentRuntime.id: "codex"`。
- 将默认智能体保持为 `agentRuntime.id: "auto"`，并为常规混合 provider 使用保留 Pi 回退。
- 仅将旧版 `codex/*` 引用用于兼容性。新配置应优先使用
  `openai/*`，并显式指定 Codex 运行时策略。

例如，下面的配置会让默认智能体保持正常的自动选择，并额外添加一个独立的 Codex 智能体：

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

采用这种结构后：

- 默认的 `main` 智能体使用常规 provider 路径和 Pi 兼容性回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或当前不受支持，该轮次会直接失败，
  而不是悄悄改用 Pi。

## 智能体命令路由

智能体应根据用户意图路由请求，而不是仅凭“Codex”这个词：

| 用户要求……                                             | 智能体应使用……                                  |
| ------------------------------------------------------ | ------------------------------------------------ |
| “把这个聊天绑定到 Codex”                               | `/codex bind`                                    |
| “在这里恢复 Codex 线程 `<id>`”                         | `/codex resume <id>`                             |
| “显示 Codex 线程”                                      | `/codex threads`                                 |
| “把 Codex 用作这个智能体的运行时”                      | 将配置改为 `agentRuntime.id`                     |
| “用我的 ChatGPT/Codex 订阅配合普通 OpenClaw”           | `openai-codex/*` 模型引用                        |
| “通过 ACP/acpx 运行 Codex”                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor”      | ACP/acpx，而不是 `/codex`，也不是原生子智能体    |

只有在 ACP 已启用、可分发，并且有已加载的运行时后端支持时，OpenClaw 才会向智能体公开 ACP 启动指引。如果 ACP 不可用，系统提示词和插件 Skills 就不应向智能体传授 ACP 路由。

## 仅使用 Codex 的部署

当你需要证明每一个嵌入式智能体轮次都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不会回退到 Pi，因此
`fallback: "none"` 虽然是可选的，但通常对文档说明很有帮助：

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

在强制使用 Codex 的情况下，如果 Codex 插件被禁用、app-server 版本过旧，或 app-server 无法启动，OpenClaw 会尽早失败。只有在你明确希望缺失的 harness 选择由 Pi 处理时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体使用 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体继续保持正常的自动选择：

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

使用常规会话命令在智能体和模型之间切换。`/new` 会创建一个全新的 OpenClaw 会话，而 Codex harness 会根据需要创建或恢复其 sidecar app-server 线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果发现失败或超时，它会使用内置的回退目录，其中包括：

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

如果你希望启动时避免探测 Codex，并固定使用回退目录，请禁用发现：

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

默认情况下，插件会使用以下命令在本地启动由 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

这个受管二进制文件被声明为内置插件运行时依赖，并与 `codex` 插件的其余依赖一起分阶段提供。这样可以让 app-server 版本与内置插件绑定，而不是取决于本地碰巧安装了哪个独立的 Codex CLI。只有在你明确想运行不同可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作姿态：Codex 可以使用 shell 和网络工具，而不会因为无人响应的原生审批提示而中断。

如果要启用由 Codex guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 模式使用 Codex 的原生自动审核审批路径。当 Codex 请求离开沙箱、在工作区外写入，或添加网络访问等权限时，Codex 会将该审批请求路由给原生审核器，而不是人工提示。审核器会应用 Codex 的风险框架，并批准或拒绝该具体请求。如果你希望比 YOLO 模式有更多防护，同时又需要无人值守的智能体继续推进工作，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
各个单独的策略字段仍然会覆盖 `mode`，因此高级部署可以把这个预设与显式选项混合使用。较旧的 `guardian_subagent` 审核器值仍然作为兼容别名被接受，但新配置应使用
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

默认情况下，stdio app-server 启动会继承 OpenClaw 的进程环境，
但 OpenClaw 自己负责 Codex app-server 账户桥接。认证按以下顺序选择：

1. 智能体显式指定的 OpenClaw Codex auth profile。
2. app-server 现有账户，例如本地 Codex CLI 的 ChatGPT 登录。
3. 仅对本地 stdio app-server 启动，在没有 app-server 账户且仍需要 OpenAI 认证时，依次回退到 `CODEX_API_KEY`，然后是
   `OPENAI_API_KEY`。

当 OpenClaw 发现某个 ChatGPT 订阅风格的 Codex auth profile 时，它会从已启动的 Codex 子进程中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。这样可以让 Gateway 网关级别的 API key 继续用于 embeddings 或直接的 OpenAI 模型，同时避免原生 Codex app-server 轮次意外通过 API 计费。显式的 Codex API key profile 以及本地 stdio 环境变量 key 回退都会使用 app-server 登录，而不是继承子进程环境。WebSocket app-server 连接不会收到 Gateway 网关环境变量 API key 回退；请使用显式 auth profile 或远程 app-server 自己的账户。

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

| 字段                | 默认值                                   | 含义                                                                                                                                |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                                              |
| `command`           | 受管的 Codex 二进制文件                  | 用于 stdio 传输的可执行文件。留空则使用受管二进制文件；仅在你明确需要覆盖时设置。                                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 传输的参数。                                                                                                                  |
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                                          |
| `authToken`         | 未设置                                   | WebSocket 传输的 Bearer token。                                                                                                     |
| `headers`           | `{}`                                     | 额外的 WebSocket headers。                                                                                                          |
| `clearEnv`          | `[]`                                     | OpenClaw 构建继承环境后，从已启动的 stdio app-server 进程中额外移除的环境变量名称。                                                 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                                                 |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 审核执行的预设。                                                                                                   |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。                                                                                     |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                                          |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 可让 Codex 审核原生审批提示。`guardian_subagent` 仍然是旧版别名。                                              |
| `serviceTier`       | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版取值会被忽略。                                            |

环境变量覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，
`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过受管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性的本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，因为这样可以将插件行为与 Codex harness 设置的其余部分保存在同一个经过审查的文件中。

## Computer Use

Computer Use 在单独的设置指南中介绍：
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

简而言之：OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作。它会准备好 Codex app-server，验证
`computer-use` MCP 服务器可用，然后让 Codex 在 Codex 模式轮次中处理原生 MCP 工具调用。

如果要在 Codex marketplace 流程之外直接访问 TryCua 驱动程序，请使用
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`
注册 `cua-driver mcp`。有关 Codex 持有的 Computer Use 与直接 MCP 注册之间的区别，请参阅
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

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

Computer Use 仅支持 macOS，并且在 Codex MCP 服务器能够控制应用之前，可能需要本地操作系统权限。如果
`computerUse.enabled` 为 true 且 MCP 服务器不可用，那么 Codex 模式轮次会在线程启动前直接失败，而不是静默地在没有原生 Computer Use 工具的情况下继续运行。有关 marketplace 选择、远程目录限制、状态原因和故障排除，请参阅
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

当 `computerUse.autoInstall` 为 true 时，如果 Codex 尚未发现本地 marketplace，OpenClaw 可以从
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
注册标准内置的 Codex Desktop marketplace。更改运行时或 Computer Use 配置后，请使用 `/new` 或 `/reset`，以免现有会话继续保留旧的 Pi 或 Codex 线程绑定。

## 常见方案

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

仅使用 Codex 的 harness 校验：

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

模型切换仍然由 OpenClaw 控制。当某个 OpenClaw 会话附加到现有的 Codex 线程时，下一轮会再次把当前选定的
OpenAI 模型、provider、审批策略、沙箱和服务层级发送给
app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 时，会保留线程绑定，但会请求 Codex 使用新选定的模型继续运行。

## Codex 命令

内置插件将 `/codex` 注册为授权的斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道上使用。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩当前附加的线程。
- `/codex review` 为当前附加的线程启动 Codex 原生审查。
- `/codex computer-use status` 检查已配置的 Computer Use 插件和 MCP 服务器。
- `/codex computer-use install` 安装已配置的 Computer Use 插件并重新加载 MCP 服务器。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 正常轮次使用的相同 sidecar 绑定文件。在下一条消息到来时，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入 app-server，并保持启用扩展历史记录。

该命令界面要求 Codex app-server `0.125.0` 或更高版本。如果未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，则各个控制方法会报告为
`unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 持有方                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 在 Pi 和 Codex harness 之间提供产品/插件兼容性。                   |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐轮适配器行为。                           |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。               |

OpenClaw 不会使用项目级或全局 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，OpenClaw 会为每个线程注入 Codex 配置，用于 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop`。其他 Codex 钩子，如 `SessionStart` 和
`UserPromptSubmit`，仍然属于 Codex 级控制；它们在 v1 合约中不会作为
OpenClaw 插件钩子暴露。

对于 OpenClaw 动态工具，OpenClaw 会在 Codex 请求调用之后执行该工具，因此 OpenClaw 会在 harness 适配器中触发其持有的插件和中间件行为。对于 Codex 原生工具，Codex 持有规范工具记录。OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子回调暴露该操作，否则它无法重写原生 Codex 线程。

压缩和 LLM 生命周期投影来自 Codex app-server 通知以及 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。OpenClaw 的
`before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件属于适配器级观察结果，而不是对 Codex 内部请求或压缩负载的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为 `codex_app_server.hook` 智能体事件，用于轨迹记录和调试。它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是只把底层模型调用换掉的 Pi。Codex 持有更多原生模型循环，而 OpenClaw 会围绕这一边界适配它的插件和会话界面。

Codex 运行时 v1 中支持的内容：

| 界面                                          | 支持情况                               | 原因                                                                                                                                                                                                   |
| --------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 运行 OpenAI 模型循环               | 支持                                   | Codex app-server 持有 OpenAI 轮次、原生线程恢复和原生工具续接。                                                                                                                                       |
| OpenClaw 渠道路由与投递                       | 支持                                   | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道仍然位于模型运行时之外。                                                                                                                      |
| OpenClaw 动态工具                             | 支持                                   | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍然在执行路径中。                                                                                                                                  |
| 提示词和上下文插件                            | 支持                                   | OpenClaw 会在启动或恢复线程之前构建提示词叠加层，并将上下文投影到 Codex 轮次中。                                                                                                                    |
| 上下文引擎生命周期                            | 支持                                   | 对 Codex 轮次执行 assemble、ingest 或轮次后的维护，以及上下文引擎压缩协调。                                                                                                                          |
| 动态工具钩子                                  | 支持                                   | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕由 OpenClaw 持有的动态工具运行。                                                                                                         |
| 生命周期钩子                                  | 作为适配器观察结果支持                 | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式负载触发。                                                                                   |
| 最终答案修订门控                              | 通过原生钩子中继支持                   | Codex `Stop` 会被中继到 `before_agent_finalize`；`revise` 会在最终化前请求 Codex 再执行一次模型轮次。                                                                                                |
| 原生 shell、patch 和 MCP 的拦截或观察         | 通过原生钩子中继支持                   | Codex `PreToolUse` 和 `PostToolUse` 会被中继到已提交的原生工具界面，包括在 Codex app-server `0.125.0` 或更高版本中的 MCP 负载。支持拦截；不支持参数重写。                                          |
| 原生权限策略                                  | 通过原生钩子中继支持                   | 在运行时暴露该能力的情况下，Codex `PermissionRequest` 可以通过 OpenClaw 策略路由。如果 OpenClaw 未返回决策，Codex 会继续沿用其正常的 guardian 或用户审批路径。                                     |
| App-server 轨迹捕获                           | 支持                                   | OpenClaw 会记录它发送到 app-server 的请求，以及它收到的 app-server 通知。                                                                                                                            |

Codex 运行时 v1 中不支持的内容：

| 界面                                                | V1 边界                                                                                                                                     | 未来路径                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                                    | Codex 原生 pre-tool 钩子可以拦截，但 OpenClaw 不会重写 Codex 原生工具参数。                                                                     | 这需要 Codex 钩子/模式支持替换后的工具输入。                                              |
| 可编辑的 Codex 原生转录历史                         | Codex 持有规范的原生线程历史。OpenClaw 持有一个镜像，并可以投影未来上下文，但不应修改不受支持的内部结构。                                     | 如果需要原生线程手术式修改，则需添加显式的 Codex app-server API。                         |
| 用于 Codex 原生工具记录的 `tool_result_persist`     | 该钩子会转换由 OpenClaw 持有的转录写入，而不是 Codex 原生工具记录。                                                                              | 可以镜像转换后的记录，但规范重写需要 Codex 支持。                                         |
| 丰富的原生压缩元数据                                | OpenClaw 可以观察到压缩开始和完成，但不会收到稳定的保留/丢弃列表、token 差值或摘要负载。                                                        | 需要更丰富的 Codex 压缩事件。                                                             |
| 压缩干预                                            | 当前 OpenClaw 的压缩钩子在 Codex 模式下属于通知级别。                                                                                           | 如果插件需要否决或重写原生压缩，则应添加 Codex 的 pre/post 压缩钩子。                    |
| 逐字节的模型 API 请求捕获                           | OpenClaw 可以捕获 app-server 请求和通知，但最终的 OpenAI API 请求由 Codex 核心在内部构建。                                                     | 需要 Codex 的模型请求追踪事件或调试 API。                                                |

## 工具、媒体与压缩

Codex harness 只会改变底层嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，仍然通过正常的 OpenClaw 传递路径进行处理。

原生钩子中继刻意保持通用，但 V1 支持合约仅限于 OpenClaw 已测试的 Codex 原生工具和权限路径。在 Codex 运行时中，这包括 shell、patch 和 MCP 的 `PreToolUse`、
`PostToolUse` 和 `PermissionRequest` 负载。在运行时合约明确命名之前，不要假设未来每个 Codex 钩子事件都会成为 OpenClaw 插件界面。

对于 `PermissionRequest`，只有在策略作出决定时，OpenClaw 才会返回显式的允许或拒绝结果。无决定结果并不等于允许。Codex 会将其视为“钩子未作决定”，并继续走自己的 guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件审批流程路由。Codex 的 `request_user_input` 提示会被发回原始聊天，而下一条排队的后续消息会回答该原生服务器请求，而不是作为额外上下文进行引导。其他 MCP 征询请求仍然会以失败关闭。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一份转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该镜像包含用户提示词、最终助手文本，以及当 app-server 发出这些内容时的轻量级 Codex reasoning 或计划记录。目前，OpenClaw 只记录原生压缩的开始和完成信号。它还不会公开人类可读的压缩摘要，也不会提供 Codex 在压缩后保留了哪些条目的可审计列表。

由于 Codex 持有规范的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它只会在 OpenClaw 写入由 OpenClaw 持有的会话转录工具结果时生效。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍然继续使用匹配的 provider/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和
`messages.tts`。

## 故障排除

**Codex 没有作为普通 `/model` provider 出现：** 对于新配置，这是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`agentRuntime.id: "codex"`（或使用旧版 `codex/*` 引用），启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用了 Pi 而不是 Codex：** `agentRuntime.id: "auto"` 在没有任何 Codex harness 声明接管运行时，仍然可以使用 Pi 作为兼容后端。测试时请设置
`agentRuntime.id: "codex"` 以强制选择 Codex。现在，强制使用 Codex 运行时会直接失败，而不是回退到 Pi，除非你显式设置
`agentRuntime.fallback: "pi"`。一旦选中了 Codex app-server，它的失败会直接暴露出来，而不会再经过额外的回退配置。

**app-server 被拒绝：** 请升级 Codex，使 app-server 握手报告的版本为 `0.125.0` 或更高。相同版本号的预发布版本或带构建后缀的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，都会被拒绝，因为 OpenClaw 测试的是稳定版 `0.125.0` 这一协议下限。

**模型发现速度很慢：** 降低
`plugins.entries.codex.config.discovery.timeoutMs`，或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**某个非 Codex 模型使用了 Pi：** 这是预期行为，除非你为该智能体强制设置了
`agentRuntime.id: "codex"`，或者选择了旧版 `codex/*` 引用。普通的 `openai/gpt-*` 和其他 provider 引用在 `auto` 模式下会继续走各自的正常 provider 路径。如果你强制设置了
`agentRuntime.id: "codex"`，那么该智能体的每一个嵌入式轮次都必须是 Codex 支持的 OpenAI 模型。

**Computer Use 已安装，但工具无法运行：** 请在一个全新会话中检查
`/codex computer-use status`。如果某个工具报告
`Native hook relay unavailable`，请使用 `/new` 或 `/reset`；如果问题仍然存在，请重启 Gateway 网关以清除过期的原生钩子注册。如果
`computer-use.list_apps` 超时，请重启 Codex Computer Use 或 Codex Desktop，然后重试。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Model providers](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [Plugin hooks](/zh-CN/plugins/hooks)
- [Configuration reference](/zh-CN/gateway/configuration-reference)
- [Testing](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
