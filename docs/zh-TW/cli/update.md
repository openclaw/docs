---
read_when:
    - 你想要安全地更新原始碼工作副本
    - 您正在偵錯 `openclaw update` 的輸出或選項
    - 你需要了解 `--update` 簡寫行為
summary: '`openclaw update` 的 CLI 參考（較安全的來源更新 + Gateway 自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-05-06T17:55:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全地更新 OpenClaw，並在穩定版／Beta／開發版通道之間切換。

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

- `--no-restart`：成功更新後略過重新啟動 Gateway 服務。會重新啟動 Gateway 的套件管理器更新，會在命令成功前確認重新啟動的服務回報預期的已更新版本。
- `--channel <stable|beta|dev>`：設定更新通道（git + npm；會保存到設定中）。
- `--tag <dist-tag|version|spec>`：僅針對本次更新覆寫套件目標。對於套件安裝，`main` 會對應到 `github:openclaw/openclaw#main`。
- `--dry-run`：預覽規劃的更新動作（通道／標籤／目標／重新啟動流程），不寫入設定、安裝、同步 plugins 或重新啟動。
- `--json`：輸出機器可讀的 `UpdateRunResult` JSON，包括核心更新成功後有損毀或無法卸載的受管理 plugins 需要修復時的
  `postUpdate.plugins.warnings`，以及更新後 plugin 同步期間偵測到 npm plugin 成品漂移時的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每個步驟的逾時時間（預設為 1800s）。
- `--yes`：略過確認提示（例如降級確認）。

