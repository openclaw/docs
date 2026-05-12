---
read_when:
    - 你想使用内置的 Codex app-server 运行框架
    - 你需要 Codex harness 配置示例
    - 你希望仅 Codex 的部署失败，而不是回退到 PI
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-05-12T00:59:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

内置的 `codex` 插件让 OpenClaw 通过 Codex app-server 运行嵌入式 OpenAI 智能体轮次，而不是使用内置 PI 承载运行时。

当你希望由 Codex 拥有底层智能体会话时，请使用 Codex harness：原生线程恢复、原生工具续接、原生压缩和 app-server 执行。OpenClaw 仍然拥有聊天渠道、会话文件、模型选择、OpenClaw 动态工具、审批、媒体投递，以及可见的 transcript 镜像。

常规设置使用规范 OpenAI 模型引用，例如 `openai/gpt-5.5`。不要配置 `openai-codex/gpt-*` 模型引用。将 OpenAI 智能体凭证顺序放在 `auth.order.openai` 下；旧的 `openai-codex:*` profiles 和 `auth.order.openai-codex` 条目仍然支持现有安装。

OpenClaw 会以 Codex 原生代码模式和仅代码模式启用来启动 Codex app-server 线程。这样会把延迟的/可搜索的 OpenClaw 动态工具保留在 Codex 自己的代码执行和工具搜索界面中，而不是在 Codex 之上额外添加 PI 风格的工具搜索包装器。

