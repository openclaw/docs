---
read_when:
    - 你想瞭解 OpenClaw 如何組合模型上下文
    - 你正在舊版引擎與外掛引擎之間切換
    - 你正在建構一個內容脈絡引擎外掛
sidebarTitle: Context engine
summary: 上下文引擎：可插拔的上下文組裝、壓縮與子代理生命週期
title: 上下文引擎
x-i18n:
    generated_at: "2026-07-20T00:46:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 721780790dacebec44e3c7540b225bd853ee66bf5ae066b84df4344614d93a62
    source_path: concepts/context-engine.md
    workflow: 16
---

**上下文引擎**控制 OpenClaw 如何為每次執行建立模型上下文：要納入哪些訊息、如何摘要較舊的歷史記錄，以及如何跨子代理邊界管理上下文。

OpenClaw 內建 `legacy` 引擎，並預設使用該引擎。只有在需要不同的組裝、壓縮或跨工作階段回憶行為時，才安裝並選取外掛引擎。

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

    安裝並完成設定後，請重新啟動閘道。

  </Step>
  <Step title="切換回舊版引擎（選用）">
    將 `contextEngine` 設為 `"legacy"`（或完全移除此鍵值——`"legacy"` 是預設值）。
  </Step>
</Steps>

## 運作方式

每當 OpenClaw 執行模型提示詞時，上下文引擎會參與四個生命週期階段：

<AccordionGroup>
  <Accordion title="1. 擷取">
    新訊息加入工作階段時呼叫。引擎可將訊息儲存至自身的資料存放區或建立索引。
  </Accordion>
  <Accordion title="2. 組裝">
    每次執行模型前呼叫。引擎會傳回符合權杖預算的有序訊息集合（以及選用的 `systemPromptAddition`）。
  </Accordion>
  <Accordion title="3. 壓縮">
    上下文視窗已滿，或使用者執行 `/compact` 時呼叫。引擎會摘要較舊的歷史記錄以釋出空間。
  </Accordion>
  <Accordion title="4. 回合結束後">
    執行完成後呼叫。引擎可保存狀態、觸發背景壓縮或更新索引。
  </Accordion>
</AccordionGroup>

引擎也可以實作選用的 `maintain()` 方法，在啟動程序、成功完成回合或壓縮後維護逐字記錄（透過 `runtimeContext.rewriteTranscriptEntries()` 安全重寫）。設定 `info.turnMaintenanceMode: "background"` 可將其改為延後執行的工作，避免阻塞回覆。

對於隨附的非 ACP Codex 控制框架，OpenClaw 會將組裝完成的上下文投射至 Codex 開發人員指示與目前回合提示詞，以套用相同的生命週期。Codex 仍自行管理其原生執行緒歷史記錄與原生壓縮器。

### 子代理生命週期（選用）

OpenClaw 會呼叫兩個選用的子代理生命週期鉤子：

<ParamField path="prepareSubagentSpawn" type="method">
  在子執行開始前準備共用上下文狀態。此鉤子會接收父系／子系工作階段鍵、`contextMode`（`isolated` 或 `fork`）、可用的逐字記錄 id／檔案，以及選用的 TTL。如果此鉤子傳回復原控制代碼，OpenClaw 會在準備成功後產生失敗時呼叫該控制代碼。要求 `lightContext` 且解析為 `contextMode="isolated"` 的原生子代理產生作業會刻意略過此鉤子，讓子代理從輕量啟動上下文開始，而不使用上下文引擎管理的產生前狀態。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子代理工作階段完成或遭清除時進行清理。
</ParamField>

### 系統提示詞附加內容

`assemble` 方法可傳回 `systemPromptAddition` 字串。OpenClaw 會將此字串加至該次執行的系統提示詞之前。這讓引擎無須使用靜態工作區檔案，即可注入動態回憶指引、擷取指示或感知上下文的提示。

## 舊版引擎

內建的 `legacy` 引擎會保留 OpenClaw 的原始行為：

