---
read_when:
    - 在本機執行 pnpm openclaw qa matrix
    - 新增或選取 Matrix QA 情境
    - 分類處理 Matrix QA 失敗、逾時或卡住的清理作業
summary: 由 Docker 支援的 Matrix 即時 QA 路徑維護者參考資料：CLI、設定檔、環境變數、情境與輸出成品。
title: Matrix 品質保證
x-i18n:
    generated_at: "2026-05-06T02:46:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA lane 會在 Docker 中以一次性的 Tuwunel homeserver 執行隨附的 `@openclaw/matrix` Plugin，並使用臨時的 driver、SUT 與 observer 帳戶，以及預先建立的房間。這是 Matrix 的即時真實傳輸覆蓋。

這是僅供維護者使用的工具。封裝版 OpenClaw 發行版本會刻意省略 `qa-lab`，因此 `openclaw qa` 只能從原始碼簽出使用。原始碼簽出會直接載入隨附的執行器 - 不需要 Plugin 安裝步驟。

如需更完整的 QA 框架背景，請參閱 [QA 概觀](/zh-TW/concepts/qa-e2e-automation)。

## 快速開始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

單純執行 `pnpm openclaw qa matrix` 會使用 `--profile all`，且不會在第一個失敗時停止。發行閘道請使用 `--profile fast --fail-fast`；平行執行完整清單時，可用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 將目錄分片。

## 此 lane 的動作

1. 在 Docker 中佈建一次性的 Tuwunel homeserver（預設映像檔 `ghcr.io/matrix-construct/tuwunel:v1.5.1`、伺服器名稱 `matrix-qa.test`、連接埠 `28008`）。
2. 註冊三個臨時使用者 - `driver`（傳送入站流量）、`sut`（受測的 OpenClaw Matrix 帳戶）、`observer`（第三方流量擷取）。
3. 建立所選情境需要的房間（main、threading、media、restart、secondary、allowlist、E2EE、verification DM 等）。
4. 啟動子 OpenClaw Gateway，將真正的 Matrix Plugin 限定到 SUT 帳戶；子行程不會載入 `qa-channel`。
5. 依序執行情境，並透過 driver/observer Matrix 用戶端觀察事件。
6. 關閉 homeserver、寫入報告與摘要成品，然後結束。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 常用旗標

