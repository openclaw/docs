---
read_when:
    - 你需要 Codex harness 的每个配置字段
    - 你正在更改应用服务器的传输、身份验证、设备发现或超时行为
    - 你正在调试 Codex harness 启动、模型发现或环境隔离
summary: Codex harness 的配置、身份验证、设备发现和应用服务器参考
title: Codex harness reference
x-i18n:
    generated_at: "2026-07-12T14:35:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

此参考文档涵盖官方 `codex` 插件的详细配置。
有关设置和路由决策，请先参阅
[Codex harness](/zh-CN/plugins/codex-harness)。

## 插件配置界面

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

顶层字段：

| 字段                       | 默认值                   | 含义                                                                                                                                           |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已启用                   | Codex app-server `model/list` 的模型发现设置。                                                                                                  |
| `appServer`                | 托管式 stdio app-server  | 传输、命令、身份验证、审批、沙箱和超时设置。普通 harness 默认使用 Agent 范围的状态。                                                            |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 可将 OpenClaw 动态工具直接放入初始 Codex 工具上下文中。                                                                         |
| `codexDynamicToolsExclude` | `[]`                     | 要从 Codex app-server 轮次中省略的其他 OpenClaw 动态工具名称。                                                                                   |
| `codexPlugins`             | 已禁用                   | Native Codex plugins 应用支持，包括对已连接账户应用的选择启用访问权限。请参阅 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。             |
| `computerUse`              | 已禁用                   | Codex Computer Use 设置。请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)。                                                             |
| `supervision`              | 已禁用                   | 非归档原生会话目录、本地分支续接和智能体工具策略。请参阅 [Codex 监督](/plugins/codex-supervision)。                                              |

## 监督

监督功能会列出 Gateway 网关计算机和选择启用的已配对节点上的非归档 Codex 会话。请独立于 Agent harness 启用它：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

`supervision` 字段：

| 字段                  | 默认值                   | 含义                                                                                                                                                                                                                                      |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                  | 发布本地会话目录；在 Gateway 网关上，还会聚合选择启用的已配对节点目录，供 Codex Sessions 页面使用。                                                                                                                                         |
| `endpoints`           | 内置本地端点             | 为保留的 Codex 监督智能体和独立 MCP 工具提供的兼容性及高级端点目标。人工使用的目录和分支流程会忽略这些目标，改用从 `appServer` 解析出的监督 App Server。                                                                                     |
| `allowRawTranscripts` | `false`                  | 启用监督后，允许自主智能体或独立 MCP 读取记录，以及读取从记录派生的列表字段。仅元数据的 `codex_threads` 读取仍然可用。不控制经过身份验证的 Control UI 续接。                                                                                  |
| `allowWriteControls`  | `false`                  | 启用监督后，允许自主执行 `codex_threads` 的分叉、重命名、归档和取消归档变更，以及独立 MCP 的发送、Steer 和中断操作。不会绕过其他绑定、主机、状态或确认检查。                                                                                   |

端点条目接受以下字段：

| 字段           | 适用于        | 含义                                                               |
| -------------- | ------------- | ------------------------------------------------------------------ |
| `id`           | 全部          | 稳定的端点 ID。                                                    |
| `label`        | 全部          | 可选的显示标签。                                                   |
| `transport`    | 全部          | `"stdio-proxy"` 或 `"websocket"`。                                 |
| `command`      | `stdio-proxy` | 可选的 App Server 命令。                                           |
| `args`         | `stdio-proxy` | 可选的命令参数。                                                   |
| `cwd`          | `stdio-proxy` | 可选的子进程工作目录。                                             |
| `url`          | `websocket`   | 必需的 WebSocket 或受支持的本地套接字 URL。                         |
| `authTokenEnv` | `websocket`   | 可选的环境变量，其值用于对端点进行身份验证。                       |

