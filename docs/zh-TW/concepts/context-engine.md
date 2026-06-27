---
read_when:
    - 你想了解 OpenClaw 如何組裝模型上下文
    - 你正在舊版引擎與外掛引擎之間切換
    - 你正在建置一個情境引擎外掛
sidebarTitle: Context engine
summary: 情境引擎：可插拔的情境組裝、壓縮與子代理生命週期
title: 情境引擎
x-i18n:
    generated_at: "2026-06-27T19:10:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

**上下文引擎**控制 OpenClaw 如何為每次執行建立模型上下文：要包含哪些訊息、如何摘要較舊的歷史紀錄，以及如何跨子代理邊界管理上下文。

OpenClaw 內建 `legacy` 引擎，並預設使用它 - 大多數使用者不需要變更此設定。只有在你想要不同的組裝、壓縮或跨工作階段回憶行為時，才需要安裝並選取外掛引擎。

## 快速開始

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    上下文引擎外掛的安裝方式與任何其他 OpenClaw 外掛相同。

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
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
  <Step title="Switch back to legacy (optional)">
    將 `contextEngine` 設為 `"legacy"`（或完全移除該鍵 - `"legacy"` 是預設值）。
  </Step>
</Steps>

## 運作方式

每當 OpenClaw 執行模型提示時，上下文引擎會參與四個生命週期點：

<AccordionGroup>
  <Accordion title="1. Ingest">
    在新訊息加入工作階段時呼叫。引擎可以將訊息儲存或索引到自己的資料存放區。
  </Accordion>
  <Accordion title="2. Assemble">
    在每次模型執行前呼叫。引擎會傳回一組有序訊息（以及選用的 `systemPromptAddition`），且必須符合權杖預算。
  </Accordion>
  <Accordion title="3. Compact">
    在上下文視窗已滿，或使用者執行 `/compact` 時呼叫。引擎會摘要較舊的歷史紀錄以釋放空間。
  </Accordion>
  <Accordion title="4. After turn">
    在一次執行完成後呼叫。引擎可以持久化狀態、觸發背景壓縮，或更新索引。
  </Accordion>
</AccordionGroup>

對於隨附的非 ACP Codex harness，OpenClaw 會透過將已組裝的上下文投射到 Codex 開發者指令與目前回合提示中，套用相同的生命週期。Codex 仍然擁有其原生執行緒歷史紀錄與原生壓縮器。

### 子代理生命週期（選用）

OpenClaw 會呼叫兩個選用的子代理生命週期鉤子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子執行開始前準備共享的上下文狀態。此鉤子會收到父/子工作階段鍵、`contextMode`（`isolated` 或 `fork`）、可用的轉錄 id/檔案，以及選用 TTL。若它傳回 rollback handle，OpenClaw 會在準備成功後產生失敗時呼叫它。請求 `lightContext` 並解析為 `contextMode="isolated"` 的原生子代理產生，會刻意略過此鉤子，讓子代理從輕量 bootstrap 上下文開始，而不帶有上下文引擎管理的產生前狀態。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子代理工作階段完成或被清掃時進行清理。
</ParamField>

### 系統提示附加內容

`assemble` 方法可以傳回 `systemPromptAddition` 字串。OpenClaw 會將它加到該次執行的系統提示前方。這讓引擎可以注入動態回憶指引、檢索指令或具上下文感知的提示，而不需要靜態工作區檔案。

## legacy 引擎

內建的 `legacy` 引擎會保留 OpenClaw 的原始行為：

- **擷取**：無操作（工作階段管理器會直接處理訊息持久化）。
- **組裝**：直通（執行階段中既有的清理 → 驗證 → 限制管線會處理上下文組裝）。
- **壓縮**：委派給內建的摘要壓縮，它會為較舊訊息建立單一摘要，並保留近期訊息不變。
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

factory `ctx` 包含選用的 `config`、`agentDir` 和 `workspaceDir`
值，讓外掛可以在第一個生命週期鉤子執行前初始化每代理或每工作區狀態。

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
| `info`             | 屬性     | 引擎 id、名稱、版本，以及是否擁有壓縮           |
| `ingest(params)`   | 方法     | 儲存單一訊息                                     |
| `assemble(params)` | 方法     | 為模型執行建立上下文（傳回 `AssembleResult`）   |
| `compact(params)`  | 方法     | 摘要/縮減上下文                                  |

