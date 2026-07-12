---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Codex Computer Use
    - 你正在 Codex Computer Use、PeekabooBridge 和直接使用 cua-driver MCP 之间进行选择
    - 你正在为内置 Codex 插件配置 computerUse
    - 你正在排查 /codex 计算机使用状态或安装问题
summary: 为 Codex 模式的 OpenClaw 智能体设置 Codex Computer Use
title: Codex Computer Use
x-i18n:
    generated_at: "2026-07-11T20:43:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

计算机使用是一个用于本地桌面控制的 Codex 原生 MCP 插件。OpenClaw
不会内置该桌面应用、自行执行桌面操作，也不会绕过
Codex 权限。内置的 `codex` 插件只负责准备 Codex app-server：
启用 Codex 插件支持、查找或安装已配置的计算机使用
插件、检查 `computer-use` MCP 服务器是否可用，然后在
Codex 模式轮次期间让 Codex 负责原生 MCP 工具调用。

当 OpenClaw 已在使用原生 Codex harness 时，请参阅此页面。有关
运行时本身的设置，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。

这与 OpenClaw 内置的[由节点支持的计算机工具](/zh-CN/nodes/computer-use)不同。如果无论智能体运行在 Gateway 网关还是其他节点上，都应使用同一智能体契约控制已配对的 Mac，请使用内置工具。如果应由 Codex app-server 负责本地 MCP 安装、权限和原生工具调用，请使用 Codex Computer Use。

## OpenClaw.app 和 Peekaboo

OpenClaw.app 的 Peekaboo 集成独立于 Codex Computer Use。
macOS 应用可以托管 PeekabooBridge 套接字，使 `peekaboo` CLI 能够复用
该应用的本地辅助功能和屏幕录制授权，以供 Peekaboo 自身的
自动化工具使用。该桥接不会安装或代理 Codex Computer Use，
Codex Computer Use 也不会通过 PeekabooBridge 套接字进行调用。

如果你希望 OpenClaw.app 成为具有权限感知能力的 Peekaboo CLI
自动化宿主，请使用 [Peekaboo 桥接](/zh-CN/platforms/mac/peekaboo)。如果你希望
Codex 模式的 OpenClaw 智能体在轮次开始前即可使用 Codex 原生
`computer-use` MCP 插件，请参阅此页面。

## iOS 应用

iOS 应用独立于 Codex Computer Use。它不会安装或代理
Codex `computer-use` MCP 服务器，也不是桌面控制后端。
相反，iOS 应用会作为 OpenClaw 节点连接，并通过
`canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`
等节点命令提供移动端能力。

如果你希望智能体通过 Gateway 网关操控 iPhone 节点，请使用
[iOS](/zh-CN/platforms/ios)。如果你希望 Codex 模式智能体通过 Codex 原生
Computer Use 插件控制本地 macOS 桌面，请参阅此页面。

## 直接使用 cua-driver MCP

Codex Computer Use 并不是提供桌面控制的唯一方式。如果你希望
由 OpenClaw 管理的运行时直接调用 TryCua 的驱动程序，请通过
OpenClaw 的 MCP 注册表使用上游 `cua-driver mcp` 服务器，而不是
Codex 专用的市场流程。

安装 `cua-driver` 后，可以让它输出 OpenClaw 命令：

```bash
cua-driver mcp-config --client openclaw
```

也可以直接注册 stdio 服务器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

此路径会完整保留上游 MCP 工具表面，包括驱动程序
模式和结构化 MCP 响应。如果你希望将 CUA 驱动程序作为普通的
OpenClaw MCP 服务器使用，请选择此方式。如果应由 Codex app-server
负责插件安装、MCP 重新加载，以及 Codex 模式轮次中的原生工具调用，
请使用本页面介绍的 Codex Computer Use 设置。

CUA 的驱动程序仅适用于 macOS，并且仍需要其应用提示授予的
本地 macOS 权限，例如辅助功能和屏幕录制权限。OpenClaw 不会
安装 `cua-driver`、授予这些权限，也不会绕过上游
驱动程序的安全模型。

## 快速设置

当 Codex 模式轮次必须在线程开始前即可使用计算机使用功能时，请设置
`plugins.entries.codex.config.computerUse`。`autoInstall: true` 会启用
计算机使用功能，并允许 OpenClaw 在轮次开始前安装或重新启用它：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
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

