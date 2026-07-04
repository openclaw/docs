---
read_when:
    - 你需要每个 Codex harness 配置字段
    - 你正在更改 app-server 传输、凭证、设备发现或超时行为
    - 你正在调试 Codex harness 启动、模型发现或环境隔离
summary: Codex harness 的配置、凭证、设备发现和应用服务器参考
title: Codex harness reference
x-i18n:
    generated_at: "2026-07-04T20:24:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此参考涵盖内置 `codex` 插件的详细配置。关于设置和路由决策，请从
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
| `discovery`                | 已启用                   | Codex app-server `model/list` 的模型发现设置。                                                                                            |
| `appServer`                | 托管式 stdio app-server  | 传输协议、命令、身份验证、审批、沙箱和超时设置。                                                                                         |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 将 OpenClaw 动态工具直接放入初始 Codex 工具上下文。                                                                      |
| `codexDynamicToolsExclude` | `[]`                     | 要从 Codex app-server 轮次中省略的额外 OpenClaw 动态工具名称。                                                                            |
| `codexPlugins`             | 已禁用                   | 对已迁移、从源码安装的精选插件的 Native Codex plugin/app 支持。请参阅 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。 |
| `computerUse`              | 已禁用                   | Codex Computer Use 设置。请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)。                                                       |

## App-server 传输协议

默认情况下，OpenClaw 会启动随内置插件一起提供的托管式 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

这会让 app-server 版本绑定到内置 `codex` 插件，而不是绑定到本地碰巧安装的任何单独 Codex CLI。仅当你有意运行不同的可执行文件时，才设置
`appServer.command`。

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

