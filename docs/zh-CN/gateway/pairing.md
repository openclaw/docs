---
read_when:
    - 无需 macOS UI 实现节点配对审批
    - 添加用于批准远程节点的 CLI 流程
    - 使用节点管理扩展 Gateway 网关协议
summary: Gateway 网关负责的节点配对（选项 B），用于 iOS 和其他远程节点
title: Gateway 网关拥有的配对
x-i18n:
    generated_at: "2026-07-06T21:48:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5793d2b0c440e2a0b455055493996f03c43fe087a55371c6e36b7752265d208
    source_path: gateway/pairing.md
    workflow: 16
---

在 Gateway 网关负责的配对中，**Gateway 网关**是哪些节点可以加入的事实来源。UI（macOS 应用、未来客户端）只是批准或拒绝待处理请求的前端。

**重要：**WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。`node.pair.*` 是一个独立的旧版配对存储，**不会**控制 WS 握手。只有显式调用 `node.pair.*` 的客户端才会使用此流程。

## 概念

- **待处理请求**：节点请求加入；需要批准。
- **已配对节点**：已批准并签发了认证令牌的节点。
- **传输协议**：Gateway 网关 WS 端点转发请求，但不决定成员资格。旧版 TCP bridge 支持已被移除。

## 配对如何工作

1. 节点连接到 Gateway 网关 WS 并请求配对。
2. Gateway 网关存储一个**待处理请求**并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（CLI 或 UI）。
4. 批准后，Gateway 网关签发一个**新令牌**（重新配对时令牌会轮换）。
5. 节点使用该令牌重新连接，现在已完成配对。

待处理请求会在**节点最后一次重试后 5 分钟**自动过期——一个正在主动重连的节点会让它的单个待处理请求保持存活，而不是每次尝试都生成新的请求（和批准提示）。

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

- `node.pair.requested` - 创建新的待处理请求时发出。
- `node.pair.resolved` - 请求被批准、拒绝或过期时发出。

方法：

- `node.pair.request` - 创建或复用待处理请求。
- `node.pair.list` - 列出待处理和已配对的节点（`operator.pairing`）。
- `node.pair.approve` - 批准待处理请求（签发令牌）。
- `node.pair.reject` - 拒绝待处理请求。
- `node.pair.remove` - 移除已配对节点。对于由设备支撑的配对，这会撤销设备的 `node` 角色：它会修改 `devices/paired.json`，并使该设备的节点角色会话失效/断开。**混合角色**设备（例如同时持有 `operator` 的设备）会保留其行，只失去 `node` 角色；仅节点的设备行会被删除。它还会清除任何匹配的旧版 Gateway 网关负责的节点配对条目。Authz：`operator.pairing` 可以移除非操作员节点行；设备令牌调用方在混合角色设备上撤销其**自己的**节点角色时，还需要 `operator.admin`。
- `node.pair.verify` - 验证 `{ nodeId, token }`。

注意：

- `node.pair.request` 对每个节点是幂等的：重复调用会返回同一个待处理请求。
- 对同一个待处理节点的重复请求会刷新存储的节点元数据，以及最新的、已列入允许列表的声明命令快照，以便操作员可见。
- 批准**总是**生成全新令牌；`node.pair.request` 从不返回令牌。
- 操作员权限范围级别和批准时检查汇总在[操作员权限范围](/zh-CN/gateway/operator-scopes)中。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 使用待处理请求声明的命令来强制执行额外批准权限范围：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

<Warning>
节点配对是信任和身份流程，并会签发令牌。它**不会**按节点固定实时节点命令表面。

