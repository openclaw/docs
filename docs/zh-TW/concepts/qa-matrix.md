---
read_when:
    - 在本機執行 `pnpm openclaw qa matrix`
    - 新增或選取 Matrix 品質保證情境
    - 分流處理 Matrix QA 失敗、逾時或清理卡住問題
summary: Docker 支援的 Matrix 即時 QA 流程維護者參考：命令列介面、設定檔、環境變數、情境與輸出成品。
title: Matrix 品質保證
x-i18n:
    generated_at: "2026-07-12T14:26:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 執行管線會在 Docker 中，針對可拋棄式 Tuwunel 主伺服器執行隨附的 `@openclaw/matrix` 外掛，並使用臨時的驅動程式、受測系統及觀察者帳號，以及預先植入資料的聊天室。這是 Matrix 使用真實傳輸機制的即時涵蓋範圍。

僅限維護者使用的工具。封裝後的 OpenClaw 發行版不包含 `qa-lab`，因此 `openclaw qa` 只能從原始碼簽出目錄執行；它會直接載入隨附的執行器，不需要安裝外掛。

如需更廣泛的 QA 框架背景資訊，請參閱 [QA 概觀](/zh-TW/concepts/qa-e2e-automation)。

## 快速開始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

直接執行 `pnpm openclaw qa matrix` 會使用 `--profile all`，且不會在第一次失敗時停止。若要將完整項目清單分片至多個平行工作，請使用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`。

## 此執行管線的運作方式

1. 在 Docker 中佈建可拋棄式 Tuwunel 主伺服器（預設映像檔為 `ghcr.io/matrix-construct/tuwunel:v1.5.1`、伺服器名稱為 `matrix-qa.test`、連接埠為 `28008`），並在前方設置有界且會遮蔽敏感資訊的請求／回應記錄器。
2. 註冊三個臨時使用者：`driver`（傳送輸入流量）、`sut`（受測的 OpenClaw Matrix 帳號）、`observer`（擷取第三方流量）。
3. 為所選情境預先建立必要的聊天室（主要、討論串、媒體、重新啟動、次要、允許清單、E2EE、驗證私訊等）。
4. 對已記錄的 Tuwunel 邊界執行與基礎層無關的 `matrix-qa-v1` 協定探測。單元測試使用 Matrix 協定測試資料證明探測合約；[#99707](https://github.com/openclaw/openclaw/pull/99707) 中的標準 QA 傳輸配接器主機負責真實 Crabline 目標的接線。
5. 啟動子 OpenClaw 閘道，並將真實 Matrix 外掛限定於受測系統帳號。
6. 依序執行情境，透過驅動程式／觀察者 Matrix 用戶端觀察事件，並從記錄的流量推導路由／狀態預期。
7. 拆除主伺服器、寫入報告與證據成品，然後結束。

## 命令列介面

```text
pnpm openclaw qa matrix [options]
```

### 常用旗標

| 旗標                  | 預設值                                        | 說明                                                                                                                                              |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 情境設定檔。請參閱[設定檔](#profiles)。                                                                                                           |
| `--fail-fast`         | 關閉                                          | 在第一次檢查或情境失敗後停止。                                                                                                                    |
| `--scenario <id>`     | -                                             | 僅執行此情境。可重複指定。請參閱[情境](#scenarios)。                                                                                              |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 寫入報告、摘要、路由／狀態項目清單、觀察到的事件及輸出記錄的位置。相對路徑以 `--repo-root` 為基準解析。                                             |
| `--repo-root <path>`  | `process.cwd()`                               | 從中性工作目錄叫用時的儲存庫根目錄。                                                                                                              |
| `--sut-account <id>`  | `sut`                                         | QA 閘道設定中的 Matrix 帳號 ID。                                                                                                                   |

### 提供者旗標

此執行管線使用真實的 Matrix 傳輸，但模型提供者可設定：

| 旗標                     | 預設值           | 說明                                                                                                                                             |
| ------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` 用於確定性的模擬分派，`live-frontier` 用於即時前沿提供者。舊版別名 `live-openai` 仍然有效。                                         |
| `--model <ref>`          | 提供者預設值     | 主要 `provider/model` 參照。                                                                                                                     |
| `--alt-model <ref>`      | 提供者預設值     | 情境在執行途中切換時使用的替代 `provider/model` 參照。                                                                                           |
| `--fast`                 | 關閉             | 在支援的情況下啟用提供者快速模式。                                                                                                               |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。此執行管線會在本機佈建可拋棄式使用者；沒有可供租用的共用認證資訊集區。

## 設定檔

| 設定檔          | 用途                                                                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（預設）   | 完整目錄。速度較慢，但涵蓋全面。                                                                                                                                                                                         |
| `fast`          | 發行閘門子集，用於測試命令式即時傳輸合約：提及閘控、允許清單封鎖、回覆格式、重新啟動後續傳、反應觀察、執行核准中繼資料傳遞，以及 E2EE 基本回覆。                                                                          |
| `transport`     | 傳輸層級的討論串、私訊、聊天室、自動加入、提及／允許清單、核准及反應情境。                                                                                                                                              |
| `media`         | 圖片、音訊、影片、PDF、EPUB 附件涵蓋範圍。                                                                                                                                                                             |
| `e2ee-smoke`    | 最低限度的 E2EE 涵蓋範圍：基本加密回覆、討論串後續回覆、啟動程序成功。                                                                                                                                                  |
| `e2ee-deep`     | 全面的 E2EE 狀態遺失、備份、金鑰及復原情境。                                                                                                                                                                           |
| `e2ee-cli`      | 透過 QA 測試框架驅動的 `openclaw matrix encryption setup` 和 `verify *` 命令列介面情境。                                                                                                                                |