| 旗標                  | 預設值                                       | 說明                                                                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 情境設定檔。請參閱 [設定檔](#profiles)。                                                                           |
| `--fail-fast`         | 關閉                                           | 在第一個失敗的檢查或情境後停止。                                                                         |
| `--scenario <id>`     | -                                             | 只執行此情境。可重複使用。請參閱 [情境](#scenarios)。                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 報告、摘要、觀察到的事件與輸出日誌寫入的位置。相對路徑會以 `--repo-root` 為基準解析。 |
| `--repo-root <path>`  | `process.cwd()`                               | 從中立工作目錄叫用時的儲存庫根目錄。                                                        |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 設定中的 Matrix 帳戶 id。                                                                        |

### 供應者旗標

此 lane 使用真正的 Matrix 傳輸，但可設定模型供應者：

| 旗標                     | 預設值          | 說明                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` 用於確定性的 mock dispatch，或 `live-frontier` 用於即時 frontier 供應者。舊別名 `live-openai` 仍可使用。 |
| `--model <ref>`          | 供應者預設值 | 主要 `provider/model` ref。                                                                                                             |
| `--alt-model <ref>`      | 供應者預設值 | 情境在執行中途切換時使用的替代 `provider/model` ref。                                                                            |
| `--fast`                 | 關閉              | 在支援時啟用供應者快速模式。                                                                                                |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。此 lane 會在本機佈建一次性使用者；沒有可租用的共享憑證池。

## 設定檔

所選的設定檔會決定要執行哪些情境。

| 設定檔         | 使用時機                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（預設） | 完整目錄。速度較慢但覆蓋完整。                                                                                                                                                                                                   |
| `fast`          | 發行閘道子集，用於測試即時傳輸合約：canary、提及閘控、allowlist 封鎖、回覆形狀、重啟續接、thread 後續回覆、thread 隔離、reaction 觀察，以及 exec 核准中繼資料傳遞。 |
| `transport`     | 傳輸層級的 threading、DM、room、autojoin、mention/allowlist、approval 與 reaction 情境。                                                                                                                                  |
| `media`         | 圖片、音訊、影片、PDF、EPUB 附件覆蓋。                                                                                                                                                                                  |
| `e2ee-smoke`    | 最低 E2EE 覆蓋 - 基本加密回覆、thread 後續回覆、bootstrap 成功。                                                                                                                                                  |
| `e2ee-deep`     | 完整的 E2EE 狀態遺失、備份、金鑰與復原情境。                                                                                                                                                                     |
| `e2ee-cli`      | 透過 QA harness 驅動的 `openclaw matrix encryption setup` 與 `verify *` CLI 情境。                                                                                                                                       |

確切對應位於 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## 情境

完整情境 id 清單是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` 中的 `MatrixQaScenarioId` union。類別包括：

- threading - `matrix-thread-*`、`matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- streaming 與工具進度 - `matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- media - `matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- approvals - `matrix-approval-*`（exec/Plugin 中繼資料、分塊 fallback、deny reactions、threads，以及 `target: "both"` routing）
- restart 與 replay - `matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- mention gating、bot-to-bot 與 allowlists - `matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*`（基本回覆、thread 後續回覆、bootstrap、復原金鑰生命週期、狀態遺失變體、伺服器備份行為、裝置衛生、SAS / QR / DM 驗證、restart、成品遮蔽）
- E2EE CLI - `matrix-e2ee-cli-*`（encryption setup、idempotent setup、bootstrap failure、recovery-key lifecycle、multi-account、gateway-reply round-trip、self-verification）

傳入 `--scenario <id>`（可重複）以執行手動挑選的集合；搭配 `--profile all` 可忽略設定檔閘控。

## 環境變數

| 變數                                    | 預設值                                    | 作用                                                                                                                                                                                               |
| --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分鐘）                      | 整次執行的硬性上限。                                                                                                                                                                               |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初始 canary 回覆的上限。Release CI 會在共享 runner 上提高此值，避免緩慢的第一次 Gateway 回合在情境覆蓋開始前就失敗。                                                                              |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 用於負向無回覆斷言的安靜視窗。會限制為 `≤` 執行逾時。                                                                                                                                             |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 清理的上限。失敗輸出會包含復原用的 `docker compose ... down --remove-orphans` 命令。                                                                                                        |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 驗證不同 Tuwunel 版本時覆寫 homeserver 映像。                                                                                                                                                      |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 開啟                                      | `0` 會靜音 stderr 上的 `[matrix-qa] ...` 進度列。`1` 會強制開啟。                                                                                                                                  |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已遮罩                                    | `1` 會在 `matrix-qa-observed-events.json` 中保留訊息本文與 `formatted_body`。預設會遮罩以確保 CI 成品安全。                                                                                        |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 關閉                                      | `1` 會略過成品寫入後的確定性 `process.exit`。預設會強制結束，因為 matrix-js-sdk 的原生加密 handle 可能讓 event loop 在成品完成後仍保持存活。                                                       |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未設定                                    | 由外層啟動器（例如 `scripts/run-node.mjs`）設定時，Matrix QA 會重用該日誌路徑，而不是啟動自己的 tee。                                                                                              |

## 輸出成品

寫入至 `--output-dir`：

- `matrix-qa-report.md` - Markdown 協定報告（通過、失敗、略過的項目，以及原因）。
- `matrix-qa-summary.json` - 適合 CI 解析與儀表板使用的結構化摘要。
- `matrix-qa-observed-events.json` - 來自 driver 與 observer 用戶端的已觀察 Matrix 事件。除非設定 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否則本文會被遮罩；approval 中繼資料會以選定的安全欄位與截斷的命令預覽摘要呈現。
- `matrix-qa-output.log` - 執行中的合併 stdout/stderr。如果設定了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，則會改為重用外層啟動器的日誌。

預設輸出目錄為 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此連續執行不會互相覆寫。

## 分診提示

- **執行在接近結尾時停住：** `matrix-js-sdk` 的原生加密 handle 可能比 harness 活得更久。預設會在成品寫入後強制乾淨的 `process.exit`；如果你已取消設定 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，預期程序會停留一段時間。
- **清理錯誤：** 尋找列印出的復原命令（一次 `docker compose ... down --remove-orphans` 呼叫），並手動執行以釋放 homeserver 連接埠。
- **CI 中負向斷言視窗不穩定：** CI 速度快時降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（預設 8 秒）；在緩慢的共享 runner 上提高它。
- **需要用於錯誤報告的已遮罩本文：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新執行，並附上 `matrix-qa-observed-events.json`。請將產生的成品視為敏感資料。
- **不同的 Tuwunel 版本：** 將 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向測試中的版本。此 lane 只檢查已固定的預設映像。

## 即時傳輸契約

Matrix 是三個即時傳輸 lane（Matrix、Telegram、Discord）之一，這些 lane 共享一份在 [QA 概覽 → 即時傳輸覆蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage) 中定義的單一契約檢查清單。`qa-channel` 仍然是廣泛的合成測試套件，且刻意不屬於該矩陣的一部分。

## 相關

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) - 整體 QA 堆疊與即時傳輸契約
- [QA Channel](/zh-TW/channels/qa-channel) - 用於 repo-backed 情境的合成 channel adapter
- [測試](/zh-TW/help/testing) - 執行測試並新增 QA 覆蓋範圍
- [Matrix](/zh-TW/channels/matrix) - 測試中的 channel plugin
