---
read_when:
    - 你想要在工作流程內加入僅輸出 JSON 的 LLM 步驟
    - 你需要經過結構描述驗證的 LLM 輸出用於自動化
summary: 用於工作流程的僅 JSON LLM 任務（選用外掛工具）
title: LLM 任務
x-i18n:
    generated_at: "2026-06-27T20:08:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` 是一個**選用外掛工具**，會執行僅限 JSON 的 LLM 任務，並
傳回結構化輸出（可選擇依 JSON Schema 驗證）。

這很適合 Lobster 這類工作流程引擎：你可以加入單一 LLM 步驟，
而不必為每個工作流程撰寫自訂 OpenClaw 程式碼。

## 啟用外掛

1. 啟用外掛：

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
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` 是 `provider/model` 字串的允許清單。如果有設定，任何
不在清單中的請求都會被拒絕。

## 工具參數

- `prompt`（字串，必填）
- `input`（任意，選填）
- `schema`（物件，選填 JSON Schema）
- `provider`（字串，選填）
- `model`（字串，選填）
- `thinking`（字串，選填）
- `authProfileId`（字串，選填）
- `temperature`（數字，選填）
- `maxTokens`（數字，選填）
- `timeoutMs`（數字，選填）

`thinking` 接受標準 OpenClaw 推理預設，例如 `low` 或 `medium`。

## 輸出

傳回包含已剖析 JSON 的 `details.json`（並在提供 `schema` 時依其驗證）。

## 範例：Lobster 工作流程步驟

### 重要限制

以下範例假設**獨立 Lobster 命令列介面**是在 `openclaw.invoke` 已具備正確閘道 URL/驗證內容的環境中執行。

對於 OpenClaw 內建的**嵌入式** Lobster 執行器，這種巢狀命令列介面模式**目前並不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

在嵌入式 Lobster 尚未為此流程提供受支援的橋接之前，請優先使用以下任一方式：

- 在 Lobster 外部直接呼叫 `llm-task` 工具，或
- 使用不依賴巢狀 `openclaw.invoke` 呼叫的 Lobster 步驟。

獨立 Lobster 命令列介面範例：

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

- 此工具**僅限 JSON**，並指示模型只輸出 JSON（不含
  程式碼圍欄、無評論）。
- 這次執行不會向模型公開任何工具。
- 除非你使用 `schema` 驗證，否則應將輸出視為不受信任。
- 在任何具副作用的步驟（send、post、exec）之前放置核准。

## 相關

- [思考層級](/zh-TW/tools/thinking)
- [子代理](/zh-TW/tools/subagents)
- [斜線命令](/zh-TW/tools/slash-commands)
