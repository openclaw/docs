---
read_when:
    - 你想在工作流程中加入僅輸出 JSON 的大型語言模型步驟
    - 你需要經過結構描述驗證的 LLM 輸出，以用於自動化作業
summary: 工作流程的僅限 JSON LLM 任務（選用外掛工具）
title: LLM 任務
x-i18n:
    generated_at: "2026-07-12T14:50:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` 是內建的**選用外掛工具**，可執行單次僅限 JSON 的
LLM 呼叫並傳回結構化輸出，還可選擇使用 JSON
Schema 驗證。它能讓 Lobster 等工作流程引擎使用 LLM 步驟，而不必為每個工作流程撰寫自訂
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

`alsoAllow` 會在使用中的工具設定檔之外加入 `llm-task`，且不會
限制其他核心工具。只有在你想使用限制性的
允許清單模式時，才改用 `tools.allow`。

## 設定（選用）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` 是由 `provider/model` 字串組成的允許清單；任何要求使用
其他模型的請求都會遭到拒絕。其他所有鍵都是每次呼叫的備用值，當
工具呼叫省略該參數時使用。

## 工具參數

| 參數            | 類型   | 說明                                                                                                                                                            |
| --------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | 必填。提供給 LLM 的任務指示。                                                                                                                                  |
| `input`         | any    | 選用酬載；序列化為 JSON 後附加至提示詞。                                                                                                                       |
| `schema`        | object | 選用的 JSON Schema，剖析後的輸出必須通過其驗證。                                                                                                               |
| `provider`      | string | 覆寫 `defaultProvider`／代理程式的預設提供者。                                                                                                                  |
| `model`         | string | 覆寫 `defaultModel`；接受單獨的模型 ID、別名或 `provider/model` 參照（重複的提供者前綴會自動移除）。                                                            |
| `thinking`      | string | 推理層級（例如 `low`、`medium`）；必須是解析後模型支援的層級。                                                                                                  |
| `authProfileId` | string | 覆寫 `defaultAuthProfileId`。                                                                                                                                   |
| `temperature`   | number | 盡力套用；並非所有提供者都支援。                                                                                                                                |
| `maxTokens`     | number | 盡力限制輸出權杖數。                                                                                                                                            |
| `timeoutMs`     | number | 執行逾時時間；預設為 `30000`。                                                                                                                                 |

## 輸出

傳回 `details.json`（已剖析且通過結構描述驗證的 JSON），以及指出實際執行之提供者和模型的
`details.provider` 與 `details.model`。

## 範例：Lobster 工作流程步驟

### 重要限制

下方範例假設**獨立版 Lobster 命令列介面**的執行環境中，
`openclaw.invoke` 已具有正確的閘道 URL／驗證情境。

若使用 OpenClaw 內建的**嵌入式** Lobster 執行器，這種巢狀命令列介面
模式**目前並不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

在嵌入式 Lobster 尚未提供支援此流程的橋接機制前，請優先選擇：

- 在 Lobster 外直接呼叫 `llm-task` 工具，或
- 不依賴巢狀 `openclaw.invoke` 呼叫的 Lobster 步驟。

獨立版 Lobster 命令列介面範例：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "根據輸入的電子郵件，傳回意圖與草稿。",
  "thinking": "low",
  "input": {
    "subject": "你好",
    "body": "你能幫忙嗎？"
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

- **僅限 JSON**：模型會收到只傳回 JSON 值的指示，不得包含程式碼
  圍欄或評論。
- **無工具**：底層執行已停用工具，因此模型無法在
  任務執行途中向外呼叫。
- 除非使用 `schema` 驗證輸出，否則應將其視為不受信任。
- 在任何使用此輸出且會產生副作用的步驟（傳送、發布、執行）之前
  加入核准程序。

## 相關內容

- [推理層級](/zh-TW/tools/thinking)
- [子代理程式](/zh-TW/tools/subagents)
- [斜線命令](/zh-TW/tools/slash-commands)
