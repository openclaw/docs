---
read_when:
    - 了解 QA 技術堆疊如何協同運作
    - 擴充 qa-lab、qa-channel 或傳輸介面卡
    - 新增由儲存庫支援的 QA 情境
    - 為閘道儀表板建置更高擬真度的 QA 自動化測試
summary: QA 堆疊概覽：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸配接器與報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-07-12T21:23:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f82422737f5151bb971e93f830e3e7139c6f60887a33206d5d44259e4f5e51e7
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊以貼近真實、符合頻道形態的方式測試 OpenClaw，這是單元測試無法做到的。

組成：

- `extensions/qa-channel`：合成訊息頻道，提供私訊、頻道、討論串、回應、編輯及刪除介面。
- `extensions/qa-lab`：用於觀察逐字記錄、注入傳入訊息及匯出 Markdown 報告的偵錯工具 UI 與 QA 匯流排。
- `extensions/qa-matrix`：在子 QA 閘道內驅動真實 Matrix 外掛的即時傳輸配接器。
- `qa/`：由儲存庫支援的啟動任務種子資產及基準 QA 情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器螢幕擷取畫面、VM 狀態及 PR 證據的錯誤，進行修正前後的即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多流程有 `pnpm qa:*` 指令碼別名；兩種形式都可使用。

| 命令                                                | 用途                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不使用 `--qa-profile` 的內建 QA 自我檢查；使用 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all` 時，則執行由分類體系支援的成熟度設定檔執行器。                                                                                                  |
| `qa suite`                                          | 對 QA 閘道執行由儲存庫支援的情境。`--runner multipass` 使用一次性的 Linux VM，而非主機。                                                                                                                                                                            |
| `qa coverage`                                       | 輸出 YAML 情境涵蓋範圍清單（使用 `--json` 產生機器輸出；使用 `--match <query>` 尋找受變更行為的情境；使用 `--tools` 查看執行階段工具固定資料涵蓋範圍）。                                                                                                            |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案以執行模型軸同等性閘門，或使用 `--runtime-axis --token-efficiency` 寫入 Codex 與 OpenClaw 的執行階段同等性及權杖效率報告。                                                                                                     |
| `qa confidence-report`                              | 依據資訊清單分類 QA 證明成品，產生未知項目為零的信賴度報告。                                                                                                                                                                                                        |
| `qa confidence-self-test`                           | 寫入帶有種子的負向控制金絲雀，證明信賴度閘門可偵測偏移。                                                                                                                                                                                                            |
| `qa jsonl-replay`                                   | 透過執行階段同等性重播測試框架，重播經整理的 JSONL 逐字記錄。                                                                                                                                                                                                       |
| `qa character-eval`                                 | 跨多個即時模型執行角色 QA 情境，並產生經評審的報告。請參閱[報告](#reporting)。                                                                                                                                                                                      |
| `qa manual`                                         | 對所選提供者／模型執行路徑執行一次性提示詞。                                                                                                                                                                                                                        |
| `qa ui`                                             | 啟動 QA 偵錯工具 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                    |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | 寫入 QA 儀表板與閘道路徑的 docker-compose 基架。                                                                                                                                                                                                                     |
| `qa up`                                             | 建置 QA 網站、啟動由 Docker 支援的堆疊，並輸出 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                            |
| `qa aimock`                                         | 僅啟動 AIMock 提供者伺服器。                                                                                                                                                                                                                                        |
| `qa mock-openai`                                    | 僅啟動可感知情境的 `mock-openai` 提供者伺服器。                                                                                                                                                                                                                      |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用的 Convex 認證資訊集區。                                                                                                                                                                                                                                    |
| `qa discord`                                        | 對真實私人 Discord 伺服器頻道執行的即時傳輸路徑。                                                                                                                                                                                                                   |
| `qa matrix`                                         | 對一次性 Tuwunel 主伺服器執行的即時傳輸路徑。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                                                                                              |
| `qa slack`                                          | 對真實私人 Slack 頻道執行的即時傳輸路徑。                                                                                                                                                                                                                           |
| `qa telegram`                                       | 對真實私人 Telegram 群組執行的即時傳輸路徑。                                                                                                                                                                                                                        |
| `qa whatsapp`                                       | 對真實 WhatsApp Web 帳號執行的即時傳輸路徑。                                                                                                                                                                                                                        |
| `qa mantis`                                         | 即時傳輸錯誤的修正前後驗證執行器，提供 Discord 狀態回應證據、Crabbox 桌面／瀏覽器冒煙測試，以及 VNC 中的 Slack 冒煙測試。請參閱 [Mantis](/zh-TW/concepts/mantis) 及 [Mantis Slack 桌面操作手冊](/zh-TW/concepts/mantis-slack-desktop-runbook)。 |

`qa matrix` 會註冊為執行器外掛（`extensions/qa-matrix`）；上述其他每個路徑都直接內建於 `qa-lab`。

### 由設定檔支援的 `qa run`

由設定檔支援的 `qa run` 會從 `taxonomy.yaml` 讀取成員資格，然後透過 `qa suite` 分派解析後的情境。`--surface` 與 `--category` 會篩選所選設定檔，而非定義個別路徑。產生的 `qa-evidence.json` 包含設定檔計分卡摘要，其中列出所選類別計數及缺少的涵蓋範圍 ID；個別證據項目仍是測試、涵蓋範圍角色及結果的事實來源。分類體系功能涵蓋範圍 ID 是精確的證明目標，而非別名：主要情境涵蓋範圍會滿足相符的 ID，次要涵蓋範圍則僅供參考。涵蓋範圍 ID 採用以點分隔的 `namespace.behavior` 格式，其中各區段僅包含小寫英數字元／連字號；設定檔、介面及類別 ID 仍可使用現有的連字號或點分隔分類體系 ID。

精簡證據會省略各項目的 `execution`，並設定 `evidenceMode: "slim"`；`smoke-ci` 預設使用精簡模式，而 `--evidence-mode full` 可還原完整項目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 搭配模擬模型提供者與 Crabline 本機提供者伺服器，取得具決定性的設定檔證明。使用 `release` 對即時頻道執行 Stable/LTS 證明。只有在明確執行完整分類體系證據時才使用 `all`；它會選取每個作用中的成熟度類別，並可透過 `QA
Profile Evidence` GitHub Actions 工作流程，使用 `qa_profile=all` 進行分派。當命令還需要 OpenClaw 根設定檔時，請將根設定檔放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作員流程

目前的 QA 操作員流程是雙窗格 QA 網站：

- 左側：含代理程式的閘道儀表板（控制 UI）。
- 右側：QA Lab，顯示類似 Slack 的逐字記錄及情境計畫。

使用下列命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA 網站、啟動由 Docker 支援的閘道路徑，並公開 QA Lab 頁面；操作員或自動化迴圈可在其中向代理程式指派 QA 任務、觀察真實頻道行為，並記錄哪些項目成功、失敗或仍受阻。

若要加快 QA Lab UI 疊代速度，避免每次都重建 Docker 映像，請使用繫結掛載的 QA Lab 套件組合啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務持續使用預先建置的映像，並將 `extensions/qa-lab/web/dist` 繫結掛載至 `qa-lab` 容器。`qa:lab:watch` 會在發生變更時重建該套件組合，而當 QA Lab 資產雜湊變更時，瀏覽器會自動重新載入。

### 可觀測性冒煙測試

<Note>
可觀測性 QA 僅限於原始碼簽出。npm tarball 會刻意省略 QA Lab（以及 `qa-channel`／`qa-matrix`），因此套件 Docker 發行路徑不會執行 `qa` 命令。變更診斷檢測工具時，請從已建置的原始碼簽出執行這些命令。
</Note>

| 別名                                    | 執行內容                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 本機 OpenTelemetry 接收器，加上已啟用 `diagnostics-otel` 的 `otel-trace-smoke` 情境。                                                   |
| `pnpm qa:otel:collector-smoke`          | 在真正的 OpenTelemetry Collector Docker 容器後方執行相同測試路徑。變更端點接線或收集器／OTLP 相容性時使用。                              |
| `pnpm qa:prometheus:smoke`              | 已啟用 `diagnostics-prometheus` 的 `docker-prometheus-smoke` 情境。                                                                      |
| `pnpm qa:observability:smoke`           | 先執行 `qa:otel:smoke`，再執行 `qa:prometheus:smoke`。                                                                                   |
| `pnpm qa:observability:collector-smoke` | 先執行 `qa:otel:collector-smoke`，再執行 `qa:prometheus:smoke`。                                                                         |

`qa:otel:smoke` 會啟動本機 OTLP/HTTP 接收器、執行最小化的 QA 頻道
代理程式回合，然後斷言追蹤、指標和日誌皆已匯出。它會解碼
匯出的 protobuf 追蹤 span，並檢查對發布至關重要的結構：
`openclaw.run`、`openclaw.harness.run`、採用最新版 GenAI 語意慣例的
模型呼叫 span、`openclaw.context.assembled` 和 `openclaw.message.delivery`
都必須存在。此冒煙測試會強制設定
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此模型呼叫
span 必須使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名稱；模型
呼叫在成功的回合中不得匯出 `StreamAbandoned`；原始診斷
ID 和 `openclaw.content.*` 屬性不得出現在追蹤中。情境
提示詞會要求模型以固定標記回覆，並不得洩漏固定的
秘密字串；原始 OTLP 承載資料不得包含其中任一項，也不得包含從情境 id
衍生的 QA 工作階段金鑰。它會將 `otel-smoke-summary.json`
寫入 QA 套件成品旁。

`qa:prometheus:smoke` 會驗證未經驗證的擷取遭到拒絕，接著
檢查經驗證的擷取包含對發布至關重要的指標族，
且不含提示詞內容、回應內容、原始診斷識別碼、驗證
權杖或本機路徑。

### Matrix 冒煙測試路徑

若要執行不需要模型供應商
認證資訊的真實傳輸 Matrix 冒煙測試路徑，請搭配確定性的模擬 OpenAI 供應商執行快速設定檔：

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

若要執行 live-frontier 供應商測試路徑，請明確提供 OpenAI 相容的認證資訊：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

此測試路徑的完整命令列介面參考、設定檔／情境目錄、環境變數和成品
版面配置位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。概括而言：它會
在 Docker 中佈建可拋棄的 Tuwunel 主伺服器、註冊臨時的
驅動程式／受測系統／觀察者使用者、在限定於該傳輸的子 QA
閘道中執行真正的 Matrix 外掛（不使用 `qa-channel`），然後在
`.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown
報告、JSON 摘要、觀察到的事件成品和合併輸出日誌。

