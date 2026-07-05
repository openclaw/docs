---
read_when:
    - 调试 Instances 标签页
    - 调查重复或过时的实例行
    - 更改 Gateway 网关 WS 连接或 system-event 信标
summary: OpenClaw 在线状态条目的生成、合并和显示方式
title: 在线状态
x-i18n:
    generated_at: "2026-07-05T11:15:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b8a2bf688fd94bd7145ca511fec259b9c868ea9bcbe75b12587f747dfaadf4d
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw “presence” 是一个轻量级、尽力而为的视图，用于展示：

- **Gateway 网关** 本身，以及
- **连接到 Gateway 网关 的客户端**（mac 应用、WebChat、CLI 等）

Presence 主要用于渲染 macOS 应用的 **Instances** 标签页，并提供快速的操作员可见性。

## Presence 字段（显示内容）

Presence 条目是结构化对象，包含如下字段：

- `instanceId`（可选但强烈建议）：稳定的客户端身份（通常是 `connect.client.instanceId`）
- `host`：便于人类识别的主机名
- `ip`：尽力获取的 IP 地址
- `version`：客户端版本字符串
- `deviceFamily` / `modelIdentifier`：硬件提示
- `mode`：`ui`、`webchat`、`cli`、`backend`、`node`、`probe`、`test`
- `lastInputSeconds`：自上次用户输入以来经过的秒数（如果已知）
- `reason`：客户端提供的自由格式字符串；Gateway 网关 本身只会发出 `self`、`connect` 和 `disconnect`
- `deviceId`、`roles`、`scopes`：来自连接握手的设备身份以及角色/权限范围提示
- `ts`：上次更新时间戳（自纪元以来的毫秒数）

## 生产者（Presence 来源）

Presence 条目由多个来源生成，并会被**合并**。

### 1) Gateway 网关自身条目

Gateway 网关始终会在启动时播种一个 “self” 条目，因此即使还没有任何客户端连接，UI 也会显示网关主机。

### 2) WebSocket 连接

每个 WS 客户端都会以 `connect` 请求开始。握手成功后，Gateway 网关会为该连接更新或插入一个 Presence 条目。

#### 为什么一次性 CLI 命令不会显示

CLI 经常为了短暂的一次性命令而连接。为了避免刷屏 Instances 列表，`client.mode === "cli"` **不会**转换为 Presence 条目。

### 3) `system-event` 信标

客户端可以通过 `system-event` 方法发送更丰富的周期性信标。mac 应用使用它来报告主机名、IP 和 `lastInputSeconds`。

### 4) 节点连接（角色：node）

当节点通过 Gateway 网关 WebSocket 以 `role: node` 连接时，Gateway 网关会为该节点更新或插入一个 Presence 条目（流程与其他 WS 客户端相同）。

## 合并 + 去重规则（为什么 `instanceId` 很重要）

Presence 条目存储在单个内存映射中，键不区分大小写，并按顺序使用第一个可用值：已配对设备 ID、`connect.client.instanceId`，或作为最后手段的每连接 ID。

CLI 客户端会被完全排除在跟踪之外（见上文），因此它们的连接 ID 永远不会成为键。对于其他所有客户端，连接 ID 回退意味着如果客户端在没有稳定 `instanceId` 的情况下重新连接，会显示为**重复**行。

## TTL 和有界大小

Presence 有意设计为临时数据：

- **TTL：** 超过 5 分钟的条目会被剪除
- **最大条目数：** 200（最旧的优先删除）

这会保持列表新鲜，并避免内存无限增长。

## 远程/隧道注意事项（loopback IP）

当客户端通过 SSH 隧道 / 本地端口转发连接时，Gateway 网关看到的远程地址可能是 `127.0.0.1`。为避免把该隧道地址记录为客户端的 IP，连接处理会对检测为本地（loopback）的客户端完全省略 `ip`，而不是把 loopback 地址写入条目。

## 消费者

### macOS Instances 标签页

macOS 应用会渲染 `system-presence` 的输出，并根据上次更新的时间应用一个小型状态指示器（活跃/空闲/过期）。

## 调试提示

- 要查看原始列表，请对 Gateway 网关调用 `system-presence`。
- 如果看到重复项：
  - 确认客户端在握手中发送稳定的 `client.instanceId`
  - 确认周期性信标使用相同的 `instanceId`
  - 检查连接派生的条目是否缺少 `instanceId`（出现重复项是预期行为）

## 相关

<CardGroup cols={2}>
  <Card title="输入指示器" href="/zh-CN/concepts/typing-indicators" icon="ellipsis">
    何时发送输入指示器以及如何调优。
  </Card>
  <Card title="流式传输和分块" href="/zh-CN/concepts/streaming" icon="bars-staggered">
    出站流式传输、分块和按渠道格式化。
  </Card>
  <Card title="Gateway 网关架构" href="/zh-CN/concepts/architecture" icon="diagram-project">
    Gateway 网关组件，以及驱动 Presence 更新的 WebSocket 协议。
  </Card>
  <Card title="Gateway 网关协议" href="/zh-CN/gateway/protocol" icon="plug">
    `connect`、`system-event` 和 `system-presence` 的传输协议。
  </Card>
</CardGroup>
