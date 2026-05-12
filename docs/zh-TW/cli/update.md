---
read_when:
    - 您想要安全地更新已簽出的原始碼
    - 你正在偵錯 `openclaw update` 的輸出或選項
    - 你需要了解 `--update` 簡寫行為
summary: '`openclaw update` 的 CLI 參考（相對安全的原始碼更新 + Gateway 自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-05-12T08:46:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93244af800aaa53c55a52f9593a7727910aa91acac9d1e34e89c39a95b133461
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

- `--no-restart`：成功更新後略過重新啟動 Gateway 服務。會重新啟動 Gateway 的套件管理器更新，會先確認重新啟動的服務回報預期的更新後版本，命令才會成功。
- `--channel <stable|beta|dev>`：設定更新通道（git + npm；會保存到設定中）。
- `--tag <dist-tag|version|spec>`：僅針對這次更新覆寫套件目標。對於套件安裝，`main` 會對應到 `github:openclaw/openclaw#main`。
- `--dry-run`：預覽規劃中的更新動作（通道/標籤/目標/重新啟動流程），不寫入設定、不安裝、不同步 plugins，也不重新啟動。
- `--json`：列印機器可讀的 `UpdateRunResult` JSON，包括
  核心更新成功後，損毀或無法卸載的受管理 plugins 需要
  修復時的 `postUpdate.plugins.warnings`；Plugin 沒有 beta 發行版時的 beta 通道 Plugin 後援細節；
  以及更新後 Plugin 同步期間偵測到 npm Plugin 成品漂移時的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每個步驟的逾時時間（預設為 1800s）。
- `--yes`：略過確認提示（例如降級確認）。