這些情境涵蓋單元測試無法端對端證明的傳輸行為：
提及閘控、允許機器人的原則、允許清單、頂層和討論串
回覆、私訊路由、回應處理、輸入編輯抑制、重新啟動後的
重播去重、主伺服器中斷復原、核准中繼資料傳送、
媒體處理，以及 Matrix E2EE 啟動／復原／驗證流程。
E2EE 命令列介面設定檔還會先透過同一個可拋棄主伺服器執行 `openclaw matrix encryption setup` 和
驗證命令，再檢查
閘道回覆。

CI 在
`.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令介面。排程和預設的
手動執行會使用 QA 提供的 live-frontier
認證資訊、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`
執行快速 Matrix 設定檔。
手動設定 `matrix_profile=all` 會展開為五個設定檔分片：`transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli`。

### Discord Mantis 情境

Discord 也提供僅限 Mantis、選擇性啟用的錯誤重現情境。使用
`--scenario discord-status-reactions-tool-only` 取得明確的狀態
回應時間軸，或使用 `--scenario discord-thread-reply-filepath-attachment`
建立真正的 Discord 討論串，並驗證 `message.thread-reply`
會保留 `filePath` 附件。這些情境不納入預設的
即時 Discord 測試路徑，因為它們是修正前／後的重現探針，而不是
廣泛的冒煙測試涵蓋範圍。若 QA
環境中已設定 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`，討論串附件 Mantis 工作流程也能加入
已登入的 Discord Web 見證影片。
該檢視器設定檔僅用於視覺擷取；通過／失敗
判定仍來自 Discord REST 預言機。

若要執行真實傳輸的 Discord、Slack、Telegram 和 WhatsApp 冒煙測試路徑：

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

它們以預先存在且具有兩個機器人或帳號（驅動程式 +
受測系統）的真實頻道為目標。必要的環境變數、情境清單、輸出成品和 Convex
認證資訊集區記錄於下方的
[Discord、Slack、Telegram 和 WhatsApp QA 參考](#discord-slack-telegram-and-whatsapp-qa-reference)。

### Mantis Slack 桌面與視覺任務執行器

若要執行具有 VNC 救援功能的完整 Slack 桌面 VM，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用 Crabbox 桌面／瀏覽器機器、在 VM 內執行 Slack 即時
測試路徑、在 VNC 瀏覽器中開啟 Slack Web、擷取桌面，
並將 `slack-qa/`、`slack-desktop-smoke.png` 和
`slack-desktop-smoke.mp4`（可使用影片擷取時）複製回
Mantis 成品目錄。Crabbox 桌面／瀏覽器租約會預先提供擷取
工具和瀏覽器／原生建置輔助套件，因此情境
應僅在較舊的租約上安裝備援項目。Mantis 會在
`mantis-slack-desktop-smoke-report.md` 中報告總計和
各階段耗時，讓緩慢的執行顯示時間究竟花在
租約暖機、取得認證資訊、遠端設定或
複製成品上。透過 VNC 手動登入 Slack Web
後，請重複使用 `--lease-id <cbx_...>`；重複使用的租約也會讓 Crabbox 的 pnpm 儲存區快取
保持暖機狀態。預設的 `--hydrate-mode source` 會從原始碼簽出內容進行驗證，並
在 VM 內執行安裝／建置。只有當
重複使用的遠端工作區已具備 `node_modules` 和建置完成的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；
該模式會跳過耗時的安裝／建置步驟，並在
工作區尚未就緒時採取失敗關閉。搭配 `--gateway-setup` 時，Mantis 會在 VM 內的連接埠 `38973` 上保留持續執行的
OpenClaw Slack 閘道；若未使用，該
命令會執行一般的機器人對機器人 Slack QA 測試路徑，並在擷取成品
後結束。

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
和已解決核准狀態暫停，將觀察到的 Slack API 訊息呈現至
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`，然後在任何檢查點、
訊息證據、確認回覆或呈現的螢幕截圖缺少或
為空時失敗。冷啟動的 CI 租約可能仍會在
`slack-desktop-smoke.png` 中顯示 Slack 登入畫面；核准檢查點圖片是此測試路徑的視覺
證明。

