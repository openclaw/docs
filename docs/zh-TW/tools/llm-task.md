---
read_when:
    - 你希望在工作流程中加入僅輸出 JSON 的 LLM 步驟
    - 你需要經結構描述驗證的 LLM 輸出來進行自動化
summary: 用於工作流程的 JSON-only LLM 任務（選用 Plugin 工具）
title: 大型語言模型任務
x-i18n:
    generated_at: "2026-04-30T03:45:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` 是一個**選用的 Plugin 工具**，會執行僅 JSON 的 LLM 工作，並傳回結構化輸出（可選擇依 JSON Schema 驗證）。

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

2. 將工具加入允許清單（它是以 `optional: true` 註冊）：

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

`allowedModels` 是 `provider/model` 字串的允許清單。如果已設定，清單以外的任何請求都會被拒絕。

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

`thinking` 接受標準的 OpenClaw 推理預設值，例如 `low` 或 `medium`。

## 輸出

傳回包含已解析 JSON 的 `details.json`（並在提供 `schema` 時依其驗證）。

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

- 此工具是**僅 JSON**，並會指示模型只輸出 JSON（不含程式碼圍欄、沒有說明文字）。
- 這次執行不會向模型暴露任何工具。
- 除非你使用 `schema` 驗證，否則應將輸出視為不可信。
- 在任何有副作用的步驟（send、post、exec）之前放置核准流程。

## 相關內容

- [思考層級](/zh-TW/tools/thinking)
- [Sub-agents](/zh-TW/tools/subagents)
- [斜線命令](/zh-TW/tools/slash-commands)
