---
read_when:
    - 实现 macOS Canvas 面板
    - 为可视化工作区添加智能体控制
    - 调试 WKWebView 画布加载
summary: 智能体控制的 Canvas 面板，通过 WKWebView + 自定义 URL 方案嵌入
title: 画布
x-i18n:
    generated_at: "2026-07-05T11:29:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a28ebad43f6135e199f1aa03e45aa92ad309d11348d5a47121b1418442b6fe17
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS 应用使用 `WKWebView` 嵌入一个由智能体控制的 **Canvas 面板**，这是一个用于 HTML/CSS/JS、A2UI 和小型交互式 UI 界面的轻量视觉工作区。

## Canvas 的位置

Canvas 状态存储在 Application Support 下：

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 面板通过自定义 URL scheme 提供这些文件：
`openclaw-canvas://<session>/<path>`：

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

如果根目录下没有 `index.html`，应用会显示内置脚手架页面。

## 面板行为

- 无边框、可调整大小的面板，锚定在菜单栏附近（或鼠标光标附近）。
- 按会话记住大小和位置。
- 本地 Canvas 文件变化时自动重新加载。
- 同一时间只显示一个 Canvas 面板（按需切换会话）。

可以在设置 -> **允许 Canvas** 中禁用 Canvas。禁用后，canvas 节点命令会返回 `CANVAS_DISABLED`。

## 智能体 API 界面

Canvas 通过 Gateway 网关 WebSocket 暴露，因此智能体可以显示/隐藏面板、导航到路径或 URL、执行 JavaScript，并捕获快照图片：

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` 接受本地 Canvas 路径、`http(s)` URL 和 `file://` URL。传入 `"/"` 会显示本地脚手架或 `index.html`。

## Canvas 中的 A2UI

A2UI 由 Gateway 网关 canvas host 托管，并在 Canvas 面板内渲染。当 Gateway 网关发布 Canvas host 时，macOS 应用会在首次打开时自动导航到 A2UI host 页面。

默认 A2UI host URL：`http://<gateway-host>:18789/__openclaw__/a2ui/`

### A2UI 命令（v0.8）

Canvas 接受 A2UI v0.8 服务端到客户端消息：`beginRendering`、`surfaceUpdate`、`dataModelUpdate`、`deleteSurface`。尚不支持 `createSurface`（v0.9）。

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

Canvas 可以通过 `openclaw://agent?...` 深层链接触发新的智能体运行：

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

支持的查询参数：

| 参数                       | 含义                                                  |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | 预填的智能体提示词。                                  |
| `sessionKey`               | 稳定的会话标识符。                                    |
| `thinking`                 | 可选的 thinking 配置。                                |
| `deliver`, `to`, `channel` | 递送目标。                                            |
| `timeoutSeconds`           | 可选的运行超时时间。                                  |
| `key`                      | 应用为受信任本地调用方生成的安全令牌。                |

除非提供有效 key，否则应用会提示确认。未带 key 的链接会在审批前显示消息和 URL，并忽略递送路由字段；带 key 的链接会使用正常的 Gateway 网关运行路径。

## 安全说明

- Canvas scheme 会阻止目录遍历；文件必须位于会话根目录下。
- 本地 Canvas 内容使用自定义 scheme（不需要 loopback 服务器）。
- 只有在显式导航时才允许外部 `http(s)` URL。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [WebChat](/zh-CN/web/webchat)
