---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对审批
    - 添加用于批准远程节点的 CLI 流程
    - 使用节点管理扩展 Gateway 网关协议
summary: Gateway 网关拥有的节点配对（方案 B），用于 iOS 和其他远程节点
title: 由 Gateway 网关管理的配对
x-i18n:
    generated_at: "2026-06-27T02:05:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

在 Gateway 网关拥有的配对中，**Gateway 网关**是哪些节点允许加入的事实来源。UI（macOS 应用、未来客户端）只是用于批准或拒绝待处理请求的前端。

**重要：**WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。`node.pair.*` 是单独的配对存储，**不会**控制 WS 握手。只有显式调用 `node.pair.*` 的客户端才使用此流程。

## 概念

- **待处理请求**：节点请求加入；需要批准。
- **已配对节点**：已批准并签发了认证令牌的节点。
- **传输协议**：Gateway 网关 WS 端点会转发请求，但不决定成员资格。（旧版 TCP bridge 支持已移除。）

## 配对如何工作

1. 节点连接到 Gateway 网关 WS 并请求配对。
2. Gateway 网关存储一个**待处理请求**并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（CLI 或 UI）。
4. 批准后，Gateway 网关会签发一个**新令牌**（重新配对时会轮换令牌）。
5. 节点使用令牌重新连接，现在即为“已配对”。

待处理请求会在 **5 分钟**后自动过期。

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

## API 表面（Gateway 网关协议）

事件：

- `node.pair.requested` - 创建新的待处理请求时发出。
- `node.pair.resolved` - 请求被批准/拒绝/过期时发出。

方法：

- `node.pair.request` - 创建或复用待处理请求。
- `node.pair.list` - 列出待处理 + 已配对节点（`operator.pairing`）。
- `node.pair.approve` - 批准待处理请求（签发令牌）。
- `node.pair.reject` - 拒绝待处理请求。
- `node.pair.remove` - 移除已配对节点。对于设备支持的配对，这会撤销设备的 `node` 角色：它会修改 `devices/paired.json`，并使该设备的节点角色会话失效/断开。**混合角色**设备（例如它还持有 `operator`）会保留其行，并且只失去 `node` 角色；仅节点设备行会被删除。它还会移除任何匹配的旧版 Gateway 网关拥有的节点配对条目。授权：`operator.pairing` 可以移除非 operator 节点行；设备令牌调用方在混合角色设备上撤销其**自己的**节点角色时，还需要 `operator.admin`。
- `node.pair.verify` - 验证 `{ nodeId, token }`。

说明：

- `node.pair.request` 对每个节点是幂等的：重复调用会返回同一个待处理请求。
- 对同一待处理节点的重复请求也会刷新已存储的节点元数据，以及最新的允许列表内声明命令快照，供 operator 查看。
- 批准**始终**会生成全新令牌；`node.pair.request` 永远不会返回令牌。
- Operator 作用域级别和批准时检查汇总在 [Operator 作用域](/zh-CN/gateway/operator-scopes) 中。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 使用待处理请求中声明的命令来强制执行额外批准作用域：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

<Warning>
节点配对是信任与身份流程，并包含令牌签发。它**不会**按节点固定实时节点命令表面。

- 实时节点命令来自节点在连接时声明的内容，并且会先应用 Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` 和 `denyCommands`）。
- 按节点的 `system.run` allow 和 ask 策略位于节点上的 `exec.approvals.node.*`，不在配对记录中。

</Warning>

## 节点命令门控（2026.3.31+）

<Warning>
**破坏性变更：**从 `2026.3.31` 开始，节点命令在节点配对获得批准之前会被禁用。仅有设备配对已不再足以暴露声明的节点命令。
</Warning>

节点首次连接时，会自动请求配对。在配对请求获批之前，来自该节点的所有待处理节点命令都会被过滤且不会执行。一旦通过配对批准建立信任，节点声明的命令就会在正常命令策略约束下变为可用。

这意味着：

- 以前仅依赖设备配对来暴露命令的节点，现在必须完成节点配对。
- 配对批准之前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**破坏性变更：**节点发起的运行现在会停留在缩减后的可信表面上。
</Warning>

节点发起的摘要和相关会话事件仅限于预期的受信任表面。此前依赖更广泛主机或会话工具访问权限的通知驱动或节点触发流程可能需要调整。此加固确保节点事件无法升级为超出节点信任边界所允许范围的主机级工具访问。

持久节点在线状态更新遵循相同的身份边界。`node.presence.alive` 事件仅从已认证的节点设备会话接受，并且只有在设备/节点身份已配对时才更新配对元数据。自声明的 `client.id` 值不足以写入最后可见状态。

## 自动审批（macOS 应用）

macOS 应用可以在以下情况下选择尝试**静默批准**：

- 请求标记为 `silent`，并且
- 应用可以使用同一用户验证到 Gateway 网关主机的 SSH 连接。

如果静默批准失败，它会回退到正常的“批准/拒绝”提示。

## 受信任 CIDR 设备自动审批

`role: node` 的 WS 设备配对默认仍为手动。对于 Gateway 网关已经信任网络路径的私有节点网络，操作员可以使用显式 CIDR 或精确 IP 选择启用：

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
- 不存在一键式 LAN 或私有网络自动批准模式。
- 只有未请求作用域的全新 `role: node` 设备配对才符合条件。
- 操作员、浏览器、Control UI 和 WebChat 客户端保持手动。
- 角色、作用域、元数据和公钥升级保持手动。
- 同主机环回受信任代理标头路径不符合条件，因为该路径可能被本地调用方伪造。

## 元数据升级自动审批

当已配对设备重新连接且仅包含非敏感元数据变更（例如显示名称或客户端平台提示）时，OpenClaw 会将其视为 `metadata-upgrade`。静默自动审批范围很窄：它仅适用于已证明拥有本地或共享凭证的受信任非浏览器本地重连，包括 OS 版本元数据变更后同主机原生应用重连。浏览器/Control UI 客户端和远程客户端仍使用显式重新审批流程。作用域升级（从读取到写入/管理员）和公钥变更**不**符合元数据升级自动审批条件，它们仍作为显式重新审批请求处理。

## QR 配对助手

`/pair qr` 将配对载荷渲染为结构化媒体，以便移动端和浏览器客户端可以直接扫描。

删除设备也会清理该设备 ID 的所有过期待处理配对请求，因此 `nodes pending` 在撤销后不会显示孤立行。

## 本地性和转发标头

只有当原始套接字和任何上游代理证据一致时，Gateway 网关配对才会将连接视为环回。如果请求通过环回到达，但携带 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 标头证据，该转发标头证据会使环回本地性声明失效。随后配对路径需要显式批准，而不是静默地将请求视为同主机连接。有关操作员认证上的等效规则，请参阅[受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地，私有）

配对状态存储在 Gateway 网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹会随之移动。

安全说明：

- 令牌是秘密；请将 `paired.json` 视为敏感文件。
- 轮换令牌需要重新审批（或删除节点条目）。

## 传输行为

- 传输是**无状态的**；它不存储成员关系。
- 如果 Gateway 网关离线或配对被禁用，节点无法配对。
- 如果 Gateway 网关处于远程模式，配对仍会针对远程 Gateway 网关的存储进行。

## 相关

- [频道配对](/zh-CN/channels/pairing)
- [节点](/zh-CN/nodes)
- [设备 CLI](/zh-CN/cli/devices)
