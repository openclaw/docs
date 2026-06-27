---
read_when:
    - 构建或调试节点客户端（iOS/Android/macOS 节点模式）
    - 调查配对或桥接认证失败
    - 审计 Gateway 网关暴露的节点接口面
summary: 历史桥接协议（旧版节点）：TCP JSONL、配对、作用域限定的 RPC
title: Bridge 协议
x-i18n:
    generated_at: "2026-06-27T01:56:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP bridge 已被**移除**。当前 OpenClaw 构建不再附带 bridge 监听器，`bridge.*` 配置键也不再包含在 schema 中。此页面仅作为历史参考保留。所有节点/操作者客户端都应使用 [Gateway 网关协议](/zh-CN/gateway/protocol)。
</Warning>

## 它存在的原因

- **安全边界**：bridge 暴露的是一个小型允许列表，而不是完整的 Gateway 网关 API 表面。
- **配对 + 节点身份**：节点准入由 Gateway 网关负责，并绑定到每个节点的 token。
- **设备发现体验**：节点可以通过 LAN 上的 Bonjour 发现 Gateway 网关，或直接通过 tailnet 连接。
- **环回 WS**：完整的 WS 控制平面保持在本地，除非通过 SSH 建立隧道。

## 传输协议

- TCP，每行一个 JSON 对象（JSONL）。
- 可选 TLS（当 `bridge.tls.enabled` 为 true 时）。
- 历史默认监听端口是 `18790`（当前构建不会启动 TCP bridge）。

启用 TLS 时，设备发现 TXT 记录会包含 `bridgeTls=1`，以及作为非机密提示的 `bridgeTlsSha256`。请注意，Bonjour/mDNS TXT 记录未经身份验证；如果没有明确的用户意图或其他带外验证，客户端不得将广播的指纹视为权威 pin。

## 握手 + 配对

1. 客户端发送带有节点元数据 + token（如果已配对）的 `hello`。
2. 如果未配对，Gateway 网关回复 `error`（`NOT_PAIRED`/`UNAUTHORIZED`）。
3. 客户端发送 `pair-request`。
4. Gateway 网关等待审批，然后发送 `pair-ok` 和 `hello-ok`。

历史上，`hello-ok` 返回 `serverName`；托管插件表面现在通过 `pluginSurfaceUrls` 广播。Canvas/A2UI 使用 `pluginSurfaceUrls.canvas`；已弃用的 `canvasHostUrl` 别名不是重构后协议的一部分。

## 帧

客户端 → Gateway 网关：

- `req` / `res`：有作用域的 Gateway 网关 RPC（聊天、会话、配置、健康、voicewake、skills.bins）
- `event`：节点信号（语音转录、智能体请求、聊天订阅、exec 生命周期）

Gateway 网关 → 客户端：

- `invoke` / `invoke-res`：节点命令（`canvas.*`、`camera.*`、`screen.record`、
  `location.get`、`sms.send`）
- `event`：已订阅会话的聊天更新
- `ping` / `pong`：保活

旧版允许列表强制逻辑曾位于 `src/gateway/server-bridge.ts`（已移除）。

## Exec 生命周期事件

节点可以发出 `exec.finished` 事件，用于呈现已完成的 `system.run` 活动。这些事件会在 Gateway 网关中映射为系统事件。（旧版节点仍可能发出 `exec.started`。）
节点可以为被拒绝的 `system.run` 尝试发出 `exec.denied`；Gateway 网关会将该事件作为终止性拒绝接受，并且不会入队系统事件或唤醒智能体工作。

载荷字段（除非注明，否则均为可选）：

- `sessionKey`（必需）：用于事件关联的智能体会话；对于 `exec.finished`，也用于系统事件投递。
- `runId`：用于分组的唯一 exec ID。
- `command`：原始或格式化后的命令字符串。
- `exitCode`、`timedOut`、`success`、`output`：完成详情（仅 finished）。
- `reason`：拒绝原因（仅 denied）。

## 历史 tailnet 用法

- 将 bridge 绑定到 tailnet IP：在 `~/.openclaw/openclaw.json` 中设置 `bridge.bind: "tailnet"`（仅历史用法；`bridge.*` 不再有效）。
- 客户端通过 MagicDNS 名称或 tailnet IP 连接。
- Bonjour **不会**跨网络工作；需要时请使用手动主机/端口或广域 DNS-SD。

## 版本控制

bridge 是**隐式 v1**（没有最小/最大版本协商）。本节仅为历史参考；当前节点/操作者客户端使用 WebSocket [Gateway 网关协议](/zh-CN/gateway/protocol)。

## 相关内容

- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [节点](/zh-CN/nodes)
