---
read_when:
    - 你希望代码模式 OpenClaw 智能体使用 Codex Computer Use
    - 你正在 Codex Computer Use、PeekabooBridge 和直接使用 cua-driver MCP 之间做选择
    - 你正在 Codex Computer Use 和直接的 cua-driver MCP 设置之间做选择
    - 你正在为内置 Codex 插件配置 computerUse
    - 你正在排查 /codex computer-use status 或 install 的问题
summary: 为 Codex 模式的 OpenClaw 智能体设置 Codex Computer Use
title: Codex Computer Use
x-i18n:
    generated_at: "2026-07-05T11:28:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ce6ef3a14f359b64855fee933425f40fc9f34e94572b68c7dee605ac896983f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use 是用于本地桌面控制的 Codex 原生 MCP 插件。OpenClaw
不会内置桌面应用、自行执行桌面操作，也不会绕过
Codex 权限。内置的 `codex` 插件只负责准备 Codex app-server：
它会启用 Codex 插件支持，查找或安装已配置的 Computer Use
插件，检查 `computer-use` MCP 服务器是否可用，然后在 Codex 模式轮次中让
Codex 拥有原生 MCP 工具调用。

当 OpenClaw 已经在使用原生 Codex harness 时，请使用此页面。关于
运行时设置本身，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。

## OpenClaw.app 和 Peekaboo

OpenClaw.app 的 Peekaboo 集成独立于 Codex Computer Use。macOS
应用可以托管 PeekabooBridge socket，使 `peekaboo` CLI 能够复用应用的本地辅助功能和屏幕录制授权，用于 Peekaboo
自己的自动化工具。该桥接不会安装或代理 Codex Computer Use，而
Codex Computer Use 也不会通过 PeekabooBridge socket 调用。

当你希望 OpenClaw.app 成为 Peekaboo CLI 自动化的权限感知型宿主时，请使用
[Peekaboo bridge](/zh-CN/platforms/mac/peekaboo)。当 Codex 模式的 OpenClaw
智能体应在轮次开始前拥有 Codex 原生 `computer-use` MCP 插件可用时，请使用此页面。

## iOS 应用

iOS 应用独立于 Codex Computer Use。它不会安装或代理
Codex `computer-use` MCP 服务器，也不是桌面控制后端。
相反，iOS 应用会作为 OpenClaw 节点连接，并通过 `canvas.*`、`camera.*`、`screen.*`、
`location.*` 和 `talk.*` 等节点命令公开移动端能力。

当你希望智能体通过 Gateway 网关驱动 iPhone 节点时，请使用 [iOS](/zh-CN/platforms/ios)。
当 Codex 模式智能体应通过 Codex 原生 Computer Use 插件控制本地 macOS
桌面时，请使用此页面。

## 直接使用 cua-driver MCP

Codex Computer Use 不是公开桌面控制的唯一方式。如果你希望
OpenClaw 管理的运行时直接调用 TryCua 的驱动，请通过 OpenClaw 的 MCP
注册表使用上游 `cua-driver mcp` 服务器，而不是 Codex 专用的 marketplace 流程。

安装 `cua-driver` 后，可以让它输出 OpenClaw 命令：

```bash
cua-driver mcp-config --client openclaw
```

也可以直接注册 stdio 服务器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

该路径会保持上游 MCP 工具表面不变，包括驱动 schema 和结构化 MCP
响应。当你希望 CUA 驱动作为普通 OpenClaw MCP 服务器可用时，请使用它。
当 Codex app-server 应在 Codex 模式轮次内拥有插件安装、MCP 重新加载和原生工具调用时，请使用本页的 Codex Computer Use 设置。

CUA 的驱动仅适用于 macOS，并且仍然需要其应用提示授予的本地 macOS
权限，例如辅助功能和屏幕录制。OpenClaw 不会安装 `cua-driver`、授予这些权限，也不会绕过上游驱动的安全模型。

## 快速设置

当 Codex 模式轮次必须在线程开始前拥有 Computer Use 可用时，请设置
`plugins.entries.codex.config.computerUse`。`autoInstall: true` 会选择启用
Computer Use，并允许 OpenClaw 在轮次前安装或重新启用它：

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
如果缺少 Computer Use，但 Codex app-server 已经发现了可安装的 marketplace，
OpenClaw 会请求 Codex app-server 安装或重新启用该插件，并重新加载 MCP 服务器。
在 macOS 上，如果没有注册匹配的 marketplace 且标准 Codex 应用包存在，
OpenClaw 还会尝试在失败前注册来自
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 的内置 Codex
marketplace。如果设置仍无法让 MCP 服务器可用，轮次会在线程开始前失败。

更改 Computer Use 配置后，如果现有 Codex 线程已经启动，请在测试前在受影响的聊天中使用 `/new` 或 `/reset`。

