---
doc-schema-version: 1
read_when:
    - 瞭解 QA 技術堆疊如何協同運作
    - 擴充 qa-lab、qa-channel 或傳輸介面卡
    - 新增由儲存庫支援的 QA 情境
    - 圍繞閘道儀表板建置更高擬真度的 QA 自動化
summary: QA 技術堆疊概覽：qa-lab、qa-channel、儲存庫支援的情境、即時傳輸通道、傳輸介面卡與報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-07-16T11:32:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊以貼近真實情境、符合頻道運作方式的形式測試 OpenClaw，這是單元測試無法做到的。

組成部分：

- `extensions/qa-channel`：合成訊息頻道，包含私訊、頻道、討論串、表情回應、編輯及刪除介面。
- `extensions/qa-lab`：偵錯工具 UI、QA 匯流排、情境設定檔及即時傳輸介面卡，用於觀察對話記錄、注入傳入訊息，以及匯出 Markdown 報告。
- `qa/`：由儲存庫支援的啟動任務種子資產及基準 QA 情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器螢幕截圖、VM 狀態及 PR 證據的錯誤，進行修正前後的即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多流程都有 `pnpm qa:*` 指令碼別名；兩種形式皆可使用。

| 命令                                                | 用途                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不使用 `--qa-profile` 的內建 QA 自我檢查；由分類法支援的成熟度設定檔執行器，可搭配 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all`。                                                                                                  |
| `qa suite`                                          | 對 QA 閘道執行由儲存庫支援的情境。`--runner multipass` 使用一次性 Linux VM，而非主機。                                                                                                                                         |
| `qa coverage`                                       | 輸出 YAML 情境涵蓋範圍清單（`--json` 用於機器輸出；`--match <query>` 用於尋找與所觸及行為相關的情境；`--tools` 用於執行階段工具固定資料涵蓋範圍）。                                                                                  |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案，以執行模型軸一致性閘門；或使用 `--runtime-axis --token-efficiency` 寫入 Codex 與 OpenClaw 的執行階段一致性及權杖效率報告。                                                                          |
| `qa confidence-report`                              | 依據資訊清單分類 QA 證明成品，產生未知項目為零的信心報告。                                                                                                                                                                               |
| `qa confidence-self-test`                           | 寫入具種子的負向控制金絲雀，證明信心閘門能偵測偏移。                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | 透過執行階段一致性重播測試框架，重播精選的 JSONL 對話記錄。                                                                                                                                                                                         |
| `qa character-eval`                                 | 在多個即時模型上執行角色 QA 情境，並產生經評判的報告。請參閱[報告](#reporting)。                                                                                                                                                        |
| `qa manual`                                         | 對所選提供者／模型執行路徑執行一次性提示。                                                                                                                                                                                                      |
| `qa ui`                                             | 啟動 QA 偵錯工具 UI 及本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | 寫入 QA 儀表板與閘道執行路徑的 docker-compose 鷹架。                                                                                                                                                                                                |
| `qa up`                                             | 建置 QA 網站、啟動由 Docker 支援的堆疊，並輸出 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                              |
| `qa aimock`                                         | 僅啟動 AIMock 提供者伺服器。                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | 僅啟動可感知情境的 `mock-openai` 提供者伺服器。                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用的 Convex 認證資訊集區。                                                                                                                                                                                                                           |
| `qa discord`                                        | 對真實私人 Discord 伺服器頻道執行即時傳輸路徑。                                                                                                                                                                                                   |
| `qa matrix`                                         | 對一次性 Tuwunel 主伺服器執行 QA Lab Matrix 設定檔。請參閱 [Matrix 冒煙測試路徑](#matrix-smoke-lanes)。                                                                                                                                                      |
| `qa slack`                                          | 對真實私人 Slack 頻道執行即時傳輸路徑。                                                                                                                                                                                                           |
| `qa telegram`                                       | 對真實私人 Telegram 群組執行即時傳輸路徑。                                                                                                                                                                                                          |
| `qa whatsapp`                                       | 對真實 WhatsApp Web 帳號執行即時傳輸路徑。                                                                                                                                                                                                             |
| `qa mantis`                                         | 即時傳輸錯誤的修正前後驗證執行器，包含 Discord 狀態表情回應證據、Crabbox 桌面／瀏覽器冒煙測試，以及 VNC 中的 Slack 冒煙測試。請參閱 [Mantis](/zh-TW/concepts/mantis) 及 [Mantis Slack 桌面操作手冊](/zh-TW/concepts/mantis-slack-desktop-runbook)。 |

### 由設定檔支援的 `qa run`

由設定檔支援的 `qa run` 會從 `taxonomy.yaml` 讀取成員資格，接著透過 `qa suite` 分派解析出的情境。`--surface` 與 `--category` 會篩選所選設定檔，而非定義個別執行路徑。產生的 `qa-evidence.json` 包含設定檔計分卡摘要，其中列出所選類別的數量及缺少的涵蓋範圍 ID；個別證據項目仍是測試、涵蓋角色及結果的真實資料來源。分類法功能涵蓋範圍 ID 是精確的證明目標，而非別名：主要情境涵蓋範圍會滿足相符的 ID，次要涵蓋範圍則僅供參考。涵蓋範圍 ID 使用點分隔的 `namespace.behavior` 格式，其中各區段由小寫英數字元或連字號組成；設定檔、介面及類別 ID 仍可使用現有的連字號或點分隔分類法 ID。

精簡證據會省略各項目的 `execution`，並設定 `evidenceMode: "slim"`；`smoke-ci` 預設使用精簡模式，而 `--evidence-mode full` 會還原完整項目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

若要使用模擬模型提供者及 Crabline 本機提供者伺服器取得確定性的設定檔證明，請使用 `smoke-ci`。若要針對即時頻道進行 Stable/LTS 證明，請使用 `release`。僅在明確執行完整分類法證據時使用 `all`；它會選取每個作用中的成熟度類別，並可透過 `QA
Profile Evidence` GitHub Actions 工作流程搭配 `qa_profile=all` 進行分派。若命令也需要 OpenClaw 根設定檔，請將根設定檔放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作者流程

目前的 QA 操作者流程是雙窗格 QA 網站：

- 左側：包含代理程式的閘道儀表板（Control UI）。
- 右側：QA Lab，顯示類似 Slack 的對話記錄及情境計畫。

使用下列命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA 網站、啟動由 Docker 支援的閘道執行路徑，並公開 QA Lab 頁面，讓操作者或自動化迴圈能向代理程式指派 QA 任務、觀察真實頻道行為，並記錄哪些項目成功、失敗或仍然受阻。

若要加快 QA Lab UI 疊代速度，避免每次都重新建置 Docker 映像，請使用以繫結掛載方式提供 QA Lab 套件的堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務維持使用預先建置的映像，並將 `extensions/qa-lab/web/dist` 繫結掛載至 `qa-lab` 容器。`qa:lab:watch` 會在內容變更時重新建置該套件，而當 QA Lab 資產雜湊變更時，瀏覽器會自動重新載入。

### 可觀測性冒煙測試

<Note>
可觀測性 QA 僅限於原始碼簽出。npm tarball 會刻意省略 QA Lab（及 `qa-channel`），因此套件 Docker 發行執行路徑不會執行 `qa` 命令。變更診斷檢測機制時，請從已建置的原始碼簽出執行這些命令。
</Note>

| 別名                                   | 執行內容                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 本機 OpenTelemetry 接收器，加上已啟用 `diagnostics-otel` 的 `otel-trace-smoke` 情境。                                      |
| `pnpm qa:otel:collector-smoke`          | 相同執行路徑，但置於真正的 OpenTelemetry Collector Docker 容器之後。變更端點接線或收集器／OTLP 相容性時使用。 |
| `pnpm qa:prometheus:smoke`              | 已啟用 `diagnostics-prometheus` 的 `docker-prometheus-smoke` 情境。                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke`，接著執行 `qa:prometheus:smoke`。                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke`，接著執行 `qa:prometheus:smoke`。                                                                            |

`qa:otel:smoke` 會啟動本機 OTLP/HTTP 接收器、執行最小化的 QA 頻道
代理程式回合，然後斷言追蹤、指標和日誌均已匯出。它會解碼
匯出的 protobuf 追蹤跨度，並檢查攸關發行的結構：
`openclaw.run`、`openclaw.harness.run`、採用最新 GenAI 語意慣例的
模型呼叫跨度、`openclaw.context.assembled` 和 `openclaw.message.delivery`
都必須存在。煙霧測試會強制使用
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此模型呼叫
跨度必須使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名稱；成功的回合中，模型
呼叫不得匯出 `StreamAbandoned`；原始診斷
ID 和 `openclaw.content.*` 屬性不得出現在追蹤中。情境
提示會要求模型以固定標記回覆，並保留一段固定的
祕密字串不予輸出；原始 OTLP 承載資料不得包含這兩者，也不得包含從情境 ID
衍生的 QA 工作階段金鑰。它會將 `otel-smoke-summary.json`
寫入 QA 套件成品旁。

`qa:prometheus:smoke` 會驗證未經驗證的擷取遭到拒絕，然後
檢查已驗證的擷取包含攸關發行的指標系列，且不含
提示內容、回應內容、原始診斷識別碼、驗證
權杖或本機路徑。

### Matrix 煙霧測試執行路徑

若要執行不需要模型供應商
認證資訊的真實傳輸 Matrix 煙霧測試執行路徑，請使用確定性的模擬 OpenAI 供應商執行發行設定檔：

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

若要執行即時前沿供應商路徑，請明確提供 OpenAI 相容的
認證資訊：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

單獨執行 `pnpm openclaw qa matrix` 會執行完整的 `all` 設定檔，並在
情境失敗後繼續執行。使用 `--fail-fast` 可縮短回饋迴圈，或重複指定
`--scenario <id>` 以選取個別情境；明確指定的情境 ID 優先於
`--profile`。

| 設定檔      | 情境數 | 用途                                                                                                                                  |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | 完整目錄（預設）。                                                                                                              |
| `release`    | 2         | 攸關發行的頻道基準，以及即時允許清單重新載入。                                                                             |
| `fast`       | 12        | 聚焦於討論串、反應、核准、原則、機器人門控和加密回覆的涵蓋範圍。                                               |
| `transport`  | 50        | 討論串、私訊／聊天室路由、自動加入、核准、反應、重新啟動、提及／允許清單原則、編輯和多參與者排序。         |
| `media`      | 7         | 圖片、產生的圖片、語音、附件、不支援的媒體和加密媒體的涵蓋範圍。                                              |
| `e2ee-smoke` | 8         | 最低限度的加密回覆、討論串、啟動、復原、重新啟動、遮蔽和失敗涵蓋範圍。                                       |
| `e2ee-deep`  | 18        | 狀態遺失、備份、金鑰復原、裝置衛生，以及 SAS／QR／私訊驗證。                                                            |
| `e2ee-cli`   | 9         | 透過測試框架執行 `openclaw matrix encryption setup`、復原金鑰、多帳號、閘道往返和自我驗證命令。 |

設定檔成員資格和頻道需求與宣告式 Matrix
情境一同存放於 `qa/scenarios/channels/`。執行時會選擇頻道驅動程式。
其即時實作位於
`extensions/qa-lab/src/live-transports/matrix/scenarios/`。

轉接器會在 Docker 中佈建可拋棄式 Tuwunel 主伺服器（預設
映像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`、伺服器名稱 `matrix-qa.test`、
連接埠 `28008`），註冊暫時的驅動程式、受測系統和觀察者使用者，建立
所需聊天室，並記錄經遮蔽的要求／回應邊界。接著，它會在限定於該傳輸的
子 QA 閘道內執行真正的 Matrix 外掛
（不含 `qa-channel`），然後拆除環境。

