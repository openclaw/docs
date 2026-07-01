---
read_when:
    - 你需要每个 Codex harness 配置字段
    - 你正在更改 app-server 传输、身份验证、设备发现或超时行为
    - 你正在调试 Codex harness 启动、模型发现或环境隔离
summary: Codex harness 的配置、凭证、设备发现和 app-server 参考
title: Codex harness reference
x-i18n:
    generated_at: "2026-07-01T07:51:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此参考介绍内置 `codex` 插件的详细配置。有关设置和路由决策，请先阅读
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
| `discovery`                | 已启用                   | Codex app-server `model/list` 的模型发现设置。                                                                                             |
| `appServer`                | 托管的 stdio app-server  | 传输、命令、凭证、审批、沙箱和超时设置。                                                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 将 OpenClaw 动态工具直接放入初始 Codex 工具上下文。                                                                        |
| `codexDynamicToolsExclude` | `[]`                     | 要从 Codex app-server 轮次中省略的其他 OpenClaw 动态工具名称。                                                                             |
| `codexPlugins`             | 已禁用                   | 针对已迁移的源安装精选插件的 Native Codex plugins/app 支持。请参阅 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。                 |
| `computerUse`              | 已禁用                   | Codex Computer Use 设置。请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)。                                                        |

## App-server 传输

默认情况下，OpenClaw 会启动随内置插件一起发布的托管 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

