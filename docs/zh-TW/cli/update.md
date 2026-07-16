---
read_when:
    - 你想要安全地更新原始碼簽出版本
    - 你正在偵錯 `openclaw update` 輸出或選項
    - 你需要了解 `--update` 簡寫行為
summary: '`openclaw update` 的命令列介面參考（相對安全的原始碼更新 + 閘道自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-07-16T11:29:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

更新 OpenClaw，並在 stable/extended-stable/beta/dev 頻道之間切換。

如果你是透過 **npm/pnpm/bun** 安裝（全域安裝，沒有 git 中繼資料），
更新會依照[更新](/zh-TW/install/updating)中所述的套件管理器流程進行。

## 使用方式

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
| `--no-restart`                                   | 成功更新後略過重新啟動閘道服務。會重新啟動的套件管理器更新，會先確認重新啟動的服務回報預期版本，指令才會成功。                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | 設定更新頻道，並在核心更新成功後將其保留。Extended-stable 僅適用於套件。                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | 僅覆寫此次更新的套件目標。它不能與實際生效的 `extended-stable` 頻道合併使用，因為該頻道強制要求經驗證的精確目標。對於其他套件安裝，`main` 會對應至 `github:openclaw/openclaw#main`；GitHub/git 來源規格會先封裝成暫存 tarball，再進行分階段的全域 npm 安裝。 |
| `--dry-run`                                      | 預覽規劃的動作（頻道/標籤/目標/重新啟動流程），而不寫入設定、安裝、同步外掛或重新啟動。                                                                                                                                                                                                                |
| `--json`                                         | 輸出機器可讀的 `UpdateRunResult` JSON。當受管理的外掛需要修復時，會包含 `postUpdate.plugins.warnings`、beta 頻道外掛的後備詳細資料，以及在更新後同步期間偵測到 npm 外掛成品漂移時的 `postUpdate.plugins.integrityDrifts`。                                                                 |
| `--timeout <seconds>`                            | 每個步驟的逾時時間。預設為 `1800`。                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | 略過確認提示（例如降級確認）。                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | 允許更新後的外掛同步在沒有互動式提示的情況下，略過社群 ClawHub 信任警告並繼續執行。若未指定此旗標，當 OpenClaw 無法顯示提示時，會略過有風險的社群版本並維持不變。官方 ClawHub 套件和隨附的外掛來源不受此提示限制。                                                     |

