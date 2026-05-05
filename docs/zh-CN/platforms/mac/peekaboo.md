---
read_when:
    - 在 OpenClaw.app 中托管 PeekabooBridge
    - 通过 Swift Package Manager 集成 Peekaboo
    - 更改 PeekabooBridge 协议/路径
    - 在 PeekabooBridge、Codex Computer Use 和 cua-driver MCP 之间做选择
summary: 用于 macOS UI 自动化的 PeekabooBridge 集成
title: Peekaboo 桥接
x-i18n:
    generated_at: "2026-05-05T23:38:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2b0076c0fabdc5e732c6a1b6ce9b571e8b65c1a646866f85ec4138c914d5c7d
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw 可以将 **PeekabooBridge** 托管为一个本地、权限感知的 UI 自动化代理。这样 `peekaboo` CLI 就可以驱动 UI 自动化，同时复用 macOS 应用的 TCC 权限。

## 它是什么（以及不是什么）

- **主机**：OpenClaw.app 可以作为 PeekabooBridge 主机。
- **客户端**：使用 `peekaboo` CLI（没有单独的 `openclaw ui ...` 界面）。
- **UI**：可视化叠加层仍保留在 Peekaboo.app 中；OpenClaw 是一个轻量代理主机。

## 与计算机使用的关系

OpenClaw 有三条桌面控制路径，并且它们有意保持分离：

- **PeekabooBridge 主机**：OpenClaw.app 可以托管本地 PeekabooBridge 套接字。`peekaboo` CLI 仍是客户端，并使用 OpenClaw.app 的 macOS 权限来执行 Peekaboo 自动化原语，例如截图、点击、菜单、对话框、Dock 操作和窗口管理。
- **Codex 计算机使用**：内置的 `codex` 插件会准备 Codex 应用服务器，验证 Codex 的 `computer-use` MCP 服务器可用，然后在 Codex 模式轮次中让 Codex 拥有原生桌面控制工具调用。OpenClaw 不会通过 PeekabooBridge 代理这些操作。
- **直接 `cua-driver` MCP**：OpenClaw 可以将 TryCua 的上游 `cua-driver mcp` 服务器注册为普通 MCP 服务器。这会向智能体提供 CUA 驱动自己的架构以及 pid/窗口/元素索引工作流，而不会通过 Codex marketplace 或 PeekabooBridge 套接字路由。

当你需要广泛的 macOS 自动化界面以及 OpenClaw.app 的权限感知桥接主机时，请使用 Peekaboo。当 Codex 模式智能体应依赖 Codex 原生计算机使用插件时，请使用 Codex 计算机使用。当你希望将 CUA 驱动作为普通 MCP 服务器暴露给任何由 OpenClaw 管理的运行时时，请使用直接 `cua-driver mcp`。

## 启用桥接

在 macOS 应用中：

- 设置 → **启用 Peekaboo Bridge**

启用后，OpenClaw 会启动一个本地 UNIX 套接字服务器。如果禁用，主机会停止，并且 `peekaboo` 会回退到其他可用主机。

## 客户端发现顺序

Peekaboo 客户端通常按以下顺序尝试主机：

1. Peekaboo.app（完整 UX）
2. Claude.app（如果已安装）
3. OpenClaw.app（轻量代理）

使用 `peekaboo bridge status --verbose` 查看哪个主机处于活动状态，以及正在使用哪个套接字路径。你可以用以下方式覆盖：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全与权限

- 桥接会验证**调用方代码签名**；会强制执行 TeamID 允许列表（Peekaboo 主机 TeamID + OpenClaw 应用 TeamID）。
- 请求会在约 10 秒后超时。
- 如果缺少必需权限，桥接会返回清晰的错误消息，而不是启动系统设置。

## 快照行为（自动化）

快照会存储在内存中，并在一个较短时间窗口后自动过期。如果你需要更长的保留时间，请从客户端重新捕获。

## 故障排除

- 如果 `peekaboo` 报告“bridge client is not authorized”，请确保客户端已正确签名，或仅在**调试**模式下使用 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 运行主机。
- 如果找不到主机，请打开其中一个主机应用（Peekaboo.app 或 OpenClaw.app），并确认已授予权限。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
