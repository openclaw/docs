---
read_when:
    - 你需要每个 Codex harness 配置字段
    - 你正在更改 app-server 传输、身份验证、设备发现或超时行为
    - 你正在调试 Codex harness 启动、模型发现或环境隔离
summary: 配置、凭证、设备发现以及 Codex harness 的应用服务器参考
title: Codex harness reference
x-i18n:
    generated_at: "2026-07-04T10:27:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

本参考介绍内置 `codex` 插件的详细配置。对于设置和路由决策，请从 [Codex harness](/zh-CN/plugins/codex-harness) 开始。

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
| `discovery`                | 已启用                   | Codex app-server `model/list` 的模型发现设置。                                                                                            |
| `appServer`                | 托管式 stdio app-server  | 传输协议、命令、凭证、审批、沙箱和超时设置。                                                                                              |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 可将 OpenClaw 动态工具直接放入初始 Codex 工具上下文中。                                                                    |
| `codexDynamicToolsExclude` | `[]`                     | 要从 Codex app-server 轮次中省略的其他 OpenClaw 动态工具名称。                                                                             |
| `codexPlugins`             | 已禁用                   | 面向已迁移、从源码安装的精选插件的 Native Codex plugins/app 支持。见 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。              |
| `computerUse`              | 已禁用                   | Codex Computer Use 设置。见 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)。                                                           |

## App-server 传输协议

默认情况下，OpenClaw 会启动随内置插件一起发布的托管式 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

这会让 app-server 版本绑定到内置 `codex` 插件，而不是本地碰巧安装的其他 Codex CLI。仅当你有意运行不同的可执行文件时，才设置 `appServer.command`。

对于已经运行的 app-server，请使用 WebSocket 传输协议：

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

| 字段                                          | 默认值                                                 | 含义                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 会为每个 OpenClaw 智能体隔离 Codex 状态。`"user"` 共享原生 `$CODEX_HOME` 或 `~/.codex`，使用原生身份验证，并启用仅所有者可用的线程管理。用户作用域需要 stdio。                                                                                                                                                                                               |
| `command`                                     | 托管的 Codex 二进制文件                                | stdio 传输使用的可执行文件。留空以使用托管的二进制文件。                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输使用的参数。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未设置                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | 未设置                                                 | WebSocket 传输使用的 Bearer token。接受字面量字符串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 额外的 WebSocket 标头。标头值接受字面量字符串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | 在 OpenClaw 构建继承的环境之后，从生成的 stdio app-server 进程中移除的额外环境变量名称。                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未设置                                                 | 远程 Codex app-server 工作区根目录。设置后，OpenClaw 会从解析出的 OpenClaw 工作区推断本地工作区根目录，保留此远程根目录下当前 cwd 的后缀，并只将最终的 app-server cwd 发送给 Codex。如果 cwd 位于解析出的 OpenClaw 工作区根目录之外，OpenClaw 会以安全失败方式拒绝，而不是将 Gateway 网关本地路径发送到远程 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面调用的超时时间。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一个轮次后，或 OpenClaw 等待 `turn/completed` 时一次轮次作用域 app-server 请求后的静默窗口。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 时，在工具交接、原生工具完成、工具后原始助手进度、原始推理完成或推理进度之后使用的完成空闲和进度保护。对于可信或繁重的工作负载，如果工具后综合可以合理地比最终助手发布预算保持更长时间的静默，请使用此项。                                |
| `mode`                                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO               | YOLO 或 guardian 审核执行的预设。                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` 或允许的 guardian 审批策略                   | 发送到线程启动、恢复和轮次的原生 Codex 审批策略。                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允许的 guardian 沙箱          | 发送到线程启动和恢复的原生 Codex 沙箱模式。活动的 OpenClaw 沙箱会将 `danger-full-access` 轮次收窄为 Codex `workspace-write`；轮次网络标志遵循 OpenClaw 沙箱出口规则。                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` 或允许的 guardian 审核者                      | 允许时，使用 `"auto_review"` 让 Codex 审核原生审批提示。                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | 当前进程目录                                           | 省略 `--cwd` 时 `/codex bind` 使用的工作区。                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | 未设置                                                 | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求弹性处理，`null` 清除覆盖。旧版 `"fast"` 会按 `"priority"` 接受。                                                                                                                                                                                                 |
| `networkProxy`                                | 已禁用                                                 | 选择为 app-server 命令启用 Codex 权限配置文件联网。OpenClaw 会定义所选的 `permissions.<profile>.network` 配置，并用 `default_permissions` 选择它，而不是发送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 预览版选择加入项，会向 Codex app-server 0.132.0 或更新版本注册一个由 OpenClaw 沙箱支持的 Codex 环境，让原生 Codex 执行可以在活动的 OpenClaw 沙箱内运行。                                                                                                                                                                                                         |

