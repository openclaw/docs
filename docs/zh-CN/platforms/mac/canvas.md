---
read_when:
    - 实现 macOS Canvas 面板
    - 为可视化工作区添加智能体控件
    - 调试 WKWebView 画布加载
summary: 智能体控制的 Canvas 面板，通过 WKWebView + 自定义 URL scheme 嵌入
title: 画布
x-i18n:
    generated_at: "2026-05-06T05:21:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8e53f5d1c2e5b3b46e77cb74632e56123f3312dfcc395aa5ac8182c8d58b6cf
    source_path: platforms/mac/canvas.md
    workflow: 16
    postprocess_version: locale-links-v1
---

macOS 应用通过 `WKWebView` 嵌入一个由智能体控制的 **Canvas 面板**。它
是一个轻量级可视化工作区，适用于 HTML/CSS/JS、A2UI 和小型交互式
UI 界面。

## Canvas 的存放位置

Canvas 状态存储在 Application Support 下：

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 面板通过**自定义 URL scheme** 提供这些文件：

- `openclaw-canvas://<session>/<path>`

示例：

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

如果根目录下不存在 `index.html`，应用会显示**内置脚手架页面**。

## 面板行为

- 无边框、可调整大小的面板，锚定在菜单栏（或鼠标光标）附近。
- 按会话记住大小和位置。
- 本地 Canvas 文件变更时自动重新加载。
- 同一时间只显示一个 Canvas 面板（会按需切换会话）。

可以在 Settings → **Allow Canvas** 中禁用 Canvas。禁用后，canvas
节点命令会返回 `CANVAS_DISABLED`。

## 智能体 API 表面

Canvas 通过 **Gateway 网关 WebSocket** 暴露，因此智能体可以：

- 显示/隐藏面板
- 导航到路径或 URL
- 执行 JavaScript
- 捕获快照图像

CLI 示例：

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

注意：

- `canvas.navigate` 接受**本地 Canvas 路径**、`http(s)` URL 和 `file://` URL。
- 如果传入 `"/"`，Canvas 会显示本地脚手架或 `index.html`。

## Canvas 中的 A2UI

A2UI 由 Gateway 网关 canvas host 托管，并在 Canvas 面板内渲染。
当 Gateway 网关公布 Canvas host 时，macOS 应用首次打开时会自动导航到
A2UI host 页面。

默认 A2UI host URL：

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI 命令（v0.8）

Canvas 当前接受 **A2UI v0.8** 服务端→客户端消息：

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

Canvas 可以通过深层链接触发新的智能体运行：

- `openclaw://agent?...`

示例（在 JS 中）：

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

除非提供了有效密钥，否则应用会提示确认。

## 安全说明

- Canvas scheme 会阻止目录遍历；文件必须位于会话根目录下。
- 本地 Canvas 内容使用自定义 scheme（不需要 loopback 服务器）。
- 外部 `http(s)` URL 只有在显式导航时才允许访问。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [WebChat](/zh-CN/web/webchat)
