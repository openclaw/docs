---
read_when:
    - 設定廣播群組
    - 偵錯 WhatsApp 中的多代理回覆
sidebarTitle: Broadcast groups
status: experimental
summary: 向多個代理廣播 WhatsApp 訊息
title: 廣播群組
x-i18n:
    generated_at: "2026-07-22T10:25:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a468e4c65d2cc89bda24e8e599f8a45015e3f77f1073612b105daed8877c0ff9
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**狀態：** 實驗性功能。於 2026.1.9 新增。僅限 WhatsApp（網頁頻道）。
</Note>

## 概覽

廣播群組會讓**多個代理程式**處理同一則傳入訊息。每個代理程式都會在各自隔離的工作階段中處理訊息並發布自己的回覆，因此單一 WhatsApp 號碼可在一個群組聊天或私訊中容納一組專門化代理程式團隊。

廣播群組會在頻道允許清單與群組啟用規則之後評估。在 WhatsApp 群組中，當 OpenClaw 一般情況下會回覆時（例如：被提及時，視你的群組設定而定），就會進行廣播。它們只會變更**要執行哪些代理程式**，絕不會改變訊息是否符合處理資格。

即時 WhatsApp QA 通道包含 `whatsapp-broadcast-group-fanout`，用於驗證一則提及代理程式的群組訊息可讓兩個已設定的代理程式產生不同且可見的回覆。

## 設定

### 基本設定

新增頂層 `broadcast` 區段（與 `bindings` 並列）。鍵是 WhatsApp 對端 ID，值是代理程式 ID 陣列：

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

列出的每個代理程式 ID 都必須存在於 `agents.entries` 中：設定驗證會回報未知 ID，而執行階段會略過這些 ID 並發出 `Broadcast agent <id> not found in agents.entries; skipping` 警告。

### 處理策略

`broadcast.strategy` 設定代理程式處理訊息的方式：

| 策略                 | 行為                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `parallel`（預設） | 所有代理程式同時處理；回覆抵達順序不固定。                            |
| `sequential`         | 代理程式依陣列順序處理；每個代理程式都會等待前一個完成。              |

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
  <Step title="傳入訊息抵達">
    WhatsApp 群組或私訊訊息抵達。
  </Step>
  <Step title="路由與准入">
    OpenClaw 套用頻道允許清單、群組啟用規則，以及已設定的 ACP 繫結擁有權。
  </Step>
  <Step title="廣播檢查">
    如果沒有已設定的 ACP 繫結擁有該路由，OpenClaw 會檢查對端 ID 是否位於 `broadcast` 中。
  </Step>
  <Step title="如果套用廣播">
    - 所有列出的代理程式都會處理訊息。
    - 每個代理程式都有自己的工作階段金鑰與隔離的情境。
    - 代理程式會平行處理（預設）或循序處理。
    - 音訊附件會在分派前轉錄一次，因此代理程式會共用同一份逐字稿，而不是分別呼叫 STT。

  </Step>
  <Step title="如果不套用廣播">
    OpenClaw 會分派一般路由，或分派路由期間選取的已設定 ACP 工作階段路由。
  </Step>
</Steps>

<Note>
廣播群組不會略過頻道允許清單或群組啟用規則（提及／命令等）。它們只會在訊息符合處理資格時，變更_要執行哪些代理程式_。
</Note>

### 工作階段隔離

廣播群組中的每個代理程式都會維持完全獨立的：

- **工作階段金鑰**（`agent:alfred:whatsapp:group:120363...` 與 `agent:baerbel:whatsapp:group:120363...`）
- **對話歷程**（代理程式看不到其他代理程式的回覆）
- **工作區**（若有設定，則使用個別沙箱）
- **工具存取權**（不同的允許／拒絕清單）
- **記憶／情境**（個別的 `IDENTITY.md`、`SOUL.md` 等）

有一項刻意共用的例外：**群組情境緩衝區**（用於提供情境的近期群組訊息）會依對端共用，因此所有廣播代理程式在觸發時都會看到相同的情境。分派完成後，該緩衝區會統一清除一次。

這讓每個代理程式都能擁有不同的個性、模型、Skills 與工具存取權（例如唯讀與讀寫）。

### 範例：隔離的工作階段

在具有代理程式 `["alfred", "baerbel"]` 的群組 `120363403215116621@g.us` 中：

<Tabs>
  <Tab title="Alfred 的情境">
    ```text
    工作階段：agent:alfred:whatsapp:group:120363403215116621@g.us
    歷程：[使用者訊息、alfred 先前的回覆]
    工作區：~/openclaw-alfred/
    工具：讀取、寫入、執行
    ```
  </Tab>
  <Tab title="Baerbel 的情境">
    ```text
    工作階段：agent:baerbel:whatsapp:group:120363403215116621@g.us
    歷程：[使用者訊息、baerbel 先前的回覆]
    工作區：~/openclaw-baerbel/
    工具：僅限讀取
    ```
  </Tab>