`appServer.networkProxy` 是显式的，因为它会改变 Codex 沙箱
契约。启用后，OpenClaw 还会在 Codex 线程配置中设置 `features.network_proxy.enabled` 和
`default_permissions`，使生成的权限
配置文件可以启动 Codex 托管联网。默认情况下，OpenClaw 会根据
配置文件正文生成一个抗冲突的 `openclaw-network-<fingerprint>` 配置文件名称；
仅在需要稳定本地名称时使用 `profileName`。

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

如果普通 app-server 运行时会是 `danger-full-access`，启用
`networkProxy` 会为生成的权限配置使用工作区式文件系统访问。Codex 托管网络强制执行是沙箱隔离网络，
因此全访问配置无法保护出站流量。

该插件会阻止较旧或未版本化的 app-server 握手。Codex app-server
必须报告稳定版本 `0.125.0` 或更新版本。

OpenClaw 将非 loopback 的 WebSocket app-server URL 视为远程地址，并要求通过 `appServer.authToken` 或
`Authorization` 标头使用带身份信息的 WebSocket 认证。`appServer.authToken` 和每个 `appServer.headers.*`
值都可以是 SecretInput；secrets 运行时会在 OpenClaw 构建 app-server 启动选项之前解析 SecretRefs 和环境变量简写，
未解析的结构化 SecretRefs 会在发送任何 token 或标头之前失败。配置 Native Codex plugins 后，OpenClaw 会使用已连接 app-server 的插件控制平面来安装或刷新这些插件，然后刷新 app 清单，使插件拥有的 app 对 Codex 线程可见。`app/list` 仍然是权威的清单和元数据来源，但 OpenClaw 策略会决定是否让
`thread/start` 针对一个已列出且可访问的 app 发送 `config.apps[appId].enabled = true`，即使 Codex 当前将其标记为已禁用。未知或缺失的 app id 仍会 fail-closed；此路径只会通过 `plugin/install`
激活 marketplace 插件并刷新清单。只将 OpenClaw 连接到你信任的远程 app-server，且该 app-server 应可接受由 OpenClaw 管理的插件安装和 app 清单刷新。

## 审批和沙箱模式

本地 stdio app-server 会话默认使用 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。这种受信任的本地 operator 姿态让无人值守的 OpenClaw 轮次和 heartbeat 能够继续推进，而不会触发无人可答复的原生审批提示。

如果 Codex 的本地系统需求文件不允许隐式 YOLO 审批、
reviewer 或沙箱值，OpenClaw 会改为将隐式默认值视为 guardian
并选择允许的 guardian 权限。`tools.exec.mode: "auto"`
也会强制使用由 guardian 评审的 Codex 审批，并且不会保留不安全的旧版
`approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆盖；
若要有意使用无审批姿态，请设置 `tools.exec.mode: "full"`。
同一需求文件中按主机名匹配的
`[[remote_sandbox_config]]` 条目会被用于沙箱默认值决策。

为 Codex guardian 评审的审批设置 `appServer.mode: "guardian"`：

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

当这些值被允许时，`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
单独的策略字段会覆盖 `mode`。较旧的 `guardian_subagent` reviewer 值仍作为兼容别名被接受，
但新配置应使用 `auto_review`。

当 OpenClaw 沙箱处于活动状态时，本地 Codex app-server 进程仍在 Gateway 网关主机上运行。因此，OpenClaw 会在该轮次禁用 Codex 原生代码模式、
用户 MCP 服务器以及由 app 支持的插件执行，而不是把 Codex 主机侧沙箱隔离视为等同于 OpenClaw 沙箱后端。
当普通 exec/process 工具可用时，shell 访问会通过 OpenClaw 沙箱支持的动态工具公开，
例如 `sandbox_exec` 和 `sandbox_process`。

