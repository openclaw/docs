---
read_when:
    - 你想了解 OpenClaw 如何組裝模型上下文
    - 你正在舊版引擎與外掛引擎之間切換
    - 你正在建置上下文引擎外掛
sidebarTitle: Context engine
summary: 情境引擎：可插拔的情境組裝、壓縮與子代理生命週期
title: 上下文引擎
x-i18n:
    generated_at: "2026-07-05T11:13:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2649dea456f271421aa64022abb00663ccf71e0afd5e11ecbbee7aa30338fd53
    source_path: concepts/context-engine.md
    workflow: 16
---

A **上下文引擎**會控制 OpenClaw 如何為每次執行建立模型上下文：要包含哪些訊息、如何摘要較舊的歷史，以及如何跨子代理邊界管理上下文。

OpenClaw 內建隨附 `legacy` 引擎，並預設使用它。只有在你想要不同的組裝、壓縮或跨工作階段回想行為時，才安裝並選取外掛引擎。

## 快速開始

<Steps>
  <Step title="檢查目前作用中的引擎">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="安裝外掛引擎">
    上下文引擎外掛的安裝方式與任何其他 OpenClaw 外掛相同。

    <Tabs>
      <Tab title="從 npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="從本機路徑">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="啟用並選取引擎">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    安裝並設定後，重新啟動閘道。

  </Step>
  <Step title="切換回 legacy（可選）">
    將 `contextEngine` 設為 `"legacy"`（或完全移除該鍵 - `"legacy"` 是預設值）。
  </Step>
</Steps>

## 運作方式

每當 OpenClaw 執行模型提示時，上下文引擎會參與四個生命週期點：

<AccordionGroup>
  <Accordion title="1. 擷取">
    在新訊息加入工作階段時呼叫。引擎可以將訊息儲存到自己的資料儲存區，或為其建立索引。
  </Accordion>
  <Accordion title="2. 組裝">
    在每次模型執行前呼叫。引擎會傳回一組有序訊息（以及可選的 `systemPromptAddition`），且內容符合 Token 預算。
  </Accordion>
  <Accordion title="3. 壓縮">
    在上下文視窗已滿，或使用者執行 `/compact` 時呼叫。引擎會摘要較舊的歷史以釋放空間。
  </Accordion>
  <Accordion title="4. 回合後">
    在執行完成後呼叫。引擎可以持久化狀態、觸發背景壓縮，或更新索引。
  </Accordion>
</AccordionGroup>

引擎也可以實作可選的 `maintain()` 方法，用於在啟動、成功回合或壓縮後進行逐字稿維護（透過 `runtimeContext.rewriteTranscriptEntries()` 安全改寫）。設定 `info.turnMaintenanceMode: "background"` 可將其作為延後工作執行，而非阻塞回覆。

對於隨附的非 ACP Codex 測試框架，OpenClaw 會將組裝後的上下文投射到 Codex 開發者指示和目前回合提示中，以套用相同生命週期。Codex 仍會擁有自己的原生對話串歷史和原生壓縮器。

### 子代理生命週期（可選）

OpenClaw 會呼叫兩個可選的子代理生命週期掛鉤：

<ParamField path="prepareSubagentSpawn" type="method">
  在子執行開始前準備共享上下文狀態。此掛鉤會收到父/子工作階段鍵、`contextMode`（`isolated` 或 `fork`）、可用的逐字稿 ID/檔案，以及可選 TTL。如果它傳回復原控制代碼，OpenClaw 會在準備成功後產生失敗時呼叫它。要求 `lightContext` 並解析為 `contextMode="isolated"` 的原生子代理產生，會刻意略過此掛鉤，讓子代理從輕量啟動上下文開始，而不帶有上下文引擎管理的預產生狀態。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子代理工作階段完成或被清掃時清理。
</ParamField>

### 系統提示附加內容

`assemble` 方法可以傳回 `systemPromptAddition` 字串。OpenClaw 會將其前置到該次執行的系統提示。這讓引擎能注入動態回想指引、擷取指示或具上下文感知的提示，而不需要靜態工作區檔案。

## legacy 引擎

內建的 `legacy` 引擎會保留 OpenClaw 的原始行為：

- **擷取**：無操作（工作階段管理器會直接處理訊息持久化）。
- **組裝**：直通（執行階段中既有的清理 → 驗證 → 限制管線會處理上下文組裝）。
- **壓縮**：委派給內建的摘要壓縮，該壓縮會為較舊訊息建立單一摘要，並保留近期訊息不變。
- **回合後**：無操作。

legacy 引擎不會註冊工具，也不會提供 `systemPromptAddition`。

當未設定 `plugins.slots.contextEngine`（或設定為 `"legacy"`）時，會自動使用此引擎。

## 外掛引擎

外掛可以使用外掛 API 註冊上下文引擎：

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

工廠 `ctx` 包含可選的 `config`、`agentDir` 和 `workspaceDir`
值，讓外掛可在第一個生命週期掛鉤執行前，初始化每個代理或每個工作區的狀態。

接著在設定中啟用它：

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### ContextEngine 介面

