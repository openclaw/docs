---
read_when:
    - 你想使用内置的 Codex 应用服务器测试框架
    - 你需要 Codex harness 配置示例
    - 你希望仅 Codex 部署失败，而不是回退到 OpenClaw
summary: 通过内置 Codex app-server harness 运行 OpenClaw 嵌入式智能体轮次
title: Codex harness
x-i18n:
    generated_at: "2026-06-30T13:48:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

内置的 `codex` 插件让 OpenClaw 通过 Codex app-server 运行嵌入式 OpenAI 智能体轮次，而不是使用内置的 OpenClaw harness。

当你希望由 Codex 拥有底层智能体会话时，请使用 Codex harness：原生线程恢复、原生工具续接、原生压缩，以及 app-server 执行。OpenClaw 仍然拥有聊天渠道、会话文件、模型选择、OpenClaw 动态工具、审批、媒体投递，以及可见的转录镜像。

常规设置使用规范的 OpenAI 模型引用，例如 `openai/gpt-5.5`。不要配置旧版 Codex GPT 引用。将 OpenAI 智能体认证顺序放在 `auth.order.openai` 下；较旧的旧版 Codex 认证配置文件 ID 和旧版 Codex 认证顺序条目属于旧版状态，由 `openclaw doctor --fix` 修复。

当没有启用 OpenClaw 沙箱时，OpenClaw 会在启用 Codex 原生代码模式的情况下启动 Codex app-server 线程，同时默认关闭仅代码模式。这样会保留 Codex 原生工作区和代码能力，同时 OpenClaw 动态工具继续通过 app-server `item/tool/call` 桥接运行。启用 OpenClaw 沙箱隔离和受限工具策略时，会完全禁用原生代码模式，除非你选择加入实验性的沙箱 exec-server 路径。

这个 Codex 原生功能不同于 [OpenClaw 代码模式](/zh-CN/reference/code-mode)，后者是一个可选择启用的 QuickJS-WASI 运行时，用于具有不同 `exec` 输入形状的通用 OpenClaw 运行。

