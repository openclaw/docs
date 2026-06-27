---
read_when:
    - 调试或配置 WebChat 访问
summary: Loopback WebChat 静态托管和用于聊天 UI 的 Gateway 网关 WS 用法
title: WebChat
x-i18n:
    generated_at: "2026-06-27T03:37:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

状态：macOS/iOS SwiftUI 聊天 UI 直接与 Gateway 网关 WebSocket 通信。

## 它是什么

- Gateway 网关的原生聊天 UI（没有嵌入式浏览器，也没有本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终返回到 WebChat。

## 快速开始

1. 启动 Gateway 网关。
2. 打开 WebChat UI（macOS/iOS 应用）或 Control UI 聊天标签页。
3. 确保已配置有效的 Gateway 网关认证路径（默认使用 shared-secret，
   即使在 loopback 上也是如此）。

## 工作方式（行为）

- UI 连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.history` 为了稳定性而设有边界：Gateway 网关可能会截断较长的文本字段、省略较重的元数据，并将过大的条目替换为 `[chat.history omitted: message too large]`。
- 当可见的助手消息在 `chat.history` 中被截断时，Control UI 可以打开侧边阅读器，并通过 `chat.message.get` 按需获取完整的显示规范化条目，而不会增加默认历史载荷。
- 对于现代追加式会话文件，`chat.history` 会跟随活动转录分支，因此被放弃的重写分支和已被取代的提示副本不会在 WebChat 中渲染。
- 压缩条目会渲染为明确的压缩历史分隔线。该分隔线说明压缩后的转录会作为检查点保留，并链接到会话检查点控件；在权限允许时，操作者可以从该压缩视图分支或恢复。
- Control UI 会记住 `chat.history` 返回的后端 Gateway 网关 `sessionId`，并在后续 `chat.send` 调用中包含它，因此重新连接和刷新页面会继续同一个已存储的对话，除非用户启动或重置会话。
- Control UI 会在生成新的 `chat.send` 运行 ID 前，合并同一会话、消息和附件的重复进行中提交；Gateway 网关仍会对复用同一幂等键的重复请求进行去重。
- 工作区启动文件和待处理的 `BOOTSTRAP.md` 指令会通过 Agent 系统提示的项目上下文提供，而不是复制到 WebChat 用户消息中。Bootstrap 截断只会添加简洁的系统提示恢复通知；详细计数和配置旋钮保留在诊断界面中。
- `chat.history` 也会进行显示规范化：仅运行时的 OpenClaw 上下文、
  入站信封包装、内联投递指令标签
  例如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、纯文本工具调用 XML
  载荷（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>` 和被截断的工具调用块），以及
  泄漏的 ASCII/全角模型控制令牌都会从可见文本中移除，
  并且整段可见文本仅为精确静默令牌
  `NO_REPLY` / `no_reply` 的助手条目会被省略。
- 带有推理标记的回复载荷（`isReasoning: true`）会从 WebChat 助手内容、转录回放文本和音频内容块中排除，因此仅思考的载荷不会显示为可见助手消息或可播放音频。
- `chat.inject` 会将助手备注直接追加到转录中，并广播到 UI（不运行 Agent）。
- 已中止的运行可以在 UI 中保留部分助手输出可见。
- 当存在缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中，并为这些条目标记中止元数据。
- 历史始终从 Gateway 网关获取（没有本地文件监听）。
- 如果无法访问 Gateway 网关，WebChat 为只读。

### 转录和投递模型

WebChat 有两条独立的数据路径：

- 会话 JSONL 文件是持久化的模型/运行时转录。对于正常 Agent 运行，嵌入式 OpenClaw 运行时会通过其会话管理器持久化模型可见的 `user`、`assistant` 和 `toolResult` 消息。WebChat 不会将任意投递、状态或辅助文本写入该转录。
- Gateway 网关 `ReplyPayload` 事件是实时投递投影。它们可以针对 WebChat/渠道显示、分块流式传输、指令标签、媒体嵌入、TTS/音频标志和 UI 回退行为进行规范化。它们本身不是规范会话日志。
- 需要通过 `tools.message` 提供可见回复的 harness，仍将 WebChat 用作当前运行的内部来源回复接收端。来自该活动 WebChat 运行的无目标 `message.send` 会被投影到同一个聊天中，并镜像到会话转录；WebChat 不会变成可复用的出站渠道，也永远不会继承 `lastChannel`。
- 只有当 Gateway 网关在正常嵌入式 Agent 轮次之外拥有已显示消息时，WebChat 才会注入助手转录条目：`chat.inject`、非 Agent 命令回复、已中止的部分输出，以及 WebChat 管理的媒体转录补充。
- `chat.history` 会读取已存储的会话转录并应用 WebChat 显示投影。如果运行期间出现实时助手文本，但在重新加载历史后消失，首先检查原始 JSONL 是否包含该助手文本，然后检查 `chat.history` 投影是否将其移除，最后检查 Control UI 乐观尾部合并是否用持久化快照替换了本地投递状态。
- `chat.message.get` 使用与 `chat.history` 相同的转录分支和显示投影规则，包括活动 Agent 作用域，但它通过 `messageId` 定位单个转录条目，并在完整内容无法再返回时给出真实的不可用原因。

正常 Agent 运行的最终答案应是持久化的，因为嵌入式运行时会写入助手 `message_end`。任何将已投递最终载荷镜像到转录中的回退，都必须先避免重复写入嵌入式运行时已写入的助手轮次。

## Control UI Agent 工具面板

- Control UI `/agents` 工具面板有两个独立视图：
  - **当前可用**使用 `tools.effective(sessionKey=...)`，并显示当前会话清单的服务端派生
    只读投影，包括核心、插件、渠道拥有的工具，以及已发现的 MCP 服务器工具。
  - **工具配置**使用 `tools.catalog`，并聚焦于配置文件、覆盖项和
    目录语义。
- 运行时可用性以会话为作用域。在同一 Agent 上切换会话可能会改变
  **当前可用**列表。如果已配置的 MCP 服务器尚未连接，或自上次发现后发生变化，
  面板会显示通知，而不是从读取路径静默启动 MCP 传输。
- 配置编辑器并不意味着运行时可用；有效访问仍遵循策略
  优先级（`allow`/`deny`、按 Agent 和提供商/渠道的覆盖项）。

## 远程使用

- 远程模式会通过 SSH/Tailscale 隧道传输 Gateway 网关 WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 没有持久化配置区段。Gateway 网关使用内置的 `chat.history` 显示限制；API 客户端可以发送按请求的 `maxChars`，为单次 `chat.history` 调用覆盖该限制。旧版 `channels.webchat` 和 `gateway.webchat` 配置已退役；运行 `openclaw doctor --fix` 将其移除。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  shared-secret WebSocket 认证。
- `gateway.auth.allowTailscale`：启用后，浏览器 Control UI 聊天标签页可以使用 Tailscale
  Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：用于位于身份感知型**非 loopback**代理源之后的浏览器客户端的反向代理认证（参见[受信代理认证](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 网关目标。
- `session.*`：会话存储和主键默认值。

## 相关

- [Control UI](/zh-CN/web/control-ui)
- [Dashboard](/zh-CN/web/dashboard)
