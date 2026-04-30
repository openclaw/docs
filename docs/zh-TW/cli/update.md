---
read_when:
    - 你想要安全地更新原始碼簽出
    - 您需要了解 `--update` 簡寫行為
summary: CLI 參考：`openclaw update`（相對安全的來源更新 + Gateway 自動重新啟動）
title: 更新
x-i18n:
    generated_at: "2026-04-30T02:57:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全地更新 OpenClaw，並在 stable/beta/dev 通道之間切換。

如果你是透過 **npm/pnpm/bun** 安裝（全域安裝，沒有 git 中繼資料），
更新會透過[更新](/zh-TW/install/updating)中的套件管理器流程進行。

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

- `--no-restart`：成功更新後略過重新啟動 Gateway 服務。會重新啟動 Gateway 的套件管理器更新，會先驗證重新啟動的服務回報預期的更新版本，命令才會成功。
- `--channel <stable|beta|dev>`：設定更新通道（git + npm；會保存在設定中）。
- `--tag <dist-tag|version|spec>`：僅針對本次更新覆寫套件目標。對套件安裝而言，`main` 會對應到 `github:openclaw/openclaw#main`。
- `--dry-run`：預覽規劃的更新動作（通道/tag/目標/重新啟動流程），不寫入設定、不安裝、不同步 plugins，也不重新啟動。
- `--json`：列印機器可讀的 `UpdateRunResult` JSON，包括在更新後 Plugin 同步期間偵測到 npm Plugin 成品漂移時的
  `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每個步驟的逾時時間（預設為 1800 秒）。
- `--yes`：略過確認提示（例如降級確認）。

<Warning>
降級需要確認，因為較舊版本可能會破壞設定。
</Warning>

## `update status`

顯示目前作用中的更新通道 + git tag/branch/SHA（適用於原始碼 checkout），以及更新可用性。

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
（預設會重新啟動）。如果你選擇 `dev` 但沒有 git checkout，它會提議建立一個。

選項：

- `--timeout <seconds>`：每個更新步驟的逾時時間（預設 `1800`）

## 它會做什麼

當你明確切換通道（`--channel ...`）時，OpenClaw 也會讓
安裝方式保持一致：

- `dev` → 確保存在 git checkout（預設：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆寫），
  更新它，並從該 checkout 安裝全域 CLI。
- `stable` → 使用 `latest` 從 npm 安裝。
- `beta` → 優先使用 npm dist-tag `beta`，但當 beta 缺失或比目前的 stable 發行版更舊時，會退回使用 `latest`。

Gateway 核心自動更新器（透過設定啟用時）會重用相同的更新路徑。

對套件管理器安裝而言，`openclaw update` 會先解析目標套件
版本，再呼叫套件管理器。npm 全域安裝會使用分段安裝：OpenClaw 會把新套件安裝到暫時的 npm prefix，驗證那裡封裝的 `dist` 清單，然後將該乾淨的套件樹替換到
真正的全域 prefix。如果驗證失敗，更新後的 doctor、Plugin 同步與
重新啟動工作不會從可疑的樹執行。即使已安裝版本
已經符合目標，命令仍會重新整理全域套件安裝，
接著執行 Plugin 同步、核心命令 completion 重新整理，以及重新啟動工作。這會讓
封裝的 sidecar 與通道擁有的 Plugin 記錄和已安裝的 OpenClaw 建置保持一致，同時把完整的 Plugin 命令 completion 重建留給明確的 `openclaw completion --write-state` 執行。

當已安裝本機受管理的 Gateway 服務且啟用重新啟動時，
套件管理器更新會在替換套件
樹之前停止正在執行的服務，然後從更新後的安裝重新整理服務中繼資料、重新啟動
服務，並驗證重新啟動的 Gateway 回報預期版本。使用
`--no-restart` 時，套件替換仍會執行，但受管理服務不會
被停止或重新啟動，因此正在執行的 Gateway 可能會持續使用舊程式碼，直到你手動重新啟動它。

## Git checkout 流程

### 通道選擇

- `stable`：checkout 最新的非 beta tag，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` tag，但在 beta 缺失或更舊時，退回最新的 stable tag。
- `dev`：checkout `main`，然後 fetch 並 rebase。

### 更新步驟

<Steps>
  <Step title="驗證乾淨的 worktree">
    要求沒有未提交的變更。
  </Step>
  <Step title="切換通道">
    切換到選取的通道（tag 或 branch）。
  </Step>
  <Step title="Fetch upstream">
    僅限 Dev。
  </Step>
  <Step title="預檢建置（僅限 dev）">
    在暫時 worktree 中執行 lint 和 TypeScript 建置。如果 tip 失敗，會向回最多追溯 10 個 commit，以找出最新的乾淨建置。
  </Step>
  <Step title="Rebase">
    Rebase 到選取的 commit（僅限 dev）。
  </Step>
  <Step title="安裝相依性">
    使用 repo 套件管理器。對 pnpm checkout 而言，更新器會按需啟動 `pnpm`（先透過 `corepack`，再退回暫時的 `npm install pnpm@10`），而不是在 pnpm workspace 內執行 `npm run build`。
  </Step>
  <Step title="建置 Control UI">
    建置 gateway 與 Control UI。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="同步 plugins">
    將 plugins 同步到作用中的通道。Dev 使用 bundled plugins；stable 和 beta 使用 npm。會更新透過 npm 安裝的 plugins。
  </Step>
</Steps>

<Warning>
如果精確釘選的 npm Plugin 更新解析到的成品，其 integrity 與儲存的安裝記錄不同，`openclaw update` 會中止該 Plugin 成品更新，而不是安裝它。只有在驗證你信任新的成品後，才明確重新安裝或更新該 Plugin。
</Warning>

<Note>
更新後 Plugin 同步失敗會讓更新結果失敗，並停止後續重新啟動工作。修正 Plugin 安裝或更新錯誤，然後重新執行 `openclaw update`。

更新後的 Gateway 啟動時，已啟用的 bundled Plugin runtime 相依性會在 Plugin 啟用前 staged。更新觸發的重新啟動會在關閉 Gateway 前耗盡任何作用中的 runtime-dependency staging，因此 service-manager 重新啟動不會中斷進行中的 npm 安裝。

如果 pnpm bootstrap 仍然失敗，更新器會提早停止並顯示套件管理器特定錯誤，而不是嘗試在 checkout 中執行 `npm run build`。
</Note>

## `--update` 簡寫

`openclaw --update` 會重寫為 `openclaw update`（對 shell 與 launcher scripts 很有用）。

## 相關

- `openclaw doctor`（在 git checkout 上會提議先執行 update）
- [開發通道](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [CLI 參考](/zh-TW/cli)
