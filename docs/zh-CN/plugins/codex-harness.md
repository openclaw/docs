---
read_when:
    - 你想使用内置的 Codex app-server 测试框架
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅使用 Codex 的部署禁用 PI 回退机制
summary: 通过内置的 Codex app-server 测试框架运行 OpenClaw 嵌入式智能体轮次
title: Codex 测试框架
x-i18n:
    generated_at: "2026-04-10T22:08:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71f4f8e67cfc8f573ad8f082dd4fc36ce6524f7bf235e2757117d4653cbb3d71
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex 测试框架

内置的 `codex` 插件让 OpenClaw 可以通过 Codex app-server，而不是内置的 PI 测试框架，来运行嵌入式智能体轮次。

当你希望由 Codex 接管底层智能体会话时，请使用此功能：模型发现、原生线程恢复、原生压缩以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

该测试框架默认关闭。只有在启用 `codex` 插件且解析后的模型是 `codex/*` 模型时，或者你显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex` 时，才会选用它。如果你从未配置 `codex/*`，现有的 PI、OpenAI、Anthropic、Gemini、本地和自定义提供商运行将保持当前行为。

## 选择正确的模型前缀

OpenClaw 为 OpenAI 和 Codex 形式的访问提供了不同路径：

| 模型引用 | 运行时路径 | 使用场景 |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`       | 通过 OpenClaw/PI 流程的 OpenAI 提供商 | 你希望使用 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。 |
| `openai-codex/gpt-5.4` | 通过 PI 的 OpenAI Codex OAuth 提供商 | 你希望使用 ChatGPT/Codex OAuth，而不使用 Codex app-server 测试框架。 |
| `codex/gpt-5.4`        | 内置 Codex 提供商加 Codex 测试框架 | 你希望嵌入式智能体轮次使用原生 Codex app-server 执行。 |

Codex 测试框架只接管 `codex/*` 模型引用。现有的 `openai/*`、`openai-codex/*`、Anthropic、Gemini、xAI、本地和自定义提供商引用将继续走其正常路径。

## 要求

- OpenClaw，并且内置的 `codex` 插件可用。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex 身份验证。

该插件会阻止过旧或未带版本信息的 app-server 握手。这可以确保 OpenClaw 使用的是它已针对其进行测试的协议接口。

对于实时测试和 Docker 冒烟测试，身份验证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。请使用与你本地 Codex app-server 相同的身份验证材料。

## 最小配置

使用 `codex/gpt-5.4`，启用内置插件，并强制使用 `codex` 测试框架：

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

如果你的配置使用了 `plugins.allow`，也请将 `codex` 包含在其中：

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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 也会自动启用内置的 `codex` 插件。显式的插件条目在共享配置中仍然很有用，因为它能让部署意图更加明确。

## 在不替换其他模型的情况下添加 Codex

如果你希望 `codex/*` 模型使用 Codex，而其他所有模型使用 PI，请保持 `runtime: "auto"`：

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

- `/model codex` 或 `/model codex/gpt-5.4` 使用 Codex app-server 测试框架。
- `/model gpt` 或 `/model openai/gpt-5.4` 使用 OpenAI 提供商路径。
- `/model opus` 使用 Anthropic 提供商路径。
- 如果选择了非 Codex 模型，PI 仍然作为兼容性测试框架。

## 仅 Codex 的部署

当你需要证明每一次嵌入式智能体轮次都使用 Codex 测试框架时，请禁用 PI 回退：

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

禁用回退后，如果 Codex 插件被禁用、请求的模型不是 `codex/*` 引用、app-server 版本过旧，或 app-server 无法启动，OpenClaw 将提前失败。

## 按智能体使用 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体保持正常的自动选择：

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

使用常规会话命令来切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，而 Codex 测试框架会按需创建或恢复其 sidecar app-server 线程。`/reset` 会清除该线程的 OpenClaw 会话绑定。

## 模型发现

默认情况下，Codex 插件会向 app-server 查询可用模型。如果发现失败或超时，它会使用内置的回退目录：

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

如果你希望启动时避免探测 Codex 并固定使用回退目录，请禁用发现：

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

你可以保留该默认设置，只调整 Codex 原生策略：

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

对于已经运行的 app-server，请使用 WebSocket 传输：

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
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command`           | `"codex"`                                | 用于 stdio 传输的可执行文件。 |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。 |
| `url`               | unset                                    | WebSocket app-server URL。 |
| `authToken`         | unset                                    | 用于 WebSocket 传输的 Bearer token。 |
| `headers`           | `{}`                                     | 额外的 WebSocket 请求头。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。 |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动、恢复和轮次中的原生 Codex 审批策略。 |
| `sandbox`           | `"workspace-write"`                      | 发送到线程启动和恢复中的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"`                                 | 使用 `"guardian_subagent"` 让 Codex guardian 审核原生审批。 |
| `serviceTier`       | unset                                    | 可选的 Codex 服务层级，例如 `"priority"`。 |

旧的环境变量在对应配置字段未设置时，仍可作为本地测试的回退项使用：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

对于可重复部署，优先推荐使用配置。

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

禁用 PI 回退的仅 Codex 测试框架验证：

```json5
{
  embeddedHarness: {
    fallback: "none",
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

由 guardian 审核的 Codex 审批：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
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

模型切换仍由 OpenClaw 控制。当某个 OpenClaw 会话附加到现有 Codex 线程时，下一轮会再次将当前选定的 `codex/*` 模型、提供商、审批策略、沙箱和服务层级发送给 app-server。从 `codex/gpt-5.4` 切换到 `codex/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选定的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用命令，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与测试框架在常规轮次中使用的同一个 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw `codex/*` 模型传入 app-server，并保持启用扩展历史记录。

命令接口要求 Codex app-server 为 `0.118.0` 或更高版本。如果未来版本或自定义 app-server 未暴露相应的 JSON-RPC 方法，各个控制方法会显示为 `unsupported by this Codex app-server`。

## 工具、媒体和压缩

Codex 测试框架只会更改底层的嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从测试框架接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，都会继续通过正常的 OpenClaw 传递路径处理。

当所选模型使用 Codex 测试框架时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一份转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或测试框架切换。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解仍会继续使用对应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中未显示 Codex：** 启用 `plugins.entries.codex.enabled`，设置 `codex/*` 模型引用，或检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 回退到 PI：** 测试时设置 `embeddedHarness.fallback: "none"` 或 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手报告的版本为 `0.118.0` 或更高。

**模型发现较慢：** 调低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现功能。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 这是预期行为。Codex 测试框架只接管 `codex/*` 模型引用。

## 相关内容

- [智能体测试框架插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
