---
read_when:
    - 你想要使用内置的 Codex app-server 测试框架
    - 你需要 Codex 模型引用和配置示例
    - 你想要为仅使用 Codex 的部署禁用 Pi 回退机制
summary: 通过内置的 Codex app-server 测试框架运行 OpenClaw 嵌入式智能体回合
title: Codex 测试框架
x-i18n:
    generated_at: "2026-04-22T23:33:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ffd539ad6544284a31bc32f2e506fa46b7ba70d2994ef80eb422ae6cb459d8fa
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex 测试框架

内置的 `codex` 插件让 OpenClaw 可以通过 Codex app-server，而不是内置的 Pi 测试框架，来运行嵌入式智能体回合。

当你希望由 Codex 接管底层智能体会话时，可以使用这个功能：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

原生 Codex 回合同样会遵循共享的 `before_prompt_build`、`before_compaction` 和 `after_compaction` 插件钩子，因此提示词 shim 和具备压缩感知能力的自动化逻辑可以与 Pi 测试框架保持一致。
原生 Codex 回合同样会遵循共享的 `before_prompt_build`、`before_compaction`、`after_compaction`、`llm_input`、`llm_output` 和 `agent_end` 插件钩子，因此提示词 shim、具备压缩感知能力的自动化逻辑以及生命周期观察器都可以与 Pi 测试框架保持一致。

