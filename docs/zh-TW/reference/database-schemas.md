---
read_when:
    - 診斷較新版本的資料庫結構描述錯誤
    - 在更新或降級前檢查資料庫相容性
    - 復原舊版 OpenClaw 的資料庫
summary: OpenClaw SQLite 資料庫位置、結構描述版本、完整性檢查與降級復原
title: 資料庫結構描述
x-i18n:
    generated_at: "2026-07-19T14:04:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 73993e2c593ba460784108aedef70bbfb499e525c709d6d6bdd956ccf93e0ddc
    source_path: reference/database-schemas.md
    workflow: 16
---

OpenClaw 將控制平面狀態儲存在全域 SQLite 資料庫中，並將代理程式資料儲存在每個代理程式各自的一個 SQLite 資料庫中。資料庫開啟時，結構描述遷移會向前執行。較舊的 OpenClaw 組建會拒絕由較新結構描述寫入的資料庫。

## 資料庫配置

| 範圍                 | 預設路徑                                                   | 內容                                                                                                  |
| -------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 全域控制平面         | `~/.openclaw/state/openclaw.sqlite`                        | 共用設定狀態、登錄、核准項目、外掛狀態及共用執行階段狀態                                              |
| 每個代理程式的資料平面 | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` | 工作階段、逐字記錄、記憶索引、驗證狀態、對話狀態及代理程式範圍的執行階段狀態                            |

少數高資料量或具有特定生命週期的功能會使用專用 SQLite 儲存區，包括任務登錄和軌跡資料。

## 版本控制契約

每個資料庫都會在兩處記錄其結構描述：

- `PRAGMA user_version` 是 SQLite 結構描述版本。
- 主要的 `schema_meta` 資料列會記錄 `role`、`agent_id`、`schema_version` 和 `app_version`。`app_version` 是最後寫入結構描述中繼資料的 OpenClaw 組建。

OpenClaw 開啟較舊且仍受支援的資料庫時，會套用僅能向前的遷移。若資料庫的 `user_version` 比執行中的組建更新，OpenClaw 會拒絕該資料庫並回報 `newer schema version` 錯誤。閘道會在啟動前檢查所有已登錄的資料庫。`openclaw update` 也會拒絕宣告的結構描述支援版本比磁碟上資料庫更舊的套件或原始碼目標。在加入結構描述中繼資料之前發布的目標套件無法進行預檢。

透過 npm 手動安裝 OpenClaw 會略過更新程式的防護。資料庫開啟檢查仍會拒絕不相容的組建。

## 代理程式結構描述歷程

| 版本    | 變更                                                                                                                                                                                                                                                           | 首次發布版本                                    |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1       | 初始的每代理程式儲存區（[#88349](https://github.com/openclaw/openclaw/pull/88349)）                                                                                                                                                                             | `v2026.5.30-beta.1`，穩定延續至 `v2026.7.1` |
| 2       | 記憶索引識別資訊（[#104449](https://github.com/openclaw/openclaw/pull/104449)）                                                                                                                                                                                 | `v2026.7.2-beta.1`                              |
| 4       | 工作階段和逐字記錄移至 SQLite（[#98236](https://github.com/openclaw/openclaw/pull/98236)）                                                                                                                                                                      | `v2026.7.2-beta.1`                              |
| 5-6     | 終端資料新鮮度與狀態生命週期（[#104859](https://github.com/openclaw/openclaw/pull/104859)）                                                                                                                                                                     | `v2026.7.2-beta.1`                              |
| 7       | 每個項目的生命週期狀態投影（[#106151](https://github.com/openclaw/openclaw/pull/106151)）                                                                                                                                                                       | `v2026.7.2-beta.1`                              |
| 8       | 每份逐字記錄的工作階段來源（[#106766](https://github.com/openclaw/openclaw/pull/106766)）                                                                                                                                                                       | `v2026.7.2-beta.2`                              |
| 9       | `STRICT` 資料表（[#108663](https://github.com/openclaw/openclaw/pull/108663)）                                                                                                                                                                       | `v2026.7.2-beta.2`                              |
| 10      | 具體化的作用中逐字記錄路徑（[#108851](https://github.com/openclaw/openclaw/pull/108851)）                                                                                                                                                                      | 尚未發布                                        |
| 11      | 租約、持久傳遞、對話位址及心跳偵測結果（[#109636](https://github.com/openclaw/openclaw/pull/109636)、[#95838](https://github.com/openclaw/openclaw/pull/95838)、[#109999](https://github.com/openclaw/openclaw/pull/109999)） | 尚未發布                                        |

版本 3 是未出貨的開發步驟，已併入版本 4。

## 狀態結構描述歷程

| 版本    | 變更                                                                                                      | 首次發布版本        |
| ------- | --------------------------------------------------------------------------------------------------------- | ------------------- |
| 1       | 初始共用狀態資料庫                                                                                        | `v2026.5.30-beta.1` |
| 2       | 僅含中繼資料的訊息稽核事件（[#103903](https://github.com/openclaw/openclaw/pull/103903)）                  | `v2026.7.2-beta.1`  |
| 3       | `STRICT` 資料表及結構描述漂移強化（[#108663](https://github.com/openclaw/openclaw/pull/108663)） | `v2026.7.2-beta.2`  |
| 4       | 工作階段監看來源取代編碼的哨兵資料列                                                                      | 尚未發布            |

## 完整性檢查

| 時機                                        | 檢查                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------- |
| 每次開啟                                    | 驗證 `schema_meta` 資料表及主要中繼資料列                       |
| 執行待處理的遷移前                          | 執行完整的完整性、外部索引鍵、角色、結構描述及索引掃描               |
| 閘道背景驗證程式                            | 約每天執行一次完整掃描並記錄結果                                     |
| Doctor、備份驗證及壓縮                      | 接受或重寫資料庫前執行完整掃描                                       |

閘道預檢只會讀取結構描述標頭。對於不需要遷移的資料庫，速度較慢的完整掃描由背景驗證程式負責。
隔離決策只會存放在專用的 `openclaw-quarantine.sqlite` 儲存區，因此即使遭隔離的資料庫損壞，這些決策仍會保留。驗證結果會記錄於日誌中。

## 疑難排解

### 為何更新至 2026.7.2 後無法降回舊版本

截至 `v2026.7.1` 的每個版本都使用代理程式結構描述 1 和狀態結構描述 1。2026.7.2 發布系列（從 `v2026.7.2-beta.1` 開始）會在首次啟動時將你的資料庫向前遷移。該遷移是單向的：資料會重寫為較新的結構描述，之後安裝較舊的 OpenClaw 並不會復原遷移。較舊的組建會拒絕啟動，並顯示 `newer schema version` 錯誤，指出擁有該資料庫的組建。

降級二進位檔絕不會降級資料。如果更新後必須執行比 2026.7.2 更舊的版本，有以下三種選擇：

1. 還原更新前建立的備份。在重大更新前，[建立並驗證備份](/zh-TW/cli/backup)。
2. 讓較舊的組建使用獨立的狀態目錄（`OPENCLAW_STATE_DIR`）。它會以全新狀態啟動；遷移後的資料會保持不變，以供你返回較新組建時使用。
3. 依照下方的手動降級程序操作。此程序不受支援，若沒有經過驗證的備份，可能造成資料遺失。

自 2026.7.2 起，`openclaw update` 會拒絕安裝無法開啟目前資料庫的版本，因此更新程式不會讓你陷入這種情況。透過 npm 手動安裝較舊版本會略過此防護；資料庫仍會拒絕舊的二進位檔，但只會在安裝完成後才拒絕。

### 閘道因較新的結構描述版本錯誤而拒絕啟動

較新的 OpenClaw 組建曾寫入你的資料庫，而目前執行的組建較舊。錯誤訊息和閘道啟動日誌會指出擁有該資料庫的組建（`app_version`）。請安裝該版本或更新版本，或使用上述任一選項。不要編輯資料庫以消除錯誤。

### 完整性驗證失敗後資料庫遭到隔離

背景驗證程式已證實該檔案損毀，因此現在每次開啟時都會快速失敗，而不會重新掃描。請從備份還原或修復資料庫，然後執行 `openclaw doctor --fix` 以清除隔離記錄。如果隔離記錄本身無法清除，Doctor 會回報明確錯誤；請重複執行，直到它回報狀態正常為止。

## 不支援降級

手動降級結構描述僅供願意承擔風險的代理程式和操作人員使用。編輯任何資料庫前，請先[建立並驗證備份](/zh-TW/cli/backup)。停止閘道以及所有可能開啟該資料庫的程序。

一般程序如下：

1. 閱讀目標版本的結構描述和遷移。
2. 在單一交易中，移除目標版本之後引入的所有資料表、索引、觸發程序和欄位。
3. 將 `PRAGMA user_version` 和 `schema_meta.schema_version` 設為目標版本。
4. 啟動閘道前，執行目標版本的完整資料庫驗證。

### 範例：代理程式結構描述 11 降至 9

結構描述 10 新增了作用中逐字記錄投影。結構描述 11 新增了租約、持久傳遞、對話位址狀態及心跳偵測結果。QMD 協調使用 `state_leases` 中的資料列；沒有需要保留的獨立 QMD 資料表。

檢查寫入資料庫的確切結構描述後，對每個受影響的每代理程式資料庫執行等效的 SQL：

```sql
BEGIN IMMEDIATE;

DROP TABLE IF EXISTS heartbeat_outcomes;
DROP TABLE IF EXISTS conversation_deliveries;
DROP TABLE IF EXISTS state_leases;
DROP TABLE IF EXISTS session_transcript_active_events;

ALTER TABLE session_transcript_index_state DROP COLUMN active_event_count;
ALTER TABLE session_transcript_index_state DROP COLUMN active_message_count;
ALTER TABLE conversations DROP COLUMN delivery_target;

PRAGMA user_version = 9;
UPDATE schema_meta
SET schema_version = 9,
    updated_at = unixepoch('now') * 1000
WHERE meta_key = 'primary';

COMMIT;
```

這會捨棄版本 10-11 的狀態，包括傳遞中的作業、租約、心跳偵測結果，以及衍生的作用中逐字記錄投影。若降級操作失敗，請從已驗證的備份還原。
