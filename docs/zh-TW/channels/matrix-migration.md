---
read_when:
    - 升級既有的 Matrix 安裝
    - 遷移加密的 Matrix 歷史記錄與裝置狀態
summary: OpenClaw 如何就地升級先前的 Matrix Plugin，包括加密狀態復原限制及手動復原步驟。
title: Matrix 遷移
x-i18n:
    generated_at: "2026-05-02T22:16:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bc9b875fef0ae08978061a9fc7cbb076617009d79487ca8329e03076103b32c
    source_path: channels/matrix-migration.md
    workflow: 16
---

從先前公開的 `matrix` Plugin 升級到目前的實作。

對大多數使用者而言，升級會就地完成：

- Plugin 維持為 `@openclaw/matrix`
- channel 維持為 `matrix`
- 你的設定維持在 `channels.matrix` 底下
- 快取的憑證維持在 `~/.openclaw/credentials/matrix/` 底下
- 執行階段狀態維持在 `~/.openclaw/matrix/` 底下

你不需要重新命名設定鍵，或以新名稱重新安裝 Plugin。

## 遷移會自動執行的動作

當 Gateway 啟動，以及當你執行 [`openclaw doctor --fix`](/zh-TW/gateway/doctor) 時，OpenClaw 會嘗試自動修復舊的 Matrix 狀態。
在任何可執行的 Matrix 遷移步驟變更磁碟上的狀態之前，OpenClaw 會建立或重用一個專用的復原快照。

當你使用 `openclaw update` 時，確切的觸發條件取決於 OpenClaw 的安裝方式：

- 原始碼安裝會在更新流程中執行 `openclaw doctor --fix`，接著預設會重新啟動 Gateway
- 套件管理器安裝會更新套件、執行一次非互動式 doctor 檢查，接著依賴預設的 Gateway 重新啟動，讓啟動流程完成 Matrix 遷移
- 如果你使用 `openclaw update --no-restart`，由啟動流程支援的 Matrix 遷移會延後，直到你稍後執行 `openclaw doctor --fix` 並重新啟動 Gateway

自動遷移涵蓋：

- 在 `~/Backups/openclaw-migrations/` 底下建立或重用遷移前快照
- 重用你快取的 Matrix 憑證
- 保持相同的帳號選擇與 `channels.matrix` 設定
- 將最舊的扁平 Matrix 同步儲存移至目前以帳號為範圍的位置
- 在可安全解析目標帳號時，將最舊的扁平 Matrix 加密儲存移至目前以帳號為範圍的位置
- 從舊的 rust 加密儲存中擷取先前儲存的 Matrix 房間金鑰備份解密金鑰，前提是該金鑰存在於本機
- 當存取權杖稍後變更時，為相同 Matrix 帳號、homeserver 與使用者重用最完整的現有 token-hash 儲存根目錄
- 當 Matrix 存取權杖變更但帳號/裝置身分維持相同時，掃描相鄰的 token-hash 儲存根目錄，以尋找待處理的加密狀態還原中繼資料
- 在下一次 Matrix 啟動時，將已備份的房間金鑰還原到新的加密儲存中

快照詳細資訊：

- OpenClaw 會在成功建立快照後，於 `~/.openclaw/matrix/migration-snapshot.json` 寫入標記檔，讓後續啟動與修復流程可以重用同一個封存檔。
- 這些自動 Matrix 遷移快照只會備份設定與狀態（`includeWorkspace: false`）。
- 如果 Matrix 只有僅警告的遷移狀態，例如因為仍缺少 `userId` 或 `accessToken`，OpenClaw 尚不會建立快照，因為沒有可執行的 Matrix 變更。
- 如果快照步驟失敗，OpenClaw 會略過該次執行的 Matrix 遷移，而不是在沒有復原點的情況下變更狀態。

關於多帳號升級：

- 最舊的扁平 Matrix 儲存（`~/.openclaw/matrix/bot-storage.json` 與 `~/.openclaw/matrix/crypto/`）來自單一儲存配置，因此 OpenClaw 只能將它遷移到一個已解析的 Matrix 帳號目標
- 已經以帳號為範圍的舊版 Matrix 儲存會依每個已設定的 Matrix 帳號偵測並準備

## 遷移無法自動執行的動作

先前公開的 Matrix Plugin **不會**自動建立 Matrix 房間金鑰備份。它會保留本機加密狀態並要求裝置驗證，但不保證你的房間金鑰已備份到 homeserver。

這表示部分加密安裝只能局部遷移。

