---
read_when:
    - 你想要安全地更新原始碼簽出目錄
    - 你正在偵錯 `openclaw update` 輸出或選項
    - 你需要了解 `--update` 簡寫行為
summary: '`openclaw update` 的命令列介面參考（較安全的原始碼更新 + 閘道自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-07-12T14:24:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db7b636b68e693824cb49ada2c176a4e394a3100ce33fff1c96ee20ae8427ee
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

更新 OpenClaw，並在 stable/extended-stable/beta/dev 頻道之間切換。

如果你是透過 **npm/pnpm/bun** 安裝（全域安裝，沒有 git 中繼資料），
更新會採用[更新](/zh-TW/install/updating)中所述的套件管理器流程。

## 用法

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

`openclaw --update` 會改寫為 `openclaw update`（適用於 shell 和
啟動器指令碼）。

## 選項

| 旗標                                             | 說明                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | 成功更新後略過重新啟動閘道服務。若套件管理器更新會執行重新啟動，則會先驗證重新啟動的服務回報預期版本，命令才會成功。                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | 設定更新頻道，並在核心更新成功後保存此設定。Extended-stable 僅適用於套件安裝。                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | 僅針對本次更新覆寫套件目標。不能與實際的 `extended-stable` 頻道搭配使用，因為該頻道強制要求已驗證的確切目標。對於其他套件安裝，`main` 會對應至 `github:openclaw/openclaw#main`；GitHub/git 來源規格會先封裝成暫存 tarball，再執行分階段全域 npm 安裝。 |
| `--dry-run`                                      | 預覽預定動作（頻道/標籤/目標/重新啟動流程），但不寫入設定、不安裝、不同步外掛，也不重新啟動。                                                                                                                                                                                                                |
| `--json`                                         | 輸出機器可讀的 `UpdateRunResult` JSON。當受管理的外掛需要修復時，包含 `postUpdate.plugins.warnings`；也包含 beta 頻道的外掛後援詳細資料，以及在更新後同步期間偵測到 npm 外掛成品漂移時的 `postUpdate.plugins.integrityDrifts`。                                                                 |
| `--timeout <seconds>`                            | 每個步驟的逾時時間。預設為 `1800`。                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | 略過確認提示（例如降級確認）。                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | 允許更新後的外掛同步在出現社群 ClawHub 信任警告時繼續，而不顯示互動式提示。若未指定此旗標，當 OpenClaw 無法顯示提示時，會略過有風險的社群版本並保持不變。官方 ClawHub 套件和隨附外掛來源不受此提示限制。                                                     |