- **擷取**：不執行任何操作（工作階段管理員會直接處理訊息持久化）。
- **組裝**：直接傳遞（執行階段中現有的清理 → 驗證 → 限制流水線會處理上下文組裝）。
- **壓縮**：委派給內建的摘要壓縮功能，該功能會為較舊的訊息建立單一摘要，並完整保留最近的訊息。
- **回合結束後**：不執行任何操作。

舊版引擎不會註冊工具，也不會提供 `systemPromptAddition`。

未設定 `plugins.slots.contextEngine`（或設為 `"legacy"`）時，會自動使用此引擎。

## 外掛引擎

外掛可使用外掛 API 註冊上下文引擎：

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
      // 將訊息儲存至你的資料存放區
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

工廠函式 `ctx` 包含選用的 `config`、`agentDir` 與 `workspaceDir`
值，讓外掛可在第一次生命週期呼叫前，初始化個別代理或個別工作區的狀態。在非舊版的 `assemble()` 呼叫之前，主機會完成
已註冊的非同步記憶體提示詞準備。同步
`buildMemorySystemPromptAddition(...)` 輔助程式會讀取該不可變的執行快照；
請將所提供的工具、引用、代理與工作階段上下文原封不動地傳入。

接著在設定中啟用：

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

| 成員               | 種類     | 用途                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | 屬性 | 引擎 id、名稱、版本，以及是否由其負責壓縮 |
| `ingest(params)`   | 方法   | 儲存單一訊息                                   |
| `assemble(params)` | 方法   | 為模型執行建立上下文（傳回 `AssembleResult`） |
| `compact(params)`  | 方法   | 摘要／縮減上下文                                 |

`assemble` 會傳回包含以下內容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要傳送給模型的有序訊息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎對組裝後上下文總權杖數的估算值。OpenClaw 會將其用於壓縮臨界值判斷與診斷報告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  加至系統提示詞之前。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制執行器在預先溢位
  檢查中使用哪個權杖估算值。預設為 `"assembled"`，這表示對於不負責壓縮的引擎，
  僅檢查組裝後提示詞的估算值。
  設定 `ownsCompaction: true` 的引擎會自行管理提示詞准入，
  因此 OpenClaw 預設會略過一般的提示詞執行前檢查。只有在組裝後的檢視可能隱藏
  底層逐字記錄中的溢位風險時，才設定
  `"preassembly_may_overflow"`；如此一來，執行器會保持啟用一般
  預先檢查，並在判斷是否要
  預先壓縮時，取組裝後估算值與組裝前（未套用視窗）的工作階段歷史記錄估算值兩者中的最大值。
  無論採用哪種方式，你傳回的訊息仍是模型
  看到的內容——`promptAuthority` 只會影響預先檢查。
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  適用於具有持久性後端執行緒的主機（例如 Codex app-server）的選用投射生命週期。使用穩定 `epoch` 的 `mode: "thread_bootstrap"` 會要求主機在每個時期僅注入一次組裝後的上下文，並在時期變更前重複使用後端執行緒，而非每個回合都重新投射。一般的逐回合投射請省略此欄位。
</ParamField>

`compact` 會傳回 `CompactResult`。壓縮變更作用中工作階段
識別資訊時，`result.sessionTarget`（帶有
工作階段識別資訊與存放區範圍的型別化 `ContextEngineSessionTarget`）會識別下一次重試或回合
必須使用的後繼工作階段；`result.sessionId` 會反映後繼工作階段 id。

選用成員：

