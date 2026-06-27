---
read_when:
    - 你需要每个 Codex harness 配置字段
    - 你正在更改 app-server 传输、身份验证、设备发现或超时行为
    - 你正在调试 Codex harness 启动、模型发现或环境隔离
summary: Codex harness 的配置、凭证、设备发现和 app-server 参考
title: Codex harness reference
x-i18n:
    generated_at: "2026-06-27T02:38:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

本参考介绍内置 `codex` 插件的详细配置。如需设置和路由决策，请先阅读
[Codex harness](/zh-CN/plugins/codex-harness)。

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
| `discovery`                | 启用                     | Codex app-server `model/list` 的模型发现设置。                                                                                            |
| `appServer`                | 托管 stdio app-server    | 传输、命令、认证、审批、沙箱和超时设置。                                                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 将 OpenClaw 动态工具直接放入初始 Codex 工具上下文。                                                                       |
| `codexDynamicToolsExclude` | `[]`                     | 要从 Codex app-server 轮次中省略的其他 OpenClaw 动态工具名称。                                                                            |
| `codexPlugins`             | 禁用                     | 对已迁移的源安装精选插件提供 Native Codex plugins/app 支持。请参阅 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。 |
| `computerUse`              | 禁用                     | Codex Computer Use 设置。请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)。                                                       |

## App-server 传输

默认情况下，OpenClaw 会启动随内置插件一起提供的托管 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

这会让 app-server 版本绑定到内置 `codex` 插件，而不是本地恰好安装的任何独立 Codex CLI。只有在你明确想运行其他可执行文件时，才设置 `appServer.command`。

对于已经运行的 app-server，请使用 WebSocket 传输：

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

