---
read_when:
    - 升級現有的 Matrix 安裝環境
    - 遷移加密的 Matrix 歷史記錄與裝置狀態
summary: OpenClaw 如何就地升級先前的 Matrix 外掛，包括加密狀態的復原限制與手動復原步驟。
title: Matrix 遷移
x-i18n:
    generated_at: "2026-07-19T13:34:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 475c96914900a5597f37001264bd3d8f69a69dbd0600f2704c2a1be46924fac4
    source_path: channels/matrix-migration.md
    workflow: 16
---

從先前公開的 `matrix` 外掛升級至目前的實作。

對大多數使用者而言，升級方式維持不變：

- 外掛仍為 `@openclaw/matrix`
- 頻道仍為 `matrix`
- 你的設定仍位於 `channels.matrix` 下
- 快取的認證資訊會移至共用的 `state/openclaw.sqlite` 外掛狀態
- 執行階段狀態仍位於 `~/.openclaw/matrix/` 下

你不需要重新命名設定鍵，也不需要以新名稱重新安裝外掛。
根 `openclaw` 套件不再內含 Matrix 執行階段程式碼或 Matrix SDK
相依套件。如果 `openclaw channels status` 顯示已設定 Matrix，但尚未安裝
外掛，請執行 `openclaw doctor --fix` 或
`openclaw plugins install @openclaw/matrix`；請勿將 Matrix SDK 套件
安裝至根 OpenClaw 套件中。

## 遷移會自動執行的作業

當你執行 [`openclaw doctor --fix`](/zh-TW/gateway/doctor) 時，Matrix 遷移便會執行。專用 Matrix 儲存區旁以檔案為基礎的附屬檔案會保留其用戶端啟動備援機制，但認證資訊檔案僅能由 Doctor 匯入；執行階段只會讀取標準 SQLite 認證資訊狀態。

Doctor 遷移涵蓋：

- 匯入並驗證已停用的 `~/.openclaw/credentials/matrix/credentials*.json` 檔案，然後將其封存
- 保留相同的帳號選擇與 `channels.matrix` 設定
- 將以檔案為基礎的附屬狀態（`bot-storage.json` 同步快取、`recovery-key.json`、`legacy-crypto-migration.json`、IndexedDB 快照）匯入 Matrix SQLite 狀態；已遷移的檔案會以 `.migrated` 後綴封存
- 當存取權杖日後變更時，針對相同的 Matrix 帳號、主伺服器、使用者與裝置，重複使用內容最完整的現有權杖雜湊儲存根目錄

## 從早於 2026.4 的 OpenClaw 版本升級

截至 2026.6 系列的版本也會遷移原始的扁平單一儲存區
Matrix 配置（`~/.openclaw/matrix/bot-storage.json` 加上
`~/.openclaw/matrix/crypto/`），並準備從
舊版 Rust 加密儲存區復原加密狀態。目前版本已不再包含該遷移。

如果你要升級的安裝仍使用扁平配置，請先
升級至 2026.6 版本、執行 `openclaw doctor --fix`，並啟動閘道
一次，以遷移扁平儲存區及任何可復原的聊天室金鑰。然後再更新
至最新版本。

先前公開的 Matrix 外掛**不會**自動建立 Matrix 聊天室金鑰備份。如果舊安裝中有僅儲存於本機且從未備份的加密記錄，無論採用哪種遷移路徑，部分較舊的加密訊息在升級後仍可能無法讀取。

## 建議的升級流程

1. 以一般方式更新 OpenClaw 與 Matrix 外掛。
2. 執行：

   ```bash
   openclaw doctor --fix
   ```

3. 啟動或重新啟動閘道。
4. 檢查目前的驗證與備份狀態：

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 將你正在修復之 Matrix 帳號的復原金鑰放入該帳號專用的環境變數。若只有單一預設帳號，使用 `MATRIX_RECOVERY_KEY` 即可。若有多個帳號，請為每個帳號使用一個變數，例如 `MATRIX_RECOVERY_KEY_ASSISTANT`，並在命令中加入 `--account assistant`。

6. 如果 OpenClaw 告知需要復原金鑰，請針對相符的帳號執行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. 如果此裝置仍未通過驗證，請針對相符的帳號執行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   如果復原金鑰已被接受且備份可用，但 `Cross-signing verified`
   仍為 `no`，請從另一個 Matrix 用戶端完成自我驗證：

   ```bash
   openclaw matrix verify self
   ```

   在另一個 Matrix 用戶端中接受要求、比對表情符號或十進位數字，
   並且僅在兩者相符時輸入 `yes`。該命令會等待 Matrix
   身分獲得完整信任後才回報成功。

8. 如果你有意放棄無法復原的舊記錄，並希望為未來訊息建立全新的備份基準，請執行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   僅當舊復原金鑰不應再能解鎖新備份時，才加入 `--rotate-recovery-key`。

9. 如果尚無伺服器端金鑰備份，請建立一份以供日後復原：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 常見訊息及其含義

`Failed migrating legacy Matrix client storage: ...`

