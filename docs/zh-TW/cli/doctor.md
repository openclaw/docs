---
read_when:
    - 你遇到連線／驗證問題，並希望取得引導式修正協助
    - 你已完成更新，並想進行完整性檢查
summary: '`openclaw doctor` 的命令列介面參考（健康檢查 + 引導式修復）'
title: 醫生
x-i18n:
    generated_at: "2026-07-16T11:28:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

針對閘道、頻道、外掛、Skills、模型路由、本機狀態和設定遷移進行健康狀態檢查與快速修復。當任何項目未如預期運作，且你想用一個命令說明問題所在時，請使用此功能。

相關內容：

- 疑難排解：[疑難排解](/zh-TW/gateway/troubleshooting)
- 安全性稽核：[安全性](/zh-TW/gateway/security)

## 運作模式

Doctor 有五種運作模式：

| 運作模式                  | 命令                                      | 行為                                                                            |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| 檢查                      | `openclaw doctor`                        | 執行以人為導向的檢查並提供引導式提示。                                          |
| 修復                      | `openclaw doctor --fix`                        | 套用支援的修復；除非非互動式修復是安全的，否則會使用提示。                      |
| Lint                      | `openclaw doctor --lint`                        | 針對 CI、預檢和審查閘門提供唯讀的結構化發現。                                   |
| 共用 SQLite 維護          | `openclaw doctor --state-sqlite compact`                        | 明確為標準共用狀態資料庫建立檢查點、壓縮並進行驗證。                            |
| 工作階段 SQLite 遷移      | `openclaw doctor --session-sqlite <mode>`                        | 檢查、匯入、驗證、壓縮、復原或還原工作階段狀態。                                |

當自動化需要穩定的結果時，建議使用 `--lint`。當人工操作員希望 Doctor 編輯設定或狀態時，建議使用 `--fix`。

## 範例

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

若要檢查頻道特定權限，請使用頻道探測，而非 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` 會回報機器人對特定頻道目標的有效權限。`channels status --probe` 會稽核所有已設定的頻道和語音自動加入目標。

## 選項

| 選項                            | 效果                                                                                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`              | 停用工作區記憶體／搜尋建議。                                                                                                                                                            |
| `--yes`              | 不顯示提示並接受預設值。                                                                                                                                                                |
| `--repair` / `--fix` | 不顯示提示並套用建議的非服務修復（`--fix` 是別名）。閘道服務安裝／重寫仍需要互動式確認或明確的 `gateway` 命令。                                                       |
| `--force`              | 套用積極修復，包括覆寫自訂服務設定。                                                                                                                                                    |
| `--non-interactive`              | 不顯示提示執行；僅執行安全遷移和非服務修復。                                                                                                                                            |
| `--generate-gateway-token`              | 產生並設定閘道權杖。                                                                                                                                                                    |
| `--allow-exec`              | 允許 Doctor 在驗證密鑰時執行已設定的 `exec` SecretRefs。                                                                                                                     |
| `--deep`              | 掃描系統服務以尋找額外的閘道安裝；回報近期的閘道監督程式重新啟動交接。                                                                                                                  |
| `--lint`              | 以唯讀模式執行現代化健康狀態檢查並輸出診斷發現。                                                                                                                                        |
| `--post-upgrade`              | 執行升級後外掛相容性探測；發現會輸出至標準輸出；若存在任何錯誤層級的發現，結束代碼為 1。                                                                                                 |
| `--state-sqlite <mode>`              | 執行明確的共用狀態 SQLite 維護。唯一模式為 `compact`。                                                                                                                         |
| `--session-sqlite <mode>`              | 執行指定的工作階段 SQLite 遷移模式：`inspect`、`dry-run`、`import`、`validate`、`compact`、`recover` 或 `restore`。        |
| `--session-sqlite-store <path>`              | 搭配 `--session-sqlite`：選取一個舊版 `sessions.json` 儲存區路徑。                                                                                                                    |
| `--session-sqlite-agent <id>`              | 搭配 `--session-sqlite`：選取一個已設定的代理程式。                                                                                                                                     |
| `--session-sqlite-all-agents`              | 搭配 `--session-sqlite`：選取已設定及已探索到的代理程式儲存區。                                                                                                                         |
| `--github-issue`              | 搭配 `--session-sqlite recover`：準備一份經過清理的 openclaw/openclaw 問題回報；在使用 `--yes` 或取得互動式確認後，Doctor 會透過 `gh` 建立該問題。                          |
| `--json`              | 搭配 `--lint`：JSON 發現。搭配 `--post-upgrade`：`{ probesRun, findings }`。搭配 `--state-sqlite` 或 `--session-sqlite`：以 JSON 格式輸出維護報告。                                 |
| `--severity-min <level>`              | 搭配 `--lint`：捨棄低於 `info`、`warning` 或 `error` 的發現。                                                                                  |
| `--all`              | 搭配 `--lint`：執行所有已註冊的檢查，包括預設集合中排除、需選擇加入的檢查。                                                                                                    |
| `--skip <id>`              | 搭配 `--lint`：略過一個檢查 ID。可重複使用。                                                                                                                                  |
| `--only <id>`              | 搭配 `--lint`：僅執行指定的檢查 ID。可重複使用。                                                                                                                              |

