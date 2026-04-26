---
read_when:
    - 你想使用内置的 Codex 应用服务器编排器
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在无法使用时直接失败，而不是回退到 Pi
summary: 通过内置的 Codex 应用服务器编排器运行 OpenClaw 嵌入式智能体回合
title: Codex harness
x-i18n:
    generated_at: "2026-04-26T00:04:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccd3616a944f83eda679e030a65f9febbe8c4f69100675ead8fa5d2c72142ce3
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 通过 Codex 应用服务器而不是内置的 Pi 编排器运行嵌入式智能体回合。

当你希望由 Codex 接管底层智能体会话时，请使用它：模型发现、原生线程恢复、原生压缩，以及应用服务器执行。
OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传输，以及可见的转录镜像。

如果你正在了解整体结构，请先从 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。简短版本是：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、
Discord、Slack 或其他渠道仍然是通信界面。

同一个插件还负责原生 `/codex` 聊天控制命令界面。如果
插件已启用，并且用户要求从聊天中绑定、恢复、引导、停止或检查
Codex 线程，智能体应优先使用 `/codex ...` 而不是 ACP。当用户明确要求 ACP/acpx，或正在测试 ACP 的 Codex 适配器时，ACP 仍然是显式回退方案。

原生 Codex 回合将 OpenClaw 插件钩子保留为公共兼容层。
这些是进程内的 OpenClaw 钩子，而不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`，用于镜像转录记录
- `agent_end`

插件还可以注册与运行时无关的工具结果中间件，在 OpenClaw 执行工具之后、结果返回给 Codex 之前，重写 OpenClaw 的动态工具结果。这与公共
`tool_result_persist` 插件钩子不同，后者用于转换由 OpenClaw 管理的转录工具结果写入。

关于插件钩子语义本身，请参见 [Plugin hooks](/zh-CN/plugins/hooks)
和 [Plugin guard behavior](/zh-CN/tools/plugin)。

该编排器默认关闭。新配置应保持 OpenAI 模型引用的规范形式为 `openai/gpt-*`，并在需要原生应用服务器执行时，显式强制指定
`embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。
旧版 `codex/*` 模型引用仍会自动选择该编排器以保持兼容性，但由运行时支持的旧版提供商前缀不会显示为普通模型/提供商选项。

## 选择正确的模型前缀

OpenAI 系列路由依赖特定前缀。当你希望通过 Pi 使用
Codex OAuth 时，使用 `openai-codex/*`；当你希望直接访问 OpenAI API，或在强制使用原生 Codex 应用服务器编排器时，使用 `openai/*`：

| 模型引用                                              | 运行时路径                                  | 使用场景                                                                  |
| ----------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | 通过 OpenClaw/Pi 管线的 OpenAI provider     | 你希望通过 `OPENAI_API_KEY` 使用当前直接 OpenAI Platform API 访问。       |
| `openai-codex/gpt-5.5`                                | 通过 OpenClaw/Pi 的 OpenAI Codex OAuth      | 你希望使用默认 Pi 运行器进行 ChatGPT/Codex 订阅认证。                     |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex 应用服务器编排器                      | 你希望嵌入式智能体回合使用原生 Codex 应用服务器执行。                     |

GPT-5.5 目前在 OpenClaw 中仅支持订阅/OAuth。对于 Pi OAuth，请使用
`openai-codex/gpt-5.5`；对于 Codex 应用服务器编排器，请使用 `openai/gpt-5.5` 搭配 Codex
应用服务器编排器。对于 `openai/gpt-5.5` 的直接 API key 访问，将在
OpenAI 在公共 API 中启用 GPT-5.5 后获得支持。

旧版 `codex/gpt-*` 引用仍然接受，作为兼容别名。Doctor
兼容性迁移会将旧版主运行时引用重写为规范模型引用，并将运行时策略单独记录；而仅作为回退使用的旧版引用则保持不变，因为运行时是为整个智能体容器配置的。
新的 Pi Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生
应用服务器编排器配置应使用 `openai/gpt-*`，并配合
`embeddedHarness.runtime: "codex"`。

