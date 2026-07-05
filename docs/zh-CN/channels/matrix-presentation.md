---
read_when:
    - 构建可呈现 OpenClaw 富响应的 Matrix 客户端
    - 调试 com.openclaw.presentation 事件内容
summary: 供支持 OpenClaw 的客户端使用的 Matrix MessagePresentation 元数据
title: Matrix 呈现元数据
x-i18n:
    generated_at: "2026-07-05T11:03:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw 会将规范化的 `MessagePresentation` 元数据附加到出站 Matrix `m.room.message` 事件中，位于 `com.openclaw.presentation` 内容键下。

标准 Matrix 客户端会继续渲染纯文本 `body`。支持 OpenClaw 的客户端可以读取结构化元数据，并渲染按钮、选择框、上下文行和分隔线等原生 UI。

## 事件内容

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
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

- `version` 是元数据架构版本；当前版本为 `1`。`type` 是稳定的判别字段，始终为 `"message.presentation"`。Matrix 适配器只会发出完全匹配此版本和类型的载荷；客户端同样应忽略无法安全解释的未知版本、未知 `type` 值和未知块类型。
- `title` 和 `tone`（`info`、`success`、`warning`、`danger`、`neutral`）是可选提示。
- 按钮和选择选项可以在旧版字符串 `value` 旁携带带类型的 `action`（`{ "type": "command", "command": "/..." }` 或 `{ "type": "callback", "value": "..." }`）。两者同时存在时，优先使用 `action`。

## 回退行为

OpenClaw 始终会将可读的纯文本回退内容渲染到 `body`。结构化元数据是增量内容，基本 Matrix 互操作性不得依赖它。

回退渲染规则：

- `title`、`text` 和 `context` 内容会渲染为纯文本行。
- 带有 `command` 操作的按钮会渲染为 ``label: `/command` ``，以便命令保持可复制。带有 `callback` 操作或仅有旧版 `value` 的按钮只渲染标签，以便不透明回调值保持私密；禁用的按钮始终只渲染标签。URL 和 Web 应用按钮会渲染为 `label: URL`。
- 选择块会将占位符（或 `Options:`）渲染为标题，并附加只含标签的选项行。
- 如果没有任何内容可渲染，例如仅包含分隔线的呈现，正文会回退为 `---`。

不支持的客户端会继续显示回退文本。支持 OpenClaw 的客户端可以优先使用结构化元数据来显示，同时保留回退文本用于复制、搜索、通知和无障碍访问。

## 支持的块

Matrix 出站适配器声明对以下内容提供原生支持：

- `buttons`
- `select`
- `context`
- `divider`

`text` 块始终通过回退正文受支持。将所有块都视为尽力而为的呈现提示；应忽略未知字段和块类型，而不是让整条消息失败。

## 交互

此元数据不会添加 Matrix 回调语义。按钮和选择值是回退交互载荷，通常是斜杠命令或文本命令。想要支持交互的 Matrix 客户端会解析控件值（`action.command`，然后是 `action.value`，然后是 `value`），并将其作为普通消息发送回房间。

例如，值为 `/model deepseek/deepseek-chat` 的按钮可以通过在同一房间中将该值作为加密 Matrix 文本消息发送来处理。

## 与审批元数据的关系

`com.openclaw.presentation` 用于通用富消息呈现。

审批提示使用专用的 `com.openclaw.approval` 元数据，因为审批携带安全敏感的状态、决策以及 Exec/插件详情。如果同一事件上同时存在这两个元数据键，客户端应优先使用专用审批渲染器。

## 媒体消息

当回复包含多个媒体 URL 时，OpenClaw 会为每个媒体 URL 发送一个 Matrix 事件。说明文字和呈现元数据只会附加到第一个事件，以便客户端获得一个稳定的结构化载荷，而不会出现重复渲染器。当长文本被拆分到多个事件时也适用同一规则：元数据只附加到第一个事件。

保持呈现元数据紧凑。大量用户可见文本应保留在 `body` 中，并使用常规 Matrix 文本分块路径。
