---
x-i18n:
    generated_at: "2026-07-19T13:49:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 90c6c85a837448f4e5ceccdccf73489db801ad502cbbb2f3eb04d6aff7e902f0
    source_path: plan/swarms.md
    workflow: 16
---

# Swarms — 程式碼模式中的代理程式扇出與協調

狀態：已發布 — 已由 `docs/tools/swarm.md` 取代。本文件保留作為
實作設計紀錄。

## 1. 定義與緣由

**Swarm** 是由程式碼模式指令碼以確定性方式協調的多個子代理程式：
扇出 N 個讀取者、以對抗方式驗證發現、透過具狀態的優先順序處理器綜合結果，
並在決策閘門上循環。控制流程（`Promise.all`、
`while`、`if`）_就是_協調機制 — 刻意**不使用圖形 DSL、
不新增模式，也不新增頂層工具介面**。

OpenClaw 程式碼模式（QuickJS-WASI、快照／繼續、橋接要求）是其
基礎。暫停中的橋接呼叫可在 VM 快照與閘道重新啟動後存續，
並從停止之處精確繼續 — 比日誌重播設計更強，且
不對指令碼施加確定性限制。

命名：產品／文件名稱為 **Swarm**。程式碼識別碼維持原文：
`agents.*` 客體 API、`tools.swarm` 設定、`swarm` 群組欄位。

## 2. 決策（維護者，2026-07-17）

- 成本：強制執行設定上限；每個 Swarm 的權杖預算為選用。沒有強制預算。
- 核准：子代理程式以**失敗時關閉／非互動式**模式執行。需要核准的
  動作會遭拒絕；拒絕情況會回報於子代理程式結果中；由指令碼
  決定後續處理。扇出不會向操作人員大量顯示提示。
- v1 僅支援由模型撰寫的臨時指令碼。已儲存／具名稱的工作流程、命令列介面／排程
  進入點：稍後提供（排程已可使用無周邊程式碼模式）。
- 子代理程式身分：預設透過 `tools.swarm.defaultAgentId`
  設定使用專用工作代理程式（依現有子代理程式目標允許清單驗證）；每次產生可用
  `agentId` 覆寫。核心不內建任何代理程式 ID；文件建議使用精簡的
  `worker` 代理程式設定。
- 不變更 Codex 原始碼。Codex 控制框架使用產生／等待慣用法（§8）。

## 3. 架構概觀

```
程式碼模式指令碼（QuickJS VM、閘道）          Codex V8 指令碼（codex 處理程序）
  agents.run(...) ── 暫停中的橋接呼叫             tools.sessions_spawn / tools.agents_wait
        │                                                │ 項目／工具／呼叫 RPC（每次 ≤600s）
        ▼                                                ▼
             核心（不依賴控制框架，本存放庫）
  sessions_spawn {collect:true, outputSchema, fastMode, groupId}
  agents_wait {ids, timeoutSeconds}
        │
  子代理程式登錄檔（SQLite）：收集器完成紀錄、Swarm 群組 ID
        │
  子代理程式 = 一般子代理程式工作階段（受通道上限限制、核准失敗時關閉）
        │
  sessions.changed SSE ──► Control UI 圓點／側邊欄／頻道狀態訊息
```

產生／完成／結算語意只有一個標準擁有者（核心工具 + 登錄檔）。
兩種等待傳輸方式：QuickJS 會無限期暫停橋接呼叫（快照）；
Codex 則透過有界 RPC 輪詢 `agents_wait`。

## 4. 設定閘門（v1）

新增 `tools.swarm`（全域 + 每個代理程式的覆寫，合併模式與
`tools.codeMode` 相同）：

```jsonc
"tools": {
  "swarm": {
    "enabled": false,            // 主閘門，預設關閉
    "maxConcurrent": 8,          // 同時執行的子代理程式數量（Swarm 通道上限）
    "maxChildrenPerGroup": 50,   // 每個 Swarm 群組的執行中子代理程式數量
    "maxTotalPerGroup": 200,     // 每個群組存續期間的產生總數（失控防護）
    "waitTimeoutSecondsMax": 600,
    "defaultAgentId": ""         // 選用；產生時省略 agentId 所使用的子代理程式 ID
  }
}
```

