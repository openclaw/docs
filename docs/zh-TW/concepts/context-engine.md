---
read_when:
    - 您想了解 OpenClaw 如何組合模型上下文
    - 你正在舊版引擎與 Plugin 引擎之間切換
    - 您正在建置一個上下文引擎 Plugin
sidebarTitle: Context engine
summary: 上下文引擎：可插拔的上下文組裝、Compaction 與子代理生命週期
title: 上下文引擎
x-i18n:
    generated_at: "2026-05-02T02:47:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

A **脈絡引擎** 控制 OpenClaw 如何為每次執行建立模型脈絡：要包含哪些訊息、如何摘要較舊的歷史，以及如何跨子代理邊界管理脈絡。

OpenClaw 隨附內建的 `legacy` 引擎，並預設使用它 — 大多數使用者永遠不需要變更這項設定。只有在你想要不同的組裝、Compaction 或跨工作階段回想行為時，才需要安裝並選取 Plugin 引擎。

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
    脈絡引擎 Plugin 的安裝方式和任何其他 OpenClaw Plugin 相同。

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

    安裝並設定後，重新啟動 Gateway。

  </Step>
  <Step title="Switch back to legacy (optional)">
    將 `contextEngine` 設為 `"legacy"`（或完全移除該鍵 — `"legacy"` 是預設值）。
  </Step>
</Steps>

## 運作方式

每次 OpenClaw 執行模型提示時，脈絡引擎會參與四個生命週期點：

<AccordionGroup>
  <Accordion title="1. Ingest">
    在新訊息加入工作階段時呼叫。引擎可以將該訊息儲存或索引到自己的資料儲存區。
  </Accordion>
  <Accordion title="2. Assemble">
    在每次模型執行前呼叫。引擎會傳回一組有序訊息（以及可選的 `systemPromptAddition`），且這些內容會符合權杖預算。
  </Accordion>
  <Accordion title="3. Compact">
    在脈絡視窗已滿，或使用者執行 `/compact` 時呼叫。引擎會摘要較舊的歷史以釋放空間。
  </Accordion>
  <Accordion title="4. After turn">
    在一次執行完成後呼叫。引擎可以持久化狀態、觸發背景 Compaction，或更新索引。
  </Accordion>
</AccordionGroup>

對於隨附的非 ACP Codex harness，OpenClaw 會透過將組裝好的脈絡投射到 Codex 開發者指令和目前回合提示中，套用相同的生命週期。Codex 仍擁有其原生執行緒歷史和原生 compactor。

### 子代理生命週期（選用）

OpenClaw 會呼叫兩個選用的子代理生命週期 hook：

<ParamField path="prepareSubagentSpawn" type="method">
  在子執行開始前準備共享脈絡狀態。此 hook 會接收父/子工作階段鍵、`contextMode`（`isolated` 或 `fork`）、可用的轉錄稿 id/檔案，以及選用 TTL。如果它傳回 rollback handle，OpenClaw 會在準備成功後 spawn 失敗時呼叫它。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子代理工作階段完成或被清掃時進行清理。
</ParamField>

### 系統提示附加內容

`assemble` 方法可以傳回 `systemPromptAddition` 字串。OpenClaw 會將其前置到該次執行的系統提示。這讓引擎能注入動態回想指引、擷取指令或脈絡感知提示，而不需要靜態工作區檔案。

## legacy 引擎

內建的 `legacy` 引擎會保留 OpenClaw 的原始行為：

- **擷取**：no-op（工作階段管理器會直接處理訊息持久化）。
- **組裝**：pass-through（執行階段中既有的 sanitize → validate → limit 管線會處理脈絡組裝）。
- **Compact**：委派給內建摘要 Compaction，這會建立較舊訊息的單一摘要，並保留最近訊息不變。
- **回合後**：no-op。

legacy 引擎不會註冊工具，也不會提供 `systemPromptAddition`。

當未設定 `plugins.slots.contextEngine`（或它設為 `"legacy"`）時，會自動使用此引擎。

## Plugin 引擎

Plugin 可以使用 Plugin API 註冊脈絡引擎：

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
值，因此 Plugin 可以在第一個生命週期 hook 執行前，初始化每個代理或每個工作區的狀態。

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

| 成員               | 種類     | 目的                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | 屬性     | 引擎 id、名稱、版本，以及它是否擁有 Compaction           |
| `ingest(params)`   | 方法     | 儲存單一訊息                                             |
| `assemble(params)` | 方法     | 為模型執行建立脈絡（傳回 `AssembleResult`）              |
| `compact(params)`  | 方法     | 摘要/縮減脈絡                                            |

`assemble` 會傳回含有下列內容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要傳送給模型的有序訊息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎對組裝後脈絡中總權杖數的估計。OpenClaw 會用它來做 Compaction 閾值決策和診斷報告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系統提示。
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  控制 runner 要使用哪個權杖估計來進行預防性溢位
  預檢。預設為 `"assembled"`，這表示只檢查組裝後
  提示的估計 — 適用於會傳回
  視窗化、自含式脈絡的引擎。只有當你的組裝視圖可能隱藏底層
  轉錄稿中的溢位風險時，才設定為 `"preassembly_may_overflow"`；
  之後 runner 在決定是否要預防性 compact 時，會取組裝後估計
  與組裝前（未視窗化）工作階段歷史估計的最大值。
  無論哪種方式，你傳回的訊息仍是
  模型會看到的內容 — `promptAuthority` 只會影響預檢。
</ParamField>

