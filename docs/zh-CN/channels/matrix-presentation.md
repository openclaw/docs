---
read_when:
    - 构建可渲染 OpenClaw 富响应的 Matrix 客户端
    - 调试 com.openclaw.presentation 事件内容
summary: 面向支持 OpenClaw 的客户端的 Matrix MessagePresentation 元数据
title: Matrix 呈现元数据
x-i18n:
    generated_at: "2026-05-10T19:22:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw 可以将规范化的 `MessagePresentation` 元数据附加到出站 Matrix `m.room.message` 事件的 `com.openclaw.presentation` 下。

标准 Matrix 客户端会继续渲染纯文本 `body`。支持 OpenClaw 的客户端可以读取结构化元数据，并渲染按钮、选择框、上下文行和分隔线等原生 UI。

## 事件内容

元数据存储在 Matrix 事件内容中：

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
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

`version` 是 Matrix 呈现元数据架构版本。`type` 是供支持 OpenClaw 的客户端使用的稳定判别符。客户端应忽略未知的 `type` 值、无法安全解读的未知版本，以及未知的块类型。

## 回退行为

OpenClaw 始终会将可读的纯文本回退内容渲染到 `body` 中。结构化元数据是增量补充，不应成为基本 Matrix 互操作性的必需条件。

不支持的客户端应继续显示回退文本。支持 OpenClaw 的客户端可以优先使用结构化元数据进行显示，同时保留回退文本用于复制、搜索、通知和无障碍访问。

## 支持的块

Matrix 出站适配器声明支持：

- `buttons`
- `select`
- `context`
- `divider`

客户端应将这些块视为尽力而为的呈现提示。未知字段和未知块类型应被忽略，而不是导致整条消息渲染失败。

## 交互

此元数据不会添加 Matrix 回调语义。按钮和选择选项值是回退交互载荷，通常是斜杠命令或文本命令。想要支持交互的 Matrix 客户端可以将选定值作为普通消息发送回房间。

例如，值为 `/model deepseek/deepseek-chat` 的按钮可以通过在同一房间中将该值作为加密的 Matrix 文本消息发送来处理。

## 与审批元数据的关系

`com.openclaw.presentation` 用于通用富消息呈现。

审批提示使用专用的 `com.openclaw.approval` 元数据，因为审批携带安全敏感状态、决策以及执行/插件详情。如果同一事件上同时存在这两个元数据键，客户端应优先使用专用审批渲染器。

## 媒体消息

当回复包含多个媒体 URL 时，OpenClaw 会为每个媒体 URL 发送一个 Matrix 事件。呈现元数据只附加到第一个媒体事件，以便客户端获得一个稳定的结构化载荷，并避免重复渲染器。

保持呈现元数据紧凑。大型用户可见文本应保留在 `body` 中，并使用常规 Matrix 文本分块路径。
