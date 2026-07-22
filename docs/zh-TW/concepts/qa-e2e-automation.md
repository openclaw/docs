---
doc-schema-version: 1
read_when:
    - 瞭解 QA 堆疊如何協同運作
    - 擴充 qa-lab、qa-channel 或傳輸介面卡
    - 新增由儲存庫支援的 QA 情境
    - 圍繞閘道儀表板建置更高擬真度的 QA 自動化
summary: QA 技術堆疊概覽：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸介面卡與報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-07-22T10:31:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 91c34a50e6197195d57228d92b19caff1785ceaa5d82d7c88a1ec0ed76abd635
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊以貼近實際、符合頻道形態的方式測試 OpenClaw，這是單元測試無法做到的。

組成部分：

- `extensions/qa-channel`：合成訊息頻道，涵蓋私訊、頻道、討論串、回應、編輯及刪除介面。
- `extensions/qa-lab`：偵錯工具 UI、QA 匯流排、情境設定檔及即時傳輸配接器，用於觀察逐字記錄、注入傳入訊息，以及匯出 Markdown 報告。
- `qa/`：由儲存庫支援的初始資產，供啟動任務及基準 QA 情境使用。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器螢幕截圖、VM 狀態及 PR 證據的錯誤，進行修正前後的即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多流程具有 `pnpm qa:*` 指令碼別名；兩種形式皆可使用。

