---
read_when:
    - 你想使用内置的 Codex app-server harness。
    - 你需要 Codex harness 配置示例。
    - 你希望仅使用 Codex 的部署在无法使用时直接失败，而不是回退到 Pi。
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 内嵌智能体回合
title: Codex harness
x-i18n:
    generated_at: "2026-04-25T05:55:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件可让 OpenClaw 通过 Codex app-server，而不是内置的 Pi harness，来运行内嵌智能体回合。

当你希望 Codex 接管底层智能体会话时，请使用此方式：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

如果你正在建立整体认识，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简而言之：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍然是通信界面。

原生 Codex 回合会将 OpenClaw 插件钩子保留为公共兼容层。
这些是 OpenClaw 进程内钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`、`after_compaction`
- `llm_input`、`llm_output`
- `before_tool_call`、`after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- `agent_end`

插件还可以注册与运行时无关的工具结果中间件，在 OpenClaw 执行工具之后、结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公共 `tool_result_persist` 插件钩子不同，后者会转换由 OpenClaw 持有的转录工具结果写入。

有关插件钩子语义本身，请参见 [插件钩子](/zh-CN/plugins/hooks)
和 [插件保护行为](/zh-CN/tools/plugin)。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用采用规范形式 `openai/gpt-*`，并在希望使用原生 app-server 执行时，显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用仍会为了兼容性自动选择该 harness，但由运行时支持的旧版 provider 前缀不会显示为普通模型/提供商选项。

## 选择正确的模型前缀

OpenAI 系列路由对前缀非常敏感。当你希望通过 Pi 使用 Codex OAuth 时，请使用 `openai-codex/*`；当你希望直接访问 OpenAI API，或者你正在强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| 模型引用                                              | 运行时路径                                     | 使用场景                                                                  |
| ----------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | 通过 OpenClaw/Pi 管线路径的 OpenAI provider    | 你希望通过 `OPENAI_API_KEY` 访问当前的 OpenAI Platform API。              |
| `openai-codex/gpt-5.5`                                | 通过 OpenClaw/Pi 的 OpenAI Codex OAuth         | 你希望使用默认 Pi 运行器搭配 ChatGPT/Codex 订阅身份验证。                 |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness                       | 你希望内嵌智能体回合通过原生 Codex app-server 执行。                      |

目前在 OpenClaw 中，GPT-5.5 仅支持订阅/OAuth。对于 Pi OAuth，请使用 `openai-codex/gpt-5.5`；对于 Codex app-server harness，请使用 `openai/gpt-5.5`。一旦 OpenAI 在公共 API 上启用 GPT-5.5，`openai/gpt-5.5` 也将支持直接 API key 访问。

旧版 `codex/gpt-*` 引用仍作为兼容别名被接受。Doctor 兼容迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略；而仅作为回退的旧版引用则保持不变，因为运行时是针对整个智能体容器配置的。新的 Pi Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生 app-server harness 配置应使用 `openai/gpt-*` 加上
`embeddedHarness.runtime: "codex"`。

`agents.defaults.imageModel` 也遵循同样的前缀划分。若图像理解应通过 OpenAI Codex OAuth provider 路径运行，请使用 `openai-codex/gpt-*`。若图像理解应通过受限的 Codex app-server 回合运行，请使用 `codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；仅文本的 Codex 模型会在媒体回合开始前失败。

使用 `/status` 可确认当前会话的实际 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查网关的结构化 `agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

Harness 选择不是实时会话控制。当某个内嵌回合运行时，OpenClaw 会将所选 harness id 记录到该会话中，并在同一会话 id 的后续回合中继续使用它。当你希望未来会话使用其他 harness 时，请更改 `embeddedHarness` 配置或 `OPENCLAW_AGENT_RUNTIME`；在将现有对话从 Pi 切换到 Codex 之前，请使用 `/new` 或 `/reset` 启动新会话。这样可避免通过两个不兼容的原生会话系统重放同一份转录。

在 harness 固定机制出现之前创建的旧会话，一旦已有转录历史，就会被视为固定到 Pi。更改配置后，如需让该对话切换到 Codex，请使用 `/new` 或 `/reset`。

`/status` 会显示实际模型运行时。默认 Pi harness 显示为
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，且内置 `codex` 插件可用。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex 身份验证。

