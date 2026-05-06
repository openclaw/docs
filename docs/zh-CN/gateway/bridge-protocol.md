---
read_when:
    - 构建或调试节点客户端（iOS/Android/macOS 节点模式）
    - 排查配对或桥接认证失败
    - 审计 Gateway 网关暴露的节点接口面
summary: Bridge protocol（旧版节点，历史参考）：TCP JSONL、配对、限定作用域的 RPC
title: 桥接协议
x-i18n:
    generated_at: "2026-05-06T15:54:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP bridge 已被**移除**。当前 OpenClaw 构建不再随附 bridge 监听器，`bridge.*` 配置键也不再存在于 schema 中。此页面仅保留作为历史参考。所有节点/操作员客户端请使用 [Gateway 网关协议](/zh-CN/gateway/protocol)。
</Warning>

## 它为何存在

- **安全边界**：bridge 暴露一个小型允许列表，而不是
  完整的 Gateway 网关 API 表面。
- **配对 + 节点身份**：节点准入由 Gateway 网关负责，并绑定到
  每个节点的 token。
- **设备发现 UX**：节点可以通过 LAN 上的 Bonjour 发现 Gateway 网关，或通过
  tailnet 直接连接。
- **Loopback WS**：完整的 WS 控制平面保持在本地，除非通过 SSH 隧道转发。

## 传输协议

- TCP，每行一个 JSON 对象（JSONL）。
- 可选 TLS（当 `bridge.tls.enabled` 为 true 时）。
- 历史默认监听端口为 `18790`（当前构建不会启动
  TCP bridge）。

启用 TLS 时，设备发现 TXT 记录会包含 `bridgeTls=1`，以及
`bridgeTlsSha256` 作为非机密提示。请注意，Bonjour/mDNS TXT 记录
未经认证；如果没有明确的用户意图或其他带外验证，客户端不得将通告的指纹视为
权威 pin。

## 握手 + 配对

1. 客户端发送带有节点元数据 + token 的 `hello`（如果已配对）。
2. 如果未配对，Gateway 网关回复 `error`（`NOT_PAIRED`/`UNAUTHORIZED`）。
3. 客户端发送 `pair-request`。
4. Gateway 网关等待批准，然后发送 `pair-ok` 和 `hello-ok`。

历史上，`hello-ok` 会返回 `serverName`，并且可能包含
`canvasHostUrl`。

## 帧

客户端 → Gateway 网关：

- `req` / `res`：限定作用域的 Gateway 网关 RPC（聊天、会话、配置、健康检查、voicewake、skills.bins）
- `event`：节点信号（语音转录、智能体请求、聊天订阅、exec 生命周期）

Gateway 网关 → 客户端：

- `invoke` / `invoke-res`：节点命令（`canvas.*`、`camera.*`、`screen.record`、
  `location.get`、`sms.send`）
- `event`：已订阅会话的聊天更新
- `ping` / `pong`：keepalive

旧版允许列表强制执行逻辑位于 `src/gateway/server-bridge.ts`（已移除）。

## Exec 生命周期事件

节点可以发出 `exec.finished` 或 `exec.denied` 事件，以呈现 system.run 活动。
这些事件会映射到 Gateway 网关中的系统事件。（旧版节点可能仍会发出 `exec.started`。）

Payload 字段（除非另有说明，否则均为可选）：

- `sessionKey`（必需）：接收系统事件的智能体会话。
- `runId`：用于分组的唯一 exec ID。
- `command`：原始或格式化的命令字符串。
- `exitCode`、`timedOut`、`success`、`output`：完成详情（仅 finished）。
- `reason`：拒绝原因（仅 denied）。

## 历史 tailnet 用法

- 将 bridge 绑定到 tailnet IP：在
  `~/.openclaw/openclaw.json` 中设置 `bridge.bind: "tailnet"`（仅历史参考；`bridge.*` 不再有效）。
- 客户端通过 MagicDNS 名称或 tailnet IP 连接。
- Bonjour **不会**跨网络；需要时使用手动 host/port 或广域 DNS-SD。

## 版本控制

bridge 曾是**隐式 v1**（没有 min/max 协商）。本节
仅作历史参考；当前节点/操作员客户端使用 WebSocket
[Gateway 网关协议](/zh-CN/gateway/protocol)。

## 相关内容

- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [节点](/zh-CN/nodes)
