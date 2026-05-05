---
read_when:
    - 您想安全地更新原始碼簽出目錄
    - 你正在偵錯 `openclaw update` 的輸出或選項
    - 你需要了解 `--update` 的簡寫行為
summary: '`openclaw update` 的 CLI 參考（相對安全的原始碼更新 + Gateway 自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-05-05T01:45:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全地更新 OpenClaw，並在 stable/beta/dev 通道之間切換。

如果你是透過 **npm/pnpm/bun** 安裝（全域安裝，沒有 git 中繼資料），
更新會透過 [更新](/zh-TW/install/updating) 中的套件管理器流程進行。

## 用法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## 選項

- `--no-restart`：成功更新後略過重新啟動 Gateway 服務。會重新啟動 Gateway 的套件管理器更新，會先驗證重新啟動的服務回報預期的更新版本，命令才會成功。
- `--channel <stable|beta|dev>`：設定更新通道（git + npm；會持久化到設定）。
- `--tag <dist-tag|version|spec>`：僅針對這次更新覆寫套件目標。對於套件安裝，`main` 會對應到 `github:openclaw/openclaw#main`。
- `--dry-run`：預覽預計的更新動作（通道/標籤/目標/重新啟動流程），不寫入設定、不安裝、不同步 plugins，也不重新啟動。
- `--json`：列印機器可讀的 `UpdateRunResult` JSON，包括
  在更新後 plugin 同步期間偵測到 npm plugin 成品漂移時的
  `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每個步驟的逾時時間（預設為 1800 秒）。
- `--yes`：略過確認提示（例如降級確認）。

`openclaw update` 沒有 `--verbose` 旗標。使用 `--dry-run` 預覽
預計的通道/標籤/安裝/重新啟動動作，使用 `--json` 取得機器可讀的
結果；如果你只需要通道與可用性詳細資料，請使用
`openclaw update status --json`。如果你正在除錯更新前後的 Gateway 記錄，
主控台詳細程度與檔案記錄層級是分開的：Gateway `--verbose` 會影響
終端機/WebSocket 輸出，而檔案記錄需要在設定中使用 `logging.level: "debug"` 或
`"trace"`。請參閱 [Gateway 記錄](/zh-TW/gateway/logging)。

<Warning>
降級需要確認，因為較舊版本可能會破壞設定。
</Warning>

## `update status`

顯示目前作用中的更新通道 + git 標籤/分支/SHA（對原始碼 checkout 而言），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

選項：

- `--json`：列印機器可讀的狀態 JSON。
- `--timeout <seconds>`：檢查的逾時時間（預設為 3 秒）。

## `update wizard`

互動式流程，用於選擇更新通道，並確認更新後是否要重新啟動 Gateway
（預設會重新啟動）。如果你選擇 `dev` 但沒有 git checkout，它會
提議建立一個。

選項：

- `--timeout <seconds>`：每個更新步驟的逾時時間（預設 `1800`）

## 它會做什麼

當你明確切換通道（`--channel ...`）時，OpenClaw 也會讓
安裝方式保持一致：

- `dev` → 確保有 git checkout（預設：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆寫），
  更新它，並從該 checkout 安裝全域 CLI。
- `stable` → 使用 `latest` 從 npm 安裝。
- `beta` → 優先使用 npm dist-tag `beta`，但當 beta
  缺失或比目前 stable 發行版本更舊時，會回退到 `latest`。

Gateway 核心自動更新器（透過設定啟用時）會在即時 Gateway 請求處理常式之外
啟動 CLI 更新路徑。控制平面 `update.run` 套件管理器更新會在套件替換後
強制進行非延後、無冷卻時間的更新重新啟動，
因為舊的 Gateway 程序可能仍有記憶體中的區塊指向
新套件已移除的檔案。

對於套件管理器安裝，`openclaw update` 會在呼叫套件管理器之前解析目標套件
版本。npm 全域安裝會使用分段安裝：OpenClaw 會把新套件安裝到暫存 npm 前綴，
在其中驗證已封裝的 `dist` 清單，然後把該乾淨的套件樹替換到
真正的全域前綴。如果驗證失敗，更新後 doctor、plugin 同步與
重新啟動工作不會從可疑的樹執行。即使已安裝版本已經符合目標，
此命令也會重新整理全域套件安裝，
然後執行 plugin 同步、核心命令補全重新整理與重新啟動工作。這會讓
已封裝的 sidecar 與通道擁有的 plugin 記錄和已安裝的 OpenClaw 建置保持一致，
同時把完整的 plugin 命令補全重建留給
明確的 `openclaw completion --write-state` 執行。

當已安裝本機受管理的 Gateway 服務且已啟用重新啟動時，
套件管理器更新會先停止執行中的服務，再替換套件
樹，然後從更新後的安裝重新整理服務中繼資料，重新啟動
服務，並在回報成功前驗證重新啟動的 Gateway 回報預期版本。
在 macOS 上，更新後檢查也會驗證 LaunchAgent
已針對作用中的設定檔載入/執行，且設定的迴路連接埠
健康。如果 plist 已安裝但 launchd 未監督它，OpenClaw
會自動重新 bootstrap LaunchAgent，然後重新執行
健康/版本/通道就緒檢查。全新的 bootstrap 會直接載入 RunAtLoad
作業，因此更新復原不會立即對新產生的 Gateway 執行 `kickstart -k`。
如果 Gateway 仍然無法變得健康，命令會以非零狀態結束，
並列印重新啟動記錄路徑，以及明確的重新啟動、重新安裝與
套件回復指示。使用 `--no-restart` 時，
套件替換仍會執行，但受管理服務不會被停止或
重新啟動，因此執行中的 Gateway 可能會保留舊程式碼，直到你手動重新啟動它。

## Git checkout 流程

### 通道選擇

- `stable`：checkout 最新的非 beta 標籤，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` 標籤，但當 beta 缺失或較舊時，會回退到最新的 stable 標籤。
- `dev`：checkout `main`，然後 fetch 並 rebase。