如需了解更广泛的模型/提供商/运行时拆分，请从
[Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。简短版本是：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、
Discord、Slack 或其他渠道仍然是通信界面。

## 要求

- OpenClaw 可使用内置的 `codex` 插件。
- 如果你的配置使用 `plugins.allow`，请包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。默认情况下，内置插件会管理兼容的
  Codex app-server 二进制文件，因此 `PATH` 上的本地 `codex` 命令不会影响常规 harness 启动。
- 可通过 `openclaw models auth login --provider openai-codex`、
  智能体 Codex home 中的 app-server 账户，或显式的 Codex API-key
  凭证 profile 使用 Codex 凭证。

如需了解凭证优先级、环境隔离、自定义 app-server 命令、模型发现和所有配置字段，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 快速开始

大多数想在 OpenClaw 中使用 Codex 的用户需要这条路径：使用
ChatGPT/Codex 订阅登录，启用内置 `codex` 插件，并使用规范的
`openai/gpt-*` 模型引用。

使用 Codex OAuth 登录：

```bash
openclaw models auth login --provider openai-codex
```

启用内置 `codex` 插件并选择一个 OpenAI 智能体模型：

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
    },
  },
}
```

如果你的配置使用 `plugins.allow`，也在那里添加 `codex`：

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

更改插件配置后重启 Gateway 网关。如果现有聊天已经有会话，请在测试运行时更改前使用 `/new` 或 `/reset`，这样下一个轮次会从当前配置解析 harness。

## 配置

快速开始配置是最小可用的 Codex harness 配置。在 OpenClaw 配置中设置 Codex
harness 选项，并且仅将 CLI 用于 Codex 凭证：

| 需求                                   | 设置                                                                              | 位置                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 启用 harness                           | `plugins.entries.codex.enabled: true`                                            | OpenClaw 配置                    |
| 保持允许列表中的插件安装               | 在 `plugins.allow` 中包含 `codex`                                                | OpenClaw 配置                    |
| 通过 Codex 路由 OpenAI 智能体轮次      | `agents.defaults.model` 或 `agents.list[].model` 设为 `openai/gpt-*`             | OpenClaw 智能体配置              |
| 使用 Codex OAuth 登录                  | `openclaw models auth login --provider openai-codex`                             | CLI 凭证 profile                 |
| 为 Codex 运行添加 API-key 备用         | 在 `auth.order.openai` 中将 `openai:*` API-key profile 列在订阅凭证之后          | CLI 凭证 profile + OpenClaw 配置 |
| Codex 不可用时关闭失败                 | 提供商或模型 `agentRuntime.id: "codex"`                                          | OpenClaw 模型/提供商配置         |
| 使用直接 OpenAI API 流量               | 提供商或模型 `agentRuntime.id: "pi"`，并使用常规 OpenAI 凭证                    | OpenClaw 模型/提供商配置         |
| 调整 app-server 行为                   | `plugins.entries.codex.config.appServer.*`                                       | Codex 插件配置                   |
| 启用原生 Codex 插件应用                | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex 插件配置                   |
| 启用 Codex Computer Use                | `plugins.entries.codex.config.computerUse.*`                                     | Codex 插件配置                   |

对于由 Codex 支持的 OpenAI 智能体轮次，请使用 `openai/gpt-*` 模型引用。优先使用
`auth.order.openai` 来设置订阅优先/API-key 备用的顺序。现有的
`openai-codex:*` 凭证 profiles 和 `auth.order.openai-codex` 仍然有效，但不要写新的
`openai-codex/gpt-*` 模型引用。

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在这种结构中，对于 `openai/gpt-*` 智能体轮次，两个 profiles 仍然都会通过 Codex 运行。API key 只是凭证备用，而不是切换到 PI 或普通 OpenAI Responses 的请求。

本页其余部分涵盖用户必须在其中选择的常见变体：部署形态、关闭失败路由、guardian 审批策略、原生 Codex
插件，以及 Computer Use。如需完整选项列表、默认值、枚举、发现、环境隔离、超时和 app-server 传输字段，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 验证 Codex 运行时

在你期望使用 Codex 的聊天中使用 `/status`。由 Codex 支持的 OpenAI 智能体轮次会显示：

```text
Runtime: OpenAI Codex
```

然后检查 Codex app-server 状态：

```text
/codex status
/codex models
```

`/codex status` 会报告 app-server 连接、账户、速率限制、MCP
服务器和 skills。`/codex models` 会列出用于该 harness 和账户的实时 Codex app-server 目录。如果 `/status` 的结果不符合预期，请参阅
[故障排除](#troubleshooting)。

## 路由和模型选择

将提供商引用与运行时策略分开：

- 对于通过 Codex 运行的 OpenAI 智能体轮次，使用 `openai/gpt-*`。
- 不要在配置中使用 `openai-codex/gpt-*`。运行 `openclaw doctor --fix`
  来修复旧版引用和过时的会话路由 pin。
- 对于常规 OpenAI 自动模式，`agentRuntime.id: "codex"` 是可选的，但当部署应该在 Codex 不可用时关闭失败时很有用。
- 当这是有意行为时，`agentRuntime.id: "pi"` 会让提供商或模型选择直接 PI 行为。
- `/codex ...` 从聊天中控制原生 Codex app-server 对话。
- ACP/acpx 是单独的外部 harness 路径。仅当用户要求 ACP/acpx 或外部 harness 适配器时才使用它。

常见命令路由：

| 用户意图                        | 使用                                    |
| ------------------------------- | --------------------------------------- |
| 附加当前聊天                    | `/codex bind [--cwd <path>]`            |
| 恢复现有 Codex 线程             | `/codex resume <thread-id>`             |
| 列出或过滤 Codex 线程           | `/codex threads [filter]`               |
| 仅发送 Codex 反馈               | `/codex diagnostics [note]`             |
| 启动 ACP/acpx 任务              | ACP/acpx 会话命令，而不是 `/codex`      |

| 使用场景                                             | 配置                                                             | 验证                                    | 备注                               |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| 使用原生 Codex 运行时的 ChatGPT/Codex 订阅           | `openai/gpt-*` 加上已启用的 `codex` 插件                         | `/status` 显示 `Runtime: OpenAI Codex`  | 推荐路径                           |
| Codex 不可用时关闭失败                               | 提供商或模型 `agentRuntime.id: "codex"`                          | 轮次失败，而不是回退到 PI              | 用于仅 Codex 部署                  |
| 通过 PI 的直接 OpenAI API-key 流量                   | 提供商或模型 `agentRuntime.id: "pi"` 和常规 OpenAI 凭证          | `/status` 显示 PI 运行时               | 仅在有意使用 PI 时使用             |
| 旧版配置                                             | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` 会重写它        | 不要以这种方式编写新配置           |
| ACP/acpx Codex 适配器                                | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP 任务/会话状态                      | 与原生 Codex harness 分离          |

`agents.defaults.imageModel` 遵循相同的前缀拆分。对常规 OpenAI 路由使用 `openai/gpt-*`，只有当图像理解应该通过有边界的 Codex app-server 轮次运行时，才使用 `codex/gpt-*`。不要使用
`openai-codex/gpt-*`；doctor 会将该旧版前缀重写为 `openai/gpt-*`。

## 部署模式

### 基础 Codex 部署

