---
read_when:
    - 了解 QA 堆疊如何組合運作
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的 QA 情境
    - 圍繞閘道儀表板建構更高真實度的 QA 自動化
summary: QA 技術棧概覽：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸配接器與報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-07-05T11:14:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fba58c5d3b1b2a5d57facfd77cdbf5c684d118633b4c73cfd3212ceda02bc36a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊會以逼近真實且符合通道形態的方式演練 OpenClaw，這是單元測試無法做到的。

組成：

- `extensions/qa-channel`：合成訊息通道，具備 DM、頻道、執行緒、反應、編輯與刪除表面。
- `extensions/qa-lab`：偵錯器 UI 與 QA 匯流排，用於觀察逐字稿、注入傳入訊息，以及匯出 Markdown 報告。
- `extensions/qa-matrix`：即時傳輸配接器，會在子 QA 閘道內驅動真正的 Matrix 外掛。
- `qa/`：由 repo 支援的種子資產，用於啟動任務與基準 QA 情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器螢幕截圖、VM 狀態與 PR 證據的錯誤，進行修正前/後即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多都有 `pnpm qa:*` 指令碼別名；兩種形式都可使用。

| 命令                                                | 用途                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不使用 `--qa-profile` 的內建 QA 自我檢查；使用 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all` 的 taxonomy 支援成熟度設定檔執行器。                                                                                                            |
| `qa suite`                                          | 針對 QA 閘道 lane 執行由 repo 支援的情境。`--runner multipass` 會使用一次性的 Linux VM，而不是主機。                                                                                                                                                                |
| `qa coverage`                                       | 列印 YAML 情境覆蓋率清單（`--json` 用於機器輸出；`--match <query>` 用於尋找受影響行為的情境；`--tools` 用於執行階段工具 fixture 覆蓋率）。                                                                                                                          |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案以作為模型軸同等性 gate，或使用 `--runtime-axis --token-efficiency` 寫入 Codex 對 OpenClaw 的執行階段同等性與 token 效率報告。                                                                                                  |
| `qa confidence-report`                              | 依據 manifest 將 QA 證據成品分類為零未知信心報告。                                                                                                                                                                                                                  |
| `qa confidence-self-test`                           | 寫入種子化 negative-control canaries，以證明信心 gate 能偵測 drift。                                                                                                                                                                                                |
| `qa jsonl-replay`                                   | 透過執行階段同等性重播 harness 重播精選 JSONL 逐字稿。                                                                                                                                                                                                             |
| `qa character-eval`                                 | 在多個即時模型上執行角色 QA 情境，並產生經評判的報告。請參閱[報告](#reporting)。                                                                                                                                                                                   |
| `qa manual`                                         | 針對所選 provider/model lane 執行一次性提示。                                                                                                                                                                                                                       |
| `qa ui`                                             | 啟動 QA 偵錯器 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                      |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | 寫入 QA dashboard + 閘道 lane 的 docker-compose scaffold。                                                                                                                                                                                                          |
| `qa up`                                             | 建置 QA site，啟動 Docker 支援的堆疊，列印 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                                |
| `qa aimock`                                         | 只啟動 AIMock provider server。                                                                                                                                                                                                                                     |
| `qa mock-openai`                                    | 只啟動具情境感知能力的 `mock-openai` provider server。                                                                                                                                                                                                              |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共享的 Convex 認證集區。                                                                                                                                                                                                                                        |
| `qa discord`                                        | 針對真實私有 Discord guild 頻道的即時傳輸 lane。                                                                                                                                                                                                                    |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 的即時傳輸 lane。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                                                                                            |
| `qa slack`                                          | 針對真實私有 Slack 頻道的即時傳輸 lane。                                                                                                                                                                                                                            |
| `qa telegram`                                       | 針對真實私有 Telegram 群組的即時傳輸 lane。                                                                                                                                                                                                                         |
| `qa whatsapp`                                       | 針對真實 WhatsApp Web 帳號的即時傳輸 lane。                                                                                                                                                                                                                         |
| `qa mantis`                                         | 針對即時傳輸錯誤的修正前/後驗證執行器，包含 Discord 狀態反應證據、Crabbox 桌面/瀏覽器 smoke，以及 Slack-in-VNC smoke。請參閱 [Mantis](/zh-TW/concepts/mantis) 與 [Mantis Slack Desktop Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。 |

`qa matrix` 註冊為 runner 外掛（`extensions/qa-matrix`）；上方其他每個 lane 都直接內建於 `qa-lab`。

### 設定檔支援的 `qa run`

設定檔支援的 `qa run` 會從 `taxonomy.yaml` 讀取成員資格，然後透過 `qa suite` 分派解析後的情境。`--surface` 與 `--category` 會篩選所選設定檔，而不是定義個別 lane。產生的 `qa-evidence.json` 包含設定檔 scorecard 摘要，其中有已選分類計數與缺少覆蓋率的 ID；個別證據項目仍是測試、覆蓋率角色與結果的事實來源。Taxonomy feature 覆蓋率 ID 是精確的證明目標，而不是別名：primary 情境覆蓋率會滿足相符 ID，secondary 覆蓋率仍維持諮詢性質。覆蓋率 ID 使用點分 `namespace.behavior` 形式，並採用小寫英數字/破折號片段；設定檔、表面與分類 ID 仍可使用現有的破折號或點分 taxonomy ID。

精簡證據會省略每個項目的 `execution`，並設定 `evidenceMode: "slim"`；`smoke-ci` 預設為精簡，`--evidence-mode full` 會還原完整項目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 搭配 mock model providers 與 Crabline 本機 provider servers，取得確定性的設定檔證明。使用 `release` 針對即時通道取得 Stable/LTS 證明。只有在明確完整 taxonomy 證據執行時才使用 `all`；它會選取每個啟用中的成熟度分類，並可透過 `QA
Profile Evidence` GitHub Actions workflow 搭配 `qa_profile=all` 進行分派。當命令也需要 OpenClaw root profile 時，請將 root profile 放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作者流程

目前的 QA 操作者流程是一個雙窗格 QA site：

- 左側：包含 agent 的閘道 dashboard（Control UI）。
- 右側：QA Lab，顯示類 Slack 的逐字稿與情境計畫。

用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA site、啟動 Docker 支援的閘道 lane，並公開 QA Lab 頁面，讓操作者或自動化 loop 可以向 agent 提供 QA 任務、觀察真實通道行為，並記錄哪些成功、失敗或仍受阻。

若要更快速反覆開發 QA Lab UI，而不必每次都重建 Docker 映像，請使用 bind-mounted QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務使用預建映像，並將 `extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` container。
`qa:lab:watch` 會在變更時重建該 bundle，且當 QA Lab asset hash 變更時，瀏覽器會自動重新載入。

### 可觀測性 smoke

<Note>
可觀測性 QA 僅限 source checkout。npm tarball 會刻意省略 QA Lab（以及 `qa-channel`/`qa-matrix`），因此 package Docker release lanes 不會執行 `qa` 命令。變更診斷 instrumentation 時，請從已建置的 source checkout 執行這些命令。
</Note>

| 別名                                    | 執行內容                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 本機 OpenTelemetry 接收器，加上啟用 `diagnostics-otel` 的 `otel-trace-smoke` 情境。                                                     |
| `pnpm qa:otel:collector-smoke`          | 在真正的 OpenTelemetry Collector Docker 容器後方執行相同通道。變更端點接線或 collector/OTLP 相容性時使用。                             |
| `pnpm qa:prometheus:smoke`              | 啟用 `diagnostics-prometheus` 的 `docker-prometheus-smoke` 情境。                                                                        |
| `pnpm qa:observability:smoke`           | 先執行 `qa:otel:smoke`，再執行 `qa:prometheus:smoke`。                                                                                  |
| `pnpm qa:observability:collector-smoke` | 先執行 `qa:otel:collector-smoke`，再執行 `qa:prometheus:smoke`。                                                                        |

`qa:otel:smoke` 會啟動本機 OTLP/HTTP 接收器，執行最小 QA-channel
代理程式輪次，然後斷言追蹤、指標和日誌已匯出。它會解碼
匯出的 protobuf 追蹤 span，並檢查發布關鍵形狀：
`openclaw.run`、`openclaw.harness.run`、最新 GenAI 語意慣例
模型呼叫 span、`openclaw.context.assembled` 和 `openclaw.message.delivery`
都必須存在。此 smoke 會強制
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此模型呼叫
span 必須使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名稱；模型
呼叫在成功輪次中不得匯出 `StreamAbandoned`；原始診斷
ID 和 `openclaw.content.*` 屬性必須留在追蹤之外。此情境
提示模型以固定標記回覆，並保留固定的
祕密字串；原始 OTLP 酬載不得包含任一者，也不得包含從情境 id 衍生的 QA
工作階段金鑰。它會將 `otel-smoke-summary.json`
寫在 QA 套件成品旁邊。

`qa:prometheus:smoke` 會驗證未驗證的抓取遭到拒絕，然後
檢查已驗證的抓取包含發布關鍵指標族群，
且不含提示內容、回應內容、原始診斷識別碼、驗證
權杖或本機路徑。

### Matrix smoke 通道

若要執行不需要模型供應商
憑證的 transport-real Matrix smoke 通道，請使用 deterministic mock OpenAI 供應商執行快速設定檔：

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

若要執行 live-frontier 供應商通道，請明確提供 OpenAI 相容憑證：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

此通道的完整命令列介面參考、設定檔/情境目錄、環境變數和成品
配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。快速概覽：它會
在 Docker 中配置一次性的 Tuwunel homeserver，註冊暫時的
driver/SUT/observer 使用者，在限定於該傳輸的子 QA
閘道中執行真正的 Matrix 外掛（沒有 `qa-channel`），然後在
`.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown
報告、JSON 摘要、observed-events 成品和合併輸出日誌。

