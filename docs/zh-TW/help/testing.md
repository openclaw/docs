---
read_when:
    - 在本機或 CI 中執行測試
    - 新增模型/提供者錯誤的回歸測試
    - 偵錯 Gateway + 代理程式行為
summary: 測試工具包：unit/e2e/live 測試套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-05-05T01:47:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 套件（單元/整合、e2e、live）以及一小組
Docker runner。這份文件是「我們如何測試」指南：

- 每個套件涵蓋什麼（以及它刻意_不_涵蓋什麼）。
- 常見工作流程要執行哪些命令（本機、推送前、除錯）。
- live 測試如何探索認證資料並選擇模型/供應商。
- 如何為真實世界的模型/供應商問題新增回歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、live transport lanes）**另有文件說明：

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) — 架構、命令介面、情境撰寫。
- [Matrix QA](/zh-TW/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的參考。
- [QA channel](/zh-TW/channels/qa-channel) — repo 支援情境使用的合成傳輸 Plugin。

本頁涵蓋一般測試套件與 Docker/Parallels runner 的執行方式。下方的 QA 專用 runner 區段（[QA 專用 runner](#qa-specific-runners)）列出具體的 `qa` 呼叫，並指回上方參考資料。
</Note>

## 快速開始

多數時候：

- 完整閘門（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足機器上較快的本機完整套件執行：`pnpm test:max`
- 直接的 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在迭代單一失敗時，優先使用目標明確的執行。
- Docker 支援的 QA site：`pnpm qa:lab:up`
- Linux VM 支援的 QA lane：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你觸及測試或想要額外信心時：

- 覆蓋率閘門：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

當除錯真實供應商/模型時（需要真實認證資料）：

- Live 套件（模型 + Gateway 工具/圖片探測）：`pnpm test:live`
- 安靜地指定一個 live 檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行階段效能報告：dispatch `OpenClaw Performance`，搭配
  `live_gpt54=true` 進行真實 `openai/gpt-5.4` agent turn，或搭配
  `deep_profile=true` 產生 Kova CPU/heap/trace 成品。每日排程執行會在
  `CLAWGRIT_REPORTS_TOKEN` 已設定時，將 mock-provider、deep-profile 與 GPT 5.4 lane 成品發布到
  `openclaw/clawgrit-reports`。mock-provider 報告也包含原始碼層級的 gateway 啟動、記憶體、
  plugin-pressure、重複 fake-model hello-loop，以及 CLI 啟動數據。
- Docker live 模型掃描：`pnpm test:docker:live-models`
  - 每個選取的模型現在會執行一個文字 turn 加上一個小型 file-read 風格探測。
    中繼資料宣告支援 `image` 輸入的模型也會執行一個小型圖片 turn。
    隔離供應商失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋範圍：每日 `OpenClaw Scheduled Live And E2E Checks` 和手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用的 live/E2E workflow，
    其中包含依供應商分片的個別 Docker live 模型矩陣工作。
  - 針對重點 CI 重新執行，dispatch `OpenClaw Live And E2E Checks (Reusable)`，
    搭配 `include_live_suites: true` 與 `live_models_only: true`。
  - 將新的高訊號供應商 secrets 新增到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其
    排程/發布呼叫端。
- 原生 Codex bound-chat smoke：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker live lane，使用 `/codex bind` 綁定合成
    Slack DM，演練 `/codex fast` 和
    `/codex permissions`，接著驗證純文字回覆與圖片附件會透過原生 Plugin 綁定路由，而不是 ACP。
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`
  - 透過 Plugin 擁有的 Codex app-server harness 執行 Gateway agent turn，
    驗證 `/codex status` 和 `/codex models`，並預設演練圖片、
    cron MCP、sub-agent 與 Guardian 探測。隔離其他 Codex
    app-server 失敗時，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用 sub-agent 探測。若要進行聚焦的 sub-agent 檢查，停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    這會在 sub-agent 探測後結束，除非已設定
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`。
- Crestodian rescue command smoke：`pnpm test:live:crestodian-rescue-channel`
  - 針對 message-channel rescue command
    介面的選用雙重保險檢查。它會演練 `/crestodian status`，佇列持久模型
    變更，回覆 `/crestodian yes`，並驗證稽核/設定寫入路徑。
- Crestodian planner Docker smoke：`pnpm test:docker:crestodian-planner`
  - 在沒有設定檔的容器中執行 Crestodian，且 `PATH`
    上有假的 Claude CLI，並驗證模糊 planner fallback 會轉譯成經稽核的具型別
    設定寫入。
- Crestodian first-run Docker smoke：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw state dir 開始，將裸 `openclaw` 路由到
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入，
    驗證設定，並驗證稽核項目。同一個 Ring 0 設定路徑也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆蓋。
- Moonshot/Kimi cost smoke：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對
  `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存正規化後的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先使用下方描述的 allowlist env vars 縮小 live 測試範圍。
</Tip>

## QA 專用 runner

當你需要 QA-lab 的真實度時，這些命令與主要測試套件並列：

CI 會在專用 workflow 中執行 QA Lab。Agentic parity 巢狀位於
`QA-Lab - All Lanes` 和發布驗證之下，而不是獨立的 PR workflow。
廣泛驗證應使用 `Full Release Validation`，搭配
`rerun_group=qa-parity` 或 release-checks QA group。穩定/預設發布
檢查會把完整 live/Docker soak 保留在 `run_release_soak=true` 之後；`full` profile 會強制啟用 soak。`QA-Lab - All Lanes`
會在 `main` 每晚執行，並可透過手動 dispatch 執行，其中 mock parity lane、live
Matrix lane、Convex 管理的 live Telegram lane，以及 Convex 管理的 live Discord
lane 會作為平行工作執行。排程 QA 和發布檢查會明確傳入 Matrix
`--profile fast`，而 Matrix CLI 與手動 workflow input
預設仍為 `all`；手動 dispatch 可將 `all` 分片為 `transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 工作。`OpenClaw Release
Checks` 會在發布核准前執行 parity 加上快速 Matrix 與 Telegram lane，
並使用 `mock-openai/gpt-5.5` 進行發布傳輸檢查，讓它們保持
決定性並避免一般 provider-plugin 啟動。這些 live transport
gateways 會停用記憶體搜尋；記憶體行為仍由 QA parity
套件覆蓋。

完整發布 live media 分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 和 `ffprobe`。Docker live model/backend 分片使用共用
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像檔，該映像檔會針對選取的
commit 建置一次，接著以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由 repo 支援的 QA 情境。
  - 預設會透過隔離的
    Gateway worker 平行執行多個選定情境。`qa-channel` 預設並行度為 4（受限於
    選定情境數量）。使用 `--concurrency <count>` 調整 worker
    數量，或使用 `--concurrency 1` 執行較舊的序列路徑。
  - 當任何情境失敗時會以非零狀態結束。當你想要產生成品但不想要失敗結束碼時，請使用 `--allow-failures`。
  - 支援提供者模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 會啟動本機 AIMock 支援的提供者伺服器，用於實驗性
    fixture 和 protocol-mock 覆蓋範圍，而不會取代具情境感知能力的
    `mock-openai` 路徑。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行 live OpenAI Kitchen Sink Plugin 挑戰。它會
    安裝外部 Kitchen Sink 套件、驗證 Plugin SDK surface
    inventory、探測 `/healthz` 和 `/readyz`、記錄 Gateway CPU/RSS
    證據、執行一次 live OpenAI 回合，並檢查對抗式診斷。
    需要 live OpenAI 驗證，例如 `OPENAI_API_KEY`。在已補齊環境的 Testbox
    工作階段中，當存在 `openclaw-testbox-env` helper 時，它會自動載入 Testbox
    live-auth profile。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 Gateway 啟動 bench 加上一小組模擬 QA Lab 情境包
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`)，並在 `.artifacts/gateway-cpu-scenarios/`
    下寫入合併的 CPU 觀察摘要。
  - 預設只標記持續高 CPU 觀察結果（`--cpu-core-warn`
    加上 `--hot-wall-warn-ms`），因此短暫的啟動尖峰會被記錄為指標，
    不會看起來像持續數分鐘的 Gateway 滿載回歸。
  - 使用建置完成的 `dist` 成品；當 checkout 尚未有新的 runtime 輸出時，請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 內執行相同的 QA suite。
  - 保持與主機上 `qa suite` 相同的情境選擇行為。
  - 重用與 `qa suite` 相同的提供者/模型選擇旗標。
  - live 執行會轉送對 guest 可行且支援的 QA auth 輸入：
    以 env 為基礎的提供者金鑰、QA live provider config path，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須保持在 repo 根目錄下，讓 guest 可以透過
    掛載的工作區寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA 報告與摘要，加上 Multipass 記錄。
- `pnpm qa:lab:up`
  - 啟動 Docker 支援的 QA site，用於操作員式 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball、在
    Docker 中全域安裝、執行非互動式 OpenAI API key onboarding、預設設定 Telegram、
    驗證封裝後的 Plugin runtime 載入時不需要啟動期
    dependency repair、執行 doctor，並針對模擬的 OpenAI endpoint 執行一次本機 agent 回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的 packaged-install
    路徑。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式 runtime context
    transcript 執行決定性的 built-app Docker smoke。它會驗證隱藏的 OpenClaw runtime context 會以
    非顯示 custom message 持久化，而不是洩漏到可見的使用者回合中，
    然後植入受影響的損壞 session JSONL，並驗證
    `openclaw doctor --fix` 會將它重寫到 active branch 並建立備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw package candidate、執行 installed-package
    onboarding、透過已安裝的 CLI 設定 Telegram，然後使用該已安裝套件作為 SUT Gateway
    重用 live Telegram QA 路徑。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，可測試已解析的本機 tarball，而不是
    從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env credentials 或 Convex credential source。
    對於 CI/release automation，請設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` 加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 role secret。如果
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex role secret 存在於 CI，
    Docker wrapper 會自動選擇 Convex。
  - wrapper 會在 Docker build/install 工作前，在主機上驗證 Telegram 或 Convex credential env。
    只有在刻意偵錯 credential 前置設定時，才設定 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此路徑覆寫共用的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 將此路徑公開為手動 maintainer workflow
    `NPM Telegram Beta E2E`。它不會在 merge 時執行。該 workflow 使用
    `qa-live-shared` environment 和 Convex CI credential leases。
- GitHub Actions 也公開 `Package Acceptance`，用於針對單一 candidate package
  進行 side-run 產品證明。它接受受信任的 ref、已發布的 npm spec、
  HTTPS tarball URL 加 SHA-256，或來自另一個 run 的 tarball artifact，並上傳
  正規化的 `openclaw-current.tgz` 作為 `package-under-test`，接著使用 smoke、package、product、full 或 custom
  路徑 profile 執行既有 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`
  可讓 Telegram QA workflow 針對相同的 `package-under-test` artifact 執行。
  - 最新 beta 產品證明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精確 tarball URL 證明需要 digest：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- artifact 證明會從另一個 Actions run 下載 tarball artifact：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中封裝並安裝目前的 OpenClaw build、啟動已設定 OpenAI 的 Gateway，
    然後透過 config 編輯啟用 bundled channel/plugins。
  - 驗證 setup discovery 會讓未設定的可下載 Plugin 保持不存在、
    第一次設定完成的 doctor repair 會明確安裝每個缺少的可下載
    Plugin，而第二次重新啟動不會執行隱藏的 dependency
    repair。
  - 也會安裝已知較舊的 npm baseline，在執行
    `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證 candidate 的
    post-update doctor 會清理 legacy Plugin dependency 碎片，而不需要
    harness-side postinstall repair。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 執行原生 packaged-install update smoke。每個
    選定平台會先安裝指定的 baseline package，然後在同一個 guest 中執行
    已安裝的 `openclaw update` 命令，並驗證已安裝版本、update status、Gateway readiness，以及一次本機 agent
    回合。
  - 迭代單一 guest 時使用 `--platform macos`、`--platform windows` 或 `--platform linux`。
    使用 `--json` 取得摘要 artifact path 和各路徑狀態。
  - OpenAI 路徑預設使用 `openai/gpt-5.5` 作為 live agent-turn 證明。
    當刻意驗證另一個 OpenAI 模型時，傳入 `--model <provider/model>` 或設定
    `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 用主機 timeout 包住長時間本機執行，避免 Parallels transport 停滯
    消耗剩餘測試時間：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script 會在 `/tmp/openclaw-parallels-npm-update.*` 下寫入巢狀路徑記錄。
    在假設外層 wrapper 卡住之前，先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows update 在 cold guest 上可能會花 10 到 15 分鐘進行 post-update doctor 和 package
    update 工作；只要巢狀 npm debug log 持續前進，這仍然是健康狀態。
  - 不要將這個彙總 wrapper 與個別 Parallels
    macOS、Windows 或 Linux smoke 路徑平行執行。它們共用 VM state，可能在
    snapshot restore、package serving 或 guest Gateway state 上衝突。
  - post-update 證明會執行一般 bundled Plugin surface，因為
    speech、image generation 和 media
    understanding 等 capability facade 是透過 bundled runtime API 載入，即使 agent
    回合本身只檢查簡單文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock 提供者伺服器，用於直接 protocol smoke
    testing。
- `pnpm openclaw qa matrix`
  - 針對一次性的 Docker 支援 Tuwunel homeserver 執行 Matrix live QA 路徑。僅限 source-checkout，packaged install 不會隨附 `qa-lab`。
  - 完整 CLI、profile/scenario catalog、env vars 和 artifact layout：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自 env 的 driver 和 SUT bot token，針對真實 private group 執行 Telegram live QA 路徑。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必須是數字 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共用 pooled credentials。預設使用 env 模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選擇使用 pooled leases。
  - 當任何情境失敗時會以非零狀態結束。當你想要產生成品但不想要失敗結束碼時，請使用 `--allow-failures`。
  - 需要同一個 private group 中兩個不同的 bot，且 SUT bot 必須公開 Telegram username。
  - 為了穩定的 bot-to-bot 觀察，請在 `@BotFather` 中為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 可以觀察 group bot traffic。
  - 在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA report、summary 和 observed-messages artifact。replying 情境包含從 driver send request 到觀察到 SUT reply 的 RTT。

live transport 路徑共用一份標準 contract，讓新的 transport 不會偏離；各路徑 coverage matrix 位於 [QA overview → Live transport coverage](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的 synthetic suite，不屬於該 matrix。

### 透過 Convex 共用 Telegram credentials (v1)

當為 `openclaw qa telegram` 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab
會從 Convex 支援的 pool 取得 exclusive lease，在路徑執行期間對該 lease 傳送 Heartbeat，
並在 shutdown 時釋放該 lease。

參考 Convex project scaffold：

- `qa/convex-credential-broker/`

必要 env vars：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 選定 role 的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- Credential role selection：
  - CLI：`--credential-role maintainer|ci`
  - Env 預設值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中預設為 `ci`，否則為 `maintainer`）

選用 env vars：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許 local-only 開發使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常操作中應使用 `https://`。

Maintainer 管理命令（集區新增/移除/列出）特別需要
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

Maintainer 的 CLI 輔助工具：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時執行前使用 `doctor`，以檢查 Convex 網站 URL、broker secrets、
endpoint prefix、HTTP timeout，以及 admin/list 可連線性，且不列印
secret values。在腳本與 CI
公用程式中使用 `--json` 取得機器可讀輸出。

預設 endpoint contract（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 請求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗盡/可重試：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 請求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - 請求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /admin/add`（僅限 maintainer secret）
  - 請求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（僅限 maintainer secret）
  - 請求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 作用中 lease 防護：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅限 maintainer secret）
  - 請求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 類型的 payload shape：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字形式的 Telegram chat id 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證此 shape，並拒絕格式錯誤的 payload。

### 將 channel 新增到 QA

新 channel adapters 的架構與 scenario-helper 名稱位於 [QA overview → 新增 channel](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低要求：在共用 `qa-lab` host seam 上實作 transport runner、在 Plugin manifest 中宣告 `qaRunners`、掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫 scenarios。

## Test suites（哪些項目在哪裡執行）

可將 suites 視為「逐步提高真實程度」（同時也提高不穩定性/成本）：

### Unit / integration（預設）

- 命令：`pnpm test`
- 設定：未指定目標的執行會使用 `vitest.full-*.config.ts` shard 集合，並可能將多專案 shards 展開成個別專案 configs 以進行平行排程
- 檔案：`src/**/*.test.ts`、`packages/**/*.test.ts` 與 `test/**/*.test.ts` 下的 core/unit inventories；UI unit tests 在專用的 `unit-ui` shard 中執行
- 範圍：
  - 純 unit tests
  - In-process integration tests（Gateway auth、routing、tooling、parsing、config）
  - 已知 bug 的確定性 regressions
- 期望：
  - 在 CI 中執行
  - 不需要真實 keys
  - 應快速且穩定
  - Resolver 與 public-surface loader tests 必須使用產生的小型 Plugin fixtures，證明廣泛 `api.js` 與
    `runtime-api.js` fallback 行為，而不是
    真實 bundled Plugin source APIs。真實 Plugin API loads 屬於
    Plugin 擁有的 contract/integration suites。

<AccordionGroup>
  <Accordion title="Projects、shards 與 scoped lanes">

    - 未指定目標的 `pnpm test` 會執行十二個較小的 shard configs（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生 root-project process。這會降低負載機器上的尖峰 RSS，並避免 auto-reply/extension 工作讓不相關 suites 缺乏資源。
    - `pnpm test --watch` 仍使用原生 root `vitest.config.ts` project graph，因為 multi-shard watch loop 不實用。
    - `pnpm test`、`pnpm test:watch` 與 `pnpm test:perf:imports` 會先透過 scoped lanes 路由明確的檔案/目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免支付完整 root project 啟動成本。
    - `pnpm test:changed` 預設會將已變更的 git paths 展開成便宜的 scoped lanes：直接測試編輯、同層 `*.test.ts` 檔案、明確來源 mappings，以及本機 import-graph dependents。除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`，否則 config/setup/package 編輯不會 broad-run tests。
    - `pnpm check:changed` 是窄範圍工作的正常智慧本機檢查 gate。它會將 diff 分類為 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 與 tooling，然後執行相符的 typecheck、lint 與 guard commands。它不會執行 Vitest tests；如需 test proof，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅 release metadata 的版本 bumps 會執行目標版本/config/root-dependency checks，並有 guard 會拒絕 top-level version field 之外的 package 變更。
    - Live Docker ACP harness 編輯會執行聚焦 checks：live Docker auth scripts 的 shell syntax，以及 live Docker scheduler dry-run。只有當 diff 限於 `scripts["test:docker:live-*"]` 時才包含 `package.json` 變更；dependency、export、version 與其他 package-surface 編輯仍使用較廣泛的 guards。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 與類似純公用程式區域的 import-light unit tests，會透過 `unit-fast` lane 路由，該 lane 會略過 `test/setup-openclaw-runtime.ts`；stateful/runtime-heavy 檔案維持在既有 lanes。
    - 選定的 `plugin-sdk` 與 `commands` helper source files 也會將 changed-mode runs 映射到這些 light lanes 中明確的同層 tests，因此 helper 編輯可避免重新執行該目錄的完整 heavy suite。
    - `auto-reply` 針對 top-level core helpers、top-level `reply.*` integration tests，以及 `src/auto-reply/reply/**` 子樹有專用 buckets。CI 會進一步將 reply 子樹拆成 agent-runner、dispatch 與 commands/state-routing shards，避免單一 import-heavy bucket 擁有完整 Node 尾端。
    - 一般 PR/main CI 會刻意略過 extension batch sweep 與僅 release 的 `agentic-plugins` shard。Full Release Validation 會針對 release candidates 派發獨立的 `Plugin Prerelease` 子 workflow，以執行這些 Plugin/extension-heavy suites。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - 當你變更 message-tool discovery inputs 或 Compaction runtime
      context 時，請保留兩個層級的 coverage。
    - 為純 routing 與 normalization
      boundaries 新增聚焦 helper regressions。
    - 維持 embedded runner integration suites 健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些 suites 驗證 scoped ids 與 Compaction 行為仍會
      透過真實 `run.ts` / `compact.ts` paths 流動；僅 helper 的 tests
      不足以取代這些 integration paths。

  </Accordion>

  <Accordion title="Vitest pool 與 isolation defaults">

    - Base Vitest config 預設為 `threads`。
    - 共用 Vitest config 會固定 `isolate: false`，並在
      root projects、e2e 與 live configs 中使用
      non-isolated runner。
    - Root UI lane 保留其 `jsdom` setup 與 optimizer，但也在
      共用 non-isolated runner 上執行。
    - 每個 `pnpm test` shard 都會從共用 Vitest config 繼承相同的 `threads` + `isolate: false`
      defaults。
    - `scripts/run-vitest.mjs` 預設會為 Vitest child Node
      processes 加上 `--no-maglev`，以降低大型本機執行期間的 V8 compile churn。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與標準 V8
      行為比較。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些 architectural lanes。
    - pre-commit hook 只做 formatting。它會重新 stage 已格式化檔案，且
      不會執行 lint、typecheck 或 tests。
    - 在 handoff 或 push 前，當你需要智慧本機檢查 gate 時，
      明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過便宜的 scoped lanes 路由。只有當 agent
      判定 harness、config、package 或 contract 編輯確實需要更廣泛的
      Vitest coverage 時，才使用
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 與 `pnpm test:changed:max` 保持相同的 routing
      行為，只是提高 worker cap。
    - 本機 worker auto-scaling 刻意保守，且會在 host load average 已經偏高時退讓，因此多個並行
      Vitest runs 預設造成的影響較小。
    - Base Vitest config 會將 projects/config files 標記為
      `forceRerunTriggers`，因此當 test wiring 變更時，changed-mode reruns 仍保持正確。
    - Config 會在支援的 hosts 上維持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      若你想要一個明確的 direct profiling cache 位置，請設定
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` 會啟用 Vitest import-duration reporting 加上
      import-breakdown output。
    - `pnpm test:perf:imports:changed` 會將相同 profiling view 範圍限定到
      自 `origin/main` 以來變更的檔案。
    - Shard timing data 會寫入 `.artifacts/vitest-shard-timings.json`。
      Whole-config runs 會使用 config path 作為 key；include-pattern CI
      shards 會附加 shard name，讓 filtered shards 可被分開追蹤。
    - 當某個 hot test 仍將大部分時間花在 startup imports 時，
      請將 heavy dependencies 放在窄範圍本機 `*.runtime.ts` seam 後方，並
      直接 mock 該 seam，而不是 deep-importing runtime helpers 只是
      為了將它們傳給 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對該已 commit 的
      diff，比較 routed `test:changed` 與原生 root-project path，並列印 wall time 與 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 與 root Vitest config 路由 changed file list，以 benchmark 目前的
      dirty tree。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite startup 與 transform overhead 寫入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 會為
      停用 file parallelism 的 unit suite 寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### Stability（gateway）

- 命令：`pnpm test:stability:gateway`
- Config：`vitest.gateway.config.ts`，強制使用一個 worker
- 範圍：
  - 啟動真實 loopback Gateway，預設啟用 diagnostics
  - 透過 diagnostic event path 驅動合成 gateway message、memory 與 large-payload churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 涵蓋 diagnostic stability bundle persistence helpers
  - 斷言 recorder 保持 bounded、合成 RSS samples 維持在 pressure budget 以下，且 per-session queue depths 會 drain back to zero
- 期望：
  - CI-safe 且不需要 key
  - 這是 stability-regression follow-up 的窄 lane，不是完整 Gateway suite 的替代品

### E2E（gateway smoke）

- 命令：`pnpm test:e2e`
- 設定：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 底下的內建 Plugin E2E 測試
- 執行階段預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與儲存庫其餘部分一致。
  - 使用自適應 worker（CI：最多 2 個，本機：預設 1 個）。
  - 預設以靜默模式執行，以降低主控台 I/O 開銷。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 可強制指定 worker 數量（上限為 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 可重新啟用詳細主控台輸出。
- 範圍：
  - 多執行個體 Gateway 端對端行為
  - WebSocket/HTTP 介面、Node 配對，以及較重的網路功能
- 預期：
  - 在 CI 中執行（當管線中啟用時）
  - 不需要真實金鑰
  - 比單元測試有更多移動部件（可能較慢）

### E2E：OpenShell 後端煙霧測試

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 透過 Docker 在主機上啟動隔離的 OpenShell Gateway
  - 從暫存本機 Dockerfile 建立沙箱
  - 透過真實的 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell 後端
  - 透過沙箱 fs 橋接器驗證遠端標準檔案系統行為
- 預期：
  - 僅限選擇加入；不屬於預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` CLI 以及可用的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀測試 Gateway 和沙箱
- 實用覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1` 可在手動執行較廣泛的 e2e 套件時啟用此測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 可指向非預設的 CLI 二進位檔或 wrapper script

### 即時（真實提供者 + 真實模型）

- 命令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 底下的內建 Plugin 即時測試
- 預設值：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個提供者/模型在 _今天_ 搭配真實憑證是否真的可用？」
  - 捕捉提供者格式變更、工具呼叫怪異行為、驗證問題，以及速率限制行為
- 預期：
  - 依設計並非 CI 穩定（真實網路、真實提供者政策、配額、中斷）
  - 會花錢 / 使用速率限制
  - 優先執行縮小範圍的子集，而不是「全部」
- 即時執行會 source `~/.profile` 以取得缺少的 API 金鑰。
- 預設情況下，即時執行仍會隔離 `HOME`，並將設定/驗證素材複製到暫存測試 home，讓單元 fixture 無法修改你真實的 `~/.openclaw`。
- 只有在你刻意需要即時測試使用真實 home 目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設為較安靜的模式：它保留 `[live] ...` 進度輸出，但抑制額外的 `~/.profile` 通知，並靜音 Gateway bootstrap 記錄/Bonjour 雜訊。如果你想恢復完整啟動記錄，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 金鑰輪替（依提供者而定）：設定 `*_API_KEYS` 使用逗號/分號格式，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 進行單次即時覆寫；測試會在速率限制回應時重試。
- 進度/Heartbeat 輸出：
  - 即時套件現在會將進度行輸出到 stderr，因此即使 Vitest 主控台擷取很安靜，長時間的提供者呼叫也會明顯顯示為作用中。
  - `vitest.live.config.ts` 會停用 Vitest 主控台攔截，因此提供者/Gateway 進度行會在即時執行期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整直接模型 Heartbeat。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 Gateway/探測 Heartbeat。

## 我應該執行哪個套件？

使用這個決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果變更很多，另執行 `pnpm test:coverage`）
- 觸碰 Gateway 網路 / WS protocol / 配對：加入 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ 提供者特定失敗 / 工具呼叫：執行縮小範圍的 `pnpm test:live`

## 即時（觸碰網路的）測試

關於即時模型矩陣、CLI 後端煙霧測試、ACP 煙霧測試、Codex app-server
harness，以及所有媒體提供者即時測試（Deepgram、BytePlus、ComfyUI、影像、
音樂、影片、媒體 harness）以及即時執行的憑證處理，請參閱
[測試即時套件](/zh-TW/help/testing-live)。關於專用更新與
Plugin 驗證檢查清單，請參閱
[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

## Docker runner（選用的「在 Linux 中可運作」檢查）

這些 Docker runner 分成兩類：

- 即時模型 runner：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在儲存庫 Docker 映像內執行其相符 profile-key 的即時檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），掛載你的本機設定目錄與工作區（如果已掛載，也會 source `~/.profile`）。相符的本機進入點是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 即時 runner 預設使用較小的煙霧測試上限，讓完整 Docker 掃描保持實用：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。當你明確需要較大的詳盡掃描時，可覆寫這些 env vars。
- `test:docker:all` 會先透過 `test:docker:live-build` 建立即時 Docker 映像一次，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包成 npm tarball 一次，然後建置/重用兩個 `scripts/e2e/Dockerfile` 映像。bare 映像只是用於安裝/更新/Plugin 依賴 lane 的 Node/Git runner；這些 lane 會掛載預先建置的 tarball。functional 映像會將同一個 tarball 安裝到 `/app`，用於已建置應用程式功能 lane。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 執行所選計畫。彙總執行使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序 slot，而資源上限會避免繁重的即時、npm-install，以及多服務 lane 全部同時啟動。如果單一 lane 比作用中的上限更重，排程器在池為空時仍可啟動它，並讓它獨自持續執行，直到容量再次可用。預設值為 10 個 slot、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。runner 預設會執行 Docker preflight、移除過期的 OpenClaw E2E container、每 30 秒列印狀態、將成功 lane 計時儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行中使用這些計時優先啟動較長的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印加權 lane manifest，而不建置或執行 Docker；或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lane、package/image 需求，以及憑證的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生 package gate，用來驗證「這個可安裝 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個候選 package，上傳為 `package-under-test`，然後針對該精確 tarball 執行可重用的 Docker E2E lane，而不是重新打包所選 ref。Profile 依涵蓋廣度排序：`smoke`、`package`、`product` 和 `full`。關於 package/update/Plugin 合約、已發布升級 survivor 矩陣、release 預設值，以及失敗分流，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。
- 建置與 release 檢查會在 tsdown 之後執行 `scripts/check-cli-bootstrap-imports.mjs`。guard 會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪靜態建置圖，若預派送啟動流程在命令派送前匯入 Commander、prompt UI、undici 或 logging 等 package dependencies，就會失敗；它也會讓內建 Gateway run chunk 保持在預算內，並拒絕已知冷 Gateway 路徑的靜態匯入。封裝後的 CLI 煙霧測試也涵蓋 root help、onboard help、doctor help、status、config schema，以及 model-list 命令。
- Package Acceptance 舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點之前，harness 只容忍已發布 package 的 metadata 缺口：省略的 private QA inventory entries、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch files、缺少持久化的 `update.channel`、舊版 Plugin install-record 位置、缺少 marketplace install-record 持久化，以及 `plugins update` 期間的 config metadata 遷移。對於 `2026.4.25` 之後的 package，這些路徑都是嚴格失敗。
- Container 煙霧測試 runner：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`，以及 `test:docker:config-reload` 會啟動一個或多個真實 container，並驗證較高層級的整合路徑。

即時模型 Docker runner 也只會 bind-mount 所需的 CLI auth homes（或在未縮小範圍執行時掛載所有支援項目），然後在執行前將它們複製到 container home，因此外部 CLI OAuth 可以重新整理 token，而不會修改主機 auth store：

- 直接模型：`pnpm test:docker:live-models`（腳本：`scripts/test-live-models-docker.sh`）
- ACP 繫結冒煙測試：`pnpm test:docker:live-acp-bind`（腳本：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 與 `pnpm test:docker:live-acp-bind:opencode` 嚴格涵蓋 Droid/OpenCode）
- CLI 後端冒煙測試：`pnpm test:docker:live-cli-backend`（腳本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server 測試框架冒煙測試：`pnpm test:docker:live-codex-harness`（腳本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開發代理：`pnpm test:docker:live-gateway`（腳本：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性冒煙測試：`pnpm qa:otel:smoke` 是私有 QA 原始碼簽出通道。它刻意不屬於套件 Docker 發行通道，因為 npm tarball 會省略 QA Lab。
- Open WebUI 即時冒煙測試：`pnpm test:docker:openwebui`（腳本：`scripts/e2e/openwebui-docker.sh`）
- 入門精靈（TTY，完整鷹架）：`pnpm test:docker:onboard`（腳本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 入門/channel/agent 冒煙測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝封裝好的 OpenClaw tarball，透過 env-ref 入門流程設定 OpenAI，並預設設定 Telegram，接著執行 doctor，並執行一次模擬的 OpenAI agent 回合。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 略過主機重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換 channel。
- 更新 channel 切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝封裝好的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證已持久化的 channel 和 Plugin 更新後可運作，然後切回套件 `stable` 並檢查更新狀態。
- 升級存活者冒煙測試：`pnpm test:docker:upgrade-survivor` 會在帶有 agents、channel 設定、Plugin allowlists、過期 Plugin 依賴狀態，以及現有工作區/session 檔案的髒舊使用者 fixture 上，安裝封裝好的 OpenClaw tarball。它會在沒有即時 provider 或 channel keys 的情況下執行套件更新加上非互動式 doctor，然後啟動 loopback Gateway，並檢查設定/狀態保留以及啟動/狀態預算。
- 已發布升級存活者冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設安裝 `openclaw@latest`、植入逼真的既有使用者檔案、用內建命令配方設定該基準、驗證產生的設定、將該已發布安裝更新到候選 tarball、執行非互動式 doctor、寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 loopback Gateway，並檢查已設定 intents、狀態保留、啟動、`/healthz`、`/readyz` 和 RPC 狀態預算。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫一個基準，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 要求彙總排程器展開精確基準，例如 `all-since-2026.4.23`，並使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue 形狀的 fixtures，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動外部 OpenClaw Plugin 安裝修復。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`；Full Release Validation 會在阻斷路徑中使用預設 latest 基準，且只在 `run_release_soak=true` 或 `release_profile=full` 時展開到 all-since/reported-issues。
- Session 執行階段 context 冒煙測試：`pnpm test:docker:session-runtime-context` 驗證隱藏執行階段 context transcript 持久化，以及 doctor 對受影響重複 prompt-rewrite 分支的修復。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會封裝目前樹狀內容，在隔離 home 中以 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 回傳內建 image providers，而不是掛起。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 略過主機建置，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- Installer Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm 容器之間共用一個 npm 快取。更新冒煙測試預設使用 npm `latest` 作為 stable 基準，再升級到候選 tarball。在本機使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上使用 Install Smoke workflow 的 `update_baseline_version` 輸入覆寫。非 root installer 檢查會保留隔離的 npm 快取，因此 root 擁有的快取項目不會掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本機重跑時重用 root/update/direct-npm 快取。
- Install Smoke CI 使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 略過重複的 direct-npm 全域更新；需要 direct `npm install -g` 涵蓋時，請在本機不帶該 env 執行腳本。
- Agents 刪除共用工作區 CLI 冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（腳本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置 root Dockerfile 映像，在隔離容器 home 中植入兩個 agents 和一個工作區，執行 `agents delete --json`，並驗證有效 JSON 以及工作區保留行為。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke 映像。
- Gateway 網路（兩個容器，WS auth + health）：`pnpm test:docker:gateway-network`（腳本：`scripts/e2e/gateway-network-docker.sh`）
- Browser CDP snapshot 冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（腳本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置 source E2E 映像加上一層 Chromium，使用原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP role snapshots 涵蓋 link URLs、cursor-promoted clickables、iframe refs 和 frame metadata。
- OpenAI Responses web_search minimal reasoning 迴歸測試：`pnpm test:docker:openai-web-search-minimal`（腳本：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行模擬的 OpenAI server，驗證 `web_search` 將 `reasoning.effort` 從 `minimal` 提升到 `low`，然後強制 provider schema reject，並檢查原始 detail 出現在 Gateway logs 中。
- MCP channel bridge（已植入的 Gateway + stdio bridge + 原始 Claude notification-frame 冒煙測試）：`pnpm test:docker:mcp-channels`（腳本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP tools（真實 stdio MCP server + 內嵌 Pi profile allow/deny 冒煙測試）：`pnpm test:docker:pi-bundle-mcp-tools`（腳本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真實 Gateway + 在隔離 cron 與一次性 subagent 執行後拆除 stdio MCP child）：`pnpm test:docker:cron-mcp-cleanup`（腳本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（local path、`file:`、帶 hoisted dependencies 的 npm registry、git moving refs、ClawHub kitchen-sink、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update 冒煙測試）：`pnpm test:docker:plugins`（腳本：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可略過 ClawHub 區塊，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的 kitchen-sink package/runtime 配對。若沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用 hermetic 本機 ClawHub fixture server。
- Plugin 更新未變更冒煙測試：`pnpm test:docker:plugin-update`（腳本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin lifecycle matrix 冒煙測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在裸容器中安裝封裝好的 OpenClaw tarball、安裝 npm Plugin、切換啟用/停用、透過本機 npm registry 升級和降級它、刪除已安裝程式碼，然後驗證 uninstall 仍會移除過期狀態，同時記錄每個 lifecycle 階段的 RSS/CPU 指標。
- 設定重新載入 metadata 冒煙測試：`pnpm test:docker:config-reload`（腳本：`scripts/e2e/config-reload-source-docker.sh`）
- Plugins：`pnpm test:docker:plugins` 涵蓋 local path、`file:`、帶 hoisted dependencies 的 npm registry、git moving refs、ClawHub fixtures、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update 冒煙測試。`pnpm test:docker:plugin-update` 涵蓋已安裝 Plugins 的未變更更新行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋具資源追蹤的 npm Plugin install、enable、disable、upgrade、downgrade，以及 missing-code uninstall。

若要手動預建並重用共用 functional 映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定時，套件專屬映像覆寫值（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，如果本機尚未存在，腳本會拉取該映像。QR 和 installer Docker 測試保留自己的 Dockerfiles，因為它們驗證的是套件/安裝行為，而不是共用 built-app runtime。

即時模型 Docker 執行器也會以唯讀方式 bind-mount 目前 checkout，並
將它暫存到容器內的臨時工作目錄。這可保持 runtime
映像精簡，同時仍能針對你確切的本機 source/config 執行 Vitest。
暫存步驟會略過大型的本機專用快取與 app 建置輸出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及 app 本機的 `.build` 或
Gradle 輸出目錄，因此 Docker 即時執行不會花數分鐘複製
機器專用成品。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此 Gateway 即時探測不會在
容器內啟動真正的 Telegram/Discord/等 channel workers。
`test:docker:live-models` 仍會執行 `pnpm test:live`，所以當你需要縮小或排除該 Docker lane 的 Gateway
即時覆蓋範圍時，也要傳入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高階的相容性 smoke：它會啟動一個
已啟用 OpenAI 相容 HTTP 端點的 OpenClaw Gateway 容器，
再啟動一個釘選版本的 Open WebUI 容器連到該 Gateway，透過
Open WebUI 登入，驗證 `/api/models` 會暴露 `openclaw/default`，然後透過 Open WebUI 的 `/api/chat/completions` proxy 傳送一個
真正的聊天請求。
第一次執行可能明顯較慢，因為 Docker 可能需要拉取
Open WebUI 映像，而 Open WebUI 也可能需要完成自己的冷啟動設定。
此 lane 預期有可用的即時模型 key，而 `OPENCLAW_PROFILE_FILE`
（預設為 `~/.profile`）是在 Docker 化執行中提供它的主要方式。
成功執行會印出一小段 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意設計成確定性的，且不需要
真正的 Telegram、Discord 或 iMessage 帳號。它會啟動一個 seeded Gateway
容器，啟動第二個容器來 spawn `openclaw mcp serve`，然後
驗證 routed conversation discovery、transcript reads、attachment metadata、
live event queue behavior、outbound send routing，以及透過真正 stdio MCP bridge 的 Claude 風格 channel +
permission notifications。notification 檢查會直接檢查 raw stdio MCP frames，
因此此 smoke 驗證的是 bridge 實際發出的內容，而不只是特定 client SDK
剛好呈現的內容。
`test:docker:pi-bundle-mcp-tools` 是確定性的，且不需要即時
模型 key。它會建置 repo Docker 映像，在容器內啟動真正的 stdio MCP probe server，
透過 embedded Pi bundle MCP runtime 將該 server materialize，
執行 tool，然後驗證 `coding` 和 `messaging` 會保留
`bundle-mcp` tools，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 會過濾它們。
`test:docker:cron-mcp-cleanup` 是確定性的，且不需要即時模型
key。它會啟動含有真正 stdio MCP probe server 的 seeded Gateway，執行
隔離的 cron turn 和一個 `/subagents spawn` one-shot child turn，然後驗證
MCP 子程序會在每次執行後結束。

手動 ACP 純語言 thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此 script 供迴歸/除錯工作流程使用。ACP thread routing 驗證日後可能還會再次需要它，因此不要刪除。

實用環境變數：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）掛載到 `/home/node/.profile`，並在執行測試前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 僅驗證從 `OPENCLAW_PROFILE_FILE` source 的環境變數，使用臨時 config/workspace 目錄且不掛載外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）掛載到 `/home/node/.npm-global`，供 Docker 內快取 CLI installs
- `$HOME` 底下的外部 CLI auth dirs/files 會以唯讀方式掛載在 `/host-auth...` 底下，然後在測試開始前複製到 `/home/node/...`
  - 預設目錄：`.minimax`
  - 預設檔案：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 縮小範圍的 provider 執行只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要 dirs/files
  - 可用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的 comma list 手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用來縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用來在容器內過濾 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 可在不需要 rebuild 的重跑中重用現有 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 確保 creds 來自 profile store（而不是 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用來選擇 Gateway 為 Open WebUI smoke 暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用來覆寫 Open WebUI smoke 使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用來覆寫釘選的 Open WebUI image tag

## 文件健全性檢查

文件編輯後執行 docs 檢查：`pnpm check:docs`。
當你也需要頁面內 heading 檢查時，執行完整 Mintlify anchor validation：`pnpm docs:check-links:anchors`。

## 離線迴歸（CI 安全）

這些是不使用真正 providers 的「真實 pipeline」迴歸：

- Gateway tool calling（mock OpenAI，真實 gateway + agent loop）：`src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway wizard（WS `wizard.start`/`wizard.next`，寫入 config + 強制 auth）：`src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## Agent 可靠性評估（skills）

我們已經有一些 CI 安全測試，行為類似「agent reliability evals」：

- 透過真實 Gateway + agent loop 的 Mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 和 config effects 的端到端 wizard flows（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請見 [Skills](/zh-TW/tools/skills)）：

- **決策：** 當 prompt 中列出 skills 時，agent 是否會選擇正確的 skill（或避開不相關的 skill）？
- **合規：** agent 是否會在使用前閱讀 `SKILL.md`，並遵循必要 steps/args？
- **工作流程契約：** 斷言 tool order、session history carryover 和 sandbox boundaries 的多輪 scenarios。

未來 evals 應優先保持確定性：

- 使用 mock providers 的 scenario runner，用來斷言 tool calls + order、skill file reads 和 session wiring。
- 一小套以 skill 為重點的 scenarios（use vs avoid、gating、prompt injection）。
- Optional live evals（opt-in、env-gated）僅在 CI 安全 suite 就位後才加入。

## 契約測試（Plugin 和 channel shape）

契約測試會驗證每個已註冊 Plugin 和 channel 都符合其
interface contract。它們會迭代所有 discovered plugins，並執行一套
shape 和 behavior assertions。預設的 `pnpm test` unit lane 會刻意
略過這些 shared seam 和 smoke files；當你觸及 shared channel 或 provider surfaces 時，
請明確執行 contract commands。

### Commands

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

契約測試會在 CI 中執行，且不需要真正的 API keys。

## 新增迴歸（指引）

當你修復在 live 中發現的 provider/model 問題時：

- 盡可能新增 CI 安全迴歸（mock/stub provider，或捕捉確切的 request-shape transformation）
- 如果本質上只能 live 測試（rate limits、auth policies），請保持 live test 範圍狹窄，並透過 env vars opt-in
- 優先鎖定能捕捉該 bug 的最小層級：
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 或 CI 安全 gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class 推導一個 sampled target，然後斷言 traversal-segment exec ids 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 新增新的 `includeInPlan` SecretRef target family，請更新該測試中的 `classifyTargetClass`。該測試會刻意在未分類的 target ids 上失敗，讓新的 classes 不會被無聲略過。

## 相關

- [測試 live](/zh-TW/help/testing-live)
- [測試 updates 和 plugins](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
