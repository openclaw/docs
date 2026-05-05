---
read_when:
    - 调试 Mac WebChat 视图或回环端口
summary: Mac 应用如何嵌入 Gateway 网关 WebChat，以及如何调试它
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-05-05T23:38:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b53eda688ff8786da4a4a615927a640090a1ecc71af8c08469c3a3c98a32af41
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 菜单栏应用会将 WebChat UI 嵌入为原生 SwiftUI 视图。它
连接到 Gateway 网关，并默认使用所选智能体的 **main 会话**
（可通过会话切换器切换到其他会话）。

- **本地模式**：直接连接到本地 Gateway 网关 WebSocket。
- **远程模式**：通过 SSH 转发 Gateway 网关控制端口，并将该
  隧道用作数据平面。

## 启动和调试

- 手动：Lobster 菜单 → “打开聊天”。
- 测试时自动打开：

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- 日志：`./scripts/clawlog.sh`（子系统 `ai.openclaw`，类别 `WebChatSwiftUI`）。

## 连接方式

- 数据平面：Gateway 网关 WS 方法 `chat.history`、`chat.send`、`chat.abort`、
  `chat.inject`，以及事件 `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` 返回已按显示规范化的对话记录行：内联指令
  标签会从可见文本中移除，纯文本工具调用 XML 载荷
  （包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`，以及截断的工具调用块）
  和泄漏的 ASCII/全角模型控制 token 会被移除，纯
  静默 token 智能体行（例如精确的 `NO_REPLY` / `no_reply`）
  会被省略，过大的行可以替换为占位符。
- 会话：默认使用主会话（`main`，或当作用域为
  全局时使用 `global`）。UI 可以在会话之间切换。
- 新手引导使用专用会话，以将首次运行设置单独隔离。

## 安全面

- 远程模式仅通过 SSH 转发 Gateway 网关 WebSocket 控制端口。

## 已知限制

- UI 针对聊天会话优化（不是完整的浏览器沙箱）。

## 相关

- [WebChat](/zh-CN/web/webchat)
- [macOS 应用](/zh-CN/platforms/macos)
