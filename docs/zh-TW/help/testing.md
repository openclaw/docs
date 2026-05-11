---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/供應商錯誤新增迴歸測試
    - Gateway + 代理程式行為偵錯
summary: 測試工具包：單元/e2e/live 測試套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-05-11T20:31:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 套件（單元/整合、e2e、live）以及一小組
Docker 執行器。這份文件是「我們如何測試」的指南：

- 每個套件涵蓋的範圍（以及刻意_不_涵蓋的範圍）。
- 常見工作流程要執行哪些命令（本機、推送前、偵錯）。
- live 測試如何探索憑證並選擇模型/供應商。
- 如何為真實世界的模型/供應商問題加入迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、live 傳輸通道）**另有文件說明：

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) - 架構、命令介面、情境撰寫。
- [Matrix QA](/zh-TW/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的參考。
- [QA channel](/zh-TW/channels/qa-channel) - 由儲存庫支援的情境使用的合成傳輸 Plugin。

本頁涵蓋一般測試套件與 Docker/Parallels 執行器的執行方式。下方的 QA 專用執行器章節（[QA 專用執行器](#qa-specific-runners)）列出具體的 `qa` 呼叫，並指回上方的參考資料。
</Note>

## 快速開始

大多數日子：

- 完整閘門（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在空間充裕的機器上較快地執行本機完整套件：`pnpm test:max`
- 直接 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在反覆處理單一失敗時，優先使用目標式執行。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你修改測試或想要額外信心時：

- 覆蓋率閘門：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

偵錯真實供應商/模型時（需要真實憑證）：

- Live 套件（模型 + Gateway 工具/圖片探測）：`pnpm test:live`
- 安靜地指定一個 live 檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行時效能報告：派送 `OpenClaw Performance`，並使用
  `live_gpt54=true` 來進行真實 `openai/gpt-5.4` 代理程式回合，或使用
  `deep_profile=true` 來產生 Kova CPU/堆積/追蹤成品。每日排程執行會在
  `CLAWGRIT_REPORTS_TOKEN` 已設定時，將 mock-provider、deep-profile 與 GPT 5.4 通道成品發布到
  `openclaw/clawgrit-reports`。mock-provider 報告也包含原始碼層級的 Gateway 啟動、記憶體、
  Plugin 壓力、重複 fake-model hello-loop，以及 CLI 啟動數據。
- Docker live 模型掃描：`pnpm test:docker:live-models`
  - 每個選取的模型現在會執行一個文字回合加上一個小型檔案讀取風格探測。
    中繼資料宣告支援 `image` 輸入的模型也會執行一個微型圖片回合。
    在隔離供應商失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋範圍：每日 `OpenClaw Scheduled Live And E2E Checks` 與手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用的 live/E2E 工作流程，
    其中包含依供應商分片的獨立 Docker live 模型矩陣作業。
  - 若要集中重新執行 CI，請以 `include_live_suites: true` 與 `live_models_only: true`
    派送 `OpenClaw Live And E2E Checks (Reusable)`。
  - 將新的高訊號供應商祕密加入 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其
    排程/發布呼叫端。
- 原生 Codex 繫結聊天煙霧測試：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker live 通道，以 `/codex bind` 繫結合成
    Slack DM，演練 `/codex fast` 與
    `/codex permissions`，接著驗證純文字回覆與圖片附件會透過原生 Plugin 繫結路由，而非 ACP。
- Codex app-server harness 煙霧測試：`pnpm test:docker:live-codex-harness`
  - 透過 Plugin 擁有的 Codex app-server harness 執行 Gateway 代理程式回合，
    驗證 `/codex status` 與 `/codex models`，並預設演練圖片、
    cron MCP、子代理程式與 Guardian 探測。隔離其他 Codex
    app-server 失敗時，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用子代理程式探測。若要集中檢查子代理程式，請停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，
    否則這會在子代理程式探測後結束。
- Codex 隨需安裝煙霧測試：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安裝已封裝的 OpenClaw tarball，執行 OpenAI API 金鑰
    onboarding，並驗證 Codex Plugin 加上 `@openai/codex` 相依套件
    已隨需下載到受管理的 npm 根目錄。
- Live Plugin 工具相依性煙霧測試：`pnpm test:docker:live-plugin-tool`
  - 封裝一個含有真實 `slugify` 相依套件的 fixture Plugin，透過
    `npm-pack:` 安裝，驗證受管理 npm 根目錄下的相依套件，然後要求
    live OpenAI 模型呼叫 Plugin 工具並回傳隱藏的 slug。
- Crestodian 救援命令煙霧測試：`pnpm test:live:crestodian-rescue-channel`
  - 針對訊息頻道救援命令介面的選用雙重保險檢查。
    它會演練 `/crestodian status`、排入持久模型
    變更、回覆 `/crestodian yes`，並驗證稽核/設定寫入路徑。
- Crestodian planner Docker 煙霧測試：`pnpm test:docker:crestodian-planner`
  - 在無設定的容器中執行 Crestodian，並在 `PATH` 上提供假的 Claude CLI，
    驗證模糊 planner fallback 會轉換為已稽核的具型別設定寫入。
- Crestodian 首次執行 Docker 煙霧測試：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw 狀態目錄開始，將裸 `openclaw` 路由到
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入，
    驗證設定，並驗證稽核項目。相同的 Ring 0 設定路徑也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 涵蓋。
- Moonshot/Kimi 成本煙霧測試：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對
  `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 報告 Moonshot/K2.6，且助理逐字稿儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先透過下方描述的 allowlist 環境變數縮小 live 測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA-lab 的真實性時，這些命令會與主要測試套件並列：

CI 會在專用工作流程中執行 QA Lab。代理程式同等性巢狀於
`QA-Lab - All Lanes` 與發布驗證之下，而不是獨立的 PR 工作流程。
廣泛驗證應使用 `Full Release Validation` 並搭配
`rerun_group=qa-parity`，或使用 release-checks QA 群組。穩定/預設發布檢查會將完整 live/Docker soak 保持在 `run_release_soak=true` 之後；
`full` 設定檔會強制啟用 soak。`QA-Lab - All Lanes`
會每晚在 `main` 上執行，也會從手動派送執行，並將 mock parity 通道、live
Matrix 通道、Convex 管理的 live Telegram 通道，以及 Convex 管理的 live Discord
通道作為平行作業。排程 QA 與發布檢查會明確傳遞 Matrix
`--profile fast`，而 Matrix CLI 與手動工作流程輸入
預設仍為 `all`；手動派送可以將 `all` 分片為 `transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 作業。`OpenClaw Release
Checks` 會在發布核准前執行 parity 加上 fast Matrix 與 Telegram 通道，
並對發布傳輸檢查使用 `mock-openai/gpt-5.5`，讓它們保持
決定性並避開一般供應商 Plugin 啟動。這些 live 傳輸
Gateway 會停用記憶體搜尋；記憶體行為仍由 QA parity
套件涵蓋。

完整發布 live media 分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 與 `ffprobe`。Docker live 模型/後端分片使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像檔，該映像檔會針對每個選取的
提交只建置一次，接著以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由 repo 支援的 QA 情境。
  - 預設會使用隔離的 gateway worker 平行執行多個選取的情境。`qa-channel` 預設並行數為 4（受限於選取的情境數量）。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 走較舊的序列通道。
  - 當任何情境失敗時，以非零狀態結束。若你想取得成品但不想要失敗的結束碼，請使用 `--allow-failures`。
  - 支援 provider 模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 會啟動由本機 AIMock 支援的 provider 伺服器，用於實驗性的 fixture 與 protocol-mock 覆蓋率，而不會取代具情境感知能力的 `mock-openai` 通道。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行即時 OpenAI Kitchen Sink Plugin 測試套件。它會安裝外部 Kitchen Sink 套件、驗證 plugin SDK 介面清單、探測 `/healthz` 和 `/readyz`、記錄 Gateway CPU/RSS 證據、執行一次即時 OpenAI 回合，並檢查對抗式診斷。需要即時 OpenAI 驗證，例如 `OPENAI_API_KEY`。在已 hydrated 的 Testbox 工作階段中，若存在 `openclaw-testbox-env` helper，會自動載入 Testbox 即時驗證 profile。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 Gateway 啟動 bench，以及一小組 mock QA Lab 情境包（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`），並在 `.artifacts/gateway-cpu-scenarios/` 底下寫入合併的 CPU 觀察摘要。
  - 預設只標記持續性的高 CPU 觀察（`--cpu-core-warn` 加上 `--hot-wall-warn-ms`），因此短暫的啟動尖峰會被記錄為指標，而不會看起來像持續數分鐘的 Gateway 滿載迴歸。
  - 使用建置後的 `dist` 成品；若 checkout 中還沒有最新的 runtime 輸出，請先執行 build。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 中執行相同的 QA suite。
  - 保持與主機上 `qa suite` 相同的情境選取行為。
  - 重用與 `qa suite` 相同的 provider/model 選取旗標。
  - 即時執行會轉送適合 guest 使用且受支援的 QA 驗證輸入：以 env 為基礎的 provider 金鑰、QA 即時 provider config 路徑，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須維持在 repo root 底下，讓 guest 能透過掛載的 workspace 回寫。
  - 在 `.artifacts/qa-e2e/...` 底下寫入一般 QA 報告與摘要，以及 Multipass logs。
- `pnpm qa:lab:up`
  - 啟動由 Docker 支援的 QA 網站，用於 operator 風格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball、在 Docker 中全域安裝、執行非互動式 OpenAI API-key onboarding、預設設定 Telegram、驗證封裝後的 plugin runtime 載入時不需要啟動依賴修復、執行 doctor，並針對 mocked OpenAI endpoint 執行一次本機 agent 回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的 packaged-install 通道。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式 runtime context transcripts 執行可重現的 built-app Docker smoke。它會驗證隱藏的 OpenClaw runtime context 會以非顯示 custom message 持久化，而不是洩漏到可見的 user turn，接著植入受影響的損壞 session JSONL，並驗證 `openclaw doctor --fix` 會將其重寫到 active branch 並建立備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw package candidate、執行 installed-package onboarding、透過已安裝的 CLI 設定 Telegram，然後以該已安裝套件作為 SUT Gateway，重用即時 Telegram QA 通道。
  - wrapper 只會從 checkout 掛載 `qa-lab` harness source；已安裝套件擁有 `dist`、`openclaw/plugin-sdk` 與 bundled plugin runtime，因此該通道不會把目前 checkout 的 plugins 混入受測套件。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或 `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而不是從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env credentials 或 Convex credential source。針對 CI/release automation，設定 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，加上 `OPENCLAW_QA_CONVEX_SITE_URL` 和 role secret。若 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 與 Convex role secret，Docker wrapper 會自動選擇 Convex。
  - wrapper 會在 Docker build/install 工作前，先於主機上驗證 Telegram 或 Convex credential env。只有在刻意偵錯 pre-credential setup 時，才設定 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此通道覆寫共用的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 將此通道公開為手動 maintainer workflow `NPM Telegram Beta E2E`。它不會在 merge 時執行。該 workflow 使用 `qa-live-shared` environment 與 Convex CI credential leases。
- GitHub Actions 也公開 `Package Acceptance`，用於針對單一 candidate package 進行 side-run product proof。它接受受信任的 ref、已發布 npm spec、HTTPS tarball URL 加上 SHA-256，或來自另一個 run 的 tarball artifact，會上傳標準化的 `openclaw-current.tgz` 作為 `package-under-test`，然後使用 smoke、package、product、full 或 custom lane profiles 執行既有的 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可針對相同的 `package-under-test` artifact 執行 Telegram QA workflow。
  - 最新 beta product proof：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精確 tarball URL proof 需要 digest：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact proof 會從另一個 Actions run 下載 tarball artifact：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中打包並安裝目前的 OpenClaw build、啟動已設定 OpenAI 的 Gateway，接著透過 config 編輯啟用 bundled channel/plugins。
  - 驗證 setup discovery 會讓未設定的 downloadable plugins 保持不存在、第一次設定後的 doctor repair 會明確安裝每個缺少的 downloadable plugin，且第二次重啟不會執行隱藏的依賴修復。
  - 也會安裝已知的較舊 npm baseline、在執行 `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證 candidate 的 post-update doctor 會清理 legacy plugin dependency debris，而不需要 harness-side postinstall repair。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guests 執行原生 packaged-install update smoke。每個選取的平台會先安裝要求的 baseline package，然後在同一個 guest 中執行已安裝的 `openclaw update` 命令，並驗證已安裝版本、更新狀態、Gateway readiness，以及一次本機 agent 回合。
  - 迭代單一 guest 時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得 summary artifact path 與每個通道的狀態。
  - OpenAI 通道預設使用 `openai/gpt-5.5` 進行即時 agent-turn proof。若刻意驗證其他 OpenAI model，請傳入 `--model <provider/model>` 或設定 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 將長時間本機執行包在主機 timeout 中，避免 Parallels transport stall 消耗剩餘測試時間：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script 會在 `/tmp/openclaw-parallels-npm-update.*` 底下寫入巢狀通道 logs。在假設外層 wrapper 卡住前，先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows update 在冷 guest 上可能會花 10 到 15 分鐘執行 post-update doctor 與 package update 工作；只要巢狀 npm debug log 持續推進，這仍然是正常狀態。
  - 不要將此 aggregate wrapper 與個別 Parallels macOS、Windows 或 Linux smoke lanes 平行執行。它們共用 VM 狀態，可能在 snapshot restore、package serving 或 guest Gateway state 上衝突。
  - post-update proof 會執行一般 bundled plugin surface，因為 speech、image generation 和 media understanding 等 capability facades 即使在 agent turn 本身只檢查簡單文字回應時，也會透過 bundled runtime APIs 載入。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider server，用於直接 protocol smoke testing。
- `pnpm openclaw qa matrix`
  - 針對一次性的 Docker-backed Tuwunel homeserver 執行 Matrix 即時 QA 通道。僅限 source-checkout，packaged installs 不會出貨 `qa-lab`。
  - 完整 CLI、profile/scenario catalog、env vars 與 artifact layout：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自 env 的 driver 與 SUT bot tokens，針對真實 private group 執行 Telegram 即時 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必須是數字 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共用 pooled credentials。預設使用 env mode，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選擇 pooled leases。
  - 預設涵蓋 canary、mention gating、command addressing、`/status`、bot-to-bot mentioned replies，以及 core native command replies。`mock-openai` 預設也涵蓋 deterministic reply-chain 與 Telegram final-message streaming 迴歸。使用 `--list-scenarios` 查看 `session_status` 等可選 probes。
  - 當任何情境失敗時，以非零狀態結束。若你想取得成品但不想要失敗的結束碼，請使用 `--allow-failures`。
  - 需要同一個 private group 中有兩個不同的 bots，且 SUT bot 必須公開 Telegram username。
  - 為了穩定觀察 bot-to-bot，請在 `@BotFather` 中為兩個 bots 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 能觀察 group bot traffic。
  - 在 `.artifacts/qa-e2e/...` 底下寫入 Telegram QA report、summary 與 observed-messages artifact。回覆情境包含從 driver send request 到觀察到 SUT reply 的 RTT。

`Mantis Telegram Live` 是此通道周邊的 PR-evidence wrapper。它會使用 Convex-leased Telegram credentials 執行 candidate ref、在 Crabbox desktop browser 中呈現已遮蔽的 observed-message transcript、錄製 MP4 證據、產生 motion-trimmed GIF、上傳 artifact bundle，並在設定 `pr_number` 時，透過 Mantis GitHub App 發布 inline PR evidence。Maintainers 可以透過 `Mantis Scenario`（`scenario_id:
telegram-live`）從 Actions UI 啟動，或直接從 pull request comment 啟動：

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` 是用於 PR visual proof 的 agentic native Telegram Desktop before/after wrapper。可透過帶有自由格式 `instructions` 的 Actions UI、透過 `Mantis Scenario`（`scenario_id:
telegram-desktop-proof`），或從 PR comment 啟動：

```text
@Mantis telegram desktop proof
```

Mantis agent 會讀取 PR、判斷哪些 Telegram 可見行為能證明該變更，並在 baseline 與 candidate refs 上執行真實使用者 Crabbox Telegram Desktop 證明通道，反覆調整直到原生 GIF 足夠實用，寫入成對的 `motionPreview` manifest，且在設定 `pr_number` 時透過 Mantis GitHub App 發布相同的 2 欄 GIF 表格。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或重用 Crabbox Linux 桌面、安裝原生 Telegram Desktop、使用租用的 Telegram SUT bot token 設定 OpenClaw、啟動 Gateway，並從可見的 VNC 桌面錄製截圖/MP4 證據。
  - 預設為 `--credential-source convex`，因此工作流程只需要 Convex broker secret。若要使用與 `pnpm openclaw qa telegram` 相同的 `OPENCLAW_QA_TELEGRAM_*` 變數，請使用 `--credential-source env`。
  - Telegram Desktop 仍需要使用者登入/個人資料。bot token 只會設定 OpenClaw。對 base64 `.tgz` 個人資料封存檔使用 `--telegram-profile-archive-env <name>`，或使用 `--keep-lease` 並透過 VNC 手動登入一次。
  - 在輸出目錄下寫入 `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png` 和 `telegram-desktop-builder.mp4`。

即時傳輸通道共用一個標準合約，避免新的傳輸產生分歧；各通道覆蓋矩陣位於 [QA overview → 即時傳輸覆蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的合成套件，不屬於該矩陣的一部分。

### 透過 Convex 共用 Telegram 憑證（v1）

為即時傳輸 QA 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex-backed pool 取得獨佔租約，在通道執行期間對該租約執行 Heartbeat，並在關閉時釋放租約。章節名稱早於 Discord、Slack 和 WhatsApp 支援；租約合約在不同種類之間共用。

參考 Convex 專案 scaffold：

- `qa/convex-credential-broker/`

必要 env vars：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選角色的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- 憑證角色選擇：
  - CLI：`--credential-role maintainer|ci`
  - Env 預設值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中預設為 `ci`，否則為 `maintainer`）

選用 env vars：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許 local-only 開發使用 loopback `http://` Convex URLs。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

Maintainer admin commands（pool add/remove/list）明確需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

給維護者的 CLI helpers：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時執行前使用 `doctor` 檢查 Convex site URL、broker secrets、endpoint prefix、HTTP timeout，以及 admin/list 可達性，且不列印 secret values。在 scripts 與 CI utilities 中使用 `--json` 取得 machine-readable output。

預設 endpoint contract（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Exhausted/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Success: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Success: `{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Success: `{ status: "ok" }`（或空的 `2xx`）
- `POST /admin/add`（僅 maintainer secret）
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove`（僅 maintainer secret）
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅 maintainer secret）
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Telegram kind 的 payload shape：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字 Telegram chat id string。
- `admin/add` 會針對 `kind: "telegram"` 驗證此 shape，並拒絕格式錯誤的 payloads。

Telegram 真實使用者 kind 的 payload shape：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId` 和 `telegramApiId` 必須是數字 strings。
- `tdlibArchiveSha256` 和 `desktopTdataArchiveSha256` 必須是 SHA-256 hex strings。
- `kind: "telegram-user"` 代表一個 Telegram burner account。請將租約視為 account-wide：TDLib CLI driver 與 Telegram Desktop visual witness 會從相同 payload 還原，且同一時間只應有一個工作持有該租約。

Telegram 真實使用者租約還原：

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

需要視覺錄影時，請搭配 `Telegram -workdir "$tmp/desktop"` 使用還原的 Desktop profile。在本機 operator environments 中，若 process env vars 不存在，`scripts/e2e/telegram-user-credential.ts` 預設會讀取 `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env`。

Agent-driven Crabbox session：

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` 會租用 `telegram-user` credential、將相同帳號還原至 Crabbox Linux 桌面上的 TDLib 與 Telegram Desktop、從目前 checkout 啟動本機 mock SUT Gateway、開啟可見的 Telegram chat、開始 desktop recording，並寫入 private `session.json`。session 存活期間，agent 可以持續測試直到滿意為止：

- `send --session <file> --text <message>` 會透過真實 TDLib 使用者送出，並等待 SUT reply。
- `run --session <file> -- <remote command>` 會在 Crabbox 上執行任意 command 並儲存其 output，例如 `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`。
- `screenshot --session <file>` 會擷取目前可見桌面。
- `status --session <file>` 會列印 lease 與 WebVNC command。
- `finish --session <file>` 會停止 recorder、擷取 screenshot/video/motion-trim artifacts、釋放 Convex credential、停止本機 SUT processes，並停止 Crabbox lease，除非傳入 `--keep-box`。
- `publish --session <file> --pr <number>` 預設會發布僅含 GIF 的 PR comment。只有在刻意需要 logs 或 JSON artifacts 時，才傳入 `--full-artifacts`。

若要 deterministic visual repros，請將 `--mock-response-file <path>` 傳給 `start` 或單一 command `probe` shorthand。runner 預設使用標準 Crabbox class、24fps recording、24fps motion GIF previews，以及 1920px GIF width。只有在 proof 需要不同 capture settings 時，才用 `--class`、`--record-fps`、`--preview-fps` 和 `--preview-width` 覆寫。

單一 command Crabbox proof：

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

預設 `probe` command 是一個 start/send/finish cycle 的 shorthand。用它進行快速 `/status` smoke。PR review、bug-reproduction work，或任何 agent 在判定 proof 完成前需要數分鐘任意 experimentation 的情況，請使用 session commands。使用 `--id <cbx_...>` 重用 warm desktop lease、`--keep-box` 在 finish 後保持 VNC 開啟、`--desktop-chat-title <name>` 選擇可見 chat，以及在使用預先建好的 Linux `libtdjson.so` archive 而非在 fresh box 上建置 TDLib 時使用 `--tdlib-url <tgz>`。runner 會透過 `--tdlib-sha256 <hex>` 驗證 `--tdlib-url`，或預設使用相鄰的 `<url>.sha256` file。

Broker-validated multi-channel payloads：

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack 通道也可以從 pool 租用，但 Slack payload validation 目前位於 Slack QA runner，而不是 broker。Slack rows 請使用 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`。

### 將通道加入 QA

新 channel adapters 的架構與 scenario-helper 名稱位於 [QA overview → 新增通道](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低標準：在共用 `qa-lab` host seam 上實作 transport runner、在 Plugin manifest 宣告 `qaRunners`、掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫 scenarios。

## Test suites（在哪裡執行什麼）

把 suites 視為「真實程度逐步提高」（同時 flakiness/cost 也提高）：

### Unit / integration（預設）

- Command: `pnpm test`
- Config: untargeted runs 會使用 `vitest.full-*.config.ts` shard set，並可能將 multi-project shards 展開為 per-project configs，以便 parallel scheduling
- Files: `src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的 core/unit inventories；UI unit tests 會在專用的 `unit-ui` shard 中執行
- Scope:
  - Pure unit tests
  - In-process integration tests（Gateway auth、routing、tooling、parsing、config）
  - 已知 bugs 的 deterministic regressions
- Expectations:
  - 在 CI 中執行
  - 不需要真實 keys
  - 應該快速且穩定
  - Resolver 與 public-surface loader tests 必須使用生成的 tiny Plugin fixtures 證明廣泛的 `api.js` 與 `runtime-api.js` fallback behavior，而不是使用真實 bundled Plugin source APIs。真實 Plugin API loads 屬於 Plugin-owned contract/integration suites。

Native dependency policy:

- 預設測試安裝會略過可選的原生 Discord opus 建置。Discord 語音接收使用純 JS 的 `opusscript` 解碼器，而 `@discordjs/opus` 在 `allowBuilds` 中保持停用，因此本機測試與 Testbox lane 不會編譯原生 addon。
- 如果你刻意需要比較原生 opus 建置，請使用專用的 Discord 語音效能或 live lane。不要在預設 `allowBuilds` 中將 `@discordjs/opus` 設為 `true`；那會讓不相關的安裝/測試迴圈編譯原生程式碼。

<AccordionGroup>
  <Accordion title="專案、分片與作用域 lane">

    - 未指定目標的 `pnpm test` 會執行十二個較小的 shard config（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生 root-project process。這會降低高負載機器上的尖峰 RSS，並避免 auto-reply/extension 工作讓不相關的 suite 資源不足。
    - `pnpm test --watch` 仍使用原生根層 `vitest.config.ts` 專案圖，因為多分片 watch 迴圈並不實用。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過作用域 lane 路由明確的檔案/目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免付出完整根專案啟動成本。
    - `pnpm test:changed` 預設會將變更的 git 路徑展開成便宜的作用域 lane：直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機 import graph 相依項。Config/setup/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的正常智慧本機檢查關卡。它會將 diff 分類成 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然後執行對應的 typecheck、lint 與 guard 命令。它不會執行 Vitest 測試；如需測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅限 release metadata 的版本提升會執行目標版本/config/root-dependency 檢查，並有 guard 拒絕 top-level version 欄位以外的 package 變更。
    - Live Docker ACP harness 編輯會執行聚焦檢查：live Docker auth 腳本的 shell 語法，以及 live Docker scheduler dry-run。只有當 diff 限定在 `scripts["test:docker:live-*"]` 時才會納入 `package.json` 變更；dependency、export、version 與其他 package-surface 編輯仍使用較廣泛的 guard。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純工具區域的 import-light 單元測試，會路由到 `unit-fast` lane，該 lane 會略過 `test/setup-openclaw-runtime.ts`；具狀態/執行期較重的檔案仍留在既有 lane。
    - 選定的 `plugin-sdk` 與 `commands` helper 原始檔也會將 changed-mode 執行對應到這些輕量 lane 中明確的同層測試，因此 helper 編輯可避免重新執行該目錄的完整重型 suite。
    - `auto-reply` 針對 top-level core helpers、top-level `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹有專用 bucket。CI 會進一步將 reply 子樹拆成 agent-runner、dispatch 和 commands/state-routing shard，避免單一 import-heavy bucket 承擔完整 Node 尾端。
    - 一般 PR/main CI 會刻意略過 extension batch sweep 與僅 release 用的 `agentic-plugins` shard。完整 Release Validation 會為 release candidate dispatch 個別的 `Plugin Prerelease` 子工作流程，以執行這些 plugin/extension-heavy suite。

  </Accordion>

  <Accordion title="嵌入式 runner 覆蓋範圍">

    - 當你變更 message-tool discovery input 或 compaction 執行期
      context 時，請保留兩個層級的覆蓋。
    - 為純 routing 與 normalization 邊界加入聚焦的 helper regression。
    - 保持嵌入式 runner 整合 suite 健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些 suite 會驗證 scoped id 與 compaction 行為仍透過真實
      `run.ts` / `compact.ts` 路徑流動；只有 helper 測試
      無法充分取代這些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool 與 isolation 預設值">

    - 基礎 Vitest config 預設為 `threads`。
    - 共享 Vitest config 會固定 `isolate: false`，並在根專案、
      e2e 與 live config 中使用非隔離 runner。
    - 根 UI lane 會保留其 `jsdom` setup 與 optimizer，但也會在
      共享非隔離 runner 上執行。
    - 每個 `pnpm test` shard 都會繼承共享 Vitest config 中相同的
      `threads` + `isolate: false` 預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest child Node
      process 加上 `--no-maglev`，以減少大型本機執行期間的 V8 編譯 churn。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與 stock V8
      行為比較。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構 lane。
    - pre-commit hook 只做格式化。它會重新 stage 格式化後的檔案，
      不會執行 lint、typecheck 或測試。
    - 當你需要智慧本機檢查關卡時，請在 handoff 或 push 前
      明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過便宜的作用域 lane 路由。只有當 agent
      判定 harness、config、package 或 contract 編輯確實需要更廣泛
      Vitest 覆蓋時，才使用
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的 routing
      行為，只是 worker 上限較高。
    - 本機 worker 自動調整刻意採保守策略，當 host load average 已偏高時
      會退避，因此多個並行 Vitest 執行預設造成的影響較小。
    - 基礎 Vitest config 會將 projects/config files 標記為
      `forceRerunTriggers`，因此當測試 wiring 變更時，changed-mode rerun
      仍保持正確。
    - config 會在支援的 host 上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      若你想為直接 profiling 使用單一明確 cache 位置，請設定
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="效能除錯">

    - `pnpm test:perf:imports` 會啟用 Vitest import-duration reporting 加上
      import-breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling view 作用域限定到
      自 `origin/main` 以來變更的檔案。
    - Shard timing data 會寫入 `.artifacts/vitest-shard-timings.json`。
      Whole-config 執行使用 config path 作為 key；include-pattern CI
      shard 會附加 shard name，讓篩選後的 shard 可以分開追蹤。
    - 當某個 hot test 仍把大部分時間花在 startup imports 上時，
      請將 heavy dependency 放在窄範圍本機 `*.runtime.ts` seam 後方，並
      直接 mock 該 seam，而不是 deep-importing runtime helper 只為了
      將它們傳入 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會將 routed
      `test:changed` 與該已提交 diff 的原生 root-project 路徑比較，
      並列印 wall time 與 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過將 changed file list
      路由到 `scripts/test-projects.mjs` 與根 Vitest config，
      benchmark 目前的 dirty tree。
    - `pnpm test:perf:profile:main` 會為 Vitest/Vite startup 與 transform
      overhead 寫入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 會為停用檔案平行度的
      unit suite 寫入 runner CPU+heap profile。

  </Accordion>
</AccordionGroup>

### 穩定性（gateway）

- 命令：`pnpm test:stability:gateway`
- Config：`vitest.gateway.config.ts`，強制使用一個 worker
- 範圍：
  - 預設啟用 diagnostics 並啟動真實 loopback Gateway
  - 透過 diagnostic event path 驅動合成 gateway message、memory 與 large-payload churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 覆蓋 diagnostic stability bundle persistence helpers
  - 斷言 recorder 保持有界、合成 RSS sample 維持在 pressure budget 以下，且 per-session queue depth 會 drain 回零
- 預期：
  - CI-safe 且不需要 key
  - 用於 stability-regression follow-up 的窄 lane，不是完整 Gateway suite 的替代品

### E2E（gateway smoke）

- 命令：`pnpm test:e2e`
- Config：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 底下的 bundled-plugin E2E 測試
- 執行期預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用 adaptive workers（CI：最多 2 個，本機：預設 1 個）。
  - 預設以 silent mode 執行，以降低 console I/O overhead。
- 實用 override：
  - `OPENCLAW_E2E_WORKERS=<n>` 強制指定 worker count（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新啟用 verbose console output。
- 範圍：
  - 多 instance gateway 端對端行為
  - WebSocket/HTTP surface、node pairing，以及較重的 networking
- 預期：
  - 在 CI 中執行（當 pipeline 啟用時）
  - 不需要真實 key
  - 比單元測試有更多 moving parts（可能較慢）

### E2E：OpenShell backend smoke

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 透過 Docker 在 host 上啟動隔離的 OpenShell gateway
  - 從暫時本機 Dockerfile 建立 sandbox
  - 透過真實 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell backend
  - 透過 sandbox fs bridge 驗證 remote-canonical filesystem 行為
- 預期：
  - 僅 opt-in；不屬於預設 `pnpm test:e2e` 執行
  - 需要本機 `openshell` CLI 加上可運作的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，接著銷毀測試 gateway 與 sandbox
- 實用 override：
  - `OPENCLAW_E2E_OPENSHELL=1` 在手動執行較廣泛 e2e suite 時啟用該測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 指向非預設 CLI binary 或 wrapper script

### Live（真實 provider + 真實 model）

- 命令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的 bundled-plugin 即時測試
- 預設值：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個提供者/模型在 _今天_ 使用真實憑證時是否真的可用？」
  - 捕捉提供者格式變更、工具呼叫特殊行為、驗證問題與速率限制行為
- 預期：
  - 設計上並非 CI 穩定（真實網路、真實提供者政策、配額、服務中斷）
  - 會花錢 / 使用速率限制配額
  - 偏好執行縮小範圍的子集，而不是「全部」
- 即時執行會 source `~/.profile` 以取得缺少的 API 金鑰。
- 預設情況下，即時執行仍會隔離 `HOME`，並將設定/驗證材料複製到暫時測試 home，因此單元 fixture 無法變更你真正的 `~/.openclaw`。
- 只有在你刻意需要即時測試使用你真正的 home 目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設採用較安靜的模式：保留 `[live] ...` 進度輸出，但抑制額外的 `~/.profile` 通知，並靜音 Gateway bootstrap 記錄/Bonjour 雜訊。如果你想恢復完整啟動記錄，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 金鑰輪替（提供者特定）：使用逗號/分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可透過 `OPENCLAW_LIVE_*_KEY` 做每次即時執行的覆寫；測試會在遇到速率限制回應時重試。
- 進度/Heartbeat 輸出：
  - 即時套件現在會將進度行輸出到 stderr，因此即使 Vitest 主控台擷取很安靜，長時間的提供者呼叫仍可看出正在活動。
  - `vitest.live.config.ts` 停用 Vitest 主控台攔截，因此提供者/Gateway 進度行會在即時執行期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整直接模型 Heartbeat。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 Gateway/探測 Heartbeat。

## 我應該執行哪個套件？

使用這個決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你變更很多，也執行 `pnpm test:coverage`）
- 觸及 Gateway 網路 / WS 協定 / 配對：加上 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ 提供者特定失敗 / 工具呼叫：執行縮小範圍的 `pnpm test:live`

## 即時（觸及網路）測試

關於即時模型矩陣、CLI 後端 smoke、ACP smoke、Codex app-server
harness，以及所有媒體提供者即時測試（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness）加上即時執行的憑證處理，請參閱
[測試即時套件](/zh-TW/help/testing-live)。關於專用更新與
Plugin 驗證檢查清單，請參閱
[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

## Docker runner（選用的「可在 Linux 運作」檢查）

這些 Docker runner 分成兩類：

- 即時模型 runner：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker 映像中執行各自相符的 profile-key 即時檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），掛載你的本機設定目錄與工作區（如果有掛載，也會 source `~/.profile`）。相符的本機進入點是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 即時 runner 預設使用較小的 smoke 上限，讓完整 Docker 掃描仍保持實用：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明確想要較大的完整掃描時，
  才覆寫這些 env var。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置一次即時 Docker 映像，接著透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 封裝一次為 npm tarball，然後建置/重用兩個 `scripts/e2e/Dockerfile` 映像。bare 映像只是用於安裝/更新/Plugin 相依性 lane 的 Node/Git runner；這些 lane 會掛載預先建置的 tarball。functional 映像會將同一個 tarball 安裝到 `/app`，用於已建置 app 功能 lane。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選取的計畫。彙總使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制處理程序 slot，而資源上限會避免繁重即時、npm-install 與多服務 lane 全部同時啟動。如果單一 lane 比目前上限更重，排程器仍可在 pool 為空時啟動它，然後讓它單獨執行，直到容量再次可用。預設值為 10 個 slot、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 與 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker host 有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。runner 預設會執行 Docker preflight、移除過期的 OpenClaw E2E container、每 30 秒列印狀態、將成功 lane 計時儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行時使用這些計時優先啟動較長的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印加權 lane manifest，而不建置或執行 Docker；或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lane、package/image 需求與憑證的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生套件 gate，用於判斷「這個可安裝 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個候選套件，將其上傳為 `package-under-test`，然後針對該確切 tarball 執行可重用的 Docker E2E lane，而不是重新封裝所選 ref。profile 依廣度排序為：`smoke`、`package`、`product` 和 `full`。關於套件/更新/Plugin 合約、已發布升級 survivor 矩陣、release 預設值與失敗分流，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。
- 建置與 release 檢查會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。guard 會從 `dist/entry.js` 和 `dist/cli/run-main.js` 巡覽靜態建置圖，並在命令分派前的 pre-dispatch startup 匯入 Commander、prompt UI、undici 或 logging 等套件相依性時失敗；它也會讓 bundled Gateway run chunk 保持在預算內，並拒絕已知 cold Gateway 路徑的靜態匯入。已封裝 CLI smoke 也涵蓋 root help、onboard help、doctor help、status、config schema，以及 model-list 命令。
- 套件驗收舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點之前，harness 只容忍已出貨套件的 metadata 缺口：省略的 private QA inventory 項目、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔案、缺少持久化的 `update.channel`、舊版 Plugin 安裝記錄位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的設定 metadata 遷移。對於 `2026.4.25` 之後的套件，這些路徑都是嚴格失敗。
- Container smoke runner：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 會啟動一個或多個真實 container，並驗證較高層級的整合路徑。

即時模型 Docker runner 也只會 bind-mount 所需的 CLI auth home（或在執行未縮小範圍時掛載所有支援的 auth home），然後在執行前將它們複製到 container home，讓外部 CLI OAuth 可以重新整理 token，而不會變更 host auth store：

- 直接模型：`pnpm test:docker:live-models`（指令碼：`scripts/test-live-models-docker.sh`）
- ACP 繫結煙霧測試：`pnpm test:docker:live-acp-bind`（指令碼：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 嚴格涵蓋 Droid/OpenCode）
- CLI 後端煙霧測試：`pnpm test:docker:live-cli-backend`（指令碼：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 煙霧測試：`pnpm test:docker:live-codex-harness`（指令碼：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開發代理程式：`pnpm test:docker:live-gateway`（指令碼：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性煙霧測試：`pnpm qa:otel:smoke` 是私人 QA 原始碼 checkout 路徑。它刻意不屬於套件 Docker 發行路徑，因為 npm tarball 會省略 QA Lab。
- Open WebUI 即時煙霧測試：`pnpm test:docker:openwebui`（指令碼：`scripts/e2e/openwebui-docker.sh`）
- 入門精靈（TTY、完整 scaffold）：`pnpm test:docker:onboard`（指令碼：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 入門/頻道/代理程式煙霧測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝已打包的 OpenClaw tarball，透過 env-ref 入門流程設定 OpenAI，並預設設定 Telegram，執行 doctor，然後執行一次模擬的 OpenAI 代理程式回合。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳過主機重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換頻道。
- Skill 安裝煙霧測試：`pnpm test:docker:skill-install` 會在 Docker 中全域安裝已打包的 OpenClaw tarball，在設定中停用上傳封存檔安裝，從搜尋解析目前即時 ClawHub skill slug，使用 `openclaw skills install` 安裝它，並驗證已安裝的 skill 以及 `.clawhub` origin/lock 中繼資料。
- 更新頻道切換煙霧測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝已打包的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證持久化頻道和 Plugin 更新後運作，接著切回套件 `stable` 並檢查更新狀態。
- 升級倖存者煙霧測試：`pnpm test:docker:upgrade-survivor` 會將已打包的 OpenClaw tarball 安裝到一個髒的舊使用者 fixture 上，其中包含代理程式、頻道設定、Plugin allowlists、過期的 Plugin 依賴狀態，以及既有 workspace/session 檔案。它會在沒有即時供應商或頻道金鑰的情況下執行套件更新與非互動式 doctor，然後啟動 local loopback Gateway，並檢查設定/狀態保留以及啟動/狀態預算。
- 已發布升級倖存者煙霧測試：`pnpm test:docker:published-upgrade-survivor` 預設會安裝 `openclaw@latest`，植入逼真的既有使用者檔案，用 baked command recipe 設定該基準，驗證產生的設定，將該已發布安裝更新到候選 tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 local loopback Gateway，並檢查已設定 intents、狀態保留、啟動、`/healthz`、`/readyz` 和 RPC 狀態預算。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 要求彙總排程器展開精確本機基準，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，並使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue 形狀的 fixtures，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動外部 OpenClaw Plugin 安裝修復。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析像 `last-stable-4` 或 `all-since-2026.4.23` 這類中繼基準 token，而 Full Release Validation 會將 release-soak 套件 gate 展開為 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加上 `reported-issues`。
- Session runtime context 煙霧測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏 runtime context transcript 持久化，以及 doctor 修復受影響的重複 prompt-rewrite 分支。
- Bun 全域安裝煙霧測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會打包目前樹狀結構，在隔離 home 中用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會回傳 bundled image providers，而不是卡住。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳過主機建置，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- 安裝器 Docker 煙霧測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm 容器之間共用一個 npm 快取。Update 煙霧測試在升級到候選 tarball 前，預設以 npm `latest` 作為 stable 基準。在本機使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上使用 Install Smoke workflow 的 `update_baseline_version` 輸入覆寫。非 root 安裝器檢查會保留隔離的 npm 快取，避免 root 擁有的快取項目遮蔽使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`，可在本機重跑時重用 root/update/direct-npm 快取。
- Install Smoke CI 使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳過重複的 direct-npm 全域更新；需要直接 `npm install -g` 覆蓋時，請在本機執行不帶該 env 的指令碼。
- Agents 刪除共用 workspace CLI 煙霧測試：`pnpm test:docker:agents-delete-shared-workspace`（指令碼：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置根 Dockerfile 映像，在隔離容器 home 中植入兩個代理程式與一個 workspace，執行 `agents delete --json`，並驗證有效 JSON 以及保留 workspace 的行為。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke 映像。
- Gateway 網路（兩個容器、WS 驗證 + health）：`pnpm test:docker:gateway-network`（指令碼：`scripts/e2e/gateway-network-docker.sh`）
- Browser CDP snapshot 煙霧測試：`pnpm test:docker:browser-cdp-snapshot`（指令碼：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置 source E2E 映像加上一個 Chromium layer，以原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP role snapshots 涵蓋 link URLs、cursor-promoted clickables、iframe refs 和 frame metadata。
- OpenAI Responses web_search minimal reasoning regression：`pnpm test:docker:openai-web-search-minimal`（指令碼：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行模擬的 OpenAI server，驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提高到 `low`，然後強制供應商 schema reject，並檢查原始 detail 會出現在 Gateway logs 中。
- MCP 頻道橋接（植入的 Gateway + stdio bridge + 原始 Claude notification-frame 煙霧測試）：`pnpm test:docker:mcp-channels`（指令碼：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP tools（真實 stdio MCP server + embedded Pi profile allow/deny 煙霧測試）：`pnpm test:docker:pi-bundle-mcp-tools`（指令碼：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP cleanup（真實 Gateway + stdio MCP child 在隔離 cron 和一次性 subagent 執行後 teardown）：`pnpm test:docker:cron-mcp-cleanup`（指令碼：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（本機路徑、`file:`、具 hoisted dependencies 的 npm registry、git moving refs、ClawHub kitchen-sink、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update 煙霧測試）：`pnpm test:docker:plugins`（指令碼：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳過 ClawHub 區塊，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的 kitchen-sink package/runtime 配對。若沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用 hermetic 本機 ClawHub fixture server。
- Plugin 更新 unchanged 煙霧測試：`pnpm test:docker:plugin-update`（指令碼：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin 生命週期矩陣煙霧測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在裸容器中安裝已打包的 OpenClaw tarball，安裝 npm Plugin，切換啟用/停用，透過本機 npm registry 對其升級與降級，刪除已安裝的程式碼，接著驗證 uninstall 仍會移除過期狀態，同時記錄每個生命週期階段的 RSS/CPU metrics。
- 設定 reload metadata 煙霧測試：`pnpm test:docker:config-reload`（指令碼：`scripts/e2e/config-reload-source-docker.sh`）
- Plugins：`pnpm test:docker:plugins` 涵蓋本機路徑、`file:`、具 hoisted dependencies 的 npm registry、git moving refs、ClawHub fixtures、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update 煙霧測試。`pnpm test:docker:plugin-update` 涵蓋已安裝 Plugin 的 unchanged update 行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋具資源追蹤的 npm Plugin install、enable、disable、upgrade、downgrade，以及 missing-code uninstall。

若要手動預先建置並重用共用功能映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定後，像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 這類 suite-specific image overrides 仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，如果本機尚未存在，指令碼會拉取它。QR 和安裝器 Docker 測試會保留自己的 Dockerfiles，因為它們驗證的是套件/安裝行為，而不是共用 built-app runtime。

即時模型 Docker 執行器也會以唯讀方式 bind-mount 目前的 checkout，並
將其 stage 到容器內的臨時工作目錄。這能讓執行階段
映像保持精簡，同時仍針對你確切的本機原始碼/設定執行 Vitest。
staging 步驟會跳過大型的僅限本機快取與應用程式建置輸出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及應用程式本機的 `.build` 或
Gradle 輸出目錄，讓 Docker 即時執行不會花數分鐘複製
特定機器的成品。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，讓 Gateway 即時探測不會在容器內啟動
真正的 Telegram/Discord 等頻道 worker。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要縮小或排除該 Docker lane 中的 Gateway
即時覆蓋範圍時，也要傳入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高層級的相容性 smoke：它會啟動一個
已啟用 OpenAI 相容 HTTP 端點的 OpenClaw Gateway 容器，
再啟動一個釘選版本的 Open WebUI 容器連到該 Gateway，透過
Open WebUI 登入，驗證 `/api/models` 會公開 `openclaw/default`，接著透過 Open WebUI 的 `/api/chat/completions` proxy 傳送
真正的聊天請求。
針對 release 路徑的 CI 檢查，若應在 Open WebUI 登入與模型探索後停止、
不等待即時模型完成，請設定 `OPENWEBUI_SMOKE_MODE=models`。
第一次執行可能會明顯較慢，因為 Docker 可能需要拉取
Open WebUI 映像，而 Open WebUI 可能需要完成自己的冷啟動設定。
此 lane 需要可用的即時模型金鑰，而 `OPENCLAW_PROFILE_FILE`
（預設為 `~/.profile`）是在 Docker 化執行中提供它的主要方式。
成功執行會列印一小段 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意保持 deterministic 的流程，且不需要
真正的 Telegram、Discord 或 iMessage 帳號。它會啟動一個已 seeded 的 Gateway
容器，啟動第二個容器來 spawn `openclaw mcp serve`，接著
驗證 routed conversation discovery、transcript 讀取、附件中繼資料、
即時事件佇列行為、outbound send routing，以及透過真實 stdio MCP bridge 傳遞的 Claude 風格頻道與
權限通知。通知檢查會直接檢查原始 stdio MCP frames，讓 smoke 驗證
bridge 實際發出的內容，而不只是某個特定 client SDK 剛好暴露的內容。
`test:docker:pi-bundle-mcp-tools` 是 deterministic，且不需要即時
模型金鑰。它會建置 repo Docker 映像，在容器內啟動真正的 stdio MCP probe server，
透過 embedded Pi bundle
MCP runtime 實體化該 server，執行 tool，接著驗證 `coding` 與 `messaging` 會保留
`bundle-mcp` tools，而 `minimal` 與 `tools.deny: ["bundle-mcp"]` 會將它們濾除。
`test:docker:cron-mcp-cleanup` 是 deterministic，且不需要即時模型
金鑰。它會啟動帶有真實 stdio MCP probe server 的 seeded Gateway，執行
隔離的 cron turn 與 `/subagents spawn` one-shot child turn，接著驗證
MCP child process 會在每次執行後退出。

手動 ACP plain-language thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此 script 供 regression/debug workflow 使用。ACP thread routing validation 可能還會再次需要它，因此不要刪除。

實用 env vars：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）掛載到 `/home/node/.profile`，並在執行測試前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 只驗證從 `OPENCLAW_PROFILE_FILE` source 的 env vars，使用臨時 config/workspace dirs，且不掛載外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）掛載到 `/home/node/.npm-global`，用於 Docker 內快取的 CLI 安裝
- `$HOME` 底下的外部 CLI auth dirs/files 會以唯讀方式掛載到 `/host-auth...` 下，接著在測試開始前複製到 `/home/node/...`
  - 預設 dirs：`.minimax`
  - 預設 files：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 縮窄範圍的 provider 執行只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要 dirs/files
  - 可用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的逗號清單手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於在容器內篩選 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 可在不需要重新建置的重跑中重用既有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保 creds 來自 profile store（而不是 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇 Gateway 為 Open WebUI smoke 暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI smoke 使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用於覆寫釘選的 Open WebUI 映像標籤

## Docs 健全性檢查

文件編輯後執行 docs checks：`pnpm check:docs`。
當你也需要頁面內 heading 檢查時，執行完整的 Mintlify anchor validation：`pnpm docs:check-links:anchors`。

## 離線 regression（CI 安全）

這些是不使用真實 providers 的「真實 pipeline」regressions：

- Gateway tool calling（mock OpenAI，真實 gateway + agent loop）：`src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway wizard（WS `wizard.start`/`wizard.next`，寫入 config + 強制 auth）：`src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## Agent reliability evals（skills）

我們已經有幾個 CI 安全測試，行為類似「agent reliability evals」：

- 透過真實 gateway + agent loop 進行 mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 與 config effects 的 end-to-end wizard flows（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請見 [Skills](/zh-TW/tools/skills)）：

- **決策：** 當 prompt 中列出 skills 時，agent 是否會選擇正確的 skill（或避開不相關的 skill）？
- **合規性：** agent 是否會在使用前讀取 `SKILL.md`，並遵循必要的 steps/args？
- **Workflow contracts：** 斷言 tool order、session history carryover 與 sandbox boundaries 的 multi-turn scenarios。

未來 evals 應先保持 deterministic：

- 使用 mock providers 的 scenario runner，用於斷言 tool calls + order、skill file reads 與 session wiring。
- 一小套專注於 skill 的 scenarios（使用 vs 避免、gating、prompt injection）。
- Optional live evals（opt-in、env-gated）只在 CI 安全 suite 到位後加入。

## Contract tests（Plugin 與 channel shape）

Contract tests 會驗證每個已註冊的 Plugin 與 channel 都符合其
interface contract。它們會迭代所有已探索到的 plugins，並執行一組
shape 與 behavior assertions。預設 `pnpm test` unit lane 會刻意
跳過這些共享 seam 與 smoke files；當你觸及 shared channel 或 provider surfaces 時，
請明確執行 contract commands。

### 命令

- 所有 contracts：`pnpm test:contracts`
- 僅 channel contracts：`pnpm test:contracts:channels`
- 僅 provider contracts：`pnpm test:contracts:plugins`

### Channel contracts

位於 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本 Plugin shape（id、name、capabilities）
- **setup** - Setup wizard contract
- **session-binding** - Session binding behavior
- **outbound-payload** - Message payload structure
- **inbound** - Inbound message handling
- **actions** - Channel action handlers
- **threading** - Thread ID handling
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contracts

位於 `src/plugins/contracts/*.contract.test.ts`。

- **status** - Channel status probes
- **registry** - Plugin registry shape

### Provider contracts

位於 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - Auth flow contract
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Setup wizard

### 何時執行

- 變更 plugin-sdk exports 或 subpaths 後
- 新增或修改 channel 或 provider Plugin 後
- 重構 Plugin registration 或 discovery 後

Contract tests 會在 CI 中執行，且不需要真實 API keys。

## 新增 regressions（指引）

當你修復在 live 中發現的 provider/model 問題時：

- 盡可能新增 CI 安全的 regression（mock/stub provider，或 capture 確切的 request-shape transformation）
- 如果本質上只能 live-only（rate limits、auth policies），請讓 live test 保持狹窄，並透過 env vars opt-in
- 優先鎖定能捕捉 bug 的最小層級：
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 或 CI 安全的 gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class 衍生一個 sampled target，接著斷言 traversal-segment exec ids 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增新的 `includeInPlan` SecretRef target family，請更新該測試中的 `classifyTargetClass`。此測試會刻意在未分類 target ids 上失敗，讓新的 classes 不能被無聲跳過。

## 相關

- [測試 live](/zh-TW/help/testing-live)
- [測試 updates 與 plugins](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
