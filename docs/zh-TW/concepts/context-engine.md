---
read_when:
    - 你想了解 OpenClaw 如何組合模型上下文
    - 你正在舊版引擎與外掛引擎之間切換
    - 你正在建構一個情境引擎外掛
sidebarTitle: Context engine
summary: 情境引擎：可插拔的情境組裝、壓縮與子代理生命週期
title: 上下文引擎
x-i18n:
    generated_at: "2026-07-12T14:25:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

**上下文引擎**控制 OpenClaw 如何為每次執行建立模型上下文：要包含哪些訊息、如何摘要較舊的歷史記錄，以及如何跨子代理邊界管理上下文。

OpenClaw 內建 `legacy` 引擎，並預設使用它。只有當你需要不同的組裝、壓縮或跨工作階段回憶行為時，才安裝並選取外掛引擎。

## 快速開始

<Steps>
  <Step title="檢查目前使用的引擎">
    ```bash
    openclaw doctor
    # 或直接檢查設定：
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="安裝外掛引擎">
    上下文引擎外掛的安裝方式與任何其他 OpenClaw 外掛相同。

    <Tabs>
      <Tab title="從 npm 安裝">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="從本機路徑安裝">
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
          contextEngine: "lossless-claw", // 必須符合外掛註冊的引擎 id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // 外掛專屬設定放在這裡（請參閱外掛文件）
          },
        },
      },
    }
    ```

    安裝並完成設定後，重新啟動閘道。

  </Step>
  <Step title="切換回 legacy（選用）">
    將 `contextEngine` 設為 `"legacy"`（或完全移除此鍵；`"legacy"` 是預設值）。
  </Step>
</Steps>

## 運作方式

每當 OpenClaw 執行模型提示詞時，上下文引擎會參與四個生命週期階段：

<AccordionGroup>
  <Accordion title="1. 擷取">
    新訊息加入工作階段時呼叫。引擎可以將訊息儲存至自己的資料儲存區或建立索引。
  </Accordion>
  <Accordion title="2. 組裝">
    每次模型執行前呼叫。引擎會傳回符合權杖預算的有序訊息集合（以及選用的 `systemPromptAddition`）。
  </Accordion>
  <Accordion title="3. 壓縮">
    上下文視窗已滿或使用者執行 `/compact` 時呼叫。引擎會摘要較舊的歷史記錄以釋出空間。
  </Accordion>
  <Accordion title="4. 回合後">
    執行完成後呼叫。引擎可以保存狀態、觸發背景壓縮或更新索引。
  </Accordion>
</AccordionGroup>

引擎也可以實作選用的 `maintain()` 方法，在啟動載入、成功完成回合或壓縮後維護逐字記錄（透過 `runtimeContext.rewriteTranscriptEntries()` 安全地重寫）。設定 `info.turnMaintenanceMode: "background"` 可將其作為延後工作執行，而不會阻塞回覆。

對於隨附的非 ACP Codex 控制框架，OpenClaw 會將組裝後的上下文投射至 Codex 開發人員指示與目前回合提示詞，以套用相同的生命週期。Codex 仍負責管理其原生執行緒歷史記錄與原生壓縮器。

### 子代理生命週期（選用）

OpenClaw 會呼叫兩個選用的子代理生命週期掛鉤：

<ParamField path="prepareSubagentSpawn" type="method">
  在子執行開始前準備共用上下文狀態。此掛鉤會收到父項／子項工作階段鍵、`contextMode`（`isolated` 或 `fork`）、可用的逐字記錄 id／檔案，以及選用的 TTL。如果它傳回復原控制代碼，OpenClaw 會在準備成功後產生失敗時呼叫該控制代碼。要求 `lightContext` 且解析為 `contextMode="isolated"` 的原生子代理產生作業會刻意略過此掛鉤，讓子代理從輕量啟動載入上下文開始，而不使用上下文引擎管理的產生前狀態。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子代理工作階段完成或被清除時進行清理。
</ParamField>

### 系統提示詞附加內容

