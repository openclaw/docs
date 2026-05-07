---
read_when:
    - 添加或更改外部 CLI 集成
    - 调试 RPC 适配器（signal-cli、imsg）
summary: 用于外部 CLI（signal-cli、imsg）的 RPC 适配器和 Gateway 网关模式
title: RPC 适配器
x-i18n:
    generated_at: "2026-05-07T01:53:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw 通过 JSON-RPC 集成外部 CLI。目前使用两种模式。

## 模式 A：HTTP 守护进程（signal-cli）

- `signal-cli` 作为守护进程运行，通过 HTTP 使用 JSON-RPC。
- 事件流是 SSE（`/api/v1/events`）。
- 健康探测：`/api/v1/check`。
- 当 `channels.signal.autoStart=true` 时，OpenClaw 负责生命周期。

请参阅 [Signal](/zh-CN/channels/signal) 了解设置和端点。

## 模式 B：stdio 子进程（旧版：imsg）

> **注意：** 对于新的 iMessage 设置，请改用 [BlueBubbles](/zh-CN/channels/bluebubbles)。

- OpenClaw 将 `imsg rpc` 作为子进程启动（旧版 iMessage 集成）。
- JSON-RPC 通过 stdin/stdout 按行分隔传输（每行一个 JSON 对象）。
- 不需要 TCP 端口，也不需要守护进程。

使用的核心方法：

- `watch.subscribe` → 通知（`method: "message"`）
- `watch.unsubscribe`
- `send`
- `chats.list`（探测/诊断）

请参阅 [iMessage](/zh-CN/channels/imessage) 了解旧版设置和寻址（优先使用 `chat_id`）。

## 适配器指南

- Gateway 网关 拥有该进程（启动/停止与提供商生命周期绑定）。
- 保持 RPC 客户端有韧性：超时、退出时重启。
- 优先使用稳定 ID（例如 `chat_id`），而不是显示字符串。

## 相关

- [Gateway 网关协议](/zh-CN/gateway/protocol)