| 字段                                          | 默认值                                                 | 含义                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 会生成 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                                                                                                                                                                                                                          |
| `command`                                     | 托管的 Codex 二进制文件                                | stdio 传输协议的可执行文件。保持未设置以使用托管二进制文件。                                                                                                                                                                                                                                                                                                                                   |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输协议的参数。                                                                                                                                                                                                                                                                                                                                                                         |
| `url`                                         | 未设置                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未设置                                                 | WebSocket 传输协议的 Bearer 令牌。接受字面量字符串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                            |
| `headers`                                     | `{}`                                                   | 额外的 WebSocket 标头。标头值接受字面量字符串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                         |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 构建继承的环境后，从生成的 stdio app-server 进程中移除的额外环境变量名称。                                                                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未设置                                                 | 远程 Codex app-server 工作区根目录。设置后，OpenClaw 会从解析后的 OpenClaw 工作区推断本地工作区根目录，保留此远程根目录下当前 cwd 后缀，并且只将最终的 app-server cwd 发送给 Codex。如果 cwd 位于解析后的 OpenClaw 工作区根目录之外，OpenClaw 会失败关闭，而不是向远程 app-server 发送 Gateway 网关本地路径。                  |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面调用的超时时间。                                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一个轮次后，或 OpenClaw 等待 `turn/completed` 时发生轮次作用域 app-server 请求后的静默窗口。                                                                                                                                                                                                                                                                                          |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 时，在工具移交、原生工具完成、工具后原始助手进度、原始推理完成或推理进度之后使用的完成空闲和进度保护。对于可信或繁重的工作负载，如果工具后合成确实可以比最终助手发布预算保持更久静默，请使用此项。                                                                                                 |
| `mode`                                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO               | YOLO 或 guardian 审查执行的预设。                                                                                                                                                                                                                                                                                                                                                               |
| `approvalPolicy`                              | `"never"` 或允许的 guardian 审批策略                   | 发送到线程启动、恢复和轮次的原生 Codex 审批策略。                                                                                                                                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` 或允许的 guardian 沙箱          | 发送到线程启动和恢复的原生 Codex 沙箱模式。活跃的 OpenClaw 沙箱会将 `danger-full-access` 轮次收窄为 Codex `workspace-write`；轮次网络标志遵循 OpenClaw 沙箱出口规则。                                                                                                                                                              |
| `approvalsReviewer`                           | `"user"` 或允许的 guardian 审查者                      | 使用 `"auto_review"` 可在允许时让 Codex 审查原生审批提示。                                                                                                                                                                                                                                                                                                                                     |
| `defaultWorkspaceDir`                         | 当前进程目录                                           | 省略 `--cwd` 时，`/codex bind` 使用的工作区。                                                                                                                                                                                                                                                                                                                                                   |
| `serviceTier`                                 | 未设置                                                 | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求 flex 处理，`null` 清除覆盖项。旧版 `"fast"` 会作为 `"priority"` 接受。                                                                                                                                                                               |
| `networkProxy`                                | 已禁用                                                 | 为 app-server 命令选择启用 Codex 权限配置文件网络。OpenClaw 会定义所选 `permissions.<profile>.network` 配置，并使用 `default_permissions` 选择它，而不是发送 `sandbox`。                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | 预览版选择启用项，会向 Codex app-server 0.132.0 或更新版本注册一个由 OpenClaw 沙箱支持的 Codex 环境，以便原生 Codex 执行可以在活跃的 OpenClaw 沙箱内运行。                                                                                                                                                                        |

`appServer.networkProxy` 是显式配置，因为它会改变 Codex 沙箱
契约。启用后，OpenClaw 还会在 Codex 线程配置中设置 `features.network_proxy.enabled` 和
`default_permissions`，以便生成的权限
配置文件可以启动 Codex 托管网络。默认情况下，OpenClaw 会根据
配置文件正文生成抗冲突的 `openclaw-network-<fingerprint>` 配置文件名称；只有在需要稳定的本地名称时才使用 `profileName`。

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
权限配置文件使用工作区风格的文件系统访问。Codex 托管网络强制执行是沙箱隔离的网络，
因此完全访问配置文件无法保护出站流量。

该插件会阻止较旧或未版本化的 app-server 握手。Codex app-server
必须报告稳定版本 `0.125.0` 或更新版本。

OpenClaw 将非 loopback WebSocket 应用服务器 URL 视为远程 URL，并要求通过 `appServer.authToken` 或 `Authorization` 标头提供携带身份信息的 WebSocket 认证。`appServer.authToken` 和每个 `appServer.headers.*` 值都可以是 SecretInput；secrets 运行时会在 OpenClaw 构建应用服务器启动选项之前解析 SecretRefs 和 env 简写，未解析的结构化 SecretRefs 会在发送任何令牌或标头之前失败。配置 Native Codex plugins 时，OpenClaw 会使用已连接应用服务器的插件控制平面来安装或刷新这些插件，然后刷新应用清单，使插件拥有的应用对 Codex 线程可见。`app/list` 仍然是权威的清单和元数据来源，但 OpenClaw 策略会决定是否为列出的可访问应用在 `thread/start` 中发送 `config.apps[appId].enabled = true`，即使 Codex 当前将其标记为已禁用。未知或缺失的应用 ID 仍保持故障关闭；此路径只会通过 `plugin/install` 激活市场插件并刷新清单。只将 OpenClaw 连接到你信任其接受 OpenClaw 管理的插件安装和应用清单刷新的远程应用服务器。

## 审批和沙箱模式

本地 stdio 应用服务器会话默认使用 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。这种受信任的本地操作员姿态使无人值守的 OpenClaw 轮次和 Heartbeat 能够继续推进，而不会出现无人可答复的原生审批提示。

如果 Codex 的本地系统要求文件不允许隐式 YOLO 审批、审阅者或沙箱值，OpenClaw 会改为将隐式默认值视为 guardian，并选择允许的 guardian 权限。`tools.exec.mode: "auto"` 也会强制使用 guardian 审阅的 Codex 审批，并且不会保留不安全的旧版 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆盖；若要有意使用无需审批的姿态，请设置 `tools.exec.mode: "full"`。同一要求文件中按主机名匹配的 `[[remote_sandbox_config]]` 条目会用于沙箱默认值决策。

为 Codex guardian 审阅的审批设置 `appServer.mode: "guardian"`：

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

当这些值被允许时，`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。单独的策略字段会覆盖 `mode`。较旧的 `guardian_subagent` 审阅者值仍作为兼容性别名被接受，但新配置应使用 `auto_review`。

