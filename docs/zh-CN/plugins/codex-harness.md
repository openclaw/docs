---
read_when:
    - 你想使用内置的 Codex 应用服务器测试框架
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅使用 Codex 的部署禁用 Pi 回退机制
summary: 通过内置的 Codex 应用服务器测试框架运行 OpenClaw 嵌入式智能体轮次
title: Codex 测试框架
x-i18n:
    generated_at: "2026-04-22T08:55:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19bc7481bf7cdce983efe70e697f8665ace875d96f126979b95dd3f2f739fa8a
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex 测试框架

内置的 `codex` 插件让 OpenClaw 通过 Codex 应用服务器而不是内置的 Pi 测试框架来运行嵌入式智能体轮次。

当你希望由 Codex 接管底层智能体会话时，请使用它：模型发现、原生线程恢复、原生压缩，以及应用服务器执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

该测试框架默认关闭。只有在启用 `codex` 插件且解析后的模型是 `codex/*` 模型时，或者你显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex` 时，才会启用它。如果你从未配置 `codex/*`，现有的 Pi、OpenAI、Anthropic、Gemini、本地和自定义提供商运行都会保持当前行为。

## 选择正确的模型前缀

OpenClaw 为 OpenAI 访问和 Codex 形态的访问提供了不同路径：

| 模型引用             | 运行时路径                                 | 使用场景                                                               |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| `openai/gpt-5.4`       | 通过 OpenClaw/Pi 流程的 OpenAI 提供商路径 | 你希望使用 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。       |
| `openai-codex/gpt-5.4` | 通过 Pi 的 OpenAI Codex OAuth 提供商路径       | 你希望使用 ChatGPT/Codex OAuth，但不使用 Codex 应用服务器测试框架。      |
| `codex/gpt-5.4`        | 内置 Codex 提供商加 Codex 测试框架    | 你希望为嵌入式智能体轮次使用原生 Codex 应用服务器执行。 |

Codex 测试框架只接管 `codex/*` 模型引用。现有的 `openai/*`、`openai-codex/*`、Anthropic、Gemini、xAI、本地和自定义提供商引用都会保持其正常路径。

## 要求

- OpenClaw，并且可使用内置的 `codex` 插件。
- Codex 应用服务器 `0.118.0` 或更高版本。
- 应用服务器进程可用的 Codex 认证信息。

该插件会阻止较旧版本或无版本信息的应用服务器握手。这能确保 OpenClaw 始终运行在它已测试过的协议接口上。

对于实时和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。请使用与你本地 Codex 应用服务器相同的认证材料。

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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 也会自动启用内置的 `codex` 插件。显式的插件条目在共享配置中仍然很有用，因为它能清楚表明部署意图。

## 添加 Codex 而不替换其他模型

如果你希望 `codex/*` 模型使用 Codex，而其他所有模型使用 Pi，请保持 `runtime: "auto"`：

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

采用这种形式时：

- `/model codex` 或 `/model codex/gpt-5.4` 会使用 Codex 应用服务器测试框架。
- `/model gpt` 或 `/model openai/gpt-5.4` 会使用 OpenAI 提供商路径。
- `/model opus` 会使用 Anthropic 提供商路径。
- 如果选择的是非 Codex 模型，Pi 仍然作为兼容性测试框架。

## 仅 Codex 部署

当你需要证明每个嵌入式智能体轮次都使用 Codex 测试框架时，请禁用 Pi 回退：

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

禁用回退后，如果 Codex 插件被禁用、请求的模型不是 `codex/*` 引用、应用服务器版本过旧，或者应用服务器无法启动，OpenClaw 都会尽早失败。

## 每个智能体单独使用 Codex

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

使用常规会话命令切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，而 Codex 测试框架会按需创建或恢复其侧车应用服务器线程。`/reset` 会清除该线程的 OpenClaw 会话绑定。

## 模型发现

默认情况下，`codex` 插件会向应用服务器请求可用模型。如果发现失败或超时，它会使用内置的回退目录：

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

当你希望启动时避免探测 Codex，并固定使用回退目录时，可以禁用发现：

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

默认情况下，插件会在本地使用以下命令启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以完全不受限制的方式启动本地 Codex 测试框架会话：`approvalPolicy: "never"` 和 `sandbox: "danger-full-access"`。这与 Codex CLI 使用的受信任本地操作员姿态一致，并允许自主心跳使用网络和 shell 工具，而无需等待不可见的原生审批路径。你可以收紧该策略，例如通过 guardian 转发审查：

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

对于已经在运行的应用服务器，请使用 WebSocket 传输：

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

| 字段               | 默认值                                  | 含义                                                                     |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                 |
| `command`           | `"codex"`                                | `stdio` 传输使用的可执行文件。                                          |
| `args`              | `["app-server", "--listen", "stdio://"]` | `stdio` 传输使用的参数。                                           |
| `url`               | 未设置                                    | WebSocket 应用服务器 URL。                                                |
| `authToken`         | 未设置                                    | WebSocket 传输使用的 Bearer token。                                    |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。                                                 |
| `requestTimeoutMs`  | `60000`                                  | 应用服务器控制平面调用的超时时间。                              |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。           |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                   |
| `approvalsReviewer` | `"user"`                                 | 使用 `"guardian_subagent"` 让 Codex guardian 审查原生审批。 |
| `serviceTier`       | 未设置                                    | 可选的 Codex 服务层级，例如 `"priority"`。                   |

当对应配置字段未设置时，较旧的环境变量仍可作为本地测试的回退方式：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

对于可重复部署，优先使用配置。

## 常见方案

使用默认 `stdio` 传输的本地 Codex：

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

仅 Codex 测试框架验证，并禁用 Pi 回退：

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

模型切换仍由 OpenClaw 控制。当某个 OpenClaw 会话附加到现有的 Codex 线程时，下一轮会再次将当前选定的 `codex/*` 模型、提供商、审批策略、沙箱和服务层级发送给应用服务器。从 `codex/gpt-5.4` 切换到 `codex/gpt-5.2` 时，会保留线程绑定，但会请求 Codex 使用新选定的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用命令，可在任何支持 OpenClaw 文本命令的渠道上使用。

常见形式：

- `/codex status` 显示实时的应用服务器连接状态、模型、账户、速率限制、MCP 服务器和 skills。
- `/codex models` 列出实时的 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有的 Codex 线程。
- `/codex compact` 请求 Codex 应用服务器压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器的 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器的 skills。

`/codex resume` 会写入与测试框架在正常轮次中使用的相同侧车绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw `codex/*` 模型传入应用服务器，并保持启用扩展历史记录。

该命令界面要求 Codex 应用服务器版本为 `0.118.0` 或更高。如果未来版本或自定义应用服务器未公开对应的 JSON-RPC 方法，单个控制方法会报告为 `unsupported by this Codex app-server`。

## 工具、媒体和压缩

Codex 测试框架只改变底层嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从测试框架接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，仍然通过正常的 OpenClaw 传递路径继续处理。

当所选模型使用 Codex 测试框架时，原生线程压缩会委托给 Codex 应用服务器。OpenClaw 会保留一个转录镜像，用于渠道历史记录、搜索、`/new`、`/reset` 以及未来的模型或测试框架切换。该镜像包括用户提示词、最终助手文本，以及应用服务器发出时的轻量级 Codex 推理或计划记录。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍会继续使用相应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中没有出现 Codex：** 启用 `plugins.entries.codex.enabled`，设置一个 `codex/*` 模型引用，或检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用的是 Pi 而不是 Codex：** 如果没有任何 Codex 测试框架接管此次运行，OpenClaw 可能会使用 Pi 作为兼容性后端。测试时可设置 `embeddedHarness.runtime: "codex"` 以强制选择 Codex，或设置 `embeddedHarness.fallback: "none"` 以在没有匹配的插件测试框架时直接失败。一旦选中 Codex 应用服务器，它的失败会直接暴露出来，而不需要额外的回退配置。

**应用服务器被拒绝：** 升级 Codex，使应用服务器握手报告的版本为 `0.118.0` 或更高。

**模型发现较慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`，或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程应用服务器是否使用相同版本的 Codex 应用服务器协议。

**非 Codex 模型使用了 Pi：** 这是预期行为。Codex 测试框架只接管 `codex/*` 模型引用。

## 相关内容

- [智能体测试框架插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
