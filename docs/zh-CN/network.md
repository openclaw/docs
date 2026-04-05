---
read_when:
    - 你需要网络架构与安全概览
    - 你正在调试本地访问与 tailnet 访问或配对问题
    - 你想要网络文档的权威列表
summary: 网络中心：gateway 表面、配对、设备发现和安全性
title: 网络
x-i18n:
    generated_at: "2026-04-05T08:28:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a5f39d4f40ad19646d372000c85b663770eae412af91e1c175eb27b22208118
    source_path: network.md
    workflow: 15
---

# 网络中心

这个中心页面链接了 OpenClaw 如何在 localhost、LAN 和 tailnet 之间连接、配对并保护设备的核心文档。

## 核心模型

大多数操作都通过 Gateway 网关（`openclaw gateway`）进行，它是一个长期运行的单一进程，负责持有渠道连接和 WebSocket 控制平面。

- **优先使用 loopback**：Gateway 网关 WS 默认为 `ws://127.0.0.1:18789`。
  非 loopback 绑定要求存在有效的 gateway 认证路径：共享密钥
  token/password 认证，或正确配置的非 loopback
  `trusted-proxy` 部署。
- **每台主机一个 Gateway 网关** 是推荐做法。若需隔离，请使用隔离的配置文件和端口运行多个 gateways（[多个 Gateway 网关](/gateway/multiple-gateways)）。
- **Canvas host** 与 Gateway 网关在同一端口提供服务（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`），当绑定超出 loopback 时受 Gateway 网关认证保护。
- **远程访问** 通常通过 SSH 隧道或 Tailscale VPN 实现（[远程访问](/gateway/remote)）。

关键参考：

- [Gateway 网关架构](/concepts/architecture)
- [Gateway 网关协议](/gateway/protocol)
- [Gateway 网关运行手册](/gateway)
- [Web 表面 + 绑定模式](/web)

## 配对 + 身份

- [配对概览（私信 + 节点）](/channels/pairing)
- [由 Gateway 网关持有的节点配对](/gateway/pairing)
- [devices CLI（配对 + token 轮换）](/cli/devices)
- [配对 CLI（私信审批）](/cli/pairing)

本地信任：

- 直接的本地 local loopback 连接可以自动批准配对，以保持
  同主机 UX 流畅。
- OpenClaw 还提供了一条狭义的后端/容器本地自连接路径，用于
  受信任的共享密钥辅助流程。
- tailnet 和 LAN 客户端，包括同主机上的 tailnet 绑定，仍然需要
  显式配对批准。

## 设备发现 + 传输协议

- [设备发现 + 传输协议](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [远程访问（SSH）](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## 节点 + 传输协议

- [节点概览](/nodes)
- [Bridge protocol（旧版节点，历史参考）](/gateway/bridge-protocol)
- [节点运行手册：iOS](/platforms/ios)
- [节点运行手册：Android](/platforms/android)

## 安全性

- [安全性概览](/gateway/security)
- [Gateway 网关配置参考](/gateway/configuration)
- [故障排除](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
