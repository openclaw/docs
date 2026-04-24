---
read_when:
    - 在 OpenClaw.app 中托管 PeekabooBridge
    - 通过 Swift Package Manager 集成 Peekaboo
    - 更改 PeekabooBridge 协议 / 路径
summary: 用于 macOS UI 自动化的 PeekabooBridge 集成
title: PeekabooBridge 桥接器
x-i18n:
    generated_at: "2026-04-24T04:05:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw 可以将 **PeekabooBridge** 托管为一个本地、具备权限感知能力的 UI 自动化
代理。这使 `peekaboo` CLI 能够驱动 UI 自动化，同时复用
macOS 应用的 TCC 权限。

## 这是什么（以及不是什么）

- **宿主**：OpenClaw.app 可以充当 PeekabooBridge 宿主。
- **客户端**：使用 `peekaboo` CLI（没有单独的 `openclaw ui ...` 界面）。
- **UI**：可视化覆盖层仍保留在 Peekaboo.app 中；OpenClaw 只是一个轻量代理宿主。

## 启用桥接器

在 macOS 应用中：

- 设置 → **启用 Peekaboo Bridge**

启用后，OpenClaw 会启动一个本地 UNIX 套接字服务器。若禁用，则宿主
会停止，`peekaboo` 将回退到其他可用宿主。

## 客户端发现顺序

Peekaboo 客户端通常按以下顺序尝试宿主：

1. Peekaboo.app（完整 UX）
2. Claude.app（如果已安装）
3. OpenClaw.app（轻量代理）

使用 `peekaboo bridge status --verbose` 可查看当前活动宿主以及
正在使用的套接字路径。你也可以通过以下方式覆盖：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全与权限

- 桥接器会验证**调用方代码签名**；会强制执行 TeamID 允许列表
  （Peekaboo 宿主 TeamID + OpenClaw 应用 TeamID）。
- 请求会在约 10 秒后超时。
- 如果缺少所需权限，桥接器会返回清晰的错误消息，
  而不是启动系统设置。

## 快照行为（自动化）

快照存储在内存中，并会在短时间窗口后自动过期。
如果你需要更长时间保留，请从客户端重新捕获。

## 故障排除

- 如果 `peekaboo` 报告“bridge client is not authorized”，请确认客户端
  已正确签名，或仅在**调试**模式下使用
  `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 运行宿主。
- 如果找不到任何宿主，请打开其中一个宿主应用（Peekaboo.app 或 OpenClaw.app），
  并确认权限已授予。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
