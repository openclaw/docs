---
read_when:
    - 在 OpenClaw.app 中托管 PeekabooBridge
    - 通过 Swift Package Manager 集成 Peekaboo
    - 更改 PeekabooBridge 协议/路径
    - 在 PeekabooBridge、Codex Computer Use 和 cua-driver MCP 之间进行选择
summary: 用于 macOS UI 自动化的 PeekabooBridge 集成
title: Peekaboo 桥接器
x-i18n:
    generated_at: "2026-07-11T20:39:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw 可以将 **PeekabooBridge** 作为本地、可感知权限的 UI 自动化代理托管（`PeekabooBridgeHostCoordinator`，由 `steipete/Peekaboo` Swift 软件包提供支持）。这样，`peekaboo` CLI 就能复用 macOS 应用的 TCC 权限来驱动 UI 自动化。

## 这是什么（以及不是什么）

- **主机**：OpenClaw.app 可以充当 PeekabooBridge 主机。
- **客户端**：`peekaboo` CLI（没有单独的 `openclaw ui ...` 接口）。
- **UI**：可视化叠加层仍位于 Peekaboo.app 中；OpenClaw 只是一个轻量代理主机。

## 与其他桌面控制路径的关系

OpenClaw 有四条有意保持相互独立的桌面控制路径：

- **PeekabooBridge 主机**：OpenClaw.app 托管本地 PeekabooBridge 套接字。`peekaboo` CLI 是客户端，它使用 OpenClaw.app 的 macOS 权限执行屏幕截图、点击、菜单操作、对话框操作、Dock 操作和窗口管理。
- **智能体驱动的计算机使用（`computer.act`）**：Gateway 网关智能体的内置 `computer` 工具通过 `screen.snapshot` 捕获屏幕截图，并通过危险的 `computer.act` 节点命令驱动指针和键盘。macOS 节点使用此桥接所公开的嵌入式 Peekaboo 自动化服务以及有限的 CoreGraphics 原语，在进程内执行 `computer.act`，而不经过 PeekabooBridge 套接字或 `peekaboo` CLI。请参阅[计算机使用](/nodes/computer-use)。
- **Codex Computer Use**：内置的 `codex` 插件会检查并可安装 Codex 的 `computer-use` MCP 插件（`extensions/codex/src/app-server/computer-use.ts`），然后让 Codex 在 Codex 模式的轮次中负责原生桌面控制工具调用。OpenClaw 不会通过 PeekabooBridge 代理这些操作。
- **直接使用 `cua-driver` MCP**：OpenClaw 可以将 TryCua 上游的 `cua-driver mcp` 服务器注册为普通 MCP 服务器，让智能体使用 CUA 驱动自身的模式以及 pid/窗口/元素索引工作流，而无需经过 Codex marketplace 或 PeekabooBridge 套接字进行路由。

如需通过 OpenClaw.app 可感知权限的桥接主机使用广泛的 macOS 自动化功能，请使用 Peekaboo。当 Gateway 网关智能体应通过任何视觉模型都能驱动的统一 `computer.act` 节点命令查看和控制桌面时，请使用智能体驱动的计算机使用。当 Codex 模式智能体应依赖 Codex 的原生插件时，请使用 Codex Computer Use。如需将 CUA 驱动作为普通 MCP 服务器公开给任何由 OpenClaw 管理的运行时，请直接使用 `cua-driver mcp`。

## 启用桥接

在 macOS 应用中：**Settings -> Enable Peekaboo Bridge**。

启用后，OpenClaw 会在 `~/Library/Application Support/OpenClaw/<socket-name>` 启动本地 UNIX 套接字服务器。如果禁用，主机会停止，`peekaboo` 将回退到其他可用主机。协调器还会维护旧版套接字符号链接（Application Support 下的 `clawdbot`、`clawdis`、`moltbot`），这些链接指向当前套接字，以兼容较旧的 `peekaboo` 安装。

## 客户端发现顺序

Peekaboo 客户端通常按以下顺序尝试主机：

1. Peekaboo.app（完整用户体验）
2. Claude.app（如果已安装）
3. OpenClaw.app（轻量代理）

使用 `peekaboo bridge status --verbose` 查看当前活动的主机及正在使用的套接字路径。可通过以下方式覆盖：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全与权限

- 桥接会验证**调用方代码签名**；系统会强制执行 TeamID 允许列表（Peekaboo 主机 TeamID 加上正在运行的应用自身的 TeamID）。
- 对于辅助功能权限，应优先使用已签名的桥接/应用身份，而不是通用的 `node` 运行时。向 `node` 授予辅助功能权限，会使该 Node 可执行文件启动的任何软件包都继承 GUI 自动化访问权限；请参阅 [macOS 权限](/zh-CN/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)。
- 请求会在 10 秒后超时（`requestTimeoutSec: 10`）。
- 如果缺少所需权限，桥接会返回清晰的错误消息，而不是启动 System Settings。

## 快照行为（自动化）

快照存储在内存中，有效期为 10 分钟，最多保存 50 个快照（`InMemorySnapshotManager`）；清理时不会删除产物。如果需要保留更长时间，请从客户端重新捕获。

## 故障排查

- 如果 `peekaboo` 报告“bridge client is not authorized”，请确保客户端已正确签名，或者仅在**调试**模式下使用 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 运行主机。
- 如果未找到任何主机，请打开一个主机应用（Peekaboo.app 或 OpenClaw.app），并确认已授予权限。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
