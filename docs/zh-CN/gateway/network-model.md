---
read_when:
    - 你想简要了解 Gateway 网关的网络模型
summary: Gateway 网关、节点和 canvas 主机的连接方式。
title: 网络模型
x-i18n:
    generated_at: "2026-04-05T08:23:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d02d87f38ee5a9fae228f5028892b192c50b473ab4441bbe0b40ee85a1dd402
    source_path: gateway/network-model.md
    workflow: 15
---

# 网络模型

> 此内容已合并到[Network](/network#core-model)。当前指南请参见该页面。

大多数操作都通过 Gateway 网关（`openclaw gateway`）进行，这是一个长期运行的单一进程，负责持有渠道连接和 WebSocket 控制平面。

## 核心规则

- 建议每台主机只运行一个 Gateway 网关。它是唯一允许持有 WhatsApp Web 会话的进程。对于救援机器人或严格隔离场景，请运行多个使用隔离 profiles 和端口的 Gateway 网关。参见[多个 Gateway 网关](/gateway/multiple-gateways)。
- 优先使用 loopback：Gateway 网关 WS 默认为 `ws://127.0.0.1:18789`。向导默认会创建共享密钥认证，并且通常即使在 loopback 场景下也会生成令牌。对于非 loopback 访问，请使用有效的 gateway 认证路径：共享密钥令牌/密码认证，或正确配置的非 loopback `trusted-proxy` 部署。Tailnet/移动端设置通常最好通过 Tailscale Serve 或其他 `wss://` 端点，而不是原始 tailnet `ws://`。
- 节点会根据需要通过 LAN、tailnet 或 SSH 连接到 Gateway 网关 WS。
  旧版 TCP bridge 已被移除。
- Canvas 主机由 Gateway 网关 HTTP 服务器在与 Gateway 网关**相同的端口**上提供服务（默认 `18789`）：
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    当配置了 `gateway.auth` 且 Gateway 网关绑定范围超出 loopback 时，这些路由会受到 Gateway 网关认证保护。节点客户端使用与其活动 WS 会话绑定的、节点作用域的 capability URL。参见[Gateway 配置](/gateway/configuration)（`canvasHost`、`gateway`）。
- 远程使用通常通过 SSH 隧道或 tailnet VPN。参见[远程访问](/gateway/remote)和[设备发现](/gateway/discovery)。
