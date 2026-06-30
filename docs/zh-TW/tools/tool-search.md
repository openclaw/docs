---
read_when:
    - 您想讓 OpenClaw 代理程式使用大型工具目錄，而不必將每個工具結構描述都加入提示詞
    - 你想要透過單一精簡的執行階段介面公開 OpenClaw 工具、MCP 工具和用戶端工具
    - 你正在實作或偵錯 OpenClaw 執行的工具探索
summary: 工具搜尋：將大型 OpenClaw 工具目錄壓縮到搜尋、描述與呼叫之後
title: 工具搜尋
x-i18n:
    generated_at: "2026-06-30T13:49:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

工具搜尋是實驗性的 OpenClaw agent 執行階段功能。它讓 agent 能以一種
精簡方式探索並呼叫大型工具目錄。當一次執行有許多可用工具，但模型可能只需要其中少數工具時，它很有用。

本頁記錄 OpenClaw 工具搜尋。它不是 Codex 原生的工具搜尋或動態工具介面。Codex 原生程式碼模式、工具搜尋、延後動態工具，以及巢狀工具呼叫，都是穩定的 Codex 執行框架介面，且不依賴 `tools.toolSearch`。

為 OpenClaw 執行啟用後，模型預設會收到一個 `tool_search_code` 工具。該工具會在隔離的節點子程序中執行一小段 JavaScript 主體，並透過 `openclaw.tools` 橋接：

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

目錄可以包含 OpenClaw 工具、外掛工具、MCP 工具，以及客戶端提供的工具。模型不會一開始就看到每個完整 schema。相反地，它會搜尋精簡描述元，在需要精確 schema 時描述一個選取的工具，並透過 OpenClaw 呼叫該工具。

Codex 執行框架執行不會收到這些實驗性的 OpenClaw 工具搜尋控制項。OpenClaw 會將產品能力作為動態工具傳給 Codex，而 Codex 擁有穩定的原生程式碼模式、原生工具搜尋、延後動態工具，以及巢狀工具呼叫。

## 一個回合如何執行

在規劃時，OpenClaw 嵌入式執行器會為該次執行建立有效目錄：

1. 解析 agent、設定檔、沙箱和工作階段的有效工具政策。
2. 列出符合資格的 OpenClaw 和外掛工具。
3. 透過工作階段 MCP 執行階段列出符合資格的 MCP 工具。
4. 加入目前執行所提供、符合資格的客戶端工具。
5. 為搜尋索引精簡描述元。
6. 將 OpenClaw 程式碼橋接、結構化後備工具，或精簡目錄介面公開給模型。

在執行時，每個實際工具呼叫都會回到 OpenClaw。隔離的節點執行階段不持有外掛實作、MCP 客戶端物件或祕密。`openclaw.tools.call(...)` 會跨越橋接回到閘道，正常的政策、核准、hook、記錄和結果處理仍然適用。

## 模式

`tools.toolSearch` 有三種面向模型的模式：

- `code`：公開 `tool_search_code`，也就是預設的精簡 JavaScript 橋接。
- `tools`：將 `tool_search`、`tool_describe` 和 `tool_call` 作為一般結構化工具公開，適用於不應接收程式碼的提供者。
- `directory`：公開 `tool_search`、`tool_describe` 和 `tool_call`，並提供可用工具名稱與描述的有界提示目錄，適用於應看到工具名稱但不應看到每個完整 schema 的提供者。OpenClaw 也可以為目前回合直接公開一小組有界的可能或必要工具 schema。

所有模式都使用相同、經政策篩選的目錄，以及正常的 OpenClaw 執行路徑。如果目前執行階段無法啟動隔離的節點程式碼模式子程序，預設的 `code` 模式會在目錄壓縮前退回到 `tools`。在 `directory` 模式中，客戶端提供的工具會在目前執行中保持直接可見，而 OpenClaw 工具、外掛工具和 MCP 工具可以壓縮到目錄目錄後方。對精確隱藏目錄名稱的直接呼叫，會先從同一個已授權目錄中水合，再執行。

所有模式都是實驗性功能。對於小型 OpenClaw 工具目錄，請優先使用直接工具公開；對於 Codex 執行框架執行，請優先使用 Codex 原生穩定介面。

沒有獨立的來源選擇設定。啟用工具搜尋時，目錄會在正常政策篩選後包含符合資格的 OpenClaw、MCP 和客戶端工具。

## 為什麼存在

大型目錄很有用，但成本高。將每個工具 schema 傳送給模型會讓請求變大、降低規劃速度，並增加意外選取工具的機率。

工具搜尋會改變形式：

