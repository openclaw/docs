---
read_when:
    - 调试或配置 WebChat 访问权限
summary: 环回 WebChat 静态托管和聊天 UI 的 Gateway 网关 WS 用法
title: 网页聊天
x-i18n:
    generated_at: "2026-05-02T23:43:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

Status: macOS/iOS SwiftUI 聊天 UI 直接与 Gateway 网关 WebSocket 通信。

## 它是什么

- Gateway 网关的原生聊天 UI（无嵌入式浏览器，也无本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终返回到 WebChat。

## 快速开始

1. 启动 Gateway 网关。
2. 打开 WebChat UI（macOS/iOS 应用）或控制 UI 聊天标签页。
3. 确保配置了有效的 Gateway 网关认证路径（默认使用共享密钥，
   即使在 loopback 上也是如此）。

## 工作方式（行为）

- UI 连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- 为保证稳定性，`chat.history` 有边界限制：Gateway 网关可能会截断较长的文本字段、省略较重的元数据，并用 `[chat.history omitted: message too large]` 替换超大的条目。
- 对于现代仅追加会话文件，`chat.history` 会跟随活动转录分支，因此废弃的重写分支和被取代的提示词副本不会在 WebChat 中渲染。
- 控制 UI 会记住 `chat.history` 返回的后端 Gateway 网关 `sessionId`，并在后续 `chat.send` 调用中包含它，因此重新连接和页面刷新会继续同一个已存储的对话，除非用户启动或重置会话。
- 控制 UI 会在生成新的 `chat.send` 运行 ID 之前，合并同一会话、消息和附件的重复进行中提交；Gateway 网关仍会对复用同一幂等键的重复请求去重。
- `chat.history` 也会做显示规范化：仅运行时的 OpenClaw 上下文、
  入站封套包装、内联投递指令标签
  如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、纯文本工具调用 XML
  载荷（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>` 以及被截断的工具调用块），以及
  泄漏的 ASCII/全角模型控制标记都会从可见文本中剥离，
  并且整段可见文本仅为精确静默
  标记 `NO_REPLY` / `no_reply` 的 assistant 条目会被省略。
- 标记为推理的回复载荷（`isReasoning: true`）会从 WebChat assistant 内容、转录回放文本和音频内容块中排除，因此仅思考用的载荷不会作为可见 assistant 消息或可播放音频呈现。
- `chat.inject` 会将一条 assistant 备注直接追加到转录，并广播到 UI（不会运行智能体）。
- 已中止的运行可以让部分 assistant 输出在 UI 中保持可见。
- 当存在已缓冲输出时，Gateway 网关会将已中止的部分 assistant 文本持久化到转录历史，并用中止元数据标记这些条目。
- 历史始终从 Gateway 网关获取（不进行本地文件监听）。
- 如果无法访问 Gateway 网关，WebChat 为只读。

## 控制 UI 智能体工具面板

- 控制 UI `/agents` 工具面板有两个独立视图：
  - **当前可用** 使用 `tools.effective(sessionKey=...)`，并显示当前
    会话在运行时实际可用的内容，包括核心、插件和渠道拥有的工具。
  - **工具配置** 使用 `tools.catalog`，并专注于配置文件、覆盖项和
    目录语义。
- 运行时可用性以会话为作用域。在同一个智能体上切换会话可能会改变
  **当前可用** 列表。
- 配置编辑器并不意味着运行时可用；有效访问仍遵循策略
  优先级（`allow`/`deny`，以及按智能体和提供商/渠道的覆盖项）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道传输 Gateway 网关 WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当转录条目超过此限制时，Gateway 网关会截断较长的文本字段，并可能用占位符替换超大的消息。客户端也可以发送按请求的 `maxChars`，为单次 `chat.history` 调用覆盖此默认值。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共享密钥 WebSocket 认证。
- `gateway.auth.allowTailscale`：启用时，浏览器控制 UI 聊天标签页可以使用 Tailscale
  Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：用于位于具备身份感知能力的 **非 loopback** 代理源后方的浏览器客户端的反向代理认证（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 网关目标。
- `session.*`：会话存储和主键默认值。

## 相关

- [控制 UI](/zh-CN/web/control-ui)
- [仪表板](/zh-CN/web/dashboard)
