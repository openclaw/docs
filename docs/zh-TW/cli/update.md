---
read_when:
    - 你想要安全地更新原始碼簽出
    - 你正在偵錯 `openclaw update` 輸出或選項
    - 你需要了解 `--update` 簡寫行為
summary: '`openclaw update` 的命令列介面參考（較安全的來源更新 + 閘道自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-06-27T19:09:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全地更新 OpenClaw，並在 stable/beta/dev 通道之間切換。

如果你是透過 **npm/pnpm/bun** 安裝（全域安裝，沒有 git 中繼資料），
更新會透過[更新](/zh-TW/install/updating)中的套件管理器流程進行。

## 用法

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
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

## 選項

- `--no-restart`：成功更新後略過重新啟動閘道服務。會重新啟動閘道的套件管理器更新，會先確認重新啟動後的服務回報預期的更新版本，命令才會成功。
- `--channel <stable|beta|dev>`：設定更新通道（git + npm；會保存在設定中）。
- `--tag <dist-tag|version|spec>`：只針對這次更新覆寫套件目標。對於套件安裝，`main` 會對應到 `github:openclaw/openclaw#main`；GitHub/git 來源規格會先打包成暫時的 tarball，再進行分階段的全域 npm 安裝。
- `--dry-run`：預覽規劃的更新動作（通道/標籤/目標/重新啟動流程），不會寫入設定、安裝、同步外掛或重新啟動。
- `--json`：列印機器可讀的 `UpdateRunResult` JSON，包括核心更新成功後，當損毀或無法載入的受管理外掛需要修復時的
  `postUpdate.plugins.warnings`、外掛沒有 beta 版時的 beta 通道外掛備援詳細資料，以及更新後外掛同步期間偵測到 npm 外掛成品漂移時的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每個步驟的逾時時間（預設為 1800 秒）。
- `--yes`：略過確認提示（例如降版確認）。
- `--acknowledge-clawhub-risk`：在檢閱社群 ClawHub 信任警告後，允許更新後外掛同步在沒有互動提示的情況下繼續。若未使用此選項，當 OpenClaw 無法提示時，有風險的社群 ClawHub 外掛發行版會被略過並保持不變。官方 ClawHub 套件和內建 OpenClaw 外掛來源會略過這個發行版信任提示。