- Zod：聯集 `boolean | strict object`，類似 `CodeModeSchema`
  （`src/config/zod-schema.agent-runtime.ts`）；`swarm: true` → `{enabled: true}`。
- 型別位於 `src/config/types.tools.ts`（每個代理程式與頂層 `tools` 皆包含），
  標籤位於 `schema.labels.ts`，說明位於 `schema.help.runtime.ts`。
- 解析輔助函式 `resolveSwarmConfig(cfg, agentId)` 仿照
  `resolveCodeModeConfig`（`src/agents/code-mode.ts:215`），並限制所有數值。
- 停用時的閘門效果：工具目錄中不會出現 `agents_wait`；
  `sessions_spawn` 上的 `collect`／`outputSchema`／`fastMode`／`groupId` 參數
  會遭拒絕，並顯示清楚指明設定鍵的錯誤。其他行為不變。
- `defaultAgentId` 透過 `resolveSubagentAllowedTargetIds`
  （`src/agents/subagent-target-policy.ts`）驗證；未知 ID → 產生錯誤，不使用後援。

## 5. 核心：收集器模式產生 + `agents_wait`（v1）

### 5.1 `sessions_spawn` 新增項目（全數受 Swarm 啟用狀態管控）

- `collect: boolean` — 為 true 時，子代理程式執行會以
  `expectsCompletionMessage: false` 和一筆**收集器完成紀錄**
  登錄，而非使用公告／引導傳遞。工具會立即傳回 `{ runId, sessionKey }`。
  不繫結頻道／討論串。
- `outputSchema: object` — JSON Schema。子代理程式的工具介面會附加合成的
  `structured_output` 工具；系統提示附錄會指示它以最終結果精確呼叫該工具一次。驗證
  失敗時，子代理程式會獲得一次提醒重試；此後完成紀錄會包含
  `structured: undefined`、原始文字及 `schemaError`。
- `fastMode: true | "auto" | false` — 透過 `resolveSubagentModelAndThinkingPlan`
  （`src/agents/subagent-spawn-plan.ts`），與模型／思考設定一同串接至子工作階段修補，
  並使用現有的 `FastMode` 軸
  （`src/shared/fast-mode.ts`）。省略 = 繼承。
- `groupId: string` — Swarm 群組戳記。預設為
  `swarm:<requesterSessionKey>:<runId-of-requesting-run>`。持久保存於
  登錄紀錄與子工作階段資料列。用於上限、列出、批次封存及圓點。
- `label: string` 已存在 — 顯示於圓點與 `subagents list`。
- 子代理程式 ID：`params.agentId` → 否則為 `tools.swarm.defaultAgentId` → 否則為
  要求者代理程式（現有行為）。

### 5.2 核准失敗時關閉

收集器子代理程式使用非互動式核准內容執行：任何原本需要操作人員核准的工具呼叫，
都會解析為子代理程式可見的結構化拒絕
（`approval_required`），而子代理程式應在結果中回報
受阻情況。實作方式：重複使用現有的執行／工具核准
政策管線，並對收集器模式子代理程式執行強制使用 `deny` 解析器。
收集器子代理程式不會向操作人員介面發出核准事件。

### 5.3 `agents_wait` 工具（新增，受閘門管控）

```
agents_wait({ ids: string[], timeoutSeconds?: number })
→ {
    completed: [{ runId, status: "done"|"failed"|"killed"|"timeout",
                  result: string, structured?: unknown, schemaError?: string,
                  sessionKey, label?, usage?: {inputTokens, outputTokens} }],
    pending: string[]
  }
```

- 只要**至少一個** ID 完成便立即傳回（首次完成／競速
  語意，可實現流水線），或逾時時傳回 `completed: []`。
- `timeoutSeconds` 預設為 30，並限制為 `waitTimeoutSecondsMax`。
- 具冪等性：已完成的 ID 會再次傳回其紀錄（紀錄會
  保留至群組封存）。未知 ID → 每個 ID 各自產生錯誤項目，不會擲回錯誤。
