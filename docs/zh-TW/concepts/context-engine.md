---
read_when:
    - 你想了解 OpenClaw 如何組裝模型上下文
    - 你正在舊版引擎與外掛引擎之間切換
    - 你正在建置上下文引擎外掛
sidebarTitle: Context engine
summary: 情境引擎：可插拔的情境組裝、壓縮與子代理生命週期
title: 上下文引擎
x-i18n:
    generated_at: "2026-06-30T13:47:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

A **上下文引擎**會控制 OpenClaw 如何為每次執行建立模型上下文：要包含哪些訊息、如何摘要較早的歷史，以及如何跨子代理邊界管理上下文。

OpenClaw 隨附內建的 `legacy` 引擎，並預設使用它 - 大多數使用者永遠不需要變更這項設定。只有在你想要不同的組裝、壓縮或跨工作階段回憶行為時，才需要安裝並選擇外掛引擎。

## 快速開始

<Steps>
  <Step title="檢查目前啟用的引擎">
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
  <Step title="啟用並選擇引擎">
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

    安裝並設定後，請重新啟動閘道。

  </Step>
  <Step title="切回 legacy（選用）">
    將 `contextEngine` 設為 `"legacy"`（或完全移除該鍵 - `"legacy"` 是預設值）。
  </Step>
</Steps>

## 運作方式

每當 OpenClaw 執行模型提示時，上下文引擎會參與四個生命週期點：

<AccordionGroup>
  <Accordion title="1. 擷取">
    在新訊息加入工作階段時呼叫。引擎可以將訊息儲存或索引到自己的資料存放區。
  </Accordion>
  <Accordion title="2. 組裝">
    在每次模型執行前呼叫。引擎會回傳一組有序訊息（以及選用的 `systemPromptAddition`），且符合 token 預算。
  </Accordion>
  <Accordion title="3. 壓縮">
    在上下文視窗已滿，或使用者執行 `/compact` 時呼叫。引擎會摘要較早的歷史以釋放空間。
  </Accordion>
  <Accordion title="4. 回合之後">
    在一次執行完成後呼叫。引擎可以持久化狀態、觸發背景壓縮，或更新索引。
  </Accordion>
</AccordionGroup>

對於隨附的非 ACP Codex harness，OpenClaw 會將組裝後的上下文投射到 Codex 開發者指令與目前回合提示，以套用相同的生命週期。Codex 仍然擁有其原生執行緒歷史與原生壓縮器。

### 子代理生命週期（選用）

OpenClaw 會呼叫兩個選用的子代理生命週期鉤子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子執行開始前準備共享上下文狀態。此鉤子會接收父/子工作階段鍵、`contextMode`（`isolated` 或 `fork`）、可用的轉錄稿 id/檔案，以及選用的 TTL。若它回傳復原控制代碼，OpenClaw 會在準備成功後產生失敗時呼叫它。請求 `lightContext` 並解析為 `contextMode="isolated"` 的原生子代理產生會刻意略過此鉤子，讓子代理從輕量啟動上下文開始，而不帶有上下文引擎管理的預產生狀態。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子代理工作階段完成或被清掃時進行清理。
</ParamField>

### 系統提示附加內容

`assemble` 方法可以回傳 `systemPromptAddition` 字串。OpenClaw 會將其前置到該次執行的系統提示。這可讓引擎注入動態回憶指引、檢索指令，或具上下文感知的提示，而不需要靜態工作區檔案。

## legacy 引擎

內建的 `legacy` 引擎會保留 OpenClaw 的原始行為：

- **擷取**：無操作（工作階段管理器會直接處理訊息持久化）。
- **組裝**：直通（執行階段中既有的 sanitize → validate → limit 管線會處理上下文組裝）。
- **壓縮**：委派給內建的摘要壓縮，該壓縮會為較早訊息建立單一摘要，並保留近期訊息不變。
- **回合之後**：無操作。

legacy 引擎不會註冊工具，也不會提供 `systemPromptAddition`。

當未設定 `plugins.slots.contextEngine`（或設為 `"legacy"`）時，會自動使用此引擎。

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

工廠函式 `ctx` 包含選用的 `config`、`agentDir` 和 `workspaceDir`
值，因此外掛可以在第一個生命週期鉤子執行前，初始化每代理或每工作區狀態。

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