这会让 app-server 版本绑定到内置的 `codex` 插件，而不是本地恰好安装的任何单独 Codex CLI。仅当你有意运行不同的可执行文件时，才设置 `appServer.command`。

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
| `transport`                                   | `"stdio"`                                              | `"stdio"` 会启动 Codex；`"websocket"` 会连接到 `url`。                                                                                                                                                                                                                                                                                                                                          |
| `command`                                     | 托管的 Codex 二进制文件                                | stdio 传输使用的可执行文件。留空则使用托管二进制文件。                                                                                                                                                                                                                                                                                                                                         |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输使用的参数。                                                                                                                                                                                                                                                                                                                                                                         |
| `url`                                         | 未设置                                                 | WebSocket app-server URL。                                                                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未设置                                                 | WebSocket 传输使用的 Bearer 令牌。接受字面字符串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                             |
| `headers`                                     | `{}`                                                   | 额外的 WebSocket 标头。标头值接受字面字符串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                           |
| `clearEnv`                                    | `[]`                                                   | OpenClaw 构建继承环境后，从启动的 stdio app-server 进程中移除的额外环境变量名称。                                                                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未设置                                                 | 远程 Codex app-server 工作区根目录。设置后，OpenClaw 会从解析后的 OpenClaw 工作区推断本地工作区根目录，保留当前 cwd 在该远程根目录下的后缀，并且只将最终的 app-server cwd 发送给 Codex。如果 cwd 位于解析后的 OpenClaw 工作区根目录之外，OpenClaw 会以关闭失败方式处理，而不是将 Gateway 网关本地路径发送给远程 app-server。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面调用的超时时间。                                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受一个轮次后，或在轮次范围内的 app-server 请求之后，OpenClaw 等待 `turn/completed` 时使用的静默窗口。                                                                                                                                                                                                                                                                                  |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 时，在工具移交、原生工具完成、工具后原始助手进度、原始推理完成或推理进度之后使用的完成空闲和进度保护。对于受信任或较重的工作负载，如果工具后综合确实可能比最终助手发布预算更长时间保持静默，请使用此项。                                                                                         |
| `mode`                                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO               | YOLO 或 guardian 审查执行的预设。                                                                                                                                                                                                                                                                                                                                                              |
| `approvalPolicy`                              | `"never"` 或允许的 guardian 审批策略                   | 发送到线程启动、恢复和轮次的原生 Codex 审批策略。                                                                                                                                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` 或允许的 guardian 沙箱          | 发送到线程启动和恢复的原生 Codex 沙箱模式。启用的 OpenClaw 沙箱会将 `danger-full-access` 轮次收窄为 Codex `workspace-write`；轮次网络标志会跟随 OpenClaw 沙箱出站规则。                                                                                                                                                                                                                         |
| `approvalsReviewer`                           | `"user"` 或允许的 guardian 审查者                      | 在允许时，使用 `"auto_review"` 让 Codex 审查原生审批提示。                                                                                                                                                                                                                                                                                                                                     |
| `defaultWorkspaceDir`                         | 当前进程目录                                           | 省略 `--cwd` 时 `/codex bind` 使用的工作区。                                                                                                                                                                                                                                                                                                                                                    |
| `serviceTier`                                 | 未设置                                                 | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求 flex 处理，`null` 清除覆盖。旧版 `"fast"` 会按 `"priority"` 接受。                                                                                                                                                                                                                                               |
| `networkProxy`                                | 已禁用                                                 | 为 app-server 命令选择启用 Codex 权限配置文件联网。OpenClaw 会定义所选的 `permissions.<profile>.network` 配置，并通过 `default_permissions` 选择它，而不是发送 `sandbox`。                                                                                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                                | 预览版选择启用项，会向 Codex app-server 0.132.0 或更新版本注册一个由 OpenClaw 沙箱支持的 Codex 环境，使原生 Codex 执行可以在启用的 OpenClaw 沙箱内运行。                                                                                                                                                                                                                                       |

`appServer.networkProxy` 是显式配置，因为它会改变 Codex 沙箱契约。启用后，OpenClaw 还会在 Codex 线程配置中设置 `features.network_proxy.enabled` 和 `default_permissions`，让生成的权限配置文件可以启动 Codex 托管联网。默认情况下，OpenClaw 会根据配置文件正文生成一个抗冲突的 `openclaw-network-<fingerprint>` 配置文件名；仅在需要稳定本地名称时使用 `profileName`。

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

如果正常的 app-server 运行时会是 `danger-full-access`，启用 `networkProxy` 会为生成的权限配置文件使用工作区风格的文件系统访问。Codex 托管网络强制执行是沙箱隔离的联网，因此全访问配置文件不会保护出站流量。

该插件会阻止较旧或未带版本的 app-server 握手。Codex app-server 必须报告稳定版本 `0.125.0` 或更新版本。

OpenClaw 会将非回环 WebSocket 应用服务器 URL 视为远程地址，并要求通过 `appServer.authToken` 或 `Authorization` 标头使用带身份信息的 WebSocket 凭证。`appServer.authToken` 和每个 `appServer.headers.*` 值都可以是 SecretInput；secrets 运行时会在 OpenClaw 构建应用服务器启动选项之前解析 SecretRefs 和环境变量简写，未解析的结构化 SecretRefs 会在发送任何令牌或标头之前失败。配置 Native Codex plugins 后，OpenClaw 会使用已连接应用服务器的插件控制平面安装或刷新这些插件，然后刷新应用清单，使插件拥有的应用对 Codex 线程可见。`app/list` 仍然是权威的清单和元数据来源，但 OpenClaw 策略会决定即使 Codex 当前将某个已列出且可访问的应用标记为禁用，`thread/start` 是否仍发送 `config.apps[appId].enabled = true`。未知或缺失的应用 ID 仍会失败即关闭；此路径只会通过 `plugin/install` 激活 marketplace 插件并刷新清单。只将 OpenClaw 连接到可信任的远程应用服务器，使其能够接受由 OpenClaw 管理的插件安装和应用清单刷新。

## 审批和沙箱模式

本地 stdio 应用服务器会话默认使用 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。这种受信任的本地操作员姿态让无人值守的 OpenClaw 轮次和 heartbeats 能够继续推进，而不会出现无人回答的原生审批提示。

如果 Codex 的本地系统要求文件不允许隐式 YOLO 审批、审核者或沙箱值，OpenClaw 会改为将隐式默认值视为 guardian，并选择允许的 guardian 权限。`tools.exec.mode: "auto"` 也会强制使用 guardian 审核的 Codex 审批，并且不会保留不安全的旧式 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆盖；若要有意使用无需审批的姿态，请设置 `tools.exec.mode: "full"`。同一要求文件中与主机名匹配的 `[[remote_sandbox_config]]` 条目会被用于沙箱默认值决策。

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

当这些值被允许时，`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。单独的策略字段会覆盖 `mode`。较旧的 `guardian_subagent` 审核者值仍作为兼容别名被接受，但新配置应使用 `auto_review`。

