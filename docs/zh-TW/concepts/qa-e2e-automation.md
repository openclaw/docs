---
read_when:
    - 了解 QA 堆疊如何組合運作
    - 擴充 qa-lab、qa-channel 或傳輸轉接器
    - 新增由儲存庫支援的 QA 情境
    - 圍繞閘道儀表板建置更高真實度的 QA 自動化
summary: QA 堆疊概覽：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸配接器與報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-07-06T21:47:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 593069626405668b3691717dd361f3310e148e60fdd5d9b5ac7b5c4898b2c3fd
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊會以貼近真實通道形態的方式演練 OpenClaw，這是單元測試無法做到的。

組成部分：

- `extensions/qa-channel`：合成訊息通道，具有 DM、通道、執行緒、反應、編輯與刪除介面。
- `extensions/qa-lab`：偵錯工具 UI 與 QA 匯流排，用於觀察逐字稿、注入傳入訊息，以及匯出 Markdown 報告。
- `extensions/qa-matrix`：即時傳輸配接器，會在子 QA 閘道中驅動真正的 Matrix 外掛。
- `qa/`：由 repo 支援的起始任務種子資產與基準 QA 情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器螢幕截圖、VM 狀態與 PR 證據的錯誤，進行前後即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多流程有 `pnpm qa:*` 指令碼別名；兩種形式都可使用。

