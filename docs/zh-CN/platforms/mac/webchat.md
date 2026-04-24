---
read_when:
    - 排查 mac WebChat 视图或 loopback 端口问题
summary: mac 应用如何嵌入 Gateway 网关 WebChat，以及如何调试它
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-04-24T04:06:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

macOS 菜单栏应用将 WebChat UI 嵌入为原生 SwiftUI 视图。它
连接到 Gateway 网关，并默认使用所选智能体的**主会话**
（也提供用于切换到其他会话的会话切换器）。

- **本地模式**：直接连接到本地 Gateway 网关 WebSocket。
- **远程模式**：通过 SSH 转发 Gateway 网关控制端口，并将该
  隧道用作数据平面。

## 启动与调试

- 手动：Lobster 菜单 → “Open Chat”。
- 用于测试的自动打开：

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- 日志：`./scripts/clawlog.sh`（子系统 `ai.openclaw`，类别 `WebChatSwiftUI`）。

## 接线方式

- 数据平面：Gateway 网关 WS 方法 `chat.history`、`chat.send`、`chat.abort`、
  `chat.inject`，以及事件 `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` 返回显示标准化后的转录行：可见文本中的内联指令
  标签会被去除，纯文本工具调用 XML 负载
  （包括 `<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>` 以及被截断的工具调用块）和
  泄露的 ASCII / 全角模型控制 token 会被去除，纯粹的
  静默 token 助手行，例如完全等于 `NO_REPLY` / `no_reply` 的行，
  会被省略，而超大行则可能被占位符替换。
- 会话：默认使用主会话（`main`，若作用域为全局则使用 `global`）。UI 可以在不同会话之间切换。
- 新手引导使用专用会话，以保持首次运行设置彼此分离。

## 安全面

- 远程模式只会通过 SSH 转发 Gateway 网关 WebSocket 控制端口。

## 已知限制

- 该 UI 针对聊天会话进行了优化（不是完整的浏览器沙箱）。

## 相关内容

- [WebChat](/zh-CN/web/webchat)
- [macOS app](/zh-CN/platforms/macos)
