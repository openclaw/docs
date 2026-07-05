---
read_when:
    - 設定廣播群組
    - 偵錯 WhatsApp 中的多代理回覆
sidebarTitle: Broadcast groups
status: experimental
summary: 將 WhatsApp 訊息廣播給多個代理
title: 廣播群組
x-i18n:
    generated_at: "2026-07-05T11:01:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**狀態：** 實驗性。於 2026.1.9 新增。僅限 WhatsApp（網頁通道）。
</Note>

## 概覽

廣播群組會在同一則傳入訊息上執行**多個代理**。每個代理都會在自己的隔離工作階段中處理訊息並發布自己的回覆，因此一個 WhatsApp 號碼可以在單一群組聊天或私訊中承載一組專門化代理團隊。

廣播群組會在通道允許清單與群組啟用規則之後評估。在 WhatsApp 群組中，當 OpenClaw 通常會回覆時（例如：依你的群組設定，在被提及時）就會進行廣播。它們只會改變**哪些代理會執行**，絕不改變訊息是否符合處理資格。

即時 WhatsApp QA 跑道包含 `whatsapp-broadcast-group-fanout`，它會驗證一則被提及的群組訊息可以從兩個已設定的代理產生不同的可見回覆。

## 設定

### 基本設定

新增一個頂層 `broadcast` 區段（與 `bindings` 並列）。鍵是 WhatsApp 對等方 ID，值是代理 ID 陣列：