</Tabs>

## 使用案例

- **專門化代理程式團隊**：在開發群組中，`code-reviewer`、`security-auditor`、`test-generator` 和 `docs-checker` 各自從不同角度回答同一則訊息。
- **多語言支援**：在一個支援聊天中，由 `support-en`、`support-de`、`support-es` 使用各自的語言回覆。
- **品質保證**：`support-agent` 負責回答，而 `qa-agent` 負責審查，且僅在發現問題時回覆。
- **工作自動化**：`task-tracker`、`time-logger` 和 `report-generator` 都會接收同一則狀態更新。

## 最佳實務

<AccordionGroup>
  <Accordion title="1. 讓代理程式保持專注">
    為每個代理程式指派單一且明確的職責（`formatter`、`linter`、`tester`），而不是使用一個通用的 "dev-helper" 代理程式。
  </Accordion>
  <Accordion title="2. 使用描述清楚的 ID 與名稱">
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
  <Accordion title="3. 設定不同的工具存取權">
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
  <Accordion title="4. 監控效能">
    使用許多代理程式時，請優先使用 `"strategy": "parallel"`（預設），將每個廣播群組限制為少量代理程式，並讓較簡單的代理程式使用更快的模型。
  </Accordion>
  <Accordion title="5. 失敗會維持隔離">
    各代理程式彼此獨立失敗。單一代理程式的錯誤會被記錄（`Broadcast agent <id> failed: ...`），且不會阻擋其他代理程式。
  </Accordion>
</AccordionGroup>

## 相容性

### 提供者

廣播群組目前僅針對 WhatsApp（網頁頻道）實作。其他頻道會忽略 `broadcast` 設定。

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
**優先順序：** `broadcast` 的優先順序高於一般路由繫結。已設定的 ACP 繫結（`bindings[].type="acp"`）具有排他性：當其中一個符合時，OpenClaw 會分派至已設定的 ACP 工作階段，而不會進行分派廣播。
</Note>

## 疑難排解

<AccordionGroup>
  <Accordion title="代理程式沒有回應">
    **檢查：**

    1. 代理程式 ID 存在於 `agents.entries` 中（設定驗證會拒絕未知 ID）。
    2. 對端 ID 格式正確（群組 JID，例如 `120363403215116621@g.us`；私訊則使用 E.164，例如 `+15551234567`）。
    3. 訊息已通過一般門控（提及／啟用規則仍然適用）。

    **偵錯：**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    成功的分派會記錄 `Broadcasting message to <n> agents (<strategy>)`。

  </Accordion>
  <Accordion title="只有一個代理程式回應">
    **原因：** 對端 ID 可能位於一般路由繫結中，但不在 `broadcast` 中；或者它可能符合具有排他性的已設定 ACP 繫結。

    **修正：** 將一般路由所繫結的對端新增至廣播設定；若需要分派廣播，則移除或變更已設定的 ACP 繫結。

  </Accordion>
  <Accordion title="效能問題">
    如果使用許多代理程式時速度緩慢：請減少每個群組的代理程式數量、使用較輕量的模型，並檢查沙箱啟動時間。
  </Accordion>
</AccordionGroup>

## 範例

<AccordionGroup>
  <Accordion title="範例 1：程式碼審查團隊">
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

    群組中的一段程式碼會產生四則回覆：格式修正、安全性發現、涵蓋率缺口，以及文件小問題。

  </Accordion>
  <Accordion title="範例 2：多語言流水線">
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
  WhatsApp 群組 JID 或 E.164 電話號碼。值是代理程式 ID 陣列，其中所有代理程式都應處理來自該對端的訊息。
</ParamField>

## 限制

1. **代理程式數量上限：**沒有硬性限制，但代理程式數量較多（10 個以上）時，執行速度可能會變慢。
2. **共用情境：**代理程式不會看到彼此的回應（這是刻意的設計）。
3. **訊息順序：**平行回應可能以任何順序送達。
4. **速率限制：**所有回覆都來自同一個 WhatsApp 帳號，因此每個代理程式的回覆都會計入相同的 WhatsApp 速率限制。

## 相關內容

- [頻道路由](/zh-TW/channels/channel-routing)
- [群組](/zh-TW/channels/groups)
- [多代理程式沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [配對](/zh-TW/channels/pairing)
- [工作階段管理](/zh-TW/concepts/session)