该插件会阻止较旧或未标明版本的 app-server 握手。这样可确保
OpenClaw 仅运行在它已测试过的协议接口上。

对于实时和 Docker 冒烟测试，身份验证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
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
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

如果你的配置使用了 `plugins.allow`，也请将 `codex` 包含进去：

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

仍将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 的旧配置，依然会自动启用内置 `codex` 插件。新配置应优先使用 `openai/<model>` 加上上面的显式 `embeddedHarness` 条目。

## 将 Codex 与其他模型一起使用

如果同一个智能体需要在 Codex 和非 Codex provider 模型之间自由切换，请不要全局设置 `runtime: "codex"`。强制运行时会应用到该智能体或会话的每个内嵌回合。如果在运行时被强制时选择了 Anthropic 模型，OpenClaw 仍会尝试 Codex harness，并以失败关闭，而不是悄悄通过 Pi 路由该回合。

请改用以下结构之一：

- 将 Codex 放到一个专用智能体上，并设置 `embeddedHarness.runtime: "codex"`。
- 让默认智能体保持 `runtime: "auto"`，并使用 Pi 回退，以支持普通的混合 provider 使用场景。
- 仅将旧版 `codex/*` 引用用于兼容性。新配置应优先使用 `openai/*` 加显式 Codex 运行时策略。

例如，下面的配置让默认智能体保持正常自动选择，同时添加一个单独的 Codex 智能体：

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
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

采用这种结构时：

- 默认的 `main` 智能体使用普通 provider 路径和 Pi 兼容回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果对于 `codex` 智能体来说，Codex 缺失或不受支持，则该回合会失败，而不是悄悄改用 Pi。

## 仅 Codex 部署

当你需要证明每个内嵌智能体回合都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不使用 Pi 回退，因此 `fallback: "none"` 是可选的，但通常有助于作为文档说明：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
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

强制使用 Codex 时，如果 Codex 插件被禁用、app-server 版本过旧，或者 app-server 无法启动，OpenClaw 会尽早失败。仅当你明确希望缺失 harness 选择时由 Pi 接管，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体使用 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体保持正常自动选择：

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

使用普通会话命令来切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，而 Codex harness 会按需创建或恢复其 sidecar app-server 线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一回合根据当前配置重新解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果发现失败或超时，它会使用内置回退目录，其中包含：

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

默认情况下，插件会通过以下方式在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是可信本地操作员姿态，也用于自治心跳：Codex 可以使用 shell 和网络工具，而不会卡在无人响应的原生审批提示上。

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

Guardian 模式会使用 Codex 的原生自动审核审批路径。当 Codex 请求离开沙箱、在工作区之外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给原生审核器，而不是向人工发出提示。审核器会应用 Codex 的风险框架，并批准或拒绝具体请求。如果你希望比 YOLO 模式拥有更多防护措施，但仍需要无人值守的智能体持续推进，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
单独的策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选项混合使用。较旧的 `guardian_subagent` 审核器值仍作为兼容别名被接受，但新配置应使用 `auto_review`。

对于已经运行中的 app-server，请使用 WebSocket 传输：

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

| 字段                | 默认值                                   | 含义                                                                                                      |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                    |
| `command`           | `"codex"`                                | 用于 stdio 传输的可执行文件。                                                                             |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                                                   |
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                |
| `authToken`         | 未设置                                   | 用于 WebSocket 传输的 Bearer token。                                                                      |
| `headers`           | `{}`                                     | 额外的 WebSocket 请求头。                                                                                 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                       |
| `mode`              | `"yolo"`                                 | 用于 YOLO 或 guardian 审核执行的预设。                                                                    |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/回合的原生 Codex 审批策略。                                                           |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审核原生审批提示。`guardian_subagent` 仍保留为旧版别名。                   |
| `serviceTier`       | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                   |

较旧的环境变量在对应配置字段未设置时，仍可作为本地测试的回退方案：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，更推荐使用配置，因为这样能将插件行为与 Codex harness 其余设置保存在同一个经过审查的文件中。

