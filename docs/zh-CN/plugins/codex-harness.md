---
read_when:
    - 你想使用内置的 Codex app-server 测试框架
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅使用 Codex 的部署禁用 Pi 回退机制
summary: 通过内置的 Codex app-server 测试框架运行 OpenClaw 嵌入式智能体轮次
title: Codex 测试框架
x-i18n:
    generated_at: "2026-04-22T23:04:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd3cd3b1512b7015f7cac350285eda153c3c09cddda92527ee41c17ecb8c589f
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex 测试框架

内置的 `codex` 插件让 OpenClaw 通过 Codex app-server，而不是内置的 Pi 测试框架，来运行嵌入式智能体轮次。

当你希望 Codex 接管底层智能体会话时，请使用此功能：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。
OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

原生 Codex 轮次同样遵循共享的 `before_prompt_build`、`before_compaction` 和 `after_compaction` 插件钩子，因此提示词垫片和压缩感知自动化可以继续与 Pi 测试框架保持一致。

该测试框架默认关闭。只有在启用 `codex` 插件且解析后的模型是 `codex/*` 模型时，或者你显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex` 时，才会选中它。
如果你从未配置 `codex/*`，现有的 Pi、OpenAI、Anthropic、Gemini、local 和自定义提供商运行将保持当前行为。

## 选择正确的模型前缀

OpenClaw 为 OpenAI 访问和 Codex 形态访问提供了不同路径：

| 模型引用               | 运行时路径                                 | 使用场景                                                               |
| ---------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| `openai/gpt-5.4`       | 通过 OpenClaw/Pi 管线的 OpenAI 提供商路径  | 你想使用 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。               |
| `openai-codex/gpt-5.4` | 通过 Pi 的 OpenAI Codex OAuth 提供商路径   | 你想使用 ChatGPT/Codex OAuth，但不使用 Codex app-server 测试框架。     |
| `codex/gpt-5.4`        | 内置 Codex 提供商 + Codex 测试框架         | 你希望嵌入式智能体轮次使用原生 Codex app-server 执行。                 |

Codex 测试框架只接管 `codex/*` 模型引用。现有的 `openai/*`、`openai-codex/*`、Anthropic、Gemini、xAI、local 和自定义提供商引用都会继续走其正常路径。

## 要求

- OpenClaw，并且内置 `codex` 插件可用。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex 认证。

该插件会阻止较旧或未标明版本的 app-server 握手。
这样可以确保 OpenClaw 始终运行在它已经过测试的协议表面之上。

对于 live 和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，外加可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。
请使用与你本地 Codex app-server 相同的认证材料。

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

如果你的配置使用 `plugins.allow`，也请把 `codex` 包含进去：

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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 也会自动启用内置的 `codex` 插件。
在共享配置中，显式的插件条目仍然很有用，因为它能让部署意图更加明确。

## 在不替换其他模型的情况下添加 Codex

如果你希望 `codex/*` 模型使用 Codex，而其他所有模型继续使用 Pi，请保持 `runtime: "auto"`：

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

采用这种结构后：

- `/model codex` 或 `/model codex/gpt-5.4` 会使用 Codex app-server 测试框架。
- `/model gpt` 或 `/model openai/gpt-5.4` 会使用 OpenAI 提供商路径。
- `/model opus` 会使用 Anthropic 提供商路径。
- 如果选中的不是 Codex 模型，Pi 仍然是兼容性测试框架。

## 仅使用 Codex 的部署

当你需要证明每一个嵌入式智能体轮次都使用 Codex 测试框架时，请禁用 Pi 回退：

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

环境变量覆盖：

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，如果 Codex 插件被禁用、请求的模型不是 `codex/*` 引用、app-server 版本过旧，或者 app-server 无法启动，OpenClaw 都会提前失败。

## 按智能体使用 Codex

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

使用常规会话命令即可切换智能体和模型。
`/new` 会创建一个全新的 OpenClaw 会话，而 Codex 测试框架会按需创建或恢复其 sidecar app-server 线程。
`/reset` 会清除 OpenClaw 对该线程的会话绑定。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。
如果发现失败或超时，它会使用内置的回退目录：

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

默认情况下，插件会通过以下方式在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以完全不受约束的方式启动本地 Codex 测试框架会话：
`approvalPolicy: "never"` 和 `sandbox: "danger-full-access"`。
这与 Codex CLI 采用的可信本地操作员姿态一致，并允许自主心跳使用网络和 shell 工具，而不必等待不可见的原生审批路径。
你也可以收紧这一策略，例如通过 guardian 转交审查：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

支持的 `appServer` 字段：

| 字段                | 默认值                                   | 含义                                                                     |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                   |
| `command`           | `"codex"`                                | 用于 stdio 传输的可执行文件。                                            |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                  |
| `url`               | unset                                    | WebSocket app-server URL。                                               |
| `authToken`         | unset                                    | 用于 WebSocket 传输的 Bearer 令牌。                                      |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。                                                  |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                      |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。                          |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                               |
| `approvalsReviewer` | `"user"`                                 | 使用 `"guardian_subagent"` 可让 Codex guardian 审查原生审批。            |
| `serviceTier`       | unset                                    | 可选的 Codex 服务层级，例如 `"priority"`。                               |

当对应配置字段未设置时，较旧的环境变量仍可作为本地测试的回退方式：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

对于可重复部署，优先使用配置。

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

仅使用 Codex 的测试框架验证，并禁用 Pi 回退：

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

由 guardian 审查的 Codex 审批：

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

模型切换仍由 OpenClaw 控制。
当一个 OpenClaw 会话附加到现有 Codex 线程时，下一个轮次会再次向 app-server 发送当前选中的 `codex/*` 模型、提供商、审批策略、沙箱和服务层级。
从 `codex/gpt-5.4` 切换到 `codex/gpt-5.2` 时，会保留线程绑定，但会请求 Codex 使用新选中的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。
它是通用命令，可在任何支持 OpenClaw 文本命令的渠道中使用。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和技能。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有的 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server 技能。

`/codex resume` 会写入与测试框架在正常轮次中使用的相同 sidecar 绑定文件。
在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选中的 OpenClaw `codex/*` 模型传入 app-server，并保持启用扩展历史记录。

该命令表面要求 Codex app-server `0.118.0` 或更高版本。
如果未来版本或自定义 app-server 未暴露对应 JSON-RPC 方法，各个控制方法会显示为 `unsupported by this Codex app-server`。

## 工具、媒体和压缩

Codex 测试框架仅改变底层嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从测试框架接收动态工具结果。
文本、图像、视频、音乐、TTS、审批以及消息工具输出，都会继续通过正常的 OpenClaw 传递路径处理。

当所选模型使用 Codex 测试框架时，原生线程压缩会委托给 Codex app-server。
OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或测试框架切换。
如果 app-server 发出这些内容，该镜像会包含用户提示词、最终助手文本，以及轻量级的 Codex 推理或计划记录。

媒体生成不需要 Pi。
图像、视频、音乐、PDF、TTS 和媒体理解会继续使用相应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中没有出现 Codex：** 启用 `plugins.entries.codex.enabled`，设置一个 `codex/*` 模型引用，或检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用的是 Pi 而不是 Codex：** 如果没有 Codex 测试框架接管此次运行，OpenClaw 可能会使用 Pi 作为兼容性后端。
测试时可设置 `embeddedHarness.runtime: "codex"` 来强制选择 Codex，或设置 `embeddedHarness.fallback: "none"`，以便在没有匹配的插件测试框架时直接失败。
一旦选中了 Codex app-server，它的失败会直接暴露出来，而不需要额外的回退配置。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手报告版本为 `0.118.0` 或更高。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`，或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用 Pi：** 这是预期行为。
Codex 测试框架只接管 `codex/*` 模型引用。

## 相关内容

- [智能体测试框架插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
