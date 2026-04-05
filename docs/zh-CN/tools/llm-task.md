---
read_when:
    - 你想在工作流中加入一个纯 JSON 的 LLM 步骤
    - 你需要用于自动化的、经过 schema 校验的 LLM 输出
summary: 用于工作流的纯 JSON LLM 任务（可选插件工具）
title: LLM Task
x-i18n:
    generated_at: "2026-04-05T10:11:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbe9b286a8e958494de06a59b6e7b750a82d492158df344c7afe30fce24f0584
    source_path: tools/llm-task.md
    workflow: 15
---

# LLM Task

`llm-task` 是一个**可选插件工具**，用于运行纯 JSON 的 LLM 任务，并返回结构化输出（可选地依据 JSON Schema 进行校验）。

这非常适合 Lobster 这样的工作流引擎：你可以添加一个单独的 LLM 步骤，而无需为每个工作流编写自定义 OpenClaw 代码。

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

2. 将该工具加入 allowlist（它以 `optional: true` 注册）：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## 配置（可选）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` 是 `provider/model` 字符串的 allowlist。如果设置了它，任何不在列表中的请求都会被拒绝。

## 工具参数

- `prompt`（字符串，必填）
- `input`（任意类型，可选）
- `schema`（对象，可选，JSON Schema）
- `provider`（字符串，可选）
- `model`（字符串，可选）
- `thinking`（字符串，可选）
- `authProfileId`（字符串，可选）
- `temperature`（数字，可选）
- `maxTokens`（数字，可选）
- `timeoutMs`（数字，可选）

`thinking` 接受标准的 OpenClaw 推理预设，例如 `low` 或 `medium`。

## 输出

返回包含已解析 JSON 的 `details.json`（如果提供了 `schema`，还会依据它进行校验）。

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

## 安全说明

- 该工具是**纯 JSON** 的，并会指示模型只输出 JSON（不使用
  代码围栏，不带说明文字）。
- 在这次运行中，不会向模型暴露任何工具。
- 除非你使用 `schema` 进行校验，否则应将输出视为不可信。
- 在任何会产生副作用的步骤（发送、发布、exec）之前先设置审批。