這些情境涵蓋單元測試無法端對端證明的傳輸行為：
提及門控、allow-bot 政策、允許清單、頂層與執行緒
回覆、DM 路由、反應處理、傳入編輯抑制、重新啟動
重播去重、homeserver 中斷復原、核准中繼資料遞送、
媒體處理，以及 Matrix E2EE 啟動/復原/驗證流程。E2EE
命令列介面設定檔也會透過同一個一次性 homeserver 驅動
`openclaw matrix encryption setup` 和驗證命令，然後檢查
閘道回覆。

CI 在
`.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令介面。排程與預設
手動執行會使用 QA 提供的 live-frontier
憑證、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`
執行快速 Matrix 設定檔。手動 `matrix_profile=all` 會展開成五個設定檔分片：`transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli`。

### Discord Mantis 情境

Discord 也有僅限 Mantis、需選擇啟用的錯誤重現情境。請使用
`--scenario discord-status-reactions-tool-only` 來執行明確的狀態
反應時間軸，或使用 `--scenario discord-thread-reply-filepath-attachment`
來建立真正的 Discord 執行緒，並驗證 `message.thread-reply`
會保留 `filePath` 附件。這些情境不包含在預設
live Discord 通道中，因為它們是前後對照的重現探針，而不是
廣泛的 smoke 涵蓋。當 QA
環境中設定
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 時，thread-attachment Mantis 工作流程也可以加入
已登入 Discord Web 的見證影片。該 viewer 設定檔僅用於視覺擷取；通過/失敗
判定仍來自 Discord REST oracle。