如需了解更宽泛的模型/提供商/运行时拆分，请先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。简短版本是：`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他渠道仍然是通信表面。

## 要求

- OpenClaw 可使用内置的 `codex` 插件。
- 如果你的配置使用 `plugins.allow`，请包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。内置插件默认管理兼容的 Codex app-server 二进制文件，因此 `PATH` 上的本地 `codex` 命令不会影响常规 harness 启动。
- 可通过 `openclaw models auth login --provider openai` 获取 Codex 认证、智能体 Codex home 中的 app-server 账户，或显式的 Codex API key 认证配置文件。

有关认证优先级、环境隔离、自定义 app-server 命令、模型发现，以及所有配置字段，请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 快速开始

想在 OpenClaw 中使用 Codex 的大多数用户需要这条路径：使用 ChatGPT/Codex 订阅登录，启用内置的 `codex` 插件，并使用规范的 `openai/gpt-*` 模型引用。

使用 Codex OAuth 登录：

```bash
openclaw models auth login --provider openai
```

启用内置的 `codex` 插件，并选择一个 OpenAI 智能体模型：

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

如果你的配置使用 `plugins.allow`，也请在其中添加 `codex`：

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

更改插件配置后重启 Gateway 网关。如果现有聊天已经有会话，请在测试运行时变更之前使用 `/new` 或 `/reset`，这样下一个轮次会从当前配置解析 harness。

## 配置

快速开始配置是最低可用的 Codex harness 配置。请在 OpenClaw 配置中设置 Codex harness 选项，并且仅将 CLI 用于 Codex 认证：

| 需求                                   | 设置                                                                              | 位置                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 启用 harness                           | `plugins.entries.codex.enabled: true`                                            | OpenClaw 配置                      |
| 保持 allowlist 中的插件安装            | 在 `plugins.allow` 中包含 `codex`                                                | OpenClaw 配置                      |
| 通过 Codex 路由 OpenAI 智能体轮次      | `agents.defaults.model` 或 `agents.list[].model` 设为 `openai/gpt-*`             | OpenClaw 智能体配置                |
| 使用 ChatGPT/Codex OAuth 登录          | `openclaw models auth login --provider openai`                                   | CLI 认证配置文件                   |
| 为 Codex 运行添加 API key 备份         | `auth.order.openai` 中在订阅认证之后列出的 `openai:*` API key 配置文件           | CLI 认证配置文件 + OpenClaw 配置   |
| Codex 不可用时失败关闭                 | 提供商或模型 `agentRuntime.id: "codex"`                                          | OpenClaw 模型/提供商配置           |
| 使用直接 OpenAI API 流量               | 提供商或模型 `agentRuntime.id: "openclaw"`，并使用常规 OpenAI 认证              | OpenClaw 模型/提供商配置           |
| 调整 app-server 行为                   | `plugins.entries.codex.config.appServer.*`                                       | Codex 插件配置                     |
| 启用原生 Codex 插件应用                | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex 插件配置                     |
| 启用 Codex Computer Use                | `plugins.entries.codex.config.computerUse.*`                                     | Codex 插件配置                     |

对 Codex 支持的 OpenAI 智能体轮次使用 `openai/gpt-*` 模型引用。优先使用 `auth.order.openai` 来配置订阅优先/API key 备份的顺序。现有旧版 Codex 认证配置文件 ID 和旧版 Codex 认证顺序仅属于 Doctor 处理的旧版状态；不要写入新的旧版 Codex GPT 引用。

不要在 Codex 支持的智能体上设置 `compaction.model` 或 `compaction.provider`。Codex 通过其原生 app-server 线程状态进行压缩，因此 OpenClaw 会在运行时忽略这些本地摘要器覆盖项，并且当智能体使用 Codex 时，`openclaw doctor --fix` 会移除它们。

Lossless 仍然支持作为上下文引擎，用于 Codex 轮次周围的组装、摄取和维护。请通过 `plugins.slots.contextEngine: "lossless-claw"` 和 `plugins.entries.lossless-claw.config.summaryModel` 配置它，而不是通过 `agents.defaults.compaction.provider`。当 Codex 是活动运行时时，`openclaw doctor --fix` 会将旧的 `compaction.provider: "lossless-claw"` 形状迁移到 Lossless 上下文引擎槽位，但原生 Codex 仍然拥有压缩。

原生 Codex app-server harness 支持需要预提示组装的上下文引擎。通用 CLI 后端（包括 `codex-cli`）不提供该宿主能力。

对于 Codex 支持的智能体，`/compact` 会在绑定线程上启动原生 Codex app-server 压缩。OpenClaw 不会等待完成、施加 OpenClaw 超时、重启共享 app-server，也不会回退到上下文引擎或公开 OpenAI 摘要器。如果缺失原生 Codex 线程绑定或绑定已过期，该命令会失败关闭，让操作员看到真实的运行时边界，而不是静默切换压缩后端。

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在该形状中，两个配置文件仍然都会通过 Codex 运行 `openai/gpt-*` 智能体轮次。API key 只是认证回退，并不是切换到 OpenClaw 或普通 OpenAI Responses 的请求。

本页其余部分涵盖用户必须在其中选择的常见变体：部署形状、失败关闭路由、guardian 审批策略、原生 Codex 插件，以及 Computer Use。有关完整选项列表、默认值、枚举、发现、环境隔离、超时和 app-server 传输字段，请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 验证 Codex 运行时

在你预期使用 Codex 的聊天中使用 `/status`。由 Codex 支持的 OpenAI 智能体轮次会显示：

```text
Runtime: OpenAI Codex
```

然后检查 Codex app-server 状态：

```text
/codex status
/codex models
```

`/codex status` 会报告 app-server 连接、账户、速率限制、MCP 服务器和 skills。`/codex models` 会列出该 harness 和账户的实时 Codex app-server 目录。如果 `/status` 的结果出乎意料，请参阅 [故障排除](#troubleshooting)。

## 路由和模型选择

将提供商引用和运行时策略分开：

- 对通过 Codex 的 OpenAI 智能体轮次使用 `openai/gpt-*`。
- 不要在配置中使用旧版 Codex GPT 引用。运行 `openclaw doctor --fix` 来修复旧版引用和过期会话路由固定。
- 对常规 OpenAI 自动模式来说，`agentRuntime.id: "codex"` 是可选的，但当部署应在 Codex 不可用时失败关闭，它很有用。
- `agentRuntime.id: "openclaw"` 会在有意这样做时，让提供商或模型使用 OpenClaw 嵌入式运行时。
- `/codex ...` 从聊天中控制原生 Codex app-server 对话。
- ACP/acpx 是单独的外部 harness 路径。仅在用户请求 ACP/acpx 或外部 harness 适配器时使用它。

常见命令路由：

| 用户意图                                              | 使用                                                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加当前聊天                                          | `/codex bind [--cwd <path>]`                                                                          |
| 恢复现有 Codex 线程                                   | `/codex resume <thread-id>`                                                                           |
| 列出或筛选 Codex 线程                                 | `/codex threads [filter]`                                                                             |
| 列出原生 Codex 插件                                   | `/codex plugins list`                                                                                 |
| 启用或禁用已配置的原生 Codex 插件                     | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 在已配对节点上附加现有 Codex CLI 会话                 | `/codex sessions --host <node> [filter]`, then `/codex resume <session-id> --host <node> --bind here` |
| 仅发送 Codex 反馈                                     | `/codex diagnostics [note]`                                                                           |
| 启动 ACP/acpx 任务                                    | ACP/acpx 会话命令，而不是 `/codex`                                                                    |

| 使用场景                                             | 配置                                                              | 验证                                  | 说明                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| 使用原生 Codex runtime 的 ChatGPT/Codex 订阅 | `openai/gpt-*` 加上已启用的 `codex` 插件                             | `/status` 显示 `Runtime: OpenAI Codex` | 推荐路径                      |
| 如果 Codex 不可用则失败关闭                  | provider 或 model `agentRuntime.id: "codex"`                           | 轮次失败，而不是使用嵌入式回退 | 用于仅 Codex 的部署        |
| 通过 OpenClaw 直接路由 OpenAI API key 流量       | provider 或 model `agentRuntime.id: "openclaw"` 和常规 OpenAI 凭证 | `/status` 显示 OpenClaw runtime        | 仅在明确需要 OpenClaw 时使用 |
| 旧版配置                                        | 旧版 Codex GPT 引用                                                  | `openclaw doctor --fix` 会重写它     | 不要用这种方式编写新配置      |
| ACP/acpx Codex 适配器                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP 任务/会话状态                 | 与原生 Codex harness 分离    |

`agents.defaults.imageModel` 遵循相同的前缀拆分。常规 OpenAI 路由使用 `openai/gpt-*`，
只有当图像理解应通过有界的 Codex app-server 轮次运行时，才使用 `codex/gpt-*`。
不要使用旧版 Codex GPT 引用；doctor 会将该旧版前缀重写为 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

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

### 混合 provider 部署

此形态保留 Claude 作为默认智能体，并添加一个具名 Codex 智能体：

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

使用此配置时，`main` 智能体使用其常规 provider 路径，而
`codex` 智能体使用 Codex app-server。

### 失败关闭的 Codex 部署

对于 OpenAI 智能体轮次，当内置插件可用时，`openai/gpt-*` 已经会解析到 Codex。
当你需要一条写明的失败关闭规则时，添加显式运行时策略：

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

强制使用 Codex 后，如果 Codex 插件被禁用、app-server 版本过旧，或 app-server 无法启动，
OpenClaw 会提前失败。

## App-server 策略

默认情况下，插件会在本地使用 stdio 传输启动 OpenClaw 管理的 Codex 二进制文件。
只有当你明确想运行不同的可执行文件时，才设置 `appServer.command`。
仅当 app-server 已经在其他位置运行时，才使用 WebSocket 传输：

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

本地 stdio app-server 会话默认采用可信本地操作者姿态：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。如果本地 Codex 要求不允许这种隐式 YOLO 姿态，
OpenClaw 会改为选择允许的 guardian 权限。
当某个会话启用了 OpenClaw 沙箱时，OpenClaw 会在该轮次中禁用 Codex 原生代码模式、
用户 MCP 服务器和应用支持的插件执行，而不是依赖 Codex 主机侧沙箱隔离。
当常规 exec/process 工具可用时，Shell 访问会通过 OpenClaw 沙箱支持的动态工具暴露，
例如 `sandbox_exec` 和 `sandbox_process`。

当你希望 Codex 原生 auto-review 在沙箱逃逸或额外权限之前介入时，使用规范化的 OpenClaw exec 模式：

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

对于 Codex app-server 会话，OpenClaw 会将 `tools.exec.mode: "auto"` 映射到 Codex
Guardian 审核的审批；在本地要求允许这些值时，通常为
`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和
`sandbox: "workspace-write"`。
在 `tools.exec.mode: "auto"` 中，OpenClaw 不会保留旧版不安全的 Codex
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆盖；如果有意采用无需审批的 Codex 姿态，
请使用 `tools.exec.mode: "full"`。
旧版 `plugins.entries.codex.config.appServer.mode: "guardian"` 预设仍然可用，
但 `tools.exec.mode: "auto"` 是规范化的 OpenClaw 表面。