| 命令                                                | 用途                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不使用 `--qa-profile` 的內建 QA 自我檢查；由分類法支援的成熟度設定檔執行器，可搭配 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all`。                                                                                                  |
| `qa suite`                                          | 對 QA 閘道執行由儲存庫支援的情境。`--runner multipass` 使用拋棄式 Linux VM，而非主機。                                                                                                                                         |
| `qa coverage`                                       | 輸出 YAML 情境涵蓋範圍清冊（`--json` 用於機器輸出；`--match <query>` 用於尋找與已變更行為相關的情境；`--tools` 用於執行階段工具固定資料的涵蓋範圍）。                                                                                  |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案以執行模型軸向同等性閘門，或使用 `--runtime-axis --token-efficiency` 寫入 Codex 與 OpenClaw 的執行階段同等性及權杖效率報告。                                                                          |
| `qa confidence-report`                              | 根據資訊清單對 QA 證明成品進行分類，產生未知項目為零的信心報告。                                                                                                                                                                               |
| `qa confidence-self-test`                           | 寫入已植入的負向對照金絲雀，證明信心閘門能偵測漂移。                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | 透過執行階段同等性重播測試框架，重播精選的 JSONL 逐字記錄。                                                                                                                                                                                         |
| `qa character-eval`                                 | 跨多個即時模型執行角色 QA 情境，並產生經評判的報告。請參閱[報告](#reporting)。                                                                                                                                                        |
| `qa manual`                                         | 對所選的供應商／模型執行路徑執行一次性提示詞。                                                                                                                                                                                                      |
| `qa ui`                                             | 啟動 QA 偵錯工具 UI 及本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | 為 QA 儀表板與閘道執行路徑寫入 docker-compose 鷹架。                                                                                                                                                                                                |
| `qa up`                                             | 建置 QA 網站、啟動以 Docker 為基礎的堆疊並輸出 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                              |
| `qa aimock`                                         | 僅啟動 AIMock 供應商伺服器。                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | 僅啟動可感知情境的 `mock-openai` 供應商伺服器。                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用的 Convex 認證資訊集區。                                                                                                                                                                                                                           |
| `qa discord`                                        | 對真實的私人 Discord 公會頻道執行即時傳輸路徑。                                                                                                                                                                                                   |
| `qa matrix`                                         | 對拋棄式 Tuwunel 主伺服器執行 QA Lab Matrix 設定檔。請參閱 [Matrix 冒煙測試路徑](#matrix-smoke-lanes)。                                                                                                                                                      |
| `qa slack`                                          | 對真實的私人 Slack 頻道執行即時傳輸路徑。                                                                                                                                                                                                           |
| `qa telegram`                                       | 對真實的私人 Telegram 群組執行即時傳輸路徑。                                                                                                                                                                                                          |
| `qa whatsapp`                                       | 對真實的 WhatsApp Web 帳號執行即時傳輸路徑。                                                                                                                                                                                                             |
| `qa mantis`                                         | 即時傳輸錯誤的修正前後驗證執行器，包含 Discord 狀態回應證據、Crabbox 桌面／瀏覽器冒煙測試及 VNC 中的 Slack 冒煙測試。請參閱 [Mantis](/zh-TW/concepts/mantis) 及 [Mantis Slack 桌面操作手冊](/zh-TW/concepts/mantis-slack-desktop-runbook)。 |

### 由設定檔支援的 `qa run`

由設定檔支援的 `qa run` 會從 `taxonomy.yaml` 讀取成員資格，接著透過 `qa suite` 分派解析後的情境。`--surface` 與 `--category` 會篩選所選設定檔，而非定義獨立的執行路徑。產生的 `qa-evidence.json` 包含設定檔評分卡摘要，其中列出所選類別的計數及缺少的涵蓋範圍 ID；各個證據項目仍是測試、涵蓋角色及結果的真實資料來源。分類法功能涵蓋範圍 ID 是明確的證明目標，而非別名：主要情境涵蓋範圍會滿足相符的 ID，次要涵蓋範圍則僅供參考。每個涵蓋範圍 ID 都必須完全符合 `taxonomy-surface.feature`，並使用 `taxonomy.yaml` 中的簡短介面 ID。情境中獨立的 `surface` 欄位是執行／報告標籤（例如 `channel` 或 `runtime-tool`）；它不定義分類法的歸屬權。

精簡證據會省略每個項目的 `execution`，並設定 `evidenceMode: "slim"`；`smoke-ci` 預設為精簡模式，而 `--evidence-mode full` 會還原完整項目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channels.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 搭配模擬模型供應商及 Crabline 本機供應商伺服器，以取得確定性的設定檔證明。使用 `release` 對即時頻道執行 Stable/LTS 證明。僅在明確執行完整分類法證據時使用 `all`；它會選取每個使用中的成熟度類別，並可透過 `QA
Profile Evidence` GitHub Actions 工作流程搭配 `qa_profile=all` 進行分派。當命令也需要 OpenClaw 根設定檔時，請將根設定檔放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作人員流程

目前的 QA 操作人員流程是雙窗格 QA 網站：

- 左側：含代理程式的閘道儀表板（Control UI）。
- 右側：QA Lab，顯示類似 Slack 的逐字記錄及情境計畫。

使用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA 網站、啟動以 Docker 為基礎的閘道執行路徑，並公開 QA Lab 頁面，讓操作人員或自動化迴圈可向代理程式指派 QA 任務、觀察真實頻道行為，以及記錄哪些項目成功、失敗或持續受阻。

若要加快 QA Lab UI 的反覆開發，而不必每次都重新建置 Docker 映像，請使用以繫結掛載方式提供的 QA Lab 套件啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務維持使用預先建置的映像，並將 `extensions/qa-lab/web/dist` 繫結掛載至 `qa-lab` 容器。`qa:lab:watch` 會在發生變更時重新建置該套件，而瀏覽器會在 QA Lab 資產雜湊變更時自動重新載入。

### 可觀測性冒煙測試

<Note>
可觀測性 QA 僅限於原始碼簽出環境。npm tarball 會刻意省略 QA Lab（及 `qa-channel`），因此套件 Docker 發行執行路徑不會執行 `qa` 命令。變更診斷檢測工具時，請從已建置的原始碼簽出環境執行這些命令。
</Note>

| 別名                                   | 執行內容                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 本機 OpenTelemetry 接收器，以及啟用 `diagnostics-otel` 的 `otel-trace-smoke` 情境。                                      |
| `pnpm qa:otel:collector-smoke`          | 在實際 OpenTelemetry Collector Docker 容器後方執行的相同測試通道。變更端點配線或 Collector/OTLP 相容性時使用。 |
| `pnpm qa:prometheus:smoke`              | 啟用 `diagnostics-prometheus` 的 `docker-prometheus-smoke` 情境。                                                           |
| `pnpm qa:observability:smoke`           | 先執行 `qa:otel:smoke`，再執行 `qa:prometheus:smoke`。                                                                                      |
| `pnpm qa:observability:collector-smoke` | 先執行 `qa:otel:collector-smoke`，再執行 `qa:prometheus:smoke`。                                                                            |

`qa:otel:smoke` 會啟動本機 OTLP/HTTP 接收器、執行最精簡的 QA-channel
代理程式回合，然後確認追蹤、指標與日誌均已匯出。它會解碼
匯出的 protobuf 追蹤跨度，並檢查發布關鍵結構：
`openclaw.run`、`openclaw.harness.run`、使用最新 GenAI 語意慣例的
模型呼叫跨度、`openclaw.context.assembled` 與 `openclaw.message.delivery`
都必須存在。此煙霧測試會強制使用
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此模型呼叫
跨度必須使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名稱；模型
呼叫在成功回合中不得匯出 `StreamAbandoned`；原始診斷
ID 與 `openclaw.content.*` 屬性不得出現在追蹤中。此情境的
提示要求模型以固定標記回覆，並隱藏固定的
秘密字串；原始 OTLP 承載內容不得包含兩者，也不得包含從情境 ID
衍生的 QA 工作階段金鑰。它會將 `otel-smoke-summary.json`
寫入 QA 套件成品旁。

`qa:prometheus:smoke` 會驗證未經驗證的擷取遭到拒絕，然後
檢查經過驗證的擷取包含發布關鍵指標系列，且不包含
提示內容、回應內容、原始診斷識別碼、驗證
權杖或本機路徑。

### Matrix 煙霧測試通道

若要執行不需要模型供應商認證資訊、使用真實傳輸的 Matrix 煙霧測試通道，
請搭配確定性模擬 OpenAI 供應商執行發布設定檔：

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

若要執行即時前沿供應商通道，請明確提供 OpenAI 相容的認證資訊：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

單獨執行 `pnpm openclaw qa matrix` 會執行完整的 `all` 設定檔，並在
情境失敗後繼續。使用 `--fail-fast` 可縮短回饋週期，或重複指定
`--scenario <id>` 以選取個別情境；明確指定的情境 ID 優先於
`--profile`。

| 設定檔      | 情境 | 用途                                                                                                                                  |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | 完整目錄（預設）。                                                                                                              |
| `release`    | 2         | 發布關鍵的頻道基準與即時允許清單重新載入。                                                                             |
| `fast`       | 12        | 聚焦於討論串、表情回應、核准、政策、機器人門控與加密回覆的涵蓋範圍。                                               |
| `transport`  | 50        | 討論串、私訊/聊天室路由、自動加入、核准、表情回應、重新啟動、提及/允許清單政策、編輯與多參與者排序。         |
| `media`      | 7         | 圖片、產生的圖片、語音、附件、不支援的媒體與加密媒體涵蓋範圍。                                              |
| `e2ee-smoke` | 8         | 最基本的加密回覆、討論串、啟動、復原、重新啟動、遮蔽與失敗涵蓋範圍。                                       |
| `e2ee-deep`  | 18        | 狀態遺失、備份、金鑰復原、裝置衛生與 SAS/QR/私訊驗證。                                                            |
| `e2ee-cli`   | 9         | 透過測試工具執行 `openclaw matrix encryption setup`、復原金鑰、多帳號、閘道來回與自我驗證命令。 |

設定檔成員資格與頻道需求會與宣告式 Matrix
情境一同放在 `qa/scenarios/channels/` 下。執行時會選擇頻道驅動程式。
其即時實作位於
`extensions/qa-lab/src/live-transports/matrix/scenarios/` 下。

配接器會在 Docker 中佈建一次性的 Tuwunel 家伺服器（預設
映像檔為 `ghcr.io/matrix-construct/tuwunel:v1.5.1`、伺服器名稱為 `matrix-qa.test`、
連接埠為 `28008`），註冊暫時的驅動程式、受測系統與觀察者使用者、植入
必要的聊天室，並記錄經過遮蔽的要求/回應邊界。接著，它會在限定於該傳輸的
子 QA 閘道內執行真正的 Matrix 外掛
（不使用 `qa-channel`），然後拆除環境。

常用選項：

| 旗標                     | 預設值           | 用途                                                                              |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | 選取上述其中一個設定檔。                                                    |
| `--scenario <id>`        | -                 | 選取一個情境；可重複指定。                                                     |
| `--fail-fast`            | 關閉               | 在第一個失敗的檢查或情境後停止。                                       |
| `--allow-failures`       | 關閉               | 寫入成品，但不因情境失敗而傳回失敗結束代碼。         |
| `--provider-mode <mode>` | `live-frontier`   | 使用 `mock-openai` 進行確定性分派，或使用 `live-frontier` 連接即時供應商。 |
| `--model <ref>`          | 供應商預設值  | 設定主要的 `provider/model` 參照。                                          |
| `--alt-model <ref>`      | 供應商預設值  | 設定會切換模型的情境所使用的替代模型。                        |
| `--fast`                 | 關閉               | 在支援的情況下啟用供應商快速模式。                                           |
| `--output-dir <path>`    | 自動產生         | 選擇報告目錄；相對路徑會以 `--repo-root` 為基準解析。           |
| `--repo-root <path>`     | 目前目錄 | 從中性的工作目錄執行。                                                |
| `--sut-account <id>`     | `sut`             | 在子閘道設定中選取 Matrix 帳號 ID。                            |

Matrix QA 不會租用共用的 Matrix 認證資訊：配接器會在本機建立
一次性使用者，因此不接受 `--credential-source` 或
`--credential-role`。可使用
`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆寫家伺服器映像檔；使用
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` 調整否定式無回覆斷言（預設為 `8000`，上限為目前
情境逾時時間）。單次命令通常會在
成品清空寫入後強制乾淨結束，因為 Matrix 加密原生控制代碼的存續時間可能超過清理程序；只有在需要
命令改為傳回的直接測試工具中，才設定
`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`。

每次執行都會在所選輸出
目錄下寫入一般的 QA Lab 成品：`qa-suite-report.md`、`qa-suite-summary.json` 與
`qa-evidence.json`。如果清理失敗，請執行印出的
`docker compose ... down --remove-orphans` 復原命令。在速度較慢的執行器上，
請增加無回覆時間窗；在快速 CI 上，較小的時間窗可以縮短否定式
斷言所需時間。

這些情境涵蓋單元測試無法進行端對端證明的傳輸行為：
提及門控、允許機器人政策、允許清單、最上層與討論串
回覆、私訊路由、表情回應處理、輸入編輯抑制、重新啟動
重播去重、家伺服器中斷復原、核准中繼資料傳遞、
媒體處理，以及 Matrix E2EE 啟動/復原/驗證流程。
E2EE 命令列介面設定檔也會透過相同的一次性家伺服器驅動 `openclaw matrix encryption setup` 與
驗證命令，然後才檢查
閘道回覆。

`matrix-room-block-streaming` 與 `subagent-thread-spawn` 仍可透過
明確選取 `--scenario` 來使用，但不包含在預設的 `all` 設定檔內。

CI 會在
`.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令介面。排程與發布執行會
執行發布情境。手動 `matrix_profile=all` 分派會展開執行
`transport`、`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 設定檔；
聚焦式分派則會在單一工作中選取 `fast`、`release` 或 `transport`。

### Discord Mantis 情境

Discord 也提供僅限 Mantis、選擇性啟用的錯誤重現情境。使用
`--scenario discord-status-reactions-tool-only` 可取得明確的狀態
表情回應時間軸，或使用 `--scenario discord-thread-reply-filepath-attachment`
建立真正的 Discord 討論串，並驗證 `message.thread-reply`
會保留 `filePath` 附件。這些情境不包含在預設的
即時 Discord 測試通道內，因為它們是前後對照重現探針，而非
廣泛的煙霧測試涵蓋範圍。當 QA
環境中設定了 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 時，討論串附件 Mantis 工作流程也能加入
已登入 Discord Web 的見證影片。該檢視器設定檔僅用於視覺擷取；
通過/失敗的判定仍由 Discord REST 預期結果驗證器得出。

若要執行其他使用真實傳輸的煙霧測試通道：

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

它們以預先存在的真實頻道為目標，並使用兩個機器人或帳號（驅動程式 +
受測系統）。這四種傳輸所需的環境變數、情境清單、輸出成品與 Convex
認證資訊集區，記載於下方的
[Discord、Slack、Telegram 與 WhatsApp QA 參考資料](#discord-slack-telegram-and-whatsapp-qa-reference)。

### Mantis Slack 桌面與視覺任務執行器

若要執行具有 VNC 救援功能的完整 Slack 桌面 VM，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用一台 Crabbox 桌面／瀏覽器機器，在 VM 內執行 Slack 即時
通道、在 VNC 瀏覽器中開啟 Slack Web、擷取桌面畫面，
並將 `slack-qa/`、`slack-desktop-smoke.png`，以及
`slack-desktop-smoke.mp4`（可進行影片擷取時）複製回
Mantis 成品目錄。Crabbox 桌面／瀏覽器租用會預先提供擷取
工具與瀏覽器／原生建置輔助套件，因此情境
應只在較舊的租用環境中安裝備援項目。Mantis 會在 `mantis-slack-desktop-smoke-report.md` 中回報總計與
各階段耗時，讓緩慢的執行顯示
時間究竟花在租用環境暖機、取得認證資訊、遠端設定，還是
複製成品上。透過 VNC 手動登入 Slack Web
後，請重複使用 `--lease-id <cbx_...>`；重複使用的租用環境也會讓 Crabbox 的 pnpm 儲存區快取
保持暖機狀態。預設的 `--hydrate-mode source` 會從原始碼簽出版本進行驗證，並
在 VM 內執行安裝／建置。只有在
重複使用的遠端工作區已經有 `node_modules` 和已建置的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；
該模式會略過耗時的安裝／建置步驟，並在
工作區尚未就緒時採取失敗關閉。使用 `--gateway-setup` 時，Mantis 會在 VM 內的連接埠 `38973` 上保持一個持續運作的
OpenClaw Slack 閘道；若未使用，該
命令會執行一般的機器人對機器人 Slack QA 通道，並在擷取成品
後結束。

若要透過桌面證據驗證原生 Slack 核准介面，請執行 Mantis
核准檢查點模式：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

此模式與 `--gateway-setup` 互斥。它會執行 Slack
核准情境、拒絕非核准情境 ID、在每個待處理
及已解決的核准狀態暫停、將觀察到的 Slack API 訊息呈現至
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`，然後在任何檢查點、
訊息證據、確認回覆或呈現的螢幕截圖缺失或
為空時判定失敗。冷啟動的 CI 租用環境仍可能在
`slack-desktop-smoke.png` 中顯示 Slack 登入畫面；核准檢查點影像才是此通道的視覺
證據。