当 OpenClaw 沙箱处于活动状态时，本地 Codex 应用服务器进程仍在 Gateway 网关主机上运行。因此，OpenClaw 会在该轮次中禁用 Codex 原生代码模式、用户 MCP 服务器和应用支持的插件执行，而不是将 Codex 主机侧沙箱隔离视为等同于 OpenClaw 沙箱后端。当正常的 exec/process 工具可用时，shell 访问会通过 OpenClaw 沙箱支持的动态工具暴露，例如 `sandbox_exec` 和 `sandbox_process`。

在 Ubuntu/AppArmor 主机上，当你有意在没有活动 OpenClaw 沙箱隔离的情况下运行原生 Codex `workspace-write` 时，Codex bwrap 可能会在 shell 命令启动之前失败。如果你看到 `bwrap: setting up uid map: Permission denied` 或
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`，请运行
`openclaw doctor` 并修复为 OpenClaw 服务用户报告的主机命名空间策略，而不是授予更宽泛的 Docker 容器权限。优先为服务进程使用范围限定的 AppArmor 配置文件；`kernel.apparmor_restrict_unprivileged_userns=0` 回退是主机范围的，并存在安全权衡。

## 沙箱隔离的原生执行

稳定默认值是失败即关闭：活动的 OpenClaw 沙箱隔离会禁用原本会从 Codex 应用服务器主机运行的原生 Codex 执行表面。仅在你想要将 Codex 的远程环境支持与 OpenClaw 的沙箱后端一起试用时，才使用 `appServer.experimental.sandboxExecServer: true`。此预览路径需要 Codex 应用服务器 0.132.0 或更高版本。

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

当该标志开启且当前 OpenClaw 会话处于沙箱隔离状态时，OpenClaw 会启动一个由活动沙箱支持的 local loopback exec-server，将其注册到 Codex 应用服务器，并使用这个由 OpenClaw 拥有的环境启动 Codex 线程和轮次。如果应用服务器无法注册该环境，运行会失败即关闭，而不是静默回退到主机执行。

此预览路径仅限本地。远程 WebSocket 应用服务器无法访问 loopback exec-server，除非它运行在同一主机上，因此 OpenClaw 会拒绝这种组合。

## 凭证和环境隔离

凭证按以下顺序选择：

1. 该 Agent 的显式 OpenClaw Codex 凭证配置文件。
2. 该 Agent 的 Codex 主目录中应用服务器的现有账户。
3. 仅对本地 stdio 应用服务器启动，当不存在应用服务器账户且仍需要 OpenAI 凭证时，使用 `CODEX_API_KEY`，然后是
   `OPENAI_API_KEY`。

当 OpenClaw 发现 ChatGPT 订阅风格的 Codex 凭证配置文件时，它会从生成的 Codex 子进程中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这会让 Gateway 网关级 API key 仍可用于嵌入或直接 OpenAI 模型，同时避免原生 Codex 应用服务器轮次意外通过 API 计费。

显式 Codex API key 配置文件和本地 stdio 环境变量 key 回退使用应用服务器登录，而不是继承的子进程环境。WebSocket 应用服务器连接不会接收 Gateway 网关环境 API key 回退；请使用显式凭证配置文件或远程应用服务器自己的账户。

默认情况下，stdio 应用服务器启动会继承 OpenClaw 的进程环境。OpenClaw 拥有 Codex 应用服务器账户桥接，并将 `CODEX_HOME` 设置为该 Agent 的 OpenClaw 状态下的每 Agent 目录。这会让 Codex 配置、账户、插件缓存/数据和线程状态限定在 OpenClaw Agent 范围内，而不是从操作员个人的 `~/.codex` 主目录泄漏进来。

OpenClaw 不会为正常的本地应用服务器启动重写 `HOME`。Codex 运行的子进程（例如 `openclaw`、`gh`、`git`、云 CLI 和 shell 命令）会看到正常的进程主目录，并能找到用户主目录配置和令牌。Codex 也可能发现 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json`；这种 `.agents` 发现会有意与操作员主目录共享，并且独立于隔离的 `~/.codex` 状态。

