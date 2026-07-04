---
read_when:
    - 你想使用内置的 Codex app-server harness
    - 你需要 Codex harness 配置示例
    - 你希望仅使用 Codex 的部署失败，而不是回退到 OpenClaw
summary: 通过内置的 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-07-04T10:27:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

内置的 `codex` 插件让 OpenClaw 通过 Codex app-server 运行嵌入式 OpenAI 智能体轮次，而不是使用内置的 OpenClaw harness。

当你希望 Codex 拥有底层智能体会话时，请使用 Codex harness：原生线程恢复、原生工具延续、原生压缩，以及 app-server 执行。OpenClaw 仍然拥有聊天渠道、会话文件、模型选择、OpenClaw 动态工具、审批、媒体交付，以及可见的转录镜像。

常规设置使用规范的 OpenAI 模型引用，例如 `openai/gpt-5.5`。不要配置旧版 Codex GPT 引用。将 OpenAI 智能体凭证顺序放在 `auth.order.openai` 下；较旧的旧版 Codex 凭证配置文件 ID 和旧版 Codex 凭证顺序条目属于旧版状态，由 `openclaw doctor --fix` 修复。

当没有启用 OpenClaw 沙箱时，OpenClaw 会在启用 Codex 原生代码模式的情况下启动 Codex app-server 线程，同时默认保持仅代码模式关闭。这样既能保留 Codex 原生工作区和代码能力，又能让 OpenClaw 动态工具继续通过 app-server `item/tool/call` 桥接运行。启用 OpenClaw 沙箱隔离和受限工具策略会完全禁用原生代码模式，除非你选择启用实验性的沙箱 exec-server 路径。

这个 Codex 原生功能不同于 [OpenClaw 代码模式](/zh-CN/reference/code-mode)，后者是一个可选启用的 QuickJS-WASI 运行时，用于具有不同 `exec` 输入形状的通用 OpenClaw 运行。

