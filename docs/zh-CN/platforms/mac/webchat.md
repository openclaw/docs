---
read_when:
    - 调试 mac WebChat 视图或环回端口
summary: macOS 应用嵌入 Gateway 网关 WebChat 的方式以及调试方法
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-05-06T05:30:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 菜单栏应用将 WebChat 界面嵌入为原生 SwiftUI 视图。它会连接到 Gateway 网关，并默认使用所选智能体的 **main 会话**（也提供用于其他会话的会话切换器）。

- **本地模式**：直接连接到本地 Gateway 网关 WebSocket。
- **远程模式**：通过 SSH 转发 Gateway 网关控制端口，并将该隧道用作数据平面。

## 启动和调试

- 手动：Lobster 菜单 → “打开聊天”。
- 测试时自动打开：

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- 日志：`./scripts/clawlog.sh`（子系统 `ai.openclaw`，类别 `WebChatSwiftUI`）。

## 接线方式

- 数据平面：Gateway 网关 WS 方法 `chat.history`、`chat.send`、`chat.abort`、`chat.inject`，以及事件 `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` 返回按显示规范化的转录行：内联指令标签会从可见文本中剥离，纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截断的工具调用块）和泄漏的 ASCII/全角模型控制令牌会被剥离，精确匹配 `NO_REPLY` / `no_reply` 等纯静默令牌助手行会被省略，过大的行可替换为占位符。
- 会话：默认使用主会话（`main`，或范围为全局时使用 `global`）。界面可以在会话之间切换。
- 新手引导使用专用会话，以便将首次运行设置分隔开。

## 安全面

- 远程模式仅通过 SSH 转发 Gateway 网关 WebSocket 控制端口。

## 已知限制

- 该界面针对聊天会话优化（不是完整的浏览器沙箱）。

## 相关内容

- [WebChat](/zh-CN/web/webchat)
- [macOS 应用](/zh-CN/platforms/macos)