沒有 `--verbose` 旗標。請使用 `--dry-run` 預覽規劃的動作、
使用 `--json` 取得機器可讀的結果，以及使用 `openclaw update status --json`
僅查看頻道/可用性。閘道主控台詳細程度（`--verbose`）和
檔案記錄層級（`logging.level: "debug"`/`"trace"`）是彼此獨立的控制項；請參閱
[閘道記錄](/zh-TW/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，會停用會進行變更的 `openclaw update` 執行。請改為更新此安裝的 Nix 來源或 flake 輸入；若使用 nix-openclaw，請參閱以代理程式優先的[快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍為唯讀。
</Note>

<Warning>
降級需要確認，因為較舊的版本可能會破壞設定。
如果此安裝已將工作階段移轉至 SQLite，請先還原已封存的舊版
文字記錄成品，再啟動以檔案為後端的舊版本。請參閱
[Doctor：工作階段移轉至 SQLite 後進行降級](/zh-TW/cli/doctor#downgrading-after-session-sqlite-migration)。
</Warning>

## `update status`

顯示目前使用的更新頻道、git 標籤/分支/SHA（僅限原始碼簽出），
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
和精確套件驗證。當已安裝的版本較新時，它可以回報
`ahead of extended-stable`。JSON 失敗結果會包含
`registry.reason`（`selector_missing`、`selector_query_failed`、
`exact_package_mismatch` 或 `unsupported_git_channel`）。

## `update repair`

當核心套件已經變更，但後續修復工作未順利完成時，
重新執行更新的最終處理。若 `openclaw update` 已安裝新的核心套件，
但核心更新後的外掛同步、受管理的 npm 外掛中繼資料、登錄檔重新整理或 Doctor 修復
未能收斂，這是受支援的復原方式。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| 旗標                                             | 說明                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | 在修復前保留核心更新頻道。對於 extended-stable，遵循裸值/預設或 `latest` 意圖的合格官方 npm 外掛，會以已安裝的精確核心版本為目標。在 Git 簽出中會拒絕 extended-stable 修復，且不會變更設定。 |
| `--json`                                         | 輸出機器可讀的最終處理 JSON。                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | 修復步驟的逾時時間。預設為 `1800`。                                                                                                                                                                                                                           |
| `--yes`                                          | 略過確認提示。                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | 行為與 `openclaw update` 相同。                                                                                                                                                                                                                              |
| `--no-restart`                                   | 為保持一致性而接受；修復絕不會重新啟動閘道。                                                                                                                                                                                                             |

`update repair` 會執行 `openclaw doctor --fix`、重新載入已修復的設定和
安裝記錄、針對目前使用的更新頻道同步追蹤中的外掛、更新
受管理的 npm 外掛安裝、修復缺少的已設定外掛承載內容、
重新整理外掛登錄檔，並寫入已收斂的安裝記錄中繼資料。
它不會安裝新的核心套件，也不會重新啟動閘道。

## `update wizard`

互動式流程，用於選擇更新頻道，並確認之後是否要重新啟動
閘道（預設為重新啟動）。在沒有 git 簽出的情況下選擇 `dev`
時，會詢問是否建立一個。

| 旗標                  | 預設值 | 說明                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | 每個更新步驟的逾時時間。 |

## 功能說明

明確切換頻道（`--channel ...`）也會讓安裝方式
保持一致：

- `dev` -> 確保存在 git 簽出（預設為 `~/openclaw`，或在
  設定 `OPENCLAW_HOME` 時使用 `$OPENCLAW_HOME/openclaw`；可透過
  `OPENCLAW_GIT_DIR` 覆寫）、進行更新，並從該
  簽出安裝全域命令列介面。
- `stable` -> 使用 `latest` 從 npm 安裝。
- `extended-stable` -> 解析公開的 npm `extended-stable` 選擇器、
  驗證精確選取的套件，並安裝該精確版本。它
  不會後備至其他選擇器，且不允許用於 Git 簽出。
- `beta` -> 優先使用 npm dist-tag `beta`；當 beta
  不存在或比目前的穩定版本更舊時，則後備至 `latest`。

### 重新啟動移交

閘道核心自動更新程式（透過設定啟用時）會在即時閘道
要求處理常式之外啟動命令列介面更新路徑。控制平面的
`update.run` 套件管理器更新，以及受監管的 git 簽出更新，
會使用相同的受管理服務移交方式，而不是在即時閘道程序內
取代套件樹或重建 `dist/`：閘道會啟動一個
中斷連結的輔助程式並結束，該輔助程式則從閘道程序樹之外執行
`openclaw update --yes --json`。如果無法使用移交機制，
`update.run` 會傳回結構化回應，其中包含可安全手動執行的 shell 指令。

已儲存的延伸穩定版選擇，在啟用 `update.checkOnStart` 時，會收到唯讀的啟動與每 24 小時一次的更新
提示。這些檢查絕不會套用更新、
啟動交接、重新啟動閘道、使用穩定版的延遲／抖動，或使用 Beta 版的
輪詢頻率。明確的前景更新、使用已儲存
`update.channel: "extended-stable"` 的無參數前景更新、隨選狀態，以及其受管理的
閘道交接仍受支援。

當本機已安裝受管理的閘道服務且已啟用重新啟動時，
套件管理員與 Git 工作目錄更新會先停止執行中的服務，再
取代套件樹或修改工作目錄／建置輸出。接著，更新程式會
重新整理服務中繼資料、重新啟動服務，並驗證
重新啟動的閘道，之後才回報 `Gateway: restarted and verified.`。
套件管理員更新還會驗證重新啟動的閘道是否回報
預期的套件版本；Git 工作目錄更新則會在重新建置後驗證閘道健康狀態與
服務就緒狀態。

套件管理員更新通常會繼續使用受管理服務所記錄的 Node
執行檔。如果該 Node 無法執行目標版本，但目前
命令列介面的 Node 可以，而且已證實該服務屬於正在更新的套件，
已啟用重新啟動的更新就會使用目前的 Node 完成作業，並將
服務中繼資料改寫為該執行環境。`--no-restart` 無法修復服務
中繼資料，因此相同的執行環境不相符問題會在修改套件前停止作業。

在 macOS 上，更新後檢查還會驗證 LaunchAgent 是否已針對
使用中的設定檔載入／執行，以及已設定的回送連接埠是否
健康。如果 plist 已安裝，但 launchd 未監管它，OpenClaw
會自動重新引導 LaunchAgent，並重新執行健康狀態／版本／
頻道就緒檢查（全新引導會直接載入 `RunAtLoad` 工作，
因此復原不會立即 `kickstart -k` 新產生的閘道）。如果
閘道仍未恢復健康，命令會以非零狀態結束，並
列印重新啟動記錄路徑，以及重新啟動、重新安裝與套件回復
指示。

如果無法執行重新啟動，命令會列印 `Gateway: restart skipped (...)` 或
`Gateway: restart failed: ...`，並附上手動執行 `openclaw gateway restart` 的提示。
使用 `--no-restart` 時，仍會執行套件取代或 Git 重新建置，但
不會停止或重新啟動受管理服務，因此執行中的閘道會繼續使用舊
程式碼，直到你手動重新啟動為止。

### 控制平面回應格式

當 `update.run` 在套件管理員
安裝或受監管的 Git 工作目錄上透過閘道控制平面執行時，處理常式會將交接啟動
與閘道結束後繼續執行的命令列介面更新分別回報：

- `ok: true`、`result.status: "skipped"`、
  `result.reason: "managed-service-handoff-started"` 與
  `handoff.status: "started"`：閘道已建立受管理服務交接，
  並排定自身重新啟動，讓分離的輔助程式可在
  執行中的服務程序外執行 `openclaw update --yes --json`。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"` 與
  `handoff.status: "unavailable"`：OpenClaw 找不到可供安全交接使用的
  監管服務邊界與持久服務身分（例如，
  systemd 交接需要 `OPENCLAW_SYSTEMD_UNIT` 單元身分，
  不能只有環境中的 systemd 程序標記）。回應包含
  `handoff.command`，也就是要從閘道外部執行的 Shell 命令。
- `ok: false`、`result.reason: "managed-service-handoff-failed"`：閘道
  嘗試建立交接，但無法產生分離的輔助程式。

`sentinel` 承載內容會在閘道結束前寫入，而命令列介面
交接會在受管理服務重新啟動的健康檢查完成後，更新同一個重新啟動哨兵。
交接期間，哨兵可能帶有
`stats.reason: "restart-health-pending"`，但沒有成功後續動作；
重新啟動的閘道會輪詢它，而且只有在命令列介面已
驗證服務健康狀態，並以最終的 `ok` 結果改寫哨兵後，
才會觸發後續動作。
當該哨兵處於待處理或失敗狀態時，`openclaw status` 與 `openclaw status --all` 會顯示 `Update restart` 列，
而 `update.status` 會重新整理並
傳回最新的哨兵。

## Git 工作目錄流程

### 頻道選擇

- `stable`：簽出最新的非 Beta 標籤，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` 標籤；若 Beta 不存在或較舊，
  則退回最新的穩定版標籤。
- `dev`：簽出 `main`，然後擷取並重定基底。
- `extended-stable`：Git 工作目錄不支援；不會修改工作目錄。

### 更新步驟

<Steps>
  <Step title="驗證工作目錄乾淨">
    不得有未提交的變更。
  </Step>
  <Step title="切換頻道">
    切換至選定的頻道（標籤或分支）。
  </Step>
  <Step title="擷取上游">
    僅限開發版。
  </Step>
  <Step title="建置預檢（僅限開發版）">
    在暫存工作目錄中執行 TypeScript 建置。如果頂端提交失敗，會向前回溯最多 10 個提交，以找出最新且可建置的提交。設定 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 可在此預檢期間一併執行 lint；lint 會以受限的循序模式執行，因為使用者的更新主機通常比 CI 執行器規格更低。
  </Step>
  <Step title="重定基底">
    重定基底至選定的提交（僅限開發版）。
  </Step>
  <Step title="安裝相依套件">
    使用儲存庫的套件管理員。對於 pnpm 工作目錄，更新程式會視需要引導 `pnpm`（先透過 `corepack`，再使用暫時的 `npm install pnpm@11` 備援），而不是在 pnpm 工作區內執行 `npm run build`。如果 pnpm 引導仍然失敗，更新程式會提早停止並顯示套件管理員專屬錯誤，而不會嘗試在工作目錄中執行 `npm run build`。
  </Step>
  <Step title="建置控制介面">
    建置閘道與控制介面。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="同步外掛">
    將外掛同步至使用中的頻道。開發版使用隨附外掛；穩定版與 Beta 版使用 npm。更新受追蹤的外掛安裝項目。
  </Step>
</Steps>

### 外掛同步詳細資訊

在 Beta 頻道上，遵循預設／最新版本線的受追蹤 npm 與 ClawHub 外掛安裝項目，
會先嘗試外掛的 `@beta` 版本。如果外掛沒有
Beta 版本，OpenClaw 會退回已記錄的預設／最新規格，並
回報警告。對 npm 外掛而言，如果 Beta
套件存在但未通過安裝驗證，OpenClaw 也會退回。這些退回警告不會
使核心更新失敗。絕不會改寫確切版本與明確標籤。

<Warning>
如果確切鎖定的 npm 外掛更新解析到的成品，其完整性與已儲存的安裝記錄不同，`openclaw update` 會中止該外掛成品更新，而不予安裝。只有在驗證你信任新成品後，才可明確重新安裝或更新該外掛。
</Warning>

<Note>
如果更新後的外掛同步失敗僅限於受管理的外掛，且同步路徑可繞過該問題（例如非必要外掛的 npm 登錄檔無法連線），核心更新成功後會將其回報為警告。JSON 結果會保留頂層更新 `status: "ok"`，並回報 `postUpdate.plugins.status: "warning"`，其中包含 `openclaw update repair` 與 `openclaw plugins inspect <id> --runtime --json` 指引。未預期的更新程式或同步例外仍會使更新結果失敗。修正外掛安裝或更新錯誤後，再重新執行 `openclaw update repair`。當失敗的更新導致受管理外掛無法使用時，OpenClaw 會停用其執行環境項目，並重設使用中的槽位，而不變更操作人員撰寫的 `plugins.allow` 或 `plugins.deny` 原則。

完成各外掛同步步驟後，`openclaw update` 會在閘道重新啟動前執行強制的**核心後收斂**階段：它會修復遺失的已設定外掛承載內容、驗證磁碟上每筆_使用中_的受追蹤安裝記錄，並以靜態方式驗證其 `package.json` 可剖析（以及任何明確宣告的 `main` 均存在）。此階段的失敗與無效的設定快照會傳回 `postUpdate.plugins.status: "error"`，並將頂層更新 `status` 變更為 `"error"`，因此 `openclaw update` 會以非零狀態結束，且閘道_不會_使用未驗證的外掛集合重新啟動。錯誤包含指向 `openclaw update repair` 與 `openclaw plugins inspect <id> --runtime --json` 的結構化 `postUpdate.plugins.warnings[].guidance` 行。此處會略過已停用的外掛項目，以及並非以受信任來源連結之官方同步目標的記錄（與遺失承載內容檢查所使用的 `skipDisabledPlugins` 原則一致），因此過時的已停用外掛記錄不會阻擋原本有效的更新。

更新後的閘道啟動時，外掛載入僅進行驗證：啟動不會執行套件管理員或修改相依套件樹。套件管理員 `update.run` 重新啟動會交由命令列介面的受管理服務路徑處理，因此套件交換會在舊閘道程序外進行，而服務健康檢查會決定是否可將更新回報為完成。
</Note>

延伸穩定版核心更新成功後，核心後外掛完整性與
收斂會以確切的已安裝核心版本為目標，處理符合資格的官方 npm 外掛。
對於預設／`latest` 意圖，OpenClaw 不會查詢外掛
`@extended-stable`，也不會退回 npm `latest`；它會從已安裝的核心推導套件版本。
明確的版本鎖定、明確的非 `latest` 標籤、
第三方套件與非 npm 來源會保留其現有意圖。

對於套件管理員安裝，`openclaw update` 會先解析目標套件
版本，再叫用套件管理員。npm 全域安裝會使用分階段
安裝：OpenClaw 將新套件安裝至暫存 npm 前綴，
讓候選套件在 `preinstall` 期間驗證主機 Node 版本，
並在該處驗證已封裝的 `dist` 清單。封裝完成防護會
保留在該清單之外，直到 `preinstall` 成功，因此略過生命週期指令碼的
套件管理員也會在啟用前停止。在 npm 12 及更新版本上，
更新程式只會核准候選 OpenClaw 的生命週期；遞移
相依套件指令碼仍會被封鎖。接著，OpenClaw 會將乾淨的套件樹交換至
實際的全域前綴。如果驗證失敗，更新後 doctor、外掛
同步與重新啟動作業都不會從可疑的套件樹執行。即使
已安裝版本已符合目標，命令仍會重新整理
全域套件安裝，然後執行外掛同步、核心命令自動完成
重新整理與重新啟動作業。這可讓已封裝的附屬元件與頻道所擁有的
外掛記錄和已安裝的 OpenClaw 組建保持一致，同時將完整的
外掛命令自動完成重建留給明確的
`openclaw completion --write-state` 執行。

## 相關內容

- `openclaw doctor`（在 Git 工作目錄上會先提議執行更新）
- [開發頻道](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [命令列介面參考](/zh-TW/cli)