| 成員               | 種類     | 用途                                                   |
| ------------------ | -------- | ------------------------------------------------------ |
| `info`             | 屬性     | 引擎 id、名稱、版本，以及它是否擁有壓縮               |
| `ingest(params)`   | 方法     | 儲存單一訊息                                           |
| `assemble(params)` | 方法     | 為模型執行建立上下文（回傳 `AssembleResult`）          |
| `compact(params)`  | 方法     | 摘要/縮減上下文                                        |

`assemble` 會回傳包含下列內容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要傳送給模型的有序訊息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎對組裝後上下文總 token 數的估算。OpenClaw 會將其用於壓縮閾值決策與診斷報告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系統提示。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制執行器在預防性溢位預檢中使用哪個 token 估算。
  預設為 `"assembled"`，表示對於不擁有壓縮的引擎，只檢查組裝後提示的估算。
  設定 `ownsCompaction: true` 的引擎會自行管理提示准入，
  因此 OpenClaw 預設會略過通用的預提示預檢。只有在你的組裝視圖可能隱藏
  底層轉錄稿中的溢位風險時，才設定 `"preassembly_may_overflow"`；
  執行器之後會保持通用預檢啟用，並在決定是否預防性壓縮時，取組裝後估算與
  預組裝（未視窗化）工作階段歷史估算的最大值。
  無論哪種方式，你回傳的訊息仍然是模型會看到的內容 - `promptAuthority` 只會影響預檢。
</ParamField>

`compact` 會回傳 `CompactResult`。當壓縮輪替作用中的轉錄稿時，
`result.sessionId` 和 `result.sessionFile` 會識別下一次重試或回合必須使用的後續
工作階段。

選用成員：

| 成員                           | 種類   | 用途                                                                                              |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 初始化工作階段的引擎狀態。當引擎第一次看到工作階段時呼叫一次（例如匯入歷史）。                 |
| `ingestBatch(params)`          | 方法   | 以批次擷取已完成的回合。在執行完成後呼叫，並一次提供該回合的所有訊息。                         |
| `afterTurn(params)`            | 方法   | 執行後生命週期工作（持久化狀態、觸發背景壓縮）。                                                 |
| `prepareSubagentSpawn(params)` | 方法   | 在子工作階段開始前設定共享狀態。                                                                 |
| `onSubagentEnded(params)`      | 方法   | 在子代理結束後清理。                                                                             |
| `dispose()`                    | 方法   | 釋放資源。在閘道關閉或外掛重新載入期間呼叫 - 不是每個工作階段都會呼叫。                         |

### 執行階段設定

在 OpenClaw 內部執行的生命週期鉤子會接收選用的
`runtimeSettings` 物件。這是一個有版本、唯讀的內部
生產者/消費者 API 表面：OpenClaw 會為選定的上下文
引擎產生它，而上下文引擎會在生命週期鉤子中消費它。它不會
直接呈現給使用者，也不會建立專用的報告表面。

- `schemaVersion`：目前為 `1`
- `runtime`：OpenClaw 主機、執行階段模式（`normal`、`fallback` 或
  `degraded`），以及選用的 harness/執行階段 id
- `contextEngineSelection`：選定的上下文引擎 id 與選擇來源
- `executionHost`：呼叫鉤子的表面所使用的主機 id 與標籤
- `model`：請求的模型、解析後的模型、供應商，以及選用的模型系列
- `limits`：已知時的提示 token 預算與最大輸出 token 數
- `diagnostics`：已知時的封閉 fallback 與 degraded 原因代碼

可能未知的欄位會表示為 `null`；辨別欄位（例如執行階段模式與選擇來源）
會維持非 nullable。較舊的引擎仍保持相容：如果嚴格的 legacy 引擎將
`runtimeSettings` 視為未知屬性而拒絕，OpenClaw 會改為在不帶它的情況下重試
生命週期呼叫，而不是隔離該引擎。

### 主機需求

上下文引擎可以在 `info.hostRequirements` 上宣告主機能力需求。
OpenClaw 會在開始操作前檢查這些需求，並在選定的執行階段無法滿足時，以描述性錯誤
封閉失敗。

對於代理執行，當引擎必須透過 `assemble()` 控制實際模型提示時，
請宣告 `assemble-before-prompt`：

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

原生 Codex 與 OpenClaw 內嵌代理執行會滿足 `assemble-before-prompt`。
通用命令列介面後端則不會，因此需要此能力的引擎會在
命令列介面程序啟動前被拒絕。

### 失敗隔離

