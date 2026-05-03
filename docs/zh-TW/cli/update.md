---
read_when:
    - 你想要安全地更新簽出的原始碼
    - 你正在偵錯 `openclaw update` 的輸出或選項
    - 您需要了解 `--update` 的簡寫行為
summary: '`openclaw update` 的 CLI 參考（較安全的原始碼更新 + Gateway 自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-05-03T21:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全地更新 OpenClaw，並在 stable/beta/dev 頻道之間切換。

如果你是透過 **npm/pnpm/bun** 安裝（全域安裝，沒有 git 中繼資料），
更新會透過 [Updating](/zh-TW/install/updating) 中的套件管理器流程進行。

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

- `--no-restart`：成功更新後略過重新啟動 Gateway 服務。若套件管理器更新會重新啟動 Gateway，則會在命令成功前驗證重新啟動的服務回報預期的更新版本。
- `--channel <stable|beta|dev>`：設定更新頻道（git + npm；會保存至設定）。
- `--tag <dist-tag|version|spec>`：僅針對本次更新覆寫套件目標。對於套件安裝，`main` 會對應到 `github:openclaw/openclaw#main`。
- `--dry-run`：預覽規劃的更新動作（頻道/標籤/目標/重新啟動流程），不寫入設定、不安裝、不同步 Plugin，也不重新啟動。
- `--json`：輸出機器可讀的 `UpdateRunResult` JSON，包括
  在更新後 Plugin 同步期間偵測到 npm Plugin 成品漂移時的
  `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每個步驟的逾時時間（預設為 1800s）。
- `--yes`：略過確認提示（例如降版確認）。

`openclaw update` 沒有 `--verbose` 旗標。使用 `--dry-run` 預覽
規劃的頻道/標籤/安裝/重新啟動動作，使用 `--json` 取得機器可讀的
結果；若你只需要頻道與可用性詳細資訊，請使用 `openclaw update status --json`。
如果你正在偵錯更新前後的 Gateway 日誌，
主控台詳細程度與檔案日誌層級是分開的：Gateway `--verbose` 會影響
終端機/WebSocket 輸出，而檔案日誌需要在設定中使用 `logging.level: "debug"` 或
`"trace"`。請參閱 [Gateway 日誌](/zh-TW/gateway/logging)。

<Warning>
降版需要確認，因為較舊版本可能會破壞設定。
</Warning>

## `update status`

顯示作用中的更新頻道 + git 標籤/分支/SHA（適用於來源 checkout），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

選項：

- `--json`：輸出機器可讀的狀態 JSON。
- `--timeout <seconds>`：檢查逾時時間（預設為 3s）。

## `update wizard`

互動式流程，用於選擇更新頻道，並確認更新後是否重新啟動 Gateway
（預設會重新啟動）。如果你選擇 `dev` 但沒有 git checkout，它會
提出建立一個 checkout。

選項：

- `--timeout <seconds>`：每個更新步驟的逾時時間（預設 `1800`）

## 它會做什麼

當你明確切換頻道（`--channel ...`）時，OpenClaw 也會保持
安裝方式一致：

- `dev` → 確保有 git checkout（預設：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆寫），
  更新它，並從該 checkout 安裝全域 CLI。
- `stable` → 使用 `latest` 從 npm 安裝。
- `beta` → 優先使用 npm dist-tag `beta`，但當 beta 缺失或比目前穩定版更舊時，
  會退回使用 `latest`。

Gateway 核心自動更新器（透過設定啟用時）會在即時 Gateway 請求處理常式之外
啟動 CLI 更新路徑。控制平面 `update.run` 套件管理器更新會在套件替換後
強制執行非延後、無冷卻時間的更新重新啟動，
因為舊的 Gateway 程序可能仍有指向新套件已移除檔案的記憶體內片段。

對於套件管理器安裝，`openclaw update` 會在叫用套件管理器前解析目標套件
版本。npm 全域安裝會使用暫存安裝：OpenClaw 會將新套件安裝到暫時的 npm 前綴，
在該處驗證封裝的 `dist` 清單，然後將該乾淨的套件樹替換到
真正的全域前綴。如果驗證失敗，更新後 doctor、Plugin 同步與
重新啟動工作不會從可疑的套件樹執行。即使已安裝版本
已符合目標，該命令仍會重新整理全域套件安裝，
然後執行 Plugin 同步、核心命令補全重新整理，以及重新啟動工作。這會
讓封裝的 sidecar 與頻道擁有的 Plugin 記錄與
已安裝的 OpenClaw 建置保持一致，同時將完整的 Plugin 命令補全重建留給
明確的 `openclaw completion --write-state` 執行。

當本機受管理的 Gateway 服務已安裝且啟用重新啟動時，
套件管理器更新會先停止執行中的服務，再替換套件
樹，接著從更新後的安裝重新整理服務中繼資料、重新啟動
服務，並在回報成功前驗證重新啟動的 Gateway 回報預期版本。
在 macOS 上，更新後檢查也會驗證 LaunchAgent
已為作用中的設定檔載入/執行，且設定的 loopback 連接埠
健康。如果 plist 已安裝但 launchd 未監督它，OpenClaw
會自動重新 bootstrap LaunchAgent，然後重新執行
健康/版本/頻道就緒檢查。新的 bootstrap 會直接載入 RunAtLoad
作業，因此更新復原不會立刻對新產生的 Gateway 執行 `kickstart -k`。
如果 Gateway 仍未變得健康，命令會以非零狀態結束，
並列印重新啟動日誌路徑，以及明確的重新啟動、重新安裝與
套件回復指示。使用 `--no-restart` 時，
套件替換仍會執行，但受管理服務不會被停止或
重新啟動，因此執行中的 Gateway 可能會持續使用舊程式碼，直到你手動
重新啟動它。

## Git checkout 流程

### 頻道選擇

- `stable`：checkout 最新的非 beta 標籤，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` 標籤，但當 beta 缺失或較舊時，退回到最新的穩定版標籤。
- `dev`：checkout `main`，然後 fetch 並 rebase。

