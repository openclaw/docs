---
read_when:
    - 你需要 Codex harness 的每个配置字段
    - 你正在更改 app-server 的传输、身份验证、设备发现或超时行为
    - 你正在调试 Codex harness 启动、模型发现或环境隔离
summary: Codex harness 的配置、身份验证、设备发现和应用服务器参考
title: Codex harness reference
x-i18n:
    generated_at: "2026-07-11T20:42:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

本参考文档介绍官方 `codex` 插件的详细配置。
有关设置和路由决策，请先阅读
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

| 字段                       | 默认值                         | 含义                                                                                                                                                  |
| -------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已启用                         | Codex app-server `model/list` 的模型发现设置。                                                                                                        |
| `appServer`                | 托管的 stdio app-server        | 传输、命令、身份验证、审批、沙箱和超时设置。普通 harness 默认使用 Agent 范围的状态。                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`                 | 使用 `"direct"` 可将 OpenClaw 动态工具直接放入初始 Codex 工具上下文中。                                                                               |
| `codexDynamicToolsExclude` | `[]`                           | 在 Codex app-server 轮次中额外排除的 OpenClaw 动态工具名称。                                                                                          |
| `codexPlugins`             | 已禁用                         | Native Codex plugins/app 支持，包括选择启用对已连接账户应用的访问。请参阅 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。                      |
| `computerUse`              | 已禁用                         | Codex Computer Use 设置。请参阅 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)。                                                                   |
| `supervision`              | 已禁用                         | 未归档的原生会话目录、本地分支续接和智能体工具策略。请参阅 [Codex 监督](/plugins/codex-supervision)。                                                  |

## 监督

监督功能会列出 Gateway 网关计算机和已选择加入的配对节点上的未归档 Codex 会话。请将其与 Agent harness 分开启用：

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

| 字段                  | 默认值                   | 含义                                                                                                                                                                                                                                              |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                  | 发布本地会话目录，并在 Gateway 网关上聚合已选择加入的配对节点目录，以供 Codex 会话页面使用。                                                                                                                                                      |
| `endpoints`           | 内置本地端点             | 为保留的 Codex 监督智能体和独立 MCP 工具提供兼容性及高级端点目标。人工使用的目录和分支流程会忽略这些目标，改用从 `appServer` 解析出的监督 App Server。                                                                                              |
| `allowRawTranscripts` | `false`                  | 启用监督后，允许自主智能体或独立 MCP 读取转录记录及从转录记录派生的列表字段。仅元数据的 `codex_threads` 读取仍然可用。不控制已经过身份验证的 Control UI 续接。                                                                                     |
| `allowWriteControls`  | `false`                  | 启用监督后，允许自主执行 `codex_threads` 的分叉、重命名、归档和取消归档变更，以及独立 MCP 的发送、Steer 和中断操作。不会绕过其他绑定、主机、状态或确认检查。                                                                                        |

端点条目接受以下字段：

| 字段           | 适用范围      | 含义                                                               |
| -------------- | ------------- | ------------------------------------------------------------------ |
| `id`           | 全部          | 稳定的端点 ID。                                                    |
| `label`        | 全部          | 可选的显示标签。                                                   |
| `transport`    | 全部          | `"stdio-proxy"` 或 `"websocket"`。                                 |
| `command`      | `stdio-proxy` | 可选的 App Server 命令。                                           |
| `args`         | `stdio-proxy` | 可选的命令参数。                                                   |
| `cwd`          | `stdio-proxy` | 可选的子进程工作目录。                                             |
| `url`          | `websocket`   | 必需的 WebSocket 或受支持的本地套接字 URL。                         |
| `authTokenEnv` | `websocket`   | 可选的环境变量，其值用于验证端点身份。                             |

**Codex 会话**页面使用插件的监督 App Server，并且仅显示未归档的会话。如果未显式设置 `appServer` 连接，该连接将通过托管的用户主目录 stdio 提供。已存储或空闲的本地记录可以创建模型锁定的聊天，其中包含截至最后一个已持久化终止源轮次的有限用户和助手历史记录。其私有绑定会确保快照分叉、规范的 `appServer` 源分支、历史注入和后续轮次都保留在该连接上。首次规范启动使用分叉返回的模型与提供商组合。后续恢复会省略 OpenClaw 模型和提供商覆盖，使 Codex 恢复规范线程中持久化的组合；单独的原生更改可以更新该组合，但外层模型和回退链绝不会替换它。确认没有其他运行器后，可以归档已存储和空闲的记录，除非另一个活跃的 OpenClaw 绑定拥有完全相同的目标，或拥有其未归档的衍生后代之一。OpenClaw 会遵循 Codex 的后代分页机制，并在枚举错误、循环或耗尽安全限制时以关闭方式失败。确认仍会涵盖未知的原生客户端以及从状态检查到归档之间的竞态条件。受监督且模型锁定的聊天在保护原生绑定期间无法删除。活跃源无法创建分支或被归档，但仍可打开已有的受监督聊天。所有配对节点记录均保持只读；节点传输目前尚未提供 harness 所需的流式生命周期。

仅设置 `appServer.homeScope: "user"` 只会更改托管 harness 进程使用的 Codex 主目录；它不会发布设备群目录。启用监督不会更改 harness 默认值。相反，如果不存在显式 `appServer` 连接设置，独立的监督连接默认使用托管的用户主目录 stdio。该连接会遵循显式设置。待处理和已提交的受监督绑定会在每个轮次中保留该连接；如果监督被禁用，或连接/生命周期发生漂移，则会以关闭方式失败，而不会回退到 Agent 主目录 harness。默认连接与原生 Codex 客户端共享已存储会话，但不共享其进程本地活动状态。

旧版 `plugins.entries.codex-supervisor` 设置已停用。运行 `openclaw doctor --fix`，将旧条目、端点定义、策略标志以及插件允许/拒绝引用迁移到此配置块中。发生冲突时，以显式的规范 `codex.config.supervision` 值为准。

## App-server 传输

对于普通 harness 轮次，OpenClaw 会启动官方插件附带的托管 Codex 二进制文件（当前为 `@openai/codex` `0.144.1`）：

```bash
codex app-server --listen stdio://
```

这样可以使 app-server 版本与官方 `codex` 插件保持一致，而不是取决于本地恰好安装的其他 Codex CLI。仅当你有意使用其他可执行文件时，才设置 `appServer.command`。使用默认隔离 Agent 主目录的普通托管轮次会优先使用此固定版本的软件包，即使已安装 macOS 桌面应用包也是如此。启用[计算机使用](/zh-CN/plugins/codex-computer-use)后，或者当 `homeScope` 为 `"user"` 且可以加载原生计算机使用状态时，托管启动会改为优先使用拥有所需 macOS 权限的桌面应用二进制文件。当隔离 Agent 主目录的有效 Codex 配置启用原生计算机使用时，同样适用桌面应用优先规则。如果未安装桌面应用包，OpenClaw 会回退到固定版本的软件包二进制文件。

可执行文件交接和原生配置隔离会协调同一运行中 Gateway 网关进程内的客户端。其他进程更改原生 Codex 插件配置后，请重启 Gateway 网关。

监督功能会解析一个独立连接。如果未显式设置 `appServer` 连接，它将使用 `homeScope: "user"` 的托管 stdio；普通 harness 则继续使用 `homeScope: "agent"` 的托管 stdio。两条路径都会遵循显式连接设置。当普通 harness 应与原生客户端共享 `$CODEX_HOME`（或 `~/.codex`）时，请显式设置 `homeScope: "user"`。无论普通 harness 的默认值是什么，私有受监督绑定都会使用监督连接。相互独立的 App Server 进程会分别保留各自的实时状态和审批状态。

对于已在运行的 app-server，请使用 WebSocket 传输：

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

| 字段                                          | 默认值                                                       | 含义                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                                    | `"stdio"` 会启动 Codex；显式指定 `"unix"` 会连接本地控制套接字；`"websocket"` 会连接到 `url`。                                                                                                                                                                                                                                                                                                                           |
| `homeScope`                                   | `"agent"`                                                    | `"agent"` 会按 OpenClaw 智能体隔离常规 harness 状态。`"user"` 是一种显式启用选项，它共享原生 `$CODEX_HOME` 或 `~/.codex`，使用原生身份验证，并启用仅所有者可用的线程管理。用户作用域支持本地 stdio 或 Unix 传输。对于单独的监管连接，未设置的值在 stdio 或 Unix 下解析为 `"user"`，在 WebSocket 下解析为 `"agent"`。                                                                                                    |
| `command`                                     | 托管的 Codex 二进制文件                                     | 用于 stdio 传输的可执行文件。保持未设置即可使用托管的二进制文件。                                                                                                                                                                                                                                                                                                                                                       |
| `args`                                        | `["app-server", "--listen", "stdio://"]`                     | 用于 stdio 传输的参数。                                                                                                                                                                                                                                                                                                                                                                                                 |
| `url`                                         | 未设置                                                       | WebSocket 应用服务器 URL 或 `unix://` URL。显式指定空的 Unix 路径会选择规范的用户主目录控制套接字。                                                                                                                                                                                                                                                                                                                      |
| `authToken`                                   | 未设置                                                       | WebSocket 传输使用的持有者令牌。接受字面字符串或 SecretInput，例如 `${CODEX_APP_SERVER_TOKEN}`。                                                                                                                                                                                                                                                                                                                        |
| `headers`                                     | `{}`                                                         | 额外的 WebSocket 标头。标头值接受字面字符串或 SecretInput 值，例如 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                                                                     |
| `clearEnv`                                    | `[]`                                                         | OpenClaw 构建继承的环境后，要从启动的 stdio 应用服务器进程中移除的额外环境变量名称。                                                                                                                                                                                                                                                                                                                                    |
| `remoteWorkspaceRoot`                         | 未设置                                                       | 远程 Codex 应用服务器工作区根目录。设置后，OpenClaw 会根据解析出的 OpenClaw 工作区推断本地工作区根目录，在该远程根目录下保留当前工作目录的后缀，并且仅将最终的应用服务器工作目录发送给 Codex。如果当前工作目录位于解析出的 OpenClaw 工作区根目录之外，OpenClaw 会拒绝继续，而不会将 Gateway 网关本地路径发送给远程应用服务器。                                                                                                  |
| `requestTimeoutMs`                            | `60000`                                                      | 应用服务器控制平面调用的超时时间。                                                                                                                                                                                                                                                                                                                                                                                      |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                      | Codex 接受轮次后，或执行轮次范围的应用服务器请求后，OpenClaw 等待 `turn/completed` 时使用的静默窗口。                                                                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                                     | OpenClaw 等待 `turn/completed` 时，在工具移交、原生工具完成、工具后原始助手进度、原始推理完成或推理进度之后使用的完成空闲超时和进度防护。对于可信或高负载工作负载，如果工具后综合过程可以合理地比最终助手发布预算保持更长时间的静默，请使用此项。                                                                                                                                                                             |
| `mode`                                        | `"yolo"`，除非本地 Codex 要求不允许 YOLO                     | YOLO 执行或经守护审核执行的预设。                                                                                                                                                                                                                                                                                                                                                                                       |
| `approvalPolicy`                              | `"never"` 或允许的守护审批策略                               | 在线程启动、恢复和轮次时发送给原生 Codex 的审批策略。                                                                                                                                                                                                                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` 或允许的守护沙箱                       | 在线程启动和恢复时发送给原生 Codex 的沙箱模式。启用中的 OpenClaw 沙箱会将 `danger-full-access` 轮次收窄为 Codex 的 `workspace-write`；轮次的网络标志遵循 OpenClaw 沙箱的出站网络设置。                                                                                                                                                                                                                                      |
| `approvalsReviewer`                           | `"user"` 或允许的守护审核者                                 | 在允许的情况下，使用 `"auto_review"` 让 Codex 审核原生审批提示。                                                                                                                                                                                                                                                                                                                                                        |
| `defaultWorkspaceDir`                         | 当前进程目录                                                 | 省略 `--cwd` 时，`/codex bind` 使用的工作区。                                                                                                                                                                                                                                                                                                                                                                           |
| `serviceTier`                                 | 未设置                                                       | 可选的 Codex 应用服务器服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求弹性处理，`null` 清除覆盖值。旧版 `"fast"` 会被视为 `"priority"`。                                                                                                                                                                                                                                                                            |
| `networkProxy`                                | 已禁用                                                       | 选择为应用服务器命令启用基于 Codex 权限配置文件的联网功能。OpenClaw 会定义所选的 `permissions.<profile>.network` 配置，并通过 `default_permissions` 选择该配置，而不是发送 `sandbox`。                                                                                                                                                                                                                                    |
| `experimental.sandboxExecServer`              | `false`                                                      | 预览版选择启用项：向受支持的 Codex 应用服务器注册由 OpenClaw 沙箱支持的 Codex 环境，使原生 Codex 执行能够在当前启用的 OpenClaw 沙箱内运行。                                                                                                                                                                                                                                                                               |

`appServer.networkProxy` 需要显式配置，因为它会改变 Codex 沙箱
契约。启用后，OpenClaw 还会在 Codex 线程配置中设置
`features.network_proxy.enabled` 和 `default_permissions`，以便生成的权限
配置文件能够启动由 Codex 管理的联网功能。默认情况下，OpenClaw 会根据
配置文件内容生成抗冲突的 `openclaw-network-<fingerprint>` 配置文件名称；
仅当需要稳定的本地名称时才使用 `profileName`。

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

如果正常的 app-server 运行时原本会使用 `danger-full-access`，启用 `networkProxy` 后，生成的权限配置文件将改用工作区式文件系统访问。Codex 管理的网络强制机制属于沙箱网络，因此完全访问权限配置文件无法保护出站流量。

该插件会阻止较旧或未报告版本的 app-server 握手：Codex app-server 必须报告稳定版本 `0.143.0` 或更高版本。

OpenClaw 将非回环 WebSocket app-server URL 视为远程地址，并要求通过 `appServer.authToken` 或 `Authorization` 标头进行携带身份信息的 WebSocket 身份验证。`appServer.authToken` 和每个 `appServer.headers.*` 值都可以是 SecretInput；在 OpenClaw 构建 app-server 启动选项之前，机密信息运行时会解析 SecretRef 和环境变量简写，未解析的结构化 SecretRef 会在发送任何令牌或标头前导致失败。配置 Native Codex plugins 后，OpenClaw 会使用已连接 app-server 的插件控制平面安装或刷新这些插件，随后刷新应用清单，使 Codex 线程能够看到插件拥有的应用。`app/list` 仍是权威的清单和元数据来源，但对于清单中可访问的应用，即使 Codex 当前将其标记为已禁用，是否由 `thread/start` 发送 `config.apps[appId].enabled = true` 仍由 OpenClaw 策略决定。未知或缺失的应用 ID 仍会以关闭方式失败；此路径只会通过 `plugin/install` 激活市场插件并刷新清单。仅将 OpenClaw 连接到你信任的远程 app-server，确保其可以接受由 OpenClaw 管理的插件安装和应用清单刷新。

## 审批和沙箱模式

本地 stdio app-server 会话默认使用 YOLO 模式：
`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和
`sandbox: "danger-full-access"`。这种受信任的本地操作员模式可让无人值守的 OpenClaw 轮次和 Heartbeat 持续推进，而不会出现无人响应的原生审批提示。

