---
read_when:
    - 在 OpenClaw.app 中托管 PeekabooBridge
    - 通过 Swift Package Manager 集成 Peekaboo
    - 更改 PeekabooBridge 协议/路径
    - 在 PeekabooBridge、Codex Computer Use 和 cua-driver MCP 之间做选择
summary: PeekabooBridge 集成，用于 macOS UI 自动化
title: Peekaboo 桥接
x-i18n:
    generated_at: "2026-07-05T11:28:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54749a292f92d6b9fe88a0efb1f263b3a5576a600588324d7da53a4cd24f12cd
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw 可以将 **PeekabooBridge** 托管为本地、权限感知的 UI 自动化代理（`PeekabooBridgeHostCoordinator`，由 `steipete/Peekaboo` Swift 包支持）。这让 `peekaboo` CLI 可以驱动 UI 自动化，同时复用 macOS 应用的 TCC 权限。

## 这是什么（以及不是什么）

- **主机**：OpenClaw.app 可以充当 PeekabooBridge 主机。
- **客户端**：`peekaboo` CLI（没有单独的 `openclaw ui ...` 接口）。
- **UI**：视觉叠加层保留在 Peekaboo.app 中；OpenClaw 是一个轻量代理主机。

## 与其他桌面控制路径的关系

OpenClaw 有三条桌面控制路径，它们有意保持分离：

- **PeekabooBridge 主机**：OpenClaw.app 托管本地 PeekabooBridge 套接字。`peekaboo` CLI 是客户端，并使用 OpenClaw.app 的 macOS 权限执行截图、点击、菜单、对话框、Dock 操作和窗口管理。
- **Codex Computer Use**：内置的 `codex` 插件会检查并可以安装 Codex 的 `computer-use` MCP 插件（`extensions/codex/src/app-server/computer-use.ts`），然后让 Codex 在 Codex 模式轮次中拥有原生桌面控制工具调用。OpenClaw 不会通过 PeekabooBridge 代理这些操作。
- **直接使用 `cua-driver` MCP**：OpenClaw 可以将 TryCua 上游的 `cua-driver mcp` 服务器注册为普通 MCP 服务器，让智能体获得 CUA 驱动自身的架构和 pid/窗口/元素索引工作流，而不需要通过 Codex marketplace 或 PeekabooBridge 套接字路由。

如果要通过 OpenClaw.app 的权限感知桥接主机使用广泛的 macOS 自动化能力，请使用 Peekaboo。当 Codex 模式智能体应依赖 Codex 的原生插件时，请使用 Codex Computer Use。如果要将 CUA 驱动作为普通 MCP 服务器暴露给任意由 OpenClaw 管理的运行时，请直接使用 `cua-driver mcp`。

## 启用桥接

在 macOS 应用中：**设置 -> 启用 Peekaboo Bridge**。

启用后，OpenClaw 会在 `~/Library/Application Support/OpenClaw/<socket-name>` 启动本地 UNIX 套接字服务器。如果禁用，主机会停止，`peekaboo` 会回退到其他可用主机。协调器还会维护旧版套接字符号链接（`Application Support` 下的 `clawdbot`、`clawdis`、`moltbot`），指向当前套接字，以兼容较旧的 `peekaboo` 安装。

## 客户端发现顺序

Peekaboo 客户端通常按以下顺序尝试主机：

1. Peekaboo.app（完整 UX）
2. Claude.app（如果已安装）
3. OpenClaw.app（轻量代理）

使用 `peekaboo bridge status --verbose` 查看哪个主机处于活动状态，以及正在使用哪个套接字路径。用以下方式覆盖：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全和权限

- 桥接会验证**调用方代码签名**；会强制执行 TeamID 白名单（Peekaboo 主机 TeamID 加上正在运行应用自身的 TeamID）。
- 对于辅助功能，优先使用已签名的桥接/应用身份，而不是通用 `node` 运行时。授予 `node` 辅助功能权限会让该 Node 可执行文件启动的任何包继承 GUI 自动化访问权限；参见 [macOS 权限](/zh-CN/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)。
- 请求会在 10 秒后超时（`requestTimeoutSec: 10`）。
- 如果缺少所需权限，桥接会返回清晰的错误消息，而不是启动系统设置。

## 快照行为（自动化）

快照存储在内存中，有效期为 10 分钟，最多 50 个快照（`InMemorySnapshotManager`）；清理时不会删除工件。如果需要更长保留时间，请从客户端重新捕获。

## 故障排查

- 如果 `peekaboo` 报告“bridge 客户端未获授权”，请确保客户端已正确签名，或仅在**调试**模式下使用 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 运行主机。
- 如果找不到主机，请打开其中一个主机应用（Peekaboo.app 或 OpenClaw.app），并确认已授予权限。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
