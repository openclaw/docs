---
read_when:
    - 設定廣播群組
    - 偵錯 WhatsApp 中的多代理回覆
sidebarTitle: Broadcast groups
status: experimental
summary: 向多個代理廣播 WhatsApp 訊息
title: 廣播群組
x-i18n:
    generated_at: "2026-07-11T21:07:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**狀態：** 實驗性功能。於 2026.1.9 新增。僅適用於 WhatsApp（網頁頻道）。
</Note>

## 概覽

廣播群組會針對同一則傳入訊息執行**多個代理程式**。每個代理程式都會在各自隔離的工作階段中處理訊息並發布自己的回覆，因此一個 WhatsApp 號碼可以在單一群組聊天或私訊中承載一組專業化代理程式團隊。

廣播群組會在頻道允許清單與群組啟用規則之後進行判定。在 WhatsApp 群組中，當 OpenClaw 通常會回覆時便會進行廣播（例如：依據你的群組設定，在被提及時）。廣播只會變更**執行哪些代理程式**，絕不會改變訊息是否符合處理資格。

即時 WhatsApp QA 流程包含 `whatsapp-broadcast-group-fanout`，用來驗證群組中一則提及訊息能否讓兩個已設定的代理程式分別產生不同且可見的回覆。

## 設定

### 基本設定

新增頂層 `broadcast` 區段（與 `bindings` 同層）。鍵是 WhatsApp 對等端 ID，值是代理程式 ID 陣列：

- 群組聊天：群組 JID（例如 `120363403215116621@g.us`）
- 私訊：傳送者的 E.164 電話號碼（例如 `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果：** 當 OpenClaw 會在此聊天中回覆時，它會執行全部三個代理程式。

列出的每個代理程式 ID 都必須存在於 `agents.list` 中：設定驗證會回報未知 ID，而執行階段會略過這些 ID，並顯示 `Broadcast agent <id> not found in agents.list; skipping` 警告。

### 處理策略

`broadcast.strategy` 設定代理程式處理訊息的方式：

| 策略                 | 行為                                                       |
| -------------------- | ---------------------------------------------------------- |
| `parallel`（預設）   | 所有代理程式同時處理；回覆可能以任意順序送達。             |
| `sequential`         | 代理程式依陣列順序處理；每個代理程式會等待前一個完成。     |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### 完整範例

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## 運作方式

### 訊息流程

<Steps>
  <Step title="Incoming message arrives">
    一則 WhatsApp 群組或私訊訊息送達。
  </Step>
  <Step title="Route and admission">
    OpenClaw 會套用頻道允許清單、群組啟用規則，以及已設定的 ACP 綁定擁有權。
  </Step>
  <Step title="Broadcast check">
    如果沒有已設定的 ACP 綁定擁有該路由，OpenClaw 會檢查對等端 ID 是否位於 `broadcast` 中。
  </Step>
  <Step title="If broadcast applies">
    - 所有列出的代理程式都會處理訊息。
    - 每個代理程式都有自己的工作階段金鑰與隔離的情境。
    - 代理程式會平行（預設）或依序處理。
    - 音訊附件會在扇出前轉錄一次，讓代理程式共用同一份轉錄內容，而不必分別進行 STT 呼叫。

  </Step>
  <Step title="If broadcast does not apply">
    OpenClaw 會分派一般路由，或分派路由期間選定的已設定 ACP 工作階段路由。
  </Step>
</Steps>

<Note>
廣播群組不會繞過頻道允許清單或群組啟用規則（提及、命令等）。當訊息符合處理資格時，它們只會變更_執行哪些代理程式_。
</Note>

### 工作階段隔離

廣播群組中的每個代理程式都會維護完全獨立的：

- **工作階段金鑰**（`agent:alfred:whatsapp:group:120363...` 與 `agent:baerbel:whatsapp:group:120363...`）
- **對話記錄**（代理程式不會看到其他代理程式的回覆）
- **工作區**（若有設定，則使用不同的沙箱）
- **工具存取權**（不同的允許／拒絕清單）
- **記憶／情境**（分開的 `IDENTITY.md`、`SOUL.md` 等）

有一項刻意共用的例外：**群組情境緩衝區**（用於提供情境的近期群組訊息）會依對等端共用，因此所有廣播代理程式在觸發時都會看到相同的情境。扇出完成後，此緩衝區會統一清除一次。

如此一來，每個代理程式都可以具備不同的個性、模型、Skills 與工具存取權（例如唯讀與讀寫）。

### 範例：隔離的工作階段

在群組 `120363403215116621@g.us` 中使用代理程式 `["alfred", "baerbel"]`：

<Tabs>
  <Tab title="Alfred's context">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Baerbel's context">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## 使用案例

- **專業化代理程式團隊**：在開發群組中，`code-reviewer`、`security-auditor`、`test-generator` 與 `docs-checker` 各自從不同角度回覆同一則訊息。
- **多語言支援**：在同一個支援聊天中，由 `support-en`、`support-de`、`support-es` 使用各自的語言回覆。
- **品質保證**：`support-agent` 負責回答，而 `qa-agent` 負責審查，且只在發現問題時回覆。
- **工作自動化**：`task-tracker`、`time-logger` 與 `report-generator` 全部接收同一則狀態更新。

## 最佳實務

<AccordionGroup>
  <Accordion title="1. Keep agents focused">
    為每個代理程式指定單一且明確的職責（`formatter`、`linter`、`tester`），而不是使用一個通用的「開發輔助」代理程式。
  </Accordion>
  <Accordion title="2. Use descriptive ids and names">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Configure different tool access">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` 為唯讀。`fixer` 可以讀取及寫入。

  </Accordion>
  <Accordion title="4. Monitor performance">
    使用大量代理程式時，建議採用 `"strategy": "parallel"`（預設），將每個廣播群組限制在少數幾個代理程式，並為較簡單的代理程式使用速度更快的模型。
  </Accordion>
  <Accordion title="5. Failures stay isolated">
    各代理程式會獨立失敗。單一代理程式的錯誤會被記錄（`Broadcast agent <id> failed: ...`），但不會阻擋其他代理程式。
  </Accordion>