如果 Codex 的本地系统要求文件不允许隐式使用 YOLO 审批、审阅者或沙箱值，OpenClaw 会改为将隐式默认值视为 guardian，并选择允许的 guardian 权限。`tools.exec.mode: "auto"` 也会强制使用由 guardian 审阅的 Codex 审批，并且不会保留不安全的旧版 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"` 覆盖；若要有意采用无需审批的模式，请设置 `tools.exec.mode: "full"`。沙箱默认值的决策会遵循同一要求文件中与主机名匹配的 `[[remote_sandbox_config]]` 条目。

将 `appServer.mode: "guardian"` 设置为由 Codex guardian 审阅的审批模式：

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

如果这些值均被允许，`guardian` 预设会展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。各个策略字段会覆盖 `mode`。为兼容起见，仍接受较旧的 `guardian_subagent` 审阅者值作为别名，但新配置应使用 `auto_review`。

启用 OpenClaw 沙箱时，本地 Codex app-server 进程仍在 Gateway 网关主机上运行。因此，OpenClaw 会在该轮次中禁用 Codex 原生代码模式、用户 MCP 服务器和由应用支持的插件执行，而不会将 Codex 主机侧沙箱隔离视为等同于 OpenClaw 沙箱后端。当正常的 Exec/进程工具可用时，Shell 访问会通过由 OpenClaw 沙箱支持的动态工具（例如 `sandbox_exec` 和 `sandbox_process`）提供。