如需了解更广泛的模型/提供商/运行时拆分，请从 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 开始。简而言之：`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍然是通信界面。

## 要求

- OpenClaw 中有可用的内置 `codex` 插件。
- 如果你的配置使用 `plugins.allow`，请包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。内置插件默认管理兼容的 Codex app-server 二进制文件，因此 `PATH` 上的本地 `codex` 命令不会影响常规 harness 启动。
- 可通过 `openclaw models auth login --provider openai` 获取 Codex 凭证，或使用智能体 Codex home 中的 app-server 账号，或显式的 Codex API-key 凭证配置文件。

如需了解凭证优先级、环境隔离、自定义 app-server 命令、模型发现以及所有配置字段，请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 快速开始

大多数想在 OpenClaw 中使用 Codex 的用户需要这条路径：使用 ChatGPT/Codex 订阅登录，启用内置的 `codex` 插件，并使用规范的 `openai/gpt-*` 模型引用。

使用 Codex OAuth 登录：

```bash
openclaw models auth login --provider openai
```

启用内置的 `codex` 插件并选择 OpenAI 智能体模型：

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

更改插件配置后重启 Gateway 网关。如果现有聊天已经有会话，请在测试运行时变更前使用 `/new` 或 `/reset`，以便下一轮次从当前配置解析 harness。

## 与 Codex Desktop 和 CLI 共享线程

默认的 `appServer.homeScope: "agent"` 会让每个 OpenClaw 智能体与操作者的原生 Codex 状态隔离。若要让所有者请求 OpenClaw 检查和管理 Codex Desktop 与 Codex CLI 中显示的同一组原生线程，请选择使用用户 Codex home：

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

用户 home 模式仅适用于本地 stdio 传输。它会在设置时使用 `$CODEX_HOME`，否则使用 `~/.codex`，包括该 home 的原生 Codex 凭证、配置、插件和线程存储。OpenClaw 不会向此 app-server 注入 OpenClaw 凭证配置文件。

所有者轮次会获得 `codex_threads` 工具。它可以列出、搜索、读取、派生、重命名、归档和恢复原生线程。当你希望在 OpenClaw 中继续某个线程时，请让智能体派生该线程；该派生会附加到当前 OpenClaw 会话，并且仍对其他原生 Codex 客户端可见。归档要求明确确认该线程已在其他地方关闭。

不要从 OpenClaw 和另一个 Codex 客户端并发恢复或写入同一个线程。Codex 会在一个 app-server 进程内协调实时写入者，而不是跨独立的 Desktop、CLI 和 OpenClaw 进程协调。派生会创建单独的延续，是安全共存路径。

## 配置

快速开始配置是最小可用的 Codex harness 配置。在 OpenClaw 配置中设置 Codex harness 选项，并且仅将 CLI 用于 Codex 凭证：

| 需求                                   | 设置                                                                              | 位置                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 启用 harness                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw 配置                    |
| 保留允许列表中的插件安装     | 在 `plugins.allow` 中包含 `codex`                                               | OpenClaw 配置                    |
| 通过 Codex 路由 OpenAI 智能体轮次 | 将 `agents.defaults.model` 或 `agents.list[].model` 设为 `openai/gpt-*`               | OpenClaw 智能体配置              |
| 使用 ChatGPT/Codex OAuth 登录       | `openclaw models auth login --provider openai`                                   | CLI 凭证配置文件                   |
| 为 Codex 运行添加 API-key 备用      | 在 `auth.order.openai` 中列在订阅凭证之后的 `openai:*` API-key 配置文件 | CLI 凭证配置文件 + OpenClaw 配置 |
| Codex 不可用时失败关闭  | 提供商或模型 `agentRuntime.id: "codex"`                                     | OpenClaw 模型/提供商配置     |
| 使用直接 OpenAI API 流量          | 提供商或模型 `agentRuntime.id: "openclaw"`，配合常规 OpenAI 凭证          | OpenClaw 模型/提供商配置     |
| 调整 app-server 行为               | `plugins.entries.codex.config.appServer.*`                                       | Codex 插件配置                |
| 启用原生 Codex 插件应用        | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex 插件配置                |
| 启用 Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | Codex 插件配置                |

对 Codex 支持的 OpenAI 智能体轮次使用 `openai/gpt-*` 模型引用。优先使用 `auth.order.openai` 来实现订阅优先/API-key 备用排序。现有旧版 Codex 凭证配置文件 ID 和旧版 Codex 凭证顺序仅属于 Doctor 处理的旧版状态；不要写入新的旧版 Codex GPT 引用。

不要在 Codex 支持的智能体上设置 `compaction.model` 或 `compaction.provider`。Codex 会通过其原生 app-server 线程状态进行压缩，因此 OpenClaw 在运行时会忽略这些本地摘要器覆盖，并且当智能体使用 Codex 时，`openclaw doctor --fix` 会移除它们。

Lossless 仍支持作为围绕 Codex 轮次进行组装、摄取和维护的上下文引擎。请通过 `plugins.slots.contextEngine: "lossless-claw"` 和 `plugins.entries.lossless-claw.config.summaryModel` 配置它，而不是通过 `agents.defaults.compaction.provider`。当 Codex 是活动运行时时，`openclaw doctor --fix` 会将旧的 `compaction.provider: "lossless-claw"` 形状迁移到 Lossless 上下文引擎槽位，但原生 Codex 仍拥有压缩。

原生 Codex app-server harness 支持需要预提示词组装的上下文引擎。通用 CLI 后端（包括 `codex-cli`）不提供该宿主能力。

对于 Codex 支持的智能体，`/compact` 会在绑定线程上启动原生 Codex app-server 压缩。OpenClaw 不会等待完成、施加 OpenClaw 超时、重启共享 app-server，或回退到上下文引擎或公共 OpenAI 摘要器。如果原生 Codex 线程绑定缺失或过期，该命令会失败关闭，以便操作者看到真实的运行时边界，而不是静默切换压缩后端。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在该形状中，两个配置文件仍会针对 `openai/gpt-*` 智能体轮次通过 Codex 运行。API key 只是凭证回退，不是切换到 OpenClaw 或普通 OpenAI Responses 的请求。

本页其余部分介绍用户必须在其中选择的常见变体：部署形状、失败关闭路由、监护人审批策略、原生 Codex 插件，以及 Computer Use。如需完整选项列表、默认值、枚举、发现、环境隔离、超时和 app-server 传输字段，请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

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

`/codex status` 会报告 app-server 连接、账号、速率限制、MCP 服务器和 skills。`/codex models` 会列出该 harness 和账号的实时 Codex app-server 目录。如果 `/status` 的结果出乎意料，请参阅 [故障排除](#troubleshooting)。

## 路由和模型选择

保持提供商引用和运行时策略分离：

- 对通过 Codex 运行的 OpenAI 智能体轮次使用 `openai/gpt-*`。
- 不要在配置中使用旧版 Codex GPT 引用。运行 `openclaw doctor --fix` 来修复旧版引用和过期的会话路由固定项。
- `agentRuntime.id: "codex"` 对常规 OpenAI 自动模式是可选的，但当部署应在 Codex 不可用时失败关闭时很有用。
- `agentRuntime.id: "openclaw"` 会在有意这样做时，将提供商或模型选择加入 OpenClaw 嵌入式运行时。
- `/codex ...` 从聊天中控制原生 Codex app-server 对话。
- ACP/acpx 是单独的外部 harness 路径。仅当用户要求 ACP/acpx 或外部 harness 适配器时才使用它。

常见命令路由：

| 用户意图                                           | 使用                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加当前聊天                               | `/codex bind [--cwd <path>]`                                                                          |
| 恢复现有 Codex 线程                       | `/codex resume <thread-id>`                                                                           |
| 列出或筛选 Codex 线程                          | `/codex threads [filter]`                                                                             |
| 列出 Native Codex plugins                             | `/codex plugins list`                                                                                 |
| 启用或禁用已配置的 Native Codex plugin    | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 在已配对节点上附加现有 Codex CLI 会话 | `/codex sessions --host <node> [filter]`, then `/codex resume <session-id> --host <node> --bind here` |
| 仅发送 Codex 反馈                              | `/codex diagnostics [note]`                                                                           |
| 启动 ACP/acpx 任务                                | ACP/acpx 会话命令，而不是 `/codex`                                                               |

| 使用场景                                             | 配置                                                              | 验证                                  | 备注                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| 使用 Native Codex runtime 的 ChatGPT/Codex 订阅 | `openai/gpt-*` plus enabled `codex` plugin                             | `/status` 显示 `Runtime: OpenAI Codex` | 推荐路径                      |
| 如果 Codex 不可用则故障关闭                  | provider 或 model `agentRuntime.id: "codex"`                           | 轮次失败，而不是使用嵌入式后备 | 用于仅 Codex 部署        |
| 通过 OpenClaw 直连 OpenAI API key 流量       | provider 或 model `agentRuntime.id: "openclaw"` and normal OpenAI auth | `/status` 显示 OpenClaw 运行时        | 仅在有意使用 OpenClaw 时使用 |
| 旧版配置                                        | legacy Codex GPT refs                                                  | `openclaw doctor --fix` 会重写它     | 不要用这种方式编写新配置      |
| ACP/acpx Codex 适配器                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP 任务/会话状态                 | 与 Native Codex harness 分离    |

`agents.defaults.imageModel` 遵循相同的前缀拆分。普通 OpenAI 路由使用 `openai/gpt-*`，
只有当图像理解应通过有边界的 Codex 应用服务器轮次运行时才使用 `codex/gpt-*`。
不要使用旧版 Codex GPT 引用；Doctor 会把该旧版前缀重写为 `openai/gpt-*`。

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

此形态保留 Claude 作为默认智能体，并添加一个命名的 Codex 智能体：

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

使用此配置时，`main` 智能体使用其普通提供商路径，而 `codex` 智能体使用 Codex 应用服务器。

### 故障关闭 Codex 部署

对于 OpenAI 智能体轮次，当内置插件可用时，`openai/gpt-*` 已经会解析到 Codex。
当你希望写明故障关闭规则时，添加显式运行时策略：

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

强制使用 Codex 后，如果 Codex 插件被禁用、应用服务器过旧，或应用服务器无法启动，OpenClaw 会提前失败。

## 应用服务器策略

默认情况下，该插件会在本地使用 stdio 传输启动 OpenClaw 托管的 Codex 二进制文件。
只有在你有意运行不同可执行文件时，才设置 `appServer.command`。
只有当应用服务器已在其他位置运行时，才使用 WebSocket 传输：

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

本地 stdio 应用服务器会话默认采用受信任的本地操作者姿态：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。如果本地 Codex 要求不允许这种隐式 YOLO 姿态，
OpenClaw 会改为选择允许的守护者权限。
当 OpenClaw 沙箱对该会话处于活动状态时，OpenClaw 会为该轮次禁用 Codex 原生代码模式、
用户 MCP 服务器和应用托管的插件执行，而不是依赖 Codex 主机侧沙箱隔离。
当普通 exec/process 工具可用时，Shell 访问会通过 OpenClaw 沙箱支持的动态工具暴露，
例如 `sandbox_exec` 和 `sandbox_process`。

当你希望在沙箱逃逸或额外权限之前使用 Codex 原生自动审查时，使用规范化的 OpenClaw exec 模式：

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

对于 Codex 应用服务器会话，OpenClaw 会将 `tools.exec.mode: "auto"` 映射到由 Codex
Guardian 审查的审批，通常是
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和
`sandbox: "workspace-write"`，前提是本地要求允许这些值。
在 `tools.exec.mode: "auto"` 中，OpenClaw 不会保留旧版不安全的 Codex
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆盖；如需有意使用无需审批的
Codex 姿态，请使用 `tools.exec.mode: "full"`。
旧版 `plugins.entries.codex.config.appServer.mode: "guardian"` 预设仍然可用，
但 `tools.exec.mode: "auto"` 是规范化的 OpenClaw 表面。

有关与主机 exec 审批和 ACPX 权限的模式级对比，请参见 [权限模式](/zh-CN/tools/permission-modes)。

有关每个应用服务器字段、认证顺序、环境隔离、发现和超时行为，请参见
[Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 命令和诊断

内置插件会在任何支持 OpenClaw 文本命令的渠道上注册 `/codex` 作为斜杠命令。

原生执行和控制需要所有者或 `operator.admin` Gateway 网关客户端。
这包括绑定或恢复线程、发送或停止轮次、更改模型、快速模式或权限状态、压缩或审查，
以及解除绑定。其他授权发送者仍保留只读状态、帮助、账户、模型、线程、MCP 服务器、
技能和绑定检查命令。

常见形式：

- `/codex status` 检查应用服务器连接、模型、账户、速率限制、MCP 服务器和 Skills。
- `/codex models` 列出实时 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 应用服务器线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 请求 Codex 应用服务器压缩已附加线程。
- `/codex review` 为已附加线程启动 Codex 原生审查。
- `/codex diagnostics [note]` 会在发送已附加线程的 Codex 反馈前请求确认。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器 Skills。

对于大多数支持报告，请从发生错误的对话中运行 `/diagnostics [note]` 开始。
它会创建一份 Gateway 网关诊断报告；对于 Codex harness 会话，还会请求批准发送相关的 Codex
反馈包。有关隐私模型和群组聊天行为，请参见 [诊断导出](/zh-CN/gateway/diagnostics)。

仅当你明确想为当前已附加线程上传 Codex 反馈、而不需要完整 Gateway 网关诊断包时，
才使用 `/codex diagnostics [note]`。

### 在本地检查 Codex 线程

检查异常 Codex 运行的最快方式通常是直接打开原生 Codex 线程：

```bash
codex resume <thread-id>
```

从已完成的 `/diagnostics` 回复、`/codex binding` 或 `/codex threads [filter]` 获取线程 ID。

有关上传机制和运行时级诊断边界，请参见
[Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#codex-feedback-upload)。

在默认的每智能体主目录中，认证按以下顺序选择：

1. 该智能体的有序 OpenAI 认证配置文件，最好位于
   `auth.order.openai` 下。运行 `openclaw doctor --fix` 以迁移旧版
   Codex 认证配置文件 ID 和旧版 Codex 认证顺序。
2. 该智能体 Codex 主目录中的应用服务器现有账户。
3. 仅对本地 stdio 应用服务器启动，在没有应用服务器账户且仍需要 OpenAI 认证时，
   使用 `CODEX_API_KEY`，然后使用 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅式 Codex 认证配置文件时，它会从生成的 Codex 子进程中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。这会让 Gateway 网关级 API key 仍可用于嵌入或直连
OpenAI 模型，同时避免原生 Codex 应用服务器轮次意外通过 API 计费。
显式 Codex API key 配置文件和本地 stdio 环境变量 key 后备会使用应用服务器登录，
而不是继承子进程环境。WebSocket 应用服务器连接不会接收 Gateway 网关环境 API key 后备；
请使用显式认证配置文件或远程应用服务器自己的账户。
配置 Native Codex plugins 后，OpenClaw 会先通过已连接的应用服务器安装或刷新这些插件，
然后再把插件拥有的应用暴露给 Codex 线程。`app/list` 仍然是应用 ID、可访问性和元数据的事实来源，
但 OpenClaw 拥有每线程启用决策：如果策略允许某个已列出且可访问的应用，OpenClaw 会发送
`thread/start.config.apps[appId].enabled = true`，即使 `app/list` 当前报告该应用已禁用。
此路径不会为未知 ID 虚构应用安装；OpenClaw 只会使用 `plugin/install` 激活市场插件，
然后刷新清单。

如果订阅配置文件触发 Codex 使用量限制，OpenClaw 会在 Codex 报告重置时间时记录该时间，
并为同一次 Codex 运行尝试下一个有序认证配置文件。重置时间过去后，该订阅配置文件会再次符合条件，
无需更改所选 `openai/gpt-*` 模型或 Codex 运行时。

对于本地 stdio app-server 启动，OpenClaw 会将 `CODEX_HOME` 设置为每个 agent 独立的目录，这样 Codex 配置、凭证/账号文件、插件缓存/数据以及原生线程状态默认不会读取或写入操作者个人的 `~/.codex`。OpenClaw 会保留正常的进程 `HOME`；Codex 运行的子进程仍然可以找到用户主目录配置和令牌，并且 Codex 可能会发现共享的 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json` 条目。使用 `appServer.homeScope: "user"` 时，OpenClaw 会改用原生用户 Codex 主目录及其现有账号，而不会注入 OpenClaw 凭证配置文件。

