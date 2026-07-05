---
read_when:
    - 编辑 IPC 契约或菜单栏应用 IPC
summary: OpenClaw 应用、Gateway 网关节点传输和 PeekabooBridge 的 macOS IPC 架构
title: macOS 进程间通信
x-i18n:
    generated_at: "2026-07-05T11:30:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0216deb436632a8bc83ccd9b750b6be4e53e317fbd72af035bc152c6a8be504a
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC 架构

本地 Unix socket 将 node 主机服务连接到 macOS 应用，用于 Exec 审批和 `system.run`。`openclaw-mac` 调试 CLI（`apps/macos/Sources/OpenClawMacCLI`）可用于设备发现/连接检查；智能体操作仍然通过 Gateway 网关 WebSocket 和 `node.invoke` 流转。UI 自动化使用 PeekabooBridge。

## 目标

- 单一 GUI 应用实例，负责所有面向 TCC 的工作（通知、屏幕录制、麦克风、语音、AppleScript）。
- 较小的自动化表面：Gateway 网关 + node 命令，以及用于 UI 自动化的 PeekabooBridge。
- 可预测的权限：始终使用同一个已签名 bundle ID，并由 launchd 启动，因此 TCC 授权会保持有效。

## 工作原理

### Gateway 网关 + node 传输

- 应用运行 Gateway 网关（本地模式），并作为 node 连接到它。
- 智能体操作通过 `node.invoke` 执行（例如 `system.run`、`system.notify`、`canvas.*`）。
- Node 命令包括 `canvas.*`、`camera.snap`、`camera.clip`、`screen.snapshot`、`screen.record`、`system.run` 和 `system.notify`。
- Node 会报告 `permissions` 映射，以便智能体查看屏幕、相机、麦克风、语音、自动化或辅助功能访问是否可用。

### Node 服务 + 应用 IPC

- 无头 node 主机服务连接到 Gateway 网关 WebSocket。
- `system.run` 请求会通过本地 Unix socket（`ExecApprovalsSocket.swift`）转发到 macOS 应用。
- 应用在 UI 上下文中执行 exec，必要时提示，并返回输出。

图示（SCI）：

```text
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge（UI 自动化）

- UI 自动化使用单独的 UNIX socket（`~/Library/Application Support/OpenClaw/<socket>`）和 PeekabooBridge JSON 协议。
- 主机优先顺序（客户端侧）：Peekaboo.app -> Claude.app -> OpenClaw.app -> 本地执行。
- 安全：桥接主机要求使用 allowlist 中的 TeamID（内置的 `PeekabooBridgeHostCoordinator` 将一个固定团队以及应用自己的签名团队加入 allowlist）；仅 DEBUG 的相同 UID 逃生口由 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 保护（Peekaboo 约定）。
- 详见：[PeekabooBridge 用法](/zh-CN/platforms/mac/peekaboo)。

## 操作流程

- 重启/重新构建：`scripts/restart-mac.sh` 会终止现有实例，通过 Swift 重新构建、重新打包并重新启动。它会自动检测可用的签名身份；如果找不到，则回退到 `--no-sign`；传入 `--sign` 可要求签名（没有可用密钥时失败），或传入 `--no-sign` 强制使用未签名路径。签名路径会取消设置环境中的 `SIGN_IDENTITY`，因此 `scripts/codesign-mac-app.sh` 自己的身份自动检测会选择证书。
- 单实例：应用会检查 `NSWorkspace.runningApplications` 中是否存在重复的 bundle ID，如果发现多个实例，则退出（`MenuBar.swift` 中的 `isDuplicateInstance()`）。

## 加固说明

- 建议所有特权表面都要求 TeamID 匹配。
- PeekabooBridge：`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（仅 DEBUG）可能允许本地开发中的相同 UID 调用方。
- 所有通信都仅保持在本地；不会暴露网络 socket。
- TCC 提示仅来自 GUI 应用 bundle；在多次重新构建之间保持已签名 bundle ID 稳定。
- Exec 审批 socket 加固：文件模式 `0600`、共享 token、对等 UID 检查（`getpeereid`）、HMAC-SHA256 challenge/response，以及请求的短 TTL。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS IPC 流程（Exec 审批）](/zh-CN/tools/exec-approvals-advanced#macos-ipc-flow)