| 字段                                          | 默认值                                                 | 含义                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                                                                                                                                                                                                                                                  |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 会按每个 OpenClaw 智能体隔离 Codex 状态。`"user"` 会共享原生 `$CODEX_HOME` 或 `~/.codex`，使用原生凭证，并启用仅所有者可用的线程管理。用户作用域需要 stdio。                                                                                                                                                                                                                                                  |
| `command`                                     | 托管的 Codex 二进制文件                                | stdio 传输协议的可执行文件。保持未设置即可使用托管的二进制文件。                                                                                                                                                                                                                                                                                                                                                       |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输协议的参数。                                                                                                                                                                                                                                                                                                                                                                                                 |
| `url`                                         | 未设置                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                                             |
| `authToken`                                   | 未设置                                                 | WebSocket 传输协议的 Bearer 令牌。接受字面量字符串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                                   |
| `headers`                                     | `{}`                                                   | 额外的 WebSocket 标头。标头值接受字面量字符串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                                                 |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 构建继承环境后，从生成的 stdio app-server 进程中移除的额外环境变量名称。                                                                                                                                                                                                                                                                                                                                      |
| `remoteWorkspaceRoot`                         | 未设置                                                 | 远程 Codex app-server 工作区根目录。设置后，OpenClaw 会从解析后的 OpenClaw 工作区推断本地工作区根目录，保留当前 cwd 在该远程根目录下的后缀，并只将最终的 app-server cwd 发送给 Codex。如果 cwd 位于解析后的 OpenClaw 工作区根目录之外，OpenClaw 会失败关闭，而不是向远程 app-server 发送 Gateway 网关本地路径。                                      |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面调用的超时时间。                                                                                                                                                                                                                                                                                                                                                                                    |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一个轮次后，或轮次作用域的 app-server 请求之后，OpenClaw 等待 `turn/completed` 时的静默窗口。                                                                                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 时，在工具交接、原生工具完成、工具后原始助手进度、原始推理完成或推理进度之后使用的完成空闲和进度保护。对于可信或繁重的工作负载，如果工具后综合可以合理地比最终助手发布预算保持更长时间静默，请使用此项。                                                                                                                |
| `mode`                                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO               | YOLO 或 guardian 审核执行的预设。                                                                                                                                                                                                                                                                                                                                                                                      |
| `approvalPolicy`                              | `"never"` 或允许的 guardian 审批策略                   | 发送到线程启动、恢复和轮次的原生 Codex 审批策略。                                                                                                                                                                                                                                                                                                                                                                      |
| `sandbox`                                     | `"danger-full-access"` 或允许的 guardian 沙箱          | 发送到线程启动和恢复的原生 Codex 沙箱模式。活跃的 OpenClaw 沙箱会将 `danger-full-access` 轮次收窄为 Codex `workspace-write`；轮次网络标志跟随 OpenClaw 沙箱出站规则。                                                                                                                                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` 或允许的 guardian 审核者                      | 使用 `"auto_review"` 可在允许时让 Codex 审核原生审批提示。                                                                                                                                                                                                                                                                                                                                                             |
| `defaultWorkspaceDir`                         | 当前进程目录                                           | 省略 `--cwd` 时，`/codex bind` 使用的工作区。                                                                                                                                                                                                                                                                                                                                                                          |
| `serviceTier`                                 | 未设置                                                 | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求 flex 处理，`null` 清除覆盖。旧版 `"fast"` 会按 `"priority"` 接受。                                                                                                                                                                                                                                                                       |
| `networkProxy`                                | 已禁用                                                 | 为 app-server 命令选择启用 Codex 权限配置文件联网。OpenClaw 会定义选定的 `permissions.<profile>.network` 配置，并通过 `default_permissions` 选择它，而不是发送 `sandbox`。                                                                                                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | 预览版选择启用项，会向 Codex app-server 0.132.0 或更高版本注册一个由 OpenClaw 沙箱支持的 Codex 环境，使原生 Codex 执行可在活跃的 OpenClaw 沙箱内运行。                                                                                                                                                                                                                                                                 |

`appServer.networkProxy` 是显式的，因为它会改变 Codex 沙箱契约。启用后，OpenClaw 还会在 Codex 线程配置中设置 `features.network_proxy.enabled` 和 `default_permissions`，让生成的权限配置文件能够启动 Codex 托管联网。默认情况下，OpenClaw 会根据配置文件正文生成抗冲突的 `openclaw-network-<fingerprint>` 配置文件名称；仅当需要稳定的本地名称时才使用 `profileName`。

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
`networkProxy` 会为生成的权限配置文件使用工作区式文件系统访问。Codex 托管的网络强制执行是沙箱隔离网络，
因此完全访问配置文件无法保护出站流量。

该插件会阻止较旧或未版本化的 app-server 握手。Codex app-server
必须报告稳定版本 `0.125.0` 或更高版本。

OpenClaw 会将非 loopback 的 WebSocket app-server URL 视为远程，并要求通过 `appServer.authToken` 或
`Authorization` 标头使用带身份信息的 WebSocket 认证。`appServer.authToken` 和每个 `appServer.headers.*`
值都可以是 SecretInput；secrets 运行时会在 OpenClaw 构建 app-server 启动选项之前解析 SecretRefs 和 env
简写，未解析的结构化 SecretRefs 会在任何 token 或标头发送之前失败。配置原生 Codex
插件后，OpenClaw 会使用已连接 app-server 的插件控制平面来安装或刷新这些插件，然后刷新应用清单，以便插件拥有的应用对 Codex
线程可见。`app/list` 仍然是权威的清单和元数据来源，但 OpenClaw 策略会决定是否让
`thread/start` 为列出的可访问应用发送 `config.apps[appId].enabled = true`，即使 Codex 当前将其标记为禁用。未知或缺失的应用 id
仍然默认拒绝；此路径只会通过 `plugin/install` 激活市场插件并刷新清单。只应将 OpenClaw 连接到可信任的远程 app-server，这些 app-server
应能够接受 OpenClaw 管理的插件安装和应用清单刷新。

## 审批和沙箱模式

本地 stdio app-server 会话默认使用 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。这种受信任的本地操作员姿态允许无人值守的 OpenClaw 轮次和 heartbeats 继续推进，而不会出现无人响应的原生审批提示。

如果 Codex 的本地系统要求文件不允许隐式 YOLO 审批、reviewer 或沙箱值，OpenClaw 会改为将隐式默认值视为 guardian
并选择允许的 guardian 权限。`tools.exec.mode: "auto"`
也会强制使用 guardian 审核的 Codex 审批，并且不会保留不安全的旧版 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆盖；如需有意采用无审批姿态，请设置 `tools.exec.mode: "full"`。
同一要求文件中按主机名匹配的
`[[remote_sandbox_config]]` 条目会被用于沙箱默认决策。

设置 `appServer.mode: "guardian"` 以使用 Codex guardian 审核的审批：

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
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。单独的策略字段会覆盖 `mode`。较旧的
`guardian_subagent` reviewer 值仍作为兼容别名被接受，
但新配置应使用 `auto_review`。

当 OpenClaw 沙箱处于活动状态时，本地 Codex app-server 进程仍然运行在 Gateway 网关主机上。因此，OpenClaw 会在该轮次中禁用 Codex
原生代码模式、用户 MCP 服务器和应用支持的插件执行，而不是将 Codex 主机侧沙箱隔离视为等同于 OpenClaw 沙箱后端。当常规 exec/process 工具可用时，shell
访问会通过 OpenClaw 沙箱支持的动态工具暴露，例如 `sandbox_exec` 和 `sandbox_process`。

在 Ubuntu/AppArmor 主机上，当你有意在没有活动 OpenClaw 沙箱隔离的情况下运行原生 Codex
`workspace-write` 时，Codex bwrap 可能会在 shell 命令启动前于 `workspace-write` 下失败。如果你看到
`bwrap: setting up uid map: Permission denied` 或
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`，请运行
`openclaw doctor`，并修复报告中 OpenClaw 服务用户的主机命名空间策略，而不是授予更宽泛的 Docker 容器权限。优先为服务进程使用有范围限制的 AppArmor 配置文件；`kernel.apparmor_restrict_unprivileged_userns=0` 兜底是主机范围的，并且存在安全权衡。

