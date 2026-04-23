---
read_when:
    - 你想使用内置的 Codex 应用服务器测试框架
    - 你需要 Codex 模型引用和配置示例
    - 你想为仅使用 Codex 的部署禁用 Pi 回退机制
summary: 通过内置的 Codex 应用服务器测试框架运行 OpenClaw 嵌入式智能体回合
title: Codex 测试框架
x-i18n:
    generated_at: "2026-04-23T21:49:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27b7b662c5eb2002fed8d2c752c4227a46a89d767ac838138327e64df84e4919
    source_path: plugins/codex-harness.md
    workflow: 15
---

内置的 `codex` 插件让 OpenClaw 可以通过 Codex 应用服务器运行嵌入式智能体回合，而不是使用内置的 Pi 测试框架。

当你希望由 Codex 接管底层智能体会话时，请使用此功能：模型发现、原生线程恢复、原生压缩，以及应用服务器执行。OpenClaw 仍然负责聊天渠道、会话文件、模型选择、工具、审批、媒体传输，以及可见的转录镜像。

原生 Codex 回合同样会遵循共享的插件钩子，因此提示词 shim、压缩感知自动化、工具中间件和生命周期观察器都能与 Pi 测试框架保持一致：

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

内置插件还可以注册一个 Codex 应用服务器扩展工厂，以添加异步 `tool_result` 中间件。

该测试框架默认关闭。新配置应将 OpenAI 模型引用规范地保持为 `openai/gpt-*`，并在希望使用原生应用服务器执行时，显式强制设置 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。为了兼容性，旧版 `codex/*` 模型引用仍会自动选择该测试框架。

## 选择正确的模型前缀

OpenClaw 现在将 OpenAI GPT 模型引用统一规范为 `openai/*`：

