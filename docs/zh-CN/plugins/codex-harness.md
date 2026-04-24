---
read_when:
    - 你想使用内置的 Codex 应用服务器 harness
    - 你需要 Codex harness 配置示例
    - 你想为仅使用 Codex 的部署禁用 Pi 回退
summary: 通过内置的 Codex 应用服务器 harness 运行 OpenClaw 嵌入式智能体回合
title: Codex harness
x-i18n:
    generated_at: "2026-04-24T18:44:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1942e571358674066a7a92139c0ab05273b8196ad68ae3ca2349e2be33cac403
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 能够通过 Codex 应用服务器，而不是内置的 Pi harness，来运行嵌入式智能体回合。

当你希望 Codex 接管底层智能体会话时，请使用它：模型发现、原生线程恢复、原生压缩，以及应用服务器执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

原生 Codex 回合会将 OpenClaw 插件钩子保留为公开兼容层。这些是在进程内运行的 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- `agent_end`

内置插件还可以注册一个 Codex 应用服务器扩展工厂，以添加异步 `tool_result` 中间件。该中间件会在 OpenClaw 执行工具之后、并在结果返回给 Codex 之前，对 OpenClaw 动态工具运行。它与公开的 `tool_result_persist` 插件钩子是分开的；后者用于转换由 OpenClaw 管理的转录工具结果写入。

该 harness 默认关闭。新配置应将 OpenAI 模型引用保持为规范形式 `openai/gpt-*`，并在希望使用原生应用服务器执行时，显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。出于兼容性考虑，旧版 `codex/*` 模型引用仍会自动选择该 harness，但它们不会作为常规模型/提供商选项显示。

## 选择正确的模型前缀

OpenAI 系列路由对前缀很敏感。如果你想通过 Pi 使用 Codex OAuth，请使用 `openai-codex/*`；如果你想直接使用 OpenAI API 访问，或者你正在强制使用原生 Codex 应用服务器 harness，请使用 `openai/*`：

| 模型引用                                              | 运行时路径                                   | 适用场景                                                                  |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | 通过 OpenClaw/Pi 管线使用 OpenAI 提供商      | 你希望通过 `OPENAI_API_KEY` 使用当前的 OpenAI Platform API 直接访问。     |
| `openai-codex/gpt-5.5`                                | 通过 OpenClaw/Pi 使用 OpenAI Codex OAuth     | 你希望使用默认 Pi runner 的 ChatGPT/Codex 订阅凭证认证。                  |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex 应用服务器 harness                     | 你希望为嵌入式智能体回合使用原生 Codex 应用服务器执行。                   |

GPT-5.5 当前在 OpenClaw 中仅支持订阅/OAuth 方式。对于 Pi OAuth，请使用 `openai-codex/gpt-5.5`；对于 Codex 应用服务器 harness，请使用 `openai/gpt-5.5`。一旦 OpenAI 在公开 API 中启用 GPT-5.5，就会支持通过 API 密钥直接访问 `openai/gpt-5.5`。

旧版 `codex/gpt-*` 引用仍然作为兼容性别名被接受。Doctor 兼容性迁移会将旧版主 `codex/*` 引用重写为 `openai/*`，并将 Codex harness 策略单独记录。新的 Pi Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生应用服务器 harness 配置应使用 `openai/gpt-*` 并配合 `embeddedHarness.runtime: "codex"`。

`agents.defaults.imageModel` 也遵循相同的前缀区分。当图像理解应通过 OpenAI Codex OAuth 提供商路径运行时，请使用 `openai-codex/gpt-*`。当图像理解应通过受限的 Codex 应用服务器回合运行时，请使用 `codex/gpt-*`。Codex 应用服务器模型必须声明支持图像输入；纯文本 Codex 模型会在媒体回合开始前失败。

