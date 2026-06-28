---
read_when:
    - 实现 macOS Canvas 面板
    - 为可视工作区添加智能体控件
    - 调试 WKWebView 中的 canvas 加载
summary: 智能体控制的 Canvas 面板，通过 WKWebView + 自定义 URL scheme 嵌入
title: 画布
x-i18n:
    generated_at: "2026-06-28T00:12:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS 应用通过 `WKWebView` 嵌入由智能体控制的 **Canvas 面板**。它是面向 HTML/CSS/JS、A2UI 和小型交互式 UI 界面的轻量视觉工作区。

## Canvas 位于何处

Canvas 状态存储在 Application Support 下：

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 面板通过**自定义 URL scheme**提供这些文件：

- `openclaw-canvas://<session>/<path>`

示例：

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

如果根目录下不存在 `index.html`，应用会显示一个**内置脚手架页面**。

## 面板行为

- 无边框、可调整大小的面板，锚定在菜单栏（或鼠标光标）附近。
- 按会话记住大小/位置。
- 本地 Canvas 文件更改时自动重新加载。
- 同一时间只显示一个 Canvas 面板（会按需切换会话）。

可以从 Settings → **Allow Canvas** 禁用 Canvas。禁用后，Canvas 节点命令会返回 `CANVAS_DISABLED`。

## 智能体 API 界面

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

说明：

- `canvas.navigate` 接受**本地 Canvas 路径**、`http(s)` URL 和 `file://` URL。
- 如果传入 `"/"`，Canvas 会显示本地脚手架或 `index.html`。

## Canvas 中的 A2UI

A2UI 由 Gateway 网关 Canvas host 托管，并在 Canvas 面板内渲染。当 Gateway 网关公布 Canvas host 时，macOS 应用会在首次打开时自动导航到 A2UI host 页面。

默认 A2UI host URL：

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI 命令（v0.8）

Canvas 当前接受 **A2UI v0.8** 服务器→客户端消息：

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

Canvas 可以通过深度链接触发新的智能体运行：

- `openclaw://agent?...`

示例（在 JS 中）：

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

支持的查询参数：

- `message`：预填的智能体提示词。
- `sessionKey`：稳定的会话标识符。
- `thinking`：可选的 thinking 配置。
- `deliver`、`to` 或 `channel`：投递目标。
- `timeoutSeconds`：可选的运行超时时间。
- `key`：应用为可信本地调用方生成的安全令牌。

除非提供有效 key，否则应用会提示确认。没有 key 的链接会在批准前显示消息和 URL，并忽略投递路由字段；带 key 的链接使用常规 Gateway 网关运行路径。

## 安全说明

- Canvas scheme 会阻止目录遍历；文件必须位于会话根目录下。
- 本地 Canvas 内容使用自定义 scheme（不需要 loopback 服务器）。
- 只有显式导航时才允许外部 `http(s)` URL。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [WebChat](/zh-CN/web/webchat)