常用選項：

| 旗標                     | 預設值           | 用途                                                                              |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | 選取上述其中一個設定檔。                                                    |
| `--scenario <id>`        | -                 | 選取一個情境；可重複指定。                                                     |
| `--fail-fast`            | 關閉               | 在第一個失敗的檢查或情境後停止。                                       |
| `--allow-failures`       | 關閉               | 寫入成品，但不因情境失敗而傳回失敗的結束代碼。         |
| `--provider-mode <mode>` | `live-frontier`   | 使用 `mock-openai` 進行確定性分派，或使用 `live-frontier` 連接即時供應商。 |
| `--model <ref>`          | 供應商預設值  | 設定主要的 `provider/model` 參照。                                          |
| `--alt-model <ref>`      | 供應商預設值  | 設定會切換模型之情境所使用的替代模型。                        |
| `--fast`                 | 關閉               | 在支援的情況下啟用供應商快速模式。                                           |
| `--output-dir <path>`    | 自動產生         | 選擇報告目錄；相對路徑會以 `--repo-root` 為基準解析。           |
| `--repo-root <path>`     | 目前目錄 | 從中立的工作目錄執行。                                                |
| `--sut-account <id>`     | `sut`             | 選取子閘道設定中的 Matrix 帳號 ID。                            |