`agents.defaults.imageModel` 遵循相同的前缀拆分。如果图像理解应通过 OpenAI
Codex OAuth 提供商路径运行，请使用 `openai-codex/gpt-*`。如果图像理解应通过受限的 Codex 应用服务器回合运行，请使用 `codex/gpt-*`。Codex 应用服务器模型必须声明支持图像输入；仅文本的 Codex 模型会在媒体回合开始前失败。

使用 `/status` 来确认当前会话的实际编排器。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它包含所选编排器 id、选择原因、运行时/回退策略，以及在 `auto` 模式下，每个插件候选项的支持结果。

编排器选择不是实时会话控制。当嵌入式回合运行时，
OpenClaw 会在该会话上记录所选编排器 id，并在同一会话 id 的后续回合中继续使用它。当你希望未来的会话改用其他编排器时，请修改 `embeddedHarness` 配置或
`OPENCLAW_AGENT_RUNTIME`；在将现有对话从 Pi 切换到 Codex 之前，请使用 `/new` 或 `/reset` 启动新会话。这样可以避免通过两个不兼容的原生会话系统重放同一份转录。

在引入编排器固定之前创建的旧会话，一旦拥有转录历史，就会被视为固定到 Pi。更改配置后，请使用 `/new` 或 `/reset` 将该对话切换到 Codex。

`/status` 会显示实际模型运行时。默认的 Pi 编排器显示为
`Runtime: OpenClaw Pi Default`，而 Codex 应用服务器编排器显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，并且可使用内置的 `codex` 插件。
- Codex 应用服务器 `0.125.0` 或更高版本。内置插件默认会管理一个兼容的
  Codex 应用服务器二进制文件，因此 `PATH` 上本地的 `codex` 命令不会影响正常的编排器启动。
- 应用服务器进程可用的 Codex 认证信息。

该插件会阻止较旧或未带版本信息的应用服务器握手。
这样可确保 OpenClaw 仅运行在它已测试过的协议接口上。

对于 live 和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，再加上可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
`~/.codex/config.toml`。请使用与你本地 Codex 应用服务器相同的认证材料。

## 最小配置

使用 `openai/gpt-5.5`，启用内置插件，并强制使用 `codex` 编排器：

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