必要成員：

| 成員               | 種類     | 用途                                             |
| ------------------ | -------- | ------------------------------------------------ |
| `info`             | 屬性     | 引擎 ID、名稱、版本，以及它是否擁有壓縮          |
| `ingest(params)`   | 方法     | 儲存單一訊息                                     |
| `assemble(params)` | 方法     | 為模型執行建立上下文（傳回 `AssembleResult`）    |
| `compact(params)`  | 方法     | 摘要/縮減上下文                                  |

`assemble` 會傳回包含以下內容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要傳送給模型的有序訊息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎對組裝後上下文中總 Token 數的估算。OpenClaw 會將此用於壓縮閾值決策和診斷報告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系統提示。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制執行器針對預先溢位預檢使用哪個 Token 估算。預設為 `"assembled"`，也就是對於不擁有壓縮的引擎，只檢查組裝後提示的估算。設定 `ownsCompaction: true` 的引擎會管理自己的提示准入，因此 OpenClaw 預設會略過通用的提示前預檢。只有在你的組裝視圖可能隱藏底層逐字稿中的溢位風險時，才設定 `"preassembly_may_overflow"`；此時執行器會保持通用預檢啟用，並在判斷是否要預先壓縮時，取組裝後估算與組裝前（未視窗化）工作階段歷史估算的最大值。無論哪種方式，你傳回的訊息仍然是模型看到的內容 - `promptAuthority` 只會影響預檢。
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  針對具有持久後端對話串的主機（例如 Codex app-server）的可選投射生命週期。`mode: "thread_bootstrap"` 搭配穩定的 `epoch`，會要求主機每個 epoch 注入一次組裝後上下文，並重用後端對話串直到 epoch 變更，而不是每個回合都重新投射。一般每回合投射可省略此欄位。
</ParamField>

`compact` 會傳回 `CompactResult`。當壓縮輪替作用中的逐字稿時，`result.sessionId` 和 `result.sessionFile` 會識別下一次重試或回合必須使用的後繼工作階段。

可選成員：

| 成員                           | 種類   | 用途                                                                                                                               |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 為工作階段初始化引擎狀態。當引擎第一次看到工作階段時呼叫一次（例如匯入歷史）。                                                     |
| `maintain(params)`             | 方法   | 在啟動、成功回合或壓縮後進行逐字稿維護。使用 `runtimeContext.rewriteTranscriptEntries()` 進行安全改寫。                            |
| `ingestBatch(params)`          | 方法   | 將已完成回合作為批次擷取。在執行完成後呼叫，並一次傳入該回合的所有訊息。                                                           |
| `afterTurn(params)`            | 方法   | 執行後生命週期工作（持久化狀態、觸發背景壓縮）。                                                                                   |
| `prepareSubagentSpawn(params)` | 方法   | 在子工作階段開始前設定共享狀態。                                                                                                   |
| `onSubagentEnded(params)`      | 方法   | 在子代理結束後清理。                                                                                                               |
| `dispose()`                    | 方法   | 釋放資源。在閘道關閉或外掛重新載入期間呼叫 - 不是每個工作階段呼叫。                                                                |

### 執行階段設定

在 OpenClaw 內部執行的生命週期掛鉤會收到可選的
`runtimeSettings` 物件。它是一個有版本的唯讀內部生產者/消費者 API 表面：OpenClaw 會為所選的上下文引擎產生它，而上下文引擎會在生命週期掛鉤內消費它。它不會直接呈現給使用者，也不會建立專用的報告表面。

- `schemaVersion`：目前為 `1`
- `runtime`：OpenClaw 主機、執行階段模式（`normal`、`fallback` 或
  `degraded`），以及可選的測試框架/執行階段 ID
- `contextEngineSelection`：所選上下文引擎 ID 和選取來源
- `executionHost`：呼叫掛鉤的表面所用的主機 ID 和標籤
- `model`：要求的模型、解析後的模型、提供者，以及可選的模型系列
- `limits`：已知時的提示 Token 預算和最大輸出 Token
- `diagnostics`：已知時的封閉式後援與降級原因代碼

可能未知的欄位會表示為 `null`；辨別欄位（例如執行階段模式和選取來源）則維持不可為 null。較舊的引擎仍保持相容：如果嚴格的舊版引擎將 `runtimeSettings` 視為未知屬性而拒絕，OpenClaw 會在不隔離該引擎的情況下，不帶它重試生命週期呼叫。

### 主機需求

上下文引擎可以在 `info.hostRequirements` 上宣告主機能力需求。
OpenClaw 會在開始操作之前檢查這些需求，並在所選執行階段無法滿足需求時，以描述性錯誤封閉式失敗。

對於代理執行，當引擎必須透過 `assemble()` 控制實際模型提示時，請宣告 `assemble-before-prompt`：

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

原生 Codex 和 OpenClaw 內嵌代理執行會滿足 `assemble-before-prompt`。
通用命令列介面後端則不會，因此需要它的引擎會在命令列介面程序啟動前遭到拒絕。

### 失敗隔離

