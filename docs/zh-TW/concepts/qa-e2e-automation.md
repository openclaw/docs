---
read_when:
    - 了解 QA 堆疊如何彼此配合
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的 QA 情境
    - 圍繞閘道儀表板建置更高擬真度的 QA 自動化
summary: QA 堆疊概覽：qa-lab、qa-channel、儲存庫支援的情境、即時傳輸通道、傳輸配接器與報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-06-30T13:47:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊的用途，是以比單一單元測試更接近真實情境、
更符合通道形態的方式演練 OpenClaw。

目前組成：

- `extensions/qa-channel`：合成訊息通道，具備 DM、頻道、討論串、
  回應、編輯與刪除介面。
- `extensions/qa-lab`：除錯器 UI 與 QA 匯流排，用於觀察轉錄、
  注入傳入訊息，以及匯出 Markdown 報告。
- `extensions/qa-matrix`、未來的 runner 外掛：即時傳輸配接器，
  會在子 QA 閘道內驅動真實通道。
- `qa/`：由 repo 支援的種子資產，用於啟動任務與基準 QA
  情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器截圖、VM 狀態與 PR 證據的錯誤，
  進行修復前與修復後的即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多流程有 `pnpm qa:*`
腳本別名；兩種形式都支援。

| 命令                                                | 用途                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | 不使用 `--qa-profile` 的內建 QA 自我檢查；使用 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all` 時，執行由分類法支援的成熟度設定檔 runner。                                                                                                             |
| `qa suite`                                          | 在 QA 閘道路徑上執行由 repo 支援的情境。別名：`pnpm openclaw qa suite --runner multipass`，用於一次性的 Linux VM。                                                                                                                                                         |
| `qa coverage`                                       | 列印 YAML 情境覆蓋率清單（`--json` 用於機器輸出）。                                                                                                                                                                                                                       |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案並寫入 agentic parity 報告，或使用 `--runtime-axis --token-efficiency`，從一個 runtime-pair 摘要寫入 Codex 與 OpenClaw 執行階段對等性與 token 效率報告。                                                                                  |
| `qa character-eval`                                 | 對多個即時模型執行角色 QA 情境，並產生評審報告。請參閱[報告](#reporting)。                                                                                                                                                                                                  |
| `qa manual`                                         | 對選取的 provider/model 路徑執行一次性提示。                                                                                                                                                                                                                              |
| `qa ui`                                             | 啟動 QA 除錯器 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                            |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像檔。                                                                                                                                                                                                                                         |
| `qa docker-scaffold`                                | 寫入 QA dashboard + 閘道路徑的 docker-compose 鷹架。                                                                                                                                                                                                                       |
| `qa up`                                             | 建置 QA 網站、啟動 Docker 支援的堆疊，並列印 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                                       |
| `qa aimock`                                         | 只啟動 AIMock provider 伺服器。                                                                                                                                                                                                                                           |
| `qa mock-openai`                                    | 只啟動具備情境感知能力的 `mock-openai` provider 伺服器。                                                                                                                                                                                                                   |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用的 Convex 憑證池。                                                                                                                                                                                                                                                |
| `qa matrix`                                         | 對一次性的 Tuwunel homeserver 執行即時傳輸路徑。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                                                                                                  |
| `qa telegram`                                       | 對真實的私人 Telegram 群組執行即時傳輸路徑。                                                                                                                                                                                                                              |
| `qa discord`                                        | 對真實的私人 Discord guild 頻道執行即時傳輸路徑。                                                                                                                                                                                                                         |
| `qa slack`                                          | 對真實的私人 Slack 頻道執行即時傳輸路徑。                                                                                                                                                                                                                                 |
| `qa whatsapp`                                       | 對真實的 WhatsApp Web 帳號執行即時傳輸路徑。                                                                                                                                                                                                                              |
| `qa mantis`                                         | 針對即時傳輸錯誤的修復前與修復後驗證 runner，包含 Discord 狀態回應證據、Crabbox 桌面/瀏覽器 smoke，以及 Slack-in-VNC smoke。請參閱 [Mantis](/zh-TW/concepts/mantis) 與 [Mantis Slack Desktop Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。 |

由設定檔支援的 `qa run` 會從 `taxonomy.yaml` 讀取成員資格，然後透過
`qa suite` 分派解析後的情境。`--surface` 與
`--category` 會篩選選取的設定檔，而不是定義個別路徑。
產生的 `qa-evidence.json` 包含設定檔計分卡摘要，其中有
選取的類別計數與缺漏覆蓋率 ID；個別證據項目仍然是測試、
覆蓋率角色與結果的事實來源。分類法功能覆蓋率 ID 是精確的證明目標，
不是別名。主要情境覆蓋率會滿足相符的 ID；次要覆蓋率維持建議性質。
覆蓋率 ID 使用點分隔的 `namespace.behavior` 形式，片段為小寫
英數字元/連字號；設定檔、介面與類別 ID 仍可使用
現有的連字號或點分隔分類法 ID。
精簡證據會省略每個項目的 `execution`，並設定 `evidenceMode: "slim"`；
`smoke-ci` 預設為精簡模式，而 `--evidence-mode full` 會還原完整項目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 搭配 mock 模型 provider 與
Crabline 本機 provider 伺服器，取得決定性的設定檔證明。
使用 `release` 針對即時通道取得穩定版/LTS 證明。
只有在明確需要完整分類法證據執行時才使用 `all`；它會選取
每個啟用中的成熟度類別，並可透過 `QA Profile
Evidence` 工作流程搭配 `qa_profile=all` 分派。當命令也需要 OpenClaw
根設定檔時，請將根設定檔放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作者流程

目前的 QA 操作者流程是一個雙窗格 QA 網站：

- 左側：含 agent 的閘道 dashboard（Control UI）。
- 右側：QA Lab，顯示類 Slack 轉錄與情境計畫。

使用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA 網站、啟動 Docker 支援的閘道路徑，並公開
QA Lab 頁面，讓操作者或自動化迴圈可以指派 QA
任務給 agent、觀察真實通道行為，並記錄哪些可運作、失敗或
仍受阻。

若要更快反覆調整 QA Lab UI，而不必每次都重新建置 Docker 映像檔，
請使用 bind-mounted QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務使用預先建置的映像檔，並將
`extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` 容器中。`qa:lab:watch`
會在變更時重新建置該 bundle，而當 QA Lab
資產雜湊變更時，瀏覽器會自動重新載入。

若要執行本機 OpenTelemetry 訊號 smoke，請執行：

```bash
pnpm qa:otel:smoke
```

該腳本會啟動本機 OTLP/HTTP receiver，並在啟用 `diagnostics-otel` 外掛後，
執行 `otel-trace-smoke` QA 情境，接著斷言 traces、
metrics 與 logs 已匯出。它會解碼匯出的 protobuf trace spans，
並檢查 release 關鍵形狀：
`openclaw.run`、`openclaw.harness.run`、最新 GenAI semantic-convention
model-call span、`openclaw.context.assembled` 與 `openclaw.message.delivery`
必須存在。smoke 會強制
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此 model-call
span 必須使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名稱；
成功回合的模型呼叫不得匯出 `StreamAbandoned`；原始診斷 ID 與
`openclaw.content.*` 屬性必須留在 trace 之外。原始 OTLP
payload 不得包含提示 sentinel、回應 sentinel 或 QA session
key。它會將 `otel-smoke-summary.json` 寫在 QA suite artifacts 旁邊。

若要執行由 collector 支援的 OpenTelemetry smoke，請執行：

```bash
pnpm qa:otel:collector-smoke
```

該路徑會在同一個本機 receiver 前方放置真實的 OpenTelemetry Collector Docker 容器。
當變更 endpoint wiring、collector 相容性，或可能被 in-process receiver 遮蔽的
OTLP 匯出行為時，請使用它。

若要執行受保護的 Prometheus scrape smoke，請執行：

```bash
pnpm qa:prometheus:smoke
```

該別名會在啟用 `diagnostics-prometheus` 的情況下執行 `docker-prometheus-smoke` QA 情境，驗證未驗證身分的抓取會被拒絕，接著檢查已驗證身分的抓取是否包含發布關鍵的指標族，且不含提示內容、回應內容、原始診斷識別碼、驗證權杖或本機路徑。

若要連續執行兩個可觀測性冒煙測試，請使用：

```bash
pnpm qa:observability:smoke
```

若要執行由 collector 支援的 OpenTelemetry 路徑加上受保護的 Prometheus 抓取冒煙測試，請使用：

```bash
pnpm qa:observability:collector-smoke
```

可觀測性 QA 僅適用於原始碼 checkout。npm tarball 會刻意省略 QA Lab，因此套件 Docker 發布路徑不會執行 `qa` 命令。變更診斷儀表化時，請從已建置的原始碼 checkout 執行 `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke` 或 `pnpm qa:observability:smoke`。

若要執行不需要模型供應商憑證的真實傳輸 Matrix 冒煙路徑，請搭配確定性的模擬 OpenAI 供應商執行 fast profile：

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

若要執行 live-frontier 供應商路徑，請明確提供 OpenAI 相容憑證：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

此路徑的完整命令列介面參考、profile/情境目錄、環境變數與成品配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。簡要來說：它會在 Docker 中佈建一次性的 Tuwunel homeserver、註冊暫時的 driver/SUT/observer 使用者、在限定於該傳輸的子 QA 閘道內執行真正的 Matrix 外掛（沒有 `qa-channel`），然後在 `.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown 報告、JSON 摘要、observed-events 成品與合併輸出記錄。

