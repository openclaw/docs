---
read_when:
    - 你需要网络架构 + 安全概览
    - 你正在调试本地访问与 tailnet 访问或配对问题
    - 你想查看网络文档的规范列表
summary: 网络枢纽：Gateway 网关界面、配对、设备发现和安全性
title: 网络
x-i18n:
    generated_at: "2026-04-24T04:04:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# 网络枢纽

此枢纽页链接了 OpenClaw 如何在 localhost、LAN 和 tailnet 之间连接、配对并保护设备的核心文档。

## 核心模型

大多数操作都通过 Gateway 网关（`openclaw gateway`）进行，这是一个长期运行的单一进程，负责管理渠道连接和 WebSocket 控制平面。

- **优先 loopback**：Gateway 网关 WS 默认为 `ws://127.0.0.1:18789`。
  非 loopback 绑定需要有效的 Gateway 网关认证路径：共享密钥
  token / password 认证，或正确配置的非 loopback
  `trusted-proxy` 部署。
- 推荐**每台主机一个 Gateway 网关**。如需隔离，请使用隔离的配置文件和端口运行多个 Gateway 网关（[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)）。
- **Canvas host** 与 Gateway 网关在同一端口上提供服务（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`），当绑定超出 loopback 范围时，受 Gateway 网关认证保护。
- **远程访问**通常通过 SSH 隧道或 Tailscale VPN 实现（[远程访问](/zh-CN/gateway/remote)）。

关键参考：

- [Gateway 网关架构](/zh-CN/concepts/architecture)
- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [Gateway 网关运行手册](/zh-CN/gateway)
- [Web 界面 + 绑定模式](/zh-CN/web)

## 配对 + 身份

- [配对概览（私信 + 节点）](/zh-CN/channels/pairing)
- [由 Gateway 网关管理的节点配对](/zh-CN/gateway/pairing)
- [Devices CLI（配对 + 令牌轮换）](/zh-CN/cli/devices)
- [配对 CLI（私信审批）](/zh-CN/cli/pairing)

本地信任：

- 直接的本地 local loopback 连接可自动获批配对，以保持同主机使用体验顺畅。
- OpenClaw 还提供一条受限的后端 / 容器本地自连接路径，用于受信任的共享密钥辅助流程。
- tailnet 和 LAN 客户端（包括同主机的 tailnet 绑定）仍然需要显式配对审批。

## 设备发现 + 传输协议

- [设备发现 + 传输协议](/zh-CN/gateway/discovery)
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

## 相关内容

- [Gateway 网关网络模型](/zh-CN/gateway/network-model)
- [远程访问](/zh-CN/gateway/remote)