该测试框架默认关闭。只有在启用 `codex` 插件且解析后的模型是 `codex/*` 模型时，或者你显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex` 时，才会选择它。
如果你从未配置 `codex/*`，现有的 Pi、OpenAI、Anthropic、Gemini、本地和自定义提供商运行将保持当前行为。

## 选择正确的模型前缀

OpenClaw 为 OpenAI 访问和 Codex 风格的访问提供了不同的路径：

| 模型引用 | 运行时路径 | 适用场景 |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`       | 通过 OpenClaw/Pi 流程使用 OpenAI 提供商 | 你希望使用 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。 |
| `openai-codex/gpt-5.4` | 通过 Pi 使用 OpenAI Codex OAuth 提供商 | 你希望使用 ChatGPT/Codex OAuth，但不使用 Codex app-server 测试框架。 |
| `codex/gpt-5.4`        | 内置 Codex 提供商加 Codex 测试框架 | 你希望为嵌入式智能体回合使用原生 Codex app-server 执行。 |

Codex 测试框架只接管 `codex/*` 模型引用。现有的 `openai/*`、`openai-codex/*`、Anthropic、Gemini、xAI、本地和自定义提供商引用都会继续走各自的正常路径。

## 要求

- OpenClaw，且可用内置的 `codex` 插件。
- Codex app-server `0.118.0` 或更新版本。
- app-server 进程可用的 Codex 认证信息。

该插件会阻止较旧版本或未提供版本信息的 app-server 握手。这可以确保 OpenClaw 使用的是它已针对其测试过的协议接口。

对于实时和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。使用与你本地 Codex app-server 相同的认证材料。

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

如果你的配置使用 `plugins.allow`，也需要将 `codex` 包含在其中：

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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 也会自动启用内置的 `codex` 插件。在共享配置中，显式添加插件条目仍然很有用，因为这样能让部署意图更加明确。

## 添加 Codex，但不替换其他模型

如果你希望 `codex/*` 模型使用 Codex，而其他所有模型继续使用 Pi，请保留 `runtime: "auto"`：

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

采用这种形式后：

- `/model codex` 或 `/model codex/gpt-5.4` 会使用 Codex app-server 测试框架。
- `/model gpt` 或 `/model openai/gpt-5.4` 会使用 OpenAI 提供商路径。
- `/model opus` 会使用 Anthropic 提供商路径。
- 如果选择的是非 Codex 模型，Pi 仍然作为兼容性测试框架。

## 仅 Codex 的部署

当你需要证明每个嵌入式智能体回合都使用 Codex 测试框架时，禁用 Pi 回退：

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

禁用回退后，如果 `codex` 插件被禁用、请求的模型不是 `codex/*` 引用、app-server 版本过旧，或者 app-server 无法启动，OpenClaw 都会尽早失败。

## 按智能体启用 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体继续保持普通的自动选择：

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

使用普通的会话命令切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，而 Codex 测试框架会根据需要创建或恢复其侧车 app-server 线程。`/reset` 会清除该线程的 OpenClaw 会话绑定。

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

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex 测试框架会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停下来等待无人可答复的原生审批提示。

如果你想启用由 Codex Guardian 审核的审批，请设置 `appServer.mode:
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
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Guardian 模式会展开为：

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

Guardian 是一个原生 Codex 审批审核器。当 Codex 请求离开沙箱、在工作区外写入，或者添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给一个审核子智能体，而不是向人类发出提示。审核器会收集上下文，并应用 Codex 的风险框架，然后批准或拒绝该特定请求。当你希望拥有比 YOLO 模式更多的防护措施，但仍需要无人值守的智能体和心跳能够持续推进时，Guardian 就很有用。

当设置 `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1` 时，Docker 实时测试框架会包含一次 Guardian 探测。它会以 Guardian 模式启动 Codex 测试框架，验证一个无害的提权 shell 命令会被批准，并验证向不受信任的外部目标上传伪造密钥会被拒绝，从而让智能体回头请求显式批准。

单独的策略字段仍然会优先于 `mode`，因此高级部署可以将该预设与显式选择混合使用。

对于已经运行的 app-server，可以使用 WebSocket 传输：

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
| ------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command`           | `"codex"`                                | 用于 stdio 传输的可执行文件。 |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。 |
| `url`               | unset                                    | WebSocket app-server URL。 |
| `authToken`         | unset                                    | 用于 WebSocket 传输的 Bearer token。 |
| `headers`           | `{}`                                     | 额外的 WebSocket 请求头。 |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。 |
| `mode`              | `"yolo"`                                 | 用于 YOLO 或 Guardian 审核执行的预设。 |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动、恢复、回合过程中的原生 Codex 审批策略。 |
| `sandbox`           | `"danger-full-access"`                   | 在线程启动和恢复时发送的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"`                                 | 使用 `"guardian_subagent"` 让 Codex Guardian 审核提示。 |
| `serviceTier`       | unset                                    | 可选的 Codex 服务层级，例如 `"priority"`。 |

当对应的配置字段未设置时，旧版环境变量仍可作为本地测试的回退方案：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，因为这样可以将插件行为与 Codex 测试框架其余设置放在同一个经过审查的文件中。

## 常见用法

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

仅 Codex 测试框架验证，禁用 Pi 回退：

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有的 Codex 线程时，下一个回合会再次将当前选中的 `codex/*` 模型、提供商、审批策略、沙箱和服务层级发送给 app-server。从 `codex/gpt-5.4` 切换到 `codex/gpt-5.2` 时，会保留线程绑定，但会要求 Codex 使用新选定的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道上使用。

常见形式：

- `/codex status` 显示实时的 app-server 连接状态、模型、账户、速率限制、MCP 服务器和技能。
- `/codex models` 列出实时的 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有的 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与测试框架正常回合所使用的相同侧车绑定文件。在下一条消息时，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw `codex/*` 模型传入 app-server，并保持启用扩展历史记录。

该命令接口要求 Codex app-server `0.118.0` 或更高版本。如果未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，各个控制方法会显示为 `unsupported by this Codex app-server`。

## 工具、媒体和压缩

Codex 测试框架只改变底层嵌入式智能体执行器。

OpenClaw 仍然负责构建工具列表，并从测试框架接收动态工具结果。文本、图片、视频、音乐、TTS、审批以及消息工具输出，都会继续通过 OpenClaw 的正常传递路径处理。

当所选模型使用 Codex 测试框架时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或测试框架切换。该镜像包含用户提示、最终助手文本，以及 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩的开始和完成信号。它尚未提供人类可读的压缩摘要，也尚未提供一份可审计的条目列表，用于说明压缩后 Codex 保留了哪些内容。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍将继续使用相应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中没有出现 Codex：** 启用 `plugins.entries.codex.enabled`，设置一个 `codex/*` 模型引用，或者检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用的是 Pi 而不是 Codex：** 如果没有 Codex 测试框架接管此次运行，OpenClaw 可能会使用 Pi 作为兼容性后端。测试时可设置 `embeddedHarness.runtime: "codex"` 来强制选择 Codex，或者设置 `embeddedHarness.fallback: "none"`，以便在没有插件测试框架匹配时直接失败。一旦选择了 Codex app-server，其故障将直接暴露，不需要额外的回退配置。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手报告的版本为 `0.118.0` 或更高。

**模型发现速度很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`，或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，并确认远程 app-server 使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 Pi：** 这是预期行为。Codex 测试框架只接管 `codex/*` 模型引用。

## 相关内容

- [智能体测试框架插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
