---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在无法使用时直接失败，而不是回退到 PI
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-25T03:42:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 67f1bc703e8e45c60f7062f00cd1d68fde146785db649709e9eddce48d0a9941
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 可以通过 Codex app-server 运行嵌入式智能体轮次，而不是使用内置的 PI harness。

当你希望 Codex 接管底层智能体会话时，请使用它：模型发现、原生线程恢复、原生压缩以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、批准、媒体传递，以及可见的转录镜像。

如果你正在了解整体结构，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简短来说：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、
Discord、Slack 或其他渠道仍然是通信界面。

原生 Codex 轮次会将 OpenClaw 插件钩子作为公共兼容层保留。
这些是进程内的 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`，用于镜像转录记录
- `agent_end`

插件还可以注册与运行时无关的工具结果中间件，在 OpenClaw 执行工具之后、结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公共
`tool_result_persist` 插件钩子不同，后者会转换由 OpenClaw 持有的转录工具结果写入。

关于插件钩子语义本身，请参阅 [Plugin hooks](/zh-CN/plugins/hooks)
和 [Plugin guard behavior](/zh-CN/tools/plugin)。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用的规范形式为
`openai/gpt-*`，并在需要原生 app-server 执行时显式强制设置
`embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。
为了兼容，旧版 `codex/*` 模型引用仍会自动选择该 harness，但由运行时支持的旧版提供商前缀不会显示为普通的模型/提供商选项。

## 选择正确的模型前缀

OpenAI 系列路由对前缀很敏感。当你希望通过 PI 使用 Codex OAuth 时，请使用 `openai-codex/*`；当你希望直接使用 OpenAI API，或在强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| Model ref                                             | Runtime path                                 | Use when                                                                  |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | OpenAI provider 通过 OpenClaw/PI 管线        | 你希望通过 `OPENAI_API_KEY` 使用当前的 OpenAI Platform API 直接访问。     |
| `openai-codex/gpt-5.5`                                | OpenAI Codex OAuth 通过 OpenClaw/PI          | 你希望使用默认 PI 运行器配合 ChatGPT/Codex 订阅认证。                     |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness                     | 你希望嵌入式智能体轮次使用原生 Codex app-server 执行。                    |

在 OpenClaw 中，GPT-5.5 当前仅支持订阅/OAuth。PI OAuth 请使用
`openai-codex/gpt-5.5`，或者在 Codex app-server harness 下使用
`openai/gpt-5.5`。一旦 OpenAI 在公共 API 上启用 GPT-5.5，
`openai/gpt-5.5` 的直接 API 密钥访问也会受到支持。

旧版 `codex/gpt-*` 引用仍然作为兼容别名被接受。Doctor
兼容性迁移会将旧版主运行时引用重写为规范模型引用，并将运行时策略单独记录；而仅用于回退的旧版引用则保持不变，因为运行时是为整个智能体容器配置的。新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生
app-server harness 配置应使用 `openai/gpt-*`，并配合
`embeddedHarness.runtime: "codex"`。

`agents.defaults.imageModel` 也遵循同样的前缀划分。当图像理解应通过 OpenAI Codex OAuth 提供商路径运行时，请使用
`openai-codex/gpt-*`。当图像理解应通过受限的 Codex app-server 轮次运行时，请使用 `codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；仅文本的 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 来确认当前会话的实际 harness。如果结果出乎你的预期，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关 的结构化 `agent harness selected` 记录。它包含已选择的 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，OpenClaw 会在该会话上记录选中的 harness id，并在同一会话 id 的后续轮次中继续使用它。当你希望未来的会话使用其他 harness 时，请更改 `embeddedHarness` 配置或
`OPENCLAW_AGENT_RUNTIME`；在将现有对话从 PI 切换到 Codex 之前，请使用 `/new` 或 `/reset` 启动一个全新的会话。这样可以避免同一份转录通过两个不兼容的原生会话系统重放。

在引入 harness 固定之前创建的旧会话，只要已有转录历史，就会被视为固定到 PI。更改配置后，使用 `/new` 或 `/reset` 才能让该对话切换到 Codex。

`/status` 会显示实际的模型运行时。默认的 PI harness 显示为
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，且内置的 `codex` 插件可用。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex 认证。

该插件会阻止较旧版本或无版本的 app-server 握手。这可确保
OpenClaw 始终运行在已测试过的协议接口上。

对于实时和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
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

如果旧配置将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>`，仍会自动启用内置的 `codex` 插件。新配置应优先使用
`openai/<model>`，并配合上面显式的 `embeddedHarness` 条目。

