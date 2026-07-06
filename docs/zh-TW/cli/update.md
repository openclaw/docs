---
read_when:
    - 你想要安全地更新原始碼 checkout
    - 你正在偵錯 `openclaw update` 輸出或選項
    - 你需要了解 `--update` 簡寫行為
summary: '`openclaw update` 的命令列介面參考（相對安全的來源更新 + 閘道自動重新啟動）'
title: 更新
x-i18n:
    generated_at: "2026-07-06T10:49:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6abbb32f8b8132abb73dc1699d341a275e54613f18523bce4cba574d75232c2
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

更新 OpenClaw，並在 stable/extended-stable/beta/dev 通道之間切換。

如果你是透過 **npm/pnpm/bun** 安裝（全域安裝，沒有 git 中繼資料），
更新會使用 [更新](/zh-TW/install/updating) 中說明的套件管理器流程。

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

`openclaw --update` 會重寫為 `openclaw update`（對 shell 和啟動器指令碼很有用）。

## 選項

| 旗標                                             | 說明                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | 成功更新後略過重新啟動閘道服務。會重新啟動的套件管理器更新，會在命令成功前驗證重新啟動的服務回報預期版本。                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | 設定更新通道，並在核心更新成功後保存。Extended-stable 僅適用於套件。                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | 僅覆寫本次更新的套件目標。它不能與有效的 `extended-stable` 通道併用，因為該通道必須使用已驗證的精確目標。對其他套件安裝，`main` 會對應到 `github:openclaw/openclaw#main`；GitHub/git 來源規格會先封裝成暫存 tarball，再進行分階段的全域 npm 安裝。 |
| `--dry-run`                                      | 預覽計畫動作（通道/標籤/目標/重新啟動流程），但不寫入設定、不安裝、不同步外掛，也不重新啟動。                                                                                                                                                                                                                |
| `--json`                                         | 列印機器可讀的 `UpdateRunResult` JSON。當受管理外掛需要修復時，會包含 `postUpdate.plugins.warnings`；也包含 beta 通道外掛 fallback 詳細資料，以及在更新後同步期間偵測到 npm 外掛成品漂移時的 `postUpdate.plugins.integrityDrifts`。                                                                 |
| `--timeout <seconds>`                            | 每個步驟的逾時時間。預設值 `1800`。                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | 略過確認提示（例如降級確認）。                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | 允許更新後外掛同步在社群 ClawHub 信任警告之後繼續，而不顯示互動式提示。若未使用此旗標，當 OpenClaw 無法提示時，風險較高的社群版本會被略過並保持不變。官方 ClawHub 套件和 bundled 外掛來源會略過此提示。                                                     |