在 macOS 托管 stdio 启动中，OpenClaw 会优先使用位于
`/Applications/Codex.app/Contents/Resources/codex` 的已签名桌面 Codex 应用包（如果存在）。
这会让 Computer Use 处于拥有本地桌面控制权限的应用包之下。如果未安装桌面应用，
OpenClaw 会回退到安装在插件旁边的托管 Codex 二进制文件。如果已安装的桌面应用以不支持的 app-server
版本初始化，OpenClaw 会关闭该子进程并重试下一个托管二进制候选项，而不是让过期的桌面应用遮蔽插件本地回退。
显式的 `appServer.command` 配置或 `OPENCLAW_CODEX_APP_SERVER_BIN` 仍会覆盖此托管选择。

## 命令

在任何可使用 `codex` 插件命令表面的聊天界面中使用 `/codex computer-use`
命令。这些是 OpenClaw 聊天/运行时命令，不是 `openclaw codex ...` CLI 子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是默认操作，并且是只读的：它不会添加 marketplace
源、安装插件或启用 Codex 插件支持。如果没有配置选择启用 Computer Use，
即使执行过一次性安装命令，`status` 也可能报告为已禁用。

`install` 会启用 Codex app-server 插件支持，可选地添加已配置的
marketplace 源，通过 Codex app-server 安装或重新启用已配置的插件，重新加载 MCP
服务器，并验证 MCP 服务器是否公开工具。由于安装会更改受信任的主机资源，
只有所有者或 `operator.admin` Gateway 网关客户端可以运行 `install`。其他已授权发送者可以继续使用只读的 `status`
命令，包括带覆盖项的用法。

## Marketplace 选择

OpenClaw 使用 Codex 自身公开的同一套 app-server API。marketplace
字段选择 Codex 应从哪里查找 `computer-use`。

| 字段                 | 使用场景                                                        | 安装支持                                                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 无 marketplace 字段 | 你希望 Codex app-server 使用它已知的 marketplace。              | 支持，当 app-server 返回本地 marketplace 时。            |
| `marketplaceSource`  | 你有一个 app-server 可添加的 Codex marketplace 源。             | 支持，用于显式 `/codex computer-use install`。           |
| `marketplacePath`    | 你已经知道主机上的本地 marketplace 文件路径。                   | 支持，用于显式安装和轮次开始自动安装。                  |
| `marketplaceName`    | 你希望按名称选择一个已注册的 marketplace。                      | 仅当所选 marketplace 有本地路径时支持。                 |

新的 Codex home 可能需要一小段时间来写入其官方
marketplace。安装期间，OpenClaw 会轮询 `plugin/list`，最长持续
`marketplaceDiscoveryTimeoutMs` 毫秒（默认 60 秒）。

如果多个已知 marketplace 包含 Computer Use，OpenClaw 会优先选择
`openai-bundled`，然后是 `openai-curated`，再是 `local`。未知且有歧义的匹配会失败关闭，并要求你设置 `marketplaceName` 或
`marketplacePath`。

## 内置 macOS marketplace

较新的 Codex 桌面构建会在此处内置 Computer Use：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

当 `computerUse.autoInstall` 为 true 且没有注册包含
`computer-use` 的 marketplace 时，OpenClaw 会尝试自动添加标准的内置
marketplace 根目录：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以使用 Codex 从 shell 显式注册它：

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

如果你使用非标准 Codex 应用路径，请运行一次 `/codex computer-use install
--source <marketplace-root>`，或将 `computerUse.marketplacePath` 设置为本地 marketplace
文件路径。只有当你拥有 marketplace JSON 文件路径时，才使用 `--marketplace-path`，不要用于内置 marketplace 根目录。

## 远程目录限制

Codex app-server 可以列出和读取仅远程目录条目，但目前不支持远程
`plugin/install`。这意味着 `marketplaceName` 可以为状态检查选择仅远程
marketplace，但安装和重新启用仍需要通过 `marketplaceSource` 或
`marketplacePath` 提供本地 marketplace。

如果状态显示该插件在远程 Codex marketplace 中可用，但不支持远程安装，请使用本地源或路径运行安装：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 配置参考

| 字段                            | 默认值         | 含义                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | 要求 Computer Use。当设置了另一个 Computer Use 字段时，默认值为 true。         |
| `autoInstall`                   | false          | 在轮次开始时，从已发现的 marketplace 安装或重新启用。                         |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安装等待 Codex app-server marketplace 发现的时长。                             |
| `marketplaceSource`             | unset          | 传给 Codex app-server `marketplace/add` 的源字符串。                           |
| `marketplacePath`               | unset          | 包含该插件的本地 Codex marketplace 文件路径。                                  |
| `marketplaceName`               | unset          | 要选择的已注册 Codex marketplace 名称。                                        |
| `pluginName`                    | `computer-use` | Codex marketplace 插件名称。                                                   |
| `mcpServerName`                 | `computer-use` | 已安装插件公开的 MCP 服务器名称。                                              |