`assemble` 會傳回包含下列內容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要傳送給模型的有序訊息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎對已組裝上下文中權杖總數的估計。OpenClaw 會用它進行壓縮門檻決策與診斷報告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  加到系統提示前方。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制 runner 在預先溢位預檢中使用哪個權杖估計值。預設為 `"assembled"`，表示只檢查已組裝提示的估計值 - 適用於傳回視窗化、自含上下文的引擎。只有當你的已組裝檢視可能隱藏底層轉錄中的溢位風險時，才設定為 `"preassembly_may_overflow"`；此時 runner 在決定是否預先壓縮時，會取已組裝估計值與組裝前（未視窗化）工作階段歷史估計值兩者的最大值。不論哪種方式，你傳回的訊息仍然是模型實際看到的內容 - `promptAuthority` 只會影響預檢。
</ParamField>

`compact` 會傳回 `CompactResult`。當壓縮輪替作用中的轉錄時，`result.sessionId` 和 `result.sessionFile` 會識別下一次重試或回合必須使用的後繼工作階段。

選用成員：

| 成員                           | 種類   | 用途                                                                                                   |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------ |
| `bootstrap(params)`            | 方法   | 為工作階段初始化引擎狀態。引擎第一次看到工作階段時呼叫一次（例如匯入歷史紀錄）。                     |
| `ingestBatch(params)`          | 方法   | 以批次擷取已完成的回合。在一次執行完成後呼叫，並一次帶入該回合的所有訊息。                           |
| `afterTurn(params)`            | 方法   | 執行後的生命週期工作（持久化狀態、觸發背景壓縮）。                                                   |
| `prepareSubagentSpawn(params)` | 方法   | 在子工作階段開始前設定共享狀態。                                                                     |
| `onSubagentEnded(params)`      | 方法   | 在子代理結束後清理。                                                                                 |
| `dispose()`                    | 方法   | 釋放資源。在閘道關閉或外掛重新載入期間呼叫 - 不是每個工作階段呼叫。                                  |

### 執行階段設定

在 OpenClaw 內部執行的生命週期鉤子會收到選用的
`runtimeSettings` 物件。它是具版本的唯讀內部
producer/consumer API 介面：OpenClaw 會為所選上下文引擎產生它，而上下文引擎會在生命週期鉤子內消費它。它不會直接呈現給使用者，也不會建立專用的報告介面。

- `schemaVersion`：目前為 `1`
- `runtime`：OpenClaw 主機、執行階段模式（`normal`、`fallback` 或
  `degraded`），以及選用的 harness/runtime id
- `contextEngineSelection`：所選上下文引擎 id 與選取來源
- `executionHost`：呼叫鉤子的介面主機 id 與標籤
- `model`：請求的模型、解析後的模型、提供者，以及選用的模型系列
- `limits`：已知時的提示權杖預算與最大輸出權杖數
- `diagnostics`：已知時的封閉 fallback 與 degraded 原因代碼

可能未知的欄位會表示為 `null`；執行階段模式與選取來源等鑑別欄位則保持不可為 null。較舊的引擎仍保持相容：如果嚴格的舊版引擎因為 `runtimeSettings` 是未知屬性而拒絕它，OpenClaw 會改為在不帶它的情況下重試生命週期呼叫，而不是隔離該引擎。

### 主機需求

上下文引擎可以在 `info.hostRequirements` 上宣告主機能力需求。
OpenClaw 會在開始操作前檢查這些需求，並在所選執行階段無法滿足需求時，以描述性錯誤封閉失敗。

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

原生 Codex 和 OpenClaw embedded 代理執行會滿足 `assemble-before-prompt`。
通用命令列介面後端則不會，因此需要它的引擎會在命令列介面程序啟動前遭到拒絕。

### 失敗隔離

OpenClaw 會將所選外掛引擎與核心回覆路徑隔離。如果非 legacy 引擎遺失、合約驗證失敗、在 factory 建立期間拋出錯誤，或從生命週期方法拋出錯誤，OpenClaw 會在目前閘道程序中隔離該引擎，並將上下文引擎工作降級為內建的 `legacy` 引擎。錯誤會連同失敗操作一起記錄，讓操作員可以修復、更新或停用外掛，而不會讓代理靜默無回應。

主機需求失敗則不同：當引擎宣告某個執行階段缺少必要能力時，OpenClaw 會在開始執行前封閉式失敗。這能保護那些如果在不受支援的主機中執行就會損毀狀態的引擎。

### ownsCompaction