**Codex Sessions** 页面使用插件的监督 App Server，并且仅显示非归档会话。如果没有显式的 `appServer` 连接设置，该连接会使用托管式用户主目录 stdio。已存储或空闲的本地行可以通过截至最后一个持久化终止源轮次的有限用户和助手历史记录，创建一个模型锁定的聊天。其私有绑定会让快照分叉、规范的 `appServer` 源分支、历史记录注入和后续轮次都保持在该连接上。首次规范启动使用分叉返回的模型与提供商组合。后续恢复会省略 OpenClaw 模型和提供商覆盖，使 Codex 恢复规范线程中持久化的组合；单独的原生更改可以更新该组合，但外层模型和回退链绝不会替换它。确认没有其他运行程序后，可以归档已存储和空闲的行，除非另一个活跃的 OpenClaw 绑定拥有该确切目标或其某个非归档派生后代。OpenClaw 会遵循 Codex 的后代分页，并在枚举错误、循环或安全限制耗尽时以封闭方式失败。确认仍会涵盖未知的原生客户端以及状态变更到归档之间的竞态。当受监督的模型锁定聊天保护原生绑定时，无法删除该聊天。活跃源无法创建分支或被归档，但仍可打开现有的受监督聊天。所有已配对节点的行都保持只读；节点传输尚未提供 harness 所需的流式生命周期。

仅设置 `appServer.homeScope: "user"` 只会更改托管式 harness 进程所使用的 Codex 主目录；它不会发布集群目录。启用监督不会更改 harness 默认值。相反，在没有显式 `appServer` 连接设置时，单独的监督连接默认使用托管式用户主目录 stdio。该连接会遵循显式设置。待处理和已提交的受监督绑定会在每一轮中保留该连接；如果监督被禁用或连接/生命周期发生漂移，则会以封闭方式失败，而不是回退到智能体主目录 harness。默认连接与原生 Codex 客户端共享已存储的会话，但不共享其进程本地活动状态。

旧版 `plugins.entries.codex-supervisor` 设置已停用。运行 `openclaw doctor --fix`，将旧条目、端点定义、策略标志以及插件允许/拒绝引用迁移到此配置块中。发生冲突时，以显式的规范 `codex.config.supervision` 值为准。

## App-server 传输

对于普通 harness 轮次，OpenClaw 会启动官方插件附带的托管式 Codex 二进制文件（目前为 `@openai/codex` `0.144.1`）：

```bash
codex app-server --listen stdio://
```

这样会使 app-server 版本与官方 `codex` 插件保持一致，而不是取决于本地恰好安装的其他 Codex CLI。仅当你有意使用其他可执行文件时，才设置 `appServer.command`。使用默认隔离式 Agent 主目录的普通托管轮次，即使安装了 macOS 桌面应用包，也会优先使用此固定版本的软件包。启用[计算机使用](/zh-CN/plugins/codex-computer-use)时，或者当 `homeScope` 为 `"user"` 且能够加载原生 Computer Use 状态时，托管式启动会改为优先使用拥有所需 macOS 权限的桌面应用二进制文件。当隔离式 Agent 主目录的有效 Codex 配置启用原生 Computer Use 时，也适用相同的桌面优先规则。如果未安装桌面应用包，OpenClaw 会回退到固定版本的软件包二进制文件。

可执行文件交接和原生配置隔离会协调同一个正在运行的 Gateway 网关进程内的客户端。如果另一个进程更改了原生 Codex 插件配置，请重启 Gateway 网关。

监督会解析单独的连接。如果没有显式的 `appServer` 连接设置，它将使用 `homeScope: "user"` 的托管式 stdio；普通 harness 则保持使用 `homeScope: "agent"` 的托管式 stdio。两条路径都会遵循显式连接设置。如果普通 harness 应与原生客户端共享 `$CODEX_HOME`（或 `~/.codex`），请显式设置 `homeScope: "user"`。无论普通 harness 的默认值如何，私有的受监督绑定都会使用监督连接。独立的 App Server 进程会保留各自的实时状态和审批状态。

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