Matrix QA 不會租用共用的 Matrix 認證資訊：轉接器會在本機建立
可拋棄式使用者，因此不接受 `--credential-source` 或
`--credential-role`。可使用
`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆寫主伺服器映像；可使用
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` 調整否定性無回覆斷言（預設 `8000`，上限為作用中的
情境逾時）。單次命令通常會在
成品寫入完成後強制乾淨結束，因為 Matrix 加密原生控制代碼可能比清理程序存活得更久；僅在需要
命令改為傳回的直接測試框架中設定 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`。

每次執行都會將一般 QA Lab 成品寫入所選的輸出
目錄：`qa-suite-report.md`、`qa-suite-summary.json`、`qa-evidence.json`，
以及經遮蔽的 `matrix-harness-*/matrix-qa-harness.json` 資訊清單。如果清理
失敗，請執行輸出的 `docker compose ... down --remove-orphans` 復原
命令。在較慢的執行器上，請增加無回覆時間範圍；在快速 CI 上，較小的
時間範圍可縮短否定性斷言。

這些情境涵蓋單元測試無法進行端對端證明的傳輸行為：
提及門控、允許機器人原則、允許清單、頂層與討論串
回覆、私訊路由、反應處理、抑制傳入編輯、重新啟動時的
重播去重、主伺服器中斷復原、核准中繼資料傳遞、
媒體處理，以及 Matrix E2EE 啟動／復原／驗證流程。
E2EE 命令列介面設定檔也會透過同一個可拋棄式主伺服器驅動 `openclaw matrix encryption setup` 和
驗證命令，然後再檢查
閘道回覆。

`matrix-room-block-streaming` 和 `subagent-thread-spawn` 仍可透過
明確選取 `--scenario` 使用，但不包含在預設的 `all` 設定檔中。

CI 在
`.github/workflows/qa-live-transports-convex.yml` 中使用相同的命令介面。排程和發行執行
會執行發行情境。手動 `matrix_profile=all` 分派會展開執行
`transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 設定檔；
聚焦分派則會在單一工作中選取 `fast`、`release` 或 `transport`。

### Discord Mantis 情境

Discord 另有僅供 Mantis 選擇加入的錯誤重現情境。使用
`--scenario discord-status-reactions-tool-only` 可取得明確的狀態
反應時間軸；使用 `--scenario discord-thread-reply-filepath-attachment`
則可建立真正的 Discord 討論串，並驗證 `message.thread-reply`
會保留 `filePath` 附件。這些情境不包含在預設的
即時 Discord 執行路徑中，因為它們是修正前／後的重現探針，而非
廣泛的煙霧測試涵蓋範圍。當 QA
環境中設定了 `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 時，討論串附件 Mantis 工作流程也可加入
已登入的 Discord Web 見證影片。該檢視器設定檔僅用於視覺擷取；通過／失敗
判定仍由 Discord REST 預期結果來源決定。

若要執行其他真實傳輸煙霧測試路徑：

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

它們以預先存在且包含兩個機器人或帳號（驅動程式 +
受測系統）的真實頻道為目標。這四種傳輸所需的環境變數、情境清單、輸出成品和 Convex
認證資訊集區記錄於下方的
[Discord、Slack、Telegram 和 WhatsApp QA 參考資料](#discord-slack-telegram-and-whatsapp-qa-reference)。

### Mantis Slack 桌面與視覺任務執行器

若要執行含 VNC 救援的完整 Slack 桌面 VM，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用一台 Crabbox 桌面／瀏覽器機器，在 VM 內執行 Slack 即時
通道、在 VNC 瀏覽器中開啟 Slack Web、擷取桌面畫面，
並將 `slack-qa/`、`slack-desktop-smoke.png`，以及
`slack-desktop-smoke.mp4`（可使用影片擷取時）複製回
Mantis 成品目錄。Crabbox 桌面／瀏覽器租用環境會預先提供擷取
工具與瀏覽器／原生建置輔助套件，因此此情境
應只在較舊的租用環境中安裝備援項目。Mantis 會在 `mantis-slack-desktop-smoke-report.md` 中回報總計與
各階段耗時，讓緩慢的執行能顯示
時間是花在租用環境暖機、取得認證資訊、遠端設定，還是
複製成品。透過 VNC 手動登入 Slack Web 後，請重複使用 `--lease-id <cbx_...>`；
重複使用的租用環境也會讓 Crabbox 的 pnpm 儲存區快取
保持暖機狀態。預設的 `--hydrate-mode source` 會從原始碼簽出內容進行驗證，並
在 VM 內執行安裝／建置。只有在
重複使用的遠端工作區已經有 `node_modules` 與建置完成的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；
該模式會略過耗時的安裝／建置步驟，並在
工作區尚未就緒時採取失敗即關閉策略。使用 `--gateway-setup` 時，Mantis 會在
VM 內的連接埠 `38973` 上持續執行 OpenClaw Slack 閘道；若未使用，
該命令會執行一般的機器人對機器人 Slack QA 通道，並在擷取
成品後結束。

若要以桌面證據證明原生 Slack 核准 UI，請執行 Mantis
核准檢查點模式：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

此模式與 `--gateway-setup` 互斥。它會執行 Slack
核准情境、拒絕非核准情境 ID、在每個待處理與
已解決的核准狀態等待、將觀察到的 Slack API 訊息轉譯至
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`，接著在任何檢查點、
訊息證據、確認回覆或轉譯後的螢幕截圖遺失或
為空時失敗。冷啟動的 CI 租用環境仍可能在
`slack-desktop-smoke.png` 中顯示 Slack 登入畫面；核准檢查點影像才是此通道的視覺
證明。

預設檢查點執行會保留兩個標準 Slack 核准情境。
若要擷取任一選用的 Codex 核准路徑，請使用
`--scenario slack-codex-approval-exec-native` 或
`--scenario slack-codex-approval-plugin-native` 明確選取；Mantis 兩者皆接受，並會產生
相同的待處理／已解決螢幕截圖組。執行器會針對每個選取的 Codex 路徑
延長檢查點與遠端命令的期限，讓完整的
核准、代理程式完成與已解決更新序列得以完成。

