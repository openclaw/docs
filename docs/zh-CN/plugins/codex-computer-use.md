---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Codex Computer Use
    - 你正在 Codex Computer Use、PeekabooBridge 和直接使用 cua-driver MCP 之间做选择
    - 你正在 Codex Computer Use 和直接的 cua-driver MCP 设置之间做选择
    - 你正在为内置 Codex 插件配置 computerUse
    - 你正在排查 /codex computer-use status 或 install
summary: 为 Codex 模式 OpenClaw 智能体设置 Codex Computer Use
title: Codex Computer Use
x-i18n:
    generated_at: "2026-05-10T19:39:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use 是一个用于本地桌面控制的 Codex 原生 MCP 插件。OpenClaw
不会内置该桌面应用，也不会自行执行桌面操作或绕过 Codex 权限。内置的 `codex` 插件只负责准备 Codex app-server：
它会启用 Codex 插件支持，查找或安装已配置的 Codex
Computer Use 插件，检查 `computer-use` MCP 服务器是否可用，然后
在 Codex 模式轮次中让 Codex 拥有原生 MCP 工具调用。

当 OpenClaw 已经在使用原生 Codex harness 时，请使用此页面。关于
运行时设置本身，请参见 [Codex harness](/zh-CN/plugins/codex-harness)。

## OpenClaw.app 和 Peekaboo

OpenClaw.app 的 Peekaboo 集成独立于 Codex Computer Use。该
macOS 应用可以托管 PeekabooBridge 套接字，使 `peekaboo` CLI 能够复用
应用的本地辅助功能和屏幕录制授权，用于 Peekaboo 自身的
自动化工具。该桥接不会安装或代理 Codex Computer Use，
Codex Computer Use 也不会通过 PeekabooBridge 套接字调用。

当你希望 OpenClaw.app 作为具备权限感知能力的 Peekaboo CLI 自动化宿主时，请使用
[Peekaboo bridge](/zh-CN/platforms/mac/peekaboo)。当
Codex 模式的 OpenClaw 智能体需要在轮次开始前具备 Codex 的原生 `computer-use` MCP 插件时，请使用此页面。

## iOS 应用

iOS 应用独立于 Codex Computer Use。它不会安装或代理
Codex `computer-use` MCP 服务器，也不是桌面控制后端。
相反，iOS 应用会作为一个 OpenClaw 节点连接，并通过
`canvas.*`、`camera.*`、`screen.*`、
`location.*` 和 `talk.*` 等节点命令公开移动端
能力。

当你希望智能体通过 Gateway 网关驱动 iPhone 节点时，请使用 [iOS](/zh-CN/platforms/ios)。当 Codex 模式的智能体应通过 Codex 的原生 Computer Use 插件控制本地
macOS 桌面时，请使用此页面。

## 直接使用 cua-driver MCP

Codex Computer Use 不是公开桌面控制的唯一方式。如果你希望
由 OpenClaw 管理的运行时直接调用 TryCua 的驱动，请通过 OpenClaw 的 MCP 注册表使用上游
`cua-driver mcp` 服务器，而不是使用
Codex 专用的市场流程。

安装 `cua-driver` 后，可以让它给出 OpenClaw 命令：

```bash
cua-driver mcp-config --client openclaw
```

或者自行注册 stdio 服务器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

这一路径会保持上游 MCP 工具表面不变，包括驱动
schema 和结构化 MCP 响应。当你希望 CUA 驱动
作为普通 OpenClaw MCP 服务器可用时，请使用它。当 Codex app-server 应在
Codex 模式轮次内拥有插件安装、MCP 重载和
原生工具调用时，请使用本页的 Codex Computer Use 设置。

CUA 的驱动仅适用于 macOS，并且仍需要其应用提示授予的本地 macOS 权限，
例如辅助功能和屏幕录制。OpenClaw
不会安装 `cua-driver`、授予这些权限，也不会绕过上游
驱动的安全模型。

## 快速设置

