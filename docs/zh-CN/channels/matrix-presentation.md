---
read_when:
    - 构建可呈现 OpenClaw 富响应的 Matrix 客户端
    - 调试 com.openclaw.presentation 事件内容
summary: 面向 OpenClaw 感知型客户端的 Matrix 呈现元数据
title: Matrix 呈现元数据
x-i18n:
    generated_at: "2026-07-11T20:20:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw 会将规范化的 `MessagePresentation` 元数据附加到出站 Matrix `m.room.message` 事件的 `com.openclaw.presentation` 内容键下。

标准 Matrix 客户端会继续渲染纯文本 `body`。支持 OpenClaw 的客户端可以读取结构化元数据，并渲染按钮、选择器、上下文行和分隔线等原生 UI。

## 事件内容

```json
{
  "msgtype": "m.text",
  "body": "选择模型\n\n选择模型：\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "选择模型",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "选择模型",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

- `version` 是元数据架构版本；当前版本为 `1`。`type` 是稳定的判别字段，始终为 `"message.presentation"`。Matrix 适配器只会发出版本和类型与此完全一致的载荷；同样，客户端应忽略无法安全解析的未知版本、未知的 `type` 值以及未知的块类型。
- `title` 和 `tone`（`info`、`success`、`warning`、`danger`、`neutral`）是可选提示。
- 除旧版字符串 `value` 外，按钮和选择选项还可携带类型化的 `action`（`{ "type": "command", "command": "/..." }` 或 `{ "type": "callback", "value": "..." }`）。两者同时存在时，优先使用 `action`。

## 回退行为

OpenClaw 始终会在 `body` 中渲染可读的纯文本回退内容。结构化元数据是附加信息，不得作为实现基本 Matrix 互操作性的必要条件。

回退渲染规则：

- `title`、`text` 和 `context` 内容渲染为纯文本行。
- 带有 `command` 操作的按钮渲染为 ``标签：`/command` ``，以便命令仍可复制。带有 `callback` 操作或仅有旧版 `value` 的按钮只渲染标签，以确保不透明的回调值保持私密；禁用的按钮始终只渲染标签。URL 和 Web 应用按钮渲染为 `标签：URL`。
- `select` 块将占位文本（或 `选项：`）渲染为标题，并在其后渲染仅包含标签的选项行。
- 如果没有任何可渲染内容，例如仅含分隔线的呈现内容，则正文回退为 `---`。

不支持此功能的客户端会继续显示回退文本。支持 OpenClaw 的客户端可优先使用结构化元数据进行显示，同时保留回退文本用于复制、搜索、通知和无障碍访问。

## 支持的块

Matrix 出站适配器声明原生支持：

- `buttons`
- `select`
- `context`
- `divider`

`text` 块始终通过回退正文得到支持。应将所有块视为尽力而为的呈现提示；忽略未知字段和块类型，而不是使整条消息失败。

## 交互

此元数据不会添加 Matrix 回调语义。按钮和选择选项的值是回退交互载荷，通常为斜杠命令或文本命令。希望支持交互的 Matrix 客户端应解析控件值（依次尝试 `action.command`、`action.value`、`value`），并将其作为普通消息发回房间。

例如，可以通过在同一房间中将值 `/model deepseek/deepseek-chat` 作为加密的 Matrix 文本消息发送，来处理具有该值的按钮。

## 与审批元数据的关系

`com.openclaw.presentation` 用于通用的富消息呈现。

审批提示使用专用的 `com.openclaw.approval` 元数据，因为审批包含安全敏感的状态、决策以及 Exec/插件详情。如果同一事件中同时存在这两个元数据键，客户端应优先使用专用的审批渲染器。

## 媒体消息

当回复包含多个媒体 URL 时，OpenClaw 会为每个媒体 URL 分别发送一个 Matrix 事件。说明文字和呈现元数据仅附加到第一个事件，以便客户端获得一个稳定的结构化载荷，而不会产生重复的渲染器。长文本被分块到多个事件时也适用相同规则：元数据仅随第一个事件发送。

呈现元数据应保持紧凑。大量用户可见文本应保留在 `body` 中，并使用常规的 Matrix 文本分块路径。