- 擁有權：只有產生某次執行的工作階段（或其父系鏈）可以等待該執行
  — 與程式碼模式中的 `wait`（`code-mode.ts:1684`）使用相同擁有權規則。
- 登錄檔：完成紀錄存放於現有子代理程式登錄檔 SQLite
  儲存區（`subagent-registry.store.sqlite.ts`）— 新增欄位，不新增儲存區，也不
  提升結構描述版本（僅新增欄位；請參閱 §9 限制）。

### 5.4 上限強制執行

- `maxConcurrent`：收集器子代理程式在現有子代理程式通道上執行，但
  依 Swarm 群組計數；超出上限的產生要求會以 FIFO 排入佇列（主機端，位於
  產生路徑中 — 立即傳回 runId，並在釋出名額時開始執行）。
- `maxChildrenPerGroup`／`maxTotalPerGroup`：一旦超出上限，產生要求會遭具型別錯誤
  拒絕；錯誤文字會指明設定鍵。
- 深度：收集器子代理程式保留 `DEFAULT_SUBAGENT_MAX_SPAWN_DEPTH` 語意
  （除非明確設定巢狀，否則子代理程式為葉節點）。

## 6. 測試合約（v1，通道 A）

- 單元測試：設定解析／限制；停用時的閘門拒絕；groupId
  預設值；上限強制執行（排入佇列 + 拒絕）；等待競速語意；等待
  冪等性；擁有權拒絕；結構化輸出驗證 + 提醒重試 +
  schemaError 路徑；將 fastMode 串接至工作階段修補；defaultAgentId
  驗證。
- 整合測試（vitest、模擬模型執行階段）：產生 3 個收集器子代理程式，在
  迴圈中等待，判定首次完成順序與最終清空；閘道重新啟動
  模擬：重新載入登錄檔 → 等待從持久保存的完成紀錄解析。
- 所有測試均與 `*.test.ts` 放置於同處；不呼叫即時模型。

## 7. QuickJS 客體介面（通道 B，核心之後）

- 客體全域項目安裝於 `CONTROLLER_SOURCE`
  （`src/agents/code-mode.worker.ts:190-374`），保留名稱新增至
  `code-mode-namespaces.ts`：
  - `agents.run(prompt, opts) → Promise<result|structured>` — 語法糖：
    收集器產生 + 在專用橋接方法（`agentWait`）上暫停等待，
    由主機在完成時結算（不輪詢；可安全建立快照）。
  - `agents.session(system, opts) → Promise<handle>`；
    `handle.send(input, opts) → Promise<...>`；`handle.close()`。（v1.1 —
    在 run() 之後發布；使用 `mode:"session"` + 每輪收集器紀錄。）
  - `phase(title)`、`log(message)` — 即發即棄的橋接通知 →
    Swarm 進度事件。
- 新增至 `CodeModeBridgeMethod`（`code-mode.ts:91`）的橋接方法：
  `agentSpawn`、`agentWait`、`swarmNote`。`agentSpawn`／`agentWait`
  **依設計即具備**重播安全性：冪等性鍵 `(codeModeRunId, bridgeId)`
  儲存於登錄紀錄；重新啟動時會從持久保存的完成紀錄重新結算，
  絕不重複產生。
- 待處理的 `agentWait` 橋接呼叫會延長執行的快照 TTL（待處理
  代理程式集合即為訊號；不使用旗標）。
- `API.read("agents.d.ts")` 虛擬檔案記載具型別介面與
  扇出／閘門／循環慣用法（`createCodeModeApiVirtualFiles`、
  `code-mode-namespaces.ts:876`）。

## 8. Codex 控制框架投影（後續通道）

- `sessions_spawn`（含新參數）與 `agents_wait` 會流經
  現有動態工具橋接；在 Codex 程式碼模式指令碼中，它們會自動顯示為
  `tools.*`（已驗證：`codex-rs/code-mode/src/runtime/globals.rs:14-65`、
  `codex-rs/core/src/tools/spec_plan.rs:448-507`）。