使用 `/status` 来确认当前会话的实际 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关中的结构化 `agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

Harness 选择不是实时会话控制。当某个嵌入式回合运行时，OpenClaw 会在该会话上记录所选 harness id，并在同一会话 id 的后续回合中继续使用它。当你希望未来会话使用其他 harness 时，请更改 `embeddedHarness` 配置或 `OPENCLAW_AGENT_RUNTIME`；在现有对话于 Pi 和 Codex 之间切换之前，请使用 `/new` 或 `/reset` 启动一个全新会话。这样可以避免通过两个不兼容的原生会话系统重放同一份转录。

在引入 harness 固定之前创建的旧会话，只要已有转录历史，就会被视为固定为 Pi。更改配置后，请使用 `/new` 或 `/reset` 让该对话切换到 Codex。

`/status` 会在 `Fast` 旁边显示实际生效的非 Pi harness，例如 `Fast · codex`。默认的 Pi harness 仍显示为 `Runner: pi (embedded)`，不会额外添加单独的 harness 标记。

## 要求

- OpenClaw，且提供内置的 `codex` 插件。
- Codex 应用服务器 `0.118.0` 或更高版本。
- 应用服务器进程可用的 Codex 认证信息。

该插件会阻止旧版或未带版本信息的应用服务器握手。这样可以确保 OpenClaw 始终运行在其已验证过的协议接口上。

对于 live 和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。请使用与你本地 Codex 应用服务器相同的认证材料。

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

如果你的配置使用 `plugins.allow`，也请将 `codex` 包含在其中：

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

将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>` 的旧版配置，仍会自动启用内置的 `codex` 插件。新配置应优先使用 `openai/<model>`，再加上上面的显式 `embeddedHarness` 条目。

## 添加 Codex 而不替换其他模型

当你希望旧版 `codex/*` 引用选择 Codex，而其余所有情况都使用 Pi 时，请保持 `runtime: "auto"`。对于新配置，建议在应使用该 harness 的智能体上显式设置 `runtime: "codex"`。

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

在这种结构下：

- `/model gpt` 或 `/model openai/gpt-5.5` 会为此配置使用 Codex 应用服务器 harness。
- `/model opus` 会使用 Anthropic 提供商路径。
- 如果选择了非 Codex 模型，Pi 仍会作为兼容性 harness。

## 仅使用 Codex 的部署

当你需要证明每一个嵌入式智能体回合都使用 Codex harness 时，请禁用 Pi 回退：

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
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，如果 Codex 插件被禁用、应用服务器版本过旧，或者应用服务器无法启动，OpenClaw 会提前失败。

## 按智能体配置 Codex

你可以让一个智能体仅使用 Codex，而默认智能体继续保持正常的自动选择：

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

使用正常的会话命令切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，而 Codex harness 会按需创建或恢复其 sidecar 应用服务器线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一次回合重新根据当前配置解析 harness。

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

当你希望启动时避免探测 Codex，并固定使用回退目录时，请禁用发现：

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

## 应用服务器连接与策略

默认情况下，插件会通过以下命令在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及 `sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停在无人可响应的原生审批提示上。

若要选择启用由 Codex guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 是原生的 Codex 审批审查器。当 Codex 请求离开沙箱、在工作区外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给一个 reviewer 子智能体，而不是向人类发出提示。该 reviewer 会应用 Codex 的风险框架，并批准或拒绝具体请求。当你希望比 YOLO 模式有更多防护措施，但仍需要无人值守的智能体持续推进工作时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"`，以及 `sandbox: "workspace-write"`。各个单独的策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选择混合使用。

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
| `headers`           | `{}`                                     | 额外的 WebSocket 请求头。                                                                                 |
| `requestTimeoutMs`  | `60000`                                  | 应用服务器控制平面调用的超时时间。                                                                        |
| `mode`              | `"yolo"`                                 | 用于 YOLO 或 guardian 审核执行的预设。                                                                    |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/回合的原生 Codex 审批策略。                                                           |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                                |
| `approvalsReviewer` | `"user"`                                 | 使用 `"guardian_subagent"` 让 Codex Guardian 审核提示。                                                   |
| `serviceTier`       | 未设置                                   | 可选的 Codex 应用服务器服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版取值会被忽略。                  |

当对应的配置字段未设置时，旧的环境变量仍可作为本地测试的回退方式使用：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，更推荐使用配置，因为这样可以将插件行为与其余 Codex harness 设置保存在同一个经过审查的文件中。

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

带显式请求头的远程应用服务器：

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

