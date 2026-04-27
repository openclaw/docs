---
read_when:
    - 调试或配置 WebChat 访问
summary: local loopback WebChat 静态主机和 Gateway 网关 WS 用法，用于聊天 UI
title: WebChat
x-i18n:
    generated_at: "2026-04-27T19:49:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 15
---

Status：macOS/iOS SwiftUI 聊天 UI 直接与 Gateway 网关 WebSocket 通信。

## 它是什么

- 一个适用于网关的原生聊天 UI（没有嵌入式浏览器，也没有本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终返回到 WebChat。

## 快速开始

1. 启动网关。
2. 打开 WebChat UI（macOS/iOS 应用）或 Control UI 聊天选项卡。
3. 确保已配置有效的网关凭证路径（默认使用 shared-secret，
   即使在 loopback 上也是如此）。

## 工作原理（行为）

- UI 连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 为了稳定性设置了边界：Gateway 网关可能会截断长文本字段、省略较重的元数据，并将超大条目替换为 `[chat.history omitted: message too large]`。
- 对于现代追加式会话文件，`chat.history` 会遵循当前活动的转录分支，因此已放弃的重写分支和已被替代的提示副本不会在 WebChat 中渲染。
- 在为新的 `chat.send` 运行 id 生成之前，Control UI 会对同一会话、消息和附件的重复进行中的提交进行合并；Gateway 网关仍会对重复使用相同幂等键的请求进行去重。
- `chat.history` 也会进行显示规范化：仅运行时的 OpenClaw 上下文、入站信封包装器、内联投递指令标签（例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块），以及泄漏的 ASCII/全角模型控制标记，都会从可见文本中移除；而且，若某条 assistant 条目的全部可见文本仅为完全匹配的静默标记 `NO_REPLY` / `no_reply`，则该条目会被省略。
- 带有推理标记的回复负载（`isReasoning: true`）会从 WebChat 助手内容、转录回放文本和音频内容块中排除，因此仅思考用的负载不会显示为可见的助手消息，也不会成为可播放音频。
- `chat.inject` 会将一条助手备注直接追加到转录中，并广播到 UI（不会触发智能体运行）。
- 已中止的运行可以在 UI 中保留部分助手输出可见。
- 当存在缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中，并使用中止元数据标记这些条目。
- 历史记录始终从网关获取（不会监视本地文件）。
- 如果网关不可达，WebChat 为只读。

## Control UI 智能体工具面板

- Control UI 的 `/agents` 工具面板有两个独立视图：
  - **Available Right Now** 使用 `tools.effective(sessionKey=...)`，显示当前
    会话在运行时实际可用的内容，包括核心、插件和渠道拥有的工具。
  - **Tool Configuration** 使用 `tools.catalog`，并始终聚焦于配置文件、覆盖项和
    目录语义。
- 运行时可用性以会话为作用域。在同一个智能体上切换会话，可能会改变
  **Available Right Now** 列表。
- 配置编辑器并不意味着运行时可用性；实际访问权限仍遵循策略优先级
  （`allow`/`deny`、按智能体以及 provider/渠道覆盖）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道传输网关 WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当转录条目超过此限制时，Gateway 网关会截断长文本字段，并且可能用占位符替换超大的消息。客户端也可以按请求发送 `maxChars`，以便仅对单次 `chat.history` 调用覆盖此默认值。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  shared-secret WebSocket 凭证。
- `gateway.auth.allowTailscale`：启用后，浏览器中的 Control UI 聊天选项卡可以使用 Tailscale
  Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：为位于具备身份感知能力的**非 loopback** 代理源之后的浏览器客户端提供反向代理凭证（参见[Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程网关目标。
- `session.*`：会话存储和主键默认值。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [Dashboard](/zh-CN/web/dashboard)
