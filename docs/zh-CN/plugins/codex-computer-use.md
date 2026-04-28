---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Codex Computer Use
    - 你正在在 Codex Computer Use、PeekabooBridge 和直接使用 cua-driver MCP 之间做出选择
    - 你正在在 Codex Computer Use 和直接设置 cua-driver MCP 之间做出选择
    - 你正在为内置的 Codex 插件配置 `computerUse`
    - 你正在排查 `/codex computer-use status` 或安装问题
summary: 为 Codex 模式的 OpenClaw 智能体设置 Codex Computer Use
title: Codex Computer Use
x-i18n:
    generated_at: "2026-04-28T00:47:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c25979c09747ac133df473f25c3d5bca34324fd5b1c047d41545ef675267618
    source_path: plugins/codex-computer-use.md
    workflow: 15
---

Computer Use 是一个面向 Codex 的原生 MCP 插件，用于本地桌面控制。OpenClaw 不会内置这个桌面应用、不会自行执行桌面操作，也不会绕过 Codex 的权限控制。内置的 `codex` 插件只负责准备 Codex app-server：它会启用 Codex 插件支持、查找或安装已配置的 Codex Computer Use 插件、检查 `computer-use` MCP 服务器是否可用，然后在 Codex 模式回合中让 Codex 自行接管原生 MCP 工具调用。

当 OpenClaw 已经在使用原生 Codex harness 时，请使用本页。关于运行时本身的设置，请参见 [Codex harness](/zh-CN/plugins/codex-harness)。

## OpenClaw.app 和 Peekaboo

OpenClaw.app 的 Peekaboo 集成与 Codex Computer Use 是分开的。macOS 应用可以托管一个 PeekabooBridge socket，以便 `peekaboo` CLI 复用应用本地的辅助功能和屏幕录制授权，供 Peekaboo 自身的自动化工具使用。这个 bridge 不会安装或代理 Codex Computer Use，而 Codex Computer Use 也不会通过 PeekabooBridge socket 调用。

当你希望 OpenClaw.app 作为具备权限感知能力的主机来承载 Peekaboo CLI 自动化时，请使用 [Peekaboo bridge](/zh-CN/platforms/mac/peekaboo)。当你希望 Codex 模式的 OpenClaw 智能体在回合开始前就具备 Codex 原生的 `computer-use` MCP 插件时，请使用本页。

## iOS 应用

iOS 应用与 Codex Computer Use 是分开的。它不会安装或代理 Codex 的 `computer-use` MCP 服务器，也不是桌面控制后端。相反，iOS 应用会作为 OpenClaw 节点连接，并通过 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*` 等节点命令暴露移动端能力。

当你希望智能体通过 Gateway 网关驱动一个 iPhone 节点时，请使用 [iOS](/zh-CN/platforms/ios)。当你希望 Codex 模式智能体通过 Codex 原生 Computer Use 插件控制本地 macOS 桌面时，请使用本页。

## 直接使用 cua-driver MCP

Codex Computer Use 并不是暴露桌面控制能力的唯一方式。如果你希望由 OpenClaw 管理的运行时直接调用 TryCua 的驱动程序，请通过 OpenClaw 的 MCP 注册表使用上游 `cua-driver mcp` 服务器，而不是走 Codex 专用的 marketplace 流程。

安装 `cua-driver` 后，你可以让它输出适用于 OpenClaw 的命令：

```bash
cua-driver mcp-config --client openclaw
```

或者自行注册这个 stdio 服务器：

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

这一路径会保留上游 MCP 工具接口不变，包括驱动程序 schema 和结构化 MCP 响应。当你希望 CUA 驱动程序以普通 OpenClaw MCP 服务器的形式可用时，请使用这种方式。当你希望在 Codex 模式回合中，由 Codex app-server 负责插件安装、MCP 重载和原生工具调用时，请使用本页介绍的 Codex Computer Use 设置。

CUA 驱动程序仅支持 macOS，并且仍然需要其应用所请求的本地 macOS 权限，例如辅助功能和屏幕录制。OpenClaw 不会安装 `cua-driver`、不会授予这些权限，也不会绕过上游驱动程序的安全模型。

## 快速设置

当 Codex 模式回合必须在会话开始前就具备 Computer Use 时，请设置 `plugins.entries.codex.config.computerUse`：

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

使用此配置后，OpenClaw 会在每次 Codex 模式回合开始前检查 Codex app-server。如果缺少 Computer Use，但 Codex app-server 已经发现了可安装的 marketplace，OpenClaw 会请求 Codex app-server 安装或重新启用该插件，并重载 MCP 服务器。在 macOS 上，如果没有注册任何匹配的 marketplace，且存在标准的 Codex 应用 bundle，OpenClaw 还会尝试从 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` 注册内置的 Codex marketplace，然后才会失败。如果设置仍然无法让 MCP 服务器可用，则该回合会在会话开始前失败。