使用此配置后，OpenClaw 会在每个 Codex 模式
轮次之前检查 Codex app-server。如果缺少计算机使用功能，但 Codex app-server
已经发现了可安装的市场，OpenClaw 会要求 Codex app-server 安装或
重新启用该插件，并重新加载 MCP 服务器。在 macOS 上，如果没有注册
匹配的市场，但存在标准桌面应用包，OpenClaw
还会尝试注册位于
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` 的
内置 Codex 市场，同时保留
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
作为旧版独立安装的后备路径。如果设置后仍无法使
MCP 服务器可用，该轮次会在线程开始前失败。

更改计算机使用配置后，如果现有 Codex 线程已经启动，请在受影响的
聊天中使用 `/new` 或 `/reset`，然后再进行测试。

在 macOS 上，计算机使用功能的托管启动会优先使用位于
`/Applications/ChatGPT.app/Contents/Resources/codex` 的桌面应用二进制文件，
然后针对旧版独立安装回退到
`/Applications/Codex.app/Contents/Resources/codex`。这也适用于会自行
启动客户端的一次性计算机使用状态和安装命令。这样可以让桌面控制
归属于持有本地 macOS 权限的应用包。如果未安装桌面应用，
OpenClaw 会回退到随插件一起安装的托管 Codex 二进制文件。
使用默认隔离智能体主目录的普通托管 Codex 轮次会优先使用该固定版本的软件包，
以免较旧的桌面应用遮蔽当前的模型支持。用户范围的主目录仍优先使用桌面应用，
因为它们可以加载原生计算机使用状态。如果隔离智能体主目录的有效 Codex 配置
启用了计算机使用功能，也会继续优先使用桌面应用。显式的
`appServer.command` 配置或 `OPENCLAW_CODEX_APP_SERVER_BIN` 仍会覆盖
这一托管选择。

OpenClaw 会在同一个运行中的 Gateway 网关内串行处理原生 Codex 配置读取和
计算机使用安装。单独的 Codex 进程或另一个 Gateway 网关不受此互斥机制约束。
在 Gateway 网关外部更改原生 Codex 插件配置后，请重启 Gateway 网关并开始
新的聊天，然后再依赖新的选择结果。

## 命令

在任何提供 `codex` 插件命令表面的聊天界面中使用
`/codex computer-use` 命令。这些是 OpenClaw 聊天/运行时
命令，而不是 `openclaw codex ...` CLI 子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是默认操作且为只读：它不会添加市场
来源、安装插件，也不会启用 Codex 插件支持。如果没有配置启用
计算机使用功能，即使执行过一次性安装命令，`status` 仍可能报告其已禁用。

`install` 会启用 Codex app-server 插件支持，并可选择添加
已配置的市场来源；它会通过 Codex app-server 安装或重新启用已配置的插件、
重新加载 MCP 服务器，并验证 MCP 服务器是否提供工具。由于安装会更改
受信任的宿主资源，因此只有所有者或 `operator.admin` Gateway 网关客户端
可以运行 `install`。其他已授权发送者仍可使用只读的 `status` 命令，
包括带覆盖参数的调用。

旧版本接受一次性的 `--plugin`、`--server` 和 `--mcp-server`
身份覆盖参数。现在应改为持久配置 `computerUse.pluginName` 和
`computerUse.mcpServerName`。使用旧版身份参数时，命令会明确指出
需要持久保存的具体设置，并在迁移指导中重复所请求的操作以及所有
受支持的市场参数。

## 市场选择

OpenClaw 使用 Codex 自身公开的同一套 app-server API。
市场字段用于选择 Codex 应从何处查找 `computer-use`。

| 字段                 | 适用场景                                                        | 安装支持                                                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 不设置市场字段       | 你希望 Codex app-server 使用它已经知晓的市场。                  | 支持，但 app-server 必须返回本地市场。                   |
| `marketplaceSource`  | 你有可供 app-server 添加的 Codex 市场来源。                     | 支持显式执行 `/codex computer-use install`。             |
| `marketplacePath`    | 你已知道宿主上的本地市场文件路径。                              | 支持显式安装和轮次开始时的自动安装。                     |
| `marketplaceName`    | 你希望按名称选择一个已注册的市场。                              | 仅当所选市场具有本地路径时支持。                         |

新的 Codex 主目录可能需要短暂等待才能初始化其官方
市场。安装期间，OpenClaw 会轮询 `plugin/list`，最长等待
`marketplaceDiscoveryTimeoutMs` 毫秒（默认为 60 秒）。

如果多个已知市场都包含计算机使用功能，OpenClaw 会优先选择
`openai-bundled`，其次是 `openai-curated`，最后是 `local`。如果未知来源产生
歧义匹配，操作会采用安全关闭方式失败，并要求你设置 `marketplaceName` 或
`marketplacePath`。

## 内置 macOS 市场

当前的 ChatGPT 桌面版本在以下位置内置计算机使用功能；旧版独立
Codex 桌面版本则在 `Codex.app` 下使用相同的目录布局：

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

当 `computerUse.autoInstall` 为 true，且没有注册包含
`computer-use` 的市场时，OpenClaw 会尝试添加第一个存在的标准
内置市场根目录：

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以通过 Codex 在 shell 中显式注册它：

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非标准的 Codex 应用路径，请运行一次 `/codex computer-use install
--source <marketplace-root>`，或将 `computerUse.marketplacePath` 设置为
本地市场文件路径。只有在你拥有市场 JSON 文件路径时才使用
`--marketplace-path`，不要将其设置为内置市场根目录。

### 共享插件缓存

默认的 `pluginCacheMode: "independent"` 不会管理各个 Codex 主目录及其
插件缓存。设置 `pluginCacheMode: "shared"` 后，会在 app-server 启动前将
内置的计算机使用插件复制到当前 Codex 主目录中可被发现的插件缓存。
共享模式会保留较旧的缓存版本，因为正在运行的 Codex 客户端可能仍会引用
其带版本号的插件目录；替换复制失败时也会保留当前有效缓存。显式配置
`marketplaceName` 或 `marketplacePath` 会禁用此协调过程，以免 OpenClaw
覆盖该选择。

## 远程目录限制

Codex app-server 可以列出和读取仅存在于远程的目录条目，但目前
不支持远程 `plugin/install`。这意味着 `marketplaceName`
可以选择仅远程市场进行状态检查，但安装和重新启用仍需要通过
`marketplaceSource` 或 `marketplacePath` 使用本地市场。

如果状态显示该插件可从远程 Codex 市场获取，但不支持
远程安装，请使用本地来源或路径运行安装：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 配置参考

| 字段                            | 默认值          | 含义                                                                                   |
| ------------------------------- | --------------- | -------------------------------------------------------------------------------------- |
| `enabled`                       | 推断            | 要求启用计算机使用。当设置了其他计算机使用字段时，默认为 true。                       |
| `autoInstall`                   | false           | 在轮次开始时，从已发现的市场中安装或重新启用。                                         |
| `marketplaceDiscoveryTimeoutMs` | 60000           | 等待 Codex app-server 发现市场的安装超时时间。                                         |
| `liveTestTimeoutMs`             | 60000           | 临时就绪检查线程及其清理请求的超时时间。                                               |
| `toolCallTimeoutMs`             | 60000           | 计算机使用 `list_apps` 就绪检查工具调用的超时时间。                                    |
| `healthCheckEnabled`            | false           | 当所属的 app-server 客户端处于活动状态时，定期运行就绪探测。                           |
| `healthCheckIntervalMinutes`    | 60              | 探测频率；可接受的值为 30、60、120 或 240 分钟。                                      |
| `pluginCacheMode`               | `independent`   | 使用 `shared` 可通过内置桌面插件刷新 Codex 主目录缓存。                                |
| `strictReadiness`               | false           | 实时探测失败时停止启动，而不是发出警告后继续。                                         |
| `autoRepair`                    | false           | 终止作用域内过期的计算机使用 MCP 子进程，并在探测失败后重试一次。                      |
| `marketplaceSource`             | 未设置          | 传递给 Codex app-server `marketplace/add` 的来源字符串。                               |
| `marketplacePath`               | 未设置          | 包含该插件的本地 Codex 市场文件路径。                                                  |
| `marketplaceName`               | 未设置          | 要选择的已注册 Codex 市场名称。                                                        |
| `pluginName`                    | `computer-use`  | Codex 市场中的插件名称。                                                               |
| `mcpServerName`                 | `computer-use`  | 已安装插件公开的 MCP 服务器名称。                                                      |

轮次开始时的自动安装会有意拒绝已配置的 `marketplaceSource`
值。添加新来源属于显式设置操作，因此请先运行一次
`/codex computer-use install --source <marketplace-source>`，然后让
`autoInstall` 负责以后从已发现的本地市场重新启用插件。
轮次开始时的自动安装可以使用已配置的 `marketplacePath`，因为它
已经是主机上的本地路径。

每个字段也接受环境变量覆盖；当对应的配置键未设置时会检查该变量：

| 字段                            | 环境变量                                                       |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## OpenClaw 检查的内容

OpenClaw 会在内部报告稳定的设置原因，并为聊天格式化
面向用户的状态：

| 原因                         | 含义                                                     | 后续步骤                                      |
| ---------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析为 false。                     | 设置 `enabled` 或其他计算机使用字段。         |
| `marketplace_missing`        | 没有可用的匹配市场。                                     | 配置来源、路径或市场名称。                    |
| `plugin_not_installed`       | 市场存在，但插件尚未安装。                               | 运行安装或启用 `autoInstall`。                |
| `plugin_disabled`            | 插件已安装，但在 Codex 配置中被禁用。                    | 运行安装以重新启用它。                        |
| `remote_install_unsupported` | 所选市场仅支持远程访问。                                 | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 插件已启用，但 MCP 服务器不可用。                        | 检查 Codex Computer Use 和操作系统权限。      |
| `ready`                      | 插件和 MCP 工具均可用。                                  | 开始 Codex 模式轮次。                         |
| `check_failed`               | 状态检查期间的 Codex app-server 请求失败。               | 检查 app-server 连接和日志。                  |
| `auto_install_blocked`       | 轮次开始时的设置需要添加新来源。                         | 先运行显式安装。                              |

聊天输出包括插件状态、MCP 服务器状态、市场、可用时的工具，
以及设置步骤失败时的具体消息。

## macOS 权限

计算机使用是 macOS 特有的功能。Codex 所属的 MCP 服务器在检查或控制应用前，
可能需要本地操作系统权限。如果 OpenClaw 表示计算机使用已安装，
但 MCP 服务器不可用，请先验证 Codex 侧的计算机使用设置：

- Codex app-server 正在应执行桌面控制的同一主机上运行。
- 计算机使用插件已在 Codex 配置中启用。
- `computer-use` MCP 服务器出现在 Codex app-server 的 MCP 状态中。
- macOS 已向桌面控制应用授予所需权限。
- 当前主机会话可以访问受控桌面。

当 `computerUse.enabled` 为 true 时，OpenClaw 会有意采用失败关闭策略。
如果配置要求使用原生桌面工具，Codex 模式轮次不应在缺少这些工具时
静默继续。

## 故障排查

**状态显示未安装。** 运行 `/codex computer-use install`。如果未发现
市场，请传入 `--source` 或 `--marketplace-path`。

**状态显示已安装但被禁用。** 再次运行 `/codex computer-use install`。
Codex app-server 的安装操作会将插件配置重新写为启用状态。

**状态显示不支持远程安装。** 使用本地市场来源或路径。可以检查
仅远程的目录条目，但无法通过当前 app-server API 安装它们。

**状态显示 MCP 服务器不可用。** 再次运行安装，以便重新加载 MCP
服务器。如果仍不可用，请修复 Codex Computer Use 应用、
Codex app-server MCP 状态或 macOS 权限。

**状态检查或探测在 `computer-use.list_apps` 上超时。** 插件和
MCP 服务器均已存在，但本地计算机使用桥接未响应。
退出或重新启动 Codex Computer Use，必要时重新启动 Codex Desktop，
然后在新的 OpenClaw 会话中重试。如果主机以前通过旧版托管
Codex app-server 运行过计算机使用，请从桌面应用内置的市场刷新
已安装插件（独立安装的 Codex 桌面版请使用 `Codex.app` 路径）：

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**计算机使用工具显示 `Native hook relay unavailable`。**
Codex 原生工具钩子无法通过本地桥接或 Gateway 网关回退连接到活动的
OpenClaw 中继。使用 `/new` 或 `/reset` 启动新的 OpenClaw 会话。
如果它成功一次，但之后的工具调用再次失败，则 `/new` 只是清除了
当前尝试；请重新启动 Codex app-server 或 OpenClaw Gateway 网关，
以丢弃旧线程和钩子注册，然后在新会话中重试。

**轮次开始时的自动安装拒绝某个来源。** 这是有意行为。请先使用显式命令
`/codex computer-use install --source
<marketplace-source>` 添加该来源，之后轮次开始时的自动安装即可使用
已发现的本地市场。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Peekaboo 桥接](/zh-CN/platforms/mac/peekaboo)
- [iOS 应用](/zh-CN/platforms/ios)