将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>` 的旧配置，仍会自动启用内置 `codex` 插件。新配置应优先使用
`openai/<model>`，并配合上面显式的 `embeddedHarness` 条目。

## 在其他模型旁边添加 Codex

如果同一个智能体需要在 Codex 和非 Codex 提供商模型之间自由切换，就不要全局设置 `runtime: "codex"`。
强制运行时会应用于该智能体或会话的每一个嵌入式回合。如果你在强制该运行时时选择了 Anthropic 模型，OpenClaw 仍会尝试 Codex 编排器，并以失败结束，而不会悄悄通过 Pi 路由该回合。

请改用以下结构之一：

- 将 Codex 放到专用智能体上，并设置 `embeddedHarness.runtime: "codex"`。
- 将默认智能体保持在 `runtime: "auto"` 和 Pi 回退，以用于正常的混合提供商用法。
- 仅为兼容性使用旧版 `codex/*` 引用。新配置应优先使用
  `openai/*`，并配合显式的 Codex 运行时策略。

例如，下面的配置会让默认智能体保持正常自动选择，
并添加一个单独的 Codex 智能体：

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

在这种结构下：

- 默认的 `main` 智能体使用正常的提供商路径和 Pi 兼容性回退。
- `codex` 智能体使用 Codex 应用服务器编排器。
- 如果 `codex` 智能体缺少 Codex 或不受支持，该回合会失败，
  而不是悄悄使用 Pi。

## 仅使用 Codex 的部署

当你需要证明每个嵌入式智能体回合
都使用 Codex 时，请强制使用 Codex 编排器。显式插件运行时默认不使用 Pi 回退，因此
`fallback: "none"` 是可选的，但通常可作为文档说明使用：

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

环境覆盖：

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

在强制使用 Codex 的情况下，如果 Codex 插件被禁用、
应用服务器版本过旧，或者应用服务器无法启动，OpenClaw 会提前失败。仅当你确实希望由 Pi 处理缺失的编排器选择时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体使用 Codex

你可以让一个智能体仅使用 Codex，同时让默认智能体保持正常的自动选择：

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

使用普通会话命令切换智能体和模型。`/new` 会创建一个新的
OpenClaw 会话，而 Codex 编排器会根据需要创建或恢复其侧车应用服务器线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一回合再次根据当前配置解析编排器。

## 模型发现

默认情况下，Codex 插件会向应用服务器查询可用模型。如果
发现失败或超时，它会使用内置的回退目录，包含：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

你可以在 `plugins.entries.codex.config.discovery` 下调整发现设置：

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

如果你希望启动时避免探测 Codex 并固定使用回退目录，
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

## 应用服务器连接和策略

默认情况下，插件会在本地启动由 OpenClaw 管理的 Codex 二进制文件，命令为：

```bash
codex app-server --listen stdio://
```

该受管二进制文件被声明为内置插件运行时依赖，并与其余
`codex` 插件依赖一起分阶段提供。这样可以让应用服务器版本与内置插件保持绑定，而不是依赖本地碰巧安装的某个独立 Codex CLI。
只有在你明确希望运行其他可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 以 YOLO 模式启动本地 Codex 编排器会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自治心跳的受信任本地操作员姿态：
Codex 可以使用 shell 和网络工具，而不会停在无人响应的原生审批提示上。

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
沙箱、在工作区外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给原生审核器，而不是人工提示。审核器会应用 Codex 的风险框架，并批准或拒绝该特定请求。当你希望比 YOLO 模式有更多护栏，但仍需要无人值守的智能体继续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
各个策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选项混合使用。较旧的 `guardian_subagent` 审核器值仍被接受，作为兼容别名，但新配置应使用
`auto_review`。

对于已在运行的应用服务器，请使用 WebSocket 传输：

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
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                      |
| `command`           | 由 OpenClaw 管理的 Codex 二进制文件      | 用于 stdio 传输的可执行文件。保持未设置以使用受管二进制文件；仅在明确覆盖时设置。                           |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                                                      |
| `url`               | 未设置                                   | WebSocket 应用服务器 URL。                                                                                   |
| `authToken`         | 未设置                                   | 用于 WebSocket 传输的 Bearer token。                                                                         |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。                                                                                      |
| `requestTimeoutMs`  | `60000`                                  | 应用服务器控制平面调用的超时时间。                                                                           |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 审核执行的预设。                                                                            |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/回合的原生 Codex 审批策略。                                                              |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                   |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审核原生审批提示。`guardian_subagent` 仍然是旧版别名。                         |
| `serviceTier`       | 未设置                                   | 可选的 Codex 应用服务器服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                      |

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过受管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，
因为这样可以将插件行为与其余 Codex 编排器设置保存在同一个已审查文件中。

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

仅使用 Codex 的编排器验证：

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

带显式标头的远程应用服务器：

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有的
Codex 线程时，下一回合会再次将当前选定的
OpenAI 模型、提供商、审批策略、沙箱和服务层级发送给
app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选择的模型继续运行。

## Codex 命令

内置插件将 `/codex` 注册为授权的斜杠命令。它是通用的，
适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加线程启动 Codex 原生审核。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器 Skills。

`/codex resume` 会写入与编排器在普通回合中使用的相同侧车绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入 app-server，并保持扩展历史启用。

该命令界面要求 Codex 应用服务器版本为 `0.125.0` 或更高。
如果未来版本或自定义应用服务器未公开该 JSON-RPC 方法，单独的控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex 编排器有三层钩子：

| 层级                                  | 所有者                   | 目的                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 在 Pi 和 Codex 编排器之间提供产品/插件兼容性。                      |
| Codex 应用服务器扩展中间件            | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的每回合适配器行为。                          |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。                |

OpenClaw 不使用项目级或全局的 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，
OpenClaw 会为 `PreToolUse`、`PostToolUse` 和
`PermissionRequest` 注入每线程的 Codex 配置。其他 Codex 钩子，例如 `SessionStart`、
`UserPromptSubmit` 和 `Stop`，仍然是 Codex 级控制；在 v1 合约中，它们不会作为 OpenClaw 插件钩子公开。

对于 OpenClaw 动态工具，在 Codex 请求调用后，OpenClaw 才会执行该工具，因此 OpenClaw 会在编排器适配器中触发其拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范工具记录。
OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子回调公开该操作，否则它无法重写原生 Codex 线程。

压缩和 LLM 生命周期投影来自 Codex app-server
通知和 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件属于适配器级观察，而不是对 Codex 内部请求或压缩负载的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为用于轨迹和调试的 `codex_app_server.hook` 智能体事件。
它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是底层只换了一个模型调用的 Pi。Codex 接管了更多
原生模型循环，而 OpenClaw 会围绕这一边界适配它的插件和会话界面。

Codex 运行时 v1 中支持：

| 界面                                         | 支持情况                                | 原因                                                                                                                                                                                                  |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环                | 支持                                    | Codex 应用服务器负责 OpenAI 回合、原生线程恢复和原生工具续接。                                                                                                                                         |
| OpenClaw 渠道路由和传输                      | 支持                                    | Telegram、Discord、Slack、WhatsApp、iMessage 和其他渠道仍位于模型运行时之外。                                                                                                                        |
| OpenClaw 动态工具                            | 支持                                    | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 始终位于执行路径中。                                                                                                                                |
| 提示词和上下文插件                           | 支持                                    | OpenClaw 会在启动或恢复线程之前构建提示词叠加层，并将上下文投射到 Codex 回合中。                                                                                                                      |
| 上下文引擎生命周期                           | 支持                                    | 组装、摄取或回合后维护，以及上下文引擎压缩协调都会在 Codex 回合中运行。                                                                                                                                |
| 动态工具钩子                                 | 支持                                    | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕 OpenClaw 管理的动态工具运行。                                                                                                            |
| 生命周期钩子                                 | 作为适配器观察支持                      | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式负载触发。                                                                                   |
| 原生 shell、patch 和 MCP 的阻止或观察        | 通过原生钩子中继支持                    | 对于已提交的原生工具界面，包括 Codex 应用服务器 `0.125.0` 或更高版本上的 MCP 负载，Codex 的 `PreToolUse` 和 `PostToolUse` 会被中继。支持阻止，但不支持参数重写。                                |
| 原生权限策略                                 | 通过原生钩子中继支持                    | 在运行时公开该能力的情况下，Codex 的 `PermissionRequest` 可以通过 OpenClaw 策略路由。如果 OpenClaw 不返回决策，Codex 会继续其正常的 guardian 或用户审批路径。                                      |
| 应用服务器轨迹捕获                           | 支持                                    | OpenClaw 会记录它发送给 app-server 的请求，以及它收到的 app-server 通知。                                                                                                                             |

在 Codex 运行时 v1 中不支持：

| 界面                                                | V1 边界                                                                                                                                          | 未来路径                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                                    | Codex 原生预工具钩子可以阻止，但 OpenClaw 不会重写 Codex 原生工具参数。                                                                          | 需要 Codex 钩子/模式支持用于替换工具输入。                                                 |
| 可编辑的 Codex 原生转录历史                         | Codex 拥有规范的原生线程历史。OpenClaw 拥有镜像，并可投射未来上下文，但不应修改不受支持的内部结构。                                             | 如果需要对原生线程进行操作，则需添加显式的 Codex app-server API。                         |
| 用于 Codex 原生工具记录的 `tool_result_persist`     | 该钩子会转换由 OpenClaw 管理的转录写入，而不是 Codex 原生工具记录。                                                                               | 可以镜像已转换的记录，但规范性重写需要 Codex 支持。                                       |
| 丰富的原生压缩元数据                                | OpenClaw 可以观察到压缩开始和完成，但不会收到稳定的保留/丢弃列表、token 增量或摘要负载。                                                         | 需要更丰富的 Codex 压缩事件。                                                             |
| 压缩干预                                            | 在 Codex 模式下，当前 OpenClaw 压缩钩子仅为通知级别。                                                                                              | 如果插件需要否决或重写原生压缩，则需添加 Codex 压缩前/后钩子。                            |
| 停止或最终答案门控                                  | Codex 具有原生停止钩子，但 OpenClaw 不会将最终答案门控公开为 v1 插件合约。                                                                         | 未来可加入带循环和超时保护的可选原语。                                                    |
| 逐字节的模型 API 请求捕获                           | OpenClaw 可以捕获 app-server 请求和通知，但 Codex 核心会在内部构建最终的 OpenAI API 请求。                                                         | 需要 Codex 模型请求跟踪事件或调试 API。                                                   |

## 工具、媒体和压缩

Codex 编排器只会改变底层嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从编排器接收动态工具结果。文本、图像、视频、音乐、TTS、审批和消息工具输出仍然通过正常的 OpenClaw 传输路径继续处理。

原生钩子中继被有意设计为通用机制，但 v1 支持合约仅限于 OpenClaw 已测试的 Codex 原生工具和权限路径。在
Codex 运行时中，这包括 shell、patch 和 MCP 的 `PreToolUse`、
`PostToolUse` 以及 `PermissionRequest` 负载。在运行时合约明确命名之前，不要假设未来每个 Codex 钩子事件都会成为 OpenClaw 插件界面。

对于 `PermissionRequest`，只有当策略做出决定时，OpenClaw 才会返回明确的允许或拒绝决策。无决策结果并不等于允许。Codex 会将其视为没有钩子决策，并继续走它自己的 guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件审批流程进行路由。Codex 的 `request_user_input` 提示会被发回原始聊天，而下一个排队的后续消息会响应该原生服务器请求，而不是作为额外上下文进行引导。其他 MCP 征询请求仍会以失败结束。

当所选模型使用 Codex 编排器时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或编排器切换。该镜像包含用户提示词、最终助手文本，以及当 app-server 发出这些内容时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未公开人类可读的压缩摘要，也未提供 Codex 在压缩后保留了哪些条目的可审计列表。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它仅在 OpenClaw 写入由 OpenClaw 管理的会话转录工具结果时适用。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍会继续使用相应的提供商/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和
`messages.tts`。

## 故障排除

**Codex 没有显示为普通 `/model` 提供商：** 这对于新配置是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`embeddedHarness.runtime: "codex"`（或使用旧版 `codex/*` 引用），启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用了 Pi 而不是 Codex：** `runtime: "auto"` 在没有 Codex 编排器接管运行时，仍可能使用 Pi 作为兼容性后端。测试时请设置
`embeddedHarness.runtime: "codex"` 以强制选择 Codex。现在，强制 Codex 运行时在失败时会直接报错，而不是回退到 Pi，除非你显式设置
`embeddedHarness.fallback: "pi"`。一旦选择了 Codex app-server，其故障会直接暴露，不会再有额外的回退配置。

**应用服务器被拒绝：** 升级 Codex，使 app-server 握手报告的版本为
`0.125.0` 或更高。相同版本号的预发布版或带构建后缀的版本，例如
`0.125.0-alpha.2` 或 `0.125.0+custom`，都会被拒绝，因为 OpenClaw 测试的是稳定版 `0.125.0` 这一协议下限。

**模型发现速度慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用模型发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，
并确认远程应用服务器使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用了 Pi：** 除非你为该智能体强制设置了
`embeddedHarness.runtime: "codex"`，或选择了旧版
`codex/*` 引用，否则这是预期行为。普通的 `openai/gpt-*` 和其他提供商引用在 `auto` 模式下会继续走它们正常的提供商路径。如果你强制设置 `runtime: "codex"`，则该智能体的每个嵌入式回合都必须是 Codex 支持的 OpenAI 模型。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [Plugin hooks](/zh-CN/plugins/hooks)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
