---
read_when:
    - 您希望 PI 代理使用大型工具目錄，而不必將每個工具結構描述加入提示詞
    - 你想要將 OpenClaw 工具、MCP 工具與用戶端工具透過單一精簡的 PI 介面公開
    - 你正在為 PI 執行實作或偵錯工具探索
summary: 工具搜尋：將大型 PI 工具目錄收斂到搜尋、描述與呼叫之後
title: 工具搜尋
x-i18n:
    generated_at: "2026-05-10T19:55:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 182b850db5a1d6c9a769d5d50ccae914bc65416c1fd9368f0aeeb43663c0c0ae
    source_path: tools/tool-search.md
    workflow: 16
---

工具搜尋為 PI 代理提供一種精簡方式來探索並呼叫大型工具
目錄。當執行階段有許多可用工具，但模型可能只需要其中少數幾個時，
它很有用。

為 PI 啟用時，模型預設會收到一個 `tool_search_code` 工具。
該工具會在隔離的 Node 子行程中執行一段簡短的 JavaScript 主體，並透過
`openclaw.tools` 橋接：

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

目錄可以包含 OpenClaw 工具、Plugin 工具、MCP 工具，以及
用戶端提供的工具。模型一開始不會看到每個完整結構描述。
相反地，它會搜尋精簡描述項，在需要精確結構描述時描述一個選定工具，
並透過 OpenClaw 呼叫該工具。

Codex harness 執行不會收到這些 OpenClaw 工具搜尋控制項。OpenClaw
會將產品功能作為動態工具傳遞給 Codex，而 Codex 擁有原生
程式碼模式、原生工具搜尋、延遲動態工具，以及巢狀工具呼叫。

## 回合如何執行

在規劃階段，PI 嵌入式執行器會為該次執行建構有效目錄：

1. 解析代理、設定檔、沙箱和工作階段的作用中工具政策。
2. 列出符合資格的 OpenClaw 和 Plugin 工具。
3. 透過工作階段 MCP 執行階段列出符合資格的 MCP 工具。
4. 加入目前執行所提供且符合資格的用戶端工具。
5. 為搜尋索引精簡描述項。
6. 向模型公開 PI 程式碼橋接或結構化後援工具。

在執行階段，每個真正的工具呼叫都會回到 OpenClaw。隔離的 Node
執行階段不會持有 Plugin 實作、MCP 用戶端物件或祕密。
`openclaw.tools.call(...)` 會跨越橋接回到 Gateway，正常的
政策、核准、hook、記錄和結果處理仍會套用。

## 模式

`tools.toolSearch` 有兩種面向模型的模式：

- `code`：公開 `tool_search_code`，預設的精簡 JavaScript 橋接。
- `tools`：將 `tool_search`、`tool_describe` 和 `tool_call` 公開為一般
  結構化工具，供不應接收程式碼的提供者使用。

兩種模式都使用相同的目錄和執行路徑。唯一差異是模型看到的形狀。
如果目前執行階段無法啟動隔離的 Node 程式碼模式子行程，預設的
`code` 模式會在目錄壓縮前後援至 `tools`。

沒有個別的來源選擇設定。啟用工具搜尋時，目錄會在正常政策
篩選後，包含符合資格的 OpenClaw、MCP 和用戶端工具。

## 為什麼存在

大型目錄很有用，但成本高。將每個工具結構描述都傳送給模型
會讓請求變大、拖慢規劃，並增加意外選取工具的機率。

工具搜尋會改變形狀：

- 直接工具：模型在第一個 token 前看到每個選定的結構描述
- 工具搜尋程式碼模式：模型看到一個精簡程式碼工具和一份簡短 API
  契約
- 工具搜尋工具模式：模型看到三個精簡的結構化後援工具
- 回合期間：模型只載入實際需要的工具結構描述

對於小型目錄，直接公開工具仍是正確的預設值。當一次執行可以看到
許多工具，尤其是來自 MCP 伺服器或用戶端提供的應用程式工具時，
工具搜尋最適合。

## API

`openclaw.tools.search(query, options?)`

搜尋目前執行的有效目錄。結果是精簡且安全的，可以放回提示詞脈絡中。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

載入一個搜尋結果的完整中繼資料，包括精確的輸入結構描述。

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

結構化後援模式會將相同操作公開為工具：

- `tool_search`
- `tool_describe`
- `tool_call`

## 執行階段邊界

程式碼橋接會在短暫存在的 Node 子行程中執行。子行程啟動時會啟用
Node 權限模式、使用空環境、沒有檔案系統或網路授權，也沒有
子行程或 worker 授權。OpenClaw 會強制執行父行程牆鐘逾時，
並在逾時時終止子行程，包括非同步延續之後。

執行階段只公開：

- `console.log`、`console.warn` 和 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

正常的 OpenClaw 行為仍會套用到最終呼叫：

- 工具允許與拒絕政策
- 每代理和每沙箱工具限制
- 僅擁有者閘控
- 核准 hook
- Plugin `before_tool_call` hook
- 工作階段身分、記錄和遙測

## 設定

使用預設程式碼橋接為 PI 執行啟用工具搜尋：

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

改為對 PI 執行使用結構化後援工具：

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
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

## 提示詞與遙測

工具搜尋會記錄足夠的遙測，以便與直接工具公開比較：

- 傳送給 harness 的序列化工具和提示詞總位元組數
- 目錄大小和來源細分
- 搜尋、描述和呼叫次數
- 透過 OpenClaw 執行的最終工具呼叫
- 選定的工具 ID 和來源

工作階段記錄應能回答：

- 模型一開始看到多少工具結構描述
- 它執行了多少次搜尋和描述操作
- 哪個最終工具被呼叫
- 結果是來自 OpenClaw、MCP，還是用戶端工具

## E2E 驗證

Gateway E2E 執行器會使用 PI harness 證明兩條路徑：

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

它會建立一個具有大型工具目錄的暫時假 Plugin、啟動模擬
OpenAI 提供者、分別以直接模式和啟用工具搜尋的方式啟動一次
Gateway，然後比較提供者請求 payload 和工作階段記錄。

此迴歸證明：

1. 直接模式可以呼叫假 Plugin 工具。
2. 工具搜尋可以呼叫相同的假 Plugin 工具。
3. 直接模式會將假 Plugin 工具結構描述直接公開給提供者。
4. 工具搜尋只公開精簡橋接。
5. 對於大型假目錄，工具搜尋請求 payload 較小。
6. 工作階段記錄會顯示預期的工具呼叫次數和橋接呼叫遙測。

## 失敗行為

工具搜尋應該封閉失敗：

- 如果工具不在有效政策中，搜尋不應回傳它
- 如果選定工具變得無法使用，`tool_call` 應失敗
- 如果政策或核准阻擋執行，呼叫結果應回報該阻擋，
  而不是繞過它
- 如果程式碼橋接無法建立隔離執行階段，請使用 `mode: "tools"`，
  或對該部署停用工具搜尋

## 相關

- [工具與 plugins](/zh-TW/tools)
- [多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [Exec 工具](/zh-TW/tools/exec)
- [ACP 代理設定](/zh-TW/tools/acp-agents-setup)
- [建置 plugins](/zh-TW/plugins/building-plugins)