当所有 OpenAI 智能体轮次都应默认使用 Codex 时，请使用快速开始配置。

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
    },
  },
}
```

### 混合提供商部署

这种结构将 Claude 保持为默认智能体，并添加一个命名的 Codex 智能体：

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

使用此配置时，`main` 智能体使用其常规提供商路径，`codex` 智能体使用 Codex app-server。

### 关闭失败 Codex 部署

对于 OpenAI 智能体轮次，当内置插件可用时，`openai/gpt-*` 已经会解析到 Codex。当你需要一条写明的关闭失败规则时，请添加显式运行时策略：

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

在强制使用 Codex 时，如果 Codex 插件被禁用、app-server 过旧，或 app-server 无法启动，OpenClaw 会提前失败。

## App-server 策略

默认情况下，插件会通过 stdio 传输在本地启动 OpenClaw 管理的 Codex 二进制文件。只有当你有意运行不同的可执行文件时，才设置 `appServer.command`。只有当 app-server 已在其他位置运行时，才使用 WebSocket 传输：

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

本地 stdio app-server 会话默认采用可信本地操作员姿态：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。如果本地 Codex 要求不允许这种
隐式 YOLO 姿态，OpenClaw 会改为选择允许的 guardian 权限。
当会话启用了 OpenClaw 沙箱时，OpenClaw 会将 Codex
`danger-full-access` 收窄为 Codex `workspace-write`，这样原生 Codex 代码模式轮次
会保持在沙箱隔离的工作区内。

当你希望 Codex 在沙箱逃逸或额外权限之前执行原生自动审查时，请使用 guardian 模式：

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

当本地要求允许这些值时，guardian 模式会展开为 Codex app-server 审批，通常是
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和
`sandbox: "workspace-write"`。

关于每个 app-server 字段、认证顺序、环境隔离、发现和
超时行为，请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 命令和诊断

内置插件会在任何支持 OpenClaw 文本命令的渠道上注册 `/codex`
作为斜杠命令。

常见形式：

- `/codex status` 检查 app-server 连接性、模型、账户、速率限制、
  MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex app-server 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到
  现有 Codex 线程。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审查。
- `/codex diagnostics [note]` 在发送已附加线程的 Codex 反馈前请求确认。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。

对于大多数支持报告，请在发生问题的对话中先使用 `/diagnostics [note]`。
它会创建一个 Gateway 网关诊断报告，并且对于 Codex harness 会话，会请求批准发送相关的 Codex 反馈包。
请参阅 [诊断导出](/zh-CN/gateway/diagnostics)，了解隐私模型和群聊行为。

仅当你明确想为当前附加的线程上传 Codex 反馈、而不需要完整的 Gateway 网关
诊断包时，才使用 `/codex diagnostics [note]`。

### 在本地检查 Codex 线程

检查异常 Codex 运行的最快方式通常是直接打开原生 Codex
线程：

```bash
codex resume <thread-id>
```

从已完成的 `/diagnostics` 回复、`/codex binding` 或
`/codex threads [filter]` 获取线程 ID。

关于上传机制和运行时级诊断边界，请参阅
[Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#codex-feedback-upload)。

认证按以下顺序选择：

1. 该智能体的有序 OpenAI 认证配置文件，优先使用
   `auth.order.openai` 下的配置。现有 `openai-codex:*` 配置文件 ID 仍然有效。
2. 该智能体 Codex home 中 app-server 的现有账户。
3. 仅对本地 stdio app-server 启动：当不存在 app-server 账户且仍需要 OpenAI 认证时，先使用
   `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅式 Codex 认证配置文件时，它会从派生的 Codex 子进程中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。这样 Gateway 网关级 API 密钥仍可用于 embeddings 或直接 OpenAI 模型，
而不会意外让原生 Codex app-server 轮次通过 API 计费。
显式 Codex API 密钥配置文件和本地 stdio 环境密钥回退会使用 app-server
登录，而不是继承子进程环境。WebSocket app-server 连接不会接收 Gateway 网关环境 API 密钥回退；
请使用显式认证配置文件或远程 app-server 自身的账户。

如果订阅配置文件触发 Codex 使用限制，OpenClaw 会在 Codex 报告重置时间时记录该时间，
并为同一次 Codex 运行尝试下一个有序认证配置文件。重置时间过去后，该订阅配置文件会再次符合条件，
无需更改所选 `openai/gpt-*` 模型或 Codex 运行时。

如果部署需要额外环境隔离，请将这些变量添加到
`appServer.clearEnv`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` 只影响派生的 Codex app-server 子进程。

Codex 动态工具默认使用 `searchable` 加载。OpenClaw 不会暴露
与 Codex 原生工作区操作重复的动态工具：`read`、`write`、
`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。其余 OpenClaw
集成工具，例如消息传递、会话、媒体、cron、浏览器、节点、
gateway、`heartbeat_respond` 和 `web_search`，可通过 `openclaw` 命名空间下的 Codex 工具搜索使用，
从而保持较小的初始模型上下文。
`sessions_yield` 和仅消息工具来源回复保持直接使用，因为它们是轮次控制契约。Heartbeat 协作说明会告诉 Codex，
当 `heartbeat_respond` 工具尚未加载时，在结束 heartbeat 轮次前搜索该工具。

