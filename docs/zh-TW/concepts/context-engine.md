---
read_when:
    - 您想了解 OpenClaw 如何組合模型上下文
    - 你正在舊版引擎與 Plugin 引擎之間切換
    - 你正在建置一個上下文引擎 Plugin
sidebarTitle: Context engine
summary: 上下文引擎：可插拔的上下文組裝、Compaction 與子代理生命週期
title: 上下文引擎
x-i18n:
    generated_at: "2026-04-30T02:59:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

A **上下文引擎** 控制 OpenClaw 如何為每次執行建立模型上下文：要包含哪些訊息、如何摘要較舊的歷史記錄，以及如何跨子代理邊界管理上下文。

OpenClaw 內建 `legacy` 引擎並預設使用它 — 大多數使用者永遠不需要變更這項設定。只有在你想要不同的組裝、Compaction 或跨會話回想行為時，才需要安裝並選取 Plugin 引擎。

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
    上下文引擎 Plugin 的安裝方式與任何其他 OpenClaw Plugin 相同。

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

每次 OpenClaw 執行模型提示時，上下文引擎都會參與四個生命週期點：

<AccordionGroup>
  <Accordion title="1. Ingest">
    在新訊息新增至會話時呼叫。引擎可以將訊息儲存或索引到自己的資料儲存區。
  </Accordion>
  <Accordion title="2. Assemble">
    在每次模型執行前呼叫。引擎會傳回一組有序訊息（以及選用的 `systemPromptAddition`），且內容符合 token 預算。
  </Accordion>
  <Accordion title="3. Compact">
    在上下文視窗已滿，或使用者執行 `/compact` 時呼叫。引擎會摘要較舊的歷史記錄以釋放空間。
  </Accordion>
  <Accordion title="4. After turn">
    在執行完成後呼叫。引擎可以持久化狀態、觸發背景 Compaction，或更新索引。
  </Accordion>
</AccordionGroup>

對於內建的非 ACP Codex harness，OpenClaw 會透過將組裝後的上下文投影到 Codex 開發者指示和目前回合提示中，套用相同的生命週期。Codex 仍擁有其原生執行緒歷史記錄和原生 compactor。

### 子代理生命週期（選用）

OpenClaw 會呼叫兩個選用的子代理生命週期 hook：

<ParamField path="prepareSubagentSpawn" type="method">
  在子執行開始前準備共享上下文狀態。此 hook 會接收父/子會話鍵、`contextMode`（`isolated` 或 `fork`）、可用的轉錄稿 id/檔案，以及選用的 TTL。如果它傳回 rollback handle，OpenClaw 會在準備成功後 spawn 失敗時呼叫它。
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  在子代理會話完成或被清掃時清理。
</ParamField>

### 系統提示附加內容

`assemble` 方法可以傳回 `systemPromptAddition` 字串。OpenClaw 會將此內容前置到該次執行的系統提示。這讓引擎能注入動態回想指引、檢索指示或具上下文感知的提示，而不需要靜態工作區檔案。

## legacy 引擎

內建的 `legacy` 引擎保留 OpenClaw 的原始行為：

- **Ingest**：無操作（會話管理器會直接處理訊息持久化）。
- **Assemble**：直通（runtime 中既有的 sanitize → validate → limit 管線會處理上下文組裝）。
- **Compact**：委派給內建的摘要 Compaction，它會為較舊訊息建立單一摘要，並保持近期訊息不變。
- **After turn**：無操作。

legacy 引擎不會註冊工具，也不會提供 `systemPromptAddition`。

當未設定 `plugins.slots.contextEngine`（或設為 `"legacy"`）時，系統會自動使用此引擎。

## Plugin 引擎

Plugin 可以使用 Plugin API 註冊上下文引擎：

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
值，讓 Plugin 可以在第一個生命週期 hook 執行前初始化每個代理或每個工作區的狀態。

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

| 成員               | 種類     | 用途                                           |
| ------------------ | -------- | ---------------------------------------------- |
| `info`             | 屬性     | 引擎 id、名稱、版本，以及它是否擁有 Compaction |
| `ingest(params)`   | 方法     | 儲存單一訊息                                   |
| `assemble(params)` | 方法     | 為模型執行建立上下文（傳回 `AssembleResult`） |
| `compact(params)`  | 方法     | 摘要/縮減上下文                                |

`assemble` 會傳回包含以下內容的 `AssembleResult`：

<ParamField path="messages" type="Message[]" required>
  要傳送給模型的有序訊息。
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  引擎對已組裝上下文中 token 總數的估計。OpenClaw 會將此用於 Compaction 閾值決策和診斷報告。
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  前置到系統提示。
</ParamField>

`compact` 會傳回 `CompactResult`。當 Compaction 輪替作用中
轉錄稿時，`result.sessionId` 和 `result.sessionFile` 會識別下一次重試或回合必須使用的後續
會話。

選用成員：

