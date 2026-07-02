---
read_when:
    - 你已執行 `clawhub package validate`，需要修正外掛發現的問題
    - ClawHub 拒絕或警告外掛套件發布
    - 您正在發行前更新外掛套件中繼資料
summary: 修正發布前的 ClawHub 外掛套件驗證發現事項
title: 外掛驗證修正
x-i18n:
    generated_at: "2026-07-02T17:30:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# 外掛驗證修正

ClawHub 會在發布前驗證外掛套件，也可以顯示來自
自動化套件掃描的發現項目。本頁涵蓋面向作者的發現項目，也就是
外掛作者可以在其套件中繼資料、清單、SDK
匯入或已發布成品中修正的發現項目。

它不涵蓋內部 Plugin Inspector 覆蓋率發現項目。如果完整報告
包含沒有作者修復指引的掃描器維護代碼，這些是給 OpenClaw
維護者看的，而不是給外掛作者看的。

套用任何修正後，請重新執行：

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
| `package-install-metadata-incomplete`   | [完成安裝中繼資料](/zh-TW/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [宣告外掛 API 相容性](/zh-TW/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [對齊最低主機版本](/zh-TW/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [對齊套件與清單版本](/zh-TW/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [移除不支援的 OpenClaw 套件中繼資料](/zh-TW/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [讓 npm 成品可封裝](/zh-TW/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [在 npm pack 輸出中包含進入點](/zh-TW/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [在 npm pack 輸出中包含中繼資料](/zh-TW/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [新增清單顯示名稱](/zh-TW/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [移除不支援的清單欄位](/zh-TW/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [移除不支援的合約鍵](/zh-TW/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [取代根 SDK 匯入](/zh-TW/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [移除保留的 SDK 匯入](/zh-TW/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [取代整個工作階段儲存存取](/zh-TW/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [取代整個工作階段儲存寫入](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [取代工作階段檔案路徑輔助程式](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [取代舊版文字記錄檔案目標](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [取代低階文字記錄輔助程式](/zh-TW/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [取代 before_agent_start](/zh-TW/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [將提供者環境變數移至設定中繼資料](/zh-TW/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [在目前中繼資料中鏡像通道環境變數](/zh-TW/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [移除無法使用的安全清單結構描述參照](/zh-TW/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [移除不支援的安全清單檔案](/zh-TW/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## 套件中繼資料

### package-json-missing

套件根目錄未包含 `package.json`，因此 ClawHub 無法識別
npm 套件、版本、進入點或 OpenClaw 中繼資料。

- 新增含有 `name`、`version` 和 `type` 的 `package.json`。
- 當套件發布 OpenClaw 外掛時，新增 `openclaw` 區塊。
- 使用[建置外掛](/zh-TW/plugins/building-plugins)查看最小套件
  範例，並使用[外掛清單](/zh-TW/plugins/manifest#manifest-versus-packagejson)
  了解套件與清單的分工。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-metadata-missing

套件有 `package.json`，但未宣告 OpenClaw 套件
中繼資料。

- 新增 `package.json#openclaw`。
- 包含進入點中繼資料，例如 `openclaw.extensions` 或
  `openclaw.runtimeExtensions`。
- 當套件將透過 ClawHub 發布或安裝時，新增相容性與安裝
  中繼資料。
- 請參閱[會影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-entry-missing

套件中繼資料存在，但未宣告 OpenClaw 執行階段
進入點。

- 為原生外掛進入點新增 `openclaw.extensions`。
- 當已發布套件應載入建置後的
  JavaScript 時，新增 `openclaw.runtimeExtensions`。
- 將所有進入點路徑保留在套件目錄內。
- 請參閱[外掛進入點](/zh-TW/plugins/sdk-entrypoints)與
  [會影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-entrypoint-missing

套件宣告了 OpenClaw 進入點，但在正在驗證的套件中
缺少所參照的檔案。

- 檢查 `openclaw.extensions`、`openclaw.runtimeExtensions`、
  `openclaw.setupEntry` 和 `openclaw.runtimeSetupEntry` 中的每個路徑。
- 如果進入點會產生到 `dist`，請先建置套件。
- 如果進入點已移動，請更新中繼資料。
- 請參閱[外掛進入點](/zh-TW/plugins/sdk-entrypoints)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-install-metadata-incomplete

ClawHub 無法判斷應如何安裝或更新套件。

- 在 `openclaw.install` 中填入支援的安裝來源，例如
  `clawhubSpec`、`npmSpec` 或 `localPath`。
- 當有多個安裝來源可用時，設定 `openclaw.install.defaultChoice`。
- 使用 `openclaw.install.minHostVersion` 指定最低 OpenClaw 主機版本。
- 請參閱[會影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-plugin-api-compat-missing

套件未宣告其支援的 OpenClaw 外掛 API 範圍。

- 將 `openclaw.compat.pluginApi` 新增到 `package.json`。
- 使用你建置和測試時所依據的 OpenClaw 外掛 API 版本或 semver 下限。
- 將它與套件版本分開。套件版本描述
  外掛發布；`openclaw.compat.pluginApi` 描述主機 API 合約。
- 請參閱[會影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-min-host-version-drift

套件最低主機版本與套件建置時所依據的 OpenClaw 版本中繼資料
不相符。

- 檢查 `openclaw.install.minHostVersion`。
- 檢查套件中的任何 OpenClaw 建置中繼資料，例如發布期間使用的
  OpenClaw 版本。
- 將最低主機版本與套件實際支援的主機版本範圍
  對齊。
- 請參閱[會影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-manifest-version-drift

套件版本與外掛清單版本不一致。

- 偏好使用 `package.json#version` 作為套件發布版本。
- 如果 `openclaw.plugin.json` 也有 `version`，請更新它以相符，或在套件中繼資料具權威性時
  移除過時的清單版本中繼資料。
- 變更已發布中繼資料後，發布新的套件版本。
- 請參閱[外掛清單](/zh-TW/plugins/manifest)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-unsupported-metadata

`package.json#openclaw` 區塊包含不受支援的
OpenClaw 套件中繼資料欄位。

- 移除不支援的欄位，例如 `openclaw.bundle`。
- 將原生外掛中繼資料保留在 `openclaw.plugin.json`。
- 將套件進入點、相容性、安裝、設定和目錄中繼資料
  保留在支援的 `package.json#openclaw` 欄位中。
- 請參閱[會影響探索的 package.json 欄位](/zh-TW/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 已發布成品

### package-npm-pack-unavailable

套件無法封裝成 ClawHub 會檢查或
發布的成品。

- 從套件根目錄執行 `npm pack --dry-run`。
- 修正無效的套件中繼資料、損壞的生命週期指令碼，或會導致
  封裝失敗的 files 項目。
- 如果此套件預期要公開發布，請移除 `private: true`。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-npm-pack-entrypoint-missing

套件可以封裝，但封裝後的成品未包含
`package.json#openclaw` 中宣告的進入點檔案。

- 執行 `npm pack --dry-run` 並檢查會被包含的檔案。
- 封裝前先建置產生的進入點。
- 更新 `files`、`.npmignore` 或建置輸出，讓宣告的進入點
  被包含。
- 請參閱[外掛進入點](/zh-TW/plugins/sdk-entrypoints)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### package-npm-pack-metadata-missing

封裝後的成品缺少你原始碼套件中存在的 OpenClaw
中繼資料。

- 執行 `npm pack --dry-run` 並檢查包含的中繼資料檔案。
- 確保 `package.json` 在封裝後的成品中包含 `openclaw` 區塊。
- 當套件是原生 OpenClaw 外掛時，確保
  `openclaw.plugin.json` 被包含。
- 更新 `files` 或 `.npmignore`，讓套件中繼資料不會被排除。
- 請參閱[建置外掛](/zh-TW/plugins/building-plugins)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 清單中繼資料

### manifest-name-missing

原生外掛資訊清單未包含顯示名稱。

- 將非空的 `name` 欄位新增至 `openclaw.plugin.json`。
- 保持 `name` 便於人類閱讀，並將 `id` 保持為穩定的機器識別碼。
- 請參閱[外掛資訊清單](/zh-TW/plugins/manifest)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### manifest-unknown-fields

外掛資訊清單含有 OpenClaw 不支援的頂層欄位。

- 將每個頂層欄位與
  [資訊清單欄位參考](/zh-TW/plugins/manifest#top-level-field-reference)比較。
- 從 `openclaw.plugin.json` 移除自訂欄位。
- 將套件或安裝中繼資料移至受支援的 `package.json#openclaw` 欄位，
  而不是放在資訊清單中。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### manifest-unknown-contracts

資訊清單在 `contracts` 內宣告了不受支援的鍵。

- 將 `contracts` 下的每個鍵與
  [contracts 參考](/zh-TW/plugins/manifest#contracts-reference)比較。
- 移除不受支援的 contract 鍵。
- 將執行階段行為移至外掛註冊程式碼，並讓 `contracts`
  僅限於靜態能力擁有權中繼資料。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## SDK 與相容性遷移

### legacy-root-sdk-import

外掛從已棄用的根 SDK barrel 匯入：
`openclaw/plugin-sdk`。

- 以聚焦的公開子路徑匯入取代根 barrel 匯入。
- 對 `definePluginEntry` 使用 `openclaw/plugin-sdk/plugin-entry`。
- 對通道進入點輔助程式使用 `openclaw/plugin-sdk/channel-core`。
- 使用[匯入慣例](/zh-TW/plugins/building-plugins#import-conventions)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)找出範圍較窄的匯入。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### reserved-sdk-import

外掛匯入了保留給內建外掛或內部相容性的 SDK 路徑。

- 以已文件化的公開
  `openclaw/plugin-sdk/*` 子路徑取代保留的 OpenClaw 內部 SDK 匯入。
- 如果該行為沒有公開 SDK，請將輔助程式保留在你的套件內，或
  請求公開的 OpenClaw API。
- 使用[外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)和
  [SDK 遷移](/zh-TW/plugins/sdk-migration)選擇受支援的匯入。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-load-session-store

外掛仍使用已棄用的整體工作階段儲存輔助程式
`loadSessionStore`。

- 讀取工作階段狀態時，使用 `getSessionEntry(...)` 或 `listSessionEntries(...)`。
- 寫入工作階段狀態時，使用 `patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。
- 避免載入、變更並儲存整個工作階段儲存物件。
- 只有在你宣告的相容性範圍仍支援需要它的較舊 OpenClaw 版本時，
  才保留 `loadSessionStore(...)`。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-store-write

外掛仍使用已棄用的整體工作階段儲存寫入輔助程式，例如
`saveSessionStore` 或 `updateSessionStore`。

- 更新既有工作階段項目的欄位時，使用 `patchSessionEntry(...)`。
- 取代或建立工作階段項目時，使用 `upsertSessionEntry(...)`。
- 避免載入、變更並儲存整個工作階段儲存物件。
- 只有在你宣告的相容性範圍仍支援需要它們的較舊 OpenClaw 版本時，
  才保留整體儲存寫入輔助程式。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-file-helper

外掛仍使用已棄用的工作階段檔案路徑輔助程式，例如
`resolveSessionFilePath` 或 `resolveAndPersistSessionFile`。

- 使用 `getSessionEntry(...)` 依代理程式與工作階段身分讀取工作階段中繼資料。
- 使用 `patchSessionEntry(...)` 或 `upsertSessionEntry(...)` 持久化工作階段中繼資料。
- 當程式碼正在準備逐字稿操作時，使用逐字稿身分或目標輔助程式。
- 不要持久化或依賴舊版逐字稿檔案路徑。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-transcript-file-target

外掛仍使用已棄用的逐字稿檔案目標輔助程式
`resolveSessionTranscriptLegacyFileTarget`。

- 當程式碼只需要公開工作階段身分時，使用 `resolveSessionTranscriptIdentity(...)`。
- 當程式碼需要結構化逐字稿操作目標時，使用 `resolveSessionTranscriptTarget(...)`。
- 避免直接讀取或建構舊版逐字稿檔案目標。
- 只有在你宣告的相容性範圍仍支援需要它的較舊 OpenClaw 版本時，
  才保留舊版輔助程式。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### sdk-session-transcript-low-level

外掛仍使用已棄用的低階逐字稿輔助程式，例如
`appendSessionTranscriptMessage` 或 `emitSessionTranscriptUpdate`。

- 對逐字稿附加操作使用 `appendSessionTranscriptMessageByIdentity(...)`。
- 對逐字稿更新通知使用 `publishSessionTranscriptUpdateByIdentity(...)`。
- 優先使用結構化逐字稿執行階段介面，讓 OpenClaw 能套用正確的交易邊界與身分處理。
- 只有在你宣告的相容性範圍仍支援需要它們的較舊 OpenClaw 版本時，
  才保留低階逐字稿輔助程式。
- 請參閱[執行階段 API](/zh-TW/plugins/sdk-runtime#agent-session-state)和
  [外掛 SDK 子路徑](/zh-TW/plugins/sdk-subpaths)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### legacy-before-agent-start

外掛仍使用舊版 `before_agent_start` hook。

- 將模型或提供者覆寫工作移至 `before_model_resolve`。
- 將提示或脈絡變更工作移至 `before_prompt_build`。
- 只有在你宣告的相容性範圍仍支援需要它的較舊 OpenClaw 版本時，
  才保留 `before_agent_start`。
- 請參閱[Hook](/zh-TW/plugins/hooks)和
  [外掛相容性](/zh-TW/plugins/compatibility)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### provider-auth-env-vars

資訊清單仍使用舊版 `providerAuthEnvVars` 提供者驗證中繼資料。

- 將提供者環境變數中繼資料鏡像到 `setup.providers[].envVars`。
- 只有在你支援的 OpenClaw 範圍仍需要時，才將 `providerAuthEnvVars` 保留為相容性中繼資料。
- 請參閱[setup 參考](/zh-TW/plugins/manifest#setup-reference)和
  [SDK 遷移](/zh-TW/plugins/sdk-migration)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### channel-env-vars

資訊清單使用舊版或較舊的通道環境變數中繼資料，缺少 ClawHub 預期的目前
setup 或 config 中繼資料。

- 保持通道環境變數中繼資料為宣告式，讓 OpenClaw 能在不載入通道執行階段的情況下檢查 setup 狀態。
- 將環境變數驅動的通道 setup 鏡像到你的外掛形態所使用的目前 setup、通道 config 或套件通道中繼資料。
- 只有在較舊的受支援 OpenClaw 版本仍需要時，才將 `channelEnvVars` 保留為相容性中繼資料。
- 請參閱[外掛資訊清單](/zh-TW/plugins/manifest)和
  [通道外掛](/zh-TW/plugins/sdk-channel-plugins)。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 安全性資訊清單

### security-manifest-schema-unavailable

套件隨附 `openclaw.security.json`，其 schema 參考未被 ClawHub 識別為可用。

- 如果 schema URL 僅供建議用途，請將其移除。
- 只有在 OpenClaw 發布已文件化的版本化 schema 後，才使用它。
- 重新執行 `clawhub package validate <path-to-plugin>`。

### unrecognized-security-manifest

套件隨附不受支援的安全性資訊清單檔案。

- 在 OpenClaw 文件化版本化安全性資訊清單 schema 與 ClawHub 行為之前，
  移除 `openclaw.security.json`。
- 在資訊清單 contract 存在之前，將安全性敏感行為記錄在你的公開套件文件或
  README 中。
- 重新執行 `clawhub package validate <path-to-plugin>`。

## 相關

- [ClawHub 命令列介面](/zh-TW/clawhub/cli)
- [ClawHub 發布](/zh-TW/clawhub/publishing)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [外掛資訊清單](/zh-TW/plugins/manifest)
- [外掛進入點](/zh-TW/plugins/sdk-entrypoints)
- [外掛相容性](/zh-TW/plugins/compatibility)
