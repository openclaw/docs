---
read_when:
    - 你想讓 OpenClaw 代理使用大型工具目錄，而不必把每個工具結構描述都加入提示中
    - 你想要透過單一精簡的執行階段介面公開 OpenClaw 工具、MCP 工具和用戶端工具
    - 你正在實作或偵錯 OpenClaw 執行的工具探索
summary: 工具搜尋：將大型 OpenClaw 工具目錄壓縮在搜尋、描述與呼叫後方
title: 工具搜尋
x-i18n:
    generated_at: "2026-06-27T20:11:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23b46264bab307bbfdfeb1e358c566d498f3bcf77f187ba05d2ae319e115e1f4
    source_path: tools/tool-search.md
    workflow: 16
---

工具搜尋是 OpenClaw agent runtime 的實驗性功能。它讓代理能以一種
精簡方式探索並呼叫大型工具目錄。當一次執行有許多可用工具，但模型
可能只需要其中少數工具時，這很有用。

本頁記錄 OpenClaw 工具搜尋。它不是 Codex 原生的工具
搜尋或動態工具介面。Codex 原生程式碼模式、工具搜尋、延遲
動態工具，以及巢狀工具呼叫都是穩定的 Codex harness 介面，且
不依賴 `tools.toolSearch`。

為 OpenClaw 執行啟用時，模型預設會收到一個 `tool_search_code` 工具。
該工具會在隔離的節點子程序中執行一段簡短 JavaScript 主體，並帶有
`openclaw.tools` 橋接：

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

目錄可包含 OpenClaw 工具、外掛工具、MCP 工具，以及
用戶端提供的工具。模型一開始不會看到每個完整 schema。
相反地，它會搜尋精簡描述項，在需要精確 schema 時描述一個選定工具，
並透過 OpenClaw 呼叫該工具。

Codex harness 執行不會收到這些實驗性的 OpenClaw 工具搜尋
控制項。OpenClaw 會將產品能力作為動態工具傳給 Codex，而
Codex 擁有穩定的原生程式碼模式、原生工具搜尋、延遲動態
工具，以及巢狀工具呼叫。

## 一個回合如何執行

在規劃時，OpenClaw 嵌入式執行器會為該次
執行建立有效目錄：

1. 解析代理、profile、sandbox 與 session 的作用中工具政策。
2. 列出符合資格的 OpenClaw 與外掛工具。
3. 透過 session MCP runtime 列出符合資格的 MCP 工具。
4. 加入目前執行所提供且符合資格的用戶端工具。
5. 為搜尋建立精簡描述項索引。
6. 將 OpenClaw 程式碼橋接、結構化備援工具，或
   精簡目錄介面公開給模型。

在執行時，每個實際工具呼叫都會回到 OpenClaw。隔離的節點
runtime 不持有外掛實作、MCP 用戶端物件或機密。
`openclaw.tools.call(...)` 會跨越橋接回到閘道，在那裡
仍會套用一般政策、核准、hook、記錄與結果處理。

## 模式

`tools.toolSearch` 有三種面向模型的模式：

- `code`：公開 `tool_search_code`，也就是預設的精簡 JavaScript 橋接。
- `tools`：將 `tool_search`、`tool_describe` 和 `tool_call` 公開為一般
  結構化工具，供不應接收程式碼的提供者使用。
- `directory`：公開 `tool_search`、`tool_describe` 和 `tool_call`，外加一個
  有界的 prompt 目錄，其中包含可用工具名稱與描述，供應該看到工具名稱
  但不應看到每個完整 schema 的提供者使用。OpenClaw 也可以針對
  目前回合，直接公開一小組有界的可能或必要工具 schema。

所有模式都使用相同的政策篩選目錄與一般 OpenClaw 執行
路徑。如果目前 runtime 無法啟動隔離的節點程式碼模式子
程序，預設 `code` 模式會在目錄壓縮前退回 `tools`。在
`directory` 模式中，用戶端提供的工具會在目前執行中保持直接可見，
而 OpenClaw 工具、外掛工具與 MCP 工具可以被壓縮到目錄
目錄後方。對精確隱藏目錄名稱的直接呼叫，會在執行前從相同的已授權
目錄中水合。

所有模式都是實驗性的。對於小型 OpenClaw 工具目錄，請優先使用
直接工具公開；對於 Codex harness 執行，請優先使用 Codex 原生的
穩定介面。

沒有個別的來源選擇設定。啟用工具搜尋時，目錄會在一般政策
篩選後包含符合資格的 OpenClaw、MCP 與用戶端工具。

## 為什麼存在

大型目錄很有用，但成本高昂。將每個工具 schema 都傳送給模型
會讓請求變大、拖慢規劃，並增加意外選擇工具的機率。

