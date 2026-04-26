---
read_when:
    - 调试或配置 WebChat 访问
summary: 用于聊天 UI 的 Loopback WebChat 静态主机和 Gateway 网关 WS 用法
title: WebChat
x-i18n:
    generated_at: "2026-04-26T08:43:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

Status：macOS/iOS SwiftUI 聊天 UI 直接与 Gateway 网关 WebSocket 通信。

## 它是什么

- 一个面向网关的原生聊天 UI（不使用嵌入式浏览器，也不使用本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终会返回到 WebChat。

## 快速开始

1. 启动网关。
2. 打开 WebChat UI（macOS/iOS 应用）或 Control UI 聊天标签页。
3. 确保已配置有效的网关认证路径（默认使用 shared-secret，即使在 loopback 上也是如此）。

## 工作原理（行为）

- UI 连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- 为了稳定性，`chat.history` 是有界的：Gateway 网关可能会截断较长的文本字段、省略较重的元数据，并将超大条目替换为 `[chat.history omitted: message too large]`。
- `chat.history` 还会进行显示规范化：仅运行时使用的 OpenClaw 上下文、入站信封包装器、内联传递指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄露的 ASCII / 全角模型控制令牌，都会从可见文本中剥离；此外，若某条 assistant 条目的全部可见文本仅为精确的静默令牌 `NO_REPLY` / `no_reply`，则该条目会被省略。
- 带有推理标记的回复负载（`isReasoning: true`）会从 WebChat assistant 内容、转录回放文本和音频内容块中排除，因此仅用于思考的负载不会显示为可见的 assistant 消息或可播放音频。
- `chat.inject` 会将 assistant 注释直接追加到转录中，并广播到 UI（不会触发智能体运行）。
- 已中止的运行可能会让部分 assistant 输出继续显示在 UI 中。
- 当存在缓冲输出时，Gateway 网关会将已中止的部分 assistant 文本持久化到转录历史中，并为这些条目标记中止元数据。
- 历史记录始终从网关获取（不监视本地文件）。
- 如果网关不可达，WebChat 将为只读模式。

## Control UI 智能体工具面板

- Control UI 的 `/agents` 工具面板有两个独立视图：
  - **当前可用** 使用 `tools.effective(sessionKey=...)`，显示当前会话在运行时实际可以使用的内容，包括 core、plugin 和渠道自有工具。
  - **工具配置** 使用 `tools.catalog`，并始终聚焦于配置档案、覆盖项和目录语义。
- 运行时可用性是会话范围的。在同一智能体上切换会话，可能会改变 **当前可用** 列表。
- 配置编辑器并不意味着运行时可用；实际访问权限仍遵循策略优先级（`allow` / `deny`，以及每智能体和 provider / channel 级别的覆盖）。

## 远程使用

- 远程模式通过 SSH / Tailscale 隧道传输网关 WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当某个转录条目超过此限制时，Gateway 网关会截断较长的文本字段，并可能用占位符替换超大消息。客户端也可以在单次 `chat.history` 调用中发送每请求 `maxChars` 以覆盖此默认值。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机 / 端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  shared-secret WebSocket 认证。
- `gateway.auth.allowTailscale`：启用后，浏览器中的 Control UI 聊天标签页可以使用 Tailscale Serve 身份头。
- `gateway.auth.mode: "trusted-proxy"`：为位于具备身份感知能力的**非 loopback**代理源之后的浏览器客户端提供反向代理认证（参见 [可信代理认证](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程网关目标。
- `session.*`：会话存储和主键默认值。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [Dashboard](/zh-CN/web/dashboard)
