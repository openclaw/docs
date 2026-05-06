---
read_when:
    - 你想要安全地更新原始碼簽出副本
    - 你正在偵錯 `openclaw update` 的輸出或選項
    - 你需要了解 `--update` 的簡寫行為
summary: '`openclaw update` 的 CLI 參考（相對安全的來源更新 + Gateway 自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-05-06T02:45:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全地更新 OpenClaw，並在 stable/beta/dev channel 之間切換。

如果你是透過 **npm/pnpm/bun** 安裝（全域安裝，沒有 git metadata），更新會透過 [更新](/zh-TW/install/updating) 中的 package-manager 流程進行。

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

- `--no-restart`：成功更新後略過重新啟動 Gateway service。會重新啟動 Gateway 的 package-manager 更新，會在指令成功前驗證重新啟動的 service 回報預期的更新後版本。
- `--channel <stable|beta|dev>`：設定更新 channel（git + npm；會保存於 config）。
- `--tag <dist-tag|version|spec>`：僅覆寫本次更新的 package 目標。對 package install 而言，`main` 會對應到 `github:openclaw/openclaw#main`。
- `--dry-run`：預覽計畫中的更新動作（channel/tag/target/restart 流程），不寫入 config、不安裝、不同步 plugins，也不重新啟動。
- `--json`：列印機器可讀的 `UpdateRunResult` JSON，包括核心更新成功後，損毀或無法載入的 managed plugins 需要修復時的 `postUpdate.plugins.warnings`，以及在更新後 Plugin 同步期間偵測到 npm Plugin artifact drift 時的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每個步驟的逾時時間（預設為 1800s）。
- `--yes`：略過確認提示（例如降級確認）。

`openclaw update` 沒有 `--verbose` flag。使用 `--dry-run` 預覽計畫中的 channel/tag/install/restart 動作，使用 `--json` 取得機器可讀結果；如果只需要 channel 和可用性詳細資訊，請使用 `openclaw update status --json`。如果你正在除錯更新前後的 Gateway logs，console 詳細程度和檔案 log level 是分開的：Gateway `--verbose` 會影響 terminal/WebSocket 輸出，而檔案 logs 需要在 config 中設定 `logging.level: "debug"` 或 `"trace"`。請參閱 [Gateway logging](/zh-TW/gateway/logging)。

<Warning>
降級需要確認，因為舊版本可能會破壞設定。
</Warning>

## `update status`

顯示作用中的更新 channel + git tag/branch/SHA（適用於 source checkout），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

選項：

- `--json`：列印機器可讀的 status JSON。
- `--timeout <seconds>`：檢查逾時時間（預設為 3s）。

## `update wizard`

互動式流程，用來選擇更新 channel，並確認更新後是否要重新啟動 Gateway（預設會重新啟動）。如果你在沒有 git checkout 的情況下選擇 `dev`，它會提議建立一個 checkout。

選項：

- `--timeout <seconds>`：每個更新步驟的逾時時間（預設 `1800`）

## 它會做什麼

當你明確切換 channel（`--channel ...`）時，OpenClaw 也會讓安裝方法保持一致：

- `dev` → 確保有 git checkout（預設：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆寫）、更新它，並從該 checkout 安裝全域 CLI。
- `stable` → 使用 `latest` 從 npm 安裝。
- `beta` → 優先使用 npm dist-tag `beta`，但當 beta 缺失或比目前 stable release 更舊時，會退回 `latest`。

Gateway core auto-updater（透過 config 啟用時）會在即時 Gateway request handler 之外啟動 CLI 更新路徑。Control-plane `update.run` package-manager 更新會在 package swap 後強制執行非延後、無 cooldown 的更新重新啟動，因為舊 Gateway process 仍可能有指向新 package 已移除檔案的 in-memory chunks。

對 package-manager installs 而言，`openclaw update` 會在叫用 package manager 前解析目標 package version。npm global installs 使用 staged install：OpenClaw 會將新 package 安裝到暫時的 npm prefix、在那裡驗證 packaged `dist` inventory，然後把乾淨的 package tree 交換到真正的 global prefix。若驗證失敗，更新後的 doctor、Plugin 同步與重新啟動工作不會從可疑的 tree 執行。即使已安裝版本已符合目標，該指令仍會重新整理全域 package install，然後執行 Plugin 同步、核心指令 completion refresh，以及重新啟動工作。這會讓 packaged sidecars 與 channel-owned Plugin records 和已安裝的 OpenClaw build 保持一致，同時把完整的 Plugin-command completion rebuild 留給明確的 `openclaw completion --write-state` 執行。

