---
read_when:
    - 升級現有的 Matrix 安裝
    - 遷移加密的 Matrix 歷史記錄與裝置狀態
summary: OpenClaw 如何就地升級先前的 Matrix 外掛，包括加密狀態復原限制與手動復原步驟。
title: Matrix 遷移
x-i18n:
    generated_at: "2026-06-27T18:56:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

從先前公開的 `matrix` 外掛升級到目前的實作。

對大多數使用者來說，升級會就地完成：

- 外掛仍是 `@openclaw/matrix`
- 頻道仍是 `matrix`
- 你的設定仍位於 `channels.matrix`
- 快取的憑證仍位於 `~/.openclaw/credentials/matrix/`
- 執行階段狀態仍位於 `~/.openclaw/matrix/`

你不需要重新命名設定鍵，也不需要用新名稱重新安裝外掛。
根 `openclaw` 套件不再內建 Matrix 執行階段程式碼或 Matrix SDK
相依套件。如果 `openclaw channels status` 顯示 Matrix 已設定，但更新後
外掛遺失，請執行 `openclaw doctor --fix` 或
`openclaw plugins install @openclaw/matrix`；不要將 Matrix SDK 套件安裝到
根 OpenClaw 套件中。

## 遷移會自動做什麼

當閘道啟動，以及當你執行 [`openclaw doctor --fix`](/zh-TW/gateway/doctor) 時，OpenClaw 會嘗試自動修復舊的 Matrix 狀態。
在任何可執行的 Matrix 遷移步驟變更磁碟上的狀態之前，OpenClaw 會建立或重用一個聚焦的復原快照。

使用 `openclaw update` 時，確切觸發方式取決於 OpenClaw 的安裝方式：

- 原始碼安裝會在更新流程中執行 `openclaw doctor --fix`，然後預設重新啟動閘道
- 套件管理器安裝會更新套件、執行非互動式 doctor 檢查，然後依賴預設的閘道重新啟動，讓啟動流程完成 Matrix 遷移
- 如果你使用 `openclaw update --no-restart`，由啟動支援的 Matrix 遷移會延後到你稍後執行 `openclaw doctor --fix` 並重新啟動閘道時

自動遷移涵蓋：

- 在 `~/Backups/openclaw-migrations/` 下建立或重用遷移前快照
- 重用你快取的 Matrix 憑證
- 保持相同的帳號選擇與 `channels.matrix` 設定
- 將最舊的扁平 Matrix 同步儲存區移到目前的帳號範圍位置
- 當可安全解析目標帳號時，將最舊的扁平 Matrix 加密儲存區移到目前的帳號範圍位置
- 當舊 rust 加密儲存區本機存在先前儲存的 Matrix 房間金鑰備份解密金鑰時，將其擷取出來
- 當存取權杖稍後變更時，為相同的 Matrix 帳號、homeserver 和使用者重用最完整的既有權杖雜湊儲存根
- 當 Matrix 存取權杖變更但帳號/裝置身分保持相同時，掃描同層權杖雜湊儲存根以尋找待處理的加密狀態還原中繼資料
- 在下一次 Matrix 啟動時，將已備份的房間金鑰還原到新的加密儲存區

快照詳細資訊：

- 成功建立快照後，OpenClaw 會在 `~/.openclaw/matrix/migration-snapshot.json` 寫入標記檔，讓後續啟動與修復流程可以重用同一個封存檔。
- 這些自動 Matrix 遷移快照只備份設定與狀態（`includeWorkspace: false`）。
- 如果 Matrix 只有警告性遷移狀態，例如因為 `userId` 或 `accessToken` 仍缺失，OpenClaw 尚不會建立快照，因為沒有可執行的 Matrix 變更。
- 如果快照步驟失敗，OpenClaw 會略過該次執行的 Matrix 遷移，而不是在沒有復原點的情況下變更狀態。

關於多帳號升級：

- 最舊的扁平 Matrix 儲存區（`~/.openclaw/matrix/bot-storage.json` 和 `~/.openclaw/matrix/crypto/`）來自單一儲存區配置，因此 OpenClaw 只能將它遷移到一個已解析的 Matrix 帳號目標
- 已經採用帳號範圍的舊版 Matrix 儲存區會依每個已設定的 Matrix 帳號偵測並準備

