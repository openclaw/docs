---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Codex Computer Use
    - 你正在为内置的 Codex 插件配置 `computerUse`
    - 你正在排查 `/codex computer-use status` 或安装问题
summary: 为 Codex 模式的 OpenClaw 智能体设置 Codex Computer Use
title: Codex Computer Use
x-i18n:
    generated_at: "2026-04-27T23:44:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48252f6bc55a1aa9e10f5053d6daaa58787cabf9bcd45ce545a5c23e80e539
    source_path: plugins/codex-computer-use.md
    workflow: 15
---

Codex Computer Use 是一个 Codex 原生 MCP 插件，用于本地桌面控制。OpenClaw
不会内置这个桌面应用、不会自行执行桌面操作，也不会绕过
Codex 权限。内置的 `codex` 插件只负责准备 Codex app-server：
它会启用 Codex 插件支持，查找或安装已配置的 Codex
Computer Use 插件，检查 `computer-use` MCP 服务器是否可用，然后在 Codex 模式轮次中让 Codex 自行处理原生 MCP 工具调用。

当 OpenClaw 已经在使用原生 Codex harness 时，请使用本页面。关于
运行时本身的设置，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。

## 快速设置

当你需要在会话开始前确保 Codex 模式轮次可用 Computer Use 时，请设置 `plugins.entries.codex.config.computerUse`：

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

使用此配置后，OpenClaw 会在每次 Codex 模式轮次前检查 Codex app-server。
如果 Computer Use 缺失，但 Codex app-server 已经发现了一个可安装的市场，OpenClaw 会请求 Codex app-server 安装或重新启用该插件，并重新加载 MCP 服务器。在 macOS 上，如果没有注册任何匹配的市场，且标准的 Codex 应用 bundle 存在，OpenClaw 还会尝试从
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 注册内置的 Codex 市场，然后才会失败。如果设置仍然无法让 MCP 服务器可用，则该轮次会在会话开始前失败。

现有会话会保留其运行时和 Codex 线程绑定。更改 `agentRuntime` 或
Computer Use 配置后，请在受影响的聊天中使用 `/new` 或 `/reset`，然后再测试。

## 命令

在任何提供 `codex`
插件命令界面的聊天入口中，都可以使用 `/codex computer-use` 命令。这些是 OpenClaw 聊天/运行时命令，而不是 `openclaw codex ...` CLI 子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是只读的。它不会添加市场来源、安装插件，也不会启用 Codex 插件支持。

`install` 会启用 Codex app-server 插件支持，可选择添加已配置的市场来源，通过 Codex app-server 安装或重新启用已配置的插件，重新加载 MCP 服务器，并验证 MCP 服务器是否暴露了工具。

## 市场选择

OpenClaw 使用与 Codex 自身暴露相同的 app-server API。这些市场字段决定了 Codex 应该从哪里找到 `computer-use`。

| Field                | Use when                                                        | Install support                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 无市场字段 | 你希望 Codex app-server 使用它已经知道的市场。 | 是，当 app-server 返回本地市场时。 |
| `marketplaceSource`  | 你有一个 Codex 市场来源，app-server 可以添加它。         | 是，用于显式执行 `/codex computer-use install`。         |
| `marketplacePath`    | 你已经知道主机上的本地市场文件路径。   | 是，用于显式安装和轮次开始时的自动安装。   |
| `marketplaceName`    | 你想按名称选择一个已经注册的市场。  | 仅当所选市场具有本地路径时才支持。 |

全新的 Codex 主目录可能需要一点时间来初始化其官方市场。在安装过程中，OpenClaw 会轮询 `plugin/list`，最多等待
`marketplaceDiscoveryTimeoutMs` 毫秒。默认值为 60 秒。

如果多个已知市场都包含 Computer Use，OpenClaw 会优先选择
`openai-bundled`，然后是 `openai-curated`，再然后是 `local`。
如果遇到未知且存在歧义的匹配，系统会以安全关闭方式失败，并要求你设置 `marketplaceName` 或 `marketplacePath`。

## 内置 macOS 市场

较新的 Codex 桌面版本会在这里内置 Computer Use：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

当 `computerUse.autoInstall` 为 true 且没有任何包含
`computer-use` 的市场被注册时，OpenClaw 会尝试自动添加标准的内置市场根目录：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以在 shell 中通过 Codex 显式注册它：

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

如果你使用的是非标准的 Codex 应用路径，请将 `computerUse.marketplacePath` 设置为本地市场文件路径，或者执行一次 `/codex computer-use install --source
<marketplace-source>`。

## 远程目录限制

Codex app-server 可以列出并读取仅远程的目录条目，但它目前
不支持远程 `plugin/install`。这意味着 `marketplaceName` 可以为状态检查选择一个仅远程的市场，但安装和重新启用仍然需要通过 `marketplaceSource` 或 `marketplacePath` 提供本地市场。

如果状态显示该插件可在远程 Codex 市场中使用，但远程安装不受支持，请使用本地来源或路径执行安装：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 配置参考

