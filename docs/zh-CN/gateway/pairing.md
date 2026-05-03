---
read_when:
    - 实现无需 macOS 界面的节点配对批准
    - 添加用于批准远程节点的 CLI 流程
    - 使用节点管理扩展 Gateway 网关协议
summary: 适用于 iOS 和其他远程节点的 Gateway 网关托管节点配对（选项 B）
title: Gateway 网关负责的配对
x-i18n:
    generated_at: "2026-05-03T00:43:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0ce46d487990860ac572c27cc9dd83839e87329132e2624944660bafaf723de
    source_path: gateway/pairing.md
    workflow: 16
---

在 Gateway 网关负责的配对中，**Gateway 网关**是决定哪些节点
被允许加入的事实来源。UI（macOS 应用、未来客户端）只是用于
批准或拒绝待处理请求的前端。

**重要：** WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。
`node.pair.*` 是单独的配对存储，**不会**作为 WS 握手的准入门槛。
只有显式调用 `node.pair.*` 的客户端才会使用此流程。

## 概念

- **待处理请求**：节点请求加入；需要批准。
- **已配对节点**：已获批准并签发了身份验证令牌的节点。
- **传输协议**：Gateway 网关 WS 端点会转发请求，但不决定
  成员资格。（旧版 TCP 桥接支持已移除。）

## 配对如何工作

1. 节点连接到 Gateway 网关 WS 并请求配对。
2. Gateway 网关存储一个**待处理请求**并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（CLI 或 UI）。
4. 批准后，Gateway 网关签发一个**新令牌**（重新配对时会轮换令牌）。
5. 节点使用令牌重新连接，此时即为“已配对”。

待处理请求会在 **5 分钟**后自动过期。

## CLI 工作流（适合无界面环境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 会显示已配对/已连接的节点及其能力。

## API 表面（Gateway 网关协议）

事件：

- `node.pair.requested` — 创建新的待处理请求时发出。
- `node.pair.resolved` — 请求被批准/拒绝/过期时发出。

方法：

- `node.pair.request` — 创建或复用待处理请求。
- `node.pair.list` — 列出待处理 + 已配对节点（`operator.pairing`）。
- `node.pair.approve` — 批准待处理请求（签发令牌）。
- `node.pair.reject` — 拒绝待处理请求。
- `node.pair.remove` — 移除过时的已配对节点条目。
- `node.pair.verify` — 验证 `{ nodeId, token }`。

注意：

- `node.pair.request` 对每个节点是幂等的：重复调用会返回同一个
  待处理请求。
- 同一待处理节点的重复请求也会刷新已存储的节点
  元数据，以及最新的已声明命令允许列表快照，供操作者查看。
- 批准**总是**生成全新令牌；`node.pair.request`
  永远不会返回令牌。
- 操作者作用域级别和批准时检查总结在
  [操作者作用域](/zh-CN/gateway/operator-scopes)中。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 使用待处理请求中声明的命令来强制执行
  额外批准作用域：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

<Warning>
节点配对是一套信任和身份流程，并会签发令牌。它**不会**按节点固定实时节点命令表面。

- 实时节点命令来自节点在连接时声明的内容，并且会先应用 Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` 和 `denyCommands`）。
- 每个节点的 `system.run` 允许和询问策略位于节点上的 `exec.approvals.node.*`，不在配对记录中。

</Warning>

## 节点命令门控（2026.3.31+）

<Warning>
**重大变更：** 从 `2026.3.31` 开始，节点命令会被禁用，直到节点配对获得批准。仅完成设备配对已不足以暴露声明的节点命令。
</Warning>

当节点首次连接时，会自动请求配对。在配对请求获得批准之前，来自该节点的所有待处理节点命令都会被过滤，并且不会执行。一旦通过配对批准建立信任，节点声明的命令就会在正常命令策略约束下可用。

这意味着：

- 之前仅依赖设备配对来暴露命令的节点，现在必须完成节点配对。
- 配对批准前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**重大变更：** 节点发起的运行现在会停留在缩减后的可信表面上。
</Warning>

节点发起的摘要和相关会话事件会被限制在预期的可信表面内。之前依赖更广泛主机或会话工具访问权限的通知驱动或节点触发流程，可能需要调整。此加固确保节点事件无法提升为超出节点信任边界所允许范围的主机级工具访问。

持久节点在线状态更新遵循相同的身份边界。`node.presence.alive` 事件
只接受来自已认证节点设备会话的事件，并且仅在
设备/节点身份已经配对时更新配对元数据。自声明的 `client.id` 值不足以写入
最后在线状态。

## 自动批准（macOS 应用）

macOS 应用可以在以下情况下选择尝试**静默批准**：

- 请求被标记为 `silent`，并且
- 应用可以使用同一用户验证到 Gateway 网关主机的 SSH 连接。

如果静默批准失败，它会回退到常规的“批准/拒绝”提示。

## 可信 CIDR 设备自动批准

`role: node` 的 WS 设备配对默认仍为手动。对于 Gateway 网关已经信任网络路径的私有
节点网络，操作者可以通过显式 CIDR 或精确 IP 选择启用：

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

- 未设置 `gateway.nodes.pairing.autoApproveCidrs` 时禁用。
- 不存在 blanket LAN 或私有网络自动批准模式。
- 只有没有请求作用域的新 `role: node` 设备配对符合条件。
- 操作者、浏览器、Control UI 和 WebChat 客户端仍保持手动。
- 角色、作用域、元数据和公钥升级仍保持手动。
- 同主机 local loopback 可信代理标头路径不符合条件，因为该
  路径可能被本地调用方伪造。

## 元数据升级自动批准

当已配对设备重新连接且只有非敏感元数据
变更（例如显示名称或客户端平台提示）时，OpenClaw 会将其视为
`metadata-upgrade`。静默自动批准的范围很窄：它只适用于已经证明拥有本地
或共享凭证的可信非浏览器本地重连，包括同主机原生应用在 OS
版本元数据变更后的重新连接。浏览器/Control UI 客户端和远程客户端仍然
使用显式重新批准流程。作用域升级（从读取到写入/admin）和
公钥变更**不**符合元数据升级自动批准条件 —
它们仍保持为显式重新批准请求。

## QR 配对辅助工具

`/pair qr` 会将配对载荷渲染为结构化媒体，使移动端和
浏览器客户端可以直接扫描。

删除设备也会清理该
设备 ID 的所有过时待处理配对请求，因此 `nodes pending` 在撤销后不会显示孤立行。

## 本地性与转发标头

Gateway 网关配对只有在原始套接字
和任何上游代理证据都一致时，才会将连接视为 loopback。如果请求到达 loopback，但
携带指向非本地来源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 标头，
该转发标头证据会使
loopback 本地性声明失效。随后配对路径会要求显式批准，
而不是静默地将该请求视为同主机连接。等效的
操作者身份验证规则见
[可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地，私有）

配对状态存储在 Gateway 网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹会随之移动。

安全注意事项：

- 令牌是机密；应将 `paired.json` 视为敏感文件。
- 轮换令牌需要重新批准（或删除节点条目）。

## 传输协议行为

- 传输协议是**无状态**的；它不存储成员资格。
- 如果 Gateway 网关离线或配对被禁用，节点无法配对。
- 如果 Gateway 网关处于远程模式，配对仍会针对远程 Gateway 网关的存储执行。

## 相关

- [渠道配对](/zh-CN/channels/pairing)
- [节点](/zh-CN/nodes)
- [设备 CLI](/zh-CN/cli/devices)