`openclaw update` 沒有 `--verbose` 旗標。使用 `--dry-run` 預覽規劃的通道/標籤/安裝/重新啟動動作，使用 `--json` 取得機器可讀結果；如果只需要通道和可用性詳細資料，請使用 `openclaw update status --json`。如果你正在偵錯更新期間的閘道日誌，主控台詳細程度和檔案日誌等級是分開的：閘道 `--verbose` 會影響終端機/WebSocket 輸出，而檔案日誌需要在設定中使用 `logging.level: "debug"` 或 `"trace"`。請參閱[閘道日誌](/zh-TW/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，會變更狀態的 `openclaw update` 執行會被停用。請改為更新此安裝的 Nix 來源或 flake 輸入；對於 nix-openclaw，請使用以代理程式優先的[快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍維持唯讀。
</Note>

<Warning>
降版需要確認，因為較舊版本可能會破壞設定。
</Warning>

## `update status`

顯示作用中的更新通道 + git 標籤/分支/SHA（對於來源 checkout），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

選項：

- `--json`：列印機器可讀的狀態 JSON。
- `--timeout <seconds>`：檢查的逾時時間（預設為 3 秒）。

## `update repair`

在核心套件已經變更，但後續修復工作未能乾淨完成後，重新執行更新收尾。當 `openclaw update` 已安裝新的核心套件，但核心後的外掛同步、受管理 npm 外掛中繼資料、登錄檔重新整理或 doctor 修復仍需要收斂時，這是受支援的復原路徑。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

選項：

- `--channel <stable|beta|dev>`：在修復前保存更新通道，並針對該通道執行外掛收斂。
- `--json`：列印機器可讀的收尾 JSON。
- `--timeout <seconds>`：修復步驟的逾時時間（預設 `1800`）。
- `--yes`：略過確認提示。
- `--acknowledge-clawhub-risk`：在檢閱社群 ClawHub 信任警告後，允許修復期間的外掛收斂在沒有互動提示的情況下繼續。官方 ClawHub 套件和內建 OpenClaw 外掛來源會略過這個發行版信任提示。
- `--no-restart`：為了與更新命令一致而接受；修復永遠不會重新啟動閘道。

`openclaw update repair` 會執行 `openclaw doctor --fix`、重新載入已修復的設定和安裝記錄、為作用中的更新通道同步已追蹤的外掛、更新受管理的 npm 外掛安裝、修復遺失的已設定外掛承載內容、重新整理外掛登錄檔，並寫入已收斂的安裝記錄中繼資料。它不會安裝新的核心套件，也不會重新啟動閘道。

## `update wizard`

互動式流程，可選擇更新通道，並確認更新後是否要重新啟動閘道（預設會重新啟動）。如果你選擇 `dev` 但沒有 git checkout，它會提議建立一個。

選項：

- `--timeout <seconds>`：每個更新步驟的逾時時間（預設 `1800`）

## 它會做什麼

當你明確切換通道（`--channel ...`）時，OpenClaw 也會保持安裝方式一致：

- `dev` → 確保有 git checkout（預設：`~/openclaw`，或在設定 `OPENCLAW_HOME` 時使用 `$OPENCLAW_HOME/openclaw`；可用 `OPENCLAW_GIT_DIR` 覆寫），更新它，並從該 checkout 安裝全域命令列介面。
- `stable` → 使用 `latest` 從 npm 安裝。
- `beta` → 優先使用 npm dist-tag `beta`，但當 beta 缺失或比目前 stable 發行版更舊時，會退回 `latest`。

閘道核心自動更新器（透過設定啟用時）會在即時閘道請求處理常式之外啟動命令列介面更新路徑。控制平面 `update.run` 套件管理器更新和受監督的 git-checkout 更新，也會使用受管理服務交接，而不是在即時閘道程序內替換套件樹或重建 `dist/`。閘道會啟動分離的輔助程序、退出，然後輔助程序會從閘道程序樹之外執行一般的 `openclaw update --yes --json` 命令列介面路徑。如果該交接不可用，`update.run` 會回傳結構化回應，其中包含可手動執行的安全 shell 命令。

對於套件管理器安裝，`openclaw update` 會先解析目標套件版本，再呼叫套件管理器。npm 全域安裝會使用分階段安裝：OpenClaw 會將新套件安裝到暫時的 npm 前綴、在那裡驗證封裝的 `dist` 清單，然後將該乾淨的套件樹替換到實際的全域前綴。如果驗證失敗，更新後 doctor、外掛同步和重新啟動工作不會從可疑的樹執行。即使已安裝版本已符合目標，命令仍會重新整理全域套件安裝，然後執行外掛同步、核心命令補全重新整理，以及重新啟動工作。這會讓封裝的 sidecar 和通道擁有的外掛記錄與已安裝的 OpenClaw 建置保持一致，同時將完整外掛命令補全重建留給明確的 `openclaw completion --write-state` 執行。

當已安裝本機受管理閘道服務且啟用重新啟動時，套件管理器和 git-checkout 更新會先停止正在執行的服務，再替換套件樹或變更 checkout/建置輸出。更新器接著會從更新後的安裝重新整理服務中繼資料、重新啟動服務，並在回報 `Gateway: restarted and verified.` 前驗證重新啟動後的閘道。套件管理器更新還會額外確認重新啟動後的閘道回報預期的套件版本；git-checkout 更新則會在重建後驗證 gateway 健康狀態和服務就緒狀態。在 macOS 上，更新後檢查也會驗證 LaunchAgent 已針對作用中設定檔載入/執行，且設定的 loopback 連接埠健康。如果 plist 已安裝但 launchd 未監督它，OpenClaw 會自動重新 bootstrap LaunchAgent，然後重新執行健康狀態/版本/通道就緒檢查。新的 bootstrap 會直接載入 RunAtLoad 作業，因此更新復原不會立即對新產生的閘道執行 `kickstart -k`。如果閘道仍未變得健康，命令會以非零狀態結束，並列印重新啟動日誌路徑，以及明確的重新啟動、重新安裝和套件回復指示。如果無法執行重新啟動，命令會列印 `Gateway: restart skipped (...)` 或 `Gateway: restart failed: ...`，並附上手動 `openclaw gateway restart` 提示。使用 `--no-restart` 時，套件替換或 git 重建仍會執行，但受管理服務不會被停止或重新啟動，因此正在執行的閘道可能會繼續使用舊程式碼，直到你手動重新啟動它。

### 控制平面回應形狀

當透過閘道控制平面在套件管理器安裝或受監督的 git checkout 上呼叫 `update.run` 時，處理常式會將交接啟動與閘道退出後繼續進行的命令列介面更新分開回報：

- `ok: true`、`result.status: "skipped"`、`result.reason: "managed-service-handoff-started"`，以及 `handoff.status: "started"` 表示閘道已建立受管理服務交接，並排程自己的重新啟動，讓分離的輔助程序可以在即時服務程序之外執行 `openclaw update --yes --json`。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"`，以及 `handoff.status: "unavailable"` 表示 OpenClaw 找不到監督服務邊界和持久服務身分，因此無法安全交接。例如，systemd 交接需要 OpenClaw unit 身分（`OPENCLAW_SYSTEMD_UNIT`），而不只是環境中的 systemd 程序標記。回應包含 `handoff.command`，也就是要從閘道之外執行的 shell 命令。
- `ok: false`、`result.reason: "managed-service-handoff-failed"` 表示閘道嘗試建立交接，但無法產生分離的輔助程序。

`sentinel` 承載內容仍會在閘道退出前寫入，而命令列介面交接會在受管理服務重新啟動健康檢查完成後，更新同一個重新啟動 sentinel。交接期間，sentinel 可能帶有 `stats.reason: "restart-health-pending"`，且沒有成功延續；重新啟動後的閘道會持續輪詢它，並且只會在命令列介面已驗證服務健康狀態、並用最終 `ok` 結果重寫 sentinel 後，才觸發延續。`openclaw status` 和 `openclaw status --all` 會在該 sentinel 擱置或失敗時顯示 `Update restart` 列，而 `update.status` 會重新整理並回傳最新的 sentinel。

## Git checkout 流程

### 通道選擇

- `stable`：checkout 最新的非 beta 標籤，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` 標籤，但當 beta 缺失或較舊時，退回最新的 stable 標籤。
- `dev`：checkout `main`，然後 fetch 並 rebase。

### 更新步驟

<Steps>
  <Step title="驗證乾淨的工作樹">
    需要沒有未提交的變更。
  </Step>
  <Step title="切換通道">
    切換到選取的通道（標籤或分支）。
  </Step>
  <Step title="擷取上游">
    僅限開發版。
  </Step>
  <Step title="預檢建置（僅限開發版）">
    在暫存工作樹中執行 TypeScript 建置。如果尖端提交失敗，會往回最多 10 個提交，尋找最新可建置的提交。設定 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也會在此預檢期間執行 lint；lint 會以受限的序列模式執行，因為使用者更新主機通常比 CI 執行器更小。
  </Step>
  <Step title="重定基底">
    重定基底到選取的提交（僅限開發版）。
  </Step>
  <Step title="安裝相依性">
    使用儲存庫套件管理器。對於 pnpm checkout，更新器會視需要啟動 `pnpm`（先透過 `corepack`，再以暫時的 `npm install pnpm@11` 作為後備），而不是在 pnpm 工作區內執行 `npm run build`。
  </Step>
  <Step title="建置 Control UI">
    建置閘道和 Control UI。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="同步外掛">
    將外掛同步到作用中的通道。開發版使用內建外掛；穩定版與 beta 使用 npm。更新受追蹤的外掛安裝。
  </Step>
</Steps>

在 beta 更新通道上，遵循預設/最新版路線的受追蹤 npm 與 ClawHub 外掛安裝，會先嘗試外掛 `@beta` 發行版。如果外掛沒有 beta 發行版，OpenClaw 會退回到已記錄的預設/最新版規格，並將其回報為警告。對於 npm 外掛，當 beta 套件存在但安裝驗證失敗時，OpenClaw 也會退回。這些外掛後備警告不會讓核心更新失敗。精確版本與明確標籤不會被改寫。

<Warning>
如果精確釘選的 npm 外掛更新解析到的成品完整性與已儲存的安裝記錄不同，`openclaw update` 會中止該外掛成品更新，而不是安裝它。請只有在驗證你信任新的成品後，才明確重新安裝或更新該外掛。
</Warning>

<Note>
更新後外掛同步失敗若範圍限於受管理外掛，且同步路徑可以繞過（例如非必要外掛的 npm registry 無法連線），會在核心更新成功後回報為警告。JSON 結果會保留頂層更新 `status: "ok"`，並回報 `postUpdate.plugins.status: "warning"`，同時提供 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 指引。非預期的更新器或同步例外仍會讓更新結果失敗。修正外掛安裝或更新錯誤，然後重新執行 `openclaw update repair`。

每個外掛同步步驟後，`openclaw update` 會在閘道重新啟動前，執行強制性的**核心後收斂**階段：它會修復缺少的已設定外掛 payload、驗證磁碟上每個_作用中_受追蹤安裝記錄，並靜態驗證其 `package.json` 可解析（以及任何明確宣告的 `main` 存在）。此階段的失敗，以及無效的 OpenClaw 設定快照，會回傳 `postUpdate.plugins.status: "error"` 並將頂層更新 `status` 翻轉為 `"error"`，因此 `openclaw update` 會以非零狀態退出，且閘道_不會_以未驗證的外掛集合重新啟動。錯誤包含結構化的 `postUpdate.plugins.warnings[].guidance` 行，指向 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 以供後續處理。停用的外掛項目，以及未連結受信任來源的官方同步目標記錄，會在此處略過，這與缺少 payload 檢查所使用的 `skipDisabledPlugins` 政策相同，因此過時的已停用外掛記錄無法阻擋原本有效的更新。

當更新後的閘道啟動時，外掛載入僅執行驗證：啟動不會執行套件管理器或變更相依性樹。套件管理器 `update.run` 重新啟動會交給命令列介面受管理服務路徑，因此套件替換會發生在舊閘道程序之外，並由服務健康檢查決定是否可將更新回報為完成。

如果 pnpm 啟動仍然失敗，更新器會提早停止並顯示套件管理器專屬錯誤，而不是嘗試在 checkout 內執行 `npm run build`。
</Note>

## `--update` 簡寫

`openclaw --update` 會重寫為 `openclaw update`（對 shell 和啟動器指令碼很有用）。

## 相關

- `openclaw doctor`（在 git checkout 上會提議先執行更新）
- [開發通道](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [命令列介面參考](/zh-TW/cli)
