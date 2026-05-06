---
read_when:
    - 无需 macOS 界面实现节点配对审批
    - 添加用于批准远程节点的 CLI 流程
    - 通过节点管理扩展 Gateway 网关协议
summary: 适用于 iOS 和其他远程节点的 Gateway 网关负责的节点配对（方案 B）
title: Gateway 网关拥有的配对
x-i18n:
    generated_at: "2026-05-06T03:19:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75713e04e37dcbae151d170e2eb459d0e9b9a799c64a10db731b61d7b53998b4
    source_path: gateway/pairing.md
    workflow: 16
---

在 Gateway 网关拥有的配对中，**Gateway 网关**是哪些节点可以加入的事实来源。UI（macOS 应用、未来客户端）只是批准或拒绝待处理请求的前端。

**重要：** WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。`node.pair.*` 是独立的配对存储，并且**不会**门控 WS 握手。只有显式调用 `node.pair.*` 的客户端才使用此流程。

## 概念

- **待处理请求**：一个节点请求加入；需要批准。
- **已配对节点**：已批准并签发了身份验证令牌的节点。
- **传输协议**：Gateway 网关 WS 端点会转发请求，但不决定成员资格。（旧版 TCP bridge 支持已移除。）

## 配对如何工作

1. 节点连接到 Gateway 网关 WS 并请求配对。
2. Gateway 网关存储一个**待处理请求**并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（CLI 或 UI）。
4. 批准后，Gateway 网关签发一个**新令牌**（重新配对时会轮换令牌）。
5. 节点使用该令牌重新连接，现在已“配对”。

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

## API 接口面（Gateway 网关协议）

事件：

- `node.pair.requested` - 创建新的待处理请求时发出。
- `node.pair.resolved` - 请求被批准/拒绝/过期时发出。

方法：

- `node.pair.request` - 创建或复用待处理请求。
- `node.pair.list` - 列出待处理 + 已配对节点（`operator.pairing`）。
- `node.pair.approve` - 批准待处理请求（签发令牌）。
- `node.pair.reject` - 拒绝待处理请求。
- `node.pair.remove` - 移除过时的已配对节点条目。
- `node.pair.verify` - 验证 `{ nodeId, token }`。

注意事项：

- `node.pair.request` 对每个节点是幂等的：重复调用会返回同一个待处理请求。
- 对同一个待处理节点的重复请求也会刷新存储的节点元数据，以及最新的允许列表声明命令快照，供操作者查看。
- 批准**总是**生成全新令牌；`node.pair.request` 永远不会返回令牌。
- 操作者作用域级别和批准时检查汇总在
  [Operator scopes](/zh-CN/gateway/operator-scopes) 中。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 使用待处理请求声明的命令来强制执行额外批准作用域：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

<Warning>
节点配对是信任和身份流程，并会签发令牌。它**不会**按节点固定实时节点命令表面。

- 实时节点命令来自节点在连接时声明的内容，且会先应用 Gateway 网关的全局节点命令策略（`gateway.nodes.allowCommands` 和 `denyCommands`）。
- 按节点的 `system.run` 允许和询问策略位于节点的 `exec.approvals.node.*` 中，而不在配对记录中。

</Warning>

## 节点命令门控（2026.3.31+）

<Warning>
**破坏性变更：** 从 `2026.3.31` 开始，节点命令会被禁用，直到节点配对获得批准。仅靠设备配对不再足以暴露已声明的节点命令。
</Warning>

当节点首次连接时，会自动请求配对。在配对请求获得批准之前，来自该节点的所有待处理节点命令都会被过滤，并且不会执行。一旦通过配对批准建立信任，节点声明的命令将可用，但仍受正常命令策略约束。

这意味着：

- 以前仅依赖设备配对来暴露命令的节点，现在必须完成节点配对。
- 配对批准前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（2026.3.31+）

<Warning>
**破坏性变更：** 源自节点的运行现在会停留在缩减后的受信任表面上。
</Warning>

源自节点的摘要和相关会话事件会被限制在预期的受信任表面内。以前依赖更广泛主机或会话工具访问权限的通知驱动或节点触发流程可能需要调整。这项加固确保节点事件无法升级为超出节点信任边界所允许范围的主机级工具访问。

持久节点在线状态更新遵循相同的身份边界。`node.presence.alive` 事件只接受来自已认证节点设备会话的事件，并且只有当设备/节点身份已经配对时才会更新配对元数据。自声明的 `client.id` 值不足以写入上次在线状态。

## 自动批准（macOS 应用）

macOS 应用可以在以下情况下选择尝试**静默批准**：

- 请求被标记为 `silent`，并且
- 应用可以使用同一用户验证到 Gateway 网关主机的 SSH 连接。

如果静默批准失败，它会回退到正常的“批准/拒绝”提示。

## 受信任 CIDR 设备自动批准

`role: node` 的 WS 设备配对默认仍为手动。对于 Gateway 网关已经信任网络路径的私有节点网络，操作者可以通过显式 CIDR 或精确 IP 选择启用：

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
- 不存在全局 LAN 或私有网络自动批准模式。
- 只有没有请求作用域的新鲜 `role: node` 设备配对符合条件。
- 操作者、浏览器、Control UI 和 WebChat 客户端保持手动。
- 角色、作用域、元数据和公钥升级保持手动。
- 同主机 local loopback 受信任代理标头路径不符合条件，因为该路径可能被本地调用方伪造。

## 元数据升级自动批准

当已配对设备重新连接且只有非敏感元数据变更（例如显示名称或客户端平台提示）时，OpenClaw 会将其视为 `metadata-upgrade`。静默自动批准的范围很窄：它只适用于受信任的非浏览器本地重连，并且这些重连已经证明持有本地或共享凭证，包括 OS 版本元数据变更后同主机原生应用的重连。浏览器/Control UI 客户端和远程客户端仍使用显式重新批准流程。作用域升级（从读取到写入/管理员）和公钥变更**不**符合元数据升级自动批准条件，它们仍作为显式重新批准请求处理。

## QR 配对辅助工具

`/pair qr` 会将配对载荷渲染为结构化媒体，以便移动端和浏览器客户端可以直接扫描。

删除设备也会清理该设备 ID 的所有过期待处理配对请求，因此撤销后 `nodes pending` 不会显示孤立行。

## 本地性和转发标头

只有当原始套接字和任何上游代理证据一致时，Gateway 网关配对才会将连接视为 loopback。如果请求到达 loopback，但携带指向非本地来源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 标头，则该转发标头证据会使 loopback 本地性声明失效。随后配对路径需要显式批准，而不是静默地将请求视为同主机连接。关于操作者身份验证的等效规则，请参阅
[Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)。

## 存储（本地、私有）

配对状态存储在 Gateway 网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹也会随之移动。

安全注意事项：

- 令牌是机密；请将 `paired.json` 视为敏感文件。
- 轮换令牌需要重新批准（或删除节点条目）。

## 传输协议行为

- 传输协议是**无状态的**；它不存储成员资格。
- 如果 Gateway 网关离线或配对被禁用，节点无法配对。
- 如果 Gateway 网关处于远程模式，配对仍会针对远程 Gateway 网关的存储进行。

## 相关

- [频道配对](/zh-CN/channels/pairing)
- [节点](/zh-CN/nodes)
- [设备 CLI](/zh-CN/cli/devices)
