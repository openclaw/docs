---
read_when:
    - 在 Control UI 设备页面调试实时状态
    - 调查重复或过期的实例行
    - 更改 Gateway 网关 WebSocket 连接或系统事件信标
summary: OpenClaw 在线状态条目的生成、合并与显示方式
title: 在线状态
x-i18n:
    generated_at: "2026-07-12T14:25:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c0ef74eeaaa5ee00e43dfcfb25d7e3652fd6e7d0fac2d236fe3b9af7d193d1c
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw 的“在线状态”是一种轻量级、尽力而为的视图，涵盖：

- **Gateway 网关**本身，以及
- **连接到 Gateway 网关且用户可见的客户端**（Mac 应用、WebChat、节点等）

在线状态会在 Control UI 的**设备**页面和 macOS 应用的**实例**标签页中呈现实时连接元数据。

本页介绍 Gateway 网关客户端列表。要检测你最近使用的 Mac 并将节点提醒路由到该设备，请参阅[活跃计算机在线状态](/nodes/presence)。

## 在线状态字段（显示的内容）

在线状态条目是结构化对象，包含如下字段：

- `instanceId`（可选，但强烈建议提供）：稳定的客户端标识（通常为 `connect.client.instanceId`）
- `host`：易于理解的主机名
- `ip`：尽力获取的 IP 地址
- `version`：客户端版本字符串
- `deviceFamily` / `modelIdentifier`：硬件提示信息
- `mode`：`ui`、`webchat`、`cli`、`backend`、`node`、`probe`、`test`
- `lastInputSeconds`：距上次用户输入的秒数（如已知）
- `reason`：由客户端提供的自由格式字符串；Gateway 网关本身仅发出 `self`、`connect` 和 `disconnect`
- `deviceId`、`roles`、`scopes`：来自连接握手的设备身份及角色/权限范围提示
- `ts`：上次更新时间戳（自纪元起的毫秒数）

## 生成来源（在线状态来自何处）

在线状态条目由多个来源生成并进行**合并**。

### 1) Gateway 网关自身条目

Gateway 网关在启动时始终会预置一个“自身”条目，以便即使尚无任何客户端连接，UI 也能显示网关主机。

### 2) WebSocket 连接

每个 WS 客户端都以 `connect` 请求开始。握手成功后，Gateway 网关会插入或更新该连接的在线状态条目。

#### 为什么临时控制平面连接不会显示

CLI 命令、后端 RPC 客户端和探针通常只会短暂连接。为避免在整个在线状态 TTL 期间保留这些频繁变动，处于 `cli`、`backend` 或 `probe` 模式的客户端**不会**转换为在线状态条目。测试模式客户端仍会被跟踪，因为测试套件会用它们代替真实客户端。

### 3) `system-event` 信标

客户端可以通过 `system-event` 方法发送信息更丰富的周期性信标。Mac 应用使用该方法报告主机名、IP 和 `lastInputSeconds`。

### 4) 节点连接（角色：node）

当节点通过 Gateway 网关 WebSocket 使用 `role: node` 进行连接时，Gateway 网关会插入或更新该节点的在线状态条目（流程与其他 WS 客户端相同）。

## 合并与去重规则（`instanceId` 为何重要）

在线状态条目存储在单个内存映射中，键不区分大小写，并按以下顺序使用首个可用值：已配对设备 ID、`connect.client.instanceId`，最后才使用每个连接的 ID。

临时控制平面客户端会完全排除在跟踪范围之外（见上文），因此其连接 ID 永远不会成为键。对于其他所有客户端，使用连接 ID 作为后备意味着：客户端在没有稳定 `instanceId` 的情况下重新连接时，会显示为**重复**行。

## TTL 和大小上限

在线状态有意设计为临时数据：

- **TTL：**超过 5 分钟的条目会被清理
- **条目上限：**200（优先丢弃最早的条目）

这样可以保持列表内容新鲜，并避免内存无限增长。

## 远程/隧道注意事项（回环 IP）

当客户端通过 SSH 隧道或本地端口转发进行连接时，Gateway 网关看到的远程地址可能是 `127.0.0.1`。为避免将该隧道地址记录为客户端 IP，连接处理逻辑会对检测为本地（回环）的客户端完全省略 `ip`，而不是将回环地址写入条目。

## 使用方

### Control UI 设备页面

**设备**页面会将 `system-presence` 与持久化的配对记录和节点记录关联起来。它会将 Gateway 网关自身信标固定在首位，并通过匹配设备 ID 或实例 ID，获取实时的平台、版本、型号和输入时间新近度元数据。

### macOS 实例标签页

macOS 应用会呈现 `system-presence` 的输出，并根据距上次更新的时间显示一个简洁的状态指示器（活跃/空闲/过期）。

## 调试提示

- 要查看原始列表，请对 Gateway 网关调用 `system-presence`。
- 如果看到重复项：
  - 确认客户端在握手时发送稳定的 `client.instanceId`
  - 确认周期性信标使用相同的 `instanceId`
  - 检查由连接生成的条目是否缺少 `instanceId`（此时出现重复项属于预期行为）

## 相关内容

<CardGroup cols={2}>
  <Card title="活跃计算机在线状态" href="/nodes/presence" icon="computer-mouse">
    物理 Mac 输入如何选择活跃节点并路由连接提醒。
  </Card>
  <Card title="输入状态指示器" href="/zh-CN/concepts/typing-indicators" icon="ellipsis">
    何时发送输入状态指示器以及如何进行调整。
  </Card>
  <Card title="流式传输和分块" href="/zh-CN/concepts/streaming" icon="bars-staggered">
    出站流式传输、分块和按渠道格式化。
  </Card>
  <Card title="Gateway 网关架构" href="/zh-CN/concepts/architecture" icon="diagram-project">
    Gateway 网关组件以及驱动在线状态更新的 WebSocket 协议。
  </Card>
  <Card title="Gateway 网关协议" href="/zh-CN/gateway/protocol" icon="plug">
    `connect`、`system-event` 和 `system-presence` 的线协议。
  </Card>
</CardGroup>