預設檢查點執行會保留兩個標準 Slack 核准情境。
若要擷取任一選擇性啟用的 Codex 核准路徑，請明確選取
`--scenario slack-codex-approval-exec-native` 或
`--scenario slack-codex-approval-plugin-native`；Mantis 會接受兩者，並產生
相同的待處理／已解決螢幕截圖組。執行器會針對每個選取的 Codex 路徑延長其檢查點
和遠端命令截止時間，讓完整的
核准、代理程式完成和已解決更新序列得以完成。

操作員檢查清單、GitHub 工作流程分派命令、證據留言
契約、hydrate 模式決策表、耗時解讀和失敗
處理步驟位於
[Mantis Slack 桌面執行手冊](/zh-TW/concepts/mantis-slack-desktop-runbook)。

若要執行代理程式／電腦視覺風格的桌面任務，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` 會租用或重複使用 Crabbox 桌面／瀏覽器機器、啟動
`crabbox record --while`、透過巢狀的
`visual-driver` 操作可見的瀏覽器、擷取 `visual-task.png`、在選取 `--vision-mode image-describe` 時針對螢幕截圖執行 `openclaw infer image
describe`，並寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和
`mantis-visual-task-report.md`。設定 `--expect-text` 時，視覺
提示詞會要求結構化 JSON 判定結果（`visible`、`evidence`、`reason`），
而且只有當模型回報 `visible: true` 並提供
引用預期文字的證據時才會通過；僅引用
目標文字的 `visible: false` 回應仍無法通過斷言。使用 `--vision-mode metadata` 可進行
不使用模型的冒煙測試，以證明桌面、瀏覽器、螢幕截圖和影片
管線，而不呼叫影像理解供應商。錄影是
`visual-task` 的必要成品；如果 Crabbox 未錄製非空的
`visual-task.mp4`，即使視覺驅動程式已通過，任務仍會失敗。發生
失敗時，Mantis 會保留租約以供 VNC 使用，除非任務先前已通過
且未設定 `--keep-lease`。

### 認證資訊集區健康檢查

使用集區中的即時認證資訊之前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex 代理環境變數（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`）、驗證端點設定、僅報告
`OPENCLAW_QA_CONVEX_SECRET_CI` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 的已設定／缺少狀態，並在
存在維護者秘密時驗證管理／清單的可存取性。

## 即時傳輸涵蓋範圍

即時傳輸測試路徑共用同一份契約，而不是各自建立
自己的情境清單結構。`qa-channel` 是廣泛的合成產品行為
套件，不屬於即時傳輸涵蓋矩陣。

即時傳輸執行器會從
`openclaw/plugin-sdk/qa-live-transport-scenarios`
匯入共用情境 id、基準涵蓋範圍
輔助程式和情境選取輔助程式。

| 測試路徑 | Canary | 提及閘控 | Bot 對 Bot | 允許清單封鎖 | 頂層回覆 | 引用回覆 | 重新啟動後恢復 | 討論串後續回覆 | 討論串隔離 | 表情回應觀察 | 說明命令 | 原生命令註冊 |
| -------- | ------ | -------- | ---------- | ------------ | -------- | -------- | ---------------- | ---------------- | ------------ | ------------ | -------- | ------------ |
| Discord  | x      | x        | x          |              |          |          |                  |                  |              |              |          | x            |
| Matrix   | x      | x        | x          | x            | x        |          | x                | x                | x            | x            |          |              |
| Slack    | x      | x        | x          | x            | x        |          | x                | x                | x            |              |          |              |
| Telegram | x      | x        | x          |              |          |          |                  |                  |              |              | x        |              |
| WhatsApp | x      | x        |            | x            | x        | x        | x                |                  |              | x            | x        |              |

這讓 `qa-channel` 繼續作為涵蓋廣泛產品行為的測試套件，同時讓 Matrix、
Telegram 與其他即時傳輸共用一份明確的傳輸合約
檢查清單。

若要執行可拋棄式 Linux VM 測試路徑，且不將 Docker 引入 QA 流程，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass 客體、安裝相依套件、在客體內建置 OpenClaw、
執行 `qa suite`，接著將一般 QA 報告與
摘要複製回主機上的 `.artifacts/qa-e2e/...`。它會重複使用與主機上
`qa suite` 相同的情境選擇行為。