`openclaw update` 沒有 `--verbose` 旗標。使用 `--dry-run` 預覽
規劃的通道／標籤／安裝／重新啟動動作，使用 `--json` 取得機器可讀的
結果；如果你只需要通道與可用性詳細資訊，請使用 `openclaw update status --json`。
如果你正在偵錯更新期間的 Gateway 記錄，主控台詳細程度與檔案記錄層級是分開的：Gateway `--verbose` 會影響
終端機／WebSocket 輸出，而檔案記錄需要在設定中使用 `logging.level: "debug"` 或
`"trace"`。請參閱 [Gateway 記錄](/zh-TW/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，會修改狀態的 `openclaw update` 執行會被停用。請改為更新此安裝的 Nix 來源或 flake 輸入；對於 nix-openclaw，請使用代理優先的 [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍維持唯讀。
</Note>

<Warning>
降級需要確認，因為較舊版本可能會破壞設定。
</Warning>

## `update status`

顯示作用中的更新通道 + git 標籤／分支／SHA（適用於原始碼 checkout），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

選項：

- `--json`：輸出機器可讀的狀態 JSON。
- `--timeout <seconds>`：檢查逾時時間（預設為 3s）。

## `update wizard`

互動式流程，用來選擇更新通道，並確認更新後是否重新啟動 Gateway
（預設會重新啟動）。如果你選擇 `dev` 但沒有 git checkout，它會
提出建立一個。

選項：

- `--timeout <seconds>`：每個更新步驟的逾時時間（預設 `1800`）

## 它會做什麼

當你明確切換通道（`--channel ...`）時，OpenClaw 也會讓
安裝方式保持一致：

- `dev` → 確保有 git checkout（預設：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆寫），
  更新它，並從該 checkout 安裝全域 CLI。
- `stable` → 使用 `latest` 從 npm 安裝。
- `beta` → 優先使用 npm dist-tag `beta`，但當 beta
  缺失或比目前穩定版更舊時，會退回到 `latest`。

Gateway 核心自動更新器（透過設定啟用時）會在即時 Gateway 請求處理器
之外啟動 CLI 更新路徑。控制平面的 `update.run` 套件管理器
更新會在套件替換後強制執行不延後、無冷卻時間的更新重新啟動，
因為舊的 Gateway 程序可能仍有指向
新套件已移除檔案的記憶體中區塊。

對於套件管理器安裝，`openclaw update` 會先解析目標套件
版本，再叫用套件管理器。npm 全域安裝會使用暫存式
安裝：OpenClaw 會將新套件安裝到暫時的 npm prefix，確認
該處封裝的 `dist` 清單，然後將乾淨的套件樹替換到
真正的全域 prefix。若驗證失敗，更新後的 doctor、plugin 同步與
重新啟動工作不會從可疑的樹執行。即使已安裝版本
已符合目標，命令仍會重新整理全域套件安裝，
接著執行 plugin 同步、核心命令 completion 重新整理，以及重新啟動工作。這
會讓封裝的 sidecar 與通道擁有的 plugin 記錄和
已安裝的 OpenClaw 建置保持一致，同時將完整的 plugin 命令 completion 重建保留給
明確執行的 `openclaw completion --write-state`。

當已安裝本機受管理 Gateway 服務且啟用重新啟動時，
套件管理器更新會先停止執行中的服務，再替換套件
樹，然後從更新後的安裝重新整理服務中繼資料、重新啟動
服務，並在回報成功前確認重新啟動的 Gateway 回報預期版本。
在 macOS 上，更新後檢查也會確認 LaunchAgent
已針對作用中的設定檔載入／執行，且設定的 loopback 連接埠
健康。如果 plist 已安裝但 launchd 未監管它，OpenClaw
會自動重新 bootstrap LaunchAgent，然後重新執行
健康狀態／版本／通道就緒檢查。全新的 bootstrap 會直接載入 RunAtLoad
工作，因此更新復原不會立即對新產生的
Gateway 執行 `kickstart -k`。如果 Gateway 仍未變得健康，命令會以
非零狀態退出，並輸出重新啟動記錄路徑，以及明確的重新啟動、重新安裝和
套件回復指示。使用 `--no-restart` 時，
套件替換仍會執行，但受管理服務不會被停止或
重新啟動，因此執行中的 Gateway 可能會持續使用舊程式碼，直到你手動重新啟動它。

## Git checkout 流程

### 通道選擇

- `stable`：checkout 最新的非 beta 標籤，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` 標籤，但當 beta 缺失或較舊時退回到最新穩定版標籤。
- `dev`：checkout `main`，然後 fetch 並 rebase。

### 更新步驟

<Steps>
  <Step title="Verify clean worktree">
    需要沒有未提交的變更。
  </Step>
  <Step title="Switch channel">
    切換到選取的通道（標籤或分支）。
  </Step>
  <Step title="Fetch upstream">
    僅限 dev。
  </Step>
  <Step title="Preflight build (dev only)">
    在暫時 worktree 中執行 TypeScript 建置。如果 tip 失敗，最多往回檢查 10 個 commit，以找出最新可建置的 commit。設定 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也會在此前置檢查期間執行 lint；lint 會以受限的序列模式執行，因為使用者的更新主機通常比 CI runner 更小。
  </Step>
  <Step title="Rebase">
    Rebase 到選取的 commit（僅限 dev）。
  </Step>
  <Step title="Install dependencies">
    使用 repo 套件管理器。對於 pnpm checkout，更新器會依需求 bootstrap `pnpm`（先透過 `corepack`，再退回使用暫時的 `npm install pnpm@10`），而不是在 pnpm workspace 內執行 `npm run build`。
  </Step>
  <Step title="Build Control UI">
    建置 gateway 與 Control UI。
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="Sync plugins">
    將 plugins 同步到作用中的通道。Dev 使用隨附 plugins；stable 和 beta 使用 npm。更新受追蹤的 plugin 安裝。
  </Step>
</Steps>

在 beta 更新通道上，追蹤預設／latest 線的 npm 與 ClawHub plugin 安裝
會先嘗試 plugin `@beta` 發行版。如果 plugin 沒有
beta 發行版，OpenClaw 會退回到記錄的預設／latest 規格。對於 npm
plugins，當 beta 套件存在但安裝
驗證失敗時，OpenClaw 也會退回。精確版本和明確標籤不會被改寫。

<Warning>
如果精確釘選的 npm plugin 更新解析到的成品完整性與儲存的安裝記錄不同，`openclaw update` 會中止該 plugin 成品更新，而不是安裝它。只有在確認你信任新的成品後，才明確重新安裝或更新該 plugin。
</Warning>

<Note>
更新後 plugin 同步失敗若範圍限於受管理 plugin，會在核心更新成功後以警告回報。JSON 結果會保留頂層更新 `status: "ok"`，並回報 `postUpdate.plugins.status: "warning"`，附上 `openclaw doctor --fix` 和 `openclaw plugins inspect <id> --runtime --json` 指引。非預期的更新器或同步例外仍會讓更新結果失敗。修復 plugin 安裝或更新錯誤後，重新執行 `openclaw doctor --fix` 或 `openclaw update`。

更新後的 Gateway 啟動時，plugin 載入僅做驗證：啟動不會執行套件管理器，也不會修改依賴樹。套件管理器 `update.run` 重新啟動會在套件樹已替換後，繞過一般閒置延後與重新啟動冷卻時間，因此舊程序無法繼續 lazy-load 已移除的區塊。

如果 pnpm bootstrap 仍然失敗，更新器會提早停止並顯示套件管理器專屬錯誤，而不是嘗試在 checkout 內執行 `npm run build`。
</Note>

## `--update` 簡寫

`openclaw --update` 會改寫為 `openclaw update`（對 shell 和啟動器 scripts 很有用）。

## 相關

- `openclaw doctor`（在 git checkout 上會提出先執行更新）
- [開發通道](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [CLI 參考](/zh-TW/cli)
