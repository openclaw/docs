---
read_when:
    - 設定廣播群組
    - 偵錯 WhatsApp 中的多代理回覆
sidebarTitle: Broadcast groups
status: experimental
summary: 向多個代理程式廣播 WhatsApp 訊息
title: 廣播群組
x-i18n:
    generated_at: "2026-06-27T18:54:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a89b936322baf0fea7b487cb5354b9fad3fc021abb2970f7cd934b1880da2a0e
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**狀態：** 實驗性。於 2026.1.9 新增。
</Note>

## 概觀

廣播群組讓多個代理程式能同時處理並回應同一則訊息。這讓你可以建立專門化的代理程式團隊，在單一 WhatsApp 群組或私訊中共同運作，而且全都使用同一個電話號碼。

目前範圍：**僅 WhatsApp**（網頁通道）。

廣播群組會在通道允許清單與群組啟用規則之後評估。在 WhatsApp 群組中，這表示當 OpenClaw 通常會回覆時就會發生廣播（例如：被提及時，取決於你的群組設定）。

## 使用案例

<AccordionGroup>
  <Accordion title="1. 專門化代理程式團隊">
    部署多個具有原子化、聚焦職責的代理程式：

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    每個代理程式都會處理同一則訊息，並提供其專門化觀點。

  </Accordion>
  <Accordion title="2. 多語言支援">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. 品質保證工作流程">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. 任務自動化">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## 設定

### 基本設定

新增最上層的 `broadcast` 區段（放在 `bindings` 旁）。鍵是 WhatsApp 對等端 ID：

- 群組聊天：群組 JID（例如 `120363403215116621@g.us`）
- 私訊：E.164 電話號碼（例如 `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果：** 當 OpenClaw 會在此聊天中回覆時，它會執行全部三個代理程式。

### 處理策略

控制代理程式如何處理訊息：

<Tabs>
  <Tab title="parallel（預設）">
    所有代理程式同時處理：

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    代理程式依序處理（一個會等待前一個完成）：

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

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
  <Step title="收到傳入訊息">
    收到 WhatsApp 群組或私訊訊息。
  </Step>
  <Step title="路由與准入">
    OpenClaw 會套用通道允許清單、群組啟用規則，以及已設定的 ACP 綁定擁有權。
  </Step>
  <Step title="廣播檢查">
    如果沒有已設定的 ACP 綁定擁有該路由，OpenClaw 會檢查對等端 ID 是否在 `broadcast` 中。
  </Step>
  <Step title="如果套用廣播">
    - 所有列出的代理程式都會處理該訊息。
    - 每個代理程式都有自己的工作階段金鑰與隔離的脈絡。
    - 代理程式會平行（預設）或依序處理。

  </Step>
  <Step title="如果未套用廣播">
    OpenClaw 會分派一般路由，或在路由期間選取的已設定 ACP 工作階段路由。
  </Step>
</Steps>

<Note>
廣播群組不會繞過通道允許清單或群組啟用規則（提及/命令等）。它們只會在訊息符合處理資格時，改變_哪些代理程式會執行_。
</Note>

### 工作階段隔離

廣播群組中的每個代理程式都會維持完全分離的：

- **工作階段金鑰**（`agent:alfred:whatsapp:group:120363...` 與 `agent:baerbel:whatsapp:group:120363...`）
- **對話歷史**（代理程式不會看到其他代理程式的訊息）
- **工作區**（若已設定，則使用不同的沙箱）
- **工具存取**（不同的允許/拒絕清單）
- **記憶/脈絡**（不同的 IDENTITY.md、SOUL.md 等）
- **群組脈絡緩衝區**（用於脈絡的近期群組訊息）會按對等端共享，因此所有廣播代理程式在觸發時都會看到相同脈絡

這讓每個代理程式可以有：

- 不同個性
- 不同工具存取權（例如唯讀與讀寫）
- 不同模型（例如 opus 與 sonnet）
- 安裝不同 Skills

### 範例：隔離的工作階段

在群組 `120363403215116621@g.us` 中，代理程式為 `["alfred", "baerbel"]`：

<Tabs>
  <Tab title="Alfred 的脈絡">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel 的脈絡">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## 最佳實務

<AccordionGroup>
  <Accordion title="1. 讓代理程式保持聚焦">
    為每個代理程式設計單一、清楚的職責：

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **良好：** 每個代理程式都有一項工作。❌ **不佳：** 一個通用的「dev-helper」代理程式。

  </Accordion>
  <Accordion title="2. 使用描述性名稱">
    清楚表達每個代理程式的用途：

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. 設定不同工具存取權">
    只給代理程式所需的工具：

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` 是唯讀。`fixer` 可以讀取與寫入。

  </Accordion>
  <Accordion title="4. 監控效能">
    使用許多代理程式時，請考慮：

    - 使用 `"strategy": "parallel"`（預設）以提升速度
    - 將廣播群組限制為 5-10 個代理程式
    - 對較簡單的代理程式使用較快的模型

  </Accordion>
  <Accordion title="5. 優雅地處理失敗">
    代理程式會獨立失敗。一個代理程式的錯誤不會阻擋其他代理程式：

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## 相容性