## 将 Codex 与其他模型一起使用

如果同一个智能体需要在 Codex 和非 Codex 提供商模型之间自由切换，请不要全局设置 `runtime: "codex"`。强制运行时会应用到该智能体或会话的每一个嵌入式轮次。如果你在该运行时被强制时选择了 Anthropic 模型，OpenClaw 仍会尝试 Codex harness，并以失败关闭，而不会悄悄通过 PI 路由该轮次。

请改用以下其中一种形式：

- 将 Codex 放在一个专用智能体上，并设置 `embeddedHarness.runtime: "codex"`。
- 将默认智能体保持为 `runtime: "auto"` 并使用 PI 回退，以满足普通的混合提供商使用场景。
- 仅为兼容性使用旧版 `codex/*` 引用。新配置应优先使用 `openai/*` 并配合显式的 Codex 运行时策略。

例如，下面的配置会让默认智能体保持常规自动选择，并新增一个单独的 Codex 智能体：

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

采用这种形式时：

- 默认的 `main` 智能体使用常规提供商路径和 PI 兼容回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或不受支持，该轮次会失败，而不是悄悄使用 PI。

## 仅 Codex 部署

当你需要证明每一个嵌入式智能体轮次都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不会回退到 PI，因此
`fallback: "none"` 是可选的，但通常作为文档说明很有用：

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

在强制使用 Codex 的情况下，如果 Codex 插件被禁用、app-server 版本过旧，或 app-server 无法启动，OpenClaw 会尽早失败。只有当你明确希望缺失的 harness 选择由 PI 处理时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体配置 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体仍保留正常的自动选择：

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

使用普通会话命令来切换智能体和模型。`/new` 会创建一个新的
OpenClaw 会话，而 Codex harness 会根据需要创建或恢复其 sidecar app-server 线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 查询可用模型。如果发现失败或超时，它会使用内置的回退目录，其中包括：

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

## App-server 连接和策略

默认情况下，插件会用以下命令在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自主心跳的受信本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停在无人响应的原生批准提示上。

