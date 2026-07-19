---
read_when:
    - 你希望 OpenClaw 代理程式能使用大型工具目錄，而不必將每個工具結構描述都加入提示詞中
    - 你希望透過單一精簡的執行階段介面提供 OpenClaw 工具、MCP 工具和用戶端工具
    - 你正在實作或偵錯 OpenClaw 執行作業的工具探索功能
summary: 工具搜尋：透過搜尋、描述與呼叫，精簡大型 OpenClaw 工具目錄
title: 工具搜尋
x-i18n:
    generated_at: "2026-07-19T14:08:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d31322d5ef108c52fd14d48771cc3c6c43fcfbc4bfb95652bc29a55fd706c903
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search 是一項實驗性的 OpenClaw 代理程式執行階段功能。它提供代理程式一種
精簡的方式，來探索及呼叫大型工具目錄。當一次執行有許多可用工具，
但模型可能只需要其中少數幾項時，這項功能會很有用。

本頁說明 OpenClaw Tool Search。它不是 Codex 原生的工具
搜尋或動態工具介面。Codex 原生程式碼模式、工具搜尋、延遲載入的
動態工具及巢狀工具呼叫，都是穩定的 Codex 控制框架介面，且
不依賴 `tools.toolSearch`。

若要瞭解公開 QuickJS-WASI `exec`/`wait`
介面而非 Tool Search 控制項的一般 OpenClaw 執行階段，請參閱[程式碼模式](/zh-TW/tools/code-mode)。

為 OpenClaw 執行啟用此功能時，模型預設會收到一個 `tool_search_code` 工具，
以及結構化結果無法通過精簡橋接器的所有僅限直接呼叫工具。
程式碼工具會在隔離的節點子程序中，透過 `openclaw.tools` 橋接器執行一小段 JavaScript：

```js
const hits = await openclaw.tools.search("建立 GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "啟動時當機",
  body: "重現步驟...",
});
```

目錄可包含符合目錄資格的 OpenClaw 工具、外掛工具、MCP
工具及用戶端提供的工具。模型不會預先看到每個已收錄工具的結構描述。
它會改為搜尋精簡描述項，在需要確切結構描述時描述一個選定的
工具，並透過 OpenClaw 呼叫該工具。
僅限直接呼叫的工具仍會對模型可見，且不會加入目錄。

Codex 控制框架執行不會收到這些實驗性的 OpenClaw Tool Search
控制項。OpenClaw 會將產品能力以動態工具形式傳遞給 Codex，而
Codex 負責穩定的原生程式碼模式、原生工具搜尋、延遲載入的動態
工具及巢狀工具呼叫。

## 單一回合如何執行

在規劃階段，OpenClaw 內嵌執行器會為此次執行建立有效目錄：

1. 解析代理程式、設定檔、沙箱及工作階段的作用中工具政策。
2. 列出符合資格的 OpenClaw 與外掛工具。
3. 透過工作階段 MCP 執行階段列出符合資格的 MCP 工具。
4. 加入為目前執行提供且符合資格的用戶端工具。
5. 讓僅限直接呼叫的工具維持對模型可見，並為其餘符合目錄資格的工具
   建立精簡描述項索引。
6. 在這些僅限直接呼叫的工具旁，公開 OpenClaw 程式碼橋接器、結構化備援工具或
   精簡目錄介面。

在執行階段，每次實際工具呼叫都會返回 OpenClaw。隔離的節點
執行階段不會持有外掛實作、MCP 用戶端物件或密鑰。
`openclaw.tools.call(...)` 會跨越橋接器返回閘道，而正常的
政策、核准、鉤子、記錄及結果處理仍會套用。

## 模式

`tools.toolSearch` 有三種面向模型的模式：

- `code`：公開 `tool_search_code`（預設的精簡 JavaScript 橋接器），
  以及僅限直接呼叫的工具。
- `tools`：將 `tool_search`、`tool_describe` 及 `tool_call` 公開為一般
  結構化工具，供不應接收程式碼的提供者使用，並同時公開
  僅限直接呼叫的工具。