<Note>
在由 Docker 支持的 OpenClaw 沙箱主机上（`agents.defaults.sandbox.mode` 设置为 Docker 后端），`openclaw doctor` 会探测主机是否允许非特权用户命名空间，以及在禁用 Docker 沙箱网络出站时是否允许网络命名空间；嵌套的 Codex `bwrap` 需要这些命名空间，才能在沙箱容器内执行 `workspace-write` Shell 操作。探测失败通常会在 Ubuntu/AppArmor 主机上显示为 `bwrap: setting up uid map: Permission denied` 或 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。请为 OpenClaw 服务用户修复报告的主机命名空间策略并重启 Gateway 网关；应优先为服务进程配置限定范围的 AppArmor 配置文件，而不是使用主机范围的 `kernel.apparmor_restrict_unprivileged_userns=0` 回退方案，并且不要仅为满足嵌套 `bwrap` 的要求而授予 Docker 容器更宽泛的权限。
</Note>

## 沙箱隔离的原生执行

稳定的默认行为是以关闭方式失败：启用 OpenClaw 沙箱隔离后，会禁用原本从 Codex app-server 主机运行的原生 Codex 执行界面。只有当你希望使用 OpenClaw 沙箱后端试用 Codex 的远程环境支持时，才应设置 `appServer.experimental.sandboxExecServer: true`。此预览路径适用于所有受支持的 Codex app-server 版本。

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