| 命令                                                | 目的                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不使用 `--qa-profile` 的內建 QA 自我檢查；使用 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all` 時，會執行由分類法支援的成熟度設定檔執行器。                                                                                                   |
| `qa suite`                                          | 針對 QA 閘道通道執行 repo 支援的情境。`--runner multipass` 會使用一次性的 Linux VM，而不是主機。                                                                                                                                                                    |
| `qa coverage`                                       | 列印 YAML 情境覆蓋率清單（`--json` 用於機器輸出；`--match <query>` 用於尋找受觸及行為的情境；`--tools` 用於執行階段工具 fixture 覆蓋率）。                                                                                                                          |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案，以作為模型軸一致性閘門，或使用 `--runtime-axis --token-efficiency` 寫入 Codex 對 OpenClaw 的執行階段一致性與 token 效率報告。                                                                                                 |
| `qa confidence-report`                              | 依據 manifest 將 QA 證據成品分類成零未知的信心報告。                                                                                                                                                                                                                |
| `qa confidence-self-test`                           | 寫入植入種子的負控制 canary，證明信心閘門能偵測漂移。                                                                                                                                                                                                               |
| `qa jsonl-replay`                                   | 透過執行階段一致性重播 harness，重播精選的 JSONL 逐字稿。                                                                                                                                                                                                           |
| `qa character-eval`                                 | 在多個即時模型上執行角色 QA 情境，並產生經評判的報告。請參閱[報告](#reporting)。                                                                                                                                                                                    |
| `qa manual`                                         | 針對所選 provider/模型通道執行一次性提示。                                                                                                                                                                                                                          |
| `qa ui`                                             | 啟動 QA 偵錯工具 UI 與本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                                                                                    |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | 為 QA 儀表板 + 閘道通道寫入 docker-compose scaffold。                                                                                                                                                                                                               |
| `qa up`                                             | 建置 QA 站台、啟動 Docker 支援的堆疊，並列印 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加入 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                                                                              |
| `qa aimock`                                         | 只啟動 AIMock provider 伺服器。                                                                                                                                                                                                                                     |
| `qa mock-openai`                                    | 只啟動能感知情境的 `mock-openai` provider 伺服器。                                                                                                                                                                                                                  |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用的 Convex 憑證池。                                                                                                                                                                                                                                         |
| `qa discord`                                        | 針對真正的私有 Discord guild 通道執行即時傳輸通道。                                                                                                                                                                                                                 |
| `qa matrix`                                         | 針對一次性的 Tuwunel homeserver 執行即時傳輸通道。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                                                                                         |
| `qa slack`                                          | 針對真正的私有 Slack 通道執行即時傳輸通道。                                                                                                                                                                                                                         |
| `qa telegram`                                       | 針對真正的私有 Telegram 群組執行即時傳輸通道。                                                                                                                                                                                                                      |
| `qa whatsapp`                                       | 針對真正的 WhatsApp Web 帳號執行即時傳輸通道。                                                                                                                                                                                                                      |
| `qa mantis`                                         | 針對即時傳輸錯誤的前後驗證執行器，包含 Discord 狀態反應證據、Crabbox 桌面/瀏覽器 smoke，以及 Slack-in-VNC smoke。請參閱 [Mantis](/zh-TW/concepts/mantis) 與 [Mantis Slack 桌面版執行手冊](/zh-TW/concepts/mantis-slack-desktop-runbook)。 |

`qa matrix` 會註冊為 runner 外掛（`extensions/qa-matrix`）；以上其他每個通道都直接內建於 `qa-lab`。

### 設定檔支援的 `qa run`

設定檔支援的 `qa run` 會從 `taxonomy.yaml` 讀取成員資格，然後將解析出的情境分派到 `qa suite`。`--surface` 與 `--category` 會篩選所選設定檔，而不是定義獨立通道。產生的 `qa-evidence.json` 包含設定檔計分卡摘要，其中有已選類別計數與缺少的覆蓋率 ID；個別證據項目仍是測試、覆蓋率角色與結果的真實來源。分類法功能覆蓋率 ID 是精確的證明目標，不是別名：主要情境覆蓋率會滿足相符 ID，次要覆蓋率則保留為諮詢資訊。覆蓋率 ID 使用點分隔的 `namespace.behavior` 形式，區段為小寫英數字元/短橫線；設定檔、介面與類別 ID 仍可使用既有的短橫線或點分隔分類法 ID。

精簡證據會省略每個項目的 `execution`，並設定 `evidenceMode: "slim"`；`smoke-ci` 預設使用精簡模式，而 `--evidence-mode full` 會還原完整項目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 搭配 mock 模型 provider 與 Crabline 本機 provider 伺服器，取得可重現的設定檔證明。使用 `release` 針對即時通道取得 Stable/LTS 證明。只有在明確執行完整分類法證據時才使用 `all`；它會選取每個作用中的成熟度類別，並可透過 `QA
Profile Evidence` GitHub Actions 工作流程，以 `qa_profile=all` 分派。當命令也需要 OpenClaw 根設定檔時，請將根設定檔放在 QA 命令之前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作者流程

目前的 QA 操作者流程是一個雙窗格 QA 站台：

- 左側：含 agent 的閘道儀表板（Control UI）。
- 右側：QA Lab，顯示類似 Slack 的逐字稿與情境計畫。

執行方式：

```bash
pnpm qa:lab:up
```

這會建置 QA 站台、啟動 Docker 支援的閘道通道，並公開 QA Lab 頁面，讓操作者或自動化迴圈可以給 agent 一項 QA 任務、觀察真實通道行為，並記錄哪些運作正常、哪些失敗，或哪些仍遭阻擋。

若要更快反覆調整 QA Lab UI，而不想每次都重新建置 Docker 映像，請使用 bind-mounted QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker 服務使用預先建置的映像，並將 `extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` 容器中。
`qa:lab:watch` 會在變更時重新建置該 bundle，而當 QA Lab 資產雜湊變更時，瀏覽器會自動重新載入。

### 可觀測性 smoke

<Note>
可觀測性 QA 僅保留在原始碼 checkout 中。npm tarball 會刻意省略 QA Lab（以及 `qa-channel`/`qa-matrix`），因此套件 Docker 發行通道不會執行 `qa` 命令。變更診斷 instrumentation 時，請從已建置的原始碼 checkout 執行這些命令。
</Note>

| 別名                                    | 執行內容                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 本機 OpenTelemetry 接收器，加上啟用 `diagnostics-otel` 的 `otel-trace-smoke` 情境。                                                     |
| `pnpm qa:otel:collector-smoke`          | 位於真實 OpenTelemetry Collector Docker 容器後方的相同測試線。變更端點接線或 collector/OTLP 相容性時使用。                            |
| `pnpm qa:prometheus:smoke`              | 啟用 `diagnostics-prometheus` 的 `docker-prometheus-smoke` 情境。                                                                       |
| `pnpm qa:observability:smoke`           | 先執行 `qa:otel:smoke`，再執行 `qa:prometheus:smoke`。                                                                                 |
| `pnpm qa:observability:collector-smoke` | 先執行 `qa:otel:collector-smoke`，再執行 `qa:prometheus:smoke`。                                                                       |

`qa:otel:smoke` 會啟動本機 OTLP/HTTP 接收器，執行一次最小 QA-channel
代理程式回合，然後斷言 traces、metrics 和 logs 已匯出。它會解碼
匯出的 protobuf trace spans，並檢查 release-critical 形狀：
`openclaw.run`、`openclaw.harness.run`、最新 GenAI 語意慣例
model-call span、`openclaw.context.assembled` 和 `openclaw.message.delivery`
都必須存在。此 smoke 會強制設定
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此 model-call
span 必須使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名稱；model
calls 在成功回合中不得匯出 `StreamAbandoned`；原始診斷
ID 和 `openclaw.content.*` 屬性必須留在 trace 之外。此情境
prompt 會要求模型回覆固定標記，並保留不輸出固定
祕密字串；原始 OTLP payloads 不得包含兩者，也不得包含從情境 id
衍生的 QA session key。它會將 `otel-smoke-summary.json`
寫在 QA suite artifacts 旁邊。

`qa:prometheus:smoke` 會驗證未驗證的 scrapes 會遭拒，然後
檢查已驗證的 scrape 是否包含 release-critical metric families，
且不含 prompt 內容、response 內容、原始診斷 identifiers、auth
tokens 或本機 paths。

### Matrix smoke 測試線

若要執行不需要 model-provider 憑證的 transport-real Matrix smoke 測試線，
請使用 deterministic mock OpenAI provider 執行 fast profile：

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

若要執行 live-frontier provider 測試線，請明確提供 OpenAI-compatible 憑證：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

此測試線的完整命令列介面參考、profile/scenario catalog、env vars 和 artifact
配置都在 [Matrix QA](/zh-TW/concepts/qa-matrix)。概覽：它會在 Docker 中
佈建 disposable Tuwunel homeserver、註冊臨時
driver/SUT/observer users、在限定於該 transport 的 child QA
閘道內執行真實 Matrix 外掛（沒有 `qa-channel`），然後在
`.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown
report、JSON summary、observed-events artifact 和 combined output log。

這些情境涵蓋 unit tests 無法端對端證明的 transport 行為：
mention gating、allow-bot policies、allowlists、top-level 和 threaded
replies、DM routing、reaction handling、inbound edit suppression、restart
replay dedupe、homeserver interruption recovery、approval metadata delivery、
media handling，以及 Matrix E2EE bootstrap/recovery/verification flows。E2EE
命令列介面 profile 也會透過相同 disposable homeserver 驅動
`openclaw matrix encryption setup` 和 verification commands，之後再檢查
閘道 replies。

