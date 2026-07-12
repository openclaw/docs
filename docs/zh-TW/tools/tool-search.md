---
read_when:
    - 你希望 OpenClaw 代理程式使用大型工具目錄，而不必將每個工具結構描述都加入提示詞中
    - 你希望透過單一精簡的執行階段介面，提供 OpenClaw 工具、MCP 工具與用戶端工具
    - 你正在為 OpenClaw 執行流程實作或偵錯工具探索功能
summary: 工具搜尋：透過搜尋、說明與呼叫，精簡龐大的 OpenClaw 工具目錄
title: 工具搜尋
x-i18n:
    generated_at: "2026-07-11T21:53:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

工具搜尋是 OpenClaw 代理執行階段的一項實驗性功能。它提供代理一種精簡的方式，以探索並呼叫大型工具目錄。當一次執行有許多可用工具，但模型可能只需要其中少數工具時，這項功能特別實用。

本頁說明 OpenClaw 工具搜尋。它不是 Codex 原生的工具搜尋或動態工具介面。Codex 原生程式碼模式、工具搜尋、延後載入的動態工具及巢狀工具呼叫，都是穩定的 Codex 控制框架介面，且不依賴 `tools.toolSearch`。

為 OpenClaw 執行啟用此功能時，模型預設會收到一個 `tool_search_code` 工具，以及所有結構化結果無法通過精簡橋接器、因而只能直接使用的工具。程式碼工具會在隔離的 Node 子行程中執行一小段 JavaScript 程式碼，並提供 `openclaw.tools` 橋接器：

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

目錄可包含符合目錄資格的 OpenClaw 工具、外掛工具、MCP 工具及用戶端提供的工具。模型一開始不會看到每個已收錄工具的結構描述，而是搜尋精簡描述資訊，在需要確切結構描述時查看所選工具的詳細資訊，再透過 OpenClaw 呼叫該工具。僅限直接使用的工具仍會顯示給模型，且不會加入目錄。

Codex 控制框架執行不會收到這些實驗性的 OpenClaw 工具搜尋控制項。OpenClaw 會將產品功能以動態工具形式傳遞給 Codex，而穩定的原生程式碼模式、原生工具搜尋、延後載入的動態工具及巢狀工具呼叫則由 Codex 負責。

## 單次互動如何執行

在規劃階段，OpenClaw 內嵌執行器會建立該次執行的有效目錄：

1. 解析代理、設定檔、沙箱及工作階段的有效工具政策。
2. 列出符合資格的 OpenClaw 與外掛工具。
3. 透過工作階段的 MCP 執行階段列出符合資格的 MCP 工具。
4. 加入為目前執行提供的合格用戶端工具。
5. 讓僅限直接使用的工具繼續顯示給模型，並為其餘符合目錄資格的工具建立精簡描述資訊索引。
6. 除了這些僅限直接使用的工具，也公開 OpenClaw 程式碼橋接器、結構化備援工具或精簡目錄介面。

執行階段中的每一次實際工具呼叫都會返回 OpenClaw。隔離的 Node 執行階段不會持有外掛實作、MCP 用戶端物件或機密。`openclaw.tools.call(...)` 會跨越橋接器回到閘道，並繼續套用一般的政策、核准、鉤子、記錄及結果處理。

## 模式

`tools.toolSearch` 有三種面向模型的模式：

- `code`：除了僅限直接使用的工具，也公開預設的精簡 JavaScript 橋接器 `tool_search_code`。
- `tools`：除了僅限直接使用的工具，也將 `tool_search`、`tool_describe` 及 `tool_call` 公開為一般結構化工具，供不應接收程式碼的供應商使用。
- `directory`：公開 `tool_search`、`tool_describe` 及 `tool_call`，並提供一份有數量上限的提示目錄，其中列出可用工具的名稱和說明，供應商因此能看到工具名稱，而不必看到每個完整的結構描述。OpenClaw 也能直接公開一組規模較小且有數量上限、目前互動可能使用或必須使用的工具結構描述。在此模式下，僅限直接使用的工具也會繼續顯示。

所有模式都使用相同、經政策篩選的目錄及一般 OpenClaw 執行路徑。標記為 `catalogMode: "direct-only"` 的工具會留在該目錄之外，並繼續顯示給模型。如果目前的執行階段無法啟動隔離的 Node 程式碼模式子行程，預設的 `code` 模式會在目錄壓縮前退回 `tools`。在 `directory` 模式下，OpenClaw 工具、外掛工具及 MCP 工具可壓縮至目錄之後，而用戶端提供的工具在目前執行中仍會直接顯示。若直接呼叫一個確切但隱藏的目錄名稱，系統會在執行前從同一個已授權目錄載入該工具。

所有模式皆為實驗性功能。對於較小的 OpenClaw 工具目錄，請優先直接公開工具；對於 Codex 控制框架執行，則請優先使用 Codex 原生的穩定介面。

此功能沒有獨立的來源選擇設定。啟用工具搜尋後，目錄會在一般政策篩選後包含符合目錄資格的 OpenClaw、MCP 及用戶端工具；僅限直接使用的工具則會另外保留。

## 此功能存在的原因

大型目錄很實用，但成本也很高。將每個工具結構描述都傳送給模型，會增加請求大小、拖慢規劃速度，並提高意外選錯工具的機率。

工具搜尋會改變整體形式：

