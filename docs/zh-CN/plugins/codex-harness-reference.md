---
read_when:
    - 你需要每个 Codex harness 配置字段
    - 你正在更改 app-server 传输、凭证、设备发现或超时行为
    - 你正在调试 Codex harness 启动、模型发现或环境隔离
summary: Codex harness 的配置、凭证、设备发现和应用服务器参考
title: Codex harness reference
x-i18n:
    generated_at: "2026-05-10T19:39:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

本参考说明内置 `codex` 插件的详细配置。关于设置和路由决策，请从
[Codex harness](/zh-CN/plugins/codex-harness) 开始。

## 插件配置表面

所有 Codex harness 设置都位于 `plugins.entries.codex.config` 下。

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

支持的顶层字段：

| 字段                       | 默认值                   | 含义                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已启用                   | Codex 应用服务器 `model/list` 的模型发现设置。                                                                                            |
| `appServer`                | 托管的 stdio 应用服务器  | 传输、命令、身份验证、审批、沙箱和超时设置。                                                                                              |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 可将 OpenClaw 动态工具直接放入初始 Codex 工具上下文。                                                                     |
| `codexDynamicToolsExclude` | `[]`                     | 要从 Codex 应用服务器轮次中省略的其他 OpenClaw 动态工具名称。                                                                             |
| `codexPlugins`             | 已禁用                   | 对已迁移、源码安装的精选插件提供 Native Codex plugins/应用支持。请参阅 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。            |
| `computerUse`              | 已禁用                   | Codex Computer Use 设置。请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)。                                                        |

## 应用服务器传输

默认情况下，OpenClaw 会启动随内置插件一起发布的托管 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

这会让应用服务器版本绑定到内置 `codex` 插件，而不是本地碰巧安装的其他 Codex CLI。只有在你明确想运行不同可执行文件时，才设置 `appServer.command`。

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
            url: "ws://gateway-host:39175",
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

| 字段                          | 默认值                                                 | 含义                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                              | `"stdio"` 会生成 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                     |
| `command`                     | 托管的 Codex 二进制文件                                | stdio 传输使用的可执行文件。保持未设置即可使用托管二进制文件。                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输的参数。                                                                                                                                                                         |
| `url`                         | 未设置                                                 | WebSocket 应用服务器 URL。                                                                                                                                                                 |
| `authToken`                   | 未设置                                                 | WebSocket 传输的 Bearer 令牌。                                                                                                                                                             |
| `headers`                     | `{}`                                                   | 额外的 WebSocket 标头。                                                                                                                                                                    |
| `clearEnv`                    | `[]`                                                   | OpenClaw 构建继承环境之后，从生成的 stdio 应用服务器进程中移除的额外环境变量名称。                                                                                                        |
| `requestTimeoutMs`            | `60000`                                                | 应用服务器控制平面调用的超时时间。                                                                                                                                                        |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | 轮次作用域的应用服务器请求之后，OpenClaw 等待 `turn/completed` 时的静默窗口。                                                                                                             |
| `mode`                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO               | YOLO 或 guardian 审核执行的预设。                                                                                                                                                         |
| `approvalPolicy`              | `"never"` 或允许的 guardian 审批策略                   | 发送到线程启动、恢复和轮次的原生 Codex 审批策略。                                                                                                                                         |
| `sandbox`                     | `"danger-full-access"` 或允许的 guardian 沙箱          | 发送到线程启动和恢复的原生 Codex 沙箱模式。                                                                                                                                               |
| `approvalsReviewer`           | `"user"` 或允许的 guardian 审核者                      | 使用 `"auto_review"` 可在允许时让 Codex 审核原生审批提示。                                                                                                                                |
| `defaultWorkspaceDir`         | 当前进程目录                                           | 省略 `--cwd` 时 `/codex bind` 使用的工作区。                                                                                                                                               |
| `serviceTier`                 | 未设置                                                 | 可选的 Codex 应用服务器服务层。`"priority"` 启用快速模式路由，`"flex"` 请求 flex 处理，`null` 清除覆盖项。旧版 `"fast"` 会被接受为 `"priority"`。                                          |