当 OpenClaw 沙箱处于活动状态时，本地 Codex 应用服务器进程仍在 Gateway 网关主机上运行。因此，OpenClaw 会为该轮次禁用 Codex 原生代码模式、用户 MCP 服务器和应用支持的插件执行，而不是将 Codex 主机侧沙箱隔离视为等同于 OpenClaw 沙箱后端。当普通 exec/process 工具可用时，Shell 访问会通过 OpenClaw 沙箱支持的动态工具暴露，例如 `sandbox_exec` 和 `sandbox_process`。

在 Ubuntu/AppArmor 主机上，当你有意在没有活动 OpenClaw 沙箱隔离的情况下运行原生 Codex `workspace-write` 时，Codex bwrap 可能会在 Shell 命令启动前失败。如果你看到 `bwrap: setting up uid map: Permission denied` 或 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`，请运行 `openclaw doctor` 并修复报告的 OpenClaw 服务用户主机命名空间策略，而不是授予更宽泛的 Docker 容器权限。优先为服务进程使用有范围限制的 AppArmor 配置文件；`kernel.apparmor_restrict_unprivileged_userns=0` 回退是主机范围的，并且有安全权衡。

## 沙箱隔离的原生执行

稳定默认值是故障关闭：活动 OpenClaw 沙箱隔离会禁用本来会从 Codex 应用服务器主机运行的原生 Codex 执行表面。只有当你想使用 OpenClaw 的沙箱后端试用 Codex 的远程环境支持时，才使用 `appServer.experimental.sandboxExecServer: true`。此预览路径要求 Codex 应用服务器 0.132.0 或更新版本。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

启用该标志且当前 OpenClaw 会话已沙箱隔离时，OpenClaw 会启动一个由活动沙箱支持的 local loopback exec-server，将其注册到 Codex 应用服务器，并使用该 OpenClaw 拥有的环境启动 Codex 线程和轮次。如果应用服务器无法注册该环境，运行会故障关闭，而不是静默回退到主机执行。

此预览路径仅限本地使用。远程 WebSocket 应用服务器无法访问 loopback exec-server，除非它运行在同一主机上，因此 OpenClaw 会拒绝该组合。

## 认证和环境隔离

认证按以下顺序选择：

1. 智能体的显式 OpenClaw Codex 认证配置文件。
2. 该智能体 Codex 主目录中的应用服务器现有账户。
3. 仅对于本地 stdio 应用服务器启动，在没有应用服务器账户且仍需要 OpenAI 认证时，使用 `CODEX_API_KEY`，然后使用 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅风格的 Codex 认证配置文件时，会从生成的 Codex 子进程中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这会让 Gateway 网关级 API key 仍可用于嵌入或直接 OpenAI 模型，同时避免原生 Codex 应用服务器轮次意外通过 API 计费。

显式 Codex API key 配置文件和本地 stdio env-key 回退使用应用服务器登录，而不是继承子进程 env。WebSocket 应用服务器连接不会接收 Gateway 网关 env API key 回退；请使用显式认证配置文件或远程应用服务器自己的账户。

Stdio 应用服务器启动默认继承 OpenClaw 的进程环境。OpenClaw 拥有 Codex 应用服务器账户桥接，并将 `CODEX_HOME` 设置为该智能体 OpenClaw 状态下按智能体划分的目录。这样可以让 Codex 配置、账户、插件缓存/数据和线程状态限定在 OpenClaw 智能体范围内，而不是从操作员个人的 `~/.codex` 主目录泄漏进来。

OpenClaw 不会为普通本地应用服务器启动重写 `HOME`。Codex 运行的子进程，例如 `openclaw`、`gh`、`git`、云 CLI 和 Shell 命令，会看到普通进程主目录，并且可以找到用户主目录配置和令牌。Codex 也可能发现 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json`；该 `.agents` 发现有意与操作员主目录共享，并且与隔离的 `~/.codex` 状态分开。

