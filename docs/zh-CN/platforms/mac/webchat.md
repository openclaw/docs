---
read_when:
    - 调试 Mac WebChat 视图或回环端口
summary: macOS 应用如何嵌入 Gateway 网关 WebChat，以及如何进行调试
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-07-11T20:42:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS 菜单栏应用将 WebChat UI 作为原生 SwiftUI 视图嵌入。它连接到 Gateway 网关，并默认使用所选智能体的主会话（`main`；当 `session.scope` 为 `global` 时则为 `global`）。

完整聊天窗口采用原生拆分视图：

- **会话侧边栏**：可搜索的会话列表，包含已固定和最近使用分区、未读指示器，以及用于固定/取消固定、复制会话键和删除的上下文菜单。工具栏按钮（或 Cmd-N）通过 `sessions.create` 创建真正的新会话。
- **窗口工具栏**：上下文用量环（显示 token 和会话费用，并提供紧凑操作）、思考级别选择器、模型选择器和会话操作菜单（新建会话、刷新、复制会话键、导出对话记录、压缩、清除历史记录）。
- **对话记录和编辑框**：助手消息以带头像的纯文本呈现，用户消息以强调色气泡呈现。输入 `/` 会打开由 `commands.list` 支持的斜杠命令自动补全，并可使用方向键、Tab、Return 和 Escape 键进行键盘导航。右键点击消息即可复制。

菜单栏中的锚定式快速聊天面板保留紧凑的单列布局和内联选择器。

- **本地模式**：直接连接本地 Gateway 网关的 WebSocket。
- **远程模式**：通过 SSH 转发 Gateway 网关控制端口，并使用该隧道作为数据平面。

## 启动和调试

- 手动：Lobster 菜单 -> "Open Chat"。
- 测试时自动打开：

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  （也接受 `--webchat` 作为旧版别名。）

- 日志：`./scripts/clawlog.sh`（子系统 `ai.openclaw`，类别 `WebChatSwiftUI`）。

## 连接方式

- 数据平面：Gateway 网关 WS 方法 `chat.history`、`chat.send`、`chat.abort`、`chat.inject`，以及事件 `chat`、`agent`、`presence`、`tick`、`health`。
- `chat.history` 返回经过显示规范化的对话记录：从可见文本中移除内联指令标签；移除纯文本工具调用 XML 载荷（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`，包括被截断的块）以及泄漏的模型控制 token；省略仅含静默 token 的助手行，例如完全匹配的 `NO_REPLY`/`no_reply`；过大的行可替换为截断占位符。
- 会话：默认使用上述主会话；UI 可以在会话之间切换。
- 新手引导使用专用会话，使首次运行设置保持独立。
- 离线缓存：应用会为每个 Gateway 网关保留最近聊天会话和对话记录的小型只读缓存（`~/Library/Application Support/OpenClaw/chat-cache.sqlite`）：冷启动时立即显示最后已知的对话记录，并在 Gateway 网关响应后刷新；断开连接期间仍可浏览最近的聊天（在连接恢复前，发送功能保持禁用）。

## 安全边界

- 远程模式仅通过 SSH 转发 Gateway 网关的 WebSocket 控制端口。

## 已知限制

- 此 UI 针对聊天会话进行了优化，并非完整的浏览器沙箱。

## 相关内容

- [WebChat](/zh-CN/web/webchat)
- [macOS 应用](/zh-CN/platforms/macos)
