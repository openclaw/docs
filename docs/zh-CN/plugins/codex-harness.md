---
read_when:
    - 你想使用官方 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅 Codex 部署在出错时直接失败，而不是回退到 OpenClaw
summary: 通过官方 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-07-14T13:48:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 3e18f58b3013523b38a6491f7e36e88b270c87102def1451d26c1bee33802f81
    source_path: plugins/codex-harness.md
    workflow: 16
---

OpenClaw 官方 `codex` 插件通过 Codex app-server 而非内置的 OpenClaw harness 运行嵌入式 OpenAI 智能体轮次。Codex 负责底层智能体会话：原生线程恢复、原生工具续接、原生压缩和 app-server 执行。OpenClaw 仍负责聊天渠道、会话文件、模型选择、OpenClaw 动态工具、审批、媒体传送以及可见的转录镜像。

请使用规范的 OpenAI 模型引用，例如 `openai/gpt-5.6-sol`。不要配置旧版 Codex GPT 引用；将 OpenAI 智能体身份验证顺序放在 `auth.order.openai` 下。旧版 Codex 身份验证配置文件 ID 和旧版 Codex 身份验证顺序条目由 `openclaw doctor --fix` 修复。

当提供商/模型运行时策略未设置或为 `auto` 时，仅凭 `openai/*` 前缀绝不会选择此 harness。仅当路由是精确的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且没有手动指定的请求覆盖时，OpenAI 才可能隐式选择 Codex。请参阅
[OpenAI 隐式智能体运行时](/zh-CN/providers/openai#implicit-agent-runtime)。
如果在确定 Platform 与 ChatGPT 路由之前由 Codex 负责身份验证，OpenClaw 仍要求每个候选路由都声明与 Codex 兼容。仅由原生层负责身份验证绝不会绕过该路由检查。

当 OpenClaw 沙箱未激活时，OpenClaw 会启动已启用 Codex 原生代码模式的 Codex app-server 线程（默认仍不启用仅代码模式），因此原生工作区/代码能力仍可与通过 app-server `item/tool/call` 桥接路由的 OpenClaw 动态工具一起使用。除非选择实验性的沙箱 exec-server 路径，否则激活的 OpenClaw 沙箱或受限工具策略会完全禁用原生代码模式。

使用默认的 `tools.exec.host: "auto"` 且没有激活的 OpenClaw 沙箱时，Codex 还会收到用于在已配对节点上执行命令的 `node_exec` 和 `node_process` 工具。原生 shell 仍位于 Codex app-server 主机和工作区中（默认 stdio 部署时位于 Gateway 网关本地）；`node_exec` 按名称或 ID 选择节点，并继续强制执行 OpenClaw 的节点审批策略。

此 Codex 原生功能不同于
[OpenClaw 代码模式](/zh-CN/reference/code-mode)，后者是一种可选的 QuickJS-WASI 运行时，用于具有不同 `exec` 输入结构的通用 OpenClaw 运行。有关更广泛的模型/提供商/运行时划分，请先阅读
[Agent Runtimes](/zh-CN/concepts/agent-runtimes)：`openai/gpt-5.6-sol` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道是通信界面。

## 要求

- 已安装官方 `@openclaw/codex` 插件。如果配置使用允许列表，请在
  `plugins.allow` 中包含 `codex`。
- Codex app-server `0.143.0` 或更高版本。该插件默认管理兼容的二进制文件，因此 `PATH` 上的 `codex` 命令不会影响正常启动。
- 通过 `openclaw models auth login --provider openai`、智能体 Codex 主目录中已存在的 app-server 账户，或显式 Codex API 密钥身份验证配置文件进行 Codex 身份验证。

有关身份验证优先级、环境隔离、自定义 app-server 命令、模型发现和完整配置字段列表，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 快速开始

安装官方插件，然后使用 Codex OAuth 登录：

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

启用 `codex` 插件并选择 OpenAI 智能体模型：

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

如果配置使用 `plugins.allow`，也请在其中添加 `codex`：

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

更改插件配置后，重启 Gateway 网关。如果聊天已有会话，请先运行 `/new` 或 `/reset`，以便下一轮根据当前配置解析 harness。

## 与 Codex Desktop 和 CLI 共享线程

默认的 `appServer.homeScope: "agent"` 会将每个 OpenClaw 智能体与操作员的原生 Codex 状态隔离开。若要让所有者检查和管理 Codex Desktop 与 Codex CLI 中显示的相同原生线程，请选择使用用户 Codex 主目录：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

用户主目录模式支持本地托管的 stdio 进程或共享 Unix 套接字传输。设置 `$CODEX_HOME` 时使用该值，否则使用 `~/.codex`，包括该主目录的原生 Codex 身份验证、配置、插件和线程存储。OpenClaw 不会向此 app-server 注入 OpenClaw 身份验证配置文件。

所有者轮次会获得 `codex_threads` 工具：列出、搜索、读取、复刻、重命名、归档和恢复原生线程。复刻线程即可在 OpenClaw 中继续使用；该复刻会附加到当前 OpenClaw 会话，并继续对其他原生 Codex 客户端可见。归档要求明确确认该线程已在其他位置关闭。同时启用监督时，转录字段和变更操作需要选择启用对应的 `supervision.allowRawTranscripts` 或 `supervision.allowWriteControls`。

不要通过相互独立的托管 stdio App Server 并发恢复或写入同一线程。Codex 会协调单个 App Server 内的活动写入者，但不会跨独立进程进行协调。对于普通用户主目录 stdio 会话，复刻是安全共存的方式。

仅 `appServer.homeScope: "user"` 不会控制工作实例目录。插件激活时会启用原生会话发现；将 `sessionCatalog.enabled: false` 设为禁用可将其从 OpenClaw 侧边栏中移除，而无需禁用 Codex。该目录使用独立的监督连接；如果未显式配置 `appServer` 连接设置，则该连接默认为托管的用户主目录 stdio，而普通 harness 仍限定于智能体作用域。两个路径都会采用显式的 `appServer` 设置。当普通 harness 也应共享原生状态时，请像上例一样显式设置 `homeScope: "user"`。

## 监督 Codex 会话

同一个 `codex` 插件可以列出 Gateway 网关计算机和已选择启用的配对节点中未归档的 Codex 会话。已存储或空闲的 Gateway 网关本地会话可以创建锁定模型的聊天，镜像其受限范围内已持久化的用户和助手历史记录。其私有绑定使用监督连接获取原生快照、规范分支和后续轮次，而普通 Codex 会话仍限定于智能体作用域。首次规范启动会完全采用 Codex 为快照复刻返回的模型和提供商。后续恢复由 Codex 原生配置决定选择；外层 OpenClaw 模型和回退链绝不会将其替换。明确确认没有其他运行程序后，可以归档已存储和空闲的条目。活动来源无法创建分支或归档；仍可打开现有的受监督聊天。配对节点会话仍仅包含元数据。

有关设置、分支规则、配对节点限制、元数据公开和故障排除，请参阅[监督 Codex 会话](/zh-CN/plugins/codex-supervision)。

## 配置

| 需求                                                | 设置                                                                                              | 位置                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 启用 harness                                  | `plugins.entries.codex.enabled: true`                                                            | OpenClaw 配置                    |
| 隐藏原生 Codex 会话发现                 | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Codex 插件配置                |
| 保留允许列表中的插件安装                  | 在 `plugins.allow` 中包含 `codex`                                                               | OpenClaw 配置                    |
| 允许符合条件的 OpenAI 轮次隐式使用 Codex | 精确的官方 HTTPS Responses/ChatGPT 路由、没有手动指定的请求覆盖、运行时未设置或为 `auto` | OpenAI 提供商/模型配置       |
| 使用 ChatGPT/Codex OAuth 登录                    | `openclaw models auth login --provider openai`                                                   | CLI 身份验证配置文件                   |
| 为 Codex 运行添加 API 密钥备用项                   | 在 `auth.order.openai` 中将 `openai:*` API 密钥配置文件列在订阅身份验证之后                 | CLI 身份验证配置文件 + OpenClaw 配置 |
| Codex 不可用时以失败方式关闭               | 提供商或模型 `agentRuntime.id: "codex"`                                                     | OpenClaw 模型/提供商配置     |
| 使用直接 OpenAI API 流量                       | 提供商或模型 `agentRuntime.id: "openclaw"`，并使用普通 OpenAI 身份验证                          | OpenClaw 模型/提供商配置     |
| 调整 app-server 行为                            | `plugins.entries.codex.config.appServer.*`                                                       | Codex 插件配置                |
| 启用原生 Codex 插件应用                     | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex 插件配置                |
| 启用 Codex Computer Use                           | `plugins.entries.codex.config.computerUse.*`                                                     | Codex 插件配置                |

订阅优先、API 密钥备用的顺序应优先使用 `auth.order.openai`。现有旧版 Codex 身份验证配置文件 ID 和旧版 Codex 身份验证顺序是仅供 Doctor 处理的旧版状态；不要写入新的旧版 Codex GPT 引用。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

对于与 Codex 兼容的有效路由，上述两个配置文件仍是同一次 Codex 运行的候选项。配置文件顺序选择凭据，而非运行时。更改身份验证顺序不会使自定义、Completions、HTTP 或请求被覆盖的路由与 Codex 兼容。

### 压缩

不要在由 Codex 支持的智能体上设置 `compaction.model` 或 `compaction.provider`。Codex 通过其原生 app-server 线程状态执行压缩，因此 OpenClaw 会在运行时忽略这些本地摘要器覆盖，并且当智能体使用 Codex 时，`openclaw doctor --fix` 会将其移除。

Lossless 仍可作为上下文引擎使用，用于围绕 Codex 轮次进行组装、摄取和维护；应通过 `plugins.slots.contextEngine: "lossless-claw"` 和 `plugins.entries.lossless-claw.config.summaryModel` 配置，而非通过 `agents.defaults.compaction.provider`。当 Codex 是活动运行时时，`openclaw doctor --fix` 会将旧的 `compaction.provider: "lossless-claw"` 结构迁移到 Lossless 上下文引擎槽位，但原生 Codex 仍负责压缩。原生 app-server harness 支持需要提示前组装的上下文引擎；包括 `codex-cli` 在内的通用 CLI 后端不提供该宿主能力。

对于由 Codex 支持的智能体，`/compact` 会在绑定的线程上启动原生 Codex app-server 压缩。OpenClaw 不会等待其完成、施加 OpenClaw 超时、重启共享 app-server，也不会回退到上下文引擎或公共 OpenAI 摘要器。如果原生 Codex 线程绑定缺失或已失效，该命令会以失败方式关闭，而非静默切换压缩后端。

本页其余部分介绍部署结构、以失败方式关闭的路由、guardian 审批策略、原生 Codex 插件和 Computer Use。有关完整选项列表、默认值、枚举、发现、环境隔离、超时和 app-server 传输字段，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 验证 Codex 运行时

在预期使用 Codex 的聊天中使用 `/status`。由 Codex 支持的 OpenAI 智能体轮次会显示：

```text
运行时：OpenAI Codex
```

然后检查 Codex app-server 状态：

```text
/codex status
/codex models
```

`/codex status` 报告 app-server 连接性、账户、速率限制、MCP
服务器和 Skills。`/codex models` 列出该 Codex harness 和账户的实时 Codex app-server 目录。
如果 `/status` 的结果出乎意料，请参阅
[故障排查](#troubleshooting)。

## 路由和模型选择

将提供商引用与运行时策略分开：

- 使用 `openai/gpt-*` 进行规范的 OpenAI 模型选择。仅有前缀
  绝不会选择 Codex。
- 当运行时未设置或为 `auto` 时，仅当路由是完全匹配的官方 HTTPS Platform Responses
  或 ChatGPT Responses 路由，且没有手动指定的请求覆盖项时，才可以隐式选择 Codex。
- 不要在配置中使用旧版 Codex GPT 引用；运行 `openclaw doctor --fix`
  修复旧版引用和过时的会话路由固定项。
- `agentRuntime.id: "codex"` 将 Codex 设为兼容路由的
  故障关闭要求。它不会使不兼容的有效路由变得兼容。
- `agentRuntime.id: "openclaw"` 在有意如此配置时，让提供商或模型使用嵌入式
  OpenClaw 运行时。
- `/codex ...` 从聊天中控制原生 Codex app-server 对话。
- ACP/acpx 是一条独立的外部 harness 路径。仅当用户
  要求使用 ACP/acpx 或外部 harness 适配器时才使用它。

| 用户意图                                                | 使用                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加当前聊天                                    | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| 恢复现有 Codex 线程                            | `/codex resume <thread-id>`                                                                           |
| 列出或筛选 Codex 线程                               | `/codex threads [filter]`                                                                             |
| 列出原生 Codex 插件                                  | `/codex plugins list`                                                                                 |
| 启用或禁用已配置的原生 Codex 插件         | `/codex plugins enable <name>`、`/codex plugins disable <name>`                                       |
| 将已存储的 Codex CLI 会话恢复为配对节点轮次    | `/codex sessions --host <node> [filter]`，然后运行 `/codex resume <session-id> --host <node> --bind here` |
| 查看跨计算机的未归档 Codex 会话          | 启用 Codex 监督功能并打开 **Codex 会话**                                                  |
| 更改已绑定线程的模型、快速模式或权限 | `/codex model <model>`、`/codex fast [on\|off\|status]`、`/codex permissions [default\|yolo\|status]` |
| 停止或引导活动轮次                              | `/codex stop`、`/codex steer <text>`                                                                  |
| 分离当前绑定                                 | `/codex detach`（别名 `/codex unbind`）                                                               |
| 仅发送 Codex 反馈                                   | `/codex diagnostics [note]`                                                                           |
| 启动 ACP/acpx 任务                                     | 使用 ACP/acpx 会话命令，而不是 `/codex`                                                               |

| 使用场景                                        | 配置                                                                                                   | 验证                                  | 备注                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| 使用原生 Codex 运行时的合格 OpenAI 路由 | 完全匹配的官方 HTTPS Responses/ChatGPT 路由，不含手动指定的请求覆盖项，并启用 `codex` 插件 | `/status` 显示 `Runtime: OpenAI Codex` | 运行时未设置或为 `auto` 时使用的隐式路径 |
| Codex 不可用时故障关闭             | 提供商或模型 `agentRuntime.id: "codex"`                                                                | 轮次失败，而不是回退到嵌入式运行时 | 用于仅限 Codex 的部署             |
| 通过 OpenClaw 传输直接 OpenAI API 密钥流量  | 提供商或模型 `agentRuntime.id: "openclaw"` 以及常规 OpenAI 身份验证                                      | `/status` 显示 OpenClaw 运行时        | 仅在有意使用 OpenClaw 时采用      |
| 旧版配置                                   | 旧版 Codex GPT 引用                                                                                       | `openclaw doctor --fix` 将其重写     | 不要以这种方式编写新配置           |
| ACP/acpx Codex 适配器                          | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP 任务/会话状态                 | 与原生 Codex harness 分离         |

`agents.defaults.imageModel` 遵循相同的前缀划分。常规 OpenAI 路由使用 `openai/gpt-*`，
仅当图像理解应通过有界的 Codex app-server 轮次运行时，才使用 `codex/gpt-*`。
Doctor 会将旧版 Codex GPT 引用重写为 `openai/gpt-*`。

## 部署模式

### 基础 Codex 部署

对于有效官方 HTTPS 路由可隐式选择 Codex 的 OpenAI 模型，
使用快速开始配置：

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### 混合提供商部署

将 Claude 保持为默认智能体，并添加一个命名的 Codex 智能体：

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
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

`main` 智能体使用其常规提供商路径。当 `codex` 智能体的有效 OpenAI 路由
保持兼容时，它会使用 Codex app-server；如果这应当成为故障关闭要求，
请添加显式的模型级 `agentRuntime.id: "codex"`。

### 故障关闭 Codex 部署

当内置插件可用时，符合条件且完全匹配的官方 HTTPS OpenAI 路由可以解析到 Codex。
为书面定义的故障关闭规则添加显式运行时策略：

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
      model: "openai/gpt-5.6-sol",
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

强制使用 Codex 时，如果有效路由未声明为与 Codex 兼容、插件已禁用、
app-server 版本过旧或 app-server 无法启动，OpenClaw 会提前失败。

## App-server 策略

默认情况下，插件通过 stdio 传输在本地启动由 OpenClaw 管理的 Codex 二进制文件。
仅在有意运行其他可执行文件时设置 `appServer.command`。
仅当 app-server 已在其他位置运行时，才使用 WebSocket 传输：

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

本地 stdio app-server 会话默认采用受信任的本地操作员安全姿态：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。如果本地 Codex 要求不允许这种隐式 YOLO 安全姿态，
OpenClaw 会改为选择允许的 Guardian 权限。当会话启用了 OpenClaw 沙箱时，
OpenClaw 会为该轮次禁用 Codex 原生代码模式、用户 MCP 服务器和应用支持的插件执行，
而不是依赖 Codex 主机侧的沙箱隔离。
当常规 Exec/进程工具可用时，Shell 访问会改为通过由 OpenClaw 沙箱支持的动态工具
（例如 `sandbox_exec` 和 `sandbox_process`）进行。

在逃逸沙箱或授予额外权限之前，为 Codex 原生自动审查使用规范化的 OpenClaw Exec 模式：

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

对于 Codex app-server 会话，`tools.exec.mode: "auto"` 会映射到由 Codex Guardian
审核的审批：当本地要求允许这些值时，通常为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
在 `tools.exec.mode: "auto"` 中，OpenClaw 不会保留旧版不安全的 Codex
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆盖项；
如需有意采用无需审批的 Codex 安全姿态，请使用 `tools.exec.mode: "full"`。
旧版 `plugins.entries.codex.config.appServer.mode: "guardian"` 预设仍然有效，
但 `tools.exec.mode: "auto"` 是规范化的 OpenClaw 配置面。

有关模式级别与主机 Exec 审批及 ACPX 权限的对比，请参阅
[权限模式](/zh-CN/tools/permission-modes)。有关所有 app-server 字段、身份验证顺序、
环境隔离和超时行为，请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 命令和诊断

`codex` 插件会在任何支持 OpenClaw 文本命令的渠道上，
将 `/codex` 注册为斜杠命令。

原生执行和控制需要所有者或 `operator.admin` Gateway 网关客户端：
绑定或恢复线程、发送或停止轮次、更改模型、快速模式或权限状态、
执行压缩或审查，以及分离绑定。其他已授权发送者仅能使用只读命令，
检查状态、帮助、账户、模型、线程、MCP 服务器、Skills 和绑定。

常见形式：

- `/codex status` 检查 app-server 连接性、模型、账户、速率
  限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex app-server 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到
  现有 Codex 线程。
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  附加当前聊天。
- `/codex detach`（或 `/codex unbind`）分离当前绑定。
- `/codex binding` 描述当前绑定。
- `/codex stop` 停止活动轮次；`/codex steer <text>` 引导该轮次。
- `/codex model <model>`、`/codex fast [on|off|status]` 和
  `/codex permissions [default|yolo|status]` 更改每个对话的状态。
- `/codex compact` 请求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生审查。
- `/codex diagnostics [note]` 在为已附加的线程发送 Codex 反馈前请求确认。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。
- `/codex plugins list`、`/codex plugins enable <name>` 和
  `/codex plugins disable <name>` 管理已配置的原生 Codex 插件。
- `/codex computer-use [status|install]` 管理 Codex Computer Use。
- `/codex help` 列出完整的命令树。

对于大多数支持请求，请先在发生错误的对话中使用 `/diagnostics [note]`。它会创建一份 Gateway 网关诊断报告；对于 Codex harness 会话，还会请求批准发送相关的 Codex 反馈包。有关隐私模型和群聊行为，请参阅[诊断导出](/zh-CN/gateway/diagnostics)。仅当你明确希望上传当前所附加线程的 Codex 反馈，而不需要完整的 Gateway 网关诊断包时，才使用 `/codex diagnostics [note]`。

### 在本地检查 Codex 线程

检查异常 Codex 运行的最快方法通常是直接打开原生 Codex 线程：

```bash
codex resume <thread-id>
```

从已完成的 `/diagnostics` 回复、`/codex binding` 或 `/codex threads [filter]` 中获取线程 ID。

有关上传机制和运行时级别的诊断边界，请参阅 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#codex-feedback-upload)。

### 身份验证顺序

在默认的按 Agent 隔离的主目录中，按以下顺序选择身份验证：

1. Agent 的有序 OpenAI 身份验证配置文件，最好位于
   `auth.order.openai` 下。运行 `openclaw doctor --fix` 以迁移较旧的遗留
   Codex 身份验证配置文件 ID 和遗留 Codex 身份验证顺序。
2. 该 Agent 的 Codex 主目录中 app-server 的现有账户。
3. 仅对于本地 stdio app-server 启动，当不存在 app-server 账户且仍需
   OpenAI 身份验证时，先使用 `CODEX_API_KEY`，再使用
   `OPENAI_API_KEY`。

当 OpenClaw 检测到 ChatGPT 订阅类型的 Codex 身份验证配置文件时，它会从生成的 Codex 子进程中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这样既能让 Gateway 网关级别的 API 密钥继续用于嵌入或直接调用 OpenAI 模型，又能避免原生 Codex app-server 轮次意外通过 API 计费。显式 Codex API 密钥配置文件和本地 stdio 环境密钥回退使用 app-server 登录，而不是继承子进程环境。WebSocket app-server 连接不会接收 Gateway 网关环境中的 API 密钥回退；请使用显式身份验证配置文件或远程 app-server 自有的账户。

如果订阅配置文件触及 Codex 使用限制，OpenClaw 会在 Codex 报告重置时间时记录该时间，并为同一次 Codex 运行尝试下一个有序身份验证配置文件。重置时间过后，该订阅配置文件会再次符合使用条件，而无需更改所选的 `openai/gpt-*` 模型或 Codex 运行时。

配置原生 Codex plugins 后，OpenClaw 会先通过已连接的 app-server 安装或刷新这些插件，再向 Codex 线程公开由插件所有的应用。`app/list` 仍是应用 ID、可访问性和元数据的事实来源，但 OpenClaw 负责决定每个线程是否启用：如果策略允许使用某个已列出且可访问的应用，即使 `app/list` 当前报告该应用已禁用，OpenClaw 仍会发送 `thread/start.config.apps[appId].enabled = true`。此路径不会为未知 ID 臆造应用安装；OpenClaw 仅通过 `plugin/install` 激活市场插件，然后刷新清单。

### 环境隔离

对于本地 stdio app-server 启动，OpenClaw 会将 `CODEX_HOME` 设置为按 Agent 隔离的目录，因此 Codex 配置、身份验证/账户文件、插件缓存/数据和原生线程状态默认不会读取或写入操作员个人的 `~/.codex`。OpenClaw 会保留正常的进程 `HOME`；Codex 运行的子进程仍可找到用户主目录中的配置和令牌，Codex 也可能发现共享的 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json` 条目。使用 `appServer.homeScope: "user"` 时，OpenClaw 会改用原生用户 Codex 主目录及其现有账户，而不注入 OpenClaw 身份验证配置文件。

如果部署需要额外的环境隔离，请将这些变量添加到 `appServer.clearEnv`：

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

`appServer.clearEnv` 仅影响生成的 Codex app-server 子进程。在本地启动规范化期间，OpenClaw 会从此列表中移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 会继续指向所选的 Agent 或用户作用域，而 `HOME` 会继续被继承，以便子进程使用正常的用户主目录状态。

### 动态工具和 Web 搜索

Codex 动态工具默认使用 `searchable` 加载。OpenClaw 不会公开与 Codex 原生工作区操作重复的动态工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`、`tool_call`、`tool_describe`、`tool_search` 和 `tool_search_code`。其余大多数 OpenClaw 集成工具（如消息、媒体、cron、浏览器、节点、Gateway 网关和 `heartbeat_respond`）都可通过 `openclaw` 命名空间下的 Codex 工具搜索使用，从而缩小初始模型上下文。

标记为 `catalogMode: "direct-only"` 的工具（包括 OpenClaw 的 `computer` 工具）改用 `openclaw_direct` 命名空间。Codex 将该命名空间视为 `DirectModelOnly`，因此这些工具在普通线程和仅代码模式线程中仍会直接对模型可见，而不会经过嵌套的代码模式 `tools.*` 调用。

启用搜索且未选择托管提供商时，Web 搜索默认使用 Codex 托管的 `web_search` 工具。原生托管搜索与 OpenClaw 托管的 `web_search` 动态工具互斥，因此托管搜索无法绕过原生域名限制。当托管搜索不可用、被显式禁用或被所选托管提供商替代时，OpenClaw 会使用托管工具。OpenClaw 会保持禁用 Codex 的独立 `web.run` 扩展，因为生产 app-server 流量会拒绝其用户定义的 `web` 命名空间。`tools.web.search.enabled: false` 会同时禁用这两条路径，仅启用 LLM 且工具禁用的运行也是如此。Codex 将 `"cached"` 视为偏好设置，并在不受限制的 app-server 轮次中将其解析为实时外部访问。如果设置了原生 `allowedDomains`，自动托管回退会以关闭方式失败，从而确保无法绕过允许列表。持久的有效搜索策略变更会在下一轮之前轮换绑定的 Codex 线程；每轮临时限制会使用临时受限线程，并保留现有绑定以便稍后恢复。

`sessions_yield` 和仅使用消息工具的源回复保持直接传递，因为它们属于轮次控制契约。`sessions_spawn` 保持可搜索状态，因此 Codex 的原生 `spawn_agent` 仍是主要的 Codex 子智能体表面，同时仍可通过 `openclaw` 动态工具命名空间进行显式 OpenClaw 或 ACP 委派。Heartbeat 协作指令会要求 Codex 在工具尚未加载时，在结束 Heartbeat 轮次前搜索 `heartbeat_respond`。

仅当连接到无法搜索延迟动态工具的自定义 Codex app-server，或调试完整工具负载时，才设置 `codexDynamicToolsLoading: "direct"`。

### 配置字段

支持的顶层 Codex 插件字段：

| 字段                       | 默认值         | 含义                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 可将 OpenClaw 动态工具直接放入初始 Codex 工具上下文。 |
| `codexDynamicToolsExclude` | `[]`           | 需要从 Codex app-server 轮次中省略的其他 OpenClaw 动态工具名称。                          |
| `codexPlugins`             | 已禁用         | 为从源码安装的精选插件迁移而来的原生 Codex 插件/应用支持。                               |
| `sessionCatalog`           | 已启用         | 在此 Gateway 网关和符合条件的已配对节点上发现原生 Codex 会话的侧边栏。                   |
| `supervision`              | 已禁用         | 面向 Agent 的原生会话转录和写入控制策略。                                                |

支持的 `appServer` 字段：

| 字段                                         | 默认值                                                | 含义                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 会生成 Codex 进程；显式设置 `"unix"` 会连接到本地控制套接字；`"websocket"` 会连接到 `url`。                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 按 OpenClaw 智能体隔离普通 harness 状态。`"user"` 是显式选择启用的配置，它会共享原生 `$CODEX_HOME` 或 `~/.codex`、使用原生身份验证，并启用仅限所有者的线程管理。用户范围支持本地 stdio 或 Unix 传输。对于单独的监管连接，未设置的值在 stdio 或 Unix 下解析为 `"user"`，在 WebSocket 下解析为 `"agent"`。     |
| `command`                                     | 托管的 Codex 二进制文件                                   | stdio 传输使用的可执行文件。保持未设置以使用托管的二进制文件；仅在需要显式覆盖时设置。                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输的参数。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未设置                                                  | WebSocket App Server URL 或 `unix://` URL。显式指定空的 Unix 路径会选择用户主目录中的规范控制套接字。                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未设置                                                  | WebSocket 传输的 Bearer 令牌。接受字面量字符串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 额外的 WebSocket 标头。标头值接受字面量字符串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 构建继承环境后，从生成的 stdio app-server 进程中移除的额外环境变量名称。对于本地启动，OpenClaw 会保留所选的 `CODEX_HOME` 和继承的 `HOME`。                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | 选择启用 Codex 仅限代码模式的工具界面。普通 OpenClaw 动态工具仍可通过嵌套的 `tools.*` 调用使用；`openclaw_direct` 工具仍直接对模型可见。                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未设置                                                  | 远程 Codex app-server 工作区根目录。设置后，OpenClaw 会根据解析出的 OpenClaw 工作区推断本地工作区根目录，保留当前 cwd 在此远程根目录下的后缀，并且仅将最终的 app-server cwd 发送给 Codex。如果 cwd 位于解析出的 OpenClaw 工作区根目录之外，OpenClaw 会进行故障关闭，而不是将 Gateway 网关本地路径发送给远程 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面调用的超时时间。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一个轮次后，或发生限定于该轮次的 app-server 请求后，OpenClaw 等待 `turn/completed` 时采用的静默窗口。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | 工具移交、原生工具完成、工具执行后原始助手进度、原始推理完成或推理进度之后，在 OpenClaw 等待 `turn/completed` 时使用的完成空闲与进度保护机制。对于可信或繁重的工作负载，如果工具执行后的综合处理可以合理地保持静默，且静默时间超过最终助手发布预算，请使用此项。                                |
| `mode`                                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO | 用于 YOLO 或由 guardian 审查执行的预设。本地 stdio 要求如果省略 `danger-full-access`、`never` 审批或 `user` 审查器，则隐式默认使用 guardian。                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` 或允许的 guardian 审批策略       | 在线程启动、恢复或轮次开始时发送给原生 Codex 的审批策略。允许时，guardian 默认值优先使用 `"on-request"`。                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允许的 guardian 沙箱  | 在线程启动或恢复时发送给原生 Codex 的沙箱模式。允许时，guardian 默认值优先使用 `"workspace-write"`，否则使用 `"read-only"`。当 OpenClaw 沙箱处于活动状态时，`danger-full-access` 轮次使用 Codex `workspace-write`，其网络访问权限由 OpenClaw 沙箱的出口设置决定。                                                                                     |
| `approvalsReviewer`                           | `"user"` 或允许的 guardian 审查器               | 允许时，使用 `"auto_review"` 让 Codex 审查原生审批提示，否则使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是旧版别名。                                                                                                                                                                                                                              |
| `serviceTier`                                 | 未设置                                                  | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求灵活处理，`null` 清除覆盖，并且接受旧版 `"fast"`，将其视为 `"priority"`。                                                                                                                                                                                                 |
| `networkProxy`                                | 已禁用                                               | 选择启用 Codex 权限配置文件网络功能，以供 app-server 命令使用。OpenClaw 会定义所选的 `permissions.<profile>.network` 配置，并使用 `default_permissions` 选择它，而不是发送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 预览版选择启用项，会向受支持的 Codex app-server 注册由 OpenClaw 沙箱支持的 Codex 环境，以便原生 Codex 执行可在活动的 OpenClaw 沙箱内运行。                                                                                                                                                                                                            |

`appServer.networkProxy` 采用显式配置，因为它会更改 Codex 沙箱
契约。启用后，OpenClaw 还会在 Codex 线程配置中设置 `features.network_proxy.enabled`
和 `default_permissions`，以便生成的
权限配置文件能够启动 Codex 托管网络。默认情况下，OpenClaw
会根据配置文件主体生成抗冲突的 `openclaw-network-<fingerprint>` 配置文件
名称；仅在需要稳定的本地名称时使用 `profileName`。

```json5
{
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
}
```

如果正常的 app-server 运行时为 `danger-full-access`，启用
`networkProxy` 后，生成的权限配置文件将使用工作区式文件系统访问：
Codex 托管网络强制执行依赖沙箱隔离网络，因此完全访问配置文件无法保护出站流量。
域名条目使用 `allow` 或 `deny`；Unix 套接字条目使用 Codex 的
`allow` 或 `none` 值。

### 动态工具调用超时

OpenClaw 所属的动态工具调用具有独立于
`appServer.requestTimeoutMs` 的时限：Codex `item/tool/call` 请求默认使用 90
秒的 OpenClaw 看门狗。每次调用中为正数的 `timeoutMs`
参数可延长或缩短该工具调用的特定时间预算，上限为 600000 ms。
如果工具调用未提供自己的超时，`image_generate` 工具使用 `agents.defaults.imageGenerationModel.timeoutMs`；
否则，图像生成默认超时为 120 秒。媒体理解 `image` 工具
使用 `tools.media.image.timeoutSeconds` 或其 60 秒媒体默认值；对于图像理解，
该超时应用于请求本身，不会因之前的准备工作而缩短。超时时，OpenClaw
会在支持的情况下中止工具信号，并向 Codex 返回失败的动态工具响应，
使该轮次能够继续，而不是让会话停留在 `processing`。
此看门狗是外层动态 `item/tool/call` 时间预算；提供商特定的
请求超时在该调用内部运行，并保留各自的超时语义。

Codex 接受一个轮次后，以及 OpenClaw 响应轮次范围内的
app-server 请求后，harness 预期 Codex 在当前轮次取得进展，
并最终以 `turn/completed` 完成本机轮次。如果
app-server 静默达到 `appServer.turnCompletionIdleTimeoutMs`，OpenClaw
会尽力中断 Codex 轮次、记录诊断超时，并释放 OpenClaw 会话通道，
从而避免后续聊天消息排在过期的本机轮次之后。同一轮次的大多数
非终止通知都会解除这个短看门狗，因为 Codex 已证明该轮次仍处于活动状态。

工具交接使用更长的工具后空闲时间预算：包括 OpenClaw 返回
`item/tool/call` 响应后，`commandExecution` 等本机工具项完成后，
原始 `custom_tool_call_output` 完成后，以及工具后的原始助手进度、
原始推理完成或推理进度后。如果已配置，该保护机制使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否则默认为五分钟；同一时间预算还会延长
Codex 发出下一个当前轮次事件前静默合成窗口的进度看门狗。
速率限制更新等全局 app-server 通知不会重置轮次空闲进度。
推理完成、commentary `agentMessage` 完成以及工具前的原始推理或
助手进度之后可能会自动生成最终回复，因此它们会使用进度后回复保护，
而不是立即释放会话通道。

只有最终的非 commentary 已完成 `agentMessage` 项，以及工具前的原始
助手完成，才会启用助手输出释放：如果 Codex 随后保持静默且未发出
`turn/completed`，OpenClaw 会尽力中断本机轮次并释放会话通道。
如果另一个轮次监视机制在释放竞态中胜出，只要已无本机请求、项目或
动态工具完成处于活动状态，且助手输出释放仍属于最新完成的项目，
同时没有更晚的项目完成，OpenClaw 仍会接受已完成的最终助手项目。
这样可以在已完成工具工作后保留最终答案，而无需重放轮次。
部分助手增量、过期的较早回复以及后续的空完成均不符合条件。

可安全重放的 stdio app-server 故障（包括没有助手、工具、活动项目或
副作用证据的轮次完成空闲超时）会在全新的 app-server 尝试中重试一次。
不安全的超时仍会停用卡住的 app-server 客户端并释放 OpenClaw 会话通道；
同时还会清除过期的本机线程绑定，而不是自动重放。完成监视超时会显示
Codex 特定的超时文本：可安全重放的情况会说明响应可能不完整，
而不安全的情况会要求用户在重试前验证当前状态。公开超时诊断包含
结构化字段，例如最后一个 app-server 通知方法、原始助手响应项目的
ID/类型/角色、活动请求/项目计数以及已启用的监视状态；当最后一个通知是
原始助手响应项目时，还会包含长度受限的助手文本预览。其中不包含
原始提示词或工具内容。

### 本地测试环境覆盖项

- `OPENCLAW_CODEX_APP_SERVER_BIN` 在未设置
  `appServer.command` 时绕过托管二进制文件。
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 进行一次性本地测试。对于可重复部署，
建议使用配置，因为这样可以将插件行为与 Codex harness 的其余设置
保存在同一个经过审查的文件中。

## Native Codex plugins

Native Codex plugins 支持在与 OpenClaw harness 轮次相同的 Codex
线程中，使用 Codex app-server 自身的应用和插件能力。OpenClaw
不会将 Codex 插件转换为合成的 `codex_plugin_*` OpenClaw 动态工具。

`codexPlugins` 仅影响选择原生 Codex harness 的会话。
它不会影响内置 harness 运行、常规 OpenAI provider 运行、
ACP 对话绑定或其他 harness。

最小迁移配置：

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

OpenClaw 建立 Codex harness 会话或替换过期的 Codex 线程绑定时，
会计算线程应用配置；该配置不会在每个轮次重新计算。更改
`codexPlugins` 后，请使用 `/new`、`/reset`，
或重启 Gateway 网关，以便后续 Codex harness 会话使用更新后的应用集启动。

有关迁移资格、应用清单、破坏性操作策略、信息征询以及原生插件诊断，
请参阅 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。

OpenAI 侧的应用和插件访问权限由已登录的 Codex 账户控制；对于
Business 和 Enterprise/Edu 工作区，还受工作区应用控制。
有关 OpenAI 的账户和工作区控制概览，请参阅
[在 ChatGPT 套餐中使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 计算机使用

计算机使用有单独的设置指南：
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

简而言之：OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作。
它会准备 Codex app-server，验证 `computer-use` MCP 服务器可用，
然后在 Codex 模式轮次期间让 Codex 负责原生 MCP 工具调用。

## 运行时边界

Codex harness 仅更改底层嵌入式智能体执行器。

- 支持 OpenClaw 动态工具。Codex 请求 OpenClaw 执行
  这些工具，因此 OpenClaw 仍位于执行路径中。
- Codex 原生 shell、补丁、MCP 和原生应用工具由 Codex
  负责。OpenClaw 可以通过受支持的中继观察或阻止选定的原生事件，
  但不会重写原生工具参数。
- Codex 负责原生压缩。OpenClaw 会保留一份转录镜像，
  用于渠道历史记录、搜索、`/new`、`/reset`
  以及未来的模型或 harness 切换，但不会用 OpenClaw 或上下文引擎
  摘要器替换 Codex 压缩。
- 媒体生成、媒体理解、TTS、审批和消息工具输出继续使用
  对应的 OpenClaw 提供商/模型设置。
- `tool_result_persist` 应用于 OpenClaw 所属的转录工具结果，
  而不是 Codex 原生工具结果记录。

有关钩子层、受支持的 V1 表面、原生权限处理、队列引导、
Codex 反馈上传机制以及压缩详情，请参阅
[Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)。

## 故障排查

**Codex 未显示为常规 `/model` 提供商：**对于新配置，这是预期行为。
请选择 `openai/gpt-*` 模型，启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用内置 harness，而不是 Codex：**确认生效路由是精确的官方 HTTPS
Platform Responses 或 ChatGPT Responses 路由，没有用户编写的请求覆盖项，
并且 Codex 插件已安装并启用。仅有 `openai/gpt-*` 前缀还不够。
如需在测试时进行严格验证，请设置提供商或模型的 `agentRuntime.id: "codex"`；
强制使用 Codex 时，如果路由或 harness 不兼容，操作会失败而不会回退。

**OpenAI Codex 运行时回退到 API key 路径：**收集一段经过脱敏的
Gateway 网关摘录，其中应显示模型、运行时、所选提供商和故障。
请受影响的协作者在其 OpenClaw 主机上运行以下只读命令：

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

有用的摘录通常包含 `openai/gpt-5.6-sol` 或 `openai/gpt-5.6-luna`、
`Runtime: OpenAI Codex`、`agentRuntime.id` 或 `harnessRuntime`、
`candidateProvider: "openai"`，以及 `401`、`Incorrect API key` 或
`No API key` 结果。修正后的运行应显示 OpenAI OAuth 路径，
而不是普通的 OpenAI API key 故障。

**仍保留旧版 Codex 模型引用配置：**运行 `openclaw doctor --fix`。
Doctor 会将旧版模型引用重写为 `openai/*`，移除过期的会话和
整个智能体运行时固定项，并保留现有的身份验证配置文件覆盖项。

**app-server 被拒绝：**请使用 Codex app-server `0.143.0` 或更高版本。
相同版本的预发布版或带构建后缀的版本（例如
`0.143.0-alpha.2` 或 `0.143.0+custom`）会被拒绝，因为 OpenClaw
测试的是稳定版 `0.143.0` 协议下限。

**`/codex status` 无法连接：**请检查 `codex` 插件是否已启用、配置允许列表时 `plugins.allow` 是否包含该插件，以及任何自定义 `appServer.command`、`url`、`authToken` 或标头是否有效。

**模型发现速度慢：**降低
`plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。
请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference#model-discovery)。

**WebSocket 传输立即失败：**请检查 `appServer.url`、
`authToken`、标头，并确认远程 app-server 使用相同版本的 Codex app-server 协议。

**原生 shell 或补丁工具因 `Native hook relay
unavailable` 而被阻止：**Codex 线程仍在尝试使用 OpenClaw 已不再注册的原生钩子中继 ID。这是原生 Codex 钩子传输问题，而不是 ACP 后端、提供商、GitHub 或 shell 命令故障。请在受影响的聊天中使用 `/new` 或 `/reset` 启动新会话，然后重试一个无害命令。如果该命令成功一次，但下一次原生工具调用再次失败，请仅将 `/new` 视为临时解决方法：重启 Codex app-server 或 OpenClaw Gateway 网关后，将提示词复制到新会话中，以便丢弃旧线程并重新创建原生钩子注册。

**非 Codex 模型使用内置 harness：**除非提供商或模型运行时策略将其路由到其他 harness，否则这是预期行为。在 `auto` 模式下，普通的非 OpenAI 提供商引用仍使用其常规提供商路径。

**计算机使用已安装，但工具无法运行：**请在新会话中检查
`/codex computer-use status`。如果工具报告
`Native hook relay unavailable`，请使用上文所述的原生钩子中继恢复方法。
请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use#troubleshooting)。

## 相关内容

- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Codex 监督](/zh-CN/plugins/codex-supervision)
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