该插件会阻止较旧或未带版本的应用服务器握手。Codex 应用服务器必须报告稳定版本 `0.125.0` 或更新版本。

## 审批和沙箱模式

本地 stdio 应用服务器会话默认使用 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。这种可信本地操作员姿态允许无人值守的 OpenClaw 轮次和 Heartbeat 继续推进，而不会出现无人应答的原生审批提示。

如果 Codex 的本地系统要求文件不允许隐式 YOLO 审批、审核者或沙箱值，OpenClaw 会改为将隐式默认值视为 guardian，并选择允许的 guardian 权限。同一个要求文件中与主机名匹配的 `[[remote_sandbox_config]]` 条目会用于沙箱默认决策。

为 Codex guardian 审核审批设置 `appServer.mode: "guardian"`：

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

当这些值被允许时，`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。单独的策略字段会覆盖 `mode`。较旧的 `guardian_subagent` 审核者值仍作为兼容别名被接受，但新配置应使用 `auto_review`。

## 身份验证和环境隔离

身份验证按以下顺序选择：

1. 该智能体的显式 OpenClaw Codex 身份验证配置。
2. 该智能体 Codex 主目录中的应用服务器现有账户。
3. 仅限本地 stdio 应用服务器启动：当没有应用服务器账户且仍需要 OpenAI 身份验证时，使用 `CODEX_API_KEY`，然后使用
   `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅样式的 Codex 身份验证配置时，它会从生成的 Codex 子进程中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这样可以让 Gateway 网关级 API key 继续用于嵌入或直接 OpenAI 模型，同时避免原生 Codex 应用服务器轮次意外通过 API 计费。

显式 Codex API key 配置和本地 stdio 环境键回退会使用应用服务器登录，而不是继承子进程环境。WebSocket 应用服务器连接不会接收 Gateway 网关环境 API key 回退；请使用显式身份验证配置，或使用远程应用服务器自己的账户。

默认情况下，stdio 应用服务器启动会继承 OpenClaw 的进程环境，但 OpenClaw 拥有 Codex 应用服务器账户桥接，并将 `CODEX_HOME` 和 `HOME` 都设置为该智能体 OpenClaw 状态下的每智能体目录。Codex 自己的技能加载器会读取 `$CODEX_HOME/skills` 和 `$HOME/.agents/skills`，因此本地应用服务器启动时这两个值都会被隔离。这样可以让 Codex 原生技能、插件、配置、账户和线程状态限定在 OpenClaw 智能体范围内，而不会从操作员的个人 Codex CLI 主目录泄漏进来。