沒有 `--verbose` 旗標。使用 `--dry-run` 預覽計畫動作，
使用 `--json` 取得機器可讀結果，並使用 `openclaw update status --json`
只查看通道/可用性。閘道主控台詳細程度（`--verbose`）和
檔案日誌層級（`logging.level: "debug"`/`"trace"`）是獨立控制項；請參閱
[閘道日誌](/zh-TW/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，會改變狀態的 `openclaw update` 執行會被停用。請改為更新此安裝的 Nix 來源或 flake 輸入；對 nix-openclaw，請使用 agent-first [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍維持唯讀。
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
| `--json`              | `false` | 列印機器可讀的狀態 JSON。 |
| `--timeout <seconds>` | `3`     | 檢查的逾時時間。                 |

對 extended-stable 套件安裝，狀態會執行與前景更新相同的公開選擇器
和精確套件驗證。當已安裝版本較新時，它可以回報
`ahead of extended-stable`。JSON 失敗會包含 `registry.reason`（`selector_missing`、`selector_query_failed`、
`exact_package_mismatch` 或 `unsupported_git_channel`）。

## `update repair`

在核心套件已變更但後續修復工作未乾淨完成後，重新執行更新最終化。
當 `openclaw update` 已安裝新的核心套件，但核心後外掛同步、
受管理 npm 外掛中繼資料、registry 重新整理或 doctor 修復未收斂時，這是支援的復原路徑。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| 旗標                                             | 說明                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | 在修復前保存核心更新通道。對 extended-stable，符合資格且遵循 bare/default 或 `latest` 意圖的官方 npm 外掛，會以已安裝核心的精確版本為目標。在 Git checkout 上，extended-stable 修復會被拒絕，且不變更設定。 |
| `--json`                                         | 列印機器可讀的最終化 JSON。                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | 修復步驟的逾時時間。預設值 `1800`。                                                                                                                                                                                                                           |
| `--yes`                                          | 略過確認提示。                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | 與 `openclaw update` 上的行為相同。                                                                                                                                                                                                                              |
| `--no-restart`                                   | 為對齊介面而接受；修復永遠不會重新啟動閘道。                                                                                                                                                                                                             |

`update repair` 會執行 `openclaw doctor --fix`、重新載入已修復的設定和
安裝記錄、為作用中更新通道同步追蹤的外掛、更新
受管理 npm 外掛安裝、修復缺少的已設定外掛 payload、
重新整理外掛 registry，並寫入已收斂的安裝記錄中繼資料。
它不會安裝新的核心套件，也不會重新啟動閘道。

## `update wizard`

用於選擇更新通道，並確認之後是否重新啟動
閘道的互動式流程（預設重新啟動）。在沒有 git
checkout 的情況下選取 `dev` 時，會提議建立一個。

| 旗標                  | 預設值 | 說明                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | 每個更新步驟的逾時時間。 |

## 它會做什麼

明確切換通道（`--channel ...`）也會讓安裝方式保持一致：

- `dev` -> 確保 git checkout（預設 `~/openclaw`，或設定 `OPENCLAW_HOME` 時的
  `$OPENCLAW_HOME/openclaw`；可用 `OPENCLAW_GIT_DIR` 覆寫），更新它，並從該
  checkout 安裝全域命令列介面。
- `stable` -> 使用 `latest` 從 npm 安裝。
- `extended-stable` -> 解析公開 npm `extended-stable` selector，
  驗證精確選取的套件，並安裝該精確版本。它
  不會 fallback 到其他 selector，且會拒絕 Git checkout。
- `beta` -> 優先使用 npm dist-tag `beta`；當 beta
  缺失或比目前 stable 版本更舊時，fallback 到 `latest`。

### 重新啟動交接

閘道核心自動更新器（透過設定啟用時）會在即時閘道請求處理器之外啟動命令列介面
更新路徑。控制平面
`update.run` 套件管理器更新和受監督的 git-checkout 更新，會使用
相同的受管理服務交接，而不是在即時閘道行程內取代套件樹或
重新建置 `dist/`：閘道會啟動一個
分離的 helper 並退出，該 helper 會從閘道行程樹之外執行 `openclaw update --yes --json`。
如果交接不可用，
`update.run` 會回傳結構化回應，其中包含可手動執行的安全 shell 命令。

Extended-stable 會刻意排除於啟動檢查和背景
自動更新排程之外。明確的前景更新、帶有已儲存 `update.channel: "extended-stable"` 的 bare 前景更新、隨選狀態，以及受管理
閘道交接仍受支援。

安裝本機受管理的閘道服務且已啟用重新啟動時，
套件管理器與 git checkout 更新會在取代套件樹或變更 checkout/build 輸出之前，
先停止執行中的服務。更新器接著會重新整理服務中繼資料、重新啟動服務，並在回報
`Gateway: restarted and verified.` 之前驗證重新啟動的閘道。
套件管理器更新還會驗證重新啟動的閘道回報了預期的套件版本；git checkout 更新則會在重建後驗證閘道健康狀態與服務就緒狀態。

在 macOS 上，更新後檢查也會驗證 LaunchAgent 已針對作用中的設定檔
載入/執行，且設定的 loopback 連接埠健康。如果 plist 已安裝但 launchd 未監督它，OpenClaw
會自動重新 bootstrap LaunchAgent，並重新執行健康狀態/版本/
channel 就緒檢查（全新的 bootstrap 會直接載入 `RunAtLoad` 工作，
因此復原不會立即對新生成的閘道執行 `kickstart -k`）。如果
閘道仍未變得健康，命令會以非零狀態結束，並印出重新啟動記錄路徑，以及重新啟動、重新安裝和套件回復指示。

如果無法執行重新啟動，命令會印出 `Gateway: restart skipped (...)` 或
`Gateway: restart failed: ...`，並提示可手動執行 `openclaw gateway restart`。
使用 `--no-restart` 時，套件取代或 git 重建仍會執行，但受管理服務不會被停止或重新啟動，因此執行中的閘道會繼續使用舊程式碼，直到你手動重新啟動它。

### 控制平面回應形狀

當 `update.run` 在套件管理器安裝或受監督的 git checkout 中透過閘道控制平面執行時，處理器會將 handoff 啟動與閘道結束後繼續進行的命令列介面更新分開回報：

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"`，以及
  `handoff.status: "started"`：閘道已建立受管理服務 handoff
  並排程自身重新啟動，讓分離的輔助程式可在即時服務程序外執行
  `openclaw update --yes --json`。
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"`，以及
  `handoff.status: "unavailable"`：OpenClaw 找不到可安全 handoff 的監督服務邊界與持久服務身分（例如 systemd handoff 需要 `OPENCLAW_SYSTEMD_UNIT` 單元身分，
  而不只是環境中的 systemd 程序標記）。回應包含
  `handoff.command`，也就是要從閘道外部執行的 shell 命令。
- `ok: false`, `result.reason: "managed-service-handoff-failed"`：閘道
  嘗試建立 handoff，但無法生成分離的輔助程式。

`sentinel` 酬載會在閘道結束前寫入，而命令列介面
handoff 更新會在受管理服務重新啟動健康檢查完成後，更新同一個重新啟動 sentinel。handoff 期間，sentinel 可能帶有
`stats.reason: "restart-health-pending"`，且沒有成功 continuation；
重新啟動的閘道會輪詢它，並且只有在命令列介面已驗證服務健康狀態，並以最終 `ok` 結果重寫 sentinel 後才觸發 continuation。
`openclaw status` 和 `openclaw status --all` 會在該 sentinel 擱置或失敗時顯示 `Update restart` 列，
而 `update.status` 會重新整理並回傳最新的 sentinel。

## Git checkout 流程

### Channel 選擇

- `stable`：checkout 最新的非 beta 標籤，然後 build 和 doctor。
- `beta`：優先使用最新的 `-beta` 標籤；若 beta 缺失或較舊，則 fallback 到最新 stable 標籤。
- `dev`：checkout `main`，然後 fetch 並 rebase。
- `extended-stable`：不支援 Git checkout；不會發生 checkout 變更。

### 更新步驟

<Steps>
  <Step title="驗證乾淨的工作樹">
    要求沒有未提交的變更。
  </Step>
  <Step title="切換 channel">
    切換到選取的 channel（標籤或分支）。
  </Step>
  <Step title="Fetch upstream">
    僅限 dev。
  </Step>
  <Step title="預檢建置（僅限 dev）">
    在暫存工作樹中執行 TypeScript build。如果 tip 失敗，會往回最多 10 個 commit，以找出最新可 build 的 commit。設定 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也會在此預檢期間執行 lint；lint 會以受限的序列模式執行，因為使用者更新主機通常比 CI 執行器更小。
  </Step>
  <Step title="Rebase">
    Rebase 到選取的 commit（僅限 dev）。
  </Step>
  <Step title="安裝相依套件">
    使用 repo 套件管理器。對於 pnpm checkout，更新器會按需 bootstrap `pnpm`（先透過 `corepack`，再 fallback 到暫時的 `npm install pnpm@11`），而不是在 pnpm workspace 內執行 `npm run build`。如果 pnpm bootstrap 仍然失敗，更新器會提早停止並顯示套件管理器專屬錯誤，而不是嘗試在 checkout 中執行 `npm run build`。
  </Step>
  <Step title="Build Control UI">
    Build 閘道與 Control UI。
  </Step>
  <Step title="執行 doctor">
    `openclaw doctor` 會作為最後的安全更新檢查執行。
  </Step>
  <Step title="同步外掛">
    將外掛同步到作用中的 channel。Dev 使用 bundled 外掛；stable 與 beta 使用 npm。更新追蹤的外掛安裝。
  </Step>
</Steps>

### 外掛同步詳細資料

在 beta channel 上，遵循 default/latest 線的已追蹤 npm 與 ClawHub 外掛安裝，會先嘗試外掛 `@beta` release。如果外掛沒有 beta release，OpenClaw 會 fallback 到記錄的 default/latest spec，並回報警告。對於 npm 外掛，當 beta package 存在但安裝驗證失敗時，OpenClaw 也會 fallback。這些 fallback 警告不會使核心更新失敗。精確版本與明確標籤永遠不會被重寫。

<Warning>
如果精確 pinned 的 npm 外掛更新解析到的 artifact，其 integrity 與儲存的安裝記錄不同，`openclaw update` 會中止該外掛 artifact 更新，而不是安裝它。請只在驗證你信任新的 artifact 後，才明確重新安裝或更新該外掛。
</Warning>

<Note>
更新後的外掛同步失敗若限定於受管理外掛，且同步路徑可繞過（例如非必要外掛的 npm registry 無法連線），會在核心更新成功後回報為警告。JSON 結果會保留頂層更新 `status: "ok"`，並以 `postUpdate.plugins.status: "warning"` 回報，同時提供 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 指引。非預期的更新器或同步例外仍會使更新結果失敗。修正外掛安裝或更新錯誤後，重新執行 `openclaw update repair`。

在逐外掛同步步驟之後，`openclaw update` 會在閘道重新啟動前執行強制的 **核心後收斂** pass：它會修復缺失的已設定外掛酬載、驗證磁碟上每筆 _active_ 已追蹤安裝記錄，並靜態驗證其 `package.json` 可解析（以及任何明確宣告的 `main` 存在）。此 pass 的失敗，以及無效的 config snapshot，會回傳 `postUpdate.plugins.status: "error"` 並將頂層更新 `status` 翻轉為 `"error"`，因此 `openclaw update` 會以非零狀態結束，且閘道 _不會_ 以未驗證的外掛集合重新啟動。錯誤包含結構化的 `postUpdate.plugins.warnings[].guidance` 行，指向 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json`。停用的外掛項目，以及不是 trusted-source-linked 官方同步目標的記錄，會在這裡略過（與缺失酬載檢查使用的 `skipDisabledPlugins` policy 相同），因此陳舊的停用外掛記錄無法阻擋原本有效的更新。

當更新後的閘道啟動時，外掛載入僅為驗證：startup 不會執行套件管理器或變更相依套件樹。套件管理器 `update.run` 重新啟動會交給命令列介面的受管理服務路徑，因此套件交換會發生在舊閘道程序外，而服務健康檢查會決定是否可將更新回報為完成。
</Note>

extended-stable 核心更新成功後，核心後外掛 integrity 與
convergence 會以已安裝核心的精確版本為目標，套用到符合資格的官方 npm 外掛。對於 default/`latest` intent，OpenClaw 不會查詢外掛
`@extended-stable` 或 fallback 到 npm `latest`；它會從已安裝核心推導套件版本。明確版本 pin、明確的非 `latest` 標籤、
third-party package，以及非 npm source 會保留其既有 intent。

對於套件管理器安裝，`openclaw update` 會在叫用套件管理器前解析目標套件版本。npm global install 使用 staged
install：OpenClaw 會將新套件安裝到暫時的 npm prefix，
在那裡驗證 packaged `dist` inventory，然後將該乾淨的套件樹交換到真正的 global prefix。若驗證失敗，post-update doctor、
外掛同步與重新啟動工作不會從可疑的樹執行。即使已安裝版本已符合目標，命令也會重新整理
global package install，然後執行外掛同步、core-command completion
refresh，以及重新啟動工作。這會讓 packaged sidecar 與 channel-owned
外掛記錄和已安裝的 OpenClaw build 保持一致，同時將完整的
plugin-command completion rebuild 留給明確的
`openclaw completion --write-state` 執行。

## 相關

- `openclaw doctor`（在 git checkout 上提供先執行 update）
- [開發 channel](/zh-TW/install/development-channels)
- [更新](/zh-TW/install/updating)
- [命令列介面參考](/zh-TW/cli)
