---
read_when:
    - 调试或配置 WebChat 访问
summary: 用于聊天 UI 的 loopback WebChat 静态主机和 Gateway WS 用法
title: WebChat
x-i18n:
    generated_at: "2026-04-24T04:08:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

状态：macOS/iOS SwiftUI 聊天 UI 直接与 Gateway WebSocket 通信。

## 它是什么

- 一个面向 gateway 的原生聊天 UI（没有嵌入式浏览器，也没有本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复总是返回到 WebChat。

## 快速开始

1. 启动 gateway。
2. 打开 WebChat UI（macOS/iOS 应用）或 Control UI 聊天标签页。
3. 确保已配置有效的 gateway 认证路径（默认是共享密钥，
   即使在 loopback 上也是如此）。

## 工作原理（行为）

- UI 连接到 Gateway WebSocket，并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 为了稳定性设置了边界：Gateway 网关可能会截断长文本字段、省略较重的元数据，并将过大的条目替换为 `[chat.history omitted: message too large]`。
- `chat.history` 也会进行显示规范化：内联投递指令标签
  例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、纯文本工具调用 XML
  有效负载（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>` 以及被截断的工具调用块），还有
  泄露的 ASCII/全角模型控制令牌，都会从可见文本中移除；而那些整个可见文本仅为精确静默
  令牌 `NO_REPLY` / `no_reply` 的助手条目会被省略。
- `chat.inject` 会将一条助手备注直接附加到记录中，并广播到 UI（不会运行智能体）。
- 已中止的运行可能会在 UI 中保留部分助手输出可见。
- 当存在缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到记录历史中，并为这些条目标记中止元数据。
- 历史始终从 gateway 获取（不监视本地文件）。
- 如果 gateway 不可达，WebChat 为只读。

## Control UI 智能体工具面板

- Control UI 的 `/agents` 工具面板有两个独立视图：
  - **Available Right Now** 使用 `tools.effective(sessionKey=...)`，显示当前
    会话在运行时实际可用的内容，包括核心、插件和渠道自有工具。
  - **Tool Configuration** 使用 `tools.catalog`，并聚焦于 profiles、overrides 以及
    catalog 语义。
- 运行时可用性是会话范围的。在同一个智能体上切换会话，可能会改变
  **Available Right Now** 列表。
- 配置编辑器并不意味着运行时可用性；实际访问仍遵循策略
  优先级（`allow`/`deny`、按智能体以及提供商/渠道的 overrides）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道传输 gateway WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置： [配置](/zh-CN/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当某个记录条目超过此限制时，Gateway 网关会截断长文本字段，并可能用占位符替换过大的消息。客户端也可以在每次请求中发送 `maxChars`，以覆盖单次 `chat.history` 调用的默认值。

相关的全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共享密钥 WebSocket 认证。
- `gateway.auth.allowTailscale`：启用后，浏览器 Control UI 聊天标签页可使用 Tailscale
  Serve 身份头。
- `gateway.auth.mode: "trusted-proxy"`：用于位于身份感知**非 loopback**代理源之后的浏览器客户端的反向代理认证（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 gateway 目标。
- `session.*`：会话存储和主键默认值。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [Dashboard](/zh-CN/web/dashboard)
