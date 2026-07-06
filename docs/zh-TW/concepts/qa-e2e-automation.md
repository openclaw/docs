---
read_when:
    - 了解 QA 堆疊如何協同運作
    - 擴充 qa-lab、qa-channel 或傳輸配接器
    - 新增以儲存庫支援的 QA 情境
    - 圍繞閘道儀表板建置更高真實度的 QA 自動化
summary: QA 堆疊概覽：qa-lab、qa-channel、由儲存庫支援的情境、即時傳輸通道、傳輸配接器，以及報告。
title: QA 概覽
x-i18n:
    generated_at: "2026-07-06T10:49:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a2d0f1edc82e778dbecf91c798cca5ef58468579248c40818715aa5c1cb5207
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

私有 QA 堆疊會以貼近真實、符合通道形態的方式演練 OpenClaw，這是單元測試無法做到的。

組成：

- `extensions/qa-channel`：合成訊息通道，具備 DM、頻道、討論串、
  回應、編輯和刪除介面。
- `extensions/qa-lab`：除錯器 UI 和 QA 匯流排，用於觀察轉錄紀錄、
  注入傳入訊息，以及匯出 Markdown 報告。
- `extensions/qa-matrix`：即時傳輸配接器，會在子 QA 閘道中驅動真正的 Matrix
  外掛。
- `qa/`：由 repo 支援的啟動任務種子資產與基準 QA
  情境。
- [Mantis](/zh-TW/concepts/mantis)：針對需要真實傳輸、瀏覽器截圖、VM 狀態與 PR 證據的錯誤，
  進行修正前/後的即時驗證。

## 命令介面

每個 QA 流程都在 `pnpm openclaw qa <subcommand>` 下執行。許多都有 `pnpm qa:*`
指令碼別名；兩種形式都可使用。