关于模式级别与主机 exec 审批和 ACPX 权限的对比，请参阅 [权限模式](/zh-CN/tools/permission-modes)。

关于每个 app-server 字段、凭证顺序、环境隔离、发现和超时行为，
请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)。

## 命令和诊断

内置插件会在任何支持 OpenClaw 文本命令的渠道上，将 `/codex` 注册为斜杠命令。

原生执行和控制需要 owner 或 `operator.admin` Gateway 网关客户端。
这包括绑定或恢复线程、发送或停止轮次、更改 model、fast-mode 或权限状态、压缩或审核，
以及解除绑定。其他已授权发送者保留只读的状态、帮助、账户、模型、线程、MCP 服务器、skill 和绑定检查命令。

常见形式：

- `/codex status` 检查 app-server 连接性、models、账户、速率限制、
  MCP 服务器和 skills。
- `/codex models` 列出实时 Codex app-server models。
- `/codex threads [filter]` 列出最近的 Codex app-server 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw 会话附加到现有 Codex 线程。
- `/codex compact` 要求 Codex app-server 压缩已附加的线程。
- `/codex review` 为已附加的线程启动 Codex 原生 review。
- `/codex diagnostics [note]` 在发送已附加线程的 Codex feedback 之前请求确认。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server skills。

对于大多数支持报告，请从出现问题的对话中的 `/diagnostics [note]` 开始。
它会创建一份 Gateway 网关诊断报告，并且对于 Codex harness 会话，会请求批准发送相关的 Codex feedback bundle。
有关隐私模型和群聊行为，请参阅 [诊断导出](/zh-CN/gateway/diagnostics)。