## 沙箱隔离的原生执行

稳定默认值是默认拒绝：活动的 OpenClaw 沙箱隔离会禁用原本会从 Codex app-server
主机运行的原生 Codex 执行表面。仅当你想用 OpenClaw 的沙箱后端试用 Codex 的远程环境支持时，才使用 `appServer.experimental.sandboxExecServer: true`。此预览路径需要 Codex app-server 0.132.0 或更高版本。

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

启用该标志且当前 OpenClaw 会话处于沙箱隔离时，OpenClaw 会启动一个由活动沙箱支持的 local loopback exec-server，将其注册到 Codex app-server，并用该 OpenClaw
拥有的环境启动 Codex 线程和轮次。如果 app-server 无法注册该环境，运行会默认拒绝，而不是静默回退到主机执行。

此预览路径仅限本地。远程 WebSocket app-server 无法访问 loopback exec-server，除非它运行在同一主机上，因此 OpenClaw 会拒绝该组合。

## 认证和环境隔离

在默认的按 Agent 配置 home 中，认证按以下顺序选择：

1. Agent 的显式 OpenClaw Codex 认证配置文件。
2. 该 Agent 的 Codex home 中 app-server 现有账户。
3. 仅对于本地 stdio app-server 启动，在没有 app-server 账户且仍需要 OpenAI 认证时，依次使用 `CODEX_API_KEY`、`OPENAI_API_KEY`。

当 OpenClaw 发现 ChatGPT 订阅式 Codex 认证配置文件时，它会从派生的 Codex 子进程中移除
`CODEX_API_KEY` 和 `OPENAI_API_KEY`。这会让 Gateway 网关级 API key 仍可用于 embeddings 或直接 OpenAI 模型，同时避免原生 Codex app-server 轮次意外通过 API 计费。

显式 Codex API-key 配置文件和本地 stdio env-key 兜底会使用 app-server 登录，而不是继承的子进程 env。WebSocket app-server 连接不会接收 Gateway 网关 env API-key 兜底；请使用显式认证配置文件或远程 app-server 自己的账户。

Stdio app-server 启动默认继承 OpenClaw 的进程环境。OpenClaw 拥有 Codex app-server 账户桥接，并将 `CODEX_HOME` 设置为该 Agent 的 OpenClaw 状态下的按 Agent 配置目录。这样可以将 Codex 配置、账户、插件缓存/数据和线程状态限定在 OpenClaw Agent 范围内，而不是从操作员个人的 `~/.codex` home 泄漏进来。

设置 `appServer.homeScope: "user"` 可与 Codex Desktop 和 CLI 共享原生 Codex 状态。此仅限本地 stdio 的模式会在设置时使用 `$CODEX_HOME`，否则使用
`~/.codex`，包括原生认证、配置、插件和线程。OpenClaw 会跳过它为 app-server 准备的认证配置文件桥接。已验证的所有者轮次可以使用 `codex_threads` 列出、搜索、读取、fork、重命名、归档和恢复这些线程。在 OpenClaw 中继续线程之前先 fork 该线程；独立 Codex 进程不会协调同一线程的并发写入者。

