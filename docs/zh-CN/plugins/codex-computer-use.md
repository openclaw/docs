---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Codex Computer Use
    - 你正在 Codex Computer Use、PeekabooBridge 和直接使用 cua-driver MCP 之间做选择
    - 你正在 Codex Computer Use 和直接的 cua-driver MCP 设置之间做选择
    - 你正在为内置 Codex 插件配置 computerUse
    - 你正在排查 /codex computer-use status 或 install
summary: 为 Codex 模式的 OpenClaw 智能体设置 Codex Computer Use
title: Codex 计算机使用
x-i18n:
    generated_at: "2026-04-29T21:01:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use 是用于本地桌面控制的 Codex 原生 MCP 插件。OpenClaw
不会内置该桌面应用、自己执行桌面操作，也不会绕过 Codex 权限。内置的 `codex` 插件只会准备 Codex app-server：
它会启用 Codex 插件支持，查找或安装已配置的 Codex
Computer Use 插件，检查 `computer-use` MCP 服务器是否可用，然后
在 Codex 模式回合期间让 Codex 拥有原生 MCP 工具调用。

当 OpenClaw 已经在使用原生 Codex harness 时，请使用本页面。关于
运行时设置本身，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。

## OpenClaw.app 和 Peekaboo

OpenClaw.app 的 Peekaboo 集成独立于 Codex Computer Use。该
macOS 应用可以托管一个 PeekabooBridge socket，以便 `peekaboo` CLI 可以复用该
应用本地的辅助功能和屏幕录制授权，供 Peekaboo 自己的
自动化工具使用。该 bridge 不会安装或代理 Codex Computer Use，并且
Codex Computer Use 不会通过 PeekabooBridge socket 调用。

当你希望 OpenClaw.app 成为 Peekaboo CLI 自动化的
权限感知主机时，请使用 [Peekaboo bridge](/zh-CN/platforms/mac/peekaboo)。当一个
Codex 模式的 OpenClaw 智能体需要在回合开始前可用 Codex 原生的 `computer-use` MCP 插件时，请使用本页面。

## iOS 应用

iOS 应用独立于 Codex Computer Use。它不会安装或代理
Codex `computer-use` MCP 服务器，也不是桌面控制后端。
相反，iOS 应用会作为 OpenClaw 节点连接，并通过节点命令暴露移动端
能力，例如 `canvas.*`、`camera.*`、`screen.*`、
`location.*` 和 `talk.*`。

当你希望智能体通过 Gateway 网关驱动 iPhone 节点时，请使用 [iOS](/zh-CN/platforms/ios)。
当 Codex 模式智能体应通过 Codex 原生 Computer Use 插件控制本地
macOS 桌面时，请使用本页面。

## 直接使用 cua-driver MCP

Codex Computer Use 不是暴露桌面控制的唯一方式。如果你希望
OpenClaw 管理的运行时直接调用 TryCua 的 driver，请通过 OpenClaw 的 MCP 注册表使用上游
`cua-driver mcp` 服务器，而不是 Codex 专用的 marketplace 流程。

安装 `cua-driver` 后，可以让它输出 OpenClaw 命令：

```bash
cua-driver mcp-config --client openclaw
```

或者自行注册 stdio 服务器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

这条路径会保持上游 MCP 工具表面不变，包括 driver
schema 和结构化 MCP 响应。当你希望 CUA driver
作为普通 OpenClaw MCP 服务器可用时，请使用它。当 Codex app-server 应在
Codex 模式回合内负责插件安装、MCP 重载和原生工具调用时，请使用本页面的
Codex Computer Use 设置。

CUA 的 driver 仅适用于 macOS，并且仍然需要其应用提示的本地 macOS 权限，
例如辅助功能和屏幕录制。OpenClaw
不会安装 `cua-driver`、授予这些权限，也不会绕过上游
driver 的安全模型。

## 快速设置

当 Codex 模式回合必须在 thread 开始前可用
Computer Use 时，设置 `plugins.entries.codex.config.computerUse`：

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
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