| 命令                                                | 目的                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | 不使用 `--qa-profile` 的內建 QA 自我檢查；使用 `--qa-profile smoke-ci`、`--qa-profile release` 或 `--qa-profile all` 的分類法支援成熟度設定檔執行器。                                                  |
| `qa suite`                                          | 針對 QA 閘道通道執行由 repo 支援的情境。`--runner multipass` 會使用一次性 Linux VM，而不是主機。                                                                                                      |
| `qa coverage`                                       | 列印 YAML 情境覆蓋率清單（`--json` 用於機器輸出；`--match <query>` 用於尋找受影響行為的情境；`--tools` 用於執行階段工具 fixture 覆蓋率）。                                                             |
| `qa parity-report`                                  | 比較兩個 `qa-suite-summary.json` 檔案以作為模型軸一致性閘門，或使用 `--runtime-axis --token-efficiency` 寫入 Codex-vs-OpenClaw 執行階段一致性與 token 效率報告。                                       |
| `qa confidence-report`                              | 依據 manifest 將 QA 證據成品分類為零未知信心報告。                                                                                                                                                    |
| `qa confidence-self-test`                           | 寫入已植入的負控制 canary，證明信心閘門能偵測漂移。                                                                                                                                                   |
| `qa jsonl-replay`                                   | 透過執行階段一致性重播 harness 重播精選 JSONL 轉錄紀錄。                                                                                                                                              |
| `qa character-eval`                                 | 跨多個即時模型執行角色 QA 情境，並產生經評審的報告。請參閱[報告](#reporting)。                                                                                                                        |
| `qa manual`                                         | 針對選定的 provider/model 通道執行一次性提示。                                                                                                                                                        |
| `qa ui`                                             | 啟動 QA 除錯器 UI 和本機 QA 匯流排（別名：`pnpm qa:lab:ui`）。                                                                                                                                        |
| `qa docker-build-image`                             | 建置預先烘焙的 QA Docker 映像。                                                                                                                                                                       |
| `qa docker-scaffold`                                | 寫入 QA dashboard + 閘道通道的 docker-compose scaffold。                                                                                                                                              |
| `qa up`                                             | 建置 QA 站台、啟動 Docker 支援的堆疊，並列印 URL（別名：`pnpm qa:lab:up`；`:fast` 變體會加上 `--use-prebuilt-image --bind-ui-dist --skip-ui-build`）。                                                |
| `qa aimock`                                         | 只啟動 AIMock provider server。                                                                                                                                                                       |
| `qa mock-openai`                                    | 只啟動具備情境感知的 `mock-openai` provider server。                                                                                                                                                  |
| `qa credentials doctor` / `add` / `list` / `remove` | 管理共用 Convex 憑證池。                                                                                                                                                                             |
| `qa discord`                                        | 針對真正的私有 Discord guild 頻道執行即時傳輸通道。                                                                                                                                                   |
| `qa matrix`                                         | 針對一次性 Tuwunel homeserver 執行即時傳輸通道。請參閱 [Matrix QA](/zh-TW/concepts/qa-matrix)。                                                                                                             |
| `qa slack`                                          | 針對真正的私有 Slack 頻道執行即時傳輸通道。                                                                                                                                                           |
| `qa telegram`                                       | 針對真正的私有 Telegram 群組執行即時傳輸通道。                                                                                                                                                        |
| `qa whatsapp`                                       | 針對真正的 WhatsApp Web 帳號執行即時傳輸通道。                                                                                                                                                        |
| `qa mantis`                                         | 即時傳輸錯誤的修正前/後驗證執行器，包含 Discord 狀態回應證據、Crabbox 桌面/瀏覽器 smoke，以及 Slack-in-VNC smoke。請參閱 [Mantis](/zh-TW/concepts/mantis) 和 [Mantis Slack 桌面 Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。 |

`qa matrix` 註冊為 runner 外掛（`extensions/qa-matrix`）；上方其他每個通道都直接內建於 `qa-lab`。

### 設定檔支援的 `qa run`

設定檔支援的 `qa run` 會從 `taxonomy.yaml` 讀取成員資格，然後透過 `qa suite`
分派已解析的情境。`--surface` 和 `--category` 會篩選選定的設定檔，而不是定義獨立通道。產生的
`qa-evidence.json` 包含設定檔計分卡摘要，其中有已選類別
計數和缺少的覆蓋率 ID；個別證據項目仍是測試、覆蓋率角色與結果的
事實來源。分類法功能覆蓋率 ID 是精確證明目標，不是別名：主要情境覆蓋率
會滿足相符 ID，次要覆蓋率則維持為建議性質。覆蓋率 ID 使用
點號 `namespace.behavior` 形式，區段為小寫英數/破折號；
設定檔、介面和類別 ID 仍可使用既有的破折號或點號
分類法 ID。

精簡證據會省略每個項目的 `execution`，並設定 `evidenceMode: "slim"`；
`smoke-ci` 預設為精簡，而 `--evidence-mode full` 會還原完整項目：

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

使用 `smoke-ci` 搭配 mock 模型 provider 和
Crabline local provider servers 取得確定性的設定檔證明。使用 `release` 針對
即時通道取得 Stable/LTS 證明。只有在明確執行完整分類法證據時才使用 `all`；它
會選取每個作用中的成熟度類別，並可透過 `QA
Profile Evidence` GitHub Actions workflow 搭配 `qa_profile=all` 分派。當某個
命令也需要 OpenClaw root profile 時，請將 root profile 放在
QA 命令前：

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## 操作者流程

目前的 QA 操作者流程是雙窗格 QA 站台：

- 左側：包含 agent 的 Gateway dashboard（Control UI）。
- 右側：QA Lab，顯示類 Slack 的轉錄紀錄與情境計畫。

使用以下命令執行：

```bash
pnpm qa:lab:up
```

這會建置 QA 站台、啟動 Docker 支援的閘道通道，並公開
QA Lab 頁面，讓操作者或自動化迴圈可以交付 agent 一個 QA
任務、觀察真實通道行為，並記錄哪些成功、失敗或
仍受阻。

若要在不每次重建 Docker 映像的情況下更快迭代 QA Lab UI，
請使用 bind-mounted QA Lab bundle 啟動堆疊：

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` 會讓 Docker services 使用預先建置的映像，並將
`extensions/qa-lab/web/dist` bind-mount 到 `qa-lab` container。
`qa:lab:watch` 會在變更時重建該 bundle，而當 QA Lab asset hash 變更時，
瀏覽器會自動重新載入。

### 可觀測性 smoke

<Note>
可觀測性 QA 僅限 source-checkout。npm tarball 刻意
省略 QA Lab（以及 `qa-channel`/`qa-matrix`），因此 package Docker release lanes
不會執行 `qa` 命令。變更診斷儀器時，
請從已建置的 source checkout 執行這些命令。
</Note>

| 別名                                    | 執行內容                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | 本機 OpenTelemetry 接收器，加上啟用 `diagnostics-otel` 的 `otel-trace-smoke` 情境。                                                     |
| `pnpm qa:otel:collector-smoke`          | 同一條路徑，但位於真實 OpenTelemetry Collector Docker 容器後方。變更端點接線或 collector/OTLP 相容性時使用。                          |
| `pnpm qa:prometheus:smoke`              | 啟用 `diagnostics-prometheus` 的 `docker-prometheus-smoke` 情境。                                                                        |
| `pnpm qa:observability:smoke`           | 先執行 `qa:otel:smoke`，接著執行 `qa:prometheus:smoke`。                                                                                |
| `pnpm qa:observability:collector-smoke` | 先執行 `qa:otel:collector-smoke`，接著執行 `qa:prometheus:smoke`。                                                                      |

`qa:otel:smoke` 會啟動本機 OTLP/HTTP 接收器，執行一次最小 QA-channel
代理程式回合，然後斷言 traces、metrics 和 logs 已匯出。它會解碼
匯出的 protobuf trace spans，並檢查發布關鍵形狀：
`openclaw.run`、`openclaw.harness.run`、最新 GenAI 語意慣例
model-call span、`openclaw.context.assembled` 和 `openclaw.message.delivery`
都必須存在。此 smoke 會強制
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`，因此 model-call
span 必須使用 `{gen_ai.operation.name} {gen_ai.request.model}` 名稱；成功回合中的模型
呼叫不得匯出 `StreamAbandoned`；原始診斷
ID 和 `openclaw.content.*` 屬性必須排除在 trace 之外。此情境
提示會要求模型以固定標記回覆，並保留一段固定的
秘密字串；原始 OTLP payload 不得包含兩者，也不得包含由情境 id
衍生出的 QA session key。它會在 QA suite artifacts 旁寫入 `otel-smoke-summary.json`。

`qa:prometheus:smoke` 會驗證未驗證的 scrape 會被拒絕，然後
檢查已驗證的 scrape 是否包含發布關鍵 metric families，
且不含 prompt 內容、response 內容、原始診斷識別碼、auth
tokens 或本機路徑。

### Matrix smoke 路徑

若要執行不需要 model-provider
憑證的 transport-real Matrix smoke 路徑，請使用 deterministic mock OpenAI provider 執行 fast profile：

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

若要執行 live-frontier provider 路徑，請明確提供 OpenAI-compatible credentials：

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

此路徑的完整命令列介面參考、profile/scenario catalog、env vars 和 artifact
layout 位於 [Matrix QA](/zh-TW/concepts/qa-matrix)。快速概覽：它會
在 Docker 中佈建一次性 Tuwunel homeserver、註冊臨時
driver/SUT/observer users、在限定於該 transport 的 child QA
閘道內執行真實 Matrix 外掛（不使用 `qa-channel`），然後在
`.artifacts/qa-e2e/matrix-<timestamp>/` 下寫入 Markdown
報告、JSON summary、observed-events artifact 和 combined output log。

這些情境涵蓋單元測試無法端對端證明的 transport 行為：
mention gating、allow-bot policies、allowlists、top-level 和 threaded
replies、DM routing、reaction handling、inbound edit suppression、restart
replay dedupe、homeserver interruption recovery、approval metadata delivery、
media handling，以及 Matrix E2EE bootstrap/recovery/verification flows。E2EE
命令列介面 profile 也會透過同一個一次性 homeserver 驅動 `openclaw matrix encryption setup` 和
verification commands，然後檢查
閘道回覆。

CI 在
`.github/workflows/qa-live-transports-convex.yml` 中使用同一組命令介面。排程和預設
手動執行會使用 QA-provided live-frontier
credentials、`--fast` 和 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`
執行 fast Matrix profile。手動 `matrix_profile=all` 會展開成五個 profile shards：`transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli`。

### Discord Mantis 情境

Discord 也有僅限 Mantis、需選擇啟用的 bug 重現情境。使用
`--scenario discord-status-reactions-tool-only` 取得明確的 status
reaction timeline，或使用 `--scenario discord-thread-reply-filepath-attachment`
建立真實 Discord thread，並驗證 `message.thread-reply`
保留 `filePath` attachment。這些情境不包含在預設
live Discord 路徑中，因為它們是 before/after repro probes，而不是
廣泛的 smoke coverage。當 QA
環境中設定了
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` 或
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` 時，thread-attachment Mantis workflow
也可以加入已登入的 Discord Web witness video。該 viewer profile 僅用於視覺擷取；pass/fail
判定仍來自 Discord REST oracle。

若要執行 transport-real Discord、Slack、Telegram 和 WhatsApp smoke 路徑：

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

它們會以既有真實 channel 為目標，並使用兩個 bots 或 accounts（driver +
SUT）。Required env vars、scenario lists、output artifacts 和 Convex
credential pool 記錄於下方的
[Discord、Slack、Telegram 和 WhatsApp QA 參考](#discord-slack-telegram-and-whatsapp-qa-reference)。

### Mantis Slack desktop 和 visual-task runners

若要使用 VNC rescue 執行完整 Slack desktop VM，請執行：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

該命令會租用 Crabbox desktop/browser machine、在 VM 內執行 Slack live
路徑、在 VNC browser 中開啟 Slack Web、擷取 desktop，
並將 `slack-qa/`、`slack-desktop-smoke.png` 和
`slack-desktop-smoke.mp4`（可用 video capture 時）複製回
Mantis artifact directory。Crabbox desktop/browser leases 會預先提供擷取
工具和 browser/native-build helper packages，因此此情境
只應在較舊 lease 上安裝 fallback。Mantis 會在
`mantis-slack-desktop-smoke-report.md` 中回報總耗時和各階段耗時，讓較慢的執行顯示
時間花在 lease warmup、credential acquisition、remote setup 或
artifact copy。透過 VNC 手動登入 Slack Web 後，可重用 `--lease-id <cbx_...>`；
重用的 lease 也會讓 Crabbox 的 pnpm store cache
保持溫熱。預設的 `--hydrate-mode source` 會從 source checkout 驗證，並
在 VM 內執行 install/build。只有在重用的 remote workspace 已經有 `node_modules` 和建好的 `dist/`
時，才使用 `--hydrate-mode prehydrated`；
該模式會略過昂貴的 install/build step，並在
workspace 未就緒時 fail closed。使用 `--gateway-setup` 時，Mantis 會讓持久
OpenClaw Slack 閘道在 VM 內的 port `38973` 上執行；若未使用，該
命令會執行一般 bot-to-bot Slack QA 路徑，並在 artifact
capture 後結束。

若要用 desktop evidence 證明 native Slack approval UI，請執行 Mantis
approval checkpoint mode：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

此模式與 `--gateway-setup` 互斥。它會執行 Slack
approval scenarios、拒絕非 approval scenario ids、在每個 pending
和 resolved approval state 等待，將觀察到的 Slack API message 渲染成
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`，然後在任何 checkpoint、
message evidence、acknowledgement 或 rendered screenshot 缺失或
為空時失敗。Cold CI leases 仍可能在
`slack-desktop-smoke.png` 中顯示 Slack sign-in；approval checkpoint images 是此路徑的視覺
證據。

預設 checkpoint run 會保留兩個標準 Slack approval scenarios。
若要擷取任一 opt-in Codex approval route，請使用
`--scenario slack-codex-approval-exec-native` 或
`--scenario slack-codex-approval-plugin-native` 明確選取；Mantis 會接受兩者並輸出
相同的 pending/resolved screenshot pair。Runner 會為每個選取的 Codex route 擴充其 checkpoint
和 remote-command deadlines，讓完整的
approval、agent completion 和 resolved-update sequence 可以完成。

Operator checklist、GitHub workflow dispatch command、evidence-comment
contract、hydrate-mode decision table、timing interpretation 和 failure
handling steps 位於
[Mantis Slack Desktop Runbook](/zh-TW/concepts/mantis-slack-desktop-runbook)。

若要執行 agent/CV 風格的 desktop task，請執行：

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` 會租用或重用 Crabbox desktop/browser machine、啟動
`crabbox record --while`、透過 nested
`visual-driver` 驅動可見 browser、擷取 `visual-task.png`、在選取 `--vision-mode image-describe` 時針對 screenshot 執行 `openclaw infer image
describe`，並寫入 `visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json` 和
`mantis-visual-task-report.md`。設定 `--expect-text` 時，vision
prompt 會要求 structured JSON verdict（`visible`、`evidence`、`reason`），
且只有在模型回報 `visible: true` 並提供引用預期文字的 evidence 時才通過；
若 `visible: false` 回應只是引用 target text，assertion 仍會失敗。
使用 `--vision-mode metadata` 執行 no-model smoke，以證明 desktop、browser、screenshot 和 video
plumbing，而不呼叫 image-understanding provider。Recording 是
`visual-task` 的必要 artifact；如果 Crabbox 沒有錄到非空的
`visual-task.mp4`，即使 visual driver 通過，task 也會失敗。失敗時，
Mantis 會保留 lease 供 VNC 使用，除非 task 已經通過且未設定
`--keep-lease`。

### Credential pool 健康檢查

使用 pooled live credentials 前，請執行：

```bash
pnpm openclaw qa credentials doctor
```

Doctor 會檢查 Convex broker env（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`）、驗證 endpoint settings、僅回報
`OPENCLAW_QA_CONVEX_SECRET_CI` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 的 set/missing status，並在 maintainer secret
存在時驗證 admin/list reachability。

## Live transport coverage

Live transport 路徑共用一個 contract，而不是各自發明自己的
scenario list shape。`qa-channel` 是廣泛的 synthetic product-behavior
suite，不屬於 live transport coverage matrix。

Live transport runners 會從
`openclaw/plugin-sdk/qa-live-transport-scenarios` 匯入共享的 scenario ids、baseline coverage
helpers 和 scenario-selection helper。

| 通道     | 金絲雀 | 提及閘控 | 機器人對機器人 | 允許清單封鎖 | 頂層回覆 | 引用回覆 | 重新啟動後恢復 | 執行緒後續回覆 | 執行緒隔離 | 反應觀察 | 說明命令 | 原生命令註冊 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

這會讓 `qa-channel` 保持作為廣泛產品行為套件，同時 Matrix、
Telegram 與其他即時傳輸共用一份明確的傳輸契約
檢查清單。

若要在不把 Docker 帶入 QA 路徑的情況下執行一次性 Linux VM 通道，請執行：

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

這會啟動全新的 Multipass guest、安裝相依套件、在 guest 內建置 OpenClaw、
執行 `qa suite`，然後將一般 QA 報告與摘要複製回主機上的
`.artifacts/qa-e2e/...`。它會重用與主機上 `qa suite` 相同的
情境選取行為。

主機與 Multipass 套件執行預設會使用隔離的閘道 worker 平行執行多個
已選情境。`qa-channel` 預設並行度為 4，並受所選情境數量限制。
使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1`
進行序列執行。使用 `--pack personal-agent` 執行個人助理基準套件（10 個
情境）。套件選取器會與重複的 `--scenario` 旗標相加：
明確指定的情境會先執行，接著依套件順序執行套件情境，並移除
重複項。當自訂 QA runner 已提供 OpenTelemetry collector 設定時，
使用 `--pack observability` 一併選取 `otel-trace-smoke` 與
`docker-prometheus-smoke` 情境。

當任何情境失敗時，命令會以非零狀態結束。當你想取得成品但不想要失敗
結束碼時，使用 `--allow-failures`。

即時執行會轉送 guest 實用且支援的 QA 驗證輸入：基於 env 的 provider keys、
QA 即時 provider config 路徑，以及存在時的 `CODEX_HOME`。請將
`--output-dir` 保持在 repo root 底下，讓 guest 能透過掛載的工作區寫回。

## Discord、Slack、Telegram 與 WhatsApp QA 參考

Matrix 因為情境數量與 Docker 支援的 homeserver 佈建而有
[專屬頁面](/zh-TW/concepts/qa-matrix)。Discord、Slack、Telegram
與 WhatsApp 會針對既有的真實傳輸執行，因此其參考資料位於此處。

### 共用命令列介面旗標

這些通道透過
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 註冊，並
接受相同旗標：

| 旗標                                  | 預設值                                            | 說明                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | 只執行此情境。可重複。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | 寫入報告、摘要、證據、傳輸特定成品與輸出記錄的位置。相對路徑會相對於 `--repo-root` 解析。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 從中立 cwd 呼叫時的儲存庫根目錄。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA 閘道 config 內的臨時帳號 id。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` 或 `live-frontier`（舊版 `live-openai` 仍可使用）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | provider 預設值                                   | 主要／替代模型 ref。                                                                                                                   |
| `--fast`                              | 關閉                                                | 支援時的 provider 快速模式。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | 請參閱 [Convex 認證池](#convex-credential-pool)。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI 中為 `ci`，否則為 `maintainer`                 | 使用 `--credential-source convex` 時使用的角色。                                                                                                    |

每個通道在任何情境失敗時都會以非零狀態結束。`--allow-failures` 會寫入
成品，但不設定失敗結束碼。Telegram 也接受 `--list-scenarios` 來列印
可用情境 id 並結束；其他通道不公開該旗標。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

目標是一個真實的私人 Telegram 群組，並使用兩個不同的 bot（driver +
SUT）。SUT bot 必須有 Telegram username；當兩個 bot 都在
`@BotFather` 中啟用 **Bot-to-Bot Communication Mode** 時，機器人對機器人的觀察效果
最佳。

使用 `--credential-source env` 時需要的 env：

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

隱含的預設集合一律涵蓋金絲雀、提及閘控、原生命令
回覆、命令定址，以及機器人對機器人群組回覆。`mock-openai`
預設值也包含確定性的回覆鏈與最終訊息串流
檢查。`telegram-current-session-status-tool` 與
`telegram-tool-only-usage-footer` 維持選擇性啟用：前者只有在緊接著金絲雀後直接串接時
才穩定，後者則是真實 Telegram 上 `/usage` 頁尾在工具專用回覆中的
證明。使用 `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` 列印目前的
預設／選擇性分割與回歸 ref。

輸出成品：

- `telegram-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目，
  包含 profile、coverage、provider、channel、artifacts、result 與 RTT
  欄位。

Package Telegram 執行使用相同的 Telegram 認證契約。重複 RTT
測量是一般 package Telegram 即時通道的一部分；RTT
分布會在所選 RTT 檢查的 `result.timing` 底下併入 `qa-evidence.json`。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 時，package 即時 wrapper
會租用 `kind: "telegram"` 認證，將租用的群組／driver／SUT
bot env 匯出到已安裝 package 的執行中，對租約進行心跳偵測，並在
關閉時釋放。選取 Convex 時，package wrapper 預設會在 CI 外使用
Convex role `maintainer`，針對 `telegram-mentioned-message-reply`
執行 20 次 RTT 檢查，RTT timeout 為 30s。覆寫
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
或 `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`，即可調整 RTT 測量，而無需
建立獨立的 RTT 命令或 Telegram 專用摘要格式。

### Discord QA

```bash
pnpm openclaw qa discord
```

目標是一個真實的私人 Discord guild channel，並使用兩個 bot：由 harness
控制的 driver bot，以及由 child OpenClaw 閘道透過 bundled Discord 外掛
啟動的 SUT bot。驗證 channel 提及處理、SUT bot 是否已向 Discord 註冊
原生 `/help` 命令，以及選擇性啟用的 Mantis 證據情境。

使用 `--credential-source env` 時需要的 env：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - 必須符合 Discord 傳回的 SUT bot user id
  （否則通道會快速失敗）。

選用：

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` 會在
  observed-message 成品中保留訊息內文。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` 會為
  `discord-voice-autojoin` 選取語音／stage channel；若未設定，情境會為 SUT bot 選取第一個可見的
  語音／stage channel。

情境（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - 選擇性啟用的語音情境。單獨執行，啟用
  `channels.discord.voice.autoJoin`，並驗證 SUT bot 目前的
  Discord 語音狀態是目標語音／stage channel。Convex Discord
  認證可包含選用的 `voiceChannelId`；否則 runner
  會在 guild 中探索第一個可見的語音／stage channel。
- `discord-status-reactions-tool-only` - 選擇性啟用的 Mantis 情境。由於它會將 SUT 切換為 always-on、tool-only guild replies
  並設定 `messages.statusReactions.enabled=true`，因此會單獨執行；接著擷取 REST
  reaction timeline 以及 HTML/PNG 視覺成品。Mantis before/after
  報告也會將情境提供的 MP4 成品保留為 `baseline.mp4`
  與 `candidate.mp4`。
- `discord-thread-reply-filepath-attachment` - 選擇性啟用的 Mantis 情境；請參閱
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
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

輸出成品：

- `discord-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `discord-qa-observed-messages.json` - 內文會被遮蔽，除非設定
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`。
- `discord-qa-reaction-timelines.json` 和
  `discord-status-reactions-tool-only-timeline.png`，會在狀態反應
  情境執行時產生。

### Slack QA

```bash
pnpm openclaw qa slack
```

以一個真實的私人 Slack 頻道為目標，使用兩個不同的機器人：一個由測試框架
控制的驅動機器人，以及一個由子 OpenClaw 閘道透過內建 Slack 外掛啟動的
SUT 機器人。

使用 `--credential-source env` 時必要的環境變數：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

選用：

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息內文。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 會為 Mantis 啟用視覺核准
  檢查點。執行器會寫入 `<scenario>.pending.json` 和
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
- `slack-reaction-glyph-native` - 選擇性啟用的即時訊息工具反應情境。
  指示代理傳入精確的 `✅` 字形，並確認 Slack 已為目標訊息上的 SUT
  機器人儲存 `white_check_mark`。
- `slack-approval-exec-native` - 選擇性啟用的原生 Slack exec 核准情境。
  透過閘道要求 exec 核准，驗證 Slack 訊息具有原生核准按鈕、解析它，
  並驗證已解析的 Slack 更新。
- `slack-approval-plugin-native` - 選擇性啟用的原生 Slack 外掛核准
  情境。同時啟用 exec 和外掛核准轉送，讓外掛事件不會被 exec 核准
  路由抑制，接著驗證相同的待處理/已解析原生 Slack UI 路徑。
- `slack-codex-approval-exec-native` - 選擇性啟用的 Codex Guardian
  命令核准情境。以 Guardian 模式啟用 Codex 外掛，將源自 Slack 的
  閘道代理回合透過 Codex app-server 測試框架路由，等待
  `openclaw-codex-app-server` 的原生 Slack 外掛核准提示，解析它，
  並驗證 Codex 回合以預期的命令輸出和助理標記完成。
- `slack-codex-approval-plugin-native` - 選擇性啟用的 Codex Guardian
  檔案核准情境。使用工作區外的 `apply_patch` 指令，讓 Codex 發出
  app-server 檔案變更核准路由，接著驗證相同的原生 Slack 待處理/已解析
  核准路徑、最終助理標記，以及清理前的精確檔案內容。

Codex 核准情境需要 `openai/*` 或 `codex/*` `--model`、一般即時模型
憑證，以及 Codex 外掛接受的 Codex 驗證或 API 金鑰驗證。Slack 報告會包含
Codex app-server 方法、選取的 Codex 模型鍵、最終 Codex 回合狀態，以及
操作標記驗證，並附上已遮蔽的 Slack 核准中繼資料。

輸出成品：

- `slack-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `slack-qa-observed-messages.json` - 內文會被遮蔽，除非設定
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`。
- `approval-checkpoints/` - 只有在 Mantis 設定
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` 時產生；包含檢查點 JSON、
  確認 JSON，以及待處理/已解析螢幕截圖。

#### 設定 Slack 工作區

此路徑需要同一個工作區中的兩個不同 Slack 應用程式，以及一個兩個機器人
都已加入的頻道：

- `channelId` - 兩個機器人都已被邀請加入的頻道 `Cxxxxxxxxxx` ID。
  請使用專用頻道；此路徑每次執行都會發文。
- `driverBotToken` - **Driver** 應用程式的機器人權杖（`xoxb-...`）。
- `sutBotToken` - **SUT** 應用程式的機器人權杖（`xoxb-...`），它必須是
  與驅動程式不同的 Slack 應用程式，讓其機器人使用者 ID 不同。
- `sutAppToken` - SUT 應用程式具備 `connections:write` 的應用程式層級
  權杖（`xapp-...`），由 Socket Mode 使用，讓 SUT 應用程式可以接收事件。

建議使用專用於 QA 的 Slack 工作區，而不是重複使用生產工作區。

下方的 SUT manifest 會刻意將內建 Slack 外掛的生產安裝
（`extensions/slack/src/setup-shared.ts:12`）縮小到即時 Slack QA 套件
涵蓋的權限與事件。使用者看到的生產頻道設定請參閱
[Slack 頻道快速設定](/zh-TW/channels/slack#quick-setup)；QA Driver/SUT
組合是刻意分開的，因為此路徑需要同一個工作區中的兩個不同機器人使用者
ID。

**1. 建立 Driver 應用程式**

前往 [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → 選擇 QA 工作區、貼上下列 manifest，然後
_Install to Workspace_：

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

複製 _Bot User OAuth Token_（`xoxb-...`）- 它會成為
`driverBotToken`。驅動程式只需要發送訊息並識別自己；不需要事件，也不需要
Socket Mode。

**2. 建立 SUT 應用程式**

在同一個工作區中重複 _Create New App → From a manifest_。此 QA 應用程式
刻意使用內建 Slack 外掛生產 manifest
（`extensions/slack/src/setup-shared.ts:12`）的較窄版本：省略反應權限
範圍與事件，因為即時 Slack QA 套件尚未涵蓋反應處理。

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

Slack 建立應用程式後，請在其設定頁面上執行兩件事：

- _Install to Workspace_ → 複製 _Bot User OAuth Token_ → 它會成為
  `sutBotToken`。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → 新增
  權限範圍 `connections:write` → 儲存 → 複製 `xapp-...` 值 → 它會成為
  `sutAppToken`。

透過對每個權杖呼叫 `auth.test`，驗證兩個機器人具有不同的使用者 ID。
執行階段會透過使用者 ID 區分驅動程式與 SUT；兩者重複使用同一個應用程式
會讓提及閘門立即失敗。

**3. 建立頻道**

在 QA 工作區中建立一個頻道（例如 `#openclaw-qa`），並從頻道內邀請兩個
機器人：

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

從 _channel info → About → Channel ID_ 複製 `Cxxxxxxxxxx` ID - 它會成為
`channelId`。公開頻道可用；如果使用私人頻道，兩個應用程式已具備
`groups:history`，因此測試框架的歷史讀取仍會成功。

**4. 註冊憑證**

有兩個選項。使用環境變數進行單機除錯（設定四個
`OPENCLAW_QA_SLACK_*` 變數並傳入 `--credential-source env`），或植入共享
Convex 集區，讓 CI 和其他維護者可以租用它們。

若使用 Convex 集區，請將四個欄位寫入 JSON 檔案：

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

在 shell 中匯出 `OPENCLAW_QA_CONVEX_SITE_URL` 和
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 後，註冊並驗證：

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

預期 `count: 1`、`status: "active"`，且沒有 `lease` 欄位。

**5. 端對端驗證**

在本機執行此路徑，確認兩個機器人可以透過代理彼此通訊：

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

綠燈執行會在遠低於 30 秒內完成，且 `slack-qa-report.md` 會顯示
`slack-canary` 和 `slack-mention-gating` 的狀態皆為 `pass`。如果此路徑
停滯約 90 秒並以 `Convex credential pool exhausted for kind "slack"`
結束，代表集區為空或每一列都已被租用 - `qa credentials list --kind slack --status all --json`
會告訴你是哪一種情況。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

以兩個專用 WhatsApp Web 帳號為目標：一個由測試框架控制的驅動帳號，
以及一個由子 OpenClaw 閘道透過內建 WhatsApp 外掛啟動的 SUT 帳號。

使用 `--credential-source env` 時必要的環境變數：

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
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` 會在觀察訊息成品中保留訊息內文。

情境目錄（`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`）：

- 基準與群組門檻控管：`whatsapp-canary`、`whatsapp-pairing-block`、
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
- 使用者路徑訊息動作：`whatsapp-agent-message-action-react` 從真實驅動程式私訊開始，讓模型呼叫 `message` 工具，並觀察原生 WhatsApp 反應。`whatsapp-agent-message-action-upload-file` 對 `message(action=upload-file)` 使用相同姿態，並觀察原生 WhatsApp 媒體。`whatsapp-group-agent-message-action-react` 與
  `whatsapp-group-agent-message-action-upload-file` 在真實 WhatsApp 群組中證明相同的使用者可見動作。
- 群組扇出：`whatsapp-broadcast-group-fanout` 從一則被提及的 WhatsApp 群組訊息開始，並驗證來自 `main` 與 `qa-second` 的不同可見回覆。
- 群組啟用：`whatsapp-group-activation-always` 將真實群組工作階段變更為 `/activation always`，證明未提及的群組訊息會喚醒代理，然後還原 `/activation mention`。
  `whatsapp-group-reply-to-bot-triggers` 先植入一則機器人回覆，對它傳送未明確提及的原生引用回覆，並驗證代理會從該回覆脈絡被喚醒。
- 入站媒體與結構化訊息：`whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  這些會透過驅動程式傳送真實 WhatsApp 圖片、音訊、文件、位置、聯絡人、貼圖與反應事件。
- 直接閘道合約探測：`whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。這些會刻意繞過模型提示，並證明確定性的閘道/通道 `send`、`poll` 與
  `message.action` 合約。
- 存取控制涵蓋範圍：`whatsapp-access-control-dm-open`、
  `whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、
  `whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- 原生核准：`whatsapp-approval-exec-deny-native`、
  `whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、
  `whatsapp-approval-exec-group-reaction-native`、
  `whatsapp-approval-plugin-native`。
- 狀態反應：`whatsapp-status-reactions`、
  `whatsapp-status-reaction-lifecycle`。

目錄目前包含 52 個情境。`live-frontier` 預設通道維持在 10 個情境的小規模，以提供快速煙霧涵蓋。`mock-openai`
預設通道透過真實 WhatsApp 傳輸以確定性方式執行 45 個情境，僅模擬模型輸出；核准情境與少數較重/阻塞式檢查仍需以情境 ID 明確執行。

WhatsApp QA 驅動程式會觀察結構化即時事件（`text`、`media`、`location`、`reaction` 與 `poll`），並可主動傳送媒體、投票、聯絡人、位置與貼圖。QA Lab 透過 `@openclaw/whatsapp/api.js` 套件介面匯入該驅動程式，而不是進入私有 WhatsApp 執行階段檔案。對於群組觀察，`fromJid` 是群組 JID，而 `participantJid` 與 `fromPhoneE164` 會識別參與者傳送者。訊息內容預設會被遮蔽。直接閘道投票、upload-file、媒體、群組投票、群組媒體與回覆形狀探測是傳輸/API 合約檢查；它們不會被視為使用者提示讓代理選擇相同動作的證明。使用者路徑動作證明來自 `whatsapp-agent-message-action-react` 與
`whatsapp-group-agent-message-action-react` 等情境，其中驅動程式會傳送一般 WhatsApp 訊息，而 QA Lab 會觀察產生的原生 WhatsApp 成果物。WhatsApp 報告包含每個情境的姿態（`user-path`、
`direct-gateway` 或 `native-approval`），因此證據不會被誤認為比實際證明更強的合約。

輸出成果物：

- `whatsapp-qa-report.md`
- `qa-evidence.json` - 即時傳輸檢查的證據項目。
- `whatsapp-qa-observed-messages.json` - 除非設定
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`，否則正文會被遮蔽。

### Convex 認證集區

Discord、Slack、Telegram 與 WhatsApp 通道可以從共享 Convex 集區租用認證，而不是讀取上述環境變數。傳入
`--credential-source convex`（或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）；
QA Lab 會取得獨占租約，在執行期間對其進行心跳偵測，並在關閉時釋放。集區種類為 `"discord"`、`"slack"`、
`"telegram"` 與 `"whatsapp"`。

代理程式在 `admin/add` 上驗證的承載形狀：

- Discord (`kind: "discord"`)：`{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Telegram (`kind: "telegram"`)：`{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` 必須是數值聊天 ID 字串。
- Telegram 真實使用者 (`kind: "telegram-user"`)：`{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  僅限 Mantis Telegram Desktop 證明。一般 QA Lab 通道不得取得此種類。
- WhatsApp (`kind: "whatsapp"`)：`{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 電話號碼必須是不同的 E.164 字串。

Mantis Telegram Desktop 證明工作流程會為 TDLib 命令列介面驅動程式與 Telegram Desktop 見證者持有一個獨占 Convex
`telegram-user` 租約，然後在發布證明後釋放它。

當 PR 需要確定性視覺差異時，Mantis 可以在 `main` 與 PR head 上使用相同的模擬模型回覆，同時變更 Telegram 格式化器或投遞層。擷取預設值已針對 PR 留言調校：標準 Crabbox 類別、24fps 桌面錄製、24fps 動態 GIF，以及 1920px 預覽寬度。前後對照留言應發布只包含預期 GIF 的乾淨套件。

Slack 通道也可以使用該集區。Slack 承載形狀檢查目前位於 Slack QA 執行器，而不是代理程式；請使用 `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`，並搭配類似 `Cxxxxxxxxxx` 的 Slack 通道 ID。請參閱
[設定 Slack 工作區](#setting-up-the-slack-workspace) 以了解應用程式與範圍佈建。

操作環境變數與 Convex 代理端點合約位於
[測試 → 透過 Convex 共享 Telegram 認證](/zh-TW/help/testing#shared-telegram-credentials-via-convex-v1)
（該章節名稱早於多通道集區；租約語意在各種類之間共享）。

## 儲存庫支援的種子

種子資產位於 `qa/`：

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

這些會刻意存放在 git 中，讓 QA 計畫對人類與代理都可見。

`qa-lab` 保持為通用 YAML 情境執行器。每個情境 YAML 檔案都是一次測試執行的真實來源，且應定義：

- 頂層 `title`
- `scenario` 中繼資料
- `scenario` 中的選用 category、capability、lane 與 risk 中繼資料
- `scenario` 中的 docs 與 code 參照
- `scenario` 中的選用外掛需求
- `scenario` 中的選用閘道設定修補
- 流程情境的可執行頂層 `flow`，或 Vitest 與 Playwright 情境的
  `scenario.execution.kind` / `scenario.execution.path`

支撐 `flow` 的可重用執行階段介面會保持通用且跨領域。例如，YAML 情境可以結合傳輸端協助程式與瀏覽器端協助程式，透過閘道 `browser.request` 接縫驅動嵌入式 Control UI，而不需要新增特殊案例執行器。

情境檔案應依產品能力分組，而不是依來源樹資料夾分組。檔案移動時，請保持情境 ID 穩定；使用 `docsRefs` 與
`codeRefs` 進行實作可追溯性。

基準清單應維持足夠廣泛，以涵蓋：

- 私訊與通道聊天
- 對話串行為
- 訊息動作生命週期
- 排程回呼
- 記憶回想
- 模型切換
- 子代理交接
- 儲存庫讀取與文件讀取
- 一個小型建置任務，例如 Lobster Invaders

## 供應商模擬通道

`qa suite` 有兩個本機供應商模擬通道：

- `mock-openai` 是具情境感知的 OpenClaw 模擬。它仍是儲存庫支援 QA 與對等門檻的預設確定性模擬通道。
- `aimock` 會啟動 AIMock 支援的供應商伺服器，用於實驗性協定、fixture、錄製/重播與混沌涵蓋。它是附加項，不會取代 `mock-openai` 情境分派器。

供應商通道實作位於 `extensions/qa-lab/src/providers/` 下。每個供應商都擁有其預設值、本機伺服器啟動、閘道模型設定、驗證設定檔暫存需求，以及即時/模擬能力旗標。共享套件與閘道程式碼會透過供應商登錄路由，而不是依供應商名稱分支。

## 傳輸配接器

`qa-lab` 擁有 YAML QA 情境的通用傳輸接縫。`qa-channel` 是合成預設值。`crabline` 會啟動本機供應商形狀的伺服器，並讓 OpenClaw 的一般通道外掛對其執行。`live` 保留給真實供應商認證與外部通道。

在架構層級，分工如下：

- `qa-lab` 擁有通用情境執行、工作者並行、成果物寫入與報告。
- 傳輸配接器擁有閘道設定、就緒狀態、入站與出站觀察、傳輸動作，以及標準化傳輸狀態。
- `qa/scenarios/` 下的 YAML 情境檔案定義測試執行；`qa-lab`
  提供執行它們的可重用執行階段介面。

### 新增通道

將通道新增到 YAML QA 系統需要通道實作，以及一組可演練通道合約的情境包。若要提供煙霧 CI 涵蓋，請新增相符的 Crabline 本機供應商伺服器，並透過 `crabline` 驅動程式公開它。

當共享 `qa-lab` 主機可以擁有流程時，不要新增新的頂層 QA 命令根。

`qa-lab` 擁有共享主機機制：

- `openclaw qa` 命令根
- 套件啟動與拆除
- 工作者並行
- 成果物寫入
- 報告產生
- 情境執行
- 舊版 `qa-channel` 情境的相容性別名

執行器外掛擁有傳輸合約：

- `openclaw qa <runner>` 如何掛載在共享 `qa` 根之下
- 如何為該傳輸設定閘道
- 如何檢查就緒狀態
- 如何注入入站事件
- 如何觀察出站訊息
- 如何公開逐字稿與標準化傳輸狀態
- 如何執行傳輸支援的動作
- 如何處理傳輸特定的重設或清理

新通道的最低採用門檻：

1. 讓 `qa-lab` 作為共用 `qa` 根命令的擁有者。
2. 在共用的 `qa-lab` 主機接合點上實作傳輸執行器。
3. 將傳輸專屬機制保留在執行器外掛或通道
   harness 內。
4. 將執行器掛載為 `openclaw qa <runner>`，而不是註冊一個
   競爭性的根命令。執行器外掛應在
   `openclaw.plugin.json` 中宣告 `qaRunners`，並從 `runtime-api.ts`
   匯出相符的 `qaRunnerCliRegistrations`
   陣列。保持 `runtime-api.ts` 輕量；延遲命令列介面和
   執行器執行應保留在獨立進入點後方。
5. 在主題式 `qa/scenarios/`
   目錄下撰寫或改寫 YAML 情境。
6. 新情境使用通用情境輔助工具。
7. 除非 repo 正在進行有意的遷移，否則保持既有相容性別名可用。

判斷規則很嚴格：

- 如果行為可以在 `qa-lab` 中表達一次，就放在 `qa-lab`。
- 如果行為依賴單一通道傳輸，就保留在該執行器
  外掛或外掛 harness 中。
- 如果情境需要一項可供多個通道使用的新能力，
  請新增通用輔助工具，而不是在 `suite.ts` 中加入通道專屬分支。
- 如果某個行為只對單一傳輸有意義，請保持該情境為
  傳輸專屬，並在情境合約中明確說明。

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
`formatConversationTranscript`、`resetBus` - 但新的情境撰寫
應使用通用名稱。這些別名是為了避免一次性
遷移，而不是未來的模型。

## 回報

`qa-lab` 會從觀察到的匯流排時間軸匯出 Markdown 協定報告。
報告應回答：

- 哪些項目成功
- 哪些項目失敗
- 哪些項目仍被阻塞
- 哪些後續情境值得新增

若要取得可用情境的清單 - 在估算後續工作
或接線新傳輸時很有用 - 請執行 `pnpm openclaw qa coverage`（加入 `--json`
以取得機器可讀輸出）。為受影響的
行為或檔案路徑選擇聚焦證明時，請執行 `pnpm openclaw qa coverage --match <query>`。比對
報告會搜尋情境中繼資料、文件參照、程式碼參照、覆蓋率 ID、
外掛和提供者需求，然後列印相符的 `qa suite
--scenario ...` 目標。

每次 `qa suite` 執行都會為選取的
情境集合寫入頂層 `qa-evidence.json`、
`qa-suite-summary.json` 和 `qa-suite-report.md` 成品。宣告 `execution.kind: vitest` 或
`execution.kind: playwright` 的情境會執行相符的測試路徑，並且也寫入
每個情境的記錄。宣告 `execution.kind: script` 的情境會透過
`node --import tsx` 執行位於 `execution.path` 的
證據產生器（並在 `execution.args` 中展開
`${outputDir}` 和 `${scenarioId}`）；該
產生器會寫入自己的 `qa-evidence.json`，其中的項目會匯入到
套件輸出，而其成品路徑會相對於該
產生器的 `qa-evidence.json` 解析。當透過 `qa run
--qa-profile` 進入 `qa suite` 時，同一個 `qa-evidence.json` 也會包含所選分類法類別的設定檔
評分卡摘要。

將覆蓋率輸出視為探索輔助，而不是門檻替代品；所選
情境仍需要適合受測行為的提供者模式、即時傳輸、
Multipass、Testbox 或發布 lane。若需
評分卡脈絡，請參閱[成熟度評分卡](/zh-TW/maturity/scorecard)。

若要進行角色和風格檢查，請在多個即時
模型參照上執行相同情境，並寫入經評審的 Markdown 報告：

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
使用者回合，例如聊天、工作區協助和小型檔案任務。候選
模型不應被告知它正在接受評估。此命令會保留
每份完整 transcript、記錄基本執行統計，然後以
快速模式詢問評審模型，並在支援時使用 `xhigh` 推理，依
自然度、氛圍和幽默感為執行結果排名。比較
提供者時使用 `--blind-judge-models`：評審提示仍會取得
每份 transcript 和執行狀態，但候選參照會替換為
中性標籤，例如 `candidate-01`；報告會在解析後將排名
對應回真實參照。

候選執行預設使用 `high` thinking，GPT-5.5 使用 `medium`，
而支援的較舊 OpenAI 評估參照使用 `xhigh`。使用
`--model provider/model,thinking=<level>` 內嵌覆寫特定
候選；內嵌選項也支援 `fast`、`no-fast` 和 `fast=<bool>`。`--thinking
<level>` 仍會設定全域備援，而較舊的 `--model-thinking
<provider/model=level>` 形式則為相容性保留。OpenAI 候選
參照預設使用快速模式，讓支援的提供者使用優先處理。
只有在想要強制每個候選模型都開啟快速模式時，才傳入 `--fast`。
候選和評審持續時間會記錄在
報告中以供基準分析，但評審提示會明確要求不要依速度排名。
候選和評審模型執行都預設為並行 16。
當提供者限制或本機
閘道壓力讓執行過於嘈雜時，請降低 `--concurrency` 或 `--judge-concurrency`。

未傳入候選 `--model` 時，角色評估預設為
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、
`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5` 和 `google/gemini-3.1-pro-preview`。未傳入
`--judge-model` 時，評審預設為
`openai/gpt-5.5,thinking=xhigh,fast` 和
`anthropic/claude-opus-4-8,thinking=high`。

## 相關文件

- [矩陣 QA](/zh-TW/concepts/qa-matrix)
- [成熟度評分卡](/zh-TW/maturity/scorecard)
- [個人代理基準測試包](/zh-TW/concepts/personal-agent-benchmark-pack)
- [QA 通道](/zh-TW/channels/qa-channel)
- [測試](/zh-TW/help/testing)
- [儀表板](/zh-TW/web/dashboard)
