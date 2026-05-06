---
read_when:
    - 调试实例选项卡
    - 调查重复或过期的实例行
    - 更改 Gateway 网关 WS connect 或 system-event 信标
summary: OpenClaw 在线状态条目如何生成、合并和显示
title: 在线状态
x-i18n:
    generated_at: "2026-05-06T01:35:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw “在线状态”是一个轻量级、尽力而为的视图，用于展示：

- **Gateway 网关**本身，以及
- **连接到 Gateway 网关的客户端**（mac 应用、WebChat、CLI 等）

在线状态主要用于渲染 macOS 应用的**实例**标签页，并提供快速的运维可见性。

## 在线状态字段（显示的内容）

在线状态条目是结构化对象，包含如下字段：

- `instanceId`（可选，但强烈建议）：稳定的客户端身份（通常为 `connect.client.instanceId`）
- `host`：便于人工识别的主机名
- `ip`：尽力获取的 IP 地址
- `version`：客户端版本字符串
- `deviceFamily` / `modelIdentifier`：硬件提示信息
- `mode`：`ui`、`webchat`、`cli`、`backend`、`probe`、`test`、`node`、……
- `lastInputSeconds`：“距离上次用户输入的秒数”（如果已知）
- `reason`：`self`、`connect`、`node-connected`、`periodic`、……
- `ts`：最后更新时间戳（自纪元以来的毫秒数）

## 生产者（在线状态来自哪里）

在线状态条目由多个来源生成并**合并**。

### 1) Gateway 网关自身条目

Gateway 网关始终会在启动时填充一个“自身”条目，因此即使尚未有任何客户端连接，UI 也能显示 Gateway 网关主机。

### 2) WebSocket 连接

每个 WS 客户端都以一个 `connect` 请求开始。握手成功后，Gateway 网关会为该连接插入或更新一个在线状态条目。

#### 为什么一次性 CLI 命令不会显示

CLI 经常为短暂的一次性命令建立连接。为了避免刷屏实例列表，`client.mode === "cli"` **不会**转换为在线状态条目。

### 3) `system-event` 信标

客户端可以通过 `system-event` 方法发送更丰富的周期性信标。mac 应用使用它来报告主机名、IP 和 `lastInputSeconds`。

### 4) 节点连接（角色：node）

当节点通过 Gateway 网关 WebSocket 使用 `role: node` 连接时，Gateway 网关会为该节点插入或更新一个在线状态条目（流程与其他 WS 客户端相同）。

## 合并 + 去重规则（为什么 `instanceId` 很重要）

在线状态条目存储在一个单一的内存映射中：

- 条目按**在线状态键**作为键。
- 最佳键是一个稳定的 `instanceId`（来自 `connect.client.instanceId`），它可以在重启后保持不变。
- 键不区分大小写。

如果客户端在没有稳定 `instanceId` 的情况下重新连接，它可能会显示为**重复**行。

## TTL 和有界大小

在线状态是有意设计为短暂的：

- **TTL：**超过 5 分钟的条目会被清理
- **最大条目数：**200（最旧的条目先丢弃）

这会让列表保持新鲜，并避免无界内存增长。

## 远程/隧道注意事项（环回 IP）

当客户端通过 SSH 隧道 / 本地端口转发连接时，Gateway 网关可能会看到远程地址为 `127.0.0.1`。为了避免覆盖客户端报告的有效 IP，环回远程地址会被忽略。

## 消费者

### macOS 实例标签页

macOS 应用会渲染 `system-presence` 的输出，并根据最后一次更新的时间应用一个小型状态指示器（活跃/空闲/过期）。

## 调试提示

- 要查看原始列表，请对 Gateway 网关调用 `system-presence`。
- 如果看到重复项：
  - 确认客户端在握手中发送稳定的 `client.instanceId`
  - 确认周期性信标使用相同的 `instanceId`
  - 检查连接派生的条目是否缺少 `instanceId`（此时重复项是预期行为）

## 相关内容

<CardGroup cols={2}>
  <Card title="输入指示器" href="/zh-CN/concepts/typing-indicators" icon="ellipsis">
    输入指示器何时发送，以及如何调优。
  </Card>
  <Card title="流式传输和分块" href="/zh-CN/concepts/streaming" icon="bars-staggered">
    出站流式传输、分块和按渠道格式化。
  </Card>
  <Card title="Gateway 网关架构" href="/zh-CN/concepts/architecture" icon="diagram-project">
    Gateway 网关组件，以及驱动在线状态更新的 WebSocket 协议。
  </Card>
  <Card title="Gateway 网关协议" href="/zh-CN/gateway/protocol" icon="plug">
    `connect`、`system-event` 和 `system-presence` 的线路协议。
  </Card>
</CardGroup>
