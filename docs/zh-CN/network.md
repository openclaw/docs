---
read_when:
    - 你需要了解网络架构和安全概览
    - 你正在调试本地访问与 tailnet 访问或配对问题
    - 你需要网络文档的规范列表
summary: 网络枢纽：Gateway 网关界面、配对、设备发现和安全性
title: 网络
x-i18n:
    generated_at: "2026-07-11T20:41:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

此中心页汇总了 OpenClaw 如何在 localhost、LAN 和 tailnet 中连接、配对设备并确保其安全的核心文档。

## 核心模型

大多数操作都通过 Gateway 网关（`openclaw gateway`）进行。它是一个长期运行的单一进程，负责管理渠道连接和 WebSocket 控制平面。

- **优先使用回环地址**：Gateway 网关的 WS 默认为 `ws://127.0.0.1:18789`。
  如果没有有效的 Gateway 网关身份验证路径，非回环地址绑定将拒绝启动：
  共享密钥令牌/密码身份验证，或正确配置的非回环
  `trusted-proxy` 部署。
- 建议**每台主机运行一个 Gateway 网关**。如需隔离，请使用相互隔离的配置文件和端口运行多个 Gateway 网关（[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)）。
- **Canvas 主机**通过与 Gateway 网关相同的端口提供服务（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`）；绑定到回环地址以外的地址时，由 Gateway 网关身份验证提供保护。
- **远程访问**通常使用 SSH 隧道或 Tailscale VPN（[远程访问](/zh-CN/gateway/remote)）。

主要参考资料：

- [Gateway 网关架构](/zh-CN/concepts/architecture)
- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [Gateway 网关运行手册](/zh-CN/gateway)
- [Web 界面 + 绑定模式](/zh-CN/web)

## 配对 + 身份

- [配对概览（私信 + 节点）](/zh-CN/channels/pairing)
- [由 Gateway 网关管理的节点配对](/zh-CN/gateway/pairing)
- [设备 CLI（配对 + 令牌轮换）](/zh-CN/cli/devices)
- [配对 CLI（私信审批）](/zh-CN/cli/pairing)

本地信任：

- 直接通过 local loopback 连接（不含转发/代理标头）时，可自动批准
  配对，以确保同一主机上的用户体验流畅。
- OpenClaw 还提供一条范围有限的后端/容器本地自连接路径，用于
  受信任的共享密钥辅助流程。
- Tailnet 和 LAN 客户端（包括绑定到同一主机 tailnet 的客户端）仍然需要
  明确批准配对。

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
- [故障排查](/zh-CN/gateway/troubleshooting)
- [Doctor](/zh-CN/gateway/doctor)

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [远程访问](/zh-CN/gateway/remote)