`appServer` 字段：

| 字段                                          | 默认值                                                 | 含义                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` 会启动 Codex；显式设置 `"unix"` 会连接到本地控制套接字；`"websocket"` 会连接到 `url`。                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` 按 OpenClaw 智能体隔离常规 harness 状态。`"user"` 是显式选择启用的设置，它会共享原生 `$CODEX_HOME` 或 `~/.codex`、使用原生身份验证，并启用仅所有者可用的线程管理。用户作用域支持本地 stdio 或 Unix 传输。对于单独的监管连接，未设置的值在 stdio 或 Unix 下解析为 `"user"`，在 WebSocket 下解析为 `"agent"`。     |
| `command`                                     | 托管的 Codex 二进制文件                                | stdio 传输使用的可执行文件。保持未设置以使用托管的二进制文件。                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输使用的参数。                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 未设置                                                 | WebSocket App Server URL 或 `unix://` URL。显式设置为空的 Unix 路径会选择规范的用户主目录控制套接字。                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 未设置                                                 | WebSocket 传输使用的 Bearer 令牌。接受字面量字符串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 额外的 WebSocket 标头。标头值接受字面量字符串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | 在 OpenClaw 构建继承的环境后，从已启动的 stdio app-server 进程中移除的额外环境变量名称。                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 未设置                                                 | 远程 Codex app-server 工作区根目录。设置后，OpenClaw 会根据解析后的 OpenClaw 工作区推断本地工作区根目录，在此远程根目录下保留当前 cwd 后缀，并仅将最终的 app-server cwd 发送给 Codex。如果 cwd 位于解析后的 OpenClaw 工作区根目录之外，OpenClaw 将以失败关闭方式处理，而不会向远程 app-server 发送 Gateway 网关本地路径。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server 控制平面调用的超时时间。                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex 接受轮次后，或执行轮次作用域的 app-server 请求后，OpenClaw 等待 `turn/completed` 时使用的静默时间窗口。                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw 等待 `turn/completed` 时，在工具移交、原生工具完成、工具后原始助手进度、原始推理完成或推理进度之后使用的完成空闲和进度保护机制。对于可信或繁重的工作负载，如果工具后综合处理可以合理地保持静默，且静默时间超过最终助手发布预算，请使用此设置。                                |
| `mode`                                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO               | YOLO 或经 guardian 审核执行的预设。                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` 或允许的 guardian 审批策略                   | 在线程启动、恢复和轮次时发送的原生 Codex 审批策略。                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 或允许的 guardian 沙箱          | 在线程启动和恢复时发送的原生 Codex 沙箱模式。活跃的 OpenClaw 沙箱会将 `danger-full-access` 轮次收窄为 Codex `workspace-write`；轮次网络标志遵循 OpenClaw 沙箱的出站策略。                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` 或允许的 guardian 审核者                      | 在允许的情况下，使用 `"auto_review"` 让 Codex 审核原生审批提示。                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | 当前进程目录                                           | 省略 `--cwd` 时，`/codex bind` 使用的工作区。                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | 未设置                                                 | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求 flex 处理，`null` 清除覆盖设置。旧版 `"fast"` 会按 `"priority"` 接受。                                                                                                                                                                                                 |
| `networkProxy`                                | 已禁用                                                 | 选择启用 Codex 权限配置文件网络功能，以供 app-server 命令使用。OpenClaw 定义选定的 `permissions.<profile>.network` 配置，并通过 `default_permissions` 选择它，而不是发送 `sandbox`。                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 预览版选择启用项：在受支持的 Codex app-server 中注册由 OpenClaw 沙箱支持的 Codex 环境，使原生 Codex 执行可以在活跃的 OpenClaw 沙箱内运行。                                                                                                                                                                                                            |

