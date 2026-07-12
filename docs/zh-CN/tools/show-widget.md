---
read_when:
    - 你希望智能体在网页聊天中呈现交互式结果
    - 你需要 `show_widget` 的输入、安全或保留策略契约
sidebarTitle: Show widget
summary: 在网页聊天中以内联方式呈现独立的 SVG 或 HTML 小组件
title: 显示小组件
x-i18n:
    generated_at: "2026-07-11T21:00:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` 在 Control UI 聊天记录中以内联方式渲染独立的 SVG 或 HTML 片段。内置 Canvas 插件拥有该工具，并将每个结果托管为同源 Canvas 文档。

仅当发起请求的 Gateway 网关客户端声明 `inline-widgets` 能力时，该工具才可用。Control UI 会自动声明此能力。Telegram 和 WhatsApp 等渠道运行不会获得 `show_widget`。

能力传输覆盖嵌入式、Codex app-server 和基于 CLI 的模型后端。通过授权认证的 MCP 调用方和直接调用 HTTP 工具的调用方仍会采用故障关闭策略，因为它们不声明客户端能力。

## 使用工具

智能体需要提供两个必填字符串：

<ParamField path="title" type="string" required>
  与内联预览一起显示并用作文档标题的简短标题。
</ParamField>

<ParamField path="widget_code" type="string" required>
  独立的 SVG 或 HTML 片段。去除首尾空白后以 `<svg` 开头的输入会按 SVG 模式渲染；所有其他输入均视为 HTML 片段。最大长度：262,144 个字符。
</ParamField>

工具结果包含 Canvas 预览句柄，因此网页聊天会直接从工具调用中渲染小组件，并在重新加载历史记录后将其恢复。不渲染预览的聊天记录仍会显示托管的 Canvas 路径。

## 安全性与存储

小组件文档使用严格的内容安全策略：允许内联样式和脚本，图片可以使用 `data:` URL，同时阻止外部获取和资源加载。请将所有标记、样式、脚本和图片数据都放在 `widget_code` 内。

即使 Control UI 的全局嵌入模式为 `trusted`，iframe 也始终省略 `allow-same-origin`，因此小组件脚本无法读取父应用的源。Canvas 主机还会使用 `Content-Security-Policy: sandbox allow-scripts` 响应头提供小组件文档，因此即使直接打开托管 URL，小组件仍会在不透明源中运行，而不是在 Control UI 的源中运行。浏览器沙箱隔离无法阻止脚本导航其自身的 iframe；请仅渲染你愿意在该隔离框架中执行的小组件代码。

iframe 还遵循 [`gateway.controlUi.embedSandbox`](/zh-CN/web/control-ui#hosted-embeds)。默认的 `scripts` 层级支持交互式小组件，同时保持源隔离。

Canvas 每个会话最多保留 32 个小组件（没有可用会话时，则每个智能体最多保留 32 个）。创建新的小组件会移除该作用域中最旧的文档。

## 相关内容

- [Control UI 托管式嵌入](/zh-CN/web/control-ui#hosted-embeds)
- [Canvas 插件](/zh-CN/plugins/reference/canvas)
- [Gateway 网关协议客户端能力](/zh-CN/gateway/protocol#client-capabilities)