## 常用方案

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
      embeddedHarness: {
        runtime: "codex",
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

带显式请求头的远程 app-server：

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

模型切换仍由 OpenClaw 控制。当某个 OpenClaw 会话附加到现有 Codex 线程时，下一回合会再次将当前选定的 OpenAI 模型、provider、审批策略、沙箱和服务层级发送到 app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 继续使用新选择的模型。

## Codex 命令

内置插件将 `/codex` 注册为授权的斜杠命令。它是通用命令，可在任何支持 OpenClaw 文本命令的渠道上使用。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加线程启动 Codex 原生审核。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 在普通回合中使用的同一个 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入 app-server，并保持启用扩展历史记录。

该命令面要求 Codex app-server `0.118.0` 或更高版本。如果未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，各个控制方法将显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 在 Pi 和 Codex harness 之间提供产品/插件兼容性。                   |
| Codex app-server 扩展中间件           | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐回合适配器行为。                          |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。               |

OpenClaw 不会使用项目级或全局 Codex `hooks.json` 文件来路由 OpenClaw 插件行为。对于受支持的原生工具和权限桥接，OpenClaw 会为每个线程注入 Codex 配置，以支持 `PreToolUse`、`PostToolUse` 和 `PermissionRequest`。其他 Codex 钩子，例如 `SessionStart`、
`UserPromptSubmit` 和 `Stop`，仍属于 Codex 级控制；它们在 v1 合约中不会作为 OpenClaw 插件钩子暴露。

对于 OpenClaw 动态工具，Codex 请求调用后由 OpenClaw 执行该工具，因此 OpenClaw 会在 harness 适配器中触发其拥有的插件和中间件行为。对于 Codex 原生工具，Codex 持有规范的工具记录。OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子回调暴露该操作，否则无法重写原生 Codex 线程。

压缩和 LLM 生命周期投影来自 Codex app-server 通知和 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件属于适配器级观察结果，并不是对 Codex 内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为用于轨迹和调试的 `codex_app_server.hook` 智能体事件。它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是仅仅把底层模型调用换成另一个模型的 Pi。Codex 拥有更多原生模型循环的控制权，而 OpenClaw 会围绕该边界适配其插件和会话界面。

Codex 运行时 v1 中受支持的内容：

| 界面                                  | 支持情况                             | 原因                                                                                                                                       |
| ------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 通过 Codex 的 OpenAI 模型循环         | 支持                                 | Codex app-server 负责 OpenAI 回合、原生线程恢复和原生工具续接。                                                                           |
| OpenClaw 渠道路由和传递               | 支持                                 | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道仍位于模型运行时之外。                                                             |
| OpenClaw 动态工具                     | 支持                                 | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍处于执行路径中。                                                                       |
| 提示词和上下文插件                    | 支持                                 | OpenClaw 会在启动或恢复线程前构建提示词叠层，并将上下文投影到 Codex 回合中。                                                              |
| 上下文引擎生命周期                    | 支持                                 | 装配、摄取或回合后维护，以及上下文引擎压缩协调，都会在 Codex 回合中运行。                                                                 |
| 动态工具钩子                          | 支持                                 | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕由 OpenClaw 持有的动态工具运行。                                              |
| 生命周期钩子                          | 以适配器观察形式支持                 | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式载荷触发。                        |
| 原生 shell 和 patch 的阻止或观察      | 通过原生钩子中继支持                 | 已提交的原生工具界面会中继 Codex `PreToolUse` 和 `PostToolUse`。支持阻止，但不支持参数重写。                                              |
| 原生权限策略                          | 通过原生钩子中继支持                 | 在运行时暴露该能力的情况下，Codex `PermissionRequest` 可通过 OpenClaw 策略进行路由。                                                      |
| App-server 轨迹捕获                   | 支持                                 | OpenClaw 会记录它发送给 app-server 的请求，以及它从 app-server 接收到的通知。                                                             |

Codex 运行时 v1 中不支持的内容：

| 界面                                                | V1 边界                                                                                                                                       | 未来路径                                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 原生工具参数变更                                    | Codex 原生 pre-tool 钩子可以阻止调用，但 OpenClaw 不会重写 Codex 原生工具参数。                                                              | 需要 Codex 钩子/schema 支持替换后的工具输入。                                                             |
| 可编辑的 Codex 原生转录历史                         | Codex 持有规范的原生线程历史。OpenClaw 持有镜像并可以投影未来上下文，但不应修改不受支持的内部实现。                                         | 如果需要原生线程手术能力，需要添加显式的 Codex app-server API。                                          |
| 面向 Codex 原生工具记录的 `tool_result_persist`     | 该钩子会转换由 OpenClaw 持有的转录写入，而不是 Codex 原生工具记录。                                                                           | 可以镜像转换后的记录，但规范性重写仍需要 Codex 支持。                                                    |
| 丰富的原生压缩元数据                                | OpenClaw 可以观察压缩开始和完成，但不会接收到稳定的保留/丢弃列表、token 增量或摘要载荷。                                                     | 需要更丰富的 Codex 压缩事件。                                                                             |
| 压缩干预                                            | 当前在 Codex 模式下，OpenClaw 的压缩钩子仅处于通知级别。                                                                                      | 如果插件需要否决或重写原生压缩，则需添加 Codex pre/post compaction 钩子。                                |
| 停止或最终答案门控                                  | Codex 有原生停止钩子，但 OpenClaw 未将最终答案门控作为 v1 插件合约公开。                                                                      | 未来可提供带循环与超时保护的可选原语。                                                                    |
| 作为已承诺 v1 界面的原生 MCP 钩子对等能力           | 中继是通用的，但 OpenClaw 尚未对原生 MCP pre/post 钩子行为进行端到端版本门控和测试。                                                         | 一旦受支持的 app-server 协议下限覆盖这些载荷，就添加 OpenClaw MCP 中继测试和文档。                      |
| 逐字节的模型 API 请求捕获                           | OpenClaw 可以捕获 app-server 请求和通知，但最终的 OpenAI API 请求由 Codex 核心在内部构建。                                                   | 需要 Codex 的模型请求追踪事件或调试 API。                                                                 |

## 工具、媒体与压缩

Codex harness 只改变底层内嵌智能体执行器。

OpenClaw 仍会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，仍通过 OpenClaw 的正常传递路径处理。

原生钩子中继是有意保持通用的，但 v1 支持合约仅限于 OpenClaw 已测试的 Codex 原生工具与权限路径。在运行时合约明确命名之前，不要假设未来任何 Codex 钩子事件都会成为 OpenClaw 插件界面。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批引导会通过 OpenClaw 的插件审批流程进行路由。Codex 的 `request_user_input` 提示会被发回原始聊天，之后排队的下一条跟进消息将用于回答该原生服务器请求，而不是被作为额外上下文引导。其他 MCP 引导请求仍会以失败关闭。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该镜像包括用户提示、最终助手文本，以及 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未提供可供人阅读的压缩摘要，也无法审计 Codex 在压缩后保留了哪些条目。

由于 Codex 持有规范的原生线程，`tool_result_persist` 目前不会重写 Codex 原生工具结果记录。它仅在 OpenClaw 写入 OpenClaw 持有的会话转录工具结果时适用。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍继续使用对应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 没有作为普通 `/model` provider 出现：** 对于新配置，这是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`embeddedHarness.runtime: "codex"`（或使用旧版 `codex/*` 引用），启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用的是 Pi 而不是 Codex：** `runtime: "auto"` 在没有 Codex harness 声明接管运行时，仍可能使用 Pi 作为兼容后端。测试时请设置
`embeddedHarness.runtime: "codex"` 以强制选择 Codex。现在，强制使用 Codex 运行时会直接失败，而不是回退到 Pi，除非你显式设置
`embeddedHarness.fallback: "pi"`。一旦选中了 Codex app-server，其失败会直接暴露，不需要额外的回退配置。

**app-server 被拒绝：** 请升级 Codex，使 app-server 握手报告版本
`0.118.0` 或更高。

**模型发现过慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 请检查 `appServer.url`、`authToken`，以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 Pi：** 这是预期行为，除非你为该智能体强制设置了
`embeddedHarness.runtime: "codex"`，或者选择了旧版 `codex/*` 引用。普通的 `openai/gpt-*` 和其他 provider 引用在 `auto` 模式下会保持使用它们的正常 provider 路径。如果你强制设置 `runtime: "codex"`，则该智能体的每个内嵌回合都必须使用 Codex 支持的 OpenAI 模型。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [插件钩子](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
