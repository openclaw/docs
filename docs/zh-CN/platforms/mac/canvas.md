---
read_when:
    - 实现 macOS 画布面板
    - 为可视化工作区添加智能体控制
    - 调试 `WKWebView` 画布加载
summary: 通过 `WKWebView` + 自定义 URL scheme 嵌入的、由智能体控制的画布面板
title: 画布
x-i18n:
    generated_at: "2026-04-05T08:37:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1
    source_path: platforms/mac/canvas.md
    workflow: 15
---

# 画布（macOS 应用）

macOS 应用使用 `WKWebView` 嵌入一个由智能体控制的**画布面板**。它是一个轻量级可视化工作区，用于 HTML/CSS/JS、A2UI，以及小型交互式 UI 界面。

## 画布的位置

画布状态存储在 Application Support 下：

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

画布面板通过**自定义 URL scheme** 提供这些文件：

- `openclaw-canvas://<session>/<path>`

示例：

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

如果根目录下不存在 `index.html`，应用会显示一个**内置脚手架页面**。

## 面板行为

- 无边框、可调整大小的面板，锚定在菜单栏附近（或鼠标光标附近）。
- 按会话记住大小/位置。
- 本地画布文件变化时自动重新加载。
- 同一时间只显示一个画布面板（会根据需要切换会话）。

可以在“设置”→ **Allow Canvas** 中禁用画布。禁用后，画布节点命令会返回 `CANVAS_DISABLED`。

## 智能体 API 接口

画布通过 **Gateway 网关 WebSocket** 暴露，因此智能体可以：

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

- `canvas.navigate` 接受**本地画布路径**、`http(s)` URL 和 `file://` URL。
- 如果你传入 `"/"`，画布会显示本地脚手架页面或 `index.html`。

## 画布中的 A2UI

A2UI 由 Gateway 网关画布主机托管，并在画布面板中渲染。当 Gateway 网关公布一个画布主机时，macOS 应用会在首次打开时自动导航到 A2UI 主机页面。

默认的 A2UI 主机 URL：

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI 命令（v0.8）

画布当前接受 **A2UI v0.8** 的 server→client 消息：

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

## 从画布触发智能体运行

画布可以通过深层链接触发新的智能体运行：

- `openclaw://agent?...`

示例（在 JS 中）：

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

除非提供了有效密钥，否则应用会提示确认。

## 安全说明

- 画布 scheme 会阻止目录遍历；文件必须位于会话根目录下。
- 本地画布内容使用自定义 scheme（无需 loopback 服务器）。
- 外部 `http(s)` URL 仅在显式导航时允许。
