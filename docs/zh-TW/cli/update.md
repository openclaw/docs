---
read_when:
    - 你想要安全地更新原始碼簽出目錄
    - 你需要了解 `--update` 的簡寫行為
summary: '`openclaw update` 的 CLI 參考（較安全的來源更新 + Gateway 自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-05-02T20:45:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
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

- `--no-restart`：成功更新後略過重新啟動 Gateway 服務。會重新啟動 Gateway 的套件管理器更新，會先驗證重新啟動後的服務回報預期的更新版本，命令才會成功。
- `--channel <stable|beta|dev>`：設定更新通道（git + npm；會保存在設定中）。
- `--tag <dist-tag|version|spec>`：僅覆寫這次更新的套件目標。對於套件安裝，`main` 會對應到 `github:openclaw/openclaw#main`。
- `--dry-run`：預覽規劃的更新動作（通道/標籤/目標/重新啟動流程），不寫入設定、不安裝、不同步 plugins，也不重新啟動。
- `--json`：列印機器可讀的 `UpdateRunResult` JSON，包含
  在更新後 plugin 同步期間偵測到 npm plugin 成品漂移時的
  `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每個步驟的逾時時間（預設為 1800 秒）。
- `--yes`：略過確認提示（例如降級確認）。

<Warning>
降級需要確認，因為舊版本可能會破壞設定。
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
- `--timeout <seconds>`：檢查逾時時間（預設為 3 秒）。

## `update wizard`

用互動流程選擇更新通道，並確認更新後是否要重新啟動 Gateway
（預設會重新啟動）。如果你在沒有 git checkout 的情況下選擇 `dev`，
它會提議建立一個。

選項：

- `--timeout <seconds>`：每個更新步驟的逾時時間（預設 `1800`）

## 它會做什麼

當你明確切換通道（`--channel ...`）時，OpenClaw 也會讓
安裝方式保持一致：

- `dev` → 確保有 git checkout（預設：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆寫），
  更新它，並從該 checkout 安裝全域 CLI。
- `stable` → 使用 `latest` 從 npm 安裝。
- `beta` → 優先使用 npm dist-tag `beta`，但當 beta
  缺少或比目前穩定版更舊時，會退回 `latest`。

Gateway 核心自動更新器（透過設定啟用時）會在即時 Gateway 請求處理器之外
啟動 CLI 更新路徑。控制平面的 `update.run` 套件管理器更新會在套件替換後
強制執行不延後、無冷卻時間的更新重啟，
因為舊的 Gateway 程序可能仍有記憶體中的片段指向
新套件已移除的檔案。

對於套件管理器安裝，`openclaw update` 會在叫用套件管理器之前解析目標套件
版本。npm 全域安裝會使用分段安裝：OpenClaw 會將新套件安裝到暫存 npm 前綴，
在那裡驗證封裝的 `dist` 清單，然後把那棵乾淨的套件樹替換到
真正的全域前綴。如果驗證失敗，更新後的 doctor、plugin 同步與
重新啟動工作不會從可疑的套件樹執行。即使已安裝版本
已符合目標，命令仍會重新整理全域套件安裝，
接著執行 plugin 同步、核心命令完成重新整理，以及重新啟動工作。這會讓
封裝的 sidecar 與通道擁有的 plugin 記錄和
已安裝的 OpenClaw 建置保持一致，同時把完整的 plugin 命令完成重建留給
明確執行的 `openclaw completion --write-state`。

當本機受管理的 Gateway 服務已安裝且啟用重新啟動時，
套件管理器更新會在替換套件樹之前停止執行中的服務，
然後從更新後的安裝重新整理服務中繼資料、重新啟動
服務，並驗證重新啟動的 Gateway 回報預期版本。使用
`--no-restart` 時，仍會執行套件替換，但不會停止或重新啟動
受管理服務，因此執行中的 Gateway 可能會保留舊程式碼，直到你手動重新啟動它。

## Git checkout 流程

### 通道選擇

- `stable`：checkout 最新的非 beta 標籤，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` 標籤，但當 beta 缺少或更舊時，會退回最新的穩定標籤。
- `dev`：checkout `main`，然後 fetch 並 rebase。

### 更新步驟

<Steps>
  <Step title="驗證乾淨的工作樹">
    要求沒有未提交的變更。
  </Step>
  <Step title="切換通道">
    切換到選取的通道（標籤或分支）。
  </Step>
  <Step title="擷取上游">
    僅限 dev。
  </Step>
  <Step title="預檢建置（僅限 dev）">
    在暫存工作樹中執行 lint 和 TypeScript 建置。如果 tip 失敗，會往回最多 10 個 commit，以尋找最新的乾淨建置。
  </Step>
  <Step title="Rebase">
    Rebase 到選取的 commit（僅限 dev）。
  </Step>
  <Step title="安裝相依套件">
    使用 repo 套件管理器。對於 pnpm checkout，更新器會依需求啟動 `pnpm`（先透過 `corepack`，再退回暫時的 `npm install pnpm@10`），而不是在 pnpm workspace 內執行 `npm run build`。
  </Step>
  <Step title="建置 Control UI">
    建置 gateway 和 Control UI。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="同步 plugins">
    將 plugins 同步到作用中通道。Dev 使用 bundled plugins；stable 和 beta 使用 npm。更新受追蹤的 plugin 安裝。
  </Step>
</Steps>

在 beta 更新通道上，遵循 default/latest 線的受追蹤 npm 與 ClawHub plugin 安裝，
會先嘗試 plugin `@beta` 發行版。如果該 plugin 沒有
beta 發行版，OpenClaw 會退回記錄的 default/latest spec。精確
版本與明確標籤不會被改寫。

<Warning>
如果精確釘選的 npm plugin 更新解析到的成品，其完整性與已儲存的安裝記錄不同，`openclaw update` 會中止該 plugin 成品更新，而不是安裝它。只有在確認你信任新成品後，才明確重新安裝或更新該 plugin。
</Warning>

<Note>
更新後 plugin 同步失敗會讓更新結果失敗，並停止後續重新啟動工作。修正 plugin 安裝或更新錯誤後，再重新執行 `openclaw update`。

更新後的 Gateway 啟動時，plugin 載入是僅驗證：啟動不會執行套件管理器，也不會變更相依套件樹。套件管理器 `update.run` 重新啟動會在套件樹替換後略過一般閒置延後與重新啟動冷卻，因此舊程序無法持續延遲載入已移除的片段。

如果 pnpm bootstrap 仍然失敗，更新器會提早停止並回報套件管理器特定錯誤，而不是嘗試在 checkout 內執行 `npm run build`。
</Note>

## `--update` 簡寫

`openclaw --update` 會改寫為 `openclaw update`（對 shell 和啟動器指令碼很有用）。

## 相關

- `openclaw doctor`（在 git checkout 上會提議先執行 update）
- [開發通道](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [CLI 參考](/zh-TW/cli)
