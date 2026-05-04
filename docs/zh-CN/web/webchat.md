---
read_when:
    - 调试或配置 WebChat 访问
summary: 用于聊天 UI 的回环 WebChat 静态托管和 Gateway 网关 WS 用法
title: 网页聊天
x-i18n:
    generated_at: "2026-05-04T00:47:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

Status：macOS/iOS SwiftUI 聊天 UI 直接与 Gateway 网关 WebSocket 通信。

## 它是什么

- 面向 Gateway 网关的原生聊天 UI（没有嵌入式浏览器，也没有本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终返回 WebChat。

## 快速开始

1. 启动 Gateway 网关。
2. 打开 WebChat UI（macOS/iOS 应用）或 Control UI 聊天标签页。
3. 确保配置了有效的 Gateway 网关认证路径（默认使用共享密钥，
   即使在回环上也是如此）。

## 工作方式（行为）

- UI 连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- 为了稳定性，`chat.history` 是有边界的：Gateway 网关可能会截断较长的文本字段、省略较重的元数据，并将过大的条目替换为 `[chat.history omitted: message too large]`。
- 对于现代追加式会话文件，`chat.history` 会跟随活动转录分支，因此废弃的重写分支和被取代的提示词副本不会在 WebChat 中渲染。
- 压缩条目会渲染为显式的已压缩历史分隔线。分隔线会说明更早的轮次已保留在检查点中，并链接到会话检查点控件；在权限允许时，操作者可以在那里分支或恢复压缩前视图。
- Control UI 会记住 `chat.history` 返回的后端 Gateway 网关 `sessionId`，并在后续 `chat.send` 调用中包含它，因此重新连接和页面刷新会继续同一个已存储对话，除非用户启动或重置会话。
- Control UI 会在生成新的 `chat.send` 运行 ID 之前，合并同一会话、消息和附件的重复进行中提交；Gateway 网关仍会对复用相同幂等键的重复请求去重。
- 工作区启动文件和待处理的 `BOOTSTRAP.md` 指令会通过智能体系统提示词的项目上下文提供，而不是复制到 WebChat 用户消息中。Bootstrap 截断只会添加一条简洁的系统提示词恢复通知；详细计数和配置旋钮保留在诊断界面上。
- `chat.history` 还会进行显示规范化：仅运行时使用的 OpenClaw 上下文、
  入站信封包装器、内联投递指令标签
  如 `[[reply_to_*]]` 和 `[[audio_as_voice]]`、纯文本工具调用 XML
  载荷（包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>` 以及截断的工具调用块），以及
  泄漏的 ASCII/全角模型控制标记都会从可见文本中剥离，
  并且整段可见文本仅为精确静默
  标记 `NO_REPLY` / `no_reply` 的助手条目会被省略。
- 带推理标记的回复载荷（`isReasoning: true`）会从 WebChat 助手内容、转录回放文本和音频内容块中排除，因此仅思考载荷不会显示为可见助手消息或可播放音频。
- `chat.inject` 会将一条助手备注直接追加到转录中，并广播给 UI（不会运行智能体）。
- 已中止的运行可以让部分助手输出继续显示在 UI 中。
- 当存在已缓冲输出时，Gateway 网关会将已中止的部分助手文本持久化到转录历史中，并用中止元数据标记这些条目。
- 历史始终从 Gateway 网关获取（没有本地文件监听）。
- 如果 Gateway 网关无法访问，WebChat 为只读。

### 转录和投递模型

WebChat 有两条独立的数据路径：

- 会话 JSONL 文件是持久的模型/运行时转录。对于正常的智能体运行，Pi 会通过其会话管理器持久化模型可见的 `user`、`assistant` 和 `toolResult` 消息。WebChat 不会将任意投递、状态或辅助文本写入该转录。
- Gateway 网关 `ReplyPayload` 事件是实时投递投影。它们可以针对 WebChat/渠道显示、分块流式传输、指令标签、媒体嵌入、TTS/音频标志和 UI 兜底行为进行规范化。它们本身不是规范会话日志。
- 只有当 Gateway 网关在正常 Pi 助手轮次之外拥有一条已显示消息时，WebChat 才会注入助手转录条目：`chat.inject`、非智能体命令回复、已中止的部分输出，以及 WebChat 管理的媒体转录补充。
- `chat.history` 会读取已存储的会话转录并应用 WebChat 显示投影。如果运行期间出现实时助手文本，但在历史重新加载后消失，先检查原始 JSONL 是否包含助手文本，再检查 `chat.history` 投影是否将其剥离，然后检查 Control UI 乐观尾部合并是否用持久化快照替换了本地投递状态。

正常智能体运行的最终答案应该是持久的，因为 Pi 会写入助手 `message_end`。任何将已投递最终载荷镜像到转录中的兜底，都必须先避免重复写入 Pi 已经写入的助手轮次。

## Control UI 智能体工具面板

- Control UI `/agents` 工具面板有两个独立视图：
  - **当前可用**使用 `tools.effective(sessionKey=...)`，并显示当前
    会话在运行时实际可以使用的内容，包括核心、插件和渠道拥有的工具。
  - **工具配置**使用 `tools.catalog`，并专注于配置文件、覆盖项和
    目录语义。
- 运行时可用性以会话为作用域。在同一个智能体上切换会话可能会改变
  **当前可用**列表。
- 配置编辑器并不表示运行时可用；有效访问仍然遵循策略
  优先级（`allow`/`deny`、按智能体以及提供商/渠道的覆盖项）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道传输 Gateway 网关 WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 选项：

- `gateway.webchat.chatHistoryMaxChars`：`chat.history` 响应中文本字段的最大字符数。当转录条目超过此限制时，Gateway 网关会截断较长的文本字段，并且可能用占位符替换过大的消息。客户端还可以发送按请求设置的 `maxChars`，以覆盖单次 `chat.history` 调用的默认值。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共享密钥 WebSocket 认证。
- `gateway.auth.allowTailscale`：启用后，浏览器 Control UI 聊天标签页可以使用 Tailscale
  Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：面向位于支持身份感知的**非回环**代理来源之后的浏览器客户端的反向代理认证（请参阅[受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 网关目标。
- `session.*`：会话存储和主键默认值。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [Dashboard](/zh-CN/web/dashboard)
