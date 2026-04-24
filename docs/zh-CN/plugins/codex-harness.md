---
read_when:
    - 你想使用内置的 Codex 应用服务器 harness
    - 你需要 Codex 测试框架配置示例
    - 你希望仅使用 Codex 的部署在无法使用时直接失败，而不是回退到 Pi
summary: 通过内置的 Codex 应用服务器 harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex 测试框架
x-i18n:
    generated_at: "2026-04-24T21:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 674bc34552401d1a492b348ceb86fd513a894760987a0c6fef6e79fdb0b3ebfb
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 可以通过 Codex 应用服务器，而不是内置的 Pi harness，来运行嵌入式智能体轮次。

当你希望 Codex 接管底层智能体会话时，请使用此方式：模型发现、原生线程恢复、原生压缩，以及应用服务器执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

原生 Codex 轮次会将 OpenClaw 插件钩子保留为公开兼容层。这些是进程内 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- `agent_end`

插件还可以注册与 harness 无关的工具结果中间件，在 OpenClaw 执行工具之后、结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公开的 `tool_result_persist` 插件钩子不同，后者会转换由 OpenClaw 拥有的转录工具结果写入。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用的规范形式为 `openai/gpt-*`，并在需要原生应用服务器执行时，显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。出于兼容性考虑，旧版 `codex/*` 模型引用仍会自动选择该 harness，但它们不会作为常规模型/提供商选项显示。

## 选择正确的模型前缀

OpenAI 系列路由依赖特定前缀。若你希望通过 Pi 使用 Codex OAuth，请使用 `openai-codex/*`；若你希望直接访问 OpenAI API，或你正在强制使用原生 Codex 应用服务器 harness，请使用 `openai/*`：

| 模型引用                                              | 运行时路径                                   | 适用场景                                                                  |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | 通过 OpenClaw/Pi plumbing 的 OpenAI 提供商路径 | 你希望通过 `OPENAI_API_KEY` 使用当前直接的 OpenAI Platform API 访问。     |
| `openai-codex/gpt-5.5`                                | 通过 OpenClaw/Pi 的 OpenAI Codex OAuth       | 你希望使用默认 Pi runner 的 ChatGPT/Codex 订阅认证。                      |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex 应用服务器 harness                     | 你希望嵌入式智能体轮次使用原生 Codex 应用服务器执行。                     |

在 OpenClaw 中，GPT-5.5 当前仅支持订阅/OAuth。对于 Pi OAuth，请使用 `openai-codex/gpt-5.5`；对于 Codex 应用服务器 harness，请使用 `openai/gpt-5.5`。一旦 OpenAI 在公共 API 上启用 GPT-5.5，就会支持 `openai/gpt-5.5` 的直接 API key 访问。

旧版 `codex/gpt-*` 引用仍然作为兼容别名被接受。Doctor 兼容迁移会将旧版主 `codex/*` 引用重写为 `openai/*`，并单独记录 Codex harness 策略。新的 Pi Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生应用服务器 harness 配置应使用 `openai/gpt-*` 并配合 `embeddedHarness.runtime: "codex"`。

`agents.defaults.imageModel` 也遵循相同的前缀划分。如果图像理解应通过 OpenAI Codex OAuth 提供商路径运行，请使用 `openai-codex/gpt-*`。如果图像理解应通过受限的 Codex 应用服务器轮次运行，请使用 `codex/gpt-*`。Codex 应用服务器模型必须声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 可确认当前会话的实际 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。该记录包含选中的 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，OpenClaw 会在该会话上记录所选的 harness id，并在同一会话 id 的后续轮次中继续使用它。当你希望未来的新会话使用另一个 harness 时，请更改 `embeddedHarness` 配置或 `OPENCLAW_AGENT_RUNTIME`；在将现有对话从 Pi 切换到 Codex，或反向切换之前，请使用 `/new` 或 `/reset` 启动一个新的会话。这样可以避免通过两套不兼容的原生会话系统重放同一份转录。

在 harness 固定机制引入之前创建的旧会话，一旦已有转录历史，就会被视为固定到 Pi。更改配置后，如需让该对话改用 Codex，请使用 `/new` 或 `/reset`。

