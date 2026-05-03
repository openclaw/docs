---
read_when:
    - 调试或配置 WebChat 访问权限
summary: 用于聊天 UI 的回环 WebChat 静态主机和 Gateway 网关 WS 用法
title: 网页聊天
x-i18n:
    generated_at: "2026-05-03T04:33:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

Status：macOS/iOS SwiftUI 聊天 UI 直接与 Gateway 网关 WebSocket 通信。

## 它是什么

- 面向 Gateway 网关的原生聊天 UI（无嵌入式浏览器，也无本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终返回到 WebChat。

## 快速开始

1. 启动 Gateway 网关。
2. 打开 WebChat UI（macOS/iOS 应用）或 Control UI 聊天标签页。
3. 确保已配置有效的 Gateway 网关身份验证路径（默认使用 shared-secret，
   即使在 loopback 上也是如此）。

## 工作方式（行为）

- UI 连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- 为了稳定性，`chat.history` 有边界限制：Gateway 网关可能会截断较长的文本字段、省略大型元数据，并将超大条目替换为 `[chat.history omitted: message too large]`。
- 对于现代仅追加会话文件，`chat.history` 会跟随活动 transcript 分支，因此废弃的重写分支和被取代的 prompt 副本不会在 WebChat 中渲染。
- 压缩条目会渲染为一个明确的已压缩历史分隔线。该分隔线会说明较早的轮次已保存在检查点中，并链接到会话检查点控件；在权限允许时，操作员可以在那里分支或恢复压缩前视图。
- Control UI 会记住 `chat.history` 返回的底层 Gateway 网关 `sessionId`，并在后续 `chat.send` 调用中包含它，因此重新连接和页面刷新会继续同一个已存储对话，除非用户启动或重置会话。
- 在生成新的 `chat.send` run id 之前，Control UI 会合并同一会话、消息和附件的重复进行中提交；Gateway 网关仍会对复用同一幂等键的重复请求进行去重。
- `chat.history` 也会进行显示规范化：运行时专用的 OpenClaw 上下文、
  入站 envelope 包装器、内联投递指令标签
  例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、纯文本 tool-call XML
  载荷（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>` 以及被截断的 tool-call 块），以及
  泄漏的 ASCII/全角模型控制 token 会从可见文本中剥离，
  并且如果 assistant 条目的全部可见文本仅为精确的静默
  token `NO_REPLY` / `no_reply`，则会被省略。
- 带 reasoning 标记的回复载荷（`isReasoning: true`）会从 WebChat assistant 内容、transcript 回放文本和音频内容块中排除，因此仅用于思考的载荷不会显示为可见 assistant 消息，也不会显示为可播放音频。
- `chat.inject` 会直接向 transcript 追加一条 assistant 备注，并将其广播到 UI（不运行智能体）。
- 已中止的运行可以让部分 assistant 输出在 UI 中保持可见。
- 当存在缓冲输出时，Gateway 网关会将已中止的部分 assistant 文本持久化到 transcript 历史中，并用中止元数据标记这些条目。
- 历史始终从 Gateway 网关获取（不进行本地文件监听）。
- 如果 Gateway 网关不可访问，WebChat 将为只读。

## Control UI 智能体工具面板

- Control UI `/agents` 工具面板有两个独立视图：
  - **当前可用** 使用 `tools.effective(sessionKey=...)`，并显示当前
    会话在运行时实际可用的内容，包括核心、插件和渠道拥有的工具。
  - **工具配置** 使用 `tools.catalog`，并聚焦于 profile、override 和
    catalog 语义。
- 运行时可用性按会话限定。在同一智能体上切换会话可能会改变
  **当前可用** 列表。
- 配置编辑器并不意味着运行时可用；有效访问仍遵循策略
  优先级（`allow`/`deny`、按智能体以及提供商/渠道的 override）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道传输 Gateway 网关 WebSocket。
- 你无需运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当 transcript 条目超过此限制时，Gateway 网关会截断较长的文本字段，并可能将超大消息替换为占位符。客户端也可以发送按请求设置的 `maxChars`，以覆盖单次 `chat.history` 调用的此默认值。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  shared-secret WebSocket 身份验证。
- 启用后，`gateway.auth.allowTailscale`：浏览器 Control UI 聊天标签页可以使用 Tailscale
  Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：面向位于具备身份感知能力的**非 loopback**代理源之后的浏览器客户端的反向代理身份验证（请参阅 [Trusted Proxy 身份验证](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 网关目标。
- `session.*`：会话存储和主键默认值。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [Dashboard](/zh-CN/web/dashboard)