| 成員                           | 種類   | 用途                                                                                                                                         |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法 | 初始化工作階段的引擎狀態。引擎第一次看到工作階段時呼叫一次（例如匯入歷史記錄）。                              |
| `maintain(params)`             | 方法 | 在啟動程序、成功完成回合或壓縮後維護逐字記錄。使用 `runtimeContext.rewriteTranscriptEntries()` 進行安全重寫。 |
| `ingestBatch(params)`          | 方法 | 以批次方式擷取已完成的回合。執行完成後呼叫，一次傳入該回合的所有訊息。                                  |
| `afterTurn(params)`            | 方法 | 執行後的生命週期工作（保存狀態、觸發背景壓縮）。                                                                      |
| `prepareSubagentSpawn(params)` | 方法 | 在子工作階段開始前設定其共用狀態。                                                                                    |
| `onSubagentEnded(params)`      | 方法 | 子代理結束後進行清理。                                                                                                              |
| `dispose()`                    | 方法 | 釋放資源。在閘道關閉或重新載入外掛期間呼叫，而非針對個別工作階段呼叫。                                                        |

### 執行階段設定

在 OpenClaw 內執行的生命週期鉤子會收到選用的
`runtimeSettings` 物件。這是一個有版本、唯讀的內部
生產者／消費者 API 介面：OpenClaw 會為所選的上下文
引擎產生該物件，而上下文引擎則在生命週期鉤子內使用它。此物件不會
直接呈現給使用者，也不會建立專用的報告介面。

- `schemaVersion`：目前為 `1`
- `runtime`：OpenClaw 主機、執行階段模式（`normal`、`fallback` 或
  `degraded`），以及選用的測試框架／執行階段 ID
- `contextEngineSelection`：所選的上下文引擎 ID 與選取來源
- `executionHost`：叫用掛鉤之介面的主機 ID 與標籤
- `model`：要求的模型、解析後的模型、供應商，以及選用的模型系列
- `limits`：已知時的提示詞權杖預算與最大輸出權杖數
- `diagnostics`：已知時的封閉式後援與降級原因代碼

可能未知的欄位以 `null` 表示；執行階段模式與選取來源等
判別欄位仍不可為 null。舊版引擎仍維持相容性：如果嚴格的舊版引擎將
`runtimeSettings` 視為未知屬性而拒絕，OpenClaw 會在不含該屬性的情況下
重試生命週期呼叫，而不會隔離該引擎。

### 主機需求

上下文引擎可以在 `info.hostRequirements` 上宣告主機能力需求。
OpenClaw 會在開始操作前檢查這些需求；若所選執行階段無法滿足需求，
則會以描述性錯誤封閉失敗。

對於代理程式執行，當引擎必須透過 `assemble()` 控制
實際模型提示詞時，請宣告 `assemble-before-prompt`：

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "請使用原生 Codex 或 OpenClaw 內嵌執行階段，或選取舊版上下文引擎。",
    },
  },
}
```

原生 Codex 與 OpenClaw 內嵌代理程式執行可滿足 `assemble-before-prompt`。
一般命令列介面後端則不行，因此需要此能力的引擎會在命令列介面程序
啟動前遭到拒絕。

### 故障隔離

OpenClaw 會將所選的外掛引擎與核心回覆路徑隔離。如果非舊版引擎
不存在、未通過合約驗證、在建立工廠時擲回例外，或從生命週期方法
擲回例外，OpenClaw 會在目前的閘道程序中隔離該引擎，並將上下文引擎
工作降級至內建的 `legacy` 引擎。系統會連同失敗的操作記錄
錯誤，讓操作人員可修復、更新或停用外掛，而不會導致代理程式停止回應。

主機需求失敗則有所不同：當引擎宣告某個執行階段缺少必要能力時，
OpenClaw 會在開始執行前封閉失敗。這可保護那些若在不支援的主機中
執行便會破壞狀態的引擎。

### ownsCompaction

`ownsCompaction` 控制該次執行是否維持啟用 OpenClaw 執行階段內建的嘗試中自動壓縮：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎負責壓縮行為。OpenClaw 會針對該次執行停用 OpenClaw 執行階段內建的自動壓縮與一般提示詞前溢位預先檢查，而引擎的 `compact()` 實作需負責 `/compact`、供應商溢位復原壓縮，以及它想在 `afterTurn()` 中執行的任何主動壓縮。當引擎從 `assemble()` 傳回 `promptAuthority: "preassembly_may_overflow"` 時，OpenClaw 仍會執行提示詞前溢位保護措施。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw 執行階段內建的自動壓縮仍可能在提示詞執行期間運作，但仍會針對 `/compact` 與溢位復原呼叫作用中引擎的 `compact()` 方法。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不**表示 OpenClaw 會自動後援至舊版引擎的壓縮路徑。
</Warning>

這表示有兩種有效的外掛模式：

<Tabs>
  <Tab title="自主模式">
    實作自己的壓縮演算法，並設定 `ownsCompaction: true`。
  </Tab>
  <Tab title="委派模式">
    設定 `ownsCompaction: false`，並讓 `compact()` 呼叫 `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 的內建壓縮行為。
  </Tab>
