---
read_when:
    - 你想讓 PI 代理程式使用大型工具目錄，而不必將每個工具結構描述加入提示詞
    - 你希望透過一個精簡的 PI 介面公開 OpenClaw 工具、MCP 工具和用戶端工具
    - 你正在實作或偵錯 PI 執行的工具探索功能
summary: 工具搜尋：將大型 PI 工具目錄壓縮到搜尋、描述與呼叫之後
title: 工具搜尋
x-i18n:
    generated_at: "2026-05-11T20:38:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

工具搜尋是 OpenClaw PI agent 的實驗性功能。它提供 PI agents 一種
精簡的方式來探索並呼叫大型工具目錄。當執行時有許多可用工具，但模型
可能只需要其中少數幾個時，這會很有用。

本頁記錄 OpenClaw PI 工具搜尋。這不是 Codex 原生的工具
搜尋或 dynamic-tools 介面。Codex 原生程式碼模式、工具搜尋、延遲
動態工具以及巢狀工具呼叫都是穩定的 Codex harness 介面，並且
不依賴 `tools.toolSearch`。

為 PI 啟用後，模型預設會收到一個 `tool_search_code` 工具。
該工具會在隔離的 Node 子程序中執行一小段 JavaScript 主體，並提供
`openclaw.tools` bridge：

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

目錄可以包含 OpenClaw 工具、plugin 工具、MCP 工具，以及
client 提供的工具。模型不會一開始就看到每個完整 schema。
相反地，它會搜尋精簡描述子，在需要精確 schema 時描述一個選取的工具，
並透過 OpenClaw 呼叫該工具。

Codex harness 執行不會收到這些實驗性的 OpenClaw 工具搜尋
控制項。OpenClaw 會將產品能力作為動態工具傳遞給 Codex，而
Codex 擁有穩定的原生程式碼模式、原生工具搜尋、延遲動態
工具，以及巢狀工具呼叫。

## 一個 turn 如何執行

在規劃時，PI embedded runner 會為該次執行建立有效目錄：

1. 解析 agent、profile、sandbox 和 session 的啟用中工具政策。
2. 列出符合資格的 OpenClaw 和 plugin 工具。
3. 透過 session MCP runtime 列出符合資格的 MCP 工具。
4. 加入目前執行所提供的符合資格 client 工具。
5. 為搜尋索引精簡描述子。
6. 向模型公開 PI 程式碼 bridge 或結構化 fallback 工具。

在執行時，每個實際工具呼叫都會回到 OpenClaw。隔離的 Node
runtime 不持有 plugin 實作、MCP client 物件或 secrets。
`openclaw.tools.call(...)` 會跨過 bridge 回到 Gateway，在那裡
仍會套用一般的政策、approval、hook、logging 和結果處理。

## 模式

`tools.toolSearch` 有兩種面向模型的模式：

- `code`：公開 `tool_search_code`，預設的精簡 JavaScript bridge。
- `tools`：將 `tool_search`、`tool_describe` 和 `tool_call` 作為一般
  結構化工具公開給不應接收程式碼的 providers。

兩種模式都使用相同的目錄和執行路徑。唯一差異是模型看到的
形狀。如果目前的 runtime 無法啟動隔離的 Node 程式碼模式子程序，
預設的 `code` 模式會在目錄 Compaction 前 fallback 到 `tools`。

兩種模式都是實驗性的。對於小型 PI 工具目錄，請優先使用直接工具公開；
對於 Codex harness 執行，請優先使用 Codex 原生穩定介面。

沒有獨立的來源選取設定。啟用工具搜尋時，目錄會在一般政策
篩選後包含符合資格的 OpenClaw、MCP 和 client 工具。

## 為什麼需要這個

大型目錄很有用，但成本高。將每個工具 schema 都傳送給模型
會讓請求變大、拖慢規劃，並增加意外選取工具的機率。

工具搜尋會改變形狀：