只有在连接无法搜索延迟动态工具的自定义 Codex
app-server，或调试完整工具载荷时，才将 `codexDynamicToolsLoading: "direct"` 设置为 `direct`。

支持的顶层 Codex 插件字段：

| 字段                       | 默认值         | 含义                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 将 OpenClaw 动态工具直接放入初始 Codex 工具上下文。 |
| `codexDynamicToolsExclude` | `[]`           | 要从 Codex app-server 轮次中省略的其他 OpenClaw 动态工具名称。              |
| `codexPlugins`             | 禁用           | 对已迁移的源码安装精选插件提供原生 Codex 插件/app 支持。           |

支持的 `appServer` 字段：

| 字段                          | 默认值                                                 | 含义                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` 会派生 Codex；`"websocket"` 连接到 `url`。                                                                                                                                                                                |
| `command`                     | 托管的 Codex 二进制文件                                | stdio 传输的可执行文件。保持未设置以使用托管二进制文件；仅在需要显式覆盖时设置。                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输的参数。                                                                                                                                                                                                          |
| `url`                         | 未设置                                                 | WebSocket app-server URL。                                                                                                                                                                                                               |
| `authToken`                   | 未设置                                                 | WebSocket 传输的 Bearer 令牌。                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | 额外的 WebSocket 请求头。                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | OpenClaw 构建继承环境后，从派生的 stdio app-server 进程中移除的额外环境变量名称。`CODEX_HOME` 和 `HOME` 保留给 OpenClaw 在本地启动时按智能体隔离 Codex 使用。    |
| `requestTimeoutMs`            | `60000`                                                | app-server 控制平面调用的超时时间。                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | 在一次轮次范围的 Codex app-server 请求之后，OpenClaw 等待 `turn/completed` 时使用的静默窗口。对于较慢的工具后处理或仅状态综合阶段，请提高此值。                                                                     |
| `mode`                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO               | YOLO 或 guardian 审查执行的预设。不包含 `danger-full-access`、`never` 审批或 `user` 审查者的本地 stdio 要求会使隐式默认值变为 guardian。                                                   |
| `approvalPolicy`              | `"never"` 或允许的 guardian 审批策略                   | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。guardian 默认值在允许时优先使用 `"on-request"`。                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` 或允许的 guardian 沙箱          | 发送到线程启动/恢复的原生 Codex 沙箱模式。guardian 默认值在允许时优先使用 `"workspace-write"`，否则使用 `"read-only"`。当 OpenClaw 沙箱处于活动状态时，`danger-full-access` 会收窄为 `"workspace-write"`。 |
| `approvalsReviewer`           | `"user"` 或允许的 guardian 审查者                      | 使用 `"auto_review"` 可在允许时让 Codex 审查原生审批提示，否则使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是旧版别名。                                                                      |
| `serviceTier`                 | 未设置                                                 | 可选 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求 flex 处理，`null` 清除覆盖，并且旧版 `"fast"` 会被接受为 `"priority"`。                                         |

OpenClaw 拥有的动态工具调用独立于 `appServer.requestTimeoutMs` 设定边界：Codex `item/tool/call` 请求默认使用 30 秒的 OpenClaw 看门狗。正数的逐调用 `timeoutMs` 参数会延长或缩短该特定工具的预算。`image_generate` 工具在工具调用未提供自身超时时，也会使用 `agents.defaults.imageGenerationModel.timeoutMs`；媒体理解 `image` 工具则使用 `tools.media.image.timeoutSeconds` 或其 60 秒媒体默认值。动态工具预算上限为 600000 ms。超时时，OpenClaw 会在受支持的位置中止工具信号，并向 Codex 返回失败的动态工具响应，使该轮次可以继续，而不是让会话停留在 `processing`。

OpenClaw 响应 Codex 轮次范围的 app-server 请求后，harness 还期望 Codex 以 `turn/completed` 完成原生轮次。如果 app-server 在该响应之后的 `appServer.turnCompletionIdleTimeoutMs` 内保持静默，OpenClaw 会尽力中断 Codex 轮次、记录诊断超时，并释放 OpenClaw 会话通道，以免后续聊天消息排在过期的原生轮次之后。同一轮次的任何非终止通知（包括 `rawResponseItem/completed`）都会解除这个短看门狗，因为 Codex 已证明该轮次仍然存活；较长的终止看门狗会继续保护真正卡住的轮次。超时诊断包括最后一个 app-server 通知方法；对于原始助手响应项，还包括项类型、角色、ID 和有界的助手文本预览。

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 进行一次性本地测试。对于可重复部署，优先使用配置，因为它会把插件行为与 Codex harness 设置的其余部分保留在同一个已审阅文件中。