- 含義：Matrix 用戶端備援機制找到以檔案為基礎的附屬狀態，但匯入 SQLite 失敗。OpenClaw 會復原已完成的移動並中止該備援機制，而不會悄悄以全新的儲存區啟動。
- 處理方式：檢查檔案系統權限或衝突、保持舊狀態完整，並在修正錯誤後重試。

`Matrix is installed from a custom path: ...`

- 含義：Matrix 已固定使用路徑安裝，因此主線更新不會自動將其替換為預設 Matrix 套件。
- 處理方式：當你想恢復使用預設 Matrix 外掛時，請以 `openclaw plugins install @openclaw/matrix` 重新安裝。

`Matrix is installed from a custom path that no longer exists: ...`

- 含義：你的外掛安裝記錄指向一個已不存在的本機路徑。
- 處理方式：使用 `openclaw plugins install @openclaw/matrix` 重新安裝；若你從存放庫簽出版本執行，則使用 `openclaw plugins install ./path/to/local/matrix-plugin`。`openclaw doctor --fix` 也可以替你移除過時的 Matrix 外掛參照。

### 手動復原訊息

當此裝置上的聊天室金鑰備份狀態不正常時，`openclaw matrix verify status` 與 `openclaw matrix verify backup status` 會輸出一行 `Backup issue:`，以及 `Next steps:` 指引：

| 備份問題                                                              | 含義                                               | 修正方式                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | 沒有可供還原的資料                                 | 使用 `openclaw matrix verify bootstrap` 建立聊天室金鑰備份                                                                            |
| `backup decryption key is not loaded on this device`                  | 金鑰存在，但目前未在此處啟用                       | 執行 `openclaw matrix verify backup restore`；如果仍無法載入金鑰，請透過 `--recovery-key-stdin` 管線傳入復原金鑰                |
| `backup decryption key could not be loaded from secret storage (...)` | 秘密儲存空間載入失敗或不受支援                     | 透過管線傳入復原金鑰：`printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`               |
| `backup key mismatch (...)`                                           | 儲存的金鑰與目前作用中的伺服器備份不符             | 使用作用中伺服器備份金鑰重新執行 `verify backup restore --recovery-key-stdin`，或執行 `verify backup reset --yes` 以建立全新基準 |
| `backup signature chain is not trusted by this device`                | 裝置尚未信任交叉簽署鏈                             | 執行 `verify device --recovery-key-stdin`；如果信任仍不完整，再從另一個已驗證的用戶端執行 `verify self`                        |
| `backup exists but is not active on this device`                      | 伺服器備份存在，但本機工作階段未啟用               | 先驗證裝置，再使用 `openclaw matrix verify backup status` 重新檢查                                                         |
| `backup trust state could not be fully determined`                    | 診斷結果不明確                                     | `openclaw matrix verify status --verbose`                                                                                                 |

其他復原錯誤：

`Matrix recovery key is required`

- 含義：你嘗試執行需要復原金鑰的復原步驟，但未提供復原金鑰。
- 處理方式：加入 `--recovery-key-stdin` 重新執行命令，例如 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 含義：無法剖析所提供的金鑰，或其格式不符合預期。
- 處理方式：使用 Matrix 用戶端或復原金鑰匯出內容中的確切復原金鑰重試。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 含義：復原金鑰已解鎖可用的備份資料，但 Matrix 尚未為此裝置建立完整的交叉簽署身分信任。請檢查命令輸出中的 `Recovery key accepted`、`Backup usable`、`Cross-signing verified` 與 `Device verified by owner`。
- 處理方式：執行 `openclaw matrix verify self`、在另一個 Matrix 用戶端中接受要求、比對 SAS，並僅在相符時輸入 `yes`。僅當你有意取代目前的交叉簽署身分時，才使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`。

如果你接受遺失無法復原的舊加密記錄，也可以改用
`openclaw matrix verify backup reset --yes` 重設目前的備份基準。當
已儲存的備份秘密損壞時，該重設也會修復秘密儲存空間，使
新備份金鑰能在重新啟動後正確載入。

## 如果仍無法取回加密記錄

請依序執行以下檢查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

如果備份已成功還原，但部分舊聊天室仍缺少記錄，這些缺少的金鑰很可能從未由先前的外掛備份。

## 如果你想為未來訊息重新開始

如果你接受遺失無法復原的舊加密記錄，且只想為往後的訊息建立乾淨的備份基準，請依序執行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果此後裝置仍未通過驗證，請在 Matrix 用戶端中比對 SAS 表情符號或十進位代碼，並確認兩者相符，以完成驗證。

## 相關內容

- [Matrix](/zh-TW/channels/matrix)：頻道設定與組態。
- [Matrix 推送規則](/zh-TW/channels/matrix-push-rules)：通知路由。
- [Doctor](/zh-TW/gateway/doctor)：健康狀態檢查與自動遷移觸發程序。
- [遷移指南](/zh-TW/install/migrating)：所有遷移路徑（機器移轉、跨系統匯入）。
- [外掛](/zh-TW/tools/plugin)：外掛安裝與註冊。