OpenClaw 插件和 OpenClaw skill 快照仍通过 OpenClaw 自己的插件注册表和 skill 加载器流转。个人 Codex `~/.codex` 资产不会这样做。如果你有来自 Codex 主目录的有用 Codex CLI skills 或插件，且它们应成为 OpenClaw Agent 的一部分，请显式盘点它们：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

如果某个部署需要额外的环境隔离，请将这些变量添加到
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

`appServer.clearEnv` 只影响生成的 Codex 应用服务器子进程。OpenClaw 会在本地启动规范化期间从此列表中移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 保持每 Agent 独立，`HOME` 保持继承，以便子进程可以使用正常的用户主目录状态。

## 动态工具

Codex 动态工具默认使用 `searchable` 加载。OpenClaw 不会暴露与 Codex 原生工作区操作重复的动态工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

大多数其余 OpenClaw 集成工具，例如消息、媒体、cron、浏览器、节点、gateway、`heartbeat_respond` 和 `web_search`，都可通过 `openclaw` 命名空间下的 Codex 工具搜索使用。这会让初始模型上下文更小。`sessions_yield` 和仅消息工具的源回复保持直接模式，因为它们是轮次控制合同。`sessions_spawn` 保持可搜索，因此 Codex 的原生 `spawn_agent` 仍是主要 Codex 子智能体表面，而显式 OpenClaw 或 ACP 委派仍可通过 `openclaw` 动态工具命名空间使用。

仅当连接到无法搜索延迟动态工具的自定义 Codex 应用服务器，或调试完整工具载荷时，才设置 `codexDynamicToolsLoading: "direct"`。

## 超时

OpenClaw 拥有的动态工具调用与 `appServer.requestTimeoutMs` 独立设限。每个 Codex `item/tool/call` 请求会按以下顺序使用第一个可用超时：

- 正数的每调用 `timeoutMs` 参数。
- 对于 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 对于没有配置超时的 `image_generate`，使用 120 秒的图像生成默认值。
- 对于媒体理解 `image` 工具，使用转换为毫秒的 `tools.media.image.timeoutSeconds`，或 60 秒的媒体默认值。对于图像理解，这适用于请求本身，并且不会因先前的准备工作而减少。
- 90 秒的动态工具默认值。

此 watchdog 是外层动态 `item/tool/call` 预算。提供商特定的请求超时在该调用内部运行，并保留自己的超时语义。动态工具预算上限为 600000 ms。超时时，OpenClaw 会在支持的情况下中止工具信号，并向 Codex 返回失败的动态工具响应，使该轮次可以继续，而不是让会话停留在 `processing`。

在 Codex 接受一个轮次之后，以及在 OpenClaw 响应一个轮次范围的应用服务器请求之后，harness 期望 Codex 推进当前轮次，并最终用 `turn/completed` 完成原生轮次。如果应用服务器静默超过 `appServer.turnCompletionIdleTimeoutMs`，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw 会话通道，使后续聊天消息不会排在过时的原生轮次之后。