這些情境涵蓋單元測試無法端對端證明的傳輸行為：提及閘控、allow-bot 政策、允許清單、頂層與串接回覆、DM 路由、reaction 處理、入站編輯抑制、重新啟動 replay 去重、homeserver 中斷復原、核准中繼資料傳遞、媒體處理，以及 Matrix E2EE bootstrap/recovery/verification 流程。E2EE 命令列介面 profile 也會在檢查閘道回覆之前，透過同一個一次性 homeserver 驅動 `openclaw matrix encryption setup` 與驗證命令。

Discord 也有僅供 Mantis 選用的錯誤重現情境。使用 `--scenario discord-status-reactions-tool-only` 取得明確的狀態 reaction 時間軸，或使用 `--scenario discord-thread-reply-filepath-attachment` 建立真正的 Discord thread，並驗證 `message.thread-reply` 會保留 `filePath` 附件。這些情境不會納入預設的即時 Discord 路徑，因為它們是前後對照的重現探針，而不是廣泛的冒煙覆蓋。當 QA 環境設定了 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 時，thread-attachment Mantis 工作流程也可以加入已登入的 Discord Web 見證影片。該 viewer profile 僅用於視覺擷取；通過/失敗判定仍來自 Discord REST oracle。

CI 在 `.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令介面。排程與預設手動執行會使用 QA 提供的 live-frontier 憑證、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` 執行 fast Matrix profile。手動 `matrix_profile=all` 會展開為五個 profile shard。