CI 在 `.github/workflows/qa-live-transports-convex.yml` 使用相同 command surface。
排程和預設手動執行會使用 QA-provided live-frontier
憑證、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`
執行 fast Matrix profile。手動 `matrix_profile=all` 會展開成五個 profile shards：
`transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli`。

### Discord Mantis 情境

Discord 也有僅供 Mantis opt-in 的 bug reproduction 情境。使用
`--scenario discord-status-reactions-tool-only` 取得明確 status
reaction timeline，或使用 `--scenario discord-thread-reply-filepath-attachment`
建立真實 Discord thread，並驗證 `message.thread-reply`
會保留 `filePath` attachment。這些情境不在預設 live Discord
測試線中，因為它們是 before/after repro probes，而不是
廣泛的 smoke coverage。當 QA 環境中設定
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 時，thread-attachment Mantis workflow
也可以加入已登入 Discord Web 的 witness video。該 viewer profile
僅用於 visual capture；pass/fail 決策仍來自 Discord REST oracle。

若要執行 transport-real Discord、Slack、Telegram 和 WhatsApp smoke 測試線：

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

它們會以預先存在且具備兩個 bots 或 accounts（driver +
SUT）的真實 channel 為目標。必要 env vars、scenario lists、output artifacts
和 Convex credential pool 記錄在下方的
[Discord、Slack、Telegram 和 WhatsApp QA 參考](#discord-slack-telegram-and-whatsapp-qa-reference)。

### Mantis Slack desktop 和 visual-task runners

若要執行具備 VNC rescue 的完整 Slack desktop VM 執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用 Crabbox desktop/browser machine、在 VM 內執行 Slack live
測試線、於 VNC browser 開啟 Slack Web、擷取 desktop，
並將 `slack-qa/`、`slack-desktop-smoke.png` 和
`slack-desktop-smoke.mp4`（可用 video capture 時）複製回
Mantis artifact directory。Crabbox desktop/browser leases 會預先提供 capture
tools 和 browser/native-build helper packages，因此此情境
應只在較舊 leases 上安裝 fallbacks。Mantis 會在
`mantis-slack-desktop-smoke-report.md` 中報告 total 和
per-phase timings，讓緩慢執行顯示時間是花在 lease warmup、credential acquisition、remote setup
還是 artifact copy。透過 VNC 手動登入 Slack Web 後，可使用
`--lease-id <cbx_...>` 重用；重用 leases 也會保持 Crabbox 的 pnpm store cache
處於 warm 狀態。預設 `--hydrate-mode source` 會從 source checkout 驗證，
並在 VM 內執行 install/build。只有在重用的 remote workspace 已有
`node_modules` 和已建置的 `dist/` 時，才使用 `--hydrate-mode prehydrated`；
該模式會跳過昂貴的 install/build 步驟，並在 workspace 尚未就緒時 fail closed。
使用 `--gateway-setup` 時，Mantis 會在 VM 內的 port `38973`
留下持續執行的 OpenClaw Slack 閘道；未使用時，命令會執行一般
bot-to-bot Slack QA 測試線，並在 artifact capture 後結束。

若要以 desktop evidence 證明 native Slack approval UI，請執行 Mantis
approval checkpoint mode：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

此模式與 `--gateway-setup` 互斥。它會執行 Slack
approval 情境、拒絕 non-approval scenario ids、在每個 pending
和 resolved approval state 等待，將觀察到的 Slack API message 渲染成
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`，然後在任何 checkpoint、
message evidence、acknowledgement 或 rendered screenshot 遺失或
為空時失敗。Cold CI leases 仍可能在
`slack-desktop-smoke.png` 顯示 Slack sign-in；approval checkpoint images
才是此測試線的 visual proof。

預設 checkpoint 執行會保留兩個標準 Slack approval 情境。
若要擷取任一 opt-in Codex approval route，請使用
`--scenario slack-codex-approval-exec-native` 或
`--scenario slack-codex-approval-plugin-native` 明確選取；Mantis 會接受兩者並輸出
相同的 pending/resolved screenshot pair。runner 會為每個選取的 Codex route
擴展其 checkpoint 和 remote-command deadlines，讓完整的
approval、agent completion 和 resolved-update sequence 可以完成。