操作員檢查清單、GitHub 工作流程分派命令、證據留言
契約、補充模式決策表、耗時解讀與失敗
處理步驟，請參閱
[Mantis Slack 桌面操作手冊](/zh-TW/concepts/mantis-slack-desktop-runbook)。

若要執行代理程式／電腦視覺類型的桌面工作，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` 會租用或重複使用 Crabbox 桌面／瀏覽器機器、啟動
`crabbox record --while`、透過巢狀
`visual-driver` 操作可見的瀏覽器、擷取 `visual-task.png`，並在選取 `--vision-mode image-describe` 時，針對螢幕截圖執行 `openclaw infer image
describe`，
接著寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和
`mantis-visual-task-report.md`。設定 `--expect-text` 時，視覺
提示會要求結構化 JSON 判定（`visible`、`evidence`、`reason`），
且只有當模型回報 `visible: true`，並提供
引用預期文字的證據時才會通過；僅引用
目標文字的 `visible: false` 回應仍無法通過判定。若要進行
不呼叫影像理解提供者，但能證明桌面、瀏覽器、螢幕截圖與影片
管線正常運作的無模型冒煙測試，請使用 `--vision-mode metadata`。錄製內容是
`visual-task` 的必要成品；若 Crabbox 未錄製任何非空的
`visual-task.mp4`，即使視覺驅動程式已通過，工作仍會失敗。若
失敗，Mantis 會為 VNC 保留租用環境，除非工作先前已通過
且未設定 `--keep-lease`。

### 認證資訊集區健康狀態檢查

使用集區中的即時認證資訊前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex 代理程式環境（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`）、驗證端點設定、僅回報
`OPENCLAW_QA_CONVEX_SECRET_CI` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 的已設定／遺失狀態，並在存在維護者密鑰時
驗證管理／清單的可連線性。

## 標準情境涵蓋範圍

根目錄的 `taxonomy.yaml` 定義語意涵蓋範圍 ID。位於
`qa/scenarios/` 下的情境 YAML 檔案會將每個情境對應至這些 ID，並擁有執行
中繼資料：`channel` 是唯一的頻道需求，而 `profiles` 則宣告
具名執行成員資格。頻道驅動程式是可互換的執行層級
實作選擇。TypeScript
執行器會查詢該目錄；不會維護平行情境或涵蓋範圍
清單。

靜態 `qa coverage` 輸出會回報分類法到情境的對應。實際
證明來自 `qa-evidence.json`，其中記錄已執行的情境、
涵蓋範圍 ID、頻道、實際使用的驅動程式與結果。頻道與驅動程式是
報告維度，不是額外的涵蓋範圍 ID 詞彙或情境
資格判定軸。

若要執行不將 Docker 帶入 QA 路徑的可拋棄式 Linux VM 通道，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass 客體、安裝相依套件、在客體
內建置 OpenClaw、執行 `qa suite`，接著將一般 QA 報告與
摘要複製回主機上的 `.artifacts/qa-e2e/...`。其重複使用的
情境選取行為與主機上的 `qa suite` 相同。

主機與 Multipass 套件執行預設會以隔離的閘道工作程式，
平行執行多個已選情境。`qa-channel` 預設
並行數為 4，上限為選取的情境數量。使用 `--concurrency
<count>` 調整工作程式數量，或使用 `--concurrency 1` 進行循序執行。
使用 `--pack personal-agent` 執行個人助理基準套件（10 個
情境）。套件選取器會與重複的 `--scenario` 旗標相加：
先執行明確指定的情境，再依套件順序執行套件情境，並
移除重複項目。當自訂 QA 執行器已提供 OpenTelemetry 收集器設定時，
使用 `--pack observability` 一併選取
`otel-trace-smoke` 與 `docker-prometheus-smoke` 情境。

任何情境失敗時，命令都會以非零狀態結束。若要取得成品
但不希望結束代碼表示失敗，請使用 `--allow-failures`。

即時執行會轉送適合供客體使用的受支援 QA 驗證輸入：
以環境為基礎的提供者金鑰、QA 即時提供者設定路徑，以及
存在時的 `CODEX_HOME`。請將 `--output-dir` 保留在儲存庫根目錄下，讓
客體能透過掛載的工作區寫回。

## Discord、Slack、Telegram 與 WhatsApp QA 參考資料

Matrix 轉接器使用上述有文件記載、以 Docker 為後端的可拋棄式通道。
Discord、Slack、Telegram 與 WhatsApp 會針對既有的真實
傳輸執行，因此其參考資料列於此處。

### 共用命令列介面旗標

這些通道會透過
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並
接受相同的旗標：

| 旗標                                  | 預設值                                            | 說明                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 僅執行此情境。可重複指定。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 寫入報告、摘要、證據、傳輸特定成品與輸出記錄的位置。相對路徑會以 `--repo-root` 為基準解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 從中立的目前工作目錄叫用時使用的儲存庫根目錄。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA 閘道設定中的臨時帳號 ID。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`、`aimock` 或 `live-frontier`。                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | 提供者預設值                                   | 主要／替代模型參照。                                                                                                                   |
| `--fast`                              | 關閉                                                | 支援時使用提供者快速模式。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | 請參閱 [Convex 認證資訊集區](#convex-credential-pool)。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                 | 使用 `--credential-source convex` 時採用的角色。                                                                                                    |
| `--allow-failures`                    | 關閉                                                | 情境失敗時寫入成品，但不傳回表示失敗的結束代碼。                                                                      |

任一情境失敗時，各通道都會以非零狀態結束。`--allow-failures` 會寫入
成品，但不設定表示失敗的結束代碼。Telegram 也接受
`--list-scenarios`，用於列印可用的情境 ID 後結束；其他通道
不提供該旗標。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私人 Telegram 群組，其中有兩個不同的機器人（驅動程式 +
受測系統）。受測系統機器人必須具有 Telegram 使用者名稱；若兩個機器人都在
`@BotFather` 中啟用 **Bot-to-Bot Communication Mode**，
機器人對機器人的觀察效果最佳。

使用 `--credential-source env` 時所需的環境變數：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 數字聊天室 ID（字串）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

`release` 設定檔會選取受維護的 Telegram YAML 情境；`all`
會新增選用的工作階段、用量、回覆鏈與串流壓力檢查。明確指定的
`--scenario` 值會覆寫設定檔。

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

`release` 設定檔一律涵蓋 canary、提及閘控、原生命令
回覆、命令定址，以及機器人對機器人的群組回覆。`mock-openai`
也包含確定性的長篇最終預覽檢查。
`telegram-current-session-status-tool` 和
`telegram-tool-only-usage-footer` 仍為選用：前者只有在 canary 之後直接串接執行時
才穩定，後者則是針對純工具回覆上的 `/usage` 頁尾進行真實 Telegram
驗證。使用 `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` 印出目前的
預設／選用劃分與迴歸參照。每個 Telegram 即時轉接器情境都使用 `--profile all`。

輸出成品：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - 即時傳輸檢查的證據項目，
  包括設定檔、涵蓋範圍、供應商、頻道、成品、結果和 RTT
  欄位。

套件 Telegram 執行使用相同的 Telegram 認證資訊合約。重複 RTT
測量是一般套件 Telegram 即時執行路徑的一部分；所選 RTT 檢查的 RTT
分布會整合至 `qa-evidence.json` 的 `result.timing` 下。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 時，套件即時包裝器會
租用 `kind: "telegram"` 認證資訊、將租用的群組／驅動程式／SUT
機器人環境匯出至已安裝套件的執行程序、對租約傳送心跳偵測，並在
關閉時釋放租約。套件包裝器預設執行 20 次
`channel-canary` RTT 檢查、使用 30s RTT 逾時，且在 CI 之外選用 Convex
時使用 Convex 角色 `maintainer`。覆寫
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`，即可調整 RTT 測量，而不必
建立個別 RTT 命令或 Telegram 專用摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

