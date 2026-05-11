---
read_when:
    - 你想要安全地更新來源 checkout
    - 你正在偵錯 `openclaw update` 的輸出或選項
    - 你需要了解 `--update` 簡寫行為
summary: '`openclaw update` 的 CLI 參考（相對安全的來源更新 + Gateway 自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-05-11T20:26:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全地更新 OpenClaw，並在 stable/beta/dev 通道之間切換。

如果你是透過 **npm/pnpm/bun** 安裝（全域安裝，沒有 git 中繼資料），
更新會透過 [Updating](/zh-TW/install/updating) 中的套件管理器流程進行。

## 使用方式

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

- `--no-restart`：成功更新後略過重新啟動 Gateway 服務。會重新啟動 Gateway 的套件管理器更新，會先驗證重新啟動的服務回報預期的已更新版本，命令才會成功。
- `--channel <stable|beta|dev>`：設定更新通道（git + npm；會保存到設定）。
- `--tag <dist-tag|version|spec>`：僅針對本次更新覆寫套件目標。對套件安裝而言，`main` 會對應到 `github:openclaw/openclaw#main`。
- `--dry-run`：預覽規劃的更新動作（通道/tag/目標/重新啟動流程），不寫入設定、不安裝、不同步 Plugin，也不重新啟動。
- `--json`：列印機器可讀的 `UpdateRunResult` JSON，包括
  核心更新成功後，如果毀損或無法載入的受管理 Plugin 需要修復，會包含
  `postUpdate.plugins.warnings`；當 Plugin 沒有 beta 發行版時的
  beta 通道 Plugin 後援詳細資料；以及在更新後 Plugin 同步期間偵測到
  npm Plugin 成品漂移時的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每個步驟的逾時時間（預設為 1800 秒）。
- `--yes`：略過確認提示（例如降級確認）。