`openclaw update` 沒有 `--verbose` 旗標。使用 `--dry-run` 預覽
規劃中的通道/標籤/安裝/重新啟動動作，使用 `--json` 取得機器可讀的
結果；當你只需要通道與可用性細節時，使用 `openclaw update status --json`。
如果你正在偵錯更新前後的 Gateway 記錄，
主控台詳細程度和檔案記錄層級是分開的：Gateway `--verbose` 會影響
終端機/WebSocket 輸出，而檔案記錄需要在設定中使用 `logging.level: "debug"` 或
`"trace"`。請參閱 [Gateway 記錄](/zh-TW/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，會變更狀態的 `openclaw update` 執行會被停用。請改為更新此安裝的 Nix 來源或 flake 輸入；對於 nix-openclaw，請使用 agent-first [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍維持唯讀。
</Note>

<Warning>
降級需要確認，因為較舊版本可能會破壞設定。
</Warning>

## `update status`

顯示作用中的更新通道 + git 標籤/分支/SHA（適用於原始碼 checkout），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

選項：

- `--json`：列印機器可讀的狀態 JSON。
- `--timeout <seconds>`：檢查逾時時間（預設為 3s）。

## `update wizard`

互動式流程，用來選擇更新通道，並確認更新後是否要重新啟動 Gateway
（預設會重新啟動）。如果你選擇 `dev` 但沒有 git checkout，它會
提議建立一個。

選項：

- `--timeout <seconds>`：每個更新步驟的逾時時間（預設 `1800`）

## 它會做什麼

當你明確切換通道（`--channel ...`）時，OpenClaw 也會保持
安裝方式一致：

- `dev` → 確保存在 git checkout（預設：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆寫），
  更新它，並從該 checkout 安裝全域 CLI。
- `stable` → 使用 `latest` 從 npm 安裝。
- `beta` → 優先使用 npm dist-tag `beta`，但當 beta
  缺失或比目前 stable 發行版更舊時，會後援到 `latest`。

Gateway 核心自動更新器（透過設定啟用時）會在即時 Gateway 請求處理器
之外啟動 CLI 更新路徑。控制平面 `update.run` 套件管理器
更新會在套件替換後強制執行非延後、無冷卻時間的更新重新啟動，
因為舊的 Gateway 程序可能仍有指向
新套件已移除檔案的記憶體中區塊。

對於套件管理器安裝，`openclaw update` 會先解析目標套件
版本，再呼叫套件管理器。npm 全域安裝會使用分段式
安裝：OpenClaw 會把新套件安裝到暫時的 npm prefix，確認
那裡打包的 `dist` 清單，然後把乾淨的套件樹替換到
真正的全域 prefix。如果驗證失敗，更新後的 doctor、Plugin 同步和
重新啟動工作不會從可疑的樹執行。即使已安裝版本
已經符合目標，命令也會重新整理全域套件安裝，
然後執行 Plugin 同步、核心命令補全重新整理，以及重新啟動工作。這
會讓打包的 sidecar 和通道擁有的 Plugin 記錄與
已安裝的 OpenClaw 建置保持一致，同時把完整的 Plugin 命令補全重建留給
明確的 `openclaw completion --write-state` 執行。

當本機受管理的 Gateway 服務已安裝且啟用重新啟動時，
套件管理器更新會先停止執行中的服務，再替換套件
樹，然後從更新後的安裝重新整理服務中繼資料，重新啟動
服務，並確認重新啟動的 Gateway 回報預期版本後
才回報成功。在 macOS 上，更新後檢查也會確認 LaunchAgent
已針對作用中的設定檔載入/執行，且設定的 loopback 埠
健康。如果 plist 已安裝但 launchd 未監督它，OpenClaw
會自動重新 bootstrap LaunchAgent，然後重新執行
健康狀態/版本/通道就緒檢查。全新的 bootstrap 會直接載入 RunAtLoad
工作，因此更新復原不會立即對新產生的
Gateway 執行 `kickstart -k`。如果 Gateway 仍未變健康，命令會以
非零狀態結束，並列印重新啟動記錄路徑，以及明確的重新啟動、重新安裝和
套件回復指示。使用 `--no-restart` 時，
仍會執行套件替換，但受管理服務不會被停止或
重新啟動，因此執行中的 Gateway 可能會持續使用舊程式碼，直到你
手動重新啟動它。

## Git checkout 流程

### 通道選擇

- `stable`：checkout 最新的非 beta 標籤，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` 標籤，但當 beta 缺失或較舊時，會後援到最新的 stable 標籤。
- `dev`：checkout `main`，然後 fetch 並 rebase。

### 更新步驟

<Steps>
  <Step title="確認乾淨的 worktree">
    要求沒有未提交的變更。
  </Step>
  <Step title="切換通道">
    切換到選定的通道（標籤或分支）。
  </Step>
  <Step title="Fetch upstream">
    僅限 Dev。
  </Step>
  <Step title="預檢建置（僅限 dev）">
    在暫時 worktree 中執行 TypeScript 建置。如果 tip 失敗，會往回最多 10 個 commit，尋找最新可建置的 commit。設定 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也會在此預檢期間執行 lint；lint 會以受限的序列模式執行，因為使用者的更新主機通常比 CI runner 更小。
  </Step>
  <Step title="Rebase">
    Rebase 到選定的 commit（僅限 dev）。
  </Step>
  <Step title="安裝相依性">
    使用 repo 套件管理器。對於 pnpm checkout，更新器會依需求 bootstrap `pnpm`（先透過 `corepack`，再後援到暫時的 `npm install pnpm@11`），而不是在 pnpm workspace 內執行 `npm run build`。
  </Step>
  <Step title="建置 Control UI">
    建置 Gateway 和 Control UI。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="同步 plugins">
    將 plugins 同步到作用中的通道。Dev 使用內建 plugins；stable 和 beta 使用 npm。更新受追蹤的 Plugin 安裝。
  </Step>
</Steps>

在 beta 更新通道上，遵循預設/latest 線的受追蹤 npm 與 ClawHub Plugin 安裝
會先嘗試 Plugin `@beta` 發行版。如果 Plugin 沒有
beta 發行版，OpenClaw 會後援到記錄的預設/latest spec，並將
該情況回報為警告。對於 npm plugins，當 beta
套件存在但安裝驗證失敗時，OpenClaw 也會後援。這些 Plugin 後援警告
不會讓核心更新失敗。精確版本和明確標籤不會
被改寫。

<Warning>
如果精確釘選的 npm Plugin 更新解析到的成品，其 integrity 與已儲存的安裝記錄不同，`openclaw update` 會中止該 Plugin 成品更新，而不是安裝它。只有在確認你信任新成品後，才明確重新安裝或更新該 Plugin。
</Warning>

<Note>
更新後 Plugin 同步失敗若範圍限定於受管理 Plugin，且同步路徑可以繞過（例如非必要 Plugin 的 npm registry 無法連線），會在核心更新成功後以警告回報。JSON 結果會保留頂層更新 `status: "ok"`，並回報 `postUpdate.plugins.status: "warning"`，附上 `openclaw doctor --fix` 和 `openclaw plugins inspect <id> --runtime --json` 指引。非預期的更新器或同步例外仍會讓更新結果失敗。修復 Plugin 安裝或更新錯誤後，再重新執行 `openclaw doctor --fix` 或 `openclaw update`。

在每個 Plugin 同步步驟之後，`openclaw update` 會在重新啟動 Gateway 前執行強制的**核心後收斂**流程：它會修復缺少的已設定 Plugin payload、驗證磁碟上每個_作用中_受追蹤安裝記錄，並靜態確認其 `package.json` 可解析（以及任何明確宣告的 `main` 存在）。此流程的失敗，以及無效的 OpenClaw 設定快照，會回傳 `postUpdate.plugins.status: "error"`，並將頂層更新 `status` 翻轉為 `"error"`，因此 `openclaw update` 會以非零狀態結束，且 Gateway 不會以未驗證的 Plugin 集重新啟動。錯誤會包含結構化的 `postUpdate.plugins.warnings[].guidance` 行，指向 `openclaw doctor --fix` 和 `openclaw plugins inspect <id> --runtime --json` 供後續處理。停用的 Plugin 項目，以及未連結到可信來源官方同步目標的記錄，會在這裡被略過，與缺少 payload 檢查所使用的 `skipDisabledPlugins` 政策一致，因此陳舊的停用 Plugin 記錄無法阻擋原本有效的更新。

當更新後的 Gateway 啟動時，Plugin 載入僅進行驗證：啟動不會執行套件管理器，也不會變更相依性樹。套件管理器 `update.run` 重新啟動會在套件樹已替換後，略過一般的閒置延後和重新啟動冷卻時間，因此舊程序無法繼續延遲載入已移除的區塊。

如果 pnpm bootstrap 仍失敗，更新器會提早停止並回報套件管理器特定錯誤，而不是嘗試在 checkout 內執行 `npm run build`。
</Note>

## `--update` 簡寫

`openclaw --update` 會改寫為 `openclaw update`（適用於 shell 和啟動器腳本）。

## 相關

- `openclaw doctor`（在 git checkout 上會提議先執行 update）
- [開發通道](/zh-TW/install/development-channels)
- [Updating](/zh-TW/install/updating)
- [CLI 參考](/zh-TW/cli)