同一轮次的大多数非终止通知会解除这个短看门狗，
因为 Codex 已证明该轮次仍然存活。工具交接使用更长的
工具后空闲预算：在 OpenClaw 返回 `item/tool/call` 响应之后，在
`commandExecution` 等原生工具项完成之后，在原始
`custom_tool_call_output` 完成之后，以及在工具后原始 assistant
进度、原始推理完成或推理进度之后。如果已配置，保护机制会使用
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`，
否则默认使用五分钟。同一个工具后预算也会延长进度看门狗，
覆盖 Codex 发出下一个当前轮次事件之前的静默合成窗口。推理完成、commentary
`agentMessage` 完成，以及工具前原始推理或 assistant 进度后面可能会接一个自动最终回复，
因此它们使用进度后回复保护，而不是立即释放会话通道。只有
最终/非 commentary 的已完成 `agentMessage` 项和工具前原始 assistant
完成会启用 assistant 输出释放：如果 Codex 随后静默且没有
`turn/completed`，OpenClaw 会尽力中断原生轮次并释放
会话通道。可安全重放的 stdio app-server 故障，包括没有 assistant、工具、活动项或
副作用证据的轮次完成空闲超时，会在一次新的 app-server 尝试中重试一次。不安全的
超时仍会弃用卡住的 app-server 客户端并释放 OpenClaw
会话通道。它们也会清除过时的原生线程绑定，而不是自动
重放。完成监视超时会显示 Codex 特定的超时文本：可安全重放的情况会说明响应可能不完整，
而不安全的情况会提示用户在重试前验证当前状态。公开的超时诊断
包含结构化字段，例如最后一个 app-server 通知方法、
原始 assistant 响应项 ID/类型/角色、活动请求/项计数，以及已启用的
监视状态。当最后一个通知是原始 assistant 响应项时，它们
还会包含一个有界的 assistant 文本预览。它们不会包含原始提示或
工具内容。

## 模型发现

默认情况下，Codex 插件会向 app-server 查询可用模型。模型
可用性由 Codex app-server 拥有，因此当 OpenClaw
升级内置的 `@openai/codex` 版本，或某个部署将
`appServer.command` 指向不同的 Codex 二进制文件时，列表可能会变化。可用性也可能按
账号限定。在运行中的 Gateway 网关上使用 `/codex models`，查看该 harness 和账号的实时目录。

如果发现失败或超时，OpenClaw 会使用内置的回退目录：

- GPT-5.5
- GPT-5.4 mini

当前内置 harness 是 `@openai/codex` `0.142.4`。在启用 GPT-5.6 的工作区中，
针对该内置 app-server 的一次 `model/list` 探测返回了这些
公开选择器行：

| 模型 ID               | 输入模态    | 推理强度                             |
| --------------------- | ----------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text        | low, medium, high, xhigh             |

在限量预览期间，GPT-5.6 访问权限按账号限定。`max` 是一种模型
推理强度。`ultra` 是单独的 Codex 多 Agent 编排元数据，
不是标准的 OpenAI 推理强度。

app-server 目录可能会为内部或专门流程返回隐藏模型，
但它们不是普通的模型选择器选项。

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

如果你希望启动时避免探测 Codex 且只使用
回退目录，请禁用发现：

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
不会写入合成的 Codex 项目文档文件，也不会依赖 Codex 回退
文件名来存放 persona 文件，因为 Codex 回退仅在
`AGENTS.md` 缺失时适用。

为了实现 OpenClaw 工作区一致性，Codex harness 会解析其他引导
文件。`SOUL.md`、`IDENTITY.md`、`TOOLS.md` 和 `USER.md` 会作为
OpenClaw Codex 开发者指令转发，因为它们定义了活动智能体、
可用工作区指导和用户资料。精简的 OpenClaw Skills
列表会作为轮次作用域的协作开发者指令转发。
`HEARTBEAT.md` 内容不会被注入；Heartbeat 轮次会获得一个协作模式
指针，在该文件存在且非空时读取它。当该工作区有可用的记忆工具时，
来自已配置 Agent 工作区的 `MEMORY.md` 内容不会粘贴到原生 Codex 轮次输入中；
当它存在时，harness 会向轮次作用域的协作开发者指令添加一个小型工作区记忆指针，
且当持久记忆相关时，Codex 应使用 `memory_search` 或 `memory_get`。
如果工具被禁用、记忆搜索不可用，或活动工作区不同于 Agent 记忆工作区，
`MEMORY.md` 会使用普通的有界轮次上下文路径。
存在 `BOOTSTRAP.md` 时，它会作为 OpenClaw 轮次输入参考
上下文转发。

## 环境变量覆盖

环境变量覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当未设置 `appServer.command` 时，`OPENCLAW_CODEX_APP_SERVER_BIN`
会绕过受管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或
为一次性本地测试使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，
更推荐使用配置，因为它会把插件行为和其余 Codex harness 设置保存在同一个已审查文件中。

## 相关

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
- [OpenAI provider](/zh-CN/providers/openai)
- [配置参考](/zh-CN/gateway/configuration-reference)