## Native Codex plugins

Native Codex plugins 支持会在与 OpenClaw harness 轮次相同的 Codex 线程中使用 Codex app-server 自身的应用和插件能力。OpenClaw 不会将 Codex 插件转换为合成的 `codex_plugin_*` OpenClaw 动态工具。

`codexPlugins` 只影响选择原生 Codex harness 的会话。它不会影响 PI 运行、普通 OpenAI provider 运行、ACP 对话绑定或其他 harness。

最小迁移后配置：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

当 OpenClaw 建立 Codex harness 会话或替换过期的 Codex 线程绑定时，会计算线程应用配置。它不会在每个轮次重新计算。更改 `codexPlugins` 后，请使用 `/new`、`/reset` 或重启 Gateway 网关，以便后续 Codex harness 会话使用更新后的应用集合启动。

关于迁移资格、应用清单、破坏性操作策略、引出请求和原生插件诊断，请参阅 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。

## Computer Use

Computer Use 在自己的设置指南中介绍：
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

简而言之：OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作。它会准备 Codex app-server，验证 `computer-use` MCP 服务器可用，然后让 Codex 在 Codex 模式轮次期间拥有原生 MCP 工具调用。

## 运行时边界

Codex harness 只会更改低层嵌入式智能体执行器。

- 支持 OpenClaw 动态工具。Codex 会要求 OpenClaw 执行这些工具，因此 OpenClaw 仍在执行路径中。
- Codex 原生 shell、patch、MCP 和原生应用工具由 Codex 拥有。OpenClaw 可以通过受支持的中继观察或阻止选定原生事件，但不会重写原生工具参数。
- Codex 拥有原生压缩。OpenClaw 会保留一个转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来的模型或 harness 切换。
- 媒体生成、媒体理解、TTS、审批和消息工具输出继续通过匹配的 OpenClaw 提供商/模型设置。
- `tool_result_persist` 适用于 OpenClaw 拥有的转录工具结果，而不是 Codex 原生工具结果记录。

关于钩子层、受支持的 V1 表面、原生权限处理、队列 Steer、Codex 反馈上传机制和压缩详情，请参阅 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)。

## 故障排除

**Codex 未显示为普通 `/model` 提供商：** 这对新配置来说是预期行为。选择一个 `openai/gpt-*` 模型，启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 确保模型引用是在官方 OpenAI provider 上的 `openai/gpt-*`，并且 Codex 插件已安装且启用。如果你在测试时需要严格证明，请设置提供商或模型 `agentRuntime.id: "codex"`。强制 Codex 运行时会失败，而不是回退到 PI。

**仍存在旧版 `openai-codex/*` 配置：** 运行 `openclaw doctor --fix`。Doctor 会将旧版模型引用重写为 `openai/*`，移除过期会话和整个智能体运行时固定项，并保留现有的 auth-profile 覆盖。

**app-server 被拒绝：** 使用 Codex app-server `0.125.0` 或更新版本。相同版本的预发布版或带构建后缀的版本（例如 `0.125.0-alpha.2` 或 `0.125.0+custom`）会被拒绝，因为 OpenClaw 会测试稳定的 `0.125.0` 协议下限。

**`/codex status` 无法连接：** 检查内置 `codex` 插件是否已启用、配置 allowlist 时 `plugins.allow` 是否包含它，以及任何自定义 `appServer.command`、`url`、`authToken` 或 headers 是否有效。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference#model-discovery)。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`、headers，以及远程 app-server 是否使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用 PI：** 除非提供商或模型运行时策略将其路由到另一个 harness，否则这是预期行为。普通非 OpenAI provider 引用在 `auto` 模式下会留在其正常提供商路径上。

**Computer Use 已安装但工具不运行：** 从全新会话检查 `/codex computer-use status`。如果某个工具报告 `Native hook relay unavailable`，请使用 `/new` 或 `/reset`；如果问题仍然存在，请重启 Gateway 网关以清除过期的原生钩子注册。请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use#troubleshooting)。

## 相关

- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
- [Agent runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [插件钩子](/zh-CN/plugins/hooks)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [Status](/zh-CN/cli/status)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