`openclaw update` 沒有 `--verbose` 旗標。使用 `--dry-run` 預覽規劃的
通道/tag/安裝/重新啟動動作，使用 `--json` 取得機器可讀的結果，
只需要通道和可用性詳細資料時，使用 `openclaw update status --json`。
如果你正在偵錯更新前後的 Gateway 記錄，主控台詳細度和檔案記錄層級是分開的：
Gateway `--verbose` 會影響終端機/WebSocket 輸出，而檔案記錄需要在設定中使用
`logging.level: "debug"` 或 `"trace"`。請參閱 [Gateway 記錄](/zh-TW/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，會變更狀態的 `openclaw update` 執行會被停用。請改為更新此安裝的 Nix 來源或 flake 輸入；對於 nix-openclaw，請使用 agent-first 的 [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍維持唯讀。
</Note>

<Warning>
降級需要確認，因為較舊版本可能會破壞設定。
</Warning>

## `update status`

顯示作用中的更新通道 + git tag/分支/SHA（適用於原始碼 checkout），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

選項：

- `--json`：列印機器可讀的狀態 JSON。
- `--timeout <seconds>`：檢查逾時時間（預設為 3 秒）。

## `update wizard`

互動式流程，用來選擇更新通道，並確認更新後是否重新啟動 Gateway
（預設會重新啟動）。如果你在沒有 git checkout 的情況下選取 `dev`，
它會提議建立一個 checkout。

選項：

- `--timeout <seconds>`：每個更新步驟的逾時時間（預設 `1800`）

## 它會做什麼

當你明確切換通道（`--channel ...`）時，OpenClaw 也會保持
安裝方法一致：

- `dev` → 確保存在 git checkout（預設：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆寫），
  更新它，並從該 checkout 安裝全域 CLI。
- `stable` → 使用 `latest` 從 npm 安裝。
- `beta` → 優先使用 npm dist-tag `beta`，但當 beta
  缺失或比目前 stable 發行版更舊時，會後援到 `latest`。

Gateway 核心自動更新器（透過設定啟用時）會在即時 Gateway 請求處理常式之外
啟動 CLI 更新路徑。控制平面 `update.run` 套件管理器更新會在套件替換後，
強制執行非延遲、無冷卻時間的更新重新啟動，因為舊的 Gateway 行程可能仍有
指向新套件已移除檔案的記憶體內 chunk。

對於套件管理器安裝，`openclaw update` 會先解析目標套件版本，
再叫用套件管理器。npm 全域安裝會使用暫存安裝：OpenClaw 會將新套件安裝到
暫時的 npm prefix，驗證其中封裝的 `dist` 清單，然後將乾淨的套件樹替換到
真正的全域 prefix。如果驗證失敗，更新後的 doctor、Plugin 同步和重新啟動工作
不會從可疑的樹執行。即使已安裝版本已符合目標，該命令仍會重新整理全域套件安裝，
然後執行 Plugin 同步、核心命令 completion 重新整理，以及重新啟動工作。
這會讓封裝的 sidecar 和通道擁有的 Plugin 記錄與已安裝的 OpenClaw 建置保持一致，
同時把完整 Plugin 命令 completion 重建留給明確的
`openclaw completion --write-state` 執行。

當已安裝本機受管理 Gateway 服務且重新啟動已啟用時，
套件管理器更新會先停止執行中的服務，再替換套件樹，然後從更新後的安裝重新整理
服務中繼資料、重新啟動服務，並在回報成功前驗證重新啟動的 Gateway 回報預期版本。
在 macOS 上，更新後檢查也會驗證 LaunchAgent 已針對作用中的設定檔載入/執行，
且設定的 loopback 連接埠健康。如果 plist 已安裝但 launchd 未監督它，OpenClaw
會自動重新 bootstrap LaunchAgent，然後重新執行健康狀態/版本/通道就緒檢查。
全新的 bootstrap 會直接載入 RunAtLoad 工作，因此更新復原不會立刻對新產生的
Gateway 執行 `kickstart -k`。如果 Gateway 仍未變成健康狀態，命令會以非零狀態結束，
並列印重新啟動記錄路徑，以及明確的重新啟動、重新安裝和套件回復指示。
使用 `--no-restart` 時，套件替換仍會執行，但受管理服務不會停止或重新啟動，
因此執行中的 Gateway 可能會持續使用舊程式碼，直到你手動重新啟動。

## Git checkout 流程

### 通道選擇

- `stable`：checkout 最新的非 beta tag，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` tag，但當 beta 缺失或較舊時，會後援到最新的 stable tag。
- `dev`：checkout `main`，然後 fetch 並 rebase。

### 更新步驟

<Steps>
  <Step title="驗證乾淨的 worktree">
    要求沒有未提交的變更。
  </Step>
  <Step title="切換通道">
    切換到選取的通道（tag 或分支）。
  </Step>
  <Step title="Fetch upstream">
    僅限 dev。
  </Step>
  <Step title="預檢建置（僅限 dev）">
    在暫時 worktree 中執行 TypeScript 建置。如果 tip 失敗，最多往回走 10 個 commit，以找出最新可建置的 commit。設定 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也會在此預檢期間執行 lint；lint 會以受限制的序列模式執行，因為使用者更新主機通常比 CI runner 更小。
  </Step>
  <Step title="Rebase">
    Rebase 到選取的 commit（僅限 dev）。
  </Step>
  <Step title="安裝相依性">
    使用 repo 套件管理器。對 pnpm checkout 而言，更新器會依需求 bootstrap `pnpm`（先透過 `corepack`，再以暫時的 `npm install pnpm@11` 作為後援），而不是在 pnpm workspace 中執行 `npm run build`。
  </Step>
  <Step title="建置 Control UI">
    建置 gateway 和 Control UI。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="同步 Plugin">
    將 Plugin 同步到作用中的通道。Dev 使用 bundled Plugin；stable 和 beta 使用 npm。更新已追蹤的 Plugin 安裝。
  </Step>
</Steps>

在 beta 更新通道上，遵循 default/latest 路線的已追蹤 npm 和 ClawHub
Plugin 安裝會先嘗試 Plugin `@beta` 發行版。如果 Plugin 沒有 beta 發行版，
OpenClaw 會後援到已記錄的 default/latest spec，並將其回報為警告。
對於 npm Plugin，當 beta 套件存在但安裝驗證失敗時，OpenClaw 也會後援。
這些 Plugin 後援警告不會讓核心更新失敗。確切版本和明確 tag 不會被重寫。

<Warning>
如果確切釘選的 npm Plugin 更新解析到的成品，其完整性與儲存的安裝記錄不同，`openclaw update` 會中止該 Plugin 成品更新，而不是安裝它。只有在確認你信任新的成品後，才明確重新安裝或更新該 Plugin。
</Warning>

<Note>
更新後 Plugin 同步失敗若僅限於受管理 Plugin，會在核心更新成功後回報為警告。JSON 結果會保留頂層更新 `status: "ok"`，並回報 `postUpdate.plugins.status: "warning"`，附上 `openclaw doctor --fix` 和 `openclaw plugins inspect <id> --runtime --json` 指引。非預期的更新器或同步例外仍會讓更新結果失敗。修復 Plugin 安裝或更新錯誤後，重新執行 `openclaw doctor --fix` 或 `openclaw update`。

更新後的 Gateway 啟動時，Plugin 載入僅進行驗證：啟動不會執行套件管理器，也不會變更相依性樹。套件管理器 `update.run` 重新啟動會在套件樹替換後略過一般的閒置延遲和重新啟動冷卻，因此舊行程不能繼續 lazy-load 已移除的 chunk。

如果 pnpm bootstrap 仍然失敗，更新器會提早停止並顯示套件管理器專用錯誤，而不是嘗試在 checkout 中執行 `npm run build`。
</Note>

## `--update` 簡寫

`openclaw --update` 會重寫為 `openclaw update`（對 shell 和啟動器 script 很有用）。

## 相關

- `openclaw doctor`（在 git checkout 上會提議先執行 update）
- [開發通道](/zh-TW/install/development-channels)
- [Updating](/zh-TW/install/updating)
- [CLI 參考](/zh-TW/cli)
