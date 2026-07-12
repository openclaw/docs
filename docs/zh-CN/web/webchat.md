---
read_when:
    - 调试或配置 WebChat 访问权限
summary: 用于聊天 UI 的 local loopback WebChat 静态主机和 Gateway 网关 WebSocket 用法
title: 网页聊天
x-i18n:
    generated_at: "2026-07-12T14:49:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

状态：macOS/iOS SwiftUI 聊天界面直接与 Gateway 网关 WebSocket 通信。无需嵌入式浏览器，也无需本地静态服务器。

## 这是什么

- Gateway 网关的原生聊天界面。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终返回 WebChat。
- 始终从 Gateway 网关获取历史记录（不监视本地文件）。如果无法连接 Gateway 网关，WebChat 将处于只读状态。

## 快速开始

1. 启动 Gateway 网关。
2. 打开 WebChat 界面（macOS/iOS 应用）或 Control UI 聊天选项卡。
3. 确保已配置有效的 Gateway 网关身份验证路径（默认使用共享密钥，即使在环回接口上也是如此）。

## 工作原理

- 界面连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send`、`chat.inject` 和 `chat.message.get` RPC 方法。
- 为确保稳定性，`chat.history` 设有大小限制：Gateway 网关可能截断较长的文本字段、省略大量元数据，并将过大的条目替换为 `[chat.history omitted: message too large]`。API 客户端可在每个请求中发送 `maxChars`，以便仅针对单次调用覆盖默认限制。
- 当可见的智能体消息在 `chat.history` 中被截断时，Control UI 可以打开侧边阅读器，并通过 `chat.message.get` 按需获取完整且经过显示规范化的条目，而无需增大默认历史记录载荷。`chat.message.get` 使用与 `chat.history` 相同的转录记录分支和显示规则，但会通过 `messageId` 定位单个条目；当无法再返回完整内容时，它会如实返回不可用原因。
- 对于仅追加的会话文件，`chat.history` 会遵循当前转录记录分支，因此 WebChat 不会呈现已放弃的重写分支和已被取代的提示词副本。
- 压缩条目会呈现为“已压缩的历史记录”分隔符，说明压缩后的转录记录已作为检查点保留，并提供打开会话检查点的操作（权限允许时可创建分支或恢复）。
- Control UI 会记住 `chat.history` 返回的底层 Gateway 网关 `sessionId`，并在后续 `chat.send` 调用中携带它，因此重新连接和刷新页面后会继续使用同一个已存储对话，除非用户启动或重置会话。
- `chat.send` 接受幂等键（Control UI 使用运行 ID）；Gateway 网关会对重复使用同一键的请求进行去重，因此针对同一会话、消息和附件重试或重复提交正在处理的请求时，不会创建第二次运行。
- 工作区启动文件和待处理的 `BOOTSTRAP.md` 指令通过智能体系统提示词的 `# Project Context` 部分提供，而不会复制到 WebChat 用户消息中。如果引导内容被截断，系统提示词会改为接收简短的“引导上下文通知”；详细计数和配置选项仍保留在诊断界面中。
- `chat.history` 的显示规范化会移除：仅供运行时使用的 OpenClaw 上下文、入站信封包装、`[[reply_to_current]]`、`[[reply_to:<id>]]` 和 `[[audio_as_voice]]` 等内联递送指令标签、纯文本工具调用 XML 载荷（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`，包括截断的块），以及泄漏的 ASCII/全角模型控制令牌。如果智能体条目的全部可见文本仅为静默令牌 `NO_REPLY`（不区分大小写），则会省略该条目。
- 标记为推理的回复载荷（`isReasoning: true`）会从 WebChat 智能体内容、转录记录重放文本和音频内容块中排除，因此仅包含思考过程的载荷不会显示为可见的智能体消息，也不会成为可播放的音频。
- `chat.inject` 会将智能体备注直接追加到转录记录并广播到界面（不运行智能体）。
- 已中止的运行可以在界面中保留部分智能体输出。如果存在已缓冲的输出，Gateway 网关会将这些部分文本持久化到转录历史记录中，并使用中止元数据标记该条目。

### 转录记录和递送模型

WebChat 有两条相互独立的数据路径：

- SQLite 转录记录行是持久的模型/运行时转录记录。对于正常的智能体运行，嵌入式 OpenClaw 运行时会通过会话访问器持久化模型可见的 `user`、`assistant` 和 `toolResult` 消息。WebChat 不会将任意递送、状态或辅助文本写入该转录记录。
- Gateway 网关 `ReplyPayload` 事件是实时递送投影：针对 WebChat/渠道显示、分块流式传输、指令标签、媒体嵌入、TTS/音频标志和界面回退行为进行规范化。它们本身并不是规范的会话日志。
- 需要通过 `tools.message` 提供可见回复的 Harness 仍将 WebChat 用作当前运行的内部源回复接收端。来自当前 WebChat 运行且没有目标的 `message.send` 会投影到同一聊天中，并镜像到会话转录记录；WebChat 不会因此成为可复用的出站渠道，也绝不会继承 `lastChannel`。
- 仅当 Gateway 网关拥有正常嵌入式智能体轮次之外显示的消息时，WebChat 才会注入智能体转录记录条目：`chat.inject`、非智能体命令回复、已中止的部分输出，以及由 WebChat 管理的媒体转录记录补充内容。
- 如果运行期间显示了实时智能体文本，但重新加载历史记录后文本消失，请按以下顺序检查：SQLite 转录记录是否包含智能体文本、`chat.history` 显示投影是否将其移除，以及 Control UI 的乐观尾部合并是否使用持久化快照替换了本地递送状态。

正常智能体运行的最终回答应当是持久的，因为嵌入式运行时会写入智能体 `message_end`。任何将已递送的最终载荷镜像到转录记录的回退机制，都必须先避免复制嵌入式运行时已经写入的智能体轮次。

## Control UI 智能体工具面板

- Control UI 的 `/agents` 工具面板包含由 `tools.effective(sessionKey=...)` 支持的“当前可用”视图：这是服务器派生的当前会话工具清单只读投影，包括核心工具、插件工具、渠道所有的工具，以及已发现的 MCP 服务器工具。
- 单独的配置编辑视图（由 `tools.catalog` 支持）涵盖配置文件、按智能体设置的覆盖项和目录语义。
- 运行时可用性以会话为范围。同一智能体切换会话后，“当前可用”列表可能发生变化。如果已配置的 MCP 服务器尚未连接，或自上次发现后已发生变化，面板会显示通知，而不会通过读取路径静默启动 MCP 传输协议。
- 配置编辑器并不表示运行时一定可用；有效访问权限仍遵循策略优先级（`allow`/`deny`、按智能体设置的覆盖项以及提供商/渠道覆盖项）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道传输 Gateway 网关 WebSocket。
- 无需运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 没有持久化配置部分。Gateway 网关使用内置的 `chat.history` 显示限制；API 客户端可在每个请求中发送 `maxChars`，以便仅针对单次调用覆盖该限制。旧版 `channels.webchat` 和 `gateway.webchat` 配置已停用；运行 `openclaw doctor --fix` 将其移除。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  共享密钥 WebSocket 身份验证。
- `gateway.auth.allowTailscale`：启用后，浏览器中的 Control UI 聊天选项卡可以使用 Tailscale
  Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：用于位于具备身份感知能力的**非环回**代理源后方的浏览器客户端的反向代理身份验证（参见[受信任代理身份验证](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 网关目标。
- `session.*`：会话存储和主键默认值。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [仪表板](/zh-CN/web/dashboard)
