---
read_when:
    - 瞭解 QA 技術堆疊如何協同運作
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增由儲存庫支援的 QA 情境
    - 圍繞閘道儀表板建構更高擬真度的 QA 自動化
summary: QA 技術棧概覽：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸轉接器與報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-07-14T13:35:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2a217d9aed313db5b57c3d9709b2b976138604ab19ce2c13d8ea279d17df2bb8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 技術堆疊以貼近真實情境、符合頻道運作方式的形式測試 OpenClaw，這是單元測試無法做到的。

組成部分：

- `extensions/qa-channel`：合成訊息頻道，涵蓋私訊、頻道、討論串、回應、編輯及刪除介面。
- `extensions/qa-lab`：用於觀察文字記錄、注入傳入訊息，以及匯出 Markdown 報告的偵錯工具 UI 與 QA 匯流排。
- `extensions/qa-matrix`：即時傳輸配接器，可在子 QA 閘道內驅動真正的 Matrix 外掛。
- `qa/`：由儲存庫支援的啟動任務種子資產與基準 QA 情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器螢幕截圖、虛擬機器狀態及 PR 證據的錯誤，執行修正前後的即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多流程具有 `pnpm qa:*`
指令碼別名；兩種形式皆可使用。

| 命令                                                | 用途                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不使用 `--qa-profile` 的內建 QA 自我檢查；由分類法支援的成熟度設定檔執行器，可搭配 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all`。                                                                                                          |
| `qa suite`                                          | 對 QA 閘道執行由儲存庫支援的情境。`--runner multipass` 使用可拋棄式 Linux 虛擬機器，而非主機。                                                                                                                                                                      |
| `qa coverage`                                       | 輸出 YAML 情境涵蓋範圍清單（`--json` 用於機器輸出；`--match <query>` 用於尋找與受影響行為相關的情境；`--tools` 用於執行階段工具固定資料涵蓋範圍）。                                                                                                          |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案以進行模型軸同等性閘門檢查，或使用 `--runtime-axis --token-efficiency` 寫入 Codex 與 OpenClaw 的執行階段同等性及權杖效率報告。                                                                                                      |
| `qa confidence-report`                              | 依據資訊清單分類 QA 證明成品，產生未知項目為零的信心報告。                                                                                                                                                                                                          |
| `qa confidence-self-test`                           | 寫入預先植入的負向控制金絲雀，證明信心閘門能偵測偏移。                                                                                                                                                                                                              |
| `qa jsonl-replay`                                   | 透過執行階段同等性重播測試框架，重播精選的 JSONL 文字記錄。                                                                                                                                                                                                         |
| `qa character-eval`                                 | 在多個即時模型上執行角色 QA 情境，並產生經評判的報告。請參閱[報告](#reporting)。                                                                                                                                                                                     |
| `qa manual`                                         | 在所選供應商／模型執行路徑上執行一次性提示。                                                                                                                                                                                                                        |
| `qa ui`                                             | 啟動 QA 偵錯工具 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                  |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像檔。                                                                                                                                                                                                                                   |
| `qa docker-scaffold`                                | 為 QA 儀表板與閘道執行路徑寫入 docker-compose 鷹架。                                                                                                                                                                                                                 |
| `qa up`                                             | 建置 QA 網站、啟動由 Docker 支援的技術堆疊，並輸出 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                      |
| `qa aimock`                                         | 僅啟動 AIMock 供應商伺服器。                                                                                                                                                                                                                                        |
| `qa mock-openai`                                    | 僅啟動可感知情境的 `mock-openai` 供應商伺服器。                                                                                                                                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用 Convex 認證資訊集區。                                                                                                                                                                                                                                      |
| `qa discord`                                        | 對真實的私有 Discord 伺服器頻道執行即時傳輸路徑。                                                                                                                                                                                                                   |
| `qa matrix`                                         | 對可拋棄式 Tuwunel 主伺服器執行即時傳輸路徑。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                                                                                               |
| `qa slack`                                          | 對真實的私有 Slack 頻道執行即時傳輸路徑。                                                                                                                                                                                                                           |
| `qa telegram`                                       | 對真實的私有 Telegram 群組執行即時傳輸路徑。                                                                                                                                                                                                                        |
| `qa whatsapp`                                       | 對真實的 WhatsApp Web 帳號執行即時傳輸路徑。                                                                                                                                                                                                                        |
| `qa mantis`                                         | 即時傳輸錯誤的修正前後驗證執行器，包含 Discord 狀態回應證據、Crabbox 桌面／瀏覽器冒煙測試，以及 VNC 中的 Slack 冒煙測試。請參閱 [Mantis](/zh-TW/concepts/mantis) 與 [Mantis Slack 桌面執行手冊](/zh-TW/concepts/mantis-slack-desktop-runbook)。 |

`qa matrix` 註冊為執行器外掛（`extensions/qa-matrix`）；上述其他所有執行路徑都直接內建於 `qa-lab`。

### 由設定檔支援的 `qa run`

由設定檔支援的 `qa run` 會從 `taxonomy.yaml` 讀取成員資格，接著透過 `qa suite` 分派解析出的情境。`--surface` 與 `--category` 會篩選所選設定檔，而非定義不同的執行路徑。產生的
`qa-evidence.json` 包含設定檔評分卡摘要，其中列出所選類別的數量及缺少的涵蓋範圍 ID；各個證據項目仍是測試、涵蓋角色及結果的唯一事實來源。分類法功能涵蓋範圍 ID 是確切的證明目標，而非別名：主要情境涵蓋範圍會滿足相符的 ID，次要涵蓋範圍則僅供參考。涵蓋範圍 ID 使用點號分隔的 `namespace.behavior` 格式，並採用小寫英數字元／連字號區段；設定檔、介面及類別 ID 仍可使用既有的連字號或點號分類法 ID。

精簡證據會省略每個項目的 `execution`，並設定 `evidenceMode: "slim"`；
`smoke-ci` 預設採用精簡格式，而 `--evidence-mode full` 會還原完整項目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 搭配模擬模型供應商與 Crabline 本機供應商伺服器，進行確定性的設定檔證明。使用 `release` 對即時頻道進行 Stable/LTS 證明。僅在明確需要完整分類法證據執行時使用 `all`；它會選取每個作用中的成熟度類別，並可透過 `QA
Profile Evidence` GitHub Actions 工作流程搭配 `qa_profile=all` 進行分派。當命令同時需要 OpenClaw 根設定檔時，請將根設定檔放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作員流程

目前的 QA 操作員流程採用雙窗格 QA 網站：

- 左側：具有代理程式的閘道儀表板（控制 UI）。
- 右側：QA Lab，顯示類似 Slack 的文字記錄與情境計畫。

使用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA 網站、啟動由 Docker 支援的閘道執行路徑，並公開 QA Lab 頁面，讓操作員或自動化迴圈能向代理程式指派 QA 任務、觀察真實頻道行為，以及記錄哪些項目成功、失敗或仍受阻。

若要加快 QA Lab UI 反覆修改的速度，而不必每次都重新建置 Docker 映像檔，請使用繫結掛載的 QA Lab 套件組合啟動技術堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務持續使用預先建置的映像檔，並將 `extensions/qa-lab/web/dist` 繫結掛載至 `qa-lab` 容器。
`qa:lab:watch` 會在發生變更時重新建置該套件組合，且當 QA Lab 資產雜湊變更時，瀏覽器會自動重新載入。

### 可觀測性冒煙測試

<Note>
可觀測性 QA 僅限原始碼簽出版本使用。npm tarball 刻意省略 QA Lab（以及 `qa-channel`/`qa-matrix`），因此套件 Docker 發行執行路徑不會執行 `qa` 命令。變更診斷檢測功能時，請從已建置的原始碼簽出版本執行這些命令。
</Note>

| 別名                                    | 執行內容                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 本機 OpenTelemetry 接收器，加上已啟用 `diagnostics-otel` 的 `otel-trace-smoke` 情境。                                      |
| `pnpm qa:otel:collector-smoke`          | 相同作業流程，但位於真正的 OpenTelemetry Collector Docker 容器後方。變更端點接線或 Collector/OTLP 相容性時使用。 |
| `pnpm qa:prometheus:smoke`              | 已啟用 `diagnostics-prometheus` 的 `docker-prometheus-smoke` 情境。                                                           |
| `pnpm qa:observability:smoke`           | 先執行 `qa:otel:smoke`，再執行 `qa:prometheus:smoke`。                                                                                      |
| `pnpm qa:observability:collector-smoke` | 先執行 `qa:otel:collector-smoke`，再執行 `qa:prometheus:smoke`。                                                                            |

`qa:otel:smoke` 會啟動本機 OTLP/HTTP 接收器、執行最小化的 QA 頻道
代理程式回合，然後斷言追蹤、指標和日誌均已匯出。它會解碼
匯出的 protobuf 追蹤跨度，並檢查對發布至關重要的結構：
`openclaw.run`、`openclaw.harness.run`、採用最新 GenAI 語意慣例的
模型呼叫跨度、`openclaw.context.assembled` 和 `openclaw.message.delivery`
都必須存在。煙霧測試會強制使用
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此模型呼叫
跨度必須使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名稱；成功的回合中，模型
呼叫不得匯出 `StreamAbandoned`；原始診斷
ID 和 `openclaw.content.*` 屬性不得出現在追蹤中。情境
提示會要求模型以固定標記回覆，並隱藏固定的
秘密字串；原始 OTLP 承載資料不得包含這兩者，也不得包含從情境 ID
衍生的 QA 工作階段金鑰。它會在 QA 套件成品旁寫入 `otel-smoke-summary.json`。

`qa:prometheus:smoke` 會驗證未經驗證的擷取遭到拒絕，接著
檢查經過驗證的擷取包含對發布至關重要的指標系列，
且不含提示內容、回應內容、原始診斷識別碼、驗證
權杖或本機路徑。

### Matrix 煙霧測試作業流程

若要執行不需要模型提供者認證資訊、使用真實傳輸的 Matrix 煙霧測試作業流程，
請搭配確定性的模擬 OpenAI 提供者執行快速設定檔：

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

若要執行即時前沿提供者作業流程，請明確提供 OpenAI 相容的認證資訊：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

此作業流程的完整命令列介面參考、設定檔／情境目錄、環境變數和成品
配置請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。簡而言之：它會
在 Docker 中佈建可拋棄的 Tuwunel 主伺服器、註冊臨時的
驅動程式／受測系統／觀察者使用者、在限定於該傳輸的子 QA
閘道內執行真正的 Matrix 外掛（無 `qa-channel`），然後在
`.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown
報告、JSON 摘要、觀察到的事件成品和合併輸出日誌。