OpenClaw 插件和 OpenClaw skill 快照仍会通过 OpenClaw 自己的插件注册表和 skill 加载器流转。个人 Codex `~/.codex` 资产不会。如果你有来自 Codex 主目录且应成为 OpenClaw 智能体一部分的有用 Codex CLI skills 或插件，请显式盘点它们：

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

`appServer.clearEnv` 只影响生成的 Codex 应用服务器子进程。OpenClaw 会在本地启动规范化期间从此列表移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 保持按智能体划分，`HOME` 保持继承，以便子进程可以使用普通用户主目录状态。

## 动态工具

Codex 动态工具默认使用 `searchable` 加载。OpenClaw 不会暴露重复 Codex 原生工作区操作的动态工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

大多数其余 OpenClaw 集成工具，例如消息、媒体、cron、浏览器、节点、Gateway 网关、`heartbeat_respond` 和 `web_search`，都可通过 `openclaw` 命名空间下的 Codex 工具搜索使用。这会让初始模型上下文更小。`sessions_yield` 和仅消息工具来源的回复会保持直接暴露，因为它们是轮次控制契约。`sessions_spawn` 保持可搜索，因此 Codex 的原生 `spawn_agent` 仍是主要的 Codex 子智能体表面，而显式 OpenClaw 或 ACP 委派仍可通过 `openclaw` 动态工具命名空间使用。

仅在连接到无法搜索延迟动态工具的自定义 Codex 应用服务器，或调试完整工具载荷时，才设置 `codexDynamicToolsLoading: "direct"`。

## 超时

OpenClaw 拥有的动态工具调用与 `appServer.requestTimeoutMs` 独立设定边界。每个 Codex `item/tool/call` 请求按以下顺序使用第一个可用超时：

- 正的单次调用 `timeoutMs` 参数。
- 对于 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 对于未配置超时的 `image_generate`，使用 120 秒图像生成默认值。
- 对于媒体理解 `image` 工具，使用 `tools.media.image.timeoutSeconds` 转换为毫秒，或使用 60 秒媒体默认值。对于图像理解，这适用于请求本身，并且不会因较早的准备工作而缩短。
- 90 秒动态工具默认值。

此 watchdog 是外层动态 `item/tool/call` 预算。提供商特定的请求超时在该调用内部运行，并保持自己的超时语义。动态工具预算上限为 600000 ms。超时时，OpenClaw 会在支持的地方中止工具信号，并向 Codex 返回失败的动态工具响应，使轮次可以继续，而不是让会话停留在 `processing`。

在 Codex 接受一个轮次之后，以及 OpenClaw 响应一个轮次范围的应用服务器请求之后，harness 期望 Codex 推进当前轮次，并最终以 `turn/completed` 完成原生轮次。如果应用服务器在 `appServer.turnCompletionIdleTimeoutMs` 内保持静默，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw 会话通道，使后续聊天消息不会排队等待陈旧的原生轮次。

同一轮次的大多数非终止通知都会解除这个短看门狗，
因为 Codex 已证明该轮次仍然存活。工具交接使用更长的
工具后空闲预算：在 OpenClaw 返回 `item/tool/call` 响应之后，在
`commandExecution` 等原生工具项完成之后，在原始
`custom_tool_call_output` 完成之后，以及在工具后原始助手进度、
原始推理完成或推理进度之后。该守卫在配置时使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否则默认
为五分钟。同一个工具后预算也会延长静默合成窗口的进度看门狗，
直到 Codex 发出下一个当前轮次事件。推理完成、注释性
`agentMessage` 完成，以及工具前原始推理或助手进度之后可能会跟随
自动最终回复，因此它们使用进度后回复守卫，而不是立即释放会话通道。
只有最终/非注释性的已完成 `agentMessage` 项和工具前原始助手完成
会触发助手输出释放：如果 Codex 随后静默且没有
`turn/completed`，OpenClaw 会尽力中断原生轮次并释放会话通道。
可安全重放的标准输入输出应用服务器失败，包括没有助手、工具、活动项
或副作用证据的轮次完成空闲超时，会在新的应用服务器尝试中重试一次。
不安全的超时仍会停用卡住的应用服务器客户端并释放 OpenClaw
会话通道。它们也会清除过期的原生线程绑定，而不是自动重放。
完成监视超时会显示 Codex 专用的超时文本：可安全重放的情况会说明
响应可能不完整，而不安全的情况会提示用户在重试前验证当前状态。
公开超时诊断包括结构化字段，例如最后一个应用服务器通知方法、
原始助手响应项 ID/类型/角色、活动请求/项计数，以及已启用的监视状态。
当最后一个通知是原始助手响应项时，它们还会包含有界的助手文本预览。
它们不会包含原始提示或工具内容。