OpenClaw 無法自動復原：

- 從未備份的僅存在本機的房間金鑰
- 因為 `homeserver`、`userId` 或 `accessToken` 仍不可用，導致目標 Matrix 帳號尚無法解析時的加密狀態
- 已設定多個 Matrix 帳號但未設定 `channels.matrix.defaultAccount` 時，對單一共用扁平 Matrix 儲存的自動遷移
- 固定到 repo 路徑、而非標準 Matrix 套件的自訂 Plugin 路徑安裝
- 舊儲存有已備份金鑰，但未在本機保留解密金鑰時遺失的復原金鑰

目前警告範圍：

- 自訂 Matrix Plugin 路徑安裝會同時由 Gateway 啟動與 `openclaw doctor` 顯示

如果你的舊安裝有從未備份的僅存在本機加密歷史紀錄，升級後某些較舊的加密訊息可能仍無法讀取。

## 建議升級流程

1. 正常更新 OpenClaw 與 Matrix Plugin。
   建議使用一般的 `openclaw update`，不要加上 `--no-restart`，讓啟動流程可以立即完成 Matrix 遷移。
2. 執行：

   ```bash
   openclaw doctor --fix
   ```

   如果 Matrix 有可執行的遷移工作，doctor 會先建立或重用遷移前快照，並列印封存檔路徑。

3. 啟動或重新啟動 Gateway。
4. 檢查目前的驗證與備份狀態：

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 將你正在修復的 Matrix 帳號復原金鑰放入帳號專用的環境變數。對單一預設帳號而言，`MATRIX_RECOVERY_KEY` 即可。對多個帳號，請為每個帳號使用一個變數，例如 `MATRIX_RECOVERY_KEY_ASSISTANT`，並在命令中加入 `--account assistant`。

6. 如果 OpenClaw 告訴你需要復原金鑰，請針對相符帳號執行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. 如果此裝置仍未驗證，請針對相符帳號執行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   如果復原金鑰已接受且備份可用，但 `Cross-signing verified`
   仍為 `no`，請從另一個 Matrix 用戶端完成自我驗證：

   ```bash
   openclaw matrix verify self
   ```

   在另一個 Matrix 用戶端接受請求、比較 emoji 或十進位數字，
   並且只有在相符時才輸入 `yes`。只有在 `Cross-signing verified` 變成 `yes`
   後，命令才會成功結束。

8. 如果你有意放棄無法復原的舊歷史紀錄，並想為未來訊息建立新的備份基準，請執行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. 如果尚未存在伺服器端金鑰備份，請為未來復原建立一份：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 加密遷移的運作方式

加密遷移是兩階段流程：

1. 如果加密遷移可執行，啟動流程或 `openclaw doctor --fix` 會建立或重用遷移前快照。
2. 啟動流程或 `openclaw doctor --fix` 會透過作用中的 Matrix Plugin 安裝檢查舊的 Matrix 加密儲存。
3. 如果找到備份解密金鑰，OpenClaw 會將它寫入新的復原金鑰流程，並將房間金鑰還原標記為待處理。
4. 在下一次 Matrix 啟動時，OpenClaw 會自動將已備份的房間金鑰還原到新的加密儲存中。

如果舊儲存回報有從未備份的房間金鑰，OpenClaw 會發出警告，而不是假裝復原成功。

## 常見訊息及其含義

### 升級與偵測訊息

`Matrix plugin upgraded in place.`

- 含義：偵測到舊的磁碟上 Matrix 狀態，並已遷移到目前配置。
- 要做什麼：除非同一輸出也包含警告，否則不需要做任何事。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 含義：OpenClaw 在變更 Matrix 狀態之前建立了復原封存檔。
- 要做什麼：保留列印出的封存檔路徑，直到你確認遷移成功。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 含義：OpenClaw 找到現有的 Matrix 遷移快照標記，並重用該封存檔，而不是建立重複備份。
- 要做什麼：保留列印出的封存檔路徑，直到你確認遷移成功。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 含義：舊的 Matrix 狀態存在，但 OpenClaw 無法將其對應到目前的 Matrix 帳號，因為尚未設定 Matrix。
- 要做什麼：設定 `channels.matrix`，接著重新執行 `openclaw doctor --fix` 或重新啟動 Gateway。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含義：OpenClaw 找到舊狀態，但仍無法判定確切的目前帳號/裝置根目錄。
- 要做什麼：使用可運作的 Matrix 登入啟動 Gateway 一次，或在快取憑證存在後重新執行 `openclaw doctor --fix`。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含義：OpenClaw 找到一個共用的扁平 Matrix 儲存，但拒絕猜測應由哪個具名 Matrix 帳號接收它。
- 要做什麼：將 `channels.matrix.defaultAccount` 設為預期帳號，接著重新執行 `openclaw doctor --fix` 或重新啟動 Gateway。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 含義：新的以帳號為範圍的位置已經有同步或加密儲存，因此 OpenClaw 未自動覆寫它。
- 要做什麼：在手動移除或移動衝突目標之前，先確認目前帳號是正確帳號。