现有会话会保留自己的运行时和 Codex 线程绑定。更改 `agentRuntime` 或 Computer Use 配置后，请在受影响的聊天中使用 `/new` 或 `/reset` 再进行测试。

## 命令

在任何已启用 `codex` 插件命令界面的聊天入口中，都可以使用 `/codex computer-use` 命令。这些是 OpenClaw 的聊天 / 运行时命令，不是 `openclaw codex ...` CLI 子命令：

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` 是只读的。它不会添加 marketplace source、不会安装插件，也不会启用 Codex 插件支持。

`install` 会启用 Codex app-server 插件支持、按需添加已配置的 marketplace source、通过 Codex app-server 安装或重新启用已配置的插件、重载 MCP 服务器，并验证 MCP 服务器是否暴露了工具。

## marketplace 选择

OpenClaw 使用的是 Codex 本身所暴露的同一套 app-server API。这些 marketplace 字段决定 Codex 应该从哪里找到 `computer-use`。

| Field                | 适用场景 | 安装支持 |
| -------------------- | -------- | -------- |
| No marketplace field | 你希望 Codex app-server 使用它已经知道的 marketplace。 | 是，当 app-server 返回本地 marketplace 时。 |
| `marketplaceSource`  | 你有一个 Codex marketplace source，可由 app-server 添加。 | 是，用于显式 `/codex computer-use install`。 |
| `marketplacePath`    | 你已经知道主机上的本地 marketplace 文件路径。 | 是，用于显式安装和回合开始时的自动安装。 |
| `marketplaceName`    | 你想按名称选择一个已经注册的 marketplace。 | 仅当所选 marketplace 具有本地路径时才支持。 |

全新的 Codex 主目录可能需要一点时间来初始化官方 marketplace。在安装期间，OpenClaw 会轮询 `plugin/list`，最长持续 `marketplaceDiscoveryTimeoutMs` 毫秒。默认值为 60 秒。

如果多个已知 marketplace 都包含 Computer Use，OpenClaw 会优先选择 `openai-bundled`，其次是 `openai-curated`，然后是 `local`。对于未知且有歧义的匹配项，会以失败关闭，并要求你设置 `marketplaceName` 或 `marketplacePath`。

## 内置的 macOS marketplace

较新的 Codex 桌面版本会在这里内置 Computer Use：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

当 `computerUse.autoInstall` 为 true，且没有任何包含 `computer-use` 的 marketplace 被注册时，OpenClaw 会自动尝试添加标准的内置 marketplace 根路径：

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

你也可以在启用了 Codex 的 shell 中显式注册它：

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

如果你使用的是非标准的 Codex 应用路径，请将 `computerUse.marketplacePath` 设置为一个本地 marketplace 文件路径，或者先运行一次 `/codex computer-use install --source <marketplace-source>`。

## 远程目录限制

Codex app-server 可以列出并读取仅远程的目录项，但目前不支持远程 `plugin/install`。这意味着 `marketplaceName` 可用于选择一个仅远程的 marketplace 进行状态检查，但安装和重新启用仍然需要通过 `marketplaceSource` 或 `marketplacePath` 提供本地 marketplace。

如果状态显示该插件在远程 Codex marketplace 中可用，但远程安装不受支持，请使用本地 source 或 path 执行安装：

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 配置参考

| Field                           | Default        | 含义 |
| ------------------------------- | -------------- | ---- |
| `enabled`                       | inferred       | 是否要求启用 Computer Use。设置了其他任何 Computer Use 字段时，默认值为 true。 |
| `autoInstall`                   | false          | 在回合开始时，从已发现的 marketplace 安装或重新启用。 |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 安装时等待 Codex app-server 完成 marketplace 发现的时长。 |
| `marketplaceSource`             | unset          | 传递给 Codex app-server `marketplace/add` 的 source 字符串。 |
| `marketplacePath`               | unset          | 包含该插件的本地 Codex marketplace 文件路径。 |
| `marketplaceName`               | unset          | 要选择的已注册 Codex marketplace 名称。 |
| `pluginName`                    | `computer-use` | Codex marketplace 插件名称。 |
| `mcpServerName`                 | `computer-use` | 已安装插件所暴露的 MCP 服务器名称。 |

回合开始时的自动安装会有意拒绝使用已配置的 `marketplaceSource` 值。添加新 source 是一个显式的设置操作，因此请先运行一次 `/codex computer-use install --source <marketplace-source>`，然后再让 `autoInstall` 处理未来从已发现本地 marketplace 中进行的重新启用。回合开始时的自动安装可以使用已配置的 `marketplacePath`，因为那已经是主机上的本地路径。

## OpenClaw 会检查什么

OpenClaw 会在内部报告一个稳定的设置原因，并为聊天格式化面向用户的状态信息：

| Reason                       | 含义 | 下一步 |
| ---------------------------- | ---- | ------ |
| `disabled`                   | `computerUse.enabled` 解析结果为 false。 | 设置 `enabled` 或其他任意 Computer Use 字段。 |
| `marketplace_missing`        | 没有可用的匹配 marketplace。 | 配置 source、path 或 marketplace name。 |
| `plugin_not_installed`       | marketplace 存在，但插件尚未安装。 | 运行 install 或启用 `autoInstall`。 |
| `plugin_disabled`            | 插件已安装，但在 Codex 配置中被禁用。 | 运行 install 以重新启用。 |
| `remote_install_unsupported` | 所选 marketplace 仅支持远程。 | 使用 `marketplaceSource` 或 `marketplacePath`。 |
| `mcp_missing`                | 插件已启用，但 MCP 服务器不可用。 | 检查 Codex Computer Use 和操作系统权限。 |
| `ready`                      | 插件和 MCP 工具均可用。 | 开始 Codex 模式回合。 |
| `check_failed`               | 在状态检查期间，某个 Codex app-server 请求失败。 | 检查 app-server 连接和日志。 |
| `auto_install_blocked`       | 回合开始时的设置需要添加新的 source。 | 先运行显式安装。 |

聊天输出会包含插件状态、MCP 服务器状态、marketplace、可用工具，以及针对设置失败步骤的具体消息。

## macOS 权限

Computer Use 仅支持 macOS。由 Codex 管理的 MCP 服务器在检查或控制应用之前，可能需要本地操作系统权限。如果 OpenClaw 显示 Computer Use 已安装，但 MCP 服务器不可用，请先验证 Codex 侧的 Computer Use 设置：

- Codex app-server 正运行在应执行桌面控制的同一主机上。
- Computer Use 插件已在 Codex 配置中启用。
- `computer-use` MCP 服务器出现在 Codex app-server 的 MCP 状态中。
- macOS 已授予桌面控制应用所需的权限。
- 当前主机会话可以访问正在被控制的桌面。

当 `computerUse.enabled` 为 true 时，OpenClaw 会有意以失败关闭。配置既然要求提供原生桌面工具，Codex 模式回合就不应在缺少这些工具时悄悄继续执行。

## 故障排除

**状态显示未安装。** 运行 `/codex computer-use install`。如果未发现 marketplace，请传入 `--source` 或 `--marketplace-path`。

**状态显示已安装但已禁用。** 再次运行 `/codex computer-use install`。Codex app-server 的安装会把插件配置重新写回启用状态。

**状态显示不支持远程安装。** 请使用本地 marketplace source 或 path。仅远程的目录条目可以查看，但无法通过当前 app-server API 安装。

**状态显示 MCP 服务器不可用。** 重新运行一次安装，以便重载 MCP 服务器。如果仍然不可用，请修复 Codex Computer Use 应用、Codex app-server 的 MCP 状态或 macOS 权限。

**状态检查或探测在 `computer-use.list_apps` 上超时。** 这表示插件和 MCP 服务器都已存在，但本地 Computer Use bridge 没有响应。退出或重启 Codex Computer Use，如有需要也请重启 Codex Desktop，然后在新的 OpenClaw 会话中重试。

**某个 Computer Use 工具提示 `Native hook relay unavailable`。** 这表示 Codex 原生工具钩子到达 OpenClaw 时，对应的 relay 注册已过期或缺失。请使用 `/new` 或 `/reset` 启动一个新的 OpenClaw 会话。如果问题持续发生，请重启 Gateway 网关，以丢弃旧的 app-server 线程和 hook 注册，然后再重试。

**回合开始时的自动安装拒绝某个 source。** 这是有意设计的。请先显式运行 `/codex computer-use install --source <marketplace-source>` 添加该 source，之后回合开始时的自动安装就可以使用已发现的本地 marketplace。