確切對應關係位於 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## 情境

共用 Matrix 配接器會透過 `openclaw qa suite --channel-driver live --channel matrix` 公開以下標準 YAML 情境：

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` 仍可透過明確選擇 `--scenario subagent-thread-spawn`
使用，但在即時子項完成證明穩定之前，不屬於預設的共用 Matrix 集合。

其餘命令式情境 ID 清單是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` 中的 `MatrixQaScenarioId` 聯集。類別如下：

- 討論串：`matrix-thread-root-preservation`、`matrix-thread-nested-reply-shape`
- 頂層／私訊／聊天室：`matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- 串流與工具進度：`matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- 媒體：`matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- 路由：`matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- 反應：`matrix-reaction-*`
- 核准：`matrix-approval-*`（執行／外掛中繼資料、分塊備援、拒絕反應、討論串，以及 `target: "both"` 路由）
- 重新啟動與重播：`matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- 提及閘控、機器人對機器人及允許清單：`matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE：`matrix-e2ee-*`（基本回覆、討論串後續回覆、啟動程序、復原金鑰生命週期、狀態遺失變體、伺服器備份行為、裝置安全管理、SAS／QR／私訊驗證、重新啟動、成品敏感資訊遮蔽）
- E2EE 命令列介面：`matrix-e2ee-cli-*`（加密設定、冪等設定、啟動程序失敗、復原金鑰生命週期、多帳號、閘道回覆來回傳遞、自我驗證）

傳入 `--scenario <id>`（可重複指定）以執行手動挑選的集合；與 `--profile all` 結合使用可忽略設定檔閘控。

## 環境變數

| 變數                                    | 預設值                                    | 作用                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分鐘）                      | 整次執行的硬性時間上限。                                                                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初始金絲雀回覆的時間上限。發布 CI 會在共用執行器上提高此值，避免第一次閘道互動較慢，導致情境涵蓋開始前就失敗。                                                                                   |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 用於反向無回覆斷言的靜默時段。上限會限制為不超過執行逾時時間（`<=`）。                                                                                                                         |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 拆除作業的時間上限。失敗輸出會包含用於復原的 `docker compose ... down --remove-orphans` 命令。                                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 針對不同 Tuwunel 版本進行驗證時，覆寫主伺服器映像檔。                                                                                                                                          |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 開啟                                      | `0` 會隱藏 stderr 上的 `[matrix-qa] ...` 進度行。`1` 會強制顯示。                                                                                                                              |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已遮蔽                                    | `1` 會在 `matrix-qa-observed-events.json` 中保留訊息本文和 `formatted_body`。預設會遮蔽內容，以確保 CI 成品安全。                                                                               |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 關閉                                      | `1` 會略過寫入成品後確定執行的 `process.exit`。預設會強制結束，因為 matrix-js-sdk 的原生加密控制代碼可能會讓事件迴圈在成品完成後繼續運作。                                                       |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未設定                                    | 由外層啟動器（例如 `scripts/run-node.mjs`）設定時，Matrix QA 會重複使用該記錄檔路徑，而不自行啟動 tee。                                                                                          |

## 輸出成品

寫入 `--output-dir`（預設為 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此連續執行不會互相覆寫）：

- `matrix-qa-report.md`：Markdown 通訊協定報告（通過、失敗、略過的項目及其原因）。
- `matrix-qa-summary.json`：適合 CI 剖析和儀表板使用的結構化摘要。
- `matrix-qa-route-state-manifest.json`：依情境 ID 編索引的動態 `matrix-qa-v1` 清冊。它會記錄該次執行期間觀察到的已遮蔽路由／本文形狀、請求順序、重試、錯誤、同步權杖連續性，以及裝置／金鑰／媒體／備份狀態系列。這是可執行的證據，而非簽入版本控制的基準。
- `matrix-qa-observed-events.json`：從驅動程式和觀察者用戶端觀察到的 Matrix 事件。除非設定 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否則本文會被遮蔽；核准中繼資料會以選定的安全欄位和截短的命令預覽進行摘要。
- `matrix-qa-output.log`：該次執行合併後的 stdout/stderr。若已設定 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，則改為重複使用外層啟動器的記錄檔。

## 問題排查提示

- **執行接近結束時停滯：** `matrix-js-sdk` 的原生加密控制代碼可能比測試框架存活更久。預設會在寫入成品後強制執行乾淨的 `process.exit`；若設定 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，程序預期會持續停留。
- **清理錯誤：** 尋找輸出的復原命令（一次 `docker compose ... down --remove-orphans` 呼叫），並手動執行以釋放主伺服器連接埠。
- **CI 中不穩定的反向斷言時段：** CI 速度快時，請降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（預設 8 秒）；在速度較慢的共用執行器上則提高此值。
- **錯誤報告需要已遮蔽的本文：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新執行，並附上 `matrix-qa-observed-events.json`。請將產生的成品視為敏感資料。
- **不同的 Tuwunel 版本：** 將 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向受測版本。此作業流程只會簽入固定的預設映像檔。

## 即時傳輸合約

Matrix 是三個即時傳輸作業流程（Matrix、Telegram、Discord）之一，它們共用 [QA 概觀：即時傳輸涵蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)中定義的單一合約檢查清單。`qa-channel` 仍是涵蓋範圍廣泛的合成測試套件，且刻意不屬於該矩陣的一部分。

## 相關內容

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation)：整體 QA 堆疊與即時傳輸合約
- [QA Channel](/zh-TW/channels/qa-channel)：供儲存庫支援情境使用的合成頻道介接器
- [測試](/zh-TW/help/testing)：執行測試及新增 QA 涵蓋範圍
- [Matrix](/zh-TW/channels/matrix)：受測的頻道外掛
