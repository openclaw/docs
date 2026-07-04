---
read_when:
    - 執行本機 `pnpm openclaw qa matrix`
    - 新增或選擇 Matrix QA 情境
    - 分診 Matrix QA 失敗、逾時或清理卡住
summary: Docker 支援的 Matrix 即時 QA 通道維護者參考：命令列介面、設定檔、環境變數、情境與輸出成品。
title: Matrix 品質保證
x-i18n:
    generated_at: "2026-07-04T20:24:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA lane 會在 Docker 中使用一次性的 Tuwunel homeserver，搭配暫時的 driver、SUT 和 observer 帳號以及預先植入的 rooms，來執行 bundled `@openclaw/matrix` 外掛。這是 Matrix 的真實傳輸 live coverage。

這是僅供維護者使用的工具。封裝的 OpenClaw releases 會刻意省略 `qa-lab`，因此 `openclaw qa` 只能從 source checkout 使用。Source checkouts 會直接載入 bundled runner - 不需要外掛安裝步驟。

如需更廣泛的 QA framework 背景，請參閱 [QA 概覽](/zh-TW/concepts/qa-e2e-automation)。

## 快速開始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

單純執行 `pnpm openclaw qa matrix` 會使用 `--profile all`，且不會在第一次失敗時停止。Release gate 請使用 `--profile fast --fail-fast`；並行執行完整 inventory 時，可用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 分割 catalog。

## 這個 lane 會做什麼

1. 在 Docker 中佈建一次性的 Tuwunel homeserver（預設映像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`、伺服器名稱 `matrix-qa.test`、連接埠 `28008`），並放在有界限、會遮蔽敏感資訊的請求/回應 recorder 後方。
2. 註冊三個暫時使用者 - `driver`（傳送 inbound traffic）、`sut`（受測 OpenClaw Matrix 帳號）、`observer`（第三方流量擷取）。
3. 植入所選情境所需的 rooms（main、threading、media、restart、secondary、allowlist、E2EE、verification DM 等）。
4. 對 recorded Tuwunel boundary 執行 substrate-neutral `matrix-qa-v1` protocol probe。單元測試會使用 Matrix protocol fixture 證明 probe contract；[#99707](https://github.com/openclaw/openclaw/pull/99707) 中的 canonical QA transport adapter host 負責真實 Crabline target wiring。
5. 啟動 child OpenClaw 閘道，並將真實 Matrix 外掛限定到 SUT 帳號；child 中不會載入 `qa-channel`。
6. 依序執行情境，透過 driver/observer Matrix clients 觀察 events，並從 recorded traffic 推導 route/state expectations。
7. 關閉 homeserver，寫入 report 與 evidence artifacts，然後結束。

## 命令列介面

```text
pnpm openclaw qa matrix [options]
```

### 常用 flags

| Flag                  | 預設值                                        | 說明                                                                                                                                          |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 情境 profile。請參閱 [Profiles](#profiles)。                                                                                                  |
| `--fail-fast`         | 關閉                                          | 在第一個 failed check 或 scenario 後停止。                                                                                                    |
| `--scenario <id>`     | -                                             | 只執行這個 scenario。可重複指定。請參閱 [Scenarios](#scenarios)。                                                                            |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 寫入 reports、summary、route/state inventory、observed events 和 output log 的位置。相對路徑會以 `--repo-root` 為基準解析。                  |
| `--repo-root <path>`  | `process.cwd()`                               | 從中立 working directory 呼叫時使用的 repository root。                                                                                       |
| `--sut-account <id>`  | `sut`                                         | QA 閘道 config 內的 Matrix account id。                                                                                                       |

### Provider flags

此 lane 使用真實 Matrix transport，但模型提供者可設定：

| Flag                     | 預設值           | 說明                                                                                                                                      |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` 用於 deterministic mock dispatch，或 `live-frontier` 用於 live frontier providers。Legacy alias `live-openai` 仍可使用。    |
| `--model <ref>`          | provider default | 主要的 `provider/model` ref。                                                                                                             |
| `--alt-model <ref>`      | provider default | 情境在執行中途切換時使用的替代 `provider/model` ref。                                                                                     |
| `--fast`                 | 關閉             | 在支援時啟用 provider fast mode。                                                                                                         |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。此 lane 會在本機佈建一次性使用者；沒有可租借的 shared credential pool。

## Profiles

所選 profile 會決定執行哪些 scenarios。

| Profile         | 用途                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (default) | 完整 catalog。速度較慢但最完整。                                                                                                                                                                                                    |
| `fast`          | Release-gate 子集，會演練 live transport contract：canary、mention gating、allowlist block、reply shape、restart resume、thread follow-up、thread isolation、reaction observation，以及 exec approval metadata delivery。            |
| `transport`     | Transport-level threading、DM、room、autojoin、mention/allowlist、approval 和 reaction scenarios。                                                                                                                                   |
| `media`         | Image、audio、video、PDF、EPUB attachment coverage。                                                                                                                                                                                 |
| `e2ee-smoke`    | 最小 E2EE coverage - basic encrypted reply、thread follow-up、bootstrap success。                                                                                                                                                    |
| `e2ee-deep`     | 完整 E2EE state-loss、backup、key 和 recovery scenarios。                                                                                                                                                                            |
| `e2ee-cli`      | 透過 QA harness 驅動的 `openclaw matrix encryption setup` 和 `verify *` 命令列介面 scenarios。                                                                                                                                       |

