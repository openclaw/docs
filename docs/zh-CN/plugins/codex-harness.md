---
read_when:
    - 你想使用内置的 Codex app-server 测试工具
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅使用 Codex 的部署禁用 Pi 回退机制
summary: 通过内置的 Codex app-server 测试工具运行 OpenClaw 嵌入式智能体轮次
title: Codex 测试工具
x-i18n:
    generated_at: "2026-04-24T02:42:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56024e68540007c60e2bfcc4d090a788736dc941290cd82ed83b19aadde942d
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件可让 OpenClaw 通过 Codex app-server 而不是内置的 Pi 测试工具来运行嵌入式智能体轮次。

当你希望由 Codex 接管底层智能体会话时，可使用此功能：模型发现、原生线程恢复、原生压缩，以及 app-server 执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传递，以及可见的转录镜像。

原生 Codex 轮次同样遵循共享的插件钩子，因此 prompt shim、压缩感知自动化、工具中间件和生命周期观察器都会与 Pi 测试工具保持一致：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

内置插件还可以注册 Codex app-server 扩展工厂，以添加异步 `tool_result` 中间件。

该测试工具默认关闭。新配置应保持 OpenAI 模型引用的规范形式为 `openai/gpt-*`，并在需要原生 app-server 执行时显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。出于兼容性考虑，旧版 `codex/*` 模型引用仍会自动选择该测试工具。

## 选择正确的模型前缀

OpenAI 系列路由对前缀有明确要求。当你希望通过 Pi 使用 Codex OAuth 时，使用 `openai-codex/*`；当你希望直接访问 OpenAI API，或强制使用原生 Codex app-server 测试工具时，使用 `openai/*`：

| 模型引用                                              | 运行时路径                                   | 适用场景                                                                  |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | 通过 OpenClaw/Pi 线路的 OpenAI 提供商路径    | 你希望使用 `OPENAI_API_KEY` 直接访问当前的 OpenAI Platform API。          |
| `openai-codex/gpt-5.5`                                | 通过 OpenClaw/Pi 的 OpenAI Codex OAuth 路径  | 你希望使用 ChatGPT/Codex 订阅凭证，并采用默认的 Pi 运行器。               |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server 测试工具                    | 你希望为嵌入式智能体轮次使用原生 Codex app-server 执行。                  |

在 OpenClaw 中，GPT-5.5 目前仅支持订阅 / OAuth。对于 Pi OAuth，使用 `openai-codex/gpt-5.5`；对于 Codex app-server 测试工具，使用 `openai/gpt-5.5`。一旦 OpenAI 在公共 API 上启用 GPT-5.5，`openai/gpt-5.5` 的直接 API key 访问也将受支持。

旧版 `codex/gpt-*` 引用仍接受为兼容性别名。新的 Pi Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生 app-server 测试工具配置应使用 `openai/gpt-*`，并配合 `embeddedHarness.runtime: "codex"`。

`agents.defaults.imageModel` 遵循相同的前缀区分。当图像理解应通过 OpenAI Codex OAuth 提供商路径运行时，使用 `openai-codex/gpt-*`。当图像理解应通过受限的 Codex app-server 轮次运行时，使用 `codex/gpt-*`。Codex app-server 模型必须声明支持图像输入；仅文本的 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 可确认当前会话的实际测试工具。如果选择结果出乎意料，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关中的结构化 `agent harness selected` 记录。它包含所选测试工具 id、选择原因、运行时 / 回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

测试工具选择不是实时会话控制。当嵌入式轮次运行时，OpenClaw 会把所选测试工具 id 记录到该会话上，并在同一会话 id 的后续轮次中继续使用它。当你希望未来的新会话使用其他测试工具时，请更改 `embeddedHarness` 配置或 `OPENCLAW_AGENT_RUNTIME`；在现有对话于 Pi 和 Codex 之间切换前，请使用 `/new` 或 `/reset` 启动一个全新的会话。这样可以避免将同一份转录内容通过两个不兼容的原生会话系统重复回放。