当 Codex 模式轮次必须在线程开始前具备
Computer Use 时，请设置 `plugins.entries.codex.config.computerUse`：

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
      model: "openai/gpt-5.5",
    },
  },
}
```

使用此配置时，OpenClaw 会在每个 Codex 模式轮次前检查 Codex app-server。
如果缺少 Computer Use，但 Codex app-server 已经发现了
可安装的市场，OpenClaw 会请求 Codex app-server 安装或重新启用
该插件并重载 MCP 服务器。在 macOS 上，如果没有注册匹配的市场，
但标准 Codex 应用包存在，OpenClaw 还会尝试先从
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 注册内置的 Codex 市场，
然后才会失败。如果设置仍然无法让 MCP 服务器可用，该轮次会在
线程开始前失败。

更改 Computer Use 配置后，如果现有 Codex 线程已经开始，请在测试前在受影响的聊天中使用 `/new` 或 `/reset`。

## 命令

在任何提供 `codex`
插件命令表面的聊天界面中使用 `/codex computer-use` 命令。这些是 OpenClaw 聊天/运行时命令，
不是 `openclaw codex ...` CLI 子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是只读的。它不会添加市场源、安装插件或
启用 Codex 插件支持。

`install` 会启用 Codex app-server 插件支持，可选地添加已配置的
市场源，通过 Codex app-server 安装或重新启用已配置的插件，
重载 MCP 服务器，并验证 MCP 服务器公开了工具。

## 市场选择

OpenClaw 使用 Codex 自身公开的同一 app-server API。
市场字段用于选择 Codex 应该在哪里查找 `computer-use`。

| 字段                | 适用场景                                                        | 安装支持                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 无市场字段 | 你希望 Codex app-server 使用它已经知道的市场。 | 是，当 app-server 返回本地市场时。        |
| `marketplaceSource`  | 你有一个 Codex 市场源，app-server 可以添加。         | 是，用于显式 `/codex computer-use install`。         |
| `marketplacePath`    | 你已经知道宿主机上的本地市场文件路径。   | 是，用于显式安装和轮次开始时自动安装。   |
| `marketplaceName`    | 你希望按名称选择一个已注册的市场。  | 仅当所选市场具有本地路径时支持。 |

新的 Codex 主目录可能需要一点时间来播种其官方市场。
安装期间，OpenClaw 会轮询 `plugin/list`，最长等待
`marketplaceDiscoveryTimeoutMs` 毫秒。默认值为 60 秒。

如果多个已知市场包含 Computer Use，OpenClaw 会优先选择
`openai-bundled`，然后是 `openai-curated`，再然后是 `local`。未知的歧义匹配
会以关闭方式失败，并要求你设置 `marketplaceName` 或 `marketplacePath`。

## 内置 macOS 市场

较新的 Codex 桌面版本会在这里内置 Computer Use：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

当 `computerUse.autoInstall` 为 true 且未注册任何包含
`computer-use` 的市场时，OpenClaw 会尝试自动添加标准内置
市场根目录：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以从 shell 使用 Codex 显式注册它：

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非标准的 Codex 应用路径，请将 `computerUse.marketplacePath` 设置为
本地市场文件路径，或运行一次 `/codex computer-use install --source
<marketplace-source>`。

## 远程目录限制

Codex app-server 可以列出并读取仅远程的目录条目，但目前不支持
远程 `plugin/install`。这意味着 `marketplaceName` 可以
为状态检查选择仅远程市场，但安装和重新启用
仍需要通过 `marketplaceSource` 或 `marketplacePath` 提供本地市场。

如果状态显示该插件在远程 Codex 市场中可用，但不支持远程
安装，请使用本地源或路径运行安装：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 配置参考

| 字段                           | 默认值        | 含义                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推断       | 要求 Computer Use。当设置了其他 Computer Use 字段时，默认为 true。 |
| `autoInstall`                   | false          | 在轮次开始时，从已发现的市场安装或重新启用。       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安装等待 Codex app-server 市场发现的时长。             |
| `marketplaceSource`             | 未设置          | 传给 Codex app-server `marketplace/add` 的源字符串。                    |
| `marketplacePath`               | 未设置          | 包含该插件的本地 Codex 市场文件路径。                       |
| `marketplaceName`               | 未设置          | 要选择的已注册 Codex 市场名称。                                   |
| `pluginName`                    | `computer-use` | Codex 市场插件名称。                                                 |
| `mcpServerName`                 | `computer-use` | 已安装插件公开的 MCP 服务器名称。                               |

轮次开始时的自动安装会有意拒绝已配置的 `marketplaceSource`
值。添加新源是显式设置操作，因此请先使用一次
`/codex computer-use install --source <marketplace-source>`，然后让
`autoInstall` 处理以后从已发现本地市场重新启用。
轮次开始时的自动安装可以使用已配置的 `marketplacePath`，因为那已经是
宿主机上的本地路径。

## OpenClaw 检查的内容

OpenClaw 会在内部报告稳定的设置原因，并为聊天格式化面向用户的
状态：

| 原因                       | 含义                                                | 后续步骤                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析为 false。               | 设置 `enabled` 或另一个 Computer Use 字段。  |
| `marketplace_missing`        | 没有可用的匹配市场。                 | 配置源、路径或市场名称。  |
| `plugin_not_installed`       | 市场存在，但插件未安装。   | 运行安装或启用 `autoInstall`。          |
| `plugin_disabled`            | 插件已安装，但在 Codex 配置中被禁用。      | 运行安装以重新启用它。                  |
| `remote_install_unsupported` | 所选市场仅为远程。                   | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 插件已启用，但 MCP 服务器不可用。  | 检查 Codex Computer Use 和操作系统权限。  |
| `ready`                      | 插件和 MCP 工具可用。                    | 开始 Codex 模式轮次。                    |
| `check_failed`               | 状态检查期间 Codex app-server 请求失败。 | 检查 app-server 连接和日志。       |
| `auto_install_blocked`       | 轮次开始设置需要添加新源。       | 先运行显式安装。                   |

聊天输出包括插件状态、MCP 服务器状态、市场、可用时的工具，
以及失败设置步骤的具体消息。

## macOS 权限

Computer Use 仅适用于 macOS。Codex 拥有的 MCP 服务器可能需要本地操作系统
权限，才能检查或控制应用。如果 OpenClaw 表示 Computer Use
已安装但 MCP 服务器不可用，请先验证 Codex 侧的 Computer
Use 设置：

- Codex app-server 正在应该执行桌面控制的同一主机上运行。
- Computer Use 插件已在 Codex 配置中启用。
- `computer-use` MCP 服务器会出现在 Codex app-server MCP 状态中。
- macOS 已授予 desktop-control 应用所需的权限。
- 当前主机会话可以访问正在控制的桌面。

当 `computerUse.enabled` 为 true 时，OpenClaw 会有意失败关闭。Codex 模式轮次不应在缺少配置所要求的原生桌面工具时静默继续。

## 故障排除

**Status 显示未安装。** 运行 `/codex computer-use install`。如果未发现 marketplace，请传入 `--source` 或 `--marketplace-path`。

**Status 显示已安装但已禁用。** 再次运行 `/codex computer-use install`。Codex app-server 安装会把插件配置写回为启用状态。

**Status 显示不支持远程安装。** 使用本地 marketplace 源或路径。仅远程的目录条目可以检查，但不能通过当前 app-server API 安装。

**Status 显示 MCP 服务器不可用。** 重新运行一次安装，让 MCP 服务器重新加载。如果仍不可用，请修复 Codex Computer Use 应用、Codex app-server MCP 状态或 macOS 权限。

**Status 或探测在 `computer-use.list_apps` 上超时。** 插件和 MCP 服务器都存在，但本地 Computer Use 桥接没有响应。退出或重启 Codex Computer Use，必要时重新启动 Codex Desktop，然后在新的 OpenClaw 会话中重试。

**Computer Use 工具显示 `Native hook relay unavailable`。** Codex 原生工具钩子无法通过本地桥接或 Gateway 网关回退连接到活动的 OpenClaw 中继。使用 `/new` 或 `/reset` 启动新的 OpenClaw 会话。如果持续发生，请重启 gateway，让旧的 app-server 线程和钩子注册被丢弃，然后重试。

**轮次开始自动安装拒绝某个源。** 这是有意设计。先使用显式的 `/codex computer-use install --source <marketplace-source>` 添加该源，之后轮次开始自动安装就可以使用已发现的本地 marketplace。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Peekaboo 桥接](/zh-CN/platforms/mac/peekaboo)
- [iOS 应用](/zh-CN/platforms/ios)
