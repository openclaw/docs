---
read_when:
    - 实现 macOS Canvas 面板
    - 为可视化工作区添加智能体控制功能
    - 调试 WKWebView 画布加载
summary: 通过 WKWebView + 自定义 URL scheme 嵌入的智能体控制 Canvas 面板
title: 画布
x-i18n:
    generated_at: "2026-07-12T14:33:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS 应用使用 `WKWebView` 嵌入了一个由智能体控制的 **Canvas 面板**，这是一个用于 HTML/CSS/JS、A2UI 和小型交互式 UI 界面的轻量级可视化工作区。

## Canvas 的位置

Canvas 状态存储在 Application Support 目录下：

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 面板通过自定义 URL 方案 `openclaw-canvas://<session>/<path>` 提供这些文件：

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

如果根目录下不存在 `index.html`，应用会显示内置的脚手架页面。

## 面板行为

- 无边框、可调整大小的面板，锚定在菜单栏（或鼠标光标）附近。
- 按会话记住大小和位置。
- 本地 Canvas 文件发生变化时自动重新加载。
- 同一时间仅显示一个 Canvas 面板（根据需要切换会话）。

可在 Settings -> **Allow Canvas** 中禁用 Canvas。禁用后，Canvas 节点命令会返回 `CANVAS_DISABLED`。

## 智能体 API 界面

Canvas 通过 Gateway 网关 WebSocket 暴露，因此智能体可以显示或隐藏面板、导航到路径或 URL、执行 JavaScript，以及捕获快照图像：

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` 接受本地 Canvas 路径、`http(s)` URL 和 `file://` URL。传入 `"/"` 会显示本地脚手架或 `index.html`。

`/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/` 下由 Gateway 网关托管的目标，会通过节点会话当前受限范围的 Canvas URL 进行解析。应用会在导航前刷新该短期有效的能力；你无需自行构造或复制能力 URL。

## Canvas 中的 A2UI

A2UI 由 Gateway 网关 Canvas 主机托管，并在 Canvas 面板中渲染。当 Gateway 网关公布 Canvas 主机时，macOS 应用会在首次打开时自动导航到 A2UI 主机页面。

公布的 URL 受能力范围限制，例如 `http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`。应将其视为临时凭据，而不是稳定链接。

### A2UI 命令（v0.8）

Canvas 接受 A2UI v0.8 从服务器到客户端的消息：`beginRendering`、`surfaceUpdate`、`dataModelUpdate`、`deleteSurface`。目前尚不支持 `createSurface`（v0.9）。

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"如果你能读到这段文字，说明 A2UI 推送正常工作。"},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

快速冒烟测试：

```bash
openclaw nodes canvas a2ui push --node <id> --text "来自 A2UI 的问候"
```

## 从 Canvas 触发智能体运行

Canvas 可以通过 `openclaw://agent?...` 深层链接触发新的智能体运行：

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

支持的查询参数：

| 参数                       | 含义                                                  |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | 预填充的智能体提示词。                                |
| `sessionKey`               | 稳定的会话标识符。                                    |
| `thinking`                 | 可选的思考配置。                                      |
| `deliver`, `to`, `channel` | 投递目标。                                            |
| `timeoutSeconds`           | 可选的运行超时时间。                                  |
| `key`                      | 应用为受信任的本地调用方生成的安全令牌。              |

除非提供有效密钥，否则应用会提示确认。没有密钥的链接会在批准前显示消息和 URL，并忽略投递路由字段；带密钥的链接则使用正常的 Gateway 网关运行路径。

## 安全说明

- Canvas 方案会阻止目录遍历；文件必须位于会话根目录下。
- 本地 Canvas 内容使用自定义方案（无需 local loopback 服务器）。
- 仅在显式导航时才允许外部 `http(s)` URL。
- 普通网页仅供渲染。只有应用自有的 Canvas 方案，或由应用选定且能力范围完全匹配的 Gateway 网关 A2UI 文档，才能发起智能体操作；子框架、重定向、过期能力和发生变化的查询均无法分派操作。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [WebChat](/zh-CN/web/webchat)