使用此配置时，OpenClaw 会在每个 Codex 模式回合前检查 Codex app-server。
如果缺少 Computer Use，但 Codex app-server 已经发现了可安装的
marketplace，OpenClaw 会要求 Codex app-server 安装或重新启用
该插件并重载 MCP 服务器。在 macOS 上，如果没有注册匹配的 marketplace，
并且标准 Codex 应用 bundle 存在，OpenClaw 还会尝试从
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 注册内置 Codex marketplace，
然后才会失败。如果设置仍然无法让 MCP 服务器可用，该回合会在
thread 开始前失败。

现有会话会保留其运行时和 Codex thread 绑定。更改
`agentRuntime` 或 Computer Use 配置后，请在受影响的
聊天中使用 `/new` 或 `/reset`，然后再测试。

## 命令

在任何提供 `codex` 插件命令表面的聊天界面中使用 `/codex computer-use`
命令。这些是 OpenClaw 聊天/运行时命令，
不是 `openclaw codex ...` CLI 子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是只读的。它不会添加 marketplace source、安装插件，也不会
启用 Codex 插件支持。

`install` 会启用 Codex app-server 插件支持，可选地添加已配置的
marketplace source，通过 Codex app-server 安装或重新启用已配置的插件，
重载 MCP 服务器，并验证 MCP 服务器是否暴露工具。

## Marketplace 选择

OpenClaw 使用 Codex 自身暴露的同一个 app-server API。
marketplace 字段用于选择 Codex 应从哪里找到 `computer-use`。

| 字段                 | 适用场景                                                        | 安装支持                                                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 无 marketplace 字段  | 你希望 Codex app-server 使用它已知的 marketplace。              | 是，当 app-server 返回本地 marketplace 时。              |
| `marketplaceSource`  | 你有 Codex app-server 可以添加的 Codex marketplace source。     | 是，用于显式 `/codex computer-use install`。             |
| `marketplacePath`    | 你已经知道主机上的本地 marketplace 文件路径。                   | 是，用于显式安装和回合开始自动安装。                     |
| `marketplaceName`    | 你希望按名称选择一个已注册的 marketplace。                      | 仅当所选 marketplace 有本地路径时支持。                  |

新的 Codex home 可能需要短暂时间来填充官方 marketplace。
安装期间，OpenClaw 会轮询 `plugin/list`，最长
`marketplaceDiscoveryTimeoutMs` 毫秒。默认值为 60 秒。

如果多个已知 marketplace 包含 Computer Use，OpenClaw 会优先选择
`openai-bundled`，然后是 `openai-curated`，再是 `local`。未知的歧义匹配
会安全失败，并要求你设置 `marketplaceName` 或 `marketplacePath`。

## 内置 macOS marketplace

近期 Codex 桌面版构建会在这里内置 Computer Use：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

当 `computerUse.autoInstall` 为 true 且没有注册包含
`computer-use` 的 marketplace 时，OpenClaw 会尝试自动添加标准内置
marketplace 根目录：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以从 shell 使用 Codex 显式注册它：

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非标准 Codex 应用路径，请将 `computerUse.marketplacePath` 设置为
本地 marketplace 文件路径，或先运行一次 `/codex computer-use install --source
<marketplace-source>`。

## 远程目录限制

Codex app-server 可以列出和读取仅远程目录条目，但目前不支持
远程 `plugin/install`。这意味着 `marketplaceName` 可以选择仅远程
marketplace 用于状态检查，但安装和重新启用仍然需要通过
`marketplaceSource` 或 `marketplacePath` 提供本地 marketplace。

如果状态显示该插件在远程 Codex marketplace 中可用，但不支持远程
安装，请使用本地 source 或 path 运行 install：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 配置参考

| 字段                            | 默认值         | 含义                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推断           | 要求 Computer Use。设置其他 Computer Use 字段时默认为 true。                  |
| `autoInstall`                   | false          | 在回合开始时从已发现的 marketplace 安装或重新启用。                           |
| `marketplaceDiscoveryTimeoutMs` | 60000          | install 等待 Codex app-server marketplace 发现的时长。                        |
| `marketplaceSource`             | 未设置         | 传递给 Codex app-server `marketplace/add` 的 source 字符串。                  |
| `marketplacePath`               | 未设置         | 包含该插件的本地 Codex marketplace 文件路径。                                  |
| `marketplaceName`               | 未设置         | 要选择的已注册 Codex marketplace 名称。                                        |
| `pluginName`                    | `computer-use` | Codex marketplace 插件名称。                                                    |
| `mcpServerName`                 | `computer-use` | 已安装插件暴露的 MCP 服务器名称。                                              |

