---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Codex Computer Use
    - 你正在为内置的 Codex 插件配置 `computerUse`
    - 你正在排查 `/codex computer-use status` 或安装问题
summary: 为 Codex 模式的 OpenClaw 智能体设置 Codex Computer Use
title: Codex Computer Use
x-i18n:
    generated_at: "2026-04-27T23:00:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5ebd47014d64778c4c932e3fb73e5b48503fc2fe6fa7727199417ef902631b3
    source_path: plugins/codex-computer-use.md
    workflow: 15
---

Codex Computer Use 是一个 Codex 原生的 MCP 插件，用于本地桌面控制。OpenClaw
不会内置该桌面应用、不会自行执行桌面操作，也不会绕过
Codex 权限。内置的 `codex` 插件只负责准备 Codex app-server：
它会启用 Codex 插件支持，查找或安装已配置的 Codex
Computer Use 插件，检查 `computer-use` MCP 服务器是否可用，然后在
Codex 模式回合期间让 Codex 自行处理原生 MCP 工具调用。

当 OpenClaw 已经在使用原生 Codex harness 时，请使用本页。有关
运行时设置本身，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。

## 快速设置

当你需要让 Codex 模式回合在线程开始前就具备
Computer Use 可用性时，请设置 `plugins.entries.codex.config.computerUse`：

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
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

使用此配置后，OpenClaw 会在每次 Codex 模式回合前检查 Codex app-server。
如果缺少 Computer Use，但 Codex app-server 已经发现了可安装的
marketplace，OpenClaw 会请求 Codex app-server 安装或重新启用该
插件，并重新加载 MCP 服务器。如果设置后仍无法让 MCP 服务器可用，
则该回合会在线程开始前失败。

## 命令

在任何提供 `codex`
插件命令界面的聊天渠道中，都可以使用 `/codex computer-use` 命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是只读的。它不会添加 marketplace 来源、不会安装插件，也不会
启用 Codex 插件支持。

`install` 会启用 Codex app-server 插件支持，可选地添加一个已配置的
marketplace 来源，通过 Codex app-server 安装或重新启用已配置的插件，
重新加载 MCP 服务器，并验证该 MCP 服务器是否暴露了工具。

## Marketplace 选项

OpenClaw 使用与 Codex 本身公开的相同 app-server API。这些
marketplace 字段用于决定 Codex 应该从哪里查找 `computer-use`。

| 字段                 | 使用场景                                                     | 安装支持                                                     |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 不设置 marketplace 字段 | 你希望 Codex app-server 使用它已经知道的 marketplaces。      | 支持，当 app-server 返回本地 marketplace 时。                |
| `marketplaceSource`  | 你有一个 Codex marketplace 来源，app-server 可以添加它。     | 支持，用于显式执行 `/codex computer-use install`。           |
| `marketplacePath`    | 你已经知道主机上的本地 marketplace 文件路径。                | 支持，用于显式安装以及回合开始时的自动安装。                 |
| `marketplaceName`    | 你想按名称选择一个已经注册的 marketplace。                   | 仅当所选 marketplace 具有本地路径时支持。                    |

对于全新的 Codex 主目录，可能需要一点时间来初始化其官方 marketplaces。
在安装期间，OpenClaw 会轮询 `plugin/list`，最长持续
`marketplaceDiscoveryTimeoutMs` 毫秒。默认值为 60 秒。

如果多个已知 marketplace 都包含 Computer Use，OpenClaw 会优先选择
`openai-bundled`，然后是 `openai-curated`，再然后是 `local`。
对于未知的歧义匹配，系统会安全地拒绝继续，并要求你设置 `marketplaceName`
或 `marketplacePath`。

## 远程目录限制

Codex app-server 可以列出并读取仅远程的目录条目，但它目前
不支持远程 `plugin/install`。这意味着 `marketplaceName` 可以为状态检查
选择一个仅远程的 marketplace，但安装和重新启用仍然需要通过
`marketplaceSource` 或 `marketplacePath` 指定本地 marketplace。

如果状态显示该插件在远程 Codex marketplace 中可用，但不支持远程
安装，请使用本地来源或路径运行安装：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 配置参考

