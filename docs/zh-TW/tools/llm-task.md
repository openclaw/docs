---
read_when:
    - 您想在工作流程中使用僅限 JSON 的 LLM 步驟
    - 你需要經結構描述驗證、可用於自動化的大型語言模型輸出
summary: 工作流程的僅限 JSON 的 LLM 任務（選用 Plugin 工具）
title: 大型語言模型任務
x-i18n:
    generated_at: "2026-05-04T02:45:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` 是一個**選用 Plugin 工具**，會執行僅輸出 JSON 的 LLM 任務，並傳回結構化輸出（可選擇使用 JSON Schema 驗證）。

這很適合 Lobster 這類工作流程引擎：你可以加入單一 LLM 步驟，而不必為每個工作流程撰寫自訂 OpenClaw 程式碼。

## 啟用 Plugin

1. 啟用 Plugin：

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. 允許選用工具：

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

只有在你想使用限制性允許清單模式時，才使用 `tools.allow`。

## 設定（選用）

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

`allowedModels` 是 `provider/model` 字串的允許清單。如果有設定，清單外的任何請求都會被拒絕。

## 工具參數

- `prompt`（字串，必填）
- `input`（任何值，選用）
- `schema`（物件，選用 JSON Schema）
- `provider`（字串，選用）
- `model`（字串，選用）
- `thinking`（字串，選用）
- `authProfileId`（字串，選用）
- `temperature`（數字，選用）
- `maxTokens`（數字，選用）
- `timeoutMs`（數字，選用）

`thinking` 接受標準 OpenClaw 推理預設值，例如 `low` 或 `medium`。

## 輸出

傳回包含已剖析 JSON 的 `details.json`（提供 `schema` 時也會據此驗證）。

## 範例：Lobster 工作流程步驟

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

## 安全注意事項

- 此工具**僅輸出 JSON**，並指示模型只輸出 JSON（不得包含程式碼區塊或評論）。
- 此次執行不會向模型公開任何工具。
- 除非你使用 `schema` 驗證，否則應將輸出視為不受信任。
- 在任何會產生副作用的步驟（send、post、exec）之前放置核准流程。

## 相關

- [推理層級](/zh-TW/tools/thinking)
- [Sub-agents](/zh-TW/tools/subagents)
- [斜線命令](/zh-TW/tools/slash-commands)