工具搜尋改變了形態：

- 直接工具：模型在第一個 token 前看到每個選定的 schema
- 工具搜尋程式碼模式：模型看到一個精簡程式碼工具與一份簡短 API
  contract
- 工具搜尋工具模式：模型看到三個精簡結構化備援
  工具
- 工具搜尋目錄模式：模型看到一個有界目錄，加上
  搜尋/描述/呼叫控制項，以及一小組有界的可能或必要
  schema
- 回合期間：模型可依需要載入剩餘 schema

對於小型目錄，直接工具公開仍是正確預設值。當一次執行可以看到許多工具，
特別是來自 MCP 伺服器或用戶端提供的應用工具時，工具搜尋最適合。

## API

`openclaw.tools.search(query, options?)`

搜尋目前執行的有效目錄。結果是精簡的，且可安全放回 prompt context。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

載入一個搜尋結果的完整中繼資料，包括精確輸入 schema。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

透過 OpenClaw 呼叫選定工具。

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

目錄模式公開：

- `tool_search`
- `tool_describe`
- `tool_call`

它也會讓用戶端提供的工具保持直接可見，並可針對目前
回合，直接公開一小組有界的可能或必要目錄工具 schema。
如果有界目錄省略項目，請使用 `tool_search` 找到它們。如果
模型直接請求精確的隱藏目錄工具名稱，OpenClaw 會在一般執行前
從已授權目錄水合它。
目錄模式的用戶端工具名稱不得與 OpenClaw、外掛或 MCP
工具名稱衝突，因為精確延遲 dispatch 會使用這些名稱。

## Runtime 邊界

程式碼橋接會在短生命週期的節點子程序中執行。子程序啟動時
會啟用節點權限模式、使用空環境、沒有檔案系統或
網路授權，也沒有子程序或 worker 授權。OpenClaw 會強制
父程序的 wall-clock 逾時，並在逾時時終止子程序，包括
async continuation 之後。

Runtime 只公開：

- `console.log`、`console.warn` 和 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

一般 OpenClaw 行為仍適用於最終呼叫：

- 工具允許與拒絕政策
- 每個代理與每個 sandbox 的工具限制
- 頻道/runtime 工具政策
- 核准 hooks
- 外掛 `before_tool_call` hooks
- session 身分、記錄與遙測

## 設定

使用預設程式碼橋接為 OpenClaw 執行啟用工具搜尋：

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

改用結構化備援工具供 OpenClaw 執行使用：

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

改用精簡目錄介面供 OpenClaw 執行使用：

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

調整程式碼模式逾時與搜尋結果限制：

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

## Prompt 與遙測

工具搜尋會記錄足夠的遙測，以便與直接工具公開比較：

- 傳送到 harness 的序列化工具與 prompt 位元組總數
- 目錄大小與來源細分
- 搜尋、描述與呼叫次數
- 透過 OpenClaw 執行的最終工具呼叫
- 選定的工具 id 與來源

Session 記錄應能回答：

- 模型一開始看到多少工具 schema
- 它執行了多少搜尋與描述操作
- 最終呼叫了哪個工具
- 結果來自 OpenClaw、MCP，還是用戶端工具

## E2E 驗證

閘道 E2E 執行器會使用 OpenClaw runtime 證明兩條路徑：

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

它會建立一個擁有大型工具目錄的暫時假外掛，啟動 mock
OpenAI 提供者，分別在直接模式與啟用工具搜尋的模式下啟動一次閘道，
接著比較提供者請求 payload 與 session 記錄。

這項回歸證明：

1. 直接模式可以呼叫假外掛工具。
2. 工具搜尋可以呼叫同一個假外掛工具。
3. 直接模式會將假外掛工具 schema 直接公開給提供者。
4. 工具搜尋只公開精簡橋接。
5. 對於大型假目錄，工具搜尋請求 payload 較小。
6. Session 記錄會顯示預期的工具呼叫次數與橋接呼叫遙測。

## 失敗行為

工具搜尋應該 fail closed：

- 如果工具不在有效政策中，搜尋不應回傳它
- 如果選定工具變得不可用，`tool_call` 應失敗
- 如果政策或核准阻擋執行，呼叫結果應回報該
  阻擋，而不是繞過它
- 如果程式碼橋接無法建立隔離 runtime，請使用 `mode: "tools"` 或
  為該部署停用工具搜尋

## 相關

- [工具與外掛](/zh-TW/tools)
- [多代理 sandbox 與工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [Exec 工具](/zh-TW/tools/exec)
- [ACP 代理設定](/zh-TW/tools/acp-agents-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