启用该标志且当前 OpenClaw 会话已启用沙箱隔离时，OpenClaw 会启动一个由当前沙箱支持的 local loopback Exec 服务器，将其注册到 Codex app-server，并使用这个由 OpenClaw 所有的环境启动 Codex 线程和轮次。如果 app-server 无法注册该环境，运行将以关闭方式失败，而不会静默回退到主机执行。

此预览路径仅限本地使用。除非远程 WebSocket app-server 与 local loopback Exec 服务器在同一主机上运行，否则它无法访问该服务器，因此 OpenClaw 会拒绝这种组合。

## 身份验证和环境隔离

在默认的每 Agent 主目录中，身份验证按以下顺序选择：

1. 该 Agent 的显式 OpenClaw Codex 身份验证配置文件。
2. 该 Agent 的 Codex 主目录中 app-server 的现有账户。
3. 仅对于本地 stdio app-server 启动：当不存在 app-server 账户且仍需要 OpenAI 身份验证时，依次使用 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。

当 OpenClaw 发现 ChatGPT 订阅式 Codex 身份验证配置文件（OAuth 或令牌凭据类型）时，会从生成的 Codex 子进程中移除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这使 Gateway 网关级 API 密钥仍可用于嵌入或直接调用 OpenAI 模型，同时避免原生 Codex app-server 轮次意外通过 API 计费。

