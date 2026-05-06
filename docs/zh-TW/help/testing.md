---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/提供者錯誤新增迴歸測試
    - 偵錯 Gateway + 代理程式行為
summary: 測試工具包：單元/端到端/即時測試套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-05-06T09:11:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三組 Vitest 套件（單元/整合、e2e、live）以及一小組 Docker runner。這份文件是一份「我們如何測試」指南：

- 每個套件涵蓋什麼（以及刻意_不_涵蓋什麼）。
- 常見工作流程（本機、推送前、偵錯）要執行哪些命令。
- live 測試如何探索憑證並選擇模型/供應商。
- 如何針對真實世界的模型/供應商問題加入迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、live transport lanes）**已另有文件說明：

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) - 架構、命令介面、情境撰寫。
- [Matrix QA](/zh-TW/concepts/qa-matrix) - `pnpm openclaw qa matrix` 的參考資料。
- [QA channel](/zh-TW/channels/qa-channel) - repo 支援情境使用的合成傳輸 Plugin。

本頁涵蓋一般測試套件與 Docker/Parallels runner 的執行方式。下面的 QA 專用 runner 區段（[QA-specific runners](#qa-specific-runners)）列出具體的 `qa` 呼叫，並指回上方參考資料。
</Note>

## 快速開始

大多數日子：

- 完整 gate（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充裕機器上較快的本機完整套件執行：`pnpm test:max`
- 直接 Vitest watch 迴圈：`pnpm test:watch`
- 直接指定檔案現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在反覆處理單一失敗時，優先使用目標式執行。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA lane：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你碰到測試或想要額外信心時：

- 覆蓋率 gate：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

偵錯真實供應商/模型時（需要真實憑證）：

- Live 套件（模型 + Gateway 工具/圖片探測）：`pnpm test:live`
- 安靜地指定一個 live 檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行期效能報告：派送 `OpenClaw Performance`，使用
  `live_gpt54=true` 進行真實 `openai/gpt-5.4` agent turn，或使用
  `deep_profile=true` 產生 Kova CPU/heap/trace artifacts。每日排程執行會在
  `CLAWGRIT_REPORTS_TOKEN` 已設定時，將 mock-provider、deep-profile 和 GPT 5.4 lane artifacts 發佈到
  `openclaw/clawgrit-reports`。mock-provider 報告也包含原始碼層級的 Gateway 啟動、記憶體、
  Plugin 壓力、重複 fake-model hello-loop，以及 CLI 啟動數據。
- Docker live 模型 sweep：`pnpm test:docker:live-models`
  - 每個選定模型現在都會執行一個文字 turn 加上一個小型檔案讀取風格探測。
    中繼資料標示支援 `image` 輸入的模型也會執行一個微型圖片 turn。
    在隔離供應商失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋範圍：每日 `OpenClaw Scheduled Live And E2E Checks` 和手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用 live/E2E workflow，
    其中包含依供應商分片的獨立 Docker live 模型矩陣 jobs。
  - 若要進行聚焦 CI 重新執行，請派送 `OpenClaw Live And E2E Checks (Reusable)`，
    並設定 `include_live_suites: true` 與 `live_models_only: true`。
  - 將新的高訊號供應商 secrets 加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其排程/發行呼叫端。
- Native Codex bound-chat smoke：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker live lane，使用 `/codex bind` 綁定合成
    Slack DM，執行 `/codex fast` 和
    `/codex permissions`，接著驗證純文字回覆與圖片附件會經由 native Plugin binding 路由，而不是 ACP。
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`
  - 透過 Plugin 擁有的 Codex app-server harness 執行 Gateway agent turns，
    驗證 `/codex status` 和 `/codex models`，並預設執行圖片、
    cron MCP、sub-agent 和 Guardian 探測。在隔離其他 Codex
    app-server 失敗時，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用 sub-agent 探測。若要進行聚焦 sub-agent 檢查，請停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則這會在 sub-agent 探測後結束。
- Crestodian rescue command smoke：`pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command 介面的選擇性雙重保險檢查。
    它會執行 `/crestodian status`、佇列持久模型變更、
    回覆 `/crestodian yes`，並驗證稽核/config 寫入路徑。
- Crestodian planner Docker smoke：`pnpm test:docker:crestodian-planner`
  - 在無 config 的容器中執行 Crestodian，且 `PATH` 上有 fake Claude CLI，
    並驗證 fuzzy planner fallback 會轉換成已稽核的型別化 config 寫入。
- Crestodian first-run Docker smoke：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw 狀態目錄開始，將裸 `openclaw` 路由到
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入，
    驗證 config，並驗證稽核項目。相同的 Ring 0 設定路徑也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 涵蓋。
- Moonshot/Kimi 成本 smoke：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著對
  `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先使用下方描述的 allowlist env vars 縮小 live 測試範圍。
</Tip>

## QA 專用 runner

當你需要 QA-lab 真實性時，這些命令與主要測試套件並列：

CI 會在專用 workflows 中執行 QA Lab。Agentic parity 巢狀位於
`QA-Lab - All Lanes` 和發行驗證之下，而不是獨立的 PR workflow。
廣泛驗證應使用 `Full Release Validation`，搭配
`rerun_group=qa-parity` 或 release-checks QA 群組。穩定/預設發行檢查會將詳盡的 live/Docker soak 保留在 `run_release_soak=true` 之後；
`full` profile 會強制開啟 soak。`QA-Lab - All Lanes`
會在 `main` 上每晚執行，並可由手動派送執行，將 mock parity lane、live
Matrix lane、Convex 管理的 live Telegram lane，以及 Convex 管理的 live Discord
lane 作為平行 jobs。排程 QA 與發行檢查會明確傳入 Matrix
`--profile fast`，而 Matrix CLI 和手動 workflow input
預設仍為 `all`；手動派送可將 `all` 分片為 `transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` jobs。`OpenClaw Release
Checks` 會在發行核准前執行 parity 加上 fast Matrix 和 Telegram lanes，
並對發行傳輸檢查使用 `mock-openai/gpt-5.5`，使其保持確定性並避開一般 provider-plugin 啟動。
這些 live transport Gateway 會停用記憶體搜尋；記憶體行為仍由 QA parity
suites 涵蓋。

完整發行 live media shards 使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 和 `ffprobe`。Docker live model/backend shards 使用每個選定
commit 建置一次的共用
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在每個 shard 內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由 repo 支援的 QA 情境。
  - 預設使用隔離的 Gateway worker 平行執行多個選取的情境。`qa-channel` 預設並行度為 4（受選取情境數量限制）。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 走較舊的序列 lane。
  - 任一情境失敗時會以非零狀態結束。若你想要保留 artifact 但不要失敗的結束碼，請使用 `--allow-failures`。
  - 支援 provider 模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 會啟動本機 AIMock 支援的 provider 伺服器，用於實驗性的 fixture 與 protocol-mock 涵蓋範圍，而不會取代具備情境感知的 `mock-openai` lane。
- `pnpm test:plugins:kitchen-sink-live`
  - 透過 QA Lab 執行即時 OpenAI Kitchen Sink Plugin 闖關測試。它會安裝外部 Kitchen Sink 套件、驗證 plugin SDK surface 清單、探測 `/healthz` 和 `/readyz`、記錄 Gateway CPU/RSS 證據、執行一次即時 OpenAI turn，並檢查對抗式診斷。需要即時 OpenAI 驗證，例如 `OPENAI_API_KEY`。在已 hydrate 的 Testbox session 中，當 `openclaw-testbox-env` helper 存在時，它會自動載入 Testbox live-auth profile。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 Gateway 啟動 benchmark 加上一小組 mock QA Lab 情境包（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`），並在 `.artifacts/gateway-cpu-scenarios/` 下寫入合併的 CPU 觀察摘要。
  - 預設只標記持續高 CPU 觀察（`--cpu-core-warn` 加上 `--hot-wall-warn-ms`），因此短暫的啟動尖峰會被記錄為指標，而不會看起來像持續數分鐘的 Gateway 滿載回歸。
  - 使用已建置的 `dist` artifact；當 checkout 尚未有新的 runtime 輸出時，請先執行 build。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 內執行相同的 QA suite。
  - 保留與主機上 `qa suite` 相同的情境選取行為。
  - 重用與 `qa suite` 相同的 provider/model 選取旗標。
  - 即時執行會轉送實務上適合 guest 的受支援 QA auth 輸入：以 env 為基礎的 provider key、QA live provider config path，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須維持在 repo root 下，讓 guest 能透過掛載的 workspace 寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA report 與 summary，以及 Multipass log。
- `pnpm qa:lab:up`
  - 啟動 Docker 支援的 QA 站點，用於 operator 風格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball，在 Docker 中全域安裝、執行非互動式 OpenAI API key onboarding、預設設定 Telegram、驗證封裝的 Plugin runtime 可載入且啟動時不需依賴修復、執行 doctor，並對 mock OpenAI endpoint 執行一次本機 agent turn。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的封裝安裝 lane。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式 runtime context transcript 執行決定性的 built-app Docker smoke。它會驗證隱藏的 OpenClaw runtime context 會以非顯示 custom message 持久化，而不是洩漏到可見的 user turn，接著 seed 受影響的破損 session JSONL，並驗證 `openclaw doctor --fix` 會以備份重寫到 active branch。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw 套件候選版本、執行已安裝套件 onboarding、透過已安裝 CLI 設定 Telegram，然後以該已安裝套件作為 SUT Gateway 重用即時 Telegram QA lane。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或 `OPENCLAW_CURRENT_PACKAGE_TGZ`，可測試解析後的本機 tarball，而不是從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env credential 或 Convex credential source。對於 CI/release automation，請設定 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` 加上 `OPENCLAW_QA_CONVEX_SITE_URL` 與 role secret。如果 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex role secret，Docker wrapper 會自動選取 Convex。
  - wrapper 會先在主機上驗證 Telegram 或 Convex credential env，然後才進行 Docker build/install 工作。只有在刻意除錯 credential 前置設定時，才設定 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會覆寫此 lane 的共用 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 也將此 lane 暴露為手動 maintainer workflow `NPM Telegram Beta E2E`。它不會在 merge 時執行。該 workflow 使用 `qa-live-shared` environment 與 Convex CI credential lease。
- GitHub Actions 也暴露 `Package Acceptance`，用於對單一候選套件進行 side-run product proof。它接受受信任的 ref、已發佈的 npm spec、HTTPS tarball URL 加上 SHA-256，或來自另一個 run 的 tarball artifact，將標準化的 `openclaw-current.tgz` 上傳為 `package-under-test`，接著以 smoke、package、product、full 或 custom lane profile 執行既有 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可對相同的 `package-under-test` artifact 執行 Telegram QA workflow。
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
  - 在 Docker 中打包並安裝目前的 OpenClaw build，啟動已設定 OpenAI 的 Gateway，接著透過 config 編輯啟用 bundled channel/Plugin。
  - 驗證 setup discovery 會讓未設定的可下載 Plugin 保持不存在，第一次設定的 doctor repair 會明確安裝每個缺少的可下載 Plugin，第二次重啟不會執行隱藏依賴修復。
  - 也會安裝已知的較舊 npm baseline，在執行 `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證候選版本的 post-update doctor 會清除 legacy Plugin 依賴殘留，而不需 harness 端 postinstall repair。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 執行原生封裝安裝更新 smoke。每個選取的平台會先安裝要求的 baseline 套件，接著在同一個 guest 中執行已安裝的 `openclaw update` 命令，並驗證已安裝版本、更新狀態、Gateway readiness，以及一次本機 agent turn。
  - 在針對單一 guest 迭代時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得 summary artifact path 與各 lane 狀態。
  - OpenAI lane 預設使用 `openai/gpt-5.5` 作為即時 agent-turn proof。若刻意驗證另一個 OpenAI model，請傳入 `--model <provider/model>` 或設定 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 請用主機 timeout 包住長時間本機執行，避免 Parallels transport stall 耗盡剩餘測試時間：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 腳本會在 `/tmp/openclaw-parallels-npm-update.*` 下寫入巢狀 lane log。請先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`，再假設外層 wrapper 卡住。
  - 在冷 guest 上，Windows update 可能會花 10 到 15 分鐘進行 post-update doctor 與套件更新工作；只要巢狀 npm debug log 仍在前進，這仍屬健康狀態。
  - 不要將此 aggregate wrapper 與個別 Parallels macOS、Windows 或 Linux smoke lane 平行執行。它們共用 VM 狀態，可能在 snapshot restore、套件 serving 或 guest Gateway 狀態上衝突。
  - post-update proof 會執行一般 bundled Plugin surface，因為 speech、image generation 和 media understanding 等 capability facade 會透過 bundled runtime API 載入，即使 agent turn 本身只檢查簡單文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider 伺服器，用於直接 protocol smoke 測試。
- `pnpm openclaw qa matrix`
  - 對一次性 Docker 支援的 Tuwunel homeserver 執行 Matrix 即時 QA lane。僅限 source-checkout - 封裝安裝不會出貨 `qa-lab`。
  - 完整 CLI、profile/scenario catalog、env var 與 artifact layout：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自 env 的 driver 與 SUT bot token，對真正的私人群組執行 Telegram 即時 QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必須是數字 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共用 pooled credential。預設使用 env mode，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選擇使用 pooled lease。
  - 任一情境失敗時會以非零狀態結束。若你想要保留 artifact 但不要失敗的結束碼，請使用 `--allow-failures`。
  - 需要同一個私人群組中的兩個不同 bot，且 SUT bot 必須公開 Telegram username。
  - 為了穩定觀察 bot-to-bot，請在 `@BotFather` 中為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 可以觀察群組 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA report、summary 與 observed-messages artifact。回覆情境包含從 driver send request 到觀察到 SUT reply 的 RTT。

即時 transport lane 共用一個標準 contract，讓新的 transport 不會偏移；每個 lane 的 coverage matrix 位於 [QA 概覽 → 即時 transport coverage](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的 synthetic suite，不屬於該 matrix。

### 透過 Convex 共用 Telegram credential (v1)

當為 `openclaw qa telegram` 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex 支援的 pool 取得專屬 lease，在 lane 執行期間對該 lease 發送 heartbeat，並在 shutdown 時釋放 lease。

參考 Convex project scaffold：

- `qa/convex-credential-broker/`

必要 env var：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選 role 的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- Credential role 選取：
  - CLI：`--credential-role maintainer|ci`
  - Env default：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中預設為 `ci`，否則為 `maintainer`）

選用 env var：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許本機專用開發使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常操作中應使用 `https://`。

維護者管理命令（pool add/remove/list）特別需要
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供維護者使用的 CLI 輔助工具：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時執行前使用 `doctor` 來檢查 Convex 站台 URL、代理程式密鑰、
端點前綴、HTTP 逾時，以及 admin/list 可達性，且不列印
密鑰值。在腳本與 CI
工具中使用 `--json` 以取得機器可讀的輸出。

預設端點合約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 請求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 已耗盡/可重試：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

Telegram kind 的承載資料形狀：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字 Telegram 聊天 id 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證此形狀，並拒絕格式錯誤的承載資料。

### 將通道加入 QA

新通道介面卡的架構與情境輔助工具名稱位於 [QA 概觀 → 新增通道](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低標準：在共用的 `qa-lab` 主機接縫上實作傳輸執行器，在 Plugin 資訊清單中宣告 `qaRunners`，掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫情境。

## 測試套件（在哪裡執行什麼）

可以把這些套件視為「真實性逐步提高」（同時不穩定性/成本也提高）：

### 單元 / 整合（預設）

- 命令：`pnpm test`
- 設定：未指定目標的執行會使用 `vitest.full-*.config.ts` 分片集合，並可能將多專案分片展開為個別專案設定，以利平行排程
- 檔案：位於 `src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的核心/單元清單；UI 單元測試在專用的 `unit-ui` 分片中執行
- 範圍：
  - 純單元測試
  - 程序內整合測試（gateway auth、routing、tooling、parsing、config）
  - 已知錯誤的確定性迴歸測試
- 期望：
  - 在 CI 中執行
  - 不需要真實金鑰
  - 應該快速且穩定
  - 解析器與公開介面載入器測試必須使用產生的微型 Plugin 夾具，證明廣泛的 `api.js` 和
    `runtime-api.js` 後援行為，而不是
    真實的內建 Plugin 原始碼 API。真實 Plugin API 載入屬於
    Plugin 擁有的合約/整合套件。

<AccordionGroup>
  <Accordion title="專案、分片與範圍化路徑">

    - 未指定目標的 `pnpm test` 會執行十二個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生根專案程序。這會降低負載機器上的 RSS 峰值，並避免 auto-reply/extension 工作讓不相關套件飢餓。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片 watch 迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過範圍化路徑路由明確的檔案/目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免支付完整根專案啟動成本。
    - `pnpm test:changed` 預設會將變更的 git 路徑展開為便宜的範圍化路徑：直接測試編輯、同層 `*.test.ts` 檔案、明確原始碼映射，以及本機匯入圖相依項。設定/setup/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的正常智慧型本機檢查閘門。它會將差異分類為核心、核心測試、extensions、extension 測試、apps、docs、release metadata、live Docker tooling 與 tooling，然後執行相符的型別檢查、lint 與防護命令。它不會執行 Vitest 測試；若要測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅含 release metadata 的版本提升會執行目標版本/config/root-dependency 檢查，並有防護會拒絕頂層版本欄位以外的套件變更。
    - Live Docker ACP harness 編輯會執行聚焦檢查：live Docker auth 腳本的 shell 語法，以及 live Docker scheduler dry-run。只有當差異限制在 `scripts["test:docker:live-*"]` 時，才會包含 `package.json` 變更；dependency、export、version 與其他 package-surface 編輯仍使用較廣泛的防護。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純工具區域的輕匯入單元測試會透過 `unit-fast` 路徑路由，該路徑會略過 `test/setup-openclaw-runtime.ts`；具狀態/重執行階段的檔案會留在既有路徑上。
    - 選定的 `plugin-sdk` 和 `commands` 輔助工具原始碼檔案，也會將 changed-mode 執行映射到這些輕量路徑中的明確同層測試，因此輔助工具編輯可避免重新執行該目錄的完整重型套件。
    - `auto-reply` 有專用桶，分別用於頂層核心輔助工具、頂層 `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹。CI 會進一步將 reply 子樹拆分為 agent-runner、dispatch 與 commands/state-routing 分片，因此單一匯入繁重的桶不會擁有完整的 Node 尾端。
    - 一般 PR/main CI 會刻意略過 extension 批次掃描和僅 release 使用的 `agentic-plugins` 分片。完整發行驗證會針對發行候選版本，調度獨立的 `Plugin Prerelease` 子工作流程來執行這些 Plugin/extension 繁重的套件。

  </Accordion>

  <Accordion title="嵌入式執行器涵蓋範圍">

    - 當你變更訊息工具探索輸入或 Compaction 執行階段
      context 時，請保留兩層涵蓋範圍。
    - 針對純 routing 與 normalization
      邊界新增聚焦的輔助工具迴歸測試。
    - 保持嵌入式執行器整合套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證範圍化 id 與 Compaction 行為仍會流經
      真實的 `run.ts` / `compact.ts` 路徑；只有輔助工具測試
      不足以取代這些整合路徑。

  </Accordion>

  <Accordion title="Vitest 集區與隔離預設值">

    - 基礎 Vitest 設定預設為 `threads`。
    - 共用 Vitest 設定固定 `isolate: false`，並在
      根專案、e2e 與 live 設定中使用
      非隔離執行器。
    - 根 UI 路徑保留其 `jsdom` setup 與 optimizer，但也在
      共用非隔離執行器上執行。
    - 每個 `pnpm test` 分片都會繼承共用 Vitest 設定中的相同 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子 Node
      程序加入 `--no-maglev`，以減少大型本機執行期間的 V8 編譯 churn。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與原生 V8
      行為比較。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示差異觸發哪些架構路徑。
    - pre-commit hook 僅做格式化。它會重新暫存格式化後的檔案，且
      不會執行 lint、型別檢查或測試。
    - 當你需要智慧型本機檢查閘門時，請在交接或 push 前明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過便宜的範圍化路徑路由。只有當 agent
      判定 harness、config、package 或 contract 編輯確實需要更廣泛的
      Vitest 涵蓋範圍時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同路由
      行為，只是使用更高的 worker 上限。
    - 本機 worker 自動縮放刻意保守，且會在主機負載平均值已高時退讓，因此多個並行
      Vitest 執行預設造成較少影響。
    - 基礎 Vitest 設定將 projects/config 檔案標記為
      `forceRerunTriggers`，因此當測試
      wiring 變更時，changed-mode 重新執行仍保持正確。
    - 設定會在支援的
      主機上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；若你想為直接 profiling
      使用一個明確快取位置，請設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="效能偵錯">

    - `pnpm test:perf:imports` 會啟用 Vitest 匯入耗時報告以及
      匯入細項輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling 視圖範圍化到
      自 `origin/main` 以來變更的檔案。
    - 分片計時資料會寫入 `.artifacts/vitest-shard-timings.json`。
      整個設定執行會使用設定路徑作為 key；include-pattern CI
      分片會附加分片名稱，因此可分別追蹤篩選後的分片。
    - 當某個熱門測試仍將大部分時間花在啟動匯入時，
      請將重型相依項保留在狹窄的本機 `*.runtime.ts` 接縫後面，並
      直接 mock 該接縫，而不是深度匯入執行階段輔助工具，只是為了
      將它們傳入 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會將路由後的
      `test:changed` 與該已提交
      差異的原生根專案路徑比較，並列印耗時加上 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 和根 Vitest 設定路由變更檔案清單，以對目前
      髒樹進行基準測試。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite 啟動與 transform overhead 寫入主執行緒 CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用檔案平行處理的情況下，為
      單元套件寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 穩定性（Gateway）

- 命令：`pnpm test:stability:gateway`
- 設定：`vitest.gateway.config.ts`，強制使用一個 worker
- 範圍：
  - 啟動真實的 loopback Gateway，預設啟用 diagnostics
  - 透過 diagnostic event 路徑驅動合成的 gateway 訊息、memory 與大型承載資料 churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 涵蓋 diagnostic stability bundle persistence 輔助工具
  - 斷言 recorder 保持有界、合成 RSS 樣本維持在壓力預算以下，且每個 session 佇列深度會排空回零
- 期望：
  - CI 安全且無需金鑰
  - 用於穩定性迴歸後續處理的窄路徑，不能取代完整 Gateway 套件

### E2E（Gateway 冒煙測試）

- 命令：`pnpm test:e2e`
- 設定：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的內建 Plugin E2E 測試
- 執行時預設值：
  - 使用 Vitest `threads` 並搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用自適應工作程序（CI：最多 2 個，本機：預設 1 個）。
  - 預設以靜默模式執行，以降低主控台 I/O 負擔。
- 實用覆寫設定：
  - `OPENCLAW_E2E_WORKERS=<n>` 可強制指定工作程序數量（上限為 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 可重新啟用詳細主控台輸出。
- 範圍：
  - 多執行個體 Gateway 端對端行為
  - WebSocket/HTTP 介面、Node 配對，以及較重的網路功能
- 預期：
  - 在 CI 中執行（當管線中啟用時）
  - 不需要真實金鑰
  - 比單元測試有更多移動元件（可能較慢）

### E2E：OpenShell 後端煙霧測試

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 透過 Docker 在主機上啟動隔離的 OpenShell Gateway
  - 從暫存本機 Dockerfile 建立 sandbox
  - 透過真實的 `sandbox ssh-config` + SSH exec 演練 OpenClaw 的 OpenShell 後端
  - 透過 sandbox fs bridge 驗證遠端 canonical 檔案系統行為
- 預期：
  - 僅限選用；不屬於預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` CLI 加上可運作的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，接著銷毀測試 Gateway 與 sandbox
- 實用覆寫設定：
  - `OPENCLAW_E2E_OPENSHELL=1` 可在手動執行較廣泛的 e2e 套件時啟用測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 可指向非預設的 CLI 二進位檔或 wrapper script

### Live（真實 provider + 真實 model）

- 命令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的內建 Plugin live 測試
- 預設：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個 provider/model 在 _今天_ 搭配真實憑證時真的能運作嗎？」
  - 捕捉 provider 格式變更、tool-calling 怪異行為、驗證問題，以及速率限制行為
- 預期：
  - 設計上不保證 CI 穩定（真實網路、真實 provider 政策、配額、服務中斷）
  - 會花錢 / 使用速率限制
  - 建議執行縮小範圍的子集，而不是「全部」
- Live 執行會 source `~/.profile` 以取得缺少的 API key。
- 預設情況下，live 執行仍會隔離 `HOME`，並將設定/驗證資料複製到暫存測試 home，讓單元 fixture 無法變更你真實的 `~/.openclaw`。
- 只有在你刻意需要 live 測試使用真實 home 目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設為較安靜的模式：它保留 `[live] ...` 進度輸出，但抑制額外的 `~/.profile` 通知，並靜音 Gateway bootstrap logs/Bonjour 雜訊。如果你想取回完整啟動 logs，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 輪替（provider 特定）：以逗號/分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 針對每次 live 覆寫；測試會在速率限制回應時重試。
- 進度/Heartbeat 輸出：
  - Live 套件現在會將進度行輸出到 stderr，因此即使 Vitest 主控台擷取很安靜，長時間 provider 呼叫仍會顯示為作用中。
  - `vitest.live.config.ts` 會停用 Vitest 主控台攔截，因此 provider/Gateway 進度行會在 live 執行期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整 direct-model Heartbeat。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 Gateway/probe Heartbeat。

## 我該執行哪個套件？

使用這個決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你變更很多，也執行 `pnpm test:coverage`）
- 觸及 Gateway networking / WS protocol / pairing：加上 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ provider 特定失敗 / tool calling：執行縮小範圍的 `pnpm test:live`

## Live（會觸及網路的）測試

如需 live model 矩陣、CLI 後端煙霧測試、ACP 煙霧測試、Codex app-server
harness，以及所有 media-provider live 測試（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness），加上 live 執行的憑證處理，請參閱
[測試 live 套件](/zh-TW/help/testing-live)。如需專用的更新與
Plugin 驗證檢查清單，請參閱
[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

## Docker runner（選用的「在 Linux 中可運作」檢查）

這些 Docker runner 分成兩個類別：

- Live-model runner：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker image 內執行各自符合 profile-key 的 live 檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），掛載你的本機 config dir 與 workspace（如果已掛載，也會 source `~/.profile`）。對應的本機 entrypoint 是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live runner 預設為較小的 smoke 上限，讓完整 Docker 掃描維持實用：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明確想要較大的完整掃描時，才覆寫這些 env var。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置 live Docker image 一次，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包成 npm tarball 一次，接著建置/重用兩個 `scripts/e2e/Dockerfile` image。裸 image 只是 install/update/plugin-dependency lane 的 Node/Git runner；那些 lane 會掛載預先建置的 tarball。功能 image 會將同一個 tarball 安裝到 `/app`，用於 built-app functionality lane。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的 plan。彙總會使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序 slot，而 resource cap 會避免繁重的 live、npm-install 和 multi-service lane 同時全部啟動。如果單一 lane 比作用中的 cap 更重，排程器仍可在 pool 為空時啟動它，然後讓它單獨持續執行，直到容量再次可用。預設為 10 個 slot、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker host 有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。runner 預設會執行 Docker preflight、移除過時的 OpenClaw E2E container、每 30 秒列印狀態、將成功 lane timings 儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行中使用這些 timings 先啟動較長的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不建置或執行 Docker 的情況下列印加權 lane manifest，或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lane、package/image 需求與憑證的 CI plan。
- `Package Acceptance` 是 GitHub-native package gate，用來判斷「這個可安裝的 tarball 是否可作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個候選 package，將它上傳為 `package-under-test`，接著針對該精確 tarball 執行可重用的 Docker E2E lane，而不是重新打包選定的 ref。Profile 依廣度排序：`smoke`、`package`、`product` 和 `full`。請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)，了解 package/update/Plugin contract、published-upgrade survivor matrix、release defaults，以及 failure triage。
- Build 與 release 檢查會在 tsdown 之後執行 `scripts/check-cli-bootstrap-imports.mjs`。guard 會從 `dist/entry.js` 與 `dist/cli/run-main.js` 走訪 static built graph，並在 pre-dispatch startup 於 command dispatch 前匯入 Commander、prompt UI、undici 或 logging 等 package dependencies 時失敗；它也會讓 bundled Gateway run chunk 維持在預算內，並拒絕已知 cold Gateway path 的 static import。Packaged CLI smoke 也涵蓋 root help、onboard help、doctor help、status、config schema，以及 model-list command。
- Package Acceptance legacy compatibility 上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點之前，harness 只容忍已出貨 package 的 metadata 缺口：省略的 private QA inventory entries、缺少 `gateway install --wrapper`、tarball-derived git fixture 中缺少 patch files、缺少 persisted `update.channel`、舊版 Plugin install-record locations、缺少 marketplace install-record persistence，以及 `plugins update` 期間的 config metadata migration。對 `2026.4.25` 之後的 package，這些路徑都是嚴格失敗。
- Container smoke runner：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`，以及 `test:docker:config-reload` 會啟動一個或多個真實 container，並驗證較高層級的整合路徑。

Live-model Docker runner 也只會 bind-mount 所需的 CLI auth home（或在執行未縮小範圍時掛載所有支援的 auth home），接著在執行前將它們複製到 container home，讓外部 CLI OAuth 可以重新整理 token，而不會改變 host auth store：

- 直接模型：`pnpm test:docker:live-models`（指令碼：`scripts/test-live-models-docker.sh`）
- ACP 繫結冒煙測試：`pnpm test:docker:live-acp-bind`（指令碼：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 嚴格涵蓋 Droid/OpenCode）
- CLI 後端冒煙測試：`pnpm test:docker:live-cli-backend`（指令碼：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server 測試框架冒煙測試：`pnpm test:docker:live-codex-harness`（指令碼：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開發代理：`pnpm test:docker:live-gateway`（指令碼：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性冒煙測試：`pnpm qa:otel:smoke` 是私有 QA 原始碼簽出檢查路徑。它刻意不屬於套件 Docker 發行路徑，因為 npm tarball 會省略 QA Lab。
- Open WebUI 即時冒煙測試：`pnpm test:docker:openwebui`（指令碼：`scripts/e2e/openwebui-docker.sh`）
- 入門精靈（TTY，完整鷹架）：`pnpm test:docker:onboard`（指令碼：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 入門/channel/agent 冒煙測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball，透過 env-ref 入門流程設定 OpenAI，並預設設定 Telegram，執行 doctor，然後執行一次模擬的 OpenAI agent 回合。可使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳過主機重建，或用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 或 `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` 切換 channel。
- 更新 channel 切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證持久化的 channel 與 Plugin 更新後作業，然後切回套件 `stable` 並檢查更新狀態。
- 升級倖存者冒煙測試：`pnpm test:docker:upgrade-survivor` 會將已封裝的 OpenClaw tarball 安裝到有 agents、channel 設定、Plugin allowlists、過期 Plugin 相依狀態，以及既有 workspace/session 檔案的髒舊使用者 fixture 上。它會執行套件更新與非互動式 doctor，不需要即時 provider 或 channel keys，接著啟動 loopback Gateway，並檢查 config/state 保留狀況與啟動/status 預算。
- 已發布升級倖存者冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設會安裝 `openclaw@latest`，植入寫實的既有使用者檔案，使用內建的命令配方設定該基準，驗證產生的設定，將該已發布安裝更新到候選 tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動 loopback Gateway，並檢查已設定的 intents、state 保留狀況、啟動、`/healthz`、`/readyz` 與 RPC status 預算。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準，要求彙總排程器用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確本機基準，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，並用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開議題形狀的 fixtures，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動修復外部 OpenClaw Plugin 安裝。Package Acceptance 將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，解析像 `last-stable-4` 或 `all-since-2026.4.23` 這類中繼基準 token，而 Full Release Validation 會將 release-soak 套件關卡展開為 `last-stable-4 2026.4.23 2026.5.2 2026.4.15` 加上 `reported-issues`。
- Session 執行階段 context 冒煙測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏執行階段 context transcript 持久化，以及 doctor 對受影響重複 prompt-rewrite 分支的修復。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會封裝目前 tree，在隔離 home 中用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會回傳 bundled image providers，而不是卡住。可使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳過主機建置，或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置 Docker image 複製 `dist/`。
- 安裝程式 Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm containers 之間共用一個 npm cache。Update 冒煙測試預設會先以 npm `latest` 作為 stable 基準，再升級到候選 tarball。可在本機用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上透過 Install Smoke workflow 的 `update_baseline_version` input 覆寫。非 root 安裝程式檢查會保留隔離的 npm cache，避免 root 擁有的 cache entries 掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 以在本機重跑時重用 root/update/direct-npm cache。
- Install Smoke CI 會用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳過重複的 direct-npm 全域更新；當需要直接 `npm install -g` 覆蓋率時，請在本機執行不帶該 env 的指令碼。
- Agents 刪除共用 workspace CLI 冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（指令碼：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置 root Dockerfile image，在隔離 container home 中植入兩個 agents 和一個 workspace，執行 `agents delete --json`，並驗證有效 JSON 與保留 workspace 行為。可用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke image。
- Gateway 網路（兩個 containers，WS auth + health）：`pnpm test:docker:gateway-network`（指令碼：`scripts/e2e/gateway-network-docker.sh`）
- Browser CDP snapshot 冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（指令碼：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置來源 E2E image 加上 Chromium layer，以原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP role snapshots 涵蓋 link URLs、游標提升的可點擊項目、iframe refs 和 frame metadata。
- OpenAI Responses web_search minimal reasoning 回歸測試：`pnpm test:docker:openai-web-search-minimal`（指令碼：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行模擬的 OpenAI server，驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提升到 `low`，然後強制 provider schema 拒絕，並檢查原始詳細資訊會出現在 Gateway logs 中。
- MCP channel 橋接（已植入 Gateway + stdio bridge + 原始 Claude notification-frame 冒煙測試）：`pnpm test:docker:mcp-channels`（指令碼：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP tools（真實 stdio MCP server + 內嵌 Pi profile allow/deny 冒煙測試）：`pnpm test:docker:pi-bundle-mcp-tools`（指令碼：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真實 Gateway + stdio MCP child 在隔離 cron 與一次性 subagent 執行後拆除）：`pnpm test:docker:cron-mcp-cleanup`（指令碼：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（local path、`file:`、具 hoisted dependencies 的 npm registry、git moving refs、ClawHub kitchen-sink、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update 冒煙測試）：`pnpm test:docker:plugins`（指令碼：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 以跳過 ClawHub 區塊，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的 kitchen-sink package/runtime pair。若沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用 hermetic 本機 ClawHub fixture server。
- Plugin update unchanged 冒煙測試：`pnpm test:docker:plugin-update`（指令碼：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin lifecycle matrix 冒煙測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在裸 container 中安裝已封裝的 OpenClaw tarball，安裝一個 npm Plugin，切換 enable/disable，透過本機 npm registry 對它升級與降級，刪除已安裝的程式碼，然後驗證 uninstall 仍會移除過期 state，同時為每個 lifecycle phase 記錄 RSS/CPU metrics。
- Config reload metadata 冒煙測試：`pnpm test:docker:config-reload`（指令碼：`scripts/e2e/config-reload-source-docker.sh`）
- Plugins：`pnpm test:docker:plugins` 涵蓋 local path、`file:`、具 hoisted dependencies 的 npm registry、git moving refs、ClawHub fixtures、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update 冒煙測試。`pnpm test:docker:plugin-update` 涵蓋已安裝 Plugins 的 unchanged update 行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋資源追蹤的 npm Plugin install、enable、disable、upgrade、downgrade，以及 missing-code uninstall。

若要手動預先建置並重用共用 functional image：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

套件專屬的 image 覆寫，例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`，在設定時仍會優先套用。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用 image 時，如果本機尚未存在，指令碼會拉取它。QR 與安裝程式 Docker 測試會保留各自的 Dockerfiles，因為它們驗證的是 package/install 行為，而不是共用的已建置 app runtime。

Live 模型 Docker 執行器也會將目前 checkout 以唯讀方式 bind-mount，並
將其暫存到容器內的臨時 workdir。這讓 runtime
映像檔保持精簡，同時仍針對你確切的本機原始碼/設定執行 Vitest。
暫存步驟會略過大型的本機專用快取和 app 建置輸出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及 app 本機的 `.build` 或
Gradle 輸出目錄，因此 Docker live 執行不會花費數分鐘複製
機器專屬的成品。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此 Gateway live 探測不會在
容器內啟動真正的 Telegram/Discord 等 channel worker。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要縮小或排除該 Docker lane 的 Gateway
live 覆蓋範圍時，也要傳入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高層級的相容性 smoke：它會啟動一個
啟用 OpenAI 相容 HTTP 端點的 OpenClaw Gateway 容器，
再啟動一個 pinned Open WebUI 容器連到該 Gateway，透過
Open WebUI 登入，驗證 `/api/models` 有公開 `openclaw/default`，接著透過 Open WebUI 的 `/api/chat/completions` proxy 傳送一個
真正的 chat request。
第一次執行可能明顯較慢，因為 Docker 可能需要拉取
Open WebUI 映像檔，而 Open WebUI 可能也需要完成自己的 cold-start 設定。
這個 lane 需要可用的 live 模型 key，而 `OPENCLAW_PROFILE_FILE`
（預設為 `~/.profile`）是在 Docker 化執行中提供它的主要方式。
成功執行會列印一小段 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意設計為確定性，且不需要
真正的 Telegram、Discord 或 iMessage 帳號。它會啟動 seeded Gateway
容器，啟動第二個容器來產生 `openclaw mcp serve`，接著
驗證已路由的對話探索、transcript 讀取、附件 metadata、
live event queue 行為、outbound send routing，以及透過真正 stdio MCP bridge 傳送的 Claude-style channel +
permission notifications。通知檢查會直接檢查 raw stdio MCP frames，因此這個 smoke 驗證的是
bridge 實際發出的內容，而不只是特定 client SDK 剛好顯示的內容。
`test:docker:pi-bundle-mcp-tools` 是確定性的，且不需要 live
模型 key。它會建置 repo Docker 映像檔，在容器內啟動真正的 stdio MCP probe server，
透過嵌入式 Pi bundle
MCP runtime 具體化該 server、執行工具，接著驗證 `coding` 和 `messaging` 會保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 會將它們過濾掉。
`test:docker:cron-mcp-cleanup` 是確定性的，且不需要 live 模型
key。它會啟動一個 seeded Gateway 搭配真正的 stdio MCP probe server，執行一次
隔離的 Cron turn 和一次 `/subagents spawn` one-shot child turn，接著驗證
MCP child process 會在每次執行後結束。

手動 ACP plain-language thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此 script 供 regression/debug workflow 使用。ACP thread routing validation 之後可能仍會再次需要它，因此不要刪除。

有用的 env vars：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）掛載到 `/home/node/.profile`，並在執行測試前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 只驗證從 `OPENCLAW_PROFILE_FILE` source 的 env vars，使用臨時 config/workspace dirs，且不掛載外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）掛載到 `/home/node/.npm-global`，用於 Docker 內快取的 CLI install
- `$HOME` 下的外部 CLI auth dirs/files 會以唯讀方式掛載到 `/host-auth...` 之下，接著在測試開始前複製到 `/home/node/...`
  - 預設 dirs：`.minimax`
  - 預設 files：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 縮小範圍的 provider 執行只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要 dirs/files
  - 使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的 comma list 來手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於在容器內過濾 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用於重跑時重用既有的 `openclaw:local-live` 映像檔，適用於不需要重新建置的情境
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保 credentials 來自 profile store（而不是 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇 Gateway 為 Open WebUI smoke 公開的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI smoke 使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用於覆寫 pinned Open WebUI image tag

## 文件健全性

在文件編輯後執行文件檢查：`pnpm check:docs`。
當你也需要 in-page heading 檢查時，執行完整的 Mintlify anchor validation：`pnpm docs:check-links:anchors`。

## 離線 regression（CI-safe）

這些是不使用真實 providers 的「real pipeline」regressions：

- Gateway tool calling（mock OpenAI、real gateway + agent loop）：`src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway wizard（WS `wizard.start`/`wizard.next`，寫入 config + 強制 auth）：`src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## Agent 可靠性 evals（skills）

我們已經有一些 CI-safe tests，行為類似「agent reliability evals」：

- 透過真正 Gateway + agent loop 的 mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 和 config effects 的 end-to-end wizard flows（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請參閱 [Skills](/zh-TW/tools/skills)）：

- **Decisioning：** 當 prompt 中列出 skills 時，agent 是否選擇正確的 skill（或避開不相關的 skill）？
- **Compliance：** agent 是否在使用前讀取 `SKILL.md`，並遵循必要的 steps/args？
- **Workflow contracts：** 斷言 tool order、session history carryover 和 sandbox boundaries 的 multi-turn scenarios。

未來的 evals 應先保持確定性：

- 使用 mock providers 的 scenario runner，用來斷言 tool calls + order、skill file reads 和 session wiring。
- 一小組聚焦於 skill 的 scenarios（use vs avoid、gating、prompt injection）。
- Optional live evals（opt-in、env-gated）只在 CI-safe suite 建立後再加入。

## Contract tests（Plugin 和 channel shape）

Contract tests 會驗證每個已註冊的 Plugin 和 channel 都符合其
interface contract。它們會迭代所有已探索到的 Plugins，並執行一組
shape 和 behavior assertions。預設的 `pnpm test` unit lane 會刻意
略過這些 shared seam 和 smoke files；當你碰到 shared channel 或 provider surfaces 時，
請明確執行 contract commands。

### Commands

- 全部 contracts：`pnpm test:contracts`
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

- 變更 plugin-sdk exports 或 subpaths 之後
- 新增或修改 channel 或 provider Plugin 之後
- 重構 Plugin registration 或 discovery 之後

Contract tests 會在 CI 中執行，且不需要真正的 API keys。

## 新增 regressions（guidance）

當你修復在 live 中發現的 provider/model 問題時：

- 盡可能新增 CI-safe regression（mock/stub provider，或 capture 確切的 request-shape transformation）
- 如果它本質上只能 live-only（rate limits、auth policies），讓 live test 保持 narrow，並透過 env vars opt-in
- 優先鎖定能捕捉該 bug 的最小 layer：
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 或 CI-safe gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class 衍生一個 sampled target，接著斷言 traversal-segment exec ids 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增新的 `includeInPlan` SecretRef target family，請更新該測試中的 `classifyTargetClass`。該測試會刻意在 unclassified target ids 上失敗，因此新 classes 無法被靜默略過。

## 相關

- [Testing live](/zh-TW/help/testing-live)
- [Testing updates and plugins](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
