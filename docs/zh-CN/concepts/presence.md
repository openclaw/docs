---
read_when:
    - 调试 Control UI 设备页面的实时状态
    - 调查重复或过期的实例行
    - 更改 Gateway 网关 WebSocket 连接或系统事件信标
summary: OpenClaw 在线状态条目的生成、合并与显示方式
title: 在线状态
x-i18n:
    generated_at: "2026-07-14T13:36:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw 的“在线状态”是一种轻量级、尽力而为的视图，涵盖：

- **Gateway 网关**本身，以及
- **连接到 Gateway 网关且用户可见的客户端**（Mac 应用、WebChat、节点等）

在线状态会在 Control UI 的**设备**页面
（位于**设置 → 设备**下）以及 macOS 应用的**实例**标签页中呈现实​​时连接元数据。

本页介绍 Gateway 网关的客户端列表。要检测你最近使用的 Mac
并将节点提醒路由到该设备，请参阅
[活跃计算机在线状态](/zh-CN/nodes/presence)。

## 在线状态字段（显示的内容）

在线状态条目是结构化对象，包含如下字段：

- `instanceId`（可选，但强烈建议提供）：稳定的客户端身份标识（通常为 `connect.client.instanceId`）
- `host`：易于理解的主机名
- `ip`：尽力获取的 IP 地址
- `version`：客户端版本字符串
- `deviceFamily` / `modelIdentifier`：硬件信息提示
- `mode`：`ui`、`webchat`、`cli`、`backend`、`node`、`probe`、`test`
- `lastInputSeconds`：自上次用户输入以来的秒数（如果已知）
- `reason`：客户端提供的自由格式字符串；Gateway 网关本身仅发出 `self`、`connect` 和 `disconnect`
- `deviceId`、`roles`、`scopes`：来自连接握手的设备身份及角色/权限范围提示
- `ts`：上次更新时间戳（自纪元以来的毫秒数）

## 产生方（在线状态的来源）

在线状态条目由多个来源产生并进行**合并**。

### 1) Gateway 网关自身条目

Gateway 网关始终会在启动时创建一个“自身”条目，因此即使还没有任何客户端连接，
UI 也能显示 Gateway 网关主机。

### 2) WebSocket 连接

每个 WS 客户端都以 `connect` 请求开始。握手成功后，
Gateway 网关会为该连接插入或更新一条在线状态条目。

#### 为什么临时控制平面连接不会显示

CLI 命令、后端 RPC 客户端和探针通常只会短暂连接。为了避免在整个在线状态 TTL 期间
保留这种频繁变动，处于 `cli`、`backend`
或 `probe` 模式的客户端**不会**转换为在线状态条目。测试模式客户端
仍会被跟踪，因为测试套件将其用作真实客户端的替代对象。

### 3) `system-event` 信标

客户端可以通过 `system-event` 方法发送信息更丰富的周期性信标。Mac
应用使用该方式报告主机名、IP 和 `lastInputSeconds`。

### 4) 节点连接（角色：节点）

当节点通过 Gateway 网关 WebSocket 使用 `role: node` 连接时，Gateway 网关
会为该节点插入或更新一条在线状态条目（流程与其他 WS 客户端相同）。

## 合并与去重规则（为什么 `instanceId` 很重要）

在线状态条目存储在单个内存映射中，并按以下顺序使用第一个可用值作为键，
且不区分大小写：已配对设备 ID、`connect.client.instanceId`，
最后才使用每个连接的 ID。

临时控制平面客户端完全不纳入跟踪（见上文），
因此其连接 ID 永远不会成为键。对于其他所有客户端，
使用连接 ID 作为后备键意味着，没有稳定
`instanceId` 的客户端重新连接时会显示为**重复**行。

## TTL 和大小限制

在线状态在设计上是临时的：

- **TTL：**超过 5 分钟的条目会被清理
- **最大条目数：**200（优先丢弃最旧的条目）

这能使列表保持最新，并避免内存无限增长。

## 远程连接/隧道注意事项（回环 IP）

当客户端通过 SSH 隧道或本地端口转发连接时，Gateway 网关
可能会将远程地址识别为 `127.0.0.1`。为避免将该隧道
地址记录为客户端 IP，对于检测为本地连接（回环）的客户端，
连接处理过程会完全省略 `ip`，而不是将回环地址
写入条目。

## 使用方

### Control UI 设备页面

**设备**页面会将 `system-presence` 与持久化的配对和节点
记录进行关联。它会将 Gateway 网关自身信标固定在首位，并使用匹配的设备或
实例 ID 获取实时平台、版本、型号和最近输入时间元数据。

### macOS 实例标签页

macOS 应用会呈现 `system-presence` 的输出，并根据上次更新距今的时间
应用一个简洁的状态指示器（活跃/空闲/过期）。

## 调试技巧

- 要查看原始列表，请针对 Gateway 网关调用 `system-presence`。
- 如果看到重复项：
  - 确认客户端在握手中发送稳定的 `client.instanceId`
  - 确认周期性信标使用相同的 `instanceId`
  - 检查连接派生的条目是否缺少 `instanceId`（此时出现重复项符合预期）

## 相关内容

<CardGroup cols={2}>
  <Card title="活跃计算机在线状态" href="/zh-CN/nodes/presence" icon="computer-mouse">
    物理 Mac 输入如何选择活跃节点并路由连接提醒。
  </Card>
  <Card title="输入状态指示器" href="/zh-CN/concepts/typing-indicators" icon="ellipsis">
    何时发送输入状态指示器，以及如何进行调整。
  </Card>
  <Card title="流式传输和分块" href="/zh-CN/concepts/streaming" icon="bars-staggered">
    出站流式传输、分块和各渠道的格式设置。
  </Card>
  <Card title="Gateway 网关架构" href="/zh-CN/concepts/architecture" icon="diagram-project">
    Gateway 网关组件以及驱动在线状态更新的 WebSocket 协议。
  </Card>
  <Card title="Gateway 网关协议" href="/zh-CN/gateway/protocol" icon="plug">
    `connect`、`system-event` 和 `system-presence` 的线路协议。
  </Card>
</CardGroup>
