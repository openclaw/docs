---
read_when:
    - 调查旧版节点客户端代码或已归档的配对日志
    - 审计旧版节点接口过去暴露的内容
summary: 历史 Bridge protocol（旧版节点）：TCP JSONL、配对、限定范围的 RPC
title: 桥接协议
x-i18n:
    generated_at: "2026-07-11T20:31:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP 桥接已被**移除**。当前 OpenClaw 构建版本不再提供桥接监听器，`bridge.*` 配置键也已从架构中移除。本页仅作为历史参考。所有节点/操作员客户端都应使用 [Gateway 网关协议](/zh-CN/gateway/protocol)。
</Warning>

## 存在原因

- **安全边界**：仅公开一个小型允许列表，而非完整的 Gateway 网关 API 接口面。
- **配对 + 节点身份**：节点准入由 Gateway 网关负责，并绑定到每个节点各自的令牌。
- **设备发现体验**：节点可以通过 Bonjour 在局域网中发现 Gateway 网关，也可以通过 tailnet 直接连接。
- **环回 WS**：除非通过 SSH 隧道传输，否则完整的 WS 控制平面仅保留在本地。

## 传输协议

- TCP，每行一个 JSON 对象（JSONL）。
- 可选 TLS（`bridge.tls.enabled: true`）。
- 默认监听端口为 `18790`。

启用 TLS 后，设备发现 TXT 记录会包含 `bridgeTls=1`，以及作为非机密提示的 `bridgeTlsSha256`。Bonjour/mDNS TXT 记录未经身份验证；如果没有其他带外验证，客户端不能将广播的指纹视为权威固定值。

## 握手和配对

1. 客户端发送包含节点元数据和令牌（如果已配对）的 `hello`。
2. 如果尚未配对，Gateway 网关回复 `error`（`NOT_PAIRED` / `UNAUTHORIZED`）。
3. 客户端发送 `pair-request`。
4. Gateway 网关等待批准，然后发送 `pair-ok` 和 `hello-ok`。

`hello-ok` 过去会返回 `serverName`；现在，托管插件界面通过当前 Gateway 网关协议中的 `pluginSurfaceUrls` 公布（Canvas/A2UI 使用 `pluginSurfaceUrls.canvas`）。

## 帧

客户端到 Gateway 网关：

- `req` / `res`：限定范围的 Gateway 网关 RPC（聊天、会话、配置、健康状态、语音唤醒、`skills.bins`）。
- `event`：节点信号（语音转录、智能体请求、聊天订阅、Exec 生命周期）。

Gateway 网关到客户端：

- `invoke` / `invoke-res`：节点命令（`canvas.*`、`camera.*`、`screen.record`、`location.get`、`sms.send`）。
- `event`：已订阅会话的聊天更新。
- `ping` / `pong`：保活。

允许列表强制执行逻辑曾位于 `src/gateway/server-bridge.ts`（已移除）。

## Exec 生命周期事件

节点会发出 `exec.finished`，用于呈现已完成的 `system.run` 活动，Gateway 网关会将其映射为系统事件（旧版节点也可以发出 `exec.started`）。`exec.denied` 将被拒绝的 `system.run` 尝试标记为终止拒绝，且不会将系统事件加入队列，也不会唤醒智能体工作。

载荷字段（除非另有说明，否则均为可选）：

| 字段                             | 说明                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `sessionKey`                     | 必填。用于事件关联的智能体会话；对于 `exec.finished`，还用于系统事件投递。 |
| `runId`                          | 用于分组的唯一 Exec ID。                                                                   |
| `command`                        | 原始或格式化的命令字符串。                                                               |
| `exitCode`, `timedOut`, `output` | 完成详情（仅限已完成事件）。                                                            |
| `reason`                         | 拒绝原因（仅限拒绝事件）。                                                                   |

## 历史 tailnet 用法

- 将桥接绑定到 tailnet IP：在 `~/.openclaw/openclaw.json` 中设置 `bridge.bind: "tailnet"`（仅供历史参考；`bridge.*` 已不再是有效配置）。
- 客户端通过 MagicDNS 名称或 tailnet IP 连接。
- Bonjour 无法跨网络工作；否则需要使用广域 DNS-SD 或手动指定主机/端口。

## 版本控制

桥接隐式使用 v1，不支持最小/最大版本协商。当前节点/操作员客户端使用 WebSocket [Gateway 网关协议](/zh-CN/gateway/protocol)，该协议会协商协议版本范围。

## 相关内容

- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [节点](/zh-CN/nodes)
