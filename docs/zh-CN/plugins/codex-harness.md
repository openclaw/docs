---
read_when:
    - 你想使用官方 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署在失败时直接报错，而不是回退到 OpenClaw
summary: 通过官方 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-07-12T14:37:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5f6705dad9fa3bbe45c2f4eaf079ecb861b7911142bda1301c4d64a1f21a8ec5
    source_path: plugins/codex-harness.md
    workflow: 16
---

官方 `codex` 插件通过 Codex app-server 运行嵌入式 OpenAI 智能体轮次，而不是使用 OpenClaw 内置 harness。Codex 负责底层智能体会话：原生线程恢复、原生工具续接、原生压缩和 app-server 执行。OpenClaw 仍负责聊天渠道、会话文件、模型选择、OpenClaw 动态工具、审批、媒体传送以及可见的对话记录镜像。

使用规范的 OpenAI 模型引用，例如 `openai/gpt-5.6-sol`。不要配置旧版 Codex GPT 引用；请将 OpenAI 智能体身份验证顺序放在 `auth.order.openai` 下。旧版 Codex 身份验证配置文件 ID 和旧版 Codex 身份验证顺序条目由 `openclaw doctor --fix` 修复。

当提供商/模型运行时策略未设置或设为 `auto` 时，仅凭 `openai/*` 前缀绝不会选择此 harness。只有在使用完全匹配的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且没有手动编写的请求覆盖项时，OpenAI 才可能隐式选择 Codex。请参阅
[OpenAI 隐式智能体运行时](/zh-CN/providers/openai#implicit-agent-runtime)。
如果在确定 Platform 与 ChatGPT 路由之前，Codex 已负责身份验证，OpenClaw 仍要求每个候选路由声明与 Codex 兼容。仅由原生机制负责身份验证绝不会绕过该路由检查。

当没有启用 OpenClaw 沙箱时，OpenClaw 会在启动 Codex app-server 线程时启用 Codex 原生代码模式（默认仍关闭仅代码模式），因此原生工作区/代码能力可与通过 app-server `item/tool/call` 桥接路由的 OpenClaw 动态工具同时使用。启用 OpenClaw 沙箱或受限工具策略时，将完全禁用原生代码模式，除非你选择启用实验性的沙箱 exec-server 路径。

当使用默认的 `tools.exec.host: "auto"` 且没有启用 OpenClaw 沙箱时，Codex 还会获得 `node_exec` 和 `node_process` 工具，用于在已配对节点上执行命令。原生 shell 仍位于 Codex app-server 主机和工作区中（默认 stdio 部署使用 Gateway 网关本地环境）；`node_exec` 按名称或 ID 选择节点，并继续执行 OpenClaw 的节点审批策略。

此 Codex 原生功能不同于
[OpenClaw 代码模式](/zh-CN/reference/code-mode)，后者是一种需要选择启用的 QuickJS-WASI 运行时，用于采用不同 `exec` 输入结构的通用 OpenClaw 运行。若要了解更广泛的模型/提供商/运行时划分，请先阅读
[Agent Runtimes](/zh-CN/concepts/agent-runtimes)：`openai/gpt-5.6-sol` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道是通信界面。

## 要求

- 已安装官方 `@openclaw/codex` 插件。如果你的配置使用允许列表，请将 `codex` 加入 `plugins.allow`。
- Codex app-server `0.143.0` 或更高版本。默认情况下，插件会管理兼容的二进制文件，因此 `PATH` 中的 `codex` 命令不会影响正常启动。
- 通过 `openclaw models auth login --provider openai` 完成 Codex 身份验证、智能体的 Codex 主目录中已存在 app-server 账户，或者已配置明确的 Codex API 密钥身份验证配置文件。

有关身份验证优先级、环境隔离、自定义 app-server 命令、模型发现和完整配置字段列表，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 快速开始

安装官方插件，然后使用 Codex OAuth 登录：

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

启用 `codex` 插件并选择一个 OpenAI 智能体模型：

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

如果你的配置使用 `plugins.allow`，也请将 `codex` 添加到其中：

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

更改插件配置后重启 Gateway 网关。如果聊天已经有会话，请先运行 `/new` 或 `/reset`，以便下一轮根据当前配置解析 harness。

## 与 Codex Desktop 和 CLI 共享线程

默认的 `appServer.homeScope: "agent"` 会将每个 OpenClaw 智能体与操作员的原生 Codex 状态隔离。若要让所有者检查和管理 Codex Desktop 与 Codex CLI 中显示的相同原生线程，请选择使用用户 Codex 主目录：

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

用户主目录模式支持本地托管的 stdio 进程或共享 Unix 套接字传输。设置 `$CODEX_HOME` 时使用该目录，否则使用 `~/.codex`，包括该主目录中的原生 Codex 身份验证、配置、插件和线程存储。OpenClaw 不会向此 app-server 注入 OpenClaw 身份验证配置文件。

所有者轮次会获得 `codex_threads` 工具：列出、搜索、读取、分叉、重命名、归档和恢复原生线程。分叉线程后可在 OpenClaw 中继续该线程；分叉线程会附加到当前 OpenClaw 会话，并对其他原生 Codex 客户端保持可见。归档时需要明确确认该线程已在其他位置关闭。当同时启用监督时，对话记录字段和修改操作需要分别选择启用对应的 `supervision.allowRawTranscripts` 或 `supervision.allowWriteControls`。

不要通过相互独立的托管 stdio App Server 并发恢复或写入同一线程。Codex 会协调同一 App Server 内的实时写入方，但不会跨独立进程进行协调。对于普通用户主目录 stdio 会话，分叉是安全共存的方式。

仅设置 `appServer.homeScope: "user"` 不会启用工作队列目录。若希望原生会话显示在 OpenClaw 侧边栏中，请使用 `supervision.enabled: true`。监督功能使用单独的监督连接；如果没有明确的 `appServer` 连接设置，该连接默认使用托管的用户主目录 stdio，而普通 harness 仍保持智能体范围。两个路径都会采用明确的 `appServer` 设置。当普通 harness 也应共享原生状态时，请按上例明确设置 `homeScope: "user"`。

## 监督 Codex 会话

同一个 `codex` 插件可以列出 Gateway 网关计算机和已选择启用的配对节点上的未归档 Codex 会话。已存储或处于空闲状态的 Gateway 网关本地会话可以创建锁定模型的聊天，镜像其有界的持久化用户和助手历史记录。其私有绑定使用监督连接获取原生快照、规范分支和后续轮次，而普通 Codex 会话仍保持智能体范围。首次启动规范分支时，会完全使用 Codex 为快照分叉返回的模型和提供商。后续恢复时由 Codex 原生配置决定选择；外层 OpenClaw 模型和回退链绝不会将其替换。明确确认没有其他运行方后，可以归档已存储和空闲的条目。活动来源无法创建分支或归档；仍可打开已有的受监督聊天。配对节点会话仍仅包含元数据。

有关设置、分支规则、配对节点限制、元数据暴露和故障排查，请参阅[监督 Codex 会话](/plugins/codex-supervision)。

## 配置

| 需求                                                | 设置                                                                                              | 位置                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 启用 harness                                  | `plugins.entries.codex.enabled: true`                                                            | OpenClaw 配置                    |
| 显示未归档的 Codex 会话                    | `plugins.entries.codex.config.supervision.enabled: true`                                         | Codex 插件配置                |
| 保留允许列表中的插件安装                  | 将 `codex` 加入 `plugins.allow`                                                               | OpenClaw 配置                    |
| 允许符合条件的 OpenAI 轮次隐式使用 Codex | 完全匹配的官方 HTTPS Responses/ChatGPT 路由、无手动编写的请求覆盖项、运行时未设置/`auto` | OpenAI 提供商/模型配置       |
| 使用 ChatGPT/Codex OAuth 登录                    | `openclaw models auth login --provider openai`                                                   | CLI 身份验证配置文件                   |
| 为 Codex 运行添加 API 密钥备用项                   | 在 `auth.order.openai` 中列于订阅身份验证之后的 `openai:*` API 密钥配置文件                 | CLI 身份验证配置文件 + OpenClaw 配置 |
| Codex 不可用时以封闭方式失败               | 提供商或模型 `agentRuntime.id: "codex"`                                                     | OpenClaw 模型/提供商配置     |
| 使用直接的 OpenAI API 流量                       | 提供商或模型 `agentRuntime.id: "openclaw"`，并使用普通 OpenAI 身份验证                          | OpenClaw 模型/提供商配置     |
| 调整 app-server 行为                            | `plugins.entries.codex.config.appServer.*`                                                       | Codex 插件配置                |
| 启用原生 Codex 插件应用                     | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex 插件配置                |
| 启用 Codex Computer Use                           | `plugins.entries.codex.config.computerUse.*`                                                     | Codex 插件配置                |

对于订阅优先、API 密钥备用的顺序，请优先使用 `auth.order.openai`。现有旧版 Codex 身份验证配置文件 ID 和旧版 Codex 身份验证顺序是仅供 Doctor 处理的遗留状态；不要写入新的旧版 Codex GPT 引用。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

对于与 Codex 兼容的有效路由，上述两个配置文件仍是同一次 Codex 运行的候选项。配置文件顺序选择凭据，而不是运行时。更改身份验证顺序不会使自定义路由、Completions 路由、HTTP 路由或存在请求覆盖项的路由与 Codex 兼容。

### 压缩

不要在由 Codex 支持的智能体上设置 `compaction.model` 或 `compaction.provider`。Codex 通过其原生 app-server 线程状态执行压缩，因此 OpenClaw 会在运行时忽略这些本地摘要器覆盖项；当智能体使用 Codex 时，`openclaw doctor --fix` 会将其删除。

Lossless 仍可用作上下文引擎，围绕 Codex 轮次执行组装、摄取和维护；应通过 `plugins.slots.contextEngine: "lossless-claw"` 和 `plugins.entries.lossless-claw.config.summaryModel` 进行配置，而不是通过 `agents.defaults.compaction.provider`。当 Codex 是活动运行时时，`openclaw doctor --fix` 会将旧的 `compaction.provider: "lossless-claw"` 结构迁移到 Lossless 上下文引擎槽位，但压缩仍由原生 Codex 负责。原生 app-server harness 支持需要在提示词之前执行组装的上下文引擎；包括 `codex-cli` 在内的通用 CLI 后端不提供此宿主能力。

对于由 Codex 支持的智能体，`/compact` 会在绑定线程上启动原生 Codex app-server 压缩。OpenClaw 不会等待操作完成、施加 OpenClaw 超时、重启共享 app-server，也不会回退到上下文引擎或公共 OpenAI 摘要器。如果原生 Codex 线程绑定缺失或已失效，该命令会以封闭方式失败，而不是静默切换压缩后端。

本页其余部分介绍部署结构、封闭失败路由、guardian 审批策略、原生 Codex 插件和计算机使用。有关完整选项列表、默认值、枚举、发现机制、环境隔离、超时和 app-server 传输字段，请参阅
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 验证 Codex 运行时

在你预期使用 Codex 的聊天中使用 `/status`。由 Codex 支持的 OpenAI 智能体轮次会显示：

```text
运行时：OpenAI Codex
```

然后检查 Codex app-server 状态：

```text
/codex status
/codex models
```

`/codex status` 报告 app-server 连接状态、账户、速率限制、MCP
服务器和 Skills。`/codex models` 列出该 harness 和账户可用的实时 Codex app-server
目录。如果 `/status` 的结果出乎意料，请参阅
[故障排查](#troubleshooting)。

## 路由和模型选择

将提供商引用与运行时策略分开：

- 使用 `openai/gpt-*` 进行规范的 OpenAI 模型选择。仅凭此前缀
  绝不会选择 Codex。
- 当运行时未设置或设为 `auto` 时，只有未包含用户编写的请求覆盖项、且完全匹配的官方 HTTPS Platform Responses
  或 ChatGPT Responses 路由，才可以隐式选择 Codex。
- 不要在配置中使用旧版 Codex GPT 引用；运行 `openclaw doctor --fix`
  可修复旧版引用和过时的会话路由固定项。
- `agentRuntime.id: "codex"` 将 Codex 设为兼容路由的
  故障关闭要求。它不会使不兼容的有效路由变得兼容。
- `agentRuntime.id: "openclaw"` 可在有意为之时，让提供商或模型使用嵌入式
  OpenClaw 运行时。
- `/codex ...` 从聊天中控制原生 Codex app-server 对话。
- ACP/acpx 是一条独立的外部 harness 路径。仅当用户
  请求 ACP/acpx 或外部 harness 适配器时使用它。

| 用户意图                                                   | 使用方式                                                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 关联当前聊天                                               | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| 恢复现有 Codex 线程                                        | `/codex resume <thread-id>`                                                                           |
| 列出或筛选 Codex 线程                                      | `/codex threads [filter]`                                                                             |
| 列出 Native Codex plugins                                  | `/codex plugins list`                                                                                 |
| 启用或禁用已配置的 Native Codex plugin                     | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 将已存储的 Codex CLI 会话恢复为配对节点轮次                | `/codex sessions --host <node> [filter]`，然后运行 `/codex resume <session-id> --host <node> --bind here` |
| 查看多台计算机上未归档的 Codex 会话                        | 启用 Codex 监管并打开 **Codex 会话**                                                                  |
| 更改已绑定线程的模型、快速模式或权限                       | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| 停止或引导当前轮次                                         | `/codex stop`, `/codex steer <text>`                                                                  |
| 解除当前绑定                                               | `/codex detach`（别名 `/codex unbind`）                                                               |
| 仅发送 Codex 反馈                                          | `/codex diagnostics [note]`                                                                           |
| 启动 ACP/acpx 任务                                         | 使用 ACP/acpx 会话命令，而不是 `/codex`                                                               |

| 使用场景                                         | 配置                                                                                                        | 验证                                    | 说明                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------- |
| 使用 Native Codex runtime 的合格 OpenAI 路由     | 完全匹配的官方 HTTPS Responses/ChatGPT 路由，不含用户编写的请求覆盖项，并启用 `codex` plugin                | `/status` 显示 `Runtime: OpenAI Codex`  | 运行时未设置或为 `auto` 时的隐式路径      |
| Codex 不可用时故障关闭                           | 提供商或模型的 `agentRuntime.id: "codex"`                                                                   | 轮次失败，而不是回退到嵌入式运行时      | 用于仅限 Codex 的部署                     |
| 通过 OpenClaw 传输直接 OpenAI API 密钥流量       | 提供商或模型的 `agentRuntime.id: "openclaw"`，并使用常规 OpenAI 身份验证                                    | `/status` 显示 OpenClaw 运行时          | 仅在有意使用 OpenClaw 时使用              |
| 旧版配置                                         | 旧版 Codex GPT 引用                                                                                         | `openclaw doctor --fix` 会重写该配置    | 不要以这种方式编写新配置                  |
| ACP/acpx Codex 适配器                            | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP 任务/会话状态                       | 与 Native Codex harness 分离              |

`agents.defaults.imageModel` 遵循相同的前缀划分。正常 OpenAI 路由使用 `openai/gpt-*`，
仅当图像理解应通过受限的 Codex app-server 轮次运行时，才使用 `codex/gpt-*`。
Doctor 会将旧版 Codex GPT 引用重写为 `openai/gpt-*`。

## 部署模式

### 基础 Codex 部署

对于有效的官方 HTTPS 路由可隐式选择 Codex 的 OpenAI 模型，
请使用快速开始配置：

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

保留 Claude 作为默认智能体，并添加一个具名 Codex 智能体：

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

`main` 智能体使用其常规提供商路径。只要其有效 OpenAI 路由保持兼容，
`codex` 智能体就会使用 Codex app-server；如果这应当成为一项
故障关闭要求，请添加显式的模型范围 `agentRuntime.id: "codex"`。

### 故障关闭式 Codex 部署

当内置 plugin 可用时，符合条件且完全匹配的官方 HTTPS OpenAI 路由可以解析到 Codex。
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

强制使用 Codex 后，如果有效路由未声明为与 Codex 兼容、plugin 被禁用、app-server 版本过旧，
或 app-server 无法启动，OpenClaw 会提前失败。

## App-server 策略

默认情况下，该 plugin 通过 stdio 传输在本地启动由 OpenClaw 管理的 Codex 二进制文件。
仅在有意运行其他可执行文件时设置 `appServer.command`。仅当 app-server
已在其他位置运行时，才使用 WebSocket 传输：

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
`sandbox: "danger-full-access"`。如果本地 Codex 要求不允许这种隐式 YOLO 姿态，
OpenClaw 会改为选择允许的 Guardian 权限。当会话启用了 OpenClaw 沙箱时，
OpenClaw 会在该轮次禁用 Codex 原生代码模式、用户 MCP 服务器以及由应用支持的 plugin 执行，
而不是依赖 Codex 主机端沙箱隔离。此时，如果常规 exec/process 工具可用，
Shell 访问会改为通过由 OpenClaw 沙箱支持的动态工具，例如 `sandbox_exec` 和
`sandbox_process`。

在尝试逃逸沙箱或使用额外权限前，为 Codex 原生自动审查使用规范化的 OpenClaw exec 模式：

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

对于 Codex app-server 会话，`tools.exec.mode: "auto"` 会映射为经 Codex
Guardian 审查的审批：当本地要求允许这些值时，通常为
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和
`sandbox: "workspace-write"`。在 `tools.exec.mode: "auto"` 中，
OpenClaw 不会保留旧版不安全的 Codex `approvalPolicy: "never"` 或
`sandbox: "danger-full-access"` 覆盖项；如需有意采用无需审批的 Codex 姿态，
请使用 `tools.exec.mode: "full"`。旧版
`plugins.entries.codex.config.appServer.mode: "guardian"` 预设仍然有效，
但 `tools.exec.mode: "auto"` 是规范化的 OpenClaw 接口。

有关模式层面与主机 exec 审批及 ACPX 权限的比较，请参阅
[权限模式](/zh-CN/tools/permission-modes)。有关每个 app-server 字段、身份验证顺序、
环境隔离和超时行为，请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 命令和诊断

`codex` plugin 会在任何支持 OpenClaw 文本命令的渠道上，将 `/codex`
注册为斜杠命令。

原生执行和控制需要所有者或 `operator.admin` Gateway 网关客户端：包括绑定或恢复线程、
发送或停止轮次、更改模型、快速模式或权限状态、执行压缩或审查，以及解除绑定。
其他已获授权的发送者只能使用只读的状态、帮助、账户、模型、线程、MCP 服务器、
Skills 和绑定检查命令。

常见形式：

- `/codex status` 检查 app-server 连接状态、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex app-server 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话关联到现有 Codex 线程。
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  关联当前聊天。
- `/codex detach`（或 `/codex unbind`）解除当前绑定。
- `/codex binding` 描述当前绑定。
- `/codex stop` 停止当前轮次；`/codex steer <text>` 对其进行引导。
- `/codex model <model>`、`/codex fast [on|off|status]` 和
  `/codex permissions [default|yolo|status]` 更改单个对话的状态。
- `/codex compact` 请求 Codex app-server 压缩已关联的线程。
- `/codex review` 为已关联的线程启动 Codex 原生审查。
- `/codex diagnostics [note]` 会先询问，然后再为已关联的线程发送 Codex 反馈。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skills。
- `/codex plugins list`、`/codex plugins enable <name>` 和
  `/codex plugins disable <name>` 管理已配置的 Native Codex plugins。
- `/codex computer-use [status|install]` 管理 Codex Computer Use。
- `/codex help` 列出完整的命令树。

对于大多数支持请求，请先在发生错误的对话中使用 `/diagnostics [note]`。它会创建一份 Gateway 网关诊断报告；对于 Codex harness 会话，还会请求批准发送相关的 Codex 反馈包。有关隐私模型和群聊行为，请参阅[诊断导出](/zh-CN/gateway/diagnostics)。仅当你明确希望为当前附加的线程上传 Codex 反馈，而不需要完整的 Gateway 网关诊断包时，才使用 `/codex diagnostics [note]`。

### 在本地检查 Codex 线程

检查有问题的 Codex 运行时，最快的方法通常是直接打开原生 Codex 线程：

```bash
codex resume <thread-id>
```

从已完成的 `/diagnostics` 回复、`/codex binding` 或 `/codex threads [filter]` 中获取线程 ID。

有关上传机制和运行时级别的诊断边界，请参阅 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#codex-feedback-upload)。

### 身份验证顺序

在默认的每智能体主目录中，按以下顺序选择身份验证：

1. 智能体的有序 OpenAI 身份验证配置文件，最好位于 `auth.order.openai` 下。运行 `openclaw doctor --fix`，以迁移旧版遗留 Codex 身份验证配置文件 ID 和遗留 Codex 身份验证顺序。
2. 该智能体 Codex 主目录中 app-server 的现有账号。
3. 仅对于本地 stdio app-server 启动：当不存在 app-server 账号且仍需要 OpenAI 身份验证时，依次使用 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。

当 OpenClaw 检测到 ChatGPT 订阅类型的 Codex 身份验证配置文件时，会从生成的 Codex 子进程中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这样既能让 Gateway 网关级 API 密钥继续用于嵌入或直接 OpenAI 模型，又能避免原生 Codex app-server 轮次意外通过 API 计费。显式 Codex API 密钥配置文件和本地 stdio 环境变量密钥回退使用 app-server 登录，而不是继承的子进程环境。WebSocket app-server 连接不会接收 Gateway 网关环境变量 API 密钥回退；请使用显式身份验证配置文件或远程 app-server 自身的账号。

如果订阅配置文件达到 Codex 使用限制，OpenClaw 会在 Codex 报告重置时间时记录该时间，并为同一次 Codex 运行尝试下一个有序身份验证配置文件。重置时间过后，该订阅配置文件将再次符合使用条件，无需更改所选的 `openai/gpt-*` 模型或 Codex 运行时。

配置 Native Codex plugins 后，OpenClaw 会先通过已连接的 app-server 安装或刷新这些插件，然后再向 Codex 线程公开插件拥有的应用。`app/list` 仍是应用 ID、可访问性和元数据的事实来源，但 OpenClaw 负责每个线程的启用决策：如果策略允许某个已列出且可访问的应用，即使 `app/list` 当前报告该应用已禁用，OpenClaw 也会发送 `thread/start.config.apps[appId].enabled = true`。此路径不会为未知 ID 擅自安装应用；OpenClaw 只会通过 `plugin/install` 激活市场插件，然后刷新清单。

### 环境隔离

对于本地 stdio app-server 启动，OpenClaw 会将 `CODEX_HOME` 设置为每智能体目录，因此默认情况下，Codex 配置、身份验证/账号文件、插件缓存/数据和原生线程状态不会读取或写入操作员个人的 `~/.codex`。OpenClaw 会保留正常的进程 `HOME`；Codex 运行的子进程仍可找到用户主目录中的配置和令牌，Codex 也可能发现共享的 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json` 条目。设置 `appServer.homeScope: "user"` 后，OpenClaw 会改用原生用户 Codex 主目录及其现有账号，而不注入 OpenClaw 身份验证配置文件。

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

`appServer.clearEnv` 仅影响生成的 Codex app-server 子进程。OpenClaw 会在本地启动规范化期间从此列表中移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 始终指向所选的智能体或用户作用域，而 `HOME` 保持继承状态，以便子进程使用正常的用户主目录状态。

### 动态工具和 Web 搜索

Codex 动态工具默认使用 `searchable` 加载。OpenClaw 不会公开与 Codex 原生工作区操作重复的动态工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process`、`update_plan`、`tool_call`、`tool_describe`、`tool_search` 和 `tool_search_code`。其余大多数 OpenClaw 集成工具（例如消息、媒体、cron、浏览器、节点、Gateway 网关和 `heartbeat_respond`）都可通过 `openclaw` 命名空间下的 Codex 工具搜索使用，从而缩小初始模型上下文。

标记为 `catalogMode: "direct-only"` 的工具（包括 OpenClaw `computer` 工具）改用 `openclaw_direct` 命名空间。Codex 将该命名空间视为 `DirectModelOnly`，因此这些工具在普通线程和仅代码模式线程中始终直接对模型可见，而不会跨越嵌套的代码模式 `tools.*` 调用。

启用搜索且未选择托管提供商时，Web 搜索默认使用 Codex 托管的 `web_search` 工具。原生托管搜索和 OpenClaw 托管的 `web_search` 动态工具互斥，因此托管搜索无法绕过原生域名限制。当托管搜索不可用、被显式禁用或被所选的托管提供商替代时，OpenClaw 会使用托管工具。OpenClaw 会保持禁用 Codex 的独立 `web.run` 扩展，因为生产环境 app-server 流量会拒绝其用户定义的 `web` 命名空间。`tools.web.search.enabled: false` 会禁用这两条路径，仅启用 LLM 且禁用工具的运行也会如此。Codex 将 `"cached"` 视为一种偏好，并在不受限制的 app-server 轮次中将其解析为实时外部访问。设置原生 `allowedDomains` 后，自动托管回退会以失败关闭方式处理，确保无法绕过允许列表。持久有效的搜索策略更改会在下一轮之前轮换绑定的 Codex 线程；临时的每轮限制会使用临时受限线程，并保留现有绑定以供后续恢复。

`sessions_yield` 和仅使用消息工具的源回复保持直接可用，因为它们属于轮次控制契约。`sessions_spawn` 保持可搜索，因此 Codex 原生的 `spawn_agent` 仍是主要的 Codex 子智能体入口，而显式 OpenClaw 或 ACP 委派仍可通过 `openclaw` 动态工具命名空间使用。Heartbeat 协作说明会要求 Codex 在工具尚未加载时，先搜索 `heartbeat_respond`，再结束 Heartbeat 轮次。

仅当连接到无法搜索延迟动态工具的自定义 Codex app-server，或调试完整工具载荷时，才将 `codexDynamicToolsLoading: "direct"` 设置为直接加载。

### 配置字段

支持的顶层 Codex 插件字段：

| 字段                       | 默认值         | 含义                                                                                   |
| -------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 可将 OpenClaw 动态工具直接放入初始 Codex 工具上下文。                  |
| `codexDynamicToolsExclude` | `[]`           | 要从 Codex app-server 轮次中省略的其他 OpenClaw 动态工具名称。                         |
| `codexPlugins`             | 已禁用         | 为从源码安装的精选插件迁移而提供的原生 Codex 插件/应用支持。                          |
| `supervision`              | 已禁用         | 未归档的原生会话目录、本地分支持接和智能体工具策略。                                   |

支持的 `appServer` 字段：

| 字段                                          | 默认值                                                 | 含义                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 会启动 Codex；显式指定 `"unix"` 会连接到本地控制套接字；`"websocket"` 会连接到 `url`。                                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 会按 OpenClaw 智能体隔离普通的 harness 状态。`"user"` 是一种显式选择加入的模式，它会共享原生 `$CODEX_HOME` 或 `~/.codex`、使用原生身份验证，并启用仅所有者可用的线程管理。用户作用域支持本地 stdio 或 Unix 传输。对于单独的监管连接，未设置的值在 stdio 或 Unix 下解析为 `"user"`，在 WebSocket 下解析为 `"agent"`。     |
| `command`                                     | 托管的 Codex 二进制文件                                | stdio 传输使用的可执行文件。保持未设置以使用托管二进制文件；仅在需要显式覆盖时设置。                                                                                                                                                                                                                                                                                                             |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输使用的参数。                                                                                                                                                                                                                                                                                                                                                                          |
| `url`                                         | 未设置                                                 | WebSocket App Server URL 或 `unix://` URL。显式指定空的 Unix 路径会选择规范的用户主目录控制套接字。                                                                                                                                                                                                                                                                                              |
| `authToken`                                   | 未设置                                                 | WebSocket 传输使用的 Bearer 令牌。接受字面量字符串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                            |
| `headers`                                     | `{}`                                                   | 额外的 WebSocket 标头。标头值接受字面量字符串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                           |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 构建继承环境后，从生成的 stdio app-server 进程中移除的额外环境变量名称。对于本地启动，OpenClaw 会保留选定的 `CODEX_HOME` 和继承的 `HOME`。                                                                                                                                                                                                                                                |
| `codeModeOnly`                                | `false`                                                | 选择启用仅包含 Codex 代码模式的工具界面。普通 OpenClaw 动态工具仍可通过嵌套的 `tools.*` 调用使用；`openclaw_direct` 工具仍会直接对模型可见。                                                                                                                                                                                                                                                      |
| `remoteWorkspaceRoot`                         | 未设置                                                 | 远程 Codex app-server 工作区根目录。设置后，OpenClaw 会根据解析后的 OpenClaw 工作区推断本地工作区根目录，在此远程根目录下保留当前 cwd 后缀，并仅将最终的 app-server cwd 发送给 Codex。如果 cwd 位于解析后的 OpenClaw 工作区根目录之外，OpenClaw 会以失败关闭方式处理，而不会将 Gateway 网关本地路径发送到远程 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面调用的超时时间。                                                                                                                                                                                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一个轮次后，或发出轮次范围内的 app-server 请求后，OpenClaw 等待 `turn/completed` 时使用的静默时间窗口。                                                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 时，在工具交接、原生工具完成、工具调用后的原始助手进度、原始推理完成或推理进度之后使用的完成空闲和进度保护时间。对于可信或高负载工作负载，如果工具调用后的综合处理确实可能比最终助手发布预算静默更长时间，请使用此值。                                |
| `mode`                                        | `"yolo"`，除非本地 Codex 要求禁止 YOLO                 | YOLO 执行或由守护者审核的执行所使用的预设。如果本地 stdio 要求省略 `danger-full-access`、`never` 审批或 `user` 审核者，则隐式默认值为守护者模式。                                                                                                                                                                                                                                                   |
| `approvalPolicy`                              | `"never"` 或允许的守护者审批策略                       | 在线程启动、恢复和轮次中发送的原生 Codex 审批策略。允许时，守护者默认设置优先使用 `"on-request"`。                                                                                                                                                                                                                                                                                               |
| `sandbox`                                     | `"danger-full-access"` 或允许的守护者沙箱              | 在线程启动和恢复时发送的原生 Codex 沙箱模式。允许时，守护者默认设置优先使用 `"workspace-write"`，否则使用 `"read-only"`。当 OpenClaw 沙箱处于活动状态时，`danger-full-access` 轮次会使用 Codex `workspace-write`，其网络访问权限由 OpenClaw 沙箱的出口设置决定。                                                                                     |
| `approvalsReviewer`                           | `"user"` 或允许的守护者审核者                          | 允许时，使用 `"auto_review"` 让 Codex 审核原生审批提示；否则使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是旧版别名。                                                                                                                                                                                                                                                                |
| `serviceTier`                                 | 未设置                                                 | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求弹性处理，`null` 清除覆盖值，并且旧版 `"fast"` 会被接受为 `"priority"`。                                                                                                                                                                                                                                            |
| `networkProxy`                                | 已禁用                                                 | 选择启用 Codex 权限配置文件网络功能，以供 app-server 命令使用。OpenClaw 会定义选定的 `permissions.<profile>.network` 配置，并使用 `default_permissions` 选择它，而不是发送 `sandbox`。                                                                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | 预览版选择加入功能，它会在受支持的 Codex app-server 中注册由 OpenClaw 沙箱支持的 Codex 环境，使原生 Codex 执行能够在活动的 OpenClaw 沙箱内运行。                                                                                                                                                                                                                                                  |

`appServer.networkProxy` 是显式设置项，因为它会更改 Codex 沙箱
契约。启用后，OpenClaw 还会在 Codex 线程配置中设置
`features.network_proxy.enabled` 和 `default_permissions`，以便生成的
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

如果正常的 app-server 运行时原本会使用 `danger-full-access`，启用
`networkProxy` 后，生成的权限配置文件会采用工作区式文件系统访问：
Codex 托管网络强制机制使用沙箱网络，因此全访问配置文件无法保护出站流量。
域条目使用 `allow` 或 `deny`；Unix 套接字条目使用 Codex 的
`allow` 或 `none` 值。

### 动态工具调用超时

OpenClaw 所有的动态工具调用具有独立于
`appServer.requestTimeoutMs` 的时间限制：Codex `item/tool/call` 请求默认使用
90 秒的 OpenClaw 看门狗。每次调用传入正数 `timeoutMs`
参数，可延长或缩短该特定工具的时间预算，上限为 600000 ms。
当工具调用未提供自己的超时时间时，`image_generate` 工具使用
`agents.defaults.imageGenerationModel.timeoutMs`，否则使用 120 秒的
图像生成默认值。用于媒体理解的 `image` 工具使用
`tools.media.image.timeoutSeconds` 或其 60 秒的媒体默认值；对于
图像理解，该超时时间应用于请求本身，不会因先前的准备工作而缩短。
发生超时时，OpenClaw 会在支持的情况下中止工具信号，并向 Codex
返回失败的动态工具响应，使当前轮次可以继续，而不会让会话停留在
`processing` 状态。此看门狗是动态 `item/tool/call` 的外层时间预算；
提供商特定的请求超时在该调用内部运行，并保留各自的超时语义。

Codex 接受一个轮次后，以及 OpenClaw 响应轮次范围内的
app-server 请求后，harness 会预期 Codex 在当前轮次取得进展，并最终通过
`turn/completed` 完成原生轮次。如果 app-server 在
`appServer.turnCompletionIdleTimeoutMs` 时长内保持静默，OpenClaw
会尽力中断 Codex 轮次、记录诊断超时，并释放 OpenClaw 会话通道，
使后续聊天消息不会排在过期原生轮次之后。同一轮次的大多数非终止通知
都会解除该短时看门狗，因为 Codex 已证明该轮次仍处于活动状态。

工具移交使用更长的工具调用后空闲预算：在 OpenClaw 返回
`item/tool/call` 响应后，在 `commandExecution` 等原生工具条目完成后，
在原始 `custom_tool_call_output` 完成后，以及在工具调用后的原始助手进度、
原始推理完成或推理进度之后。配置后，此防护使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否则默认为
五分钟；同一预算还会延长静默合成窗口的进度看门狗，直到 Codex 发出
下一个当前轮次事件。速率限制更新等全局 app-server 通知不会重置轮次空闲进度。
推理完成、commentary `agentMessage` 完成，以及工具调用前的原始推理或
助手进度之后可能自动生成最终回复，因此它们使用进度后回复防护，
而不会立即释放会话通道。

只有最终的非 commentary 已完成 `agentMessage` 条目和工具调用前的原始
助手完成会启用助手输出释放机制：如果 Codex 随后保持静默且未发出
`turn/completed`，OpenClaw 会尽力中断原生轮次并释放会话通道。
如果另一个轮次监视器在释放竞态中胜出，只要不再有原生请求、条目或动态工具完成
处于活动状态，并且助手输出释放仍属于最新完成的条目，且之后没有新的条目完成，
OpenClaw 仍会接受已完成的最终助手条目。这样可以在工具工作完成后保留最终答案，
而无需重放轮次。部分助手增量、过期的早期回复和之后的空完成均不符合条件。

可安全重放的 stdio app-server 故障，包括不存在助手、工具、活动条目或
副作用证据的轮次完成空闲超时，会通过新的 app-server 尝试重试一次。
不安全的超时仍会停用卡住的 app-server 客户端并释放 OpenClaw 会话通道；
它们还会清除过期的原生线程绑定，而不是自动重放。完成监视超时会显示
Codex 特定的超时文本：可安全重放的情况会说明响应可能不完整，
而不安全的情况会提示用户在重试前验证当前状态。公开超时诊断包含结构化字段，
例如最后一个 app-server 通知方法、原始助手响应条目的 id/type/role、
活动请求/条目数量以及已启用的监视状态；当最后一个通知是原始助手响应条目时，
还会包含有长度限制的助手文本预览。诊断不会包含原始提示词或工具内容。

### 本地测试环境变量覆盖

- 当未设置 `appServer.command` 时，`OPENCLAW_CODEX_APP_SERVER_BIN`
  会绕过托管二进制文件。
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复的部署，建议使用配置，
因为它会将插件行为与 Codex harness 的其余设置保存在同一个经过审核的文件中。

## Native Codex plugins

Native Codex plugins 支持使用 Codex app-server 自身的应用和插件能力，
并与 OpenClaw harness 轮次位于同一个 Codex 线程中。OpenClaw
不会将 Codex 插件转换为合成的 `codex_plugin_*` OpenClaw
动态工具。

`codexPlugins` 仅影响选择原生 Codex harness 的会话。
它不会影响内置 harness 运行、常规 OpenAI provider 运行、ACP
对话绑定或其他 harness。

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

当 OpenClaw 建立 Codex harness 会话或替换过期的 Codex 线程绑定时，
会计算线程应用配置；该配置不会在每个轮次重新计算。更改 `codexPlugins`
后，请使用 `/new`、`/reset` 或重启 Gateway 网关，使后续 Codex harness
会话使用更新后的应用集启动。

有关迁移资格、应用清单、破坏性操作策略、信息征询和原生插件诊断，请参阅
[Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。

OpenAI 侧的应用和插件访问权限由已登录的 Codex 账号控制；对于 Business
和 Enterprise/Edu 工作区，还受工作区应用控制。有关 OpenAI 的账号和
工作区控制概览，请参阅
[通过 ChatGPT 套餐使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 计算机使用

计算机使用有单独的设置指南：
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

简而言之：OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作。
它会准备 Codex app-server，验证 `computer-use` MCP 服务器可用，
然后在 Codex 模式轮次期间由 Codex 负责原生 MCP 工具调用。

## 运行时边界

Codex harness 仅更改底层嵌入式智能体执行器。

- 支持 OpenClaw 动态工具。Codex 请求 OpenClaw 执行这些工具，
  因此 OpenClaw 仍位于执行路径中。
- Codex 原生 shell、patch、MCP 和原生应用工具由 Codex 负责。
  OpenClaw 可以通过支持的中继观察或阻止选定的原生事件，
  但不会重写原生工具参数。
- Codex 负责原生压缩。OpenClaw 为渠道历史记录、搜索、`/new`、
  `/reset` 以及将来的模型或 harness 切换保留一份转录镜像，
  但不会使用 OpenClaw 或上下文引擎摘要器替代 Codex 压缩。
- 媒体生成、媒体理解、TTS、审批和消息工具输出继续使用对应的
  OpenClaw 提供商/模型设置。
- `tool_result_persist` 适用于 OpenClaw 所有的转录工具结果，
  而不适用于 Codex 原生工具结果记录。

有关钩子层、受支持的 V1 接口、原生权限处理、队列引导、
Codex 反馈上传机制和压缩详情，请参阅
[Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)。

## 故障排查

**Codex 未显示为常规 `/model` 提供商：** 对于新配置，这是预期行为。
选择 `openai/gpt-*` 模型，启用 `plugins.entries.codex.enabled`，
并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用内置 harness 而不是 Codex：** 确认生效的路由是精确的官方
HTTPS Platform Responses 或 ChatGPT Responses 路由，没有人为设置的请求覆盖，
并且 Codex 插件已安装并启用。仅有 `openai/gpt-*` 前缀并不足够。
如需在测试期间获得严格证明，请将提供商或模型的
`agentRuntime.id: "codex"`；当路由或 harness 不兼容时，强制使用 Codex
会直接失败，而不会回退。

**OpenAI Codex 运行时回退到 API key 路径：** 收集经过脱敏的
Gateway 网关摘录，其中应显示模型、运行时、选定的提供商和故障。
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

**仍存在旧版 Codex 模型引用配置：** 运行 `openclaw doctor --fix`。
Doctor 会将旧版模型引用重写为 `openai/*`，移除过期的会话和
整个智能体运行时固定设置，并保留现有的身份验证配置文件覆盖。

**app-server 被拒绝：** 请使用 Codex app-server `0.143.0` 或更高版本。
相同版本的预发布版本或带构建后缀的版本（例如
`0.143.0-alpha.2` 或 `0.143.0+custom`）会被拒绝，因为 OpenClaw
会检测稳定版 `0.143.0` 协议下限。

**`/codex status` 无法连接：** 检查 `codex` 插件是否已启用，
配置允许列表时 `plugins.allow` 是否包含该插件，以及任何自定义
`appServer.command`、`url`、`authToken` 或请求头是否有效。

**模型发现速度较慢：** 调低
`plugins.entries.codex.config.discovery.timeoutMs` 或禁用设备发现。
请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference#model-discovery)。

**WebSocket 传输立即失败：** 检查 `appServer.url`、
`authToken`、请求头，并确认远程 app-server 使用相同版本的 Codex
app-server 协议。

**原生 shell 或补丁工具被阻止，并显示 `Native hook relay
unavailable`：**Codex 线程仍在尝试使用 OpenClaw 已不再注册的原生钩子中继
ID。这是原生 Codex 钩子传输问题，不是 ACP 后端、提供商、GitHub 或 shell 命令
故障。在受影响的聊天中使用 `/new` 或 `/reset` 启动新会话，
然后重试一个无害命令。如果这样能成功一次，但下一次原生工具
调用又失败，请仅将 `/new` 视为临时解决方法：重启 Codex app-server 或
OpenClaw Gateway 网关后，将提示词复制到新会话中，以丢弃旧线程并重新创建
原生钩子注册。

**非 Codex 模型使用内置 harness：**这是预期行为，除非提供商
或模型运行时策略将其路由到其他 harness。在 `auto` 模式下，普通的非 OpenAI
提供商引用仍使用其正常的提供商路径。

**计算机使用已安装，但工具无法运行：**在新会话中检查
`/codex computer-use status`。如果工具报告
`Native hook relay unavailable`，请使用上面的原生钩子中继恢复方法。
请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use#troubleshooting)。

## 相关内容

- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Codex 监督](/plugins/codex-supervision)
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