如果某个部署需要额外的环境隔离，请将这些变量添加到 `appServer.clearEnv`：

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

`appServer.clearEnv` 只影响生成的 Codex app-server 子进程。OpenClaw 会在本地启动规范化期间从该列表中移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 会继续指向所选的 agent 或用户范围，而 `HOME` 会继续继承，以便子进程使用正常的用户主目录状态。

Codex 动态工具默认使用 `searchable` 加载。OpenClaw 不会暴露与 Codex 原生工作区操作重复的动态工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。大多数剩余的 OpenClaw 集成工具，例如消息、媒体、cron、浏览器、节点、Gateway 网关和 `heartbeat_respond`，都可通过 `openclaw` 命名空间下的 Codex 工具搜索使用，从而让初始模型上下文更小。启用搜索且未选择托管提供商时，Web 搜索默认使用 Codex 托管的 `web_search` 工具。原生托管搜索与 OpenClaw 托管的 `web_search` 动态工具互斥，因此托管搜索无法绕过原生域名限制。当托管搜索不可用、被明确禁用，或被所选的托管提供商替换时，OpenClaw 会使用托管工具。OpenClaw 会保持 Codex 的独立 `web.run` 扩展处于禁用状态，因为生产 app-server 流量会拒绝其用户定义的 `web` 命名空间。`tools.web.search.enabled: false` 会禁用这两条路径，工具禁用的仅 LLM 运行也是如此。Codex 会将 `"cached"` 视为偏好，并在不受限制的 app-server 轮次中将其解析为实时外部访问。当设置了原生 `allowedDomains` 时，自动托管回退会以关闭方式失败，因此允许列表无法被绕过。持久的有效搜索策略变更会在下一轮之前轮换已绑定的 Codex 线程。瞬态的按轮次限制会使用临时受限线程，并保留现有绑定以便后续恢复。`sessions_yield` 和仅消息工具的来源回复保持直接模式，因为这些是轮次控制契约。`sessions_spawn` 保持 searchable，因此 Codex 原生的 `spawn_agent` 仍然是主要的 Codex 子智能体界面，同时仍可通过 `openclaw` 动态工具命名空间使用显式 OpenClaw 或 ACP 委派。Heartbeat 协作说明会告诉 Codex，当工具尚未加载时，在结束 Heartbeat 轮次之前搜索 `heartbeat_respond`。