</Tabs>

對於作用中的非自主引擎，無操作的 `compact()` 並不安全，因為它會停用該引擎插槽的一般 `/compact` 與溢位復原壓縮路徑。

## 設定參考

```json5
{
  plugins: {
    slots: {
      // 選取作用中的上下文引擎。預設值："legacy"。
      // 設為外掛 ID 以使用外掛引擎。
      contextEngine: "legacy",
    },
  },
}
```

<Note>
此插槽在執行階段具有排他性——對於指定的執行或壓縮操作，只會解析一個已註冊的上下文引擎。其他已啟用的 `kind: "context-engine"` 外掛仍可載入並執行其註冊程式碼；`plugins.slots.contextEngine` 只會選取 OpenClaw 在需要上下文引擎時所解析的已註冊引擎 ID。
</Note>

<Note>
**解除安裝外掛：**解除安裝目前選為 `plugins.slots.contextEngine` 的外掛時，OpenClaw 會將插槽重設回預設值（`legacy`）。相同的重設行為也適用於 `plugins.slots.memory`。不需要手動編輯設定。
</Note>

## 與壓縮及記憶體的關係

<AccordionGroup>
  <Accordion title="壓縮">
    壓縮是上下文引擎的其中一項職責。舊版引擎會委派給 OpenClaw 的內建摘要功能。外掛引擎可實作任何壓縮策略（DAG 摘要、向量擷取等）。
  </Accordion>
  <Accordion title="記憶體外掛">
    記憶體外掛（`plugins.slots.memory`）與上下文引擎彼此獨立。記憶體外掛提供搜尋／擷取功能；上下文引擎則控制模型可看到的內容。兩者可以協同運作——上下文引擎可能會在組合期間使用記憶體外掛資料。想使用作用中記憶體提示詞路徑的外掛引擎，應使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它會將主機準備的記憶體提示詞區段轉換為可直接前置的 `systemPromptAddition`，而不會公開記憶體外掛的配置。
  </Accordion>
  <Accordion title="工作階段修剪">
    無論哪個上下文引擎處於作用中，仍會在記憶體中修剪舊的工具結果。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 驗證你的引擎是否正確載入。
- 切換引擎時，現有工作階段會繼續使用其目前的歷程記錄。新引擎會接管未來的執行。
- 系統會記錄引擎錯誤，並在目前的閘道程序中隔離所選的外掛引擎。OpenClaw 會針對使用者回合後援至 `legacy`，使回覆得以繼續，但你仍應修復、更新、停用或解除安裝損壞的外掛。
- 進行開發時，使用 `openclaw plugins install -l ./my-engine` 連結本機外掛目錄，無須複製。

## 相關內容

- [壓縮](/zh-TW/concepts/compaction)——摘要長篇對話
- [上下文](/zh-TW/concepts/context)——如何為代理程式回合建構上下文
- [外掛架構](/zh-TW/plugins/architecture)——註冊上下文引擎外掛
- [外掛資訊清單](/zh-TW/plugins/manifest)——外掛資訊清單欄位
- [外掛](/zh-TW/tools/plugin)——外掛概覽
