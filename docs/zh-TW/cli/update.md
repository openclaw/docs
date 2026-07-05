---
read_when:
    - 您想要安全地更新原始碼工作副本
    - 你正在偵錯 `openclaw update` 輸出或選項
    - 你需要了解 `--update` 的簡寫行為
summary: '`openclaw update` 的命令列介面參考（相對安全的原始碼更新 + 閘道自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-07-05T11:11:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c26f41b6931681dce351b82640535855e919888dc2cf6dea4bdb9937dcf139f8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

更新 OpenClaw，並在 stable/extended-stable/beta/dev 通道之間切換。

如果你是透過 **npm/pnpm/bun** 安裝（全域安裝，沒有 git 中繼資料），
更新會透過 [更新](/zh-TW/install/updating) 中描述的套件管理器流程進行。

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

`openclaw --update` 會改寫為 `openclaw update`（適用於 shell 和啟動器指令碼）。

## 選項

| 旗標                                             | 說明                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | 成功更新後略過重新啟動閘道服務。會重新啟動的套件管理器更新，會先驗證重新啟動的服務回報預期版本，命令才會成功。                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | 設定更新通道，並在核心更新成功後保存。Extended-stable 僅適用於套件。                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | 僅針對這次更新覆寫套件目標。它不能與有效的 `extended-stable` 通道合併使用，因為該通道必須使用已驗證的精確目標。對於其他套件安裝，`main` 會對應到 `github:openclaw/openclaw#main`；GitHub/git 來源規格會先打包成暫存 tarball，再進行分段式全域 npm 安裝。 |
| `--dry-run`                                      | 預覽規劃的動作（通道/標籤/目標/重新啟動流程），不寫入設定、不安裝、不同步外掛，也不重新啟動。                                                                                                                                                                                                                |
| `--json`                                         | 輸出機器可讀的 `UpdateRunResult` JSON。當受管理外掛需要修復時，包含 `postUpdate.plugins.warnings`、beta 通道外掛後援詳細資料，以及在更新後同步期間偵測到 npm 外掛成品漂移時的 `postUpdate.plugins.integrityDrifts`。                                                                 |
| `--timeout <seconds>`                            | 每個步驟的逾時時間。預設為 `1800`。                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | 略過確認提示（例如降級確認）。                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | 允許更新後外掛同步在沒有互動提示的情況下越過社群 ClawHub 信任警告並繼續。若未使用此選項，當 OpenClaw 無法提示時，具風險的社群版本會被略過並保持不變。官方 ClawHub 套件和內建外掛來源會略過此提示。                                                     |