`Failed migrating Matrix legacy sync store (...)` 或 `Failed migrating Matrix legacy crypto store (...)`

- 含義：OpenClaw 嘗試移動舊的 Matrix 狀態，但檔案系統操作失敗。
- 要做什麼：檢查檔案系統權限與磁碟狀態，接著重新執行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 含義：OpenClaw 找到舊的加密 Matrix 儲存，但沒有目前的 Matrix 設定可將其附加上去。
- 要做什麼：設定 `channels.matrix`，接著重新執行 `openclaw doctor --fix` 或重新啟動 Gateway。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含義：加密儲存存在，但 OpenClaw 無法安全判定它屬於哪個目前帳號/裝置。
- 要做什麼：使用可運作的 Matrix 登入啟動 Gateway 一次，或在快取憑證可用後重新執行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含義：OpenClaw 找到一個共用的扁平舊版加密儲存，但拒絕猜測應由哪個具名 Matrix 帳號接收它。
- 要做什麼：將 `channels.matrix.defaultAccount` 設為預期帳號，接著重新執行 `openclaw doctor --fix` 或重新啟動 Gateway。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 含義：OpenClaw 偵測到舊的 Matrix 狀態，但遷移仍因缺少身分或憑證資料而受阻。
- 要做什麼：完成 Matrix 登入或設定設置，接著重新執行 `openclaw doctor --fix` 或重新啟動 Gateway。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 含義：OpenClaw 找到舊的加密 Matrix 狀態，但無法從通常用於檢查該儲存的 Matrix Plugin 載入輔助程式進入點。
- 要做什麼：重新安裝或修復 Matrix Plugin（`openclaw plugins install @openclaw/matrix`，或對 repo checkout 使用 `openclaw plugins install ./path/to/local/matrix-plugin`），接著重新執行 `openclaw doctor --fix` 或重新啟動 Gateway。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 意義：OpenClaw 發現某個輔助檔案路徑會逸出 Plugin 根目錄，或未通過 Plugin 邊界檢查，因此拒絕匯入它。
- 處理方式：從受信任的路徑重新安裝 Matrix Plugin，然後重新執行 `openclaw doctor --fix` 或重新啟動 Gateway。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 意義：OpenClaw 拒絕變更 Matrix 狀態，因為它無法先建立復原快照。
- 處理方式：解決備份錯誤，然後重新執行 `openclaw doctor --fix` 或重新啟動 Gateway。

`Failed migrating legacy Matrix client storage: ...`

- 意義：Matrix 用戶端側備援機制發現舊的扁平儲存，但移動失敗。OpenClaw 現在會中止該備援流程，而不是靜默地以全新的儲存啟動。
- 處理方式：檢查檔案系統權限或衝突，保持舊狀態完整，並在修正錯誤後重試。

`Matrix is installed from a custom path: ...`

- 意義：Matrix 被固定為路徑安裝，因此主線更新不會自動將它替換成儲存庫的標準 Matrix 套件。
- 處理方式：當你想回到預設 Matrix Plugin 時，請使用 `openclaw plugins install @openclaw/matrix` 重新安裝。

### 加密狀態復原訊息

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 意義：已備份的房間金鑰已成功復原到新的加密儲存。
- 處理方式：通常不需要做任何事。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 意義：部分舊房間金鑰只存在於舊的本機儲存中，且從未上傳到 Matrix 備份。
- 處理方式：除非你能從另一個已驗證的用戶端手動復原這些金鑰，否則部分舊的加密歷史可能仍無法使用。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- 意義：備份存在，但 OpenClaw 無法自動復原復原金鑰。
- 處理方式：執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 意義：OpenClaw 找到了舊的加密儲存，但無法以足夠安全的方式檢查它來準備復原。
- 處理方式：重新執行 `openclaw doctor --fix`。如果問題重複發生，請保持舊狀態目錄完整，並使用另一個已驗證的 Matrix 用戶端加上 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 進行復原。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 意義：OpenClaw 偵測到備份金鑰衝突，並拒絕自動覆寫目前的 recovery-key 檔案。
- 處理方式：在重試任何復原命令之前，先確認哪個復原金鑰是正確的。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 意義：這是舊儲存格式的硬性限制。
- 處理方式：已備份的金鑰仍可復原，但僅存在本機的加密歷史可能仍無法使用。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 意義：新的 Plugin 嘗試復原，但 Matrix 傳回錯誤。
- 處理方式：執行 `openclaw matrix verify backup status`，必要時再使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 重試。

