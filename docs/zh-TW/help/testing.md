---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/供應器錯誤新增迴歸測試
    - 偵錯 Gateway + 代理行為
summary: 測試工具包：單元/e2e/live 測試套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-05-05T06:17:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 測試套件（單元/整合、e2e、live）以及少量
Docker runner。這份文件是「我們如何測試」指南：

- 每個套件涵蓋的範圍（以及它刻意 _不_ 涵蓋的範圍）。
- 常見工作流程（本機、推送前、偵錯）應執行哪些命令。
- live 測試如何探索憑證並選擇模型/提供者。
- 如何為真實世界的模型/提供者問題加入迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、live 傳輸 lane）** 另有文件說明：

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) — 架構、命令介面、情境撰寫。
- [Matrix QA](/zh-TW/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的參考資料。
- [QA channel](/zh-TW/channels/qa-channel) — 由 repo 支援情境使用的合成傳輸 Plugin。

本頁涵蓋執行一般測試套件以及 Docker/Parallels runner。下方的 QA 專用 runner 區段（[QA 專用 runner](#qa-specific-runners)）列出具體的 `qa` 呼叫，並指回上述參考資料。
</Note>

## 快速開始

大多數日子：

- 完整 gate（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充裕機器上較快的本機完整套件執行：`pnpm test:max`
- 直接 Vitest watch 迴圈：`pnpm test:watch`
- 直接檔案目標現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在針對單一失敗反覆修改時，優先使用目標式執行。
- Docker 支援的 QA site：`pnpm qa:lab:up`
- Linux VM 支援的 QA lane：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你觸及測試或想要額外信心時：

- 覆蓋率 gate：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

當偵錯真實提供者/模型時（需要真實憑證）：

- Live 套件（模型 + gateway 工具/影像探測）：`pnpm test:live`
- 安靜地指定一個 live 檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime 效能報告：dispatch `OpenClaw Performance`，使用
  `live_gpt54=true` 來執行真實 `openai/gpt-5.4` agent turn，或使用
  `deep_profile=true` 產生 Kova CPU/heap/trace artifacts。每日排程執行會在
  `CLAWGRIT_REPORTS_TOKEN` 已設定時，將 mock-provider、deep-profile，以及 GPT 5.4 lane artifacts 發佈到
  `openclaw/clawgrit-reports`。mock-provider 報告也包含 source-level gateway boot、記憶體、
  plugin-pressure、重複 fake-model hello-loop，以及 CLI 啟動數字。
- Docker live 模型掃描：`pnpm test:docker:live-models`
  - 每個選取的模型現在會執行一次文字 turn，加上一個小型檔案讀取風格探測。
    metadata 標示支援 `image` 輸入的模型也會執行一次小型影像 turn。
    隔離提供者失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋率：每日 `OpenClaw Scheduled Live And E2E Checks` 與手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用 live/E2E workflow，
    其中包含依提供者分 shard 的獨立 Docker live 模型矩陣 jobs。
  - 對於聚焦的 CI 重新執行，dispatch `OpenClaw Live And E2E Checks (Reusable)`，
    並使用 `include_live_suites: true` 和 `live_models_only: true`。
  - 將新的高訊號提供者 secrets 加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其
    scheduled/release callers。
- Native Codex bound-chat smoke：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker live lane，使用 `/codex bind` 綁定合成
    Slack DM，演練 `/codex fast` 和
    `/codex permissions`，接著驗證純文字回覆與影像附件
    會透過 native plugin binding 路由，而不是 ACP。
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`
  - 透過 plugin 擁有的 Codex app-server harness 執行 Gateway agent turns，
    驗證 `/codex status` 與 `/codex models`，且預設會演練影像、
    cron MCP、sub-agent，以及 Guardian 探測。隔離其他 Codex
    app-server 失敗時，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用 sub-agent 探測。若要聚焦檢查 sub-agent，請停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定了
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則這會在 sub-agent 探測後結束。
- Crestodian rescue command smoke：`pnpm test:live:crestodian-rescue-channel`
  - 選用的雙重保險檢查，用於 message-channel rescue command
    介面。它會演練 `/crestodian status`、排入持久模型
    變更、回覆 `/crestodian yes`，並驗證稽核/config 寫入路徑。
- Crestodian planner Docker smoke：`pnpm test:docker:crestodian-planner`
  - 在沒有 config 的容器中執行 Crestodian，並在 `PATH` 上放置假的 Claude CLI，
    驗證 fuzzy planner fallback 會轉譯成經稽核的 typed
    config 寫入。
- Crestodian first-run Docker smoke：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw state dir 開始，將裸 `openclaw` 路由到
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入、
    驗證 config，並驗證稽核 entries。同一個 Ring 0 setup 路徑
    也在 QA Lab 中由
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆蓋。
- Moonshot/Kimi 成本 smoke：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，再執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  針對 `moonshot/kimi-k2.6`。確認 JSON 回報 Moonshot/K2.6，且
  assistant transcript 儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先透過下方描述的 allowlist env vars 縮小 live 測試範圍。
</Tip>

## QA 專用 runner

當你需要 QA-lab 真實性時，這些命令與主要測試套件並列：

CI 在專用 workflow 中執行 QA Lab。Agentic parity 巢狀位於
`QA-Lab - All Lanes` 與 release validation 底下，而不是獨立的 PR workflow。
廣泛驗證應使用 `Full Release Validation` 並搭配
`rerun_group=qa-parity`，或使用 release-checks QA group。穩定/預設 release
checks 會將 exhaustive live/Docker soak 保持在 `run_release_soak=true` 後方；
`full` profile 會強制啟用 soak。`QA-Lab - All Lanes`
會在 `main` 上每晚執行，也可透過手動 dispatch 執行，並將 mock parity lane、live
Matrix lane、Convex-managed live Telegram lane，以及 Convex-managed live Discord
lane 作為平行 jobs。排程 QA 與 release checks 會明確傳入 Matrix
`--profile fast`，而 Matrix CLI 和手動 workflow input
預設仍為 `all`；手動 dispatch 可以將 `all` shard 成 `transport`、
`media`、`e2ee-smoke`、`e2ee-deep`，以及 `e2ee-cli` jobs。`OpenClaw Release
Checks` 會在 release approval 前執行 parity 加上 fast Matrix 和 Telegram lanes，
並使用 `mock-openai/gpt-5.5` 進行 release transport checks，使其保持
可決定性並避開一般 provider-plugin 啟動。這些 live transport
gateways 會停用 memory search；memory 行為仍由 QA parity
suites 覆蓋。

Full release live media shards 使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 和 `ffprobe`。Docker live model/backend shards 使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` image，該 image 會針對所選
commit 建置一次，接著以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在
每個 shard 內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行以 repo 為基礎的 QA 情境。
  - 預設會以隔離的 gateway worker 並行執行多個已選情境。`qa-channel` 預設並行度為 4（受已選情境數量限制）。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 執行舊的序列 lane。
  - 任何情境失敗時會以非零狀態結束。若你想取得 artifact 但不想要失敗的 exit code，請使用 `--allow-failures`。
  - 支援 provider 模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 會啟動本機 AIMock 支援的 provider 伺服器，用於實驗性的 fixture 與 protocol-mock 覆蓋範圍，而不取代具備情境感知能力的 `mock-openai` lane。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行即時 OpenAI Kitchen Sink plugin gauntlet。它會安裝外部 Kitchen Sink 套件、驗證 plugin SDK surface inventory、探測 `/healthz` 和 `/readyz`、記錄 gateway CPU/RSS 證據、執行一次即時 OpenAI turn，並檢查對抗式診斷。需要即時 OpenAI 驗證，例如 `OPENAI_API_KEY`。在已 hydrate 的 Testbox session 中，若存在 `openclaw-testbox-env` helper，會自動載入 Testbox live-auth profile。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 gateway 啟動 benchmark，加上一小組 mock QA Lab 情境包（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`），並將合併的 CPU 觀測摘要寫入 `.artifacts/gateway-cpu-scenarios/`。
  - 預設只標記持續的高 CPU 觀測（`--cpu-core-warn` 加上 `--hot-wall-warn-ms`），因此短暫的啟動 burst 會被記錄為 metric，而不會看起來像持續數分鐘的 gateway peg regression。
  - 使用已建置的 `dist` artifact；若 checkout 尚未有最新 runtime output，請先執行 build。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 內執行相同 QA suite。
  - 保持與主機上的 `qa suite` 相同的情境選擇行為。
  - 重複使用與 `qa suite` 相同的 provider/model 選擇 flag。
  - 即時執行會轉送對 guest 實用且受支援的 QA auth 輸入：以 env 為基礎的 provider key、QA live provider config path，以及存在時的 `CODEX_HOME`。
  - Output dir 必須保留在 repo root 底下，讓 guest 能透過掛載的 workspace 寫回。
  - 將一般 QA report + summary 加上 Multipass log 寫入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 啟動 Docker 支援的 QA site，用於 operator 風格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball、在 Docker 中全域安裝、執行非互動式 OpenAI API-key onboarding、預設設定 Telegram、驗證封裝的 plugin runtime 能在沒有啟動時 dependency repair 的情況下載入、執行 doctor，並對 mock OpenAI endpoint 執行一次本機 agent turn。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的 packaged-install lane。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式 runtime context transcript 執行 deterministic built-app Docker smoke。它會驗證隱藏的 OpenClaw runtime context 會以非顯示的 custom message 持久化，而不是洩漏到可見的 user turn，接著 seed 一個受影響的 broken session JSONL，並驗證 `openclaw doctor --fix` 會將其重寫到 active branch 且建立 backup。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw package candidate、執行已安裝套件的 onboarding、透過已安裝的 CLI 設定 Telegram，然後重複使用即時 Telegram QA lane，並將該已安裝套件作為 SUT Gateway。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或 `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而不是從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env credential 或 Convex credential 來源。對於 CI/release automation，請設定 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` 加上 `OPENCLAW_QA_CONVEX_SITE_URL` 與 role secret。若 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 與 Convex role secret，Docker wrapper 會自動選擇 Convex。
  - wrapper 會先在主機上驗證 Telegram 或 Convex credential env，然後才進行 Docker build/install 工作。只有在刻意除錯 pre-credential setup 時，才設定 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此 lane 覆寫共用的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 將此 lane 暴露為手動 maintainer workflow `NPM Telegram Beta E2E`。它不會在 merge 時執行。該 workflow 使用 `qa-live-shared` environment 與 Convex CI credential lease。
- GitHub Actions 也暴露 `Package Acceptance`，用於針對單一 candidate package 的 side-run product proof。它接受 trusted ref、已發布 npm spec、HTTPS tarball URL 加上 SHA-256，或來自另一個 run 的 tarball artifact，將正規化的 `openclaw-current.tgz` 以 `package-under-test` 上傳，然後以 smoke、package、product、full 或 custom lane profile 執行既有的 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可針對相同的 `package-under-test` artifact 執行 Telegram QA workflow。
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
  - 在 Docker 中打包並安裝目前的 OpenClaw build、以設定好的 OpenAI 啟動 Gateway，然後透過 config 編輯啟用 bundled channel/plugins。
  - 驗證 setup discovery 會讓未設定的 downloadable plugin 保持不存在，第一次設定好的 doctor repair 會明確安裝每個缺少的 downloadable plugin，而第二次 restart 不會執行隱藏的 dependency repair。
  - 也會安裝已知較舊的 npm baseline，在執行 `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證 candidate 的 post-update doctor 會清理 legacy plugin dependency debris，而不需要 harness-side postinstall repair。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 執行原生 packaged-install update smoke。每個已選平台會先安裝要求的 baseline package，接著在同一個 guest 中執行已安裝的 `openclaw update` command，並驗證已安裝版本、update status、gateway readiness，以及一次本機 agent turn。
  - 在迭代單一 guest 時使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得 summary artifact path 與每個 lane 的 status。
  - OpenAI lane 預設使用 `openai/gpt-5.5` 作為即時 agent-turn proof。若刻意驗證另一個 OpenAI model，請傳入 `--model <provider/model>` 或設定 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 將長時間本機執行包在主機 timeout 中，避免 Parallels transport stall 消耗剩餘測試時間：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script 會將巢狀 lane log 寫入 `/tmp/openclaw-parallels-npm-update.*`。在假設外層 wrapper 卡住前，先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows update 在冷 guest 上可能花費 10 到 15 分鐘進行 post-update doctor 與 package update 工作；只要巢狀 npm debug log 持續前進，仍屬正常。
  - 不要將此 aggregate wrapper 與個別 Parallels macOS、Windows 或 Linux smoke lane 並行執行。它們共用 VM state，可能在 snapshot restore、package serving 或 guest gateway state 上衝突。
  - post-update proof 會執行一般 bundled plugin surface，因為 speech、image generation 和 media understanding 等 capability facade 是透過 bundled runtime API 載入，即使 agent turn 本身只檢查簡單的文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider server，用於直接的 protocol smoke testing。
- `pnpm openclaw qa matrix`
  - 對一次性的 Docker 支援 Tuwunel homeserver 執行 Matrix 即時 QA lane。僅限 source-checkout：packaged install 不會出貨 `qa-lab`。
  - 完整 CLI、profile/scenario catalog、env var 與 artifact layout：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用 env 中的 driver 與 SUT bot token，對真實 private group 執行 Telegram 即時 QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必須是數字 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共用 pooled credential。預設使用 env mode，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選擇 pooled lease。
  - 任何情境失敗時會以非零狀態結束。若你想取得 artifact 但不想要失敗的 exit code，請使用 `--allow-failures`。
  - 需要同一個 private group 中兩個不同的 bot，且 SUT bot 需公開 Telegram username。
  - 為了穩定的 bot-to-bot observation，請在 `@BotFather` 中為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 能觀察 group bot traffic。
  - 將 Telegram QA report、summary 與 observed-messages artifact 寫入 `.artifacts/qa-e2e/...`。Replying 情境包含從 driver send request 到觀測到 SUT reply 的 RTT。

即時 transport lane 共用一個標準 contract，讓新的 transport 不會漂移；每個 lane 的 coverage matrix 位於 [QA overview → Live transport coverage](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的 synthetic suite，不屬於該 matrix。

### 透過 Convex 共用 Telegram credential (v1)

當對 `openclaw qa telegram` 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex 支援的 pool 取得 exclusive lease，在 lane 執行期間 heartbeat 該 lease，並在 shutdown 時釋放 lease。

參考 Convex 專案 scaffold：

- `qa/convex-credential-broker/`

必要 env var：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選 role 的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- Credential role 選擇：
  - CLI：`--credential-role maintainer|ci`
  - Env 預設：`OPENCLAW_QA_CREDENTIAL_ROLE`（CI 中預設為 `ci`，否則為 `maintainer`）

選用 env var：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許 local-only development 使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

維護者管理員命令（池新增/移除/列表）特別需要
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

維護者的 CLI 輔助工具：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時執行前使用 `doctor`，以檢查 Convex 網站 URL、broker 密鑰、
端點前綴、HTTP 逾時，以及管理員/列表可達性，而不列印
密鑰值。在 scripts 與 CI
工具中使用 `--json` 以取得機器可讀輸出。

預設端點契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

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
- `POST /admin/add`（僅維護者密鑰）
  - 請求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（僅維護者密鑰）
  - 請求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 作用中租約防護：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅維護者密鑰）
  - 請求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram kind 的 payload 形狀：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字 Telegram chat id 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證此形狀，並拒絕格式錯誤的 payload。

### 將 channel 新增至 QA

新 channel adapter 的架構與情境輔助工具名稱位於 [QA 概觀 → 新增 channel](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低標準：在共用的 `qa-lab` host seam 上實作 transport runner，在 Plugin manifest 中宣告 `qaRunners`，掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫情境。

## 測試套件（在哪裡執行什麼）

將這些套件視為「真實性遞增」（且不穩定性/成本也遞增）：

### 單元 / 整合（預設）

- 命令：`pnpm test`
- 設定：未指定目標的執行會使用 `vitest.full-*.config.ts` shard 集合，並可能將多專案 shard 展開為個別專案設定，以進行平行排程
- 檔案：`src/**/*.test.ts`、`packages/**/*.test.ts` 與 `test/**/*.test.ts` 下的 core/unit inventory；UI 單元測試在專用的 `unit-ui` shard 中執行
- 範圍：
  - 純單元測試
  - 程序內整合測試（gateway auth、routing、tooling、parsing、config）
  - 已知 bug 的確定性回歸測試
- 期望：
  - 在 CI 中執行
  - 不需要真實金鑰
  - 應快速且穩定
  - Resolver 與 public-surface loader 測試必須使用產生的小型 Plugin fixture，證明廣泛的 `api.js` 與
    `runtime-api.js` fallback 行為，而不是使用
    真實的 bundled Plugin source API。真實 Plugin API 載入屬於
    Plugin 擁有的契約/整合套件。

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - 未指定目標的 `pnpm test` 會執行十二個較小的 shard 設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生根專案程序。這可降低負載機器上的峰值 RSS，並避免 auto-reply/extension 工作讓無關套件缺乏資源。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多 shard watch loop 並不實際。
    - `pnpm test`、`pnpm test:watch` 與 `pnpm test:perf:imports` 會先透過 scoped lanes 路由明確的檔案/目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免支付完整根專案啟動成本。
    - `pnpm test:changed` 預設會將變更的 git 路徑展開為便宜的 scoped lanes：直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖相依項。Config/setup/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是狹窄工作的正常智慧型本機檢查閘門。它會將 diff 分類為 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 與 tooling，然後執行相符的 typecheck、lint 與 guard 命令。它不會執行 Vitest 測試；若要測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅 release metadata 的版本提升會執行目標版本/config/root-dependency 檢查，並有一個 guard 拒絕 top-level version 欄位以外的 package 變更。
    - Live Docker ACP harness 編輯會執行聚焦檢查：live Docker auth scripts 的 shell 語法，以及 live Docker scheduler dry-run。`package.json` 變更僅在 diff 限於 `scripts["test:docker:live-*"]` 時納入；dependency、export、version 與其他 package-surface 編輯仍使用更廣泛的 guard。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 與類似純工具區域的 import-light 單元測試會透過 `unit-fast` lane 路由，該 lane 會略過 `test/setup-openclaw-runtime.ts`；stateful/runtime-heavy 檔案維持在現有 lanes 上。
    - 選定的 `plugin-sdk` 與 `commands` helper source 檔案也會將 changed-mode 執行對應到這些 light lanes 中明確的同層測試，因此 helper 編輯可避免重新執行該目錄的完整重型套件。
    - `auto-reply` 針對 top-level core helpers、top-level `reply.*` 整合測試，以及 `src/auto-reply/reply/**` subtree 有專用 bucket。CI 進一步將 reply subtree 分成 agent-runner、dispatch 與 commands/state-routing shards，因此單一 import-heavy bucket 不會佔用完整 Node 尾端。
    - 一般 PR/main CI 會刻意略過 extension batch sweep 與 release-only `agentic-plugins` shard。Full Release Validation 會針對 release candidates，分派獨立的 `Plugin Prerelease` child workflow 來執行那些 Plugin/extension-heavy 套件。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - 當你變更 message-tool discovery 輸入或 compaction runtime
      context 時，請保留兩個層級的涵蓋範圍。
    - 為純 routing 與 normalization
      邊界新增聚焦的 helper 回歸測試。
    - 維持 embedded runner 整合套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證 scoped ids 與 Compaction 行為仍會流經
      真實的 `run.ts` / `compact.ts` 路徑；僅 helper 的測試
      無法充分替代這些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Base Vitest config 預設為 `threads`。
    - 共用 Vitest config 固定 `isolate: false`，並在根專案、e2e 與 live configs 中使用
      非隔離 runner。
    - 根 UI lane 保留其 `jsdom` setup 與 optimizer，但也在
      共用非隔離 runner 上執行。
    - 每個 `pnpm test` shard 都會從共用 Vitest config 繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest child Node
      processes 加上 `--no-maglev`，以減少大型本機執行期間的 V8 編譯反覆成本。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 以與原版 V8
      行為比較。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構 lanes。
    - pre-commit hook 僅做格式化。它會重新 stage 已格式化的檔案，且
      不會執行 lint、typecheck 或測試。
    - 在 handoff 或 push 前，當你
      需要智慧型本機檢查閘門時，請明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設透過便宜的 scoped lanes 路由。只有當 agent
      判定 harness、config、package 或 contract 編輯確實需要更廣泛的
      Vitest 涵蓋範圍時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 與 `pnpm test:changed:max` 保持相同的路由
      行為，只是 worker 上限較高。
    - 本機 worker 自動縮放刻意保守，並會在 host load average 已經很高時退讓，
      因此多個並行
      Vitest 執行預設會造成較少損害。
    - Base Vitest config 會將 projects/config files 標記為
      `forceRerunTriggers`，因此測試
      wiring 變更時，changed-mode reruns 仍保持正確。
    - config 會在支援的
      hosts 上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；若你想要
      一個明確的 cache 位置用於直接 profiling，請設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` 會啟用 Vitest 匯入時間回報，以及
      import-breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling 檢視範圍限制到
      自 `origin/main` 以來變更的檔案。
    - Shard timing data 會寫入 `.artifacts/vitest-shard-timings.json`。
      Whole-config 執行使用 config path 作為 key；include-pattern CI
      shards 會附加 shard 名稱，因此 filtered shards 可被
      分別追蹤。
    - 當某個 hot test 仍將大部分時間花在 startup imports 時，
      請將重型相依項放在狹窄的本機 `*.runtime.ts` seam 後方，並
      直接 mock 該 seam，而不是 deep-importing runtime helpers 只為了
      透過 `vi.mock(...)` 傳遞它們。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會比較 routed
      `test:changed` 與該已提交
      diff 的原生根專案路徑，並列印 wall time 與 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 與根 Vitest config 路由 changed file list，對目前
      dirty tree 進行 benchmark。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite startup 與 transform overhead 寫入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用 file parallelism 的情況下，為
      unit suite 寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 穩定性（gateway）

- 命令：`pnpm test:stability:gateway`
- 設定：`vitest.gateway.config.ts`，強制使用一個 worker
- 範圍：
  - 啟動一個真實的 local loopback Gateway，預設啟用 diagnostics
  - 透過 diagnostic event path 驅動合成的 gateway message、memory 與 large-payload churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 涵蓋 diagnostic stability bundle persistence helpers
  - 斷言 recorder 保持有界、合成 RSS samples 維持在 pressure budget 以下，且每個 session queue depth 都會排空回到零
- 期望：
  - CI-safe 且無需金鑰
  - 用於 stability-regression follow-up 的狹窄 lane，不是完整 Gateway 套件的替代品

### E2E（gateway smoke）

- 命令：`pnpm test:e2e`
- 設定：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的隨附 Plugin E2E 測試
- 執行階段預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用自適應工作器（CI：最多 2 個，本機：預設 1 個）。
  - 預設以靜默模式執行，以降低主控台 I/O 負擔。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 可強制指定工作器數量（上限為 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 可重新啟用詳細主控台輸出。
- 範圍：
  - 多執行個體 Gateway 端對端行為
  - WebSocket/HTTP 介面、Node 配對，以及較重的網路處理
- 預期：
  - 在 CI 中執行（當管線中啟用時）
  - 不需要真實金鑰
  - 比單元測試有更多變動元件（可能較慢）

### E2E：OpenShell 後端煙霧測試

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 透過 Docker 在主機上啟動隔離的 OpenShell Gateway
  - 從暫時性的本機 Dockerfile 建立沙箱
  - 透過真實的 `sandbox ssh-config` + SSH exec 操作 OpenClaw 的 OpenShell 後端
  - 透過沙箱 fs 橋接驗證遠端標準檔案系統行為
- 預期：
  - 僅限選擇加入；不屬於預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` CLI 以及可用的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀測試 Gateway 和沙箱
- 實用覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1` 可在手動執行較廣泛 e2e 套件時啟用測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 可指向非預設 CLI 二進位檔或包裝腳本

### 即時（真實提供者 + 真實模型）

- 命令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的隨附 Plugin 即時測試
- 預設：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個提供者/模型在 _今天_ 使用真實憑證時真的能運作嗎？」
  - 捕捉提供者格式變更、工具呼叫特性、驗證問題，以及速率限制行為
- 預期：
  - 設計上並非 CI 穩定（真實網路、真實提供者政策、配額、中斷）
  - 會花錢 / 使用速率限制
  - 優先執行縮小範圍的子集，而不是「全部」
- 即時執行會來源載入 `~/.profile` 以取得缺少的 API 金鑰。
- 預設情況下，即時執行仍會隔離 `HOME`，並將設定/驗證材料複製到暫時測試 home，讓單元 fixture 無法變更你真實的 `~/.openclaw`。
- 只有在你刻意需要即時測試使用真實 home 目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設為較安靜的模式：它會保留 `[live] ...` 進度輸出，但抑制額外的 `~/.profile` 通知，並靜音 Gateway bootstrap 記錄/Bonjour 訊息。若你想恢復完整啟動記錄，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 金鑰輪替（依提供者而定）：設定逗號/分號格式的 `*_API_KEYS`，或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 進行每次即時執行覆寫；測試會在速率限制回應時重試。
- 進度/Heartbeat 輸出：
  - 即時套件現在會將進度行輸出到 stderr，因此即使 Vitest 主控台擷取保持安靜，長時間提供者呼叫也會明顯保持作用中。
  - `vitest.live.config.ts` 停用 Vitest 主控台攔截，因此提供者/Gateway 進度行會在即時執行期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整直接模型 Heartbeat。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 Gateway/探測 Heartbeat。

## 我應該執行哪個套件？

使用這個決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你變更很多，也執行 `pnpm test:coverage`）
- 觸及 Gateway 網路 / WS 協定 / 配對：加上 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ 提供者特定失敗 / 工具呼叫：執行縮小範圍的 `pnpm test:live`

## 即時（觸及網路）測試

關於即時模型矩陣、CLI 後端煙霧測試、ACP 煙霧測試、Codex app-server
harness，以及所有媒體提供者即時測試（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness），再加上即時執行的憑證處理，請參閱
[測試即時套件](/zh-TW/help/testing-live)。關於專用的更新與
Plugin 驗證檢查清單，請參閱
[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

## Docker 執行器（選用的「在 Linux 中可運作」檢查）

這些 Docker 執行器分成兩類：

- 即時模型執行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker 映像內執行其對應的 profile-key 即時檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），掛載你的本機設定目錄與工作區（如果已掛載，也會來源載入 `~/.profile`）。對應的本機進入點是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 即時執行器預設使用較小的煙霧測試上限，讓完整 Docker 掃描保持可行：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。當你明確想要較大的詳盡掃描時，覆寫這些環境變數。
- `test:docker:all` 透過 `test:docker:live-build` 建置一次即時 Docker 映像，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包一次成 npm tarball，然後建置/重用兩個 `scripts/e2e/Dockerfile` 映像。裸映像只是安裝/更新/Plugin 依賴項路徑的 Node/Git 執行器；這些路徑會掛載預先建置的 tarball。功能映像會把相同 tarball 安裝到 `/app`，供已建置 app 功能路徑使用。Docker 路徑定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選取的計畫。彙總使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序槽，而資源上限會避免繁重即時、npm-install，以及多服務路徑同時全部啟動。如果單一路徑比作用中的上限更重，排程器仍可在池為空時啟動它，然後讓它單獨執行，直到容量再次可用。預設為 10 個槽、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有當 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。執行器預設會執行 Docker 預檢、移除過時的 OpenClaw E2E 容器、每 30 秒列印狀態、將成功路徑時間儲存在 `.artifacts/docker-tests/lane-timings.json`，並在之後執行時使用這些時間先啟動較長的路徑。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印加權路徑 manifest 而不建置或執行 Docker，或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選路徑、package/image 需求，以及憑證的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生的 package 閘門，用來驗證「這個可安裝 tarball 作為產品是否可運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個候選 package，將它上傳為 `package-under-test`，然後針對那個精確 tarball 執行可重用 Docker E2E 路徑，而不是重新打包選取的 ref。Profile 依涵蓋廣度排序：`smoke`、`package`、`product` 和 `full`。關於 package/update/Plugin 合約、已發布升級存活矩陣、發行預設值，以及失敗分流，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。
- 建置與發行檢查會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。該防護會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪靜態建置圖，並在命令分派前的啟動 import 匯入 Commander、prompt UI、undici 或 logging 等 package 依賴項時失敗；它也會讓隨附 Gateway 執行 chunk 維持在預算內，並拒絕已知冷 Gateway 路徑的靜態 import。封裝後 CLI 煙霧測試也涵蓋 root help、onboard help、doctor help、status、config schema，以及 model-list 命令。
- Package Acceptance 舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點之前，harness 只容忍已出貨 package 中繼資料缺口：省略的私有 QA inventory 項目、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔案、缺少持久化 `update.channel`、舊版 Plugin 安裝記錄位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的 config 中繼資料遷移。對 `2026.4.25` 之後的 package，這些路徑都會是嚴格失敗。
- 容器煙霧測試執行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 會啟動一個或多個真實容器，並驗證較高層級的整合路徑。

即時模型 Docker 執行器也只會 bind-mount 所需的 CLI auth home（或在執行未縮小範圍時掛載所有支援的 home），然後在執行前將它們複製到容器 home，讓外部 CLI OAuth 可以重新整理 token，而不會變更主機 auth store：

- 直接模型：`pnpm test:docker:live-models`（指令碼：`scripts/test-live-models-docker.sh`）
- ACP 繫結冒煙測試：`pnpm test:docker:live-acp-bind`（指令碼：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 與 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 嚴格涵蓋 Droid/OpenCode）
- CLI 後端冒煙測試：`pnpm test:docker:live-cli-backend`（指令碼：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒煙測試：`pnpm test:docker:live-codex-harness`（指令碼：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開發代理：`pnpm test:docker:live-gateway`（指令碼：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性冒煙測試：`pnpm qa:otel:smoke` 是私有 QA 原始碼 checkout 通道。它刻意不屬於套件 Docker 發行通道，因為 npm tarball 省略了 QA Lab。
- Open WebUI 即時冒煙測試：`pnpm test:docker:openwebui`（指令碼：`scripts/e2e/openwebui-docker.sh`）
- 入門精靈（TTY，完整 scaffold）：`pnpm test:docker:onboard`（指令碼：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 入門/頻道/代理冒煙測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝打包後的 OpenClaw tarball，透過 env-ref 入門設定 OpenAI，並預設設定 Telegram，執行 doctor，然後執行一次模擬的 OpenAI 代理回合。可用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 略過主機重建，或用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換頻道。
- 更新通道切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝打包後的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證持久化的通道和 Plugin 更新後運作，接著切回套件 `stable` 並檢查更新狀態。
- 升級存活者冒煙測試：`pnpm test:docker:upgrade-survivor` 會把打包後的 OpenClaw tarball 安裝到髒的舊使用者 fixture 上，該 fixture 包含代理、頻道設定、Plugin allowlists、過期的 Plugin 依賴狀態，以及既有工作區/工作階段檔案。它會在沒有即時提供者或頻道金鑰的情況下執行套件更新與非互動式 doctor，接著啟動 loopback Gateway，並檢查設定/狀態保留以及啟動/狀態預算。
- 已發布升級存活者冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設安裝 `openclaw@latest`，植入逼真的既有使用者檔案，用內建命令配方設定該基線，驗證產生的設定，將該已發布安裝更新到候選 tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動 loopback Gateway，並檢查已設定 intents、狀態保留、啟動、`/healthz`、`/readyz` 和 RPC 狀態預算。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫一個基線，要求彙總排程器用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確本機基線，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，並用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue 形狀的 fixture，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動修復外部 OpenClaw Plugin 安裝。Package Acceptance 將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析中繼基線 token，例如 `last-stable-4` 或 `all-since-2026.4.23`，而 Full Release Validation 會將 release-soak 套件閘門展開為 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加上 `reported-issues`。
- 工作階段執行階段內容冒煙測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏執行階段內容 transcript 持久化，以及 doctor 修復受影響的重複 prompt-rewrite 分支。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會打包目前樹狀目錄，在隔離 home 中用 `bun install -g` 安裝它，並驗證 `openclaw infer image providers --json` 會傳回 bundled 圖像提供者，而不是掛起。可用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 略過主機建置，或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- 安裝程式 Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm 容器之間共用一個 npm 快取。更新冒煙測試預設使用 npm `latest` 作為穩定基線，再升級到候選 tarball。可在本機用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上用 Install Smoke workflow 的 `update_baseline_version` 輸入覆寫。非 root 安裝程式檢查會保留隔離的 npm 快取，因此 root 擁有的快取項目不會掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本機重新執行之間重用 root/update/direct-npm 快取。
- Install Smoke CI 會用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 略過重複的 direct-npm 全域更新；需要直接 `npm install -g` 覆蓋範圍時，請在本機不帶該環境變數執行指令碼。
- 代理刪除共用工作區 CLI 冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（指令碼：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設建置根 Dockerfile 映像，在隔離容器 home 中植入兩個代理與一個工作區，執行 `agents delete --json`，並驗證有效 JSON 加上保留工作區行為。可用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke 映像。
- Gateway 網路（兩個容器、WS 驗證 + health）：`pnpm test:docker:gateway-network`（指令碼：`scripts/e2e/gateway-network-docker.sh`）
- 瀏覽器 CDP 快照冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（指令碼：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置原始碼 E2E 映像加上 Chromium 層，使用原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP role 快照涵蓋連結 URL、游標提升的可點擊項、iframe refs 和 frame metadata。
- OpenAI Responses web_search minimal reasoning 迴歸：`pnpm test:docker:openai-web-search-minimal`（指令碼：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行模擬的 OpenAI 伺服器，驗證 `web_search` 將 `reasoning.effort` 從 `minimal` 提升為 `low`，接著強制提供者 schema 拒絕，並檢查原始 detail 出現在 Gateway 記錄中。
- MCP 頻道橋接（已植入 Gateway + stdio bridge + 原始 Claude notification-frame 冒煙測試）：`pnpm test:docker:mcp-channels`（指令碼：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真實 stdio MCP 伺服器 + 內嵌 Pi profile allow/deny 冒煙測試）：`pnpm test:docker:pi-bundle-mcp-tools`（指令碼：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真實 Gateway + 隔離 cron 和一次性 subagent 執行後的 stdio MCP 子程序拆除）：`pnpm test:docker:cron-mcp-cleanup`（指令碼：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（本機路徑、`file:`、具 hoisted 依賴的 npm registry、git moving refs、ClawHub kitchen-sink、marketplace 更新，以及 Claude-bundle 啟用/檢查的安裝/更新冒煙測試）：`pnpm test:docker:plugins`（指令碼：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可略過 ClawHub 區塊，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設 kitchen-sink 套件/執行階段配對。若沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用 hermetic 本機 ClawHub fixture 伺服器。
- Plugin 更新未變更冒煙測試：`pnpm test:docker:plugin-update`（指令碼：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin lifecycle matrix 冒煙測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在裸容器中安裝打包後的 OpenClaw tarball，安裝一個 npm Plugin，切換啟用/停用，透過本機 npm registry 將它升級和降級，刪除已安裝程式碼，接著驗證解除安裝仍會移除過期狀態，同時記錄每個生命週期階段的 RSS/CPU 指標。
- 設定重新載入 metadata 冒煙測試：`pnpm test:docker:config-reload`（指令碼：`scripts/e2e/config-reload-source-docker.sh`）
- Plugins：`pnpm test:docker:plugins` 涵蓋本機路徑、`file:`、具 hoisted 依賴的 npm registry、git moving refs、ClawHub fixtures、marketplace 更新，以及 Claude-bundle 啟用/檢查的安裝/更新冒煙測試。`pnpm test:docker:plugin-update` 涵蓋已安裝 plugins 的未變更更新行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋資源追蹤的 npm Plugin 安裝、啟用、停用、升級、降級，以及缺少程式碼時的解除安裝。

若要手動預先建置並重用共用功能映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

套件專用映像覆寫（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）在設定時仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，若本機尚不存在，指令碼會拉取它。QR 和安裝程式 Docker 測試會保留自己的 Dockerfiles，因為它們驗證的是套件/安裝行為，而不是共用的已建置應用程式執行階段。

live-model Docker 執行器也會以唯讀方式 bind-mount 目前的 checkout，並
將其 staging 到容器內的暫存工作目錄。這能讓 runtime
映像保持精簡，同時仍針對你確切的本機來源/config 執行 Vitest。
staging 步驟會略過大型的本機專用快取與 app 建置輸出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及 app-local `.build` 或
Gradle 輸出目錄，這樣 Docker live 執行就不會花費數分鐘複製
機器特定的 artifacts。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此 gateway live probes 不會在
容器內啟動真正的 Telegram/Discord/等等 channel workers。
`test:docker:live-models` 仍會執行 `pnpm test:live`，所以當你需要縮小或排除該 Docker lane 的 gateway
live 覆蓋範圍時，也要傳入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高層級的相容性 smoke：它會啟動一個
已啟用 OpenAI-compatible HTTP endpoints 的 OpenClaw gateway 容器，
再啟動一個固定版本的 Open WebUI 容器連到該 gateway，透過
Open WebUI 登入，驗證 `/api/models` 會暴露 `openclaw/default`，然後經由
Open WebUI 的 `/api/chat/completions` proxy 傳送一個
真實 chat request。
第一次執行可能明顯較慢，因為 Docker 可能需要拉取
Open WebUI image，而 Open WebUI 也可能需要完成自己的 cold-start setup。
此 lane 需要可用的 live model key，而 `OPENCLAW_PROFILE_FILE`
（預設為 `~/.profile`）是在 Dockerized runs 中提供它的主要方式。
成功執行會印出一小段 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意保持 deterministic，且不需要
真正的 Telegram、Discord 或 iMessage 帳號。它會啟動 seeded Gateway
容器，啟動第二個容器產生 `openclaw mcp serve`，接著
驗證 routed conversation discovery、transcript reads、attachment metadata、
live event queue behavior、outbound send routing，以及透過真實 stdio MCP bridge 的 Claude-style channel +
permission notifications。notification check
會直接檢查 raw stdio MCP frames，因此 smoke 驗證的是
bridge 實際發出的內容，而不只是某個特定 client SDK 剛好呈現的內容。
`test:docker:pi-bundle-mcp-tools` 是 deterministic，且不需要 live
model key。它會建置 repo Docker image，在容器內啟動真實的 stdio MCP probe server，
透過 embedded Pi bundle
MCP runtime 具現化該 server，執行 tool，然後驗證 `coding` 和 `messaging` 保留
`bundle-mcp` tools，而 `minimal` 與 `tools.deny: ["bundle-mcp"]` 會將它們過濾掉。
`test:docker:cron-mcp-cleanup` 是 deterministic，且不需要 live model
key。它會啟動帶有真實 stdio MCP probe server 的 seeded Gateway，執行一個
隔離的 cron turn 和一個 `/subagents spawn` one-shot child turn，接著驗證
MCP child process 會在每次執行後退出。

手動 ACP plain-language thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此 script 供 regression/debug workflows 使用。ACP thread routing validation 可能還會再次需要它，所以不要刪除。

有用的 env vars：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）掛載到 `/home/node/.profile`，並在執行測試前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用於只驗證從 `OPENCLAW_PROFILE_FILE` source 的 env vars，使用暫存 config/workspace dirs，且不掛載外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）掛載到 `/home/node/.npm-global`，供 Docker 內 cached CLI installs 使用
- `$HOME` 底下的外部 CLI auth dirs/files 會以唯讀方式掛載到 `/host-auth...` 下，然後在測試開始前複製到 `/home/node/...`
  - 預設 dirs：`.minimax`
  - 預設 files：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - Narrowed provider runs 只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要 dirs/files
  - 使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的 comma list 手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於在 container 內篩選 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用於在不需要重新建置的 reruns 中重用既有 `openclaw:local-live` image
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保 creds 來自 profile store（而非 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇 gateway 為 Open WebUI smoke 暴露的 model
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI smoke 使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用於覆寫固定的 Open WebUI image tag

## Docs 健全性檢查

在 docs edits 後執行 docs checks：`pnpm check:docs`。
當你也需要 in-page heading checks 時，執行完整的 Mintlify anchor validation：`pnpm docs:check-links:anchors`。

## 離線 regression（CI-safe）

這些是不使用真實 providers 的「real pipeline」regressions：

- Gateway tool calling（mock OpenAI，真實 gateway + agent loop）：`src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway wizard（WS `wizard.start`/`wizard.next`，寫入 config + 強制 auth）：`src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## 代理可靠性評估（Skills）

我們已經有幾個 CI-safe tests，行為類似「agent reliability evals」：

- 透過真實 gateway + agent loop 的 mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 與 config effects 的 end-to-end wizard flows（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請參閱 [Skills](/zh-TW/tools/skills)）：

- **決策：** 當 Skills 列在 prompt 中時，agent 是否選擇正確的 skill（或避開無關的 skill）？
- **合規：** agent 是否在使用前讀取 `SKILL.md`，並遵循必要 steps/args？
- **Workflow contracts：** 斷言 tool order、session history carryover 與 sandbox boundaries 的 multi-turn scenarios。

未來 evals 應優先保持 deterministic：

- 使用 mock providers 的 scenario runner，用於斷言 tool calls + order、skill file reads 與 session wiring。
- 一小組以 skill 為重點的 scenarios（use vs avoid、gating、prompt injection）。
- Optional live evals（opt-in、env-gated）只在 CI-safe suite 就位後再加入。

## Contract tests（Plugin 和 channel shape）

Contract tests 會驗證每個 registered plugin 和 channel 都符合其
interface contract。它們會迭代所有 discovered plugins，並執行一組
shape 與 behavior assertions。預設的 `pnpm test` unit lane 會刻意
略過這些 shared seam 和 smoke files；當你觸碰 shared channel 或 provider surfaces 時，
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

### 何時執行

- 變更 plugin-sdk exports 或 subpaths 後
- 新增或修改 channel 或 provider plugin 後
- 重構 plugin registration 或 discovery 後

Contract tests 會在 CI 中執行，且不需要真實 API keys。

## 新增 regressions（指引）

當你修復 live 中發現的 provider/model issue 時：

- 盡可能新增 CI-safe regression（mock/stub provider，或捕捉精確的 request-shape transformation）
- 如果本質上只能 live（rate limits、auth policies），請讓 live test 保持 narrow，並透過 env vars opt-in
- 優先鎖定能捕捉 bug 的最小層級：
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 或 CI-safe gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class 衍生一個 sampled target，然後斷言 traversal-segment exec ids 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 新增新的 `includeInPlan` SecretRef target family，請更新該 test 中的 `classifyTargetClass`。此 test 會刻意在 unclassified target ids 上失敗，讓新 classes 無法被默默略過。

## 相關

- [測試 live](/zh-TW/help/testing-live)
- [測試更新與 plugins](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