- `agents_wait` 使用較長的動態工具逾時類別（上限 600s；
  `extensions/codex/src/app-server/dynamic-tool-execution.ts:37-39`），並標記為
  逾時／重播安全。
- Codex 父項目的群組鍵：`swarm:<parentSessionKey>:<turnId>`。
- Codex 原生 `spawn_agent` 子代理程式可共存；其任務鏡像資料列會提供給
  相同的進度介面。

## 9. 持久性與保留

- 不新增儲存區。登錄紀錄擴充現有子代理程式登錄檔
  SQLite 資料表；子代理程式是一般 `sessions` 資料列。僅新增欄位
  — **任何需要提升 SQLite 結構描述版本的變更，都必須先取得
  維護者明確核准**（存放庫政策）。
- 登錄紀錄 + 子工作階段中繼資料上的 Swarm 群組 ID。
- 保留：已完成的收集器紀錄會存續至**群組封存**：
  當父執行完成（或 TTL 到期）時，群組的子代理程式會
  批次封存（擴充現有的 `DEFAULT_SUBAGENT_ARCHIVE_AFTER_MINUTES`
  清理，使其依群組運作）。

## 10. 進度介面（“圓點”）— 後續通道

- 隱含且由控制框架驅動。衍生自現有 `sessions.changed` SSE +
  登錄檔；`phase`／`log` 附註會新增語意。代理程式不負責轉譯。
- Control UI：工作區小工具系列
  （`ui/src/lib/workspace/widgets/`）中的 `swarm` 轉譯器 — 依階段分組的圓點網格、敘述
  行、每個圓點的狀態／標籤／模型；側邊欄子項目樹維持不變。
- 頻道：每個群組僅有一則經節流編輯的狀態訊息（遵循
  `docs/concepts/streaming.md`；絕不為每個子代理程式各自傳送訊息）。

## 11. 實驗室頁面（控制介面，獨立工作線）

Settings → **Labs**：實驗性功能切換開關，首批項目為 **Code Mode**
與 **Swarm**。每一列包含：名稱、單行說明、文件連結，以及透過現有
`config.patch` RPC 連接的切換開關（RFC 7396 合併修補程式 — 設定
`tools.codeMode.enabled` / `tools.swarm.enabled`）；適用時另顯示「需要重新啟動」
提示。功能容易找到，但文案會清楚表明其實驗性質。i18n：所有字串皆透過一般
`en.ts` + 同步流水線處理。

## 12. 部署位置（稍後）

- `placement` 產生時選擇：`"local"`（預設）| `"cloud:<profile>"`，透過
  現有的工作器環境分派（`sessions.dispatch`）；若共用主機的 SSH 沙箱子項目證實不足，
  稍後再加入集區式部署。
- 協調器 VM 一律留在閘道上；收斂／圓點／預算
  不受部署位置影響。

## 13. 非目標

- 不採用圖形 DSL — 控制流程本身就是圖形（刻意如此，且有文件說明）。
- 不變更 Codex 原始碼；不重用 Codex Code Mode 內部元件。
- v1 不提供已儲存／具名的工作流程；不提供命令列介面進入點。
- 不逐一向上傳遞每個子項目的操作員核准要求。
- 不在扇出規模下進行 1:1 雲端佈建。
- 不提供穩態執行階段相容性墊片；Swarm 是受控啟用的新介面。

## 14. 建置階段／PR 切分

1. **工作線 A（核心）**：§4 設定 + §5 產生／等待／上限／核准 + §6 測試。
2. **工作線 C（實驗室頁面）**：§11 — 獨立，可率先合併。
3. **工作線 B（QuickJS 介面）**：§7 — 待 A 的合約合併後進行。
4. 圓點呈現器（§10）、Codex 投影（§8）、`agents.session`（§7 v1.1）、
   部署位置（§12）、使用者文件重寫 — 後續 PR 依此順序進行。

每個 PR：CI 維持綠燈、`$autoreview` 無問題、預設停用、主分支可供發布。