主機與 Multipass 套件執行預設會透過隔離的閘道工作程序，
平行執行多個已選情境。`qa-channel` 預設
並行數為 4，上限為已選情境數量。使用 `--concurrency
<count>` 調整工作程序數量，或使用 `--concurrency 1` 依序執行。
使用 `--pack personal-agent` 執行個人助理基準套件（10 個
情境）。套件選擇器會與重複的 `--scenario` 旗標疊加：
先執行明確指定的情境，再依套件順序執行套件情境，並
移除重複項目。當自訂 QA 執行器已提供 OpenTelemetry 收集器設定時，
使用 `--pack observability` 可同時選取
`otel-trace-smoke` 與 `docker-prometheus-smoke` 情境。

只要有任何情境失敗，命令就會以非零狀態結束。若你想取得成品
但不希望結束代碼表示失敗，請使用 `--allow-failures`。

即時執行會轉送適合提供給客體、且受支援的 QA 驗證輸入：
以環境變數提供的供應商金鑰、QA 即時供應商設定路徑，以及
存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在儲存庫根目錄下，
讓客體能透過掛載的工作區寫回資料。

## Discord、Slack、Telegram 與 WhatsApp QA 參考資料

Matrix 因情境數量及由 Docker 支援的主伺服器佈建而有
[專屬頁面](/zh-TW/concepts/qa-matrix)。Discord、Slack、Telegram
與 WhatsApp 會針對預先存在的實際傳輸執行，因此其參考資料
收錄於此。

### 共用命令列介面旗標

這些測試路徑透過
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並
接受相同旗標：