`--severity-min`、`--all`、`--only` 和 `--skip` 僅能與 `--lint` 一起使用；`--json` 可與 `--lint`、`--post-upgrade`、`--state-sqlite` 和 `--session-sqlite` 一起使用。

## Lint 模式

`openclaw doctor --lint` 是唯讀的：不顯示提示、不執行修復，也不重寫設定／狀態。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

供人閱讀的輸出十分精簡：

```text
doctor --lint：已執行 6 項檢查，發現 1 個問題
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode 尚未設定；閘道啟動將遭到封鎖。
    修復方式：執行 `openclaw configure` 並設定閘道模式（local/remote），或執行 `openclaw config set gateway.mode local`。
```

JSON 輸出是供指令碼使用的介面：

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode 尚未設定；閘道啟動將遭到封鎖。",
      "path": "gateway.mode",
      "fixHint": "執行 `openclaw configure` 並設定閘道模式（local/remote），或執行 `openclaw config set gateway.mode local`。"
    }
  ]
}
```

結束代碼：

| 代碼 | 意義                                                          |
| ---- | ------------------------------------------------------------- |
| `0` | 在所選嚴重性門檻或以上沒有任何發現。                          |
| `1` | 至少有一項發現符合所選門檻。                                  |
| `2` | 在產生 Lint 發現之前發生命令／執行階段失敗。                  |

`--severity-min` 同時控制要顯示哪些發現及結束門檻：即使存在嚴重性較低的 `info`/`warning` 發現，`openclaw doctor --lint --severity-min error` 仍可能不顯示任何內容並以 `0` 結束。

`--all` 控制在套用嚴重性篩選之前要選取哪些檢查。預設 Lint 執行會排除深度、歷史性，或較可能顯示可修復舊版殘留項目的檢查；若要執行完整清單，請使用 `--all`。`--only <id>` 是最精確的選取器，可依 ID 執行任何已註冊的檢查。

`core/doctor/local-audio-acceleration` 會回報自動選取的本機 STT 命令、分開列出的可用／要求／觀察到的後端證據，以及備援順序，而不載入語音模型。它會輸出資訊層級的發現，因此請加入 `--severity-min info` 以顯示該資訊。

## 結構化健康狀態檢查

現代化 Doctor 檢查使用簡潔的分離式合約：

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` 驅動 `doctor --lint`。`repair()` 是選用項目，且僅會在 `doctor --fix` / `doctor --repair` 下執行。尚未遷移至此形式的檢查仍會使用舊版 Doctor 貢獻流程。

修復內容可以攜帶 `dryRun`/`diff` 要求；修復結果可以傳回結構化的 `diffs`（設定／檔案編輯）和 `effects`（服務、程序、套件、狀態或其他副作用），因此已轉換的檢查可以逐步朝 `doctor --fix --dry-run` 發展，而不必將變更規劃移入 `detect()`。

`repair()` 會回報 `status: "repaired" | "skipped" | "failed"`（省略狀態表示 `repaired`）。當修復傳回 `skipped` 或 `failed` 時，doctor 會回報原因，並略過該檢查的驗證。成功修復後，doctor 會針對已修復的發現項目重新執行 `detect()`；若該發現仍然存在，doctor 會回報修復警告，而不會將變更視為已完成。

