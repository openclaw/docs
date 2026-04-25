---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在无法使用时直接失败，而不是回退到 PI
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体回合
title: Codex harness
x-i18n:
    generated_at: "2026-04-25T01:51:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf0292de4a3e189bb96f02dfeaa42df6e4b1b24cf335cbb83f8821d33585cb5b
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 可以通过 Codex app-server 而不是内置的 PI harness 来运行嵌入式智能体回合。

当你希望由 Codex 接管底层智能体会话时，请使用此功能：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

如果你正在了解整体结构，请先从 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。简要来说：`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍然是通信界面。

原生 Codex 回合会将 OpenClaw 插件钩子保留为公开兼容层。这些是进程内的 OpenClaw 钩子，不是 Codex `hooks.json` 命令钩子：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- 用于镜像转录记录的 `before_message_write`
- `agent_end`

插件还可以注册与运行时无关的工具结果中间件，在 OpenClaw 执行工具之后、结果返回给 Codex 之前，重写 OpenClaw 动态工具结果。这与公开的 `tool_result_persist` 插件钩子不同，后者用于转换由 OpenClaw 管理的转录工具结果写入。

该 harness 默认关闭。新配置应保持 OpenAI 模型引用使用规范形式 `openai/gpt-*`，并在需要原生 app-server 执行时显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用仍会为了兼容性自动选择该 harness，但由运行时支持的旧版 provider 前缀不会显示为常规模型 / 提供商选项。

## 选择正确的模型前缀

OpenAI 系列路由对前缀很敏感。当你想通过 PI 使用 Codex OAuth 时，请使用 `openai-codex/*`；当你想直接使用 OpenAI API，或你正在强制使用原生 Codex app-server harness 时，请使用 `openai/*`：

| Model ref                                             | Runtime path                                 | Use when                                                                  |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | 通过 OpenClaw / PI 管道的 OpenAI provider    | 你希望使用带有 `OPENAI_API_KEY` 的当前直接 OpenAI Platform API 访问。     |
| `openai-codex/gpt-5.5`                                | 通过 OpenClaw / PI 的 OpenAI Codex OAuth     | 你希望使用默认 PI 运行器的 ChatGPT / Codex 订阅认证。                     |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness                     | 你希望为嵌入式智能体回合使用原生 Codex app-server 执行。                  |

GPT-5.5 目前在 OpenClaw 中仅支持订阅 / OAuth。PI OAuth 请使用 `openai-codex/gpt-5.5`，或者将 `openai/gpt-5.5` 与 Codex app-server harness 搭配使用。一旦 OpenAI 在公共 API 上启用 GPT-5.5，就会支持通过 API key 直接访问 `openai/gpt-5.5`。

旧版 `codex/gpt-*` 引用仍然作为兼容别名被接受。Doctor 兼容性迁移会将旧版主运行时引用重写为规范模型引用，并单独记录运行时策略；而仅作为回退使用的旧版引用会保持不变，因为运行时是为整个智能体容器配置的。新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生 app-server harness 配置应使用 `openai/gpt-*`，再加上 `embeddedHarness.runtime: "codex"`。

`agents.defaults.imageModel` 也遵循相同的前缀划分。当图像理解应通过 OpenAI Codex OAuth provider 路径运行时，请使用 `openai-codex/gpt-*`。当图像理解应通过受限的 Codex app-server 回合运行时，请使用 `codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；仅文本的 Codex 模型会在媒体回合开始前失败。

使用 `/status` 确认当前会话的实际 harness。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关中的结构化 `agent harness selected` 记录。它包含所选 harness id、选择原因、运行时 / 回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

Harness 选择不是实时会话控制。当嵌入式回合运行时，OpenClaw 会在该会话上记录所选 harness id，并在同一会话 id 的后续回合中继续使用它。当你希望未来会话改用其他 harness 时，请修改 `embeddedHarness` 配置或 `OPENCLAW_AGENT_RUNTIME`；在现有对话于 PI 和 Codex 之间切换之前，请使用 `/new` 或 `/reset` 启动一个全新会话。这样可以避免同一份转录被两个不兼容的原生会话系统重复回放。

在引入 harness 固定之前创建的旧会话，一旦已有转录历史，就会被视为固定到 PI。更改配置后，请使用 `/new` 或 `/reset`，以便让该对话切换到 Codex。

`/status` 会显示实际的模型运行时。默认的 PI harness 显示为 `Runtime: OpenClaw Pi Default`，而 Codex app-server harness 显示为 `Runtime: OpenAI Codex`。

## 要求

- OpenClaw，且可用内置的 `codex` 插件。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex 认证。

该插件会阻止旧版本或未标注版本的 app-server 握手。这可确保 OpenClaw 始终使用它已测试过的协议接口。

对于 live 和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。请使用与你本地 Codex app-server 相同的认证材料。

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
  }
}
```

旧版配置如果将 `agents.defaults.model` 或某个智能体模型设为 `codex/<model>`，仍会自动启用内置的 `codex` 插件。新配置应优先使用 `openai/<model>`，再加上上面的显式 `embeddedHarness` 条目。

## 将 Codex 与其他模型一同使用

如果同一个智能体需要在 Codex 和非 Codex provider 模型之间自由切换，请不要全局设置 `runtime: "codex"`。强制运行时会作用于该智能体或会话的每一个嵌入式回合。如果你在该运行时被强制时选择了 Anthropic 模型，OpenClaw 仍会尝试使用 Codex harness，并以封闭失败的方式结束，而不是悄悄通过 PI 路由该回合。

请改用以下其中一种方式：

- 为 Codex 使用一个专用智能体，并设置 `embeddedHarness.runtime: "codex"`。
- 将默认智能体保持为 `runtime: "auto"`，并为正常的混合 provider 使用保留 PI 回退。
- 仅为兼容性使用旧版 `codex/*` 引用。新配置应优先使用 `openai/*`，再加上显式的 Codex 运行时策略。

例如，下面的配置会让默认智能体保持常规自动选择，并新增一个独立的 Codex 智能体：

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

使用这种形式时：

- 默认的 `main` 智能体使用常规 provider 路径和 PI 兼容性回退。
- `codex` 智能体使用 Codex app-server harness。
- 如果 `codex` 智能体缺少 Codex 或不受支持，该回合会失败，而不是悄悄改用 PI。

## 仅 Codex 部署

当你需要证明每一个嵌入式智能体回合都使用 Codex 时，请强制使用 Codex harness。显式插件运行时默认不使用 PI 回退，因此 `fallback: "none"` 是可选的，但通常有助于作为文档说明：

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

强制使用 Codex 后，如果 Codex 插件被禁用、app-server 版本过旧，或 app-server 无法启动，OpenClaw 会尽早失败。仅当你明确希望 PI 处理缺失的 harness 选择时，才设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 按智能体配置 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体仍保持正常自动选择：

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

使用常规会话命令来切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，而 Codex harness 会按需创建或恢复其 sidecar app-server 线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一回合再次根据当前配置解析 harness。

## 模型发现

默认情况下，`codex` 插件会向 app-server 查询可用模型。如果发现失败或超时，它会使用内置的回退目录，适用于：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

你可以在 `plugins.entries.codex.config.discovery` 下调整发现配置：

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

## App-server 连接与策略

默认情况下，插件会在本地通过以下命令启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex harness 会话：`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及 `sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停在无人可回答的原生审批提示上。

若要选择启用由 Codex Guardian 审核的审批，请设置 `appServer.mode: "guardian"`：

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

Guardian 是原生的 Codex 审批审查器。当 Codex 请求离开沙箱、在工作区外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给一个审查子智能体，而不是向人工发出提示。该审查器会应用 Codex 的风险框架，并批准或拒绝该特定请求。如果你希望比 YOLO 模式有更多防护措施，同时仍需要无人值守的智能体持续推进，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"` 和 `sandbox: "workspace-write"`。单独的策略字段仍会覆盖 `mode`，因此高级部署可以将该预设与显式选项混合使用。

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

| Field               | Default                                  | Meaning                                                                 |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                  |
| `command`           | `"codex"`                                | 用于 stdio 传输的可执行文件。                                           |
| `args`              | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。                                                 |
| `url`               | unset                                    | WebSocket app-server URL。                                              |
| `authToken`         | unset                                    | 用于 WebSocket 传输的 Bearer token。                                    |
| `headers`           | `{}`                                     | 额外的 WebSocket 请求头。                                               |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                     |
| `mode`              | `"yolo"`                                 | 用于 YOLO 或 guardian 审核执行的预设。                                  |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动 / 恢复 / 回合的原生 Codex 审批策略。                     |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动 / 恢复的原生 Codex 沙箱模式。                            |
| `approvalsReviewer` | `"user"`                                 | 使用 `"guardian_subagent"` 让 Codex Guardian 审核提示。                 |
| `serviceTier`       | unset                                    | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧值会被忽略。 |

较早的环境变量在对应配置字段未设置时，仍可作为本地测试的回退方式使用：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复的部署，优先使用配置，因为这样可以将插件行为与 Codex harness 其余设置一起保存在同一个经过审查的文件中。

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

仅 Codex harness 验证：

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

模型切换仍由 OpenClaw 控制。当一个 OpenClaw 会话附加到现有的 Codex 线程时，下一回合会再次将当前所选的 OpenAI 模型、provider、审批策略、沙箱和服务层级发送给 app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 继续使用新选择的模型。

## Codex 命令

内置插件将 `/codex` 注册为一个已授权的斜杠命令。它是通用的，可在任何支持 OpenClaw 文本命令的渠道中使用。

常见形式：

- `/codex status` 显示实时 app-server 连接性、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有的 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 启动已附加线程的 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与 harness 正常回合所使用的相同 sidecar 绑定文件。下一条消息到来时，OpenClaw 会恢复该 Codex 线程，将当前所选的 OpenClaw 模型传入 app-server，并保持扩展历史已启用。

该命令界面要求 Codex app-server `0.118.0` 或更高版本。如果未来版本或自定义 app-server 未暴露某个 JSON-RPC 方法，则单个控制方法会显示为 `unsupported by this Codex app-server`。

## 钩子边界

Codex harness 有三层钩子：

| Layer                                 | Owner                    | Purpose                                                       |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| OpenClaw plugin hooks                 | OpenClaw                 | 在 PI 和 Codex harness 之间提供产品 / 插件兼容性。            |
| Codex app-server extension middleware | OpenClaw bundled plugins | 围绕 OpenClaw 动态工具的每回合适配器行为。                    |
| Codex native hooks                    | Codex                    | 来自 Codex 配置的底层 Codex 生命周期和原生工具策略。          |

OpenClaw 不使用项目级或全局 Codex `hooks.json` 文件来路由 OpenClaw 插件行为。Codex 原生钩子对于由 Codex 管理的操作很有用，例如 shell 策略、原生工具结果审查、停止处理以及原生压缩 / 模型生命周期，但它们不是 OpenClaw 插件 API。

对于 OpenClaw 动态工具，Codex 发起调用请求后，OpenClaw 会执行该工具，因此 OpenClaw 会在 harness 适配器中触发它所管理的插件和中间件行为。对于 Codex 原生工具，Codex 拥有规范的工具记录。OpenClaw 可以镜像部分事件，但除非 Codex 通过 app-server 或原生钩子回调暴露该操作，否则它无法重写原生 Codex 线程。

当更新的 Codex app-server 版本暴露出原生压缩和模型生命周期钩子事件时，OpenClaw 应对该协议支持进行版本门控，并在语义真实的前提下，将这些事件映射到现有 OpenClaw 钩子契约中。在此之前，OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件都属于适配器级观察，而不是对 Codex 内部请求或压缩负载的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知会被投影为 `codex_app_server.hook` 智能体事件，用于轨迹记录和调试。它们不会调用 OpenClaw 插件钩子。

## V1 支持契约

Codex 模式并不是“底层只是换了模型调用的 PI”。Codex 接管了更多原生模型循环，而 OpenClaw 会围绕这一边界适配其插件和会话界面。

Codex runtime v1 中支持的内容：

| Surface                                 | Support                           | Why                                                                                                                               |
| --------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环           | 支持                              | Codex app-server 负责 OpenAI 回合、原生线程恢复和原生工具续接。                                                                   |
| OpenClaw 渠道路由与传递                 | 支持                              | Telegram、Discord、Slack、WhatsApp、iMessage 以及其他渠道仍位于模型运行时之外。                                                   |
| OpenClaw 动态工具                       | 支持                              | Codex 会请求 OpenClaw 执行这些工具，因此 OpenClaw 仍在执行路径中。                                                                |
| 提示词和上下文插件                      | 支持                              | OpenClaw 会在启动或恢复线程之前构建提示词覆盖层，并将上下文投射到 Codex 回合中。                                                 |
| 上下文引擎生命周期                      | 支持                              | 组装、摄取或回合后维护，以及上下文引擎压缩协调，都会在 Codex 回合中运行。                                                         |
| 动态工具钩子                            | 支持                              | `before_tool_call`、`after_tool_call` 和工具结果中间件会围绕由 OpenClaw 管理的动态工具运行。                                     |
| 生命周期钩子                            | 以适配器观察形式支持              | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 会以真实的 Codex 模式负载触发。               |
| 原生 shell 和 patch 的阻止或观察        | 通过原生钩子转发支持              | 对受支持的 Codex 原生工具，会转发 Codex `PreToolUse` 和 `PostToolUse`。支持阻止，不支持参数重写。                                |
| 原生权限策略                            | 通过原生钩子转发支持              | 当运行时暴露该能力时，Codex `PermissionRequest` 可以通过 OpenClaw 策略进行路由。                                                  |
| App-server 轨迹捕获                     | 支持                              | OpenClaw 会记录它发送给 app-server 的请求，以及它收到的 app-server 通知。                                                         |

Codex runtime v1 中不支持的内容：

| Surface                                             | V1 Boundary                                                                                                                         | Future Path                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 原生工具参数修改                                    | Codex 原生预工具钩子可以阻止执行，但 OpenClaw 不会重写 Codex 原生工具参数。                                                         | 需要 Codex 钩子 / schema 支持替换后的工具输入。                            |
| 可编辑的 Codex 原生转录历史                         | Codex 拥有规范的原生线程历史。OpenClaw 拥有镜像，并可投射未来上下文，但不应修改不受支持的内部实现。                               | 如果需要原生线程手术操作，应添加显式的 Codex app-server API。             |
| 用于 Codex 原生工具记录的 `tool_result_persist`     | 该钩子转换的是由 OpenClaw 管理的转录写入，而不是 Codex 原生工具记录。                                                              | 可以镜像转换后的记录，但规范重写需要 Codex 支持。                          |
| 丰富的原生压缩元数据                                | OpenClaw 可观察到压缩开始和完成，但不会收到稳定的保留 / 丢弃列表、token 增量或摘要负载。                                          | 需要更丰富的 Codex 压缩事件。                                              |
| 压缩干预                                            | 当前 OpenClaw 的压缩钩子在 Codex 模式下属于通知级别。                                                                              | 如果插件需要否决或重写原生压缩，应添加 Codex 压缩前 / 后钩子。            |
| 停止或最终答案门控                                  | Codex 具有原生停止钩子，但 OpenClaw 未将最终答案门控公开为 v1 插件契约。                                                           | 未来可提供带循环和超时保护的可选启用原语。                                 |
| 原生 MCP 钩子一致性                                 | Codex 拥有 MCP 执行，而完整的前 / 后钩子负载一致性取决于 Codex MCP 处理器支持。                                                    | 添加 Codex MCP 钩子负载，然后通过相同的原生钩子路径转发它们。             |
| 逐字节模型 API 请求捕获                             | OpenClaw 可以捕获 app-server 请求和通知，但最终的 OpenAI API 请求由 Codex 核心在内部构建。                                        | 需要 Codex 模型请求跟踪事件或调试 API。                                    |

## 工具、媒体和压缩

Codex harness 只改变底层嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从 harness 接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，都会继续通过正常的 OpenClaw 传递路径处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批征求会通过 OpenClaw 的插件审批流程进行路由。Codex `request_user_input` 提示会被发送回发起的聊天，而下一个排队的后续消息会用于回答该原生服务器请求，而不是作为额外上下文被引导。其他 MCP 征求请求仍然会以封闭失败的方式处理。

当所选模型使用 Codex harness 时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换。该镜像包括用户提示、最终助手文本，以及当 app-server 发出这些记录时的轻量级 Codex 推理或计划记录。目前，OpenClaw 仅记录原生压缩开始和完成信号。它尚未公开人类可读的压缩摘要，也未提供 Codex 在压缩后保留了哪些条目的可审计列表。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 当前不会重写 Codex 原生工具结果记录。它仅在 OpenClaw 写入由 OpenClaw 管理的会话转录工具结果时生效。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解会继续使用相应的 provider / 模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中未出现 Codex：** 启用 `plugins.entries.codex.enabled`，选择带有 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用的是 PI 而不是 Codex：** 当没有 Codex harness 声明该运行时，`runtime: "auto"` 仍可能使用 PI 作为兼容性后端。测试时请设置 `embeddedHarness.runtime: "codex"` 以强制选择 Codex。强制的 Codex 运行时现在会直接失败，而不是回退到 PI，除非你显式设置 `embeddedHarness.fallback: "pi"`。一旦选择了 Codex app-server，其失败会直接暴露出来，而不会有额外的回退配置。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手报告版本 `0.118.0` 或更高。

**模型发现过慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，并确认远程 app-server 使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 PI：** 这是预期行为，除非你为该智能体强制设置了 `embeddedHarness.runtime: "codex"`，或选择了旧版 `codex/*` 引用。普通的 `openai/gpt-*` 和其他 provider 引用在 `auto` 模式下会保持其正常的 provider 路径。如果你强制设置 `runtime: "codex"`，则该智能体的每一个嵌入式回合都必须是受 Codex 支持的 OpenAI 模型。

## 相关内容

- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [Model Providers](/zh-CN/concepts/model-providers)
- [Configuration Reference](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
