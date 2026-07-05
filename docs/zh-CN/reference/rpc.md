---
read_when:
    - 添加或更改外部 CLI 集成
    - 调试 RPC 适配器（signal-cli、imsg）
summary: 外部 CLI（signal-cli、imsg）的 RPC 适配器和 Gateway 网关模式
title: RPC 适配器
x-i18n:
    generated_at: "2026-07-05T11:42:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw 通过 JSON-RPC 集成外部 CLI。当前使用两种模式。

## 模式 A：HTTP 守护进程（signal-cli）

- `signal-cli` 作为守护进程运行，通过 HTTP 提供 JSON-RPC。
- 事件流是 SSE（`/api/v1/events`）。
- 健康探测：`/api/v1/check`。
- 当 `channels.signal.autoStart=true` 时，OpenClaw 负责生命周期。

有关设置和端点，请参阅 [Signal](/zh-CN/channels/signal)。

## 模式 B：stdio 子进程（imsg）

- OpenClaw 将 `imsg rpc` 作为 [iMessage](/zh-CN/channels/imessage) 的子进程启动。
- JSON-RPC 通过标准输入/标准输出按行分隔传输（每行一个 JSON 对象）。
- 不需要 TCP 端口，也不需要守护进程。

使用的核心方法：

- `watch.subscribe` → 通知（`method: "message"`）
- `watch.unsubscribe`
- `send`
- `chats.list`（探测/诊断）

有关设置和寻址方式，请参阅 [iMessage](/zh-CN/channels/imessage)（优先使用 `chat_id`，而不是显示字符串）。

## 适配器指南

- Gateway 网关拥有该进程（启动/停止与提供商生命周期绑定）。
- 保持 RPC 客户端具备韧性：超时、退出后重启。
- 优先使用稳定 ID（例如 `chat_id`），而不是显示字符串。

## 相关

- [Gateway 网关协议](/zh-CN/gateway/protocol)
