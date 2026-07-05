---
read_when:
    - 升級現有的 Matrix 安裝
    - 遷移加密的 Matrix 歷史記錄與裝置狀態
summary: OpenClaw 如何就地升級先前的 Matrix 外掛，包括加密狀態復原限制與手動復原步驟。
title: Matrix 遷移
x-i18n:
    generated_at: "2026-07-05T11:02:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6607045ac7760dc9d1ecdb1dd3d3885a7213d4e6f45eb32fd9a47c76f178c8c
    source_path: channels/matrix-migration.md
    workflow: 16
---

從先前公開的 `matrix` 外掛升級到目前的實作。

對大多數使用者而言，升級會原地完成：

- 外掛仍是 `@openclaw/matrix`
- 頻道仍是 `matrix`
- 你的設定仍位於 `channels.matrix` 之下
- 快取的憑證仍位於 `~/.openclaw/credentials/matrix/` 之下
- 執行階段狀態仍位於 `~/.openclaw/matrix/` 之下

你不需要重新命名設定鍵，也不需要用新名稱重新安裝外掛。
根 `openclaw` 套件不再內建 Matrix 執行階段程式碼或 Matrix SDK
相依項目。如果 `openclaw channels status` 顯示 Matrix 已設定，但
外掛尚未安裝，請執行 `openclaw doctor --fix` 或
`openclaw plugins install @openclaw/matrix`；不要將 Matrix SDK 套件
安裝到根 OpenClaw 套件中。

## 遷移會自動做什麼

Matrix 遷移會在閘道啟動時執行（透過已載入的 Matrix 外掛）、在你執行 [`openclaw doctor --fix`](/zh-TW/gateway/doctor) 時執行，並且在 Matrix 用戶端啟動且仍找到舊的磁碟狀態時作為後備執行。在任何可執行的遷移步驟變更磁碟狀態之前，OpenClaw 會建立或重用一個聚焦的復原快照。

使用 `openclaw update` 時，確切觸發方式取決於 OpenClaw 的安裝方式：

- 原始碼安裝會在更新流程期間執行一次非互動式 `openclaw doctor --fix`，然後預設重新啟動閘道
- 套件管理器安裝會更新套件、執行 `openclaw doctor --non-interactive --fix`，然後依賴預設的閘道重新啟動，讓啟動流程完成 Matrix 遷移
- 如果你使用 `openclaw update --no-restart`，由啟動支援的 Matrix 遷移會延後到你稍後執行 `openclaw doctor --fix` 並重新啟動閘道時才進行

自動遷移涵蓋：

- 在 `~/Backups/openclaw-migrations/` 之下建立或重用遷移前快照
- 重用你快取的 Matrix 憑證
- 保留相同的帳戶選擇與 `channels.matrix` 設定
- 在可安全解析目標帳戶時，將舊的扁平 Matrix 同步儲存區與加密儲存區移到目前依帳戶限定的位置
- 將基於檔案的旁掛狀態（`bot-storage.json` 同步快取、`recovery-key.json`、`legacy-crypto-migration.json`、IndexedDB 快照）匯入 Matrix SQLite 狀態；已遷移的檔案會以 `.migrated` 後綴封存
- 當舊的 rust 加密儲存區本機存在先前儲存的 Matrix 房間金鑰備份解密金鑰時，將其取出
- 當存取權杖稍後變更時，重用同一個 Matrix 帳戶、主伺服器、使用者與裝置最完整的既有權杖雜湊儲存根
- 當 Matrix 存取權杖已變更但帳戶/裝置身分維持相同時，掃描同層的權杖雜湊儲存根，以尋找待處理的加密狀態還原中繼資料
- 在下一次 Matrix 啟動時，將已備份的房間金鑰還原到新的加密儲存區

快照詳細資料：

- OpenClaw 會在成功建立快照後，於 `~/.openclaw/matrix/migration-snapshot.json` 寫入標記檔，讓後續啟動與修復程序可以重用同一個封存。
- 這些自動 Matrix 遷移快照只備份設定 + 狀態（`includeWorkspace: false`）。
- 如果 Matrix 只有僅警告的遷移狀態，例如因為仍缺少 `userId` 或 `accessToken`，OpenClaw 尚不會建立快照，因為沒有可執行的 Matrix 變更。
- 如果快照步驟失敗，OpenClaw 會略過該次執行的 Matrix 遷移，而不是在沒有復原點的情況下變更狀態。

關於多帳戶升級：

- 扁平 Matrix 儲存區（`~/.openclaw/matrix/bot-storage.json` 和 `~/.openclaw/matrix/crypto/`）來自單一儲存區版面配置，因此 OpenClaw 只能將其遷移到一個已解析的 Matrix 帳戶目標
- 已經依帳戶限定的舊版 Matrix 儲存區會針對每個已設定的 Matrix 帳戶進行偵測與準備

