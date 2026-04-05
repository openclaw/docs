---
read_when:
    - 构建或调试节点客户端（iOS/Android/macOS 节点模式）
    - 排查配对或 bridge 身份验证失败
    - 审计 Gateway 网关暴露的节点接口
summary: 历史 Bridge protocol（旧版节点）：TCP JSONL、配对、作用域化 RPC
title: Bridge protocol（旧版节点，历史参考）
x-i18n:
    generated_at: "2026-04-05T08:22:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bc25c388f3d65944167d05ca78f987c84ca480f0213e3485b118ebf4858c50f
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Bridge protocol（旧版节点，历史参考）

<Warning>
TCP bridge 已被**移除**。当前 OpenClaw 构建不再附带 bridge 监听器，`bridge.*` 配置键也已不再包含在 schema 中。此页面仅保留作历史参考。所有节点/operator 客户端请使用 [Gateway Protocol](/gateway/protocol)。
</Warning>

## 为什么它曾经存在

- **安全边界**：bridge 暴露的是一个较小的允许列表，而不是
  完整的 Gateway 网关 API 接口。
- **配对 + 节点身份**：节点准入由 Gateway 网关负责，并绑定
  到每节点令牌。
- **设备发现 UX**：节点可以通过局域网中的 Bonjour 发现 Gateway 网关，或
  通过 tailnet 直接连接。
- **Loopback WS**：完整的 WS 控制平面保持在本地，除非通过 SSH 建立隧道。

## 传输

- TCP，每行一个 JSON 对象（JSONL）。
- 可选 TLS（当 `bridge.tls.enabled` 为 true 时）。
- 历史上的默认监听端口为 `18790`（当前构建不会启动
  TCP bridge）。

启用 TLS 时，设备发现 TXT 记录会包含 `bridgeTls=1` 以及
`bridgeTlsSha256` 作为非敏感提示。请注意，Bonjour/mDNS TXT 记录未经身份验证；
客户端不得将所通告的指纹视为权威 pin，除非有明确的用户意图或其他带外验证。

## 握手 + 配对

1. 客户端发送 `hello`，携带节点元数据 + 令牌（如果已经配对）。
2. 如果尚未配对，Gateway 网关回复 `error`（`NOT_PAIRED`/`UNAUTHORIZED`）。
3. 客户端发送 `pair-request`。
4. Gateway 网关等待批准，然后发送 `pair-ok` 和 `hello-ok`。

历史上，`hello-ok` 会返回 `serverName`，并且可能包含
`canvasHostUrl`。

## 帧

客户端 → Gateway 网关：

- `req` / `res`：作用域化的 Gateway 网关 RPC（chat、sessions、config、health、voicewake、skills.bins）
- `event`：节点信号（语音转录、智能体请求、聊天订阅、exec 生命周期）

Gateway 网关 → 客户端：

- `invoke` / `invoke-res`：节点命令（`canvas.*`、`camera.*`、`screen.record`、
  `location.get`、`sms.send`）
- `event`：已订阅会话的聊天更新
- `ping` / `pong`：保活

旧版允许列表强制逻辑位于 `src/gateway/server-bridge.ts`（已移除）。

## Exec 生命周期事件

节点可以发出 `exec.finished` 或 `exec.denied` 事件，以暴露 system.run 活动。
这些事件会映射为 Gateway 网关中的系统事件。（旧版节点仍可能发出 `exec.started`。）

负载字段（除非另有说明，否则均为可选）：

- `sessionKey`（必填）：接收系统事件的智能体会话。
- `runId`：用于分组的唯一 exec id。
- `command`：原始或格式化的命令字符串。
- `exitCode`、`timedOut`、`success`、`output`：完成细节（仅适用于 finished）。
- `reason`：拒绝原因（仅适用于 denied）。

## 历史上的 tailnet 用法

- 将 bridge 绑定到 tailnet IP：在
  `~/.openclaw/openclaw.json` 中设置 `bridge.bind: "tailnet"`（仅历史参考；`bridge.*` 已不再有效）。
- 客户端通过 MagicDNS 名称或 tailnet IP 连接。
- Bonjour **不会**跨网络工作；必要时请使用手动 host/port 或广域 DNS‑SD。

## 版本管理

bridge 曾是**隐式 v1**（无 min/max 协商）。本节仅作
历史参考；当前节点/operator 客户端使用基于 WebSocket 的
[Gateway Protocol](/gateway/protocol)。
