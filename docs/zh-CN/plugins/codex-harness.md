---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅 Codex 的部署失败，而不是回退到 OpenClaw
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-07-03T13:16:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

内置的 `codex` 插件让 OpenClaw 可以通过 Codex app-server 运行嵌入式 OpenAI 智能体轮次，而不是使用内置的 OpenClaw harness。

当你希望 Codex 拥有底层智能体会话时，请使用 Codex harness：原生线程恢复、原生工具续接、原生压缩，以及 app-server 执行。OpenClaw 仍然拥有聊天渠道、会话文件、模型选择、OpenClaw 动态工具、审批、媒体递送，以及可见的转录镜像。

常规设置使用规范的 OpenAI 模型引用，例如 `openai/gpt-5.5`。不要配置旧版 Codex GPT 引用。将 OpenAI 智能体凭证顺序放在 `auth.order.openai` 下；较旧的旧版 Codex 凭证配置文件 ID 和旧版 Codex 凭证顺序条目属于旧版状态，由 `openclaw doctor --fix` 修复。

当没有启用 OpenClaw 沙箱时，OpenClaw 会在启用 Codex 原生代码模式的情况下启动 Codex app-server 线程，同时默认保持仅代码模式关闭。这样可以让 Codex 原生工作区和代码能力保持可用，同时 OpenClaw 动态工具继续通过 app-server `item/tool/call` 桥接运行。启用中的 OpenClaw 沙箱隔离和受限工具策略会完全禁用原生代码模式，除非你选择启用实验性的沙箱 exec-server 路径。

此 Codex 原生功能不同于
[OpenClaw 代码模式](/zh-CN/reference/code-mode)，后者是用于通用 OpenClaw 运行的可选 QuickJS-WASI 运行时，并使用不同的 `exec` 输入形状。