若要執行真實傳輸 Telegram、Discord、Slack 與 WhatsApp 冒煙路徑：

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

它們會以既有的真實頻道為目標，並使用兩個 bot 或帳號（driver + SUT）。必要環境變數、情境清單、輸出成品與 Convex 憑證池記錄於下方的 [Telegram、Discord、Slack 與 WhatsApp QA 參考](#telegram-discord-slack-and-whatsapp-qa-reference)。

若要執行含 VNC 救援的完整 Slack desktop VM 執行，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用 Crabbox desktop/browser 機器、在 VM 內執行 Slack 即時路徑、於 VNC 瀏覽器中開啟 Slack Web、擷取桌面，並在可用影片擷取時，將 `slack-qa/`、`slack-desktop-smoke.png` 與 `slack-desktop-smoke.mp4` 複製回 Mantis 成品目錄。Crabbox desktop/browser 租約會預先提供擷取工具與 browser/native-build 輔助套件，因此情境應只在較舊租約上安裝 fallback。Mantis 會在 `mantis-slack-desktop-smoke-report.md` 中報告總耗時與各階段耗時，因此較慢的執行會顯示時間花在租約 warmup、憑證取得、遠端設定或成品複製。透過 VNC 手動登入 Slack Web 後，使用 `--lease-id <cbx_...>` 重用租約；重用的租約也會讓 Crabbox 的 pnpm store cache 保持溫熱。預設 `--hydrate-mode source` 會從原始碼 checkout 驗證，並在 VM 內執行安裝/建置。只有在重用的遠端工作區已經有 `node_modules` 與已建置的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；該模式會略過昂貴的安裝/建置步驟，並在工作區尚未準備好時失敗關閉。使用 `--gateway-setup` 時，Mantis 會在 VM 內的連接埠 `38973` 留下一個持續執行的 OpenClaw Slack 閘道；不使用時，該命令會執行一般 bot-to-bot Slack QA 路徑，並在成品擷取後結束。

若要用桌面證據證明原生 Slack 核准 UI，請執行 Mantis approval checkpoint 模式：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

此模式與 `--gateway-setup` 互斥。它會執行 Slack 核准情境、拒絕非核准情境 id、在每個 pending 與 resolved 核准狀態等待、將觀察到的 Slack API 訊息渲染為 `approval-checkpoints/<scenario>-pending.png` 與 `approval-checkpoints/<scenario>-resolved.png`，然後在任何 checkpoint、訊息證據、acknowledgement 或渲染截圖缺失或為空時失敗。冷 CI 租約可能仍會在 `slack-desktop-smoke.png` 中顯示 Slack 登入；approval checkpoint 圖片是此路徑的視覺證明。

操作員檢查清單、GitHub workflow dispatch 命令、evidence-comment 合約、hydrate-mode 決策表、耗時解讀與失敗處理步驟位於 [Mantis Slack Desktop Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。

若要執行 agent/CV 風格的桌面任務，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` 會租用或重用 Crabbox desktop/browser 機器、啟動 `crabbox record --while`、透過巢狀 `visual-driver` 驅動可見瀏覽器、擷取 `visual-task.png`，在選取 `--vision-mode image-describe` 時對截圖執行 `openclaw infer image describe`，並寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json` 與 `mantis-visual-task-report.md`。設定 `--expect-text` 時，vision prompt 會要求結構化 JSON verdict，且只有模型回報正向可見證據時才會通過；僅引用目標文字的負面回應會讓斷言失敗。使用 `--vision-mode metadata` 執行不呼叫影像理解供應商的無模型冒煙測試，用來證明 desktop、browser、screenshot 與 video 管線。錄影是 `visual-task` 的必要成品；如果 Crabbox 沒有錄到非空的 `visual-task.mp4`，即使 visual driver 通過，任務也會失敗。失敗時，除非任務已經通過且未設定 `--keep-lease`，否則 Mantis 會保留租約供 VNC 使用。

使用集區中的即時憑證之前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker 環境、驗證端點設定，並在 maintainer secret 存在時驗證 admin/list 可達性。它只會回報 secret 的已設定/缺失狀態。

## 即時傳輸覆蓋

即時傳輸路徑共用一個合約，而不是各自發明自己的情境清單形狀。`qa-channel` 是廣泛的合成產品行為套件，不屬於即時傳輸覆蓋矩陣。

即時傳輸 runner 應從 `openclaw/plugin-sdk/qa-live-transport-scenarios` 匯入共用情境 id、基準覆蓋輔助工具與情境選擇輔助工具。

| 路徑     | Canary | 提及閘控 | Bot-to-bot | 允許清單封鎖 | 頂層回覆 | 引用回覆 | 重新啟動恢復 | Thread 後續回覆 | Thread 隔離 | Reaction 觀察 | Help command | 原生命令註冊 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

這會讓 `qa-channel` 維持為廣泛的產品行為套件，同時 Matrix、Telegram 與其他即時傳輸共用一份明確的傳輸合約檢查清單。

若要執行一次性 Linux VM 路徑且不把 Docker 帶入 QA 路徑，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass guest、安裝相依套件、在 guest 內建置 OpenClaw、執行 `qa suite`，然後將一般 QA 報告與摘要複製回 host 上的 `.artifacts/qa-e2e/...`。它會重用與 host 上 `qa suite` 相同的情境選擇行為。Host 與 Multipass suite 執行預設會使用隔離的閘道 worker 平行執行多個已選情境。`qa-channel` 預設並行度為 4，並受已選情境數量限制。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 進行序列執行。使用 `--pack personal-agent` 執行個人助理基準 pack。pack selector 會與重複的 `--scenario` flags 疊加：明確情境會先執行，接著 pack 情境會依 pack 順序執行並移除重複項。當自訂 QA runner 已提供 OpenTelemetry collector 設定，並想一併選取 OpenTelemetry 與 Prometheus 診斷冒煙情境時，使用 `--pack observability`。若任何情境失敗，命令會以非零狀態結束。當你想取得成品而不讓 exit code 失敗時，使用 `--allow-failures`。即時執行會轉送適合 guest 的受支援 QA 驗證輸入：以 env 為基礎的供應商 key、QA 即時供應商 config path，以及存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在 repo root 下，讓 guest 可以透過掛載的工作區寫回。

## Telegram、Discord、Slack 與 WhatsApp QA 參考

Matrix 有[專屬頁面](/zh-TW/concepts/qa-matrix)，因為它的情境數量較多，且需要以 Docker 支援的 homeserver 佈建。Telegram、Discord、Slack 與 WhatsApp 會針對既有的真實傳輸執行，因此其參考資料放在此處。

### 共用命令列介面旗標

這些通道會透過 `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並接受相同旗標：

| 旗標                                  | 預設值                                            | 說明                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 只執行此情境。可重複指定。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 寫入報告、摘要、證據、傳輸專屬成品與輸出記錄的位置。相對路徑會以 `--repo-root` 為基準解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 從中立 cwd 呼叫時的儲存庫根目錄。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA 閘道設定中的暫時帳號 id。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | 提供者預設值                                   | 主要／替代模型 ref。                                                                                                                   |
| `--fast`                              | 關閉                                                | 支援時使用的提供者快速模式。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | 請參閱 [Convex 憑證集區](#convex-credential-pool)。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                 | 使用 `--credential-source convex` 時採用的角色。                                                                                                    |

任何情境失敗時，每個通道都會以非零狀態結束。`--allow-failures` 會寫入成品，但不設定失敗的結束代碼。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私人 Telegram 群組，並使用兩個不同的 Bot（driver + SUT）。SUT Bot 必須有 Telegram 使用者名稱；當兩個 Bot 都在 `@BotFather` 中啟用 **Bot-to-Bot Communication Mode** 時，Bot 對 Bot 觀察效果最佳。

使用 `--credential-source env` 時所需的 env：

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

隱含的預設集合一定涵蓋 canary、提及閘控、原生命令回覆、命令定址與 Bot 對 Bot 群組回覆。`mock-openai` 預設值也包含確定性的回覆鏈與最終訊息串流檢查。`telegram-current-session-status-tool` 保持選用，因為它只有在 canary 後直接接續執行時才穩定，而不是在任意原生命令回覆後穩定。使用 `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` 可印出目前的預設／選用分割與回歸 refs。

輸出成品：

- `telegram-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目，包含 profile、coverage、provider、channel、artifacts、result 與 RTT 欄位。

套件 Telegram 執行使用相同的 Telegram 憑證合約。重複 RTT
測量是一般套件 Telegram 即時通道的一部分；RTT
分佈會在所選 RTT 檢查的 `result.timing` 下併入 `qa-evidence.json`。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 時，套件即時包裝器會
租用 `kind: "telegram"` 憑證，將租用的群組／driver／SUT Bot
env 匯出到已安裝套件的執行中，對租約送出心跳偵測，並在
關閉時釋放租約。選取 Convex 時，套件包裝器在 CI 外預設為
對 `telegram-mentioned-message-reply` 執行 20 次 RTT 檢查、30 秒 RTT 逾時，
以及 Convex 角色 `maintainer`。覆寫
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`，即可調整 RTT 測量，而不需要
建立個別 RTT 命令或 Telegram 專屬摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私人 Discord guild channel，並使用兩個 Bot：由 harness 控制的 driver Bot，以及由子 OpenClaw 閘道透過內建 Discord 外掛啟動的 SUT Bot。會驗證 channel 提及處理、SUT Bot 已向 Discord 註冊原生 `/help` 命令，以及選用的 Mantis 證據情境。

使用 `--credential-source env` 時所需的 env：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須符合 Discord 傳回的 SUT Bot 使用者 id（否則此通道會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在 observed-message 成品中保留訊息內文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 會為 `discord-voice-autojoin` 選取語音／stage channel；若未設定，情境會選擇 SUT Bot 可見的第一個語音／stage channel。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 選用語音情境。單獨執行，啟用 `channels.discord.voice.autoJoin`，並驗證 SUT Bot 目前的 Discord 語音狀態是目標語音／stage channel。Convex Discord 憑證可包含選用的 `voiceChannelId`；否則 runner 會在 guild 中探索第一個可見的語音／stage channel。
- `discord-status-reactions-tool-only` - 選用 Mantis 情境。因為它會將 SUT 切換為 always-on、僅工具的 guild 回覆，並設定 `messages.statusReactions.enabled=true`，所以會單獨執行；接著擷取 REST reaction 時間軸以及 HTML/PNG 視覺成品。Mantis 前後比較報告也會保留情境提供的 MP4 成品為 `baseline.mp4` 與 `candidate.mp4`。

明確執行 Discord 語音自動加入情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

明確執行 Mantis 狀態反應情境：

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
- `discord-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則會遮蔽內文。
- 執行狀態反應情境時產生的 `discord-qa-reaction-timelines.json` 與 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目標是一個真實的私人 Slack channel，並使用兩個不同的 Bot：由 harness 控制的 driver Bot，以及由子 OpenClaw 閘道透過內建 Slack 外掛啟動的 SUT Bot。

使用 `--credential-source env` 時所需的 env：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在 observed-message 成品中保留訊息內文。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 會啟用 Mantis 的視覺核准
  checkpoint。runner 會寫入 `<scenario>.pending.json` 與
  `<scenario>.resolved.json`，然後等待相符的 `.ack.json` 檔案。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 會覆寫 checkpoint
  確認逾時。預設值為 `120000`。

情境（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - 選用的原生 Slack exec 核准情境。
  透過閘道要求 exec 核准，驗證 Slack 訊息有
  原生核准按鈕，解析它，並驗證已解析的 Slack 更新。
- `slack-approval-plugin-native` - 選用的原生 Slack 外掛核准情境。
  一併啟用 exec 與外掛核准轉送，讓外掛事件不會
  被 exec 核准路由抑制，然後驗證相同的待處理／已解析
  原生 Slack UI 路徑。

輸出成品：

- `slack-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `slack-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否則會遮蔽內文。
- `approval-checkpoints/` - 僅在 Mantis 設定
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 時產生；包含 checkpoint JSON、
  確認 JSON，以及待處理／已解析螢幕截圖。

#### 設定 Slack workspace

此通道需要在同一個 workspace 中有兩個不同的 Slack app，外加一個兩個 Bot 都是成員的 channel：

- `channelId` - 兩個 Bot 都已受邀加入之 channel 的 `Cxxxxxxxxxx` id。請使用專用 channel；此通道每次執行都會發文。
- `driverBotToken` - **Driver** app 的 Bot token（`xoxb-...`）。
- `sutBotToken` - **SUT** app 的 Bot token（`xoxb-...`），它必須是與 driver 不同的 Slack app，讓其 Bot 使用者 id 不同。
- `sutAppToken` - SUT app 的 app-level token（`xapp-...`），具備 `connections:write`，由 Socket Mode 使用，讓 SUT app 能接收事件。

建議使用專門用於 QA 的 Slack workspace，而不是重用 production workspace。

下方的 SUT manifest 會刻意將內建 Slack 外掛的 production 安裝（`extensions/slack/src/setup-shared.ts:10`）縮窄到即時 Slack QA suite 涵蓋的權限與事件。關於使用者看到的 production-channel 設定，請參閱 [Slack channel 快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver/SUT 配對刻意分開，因為此通道需要在同一個 workspace 中有兩個不同的 Bot 使用者 id。

**1. 建立 Driver app**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → 選取 QA 工作區，貼上下列 manifest，然後 _Install to Workspace_：

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

複製 _Bot User OAuth Token_（`xoxb-...`）- 這會成為 `driverBotToken`。驅動程式只需要張貼訊息並識別自己；不需要事件，也不需要 Socket Mode。

**2. 建立 SUT app**

在同一個工作區中重複 _Create New App → From a manifest_。這個 QA app 刻意使用隨附 Slack 外掛正式版 manifest（`extensions/slack/src/setup-shared.ts:10`）的較窄版本：反應 scope 和事件都省略，因為即時 Slack QA 套件尚未涵蓋反應處理。

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

Slack 建立 app 後，請在其設定頁面執行兩件事：

- _Install to Workspace_ → 複製 _Bot User OAuth Token_ → 這會成為 `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 新增 scope `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會成為 `sutAppToken`。

透過對每個 token 呼叫 `auth.test`，確認兩個 bot 有不同的使用者 ID。執行階段會依使用者 ID 區分驅動程式和 SUT；兩者重複使用同一個 app 會讓提及閘控立即失敗。

**3. 建立頻道**

在 QA 工作區中建立一個頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個 bot：

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` ID - 這會成為 `channelId`。公開頻道可用；如果使用私人頻道，兩個 app 已經都有 `groups:history`，因此測試框架的歷史讀取仍會成功。

**4. 登錄憑證**

有兩個選項。單機除錯時使用 env vars（設定四個 `OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或植入共用 Convex 池，讓 CI 和其他維護者可租用它們。

若使用 Convex 池，請將四個欄位寫入 JSON 檔案：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在 shell 中匯出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 後，登錄並驗證：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

預期 `count: 1`、`status: "active"`，且沒有 `lease` 欄位。

**5. 端對端驗證**

在本機執行通道，確認兩個 bot 可透過 broker 彼此對話：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

綠燈執行會在遠少於 30 秒內完成，且 `slack-qa-report.md` 會顯示 `slack-canary` 和 `slack-mention-gating` 的狀態都是 `pass`。如果通道卡住約 90 秒並以 `Convex credential pool exhausted for kind "slack"` 結束，表示池為空或每一列都已被租用 - `qa credentials list --kind slack --status all --json` 會告訴你是哪一種。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

目標是兩個專用 WhatsApp Web 帳號：一個由測試框架控制的驅動帳號，以及一個由子 OpenClaw 閘道透過隨附 WhatsApp 外掛啟動的 SUT 帳號。

使用 `--credential-source env` 時需要的 env：

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

選用：

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` 會啟用群組場景，例如
  `whatsapp-mention-gating` 和 `whatsapp-group-allowlist-block`。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` 會在
  observed-message 成品中保留訊息本文。

場景目錄（`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`）：

- 基準線和群組閘控：`whatsapp-canary`、`whatsapp-pairing-block`、
  `whatsapp-mention-gating`、`whatsapp-top-level-reply-shape`、
  `whatsapp-restart-resume`、`whatsapp-group-allowlist-block`。
- 原生命令：`whatsapp-help-command`、`whatsapp-status-command`、
  `whatsapp-commands-command`、`whatsapp-tools-compact-command`、
  `whatsapp-whoami-command`、`whatsapp-context-command`、
  `whatsapp-native-new-command`。
- 回覆和最終輸出行為：`whatsapp-tool-only-usage-footer`、
  `whatsapp-reply-to-message`、`whatsapp-group-reply-to-message`、
  `whatsapp-reply-context-isolation`、`whatsapp-reply-delivery-shape`、
  `whatsapp-stream-final-message-accounting`。
- 入站媒體和結構化訊息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`。這些會透過驅動程式傳送真實的 WhatsApp 圖片、音訊、
  文件、位置、聯絡人和貼圖事件。
- 出站閘道和訊息動作涵蓋範圍：
  `whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-message-actions`。
- 存取控制涵蓋範圍：`whatsapp-access-control-dm-open`、
  `whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、
  `whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- 原生核准：`whatsapp-approval-exec-deny-native`、
  `whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、
  `whatsapp-approval-plugin-native`。
- 狀態反應：`whatsapp-status-reactions`。

目錄目前包含 36 個場景。`live-frontier` 預設通道維持小型，使用 10 個場景提供快速 smoke 涵蓋範圍。`mock-openai` 預設通道會透過真實 WhatsApp 傳輸執行 31 個確定性場景，且只 mock 模型輸出。核准場景和少數較重或會阻塞的檢查，仍需以場景 ID 明確指定。

WhatsApp QA 驅動程式會觀察結構化即時事件（`text`、`media`、`location`、`reaction` 和 `poll`），並可主動傳送媒體、投票、聯絡人、位置和貼圖。QA Lab 透過 `@openclaw/whatsapp/api.js` 套件介面匯入該驅動程式，而不是深入私有 WhatsApp 執行階段檔案。訊息內容預設會遮蔽。出站投票和檔案上傳涵蓋範圍會透過確定性的閘道 `poll` 和 `message.action` 呼叫執行，而不是只靠模型提示的工具叫用。

輸出成品：

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `whatsapp-qa-observed-messages.json` - 除非設定 `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Convex 憑證池

Telegram、Discord、Slack 和 WhatsApp 通道可以從共用 Convex 池租用憑證，而不是讀取上述 env vars。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；QA Lab 會取得獨佔租用、在執行期間為它傳送心跳偵測，並在關閉時釋放它。池種類為 `"telegram"`、`"discord"`、`"slack"` 和 `"whatsapp"`。

Broker 在 `admin/add` 驗證的 payload 形狀：

- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string, sutToken: string }` - `groupId` 必須是數字 chat-id 字串。
- Telegram 真實使用者（`kind: "telegram-user"`）：`{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - 僅供 Mantis Telegram Desktop 證明使用。一般 QA Lab 通道不得取得此種類。
- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 電話號碼必須是不同的 E.164 字串。

Mantis Telegram Desktop 證明工作流程會持有一個獨佔 Convex `telegram-user` 租用，供 TDLib 命令列介面驅動程式和 Telegram Desktop 見證者共同使用，然後在發布證明後釋放它。

當 PR 需要確定性的視覺差異時，Mantis 可以在 `main` 和 PR head 上使用相同的 mock 模型回覆，同時變更 Telegram 格式化器或傳遞層。擷取預設值已針對 PR 留言調整：標準 Crabbox 類別、24fps 桌面錄影、24fps 動態 GIF，以及 1920px 預覽寬度。前後比較留言應發布乾淨的套件，只包含預期的 GIF。

Slack 通道也可以使用池。Slack payload 形狀檢查目前位於 Slack QA runner，而不是 broker；請使用 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`，並搭配像 `Cxxxxxxxxxx` 這樣的 Slack 頻道 ID。請參閱[設定 Slack 工作區](#setting-up-the-slack-workspace)，了解 app 和 scope 佈建。

操作 env vars 和 Convex broker 端點合約位於[測試 → 透過 Convex 共用 Telegram 憑證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)（該章節名稱早於多頻道池；租用語意在各種類之間共用）。

## Repo-backed seeds

Seed 資產位於 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

這些刻意放在 git 中，讓 QA 計畫對人類和代理都可見。

`qa-lab` 應維持為通用 YAML 場景 runner。每個場景 YAML 檔案都是一次測試執行的事實來源，且應定義：

- 頂層 `title`
- `scenario` 中繼資料
- `scenario` 中的選用類別、能力、通道和風險中繼資料
- `scenario` 中的文件和程式碼參照
- `scenario` 中的選用外掛需求
- `scenario` 中的選用閘道 config patch
- flow 場景的可執行頂層 `flow`，或 Vitest 和 Playwright 場景的 `scenario.execution.kind` /
  `scenario.execution.path`

支援 `flow` 的可重用執行階段介面可以維持通用且橫切。舉例來說，YAML 情境可以結合傳輸端輔助工具與瀏覽器端輔助工具，透過閘道的 `browser.request` 接縫驅動內嵌的控制 UI，而不需要加入特殊案例執行器。

情境檔案應依產品能力分組，而不是依來源樹資料夾分組。檔案移動時，請保持情境 ID 穩定；使用 `docsRefs` 和 `codeRefs` 追蹤實作。

基準清單應維持足夠廣泛，以涵蓋：

- DM 和頻道聊天
- 執行緒行為
- 訊息動作生命週期
- 排程回呼
- 記憶回想
- 模型切換
- 子代理交接
- 讀取儲存庫與讀取文件
- 一個小型建置任務，例如 Lobster Invaders

## 提供者模擬路徑

`qa suite` 有兩個本機提供者模擬路徑：

- `mock-openai` 是具情境感知的 OpenClaw 模擬。它仍是儲存庫支援 QA 和一致性閘門的預設確定性模擬路徑。
- `aimock` 會啟動 AIMock 支援的提供者伺服器，用於實驗性協定、夾具、錄製/重播和混沌涵蓋。它是附加項，不會取代 `mock-openai` 情境分派器。

提供者路徑實作位於 `extensions/qa-lab/src/providers/` 下。每個提供者擁有自己的預設值、本機伺服器啟動、閘道模型設定、驗證設定檔暫存需求，以及即時/模擬能力旗標。共享套件和閘道程式碼應透過提供者登錄進行路由，而不是依提供者名稱分支。

## 傳輸配接器

`qa-lab` 擁有 YAML QA 情境的通用傳輸接縫。`qa-channel` 是合成預設值。`crabline` 會啟動本機提供者形狀的伺服器，並讓 OpenClaw 的一般頻道外掛對其執行。`live` 保留給真實提供者憑證和外部頻道使用。

在架構層級，分工如下：

- `qa-lab` 擁有通用情境執行、工作者並行、成品寫入和報告。
- 傳輸配接器擁有閘道設定、就緒狀態、傳入與傳出觀察、傳輸動作，以及正規化的傳輸狀態。
- `qa/scenarios/` 下的 YAML 情境檔案定義測試執行；`qa-lab` 提供執行它們的可重用執行階段介面。

### 新增頻道

將頻道新增到 YAML QA 系統需要頻道實作，以及一組演練頻道合約的情境套件。若要提供煙霧 CI 涵蓋，請新增對應的 Crabline 本機提供者伺服器，並透過 `crabline` 驅動程式公開。

當共享的 `qa-lab` 主機可以擁有流程時，請勿新增新的頂層 QA 命令根。

`qa-lab` 擁有共享主機機制：

- `openclaw qa` 命令根
- 套件啟動與拆除
- 工作者並行
- 成品寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容性別名

執行器外掛擁有傳輸合約：

- `openclaw qa <runner>` 如何掛載在共享的 `qa` 根下
- 如何為該傳輸設定閘道
- 如何檢查就緒狀態
- 如何注入傳入事件
- 如何觀察傳出訊息
- 如何公開逐字稿和正規化的傳輸狀態
- 如何執行傳輸支援的動作
- 如何處理傳輸專屬的重設或清理

新頻道的最低採用門檻：

1. 讓 `qa-lab` 繼續擔任共享 `qa` 根的擁有者。
2. 在共享的 `qa-lab` 主機接縫上實作傳輸執行器。
3. 將傳輸專屬機制保留在執行器外掛或頻道測試框架內。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊競爭的根命令。執行器外掛應在 `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出對應的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；延遲命令列介面和執行器執行應留在獨立進入點後方。
5. 在主題式 `qa/scenarios/` 目錄下撰寫或調整 YAML 情境。
6. 新情境使用通用情境輔助工具。
7. 除非儲存庫正在進行有意的遷移，否則保持既有相容性別名可用。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，就放在 `qa-lab`。
- 如果行為依賴單一頻道傳輸，就保留在該執行器外掛或外掛測試框架中。
- 如果情境需要多個頻道都可使用的新能力，請新增通用輔助工具，而不是在 `suite.ts` 中加入頻道專屬分支。
- 如果某個行為只對一種傳輸有意義，請保持該情境為傳輸專屬，並在情境合約中明確說明。

### 情境輔助工具名稱

新情境偏好的通用輔助工具：

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

相容性別名仍可用於既有情境 - `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` - 但新的情境撰寫應使用通用名稱。這些別名存在是為了避免一次性遷移，而不是未來的模型。

## 報告

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 協定報告。報告應回答：

- 哪些運作正常
- 哪些失敗
- 哪些仍受阻
- 哪些後續情境值得新增

若要取得可用情境清單，這在估算後續工作或串接新傳輸時很有用，請執行 `pnpm openclaw qa coverage`（加入 `--json` 可取得機器可讀輸出）。
為受影響的行為或檔案路徑選擇聚焦證明時，請執行 `pnpm openclaw qa coverage --match <query>`。
比對報告會搜尋情境中繼資料、文件參照、程式碼參照、涵蓋 ID、外掛和提供者需求，然後印出相符的 `qa suite --scenario ...` 目標。
每次 `qa suite` 執行都會為選取的情境集合寫入頂層 `qa-evidence.json`、`qa-suite-summary.json` 和 `qa-suite-report.md` 成品。宣告 `execution.kind: vitest` 或 `execution.kind: playwright` 的情境會執行對應的測試路徑，並且也會寫入逐情境記錄。宣告 `execution.kind: script` 的情境會透過 `node --import tsx` 執行位於 `execution.path` 的證據產生器（`execution.args` 中的 `${outputDir}` 和 `${scenarioId}` 會展開）；產生器會寫入自己的 `qa-evidence.json`，其中的項目會匯入套件輸出，而其成品路徑會相對於該產生器的 `qa-evidence.json` 解析。當透過 `qa run --qa-profile` 到達 `qa suite` 時，同一個 `qa-evidence.json` 也會包含所選分類類別的設定檔計分卡摘要。
請將它視為探索輔助，而不是閘門替代品；選取的情境仍需要正確的提供者模式、即時傳輸、Multipass、Testbox 或發行路徑，才能證明受測行為。
如需計分卡脈絡，請參閱[成熟度計分卡](/zh-TW/maturity/scorecard)。

若要進行角色和風格檢查，請在多個即時模型參照上執行相同情境，並寫入經評審的 Markdown 報告：

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

此命令會執行本機 QA 閘道子程序，而不是 Docker。角色評估情境應透過 `SOUL.md` 設定人格，然後執行一般使用者回合，例如聊天、工作區協助和小型檔案任務。不應告知候選模型它正在接受評估。此命令會保留每份完整逐字稿、記錄基本執行統計，然後在支援時以快速模式搭配 `xhigh` 推理詢問評審模型，依自然度、氛圍和幽默感對各次執行排名。
比較提供者時，請使用 `--blind-judge-models`：評審提示仍會取得每份逐字稿和執行狀態，但候選參照會替換為中性標籤，例如 `candidate-01`；報告會在解析後將排名對應回真實參照。
候選執行預設使用 `high` thinking，GPT-5.5 使用 `medium`，支援的舊版 OpenAI 評估參照使用 `xhigh`。使用 `--model provider/model,thinking=<level>` 內嵌覆寫特定候選。`--thinking <level>` 仍會設定全域後援，而較舊的 `--model-thinking <provider/model=level>` 形式則保留以維持相容性。
OpenAI 候選參照預設使用快速模式，因此在提供者支援時會使用優先處理。當單一候選或評審需要覆寫時，請內嵌加入 `,fast`、`,no-fast` 或 `,fast=false`。只有在想要強制所有候選模型都啟用快速模式時，才傳入 `--fast`。候選和評審的持續時間會記錄在報告中，用於基準分析，但評審提示會明確說明不要依速度排名。
候選和評審模型執行預設並行度都是 16。當提供者限制或本機閘道壓力讓執行過於嘈雜時，請降低 `--concurrency` 或 `--judge-concurrency`。
未傳入候選 `--model` 時，角色評估預設為 `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。
未傳入 `--judge-model` 時，評審預設為 `openai/gpt-5.5,thinking=xhigh,fast` 和 `anthropic/claude-opus-4-8,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [成熟度計分卡](/zh-TW/maturity/scorecard)
- [個人代理基準套件](/zh-TW/concepts/personal-agent-benchmark-pack)
- [QA 頻道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