仅当连接到无法搜索延迟动态工具的自定义 Codex app-server，或调试完整工具负载时，才设置 `codexDynamicToolsLoading: "direct"`。

支持的顶层 Codex 插件字段：

| 字段                       | 默认值         | 含义                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 将 OpenClaw 动态工具直接放入初始 Codex 工具上下文。                     |
| `codexDynamicToolsExclude` | `[]`           | 要从 Codex app-server 轮次中省略的其他 OpenClaw 动态工具名称。                          |
| `codexPlugins`             | disabled       | 面向已迁移的源安装精选插件的原生 Codex 插件/app 支持。                                  |

支持的 `appServer` 字段：

| 字段                                          | 默认值                                                 | 含义                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                                                                                                                                                                                                                          |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 会按 OpenClaw 智能体隔离 Codex 状态。`"user"` 会共享原生 `$CODEX_HOME` 或 `~/.codex`，使用原生身份验证，并启用仅所有者可用的线程管理。用户作用域要求使用 stdio。                                                                                                                                                                                                                     |
| `command`                                     | 托管的 Codex 二进制文件                                | stdio 传输使用的可执行文件。保持未设置以使用托管二进制文件；仅在明确需要覆盖时设置。                                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输的参数。                                                                                                                                                                                                                                                                                                                                                                             |
| `url`                                         | 未设置                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未设置                                                 | WebSocket 传输的 Bearer 令牌。接受字面量字符串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                |
| `headers`                                     | `{}`                                                   | 额外的 WebSocket 标头。标头值接受字面量字符串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                          |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 构建继承环境后，从派生的 stdio app-server 进程中移除的额外环境变量名称。OpenClaw 会为本地启动保留所选的 `CODEX_HOME` 和继承的 `HOME`。                                                                                                                                                                                                                                                 |
| `codeModeOnly`                                | `false`                                                | 选择使用 Codex 的仅代码模式工具表面。OpenClaw 动态工具仍会注册到 Codex，因此嵌套的 `tools.*` 调用会通过 app-server `item/tool/call` 桥返回。                                                                                                                                                                                                                                                    |
| `remoteWorkspaceRoot`                         | 未设置                                                 | 远程 Codex app-server 工作区根目录。设置后，OpenClaw 会从解析出的 OpenClaw 工作区推断本地工作区根目录，在此远程根目录下保留当前 cwd 后缀，并且只将最终的 app-server cwd 发送给 Codex。如果 cwd 位于解析出的 OpenClaw 工作区根目录之外，OpenClaw 会失败时默认拒绝，而不是把 Gateway 网关本地路径发送给远程 app-server。                                                                      |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面调用的超时时间。                                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一个轮次后，或 OpenClaw 等待 `turn/completed` 时一次轮次作用域 app-server 请求之后的静默窗口。                                                                                                                                                                                                                                                                                        |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 时，在工具交接、原生工具完成、工具后原始 assistant 进度、原始推理完成或推理进度之后使用的完成空闲和进度保护。对于可信或繁重的工作负载，如果工具后合成可以合理地比最终 assistant 发布预算保持更长时间的静默，请使用此项。                                                                                                                                        |
| `mode`                                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO               | YOLO 或 guardian 审核执行的预设。省略 `danger-full-access`、`never` 审批或 `user` 审核者的本地 stdio 要求会让隐式默认值变为 guardian。                                                                                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` 或允许的 guardian 审批策略                   | 发送到线程启动、恢复或轮次的原生 Codex 审批策略。guardian 默认值在允许时优先使用 `"on-request"`。                                                                                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` 或允许的 guardian 沙箱          | 发送到线程启动或恢复的原生 Codex 沙箱模式。guardian 默认值在允许时优先使用 `"workspace-write"`，否则使用 `"read-only"`。当 OpenClaw 沙箱处于活动状态时，`danger-full-access` 轮次会使用 Codex `workspace-write`，并从 OpenClaw 沙箱出口设置派生网络访问权限。                                                                                                                                    |
| `approvalsReviewer`                           | `"user"` 或允许的 guardian 审核者                      | 在允许时使用 `"auto_review"` 让 Codex 审核原生审批提示，否则使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是旧版别名。                                                                                                                                                                                                                                                              |
| `serviceTier`                                 | 未设置                                                 | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求 flex 处理，`null` 清除覆盖，旧版 `"fast"` 会按 `"priority"` 接受。                                                                                                                                                                                                                                                |
| `networkProxy`                                | 已禁用                                                 | 选择对 app-server 命令使用 Codex 权限配置文件网络。OpenClaw 会定义所选 `permissions.<profile>.network` 配置，并通过 `default_permissions` 选择它，而不是发送 `sandbox`。                                                                                                                                                                                                                       |
| `experimental.sandboxExecServer`              | `false`                                                | 预览版选择项，会向 Codex app-server 0.132.0 或更高版本注册一个由 OpenClaw 沙箱支持的 Codex 环境，使原生 Codex 执行可在活动的 OpenClaw 沙箱内运行。                                                                                                                                                                                                                                              |