`compact` 會傳回 `CompactResult`。當 Compaction 輪替作用中的
轉錄稿時，`result.sessionId` 和 `result.sessionFile` 會識別後繼
工作階段，而下一次重試或回合必須使用它。

選用成員：

| 成員                           | 種類   | 目的                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法   | 為工作階段初始化引擎狀態。當引擎第一次看到工作階段時呼叫一次（例如匯入歷史）。                                  |
| `ingestBatch(params)`          | 方法   | 以批次擷取已完成的回合。在一次執行完成後呼叫，並一次提供該回合的所有訊息。                                      |
| `afterTurn(params)`            | 方法   | 執行後生命週期工作（持久化狀態、觸發背景 Compaction）。                                                         |
| `prepareSubagentSpawn(params)` | 方法   | 在子工作階段開始前設定共享狀態。                                                                                |
| `onSubagentEnded(params)`      | 方法   | 在子代理結束後進行清理。                                                                                        |
| `dispose()`                    | 方法   | 釋放資源。在 Gateway 關閉或 Plugin 重新載入期間呼叫 — 不是每個工作階段都會呼叫。                                |

### ownsCompaction

`ownsCompaction` 控制 Pi 內建的嘗試中自動 Compaction 是否在該次執行中保持啟用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎擁有 Compaction 行為。OpenClaw 會針對該次執行停用 Pi 內建的自動 Compaction，而引擎的 `compact()` 實作負責 `/compact`、溢位復原 Compaction，以及它想在 `afterTurn()` 中執行的任何主動 Compaction。OpenClaw 仍可能執行提示前溢位防護；當它預測完整轉錄稿會溢位時，復原路徑會先呼叫作用中引擎的 `compact()`，再提交另一個提示。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Pi 內建的自動 Compaction 仍可能在提示執行期間執行，但作用中引擎的 `compact()` 方法仍會針對 `/compact` 和溢位復原呼叫。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不** 表示 OpenClaw 會自動退回到 legacy 引擎的 Compaction 路徑。
</Warning>

這表示有兩種有效的 Plugin 模式：

<Tabs>
  <Tab title="Owning mode">
    實作你自己的 Compaction 演算法，並設定 `ownsCompaction: true`。
  </Tab>
  <Tab title="Delegating mode">
    設定 `ownsCompaction: false`，並讓 `compact()` 呼叫來自 `openclaw/plugin-sdk/core` 的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 內建的 Compaction 行為。
  </Tab>
</Tabs>

對於作用中的非擁有引擎，no-op 的 `compact()` 並不安全，因為它會停用該引擎槽位的正常 `/compact` 和溢位復原 Compaction 路徑。

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
此槽位在執行期間是獨占的 — 對於指定的執行或 Compaction 操作，只會解析一個已註冊的脈絡引擎。其他已啟用的 `kind: "context-engine"` Plugin 仍可載入並執行其註冊程式碼；`plugins.slots.contextEngine` 只會選取 OpenClaw 在需要脈絡引擎時要解析的已註冊引擎 id。
</Note>

<Note>
**Plugin 解除安裝：**當你解除安裝目前選為 `plugins.slots.contextEngine` 的 Plugin 時，OpenClaw 會將該槽位重設回預設值（`legacy`）。相同的重設行為也適用於 `plugins.slots.memory`。不需要手動編輯設定。
</Note>

## 與 Compaction 和記憶體的關係

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction 是內容引擎的其中一項職責。舊版引擎會委派給 OpenClaw 內建的摘要功能。Plugin 引擎可以實作任何 Compaction 策略（DAG 摘要、向量檢索等）。
  </Accordion>
  <Accordion title="Memory plugins">
    記憶體 Plugin（`plugins.slots.memory`）與內容引擎是分開的。記憶體 Plugin 提供搜尋／檢索；內容引擎控制模型會看到什麼。它們可以協同運作，例如內容引擎可能會在組裝期間使用記憶體 Plugin 資料。想使用 Active Memory 提示路徑的 Plugin 引擎，應優先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它會將 Active Memory 提示區段轉換成可直接前置的 `systemPromptAddition`。如果引擎需要較低階的控制，仍可透過 `buildActiveMemoryPromptSection(...)` 從 `openclaw/plugin-sdk/memory-host-core` 拉取原始行。
  </Accordion>
  <Accordion title="Session pruning">
    無論目前啟用的是哪個內容引擎，在記憶體中修剪舊工具結果仍會執行。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 確認你的引擎已正確載入。
- 如果切換引擎，既有工作階段會保留目前的歷史紀錄繼續執行。新引擎會接手未來的執行。
- 引擎錯誤會記錄並顯示在診斷資訊中。如果 Plugin 引擎註冊失敗，或無法解析選定的引擎 ID，OpenClaw 不會自動退回；在你修正 Plugin 或將 `plugins.slots.contextEngine` 切回 `"legacy"` 之前，執行都會失敗。
- 開發時，使用 `openclaw plugins install -l ./my-engine` 連結本機 Plugin 目錄，而不需要複製。

## 相關

- [Compaction](/zh-TW/concepts/compaction) — 摘要長對話
- [內容](/zh-TW/concepts/context) — 如何為代理回合建立內容
- [Plugin 架構](/zh-TW/plugins/architecture) — 註冊內容引擎 Plugin
- [Plugin manifest](/zh-TW/plugins/manifest) — Plugin manifest 欄位
- [Plugins](/zh-TW/tools/plugin) — Plugin 概觀
