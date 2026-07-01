---
read_when:
    - 了解 QA 堆疊如何組合在一起
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的 QA 情境
    - 圍繞閘道儀表板建置更高真實度的 QA 自動化
summary: QA 堆疊概覽：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸配接器與報告。
title: QA 總覽
x-i18n:
    generated_at: "2026-07-01T05:28:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊的用途，是以比單一單元測試更貼近真實、
更符合通道形態的方式演練 OpenClaw。

目前組成：

- `extensions/qa-channel`：合成訊息通道，具備 DM、頻道、執行緒、
  reaction、編輯與刪除介面。
- `extensions/qa-lab`：用於觀察 transcript、注入入站訊息，
  以及匯出 Markdown 報告的偵錯器 UI 與 QA bus。
- `extensions/qa-matrix`、未來 runner 外掛：live-transport adapter，
  會在子 QA 閘道內驅動真實通道。
- `qa/`：由 repo 支援的 kickoff 任務種子資產與基準 QA
  情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器截圖、VM 狀態與 PR 證據的 bug，
  進行前後 live verification。

## 命令介面

每個 QA flow 都在 `pnpm openclaw qa <subcommand>` 下執行。許多都有 `pnpm qa:*`
script alias；兩種形式都支援。

| 命令                                                | 用途                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不帶 `--qa-profile` 的 bundled QA self-check；帶 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all` 時，則是 taxonomy-backed maturity profile runner。                                                                                                      |
| `qa suite`                                          | 對 QA 閘道 lane 執行 repo-backed scenarios。Alias：`pnpm openclaw qa suite --runner multipass` 用於一次性的 Linux VM。                                                                                                                                  |
| `qa coverage`                                       | 列印 YAML scenario-coverage inventory（`--json` 用於機器輸出）。                                                                                                                                                                                               |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案並寫入 agentic parity report，或使用 `--runtime-axis --token-efficiency` 從單一 runtime-pair summary 寫入 Codex-vs-OpenClaw runtime parity 與 token-efficiency 報告。                                         |
| `qa character-eval`                                 | 跨多個即時模型執行 character QA 情境，並產生經評審的報告。請參閱[報告](#reporting)。                                                                                                                                                            |
| `qa manual`                                         | 對選定的 provider/model lane 執行一次性 prompt。                                                                                                                                                                                                          |
| `qa ui`                                             | 啟動 QA 偵錯器 UI 與本機 QA bus（alias：`pnpm qa:lab:ui`）。                                                                                                                                                                                                    |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker image。                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | 寫入 QA dashboard + 閘道 lane 的 docker-compose scaffold。                                                                                                                                                                                                    |
| `qa up`                                             | 建置 QA site、啟動 Docker-backed stack，並列印 URL（alias：`pnpm qa:lab:up`；`:fast` variant 會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                  |
| `qa aimock`                                         | 只啟動 AIMock provider server。                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | 只啟動 scenario-aware `mock-openai` provider server。                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享的 Convex credential pool。                                                                                                                                                                                                                               |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 的 live transport lane。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                                                                                      |
| `qa telegram`                                       | 針對真實私人 Telegram 群組的 live transport lane。                                                                                                                                                                                                              |
| `qa discord`                                        | 針對真實私人 Discord guild channel 的 live transport lane。                                                                                                                                                                                                       |
| `qa slack`                                          | 針對真實私人 Slack channel 的 live transport lane。                                                                                                                                                                                                               |
| `qa whatsapp`                                       | 針對真實 WhatsApp Web 帳號的 live transport lane。                                                                                                                                                                                                                 |
| `qa mantis`                                         | 用於 live transport bug 的前後驗證 runner，包含 Discord status-reactions 證據、Crabbox desktop/browser smoke，以及 Slack-in-VNC smoke。請參閱 [Mantis](/zh-TW/concepts/mantis) 與 [Mantis Slack Desktop Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。 |

Profile-backed `qa run` 會從 `taxonomy.yaml` 讀取 membership，然後透過
`qa suite` 分派解析出的 scenarios。`--surface` 與
`--category` 會篩選選定的 profile，而不是定義獨立 lane。
產生的 `qa-evidence.json` 會包含 profile scorecard 摘要，其中有
selected-category counts 與 missing coverage IDs；各個 evidence
entries 仍是 tests、coverage roles 與 results 的事實來源。
Taxonomy feature coverage IDs 是精確的 proof targets，而不是 aliases。Primary
scenario coverage 會滿足相符 IDs；secondary coverage 則維持 advisory。
Coverage IDs 使用帶有小寫英數字/dash segments 的 dotted
`namespace.behavior` 形式；profile、surface 與 category IDs 仍可使用
既有的 dashed 或 dotted taxonomy IDs。
Slim evidence 會省略每個 entry 的 `execution`，並設定 `evidenceMode: "slim"`；
`smoke-ci` 預設為 slim，而 `--evidence-mode full` 會還原完整 entries：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 搭配 mock model providers 與
Crabline local provider servers 進行可決定性的 profile proof。使用 `release` 針對 live
channels 進行 Stable/LTS proof。只有在明確執行 full-taxonomy evidence runs 時才使用
`all`；它會選取每個 active maturity category，並可透過 `QA Profile
Evidence` workflow 搭配 `qa_profile=all` 分派。當命令也需要 OpenClaw
root profile 時，請將 root profile 放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作者流程

目前的 QA operator flow 是雙窗格 QA site：

- 左側：包含 agent 的閘道 dashboard（Control UI）。
- 右側：QA Lab，顯示類 Slack transcript 與 scenario plan。

使用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA site、啟動 Docker-backed 閘道 lane，並公開
QA Lab page，讓 operator 或 automation loop 能給 agent 一個 QA
mission、觀察真實通道行為，並記錄哪些可行、失敗或
仍被阻擋。

若要更快反覆修改 QA Lab UI，而不必每次都重新建置 Docker image，
請使用 bind-mounted QA Lab bundle 啟動 stack：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker services 使用 prebuilt image，並將
`extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` container。`qa:lab:watch`
會在變更時重建該 bundle，而當 QA Lab
asset hash 變更時，瀏覽器會自動重新載入。

若要執行本機 OpenTelemetry signal smoke，請執行：

```bash
pnpm qa:otel:smoke
```

該 script 會啟動本機 OTLP/HTTP receiver，啟用 `diagnostics-otel` 外掛後執行
`otel-trace-smoke` QA
情境，接著斷言 traces、
metrics 與 logs 已匯出。它會解碼匯出的 protobuf trace spans，
並檢查 release-critical shape：
`openclaw.run`、`openclaw.harness.run`、latest GenAI semantic-convention
model-call span、`openclaw.context.assembled` 與 `openclaw.message.delivery`
必須存在。smoke 會強制
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此 model-call
span 必須使用 `{gen_ai.operation.name} {gen_ai.request.model}` name；
成功 turns 的 model calls 不得匯出 `StreamAbandoned`；raw diagnostic IDs 與
`openclaw.content.*` attributes 必須保持在 trace 之外。raw OTLP
payloads 不得包含 prompt sentinel、response sentinel 或 QA session
key。它會在 QA suite artifacts 旁寫入 `otel-smoke-summary.json`。

若要執行由 collector 支援的 OpenTelemetry smoke，請執行：

```bash
pnpm qa:otel:collector-smoke
```

該 lane 會將真實 OpenTelemetry Collector Docker container 放在
同一個本機 receiver 前方。當你變更 endpoint wiring、collector
compatibility，或可能被 in-process receiver 掩蓋的 OTLP export behavior 時，請使用它。

若要執行受保護的 Prometheus scrape smoke，請執行：

```bash
pnpm qa:prometheus:smoke
```

該別名會在啟用 `diagnostics-prometheus` 的情況下執行 `docker-prometheus-smoke` QA 情境，驗證未經驗證的 scrape 會被拒絕，接著檢查經驗證的 scrape 是否包含發布關鍵的指標系列，且不含提示內容、回應內容、原始診斷識別碼、驗證權杖或本機路徑。

若要連續執行兩個可觀測性 smoke，請使用：

```bash
pnpm qa:observability:smoke
```

若要執行 collector 支援的 OpenTelemetry lane 加上受保護的 Prometheus scrape smoke，請使用：

```bash
pnpm qa:observability:collector-smoke
```

可觀測性 QA 僅保留給原始碼 checkout 使用。npm tarball 會刻意省略 QA Lab，因此套件 Docker 發布 lane 不會執行 `qa` 命令。變更診斷 instrumentation 時，請從已建置的原始碼 checkout 使用 `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`。

若要執行不需要模型供應商認證的真實傳輸 Matrix smoke lane，請使用 deterministic mock OpenAI provider 執行 fast profile：

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

若要執行 live-frontier provider lane，請明確提供 OpenAI 相容認證：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

此 lane 的完整命令列介面參考、profile/情境目錄、環境變數與 artifact 版面配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。簡而言之：它會在 Docker 中佈建一次性的 Tuwunel homeserver、註冊臨時 driver/SUT/observer 使用者、在限定於該傳輸的子 QA 閘道內執行真正的 Matrix 外掛（不使用 `qa-channel`），接著在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON 摘要、observed-events artifact 與合併輸出記錄。

這些情境涵蓋單元測試無法端到端證明的傳輸行為：mention gating、allow-bot 政策、allowlist、頂層與 thread 回覆、DM 路由、reaction handling、inbound edit suppression、restart replay dedupe、homeserver interruption recovery、approval metadata delivery、media handling，以及 Matrix E2EE bootstrap/recovery/verification 流程。E2EE 命令列介面 profile 也會透過同一個一次性 homeserver 驅動 `openclaw matrix encryption setup` 與 verification 命令，然後檢查閘道回覆。

Discord 也有僅限 Mantis 的選擇性情境，用於重現 bug。使用 `--scenario discord-status-reactions-tool-only` 可執行明確的狀態 reaction 時間軸，或使用 `--scenario discord-thread-reply-filepath-attachment` 建立真正的 Discord thread，並驗證 `message.thread-reply` 會保留 `filePath` 附件。這些情境不包含在預設 live Discord lane 中，因為它們是 before/after 重現探針，而不是廣泛的 smoke 覆蓋。當 QA 環境中設定了 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 時，thread-attachment Mantis workflow 也可以加入已登入 Discord Web 的見證影片。該 viewer profile 只用於視覺擷取；pass/fail 判定仍來自 Discord REST oracle。

CI 在 `.github/workflows/qa-live-transports-convex.yml` 中使用同一組命令介面。排程與預設手動執行會使用 QA 提供的 live-frontier 認證、`--fast` 與 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` 執行 fast Matrix profile。手動 `matrix_profile=all` 會展開成五個 profile shard。