模型切换仍由 OpenClaw 控制。当某个 OpenClaw 会话附加到现有 Codex 线程时，下一次回合会再次向应用服务器发送当前选定的 OpenAI 模型、提供商、审批策略、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选定的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为授权的斜杠命令。它是通用命令，可在任何支持 OpenClaw 文本命令的渠道上使用。

常见形式：

- `/codex status` 显示实时应用服务器连接状态、模型、账户、速率限制、MCP 服务器和 skills。
- `/codex models` 列出实时 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex 应用服务器压缩已附加的线程。
- `/codex review` 为已附加线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器 skills。

`/codex resume` 会写入与 harness 正常回合所使用的相同 sidecar 绑定文件。在下一条消息中，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入应用服务器，并保持启用扩展历史记录。

该命令接口要求 Codex 应用服务器版本为 `0.118.0` 或更高。如果未来版本或自定义应用服务器未公开某个 JSON-RPC 方法，则对应的单独控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 具有三层钩子：

| 层级                                  | 所有者                   | 用途                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                     | OpenClaw                 | 在 Pi 和 Codex harness 之间提供产品/插件兼容性。                   |
| Codex 应用服务器扩展中间件            | OpenClaw 内置插件        | 围绕 OpenClaw 动态工具的逐回合适配器行为。                         |
| Codex 原生钩子                        | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。               |

OpenClaw 不使用项目级或全局 Codex `hooks.json` 文件来路由 OpenClaw 插件行为。Codex 原生钩子适用于由 Codex 拥有的操作，例如 shell 策略、原生工具结果审查、停止处理，以及原生压缩/模型生命周期，但它们不是 OpenClaw 插件 API。

对于 OpenClaw 动态工具，Codex 请求调用后，OpenClaw 才执行该工具，因此 OpenClaw 会在 harness 适配器中触发其所拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有权威工具记录。OpenClaw 可以镜像选定事件，但无法重写原生 Codex 线程，除非 Codex 通过应用服务器或原生钩子回调公开该操作。

当较新的 Codex 应用服务器版本公开原生压缩和模型生命周期钩子事件时，OpenClaw 应对该协议支持进行版本门控，并在语义真实一致的前提下，将这些事件映射到现有 OpenClaw 钩子契约中。在此之前，OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件都只是适配器层面的观察，不是对 Codex 内部请求或压缩负载的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` 应用服务器通知会被投射为 `codex_app_server.hook` 智能体事件，用于轨迹记录和调试。它们不会调用 OpenClaw 插件钩子。

## 工具、媒体和压缩

Codex harness 只改变底层的嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，仍然通过正常的 OpenClaw 传递路径处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件审批流程进行路由。Codex 的 `request_user_input` 提示会被发回原始聊天，而下一个排队的后续消息将用于响应该原生服务器请求，而不是被当作额外上下文进行引导。其他 MCP 征询请求仍会以默认拒绝方式处理。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex 应用服务器。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该镜像包括用户提示、最终助手文本，以及应用服务器发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未公开人类可读的压缩摘要，也尚未提供 Codex 在压缩后保留了哪些条目的可审计列表。

由于 Codex 拥有权威的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它只会在 OpenClaw 写入由 OpenClaw 管理的会话转录工具结果时生效。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解会继续使用相应的提供商/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中没有出现 Codex：** 启用 `plugins.entries.codex.enabled`，选择带有 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用的是 Pi 而不是 Codex：** 如果没有 Codex harness 声明该运行，OpenClaw 可能会使用 Pi 作为兼容性后端。测试时请设置 `embeddedHarness.runtime: "codex"` 以强制选择 Codex，或设置 `embeddedHarness.fallback: "none"`，以便在没有匹配插件 harness 时直接失败。一旦选中了 Codex 应用服务器，它的故障就会直接暴露出来，而不会有额外的回退配置。

**应用服务器被拒绝：** 升级 Codex，使应用服务器握手报告的版本为 `0.118.0` 或更高。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`，或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，并确认远程应用服务器使用的是相同版本的 Codex 应用服务器协议。

**非 Codex 模型使用了 Pi：** 这是预期行为，除非你强制设置了 `embeddedHarness.runtime: "codex"`（或选择了旧版 `codex/*` 引用）。普通的 `openai/gpt-*` 和其他提供商引用会继续走它们的常规提供商路径。

## 相关内容

- [Agent Harness Plugins](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
