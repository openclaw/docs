---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对审批
    - 为批准远程节点添加 CLI 流程
    - 使用节点管理扩展 Gateway 网关协议
summary: 适用于 iOS 和其他远程节点的 Gateway 网关托管节点配对（选项 B）
title: Gateway 网关托管配对
x-i18n:
    generated_at: "2026-04-27T12:52:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b8ebddd81a0f9a295280f273bb36513322e864202aaecac3b8befcd5cb04139
    source_path: gateway/pairing.md
    workflow: 15
---

在 Gateway 网关托管配对中，**Gateway 网关**是决定哪些节点被允许加入的唯一事实来源。UI（macOS 应用、未来的客户端）只是用于批准或拒绝待处理请求的前端。

**重要：** WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。`node.pair.*` 是单独的配对存储，不会控制 WS 握手。只有显式调用 `node.pair.*` 的客户端才会使用这条流程。

## 概念

- **待处理请求**：某个节点请求加入；需要批准。
- **已配对节点**：已批准并已签发认证令牌的节点。
- **传输协议**：Gateway 网关 WS 端点会转发请求，但不决定成员资格。（旧版 TCP bridge 支持已移除。）

## 配对如何工作

1. 一个节点连接到 Gateway 网关 WS 并请求配对。
2. Gateway 网关存储一个**待处理请求**并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（通过 CLI 或 UI）。
4. 批准后，Gateway 网关会签发一个**新令牌**（重新配对时令牌会轮换）。
5. 节点使用该令牌重新连接，现在即为“已配对”。

待处理请求会在 **5 分钟** 后自动过期。

## CLI 工作流（适合无头环境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 会显示已配对/已连接的节点及其能力。

## API Surface（Gateway 网关协议）

事件：

- `node.pair.requested` —— 创建新的待处理请求时发出。
- `node.pair.resolved` —— 请求被批准/拒绝/过期时发出。

方法：

- `node.pair.request` —— 创建或复用一个待处理请求。
- `node.pair.list` —— 列出待处理节点和已配对节点（`operator.pairing`）。
- `node.pair.approve` —— 批准一个待处理请求（签发令牌）。
- `node.pair.reject` —— 拒绝一个待处理请求。
- `node.pair.remove` —— 删除一个陈旧的已配对节点条目。
- `node.pair.verify` —— 验证 `{ nodeId, token }`。

说明：

- `node.pair.request` 对每个节点是幂等的：重复调用会返回相同的待处理请求。
- 对同一待处理节点的重复请求也会刷新已存储的节点元数据，以及最新的已列入允许名单的声明命令快照，便于运维人员查看。
- 批准**始终**会生成一个全新的令牌；`node.pair.request` 永远不会返回令牌。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 会使用待处理请求中声明的命令来强制附加审批范围：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

<Warning>
节点配对是信任与身份流，以及令牌签发流程。它**不会**按节点固定实时节点命令 Surface。

- 实时节点命令来自节点在连接时声明的内容，并在应用 Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` 和 `denyCommands`）后生效。
- 每节点的 `system.run` 允许与询问策略位于节点侧的 `exec.approvals.node.*` 中，而不在配对记录中。
</Warning>

## 节点命令控制（2026.3.31+）

<Warning>
**破坏性变更：** 从 `2026.3.31` 开始，节点命令会在节点配对获批之前保持禁用状态。仅有设备配对已不足以暴露已声明的节点命令。
</Warning>

当一个节点首次连接时，会自动请求配对。在该配对请求被批准之前，来自该节点的所有待处理节点命令都会被过滤，不会执行。一旦通过配对批准建立信任关系，该节点声明的命令就会在正常命令策略约束下可用。

这意味着：

- 之前仅依赖设备配对来暴露命令的节点，现在必须完成节点配对。
- 在配对批准前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**破坏性变更：** 现在，由节点发起的运行会停留在收缩后的受信任 Surface 内。
</Warning>

由节点发起的摘要和相关会话事件会被限制在预期的受信任 Surface 内。此前依赖更广泛宿主机或会话工具访问权限的通知驱动或节点触发流程，可能需要调整。此加固可确保节点事件无法升级为超出节点信任边界所允许范围的宿主机级工具访问。

## 自动批准（macOS 应用）

在以下情况下，macOS 应用可以选择尝试执行**静默批准**：

- 该请求被标记为 `silent`，并且
- 应用可以使用相同用户验证到 Gateway 网关宿主机的 SSH 连接。

如果静默批准失败，则会回退到常规的“批准/拒绝”提示。

## Trusted-CIDR 设备自动批准

WS 设备配对对 `role: node` 默认仍为手动模式。对于 Gateway 网关已信任网络路径的私有节点网络，运维人员可以通过显式的 CIDR 或精确 IP 选择启用：

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

- 当 `gateway.nodes.pairing.autoApproveCidrs` 未设置时，该功能处于禁用状态。
- 不存在针对整个 LAN 或私有网络的一键自动批准模式。
- 只有没有请求任何范围的全新 `role: node` 设备配对才符合资格。
- 运维人员、浏览器、Control UI 和 WebChat 客户端仍保持手动。
- 角色、范围、元数据和公钥升级仍保持手动。
- 同主机 loopback 可信代理头路径不符合资格，因为该路径可能被本地调用方伪造。

## 元数据升级自动批准

当一个已经配对的设备重新连接，且只带有非敏感元数据变更（例如显示名称或客户端平台提示）时，OpenClaw 会将其视为 `metadata-upgrade`。静默自动批准的适用范围很窄：仅适用于已证明持有本地或共享凭证的受信任非浏览器本地重连，包括因 OS 版本元数据变化而发生的同主机原生应用重连。浏览器/Control UI 客户端和远程客户端仍使用显式重新批准流程。范围升级（从 read 到 write/admin）以及公钥变更**不**符合元数据升级自动批准资格——它们仍然会作为显式重新批准请求处理。

## QR 配对辅助功能

`/pair qr` 会将配对载荷渲染为结构化媒体，便于移动端和浏览器客户端直接扫描。

删除设备时，还会同时清理该设备 ID 的任何陈旧待处理配对请求，因此在撤销后，`nodes pending` 不会显示孤立条目。

## 本地性与转发头

只有当原始 socket 和任何上游代理证据都一致时，Gateway 网关配对才会将连接视为 loopback。如果某个请求到达于 loopback，但携带了指向非本地来源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 头，那么这些转发头证据会使 loopback 本地性声明失效。此时配对路径将要求显式批准，而不会将该请求静默视为同主机连接。有关运维人员认证中的对应规则，请参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地、私有）

配对状态存储在 Gateway 网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖了 `OPENCLAW_STATE_DIR`，则 `nodes/` 文件夹会随之移动。

安全说明：

- 令牌属于机密；请将 `paired.json` 视为敏感文件。
- 轮换令牌需要重新批准（或删除该节点条目）。

## 传输协议行为

- 传输协议是**无状态**的；它不会存储成员资格。
- 如果 Gateway 网关离线或配对被禁用，节点将无法配对。
- 如果 Gateway 网关处于远程模式，配对仍会针对远程 Gateway 网关的存储进行。

## 相关内容

- [渠道配对](/zh-CN/channels/pairing)
- [Nodes](/zh-CN/nodes)
- [Devices CLI](/zh-CN/cli/devices)