| 旗標                                  | 預設值                                             | 說明                                                                                                                                                  |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 僅執行此情境。可重複指定。                                                                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 寫入報告、摘要、證據、傳輸專屬成品及輸出記錄的位置。相對路徑會以 `--repo-root` 為基準解析。                                                           |
| `--repo-root <path>`                  | `process.cwd()`                                    | 從中立的目前工作目錄叫用時所使用的儲存庫根目錄。                                                                                                      |
| `--sut-account <id>`                  | `sut`                                              | QA 閘道設定內的暫時帳號 ID。                                                                                                                          |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                                                      |
| `--model <ref>` / `--alt-model <ref>` | 供應商預設值                                       | 主要／替代模型參照。                                                                                                                                   |
| `--fast`                              | 關閉                                               | 在支援的情況下啟用供應商快速模式。                                                                                                                     |
| `--credential-source <env\|convex>`   | `env`                                              | 請參閱 [Convex 認證資訊集區](#convex-credential-pool)。                                                                                               |
| `--credential-role <maintainer\|ci>`  | 在 CI 中為 `ci`，其他情況為 `maintainer`           | 使用 `--credential-source convex` 時採用的角色。                                                                                                       |

只要有任何情境失敗，各測試路徑都會以非零狀態結束。`--allow-failures` 會寫入
成品，但不設定表示失敗的結束代碼。Telegram 也接受
`--list-scenarios`，用於列印可用的情境 ID 後結束；其他測試路徑
不提供此旗標。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

以一個真實的私人 Telegram 群組為目標，其中包含兩個不同的 Bot（驅動程式 +
SUT）。SUT Bot 必須有 Telegram 使用者名稱；若兩個 Bot 都已在
`@BotFather` 中啟用 **Bot-to-Bot Communication Mode**，Bot 對 Bot 的觀察效果
最佳。

使用 `--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 數字聊天 ID（字串）。
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

隱含的預設集合一律涵蓋 Canary、提及閘控、原生命令
回覆、命令定址，以及 Bot 對 Bot 的群組回覆。`mock-openai`
預設值也包含確定性的回覆鏈與最終訊息串流
檢查。`telegram-current-session-status-tool` 與
`telegram-tool-only-usage-footer` 仍須選擇加入：前者只有在 Canary 之後
直接以討論串方式執行時才穩定，後者則是透過真實 Telegram 驗證純工具回覆中
`/usage` 頁尾的證據。使用 `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai`，可列印目前的
預設／選用分類及迴歸參照。

輸出成品：

- `telegram-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目，
  包含設定檔、涵蓋範圍、供應商、頻道、成品、結果與 RTT
  欄位。

套件 Telegram 執行使用相同的 Telegram 認證資訊合約。重複 RTT
測量是一般套件 Telegram 即時測試路徑的一部分；RTT
分布會針對所選 RTT 檢查，整合至 `qa-evidence.json` 的
`result.timing` 下。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 時，套件即時包裝程式
會租用一組 `kind: "telegram"` 認證資訊，將租用的群組／驅動程式／SUT
Bot 環境變數匯出至已安裝套件的執行環境、對租約進行心跳偵測，並在
關閉時釋放租約。套件包裝程式預設會對
`telegram-mentioned-message-reply` 執行 20 次 RTT 檢查，RTT 逾時為 30s；
選取 Convex 且不在 CI 中時，Convex 角色預設為
`maintainer`。覆寫
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`，即可調整 RTT 測量，而不必
建立個別的 RTT 命令或 Telegram 專屬摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

以一個真實的私人 Discord 伺服器頻道為目標，其中有兩個 Bot：由測試框架
控制的驅動 Bot，以及由子 OpenClaw 閘道透過內建 Discord 外掛
啟動的 SUT Bot。驗證頻道提及處理、SUT Bot 已向 Discord 註冊
原生 `/help` 命令，以及選擇加入的 Mantis 證據情境。

使用 `--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須符合 Discord 傳回的 SUT Bot 使用者 ID
  （否則此測試路徑會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在
  觀察到的訊息成品中保留訊息本文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 會為
  `discord-voice-autojoin` 選取語音／舞台頻道；若未設定，此情境會選取 SUT Bot 可見的第一個
  語音／舞台頻道。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 選擇加入的語音情境。會單獨執行，啟用
  `channels.discord.voice.autoJoin`，並驗證 SUT Bot 目前的
  Discord 語音狀態為目標語音／舞台頻道。Convex Discord
  認證資訊可包含選用的 `voiceChannelId`；否則執行器會
  探索伺服器中第一個可見的語音／舞台頻道。
- `discord-status-reactions-tool-only` - 選擇加入的 Mantis 情境。會
  單獨執行，因為它會將 SUT 切換為永遠開啟、僅限工具的伺服器回覆，
  並設為 `messages.statusReactions.enabled=true`，接著擷取 REST
  表情回應時間軸以及 HTML/PNG 視覺成品。Mantis 的前後
  報告也會將情境提供的 MP4 成品分別保留為 `baseline.mp4`
  與 `candidate.mp4`。
- `discord-thread-reply-filepath-attachment` - 選擇加入的 Mantis 情境；請參閱
  [Discord Mantis 情境](#discord-mantis-scenarios)。

明確執行 Discord 語音自動加入情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

明確執行 Mantis 狀態表情回應情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

輸出成品：

- `discord-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `discord-qa-observed-messages.json` - 除非設定
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`，否則訊息本文會經過遮蔽。
- 執行狀態反應情境時，會產生 `discord-qa-reaction-timelines.json` 和
  `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

以一個真實的私人 Slack 頻道為目標，並使用兩個不同的機器人：由測試框架控制的驅動程式機器人，以及由子 OpenClaw 閘道透過內建 Slack 外掛啟動的 SUT 機器人。

使用 `--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息本文。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 會啟用供 Mantis 使用的視覺核准檢查點。執行器會寫入 `<scenario>.pending.json` 和
  `<scenario>.resolved.json`，然後等待對應的 `.ack.json` 檔案。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 會覆寫檢查點確認逾時時間。預設值為 `120000`。

透過 Slack 即時配接器公開的標準 YAML 情境：

- `thread-follow-up`
- `thread-isolation`

命令式 Slack 情境（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`、`slack-progress-commentary-false`、
  `slack-progress-commentary-omitted` 和
  `slack-progress-commentary-verbose-dedupe` - 選擇性啟用的真實 Slack 探測，用於驗證獨立的解說／工具進度控制、未提供鍵時的舊版預設行為，以及啟用可持久保存的詳細進度時的單次傳遞行為。
- `slack-reaction-glyph-native` - 選擇性啟用的即時訊息工具反應情境。指示代理程式傳遞完全相同的 `✅` 符號，並確認 Slack 已在目標訊息上為 SUT 機器人儲存 `white_check_mark`。
- `slack-chart-presentation-native` - 選擇性啟用的可攜式圖表情境，用於驗證原生 `data_visualization` 區塊和完全相同的無障礙文字。
- `slack-table-presentation-native` - 選擇性啟用的可攜式表格情境，用於驗證原生 `data_table` 區塊、完全相同的資料列和無障礙文字。
- `slack-table-invalid-blocks-fallback` - 選擇性啟用的直接傳輸情境，透過正式環境 Slack 傳送路徑傳送一個結構仍可讀、但超過限制的原始表格，其中包含 101 個資料列及其標頭；證明 Slack 本身會傳回 `invalid_blocks`，並驗證已儲存且停用格式的備援內容完整，且不含原生資料區塊。報告只保留安全的錯誤碼、數量和布林值證據；原始合成表格文字遵循
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT`。
- `slack-approval-exec-native` - 選擇性啟用的原生 Slack 執行核准情境。透過閘道要求執行核准，驗證 Slack 訊息具有原生核准按鈕、完成核准，並驗證核准完成後的 Slack 更新。
- `slack-approval-plugin-native` - 選擇性啟用的原生 Slack 外掛核准情境。同時啟用執行與外掛核准轉送，使外掛事件不會遭執行核准路由抑制，然後驗證相同的待處理／已完成原生 Slack UI 路徑。
- `slack-codex-approval-exec-native` - 選擇性啟用的 Codex Guardian 命令核准情境。以 Guardian 模式啟用 Codex 外掛，透過 Codex 應用程式伺服器測試框架路由源自 Slack 的閘道代理程式回合，等待
  `openclaw-codex-app-server` 的原生 Slack 外掛核准提示、完成核准，並驗證 Codex 回合以預期的命令輸出和助理標記結束。
- `slack-codex-approval-plugin-native` - 選擇性啟用的 Codex Guardian 檔案核准情境。使用工作區外部的 `apply_patch` 指示，讓 Codex 發出應用程式伺服器檔案變更核准路由，然後驗證相同的原生 Slack 待處理／已完成核准路徑、最終助理標記，以及清理前完全相同的檔案內容。

Codex 核准情境需要 `openai/*` 或 `codex/*` 的 `--model`、一般的即時模型認證資訊，以及 Codex 外掛接受的 Codex 驗證或 API 金鑰驗證。
Slack 報告除了經過遮蔽的 Slack 核准中繼資料外，還包含 Codex 應用程式伺服器方法、所選的 Codex 模型鍵、最終 Codex 回合狀態，以及操作標記驗證。

輸出成品：

- `slack-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `slack-qa-observed-messages.json` - 除非設定
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`，否則訊息本文會經過遮蔽。
- `approval-checkpoints/` - 僅在 Mantis 設定
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 時產生；包含檢查點 JSON、確認 JSON，以及待處理／已完成的螢幕擷取畫面。

#### 設定 Slack 工作區

此執行管線需要同一個工作區中的兩個不同 Slack 應用程式，以及一個兩個機器人均已加入的頻道：

- `channelId` - 兩個機器人均已受邀加入之頻道的 `Cxxxxxxxxxx` ID。請使用專用頻道；此執行管線每次執行都會發文。
- `driverBotToken` - **Driver** 應用程式的機器人權杖（`xoxb-...`）。
- `sutBotToken` - **SUT** 應用程式的機器人權杖（`xoxb-...`）；它必須是與 Driver 不同的 Slack 應用程式，讓其機器人使用者 ID 不同。
- `sutAppToken` - 具有 `connections:write` 的 SUT 應用程式層級權杖（`xapp-...`），由 Socket Mode 使用，讓 SUT 應用程式能夠接收事件。

建議使用專供 QA 使用的 Slack 工作區，而不要重複使用正式環境工作區。

下方的 SUT 資訊清單刻意將內建 Slack 外掛的正式環境安裝（`extensions/slack/src/setup-shared.ts:12`）限縮為 Slack 即時 QA 套件涵蓋的權限和事件。如需使用者實際看到的正式環境頻道設定方式，請參閱
[Slack 頻道快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver／SUT 配對刻意保持分離，因為此執行管線需要同一個工作區中有兩個不同的機器人使用者 ID。

**1. 建立 Driver 應用程式**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → 選擇 QA 工作區、貼上下列資訊清單，然後選擇 _Install to Workspace_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "OpenClaw QA Slack 即時執行管線的測試驅動程式機器人"
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

複製 _Bot User OAuth Token_（`xoxb-...`）— 這會成為
`driverBotToken`。Driver 只需要張貼訊息和識別自身；不需要事件，也不需要 Socket Mode。

**2. 建立 SUT 應用程式**

在相同工作區中重複執行 _Create New App → From a manifest_。此 QA 應用程式刻意使用內建 Slack 外掛正式環境資訊清單（`extensions/slack/src/setup-shared.ts:12`）的較精簡版本：省略反應範圍和事件，因為 Slack 即時 QA 套件尚未涵蓋反應處理。

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "供 OpenClaw 使用的 OpenClaw QA SUT 連接器"
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

Slack 建立應用程式後，請在其設定頁面執行兩項操作：

- _Install to Workspace_ → 複製 _Bot User OAuth Token_ → 這會成為
  `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 新增範圍 `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會成為 `sutAppToken`。

分別使用每個權杖呼叫 `auth.test`，確認兩個機器人的使用者 ID 不同。執行階段會依使用者 ID 區分 Driver 和 SUT；兩者重複使用同一個應用程式會使提及閘控立即失敗。

**3. 建立頻道**

在 QA 工作區中建立一個頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個機器人：

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` ID — 這會成為 `channelId`。公開頻道可以運作；若使用私人頻道，兩個應用程式都已具有 `groups:history`，因此測試框架仍可成功讀取歷史記錄。

**4. 登錄認證資訊**

有兩種選項。單機偵錯可使用環境變數（設定四個
`OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或為共用 Convex 集區植入資料，讓 CI 和其他維護者能夠租用。

針對 Convex 集區，將四個欄位寫入 JSON 檔案：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在你的殼層中匯出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 後，進行登錄與驗證：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack 集區種子"

pnpm openclaw qa credentials list --kind slack --status all --json
```

預期結果為 `count: 1`、`status: "active"`，且沒有 `lease` 欄位。

**5. 驗證端對端流程**

在本機執行此執行管線，確認兩個機器人可透過代理程式互相通訊：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功的執行會在遠低於 30 秒內完成，且 `slack-qa-report.md` 會顯示
`slack-canary` 和 `slack-mention-gating` 的狀態皆為 `pass`。如果執行管線停滯約 90 秒，並以 `Convex credential pool exhausted
for kind "slack"` 結束，則可能是集區為空，或每一列都已租用；`qa
credentials list --kind slack --status all --json` 會告訴你是哪一種情況。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

以兩個專用 WhatsApp Web 帳號為目標：由測試框架控制的 Driver 帳號，以及由子 OpenClaw 閘道透過內建 WhatsApp 外掛啟動的 SUT 帳號。

使用 `--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

選用：

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` 會啟用群組情境，例如
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、群組動作／媒體／投票情境，
  以及 `whatsapp-group-allowlist-block`。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` 會在
  已觀察訊息成品中保留訊息本文。

情境目錄（`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`）：

- 基準與群組管控：`whatsapp-canary`、`whatsapp-pairing-block`、
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
- 使用者路徑訊息動作：`whatsapp-agent-message-action-react` 從真實驅動程式的私訊開始，
  讓模型呼叫 `message` 工具，並觀察 WhatsApp 原生表情回應。
  `whatsapp-agent-message-action-upload-file` 對 `message(action=upload-file)`
  採用相同方式，並觀察 WhatsApp 原生媒體。
  `whatsapp-group-agent-message-action-react` 和
  `whatsapp-group-agent-message-action-upload-file` 證明真實 WhatsApp
  群組中的相同使用者可見動作。
- 群組扇出：`whatsapp-broadcast-group-fanout` 從一則提及對象的
  WhatsApp 群組訊息開始，並驗證來自 `main`
  和 `qa-second` 的不同可見回覆。
- 群組啟用：`whatsapp-group-activation-always` 將真實群組工作階段變更為
  `/activation always`，證明未提及對象的群組訊息會喚醒代理程式，
  然後還原為 `/activation mention`。
  `whatsapp-group-reply-to-bot-triggers` 會預先建立機器人回覆，
  在沒有明確提及的情況下傳送對該回覆的原生引用回覆，
  並驗證代理程式會因該回覆情境而被喚醒。
- 傳入媒體與結構化訊息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  這些情境會透過驅動程式傳送真實 WhatsApp 圖片、音訊、文件、位置、
  聯絡人、貼圖及表情回應事件。
- 直接閘道合約探測：`whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。這些情境刻意略過模型提示，
  並證明具決定性的閘道／頻道 `send`、`poll` 和
  `message.action` 合約。
- 存取控制涵蓋範圍：`whatsapp-access-control-dm-open`、
  `whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、
  `whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- 原生核准：`whatsapp-approval-exec-deny-native`、
  `whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、
  `whatsapp-approval-exec-group-reaction-native`、
  `whatsapp-approval-plugin-native`。
- 狀態表情回應：`whatsapp-status-reactions`、
  `whatsapp-status-reaction-lifecycle`。

目錄目前包含 52 個情境。`live-frontier` 預設通道維持精簡，僅有
10 個情境，以便快速進行冒煙涵蓋測試。`mock-openai`
預設通道會透過真實 WhatsApp 傳輸，以具決定性的方式執行 45 個情境，
且僅模擬模型輸出；核准情境和少數較繁重／阻塞型檢查仍需透過情境 ID 明確執行。

WhatsApp QA 驅動程式會觀察結構化即時事件（`text`、`media`、
`location`、`reaction` 和 `poll`），並可主動傳送媒體、投票、
聯絡人、位置及貼圖。QA Lab 透過
`@openclaw/whatsapp/api.js` 套件介面匯入該驅動程式，而不是存取私有
WhatsApp 執行階段檔案。對於群組觀察，`fromJid` 是群組 JID，
而 `participantJid` 和 `fromPhoneE164` 用來識別參與者傳送者。
訊息內容預設會遮蔽。直接閘道投票、上傳檔案、媒體、群組投票、
群組媒體及回覆格式探測屬於傳輸／API 合約檢查；它們不會被視為使用者提示
讓代理程式選擇相同動作的證明。使用者路徑動作證明來自
`whatsapp-agent-message-action-react` 和
`whatsapp-group-agent-message-action-react` 等情境，其中驅動程式會傳送一般
WhatsApp 訊息，而 QA Lab 會觀察由此產生的 WhatsApp 原生成品。
WhatsApp 報告包含每個情境的方式（`user-path`、
`direct-gateway` 或 `native-approval`），因此不會將證據誤認為它實際上
所能證明的更強合約。

輸出成品：

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `whatsapp-qa-observed-messages.json` - 除非設定
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Convex 認證資訊集區

Discord、Slack、Telegram 和 WhatsApp 通道可從共用 Convex 集區
租用認證資訊，而不是讀取上述環境變數。傳入
`--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；
QA Lab 會取得獨占租約，在執行期間持續傳送心跳，
並在關閉時釋出租約。集區種類包括 `"discord"`、`"slack"`、
`"telegram"` 和 `"whatsapp"`。

代理程式在 `admin/add` 上驗證的承載資料格式：

- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` 必須是數值型聊天 ID 字串。
- Telegram 真實使用者（`kind: "telegram-user"`）：`{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  僅適用於 Mantis Telegram Desktop 證明。一般 QA Lab 通道不得取得
  此種類。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 電話號碼必須是不同的 E.164 字串。

Mantis Telegram Desktop 證明工作流程會為 TDLib 命令列介面驅動程式和
Telegram Desktop 見證者持有一份獨占的 Convex `telegram-user` 租約，
然後在發布證明後釋出租約。

當 PR 需要具決定性的視覺差異時，Mantis 可在 `main` 和 PR 標頭上使用相同的
模擬模型回覆，同時變更 Telegram 格式化程式或傳遞層。擷取預設值已針對
PR 留言調整：標準 Crabbox 類別、24fps 桌面錄影、24fps 動態 GIF，
以及 1920px 預覽寬度。前後對照留言應發布一個僅包含預期 GIF 的乾淨套件。

Slack 通道也可使用此集區。Slack 承載資料格式檢查目前位於
Slack QA 執行器，而非代理程式中；請使用 `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`，
其中 Slack 頻道 ID 的格式類似 `Cxxxxxxxxxx`。請參閱
[設定 Slack 工作區](#setting-up-the-slack-workspace)，瞭解應用程式
和範圍的佈建方式。

操作環境變數和 Convex 代理程式端點合約位於
[測試 → 透過 Convex 共用 Telegram 認證資訊](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)
（該節名稱早於多頻道集區；各種類共用相同的租約語意）。

## 由儲存庫支援的種子資料

種子資產位於 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

這些資產刻意存放於 git 中，讓人員和代理程式都能看到 QA 計畫。

`qa-lab` 維持為通用 YAML 情境執行器。每個情境 YAML 檔案都是一次測試執行的
單一事實來源，並應定義：

- 頂層 `title`
- `scenario` 中繼資料
- `scenario` 中可選的類別、能力、通道和風險中繼資料
- `scenario` 中的文件與程式碼參照
- `scenario` 中可選的外掛需求
- `scenario` 中可選的閘道設定修補
- 流程情境的可執行頂層 `flow`，或 Vitest 和
  Playwright 情境的 `scenario.execution.kind` / `scenario.execution.path`

支援 `flow` 的可重複使用執行階段介面維持通用且跨領域。例如，
YAML 情境可以結合傳輸端輔助工具與瀏覽器端輔助工具，透過
閘道 `browser.request` 接合點驅動內嵌的 Control UI，
而不需要新增特殊用途的執行器。

情境檔案應依產品能力分組，而不是依原始碼樹狀結構資料夾分組。
移動檔案時應保持情境 ID 穩定；使用 `docsRefs` 和
`codeRefs` 追蹤實作。

基準清單應維持足夠廣泛，以涵蓋：

- 私訊和頻道聊天
- 討論串行為
- 訊息動作生命週期
- 排程回呼
- 記憶回想
- 模型切換
- 子代理程式移交
- 讀取儲存庫和讀取文件
- 一項小型建置工作，例如 Lobster Invaders

## 供應商模擬通道

`qa suite` 有兩個本機供應商模擬通道：

- `mock-openai` 是可感知情境的 OpenClaw 模擬。它仍是由儲存庫支援的 QA
  和同等性閘門的預設具決定性模擬通道。
- `aimock` 會啟動由 AIMock 支援的供應商伺服器，用於實驗性
  協定、測試資料、錄製／重播和混沌測試涵蓋範圍。它是附加功能，
  不會取代 `mock-openai` 情境分派器。

供應商通道實作位於 `extensions/qa-lab/src/providers/`。
每個供應商擁有自己的預設值、本機伺服器啟動方式、閘道模型設定、
驗證設定檔暫存需求，以及即時／模擬能力旗標。共用套件和
閘道程式碼會透過供應商登錄檔路由，而不是依供應商名稱進行分支。

## 傳輸介接器

`qa-lab` 擁有供 YAML QA 情境使用的通用傳輸接合點。`qa-channel` 是
合成預設值。`crabline` 會啟動本機供應商形式的伺服器，
並針對這些伺服器執行 OpenClaw 的一般頻道外掛。`live` 保留給
真實供應商認證資訊和外部頻道使用。

在架構層級，職責劃分如下：

- `qa-lab` 負責通用情境執行、工作執行緒並行、成品寫入和報告。
- 傳輸介接器負責閘道設定、就緒狀態、傳入與傳出觀察、傳輸動作，
  以及正規化傳輸狀態。
- `qa/scenarios/` 下的 YAML 情境檔案定義測試執行；`qa-lab`
  提供執行這些情境的可重複使用執行階段介面。

### 新增頻道

將頻道新增至 YAML QA 系統時，需要頻道實作，以及用來演練頻道合約的
情境套件。若要提供冒煙 CI 涵蓋範圍，請新增相符的 Crabline 本機供應商伺服器，
並透過 `crabline` 驅動程式公開該伺服器。

當共用 `qa-lab` 主機可負責流程時，請勿新增頂層 QA 命令根節點。

`qa-lab` 負責共用主機機制：

- `openclaw qa` 命令根節點
- 套件啟動與關閉
- 工作執行緒並行
- 成品寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容性別名

執行器外掛負責傳輸合約：

- 如何將 `openclaw qa <runner>` 掛載在共用的 `qa` 根命令之下
- 如何為該傳輸配置閘道
- 如何檢查就緒狀態
- 如何注入入站事件
- 如何觀察出站訊息
- 如何公開逐字稿與正規化後的傳輸狀態
- 如何執行由傳輸支援的動作
- 如何處理傳輸特定的重設或清理

新頻道的最低採用門檻：

1. 讓 `qa-lab` 繼續作為共用 `qa` 根命令的擁有者。
2. 在共用的 `qa-lab` 主機接縫上實作傳輸執行器。
3. 將傳輸特定的機制保留在執行器外掛或頻道
   測試工具中。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊一個
   相互競爭的根命令。執行器外掛應在
   `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts`
   匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts`
   輕量；延遲載入的命令列介面與執行器執行應保留在個別進入點之後。選用的
   `adapterFactory` 可將傳輸公開給共用情境，而不變更
   命令現有的情境目錄。
5. 在依主題分類的 `qa/scenarios/`
   目錄下編寫或調整 YAML 情境。
6. 新情境使用通用情境輔助函式。
7. 除非儲存庫正在進行有意的遷移，否則應維持現有相容性別名正常運作。

判定規則很嚴格：

- 如果行為可以在 `qa-lab` 中統一定義一次，就將它放在 `qa-lab`。
- 如果行為取決於單一頻道傳輸，請將它保留在該執行器
  外掛或外掛測試工具中。
- 如果某個情境需要多個頻道都能使用的新功能，
  請新增通用輔助函式，而不是在 `suite.ts` 中加入頻道特定分支。
- 如果某個行為只對單一傳輸有意義，請讓情境
  保持傳輸特定，並在情境契約中明確指出這一點。

### 情境輔助函式名稱

新情境偏好使用的通用輔助函式：

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

現有情境仍可使用相容性別名：
`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、
`formatConversationTranscript`、`resetBus`，但編寫新情境時
應使用通用名稱。這些別名是為了避免一次性全面
遷移而存在，而不是未來採用的模型。

## 報告

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 協定報告。
報告應回答：

- 哪些項目運作正常
- 哪些項目失敗
- 哪些項目仍受阻
- 哪些後續情境值得新增

若要取得可用情境的清單，以便評估後續工作規模
或接入新的傳輸，請執行 `pnpm openclaw qa coverage`（加上 `--json`
可取得機器可讀輸出）。為已變更的行為或檔案路徑選擇聚焦的驗證時，
請執行 `pnpm openclaw qa coverage --match <query>`。比對報告會搜尋
情境中繼資料、文件參照、程式碼參照、涵蓋範圍 ID、
外掛和供應商需求，然後列印相符的 `qa suite
--scenario ...` 目標。

每次執行 `qa suite` 都會針對所選情境集合寫入頂層的
`qa-evidence.json`、`qa-suite-summary.json` 和
`qa-suite-report.md` 成品。宣告 `execution.kind: vitest` 或
`execution.kind: playwright` 的情境會執行相符的測試路徑，並另行寫入
各情境的記錄。宣告 `execution.kind: script` 的情境會透過
`node --import tsx` 執行位於 `execution.path` 的
證據產生器（在 `execution.args` 中展開 `${outputDir}` 和
`${scenarioId}`）；產生器會寫入自己的 `qa-evidence.json`，其中的項目
會匯入套件輸出，而其成品路徑則以該產生器的
`qa-evidence.json` 為基準解析。當透過 `qa run
--qa-profile` 進入 `qa suite` 時，同一份 `qa-evidence.json` 也會包含
所選分類體系類別的設定檔計分卡摘要。

請將涵蓋範圍輸出視為探索輔助工具，而不是閘門的替代品；所選情境仍需要
適用於受測行為的正確供應商模式、即時傳輸、
Multipass、Testbox 或發布通道。若需計分卡背景資訊，請參閱
[成熟度計分卡](/zh-TW/maturity/scorecard)。

若要檢查角色特質與風格，請在多個即時模型參照上執行相同情境，
並撰寫經評判的 Markdown 報告：

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

此命令會執行本機 QA 閘道子程序，而不是 Docker。角色特質
評估情境應透過 `SOUL.md` 設定角色設定，然後執行一般的
使用者對話，例如聊天、工作區協助和小型檔案任務。不應告知候選
模型它正在接受評估。此命令會保留每份完整逐字稿、記錄基本執行統計資料，
然後要求評審模型使用快速模式，並在支援的情況下採用 `xhigh` 推理，
依自然度、氛圍和幽默感排列各次執行。比較
供應商時請使用 `--blind-judge-models`：評審提示仍會取得每份逐字稿
與執行狀態，但候選參照會替換成 `candidate-01` 等中性標籤；
報告會在解析後將排名對應回實際參照。

候選執行預設使用 `high` 思考層級，GPT-5.6 Luna 使用 `medium`，
而支援此層級的舊版 OpenAI 評估參照則使用 `xhigh`。若要覆寫特定
候選項目，請在行內使用 `--model provider/model,thinking=<level>`；行內
選項也支援 `fast`、`no-fast` 和 `fast=<bool>`。`--thinking
<level>` 仍可設定全域備用值，而較舊的 `--model-thinking
<provider/model=level>` 形式則為了相容性予以保留。OpenAI 候選
參照預設使用快速模式，因此會在供應商支援時使用優先處理。
只有在你想強制每個候選模型都開啟快速模式時，才傳入 `--fast`。
候選與評審的執行時間都會記錄於報告中，供基準分析使用，但評審提示會明確
要求不得依速度排名。候選與評審模型執行的預設並行數都是 16。
當供應商限制或本機閘道壓力導致執行結果雜訊過多時，請降低
`--concurrency` 或 `--judge-concurrency`。

未傳入候選 `--model` 時，角色特質評估預設使用
`openai/gpt-5.6-luna`、`openai/gpt-5.2`、`openai/gpt-5`、
`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。未傳入
`--judge-model` 時，評審預設使用
`openai/gpt-5.6-sol,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-8,thinking=high`。

## 相關文件

- [Matrix QA](/zh-TW/concepts/qa-matrix)
- [成熟度計分卡](/zh-TW/maturity/scorecard)
- [個人代理程式基準套件](/zh-TW/concepts/personal-agent-benchmark-pack)
- [QA 頻道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
