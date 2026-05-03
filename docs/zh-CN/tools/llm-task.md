---
read_when:
    - 你想要在工作流中使用仅 JSON 的 LLM 步骤
    - 你需要用于自动化的、经过模式验证的大语言模型输出
summary: 仅 JSON 的 LLM 任务，用于工作流（可选插件工具）
title: LLM 任务
x-i18n:
    generated_at: "2026-05-03T22:55:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` 是一个**可选插件工具**，用于运行仅 JSON 的 LLM 任务，并返回结构化输出（可选根据 JSON Schema 验证）。

这非常适合 Lobster 这样的工作流引擎：你可以添加单个 LLM 步骤，而无需为每个工作流编写自定义 OpenClaw 代码。

## 启用插件

1. 启用插件：

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. 允许可选工具：

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

只有在你想使用限制性允许列表模式时，才使用 `tools.allow`。

## 配置（可选）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` 是 `provider/model` 字符串的允许列表。如果已设置，列表之外的任何请求都会被拒绝。

## 工具参数

- `prompt`（字符串，必需）
- `input`（任意类型，可选）
- `schema`（对象，可选 JSON Schema）
- `provider`（字符串，可选）
- `model`（字符串，可选）
- `thinking`（字符串，可选）
- `authProfileId`（字符串，可选）
- `temperature`（数字，可选）
- `maxTokens`（数字，可选）
- `timeoutMs`（数字，可选）

`thinking` 接受标准 OpenClaw 推理预设，例如 `low` 或 `medium`。

## 输出

返回包含已解析 JSON 的 `details.json`（并在提供 `schema` 时根据它进行验证）。

## 示例：Lobster 工作流步骤

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## 安全注意事项

- 该工具**仅输出 JSON**，并指示模型只输出 JSON（不输出代码围栏，不输出评论）。
- 此次运行不会向模型暴露任何工具。
- 除非你使用 `schema` 进行验证，否则应将输出视为不可信。
- 在任何有副作用的步骤（发送、发布、执行）之前加入审批。

## 相关内容

- [思考级别](/zh-CN/tools/thinking)
- [子智能体](/zh-CN/tools/subagents)
- [斜杠命令](/zh-CN/tools/slash-commands)