預設檢查點執行會保留兩個標準 Slack 核准情境。
若要擷取任一選擇性 Codex 核准路徑，請使用
`--scenario slack-codex-approval-exec-native` 或
`--scenario slack-codex-approval-plugin-native` 明確選取；Mantis 兩者皆接受，並會產生
相同的待處理／已解決螢幕截圖配對。執行器會針對每個選取的 Codex 路徑擴增其檢查點
與遠端命令期限，讓完整的
核准、代理程式完成及已解決更新序列得以完成。

操作人員檢查清單、GitHub 工作流程分派命令、證據留言
契約、hydrate 模式決策表、耗時解讀及失敗
處理步驟，請參閱
[Mantis Slack 桌面執行手冊](/zh-TW/concepts/mantis-slack-desktop-runbook)。

若要執行代理程式／電腦視覺形式的桌面任務，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` 會租用或重複使用一台 Crabbox 桌面／瀏覽器機器、啟動
`crabbox record --while`、透過巢狀
`visual-driver` 操控可見的瀏覽器、擷取 `visual-task.png`、在選取 `--vision-mode image-describe` 時針對螢幕截圖執行 `openclaw infer image
describe`，
並寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和
`mantis-visual-task-report.md`。設定 `--expect-text` 時，視覺
提示會要求結構化 JSON 判定結果（`visible`、`evidence`、`reason`），
而且只有模型回報 `visible: true`，並提供引用預期文字的證據時
才會通過；僅引述
目標文字的 `visible: false` 回應仍無法通過判定。若要進行
不呼叫影像理解供應商、但能驗證桌面、瀏覽器、螢幕截圖及影片
管線的無模型煙霧測試，請使用 `--vision-mode metadata`。錄影是
`visual-task` 的必要成品；若 Crabbox 未錄製任何非空的
`visual-task.mp4`，即使視覺驅動程式已通過，任務仍會失敗。發生
失敗時，Mantis 會保留租用環境以供 VNC 使用，除非任務先前已通過
且未設定 `--keep-lease`。

### 認證資訊集區健康檢查

使用集區中的即時認證資訊前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker 環境變數（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`）、驗證端點設定、僅回報
`OPENCLAW_QA_CONVEX_SECRET_CI` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 的已設定／缺失狀態，並在存在維護者密鑰時
驗證管理／清單可達性。

