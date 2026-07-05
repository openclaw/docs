---
read_when:
    - 你想要在工作流程中加入僅輸出 JSON 的 LLM 步驟
    - 你需要經過結構描述驗證的 LLM 輸出來進行自動化
summary: 工作流程的僅 JSON LLM 任務（選用外掛工具）
title: LLM 任務
x-i18n:
    generated_at: "2026-07-05T11:46:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98856fd8ccf7181a89073cbaa939d9b303532f7fba612d7800e1b89a9d1b25ae
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` 是一個內建的**可選外掛工具**，會執行單次僅限 JSON 的
LLM 呼叫並回傳結構化輸出，也可選擇使用 JSON Schema 驗證。它讓 Lobster 這類工作流程引擎能有一個 LLM 步驟，而不必為每個工作流程撰寫自訂
OpenClaw 程式碼。

## 啟用

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

2. 允許此工具：

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` 會在作用中的工具設定檔之上加入 `llm-task`，而不會
限制其他核心工具。只有在你想改用限制性的允許清單模式時，才使用 `tools.allow`。

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

`allowedModels` 是由 `provider/model` 字串組成的允許清單；任何
其他模型的請求都會遭拒。所有其他鍵都是每次呼叫的備用值，會在
工具呼叫省略該參數時使用。

## 工具參數

| 參數            | 類型   | 備註                                                                                                                                         |
| --------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | 必填。給 LLM 的任務指令。                                                                                                                     |
| `input`         | any    | 選用酬載；會序列化為 JSON 並附加到提示。                                                                                                      |
| `schema`        | object | 選用 JSON Schema，剖析後的輸出必須通過其驗證。                                                                                                |
| `provider`      | string | 覆寫 `defaultProvider` / 代理程式的預設提供者。                                                                                                |
| `model`         | string | 覆寫 `defaultModel`；接受裸模型 ID、別名，或 `provider/model` 參照（重複的提供者前綴會自動移除）。                                            |
| `thinking`      | string | 推理等級（例如 `low`、`medium`）；必須是解析後模型支援的等級之一。                                                                             |
| `authProfileId` | string | 覆寫 `defaultAuthProfileId`。                                                                                                                  |
| `temperature`   | number | 盡力而為；並非所有提供者都會採用。                                                                                                            |
| `maxTokens`     | number | 對輸出 token 的盡力而為上限。                                                                                                                  |
| `timeoutMs`     | number | 執行逾時；預設為 `30000`。                                                                                                                     |

## 輸出

回傳 `details.json`（已剖析且通過 schema 驗證的 JSON），以及指出實際執行項目的 `details.provider`
和 `details.model`。

## 範例：Lobster 工作流程步驟

### 重要限制

下方範例假設**獨立版 Lobster 命令列介面**是在
`openclaw.invoke` 已有正確閘道 URL/驗證情境的地方執行。

對於 OpenClaw 內部內建的**嵌入式** Lobster 執行器，這種巢狀命令列介面
模式**目前並不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

在嵌入式 Lobster 對此流程提供受支援的橋接之前，請優先使用下列任一方式：

- 在 Lobster 外直接呼叫 `llm-task` 工具，或
- 不依賴巢狀 `openclaw.invoke` 呼叫的 Lobster 步驟。

獨立版 Lobster 命令列介面範例：

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

- **僅限 JSON**：模型會被指示只回傳 JSON 值，不包含程式碼
  區塊，也不包含註解。
- **沒有工具**：底層執行已停用工具，因此模型無法在任務中途
  對外呼叫。
- 除非你使用 `schema` 驗證，否則應將輸出視為不受信任。
- 在任何會取用此輸出且具有副作用的步驟（send、post、exec）之前放置核准流程。

## 相關

- [推理等級](/zh-TW/tools/thinking)
- [子代理程式](/zh-TW/tools/subagents)
- [斜線命令](/zh-TW/tools/slash-commands)
