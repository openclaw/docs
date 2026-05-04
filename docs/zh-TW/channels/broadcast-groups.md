---
read_when:
    - 設定廣播群組
    - 在 WhatsApp 中偵錯多代理回覆
sidebarTitle: Broadcast groups
status: experimental
summary: 向多個代理廣播 WhatsApp 訊息
title: 廣播群組
x-i18n:
    generated_at: "2026-05-04T02:21:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab43d3c3ffddb360340469433d74a380fbab98e662b2463a54f62eafc375b55
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**狀態：** 實驗性。於 2026.1.9 新增。
</Note>

## 概覽

廣播群組可讓多個代理程式同時處理並回應同一則訊息。這讓你可以建立專門化的代理程式團隊，在單一 WhatsApp 群組或私訊中共同運作，且全部使用同一個電話號碼。

目前範圍：**僅限 WhatsApp**（web 通道）。

廣播群組會在通道允許清單和群組啟用規則之後評估。在 WhatsApp 群組中，這表示當 OpenClaw 通常會回覆時就會發生廣播（例如：被提及時，視你的群組設定而定）。

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

    每個代理程式都會處理同一則訊息，並提供其專門視角。

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
  <Accordion title="4. 工作自動化">
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
    收到一則 WhatsApp 群組或私訊訊息。
  </Step>
  <Step title="廣播檢查">
    系統會檢查對等端 ID 是否在 `broadcast` 中。
  </Step>
  <Step title="如果在廣播清單中">
    - 所有列出的代理程式都會處理該訊息。
    - 每個代理程式都有自己的工作階段鍵和隔離的內容脈絡。
    - 代理程式會平行（預設）或依序處理。

  </Step>
  <Step title="如果不在廣播清單中">
    套用一般路由（第一個符合的繫結）。
  </Step>
</Steps>

<Note>
廣播群組不會繞過通道允許清單或群組啟用規則（提及／命令等）。它們只會在訊息符合處理資格時，變更_哪些代理程式會執行_。
</Note>

### 工作階段隔離

廣播群組中的每個代理程式都會維持完全分離的：

- **工作階段鍵**（`agent:alfred:whatsapp:group:120363...` 與 `agent:baerbel:whatsapp:group:120363...`）
- **對話歷史**（代理程式不會看到其他代理程式的訊息）
- **工作區**（若有設定，則為分離的沙箱）
- **工具存取權**（不同的允許／拒絕清單）
- **記憶／內容脈絡**（分離的 IDENTITY.md、SOUL.md 等）
- **群組內容脈絡緩衝區**（用於內容脈絡的近期群組訊息）會依對等端共用，因此所有廣播代理程式在觸發時都會看到相同的內容脈絡

這讓每個代理程式可以有：

- 不同個性
- 不同工具存取權（例如唯讀與讀寫）
- 不同模型（例如 opus 與 sonnet）
- 安裝不同 Skills

### 範例：隔離的工作階段

在群組 `120363403215116621@g.us` 中使用代理程式 `["alfred", "baerbel"]`：

<Tabs>
  <Tab title="Alfred 的內容脈絡">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel 的內容脈絡">
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
    為每個代理程式設計單一且明確的職責：

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
    讓每個代理程式的用途清楚明確：

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
  <Accordion title="3. 設定不同的工具存取權">
    只授予代理程式所需的工具：

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

    `reviewer` 是唯讀。`fixer` 可以讀取和寫入。

  </Accordion>
  <Accordion title="4. 監控效能">
    使用許多代理程式時，請考慮：

    - 使用 `"strategy": "parallel"`（預設）以提升速度
    - 將廣播群組限制為 5 到 10 個代理程式
    - 為較簡單的代理程式使用較快的模型

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

廣播群組目前可與以下項目搭配使用：

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
    **原因：** 對等端 ID 可能在 `bindings` 中，但不在 `broadcast` 中。

    **修正：** 加入廣播設定，或從繫結中移除。

  </Accordion>
  <Accordion title="效能問題">
    如果在許多代理程式下變慢：

    - 減少每個群組的代理程式數量。
    - 使用較輕量的模型（使用 sonnet 而非 opus）。
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
    - test-coverage：「覆蓋率為 45%，缺少錯誤案例的測試」
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
  WhatsApp 群組 JID、E.164 號碼或其他對等端 ID。值是應處理訊息的代理程式 ID 陣列。
</ParamField>

## 限制

1. **代理程式上限：** 沒有硬性限制，但 10 個以上代理程式可能會變慢。
2. **共享內容脈絡：** 代理程式不會看到彼此的回應（這是刻意設計）。
3. **訊息順序：** 平行回應可能以任何順序抵達。
4. **速率限制：** 所有代理程式都會計入 WhatsApp 速率限制。

## 未來增強功能

規劃中的功能：

- [ ] 共享內容脈絡模式（代理程式會看到彼此的回應）
- [ ] 代理程式協調（代理程式可以互相發出訊號）
- [ ] 動態代理程式選擇（根據訊息內容選擇代理程式）
- [ ] 代理程式優先順序（某些代理程式先於其他代理程式回應）

## 相關內容

- [頻道路由](/zh-TW/channels/channel-routing)
- [群組](/zh-TW/channels/groups)
- [多代理沙盒工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [配對](/zh-TW/channels/pairing)
- [工作階段管理](/zh-TW/concepts/session)