## 標準情境涵蓋範圍

根 `taxonomy.yaml` 會定義語意涵蓋範圍 ID。`qa/scenarios/` 下的情境 YAML 檔案
會將每個情境對應至這些 ID，並擁有執行
中繼資料：`channel` 是唯一的頻道需求，而 `profiles` 則宣告
具名執行成員資格。頻道驅動程式是一種可替換的執行層級
實作選擇。TypeScript
執行器會查詢該目錄；不會維護平行情境或涵蓋範圍
清冊。

靜態 `qa coverage` 輸出會回報分類體系到情境的對應關係。實際
證明來自 `qa-evidence.json`，其中會記錄已執行的情境、
涵蓋範圍 ID、頻道、實際使用的驅動程式及結果。頻道與驅動程式是
報告維度，而不是額外的涵蓋範圍 ID 詞彙或情境
適用性軸線。

若要執行不將 Docker 帶入 QA 路徑的一次性 Linux VM 通道，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass 客體、安裝相依套件、在客體內建置 OpenClaw、
執行 `qa suite`，然後將一般 QA 報告和
摘要複製回主機上的 `.artifacts/qa-e2e/...`。它會重複使用與主機上 `qa suite` 相同的
情境選取行為。

主機與 Multipass 套件執行預設會透過隔離的閘道工作程序
平行執行多個所選情境。`qa-channel` 預設
並行數為 4，上限為所選情境數量。使用 `--concurrency
<count>` 調整工作程序數量，或使用 `--concurrency 1` 進行循序執行。
使用 `--pack personal-agent` 執行個人助理基準套件（10 個
情境）。套件選擇器可與重複的 `--scenario` 旗標疊加：
先執行明確指定的情境，接著依套件順序執行套件情境，並
移除重複項目。當自訂 QA 執行器已經提供 OpenTelemetry 收集器設定時，使用 `--pack observability` 同時選取
`otel-trace-smoke` 和 `docker-prometheus-smoke` 情境。

任何情境失敗時，該命令會以非零狀態結束。若要在不產生失敗結束碼的情況下取得成品，
請使用 `--allow-failures`。

即時執行會轉送適合客體使用的支援 QA 驗證輸入：
環境變數形式的供應商金鑰、QA 即時供應商設定路徑，以及
存在時的 `CODEX_HOME`。請將 `--output-dir` 保留在儲存庫根目錄下，讓
客體能透過掛載的工作區寫回。

## Discord、Slack、Telegram 與 WhatsApp QA 參考

Matrix 轉接器使用上述以 Docker 為基礎的一次性通道。
Discord、Slack、Telegram 和 WhatsApp 會針對預先存在的實際
傳輸執行，因此其參考資訊列於此處。

### 共用命令列介面旗標

這些通道會透過
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並
接受相同的旗標：

| 旗標                                  | 預設值                                            | 說明                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 僅執行此情境。可重複指定。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 寫入報告、摘要、證據、傳輸專用成品及輸出記錄的位置。相對路徑會以 `--repo-root` 為基準解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 從中立的目前工作目錄叫用時所使用的儲存庫根目錄。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA 閘道設定中的臨時帳號 ID。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`、`aimock` 或 `live-frontier`。                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | 供應商預設值                                   | 主要／替代模型參照。                                                                                                                   |
| `--fast`                              | 關閉                                                | 支援時使用供應商快速模式。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | 請參閱 [Convex 認證資訊集區](#convex-credential-pool)。                                                                                          |
| `--credential-role <maintainer\|ci>`  | 在 CI 中為 `ci`，否則為 `maintainer`                 | 使用 `--credential-source convex` 時採用的角色。                                                                                                    |
| `--allow-failures`                    | 關閉                                                | 情境失敗時寫入成品，但不傳回失敗結束碼。                                                                      |

任何情境失敗時，每個通道都會以非零狀態結束。`--allow-failures` 會寫入
成品而不設定失敗結束碼。Telegram 也接受
`--list-scenarios`，用於列印可用的情境 ID 並結束；其他通道
不提供該旗標。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個實際的私人 Telegram 群組，其中包含兩個不同的機器人（驅動程式 +
受測系統）。受測系統機器人必須擁有 Telegram 使用者名稱；當兩個機器人都在
`@BotFather` 中啟用 **Bot-to-Bot Communication Mode** 時，機器人對機器人觀察的
效果最佳。

使用 `--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 數字聊天 ID（字串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

`release` 設定檔會選取維護中的 Telegram YAML 情境；`all`
會加入選擇性的工作階段、用量、回覆鏈及串流壓力檢查。明確指定的
`--scenario` 值會覆寫該設定檔。

- `channel-canary`
- `channel-mention-gating`
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

`release` 設定檔一律涵蓋金絲雀測試、提及閘控、原生命令
回覆、命令定址，以及機器人對機器人的群組回覆。`mock-openai`
也包含確定性的長篇最終預覽檢查。
`telegram-current-session-status-tool` 和
`telegram-tool-only-usage-footer` 仍為選用：前者只有在金絲雀測試後直接接續執行時
才穩定，後者則是在真實 Telegram 上，針對僅含工具之回覆的
`/usage` 頁尾進行證明。使用 `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` 輸出目前
預設／選用項目的劃分及迴歸參照。每個 Telegram 即時轉接器情境皆使用
`--profile all`。

輸出成品：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - 即時傳輸檢查的證據項目，
  包含設定檔、涵蓋範圍、提供者、頻道、成品、結果及 RTT
  欄位。