| 字段                            | 默认值         | 含义                                                         |
| ------------------------------- | -------------- | ------------------------------------------------------------ |
| `enabled`                       | 推断得出       | 要求启用 Computer Use。当设置了其他任何 Computer Use 字段时，默认值为 true。 |
| `autoInstall`                   | false          | 在线程开始时，从已发现的 marketplaces 中安装或重新启用。     |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安装等待 Codex app-server 完成 marketplace 发现的时长。      |
| `marketplaceSource`             | 未设置         | 传递给 Codex app-server `marketplace/add` 的来源字符串。     |
| `marketplacePath`               | 未设置         | 包含该插件的本地 Codex marketplace 文件路径。                |
| `marketplaceName`               | 未设置         | 要选择的已注册 Codex marketplace 名称。                      |
| `pluginName`                    | `computer-use` | Codex marketplace 插件名称。                                 |
| `mcpServerName`                 | `computer-use` | 已安装插件所暴露的 MCP 服务器名称。                          |

回合开始时的自动安装会有意拒绝使用已配置的 `marketplaceSource`
值。添加新来源是一项显式设置操作，因此请先使用
`/codex computer-use install --source <marketplace-source>` 执行一次，
之后再让 `autoInstall` 处理未来从已发现的本地 marketplaces 进行的重新启用。

## OpenClaw 会检查什么

OpenClaw 会在内部报告一个稳定的设置原因，并为聊天格式化面向用户的
状态信息：

| 原因                         | 含义                                                   | 下一步                                                |
| ---------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析结果为 false。               | 设置 `enabled` 或其他 Computer Use 字段。             |
| `marketplace_missing`        | 没有可用的匹配 marketplace。                           | 配置来源、路径或 marketplace 名称。                   |
| `plugin_not_installed`       | marketplace 存在，但插件未安装。                       | 运行 install 或启用 `autoInstall`。                   |
| `plugin_disabled`            | 插件已安装，但在 Codex 配置中被禁用。                  | 运行 install 以重新启用它。                           |
| `remote_install_unsupported` | 所选 marketplace 仅支持远程。                          | 使用 `marketplaceSource` 或 `marketplacePath`。       |
| `mcp_missing`                | 插件已启用，但 MCP 服务器不可用。                      | 检查 Codex Computer Use 和操作系统权限。              |
| `ready`                      | 插件和 MCP 工具都可用。                                | 启动 Codex 模式回合。                                 |
| `check_failed`               | 在状态检查期间，Codex app-server 请求失败。            | 检查 app-server 连接性和日志。                        |
| `auto_install_blocked`       | 回合开始时的设置需要添加一个新来源。                   | 先运行一次显式安装。                                  |

聊天输出会包含插件状态、MCP 服务器状态、marketplace，以及在可用时的
工具信息，并提供导致设置步骤失败的具体消息。

## macOS 权限

Computer Use 仅适用于 macOS。在 Codex 管理的 MCP 服务器能够检查或控制应用之前，
它可能需要本地操作系统权限。如果 OpenClaw 显示 Computer Use
已安装，但 MCP 服务器不可用，请先验证 Codex 侧的 Computer
Use 设置：

- Codex app-server 正在需要执行桌面控制的同一台主机上运行。
- Computer Use 插件已在 Codex 配置中启用。
- `computer-use` MCP 服务器出现在 Codex app-server MCP 状态中。
- macOS 已授予桌面控制应用所需的权限。
- 当前主机会话可以访问被控制的桌面。

当 `computerUse.enabled` 为 true 时，OpenClaw 会有意安全地拒绝继续。
如果配置要求使用原生桌面工具，Codex 模式回合就不应在缺少这些工具时静默继续。

## 故障排除

**状态显示未安装。** 运行 `/codex computer-use install`。如果未发现
marketplace，请传入 `--source` 或 `--marketplace-path`。

**状态显示已安装但被禁用。** 再次运行 `/codex computer-use install`。
Codex app-server 安装会将插件配置写回为启用状态。

**状态显示不支持远程安装。** 使用本地 marketplace 来源或
路径。仅远程的目录条目可以被检查，但无法通过当前的 app-server API
进行安装。

**状态显示 MCP 服务器不可用。** 再次运行一次安装，以便重新加载 MCP
服务器。如果仍然不可用，请修复 Codex Computer Use 应用、
Codex app-server MCP 状态或 macOS 权限问题。

**回合开始时的自动安装拒绝来源。** 这是有意为之。请先通过显式命令
`/codex computer-use install --source <marketplace-source>`
添加该来源，之后未来在回合开始时的自动安装就可以使用已发现的本地
marketplace。