`appServer.networkProxy` 采用显式配置，因为它会更改 Codex 沙箱
契约。启用后，OpenClaw 还会在 Codex 线程配置中设置 `features.network_proxy.enabled` 和
`default_permissions`，以便生成的权限
配置文件可以启动由 Codex 管理的网络功能。默认情况下，OpenClaw 会根据
配置文件主体生成抗冲突的 `openclaw-network-<fingerprint>` 配置文件名称；仅当
需要稳定的本地名称时才使用 `profileName`。

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

如果正常的 app-server 运行时原本为 `danger-full-access`，启用
`networkProxy` 后，生成的权限配置文件将改用工作区风格的文件系统访问权限。
Codex 管理的网络强制机制属于沙箱网络，因此完全访问权限配置文件无法保护出站流量。

该插件会阻止旧版或未报告版本的 app-server 握手：Codex app-server
必须报告稳定版 `0.143.0` 或更高版本。

OpenClaw 将非回环 WebSocket app-server URL 视为远程地址，并要求通过
`appServer.authToken` 或 `Authorization` 标头提供携带身份信息的 WebSocket
身份验证。`appServer.authToken` 和每个 `appServer.headers.*` 值都可以是
SecretInput；在 OpenClaw 构建 app-server 启动选项之前，密钥运行时会解析
SecretRef 和环境变量简写，未解析的结构化 SecretRef 会在发送任何令牌或标头前导致失败。
配置 Native Codex plugins 后，OpenClaw 会使用已连接 app-server 的插件控制平面
安装或刷新这些插件，然后刷新应用清单，以便 Codex 线程能够看到插件拥有的应用。
`app/list` 仍是权威的清单和元数据来源，但对于列出的可访问应用，即使 Codex
当前将其标记为已禁用，OpenClaw 策略也会决定 `thread/start` 是否发送
`config.apps[appId].enabled = true`。未知或缺失的应用 ID 仍会按失败关闭处理；
此路径只会通过 `plugin/install` 激活市场插件并刷新清单。仅将 OpenClaw
连接到你信任的远程 app-server，确保它们可以接受由 OpenClaw 管理的插件安装
和应用清单刷新。

## 审批和沙箱模式

本地 stdio app-server 会话默认使用 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。这种受信任的本地操作员模式允许无人值守的
OpenClaw 轮次和 Heartbeat 持续推进，而不会出现无人应答的原生审批提示。

如果 Codex 的本地系统要求文件不允许隐式使用 YOLO 审批、审核者或沙箱值，
OpenClaw 会改为将隐式默认值视为 guardian，并选择允许的 guardian 权限。
`tools.exec.mode: "auto"` 也会强制使用由 guardian 审核的 Codex 审批，
且不会保留不安全的旧版 `approvalPolicy: "never"` 或
`sandbox: "danger-full-access"` 覆盖；若要有意采用无需审批的模式，请设置
`tools.exec.mode: "full"`。同一要求文件中与主机名匹配的
`[[remote_sandbox_config]]` 条目会参与沙箱默认值的决策。

设置 `appServer.mode: "guardian"` 以使用由 Codex guardian 审核的审批：

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