套件 Telegram 執行使用相同的 Telegram 認證資訊合約。重複 RTT
測量是一般套件 Telegram 即時執行途徑的一部分；RTT
分布會針對所選的 RTT 檢查，彙整至 `qa-evidence.json` 的
`result.timing` 下。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 時，套件即時包裝程式會租用
`kind: "telegram"` 認證資訊，將租用的群組／驅動程式／SUT
機器人環境變數匯出至已安裝套件的執行環境、對租約傳送心跳偵測，並在
關閉時釋放租約。套件包裝程式預設執行 20 次
`channel-canary` RTT 檢查、使用 30s RTT 逾時，且在選用 Convex
並處於 CI 外時使用 Convex 角色 `maintainer`。覆寫
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`，即可調整 RTT 測量，無須
建立獨立的 RTT 命令或 Telegram 專用摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

以一個真實的私人 Discord 伺服器頻道及兩個機器人為目標：由測試框架
控制的驅動機器人，以及由子 OpenClaw 閘道透過隨附的 Discord 外掛
啟動的 SUT 機器人。驗證頻道提及處理、SUT 機器人已向 Discord
註冊原生 `/help` 命令，以及選用的 Mantis 證據情境。

使用 `--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須符合 Discord
  傳回的 SUT 機器人使用者 ID（否則該執行途徑會立即失敗）。

選用：

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 會為
  `discord-voice-autojoin` 選取語音／舞台頻道；若未設定，此情境會選取
  SUT 機器人可見的第一個語音／舞台頻道。

Discord YAML 模組情境（`qa/scenarios/channels/discord-*.yaml`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 選用的語音情境。獨立執行、啟用
  `channels.discord.voice.autoJoin`，並驗證 SUT 機器人目前的
  Discord 語音狀態為目標語音／舞台頻道。Convex Discord
  認證資訊可包含選用的 `voiceChannelId`；否則執行器
  轉接器會找出伺服器中第一個可見的語音／舞台頻道。
- `discord-status-reactions-tool-only` - 選用的 Mantis 情境。此情境
  會將 SUT 切換為一律啟用、僅含工具的伺服器回覆，並使用
  `messages.statusReactions.enabled=true`，因此需獨立執行；接著擷取 REST
  回應時間軸及 HTML/PNG 視覺成品。Mantis 前／後
  報告也會將情境提供的 MP4 成品保留為 `baseline.mp4`
  和 `candidate.mp4`。