- 直接工具：模型在第一個 token 前會看到每個已選取的 schema
- 工具搜尋程式碼模式：模型會看到一個精簡程式碼工具和一份簡短 API 契約
- 工具搜尋工具模式：模型會看到三個精簡的結構化後備工具
- 工具搜尋目錄模式：模型會看到有界目錄，加上搜尋/描述/呼叫控制項，以及一小組有界的可能或必要 schema
- 回合期間：模型可以視需要載入其餘 schema

對於小型目錄，直接工具公開仍然是正確的預設值。當一次執行可以看到許多工具，尤其是來自 MCP 伺服器或客戶端提供的應用程式工具時，工具搜尋最適合。

## API

`openclaw.tools.search(query, options?)`

搜尋目前執行的有效目錄。結果是精簡且安全的，可以放回提示上下文中。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

載入一個搜尋結果的完整中繼資料，包括精確的輸入 schema。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

透過 OpenClaw 呼叫選取的工具。

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

結構化後備模式會將相同操作公開為工具：

- `tool_search`
- `tool_describe`
- `tool_call`

目錄模式會公開：

- `tool_search`
- `tool_describe`
- `tool_call`

它也會讓客戶端提供的工具保持直接可見，並可能為目前回合直接公開一小組有界的可能或必要目錄工具 schema。如果有界目錄省略項目，請使用 `tool_search` 尋找它們。如果模型直接要求精確的隱藏目錄工具名稱，OpenClaw 會先從已授權目錄水合該工具，再進行正常執行。
目錄模式的客戶端工具名稱不得與 OpenClaw、外掛或 MCP 工具名稱衝突，因為精確的延後分派會使用這些名稱。

## 執行階段邊界

程式碼橋接會在短生命週期的節點子程序中執行。子程序啟動時會啟用節點權限模式、使用空環境，沒有檔案系統或網路授權，也沒有子程序或 worker 授權。OpenClaw 會強制執行父程序的牆鐘逾時，並在逾時時終止子程序，包括非同步延續之後。

執行階段只公開：

- `console.log`、`console.warn` 和 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

正常 OpenClaw 行為仍然適用於最終呼叫：

- 工具允許與拒絕政策
- 每個 agent 和每個沙箱的工具限制
- 頻道/執行階段工具政策
- 核准 hook
- 外掛 `before_tool_call` hook
- 工作階段身分、記錄和遙測

## 設定

使用預設程式碼橋接，為 OpenClaw 執行啟用工具搜尋：

```bash
openclaw config set tools.toolSearch true
```

等效 JSON：

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

改為對 OpenClaw 執行使用結構化後備工具：

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

改為對 OpenClaw 執行使用精簡目錄介面：

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

調整程式碼模式逾時和搜尋結果限制：

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

停用它：

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## 提示與遙測

工具搜尋會記錄足夠的遙測，以便與直接工具公開比較：

- 傳送到執行框架的序列化工具與提示位元組總數
- 目錄大小和來源細分
- 搜尋、描述和呼叫次數
- 透過 OpenClaw 執行的最終工具呼叫
- 已選取的工具 ID 和來源

工作階段記錄應該能回答：

- 模型一開始看到了多少工具 schema
- 它執行了多少次搜尋和描述操作
- 呼叫了哪個最終工具
- 結果是來自 OpenClaw、MCP，還是客戶端工具

## E2E 驗證

QA Lab 閘道情境會使用 OpenClaw 執行階段證明兩條路徑：

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

它會建立一個具有大型工具目錄的暫時假外掛、啟動模擬 OpenAI 提供者，分別在直接模式和啟用工具搜尋的模式中啟動一次閘道，然後比較提供者請求 payload 和工作階段記錄。

回歸會證明：

1. 直接模式可以呼叫假外掛工具。
2. 工具搜尋可以呼叫同一個假外掛工具。
3. 直接模式會將假外掛工具 schema 直接公開給提供者。
4. 工具搜尋只公開精簡橋接。
5. 對於大型假目錄，工具搜尋請求 payload 較小。
6. 工作階段記錄會顯示預期的工具呼叫計數和橋接呼叫遙測。

## 失敗行為

工具搜尋應該要失敗關閉：

- 如果工具不在有效政策中，搜尋不應傳回它
- 如果選取的工具變得不可用，`tool_call` 應失敗
- 如果政策或核准阻擋執行，呼叫結果應回報該阻擋，而不是繞過它
- 如果程式碼橋接無法建立隔離執行階段，請使用 `mode: "tools"`，或為該部署停用工具搜尋

## 相關

- [工具與外掛](/zh-TW/tools)
- [多 agent 沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [Exec 工具](/zh-TW/tools/exec)
- [ACP agents 設定](/zh-TW/tools/acp-agents-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
