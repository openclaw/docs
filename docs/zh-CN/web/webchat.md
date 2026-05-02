---
read_when:
    - 调试或配置 WebChat 访问
summary: 回环 WebChat 静态托管主机和聊天 UI 的 Gateway 网关 WS 用法
title: WebChat
x-i18n:
    generated_at: "2026-05-02T23:13:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

Status：macOS/iOS SwiftUI 聊天 UI 直接与 Gateway 网关 WebSocket 通信。

## 它是什么

- 面向 Gateway 网关的原生聊天 UI（没有嵌入式浏览器，也没有本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终返回到 WebChat。

## 快速开始

1. 启动 Gateway 网关。
2. 打开 WebChat UI（macOS/iOS 应用）或 Control UI 聊天标签页。
3. 确保已配置有效的 Gateway 网关认证路径（默认使用共享密钥，
   即使在回环地址上也是如此）。

## 工作方式（行为）

- UI 连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send`、`chat.inject` 和 `chat.transcribeAudio`。
- 为了稳定性，`chat.history` 会受到限制：Gateway 网关可能会截断较长的文本字段，省略较重的元数据，并将超大的条目替换为 `[chat.history omitted: message too large]`。
- 对于现代追加式会话文件，`chat.history` 会跟随活动的转录分支，因此废弃的重写分支和被取代的提示副本不会在 WebChat 中渲染。
- Control UI 会记住 `chat.history` 返回的后端 Gateway 网关 `sessionId`，并在后续 `chat.send` 调用中包含它，因此重新连接和页面刷新会继续同一个已存储的对话，除非用户启动或重置会话。
- Control UI 会在生成新的 `chat.send` 运行 ID 之前，合并同一会话、消息和附件的重复进行中提交；Gateway 网关仍会对复用相同幂等键的重复请求进行去重。
- `chat.history` 也会进行显示归一化：仅运行时使用的 OpenClaw 上下文、
  入站信封包装器、内联投递指令标签
  （例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML
  载荷（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>` 和被截断的工具调用块），以及
  泄漏的 ASCII/全角模型控制 token 都会从可见文本中移除，
  并且如果助手条目的全部可见文本只是精确的静默
  token `NO_REPLY` / `no_reply`，则会省略该条目。
- 带推理标记的回复载荷（`isReasoning: true`）会从 WebChat 助手内容、转录回放文本和音频内容块中排除，因此仅用于思考的载荷不会以可见助手消息或可播放音频的形式呈现。
- `chat.transcribeAudio` 支持 Control UI 聊天输入框中的服务器端听写。浏览器录制麦克风音频，将其以 base64 发送到 Gateway 网关，随后 Gateway 网关运行已配置的 `tools.media.audio` 流水线。返回的转录文本会插入草稿；在用户发送之前，不会启动任何智能体运行。
- `chat.inject` 会将助手注记直接追加到转录中，并广播到 UI（不会启动智能体运行）。
- 已中止的运行可以让部分助手输出在 UI 中保持可见。
- 当存在已缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中，并用中止元数据标记这些条目。
- 历史始终从 Gateway 网关获取（不进行本地文件监听）。
- 如果 Gateway 网关不可达，WebChat 将为只读。

## Control UI 智能体工具面板

- Control UI `/agents` 工具面板有两个独立视图：
  - **当前可用** 使用 `tools.effective(sessionKey=...)`，并展示当前
    会话在运行时实际可以使用的内容，包括核心、插件和渠道拥有的工具。
  - **工具配置** 使用 `tools.catalog`，并专注于配置文件、覆盖项和
    目录语义。
- 运行时可用性按会话划分作用域。在同一个智能体上切换会话可能会改变
  **当前可用** 列表。
- 配置编辑器并不表示运行时可用；有效访问仍遵循策略
  优先级（`allow`/`deny`，以及按智能体和提供商/渠道的覆盖项）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道传输 Gateway 网关 WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当转录条目超过此限制时，Gateway 网关会截断较长的文本字段，并可能将超大的消息替换为占位符。客户端也可以发送每请求级别的 `maxChars`，以便为单次 `chat.history` 调用覆盖此默认值。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共享密钥 WebSocket 认证。
- `gateway.auth.allowTailscale`：启用后，浏览器 Control UI 聊天标签页可以使用 Tailscale
  Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：面向位于具备身份感知能力的**非回环**代理源之后的浏览器客户端的反向代理认证（参见 [可信代理认证](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 网关目标。
- `session.*`：会话存储和主键默认值。

## 相关

- [Control UI](/zh-CN/web/control-ui)
- [Dashboard](/zh-CN/web/dashboard)