若要執行真實傳輸的 Telegram、Discord、Slack 與 WhatsApp smoke lane：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

它們的目標是預先存在、包含兩個 bot 或帳號（driver + SUT）的真實 channel。必要環境變數、情境清單、輸出 artifact 與 Convex credential pool 會在下方的 [Telegram、Discord、Slack 與 WhatsApp QA 參考](#telegram-discord-slack-and-whatsapp-qa-reference)中說明。

若要透過 VNC rescue 執行完整 Slack desktop VM run，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用 Crabbox desktop/browser machine，在 VM 內執行 Slack live lane，在 VNC browser 中開啟 Slack Web，擷取 desktop，並在 video capture 可用時，將 `slack-qa/`、`slack-desktop-smoke.png` 與 `slack-desktop-smoke.mp4` 複製回 Mantis artifact directory。Crabbox desktop/browser leases 會預先提供 capture tools 與 browser/native-build helper packages，因此情境應只在較舊的 lease 上安裝 fallback。Mantis 會在 `mantis-slack-desktop-smoke-report.md` 中回報總時間與各階段時間，讓緩慢執行能顯示時間花在 lease warmup、credential acquisition、remote setup 或 artifact copy。透過 VNC 手動登入 Slack Web 後，請重複使用 `--lease-id <cbx_...>`；重複使用的 lease 也會讓 Crabbox 的 pnpm store cache 保持溫熱。預設的 `--hydrate-mode source` 會從原始碼 checkout 驗證，並在 VM 內執行 install/build。只有在重複使用的遠端 workspace 已有 `node_modules` 與已建置的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；該模式會略過昂貴的 install/build 步驟，並在 workspace 尚未準備好時 fail closed。使用 `--gateway-setup` 時，Mantis 會讓持久性 OpenClaw Slack 閘道在 VM 內的連接埠 `38973` 上持續執行；不使用時，該命令會執行一般 bot-to-bot Slack QA lane，並在 artifact capture 後結束。

若要以 desktop evidence 證明 native Slack approval UI，請執行 Mantis approval checkpoint mode：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

此模式與 `--gateway-setup` 互斥。它會執行 Slack approval scenarios、拒絕非 approval scenario id、在每個 pending 與 resolved approval state 等待、將觀察到的 Slack API message render 成 `approval-checkpoints/<scenario>-pending.png` 與 `approval-checkpoints/<scenario>-resolved.png`，然後在任何 checkpoint、message evidence、acknowledgement 或 rendered screenshot 遺失或為空時失敗。Cold CI leases 仍可能在 `slack-desktop-smoke.png` 中顯示 Slack sign-in；approval checkpoint images 是此 lane 的視覺證明。

Operator checklist、GitHub workflow dispatch 命令、evidence-comment contract、hydrate-mode decision table、timing interpretation 與 failure handling steps 位於 [Mantis Slack Desktop Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。

若要執行 agent/CV 風格 desktop task，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` 會租用或重複使用 Crabbox desktop/browser machine、啟動 `crabbox record --while`、透過巢狀 `visual-driver` 驅動可見 browser、擷取 `visual-task.png`、在選取 `--vision-mode image-describe` 時對 screenshot 執行 `openclaw infer image describe`，並寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json` 與 `mantis-visual-task-report.md`。設定 `--expect-text` 時，vision prompt 會要求結構化 JSON verdict，且只有在模型回報正面的 visible evidence 時才通過；僅引用 target text 的 negative response 會讓 assertion 失敗。使用 `--vision-mode metadata` 可執行不呼叫 image-understanding provider 的 no-model smoke，用來證明 desktop、browser、screenshot 與 video plumbing。Recording 是 `visual-task` 的必要 artifact；如果 Crabbox 未錄到非空的 `visual-task.mp4`，即使 visual driver 通過，task 也會失敗。失敗時，除非 task 已經通過且未設定 `--keep-lease`，否則 Mantis 會保留 lease 供 VNC 使用。

使用 pooled live credentials 前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker env、驗證 endpoint settings，並在 maintainer secret 存在時驗證 admin/list reachability。它只會回報 secret 的 set/missing 狀態。

## Live transport coverage

Live transport lanes 共用一份 contract，而不是各自發明自己的 scenario list shape。`qa-channel` 是廣泛的 synthetic product-behavior suite，不屬於 live transport coverage matrix。

Live transport runners 應從 `openclaw/plugin-sdk/qa-live-transport-scenarios` 匯入 shared scenario ids、baseline coverage helpers 與 scenario-selection helper。

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Quote reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

這會讓 `qa-channel` 保持為廣泛的 product-behavior suite，同時讓 Matrix、Telegram 與其他 live transports 共用一份明確的 transport-contract checklist。

若要執行不把 Docker 帶入 QA path 的一次性 Linux VM lane，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass guest、安裝 dependencies、在 guest 內建置 OpenClaw、執行 `qa suite`，然後將一般 QA report 與 summary 複製回 host 上的 `.artifacts/qa-e2e/...`。它會重複使用與 host 上 `qa suite` 相同的 scenario-selection behavior。Host 與 Multipass suite runs 預設會使用隔離的 gateway workers 平行執行多個 selected scenarios。`qa-channel` 預設 concurrency 為 4，並受 selected scenario count 上限限制。使用 `--concurrency <count>` 調整 worker count，或使用 `--concurrency 1` 進行 serial execution。使用 `--pack personal-agent` 可執行 personal assistant benchmark pack。pack selector 可與重複的 `--scenario` flags 相加：explicit scenarios 先執行，接著 pack scenarios 依 pack order 執行並移除重複項。當自訂 QA runner 已提供 OpenTelemetry collector setup，並想要同時選取 OpenTelemetry 與 Prometheus diagnostics smoke scenarios 時，請使用 `--pack observability`。任何 scenario 失敗時，命令會以非零狀態結束。若想要取得 artifacts 但不讓 exit code 失敗，請使用 `--allow-failures`。Live runs 會轉送對 guest 實用的 supported QA auth inputs：env-based provider keys、QA live provider config path，以及存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在 repo root 下，讓 guest 能透過已掛載的 workspace 寫回。

## Telegram、Discord、Slack 與 WhatsApp QA 參考

Matrix 有[專屬頁面](/zh-TW/concepts/qa-matrix)，因為它的情境數量多，且需要 Docker 支援的 homeserver 佈建。Telegram、Discord、Slack 與 WhatsApp 會針對既有的真實傳輸執行，因此其參考資料放在這裡。

### 共用命令列介面旗標

這些通道會透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同旗標：

| 旗標                                  | 預設值                                             | 說明                                                                                                                                            |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 只執行此情境。可重複指定。                                                                                                                      |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 寫入報告、摘要、證據、傳輸特定成品與輸出記錄的位置。相對路徑會相對於 `--repo-root` 解析。                                                       |
| `--repo-root <path>`                  | `process.cwd()`                                    | 從中立的 cwd 呼叫時使用的儲存庫根目錄。                                                                                                         |
| `--sut-account <id>`                  | `sut`                                              | QA 閘道設定中的暫時帳號 id。                                                                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                                                |
| `--model <ref>` / `--alt-model <ref>` | provider default                                   | 主要/替代模型 refs。                                                                                                                            |
| `--fast`                              | off                                                | 在支援時使用供應商快速模式。                                                                                                                    |
| `--credential-source <env\|convex>`   | `env`                                              | 請參閱 [Convex 憑證集區](#convex-credential-pool)。                                                                                             |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                  | 使用 `--credential-source convex` 時使用的角色。                                                                                                |

任何情境失敗時，每個通道都會以非零狀態結束。`--allow-failures` 會寫入成品，但不會設定失敗的結束代碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私人 Telegram 群組，並使用兩個不同的 bot（driver + SUT）。SUT bot 必須有 Telegram 使用者名稱；當兩個 bot 都在 `@BotFather` 啟用 **Bot-to-Bot Communication Mode** 時，bot 對 bot 觀察效果最佳。

使用 `--credential-source env` 時需要的環境變數：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 數字聊天 id（字串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

情境（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`）：

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

隱含的預設集合一律涵蓋 canary、提及閘控、原生命令回覆、命令定址，以及 bot 對 bot 群組回覆。`mock-openai` 預設也包含確定性的回覆鏈與最終訊息串流檢查。`telegram-current-session-status-tool` 仍為選擇加入，因為它只有在 canary 後直接串接時才穩定，而不是在任意原生命令回覆之後。使用 `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` 可列印目前預設/選用分組與回歸 refs。

輸出成品：

- `telegram-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目，包含 profile、coverage、provider、channel、artifacts、result 與 RTT 欄位。

套件 Telegram 執行使用相同的 Telegram 憑證合約。重複 RTT
測量是一般套件 Telegram 即時通道的一部分；RTT
分布會針對選取的 RTT 檢查折疊到 `qa-evidence.json` 的 `result.timing` 底下。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 時，套件即時包裝器會租用一組 `kind: "telegram"` 憑證，將租用的群組/driver/SUT bot
環境變數匯出到已安裝套件的執行中，對租約進行心跳偵測，並在關閉時釋放。
選取 Convex 時，套件包裝器在 CI 之外預設會對 `telegram-mentioned-message-reply` 執行 20 次 RTT 檢查、使用 30 秒 RTT 逾時，以及 Convex 角色
`maintainer`。覆寫
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`，即可調整 RTT 測量，而不需要
建立獨立的 RTT 命令或 Telegram 專用摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私人 Discord guild 頻道，並使用兩個 bot：由 harness 控制的 driver bot，以及由子 OpenClaw 閘道透過內建 Discord 外掛啟動的 SUT bot。驗證頻道提及處理、SUT bot 已向 Discord 註冊原生 `/help` 命令，以及選擇加入的 Mantis 證據情境。

使用 `--credential-source env` 時需要的環境變數：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須符合 Discord 傳回的 SUT bot 使用者 id（否則通道會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 會為 `discord-voice-autojoin` 選擇語音/舞台頻道；若未設定，情境會為 SUT bot 選取第一個可見的語音/舞台頻道。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 選擇加入的語音情境。單獨執行，啟用 `channels.discord.voice.autoJoin`，並驗證 SUT bot 目前的 Discord 語音狀態是目標語音/舞台頻道。Convex Discord 憑證可包含選用的 `voiceChannelId`；否則執行器會在 guild 中探索第一個可見的語音/舞台頻道。
- `discord-status-reactions-tool-only` - 選擇加入的 Mantis 情境。因為它會將 SUT 切換為永遠開啟、僅工具的 guild 回覆並設定 `messages.statusReactions.enabled=true`，所以會單獨執行，接著擷取 REST reaction 時間軸與 HTML/PNG 視覺成品。Mantis 前後對照報告也會將情境提供的 MP4 成品保留為 `baseline.mp4` 和 `candidate.mp4`。

明確執行 Discord 語音自動加入情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

明確執行 Mantis 狀態 reaction 情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

輸出成品：

- `discord-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `discord-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則本文會被遮蔽。
- 執行狀態 reaction 情境時，會產生 `discord-qa-reaction-timelines.json` 與 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目標是一個真實的私人 Slack 頻道，並使用兩個不同的 bot：由 harness 控制的 driver bot，以及由子 OpenClaw 閘道透過內建 Slack 外掛啟動的 SUT bot。

使用 `--credential-source env` 時需要的環境變數：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 會為 Mantis 啟用視覺核准
  檢查點。執行器會寫入 `<scenario>.pending.json` 與
  `<scenario>.resolved.json`，然後等待相符的 `.ack.json` 檔案。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 會覆寫檢查點
  確認逾時。預設值為 `120000`。

情境（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - 選擇加入的原生 Slack exec 核准情境。
  透過閘道要求 exec 核准，驗證 Slack 訊息有
  原生核准按鈕、解析它，並驗證已解析的 Slack 更新。
- `slack-approval-plugin-native` - 選擇加入的原生 Slack 外掛核准情境。
  同時啟用 exec 與外掛核准轉送，使外掛事件不會
  被 exec 核准路由抑制，接著驗證相同的待處理/已解析
  原生 Slack UI 路徑。

輸出成品：

- `slack-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `slack-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否則本文會被遮蔽。
- `approval-checkpoints/` - 僅在 Mantis 設定
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 時；包含檢查點 JSON、
  確認 JSON，以及待處理/已解析螢幕截圖。

#### 設定 Slack 工作區

此通道需要同一個工作區中的兩個不同 Slack app，以及兩個 bot 都已加入的頻道：

- `channelId` - 兩個 bot 都已受邀加入的頻道 `Cxxxxxxxxxx` id。請使用專用頻道；此通道每次執行都會發文。
- `driverBotToken` - **Driver** app 的 bot token（`xoxb-...`）。
- `sutBotToken` - **SUT** app 的 bot token（`xoxb-...`），它必須是與 driver 不同的 Slack app，才能有不同的 bot 使用者 id。
- `sutAppToken` - SUT app 的 app 層級 token（`xapp-...`），具備 `connections:write`，供 Socket Mode 使用，讓 SUT app 能接收事件。

建議使用專門用於 QA 的 Slack 工作區，而不是重複使用正式環境工作區。

下方的 SUT manifest 會刻意將內建 Slack 外掛的正式安裝（`extensions/slack/src/setup-shared.ts:10`）限縮為即時 Slack QA 套件涵蓋的權限與事件。關於使用者看到的正式頻道設定，請參閱 [Slack 頻道快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver/SUT 配對是刻意分開的，因為此通道需要同一個工作區中兩個不同的 bot 使用者 id。

**1. 建立 Driver app**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → 選取 QA 工作區、貼上下列 manifest，然後 _Install to Workspace_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

複製 _Bot User OAuth Token_（`xoxb-...`）- 這會成為 `driverBotToken`。驅動程式只需要張貼訊息並識別自身；不需要事件，也不需要 Socket Mode。

**2. 建立 SUT app**

在同一個工作區重複 _Create New App → From a manifest_。這個 QA app 刻意使用隨附 Slack 外掛生產 manifest 的較窄版本（`extensions/slack/src/setup-shared.ts:10`）：因為即時 Slack QA 套件尚未涵蓋反應處理，所以省略反應 scope 和事件。

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Slack 建立 app 後，在它的設定頁面執行兩件事：

- _Install to Workspace_ → 複製 _Bot User OAuth Token_ → 這會成為 `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 新增 scope `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會成為 `sutAppToken`。

對每個 token 呼叫 `auth.test`，確認兩個 Bot 有不同的使用者 id。執行階段會依使用者 id 區分驅動程式與 SUT；重複使用同一個 app 來擔任兩者，會立刻在提及閘控失敗。

**3. 建立頻道**

在 QA 工作區中建立頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個 Bot：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` id - 這會成為 `channelId`。公開頻道可行；如果使用私人頻道，兩個 app 都已具備 `groups:history`，因此 harness 的歷史讀取仍會成功。

**4. 註冊憑證**

有兩種選項。單機除錯時使用 env vars（設定四個 `OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或將共享 Convex pool 植入資料，讓 CI 和其他維護者可以租用。

對於 Convex pool，將四個欄位寫入 JSON 檔：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在 shell 中匯出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 後，註冊並驗證：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

預期 `count: 1`、`status: "active"`，且沒有 `lease` 欄位。

**5. 端對端驗證**

在本機執行 lane，確認兩個 Bot 能透過 broker 互相對話：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功執行會在遠低於 30 秒內完成，且 `slack-qa-report.md` 會顯示 `slack-canary` 和 `slack-mention-gating` 的狀態皆為 `pass`。如果 lane 卡住約 90 秒並以 `Convex credential pool exhausted for kind "slack"` 結束，表示 pool 為空，或每一列都已被租用 - `qa credentials list --kind slack --status all --json` 會告訴你是哪一種情況。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

目標是兩個專用 WhatsApp Web 帳號：由 harness 控制的驅動程式帳號，以及由子 OpenClaw 閘道透過隨附 WhatsApp 外掛啟動的 SUT 帳號。

使用 `--credential-source env` 時必要的 env：

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

選用：

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` 會啟用群組情境，例如
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、群組 action/media/poll 情境，以及
  `whatsapp-group-allowlist-block`。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` 會在
  observed-message 成品中保留訊息本文。

情境目錄（`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`）：

- 基準與群組閘控：`whatsapp-canary`、`whatsapp-pairing-block`、
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、
  `whatsapp-top-level-reply-shape`、`whatsapp-restart-resume`、
  `whatsapp-group-allowlist-block`。
- 原生命令：`whatsapp-help-command`、`whatsapp-status-command`、
  `whatsapp-commands-command`、`whatsapp-tools-compact-command`、
  `whatsapp-whoami-command`、`whatsapp-context-command`、
  `whatsapp-native-new-command`。
- 回覆與最終輸出行為：`whatsapp-tool-only-usage-footer`、
  `whatsapp-reply-to-message`、`whatsapp-group-reply-to-message`、
  `whatsapp-reply-to-mode-batched`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`、`whatsapp-stream-final-message-accounting`。
- 使用者路徑訊息動作：`whatsapp-agent-message-action-react` 會從
  真實驅動程式 DM 開始，讓模型呼叫 `message` 工具，並觀察原生
  WhatsApp 反應。`whatsapp-agent-message-action-upload-file` 以相同姿態使用
  `message(action=upload-file)`，並觀察原生
  WhatsApp 媒體。`whatsapp-group-agent-message-action-react` 和
  `whatsapp-group-agent-message-action-upload-file` 會在真實 WhatsApp 群組中證明相同的使用者可見動作。
- 群組 fanout：`whatsapp-broadcast-group-fanout` 會從一則被提及的
  WhatsApp 群組訊息開始，並驗證來自 `main` 和
  `qa-second` 的不同可見回覆。
- 群組啟用：`whatsapp-group-activation-always` 會將真實群組
  工作階段變更為 `/activation always`，證明未提及的群組訊息會喚醒
  agent，然後還原為 `/activation mention`。`whatsapp-group-reply-to-bot-triggers`
  會植入一則 Bot 回覆，傳送一則沒有明確提及的原生引用回覆，
  並驗證 agent 會從該回覆脈絡中醒來。
- 傳入媒體與結構化訊息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  這些會透過驅動程式傳送真實 WhatsApp 圖片、音訊、文件、位置、聯絡人、貼圖，
  和反應事件。
- 直接 Gateway contract probes：
  `whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。這些會刻意繞過模型提示，
  並證明確定性的閘道/channel `send`、`poll` 和 `message.action`
  contract。
- 存取控制涵蓋範圍：`whatsapp-access-control-dm-open`、
  `whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、
  `whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- 原生核准：`whatsapp-approval-exec-deny-native`、
  `whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、
  `whatsapp-approval-exec-group-reaction-native`、
  `whatsapp-approval-plugin-native`。
- 狀態反應：`whatsapp-status-reactions`、
  `whatsapp-status-reaction-lifecycle`。

目錄目前包含 50 個情境。`live-frontier` 預設 lane 維持較小規模，包含 10 個情境，以提供快速冒煙涵蓋。`mock-openai` 預設 lane 會在只模擬模型輸出的情況下，透過真實 WhatsApp 傳輸執行 44 個確定性情境。核准情境與少數較重或阻塞的檢查，仍需以情境 id 明確指定。

WhatsApp QA 驅動程式會觀察結構化即時事件（`text`、`media`、
`location`、`reaction` 和 `poll`），也可以主動傳送媒體、投票、
聯絡人、位置和貼圖。QA Lab 會透過
`@openclaw/whatsapp/api.js` 套件介面匯入該驅動程式，而不是深入私有
WhatsApp 執行階段檔案。對於群組觀察，`fromJid` 是群組 JID，而
`participantJid` 和 `fromPhoneE164` 會識別參與者傳送者。訊息
內容預設會被遮蔽。直接閘道
poll、upload-file、media、group poll、group media 和 reply-shape probe 是 transport/API contract
檢查；它們不會被視為使用者提示讓 agent 選擇相同動作的證明。使用者路徑動作證明來自
`whatsapp-agent-message-action-react` 和
`whatsapp-group-agent-message-action-react` 等情境，其中驅動程式會傳送一般
WhatsApp 訊息，而 QA Lab 會觀察產生的原生 WhatsApp 成品。
WhatsApp 報告包含每個情境的姿態（`user-path`、`direct-gateway`
或 `native-approval`），因此證據不會被誤認為比實際證明更強的 contract。

輸出成品：

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `whatsapp-qa-observed-messages.json` - 除非 `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Convex 憑證 pool

Telegram、Discord、Slack 和 WhatsApp lane 可以從共享 Convex pool 租用憑證，而不是讀取上述 env vars。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得排他租約，在執行期間為其送出心跳偵測，並在關閉時釋放。Pool kinds 為 `"telegram"`、`"discord"`、`"slack"` 和 `"whatsapp"`。

Broker 在 `admin/add` 上驗證的 payload 形狀：

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` 必須是數值型 chat-id 字串。
- Telegram 真實使用者 (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - 僅供 Mantis Telegram Desktop 證明使用。通用 QA Lab 路徑不得取得此類型。
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 電話號碼必須是彼此不同的 E.164 字串。

Mantis Telegram Desktop 證明工作流程會持有一個專用的 Convex
`telegram-user` 租約，同時供 TDLib 命令列介面驅動程式和 Telegram Desktop
見證者使用，然後在發布證明後釋放。

當 PR 需要確定性的視覺差異時，Mantis 可以在 `main` 和 PR head 上使用相同的模擬模型
回覆，同時變更 Telegram 格式化器或傳遞
層。擷取預設值已針對 PR 評論調校：標準 Crabbox
類別、24fps 桌面錄影、24fps 動態 GIF，以及 1920px 預覽寬度。
前後對照評論應發布乾淨的套件組合，其中只包含
預期的 GIF。

Slack 路徑也可以使用該集區。Slack payload 形狀檢查目前位於 Slack QA runner，而不是 broker；請使用 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`，並使用像 `Cxxxxxxxxxx` 這樣的 Slack 頻道 ID。請參閱[設定 Slack 工作區](#setting-up-the-slack-workspace)以了解 app 和 scope 佈建。

操作用環境變數與 Convex broker 端點契約位於[測試 → 透過 Convex 共用 Telegram 認證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（章節名稱早於多頻道集區；租約語意在各種類型之間共用）。

## 由 repo 支援的種子資料

種子資產位於 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

這些檔案刻意放在 git 中，讓 QA 計畫對人類和
代理都可見。

`qa-lab` 應維持為通用 YAML 情境執行器。每個情境 YAML 檔案都是
單次測試執行的事實來源，並應定義：

- 頂層 `title`
- `scenario` metadata
- `scenario` 中選用的 category、capability、lane 和 risk metadata
- `scenario` 中的 docs 和 code refs
- `scenario` 中選用的外掛需求
- `scenario` 中選用的閘道設定 patch
- flow 情境的可執行頂層 `flow`，或 Vitest 與 Playwright 情境的 `scenario.execution.kind` /
  `scenario.execution.path`

支援 `flow` 的可重用 runtime surface 可以保持通用
且橫跨多個關注面。例如，YAML 情境可以結合傳輸端
helper 與瀏覽器端 helper，透過閘道
`browser.request` seam 驅動嵌入式 Control UI，而不需要加入特殊案例 runner。

情境檔案應依產品能力分組，而不是依原始碼樹
資料夾分組。檔案移動時，請保持情境 ID 穩定；使用 `docsRefs` 和 `codeRefs`
追蹤實作。

基準清單應保持足夠廣泛，以涵蓋：

- DM 和頻道聊天
- thread 行為
- 訊息 action 生命週期
- 排程 callback
- 記憶回想
- 模型切換
- 子代理交接
- repo 讀取和文件讀取
- 一個小型建置任務，例如 Lobster Invaders

## 供應商模擬路徑

`qa suite` 有兩個本機供應商模擬路徑：

- `mock-openai` 是具情境感知能力的 OpenClaw 模擬。它仍是 repo 支援 QA 和 parity gate 的預設
  確定性模擬路徑。
- `aimock` 會啟動 AIMock 支援的供應商伺服器，用於實驗性 protocol、
  fixture、record/replay 和 chaos 覆蓋。它是附加項目，不會
  取代 `mock-openai` 情境 dispatcher。

供應商路徑實作位於 `extensions/qa-lab/src/providers/` 之下。
每個供應商擁有其預設值、本機伺服器啟動、閘道模型設定、
auth-profile staging 需求，以及 live/mock capability flags。共用 suite 和
閘道程式碼應透過供應商 registry 路由，而不是依供應商名稱分支。

## 傳輸 adapter

`qa-lab` 擁有適用於 YAML QA 情境的通用傳輸 seam。`qa-channel` 是
合成預設值。`crabline` 會啟動符合本機供應商形狀的伺服器，並對其執行
OpenClaw 的一般頻道外掛。`live` 保留給真實
供應商認證和外部頻道使用。

在架構層級，分工如下：

- `qa-lab` 擁有通用情境執行、worker concurrency、artifact 寫入，以及 reporting。
- 傳輸 adapter 擁有閘道設定、readiness、inbound 和 outbound observation、transport actions，以及 normalized transport state。
- `qa/scenarios/` 下的 YAML 情境檔案定義測試執行；`qa-lab` 提供用來執行它們的可重用 runtime surface。

### 新增頻道

將頻道新增至 YAML QA 系統需要頻道實作，加上
一組用於驗證頻道契約的情境包。若要取得 smoke CI 覆蓋，請新增
對應的 Crabline 本機供應商伺服器，並透過 `crabline`
driver 對外提供。

當共用 `qa-lab` host 可以擁有該 flow 時，不要新增新的頂層 QA command root。

`qa-lab` 擁有共用 host 機制：

- `openclaw qa` command root
- suite startup 和 teardown
- worker concurrency
- artifact 寫入
- report 產生
- 情境執行
- 舊版 `qa-channel` 情境的 compatibility aliases

Runner 外掛擁有傳輸契約：

- `openclaw qa <runner>` 如何掛載於共用 `qa` root 之下
- 閘道如何針對該傳輸設定
- readiness 如何檢查
- inbound events 如何注入
- outbound messages 如何觀察
- transcripts 和 normalized transport state 如何公開
- transport-backed actions 如何執行
- transport-specific reset 或 cleanup 如何處理

新頻道的最低採用門檻：

1. 保持 `qa-lab` 作為共用 `qa` root 的擁有者。
2. 在共用 `qa-lab` host seam 上實作 transport runner。
3. 將傳輸專屬機制保留在 runner 外掛或 channel harness 內。
4. 將 runner 掛載為 `openclaw qa <runner>`，而不是註冊競爭性的 root command。Runner 外掛應在 `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；lazy CLI 和 runner 執行應維持在個別 entrypoints 之後。
5. 在主題式 `qa/scenarios/` 目錄下撰寫或改寫 YAML 情境。
6. 針對新情境使用通用情境 helper。
7. 除非 repo 正在進行有意的遷移，否則保持既有 compatibility aliases 可運作。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，請放在 `qa-lab`。
- 如果行為依賴單一頻道傳輸，請將它保留在該 runner 外掛或外掛 harness 中。
- 如果情境需要一項可由多個頻道使用的新 capability，請新增通用 helper，而不是在 `suite.ts` 中新增頻道專屬分支。
- 如果某個行為只對單一傳輸有意義，請保持該情境為傳輸專屬，並在情境契約中明確表示。

### 情境 helper 名稱

新情境偏好的通用 helper：

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Compatibility aliases 仍可供既有情境使用 - `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` - 但新情境撰寫應使用通用名稱。這些 aliases 存在是為了避免一次性遷移，而不是作為未來的模型。

## 報告

`qa-lab` 會從觀察到的 bus timeline 匯出 Markdown protocol report。
該報告應回答：

- 哪些有效
- 哪些失敗
- 哪些仍受阻
- 哪些後續情境值得新增

若要取得可用情境清單，以便評估後續工作規模或串接新傳輸，請執行 `pnpm openclaw qa coverage`（加入 `--json` 可取得機器可讀輸出）。
為受影響行為或檔案路徑選擇聚焦證明時，請執行 `pnpm openclaw qa coverage --match <query>`。
match report 會搜尋情境 metadata、docs refs、code refs、coverage IDs、外掛和供應商需求，然後列印相符的 `qa suite --scenario ...` targets。
每次 `qa suite` 執行都會為選取的
情境集合寫入頂層 `qa-evidence.json`、
`qa-suite-summary.json` 和 `qa-suite-report.md` artifacts。宣告 `execution.kind: vitest` 或
`execution.kind: playwright` 的情境會執行相符的測試路徑，並且也會寫入
每個情境的 logs。宣告 `execution.kind: script` 的情境會透過 `node --import tsx` 執行
位於 `execution.path` 的
evidence producer（其中
`${outputDir}` 和 `${scenarioId}` 會在 `execution.args` 中展開）；producer
會寫入自己的 `qa-evidence.json`，其 entries 會匯入 suite
輸出，而其 artifact paths 會相對於該 producer 的
`qa-evidence.json` 解析。當 `qa suite` 透過
`qa run --qa-profile` 進入時，同一個 `qa-evidence.json` 也會包含所選 taxonomy categories 的 profile
scorecard summary。
請將它視為探索輔助，而不是 gate 替代品；所選情境仍需要正確的供應商模式、live transport、Multipass、Testbox 或 release lane，才能驗證受測行為。
如需 scorecard 脈絡，請參閱[成熟度 scorecard](/zh-TW/maturity/scorecard)。

若要進行角色和風格檢查，請跨多個 live model
refs 執行相同情境，並寫入經評審的 Markdown report：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

該命令會執行本機 QA 閘道子程序，而不是 Docker。角色評估
情境應透過 `SOUL.md` 設定角色人格，然後執行一般使用者回合，
例如聊天、工作區協助和小型檔案任務。不應告知候選模型
它正在接受評估。該命令會保留每份完整
逐字稿、記錄基本執行統計，然後以快速模式要求評審模型，
並在支援時使用 `xhigh` 推理，依自然度、氛圍和幽默感為各次執行排名。
比較提供者時請使用 `--blind-judge-models`：評審提示仍會取得
每份逐字稿和執行狀態，但候選參照會替換為中性的
標籤，例如 `candidate-01`；報告會在解析後將排名對應回真實參照。
候選執行預設使用 `high` 思考，GPT-5.5 使用 `medium`，較舊且支援的 OpenAI 評估參照則使用 `xhigh`。
可使用 `--model provider/model,thinking=<level>` 內嵌覆寫特定候選。
`--thinking <level>` 仍會設定全域備用值，而較舊的 `--model-thinking <provider/model=level>` 形式
會保留以維持相容性。
OpenAI 候選參照預設為快速模式，因此在提供者支援時會使用
優先處理。當單一候選或評審需要覆寫時，請內嵌加入 `,fast`、`,no-fast` 或 `,fast=false`。
只有在想要強制每個候選模型都啟用快速模式時，才傳入 `--fast`。
候選與評審的耗時會記錄在報告中以供基準分析，但評審提示會明確要求
不要依速度排名。
候選與評審模型執行預設並行度皆為 16。當提供者限制或本機閘道
壓力使執行結果過於嘈雜時，請降低 `--concurrency` 或 `--judge-concurrency`。
未傳入候選 `--model` 時，角色評估預設使用
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-8`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`，以及
`google/gemini-3.1-pro-preview`。
未傳入 `--judge-model` 時，評審預設使用
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-8,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [成熟度計分卡](/zh-TW/maturity/scorecard)
- [個人代理基準套件](/zh-TW/concepts/personal-agent-benchmark-pack)
- [QA 頻道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
