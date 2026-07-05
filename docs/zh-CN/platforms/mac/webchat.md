---
read_when:
    - 调试 Mac WebChat 视图或回环端口
summary: mac 应用如何嵌入 Gateway 网关 WebChat，以及如何调试它
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-07-05T11:27:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24fe8b868fa2a7e2205bd13d32332bae903d3050073ea93f798649ccbaa478f9
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 菜单栏应用将 WebChat UI 嵌入为原生 SwiftUI 视图。它连接到 Gateway 网关，并默认使用所选智能体的主会话（`main`，或当 `session.scope` 为 `global` 时使用 `global`），同时提供会话切换器用于其他会话。

- **本地模式**：直接连接到本地 Gateway 网关 WebSocket。
- **远程模式**：通过 SSH 转发 Gateway 网关控制端口，并使用该隧道作为数据平面。

## 启动和调试

- 手动：Lobster 菜单 -> “打开聊天”。
- 测试时自动打开：

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  （`--webchat` 作为旧版别名也受支持。）

- 日志：`./scripts/clawlog.sh`（子系统 `ai.openclaw`，类别 `WebChatSwiftUI`）。

## 它的连接方式

- 数据平面：Gateway 网关 WS 方法 `chat.history`、`chat.send`、`chat.abort`、`chat.inject`，以及事件 `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` 返回经过显示规范化的转录记录：内联指令标签会从可见文本中移除，纯文本工具调用 XML 载荷（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`，包括被截断的块）和泄漏的模型控制令牌会被移除，纯静默令牌的助手行（例如精确的 `NO_REPLY`/`no_reply`）会被省略，过大的行可以被替换为截断占位符。
- 会话：默认使用如上所述的主会话；UI 可以在会话之间切换。
- 新手引导使用专用会话，以便将首次运行设置隔离开来。

## 安全面

- 远程模式仅通过 SSH 转发 Gateway 网关 WebSocket 控制端口。

## 已知限制

- UI 针对聊天会话进行了优化，而不是完整的浏览器沙箱。

## 相关

- [WebChat](/zh-CN/web/webchat)
- [macOS 应用](/zh-CN/platforms/macos)
