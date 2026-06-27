---
read_when:
    - 你正在將 context-engine 生命週期行為接入 Codex harness
    - 你需要 lossless-claw 或另一個 context-engine 外掛，才能使用 codex/* 嵌入式測試框架工作階段
    - 你正在比較嵌入式 OpenClaw 與 Codex 應用程式伺服器的上下文行為
summary: 讓內建 Codex app-server 測試框架遵循 OpenClaw context-engine 外掛的規格
title: Codex Harness 情境引擎移植
x-i18n:
    generated_at: "2026-06-27T19:30:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## 狀態

草案實作規格。

## 目標

讓內建的 Codex 應用伺服器執行框架遵守與嵌入式 OpenClaw 回合已經遵守的相同 OpenClaw context-engine 生命週期合約。

使用提供者/模型 `agentRuntime.id: "codex"` 或 `codex/*` 模型的工作階段，仍應讓所選的 context-engine 外掛（例如 `lossless-claw`）在 Codex 應用伺服器邊界允許的範圍內，控制脈絡組裝、回合後擷取、維護，以及 OpenClaw 層級的壓縮政策。

## 非目標

- 不重新實作 Codex 應用伺服器內部。
- 不讓 Codex 原生執行緒壓縮產生 lossless-claw 摘要。
- 不要求非 Codex 模型使用 Codex 執行框架。
- 不變更 ACP/acpx 工作階段行為。本規格僅適用於非 ACP 的嵌入式代理執行框架路徑。
- 不讓第三方外掛註冊 Codex 應用伺服器擴充工廠；既有的內建外掛信任邊界維持不變。

## 目前架構

嵌入式執行迴圈會在每次執行中選取具體低階執行框架之前，解析已設定的 context engine 一次：

- `src/agents/embedded-agent-runner/run.ts`
  - 初始化 context-engine 外掛
  - 呼叫 `resolveContextEngine(params.config)`
  - 將 `contextEngine` 和 `contextTokenBudget` 傳入
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` 委派給所選的代理執行框架：

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex 應用伺服器執行框架由內建 Codex 外掛註冊：

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex 執行框架實作會收到與內建 OpenClaw 嘗試相同的 `EmbeddedRunAttemptParams`：

- `extensions/codex/src/app-server/run-attempt.ts`

這表示必要的掛鉤點位於 OpenClaw 控制的程式碼中。外部邊界是 Codex 應用伺服器協定本身：OpenClaw 可以控制傳送給 `thread/start`、`thread/resume` 和 `turn/start` 的內容，也可以觀察通知，但無法變更 Codex 的內部執行緒儲存區或原生壓縮器。

## 目前缺口

內建 OpenClaw 嘗試會直接呼叫 context-engine 生命週期：

- 嘗試前的啟動載入/維護
- 模型呼叫前的組裝
- 嘗試後的 afterTurn 或擷取
- 成功回合後的維護
- 由 engine 擁有壓縮時的 context-engine 壓縮

相關 OpenClaw 程式碼：

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex 應用伺服器嘗試目前會執行一般代理執行框架掛鉤並鏡像轉錄紀錄，但不會呼叫 `params.contextEngine.bootstrap`、`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、`params.contextEngine.ingestBatch`、`params.contextEngine.ingest` 或 `params.contextEngine.maintain`。

相關 Codex 程式碼：

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 期望行為

對於 Codex 執行框架回合，OpenClaw 應保留此生命週期：

1. 讀取鏡像的 OpenClaw 工作階段轉錄紀錄。
2. 當先前的工作階段檔案存在時，啟動載入作用中的 context engine。
3. 可用時執行啟動載入維護。
4. 使用作用中的 context engine 組裝脈絡。
5. 將組裝後的脈絡轉換為 Codex 相容輸入。
6. 以包含任何 context-engine `systemPromptAddition` 的開發者指示啟動或恢復 Codex 執行緒。
7. 以組裝後的使用者可見提示啟動 Codex 回合。
8. 將 Codex 結果鏡像回 OpenClaw 轉錄紀錄。
9. 若已實作則呼叫 `afterTurn`，否則使用鏡像轉錄紀錄快照呼叫 `ingestBatch`/`ingest`。
10. 在成功且未中止的回合後執行回合維護。
11. 保留 Codex 原生壓縮信號和 OpenClaw 壓縮掛鉤。

## 設計限制

### Codex 應用伺服器仍是原生執行緒狀態的權威來源

Codex 擁有其原生執行緒和任何內部延伸歷史。OpenClaw 不應嘗試透過受支援協定呼叫以外的方式變更應用伺服器的內部歷史。

OpenClaw 的轉錄紀錄鏡像仍是 OpenClaw 功能的來源：

- 聊天歷史
- 搜尋
- `/new` 和 `/reset` 簿記
- 未來模型或執行框架切換
- context-engine 外掛狀態

### Context engine 組裝必須投射到 Codex 輸入

context-engine 介面會回傳 OpenClaw `AgentMessage[]`，而不是 Codex 執行緒修補。Codex 應用伺服器 `turn/start` 接受目前使用者輸入，而 `thread/start` 和 `thread/resume` 接受開發者指示。

因此實作需要一個投射層。安全的第一版應避免假裝它能取代 Codex 內部歷史。它應將組裝後的脈絡作為目前回合周圍的確定性提示/開發者指示材料注入。

### 提示快取穩定性很重要

對於 lossless-claw 這類 engine，組裝後的脈絡對未變更的輸入應具備確定性。不要在產生的脈絡文字中加入時間戳記、隨機 ID 或非確定性排序。

### 執行階段選取語意不變

執行框架選取維持原狀：

- `runtime: "openclaw"` 選取內建 OpenClaw 執行框架
- `runtime: "codex"` 選取已註冊的 Codex 執行框架
- `runtime: "auto"` 讓外掛執行框架宣告支援的提供者
- 未符合的 `auto` 執行使用內建 OpenClaw 執行框架

此工作會變更 Codex 執行框架被選取之後發生的事情。

## 實作計畫

### 1. 匯出或搬移可重用的 context-engine 嘗試輔助工具

目前可重用的生命週期輔助工具位於嵌入式代理執行器底下：

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex 應匯入與執行框架無關的輔助工具，而不是深入依賴執行器實作細節。

建立與執行框架無關的模組，例如：

- `src/agents/harness/context-engine-lifecycle.ts`

搬移或重新匯出：

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- `runContextEngineMaintenance` 的小型包裝

在同一個 PR 中更新內建執行框架呼叫站點。

中立輔助工具名稱不應提及內建執行框架。

建議名稱：

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. 新增 Codex 脈絡投射輔助工具

新增模組：

- `extensions/codex/src/app-server/context-engine-projection.ts`

職責：

- 接受組裝後的 `AgentMessage[]`、原始鏡像歷史，以及目前提示。
- 判斷哪些脈絡屬於開發者指示，哪些屬於目前使用者輸入。
- 保留目前使用者提示作為最後的可執行請求。
- 以穩定、明確的格式轉譯先前訊息。
- 避免易變的中繼資料。

建議 API：

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

建議的第一版投射：

- 將 `systemPromptAddition` 放入開發者指示。
- 將組裝後的轉錄紀錄脈絡放在 `promptText` 中目前提示之前。
- 清楚標示為 OpenClaw 組裝脈絡。
- 保持目前提示在最後。
- 若目前使用者提示已出現在尾端，排除重複項。

範例提示形狀：

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

這不如原生 Codex 歷史手術優雅，但可在 OpenClaw 內實作，並保留 context-engine 語意。

未來改進：如果 Codex 應用伺服器公開用於取代或補充執行緒歷史的協定，則將此投射層改為使用該 API。

### 3. 在 Codex 執行緒啟動前接入啟動載入

在 `extensions/codex/src/app-server/run-attempt.ts` 中：

- 如目前一樣讀取鏡像工作階段歷史。
- 判斷此執行前工作階段檔案是否已存在。偏好使用在鏡像寫入前檢查 `fs.stat(params.sessionFile)` 的輔助工具。
- 開啟 `SessionManager`，或在輔助工具需要時使用窄版工作階段管理器配接器。
- 當 `params.contextEngine` 存在時呼叫中立啟動載入輔助工具。

偽流程：

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

使用與 Codex 工具橋接和轉錄紀錄鏡像相同的 `sessionKey` 慣例。今天 Codex 會從 `params.sessionKey` 或 `params.sessionId` 計算 `sandboxSessionKey`；除非有理由保留原始 `params.sessionKey`，否則請一致使用該值。

### 4. 在 `thread/start` / `thread/resume` 和 `turn/start` 前接入組裝

在 `runCodexAppServerAttempt` 中：

1. 先建置動態工具，讓 context engine 看見實際可用的工具名稱。
2. 讀取鏡像工作階段歷史。
3. 當 `params.contextEngine` 存在時執行 context-engine `assemble(...)`。
4. 將組裝結果投射為：
   - 開發者指示附加內容
   - `turn/start` 的提示文字

現有掛鉤呼叫：

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

應變成脈絡感知：

1. 使用 `buildDeveloperInstructions(params)` 計算基礎開發者指示
2. 套用 context-engine 組裝/投射
3. 對開發者指示附加/前置 `systemPromptAddition`
4. 將組裝後訊息投射到提示文字
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 將最終開發者指示傳給 `startOrResumeThread(...)`
7. 將最終提示文字傳給 `buildTurnStartParams(...)`

此順序讓一般提示掛鉤看到與 Codex 將收到相同的提示。如果需要嚴格 OpenClaw 對等，請在掛鉤組合之前執行 context-engine 組裝，因為內建執行框架會在提示管線之後，將 context-engine `systemPromptAddition` 套用到最終系統提示。重要不變條件是 context engine 與掛鉤都取得確定且有文件記載的順序。

建議第一版實作順序：

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. 將 `systemPromptAddition` 附加/前置到開發者指示
4. 將組裝後訊息投射到提示文字
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 將最終開發者指示傳給 `startOrResumeThread(...)`
7. 將最終提示文字傳給 `buildTurnStartParams(...)`

此規格應編碼在測試中，避免未來變更意外重新排序。

### 5. 保留提示快取穩定格式

投射輔助工具必須對相同輸入產生位元組穩定輸出：

- 穩定訊息順序
- 穩定角色標籤
- 不產生時間戳記
- 不洩漏物件鍵順序
- 不使用隨機分隔符
- 不使用逐次執行 ID

使用固定分隔符與明確章節。

### 6. 在轉錄紀錄鏡像後接入回合後處理

Codex 的 `CodexAppServerEventProjector` 會為目前回合建立本機 `messagesSnapshot`。`mirrorTranscriptBestEffort(...)` 會將該快照寫入 OpenClaw 轉錄鏡像。

鏡像寫入成功或失敗後，使用最佳可用訊息快照呼叫內容引擎 finalizer：

- 優先使用寫入後的完整鏡像工作階段內容，因為 `afterTurn` 預期的是工作階段快照，而不只是目前回合。
- 如果無法重新開啟工作階段檔案，則退回使用 `historyMessages + result.messagesSnapshot`。

偽流程：

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

如果鏡像失敗，仍要使用備援快照呼叫 `afterTurn`，但要記錄內容引擎正從備援回合資料擷取。

### 7. 標準化用量與提示快取執行階段內容

Codex 結果會在可用時包含來自 app-server token 通知的標準化用量。將該用量傳入內容引擎執行階段內容。

如果 Codex app-server 最終公開快取讀取/寫入細節，請將其對應到 `ContextEnginePromptCacheInfo`。在此之前，省略 `promptCache`，不要自行編造零值。

### 8. 壓縮政策

有兩套壓縮系統：

1. OpenClaw 內容引擎 `compact()`
2. Codex app-server 原生 `thread/compact/start`

不要默默將兩者混為一談。

#### `/compact` 與明確的 OpenClaw 壓縮

當所選內容引擎的 `info.ownsCompaction === true` 時，明確的 OpenClaw 壓縮應優先將內容引擎的 `compact()` 結果用於 OpenClaw 轉錄鏡像和外掛狀態。

當所選 Codex harness 有原生 thread 綁定時，我們可以另外要求 Codex 原生壓縮，以保持 app-server thread 健康，但這必須在 details 中回報為獨立的後端動作。

建議行為：

- 如果 `contextEngine.info.ownsCompaction === true`：
  - 先呼叫內容引擎 `compact()`
  - 然後在 thread 綁定存在時，以 best-effort 呼叫 Codex 原生壓縮
  - 將內容引擎結果作為主要結果回傳
  - 在 `details.codexNativeCompaction` 中包含 Codex 原生壓縮狀態
- 如果作用中的內容引擎不擁有壓縮：
  - 保留目前的 Codex 原生壓縮行為

這可能需要變更 `extensions/codex/src/app-server/compact.ts`，或從通用壓縮路徑包裝它，取決於 `maybeCompactAgentHarnessSession(...)` 的呼叫位置。

#### 回合內 Codex 原生 contextCompaction 事件

Codex 可能會在回合期間發出 `contextCompaction` item 事件。保留 `event-projector.ts` 中目前的壓縮前/後 hook 發送，但不要將其視為已完成的內容引擎壓縮。

對於擁有壓縮的引擎，當 Codex 仍執行原生壓縮時，發出明確診斷：

- stream/event 名稱：可接受現有的 `compaction` stream
- details：`{ backend: "codex-app-server", ownsCompaction: true }`

這會讓兩者的分離可稽核。

### 9. 工作階段重設與綁定行為

現有 Codex harness `reset(...)` 會從 OpenClaw 工作階段檔案清除 Codex app-server 綁定。保留該行為。

也要確保內容引擎狀態清理會繼續透過現有 OpenClaw 工作階段生命週期路徑執行。除非內容引擎生命週期目前對所有 harness 都遺漏 reset/delete 事件，否則不要新增 Codex 專屬清理。

### 10. 錯誤處理

遵循內建 OpenClaw 語義：

- bootstrap 失敗時警告並繼續
- assemble 失敗時警告，並退回未組裝的 pipeline 訊息/提示
- afterTurn/ingest 失敗時警告，並將回合後 finalization 標記為未成功
- maintenance 只在成功、未中止、非 yield 回合後執行
- 壓縮錯誤不應以全新提示重試

Codex 專屬新增項目：

- 如果內容投影失敗，警告並退回原始提示。
- 如果轉錄鏡像失敗，仍要嘗試使用備援訊息進行內容引擎 finalization。
- 如果 Codex 原生壓縮在內容引擎壓縮成功後失敗，且內容引擎是主要結果，不要讓整個 OpenClaw 壓縮失敗。

## 測試計畫

### 單元測試

在 `extensions/codex/src/app-server` 下新增測試：

1. `run-attempt.context-engine.test.ts`
   - 當工作階段檔案存在時，Codex 會呼叫 `bootstrap`。
   - Codex 會使用鏡像訊息、token 預算、工具名稱、citations 模式、模型 id 與提示呼叫 `assemble`。
   - `systemPromptAddition` 會包含在 developer instructions 中。
   - 組裝後的訊息會在目前請求前投影到提示中。
   - Codex 會在轉錄鏡像後呼叫 `afterTurn`。
   - 沒有 `afterTurn` 時，Codex 會呼叫 `ingestBatch` 或逐訊息 `ingest`。
   - 回合 maintenance 會在成功回合後執行。
   - 回合 maintenance 不會在提示錯誤、中止或 yield 中止時執行。

2. `context-engine-projection.test.ts`
   - 相同輸入產生穩定輸出
   - 當組裝後的歷史包含目前提示時，不會重複目前提示
   - 處理空歷史
   - 保留角色順序
   - 只在 developer instructions 中包含 system prompt addition

3. `compact.context-engine.test.ts`
   - 擁有壓縮的內容引擎主要結果勝出
   - 同時嘗試 Codex 原生壓縮時，狀態會出現在 details 中
   - Codex 原生失敗不會讓擁有壓縮的內容引擎壓縮失敗
   - 非擁有壓縮的內容引擎會保留目前的原生壓縮行為

### 要更新的現有測試

- `extensions/codex/src/app-server/run-attempt.test.ts` 若存在，否則更新最近的 Codex app-server run 測試。
- 只有在壓縮事件 details 變更時，才更新 `extensions/codex/src/app-server/event-projector.test.ts`。
- 除非設定行為變更，`src/agents/harness/selection.test.ts` 應不需要變更；它應保持穩定。
- 內建 harness 內容引擎測試應繼續原樣通過。

### 整合 / live 測試

新增或擴充 live Codex harness smoke 測試：

- 將 `plugins.slots.contextEngine` 設定為測試引擎
- 將 `agents.defaults.model` 設定為 `codex/*` 模型
- 設定 provider/model `agentRuntime.id = "codex"`
- 斷言測試引擎觀察到：
  - bootstrap
  - assemble
  - afterTurn 或 ingest
  - maintenance

避免在 OpenClaw core 測試中要求 lossless-claw。使用小型 repo 內 fake 內容引擎外掛。

## 可觀測性

在 Codex 內容引擎生命週期呼叫周圍新增 debug logs：

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` with reason
- `codex native compaction completed alongside context-engine compaction`

避免記錄完整提示或轉錄內容。

在有用時新增結構化欄位：

- `sessionId`
- `sessionKey` 依照現有 logging 慣例遮罩或省略
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## 遷移 / 相容性

這應該向後相容：

- 如果未設定內容引擎，舊版內容引擎行為應等同於目前的 Codex harness 行為。
- 如果內容引擎 `assemble` 失敗，Codex 應繼續使用原始提示路徑。
- 現有 Codex thread 綁定應維持有效。
- 動態工具 fingerprinting 不應包含內容引擎輸出；否則每次內容變更都可能強制建立新的 Codex thread。只有工具目錄應影響動態工具 fingerprint。

## 開放問題

1. 組裝後的內容應完全注入使用者提示、完全注入 developer instructions，還是分割？

   建議：分割。將 `systemPromptAddition` 放入 developer instructions；將組裝後的轉錄內容放入使用者提示 wrapper。這最符合目前的 Codex 協定，且不會改動原生 thread 歷史。

2. 當內容引擎擁有壓縮時，是否應停用 Codex 原生壓縮？

   建議：一開始不要。Codex 原生壓縮可能仍是保持 app-server thread 存活所必要的。但它必須回報為原生 Codex 壓縮，而不是內容引擎壓縮。

3. `before_prompt_build` 應在內容引擎組裝之前還是之後執行？

   建議：對 Codex 而言，在內容引擎投影之後執行，讓通用 harness hooks 看到 Codex 實際會收到的提示/developer instructions。如果內建 harness 對等性要求相反順序，請將選定順序編碼到測試中，並在此文件記錄。

4. Codex app-server 未來能否接受結構化 context/history override？

   未知。如果可以，請用該協定取代文字投影層，並保持生命週期呼叫不變。

## 驗收標準

- `codex/*` embedded harness 回合會呼叫所選內容引擎的 assemble 生命週期。
- 內容引擎 `systemPromptAddition` 會影響 Codex developer instructions。
- 組裝後的內容會以確定性方式影響 Codex 回合輸入。
- 成功的 Codex 回合會呼叫 `afterTurn` 或 ingest 備援。
- 成功的 Codex 回合會執行內容引擎回合 maintenance。
- 失敗/中止/yield 中止的回合不會執行回合 maintenance。
- 內容引擎擁有的壓縮對 OpenClaw/外掛狀態仍為主要結果。
- Codex 原生壓縮仍可作為原生 Codex 行為稽核。
- 現有內建 harness 內容引擎行為不變。
- 未選取非舊版內容引擎或組裝失敗時，現有 Codex harness 行為不變。