OpenClaw 插件和 OpenClaw 技能快照仍通过 OpenClaw 自己的插件注册表和技能加载器流转。个人 Codex CLI 资产不会。如果你有有用的 Codex CLI 技能或插件，且应成为 OpenClaw 智能体的一部分，请显式清点它们：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` 只影响生成的 Codex 应用服务器子进程。对于本地启动，`CODEX_HOME` 和 `HOME` 仍保留给 OpenClaw 的每智能体 Codex 隔离使用。

## 动态工具

Codex 动态工具默认使用 `searchable` 加载。OpenClaw 不会公开与 Codex 原生工作区操作重复的动态工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

剩余的 OpenClaw 集成工具，例如消息传递、会话、媒体、cron、浏览器、节点、网关、`heartbeat_respond` 和 `web_search`，可通过 `openclaw` 命名空间下的 Codex 工具搜索使用。这样可以让初始模型上下文更小。`sessions_yield` 和仅消息工具的源回复保持直接可用，因为它们是轮次控制契约。

仅在连接到无法搜索延迟动态工具的自定义 Codex 应用服务器，或调试完整工具负载时，才设置 `codexDynamicToolsLoading: "direct"`。

## 超时

OpenClaw 拥有的动态工具调用与 `appServer.requestTimeoutMs` 独立设限。每个 Codex `item/tool/call` 请求会按以下顺序使用第一个可用超时：

- 正数的逐调用 `timeoutMs` 参数。
- 对于 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 对于媒体理解 `image` 工具，使用转换为毫秒的 `tools.media.image.timeoutSeconds`，或 60 秒媒体默认值。
- 30 秒动态工具默认值。

动态工具预算上限为 600000 毫秒。超时时，OpenClaw 会在支持的位置中止工具信号，并向 Codex 返回失败的动态工具响应，让该轮次可以继续，而不是让会话停留在 `processing`。

OpenClaw 响应 Codex 轮次范围的应用服务器请求后，harness 也期望 Codex 通过 `turn/completed` 完成本机轮次。如果应用服务器在该响应后静默超过 `appServer.turnCompletionIdleTimeoutMs`，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw 会话通道，使后续聊天消息不会排在陈旧的本机轮次之后。

同一轮次的任何非终止通知，包括 `rawResponseItem/completed`，都会解除这个短 watchdog，因为 Codex 已经证明该轮次仍然存活。更长的终止 watchdog 会继续保护真正卡住的轮次。超时诊断会包含最后一个应用服务器通知方法，并且对于原始 assistant 响应项，还会包含项目类型、角色、id 以及有界的 assistant 文本预览。

## 模型发现

默认情况下，Codex 插件会向应用服务器请求可用模型。模型可用性由 Codex 应用服务器拥有，因此当 OpenClaw 升级内置的 `@openai/codex` 版本，或部署将 `appServer.command` 指向不同 Codex 二进制文件时，该列表可能变化。可用性也可能按账号划分作用域。在运行中的 Gateway 网关上使用 `/codex models`，查看该 harness 和账号的实时目录。

如果发现失败或超时，OpenClaw 会使用内置回退目录：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

当前内置 harness 是 `@openai/codex` `0.130.0`。针对该内置应用服务器的 `model/list` 探测返回了：

| 模型 ID                | 默认值 | 隐藏 | 输入模态   | 推理强度                 |
| --------------------- | ------ | ---- | ---------- | ------------------------ |
| `gpt-5.5`             | 是     | 否   | 文本，图像 | low, medium, high, xhigh |
| `gpt-5.4`             | 否     | 否   | 文本，图像 | low, medium, high, xhigh |
| `gpt-5.4-mini`        | 否     | 否   | 文本，图像 | low, medium, high, xhigh |
| `gpt-5.3-codex`       | 否     | 否   | 文本，图像 | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | 否     | 否   | 文本       | low, medium, high, xhigh |
| `gpt-5.2`             | 否     | 否   | 文本，图像 | low, medium, high, xhigh |

应用服务器目录可能返回用于内部或专门流程的隐藏模型，但它们不是普通模型选择器选项。

在 `plugins.entries.codex.config.discovery` 下调整发现：

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

当你希望启动时避免探测 Codex 且只使用回退目录时，禁用发现：

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

## 工作区引导文件

Codex 会通过本机项目文档发现自行处理 `AGENTS.md`。OpenClaw 不会写入合成的 Codex 项目文档文件，也不依赖 Codex 回退文件名作为 persona 文件，因为 Codex 回退仅在缺少 `AGENTS.md` 时适用。

为了实现 OpenClaw 工作区一致性，Codex harness 会解析其他引导文件，包括存在时的 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`，并通过 `thread/start` 和 `thread/resume` 上的 Codex developer instructions 转发它们。这样可以让工作区 persona 和资料上下文在本机 Codex 行为塑形通道上可见，而无需复制 `AGENTS.md`。

## 环境覆盖

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当未设置 `appServer.command` 时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 进行一次性本地测试。对于可重复部署，首选配置，因为它会将插件行为保留在与其余 Codex harness 设置相同的已审阅文件中。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
- [OpenAI provider](/zh-CN/providers/openai)
- [配置参考](/zh-CN/gateway/configuration-reference)
