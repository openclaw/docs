---
read_when:
    - 编辑 IPC 契约或菜单栏应用 IPC
summary: OpenClaw 应用、Gateway 网关节点传输和 PeekabooBridge 的 macOS IPC 架构
title: macOS 进程间通信
x-i18n:
    generated_at: "2026-06-28T00:13:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC 架构

**当前模型：**本地 Unix 套接字将 **node 主机服务**连接到 **macOS 应用**，用于 Exec 审批 + `system.run`。`openclaw-mac` 调试 CLI 可用于设备发现/连接检查；智能体操作仍然通过 Gateway 网关 WebSocket 和 `node.invoke` 流转。UI 自动化使用 PeekabooBridge。

## 目标

- 单个 GUI 应用实例，负责所有面向 TCC 的工作（通知、屏幕录制、麦克风、语音、AppleScript）。
- 小型自动化接口：Gateway 网关 + node 命令，以及用于 UI 自动化的 PeekabooBridge。
- 可预测的权限：始终使用相同的已签名 bundle ID，并由 launchd 启动，因此 TCC 授权会保持有效。

## 工作原理

### Gateway 网关 + node 传输

- 应用运行 Gateway 网关（本地模式），并作为 node 连接到它。
- 智能体操作通过 `node.invoke` 执行（例如 `system.run`、`system.notify`、`canvas.*`）。
- 常见的 Mac node 命令包括 `canvas.*`、`camera.snap`、`camera.clip`、
  `screen.snapshot`、`screen.record`、`system.run` 和 `system.notify`。
- node 会报告 `permissions` 映射，以便智能体查看屏幕、
  摄像头、麦克风、语音、自动化或辅助功能访问是否可用。

### Node 服务 + 应用 IPC

- 无头 node 主机服务连接到 Gateway 网关 WebSocket。
- `system.run` 请求会通过本地 Unix 套接字转发到 macOS 应用。
- 应用在 UI 上下文中执行 Exec，必要时提示，并返回输出。

图示（SCI）：

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge（UI 自动化）

- UI 自动化使用名为 `bridge.sock` 的单独 UNIX 套接字和 PeekabooBridge JSON 协议。
- 主机偏好顺序（客户端侧）：Peekaboo.app → Claude.app → OpenClaw.app → 本地执行。
- 安全性：bridge 主机要求允许的 TeamID；仅 DEBUG 的同 UID 逃生口由 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 保护（Peekaboo 约定）。
- 详情见：[PeekabooBridge 用法](/zh-CN/platforms/mac/peekaboo)。

## 操作流程

- 重启/重建：`SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 终止现有实例
  - Swift 构建 + 打包
  - 写入/引导/启动 LaunchAgent
- 单实例：如果已有使用相同 bundle ID 的另一个实例正在运行，应用会提前退出。

## 加固说明

- 优先要求所有特权接口都匹配 TeamID。
- PeekabooBridge：`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（仅 DEBUG）可能允许同 UID 调用方用于本地开发。
- 所有通信均保持仅本地；不暴露网络套接字。
- TCC 提示仅来自 GUI 应用 bundle；在重建之间保持已签名 bundle ID 稳定。
- IPC 加固：套接字模式 `0600`、令牌、对端 UID 检查、HMAC 挑战/响应、短 TTL。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS IPC 流程（Exec 审批）](/zh-CN/tools/exec-approvals-advanced#macos-ipc-flow)