在 Ubuntu/AppArmor 主机上，当你有意在没有活动 OpenClaw 沙箱隔离的情况下运行原生 Codex
`workspace-write` 时，Codex bwrap 可能会在 shell 命令开始前失败。如果你看到
`bwrap: setting up uid map: Permission denied` 或
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`，请运行
`openclaw doctor` 并修复为 OpenClaw 服务用户报告的主机 namespace 策略，而不是授予更宽泛的 Docker 容器权限。优先为服务进程使用有作用域的 AppArmor 配置；
`kernel.apparmor_restrict_unprivileged_userns=0` fallback 是主机范围的，并存在安全权衡。

## 沙箱隔离的原生执行

稳定默认行为是 fail-closed：活动的 OpenClaw 沙箱隔离会禁用原本会从 Codex app-server
主机运行的原生 Codex 执行表面。仅当你想试用 Codex 的远程环境支持与 OpenClaw 沙箱后端结合时，才使用 `appServer.experimental.sandboxExecServer: true`。此预览路径要求 Codex app-server 0.132.0 或更新版本。

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

当该标志开启且当前 OpenClaw 会话处于沙箱隔离状态时，OpenClaw
会启动一个由活动沙箱支持的 local loopback exec-server，将其注册到 Codex app-server，
并使用该 OpenClaw 拥有的环境启动 Codex 线程和轮次。如果 app-server 无法注册该环境，
运行会 fail closed，而不会静默 fallback 到主机执行。

此预览路径仅限本地使用。远程 WebSocket app-server 无法访问 loopback exec-server，
除非它在同一主机上运行，因此 OpenClaw 会拒绝这种组合。

## 认证和环境隔离

在默认的按 Agent 配置 home 中，认证按以下顺序选择：

1. 该智能体的显式 OpenClaw Codex 认证配置。
2. 该智能体 Codex home 中 app-server 的现有账户。
3. 仅限本地 stdio app-server 启动：当没有 app-server 账户且仍需要 OpenAI 认证时，使用 `CODEX_API_KEY`，然后是
   `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅式 Codex 认证配置时，它会从派生的 Codex 子进程中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。这让 Gateway 网关级 API key 仍可用于 embeddings 或直接 OpenAI 模型，
同时避免原生 Codex app-server 轮次意外通过 API 计费。

显式 Codex API-key 配置和本地 stdio env-key fallback 使用 app-server
登录，而不是继承的子进程环境。WebSocket app-server 连接不会接收 Gateway 网关环境 API-key fallback；
请使用显式认证配置或远程 app-server 自身的账户。

默认情况下，stdio app-server 启动会继承 OpenClaw 的进程环境。
OpenClaw 拥有 Codex app-server 账户桥接，并将 `CODEX_HOME` 设置为该智能体 OpenClaw state 下的按智能体划分目录。
这会把 Codex 配置、账户、插件缓存/数据以及线程状态限定在 OpenClaw 智能体范围内，
而不是从 operator 个人的 `~/.codex` home 泄漏进来。

设置 `appServer.homeScope: "user"` 可与 Codex Desktop 和 CLI 共享原生 Codex 状态。此仅限本地 stdio 的模式会在设置了 `$CODEX_HOME` 时使用它，否则使用
`~/.codex`，包括原生认证、配置、插件和线程。OpenClaw 会跳过 app-server 的认证配置桥接。已验证的 owner 轮次可以使用 `codex_threads` 来列出、搜索、读取、fork、重命名、归档和恢复这些线程。在 OpenClaw 中继续线程之前先 fork 该线程；独立的 Codex 进程不会为同一线程协调并发写入者。

