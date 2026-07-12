---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Codex Computer Use
    - 你正在 Codex Computer Use、PeekabooBridge 和直接使用 cua-driver MCP 之间做选择
    - 你正在为内置 Codex 插件配置计算机使用
    - 你正在排查 /codex 计算机使用状态或安装问题
summary: 为 Codex 模式的 OpenClaw 智能体设置 Codex Computer Use
title: Codex Computer Use
x-i18n:
    generated_at: "2026-07-12T14:36:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

计算机使用是一个用于控制本地桌面的 Codex 原生 MCP 插件。OpenClaw
不内置桌面应用、不自行执行桌面操作，也不绕过
Codex 权限。内置的 `codex` 插件仅负责准备 Codex app-server：
启用 Codex 插件支持，查找或安装已配置的计算机使用
插件，检查 `computer-use` MCP 服务器是否可用，然后在 Codex 模式的轮次中
让 Codex 负责原生 MCP 工具调用。

当 OpenClaw 已在使用原生 Codex harness 时，请使用此页面。有关
运行时本身的设置，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。

这与 OpenClaw 内置的[基于节点的计算机工具](/zh-CN/nodes/computer-use)不同。如果无论智能体运行在 Gateway 网关还是其他节点上，都应通过同一智能体契约控制已配对的 Mac，请使用内置工具。如果应由 Codex app-server 负责本地 MCP 的安装、权限和原生工具调用，请使用 Codex Computer Use。

## OpenClaw.app 和 Peekaboo

OpenClaw.app 的 Peekaboo 集成与 Codex Computer Use 相互独立。
macOS 应用可以托管 PeekabooBridge 套接字，让 `peekaboo` CLI 能够复用
应用的本地辅助功能和屏幕录制授权，供 Peekaboo 自己的
自动化工具使用。该桥接不会安装或代理 Codex Computer Use，
Codex Computer Use 也不会通过 PeekabooBridge 套接字进行调用。

如果你希望 OpenClaw.app 成为支持权限感知的 Peekaboo CLI 自动化宿主，
请使用 [Peekaboo 桥接](/zh-CN/platforms/mac/peekaboo)。如果 Codex 模式的
OpenClaw 智能体需要在轮次开始前获得 Codex 原生 `computer-use` MCP 插件，
请使用此页面。

## iOS 应用

iOS 应用与 Codex Computer Use 相互独立。它不会安装或代理
Codex `computer-use` MCP 服务器，也不是桌面控制后端。
相反，iOS 应用会作为 OpenClaw 节点连接，并通过 `canvas.*`、`camera.*`、`screen.*`、
`location.*` 和 `talk.*` 等节点命令提供移动端
能力。

如果你希望智能体通过 Gateway 网关操控 iPhone 节点，
请使用 [iOS](/zh-CN/platforms/ios)。如果 Codex 模式智能体应通过 Codex 原生的 Computer Use 插件
控制本地 macOS 桌面，请使用此页面。

## 直接使用 cua-driver MCP

Codex Computer Use 并不是提供桌面控制的唯一方式。如果你希望
由 OpenClaw 管理的运行时直接调用 TryCua 的驱动程序，请通过 OpenClaw 的 MCP 注册表
使用上游 `cua-driver mcp` 服务器，而不是使用
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
架构和结构化 MCP 响应。如果你希望将 CUA 驱动程序
作为普通 OpenClaw MCP 服务器使用，请选择此方式。如果 Codex app-server 应负责插件安装、MCP 重新加载，
以及 Codex 模式轮次内的原生工具调用，请使用本页面上的 Codex Computer Use 设置。

CUA 的驱动程序仅适用于 macOS，并且仍然需要其应用提示授予的
本地 macOS 权限，例如辅助功能和屏幕录制。OpenClaw 不会
安装 `cua-driver`、授予这些权限或绕过上游
驱动程序的安全模型。

## 快速设置

当 Codex 模式轮次必须在线程启动前提供
Computer Use 时，请设置 `plugins.entries.codex.config.computerUse`。`autoInstall: true` 表示
启用 Computer Use，并允许 OpenClaw 在轮次开始前安装或重新启用它：

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