OpenClaw 不会为常规本地 app-server 启动改写 `HOME`。由 Codex 运行的子进程，例如 `openclaw`、`gh`、`git`、cloud CLI 和 shell 命令，会看到正常的进程 home，并且可以找到用户 home 中的配置和 token。Codex 还可能发现 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json`；这种 `.agents` 发现有意与操作员 home 共享，并且独立于隔离的 `~/.codex` 状态。

在默认 Agent 范围内，OpenClaw 插件和 OpenClaw skill 快照仍会通过 OpenClaw 自己的插件注册表和 skill loader 流转；个人 Codex
`~/.codex` 资产不会。如果你有来自 Codex home 的有用 Codex CLI skills 或插件，并希望它们成为隔离 OpenClaw Agent 的一部分，请显式清点它们：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` 只影响派生的 Codex app-server 子进程。OpenClaw 会在本地启动规范化期间从此列表中移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 会继续指向所选的 Agent 或用户范围，`HOME` 会继续继承，以便子进程可以使用正常的用户 home 状态。

## 动态工具

Codex 动态工具默认使用 `searchable` 加载。OpenClaw 不会暴露会与 Codex 原生工作区操作重复的动态工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

大多数剩余的 OpenClaw 集成工具，例如消息、媒体、cron、浏览器、节点、Gateway 网关、`heartbeat_respond` 和 `web_search`，都可以通过 `openclaw` 命名空间下的 Codex 工具搜索使用。这会让初始模型上下文更小。`sessions_yield` 和仅消息工具来源回复保持直接暴露，因为这些是轮次控制契约。`sessions_spawn` 保持可搜索，因此 Codex 的原生 `spawn_agent` 仍然是主要的 Codex 子智能体表面，而显式 OpenClaw 或 ACP 委派仍可通过 `openclaw` 动态工具命名空间使用。

仅在连接到无法搜索延迟动态工具的自定义 Codex
app-server 时，或调试完整工具负载时，才设置 `codexDynamicToolsLoading: "direct"`。

## 超时

OpenClaw 拥有的动态工具调用独立于
`appServer.requestTimeoutMs` 进行限制。每个 Codex `item/tool/call` 请求会按以下顺序使用第一个可用超时：

- 正数的按调用 `timeoutMs` 参数。
- 对于 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 对于没有配置超时的 `image_generate`，使用 120 秒图像生成默认值。
- 对于媒体理解 `image` 工具，使用 `tools.media.image.timeoutSeconds`
  转换为毫秒，或 60 秒媒体默认值。对于图像理解，这适用于请求本身，并且不会因先前的准备工作而减少。
- 90 秒动态工具默认值。

此 watchdog 是外层动态 `item/tool/call` 预算。提供商特定请求超时在该调用内部运行，并保留自己的超时语义。动态工具预算上限为 600000 ms。超时时，OpenClaw 会在支持的位置中止工具信号，并向 Codex 返回失败的动态工具响应，以便轮次可以继续，而不是让会话停留在 `processing`。

在 Codex 接受轮次之后，以及 OpenClaw 响应轮次范围的
app-server 请求之后，harness 会预期 Codex 推进当前轮次并最终以 `turn/completed` 完成原生轮次。如果 app-server 在
`appServer.turnCompletionIdleTimeoutMs` 期间保持静默，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放
OpenClaw 会话通道，以免后续聊天消息排队等待过期的原生轮次。