沒有 `--verbose` 旗標。請使用 `--dry-run` 預覽預定動作、
使用 `--json` 取得機器可讀的結果，並使用 `openclaw update status --json`
僅查看頻道/可用性。閘道主控台詳細程度（`--verbose`）與
檔案日誌層級（`logging.level: "debug"`/`"trace"`）是彼此獨立的控制項；請參閱
[閘道記錄](/zh-TW/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，會停用可變更內容的 `openclaw update` 執行。請改為更新此安裝的 Nix 來源或 flake 輸入；若使用 nix-openclaw，請採用代理優先的[快速入門](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍為唯讀。
</Note>

<Warning>
降級需要確認，因為較舊的版本可能會破壞設定。
如果此安裝已將工作階段遷移至 SQLite，請先還原封存的舊版
逐字稿成品，再啟動較舊的檔案型版本。請參閱
[Doctor：工作階段遷移至 SQLite 後進行降級](/zh-TW/cli/doctor#downgrading-after-session-sqlite-migration)。
</Warning>

## `update status`

顯示目前的更新頻道、git 標籤/分支/SHA（僅限原始碼簽出），
以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| 旗標                  | 預設值 | 說明                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | 輸出機器可讀的狀態 JSON。 |
| `--timeout <seconds>` | `3`     | 檢查的逾時時間。                 |

對於 extended-stable 套件安裝，狀態檢查會執行與前景更新相同的公開選擇器
和確切套件驗證。當已安裝版本較新時，它可能會回報
`ahead of extended-stable`。JSON 失敗結果包含
`registry.reason`（`selector_missing`、`selector_query_failed`、
`exact_package_mismatch` 或 `unsupported_git_channel`）。

## `update repair`

核心套件已變更，但後續修復工作未順利完成時，
重新執行更新完成程序。當 `openclaw update` 已安裝新的核心套件，
但核心更新後的外掛同步、受管理 npm 外掛中繼資料、登錄檔重新整理或 Doctor 修復
未能收斂時，這是受支援的復原途徑。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| 旗標                                             | 說明                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | 在修復前保存核心更新頻道。對於 extended-stable，遵循裸值/預設值或 `latest` 意圖的合格官方 npm 外掛，會以確切的已安裝核心版本為目標。若為 Git 簽出，extended-stable 修復會遭拒絕，且不會變更設定。 |
| `--json`                                         | 輸出機器可讀的完成程序 JSON。                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | 修復步驟的逾時時間。預設為 `1800`。                                                                                                                                                                                                                           |
| `--yes`                                          | 略過確認提示。                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | 行為與 `openclaw update` 相同。                                                                                                                                                                                                                              |
| `--no-restart`                                   | 為保持一致而接受此旗標；修復絕不會重新啟動閘道。                                                                                                                                                                                                             |

`update repair` 會執行 `openclaw doctor --fix`、重新載入修復後的設定和
安裝記錄、針對目前更新頻道同步追蹤中的外掛、更新
受管理的 npm 外掛安裝、修復缺少的已設定外掛承載內容、
重新整理外掛登錄檔，並寫入已收斂的安裝記錄中繼資料。
它不會安裝新的核心套件，也不會重新啟動閘道。

## `update wizard`

互動式流程，用於選擇更新頻道，並確認之後是否重新啟動
閘道（預設會重新啟動）。在非 git 簽出的環境中選取 `dev`，
系統會提供建立簽出的選項。

| 旗標                  | 預設值 | 說明                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | 每個更新步驟的逾時時間。 |

## 功能說明

明確切換頻道（`--channel ...`）也會使安裝方式
保持一致：

- `dev` -> 確保有 git 簽出（預設為 `~/openclaw`；若已設定
  `OPENCLAW_HOME`，則為 `$OPENCLAW_HOME/openclaw`；可使用
  `OPENCLAW_GIT_DIR` 覆寫），更新該簽出，並從該
  簽出安裝全域命令列介面。
- `stable` -> 使用 `latest` 從 npm 安裝。
- `extended-stable` -> 解析公開 npm `extended-stable` 選擇器、
  驗證確切選取的套件，並安裝該確切版本。它
  不會後援至其他選擇器，且 Git 簽出不支援此頻道。
- `beta` -> 優先使用 npm dist-tag `beta`；當 beta
  不存在或早於目前的穩定版本時，後援至 `latest`。

### 重新啟動交接

閘道核心自動更新程式（透過設定啟用時）會在即時
閘道要求處理常式之外啟動命令列介面更新路徑。控制平面的
`update.run` 套件管理器更新和受監督的 git 簽出更新會使用
相同的受管理服務交接，而不會在即時閘道程序內取代套件樹或
重新建置 `dist/`：閘道會啟動一個分離的輔助程式後結束，
該輔助程式則從閘道程序樹之外執行 `openclaw update --yes --json`。
如果交接無法使用，`update.run` 會傳回結構化回應，其中包含可供
手動執行的安全 shell 命令。

儲存的延伸穩定版選擇，會在啟用 `update.checkOnStart` 時於啟動時以唯讀方式檢查，並每 24 小時提供更新提示。這些檢查絕不會套用更新、啟動移交、重新啟動閘道、使用穩定版的延遲／抖動機制，或採用測試版的輪詢頻率。明確的前景更新、儲存了 `update.channel: "extended-stable"` 的無參數前景更新、隨選狀態查詢，以及其受管理的閘道移交仍受支援。

當已安裝本機受管理的閘道服務且已啟用重新啟動時，套件管理器與 Git 簽出更新會在取代套件樹或修改簽出內容／建置輸出之前，先停止執行中的服務。更新程式接著會重新整理服務中繼資料、重新啟動服務，並驗證重新啟動的閘道，然後才回報 `Gateway: restarted and verified.`。套件管理器更新還會驗證重新啟動的閘道回報預期的套件版本；Git 簽出更新則會在重新建置後驗證閘道健康狀態與服務就緒狀態。

在 macOS 上，更新後檢查也會驗證作用中設定檔的 LaunchAgent 已載入／執行，且所設定的迴路位址連接埠狀態正常。如果已安裝 plist，但 launchd 並未監管它，OpenClaw 會自動重新啟動 LaunchAgent，並再次執行健康狀態／版本／頻道就緒檢查（全新啟動會直接載入 `RunAtLoad` 工作，因此復原程序不會立即對剛啟動的閘道執行 `kickstart -k`）。如果閘道仍未恢復正常，命令會以非零狀態結束，並列印重新啟動記錄路徑，以及重新啟動、重新安裝與套件回復指示。

如果無法執行重新啟動，命令會列印 `Gateway: restart skipped (...)` 或 `Gateway: restart failed: ...`，並提示手動執行 `openclaw gateway restart`。使用 `--no-restart` 時，仍會執行套件取代或 Git 重新建置，但不會停止或重新啟動受管理的服務，因此執行中的閘道會繼續使用舊程式碼，直到你手動重新啟動為止。

### 控制平面回應格式

當 `update.run` 透過閘道控制平面，在套件管理器安裝或受監管的 Git 簽出上執行時，處理常式會將移交啟動與閘道結束後繼續進行的命令列介面更新分開回報：

- `ok: true`、`result.status: "skipped"`、
  `result.reason: "managed-service-handoff-started"`，以及
  `handoff.status: "started"`：閘道已建立受管理服務移交，並排定自身重新啟動，讓分離式輔助程式可在即時服務程序之外執行
  `openclaw update --yes --json`。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"`，以及
  `handoff.status: "unavailable"`：OpenClaw 找不到可安全移交所需的監管服務邊界與持久服務識別資訊（例如，systemd 移交需要 `OPENCLAW_SYSTEMD_UNIT` 單元識別資訊，不能只依賴環境中的 systemd 程序標記）。回應會包含
  `handoff.command`，也就是要從閘道外部執行的 shell 命令。
- `ok: false`、`result.reason: "managed-service-handoff-failed"`：閘道嘗試建立移交，但無法啟動分離式輔助程式。

`sentinel` 承載內容會在閘道結束前寫入，而命令列介面移交會在受管理服務重新啟動的健康檢查完成後，更新同一個重新啟動 sentinel。移交期間，sentinel 可包含 `stats.reason: "restart-health-pending"`，且不含成功續行資訊；重新啟動的閘道會輪詢該 sentinel，只有在命令列介面驗證服務健康狀態並以最終 `ok` 結果重寫 sentinel 後，才會觸發續行。當該 sentinel 處於待處理或失敗狀態時，`openclaw status` 與 `openclaw status --all` 會顯示 `Update restart` 列，而 `update.status` 會重新整理並傳回最新的 sentinel。

## Git 簽出流程

### 頻道選擇

- `stable`：簽出最新的非測試版標籤，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` 標籤；如果測試版不存在或較舊，則回退至最新的穩定版標籤。
- `dev`：簽出 `main`，然後擷取並重定基底。
- `extended-stable`：Git 簽出不支援；不會修改簽出內容。

### 更新步驟

<Steps>
  <Step title="驗證工作樹乾淨">
    不得有未提交的變更。
  </Step>
  <Step title="切換頻道">
    切換至所選頻道（標籤或分支）。
  </Step>
  <Step title="擷取上游">
    僅適用於開發版。
  </Step>
  <Step title="預先檢查建置（僅限開發版）">
    在暫存工作樹中執行 TypeScript 建置。如果頂端提交失敗，最多往回檢查 10 個提交，以找出最新且可建置的提交。設定 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也可在此預先檢查期間執行 lint；lint 會以受限的序列模式執行，因為使用者的更新主機通常比 CI 執行器更小。
  </Step>
  <Step title="重定基底">
    重定基底至所選提交（僅限開發版）。
  </Step>
  <Step title="安裝相依套件">
    使用儲存庫的套件管理器。對於 pnpm 簽出，更新程式會隨選啟動 `pnpm`（先透過 `corepack`，再以暫時的 `npm install pnpm@11` 作為回退），而不是在 pnpm 工作區內執行 `npm run build`。如果 pnpm 啟動仍然失敗，更新程式會提早停止並顯示套件管理器專屬錯誤，而不會嘗試在簽出內容中執行 `npm run build`。
  </Step>
  <Step title="建置控制介面">
    建置閘道與控制介面。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="同步外掛">
    將外掛同步至作用中頻道。開發版使用內建外掛；穩定版與測試版使用 npm。更新受追蹤的外掛安裝項目。
  </Step>
</Steps>

### 外掛同步詳細資料

在測試版頻道上，遵循預設／最新版本線的受追蹤 npm 與 ClawHub 外掛安裝項目，會先嘗試外掛的 `@beta` 版本。如果外掛沒有測試版，OpenClaw 會回退至已記錄的預設／最新規格並回報警告。對於 npm 外掛，如果測試版套件存在但未通過安裝驗證，OpenClaw 也會回退。這些回退警告不會使核心更新失敗。確切版本與明確標籤絕不會被改寫。

<Warning>
如果精確固定版本的 npm 外掛更新解析到的成品，其完整性與儲存的安裝記錄不同，`openclaw update` 會中止該外掛成品的更新，而不會安裝它。只有在確認你信任新成品後，才應明確重新安裝或更新此外掛。
</Warning>

<Note>
如果更新後的外掛同步失敗範圍僅限於受管理外掛，且同步路徑可以繞過該失敗（例如，非必要外掛的 npm 登錄無法連線），則會在核心更新成功後回報警告。JSON 結果會將頂層更新 `status: "ok"` 保持不變，並回報 `postUpdate.plugins.status: "warning"`，同時提供 `openclaw update repair` 與 `openclaw plugins inspect <id> --runtime --json` 指引。非預期的更新程式或同步例外仍會使更新結果失敗。修正外掛安裝或更新錯誤，然後重新執行 `openclaw update repair`。

逐一同步外掛後，`openclaw update` 會在閘道重新啟動前執行強制的 **核心後收斂** 階段：修復遺失的已設定外掛承載內容、驗證磁碟上每筆_作用中_的受追蹤安裝記錄，並以靜態方式確認其 `package.json` 可解析（以及任何明確宣告的 `main` 都存在）。此階段的失敗與無效的設定快照會傳回 `postUpdate.plugins.status: "error"`，並將頂層更新 `status` 改為 `"error"`，因此 `openclaw update` 會以非零狀態結束，且不會以未經驗證的外掛集合重新啟動閘道。錯誤包含結構化的 `postUpdate.plugins.warnings[].guidance` 行，指向 `openclaw update repair` 與 `openclaw plugins inspect <id> --runtime --json`。停用的外掛項目，以及未連結至受信任來源之官方同步目標的記錄，會在此略過（與遺失承載內容檢查所使用的 `skipDisabledPlugins` 原則一致），因此過時的已停用外掛記錄不會阻擋原本有效的更新。

更新後的閘道啟動時，外掛載入僅執行驗證：啟動程序不會執行套件管理器或修改相依套件樹。套件管理器的 `update.run` 重新啟動會移交給命令列介面的受管理服務路徑，因此套件置換會在舊閘道程序之外進行，並由服務健康檢查決定是否可將更新回報為完成。
</Note>

延伸穩定版核心更新成功後，核心後外掛完整性與收斂會以符合資格的官方 npm 外掛為目標，並使用與已安裝核心完全相同的版本。對於預設／`latest` 意圖，OpenClaw 不會查詢外掛的 `@extended-stable`，也不會回退至 npm `latest`；它會從已安裝的核心推導套件版本。明確的版本固定、明確的非 `latest` 標籤、第三方套件與非 npm 來源，會保留其現有意圖。

對於套件管理器安裝，`openclaw update` 會在叫用套件管理器之前解析目標套件版本。npm 全域安裝採用分階段安裝：OpenClaw 會將新套件安裝到暫存的 npm 前置路徑，在其中驗證封裝的 `dist` 清單，然後將該乾淨套件樹置換至實際的全域前置路徑。如果驗證失敗，更新後的 doctor、外掛同步與重新啟動工作都不會從可疑的套件樹執行。即使已安裝版本已符合目標，命令仍會重新整理全域套件安裝，然後執行外掛同步、核心命令補全重新整理，以及重新啟動工作。如此可使封裝的附屬元件與頻道所管理的外掛記錄，和已安裝的 OpenClaw 組建保持一致，同時將完整的外掛命令補全重建留給明確執行的 `openclaw completion --write-state`。

## 相關內容

- `openclaw doctor`（在 Git 簽出上會先提議執行更新）
- [開發頻道](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [命令列介面參考](/zh-TW/cli)