- 群組聊天：群組 JID（例如 `120363403215116621@g.us`）
- 私訊：傳送者 E.164 電話號碼（例如 `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果：** 當 OpenClaw 會在此聊天中回覆時，它會執行全部三個代理。

每個列出的代理 ID 都必須存在於 `agents.list`：設定驗證會回報未知 ID，執行階段會略過它們並發出 `Broadcast agent <id> not found in agents.list; skipping` 警告。

### 處理策略

`broadcast.strategy` 設定代理如何處理訊息：

| 策略                 | 行為                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `parallel`（預設）   | 所有代理同時處理；回覆會以任意順序抵達。                              |
| `sequential`         | 代理依陣列順序處理；每個代理都會等待前一個完成。                      |

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
    OpenClaw 會套用通道允許清單、群組啟用規則，以及已設定的 ACP 繫結擁有權。
  </Step>
  <Step title="廣播檢查">
    如果沒有已設定的 ACP 繫結擁有該路由，OpenClaw 會檢查對等方 ID 是否在 `broadcast` 中。
  </Step>
  <Step title="如果套用廣播">
    - 所有列出的代理都會處理該訊息。
    - 每個代理都有自己的工作階段鍵與隔離的情境。
    - 代理會平行（預設）或循序處理。
    - 音訊附件會在展開傳送前轉錄一次，因此代理會共用一份轉錄，而不是分別發出 STT 呼叫。

  </Step>
  <Step title="如果未套用廣播">
    OpenClaw 會分派一般路由，或路由期間所選的已設定 ACP 工作階段路由。
  </Step>
</Steps>

<Note>
廣播群組不會繞過通道允許清單或群組啟用規則（提及/命令等）。它們只會在訊息符合處理資格時改變_哪些代理會執行_。
</Note>

### 工作階段隔離

廣播群組中的每個代理都會維護完全分離的：

- **工作階段鍵**（`agent:alfred:whatsapp:group:120363...` 與 `agent:baerbel:whatsapp:group:120363...`）
- **對話歷史**（代理看不到其他代理的回覆）
- **工作區**（如有設定，則為分離的沙箱）
- **工具存取**（不同的允許/拒絕清單）
- **記憶/情境**（分離的 `IDENTITY.md`、`SOUL.md` 等）

有一個刻意共用的例外：**群組情境緩衝區**（用於情境的最近群組訊息）會按對等方共用，因此所有廣播代理在觸發時都會看到相同情境。它會在展開傳送完成後清除一次。

這讓每個代理都能擁有不同的人格、模型、Skills 與工具存取權（例如唯讀與可讀寫）。

### 範例：隔離的工作階段

在群組 `120363403215116621@g.us` 中搭配代理 `["alfred", "baerbel"]`：

<Tabs>
  <Tab title="Alfred 的情境">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Baerbel 的情境">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## 使用案例

- **專門化代理團隊**：在開發群組中，`code-reviewer`、`security-auditor`、`test-generator` 和 `docs-checker` 各自從自己的角度回答同一則訊息。
- **多語言支援**：一個支援聊天中有 `support-en`、`support-de`、`support-es` 以各自語言回應。
- **品質保證**：`support-agent` 回答，同時 `qa-agent` 進行審查，且只在發現問題時回應。
- **任務自動化**：`task-tracker`、`time-logger` 和 `report-generator` 都會處理同一則狀態更新。

## 最佳實務

<AccordionGroup>
  <Accordion title="1. 讓代理保持專注">
    給每個代理一個單一且明確的職責（`formatter`、`linter`、`tester`），而不是一個泛用的「dev-helper」代理。
  </Accordion>
  <Accordion title="2. 使用描述性的 ID 與名稱">
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

    `reviewer` 是唯讀。`fixer` 可以讀取與寫入。

  </Accordion>
  <Accordion title="4. 監控效能">
    若有許多代理，偏好使用 `"strategy": "parallel"`（預設）、將廣播群組限制在少數幾個代理，並為較簡單的代理使用較快的模型。
  </Accordion>
  <Accordion title="5. 失敗保持隔離">
    代理會獨立失敗。某個代理的錯誤會被記錄（`Broadcast agent <id> failed: ...`），且不會阻擋其他代理。
  </Accordion>
</AccordionGroup>

## 相容性

### 提供者

廣播群組目前僅實作於 WhatsApp（網頁通道）。其他通道會忽略 `broadcast` 設定。

### 路由

廣播群組可與現有路由並行運作：

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

- `GROUP_A`：只有 alfred 回應（一般路由）。
- `GROUP_B`：agent1 和 agent2 都會回應（廣播）。

<Note>
**優先順序：** `broadcast` 優先於一般路由繫結。已設定的 ACP 繫結（`bindings[].type="acp"`）是排他的：當其中一個符合時，OpenClaw 會分派到已設定的 ACP 工作階段，而不是展開傳送廣播。
</Note>

## 疑難排解

<AccordionGroup>
  <Accordion title="代理未回應">
    **檢查：**

    1. 代理 ID 存在於 `agents.list`（設定驗證會拒絕未知 ID）。
    2. 對等方 ID 格式正確（群組 JID 如 `120363403215116621@g.us`，或私訊使用 E.164 如 `+15551234567`）。
    3. 訊息通過一般閘門（提及/啟用規則仍然適用）。

    **偵錯：**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    成功展開傳送會記錄 `Broadcasting message to <n> agents (<strategy>)`。

  </Accordion>
  <Accordion title="只有一個代理回應">
    **原因：** 對等方 ID 可能位於一般路由繫結中但不在 `broadcast`，或可能符合排他的已設定 ACP 繫結。

    **修正：** 將一般路由繫結的對等方新增到廣播設定，或如果想要展開傳送廣播，請移除/變更已設定的 ACP 繫結。

  </Accordion>
  <Accordion title="效能問題">
    如果許多代理導致速度變慢：減少每個群組的代理數量、使用較輕量的模型，並檢查沙箱啟動時間。
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

    群組中的一段程式碼片段會產生四則回覆：格式修正、安全性發現、覆蓋率缺口，以及文件小問題。

  </Accordion>
  <Accordion title="範例 2：多語言管線">
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
  如何處理代理。`parallel` 會同時執行所有代理；`sequential` 會依陣列順序執行。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp 群組 JID 或 E.164 電話號碼。值是應全部處理來自該對等方訊息的代理 ID 陣列。
</ParamField>

## 限制

1. **代理數上限：** 沒有硬性限制，但許多代理（10+）可能會變慢。
2. **共用情境：** 代理看不到彼此的回應（依設計如此）。
3. **訊息順序：** 平行回應可能會以任意順序抵達。
4. **速率限制：** 所有回覆都來自一個 WhatsApp 帳號，因此每個代理的回覆都會計入相同的 WhatsApp 速率限制。

## 相關

- [頻道路由](/zh-TW/channels/channel-routing)
- [群組](/zh-TW/channels/groups)
- [多代理沙盒工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [配對](/zh-TW/channels/pairing)
- [工作階段管理](/zh-TW/concepts/session)