`appServer.networkProxy` 是显式配置，因为它会更改 Codex 沙箱契约。启用后，OpenClaw 还会在 Codex 线程配置中设置 `features.network_proxy.enabled` 和 `default_permissions`，使生成的权限配置文件可以启动 Codex 托管网络。默认情况下，OpenClaw 会根据配置文件正文生成抗冲突的 `openclaw-network-<fingerprint>` 配置文件名；仅在需要稳定本地名称时使用 `profileName`。

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

如果普通 app-server 运行时会是 `danger-full-access`，启用
`networkProxy` 会为生成的权限配置文件使用工作区式文件系统访问。Codex 托管网络强制执行是沙箱隔离的网络，
因此完全访问配置文件无法保护出站流量。
域名条目使用 `allow` 或 `deny`；Unix 套接字条目使用 Codex 的
`allow` 或 `none` 值。

OpenClaw 拥有的动态工具调用独立于
`appServer.requestTimeoutMs` 受限：Codex `item/tool/call` 请求默认使用 90 秒的
OpenClaw 看门狗。正数的单次调用 `timeoutMs` 参数会延长
或缩短该特定工具预算。`image_generate` 工具在工具调用未
提供自己的超时时，使用
`agents.defaults.imageGenerationModel.timeoutMs`，否则使用 120 秒的图像生成默认值。
媒体理解 `image` 工具使用
`tools.media.image.timeoutSeconds` 或其 60 秒媒体默认值。对于图像
理解，该超时适用于请求本身，不会因先前的准备工作而
缩短。动态工具预算上限为 600000 ms。超时时，OpenClaw 会在支持的位置中止工具信号，
并向 Codex 返回失败的动态工具响应，以便轮次
可以继续，而不是让会话停留在 `processing`。
这个看门狗是外层动态 `item/tool/call` 预算；提供商特定的
请求超时在该调用内部运行，并保留其自身的超时语义。