## 遷移無法自動做什麼

先前公開的 Matrix 外掛**不會**自動建立 Matrix 房間金鑰備份。它會保存本機加密狀態並要求裝置驗證，但不保證你的房間金鑰已備份到 homeserver。

這表示某些加密安裝只能部分遷移。

OpenClaw 無法自動復原：

- 從未備份的本機專用房間金鑰
- 因為 `homeserver`、`userId` 或 `accessToken` 仍不可用，尚無法解析目標 Matrix 帳號時的加密狀態
- 已設定多個 Matrix 帳號但未設定 `channels.matrix.defaultAccount` 時，無法自動遷移一個共用的扁平 Matrix 儲存區
- 固定到 repo 路徑而非標準 Matrix 套件的自訂外掛路徑安裝
- 舊儲存區有已備份金鑰但未在本機保留解密金鑰時，缺失的復原金鑰

目前的警告範圍：

- 自訂 Matrix 外掛路徑安裝會由閘道啟動和 `openclaw doctor` 一併顯示

如果你的舊安裝有從未備份的本機專用加密歷史，升級後某些較舊的加密訊息可能仍無法讀取。

## 建議升級流程

1. 正常更新 OpenClaw 和 Matrix 外掛。
   建議使用不帶 `--no-restart` 的一般 `openclaw update`，讓啟動流程能立即完成 Matrix 遷移。
2. 執行：

   ```bash
   openclaw doctor --fix
   ```

   如果 Matrix 有可執行的遷移工作，doctor 會先建立或重用遷移前快照，並列印封存檔路徑。

3. 啟動或重新啟動閘道。
4. 檢查目前的驗證與備份狀態：

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 將你正在修復的 Matrix 帳號復原金鑰放入帳號專用環境變數。對單一預設帳號，`MATRIX_RECOVERY_KEY` 即可。對多個帳號，請為每個帳號使用一個變數，例如 `MATRIX_RECOVERY_KEY_ASSISTANT`，並在命令中加入 `--account assistant`。

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

   如果復原金鑰被接受且備份可用，但 `Cross-signing verified`
   仍為 `no`，請從另一個 Matrix 用戶端完成自我驗證：

   ```bash
   openclaw matrix verify self
   ```

   在另一個 Matrix 用戶端接受請求，比對 emoji 或小數，
   並只在相符時輸入 `yes`。命令只有在
   `Cross-signing verified` 變為 `yes` 後才會成功結束。

8. 如果你有意放棄無法復原的舊歷史，並想為未來訊息建立新的備份基準，請執行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. 如果尚未存在伺服器端金鑰備份，請為未來復原建立一個：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 加密遷移如何運作

加密遷移是兩階段流程：

1. 如果加密遷移可執行，啟動流程或 `openclaw doctor --fix` 會建立或重用遷移前快照。
2. 啟動流程或 `openclaw doctor --fix` 會透過啟用中的 Matrix 外掛安裝檢查舊的 Matrix 加密儲存區。
3. 如果找到備份解密金鑰，OpenClaw 會將它寫入新的復原金鑰流程，並將房間金鑰還原標記為待處理。
4. 在下一次 Matrix 啟動時，OpenClaw 會自動將已備份的房間金鑰還原到新的加密儲存區。

如果舊儲存區回報有從未備份的房間金鑰，OpenClaw 會發出警告，而不是假裝復原成功。

## 常見訊息及其含義

### 升級與偵測訊息

`Matrix plugin upgraded in place.`

- 含義：偵測到舊的磁碟上 Matrix 狀態，並已遷移到目前配置。
- 該怎麼做：除非同一輸出也包含警告，否則不需處理。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 含義：OpenClaw 在變更 Matrix 狀態前建立了復原封存檔。
- 該怎麼做：保留列印出的封存檔路徑，直到你確認遷移成功。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 含義：OpenClaw 找到既有的 Matrix 遷移快照標記，並重用該封存檔，而不是建立重複備份。
- 該怎麼做：保留列印出的封存檔路徑，直到你確認遷移成功。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 含義：舊 Matrix 狀態存在，但因為尚未設定 Matrix，OpenClaw 無法將它對應到目前的 Matrix 帳號。
- 該怎麼做：設定 `channels.matrix`，然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含義：OpenClaw 找到舊狀態，但仍無法判定確切的目前帳號/裝置根。
- 該怎麼做：使用可運作的 Matrix 登入啟動閘道一次，或在快取憑證存在後重新執行 `openclaw doctor --fix`。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含義：OpenClaw 找到一個共用的扁平 Matrix 儲存區，但拒絕猜測應由哪個命名 Matrix 帳號接收它。
- 該怎麼做：將 `channels.matrix.defaultAccount` 設為目標帳號，然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 含義：新的帳號範圍位置已經有同步或加密儲存區，因此 OpenClaw 未自動覆寫它。
- 該怎麼做：在手動移除或移動衝突目標之前，確認目前帳號是正確帳號。