若要选择使用由 Codex guardian 审核的批准，请设置 `appServer.mode:
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

Guardian 模式使用 Codex 的原生自动审核批准路径。当 Codex 请求离开沙箱、在工作区外写入，或添加网络访问等权限时，Codex 会将该批准请求路由给原生审核器，而不是人工提示。审核器会应用 Codex 的风险框架，并批准或拒绝该具体请求。当你希望比 YOLO 模式有更多保护措施，但仍需要无人值守的智能体持续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
各个策略字段仍然会覆盖 `mode`，因此高级部署可以将该预设与显式选择混合使用。较旧的 `guardian_subagent` 审核器值仍然作为兼容别名被接受，但新配置应使用
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

| Field               | Default                                  | Meaning                                                                                                      |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 会生成 Codex；`"websocket"` 会连接到 `url`。                                                        |
| `command`           | `"codex"`                                | 用于 stdio 传输的可执行文件。                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                                                      |
| `url`               | unset                                    | WebSocket app-server URL。                                                                                   |
| `authToken`         | unset                                    | 用于 WebSocket 传输的 Bearer token。                                                                         |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。                                                                                      |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                          |
| `mode`              | `"yolo"`                                 | 用于 YOLO 或 guardian 审核执行的预设。                                                                       |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/轮次的原生 Codex 批准策略。                                                              |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                   |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审核原生批准提示。`guardian_subagent` 仍然是旧版别名。                         |
| `serviceTier`       | unset                                    | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                      |

当对应的配置字段未设置时，较旧的环境变量仍可作为本地测试的回退方案使用：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复的部署，更推荐使用配置，因为它能将插件行为与 Codex harness 其余设置保存在同一个经过审查的文件中。

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

由 guardian 审核的 Codex 批准：

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有的 Codex 线程时，下一轮会再次将当前选择的
OpenAI 模型、提供商、批准策略、沙箱和服务层级发送到
app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选择的模型继续运行。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用的，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有的 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 用于普通轮次相同的 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入 app-server，并保持扩展历史记录处于启用状态。

该命令接口要求 Codex app-server `0.118.0` 或更高版本。如果未来版本或自定义的 app-server 未暴露对应的 JSON-RPC 方法，各个控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| Layer                                 | Owner                    | Purpose                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin hooks                 | OpenClaw                 | 在 PI 和 Codex harness 之间提供产品/插件兼容性。                   |
| Codex app-server extension middleware | OpenClaw bundled plugins | 围绕 OpenClaw 动态工具的每轮适配器行为。                           |
| Codex native hooks                    | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。               |

OpenClaw 不会使用项目级或全局的 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，OpenClaw 会为每个线程注入 Codex 配置，用于 `PreToolUse`、`PostToolUse` 和
`PermissionRequest`。其他 Codex 钩子，例如 `SessionStart`、
`UserPromptSubmit` 和 `Stop`，仍然属于 Codex 级控制；在 v1 合约中，它们不会作为 OpenClaw 插件钩子暴露。

对于 OpenClaw 动态工具，Codex 发出调用请求后，由 OpenClaw 执行该工具，因此 OpenClaw 会在 harness 适配器中触发其拥有的插件和中间件行为。对于 Codex 原生工具，Codex 持有规范工具记录。OpenClaw 可以镜像选定事件，但无法重写原生 Codex 线程，除非 Codex 通过 app-server 或原生钩子回调暴露该操作。

压缩和 LLM 生命周期投影来自 Codex app-server 通知以及 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。OpenClaw 的
`before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件属于适配器级观察结果，而不是对 Codex 内部请求或压缩负载的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为 `codex_app_server.hook` 智能体事件，用于轨迹记录和调试。它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是在底层换了一个模型调用的 PI。Codex 拥有更多原生模型循环的控制权，而 OpenClaw 会围绕这一边界适配它的插件和会话接口。

Codex 运行时 v1 中支持的内容：

| Surface                                 | Support                                 | Why                                                                                                                                        |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 通过 Codex 的 OpenAI 模型循环           | 支持                                    | Codex app-server 负责 OpenAI 轮次、原生线程恢复以及原生工具续接。                                                                          |
| OpenClaw 渠道路由和交付                 | 支持                                    | Telegram、Discord、Slack、WhatsApp、iMessage 以及其他渠道仍然位于模型运行时之外。                                                          |
| OpenClaw 动态工具                       | 支持                                    | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍在执行路径中。                                                                          |
| 提示词和上下文插件                      | 支持                                    | OpenClaw 会在启动或恢复线程之前构建提示词覆盖层，并将上下文投影到 Codex 轮次中。                                                           |
| 上下文引擎生命周期                      | 支持                                    | 组装、摄取或轮次后的维护，以及上下文引擎压缩协调，都会为 Codex 轮次运行。                                                                   |
| 动态工具钩子                            | 支持                                    | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕由 OpenClaw 持有的动态工具运行。                                               |
| 生命周期钩子                            | 作为适配器观察结果受到支持              | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会使用真实的 Codex 模式负载触发。                      |
| 原生 shell 和 patch 的阻止或观察        | 通过原生钩子中继支持                    | 对已提交的原生工具接口，`PreToolUse` 和 `PostToolUse` 会被中继。支持阻止，不支持参数重写。                                                 |
| 原生权限策略                            | 通过原生钩子中继支持                    | 在运行时暴露该能力的情况下，Codex `PermissionRequest` 可以通过 OpenClaw 策略进行路由。                                                     |
| app-server 轨迹捕获                     | 支持                                    | OpenClaw 会记录它发送给 app-server 的请求以及接收到的 app-server 通知。                                                                     |

Codex 运行时 v1 中不支持的内容：