在 Codex 接受一个轮次之后，以及 OpenClaw 响应一个轮次范围的
app-server 请求之后，harness 期望 Codex 推进当前轮次并
最终以 `turn/completed` 完成本机轮次。如果 app-server 在
`appServer.turnCompletionIdleTimeoutMs` 内保持静默，OpenClaw 会尽力
中断 Codex 轮次，记录诊断超时，并释放
OpenClaw 会话通道，使后续聊天消息不会排在一个陈旧的
本机轮次之后。同一轮次的大多数非终止通知会解除这个短
看门狗，因为 Codex 已经证明该轮次仍然存活。工具交接使用
更长的工具后空闲预算：在 OpenClaw 返回 `item/tool/call`
响应之后，在 `commandExecution` 等本机工具项完成之后，在原始
`custom_tool_call_output` 完成之后，以及在工具后原始 assistant
进度、原始 reasoning 完成或 reasoning 进度之后。该保护在配置时使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，
否则默认五分钟。同一个工具后预算还会延长
Codex 发出下一个当前轮次事件前静默合成窗口的进度看门狗。
全局 app-server 通知，例如速率限制更新，
不会重置轮次空闲进度。Reasoning 完成、commentary
`agentMessage` 完成，以及工具前原始 reasoning 或 assistant 进度，之后可能
跟随自动最终回复，因此它们使用进度后回复
保护，而不是立即释放会话通道。只有
最终/非 commentary 已完成的 `agentMessage` 项和工具前原始
assistant 完成会启用 assistant 输出释放：如果 Codex 随后保持静默
且没有 `turn/completed`，OpenClaw 会尽力中断本机轮次并
释放会话通道。如果另一个轮次监视赢得了该释放竞态，
只要不再有本机请求、项或动态工具完成处于活动状态，并且
assistant 输出释放仍属于最新完成的项，且没有
后续项完成，OpenClaw 仍会接受已完成的最终 assistant 项。
这可以在已完成的工具工作之后保留最终答案，而无需重放轮次。
部分 assistant delta、陈旧的较早回复以及空的较晚完成
不符合条件。可安全重放的 stdio
app-server 失败，
包括没有 assistant、工具、活动项
或副作用证据的轮次完成空闲超时，会在新的 app-server 尝试中重试一次。不安全的
超时仍会停用卡住的 app-server 客户端并释放 OpenClaw
会话通道。它们还会清除陈旧的本机线程绑定，而不是
自动重放。完成监视超时会呈现 Codex 特定的超时
文本：可安全重放的情况会说明响应可能不完整，而不安全的情况
会提示用户在重试前验证当前状态。公开超时诊断
包含结构化字段，例如最后一个 app-server 通知方法、
原始 assistant 响应项 id/type/role、活动请求/项计数以及已启用的
监视状态。当最后一个通知是原始 assistant 响应项时，它们
还会包含有界的 assistant 文本预览。它们不包含原始 prompt 或
工具内容。

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，
`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或
使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 进行一次性本地测试。对于可重复部署，
配置是首选，因为它会将插件行为与其余 Codex harness 设置保留在
同一个已审查文件中。

## Native Codex plugins

Native Codex plugins 支持使用 Codex app-server 自身的 app 和 plugin
能力，并位于与 OpenClaw harness 轮次相同的 Codex 线程中。OpenClaw
不会把 Codex 插件翻译成合成的 `codex_plugin_*` OpenClaw
动态工具。

`codexPlugins` 只影响选择 native Codex harness 的会话。它
不会影响内置 harness 运行、普通 OpenAI provider 运行、ACP 对话
绑定或其他 harness。

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

线程 app 配置会在 OpenClaw 建立 Codex harness 会话
或替换陈旧的 Codex 线程绑定时计算。它不会在每个轮次重新计算。
更改 `codexPlugins` 后，请使用 `/new`、`/reset`，或重启 Gateway 网关，以便
未来的 Codex harness 会话使用更新后的 app 集启动。

关于迁移资格、app 清单、破坏性操作策略、
elicitations 和 native plugin 诊断，请参见
[Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。

OpenAI 侧的 app 和 plugin 访问由已登录的 Codex 账号控制，
对于 Business 和 Enterprise/Edu 工作区，还由工作区 app 控件控制。请参见
[Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
了解 OpenAI 的账号和工作区控制概览。

## Computer Use

Computer Use 在自己的设置指南中介绍：
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

简短说明：OpenClaw 不会 vendor 桌面控制 app，也不会自行执行
桌面操作。它会准备 Codex app-server，验证
`computer-use` MCP 服务器可用，然后让 Codex 在 Codex 模式轮次期间拥有本机 MCP
工具调用。

## 运行时边界

Codex harness 只更改低层嵌入式智能体执行器。

- 支持 OpenClaw 动态工具。Codex 会要求 OpenClaw 执行这些
  工具，因此 OpenClaw 仍位于执行路径中。
- Codex 本机 shell、patch、MCP 和本机 app 工具由 Codex 拥有。
  OpenClaw 可以通过受支持的
  中继观察或阻止选定的本机事件，但不会重写本机工具参数。
- Codex 拥有本机压缩。OpenClaw 为频道
  历史、搜索、`/new`、`/reset` 以及未来的模型或 harness 切换保留转录镜像，但
  它不会用 OpenClaw 或 context-engine
  summarizer 替换 Codex 压缩。
- 媒体生成、媒体理解、TTS、审批和消息工具
  输出继续通过匹配的 OpenClaw provider/model 设置。
- `tool_result_persist` 适用于 OpenClaw 拥有的转录工具结果，而不是
  Codex 本机工具结果记录。

关于钩子层、受支持的 V1 表面、本机权限处理、队列
Steer、Codex 反馈上传机制和压缩详情，请参见
[Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)。

## 故障排除

**Codex 未显示为普通 `/model` 提供商：** 对于
新配置，这是预期行为。选择一个 `openai/gpt-*` 模型，启用
`plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了
`codex`。

