---
read_when:
    - 处理 Gateway 网关协议、客户端或传输协议
summary: WebSocket Gateway 网关架构、组件和客户端流程
title: Gateway 网关架构
x-i18n:
    generated_at: "2026-07-05T11:12:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8054bd87f738b957c24f8d6965d55365de2293d44902530a9ba778afa597cc7
    source_path: concepts/architecture.md
    workflow: 16
---

## 概览

- 一个长期运行的 **Gateway 网关** 拥有所有消息表面（通过
  Baileys 支持 WhatsApp，通过 grammY 支持 Telegram，以及 Slack、Discord、Signal、iMessage、WebChat）。
- 控制平面客户端（macOS 应用、CLI、Web UI、自动化）通过 **WebSocket** 连接到
  Gateway 网关，使用配置的绑定主机（默认
  `127.0.0.1:18789`）。
- **节点**（macOS/iOS/Android/headless）也通过 **WebSocket** 连接，但会声明带有显式 caps/commands 的 `role: node`。
- 每台主机一个 Gateway 网关；它是唯一打开 WhatsApp 会话的地方。
- **画布主机** 由 Gateway 网关 HTTP 服务器提供，路径如下：
  - `/__openclaw__/canvas/`（Agent 可编辑的 HTML/CSS/JS）
  - `/__openclaw__/a2ui/`（A2UI 主机）

  它使用与 Gateway 网关相同的端口（默认 `18789`）。

## 组件和流程

### Gateway 网关（守护进程）

- 维护提供商连接。
- 暴露类型化的 WS API（请求、响应、服务器推送事件）。
- 根据 JSON Schema 验证入站帧。
- 发出 `agent`、`chat`、`presence`、`health`、`heartbeat`、`cron` 等事件。

### 客户端（mac 应用 / CLI / Web 管理端）

- 每个客户端一个 WS 连接。
- 发送请求（`health`、`status`、`send`、`agent`、`system-presence`）。
- 订阅事件（`tick`、`agent`、`presence`、`shutdown`）。

### 节点（macOS / iOS / Android / headless）

- 使用 `role: node` 连接到**同一个 WS 服务器**。
- 在 `connect` 中提供设备身份；配对是**基于设备**的（角色 `node`），审批存放在设备配对存储中。
- 暴露 `canvas.*`、`camera.*`、`screen.record`、`location.get` 等命令。

协议详情：[Gateway 网关协议](/zh-CN/gateway/protocol)

### WebChat

- 静态 UI，使用 Gateway 网关 WS API 获取聊天历史并发送消息。
- 在远程设置中，通过与其他客户端相同的 SSH/Tailscale 隧道连接。

## 连接生命周期（单个客户端）

```mermaid
sequenceDiagram
    participant Client
    participant Gateway

    Client->>Gateway: req:connect
    Gateway-->>Client: res (ok)
    Note right of Gateway: or res error + close
    Note left of Client: payload=hello-ok<br>snapshot: presence + health

    Gateway-->>Client: event:presence
    Gateway-->>Client: event:tick

    Client->>Gateway: req:agent
    Gateway-->>Client: res:agent<br>ack {runId, status:"accepted"}
    Gateway-->>Client: event:agent<br>(streaming)
    Gateway-->>Client: res:agent<br>final {runId, status, summary}
```

## 线协议（摘要）

- 传输：WebSocket，带 JSON 载荷的文本帧。
- 第一帧**必须**是 `connect`。
- 握手后：
  - 请求：`{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - 事件：`{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` 是设备发现元数据，而不是每个可调用 helper 路由的生成转储。
- 共享密钥认证使用 `connect.params.auth.token` 或
  `connect.params.auth.password`，具体取决于配置的 Gateway 网关认证模式。
- 携带身份的模式，例如 Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 或非 local loopback
  `gateway.auth.mode: "trusted-proxy"`，会通过请求头完成认证，
  而不是使用 `connect.params.auth.*`。
- 私有入口 `gateway.auth.mode: "none"` 会完全禁用共享密钥认证；
  不要在公开/不受信任的入口上启用该模式。
- 对有副作用的方法（`send`、`agent`）必须提供幂等键，以便安全重试；服务器会保留一个短生命周期的去重缓存。
- 节点必须在 `connect` 中包含 `role: "node"` 以及 caps/commands/permissions。

## 配对和本地信任

- 所有 WS 客户端（操作员 + 节点）都会在 `connect` 时包含一个**设备身份**。
- 新设备 ID 需要配对审批；Gateway 网关会签发一个**设备令牌**供后续连接使用。
- 直接 local loopback 连接可以自动审批，以保持同主机 UX 顺畅。
- OpenClaw 还为受信任的共享密钥 helper 流程提供了一条狭窄的后端/容器本地自连接路径。
- Tailnet 和局域网连接，包括同主机 tailnet 绑定，仍然需要显式配对审批。
- 所有连接都必须对 `connect.challenge` nonce 签名。签名载荷 `v3`
  还会绑定 `platform` 和 `deviceFamily`；Gateway 网关会在重连时固定已配对的元数据，并要求通过修复配对来处理元数据变更。
- **非本地**连接仍然需要显式审批。
- Gateway 网关认证（`gateway.auth.*`）仍然适用于**所有**连接，无论本地还是远程。

详情：[Gateway 网关协议](/zh-CN/gateway/protocol)、[配对](/zh-CN/channels/pairing)、
[安全](/zh-CN/gateway/security)。

## 协议类型和代码生成

- TypeBox schema 定义协议。
- JSON Schema 由这些 schema 生成。
- Swift 模型由 JSON Schema 生成。

## 远程访问

- 首选：Tailscale 或 VPN。
- 替代方案：SSH 隧道

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
  ```

- 隧道上适用相同的握手 + 认证令牌。
- 在远程设置中，可以为 WS 启用 TLS + 可选固定证书。

## 运维快照

- 启动：`openclaw gateway`（前台运行，日志输出到 stdout）。
- 健康：通过 WS 使用 `health`（也包含在 `hello-ok` 中）。
- 监督：使用 launchd/systemd 自动重启。

## 不变量

- 每台主机上只有一个 Gateway 网关控制一个 Baileys 会话。
- 握手是强制性的；任何非 JSON 或首帧不是 connect 的连接都会被硬关闭。
- 事件不会重放；客户端必须在出现间隙时刷新。

## 相关

- [Agent Loop](/zh-CN/concepts/agent-loop) — 详细的 agent 执行周期
- [Gateway 网关协议](/zh-CN/gateway/protocol) — WebSocket 协议契约
- [队列](/zh-CN/concepts/queue) — 命令队列和并发
- [安全](/zh-CN/gateway/security) — 信任模型和加固
