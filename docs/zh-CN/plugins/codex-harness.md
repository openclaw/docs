---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在失败时直接报错，而不是回退到 PI
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-25T00:42:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 366400f3d4018d6149e80b0b87b49ad7332c6164e8b3b70a0c4359068ee2685f
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件可让 OpenClaw 通过
Codex app-server 运行嵌入式智能体轮次，而不是使用内置的 PI harness。

当你希望由 Codex 接管底层智能体会话时，请使用此方式：模型
发现、原生线程恢复、原生压缩，以及 app-server 执行。
OpenClaw 仍负责聊天渠道、会话文件、模型选择、工具、
审批、媒体投递，以及可见的转录镜像。

原生 Codex 轮次将 OpenClaw 插件钩子保留为公共兼容层。
这些是进程内的 OpenClaw 钩子，而不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- `agent_end`

插件还可以注册与运行时无关的工具结果中间件，在 OpenClaw 执行工具之后、将结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公共
`tool_result_persist` 插件钩子是分开的；后者会转换由 OpenClaw 管理的转录
工具结果写入。

该 harness 默认关闭。新配置应将 OpenAI 模型引用
保持为规范形式 `openai/gpt-*`，并在需要原生 app-server 执行时显式强制指定
`embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用仍会出于兼容性自动选择
该 harness，但由运行时支持的旧版提供商前缀不会显示为普通模型 / 提供商选项。

## 选择正确的模型前缀

OpenAI 系列路由对前缀很敏感。当你希望通过 PI 使用
Codex OAuth 时，请使用 `openai-codex/*`；当你希望直接访问 OpenAI API，或
当你强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| 模型引用 | 运行时路径 | 使用场景 |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | 通过 OpenClaw / PI 流程的 OpenAI 提供商 | 你希望使用当前通过 `OPENAI_API_KEY` 访问的直接 OpenAI Platform API。 |
| `openai-codex/gpt-5.5` | 通过 OpenClaw / PI 的 OpenAI Codex OAuth | 你希望通过默认 PI 运行器使用 ChatGPT / Codex 订阅认证。 |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | 你希望嵌入式智能体轮次使用原生 Codex app-server 执行。 |

GPT-5.5 目前在 OpenClaw 中仅支持订阅 / OAuth。请使用
`openai-codex/gpt-5.5` 用于 PI OAuth，或使用带 Codex
app-server harness 的 `openai/gpt-5.5`。
一旦 OpenAI 在公共 API 上启用 GPT-5.5，即支持对 `openai/gpt-5.5` 的直接 API key 访问。

旧版 `codex/gpt-*` 引用仍然作为兼容别名被接受。Doctor
兼容性迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略，而仅作为回退的旧版引用则保持不变，因为运行时是为整个智能体容器配置的。
新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生
app-server harness 配置应使用 `openai/gpt-*`，并搭配
`embeddedHarness.runtime: "codex"`。

`agents.defaults.imageModel` 也遵循相同的前缀划分。请使用
`openai-codex/gpt-*`，当图像理解应通过 OpenAI
Codex OAuth 提供商路径运行时。请使用 `codex/gpt-*`，当图像理解应通过
受限的 Codex app-server 轮次运行时。Codex app-server 模型必须
声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 确认当前会话的实际 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关的结构化 `agent harness selected` 记录。它
包含选中的 harness id、选择原因、运行时 / 回退策略，以及在
`auto` 模式下每个插件候选项的支持结果。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，
OpenClaw 会在该会话上记录所选 harness id，并在同一会话 id 的后续轮次中继续使用它。若你希望未来的会话使用其他 harness，请更改 `embeddedHarness` 配置或
`OPENCLAW_AGENT_RUNTIME`；在将现有会话从 PI 切换到 Codex 之前，请使用 `/new` 或 `/reset` 启动新会话。
这样可以避免通过两套不兼容的原生会话系统重放同一份转录。

在 harness 固定机制引入之前创建的旧会话，一旦具有转录历史，就会被视为固定到 PI。更改配置后，如需让该会话切换到
Codex，请使用 `/new` 或 `/reset`。

`/status` 会显示实际的模型运行时。默认 PI harness 显示为
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，且可用内置的 `codex` 插件。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex 认证。

该插件会阻止较旧或无版本信息的 app-server 握手。
这样可以确保 OpenClaw 使用它已测试过的协议接口。

对于 live 和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，外加可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
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

将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>` 的旧版配置仍会自动启用内置 `codex` 插件。新配置应
优先使用 `openai/<model>`，并显式添加上述 `embeddedHarness` 条目。

## 添加 Codex 而不替换其他模型

当你希望旧版 `codex/*` 引用选择 Codex，而其他所有情况都使用
PI 时，请保留 `runtime: "auto"`。对于新配置，建议在应使用该 harness 的智能体上显式指定 `runtime: "codex"`。

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

在这种配置下：

- `/model gpt` 或 `/model openai/gpt-5.5` 会在此配置中使用 Codex app-server harness。
- `/model opus` 使用 Anthropic 提供商路径。
- 如果选择了非 Codex 模型，PI 仍然是兼容性 harness。

## 仅 Codex 部署

当你需要证明每个嵌入式智能体轮次
都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不会回退到 PI，因此
`fallback: "none"` 是可选的，但通常有助于作为文档说明：

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
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

强制使用 Codex 时，如果 Codex 插件被禁用、
app-server 版本过旧，或 app-server 无法启动，OpenClaw 会尽早失败。仅当你明确希望在缺失 harness 选择时由 PI 处理时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体使用 Codex

你可以让某个智能体仅使用 Codex，而默认智能体保持正常的
自动选择：

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

使用普通会话命令即可切换智能体和模型。`/new` 会创建一个新的
OpenClaw 会话，而 Codex harness 会根据需要创建或恢复其 sidecar app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，
并让下一轮再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果
发现失败或超时，它会使用内置的回退目录，包括：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

你可以通过 `plugins.entries.codex.config.discovery` 调整发现设置：

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

当你希望启动时避免探测 Codex 并固定使用
回退目录时，请禁用发现：

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

默认情况下，插件会通过以下命令在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是受信任的本地操作员姿态，用于
自主心跳：Codex 可以使用 shell 和网络工具，而无需停下来等待无人应答的原生审批提示。

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

Guardian 是原生 Codex 审批审核者。当 Codex 请求离开沙箱、在工作区外写入，或添加如网络访问之类的权限时，Codex 会将该审批请求路由给审核子智能体，而不是弹出人工提示。审核者会应用 Codex 的风险框架，并批准或拒绝该具体请求。如果你希望比 YOLO 模式有更多防护措施，但仍需要无人值守的智能体持续推进，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"` 和 `sandbox: "workspace-write"`。单独的策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选择混合使用。

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

| 字段 | 默认值 | 含义 |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport` | `"stdio"` | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command` | `"codex"` | `stdio` 传输使用的可执行文件。 |
| `args` | `["app-server", "--listen", "stdio://"]` | `stdio` 传输的参数。 |
| `url` | unset | WebSocket app-server URL。 |
| `authToken` | unset | WebSocket 传输的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket 标头。 |
| `requestTimeoutMs` | `60000` | app-server 控制平面调用的超时时间。 |
| `mode` | `"yolo"` | 用于 YOLO 或 guardian 审核执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程启动 / 恢复 / 轮次的原生 Codex 审批策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程启动 / 恢复的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"guardian_subagent"` 可让 Codex Guardian 审核提示。 |
| `serviceTier` | unset | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。 |

较旧的环境变量在匹配的配置字段未设置时，仍可作为本地测试的回退：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 进行一次性本地测试。对于可重复部署，
更推荐使用配置，因为这样可以将插件行为与 Codex harness 其余设置保存在同一个经过审查的文件中。

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

仅 Codex harness 验证，禁用 PI 回退：

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

模型切换仍由 OpenClaw 控制。当 OpenClaw 会话附加到现有 Codex 线程时，下一轮会再次将当前选定的
OpenAI 模型、提供商、审批策略、沙箱和服务层级发送给
app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 时会保留
线程绑定，但会要求 Codex 使用新选定的模型继续。

## Codex 命令

内置插件将 `/codex` 注册为已授权斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道上运行。

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

`/codex resume` 会写入与 harness 正常轮次
使用的同一个 sidecar 绑定文件。在下一条消息时，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入 app-server，并保持扩展历史记录
处于启用状态。

该命令界面需要 Codex app-server `0.118.0` 或更高版本。如果未来或自定义 app-server 未暴露某个 JSON-RPC 方法，
各个控制方法会报告为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| 层级 | 所有者 | 用途 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子 | OpenClaw | 在 PI 和 Codex harness 之间提供产品 / 插件兼容性。 |
| Codex app-server 扩展中间件 | OpenClaw 内置插件 | 围绕 OpenClaw 动态工具的每轮适配器行为。 |
| Codex 原生钩子 | Codex | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。 |

OpenClaw 不使用项目级或全局 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。Codex 原生钩子适用于由 Codex 管理的
操作，例如 shell 策略、原生工具结果审查、停止处理，以及
原生压缩 / 模型生命周期，但它们不是 OpenClaw 插件 API。

对于 OpenClaw 动态工具，在 Codex 请求调用之后，OpenClaw 才执行该工具，因此 OpenClaw 会在
harness 适配器中触发其拥有的插件和中间件行为。对于 Codex 原生工具，Codex 持有规范工具记录。
OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子
回调暴露该操作，否则它无法重写原生 Codex
线程。

当较新的 Codex app-server 构建暴露原生压缩和模型生命周期
钩子事件时，OpenClaw 应对该协议支持进行版本门控，并在语义真实的前提下将这些事件映射到现有 OpenClaw 钩子契约中。
在此之前，OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件属于适配器层观察结果，而不是对 Codex 内部请求或压缩负载的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投射为 `codex_app_server.hook` 智能体事件，用于轨迹和调试。
它们不会调用 OpenClaw 插件钩子。

## 工具、媒体与压缩

Codex harness 只改变底层嵌入式智能体执行器。

OpenClaw 仍会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批和消息工具输出
仍通过常规 OpenClaw 投递路径处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批征询会通过 OpenClaw 的插件
审批流进行路由。Codex `request_user_input` 提示会发回原始聊天，
而下一条排队的后续消息会响应该原生
服务器请求，而不是被作为额外上下文引导。其他 MCP 征询请求仍然会默认拒绝。

当选中的模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换。该镜像
包含用户提示、最终助手文本，以及在 app-server 发出时的轻量级 Codex
推理或计划记录。目前，OpenClaw 仅记录原生压缩开始和完成信号。它尚未公开
人类可读的压缩摘要，也未提供 Codex 在压缩后保留了哪些条目的可审计列表。

由于 Codex 持有规范原生线程，`tool_result_persist` 当前不会
重写 Codex 原生工具结果记录。它仅在
OpenClaw 写入由 OpenClaw 管理的会话转录工具结果时生效。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体
理解仍继续使用匹配的提供商 / 模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和
`messages.tts`。

## 故障排除

**`/model` 中没有出现 Codex：** 启用 `plugins.entries.codex.enabled`，
选择带有 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-*` 模型（或
旧版 `codex/*` 引用），并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用了 PI 而不是 Codex：** `runtime: "auto"` 在没有 Codex harness 认领该运行时，
仍可能使用 PI 作为兼容性后端。测试时请设置
`embeddedHarness.runtime: "codex"` 以强制选择 Codex。现在，强制使用 Codex 运行时会直接失败，而不是回退到 PI，除非你
显式设置 `embeddedHarness.fallback: "pi"`。一旦选中了 Codex app-server，
其失败会直接暴露出来，而不会有额外的回退配置。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手
报告版本 `0.118.0` 或更高。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，
以及远程 app-server 是否使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用了 PI：** 这是预期行为，除非你强制设置了
`embeddedHarness.runtime: "codex"`（或选择了旧版 `codex/*` 引用）。普通
`openai/gpt-*` 和其他提供商引用会保留在它们正常的提供商路径上。

## 相关内容

- [智能体 Harness 插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