沒有 `--verbose` 旗標。使用 `--dry-run` 預覽規劃的動作、
使用 `--json` 取得機器可讀結果，並使用 `openclaw update status --json`
僅查看通道/可用性。閘道主控台詳細程度（`--verbose`）和
檔案記錄層級（`logging.level: "debug"`/`"trace"`）是獨立控制項；請參閱
[閘道記錄](/zh-TW/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，會變更狀態的 `openclaw update` 執行會被停用。請改為更新此安裝的 Nix 來源或 flake 輸入；若使用 nix-openclaw，請使用 agent-first [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍維持唯讀。
</Note>

<Warning>
降級需要確認，因為較舊版本可能會破壞設定。
</Warning>

## `update status`

顯示作用中的更新通道、git 標籤/分支/SHA（僅來源 checkout），
以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| 旗標                  | 預設值 | 說明                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | 輸出機器可讀的狀態 JSON。 |
| `--timeout <seconds>` | `3`     | 檢查逾時時間。                 |

對於 extended-stable 套件安裝，status 會執行與前景更新相同的公開選擇器
和精確套件驗證。當已安裝版本較新時，它可以回報
`ahead of extended-stable`。JSON 失敗包含 `registry.reason`（`selector_missing`、`selector_query_failed`、
`exact_package_mismatch` 或 `unsupported_git_channel`）。

## `update repair`

在核心套件已變更、但後續修復工作未乾淨完成後，重新執行更新收尾作業。當
`openclaw update` 已安裝新的核心套件，但核心後外掛同步、
受管理 npm 外掛中繼資料、登錄檔重新整理或 doctor 修復未收斂時，
這是受支援的復原路徑。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| 旗標                                             | 說明                                                                                                                                                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | 在修復前保存核心更新通道。對於 extended-stable，外掛收斂會暫時以 stable/latest 外掛線為目標。Extended-stable 修復在 Git checkout 上會被拒絕，且不會變更設定。 |
| `--json`                                         | 輸出機器可讀的收尾 JSON。                                                                                                                                                                              |
| `--timeout <seconds>`                            | 修復步驟的逾時時間。預設為 `1800`。                                                                                                                                                                              |
| `--yes`                                          | 略過確認提示。                                                                                                                                                                                             |
| `--acknowledge-clawhub-risk`                     | 與 `openclaw update` 上的行為相同。                                                                                                                                                                                 |
| `--no-restart`                                   | 為了對等性而接受；repair 永遠不會重新啟動閘道。                                                                                                                                                                |

`update repair` 會執行 `openclaw doctor --fix`、重新載入已修復的設定和
安裝記錄、同步作用中更新通道的已追蹤外掛、更新
受管理的 npm 外掛安裝、修復缺少的已設定外掛承載資料、
重新整理外掛登錄檔，並寫入已收斂的安裝記錄中繼資料。
它不會安裝新的核心套件，也不會重新啟動閘道。

## `update wizard`

互動流程，用於選擇更新通道，並確認之後是否重新啟動
閘道（預設為重新啟動）。在沒有 git checkout 的情況下選取 `dev`
會提供建立 checkout 的選項。

| 旗標                  | 預設值 | 說明                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | 每個更新步驟的逾時時間。 |

## 它會做什麼

明確切換通道（`--channel ...`）也會保持安裝方式一致：

- `dev` -> 確保有 git checkout（預設為 `~/openclaw`，或在設定
  `OPENCLAW_HOME` 時使用 `$OPENCLAW_HOME/openclaw`；可用
  `OPENCLAW_GIT_DIR` 覆寫）、更新它，並從該
  checkout 安裝全域命令列介面。
- `stable` -> 使用 `latest` 從 npm 安裝。
- `extended-stable` -> 解析公開 npm `extended-stable` 選擇器、
  驗證精確選取的套件，並安裝該精確版本。它
  不會後援到其他選擇器，且會拒絕用於 Git checkout。
- `beta` -> 偏好 npm dist-tag `beta`，當 beta
  缺少或早於目前 stable 版本時，後援到 `latest`。

### 重新啟動交接

閘道核心自動更新器（透過設定啟用時）會在即時閘道請求處理器之外
啟動命令列介面更新路徑。控制平面
`update.run` 套件管理器更新和受監督的 git-checkout 更新會使用
相同的受管理服務交接，而不是在即時閘道程序內取代套件樹或
重建 `dist/`：閘道會啟動一個分離的輔助程序並退出，
該輔助程序會從閘道程序樹之外執行 `openclaw update --yes --json`。
如果無法交接，`update.run` 會傳回結構化回應，其中包含可手動執行的安全 shell 命令。

Extended-stable 會刻意排除於啟動檢查和背景
自動更新排程之外。明確的前景更新、使用已儲存
`update.channel: "extended-stable"` 的裸前景更新、隨選狀態，以及受管理
閘道交接仍受支援。

當已安裝本機受管理閘道服務且已啟用重新啟動時，
套件管理器和 git-checkout 更新會先停止執行中的服務，再
取代套件樹或變更 checkout/build 輸出。更新器
接著會重新整理服務中繼資料、重新啟動服務，並在回報
`Gateway: restarted and verified.` 前驗證重新啟動的閘道。
套件管理器更新還會驗證重新啟動的閘道回報
預期套件版本；git-checkout 更新會在重建後驗證閘道健康狀態和
服務就緒狀態。

在 macOS 上，更新後檢查也會驗證 LaunchAgent 是否已針對作用中的設定檔載入/執行，以及已設定的回送連接埠是否健康。如果 plist 已安裝但 launchd 並未監管它，OpenClaw 會自動重新啟動 LaunchAgent，並重新執行健康狀態/版本/通道就緒檢查（全新啟動會直接載入 `RunAtLoad` 工作，因此復原不會立即對新產生的閘道執行 `kickstart -k`）。如果閘道仍未變為健康狀態，命令會以非零值結束，並列印重新啟動記錄路徑，以及重新啟動、重新安裝和套件復原指示。

如果無法執行重新啟動，命令會列印 `Gateway: restart skipped (...)` 或 `Gateway: restart failed: ...`，並提示可手動執行 `openclaw gateway restart`。使用 `--no-restart` 時，套件替換或 git 重新建置仍會執行，但受管理的服務不會被停止或重新啟動，因此正在執行的閘道會保留舊程式碼，直到你手動重新啟動它。

### 控制平面回應形狀

當 `update.run` 透過套件管理器安裝或受監管的 git checkout 上的閘道控制平面執行時，處理常式會將交接啟動與閘道結束後繼續進行的命令列介面更新分開回報：

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"`, and
  `handoff.status: "started"`：閘道已建立受管理服務交接，並排程自身重新啟動，讓分離的輔助程式能在即時服務程序之外執行
  `openclaw update --yes --json`。
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"`, and
  `handoff.status: "unavailable"`：OpenClaw 找不到可安全交接的監管服務邊界和持久服務身分（例如，systemd 交接需要 `OPENCLAW_SYSTEMD_UNIT` 單元身分，而不只是環境中的 systemd 程序標記）。回應會包含
  `handoff.command`，也就是要從閘道外部執行的 shell 命令。
- `ok: false`, `result.reason: "managed-service-handoff-failed"`：閘道嘗試建立交接，但無法產生分離的輔助程式。

`sentinel` 承載會在閘道結束前寫入，而命令列介面交接會在受管理服務重新啟動健康檢查完成後更新同一個重新啟動 sentinel。交接期間，sentinel 可以帶有 `stats.reason: "restart-health-pending"`，且沒有成功延續；重新啟動的閘道會輪詢它，並且只有在命令列介面已驗證服務健康狀態並以最終 `ok` 結果重寫 sentinel 後，才會觸發延續。當該 sentinel 擱置或失敗時，`openclaw status` 和 `openclaw status --all` 會顯示 `Update restart` 列，而 `update.status` 會重新整理並傳回最新 sentinel。

## Git checkout 流程

### 通道選擇

- `stable`：checkout 最新的非 beta 標籤，然後建置並執行 doctor。
- `beta`：優先使用最新的 `-beta` 標籤，當 beta 缺少或較舊時，退回最新的 stable 標籤。
- `dev`：checkout `main`，然後擷取並 rebase。
- `extended-stable`：Git checkout 不支援；不會發生 checkout 變更。

### 更新步驟

<Steps>
  <Step title="Verify clean worktree">
    要求沒有未提交的變更。
  </Step>
  <Step title="Switch channel">
    切換到所選通道（標籤或分支）。
  </Step>
  <Step title="Fetch upstream">
    僅限 dev。
  </Step>
  <Step title="Preflight build (dev only)">
    在暫存 worktree 中執行 TypeScript 建置。如果 tip 失敗，會往回最多 10 個提交以找出最新可建置的提交。設定 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也會在此前置檢查期間執行 lint；lint 會以受限的序列模式執行，因為使用者更新主機通常比 CI runner 更小。
  </Step>
  <Step title="Rebase">
    Rebase 到所選提交（僅限 dev）。
  </Step>
  <Step title="Install dependencies">
    使用 repo 套件管理器。對於 pnpm checkout，更新程式會視需要啟動 `pnpm`（先透過 `corepack`，再退回暫時的 `npm install pnpm@11`），而不是在 pnpm workspace 內執行 `npm run build`。如果 pnpm 啟動仍失敗，更新程式會提早停止並顯示套件管理器專屬錯誤，而不是嘗試在 checkout 中執行 `npm run build`。
  </Step>
  <Step title="Build Control UI">
    建置閘道和 Control UI。
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="Sync plugins">
    將外掛同步到作用中通道。Dev 使用 bundled 外掛；stable 和 beta 使用 npm。更新已追蹤的外掛安裝。
  </Step>
</Steps>

### 外掛同步詳細資訊

在 beta 通道上，遵循 default/latest 線的已追蹤 npm 和 ClawHub 外掛安裝會先嘗試外掛 `@beta` 發行版。如果外掛沒有 beta 發行版，OpenClaw 會退回已記錄的 default/latest 規格並回報警告。對於 npm 外掛，當 beta 套件存在但安裝驗證失敗時，OpenClaw 也會退回。這些退回警告不會使核心更新失敗。精確版本和明確標籤絕不會被重寫。

<Warning>
如果精確釘選的 npm 外掛更新解析到的成品，其完整性與儲存的安裝記錄不同，`openclaw update` 會中止該外掛成品更新，而不是安裝它。只有在確認你信任新成品後，才明確重新安裝或更新該外掛。
</Warning>

<Note>
更新後外掛同步失敗若限定於受管理外掛，且同步路徑可以繞過（例如非必要外掛的 npm registry 無法連線），會在核心更新成功後回報為警告。JSON 結果會保留頂層更新 `status: "ok"`，並回報 `postUpdate.plugins.status: "warning"`，同時提供 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 指引。非預期的更新程式或同步例外仍會使更新結果失敗。修正外掛安裝或更新錯誤後，重新執行 `openclaw update repair`。

在每個外掛同步步驟之後，`openclaw update` 會在閘道重新啟動前執行必要的 **核心後收斂** 階段：它會修復缺少的已設定外掛承載、驗證磁碟上每筆 _作用中_ 已追蹤安裝記錄，並靜態驗證其 `package.json` 可解析（以及任何明確宣告的 `main` 存在）。此階段的失敗以及無效的設定快照會傳回 `postUpdate.plugins.status: "error"`，並將頂層更新 `status` 轉為 `"error"`，因此 `openclaw update` 會以非零值結束，且閘道 _不會_ 以未驗證的外掛集合重新啟動。錯誤會包含結構化的 `postUpdate.plugins.warnings[].guidance` 行，指向 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json`。停用的外掛項目，以及不是 trusted-source-linked 官方同步目標的記錄，會在此略過（對應缺少承載檢查所使用的 `skipDisabledPlugins` 政策），因此過時的已停用外掛記錄不會阻擋其他有效更新。

更新後的閘道啟動時，外掛載入僅進行驗證：啟動不會執行套件管理器或變更相依性樹。套件管理器 `update.run` 重新啟動會交給命令列介面的受管理服務路徑，因此套件替換會在舊閘道程序之外發生，而服務健康檢查會決定更新是否可回報為完成。
</Note>

extended-stable 核心更新成功後，核心後外掛完整性與收斂仍會執行，但官方外掛會暫時指向 stable/latest 線。OpenClaw 在此版本中不會查詢外掛 `@extended-stable` 選擇器。

對於套件管理器安裝，`openclaw update` 會在呼叫套件管理器前解析目標套件版本。npm 全域安裝使用分段式安裝：OpenClaw 會將新套件安裝到暫時的 npm prefix，在其中驗證封裝的 `dist` inventory，然後將乾淨的套件樹替換到真正的全域 prefix。如果驗證失敗，更新後 doctor、外掛同步和重新啟動工作不會從可疑的樹執行。即使已安裝版本已符合目標，命令仍會重新整理全域套件安裝，然後執行外掛同步、核心命令補完重新整理，以及重新啟動工作。這會讓封裝的 sidecar 和通道所擁有的外掛記錄與已安裝的 OpenClaw 建置保持一致，同時將完整外掛命令補完重建留給明確的
`openclaw completion --write-state` 執行。

## 相關

- `openclaw doctor`（在 git checkout 上會提議先執行 update）
- [開發通道](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [命令列介面參考](/zh-TW/cli)