### 更新步驟

<Steps>
  <Step title="驗證乾淨的 worktree">
    要求沒有未提交的變更。
  </Step>
  <Step title="切換通道">
    切換到所選通道（標籤或分支）。
  </Step>
  <Step title="Fetch upstream">
    僅限 dev。
  </Step>
  <Step title="預檢建置（僅限 dev）">
    在暫存 worktree 中執行 lint 與 TypeScript 建置。如果 tip 失敗，會往回最多 10 個 commit，以尋找最新的乾淨建置。
  </Step>
  <Step title="Rebase">
    Rebase 到所選 commit（僅限 dev）。
  </Step>
  <Step title="安裝相依套件">
    使用 repo 套件管理器。對於 pnpm checkout，更新器會按需 bootstrap `pnpm`（先透過 `corepack`，再使用暫時的 `npm install pnpm@10` 回退），而不是在 pnpm workspace 內執行 `npm run build`。
  </Step>
  <Step title="建置 Control UI">
    建置 gateway 與 Control UI。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最終安全更新檢查執行。
  </Step>
  <Step title="同步 plugins">
    將 plugins 同步到作用中的通道。Dev 使用隨附 plugins；stable 與 beta 使用 npm。更新已追蹤的 plugin 安裝。
  </Step>
</Steps>

在 beta 更新通道上，遵循預設/latest 線的已追蹤 npm 與 ClawHub plugin 安裝
會先嘗試 plugin `@beta` 發行版本。如果 plugin 沒有
beta 發行版本，OpenClaw 會回退到已記錄的預設/latest 規格。對於 npm
plugins，當 beta 套件存在但安裝驗證失敗時，OpenClaw 也會回退。
精確版本與明確標籤不會被改寫。

<Warning>
如果精確釘選的 npm plugin 更新解析到的成品，其完整性與儲存的安裝記錄不同，`openclaw update` 會中止該 plugin 成品更新，而不是安裝它。只有在驗證你信任新成品後，才明確重新安裝或更新該 plugin。
</Warning>

<Note>
更新後 plugin 同步失敗會讓更新結果失敗，並停止後續重新啟動工作。請修正 plugin 安裝或更新錯誤，然後重新執行 `openclaw update`。

當更新後的 Gateway 啟動時，plugin 載入只會進行驗證：啟動不會執行套件管理器，也不會變更相依樹。套件管理器 `update.run` 重新啟動會在套件樹已替換後，略過一般閒置延後與重新啟動冷卻時間，因此舊程序無法繼續 lazy-load 已移除的區塊。

如果 pnpm bootstrap 仍然失敗，更新器會提早停止並顯示套件管理器特定錯誤，而不是嘗試在 checkout 內執行 `npm run build`。
</Note>

## `--update` 簡寫

`openclaw --update` 會改寫為 `openclaw update`（對 shell 與 launcher 指令碼很有用）。

## 相關

- `openclaw doctor`（在 git checkout 上會提議先執行 update）
- [開發通道](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [CLI 參考](/zh-TW/cli)