若要執行 transport-real Discord、Slack、Telegram 和 WhatsApp smoke 通道：

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

它們會以預先存在的真實頻道為目標，並使用兩個 bot 或帳號（driver +
SUT）。必要環境變數、情境清單、輸出成品和 Convex
憑證池記錄於下方的
[Discord、Slack、Telegram 和 WhatsApp QA 參考](#discord-slack-telegram-and-whatsapp-qa-reference)。

### Mantis Slack 桌面和視覺任務執行器

若要執行包含 VNC 救援的完整 Slack 桌面 VM 執行，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用 Crabbox 桌面/瀏覽器機器，在 VM 內執行 Slack live
通道，在 VNC 瀏覽器中開啟 Slack Web，擷取桌面，
並將 `slack-qa/`、`slack-desktop-smoke.png` 和
`slack-desktop-smoke.mp4`（影片擷取可用時）複製回
Mantis 成品目錄。Crabbox 桌面/瀏覽器租用會預先提供擷取
工具和瀏覽器/native-build 輔助套件，因此情境
應只在較舊租用上安裝 fallback。Mantis 會在
`mantis-slack-desktop-smoke-report.md` 中報告總計與各階段耗時，讓緩慢執行顯示
時間是花在租用暖機、憑證取得、遠端設定，還是
成品複製。在透過 VNC 手動登入 Slack Web 後，使用
`--lease-id <cbx_...>` 重用；重用的租用也會保持 Crabbox 的 pnpm store 快取
暖機。預設的 `--hydrate-mode source` 會從原始碼 checkout 驗證，並
在 VM 內執行安裝/建置。僅在重用的遠端工作區已有
`node_modules` 和已建置的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；
該模式會略過昂貴的安裝/建置步驟，並在
工作區未準備好時關閉失敗。使用 `--gateway-setup` 時，Mantis 會在 VM 內讓持久的
OpenClaw Slack 閘道於連接埠 `38973` 執行；若未使用，該
命令會執行一般 bot 對 bot Slack QA 通道，並在成品
擷取後結束。

若要以桌面證據證明原生 Slack 核准 UI，請執行 Mantis
核准檢查點模式：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

此模式與 `--gateway-setup` 互斥。它會執行 Slack
核准情境、拒絕非核准情境 id、在每個待處理
與已解決核准狀態等待，將觀察到的 Slack API 訊息轉譯成
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`，然後在任何檢查點、
訊息證據、確認或轉譯後的截圖遺失或
為空時失敗。Cold CI 租用可能仍會在
`slack-desktop-smoke.png` 中顯示 Slack 登入；核准檢查點影像是此通道的視覺
證據。

操作員檢查清單、GitHub 工作流程 dispatch 命令、證據留言
合約、hydrate-mode 決策表、耗時解讀和失敗
處理步驟位於
[Mantis Slack 桌面 Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。

若要執行代理程式/CV 風格的桌面任務，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` 會租用或重用 Crabbox 桌面/瀏覽器機器，啟動
`crabbox record --while`，透過巢狀
`visual-driver` 驅動可見瀏覽器，擷取 `visual-task.png`，在選取
`--vision-mode image-describe` 時對截圖執行 `openclaw infer image
describe`，並寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和
`mantis-visual-task-report.md`。設定 `--expect-text` 時，vision
提示會要求結構化 JSON 判定（`visible`、`evidence`、`reason`），
且只有在模型回報 `visible: true` 並附上引用預期文字的證據時
才會通過；僅引用目標文字的 `visible: false` 回應仍會
使斷言失敗。使用 `--vision-mode metadata` 可進行不呼叫
影像理解供應商的無模型 smoke，以證明桌面、瀏覽器、截圖和影片
管線。錄影是 `visual-task` 的必要成品；如果 Crabbox 沒有錄到非空的
`visual-task.mp4`，即使視覺 driver 已通過，任務仍會失敗。失敗時，Mantis 會保留
租用供 VNC 使用，除非任務已通過且未設定
`--keep-lease`。

### 憑證池健康檢查

使用集區 live 憑證前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker 環境（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`）、驗證端點設定、僅回報
`OPENCLAW_QA_CONVEX_SECRET_CI` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 的已設定/遺失狀態，並在 maintainer secret 存在時驗證 admin/list 可達性。

## Live 傳輸涵蓋範圍

Live 傳輸通道共用同一份合約，而不是各自發明
自己的情境清單形狀。`qa-channel` 是廣泛的 synthetic 產品行為
套件，不屬於 live 傳輸涵蓋矩陣。

Live 傳輸執行器會從
`openclaw/plugin-sdk/qa-live-transport-scenarios`
匯入共用情境 id、基準涵蓋輔助工具和情境選擇輔助工具。

| 通道     | 金絲雀 | 提及閘控 | 機器人對機器人 | 允許清單封鎖 | 頂層回覆 | 引用回覆 | 重新啟動恢復 | 討論串後續追蹤 | 討論串隔離 | 表情反應觀察 | 說明命令 | 原生命令註冊 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

這會讓 `qa-channel` 保持為廣泛的產品行為套件，同時 Matrix、
Telegram 和其他即時傳輸共用一份明確的傳輸合約檢查清單。

若要執行不把 Docker 帶入 QA 路徑的一次性 Linux VM 通道，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass 客體、安裝相依項目、在客體內建置 OpenClaw、
執行 `qa suite`，然後將一般 QA 報告和摘要複製回主機上的
`.artifacts/qa-e2e/...`。它會重用與主機上 `qa suite` 相同的情境選取行為。

主機與 Multipass 套件執行預設會透過隔離的閘道工作者平行執行多個已選情境。
`qa-channel` 預設並行數為 4，並受已選情境數量限制。使用 `--concurrency
<count>` 調整工作者數量，或使用 `--concurrency 1` 進行序列執行。
使用 `--pack personal-agent` 執行個人助理基準套件（10 個情境）。
套件選取器會與重複的 `--scenario` 旗標相加：
明確指定的情境會先執行，接著套件情境會依套件順序執行並移除重複項目。
當自訂 QA 執行器已提供 OpenTelemetry 收集器設定時，使用
`--pack observability` 可一起選取 `otel-trace-smoke` 和
`docker-prometheus-smoke` 情境。

只要任何情境失敗，命令就會以非零狀態結束。當你想取得成品但不想要失敗結束碼時，使用 `--allow-failures`。

即時執行會轉送適合客體使用的受支援 QA 驗證輸入：以 env 為基礎的提供者金鑰、
QA 即時提供者設定路徑，以及存在時的 `CODEX_HOME`。請將 `--output-dir`
保持在儲存庫根目錄下，讓客體可以透過掛載的工作區寫回。

## Discord、Slack、Telegram 和 WhatsApp QA 參考

Matrix 因為情境數量和 Docker 支援的 homeserver 佈建，有一個[專屬頁面](/zh-TW/concepts/qa-matrix)。
Discord、Slack、Telegram 和 WhatsApp 會針對既有的真實傳輸執行，因此其參考資料放在這裡。

### 共用命令列介面旗標

這些通道會透過
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts`
註冊，並接受相同旗標：

| 旗標                                  | 預設值                                            | 說明                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 只執行此情境。可重複。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 寫入報告、摘要、證據、傳輸特定成品和輸出記錄的位置。相對路徑會依 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 從中立 cwd 呼叫時的儲存庫根目錄。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA 閘道設定內的暫時帳號 id。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | 提供者預設值                                   | 主要／替代模型 ref。                                                                                                                   |
| `--fast`                              | 關閉                                                | 受支援時的提供者快速模式。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | 請參閱 [Convex 憑證池](#convex-credential-pool)。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，其他情況為 `maintainer`                 | 使用 `--credential-source convex` 時採用的角色。                                                                                                    |

只要任何情境失敗，每個通道都會以非零狀態結束。`--allow-failures` 會寫入成品，
但不設定失敗結束碼。Telegram 也接受 `--list-scenarios` 來列印可用情境 id 並結束；
其他通道不公開該旗標。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私有 Telegram 群組，其中有兩個不同的機器人（驅動程式 +
SUT）。SUT 機器人必須有 Telegram 使用者名稱；當兩個機器人都在
`@BotFather` 啟用 **Bot-to-Bot Communication Mode** 時，機器人對機器人觀察效果最佳。

使用 `--credential-source env` 時的必要 env：

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
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

隱含的預設集合一律涵蓋金絲雀、提及閘控、原生命令回覆、
命令定址，以及機器人對機器人群組回覆。`mock-openai`
預設也包含確定性的回覆鏈和最終訊息串流檢查。`telegram-current-session-status-tool`
和 `telegram-tool-only-usage-footer` 仍為選用：前者只有在緊接著金絲雀直接串接時才穩定，
後者則是工具專用回覆中 `/usage` 頁尾的真實 Telegram 證明。使用
`pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`
列印目前的預設／選用分組及回歸 ref。

輸出成品：

- `telegram-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目，
  包含 profile、覆蓋範圍、提供者、通道、成品、結果和 RTT
  欄位。

套件 Telegram 執行使用相同的 Telegram 憑證合約。重複 RTT
測量是一般套件 Telegram 即時通道的一部分；RTT
分佈會針對已選 RTT 檢查彙整到 `qa-evidence.json` 的 `result.timing` 下。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 時，套件即時包裝器會租用
`kind: "telegram"` 憑證，將租用的群組／驅動程式／SUT
機器人 env 匯出到已安裝套件的執行中，對租約進行心跳偵測，並在關閉時釋放。
選取 Convex 時，套件包裝器在 CI 外預設會對
`telegram-mentioned-message-reply` 執行 20 次 RTT 檢查、30 秒 RTT 逾時，
以及 Convex 角色 `maintainer`。覆寫 `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` 或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`
即可調整 RTT 測量，而不需要建立獨立的 RTT 命令或 Telegram 特定摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私有 Discord guild 頻道，其中有兩個機器人：由測試框架控制的驅動程式機器人，
以及由子 OpenClaw 閘道透過內建 Discord 外掛啟動的 SUT 機器人。
驗證頻道提及處理、SUT 機器人已向 Discord 註冊原生 `/help` 命令，
以及選用的 Mantis 證據情境。

使用 `--credential-source env` 時的必要 env：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須符合 Discord 傳回的 SUT 機器人使用者 id
  （否則通道會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 會選取 `discord-voice-autojoin`
  的語音／舞台頻道；若沒有設定，情境會選取 SUT 機器人可見的第一個
  語音／舞台頻道。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 選用語音情境。會單獨執行，啟用
  `channels.discord.voice.autoJoin`，並驗證 SUT 機器人目前的
  Discord 語音狀態是目標語音／舞台頻道。Convex Discord
  憑證可包含選用的 `voiceChannelId`；否則執行器會在 guild 中探索第一個可見的語音／舞台頻道。
- `discord-status-reactions-tool-only` - 選用 Mantis 情境。會單獨執行，
  因為它會將 SUT 切換為永遠開啟、僅工具的 guild 回覆，
  並設定 `messages.statusReactions.enabled=true`，接著擷取 REST
  表情反應時間軸以及 HTML/PNG 視覺成品。Mantis 前後比較報告也會將情境提供的
  MP4 成品保留為 `baseline.mp4` 和 `candidate.mp4`。
- `discord-thread-reply-filepath-attachment` - 選用 Mantis 情境；請參閱
  [Discord Mantis 情境](#discord-mantis-scenarios)。

明確執行 Discord 語音自動加入情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

明確執行 Mantis 狀態表情反應情境：

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
- `discord-qa-observed-messages.json` - 除非設定
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則內文會經過遮蔽。
- 當狀態反應情境執行時，會產生 `discord-qa-reaction-timelines.json` 和
  `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目標是一個真實的私有 Slack 頻道，並使用兩個不同的機器人：一個由測試框架控制的驅動程式機器人，以及一個由子 OpenClaw 閘道透過內建 Slack 外掛啟動的 SUT 機器人。

使用 `--credential-source env` 時需要的環境變數：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在 observed-message 成品中保留訊息內文。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 會啟用 Mantis 的視覺核准檢查點。執行器會寫入 `<scenario>.pending.json` 和
  `<scenario>.resolved.json`，然後等待相符的 `.ack.json` 檔案。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 會覆寫檢查點確認逾時。預設值為 `120000`。

情境（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - 選擇性啟用的原生 Slack exec 核准情境。
  透過閘道請求 exec 核准，驗證 Slack 訊息具有原生核准按鈕、完成核准，並驗證已完成的 Slack 更新。
- `slack-approval-plugin-native` - 選擇性啟用的原生 Slack 外掛核准情境。一起啟用 exec 和外掛核准轉送，避免外掛事件被 exec 核准路由抑制，然後驗證相同的待處理/已完成原生 Slack UI 路徑。

輸出成品：

- `slack-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `slack-qa-observed-messages.json` - 除非設定
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否則內文會經過遮蔽。
- `approval-checkpoints/` - 僅在 Mantis 設定
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 時產生；包含檢查點 JSON、確認 JSON，以及待處理/已完成截圖。

#### 設定 Slack 工作區

此通道需要同一個工作區中的兩個不同 Slack 應用程式，以及一個兩個機器人都已加入的頻道：

- `channelId` - 兩個機器人都已受邀加入之頻道的 `Cxxxxxxxxxx` ID。請使用專用頻道；此通道每次執行都會發文。
- `driverBotToken` - **Driver** 應用程式的機器人 token（`xoxb-...`）。
- `sutBotToken` - **SUT** 應用程式的機器人 token（`xoxb-...`），它必須是與 driver 分開的 Slack 應用程式，讓其機器人使用者 ID 不同。
- `sutAppToken` - SUT 應用程式具備 `connections:write` 的應用程式層級 token（`xapp-...`），由 Socket Mode 使用，讓 SUT 應用程式可以接收事件。

建議使用專供 QA 的 Slack 工作區，而不是重複使用生產工作區。

以下 SUT manifest 有意將內建 Slack 外掛的生產安裝（`extensions/slack/src/setup-shared.ts:12`）縮小到即時 Slack QA 套件涵蓋的權限和事件。若要查看使用者所見的生產頻道設定，請參閱
[Slack 頻道快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver/SUT 配對刻意分開，因為此通道需要同一個工作區中的兩個不同機器人使用者 ID。

**1. 建立 Driver 應用程式**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → 選擇 QA 工作區，貼上下列 manifest，
然後 _Install to Workspace_：

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

複製 _Bot User OAuth Token_（`xoxb-...`）- 這會成為
`driverBotToken`。driver 只需要發送訊息並識別自己；不需要事件，也不需要 Socket Mode。

**2. 建立 SUT 應用程式**

在同一個工作區中重複 _Create New App → From a manifest_。此 QA 應用程式刻意使用內建 Slack 外掛生產 manifest（`extensions/slack/src/setup-shared.ts:12`）的較窄版本：反應權限範圍和事件被省略，因為即時 Slack QA 套件尚未涵蓋反應處理。

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

Slack 建立應用程式後，請在其設定頁面執行兩件事：

- _Install to Workspace_ → 複製 _Bot User OAuth Token_ → 這會成為
  `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 加入
  scope `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會成為 `sutAppToken`。

透過對每個 token 呼叫 `auth.test`，確認兩個機器人具有不同的使用者 ID。執行階段會依使用者 ID 區分 driver 和 SUT；兩者重複使用同一個應用程式會讓 mention-gating 立即失敗。

**3. 建立頻道**

在 QA 工作區中建立頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個機器人：

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` ID - 這會成為
`channelId`。公開頻道可用；若使用私有頻道，兩個應用程式已具有 `groups:history`，因此測試框架的歷史讀取仍會成功。

**4. 註冊憑證**

有兩個選項。單機除錯可使用環境變數（設定四個
`OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或填入共用 Convex pool，讓 CI 和其他維護者可以租用它們。

若使用 Convex pool，請將四個欄位寫入 JSON 檔案：

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

**5. 驗證端到端**

在本機執行此通道，確認兩個機器人可以透過 broker 彼此對話：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功執行會在不到 30 秒內完成，且 `slack-qa-report.md` 會顯示
`slack-canary` 和 `slack-mention-gating` 的狀態皆為 `pass`。若此通道卡住約 90 秒後以 `Convex credential pool exhausted
for kind "slack"` 離開，代表 pool 是空的，或每一列都已被租用 - `qa
credentials list --kind slack --status all --json` 會告訴你是哪一種情況。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

目標是兩個專用 WhatsApp Web 帳號：一個由測試框架控制的 driver 帳號，以及一個由子 OpenClaw 閘道透過內建 WhatsApp 外掛啟動的 SUT 帳號。

使用 `--credential-source env` 時需要的環境變數：

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

選用：

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` 會啟用群組情境，例如
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、群組動作/媒體/投票情境，以及
  `whatsapp-group-allowlist-block`。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` 會在 observed-message 成品中保留訊息內文。

情境目錄（`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`）：

- 基準線與群組閘控：`whatsapp-canary`、`whatsapp-pairing-block`、
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-group-activation-always`、`whatsapp-group-reply-to-bot-triggers`、
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
- 使用者路徑訊息動作：`whatsapp-agent-message-action-react` 會從真實驅動程式 DM 開始，讓模型呼叫 `message` 工具，並觀察原生 WhatsApp 回應。`whatsapp-agent-message-action-upload-file`
  會對 `message(action=upload-file)` 使用相同姿態，並觀察原生 WhatsApp 媒體。`whatsapp-group-agent-message-action-react` 與
  `whatsapp-group-agent-message-action-upload-file` 會在真實 WhatsApp 群組中證明相同的使用者可見動作。
- 群組扇出：`whatsapp-broadcast-group-fanout` 會從一則提及的 WhatsApp 群組訊息開始，並驗證來自 `main`
  與 `qa-second` 的不同可見回覆。
- 群組啟用：`whatsapp-group-activation-always` 會將真實群組工作階段變更為 `/activation always`，證明未提及的群組訊息會喚醒代理，然後還原為 `/activation mention`。
  `whatsapp-group-reply-to-bot-triggers` 會植入一則機器人回覆，在沒有明確提及的情況下傳送對該訊息的原生引用回覆，並驗證代理會從該回覆情境中醒來。
- 傳入媒體與結構化訊息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  這些會透過驅動程式傳送真實 WhatsApp 圖片、音訊、文件、位置、聯絡人、貼圖與回應事件。
- 直接閘道合約探測：`whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。這些會刻意略過模型提示，並證明具決定性的閘道/通道 `send`、`poll` 與
  `message.action` 合約。
- 存取控制覆蓋範圍：`whatsapp-access-control-dm-open`、
  `whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、
  `whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- 原生核准：`whatsapp-approval-exec-deny-native`、
  `whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、
  `whatsapp-approval-exec-group-reaction-native`、
  `whatsapp-approval-plugin-native`。
- 狀態回應：`whatsapp-status-reactions`、
  `whatsapp-status-reaction-lifecycle`。

目錄目前包含 52 個情境。`live-frontier` 預設執行道保持精簡，包含 10 個情境以提供快速煙霧覆蓋。`mock-openai`
預設執行道會透過真實 WhatsApp 傳輸，以具決定性的方式執行 45 個情境，且只模擬模型輸出；核准情境與少數較重/阻塞型檢查仍需以情境 ID 明確執行。

WhatsApp QA 驅動程式會觀察結構化即時事件（`text`、`media`、
`location`、`reaction` 與 `poll`），並可主動傳送媒體、投票、聯絡人、位置與貼圖。QA Lab 會透過
`@openclaw/whatsapp/api.js` 套件介面匯入該驅動程式，而不是觸及私有 WhatsApp 執行階段檔案。對於群組觀察，`fromJid` 是群組 JID，而 `participantJid` 與 `fromPhoneE164` 會識別參與者傳送者。
訊息內容預設會經過遮罩。直接閘道投票、upload-file、媒體、群組投票、群組媒體與 reply-shape 探測是傳輸/API 合約檢查；它們不會被視為證明使用者提示讓代理選擇了相同動作。使用者路徑動作證明來自 `whatsapp-agent-message-action-react` 與
`whatsapp-group-agent-message-action-react` 等情境，其中驅動程式會傳送一般 WhatsApp 訊息，而 QA Lab 會觀察產生的原生 WhatsApp 成果物。
WhatsApp 報告會包含每個情境的姿態（`user-path`、
`direct-gateway` 或 `native-approval`），因此證據不會被誤認為證明了比實際更強的合約。

輸出成果物：

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `whatsapp-qa-observed-messages.json` - 內文會被遮罩，除非設定
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`。

### Convex 憑證集區

Discord、Slack、Telegram 與 WhatsApp 執行道可以從共用 Convex 集區租用憑證，而不是讀取上述環境變數。傳入
`--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；
QA Lab 會取得獨占租約，在執行期間對其進行心跳偵測，並在關閉時釋放。集區種類為 `"discord"`、`"slack"`、
`"telegram"` 與 `"whatsapp"`。

代理程式會在 `admin/add` 上驗證的承載形狀：

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` 必須是數字聊天 ID 字串。
- Telegram 真實使用者 (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  僅供 Mantis Telegram Desktop 證明使用。一般 QA Lab 執行道不得取得此種類。
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 電話號碼必須是不同的 E.164 字串。

Mantis Telegram Desktop 證明工作流程會為 TDLib 命令列介面驅動程式與 Telegram Desktop 見證者持有一個獨占 Convex
`telegram-user` 租約，然後在發布證明後釋放。

當 PR 需要具決定性的視覺差異時，Mantis 可以在 `main` 與 PR head 上使用相同的模擬模型回覆，同時變更 Telegram 格式化程式或遞送層。擷取預設值已針對 PR 留言調校：標準 Crabbox 類別、24fps 桌面錄影、24fps 動態 GIF，以及 1920px 預覽寬度。前後比較留言應發布乾淨的套件，其中只包含預期的 GIF。

Slack 執行道也可以使用集區。Slack 承載形狀檢查目前位於 Slack QA 執行器中，而不是代理程式；請使用 `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`，並搭配像 `Cxxxxxxxxxx` 這樣的 Slack 通道 ID。請參閱
[設定 Slack 工作區](#setting-up-the-slack-workspace) 以了解應用程式與範圍佈建。

操作環境變數與 Convex 代理程式端點合約位於
[Testing → 透過 Convex 共用 Telegram 憑證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)
（該章節名稱早於多通道集區；租約語意在各種類之間共用）。

## 儲存庫支援的種子

種子資產位於 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

這些刻意放在 git 中，讓 QA 計畫對人類與代理都可見。

`qa-lab` 會維持為通用 YAML 情境執行器。每個情境 YAML 檔案都是一次測試執行的真實來源，且應定義：

- 頂層 `title`
- `scenario` 中繼資料
- `scenario` 中的選用類別、能力、執行道與風險中繼資料
- `scenario` 中的文件與程式碼參照
- `scenario` 中的選用外掛需求
- `scenario` 中的選用閘道設定修補
- 用於流程情境的可執行頂層 `flow`，或用於 Vitest 與
  Playwright 情境的 `scenario.execution.kind` / `scenario.execution.path`

支援 `flow` 的可重用執行階段介面會保持通用且跨領域。例如，YAML 情境可以結合傳輸端輔助工具與瀏覽器端輔助工具，透過閘道 `browser.request` seam 驅動嵌入式 Control UI，而不需要新增特殊情況執行器。

情境檔案應依產品能力分組，而不是依原始碼樹資料夾分組。檔案移動時請保持情境 ID 穩定；使用 `docsRefs` 與
`codeRefs` 取得實作可追蹤性。

基準線清單應保持足夠廣泛，以涵蓋：

- DM 與通道聊天
- 執行緒行為
- 訊息動作生命週期
- 排程回呼
- 記憶喚回
- 模型切換
- 子代理交接
- 儲存庫讀取與文件讀取
- 一個小型建置任務，例如 Lobster Invaders

## 供應商模擬執行道

`qa suite` 有兩個本機供應商模擬執行道：

- `mock-openai` 是具情境感知的 OpenClaw 模擬。它仍是儲存庫支援 QA 與同等性閘門的預設具決定性模擬執行道。
- `aimock` 會啟動由 AIMock 支援的供應商伺服器，用於實驗性協定、fixture、錄製/重播與混沌覆蓋。它是加成項目，不會取代 `mock-openai` 情境分派器。

供應商執行道實作位於 `extensions/qa-lab/src/providers/` 下。每個供應商都擁有自己的預設值、本機伺服器啟動、閘道模型設定、驗證設定檔暫存需求，以及即時/模擬能力旗標。共用套件與閘道程式碼會透過供應商登錄路由，而不是依供應商名稱分支。

## 傳輸配接器

`qa-lab` 擁有 YAML QA 情境的通用傳輸 seam。`qa-channel` 是合成預設值。`crabline` 會啟動本機供應商形狀的伺服器，並針對它們執行 OpenClaw 的一般通道外掛。`live` 保留給真實供應商憑證與外部通道。

在架構層級，分工如下：

- `qa-lab` 擁有通用情境執行、工作者並行、成果物寫入與報告。
- 傳輸配接器擁有閘道設定、就緒狀態、傳入與傳出觀察、傳輸動作，以及正規化的傳輸狀態。
- `qa/scenarios/` 下的 YAML 情境檔案會定義測試執行；`qa-lab`
  提供執行它們的可重用執行階段介面。

### 新增通道

將通道新增到 YAML QA 系統需要通道實作，以及用來演練通道合約的情境套件。若要取得煙霧 CI 覆蓋，請新增相符的 Crabline 本機供應商伺服器，並透過 `crabline` 驅動程式公開它。

當共用 `qa-lab` 主機可以擁有流程時，請勿新增新的頂層 QA 命令根。

`qa-lab` 擁有共用主機機制：

- `openclaw qa` 命令根
- 套件啟動與拆除
- 工作者並行
- 成果物寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容性別名

執行器外掛擁有傳輸合約：

- `openclaw qa <runner>` 如何掛載在共用 `qa` 根之下
- 如何為該傳輸設定閘道
- 如何檢查就緒狀態
- 如何注入傳入事件
- 如何觀察傳出訊息
- 如何公開逐字稿與正規化的傳輸狀態
- 如何執行傳輸支援的動作
- 如何處理傳輸特定的重設或清理

新通道的最低採用門檻：

1. 保持 `qa-lab` 作為共享 `qa` 根目錄的擁有者。
2. 在共享的 `qa-lab` 主機接縫上實作傳輸執行器。
3. 將傳輸專屬機制保留在執行器外掛或通道
   測試框架內。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊一個
   競爭的根命令。執行器外掛應在
   `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts`
   匯出相符的 `qaRunnerCliRegistrations`
   陣列。保持 `runtime-api.ts` 輕量；延遲載入的命令列介面與
   執行器執行應留在獨立進入點後方。
5. 在主題化的 `qa/scenarios/`
   目錄下撰寫或調整 YAML 情境。
6. 對新情境使用通用情境輔助工具。
7. 保持既有相容性別名可用，除非儲存庫正在進行
   有意的遷移。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，就放在 `qa-lab`。
- 如果行為依賴單一通道傳輸，則將其保留在該執行器
  外掛或外掛測試框架中。
- 如果某個情境需要多個通道都能使用的新能力，
  請新增通用輔助工具，而不是在 `suite.ts` 中加入通道專屬分支。
- 如果某個行為只對單一傳輸有意義，請將情境
  保持為傳輸專屬，並在情境合約中明確說明。

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

相容性別名仍可供既有情境使用 -
`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、
`formatConversationTranscript`、`resetBus` - 但新情境撰寫
應使用通用名稱。這些別名存在是為了避免一次性
遷移，而不是未來的模型。

## 回報

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 協定報告。
報告應回答：

- 哪些項目運作正常
- 哪些項目失敗
- 哪些項目仍受阻
- 哪些後續情境值得新增

若要取得可用情境的清單 - 在評估後續工作規模
或接線新的傳輸時很有用 - 執行 `pnpm openclaw qa coverage`（加入 `--json`
可取得機器可讀輸出）。為受影響行為或檔案路徑選擇聚焦證據時，
執行 `pnpm openclaw qa coverage --match <query>`。比對報告會搜尋情境中繼資料、文件參照、程式碼參照、涵蓋範圍 ID、
外掛與提供者需求，然後印出相符的 `qa suite
--scenario ...` 目標。

每次 `qa suite` 執行都會為選取的
情境集寫入頂層 `qa-evidence.json`、
`qa-suite-summary.json` 與 `qa-suite-report.md` 成果物。宣告 `execution.kind: vitest` 或
`execution.kind: playwright` 的情境會執行相符的測試路徑，並另外寫入
各情境記錄。宣告 `execution.kind: script` 的情境會透過 `node --import tsx`
執行位於 `execution.path` 的證據產生器（並在 `execution.args` 中展開
`${outputDir}` 與 `${scenarioId}`）；該
產生器會寫入自己的 `qa-evidence.json`，其項目會匯入
套件輸出，且其成果物路徑會相對於該
產生器的 `qa-evidence.json` 解析。當 `qa suite` 是透過 `qa run
--qa-profile` 到達時，同一個 `qa-evidence.json` 也會包含所選分類法類別的設定檔
評分卡摘要。

將涵蓋範圍輸出視為探索輔助，而不是閘門替代品；所選
情境仍需要符合受測行為的正確提供者模式、即時傳輸、
Multipass、Testbox 或發行通道。評分卡脈絡請見[成熟度評分卡](/zh-TW/maturity/scorecard)。

若要進行角色與風格檢查，請對多個即時
模型參照執行相同情境，並寫入經評審的 Markdown 報告：

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

此命令會執行本機 QA 閘道子程序，而不是 Docker。角色
評估情境應透過 `SOUL.md` 設定人格，然後執行一般
使用者輪次，例如聊天、工作區協助與小型檔案任務。候選
模型不應被告知它正在接受評估。此命令會保留
每份完整逐字稿，記錄基本執行統計，然後要求評審模型以
支援時具備 `xhigh` 推理的快速模式，依自然度、氛圍與幽默感對執行結果排名。比較
提供者時請使用 `--blind-judge-models`：評審提示仍會取得每份逐字稿與執行狀態，但
候選參照會替換成中性標籤，例如 `candidate-01`；報告會在解析後將排名映射回真實參照。

候選執行預設使用 `high` 思考，GPT-5.5 使用 `medium`，
而支援的較舊 OpenAI 評估參照使用 `xhigh`。可使用
`--model provider/model,thinking=<level>` 內嵌覆寫特定
候選；內嵌選項也支援 `fast`、`no-fast` 與 `fast=<bool>`。`--thinking
<level>` 仍會設定全域後備，而較舊的 `--model-thinking
<provider/model=level>` 形式會保留以供相容。OpenAI 候選
參照預設使用快速模式，以便在提供者
支援時使用優先處理。只有在你想對每個
候選模型強制啟用快速模式時，才傳入 `--fast`。候選與評審耗時會記錄在
報告中以供基準分析，但評審提示會明確要求不要按
速度排名。候選與評審模型執行預設並行度皆為 16。
當提供者限制或本機
閘道壓力使執行過於嘈雜時，請降低 `--concurrency` 或 `--judge-concurrency`。

未傳入候選 `--model` 時，角色評估預設為
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、
`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 與 `google/gemini-3.1-pro-preview`。未傳入
`--judge-model` 時，評審預設為
`openai/gpt-5.5,thinking=xhigh,fast` 與
`anthropic/claude-opus-4-8,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [成熟度評分卡](/zh-TW/maturity/scorecard)
- [個人代理基準測試包](/zh-TW/concepts/personal-agent-benchmark-pack)
- [QA 通道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