### 更新步驟

<Steps>
  <Step title="驗證乾淨的 worktree">
    要求沒有未提交的變更。
  </Step>
  <Step title="切換頻道">
    切換到所選頻道（標籤或分支）。
  </Step>
  <Step title="Fetch upstream">
    僅限 dev。
  </Step>
  <Step title="預檢建置（僅限 dev）">
    在暫時 worktree 中執行 lint 與 TypeScript 建置。如果 tip 失敗，會往回最多 10 個 commit，尋找最新的乾淨建置。
  </Step>
  <Step title="Rebase">
    Rebase 到所選 commit（僅限 dev）。
  </Step>
  <Step title="安裝相依套件">
    使用 repo 套件管理器。對於 pnpm checkout，更新器會按需 bootstrap `pnpm`（先透過 `corepack`，然後使用暫時的 `npm install pnpm@10` 備援），而不是在 pnpm workspace 內執行 `npm run build`。
  </Step>
  <Step title="建置 Control UI">
    建置 gateway 與 Control UI。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="同步 Plugin">
    將 Plugin 同步到作用中的頻道。Dev 使用內建 Plugin；stable 與 beta 使用 npm。更新已追蹤的 Plugin 安裝。
  </Step>
</Steps>

在 beta 更新頻道上，追蹤且遵循 default/latest 線的 npm 與 ClawHub Plugin 安裝
會先嘗試 Plugin `@beta` 發行版本。如果 Plugin 沒有
beta 發行版本，OpenClaw 會退回到已記錄的 default/latest spec。精確
版本與明確標籤不會被改寫。

<Warning>
如果精確釘選的 npm Plugin 更新解析到其完整性與儲存安裝記錄不同的成品，`openclaw update` 會中止該 Plugin 成品更新，而不是安裝它。只有在確認你信任新成品後，才明確重新安裝或更新該 Plugin。
</Warning>

<Note>
更新後 Plugin 同步失敗會讓更新結果失敗，並停止後續重新啟動工作。修正 Plugin 安裝或更新錯誤，然後重新執行 `openclaw update`。

當更新後的 Gateway 啟動時，Plugin 載入僅做驗證：啟動不會執行套件管理器，也不會變更相依套件樹。套件管理器 `update.run` 重新啟動會在套件樹替換後繞過一般的閒置延後與重新啟動冷卻，因此舊程序無法繼續 lazy-load 已移除的片段。

如果 pnpm bootstrap 仍然失敗，更新器會提早停止並顯示套件管理器專屬錯誤，而不是嘗試在 checkout 內執行 `npm run build`。
</Note>

## `--update` 簡寫

`openclaw --update` 會重寫為 `openclaw update`（對 shell 與啟動器 script 很有用）。

## 相關

- `openclaw doctor`（在 git checkout 上會提出先執行 update）
- [開發頻道](/zh-TW/install/development-channels)
- [Updating](/zh-TW/install/updating)
- [CLI 參考](/zh-TW/cli)