| 成員                           | 種類 | 用途                                                                                           |
| ------------------------------ | ---- | ---------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | 方法 | 為會話初始化引擎狀態。當引擎第一次看見某個會話時呼叫一次（例如匯入歷史記錄）。                 |
| `ingestBatch(params)`          | 方法 | 將已完成的回合作為批次擷取。在執行完成後呼叫，並一次帶入該回合的所有訊息。                     |
| `afterTurn(params)`            | 方法 | 執行後生命週期工作（持久化狀態、觸發背景 Compaction）。                                        |
| `prepareSubagentSpawn(params)` | 方法 | 在子會話開始前設定共享狀態。                                                                   |
| `onSubagentEnded(params)`      | 方法 | 在子代理結束後清理。                                                                           |
| `dispose()`                    | 方法 | 釋放資源。在 gateway 關閉或 Plugin 重新載入期間呼叫 — 不是每個會話都呼叫。                     |

### ownsCompaction

`ownsCompaction` 控制 Pi 內建的嘗試中自動 Compaction 是否在該次執行中保持啟用：

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    引擎擁有 Compaction 行為。OpenClaw 會在該次執行中停用 Pi 內建的自動 Compaction，而引擎的 `compact()` 實作需負責 `/compact`、溢位復原 Compaction，以及它想在 `afterTurn()` 中執行的任何主動 Compaction。OpenClaw 仍可能執行提示前溢位保護；當它預測完整轉錄稿將會溢位時，復原路徑會在提交另一個提示前呼叫作用中引擎的 `compact()`。
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Pi 內建的自動 Compaction 仍可能在提示執行期間執行，但作用中引擎的 `compact()` 方法仍會針對 `/compact` 和溢位復原被呼叫。
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **不** 代表 OpenClaw 會自動退回到 legacy 引擎的 Compaction 路徑。
</Warning>

這表示有兩種有效的 Plugin 模式：

<Tabs>
  <Tab title="Owning mode">
    實作你自己的 Compaction 演算法，並設定 `ownsCompaction: true`。
  </Tab>
  <Tab title="Delegating mode">
    設定 `ownsCompaction: false`，並讓 `compact()` 呼叫 `openclaw/plugin-sdk/core` 中的 `delegateCompactionToRuntime(...)`，以使用 OpenClaw 內建的 Compaction 行為。
  </Tab>
</Tabs>

對作用中的非擁有引擎而言，無操作的 `compact()` 並不安全，因為它會停用該引擎 slot 的正常 `/compact` 和溢位復原 Compaction 路徑。

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
此 slot 在執行時是互斥的 — 對於指定的執行或 Compaction 操作，只會解析一個已註冊的上下文引擎。其他已啟用的 `kind: "context-engine"` Plugin 仍可載入並執行其註冊程式碼；`plugins.slots.contextEngine` 只會選取 OpenClaw 在需要上下文引擎時要解析的已註冊引擎 id。
</Note>

<Note>
**Plugin 解除安裝：** 當你解除安裝目前選為 `plugins.slots.contextEngine` 的 Plugin 時，OpenClaw 會將該 slot 重設回預設值（`legacy`）。相同的重設行為也適用於 `plugins.slots.memory`。不需要手動編輯設定。
</Note>

## 與 Compaction 和記憶的關係

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction 是上下文引擎的一項職責。舊版引擎會委派給 OpenClaw 內建的摘要功能。Plugin 引擎可以實作任何壓縮策略（DAG 摘要、向量檢索等）。
  </Accordion>
  <Accordion title="記憶 Plugin">
    記憶 Plugin（`plugins.slots.memory`）與上下文引擎是分開的。記憶 Plugin 提供搜尋/檢索；上下文引擎控制模型會看到什麼。它們可以一起運作 — 上下文引擎可能會在組裝期間使用記憶 Plugin 資料。想要使用 Active Memory 提示路徑的 Plugin 引擎，應優先使用 `openclaw/plugin-sdk/core` 中的 `buildMemorySystemPromptAddition(...)`，它會將 Active Memory 提示區段轉換為可直接前置的 `systemPromptAddition`。如果引擎需要較低階的控制，仍可透過 `buildActiveMemoryPromptSection(...)` 從 `openclaw/plugin-sdk/memory-host-core` 拉取原始行。
  </Accordion>
  <Accordion title="工作階段修剪">
    無論目前啟用哪個上下文引擎，仍會執行記憶體內舊工具結果的修剪。
  </Accordion>
</AccordionGroup>

## 提示

- 使用 `openclaw doctor` 驗證你的引擎是否正確載入。
- 如果切換引擎，現有工作階段會繼續使用其目前歷史。新引擎會接手未來的執行。
- 引擎錯誤會被記錄並顯示在診斷中。如果 Plugin 引擎註冊失敗，或無法解析所選引擎 ID，OpenClaw 不會自動回退；執行會持續失敗，直到你修正 Plugin 或將 `plugins.slots.contextEngine` 切回 `"legacy"`。
- 開發時，使用 `openclaw plugins install -l ./my-engine` 連結本機 Plugin 目錄，而不需複製。

## 相關

- [Compaction](/zh-TW/concepts/compaction) — 摘要長對話
- [上下文](/zh-TW/concepts/context) — 如何為代理回合建立上下文
- [Plugin 架構](/zh-TW/plugins/architecture) — 註冊上下文引擎 Plugin
- [Plugin manifest](/zh-TW/plugins/manifest) — Plugin manifest 欄位
- [Plugin](/zh-TW/tools/plugin) — Plugin 概覽