`Failed migrating Matrix legacy sync store (...)` 或 `Failed migrating Matrix legacy crypto store (...)`

- 含義：OpenClaw 嘗試移動舊 Matrix 狀態，但檔案系統操作失敗。
- 該怎麼做：檢查檔案系統權限與磁碟狀態，然後重新執行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 含義：OpenClaw 找到舊的加密 Matrix 儲存區，但沒有目前的 Matrix 設定可附加它。
- 該怎麼做：設定 `channels.matrix`，然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含義：加密儲存區存在，但 OpenClaw 無法安全判定它屬於哪個目前帳號/裝置。
- 該怎麼做：使用可運作的 Matrix 登入啟動閘道一次，或在快取憑證可用後重新執行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含義：OpenClaw 找到一個共用的扁平舊版加密儲存區，但拒絕猜測應由哪個命名 Matrix 帳號接收它。
- 該怎麼做：將 `channels.matrix.defaultAccount` 設為目標帳號，然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 含義：OpenClaw 偵測到舊 Matrix 狀態，但遷移仍受缺失的身分或憑證資料阻擋。
- 該怎麼做：完成 Matrix 登入或設定流程，然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 含義：OpenClaw 找到舊的加密 Matrix 狀態，但無法從 Matrix 外掛載入通常會檢查該儲存區的輔助程式進入點。
- 處理方式：重新安裝或修復 Matrix 外掛（`openclaw plugins install @openclaw/matrix`，或如果是 repo checkout，使用 `openclaw plugins install ./path/to/local/matrix-plugin`），然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 含義：OpenClaw 找到的輔助程式檔案路徑會逸出外掛根目錄，或未通過外掛邊界檢查，因此拒絕匯入。
- 處理方式：從受信任的路徑重新安裝 Matrix 外掛，然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 含義：OpenClaw 拒絕變更 Matrix 狀態，因為它無法先建立復原快照。
- 處理方式：解決備份錯誤，然後重新執行 `openclaw doctor --fix` 或重新啟動閘道。

`Failed migrating legacy Matrix client storage: ...`

- 含義：Matrix 用戶端側備援找到舊的扁平儲存區，但移動失敗。OpenClaw 現在會中止該備援，而不是靜默地以全新儲存區啟動。
- 處理方式：檢查檔案系統權限或衝突，保持舊狀態完整，並在修正錯誤後重試。

`Matrix is installed from a custom path: ...`

- 含義：Matrix 固定為路徑安裝，因此主線更新不會自動將它替換為 repo 的標準 Matrix 套件。
- 處理方式：當你想回到預設 Matrix 外掛時，使用 `openclaw plugins install @openclaw/matrix` 重新安裝。

### 加密狀態復原訊息

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 含義：已備份的房間金鑰已成功還原到新的加密儲存區。
- 處理方式：通常不需要做任何事。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 含義：部分舊房間金鑰只存在於舊的本機儲存區，且從未上傳到 Matrix 備份。
- 處理方式：除非你能從另一個已驗證的用戶端手動復原那些金鑰，否則部分舊的加密歷史可能仍無法使用。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- 含義：備份存在，但 OpenClaw 無法自動復原復原金鑰。
- 處理方式：執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 含義：OpenClaw 找到舊的加密儲存區，但無法以足夠安全的方式檢查它以準備復原。
- 處理方式：重新執行 `openclaw doctor --fix`。如果問題重複發生，請保持舊狀態目錄完整，並使用另一個已驗證的 Matrix 用戶端搭配 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 進行復原。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 含義：OpenClaw 偵測到備份金鑰衝突，並拒絕自動覆寫目前的 recovery-key 檔案。
- 處理方式：在重試任何還原命令前，先確認哪個復原金鑰才是正確的。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 含義：這是舊儲存格式的硬性限制。
- 處理方式：已備份的金鑰仍可還原，但僅存在本機的加密歷史可能仍無法使用。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 含義：新的外掛嘗試還原，但 Matrix 傳回錯誤。
- 處理方式：執行 `openclaw matrix verify backup status`，必要時再使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 重試。