這些情境涵蓋單元測試無法端對端證明的傳輸行為：
提及門控、允許機器人的政策、允許清單、頂層和討論串
回覆、私訊路由、回應處理、抑制傳入編輯、重新啟動後重播
去重、主伺服器中斷復原、核准中繼資料傳送、
媒體處理，以及 Matrix E2EE 啟動／復原／驗證流程。
E2EE 命令列介面設定檔也會透過相同的可拋棄主伺服器執行 `openclaw matrix encryption setup` 和
驗證命令，再檢查
閘道回覆。

CI 會在
`.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令介面。排程和預設的
手動執行會搭配 QA 提供的即時前沿
認證資訊、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` 執行快速 Matrix 設定檔。
手動 `matrix_profile=all` 會分散為五個設定檔分片：`transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli`。

### Discord Mantis 情境

Discord 也有僅限 Mantis 的選擇性情境，用於重現錯誤。使用
`--scenario discord-status-reactions-tool-only` 取得明確的狀態
回應時間軸，或使用 `--scenario discord-thread-reply-filepath-attachment`
建立真正的 Discord 討論串，並驗證 `message.thread-reply`
會保留 `filePath` 附件。這些情境不包含在預設的
即時 Discord 作業流程中，因為它們是修正前／修正後的重現探針，而不是
廣泛的煙霧測試涵蓋範圍。當 QA
環境中已設定 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 時，討論串附件 Mantis 工作流程也可以加入
已登入 Discord Web 的見證影片。該檢視器設定檔僅用於視覺擷取；
通過／失敗判定仍然來自 Discord REST 預言機制。

若要執行使用真實傳輸的 Discord、Slack、Telegram 和 WhatsApp 煙霧測試作業流程：

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