如果这些值均被允许，`guardian` 预设会展开为 `approvalPolicy: "on-request"`、
`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。
各个策略字段会覆盖 `mode`。旧版 `guardian_subagent` 审核者值仍可作为兼容别名使用，
但新配置应使用 `auto_review`。

当 OpenClaw 沙箱处于活动状态时，本地 Codex app-server 进程仍在 Gateway 网关主机上运行。
因此，OpenClaw 会为该轮次禁用 Codex 原生代码模式、用户 MCP 服务器和由应用支持的插件执行，
而不会将 Codex 主机侧沙箱隔离视为等同于 OpenClaw 沙箱后端。当常规 exec/process
工具可用时，Shell 访问会通过由 OpenClaw 沙箱支持的动态工具公开，例如
`sandbox_exec` 和 `sandbox_process`。

<Note>
在由 Docker 支持的 OpenClaw 沙箱主机上（`agents.defaults.sandbox.mode` 设置为
Docker 后端），`openclaw doctor` 会探测主机是否允许非特权用户命名空间；如果
Docker 沙箱禁用了网络出口，还会探测网络命名空间。这些命名空间是嵌套 Codex
`bwrap` 在沙箱容器内执行 `workspace-write` Shell 操作所必需的。探测失败通常会在
Ubuntu/AppArmor 主机上表现为 `bwrap: setting up uid map: Permission denied`
或 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。
请为 OpenClaw 服务用户修复报告的主机命名空间策略并重启 Gateway 网关；优先为服务进程
使用限定范围的 AppArmor 配置文件，而不是采用主机全局的
`kernel.apparmor_restrict_unprivileged_userns=0` 回退方案，并且不要仅为满足嵌套
`bwrap` 的要求而授予 Docker 容器更广泛的权限。
</Note>

## 沙箱隔离的原生执行

稳定默认行为是失败关闭：OpenClaw 沙箱隔离处于活动状态时，会禁用原本会从 Codex
app-server 主机运行的原生 Codex 执行界面。仅当你想使用 OpenClaw 沙箱后端试用 Codex
的远程环境支持时，才使用 `appServer.experimental.sandboxExecServer: true`。
此预览路径适用于所有受支持的 Codex app-server 版本。

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

启用该标志且当前 OpenClaw 会话已进行沙箱隔离时，OpenClaw 会启动一个由活动沙箱支持的
local loopback exec-server，将其注册到 Codex app-server，并使用该 OpenClaw
拥有的环境启动 Codex 线程和轮次。如果 app-server 无法注册该环境，运行将按失败关闭处理，
而不会静默回退到主机执行。

此预览路径仅限本地使用。远程 WebSocket app-server 无法访问回环 exec-server，
除非二者运行在同一主机上，因此 OpenClaw 会拒绝这种组合。

## 身份验证和环境隔离

在默认的按智能体划分的主目录中，身份验证按以下顺序选择：

1. 为该智能体显式配置的 OpenClaw Codex 身份验证配置文件。
2. app-server 在该智能体 Codex 主目录中的现有账户。
3. 仅对于本地 stdio app-server 启动：当不存在 app-server 账户且仍需要 OpenAI
   身份验证时，先使用 `CODEX_API_KEY`，再使用 `OPENAI_API_KEY`。

当 OpenClaw 发现 ChatGPT 订阅风格的 Codex 身份验证配置文件（OAuth 或令牌凭据类型）时，
它会从生成的 Codex 子进程中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这样，
Gateway 网关级 API 密钥仍可用于嵌入或直接 OpenAI 模型，同时避免原生 Codex app-server
轮次意外通过 API 计费。

显式 Codex API 密钥配置文件和本地 stdio 环境密钥回退使用 app-server 登录，
而不是继承子进程环境。WebSocket app-server 连接不会接收 Gateway 网关环境中的 API
密钥回退；请使用显式身份验证配置文件或远程 app-server 自己的账户。

默认情况下，stdio app-server 启动会继承 OpenClaw 的进程环境。OpenClaw 管理 Codex
app-server 账户桥接，并将 `CODEX_HOME` 设置为该智能体 OpenClaw 状态目录下按智能体划分的目录。
这样，Codex 配置、账户、插件缓存/数据和线程状态都限定在 OpenClaw 智能体范围内，
而不会从操作员个人的 `~/.codex` 主目录泄漏进来。

设置 `appServer.homeScope: "user"`，可与 Codex Desktop 和 CLI 共享原生 Codex 状态。
这种本地用户主目录模式支持托管的 stdio 和显式 Unix 传输。设置了 `$CODEX_HOME` 时使用它，
否则使用 `~/.codex`，其中包括原生身份验证、配置、插件和线程。OpenClaw 会跳过其面向
app-server 的身份验证配置文件桥接。经过验证的所有者轮次可以使用 `codex_threads`
列出（可选使用 `search` 筛选器）、读取、派生、重命名、归档和取消归档这些线程。
在 OpenClaw 中继续线程之前，请先派生该线程；独立的 Codex 进程不会协调对同一线程的并发写入者。

该 `homeScope` 选择加入项适用于常规 harness 会话。通过 Codex 会话创建的 Chat
会改用其私有监督连接，该连接会为规范分支和后续恢复保留原生连接的身份验证和提供商配置。

在模型锁定的受监督 Chat 中，`codex_threads` 无法附加其他派生线程，也无法归档该 Chat
绑定的原生线程。列表和仅元数据读取仍然可用。读取原始会话记录需要启用
`allowRawTranscripts`；禁用时，列表搜索也会被拒绝，因为原生搜索可能匹配会话记录预览。
对不属于其他 OpenClaw Chat 的无关线程执行重命名、取消归档、分离式派生和归档，
需要启用 `allowWriteControls`。这两个选项都无法绕过锁定的绑定关系。

OpenClaw 不会为常规本地 app-server 启动重写 `HOME`。由 Codex 运行的子进程（例如
`openclaw`、`gh`、`git`、云 CLI 和 Shell 命令）会看到正常的进程主目录，并可找到
用户主目录中的配置和令牌。Codex 还可能发现 `$HOME/.agents/skills` 和
`$HOME/.agents/plugins/marketplace.json`；这种 `.agents` 发现机制会有意与操作员主目录共享，
并与隔离的 `~/.codex` 状态相互独立。

在默认智能体范围内，OpenClaw 插件和 OpenClaw Skills 快照仍通过 OpenClaw 自己的插件注册表
和 Skills 加载器流转；个人 Codex `~/.codex` 资产则不会。如果 Codex 主目录中有实用的
Codex CLI Skills 或插件，希望将其纳入隔离的 OpenClaw 智能体，请显式清点它们：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` 只影响生成的 Codex app-server 子进程。OpenClaw 会在本地启动规范化期间
从此列表中移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 会继续指向所选的智能体或用户范围，
而 `HOME` 会继续继承，以便子进程使用正常的用户主目录状态。