在测试工具固定机制引入之前创建的旧会话，一旦已有转录历史，就会被视为固定到 Pi。更改配置后，使用 `/new` 或 `/reset` 可让该对话改为使用 Codex。

`/status` 会在 `Fast` 旁显示实际生效的非 Pi 测试工具，例如 `Fast · codex`。默认的 Pi 测试工具仍显示为 `Runner: pi (embedded)`，不会额外添加单独的测试工具标记。

## 要求

- OpenClaw，且已提供内置的 `codex` 插件。
- Codex app-server `0.118.0` 或更高版本。
- app-server 进程可用的 Codex 认证信息。

该插件会阻止较旧版本或无版本信息的 app-server 握手。这可确保 OpenClaw 仅运行在已验证的协议接口之上。

对于实时和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，例如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。请使用与你本地 Codex app-server 相同的认证材料。

## 最小配置

使用 `openai/gpt-5.5`，启用内置插件，并强制使用 `codex` 测试工具：

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

如果你的配置使用 `plugins.allow`，也请在其中加入 `codex`：

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

旧配置如果将 `agents.defaults.model` 或某个智能体模型设为 `codex/<model>`，仍会自动启用内置 `codex` 插件。新配置应优先使用 `openai/<model>`，并配合上面的显式 `embeddedHarness` 配置项。

## 在不替换其他模型的情况下加入 Codex

如果你希望旧版 `codex/*` 引用选择 Codex，而其他一切仍使用 Pi，请保持 `runtime: "auto"`。对于新配置，建议仅在应使用该测试工具的智能体上显式设置 `runtime: "codex"`。

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

- `/model gpt` 或 `/model openai/gpt-5.5` 会为此配置使用 Codex app-server 测试工具。
- `/model opus` 使用 Anthropic 提供商路径。
- 如果选择了非 Codex 模型，Pi 仍然是兼容性测试工具。

## 仅使用 Codex 的部署

当你需要证明每一个嵌入式智能体轮次都使用 Codex 测试工具时，请禁用 Pi 回退：

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

禁用回退后，如果 Codex 插件被禁用、app-server 版本过旧，或 app-server 无法启动，OpenClaw 会提前失败。

## 按智能体使用 Codex

你可以让某一个智能体仅使用 Codex，而默认智能体仍保持普通的自动选择：

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

使用常规会话命令切换智能体和模型。`/new` 会创建一个全新的 OpenClaw 会话，而 Codex 测试工具会按需创建或恢复其旁路 app-server 线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一轮再次根据当前配置解析测试工具。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。如果发现失败或超时，它会使用内置的后备目录，其中包括：

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

如果你希望启动时避免探测 Codex 并固定使用后备目录，可禁用发现：

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

默认情况下，插件会以本地方式启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex 测试工具会话：`approvalPolicy: "never"`、`approvalsReviewer: "user"`，以及 `sandbox: "danger-full-access"`。这是用于自主心跳任务的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而无需停下来等待无人应答的原生审批提示。

如需启用由 Codex guardian 审核的审批，请设置 `appServer.mode: "guardian"`：

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

Guardian 是原生 Codex 审批审查者。当 Codex 请求离开沙箱、在工作区外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给审查子智能体，而不是提示人工。审查者会应用 Codex 的风险框架，并批准或拒绝该具体请求。当你需要比 YOLO 模式更多的防护措施，但仍希望无人值守的智能体继续推进任务时，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"`，以及 `sandbox: "workspace-write"`。各个策略字段仍可覆盖 `mode`，因此高级部署可以将该预设与显式选项混合使用。

对于已在运行的 app-server，可使用 WebSocket 传输：

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
| `url`               | 未设置                                   | WebSocket app-server URL。                                                                                |
| `authToken`         | 未设置                                   | 用于 WebSocket 传输的 Bearer token。                                                                      |
| `headers`           | `{}`                                     | 额外的 WebSocket 标头。                                                                                   |
| `requestTimeoutMs`  | `60000`                                  | app-server 控制平面调用的超时时间。                                                                       |
| `mode`              | `"yolo"`                                 | 用于 YOLO 或 guardian 审核执行的预设。                                                                    |
| `approvalPolicy`    | `"never"`                                | 发送到线程启动 / 恢复 / 轮次的原生 Codex 审批策略。                                                       |
| `sandbox`           | `"danger-full-access"`                   | 发送到线程启动 / 恢复的原生 Codex 沙箱模式。                                                              |
| `approvalsReviewer` | `"user"`                                 | 使用 `"guardian_subagent"` 可让 Codex Guardian 审核提示。                                                 |
| `serviceTier`       | 未设置                                   | 可选的 Codex app-server 服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧值会被忽略。                     |