</AccordionGroup>

## 相容性

### 提供者

目前廣播群組僅實作於 WhatsApp（網頁頻道）。其他頻道會忽略 `broadcast` 設定。

### 路由

廣播群組可與現有路由搭配運作：

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`：只有 alfred 回覆（一般路由）。
- `GROUP_B`：agent1 與 agent2 都會回覆（廣播）。

<Note>
**優先順序：** `broadcast` 的優先級高於一般路由綁定。已設定的 ACP 綁定（`bindings[].type="acp"`）具有排他性：當其中一項符合時，OpenClaw 會分派至已設定的 ACP 工作階段，而不是執行扇出廣播。
</Note>

## 疑難排解

<AccordionGroup>
  <Accordion title="Agents not responding">
    **檢查：**

    1. 代理程式 ID 存在於 `agents.list` 中（設定驗證會拒絕未知 ID）。
    2. 對等端 ID 格式正確（群組 JID 如 `120363403215116621@g.us`，或私訊使用的 E.164 號碼如 `+15551234567`）。
    3. 訊息已通過一般閘門檢查（提及／啟用規則仍然適用）。

    **偵錯：**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    成功的扇出會記錄 `Broadcasting message to <n> agents (<strategy>)`。

  </Accordion>
  <Accordion title="Only one agent responding">
    **原因：** 對等端 ID 可能位於一般路由綁定中，但不在 `broadcast` 中；或者它可能符合具有排他性的已設定 ACP 綁定。

    **修正：** 將一般路由綁定的對等端新增至廣播設定；若需要扇出廣播，則移除或變更已設定的 ACP 綁定。

  </Accordion>
  <Accordion title="Performance issues">
    如果使用大量代理程式時速度緩慢：減少每個群組的代理程式數量、使用較輕量的模型，並檢查沙箱啟動時間。
  </Accordion>
</AccordionGroup>

## 範例

<AccordionGroup>
  <Accordion title="Example 1: Code review team">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    群組中的一段程式碼會產生四則回覆：格式修正、安全性發現、覆蓋率缺口，以及文件細節問題。

  </Accordion>
  <Accordion title="Example 2: Multi-language pipeline">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## API 參考

### 設定結構描述

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### 欄位

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  代理程式的處理方式。`parallel` 會同時執行所有代理程式；`sequential` 會依陣列順序執行。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp 群組 JID 或 E.164 電話號碼。值為應共同處理來自該對等端之訊息的代理程式 ID 陣列。
</ParamField>

## 限制

1. **代理程式數量上限：** 沒有硬性限制，但大量代理程式（10 個以上）可能會很慢。
2. **共用情境：** 代理程式不會看到彼此的回覆（此為刻意設計）。
3. **訊息順序：** 平行回覆可能以任意順序送達。
4. **速率限制：** 所有回覆都來自同一個 WhatsApp 帳號，因此每個代理程式的回覆都會計入相同的 WhatsApp 速率限制。

## 相關內容

- [頻道路由](/zh-TW/channels/channel-routing)
- [群組](/zh-TW/channels/groups)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [配對](/zh-TW/channels/pairing)
- [工作階段管理](/zh-TW/concepts/session)