## 模型发现

默认情况下，Codex 插件会向应用服务器请求可用模型。模型可用性由
Codex 应用服务器拥有，因此当 OpenClaw 升级内置的 `@openai/codex`
版本，或部署将 `appServer.command` 指向不同的 Codex 二进制文件时，
列表可能会变化。可用性也可能按账号限定。请在正在运行的 Gateway 网关上
使用 `/codex models`，查看该 harness 和账号的实时目录。

如果发现失败或超时，OpenClaw 会使用以下内置回退目录：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

当前内置 harness 是 `@openai/codex` `0.139.0`。针对该内置应用服务器的
`model/list` 探测返回了：

| 模型 ID         | 默认 | 隐藏 | 输入模态     | 推理强度                 |
| --------------- | ---- | ---- | ------------ | ------------------------ |
| `gpt-5.5`       | 是   | 否   | 文本，图像   | low, medium, high, xhigh |
| `gpt-5.4`       | 否   | 否   | 文本，图像   | low, medium, high, xhigh |
| `gpt-5.4-mini`  | 否   | 否   | 文本，图像   | low, medium, high, xhigh |
| `gpt-5.3-codex` | 否   | 否   | 文本，图像   | low, medium, high, xhigh |
| `gpt-5.2`       | 否   | 否   | 文本，图像   | low, medium, high, xhigh |

应用服务器目录可能会为内部或专用流程返回隐藏模型，但它们不是普通的模型选择器选项。

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

当你希望启动时避免探测 Codex，并且只使用回退目录时，禁用发现：

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

Codex 会通过原生项目文档发现自行处理 `AGENTS.md`。OpenClaw
不会写入合成的 Codex 项目文档文件，也不会依赖 Codex 为 persona
文件提供的回退文件名，因为 Codex 回退只在缺少 `AGENTS.md` 时适用。

为了保持 OpenClaw 工作区一致性，Codex harness 会解析其他引导文件。
`SOUL.md`、`IDENTITY.md`、`TOOLS.md` 和 `USER.md` 会作为
OpenClaw Codex 开发者指令转发，因为它们定义了活动智能体、
可用工作区指南和用户资料。紧凑的 OpenClaw skills 列表会作为轮次范围的
协作开发者指令转发。`HEARTBEAT.md` 内容不会被注入；heartbeat
轮次会获得一个协作模式指针，在该文件存在且非空时读取它。来自已配置
Agent 工作区的 `MEMORY.md` 内容，在该工作区有可用的记忆工具时，
不会粘贴进原生 Codex 轮次输入；当它存在时，harness 会向轮次范围的
协作开发者指令添加一个小型工作区记忆指针，并且在持久记忆相关时，
Codex 应使用 `memory_search` 或 `memory_get`。如果工具被禁用、
记忆搜索不可用，或活动工作区不同于 Agent 记忆工作区，`MEMORY.md`
会使用正常的有界轮次上下文路径。
存在 `BOOTSTRAP.md` 时，它会作为 OpenClaw 轮次输入参考上下文转发。

## 环境覆盖

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN`
会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或使用
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 进行一次性本地测试。
对于可重复部署，建议使用配置，因为它会将插件行为与其余 Codex harness
设置保留在同一个已审查文件中。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
- [OpenAI provider](/zh-CN/providers/openai)
- [配置参考](/zh-CN/gateway/configuration-reference)