當已安裝本機 managed Gateway service 且啟用重新啟動時，package-manager 更新會先停止正在執行的 service，再取代 package tree，接著從更新後的安裝重新整理 service metadata、重新啟動 service，並在回報成功前驗證重新啟動的 Gateway 回報預期版本。在 macOS 上，更新後檢查也會驗證 LaunchAgent 已為作用中的 profile 載入/執行，且設定的 loopback port 是健康的。如果 plist 已安裝但 launchd 沒有監督它，OpenClaw 會自動重新 bootstrap LaunchAgent，然後重新執行 health/version/channel readiness checks。新的 bootstrap 會直接載入 RunAtLoad job，因此更新復原不會立即對新產生的 Gateway 執行 `kickstart -k`。如果 Gateway 仍未變成健康狀態，指令會以非零狀態結束，並列印 restart log path，以及明確的重新啟動、重新安裝和 package rollback 指示。使用 `--no-restart` 時，package replacement 仍會執行，但 managed service 不會停止或重新啟動，因此正在執行的 Gateway 可能會保留舊程式碼，直到你手動重新啟動它。

## Git checkout 流程

### Channel 選擇

- `stable`：checkout 最新的非 beta tag，然後 build 並執行 doctor。
- `beta`：優先使用最新的 `-beta` tag，但當 beta 缺失或較舊時，會退回最新的 stable tag。
- `dev`：checkout `main`，然後 fetch 並 rebase。

### 更新步驟

<Steps>
  <Step title="驗證乾淨的 worktree">
    需要沒有未提交的變更。
  </Step>
  <Step title="切換 channel">
    切換到選取的 channel（tag 或 branch）。
  </Step>
  <Step title="擷取 upstream">
    僅適用 Dev。
  </Step>
  <Step title="Preflight build（僅適用 dev）">
    在 temp worktree 中執行 TypeScript build。如果 tip 失敗，會向前回溯最多 10 個 commits，以找出最新可 build 的 commit。設定 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也會在此 preflight 期間執行 lint；lint 會以受限的 serial mode 執行，因為使用者的更新主機通常比 CI runners 更小。
  </Step>
  <Step title="Rebase">
    Rebase 到選取的 commit（僅適用 dev）。
  </Step>
  <Step title="安裝 dependencies">
    使用 repo package manager。對 pnpm checkouts 而言，updater 會視需要 bootstrap `pnpm`（先透過 `corepack`，再以暫時的 `npm install pnpm@10` fallback），而不是在 pnpm workspace 內執行 `npm run build`。
  </Step>
  <Step title="Build Control UI">
    Build gateway 和 Control UI。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="同步 plugins">
    將 plugins 同步到作用中的 channel。Dev 使用 bundled plugins；stable 和 beta 使用 npm。更新 tracked Plugin installs。
  </Step>
</Steps>

在 beta 更新 channel 上，遵循 default/latest 線的 tracked npm 和 ClawHub Plugin installs 會先嘗試 Plugin `@beta` release。如果 Plugin 沒有 beta release，OpenClaw 會退回記錄的 default/latest spec。對 npm plugins 而言，當 beta package 存在但 install validation 失敗時，OpenClaw 也會退回。Exact versions 和 explicit tags 不會被改寫。

<Warning>
如果 exact pinned npm Plugin update 解析到的 artifact integrity 與儲存的 install record 不同，`openclaw update` 會中止該 Plugin artifact update，而不是安裝它。只有在驗證你信任新的 artifact 後，才明確重新安裝或更新該 Plugin。
</Warning>

<Note>
更新後的 Plugin 同步失敗如果只限於 managed Plugin，會在核心更新成功後回報為 warnings。JSON result 會保留 top-level update `status: "ok"`，並以 `openclaw doctor --fix` 和 `openclaw plugins inspect <id> --runtime --json` 指引回報 `postUpdate.plugins.status: "warning"`。非預期的 updater 或 sync exceptions 仍會讓更新結果失敗。修正 Plugin install 或 update error，然後重新執行 `openclaw doctor --fix` 或 `openclaw update`。

更新後的 Gateway 啟動時，Plugin loading 是 verify-only：startup 不會執行 package managers，也不會改動 dependency trees。Package-manager `update.run` 重新啟動會在 package tree 被交換後繞過一般的 idle deferral 和 restart cooldown，因此舊 process 無法繼續 lazy-loading 已移除的 chunks。

如果 pnpm bootstrap 仍然失敗，updater 會提早停止並顯示 package-manager-specific error，而不是在 checkout 內嘗試 `npm run build`。
</Note>

## `--update` 簡寫

`openclaw --update` 會改寫為 `openclaw update`（適合 shells 和 launcher scripts）。

## 相關

- `openclaw doctor`（在 git checkouts 上會提議先執行 update）
- [Development channels](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [CLI reference](/zh-TW/cli)