它們會以預先存在、使用兩個機器人或帳號（驅動程式 +
受測系統）的真實頻道為目標。必要的環境變數、情境清單、輸出成品和 Convex
認證資訊集區記載於下方的
[Discord、Slack、Telegram 和 WhatsApp QA 參考](#discord-slack-telegram-and-whatsapp-qa-reference)。

### Mantis Slack 桌面和視覺任務執行器

若要透過 VNC 救援執行完整的 Slack 桌面虛擬機器，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用 Crabbox 桌面／瀏覽器機器、在虛擬機器內執行 Slack 即時
作業流程、在 VNC 瀏覽器中開啟 Slack Web、擷取桌面，
並將 `slack-qa/`、`slack-desktop-smoke.png` 和
`slack-desktop-smoke.mp4`（影片擷取可用時）複製回
Mantis 成品目錄。Crabbox 桌面／瀏覽器租約會預先提供擷取
工具和瀏覽器／原生建置輔助套件，因此情境
應只在較舊的租約上安裝備援項目。Mantis 會在 `mantis-slack-desktop-smoke-report.md` 中報告總計和
各階段耗時，讓緩慢執行能顯示
時間是花在租約暖機、取得認證資訊、遠端設定，還是
複製成品。透過 VNC 手動登入 Slack Web 後，重複使用 `--lease-id <cbx_...>`；
重複使用的租約也會讓 Crabbox 的 pnpm 儲存區快取
保持暖機狀態。預設的 `--hydrate-mode source` 會從原始碼簽出內容進行驗證，並
在虛擬機器內執行安裝／建置。僅當
重複使用的遠端工作區已具有 `node_modules` 和建置完成的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；
該模式會略過耗時的安裝／建置步驟，並在
工作區尚未就緒時以封閉方式失敗。使用 `--gateway-setup` 時，Mantis 會在虛擬機器內的連接埠 `38973` 上
保留持續運作的 OpenClaw Slack 閘道；若未使用，
命令會執行一般的機器人對機器人 Slack QA 作業流程，並在成品
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
核准情境、拒絕非核准情境 ID、在每個待處理和已解決的核准狀態暫停，
將觀察到的 Slack API 訊息呈現至
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`，然後在任何檢查點、
訊息證據、確認回覆或呈現的螢幕擷取缺失或
為空時失敗。冷啟動 CI 租約的
`slack-desktop-smoke.png` 中可能仍會顯示 Slack 登入畫面；核准檢查點影像才是此作業流程的
視覺證明。

預設檢查點執行會保留兩個標準 Slack 核准情境。
若要擷取任一選擇性 Codex 核准路由，請使用
`--scenario slack-codex-approval-exec-native` 或
`--scenario slack-codex-approval-plugin-native` 明確選取；Mantis 接受這兩者，並會產生
相同的待處理／已解決螢幕擷取配對。執行器會針對每個選取的 Codex 路由
延長其檢查點和遠端命令截止時間，讓完整的
核准、代理程式完成和已解決更新序列得以完成。

操作員檢查清單、GitHub 工作流程分派命令、證據留言
契約、hydrate 模式決策表、耗時解讀和失敗
處理步驟記載於
[Mantis Slack 桌面操作手冊](/zh-TW/concepts/mantis-slack-desktop-runbook)。

若要執行代理程式／電腦視覺風格的桌面任務，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` 會租用或重複使用 Crabbox 桌面／瀏覽器機器、啟動
`crabbox record --while`、透過巢狀
`visual-driver` 驅動可見瀏覽器、擷取 `visual-task.png`、在選取 `--vision-mode image-describe` 時針對螢幕擷取執行 `openclaw infer image
describe`，
並寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和
`mantis-visual-task-report.md`。設定 `--expect-text` 時，視覺
提示會要求結構化 JSON 判定（`visible`、`evidence`、`reason`），
而且只有模型回報 `visible: true`，並提供
引用預期文字的證據時才會通過；僅引用
目標文字的 `visible: false` 回應仍會無法通過斷言。使用 `--vision-mode metadata`
執行不使用模型的煙霧測試，以證明桌面、瀏覽器、螢幕擷取和影片
管線能正常運作，而不呼叫影像理解提供者。錄影是
`visual-task` 的必要成品；如果 Crabbox 未錄製任何非空的
`visual-task.mp4`，即使視覺驅動程式已通過，任務仍會失敗。發生
失敗時，Mantis 會為 VNC 保留租約，除非任務先前已通過
且未設定 `--keep-lease`。

### 認證資訊集區健康檢查

使用集區中的即時認證資訊前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex 代理環境（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`）、驗證端點設定、僅回報
`OPENCLAW_QA_CONVEX_SECRET_CI` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 的已設定／缺失狀態，並在維護者秘密存在時
驗證管理／列出操作的可連線性。

## 即時傳輸涵蓋範圍

即時傳輸作業流程共用同一份契約，而不是各自發明自己的
情境清單結構。`qa-channel` 是廣泛的合成產品行為
套件，不屬於即時傳輸涵蓋矩陣。

即時傳輸執行器會從
`openclaw/plugin-sdk/qa-live-transport-scenarios`
匯入共用情境 ID、基準涵蓋範圍輔助函式和情境選取輔助函式。

| 測試路徑 | Canary | 提及閘控 | Bot 對 Bot | 允許清單封鎖 | 頂層回覆 | 引用回覆 | 重新啟動後續接 | 討論串後續回覆 | 討論串隔離 | 反應觀察 | 說明命令 | 原生命令註冊 |
| -------- | ------ | -------- | ---------- | ------------ | -------- | -------- | ------------ | -------------- | ------------ | -------- | -------- | ------------ |
| Discord  | x      | x        | x          |              |          |          |              |                |              |          |          | x            |
| Matrix   | x      | x        | x          | x            | x        |          | x            | x              | x            | x        |          |              |
| Slack    | x      | x        | x          | x            | x        |          | x            | x              | x            |          |          |              |
| Telegram | x      | x        | x          |              |          |          |              |                |              |          | x        |              |
| WhatsApp | x      | x        |            | x            | x        | x        | x            |                |              | x        | x        |              |

如此可將 `qa-channel` 保留為涵蓋廣泛產品行為的測試套件，同時讓 Matrix、
Telegram 和其他即時傳輸共用一份明確的傳輸合約
檢查清單。

若要使用可拋棄的 Linux VM 測試路徑，且不將 Docker 納入 QA 流程，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass 客體、安裝相依套件、在客體內建置 OpenClaw、
執行 `qa suite`，然後將一般 QA 報告與
摘要複製回主機上的 `.artifacts/qa-e2e/...`。它會重複使用與主機上的
`qa suite` 相同的情境選取行為。

主機與 Multipass 套件執行預設會使用隔離的閘道工作程式，
平行執行多個選定情境。`qa-channel` 的預設
並行數為 4，上限為選定的情境數量。使用 `--concurrency
<count>` 調整工作程式數量，或使用 `--concurrency 1` 依序執行。
使用 `--pack personal-agent` 執行個人助理基準測試包（10 個
情境）。測試包選擇器可與重複的 `--scenario` 旗標累加：
先執行明確指定的情境，再依測試包順序執行情境，並
移除重複項目。當自訂 QA 執行器已提供 OpenTelemetry 收集器設定時，使用 `--pack observability` 同時選取
`otel-trace-smoke` 和 `docker-prometheus-smoke` 情境。

任何情境失敗時，此命令都會以非零狀態結束。若希望產生構件，但不希望結束碼表示失敗，請使用 `--allow-failures`。

即時執行會轉送適合提供給客體的受支援 QA 驗證輸入：
以環境變數提供的供應商金鑰、QA 即時供應商設定路徑，以及
存在時的 `CODEX_HOME`。請將 `--output-dir` 保留在儲存庫根目錄下，以便
客體透過掛載的工作區寫回。

## Discord、Slack、Telegram 與 WhatsApp QA 參考資料

Matrix 因情境數量及採用 Docker 的 homeserver 佈建方式而有一個[專屬頁面](/zh-TW/concepts/qa-matrix)。Discord、Slack、Telegram
和 WhatsApp 會針對預先存在的真實傳輸執行，因此其參考資料
位於此處。

### 共用命令列介面旗標

這些測試路徑會透過
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，
並接受相同的旗標：

| 旗標                                  | 預設值                                             | 說明                                                                                                                                              |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 僅執行此情境。可重複指定。                                                                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 寫入報告、摘要、證據、傳輸特定構件及輸出記錄的位置。相對路徑會以 `--repo-root` 為基準解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 從中立的目前工作目錄叫用時所使用的儲存庫根目錄。                                                                                                  |
| `--sut-account <id>`                  | `sut`                                              | QA 閘道設定中的暫時帳號 ID。                                                                                                                      |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | 供應商預設值                                       | 主要／替代模型參照。                                                                                                                              |
| `--fast`                              | 關閉                                               | 在支援的情況下使用供應商快速模式。                                                                                                                |
| `--credential-source <env\|convex>`   | `env`                                              | 請參閱 [Convex 認證資訊集區](#convex-credential-pool)。                                                                                           |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，其他情況為 `maintainer`                 | `--credential-source convex` 時使用的角色。                                                                                                    |

任何情境失敗時，各測試路徑都會以非零狀態結束。`--allow-failures` 會寫入
構件，但不會設定表示失敗的結束碼。Telegram 也接受
`--list-scenarios`，用以列出可用的情境 ID 後結束；其他測試路徑
不提供此旗標。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標為一個真實的私人 Telegram 群組，其中有兩個不同的 Bot（驅動程式 +
SUT）。SUT Bot 必須具有 Telegram 使用者名稱；若兩個 Bot 都在
`@BotFather` 中啟用 **Bot-to-Bot Communication Mode**，
Bot 對 Bot 觀察的效果最佳。

`--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 數值聊天 ID（字串）。
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
回覆、命令定址及 Bot 對 Bot 群組回覆。`mock-openai`
的預設值也包含具決定性的回覆鏈與最終訊息串流
檢查。`telegram-current-session-status-tool` 和
`telegram-tool-only-usage-footer` 仍須選擇加入：前者只有在緊接 Canary 之後串接執行時才穩定，
後者則是在真實 Telegram 上驗證僅含工具回覆中
`/usage` 頁尾的證明。使用 `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` 列出目前
預設／選用項目的劃分及其迴歸參照。

輸出構件：

- `telegram-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目，
  包含設定檔、涵蓋範圍、供應商、頻道、構件、結果與 RTT
  欄位。

套件 Telegram 執行使用相同的 Telegram 認證資訊合約。重複 RTT
測量是一般套件 Telegram 即時測試路徑的一部分；所選 RTT 檢查的 RTT
分布會整合至 `qa-evidence.json` 的 `result.timing` 下。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 時，套件即時包裝函式會
租用一組 `kind: "telegram"` 認證資訊、將租用的群組／驅動程式／SUT
Bot 環境變數匯出至已安裝套件的執行環境、對租約傳送心跳偵測，並在關閉時釋放租約。
套件包裝函式預設會對 `telegram-mentioned-message-reply` 執行 20 次 RTT 檢查，
RTT 逾時時間為 30s；選取 Convex 時，在 CI 外使用 Convex 角色
`maintainer`。可覆寫
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` 來調整 RTT 測量，而無須
建立個別的 RTT 命令或 Telegram 專用摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標為一個真實的私人 Discord 公會頻道，其中有兩個 Bot：由測試框架
控制的驅動程式 Bot，以及由子 OpenClaw 閘道
透過隨附的 Discord 外掛啟動的 SUT Bot。它會驗證頻道提及處理、
SUT Bot 是否已向 Discord 註冊原生 `/help` 命令，以及
選擇加入的 Mantis 證據情境。

`--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須與 Discord 傳回的 SUT Bot 使用者 ID
  相符（否則此測試路徑會立即失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會將訊息本文保留在
  已觀察訊息構件中。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 會選取供
  `discord-voice-autojoin` 使用的語音／Stage 頻道；若未指定，情境會選取 SUT Bot
  可見的第一個語音／Stage 頻道。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 選擇加入的語音情境。會獨立執行、啟用
  `channels.discord.voice.autoJoin`，並驗證 SUT Bot 目前的
  Discord 語音狀態是否為目標語音／Stage 頻道。Convex Discord
  認證資訊可包含選用的 `voiceChannelId`；否則執行器會
  探索公會中第一個可見的語音／Stage 頻道。
- `discord-status-reactions-tool-only` - 選擇加入的 Mantis 情境。由於它會使用
  `messages.statusReactions.enabled=true` 將 SUT 切換為持續啟用、僅含工具的公會回覆，
  因此會獨立執行，接著擷取 REST
  反應時間軸及 HTML/PNG 視覺構件。Mantis 執行前／後
  報告也會將情境提供的 MP4 構件保留為 `baseline.mp4`
  和 `candidate.mp4`。
- `discord-thread-reply-filepath-attachment` - 選擇加入的 Mantis 情境；請參閱
  [Discord Mantis 情境](#discord-mantis-scenarios)。

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
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

輸出構件：

- `discord-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `discord-qa-observed-messages.json` - 訊息本文會經過遮蔽，除非
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`。
- `discord-qa-reaction-timelines.json`，以及在執行狀態回應
  情境時產生的 `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

以一個真實的私人 Slack 頻道為目標，並使用兩個不同的機器人：一個由測試框架
控制的驅動程式機器人，以及一個由子 OpenClaw 閘道透過隨附的 Slack 外掛
啟動的受測系統機器人。

使用 `--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在觀察到的訊息成品中保留
  訊息本文。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 會為 Mantis 啟用視覺核准
  檢查點。執行器會寫入 `<scenario>.pending.json` 和
  `<scenario>.resolved.json`，然後等待相符的 `.ack.json` 檔案。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 會覆寫檢查點
  確認逾時。預設值為 `120000`。

透過 Slack 即時轉接器公開的標準 YAML 情境：

- `thread-follow-up`
- `thread-isolation`

命令式 Slack 情境（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - 選擇加入的真實 Slack 探查，確認
  已設定但停用的頻道會發出結構化警告，而不會回覆。
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`、`slack-progress-commentary-false`、
  `slack-progress-commentary-omitted` 和
  `slack-progress-commentary-verbose-dedupe` - 選擇加入的真實 Slack 探查，用於驗證
  獨立的評論／工具進度控制、省略鍵時的舊版預設值，以及啟用持久詳細進度時
  僅傳送一次的行為。
- `slack-reaction-glyph-native` - 選擇加入的即時訊息工具回應情境。
  指示代理傳入完全相同的 `✅` 圖示，並確認 Slack 已為目標訊息上的
  受測系統機器人儲存 `white_check_mark`。
- `slack-chart-presentation-native` - 選擇加入的可攜式圖表情境，
  驗證原生 `data_visualization` 區塊和完全相同的無障礙文字。
- `slack-table-presentation-native` - 選擇加入的可攜式表格情境，
  驗證原生 `data_table` 區塊、完全相同的資料列和無障礙文字。
- `slack-table-invalid-blocks-fallback` - 選擇加入的直接傳輸情境，
  透過正式環境的 Slack 傳送路徑，傳送一個結構可讀但超出限制的原始表格，
  其中包含 101 個資料列及其標頭，證明 Slack 本身會傳回 `invalid_blocks`，
  並驗證已儲存且停用格式的後援內容完整，且不含原生資料區塊。報告只保留安全的
  錯誤碼、計數和布林值證據；原始合成表格文字遵循
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT`。
- `slack-approval-exec-native` - 選擇加入的原生 Slack 執行核准情境。
  透過閘道要求執行核准、驗證 Slack 訊息具有原生核准按鈕、完成處理，
  並驗證處理完成後的 Slack 更新。
- `slack-approval-plugin-native` - 選擇加入的原生 Slack 外掛核准
  情境。同時啟用執行和外掛核准轉送，避免外掛事件遭執行核准路由抑制，
  然後驗證相同的待處理／已處理原生 Slack UI 路徑。
- `slack-codex-approval-exec-native` - 選擇加入的 Codex Guardian 命令核准
  情境。以 Guardian 模式啟用 Codex 外掛，將源自 Slack 的閘道代理回合
  經由 Codex 應用程式伺服器測試框架路由，等待
  `openclaw-codex-app-server` 的原生 Slack 外掛核准提示、完成處理，
  並驗證 Codex 回合以預期的命令輸出和助理標記結束。
- `slack-codex-approval-plugin-native` - 選擇加入的 Codex Guardian 檔案核准
  情境。使用工作區外的 `apply_patch` 指示，使 Codex 發出
  應用程式伺服器檔案變更核准路由，然後驗證相同的原生 Slack
  待處理／已處理核准路徑、最終助理標記，以及清理前完全相同的檔案內容。

Codex 核准情境需要 `openai/*` 或 `codex/*` `--model`、
一般即時模型認證資訊，以及 Codex 外掛接受的 Codex 驗證或 API 金鑰驗證。
Slack 報告除了經遮蔽的 Slack 核准中繼資料外，還包括 Codex 應用程式伺服器方法、
選定的 Codex 模型鍵、最終 Codex 回合狀態和操作標記驗證。

輸出成品：

- `slack-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `slack-qa-observed-messages.json` - 訊息本文會經過遮蔽，除非
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`。
- `approval-checkpoints/` - 僅在 Mantis 設定
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 時產生；包含檢查點 JSON、
  確認 JSON，以及待處理／已處理螢幕截圖。

#### 設定 Slack 工作區

此執行路徑需要同一個工作區中的兩個不同 Slack 應用程式，以及一個兩個
機器人皆已加入的頻道：

- `channelId` - 已邀請兩個機器人的頻道 `Cxxxxxxxxxx` ID。
  請使用專用頻道；此執行路徑每次執行都會發文。
- `driverBotToken` - **Driver** 應用程式的機器人權杖
  （`xoxb-...`）。
- `sutBotToken` - **SUT** 應用程式的機器人權杖
  （`xoxb-...`）；它必須是與驅動程式不同的 Slack 應用程式，
  以確保機器人使用者 ID 不同。
- `sutAppToken` - SUT 應用程式的應用程式層級權杖
  （`xapp-...`），具備 `connections:write`，供 Socket Mode
  使用，讓 SUT 應用程式可以接收事件。

相較於重複使用正式環境工作區，建議使用專供 QA 使用的 Slack 工作區。

下方的 SUT 資訊清單刻意將隨附 Slack 外掛的正式環境安裝
（`extensions/slack/src/setup-shared.ts:12`）縮限為即時 Slack QA 套件所涵蓋的
權限和事件。如需使用者所見的正式頻道設定，請參閱
[Slack 頻道快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver／SUT
組合刻意分開，因為此執行路徑需要同一工作區中兩個不同的機器人使用者 ID。

**1. 建立 Driver 應用程式**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → 選擇 QA 工作區、貼上下列資訊清單，
然後按下 _Install to Workspace_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "OpenClaw QA Slack 即時執行路徑的測試驅動程式機器人"
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

複製 _Bot User OAuth Token_（`xoxb-...`），它會成為
`driverBotToken`。驅動程式只需發佈訊息並識別自身；不需要事件，也不需要
Socket Mode。

**2. 建立 SUT 應用程式**

在同一工作區中重複執行 _Create New App → From a manifest_。此 QA 應用程式
刻意使用隨附 Slack 外掛正式環境資訊清單（`extensions/slack/src/setup-shared.ts:12`）
的較精簡版本：由於即時 Slack QA 套件尚未涵蓋回應處理，因此省略回應
權限範圍和事件。

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

- _Install to Workspace_ → 複製 _Bot User OAuth Token_ → 它會成為
  `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 新增
  權限範圍 `connections:write` → 儲存 → 複製 `xapp-...` 值 → 它會
  成為 `sutAppToken`。

分別使用各權杖呼叫 `auth.test`，確認兩個機器人具有不同的使用者 ID。
執行階段會依使用者 ID 區分驅動程式和 SUT；兩者重複使用同一個應用程式，
會立即造成提及閘門檢查失敗。

**3. 建立頻道**

在 QA 工作區中建立頻道（例如 `#openclaw-qa`），並從頻道內邀請
兩個機器人：

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` ID，
它會成為 `channelId`。公開頻道可正常運作；若使用私人頻道，
兩個應用程式都已具備 `groups:history`，因此測試框架仍可成功讀取歷史記錄。

**4. 登錄認證資訊**

有兩種選項。單機偵錯可使用環境變數（設定四個
`OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或將認證資訊
植入共用 Convex 集區，讓 CI 和其他維護者可以租用。

若使用 Convex 集區，請將四個欄位寫入 JSON 檔案：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在殼層中匯出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
後，進行登錄並驗證：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

預期會看到 `count: 1`、`status: "active"`，且沒有
`lease` 欄位。

**5. 驗證端對端流程**

在本機執行此執行路徑，確認兩個機器人可以透過代理彼此通訊：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功的執行會在遠少於 30 秒內完成，且 `slack-qa-report.md`
會顯示 `slack-canary` 和 `slack-mention-gating` 的狀態皆為
`pass`。若執行路徑停滯約 90 秒並以
`Convex credential pool exhausted
for kind "slack"` 結束，表示集區為空或每一列都已被租用；
`qa
credentials list --kind slack --status all --json` 會指出是哪一種情況。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

以兩個專用 WhatsApp Web 帳號為目標：一個由測試框架控制的驅動程式帳號，
以及一個由子 OpenClaw 閘道透過隨附 WhatsApp 外掛啟動的受測系統帳號。

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
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` 會在觀察到的訊息成品中保留
  訊息本文。

情境目錄（`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`）：

- 基準與群組閘控：`whatsapp-canary`、`whatsapp-pairing-block`、
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
  `whatsapp-agent-message-action-upload-file` 對 `message(action=upload-file)` 採用相同方式，並觀察
  WhatsApp 原生媒體。`whatsapp-group-agent-message-action-react` 與
  `whatsapp-group-agent-message-action-upload-file` 在真實 WhatsApp 群組中驗證相同的
  使用者可見動作。
- 群組扇出：`whatsapp-broadcast-group-fanout` 從一則提及對象的
  WhatsApp 群組訊息開始，並驗證來自 `main`
  與 `qa-second` 的不同可見回覆。
- 群組啟用：`whatsapp-group-activation-always` 將真實群組
  工作階段變更為 `/activation always`，驗證未提及對象的群組訊息會喚醒
  代理程式，然後還原 `/activation mention`。
  `whatsapp-group-reply-to-bot-triggers` 先建立一則機器人回覆，再對其傳送不含明確提及的
  原生引用回覆，並驗證代理程式會因該回覆脈絡而喚醒。
- 傳入媒體與結構化訊息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  這些情境會透過驅動程式傳送真實的 WhatsApp 圖片、音訊、文件、位置、聯絡人、
  貼圖與表情回應事件。
- 直接閘道合約探測：`whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。這些情境刻意略過模型提示，
  並驗證確定性的閘道／頻道 `send`、`poll` 與
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

目錄目前包含 52 個情境。`live-frontier` 預設執行通道
維持精簡，只包含 10 個情境，以便快速進行冒煙測試。`mock-openai`
預設執行通道會透過真實 WhatsApp 傳輸，以確定性方式執行 45 個情境，
且僅模擬模型輸出；核准情境及少數負載較重／會阻塞的檢查，仍需透過情境 ID 明確執行。

WhatsApp QA 驅動程式會觀察結構化即時事件（`text`、`media`、
`location`、`reaction` 與 `poll`），並能主動傳送媒體、投票、
聯絡人、位置與貼圖。QA Lab 透過
`@openclaw/whatsapp/api.js` 套件介面匯入該驅動程式，而不直接存取私有的
WhatsApp 執行階段檔案。對於群組觀察，`fromJid` 是群組 JID，
而 `participantJid` 與 `fromPhoneE164` 用於識別參與者傳送者。
訊息內容預設會遮蔽。直接閘道投票、檔案上傳、
媒體、群組投票、群組媒體及回覆形狀探測，屬於傳輸／API
合約檢查；它們不會被視為使用者提示使代理程式選擇相同動作的證明。
使用者路徑的動作證明來自 `whatsapp-agent-message-action-react` 與
`whatsapp-group-agent-message-action-react` 等情境，其中驅動程式會傳送一般
WhatsApp 訊息，而 QA Lab 會觀察所產生的 WhatsApp 原生產物。
WhatsApp 報告包含各情境的測試方式（`user-path`、
`direct-gateway` 或 `native-approval`），避免將證據誤認為
其實際證明範圍以外的更強合約。

輸出產物：

- `whatsapp-qa-report.md`
- `qa-evidence.json` — 即時傳輸檢查的證據項目。
- `whatsapp-qa-observed-messages.json` — 除非
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`，否則內文會遮蔽。

### Convex 認證資訊集區

Discord、Slack、Telegram 與 WhatsApp 執行通道可以從共用的
Convex 集區租用認證資訊，而非讀取上述環境變數。傳入
`--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；
QA Lab 會取得獨占租約、在執行期間持續傳送心跳偵測，
並在關閉時釋放租約。集區種類包括 `"discord"`、`"slack"`、
`"telegram"` 與 `"whatsapp"`。

代理服務會在 `admin/add` 驗證的承載資料形狀：

- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string,
sutToken: string }` — `groupId` 必須是數字聊天 ID 字串。
- Telegram 真實使用者（`kind: "telegram-user"`）：`{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` —
  僅供 Mantis Telegram Desktop 證明使用。一般 QA Lab 執行通道不得取得
  此種類。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` — 電話號碼必須是彼此不同的 E.164 字串。

Mantis Telegram Desktop 證明工作流程會為 TDLib 命令列介面驅動程式與
Telegram Desktop 見證程式共同持有一個獨占 Convex
`telegram-user` 租約，並在發布證明後釋放該租約。

當 PR 需要確定性的視覺差異時，Mantis 可以在 `main` 與 PR
最新提交中使用相同的模擬模型回覆，同時變更 Telegram 格式化程式或
傳遞層。擷取預設值已針對 PR 留言調整：標準
Crabbox 類別、24fps 桌面錄影、24fps 動態 GIF，以及 1920px 預覽
寬度。前後對照留言應發布只包含預期 GIF 的乾淨套件。

Slack 執行通道也可以使用此集區。Slack 承載資料形狀檢查目前位於
Slack QA 執行器，而非代理服務；請使用 `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`，並搭配
`Cxxxxxxxxxx` 之類的 Slack 頻道 ID。應用程式
與範圍佈建方式請參閱[設定 Slack 工作區](#setting-up-the-slack-workspace)。

操作環境變數與 Convex 代理服務端點合約記載於
[測試 → 透過 Convex 共用 Telegram 認證資訊](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)
（該節名稱早於多頻道集區；各種類共用相同的租約語意）。

## 由儲存庫支援的種子資料

種子資產位於 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

這些內容刻意納入 git，讓人員與代理程式都能查看 QA 計畫。

`qa-lab` 維持為通用 YAML 情境執行器。每個情境 YAML 檔案都是
單次測試執行的單一事實來源，並應定義：

- 頂層 `title`
- `scenario` 中繼資料
- `scenario` 中選用的類別、能力、執行通道與風險中繼資料
- `scenario` 中的文件與程式碼參照
- `scenario` 中選用的外掛需求
- `scenario` 中選用的閘道設定修補
- 流程情境使用可執行的頂層 `flow`，或
  Vitest 與 Playwright 情境使用 `scenario.execution.kind`／`scenario.execution.path`

支援 `flow` 的可重複使用執行階段介面維持通用且
跨領域。例如，YAML 情境可以結合傳輸端輔助工具與瀏覽器端輔助工具，
後者透過閘道 `browser.request` 介面驅動內嵌的控制介面，
而無須新增特殊案例執行器。

情境檔案應依產品能力分組，而非原始碼樹狀目錄。移動檔案時應保持情境 ID
穩定；使用 `docsRefs` 與
`codeRefs` 追蹤實作。

基準清單應保持足夠廣泛，以涵蓋：

- 私訊與頻道聊天
- 討論串行為
- 訊息動作生命週期
- 排程回呼
- 記憶回想
- 模型切換
- 子代理程式交接
- 儲存庫閱讀與文件閱讀
- 一項小型建置工作，例如 Lobster Invaders

## 提供者模擬執行通道

`qa suite` 有兩個本機提供者模擬執行通道：

- `mock-openai` 是能感知情境的 OpenClaw 模擬。
  它仍是由儲存庫支援的 QA 與同等性閘控所使用的預設確定性模擬執行通道。
- `aimock` 會啟動由 AIMock 支援的提供者伺服器，
  用於實驗性通訊協定、固定測試資料、錄製／重播及混沌測試涵蓋。
  它是附加功能，不會取代 `mock-openai` 情境分派器。

提供者執行通道實作位於 `extensions/qa-lab/src/providers/`。
每個提供者擁有自己的預設值、本機伺服器啟動方式、閘道模型設定、
驗證設定檔暫存需求，以及即時／模擬能力旗標。共用測試套件與
閘道程式碼會透過提供者登錄機制路由，而非依提供者名稱分支。

## 傳輸配接器

`qa-lab` 為 YAML QA 情境提供通用傳輸介面。`qa-channel` 是
預設的合成傳輸。`crabline` 會啟動本機提供者形狀的伺服器，
並對其執行 OpenClaw 的一般頻道外掛。`live` 保留供
真實提供者認證資訊與外部頻道使用。

在架構層級，其分工如下：

- `qa-lab` 負責通用情境執行、工作程式並行處理、產物
  寫入與報告。
- 傳輸配接器負責閘道設定、就緒狀態、傳入與傳出
  觀察、傳輸動作，以及正規化的傳輸狀態。
- `qa/scenarios/` 下的 YAML 情境檔案定義測試執行；
  `qa-lab` 提供執行這些情境的可重複使用執行階段介面。

### 新增頻道

將頻道新增至 YAML QA 系統，需要頻道實作以及一組用於測試
頻道合約的情境套件。若要提供冒煙測試 CI 涵蓋範圍，請新增相符的
Crabline 本機提供者伺服器，並透過 `crabline` 驅動程式公開。

當共用的 `qa-lab` 主機可以負責該流程時，
請勿新增頂層 QA 命令根節點。

`qa-lab` 負責共用主機機制：

- `openclaw qa` 命令根節點
- 測試套件啟動與拆卸
- 工作程式並行處理
- 產物寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容性別名

執行器外掛負責傳輸合約：

- 如何將 `openclaw qa <runner>` 掛載於共用 `qa` 根節點下
- 如何為該傳輸設定閘道
- 如何檢查就緒狀態
- 如何注入傳入事件
- 如何觀察傳出訊息
- 如何公開文字記錄與正規化的傳輸狀態
- 如何執行由傳輸支援的動作
- 如何處理傳輸專用的重設或清理

新頻道的最低採用門檻：

1. 讓 `qa-lab` 繼續作為共用 `qa` 根層級的擁有者。
2. 在共用 `qa-lab` 主機接合面上實作傳輸執行器。
3. 將傳輸特有的機制保留在執行器外掛或頻道
   測試框架內。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊一個
   互相競爭的根命令。執行器外掛應在
   `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的
   `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；延遲載入的命令列介面與
   執行器執行應保留在不同的進入點之後。選用的
   `adapterFactory` 可將傳輸公開給共用情境，而不變更
   該命令現有的情境目錄。
5. 在依主題分類的 `qa/scenarios/`
   目錄下撰寫或調整 YAML 情境。
6. 新情境應使用通用情境輔助函式。
7. 除非儲存庫正在進行有意的遷移，否則應維持現有相容性別名可用。

決策規則很嚴格：

- 若行為能在 `qa-lab` 中只表達一次，請將其放入 `qa-lab`。
- 若行為依賴單一頻道傳輸，請將其保留在該執行器
  外掛或外掛測試框架中。
- 若某個情境需要可供多個頻道使用的新功能，
  請新增通用輔助函式，而不是在 `suite.ts` 中新增頻道特有的分支。
- 若某個行為僅對單一傳輸有意義，請讓該情境
  保持傳輸特有，並在情境契約中明確指出這一點。

### 情境輔助函式名稱

新情境偏好的通用輔助函式：

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
`formatConversationTranscript`、`resetBus`，但撰寫新情境時
應使用通用名稱。這些別名是為了避免一次性全面
遷移而存在，並非未來採用的模式。

## 報告

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 通訊協定報告。
報告應回答：

- 哪些項目正常運作
- 哪些項目失敗
- 哪些項目仍受阻
- 哪些後續情境值得新增

若要取得可用情境的清單（適合用於評估後續工作規模
或串接新傳輸），請執行 `pnpm openclaw qa coverage`（加入 `--json`
可取得機器可讀的輸出）。選擇針對已變更行為或檔案路徑的
聚焦驗證時，請執行 `pnpm openclaw qa coverage --match <query>`。比對
報告會搜尋情境中繼資料、文件參照、程式碼參照、涵蓋範圍 ID、
外掛及提供者需求，接著印出相符的 `qa suite
--scenario ...` 目標。

每次 `qa suite` 執行都會為所選情境集寫入頂層的
`qa-evidence.json`、`qa-suite-summary.json` 和 `qa-suite-report.md`
成品。宣告 `execution.kind: vitest` 或
`execution.kind: playwright` 的情境會執行相符的測試路徑，並另外寫入
各情境的記錄。宣告 `execution.kind: script` 的情境會透過
`node --import tsx` 執行位於 `execution.path` 的證據產生器（其中
`${outputDir}` 和 `${scenarioId}` 會在 `execution.args` 中展開）；該
產生器會寫入自己的 `qa-evidence.json`，其中的項目會匯入
套件輸出，而其成品路徑會相對於該
產生器的 `qa-evidence.json` 解析。透過 `qa run
--qa-profile` 到達 `qa suite` 時，同一份 `qa-evidence.json` 也會包含所選分類法類別的設定檔
評分卡摘要。

將涵蓋範圍輸出視為探索輔助，而不是閘門的替代品；所選
情境仍需針對受測行為使用正確的提供者模式、即時傳輸、
Multipass、Testbox 或發布流程。如需
評分卡背景資訊，請參閱[成熟度評分卡](/zh-TW/maturity/scorecard)。

若要進行角色與風格檢查，請對多個即時
模型參照執行相同情境，並撰寫經評審的 Markdown 報告：

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

此命令執行本機 QA 閘道子程序，而不是 Docker。角色
評估情境應透過 `SOUL.md` 設定角色設定，接著執行一般
使用者互動，例如聊天、工作區協助和小型檔案工作。不應告知候選
模型它正在接受評估。此命令會保留
每份完整對話記錄並記錄基本執行統計資料，接著要求評審模型在
快速模式下，於支援時使用 `xhigh` 推理，依照
自然程度、氛圍與幽默感為各次執行排名。比較
提供者時請使用 `--blind-judge-models`：評審提示仍會取得每份對話記錄與執行狀態，但
候選參照會替換為 `candidate-01` 等中性標籤；
報告會在剖析後將排名對應回真正的參照。

候選執行預設使用 `high` 思考模式，GPT-5.6 Luna 使用 `medium`，
而支援此模式的舊版 OpenAI 評估參照使用 `xhigh`。若要覆寫特定
候選模型，請在行內使用 `--model provider/model,thinking=<level>`；行內
選項也支援 `fast`、`no-fast` 和 `fast=<bool>`。`--thinking
<level>` 仍可設定全域後備值，舊版 `--model-thinking
<provider/model=level>` 形式則為了相容性而保留。OpenAI 候選
參照預設使用快速模式，讓提供者在支援時採用優先處理。
只有在想要強制所有候選模型開啟快速模式時，才傳入 `--fast`。
報告會記錄候選模型與評審模型的持續時間以供基準分析，但評審提示會明確要求
不要依速度排名。候選模型與評審模型執行的預設並行數皆為 16。
當提供者限制或本機閘道壓力導致執行產生過多雜訊時，請降低
`--concurrency` 或 `--judge-concurrency`。

未傳入候選 `--model` 時，角色評估預設使用
`openai/gpt-5.6-luna`、`openai/gpt-5.2`、`openai/gpt-5`、
`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。未傳入
`--judge-model` 時，評審模型預設為
`openai/gpt-5.6-sol,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-8,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [成熟度評分卡](/zh-TW/maturity/scorecard)
- [個人代理基準測試套件](/zh-TW/concepts/personal-agent-benchmark-pack)
- [QA 頻道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
