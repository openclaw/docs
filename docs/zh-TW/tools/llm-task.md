---
read_when:
    - 您想在工作流程中加入僅輸出 JSON 的 LLM 步驟
    - 你需要經過結構描述驗證的大型語言模型輸出來進行自動化
summary: 工作流程的僅限 JSON LLM 任務（選用的 Plugin 工具）
title: LLM 任務
x-i18n:
    generated_at: "2026-05-07T13:26:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f5efe399165e31a7f5966b93c2f83bced4fd96b7f04f5156412fd321bf5f403
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` 是一個**選用的 Plugin 工具**，會執行僅限 JSON 的 LLM 任務，並
傳回結構化輸出（可選擇依 JSON Schema 驗證）。

這很適合像 Lobster 這類工作流程引擎：你可以加入單一 LLM 步驟，
而不必為每個工作流程撰寫自訂 OpenClaw 程式碼。

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

`allowedModels` 是 `provider/model` 字串的允許清單。如果有設定，任何不在清單中的請求
都會被拒絕。

## 工具參數

- `prompt`（字串，必填）
- `input`（任何值，選填）
- `schema`（物件，選填 JSON Schema）
- `provider`（字串，選填）
- `model`（字串，選填）
- `thinking`（字串，選填）
- `authProfileId`（字串，選填）
- `temperature`（數字，選填）
- `maxTokens`（數字，選填）
- `timeoutMs`（數字，選填）

`thinking` 接受標準 OpenClaw 推理預設值，例如 `low` 或 `medium`。

## 輸出

傳回包含已剖析 JSON 的 `details.json`（並在提供 `schema` 時依其
驗證）。

## 範例：Lobster 工作流程步驟

### 重要限制

下列範例假設**獨立版 Lobster CLI** 正在某個環境中執行，且 `openclaw.invoke` 已具備正確的 Gateway URL/驗證情境。

對於 OpenClaw 內建的**嵌入式** Lobster 執行器，這種巢狀 CLI 模式**目前不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

在嵌入式 Lobster 支援此流程的橋接之前，請優先使用下列任一方式：

- 在 Lobster 之外直接呼叫 `llm-task` 工具，或
- 使用不依賴巢狀 `openclaw.invoke` 呼叫的 Lobster 步驟。

獨立版 Lobster CLI 範例：

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

- 此工具**僅限 JSON**，並指示模型只輸出 JSON（沒有
  程式碼區塊，沒有評論）。
- 此次執行不會向模型公開任何工具。
- 除非你使用 `schema` 驗證，否則請將輸出視為不受信任。
- 在任何會產生副作用的步驟（傳送、發布、執行）之前加入核准。

## 相關

- [思考層級](/zh-TW/tools/thinking)
- [子代理](/zh-TW/tools/subagents)
- [斜線命令](/zh-TW/tools/slash-commands)
