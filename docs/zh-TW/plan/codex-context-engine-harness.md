---
read_when:
    - 你正在將 context-engine 的生命週期行為接入 Codex 測試框架
    - 您需要 lossless-claw 或其他 context-engine Plugin，才能使用 codex/* 嵌入式測試框架工作階段。
    - 你正在比較嵌入式 PI 與 Codex app-server 的上下文行為
summary: 讓隨附的 Codex app-server 測試框架支援 OpenClaw 情境引擎 Plugin 的規格
title: Codex 執行框架上下文引擎移植
x-i18n:
    generated_at: "2026-05-03T21:36:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## 狀態

草案實作規格。

## 目標

讓內建的 Codex app-server harness 遵循與嵌入式 PI 回合已遵循的相同 OpenClaw context-engine 生命週期合約。

使用 `agents.defaults.embeddedHarness.runtime: "codex"` 或 `codex/*` 模型的工作階段，仍應讓所選的 context-engine Plugin（例如 `lossless-claw`）在 Codex app-server 邊界允許的範圍內，控制 context 組裝、回合後擷取、維護，以及 OpenClaw 層級的 Compaction 政策。

## 非目標

- 不重新實作 Codex app-server 內部機制。
- 不讓 Codex 原生 thread Compaction 產生 lossless-claw 摘要。
- 不要求非 Codex 模型使用 Codex harness。
- 不變更 ACP/acpx 工作階段行為。本規格僅適用於非 ACP 的嵌入式 agent harness 路徑。
- 不讓第三方 Plugin 註冊 Codex app-server extension factory；既有的內建 Plugin 信任邊界維持不變。

## 目前架構

嵌入式執行迴圈會在每次執行時、選擇具體低階 harness 之前，解析設定的 context engine：

- `src/agents/pi-embedded-runner/run.ts`
  - 初始化 context-engine Plugin
  - 呼叫 `resolveContextEngine(params.config)`
  - 將 `contextEngine` 和 `contextTokenBudget` 傳入 `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` 會委派給所選的 agent harness：

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Codex app-server harness 由內建的 Codex Plugin 註冊：

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Codex harness 實作會收到與 PI-backed attempt 相同的 `EmbeddedRunAttemptParams`：

- `extensions/codex/src/app-server/run-attempt.ts`

這表示所需的 hook 點位於 OpenClaw 控制的程式碼中。外部邊界是 Codex app-server protocol 本身：OpenClaw 可以控制傳送到 `thread/start`、`thread/resume` 和 `turn/start` 的內容，也可以觀察通知，但不能變更 Codex 的內部 thread store 或原生 compactor。

## 目前缺口

嵌入式 PI attempt 會直接呼叫 context-engine 生命週期：

- attempt 前的 bootstrap/maintenance
- model 呼叫前的 assemble
- attempt 後的 afterTurn 或 ingest
- 成功回合後的 maintenance
- 對擁有 Compaction 的 engine 執行 context-engine Compaction

相關 PI 程式碼：

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex app-server attempt 目前會執行通用 agent-harness hook 並鏡像 transcript，但不會呼叫 `params.contextEngine.bootstrap`、`params.contextEngine.assemble`、`params.contextEngine.afterTurn`、`params.contextEngine.ingestBatch`、`params.contextEngine.ingest` 或 `params.contextEngine.maintain`。

相關 Codex 程式碼：

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## 期望行為

對於 Codex harness 回合，OpenClaw 應保留此生命週期：

1. 讀取已鏡像的 OpenClaw 工作階段 transcript。
2. 當先前的工作階段檔案存在時，bootstrap 啟用中的 context engine。
3. 可用時執行 bootstrap maintenance。
4. 使用啟用中的 context engine 組裝 context。
5. 將組裝好的 context 轉換為 Codex 相容輸入。
6. 以包含任何 context-engine `systemPromptAddition` 的 developer instructions 啟動或恢復 Codex thread。
7. 使用組裝好的使用者可見 prompt 啟動 Codex 回合。
8. 將 Codex 結果鏡像回 OpenClaw transcript。
9. 若已實作則呼叫 `afterTurn`，否則呼叫 `ingestBatch`/`ingest`，並使用已鏡像的 transcript snapshot。
10. 在成功且非中止的回合後執行回合 maintenance。
11. 保留 Codex 原生 Compaction signal 與 OpenClaw Compaction hook。

## 設計限制

### Codex app-server 仍是原生 thread 狀態的權威來源

Codex 擁有其原生 thread 和任何內部擴充歷史。OpenClaw 不應嘗試透過受支援 protocol 呼叫以外的方式，改動 app-server 的內部歷史。

OpenClaw 的 transcript mirror 仍是 OpenClaw 功能的來源：

- chat history
- search
- `/new` 和 `/reset` bookkeeping
- 未來模型或 harness 切換
- context-engine Plugin 狀態

### Context engine 組裝必須投影到 Codex 輸入

context-engine 介面會回傳 OpenClaw `AgentMessage[]`，而不是 Codex thread patch。Codex app-server `turn/start` 接受目前的使用者輸入，而 `thread/start` 和 `thread/resume` 接受 developer instructions。

因此實作需要一個投影層。安全的第一版應避免假裝它能取代 Codex 內部歷史。它應將組裝好的 context 作為目前回合周圍的確定性 prompt/developer-instruction material 注入。

### Prompt-cache 穩定性很重要

對於 lossless-claw 之類的 engine，在輸入未變時，組裝出的 context 應是確定性的。不要在產生的 context 文字中加入時間戳記、隨機 id，或非確定性排序。

### Runtime 選擇語意不變

Harness 選擇維持現狀：

- `runtime: "pi"` 強制使用 PI
- `runtime: "codex"` 選擇已註冊的 Codex harness
- `runtime: "auto"` 讓 Plugin harness 宣告支援的 provider
- 未匹配的 `auto` 執行使用 PI

這項工作會變更的是 Codex harness 被選取後發生的事情。

## 實作計畫

### 1. 匯出或搬移可重用的 context-engine attempt helper

目前可重用的生命週期 helper 位於 PI runner 之下：

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

如果可以避免，Codex 不應從名稱暗示 PI 的實作路徑匯入。

建立 harness-neutral 模組，例如：

- `src/agents/harness/context-engine-lifecycle.ts`

移動或重新匯出：

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- 包裝 `runContextEngineMaintenance` 的小型 wrapper

透過從舊檔案重新匯出，或在同一個 PR 中更新 PI call site，保持 PI 匯入仍可運作。

中立 helper 名稱不應提及 PI。

建議名稱：

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. 新增 Codex context 投影 helper

新增模組：

- `extensions/codex/src/app-server/context-engine-projection.ts`

職責：

- 接受組裝好的 `AgentMessage[]`、原始鏡像歷史，以及目前 prompt。
- 判定哪些 context 屬於 developer instructions，哪些屬於目前使用者輸入。
- 將目前使用者 prompt 保留為最後的可執行請求。
- 以穩定且明確的格式轉譯先前訊息。
- 避免易變動的 metadata。

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

- 將 `systemPromptAddition` 放入 developer instructions。
- 將組裝好的 transcript context 放在 `promptText` 中目前 prompt 之前。
- 清楚標記為 OpenClaw assembled context。
- 保持目前 prompt 在最後。
- 如果目前使用者 prompt 已出現在尾端，排除重複項。

範例 prompt 形狀：

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

未來改進：如果 Codex app-server 暴露用於取代或補充 thread 歷史的 protocol，將此投影層改為使用該 API。

### 3. 在 Codex thread startup 前接上 bootstrap

在 `extensions/codex/src/app-server/run-attempt.ts` 中：

- 如目前一樣讀取鏡像的工作階段歷史。
- 判定工作階段檔案在此執行前是否存在。優先使用在鏡像寫入前檢查 `fs.stat(params.sessionFile)` 的 helper。
- 開啟 `SessionManager`，或在 helper 需要時使用狹窄的 session manager adapter。
- 當 `params.contextEngine` 存在時，呼叫中立 bootstrap helper。

Pseudo-flow：

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

使用與 Codex tool bridge 和 transcript mirror 相同的 `sessionKey` 慣例。目前 Codex 會從 `params.sessionKey` 或 `params.sessionId` 計算 `sandboxSessionKey`；除非有理由保留原始 `params.sessionKey`，否則一致使用該值。

### 4. 在 `thread/start` / `thread/resume` 和 `turn/start` 前接上 assemble

在 `runCodexAppServerAttempt` 中：

1. 先建置 dynamic tools，讓 context engine 看到實際可用的工具名稱。
2. 讀取鏡像的工作階段歷史。
3. 當 `params.contextEngine` 存在時，執行 context-engine `assemble(...)`。
4. 將組裝結果投影為：
   - developer instruction addition
   - `turn/start` 的 prompt text

既有 hook 呼叫：

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

應變為 context-aware：

1. 使用 `buildDeveloperInstructions(params)` 計算基礎 developer instructions
2. 套用 context-engine assembly/projection
3. 使用投影後的 prompt/developer instructions 執行 `before_prompt_build`

此順序讓通用 prompt hook 看到與 Codex 將收到的相同 prompt。如果需要嚴格 PI parity，請在 hook composition 之前執行 context-engine assembly，因為 PI 會在其 prompt pipeline 之後，將 context-engine `systemPromptAddition` 套用到最終 system prompt。重要的不變條件是 context engine 與 hook 都取得確定且已文件化的順序。

第一版實作建議順序：

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. 將 `systemPromptAddition` append/prepend 到 developer instructions
4. 將組裝好的 messages 投影到 prompt text
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. 將最終 developer instructions 傳給 `startOrResumeThread(...)`
7. 將最終 prompt text 傳給 `buildTurnStartParams(...)`

此規格應編碼在測試中，讓未來變更不會意外重新排序。

### 5. 保留 prompt-cache 穩定格式

投影 helper 必須對相同輸入產生 byte-stable 輸出：

- 穩定的 message 順序
- 穩定的 role label
- 不產生時間戳記
- 不洩漏 object key order
- 不使用隨機 delimiter
- 不使用每次執行不同的 id

使用固定 delimiter 和明確 section。

### 6. 在 transcript mirroring 後接上 post-turn

Codex 的 `CodexAppServerEventProjector` 會為目前回合建立本機 `messagesSnapshot`。`mirrorTranscriptBestEffort(...)` 會將該快照寫入 OpenClaw transcript mirror。

鏡像寫入成功或失敗後，使用可取得的最佳訊息快照呼叫 context-engine finalizer：

- 優先使用寫入後的完整鏡像 session context，因為 `afterTurn` 預期的是 session 快照，而不只是目前回合。
- 如果 session 檔案無法重新開啟，則退回使用 `historyMessages + result.messagesSnapshot`。

Pseudo-flow：

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

如果鏡像寫入失敗，仍然以 fallback 快照呼叫 `afterTurn`，但要記錄 context engine 正在從 fallback 回合資料擷取。

### 7. 正規化使用量與 prompt-cache runtime context

Codex 結果在可用時會包含來自 app-server token notifications 的正規化使用量。將該使用量傳入 context-engine runtime context。

如果 Codex app-server 最終公開 cache 讀取/寫入細節，請將它們對應到 `ContextEnginePromptCacheInfo`。在那之前，請省略 `promptCache`，而不是自行捏造零值。

### 8. Compaction 政策

有兩個 Compaction 系統：

1. OpenClaw context-engine `compact()`
2. Codex app-server 原生 `thread/compact/start`

不要默默將兩者混為一談。

#### `/compact` 與明確的 OpenClaw Compaction

當選取的 context engine 具有 `info.ownsCompaction === true` 時，明確的 OpenClaw Compaction 應優先使用 context engine 的 `compact()` 結果，供 OpenClaw transcript mirror 與 Plugin 狀態使用。

當選取的 Codex harness 具有原生 thread binding 時，我們也可以另外請求 Codex 原生 Compaction，以保持 app-server thread 健康，但這必須在 details 中回報為獨立的 backend action。

建議行為：

- 如果 `contextEngine.info.ownsCompaction === true`：
  - 先呼叫 context-engine `compact()`
  - 接著在存在 thread binding 時，以 best-effort 呼叫 Codex 原生 Compaction
  - 將 context-engine 結果作為主要結果回傳
  - 在 `details.codexNativeCompaction` 中包含 Codex 原生 Compaction 狀態
- 如果作用中的 context engine 不擁有 Compaction：
  - 保留目前的 Codex 原生 Compaction 行為

這可能需要變更 `extensions/codex/src/app-server/compact.ts`，或從通用 Compaction 路徑包裝它，取決於 `maybeCompactAgentHarnessSession(...)` 的呼叫位置。

#### 回合內 Codex 原生 contextCompaction 事件

Codex 可能會在回合期間發出 `contextCompaction` item 事件。保留目前 `event-projector.ts` 中的 before/after Compaction hook emission，但不要將它視為已完成的 context-engine Compaction。

對於擁有 Compaction 的 engine，當 Codex 仍執行原生 Compaction 時，請發出明確的 diagnostic：

- stream/event 名稱：可接受使用現有的 `compaction` stream
- details：`{ backend: "codex-app-server", ownsCompaction: true }`

這讓兩者的區分可稽核。

### 9. Session reset 與 binding 行為

現有的 Codex harness `reset(...)` 會從 OpenClaw session 檔案清除 Codex app-server binding。保留該行為。

也要確保 context-engine 狀態清理仍透過現有 OpenClaw session lifecycle 路徑進行。除非 context-engine lifecycle 目前對所有 harness 都漏掉 reset/delete 事件，否則不要加入 Codex 專屬清理。

### 10. 錯誤處理

遵循 PI 語義：

- bootstrap 失敗時警告並繼續
- assemble 失敗時警告，並退回未組裝的 pipeline messages/prompt
- afterTurn/ingest 失敗時警告，並標記 post-turn finalization 未成功
- maintenance 只在成功、非 aborted、非 yield 的回合後執行
- Compaction 錯誤不應作為全新 prompt 重試

Codex 專屬補充：

- 如果 context projection 失敗，警告並退回原始 prompt。
- 如果 transcript mirror 失敗，仍嘗試以 fallback messages 執行 context-engine finalization。
- 如果 context-engine Compaction 成功後 Codex 原生 Compaction 失敗，且 context engine 是主要來源，則不要讓整個 OpenClaw Compaction 失敗。

## 測試計畫

### 單元測試

在 `extensions/codex/src/app-server` 下新增測試：

1. `run-attempt.context-engine.test.ts`
   - 當 session 檔案存在時，Codex 會呼叫 `bootstrap`。
   - Codex 會以鏡像 messages、token budget、tool names、citations mode、model id 與 prompt 呼叫 `assemble`。
   - `systemPromptAddition` 會包含在 developer instructions 中。
   - 組裝後的 messages 會在目前 request 前投影進 prompt。
   - Codex 會在 transcript mirroring 後呼叫 `afterTurn`。
   - 沒有 `afterTurn` 時，Codex 會呼叫 `ingestBatch` 或逐訊息 `ingest`。
   - 成功回合後會執行 turn maintenance。
   - 發生 prompt error、abort 或 yield abort 時，不會執行 turn maintenance。

2. `context-engine-projection.test.ts`
   - 相同輸入有穩定輸出
   - 當 assembled history 已包含目前 prompt 時，不重複目前 prompt
   - 處理空 history
   - 保留 role 順序
   - 只在 developer instructions 中包含 system prompt addition

3. `compact.context-engine.test.ts`
   - 擁有 Compaction 的 context engine 主要結果勝出
   - 同時嘗試時，Codex 原生 Compaction 狀態會出現在 details 中
   - Codex 原生失敗不會導致擁有 Compaction 的 context-engine Compaction 失敗
   - 非擁有 Compaction 的 context engine 保留目前原生 Compaction 行為

### 要更新的現有測試

- `extensions/codex/src/app-server/run-attempt.test.ts` 如果存在，否則更新最近的 Codex app-server run 測試。
- 只有在 Compaction 事件 details 變更時，才更新 `extensions/codex/src/app-server/event-projector.test.ts`。
- 除非 config 行為變更，否則 `src/agents/harness/selection.test.ts` 應不需要變更；它應保持穩定。
- PI context-engine 測試應能不變更並繼續通過。

### Integration / live 測試

新增或擴充 live Codex harness smoke tests：

- 將 `plugins.slots.contextEngine` 設定為測試 engine
- 將 `agents.defaults.model` 設定為 `codex/*` model
- 設定 `agents.defaults.embeddedHarness.runtime = "codex"`
- 斷言測試 engine 觀察到：
  - bootstrap
  - assemble
  - afterTurn 或 ingest
  - maintenance

避免在 OpenClaw core 測試中要求 lossless-claw。使用小型 in-repo fake context engine Plugin。

## 可觀測性

在 Codex context-engine lifecycle 呼叫周圍新增 debug logs：

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` 搭配原因
- `codex native compaction completed alongside context-engine compaction`

避免記錄完整 prompts 或 transcript 內容。

在有用處新增結構化欄位：

- `sessionId`
- `sessionKey` 依現有 logging practice 遮罩或省略
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / 相容性

這應該要向後相容：

- 如果未設定 context engine，legacy context engine 行為應等同於今日的 Codex harness 行為。
- 如果 context-engine `assemble` 失敗，Codex 應繼續使用原始 prompt 路徑。
- 現有 Codex thread bindings 應保持有效。
- Dynamic tool fingerprinting 不應包含 context-engine 輸出；否則每次 context 變更都可能強制建立新的 Codex thread。只有 tool catalog 應影響 dynamic tool fingerprint。

## 未解問題

1. 組裝後的 context 應完全注入 user prompt、完全注入 developer instructions，還是分開？

   建議：分開。將 `systemPromptAddition` 放入 developer instructions；將 assembled transcript context 放入 user prompt wrapper。這最符合目前的 Codex protocol，且不會改動原生 thread history。

2. 當 context engine 擁有 Compaction 時，是否應停用 Codex 原生 Compaction？

   建議：初期不要。Codex 原生 Compaction 可能仍是保持 app-server thread 存活所必需。但它必須回報為原生 Codex Compaction，而不是 context-engine Compaction。

3. `before_prompt_build` 應在 context-engine assembly 前還是後執行？

   建議：對 Codex 而言，在 context-engine projection 之後執行，讓通用 harness hooks 看到 Codex 實際將接收的 prompt/developer instructions。如果 PI parity 需要相反順序，請在測試中編碼所選順序，並在此記錄。

4. Codex app-server 未來能否接受結構化 context/history override？

   未知。如果可以，請以該 protocol 取代 text projection layer，並保持 lifecycle calls 不變。

## 驗收條件

- `codex/*` embedded harness 回合會呼叫所選 context engine 的 assemble lifecycle。
- context-engine `systemPromptAddition` 會影響 Codex developer instructions。
- 組裝後的 context 會以確定性方式影響 Codex 回合輸入。
- 成功的 Codex 回合會呼叫 `afterTurn` 或 ingest fallback。
- 成功的 Codex 回合會執行 context-engine turn maintenance。
- 失敗/aborted/yield-aborted 回合不會執行 turn maintenance。
- context-engine-owned Compaction 仍是 OpenClaw/Plugin 狀態的主要來源。
- Codex 原生 Compaction 仍可作為原生 Codex 行為稽核。
- 現有 PI context-engine 行為不變。
- 未選取非 legacy context engine 或 assembly 失敗時，現有 Codex harness 行為不變。
