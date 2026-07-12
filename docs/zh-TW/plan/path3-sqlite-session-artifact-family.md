---
read_when:
    - 你正在實作 clawdbot-d63.2 / clawdbot-04b
    - 你正在處理 SQLite 工作階段保留、重設、刪除或刪除代理程式時的封存作業
    - 你需要區分 SQLite 時代的產物系列與舊版 JSONL 側載檔案
summary: 封存屬於某個工作階段之所有 SQLite 對話記錄成品的路徑 3 計畫
title: 路徑 3 SQLite 工作階段成品系列
x-i18n:
    generated_at: "2026-07-12T14:39:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# 路徑 3 SQLite 工作階段成品家族

本說明界定 `clawdbot-d63.2` 的範圍，而 `clawdbot-d63.1` 負責 `src/config/sessions/session-accessor.sqlite.ts` 中與其重疊的重設／刪除封存輔助函式。
本次處理期間實作檔案存在未提交的變更，因此本成品會記錄確切的契約與修補位置，避免與同層工作者產生競爭。

## 權威家族

切換至 SQLite 後，作用中的工作階段逐字記錄會成為 SQLite 資料列。工作階段的封存家族包括：

- 項目目前 `sessionId` 所對應的 `transcript_events`、`transcript_event_identities` 與 `sessions` 資料列。
- `entry.compactionCheckpoints[*].preCompaction.sessionId` 所參照之每個 `sessionId` 的相同 SQLite 逐字記錄資料列集合。
- `entry.compactionCheckpoints[*].postCompaction.sessionId` 所參照之每個 `sessionId` 的相同 SQLite 逐字記錄資料列集合。
- `entry.usageFamilySessionIds` 中每個 `sessionId` 的相同 SQLite 逐字記錄資料列集合。

僅封存已不再由任何剩餘 `session_entries` 資料列，或任何剩餘項目的壓縮或使用量家族中繼資料所參照的資料列。如此可保留檢查點分支／還原與使用量彙總狀態，直到最後一個有效參照消失為止。

## 切換後的非家族成品

產生的主題逐字記錄檔案變體與軌跡旁檔並非作用中的 SQLite 執行階段狀態。它們是舊版檔案成品：

- `<sessionId>-topic-<thread>.jsonl` 等主題變體僅存在於檔案式逐字記錄格式。SQLite 使用標準工作階段 ID，以及 `session_routes`／項目傳遞中繼資料，而非每個主題各自的 JSONL 檔案。
- `.trajectory.jsonl` 與 `.trajectory-path.json` 等軌跡旁檔是依實際 JSONL `sessionFile` 路徑命名。SQLite 的 `sessionFile` 值是 `sqlite:<agentId>:<sessionId>:<storePath>` 標記，並非旁檔的檔名。
- 封存層讀取器必須繼續讀取舊版已封存 JSONL 檔案，但執行階段保留機制不得掃描作用中的工作階段目錄，或為 SQLite 工作階段重新開啟 JSONL 逐字記錄檔案。

Doctor 匯入仍是舊版主要 JSONL 檔案及其相鄰軌跡旁檔的遷移負責者。SQLite 執行階段保留機制不應新增第二個匯入器或檔案後援路徑。

## 修補位置

擴充由 `clawdbot-d63.1` 引入的 SQLite 封存輔助函式，而非新增平行路徑。

1. 在 `deleteSqliteSessionStateIfUnreferenced` 附近新增本地收集器：
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - 納入 `entry.sessionId`、檢查點壓縮前／後工作階段 ID，以及 `usageFamilySessionIds`。
   - 篩除空字串，並以確定性方式去除重複項目。

2. 為移除後的儲存區新增參照收集器：
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - 逐一處理目前的 `session_entries`、剖析每個 `entry_json`，並從每個保留的項目收集相同的家族 ID。

3. 修改目前只封存單一已移除 `sessionId` 的重設／刪除／維護呼叫端，改為傳入已移除項目的完整家族。

4. 對每個家族 ID，使用呼叫端的原因（`reset` 或 `deleted`）封存 SQLite 逐字記錄資料列，且僅在移除後的參照集合中不存在該家族 ID 時，才刪除 `sessions` 資料列。

5. 繼續透過現有 SQLite 工作階段資料列清理路徑集中處理逐字記錄事件刪除。請勿新增作用中 JSONL 讀取。

## 聚焦測試

在 `clawdbot-d63.1` 提交後，將僅限 SQLite 的測試新增至 `src/config/sessions/session-accessor.conformance.test.ts` 或同層生命週期測試：

- 刪除含有壓縮前逐字記錄的項目時，會同時封存目前工作階段與壓縮前工作階段，然後移除兩組 SQLite 資料列。
- 刪除共用某個壓縮前工作階段的兩個項目之一時，在最後一個參照項目遭移除前，不會封存該共用的壓縮前工作階段。
- 刪除含有 `usageFamilySessionIds` 的項目時，若沒有其他項目參照該使用量家族，會封存前置工作階段的 SQLite 逐字記錄資料列。
- 具有 SQLite 標記、外形如主題的工作階段索引鍵，不會導致任何產生的主題 JSONL 讀取或旁檔查找。

聚焦驗證應使用：

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

如果最終測試位於 `store.session-lifecycle-mutation.test.ts`，請使用相同包裝器明確執行該檔案。對於此 Codex 工作樹，廣泛的 `pnpm` 閘門應繼續在 Crabbox／Testbox 上執行。
