---
read_when:
    - 在没有 macOS UI 的情况下实现节点配对批准
    - 添加用于批准远程节点的 CLI 流程
    - 使用节点管理扩展 Gateway protocol
summary: 适用于 iOS 和其他远程节点的 Gateway 网关持有型节点配对（方案 B）
title: Gateway 网关持有型配对
x-i18n:
    generated_at: "2026-04-05T08:24:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f90818c84daeb190f27df7413e23362372806f2c4250e4954295fbf6df70233
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway 网关持有型配对（方案 B）

在 Gateway 网关持有型配对中，**Gateway 网关**是决定哪些节点
允许加入的真实来源。UI（macOS 应用、未来的客户端）只是用于
批准或拒绝待处理请求的前端。

**重要：** WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。
`node.pair.*` 是单独的配对存储，**不会**控制 WS 握手。
只有显式调用 `node.pair.*` 的客户端才会使用此流程。

## 概念

- **待处理请求**：某个节点请求加入；需要批准。
- **已配对节点**：已批准并获得已签发 auth token 的节点。
- **传输协议**：Gateway WS 端点负责转发请求，但不决定
  成员资格。（旧版 TCP bridge 支持已被移除。）

## 配对如何工作

1. 节点连接到 Gateway WS 并请求配对。
2. Gateway 网关存储一个**待处理请求**，并发出 `node.pair.requested`。
3. 你批准或拒绝该请求（CLI 或 UI）。
4. 批准后，Gateway 网关会签发一个**新 token**（重新配对时 token 会轮换）。
5. 节点使用该 token 重新连接，此时即为“已配对”。

待处理请求会在 **5 分钟**后自动过期。

## CLI 工作流（适合无头环境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 会显示已配对/已连接节点及其能力。

## API surface（Gateway protocol）

事件：

- `node.pair.requested` —— 创建新的待处理请求时发出。
- `node.pair.resolved` —— 请求被批准/拒绝/过期时发出。

方法：

- `node.pair.request` —— 创建或复用一个待处理请求。
- `node.pair.list` —— 列出待处理 + 已配对节点（`operator.pairing`）。
- `node.pair.approve` —— 批准待处理请求（签发 token）。
- `node.pair.reject` —— 拒绝待处理请求。
- `node.pair.verify` —— 验证 `{ nodeId, token }`。

说明：

- `node.pair.request` 对每个节点是幂等的：重复调用会返回相同的
  待处理请求。
- 对同一个待处理节点的重复请求，也会刷新已存储的节点
  元数据，以及最新的已加入 allowlist 的声明命令快照，以便操作员查看。
- 批准**总是**生成一个新的 token；`node.pair.request` 绝不会返回
  token。
- 请求可以包含 `silent: true`，作为自动批准流程的提示。
- `node.pair.approve` 使用待处理请求中声明的命令来强制执行
  额外的批准 scopes：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

重要说明：

- 节点配对是一个信任/身份流程，并附带 token 签发。
- 它**不会**按节点固定实时节点命令 surface。
- 实时节点命令来自节点在 connect 后声明的内容，并会在应用
  Gateway 网关全局节点命令策略（`gateway.nodes.allowCommands` /
  `denyCommands`）后生效。
- 每节点的 `system.run` allow/ask 策略位于节点本身的
  `exec.approvals.node.*` 中，而不在配对记录中。

## 节点命令门控（`2026.3.31+`）

<Warning>
**破坏性变更：** 从 `2026.3.31` 开始，在节点配对获批之前，节点命令将被禁用。仅靠设备配对已不足以暴露已声明的节点命令。
</Warning>

当节点首次连接时，会自动请求配对。在配对请求获批之前，来自该节点的所有待处理节点命令都会被过滤，不会执行。一旦通过配对批准建立信任，该节点声明的命令就会在正常命令策略约束下变得可用。

这意味着：

- 之前仅依赖设备配对来暴露命令的节点，现在必须完成节点配对。
- 在配对批准前排队的命令会被丢弃，而不是延后执行。

## 节点事件信任边界（`2026.3.31+`）

<Warning>
**破坏性变更：** 节点来源的运行现在会保持在收缩后的受信任 surface 内。
</Warning>

节点来源的摘要和相关会话事件会被限制在预期的受信任 surface 内。之前依赖更广泛宿主级或会话工具访问权限的通知驱动或节点触发流程，可能需要调整。这项加固确保节点事件不能升级为超出节点信任边界允许范围的宿主级工具访问。

## 自动批准（macOS 应用）

在以下情况下，macOS 应用可以选择尝试**静默批准**：

- 该请求被标记为 `silent`，并且
- 应用能够验证使用同一用户连接到 Gateway 网关宿主机的 SSH 连接。

如果静默批准失败，则会回退到正常的“批准/拒绝”提示。

## 存储（本地，私有）

配对状态存储在 Gateway 网关状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖了 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹也会随之移动。

安全说明：

- Token 属于密钥；请将 `paired.json` 视为敏感文件。
- 轮换 token 需要重新批准（或删除该节点条目）。

## 传输协议行为

- 传输协议是**无状态**的；它不存储成员资格。
- 如果 Gateway 网关离线或禁用了配对，节点将无法配对。
- 如果 Gateway 网关处于远程模式，配对仍然会针对远程 Gateway 网关的存储进行。
