---
read_when:
    - 你想在工作流中加入一个仅 JSON 的 LLM 步骤
    - 你需要用于自动化的经 schema 验证的 LLM 输出
summary: 面向工作流的仅 JSON LLM 任务（可选插件工具）
title: LLM 任务
x-i18n:
    generated_at: "2026-04-23T19:27:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4234b2fd9247c06fcc481be6e3339726ebdb84891f4b8324f17e2d387dac4d8a
    source_path: tools/llm-task.md
    workflow: 15
---

# LLM 任务

`llm-task` 是一个**可选插件工具**，用于运行仅 JSON 的 LLM 任务，并返回结构化输出（可选地根据 JSON Schema 进行验证）。

这非常适合 Lobster 之类的工作流引擎：你可以添加一个单独的 LLM 步骤，而无需为每个工作流编写自定义 OpenClaw 代码。

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
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` 是由 `provider/model` 字符串组成的 allowlist。如果设置了它，则任何不在该列表中的请求都会被拒绝。

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

`thinking` 接受标准 OpenClaw 推理预设，例如 `low` 或 `medium`。

## 输出

返回 `details.json`，其中包含已解析的 JSON（若提供了 `schema`，还会对其进行验证）。

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

- 该工具是**仅 JSON** 的，并会指示模型只输出 JSON（不包含代码围栏，也不包含说明性文字）。
- 本次运行不会向模型暴露任何工具。
- 除非你使用 `schema` 进行验证，否则应将输出视为不受信任。
- 在任何有副作用的步骤（send、post、exec）之前放置审批。