## 动态工具

Codex 动态工具默认使用 `searchable` 加载，并在 `openclaw` 命名空间下公开，
同时设置 `deferLoading: true`。OpenClaw 不会公开与 Codex 原生工作区操作或 Codex
自己的工具搜索界面重复的动态工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

其余大多数 OpenClaw 集成工具（例如消息传递、媒体、cron、浏览器、节点、Gateway 网关、
`heartbeat_respond` 和 `web_search`）均可通过该命名空间下的 Codex 工具搜索使用。
这样可以缩小初始模型上下文。无论 `codexDynamicToolsLoading` 如何设置，少量工具始终可直接调用，
因为 Codex 工具搜索可能不可用，或只能解析出仅含连接器的工具范围：`agents_list`、
`sessions_spawn` 和 `sessions_yield`。开发者指令仍会引导常规 Codex 子智能体使用原生
`spawn_agent` 处理 Codex 原生子智能体工作，而 `sessions_spawn` 仍可用于显式的 OpenClaw
或 ACP 委派。仅使用消息工具的来源回复也仍保持直接调用，因为这属于轮次控制契约。

标记为 `catalogMode: "direct-only"` 的工具（包括 OpenClaw `computer` 工具）会归入
`openclaw_direct`。OpenClaw 会将该命名空间添加到 Codex 的
`code_mode.direct_only_tool_namespaces` 列表中，而不会替换操作员提供的条目。因此，
Codex 会在普通线程和仅代码模式线程中将这些工具公开为 `DirectModelOnly`，而不是通过嵌套的
代码模式 `tools.*` 调用对其进行路由。此边界对于包含图像的结果是必需的：嵌套代码模式序列化
会将图像输出扁平化为文本，从而丢弃下一步计算机操作所需的屏幕截图。

