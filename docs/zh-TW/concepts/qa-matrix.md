---
read_when:
    - 執行本機 `pnpm openclaw qa matrix`
    - 新增或選取 Matrix QA 情境
    - 分流 Matrix QA 失敗、逾時或清理卡住處理
summary: Docker 支援的 Matrix 即時 QA 通道維護者參考：命令列介面、設定檔、環境變數、情境與輸出成品。
title: Matrix 品質保證
x-i18n:
    generated_at: "2026-07-05T11:17:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 012b07c4453cd2a206192e2c8caec6e0a7377796f94839a00282a6779a6cab88
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 通道會在 Docker 中，針對一次性的 Tuwunel homeserver 執行隨附的 `@openclaw/matrix` 外掛，並使用臨時的 driver、SUT、observer 帳號以及預先建立的房間。這是 Matrix 的真實傳輸即時覆蓋。

僅限維護者使用的工具。封裝的 OpenClaw 發行版會省略 `qa-lab`，因此 `openclaw qa` 只會從原始碼 checkout 執行，並且會直接載入隨附的 runner，不需要外掛安裝步驟。

如需更完整的 QA 框架背景，請參閱 [QA 概觀](/zh-TW/concepts/qa-e2e-automation)。

## 快速開始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

一般的 `pnpm openclaw qa matrix` 會執行 `--profile all`，且不會在第一次失敗時停止。可使用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`，將完整清單分片到平行作業中。

## 此通道會做什麼

1. 在 Docker 中佈建一次性的 Tuwunel homeserver（預設映像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`、伺服器名稱 `matrix-qa.test`、連接埠 `28008`），並在有界限的遮蔽請求/回應記錄器後方執行。
2. 註冊三個臨時使用者：`driver`（傳送入站流量）、`sut`（受測的 OpenClaw Matrix 帳號）、`observer`（第三方流量擷取）。
3. 建立所選情境需要的房間（main、threading、media、restart、secondary、allowlist、E2EE、verification DM 等）。
4. 針對已記錄的 Tuwunel 邊界執行與基底無關的 `matrix-qa-v1` 通訊協定探測。單元測試會以 Matrix 通訊協定 fixture 證明探測合約；[#99707](https://github.com/openclaw/openclaw/pull/99707) 中的標準 QA 傳輸配接器主機負責真實 Crabline 目標接線。
5. 啟動子 OpenClaw 閘道，並將真實 Matrix 外掛限定到 SUT 帳號。
6. 依序執行情境，透過 driver/observer Matrix 用戶端觀察事件，並從已記錄的流量推導路由/狀態預期。
7. 關閉 homeserver、寫入報告與證據成品，然後結束。

## 命令列介面

```text
pnpm openclaw qa matrix [options]
```

### 常用旗標

| 旗標                  | 預設值                                       | 說明                                                                                                                                   |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 情境設定檔。請參閱[設定檔](#profiles)。                                                                                                  |
| `--fail-fast`         | 關閉                                           | 在第一個失敗的檢查或情境後停止。                                                                                                |
| `--scenario <id>`     | -                                             | 只執行此情境。可重複使用。請參閱[情境](#scenarios)。                                                                              |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 寫入報告、摘要、路由/狀態清單、觀察到的事件以及輸出記錄的位置。相對路徑會以 `--repo-root` 為基準解析。 |
| `--repo-root <path>`  | `process.cwd()`                               | 從中立工作目錄叫用時的儲存庫根目錄。                                                                               |
| `--sut-account <id>`  | `sut`                                         | QA 閘道設定中的 Matrix 帳號 ID。                                                                                               |

### 提供者旗標

此通道使用真實 Matrix 傳輸，但模型提供者可設定：

| 旗標                     | 預設值          | 說明                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` 用於確定性的模擬派送，或 `live-frontier` 用於即時 frontier 提供者。舊別名 `live-openai` 仍可使用。 |
| `--model <ref>`          | 提供者預設值 | 主要 `provider/model` ref。                                                                                                             |
| `--alt-model <ref>`      | 提供者預設值 | 情境在執行中切換時使用的替代 `provider/model` ref。                                                                            |
| `--fast`                 | 關閉              | 在支援的地方啟用提供者快速模式。                                                                                                |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。此通道會在本機佈建一次性使用者；沒有可租用的共享憑證池。

## 設定檔

| 設定檔         | 使用時機                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（預設） | 完整目錄。較慢但詳盡。                                                                                                                                                                                                   |
| `fast`          | 發行閘門子集，會演練即時傳輸合約：canary、提及閘控、allowlist 封鎖、回覆形狀、重新啟動恢復、thread follow-up、thread isolation、reaction observation，以及 exec approval metadata delivery。 |
| `transport`     | 傳輸層級的 threading、DM、room、autojoin、mention/allowlist、approval 和 reaction 情境。                                                                                                                                  |
| `media`         | 圖片、音訊、影片、PDF、EPUB 附件覆蓋。                                                                                                                                                                                  |
| `e2ee-smoke`    | 最低限度的 E2EE 覆蓋：基本加密回覆、thread follow-up、bootstrap success。                                                                                                                                                   |
| `e2ee-deep`     | 詳盡的 E2EE state-loss、backup、key 和 recovery 情境。                                                                                                                                                                     |
| `e2ee-cli`      | 透過 QA harness 驅動的 `openclaw matrix encryption setup` 和 `verify *` 命令列介面情境。                                                                                                                                       |

確切對應位於 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## 情境

完整情境 ID 清單是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` 中的 `MatrixQaScenarioId` union。分類：

- threading：`matrix-thread-*`、`matrix-subagent-thread-spawn`
- top-level / DM / room：`matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- streaming 和工具進度：`matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- media：`matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- routing：`matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- reactions：`matrix-reaction-*`
- approvals：`matrix-approval-*`（exec/plugin metadata、chunked fallback、deny reactions、threads，以及 `target: "both"` routing）
- restart 和 replay：`matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- mention gating、bot-to-bot 和 allowlists：`matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE：`matrix-e2ee-*`（basic reply、thread follow-up、bootstrap、recovery key lifecycle、state-loss variants、server backup behavior、device hygiene、SAS / QR / DM verification、restart、artifact redaction）
- E2EE 命令列介面：`matrix-e2ee-cli-*`（encryption setup、idempotent setup、bootstrap failure、recovery-key lifecycle、multi-account、gateway-reply round-trip、self-verification）

傳入 `--scenario <id>`（可重複）即可執行手動挑選的集合；搭配 `--profile all` 可忽略設定檔閘控。

## 環境變數

| 變數                                    | 預設值                                    | 影響                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分鐘）                      | 整個執行的硬性上限。                                                                                                                                                                           |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初始金絲雀回覆的上限。Release CI 會在共享 runner 上提高此值，避免緩慢的第一次閘道回合在情境覆蓋開始前失敗。                                                                                 |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 負向無回覆斷言的靜默視窗。會限制為 `<=` 執行逾時。                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 清理的上限。失敗畫面會包含復原用的 `docker compose ... down --remove-orphans` 命令。                                                                                                  |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 在針對不同 Tuwunel 版本驗證時覆寫主伺服器映像檔。                                                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 啟用                                      | `0` 會在 stderr 上靜音 `[matrix-qa] ...` 進度列。`1` 會強制啟用。                                                                                                                             |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已遮蔽                                    | `1` 會在 `matrix-qa-observed-events.json` 中保留訊息主體和 `formatted_body`。預設會遮蔽，以確保 CI 成品安全。                                                                                 |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 關閉                                      | `1` 會略過成品寫入後確定性的 `process.exit`。預設會強制結束，因為 matrix-js-sdk 的原生加密控制代碼可能讓事件迴圈在成品完成後仍保持作用中。                                                   |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未設定                                    | 由外層啟動器設定時（例如 `scripts/run-node.mjs`），Matrix QA 會重用該日誌路徑，而不是啟動自己的 `tee`。                                                                                      |

## 輸出成品

寫入 `--output-dir`（預設為 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，讓連續執行不會互相覆寫）：

- `matrix-qa-report.md`：Markdown 協定報告（哪些通過、失敗、被略過，以及原因）。
- `matrix-qa-summary.json`：適合 CI 解析和儀表板使用的結構化摘要。
- `matrix-qa-route-state-manifest.json`：依情境 id 索引的動態 `matrix-qa-v1` 清單。它記錄該次執行期間觀察到的已遮蔽路由/主體形狀、請求排序、觀察到的重試、錯誤、同步權杖連續性，以及裝置/金鑰/媒體/備份狀態族。這是可執行證據，而不是簽入的基準。
- `matrix-qa-observed-events.json`：來自驅動程式和觀察者用戶端的已觀察 Matrix 事件。除非設定 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否則主體會被遮蔽；核准中繼資料會以選定的安全欄位和截斷的命令預覽摘要。
- `matrix-qa-output.log`：該次執行的 stdout/stderr 合併輸出。如果已設定 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，則會改為重用外層啟動器的日誌。

## 分診提示

- **執行在接近結尾時卡住：** `matrix-js-sdk` 的原生加密控制代碼可能比測試框架存活更久。預設會在成品寫入後強制乾淨地 `process.exit`；如果你設定 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，預期程序會停留一段時間。
- **清理錯誤：** 尋找印出的復原命令（一個 `docker compose ... down --remove-orphans` 呼叫），並手動執行它以釋放主伺服器連接埠。
- **CI 中負向斷言視窗不穩定：** 當 CI 很快時，降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（預設 8 秒）；在緩慢的共享 runner 上則提高它。
- **需要已遮蔽主體以供錯誤報告使用：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新執行，並附上 `matrix-qa-observed-events.json`。請將產生的成品視為敏感資料。
- **不同的 Tuwunel 版本：** 將 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向受測版本。此通道只簽入已釘選的預設映像檔。

## 即時傳輸合約

Matrix 是三個即時傳輸通道（Matrix、Telegram、Discord）之一，它們共用 [QA overview: 即時傳輸覆蓋](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage) 中定義的單一合約檢查清單。`qa-channel` 仍是廣泛的合成測試套件，且有意不屬於該矩陣的一部分。

## 相關

- [QA overview](/zh-TW/concepts/qa-e2e-automation)：整體 QA 堆疊和即時傳輸合約
- [QA Channel](/zh-TW/channels/qa-channel)：用於以 repo 為基礎情境的合成通道配接器
- [測試](/zh-TW/help/testing)：執行測試並新增 QA 覆蓋
- [Matrix](/zh-TW/channels/matrix)：受測的通道外掛
