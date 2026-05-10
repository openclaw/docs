---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/提供者錯誤新增迴歸測試
    - 偵錯 Gateway + 代理程式行為
summary: 測試工具包：單元/e2e/即時套件、Docker 執行器，以及各項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-05-10T19:38:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 套件（單元/整合、e2e、live）以及少量
Docker 執行器。這份文件是「我們如何測試」指南：

- 每個套件涵蓋的範圍（以及它刻意_不_涵蓋的範圍）。
- 常見工作流程（本機、推送前、除錯）要執行哪些命令。
- live 測試如何探索憑證並選擇模型/供應商。
- 如何為真實世界的模型/供應商問題新增迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、live 傳輸通道）**另有文件說明：

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) - 架構、命令介面、情境撰寫。
- [Matrix QA](/zh-TW/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的參考。
- [QA 頻道](/zh-TW/channels/qa-channel) - 由儲存庫支援的情境使用的合成傳輸 Plugin。

本頁涵蓋如何執行一般測試套件和 Docker/Parallels 執行器。下方的 QA 專用執行器章節（[QA 專用執行器](#qa-specific-runners)）列出具體的 `qa` 呼叫，並指回上方參考文件。
</Note>

## 快速開始

大多數時候：

- 完整閘門（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足的機器上更快執行本機完整套件：`pnpm test:max`
- 直接 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在反覆處理單一失敗時，優先使用目標明確的執行。
- Docker 支援的 QA 網站：`pnpm qa:lab:up`
- Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你碰到測試或想要額外信心時：

- 覆蓋率閘門：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

當除錯真實供應商/模型時（需要真實憑證）：

- Live 套件（模型 + Gateway 工具/圖片探測）：`pnpm test:live`
- 安靜地指定一個 live 檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行階段效能報告：分派 `OpenClaw Performance`，並使用
  `live_gpt54=true` 來執行真實 `openai/gpt-5.4` agent 回合，或使用
  `deep_profile=true` 來產生 Kova CPU/heap/trace 成品。當已設定 `CLAWGRIT_REPORTS_TOKEN` 時，每日排程執行會將 mock-provider、deep-profile 和 GPT 5.4 通道成品發布到
  `openclaw/clawgrit-reports`。mock-provider 報告也包含原始碼層級的 Gateway 啟動、記憶體、
  Plugin 壓力、重複 fake-model hello-loop，以及 CLI 啟動數據。
- Docker live 模型掃描：`pnpm test:docker:live-models`
  - 每個選定模型現在會執行一個文字回合，加上一個小型的檔案讀取風格探測。
    metadata 標示支援 `image` 輸入的模型也會執行一個小型圖片回合。
    在隔離供應商失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋率：每日 `OpenClaw Scheduled Live And E2E Checks` 和手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用的 live/E2E workflow，其中包含依供應商分片的獨立 Docker live 模型
    matrix 工作。
  - 若要進行聚焦的 CI 重新執行，請以 `include_live_suites: true` 和 `live_models_only: true` 分派 `OpenClaw Live And E2E Checks (Reusable)`。
  - 將新的高訊號供應商 secret 新增到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其
    scheduled/release 呼叫端。
- 原生 Codex bound-chat 煙霧測試：`pnpm test:docker:live-codex-bind`
  - 對 Codex app-server 路徑執行 Docker live 通道，使用 `/codex bind` 綁定一個合成
    Slack DM，測試 `/codex fast` 和
    `/codex permissions`，接著驗證純文字回覆和圖片附件
    是透過原生 Plugin 綁定而不是 ACP 路由。
- Codex app-server harness 煙霧測試：`pnpm test:docker:live-codex-harness`
  - 透過 Plugin 擁有的 Codex app-server harness 執行 Gateway agent 回合，
    驗證 `/codex status` 和 `/codex models`，並預設測試圖片、
    Cron MCP、sub-agent 和 Guardian 探測。當隔離其他 Codex
    app-server 失敗時，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用 sub-agent 探測。若要進行聚焦的 sub-agent 檢查，請停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則這會在 sub-agent 探測後結束。
- Codex 隨需安裝煙霧測試：`pnpm test:docker:codex-on-demand`
  - 在 Docker 中安裝封裝後的 OpenClaw tarball，執行 OpenAI API-key
    onboarding，並驗證 Codex Plugin 加上 `@openai/codex` 相依性
    已隨需下載到受管理的 npm root。
- Live Plugin 工具相依性煙霧測試：`pnpm test:docker:live-plugin-tool`
  - 封裝一個帶有真實 `slugify` 相依性的 fixture Plugin，透過
    `npm-pack:` 安裝，驗證受管理 npm root 下的相依性，接著要求
    live OpenAI 模型呼叫 Plugin 工具並傳回隱藏 slug。
- Crestodian 救援命令煙霧測試：`pnpm test:live:crestodian-rescue-channel`
  - 對訊息頻道救援命令介面的選用雙重保險檢查。
    它會測試 `/crestodian status`、排入持久性模型
    變更、回覆 `/crestodian yes`，並驗證稽核/設定寫入路徑。
- Crestodian planner Docker 煙霧測試：`pnpm test:docker:crestodian-planner`
  - 在無設定容器中執行 Crestodian，`PATH` 上有假的 Claude CLI，
    並驗證 fuzzy planner fallback 會轉換為經稽核的 typed
    設定寫入。
- Crestodian 首次執行 Docker 煙霧測試：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw state dir 開始，將裸 `openclaw` 路由到
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入，
    驗證設定，並驗證稽核項目。相同的 Ring 0 設定路徑
    也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆蓋。
- Moonshot/Kimi 成本煙霧測試：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對
  `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先透過下方描述的 allowlist env vars 縮小 live 測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA-lab 真實度時，這些命令位於主要測試套件旁：

CI 會在專用 workflow 中執行 QA Lab。Agentic parity 巢狀位於
`QA-Lab - All Lanes` 和 release validation 之下，而不是獨立的 PR workflow。
廣泛驗證應使用 `Full Release Validation`，並搭配
`rerun_group=qa-parity` 或 release-checks QA 群組。Stable/default release
checks 會將完整 live/Docker soak 保留在 `run_release_soak=true` 之後；
`full` profile 會強制啟用 soak。`QA-Lab - All Lanes`
每晚在 `main` 上執行，也可透過手動分派執行，並將 mock parity 通道、live
Matrix 通道、Convex 管理的 live Telegram 通道，以及 Convex 管理的 live Discord
通道作為平行工作。排程 QA 和 release checks 會明確傳入 Matrix
`--profile fast`，而 Matrix CLI 和手動 workflow 輸入
預設仍為 `all`；手動分派可將 `all` 分片為 `transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 工作。`OpenClaw Release
Checks` 會在 release approval 前執行 parity 加上 fast Matrix 和 Telegram 通道，
並對 release transport checks 使用 `mock-openai/gpt-5.5`，以保持
確定性並避免一般 provider-plugin 啟動。這些 live transport
gateways 會停用 memory search；memory 行為仍由 QA parity
套件覆蓋。

Full release live media 分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 和 `ffprobe`。Docker live model/backend 分片使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像，該映像會針對每個選定
commit 建置一次，接著以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在
每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由 repo 支援的 QA 情境。
  - 預設使用隔離的 Gateway worker 平行執行多個選取的情境。`qa-channel` 預設並行數為 4（受限於選取的情境數）。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 走舊版序列 lane。
  - 任一情境失敗時會以非零狀態結束。若你想取得成品但不想要失敗的結束碼，請使用 `--allow-failures`。
  - 支援提供者模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 會啟動一個本機 AIMock 後端的提供者伺服器，用於實驗性 fixture 和協定 mock 覆蓋範圍，而不取代具情境感知能力的 `mock-openai` lane。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行即時 OpenAI Kitchen Sink Plugin gauntlet。它會安裝外部 Kitchen Sink 套件、驗證 plugin SDK surface inventory、探測 `/healthz` 和 `/readyz`、記錄 Gateway CPU/RSS 證據、執行一次即時 OpenAI turn，並檢查對抗式診斷。需要即時 OpenAI 驗證，例如 `OPENAI_API_KEY`。在已 hydrated 的 Testbox 工作階段中，若存在 `openclaw-testbox-env` helper，會自動載入 Testbox live-auth profile。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 Gateway 啟動 bench，加上一小組 mock QA Lab 情境包（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`），並將合併的 CPU 觀察摘要寫入 `.artifacts/gateway-cpu-scenarios/`。
  - 預設只標記持續的高 CPU 觀察（`--cpu-core-warn` 加上 `--hot-wall-warn-ms`），因此短暫啟動尖峰會記錄為指標，而不會看起來像持續數分鐘的 Gateway 滿載迴歸。
  - 使用已建置的 `dist` 成品；當 checkout 尚未有新鮮的執行階段輸出時，請先執行 build。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 內執行相同的 QA suite。
  - 保持與主機上的 `qa suite` 相同的情境選取行為。
  - 重用與 `qa suite` 相同的提供者/模型選取旗標。
  - 即時執行會轉送對 guest 實用且受支援的 QA 驗證輸入：以 env 為基礎的提供者金鑰、QA 即時提供者設定路徑，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須留在 repo root 下，讓 guest 能透過掛載的工作區寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA 報告與摘要，以及 Multipass logs。
- `pnpm qa:lab:up`
  - 啟動 Docker 後端的 QA site，用於 operator-style QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball，在 Docker 中全域安裝，執行非互動式 OpenAI API-key onboarding，預設設定 Telegram，驗證封裝的 Plugin 執行階段載入時不需啟動依賴修復，執行 doctor，並針對 mocked OpenAI endpoint 執行一次本機 agent turn。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的封裝安裝 lane。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式執行階段內容 transcript 執行確定性的 built-app Docker smoke。它會驗證隱藏的 OpenClaw 執行階段內容會以非顯示的自訂訊息持久化，而不是洩漏到可見的使用者 turn，接著 seed 一個受影響的破損 session JSONL，並驗證 `openclaw doctor --fix` 會將它重寫到 active branch 並建立備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw 套件候選版本，執行 installed-package onboarding，透過已安裝的 CLI 設定 Telegram，接著以該已安裝套件作為 SUT Gateway 重用即時 Telegram QA lane。
  - wrapper 只從 checkout 掛載 `qa-lab` harness source；已安裝套件擁有 `dist`、`openclaw/plugin-sdk` 和 bundled Plugin 執行階段，因此該 lane 不會把目前 checkout 的 plugins 混入受測套件。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或 `OPENCLAW_CURRENT_PACKAGE_TGZ`，以測試已解析的本機 tarball，而不是從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env 憑證或 Convex 憑證來源。對於 CI/release automation，設定 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` 加上 `OPENCLAW_QA_CONVEX_SITE_URL` 和 role secret。若 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex role secret，Docker wrapper 會自動選擇 Convex。
  - wrapper 會在 Docker build/install 工作前，於主機上驗證 Telegram 或 Convex 憑證 env。只有在刻意偵錯前憑證設定時，才設定 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此 lane 覆寫共用的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 將此 lane 暴露為手動 maintainer workflow `NPM Telegram Beta E2E`。它不會在 merge 時執行。workflow 使用 `qa-live-shared` 環境和 Convex CI 憑證租約。
- GitHub Actions 也暴露 `Package Acceptance`，用於針對單一候選套件進行 side-run 產品證明。它接受受信任的 ref、已發布的 npm spec、HTTPS tarball URL 加 SHA-256，或來自另一個 run 的 tarball artifact，將正規化的 `openclaw-current.tgz` 上傳為 `package-under-test`，接著以 smoke、package、product、full 或 custom lane profile 執行現有 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可針對相同的 `package-under-test` artifact 執行 Telegram QA workflow。
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

- Artifact 證明會從另一個 Actions run 下載 tarball artifact：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中打包並安裝目前的 OpenClaw build，以設定 OpenAI 的狀態啟動 Gateway，接著透過 config 編輯啟用 bundled channel/plugins。
  - 驗證 setup discovery 會讓未設定的可下載 plugins 缺席、第一次設定的 doctor repair 會明確安裝每個缺少的可下載 Plugin，且第二次重啟不會執行隱藏的依賴修復。
  - 也會安裝一個已知較舊的 npm baseline，在執行 `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證候選版本的 post-update doctor 會清理舊版 Plugin 依賴殘留，而不需要 harness-side postinstall repair。
- `pnpm test:parallels:npm-update`
  - 在 Parallels guests 上執行原生封裝安裝更新 smoke。每個選取的平台會先安裝要求的 baseline 套件，接著在同一個 guest 中執行已安裝的 `openclaw update` 命令，並驗證已安裝版本、更新狀態、Gateway readiness，以及一次本機 agent turn。
  - 反覆測試單一 guest 時使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得摘要 artifact 路徑和各 lane 狀態。
  - OpenAI lane 預設使用 `openai/gpt-5.5` 作為即時 agent-turn 證明。當刻意驗證另一個 OpenAI 模型時，傳入 `--model <provider/model>` 或設定 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 將長時間本機執行包在主機 timeout 中，避免 Parallels transport stall 消耗剩餘測試時段：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script 會將巢狀 lane logs 寫到 `/tmp/openclaw-parallels-npm-update.*` 下。在假設外層 wrapper 掛住之前，先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷 guest 上，Windows update 可能會花 10 到 15 分鐘進行 post-update doctor 和 package update 工作；只要巢狀 npm debug log 仍在前進，這仍屬正常。
  - 不要將此 aggregate wrapper 與個別 Parallels macOS、Windows 或 Linux smoke lanes 平行執行。它們共用 VM 狀態，可能在 snapshot restore、package serving 或 guest Gateway 狀態上碰撞。
  - post-update 證明會執行一般 bundled Plugin surface，因為 speech、image generation 和 media understanding 等 capability facades 會透過 bundled runtime APIs 載入，即使 agent turn 本身只檢查簡單文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock 提供者伺服器，用於直接 protocol smoke testing。
- `pnpm openclaw qa matrix`
  - 針對一次性的 Docker 後端 Tuwunel homeserver 執行 Matrix live QA lane。僅限 source checkout - 封裝安裝不會附帶 `qa-lab`。
  - 完整 CLI、profile/情境 catalog、env vars 和 artifact 配置：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用 env 中的 driver 和 SUT bot tokens，針對真實 private group 執行 Telegram live QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必須是數字 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共用 pooled credentials。預設使用 env mode，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選用 pooled leases。
  - 預設涵蓋 canary、mention gating、command addressing、`/status`、bot-to-bot mentioned replies，以及 core native command replies。`mock-openai` 預設也涵蓋確定性 reply-chain 和 Telegram final-message streaming 迴歸。使用 `--list-scenarios` 查看選用探測，例如 `session_status`。
  - 任一情境失敗時會以非零狀態結束。若你想取得成品但不想要失敗的結束碼，請使用 `--allow-failures`。
  - 需要同一個 private group 中的兩個不同 bots，且 SUT bot 需公開 Telegram username。
  - 為了穩定觀察 bot-to-bot，請在 `@BotFather` 為兩個 bots 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 能觀察 group bot traffic。
  - 在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA 報告、摘要和 observed-messages artifact。回覆情境包含從 driver send request 到觀察到 SUT reply 的 RTT。

`Mantis Telegram Live` 是此 lane 周圍的 PR-evidence wrapper。它會以 Convex 租用的 Telegram 憑證執行候選 ref，在 Crabbox desktop browser 中呈現已遮蔽的 observed-message transcript、記錄 MP4 證據、產生 motion-trimmed GIF、上傳 artifact bundle，並在設定 `pr_number` 時透過 Mantis GitHub App 發布 inline PR 證據。Maintainers 可以透過 Actions UI 的 `Mantis Scenario`（`scenario_id:
telegram-live`）啟動，或直接從 pull request comment 啟動：

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - 租用或重用 Crabbox Linux 桌面、安裝原生 Telegram Desktop、使用租用的 Telegram SUT bot token 設定 OpenClaw、啟動 Gateway，並從可見的 VNC 桌面錄製截圖/MP4 證據。
  - 預設為 `--credential-source convex`，因此工作流程只需要 Convex broker secret。若要使用與 `pnpm openclaw qa telegram` 相同的 `OPENCLAW_QA_TELEGRAM_*` 變數，請使用 `--credential-source env`。
  - Telegram Desktop 仍需要使用者登入/設定檔。bot token 只會設定 OpenClaw。使用 `--telegram-profile-archive-env <name>` 取得 base64 `.tgz` 設定檔封存，或使用 `--keep-lease` 並透過 VNC 手動登入一次。
  - 在輸出目錄下寫入 `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png` 和 `telegram-desktop-builder.mp4`。

即時傳輸通道共用一個標準合約，避免新傳輸方式偏離；各通道覆蓋矩陣位於 [QA 概觀 → 即時傳輸覆蓋](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的合成測試套件，不屬於該矩陣。

### 透過 Convex 共用 Telegram 憑證 (v1)

為即時傳輸 QA 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex 支援的池中取得獨占租約，在通道執行期間對該租約傳送 Heartbeat，並在關閉時釋放租約。章節名稱早於 Discord、Slack 和 WhatsApp 支援；租約合約會跨類型共用。

參考 Convex 專案 scaffold：

- `qa/convex-credential-broker/`

必要 env vars：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選角色的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- 憑證角色選擇：
  - CLI：`--credential-role maintainer|ci`
  - Env 預設值：`OPENCLAW_QA_CREDENTIAL_ROLE`（CI 中預設為 `ci`，否則為 `maintainer`）

選用 env vars：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用追蹤 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許本機限定開發使用 loopback `http://` Convex URL。

一般操作中，`OPENCLAW_QA_CONVEX_SITE_URL` 應使用 `https://`。

維護者管理命令（pool add/remove/list）明確需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

維護者的 CLI helpers：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

即時執行前使用 `doctor` 檢查 Convex site URL、broker secrets、endpoint prefix、HTTP timeout 和 admin/list 可達性，而不列印 secret 值。在 scripts 和 CI utilities 中使用 `--json` 取得機器可讀輸出。

預設 endpoint 合約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

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
- `POST /admin/add`（僅限 maintainer secret）
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove`（僅限 maintainer secret）
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅限 maintainer secret）
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Telegram 類型的 payload 形狀：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字型 Telegram chat id 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證此形狀，並拒絕格式錯誤的 payload。

Telegram 真實使用者類型的 payload 形狀：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId` 和 `telegramApiId` 必須是數字字串。
- `tdlibArchiveSha256` 和 `desktopTdataArchiveSha256` 必須是 SHA-256 十六進位字串。
- `kind: "telegram-user"` 代表一個 Telegram burner account。將租約視為整個帳號層級：TDLib CLI driver 和 Telegram Desktop visual witness 會從相同 payload 還原，且同一時間應只有一個 job 持有租約。

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

需要 visual recording 時，搭配 `Telegram -workdir "$tmp/desktop"` 使用還原的 Desktop 設定檔。在本機 operator 環境中，如果 process env vars 不存在，`scripts/e2e/telegram-user-credential.ts` 預設會讀取 `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env`。

agent 驅動的 Crabbox session：

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

`start` 會租用 `telegram-user` 憑證，在 Crabbox Linux 桌面上將同一個帳號還原到 TDLib 和 Telegram Desktop，從目前 checkout 啟動本機 mock SUT Gateway、開啟可見的 Telegram chat、開始桌面錄製，並寫入私有的 `session.json`。session 存活期間，agent 可以持續測試直到滿意為止：

- `send --session <file> --text <message>` 透過真實 TDLib 使用者傳送，並等待 SUT 回覆。
- `run --session <file> -- <remote command>` 在 Crabbox 上執行任意命令並儲存其輸出，例如 `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`。
- `screenshot --session <file>` 擷取目前可見的桌面。
- `status --session <file>` 列印租約和 WebVNC 命令。
- `finish --session <file>` 停止錄製器、擷取截圖/影片/動作裁切 artifacts、釋放 Convex 憑證、停止本機 SUT processes，並停止 Crabbox 租約，除非傳入 `--keep-box`。
- `publish --session <file> --pr <number>` 預設發布僅含 GIF 的 PR comment。只有在有意需要 logs 或 JSON artifacts 時才傳入 `--full-artifacts`。

若要取得 deterministic visual repros，請將 `--mock-response-file <path>` 傳給 `start` 或 one-command `probe` shorthand。runner 預設使用標準 Crabbox class、24fps recording、24fps motion GIF previews，以及 1920px GIF width。只有在 proof 需要不同 capture settings 時，才使用 `--class`、`--record-fps`、`--preview-fps` 和 `--preview-width` 覆寫。

One-command Crabbox proof：

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

預設 `probe` 命令是一次 start/send/finish 循環的 shorthand。用它進行快速 `/status` smoke。PR review、bug reproduction 工作，或任何 agent 在判定 proof 完成前需要數分鐘任意實驗的情況，請使用 session commands。使用 `--id <cbx_...>` 重用 warm desktop lease、`--keep-box` 在 finish 後保持 VNC 開啟、`--desktop-chat-title <name>` 選取可見 chat，以及在使用預先製作的 Linux `libtdjson.so` archive 而不是在新 box 上建置 TDLib 時使用 `--tdlib-url <tgz>`。runner 會用 `--tdlib-sha256 <hex>` 驗證 `--tdlib-url`，或預設使用同層的 `<url>.sha256` 檔案。

Broker 驗證的 multi-channel payloads：

- Discord：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lanes 也可以從 pool 租用，但 Slack payload validation 目前位於 Slack QA runner，而不是 broker。Slack rows 請使用 `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`。

### 將 channel 新增至 QA

新 channel adapters 的 architecture 和 scenario-helper 名稱位於 [QA 概觀 → 新增 channel](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低門檻：在 shared `qa-lab` host seam 上實作 transport runner、在 Plugin manifest 中宣告 `qaRunners`、掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫 scenarios。

## 測試套件（執行位置）

請將這些套件視為「真實性逐步提高」（同時 flakiness/cost 也提高）：

### Unit / integration（預設）

- Command: `pnpm test`
- Config: 未指定目標的執行會使用 `vitest.full-*.config.ts` shard set，並可能將 multi-project shards 展開為 per-project configs，以進行 parallel scheduling
- Files: `src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的 core/unit inventories；UI unit tests 會在專用的 `unit-ui` shard 中執行
- Scope:
  - 純 unit tests
  - In-process integration tests（Gateway auth、routing、tooling、parsing、config）
  - 已知 bugs 的 deterministic regressions
- Expectations:
  - 在 CI 中執行
  - 不需要真實 keys
  - 應快速且穩定
  - Resolver 和 public-surface loader tests 必須使用產生的微型 Plugin fixtures 證明廣泛 `api.js` 和 `runtime-api.js` fallback 行為，而不是使用真實 bundled Plugin source APIs。真實 Plugin API loads 屬於 Plugin 擁有的 contract/integration suites。

原生相依性政策：

- 預設 test installs 會略過選用的原生 Discord opus builds。Discord voice receive 使用 pure-JS `opusscript` decoder，而 `@discordjs/opus` 保持在 `ignoredBuiltDependencies` 中，因此本機 tests 和 Testbox lanes 不會編譯原生 addon。
- 如果你有意需要比較原生 opus build，請使用專用 Discord voice performance 或 live lane。不要將 `@discordjs/opus` 加回預設 `onlyBuiltDependencies`；那會使無關的 install/test loops 編譯原生程式碼。

<AccordionGroup>
  <Accordion title="Projects、shards 和 scoped lanes">

    - 未指定目標的 `pnpm test` 會執行十二個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個龐大的原生根專案程序。這會降低高負載機器上的 RSS 峰值，並避免 auto-reply/extension 工作使不相關的套件挨餓。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片 watch 迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先將明確的檔案/目錄目標路由到具範圍的 lane，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免付出完整根專案啟動成本。
    - `pnpm test:changed` 預設會將已變更的 git 路徑展開為低成本的具範圍 lane：直接測試編輯、相鄰的 `*.test.ts` 檔案、明確的來源對應，以及本機匯入圖相依項。設定/設置/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的標準智慧本機檢查閘門。它會將 diff 分類為 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然後執行相符的 typecheck、lint 和 guard 命令。它不會執行 Vitest 測試；需要測試證明時，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅 release metadata 的版本遞增會執行目標式版本/設定/根相依性檢查，並透過 guard 拒絕頂層版本欄位以外的 package 變更。
    - Live Docker ACP harness 編輯會執行聚焦檢查：live Docker auth 腳本的 shell 語法，以及 live Docker scheduler dry-run。只有當 diff 限於 `scripts["test:docker:live-*"]` 時才會納入 `package.json` 變更；相依性、匯出、版本和其他 package surface 編輯仍會使用較廣泛的 guard。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純工具區域的輕量匯入單元測試，會路由到 `unit-fast` lane，該 lane 會略過 `test/setup-openclaw-runtime.ts`；具狀態/重度 runtime 的檔案則維持在既有 lane。
    - 部分 `plugin-sdk` 和 `commands` helper source 檔案也會將 changed-mode 執行對應到那些輕量 lane 中明確的相鄰測試，因此 helper 編輯可避免重新執行該目錄完整的重度套件。
    - `auto-reply` 有專用 bucket，分別處理頂層 core helpers、頂層 `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹。CI 進一步將 reply 子樹拆分為 agent-runner、dispatch 和 commands/state-routing 分片，因此單一匯入繁重的 bucket 不會獨占完整的 Node 尾端。
    - 一般 PR/main CI 會刻意略過 extension 批次掃描和僅 release 使用的 `agentic-plugins` 分片。完整 Release Validation 會為 release candidates 分派獨立的 `Plugin Prerelease` 子工作流程，以執行那些 plugin/extension 繁重的套件。

  </Accordion>

  <Accordion title="內嵌 runner 覆蓋率">

    - 當你變更 message-tool discovery 輸入或 Compaction runtime
      context 時，請保留兩個層級的覆蓋率。
    - 為純路由和正規化
      邊界新增聚焦的 helper regression。
    - 保持內嵌 runner 整合套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證具範圍的 ids 和 Compaction 行為仍會流經
      真正的 `run.ts` / `compact.ts` 路徑；僅 helper 的測試
      不足以取代那些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool 和 isolation 預設值">

    - 基礎 Vitest 設定預設為 `threads`。
    - 共用 Vitest 設定固定 `isolate: false`，並在
      根專案、e2e 和 live 設定中使用非隔離 runner。
    - 根 UI lane 保留其 `jsdom` 設置和 optimizer，但也在
      共用的非隔離 runner 上執行。
    - 每個 `pnpm test` 分片都會從共用 Vitest 設定繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子 Node
      程序加入 `--no-maglev`，以降低大型本機執行期間的 V8 編譯 churn。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與 stock V8
      行為比較。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構 lane。
    - pre-commit hook 只做格式化。它會重新 stage 已格式化檔案，且
      不會執行 lint、typecheck 或測試。
    - 在 handoff 或 push 前，當你需要智慧本機檢查閘門時，請明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過低成本的具範圍 lane 路由。只有當 agent
      判定 harness、設定、package 或 contract 編輯確實需要更廣泛的
      Vitest 覆蓋率時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行為，只是 worker 上限較高。
    - 本機 worker 自動縮放刻意保守，並會在主機負載平均值已高時
      後退，因此多個並行
      Vitest 執行預設會造成較少傷害。
    - 基礎 Vitest 設定會將 projects/config 檔案標記為
      `forceRerunTriggers`，因此當測試
      wiring 變更時，changed-mode rerun 仍會正確。
    - 設定會在支援的
      主機上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你希望
      直接 profiling 使用一個明確的 cache 位置，請設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="效能偵錯">

    - `pnpm test:perf:imports` 會啟用 Vitest import-duration reporting，加上
      import-breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling 視圖限縮到
      自 `origin/main` 以來變更的檔案。
    - 分片時間資料會寫入 `.artifacts/vitest-shard-timings.json`。
      整個設定執行會使用設定路徑作為 key；include-pattern CI
      分片會附加分片名稱，因此可分別追蹤
      已篩選分片。
    - 當某個熱門測試仍將大部分時間花在啟動匯入時，
      請將重度相依性放在狹窄的本機 `*.runtime.ts` seam 後方，並
      直接 mock 該 seam，而不是 deep-import runtime helpers 只為了
      透過 `vi.mock(...)` 傳遞它們。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對該已提交
      diff，比較已路由的
      `test:changed` 與原生根專案路徑，並列印 wall time 以及 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 和根 Vitest 設定路由已變更檔案清單，
      對目前 dirty tree 進行 benchmark。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite 啟動和 transform overhead 寫入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用檔案平行化的情況下，為
      unit suite 寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 穩定性（gateway）

- 命令：`pnpm test:stability:gateway`
- 設定：`vitest.gateway.config.ts`，強制使用一個 worker
- 範圍：
  - 預設啟用 diagnostics，啟動真正的 loopback Gateway
  - 透過 diagnostic event path 驅動 synthetic gateway message、memory 和 large-payload churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 覆蓋 diagnostic stability bundle persistence helpers
  - 斷言 recorder 保持有界、synthetic RSS samples 維持在 pressure budget 以下，且每個 session 的 queue depth 會排空回到零
- 預期：
  - CI 安全且不需要 key
  - 用於 stability-regression follow-up 的窄 lane，不可取代完整 Gateway 套件

### E2E（gateway smoke）

- 命令：`pnpm test:e2e`
- 設定：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的 bundled-plugin E2E 測試
- Runtime 預設值：
  - 使用 Vitest `threads` 並搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用 adaptive workers（CI：最多 2 個，本機：預設 1 個）。
  - 預設以 silent mode 執行，以降低 console I/O overhead。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 可強制 worker 數量（上限為 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 可重新啟用詳細 console 輸出。
- 範圍：
  - 多實例 gateway end-to-end 行為
  - WebSocket/HTTP surfaces、node pairing，以及較重的 networking
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
  - 透過真實 `sandbox ssh-config` + SSH exec 練習 OpenClaw 的 OpenShell backend
  - 透過 sandbox fs bridge 驗證 remote-canonical filesystem 行為
- 預期：
  - 僅 opt-in；不屬於預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` CLI，加上可運作的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀測試 gateway 和 sandbox
- 實用覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1` 可在手動執行較廣泛 e2e 套件時啟用測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 可指向非預設 CLI binary 或 wrapper script

### Live（真實 providers + 真實 models）

- 命令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的 bundled-plugin live tests
- 預設：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個 provider/model _今天_ 是否真的能搭配真實 creds 運作？」
  - 捕捉 provider format 變更、tool-calling quirks、auth issues，以及 rate limit 行為
- 預期：
  - 設計上不是 CI-stable（真實 networks、真實 provider policies、quotas、outages）
  - 會花錢 / 使用 rate limits
  - 偏好執行縮小範圍的 subsets，而不是「everything」
- Live 執行會 source `~/.profile` 以取得缺少的 API keys。
- 預設情況下，live 執行仍會隔離 `HOME`，並將 config/auth material 複製到暫時測試 home，因此 unit fixtures 無法變更你真實的 `~/.openclaw`。
- 只有在你有意需要 live tests 使用真實 home 目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設為較安靜的模式：它會保留 `[live] ...` progress 輸出，但抑制額外的 `~/.profile` notice，並靜音 gateway bootstrap logs/Bonjour chatter。如果你想要恢復完整 startup logs，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key rotation（provider-specific）：以逗號/分號格式設定 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 進行 per-live override；測試會在 rate limit responses 時重試。
- Progress/heartbeat 輸出：
  - Live 套件現在會將 progress lines 發送到 stderr，因此即使 Vitest console capture 安靜，長時間 provider calls 仍可看出正在活動。
  - `vitest.live.config.ts` 會停用 Vitest console interception，因此 provider/gateway progress lines 會在 live 執行期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整 direct-model heartbeats。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 gateway/probe heartbeats。

## 我應該執行哪個套件？

使用此決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你變更了很多內容，也執行 `pnpm test:coverage`）
- 觸及 Gateway 網路 / WS 通訊協定 / 配對：加入 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ 特定 provider 失敗 / 工具呼叫：執行範圍縮小的 `pnpm test:live`

## 即時（會觸及網路的）測試

關於即時模型矩陣、CLI 後端煙霧測試、ACP 煙霧測試、Codex app-server
測試框架，以及所有媒體 provider 即時測試（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness）- 加上即時執行的憑證處理 - 請參閱
[測試即時套件](/zh-TW/help/testing-live)。關於專用的更新與
Plugin 驗證檢查清單，請參閱
[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

## Docker 執行器（選用的「在 Linux 中可運作」檢查）

這些 Docker 執行器分成兩類：

- 即時模型執行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker 映像中執行各自相符的 profile-key 即時檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），並掛載你的本機設定目錄與工作區（如果有掛載，也會 source `~/.profile`）。相符的本機進入點是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 即時執行器預設使用較小的煙霧測試上限，讓完整 Docker 掃描維持可行：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明確想要較大的完整掃描時，才覆寫這些 env vars。
- `test:docker:all` 會先透過 `test:docker:live-build` 建立即時 Docker 映像一次，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包成 npm tarball 一次，然後建立/重用兩個 `scripts/e2e/Dockerfile` 映像。裸映像只是供安裝/更新/Plugin 相依性 lane 使用的 Node/Git 執行器；這些 lane 會掛載預先建置的 tarball。功能映像會將同一個 tarball 安裝到 `/app`，供已建置 app 功能 lane 使用。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選取的計畫。彙總流程使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序 slot，而資源上限會避免繁重的即時、npm-install，以及多服務 lane 同時全部啟動。如果單一 lane 比作用中的上限更重，排程器仍可在 pool 為空時啟動它，然後讓它單獨執行，直到容量再次可用。預設值是 10 個 slot、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。執行器預設會執行 Docker 預檢、移除過期的 OpenClaw E2E 容器、每 30 秒列印狀態、將成功 lane 的耗時儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行時使用這些耗時優先啟動較長的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印加權 lane manifest，而不建置或執行 Docker；或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lane、套件/映像需求，以及憑證的 CI 計畫。
- `套件驗收` 是 GitHub 原生的套件關卡，用來確認「這個可安裝 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個候選套件，將其上傳為 `package-under-test`，然後針對該精確 tarball 執行可重用的 Docker E2E lane，而不是重新打包所選 ref。Profile 依涵蓋範圍排序：`smoke`、`package`、`product` 和 `full`。請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)，了解套件/更新/Plugin 合約、已發布升級存活者矩陣、發行預設值，以及失敗分流。
- 建置與發行檢查會在 tsdown 之後執行 `scripts/check-cli-bootstrap-imports.mjs`。這個防護會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪靜態建置圖，並在命令分派前的啟動流程匯入 Commander、prompt UI、undici 或 logging 等套件相依性時失敗；它也會讓 bundled Gateway run chunk 維持在預算內，並拒絕已知冷 Gateway 路徑的靜態匯入。封裝後的 CLI 煙霧測試也涵蓋 root help、onboard help、doctor help、status、config schema，以及 model-list 命令。
- 套件驗收舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點之前，測試框架只容忍已出貨套件的中繼資料缺口：省略的私有 QA inventory 項目、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔案、缺少已持久化的 `update.channel`、舊版 Plugin install-record 位置、缺少 marketplace install-record 持久化，以及 `plugins update` 期間的 config metadata 遷移。對 `2026.4.25` 之後的套件而言，這些路徑都是嚴格失敗。
- 容器煙霧執行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`，以及 `test:docker:config-reload` 會啟動一個或多個真實容器，並驗證較高層級的整合路徑。

即時模型 Docker 執行器也只會 bind-mount 所需的 CLI auth home（或在執行未縮小範圍時掛載所有支援的 home），然後在執行前將它們複製到容器 home，讓外部 CLI OAuth 可以重新整理 token，而不會改動主機 auth store：

- 直接模型：`pnpm test:docker:live-models`（腳本：`scripts/test-live-models-docker.sh`）
- ACP 綁定冒煙測試：`pnpm test:docker:live-acp-bind`（腳本：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 與 `pnpm test:docker:live-acp-bind:opencode` 嚴格涵蓋 Droid/OpenCode）
- CLI 後端冒煙測試：`pnpm test:docker:live-cli-backend`（腳本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒煙測試：`pnpm test:docker:live-codex-harness`（腳本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開發代理：`pnpm test:docker:live-gateway`（腳本：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性冒煙測試：`pnpm qa:otel:smoke` 是私有 QA 原始碼簽出 lane。它刻意不屬於套件 Docker 發行 lane，因為 npm tarball 會省略 QA Lab。
- Open WebUI 即時冒煙測試：`pnpm test:docker:openwebui`（腳本：`scripts/e2e/openwebui-docker.sh`）
- 上手精靈（TTY，完整 scaffold）：`pnpm test:docker:onboard`（腳本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 上手/頻道/代理冒煙測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝打包後的 OpenClaw tarball，透過 env-ref 上手流程設定 OpenAI，並預設設定 Telegram，接著執行 doctor，並執行一次模擬的 OpenAI 代理回合。可用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳過主機重建，或用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換頻道。
- Skill 安裝冒煙測試：`pnpm test:docker:skill-install` 會在 Docker 中全域安裝打包後的 OpenClaw tarball，在設定中停用上傳封存安裝，從搜尋解析目前即時的 ClawHub skill slug，使用 `openclaw skills install` 安裝，並驗證已安裝的 skill 以及 `.clawhub` 來源/鎖定中繼資料。
- 更新頻道切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝打包後的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證已持久化的頻道和 Plugin 更新後工作，然後切回套件 `stable` 並檢查更新狀態。
- 升級存活者冒煙測試：`pnpm test:docker:upgrade-survivor` 會將打包後的 OpenClaw tarball 安裝到髒的舊使用者 fixture 上，該 fixture 含有代理、頻道設定、Plugin allowlist、過期的 Plugin 依賴狀態，以及既有的工作區/工作階段檔案。它會執行套件更新與非互動式 doctor，不需要即時 provider 或頻道金鑰，然後啟動 local loopback Gateway，並檢查設定/狀態保留以及啟動/狀態預算。
- 已發布升級存活者冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設會安裝 `openclaw@latest`，植入逼真的既有使用者檔案，用內建命令配方設定該基準，驗證產生的設定，將該已發布安裝更新到候選 tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 local loopback Gateway，並檢查已設定的意圖、狀態保留、啟動、`/healthz`、`/readyz` 與 RPC 狀態預算。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準，要求彙總排程器用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確本機基準，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，並用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue 形狀的 fixture，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動修復外部 OpenClaw Plugin 安裝。Package Acceptance 將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析例如 `last-stable-4` 或 `all-since-2026.4.23` 的中繼基準 token，而 Full Release Validation 會將 release-soak 套件 gate 展開為 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加上 `reported-issues`。
- 工作階段執行階段脈絡冒煙測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏執行階段脈絡轉錄持久化，以及 doctor 修復受影響的重複 prompt-rewrite 分支。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會打包目前樹狀結構，在隔離的 home 中用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會傳回 bundled image providers，而不是卡住。可用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳過主機建置，或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- 安裝程式 Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm 容器之間共用一個 npm 快取。更新冒煙測試預設使用 npm `latest` 作為 stable 基準，然後升級到候選 tarball。可在本機用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上用 Install Smoke workflow 的 `update_baseline_version` 輸入覆寫。非 root 安裝程式檢查會保留隔離的 npm 快取，避免 root 擁有的快取項目遮蔽使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本機重跑時重用 root/update/direct-npm 快取。
- Install Smoke CI 會用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳過重複的 direct-npm 全域更新；需要直接 `npm install -g` 涵蓋時，在本機執行腳本且不要帶該 env。
- 代理刪除共用工作區 CLI 冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（腳本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置 root Dockerfile 映像，在隔離的容器 home 中植入兩個代理和一個工作區，執行 `agents delete --json`，並驗證有效 JSON 以及工作區保留行為。可用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke 映像。
- Gateway 網路（兩個容器，WS 驗證 + 健康狀態）：`pnpm test:docker:gateway-network`（腳本：`scripts/e2e/gateway-network-docker.sh`）
- Browser CDP 快照冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（腳本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置原始碼 E2E 映像加上一層 Chromium，使用原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP role 快照涵蓋連結 URL、游標提升的可點擊項目、iframe ref 和 frame 中繼資料。
- OpenAI Responses web_search minimal reasoning 迴歸測試：`pnpm test:docker:openai-web-search-minimal`（腳本：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行模擬的 OpenAI 伺服器，驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提升到 `low`，然後強制 provider schema 拒絕，並檢查原始詳細資訊出現在 Gateway 日誌中。
- MCP 頻道橋接（已植入 Gateway + stdio bridge + 原始 Claude notification-frame 冒煙測試）：`pnpm test:docker:mcp-channels`（腳本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真實 stdio MCP 伺服器 + 內嵌 Pi profile allow/deny 冒煙測試）：`pnpm test:docker:pi-bundle-mcp-tools`（腳本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真實 Gateway + 在隔離 cron 與一次性 subagent 執行後拆除 stdio MCP 子程序）：`pnpm test:docker:cron-mcp-cleanup`（腳本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（針對本機路徑、`file:`、含 hoisted dependencies 的 npm registry、git moving refs、ClawHub kitchen-sink、marketplace 更新，以及 Claude-bundle enable/inspect 的安裝/更新冒煙測試）：`pnpm test:docker:plugins`（腳本：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳過 ClawHub 區塊，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 與 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的 kitchen-sink package/runtime 配對。若沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用 hermetic 本機 ClawHub fixture 伺服器。
- Plugin 更新未變更冒煙測試：`pnpm test:docker:plugin-update`（腳本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin 生命週期矩陣冒煙測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在裸容器中安裝打包後的 OpenClaw tarball，安裝 npm Plugin，切換啟用/停用，透過本機 npm registry 升級和降級它，刪除已安裝程式碼，然後驗證解除安裝仍會移除過期狀態，同時記錄每個生命週期階段的 RSS/CPU 指標。
- 設定重新載入中繼資料冒煙測試：`pnpm test:docker:config-reload`（腳本：`scripts/e2e/config-reload-source-docker.sh`）
- Plugins：`pnpm test:docker:plugins` 涵蓋針對本機路徑、`file:`、含 hoisted dependencies 的 npm registry、git moving refs、ClawHub fixtures、marketplace 更新，以及 Claude-bundle enable/inspect 的安裝/更新冒煙測試。`pnpm test:docker:plugin-update` 涵蓋已安裝 Plugins 的未變更更新行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋具資源追蹤的 npm Plugin 安裝、啟用、停用、升級、降級，以及缺失程式碼解除安裝。

若要手動預先建置並重用共用功能映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定時，套件特定的映像覆寫（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，若該映像尚未在本機存在，腳本會拉取它。QR 和安裝程式 Docker 測試會保留各自的 Dockerfile，因為它們驗證的是套件/安裝行為，而不是共用已建置應用程式執行階段。

即時模型 Docker 執行器也會以唯讀方式 bind-mount 目前的 checkout，並
將其暫存到容器內的臨時 workdir。這會讓 runtime
映像保持精簡，同時仍針對你確切的本機 source/config 執行 Vitest。
暫存步驟會略過大型的本機專用快取與 app 建置輸出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及 app 本機的 `.build` 或
Gradle 輸出目錄，因此 Docker live 執行不會花費數分鐘複製
特定機器的成品。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此 gateway live probe 不會在
容器內啟動真正的 Telegram/Discord/等 channel worker。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要從該 Docker lane
縮小或排除 Gateway live coverage 時，也請傳入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高階的相容性 smoke：它會啟動一個
已啟用 OpenAI 相容 HTTP endpoints 的 OpenClaw gateway 容器，
再啟動一個針對該 gateway 的 pinned Open WebUI 容器，透過
Open WebUI 登入，驗證 `/api/models` 會公開 `openclaw/default`，接著透過
Open WebUI 的 `/api/chat/completions` proxy 傳送真正的 chat request。
對於應在 Open WebUI 登入與模型探索後停止、而不等待 live model completion 的
release-path CI 檢查，請設定 `OPENWEBUI_SMOKE_MODE=models`。
第一次執行可能明顯較慢，因為 Docker 可能需要拉取
Open WebUI 映像，而 Open WebUI 也可能需要完成自己的 cold-start setup。
此 lane 預期有可用的 live model key，而 `OPENCLAW_PROFILE_FILE`
（預設為 `~/.profile`）是在 Docker 化執行中提供它的主要方式。
成功執行會列印小型 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意設計為 deterministic，且不需要真正的
Telegram、Discord 或 iMessage 帳號。它會啟動 seeded Gateway
容器，啟動第二個會 spawn `openclaw mcp serve` 的容器，然後
驗證 routed conversation discovery、transcript reads、attachment metadata、
live event queue behavior、outbound send routing，以及透過真正的 stdio MCP bridge
傳遞的 Claude-style channel + permission notifications。通知檢查會
直接檢查原始 stdio MCP frames，因此 smoke 驗證的是 bridge 實際發出的內容，
而不只是特定 client SDK 剛好呈現出的內容。
`test:docker:pi-bundle-mcp-tools` 是 deterministic，且不需要 live
model key。它會建置 repo Docker 映像，在容器內啟動真正的 stdio MCP probe server，
透過嵌入式 Pi bundle
MCP runtime materialize 該 server，執行 tool，然後驗證 `coding` 與 `messaging` 保留
`bundle-mcp` tools，而 `minimal` 與 `tools.deny: ["bundle-mcp"]` 會將它們過濾。
`test:docker:cron-mcp-cleanup` 是 deterministic，且不需要 live model
key。它會啟動帶有真正 stdio MCP probe server 的 seeded Gateway，執行
isolated cron turn 與 `/subagents spawn` one-shot child turn，然後驗證
MCP child process 會在每次執行後結束。

手動 ACP plain-language thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此 script 供 regression/debug workflow 使用。它之後可能仍需要用於 ACP thread routing validation，因此不要刪除它。

實用 env vars：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）mount 到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）mount 到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）mount 到 `/home/node/.profile`，並在執行測試前 sourced
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 僅驗證從 `OPENCLAW_PROFILE_FILE` sourced 的 env vars，使用臨時 config/workspace dirs，且不掛載外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）mount 到 `/home/node/.npm-global`，供 Docker 內快取 CLI installs
- `$HOME` 下的外部 CLI auth dirs/files 會以唯讀方式 mount 到 `/host-auth...`，然後在測試開始前複製到 `/home/node/...`
  - 預設 dirs：`.minimax`
  - 預設 files：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - Narrowed provider runs 只會 mount 從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要 dirs/files
  - 可用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的 comma list 手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於在容器內篩選 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用於在不需要重建的 reruns 中重用既有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保 creds 來自 profile store（而不是 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇由 gateway 為 Open WebUI smoke 暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI smoke 使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用於覆寫 pinned Open WebUI image tag

## Docs sanity

編輯 docs 後執行 docs checks：`pnpm check:docs`。
當你也需要 in-page heading checks 時，執行完整的 Mintlify anchor validation：`pnpm docs:check-links:anchors`。

## Offline regression（CI-safe）

這些是在沒有真正 providers 的情況下執行的「real pipeline」regressions：

- Gateway tool calling（mock OpenAI，真正的 gateway + agent loop）：`src/gateway/gateway.test.ts`（case："runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway wizard（WS `wizard.start`/`wizard.next`，寫入 config + 強制 auth）：`src/gateway/gateway.test.ts`（case："runs wizard over ws and writes auth token config"）

## Agent reliability evals（skills）

我們已經有幾個 CI-safe tests，其行為類似「agent reliability evals」：

- 透過真正 Gateway + agent loop 的 mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 與 config effects 的 end-to-end wizard flows（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請參閱 [Skills](/zh-TW/tools/skills)）：

- **Decisioning：** 當 prompt 中列出 skills 時，agent 是否選擇正確的 skill（或避開不相關的 skill）？
- **Compliance：** agent 是否在使用前讀取 `SKILL.md`，並遵循必要的 steps/args？
- **Workflow contracts：** 會 assert tool order、session history carryover 與 sandbox boundaries 的 multi-turn scenarios。

未來 evals 應優先保持 deterministic：

- 使用 mock providers 來 assert tool calls + order、skill file reads 與 session wiring 的 scenario runner。
- 一小組聚焦於 skill 的 scenarios（use vs avoid、gating、prompt injection）。
- Optional live evals（opt-in、env-gated）只應在 CI-safe suite 就位後加入。

## Contract tests（plugin and channel shape）

Contract tests 會驗證每個已註冊的 plugin 與 channel 都符合其
interface contract。它們會 iterate over 所有 discovered plugins，並執行一組
shape 與 behavior assertions。預設的 `pnpm test` unit lane 會刻意
略過這些 shared seam 與 smoke files；當你觸及 shared channel 或 provider surfaces 時，
請明確執行 contract commands。

### Commands

- 所有 contracts：`pnpm test:contracts`
- 僅 channel contracts：`pnpm test:contracts:channels`
- 僅 provider contracts：`pnpm test:contracts:plugins`

### Channel contracts

位於 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本 plugin shape（id、name、capabilities）
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

### When to run

- 變更 plugin-sdk exports 或 subpaths 後
- 新增或修改 channel 或 provider plugin 後
- 重構 plugin registration 或 discovery 後

Contract tests 會在 CI 中執行，且不需要真正的 API keys。

## Adding regressions（guidance）

當你修復在 live 中發現的 provider/model issue 時：

- 如可行，新增 CI-safe regression（mock/stub provider，或 capture 確切的 request-shape transformation）
- 如果本質上只能 live-only（rate limits、auth policies），請讓 live test 保持 narrow，並透過 env vars opt-in
- 優先鎖定能捕捉 bug 的最小層級：
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 或 CI-safe gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class derive 一個 sampled target，然後 assert traversal-segment exec ids 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增 `includeInPlan` SecretRef target family，請更新該 test 中的 `classifyTargetClass`。該 test 會刻意在未分類 target ids 上失敗，避免新 classes 被靜默略過。

## Related

- [Testing live](/zh-TW/help/testing-live)
- [Testing updates and plugins](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
