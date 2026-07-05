---
read_when:
    - 你想要安全地更新來源簽出
    - 您正在偵錯 `openclaw update` 輸出或選項
    - 你需要了解 `--update` 簡寫行為
summary: '`openclaw update` 的命令列介面參考（相對安全的來源更新 + 閘道自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-07-05T01:56:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe972cf9effb9df8846ab9b3da662350dcc965ff2e58a8d5dabf1fd42be88b4
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全更新 OpenClaw，並在 stable/extended-stable/beta/dev 通道之間切換。

如果你是透過 **npm/pnpm/bun** 安裝（全域安裝，沒有 git 中繼資料），
更新會透過 [更新](/zh-TW/install/updating) 中的套件管理器流程進行。

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

## 選項

- `--no-restart`：成功更新後略過重新啟動閘道服務。會重新啟動閘道的套件管理器更新，會先確認重新啟動後的服務回報預期的更新版本，命令才會成功。
- `--channel <stable|extended-stable|beta|dev>`：設定更新通道，並在核心更新成功後保留該設定。Extended-stable 僅適用於套件。
- `--tag <dist-tag|version|spec>`：僅針對這次更新覆寫套件目標。它不能與有效的 `extended-stable` 通道搭配使用，因為該通道必須使用已驗證的精確目標。對於其他套件安裝，`main` 會對應到 `github:openclaw/openclaw#main`；GitHub/git 原始碼規格會先打包成暫存 tarball，再進行分階段的全域 npm 安裝。
- `--dry-run`：預覽規劃的更新動作（通道/標籤/目標/重新啟動流程），但不寫入設定、不安裝、不同步外掛，也不重新啟動。
- `--json`：列印機器可讀的 `UpdateRunResult` JSON，包括核心更新成功後有損毀或無法載入的受管理外掛需要修復時的 `postUpdate.plugins.warnings`、外掛沒有 beta 發行版時的 beta 通道外掛後備詳細資訊，以及更新後外掛同步期間偵測到 npm 外掛成品漂移時的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每個步驟的逾時時間（預設為 1800 秒）。
- `--yes`：略過確認提示（例如降級確認）。
- `--acknowledge-clawhub-risk`：在檢閱社群 ClawHub 信任警告後，允許更新後外掛同步在沒有互動提示的情況下繼續。若未使用此選項，當 OpenClaw 無法提示時，有風險的社群 ClawHub 外掛發行版會被略過並維持不變。官方 ClawHub 套件和隨附的 OpenClaw 外掛來源會略過此發行信任提示。