仅当连接到无法搜索延迟动态工具的自定义 Codex app-server，或调试完整工具负载时，
才设置 `codexDynamicToolsLoading: "direct"`。

## 超时

OpenClaw 自有的动态工具调用具有独立于
`appServer.requestTimeoutMs` 的时间限制。每个 Codex `item/tool/call` 请求按以下顺序使用
第一个可用的超时时间：

- 每次调用传入的正数 `timeoutMs` 参数。
- 对于 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 对于未配置超时时间的 `image_generate`，使用 120 秒的
  图像生成默认值。
- 对于媒体理解 `image` 工具，使用 `tools.media.image.timeoutSeconds`
  转换后的毫秒数，或 60 秒的媒体默认值。对于图像
  理解，此超时时间应用于请求本身，不会因之前的准备工作
  而缩短。
- 对于 `message` 工具，使用固定的 120 秒默认值。
- 90 秒的动态工具默认值。

此看门狗是动态 `item/tool/call` 的外层时间预算。提供商特定的
请求超时在该调用内部运行，并保留各自的超时语义。
动态工具预算上限为 600000 ms。发生超时时，OpenClaw 会在支持的情况下中止
工具信号，并向 Codex 返回失败的动态工具响应，
使当前轮次可以继续，而不是让会话停留在
`processing` 状态。

Codex 接受轮次后，以及 OpenClaw 响应轮次范围内的
app-server 请求后，harness 会等待 Codex 推进当前轮次，
并最终通过 `turn/completed` 完成本机轮次。如果
app-server 在 `appServer.turnCompletionIdleTimeoutMs` 时长内没有动静，OpenClaw
会尽力中断 Codex 轮次，记录诊断超时，并
释放 OpenClaw 会话通道，以免后续聊天消息排在
陈旧的本机轮次之后。

