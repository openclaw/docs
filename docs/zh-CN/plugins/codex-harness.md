---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅使用 Codex 的部署禁用 PI 回退
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex Harness
x-i18n:
    generated_at: "2026-04-23T19:25:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99ca00550be4e41aa154a99298e3e1b027f8199d541249149cb0ec722e035876
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

内置的 `codex` 插件让 OpenClaw 可以通过 Codex app-server，而不是内置的 PI harness，来运行嵌入式智能体轮次。

当你希望由 Codex 接管底层智能体会话时，请使用它：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。
OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体投递，以及可见的转录镜像。

原生 Codex 轮次同样遵循共享插件钩子，因此 prompt shim、具备 compaction 感知的自动化、工具中间件和生命周期观察器都能与 PI harness 保持一致：

- `before_prompt_build`
- `before_compaction`、`after_compaction`
- `llm_input`、`llm_output`
- `tool_result`、`after_tool_call`
- `before_message_write`
- `agent_end`

内置插件还可以注册一个 Codex app-server extension factory，以添加异步 `tool_result` 中间件。

该 harness 默认关闭。只有在启用了 `codex` 插件且解析后的模型是 `codex/*` 模型时，或者你显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex` 时，才会选择它。
如果你从未配置 `codex/*`，现有的 PI、OpenAI、Anthropic、Gemini、local 和自定义 provider 运行都会保持当前行为。

## 选择正确的模型前缀

OpenClaw 为 OpenAI 访问和 Codex 形态的访问提供了不同路由：

| 模型引用 | 运行时路径 | 适用场景 |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.5` | 通过 OpenClaw/PI 管线的 OpenAI provider | 你希望通过 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。 |
| `openai-codex/gpt-5.5` | 通过 PI 的 OpenAI Codex OAuth provider | 你希望使用 ChatGPT/Codex OAuth，但不使用 Codex app-server harness。 |
| `codex/gpt-5.5` | 内置 Codex provider 加 Codex harness | 你希望嵌入式智能体轮次使用原生 Codex app-server 执行。 |

Codex harness 只接管 `codex/*` 模型引用。现有的 `openai/*`、`openai-codex/*`、Anthropic、Gemini、xAI、local 和自定义 provider 引用都会继续走各自的正常路径。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，OpenClaw 会在该会话上记录所选 harness ID，并在同一会话 ID 的后续轮次中持续使用它。
当你希望未来的新会话使用其他 harness 时，请修改 `embeddedHarness` 配置或 `OPENCLAW_AGENT_RUNTIME`；在将现有对话从 PI 切换到 Codex 之前，请使用 `/new` 或 `/reset` 启动一个全新会话。
这样可以避免将同一份转录通过两套不兼容的原生会话系统重放。

在 harness 固定机制引入之前创建的旧会话，只要已有转录历史，就会被视为固定到 PI。
更改配置后，使用 `/new` 或 `/reset` 可让该对话切换到 Codex。

`/status` 会在 `Fast` 旁边显示生效中的非 PI harness，例如 `Fast · codex`。
默认的 PI harness 不会显示。

## 要求

- OpenClaw，并且可使用内置的 `codex` 插件。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex 认证信息。

该插件会阻止版本过旧或未提供版本信息的 app-server 握手。
这样可以确保 OpenClaw 只运行在它已测试过的协议表面上。

对于 live 和 Docker smoke 测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。
请使用与你本地 Codex app-server 相同的认证材料。

## 最小配置

使用 `codex/gpt-5.5`，启用内置插件，并强制使用 `codex` harness：

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
      model: "codex/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

如果你的配置使用了 `plugins.allow`，也请把 `codex` 加进去：

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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>`，也会自动启用内置的 `codex` 插件。
在共享配置中，显式写出插件条目仍然很有用，因为它能更清楚地表明部署意图。

## 在不替换其他模型的情况下添加 Codex

如果你希望 `codex/*` 模型使用 Codex，而其他所有模型继续使用 PI，请保持 `runtime: "auto"`：

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
        primary: "codex/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.5": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.5": { alias: "gpt" },
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

- `/model codex` 或 `/model codex/gpt-5.5` 使用 Codex app-server harness。
- `/model gpt` 或 `/model openai/gpt-5.5` 使用 OpenAI provider 路径。
- `/model opus` 使用 Anthropic provider 路径。
- 如果选择的是非 Codex 模型，PI 仍然是兼容性 harness。

## 仅 Codex 部署

当你需要证明每一个嵌入式智能体轮次都使用 Codex harness 时，请禁用 PI 回退：

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.5",
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

禁用回退后，如果 Codex 插件被禁用、请求的模型不是 `codex/*` 引用、app-server 版本过旧，或者 app-server 无法启动，OpenClaw 都会尽早失败。

## 每智能体 Codex

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
        model: "codex/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

使用普通会话命令即可切换智能体和模型。
`/new` 会创建一个新的 OpenClaw 会话，而 Codex harness 会按需创建或恢复其 sidecar app-server 线程。
`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮根据当前配置重新解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。
如果发现失败或超时，它会使用内置回退目录：

- `codex/gpt-5.5`
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

默认情况下，插件会使用以下命令在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。
这是用于自治心跳的可信本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会因为没有人可响应的原生审批提示而停下来。

如果你想启用由 Codex guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 是原生 Codex 审批审核者。
当 Codex 请求离开沙箱、在工作区外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给一个 reviewer 子智能体，而不是发给人工提示。
该 reviewer 会应用 Codex 的风险框架，并批准或拒绝具体请求。
如果你希望比 YOLO 模式有更多防护措施，但仍需要无人值守的智能体持续推进，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"` 和 `sandbox: "workspace-write"`。
各个单独的策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选择混合使用。

对于已经在运行的 app-server，可使用 WebSocket 传输：

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
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport` | `"stdio"` | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command` | `"codex"` | `stdio` 传输使用的可执行文件。 |
| `args` | `["app-server", "--listen", "stdio://"]` | `stdio` 传输使用的参数。 |
| `url` | 未设置 | WebSocket app-server URL。 |
| `authToken` | 未设置 | WebSocket 传输使用的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket headers。 |
| `requestTimeoutMs` | `60000` | app-server 控制平面调用的超时时间。 |
| `mode` | `"yolo"` | YOLO 或 guardian 审核执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程 start/resume/turn 的原生 Codex 审批策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程 start/resume 的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"guardian_subagent"` 可让 Codex Guardian 审核提示。 |
| `serviceTier` | 未设置 | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。 |

当匹配的配置字段未设置时，较旧的环境变量仍可作为本地测试的回退方式：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，
因为这样能将插件行为与 Codex harness 其余设置放在同一个经过审查的文件中。

## 常见配方

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

仅 Codex harness 验证，并禁用 PI 回退：

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
            approvalsReviewer: "guardian_subagent",
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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有 Codex 线程时，
下一轮会再次把当前选中的 `codex/*` 模型、provider、审批策略、沙箱和服务层级发送给
app-server。将 `codex/gpt-5.5` 切换到 `codex/gpt-5.2` 时，会保留线程绑定，
但会要求 Codex 使用新选择的模型继续执行。

## Codex 命令

内置插件会将 `/codex` 注册为一个已授权的斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道中使用。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加线程。
- `/codex review` 为已附加线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 正常轮次相同的 sidecar 绑定文件。
在下一条消息时，OpenClaw 会恢复该 Codex 线程，将当前选中的 OpenClaw `codex/*` 模型传入 app-server，并保持扩展历史记录启用。

该命令面要求 Codex app-server `0.118.0` 或更高版本。如果未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，则各个控制方法会显示为 `unsupported by this Codex app-server`。

## 工具、媒体与压缩

Codex harness 只会改变底层嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，都会继续通过 OpenClaw 的常规投递路径传输。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批请求会通过 OpenClaw 的插件审批流程进行路由；
其他请求输入和自由格式输入请求仍然会以失败关闭方式处理。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。
OpenClaw 会继续保留一个转录镜像，用于渠道历史记录、搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该镜像包含用户提示、最终助手文本，以及 app-server 发出时的轻量级 Codex 推理或计划记录。当前，OpenClaw 只记录原生压缩开始和完成信号。它尚未提供人类可读的压缩摘要，也未提供一份可审计清单来说明压缩后 Codex 保留了哪些条目。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解仍会使用相应的 provider/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中没有出现 Codex：** 启用 `plugins.entries.codex.enabled`，
设置一个 `codex/*` 模型引用，或检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用的是 PI 而不是 Codex：** 如果没有 Codex harness 接管该运行，
OpenClaw 可能会将 PI 用作兼容性后端。测试时请设置
`embeddedHarness.runtime: "codex"` 以强制选择 Codex，或设置
`embeddedHarness.fallback: "none"` 以在没有插件 harness 匹配时直接失败。一旦选中 Codex app-server，其失败会直接暴露出来，而不会再经过额外的回退配置。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手报告版本为
`0.118.0` 或更高。

**模型发现太慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，
以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 这是预期行为。Codex harness 只接管
`codex/*` 模型引用。

## 相关内容

- [智能体 Harness 插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
