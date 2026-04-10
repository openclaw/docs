---
read_when:
    - 你想使用内置的 Codex app-server 运行支架
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅使用 Codex 的部署禁用 PI 回退机制
summary: 通过内置的 Codex app-server 运行支架运行 OpenClaw 嵌入式智能体轮次
title: Codex 运行支架
x-i18n:
    generated_at: "2026-04-10T21:20:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ba7e0eeb264f846a66a927baf6ded83438a7b4a3df86ee9fe562105f5bb05aa
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex 运行支架

内置的 `codex` 插件让 OpenClaw 可以通过 Codex app-server 运行嵌入式智能体轮次，而不是使用内置的 PI 运行支架。

当你希望由 Codex 接管底层智能体会话时，可以使用它：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

该运行支架默认关闭。只有在启用 `codex` 插件且解析后的模型是 `codex/*` 模型时，或者你显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex` 时，才会选用它。如果你从未配置 `codex/*`，现有的 PI、OpenAI、Anthropic、Gemini、本地和自定义提供商运行都会保持当前行为。

## 选择正确的模型前缀

OpenClaw 为 OpenAI 访问和 Codex 形态的访问提供了不同路径：

| 模型引用               | 运行时路径                                  | 适用场景 |
| ---------------------- | ------------------------------------------- | -------- |
| `openai/gpt-5.4`       | 通过 OpenClaw/PI 管线的 OpenAI 提供商路径   | 你想通过 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。 |
| `openai-codex/gpt-5.4` | 通过 PI 的 OpenAI Codex OAuth 提供商路径    | 你想使用 ChatGPT/Codex OAuth，但不使用 Codex app-server 运行支架。 |
| `codex/gpt-5.4`        | 内置 Codex 提供商加 Codex 运行支架          | 你希望嵌入式智能体轮次使用原生 Codex app-server 执行。 |

Codex 运行支架只会接管 `codex/*` 模型引用。现有的 `openai/*`、`openai-codex/*`、Anthropic、Gemini、xAI、本地和自定义提供商引用会继续走其常规路径。

## 要求

- OpenClaw，并且可用内置的 `codex` 插件。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex 身份验证。

该插件会阻止较旧或未带版本信息的 app-server 握手。这可以确保 OpenClaw 使用的是它已经测试过的协议接口。

对于实时和 Docker 冒烟测试，身份验证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。请使用与你本地 Codex app-server 相同的身份验证材料。

## 最小配置

使用 `codex/gpt-5.4`，启用内置插件，并强制使用 `codex` 运行支架：

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 也会自动启用内置的 `codex` 插件。在共享配置中，显式的插件条目仍然很有用，因为它能让部署意图更加明确。

## 在不替换其他模型的情况下添加 Codex

如果你希望 `codex/*` 模型使用 Codex，而其他一切仍使用 PI，请保留 `runtime: "auto"`：

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
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

在这种配置下：

- `/model codex` 或 `/model codex/gpt-5.4` 会使用 Codex app-server 运行支架。
- `/model gpt` 或 `/model openai/gpt-5.4` 会使用 OpenAI 提供商路径。
- `/model opus` 会使用 Anthropic 提供商路径。
- 如果选择的是非 Codex 模型，PI 仍然作为兼容性运行支架。

## 仅使用 Codex 的部署

如果你需要证明每一次嵌入式智能体轮次都使用 Codex 运行支架，请禁用 PI 回退：

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
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
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，如果 Codex 插件被禁用、请求的模型不是 `codex/*` 引用、app-server 版本过旧，或者 app-server 无法启动，OpenClaw 都会尽早失败。

## 按智能体配置 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体继续保持正常的自动选择：

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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

使用常规会话命令来切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，而 Codex 运行支架会按需创建或恢复其 sidecar app-server 线程。`/reset` 会清除该线程的 OpenClaw 会话绑定。

## 模型发现

默认情况下，`codex` 插件会向 app-server 请求可用模型。如果发现失败或超时，它会使用内置的回退目录：

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

如果你希望启动时避免探测 Codex，并固定使用回退目录，可以禁用发现：

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

默认情况下，插件会使用以下命令在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

你可以保留这个默认值，只调整 Codex 原生策略：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

对于已在运行的 app-server，可以使用 WebSocket 传输：

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

| 字段                | 默认值                                   | 含义 |
| ------------------- | ---------------------------------------- | ---- |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command`           | `"codex"`                                | 用于 stdio 传输的可执行文件。 |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。 |
| `url`               | 未设置                                   | WebSocket app-server URL。 |
| `authToken`         | 未设置                                   | WebSocket 传输的 Bearer token。 |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。 |
| `approvalPolicy`    | `"never"`                                | 发送给线程启动、恢复和轮次的原生 Codex 审批策略。 |
| `sandbox`           | `"workspace-write"`                      | 发送给线程启动和恢复的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"`                                 | 使用 `"guardian_subagent"` 可让 Codex guardian 审查原生审批。 |
| `serviceTier`       | 未设置                                   | 可选的 Codex 服务层级，例如 `"priority"`。 |

较旧的环境变量在对应配置字段未设置时，仍然可以作为本地测试的回退方式使用：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

对于可重复部署，优先使用配置。

## Codex 命令

内置插件将 `/codex` 注册为授权斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道中使用。

常见形式：

- `/codex status` 显示实时的 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时的 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有的 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与运行支架用于常规轮次相同的 sidecar 绑定文件。在下一条消息时，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw `codex/*` 模型传递给 app-server，并保持启用扩展历史记录。

## 工具、媒体和压缩

Codex 运行支架只改变底层的嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从运行支架接收动态工具结果。文本、图像、视频、音乐、TTS、审批和消息工具输出，都会继续通过正常的 OpenClaw 传递路径处理。

当所选模型使用 Codex 运行支架时，原生线程压缩会委托给 Codex app-server。OpenClaw 会继续保留转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或运行支架切换。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解会继续使用相应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中没有出现 Codex：** 启用 `plugins.entries.codex.enabled`，设置一个 `codex/*` 模型引用，或者检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 回退到 PI：** 在测试时设置 `embeddedHarness.fallback: "none"` 或 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`。

**app-server 被拒绝：** 升级 Codex，确保 app-server 握手报告的版本为 `0.118.0` 或更高。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`，或者禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，并确认远端 app-server 使用的是相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 这是预期行为。Codex 运行支架只会接管 `codex/*` 模型引用。

## 相关内容

- [智能体运行支架插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
