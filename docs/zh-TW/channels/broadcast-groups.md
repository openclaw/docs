---
read_when:
    - 設定廣播群組
    - 偵錯 WhatsApp 中的多代理回覆
sidebarTitle: Broadcast groups
status: experimental
summary: 將 WhatsApp 訊息廣播給多個代理程式
title: 廣播群組
x-i18n:
    generated_at: "2026-04-30T02:45:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0de4ccc85bf79e2ceb1dddd60db067309b15b7f876c92e7d591ff0b4b4315ec
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**狀態：** 實驗性。已於 2026.1.9 新增。
</Note>

## 概覽

廣播群組可讓多個代理同時處理並回應同一則訊息。這讓你能建立專門化的代理團隊，在單一 WhatsApp 群組或私訊中協同工作，而且全都使用同一個電話號碼。

目前範圍：**僅限 WhatsApp**（網頁通道）。

廣播群組會在通道允許清單與群組啟用規則之後評估。在 WhatsApp 群組中，這表示當 OpenClaw 通常會回覆時就會發生廣播（例如：提及時，取決於你的群組設定）。

## 使用案例

<AccordionGroup>
  <Accordion title="1. Specialized agent teams">
    部署多個具備原子化、聚焦職責的代理：

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    每個代理都會處理同一則訊息，並提供其專門觀點。

  </Accordion>
  <Accordion title="2. Multi-language support">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Quality assurance workflows">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Task automation">
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

新增頂層 `broadcast` 區段（與 `bindings` 並列）。鍵是 WhatsApp 對等端 ID：

- 群組聊天：群組 JID（例如 `120363403215116621@g.us`）
- 私訊：E.164 電話號碼（例如 `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果：** 當 OpenClaw 會在此聊天中回覆時，它會執行全部三個代理。

### 處理策略

控制代理如何處理訊息：

<Tabs>
  <Tab title="parallel (default)">
    所有代理同時處理：

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
    代理依序處理（一個代理會等待前一個完成）：

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
  <Step title="Incoming message arrives">
    WhatsApp 群組或私訊訊息抵達。
  </Step>
  <Step title="Broadcast check">
    系統檢查對等端 ID 是否在 `broadcast` 中。
  </Step>
  <Step title="If in broadcast list">
    - 所有列出的代理都會處理該訊息。
    - 每個代理都有自己的工作階段鍵與隔離的情境。
    - 代理會平行處理（預設）或依序處理。

  </Step>
  <Step title="If not in broadcast list">
    套用一般路由（第一個相符的繫結）。
  </Step>
</Steps>

<Note>
廣播群組不會繞過通道允許清單或群組啟用規則（提及／命令等）。它們只會在訊息符合處理資格時，變更_哪些代理會執行_。
</Note>

### 工作階段隔離

廣播群組中的每個代理都會維持完全獨立的：

- **工作階段鍵**（`agent:alfred:whatsapp:group:120363...` 相對於 `agent:baerbel:whatsapp:group:120363...`）
- **對話歷史**（代理看不到其他代理的訊息）
- **工作區**（如有設定，則使用獨立沙箱）
- **工具存取權**（不同的允許／拒絕清單）
- **記憶／情境**（獨立的 IDENTITY.md、SOUL.md 等）
- **群組情境緩衝區**（用於情境的近期群組訊息）會依對等端共享，因此所有廣播代理在觸發時都會看到相同情境

這讓每個代理都能擁有：

- 不同個性
- 不同工具存取權（例如唯讀與可讀寫）
- 不同模型（例如 opus 與 sonnet）
- 安裝不同 Skills

### 範例：隔離的工作階段

在群組 `120363403215116621@g.us` 中，代理為 `["alfred", "baerbel"]`：

<Tabs>
  <Tab title="Alfred's context">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel's context">
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
  <Accordion title="1. Keep agents focused">
    以單一、明確的職責設計每個代理：

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **良好：** 每個代理都有一項工作。❌ **不佳：** 一個通用的「dev-helper」代理。

  </Accordion>
  <Accordion title="2. Use descriptive names">
    讓每個代理的用途清楚明瞭：

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
  <Accordion title="3. Configure different tool access">
    只提供代理所需的工具：

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Read-only
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Monitor performance">
    使用多個代理時，請考慮：

    - 使用 `"strategy": "parallel"`（預設）以提高速度
    - 將廣播群組限制為 5 到 10 個代理
    - 為較簡單的代理使用較快的模型

  </Accordion>
  <Accordion title="5. Handle failures gracefully">
    代理會獨立失敗。一個代理的錯誤不會阻擋其他代理：

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## 相容性

### 提供者

廣播群組目前可搭配：

- ✅ WhatsApp（已實作）
- 🚧 Telegram（規劃中）
- 🚧 Discord（規劃中）
- 🚧 Slack（規劃中）

### 路由

廣播群組可與現有路由並用：

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
**優先順序：** `broadcast` 優先於 `bindings`。
</Note>

## 疑難排解

<AccordionGroup>
  <Accordion title="Agents not responding">
    **檢查：**

    1. 代理 ID 存在於 `agents.list`。
    2. 對等端 ID 格式正確（例如 `120363403215116621@g.us`）。
    3. 代理不在拒絕清單中。

    **偵錯：**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Only one agent responding">
    **原因：** 對等端 ID 可能在 `bindings` 中，但不在 `broadcast` 中。

    **修正：** 新增到廣播設定，或從繫結中移除。

  </Accordion>
  <Accordion title="Performance issues">
    如果多個代理導致速度緩慢：

    - 減少每個群組的代理數量。
    - 使用較輕量的模型（使用 sonnet 而非 opus）。
    - 檢查沙箱啟動時間。

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

    **使用者傳送：** 程式碼片段。

    **回應：**

    - code-formatter：「已修正縮排並加入型別提示」
    - security-scanner：「⚠️ 第 12 行有 SQL injection 弱點」
    - test-coverage：「覆蓋率為 45%，缺少錯誤案例的測試」
    - docs-checker：「函式 `process_data` 缺少 docstring」

  </Accordion>
  <Accordion title="Example 2: Multi-language support">
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

### 設定綱要

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
  如何處理代理。`parallel` 會同時執行所有代理；`sequential` 會依陣列順序執行它們。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp 群組 JID、E.164 號碼，或其他對等端 ID。值是應處理訊息的代理 ID 陣列。
</ParamField>

## 限制

1. **代理上限：** 沒有硬性限制，但 10 個以上的代理可能會較慢。
2. **共享情境：** 代理看不到彼此的回應（這是刻意設計）。
3. **訊息排序：** 平行回應可能以任何順序抵達。
4. **速率限制：** 所有代理都會計入 WhatsApp 速率限制。

## 未來增強

規劃中的功能：

- [ ] 共享情境模式（代理可看到彼此的回應）
- [ ] 代理協調（代理可彼此發送訊號）
- [ ] 動態代理選擇（根據訊息內容選擇代理）
- [ ] 代理優先順序（某些代理會先於其他代理回應）

## 相關內容

- [通道路由](/zh-TW/channels/channel-routing)
- [群組](/zh-TW/channels/groups)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [配對](/zh-TW/channels/pairing)
- [工作階段管理](/zh-TW/concepts/session)
