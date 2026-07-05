---
read_when:
    - 你希望 OpenClaw 代理程式使用大型工具目錄，而不必將每個工具 schema 都加入提示中
    - 你想要透過一個精簡的執行階段介面公開 OpenClaw 工具、MCP 工具和客戶端工具
    - 你正在為 OpenClaw 執行實作或除錯工具探索功能
summary: 工具搜尋：將大型 OpenClaw 工具目錄壓縮到 search、describe 和 call 後方
title: 工具搜尋
x-i18n:
    generated_at: "2026-07-05T11:47:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa8a7f8580fe3743bfc6082ad3ab0fef848a326539131b4804e577daa05f4137
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search 是一項實驗性的 OpenClaw 代理執行階段功能。它為代理提供一種精簡方式來探索並呼叫大型工具目錄。當執行中有許多可用工具，但模型可能只需要其中少數幾個時，它很有用。

本頁記錄 OpenClaw Tool Search。它不是 Codex 原生的工具搜尋或 dynamic-tools 介面。Codex 原生程式碼模式、工具搜尋、延遲動態工具和巢狀工具呼叫是穩定的 Codex harness 介面，且不依賴 `tools.toolSearch`。

為 OpenClaw 執行啟用時，模型預設會收到一個 `tool_search_code` 工具。該工具會在隔離的 節點 子行程中執行一小段 JavaScript 主體，並透過 `openclaw.tools` 橋接：

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

目錄可以包含 OpenClaw 工具、外掛工具、MCP 工具，以及用戶端提供的工具。模型不會一開始就看到每個完整 schema。相反地，它會搜尋精簡描述項，在需要精確 schema 時描述一個選取的工具，並透過 OpenClaw 呼叫該工具。

Codex harness 執行不會收到這些實驗性的 OpenClaw Tool Search 控制項。OpenClaw 會將產品能力作為動態工具傳遞給 Codex，而 Codex 擁有穩定的原生程式碼模式、原生工具搜尋、延遲動態工具和巢狀工具呼叫。

## 一次回合如何執行

在規劃時，OpenClaw 內嵌 runner 會為此次執行建立有效目錄：

1. 解析代理、profile、sandbox 和 session 的作用中工具政策。
2. 列出符合資格的 OpenClaw 和外掛工具。
3. 透過 session MCP 執行階段列出符合資格的 MCP 工具。
4. 加入目前執行所提供且符合資格的用戶端工具。
5. 為搜尋索引精簡描述項。
6. 向模型公開 OpenClaw 程式碼橋接、結構化 fallback 工具，或精簡目錄介面。

在執行時，每個實際工具呼叫都會回到 OpenClaw。隔離的 節點 執行階段不持有外掛實作、MCP 用戶端物件或祕密。`openclaw.tools.call(...)` 會跨過橋接回到 閘道，在那裡仍會套用一般的政策、核准、hook、記錄和結果處理。

## 模式

`tools.toolSearch` 有三種面向模型的模式：

- `code`：公開 `tool_search_code`，預設的精簡 JavaScript 橋接。
- `tools`：將 `tool_search`、`tool_describe` 和 `tool_call` 作為純結構化工具公開，適用於不應接收程式碼的提供者。
- `directory`：公開 `tool_search`、`tool_describe` 和 `tool_call`，並提供可用工具名稱與描述的有界 prompt 目錄，適用於應看見工具名稱但不應看見每個完整 schema 的提供者。OpenClaw 也可以直接為目前回合公開一小組有界的可能或必要工具 schema。

所有模式都使用相同的經政策篩選目錄和一般 OpenClaw 執行路徑。如果目前執行階段無法啟動隔離的 節點 程式碼模式子行程，預設的 `code` 模式會在目錄壓縮前 fallback 到 `tools`。在 `directory` 模式中，用戶端提供的工具會在目前執行中保持直接可見，而 OpenClaw 工具、外掛工具和 MCP 工具可以壓縮到目錄目錄後方。對精確隱藏目錄名稱的直接呼叫，會在執行前從同一個已授權目錄中 hydration。

所有模式都是實驗性的。小型 OpenClaw 工具目錄應優先使用直接工具公開，而 Codex harness 執行應優先使用 Codex 原生穩定介面。

沒有個別的來源選擇設定。啟用 Tool Search 時，目錄會在一般政策篩選後包含符合資格的 OpenClaw、MCP 和用戶端工具。

## 這為什麼存在

大型目錄很有用，但成本高。將每個工具 schema 傳送給模型會讓請求變大、拖慢規劃，並增加意外選擇工具的機率。

Tool Search 會改變形態：