如需了解更广泛的模型、提供商和运行时拆分，请从
[Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。简短版本是：
`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍然是通信表面。

## 要求

- OpenClaw，并且内置的 `codex` 插件可用。
- 如果你的配置使用 `plugins.allow`，请包含 `codex`。
- Codex app-server `0.125.0` 或更高版本。内置插件默认会管理兼容的 Codex app-server 二进制文件，因此 `PATH` 上的本地 `codex` 命令不会影响常规 harness 启动。
- 可通过 `openclaw models auth login --provider openai` 使用的 Codex 凭证、智能体 Codex home 中的 app-server 账户，或显式的 Codex API-key 凭证配置文件。

如需了解凭证优先级、环境隔离、自定义 app-server 命令、模型发现，以及所有配置字段，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 快速开始

大多数想在 OpenClaw 中使用 Codex 的用户需要这条路径：使用 ChatGPT/Codex 订阅登录，启用内置的 `codex` 插件，并使用规范的 `openai/gpt-*` 模型引用。

使用 Codex OAuth 登录：

```bash
openclaw models auth login --provider openai
```

启用内置的 `codex` 插件并选择一个 OpenAI 智能体模型：

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

如果你的配置使用 `plugins.allow`，也请在那里添加 `codex`：

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

更改插件配置后重启 Gateway 网关。如果现有聊天已经有会话，请在测试运行时变更前使用 `/new` 或 `/reset`，这样下一轮会从当前配置解析 harness。

## 配置

快速开始配置是最小可用的 Codex harness 配置。请在 OpenClaw 配置中设置 Codex harness 选项，并且仅将 CLI 用于 Codex 凭证：

| 需求                                   | 设置                                                                              | 位置                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 启用 harness                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw 配置                    |
| 保留 allowlist 中的插件安装     | 在 `plugins.allow` 中包含 `codex`                                               | OpenClaw 配置                    |
| 通过 Codex 路由 OpenAI 智能体轮次 | `agents.defaults.model` 或 `agents.list[].model` 设为 `openai/gpt-*`               | OpenClaw 智能体配置              |
| 使用 ChatGPT/Codex OAuth 登录       | `openclaw models auth login --provider openai`                                   | CLI 凭证配置文件                   |
| 为 Codex 运行添加 API-key 备份      | 在 `auth.order.openai` 中将 `openai:*` API-key 配置文件列在订阅凭证之后 | CLI 凭证配置文件 + OpenClaw 配置 |
| Codex 不可用时 fail closed  | 提供商或模型 `agentRuntime.id: "codex"`                                     | OpenClaw 模型/提供商配置     |
| 使用直接 OpenAI API 流量          | 提供商或模型 `agentRuntime.id: "openclaw"`，并使用常规 OpenAI 凭证          | OpenClaw 模型/提供商配置     |
| 调整 app-server 行为               | `plugins.entries.codex.config.appServer.*`                                       | Codex 插件配置                |
| 启用原生 Codex 插件应用        | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex 插件配置                |
| 启用 Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | Codex 插件配置                |

对 Codex 支持的 OpenAI 智能体轮次使用 `openai/gpt-*` 模型引用。优先使用 `auth.order.openai` 实现订阅优先/API-key 备份的顺序。现有的旧版 Codex 凭证配置文件 ID 和旧版 Codex 凭证顺序属于仅由 Doctor 处理的旧版状态；不要写入新的旧版 Codex GPT 引用。

不要在 Codex 支持的智能体上设置 `compaction.model` 或 `compaction.provider`。Codex 通过其原生 app-server 线程状态进行压缩，因此 OpenClaw 会在运行时忽略这些本地摘要器覆盖项，并且当智能体使用 Codex 时，`openclaw doctor --fix` 会移除它们。

Lossless 仍然支持作为 Codex 轮次周边用于组装、摄取和维护的上下文引擎。请通过
`plugins.slots.contextEngine: "lossless-claw"` 和
`plugins.entries.lossless-claw.config.summaryModel` 配置它，而不是通过
`agents.defaults.compaction.provider`。当 Codex 是启用中的运行时时，`openclaw doctor --fix` 会将旧的
`compaction.provider: "lossless-claw"` 形状迁移到 Lossless 上下文引擎槽位，但原生 Codex 仍然拥有压缩。

原生 Codex app-server harness 支持需要预提示组装的上下文引擎。通用 CLI 后端，包括 `codex-cli`，不提供该宿主能力。

对于 Codex 支持的智能体，`/compact` 会在绑定线程上启动原生 Codex app-server 压缩。OpenClaw 不会等待完成、施加 OpenClaw 超时、重启共享 app-server，或回退到上下文引擎或公共 OpenAI 摘要器。如果缺少原生 Codex 线程绑定或绑定已过期，该命令会 fail closed，让操作员看到真实的运行时边界，而不是静默切换压缩后端。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在该形状中，两个配置文件对于 `openai/gpt-*` 智能体轮次仍然都会通过 Codex 运行。API key 只是凭证回退，而不是切换到 OpenClaw 或普通 OpenAI Responses 的请求。

本页其余部分涵盖用户必须在其间选择的常见变体：部署形状、fail-closed 路由、守护审批策略、原生 Codex 插件和 Computer Use。如需完整选项列表、默认值、枚举、发现、环境隔离、超时和 app-server 传输字段，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 验证 Codex 运行时

在你预期使用 Codex 的聊天中使用 `/status`。Codex 支持的 OpenAI 智能体轮次会显示：

```text
Runtime: OpenAI Codex
```

然后检查 Codex app-server 状态：

```text
/codex status
/codex models
```

`/codex status` 会报告 app-server 连通性、账户、速率限制、MCP 服务器和技能。`/codex models` 会列出该 harness 和账户的实时 Codex app-server 目录。如果 `/status` 的结果出乎意料，请参阅
[故障排除](#troubleshooting)。

## 路由和模型选择

将提供商引用和运行时策略分开：

- 对通过 Codex 运行的 OpenAI 智能体轮次使用 `openai/gpt-*`。
- 不要在配置中使用旧版 Codex GPT 引用。运行 `openclaw doctor --fix` 修复旧版引用和过期的会话路由固定项。
- 对于常规 OpenAI 自动模式，`agentRuntime.id: "codex"` 是可选的，但当部署应在 Codex 不可用时 fail closed 时很有用。
- 当有意使用 OpenClaw 嵌入式运行时时，`agentRuntime.id: "openclaw"` 会让某个提供商或模型选择该运行时。
- `/codex ...` 从聊天中控制原生 Codex app-server 对话。
- ACP/acpx 是单独的外部 harness 路径。只有当用户要求 ACP/acpx 或外部 harness 适配器时才使用它。

常见命令路由：

| 用户意图                                           | 使用                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加当前聊天                               | `/codex bind [--cwd <path>]`                                                                          |
| 恢复现有 Codex 线程                       | `/codex resume <thread-id>`                                                                           |
| 列出或过滤 Codex 线程                          | `/codex threads [filter]`                                                                             |
| 列出原生 Codex 插件                             | `/codex plugins list`                                                                                 |
| 启用或禁用已配置的原生 Codex 插件    | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 在已配对节点上附加现有 Codex CLI 会话 | `/codex sessions --host <node> [filter]`, then `/codex resume <session-id> --host <node> --bind here` |
| 仅发送 Codex 反馈                              | `/codex diagnostics [note]`                                                                           |
| 启动 ACP/acpx 任务                                | ACP/acpx 会话命令，而不是 `/codex`                                                               |

| 用例                                                 | 配置                                                                   | 验证                                    | 备注                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------ |
| 使用原生 Codex 运行时的 ChatGPT/Codex 订阅          | `openai/gpt-*` 加启用的 `codex` 插件                                   | `/status` 显示 `Runtime: OpenAI Codex` | 推荐路径                             |
| Codex 不可用时失败关闭                              | 提供商或模型 `agentRuntime.id: "codex"`                                | 轮次失败，而不是嵌入式回退             | 用于仅 Codex 部署                    |
| 通过 OpenClaw 直连 OpenAI API-key 流量              | 提供商或模型 `agentRuntime.id: "openclaw"` 和常规 OpenAI 凭证          | `/status` 显示 OpenClaw 运行时         | 仅在有意使用 OpenClaw 时使用        |
| 旧版配置                                             | 旧版 Codex GPT 引用                                                    | `openclaw doctor --fix` 会重写它       | 不要以这种方式编写新配置             |
| ACP/acpx Codex 适配器                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP 任务/会话状态                      | 与原生 Codex harness 分离            |

`agents.defaults.imageModel` 遵循相同的前缀拆分。普通 OpenAI 路由使用 `openai/gpt-*`，
仅当图像理解应通过有边界的 Codex 应用服务器轮次运行时才使用 `codex/gpt-*`。不要使用
旧版 Codex GPT 引用；Doctor 会把该旧版前缀重写为 `openai/gpt-*`。

## 部署模式

### 基础 Codex 部署

当所有 OpenAI 智能体轮次默认都应使用 Codex 时，使用快速开始配置。

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

此形态将 Claude 保持为默认智能体，并添加一个命名 Codex 智能体：

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

使用此配置时，`main` 智能体使用其常规提供商路径，`codex` 智能体使用 Codex 应用服务器。

### 失败关闭的 Codex 部署

对于 OpenAI 智能体轮次，当内置插件可用时，`openai/gpt-*` 已经会解析到 Codex。
如果你想要一条写明的失败关闭规则，请添加显式运行时策略：

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

强制使用 Codex 后，如果 Codex 插件被禁用、应用服务器过旧，或应用服务器无法启动，
OpenClaw 会提前失败。

## 应用服务器策略

默认情况下，插件会在本地以 stdio 传输启动 OpenClaw 管理的 Codex 二进制文件。
仅当你有意运行不同的可执行文件时，才设置 `appServer.command`。仅当应用服务器已在其他位置运行时，
才使用 WebSocket 传输：

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

本地 stdio 应用服务器会话默认采用受信任的本地操作员姿态：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。如果本地 Codex 要求不允许这种隐式 YOLO 姿态，
OpenClaw 会改为选择允许的 guardian 权限。当会话启用 OpenClaw 沙箱时，OpenClaw 会在该轮次禁用
Codex 原生代码模式、用户 MCP 服务器以及应用支持的插件执行，而不是依赖 Codex 主机侧沙箱隔离。
当常规 exec/process 工具可用时，Shell 访问会通过 OpenClaw 沙箱支持的动态工具暴露，
例如 `sandbox_exec` 和 `sandbox_process`。

当你希望 Codex 在沙箱逃逸或额外权限之前执行原生自动审查时，使用标准化的 OpenClaw exec 模式：

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

对于 Codex 应用服务器会话，OpenClaw 会将 `tools.exec.mode: "auto"` 映射为 Codex
Guardian 审查的审批，通常是在本地要求允许这些值时使用
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和
`sandbox: "workspace-write"`。在 `tools.exec.mode: "auto"` 中，OpenClaw 不会保留旧版不安全的
Codex `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆盖；如果有意采用无需审批的
Codex 姿态，请使用 `tools.exec.mode: "full"`。旧版
`plugins.entries.codex.config.appServer.mode: "guardian"` 预设仍然有效，但
`tools.exec.mode: "auto"` 是标准化的 OpenClaw 表面。

有关与主机 exec 审批和 ACPX 权限的模式级比较，请参阅 [权限模式](/zh-CN/tools/permission-modes)。

有关每个应用服务器字段、凭证顺序、环境隔离、发现和超时行为，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 命令和诊断

内置插件会在任何支持 OpenClaw 文本命令的渠道上注册 `/codex` 作为斜杠命令。

原生执行和控制需要所有者或 `operator.admin` Gateway 网关客户端。这包括绑定或恢复线程、
发送或停止轮次、更改模型、快速模式或权限状态、压缩或审查，以及解除绑定。其他已授权发送者保留只读的状态、
帮助、账户、模型、线程、MCP 服务器、技能和绑定检查命令。

常见形式：

- `/codex status` 检查应用服务器连接、模型、账户、速率限制、MCP 服务器和技能。
- `/codex models` 列出实时 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 应用服务器线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex 应用服务器压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审查。
- `/codex diagnostics [note]` 会在发送已附加线程的 Codex 反馈前请求确认。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器技能。

对于大多数支持报告，请在发生 bug 的对话中从 `/diagnostics [note]` 开始。它会创建一份
Gateway 网关诊断报告，并且对于 Codex harness 会话，请求批准发送相关的 Codex 反馈包。
有关隐私模型和群聊行为，请参阅 [诊断导出](/zh-CN/gateway/diagnostics)。

仅当你明确想要为当前已附加线程上传 Codex 反馈、且不需要完整 Gateway 网关诊断包时，
才使用 `/codex diagnostics [note]`。

### 本地检查 Codex 线程

检查异常 Codex 运行的最快方式通常是直接打开原生 Codex 线程：

```bash
codex resume <thread-id>
```

从已完成的 `/diagnostics` 回复、`/codex binding` 或 `/codex threads [filter]` 获取线程 ID。

有关上传机制和运行时级诊断边界，请参阅
[Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#codex-feedback-upload)。

凭证按以下顺序选择：

1. 智能体的有序 OpenAI 凭证配置，最好位于 `auth.order.openai` 下。运行
   `openclaw doctor --fix` 以迁移较旧的旧版 Codex 凭证配置 ID 和旧版 Codex 凭证顺序。
2. 该智能体 Codex 主目录中的应用服务器现有账户。
3. 仅对于本地 stdio 应用服务器启动，在没有应用服务器账户且仍需要 OpenAI 凭证时，先使用
   `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅风格的 Codex 凭证配置时，它会从生成的 Codex 子进程中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。这会让 Gateway 网关级 API key 仍可用于嵌入或直连 OpenAI 模型，
而不会意外让原生 Codex 应用服务器轮次通过 API 计费。显式 Codex API-key 配置和本地 stdio 环境键回退会使用应用服务器登录，
而不是继承的子进程环境。WebSocket 应用服务器连接不会接收 Gateway 网关环境 API-key 回退；请使用显式凭证配置或远程应用服务器自己的账户。
配置原生 Codex plugins 后，OpenClaw 会先通过已连接的应用服务器安装或刷新这些插件，然后再把插件拥有的应用暴露给
Codex 线程。`app/list` 仍然是应用 ID、可访问性和元数据的事实来源，但 OpenClaw 拥有每线程启用决策：
如果策略允许某个列出的可访问应用，即使 `app/list` 当前报告该应用已禁用，OpenClaw 也会发送
`thread/start.config.apps[appId].enabled = true`。此路径不会为未知 ID 发明应用安装；
OpenClaw 只会使用 `plugin/install` 激活 marketplace 插件，然后刷新清单。

如果订阅配置触发 Codex 使用量限制，OpenClaw 会在 Codex 报告重置时间时记录该时间，并为同一次
Codex 运行尝试下一个有序凭证配置。重置时间过后，该订阅配置会再次变为可用，而无需更改所选
`openai/gpt-*` 模型或 Codex 运行时。

对于本地 stdio 应用服务器启动，OpenClaw 会将 `CODEX_HOME` 设置为每智能体目录，使 Codex 配置、
凭证/账户文件、插件缓存/数据和原生线程状态默认不会读取或写入操作员个人的 `~/.codex`。
OpenClaw 会保留正常进程 `HOME`；Codex 运行的子进程仍可找到用户主目录配置和令牌，并且 Codex 可能发现共享的
`$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json` 条目。

如果部署需要额外环境隔离，请将这些变量添加到 `appServer.clearEnv`：

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

`appServer.clearEnv` 仅影响生成的 Codex 应用服务器子进程。
OpenClaw 会在本地启动规范化期间从此列表中移除 `CODEX_HOME` 和 `HOME`：
`CODEX_HOME` 保持为每智能体目录，`HOME` 保持继承，以便子进程可以使用正常的用户主目录状态。

Codex 动态工具默认使用 `searchable` 加载。OpenClaw 不会暴露与 Codex 原生工作区操作重复的动态工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。其余大多数 OpenClaw 集成工具，例如消息、媒体、cron、浏览器、节点、Gateway 网关和 `heartbeat_respond`，都可通过 Codex 工具搜索在 `openclaw` 命名空间下使用，从而减小初始模型上下文。启用搜索且未选择托管提供商时，Web 搜索默认使用 Codex 托管的 `web_search` 工具。原生托管搜索和 OpenClaw 托管的 `web_search` 动态工具互斥，因此托管搜索不能绕过原生域名限制。当托管搜索不可用、被显式禁用，或被选定的托管提供商替换时，OpenClaw 会使用托管工具。OpenClaw 保持禁用 Codex 独立的 `web.run` 扩展，因为生产应用服务器流量会拒绝其用户定义的 `web` 命名空间。`tools.web.search.enabled: false` 会禁用这两条路径，禁用工具的仅 LLM 运行也同样如此。Codex 将 `"cached"` 视为偏好，并在不受限的应用服务器轮次中将其解析为实时外部访问。设置原生 `allowedDomains` 时，自动托管回退会以关闭方式失败，因此允许列表无法被绕过。持久的有效搜索策略变更会在下一轮之前轮换绑定的 Codex 线程。每轮临时限制会使用一个临时受限线程，并保留现有绑定以供后续恢复。`sessions_yield` 和仅消息工具来源回复保持直接模式，因为这些是轮次控制契约。`sessions_spawn` 保持可搜索，因此 Codex 原生的 `spawn_agent` 仍是主要的 Codex 子智能体界面，同时仍可通过 `openclaw` 动态工具命名空间使用显式 OpenClaw 或 ACP 委派。Heartbeat 协作说明会告诉 Codex：当工具尚未加载时，在结束 Heartbeat 轮次前先搜索 `heartbeat_respond`。

仅在连接到无法搜索延迟动态工具的自定义 Codex 应用服务器，或调试完整工具载荷时，才设置 `codexDynamicToolsLoading: "direct"`。

支持的顶层 Codex 插件字段：

| 字段                       | 默认值         | 含义                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 将 OpenClaw 动态工具直接放入初始 Codex 工具上下文。                     |
| `codexDynamicToolsExclude` | `[]`           | 要从 Codex 应用服务器轮次中省略的其他 OpenClaw 动态工具名称。                           |
| `codexPlugins`             | 已禁用         | 面向已迁移的源码安装精选插件的原生 Codex 插件/应用支持。                                |

支持的 `appServer` 字段：

| 字段                                          | 默认值                                                 | 含义                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                                                                                                                                                                                                                          |
| `command`                                     | 托管的 Codex 二进制文件                                | stdio 传输协议的可执行文件。留空以使用托管二进制文件；仅在需要显式覆盖时设置。                                                                                                                                                                                                                                                                                                                  |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输协议的参数。                                                                                                                                                                                                                                                                                                                                                                          |
| `url`                                         | 未设置                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未设置                                                 | WebSocket 传输协议的 Bearer 令牌。接受字面字符串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 额外的 WebSocket 标头。标头值接受字面字符串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                            |
| `clearEnv`                                    | `[]`                                                   | 在 OpenClaw 构建继承环境后，从生成的 stdio app-server 进程中移除的额外环境变量名称。OpenClaw 会为本地启动保留每个 Agent 的 `CODEX_HOME` 和继承的 `HOME`。                                                                                                                                                                                                                                      |
| `codeModeOnly`                                | `false`                                                | 选择启用 Codex 的仅代码模式工具表面。OpenClaw 动态工具仍会注册到 Codex，因此嵌套的 `tools.*` 调用会通过 app-server `item/tool/call` 桥接返回。                                                                                                                                                                                                                                                  |
| `remoteWorkspaceRoot`                         | 未设置                                                 | 远程 Codex app-server 工作区根目录。设置后，OpenClaw 会从解析后的 OpenClaw 工作区推断本地工作区根目录，在此远程根目录下保留当前 cwd 后缀，并仅向 Codex 发送最终的 app-server cwd。如果 cwd 位于解析后的 OpenClaw 工作区根目录之外，OpenClaw 会 fail closed，而不是向远程 app-server 发送 Gateway 网关本地路径。                                                                           |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面调用的超时时间。                                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一个轮次后，或在轮次作用域的 app-server 请求后，OpenClaw 等待 `turn/completed` 时的静默窗口。                                                                                                                                                                                                                                                                                         |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | 在工具交接、原生工具完成、工具后原始 assistant 进度、原始 reasoning 完成或 reasoning 进度之后，OpenClaw 等待 `turn/completed` 时使用的完成空闲和进度保护。对于受信任或重型工作负载，如果工具后综合可以合理地比最终 assistant 发布预算保持更长静默时间，请使用此项。                                                                                                                           |
| `mode`                                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO               | YOLO 或 guardian 审核执行的预设。本地 stdio 要求如果省略 `danger-full-access`、`never` 审批或 `user` 审核者，隐式默认值会变为 guardian。                                                                                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` 或允许的 guardian 审批策略                   | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。guardian 默认值会在允许时优先使用 `"on-request"`。                                                                                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` 或允许的 guardian 沙箱          | 发送到线程启动/恢复的原生 Codex 沙箱模式。guardian 默认值会在允许时优先使用 `"workspace-write"`，否则使用 `"read-only"`。当 OpenClaw 沙箱处于活动状态时，`danger-full-access` 轮次会使用 Codex `workspace-write`，其网络访问权限派生自 OpenClaw 沙箱出口设置。                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` 或允许的 guardian 审核者                      | 使用 `"auto_review"` 可在允许时让 Codex 审核原生审批提示，否则使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是旧版别名。                                                                                                                                                                                                                                                            |
| `serviceTier`                                 | 未设置                                                 | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求 flex 处理，`null` 清除覆盖项，旧版 `"fast"` 会被接受为 `"priority"`。                                                                                                                                                                                                                                            |
| `networkProxy`                                | 已禁用                                                 | 选择为 app-server 命令启用 Codex 权限配置文件网络。OpenClaw 会定义选定的 `permissions.<profile>.network` 配置，并用 `default_permissions` 选择它，而不是发送 `sandbox`。                                                                                                                                                                                                                       |
| `experimental.sandboxExecServer`              | `false`                                                | 预览版选择启用项，会向 Codex app-server 0.132.0 或更新版本注册一个由 OpenClaw 沙箱支持的 Codex 环境，使原生 Codex 执行可以在当前活动的 OpenClaw 沙箱内运行。                                                                                                                                                                                                                                  |

`appServer.networkProxy` 是显式项，因为它会改变 Codex 沙箱
契约。启用后，OpenClaw 还会在 Codex 线程配置中设置 `features.network_proxy.enabled` 和
`default_permissions`，这样生成的权限
配置文件就可以启动 Codex 托管网络。默认情况下，OpenClaw 会根据
配置文件正文生成一个抗冲突的 `openclaw-network-<fingerprint>` 配置文件名称；仅在需要稳定的本地名称时使用 `profileName`。

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

如果正常的 app-server 运行时会是 `danger-full-access`，启用
`networkProxy` 会为生成的
权限配置文件使用工作区风格的文件系统访问。Codex 托管网络强制执行属于沙箱隔离网络，
因此 full-access 配置文件无法保护出站流量。
域名条目使用 `allow` 或 `deny`；Unix socket 条目使用 Codex 的
`allow` 或 `none` 值。

OpenClaw 拥有的动态工具调用与 `appServer.requestTimeoutMs` 独立设限：Codex `item/tool/call` 请求默认使用 90 秒的 OpenClaw 看门狗。正数的单次调用 `timeoutMs` 参数会延长或缩短该特定工具预算。`image_generate` 工具在工具调用未提供自身超时时使用 `agents.defaults.imageGenerationModel.timeoutMs`，否则使用 120 秒的图像生成默认值。媒体理解 `image` 工具使用 `tools.media.image.timeoutSeconds`，或其 60 秒媒体默认值。对于图像理解，该超时适用于请求本身，不会因之前的准备工作而减少。动态工具预算上限为 600000 ms。超时时，OpenClaw 会在支持的地方中止工具信号，并向 Codex 返回失败的动态工具响应，使该轮次可以继续，而不是让会话停留在 `processing`。这个看门狗是外层动态 `item/tool/call` 预算；提供商特定的请求超时在该调用内部运行，并保留自身的超时语义。

在 Codex 接受一个轮次之后，以及 OpenClaw 响应一个轮次作用域的 app-server 请求之后，harness 会期望 Codex 推进当前轮次，并最终用 `turn/completed` 完成原生轮次。如果 app-server 在 `appServer.turnCompletionIdleTimeoutMs` 时间内保持静默，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw 会话通道，使后续聊天消息不会排在过时的原生轮次之后。多数同一轮次的非终止通知会解除这个短看门狗，因为 Codex 已证明该轮次仍然存活。工具交接使用更长的工具后空闲预算：在 OpenClaw 返回 `item/tool/call` 响应之后，在 `commandExecution` 等原生工具项完成之后，在原始 `custom_tool_call_output` 完成之后，以及在工具后的原始 assistant 进度、原始 reasoning 完成或 reasoning 进度之后。该保护在配置时使用 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否则默认五分钟。同一个工具后预算还会延长 Codex 发出下一个当前轮次事件之前静默合成窗口的进度看门狗。全局 app-server 通知（如速率限制更新）不会重置轮次空闲进度。reasoning 完成、commentary `agentMessage` 完成，以及工具前原始 reasoning 或 assistant 进度之后可能跟随自动最终回复，因此它们使用进度后回复保护，而不是立即释放会话通道。只有最终/非 commentary 的已完成 `agentMessage` 项以及工具前原始 assistant 完成会启用 assistant 输出释放：如果 Codex 随后保持静默且没有 `turn/completed`，OpenClaw 会尽力中断原生轮次并释放会话通道。如果另一个轮次监视赢得了这次释放竞态，只要没有原生请求、项目或动态工具完成仍处于活动状态，并且 assistant 输出释放仍属于最新完成的项目且之后没有项目完成，OpenClaw 仍会接受已完成的最终 assistant 项。这可以在已完成工具工作之后保留最终答案，而不重放该轮次。部分 assistant 增量、过时的早期回复以及之后的空完成不符合条件。可重放安全的 stdio app-server 故障，包括没有 assistant、工具、活动项目或副作用证据的轮次完成空闲超时，会在一次新的 app-server 尝试中重试一次。不安全的超时仍会弃用卡住的 app-server 客户端并释放 OpenClaw 会话通道。它们还会清除过时的原生线程绑定，而不是自动重放。完成监视超时会显示 Codex 特定的超时文本：可重放安全的情况会说明响应可能不完整，而不安全的情况会告知用户在重试前验证当前状态。公开超时诊断包括结构化字段，例如最后一个 app-server 通知方法、原始 assistant 响应项目 id/type/role、活动 request/item 计数，以及已启用的监视状态。当最后一个通知是原始 assistant 响应项目时，它们还会包含有界的 assistant 文本预览。它们不会包含原始 prompt 或工具内容。

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当未设置 `appServer.command` 时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，更推荐配置，因为它会将插件行为保留在与其余 Codex harness 设置相同的已审阅文件中。

## Native Codex plugins

Native Codex plugin 支持在与 OpenClaw harness 轮次相同的 Codex 线程中使用 Codex app-server 自身的应用和插件能力。OpenClaw 不会把 Codex 插件转换为合成的 `codex_plugin_*` OpenClaw 动态工具。

`codexPlugins` 只影响选择原生 Codex harness 的会话。它不会影响内置 harness 运行、普通 OpenAI provider 运行、ACP 会话绑定或其他 harness。

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

线程应用配置会在 OpenClaw 建立 Codex harness 会话或替换过时的 Codex 线程绑定时计算。它不会在每个轮次重新计算。更改 `codexPlugins` 后，请使用 `/new`、`/reset`，或重启 Gateway 网关，使未来的 Codex harness 会话使用更新后的应用集启动。

关于迁移资格、应用清单、破坏性操作策略、elicitation 和原生插件诊断，请参见 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。

OpenAI 侧应用和插件访问由已登录的 Codex 账号控制；对于 Business 和 Enterprise/Edu 工作区，还由工作区应用控制项控制。有关 OpenAI 账号和工作区控制概览，请参见 [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 计算机使用

计算机使用有自己的设置指南：
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

简短版：OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作。它会准备 Codex app-server，验证 `computer-use` MCP 服务器可用，然后让 Codex 在 Codex 模式轮次期间拥有原生 MCP 工具调用。

## 运行时边界

Codex harness 只更改低层嵌入式智能体执行器。

- 支持 OpenClaw 动态工具。Codex 要求 OpenClaw 执行这些工具，因此 OpenClaw 仍在执行路径中。
- Codex 原生 shell、patch、MCP 和原生应用工具由 Codex 拥有。OpenClaw 可以通过受支持的 relay 观察或阻止选定的原生事件，但不会重写原生工具参数。
- Codex 拥有原生压缩。OpenClaw 为频道历史、搜索、`/new`、`/reset` 以及未来模型或 harness 切换保留一份 transcript 镜像，但不会用 OpenClaw 或 context-engine summarizer 替换 Codex 压缩。
- 媒体生成、媒体理解、TTS、审批和消息工具输出继续通过匹配的 OpenClaw 提供商/模型设置。
- `tool_result_persist` 适用于 OpenClaw 拥有的 transcript 工具结果，而不是 Codex 原生工具结果记录。

关于钩子层、受支持的 V1 表面、原生权限处理、队列引导、Codex 反馈上传机制和压缩细节，请参见 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)。

## 故障排除

**Codex 未显示为普通 `/model` 提供商：** 对于新配置，这是预期行为。选择一个 `openai/gpt-*` 模型，启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用内置 harness 而不是 Codex：** 确保模型 ref 是官方 OpenAI provider 上的 `openai/gpt-*`，并且 Codex 插件已安装且启用。如果测试时需要严格证明，请设置提供商或模型 `agentRuntime.id: "codex"`。强制 Codex 运行时会失败，而不是回退到 OpenClaw。

**OpenAI Codex 运行时回退到 API key 路径：** 收集一段已脱敏的 Gateway 网关摘录，显示模型、运行时、所选提供商和失败。请受影响的协作者在他们的 OpenClaw 主机上运行这个只读命令：

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

有用的摘录通常包含 `openai/gpt-5.5` 或 `openai/gpt-5.4`、`Runtime: OpenAI Codex`、`agentRuntime.id` 或 `harnessRuntime`、`candidateProvider: "openai"`，以及 `401`、`Incorrect API key` 或 `No API key` 结果。修正后的运行应显示 OpenAI OAuth 路径，而不是普通的 OpenAI API key 失败。

**旧版 Codex 模型 ref 配置仍然存在：** 运行 `openclaw doctor --fix`。Doctor 会将旧版模型 ref 重写为 `openai/*`，移除过时的会话和整智能体运行时固定项，并保留现有 auth-profile 覆盖。

**app-server 被拒绝：** 使用 Codex app-server `0.125.0` 或更新版本。相同版本的预发布或带构建后缀的版本（例如 `0.125.0-alpha.2` 或 `0.125.0+custom`）会被拒绝，因为 OpenClaw 测试的是稳定的 `0.125.0` 协议下限。

**`/codex status` 无法连接：** 检查内置 `codex` 插件是否已启用，配置 allowlist 时 `plugins.allow` 是否包含它，以及任何自定义 `appServer.command`、`url`、`authToken` 或 headers 是否有效。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。请参见 [Codex harness reference](/zh-CN/plugins/codex-harness-reference#model-discovery)。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`、headers，以及远程 app-server 是否使用相同的 Codex app-server 协议版本。

**原生 shell 或 patch 工具因 `Native hook relay unavailable` 被阻止：**
Codex 线程仍在尝试使用 OpenClaw 不再注册的原生 hook relay id。这是原生 Codex hook 传输问题，不是 ACP 后端、提供商、GitHub 或 shell 命令失败。在受影响的聊天中使用 `/new` 或 `/reset` 启动新会话，然后重试一个无害命令。如果该命令成功一次，但下一次原生工具调用又失败，请仅将 `/new` 视为临时解决方法：重启 Codex app-server 或 OpenClaw Gateway 网关后，将提示复制到新会话中，这样旧线程会被丢弃，原生 hook 注册会被重新创建。

**非 Codex 模型使用内置 harness：**除非提供商或模型运行时策略将其路由到另一个 harness，否则这是预期行为。普通非 OpenAI 提供商 ref 在 `auto` 模式下会保留在其正常提供商路径上。

**Computer Use 已安装但工具不运行：**从新会话中检查 `/codex computer-use status`。如果某个工具报告 `Native hook relay unavailable`，请使用上面的原生 hook relay 恢复步骤。参见 [Codex Computer Use](/zh-CN/plugins/codex-computer-use#troubleshooting)。

## 相关内容

- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
- [Agent Runtimes](/zh-CN/concepts/agent-runtimes)
- [模型提供商](/zh-CN/concepts/model-providers)
- [OpenAI provider](/zh-CN/providers/openai)
- [OpenAI Codex 帮助](https://help.openai.com/en/collections/14937394-codex)
- [Agent harness plugins](/zh-CN/plugins/sdk-agent-harness)
- [插件钩子](/zh-CN/plugins/hooks)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [状态](/zh-CN/cli/status)
- [测试](/zh-CN/help/testing-live#live-codex-app-server-harness-smoke)