较旧的环境变量在对应配置字段未设置时，仍可作为本地测试的回退方式使用：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复的部署，更推荐使用配置，因为这样可以将插件行为与 Codex 测试工具其余设置保存在同一个已审阅的文件中。

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

仅使用 Codex 的测试工具验证，并禁用 Pi 回退：

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

使用 guardian 审核的 Codex 审批：

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

模型切换仍由 OpenClaw 控制。当 OpenClaw 会话附加到现有的 Codex 线程时，下一轮会再次把当前选中的 OpenAI 模型、提供商、审批策略、沙箱和服务层级发送给 app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选择的模型继续运行。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用命令，可在任何支持 OpenClaw 文本命令的渠道上使用。

常见形式：

- `/codex status` 显示实时 app-server 连接状态、模型、账号、速率限制、MCP 服务器和技能。
- `/codex models` 列出实时的 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有的 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩当前附加的线程。
- `/codex review` 为当前附加的线程启动 Codex 原生审查。
- `/codex account` 显示账号和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

`/codex resume` 会写入与测试工具正常轮次所使用的同一 sidecar 绑定文件。在下一条消息到来时，OpenClaw 会恢复该 Codex 线程，把当前选中的 OpenClaw 模型传入 app-server，并保持启用扩展历史记录。

该命令功能要求 Codex app-server `0.118.0` 或更高版本。如果未来版本或自定义 app-server 未公开某个 JSON-RPC 方法，则对应控制方法会显示为 `unsupported by this Codex app-server`。

## 工具、媒体与压缩

Codex 测试工具仅改变底层嵌入式智能体执行器。

OpenClaw 仍然构建工具列表，并从测试工具接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，仍会通过 OpenClaw 的常规传递路径继续处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批征求会通过 OpenClaw 的插件审批流程路由；其他征求类型和自由格式输入请求仍会以失败关闭方式处理。

当选定模型使用 Codex 测试工具时，原生线程压缩会委托给 Codex app-server。OpenClaw 会保留一份转录镜像，用于渠道历史、搜索、`/new`、`/reset` 以及未来的模型或测试工具切换。该镜像包含用户提示、最终助手文本，以及 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 仅记录原生压缩的开始和完成信号。它尚未公开人类可读的压缩摘要，也尚未提供一份可审计的条目列表，以说明 Codex 在压缩后保留了哪些内容。

媒体生成不需要 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍会继续使用相应的提供商 / 模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中没有出现 Codex：** 启用 `plugins.entries.codex.enabled`，选择一个带有 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用的是 Pi 而不是 Codex：** 如果没有任何 Codex 测试工具声明接管此次运行，OpenClaw 可能会使用 Pi 作为兼容性后端。测试时可设置 `embeddedHarness.runtime: "codex"` 以强制选择 Codex，或设置 `embeddedHarness.fallback: "none"` 以便在没有匹配插件测试工具时直接失败。一旦选中了 Codex app-server，其失败会直接暴露出来，而不会再经过额外的回退配置。

**app-server 被拒绝：** 升级 Codex，使 app-server 握手报告版本为 `0.118.0` 或更高。

**模型发现速度慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs`，或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程 app-server 是否使用相同版本的 Codex app-server 协议。

**非 Codex 模型使用了 Pi：** 这是预期行为，除非你强制设置了 `embeddedHarness.runtime: "codex"`（或选择了旧版 `codex/*` 引用）。普通的 `openai/gpt-*` 和其他提供商引用会保持其正常的提供商路径。

## 相关内容

- [智能体测试工具插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