### 提供者

廣播群組目前可與下列項目搭配使用：

- ✅ WhatsApp（已實作）
- 🚧 Telegram（規劃中）
- 🚧 Discord（規劃中）
- 🚧 Slack（規劃中）

### 路由

廣播群組可與既有路由並行運作：

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

- `GROUP_A`：只有 alfred 會回應（一般路由）。
- `GROUP_B`：agent1 和 agent2 都會回應（廣播）。

<Note>
**優先順序：** `broadcast` 優先於一般路由綁定。已設定的 ACP 綁定（`bindings[].type="acp"`）是排他的：當其中一個符合時，OpenClaw 會分派到已設定的 ACP 工作階段，而不是扇出廣播。
</Note>

## 疑難排解

<AccordionGroup>
  <Accordion title="代理程式沒有回應">
    **檢查：**

    1. 代理程式 ID 存在於 `agents.list`。
    2. 對等端 ID 格式正確（例如 `120363403215116621@g.us`）。
    3. 代理程式不在拒絕清單中。

    **偵錯：**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="只有一個代理程式回應">
    **原因：** 對等端 ID 可能位於一般路由綁定中但不在 `broadcast`，或可能符合排他的已設定 ACP 綁定。

    **修正：** 將一般路由綁定的對等端加入廣播設定，或如果想要扇出廣播，移除/變更已設定的 ACP 綁定。

  </Accordion>
  <Accordion title="效能問題">
    如果使用許多代理程式時速度緩慢：

    - 減少每個群組的代理程式數量。
    - 使用較輕量的模型（使用 sonnet 而不是 opus）。
    - 檢查沙箱啟動時間。

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

    **使用者傳送：** 程式碼片段。

    **回應：**

    - code-formatter：「已修正縮排並新增型別提示」
    - security-scanner：「⚠️ 第 12 行有 SQL 注入弱點」
    - test-coverage：「覆蓋率為 45%，缺少錯誤案例測試」
    - docs-checker：「函式 `process_data` 缺少 docstring」

  </Accordion>
  <Accordion title="範例 2：多語言支援">
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
  如何處理代理程式。`parallel` 會同時執行所有代理程式；`sequential` 會依陣列順序執行。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp 群組 JID、E.164 號碼，或其他對等端 ID。值是應該處理訊息的代理程式 ID 陣列。
</ParamField>

## 限制

1. **代理程式上限：** 沒有硬性限制，但 10 個以上代理程式可能會變慢。
2. **共享脈絡：** 代理程式看不到彼此的回應（這是設計使然）。
3. **訊息順序：** 平行回應可能會以任何順序抵達。
4. **速率限制：** 所有代理程式都會計入 WhatsApp 速率限制。

## 未來增強功能

規劃中的功能：

- [ ] 共享脈絡模式（代理程式可看到彼此的回應）
- [ ] 代理程式協調（代理程式可互相傳送訊號）
- [ ] 動態代理程式選擇（根據訊息內容選擇代理程式）
- [ ] 代理程式優先順序（某些代理程式會先於其他代理程式回應）

## 相關

- [頻道路由](/zh-TW/channels/channel-routing)
- [群組](/zh-TW/channels/groups)
- [多代理程式沙盒工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [配對](/zh-TW/channels/pairing)
- [工作階段管理](/zh-TW/concepts/session)