OpenClaw 會將選定的外掛引擎與核心回覆路徑隔離。如果某個非舊版引擎遺失、合約驗證失敗、在 factory 建立期間擲出錯誤，或從生命週期方法擲出錯誤，OpenClaw 會在目前的閘道程序中隔離該引擎，並將 context-engine 工作降級到內建的 `legacy` 引擎。錯誤會連同失敗的操作一起記錄，讓操作員可以修復、更新或停用外掛，而不會讓代理程式沉默。

主機需求失敗則不同：當引擎宣告某個執行環境缺少必要能力時，OpenClaw 會在開始執行前失敗並關閉。這能保護那些在不受支援的主機上執行時會損壞狀態的引擎。

### ownsCompaction

`ownsCompaction` 控制 OpenClaw runtime 內建的嘗試中自動壓縮是否在該次執行中保持啟用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎擁有壓縮行為。OpenClaw 會在該次執行中停用 OpenClaw runtime 內建的自動壓縮與通用的提示前溢位預檢，而引擎的 `compact()` 實作會負責 `/compact`、provider 溢位復原壓縮，以及它想在 `afterTurn()` 中執行的任何主動壓縮。當引擎從 `assemble()` 回傳 `promptAuthority: "preassembly_may_overflow"` 時，OpenClaw 仍會執行提示前溢位防護。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw runtime 內建的自動壓縮仍可能在提示執行期間執行，但作用中引擎的 `compact()` 方法仍會被用於 `/compact` 和溢位復原。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不**代表 OpenClaw 會自動退回到舊版引擎的壓縮路徑。
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

對作用中的非擁有引擎來說，無操作的 `compact()` 並不安全，因為它會停用該引擎槽位的正常 `/compact` 和溢位復原壓縮路徑。

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
此槽位在執行時是互斥的 - 對於指定的執行或壓縮操作，只會解析一個已註冊的 context engine。其他已啟用的 `kind: "context-engine"` 外掛仍可載入並執行其註冊程式碼；`plugins.slots.contextEngine` 只會選擇 OpenClaw 在需要 context engine 時要解析哪個已註冊的引擎 ID。
</Note>

<Note>
**外掛解除安裝：**當你解除安裝目前選為 `plugins.slots.contextEngine` 的外掛時，OpenClaw 會將槽位重設回預設值 (`legacy`)。相同的重設行為也適用於 `plugins.slots.memory`。不需要手動編輯設定。
</Note>

## 與壓縮和記憶的關係

<AccordionGroup>
  <Accordion title="Compaction">
    壓縮是 context engine 的職責之一。舊版引擎會委派給 OpenClaw 的內建摘要功能。外掛引擎可以實作任何壓縮策略（DAG 摘要、向量檢索等）。
  </Accordion>
  <Accordion title="Memory plugins">
    記憶外掛 (`plugins.slots.memory`) 與 context engine 是分開的。記憶外掛提供搜尋/檢索；context engine 控制模型看到的內容。它們可以協同運作 - context engine 可能會在組裝期間使用記憶外掛資料。想要使用作用中記憶提示路徑的外掛引擎，應優先使用來自 `openclaw/plugin-sdk/core` 的 `buildMemorySystemPromptAddition(...)`，它會將作用中的記憶提示區段轉換成可直接前置的 `systemPromptAddition`。如果引擎需要較低階的控制，仍可透過 `buildActiveMemoryPromptSection(...)` 從 `openclaw/plugin-sdk/memory-host-core` 拉取原始行。
  </Accordion>
  <Accordion title="Session pruning">
    無論哪個 context engine 處於作用中，記憶體中舊工具結果的裁剪仍會執行。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 驗證你的引擎是否正確載入。
- 如果切換引擎，現有工作階段會以其目前歷史繼續。新引擎會接手未來的執行。
- 引擎錯誤會被記錄，且選定的外掛引擎會在目前的閘道程序中被隔離。OpenClaw 會針對使用者回合退回到 `legacy`，讓回覆可以繼續，但你仍應修復、更新、停用或解除安裝損壞的外掛。
- 開發時，使用 `openclaw plugins install -l ./my-engine` 連結本機外掛目錄，而不必複製。

## 相關

- [壓縮](/zh-TW/concepts/compaction) - 摘要長對話
- [脈絡](/zh-TW/concepts/context) - 代理程式回合的脈絡如何建立
- [外掛架構](/zh-TW/plugins/architecture) - 註冊 context engine 外掛
- [外掛資訊清單](/zh-TW/plugins/manifest) - 外掛資訊清單欄位
- [外掛](/zh-TW/tools/plugin) - 外掛概覽