| 模型引用 | 运行时路径 | 使用场景 |
| ----------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.5`                                      | 通过 OpenClaw/Pi 管线的 OpenAI 提供商 | 你希望使用 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。 |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex 应用服务器测试框架 | 你希望嵌入式智能体回合使用原生 Codex 应用服务器执行。 |

旧版 `openai-codex/gpt-*` 和 `codex/gpt-*` 引用仍然作为兼容别名被接受，但新的文档和配置示例应使用 `openai/gpt-*`。

使用 `/status` 确认当前会话实际使用的测试框架。如果选择结果令人意外，请为 `agents/harness` 子系统启用调试日志，并检查 Gateway 网关中的结构化 `agent harness selected` 记录。它包含所选测试框架 id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个插件候选项的支持结果。

测试框架选择不是实时会话控制。当嵌入式回合运行时，OpenClaw 会将选中的测试框架 id 记录到该会话上，并在同一会话 id 的后续回合中继续使用它。当你希望未来的新会话使用另一种测试框架时，请更改 `embeddedHarness` 配置或 `OPENCLAW_AGENT_RUNTIME`；如果要在现有对话中在 Pi 和 Codex 之间切换，请先使用 `/new` 或 `/reset` 启动一个新会话。这样可以避免用两套不兼容的原生会话系统重放同一份转录记录。

在引入测试框架固定机制之前创建的旧会话，一旦已有转录历史，就会被视为固定到 Pi。更改配置后，请使用 `/new` 或 `/reset`，让该对话改为使用 Codex。

`/status` 会在 `Fast` 旁边显示当前实际使用的非 Pi 测试框架，例如 `Fast · codex`。默认的 Pi 测试框架仍显示为 `Runner: pi (embedded)`，不会额外显示单独的测试框架徽标。

## 要求

- OpenClaw，且可用内置的 `codex` 插件。
- Codex 应用服务器 `0.118.0` 或更高版本。
- 应用服务器进程可用的 Codex 认证信息。

该插件会阻止较旧或没有版本信息的应用服务器握手。这可确保 OpenClaw 始终使用其已测试过的协议接口。

对于实时和 Docker 冒烟测试，认证信息通常来自 `OPENAI_API_KEY`，以及可选的 Codex CLI 文件，如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。请使用与你本地 Codex 应用服务器相同的认证材料。

## 最小配置

使用 `openai/gpt-5.5`，启用内置插件，并强制使用 `codex` 测试框架：

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

如果旧版配置将 `agents.defaults.model` 或某个智能体模型设置为 `codex/<model>`，仍会自动启用内置的 `codex` 插件。新配置应优先使用 `openai/<model>`，并配合上面显式的 `embeddedHarness` 配置项。

## 在不替换其他模型的情况下添加 Codex

如果你希望旧版 `codex/*` 引用选择 Codex，而其他所有内容继续使用 Pi，请保持 `runtime: "auto"`。对于新配置，建议仅在应使用该测试框架的智能体上显式设置 `runtime: "codex"`。

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

- `/model gpt` 或 `/model openai/gpt-5.5` 会在此配置中使用 Codex 应用服务器测试框架。
- `/model opus` 使用 Anthropic 提供商路径。
- 如果选择的是非 Codex 模型，Pi 仍然是兼容性测试框架。

## 仅使用 Codex 的部署

当你需要证明每一个嵌入式智能体回合都使用 Codex 测试框架时，请禁用 Pi 回退：

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
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，如果 Codex 插件被禁用、应用服务器版本过旧，或者应用服务器无法启动，OpenClaw 会尽早失败。

## 按智能体启用 Codex

你可以让某个智能体仅使用 Codex，而默认智能体保持普通的自动选择：

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

使用常规会话命令切换智能体和模型。`/new` 会创建一个新的 OpenClaw 会话，而 Codex 测试框架会按需创建或恢复它的 sidecar 应用服务器线程。`/reset` 会清除该线程的 OpenClaw 会话绑定，并让下一回合重新根据当前配置解析测试框架。

## 模型发现

默认情况下，Codex 插件会向应用服务器请求可用模型。如果发现失败或超时，它会使用内置的回退目录，包含：

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

如果你希望启动时避免探测 Codex，并始终使用回退目录，请禁用发现：

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

默认情况下，插件会在本地通过以下命令启动 Codex：

```bash
codex app-server --listen stdio://
```

默认情况下，OpenClaw 会以 YOLO 模式启动本地 Codex 测试框架会话：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和 `sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停在无人响应的原生审批提示上。

如果你想启用由 Codex guardian 审核的审批，请设置 `appServer.mode: "guardian"`：

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

Guardian 是 Codex 的原生审批审核器。当 Codex 请求离开沙箱、在工作区外写入，或添加诸如网络访问之类的权限时，Codex 会将该审批请求路由给一个 reviewer 子智能体，而不是弹出人工提示。该 reviewer 会应用 Codex 的风险框架，并批准或拒绝该具体请求。如果你希望比 YOLO 模式有更多保护措施，但仍需要无人值守的智能体继续推进任务，请使用 Guardian。

`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "guardian_subagent"` 和 `sandbox: "workspace-write"`。各个单独的策略字段仍然会覆盖 `mode`，因此高级部署可以将该预设与显式设置混合使用。

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

| 字段 | 默认值 | 含义 |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport` | `"stdio"` | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。 |
| `command` | `"codex"` | 用于 stdio 传输的可执行文件。 |
| `args` | `["app-server", "--listen", "stdio://"]` | 用于 stdio 传输的参数。 |
| `url` | 未设置 | WebSocket 应用服务器 URL。 |
| `authToken` | 未设置 | 用于 WebSocket 传输的 Bearer token。 |
| `headers` | `{}` | 额外的 WebSocket 标头。 |
| `requestTimeoutMs` | `60000` | 应用服务器控制平面调用的超时时间。 |
| `mode` | `"yolo"` | 用于 YOLO 或 guardian 审核执行的预设。 |
| `approvalPolicy` | `"never"` | 发送到线程启动/恢复/回合的原生 Codex 审批策略。 |
| `sandbox` | `"danger-full-access"` | 发送到线程启动/恢复的原生 Codex 沙箱模式。 |
| `approvalsReviewer` | `"user"` | 使用 `"guardian_subagent"` 让 Codex Guardian 审核提示。 |
| `serviceTier` | 未设置 | 可选的 Codex 应用服务器服务层级：`"fast"`、`"flex"` 或 `null`。无效的旧值会被忽略。 |

当对应配置字段未设置时，较旧的环境变量仍可作为本地测试的回退方式继续使用：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或者在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，因为这样可以将插件行为与 Codex 测试框架其余设置保存在同一个经过审查的文件中。

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

仅使用 Codex 的测试框架验证，并禁用 Pi 回退：

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

模型切换仍由 OpenClaw 控制。当 OpenClaw 会话附加到现有 Codex 线程时，下一回合会再次将当前选中的 OpenAI 模型、provider、审批策略、沙箱和服务层级发送给应用服务器。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保留线程绑定，但会要求 Codex 使用新选中的模型继续执行。

## Codex 命令

内置插件将 `/codex` 注册为已授权的斜杠命令。它是通用命令，可用于任何支持 OpenClaw 文本命令的渠道。

常见形式：

- `/codex status` 显示实时的应用服务器连接状态、模型、账户、速率限制、MCP 服务器和技能。
- `/codex models` 列出实时的 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex 应用服务器压缩当前附加的线程。
- `/codex review` 为当前附加的线程启动 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器 Skills。

`/codex resume` 会写入与测试框架在正常回合中使用的同一个 sidecar 绑定文件。在下一条消息时，OpenClaw 会恢复该 Codex 线程，将当前选中的 OpenClaw 模型传入应用服务器，并保持启用扩展历史记录。

该命令界面要求 Codex 应用服务器版本为 `0.118.0` 或更高。如果未来版本或自定义应用服务器未公开某个 JSON-RPC 方法，则对应的单个控制方法会显示为 `unsupported by this Codex app-server`。

## 工具、媒体和压缩

Codex 测试框架只会更改底层嵌入式智能体执行器。

OpenClaw 仍然负责构建工具列表，并从测试框架接收动态工具结果。文本、图像、视频、音乐、TTS、审批以及消息工具输出，都会继续通过正常的 OpenClaw 传输路径处理。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批引导会通过 OpenClaw 的插件审批流程进行路由；其他引导请求和自由形式输入请求仍会默认拒绝。

当选中的模型使用 Codex 测试框架时，原生线程压缩会委托给 Codex 应用服务器。OpenClaw 会继续保留一个转录镜像，用于渠道历史记录、搜索、`/new`、`/reset` 以及未来的模型或测试框架切换。该镜像包括用户提示、最终助手文本，以及应用服务器发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩的开始和完成信号。它尚未公开可供人类阅读的压缩摘要，也无法提供 Codex 在压缩后保留了哪些条目的可审计列表。

媒体生成功能不依赖 Pi。图像、视频、音乐、PDF、TTS 和媒体理解仍会继续使用对应的 provider/模型设置，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**`/model` 中看不到 Codex：** 启用 `plugins.entries.codex.enabled`，选择带有 `embeddedHarness.runtime: "codex"` 的 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 Pi 而不是 Codex：** 如果没有任何 Codex 测试框架声明处理该运行，OpenClaw 可能会使用 Pi 作为兼容后端。测试时请设置 `embeddedHarness.runtime: "codex"` 以强制选择 Codex，或设置 `embeddedHarness.fallback: "none"`，以便在没有匹配的插件测试框架时报错。一旦选择了 Codex 应用服务器，其失败会直接暴露出来，不需要额外的回退配置。

**应用服务器被拒绝：** 升级 Codex，使应用服务器握手报告的版本为 `0.118.0` 或更高。

**模型发现过慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程应用服务器是否使用相同版本的 Codex 应用服务器协议。

**非 Codex 模型使用了 Pi：** 这是预期行为，除非你强制设置了 `embeddedHarness.runtime: "codex"`（或选择了旧版 `codex/*` 引用）。普通的 `openai/gpt-*` 和其他 provider 引用都会继续使用其正常的 provider 路径。

## 相关内容

- [智能体测试框架插件](/zh-CN/plugins/sdk-agent-harness)
- [模型提供商](/zh-CN/concepts/model-providers)
- [配置参考](/zh-CN/gateway/configuration-reference)
- [测试](/zh-CN/help/testing#live-codex-app-server-harness-smoke)