显式 Codex API 密钥配置文件和本地 stdio 环境密钥回退通过 app-server 登录，而不是使用继承的子进程环境。WebSocket app-server 连接不会接收 Gateway 网关环境中的 API 密钥回退；请使用显式身份验证配置文件或远程 app-server 自己的账户。

默认情况下，stdio app-server 启动会继承 OpenClaw 的进程环境。OpenClaw 拥有 Codex app-server 账户桥接，并将 `CODEX_HOME` 设置为该 Agent 的 OpenClaw 状态目录下的每 Agent 目录。这样，Codex 配置、账户、插件缓存/数据和线程状态都会限定在 OpenClaw Agent 内，而不会从操作员个人的 `~/.codex` 主目录泄漏进来。

设置 `appServer.homeScope: "user"` 可与 Codex Desktop 和 CLI 共享原生 Codex 状态。此本地用户主目录模式支持托管 stdio 和显式 Unix 传输。设置了 `$CODEX_HOME` 时会使用该目录，否则使用 `~/.codex`，其中包括原生身份验证、配置、插件和线程。OpenClaw 会跳过针对 app-server 的身份验证配置文件桥接。经过验证的所有者轮次可以使用 `codex_threads` 列出（可选使用 `search` 过滤器）、读取、复刻、重命名、归档和取消归档这些线程。在 OpenClaw 中继续线程之前，请先复刻该线程；独立 Codex 进程不会协调同一线程的并发写入者。

