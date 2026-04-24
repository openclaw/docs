---
read_when:
    - 实现 macOS Canvas 面板时
    - 为可视化工作区添加智能体控制时
    - 调试 WKWebView Canvas 加载时
summary: 通过 WKWebView + 自定义 URL scheme 嵌入的由智能体控制的 Canvas 面板
title: Canvas
x-i18n:
    generated_at: "2026-04-24T04:05:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

macOS 应用使用 `WKWebView` 嵌入了一个由智能体控制的 **Canvas 面板**。它是一个轻量级可视化工作区，用于 HTML/CSS/JS、A2UI 和小型交互式 UI 界面。

## Canvas 的位置

Canvas 状态存储在 Application Support 下：

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 面板通过**自定义 URL scheme** 提供这些文件：

- `openclaw-canvas://<session>/<path>`

示例：

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

如果根目录不存在 `index.html`，应用会显示**内置脚手架页面**。

## 面板行为

- 无边框、可调整大小的面板，固定在菜单栏附近（或鼠标光标附近）。
- 按会话记住大小和位置。
- 本地 Canvas 文件更改时自动重新加载。
- 任意时刻只显示一个 Canvas 面板（会根据需要切换会话）。

可在设置 → **Allow Canvas** 中禁用 Canvas。禁用后，canvas
节点命令会返回 `CANVAS_DISABLED`。

## 智能体 API 能力

Canvas 通过 **Gateway 网关 WebSocket** 暴露，因此智能体可以：

- 显示/隐藏面板
- 导航到某个路径或 URL
- 执行 JavaScript
- 捕获快照图像

CLI 示例：

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

说明：

- `canvas.navigate` 接受**本地 Canvas 路径**、`http(s)` URL 和 `file://` URL。
- 如果传入 `"/"`，Canvas 会显示本地脚手架或 `index.html`。

## Canvas 中的 A2UI

A2UI 由 Gateway 网关 canvas host 托管，并在 Canvas 面板内渲染。
当 Gateway 网关发布 Canvas host 时，macOS 应用会在首次打开时自动导航到
A2UI host 页面。

默认 A2UI host URL：

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI 命令（v0.8）

Canvas 当前接受 **A2UI v0.8** 的 server→client 消息：

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

不支持 `createSurface`（v0.9）。

CLI 示例：

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

快速冒烟测试：

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## 从 Canvas 触发智能体运行

Canvas 可以通过深链接触发新的智能体运行：

- `openclaw://agent?...`

示例（JavaScript 中）：

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

除非提供了有效 key，否则应用会提示确认。

## 安全说明

- Canvas scheme 会阻止目录遍历；文件必须位于会话根目录下。
- 本地 Canvas 内容使用自定义 scheme（无需 local loopback 服务器）。
- 外部 `http(s)` URL 仅在显式导航时才允许。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [WebChat](/zh-CN/web/webchat)
