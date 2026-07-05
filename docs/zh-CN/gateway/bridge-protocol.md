---
read_when:
    - 正在调查旧版节点客户端代码或已归档的配对日志
    - 审计旧版节点表面过去暴露的内容
summary: 历史桥接协议（旧版节点）：TCP JSONL、配对、作用域限定 RPC
title: 桥接协议
x-i18n:
    generated_at: "2026-07-05T11:17:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP 桥接器已被**移除**。当前 OpenClaw 构建不再随附桥接监听器，`bridge.*` 配置键也不再包含在 schema 中。此页面仅作历史参考。所有节点/操作员客户端请使用 [Gateway 网关协议](/zh-CN/gateway/protocol)。
</Warning>

## 它存在的原因

- **安全边界**：暴露一个小型允许列表，而不是完整的 Gateway 网关 API 表面。
- **配对 + 节点身份**：节点准入由 Gateway 网关负责，并绑定到每个节点的令牌。
- **设备发现 UX**：节点可以通过局域网中的 Bonjour 发现 Gateway 网关，或通过尾网直接连接。
- **回环 WS**：完整的 WS 控制平面保持在本地，除非通过 SSH 建立隧道。

## 传输

- TCP，每行一个 JSON 对象（JSONL）。
- 可选 TLS（`bridge.tls.enabled: true`）。
- 默认监听端口是 `18790`。

启用 TLS 时，设备发现 TXT 记录会包含 `bridgeTls=1`，并包含 `bridgeTlsSha256` 作为非机密提示。Bonjour/mDNS TXT 记录未经身份验证；如果没有其他带外验证，客户端不能将通告的指纹视为权威固定值。

## 握手和配对

1. 客户端发送带有节点元数据和令牌（如果已配对）的 `hello`。
2. 如果未配对，Gateway 网关回复 `error`（`NOT_PAIRED` / `UNAUTHORIZED`）。
3. 客户端发送 `pair-request`。
4. Gateway 网关等待批准，然后发送 `pair-ok` 和 `hello-ok`。

`hello-ok` 过去会返回 `serverName`；托管插件界面现在通过当前 Gateway 网关协议上的 `pluginSurfaceUrls` 通告（Canvas/A2UI 使用 `pluginSurfaceUrls.canvas`）。

## 帧

客户端到 Gateway 网关：

- `req` / `res`：限定范围的 Gateway 网关 RPC（聊天、会话、配置、健康、voicewake、skills.bins）。
- `event`：节点信号（语音转录、智能体请求、聊天订阅、exec 生命周期）。

Gateway 网关到客户端：

- `invoke` / `invoke-res`：节点命令（`canvas.*`、`camera.*`、`screen.record`、`location.get`、`sms.send`）。
- `event`：已订阅会话的聊天更新。
- `ping` / `pong`：keepalive。

允许列表强制执行位于 `src/gateway/server-bridge.ts`（已移除）。

## Exec 生命周期事件

节点会发出 `exec.finished` 来呈现已完成的 `system.run` 活动，并由 Gateway 网关映射为系统事件（旧版节点也可以发出 `exec.started`）。`exec.denied` 将被拒绝的 `system.run` 尝试标记为终端拒绝，不会将系统事件加入队列，也不会唤醒智能体工作。

载荷字段（除非注明，否则均为可选）：

| 字段                             | 说明                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `sessionKey`                     | 必填。用于事件关联的智能体会话；对于 `exec.finished`，也用于系统事件投递。                    |
| `runId`                          | 用于分组的唯一 exec ID。                                                                       |
| `command`                        | 原始或格式化后的命令字符串。                                                                  |
| `exitCode`, `timedOut`, `output` | 完成详情（仅 finished）。                                                                      |
| `reason`                         | 拒绝原因（仅 denied）。                                                                        |

## 历史尾网用法

- 将桥接器绑定到尾网 IP：在 `~/.openclaw/openclaw.json` 中设置 `bridge.bind: "tailnet"`（仅作历史参考；`bridge.*` 不再是有效配置）。
- 客户端通过 MagicDNS 名称或尾网 IP 连接。
- Bonjour 不会跨网络工作；否则需要广域 DNS-SD 或手动主机/端口。

## 版本控制

桥接器是隐式 v1，没有最小/最大版本协商。当前节点/操作员客户端使用 WebSocket [Gateway 网关协议](/zh-CN/gateway/protocol)，该协议会协商协议版本范围。

## 相关

- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [节点](/zh-CN/nodes)