`ownsCompaction` 控制 OpenClaw 執行階段內建的嘗試內自動壓縮是否在該次執行中保持啟用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎擁有壓縮行為。OpenClaw 會對該次執行停用 OpenClaw 執行階段內建的自動壓縮，而引擎的 `compact()` 實作負責 `/compact`、溢位復原壓縮，以及它想在 `afterTurn()` 中執行的任何主動壓縮。OpenClaw 仍可能執行提示前溢位保護；當它預測完整逐字稿會溢位時，復原路徑會在提交另一個提示前呼叫作用中引擎的 `compact()`。
  </Accordion>
  <Accordion title="ownsCompaction: false 或未設定">
    OpenClaw 執行階段內建的自動壓縮仍可能在提示執行期間執行，但作用中引擎的 `compact()` 方法仍會被用於 `/compact` 和溢位復原。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不**代表 OpenClaw 會自動退回到舊版引擎的壓縮路徑。
</Warning>

這表示有兩種有效的外掛模式：

<Tabs>
  <Tab title="擁有模式">
    實作你自己的壓縮演算法，並設定 `ownsCompaction: true`。
  </Tab>
  <Tab title="委派模式">
    設定 `ownsCompaction: false`，並讓 `compact()` 呼叫來自 `openclaw/plugin-sdk/core` 的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 的內建壓縮行為。
  </Tab>
</Tabs>

對於作用中的非擁有引擎，無操作的 `compact()` 並不安全，因為它會停用該引擎槽位正常的 `/compact` 和溢位復原壓縮路徑。

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
此槽位在執行時是互斥的 - 對於指定的執行或壓縮操作，只會解析一個已註冊的內容引擎。其他已啟用的 `kind: "context-engine"` 外掛仍可載入並執行其註冊程式碼；`plugins.slots.contextEngine` 只會選擇 OpenClaw 在需要內容引擎時要解析哪個已註冊的引擎 id。
</Note>

<Note>
**外掛解除安裝：**當你解除安裝目前被選為 `plugins.slots.contextEngine` 的外掛時，OpenClaw 會將槽位重設回預設值 (`legacy`)。相同的重設行為也適用於 `plugins.slots.memory`。不需要手動編輯設定。
</Note>

## 與壓縮和記憶體的關係

<AccordionGroup>
  <Accordion title="壓縮">
    壓縮是內容引擎的一項職責。舊版引擎會委派給 OpenClaw 的內建摘要功能。外掛引擎可以實作任何壓縮策略（DAG 摘要、向量檢索等）。
  </Accordion>
  <Accordion title="記憶體外掛">
    記憶體外掛 (`plugins.slots.memory`) 與內容引擎是分開的。記憶體外掛提供搜尋/檢索；內容引擎控制模型看到的內容。它們可以協同運作 - 內容引擎可能會在組裝期間使用記憶體外掛資料。想使用作用中記憶體提示路徑的外掛引擎，應優先使用來自 `openclaw/plugin-sdk/core` 的 `buildMemorySystemPromptAddition(...)`，它會將作用中的記憶體提示區段轉換為可直接前置的 `systemPromptAddition`。如果引擎需要較低階的控制，仍可透過 `buildActiveMemoryPromptSection(...)` 從 `openclaw/plugin-sdk/memory-host-core` 拉取原始行。
  </Accordion>
  <Accordion title="工作階段修剪">
    無論哪個內容引擎處於作用中，仍會在記憶體內修剪舊的工具結果。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 驗證你的引擎是否正確載入。
- 如果切換引擎，現有工作階段會以其目前歷史繼續。新引擎會接手未來的執行。
- 引擎錯誤會被記錄，且選取的外掛引擎會在目前的閘道程序中被隔離。OpenClaw 會對使用者回合退回到 `legacy`，讓回覆可以繼續，但你仍應修復、更新、停用或解除安裝損壞的外掛。
- 開發時，使用 `openclaw plugins install -l ./my-engine` 連結本機外掛目錄，而不需要複製。

## 相關

- [壓縮](/zh-TW/concepts/compaction) - 摘要長對話
- [內容](/zh-TW/concepts/context) - 如何為代理程式回合建立內容
- [外掛架構](/zh-TW/plugins/architecture) - 註冊內容引擎外掛
- [外掛 manifest](/zh-TW/plugins/manifest) - 外掛 manifest 欄位
- [外掛](/zh-TW/tools/plugin) - 外掛概觀