`/status` 会在 `Fast` 旁边显示实际生效的非 Pi harness，例如 `Fast · codex`。默认的 Pi harness 仍显示为 `Runner: pi (embedded)`，不会额外添加单独的 harness 徽标。

## 要求

- OpenClaw，且内置 `codex` 插件可用。
- Codex 应用服务器 `0.118.0` 或更高版本。
- 应用服务器进程可用的 Codex 认证。

该插件会阻止较旧或没有版本信息的应用服务器握手。这可以确保 OpenClaw 始终运行在它已测试过的协议表面上。

对于实时测试和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。请使用与你本地 Codex 应用服务器相同的认证材料。

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
        fallback: "none",
      },
    },
  },
}
```

如果你的配置使用 `plugins.allow`，也请将 `codex` 包含进去：

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

如果旧版配置将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>`，仍会自动启用内置 `codex` 插件。新配置应优先使用 `openai/<model>`，并配合上面的显式 `embeddedHarness` 条目。

## 在不替换其他模型的情况下添加 Codex

当你希望旧版 `codex/*` 引用选择 Codex，而其他一切仍使用 Pi 时，请保持 `runtime: "auto"`。对于新配置，建议在应使用该 harness 的智能体上显式设置 `runtime: "codex"`。

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

采用这种形式后：

- `/model gpt` 或 `/model openai/gpt-5.5` 会在此配置中使用 Codex 应用服务器 harness。
- `/model opus` 会使用 Anthropic 提供商路径。
- 如果选中的是非 Codex 模型，Pi 仍会作为兼容 harness。

## 仅使用 Codex 的部署

当你需要证明每一次嵌入式智能体轮次都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不会回退到 Pi，因此 `fallback: "none"` 是可选的，但通常可作为文档说明保留：

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

在强制使用 Codex 时，如果 Codex 插件被禁用、应用服务器版本过旧，或应用服务器无法启动，OpenClaw 会尽早失败。只有当你有意让 Pi 处理缺失的 harness 选择时，才设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体使用 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体仍保持正常的自动选择：

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

使用常规会话命令切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，Codex harness 会按需创建或恢复其 sidecar 应用服务器线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向应用服务器请求可用模型。如果发现失败或超时，它会使用内置的回退目录，其中包括：

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

## 应用服务器连接和策略

默认情况下，插件会在本地使用以下命令启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和 `sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停下来等待无人响应的原生审批提示。

如需选择使用由 Codex guardian 审核的审批，请设置 `appServer.mode: "guardian"`：

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

Guardian 是原生 Codex 审批审核器。当 Codex 请求离开沙箱、在工作区之外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给审核子智能体，而不是发起人工提示。审核器会应用 Codex 的风险框架，并批准或拒绝该具体请求。当你希望比 YOLO 模式拥有更多防护，同时仍需要无人值守的智能体持续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"` 和 `sandbox: "workspace-write"`。各个策略字段仍然会覆盖 `mode`，因此高级部署可以将该预设与显式选项混合使用。

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

| 字段                | 默认值                                   | 含义                                                                                                      |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                    |
| `command`           | `"codex"`                                | 用于 stdio 传输的可执行文件。                                                                             |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                                                   |
| `url`               | 未设置                                   | WebSocket 应用服务器 URL。                                                                                |
| `authToken`         | 未设置                                   | 用于 WebSocket 传输的 Bearer token。                                                                      |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。                                                                                   |
| `requestTimeoutMs`  | `60000`                                  | 应用服务器控制平面调用的超时时间。                                                                        |
| `mode`              | `"yolo"`                                 | 用于 YOLO 或 guardian 审核执行的预设。                                                                    |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。                                                           |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                |
| `approvalsReviewer` | `"user"`                                 | 使用 `"guardian_subagent"` 可让 Codex Guardian 审核提示。                                                 |
| `serviceTier`       | 未设置                                   | 可选的 Codex 应用服务器服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。                    |

当对应的配置字段未设置时，较旧的环境变量仍可作为本地测试的回退方式使用：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，因为它会将插件行为与 Codex harness 其余设置保存在同一个经过审查的文件中。

## 常见方案

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

仅使用 Codex 的 harness 验证，禁用 Pi 回退：

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

使用 Guardian 审核的 Codex 审批：

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

