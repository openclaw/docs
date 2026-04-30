---
read_when:
    - 在本機執行 pnpm openclaw qa matrix
    - 新增或選取 Matrix QA 情境
    - 分流處理 Matrix QA 失敗、逾時或卡住的清理作業
summary: 由 Docker 支援的 Matrix 即時品質保證通道維護者參考資料：CLI、設定檔、環境變數、情境和輸出產物。
title: Matrix 品質保證
x-i18n:
    generated_at: "2026-04-30T03:02:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 通道會在 Docker 中針對一次性的 Tuwunel homeserver 執行隨附的 `@openclaw/matrix` Plugin，並使用暫時的 driver、SUT 和 observer 帳戶，以及預先植入的房間。這是 Matrix 的即時、真實傳輸涵蓋範圍。

這是僅供維護者使用的工具。封裝版 OpenClaw 發行版本刻意省略 `qa-lab`，因此 `openclaw qa` 只能從原始碼 checkout 使用。原始碼 checkout 會直接載入隨附的 runner，不需要 Plugin 安裝步驟。

如需更廣泛的 QA 框架背景，請參閱 [QA 概覽](/zh-TW/concepts/qa-e2e-automation)。

## 快速開始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

一般的 `pnpm openclaw qa matrix` 會執行 `--profile all`，且不會在第一次失敗時停止。將 `--profile fast --fail-fast` 用於發行閘門；完整清單平行執行時，可用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 對目錄分片。

## 這條通道會做什麼

1. 在 Docker 中佈建一次性的 Tuwunel homeserver（預設映像檔 `ghcr.io/matrix-construct/tuwunel:v1.5.1`、伺服器名稱 `matrix-qa.test`、連接埠 `28008`）。
2. 註冊三個暫時使用者：`driver`（傳送入站流量）、`sut`（受測的 OpenClaw Matrix 帳戶）、`observer`（第三方流量擷取）。
3. 植入所選情境所需的房間（main、threading、media、restart、secondary、allowlist、E2EE、verification DM 等）。
4. 啟動子 OpenClaw gateway，並將真實 Matrix Plugin 限定在 SUT 帳戶；`qa-channel` 不會在子項中載入。
5. 依序執行情境，透過 driver/observer Matrix 用戶端觀察事件。
6. 關閉 homeserver，寫入報告與摘要成品，然後結束。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 常用旗標