- `directory`：公開 `tool_search`、`tool_describe` 及 `tool_call`，以及一個
  大小受限的提示目錄，其中包含可用工具名稱及說明，供
  應看到工具名稱但不應看到所有完整結構描述的提供者使用。OpenClaw 也可
  為目前回合直接公開少量且數量受限的可能需要或必要工具結構描述。
  在此模式下，僅限直接呼叫的工具也仍然可見。

所有模式都使用相同的政策篩選目錄及一般 OpenClaw 執行
路徑。標記為 `catalogMode: "direct-only"` 的工具會留在該目錄之外，並
維持對模型可見。如果目前的執行階段無法啟動隔離的節點程式碼模式子
程序，預設 `code` 模式會在壓縮目錄前退回至 `tools`。
在 `directory` 模式中，用戶端提供的工具在目前執行期間會維持直接可見，
而 OpenClaw 工具、外掛工具及 MCP 工具可壓縮至目錄型工具目錄之後。
直接呼叫確切的隱藏目錄名稱時，執行前會從同一個已授權目錄載入該工具。

所有模式都是實驗性功能。對小型 OpenClaw 工具
目錄，優先使用直接公開工具；對 Codex 控制框架執行，則優先使用 Codex 原生的穩定介面。

沒有獨立的來源選擇設定。啟用 Tool Search 時，
目錄會在一般政策篩選後納入符合目錄資格的 OpenClaw、MCP 及用戶端工具；
僅限直接呼叫的工具則會分開保留。

## 為何需要此功能

大型目錄很實用，但成本高昂。將每個工具結構描述傳送給模型
會增加請求大小、拖慢規劃，並提高意外選錯工具的機率。

Tool Search 會改變其形式：

- 直接工具：模型會在產生第一個權杖前看到每個選定的結構描述
- Tool Search 程式碼模式：模型會看到一個精簡程式碼工具、一份簡短的 API
  合約，以及所有僅限直接呼叫的工具
- Tool Search 工具模式：模型會看到三個精簡的結構化備援
  工具，以及所有僅限直接呼叫的工具
- Tool Search 目錄模式：模型會看到一個大小受限的目錄、
  搜尋／描述／呼叫控制項、少量且數量受限的可能需要或必要
  結構描述，以及所有僅限直接呼叫的工具
- 回合進行期間：模型可視需要載入其餘結構描述

對小型目錄而言，直接公開工具仍是正確的預設選擇。當一次執行可看到許多工具，
尤其是來自 MCP 伺服器或用戶端提供的應用程式工具時，Tool Search
最適合使用。

## API

`openclaw.tools.search(query, options?)`

搜尋目前執行的有效目錄。結果精簡，且可安全地
放回提示詞內容中。每筆命中結果都包含一個大小受限、類似 TypeScript 的
`input` 簽章，例如 `{ id: string; mode?: "drip" | "flood" }`，因此當該簽章已足夠時，
模型可以略過 `describe`。受信任的
OpenClaw 核心或外掛工具也可包含精簡的 `output` 提示，例如
`Array<{ id: string; paid: boolean }>`。MCP 及用戶端的輸出結構描述宣告
不會提升為此受信任提示。它們不受信任的輸入結構描述也會
以 `input: "unknown"` 延遲載入；呼叫前請使用 `describe`。開放式、
過大或其他不完整的輸出結構描述會省略此提示，並改為
透過 `describe` 提供。

```js
const hits = await openclaw.tools.search("行事曆事件", { limit: 5 });
```

`openclaw.tools.describe(id)`

載入一筆搜尋結果的完整中繼資料，包括確切的輸入結構描述，以及
工具有宣告時受信任且完整的 `outputSchema`。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