`openclaw update` 沒有 `--verbose` 旗標。使用 `--dry-run` 預覽規劃的通道/標籤/安裝/重新啟動動作，使用 `--json` 取得機器可讀的結果；如果你只需要通道和可用性詳細資訊，請使用 `openclaw update status --json`。如果你正在除錯更新期間的閘道記錄，主控台詳細程度和檔案記錄層級是分開的：閘道 `--verbose` 會影響終端機/WebSocket 輸出，而檔案記錄需要在設定中使用 `logging.level: "debug"` 或 `"trace"`。請參閱[閘道記錄](/zh-TW/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，會變更狀態的 `openclaw update` 執行已停用。請改為更新此安裝的 Nix 來源或 flake 輸入；若使用 nix-openclaw，請使用 agent-first [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍維持唯讀。
</Note>

<Warning>
降級需要確認，因為較舊版本可能會破壞設定。
</Warning>

## `update status`

顯示作用中的更新通道與 git 標籤/分支/SHA（針對原始碼 checkout），以及更新可用性。

對於 extended-stable 套件安裝，status 會執行與前景更新相同的公開選擇器和精確套件驗證。當已安裝版本較新時，它可以回報 `ahead of extended-stable`。JSON 失敗會包含 `registry.reason`（`selector_missing`、`selector_query_failed`、`exact_package_mismatch` 或 `unsupported_git_channel`）。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

選項：

- `--json`：列印機器可讀的狀態 JSON。
- `--timeout <seconds>`：檢查逾時時間（預設為 3 秒）。

## `update repair`

在核心套件已經變更、但後續修復工作未能乾淨完成時，重新執行更新收尾。當 `openclaw update` 已安裝新的核心套件，但核心後外掛同步、受管理 npm 外掛中繼資料、登錄重新整理或 doctor 修復仍需收斂時，這是受支援的復原路徑。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

選項：

- `--channel <stable|extended-stable|beta|dev>`：在修復前保留核心更新通道。對於 extended-stable，外掛收斂會暫時以 stable/latest 外掛線為目標。在 Git checkout 上會拒絕 extended-stable 修復，且不會變更設定。
- `--json`：列印機器可讀的收尾 JSON。
- `--timeout <seconds>`：修復步驟的逾時時間（預設 `1800`）。
- `--yes`：略過確認提示。
- `--acknowledge-clawhub-risk`：在檢閱社群 ClawHub 信任警告後，允許修復期間的外掛收斂在沒有互動提示的情況下繼續。官方 ClawHub 套件和隨附的 OpenClaw 外掛來源會略過此發行信任提示。
- `--no-restart`：為了與 update 命令一致而接受；repair 永遠不會重新啟動閘道。

`openclaw update repair` 會執行 `openclaw doctor --fix`、重新載入修復後的設定和安裝記錄、同步作用中更新通道的追蹤外掛、更新受管理的 npm 外掛安裝、修復缺失的已設定外掛 payload、重新整理外掛登錄，並寫入收斂後的安裝記錄中繼資料。它不會安裝新的核心套件，也不會重新啟動閘道。

## `update wizard`

互動式流程，用於選擇更新通道，並確認更新後是否重新啟動閘道（預設會重新啟動）。如果你在沒有 git checkout 的情況下選取 `dev`，它會詢問是否建立一個 checkout。

選項：

- `--timeout <seconds>`：每個更新步驟的逾時時間（預設 `1800`）

## 它會做什麼

當你明確切換通道（`--channel ...`）時，OpenClaw 也會讓安裝方式保持一致：

- `dev` → 確保存在 git checkout（預設：`~/openclaw`，或設定 `OPENCLAW_HOME` 時的 `$OPENCLAW_HOME/openclaw`；可用 `OPENCLAW_GIT_DIR` 覆寫）、更新它，並從該 checkout 安裝全域命令列介面。
- `stable` → 使用 `latest` 從 npm 安裝。
- `extended-stable` → 解析公開 npm `extended-stable` 選擇器、驗證精確選取的套件，並安裝該精確版本。它不會後備到其他選擇器，且 Git checkout 會被拒絕。
- `beta` → 優先使用 npm dist-tag `beta`，但當 beta 缺失或比目前 stable 發行版更舊時，會後備到 `latest`。

閘道核心自動更新器（透過設定啟用時）會在即時閘道請求處理器之外啟動命令列介面更新路徑。控制平面的 `update.run` 套件管理器更新與受監督的 git-checkout 更新，也會使用受管理服務交接，而不是在即時閘道程序內替換套件樹或重建 `dist/`。閘道會啟動一個分離的 helper、退出，然後該 helper 會從閘道程序樹之外執行一般的 `openclaw update --yes --json` 命令列介面路徑。如果該交接不可用，`update.run` 會回傳結構化回應，其中包含可手動執行的安全 shell 命令。

Extended-stable 會刻意排除於啟動檢查和背景自動更新排程之外。明確的前景更新、使用已儲存 `update.channel: "extended-stable"` 的裸前景更新、隨選狀態，以及受管理閘道交接仍受支援。

對於套件管理器安裝，`openclaw update` 會先解析目標套件版本，再叫用套件管理器。npm 全域安裝會使用分階段安裝：OpenClaw 會將新套件安裝到暫存 npm prefix，在那裡驗證封裝的 `dist` 清單，然後將該乾淨的套件樹交換到真正的全域 prefix。如果驗證失敗，更新後 doctor、外掛同步和重新啟動工作不會從可疑的套件樹執行。即使已安裝版本已符合目標，命令仍會重新整理全域套件安裝，然後執行外掛同步、核心命令完成重新整理，以及重新啟動工作。這會讓封裝的 sidecar 和通道擁有的外掛記錄與已安裝的 OpenClaw 建置保持一致，同時將完整外掛命令完成重建留給明確的 `openclaw completion --write-state` 執行。

Extended-stable 核心更新成功後，核心後外掛完整性與收斂仍會執行，但官方外掛會暫時以 stable/latest 線為目標。OpenClaw 在此發行版中不會查詢外掛 `@extended-stable` 選擇器。

當本機受管理閘道服務已安裝且重新啟動已啟用時，套件管理器和 git-checkout 更新會先停止執行中的服務，再替換套件樹或變更 checkout/建置輸出。更新器接著會從更新後的安裝重新整理服務中繼資料、重新啟動服務，並在回報 `Gateway: restarted and verified.` 前驗證重新啟動後的閘道。套件管理器更新還會驗證重新啟動後的閘道回報預期的套件版本；git-checkout 更新會在重建後驗證閘道健康狀態和服務就緒狀態。在 macOS 上，更新後檢查也會驗證 LaunchAgent 已針對作用中的設定檔載入/執行，且設定的 loopback 連接埠健康。如果 plist 已安裝但 launchd 未監督它，OpenClaw 會自動重新 bootstrap LaunchAgent，然後重新執行健康/版本/通道就緒檢查。全新的 bootstrap 會直接載入 RunAtLoad job，因此更新復原不會立即對新產生的閘道執行 `kickstart -k`。如果閘道仍未變為健康，命令會以非零狀態退出，並列印重新啟動記錄路徑，以及明確的重新啟動、重新安裝和套件回復指示。如果無法執行重新啟動，命令會列印 `Gateway: restart skipped (...)` 或 `Gateway: restart failed: ...`，並附上手動 `openclaw gateway restart` 提示。使用 `--no-restart` 時，套件替換或 git 重建仍會執行，但受管理服務不會停止或重新啟動，因此執行中的閘道可能會保留舊程式碼，直到你手動重新啟動它。

### 控制平面回應形狀

當 `update.run` 透過閘道控制平面在套件管理器安裝或受監督 git checkout 上叫用時，處理器會將交接啟動與閘道退出後繼續進行的命令列介面更新分開回報：

- `ok: true`、`result.status: "skipped"`、`result.reason: "managed-service-handoff-started"` 和 `handoff.status: "started"` 表示閘道已建立受管理服務交接，並已排程自身重新啟動，讓分離的 helper 可以在即時服務程序之外執行 `openclaw update --yes --json`。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"` 和 `handoff.status: "unavailable"` 表示 OpenClaw 找不到可用於安全交接的監督服務邊界與持久服務身分。例如，systemd 交接需要 OpenClaw unit 身分（`OPENCLAW_SYSTEMD_UNIT`），而不只是環境中的 systemd 程序標記。回應會包含 `handoff.command`，也就是要從閘道外部執行的 shell 命令。
- `ok: false`、`result.reason: "managed-service-handoff-failed"` 表示閘道嘗試建立交接，但無法產生分離的 helper。

`sentinel` 承載內容仍會在閘道結束前寫入，且命令列介面交接會在受管理服務重新啟動健康檢查完成後，更新相同的重新啟動 sentinel。在交接期間，sentinel 可以帶有 `stats.reason: "restart-health-pending"`，且沒有成功的 continuation；重新啟動後的閘道會持續輪詢它，並且只會在命令列介面驗證服務健康狀態、並以最終 `ok` 結果重寫 sentinel 後，才觸發 continuation。`openclaw status` 和 `openclaw status --all` 會在該 sentinel 待處理或失敗時顯示 `Update restart` 列，而 `update.status` 會重新整理並回傳最新的 sentinel。

## Git checkout 流程

### 通道選擇

- `stable`：checkout 最新的非 beta 標籤，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` 標籤，但當 beta 缺失或較舊時，退回使用最新的 stable 標籤。
- `dev`：checkout `main`，然後擷取並 rebase。
- `extended-stable`：Git checkout 不支援；不會發生 checkout 變更。

### 更新步驟

<Steps>
  <Step title="驗證乾淨的工作樹">
    要求沒有未提交的變更。
  </Step>
  <Step title="切換通道">
    切換到所選通道（標籤或分支）。
  </Step>
  <Step title="擷取上游">
    僅限 Dev。
  </Step>
  <Step title="預檢建置（僅限 dev）">
    在暫存工作樹中執行 TypeScript 建置。如果頂端提交失敗，會往回最多 10 個提交，以找出最新可建置的提交。設定 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也會在此預檢期間執行 lint；lint 會以受限的序列模式執行，因為使用者的更新主機通常比 CI runner 更小。
  </Step>
  <Step title="Rebase">
    Rebase 到所選提交（僅限 dev）。
  </Step>
  <Step title="安裝相依性">
    使用 repo 套件管理器。對於 pnpm checkout，更新程式會依需求啟動 `pnpm`（先透過 `corepack`，再使用暫時的 `npm install pnpm@11` fallback），而不是在 pnpm workspace 內執行 `npm run build`。
  </Step>
  <Step title="建置 Control UI">
    建置閘道和 Control UI。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最終安全更新檢查執行。
  </Step>
  <Step title="同步外掛">
    將外掛同步至作用中的通道。Dev 使用 bundled 外掛；stable 和 beta 使用 npm。更新受追蹤的外掛安裝。
  </Step>
</Steps>

在 beta 更新通道上，遵循 default/latest 線的受追蹤 npm 和 ClawHub 外掛安裝，會先嘗試外掛 `@beta` 發行版本。如果外掛沒有 beta 發行版本，OpenClaw 會退回到記錄的 default/latest 規格並回報為警告。對於 npm 外掛，當 beta 套件存在但安裝驗證失敗時，OpenClaw 也會退回。這些外掛 fallback 警告不會導致核心更新失敗。精確版本和明確標籤不會被重寫。

<Warning>
如果精確釘選的 npm 外掛更新解析到的 artifact，其 integrity 與儲存的安裝記錄不同，`openclaw update` 會中止該外掛 artifact 更新，而不是安裝它。只有在驗證你信任新的 artifact 後，才明確重新安裝或更新該外掛。
</Warning>

<Note>
更新後的外掛同步失敗，如果範圍限於受管理外掛，且同步路徑可以繞過（例如非必要外掛的 npm registry 無法連線），會在核心更新成功後回報為警告。JSON 結果會保留頂層更新 `status: "ok"`，並回報 `postUpdate.plugins.status: "warning"`，附帶 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 指引。未預期的更新程式或同步例外仍會使更新結果失敗。修正外掛安裝或更新錯誤，然後重新執行 `openclaw update repair`。

在每個外掛同步步驟之後，`openclaw update` 會在閘道重新啟動前執行強制的 **post-core convergence** 階段：它會修復缺失的已設定外掛承載內容、驗證磁碟上每個_作用中_受追蹤安裝記錄，並靜態驗證其 `package.json` 可解析（以及任何明確宣告的 `main` 存在）。此階段的失敗與無效的 OpenClaw 設定快照，會回傳 `postUpdate.plugins.status: "error"`，並將頂層更新 `status` 翻轉為 `"error"`，因此 `openclaw update` 會以非零狀態結束，且閘道_不會_以未驗證的外掛集合重新啟動。錯誤包含結構化的 `postUpdate.plugins.warnings[].guidance` 行，指向 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 以供後續處理。已停用的外掛項目，以及未連結至受信任來源之官方同步目標的記錄，會在此處略過，這與缺失承載內容檢查使用的 `skipDisabledPlugins` 政策一致，因此過時的已停用外掛記錄無法阻擋原本有效的更新。

當更新後的閘道啟動時，外掛載入僅會驗證：啟動不會執行套件管理器或變更相依性樹。套件管理器 `update.run` 重新啟動會交給命令列介面的受管理服務路徑，因此套件交換會在舊閘道程序之外發生，而服務健康檢查會決定更新是否可以回報為完成。

如果 pnpm 啟動仍然失敗，更新程式會提前停止並提供套件管理器專屬錯誤，而不是嘗試在 checkout 內執行 `npm run build`。
</Note>

## `--update` 簡寫

`openclaw --update` 會重寫為 `openclaw update`（適用於 shell 和啟動器指令碼）。

## 相關

- `openclaw doctor`（在 git checkout 上會提議先執行更新）
- [開發通道](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [命令列介面參考](/zh-TW/cli)