`assemble` 方法可以傳回 `systemPromptAddition` 字串。OpenClaw 會將它加到該次執行的系統提示詞前方。這讓引擎無須依賴靜態工作區檔案，即可注入動態回憶指引、擷取指示或具上下文感知能力的提示。

## legacy 引擎

內建的 `legacy` 引擎會保留 OpenClaw 的原始行為：

- **擷取**：不執行任何作業（工作階段管理員會直接處理訊息持久化）。
- **組裝**：直接傳遞（執行階段中現有的清理 → 驗證 → 限制管線會處理上下文組裝）。
- **壓縮**：委派給內建的摘要壓縮功能，此功能會將較舊的訊息建立為單一摘要，並完整保留近期訊息。
- **回合後**：不執行任何作業。

legacy 引擎不會註冊工具，也不會提供 `systemPromptAddition`。

未設定 `plugins.slots.contextEngine`（或將其設為 `"legacy"`）時，會自動使用此引擎。

## 外掛引擎

外掛可以使用外掛 API 註冊上下文引擎：

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // 將訊息儲存至你的資料儲存區
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // 傳回符合預算的訊息
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // 摘要較舊的上下文
      return { ok: true, compacted: true };
    },
  }));
}
```

工廠函式的 `ctx` 包含選用的 `config`、`agentDir` 和 `workspaceDir`
值，讓外掛能在第一個生命週期掛鉤執行前，初始化各代理或各工作區的狀態。

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

| 成員               | 種類 | 用途                                                     |
| ------------------ | ---- | -------------------------------------------------------- |
| `info`             | 屬性 | 引擎 id、名稱、版本，以及它是否負責壓縮                  |
| `ingest(params)`   | 方法 | 儲存單一訊息                                             |
| `assemble(params)` | 方法 | 為模型執行建立上下文（傳回 `AssembleResult`）            |
| `compact(params)`  | 方法 | 摘要／縮減上下文                                         |

`assemble` 會傳回包含下列項目的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要傳送給模型的有序訊息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎對組裝後上下文總權杖數的估計值。OpenClaw 會將此值用於壓縮閾值判斷與診斷報告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  加到系統提示詞前方。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制執行器在預先溢位檢查中使用哪個權杖估計值。預設為 `"assembled"`，表示對於不負責壓縮的引擎，只檢查已組裝提示詞的估計值。設定 `ownsCompaction: true` 的引擎會自行管理提示詞准入，因此 OpenClaw 預設會略過通用的提示詞前預先檢查。只有當組裝後的檢視可能隱藏底層逐字記錄的溢位風險時，才設定 `"preassembly_may_overflow"`；執行器接著會維持啟用通用預先檢查，並在判斷是否要預先壓縮時，採用組裝後估計值與組裝前（未套用視窗）的工作階段歷史記錄估計值兩者中的最大值。無論採用哪種方式，你傳回的訊息仍是模型會看到的內容；`promptAuthority` 只影響預先檢查。
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  適用於具有持久後端執行緒之主機的選用投射生命週期（例如 Codex app-server）。使用穩定 `epoch` 的 `mode: "thread_bootstrap"` 會要求主機在每個 epoch 注入一次組裝後的上下文，並重複使用後端執行緒，直到 epoch 變更，而不是在每個回合重新投射。一般的每回合投射請省略此欄位。
</ParamField>

`compact` 會傳回 `CompactResult`。當壓縮變更目前使用中的工作階段識別資訊時，`result.sessionTarget`（帶有工作階段識別資訊與儲存區範圍的型別化 `ContextEngineSessionTarget`）會識別下一次重試或回合必須使用的後繼工作階段；`result.sessionId` 則會映照後繼工作階段的 id。

選用成員：

| 成員                           | 種類 | 用途                                                                                                                   |
| ------------------------------ | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法 | 初始化工作階段的引擎狀態。引擎第一次看到工作階段時呼叫一次（例如匯入歷史記錄）。                                       |
| `maintain(params)`             | 方法 | 在啟動載入、成功完成回合或壓縮後維護逐字記錄。使用 `runtimeContext.rewriteTranscriptEntries()` 進行安全重寫。          |
| `ingestBatch(params)`          | 方法 | 以批次擷取已完成的回合。執行完成後呼叫，並一次提供該回合的所有訊息。                                                   |
| `afterTurn(params)`            | 方法 | 執行後的生命週期工作（保存狀態、觸發背景壓縮）。                                                                       |
| `prepareSubagentSpawn(params)` | 方法 | 在子工作階段開始前設定其共用狀態。                                                                                     |
| `onSubagentEnded(params)`      | 方法 | 在子代理結束後進行清理。                                                                                               |
| `dispose()`                    | 方法 | 釋放資源。在閘道關閉或重新載入外掛期間呼叫，而非針對每個工作階段呼叫。                                                 |

### 執行階段設定

在 OpenClaw 內執行的生命週期掛鉤會收到選用的
`runtimeSettings` 物件。它是具版本且唯讀的內部
生產者／消費者 API 介面：OpenClaw 會為所選上下文
引擎產生它，而上下文引擎會在生命週期掛鉤中使用它。它不會
直接呈現給使用者，也不會建立專用的報告介面。

- `schemaVersion`：目前為 `1`
- `runtime`：OpenClaw 主機、執行階段模式（`normal`、`fallback` 或
  `degraded`），以及選用的控制框架／執行階段 id
- `contextEngineSelection`：所選上下文引擎 id 與選取來源
- `executionHost`：叫用掛鉤之介面的主機 id 與標籤
- `model`：要求的模型、解析後的模型、供應商，以及選用的模型系列
- `limits`：已知時的提示詞權杖預算與最大輸出權杖數
- `diagnostics`：已知時的封閉式後援與降級原因代碼

可能為未知的欄位以 `null` 表示；執行階段模式和選取來源等辨別欄位仍不可為 null。舊版引擎仍維持相容：如果嚴格的舊版引擎因 `runtimeSettings` 是未知屬性而拒絕它，OpenClaw 會在不含該屬性的情況下重試生命週期呼叫，而不是隔離該引擎。

### 主機需求

情境引擎可以在 `info.hostRequirements` 上宣告主機能力需求。OpenClaw 會在開始作業前檢查這些需求；當所選執行階段無法滿足需求時，會拒絕執行並提供描述性錯誤。

對於代理程式執行，若引擎必須透過 `assemble()` 控制實際的模型提示詞，請宣告 `assemble-before-prompt`：

```ts
info: {
  id: "my-context-engine",
  name: "我的情境引擎",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "請使用原生 Codex 或 OpenClaw 內嵌執行階段，或選取舊版情境引擎。",
    },
  },
}
```

原生 Codex 和 OpenClaw 內嵌代理程式執行皆滿足 `assemble-before-prompt`。一般命令列介面後端則不滿足，因此需要此能力的引擎會在命令列介面程序啟動前遭到拒絕。

### 失敗隔離

OpenClaw 會將所選外掛引擎與核心回覆路徑隔離。若非舊版引擎缺失、未通過合約驗證、在建立工廠時擲回例外，或從生命週期方法擲回例外，OpenClaw 會在目前的閘道程序中隔離該引擎，並將情境引擎工作降級至內建的 `legacy` 引擎。錯誤會連同失敗的作業一起記錄，讓操作者可以修復、更新或停用外掛，而不會使代理程式停止回應。

主機需求失敗則有所不同：當引擎宣告執行階段缺少必要能力時，OpenClaw 會在開始執行前拒絕執行。這可保護那些若在不支援的主機中執行便會損毀狀態的引擎。

### ownsCompaction

`ownsCompaction` 控制該次執行是否仍啟用 OpenClaw 執行階段內建的單次嘗試內自動壓縮：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎負責壓縮行為。OpenClaw 會在該次執行中停用 OpenClaw 執行階段內建的自動壓縮與通用提示詞前溢位預檢，而引擎的 `compact()` 實作則負責 `/compact`、提供者溢位復原壓縮，以及它想在 `afterTurn()` 中執行的任何主動壓縮。當引擎從 `assemble()` 傳回 `promptAuthority: "preassembly_may_overflow"` 時，OpenClaw 仍會執行提示詞前溢位防護。
  </Accordion>
  <Accordion title="ownsCompaction: false 或未設定">
    OpenClaw 執行階段內建的自動壓縮仍可能在提示詞執行期間運作，但 `/compact` 和溢位復原仍會呼叫作用中引擎的 `compact()` 方法。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不**表示 OpenClaw 會自動回復使用舊版引擎的壓縮路徑。
</Warning>

這表示有兩種有效的外掛模式：

<Tabs>
  <Tab title="自主管理模式">
    實作你自己的壓縮演算法，並設定 `ownsCompaction: true`。
  </Tab>
  <Tab title="委派模式">
    設定 `ownsCompaction: false`，並讓 `compact()` 呼叫來自 `openclaw/plugin-sdk/core` 的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 內建的壓縮行為。
  </Tab>
</Tabs>

對作用中的非自主管理引擎而言，無操作的 `compact()` 並不安全，因為它會停用該引擎插槽的一般 `/compact` 與溢位復原壓縮路徑。

## 設定參考

```json5
{
  plugins: {
    slots: {
      // 選取作用中的情境引擎。預設值："legacy"。
      // 設為外掛 ID 以使用外掛引擎。
      contextEngine: "legacy",
    },
  },
}
```

<Note>
該插槽在執行階段具排他性——對於特定執行或壓縮作業，只會解析一個已註冊的情境引擎。其他已啟用的 `kind: "context-engine"` 外掛仍可載入並執行其註冊程式碼；`plugins.slots.contextEngine` 只會選取 OpenClaw 需要情境引擎時所解析的已註冊引擎 ID。
</Note>

<Note>
**解除安裝外掛：**當你解除安裝目前選為 `plugins.slots.contextEngine` 的外掛時，OpenClaw 會將插槽重設回預設值（`legacy`）。相同的重設行為也適用於 `plugins.slots.memory`。不需要手動編輯設定。
</Note>

## 與壓縮和記憶體的關係

<AccordionGroup>
  <Accordion title="壓縮">
    壓縮是情境引擎的其中一項職責。舊版引擎會委派給 OpenClaw 內建的摘要功能。外掛引擎可以實作任何壓縮策略（DAG 摘要、向量檢索等）。
  </Accordion>
  <Accordion title="記憶體外掛">
    記憶體外掛（`plugins.slots.memory`）與情境引擎彼此獨立。記憶體外掛提供搜尋／檢索；情境引擎則控制模型看到的內容。兩者可以協同運作——情境引擎可能會在組裝期間使用記憶體外掛資料。若外掛引擎想使用作用中的記憶體提示詞路徑，應優先使用來自 `openclaw/plugin-sdk/core` 的 `buildMemorySystemPromptAddition(...)`，它會將作用中的記憶體提示詞區段轉換為可直接前置的 `systemPromptAddition`。若引擎需要更低階的控制，仍可透過 `buildActiveMemoryPromptSection(...)` 從 `openclaw/plugin-sdk/memory-host-core` 擷取原始文字行。
  </Accordion>
  <Accordion title="工作階段修剪">
    無論哪個情境引擎處於作用中，仍會在記憶體內修剪舊的工具結果。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 驗證你的引擎是否正確載入。
- 切換引擎時，現有工作階段會沿用其目前的歷史記錄。新引擎會接管後續執行。
- 引擎錯誤會被記錄，且所選外掛引擎會在目前的閘道程序中遭到隔離。OpenClaw 會在使用者輪次回復使用 `legacy`，使回覆得以繼續，但你仍應修復、更新、停用或解除安裝故障的外掛。
- 開發時，請使用 `openclaw plugins install -l ./my-engine` 連結本機外掛目錄，而不進行複製。

## 相關內容

- [壓縮](/zh-TW/concepts/compaction)——摘要長篇對話
- [情境](/zh-TW/concepts/context)——如何為代理程式輪次建構情境
- [外掛架構](/zh-TW/plugins/architecture)——註冊情境引擎外掛
- [外掛資訊清單](/zh-TW/plugins/manifest)——外掛資訊清單欄位
- [外掛](/zh-TW/tools/plugin)——外掛概覽