该 `homeScope` 选择加入项适用于普通 harness 会话。通过 Codex Sessions 创建的 Chat 则使用其私有监督连接，从而为规范分支和未来的恢复保留原生连接的身份验证和提供商配置。

在锁定模型的受监督 Chat 中，`codex_threads` 无法附加其他复刻线程，也无法归档该 Chat 绑定的原生线程。列表和仅限元数据的读取仍然可用。读取原始会话记录需要启用 `allowRawTranscripts`；禁用后，列表搜索也会被拒绝，因为原生搜索可能会匹配会话记录预览。重命名、取消归档、分离式复刻，以及归档不属于其他 OpenClaw Chat 的无关线程，都需要启用 `allowWriteControls`。这两个选项都无法绕过锁定的绑定。

对于正常的本地 app-server 启动，OpenClaw 不会重写 `HOME`。由 Codex 运行的子进程（例如 `openclaw`、`gh`、`git`、云 CLI 和 Shell 命令）会看到正常的进程主目录，并能找到用户主目录中的配置和令牌。Codex 还可能发现 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json`；此 `.agents` 发现机制有意与操作员主目录共享，并与隔离的 `~/.codex` 状态分开。

在默认 Agent 范围内，OpenClaw 插件和 OpenClaw Skills 快照仍通过 OpenClaw 自己的插件注册表和 Skills 加载器传递；个人 Codex `~/.codex` 资产则不会。如果你的 Codex 主目录中有实用的 Codex CLI Skills 或插件，并希望将其纳入隔离的 OpenClaw Agent，请明确清点这些资产：

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

`appServer.clearEnv` 只影响生成的 Codex app-server 子进程。OpenClaw 会在本地启动规范化期间从此列表中移除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 会继续指向所选的 Agent 或用户范围，`HOME` 则继续继承，使子进程能够使用正常的用户主目录状态。

## 动态工具

Codex 动态工具默认使用 `searchable` 加载方式，在 `openclaw` 命名空间下公开，并设置 `deferLoading: true`。OpenClaw 不会公开与 Codex 原生工作区操作或 Codex 自身工具搜索界面重复的动态工具：

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

大多数其余的 OpenClaw 集成工具（例如消息、媒体、cron、浏览器、节点、Gateway 网关、`heartbeat_respond` 和 `web_search`）都可通过该命名空间下的 Codex 工具搜索使用。这样可以缩小初始模型上下文。无论 `codexDynamicToolsLoading` 如何设置，少量工具始终可直接调用，因为 Codex 工具搜索可能不可用，或只能解析出仅含连接器的工具集合：`agents_list`、`sessions_spawn` 和 `sessions_yield`。开发者指令仍会引导普通 Codex 子智能体使用原生 `spawn_agent` 执行 Codex 原生子智能体工作，而 `sessions_spawn` 仍可用于明确的 OpenClaw 或 ACP 委派。仅使用消息工具的来源回复也会保持直接调用，因为这是轮次控制契约。

标记为 `catalogMode: "direct-only"` 的工具（包括 OpenClaw `computer` 工具）会归入 `openclaw_direct`。OpenClaw 会将该命名空间添加到 Codex 的 `code_mode.direct_only_tool_namespaces` 列表中，而不会替换操作员提供的条目。因此，Codex 会在普通线程和仅代码模式线程中将这些工具公开为 `DirectModelOnly`，而不是通过嵌套代码模式的 `tools.*` 调用进行路由。此边界对于包含图像的结果必不可少：嵌套代码模式序列化会将图像输出展平为文本，从而丢弃下一次计算机操作所需的屏幕截图。

只有在连接到无法搜索延迟加载动态工具的自定义 Codex app-server，或调试完整工具负载时，才应设置 `codexDynamicToolsLoading: "direct"`。

## 超时

OpenClaw 自有的动态工具调用具有独立于
`appServer.requestTimeoutMs` 的时限。每个 Codex `item/tool/call` 请求按以下
顺序采用第一个可用的超时设置：

- 每次调用传入的正数 `timeoutMs` 参数。
- 对于 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 对于未配置超时的 `image_generate`，使用 120 秒的图像生成默认值。
- 对于媒体理解 `image` 工具，使用转换为毫秒的 `tools.media.image.timeoutSeconds`，
  或 60 秒的媒体默认值。对于图像理解，此设置适用于请求本身，不会因
  之前的准备工作而缩短。
- 对于 `message` 工具，使用固定的 120 秒默认值。
- 使用 90 秒的动态工具默认值。

此看门狗是动态 `item/tool/call` 的外层预算。提供商特定的请求超时在该
调用内部运行，并保留各自的超时语义。动态工具预算上限为 600000 毫秒。
发生超时时，OpenClaw 会在支持的情况下中止工具信号，并向 Codex 返回
失败的动态工具响应，使该轮次能够继续，而不是让会话停留在
`processing` 状态。

Codex 接受轮次后，以及 OpenClaw 响应轮次范围内的应用服务器请求后，
Codex harness 会等待 Codex 推进当前轮次，并最终通过 `turn/completed`
结束原生轮次。如果应用服务器在 `appServer.turnCompletionIdleTimeoutMs`
规定的时间内无任何活动，OpenClaw 会尽力中断 Codex 轮次、记录诊断超时，
并释放 OpenClaw 会话通道，避免后续聊天消息排在失效的原生轮次之后。

同一轮次的大多数非终止通知都会解除这个短时看门狗，因为 Codex 已证明
该轮次仍处于活动状态。工具交接使用更长的工具后空闲预算：在 OpenClaw
返回 `item/tool/call` 响应后、在 `commandExecution` 等原生工具项目完成后、
在原始 `custom_tool_call_output` 完成后，以及在工具后的原始助手进度、
原始推理完成或推理进度之后，都会采用该预算。如果已配置，
守卫会使用 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`，否则
默认为五分钟。同一个工具后预算也会延长进度看门狗，以覆盖 Codex 发出
下一个当前轮次事件之前的静默综合窗口。推理完成、评论类 `agentMessage`
完成，以及工具前的原始推理或助手进度之后，可能会自动生成最终回复，
因此它们使用进度后回复守卫，而不会立即释放会话通道。只有最终的非评论类
已完成 `agentMessage` 项目和工具前的原始助手完成才会启用助手输出释放：
如果 Codex 随后静默且未发送 `turn/completed`，OpenClaw 会尽力中断原生
轮次并释放会话通道。可安全重放的标准输入输出应用服务器故障，包括在没有
助手、工具、活动项目或副作用证据时发生的轮次完成空闲超时，会通过全新的
应用服务器尝试重试一次。不安全的超时仍会停用卡住的应用服务器客户端，
并释放 OpenClaw 会话通道。它们还会清除失效的原生线程绑定，而不会自动
重放。完成监视超时会显示 Codex 特定的超时文本：可安全重放的情况会说明
响应可能不完整，不安全的情况则会要求用户在重试前验证当前状态。公开的
超时诊断包括结构化字段，例如最后一个应用服务器通知方法、原始助手响应
项目的 ID/类型/角色、活动请求/项目数量，以及已启用的监视状态。当最后一个
通知是原始助手响应项目时，诊断还会包含长度受限的助手文本预览。诊断不会
包含原始提示词或工具内容。

