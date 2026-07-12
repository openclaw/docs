---
read_when:
    - 你執行了 clawhub package validate，需要修正外掛檢查結果
    - ClawHub 拒絕外掛套件發布或發出警告
    - 你正在發行前更新外掛套件中繼資料
summary: 發布前修正 ClawHub 外掛套件驗證問題
title: 外掛驗證修正
x-i18n:
    generated_at: "2026-07-12T21:22:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# 外掛驗證修正

ClawHub 會在發布前驗證外掛套件，也能顯示自動化套件掃描的發現。本頁涵蓋面向作者的發現，也就是外掛作者可在套件中修正的套件中繼資料、資訊清單、SDK 匯入或已發布成品問題。

本頁不涵蓋 Plugin Inspector 內部的涵蓋範圍發現。如果完整報告包含未提供作者修正指引的掃描器維護代碼，這些代碼是供 OpenClaw 維護者處理，而非外掛作者。

套用任何修正後，請重新執行：

```bash
clawhub package validate <path-to-plugin>
```

## 面向作者的發現

| 代碼                                    | 從這裡開始                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [新增套件中繼資料](/zh-TW/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [新增套件的 openclaw 區塊](/zh-TW/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
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
| `legacy-root-sdk-import`                | [取代根層級 SDK 匯入](/zh-TW/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [移除保留的 SDK 匯入](/zh-TW/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [取代完整工作階段儲存區存取](/zh-TW/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [取代完整工作階段儲存區寫入](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [取代工作階段檔案路徑輔助函式](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [取代舊版逐字稿檔案目標](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [取代低階逐字稿輔助函式](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [取代 before_agent_start](/zh-TW/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [將供應商環境變數移至設定中繼資料](/zh-TW/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [在目前的中繼資料中同步頻道環境變數](/zh-TW/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [移除無法使用的安全性資訊清單結構描述參照](/zh-TW/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [移除不支援的安全性資訊清單檔案](/zh-TW/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## 套件中繼資料

### package-json-missing

套件根目錄不包含 `package.json`，因此 ClawHub 無法識別 npm 套件、版本、進入點或 OpenClaw 中繼資料。

- 新增包含 `name`、`version` 和 `type` 的 `package.json`。
- 當套件提供 OpenClaw 外掛時，請新增 `openclaw` 區塊。
- 請參閱[建置外掛](/zh-TW/plugins/building-plugins)中的最小套件範例，以及[外掛資訊清單](/zh-TW/plugins/manifest#manifest-versus-packagejson)中的套件與資訊清單分工說明。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-metadata-missing

套件有 `package.json`，但未宣告 OpenClaw 套件中繼資料。

- 新增 `package.json#openclaw`。
- 包含 `openclaw.extensions` 或 `openclaw.runtimeExtensions` 等進入點中繼資料。
- 如果套件將透過 ClawHub 發布或安裝，請新增相容性和安裝中繼資料。
- 請參閱[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-entry-missing

套件中繼資料已存在，但未宣告 OpenClaw 執行階段進入點。

- 為原生外掛進入點新增 `openclaw.extensions`。
- 當發布的套件應載入已建置的 JavaScript 時，新增 `openclaw.runtimeExtensions`。
- 將所有進入點路徑保留在套件目錄內。
- 請參閱[外掛進入點](/zh-TW/plugins/sdk-entrypoints)和[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-entrypoint-missing

套件宣告了 OpenClaw 進入點，但所參照的檔案未包含在正在驗證的套件中。

- 檢查 `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry` 和 `openclaw.runtimeSetupEntry` 中的每個路徑。
- 如果進入點會產生至 `dist`，請建置套件。
- 如果進入點已移動，請更新中繼資料。
- 請參閱[外掛進入點](/zh-TW/plugins/sdk-entrypoints)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-install-metadata-incomplete

ClawHub 無法判斷應如何安裝或更新套件。

- 在 `openclaw.install` 中填入支援的安裝來源，例如 `clawhubSpec`、`npmSpec` 或 `localPath`。
- 當有多個安裝來源可用時，請設定 `openclaw.install.defaultChoice`。
- 使用 `openclaw.install.minHostVersion` 指定最低 OpenClaw 主機版本。
- 請參閱[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-plugin-api-compat-missing

套件未宣告其支援的 OpenClaw 外掛 API 範圍。

- 將 `openclaw.compat.pluginApi` 新增至 `package.json`。
- 使用你建置並測試時所依據的 OpenClaw 外掛 API 版本或 semver 版本下限。
- 請將此項與套件版本分開。套件版本描述外掛版本；`openclaw.compat.pluginApi` 則描述主機 API 合約。
- 請參閱[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-min-host-version-drift

套件的最低主機版本與建置套件時所依據的 OpenClaw 版本中繼資料不符。

- 檢查 `openclaw.install.minHostVersion`。
- 檢查套件中的任何 OpenClaw 建置中繼資料，例如發布時所使用的 OpenClaw 版本。
- 將最低主機版本與套件實際支援的主機版本範圍對齊。
- 請參閱[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-manifest-version-drift

套件版本與外掛資訊清單版本不一致。

- 優先使用 `package.json#version` 作為套件發布版本。
- 如果 `openclaw.plugin.json` 也有 `version`，請更新它以保持一致；若套件中繼資料具有權威性，則移除過時的資訊清單版本中繼資料。
- 變更已發布的中繼資料後，請發布新的套件版本。
- 請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-unsupported-metadata

`package.json#openclaw` 區塊包含不受支援的 OpenClaw 套件中繼資料欄位。

- 移除不支援的欄位，例如 `openclaw.bundle`。
- 將原生外掛中繼資料保留在 `openclaw.plugin.json` 中。
- 將套件進入點、相容性、安裝、設定和目錄中繼資料保留在支援的 `package.json#openclaw` 欄位中。
- 請參閱[影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 已發布成品

### package-npm-pack-unavailable

套件無法封裝成 ClawHub 將檢查或發布的成品。

- 從套件根目錄執行 `npm pack --dry-run`。
- 修正無效的套件中繼資料、損壞的生命週期指令碼，或導致封裝失敗的 files 項目。
- 如果此套件預定公開發布，請移除 `private: true`。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-npm-pack-entrypoint-missing

套件可以封裝，但封裝後的成品未包含 `package.json#openclaw` 中宣告的進入點檔案。

- 執行 `npm pack --dry-run` 並檢查將包含的檔案。
- 封裝前先建置產生的進入點。
- 更新 `files`、`.npmignore` 或建置輸出，以包含已宣告的進入點。
- 請參閱[外掛進入點](/zh-TW/plugins/sdk-entrypoints)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-npm-pack-metadata-missing

封裝後的成品缺少來源套件中存在的 OpenClaw 中繼資料。

- 執行 `npm pack --dry-run` 並檢查包含的中繼資料檔案。
- 確認封裝後成品中的 `package.json` 包含 `openclaw` 區塊。
- 當套件是原生 OpenClaw 外掛時，確認已包含 `openclaw.plugin.json`。
- 更新 `files` 或 `.npmignore`，避免排除套件中繼資料。
- 請參閱[建置外掛](/zh-TW/plugins/building-plugins)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 資訊清單中繼資料

### manifest-name-missing

原生外掛資訊清單未包含顯示名稱。

- 在 `openclaw.plugin.json` 中新增非空白的 `name` 欄位。
- `name` 應保持易於閱讀，並將 `id` 保持為穩定的機器識別碼。
- 請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### manifest-unknown-fields

外掛資訊清單含有 OpenClaw 不支援的頂層欄位。

- 將每個頂層欄位與
  [資訊清單欄位參考](/zh-TW/plugins/manifest#top-level-field-reference)進行比較。
- 從 `openclaw.plugin.json` 移除自訂欄位。
- 將套件或安裝中繼資料移至支援的 `package.json#openclaw` 欄位，
  而非放在資訊清單中。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### manifest-unknown-contracts

資訊清單在 `contracts` 內宣告了不支援的鍵。

- 將 `contracts` 下的每個鍵與
  [合約參考](/zh-TW/plugins/manifest#contracts-reference)進行比較。
- 移除不支援的合約鍵。
- 將執行階段行為移至外掛註冊程式碼，並將 `contracts`
  限制為靜態能力所有權中繼資料。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## SDK 與相容性遷移

### legacy-root-sdk-import

此外掛從已棄用的根 SDK 彙總入口匯入：
`openclaw/plugin-sdk`。

- 將根彙總入口匯入替換為聚焦的公開子路徑匯入。
- 使用 `openclaw/plugin-sdk/plugin-entry` 匯入 `definePluginEntry`。
- 使用 `openclaw/plugin-sdk/channel-core` 匯入頻道進入點輔助函式。
- 使用[匯入慣例](/zh-TW/plugins/building-plugins#import-conventions)與
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)找出範圍精確的匯入。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### reserved-sdk-import

此外掛匯入了保留給隨附外掛或內部相容性用途的 SDK 路徑。

- 將保留的 OpenClaw 內部 SDK 匯入替換為文件記載的公開
  `openclaw/plugin-sdk/*` 子路徑。
- 如果該行為沒有公開 SDK，請將輔助函式保留在你的套件內，或
  請求公開的 OpenClaw API。
- 使用[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)與
  [SDK 遷移](/zh-TW/plugins/sdk-migration)選擇受支援的匯入。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-load-session-store

此外掛仍在使用已棄用的完整工作階段儲存區輔助函式
`loadSessionStore`。

- 讀取工作階段狀態時，使用 `getSessionEntry(...)` 或 `listSessionEntries(...)`。
- 寫入工作階段狀態時，使用 `patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。
- 避免載入、修改及儲存整個工作階段儲存區物件。
- 僅在你宣告的相容範圍仍支援需要 `loadSessionStore(...)` 的舊版
  OpenClaw 時，才保留該函式。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)與
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-store-write

此外掛仍在使用已棄用的完整工作階段儲存區寫入輔助函式，例如
`saveSessionStore` 或 `updateSessionStore`。

- 更新現有工作階段項目的欄位時，使用 `patchSessionEntry(...)`。
- 替換或建立工作階段項目時，使用 `upsertSessionEntry(...)`。
- 避免載入、修改及儲存整個工作階段儲存區物件。
- 僅在你宣告的相容範圍仍支援需要完整儲存區寫入輔助函式的舊版
  OpenClaw 時，才保留這些函式。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)與
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-file-helper

此外掛仍在使用已棄用的工作階段檔案路徑輔助函式，例如
`resolveSessionFilePath` 或 `resolveAndPersistSessionFile`。

- 使用 `getSessionEntry(...)`，依代理程式與工作階段識別資訊讀取工作階段
  中繼資料。
- 使用 `patchSessionEntry(...)` 或 `upsertSessionEntry(...)` 保存工作階段
  中繼資料。
- 當程式碼正在準備文字記錄操作時，使用文字記錄識別資訊或目標輔助函式。
- 請勿保存或依賴舊版文字記錄檔案路徑。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)與
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-transcript-file-target

此外掛仍在使用已棄用的文字記錄檔案目標輔助函式
`resolveSessionTranscriptLegacyFileTarget`。

- 當程式碼只需要公開的工作階段識別資訊時，使用
  `resolveSessionTranscriptIdentity(...)`。
- 當程式碼需要結構化的文字記錄操作目標時，使用
  `resolveSessionTranscriptTarget(...)`。
- 避免直接讀取或建構舊版文字記錄檔案目標。
- 僅在你宣告的相容範圍仍支援需要舊版輔助函式的舊版
  OpenClaw 時，才保留該函式。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)與
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-transcript-low-level

此外掛仍在使用已棄用的低階文字記錄輔助函式，例如
`appendSessionTranscriptMessage` 或 `emitSessionTranscriptUpdate`。

- 使用 `appendSessionTranscriptMessageByIdentity(...)` 附加文字記錄。
- 使用 `publishSessionTranscriptUpdateByIdentity(...)` 傳送文字記錄更新
  通知。
- 優先使用結構化的文字記錄執行階段介面，讓 OpenClaw 能套用
  正確的交易界線與識別資訊處理。
- 僅在你宣告的相容範圍仍支援需要低階文字記錄輔助函式的舊版
  OpenClaw 時，才保留這些函式。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)與
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### legacy-before-agent-start

此外掛仍在使用舊版 `before_agent_start` 掛鉤。

- 將模型或供應商覆寫工作移至 `before_model_resolve`。
- 將提示或上下文修改工作移至 `before_prompt_build`。
- 僅在你宣告的相容範圍仍支援需要 `before_agent_start` 的舊版
  OpenClaw 時，才保留該掛鉤。
- 請參閱[掛鉤](/zh-TW/plugins/hooks)與
  [外掛相容性](/zh-TW/plugins/compatibility)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### provider-auth-env-vars

資訊清單仍在使用舊版 `providerAuthEnvVars` 供應商驗證中繼資料。

- 將供應商環境變數中繼資料同步至 `setup.providers[].envVars`。
- 僅在你支援的 OpenClaw 版本範圍仍需要時，才將 `providerAuthEnvVars`
  保留為相容性中繼資料。
- 請參閱[設定參考](/zh-TW/plugins/manifest#setup-reference)與
  [SDK 遷移](/zh-TW/plugins/sdk-migration)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### channel-env-vars

資訊清單使用舊版或較舊的頻道環境變數中繼資料，但未包含 ClawHub
預期的目前設定或組態中繼資料。

- 將頻道環境變數中繼資料保持為宣告式，讓 OpenClaw 無須載入頻道執行階段
  即可檢查設定狀態。
- 將環境變數驅動的頻道設定同步至此外掛結構所使用的目前設定、頻道組態或
  套件頻道中繼資料。
- 僅在支援的舊版 OpenClaw 仍需要時，才將 `channelEnvVars`
  保留為相容性中繼資料。
- 請參閱[外掛資訊清單](/zh-TW/plugins/manifest)與
  [頻道外掛](/zh-TW/plugins/sdk-channel-plugins)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 安全性資訊清單

### security-manifest-schema-unavailable

套件隨附的 `openclaw.security.json` 含有 ClawHub
無法辨識為可用的結構描述參照。

- 如果結構描述 URL 僅供參考，請將其移除。
- 僅在 OpenClaw 發布版本化結構描述後，才使用文件記載的版本化結構描述。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### unrecognized-security-manifest

套件隨附不受支援的安全性資訊清單檔案。

- 在 OpenClaw 記載版本化安全性資訊清單結構描述與 ClawHub 行為之前，
  請移除 `openclaw.security.json`。
- 在資訊清單合約建立之前，請將安全性敏感行為記載於套件的公開文件或
  README 中。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 相關內容

- [ClawHub 命令列介面](/zh-TW/clawhub/cli)
- [ClawHub 發布](/zh-TW/clawhub/publishing)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [外掛資訊清單](/zh-TW/plugins/manifest)
- [外掛進入點](/zh-TW/plugins/sdk-entrypoints)
- [外掛相容性](/zh-TW/plugins/compatibility)