使用此配置时，OpenClaw 会在每个 Codex 模式
轮次开始前检查 Codex app-server。如果缺少 Computer Use，但 Codex app-server 已发现
可安装的市场，OpenClaw 会请求 Codex app-server 安装或
重新启用该插件，并重新加载 MCP 服务器。在 macOS 上，如果未注册匹配的
市场，但存在标准桌面应用包，OpenClaw
还会尝试注册来自
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` 的内置 Codex 市场，
并保留 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
作为旧版独立安装的回退方案。如果完成设置后仍无法使
MCP 服务器可用，轮次会在线程启动前失败。

更改 Computer Use 配置后，如果现有 Codex 线程已经启动，
请先在受影响的聊天中使用 `/new` 或 `/reset`，然后再测试。

在 macOS 上，Computer Use 的托管启动会优先使用桌面应用二进制文件
`/Applications/ChatGPT.app/Contents/Resources/codex`，然后
回退到 `/Applications/Codex.app/Contents/Resources/codex`，以支持旧版
独立安装。这也适用于会自行启动客户端的一次性 Computer Use 状态和
安装命令。这样可使桌面控制始终由拥有本地 macOS 权限的
应用包管理。如果未安装桌面应用，
OpenClaw 会回退到安装在插件旁边的托管 Codex 二进制文件。
使用默认隔离智能体主目录的普通托管 Codex 轮次会优先使用
这个固定版本的软件包，以免较旧的桌面应用遮蔽当前模型
支持。用户范围的主目录仍优先使用桌面应用，因为它们可以加载原生
Computer Use 状态。如果隔离的智能体主目录中的有效 Codex 配置启用了
Computer Use，也会继续优先使用桌面应用。显式的
`appServer.command` 配置或 `OPENCLAW_CODEX_APP_SERVER_BIN` 仍会覆盖
此托管选择。

OpenClaw 会在一个正在运行的 Gateway 网关内串行执行原生 Codex 配置读取和 Computer Use 安装。
独立的 Codex 进程或其他 Gateway 网关不受该互斥机制约束。
在 Gateway 网关之外更改原生 Codex 插件配置后，请重启 Gateway 网关并开启新聊天，
然后再依赖新的选择结果。

## 命令

可在提供 `codex` 插件命令表面的任意聊天界面中
使用 `/codex computer-use` 命令。这些是 OpenClaw 聊天/运行时
命令，而不是 `openclaw codex ...` CLI 子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是默认操作，并且为只读：它不会添加市场
来源、安装插件或启用 Codex 插件支持。如果没有配置启用
Computer Use，即使执行过一次性安装
命令，`status` 仍可能报告已禁用。

`install` 会启用 Codex app-server 插件支持，可选地添加
已配置的市场来源，通过 Codex app-server 安装或重新启用已配置的插件，
重新加载 MCP 服务器，并验证 MCP
服务器是否提供工具。由于安装会更改受信任的主机资源，
只有所有者或 `operator.admin` Gateway 网关客户端可以运行 `install`。其他
已获授权的发送者仍可继续使用只读 `status` 命令，
包括配合覆盖参数使用。

较旧版本接受一次性的 `--plugin`、`--server` 和 `--mcp-server`
身份覆盖参数。请改为持久配置 `computerUse.pluginName` 和
`computerUse.mcpServerName`。使用旧版身份标志时，
命令会指出需要持久保存的确切设置，并在迁移指导中重复
请求的操作及所有受支持的市场标志。

## 市场选择

OpenClaw 使用 Codex 自身提供的同一 app-server API。
市场字段用于选择 Codex 应从何处查找 `computer-use`。

| 字段                 | 适用场景                                                        | 安装支持                                                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 无市场字段           | 你希望 Codex app-server 使用它已经知道的市场。                  | 支持，前提是 app-server 返回本地市场。                   |
| `marketplaceSource`  | 你有一个 app-server 可以添加的 Codex 市场来源。                 | 支持，用于显式执行 `/codex computer-use install`。       |
| `marketplacePath`    | 你已经知道主机上的本地市场文件路径。                            | 支持显式安装和轮次启动时的自动安装。                     |
| `marketplaceName`    | 你希望按名称选择一个已注册的市场。                              | 仅当所选市场具有本地路径时支持。                         |

全新的 Codex 主目录可能需要稍等片刻才能初始化其官方
市场。安装期间，OpenClaw 会轮询 `plugin/list`，最多持续
`marketplaceDiscoveryTimeoutMs` 毫秒（默认 60 秒）。

如果多个已知市场都包含 Computer Use，OpenClaw 会优先选择
`openai-bundled`，其次是 `openai-curated`，然后是 `local`。对于未知且存在歧义的
匹配，系统会采取故障关闭策略，并要求你设置 `marketplaceName` 或
`marketplacePath`。

## 内置 macOS 市场

当前 ChatGPT 桌面版本在以下位置内置 Computer Use；旧版独立
Codex 桌面版本在 `Codex.app` 下使用相同的目录结构：

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

当 `computerUse.autoInstall` 为 true 且未注册包含
`computer-use` 的市场时，OpenClaw 会尝试添加第一个存在的标准
内置市场根目录：

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以通过 shell 使用 Codex 显式注册它：

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非标准的 Codex 应用路径，请执行一次 `/codex computer-use install
--source <marketplace-root>`，或将 `computerUse.marketplacePath` 设置为
本地市场文件路径。仅当你拥有市场 JSON 文件路径时才使用
`--marketplace-path`，不要将其用于内置市场根目录。

### 共享插件缓存

默认的 `pluginCacheMode: "independent"` 不会管理各 Codex 主目录及其
插件缓存。将 `pluginCacheMode: "shared"` 设置为共享模式后，会在 app-server 启动前
将内置 Computer Use 插件复制到当前 Codex 主目录中可发现的插件缓存。
共享模式会保留较旧的缓存版本，因为正在运行的 Codex 客户端仍可能引用
其带版本号的插件目录；替换复制失败时，也会保留当前有效缓存。显式配置
`marketplaceName` 或 `marketplacePath` 会禁用此
协调过程，以免 OpenClaw 覆盖该选择。

## 远程目录限制

Codex app-server 可以列出和读取仅远程提供的目录条目，但目前
不支持远程 `plugin/install`。这意味着 `marketplaceName`
可以选择仅远程市场进行状态检查，但安装和
重新启用仍需要通过 `marketplaceSource` 或
`marketplacePath` 提供本地市场。

如果状态显示该插件在远程 Codex 市场中可用，但
不支持远程安装，请使用本地来源或路径运行安装：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 配置参考

| 字段                            | 默认值         | 含义                                                                                 |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------ |
| `enabled`                       | 推断           | 要求使用计算机。设置了另一个计算机使用字段时，默认为 true。                          |
| `autoInstall`                   | false          | 在轮次开始时，从已发现的市场安装或重新启用。                                         |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安装等待 Codex app-server 完成市场发现的时长。                                       |
| `liveTestTimeoutMs`             | 60000          | 临时就绪检查线程及其清理请求的超时时间。                                             |
| `toolCallTimeoutMs`             | 60000          | 计算机使用 `list_apps` 就绪工具调用的超时时间。                                      |
| `healthCheckEnabled`            | false          | 当所属 app-server 客户端处于活动状态时，定期运行就绪探测。                           |
| `healthCheckIntervalMinutes`    | 60             | 探测周期；可接受的值为 30、60、120 或 240 分钟。                                    |
| `pluginCacheMode`               | `independent`  | 使用 `shared` 可从内置桌面插件刷新 Codex 主目录缓存。                                |
| `strictReadiness`               | false          | 实时探测失败时停止启动，而不是在显示警告后继续。                                     |
| `autoRepair`                    | false          | 终止限定范围内已失效的计算机使用 MCP 子进程，并在探测失败后重试一次。                |
| `marketplaceSource`             | 未设置         | 传递给 Codex app-server `marketplace/add` 的来源字符串。                             |
| `marketplacePath`               | 未设置         | 包含插件的本地 Codex 市场文件路径。                                                  |
| `marketplaceName`               | 未设置         | 要选择的已注册 Codex 市场名称。                                                      |
| `pluginName`                    | `computer-use` | Codex 市场插件名称。                                                                 |
| `mcpServerName`                 | `computer-use` | 已安装插件公开的 MCP 服务器名称。                                                    |

轮次开始时的自动安装会有意拒绝已配置的 `marketplaceSource`
值。添加新来源是一项显式设置操作，因此请先运行一次
`/codex computer-use install --source <marketplace-source>`，然后让
`autoInstall` 处理今后从已发现本地市场重新启用的操作。
轮次开始时的自动安装可以使用已配置的 `marketplacePath`，因为该路径
已是主机上的本地路径。

每个字段也接受环境变量覆盖；匹配的配置键未设置时会检查这些变量：

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

| 原因                         | 含义                                                   | 后续步骤                                      |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析为 false。                   | 设置 `enabled` 或另一个计算机使用字段。       |
| `marketplace_missing`        | 没有可用的匹配市场。                                   | 配置来源、路径或市场名称。                    |
| `plugin_not_installed`       | 市场存在，但插件尚未安装。                             | 运行安装或启用 `autoInstall`。                |
| `plugin_disabled`            | 插件已安装，但在 Codex 配置中被禁用。                  | 运行安装以重新启用。                          |
| `remote_install_unsupported` | 所选市场仅支持远程访问。                               | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 插件已启用，但 MCP 服务器不可用。                      | 检查 Codex Computer Use 和操作系统权限。      |
| `ready`                      | 插件和 MCP 工具均可用。                                | 启动 Codex 模式轮次。                         |
| `check_failed`               | 状态检查期间 Codex app-server 请求失败。               | 检查 app-server 连接和日志。                  |
| `auto_install_blocked`       | 轮次开始时的设置需要添加新来源。                       | 先运行显式安装。                              |

聊天输出包含插件状态、MCP 服务器状态、市场、可用时的工具，以及
设置步骤失败时的具体消息。

## macOS 权限

计算机使用仅适用于 macOS。Codex 所属的 MCP 服务器在检查或控制应用前，
可能需要本地操作系统权限。如果 OpenClaw 表示计算机使用已安装但 MCP
服务器不可用，请先验证 Codex 侧的计算机使用设置：

- Codex app-server 正运行在需要进行桌面控制的同一主机上。
- 计算机使用插件已在 Codex 配置中启用。
- `computer-use` MCP 服务器出现在 Codex app-server MCP 状态中。
- macOS 已向桌面控制应用授予所需权限。
- 当前主机会话可以访问受控桌面。

当 `computerUse.enabled` 为 true 时，OpenClaw 会有意采用失败即关闭策略。
Codex 模式轮次不应在缺少配置要求的原生桌面工具时静默继续。

## 故障排查

**状态显示未安装。**运行 `/codex computer-use install`。如果未发现
市场，请传入 `--source` 或 `--marketplace-path`。

**状态显示已安装但被禁用。**再次运行 `/codex computer-use install`。
Codex app-server 安装操作会将插件配置重新写为已启用。

**状态显示不支持远程安装。**使用本地市场来源或路径。可以检查仅远程
目录条目，但无法通过当前 app-server API 安装它们。

**状态显示 MCP 服务器不可用。**重新运行一次安装，以重新加载 MCP
服务器。如果仍不可用，请修复 Codex Computer Use 应用、Codex app-server
MCP 状态或 macOS 权限。

**状态检查或探测在 `computer-use.list_apps` 上超时。**插件和 MCP
服务器均已存在，但本地计算机使用桥接未响应。退出或重启 Codex Computer
Use，必要时重新启动 Codex Desktop，然后在新的 OpenClaw 会话中重试。
如果主机之前通过旧版托管 Codex app-server 运行计算机使用，请从桌面应用
内置市场刷新已安装插件（独立安装的 Codex 桌面应用请使用 `Codex.app`
路径）：

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**计算机使用工具显示 `Native hook relay unavailable`。**Codex 原生
工具钩子无法通过本地桥接或 Gateway 网关回退连接到活动的 OpenClaw 中继。
使用 `/new` 或 `/reset` 启动新的 OpenClaw 会话。如果它成功一次，但后续
工具调用再次失败，则 `/new` 只是在清除当前尝试；请重启 Codex app-server
或 OpenClaw Gateway 网关，以清除旧线程和钩子注册，然后在新会话中重试。

**轮次开始时的自动安装拒绝来源。**这是有意设计。先使用显式命令
`/codex computer-use install --source
<marketplace-source>` 添加来源，此后轮次开始时的自动安装便可使用
已发现的本地市场。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Peekaboo 桥接](/zh-CN/platforms/mac/peekaboo)
- [iOS 应用](/zh-CN/platforms/ios)