- 直接工具：模型在第一個 token 前會看到每個選定的 schema
- Tool Search 程式碼模式：模型會看到一個精簡程式碼工具和一段短 API 合約
- Tool Search 工具模式：模型會看到三個精簡的結構化 fallback 工具
- Tool Search 目錄模式：模型會看到有界目錄加上搜尋/描述/呼叫控制項，以及一小組有界的可能或必要 schema
- 回合期間：模型可視需要載入其餘 schema

直接工具公開仍是小型目錄的正確預設。當一次執行可看見許多工具時，尤其是來自 MCP 伺服器或用戶端提供的應用程式工具時，Tool Search 最合適。

## API

`openclaw.tools.search(query, options?)`

搜尋目前執行的有效目錄。結果是精簡的，且可安全放回 prompt context。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

載入一個搜尋結果的完整中繼資料，包括精確的輸入 schema。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

透過 OpenClaw 呼叫選定的工具。

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

結構化 fallback 模式會將相同操作公開為工具：

- `tool_search`
- `tool_describe`
- `tool_call`

目錄模式公開：

- `tool_search`
- `tool_describe`
- `tool_call`

它也會保持用戶端提供的工具直接可見，並可能為目前回合直接公開一小組有界的可能或必要目錄工具 schema。如果有界目錄省略項目，請使用 `tool_search` 尋找它們。如果模型直接要求精確的隱藏目錄工具名稱，OpenClaw 會在一般執行前從已授權目錄中 hydration。
目錄模式的用戶端工具名稱不得與 OpenClaw、外掛或 MCP 工具名稱衝突，因為精確的延遲 dispatch 會使用這些名稱。

## 執行階段邊界

程式碼橋接會在短生命週期的 節點 子行程中執行。子行程啟動時會啟用 節點 權限模式，使用空環境，沒有檔案系統或網路授權，也沒有子行程或 worker 授權。OpenClaw 會強制執行父行程 wall-clock timeout，並在逾時時終止子行程，包括非同步延續之後。

執行階段只公開：

- `console.log`、`console.warn` 和 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

一般 OpenClaw 行為仍會套用至最終呼叫：

- 工具允許與拒絕政策
- 每代理和每 sandbox 的工具限制
- channel/執行階段工具政策
- 核准 hook
- 外掛 `before_tool_call` hook
- session 身分、記錄和遙測

## 設定

使用預設程式碼橋接為 OpenClaw 執行啟用 Tool Search：

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

改為對 OpenClaw 執行使用結構化 fallback 工具：

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

調整程式碼模式 timeout 和搜尋結果限制（顯示值為預設值）：

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

執行階段會將 `codeTimeoutMs` 夾限在 1000-60000、`maxSearchLimit` 夾限在 1-50，並將 `searchDefaultLimit` 夾限在 1..`maxSearchLimit`。

停用它：

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt 和遙測

Tool Search 會記錄足夠的遙測，以便與直接工具公開比較：

- 傳送到 harness 的序列化工具與 prompt 總位元組數
- 目錄大小和來源細分
- 搜尋、描述和呼叫次數
- 透過 OpenClaw 執行的最終工具呼叫
- 選定的工具 ID 和來源

Session 記錄應能回答：

- 模型一開始看到多少工具 schema
- 它執行了多少搜尋和描述操作
- 呼叫了哪個最終工具
- 結果是來自 OpenClaw、MCP，還是用戶端工具

## E2E 驗證

QA Lab 閘道 場景會以 OpenClaw 執行階段證明兩條路徑：

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

它會建立一個帶有大型工具目錄的暫時假外掛，啟動模擬 OpenAI 提供者，分別以直接模式和啟用 Tool Search 的模式啟動一次 閘道，然後比較提供者請求 payload 和 session 記錄。

迴歸證明：

1. 直接模式可以呼叫假外掛工具。
2. Tool Search 可以呼叫同一個假外掛工具。
3. 直接模式會直接向提供者公開假外掛工具 schema。
4. Tool Search 只公開精簡橋接。
5. 對於大型假目錄，Tool Search 請求 payload 較小。
6. Session 記錄會顯示預期的工具呼叫次數和橋接呼叫遙測。

## 失敗行為

Tool Search 應 fail closed：

- 如果工具不在有效政策中，搜尋不應傳回它
- 如果選定的工具變成不可用，`tool_call` 應失敗
- 如果政策或核准阻止執行，呼叫結果應回報該阻擋，而不是繞過它
- 如果程式碼橋接無法建立隔離執行階段，請使用 `mode: "tools"`，或對該部署停用 Tool Search

## 相關

- [工具和外掛](/zh-TW/tools)
- [多代理 sandbox 和工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [Exec 工具](/zh-TW/tools/exec)
- [ACP 代理設定](/zh-TW/tools/acp-agents-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