**OpenClaw 使用内置 harness 而不是 Codex：** 确保模型引用在官方 OpenAI provider 上是
`openai/gpt-*`，并且 Codex 插件已安装并启用。如果你在测试时需要严格证明，请设置 provider 或
model `agentRuntime.id: "codex"`。强制 Codex 运行时会失败，而不是
回退到 OpenClaw。

**OpenAI Codex 运行时回退到 API key 路径：** 收集一段已脱敏的
Gateway 网关摘录，显示模型、运行时、选定提供商和失败。
请受影响的协作者在他们的 OpenClaw 主机上运行这个只读命令：

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

有用的摘录通常包含 `openai/gpt-5.5` 或 `openai/gpt-5.4`、
`Runtime: OpenAI Codex`、`agentRuntime.id` 或 `harnessRuntime`、
`candidateProvider: "openai"`，以及 `401`、`Incorrect API key` 或
`No API key` 结果。修正后的运行应显示 OpenAI OAuth
路径，而不是普通的 OpenAI API key 失败。

**旧版 Codex 模型引用配置仍然存在：** 运行 `openclaw doctor --fix`。
Doctor 会将旧版模型引用重写为 `openai/*`，移除陈旧的会话和
整个智能体运行时 pin，并保留现有的 auth-profile 覆盖。