OpenClaw 不会为普通本地 app-server 启动重写 `HOME`。由 Codex 运行的子进程，例如 `openclaw`、`gh`、`git`、云 CLI 和 shell 命令，会看到普通进程 home，并可找到用户 home 中的配置和 token。Codex 也可能发现 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json`；
这种 `.agents` 发现有意与 operator home 共享，并且独立于隔离的 `~/.codex` 状态。

在默认智能体作用域中，OpenClaw 插件和 OpenClaw skill 快照仍会通过 OpenClaw 自身的插件注册表和 skill loader 流转；
个人 Codex `~/.codex` 资产不会。如果你有来自 Codex home 的有用 Codex CLI skills 或插件，
且它们应成为隔离 OpenClaw 智能体的一部分，请显式清点它们：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

如果某个部署需要额外的环境隔离，请将这些变量加入
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
OpenClaw 会在本地启动规范化期间从此列表中移除 `CODEX_HOME` 和 `HOME`：
`CODEX_HOME` 会继续指向所选智能体或用户作用域，
`HOME` 会继续继承，以便子进程能够使用普通用户 home 状态。

## 动态工具

Codex 动态工具默认使用 `searchable` 加载。OpenClaw 不会公开重复 Codex 原生工作区操作的动态工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

大多数剩余的 OpenClaw 集成工具，例如消息、媒体、cron、
浏览器、节点、gateway、`heartbeat_respond` 和 `web_search`，都可通过 `openclaw` namespace 下的 Codex 工具搜索使用。这会让初始模型上下文更小。`sessions_yield` 和仅消息工具来源的回复保持直接公开，因为它们是轮次控制契约。`sessions_spawn` 保持 searchable，以便 Codex 原生 `spawn_agent` 仍是主要 Codex 子智能体表面，同时仍可通过
`openclaw` 动态工具 namespace 使用显式 OpenClaw 或 ACP 委派。

仅当连接到无法搜索延迟动态工具的自定义 Codex app-server，或在调试完整工具 payload 时，才设置 `codexDynamicToolsLoading: "direct"`。

## 超时

OpenClaw 拥有的动态工具调用独立于
`appServer.requestTimeoutMs` 进行边界控制。每个 Codex `item/tool/call` 请求按以下顺序使用第一个可用超时：

- 正数的每调用 `timeoutMs` 参数。
- 对于 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 对于没有配置超时的 `image_generate`，使用 120 秒的图像生成默认值。
- 对于媒体理解 `image` 工具，使用 `tools.media.image.timeoutSeconds`
  转换为毫秒，或使用 60 秒媒体默认值。对于图像理解，这适用于请求本身，
  不会因前面的准备工作而减少。
- 90 秒的动态工具默认值。

此 watchdog 是外层动态 `item/tool/call` budget。提供商特定请求超时在该调用内运行，
并保留自身的超时语义。动态工具 budget 上限为 600000 ms。超时时，OpenClaw 会在支持的位置中止工具 signal，并向 Codex 返回失败的动态工具响应，
这样轮次可以继续，而不是让会话停留在 `processing`。

在 Codex 接受一个轮次之后，以及在 OpenClaw 响应某个轮次作用域的
app-server 请求之后，harness 期望 Codex 继续推进当前轮次，并最终用 `turn/completed` 完成原生轮次。如果 app-server 在
`appServer.turnCompletionIdleTimeoutMs` 时间内保持静默，OpenClaw 会尽力中断 Codex 轮次，
记录诊断超时，并释放 OpenClaw 会话 lane，以便后续聊天消息不会排在一个陈旧的原生轮次之后。

多数同一轮次的非终止通知会解除这个短 watchdog，因为 Codex 已经证明该轮次仍然存活。工具交接使用更长的工具后空闲预算：在 OpenClaw 返回 `item/tool/call` 响应后，在 `commandExecution` 等原生工具项完成后，在原始 `custom_tool_call_output` 完成后，以及在工具后的原始助手进度、原始 reasoning 完成或 reasoning 进度之后。该守卫在配置时使用 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否则默认使用五分钟。同一个工具后预算也会延长静默合成窗口的进度 watchdog，在 Codex 发出下一个当前轮次事件之前生效。Reasoning 完成、commentary `agentMessage` 完成，以及工具前的原始 reasoning 或助手进度，后面可能跟随自动最终回复，因此它们使用进度后回复守卫，而不是立即释放会话通道。只有最终/非 commentary 的已完成 `agentMessage` 项和工具前原始助手完成会启用助手输出释放：如果 Codex 随后静默且没有 `turn/completed`，OpenClaw 会尽力中断原生轮次并释放会话通道。可安全重放的 stdio 应用服务器失败，包括没有助手、工具、活跃项或副作用证据的轮次完成空闲超时，会在新的应用服务器尝试中重试一次。不安全的超时仍会停用卡住的应用服务器客户端并释放 OpenClaw 会话通道。它们还会清除陈旧的原生线程绑定，而不是自动重放。完成监视超时会呈现 Codex 专用的超时文本：可安全重放的情况会说明响应可能不完整，而不安全的情况会提示用户在重试前验证当前状态。公开超时诊断包含结构化字段，例如最后一个应用服务器通知方法、原始助手响应项 id/type/role、活跃请求/项计数，以及已启用的监视状态。当最后一个通知是原始助手响应项时，它们还会包含有界的助手文本预览。它们不会包含原始 prompt 或工具内容。

## 模型发现

默认情况下，Codex 插件会向应用服务器请求可用模型。模型可用性由 Codex 应用服务器拥有，因此当 OpenClaw 升级内置 `@openai/codex` 版本，或部署将 `appServer.command` 指向不同的 Codex 二进制文件时，该列表可能会变化。可用性也可能按账号限定。在运行中的 Gateway 网关上使用 `/codex models`，查看该 harness 和账号的实时目录。

如果发现失败或超时，OpenClaw 会对以下模型使用内置回退目录：

- GPT-5.5
- GPT-5.4 mini

当前内置 harness 是 `@openai/codex` `0.142.4`。在启用 GPT-5.6 的工作区中，对该内置应用服务器执行 `model/list` 探测，返回了这些公开选择器行：

| 模型 ID               | 输入模态    | Reasoning efforts                    |
| --------------------- | ----------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text        | low, medium, high, xhigh             |

GPT-5.6 访问在限量预览期间按账号限定。`max` 是模型 reasoning effort。`ultra` 是单独的 Codex 多智能体编排元数据，不是标准 OpenAI reasoning effort。

应用服务器目录可能会返回用于内部或专门流程的隐藏模型，但它们不是普通的模型选择器选项。

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

如果你希望启动时避免探测 Codex，并且只使用回退目录，请禁用发现：

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

## 工作区启动文件

Codex 会通过原生项目文档发现自行处理 `AGENTS.md`。OpenClaw 不会写入合成的 Codex 项目文档文件，也不依赖 Codex 用于 persona 文件的回退文件名，因为 Codex 回退只在缺少 `AGENTS.md` 时适用。

为了实现 OpenClaw 工作区一致性，Codex harness 会解析其他启动文件。`SOUL.md`、`IDENTITY.md`、`TOOLS.md` 和 `USER.md` 会作为 OpenClaw Codex 开发者指令转发，因为它们定义了活跃智能体、可用的工作区指导和用户资料。紧凑的 OpenClaw Skills 列表会作为轮次作用域的协作开发者指令转发。`HEARTBEAT.md` 内容不会被注入；heartbeat 轮次会获得一个协作模式指针，用于在文件存在且非空时读取它。当该工作区可用记忆工具时，来自已配置 Agent 工作区的 `MEMORY.md` 内容不会被粘贴到原生 Codex 轮次输入中；当它存在时，harness 会向轮次作用域的协作开发者指令添加一个小型工作区记忆指针，并且 Codex 应在持久记忆相关时使用 `memory_search` 或 `memory_get`。如果工具被禁用、记忆搜索不可用，或活跃工作区不同于 Agent 记忆工作区，`MEMORY.md` 会使用普通的有界轮次上下文路径。
存在 `BOOTSTRAP.md` 时，它会作为 OpenClaw 轮次输入参考上下文转发。

## 环境覆盖

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当未设置 `appServer.command` 时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或为一次性本地测试使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，推荐使用配置，因为它会将插件行为保留在与其余 Codex harness 设置相同的已审核文件中。

## 相关

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
- [OpenAI provider](/zh-CN/providers/openai)
- [配置参考](/zh-CN/gateway/configuration-reference)