## 遷移無法自動做什麼

先前公開的 Matrix 外掛**不會**自動建立 Matrix 房間金鑰備份。它會持久保存本機加密狀態並要求裝置驗證，但不保證你的房間金鑰已備份到主伺服器。

這表示某些加密安裝只能部分遷移。

OpenClaw 無法自動復原：

- 從未備份的僅本機房間金鑰
- 因為 `homeserver`、`userId` 或 `accessToken` 仍不可用，而尚無法解析目標 Matrix 帳戶時的加密狀態
- 舊加密儲存區沒有記錄該帳戶裝置 ID 時的加密狀態
- 已設定多個 Matrix 帳戶但未設定 `channels.matrix.defaultAccount` 時，對同一個共用扁平 Matrix 儲存區的自動遷移
- 釘選到儲存庫路徑而非標準 Matrix 套件的自訂外掛路徑安裝（由 `openclaw doctor` 顯示）
- 舊儲存區有已備份金鑰但未在本機保留解密金鑰時，缺少的復原金鑰

如果你的舊安裝曾有從未備份的僅本機加密歷史記錄，升級後部分較舊的加密訊息可能仍無法讀取。

## 建議升級流程

1. 正常更新 OpenClaw 與 Matrix 外掛。
   建議使用一般的 `openclaw update`，不要加 `--no-restart`，讓啟動流程可以立即完成 Matrix 遷移。
2. 執行：

   ```bash
   openclaw doctor --fix
   ```

   如果 Matrix 有可執行的遷移工作，doctor 會先建立或重用遷移前快照，並列印封存路徑。

3. 啟動或重新啟動閘道。
4. 檢查目前的驗證與備份狀態：

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 將你正在修復的 Matrix 帳戶復原金鑰放入帳戶專用的環境變數。對單一預設帳戶而言，`MATRIX_RECOVERY_KEY` 即可。對多個帳戶，請為每個帳戶使用一個變數，例如 `MATRIX_RECOVERY_KEY_ASSISTANT`，並在命令中加入 `--account assistant`。

6. 如果 OpenClaw 告訴你需要復原金鑰，請針對相符的帳戶執行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. 如果此裝置仍未驗證，請針對相符的帳戶執行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   如果復原金鑰已被接受且備份可用，但 `Cross-signing verified`
   仍是 `no`，請從另一個 Matrix 用戶端完成自我驗證：

   ```bash
   openclaw matrix verify self
   ```

   在另一個 Matrix 用戶端中接受請求，比對表情符號或十進位數字，
   並且只有在相符時才輸入 `yes`。此命令會等待完整的 Matrix
   身分信任後才回報成功。

8. 如果你有意放棄無法復原的舊歷史記錄，並想為未來訊息建立全新的備份基準，請執行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   只有在舊復原金鑰不應再能解鎖新備份時，才加入 `--rotate-recovery-key`。

9. 如果尚未有伺服器端金鑰備份，請為未來復原建立一份：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 加密遷移如何運作

加密遷移是兩階段流程：

1. 如果加密遷移可執行，啟動流程或 `openclaw doctor --fix` 會建立或重用遷移前快照，然後透過 Matrix 外掛內建的加密檢查器檢查舊的 Matrix rust 加密儲存區。
2. 如果找到備份解密金鑰，OpenClaw 會將其匯入 Matrix SQLite 狀態，並將房間金鑰還原標記為待處理。
3. 下一次 Matrix 啟動時，OpenClaw 會自動將已備份的房間金鑰還原到新的加密儲存區。當存取權杖在這期間輪替時，待處理還原狀態也會從同層的權杖雜湊儲存根取得。

如果舊儲存區回報有從未備份的房間金鑰，OpenClaw 會發出警告，而不是假裝復原成功。

## 常見訊息及其含義

### 升級與偵測訊息

`Matrix plugin upgraded in place.`（doctor）或 `matrix: plugin upgraded in place for account "..."`（啟動）

- 含義：已偵測到舊的磁碟 Matrix 狀態，並已遷移到目前版面配置。
- 該做什麼：除非同一輸出也包含警告，否則不需要做任何事。

`Matrix migration snapshot created before applying Matrix upgrades.` / `Matrix migration snapshot reused before applying Matrix upgrades.`

