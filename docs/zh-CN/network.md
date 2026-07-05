---
read_when:
    - 你需要网络架构 + 安全概览
    - 你正在调试本地访问与 tailnet 访问或配对
    - 你需要网络文档的规范列表
summary: 网络中心：Gateway 网关界面、配对、设备发现和安全
title: 网络
x-i18n:
    generated_at: "2026-07-05T11:26:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

This hub links the core docs for how OpenClaw connects, pairs, and secures
devices across localhost, LAN, and tailnet.

## Core model

Most operations flow through the Gateway (`openclaw gateway`), a single long-running process that owns channel connections and the WebSocket control plane.

- **Loopback first**: the Gateway WS defaults to `ws://127.0.0.1:18789`.
  Non-loopback binds refuse to start without a valid gateway auth path:
  shared-secret token/password auth, or a correctly configured non-loopback
  `trusted-proxy` deployment.
- **One Gateway per host** is recommended. For isolation, run multiple gateways with isolated profiles and ports ([Multiple Gateways](/zh-CN/gateway/multiple-gateways)).
- **Canvas host** is served on the same port as the Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protected by Gateway auth when bound beyond loopback.
- **Remote access** is typically an SSH tunnel or Tailscale VPN ([Remote Access](/zh-CN/gateway/remote)).

Key references:

- [Gateway architecture](/zh-CN/concepts/architecture)
- [Gateway protocol](/zh-CN/gateway/protocol)
- [Gateway runbook](/zh-CN/gateway)
- [Web surfaces + bind modes](/zh-CN/web)

## Pairing + identity

- [Pairing overview (DM + nodes)](/zh-CN/channels/pairing)
- [Gateway-owned node pairing](/zh-CN/gateway/pairing)
- [Devices CLI (pairing + token rotation)](/zh-CN/cli/devices)
- [Pairing CLI (DM approvals)](/zh-CN/cli/pairing)

Local trust:

- Direct local loopback connects (no forwarded/proxy headers) can be
  auto-approved for pairing to keep same-host UX smooth.
- OpenClaw also has a narrow backend/container-local self-connect path for
  trusted shared-secret helper flows.
- Tailnet and LAN clients, including same-host tailnet binds, still require
  explicit pairing approval.

## Discovery + transports

- [Discovery and transports](/zh-CN/gateway/discovery)
- [Bonjour / mDNS](/zh-CN/gateway/bonjour)
- [Remote access (SSH)](/zh-CN/gateway/remote)
- [Tailscale](/zh-CN/gateway/tailscale)

## Nodes + transports

- [Nodes overview](/zh-CN/nodes)
- [Bridge protocol (legacy nodes, historical)](/zh-CN/gateway/bridge-protocol)
- [Node runbook: iOS](/zh-CN/platforms/ios)
- [Node runbook: Android](/zh-CN/platforms/android)

## Security

- [Security overview](/zh-CN/gateway/security)
- [Gateway config reference](/zh-CN/gateway/configuration)
- [Troubleshooting](/zh-CN/gateway/troubleshooting)
- [Doctor](/zh-CN/gateway/doctor)

## Related

- [Gateway runbook](/zh-CN/gateway)
- [Remote access](/zh-CN/gateway/remote)