operator checklist、GitHub workflow dispatch command、evidence-comment
contract、hydrate-mode decision table、timing interpretation 和 failure
handling steps 都在
[Mantis Slack Desktop Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。

若要執行 agent/CV 風格的 desktop task：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` 會租用或重用 Crabbox desktop/browser machine、啟動
`crabbox record --while`、透過巢狀 `visual-driver` 驅動可見 browser、
擷取 `visual-task.png`、在選取 `--vision-mode image-describe` 時
針對 screenshot 執行 `openclaw infer image describe`，並寫入
`visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和
`mantis-visual-task-report.md`。設定 `--expect-text` 時，vision
prompt 會要求結構化 JSON verdict（`visible`、`evidence`、`reason`），
且只有在模型回報 `visible: true` 並提供引用 expected text 的 evidence 時才通過；
僅引用 target text 的 `visible: false` response 仍會讓 assertion 失敗。
使用 `--vision-mode metadata` 可執行 no-model smoke，以證明 desktop、browser、screenshot
和 video plumbing，而不呼叫 image-understanding provider。Recording 是
`visual-task` 的必要 artifact；如果 Crabbox 未錄製非空的
`visual-task.mp4`，即使 visual driver 通過，task 也會失敗。
失敗時，除非 task 已通過且未設定 `--keep-lease`，Mantis 會保留 lease
供 VNC 使用。

### Credential pool health check

使用 pooled live credentials 前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

doctor 會檢查 Convex broker env（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`）、驗證 endpoint settings、只回報
`OPENCLAW_QA_CONVEX_SECRET_CI` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 的 set/missing status，並在
maintainer secret 存在時驗證 admin/list reachability。

## Live transport coverage

Live transport 測試線共享同一份 contract，而不是各自發明自己的
scenario list 形狀。`qa-channel` 是廣泛的 synthetic product-behavior
suite，不屬於 live transport coverage matrix。

Live transport runners 會從
`openclaw/plugin-sdk/qa-live-transport-scenarios`
匯入 shared scenario ids、baseline coverage helpers
和 scenario-selection helper。

| 通道     | Canary | 提及門檻 | Bot-to-bot | 允許清單封鎖 | 頂層回覆 | 引用回覆 | 重啟續接 | 執行緒後續 | 執行緒隔離 | 反應觀察 | Help command | 原生命令註冊 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

這會讓 `qa-channel` 保持作為涵蓋廣泛產品行為的測試套件，同時 Matrix、
Telegram 與其他即時傳輸共用一份明確的傳輸合約
檢查清單。

若要執行一次性 Linux VM 通道，且不把 Docker 帶入 QA 路徑，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass guest、安裝依賴項、在 guest 內建置 OpenClaw、
執行 `qa suite`，接著把一般 QA 報告與
摘要複製回主機的 `.artifacts/qa-e2e/...`。它會重用與主機上 `qa suite` 相同的
情境選擇行為。

主機與 Multipass 套件執行預設會以隔離的閘道 worker
平行執行多個已選情境。`qa-channel` 預設為
並行度 4，並受已選情境數量上限限制。使用 `--concurrency
<count>` 調整 worker 數量，或使用 `--concurrency 1` 進行序列執行。
使用 `--pack personal-agent` 執行個人助理基準套件（10 個
情境）。套件選擇器會與重複的 `--scenario` 旗標相加：
明確情境會先執行，接著套件情境會依套件順序執行，
並移除重複項目。當自訂 QA runner 已提供 OpenTelemetry collector 設定時，
使用 `--pack observability` 可一併選取
`otel-trace-smoke` 與 `docker-prometheus-smoke` 情境。

當任何情境失敗時，此命令會以非零狀態結束。若你想取得成品但不讓結束碼表示失敗，
請使用 `--allow-failures`。

即時執行會轉送對 guest 實用的受支援 QA 驗證輸入：
以 env 為基礎的 provider key、QA 即時 provider 設定路徑，以及
存在時的 `CODEX_HOME`。請將 `--output-dir` 保持在 repo root 底下，讓
guest 能透過掛載的工作區寫回。

## Discord、Slack、Telegram 與 WhatsApp QA 參考

Matrix 有[專屬頁面](/zh-TW/concepts/qa-matrix)，因為它的情境
數量與 Docker 支援的 homeserver 供應。Discord、Slack、Telegram
與 WhatsApp 會針對既有的真實傳輸執行，因此它們的參考
位於此處。

### 共用命令列介面旗標

這些通道會透過
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並
接受相同旗標：

| 旗標                                  | 預設值                                            | 說明                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 只執行此情境。可重複。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 報告、摘要、證據、傳輸特定成品與輸出記錄檔寫入的位置。相對路徑會以 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 從中立 cwd 呼叫時的 repository root。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA 閘道設定中的暫時帳號 id。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可運作）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | provider 預設值                                   | 主要／替代 model refs。                                                                                                                   |
| `--fast`                              | 關閉                                                | provider 支援時的快速模式。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | 請參閱 [Convex credential pool](#convex-credential-pool)。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，其他情況為 `maintainer`                 | 使用 `--credential-source convex` 時使用的角色。                                                                                                    |

每個通道在任何情境失敗時都會以非零狀態結束。`--allow-failures` 會寫入
成品，但不設定失敗結束碼。Telegram 也接受
`--list-scenarios` 以列印可用情境 id 並結束；其他通道
不公開該旗標。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私人 Telegram 群組，包含兩個不同 bot（driver +
SUT）。SUT bot 必須有 Telegram 使用者名稱；當兩個 bot 都在
`@BotFather` 中啟用 **Bot-to-Bot Communication Mode** 時，bot-to-bot 觀察效果
最佳。

當 `--credential-source env` 時需要的 env：

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 數字 chat id（字串）。
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

隱含的預設集合一律涵蓋 canary、提及門檻、原生命令
回覆、命令定址，以及 bot-to-bot 群組回覆。`mock-openai`
預設值也包含確定性的回覆鏈與最終訊息串流
檢查。`telegram-current-session-status-tool` 與
`telegram-tool-only-usage-footer` 仍為選擇性加入：前者只有在
直接接在 canary 之後串接時才穩定，而後者是 `/usage` footer
在純工具回覆上的真實 Telegram 證明。使用 `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` 列印目前的
預設／選用分割與 regression refs。

輸出成品：

- `telegram-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目，
  包含 profile、coverage、provider、channel、artifacts、result 與 RTT
  欄位。

套件 Telegram 執行使用相同的 Telegram credential 合約。重複 RTT
測量是一般套件 Telegram 即時通道的一部分；RTT
分佈會針對已選 RTT 檢查摺疊進 `qa-evidence.json` 的 `result.timing`。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

當設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 時，套件即時 wrapper
會租用一個 `kind: "telegram"` credential，將租用的 group/driver/SUT
bot env 匯出到已安裝套件的執行中，對租約進行心跳偵測，並在
關閉時釋放它。當選擇 Convex 時，套件 wrapper 在 CI 外預設為
`telegram-mentioned-message-reply` 進行 20 次 RTT 檢查、30s RTT timeout，
以及 Convex role `maintainer`。覆寫
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`，可調整 RTT 測量而不需
建立獨立的 RTT 命令或 Telegram 特定摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私人 Discord guild channel，包含兩個 bot：由 harness
控制的 driver bot，以及由 child OpenClaw 閘道透過 bundled Discord 外掛
啟動的 SUT bot。驗證 channel mention handling、SUT bot 已向 Discord
註冊原生 `/help` 命令，以及選用的 Mantis 證據情境。

當 `--credential-source env` 時需要的 env：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須符合 Discord 回傳的 SUT bot user id
  （否則此通道會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在
  observed-message 成品中保留訊息本文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 會為
  `discord-voice-autojoin` 選取 voice/stage channel；沒有它時，此情境會選擇
  SUT bot 可見的第一個 voice/stage channel。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 選用 voice 情境。單獨執行，啟用
  `channels.discord.voice.autoJoin`，並驗證 SUT bot 目前的
  Discord voice state 是目標 voice/stage channel。Convex Discord
  credentials 可包含選用的 `voiceChannelId`；否則 runner
  會在 guild 中探索第一個可見的 voice/stage channel。
- `discord-status-reactions-tool-only` - 選用 Mantis 情境。會單獨
  執行，因為它會將 SUT 切換為 always-on、tool-only guild replies
  並設定 `messages.statusReactions.enabled=true`，然後擷取 REST
  reaction timeline 以及 HTML/PNG 視覺成品。Mantis before/after
  報告也會保留情境提供的 MP4 成品為 `baseline.mp4`
  與 `candidate.mp4`。
- `discord-thread-reply-filepath-attachment` - 選用 Mantis 情境；請參閱
  [Discord Mantis 情境](#discord-mantis-scenarios)。

明確執行 Discord voice auto-join 情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

明確執行 Mantis status-reaction 情境：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

輸出產物：

- `discord-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `discord-qa-observed-messages.json` - 內文會被遮罩，除非
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`。
- 執行狀態回應情境時，會產生 `discord-qa-reaction-timelines.json` 和
  `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

目標是一個真實的私人 Slack 頻道，並使用兩個不同的機器人：一個由測試框架控制的 driver 機器人，以及一個由子 OpenClaw 閘道透過內建 Slack 外掛啟動的 SUT 機器人。

使用 `--credential-source env` 時需要的環境變數：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在 observed-message 產物中保留訊息內文。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 會為 Mantis 啟用視覺核准檢查點。執行器會寫入 `<scenario>.pending.json` 和
  `<scenario>.resolved.json`，然後等待對應的 `.ack.json` 檔案。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` 會覆寫檢查點確認逾時。預設值為 `120000`。

情境（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-reaction-glyph-native` - 選擇啟用的即時 message-tool 回應情境。指示代理傳入確切的 `✅` 字符，並確認 Slack 在目標訊息上為 SUT 機器人儲存了 `white_check_mark`。
- `slack-approval-exec-native` - 選擇啟用的原生 Slack exec 核准情境。透過閘道請求 exec 核准，驗證 Slack 訊息具有原生核准按鈕，解析該核准，並驗證解析後的 Slack 更新。
- `slack-approval-plugin-native` - 選擇啟用的原生 Slack 外掛核准情境。同時啟用 exec 和外掛核准轉送，讓外掛事件不會被 exec 核准路由抑制，然後驗證相同的待處理/已解析原生 Slack UI 路徑。
- `slack-codex-approval-exec-native` - 選擇啟用的 Codex Guardian 命令核准情境。以 Guardian 模式啟用 Codex 外掛，將源自 Slack 的閘道代理回合透過 Codex app-server 測試框架路由，等待 `openclaw-codex-app-server` 的原生 Slack 外掛核准提示，解析該提示，並驗證 Codex 回合以預期的命令輸出與助理標記完成。
- `slack-codex-approval-plugin-native` - 選擇啟用的 Codex Guardian 檔案核准情境。使用工作區外的 `apply_patch` 指令，讓 Codex 發出 app-server 檔案變更核准路由，然後驗證相同的原生 Slack 待處理/已解析核准路徑、最終助理標記，以及清理前的確切檔案內容。

Codex 核准情境需要 `openai/*` 或 `codex/*` `--model`、一般即時模型憑證，以及 Codex 外掛接受的 Codex 驗證或 API 金鑰驗證。Slack 報告會包含 Codex app-server 方法、選取的 Codex 模型鍵、最終 Codex 回合狀態，以及操作標記驗證，並列顯示經遮罩的 Slack 核准中繼資料。

輸出產物：

- `slack-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `slack-qa-observed-messages.json` - 內文會被遮罩，除非
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`。
- `approval-checkpoints/` - 只有在 Mantis 設定
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 時才會產生；包含檢查點 JSON、確認 JSON，以及待處理/已解析的截圖。

#### 設定 Slack 工作區

此管線需要同一個工作區中的兩個不同 Slack 應用程式，以及一個兩個機器人皆為成員的頻道：

- `channelId` - 兩個機器人都已受邀加入的頻道 `Cxxxxxxxxxx` ID。請使用專用頻道；此管線每次執行都會發文。
- `driverBotToken` - **Driver** 應用程式的機器人 token（`xoxb-...`）。
- `sutBotToken` - **SUT** 應用程式的機器人 token（`xoxb-...`），必須是與 driver 不同的 Slack 應用程式，讓其機器人使用者 ID 不同。
- `sutAppToken` - 具有 `connections:write` 的 SUT 應用程式 app-level token（`xapp-...`），供 Socket Mode 使用，讓 SUT 應用程式可以接收事件。

建議使用專供 QA 的 Slack 工作區，而不是重用正式環境工作區。

下方 SUT manifest 刻意將內建 Slack 外掛的正式安裝（`extensions/slack/src/setup-shared.ts:12`）縮小為即時 Slack QA 套件涵蓋的權限與事件。若要查看使用者所見的正式頻道設定，請參閱
[Slack 頻道快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver/SUT 組合刻意分開，因為此管線需要同一工作區中的兩個不同機器人使用者 ID。

**1. 建立 Driver 應用程式**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → 選取 QA 工作區，貼上下列 manifest，然後 _Install to Workspace_：

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

複製 _Bot User OAuth Token_（`xoxb-...`）- 這會成為 `driverBotToken`。Driver 只需要發送訊息並識別自身；不需要事件，也不需要 Socket Mode。

**2. 建立 SUT 應用程式**

在同一個工作區重複 _Create New App → From a manifest_。此 QA 應用程式刻意使用內建 Slack 外掛正式 manifest（`extensions/slack/src/setup-shared.ts:12`）的較窄版本：省略 reaction scopes 和事件，因為即時 Slack QA 套件尚未涵蓋 reaction 處理。

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
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 新增
  scope `connections:write` → 儲存 → 複製 `xapp-...` 值 → 這會成為
  `sutAppToken`。

對每個 token 呼叫 `auth.test`，確認兩個機器人具有不同的使用者 ID。執行階段會依使用者 ID 區分 driver 與 SUT；兩者重用同一個應用程式會讓 mention-gating 立即失敗。

**3. 建立頻道**

在 QA 工作區中建立頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個機器人：

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` ID - 這會成為 `channelId`。公開頻道可以使用；如果你使用私人頻道，兩個應用程式已經有 `groups:history`，因此測試框架的歷史讀取仍會成功。

**4. 登錄憑證**

有兩種選項。單機除錯可使用環境變數（設定四個 `OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或植入共享 Convex 集區，讓 CI 和其他維護者可以租用它們。

若使用 Convex 集區，請將四個欄位寫入 JSON 檔案：

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

預期會看到 `count: 1`、`status: "active"`，且沒有 `lease` 欄位。

**5. 驗證端到端**

在本機執行此管線，以確認兩個機器人可以透過 broker 彼此通訊：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功執行會在遠低於 30 秒內完成，且 `slack-qa-report.md` 會顯示 `slack-canary` 和 `slack-mention-gating` 的狀態皆為 `pass`。如果管線停滯約 90 秒後以 `Convex credential pool exhausted for kind "slack"` 結束，代表集區是空的，或每一列都已被租用 - `qa credentials list --kind slack --status all --json` 會告訴你是哪一種情況。

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
  `whatsapp-group-reply-to-bot-triggers`、群組動作/媒體/投票情境，以及 `whatsapp-group-allowlist-block`。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` 會在 observed-message 產物中保留訊息內文。

情境目錄（`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`）：

- 基準與群組門檻：`whatsapp-canary`、`whatsapp-pairing-block`、
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
- 使用者路徑訊息動作：`whatsapp-agent-message-action-react` 會從真實驅動程式私訊開始，讓模型呼叫 `message` 工具，並觀察原生 WhatsApp 回應。`whatsapp-agent-message-action-upload-file` 針對 `message(action=upload-file)` 使用相同姿態，並觀察原生 WhatsApp 媒體。`whatsapp-group-agent-message-action-react` 與
  `whatsapp-group-agent-message-action-upload-file` 證明真實 WhatsApp 群組中相同的使用者可見動作。
- 群組扇出：`whatsapp-broadcast-group-fanout` 會從一則提及的 WhatsApp 群組訊息開始，並驗證來自 `main` 與 `qa-second` 的不同可見回覆。
- 群組啟用：`whatsapp-group-activation-always` 會將真實群組工作階段變更為 `/activation always`，證明未提及的群組訊息會喚醒代理，然後還原為 `/activation mention`。
  `whatsapp-group-reply-to-bot-triggers` 會植入一則機器人回覆，傳送一則未明確提及它的原生引用回覆，並驗證代理會從該回覆脈絡中醒來。
- 傳入媒體與結構化訊息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  這些會透過驅動程式傳送真實 WhatsApp 圖片、音訊、文件、位置、聯絡人、貼圖與回應事件。
- 直接閘道合約探測：`whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。這些會刻意略過模型提示，並證明確定性的閘道/通道 `send`、`poll` 與
  `message.action` 合約。
- 存取控制涵蓋範圍：`whatsapp-access-control-dm-open`、
  `whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、
  `whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- 原生核准：`whatsapp-approval-exec-deny-native`、
  `whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、
  `whatsapp-approval-exec-group-reaction-native`、
  `whatsapp-approval-plugin-native`。
- 狀態回應：`whatsapp-status-reactions`、
  `whatsapp-status-reaction-lifecycle`。

目錄目前包含 52 個情境。`live-frontier` 預設通道維持精簡，包含 10 個情境，以便快速提供煙霧涵蓋。`mock-openai` 預設通道會透過真實 WhatsApp 傳輸確定性地執行 45 個情境，僅模擬模型輸出；核准情境與少數較重/阻塞的檢查仍需以情境 ID 明確指定。

WhatsApp QA 驅動程式會觀察結構化即時事件（`text`、`media`、`location`、`reaction` 與 `poll`），並可主動傳送媒體、投票、聯絡人、位置與貼圖。QA Lab 會透過 `@openclaw/whatsapp/api.js` 套件介面匯入該驅動程式，而不是觸及私有 WhatsApp 執行階段檔案。對於群組觀察，`fromJid` 是群組 JID，而 `participantJid` 與 `fromPhoneE164` 會識別參與者傳送者。訊息內容預設會遮蔽。直接閘道投票、upload-file、媒體、群組投票、群組媒體與 reply-shape 探測是傳輸/API 合約檢查；它們不會被視為使用者提示讓代理選擇相同動作的證明。使用者路徑動作證明來自 `whatsapp-agent-message-action-react` 與
`whatsapp-group-agent-message-action-react` 等情境，其中驅動程式會傳送一般 WhatsApp 訊息，而 QA Lab 會觀察產生的原生 WhatsApp 成果物。WhatsApp 報告會包含每個情境的姿態（`user-path`、`direct-gateway` 或 `native-approval`），因此證據不會被誤認為比實際證明更強的合約。

輸出成果物：

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `whatsapp-qa-observed-messages.json` - 除非設定
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`，否則本文會被遮蔽。

### Convex 憑證池

Discord、Slack、Telegram 與 WhatsApp 通道可以從共用 Convex 池租用憑證，而不是讀取上述環境變數。傳入
`--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；
QA Lab 會取得獨占租約，在執行期間對它進行心跳偵測，並在關閉時釋放。池種類為 `"discord"`、`"slack"`、
`"telegram"` 與 `"whatsapp"`。

代理在 `admin/add` 上驗證的酬載形狀：

- Discord（`kind: "discord"`）：`{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Telegram（`kind: "telegram"`）：`{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` 必須是數字 chat-id 字串。
- Telegram 真實使用者（`kind: "telegram-user"`）：`{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  僅供 Mantis Telegram Desktop 證明使用。一般 QA Lab 通道不得取得此種類。
- WhatsApp（`kind: "whatsapp"`）：`{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 電話號碼必須是不同的 E.164 字串。

Mantis Telegram Desktop 證明工作流程會持有一個獨占 Convex
`telegram-user` 租約，同時供 TDLib 命令列介面驅動程式與 Telegram Desktop 見證者使用，然後在發布證明後釋放。

當 PR 需要確定性的視覺差異時，Mantis 可以在 `main` 與 PR head 上使用相同的模擬模型回覆，同時變更 Telegram 格式器或傳遞層。擷取預設值已針對 PR 留言調整：標準 Crabbox 類別、24fps 桌面錄影、24fps 動作 GIF，以及 1920px 預覽寬度。前後比較留言應發布乾淨的套件組合，只包含預期的 GIF。

Slack 通道也可以使用該池。Slack 酬載形狀檢查目前位於 Slack QA 執行器，而不是代理；請使用 `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`，並搭配像 `Cxxxxxxxxxx` 這樣的 Slack 通道 ID。請參閱
[設定 Slack 工作區](#setting-up-the-slack-workspace) 以取得應用程式與範圍佈建資訊。

操作環境變數與 Convex 代理端點合約位於
[測試 → 透過 Convex 共用 Telegram 憑證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)
（該章節名稱早於多通道池；租約語意在各種類之間共用）。

## 儲存庫支援的種子

種子資產位於 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

這些刻意保存在 git 中，因此 QA 計畫對人類與代理都可見。

`qa-lab` 會維持為通用 YAML 情境執行器。每個情境 YAML 檔案都是一次測試執行的真實來源，並應定義：

- 頂層 `title`
- `scenario` 中繼資料
- `scenario` 中的選用類別、能力、通道與風險中繼資料
- `scenario` 中的文件與程式碼參照
- `scenario` 中的選用外掛需求
- `scenario` 中的選用閘道設定修補
- 供流程情境使用的可執行頂層 `flow`，或供 Vitest 與
  Playwright 情境使用的 `scenario.execution.kind` / `scenario.execution.path`

支援 `flow` 的可重用執行階段介面會維持通用且跨領域。例如，YAML 情境可以結合傳輸端協助程式與瀏覽器端協助程式，透過閘道 `browser.request` 介面驅動嵌入式 Control UI，而不需要新增特殊案例執行器。

情境檔案應依產品能力分組，而不是依原始碼樹資料夾分組。檔案移動時請保持情境 ID 穩定；使用 `docsRefs` 與
`codeRefs` 追蹤實作。

基準清單應保持足夠廣泛，以涵蓋：

- 私訊與通道聊天
- 執行緒行為
- 訊息動作生命週期
- 排程回呼
- 記憶回想
- 模型切換
- 子代理交接
- 儲存庫讀取與文件讀取
- 一個小型建置任務，例如 Lobster Invaders

## 供應商模擬通道

`qa suite` 有兩個本機供應商模擬通道：

- `mock-openai` 是具情境感知的 OpenClaw 模擬。它仍是儲存庫支援 QA 與同等性閘門的預設確定性模擬通道。
- `aimock` 會啟動 AIMock 支援的供應商伺服器，用於實驗性協定、fixture、錄製/重播與混沌涵蓋。它是附加的，不會取代 `mock-openai` 情境分派器。

供應商通道實作位於 `extensions/qa-lab/src/providers/`。每個供應商都擁有自己的預設值、本機伺服器啟動、閘道模型設定、驗證設定檔暫存需求，以及即時/模擬能力旗標。共用套件與閘道程式碼會透過供應商登錄路由，而不是依供應商名稱分支。

## 傳輸配接器

`qa-lab` 擁有 YAML QA 情境的通用傳輸介面。`qa-channel` 是合成預設值。`crabline` 會啟動本機供應商形狀伺服器，並針對它們執行 OpenClaw 的一般通道外掛。`live` 保留給真實供應商憑證與外部通道。

在架構層級，其拆分為：

- `qa-lab` 擁有通用情境執行、工作者並行、成果物寫入與報告。
- 傳輸配接器擁有閘道設定、就緒狀態、傳入與傳出觀察、傳輸動作，以及正規化傳輸狀態。
- `qa/scenarios/` 下的 YAML 情境檔案定義測試執行；`qa-lab` 提供執行它們的可重用執行階段介面。

### 新增通道

將通道新增至 YAML QA 系統需要通道實作，以及會演練通道合約的情境套件。若要取得煙霧 CI 涵蓋，請新增相符的 Crabline 本機供應商伺服器，並透過 `crabline` 驅動程式公開它。

當共用 `qa-lab` 主機可以擁有流程時，請不要新增新的頂層 QA 命令根。

`qa-lab` 擁有共用主機機制：

- `openclaw qa` 命令根
- 套件啟動與拆除
- 工作者並行
- 成果物寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容性別名

執行器外掛擁有傳輸合約：

- `openclaw qa <runner>` 如何掛載在共用 `qa` 根底下
- 如何針對該傳輸設定閘道
- 如何檢查就緒狀態
- 如何注入傳入事件
- 如何觀察傳出訊息
- 如何公開逐字記錄與正規化傳輸狀態
- 如何執行傳輸支援的動作
- 如何處理傳輸特定的重設或清理

新通道的最低採用門檻：

1. 保持 `qa-lab` 作為共用 `qa` 根層的擁有者。
2. 在共用的 `qa-lab` 主機接縫上實作傳輸執行器。
3. 將傳輸專屬機制保留在執行器外掛或通道
   測試框架內。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊一個
   競爭性的根命令。執行器外掛應在
   `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts` 匯出相符的 `qaRunnerCliRegistrations`
   陣列。保持 `runtime-api.ts` 輕量；延遲命令列介面和
   執行器執行應留在獨立進入點後方。選用的
   `adapterFactory` 會將傳輸暴露給共用情境，而不改變
   命令現有的情境目錄。
5. 在主題式 `qa/scenarios/`
   目錄下撰寫或調整 YAML 情境。
6. 對新情境使用通用情境輔助工具。
7. 保持現有相容性別名可用，除非 repo 正在進行
   有意的遷移。

決策規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，就放在 `qa-lab`。
- 如果行為依賴單一通道傳輸，將其保留在該執行器
  外掛或外掛測試框架中。
- 如果某個情境需要一項可供多個通道使用的新能力，
  新增通用輔助工具，而不是在 `suite.ts` 中加入通道專屬分支。
- 如果某個行為只對單一傳輸有意義，請將該情境
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

相容性別名仍可供現有情境使用 -
`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、
`formatConversationTranscript`、`resetBus` - 但新情境撰寫
應使用通用名稱。這些別名是為了避免一次性
遷移，而不是未來的模型。

## 回報

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 協定報告。
報告應回答：

- 哪些項目運作正常
- 哪些項目失敗
- 哪些項目仍受阻
- 哪些後續情境值得新增

若要取得可用情境清單 - 在評估後續工作規模
或接入新傳輸時很有用 - 請執行 `pnpm openclaw qa coverage`（加入 `--json`
可取得機器可讀輸出）。在為已觸及的
行為或檔案路徑選擇聚焦驗證時，請執行 `pnpm openclaw qa coverage --match <query>`。比對報告會搜尋情境中繼資料、文件參照、程式碼參照、覆蓋率 ID、
外掛和提供者需求，然後列印相符的 `qa suite
--scenario ...` 目標。

每次 `qa suite` 執行都會為所選
情境集寫入頂層 `qa-evidence.json`、
`qa-suite-summary.json` 和 `qa-suite-report.md` 成果物。宣告 `execution.kind: vitest` 或
`execution.kind: playwright` 的情境會執行相符的測試路徑，並且也會寫入
各情境記錄。宣告 `execution.kind: script` 的情境會透過 `node --import tsx` 執行
位於 `execution.path` 的證據產生器（在 `execution.args` 中展開
`${outputDir}` 和 `${scenarioId}`）；該
產生器會寫入自己的 `qa-evidence.json`，其項目會匯入
套件輸出，而其成果物路徑會相對於該
產生器的 `qa-evidence.json` 解析。當透過 `qa run
--qa-profile` 到達 `qa suite` 時，同一份 `qa-evidence.json` 也會包含所選分類法類別的設定檔
計分卡摘要。

將覆蓋率輸出視為探索輔助，而不是門檻替代；所選
情境仍需要針對受測行為使用正確的提供者模式、即時傳輸、
Multipass、Testbox 或發布通道。如需
計分卡背景，請參閱[成熟度計分卡](/zh-TW/maturity/scorecard)。

若要進行角色與風格檢查，請在多個即時
模型參照上執行相同情境，並寫出經評判的 Markdown 報告：

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
評估情境應透過 `SOUL.md` 設定 persona，然後執行一般
使用者回合，例如聊天、工作區協助和小型檔案任務。不應告知候選
模型它正在接受評估。此命令會保留
每份完整逐字稿、記錄基本執行統計資料，然後以
快速模式請評判模型在支援處使用 `xhigh` reasoning，依自然度、氛圍和幽默感
對執行結果排名。比較
提供者時使用 `--blind-judge-models`：評判提示仍會取得每份逐字稿和執行狀態，但
候選參照會替換為中性標籤，例如 `candidate-01`；報告會在剖析後將排名映射回
真實參照。

候選執行預設使用 `high` thinking，GPT-5.5 使用 `medium`，
較舊且支援的 OpenAI 評估參照使用 `xhigh`。可用
`--model provider/model,thinking=<level>` 內嵌覆寫特定
候選；內嵌選項也支援 `fast`、`no-fast` 和 `fast=<bool>`。`--thinking
<level>` 仍會設定全域備援，而較舊的 `--model-thinking
<provider/model=level>` 形式則保留作為相容性用途。OpenAI 候選
參照預設使用快速模式，以便在提供者
支援時使用優先處理。只有在你想強制所有
候選模型都啟用快速模式時，才傳入 `--fast`。候選與評判持續時間會記錄在
報告中用於基準分析，但評判提示會明確要求不要依速度
排名。候選與評判模型執行預設並行度皆為 16。
當提供者限制或本機
閘道壓力使執行過於嘈雜時，請降低 `--concurrency` 或 `--judge-concurrency`。

未傳入候選 `--model` 時，角色評估預設為
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、
`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。未傳入
`--judge-model` 時，評判預設為
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-8,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [成熟度計分卡](/zh-TW/maturity/scorecard)
- [個人代理基準套件](/zh-TW/concepts/personal-agent-benchmark-pack)
- [QA 通道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
