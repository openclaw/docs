---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅 Codex 的部署禁用 Pi 回退
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-24T04:06:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 095933d2c32df302c312c67fdc266d2f01b552dddb1607d6e4ecc4f3c3326acf
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件允许 OpenClaw 通过 Codex app-server 运行嵌入式智能体轮次，而不是使用内置的 Pi harness。

当你希望由 Codex 接管底层智能体会话时，请使用此方式：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体投递，以及可见的转录镜像。

原生 Codex 轮次会保留 OpenClaw 插件 hook 作为公开兼容层。
这些是进程内的 OpenClaw hook，而不是 Codex `hooks.json` 命令 hook：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- `agent_end`

内置插件还可以注册一个 Codex app-server 扩展工厂，以添加异步 `tool_result` 中间件。该中间件运行在 OpenClaw 动态工具之后：即 OpenClaw 执行完工具之后、结果返回给 Codex 之前。它与公开的 `tool_result_persist` 插件 hook 是分离的；后者会转换由 OpenClaw 拥有的转录工具结果写入。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用的规范形式为 `openai/gpt-*`，并在希望使用原生 app-server 执行时显式强制设置
`embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。为兼容性考虑，旧版 `codex/*` 模型引用仍会自动选择该 harness。

## 选择正确的模型前缀

OpenAI 系列路由是按前缀区分的。当你希望通过 Pi 使用 Codex OAuth 时，请使用 `openai-codex/*`；当你希望直接访问 OpenAI API，或你正在强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| Model ref | Runtime path | Use when |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4` | 通过 OpenClaw/Pi 管线的 OpenAI 提供商 | 你希望使用带有 `OPENAI_API_KEY` 的当前直接 OpenAI Platform API 访问。 |
| `openai-codex/gpt-5.5` | 通过 OpenClaw/Pi 的 OpenAI Codex OAuth | 你希望使用带默认 Pi 运行器的 ChatGPT/Codex 订阅认证。 |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | 你希望为嵌入式智能体轮次使用原生 Codex app-server 执行。 |

在 OpenClaw 中，GPT-5.5 当前仅支持订阅/OAuth。对于 Pi OAuth，请使用
`openai-codex/gpt-5.5`；对于 Codex app-server harness，请使用 `openai/gpt-5.5`。
一旦 OpenAI 在公共 API 上启用 GPT-5.5，就会支持对 `openai/gpt-5.5` 的直接 API key 访问。

旧版 `codex/gpt-*` 引用仍然接受，并作为兼容别名。新的 Pi Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生 app-server harness 配置应使用 `openai/gpt-*` 加上 `embeddedHarness.runtime:
"codex"`。

`agents.defaults.imageModel` 遵循同样的前缀拆分。若希望图像理解通过 OpenAI
Codex OAuth 提供商路径运行，请使用 `openai-codex/gpt-*`。若希望图像理解通过受限的 Codex app-server 轮次运行，请使用 `codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；纯文本 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 确认当前会话的实际 harness。如果选择结果出乎意料，请为
`agents/harness` 子系统启用调试日志，并检查 Gateway 网关的结构化
`agent harness selected` 记录。它包含所选 harness id、选择原因、运行时/回退策略，以及在 `auto` 模式下各个插件候选项的支持结果。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，OpenClaw 会在该会话上记录所选 harness id，并在同一会话 id 的后续轮次中继续使用它。当你希望未来会话使用另一个 harness 时，请更改 `embeddedHarness` 配置或
`OPENCLAW_AGENT_RUNTIME`；在已有对话在 Pi 和 Codex 之间切换前，请使用 `/new` 或 `/reset` 启动新会话。这样可以避免将同一份转录内容通过两个不兼容的原生会话系统重放。

在引入 harness 固定机制之前创建的旧会话，一旦拥有转录历史，就会被视为固定到 Pi。更改配置后，请使用 `/new` 或 `/reset` 将该对话切换到 Codex。

`/status` 会在 `Fast` 旁显示实际生效的非 Pi harness，例如
`Fast · codex`。默认的 Pi harness 仍显示为 `Runner: pi (embedded)`，不会额外添加单独的 harness 徽标。

## 要求

- OpenClaw，且内置 `codex` 插件可用。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex auth。

该插件会阻止旧版或无版本的 app-server 握手。这可确保
OpenClaw 使用它已经测试过的协议能力。

对于 live 和 Docker 冒烟测试，auth 通常来自 `OPENAI_API_KEY`，再加上可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
`~/.codex/config.toml`。请使用与你本地 Codex app-server 相同的 auth 材料。

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

如果你的配置使用 `plugins.allow`，也请在其中包含 `codex`：

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

仍将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>` 的旧版配置，依然会自动启用内置 `codex` 插件。新配置应优先使用 `openai/<model>` 加上上面的显式 `embeddedHarness` 条目。

## 在不替换其他模型的情况下添加 Codex

如果你希望旧版 `codex/*` 引用选择 Codex，而其他所有情况都使用 Pi，请保持 `runtime: "auto"`。对于新配置，优先在应使用该 harness 的智能体上显式设置 `runtime: "codex"`。

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

采用这种形式时：

- `/model gpt` 或 `/model openai/gpt-5.5` 会在此配置中使用 Codex app-server harness。
- `/model opus` 会使用 Anthropic 提供商路径。
- 如果选择的是非 Codex 模型，Pi 仍然是兼容性 harness。

## 仅 Codex 的部署

当你需要证明每个嵌入式智能体轮次都使用 Codex harness 时，请禁用 Pi 回退：

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

禁用回退后，如果 Codex 插件被禁用、app-server 版本过旧，或者
app-server 无法启动，OpenClaw 会尽早失败。

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

使用常规会话命令切换智能体和模型。`/new` 会创建一个新的
OpenClaw 会话，而 Codex harness 会根据需要创建或恢复其 sidecar app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮根据当前配置重新解析 harness。

## 模型发现

默认情况下，Codex 插件会请求 app-server 提供可用模型。如果发现失败或超时，它会使用一个内置回退目录，其中包括：

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

## App-server 连接和策略

默认情况下，插件会通过以下方式在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是受信任的本地操作员姿态，用于自治心跳：Codex 可以使用 shell 和网络工具，而不会停在无人响应的原生审批提示上。

若要选择加入由 Codex guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 是原生 Codex 审批审核器。当 Codex 请求离开沙箱、在工作区外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给审核子智能体，而不是向人类发出提示。审核器会应用 Codex 的风险框架，并批准或拒绝该特定请求。如果你希望比 YOLO 模式有更多防护，同时仍需要无人值守的智能体持续推进工作，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"`，以及 `sandbox: "workspace-write"`。单独的策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选择混用。

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

| Field | Default | Meaning |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport` | `"stdio"` | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command` | `"codex"` | 用于 stdio 传输的可执行文件。 |
| `args` | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。 |
| `url` | unset | WebSocket app-server URL。 |
| `authToken` | unset | 用于 WebSocket 传输的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket 头。 |
| `requestTimeoutMs` | `60000` | app-server 控制平面调用的超时时间。 |
| `mode` | `"yolo"` | YOLO 或 guardian 审核执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程启动/恢复的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"guardian_subagent"` 让 Codex Guardian 审核提示。 |
| `serviceTier` | unset | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版值会被忽略。 |

较旧的环境变量在对应配置字段未设置时，仍可作为本地测试的回退方式：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试时使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，因为这样可以将插件行为与 Codex harness 其余设置保存在同一个经过审阅的文件中。

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

禁用 Pi 回退的仅 Codex harness 验证：

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

带显式头的远程 app-server：

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

模型切换仍由 OpenClaw 控制。当某个 OpenClaw 会话附加到现有 Codex 线程时，下一轮会再次向 app-server 发送当前选定的
OpenAI 模型、提供商、审批策略、沙箱和服务层级。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会请求 Codex 继续使用新选定的模型。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用的，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连通性、模型、账号、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 启动已附加线程的 Codex 原生审查。
- `/codex account` 显示账号和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 正常轮次使用的同一个 sidecar 绑定文件。在下一条消息到来时，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入 app-server，并保持扩展历史启用。

该命令能力要求 Codex app-server `0.118.0` 或更高版本。如果未来或自定义 app-server 未暴露某个 JSON-RPC 方法，则单个控制方法会报告为 `unsupported by this Codex app-server`。

## Hook 边界

Codex harness 有三层 hook：

| Layer | Owner | Purpose |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件 hook | OpenClaw | 在 Pi 和 Codex harness 之间提供产品/插件兼容性。 |
| Codex app-server 扩展中间件 | OpenClaw 内置插件 | 在 OpenClaw 动态工具周围提供逐轮适配器行为。 |
| Codex 原生 hook | Codex | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。 |

OpenClaw 不使用项目级或全局 Codex `hooks.json` 文件来路由 OpenClaw 插件行为。Codex 原生 hook 对于由 Codex 拥有的操作很有用，例如 shell 策略、原生工具结果审查、停止处理，以及原生压缩/模型生命周期，但它们不是 OpenClaw 插件 API。

对于 OpenClaw 动态工具，Codex 发出调用请求后，OpenClaw 会执行该工具，因此 OpenClaw 会在 harness 适配器中触发它所拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范的工具记录。OpenClaw 可以镜像选定事件，但无法重写原生 Codex 线程，除非 Codex 通过 app-server 或原生 hook 回调暴露该操作。

当较新的 Codex app-server 构建暴露原生压缩和模型生命周期 hook 事件时，OpenClaw 应按版本门控该协议支持，并在语义真实的前提下，将这些事件映射到现有的 OpenClaw hook 契约中。在此之前，OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件都只是适配器层面的观察，而不是对 Codex 内部请求或压缩载荷的逐字节捕获。

## 工具、媒体和压缩

Codex harness 仅改变底层嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，仍然通过常规 OpenClaw 投递路径处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批请求会通过 OpenClaw 的插件审批流路由。Codex `request_user_input` 提示会被发送回原始聊天，下一条排队的后续消息将用于响应该原生服务器请求，而不是被引导为额外上下文。其他 MCP 请求仍然会以失败即关闭的方式失败。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。该镜像包括用户提示、最终助手文本，以及当 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 仅记录原生压缩开始和完成信号。它尚未公开人类可读的压缩摘要，也尚未提供 Codex 在压缩后保留了哪些条目的可审计列表。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它仅在 OpenClaw 正在写入由 OpenClaw 拥有的会话转录工具结果时生效。

媒体生成不依赖 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍继续使用对应的提供商/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和
`messages.tts`。

## 故障排除

**`/model` 中未出现 Codex：** 启用 `plugins.entries.codex.enabled`，
选择 `embeddedHarness.runtime: "codex"` 下的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用了 Pi 而不是 Codex：** 如果没有 Codex harness 声明该运行，
OpenClaw 可能会使用 Pi 作为兼容性后端。测试时请设置
`embeddedHarness.runtime: "codex"` 以强制选择 Codex，或设置
`embeddedHarness.fallback: "none"` 以在没有匹配插件 harness 时直接失败。一旦选中 Codex app-server，其失败会直接暴露出来，而不会再经过额外回退配置。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手报告版本
`0.118.0` 或更高。

**模型发现过慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程 app-server 是否使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用了 Pi：** 这是预期行为，除非你强制设置了
`embeddedHarness.runtime: "codex"`（或选择了旧版 `codex/*` 引用）。普通
`openai/gpt-*` 和其他提供商引用会继续走其正常提供商路径。

## 相关内容

- [Agent Harness Plugins](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
