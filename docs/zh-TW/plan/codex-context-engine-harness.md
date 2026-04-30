---
read_when:
    - 你正在將 context-engine 的生命週期行為接入 Codex 測試框架
    - 你需要 lossless-claw 或另一個 context-engine Plugin，才能使用 codex/* 嵌入式測試框架工作階段。
    - 你正在比較嵌入式 PI 與 Codex app-server 的上下文行為
summary: 讓隨附的 Codex app-server 測試架構支援 OpenClaw context-engine Plugin 的規格
title: Codex Harness 上下文引擎移植
x-i18n:
    generated_at: "2026-04-30T03:19:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## 狀態

草案實作規格。

## 目標

讓內建的 Codex 應用程式伺服器 harness 遵守與嵌入式 PI 回合已經遵守的相同 OpenClaw 上下文引擎生命週期合約。

使用 `agents.defaults.embeddedHarness.runtime: "codex"` 或 `codex/*` 模型的工作階段，仍應允許所選的上下文引擎 Plugin，例如 `lossless-claw`，在 Codex 應用程式伺服器邊界允許的範圍內，控制上下文組裝、回合後擷取、維護，以及 OpenClaw 層級的壓縮政策。

## 非目標

- 不重新實作 Codex 應用程式伺服器內部機制。
- 不讓 Codex 原生執行緒壓縮產生 `lossless-claw` 摘要。
- 不要求非 Codex 模型使用 Codex harness。
- 不變更 ACP/acpx 工作階段行為。此規格僅適用於非 ACP 嵌入式代理程式 harness 路徑。
- 不讓第三方 Plugin 註冊 Codex 應用程式伺服器擴充工廠；既有的內建 Plugin 信任邊界維持不變。

## 目前架構

嵌入式執行迴圈會在每次執行時先解析已設定的上下文引擎，再選擇具體的低階 harness：

- `src/agents/pi-embedded-runner/run.ts`
  - 初始化上下文引擎 Plugin
  - 呼叫 `resolveContextEngine(params.config)`
  - 將 `contextEngine` 和 `contextTokenBudget` 傳入 `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` 會委派給所選的代理程式 harness：

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex 應用程式伺服器 harness 由內建 Codex Plugin 註冊：

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex harness 實作會接收與 PI 支援的嘗試相同的 `EmbeddedRunAttemptParams`：

- `extensions/codex/src/app-server/run-attempt.ts`

這表示所需的掛鉤點位於 OpenClaw 控制的程式碼中。外部邊界是 Codex 應用程式伺服器通訊協定本身：OpenClaw 可以控制傳送給 `thread/start`、`thread/resume` 和 `turn/start` 的內容，也可以觀察通知，但無法變更 Codex 的內部執行緒儲存或原生壓縮器。

## 目前落差

嵌入式 PI 嘗試會直接呼叫上下文引擎生命週期：

- 嘗試前的啟動與維護
- 模型呼叫前的組裝
- 嘗試後的 afterTurn 或擷取
- 成功回合後的維護
- 由引擎擁有壓縮時的上下文引擎壓縮

相關 PI 程式碼：

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex 應用程式伺服器嘗試目前會執行通用代理程式 harness 掛鉤並鏡像轉錄紀錄，但不會呼叫 `params.contextEngine.bootstrap`、`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、`params.contextEngine.ingestBatch`、`params.contextEngine.ingest` 或 `params.contextEngine.maintain`。

相關 Codex 程式碼：

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 期望行為

對於 Codex harness 回合，OpenClaw 應保留此生命週期：

1. 讀取鏡像的 OpenClaw 工作階段轉錄紀錄。
2. 當前一個工作階段檔案存在時，啟動作用中的上下文引擎。
3. 可用時執行啟動維護。
4. 使用作用中的上下文引擎組裝上下文。
5. 將組裝後的上下文轉換為 Codex 相容的輸入。
6. 以包含任何上下文引擎 `systemPromptAddition` 的開發者指示，啟動或繼續 Codex 執行緒。
7. 使用組裝後的使用者可見提示啟動 Codex 回合。
8. 將 Codex 結果鏡像回 OpenClaw 轉錄紀錄。
9. 若已實作則呼叫 `afterTurn`，否則使用鏡像轉錄紀錄快照呼叫 `ingestBatch`/`ingest`。
10. 在成功且未中止的回合後執行回合維護。
11. 保留 Codex 原生壓縮信號與 OpenClaw 壓縮掛鉤。

## 設計限制

### Codex 應用程式伺服器仍是原生執行緒狀態的權威來源

Codex 擁有其原生執行緒與任何內部延伸歷史。OpenClaw 不應嘗試透過支援的通訊協定呼叫以外的方式改動應用程式伺服器的內部歷史。

OpenClaw 的轉錄紀錄鏡像仍是 OpenClaw 功能的來源：

- 聊天歷史
- 搜尋
- `/new` 和 `/reset` 記帳
- 未來的模型或 harness 切換
- 上下文引擎 Plugin 狀態

### 上下文引擎組裝必須投影到 Codex 輸入

上下文引擎介面會回傳 OpenClaw `AgentMessage[]`，而不是 Codex 執行緒修補。Codex 應用程式伺服器 `turn/start` 接受目前使用者輸入，而 `thread/start` 和 `thread/resume` 接受開發者指示。

因此實作需要一個投影層。安全的第一版應避免假裝能替換 Codex 內部歷史。它應在目前回合周圍，將組裝後的上下文注入為具決定性的提示與開發者指示內容。

### 提示快取穩定性很重要

對於像 `lossless-claw` 這類引擎，在輸入未變更時，組裝後的上下文應具決定性。不要在產生的上下文文字中加入時間戳記、隨機 ID 或非決定性排序。

### PI 後援語意不變

Harness 選擇維持原樣：

- `runtime: "pi"` 強制使用 PI
- `runtime: "codex"` 選擇已註冊的 Codex harness
- `runtime: "auto"` 讓 Plugin harness 認領支援的提供者
- `fallback: "none"` 在沒有相符 Plugin harness 時停用 PI 後援

此工作會變更 Codex harness 被選取之後發生的事情。

## 實作計畫

### 1. 匯出或搬移可重用的上下文引擎嘗試輔助工具

目前可重用的生命週期輔助工具位於 PI runner 底下：

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

若可避免，Codex 不應從名稱暗示 PI 的實作路徑匯入。

建立一個 harness 中立模組，例如：

- `src/agents/harness/context-engine-lifecycle.ts`

搬移或重新匯出：

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- 圍繞 `runContextEngineMaintenance` 的小型包裝器

透過從舊檔案重新匯出，或在同一個 PR 中更新 PI 呼叫點，維持 PI 匯入可用。

中立輔助工具名稱不應提及 PI。

建議名稱：

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. 新增 Codex 上下文投影輔助工具

新增模組：

- `extensions/codex/src/app-server/context-engine-projection.ts`

職責：

- 接受組裝後的 `AgentMessage[]`、原始鏡像歷史，以及目前提示。
- 判斷哪些上下文屬於開發者指示，哪些屬於目前使用者輸入。
- 保留目前使用者提示作為最後的可執行請求。
- 以穩定、明確的格式呈現先前訊息。
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

建議的第一版投影：

- 將 `systemPromptAddition` 放入開發者指示。
- 將組裝後的轉錄紀錄上下文放在 `promptText` 中目前提示之前。
- 清楚標示為 OpenClaw 組裝上下文。
- 保持目前提示在最後。
- 如果目前使用者提示已出現在尾端，則排除重複項。

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

這比原生 Codex 歷史手術不夠優雅，但可在 OpenClaw 內實作，且保留上下文引擎語意。

未來改進：如果 Codex 應用程式伺服器公開用於替換或補充執行緒歷史的通訊協定，就將此投影層改為使用該 API。

### 3. 在 Codex 執行緒啟動前串接啟動流程

在 `extensions/codex/src/app-server/run-attempt.ts` 中：

- 如同目前一樣讀取鏡像工作階段歷史。
- 判斷此執行前工作階段檔案是否已存在。優先使用在鏡像寫入前檢查 `fs.stat(params.sessionFile)` 的輔助工具。
- 開啟 `SessionManager`，或在輔助工具需要時使用窄範圍的工作階段管理器配接器。
- 當 `params.contextEngine` 存在時，呼叫中立啟動輔助工具。

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

使用與 Codex 工具橋接和轉錄紀錄鏡像相同的 `sessionKey` 慣例。如今 Codex 會從 `params.sessionKey` 或 `params.sessionId` 計算 `sandboxSessionKey`；除非有理由保留原始 `params.sessionKey`，否則一致使用它。

### 4. 在 `thread/start` / `thread/resume` 和 `turn/start` 前串接組裝

在 `runCodexAppServerAttempt` 中：

1. 先建置動態工具，讓上下文引擎看到實際可用的工具名稱。
2. 讀取鏡像工作階段歷史。
3. 當 `params.contextEngine` 存在時執行上下文引擎 `assemble(...)`。
4. 將組裝結果投影到：
   - 開發者指示追加內容
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

應改為具備上下文感知：

1. 使用 `buildDeveloperInstructions(params)` 計算基礎開發者指示
2. 套用上下文引擎組裝/投影
3. 以投影後的提示/開發者指示執行 `before_prompt_build`

此順序讓通用提示掛鉤看到與 Codex 將接收的相同提示。如果需要嚴格 PI 一致性，則在掛鉤組合前執行上下文引擎組裝，因為 PI 會在其提示管線之後，將上下文引擎 `systemPromptAddition` 套用到最終系統提示。重要不變條件是，上下文引擎與掛鉤兩者都取得具決定性且已文件化的順序。

第一版實作建議順序：

1. `buildDeveloperInstructions(params)`
2. 上下文引擎 `assemble()`
3. 將 `systemPromptAddition` 追加/前置到開發者指示
4. 將組裝後的訊息投影到提示文字
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 將最終開發者指示傳給 `startOrResumeThread(...)`
7. 將最終提示文字傳給 `buildTurnStartParams(...)`

此規格應編碼在測試中，避免未來變更意外重新排序。

### 5. 保留提示快取穩定格式

投影輔助工具必須對相同輸入產生位元組穩定的輸出：

- 穩定的訊息順序
- 穩定的角色標籤
- 無產生的時間戳記
- 無物件鍵順序洩漏
- 無隨機分隔符
- 無每次執行 ID

使用固定分隔符與明確區段。

### 6. 在轉錄紀錄鏡像後串接回合後處理

Codex 的 `CodexAppServerEventProjector` 會為目前回合建構本機 `messagesSnapshot`。`mirrorTranscriptBestEffort(...)` 會將該快照寫入 OpenClaw transcript mirror。

鏡像寫入成功或失敗後，請以可用的最佳訊息快照呼叫上下文引擎 finalizer：

- 寫入後優先使用完整的鏡像 session context，因為 `afterTurn`
  預期的是 session snapshot，而不只是目前回合。
- 如果 session file 無法重新開啟，則退回使用 `historyMessages + result.messagesSnapshot`。

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

如果鏡像失敗，仍要使用 fallback snapshot 呼叫 `afterTurn`，但記錄上下文引擎正從 fallback 回合資料擷取。

### 7. 正規化 usage 和 prompt-cache runtime context

Codex 結果在可用時會包含來自 app-server token notifications 的正規化 usage。將該 usage 傳入上下文引擎 runtime context。

如果 Codex app-server 最終公開 cache read/write 詳細資料，請將它們映射到 `ContextEnginePromptCacheInfo`。在此之前，請省略 `promptCache`，而不是捏造零值。

### 8. Compaction policy

有兩個 Compaction 系統：

1. OpenClaw 上下文引擎 `compact()`
2. Codex app-server 原生 `thread/compact/start`

不要無聲地將它們混為一談。

#### `/compact` 和明確的 OpenClaw Compaction

當選取的上下文引擎有 `info.ownsCompaction === true` 時，明確的 OpenClaw Compaction 應優先使用上下文引擎的 `compact()` 結果，用於 OpenClaw transcript mirror 和 Plugin 狀態。

當選取的 Codex harness 有原生 thread binding 時，我們可以另外要求 Codex 原生 Compaction，以維持 app-server thread 健康，但這必須在詳細資料中回報為獨立的後端動作。

建議行為：

- 如果 `contextEngine.info.ownsCompaction === true`：
  - 先呼叫上下文引擎 `compact()`
  - 接著在 thread binding 存在時，以 best-effort 呼叫 Codex 原生 Compaction
  - 將上下文引擎結果作為主要結果回傳
  - 在 `details.codexNativeCompaction` 中包含 Codex 原生 Compaction 狀態
- 如果作用中的上下文引擎不擁有 Compaction：
  - 保留目前的 Codex 原生 Compaction 行為

這可能需要變更 `extensions/codex/src/app-server/compact.ts`，或從 generic Compaction path 包裝它，取決於 `maybeCompactAgentHarnessSession(...)` 在何處被呼叫。

#### 回合內 Codex 原生 contextCompaction 事件

Codex 可能會在一個回合中發出 `contextCompaction` item events。保留 `event-projector.ts` 中目前的 before/after Compaction hook emission，但不要將其視為已完成的上下文引擎 Compaction。

對於擁有 Compaction 的引擎，當 Codex 仍然執行原生 Compaction 時，請發出明確診斷：

- stream/event 名稱：現有的 `compaction` stream 可接受
- details：`{ backend: "codex-app-server", ownsCompaction: true }`

這會讓兩者的分離可稽核。

### 9. Session reset 和 binding behavior

現有 Codex harness `reset(...)` 會從 OpenClaw session file 清除 Codex app-server binding。保留該行為。

也請確保上下文引擎狀態清理由現有 OpenClaw session lifecycle paths 持續處理。除非上下文引擎 lifecycle 目前對所有 harnesses 都遺漏 reset/delete events，否則不要新增 Codex-specific cleanup。

### 10. Error handling

遵循 PI 語意：

- bootstrap failures 警告並繼續
- assemble failures 警告並退回未組裝的 pipeline messages/prompt
- afterTurn/ingest failures 警告並將 post-turn finalization 標記為未成功
- maintenance 只在成功、未 aborted、非 yield turns 後執行
- Compaction errors 不應作為新 prompts 重試

Codex-specific 補充：

- 如果 context projection 失敗，警告並退回原始 prompt。
- 如果 transcript mirror 失敗，仍嘗試使用 fallback messages 進行上下文引擎 finalization。
- 如果 Codex 原生 Compaction 在上下文引擎 Compaction 成功後失敗，當上下文引擎為 primary 時，不要讓整個 OpenClaw Compaction 失敗。

## 測試計畫

### Unit tests

在 `extensions/codex/src/app-server` 下新增測試：

1. `run-attempt.context-engine.test.ts`
   - Codex 在 session file 存在時呼叫 `bootstrap`。
   - Codex 使用 mirrored messages、token budget、tool names、citations mode、model id 和 prompt 呼叫 `assemble`。
   - `systemPromptAddition` 會包含在 developer instructions 中。
   - Assembled messages 會在目前請求前投射到 prompt 中。
   - Codex 在 transcript mirroring 後呼叫 `afterTurn`。
   - 沒有 `afterTurn` 時，Codex 呼叫 `ingestBatch` 或逐訊息 `ingest`。
   - Turn maintenance 在成功回合後執行。
   - Turn maintenance 不會在 prompt error、abort 或 yield abort 時執行。

2. `context-engine-projection.test.ts`
   - 相同輸入產生穩定輸出
   - 當 assembled history 包含目前 prompt 時，不重複目前 prompt
   - 處理空 history
   - 保留 role order
   - 只在 developer instructions 中包含 system prompt addition

3. `compact.context-engine.test.ts`
   - 擁有 Compaction 的上下文引擎 primary result 勝出
   - 同時嘗試時，Codex 原生 Compaction 狀態會出現在 details 中
   - Codex 原生失敗不會讓擁有 Compaction 的上下文引擎 Compaction 失敗
   - 非擁有 Compaction 的上下文引擎保留目前原生 Compaction 行為

### 要更新的現有測試

- `extensions/codex/src/app-server/run-attempt.test.ts` 如果存在，否則更新最接近的 Codex app-server run tests。
- `extensions/codex/src/app-server/event-projector.test.ts` 只有在 Compaction event details 變更時才更新。
- `src/agents/harness/selection.test.ts` 除非 config 行為變更，否則應不需要變更；它應保持穩定。
- PI context-engine tests 應繼續不變通過。

### Integration / live tests

新增或擴充 live Codex harness smoke tests：

- 將 `plugins.slots.contextEngine` 設定為 test engine
- 將 `agents.defaults.model` 設定為 `codex/*` model
- 設定 `agents.defaults.embeddedHarness.runtime = "codex"`
- assert test engine observed：
  - bootstrap
  - assemble
  - afterTurn 或 ingest
  - maintenance

避免在 OpenClaw core tests 中要求 lossless-claw。使用小型 repo 內 fake context engine Plugin。

## Observability

在 Codex context-engine lifecycle calls 周圍新增 debug logs：

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` with reason
- `codex native compaction completed alongside context-engine compaction`

避免記錄完整 prompts 或 transcript 內容。

在有用處加入結構化欄位：

- `sessionId`
- `sessionKey` 依照現有 logging practice 遮蔽或省略
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / compatibility

這應該是 backward-compatible：

- 如果未設定上下文引擎，legacy context engine behavior 應等同於今日的 Codex harness behavior。
- 如果 context-engine `assemble` 失敗，Codex 應繼續使用原始 prompt path。
- 現有 Codex thread bindings 應維持有效。
- Dynamic tool fingerprinting 不應包含 context-engine output；否則每次 context 變更都可能強制建立新的 Codex thread。只有 tool catalog 應影響 dynamic tool fingerprint。

## Open questions

1. Assembled context 應完全注入 user prompt、完全注入 developer instructions，還是分開？

   建議：分開。將 `systemPromptAddition` 放入 developer instructions；將 assembled transcript context 放入 user prompt wrapper。這最符合目前 Codex protocol，且不會改變原生 thread history。

2. 當上下文引擎擁有 Compaction 時，是否應停用 Codex 原生 Compaction？

   建議：一開始不要。Codex 原生 Compaction 可能仍是維持 app-server thread 存活所必需。但必須回報為原生 Codex Compaction，而不是上下文引擎 Compaction。

3. `before_prompt_build` 應在上下文引擎 assembly 之前還是之後執行？

   建議：對 Codex 而言，在上下文引擎 projection 後執行，讓 generic harness hooks 看到 Codex 實際會收到的 prompt/developer instructions。如果 PI parity 要求相反順序，請在測試中編碼選定順序，並在此記錄。

4. Codex app-server 是否能接受未來的 structured context/history override？

   未知。如果可以，請以該 protocol 取代 text projection layer，並保持 lifecycle calls 不變。

## Acceptance criteria

- 一個 `codex/*` embedded harness turn 會呼叫選取上下文引擎的 assemble lifecycle。
- context-engine `systemPromptAddition` 會影響 Codex developer instructions。
- Assembled context 會以 deterministic 方式影響 Codex turn input。
- 成功的 Codex turns 會呼叫 `afterTurn` 或 ingest fallback。
- 成功的 Codex turns 會執行 context-engine turn maintenance。
- Failed/aborted/yield-aborted turns 不會執行 turn maintenance。
- Context-engine-owned Compaction 對 OpenClaw/Plugin 狀態保持 primary。
- Codex 原生 Compaction 仍可作為原生 Codex 行為被稽核。
- 現有 PI context-engine behavior 不變。
- 當未選取非 legacy context engine，或 assembly 失敗時，現有 Codex harness behavior 不變。
