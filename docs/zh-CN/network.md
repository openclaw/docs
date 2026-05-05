---
read_when:
    - 你需要网络架构和安全性概览
    - 你正在调试本地访问与 Tailscale 网络访问或配对
    - 你需要网络文档的权威列表
summary: 网络中枢：Gateway 网关界面、配对、设备发现和安全
title: 网络
x-i18n:
    generated_at: "2026-05-05T16:52:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd4afc23d041df1734e730fe5f09eae529a07154d913f9434f7d413136783287
    source_path: network.md
    workflow: 16
---

# 网络枢纽

本枢纽链接了 OpenClaw 如何在 localhost、LAN 和 tailnet 中连接、配对和保护设备的核心文档。

## 核心模型

大多数操作都通过 Gateway 网关（`openclaw gateway`）流转，这是一个长期运行的单一进程，拥有渠道连接和 WebSocket 控制平面。

- **优先使用 loopback**：Gateway 网关 WS 默认使用 `ws://127.0.0.1:18789`。
  非 loopback 绑定需要有效的 Gateway 网关认证路径：shared-secret
  token/password 认证，或正确配置的非 loopback
  `trusted-proxy` 部署。
- **建议每台主机一个 Gateway 网关**。如需隔离，请使用隔离的 profile 和端口运行多个 Gateway 网关（[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)）。
- **Canvas 主机** 与 Gateway 网关在同一端口提供服务（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`），在绑定到 loopback 之外时受 Gateway 网关认证保护。
- **远程访问** 通常使用 SSH 隧道或 Tailscale VPN（[远程访问](/zh-CN/gateway/remote)）。

关键参考：

- [Gateway 网关架构](/zh-CN/concepts/architecture)
- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [Gateway 网关运行手册](/zh-CN/gateway)
- [Web 表面 + 绑定模式](/zh-CN/web)

## 配对 + 身份

- [配对概览（私信 + 节点）](/zh-CN/channels/pairing)
- [Gateway 网关拥有的节点配对](/zh-CN/gateway/pairing)
- [Devices CLI（配对 + token 轮换）](/zh-CN/cli/devices)
- [配对 CLI（私信审批）](/zh-CN/cli/pairing)

本地信任：

- 直接 local loopback 连接可以自动获准配对，以保持同主机 UX 流畅。
- OpenClaw 还有一条狭窄的后端/container-local 自连接路径，用于可信 shared-secret helper 流程。
- Tailnet 和 LAN 客户端，包括同主机 tailnet 绑定，仍需要
  明确的配对审批。

## 设备发现 + 传输协议

- [设备发现和传输协议](/zh-CN/gateway/discovery)
- [Bonjour / mDNS](/zh-CN/gateway/bonjour)
- [远程访问（SSH）](/zh-CN/gateway/remote)
- [Tailscale](/zh-CN/gateway/tailscale)

## 节点 + 传输协议

- [节点概览](/zh-CN/nodes)
- [Bridge protocol（旧版节点，历史参考）](/zh-CN/gateway/bridge-protocol)
- [节点运行手册：iOS](/zh-CN/platforms/ios)
- [节点运行手册：Android](/zh-CN/platforms/android)

## 安全

- [安全概览](/zh-CN/gateway/security)
- [Gateway 网关配置参考](/zh-CN/gateway/configuration)
- [故障排除](/zh-CN/gateway/troubleshooting)
- [Doctor](/zh-CN/gateway/doctor)

## 相关

- [Gateway 网关网络模型](/zh-CN/network#core-model)
- [远程访问](/zh-CN/gateway/remote)
