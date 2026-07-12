---
read_when:
    - 你希望 OpenClaw 代理程式能使用大型工具目錄，而不必將每個工具結構描述都加入提示詞中
    - 你想要透過單一精簡的執行階段介面，公開 OpenClaw 工具、MCP 工具與用戶端工具
    - 你正在實作或偵錯 OpenClaw 執行中的工具探索功能
summary: 工具搜尋：將大型 OpenClaw 工具目錄精簡為搜尋、描述與呼叫功能
title: 工具搜尋
x-i18n:
    generated_at: "2026-07-12T14:51:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

工具搜尋是實驗性的 OpenClaw 代理執行階段功能。它為代理提供一種精簡的方式，以探索並呼叫大型工具目錄。當一次執行有許多可用工具，但模型可能只需要其中少數幾個時，此功能很有用。

本頁說明 OpenClaw 工具搜尋。這不是 Codex 原生的工具搜尋或動態工具介面。Codex 原生程式碼模式、工具搜尋、延遲動態工具及巢狀工具呼叫，都是穩定的 Codex 控制框架介面，並不依賴 `tools.toolSearch`。

為 OpenClaw 執行啟用後，模型預設會收到一個 `tool_search_code` 工具，另加任何結構化結果無法通過精簡橋接的僅限直接呼叫工具。程式碼工具會在隔離的 Node 子程序中執行一小段 JavaScript 主體，並提供 `openclaw.tools` 橋接：

```js
const hits = await openclaw.tools.search("建立 GitHub 議題");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "啟動時當機",
  body: "重現步驟...",
});
```

目錄可包含符合收錄資格的 OpenClaw 工具、外掛工具、MCP 工具，以及用戶端提供的工具。模型不會預先看到每個已收錄工具的結構描述。它會改為搜尋精簡描述資訊，在需要確切結構描述時取得一個所選工具的詳細資料，並透過 OpenClaw 呼叫該工具。僅限直接呼叫的工具仍會顯示給模型，且不會加入目錄。

Codex 控制框架執行不會收到這些實驗性的 OpenClaw 工具搜尋控制項。OpenClaw 會將產品功能以動態工具形式傳給 Codex，而穩定的原生程式碼模式、原生工具搜尋、延遲動態工具及巢狀工具呼叫則由 Codex 負責。

## 每個回合如何執行

在規劃階段，OpenClaw 內嵌執行器會為該次執行建立有效目錄：

1. 解析代理、設定檔、沙箱及工作階段的有效工具政策。
2. 列出符合資格的 OpenClaw 與外掛工具。
3. 透過工作階段 MCP 執行階段列出符合資格的 MCP 工具。
4. 加入為目前執行提供且符合資格的用戶端工具。
5. 讓僅限直接呼叫的工具繼續顯示給模型，並為其餘符合目錄收錄資格的工具建立精簡描述資訊索引。
6. 將 OpenClaw 程式碼橋接、結構化備援工具或精簡目錄介面，與這些僅限直接呼叫的工具一併公開。

在執行階段，每個實際工具呼叫都會返回 OpenClaw。隔離的 Node 執行階段不會持有外掛實作、MCP 用戶端物件或機密資訊。`openclaw.tools.call(...)` 會跨越橋接返回閘道，而一般的政策、核准、鉤子、記錄及結果處理仍然適用。

## 模式

`tools.toolSearch` 有三種面向模型的模式：

- `code`：公開 `tool_search_code`（預設的精簡 JavaScript 橋接），並搭配僅限直接呼叫的工具。
- `tools`：對不應接收程式碼的供應商，將 `tool_search`、`tool_describe` 及 `tool_call` 公開為一般結構化工具，並搭配僅限直接呼叫的工具。
- `directory`：公開 `tool_search`、`tool_describe` 及 `tool_call`，並為應看見工具名稱但不需看到每個完整結構描述的供應商，提供包含可用工具名稱與說明的有界提示目錄。OpenClaw 也可為目前回合直接公開少量且有界的可能需要或必要工具結構描述。此模式也會繼續顯示僅限直接呼叫的工具。

所有模式都使用相同的政策篩選目錄及一般 OpenClaw 執行路徑。標示為 `catalogMode: "direct-only"` 的工具會保留在該目錄之外，並繼續顯示給模型。如果目前的執行階段無法啟動隔離的 Node 程式碼模式子程序，預設的 `code` 模式會在目錄壓縮之前退回 `tools`。在 `directory` 模式中，用戶端提供的工具在目前執行中會繼續直接顯示，而 OpenClaw 工具、外掛工具及 MCP 工具則可壓縮至目錄型目錄之後。若直接呼叫確切的隱藏目錄名稱，系統會在執行前從同一個已授權目錄載入該工具。

所有模式都是實驗性功能。對於較小的 OpenClaw 工具目錄，請優先直接公開工具；對於 Codex 控制框架執行，請優先使用 Codex 原生的穩定介面。