- 直接工具：模型在產生第一個權杖前就會看到每個已選取的結構描述
- 工具搜尋程式碼模式：模型會看到一個精簡的程式碼工具、一份簡短的 API 契約，以及所有僅限直接使用的工具
- 工具搜尋工具模式：模型會看到三個精簡的結構化備援工具，以及所有僅限直接使用的工具
- 工具搜尋目錄模式：模型會看到有數量上限的目錄、搜尋／查看說明／呼叫控制項、一組規模較小且有數量上限的可能使用或必須使用的結構描述，以及所有僅限直接使用的工具
- 互動期間：模型可視需要載入其餘結構描述

對小型目錄而言，直接公開工具仍是正確的預設做法。當一次執行可看到許多工具時，工具搜尋的效果最佳，尤其是來自 MCP 伺服器或用戶端提供的應用程式工具。

## API

`openclaw.tools.search(query, options?)`

搜尋目前執行的有效目錄。結果精簡且安全，可放回提示內容中。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

載入一筆搜尋結果的完整中繼資料，包括確切的輸入結構描述。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

透過 OpenClaw 呼叫所選工具。

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

結構化備援模式會將相同操作公開為工具：

- `tool_search`
- `tool_describe`
- `tool_call`

目錄模式會公開：

- `tool_search`
- `tool_describe`
- `tool_call`

它也會讓用戶端提供的工具及所有僅限直接使用的工具保持直接可見，並可直接公開一組規模較小且有數量上限、目前互動可能使用或必須使用的目錄工具結構描述。若有數量上限的目錄省略了部分項目，請使用 `tool_search` 尋找。若模型直接要求使用確切但隱藏的目錄工具名稱，OpenClaw 會在一般執行前從已授權目錄載入該工具。
目錄模式的用戶端工具名稱不得與 OpenClaw、外掛或 MCP 工具名稱衝突，因為確切的延後分派會使用這些名稱。

## 執行階段邊界

程式碼橋接器會在存續時間很短的 Node 子行程中執行。子行程啟動時會啟用 Node 權限模式，使用空白環境，不授予檔案系統或網路權限，也不授予子行程或工作執行緒權限。OpenClaw 會在父行程中強制執行實際經過時間的逾時限制，並在逾時時終止子行程，包括非同步延續執行之後。

執行階段僅公開：

- `console.log`、`console.warn` 及 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

最終呼叫仍會套用一般 OpenClaw 行為：

- 工具允許及拒絕政策
- 每個代理及每個沙箱的工具限制
- 頻道／執行階段工具政策
- 核准鉤子
- 外掛 `before_tool_call` 鉤子
- 工作階段身分、記錄及遙測

## 設定

使用預設程式碼橋接器，為 OpenClaw 執行啟用工具搜尋：

```bash
openclaw config set tools.toolSearch true
```

等效的 JSON：

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

OpenClaw 執行也可改用結構化備援工具：

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

OpenClaw 執行也可改用精簡目錄介面：

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

調整程式碼模式逾時與搜尋結果數量限制（顯示的值為預設值）：

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

執行階段會將 `codeTimeoutMs` 限制在 1000-60000、將 `maxSearchLimit` 限制在 1-50，並將 `searchDefaultLimit` 限制在 1..`maxSearchLimit`。

停用此功能：

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## 提示與遙測

工具搜尋會記錄足夠的遙測資料，以便與直接公開工具進行比較：

- 傳送至控制框架的工具與提示序列化資料總位元組數
- 目錄大小與來源明細
- 搜尋、查看說明及呼叫次數
- 透過 OpenClaw 執行的最終工具呼叫
- 所選工具識別碼及來源

工作階段記錄應能用來回答：

- 模型一開始看到多少個工具結構描述
- 模型執行了多少次搜尋及查看說明操作
- 最終呼叫了哪個工具
- 結果是來自 OpenClaw、MCP 還是用戶端工具

## 端對端驗證

QA Lab 閘道情境會使用 OpenClaw 執行階段驗證兩種路徑：

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

它會建立一個含有大型工具目錄的臨時模擬外掛、啟動模擬 OpenAI 供應商，並分別以直接模式及啟用工具搜尋的模式啟動一次閘道，然後比較供應商的請求承載內容與工作階段記錄。

此迴歸測試會驗證：

1. 直接模式可呼叫模擬外掛工具。
2. 工具搜尋可呼叫相同的模擬外掛工具。
3. 直接模式會直接向供應商公開模擬外掛工具的結構描述。
4. 工具搜尋只會公開精簡橋接器，以及所有僅限直接使用的工具。
5. 對大型模擬目錄而言，工具搜尋的請求承載內容較小。
6. 工作階段記錄會顯示預期的工具呼叫次數及橋接呼叫遙測資料。

## 失敗時的行為

工具搜尋應以封閉方式失敗：

- 如果某個工具不在有效政策中，搜尋不應傳回該工具
- 如果所選工具變為不可用，`tool_call` 應失敗
- 如果政策或核准機制封鎖執行，呼叫結果應回報該封鎖，而不是略過它
- 如果程式碼橋接器無法建立隔離的執行階段，請對該部署使用 `mode: "tools"` 或停用工具搜尋

## 相關內容

- [工具與外掛](/zh-TW/tools)
- [多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [執行工具](/zh-TW/tools/exec)
- [ACP 代理設定](/zh-TW/tools/acp-agents-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
