---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在无法使用时直接失败，而不是回退到 PI
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体回合
title: Codex harness
x-i18n:
    generated_at: "2026-04-27T23:44:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef9654bdc6a2cb44726a53002f2735d823119d2e0379adc68907d8a0980ba4c2
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 通过 Codex app-server 而不是内置的 PI harness 运行嵌入式智能体回合。

当你希望由 Codex 接管底层智能体会话时，请使用此插件：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

如果你正在熟悉相关概念，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简而言之：`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍然是通信界面。

## 此插件会改变什么

内置的 `codex` 插件提供了几项彼此独立的能力：

| 能力 | 使用方式 | 作用 |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 原生嵌入式运行时 | `agentRuntime.id: "codex"` | 通过 Codex app-server 运行 OpenClaw 嵌入式智能体回合。 |
| 原生聊天控制命令 | `/codex bind`, `/codex resume`, `/codex steer`, ... | 在消息会话中绑定并控制 Codex app-server 线程。 |
| Codex app-server 提供商/目录 | `codex` 内部机制，通过 harness 暴露 | 让运行时发现并校验 app-server 模型。 |
| Codex 媒体理解路径 | `codex/*` 图像模型兼容路径 | 为支持的图像理解模型运行受限的 Codex app-server 回合。 |
| 原生钩子中继 | 围绕 Codex 原生事件的插件钩子 | 让 OpenClaw 观察/阻止受支持的 Codex 原生工具/终结事件。 |

启用该插件会让这些能力可用。它**不会**：

- 为每个 OpenAI 模型都开始使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 让 ACP/acpx 成为默认的 Codex 路径
- 热切换已经记录为 PI 运行时的现有会话
- 替换 OpenClaw 的渠道投递、会话文件、auth-profile 存储或消息路由

同一个插件也负责原生 `/codex` 聊天控制命令界面。如果插件已启用，且用户希望从聊天中绑定、恢复、引导、停止或检查 Codex 线程，智能体应优先使用 `/codex ...`，而不是 ACP。只有当用户明确要求 ACP/acpx，或正在测试 ACP Codex 适配器时，ACP 才是显式后备方案。

原生 Codex 回合将 OpenClaw 插件钩子保留为公开兼容层。这些是进程内的 OpenClaw 钩子，而不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- 通过 Codex `Stop` 中继的 `before_agent_finalize`
- `agent_end`

插件还可以注册运行时无关的工具结果中间件，在 OpenClaw 执行工具之后、结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公开的 `tool_result_persist` 插件钩子不同，后者用于转换由 OpenClaw 拥有的转录工具结果写入。

关于插件钩子语义本身，请参阅 [Plugin hooks](/zh-CN/plugins/hooks) 和 [Plugin guard behavior](/zh-CN/tools/plugin)。

默认情况下，harness 处于关闭状态。新的配置应保持 OpenAI 模型引用为规范形式 `openai/gpt-*`，并在需要原生 app-server 执行时显式强制设置 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。出于兼容性考虑，旧版 `codex/*` 模型引用仍会自动选择该 harness，但由运行时支持的旧版提供商前缀不会显示为普通的模型/提供商选项。

如果启用了 `codex` 插件，但主模型仍然是 `openai-codex/*`，`openclaw doctor` 会发出警告，而不是更改路由。这是有意为之：`openai-codex/*` 仍然是 PI Codex OAuth/订阅路径，而原生 app-server 执行始终是一个显式运行时选择。

## 路由映射

在更改配置之前，请先使用此表：

| 期望行为 | 模型引用 | 运行时配置 | 插件要求 | 预期 Status 标签 |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通过普通 OpenClaw 运行器使用 OpenAI API | `openai/gpt-*` | 省略或 `runtime: "pi"` | OpenAI provider | `Runtime: OpenClaw Pi Default` |
| 通过 PI 使用 Codex OAuth/订阅 | `openai-codex/gpt-*` | 省略或 `runtime: "pi"` | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default` |
| 原生 Codex app-server 嵌入式回合 | `openai/gpt-*` | `agentRuntime.id: "codex"` | `codex` 插件 | `Runtime: OpenAI Codex` |
| 使用保守自动模式的混合提供商 | provider-specific refs | `agentRuntime.id: "auto"` | 可选插件运行时 | 取决于所选运行时 |
| 显式 Codex ACP 适配器会话 | ACP prompt/model dependent | `sessions_spawn` 搭配 `runtime: "acp"` | 正常工作的 `acpx` 后端 | ACP 任务/会话状态 |

关键区别在于提供商与运行时：

- `openai-codex/*` 回答的是“PI 应该使用哪条提供商/认证路由？”
- `agentRuntime.id: "codex"` 回答的是“哪个循环应执行这个嵌入式回合？”
- `/codex ...` 回答的是“这个聊天应绑定或控制哪个原生 Codex 会话？”
- ACP 回答的是“acpx 应启动哪个外部 harness 进程？”

## 选择正确的模型前缀

OpenAI 系列路由对前缀非常敏感。当你想通过 PI 使用 Codex OAuth 时，使用 `openai-codex/*`；当你想直接访问 OpenAI API，或强制使用原生 Codex app-server harness 时，使用 `openai/*`：

| 模型引用 | 运行时路径 | 使用场景 |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | 通过 OpenClaw/PI 管道的 OpenAI provider | 你希望使用 `OPENAI_API_KEY` 访问当前直接可用的 OpenAI Platform API。 |
| `openai-codex/gpt-5.5` | 通过 OpenClaw/PI 的 OpenAI Codex OAuth | 你希望使用默认 PI 运行器的 ChatGPT/Codex 订阅认证。 |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex app-server harness | 你希望为嵌入式智能体回合使用原生 Codex app-server 执行。 |

GPT-5.5 当前在 OpenClaw 中仅支持订阅/OAuth。PI OAuth 请使用 `openai-codex/gpt-5.5`，或者将 `openai/gpt-5.5` 与 Codex app-server harness 搭配使用。OpenAI 一旦在公共 API 中启用 GPT-5.5，就会支持对 `openai/gpt-5.5` 的直接 API 密钥访问。

旧版 `codex/gpt-*` 引用仍然作为兼容别名被接受。Doctor 兼容迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略；而仅作为后备的旧版引用则保持不变，因为运行时是为整个智能体容器配置的。新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生 app-server harness 配置应使用 `openai/gpt-*` 加上 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 也遵循同样的前缀拆分。当图像理解应通过 OpenAI Codex OAuth provider 路径运行时，使用 `openai-codex/gpt-*`。当图像理解应通过受限的 Codex app-server 回合运行时，使用 `codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；纯文本 Codex 模型会在媒体回合开始前失败。

使用 `/status` 可确认当前会话的实际 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关中的结构化 `agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/后备策略，以及在 `auto` 模式下每个插件候选项的支持结果。

### doctor 警告意味着什么

当以下条件全部成立时，`openclaw doctor` 会发出警告：

- 内置 `codex` 插件已启用或被允许
- 某个智能体的主模型是 `openai-codex/*`
- 该智能体的实际运行时不是 `codex`

之所以有这个警告，是因为用户常常会认为“启用了 Codex 插件”就意味着“使用原生 Codex app-server 运行时”。OpenClaw 不会自动做出这个跳转。这个警告表示：

- 如果你本来就是要通过 PI 使用 ChatGPT/Codex OAuth，**则无需更改**。
- 如果你想使用原生 app-server 执行，请将模型改为 `openai/<model>`，并设置 `agentRuntime.id: "codex"`。
- 现有会话在运行时变更后仍需要执行 `/new` 或 `/reset`，因为会话运行时固定是粘性的。

Harness 选择不是实时会话控制。当一个嵌入式回合运行时，OpenClaw 会在该会话上记录所选 harness id，并在后续同一会话 id 的回合中继续使用它。当你希望未来会话使用另一种 harness 时，请更改 `agentRuntime` 配置或 `OPENCLAW_AGENT_RUNTIME`；在现有会话于 PI 和 Codex 之间切换之前，请先使用 `/new` 或 `/reset` 启动一个新会话。这可以避免将同一份转录通过两套不兼容的原生会话系统重放。

在引入 harness 固定机制之前创建的旧会话，只要已有转录历史，就会被视为固定到 PI。更改配置后，如需让该会话改用 Codex，请使用 `/new` 或 `/reset`。

`/status` 会显示实际模型运行时。默认 PI harness 显示为 `Runtime: OpenClaw Pi Default`，而 Codex app-server harness 显示为 `Runtime: OpenAI Codex`。

## 要求

- OpenClaw，并且可用内置的 `codex` 插件。
- Codex app-server `0.125.0` 或更高版本。内置插件默认会管理一个兼容的 Codex app-server 二进制文件，因此 `PATH` 上的本地 `codex` 命令不会影响正常的 harness 启动。
- app-server 进程可用的 Codex 认证信息。

该插件会阻止较旧或没有版本信息的 app-server 握手，以确保 OpenClaw 始终运行在其已测试过的协议接口上。

对于实时和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。请使用与你本地 Codex app-server 相同的认证材料。

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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 的旧配置，仍会自动启用内置 `codex` 插件。新的配置应优先使用 `openai/<model>`，再加上上面显式的 `agentRuntime` 条目。

## 将 Codex 与其他模型一起使用

如果同一个智能体需要在 Codex 与非 Codex 提供商模型之间自由切换，请不要全局设置 `agentRuntime.id: "codex"`。强制运行时会应用到该智能体或会话的每个嵌入式回合。如果你在强制该运行时的情况下选择了 Anthropic 模型，OpenClaw 仍会尝试使用 Codex harness，并以失败关闭，而不是悄悄地通过 PI 路由该回合。

请改用以下几种配置形式之一：

- 将 Codex 放在一个专用智能体上，并设置 `agentRuntime.id: "codex"`。
- 将默认智能体保留为 `agentRuntime.id: "auto"`，并为普通混合提供商用法保留 PI 后备。
- 仅将旧版 `codex/*` 引用用于兼容性。新配置应优先使用 `openai/*`，并配合显式的 Codex 运行时策略。

例如，下面的配置会让默认智能体保持正常的自动选择，并额外添加一个单独的 Codex 智能体：

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

采用这种形式时：

- 默认的 `main` 智能体使用普通提供商路径和 PI 兼容后备。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或不受支持，该回合会直接失败，而不是悄悄使用 PI。

## 智能体命令路由

智能体应根据用户意图路由请求，而不是仅凭 “Codex” 这个词：

| 用户请求的是…… | 智能体应使用…… |
| -------------------------------------------------------- | ------------------------------------------------ |
| “将这个聊天绑定到 Codex” | `/codex bind` |
| “在这里恢复 Codex 线程 `<id>`” | `/codex resume <id>` |
| “显示 Codex 线程” | `/codex threads` |
| “将 Codex 用作这个智能体的运行时” | 将 `agentRuntime.id` 改为相应配置 |
| “使用我的 ChatGPT/Codex 订阅并搭配普通 OpenClaw” | `openai-codex/*` 模型引用 |
| “通过 ACP/acpx 运行 Codex” | ACP `sessions_spawn({ runtime: "acp", ... })` |
| “在线程中启动 Claude Code/Gemini/OpenCode/Cursor” | ACP/acpx，而不是 `/codex`，也不是原生子智能体 |

只有在 ACP 已启用、可分发并由已加载的运行时后端支持时，OpenClaw 才会向智能体公开 ACP 启动指导。如果 ACP 不可用，系统提示和插件 Skills 不应向智能体传授 ACP 路由方式。

## 仅 Codex 的部署

当你需要证明每个嵌入式智能体回合都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不使用 PI 后备，因此 `fallback: "none"` 是可选的，但通常作为文档说明很有用：

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

在强制使用 Codex 的情况下，如果 Codex 插件被禁用、app-server 版本过旧，或者 app-server 无法启动，OpenClaw 会尽早失败。只有在你明确希望 PI 接管缺失的 harness 选择时，才设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体使用 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体继续保留正常的自动选择：

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

使用普通会话命令即可切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，Codex harness 会根据需要创建或恢复其 sidecar app-server 线程。`/reset` 会清除此线程的 OpenClaw 会话绑定，并让下一个回合再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果发现失败或超时，它会使用内置的后备目录，包含：

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

如果你希望启动时避免探测 Codex，而是固定使用后备目录，请禁用发现：

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

默认情况下，插件会在本地使用以下命令启动由 OpenClaw 管理的 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

该托管二进制文件被声明为内置插件运行时依赖项，并与 `codex` 插件的其余依赖项一起准备就绪。这可以让 app-server 版本绑定到内置插件，而不是绑定到本地碰巧安装的某个独立 Codex CLI。只有在你明确想运行不同可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及 `sandbox: "danger-full-access"`。这是用于自主心跳的可信本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停在无人可响应的原生审批提示上。

如果要启用由 Codex guardian 审核的审批，请设置 `appServer.mode: "guardian"`：

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

Guardian 模式使用 Codex 的原生自动审核审批路径。当 Codex 请求离开沙箱、在工作区之外写入，或添加网络访问等权限时，Codex 会将该审批请求路由给原生审核器，而不是人工提示。审核器会套用 Codex 的风险框架，并批准或拒绝该具体请求。如果你希望比 YOLO 模式有更多护栏，但仍需要无人值守的智能体持续推进，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。单独的策略字段仍然会覆盖 `mode`，因此高级部署可以将该预设与显式选择混合使用。旧的 `guardian_subagent` reviewer 值仍然作为兼容别名被接受，但新配置应使用 `auto_review`。

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

| 字段 | 默认值 | 含义 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `transport` | `"stdio"` | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command` | 托管的 Codex 二进制文件 | 用于 stdio 传输的可执行文件。留空时使用托管二进制文件；仅在明确覆盖时设置。 |
| `args` | `["app-server", "--listen", "stdio://"]` | stdio 传输的参数。 |
| `url` | 未设置 | WebSocket app-server URL。 |
| `authToken` | 未设置 | WebSocket 传输的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket 标头。 |
| `requestTimeoutMs` | `60000` | app-server 控制平面调用的超时时间。 |
| `mode` | `"yolo"` | YOLO 或 guardian 审核执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程启动/恢复/回合的原生 Codex 审批策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程启动/恢复的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"auto_review"` 可让 Codex 审核原生审批提示。`guardian_subagent` 仍是旧版别名。 |
| `serviceTier` | 未设置 | 可选的 Codex app-server service tier：`"fast"`、`"flex"` 或 `null`。无效的旧值会被忽略。 |

环境变量覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，推荐使用配置，因为这样可以将插件行为与 Codex harness 设置的其余部分放在同一个经过审查的文件中。

## Computer Use

Computer Use 有单独的设置指南：
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

简而言之：OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作。它会准备 Codex app-server，验证 `computer-use` MCP 服务器是否可用，然后让 Codex 在 Codex 模式回合中处理原生 MCP 工具调用。

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

Computer Use 仅适用于 macOS，在 Codex MCP 服务器控制应用之前，可能需要本地操作系统权限。如果 `computerUse.enabled` 为 true 且 MCP 服务器不可用，Codex 模式回合会在线程启动前失败，而不是悄悄在没有原生 Computer Use 工具的情况下运行。有关 marketplace 选择、远程目录限制、状态原因和故障排除，请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

当 `computerUse.autoInstall` 为 true 时，如果 Codex 尚未发现本地 marketplace，OpenClaw 可以从 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 注册标准内置的 Codex Desktop marketplace。更改运行时或 Computer Use 配置后，请使用 `/new` 或 `/reset`，这样现有会话就不会继续保留旧的 PI 或 Codex 线程绑定。

## 常用配方

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有的 Codex 线程时，下一个回合会再次将当前选定的 OpenAI 模型、提供商、审批策略、沙箱和 service tier 发送给 app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选择的模型继续运行。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用的，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
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

`/codex resume` 会写入与 harness 在普通回合中使用的相同 sidecar 绑定文件。在下一条消息时，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传递给 app-server，并继续启用扩展历史记录。

该命令界面要求 Codex app-server `0.125.0` 或更高版本。如果未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，单个控制方法会被报告为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级 | 所有者 | 用途 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子 | OpenClaw | 在 PI 和 Codex harness 之间提供产品/插件兼容性。 |
| Codex app-server 扩展中间件 | OpenClaw 内置插件 | 围绕 OpenClaw 动态工具的逐回合适配器行为。 |
| Codex 原生钩子 | Codex | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。 |

OpenClaw 不会使用项目级或全局 Codex `hooks.json` 文件来路由 OpenClaw 插件行为。对于受支持的原生工具和权限桥接，OpenClaw 会为每个线程注入 Codex 配置，用于 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop`。其他 Codex 钩子，例如 `SessionStart` 和 `UserPromptSubmit`，仍然是 Codex 级控制；在 v1 合约中，它们不会作为 OpenClaw 插件钩子暴露。

对于 OpenClaw 动态工具，Codex 发起调用请求后，OpenClaw 才会执行工具，因此 OpenClaw 会在 harness 适配器中触发其拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范工具记录。OpenClaw 可以镜像部分事件，但除非 Codex 通过 app-server 或原生钩子回调公开该操作，否则它无法重写原生 Codex 线程。

压缩和 LLM 生命周期投影来自 Codex app-server 通知以及 OpenClaw 适配器状态，而不是来自原生 Codex 钩子命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是适配器级观察结果，而不是对 Codex 内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为用于轨迹和调试的 `codex_app_server.hook` 智能体事件。它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是底层只换了一个模型调用的 PI。Codex 拥有更多原生模型循环，而 OpenClaw 会围绕这一边界适配自己的插件和会话界面。

Codex 运行时 v1 中支持的内容：

| 界面 | 支持情况 | 原因 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环 | 支持 | Codex app-server 负责 OpenAI 回合、原生线程恢复和原生工具续接。 |
| OpenClaw 渠道路由和投递 | 支持 | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道仍然位于模型运行时之外。 |
| OpenClaw 动态工具 | 支持 | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍处于执行路径中。 |
| 提示和上下文插件 | 支持 | OpenClaw 会在启动或恢复线程之前构建提示叠加层，并将上下文投影到 Codex 回合中。 |
| 上下文引擎生命周期 | 支持 | 组装、摄取或回合后维护，以及上下文引擎压缩协调，都适用于 Codex 回合。 |
| 动态工具钩子 | 支持 | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕 OpenClaw 拥有的动态工具运行。 |
| 生命周期钩子 | 作为适配器观察结果支持 | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会使用真实的 Codex 模式载荷触发。 |
| 最终答案修订门控 | 通过原生钩子中继支持 | Codex `Stop` 会中继到 `before_agent_finalize`；`revise` 会在最终完成前请求 Codex 再进行一次模型推理。 |
| 原生 shell、patch 和 MCP 阻止或观察 | 通过原生钩子中继支持 | Codex `PreToolUse` 和 `PostToolUse` 会针对已承诺的原生工具界面进行中继，包括 Codex app-server `0.125.0` 或更高版本上的 MCP 载荷。支持阻止，不支持参数重写。 |
| 原生权限策略 | 通过原生钩子中继支持 | 当运行时暴露该能力时，Codex `PermissionRequest` 可以通过 OpenClaw 策略进行路由。如果 OpenClaw 不返回决策，Codex 会继续沿用其正常的 guardian 或用户审批路径。 |
| app-server 轨迹捕获 | 支持 | OpenClaw 会记录其发送给 app-server 的请求，以及从 app-server 收到的通知。 |

Codex 运行时 v1 中不支持的内容：

| 界面 | V1 边界 | 未来路径 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更 | Codex 原生 pre-tool 钩子可以阻止，但 OpenClaw 不会重写 Codex 原生工具参数。 | 需要 Codex 钩子/模式支持替换工具输入。 |
| 可编辑的 Codex 原生转录历史 | Codex 拥有规范的原生线程历史。OpenClaw 拥有一个镜像，并可以投影未来上下文，但不应修改不受支持的内部结构。 | 如果需要原生线程手术操作，则添加显式 Codex app-server API。 |
| 用于 Codex 原生工具记录的 `tool_result_persist` | 该钩子转换的是 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。 | 可以镜像转换后的记录，但规范重写需要 Codex 支持。 |
| 丰富的原生压缩元数据 | OpenClaw 可以观察压缩开始和完成，但不会收到稳定的保留/丢弃列表、token 变化量或摘要载荷。 | 需要更丰富的 Codex 压缩事件。 |
| 压缩干预 | 当前 OpenClaw 压缩钩子在 Codex 模式下仅限通知级别。 | 如果插件需要否决或重写原生压缩，则添加 Codex 前/后压缩钩子。 |
| 逐字节的模型 API 请求捕获 | OpenClaw 可以捕获 app-server 请求和通知，但 Codex core 会在内部构建最终的 OpenAI API 请求。 | 需要 Codex 模型请求追踪事件或调试 API。 |

## 工具、媒体和压缩

Codex harness 只会改变底层的嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，都会继续通过正常的 OpenClaw 投递路径处理。

原生钩子中继有意保持通用，但 v1 支持合约仅限于 OpenClaw 已测试的 Codex 原生工具和权限路径。在 Codex 运行时中，这包括 shell、patch 和 MCP 的 `PreToolUse`、`PostToolUse` 以及 `PermissionRequest` 载荷。在运行时合约明确命名前，不要假设未来每个 Codex 钩子事件都会成为 OpenClaw 插件界面。

对于 `PermissionRequest`，只有在策略做出决定时，OpenClaw 才会返回显式的允许或拒绝决策。无决策结果并不等于允许。Codex 会将其视为没有钩子决策，并回退到它自己的 guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件审批流程进行路由。Codex 的 `request_user_input` 提示会被发送回原始聊天，而下一个排队的后续消息会回答那个原生服务器请求，而不是作为额外上下文进行引导。其他 MCP 征询请求仍然会以失败关闭。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史记录、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换。这个镜像包括用户提示、最终助手文本，以及 app-server 发出这些内容时的轻量级 Codex 推理或计划记录。当前，OpenClaw 只记录原生压缩开始和完成信号。它尚未公开可供人类阅读的压缩摘要，也未提供 Codex 在压缩后保留了哪些条目的可审计列表。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它只在 OpenClaw 正在写入由 OpenClaw 拥有的会话转录工具结果时生效。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解仍会继续使用对应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 没有作为普通 `/model` provider 出现：** 这对新配置来说是预期行为。请选择 `openai/gpt-*` 模型，并设置 `agentRuntime.id: "codex"`（或使用旧版 `codex/*` 引用），启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用的是 PI 而不是 Codex：** `agentRuntime.id: "auto"` 在没有 Codex harness 接管该运行时，仍可能使用 PI 作为兼容后端。测试时请设置 `agentRuntime.id: "codex"` 以强制选择 Codex。强制使用 Codex 运行时现在会直接失败，而不是回退到 PI，除非你显式设置 `agentRuntime.fallback: "pi"`。一旦选择了 Codex app-server，它的失败会直接暴露出来，不需要额外的后备配置。

**app-server 被拒绝：** 请升级 Codex，使 app-server 握手报告版本为 `0.125.0` 或更新版本。相同版本号的预发布版本或带构建后缀的版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，都会被拒绝，因为 OpenClaw 测试所依据的协议下限是稳定版 `0.125.0`。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`，或禁用发现。

**WebSocket 传输立即失败：** 请检查 `appServer.url`、`authToken`，并确认远程 app-server 使用的是相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 这是预期行为，除非你为该智能体强制设置了 `agentRuntime.id: "codex"`，或者选择了旧版 `codex/*` 引用。普通的 `openai/gpt-*` 和其他提供商引用在 `auto` 模式下会保留其正常的提供商路径。如果你强制设置了 `agentRuntime.id: "codex"`，则该智能体的每个嵌入式回合都必须是 Codex 支持的 OpenAI 模型。

**Computer Use 已安装，但工具无法运行：** 请在一个新会话中检查 `/codex computer-use status`。如果某个工具报告 `Native hook relay unavailable`，请使用 `/new` 或 `/reset`；如果问题仍然存在，请重启 Gateway 网关以清除过时的原生钩子注册。如果 `computer-use.list_apps` 超时，请重启 Codex Computer Use 或 Codex Desktop，然后重试。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [插件钩子](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