轮次开始自动安装会有意拒绝已配置的 `marketplaceSource`
值。添加新源是显式设置操作，因此请先运行一次
`/codex computer-use install --source <marketplace-source>`，然后让
`autoInstall` 处理之后从已发现本地 marketplace 重新启用的操作。
轮次开始自动安装可以使用已配置的 `marketplacePath`，因为它已经是主机上的本地路径。

每个字段也接受环境变量覆盖，并在匹配的配置键未设置时检查：

| 字段                            | 环境变量                                                       |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## OpenClaw 会检查什么

OpenClaw 会在内部报告稳定的设置原因，并为聊天格式化面向用户的状态：

| 原因                         | 含义                                                   | 下一步                                        |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析为 false。                  | 设置 `enabled` 或另一个 Computer Use 字段。  |
| `marketplace_missing`        | 没有可用的匹配 marketplace。                          | 配置 source、路径或 marketplace 名称。       |
| `plugin_not_installed`       | Marketplace 存在，但插件未安装。                      | 运行安装或启用 `autoInstall`。               |
| `plugin_disabled`            | 插件已安装，但在 Codex 配置中被禁用。                 | 运行安装以重新启用它。                       |
| `remote_install_unsupported` | 所选 marketplace 仅支持远程。                         | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 插件已启用，但 MCP 服务器不可用。                     | 检查 Codex Computer Use 和 OS 权限。          |
| `ready`                      | 插件和 MCP 工具可用。                                 | 开始 Codex 模式轮次。                        |
| `check_failed`               | 状态检查期间 Codex app-server 请求失败。              | 检查 app-server 连接和日志。                 |
| `auto_install_blocked`       | 轮次开始设置需要添加新 source。                       | 先运行显式安装。                             |

聊天输出包含插件状态、MCP 服务器状态、marketplace、可用时的工具，以及失败设置步骤的具体消息。

## macOS 权限

Computer Use 特定于 macOS。Codex 所属的 MCP 服务器可能需要本地 OS 权限，才能检查或控制应用。如果 OpenClaw 提示 Computer Use 已安装但 MCP 服务器不可用，请先验证 Codex 侧的 Computer Use 设置：

- Codex app-server 正在应执行桌面控制的同一主机上运行。
- Computer Use 插件已在 Codex 配置中启用。
- `computer-use` MCP 服务器出现在 Codex app-server MCP 状态中。
- macOS 已向桌面控制应用授予所需权限。
- 当前主机会话可以访问被控制的桌面。

当 `computerUse.enabled` 为 true 时，OpenClaw 会有意失败关闭。Codex 模式轮次不应在缺少配置所要求的原生桌面工具时静默继续。

## 故障排查

**状态显示未安装。** 运行 `/codex computer-use install`。如果未发现 marketplace，请传入 `--source` 或 `--marketplace-path`。

**状态显示已安装但被禁用。** 再次运行 `/codex computer-use install`。Codex app-server 安装会将插件配置写回为启用状态。

**状态显示不支持远程安装。** 使用本地 marketplace source 或路径。仅远程的 catalog 条目可以检查，但不能通过当前 app-server API 安装。

**状态显示 MCP 服务器不可用。** 重新运行一次安装，让 MCP 服务器重新加载。如果仍不可用，请修复 Codex Computer Use 应用、Codex app-server MCP 状态或 macOS 权限。

**状态或对 `computer-use.list_apps` 的探测超时。** 插件和 MCP 服务器都存在，但本地 Computer Use 桥接没有响应。退出或重启 Codex Computer Use，必要时重新启动 Codex Desktop，然后在新的 OpenClaw 会话中重试。如果主机之前通过较旧的托管 Codex app-server 运行过 Computer Use，请从桌面内置 marketplace 刷新已安装的插件：

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use 工具提示 `Native hook relay unavailable`。** Codex 原生工具钩子无法通过本地桥接或 Gateway 网关回退连接到活动的 OpenClaw relay。使用 `/new` 或 `/reset` 启动新的 OpenClaw 会话。如果它先成功一次，但之后的工具调用又失败，说明 `/new` 只是清理了当前尝试；请重启 Codex app-server 或 OpenClaw Gateway 网关，以丢弃旧线程和钩子注册，然后在新会话中重试。

**轮次开始自动安装拒绝 source。** 这是有意行为。先用显式 `/codex computer-use install --source
<marketplace-source>` 添加 source，之后的轮次开始自动安装就可以使用已发现的本地 marketplace。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Peekaboo 桥接](/zh-CN/platforms/mac/peekaboo)
- [iOS 应用](/zh-CN/platforms/ios)