確切 mapping 位於 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## Scenarios

完整 scenario id 清單是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` 中的 `MatrixQaScenarioId` union。類別包含：

- threading - `matrix-thread-*`、`matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- streaming 和 tool progress - `matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- media - `matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- approvals - `matrix-approval-*`（exec/plugin metadata、chunked fallback、deny reactions、threads，以及 `target: "both"` routing）
- restart 和 replay - `matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- mention gating、bot-to-bot 和 allowlists - `matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*`（basic reply、thread follow-up、bootstrap、recovery key lifecycle、state-loss variants、server backup behavior、device hygiene、SAS / QR / DM verification、restart、artifact redaction）
- E2EE 命令列介面 - `matrix-e2ee-cli-*`（encryption setup、idempotent setup、bootstrap failure、recovery-key lifecycle、multi-account、gateway-reply round-trip、self-verification）

傳入 `--scenario <id>`（可重複指定）以執行手動挑選的集合；與 `--profile all` 組合使用可忽略 profile gating。

## 環境變數

| 變數                                    | 預設值                                    | 效果                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分鐘）                      | 整次執行的硬性上限。                                                                                                                                                                           |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初始金絲雀回覆的限制。發行 CI 會在共用執行器上提高此值，避免緩慢的第一次閘道回合在情境覆蓋開始前就失敗。                                                                                      |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 負向無回覆斷言的安靜視窗。會被限制為 `≤` 執行逾時。                                                                                                                                           |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 清理的限制。失敗輸出會包含復原用的 `docker compose ... down --remove-orphans` 命令。                                                                                                   |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 在針對不同 Tuwunel 版本驗證時，覆寫 homeserver 映像。                                                                                                                                          |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 開啟                                      | `0` 會讓 stderr 上的 `[matrix-qa] ...` 進度列靜音。`1` 會強制開啟。                                                                                                                           |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已遮蔽                                    | `1` 會在 `matrix-qa-observed-events.json` 中保留訊息本文和 `formatted_body`。預設會遮蔽，以確保 CI 成品安全。                                                                                 |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 關閉                                      | `1` 會略過成品寫入後確定性的 `process.exit`。預設會強制退出，因為 matrix-js-sdk 的原生加密控制代碼可能讓事件迴圈在成品完成後仍保持存活。                                                       |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未設定                                    | 由外層啟動器（例如 `scripts/run-node.mjs`）設定時，Matrix QA 會重用該記錄檔路徑，而不是啟動自己的 tee。                                                                                       |

## 輸出成品

寫入 `--output-dir`：

- `matrix-qa-report.md` - Markdown 協定報告（哪些通過、失敗、被略過，以及原因）。
- `matrix-qa-summary.json` - 適合 CI 解析和儀表板使用的結構化摘要。
- `matrix-qa-route-state-manifest.json` - 依情境 ID 作為鍵的動態 `matrix-qa-v1` 清單。它記錄該次執行期間觀察到的已遮蔽路由/本文形狀、請求順序、觀察到的重試、錯誤、同步權杖連續性，以及裝置/金鑰/媒體/備份狀態族群。這是可執行證據，不是簽入的基準。
- `matrix-qa-observed-events.json` - 來自驅動程式和觀察者用戶端的已觀察 Matrix 事件。除非設定 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否則本文會被遮蔽；核准中繼資料會以選定的安全欄位和截斷的命令預覽摘要呈現。
- `matrix-qa-output.log` - 該次執行的合併 stdout/stderr。如果設定了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，則會改用外層啟動器的記錄檔。

預設輸出目錄為 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此連續執行不會互相覆寫。

## 疑難排解提示

- **執行在接近結尾時卡住：** `matrix-js-sdk` 原生加密控制代碼可能比測試工具存活更久。預設會在成品寫入後強制乾淨的 `process.exit`；如果你取消設定 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，預期程序會繼續停留。
- **清理錯誤：** 尋找印出的復原命令（一次 `docker compose ... down --remove-orphans` 呼叫），並手動執行它來釋放 homeserver 連接埠。
- **CI 中不穩定的負向斷言視窗：** CI 很快時降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（預設 8 秒）；在較慢的共用執行器上提高它。
- **錯誤報告需要已遮蔽本文：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新執行，並附上 `matrix-qa-observed-events.json`。將產生的成品視為敏感資料。
- **不同的 Tuwunel 版本：** 將 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向受測版本。該通道只簽入釘選的預設映像。

## 即時傳輸合約

Matrix 是三個即時傳輸通道（Matrix、Telegram、Discord）之一，它們共用 [QA 概觀 → 即時傳輸覆蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage) 中定義的單一合約檢查清單。`qa-channel` 仍是廣泛的合成測試套件，並且刻意不屬於該矩陣。

## 相關

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) - 整體 QA 堆疊和即時傳輸合約
- [QA Channel](/zh-TW/channels/qa-channel) - 用於 repo 支援情境的合成通道配接器
- [測試](/zh-TW/help/testing) - 執行測試並新增 QA 覆蓋
- [Matrix](/zh-TW/channels/matrix) - 受測的通道外掛
