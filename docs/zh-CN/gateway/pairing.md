---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对审批
    - 为批准远程节点添加 CLI 流程
    - 使用节点管理扩展 Gateway 网关协议
summary: 适用于 iOS 和其他远程节点的 Gateway 网关托管节点配对（方案 B）
title: Gateway 网关托管配对
x-i18n:
    generated_at: "2026-04-25T05:54:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

在 Gateway 网关托管配对中，**Gateway 网关** 是决定哪些节点
允许加入的事实来源。UI（macOS 应用、未来客户端）只是用于
批准或拒绝待处理请求的前端。

**重要：** WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。
`node.pair.*` 是单独的配对存储，**不会**控制 WS 握手。
只有显式调用 `node.pair.*` 的客户端才使用此流程。

## 概念

- **待处理请求**：某个节点请求加入；需要批准。
- **已配对节点**：已批准并已签发认证令牌的节点。
- **传输**：Gateway 网关 WS 端点会转发请求，但不决定
  成员资格。（旧版 TCP bridge 支持已被移除。）

## 配对如何工作

1. 节点连接到 Gateway 网关 WS 并请求配对。
2. Gateway 网关存储一个**待处理请求**并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（CLI 或 UI）。
4. 批准后，Gateway 网关签发一个**新令牌**（重新配对时令牌会轮换）。
5. 节点使用该令牌重新连接，现在即为“已配对”。

待处理请求会在 **5 分钟** 后自动过期。

## CLI 工作流（适合无头环境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 会显示已配对/已连接节点及其能力。

## API surface（Gateway 网关协议）

事件：

- `node.pair.requested` — 创建新的待处理请求时发出。
- `node.pair.resolved` — 请求被批准/拒绝/过期时发出。

方法：

- `node.pair.request` — 创建或复用待处理请求。
- `node.pair.list` — 列出待处理 + 已配对节点（`operator.pairing`）。
- `node.pair.approve` — 批准待处理请求（签发令牌）。
- `node.pair.reject` — 拒绝待处理请求。
- `node.pair.verify` — 验证 `{ nodeId, token }`。

说明：

- `node.pair.request` 对每个节点是幂等的：重复调用会返回相同的
  待处理请求。
- 对同一个待处理节点的重复请求还会刷新已存储的节点
  元数据，以及最新的已加入允许名单的声明命令快照，便于运维人员查看。
- 批准**始终**会生成一个新的令牌；`node.pair.request`
  永远不会返回令牌。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 使用待处理请求的声明命令来强制执行
  额外的批准作用域：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

重要说明：

- 节点配对是信任/身份流程加令牌签发。
- 它**不会**按节点固定在线节点命令 surface。
- 在线节点命令来自节点在连接后声明的内容，随后再应用
  网关的全局节点命令策略（`gateway.nodes.allowCommands` /
  `denyCommands`）。
- 每个节点的 `system.run` allow/ask 策略位于节点端的
  `exec.approvals.node.*` 中，而不在配对记录中。

## 节点命令门控（2026.3.31+）

<Warning>
**Breaking change：** 从 `2026.3.31` 开始，在节点配对获批前，节点命令将被禁用。仅靠设备配对已不足以暴露已声明的节点命令。
</Warning>

当节点首次连接时，会自动请求配对。在配对请求获批之前，该节点的所有待处理节点命令都会被过滤，且不会执行。一旦通过配对批准建立信任，节点声明的命令就会在正常命令策略约束下变为可用。

这意味着：

- 之前仅依赖设备配对来暴露命令的节点，现在必须完成节点配对。
- 在配对批准前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**Breaking change：** 节点发起的运行现在会保留在缩减后的受信任 surface 内。
</Warning>

节点发起的摘要和相关会话事件会被限制在预期的受信任 surface 内。此前依赖更广泛主机或会话工具访问的通知驱动或节点触发流程，可能需要调整。此加固措施确保节点事件无法升级为超出节点信任边界所允许范围的主机级工具访问。

## 自动批准（macOS 应用）

macOS 应用在以下情况下可以选择尝试**静默批准**：

- 请求被标记为 `silent`，并且
- 应用能够使用相同用户验证到网关主机的 SSH 连接。

如果静默批准失败，则会回退到常规的“批准/拒绝”提示。

## Trusted-CIDR 设备自动批准

默认情况下，`role: node` 的 WS 设备配对仍需手动处理。对于
Gateway 网关已经信任网络路径的私有节点网络，运维人员可以
通过显式 CIDR 或精确 IP 选择启用：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

安全边界：

- 当未设置 `gateway.nodes.pairing.autoApproveCidrs` 时禁用。
- 不存在通用的 LAN 或私有网络自动批准模式。
- 只有没有请求作用域的全新 `role: node` 设备配对才符合条件。
- 运维人员、浏览器、Control UI 和 WebChat 客户端仍然需要手动批准。
- 角色、作用域、元数据和公钥升级仍然需要手动处理。
- 同主机 local loopback trusted-proxy 标头路径不符合条件，因为
  本地调用方可以伪造该路径。

## 元数据升级自动批准

当某个已配对设备重新连接，并且仅包含非敏感元数据
变更（例如显示名称或客户端平台提示）时，OpenClaw 会将其视为
`metadata-upgrade`。静默自动批准范围很窄：它仅适用于已经通过
loopback 上的共享令牌或密码持有证明的受信任本地 CLI/辅助程序重连。
浏览器/Control UI 客户端和远程客户端仍使用显式重新批准流程。
作用域升级（从 read 到 write/admin）以及公钥变更**不**符合
元数据升级自动批准条件——它们仍保持为显式重新批准请求。

## QR 配对辅助工具

`/pair qr` 会将配对负载渲染为结构化媒体，方便移动端和
浏览器客户端直接扫描。

删除某个设备时，也会清理该设备 id 的所有陈旧待处理配对请求，因此
`nodes pending` 不会在撤销后显示孤立条目。

## 本地性和转发标头

只有当原始 socket 和任何上游代理证据都一致时，Gateway 网关配对
才会将某个连接视为 loopback。如果请求通过 loopback 到达，
但携带了指向非本地来源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
标头，那么这些转发标头证据会使 loopback 本地性声明失效。
此时配对路径将要求显式批准，而不会静默地将该请求视为同主机连接。参见
[Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth) 了解运维人员认证中的对应规则。

## 存储（本地、私有）

配对状态存储在 Gateway 网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖了 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹也会随之移动。

安全说明：

- 令牌属于机密；请将 `paired.json` 视为敏感文件。
- 轮换令牌需要重新批准（或删除该节点条目）。

## 传输行为

- 传输是**无状态**的；它不会存储成员资格。
- 如果 Gateway 网关离线或配对被禁用，节点将无法配对。
- 如果 Gateway 网关处于远程模式，配对仍会针对远程 Gateway 网关的存储进行。

## 相关内容

- [渠道配对](/zh-CN/channels/pairing)
- [节点](/zh-CN/nodes)
- [设备 CLI](/zh-CN/cli/devices)