| Surface                                             | V1 边界                                                                                                                                         | 未来路径                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 原生工具参数变更                                    | Codex 原生 pre-tool 钩子可以阻止调用，但 OpenClaw 不会重写 Codex 原生工具参数。                                                                | 需要 Codex 钩子/模式支持替换工具输入。                                                                   |
| 可编辑的 Codex 原生转录历史                         | Codex 持有规范的原生线程历史。OpenClaw 持有一个镜像，并可以投影未来上下文，但不应修改不受支持的内部实现。                                     | 如果需要原生线程修补，则添加显式的 Codex app-server API。                                                |
| 用于 Codex 原生工具记录的 `tool_result_persist`     | 该钩子转换的是由 OpenClaw 持有的转录写入，而不是 Codex 原生工具记录。                                                                           | 可以镜像经过转换的记录，但规范重写需要 Codex 支持。                                                      |
| 丰富的原生压缩元数据                                | OpenClaw 能观察到压缩开始和完成，但不会收到稳定的保留/丢弃列表、token 增量或摘要负载。                                                         | 需要更丰富的 Codex 压缩事件。                                                                            |
| 压缩干预                                            | 在 Codex 模式下，当前的 OpenClaw 压缩钩子处于通知级别。                                                                                         | 如果插件需要否决或重写原生压缩，则添加 Codex 压缩前/后钩子。                                             |
| 停止或最终答案门控                                  | Codex 具有原生停止钩子，但 OpenClaw 不会将最终答案门控作为 v1 插件合约公开。                                                                   | 未来可以提供带有循环和超时保护的可选原语。                                                               |
| 作为已承诺 v1 接口的原生 MCP 钩子对等能力           | 该中继是通用的，但 OpenClaw 尚未对原生 MCP 前/后钩子行为进行版本门控并完成端到端测试。                                                         | 一旦受支持的 app-server 协议下限覆盖这些负载，就添加 OpenClaw MCP 中继测试和文档。                      |
| 逐字节模型 API 请求捕获                             | OpenClaw 可以捕获 app-server 请求和通知，但 Codex 核心会在内部构建最终的 OpenAI API 请求。                                                     | 需要 Codex 模型请求跟踪事件或调试 API。                                                                  |

## 工具、媒体和压缩

Codex harness 只会改变底层的嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、批准和消息工具输出，仍然通过常规的 OpenClaw 传递路径流转。

原生钩子中继有意保持通用，但 v1 支持合约仅限于 OpenClaw 已测试的 Codex 原生工具和权限路径。不要假设未来的每个 Codex 钩子事件都会成为 OpenClaw 插件接口，除非运行时合约明确命名了它。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具批准引导会通过 OpenClaw 的插件批准流程进行路由。Codex 的 `request_user_input` 提示会被发送回原始聊天，接下来排队的后续消息会回答该原生服务器请求，而不是被作为额外上下文引导。其他 MCP 引导请求仍然会以失败关闭。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换。该镜像包括用户提示、最终助手文本，以及当 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未公开人类可读的压缩摘要，也未提供可审计的列表来说明 Codex 在压缩后保留了哪些条目。

由于 Codex 持有规范的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它只在 OpenClaw 正在写入由 OpenClaw 持有的会话转录工具结果时生效。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解会继续使用相应的提供商/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 没有作为普通 `/model` 提供商出现：** 这对新配置来说是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`embeddedHarness.runtime: "codex"`（或使用旧版 `codex/*` 引用），启用 `plugins.entries.codex.enabled`，并检查
`plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用了 PI 而不是 Codex：** 当没有 Codex harness 声明接管运行时，`runtime: "auto"` 仍可能使用 PI 作为兼容后端。测试时请设置 `embeddedHarness.runtime: "codex"` 以强制选择 Codex。现在，强制的 Codex 运行时会直接失败，而不会回退到 PI，除非你显式设置了
`embeddedHarness.fallback: "pi"`。一旦选中了 Codex app-server，其失败会直接暴露，而不会再经过额外的回退配置。

**app-server 被拒绝：** 请升级 Codex，确保 app-server 握手报告的版本为 `0.118.0` 或更高。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 请检查 `appServer.url`、
`authToken`，以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 除非你为该智能体强制设置了
`embeddedHarness.runtime: "codex"`，或选择了旧版 `codex/*`
引用，否则这是预期行为。在 `auto` 模式下，普通的 `openai/gpt-*` 和其他提供商引用会保持走其常规提供商路径。如果你强制设置了 `runtime: "codex"`，那么该智能体的每一个嵌入式轮次都必须是 Codex 支持的 OpenAI 模型。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Model Providers](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [Plugin hooks](/zh-CN/plugins/hooks)
- [Configuration Reference](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
