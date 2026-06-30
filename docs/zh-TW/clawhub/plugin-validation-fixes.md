---
read_when:
    - 你執行了 clawhub package validate，需要修正外掛發現的問題
    - ClawHub 拒絕外掛套件發布或發出警告
    - 你正在發行前更新外掛套件中繼資料
summary: 發布前修正 ClawHub 外掛套件驗證發現的問題
title: 外掛驗證修正
x-i18n:
    generated_at: "2026-06-30T22:05:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# 外掛驗證修正

ClawHub 會在發布前驗證外掛套件，也可以顯示自動化套件掃描產生的發現項目。本頁涵蓋面向作者的發現項目，也就是外掛作者可以在其套件中繼資料、資訊清單、SDK 匯入或已發布成品中修正的發現項目。

本頁不涵蓋內部 Plugin Inspector 涵蓋率發現項目。如果完整報告包含沒有作者修復指引的掃描器維護代碼，這些項目是提供給 OpenClaw 維護者，而不是外掛作者。

套用任何修正後，重新執行：

```bash
clawhub package validate <path-to-plugin>
```

## 面向作者的發現項目

| 代碼                                    | 從這裡開始                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [新增套件中繼資料](/zh-TW/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [新增套件 openclaw 區塊](/zh-TW/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [宣告 OpenClaw 套件進入點](/zh-TW/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [發布已宣告的進入點](/zh-TW/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [補齊安裝中繼資料](/zh-TW/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [宣告外掛 API 相容性](/zh-TW/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [對齊最低主機版本](/zh-TW/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [對齊套件與資訊清單版本](/zh-TW/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [移除不支援的 OpenClaw 套件中繼資料](/zh-TW/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [讓 npm 成品可封裝](/zh-TW/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [在 npm pack 輸出中包含進入點](/zh-TW/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [在 npm pack 輸出中包含中繼資料](/zh-TW/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [新增資訊清單顯示名稱](/zh-TW/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [移除不支援的資訊清單欄位](/zh-TW/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [移除不支援的合約鍵](/zh-TW/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [取代根 SDK 匯入](/zh-TW/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [移除保留的 SDK 匯入](/zh-TW/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [取代整個工作階段儲存存取](/zh-TW/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [取代整個工作階段儲存寫入](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [取代工作階段檔案路徑輔助工具](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [取代舊版逐字稿檔案目標](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [取代低階逐字稿輔助工具](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [取代 before_agent_start](/zh-TW/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [將提供者環境變數移至設定中繼資料](/zh-TW/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [在目前中繼資料中鏡像通道環境變數](/zh-TW/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [移除無法使用的安全資訊清單結構描述參照](/zh-TW/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [移除不支援的安全資訊清單檔案](/zh-TW/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## 套件中繼資料

### package-json-missing

套件根目錄未包含 `package.json`，因此 ClawHub 無法識別 npm 套件、版本、進入點或 OpenClaw 中繼資料。

- 新增包含 `name`、`version` 和 `type` 的 `package.json`。
- 當套件提供 OpenClaw 外掛時，新增 `openclaw` 區塊。
- 使用 [建置外掛](/zh-TW/plugins/building-plugins) 取得最小套件範例，並參閱 [外掛資訊清單](/zh-TW/plugins/manifest#manifest-versus-packagejson) 了解套件與資訊清單的分工。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-metadata-missing

套件有 `package.json`，但未宣告 OpenClaw 套件中繼資料。

- 新增 `package.json#openclaw`。
- 包含進入點中繼資料，例如 `openclaw.extensions` 或 `openclaw.runtimeExtensions`。
- 當套件將透過 ClawHub 發布或安裝時，新增相容性與安裝中繼資料。
- 請參閱[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-entry-missing

套件中繼資料存在，但未宣告 OpenClaw 執行階段進入點。

- 為原生外掛進入點新增 `openclaw.extensions`。
- 當已發布套件應載入建置後的 JavaScript 時，新增 `openclaw.runtimeExtensions`。
- 讓所有進入點路徑都保留在套件目錄內。
- 請參閱[外掛進入點](/zh-TW/plugins/sdk-entrypoints)和[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-entrypoint-missing

套件宣告了 OpenClaw 進入點，但正在驗證的套件中缺少所參照的檔案。

- 檢查 `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry` 和 `openclaw.runtimeSetupEntry` 中的每個路徑。
- 如果進入點產生到 `dist`，請建置套件。
- 如果進入點已移動，請更新中繼資料。
- 請參閱[外掛進入點](/zh-TW/plugins/sdk-entrypoints)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-install-metadata-incomplete

ClawHub 無法判斷應如何安裝或更新套件。

- 使用支援的安裝來源填入 `openclaw.install`，例如 `clawhubSpec`、`npmSpec` 或 `localPath`。
- 當有多個安裝來源可用時，設定 `openclaw.install.defaultChoice`。
- 使用 `openclaw.install.minHostVersion` 指定最低 OpenClaw 主機版本。
- 請參閱[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-plugin-api-compat-missing

套件未宣告其支援的 OpenClaw 外掛 API 範圍。

- 將 `openclaw.compat.pluginApi` 新增至 `package.json`。
- 使用你建置並測試所依據的 OpenClaw 外掛 API 版本或 semver 下限。
- 將這與套件版本分開。套件版本描述外掛發行版；`openclaw.compat.pluginApi` 描述主機 API 合約。
- 請參閱[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-min-host-version-drift

套件最低主機版本與套件建置所依據的 OpenClaw 版本中繼資料不一致。

- 檢查 `openclaw.install.minHostVersion`。
- 檢查套件中的任何 OpenClaw 建置中繼資料，例如發行期間使用的 OpenClaw 版本。
- 將最低主機版本與套件實際支援的主機版本範圍對齊。
- 請參閱[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-manifest-version-drift

套件版本與外掛資訊清單版本不一致。

- 偏好以 `package.json#version` 作為套件發行版本。
- 如果 `openclaw.plugin.json` 也有 `version`，請更新它以相符，或在套件中繼資料具權威性時移除過時的資訊清單版本中繼資料。
- 變更已發布的中繼資料後，發布新的套件版本。
- 請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-unsupported-metadata

`package.json#openclaw` 區塊包含不受支援的 OpenClaw 套件中繼資料欄位。

- 移除不支援的欄位，例如 `openclaw.bundle`。
- 將原生外掛中繼資料保留在 `openclaw.plugin.json`。
- 將套件進入點、相容性、安裝、設定和目錄中繼資料保留在支援的 `package.json#openclaw` 欄位中。
- 請參閱[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 已發布成品

### package-npm-pack-unavailable

套件無法封裝成 ClawHub 會檢查或發布的成品。

- 從套件根目錄執行 `npm pack --dry-run`。
- 修正無效的套件中繼資料、損壞的生命週期指令碼，或導致封裝失敗的 files 項目。
- 如果此套件預計公開發布，請移除 `private: true`。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-npm-pack-entrypoint-missing

套件可以封裝，但封裝後的成品未包含 `package.json#openclaw` 中宣告的進入點檔案。

- 執行 `npm pack --dry-run` 並檢查將會包含的檔案。
- 在封裝前建置產生的進入點。
- 更新 `files`、`.npmignore` 或建置輸出，讓已宣告的進入點被包含。
- 請參閱[外掛進入點](/zh-TW/plugins/sdk-entrypoints)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-npm-pack-metadata-missing

封裝後的成品缺少存在於原始套件中的 OpenClaw 中繼資料。

- 執行 `npm pack --dry-run` 並檢查包含的中繼資料檔案。
- 確保 `package.json` 在封裝後的成品中包含 `openclaw` 區塊。
- 當套件是原生 OpenClaw 外掛時，確保包含 `openclaw.plugin.json`。
- 更新 `files` 或 `.npmignore`，避免套件中繼資料被排除。
- 請參閱[建置外掛](/zh-TW/plugins/building-plugins)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 資訊清單中繼資料

### manifest-name-missing

原生外掛 manifest 未包含顯示名稱。

- 將非空的 `name` 欄位新增至 `openclaw.plugin.json`。
- 保持 `name` 為人類可讀，並保持 `id` 作為穩定的機器 ID。
- 請參閱[外掛 manifest](/zh-TW/plugins/manifest)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### manifest-unknown-fields

外掛 manifest 含有 OpenClaw 不支援的頂層欄位。

- 將每個頂層欄位與
  [manifest 欄位參考](/zh-TW/plugins/manifest#top-level-field-reference)進行比較。
- 從 `openclaw.plugin.json` 移除自訂欄位。
- 將套件或安裝中繼資料移至支援的 `package.json#openclaw` 欄位，
  而不是放在 manifest 中。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### manifest-unknown-contracts

manifest 在 `contracts` 內宣告了不支援的鍵。

- 將 `contracts` 下的每個鍵與
  [contracts 參考](/zh-TW/plugins/manifest#contracts-reference)進行比較。
- 移除不支援的 contract 鍵。
- 將執行階段行為移至外掛註冊程式碼，並將 `contracts`
  限制為靜態功能所有權中繼資料。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## SDK 與相容性遷移

### legacy-root-sdk-import

外掛從已棄用的根 SDK barrel 匯入：
`openclaw/plugin-sdk`。

- 將根 barrel 匯入替換為聚焦的公開子路徑匯入。
- 對 `definePluginEntry` 使用 `openclaw/plugin-sdk/plugin-entry`。
- 對頻道 entry helper 使用 `openclaw/plugin-sdk/channel-core`。
- 使用[匯入慣例](/zh-TW/plugins/building-plugins#import-conventions)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)來尋找範圍較窄的匯入。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### reserved-sdk-import

外掛匯入了保留給 bundled plugins 或內部相容性的 SDK 路徑。

- 將保留的 OpenClaw 內部 SDK 匯入替換為已記錄的公開
  `openclaw/plugin-sdk/*` 子路徑。
- 如果該行為沒有公開 SDK，請將 helper 保留在你的套件內，或
  請求公開的 OpenClaw API。
- 使用[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)和
  [SDK 遷移](/zh-TW/plugins/sdk-migration)來選擇受支援的匯入。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-load-session-store

外掛仍在使用已棄用的 whole-session-store helper
`loadSessionStore`。

- 讀取工作階段狀態時，使用 `getSessionEntry(...)` 或 `listSessionEntries(...)`。
- 寫入工作階段狀態時，使用 `patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。
- 避免載入、變更並儲存整個工作階段 store 物件。
- 只有在你宣告的相容性範圍仍支援需要它的舊版 OpenClaw 時，
  才保留 `loadSessionStore(...)`。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-store-write

外掛仍在使用已棄用的 whole-session-store 寫入 helper，例如
`saveSessionStore` 或 `updateSessionStore`。

- 更新現有工作階段 entry 上的欄位時，使用 `patchSessionEntry(...)`。
- 替換或建立工作階段 entry 時，使用 `upsertSessionEntry(...)`。
- 避免載入、變更並儲存整個工作階段 store 物件。
- 只有在你宣告的相容性範圍仍支援需要它們的舊版 OpenClaw 時，
  才保留 whole-store 寫入 helper。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-file-helper

外掛仍在使用已棄用的工作階段檔案路徑 helper，例如
`resolveSessionFilePath` 或 `resolveAndPersistSessionFile`。

- 使用 `getSessionEntry(...)` 依代理和工作階段識別讀取工作階段中繼資料。
- 使用 `patchSessionEntry(...)` 或 `upsertSessionEntry(...)` 持久化工作階段中繼資料。
- 當程式碼正在準備 transcript 操作時，使用 transcript 識別或目標 helper。
- 不要持久化或依賴舊版 transcript 檔案路徑。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-transcript-file-target

外掛仍在使用已棄用的 transcript 檔案目標 helper
`resolveSessionTranscriptLegacyFileTarget`。

- 當程式碼只需要公開工作階段識別時，使用 `resolveSessionTranscriptIdentity(...)`。
- 當程式碼需要結構化 transcript 操作目標時，使用 `resolveSessionTranscriptTarget(...)`。
- 避免直接讀取或建構舊版 transcript 檔案目標。
- 只有在你宣告的相容性範圍仍支援需要它的舊版 OpenClaw 時，
  才保留舊版 helper。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-transcript-low-level

外掛仍在使用已棄用的低階 transcript helper，例如
`appendSessionTranscriptMessage` 或 `emitSessionTranscriptUpdate`。

- 使用 `appendSessionTranscriptMessageByIdentity(...)` 進行 transcript 附加。
- 使用 `publishSessionTranscriptUpdateByIdentity(...)` 進行 transcript 更新通知。
- 偏好使用結構化 transcript 執行階段介面，讓 OpenClaw 能套用正確的交易邊界與識別處理。
- 只有在你宣告的相容性範圍仍支援需要它們的舊版 OpenClaw 時，
  才保留低階 transcript helper。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### legacy-before-agent-start

外掛仍在使用舊版 `before_agent_start` hook。

- 將模型或 provider 覆寫工作移至 `before_model_resolve`。
- 將提示或上下文變更工作移至 `before_prompt_build`。
- 只有在你宣告的相容性範圍仍支援需要它的舊版 OpenClaw 時，
  才保留 `before_agent_start`。
- 請參閱 [Hooks](/zh-TW/plugins/hooks) 和
  [外掛相容性](/zh-TW/plugins/compatibility)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### provider-auth-env-vars

manifest 仍在使用舊版 `providerAuthEnvVars` provider 驗證中繼資料。

- 將 provider 環境變數中繼資料鏡射至 `setup.providers[].envVars`。
- 只有在你支援的 OpenClaw 範圍仍需要它時，才將 `providerAuthEnvVars` 保留為相容性中繼資料。
- 請參閱 [setup 參考](/zh-TW/plugins/manifest#setup-reference) 和
  [SDK 遷移](/zh-TW/plugins/sdk-migration)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### channel-env-vars

manifest 使用舊版或較舊的頻道環境變數中繼資料，缺少 ClawHub 預期的目前
setup 或 config 中繼資料。

- 保持頻道環境變數中繼資料為宣告式，讓 OpenClaw 無需載入頻道執行階段即可檢查 setup 狀態。
- 將環境驅動的頻道 setup 鏡射至目前 setup、頻道 config，或
  你的外掛形態所使用的套件頻道中繼資料。
- 只有在較舊的受支援 OpenClaw 版本仍需要它時，才將 `channelEnvVars` 保留為相容性中繼資料。
- 請參閱[外掛 manifest](/zh-TW/plugins/manifest)和
  [頻道外掛](/zh-TW/plugins/sdk-channel-plugins)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 安全性 manifest

### security-manifest-schema-unavailable

套件隨附的 `openclaw.security.json` 含有 ClawHub
未辨識為可用的 schema 參照。

- 如果 schema URL 僅供建議用途，請將其移除。
- 只有在 OpenClaw 發布文件化的版本化 schema 後，才使用該 schema。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### unrecognized-security-manifest

套件隨附不受支援的安全性 manifest 檔案。

- 移除 `openclaw.security.json`，直到 OpenClaw 文件化版本化安全性
  manifest schema 與 ClawHub 行為為止。
- 在 manifest contract 存在之前，請將安全性敏感行為記錄於你的公開套件文件或
  README 中。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 相關

- [ClawHub 命令列介面](/zh-TW/clawhub/cli)
- [ClawHub 發布](/zh-TW/clawhub/publishing)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [外掛 manifest](/zh-TW/plugins/manifest)
- [外掛進入點](/zh-TW/plugins/sdk-entrypoints)
- [外掛相容性](/zh-TW/plugins/compatibility)