| 旗標                  | 預設值                                       | 說明                                                                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 情境設定檔。請參閱[設定檔](#profiles)。                                                                           |
| `--fail-fast`         | off                                           | 在第一個失敗的檢查或情境後停止。                                                                         |
| `--scenario <id>`     | —                                             | 只執行這個情境。可重複。請參閱[情境](#scenarios)。                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 寫入報告、摘要、觀察到的事件與輸出記錄的位置。相對路徑會依 `--repo-root` 解析。 |
| `--repo-root <path>`  | `process.cwd()`                               | 從中立工作目錄叫用時的儲存庫根目錄。                                                        |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 設定內的 Matrix 帳戶 ID。                                                                        |

### 提供者旗標

此通道使用真實的 Matrix 傳輸，但模型提供者可設定：

| 旗標                     | 預設值          | 說明                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` 用於確定性的模擬 dispatch，或 `live-frontier` 用於即時 frontier 提供者。舊版別名 `live-openai` 仍可使用。 |
| `--model <ref>`          | provider default | 主要 `provider/model` ref。                                                                                                             |
| `--alt-model <ref>`      | provider default | 情境在執行中切換時使用的替代 `provider/model` ref。                                                                            |
| `--fast`                 | off              | 在支援時啟用提供者快速模式。                                                                                                |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。此通道會在本機佈建一次性使用者；沒有可租用的共用憑證池。

## 設定檔

所選設定檔決定會執行哪些情境。

| 設定檔         | 用途                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（預設） | 完整目錄。速度較慢但完整。                                                                                                                                                                                                   |
| `fast`          | 發行閘門子集，會測試即時傳輸合約：canary、提及 gating、allowlist 封鎖、回覆形狀、重新啟動續接、thread 後續回覆、thread 隔離、reaction 觀察，以及 exec approval metadata 交付。 |
| `transport`     | 傳輸層級的 threading、DM、房間、autojoin、mention/allowlist、approval 和 reaction 情境。                                                                                                                                  |
| `media`         | 圖片、音訊、影片、PDF、EPUB 附件涵蓋範圍。                                                                                                                                                                                  |
| `e2ee-smoke`    | 最小 E2EE 涵蓋範圍：基本加密回覆、thread 後續回覆、bootstrap 成功。                                                                                                                                                  |
| `e2ee-deep`     | 完整的 E2EE 狀態遺失、備份、金鑰和復原情境。                                                                                                                                                                     |
| `e2ee-cli`      | 透過 QA harness 驅動的 `openclaw matrix encryption setup` 和 `verify *` CLI 情境。                                                                                                                                       |

確切對應位於 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## 情境

完整情境 ID 清單是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` 中的 `MatrixQaScenarioId` union。類別包括：

- threading — `matrix-thread-*`、`matrix-subagent-thread-spawn`
- top-level / DM / room — `matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- streaming 和 tool progress — `matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- media — `matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- routing — `matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- reactions — `matrix-reaction-*`
- approvals — `matrix-approval-*`（exec/plugin metadata、chunked fallback、deny reactions、threads，以及 `target: "both"` routing）
- restart 和 replay — `matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- mention gating、bot-to-bot 和 allowlists — `matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*`（基本回覆、thread 後續回覆、bootstrap、recovery key lifecycle、state-loss variants、server backup behavior、device hygiene、SAS / QR / DM verification、restart、artifact redaction）
- E2EE CLI — `matrix-e2ee-cli-*`（encryption setup、idempotent setup、bootstrap failure、recovery-key lifecycle、multi-account、gateway-reply round-trip、self-verification）

傳入 `--scenario <id>`（可重複）以執行手動挑選的集合；搭配 `--profile all` 可忽略設定檔 gating。

## 環境變數

| 變數                                    | 預設值                                    | 效果                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分鐘）                      | 整次執行的硬性上限。                                                                                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初始 canary 回覆的上限。Release CI 會在共用 runner 上提高此值，讓較慢的第一次 Gateway turn 不會在情境覆蓋開始前失敗。                                                                              |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 用於負向無回覆斷言的安靜視窗。會限制為 `≤` 執行逾時。                                                                                                                                               |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 清理的上限。失敗輸出包含復原用的 `docker compose ... down --remove-orphans` 命令。                                                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 驗證不同 Tuwunel 版本時，覆寫 homeserver 映像。                                                                                                                                                     |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | on                                        | `0` 會靜音 stderr 上的 `[matrix-qa] ...` 進度行。`1` 會強制啟用。                                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redacted                                  | `1` 會在 `matrix-qa-observed-events.json` 中保留訊息內文與 `formatted_body`。預設會遮蔽，以確保 CI 成品安全。                                                                                       |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | off                                       | `1` 會略過成品寫入後的確定性 `process.exit`。預設會強制結束，因為 matrix-js-sdk 的原生 crypto handle 可能讓事件迴圈在成品完成後仍保持存活。                                                        |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | unset                                     | 由外層啟動器（例如 `scripts/run-node.mjs`）設定時，Matrix QA 會重用該記錄檔路徑，而不是啟動自己的 tee。                                                                                            |

## 輸出成品

寫入 `--output-dir`：

- `matrix-qa-report.md` — Markdown 協定報告（哪些通過、失敗、被略過，以及原因）。
- `matrix-qa-summary.json` — 適合 CI 解析與儀表板使用的結構化摘要。
- `matrix-qa-observed-events.json` — 來自驅動程式與觀察者用戶端的已觀察 Matrix 事件。除非設定 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否則內文會被遮蔽；核准中繼資料會以選定的安全欄位和截斷的命令預覽摘要呈現。
- `matrix-qa-output.log` — 本次執行合併的 stdout/stderr。如果設定了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，則會改用外層啟動器的記錄檔。

預設輸出目錄為 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此連續執行不會互相覆寫。

## 分診提示

- **執行在接近結尾時卡住：** `matrix-js-sdk` 原生 crypto handle 可能比測試框架活得更久。預設會在成品寫入後強制執行乾淨的 `process.exit`；如果你取消設定 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，預期程序會停留一段時間。
- **清理錯誤：** 尋找印出的復原命令（一個 `docker compose ... down --remove-orphans` 呼叫），並手動執行以釋放 homeserver 連接埠。
- **CI 中不穩定的負向斷言視窗：** CI 很快時降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（預設 8 秒）；在較慢的共用 runner 上提高它。
- **錯誤報告需要未遮蔽的內文：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新執行，並附上 `matrix-qa-observed-events.json`。將產生的成品視為敏感資料。
- **不同的 Tuwunel 版本：** 將 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向要測試的版本。此 lane 只會檢查已釘選的預設映像。

## 即時傳輸合約

Matrix 是三個即時傳輸 lane（Matrix、Telegram、Discord）之一，這些 lane 共用單一合約檢查清單，定義於 [QA 概觀 → 即時傳輸覆蓋](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 仍是廣泛的合成套件，且刻意不屬於該 matrix。

## 相關

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) — 整體 QA 堆疊與即時傳輸合約
- [QA Channel](/zh-TW/channels/qa-channel) — 用於 repo 支援情境的合成頻道配接器
- [測試](/zh-TW/help/testing) — 執行測試與新增 QA 覆蓋
- [Matrix](/zh-TW/channels/matrix) — 測試中的頻道 Plugin