OpenClaw 會將所選外掛引擎與核心回覆路徑隔離。如果非舊版引擎遺失、合約驗證失敗、在 factory 建立期間擲出錯誤，或從生命週期方法擲出錯誤，OpenClaw 會針對目前的閘道程序隔離該引擎，並將上下文引擎工作降級到內建的 `legacy` 引擎。錯誤會連同失敗的操作一起記錄，讓操作者可以修復、更新或停用該外掛，而不會讓代理靜默無回應。

主機需求失敗則不同：當引擎宣告某個執行階段缺少必要能力時，OpenClaw 會在開始執行前封閉式失敗。這可保護那些若在不受支援的主機中執行就會破壞狀態的引擎。

### ownsCompaction

`ownsCompaction` 控制 OpenClaw 執行階段內建的嘗試中自動壓縮是否在該次執行中保持啟用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎擁有壓縮行為。OpenClaw 會為該次執行停用 OpenClaw 執行階段內建的自動壓縮和通用提示前溢位預檢，而引擎的 `compact()` 實作負責 `/compact`、供應商溢位復原壓縮，以及它想在 `afterTurn()` 中進行的任何主動壓縮。當引擎從 `assemble()` 回傳 `promptAuthority: "preassembly_may_overflow"` 時，OpenClaw 仍會執行提示前溢位保護機制。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw 執行階段內建的自動壓縮仍可能在提示執行期間執行，但主動引擎的 `compact()` 方法仍會被用於 `/compact` 和溢位復原。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不**表示 OpenClaw 會自動退回到舊版引擎的壓縮路徑。
</Warning>

這表示有兩種有效的外掛模式：

<Tabs>
  <Tab title="Owning mode">
    實作你自己的壓縮演算法，並設定 `ownsCompaction: true`。
  </Tab>
  <Tab title="Delegating mode">
    設定 `ownsCompaction: false`，並讓 `compact()` 呼叫來自 `openclaw/plugin-sdk/core` 的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 的內建壓縮行為。
  </Tab>
</Tabs>

對於主動的非擁有引擎，無操作的 `compact()` 並不安全，因為它會停用該引擎槽位的正常 `/compact` 和溢位復原壓縮路徑。

## 設定參考

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
該槽位在執行期間是獨占的 - 對於指定的執行或壓縮操作，只會解析一個已註冊的上下文引擎。其他已啟用的 `kind: "context-engine"` 外掛仍可載入並執行其註冊程式碼；`plugins.slots.contextEngine` 只會選擇 OpenClaw 在需要上下文引擎時要解析哪個已註冊的引擎 ID。
</Note>

<Note>
**外掛解除安裝：**當你解除安裝目前選為 `plugins.slots.contextEngine` 的外掛時，OpenClaw 會將槽位重設回預設值（`legacy`）。相同的重設行為也適用於 `plugins.slots.memory`。不需要手動編輯設定。
</Note>

## 與壓縮和記憶的關係

<AccordionGroup>
  <Accordion title="Compaction">
    壓縮是上下文引擎的其中一項職責。舊版引擎會委派給 OpenClaw 的內建摘要功能。外掛引擎可以實作任何壓縮策略（DAG 摘要、向量檢索等）。
  </Accordion>
  <Accordion title="Memory plugins">
    記憶外掛（`plugins.slots.memory`）與上下文引擎分離。記憶外掛提供搜尋/檢索；上下文引擎控制模型看到的內容。它們可以協同運作 - 上下文引擎可能會在組裝期間使用記憶外掛資料。想使用主動記憶提示路徑的外掛引擎，應優先使用來自 `openclaw/plugin-sdk/core` 的 `buildMemorySystemPromptAddition(...)`，它會將主動記憶提示區段轉換成可立即前置的 `systemPromptAddition`。如果引擎需要較低層級的控制，仍可透過 `buildActiveMemoryPromptSection(...)` 從 `openclaw/plugin-sdk/memory-host-core` 拉取原始行。
  </Accordion>
  <Accordion title="Session pruning">
    無論哪個上下文引擎處於作用中，修剪記憶體中的舊工具結果仍會執行。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 驗證你的引擎是否正確載入。
- 如果切換引擎，現有工作階段會繼續使用其目前歷史。新引擎會接管未來的執行。
- 引擎錯誤會被記錄，且所選外掛引擎會在目前的閘道程序中被隔離。OpenClaw 會針對使用者回合退回到 `legacy`，讓回覆可以繼續，但你仍應修復、更新、停用或解除安裝損壞的外掛。
- 開發時，使用 `openclaw plugins install -l ./my-engine` 連結本機外掛目錄而不進行複製。

## 相關

- [壓縮](/zh-TW/concepts/compaction) - 摘要長對話
- [上下文](/zh-TW/concepts/context) - 如何為代理回合建立上下文
- [外掛架構](/zh-TW/plugins/architecture) - 註冊上下文引擎外掛
- [外掛 manifest](/zh-TW/plugins/manifest) - 外掛 manifest 欄位
- [外掛](/zh-TW/tools/plugin) - 外掛概觀
