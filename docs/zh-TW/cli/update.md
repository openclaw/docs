---
read_when:
    - 你想安全地更新原始碼簽出副本
    - 你需要了解 `--update` 的簡寫行為
summary: '`openclaw update` 的 CLI 參考（相對安全的來源更新 + Gateway 自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-05-02T02:47:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc88dc7963f1ae7d847a573924e9af7ede207f2f20028a18808116de4912d24e
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

- `--no-restart`: 成功更新後略過重新啟動 Gateway 服務。會重新啟動 Gateway 的套件管理器更新，會先驗證重新啟動後的服務回報預期的已更新版本，命令才會成功。
- `--channel <stable|beta|dev>`: 設定更新通道（git + npm；會保存在設定中）。
- `--tag <dist-tag|version|spec>`: 僅針對本次更新覆寫套件目標。對於套件安裝，`main` 會對應到 `github:openclaw/openclaw#main`。
- `--dry-run`: 預覽規劃的更新動作（通道/標籤/目標/重新啟動流程），不寫入設定、安裝、同步 Plugin 或重新啟動。
- `--json`: 列印機器可讀的 `UpdateRunResult` JSON，包括
  在更新後 Plugin 同步期間偵測到 npm Plugin 成品漂移時的
  `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`: 每個步驟的逾時時間（預設為 1800 秒）。
- `--yes`: 略過確認提示（例如降版確認）。

<Warning>
降版需要確認，因為較舊版本可能會破壞設定。
</Warning>

## `update status`

顯示作用中的更新通道 + git 標籤/分支/SHA（用於原始碼 checkout），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

選項：

- `--json`: 列印機器可讀的狀態 JSON。
- `--timeout <seconds>`: 檢查逾時時間（預設為 3 秒）。

## `update wizard`

用於選擇更新通道，並確認更新後是否重新啟動 Gateway 的互動式流程
（預設會重新啟動）。如果你選擇 `dev` 但沒有 git checkout，它會
提供建立一個 checkout。

選項：

- `--timeout <seconds>`: 每個更新步驟的逾時時間（預設 `1800`）

## 它會做什麼

當你明確切換通道（`--channel ...`）時，OpenClaw 也會保持
安裝方式一致：

- `dev` → 確保有 git checkout（預設：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆寫），
  更新它，並從該 checkout 安裝全域 CLI。
- `stable` → 使用 `latest` 從 npm 安裝。
- `beta` → 優先使用 npm dist-tag `beta`，但當 beta
  缺失或比目前的 stable 發行版本更舊時，會退回 `latest`。

Gateway 核心自動更新器（透過設定啟用時）會在即時 Gateway 請求處理常式之外
啟動 CLI 更新路徑。控制平面的 `update.run` 套件管理器
更新會在套件替換後強制進行非延後、無冷卻時間的更新重新啟動，
因為舊的 Gateway 程序可能仍有指向
新套件已移除檔案的記憶體內區塊。

對於套件管理器安裝，`openclaw update` 會在叫用套件管理器之前
解析目標套件版本。npm 全域安裝會使用分階段安裝：
OpenClaw 會將新套件安裝到暫時的 npm prefix，驗證
那裡封裝的 `dist` 清單，然後將該乾淨的套件樹替換到
真正的全域 prefix。如果驗證失敗，更新後 doctor、Plugin 同步和
重新啟動工作不會從可疑的樹執行。即使已安裝版本
已符合目標，命令仍會重新整理全域套件安裝，
然後執行 Plugin 同步、核心命令 completion 重新整理，以及重新啟動工作。這
會讓封裝的 sidecar 和通道擁有的 Plugin 記錄與
已安裝的 OpenClaw 建置保持一致，同時將完整的 Plugin 命令 completion 重建留給
明確的 `openclaw completion --write-state` 執行。

當已安裝本機受管理的 Gateway 服務且已啟用重新啟動時，
套件管理器更新會先停止執行中的服務，再替換套件
樹，接著從更新後的安裝重新整理服務中繼資料、重新啟動
服務，並驗證重新啟動的 Gateway 回報預期版本。使用
`--no-restart` 時，仍會執行套件替換，但受管理的服務不會被
停止或重新啟動，因此執行中的 Gateway 可能會保留舊程式碼，直到你手動重新啟動
它。

## Git checkout 流程

### 通道選擇

- `stable`: checkout 最新的非 beta 標籤，然後建置並執行 doctor。
- `beta`: 優先使用最新的 `-beta` 標籤，但當 beta 缺失或較舊時，會退回最新的 stable 標籤。
- `dev`: checkout `main`，然後 fetch 並 rebase。

### 更新步驟

<Steps>
  <Step title="驗證乾淨的工作樹">
    要求沒有未提交的變更。
  </Step>
  <Step title="切換通道">
    切換到選取的通道（標籤或分支）。
  </Step>
  <Step title="擷取上游">
    僅限 Dev。
  </Step>
  <Step title="預檢建置（僅限 dev）">
    在暫時工作樹中執行 lint 和 TypeScript 建置。如果 tip 失敗，會往回最多 10 個 commit，以找出最新的乾淨建置。
  </Step>
  <Step title="Rebase">
    Rebase 到選取的 commit（僅限 dev）。
  </Step>
  <Step title="安裝相依套件">
    使用 repo 套件管理器。對於 pnpm checkout，更新器會視需要啟動 `pnpm`（先透過 `corepack`，然後退回暫時的 `npm install pnpm@10`），而不是在 pnpm workspace 內執行 `npm run build`。
  </Step>
  <Step title="建置 Control UI">
    建置 gateway 和 Control UI。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最終的安全更新檢查執行。
  </Step>
  <Step title="同步 Plugin">
    將 Plugin 同步到作用中的通道。Dev 使用 bundled Plugin；stable 和 beta 使用 npm。更新透過 npm 安裝的 Plugin。
  </Step>
</Steps>

<Warning>
如果精確釘選的 npm Plugin 更新解析到的成品，其完整性與已儲存的安裝記錄不同，`openclaw update` 會中止該 Plugin 成品更新，而不是安裝它。只有在驗證你信任新的成品後，才明確重新安裝或更新該 Plugin。
</Warning>

<Note>
更新後 Plugin 同步失敗會讓更新結果失敗，並停止後續重新啟動工作。修正 Plugin 安裝或更新錯誤，然後重新執行 `openclaw update`。

當更新後的 Gateway 啟動時，Plugin 載入僅會驗證：啟動不會執行套件管理器或變更相依套件樹。套件管理器 `update.run` 重新啟動會在套件樹替換後，略過一般的閒置延後和重新啟動冷卻時間，因此舊程序無法持續延遲載入已移除的區塊。

如果 pnpm 啟動仍然失敗，更新器會提早停止並顯示套件管理器專屬錯誤，而不是嘗試在 checkout 內執行 `npm run build`。
</Note>

## `--update` 簡寫

`openclaw --update` 會重寫為 `openclaw update`（適用於 shell 和啟動器指令碼）。

## 相關

- `openclaw doctor`（在 git checkout 上提供先執行 update）
- [開發通道](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [CLI 參考](/zh-TW/cli)