- 实时节点命令来自节点在连接时声明的内容，并由 Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` 和 `denyCommands`）过滤。
- 按节点的 `system.run` 允许和询问策略位于节点上的 `exec.approvals.node.*`，不在配对记录中。

</Warning>

## 节点命令门控（2026.3.31+）

<Warning>
**破坏性变更：**从 `2026.3.31` 开始，节点命令在节点配对获得批准前会被禁用。仅完成设备配对已不足以暴露声明的节点命令。
</Warning>

当节点首次连接时，会自动请求配对。在该请求获得批准之前，该节点的所有待处理节点命令都会被过滤且不会执行。配对获得批准后，节点声明的命令会变为可用，并受常规命令策略约束。

这意味着：

- 之前仅依赖设备配对来暴露命令的节点，现在还必须完成节点配对。
- 配对批准前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**破坏性变更：**源自节点的运行现在会停留在缩减后的受信任表面上。
</Warning>

源自节点的摘要和相关会话事件被限制在预期的受信任表面内。之前依赖更宽泛主机或会话工具访问权限的通知驱动或节点触发流程，可能需要调整。此加固会防止节点事件升级为超出节点信任边界所允许范围的主机级工具访问。

持久节点在线状态更新遵循相同的身份边界：`node.presence.alive` 事件只接受来自已认证节点设备会话的事件，并且只在设备/节点身份已配对时更新配对元数据。自声明的 `client.id` 值不足以写入最后在线状态。

## 自动批准（macOS 应用）

macOS 应用可以在以下情况下尝试**静默批准**：

- 请求被标记为 `silent`，并且
- 应用可以使用同一用户验证到 Gateway 网关主机的 SSH 连接。

如果静默批准失败，它会回退到常规的批准/拒绝提示。

## 受信任 CIDR 设备自动批准

`role: node` 的 WS 设备配对默认保持手动。对于 Gateway 网关已信任网络路径的私有节点网络，操作员可以通过显式 CIDR 或精确 IP 选择启用：

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
- 不存在覆盖整个 LAN 或私有网络的自动批准模式。
- 只有全新的 `role: node` 设备配对请求且未请求任何权限范围时才符合条件。
- 操作员、浏览器、Control UI 和 WebChat 客户端保持手动。
- 角色、权限范围、元数据和公钥升级保持手动。
- 同主机 loopback 受信任代理标头路径不符合条件，因为该路径可能被本地调用方伪造。

## 元数据升级自动批准

当已配对设备仅以非敏感元数据变更重新连接时（例如显示名称或客户端平台提示），OpenClaw 会将其视为 `metadata-upgrade`。静默自动批准的范围很窄：它只适用于受信任的非浏览器本地重连，这些重连已证明持有本地或共享凭据，包括 OS 版本元数据变化后同主机原生应用重新连接。浏览器/Control UI 客户端和远程客户端仍使用显式重新批准流程。权限范围升级（从读取到写入/admin）和公钥变更**不**符合元数据升级自动批准条件；它们保持为显式重新批准请求。

## QR 配对辅助工具

`/pair qr` 将配对载荷呈现为结构化媒体，以便移动端和浏览器客户端可以直接扫描。

删除设备还会清理该设备 ID 的任何过期待处理配对请求，因此撤销后 `nodes pending` 不会显示孤立行。

## 本地性和转发标头

Gateway 网关配对只有在原始套接字和任何上游代理证据都一致时，才会将连接视为 loopback。如果请求到达 loopback，但携带 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 标头证据，则该转发标头证据会使 loopback 本地性声明失效，配对路径会要求显式批准，而不是静默地将该请求视为同主机连接。关于操作员认证的等效规则，请参阅[受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地、私有）

配对状态存储在 Gateway 网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹会随之移动。

安全注意事项：

- 令牌是密钥；将 `paired.json` 视为敏感文件。
- 轮换令牌需要重新批准（或删除节点条目）。

## 传输协议行为

- 传输协议是**无状态**的；它不存储成员资格。
- 如果 Gateway 网关离线或配对被禁用，节点无法配对。
- 在远程模式下，配对会针对远程 Gateway 网关的存储进行。

## 相关

- [渠道配对](/zh-CN/channels/pairing)
- [节点 CLI](/zh-CN/cli/nodes)
- [设备 CLI](/zh-CN/cli/devices)