**app-server 被拒绝：** 使用 Codex app-server `0.125.0` 或更新版本。
相同版本的预发布版或带构建后缀的版本，例如
`0.125.0-alpha.2` 或 `0.125.0+custom` 会被拒绝，因为 OpenClaw 测试的是
稳定版 `0.125.0` 协议下限。

**`/codex status` 无法连接：** 检查内置 `codex` 插件是否
已启用，配置 allowlist 时 `plugins.allow` 是否包含它，以及
任何自定义 `appServer.command`、`url`、`authToken` 或 headers 是否有效。

**模型发现很慢：** 降低
`plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。请参见
[Codex harness reference](/zh-CN/plugins/codex-harness-reference#model-discovery)。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`、
headers，并确认远程 app-server 使用相同的 Codex app-server
协议版本。

**原生 shell 或 patch 工具因 `Native hook relay unavailable` 被阻止：**
Codex 线程仍在尝试使用一个 OpenClaw 已不再注册的原生 hook relay id。这是原生 Codex hook 传输问题，不是 ACP 后端、提供商、GitHub 或 shell 命令失败。在受影响的聊天中用 `/new` 或 `/reset` 开启新会话，然后重试一个无害命令。如果它成功一次，但下一次原生工具调用又失败，请仅把 `/new` 视为临时解决方法：重启 Codex app-server 或 OpenClaw Gateway 网关后，把 prompt 复制到新会话中，这样旧线程会被丢弃，原生 hook 注册也会重新创建。

**非 Codex 模型使用内置 harness：** 这是预期行为，除非提供商或模型运行时策略将其路由到另一个 harness。普通非 OpenAI 提供商引用在 `auto` 模式下会保持在其正常提供商路径上。

**Computer Use 已安装但工具不运行：** 从新会话中检查 `/codex computer-use status`。如果某个工具报告 `Native hook relay unavailable`，请使用上面的原生 hook relay 恢复步骤。参见 [Codex Computer Use](/zh-CN/plugins/codex-computer-use#troubleshooting)。

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