- `discord-thread-reply-filepath-attachment` - 選用的 Mantis 情境；請參閱
  [Discord Mantis 情境](#discord-mantis-scenarios)。

明確執行 Discord 語音自動加入情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

明確執行 Mantis 狀態回應情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

輸出成品：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `discord-qa-reaction-timelines.json` 和
  `discord-status-reactions-tool-only-timeline.png`，於狀態回應
  情境執行時產生。

### Slack QA

```bash
pnpm openclaw qa slack
```

以一個真實的私人 Slack 頻道及兩個不同的機器人為目標：由測試框架
控制的驅動機器人，以及由子 OpenClaw 閘道透過隨附的 Slack 外掛
啟動的 SUT 機器人。

使用 `--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 會啟用 Mantis 的視覺核准
  檢查點。轉接器會寫入 `<scenario>.pending.json` 和
  `<scenario>.resolved.json`，接著等待相符的 `.ack.json` 檔案。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 會覆寫檢查點
  確認逾時。預設值為 `120000`。

透過 Slack 即時轉接器公開的標準 YAML 情境：

- `thread-follow-up`
- `thread-isolation`

Slack YAML 模組情境（`qa/scenarios/channels/slack-*.yaml`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - 選用的真實 Slack 探查，確認
  設定為停用的頻道會發出結構化警告且不回覆。
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`、`slack-progress-commentary-false`、
  `slack-progress-commentary-omitted` 和
  `slack-progress-commentary-verbose-dedupe` - 選用的真實 Slack 探查，用於
  獨立的說明／工具進度控制、省略鍵時的舊版預設行為，以及啟用可持久化
  詳細進度時的單次傳遞行為。
- `slack-reaction-glyph-native` - 選用的即時訊息工具回應情境。
  指示代理程式傳入完全一致的 `✅` 圖示，並確認 Slack
  已在目標訊息上為 SUT 機器人儲存 `white_check_mark`。
- `slack-chart-presentation-native` - 選用的可攜式圖表情境，
  驗證原生 `data_visualization` 區塊及完全一致的無障礙文字。
- `slack-table-presentation-native` - 選用的可攜式表格情境，
  驗證原生 `data_table` 區塊、完全一致的資料列及無障礙文字。
- `slack-table-invalid-blocks-fallback` - 選用的直接傳輸情境，
  透過正式環境的 Slack 傳送路徑，傳送一個結構上可讀但超出限制的原始
  表格，其中包含 101 個資料列及其標題列；證明 Slack 本身會傳回
  `invalid_blocks`，並驗證已儲存且停用格式的後援內容完整，且不含
  原生資料區塊。情境詳細資料僅保留安全的錯誤代碼、數量及
  布林證據。
- `slack-approval-exec-native` - 選用的原生 Slack exec 核准情境。
  透過閘道請求 exec 核准、驗證 Slack 訊息具有原生核准按鈕、完成核准，
  並驗證核准完成後的 Slack 更新。
- `slack-approval-plugin-native` - 選用的原生 Slack 外掛核准
  情境。同時啟用 exec 與外掛核准轉送，避免外掛事件遭 exec
  核准路由抑制，接著驗證相同的待處理／已完成原生 Slack UI 路徑。
- `slack-codex-approval-exec-native` - 選用的 Codex Guardian 命令核准
  情境。以 Guardian 模式啟用 Codex 外掛，將源自 Slack 的閘道
  代理程式回合路由至 Codex 應用程式伺服器測試框架，等待
  `openclaw-codex-app-server` 的原生 Slack 外掛核准提示、完成核准，並驗證 Codex
  回合以預期的命令輸出及助理標記結束。
- `slack-codex-approval-plugin-native` - 選用的 Codex Guardian 檔案核准
  情境。使用工作區外部的 `apply_patch` 指示，使 Codex 發出
  應用程式伺服器檔案變更核准路由，接著驗證相同的原生 Slack
  待處理／已完成核准路徑、最終助理標記，以及清理前完全一致的檔案
  內容。

Codex 核准情境需要 `openai/*` 或 `codex/*` `--model`、
一般即時模型認證資訊，以及 Codex 外掛接受的 Codex 驗證或 API 金鑰驗證。
情境詳細資料包含 Codex 應用程式伺服器方法、所選的 Codex 模型
鍵、最終 Codex 回合狀態及操作標記驗證，並附上經遮蔽的 Slack
核准中繼資料。

輸出成品：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `approval-checkpoints/` - 僅在 Mantis 設定
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 時產生；包含檢查點 JSON、
  確認 JSON，以及待處理／已完成的螢幕截圖。

#### 設定 Slack 工作區

此執行途徑需要同一個工作區中的兩個不同 Slack 應用程式，以及一個兩個
機器人皆為成員的頻道：

- `channelId` - 兩個機器人皆已受邀加入之頻道的
  `Cxxxxxxxxxx` ID。請使用專用頻道；此執行途徑每次執行都會發文。
- `driverBotToken` - **Driver** 應用程式的機器人權杖
  （`xoxb-...`）。
- `sutBotToken` - **SUT** 應用程式的機器人權杖
  （`xoxb-...`）；該程式必須是與驅動程式分開的 Slack
  應用程式，才能有不同的機器人使用者 ID。
- `sutAppToken` - SUT 應用程式具備
  `connections:write` 的應用程式層級權杖（`xapp-...`），供
  Socket Mode 使用，使 SUT 應用程式能接收事件。

相較於重複使用正式環境工作區，建議使用專供 QA 的 Slack
工作區。

下方 SUT 資訊清單刻意將隨附 Slack 外掛的正式環境安裝
（`extensions/slack/src/setup-shared.ts:12`）縮限至即時 Slack QA
套件所涵蓋的權限與事件。如需使用者所見的正式頻道設定方式，請參閱
[Slack 頻道快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver/SUT
配對刻意分開，因為此執行途徑需要同一工作區中兩個不同的機器人使用者
ID。

**1. 建立 Driver 應用程式**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → 選擇 QA 工作區、貼上下列資訊清單，
接著選取 _Install to Workspace_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "OpenClaw QA Slack 即時執行途徑的測試驅動機器人"
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

複製 _Bot User OAuth Token_（`xoxb-...`）—這會成為
`driverBotToken`。驅動程式只需發送訊息並識別自身；不需要事件，
也不需要 Socket Mode。

**2. 建立 SUT 應用程式**

在同一工作區中重複執行 _Create New App → From a manifest_。此 QA 應用程式
刻意使用隨附 Slack 外掛之正式環境資訊清單
（`extensions/slack/src/setup-shared.ts:12`）的縮限版本：省略回應
權限範圍及事件，因為即時 Slack QA 套件尚未涵蓋回應處理。

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "適用於 OpenClaw 的 OpenClaw QA SUT 連接器"
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
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 新增
  範圍 `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會
  成為 `sutAppToken`。

分別使用每個權杖呼叫 `auth.test`，確認兩個機器人具有不同的使用者 ID。執行階段會依使用者 ID 區分驅動程式與 SUT；兩者重複使用同一個應用程式
會立即無法通過提及閘控。

**3. 建立頻道**

在 QA 工作區中建立頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個
機器人：

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` ID，這會
成為 `channelId`。公開頻道即可；若使用私人頻道，
兩個應用程式都已具備 `groups:history`，因此測試框架的歷史記錄讀取仍會
成功。

**4. 註冊認證資訊**

有兩種選項。單機偵錯請使用環境變數（設定四個
`OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或將認證資訊植入
共用 Convex 集區，讓 CI 與其他維護者可以租用。

若使用 Convex 集區，請將四個欄位寫入 JSON 檔案：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在 shell 中匯出 `OPENCLAW_QA_CONVEX_SITE_URL` 與 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
後，執行註冊並驗證：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

預期會有 `count: 1`、`status: "active"`，且沒有 `lease` 欄位。

**5. 端對端驗證**

在本機執行此測試通道，確認兩個機器人可透過代理程式互相通訊：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功的執行會在遠低於 30 秒內完成，且 `qa-suite-report.md`
會顯示 `slack-canary` 與 `slack-mention-gating` 的狀態皆為 `pass`。若
測試通道停滯約 90 秒並以 `Convex credential pool exhausted
for kind "slack"` 結束，表示集區為空，或所有資料列都已租出；`qa
credentials list --kind slack --status all --json` 會指出是哪一種情況。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

此命令以兩個專用的 WhatsApp Web 帳號為目標：一個由
測試框架控制的驅動程式帳號，以及一個由子 OpenClaw 閘道透過
內建 WhatsApp 外掛啟動的 SUT 帳號。

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

WhatsApp YAML 情境（`qa/scenarios/channels/whatsapp-*.yaml`）：

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
- 使用者路徑訊息動作：`whatsapp-agent-message-action-react` 從
  真實的驅動程式私訊開始，讓模型呼叫 `message` 工具，並
  觀察 WhatsApp 原生回應。`whatsapp-agent-message-action-upload-file`
  針對 `message(action=upload-file)` 採用相同方式，並觀察
  WhatsApp 原生媒體。`whatsapp-group-agent-message-action-react` 與
  `whatsapp-group-agent-message-action-upload-file` 會在真實 WhatsApp 群組中證明相同的
  使用者可見動作。
- 群組扇出：`whatsapp-broadcast-group-fanout` 從一則提及機器人的
  WhatsApp 群組訊息開始，並驗證 `main`
  與 `qa-second` 分別產生不同的可見回覆。
- 群組啟用：`whatsapp-group-activation-always` 將真實群組
  工作階段變更為 `/activation always`，證明未提及機器人的群組訊息會喚醒
  代理程式，接著還原 `/activation mention`。
  `whatsapp-group-reply-to-bot-triggers` 會植入一則機器人回覆，再傳送一則未明確提及機器人的原生
  引用回覆，並驗證代理程式會由該回覆內容喚醒。
- 輸入媒體與結構化訊息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  這些情境會透過驅動程式傳送真實的 WhatsApp 圖片、音訊、文件、位置、聯絡人、
  貼圖與回應事件。
- 直接閘道契約探測：`whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。這些情境刻意略過模型提示，
  並證明確定性的閘道／頻道 `send`、`poll` 與
  `message.action` 契約。
- 存取控制涵蓋範圍：`whatsapp-access-control-dm-open`、
  `whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、
  `whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- 原生核准：`whatsapp-approval-exec-deny-native`、
  `whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、
  `whatsapp-approval-exec-group-reaction-native`、
  `whatsapp-approval-plugin-native`。
- 狀態回應：`whatsapp-status-reactions`、
  `whatsapp-status-reaction-lifecycle`。

目錄目前包含 52 個情境。`live-frontier` 預設測試通道維持精簡，
僅包含 8 個情境，以提供快速的冒煙測試涵蓋範圍。`mock-openai`
預設測試通道會透過真實 WhatsApp 傳輸確定性地執行 39 個情境，
且僅模擬模型輸出；核准情境與少數負擔較重／會封鎖的檢查仍須明確指定情境 ID。

WhatsApp QA 驅動程式會觀察結構化即時事件（`text`、`media`、
`location`、`reaction` 與 `poll`），並可主動傳送媒體、投票、
聯絡人、位置及貼圖。QA Lab 透過
`@openclaw/whatsapp/api.js` 套件介面匯入該驅動程式，而不會存取私有的
WhatsApp 執行階段檔案。觀察群組時，`fromJid` 是群組 JID，
而 `participantJid` 與 `fromPhoneE164` 用於識別參與者傳送者。
訊息內容預設會經過遮蔽。直接閘道投票、檔案上傳、
媒體、群組投票、群組媒體與回覆形狀探測屬於傳輸／API
契約檢查；不應將其視為使用者提示促使
代理程式選擇相同動作的證明。使用者路徑動作的證明來自
`whatsapp-agent-message-action-react` 與
`whatsapp-group-agent-message-action-react` 等情境，其中驅動程式會傳送一般
WhatsApp 訊息，而 QA Lab 會觀察所產生的 WhatsApp 原生產物。
WhatsApp 情境詳細資料會包含每個情境的驗證方式（`user-path`、
`direct-gateway` 或 `native-approval`），以免將證據誤認為其實際所證明
契約的更強版本。

輸出成品：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` — 即時傳輸檢查的證據項目。

### Convex 認證資訊集區

Discord、Slack、Telegram 與 WhatsApp 測試通道可以從
共用 Convex 集區租用認證資訊，而不必讀取上述環境變數。傳入
`--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；
QA Lab 會取得獨佔租約，在執行期間持續傳送心跳，
並在關閉時釋放租約。集區種類包括 `"discord"`、`"slack"`、
`"telegram"` 與 `"whatsapp"`。

代理程式會在 `admin/add` 驗證以下承載資料形狀：

- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string,
sutToken: string }` — `groupId` 必須是數字聊天 ID 字串。
- Telegram 真實使用者（`kind: "telegram-user"`）：`{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` —
  僅供 Mantis Telegram Desktop 證明使用。一般 QA Lab 測試通道不得取得
  此種類。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` — 電話號碼必須是不同的 E.164 字串。

Mantis Telegram Desktop 證明工作流程會為 TDLib 命令列介面驅動程式與 Telegram Desktop
見證程式持有一份獨佔的 Convex `telegram-user` 租約，並在發布證明後釋放。

當 PR 需要確定性的視覺差異時，Mantis 可在 `main` 與 PR 最新提交上
使用相同的模擬模型回覆，同時變更 Telegram 格式化程式或
傳遞層。擷取預設值已針對 PR 留言調整：標準
Crabbox 類別、24fps 桌面錄影、24fps 動態 GIF，以及 1920px 預覽
寬度。前後對照留言應發布只包含
預期 GIF 的乾淨套件。

Slack 測試通道也可以使用此集區。Slack 承載資料形狀檢查目前位於
Slack QA 執行器，而不是代理程式中；請使用 `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`，並指定類似
`Cxxxxxxxxxx` 的 Slack 頻道 ID。有關應用程式
與範圍的佈建方式，請參閱[設定 Slack 工作區](#setting-up-the-slack-workspace)。

操作環境變數與 Convex 代理程式端點契約位於
[測試 → 透過 Convex 共用 Telegram 認證資訊](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)
（該章節名稱早於多頻道集區；不同種類共用相同的租約語意）。

## 由儲存庫支援的種子資料

種子資產位於 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

這些檔案刻意納入 git，讓人員與
代理程式都能看見 QA 計畫。

`qa-lab` 維持為通用 YAML 情境執行器。每個情境 YAML 檔案都是
一次測試執行的唯一真實來源，且應定義：

- 頂層 `title`
- `scenario` 中繼資料
- `scenario` 中的選用類別、功能、測試通道與風險中繼資料
- `scenario` 中的文件與程式碼參照
- `scenario` 中的選用外掛需求
- `scenario` 中的選用閘道設定修補
- 流程情境的可執行頂層 `flow`，或
  Vitest 與 Playwright 情境的 `scenario.execution.kind`／`scenario.execution.path`

支援 `flow` 的可重複使用執行階段介面維持通用且
跨領域。例如，YAML 情境可結合傳輸端輔助工具與瀏覽器端輔助工具，
透過閘道 `browser.request` 接合面驅動內嵌的 Control UI，而不必新增
特殊用途的執行器。

情境檔案應依產品能力分組，而非依原始碼樹狀目錄分組。移動檔案時應維持情境 ID
穩定；使用 `docsRefs` 和 `codeRefs` 追蹤實作。

基準清單應涵蓋足夠廣泛的範圍，包括：

- 私訊與頻道聊天
- 討論串行為
- 訊息動作生命週期
- 排程回呼
- 記憶喚回
- 模型切換
- 子代理交接
- 儲存庫與文件閱讀
- 一項小型建置工作，例如 Lobster Invaders

## 提供者模擬測試路徑

`qa suite` 有兩條本機提供者模擬測試路徑：

- `mock-openai` 是可感知情境的 OpenClaw 模擬器。它仍是
儲存庫型 QA 與一致性閘門的預設確定性模擬測試路徑。
- `aimock` 會啟動由 AIMock 支援的提供者伺服器，用於實驗性
通訊協定、固定測試資料、錄製／重播及混沌測試涵蓋。它屬於額外功能，
不會取代 `mock-openai` 情境分派器。

提供者測試路徑的實作位於 `extensions/qa-lab/src/providers/`。
每個提供者各自擁有其預設值、本機伺服器啟動方式、閘道模型設定、
驗證設定檔暫存需求，以及即時／模擬能力旗標。共用套件與
閘道程式碼會透過提供者登錄表路由，而非依提供者名稱建立分支。

## 傳輸配接器

`qa-lab` 為 YAML QA 情境提供通用傳輸接合面。`qa-channel` 是
合成式預設值。`crabline` 會啟動符合本機提供者形態的伺服器，並
針對這些伺服器執行 OpenClaw 的一般頻道外掛。`live` 保留給
真實提供者認證資訊與外部頻道。

在架構層級，其分工如下：

- `qa-lab` 負責通用情境執行、工作程序並行、成品
寫入與報告。
- 傳輸配接器負責閘道設定、就緒檢查、輸入與輸出
觀察、傳輸動作，以及正規化的傳輸狀態。
- `qa/scenarios/` 下的 YAML 情境檔案定義測試執行內容；`qa-lab`
提供執行這些情境的可重複使用執行階段介面。

### 新增頻道

將頻道加入 YAML QA 系統時，需要提供頻道實作，
以及用於驗證頻道契約的情境套件。若要納入冒煙測試 CI
涵蓋範圍，請新增相符的 Crabline 本機提供者伺服器，並透過
`crabline` 驅動程式公開它。

當共用 `qa-lab` 主機可負責此流程時，請勿新增頂層 QA 命令根節點。

`qa-lab` 負責共用主機機制：

- `openclaw qa` 命令根節點
- 套件啟動與關閉
- 工作程序並行
- 成品寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容性別名

執行器外掛負責傳輸契約：

- 如何將 `openclaw qa <runner>` 掛載於共用 `qa` 根節點下
- 如何為該傳輸方式設定閘道
- 如何檢查就緒狀態
- 如何注入輸入事件
- 如何觀察輸出訊息
- 如何公開逐字記錄與正規化傳輸狀態
- 如何執行由傳輸支援的動作
- 如何處理傳輸特定的重設或清理

新頻道的最低採用門檻：

1. 讓 `qa-lab` 繼續負責共用 `qa` 根節點。
2. 在共用 `qa-lab` 主機接合面上實作傳輸執行器。
3. 將傳輸特定機制保留在執行器外掛或頻道
   測試框架內。
4. 將執行器掛載為 `openclaw qa <runner>`，而非註冊
   互相競爭的根命令。執行器外掛應在
   `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts`
   匯出相符的 `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；
   延遲載入的命令列介面與執行器執行應置於不同進入點之後。選用的
   `adapterFactory` 可將傳輸公開給共用情境，而不變更
   命令的既有情境目錄。同頻道分割區預設為循序執行，
   除非工廠宣告每個執行個體都擁有隔離的認證資訊或
   可拋棄式伺服器、閘道狀態與成品路徑。
5. 在依主題分類的 `qa/scenarios/`
   目錄下編寫或調整 YAML 情境。
6. 新情境使用通用情境輔助工具。
7. 除非儲存庫正在進行刻意遷移，否則應維持
   既有相容性別名正常運作。

決策規則很嚴格：

- 如果某項行為可以在 `qa-lab` 中表達一次，請將它放在 `qa-lab`。
- 如果某項行為相依於單一頻道傳輸方式，請將它保留在該執行器
  外掛或外掛測試框架中。
- 如果情境需要多個頻道皆可使用的新能力，
  請新增通用輔助工具，而非在 `suite.ts` 中新增頻道特定分支。
- 如果某項行為僅對一種傳輸方式有意義，請讓該情境
  維持傳輸特定，並在情境契約中明確標示。

### 情境輔助工具名稱

新情境偏好使用的通用輔助工具：

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

既有情境仍可使用相容性別名：
`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、
`formatConversationTranscript`、`resetBus`；但編寫新情境時
應使用通用名稱。這些別名是為了避免一次性全面
遷移而存在，並非未來沿用的模式。

## 報告

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 通訊協定報告。
報告應回答：

- 哪些項目正常運作
- 哪些項目失敗
- 哪些項目仍受阻
- 哪些後續情境值得新增

若要取得可用情境的清單（在估算後續工作規模或串接新傳輸方式時很有用），
請執行 `pnpm openclaw qa coverage`（加入 `--json`
即可取得機器可讀輸出）。為受影響的行為或檔案路徑選擇聚焦驗證時，
請執行 `pnpm openclaw qa coverage --match <query>`。比對報告會搜尋
情境中繼資料、文件參照、程式碼參照、涵蓋範圍 ID、
外掛與提供者需求，然後列印相符的 `qa suite
--scenario ...` 目標。

每次執行 `qa suite`，都會為所選情境集寫入頂層
`qa-evidence.json`、`qa-suite-summary.json` 和 `qa-suite-report.md`
成品。宣告 `execution.kind: vitest` 或
`execution.kind: playwright` 的情境會執行相符的測試路徑，並另外寫入
個別情境的記錄。宣告 `execution.kind: script` 的情境會透過
`node --import tsx` 執行位於 `execution.path` 的證據產生器（其中
`${outputDir}` 和 `${scenarioId}` 會在 `execution.args` 中展開）；
產生器會寫入自己的 `qa-evidence.json`，其項目會匯入
套件輸出，而其中的成品路徑會相對於該
產生器的 `qa-evidence.json` 解析。當透過 `qa run
--qa-profile` 到達
`qa suite` 時，相同的 `qa-evidence.json` 也會包含所選分類法類別的設定檔
評分卡摘要。

請將涵蓋範圍輸出視為探索輔助工具，而非閘門的替代品；
所選情境仍需針對受測行為使用正確的提供者模式、即時傳輸、
Multipass、Testbox 或發行測試路徑。如需評分卡脈絡，請參閱
[成熟度評分卡](/zh-TW/maturity/scorecard)。

若要檢查角色與風格，請在多個即時模型參照上執行相同情境，
並撰寫經評審的 Markdown 報告：

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

此命令會執行本機 QA 閘道子程序，而非 Docker。角色
評估情境應透過 `SOUL.md` 設定角色設定，接著執行一般
使用者輪次，例如聊天、工作區協助與小型檔案工作。不應告知候選
模型其正在接受評估。此命令會保留每份完整逐字記錄、記錄基本執行統計資料，
接著要求評審模型以快速模式執行，並在支援時使用 `xhigh`
推理，依自然度、氛圍與幽默感為各次執行排名。比較
提供者時請使用 `--blind-judge-models`：評審提示仍會取得每份逐字記錄與執行狀態，
但候選參照會替換為 `candidate-01` 等中性標籤；
報告會在剖析後將排名對應回實際參照。

候選執行預設使用 `high` 思考模式，GPT-5.6 Luna 使用 `medium`，
而支援此功能的舊版 OpenAI 評估參照則使用 `xhigh`。可透過
`--model provider/model,thinking=<level>` 行內覆寫特定候選項目；行內
選項也支援 `fast`、`no-fast` 和 `fast=<bool>`。
`--thinking
<level>` 仍會設定全域備用值，而舊版 `--model-thinking
<provider/model=level>` 形式則保留
以維持相容性。OpenAI 候選參照預設使用快速模式，以便在提供者
支援時使用優先處理。只有在你想強制所有候選模型啟用快速模式時，
才傳入 `--fast`。報告會記錄候選模型與評審模型的執行時間，
供基準分析使用，但評審提示會明確要求不要依速度排名。
候選模型與評審模型執行的預設並行數皆為 16。當提供者限制或本機
閘道壓力使執行結果雜訊過多時，請降低 `--concurrency` 或
`--judge-concurrency`。

未傳入候選 `--model` 時，角色評估預設使用
`openai/gpt-5.6-luna`、`openai/gpt-5.2`、`openai/gpt-5`、
`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。未傳入
`--judge-model` 時，評審模型預設為
`openai/gpt-5.6-sol,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-8,thinking=high`。

## 相關文件

- [成熟度評分卡](/zh-TW/maturity/scorecard)
- [個人代理基準套件](/zh-TW/concepts/personal-agent-benchmark-pack)
- [QA 頻道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