### 手動復原訊息

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 含義：OpenClaw 知道你應該有備份金鑰，但它尚未在此裝置上啟用。
- 處理方式：執行 `openclaw matrix verify backup restore`，或設定 `MATRIX_RECOVERY_KEY` 並在必要時執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`。

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- 含義：此裝置目前沒有儲存復原金鑰。
- 處理方式：設定 `MATRIX_RECOVERY_KEY`，執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`，然後還原備份。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- 含義：已儲存的金鑰與作用中的 Matrix 備份不相符。
- 處理方式：將 `MATRIX_RECOVERY_KEY` 設為正確的金鑰，並執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

如果你接受失去無法復原的舊加密歷史，也可以改為使用 `openclaw matrix verify backup reset --yes` 重設目前的備份基準。當已儲存的備份密鑰損壞時，該重設也可能重新建立秘密儲存區，讓新的備份金鑰能在重新啟動後正確載入。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- 含義：備份存在，但此裝置尚未充分信任交叉簽署鏈。
- 處理方式：設定 `MATRIX_RECOVERY_KEY`，並執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Matrix recovery key is required`

- 含義：你嘗試執行需要復原金鑰的復原步驟，但沒有提供復原金鑰。
- 處理方式：使用 `--recovery-key-stdin` 重新執行命令，例如 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 含義：提供的金鑰無法剖析，或不符合預期格式。
- 處理方式：使用 Matrix 用戶端或 recovery-key 檔案中的確切復原金鑰重試。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 含義：OpenClaw 可以套用復原金鑰，但 Matrix 仍尚未為此裝置建立完整的交叉簽署身分信任。請檢查命令輸出中的 `Recovery key accepted`、`Backup usable`、`Cross-signing verified` 和 `Device verified by owner`。
- 處理方式：執行 `openclaw matrix verify self`，在另一個 Matrix 用戶端接受請求，比對 SAS，並只在相符時輸入 `yes`。該命令會等到完整的 Matrix 身分信任建立後才回報成功。只有在你有意替換目前交叉簽署身分時，才使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`。

`Matrix key backup is not active on this device after loading from secret storage.`

- 含義：秘密儲存區未能在此裝置上產生活躍的備份工作階段。
- 處理方式：先驗證裝置，然後使用 `openclaw matrix verify backup status` 重新檢查。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- 含義：在裝置驗證完成前，此裝置無法從秘密儲存區還原。
- 處理方式：先執行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

### 自訂外掛安裝訊息

`Matrix is installed from a custom path that no longer exists: ...`

- 含義：你的外掛安裝記錄指向一個已不存在的本機路徑。
- 處理方式：使用 `openclaw plugins install @openclaw/matrix` 重新安裝，或如果你是從 repo checkout 執行，使用 `openclaw plugins install ./path/to/local/matrix-plugin`。

## 如果加密歷史仍未恢復

依序執行這些檢查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

如果備份成功還原，但部分舊房間仍缺少歷史，這些遺失的金鑰很可能從未由先前的外掛備份。

## 如果你想為未來訊息重新開始

如果你接受失去無法復原的舊加密歷史，只想為往後建立乾淨的備份基準，請依序執行這些命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果裝置在此之後仍未驗證，請從你的 Matrix 用戶端完成驗證：比對 SAS emoji 或十進位代碼，並確認它們相符。

## 相關

- [Matrix](/zh-TW/channels/matrix)：頻道設定與設定檔。
- [Matrix 推播規則](/zh-TW/channels/matrix-push-rules)：通知路由。
- [Doctor](/zh-TW/gateway/doctor)：健康檢查與自動遷移觸發器。
- [遷移指南](/zh-TW/install/migrating)：所有遷移路徑（機器搬移、跨系統匯入）。
- [外掛](/zh-TW/tools/plugin)：外掛安裝與註冊。
