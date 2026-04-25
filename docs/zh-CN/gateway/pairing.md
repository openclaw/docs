---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对审批
    - 添加用于批准远程节点的 CLI 流程
    - 用节点管理扩展 Gateway 网关协议
summary: iOS 和其他远程节点的 Gateway 网关拥有式节点配对（选项 B）
title: Gateway 网关拥有式配对
x-i18n:
    generated_at: "2026-04-25T20:04:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

在 Gateway 网关拥有式配对中，**Gateway 网关** 是决定哪些节点被允许加入的事实来源。UI（macOS 应用、未来的客户端）只是用于批准或拒绝待处理请求的前端。

**重要：** WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。`node.pair.*` 是一个独立的配对存储，**不会**决定 WS 握手是否通过。只有显式调用 `node.pair.*` 的客户端才会使用这套流程。

## 概念

- **待处理请求**：某个节点请求加入；需要批准。
- **已配对节点**：已获批准并已签发身份验证令牌的节点。
- **传输协议**：Gateway 网关的 WS 端点会转发请求，但不决定成员资格。（旧版 TCP bridge 支持已被移除。）

## 配对如何工作

1. 节点连接到 Gateway 网关 WS 并请求配对。
2. Gateway 网关存储一个**待处理请求**并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（通过 CLI 或 UI）。
4. 批准后，Gateway 网关会签发一个**新令牌**（重新配对时会轮换令牌）。
5. 节点使用该令牌重新连接，此时即为“已配对”。

待处理请求会在 **5 分钟**后自动过期。

## CLI 工作流（适合无头环境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 会显示已配对/已连接的节点及其能力。

## API 表面（Gateway 网关协议）

事件：

- `node.pair.requested` — 在创建新的待处理请求时发出。
- `node.pair.resolved` — 在请求被批准/拒绝/过期时发出。

方法：

- `node.pair.request` — 创建或复用一个待处理请求。
- `node.pair.list` — 列出待处理节点和已配对节点（`operator.pairing`）。
- `node.pair.approve` — 批准一个待处理请求（签发令牌）。
- `node.pair.reject` — 拒绝一个待处理请求。
- `node.pair.verify` — 验证 `{ nodeId, token }`。

说明：

- `node.pair.request` 对每个节点都是幂等的：重复调用会返回相同的待处理请求。
- 对同一待处理节点的重复请求还会刷新已存储的节点元数据，以及最新的已列入允许名单的声明命令快照，方便操作员查看。
- 批准**总是**会生成一个新的令牌；`node.pair.request` **绝不会**返回令牌。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 使用待处理请求中声明的命令来强制额外的批准范围：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

重要：

- 节点配对是一个信任/身份流加令牌签发流程。
- 它**不会**按节点固定实时节点命令表面。
- 实时节点命令来自节点在连接时声明的内容，并且会在应用网关全局节点命令策略（`gateway.nodes.allowCommands` / `denyCommands`）后生效。
- 每个节点的 `system.run` allow/ask 策略保存在节点端的
  `exec.approvals.node.*` 中，而不在配对记录里。

## 节点命令门控（2026.3.31+）

<Warning>
**重大变更：** 从 `2026.3.31` 开始，在节点配对获得批准之前，节点命令将被禁用。仅靠设备配对已不足以暴露已声明的节点命令。
</Warning>

当节点首次连接时，会自动请求配对。在配对请求获批之前，来自该节点的所有待处理节点命令都会被过滤，且不会执行。一旦通过配对批准建立信任，节点声明的命令就会在正常命令策略约束下变为可用。

这意味着：

- 之前仅依赖设备配对来暴露命令的节点，现在必须完成节点配对。
- 在配对批准前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**重大变更：** 现在由节点发起的运行会停留在受限的可信表面内。
</Warning>

由节点发起的摘要及相关会话事件会被限制在预期的可信表面内。此前依赖更广泛主机或会话工具访问的通知驱动型或节点触发型流程，可能需要调整。此项加固可确保节点事件不能升级为超出节点信任边界所允许范围的主机级工具访问。

## 自动批准（macOS 应用）

在以下情况下，macOS 应用可以选择尝试**静默批准**：

- 请求被标记为 `silent`，并且
- 应用可以使用同一用户验证到 gateway 主机的 SSH 连接。

如果静默批准失败，它会回退到正常的“批准/拒绝”提示。

## 受信任 CIDR 设备自动批准

`role: node` 的 WS 设备配对默认仍为手动。对于 Gateway 网关已经信任网络路径的私有节点网络，操作员可以通过显式 CIDR 或精确 IP 选择启用：

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

- 当 `gateway.nodes.pairing.autoApproveCidrs` 未设置时，此功能禁用。
- 不存在对整个局域网或私有网络的一键自动批准模式。
- 只有不带请求范围的全新 `role: node` 设备配对才符合条件。
- 操作员、浏览器、Control UI 和 WebChat 客户端仍保持手动。
- 角色、范围、元数据和公钥升级仍保持手动。
- 同主机 loopback 受信任代理头路径不符合条件，因为该路径可被本地调用方伪造。

## 元数据升级自动批准

当一个已配对设备重新连接，且仅包含非敏感元数据变更时（例如显示名称或客户端平台提示），OpenClaw 会将其视为 `metadata-upgrade`。静默自动批准的适用范围非常窄：它仅适用于受信任的非浏览器本地重新连接，这些连接已证明持有本地或共享凭证，包括因操作系统版本元数据变化而在同一主机上重新连接的原生应用。浏览器/Control UI 客户端和远程客户端仍使用显式重新批准流程。范围升级（从 read 到 write/admin）和公钥变更**不**符合元数据升级自动批准条件——它们仍然是显式重新批准请求。

## QR 配对辅助工具

`/pair qr` 会将配对载荷渲染为结构化媒体，以便移动端和浏览器客户端直接扫描。

删除设备时，也会一并清除该设备 id 的任何陈旧待处理配对请求，因此 `nodes pending` 不会在撤销后显示孤立条目。

## 本地性与转发头

只有当原始套接字和任何上游代理证据都一致时，Gateway 网关配对才会将某个连接视为 loopback。如果一个请求到达于 loopback，但携带了指向非本地来源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 头，那么这些转发头证据会使 loopback 本地性声明失效。此时，配对路径将要求显式批准，而不是静默地将该请求视为同主机连接。关于操作员身份验证中的等效规则，请参阅
[Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地，私有）

配对状态存储在 Gateway 网关状态目录下（默认是 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖了 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹也会随之移动。

安全说明：

- 令牌属于机密；请将 `paired.json` 视为敏感文件。
- 轮换令牌需要重新批准（或删除该节点条目）。

## 传输行为

- 传输协议是**无状态的**；它不存储成员资格。
- 如果 Gateway 网关离线或配对被禁用，节点将无法配对。
- 如果 Gateway 网关处于远程模式，配对仍会针对远程 Gateway 网关的存储进行。

## 相关内容

- [渠道配对](/zh-CN/channels/pairing)
- [节点](/zh-CN/nodes)
- [设备 CLI](/zh-CN/cli/devices)
