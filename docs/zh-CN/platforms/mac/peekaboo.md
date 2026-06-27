---
read_when:
    - 在 OpenClaw.app 中托管 PeekabooBridge
    - 通过 Swift Package Manager 集成 Peekaboo
    - 更改 PeekabooBridge 协议/路径
    - 在 PeekabooBridge、Codex Computer Use 和 cua-driver MCP 之间做选择
summary: PeekabooBridge 集成，用于 macOS UI 自动化
title: Peekaboo 桥接
x-i18n:
    generated_at: "2026-06-27T02:32:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw 可以将 **PeekabooBridge** 作为本地、权限感知的 UI 自动化代理托管。这让 `peekaboo` CLI 能够驱动 UI 自动化，同时复用 macOS 应用的 TCC 权限。

## 这是什么（以及不是什么）

- **宿主**：OpenClaw.app 可以作为 PeekabooBridge 宿主。
- **客户端**：使用 `peekaboo` CLI（没有单独的 `openclaw ui ...` 界面）。
- **UI**：可视化叠加层保留在 Peekaboo.app 中；OpenClaw 是一个轻量代理宿主。

## 与 Codex Computer Use 的关系

OpenClaw 有三条桌面控制路径，并且它们有意保持分离：

- **PeekabooBridge 宿主**：OpenClaw.app 可以托管本地 PeekabooBridge 套接字。
  `peekaboo` CLI 仍然是客户端，并使用 OpenClaw.app 的 macOS 权限来执行 Peekaboo 自动化原语，例如截图、点击、菜单、对话框、Dock 操作和窗口管理。
- **Codex Computer Use**：内置的 `codex` 插件会准备 Codex 应用服务器，验证 Codex 的 `computer-use` MCP 服务器可用，然后让 Codex 在 Codex 模式轮次中拥有原生桌面控制工具调用。OpenClaw 不会通过 PeekabooBridge 代理这些操作。
- **直接 `cua-driver` MCP**：OpenClaw 可以将 TryCua 的上游 `cua-driver mcp` 服务器注册为普通 MCP 服务器。这会向智能体提供 CUA 驱动自身的 schema 以及 pid/window/element-index 工作流，而不经过 Codex marketplace 或 PeekabooBridge 套接字路由。

当你需要广泛的 macOS 自动化能力面，以及 OpenClaw.app 的权限感知桥接宿主时，请使用 Peekaboo。当 Codex 模式智能体应依赖 Codex 的原生 computer-use 插件时，请使用 Codex Computer Use。当你想把 CUA 驱动作为普通 MCP 服务器暴露给任意 OpenClaw 管理的运行时时，请直接使用 `cua-driver mcp`。

## 启用桥接

在 macOS 应用中：

- 设置 → **启用 Peekaboo Bridge**

启用后，OpenClaw 会启动本地 UNIX 套接字服务器。如果禁用，宿主会停止，`peekaboo` 将回退到其他可用宿主。

## 客户端发现顺序

Peekaboo 客户端通常按以下顺序尝试宿主：

1. Peekaboo.app（完整 UX）
2. Claude.app（如果已安装）
3. OpenClaw.app（轻量代理）

使用 `peekaboo bridge status --verbose` 查看哪个宿主处于活动状态，以及正在使用哪个套接字路径。你可以用以下方式覆盖：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全和权限

- 桥接会验证**调用方代码签名**；会强制执行 TeamID 允许列表（Peekaboo 宿主 TeamID + OpenClaw 应用 TeamID）。
- 对于辅助功能权限，优先使用已签名的桥接/应用身份，而不是通用的 `node` 运行时。向 `node` 授予辅助功能权限，会让该 Node 可执行文件启动的任何包继承 GUI 自动化访问权限；参见
  [macOS 权限](/zh-CN/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)。
- 请求会在约 10 秒后超时。
- 如果缺少必需权限，桥接会返回清晰的错误消息，而不是启动系统设置。

## 快照行为（自动化）

快照存储在内存中，并会在短时间窗口后自动过期。如果你需要更长保留时间，请从客户端重新捕获。

## 故障排除

- 如果 `peekaboo` 报告“桥接客户端未获授权”，请确保客户端已正确签名，或仅在**调试**模式下使用 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 运行宿主。
- 如果找不到任何宿主，请打开某个宿主应用（Peekaboo.app 或 OpenClaw.app），并确认已授予权限。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
