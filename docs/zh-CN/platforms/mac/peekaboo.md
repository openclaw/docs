---
read_when:
    - 在 OpenClaw.app 中托管 PeekabooBridge
    - 通过 Swift Package Manager 集成 Peekaboo
    - 更改 PeekabooBridge 协议/路径
    - 在 PeekabooBridge、Codex Computer Use 和 cua-driver MCP 之间做出选择
summary: 用于 macOS UI 自动化的 PeekabooBridge 集成
title: Peekaboo bridge
x-i18n:
    generated_at: "2026-04-28T00:32:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw 可以将 **PeekabooBridge** 托管为本地、具备权限感知能力的 UI 自动化代理。这让 `peekaboo` CLI 可以驱动 UI 自动化，同时复用 macOS 应用的 TCC 权限。

## 这是什么（以及不是什么）

- **Host**：OpenClaw.app 可以充当 PeekabooBridge host。
- **Client**：使用 `peekaboo` CLI（没有单独的 `openclaw ui ...` 界面）。
- **UI**：可视化叠加层仍保留在 Peekaboo.app 中；OpenClaw 只是一个轻量的代理 host。

## 与 Computer Use 的关系

OpenClaw 有三种桌面控制路径，并且它们会有意保持彼此独立：

- **PeekabooBridge host**：OpenClaw.app 可以托管本地 PeekabooBridge socket。`peekaboo` CLI 仍然是客户端，并使用 OpenClaw.app 的 macOS 权限来执行 Peekaboo 自动化原语，例如截图、点击、菜单、对话框、Dock 操作和窗口管理。
- **Codex Computer Use**：内置的 `codex` 插件会准备 Codex app-server，验证 Codex 的 `computer-use` MCP 服务器可用，然后让 Codex 在 Codex 模式回合中自行处理原生桌面控制工具调用。OpenClaw 不会通过 PeekabooBridge 代理这些操作。
- **直接 `cua-driver` MCP**：OpenClaw 可以将 TryCua 的上游 `cua-driver mcp` 服务器注册为普通 MCP 服务器。这会向智能体提供 CUA 驱动自身的 schema，以及 pid/window/element-index 工作流，而无需通过 Codex marketplace 或 PeekabooBridge socket 进行路由。

当你想要更广泛的 macOS 自动化能力，以及 OpenClaw.app 提供的权限感知 bridge host 时，请使用 Peekaboo。当 Codex 模式的智能体应依赖 Codex 原生 computer-use 插件时，请使用 Codex Computer Use。当你希望将 `cua-driver mcp` 作为普通 MCP 服务器暴露给任何由 OpenClaw 管理的运行时时，请直接使用 `cua-driver mcp`。

## 启用 bridge

在 macOS 应用中：

- 设置 → **启用 Peekaboo Bridge**

启用后，OpenClaw 会启动一个本地 UNIX socket 服务器。如果禁用，host 会停止，`peekaboo` 将回退到其他可用 host。

## 客户端发现顺序

Peekaboo 客户端通常会按以下顺序尝试 host：

1. Peekaboo.app（完整 UX）
2. Claude.app（如果已安装）
3. OpenClaw.app（轻量代理）

使用 `peekaboo bridge status --verbose` 查看当前活动的 host，以及正在使用的 socket 路径。你也可以通过以下方式覆盖：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全与权限

- bridge 会验证**调用方代码签名**；并强制执行 TeamID allowlist（Peekaboo host TeamID + OpenClaw 应用 TeamID）。
- 请求会在约 10 秒后超时。
- 如果缺少所需权限，bridge 会返回清晰的错误消息，而不是启动系统设置。

## 快照行为（自动化）

快照会存储在内存中，并在短时间后自动过期。
如果你需要更长时间保留，请从客户端重新捕获。

## 故障排除

- 如果 `peekaboo` 报告“bridge client is not authorized”，请确保客户端已正确签名，或者仅在 **debug** 模式下使用 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 运行 host。
- 如果未找到任何 host，请打开其中一个 host 应用（Peekaboo.app 或 OpenClaw.app），并确认权限已授予。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
