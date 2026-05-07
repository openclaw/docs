---
read_when:
    - 构建或调试节点客户端（iOS/Android/macOS 节点模式）
    - 排查配对或桥接认证失败
    - 审计 Gateway 网关暴露的节点接口面
summary: Bridge protocol（旧版节点，历史参考）：TCP JSONL、配对、作用域限定 RPC
title: 桥接协议
x-i18n:
    generated_at: "2026-05-07T13:15:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP bridge 已被**移除**。当前的 OpenClaw 构建不再随附 bridge 监听器，且 `bridge.*` 配置键也不再包含在架构中。此页面仅保留作历史参考。所有节点/操作员客户端都应使用 [Gateway 网关协议](/zh-CN/gateway/protocol)。
</Warning>

## 它曾经存在的原因

- **安全边界**：bridge 暴露的是小范围允许列表，而不是完整的 Gateway 网关 API 表面。
- **配对 + 节点身份**：节点准入由 Gateway 网关负责，并绑定到每个节点专属的 token。
- **设备发现 UX**：节点可以通过局域网上的 Bonjour 发现 Gateway 网关，或通过 tailnet 直接连接。
- **Loopback WS**：完整的 WS 控制平面会保持在本地，除非通过 SSH 隧道转发。

## 传输协议

- TCP，每行一个 JSON 对象（JSONL）。
- 可选 TLS（当 `bridge.tls.enabled` 为 true 时）。
- 历史默认监听端口是 `18790`（当前构建不会启动 TCP bridge）。

启用 TLS 时，设备发现 TXT 记录会包含 `bridgeTls=1`，并包含 `bridgeTlsSha256` 作为非机密提示。请注意，Bonjour/mDNS TXT 记录未经认证；除非有明确的用户意图或其他带外验证，客户端不得将广播的指纹视为权威 pin。

## 握手 + 配对

1. 客户端发送带有节点元数据 + token（如果已配对）的 `hello`。
2. 如果未配对，Gateway 网关回复 `error`（`NOT_PAIRED`/`UNAUTHORIZED`）。
3. 客户端发送 `pair-request`。
4. Gateway 网关等待批准，然后发送 `pair-ok` 和 `hello-ok`。

历史上，`hello-ok` 会返回 `serverName`；托管插件表面现在通过 `pluginSurfaceUrls` 广播。Canvas/A2UI 使用 `pluginSurfaceUrls.canvas`；已弃用的 `canvasHostUrl` 别名不属于重构后的协议。

## 帧

客户端 → Gateway 网关：

- `req` / `res`：限定范围的 Gateway 网关 RPC（聊天、会话、配置、健康检查、voicewake、skills.bins）
- `event`：节点信号（语音转写、智能体请求、聊天订阅、exec 生命周期）

Gateway 网关 → 客户端：

- `invoke` / `invoke-res`：节点命令（`canvas.*`、`camera.*`、`screen.record`、
  `location.get`、`sms.send`）
- `event`：已订阅会话的聊天更新
- `ping` / `pong`：keepalive

旧版允许列表强制执行位于 `src/gateway/server-bridge.ts`（已移除）。

## Exec 生命周期事件

节点可以发出 `exec.finished` 或 `exec.denied` 事件来呈现 system.run 活动。
这些事件会在 Gateway 网关中映射为系统事件。（旧版节点仍可能发出 `exec.started`。）

载荷字段（除非注明，否则均为可选）：

- `sessionKey`（必需）：接收系统事件的智能体会话。
- `runId`：用于分组的唯一 exec id。
- `command`：原始或格式化后的命令字符串。
- `exitCode`、`timedOut`、`success`、`output`：完成详情（仅 finished）。
- `reason`：拒绝原因（仅 denied）。

## 历史 tailnet 用法

- 将 bridge 绑定到 tailnet IP：在 `~/.openclaw/openclaw.json` 中设置 `bridge.bind: "tailnet"`（仅历史用法；`bridge.*` 不再有效）。
- 客户端通过 MagicDNS 名称或 tailnet IP 连接。
- Bonjour **不会**跨网络工作；需要时请使用手动 host/port 或广域 DNS-SD。

## 版本控制

bridge 曾是**隐式 v1**（没有 min/max 协商）。本节仅为历史参考；当前节点/操作员客户端使用 WebSocket [Gateway 网关协议](/zh-CN/gateway/protocol)。

## 相关

- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [节点](/zh-CN/nodes)
