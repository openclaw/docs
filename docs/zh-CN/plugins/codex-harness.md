---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在无法使用时直接失败，而不是回退到 PI
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-04-26T00:28:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d7bf0c337d5e2a9a5af43e7487859205b5f1ed297f78143d937c530bbbbb71a
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 能够通过 Codex app-server，而不是内置的 PI harness，来运行嵌入式智能体轮次。

当你希望 Codex 接管底层智能体会话时，请使用此方式：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。
OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体投递，以及可见的转录镜像。

如果你正在了解整体结构，请先阅读
[Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简要来说：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、
Discord、Slack 或其他渠道仍然是通信界面。

同一个插件也负责原生 `/codex` 聊天控制命令界面。如果
插件已启用，并且用户要求在聊天中绑定、恢复、引导、停止或检查
Codex 线程，智能体应优先使用 `/codex ...`，而不是 ACP。当用户明确要求使用 ACP/acpx，或正在测试 ACP
Codex 适配器时，ACP 仍然是显式的回退方案。

原生 Codex 轮次会将 OpenClaw 插件钩子作为公共兼容层保留。
这些是进程内的 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`，用于镜像转录记录
- `before_agent_finalize`，通过 Codex `Stop` 中继
- `agent_end`

插件还可以注册与运行时无关的工具结果中间件，在 OpenClaw 执行工具之后、并在结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公共
`tool_result_persist` 插件钩子不同，后者用于转换由 OpenClaw 持有的转录工具结果写入。

有关插件钩子语义本身，请参见 [Plugin hooks](/zh-CN/plugins/hooks)
和 [Plugin guard behavior](/zh-CN/tools/plugin)。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用的规范形式为
`openai/gpt-*`，并在需要原生 app-server 执行时显式强制设置
`embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。
旧版 `codex/*` 模型引用仍会为兼容性自动选择该 harness，但由运行时支持的旧版 provider 前缀不会显示为普通的模型/提供商选项。

## 选择正确的模型前缀

OpenAI 系列路由对前缀非常敏感。当你希望通过 PI 使用
Codex OAuth 时，请使用 `openai-codex/*`；当你希望直接使用 OpenAI API，或在强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| Model ref                                             | Runtime path                           | Use when                                                                  |
| ----------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | 通过 OpenClaw/PI 管线的 OpenAI provider | 你希望使用带有 `OPENAI_API_KEY` 的当前直接 OpenAI Platform API 访问。 |
| `openai-codex/gpt-5.5`                                | 通过 OpenClaw/PI 的 OpenAI Codex OAuth | 你希望在默认 PI 运行器中使用 ChatGPT/Codex 订阅认证。      |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness               | 你希望为嵌入式智能体轮次使用原生 Codex app-server 执行。   |

在 OpenClaw 中，GPT-5.5 当前仅支持订阅/OAuth。
对于 PI OAuth，请使用 `openai-codex/gpt-5.5`；对于 Codex
app-server harness，请使用 `openai/gpt-5.5`。一旦 OpenAI 在公开 API 上启用 GPT-5.5，
就会支持通过 API key 直接访问 `openai/gpt-5.5`。

旧版 `codex/gpt-*` 引用仍然被接受为兼容别名。Doctor
兼容性迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略；而仅用于回退的旧版引用则保持不变，因为运行时是为整个智能体容器配置的。
新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生
app-server harness 配置应使用 `openai/gpt-*`，再加上
`embeddedHarness.runtime: "codex"`。

`agents.defaults.imageModel` 也遵循相同的前缀划分。当图像理解应通过
OpenAI Codex OAuth provider 路径运行时，请使用
`openai-codex/gpt-*`。当图像理解应通过受限的 Codex app-server 轮次运行时，请使用
`codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；仅文本的 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 来确认当前会话的实际 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 gateway 的结构化 `agent harness selected` 记录。它包含已选择的 harness id、选择原因、运行时/回退策略，以及在
`auto` 模式下每个插件候选项的支持结果。

Harness 选择不是实时会话控制。当嵌入式轮次运行时，
OpenClaw 会在该会话上记录所选的 harness id，并在同一个会话 id 的后续轮次中继续使用它。当你希望未来的会话使用其他 harness 时，请更改 `embeddedHarness` 配置或
`OPENCLAW_AGENT_RUNTIME`；在将现有对话在 PI 和 Codex 之间切换之前，请使用 `/new` 或 `/reset` 启动一个新的会话。
这样可以避免将同一份转录回放到两个互不兼容的原生会话系统中。

在 harness 固定机制引入之前创建的旧会话，只要已有转录历史，就会被视为固定到 PI。更改配置后，如需让该对话切换到
Codex，请使用 `/new` 或 `/reset`。

`/status` 会显示实际的模型运行时。默认的 PI harness 会显示为
`Runtime: OpenClaw Pi Default`，而 Codex app-server harness 会显示为
`Runtime: OpenAI Codex`。

## 要求

- OpenClaw，且内置的 `codex` 插件可用。
- Codex app-server `0.125.0` 或更高版本。内置插件默认会管理一个兼容的
  Codex app-server 二进制文件，因此本地 `PATH` 中的 `codex` 命令不会影响正常的 harness 启动。
- app-server 进程可用的 Codex 认证。

该插件会阻止较旧或未带版本信息的 app-server 握手。
这样可以确保 OpenClaw 始终运行在它已测试过的协议接口上。

对于 live 和 Docker smoke 测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和
`~/.codex/config.toml`。请使用与你本地 Codex app-server
相同的认证材料。

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

将 `agents.defaults.model` 或某个智能体模型设置为
`codex/<model>` 的旧配置，仍会自动启用内置的 `codex` 插件。新配置应优先使用
`openai/<model>`，并加上上面的显式 `embeddedHarness` 条目。

## 将 Codex 与其他模型一起使用

如果同一个智能体需要在 Codex 和非 Codex provider 模型之间自由切换，请不要全局设置
`runtime: "codex"`。
强制运行时会应用到该智能体或会话的每一次嵌入式轮次。如果你在强制该运行时的情况下选择了 Anthropic 模型，
OpenClaw 仍会尝试使用 Codex harness，并以关闭式失败，而不是悄悄通过 PI 路由该轮次。

请改用以下任一种方式：

- 将 Codex 放到一个专用智能体上，并设置 `embeddedHarness.runtime: "codex"`。
- 将默认智能体保持在 `runtime: "auto"`，并为常规混合 provider 使用保留 PI 回退。
- 仅将旧版 `codex/*` 引用用于兼容性。新配置应优先使用
  `openai/*`，并显式设置 Codex 运行时策略。

例如，下面的配置会让默认智能体保持普通的自动选择，同时新增一个独立的 Codex 智能体：

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
        },
      },
    ],
  },
}
```

在这种配置下：

- 默认的 `main` 智能体使用普通 provider 路径和 PI 兼容性回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或 Codex 不受支持，该轮次会失败，
  而不是悄悄改用 PI。

## 仅使用 Codex 的部署

当你需要证明每一个嵌入式智能体轮次都使用 Codex 时，请强制使用
Codex harness。显式插件运行时默认不使用 PI 回退，因此
`fallback: "none"` 是可选的，但通常作为文档说明很有用：

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

在强制使用 Codex 时，如果 Codex 插件被禁用、app-server 版本过旧，或
app-server 无法启动，OpenClaw 会提前失败。只有当你明确希望在缺少 harness 选择时由 PI 处理时，才设置
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体启用 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体保持正常的
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

使用正常的会话命令来切换智能体和模型。`/new` 会创建一个新的
OpenClaw 会话，而 Codex harness 会根据需要创建或恢复其 sidecar app-server
线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮再次根据当前配置解析 harness。

## 模型发现

默认情况下，Codex 插件会向 app-server 查询可用模型。如果
发现失败或超时，它会使用内置的回退目录，其中包括：

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

## App-server 连接与策略

默认情况下，插件会在本地启动由 OpenClaw 管理的 Codex 二进制文件，命令如下：

```bash
codex app-server --listen stdio://
```

该受管二进制文件被声明为内置插件运行时依赖，并与 `codex` 插件的其他依赖一起进行准备。
这样可以让 app-server 版本与内置插件绑定，而不是取决于本地单独安装的是哪个 Codex CLI。
只有当你明确希望运行不同的可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：
`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及
`sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停在原生审批提示上等待无人响应。

若要启用由 Codex guardian 审核的审批，请设置 `appServer.mode:
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

Guardian 模式使用 Codex 的原生自动审核审批路径。当 Codex 请求离开沙箱、写入工作区之外，或添加网络访问等权限时，Codex 会将该审批请求路由给原生审核器，而不是提示人工处理。审核器会应用 Codex 的风险框架，并批准或拒绝该具体请求。当你希望比 YOLO 模式有更多防护栏，同时仍需要无人值守的智能体持续推进时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"`，以及 `sandbox: "workspace-write"`。
各个策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选择混合使用。较旧的 `guardian_subagent` 审核器取值仍作为兼容别名被接受，但新配置应使用
`auto_review`。

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

| Field               | Default                                  | Meaning                                                                                                      |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                     |
| `command`           | 受管 Codex 二进制文件                    | 用于 stdio 传输的可执行文件。留空时使用受管二进制文件；仅在需要显式覆盖时设置。 |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                                               |
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                    |
| `authToken`         | 未设置                                   | 用于 WebSocket 传输的 Bearer token。                                                                        |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。                                                                                     |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                  |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 审核执行的预设。                                                              |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。                                               |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动/恢复的原生 Codex 沙箱模式。                                                       |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审核原生审批提示。`guardian_subagent` 仍然是旧版别名。 |
| `serviceTier`       | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧版取值会被忽略。    |

环境变量覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过受管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试时使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复的部署，优先使用配置，因为它会将插件行为与 Codex harness 其余设置保存在同一个经过审查的文件中。

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

仅使用 Codex 的 harness 验证：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
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
            approvalsReviewer: "auto_review",
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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有的
Codex 线程时，下一轮会再次将当前选定的
OpenAI 模型、提供商、审批策略、沙箱和服务层级发送到
app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选定的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用的，适用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有的 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加线程启动 Codex 原生审核。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 用于正常轮次相同的 sidecar 绑定文件。在下一条消息时，OpenClaw 会恢复该 Codex 线程，将当前选定的 OpenClaw 模型传入 app-server，并保持启用扩展历史记录。

该命令界面要求 Codex app-server `0.125.0` 或更高版本。如果未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，各个控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 具有三层钩子：

| Layer                                 | Owner                    | Purpose                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw 插件钩子                 | OpenClaw                 | 跨 PI 和 Codex harness 的产品/插件兼容性。         |
| Codex app-server 扩展中间件 | OpenClaw 内置插件 | 围绕 OpenClaw 动态工具的逐轮适配器行为。            |
| Codex 原生钩子                    | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。 |

OpenClaw 不使用项目级或全局 Codex `hooks.json` 文件来路由
OpenClaw 插件行为。对于受支持的原生工具和权限桥接，
OpenClaw 会为每个线程注入 Codex 配置，用于 `PreToolUse`、`PostToolUse`、
`PermissionRequest` 和 `Stop`。其他 Codex 钩子，如 `SessionStart` 和
`UserPromptSubmit`，仍然是 Codex 级别的控制；在 v1 合约中，它们不会暴露为
OpenClaw 插件钩子。

对于 OpenClaw 动态工具，OpenClaw 会在 Codex 发出调用请求后执行工具，因此 OpenClaw 会在 harness 适配器中触发它所拥有的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范工具记录。
OpenClaw 可以镜像选定事件，但除非 Codex 通过 app-server 或原生钩子回调暴露该操作，否则它无法改写原生 Codex 线程。

压缩和 LLM 生命周期投影来自 Codex app-server
通知以及 OpenClaw 适配器状态，而不是原生 Codex 钩子命令。
OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和
`llm_output` 事件是适配器级观察结果，并不是对
Codex 内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为
`codex_app_server.hook` 智能体事件，用于轨迹和调试。
它们不会调用 OpenClaw 插件钩子。

## V1 支持合约

Codex 模式并不是在底层换了一次模型调用的 PI。Codex 接管了更多原生模型循环，而 OpenClaw 会围绕这一边界调整其插件和会话界面。

在 Codex runtime v1 中支持：

| Surface                                       | Support                           | Why                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环               | 支持                              | Codex app-server 负责 OpenAI 轮次、原生线程恢复，以及原生工具续接。                                                                                                            |
| OpenClaw 渠道路由与投递         | 支持                              | Telegram、Discord、Slack、WhatsApp、iMessage 以及其他渠道都保持在模型运行时之外。                                                                                                      |
| OpenClaw 动态工具                        | 支持                              | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍然位于执行路径中。                                                                                                                  |
| 提示词与上下文插件                    | 支持                              | OpenClaw 会在启动或恢复线程之前构建提示词叠加层，并将上下文投射到 Codex 轮次中。                                                                                      |
| 上下文引擎生命周期                      | 支持                              | 组装、摄取或轮次后的维护，以及上下文引擎压缩协调，都会为 Codex 轮次运行。                                                                                           |
| 动态工具钩子                            | 支持                              | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕由 OpenClaw 持有的动态工具运行。                                                                                            |
| 生命周期钩子                               | 作为适配器观察结果提供支持       | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式载荷触发。                                                                             |
| 最终答案修订关卡                    | 通过原生钩子中继提供支持 | Codex `Stop` 会中继到 `before_agent_finalize`；`revise` 会在最终完成前要求 Codex 再进行一次模型传递。                                                                                  |
| 原生 shell、patch 和 MCP 的阻止或观察 | 通过原生钩子中继提供支持 | 对于已承诺的原生工具表面，包括 Codex app-server `0.125.0` 或更高版本中的 MCP 载荷，Codex `PreToolUse` 和 `PostToolUse` 都会被中继。支持阻止；不支持参数重写。 |
| 原生权限策略                      | 通过原生钩子中继提供支持 | 在运行时暴露该能力时，Codex `PermissionRequest` 可以通过 OpenClaw 策略进行路由。如果 OpenClaw 不返回决定，Codex 会继续走它正常的 guardian 或用户审批路径。     |
| App-server 轨迹捕获                 | 支持                              | OpenClaw 会记录它发送到 app-server 的请求，以及它接收到的 app-server 通知。                                                                                                      |

在 Codex runtime v1 中不支持：

| Surface                                             | V1 边界                                                                                                                                     | 未来路径                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 原生工具参数变更                       | Codex 原生 pre-tool 钩子可以阻止调用，但 OpenClaw 不会重写 Codex 原生工具参数。                                               | 这需要 Codex 钩子/schema 支持替换后的工具输入。                            |
| 可编辑的 Codex 原生转录历史            | Codex 拥有规范的原生线程历史。OpenClaw 拥有一个镜像，并且可以投射未来上下文，但不应修改不受支持的内部结构。 | 如果需要对原生线程进行修改，应添加显式的 Codex app-server API。                    |
| 用于 Codex 原生工具记录的 `tool_result_persist` | 该钩子转换的是由 OpenClaw 持有的转录写入，而不是 Codex 原生工具记录。                                                           | 可以镜像转换后的记录，但规范性重写仍需要 Codex 支持。              |
| 丰富的原生压缩元数据                     | OpenClaw 可以观察到压缩开始和完成，但不会接收到稳定的保留/丢弃列表、token 变化量或摘要载荷。            | 这需要更丰富的 Codex 压缩事件。                                                     |
| 压缩干预                             | 当前 OpenClaw 压缩钩子在 Codex 模式下仅为通知级别。                                                                         | 如果插件需要否决或重写原生压缩，应添加 Codex 的 pre/post 压缩钩子。 |
| 逐字节的模型 API 请求捕获             | OpenClaw 可以捕获 app-server 请求和通知，但最终的 OpenAI API 请求由 Codex core 在内部构建。                      | 这需要 Codex 模型请求追踪事件或调试 API。                                   |

## 工具、媒体与压缩

Codex harness 只改变底层的嵌入式智能体执行器。

OpenClaw 仍然会构建工具列表，并从
harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出
仍然通过正常的 OpenClaw 投递路径继续工作。

原生钩子中继被有意设计为通用机制，但 v1 支持合约仅限于
OpenClaw 已测试的 Codex 原生工具和权限路径。在
Codex runtime 中，这包括 shell、patch 和 MCP `PreToolUse`、
`PostToolUse` 以及 `PermissionRequest` 载荷。在运行时合约明确命名前，
不要假设未来每一个 Codex 钩子事件都属于 OpenClaw 插件表面。

对于 `PermissionRequest`，只有当策略做出决定时，OpenClaw 才会返回明确的允许或拒绝决定。
“无决定”结果并不等于允许。Codex 会将其视为没有
钩子决定，并回退到它自己的 guardian 或用户审批路径。

当 Codex 将 `_meta.codex_approval_kind` 标记为
`"mcp_tool_call"` 时，Codex MCP 工具审批征求会通过 OpenClaw 的插件
审批流程进行路由。Codex `request_user_input` 提示会被发送回
原始聊天，而下一个排队的后续消息会回答该原生
服务器请求，而不是作为额外上下文进行引导。其他 MCP 征求请求仍然会以关闭式失败。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及将来的模型或 harness 切换。该镜像包括用户提示词、最终助手文本，以及 app-server 发出这些记录时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩的开始和完成信号。它尚未公开可供人类阅读的压缩摘要，也尚未提供一份可审计列表来说明 Codex 在压缩后保留了哪些条目。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前不会
重写 Codex 原生工具结果记录。它仅在
OpenClaw 正在写入由 OpenClaw 持有的会话转录工具结果时适用。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 以及媒体理解
仍会继续使用相应的 provider/模型设置，例如
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和
`messages.tts`。

## 故障排除

**Codex 没有显示为普通的 `/model` provider：** 对于
新配置，这是预期行为。请选择一个 `openai/gpt-*` 模型，并设置
`embeddedHarness.runtime: "codex"`（或使用旧版 `codex/*` 引用），启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用了 PI 而不是 Codex：** `runtime: "auto"` 在没有 Codex harness 声明接管该运行时，仍然可能使用 PI 作为
兼容性后端。测试时请设置
`embeddedHarness.runtime: "codex"` 以强制选择 Codex。
现在，除非你显式设置 `embeddedHarness.fallback: "pi"`，否则强制的 Codex 运行时会在失败时直接报错，而不是回退到 PI。一旦选中了 Codex app-server，其失败会直接暴露出来，不需要额外的回退配置。

**app-server 被拒绝：** 请升级 Codex，使 app-server 握手
报告版本 `0.125.0` 或更高。相同版本号的预发布版或带构建后缀的
版本，例如 `0.125.0-alpha.2` 或 `0.125.0+custom`，都会被拒绝，因为
OpenClaw 测试的是稳定版 `0.125.0` 协议下限。

**模型发现过慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`
或禁用发现。

**WebSocket 传输立即失败：** 请检查 `appServer.url`、`authToken`，
以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 除非你为该智能体强制设置了
`embeddedHarness.runtime: "codex"`，或选择了旧版
`codex/*` 引用，否则这是预期行为。普通的 `openai/gpt-*` 和其他 provider 引用在 `auto` 模式下会保持其正常的
provider 路径。如果你强制设置 `runtime: "codex"`，则该智能体的每一个嵌入式
轮次都必须使用受 Codex 支持的 OpenAI 模型。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Model providers](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Status](/zh-CN/cli/status)
- [Plugin hooks](/zh-CN/plugins/hooks)
- [Configuration reference](/zh-CN/gateway/configuration-reference)
- [Testing](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