以一個具有兩個機器人的真實私人 Discord 公會頻道為目標：由測試框架控制的
驅動機器人，以及由子 OpenClaw 閘道透過隨附的 Discord 外掛啟動的 SUT
機器人。驗證頻道提及處理、SUT 機器人已向 Discord 註冊原生
`/help` 命令，以及選用的 Mantis 證據情境。

`--credential-source env` 時需要的環境變數：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須符合 Discord
  傳回的 SUT 機器人使用者 ID（否則執行路徑會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 會為
  `discord-voice-autojoin` 選取語音／舞台頻道；若未設定，情境會選取 SUT
  機器人可見的第一個語音／舞台頻道。

Discord YAML 模組情境（`qa/scenarios/channels/discord-*.yaml`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 選用的語音情境。會單獨執行、啟用
  `channels.discord.voice.autoJoin`，並驗證 SUT 機器人目前的
  Discord 語音狀態是目標語音／舞台頻道。Convex Discord
  認證資訊可包含選用的 `voiceChannelId`；否則執行器
  轉接器會探索公會中第一個可見的語音／舞台頻道。
- `discord-status-reactions-tool-only` - 選用的 Mantis 情境。會
  單獨執行，因為它會使用 `messages.statusReactions.enabled=true` 將 SUT 切換為永遠開啟的純工具
  公會回覆，接著擷取 REST
  回應時間軸及 HTML/PNG 視覺成品。Mantis 前後報告
  也會將情境提供的 MP4 成品保留為 `baseline.mp4`
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
  `discord-status-reactions-tool-only-timeline.png`（執行狀態回應
  情境時）。

### Slack QA

```bash
pnpm openclaw qa slack
```

以一個具有兩個不同機器人的真實私人 Slack 頻道為目標：由測試框架
控制的驅動機器人，以及由子 OpenClaw 閘道透過隨附的 Slack 外掛
啟動的 SUT 機器人。

