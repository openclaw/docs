---
read_when:
    - 编辑 IPC 契约或菜单栏应用 IPC
summary: OpenClaw 应用、gateway 节点传输和 PeekabooBridge 的 macOS IPC 架构
title: macOS IPC
x-i18n:
    generated_at: "2026-04-24T04:06:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# OpenClaw macOS IPC 架构

**当前模型：**本地 Unix socket 将**节点主机服务**连接到 **macOS 应用**，用于 exec 审批和 `system.run`。存在一个 `openclaw-mac` 调试 CLI，可用于设备发现/连接检查；智能体操作仍通过 Gateway 网关 WebSocket 和 `node.invoke` 流动。UI 自动化使用 PeekabooBridge。

## 目标

- 单一 GUI 应用实例，负责所有面向 TCC 的工作（通知、屏幕录制、麦克风、语音识别、AppleScript）。
- 一个小而精的自动化表面：Gateway 网关 + 节点命令，以及用于 UI 自动化的 PeekabooBridge。
- 可预测的权限：始终使用相同的已签名 bundle ID，由 launchd 启动，因此 TCC 授权可以持续保留。

## 工作原理

### Gateway 网关 + 节点传输

- 应用运行 Gateway 网关（本地模式），并以节点身份连接到它。
- 智能体操作通过 `node.invoke` 执行（例如 `system.run`、`system.notify`、`canvas.*`）。

### 节点服务 + 应用 IPC

- 无头节点主机服务连接到 Gateway 网关 WebSocket。
- `system.run` 请求会通过本地 Unix socket 转发到 macOS 应用。
- 应用在 UI 上下文中执行 exec，在需要时提示，然后返回输出。

图示（SCI）：

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge（UI 自动化）

- UI 自动化使用名为 `bridge.sock` 的独立 UNIX socket 和 PeekabooBridge JSON 协议。
- 主机偏好顺序（客户端侧）：Peekaboo.app → Claude.app → OpenClaw.app → 本地执行。
- 安全性：bridge 主机要求匹配允许的 TeamID；仅 DEBUG 模式可用的同 UID 逃生舱由 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 保护（Peekaboo 约定）。
- 详情请参阅：[PeekabooBridge usage](/zh-CN/platforms/mac/peekaboo)。

## 操作流程

- 重启/重建：`SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 杀掉现有实例
  - Swift 构建 + 打包
  - 写入/引导/启动 LaunchAgent
- 单实例：如果另一个具有相同 bundle ID 的实例正在运行，应用会提前退出。

## 加固说明

- 对所有特权表面，优先要求 TeamID 匹配。
- PeekabooBridge：`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（仅 DEBUG）可能允许同 UID 调用方用于本地开发。
- 所有通信都保持为仅本地；不会暴露网络 socket。
- TCC 提示仅来源于 GUI 应用 bundle；请在重建过程中保持已签名 bundle ID 稳定。
- IPC 加固：socket 模式 `0600`、token、peer-UID 检查、HMAC 质询/响应、短 TTL。

## 相关内容

- [macOS app](/zh-CN/platforms/macos)
- [macOS IPC flow（Exec approvals）](/zh-CN/tools/exec-approvals-advanced#macos-ipc-flow)