- 含義：doctor 在變更 Matrix 狀態之前建立了復原封存，或找到既有的快照標記並重用該封存，而不是建立重複備份。啟動時會記錄為相同含義的 `matrix: created pre-migration backup snapshot: ...` / `matrix: reusing existing pre-migration backup snapshot: ...`。
- 該做什麼：保留列印出的封存路徑，直到確認遷移成功。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 含義：舊的 Matrix 狀態存在，但 OpenClaw 無法將其對應到目前的 Matrix 帳戶，因為尚未設定 Matrix。
- 該做什麼：設定 `channels.matrix`，然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含義：OpenClaw 找到舊狀態，但仍無法判定確切的目前帳戶/裝置根。
- 該做什麼：使用可運作的 Matrix 登入啟動一次閘道，或在快取憑證存在後重新執行 `openclaw doctor --fix`。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含義：OpenClaw 找到一個共用的扁平 Matrix 儲存區，但拒絕猜測應該由哪個具名 Matrix 帳戶接收它。
- 該做什麼：將 `channels.matrix.defaultAccount` 設為預期帳戶，然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

當受阻的儲存區是舊的加密儲存區時，同樣三個警告也會以前綴 `Legacy Matrix encrypted state detected at ...` 出現。

`Matrix legacy sync store not migrated because the target already exists (...)` / `Matrix legacy crypto store not migrated because the target already exists (...)`

- 含義：新的依帳戶限定位置已經有同步或加密儲存區，因此 OpenClaw 未自動覆寫它。
- 該做什麼：在手動移除或移動衝突目標之前，先確認目前帳戶是正確帳戶。

`Failed migrating Matrix legacy sync store (...)` 或 `Failed migrating Matrix legacy crypto store (...)`

- 含義：OpenClaw 嘗試移動舊 Matrix 狀態，但檔案系統操作失敗。
- 該做什麼：檢查檔案系統權限與磁碟狀態，然後重新執行 `openclaw doctor --fix`。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 含義：OpenClaw 偵測到舊 Matrix 狀態，但遷移仍因缺少身分或憑證資料而受阻。啟動時會記錄為 `matrix: migration remains in a warning-only state; no pre-migration snapshot was needed yet`。
- 該做什麼：完成 Matrix 登入或設定配置，然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`Legacy Matrix encrypted state was detected, but the Matrix crypto inspector is unavailable.`

- 含義：OpenClaw 找到舊的加密 Matrix 狀態，但 Matrix 外掛建置缺少用來檢查舊 rust 加密儲存區的加密檢查器模組。
- 該做什麼：重新安裝或修復 Matrix 外掛（`openclaw plugins install @openclaw/matrix`，或對儲存庫 checkout 使用 `openclaw plugins install ./path/to/local/matrix-plugin`），然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 意義：OpenClaw 拒絕變更 Matrix 狀態，因為它無法先建立復原快照。
- 處理方式：解決備份錯誤，然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`Failed migrating legacy Matrix client storage: ...`

- 意義：Matrix 用戶端側備援找到了舊儲存空間，但遷移失敗。OpenClaw 會回復已完成的移動並中止該備援，而不是靜默地以全新儲存區啟動。當扁平儲存區指向的帳號與目前正在啟動的帳號不同時，也會出現此錯誤。
- 處理方式：檢查檔案系統權限或衝突，保持舊狀態完整，修正錯誤後重試。

`Matrix is installed from a custom path: ...`

- 意義：Matrix 被固定為路徑安裝，因此主線更新不會自動以預設 Matrix 套件取代它。
- 處理方式：當你想回到預設 Matrix 外掛時，使用 `openclaw plugins install @openclaw/matrix` 重新安裝。

### 加密狀態復原訊息

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 意義：已備份的房間金鑰已成功還原到新的加密儲存區。
- 處理方式：通常不需要做任何事。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 意義：部分舊房間金鑰只存在於舊的本機儲存區，且從未上傳到 Matrix 備份。在準備期間，相同限制會回報為 `Legacy Matrix encrypted state for account "..." contains N room key(s) that were never backed up.`
- 處理方式：除非你能從另一個已驗證用戶端手動復原這些金鑰，否則預期部分舊的加密歷史紀錄仍無法使用。

`Legacy Matrix encrypted state detected at ... but no device ID was found for account "..."`