透過 OpenClaw 呼叫選定的工具，並傳回原始 `{ tool, result }`
封套。傳回 JSON 的工具通常會將其值放在
`result.details` 中。如果受信任的工具宣告了 `outputSchema`，OpenClaw 會在
執行前編譯該結構描述，並在一般工具鉤子執行後驗證最終 `details`，
然後才傳回目錄呼叫。

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "規劃",
  start: "2026-05-09T14:00:00Z",
});
```

工具作者會在工具的 `outputSchema` 屬性上宣告輸出合約。
它描述的是 `AgentToolResult.details`，而非算繪後的內容區塊。請納入
所有不會擲回例外的變體；若結果不穩定，則省略該屬性。請參閱
[程式碼模式輸出合約](/zh-TW/tools/code-mode#declared-output-contracts)及
[工具外掛](/zh-TW/plugins/tool-plugins#output-contracts)。

結構化備援模式會將相同操作公開為工具：

- `tool_search`
- `tool_describe`
- `tool_call`

目錄模式會公開：

- `tool_search`
- `tool_describe`
- `tool_call`

它也會讓用戶端提供的工具及所有僅限直接呼叫的工具維持直接可見，
並可為目前回合直接公開少量且數量受限的可能需要或必要目錄工具結構描述。
如果大小受限的目錄省略了項目，請使用
`tool_search` 尋找。如果模型直接要求確切的隱藏目錄
工具名稱，OpenClaw 會先從已授權目錄載入該工具，再進行
一般執行。
目錄模式中的用戶端工具名稱不得與 OpenClaw、外掛或 MCP
工具名稱衝突，因為確切的延遲分派會使用這些名稱。

## 執行階段邊界

程式碼橋接器會在短期存在的節點子程序中執行。子程序啟動時
會啟用節點權限模式，使用空白環境，且不授予檔案系統或
網路權限，也不授予子程序或工作執行緒權限。OpenClaw 會強制執行
父程序的實際經過時間逾時，並在逾時時終止子程序，包括
非同步延續作業之後。

執行階段只會公開：

- `console.log`、`console.warn` 及 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

一般 OpenClaw 行為仍會套用至最終呼叫：

- 工具允許及拒絕政策
- 每個代理程式及每個沙箱的工具限制
- 頻道／執行階段工具政策
- 核准鉤子
- 外掛 `before_tool_call` 鉤子
- 工作階段身分、記錄及遙測資料

## 設定

使用預設程式碼橋接器為 OpenClaw 執行啟用 Tool Search：

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

改為對 OpenClaw 執行使用結構化備援工具：

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

調整程式碼模式逾時及搜尋結果限制（顯示的值為預設值）：

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

執行階段會將 `codeTimeoutMs` 限制在 1000-60000、將 `maxSearchLimit` 限制在 1-50，並將
`searchDefaultLimit` 限制在 1..`maxSearchLimit`。

停用此功能：

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## 提示詞與遙測資料

Tool Search 會記錄足夠的遙測資料，以便和直接公開工具比較：

- 傳送至控制框架的工具與提示詞序列化位元組總數
- 目錄大小及來源細分
- 搜尋、描述及呼叫次數
- 透過 OpenClaw 執行的最終工具呼叫
- 選定的工具 ID 及來源

工作階段記錄應能用來回答：

- 模型預先看到了多少個工具結構描述
- 模型執行了多少次搜尋及描述操作
- 呼叫了哪個最終工具
- 結果來自 OpenClaw、MCP 還是用戶端工具

## 端對端驗證

QA Lab 閘道情境會使用 OpenClaw 執行階段驗證這兩種路徑：

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

它會建立一個包含大型工具目錄的暫時假外掛、啟動模擬
OpenAI 提供者、先以直接模式啟動一次閘道，再啟用 Tool Search
啟動一次，然後比較提供者請求承載資料及工作階段記錄。

此迴歸測試會驗證：

1. 直接模式可以呼叫模擬外掛工具。
2. 工具搜尋可以呼叫相同的模擬外掛工具。
3. 直接模式會將模擬外掛工具的結構描述直接提供給供應商。
4. 工具搜尋只會提供精簡橋接介面及任何僅限直接模式使用的工具。
5. 對於大型模擬目錄，工具搜尋的請求承載資料較小。
6. 工作階段記錄會顯示預期的工具呼叫次數和橋接呼叫遙測資料。

## 失敗行為

工具搜尋應採取封閉式失敗：

- 如果工具不在有效原則中，搜尋不應傳回該工具
- 如果所選工具變得無法使用，`tool_call` 應失敗
- 如果原則或核准機制阻止執行，呼叫結果應回報該
  阻止情況，而不是繞過它
- 如果程式碼橋接介面無法建立隔離的執行階段，請使用 `mode: "tools"`，或
  對該部署停用工具搜尋

## 相關內容

- [工具與外掛](/zh-TW/tools)
- [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [執行工具](/zh-TW/tools/exec)
- [ACP 代理程式設定](/zh-TW/tools/acp-agents-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)