沒有獨立的來源選取設定。啟用工具搜尋後，目錄會在一般政策篩選後包含符合目錄收錄資格的 OpenClaw、MCP 及用戶端工具；僅限直接呼叫的工具則會分開保留。

## 此功能存在的原因

大型目錄很實用，但成本高昂。將每個工具結構描述傳給模型會增加要求大小、減慢規劃，並提高誤選工具的機率。

工具搜尋會改變其形式：

- 直接工具：模型會在產生第一個權杖前看到每個所選工具的結構描述
- 工具搜尋程式碼模式：模型會看到一個精簡程式碼工具、一份簡短的 API 契約，以及任何僅限直接呼叫的工具
- 工具搜尋工具模式：模型會看到三個精簡的結構化備援工具，以及任何僅限直接呼叫的工具
- 工具搜尋目錄模式：模型會看到有界目錄、搜尋／描述／呼叫控制項、少量且有界的可能需要或必要結構描述，以及任何僅限直接呼叫的工具
- 回合進行期間：模型可視需要載入其餘結構描述

對於小型目錄，直接公開工具仍是正確的預設選擇。當一次執行可看見許多工具時，工具搜尋最為合適，尤其是來自 MCP 伺服器或用戶端提供的應用程式工具。

## API

`openclaw.tools.search(query, options?)`

搜尋目前執行的有效目錄。結果精簡，且可安全地放回提示內容。

```js
const hits = await openclaw.tools.search("行事曆活動", { limit: 5 });
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
  summary: "規劃",
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

它也會讓用戶端提供的工具及所有僅限直接呼叫的工具繼續直接顯示，並可為目前回合直接公開少量且有界的可能需要或必要目錄工具結構描述。如果有界目錄省略了項目，請使用 `tool_search` 尋找它們。如果模型直接要求確切的隱藏目錄工具名稱，OpenClaw 會在一般執行前從已授權目錄載入該工具。
目錄模式的用戶端工具名稱不得與 OpenClaw、外掛或 MCP 工具名稱衝突，因為確切的延遲分派會使用這些名稱。

## 執行階段邊界

程式碼橋接會在短生命週期的 Node 子程序中執行。子程序啟動時會啟用 Node 權限模式，使用空白環境，不授予檔案系統或網路權限，也不授予子程序或工作執行緒權限。OpenClaw 會強制執行父程序的實際經過時間逾時，並在逾時時終止子程序，包括非同步延續執行之後。

執行階段僅公開：

- `console.log`、`console.warn` 及 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

一般 OpenClaw 行為仍適用於最終呼叫：

- 工具允許與拒絕政策
- 每個代理與每個沙箱的工具限制
- 頻道／執行階段工具政策
- 核准鉤子
- 外掛 `before_tool_call` 鉤子
- 工作階段身分、記錄及遙測

## 設定

使用預設程式碼橋接為 OpenClaw 執行啟用工具搜尋：

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

調整程式碼模式的逾時與搜尋結果限制（顯示的值為預設值）：

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

- 傳送至控制框架的序列化工具與提示總位元組數
- 目錄大小與來源明細
- 搜尋、描述及呼叫次數
- 透過 OpenClaw 執行的最終工具呼叫
- 所選工具 ID 與來源

工作階段記錄應能用來回答：

- 模型預先看到了多少個工具結構描述
- 模型執行了多少次搜尋與描述操作
- 最終呼叫了哪個工具
- 結果來自 OpenClaw、MCP 還是用戶端工具

## E2E 驗證

QA Lab 閘道情境會使用 OpenClaw 執行階段驗證兩種路徑：

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

它會建立一個具有大型工具目錄的暫時假外掛、啟動模擬 OpenAI 供應商、分別以直接模式及啟用工具搜尋的模式各啟動一次閘道，然後比較供應商要求承載資料與工作階段記錄。

此迴歸測試會驗證：

1. 直接模式可以呼叫假外掛工具。
2. 工具搜尋可以呼叫相同的假外掛工具。
3. 直接模式會直接向供應商公開假外掛工具的結構描述。
4. 工具搜尋只會公開精簡橋接及任何僅限直接呼叫的工具。
5. 對於大型假目錄，工具搜尋的要求承載資料較小。
6. 工作階段記錄會顯示預期的工具呼叫次數與橋接呼叫遙測資料。

## 失敗行為

工具搜尋應採取封閉式失敗：

- 如果工具不在有效政策中，搜尋不應傳回該工具
- 如果所選工具變得無法使用，`tool_call` 應失敗
- 如果政策或核准阻擋執行，呼叫結果應回報該阻擋，而不是繞過它
- 如果程式碼橋接無法建立隔離的執行階段，請使用 `mode: "tools"`，或為該部署停用工具搜尋

## 相關內容

- [工具與外掛](/zh-TW/tools)
- [多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [Exec 工具](/zh-TW/tools/exec)
- [ACP 代理設定](/zh-TW/tools/acp-agents-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