發現項目包含：

| 欄位             | 用途                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | 用於略過／僅限篩選器及 CI 允許清單的穩定 ID。     |
| `severity`        | `info`、`warning` 或 `error`。                         |
| `message`         | 便於人員閱讀的問題陳述。                      |
| `path`            | 可用時提供設定、檔案或邏輯路徑。          |
| `line` / `column` | 可用時提供來源位置。                        |
| `ocPath`          | 當檢查可指向特定位置時，提供精確的 `oc://` 位址。 |
| `fixHint`         | 建議的操作人員動作或修復摘要。           |

現代化的核心 doctor 檢查仍附加於負責其人員操作 `doctor` / `doctor --fix` 行為的有序 doctor 貢獻項目。共用的結構化健康狀態登錄表是擴充點：內建及由外掛支援的檢查，在其所屬套件於作用中的命令路徑完成註冊後，會於核心 doctor 檢查之後執行。`openclaw/plugin-sdk/health` 為外掛作者公開相同的合約。

## 檢查選取

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` 和 `--skip` 接受完整的檢查 ID，且可重複指定。若 `--only` ID 尚未註冊，便不會針對該 ID 執行任何檢查；請使用輸出中的 `checksRun`/`checksSkipped`，確認聚焦閘門選取了預期的檢查。

## 升級後模式

`openclaw doctor --post-upgrade` 會執行外掛相容性探測，以便串接於建置或升級之後。發現項目會輸出至 stdout；若任何發現項目具有 `level: "error"`，結束代碼即為 1。加入 `--json` 可取得適合 CI、社群 `fork-upgrade` skill 及其他升級後煙霧測試工具使用的機器可讀封裝（`{ probesRun, findings }`）。若已安裝的外掛索引遺失或格式錯誤，JSON 模式仍會輸出含有 `plugin.index_unavailable` 錯誤發現項目的封裝。

容器映像啟動是一般「更新後執行 doctor」流程的例外。當 `openclaw gateway run` 在新版 OpenClaw 上啟動時，會先執行安全的狀態與外掛修復，再回報就緒。如果無法安全完成修復，啟動程序會結束，並指示你先使用同一映像，以 `openclaw doctor --fix` 對相同的已掛載狀態／設定執行一次，再正常重新啟動容器。

## 共用狀態 SQLite 壓縮

`openclaw doctor --state-sqlite compact` 是針對位於 `<state-dir>/state/openclaw.sqlite` 的標準共用狀態資料庫所進行的明確離線維護。它不接受任意資料庫路徑，絕不會由一般閘道作業叫用，也不屬於 `openclaw doctor --fix`。此命令會取得與閘道啟動相同的狀態擁有權鎖定，並在驗證、檢查點作業、`VACUUM` 與最終完整性檢查的整個過程中持有該鎖定。當閘道或其他 SQLite 維護命令持有該鎖定時，它會拒絕執行。當 `OPENCLAW_ALLOW_MULTI_GATEWAY=1` 略過每個設定的閘道單例時，狀態鎖定仍會保持作用中，因此操作人員的 shell 不必繼承閘道服務的環境，維護作業也能偵測到該服務。

先停止閘道並建立經驗證的備份：

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

此命令：

1. 要求標準共用狀態路徑上必須是一般檔案。若資料庫不存在，會回報為 `skipped` 並成功結束。
2. 在建立檢查點或變更檔案之前，驗證目前支援的結構描述版本與 `schema_meta.role = "global"`。
3. 要求 `wal_checkpoint(TRUNCATE)` 不處於忙碌狀態。若檢查點忙碌，請停止任何仍在執行的 OpenClaw 程序後重試。
4. 將 `auto_vacuum` 設為 `INCREMENTAL`、執行完整的 `VACUUM`，然後再次建立檢查點。
5. 執行 `quick_check`、`integrity_check` 與 `foreign_key_check`，接著將僅限擁有者的權限重新套用至資料庫與 SQLite 附屬檔案。

JSON 輸出會回報壓縮前後的資料庫與 WAL 大小、freelist 頁數、頁面大小及 `auto_vacuum` 值，以及回收的位元組數與 `quick_check` 和 `integrity_check` 結果。`foreign_key_check` 會強制採取失敗即關閉策略，且沒有獨立的成功欄位。SQLite 會將 `auto_vacuum` 回報為：`0` 表示無、`1` 表示完整、`2` 表示增量。

當結構描述過舊、比目前執行中的 OpenClaw 建置更新，或屬於代理程式資料庫時，壓縮會在不修改資料的情況下失敗。若共用狀態結構描述較舊，請先執行 `openclaw doctor --fix`。若結構描述較新，請還原相容的備份或升級 OpenClaw。

## 工作階段 SQLite 遷移

OpenClaw 會在閘道啟動期間及執行 `openclaw doctor --fix` 期間，自動將舊版工作階段資料列和逐字記錄歷程匯入各代理程式的 SQLite 資料庫。`openclaw doctor --session-sqlite <mode>` 是此遷移的定向檢查與驗證工具。目前執行階段的工作階段資料列位於 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。舊版 `sessions.json` 檔案是遷移來源。常用逐字記錄 JSONL 檔案會在成功匯入後匯入並封存至作用中工作階段目錄之外；封存層級的 JSONL 檔案仍是支援成品，而不是執行階段的後援機制。

模式：

| 模式       | 行為                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | 讀取舊版與 SQLite 計數，以及未被參照的 JSONL 檔案，但不進行匯入。                                       |
| `dry-run`  | 剖析舊版項目與逐字記錄 JSONL 檔案、計算可匯入資料列，並在不寫入 SQLite 資料列的情況下回報問題。 |
| `import`   | 將舊版項目與逐字記錄事件匯入所選目標的 SQLite。                                      |
| `validate` | 比較所選舊版來源與 SQLite 資料列及逐字記錄事件計數。                                   |
| `compact`  | 對所選代理程式 SQLite 資料庫建立檢查點並執行 VACUUM，以便在大量刪除或封存清理後回收可用頁面。    |
| `recover`  | 還原最近一次失敗的遷移執行、驗證其目標，並準備經過清理的 GitHub 問題回報。            |
| `restore`  | 從已記錄的遷移資訊清單還原已封存的逐字記錄成品，而不刪除 SQLite 資料。                  |

選取器：

- 預設：已設定的預設代理程式儲存區，但僅限該舊版儲存區檔案存在時。
- `--session-sqlite-agent <id>`：一個已設定的代理程式。
- `--session-sqlite-all-agents`：已設定的代理程式儲存區加上探索到的代理程式儲存區。
- `--session-sqlite-store <path>`：一個明確的舊版 `sessions.json` 路徑。

手動檢查順序：

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

若安裝中包含重要歷程，請先備份 OpenClaw 狀態目錄，再執行 `import`。當所選舊版項目未出現在 SQLite 中、工作階段 ID 不同，或逐字記錄事件計數不同時，`validate` 會以非零狀態結束。使用 `--session-sqlite-store <path>` 時，請檢查報告是否包含預期的目標數量；不存在的明確儲存區路徑不會選取任何目標。

SQLite 刪除作業會先回收資料庫內部的頁面；不一定會立即縮小資料庫檔案。刪除或封存大型逐字記錄後，請執行 `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`，以建立 WAL 檔案的檢查點、執行 `VACUUM`，並回報資料庫與 WAL 壓縮前後的大小。壓縮要求一般檔案必須採用目前的代理程式結構描述、具有所選代理程式的持久擁有者中繼資料，且 doctor 程序中不得有開啟的控制代碼。具破壞性的 `import`、`compact`、`recover` 與 `restore` 模式，會在整個作業期間持有與閘道啟動相同的狀態擁有權鎖定；`inspect`、`dry-run` 與 `validate` 則維持唯讀且不取得該鎖定。請先停止閘道。具破壞性的模式會直接失敗，而不是與即時寫入或另一個維護命令競爭。具破壞性的 `--session-sqlite-store` 目標必須位於作用中的狀態目錄內；維護其他安裝時，請將 `OPENCLAW_STATE_DIR` 設為該儲存區所屬的狀態目錄。現有的硬連結目標會遭到拒絕，因為鎖定狀態目錄外的另一個路徑可能共用同一個資料庫 inode。相同的擁有權檢查也涵蓋 SQLite WAL、共用記憶體及復原日誌附屬檔案。

每次匯入都會先在 `~/.openclaw/session-sqlite-migration-runs/` 下寫入資訊清單，再將逐字記錄成品移至封存區。若成品移動後，啟動程序回報工作階段 SQLite 遷移失敗，請執行復原：

```bash
openclaw doctor --session-sqlite recover --github-issue
```

復原作業會選取最近一次失敗的遷移資訊清單、僅還原該資訊清單中的已封存成品、驗證受影響的目標、重新整理已清理的 `.failure.md` 與 `.failure.json` 報告，並準備不含逐字記錄內容、原始環境、機密資料及無界限設定的 GitHub 問題內文。若不存在失敗的遷移資訊清單，但所選代理程式 SQLite 資料庫已損毀、不是資料庫，或只有日誌附屬檔案而沒有主資料庫，復原作業會將完整檔案集複製到暫存檢查目錄。SQLite 可以在該可拋棄副本中復原有效的作用中日誌，再執行 `quick_check`、`integrity_check` 與 `foreign_key_check`，而原始鑑識檔案則保持不變。完整性檢查失敗或存在孤立的附屬檔案時，會以同一個 `.corrupt-<timestamp>` 後綴重新命名整組探索到的檔案，藉此保留 DB、WAL、SHM 與復原日誌檔案。若重新命名失敗遭到攔截，系統會先復原已移動的檔案，再回報失敗，因此可復原的檔案集不會在無警告的情況下遭到拆分。復原前請停止閘道；複製或重新命名仍持續變動的 SQLite 檔案集並不安全，且在不同作業系統上的行為也不同。使用 `--github-issue --yes` 時，doctor 會使用 GitHub 命令列介面在 `openclaw/openclaw` 中建立問題；若未確認，則會寫入本機支援報告並輸出預先填妥的問題 URL。

`restore` 仍是較低階的復原操作。它會使用資訊清單中的 `sourcePath -> archivePath` 記錄，僅在原始路徑不存在時將已封存成品移回；當兩個路徑都存在時會回報衝突，並保留 SQLite 資料庫。

### 工作階段 SQLite 遷移後降級

啟動較舊、以檔案為基礎的 OpenClaw 版本之前，請還原已封存的舊版逐字記錄成品：

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

較舊版本會讀取 `sessions.json` 項目，以及這些項目中記錄的 `sessionFile` 路徑。SQLite 遷移完成後，成功匯入會將使用中的 JSONL
對話記錄移至 `session-sqlite-import-archive/`，因此在還原作業將資訊清單中記錄的成品移回
其原始路徑之前，較舊的執行階段無法
看到該歷史記錄。

還原不會刪除 SQLite 資料。在切換至 SQLite 後建立的工作階段
只存在於 SQLite 中，不會出現在較舊的執行階段。若之後再次
升級，請執行上述的一般遷移驗證程序，讓 OpenClaw 能在匯入前
比較已還原的舊版成品與 SQLite 資料列。

## 注意事項

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，唯讀的 doctor 檢查仍可運作，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 和 `doctor --generate-gateway-token` 會停用，因為 `openclaw.json` 不可變。請改為編輯此安裝的 Nix 來源；若使用 nix-openclaw，請參閱代理程式優先的[快速入門](https://github.com/openclaw/nix-openclaw#quick-start)。
- 互動式提示（鑰匙圈/OAuth 修正等）僅會在 stdin 為 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（排程、Telegram、無終端機）會略過提示。
- 非互動式 `doctor` 執行會略過預先載入外掛，讓無頭健康狀態檢查維持快速。互動式工作階段仍會載入舊版健康狀態／修復流程所需的外掛介面。
- `--lint` 比 `--non-interactive` 更嚴格：一律唯讀、絕不提示，也絕不套用安全遷移。若要讓 doctor 進行變更，請使用 `doctor --fix` 或 `doctor --repair`。
- Doctor 預設不會在檢查秘密時執行 `exec` SecretRef。只有在你刻意要讓 doctor 執行這些已設定的秘密解析器時，才使用 `--allow-exec`（可搭配或不搭配 `--lint`）。
- 任何設定寫入（包括 `--fix` 修復）都會將備份輪替至 `~/.openclaw/openclaw.json.bak`（並使用編號為 `.bak.1`..`.bak.4` 的循環備份）。`--fix` 也會移除結構描述驗證所回報的未知設定鍵，並逐一列出移除項目；更新進行期間會略過此操作，以免部分寫入的升級狀態在其遷移完成前遭到刪除。
- 當另一個監督程式負責閘道生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報閘道／服務健康狀態並套用非服務修復，但會略過服務安裝／啟動／重新啟動／啟動程序，以及舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外類閘道 systemd 單元，且修復期間不會重寫執行中 systemd 閘道服務的命令／進入點中繼資料。請先停止服務，或使用 `openclaw gateway install --force` 取代作用中的啟動器。
- `doctor --fix --non-interactive` 會回報遺失或過時的閘道服務定義，但不會在更新修復模式以外安裝或重寫這些定義。若服務遺失，請執行 `openclaw gateway install`；若要取代啟動器，請執行 `openclaw gateway install --force`。
- 狀態完整性檢查會偵測工作階段目錄中的孤立對話記錄檔。將其封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 和無頭執行會將其保留在原處。
- Doctor 會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的舊版排程工作格式，並在將標準資料列匯入 SQLite 前重寫這些格式。
- Doctor 會回報具有明確 `payload.model` 覆寫的排程工作，包括提供者命名空間計數，以及與 `agents.defaults.model` 的不相符情況，讓未繼承預設模型的排程工作在認證或計費調查期間可見。
- Doctor 會回報仍標記為進行中（`state.runningAtMs`）的排程工作，這可能使 `openclaw cron list` 將其顯示為 `running`。此檢查為唯讀：若目前沒有閘道正在執行已標記的工作，下次排程服務啟動時會記錄遭中斷的執行並清除該標記。
- 在 Linux 上，若使用者的 crontab 仍執行無人維護的舊版 `~/.openclaw/bin/ensure-whatsapp.sh`，doctor 會發出警告；當排程缺少 systemd 使用者匯流排環境時，此項目可能錯誤回報 `Gateway inactive`。
- 啟用 WhatsApp 時，doctor 會檢查是否有本機 `openclaw-tui` 用戶端仍在執行，導致閘道事件迴圈效能下降。`doctor --fix` 只會停止經驗證的本機終端介面用戶端，避免 WhatsApp 回覆排在過時的終端介面重新整理迴圈之後。
- Doctor 會將舊版 `codex/*` 和 `openai-codex/*` 模型參照重寫為標準 `openai/*` 參照，涵蓋主要模型、備援模型、模型允許清單、圖片／影片生成模型、心跳偵測／子代理程式／壓縮覆寫、掛鉤、頻道模型覆寫、排程承載資料，以及過時的工作階段／對話記錄路由固定設定。`--fix` 也會在安全時合併舊版 `models.providers.codex` 和 `models.providers.openai-codex` 設定、將舊版 `openai-codex:*` 認證設定檔與 `auth.order.openai-codex` 項目遷移至 `openai:*`、將 Codex 意圖移至以提供者／模型為範圍的 `agentRuntime.id: "codex"` 項目、移除過時的整個代理程式／工作階段執行階段固定設定，並讓修復後的 OpenAI 代理程式參照繼續使用 Codex 認證路由，而非直接使用 OpenAI API 金鑰認證。
- Doctor 會回報非空的 `auth.order.<provider>` 清單：其參照的設定檔已全部消失，但仍存在相容的已儲存認證資訊。`doctor --fix` 只會刪除這些過時的覆寫，還原每個代理程式自動選取認證資訊的功能；明確的空白順序、部分仍有效的清單，以及沒有相容已儲存認證資訊的順序均維持不變。若作用中的 SQLite 認證儲存區無法讀取或格式錯誤，doctor 會說明略過此修復的原因。若執行中的閘道之設定重新載入模式不會自動套用寫入內容，請先重新啟動閘道，再重新檢查認證狀態。
- Doctor 會清理較舊 OpenClaw 版本留下的舊版外掛相依套件暫存狀態，並針對將主機 `openclaw` 套件宣告為對等相依套件的受管理 npm 外掛，重新連結該套件。它也會修復設定所參照但遺失的可下載外掛（`plugins.entries`、已設定的頻道、已設定的提供者／搜尋設定、已設定的代理程式執行階段）。套件更新期間，doctor 會略過套件管理器的外掛修復，直到套件置換完成；若已設定的外掛仍需復原，請於之後重新執行 `openclaw doctor --fix`。若下載失敗，doctor 會回報安裝錯誤，並保留已設定的外掛項目，供下次修復嘗試使用。
- 當外掛探索功能正常時，doctor 會從 `plugins.allow`/`plugins.deny`/`plugins.entries` 中移除遺失的外掛 ID，以及相符的懸空頻道設定、心跳偵測目標和頻道模型覆寫，藉此修復過時的外掛設定。
- Doctor 會隔離無效的外掛設定，方法是停用受影響的 `plugins.entries.<id>` 項目，並移除其無效的 `config` 承載資料。閘道啟動時已只會略過該有問題的外掛，因此其他外掛和頻道可繼續運作。
- Doctor 會移除已淘汰的 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex 應用程式伺服器一律讓 Codex 原生工作區工具維持原生。
- Doctor 會自動將舊版扁平化 Talk 設定（`talk.voiceId`、`talk.modelId` 等）遷移至 `talk.provider` + `talk.providers.<provider>`。當唯一差異是物件鍵順序時，重複執行 `doctor --fix` 不再回報／套用 Talk 正規化。
- Doctor 包含記憶搜尋就緒狀態檢查，並可在缺少嵌入認證資訊時建議 `openclaw configure --section model`。
- 未設定命令擁有者時，doctor 會發出警告。命令擁有者是獲准執行僅限擁有者命令並核准危險操作的人類操作者帳號。DM 配對只允許某人與機器人交談；若你在首次擁有者啟動程序出現前就已核准某個傳送者，請明確設定 `commands.ownerAllowFrom`。
- 已設定 Codex 模式代理程式，且操作者的 Codex 主目錄中存在個人 Codex 命令列介面資產時，doctor 會回報資訊提示。本機 Codex 應用程式伺服器會使用每個代理程式的隔離主目錄啟動；如有需要，請先安裝 Codex 外掛，再使用 `openclaw migrate plan codex` 清點應經審慎評估後提升的資產。
- 當預設代理程式允許的 Skills 在目前執行階段環境中不可用（缺少二進位檔、環境變數、設定或作業系統需求）時，doctor 會發出警告。`doctor --fix` 可使用 `skills.entries.<skill>.enabled=false` 停用這些不可用的 Skills；若要維持 Skills 啟用，請改為安裝／設定缺少的需求。
- 若已啟用沙箱模式但 Docker 不可用，doctor 會回報具有明確處置方式的警告（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 若存在舊版沙箱登錄檔或分片目錄（`~/.openclaw/sandbox/containers.json`、`~/.openclaw/sandbox/browsers.json`、`~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/`），doctor 會回報這些項目；`--fix` 會將有效項目遷移至 SQLite，並隔離無效的舊版檔案。
- 若 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在目前的命令路徑中不可用，doctor 會回報唯讀警告，且不會寫入純文字備援認證資訊。對於由 exec 支援的 SecretRef，除非存在 `--allow-exec`，否則 doctor 會略過執行。
- 若頻道 SecretRef 檢查在修正路徑中失敗，doctor 會繼續執行並回報警告，而非提早結束。
- 狀態目錄遷移後，若已啟用的預設 Telegram 或 Discord 帳號依賴環境備援，且 doctor 程序無法使用 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN`，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中可解析的 Telegram 權杖。若無法檢查權杖，doctor 會回報警告，並略過該次執行的自動解析。

## macOS：`launchctl` 環境變數覆寫

若你先前執行過 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），該值會覆寫設定檔，並可能持續造成「未授權」錯誤。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [閘道 doctor](/zh-TW/gateway/doctor)