### 手動復原訊息

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 意義：OpenClaw 知道你應該有備份金鑰，但它目前未在此裝置上啟用。
- 處理方式：執行 `openclaw matrix verify backup restore`，或設定 `MATRIX_RECOVERY_KEY`，必要時執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`。

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- 意義：此裝置目前未儲存復原金鑰。
- 處理方式：設定 `MATRIX_RECOVERY_KEY`，執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`，然後復原備份。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- 意義：已儲存的金鑰與作用中的 Matrix 備份不相符。
- 處理方式：將 `MATRIX_RECOVERY_KEY` 設為正確的金鑰，並執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

如果你接受遺失無法復原的舊加密歷史，也可以改用 `openclaw matrix verify backup reset --yes` 重設目前的備份基準。當已儲存的備份密鑰損壞時，該重設也可能重新建立密鑰儲存，讓新的備份金鑰在重新啟動後能正確載入。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- 意義：備份存在，但此裝置尚未充分信任交叉簽署信任鏈。
- 處理方式：設定 `MATRIX_RECOVERY_KEY`，並執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Matrix recovery key is required`

- 意義：你在需要復原金鑰的情況下嘗試復原步驟，但未提供復原金鑰。
- 處理方式：使用 `--recovery-key-stdin` 重新執行命令，例如 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 意義：提供的金鑰無法剖析，或不符合預期格式。
- 處理方式：使用 Matrix 用戶端或 recovery-key 檔案中的確切復原金鑰重試。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 意義：OpenClaw 可以套用復原金鑰，但 Matrix 仍尚未為此裝置建立完整的交叉簽署身分信任。檢查命令輸出中是否有 `Recovery key accepted`、`Backup usable`、`Cross-signing verified` 和 `Device verified by owner`。
- 處理方式：執行 `openclaw matrix verify self`，在另一個 Matrix 用戶端中接受要求，比對 SAS，並且只有在相符時才輸入 `yes`。該命令會等待完整的 Matrix 身分信任建立完成後才回報成功。只有在你有意替換目前的交叉簽署身分時，才使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`。

`Matrix key backup is not active on this device after loading from secret storage.`

- 意義：密鑰儲存未在此裝置上產生活動的備份工作階段。
- 處理方式：先驗證裝置，然後使用 `openclaw matrix verify backup status` 重新檢查。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- 意義：此裝置必須先完成裝置驗證，才能從密鑰儲存復原。
- 處理方式：先執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

### 自訂 Plugin 安裝訊息

`Matrix is installed from a custom path that no longer exists: ...`

- 意義：你的 Plugin 安裝記錄指向一個已不存在的本機路徑。
- 處理方式：使用 `openclaw plugins install @openclaw/matrix` 重新安裝；或者如果你是從儲存庫 checkout 執行，請使用 `openclaw plugins install ./path/to/local/matrix-plugin`。

## 如果加密歷史仍未恢復

依序執行這些檢查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

如果備份成功復原，但部分舊房間仍缺少歷史，這些遺失的金鑰很可能從未被先前的 Plugin 備份。

## 如果你想為未來訊息重新開始

如果你接受遺失無法復原的舊加密歷史，只想為後續建立乾淨的備份基準，請依序執行這些命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果裝置之後仍未驗證，請從你的 Matrix 用戶端完成驗證：比對 SAS 表情符號或十進位代碼，並確認它們相符。

## 相關

- [Matrix](/zh-TW/channels/matrix)：頻道設定與組態。
- [Matrix 推送規則](/zh-TW/channels/matrix-push-rules)：通知路由。
- [Doctor](/zh-TW/gateway/doctor)：健康檢查與自動遷移觸發。
- [遷移指南](/zh-TW/install/migrating)：所有遷移路徑（機器移動、跨系統匯入）。
- [Plugins](/zh-TW/tools/plugin)：Plugin 安裝與註冊。