同一轮次的大多数非终止通知都会解除这个短时看门狗，
因为 Codex 已证明该轮次仍处于活动状态。工具交接使用更长的
工具后空闲预算：在 OpenClaw 返回 `item/tool/call` 响应后，
在 `commandExecution` 等本机工具项目完成后，在原始
`custom_tool_call_output` 完成后，以及在工具后的原始助手
进度、原始推理完成或推理进度之后。若已配置，
该守卫使用 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`，
否则默认为五分钟。这一工具后预算还会延长
进度看门狗，以覆盖 Codex 发出下一个当前轮次事件前的静默综合窗口。
推理完成、commentary `agentMessage`
完成，以及工具前的原始推理或助手进度之后都可能出现
自动最终回复，因此它们使用进度后回复守卫，
而不是立即释放会话通道。只有最终的非 commentary
已完成 `agentMessage` 项目和工具前的原始助手完成才会启用
助手输出释放机制：如果 Codex 随后保持静默且未发出 `turn/completed`，
OpenClaw 会尽力中断本机轮次并释放会话
通道。可安全重放的 stdio app-server 故障，包括没有助手、
工具、活动项目或副作用证据的轮次完成空闲
超时，会通过全新的 app-server 尝试重试一次。不安全的超时仍会停用
卡住的 app-server 客户端并释放 OpenClaw 会话通道。它们还会
清除陈旧的本机线程绑定，而不会自动
重放。完成监视超时会显示 Codex 特定的超时文本：
可安全重放的情况会提示响应可能不完整，而不安全的情况会要求
用户在重试前验证当前状态。公开超时诊断
包含结构化字段，例如最后一个 app-server 通知方法、
原始助手响应项目的 id/type/role、活动请求/项目数量以及
已启用的监视状态。当最后一个通知是原始助手响应
项目时，还会包含长度受限的助手文本预览。其中不会
包含原始提示词或工具内容。

## 模型发现

默认情况下，Codex plugin 会向 app-server 查询可用模型。模型
可用性由 Codex app-server 管理，因此当
OpenClaw 升级内置的 `@openai/codex` 版本，或部署将
`appServer.command` 指向其他 Codex 二进制文件时，列表可能发生变化。可用性也可能
因账户而异。在运行中的 Gateway 网关上使用 `/codex models`，可查看该 harness 和账户的实时
目录。

如果发现失败或超时，OpenClaw 会使用内置的后备目录：

| 模型 id        | 显示名称     | 推理强度                 |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
当前内置 harness 为 `@openai/codex` `0.144.1`。针对该内置 app-server 的
`model/list` 探测返回了以下公开选择器行：

| 模型 id         | 输入模态    | 推理强度                             |
| --------------- | ----------- | ------------------------------------ |
| `gpt-5.6-sol`   | 文本、图像  | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | 文本、图像  | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | 文本、图像  | low, medium, high, xhigh, max        |
| `gpt-5.5`       | 文本、图像  | low, medium, high, xhigh             |
| `gpt-5.4`       | 文本、图像  | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | 文本、图像  | low, medium, high, xhigh             |
| `gpt-5.2`       | 文本、图像  | low, medium, high, xhigh             |

app-server 目录可以报告 `ultra`；OpenClaw 推理控制目前
最高提供到 `max` 级别。

实时选择器行因账户而异，并可能随账户、Codex
目录或内置版本发生变化；请运行 `/codex models` 获取当前列表，
而不要依赖任何特定时间点的表格。隐藏模型也可能出现在
app-server 目录中，用于内部或专用流程，而不是作为常规模型选择器选项。
</Note>

在 `plugins.entries.codex.config.discovery` 下调整发现设置：

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

如果希望启动时避免探测 Codex，并且仅使用
后备目录，请禁用发现：

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

Codex 通过原生项目文档发现机制自行处理 `AGENTS.md`。
OpenClaw 不会写入合成的 Codex 项目文档文件，也不依赖 Codex
用于角色文件的后备文件名，因为 Codex 后备机制仅在
缺少 `AGENTS.md` 时适用。

为了与 OpenClaw 工作区保持一致，Codex harness 会将其他
引导文件作为开发者指令转发，但处理方式并不完全相同：

- `TOOLS.md` 作为 Codex **继承的**开发者指令转发，因此
  轮次期间生成的原生 Codex 子智能体也能看到它。
- `SOUL.md`、`IDENTITY.md` 和 `USER.md` 作为**轮次范围内的**
  协作指令转发。原生 Codex 子智能体不会继承它们，
  从而避免子智能体轮次沿用父智能体的角色和
  用户资料。
- 已加载的精简 OpenClaw Skills 列表也作为轮次范围内的
  协作开发者指令转发，因此原生 Codex 子智能体同样不会
  继承它。
- 不会注入 `HEARTBEAT.md` 内容；当该文件存在且
  非空时，heartbeat 轮次会收到协作模式指针，以便读取该文件。
- 当为配置的智能体工作区提供记忆工具时，该工作区中的 `MEMORY.md`
  内容不会粘贴到原生 Codex 轮次输入中；该文件存在时，
  harness 会向轮次范围内的协作开发者指令添加一个简短的工作区记忆
  指针，而 Codex 应在持久记忆相关时使用 `memory_search` 或
  `memory_get`。如果工具被禁用、记忆搜索不可用，或活动
  工作区与智能体记忆工作区不同，`MEMORY.md` 会改用
  正常的受限轮次上下文路径。
- `BOOTSTRAP.md` 存在时，会作为 OpenClaw 轮次输入参考
  上下文转发。

## 环境变量覆盖

环境变量覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当未设置 `appServer.command` 时，`OPENCLAW_CODEX_APP_SERVER_BIN`
会绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在
一次性本地测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复的部署，
优先使用配置，因为它能让插件行为与 Codex harness 的其余设置
保存在同一个经过审查的文件中。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Codex 监督](/plugins/codex-supervision)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
- [OpenAI provider](/zh-CN/providers/openai)
- [配置参考](/zh-CN/gateway/configuration-reference)
