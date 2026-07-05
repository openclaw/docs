---
read_when:
    - 调试或配置 WebChat 访问权限
summary: 回环 WebChat 静态托管和聊天 UI 的 Gateway 网关 WS 用法
title: WebChat
x-i18n:
    generated_at: "2026-07-05T11:48:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d01c8e4f6962a836e9c7337bcb9ce03b90cace69e079a2c84c38108afe7c017
    source_path: web/webchat.md
    workflow: 16
---

状态：macOS/iOS SwiftUI 聊天 UI 直接与 Gateway 网关 WebSocket 通信。没有嵌入式浏览器，也没有本地静态服务器。

## 它是什么

- 面向 Gateway 网关的原生聊天 UI。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终返回 WebChat。
- 历史记录始终从 Gateway 网关获取（不监视本地文件）。如果无法访问 Gateway 网关，WebChat 为只读。

## 快速开始

1. 启动 Gateway 网关。
2. 打开 WebChat UI（macOS/iOS 应用）或 Control UI 聊天标签页。
3. 确保已配置有效的 Gateway 网关认证路径（默认使用 shared-secret，即使在 loopback 上也是如此）。

## 工作原理

- UI 连接到 Gateway 网关 WebSocket，并使用 `chat.history`、`chat.send`、`chat.inject` 和 `chat.message.get` RPC 方法。
- `chat.history` 为稳定性设有边界：Gateway 网关可能会截断长文本字段、省略较重的元数据，并将过大的条目替换为 `[chat.history omitted: message too large]`。API 客户端可以发送每请求的 `maxChars`，为一次调用覆盖默认限制。
- 当可见的助手消息在 `chat.history` 中被截断时，Control UI 可以打开侧边阅读器，并按需通过 `chat.message.get` 获取完整的显示规范化条目，而不增加默认历史记录载荷。`chat.message.get` 使用与 `chat.history` 相同的 transcript 分支和显示规则，但通过 `messageId` 定位单个条目，并在完整内容无法再返回时给出真实的不可用原因。
- `chat.history` 会跟随仅追加会话文件的活动 transcript 分支，因此废弃的重写分支和被取代的提示词副本不会在 WebChat 中渲染。
- 压缩条目会渲染为“已压缩的历史记录”分隔线，说明压缩后的 transcript 会作为检查点保留，并提供打开会话检查点的操作（在权限允许时可分支或恢复）。
- Control UI 会记住 `chat.history` 返回的后端 Gateway 网关 `sessionId`，并在后续 `chat.send` 调用中带上它，因此重新连接和页面刷新会继续同一个已存储对话，除非用户启动或重置会话。
- `chat.send` 接收一个幂等键（Control UI 使用 run id）；Gateway 网关会对复用同一键的重复请求去重，因此同一会话/消息/附件的重试或重复进行中的提交不会创建第二个 run。
- 工作区启动文件和待处理的 `BOOTSTRAP.md` 指令通过智能体 system prompt 的 `# Project Context` 部分提供，而不是复制到 WebChat 用户消息中。如果 bootstrap 内容被截断，system prompt 会改为获得一条简短的“Bootstrap 上下文通知”；详细计数和配置旋钮保留在诊断界面上。
- `chat.history` 上的显示规范化会剥离：仅运行时使用的 OpenClaw 上下文、入站信封包装器、内联投递指令标签（如 `[[reply_to_current]]`、`[[reply_to:<id>]]` 和 `[[audio_as_voice]]`）、纯文本工具调用 XML 载荷（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`，包括被截断的块），以及泄漏的 ASCII/全角模型控制 token。整个可见文本仅为静默 token `NO_REPLY`（不区分大小写）的助手条目会被省略。
- 带 reasoning 标记的回复载荷（`isReasoning: true`）会从 WebChat 助手内容、transcript 回放文本和音频内容块中排除，因此仅思考用途的载荷不会作为可见助手消息或可播放音频出现。
- `chat.inject` 会将一条助手注记直接追加到 transcript，并广播到 UI（没有 agent run）。
- 已中止的 run 可以让部分助手输出在 UI 中保持可见。Gateway 网关会在存在已缓冲输出时，将该部分文本持久化到 transcript 历史记录中，并用中止元数据标记该条目。

### Transcript 和投递模型

WebChat 有两条独立的数据路径：

- 会话 JSONL 文件是持久的模型/运行时 transcript。对于普通 agent run，嵌入式 OpenClaw 运行时会通过其会话管理器持久化模型可见的 `user`、`assistant` 和 `toolResult` 消息。WebChat 不会将任意投递、状态或辅助文本写入该 transcript。
- Gateway 网关 `ReplyPayload` 事件是实时投递投影：面向 WebChat/渠道显示、分块流式传输、指令标签、媒体嵌入、TTS/音频标志和 UI fallback 行为进行规范化。它们本身不是规范会话日志。
- 需要通过 `tools.message` 发送可见回复的 harness，仍然使用 WebChat 作为当前 run 的内部源回复接收端。来自该活动 WebChat run 的无目标 `message.send` 会投影到同一聊天并镜像到会话 transcript；WebChat 不会变成可复用的出站渠道，也永远不会继承 `lastChannel`。
- 只有当 Gateway 网关在普通嵌入式智能体轮次之外拥有一条已显示消息时，WebChat 才会注入助手 transcript 条目：`chat.inject`、非智能体命令回复、已中止的部分输出，以及 WebChat 管理的媒体 transcript 补充。
- 如果实时助手文本在 run 期间出现，但在重新加载历史记录后消失，请按顺序检查：原始 JSONL 是否包含助手文本，`chat.history` 显示投影是否剥离了它，然后 Control UI 乐观尾部合并是否用持久化快照替换了本地投递状态。

普通 agent-run 最终答案应当是持久的，因为嵌入式运行时会写入助手 `message_end`。任何将已投递最终载荷镜像到 transcript 的 fallback，都必须先避免重复写入嵌入式运行时已写入的助手轮次。

## Control UI 智能体工具面板

- Control UI `/agents` 工具面板有一个由 `tools.effective(sessionKey=...)` 支持的“当前可用”视图：这是服务器派生的只读投影，表示当前会话的工具清单，包括 core、插件、渠道拥有以及已发现的 MCP 服务器工具。
- 一个单独的配置编辑视图（由 `tools.catalog` 支持）涵盖配置档、按智能体覆盖项和目录语义。
- 运行时可用性按会话限定。在同一智能体上切换会话可能会改变“当前可用”列表。如果已配置的 MCP 服务器自上次发现以来尚未连接或未发生变化，面板会显示提示，而不是从读取路径静默启动 MCP 传输。
- 配置编辑器不表示运行时可用；有效访问仍遵循策略优先级（`allow`/`deny`，按智能体和提供商/渠道覆盖）。

## 远程使用

- 远程模式会通过 SSH/Tailscale 隧道传输 Gateway 网关 WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/zh-CN/gateway/configuration)

WebChat 没有持久化配置部分。Gateway 网关使用内置的 `chat.history` 显示限制；API 客户端可以发送每请求的 `maxChars`，为单次调用覆盖该限制。旧版 `channels.webchat` 和 `gateway.webchat` 配置已退役；运行 `openclaw doctor --fix` 将其移除。

相关全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：
  shared-secret WebSocket 认证。
- `gateway.auth.allowTailscale`：启用后，浏览器 Control UI 聊天标签页可以使用 Tailscale
  Serve 身份标头。
- `gateway.auth.mode: "trusted-proxy"`：用于位于感知身份的**非 loopback**代理源之后的浏览器客户端的反向代理认证（请参阅 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 网关目标。
- `session.*`：会话存储和主键默认值。

## 相关

- [Control UI](/zh-CN/web/control-ui)
- [Dashboard](/zh-CN/web/dashboard)