仅当你明确想为当前已附加线程上传 Codex feedback，而不需要完整 Gateway 网关诊断 bundle 时，
才使用 `/codex diagnostics [note]`。

### 在本地检查 Codex 线程

检查失败 Codex 运行的最快方式，通常是直接打开原生 Codex 线程：

```bash
codex resume <thread-id>
```

从已完成的 `/diagnostics` 回复、`/codex binding` 或
`/codex threads [filter]` 获取线程 ID。

有关上传机制和运行时级诊断边界，请参阅
[Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#codex-feedback-upload)。

凭证按以下顺序选择：

1. 该智能体的有序 OpenAI 凭证配置文件，最好位于
   `auth.order.openai` 下。运行 `openclaw doctor --fix` 以迁移较旧的
   旧版 Codex 凭证配置文件 ID 和旧版 Codex 凭证顺序。
2. 该智能体 Codex home 中 app-server 的现有账户。
3. 仅限本地 stdio app-server 启动：当不存在 app-server 账户且仍需要 OpenAI 凭证时，
   先使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅风格的 Codex 凭证配置文件时，它会从生成的 Codex 子进程中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。
这样可以让 Gateway 网关级 API key 继续用于 embeddings 或直接 OpenAI models，
同时避免原生 Codex app-server 轮次意外通过 API 计费。
显式 Codex API-key 配置文件和本地 stdio 环境 key 回退会使用 app-server 登录，
而不是继承子进程 env。
WebSocket app-server 连接不会接收 Gateway 网关 env API-key 回退；请使用显式凭证配置文件，
或使用远程 app-server 自己的账户。
配置原生 Codex plugins 时，OpenClaw 会先通过已连接的 app-server 安装或刷新这些插件，
然后再将插件拥有的 apps 暴露给 Codex 线程。
`app/list` 仍然是 app ID、可访问性和元数据的事实来源，但 OpenClaw 拥有按线程启用的决策：
如果策略允许某个已列出的可访问 app，OpenClaw 会发送
`thread/start.config.apps[appId].enabled = true`，即使 `app/list` 当前报告该 app 已禁用。
此路径不会为未知 ID 发明 app 安装；OpenClaw 只会使用 `plugin/install` 激活 marketplace plugins，
然后刷新清单。

如果订阅配置文件触及 Codex 用量限制，OpenClaw 会在 Codex 报告重置时间时记录该时间，
并为同一次 Codex 运行尝试下一个有序凭证配置文件。
重置时间过去后，该订阅配置文件会重新具备资格，而无需更改所选的 `openai/gpt-*` model 或 Codex runtime。

对于本地 stdio app-server 启动，OpenClaw 会将 `CODEX_HOME` 设置为按智能体划分的目录，
因此 Codex 配置、凭证/账户文件、插件缓存/数据和原生线程状态默认不会读取或写入操作者个人的
`~/.codex`。
OpenClaw 会保留正常进程的 `HOME`；Codex 运行的子进程仍然可以找到用户 home 配置和令牌，
并且 Codex 可能会发现共享的 `$HOME/.agents/skills` 和
`$HOME/.agents/plugins/marketplace.json` 条目。

如果某个部署需要额外环境隔离，请将这些变量添加到
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

`appServer.clearEnv` 只影响生成的 Codex app-server 子进程。
OpenClaw 会在本地启动规范化期间，从此列表中移除 `CODEX_HOME` 和 `HOME`：
`CODEX_HOME` 保持按智能体划分，`HOME` 保持继承，以便子进程可以使用正常的用户 home 状态。

Codex 动态工具默认使用 `searchable` 加载。OpenClaw 不会公开与 Codex 原生工作区操作重复的动态工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。其余大多数 OpenClaw 集成工具，例如消息、媒体、cron、浏览器、节点、Gateway 网关和 `heartbeat_respond`，都可通过 Codex 工具搜索在 `openclaw` 命名空间下使用，从而让初始模型上下文更小。启用搜索且未选择托管提供商时，Web 搜索默认使用 Codex 托管的 `web_search` 工具。原生托管搜索与 OpenClaw 托管的 `web_search` 动态工具互斥，因此托管搜索无法绕过原生域名限制。当托管搜索不可用、被明确禁用，或被所选托管提供商替代时，OpenClaw 会使用托管工具。OpenClaw 保持 Codex 的独立 `web.run` 扩展为禁用状态，因为生产 app-server 流量会拒绝其用户定义的 `web` 命名空间。`tools.web.search.enabled: false` 会禁用两条路径，仅禁用工具的 LLM-only 运行也是如此。Codex 将 `"cached"` 视为偏好，并在不受限制的 app-server 轮次中将其解析为实时外部访问。设置原生 `allowedDomains` 时，自动托管回退会失败关闭，因此允许列表无法被绕过。持久的有效搜索策略变更会在下一轮次前轮换已绑定的 Codex 线程。临时的逐轮限制会使用一个临时受限线程，并保留现有绑定以供稍后恢复。`sessions_yield` 和仅消息工具的源回复保持直接方式，因为这些是轮次控制契约。`sessions_spawn` 保持可搜索，因此 Codex 原生 `spawn_agent` 仍是主要的 Codex 子智能体表面，同时仍可通过 `openclaw` 动态工具命名空间使用显式 OpenClaw 或 ACP 委派。Heartbeat 协作说明会告诉 Codex：当工具尚未加载时，在结束 Heartbeat 轮次前搜索 `heartbeat_respond`。

仅在连接到无法搜索延迟动态工具的自定义 Codex app-server，或调试完整工具负载时，才设置 `codexDynamicToolsLoading: "direct"`。

支持的顶层 Codex 插件字段：

| 字段                       | 默认值         | 含义                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | 使用 `"direct"` 将 OpenClaw 动态工具直接放入初始 Codex 工具上下文。 |
| `codexDynamicToolsExclude` | `[]`           | 要从 Codex app-server 轮次中省略的其他 OpenClaw 动态工具名称。              |
| `codexPlugins`             | 已禁用       | 为已迁移的源码安装精选插件提供原生 Codex 插件/app 支持。           |

支持的 `appServer` 字段：

| 字段                                          | 默认值                                                 | 含义                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                                                                                                                                                                                                                          |
| `command`                                     | 托管的 Codex 二进制文件                                | stdio 传输使用的可执行文件。保持未设置可使用托管二进制文件；仅在明确需要覆盖时设置。                                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输的参数。                                                                                                                                                                                                                                                                                                                                                                             |
| `url`                                         | 未设置                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未设置                                                 | WebSocket 传输的 Bearer 令牌。接受字面量字符串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                |
| `headers`                                     | `{}`                                                   | 额外的 WebSocket 标头。标头值接受字面量字符串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                          |
| `clearEnv`                                    | `[]`                                                   | 在 OpenClaw 构建其继承环境后，从派生的 stdio app-server 进程中移除的额外环境变量名称。OpenClaw 会为本地启动保留每 Agent 的 `CODEX_HOME` 和继承的 `HOME`。                                                                                                                                                                                                                                       |
| `codeModeOnly`                                | `false`                                                | 选择启用 Codex 的仅代码模式工具表面。OpenClaw 动态工具仍会注册到 Codex，因此嵌套的 `tools.*` 调用会通过 app-server `item/tool/call` 桥返回。                                                                                                                                                                                                                                                    |
| `remoteWorkspaceRoot`                         | 未设置                                                 | 远程 Codex app-server 工作区根目录。设置后，OpenClaw 会从解析后的 OpenClaw 工作区推断本地工作区根目录，在此远程根目录下保留当前 cwd 后缀，并仅将最终的 app-server cwd 发送给 Codex。如果 cwd 位于解析后的 OpenClaw 工作区根目录之外，OpenClaw 会失败关闭，而不是将 Gateway 网关本地路径发送到远程 app-server。                    |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面调用的超时时间。                                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一个轮次后，或 OpenClaw 等待 `turn/completed` 时发生轮次作用域 app-server 请求后的静默窗口。                                                                                                                                                                                                                                                                                          |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 时，在工具交接、原生工具完成、工具后原始 assistant 进度、原始推理完成或推理进度之后使用的完成空闲和进度保护。对于受信任或重负载的工作负载，如果工具后综合可以合理地比最终 assistant 发布预算更长时间保持静默，请使用此项。                                                                       |
| `mode`                                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO               | YOLO 或 guardian 审查执行的预设。省略 `danger-full-access`、`never` 审批或 `user` 审查者的本地 stdio 要求会使隐式默认值变为 guardian。                                                                                                                                                                                                                                                         |
| `approvalPolicy`                              | `"never"` 或允许的 guardian 审批策略                   | 发送到线程启动/恢复/轮次的原生 Codex 审批策略。guardian 默认值在允许时优先使用 `"on-request"`。                                                                                                                                                                                                                                                                                                |
| `sandbox`                                     | `"danger-full-access"` 或允许的 guardian 沙箱          | 发送到线程启动/恢复的原生 Codex 沙箱模式。guardian 默认值在允许时优先使用 `"workspace-write"`，否则使用 `"read-only"`。当 OpenClaw 沙箱处于活动状态时，`danger-full-access` 轮次会使用 Codex `workspace-write`，网络访问则从 OpenClaw 沙箱出口设置派生。                                                                         |
| `approvalsReviewer`                           | `"user"` 或允许的 guardian 审查者                     | 在允许时使用 `"auto_review"` 让 Codex 审查原生审批提示，否则使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍是旧版别名。                                                                                                                                                                                                                                                              |
| `serviceTier`                                 | 未设置                                                 | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求 flex 处理，`null` 清除覆盖项，旧版 `"fast"` 会被接受为 `"priority"`。                                                                                                                                                                                                                                            |
| `networkProxy`                                | 已禁用                                                 | 选择为 app-server 命令启用 Codex 权限配置文件联网。OpenClaw 会定义选定的 `permissions.<profile>.network` 配置，并使用 `default_permissions` 选择它，而不是发送 `sandbox`。                                                                                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                                | 预览版选择启用项，会向 Codex app-server 0.132.0 或更新版本注册一个由 OpenClaw 沙箱支持的 Codex 环境，使原生 Codex 执行可以在活动的 OpenClaw 沙箱内运行。                                                                                                                                                                                                                                      |

`appServer.networkProxy` 是显式配置，因为它会改变 Codex 沙箱
契约。启用后，OpenClaw 还会在 Codex 线程配置中设置
`features.network_proxy.enabled` 和 `default_permissions`，以便生成的权限
配置文件可以启动 Codex 托管联网。默认情况下，OpenClaw 会根据
配置文件主体生成一个抗冲突的 `openclaw-network-<fingerprint>` 配置文件名称；仅当需要稳定的本地名称时才使用 `profileName`。

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

如果常规 app-server 运行时会是 `danger-full-access`，启用
`networkProxy` 会为生成的权限配置文件使用工作区样式的文件系统访问。
Codex 托管网络强制执行属于沙箱隔离联网，因此 full-access 配置文件
无法保护出站流量。域名条目使用 `allow` 或 `deny`；Unix socket 条目使用 Codex 的
`allow` 或 `none` 值。

OpenClaw 拥有的动态工具调用独立于 `appServer.requestTimeoutMs` 受限：Codex `item/tool/call` 请求默认使用 90 秒的 OpenClaw 看门狗。正数的单次调用 `timeoutMs` 参数会延长或缩短该特定工具预算。`image_generate` 工具在工具调用没有提供自己的超时时，会使用 `agents.defaults.imageGenerationModel.timeoutMs`，否则使用 120 秒的图像生成默认值。媒体理解 `image` 工具使用 `tools.media.image.timeoutSeconds`，或其 60 秒的媒体默认值。对于图像理解，该超时适用于请求本身，不会因先前的准备工作而减少。动态工具预算上限为 600000 ms。超时时，OpenClaw 会在支持的地方中止工具信号，并向 Codex 返回失败的动态工具响应，使该轮次可以继续，而不是让会话停留在 `processing`。这个看门狗是外层动态 `item/tool/call` 预算；提供商特定的请求超时在该调用内部运行，并保留各自的超时语义。

在 Codex 接受一个轮次之后，以及 OpenClaw 响应一个轮次范围的 app-server 请求之后，harness 期望 Codex 推进当前轮次，并最终用 `turn/completed` 完成原生轮次。如果 app-server 在 `appServer.turnCompletionIdleTimeoutMs` 内保持静默，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw 会话通道，以免后续聊天消息排在陈旧的原生轮次之后。同一轮次的大多数非终止通知会解除这个短看门狗，因为 Codex 已证明该轮次仍然存活。工具交接使用更长的工具后空闲预算：在 OpenClaw 返回 `item/tool/call` 响应之后，在 `commandExecution` 等原生工具项完成之后，在原始 `custom_tool_call_output` 完成之后，以及在工具后的原始 assistant 进展、原始推理完成或推理进展之后。该保护在配置时使用 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否则默认为五分钟。同一个工具后预算也会延长 Codex 发出下一个当前轮次事件之前静默合成窗口的进度看门狗。全局 app-server 通知（例如速率限制更新）不会重置轮次空闲进度。推理完成、commentary `agentMessage` 完成，以及工具前的原始推理或 assistant 进展之后可能跟随自动最终回复，因此它们使用进展后回复保护，而不是立即释放会话通道。只有最终/非 commentary 的已完成 `agentMessage` 项，以及工具前的原始 assistant 完成，会启动 assistant 输出释放：如果 Codex 随后在没有 `turn/completed` 的情况下保持静默，OpenClaw 会尽力中断原生轮次并释放会话通道。可安全重放的 stdio app-server 失败，包括没有 assistant、工具、活动项或副作用证据的轮次完成空闲超时，会在新的 app-server 尝试中重试一次。不安全的超时仍会停用卡住的 app-server 客户端并释放 OpenClaw 会话通道。它们也会清除陈旧的原生线程绑定，而不是自动重放。完成监视超时会呈现 Codex 特定的超时文本：可安全重放的情况会说明响应可能不完整，而不安全的情况会提示用户在重试前验证当前状态。公开超时诊断包括结构化字段，例如最后一个 app-server 通知方法、原始 assistant 响应项 id/type/role、活动请求/项计数，以及已启动的监视状态。当最后一个通知是原始 assistant 响应项时，它们还会包含受限长度的 assistant 文本预览。它们不包含原始提示词或工具内容。

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或将 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 用于一次性本地测试。对于可重复部署，优先使用配置，因为它会将插件行为保留在与 Codex harness 设置其余部分相同的已审查文件中。

## Native Codex plugins

Native Codex plugins 支持在与 OpenClaw harness 轮次相同的 Codex 线程中使用 Codex app-server 自身的应用和插件能力。OpenClaw 不会把 Codex 插件翻译成合成的 `codex_plugin_*` OpenClaw 动态工具。

`codexPlugins` 只影响选择原生 Codex harness 的会话。它不会影响内置 harness 运行、普通 OpenAI provider 运行、ACP 对话绑定或其他 harness。

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

线程应用配置会在 OpenClaw 建立 Codex harness 会话或替换陈旧的 Codex 线程绑定时计算。它不会在每个轮次重新计算。更改 `codexPlugins` 后，请使用 `/new`、`/reset`，或重启 gateway，使未来的 Codex harness 会话以更新后的应用集合启动。

有关迁移资格、应用清单、破坏性操作策略、引出式交互和原生插件诊断，请参阅 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。

OpenAI 侧的应用和插件访问由已登录的 Codex 账户控制；对于 Business 和 Enterprise/Edu 工作区，还受工作区应用控制约束。有关 OpenAI 的账户和工作区控制概览，请参阅 [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## Computer Use

Computer Use 在其自己的设置指南中介绍：
[Codex Computer Use](/zh-CN/plugins/codex-computer-use)。

简短版本：OpenClaw 不会内置桌面控制应用，也不会自行执行桌面操作。它会准备 Codex app-server，验证 `computer-use` MCP 服务器可用，然后让 Codex 在 Codex 模式轮次期间拥有原生 MCP 工具调用。

## 运行时边界

Codex harness 只更改底层嵌入式智能体执行器。

- 支持 OpenClaw 动态工具。Codex 要求 OpenClaw 执行这些工具，因此 OpenClaw 仍在执行路径中。
- Codex 原生 shell、patch、MCP 和原生应用工具由 Codex 拥有。OpenClaw 可以通过支持的 relay 观察或阻止选定的原生事件，但不会重写原生工具参数。
- Codex 拥有原生压缩。OpenClaw 保留一份转录镜像，用于渠道历史、搜索、`/new`、`/reset`，以及未来切换模型或 harness，但不会用 OpenClaw 或 context-engine 摘要器替代 Codex 压缩。
- 媒体生成、媒体理解、TTS、审批和 messaging-tool 输出继续通过匹配的 OpenClaw provider/model 设置进行。
- `tool_result_persist` 适用于 OpenClaw 拥有的转录工具结果，而不是 Codex 原生工具结果记录。

有关钩子层、支持的 V1 表面、原生权限处理、队列 steering、Codex 反馈上传机制和压缩细节，请参阅 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)。

## 故障排除

**Codex 没有显示为普通 `/model` provider：** 对于新配置，这是预期行为。选择一个 `openai/gpt-*` 模型，启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用内置 harness 而不是 Codex：** 请确保模型引用是官方 OpenAI provider 上的 `openai/gpt-*`，并且 Codex 插件已安装并启用。如果你在测试时需要严格证明，请设置 provider 或模型 `agentRuntime.id: "codex"`。强制 Codex 运行时会失败，而不是回退到 OpenClaw。

**OpenAI Codex runtime 回退到 API key 路径：** 收集一段已脱敏的 gateway 摘录，显示模型、运行时、所选 provider 和失败信息。请受影响的协作者在他们的 OpenClaw 主机上运行这个只读命令：

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

有用的摘录通常包括 `openai/gpt-5.5` 或 `openai/gpt-5.4`、`Runtime: OpenAI Codex`、`agentRuntime.id` 或 `harnessRuntime`、`candidateProvider: "openai"`，以及 `401`、`Incorrect API key` 或 `No API key` 结果。修正后的运行应显示 OpenAI OAuth 路径，而不是普通的 OpenAI API key 失败。

**Legacy Codex model refs config 仍然存在：** 运行 `openclaw doctor --fix`。Doctor 会将旧版模型引用重写为 `openai/*`，移除陈旧的会话和整智能体运行时固定项，并保留现有 auth-profile 覆盖。

**app-server 被拒绝：** 使用 Codex app-server `0.125.0` 或更新版本。同版本预发布或带构建后缀的版本（例如 `0.125.0-alpha.2` 或 `0.125.0+custom`）会被拒绝，因为 OpenClaw 测试稳定版 `0.125.0` 协议下限。

**`/codex status` 无法连接：** 检查内置 `codex` 插件是否已启用；如果配置了 allowlist，检查 `plugins.allow` 是否包含它；并检查任何自定义 `appServer.command`、`url`、`authToken` 或 headers 是否有效。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用 discovery。参见 [Codex harness reference](/zh-CN/plugins/codex-harness-reference#model-discovery)。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`、headers，以及远程 app-server 是否使用相同的 Codex app-server 协议版本。

**原生 shell 或 patch 工具因 `Native hook relay unavailable` 被阻止：** Codex 线程仍在尝试使用 OpenClaw 不再注册的原生 hook relay id。这是原生 Codex hook 传输问题，而不是 ACP 后端、provider、GitHub 或 shell-command 失败。在受影响的聊天中用 `/new` 或 `/reset` 启动新会话，然后重试一个无害命令。如果这样成功一次，但下一个原生工具调用又失败，请只把 `/new` 作为临时解决方法：重启 Codex app-server 或 OpenClaw Gateway 后，将提示词复制到新会话中，以便丢弃旧线程并重新创建原生 hook 注册。

**非 Codex 模型使用内置 harness：** 除非 provider 或模型运行时策略将其路由到另一个 harness，否则这是预期行为。在 `auto` 模式下，普通非 OpenAI provider 引用会保留在其正常 provider 路径上。

**Computer Use 已安装但工具不运行：** 从新会话检查
`/codex computer-use status`。如果某个工具报告
`Native hook relay unavailable`，请使用上面的原生钩子中继恢复方法。参见
[Codex Computer Use](/zh-CN/plugins/codex-computer-use#troubleshooting)。

## 相关

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