- 直接工具：模型在第一個 token 前會看到每個選取的 schema
- 工具搜尋程式碼模式：模型會看到一個精簡程式碼工具和一段簡短 API
  合約
- 工具搜尋工具模式：模型會看到三個精簡的結構化 fallback
  工具
- turn 期間：模型只載入它實際需要的工具 schema

對於小型目錄，直接工具公開仍然是正確的預設值。當一次執行可看到許多工具時，
尤其是來自 MCP servers 或 client 提供的 app 工具時，工具搜尋最適合。

## API

`openclaw.tools.search(query, options?)`

搜尋目前執行的有效目錄。結果是精簡且安全的，
可放回 prompt context。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

載入一個搜尋結果的完整 metadata，包括精確的輸入 schema。

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

結構化 fallback 模式會以工具形式公開相同操作：

- `tool_search`
- `tool_describe`
- `tool_call`

## Runtime 邊界

程式碼 bridge 會在短生命週期的 Node 子程序中執行。子程序啟動時
會啟用 Node permission mode、使用空環境、沒有 filesystem 或
network grants，也沒有 child-process 或 worker grants。OpenClaw 會強制執行
parent-process wall-clock timeout，並在 timeout 時終止子程序，包括
async continuations 之後。

runtime 只公開：

- `console.log`、`console.warn` 和 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

最終呼叫仍會套用一般 OpenClaw 行為：

- 工具 allow 和 deny policies
- 每個 agent 和每個 sandbox 的工具限制
- owner-only gating
- approval hooks
- plugin `before_tool_call` hooks
- session identity、logs 和 telemetry

## 設定

使用預設程式碼 bridge 為 PI 執行啟用工具搜尋：

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

改為在 PI 執行使用結構化 fallback 工具：

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

調整程式碼模式 timeout 和搜尋結果限制：

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

## Prompt 和 telemetry

工具搜尋會記錄足夠的 telemetry，以便與直接工具公開比較：

- 傳送到 harness 的總 serialized tool 和 prompt bytes
- 目錄大小和來源 breakdown
- search、describe 和 call 次數
- 透過 OpenClaw 執行的最終工具呼叫
- 選取的工具 ids 和來源

Session logs 應能回答：

- 模型一開始看到了多少工具 schema
- 它執行了多少次 search 和 describe 操作
- 呼叫了哪個最終工具
- 結果是否來自 OpenClaw、MCP 或 client 工具

## E2E 驗證

gateway E2E runner 會使用 PI harness 證明兩條路徑：

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

它會建立一個具有大型工具目錄的臨時假 plugin、啟動 mock
OpenAI provider，分別以直接模式和啟用工具搜尋的模式啟動一次 Gateway，
然後比較 provider request payloads 和 session logs。

此 regression 證明：

1. 直接模式可以呼叫假的 plugin 工具。
2. 工具搜尋可以呼叫相同的假 plugin 工具。
3. 直接模式會將假的 plugin 工具 schema 直接公開給 provider。
4. 工具搜尋只公開精簡 bridge。
5. 對於大型假目錄，工具搜尋 request payload 較小。
6. Session logs 會顯示預期的 tool-call counts 和 bridged call telemetry。

## 失敗行為

工具搜尋應該 fail closed：

- 如果工具不在有效政策中，search 不應傳回它
- 如果選取的工具變得無法使用，`tool_call` 應該失敗
- 如果 policy 或 approval 阻擋執行，呼叫結果應回報該
  block，而不是繞過它
- 如果程式碼 bridge 無法建立隔離 runtime，請使用 `mode: "tools"` 或
  對該 deployment 停用工具搜尋

## 相關

- [工具與 plugins](/zh-TW/tools)
- [多 agent sandbox 與工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [Exec 工具](/zh-TW/tools/exec)
- [ACP agents 設定](/zh-TW/tools/acp-agents-setup)
- [建構 plugins](/zh-TW/plugins/building-plugins)