模型切换仍由 OpenClaw 控制。当 OpenClaw 会话附加到现有 Codex 线程时，下一轮会再次将当前选定的 OpenAI 模型、提供商、审批策略、沙箱和服务层级发送到应用服务器。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选定的模型继续运行。

## Codex 命令

内置插件将 `/codex` 注册为授权斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道上使用。

常见形式：

- `/codex status` 显示实时应用服务器连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex 应用服务器压缩已附加的线程。
- `/codex review` 为已附加线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器 Skills。

`/codex resume` 会写入与 harness 正常轮次相同的 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入应用服务器，并保持启用扩展历史记录。

该命令接口要求 Codex 应用服务器版本为 `0.118.0` 或更高。如果未来版本或自定义应用服务器未公开某个 JSON-RPC 方法，则对应的单个控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级                                  | 所有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 在 Pi 和 Codex harness 之间提供产品/插件兼容性。                   |
| Codex 应用服务器扩展中间件            | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐轮适配器行为。                           |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。               |

OpenClaw 不会使用项目级或全局 Codex `hooks.json` 文件来路由 OpenClaw 插件行为。Codex 原生钩子适用于由 Codex 拥有的操作，例如 shell 策略、原生工具结果审查、停止处理，以及原生压缩/模型生命周期，但它们不是 OpenClaw 插件 API。

对于 OpenClaw 动态工具，Codex 请求调用后，OpenClaw 会执行该工具，因此 OpenClaw 会在 harness 适配器中触发它所拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范工具记录。OpenClaw 可以镜像选定事件，但除非 Codex 通过应用服务器或原生钩子回调公开该操作，否则它无法重写原生 Codex 线程。

当更新版本的 Codex 应用服务器公开原生压缩和模型生命周期钩子事件时，OpenClaw 应对该协议支持进行版本门控，并在语义准确的前提下，将这些事件映射到现有 OpenClaw 钩子契约中。在此之前，OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件只是适配器层面的观察结果，不是对 Codex 内部请求或压缩负载的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` 应用服务器通知会被投射为 `codex_app_server.hook` 智能体事件，用于轨迹和调试。它们不会调用 OpenClaw 插件钩子。

## 工具、媒体和压缩

Codex harness 只会更改底层嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批和消息工具输出仍通过常规 OpenClaw 传递路径继续处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件审批流程路由。Codex `request_user_input` 提示会发送回原始聊天，下一条排队的后续消息会回答该原生服务器请求，而不是作为额外上下文引导。其他 MCP 征询请求仍会以封闭失败方式处理。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex 应用服务器。OpenClaw 会保留转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换。该镜像包括用户提示、最终助手文本，以及应用服务器发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 仅记录原生压缩开始和完成信号。它尚未公开可读的压缩摘要，也未提供 Codex 在压缩后保留了哪些条目的可审计列表。

由于 Codex 拥有规范原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它仅在 OpenClaw 正在写入由 OpenClaw 拥有的会话转录工具结果时生效。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍会继续使用相应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中未显示 Codex：** 启用 `plugins.entries.codex.enabled`，选择设置了 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用了 Pi 而不是 Codex：** 当没有 Codex harness 声明接管运行时，`runtime: "auto"` 仍可能使用 Pi 作为兼容后端。测试时请设置 `embeddedHarness.runtime: "codex"` 以强制选择 Codex。现在，强制使用 Codex 运行时会直接失败，而不是回退到 Pi，除非你显式设置 `embeddedHarness.fallback: "pi"`。一旦选中 Codex 应用服务器，其故障会直接暴露，不会再有额外回退配置。

**应用服务器被拒绝：** 升级 Codex，使应用服务器握手报告版本 `0.118.0` 或更高。

**模型发现太慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程应用服务器是否使用相同版本的 Codex 应用服务器协议。

**非 Codex 模型使用了 Pi：** 这是预期行为，除非你强制设置了 `embeddedHarness.runtime: "codex"`（或选择了旧版 `codex/*` 引用）。普通的 `openai/gpt-*` 和其他提供商引用会保留在各自正常的提供商路径上。

## 相关内容

- [Agent Harness Plugins](/zh-CN/plugins/sdk-agent-harness)
- [Model Providers](/zh-CN/concepts/model-providers)
- [Configuration Reference](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