大多数同一轮次的非终止通知都会解除这个短 watchdog，因为 Codex 已经证明该轮次仍然存活。工具交接使用更长的工具后空闲预算：在 OpenClaw 返回 `item/tool/call` 响应之后，在 `commandExecution` 等原生工具项完成之后，在原始 `custom_tool_call_output` 完成之后，以及在工具后原始助手进度、原始推理完成或推理进度之后。该保护机制会在配置时使用 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否则默认使用五分钟。同一个工具后预算也会延长进度 watchdog，用于 Codex 发出下一个当前轮次事件之前的静默合成窗口。推理完成、commentary `agentMessage` 完成，以及工具前原始推理或助手进度之后可能会跟随自动最终回复，因此它们会使用进度后回复保护，而不是立即释放会话通道。只有最终/非 commentary 的已完成 `agentMessage` 项和工具前原始助手完成会启用助手输出释放：如果 Codex 随后静默且没有 `turn/completed`，OpenClaw 会尽力中断原生轮次并释放会话通道。可重放安全的 stdio app-server 故障，包括没有助手、工具、活动项或副作用证据的轮次完成空闲超时，会在新的 app-server 尝试中重试一次。不安全的超时仍会停用卡住的 app-server 客户端并释放 OpenClaw 会话通道。它们还会清除过期的原生线程绑定，而不是自动重放。完成监视超时会呈现 Codex 专用的超时文本：可重放安全的情况会说明响应可能不完整，而不安全的情况会提示用户在重试前验证当前状态。公开超时诊断包含结构化字段，例如最后一个 app-server 通知方法、原始助手响应项 id/type/role、活动请求/项计数，以及已启用的监视状态。当最后一个通知是原始助手响应项时，它们还会包含有界的助手文本预览。它们不包含原始提示或工具内容。

## 模型发现

默认情况下，Codex 插件会向 app-server 请求可用模型。模型可用性由 Codex app-server 拥有，因此当 OpenClaw 升级内置的 `@openai/codex` 版本，或当部署将 `appServer.command` 指向不同的 Codex 二进制文件时，该列表可能会变化。可用性也可能按账号限定。对正在运行的 Gateway 网关使用 `/codex models`，可查看该 harness 和账号的实时目录。

如果发现失败或超时，OpenClaw 会使用内置回退目录：

- GPT-5.5
- GPT-5.4 mini

当前内置 harness 是 `@openai/codex` `0.142.5`。针对该内置 app-server 的 `model/list` 探测返回了这些公开选择器行：

| 模型 id               | 输入模态     | 推理强度                 |
| --------------------- | ------------ | ------------------------ |
| `gpt-5.5`             | 文本、图像   | 低、中、高、xhigh        |
| `gpt-5.4`             | 文本、图像   | 低、中、高、xhigh        |
| `gpt-5.4-mini`        | 文本、图像   | 低、中、高、xhigh        |
| `gpt-5.3-codex-spark` | 文本         | 低、中、高、xhigh        |

app-server 目录可以为内部或专用流程返回隐藏模型，但它们不是普通的模型选择器选项。

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

## 工作区引导文件

Codex 通过原生项目文档发现自行处理 `AGENTS.md`。OpenClaw 不会写入合成的 Codex 项目文档文件，也不依赖 Codex 的 persona 文件回退文件名，因为 Codex 回退仅在缺少 `AGENTS.md` 时适用。

为了实现 OpenClaw 工作区一致性，Codex harness 会解析其他引导文件。`SOUL.md`、`IDENTITY.md`、`TOOLS.md` 和 `USER.md` 会作为 OpenClaw Codex 开发者指令转发，因为它们定义了活动智能体、可用的工作区指南和用户画像。紧凑的 OpenClaw Skills 列表会作为轮次作用域的协作开发者指令转发。`HEARTBEAT.md` 内容不会被注入；heartbeat 轮次会获得一个协作模式指针，以便在文件存在且非空时读取该文件。配置的 Agent 工作区中的 `MEMORY.md` 内容，在该工作区可用记忆工具时，不会粘贴到原生 Codex 轮次输入中；当它存在时，harness 会向轮次作用域的协作开发者指令添加一个小型工作区记忆指针，并且 Codex 应在需要持久记忆时使用 `memory_search` 或 `memory_get`。如果工具被禁用、记忆搜索不可用，或活动工作区不同于 Agent 记忆工作区，`MEMORY.md` 会使用普通的有界轮次上下文路径。
存在 `BOOTSTRAP.md` 时，它会作为 OpenClaw 轮次输入参考上下文转发。

## 环境覆盖

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当未设置 `appServer.command` 时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，优先使用配置，因为它会将插件行为与其余 Codex harness 设置保留在同一个已审阅文件中。

## 相关

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
- [OpenAI provider](/zh-CN/providers/openai)
- [配置参考](/zh-CN/gateway/configuration-reference)