`--credential-source env` 時需要的環境變數：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 會為 Mantis 啟用視覺核准
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
  已設定為停用的頻道會發出結構化警告而不回覆。
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`、`slack-progress-commentary-false`、
  `slack-progress-commentary-omitted` 和
  `slack-progress-commentary-verbose-dedupe` - 選用的真實 Slack 探查，用於
  獨立的註解／工具進度控制、略去鍵值時的舊版預設值，以及啟用持久詳細進度時的
  單次傳遞行為。
- `slack-reaction-glyph-native` - 選用的即時訊息工具回應情境。
  指示代理程式傳入完全相同的 `✅` 圖示，並確認 Slack 已為
  目標訊息上的 SUT 機器人儲存 `white_check_mark`。
- `slack-chart-presentation-native` - 選用的可攜式圖表情境，
  驗證原生 `data_visualization` 區塊和完全相同的無障礙文字。
- `slack-table-presentation-native` - 選用的可攜式表格情境，
  驗證原生 `data_table` 區塊、完全相同的資料列和無障礙文字。
- `slack-table-invalid-blocks-fallback` - 選用的直接傳輸情境，
  透過正式環境 Slack 傳送路徑，傳送一個結構上可讀、超出限制且含有 101 個資料列
  加上標題列的原始表格，證明 Slack 本身傳回 `invalid_blocks`，
  並驗證儲存的格式停用後備內容完整且不含
  原生資料區塊。情境詳細資料僅保留安全的錯誤代碼、計數和
  布林值證據。
- `slack-approval-exec-native` - 選用的原生 Slack 執行核准情境。
  透過閘道要求執行核准、驗證 Slack 訊息
  具有原生核准按鈕、解決核准，並驗證解決後的 Slack
  更新。
- `slack-approval-plugin-native` - 選用的原生 Slack 外掛核准
  情境。同時啟用執行和外掛核准轉送，使外掛
  事件不會遭執行核准路由抑制，接著驗證相同的
  待處理／已解決原生 Slack UI 路徑。
- `slack-codex-approval-exec-native` - 選用的 Codex Guardian 命令核准
  情境。以 Guardian 模式啟用 Codex 外掛，透過 Codex app-server 測試框架路由
  來自 Slack 的閘道代理程式回合，
  等候 `openclaw-codex-app-server` 的原生 Slack 外掛核准提示、
  解決核准，並驗證 Codex 回合
  以預期的命令輸出和助理標記結束。
- `slack-codex-approval-plugin-native` - 選用的 Codex Guardian 檔案核准
  情境。使用工作區外的 `apply_patch` 指令，讓 Codex 發出
  app-server 檔案變更核准路由，接著驗證相同的原生
  Slack 待處理／已解決核准路徑、最終助理標記，以及清理前完全相同的檔案
  內容。

Codex 核准情境需要 `openai/*` 或 `codex/*` `--model`、
一般即時模型認證資訊，以及 Codex 外掛接受的 Codex 驗證或 API 金鑰驗證。
情境詳細資料包含 Codex app-server 方法、所選 Codex 模型
鍵、最終 Codex 回合狀態和操作標記驗證，以及
經遮蔽的 Slack 核准中繼資料。

輸出成品：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `approval-checkpoints/` - 僅在 Mantis 設定
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 時；包含檢查點 JSON、
  確認 JSON，以及待處理／已解決螢幕截圖。

#### 設定 Slack 工作區

此執行路徑需要同一個工作區中的兩個不同 Slack 應用程式，以及一個兩個
機器人皆為成員的頻道：

- `channelId` - 已邀請兩個機器人的頻道
  `Cxxxxxxxxxx` ID。請使用專用頻道；此執行路徑每次執行都會發文。
- `driverBotToken` - **Driver** 應用程式的機器人權杖（`xoxb-...`）。
- `sutBotToken` - **SUT** 應用程式的機器人權杖（`xoxb-...`）；該應用程式必須與
  驅動程式使用不同的 Slack 應用程式，讓其機器人使用者 ID 不同。
- `sutAppToken` - 具有
  `connections:write` 的 SUT 應用程式層級權杖（`xapp-...`），由 Socket Mode 使用，讓 SUT 應用程式可以接收事件。

相較於重複使用正式環境工作區，建議優先使用 QA 專用的 Slack 工作區。

下方的 SUT 資訊清單刻意將隨附 Slack 外掛的
正式環境安裝（`extensions/slack/src/setup-shared.ts:12`）縮減為
Slack 即時 QA 套件所涵蓋的權限和事件。若要瞭解使用者所見的
正式環境頻道設定，請參閱
[Slack 頻道快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver/SUT
配對刻意分開，因為此執行路徑需要同一工作區中的兩個不同機器人使用者
ID。

**1. 建立 Driver 應用程式**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → 選取 QA 工作區、貼上下列資訊清單，
接著選取 _Install to Workspace_：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "OpenClaw QA Slack 即時執行路徑的測試驅動機器人"
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
`driverBotToken`。驅動程式只需張貼訊息並識別
自身；不需要事件，也不需要 Socket Mode。

**2. 建立 SUT 應用程式**

在同一工作區中重複執行 _Create New App → From a manifest_。這個 QA 應用程式
刻意使用隨附 Slack 外掛正式環境資訊清單
（`extensions/slack/src/setup-shared.ts:12`）的較精簡版本：由於 Slack 即時 QA 套件目前尚未涵蓋
回應處理，因此省略回應
範圍和事件。

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

Slack 建立應用程式後，請在其設定頁面執行兩項操作：

- _Install to Workspace_ → 複製 _Bot User OAuth Token_ → 這會成為
  `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 新增
  範圍 `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會
  成為 `sutAppToken`。

分別使用每個權杖呼叫 `auth.test`，確認兩個機器人具有不同的使用者 ID。
執行階段會依使用者 ID 區分驅動程式與 SUT；兩者重複使用同一個應用程式，
會導致提及閘控立即失敗。

**3. 建立頻道**

在 QA 工作區中建立頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個
機器人：

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` ID，這會
成為 `channelId`。公開頻道即可使用；如果使用私人頻道，
兩個應用程式都已具有 `groups:history`，因此測試框架仍能成功
讀取歷史記錄。

**4. 登錄認證資訊**

有兩種選項。單機偵錯時使用環境變數（設定四個
`OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或植入
共用 Convex 集區，讓 CI 和其他維護者可以租用。

若使用 Convex 集區，請將四個欄位寫入 JSON 檔案：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在 shell 中匯出 `OPENCLAW_QA_CONVEX_SITE_URL` 和 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
後，執行登錄並驗證：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

預期會有 `count: 1`、`status: "active"`，且沒有 `lease` 欄位。

**5. 驗證端對端流程**

在本機執行此測試通道，確認兩個機器人都能透過代理程式互相通訊：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功的執行會在遠低於 30 秒內完成，且 `qa-suite-report.md`
會顯示 `slack-canary` 和 `slack-mention-gating` 的狀態皆為 `pass`。如果
測試通道停滯約 90 秒後以 `Convex credential pool exhausted
for kind "slack"` 結束，表示集區為空或所有資料列都已租出；
`qa
credentials list --kind slack --status all --json` 會指出是哪一種情況。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

以兩個專用的 WhatsApp Web 帳號為目標：一個是由測試框架控制的驅動程式帳號，
另一個是由子 OpenClaw 閘道透過隨附的 WhatsApp 外掛啟動的 SUT 帳號。

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
- 使用者路徑訊息動作：`whatsapp-agent-message-action-react` 從真實的驅動程式私訊開始，
  讓模型呼叫 `message` 工具，並觀察原生 WhatsApp 表情回應。
  `whatsapp-agent-message-action-upload-file` 對 `message(action=upload-file)` 採用相同方式，並觀察
  原生 WhatsApp 媒體。`whatsapp-group-agent-message-action-react` 和
  `whatsapp-group-agent-message-action-upload-file` 會在真實 WhatsApp 群組中證明相同的
  使用者可見動作。
- 群組扇出：`whatsapp-broadcast-group-fanout` 從一則提及機器人的
  WhatsApp 群組訊息開始，並驗證來自 `main`
  和 `qa-second` 的不同可見回覆。
- 群組啟用：`whatsapp-group-activation-always` 將真實群組
  工作階段變更為 `/activation always`，證明未提及機器人的群組訊息會喚醒
  代理程式，然後還原為 `/activation mention`。
  `whatsapp-group-reply-to-bot-triggers` 會先植入機器人回覆，再對該回覆傳送
  不含明確提及的原生引用回覆，並驗證代理程式會因該回覆情境而
  喚醒。
- 傳入媒體與結構化訊息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  這些情境會透過驅動程式傳送真實的 WhatsApp 圖片、音訊、文件、位置、聯絡人、
  貼圖和表情回應事件。
- 直接閘道合約探測：`whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。這些情境刻意略過模型提示，
  並證明確定性的閘道／頻道 `send`、`poll` 和
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

目錄目前包含 52 個情境。`live-frontier` 預設測試通道
維持在精簡的 8 個情境，以提供快速的冒煙測試涵蓋範圍。`mock-openai`
預設測試通道會透過真實的 WhatsApp 傳輸，以確定性方式執行 39 個情境，
只模擬模型輸出；核准情境和少數較耗費資源／會阻塞的檢查仍須以情境 ID
明確指定。

WhatsApp QA 驅動程式會觀察結構化即時事件（`text`、`media`、
`location`、`reaction` 和 `poll`），並可主動傳送媒體、投票、
聯絡人、位置和貼圖。QA Lab 透過 `@openclaw/whatsapp/api.js` 套件介面匯入該驅動程式，
而不會存取私有的 WhatsApp 執行階段檔案。對於群組觀察，`fromJid` 是群組 JID，
而 `participantJid` 和 `fromPhoneE164` 用於識別參與者傳送者。
訊息內容預設會遮蔽。直接閘道投票、檔案上傳、媒體、群組投票、群組媒體及回覆形狀探測
屬於傳輸／API 合約檢查；不應將它們視為使用者提示使代理程式選擇相同動作的證明。
使用者路徑動作的證明來自 `whatsapp-agent-message-action-react` 和
`whatsapp-group-agent-message-action-react` 等情境，其中驅動程式會傳送一般
WhatsApp 訊息，而 QA Lab 會觀察所產生的原生 WhatsApp 成品。
WhatsApp 情境詳細資料包含每個情境的驗證方式（`user-path`、
`direct-gateway` 或 `native-approval`），因此不會誤將證據解讀為
比其實際證明範圍更強的合約。

輸出成品：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json`－即時傳輸檢查的證據項目。

### Convex 認證資訊集區

Discord、Slack、Telegram 和 WhatsApp 測試通道可從共用 Convex 集區租用認證資訊，
而不必讀取上述環境變數。傳入 `--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；
QA Lab 會取得獨占租約、在執行期間持續傳送心跳偵測，並在關閉時釋放租約。
集區種類為 `"discord"`、`"slack"`、
`"telegram"` 和 `"whatsapp"`。

代理程式在 `admin/add` 上驗證的承載資料形狀：

- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string,
sutToken: string }`－`groupId` 必須是數字聊天 ID 字串。
- Telegram 真實使用者（`kind: "telegram-user"`）：`{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`－
  僅供 Mantis Telegram Desktop 證明使用。一般 QA Lab 測試通道不得取得
  此種類。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }`－電話號碼必須是不同的 E.164 字串。

Mantis Telegram Desktop 證明工作流程會為 TDLib 命令列介面驅動程式和
Telegram Desktop 見證程式共同持有一個獨占的 Convex `telegram-user`
租約，並在發布證明後釋放。

當 PR 需要確定性的視覺差異時，Mantis 可在 `main` 和 PR
頂端使用相同的模擬模型回覆，同時變更 Telegram 格式化程式或傳遞層。
擷取預設值已針對 PR 留言調整：標準 Crabbox 類別、24fps 桌面錄影、
24fps 動態 GIF，以及 1920px 預覽寬度。變更前／後的留言應發布乾淨的
組合包，其中只包含預期的 GIF。

Slack 測試通道也可使用此集區。Slack 承載資料形狀檢查目前位於 Slack QA
執行器而非代理程式中；請使用 `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`，並搭配類似
`Cxxxxxxxxxx` 的 Slack 頻道 ID。請參閱
[設定 Slack 工作區](#setting-up-the-slack-workspace)，以瞭解應用程式
和範圍的佈建方式。

操作環境變數和 Convex 代理程式端點合約位於
[測試 → 透過 Convex 共用 Telegram 認證資訊](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)
（該章節名稱早於多頻道集區；各種類共用相同的租約語意）。

## 由儲存庫支援的種子資料

種子資產位於 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

這些內容刻意存放於 git 中，讓人員和代理程式都能看見 QA 計畫。

`qa-lab` 維持為通用 YAML 情境執行器。每個情境 YAML 檔案都是
一次測試執行的唯一真實來源，並應定義：

- 頂層 `title`
- `scenario` 中繼資料
- `scenario` 中選用的類別、能力、測試通道和風險中繼資料
- `scenario` 中的文件和程式碼參照
- `scenario` 中選用的外掛需求
- `scenario` 中選用的閘道設定修補
- 流程情境的可執行頂層 `flow`，或
  Vitest 和 Playwright 情境的 `scenario.execution.kind`／`scenario.execution.path`

支援 `flow` 的可重用執行階段介面會維持通用且
可跨領域使用。例如，YAML 情境可將傳輸端輔助工具與瀏覽器端
輔助工具結合，透過閘道 `browser.request` 接合介面驅動內嵌的 Control UI，
而無須新增特殊案例執行器。

情境檔案應依產品功能分組，而不是依原始碼
樹狀目錄分組。檔案移動時，請保持情境 ID 穩定；使用 `docsRefs` 和
`codeRefs` 來追溯實作。

基準清單應維持足夠廣泛，以涵蓋：

- 私訊與頻道聊天
- 討論串行為
- 訊息動作生命週期
- 排程回呼
- 記憶回想
- 模型切換
- 子代理交接
- 儲存庫與文件閱讀
- 一項小型建置工作，例如 Lobster Invaders

## 供應商模擬通道

`qa suite` 有兩個本機供應商模擬通道：

- `mock-openai` 是可感知情境的 OpenClaw 模擬器。它仍是
儲存庫型 QA 與一致性閘門的預設確定性模擬通道。
- `aimock` 會啟動由 AIMock 支援的供應商伺服器，以涵蓋實驗性
通訊協定、固定資料、錄製／重播與混沌測試。它是附加功能，
不會取代 `mock-openai` 情境分派器。

供應商通道實作位於 `extensions/qa-lab/src/providers/` 下。
每個供應商都負責自己的預設值、本機伺服器啟動、閘道模型設定、
認證設定檔的暫存需求，以及即時／模擬功能旗標。共用測試套件與
閘道程式碼會透過供應商登錄檔路由，而不是依供應商名稱分支。

## 傳輸配接器

`qa-lab` 為 YAML QA 情境提供通用傳輸接合介面。`qa-channel` 是
預設的合成傳輸。`crabline` 會啟動具有本機供應商形式的伺服器，並
針對它們執行 OpenClaw 的一般頻道外掛。`live` 保留給
真實供應商認證資訊與外部頻道。

在架構層級，其劃分如下：

- `qa-lab` 負責通用情境執行、工作站並行處理、成品
寫入與報告。
- 傳輸配接器負責閘道設定、就緒狀態、輸入與輸出
觀察、傳輸動作，以及正規化的傳輸狀態。
- `qa/scenarios/` 下的 YAML 情境檔案定義測試執行；`qa-lab`
  則提供執行這些情境的可重用執行階段介面。

### 新增頻道

在 YAML QA 系統中新增頻道時，除了頻道實作外，
還需要一組用來測試頻道合約的情境套件。若要提供煙霧測試 CI
涵蓋範圍，請新增對應的 Crabline 本機供應商伺服器，並透過
`crabline` 驅動程式公開該伺服器。

如果共用 `qa-lab` 主機能夠負責該流程，請勿新增頂層 QA 命令根節點。

`qa-lab` 負責共用主機機制：

- `openclaw qa` 命令根節點
- 測試套件啟動與關閉
- 工作站並行處理
- 成品寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容性別名

執行器外掛負責傳輸合約：

- 如何將 `openclaw qa <runner>` 掛載至共用 `qa` 根節點之下
- 如何為該傳輸設定閘道
- 如何檢查就緒狀態
- 如何注入輸入事件
- 如何觀察輸出訊息
- 如何公開文字記錄與正規化的傳輸狀態
- 如何執行由傳輸支援的動作
- 如何處理傳輸特有的重設或清理

採用新頻道的最低標準：

1. 讓 `qa-lab` 繼續負責共用 `qa` 根節點。
2. 在共用 `qa-lab` 主機接合介面上實作傳輸執行器。
3. 將傳輸特有的機制保留在執行器外掛或頻道
   測試框架內。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊
   相互競爭的根命令。執行器外掛應在 `openclaw.plugin.json` 中宣告
   `qaRunners`，並從 `runtime-api.ts` 匯出相符的
   `qaRunnerCliRegistrations` 陣列。保持 `runtime-api.ts` 輕量；延遲載入的命令列介面和
   執行器執行應位於不同進入點之後。選用的
   `adapterFactory` 可將傳輸公開給共用情境，而不變更
   命令的現有情境目錄。
5. 在主題式 `qa/scenarios/` 目錄下編寫或調整 YAML 情境。
6. 新情境請使用通用情境輔助工具。
7. 除非儲存庫正在進行有意的移轉，否則應維持現有相容性別名可用。

判定規則很嚴格：

- 如果某項行為可在 `qa-lab` 中表達一次，請將它放入 `qa-lab`。
- 如果行為取決於單一頻道傳輸，請將它保留在該執行器
  外掛或外掛測試框架中。
- 如果情境需要一項可供多個頻道使用的新功能，
  請新增通用輔助工具，而不是在 `suite.ts` 中新增頻道特有的分支。
- 如果某項行為只對單一傳輸有意義，請讓情境
  維持傳輸特有性，並在情境合約中明確說明。

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

現有情境仍可使用相容性別名：
`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、
`formatConversationTranscript`、`resetBus`，但編寫新情境時
應使用通用名稱。這些別名是為了避免一次性全面
移轉而存在，並非未來應採用的模型。

## 報告

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 通訊協定報告。
報告應回答：

- 哪些項目運作正常
- 哪些項目失敗
- 哪些項目仍受阻
- 哪些後續情境值得新增

若要查看可用情境的清單（這在估算後續工作
或接入新傳輸時很有用），請執行 `pnpm openclaw qa coverage`（加上
`--json` 可取得機器可讀輸出）。若要針對受影響的
行為或檔案路徑選擇聚焦驗證，請執行 `pnpm openclaw qa coverage --match <query>`。
比對報告會搜尋情境中繼資料、文件參照、程式碼參照、涵蓋範圍 ID、
外掛和供應商需求，然後列印相符的 `qa suite
--scenario ...` 目標。

每次 `qa suite` 執行都會為所選情境集合寫入頂層
`qa-evidence.json`、`qa-suite-summary.json` 和 `qa-suite-report.md`
成品。宣告 `execution.kind: vitest` 或
`execution.kind: playwright` 的情境會執行相符的測試路徑，並寫入
個別情境的日誌。宣告 `execution.kind: script` 的情境會透過
`node --import tsx` 執行 `execution.path` 的證據產生器（其中
`${outputDir}` 和 `${scenarioId}` 會在 `execution.args` 中展開）；
產生器會寫入自己的 `qa-evidence.json`，其中的項目會匯入
測試套件輸出，而其成品路徑會相對於該產生器的
`qa-evidence.json` 解析。透過 `qa run
--qa-profile` 到達
`qa suite` 時，同一份 `qa-evidence.json` 也會包含所選分類類別的
設定檔計分卡摘要。

將涵蓋範圍輸出視為探索輔助，而不是閘門的替代品；
所選情境仍需針對受測行為採用正確的供應商模式、即時傳輸、
Multipass、Testbox 或發布通道。若要瞭解計分卡背景，請參閱
[成熟度計分卡](/zh-TW/maturity/scorecard)。

若要檢查角色與風格，請對多個即時模型參照執行相同情境，
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
使用者回合，例如聊天、工作區協助和小型檔案工作。不應告知候選
模型它正在接受評估。此命令會保留每份完整文字記錄、記錄基本執行
統計資料，接著要求評審模型使用快速模式，並在支援時採用
`xhigh` 推理，依自然度、氛圍和幽默感對各次執行排名。
比較供應商時請使用 `--blind-judge-models`：評審提示仍會取得每份
文字記錄和執行狀態，但候選參照會替換為 `candidate-01` 等
中性標籤；報告會在解析後將排名對應回真實參照。

候選執行預設使用 `high` 思考層級，GPT-5.6 Luna 使用
`medium`，支援該功能的舊版 OpenAI 評估參照則使用
`xhigh`。可透過 `--model provider/model,thinking=<level>` 在行內覆寫特定
候選項目；行內選項也支援 `fast`、`no-fast`
和 `fast=<bool>`。`--thinking
<level>` 仍可設定全域備援值，而舊版
`--model-thinking
<provider/model=level>` 形式則為相容性而保留。OpenAI 候選參照預設採用
快速模式，因此會在供應商支援的情況下使用優先處理。只有想強制
所有候選模型開啟快速模式時，才傳入 `--fast`。報告會記錄候選
與評審的執行時間以供基準分析，但評審提示會明確要求不要依速度
排名。候選模型與評審模型的執行並行數均預設為 16。若供應商限制或
本機閘道壓力導致執行雜訊過多，請降低 `--concurrency` 或
`--judge-concurrency`。

未傳入候選 `--model` 時，角色評估預設使用
`openai/gpt-5.6-luna`、`openai/gpt-5.2`、`openai/gpt-5`、
`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。未傳入
`--judge-model` 時，評審預設為
`openai/gpt-5.6-sol,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-8,thinking=high`。

## 相關文件

- [成熟度計分卡](/zh-TW/maturity/scorecard)
- [個人代理基準套件](/zh-TW/concepts/personal-agent-benchmark-pack)
- [QA 頻道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
