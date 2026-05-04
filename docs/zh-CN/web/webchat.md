---
read_when:
    - 调试或配置 WebChat 访问
summary: 回环 WebChat 静态托管和用于聊天 UI 的 Gateway 网关 WS 用法
title: 网页聊天
x-i18n:
    generated_at: "2026-05-04T00:38:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58f5a19344a366a02985ef697444fa0c3636fece06931c7fa6dbe288e6c398cd
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
3. 确保已配置有效的 Gateway 网关认证路径（默认使用 shared-secret，
   即使在 loopback 上也是如此）。

## 工作方式（行为）

- UI 连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- 为了保持稳定性，`chat.history` 有边界限制：Gateway 网关可能会截断很长的文本字段，省略较大的元数据，并将过大的条目替换为 `[chat.history omitted: message too large]`。
- 对于现代追加式会话文件，`chat.history` 会跟随当前活跃的转录分支，因此废弃的重写分支和被取代的提示词副本不会在 WebChat 中渲染。
- 压缩条目会渲染为明确的已压缩历史分隔线。该分隔线说明更早的轮次已保存在检查点中，并链接到会话检查点控件；当操作员权限允许时，可在那里创建分支或恢复压缩前视图。
- Control UI 会记住 `chat.history` 返回的后端 Gateway 网关 `sessionId`，并在后续 `chat.send` 调用中包含它，因此重新连接和页面刷新会继续同一个已存储对话，除非用户开始或重置会话。
- Control UI 会在生成新的 `chat.send` 运行 id 之前，合并同一会话、消息和附件的重复进行中提交；Gateway 网关仍会对复用同一幂等键的重复请求进行去重。
- 工作区启动文件和待处理的 `BOOTSTRAP.md` 指令会通过智能体系统提示词的项目上下文提供，而不会复制到 WebChat 用户消息中。Bootstrap 截断只会添加简洁的系统提示词恢复通知；详细计数和配置旋钮保留在诊断界面上。
- `chat.history` 也会进行显示规范化：仅运行时使用的 OpenClaw 上下文、
  入站信封包装、内联投递指令标签
  如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、纯文本工具调用 XML
  载荷（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>` 以及被截断的工具调用块），以及
  泄漏的 ASCII/全角模型控制令牌，都会从可见文本中移除，
  并且当 assistant 条目的全部可见文本仅为精确静默
  令牌 `NO_REPLY` / `no_reply` 时，该条目会被省略。
- 带推理标记的回复载荷（`isReasoning: true`）会从 WebChat assistant 内容、转录回放文本和音频内容块中排除，因此仅思考用载荷不会作为可见 assistant 消息或可播放音频出现。
- `chat.inject` 会直接向转录追加一条 assistant 注记，并广播给 UI（不会运行智能体）。
- 已中止的运行可以在 UI 中保留部分 assistant 输出可见。
- 当存在已缓冲输出时，Gateway 网关会将已中止的部分 assistant 文本持久化到转录历史中，并为这些条目标记中止元数据。
- 历史始终从 Gateway 网关获取（不监听本地文件）。
- 如果 Gateway 网关不可达，WebChat 为只读。

## Control UI 智能体工具面板

- Control UI `/agents` 工具面板有两个独立视图：
  - **当前可用**使用 `tools.effective(sessionKey=...)`，并显示当前
    会话在运行时实际可以使用的内容，包括核心、插件和渠道拥有的工具。
  - **工具配置**使用 `tools.catalog`，并聚焦于配置档、覆盖项和
    目录语义。
- 运行时可用性按会话限定。在同一个智能体上切换会话可能会改变
  **当前可用**列表。
- 配置编辑器并不表示运行时可用；有效访问仍遵循策略
  优先级（`allow`/`deny`、按智能体以及提供商/渠道覆盖项）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道传输 Gateway 网关 WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当转录条目超过此限制时，Gateway 网关会截断较长的文本字段，并可能用占位符替换过大的消息。客户端也可以发送按请求设置的 `maxChars`，以覆盖单次 `chat.history` 调用的默认值。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  shared-secret WebSocket 认证。
- `gateway.auth.allowTailscale`：启用后，浏览器 Control UI 聊天标签页可以使用 Tailscale
  Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：用于位于身份感知型 **non-loopback** 代理源后方的浏览器客户端的反向代理认证（请参阅 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 网关目标。
- `session.*`：会话存储和主键默认值。

## 相关

- [Control UI](/zh-CN/web/control-ui)
- [Dashboard](/zh-CN/web/dashboard)