## 模型发现

默认情况下，Codex 插件会向应用服务器查询可用模型。模型可用性由 Codex
应用服务器负责，因此当 OpenClaw 升级内置的 `@openai/codex` 版本，或部署
将 `appServer.command` 指向其他 Codex 二进制文件时，列表可能发生变化。
可用性也可能因账户而异。在运行中的 Gateway 网关上使用 `/codex models`，
可以查看该 harness 和账户的实时目录。

如果发现失败或超时，OpenClaw 会使用内置的后备目录：

| 模型 ID         | 显示名称     | 推理强度                 |
| --------------- | ------------ | ------------------------ |
| `gpt-5.5`       | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini`  | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
当前内置 harness 为 `@openai/codex` `0.144.1`。针对该内置应用服务器执行
`model/list` 探测后，返回了以下公开模型选择器条目：

| 模型 ID          | 输入模态   | 推理强度                             |
| ---------------- | ---------- | ------------------------------------ |
| `gpt-5.6-sol`    | 文本、图像 | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`  | 文本、图像 | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`   | 文本、图像 | low, medium, high, xhigh, max        |
| `gpt-5.5`        | 文本、图像 | low, medium, high, xhigh             |
| `gpt-5.4`        | 文本、图像 | low, medium, high, xhigh             |
| `gpt-5.4-mini`   | 文本、图像 | low, medium, high, xhigh             |
| `gpt-5.2`        | 文本、图像 | low, medium, high, xhigh             |

应用服务器目录可以报告 `ultra`；OpenClaw 推理控制目前最高公开到 `max`。

实时模型选择器条目因账户而异，并且可能随账户、Codex 目录或内置版本变化；
请运行 `/codex models` 获取当前列表，而不要依赖任何特定时间点的表格。
应用服务器目录中还可能出现用于内部或专用流程的隐藏模型，而它们并非常规
的模型选择器选项。
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

如果你希望启动时避免探测 Codex，并且只使用后备目录，请禁用发现：

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

Codex 通过原生项目文档发现机制自行处理 `AGENTS.md`。OpenClaw 不会写入
合成的 Codex 项目文档文件，也不会依赖 Codex 的人格文件后备文件名，因为
Codex 后备机制仅在缺少 `AGENTS.md` 时生效。

为了与 OpenClaw 工作区保持一致，Codex harness 会将其他引导文件作为
开发者指令转发，但转发方式并不完全相同：

- `TOOLS.md` 会作为**继承的** Codex 开发者指令转发，因此该轮次中生成的
  原生 Codex 子智能体也能看到它。
- `SOUL.md`、`IDENTITY.md` 和 `USER.md` 会作为**轮次范围内的**协作指令
  转发。原生 Codex 子智能体不会继承这些指令，从而避免子智能体轮次采用
  父智能体的人格和用户资料。
- 精简后的已加载 OpenClaw Skills 列表也会作为轮次范围内的协作开发者
  指令转发，因此原生 Codex 子智能体同样不会继承它。
- 不会注入 `HEARTBEAT.md` 的内容；当该文件存在且非空时，Heartbeat 轮次
  会获得一条协作模式指引，要求读取该文件。
- 当为已配置的 Agent 工作区提供记忆工具时，不会将该工作区中的
  `MEMORY.md` 内容粘贴到原生 Codex 轮次输入中；当该文件存在时，harness
  会在轮次范围内的协作开发者指令中添加一条简短的工作区记忆指引，而在
  持久记忆相关时，Codex 应使用 `memory_search` 或 `memory_get`。如果工具
  已禁用、记忆搜索不可用，或活动工作区与 Agent 记忆工作区不同，
  `MEMORY.md` 则会使用常规的受限轮次上下文路径。
- 如果存在 `BOOTSTRAP.md`，它会作为 OpenClaw 轮次输入的参考上下文转发。

## 环境变量覆盖

本地测试仍可使用以下环境变量覆盖：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当未设置 `appServer.command` 时，`OPENCLAW_CODEX_APP_SERVER_BIN` 会绕过
托管的二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。请改用
`plugins.entries.codex.config.appServer.mode: "guardian"`，或在一次性本地
测试中使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`。对于可重复部署，
首选配置，因为它能将插件行为与 Codex harness 的其余设置保存在同一个
经过审核的文件中。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [Codex 监管](/plugins/codex-supervision)
- [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)
- [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
- [OpenAI provider](/zh-CN/providers/openai)
- [配置参考](/zh-CN/gateway/configuration-reference)