- 意義：舊加密儲存區未記錄它屬於哪個 Matrix 裝置，因此 OpenClaw 無法安全地檢查它。
- 處理方式：舊的加密歷史紀錄無法自動復原；OpenClaw 會略過它繼續執行。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- 意義：備份存在，但 OpenClaw 無法自動復原復原金鑰。
- 處理方式：執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`（優先於將金鑰作為引數傳入）。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 意義：OpenClaw 找到了舊加密儲存區，但無法以足夠安全的方式檢查它以準備復原。
- 處理方式：重新執行 `openclaw doctor --fix`。如果重複發生，請保持舊狀態目錄完整，並使用另一個已驗證的 Matrix 用戶端加上 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 進行復原。

`Legacy Matrix backup key was found for account "...", but Matrix SQLite state already contains a different recovery key. Leaving the existing state unchanged.`

- 意義：OpenClaw 偵測到備份金鑰衝突，並拒絕自動覆寫目前的復原金鑰狀態。
- 處理方式：在重試任何還原命令前，先確認哪個復原金鑰才是正確的。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 意義：這是舊儲存格式的硬性限制。
- 處理方式：已備份的金鑰仍可還原，但僅存在本機的加密歷史紀錄可能仍無法使用。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 意義：新外掛嘗試還原，但 Matrix 回傳錯誤。
- 處理方式：執行 `openclaw matrix verify backup status`，必要時再使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 重試。

### 手動復原訊息

`openclaw matrix verify status` 和 `openclaw matrix verify backup status` 會在此裝置上的房間金鑰備份不健康時，列印一行 `Backup issue:` 加上 `Next steps:` 指引：

| 備份問題                                                              | 意義                                               | 修正方式                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | 沒有可還原的來源                                   | 使用 `openclaw matrix verify bootstrap` 建立房間金鑰備份                                                                                  |
| `backup decryption key is not loaded on this device`                  | 金鑰存在但未在此處啟用                             | `openclaw matrix verify backup restore`；如果仍無法載入金鑰，請透過 `--recovery-key-stdin` 管道傳入復原金鑰                               |
| `backup decryption key could not be loaded from secret storage (...)` | 秘密儲存載入失敗或不受支援                         | 管道傳入復原金鑰：`printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`                    |
| `backup key mismatch (...)`                                           | 已儲存的金鑰與作用中的伺服器備份不相符             | 使用作用中的伺服器備份金鑰重新執行 `verify backup restore --recovery-key-stdin`，或用 `verify backup reset --yes` 建立新的基準            |
| `backup signature chain is not trusted by this device`                | 裝置尚未信任交叉簽署鏈                             | 先執行 `verify device --recovery-key-stdin`，如果信任仍不完整，再從另一個已驗證用戶端執行 `verify self`                                  |
| `backup exists but is not active on this device`                      | 伺服器備份存在，但本機工作階段未啟用               | 先驗證裝置，然後使用 `openclaw matrix verify backup status` 重新檢查                                                                       |
| `backup trust state could not be fully determined`                    | 診斷結果不明確                                     | `openclaw matrix verify status --verbose`                                                                                                 |

其他復原錯誤：

`Matrix recovery key is required`

- 意義：你嘗試執行復原步驟，但在需要復原金鑰時未提供。
- 處理方式：使用 `--recovery-key-stdin` 重新執行命令，例如 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 意義：提供的金鑰無法剖析，或不符合預期格式。
- 處理方式：使用來自你的 Matrix 用戶端或復原金鑰匯出的確切復原金鑰重試。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 意義：復原金鑰解鎖了可用的備份材料，但 Matrix 尚未為此裝置建立完整的交叉簽署身分信任。檢查命令輸出中的 `Recovery key accepted`、`Backup usable`、`Cross-signing verified` 和 `Device verified by owner`。
- 處理方式：執行 `openclaw matrix verify self`，在另一個 Matrix 用戶端接受請求，比對 SAS，且只有在相符時才輸入 `yes`。只有在你明確想取代目前的交叉簽署身分時，才使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`。

如果你接受失去無法復原的舊加密歷史紀錄，也可以改用
`openclaw matrix verify backup reset --yes` 重設目前的備份基準。當
已儲存的備份秘密損壞時，該重設也會修復秘密儲存，讓新的備份金鑰能在重新啟動後正確載入。

### 自訂外掛安裝訊息

`Matrix is installed from a custom path that no longer exists: ...`

- 意義：你的外掛安裝記錄指向一個已不存在的本機路徑。
- 處理方式：使用 `openclaw plugins install @openclaw/matrix` 重新安裝，或者如果你是從 repo checkout 執行，使用 `openclaw plugins install ./path/to/local/matrix-plugin`。`openclaw doctor --fix` 也可以替你移除過時的 Matrix 外掛參照。

## 如果加密歷史紀錄仍未恢復

依序執行這些檢查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

如果備份成功還原，但某些舊房間仍缺少歷史紀錄，這些缺少的金鑰很可能從未由先前的外掛備份。

## 如果你想為未來訊息重新開始

如果你接受失去無法復原的舊加密歷史紀錄，且只想為後續建立乾淨的備份基準，請依序執行這些命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果裝置在那之後仍未驗證，請從你的 Matrix 用戶端完成驗證，比對 SAS emoji 或十進位碼，並確認它們相符。

## 相關

- [Matrix](/zh-TW/channels/matrix)：頻道設定與配置。
- [Matrix 推送規則](/zh-TW/channels/matrix-push-rules)：通知路由。
- [診斷](/zh-TW/gateway/doctor)：健康檢查與自動遷移觸發器。
- [遷移指南](/zh-TW/install/migrating)：所有遷移路徑（機器搬移、跨系統匯入）。
- [外掛](/zh-TW/tools/plugin)：外掛安裝與註冊。