回合开始自动安装会有意拒绝已配置的 `marketplaceSource`
值。添加新 source 是显式设置操作，因此请先使用
`/codex computer-use install --source <marketplace-source>` 一次，然后让
`autoInstall` 以后从已发现的本地 marketplace 处理重新启用。
回合开始自动安装可以使用已配置的 `marketplacePath`，因为它
已经是主机上的本地路径。

## OpenClaw 会检查什么

OpenClaw 会在内部报告稳定的设置原因，并为聊天格式化面向用户的
Status：

| 原因                         | 含义                                                   | 下一步                                        |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析为 false。                   | 设置 `enabled` 或其他 Computer Use 字段。     |
| `marketplace_missing`        | 没有可用的匹配 marketplace。                           | 配置 source、path 或 marketplace name。       |
| `plugin_not_installed`       | marketplace 存在，但插件未安装。                       | 运行 install 或启用 `autoInstall`。           |
| `plugin_disabled`            | 插件已安装，但在 Codex 配置中被禁用。                  | 运行 install 以重新启用它。                   |
| `remote_install_unsupported` | 所选 marketplace 仅远程可用。                          | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 插件已启用，但 MCP 服务器不可用。                      | 检查 Codex Computer Use 和操作系统权限。      |
| `ready`                      | 插件和 MCP 工具可用。                                  | 开始 Codex 模式回合。                         |
| `check_failed`               | 状态检查期间 Codex app-server 请求失败。               | 检查 app-server 连接和日志。                  |
| `auto_install_blocked`       | 回合开始设置需要添加新 source。                        | 先运行显式 install。                          |

聊天输出包含插件状态、MCP 服务器状态、marketplace、可用时的工具，
以及失败设置步骤的具体消息。

## macOS 权限

Computer Use 仅适用于 macOS。Codex 拥有的 MCP 服务器可能需要本地操作系统
权限，才能检查或控制应用。如果 OpenClaw 表示 Computer Use
已安装但 MCP 服务器不可用，请先验证 Codex 侧的 Computer
Use 设置：

- Codex app-server 正在应发生桌面控制的同一台主机上运行。
- Codex 配置中已启用 Computer Use 插件。
- `computer-use` MCP 服务器出现在 Codex app-server MCP Status 中。
- macOS 已为桌面控制应用授予所需权限。
- 当前主机会话可以访问正在控制的桌面。

当 `computerUse.enabled` 为 true 时，OpenClaw 会有意采用失败即关闭策略。
Codex 模式的轮次不应在缺少配置所要求的原生桌面工具时静默继续。

## 故障排除

**Status 显示未安装。** 运行 `/codex computer-use install`。如果未发现
marketplace，请传入 `--source` 或 `--marketplace-path`。

**Status 显示已安装但已禁用。** 再次运行 `/codex computer-use install`。
Codex app-server 安装会把插件配置写回为启用状态。

**Status 显示不支持远程安装。** 使用本地 marketplace 源或路径。仅远程目录条目可以检查，但不能通过当前 app-server API 安装。

**Status 显示 MCP 服务器不可用。** 重新运行一次安装，以便 MCP
服务器重新加载。如果仍不可用，请修复 Codex Computer Use 应用、Codex app-server MCP Status，或 macOS 权限。

**Status 或探测在 `computer-use.list_apps` 上超时。** 插件和 MCP
服务器已存在，但本地 Computer Use 桥接没有响应。退出或重启 Codex Computer Use，必要时重新启动 Codex Desktop，然后在新的 OpenClaw 会话中重试。

**某个 Computer Use 工具显示 `Native hook relay unavailable`。** Codex 原生工具钩子无法通过本地桥接或 Gateway 网关回退连接到活动的 OpenClaw 中继。使用 `/new` 或 `/reset` 启动新的 OpenClaw 会话。如果持续发生，请重启 Gateway 网关，以丢弃旧的 app-server 线程和钩子注册，然后重试。

**轮次开始时自动安装拒绝某个源。** 这是有意设计。请先使用显式的 `/codex computer-use install --source <marketplace-source>` 添加该源，之后轮次开始时的自动安装就可以使用已发现的本地 marketplace。