| Field                           | Default        | Meaning                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | 推断得出       | 要求启用 Computer Use。当设置了其他 Computer Use 字段时，默认值为 true。 |
| `autoInstall`                   | false          | 在轮次开始时，从已发现的市场安装或重新启用。       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安装等待 Codex app-server 完成市场发现的时长。             |
| `marketplaceSource`             | 未设置          | 传递给 Codex app-server `marketplace/add` 的来源字符串。                    |
| `marketplacePath`               | 未设置          | 包含该插件的本地 Codex 市场文件路径。                       |
| `marketplaceName`               | 未设置          | 要选择的已注册 Codex 市场名称。                                   |
| `pluginName`                    | `computer-use` | Codex 市场中的插件名称。                                                 |
| `mcpServerName`                 | `computer-use` | 已安装插件暴露的 MCP 服务器名称。                               |

轮次开始时的自动安装会有意拒绝已配置的 `marketplaceSource`
值。添加新的来源是一项显式设置操作，因此请先使用
`/codex computer-use install --source <marketplace-source>` 执行一次，然后再让
`autoInstall` 处理未来从已发现的本地市场进行的重新启用。
轮次开始时的自动安装可以使用已配置的 `marketplacePath`，因为它已经是主机上的本地路径。

## OpenClaw 会检查什么

OpenClaw 会在内部报告稳定的设置原因，并为聊天格式化面向用户的状态信息：

| Reason                       | Meaning                                                | Next step                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` 解析结果为 false。               | 设置 `enabled` 或其他 Computer Use 字段。  |
| `marketplace_missing`        | 没有可用的匹配市场。                 | 配置来源、路径或市场名称。  |
| `plugin_not_installed`       | 市场存在，但插件未安装。   | 运行安装或启用 `autoInstall`。          |
| `plugin_disabled`            | 插件已安装，但在 Codex 配置中被禁用。      | 运行安装以重新启用它。                  |
| `remote_install_unsupported` | 所选市场仅支持远程。                   | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 插件已启用，但 MCP 服务器不可用。  | 检查 Codex Computer Use 和操作系统权限。  |
| `ready`                      | 插件和 MCP 工具均可用。                    | 开始 Codex 模式轮次。                    |
| `check_failed`               | 状态检查期间某个 Codex app-server 请求失败。 | 检查 app-server 连通性和日志。       |
| `auto_install_blocked`       | 轮次开始时的设置需要添加新的来源。       | 先运行显式安装。                   |

聊天输出会包含插件状态、MCP 服务器状态、市场信息、可用工具，以及失败设置步骤对应的具体消息。

## macOS 权限

Computer Use 是 macOS 专用功能。由 Codex 拥有的 MCP 服务器可能需要本地操作系统权限，才能检查或控制应用。如果 OpenClaw
显示 Computer Use 已安装，但 MCP 服务器不可用，请先验证 Codex 侧的
Computer Use 设置：

- Codex app-server 正在与你希望执行桌面控制的同一主机上运行。
- Computer Use 插件已在 Codex 配置中启用。
- `computer-use` MCP 服务器出现在 Codex app-server 的 MCP 状态中。
- macOS 已授予桌面控制应用所需的权限。
- 当前主机会话可以访问要控制的桌面。

当 `computerUse.enabled` 为 true 时，OpenClaw 会有意以安全关闭方式失败。
如果配置要求原生桌面工具，Codex 模式轮次就不应在缺少这些工具时静默继续执行。

## 故障排除

**状态显示未安装。** 运行 `/codex computer-use install`。如果未发现市场，请传入 `--source` 或 `--marketplace-path`。

**状态显示已安装但已禁用。** 再次运行 `/codex computer-use install`。
Codex app-server 安装会将插件配置写回为启用状态。

**状态显示不支持远程安装。** 使用本地市场来源或
路径。仅远程目录条目可以被检查，但不能通过当前的 app-server API 安装。

**状态显示 MCP 服务器不可用。** 重新运行一次安装，以便重新加载 MCP
服务器。如果仍然不可用，请修复 Codex Computer Use 应用、
Codex app-server MCP 状态或 macOS 权限。

**在 `computer-use.list_apps` 上，状态或探测请求超时。** 插件和 MCP
服务器都已存在，但本地 Computer Use 桥接没有响应。退出或重启
Codex Computer Use，如有需要重新启动 Codex Desktop，然后在新的
OpenClaw 会话中重试。

**某个 Computer Use 工具提示 `Native hook relay unavailable`。** Codex 原生
工具钩子到达 OpenClaw 时，关联的 relay 注册已过期或缺失。请使用 `/new` 或 `/reset` 启动一个新的 OpenClaw 会话。如果问题持续发生，请重启 Gateway 网关，以便丢弃旧的 app-server 线程和钩子注册，然后再重试。

**轮次开始时的自动安装拒绝某个来源。** 这是有意的。请先通过显式命令 `/codex computer-use install --source <marketplace-source>`
添加该来源，之后未来的轮次开始自动安装就可以使用已发现的本地
市场。
