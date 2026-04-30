---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/提供者錯誤新增回歸測試
    - 偵錯 Gateway + 代理行為
summary: 測試工具套件：unit/e2e/live 套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-04-30T18:38:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三組 Vitest 測試套件（單元/整合、e2e、live），以及少量 Docker 執行器。這份文件是「我們如何測試」指南：

- 每個套件涵蓋的範圍（以及刻意 _不_ 涵蓋的範圍）。
- 常見工作流程要執行哪些命令（本機、推送前、除錯）。
- live 測試如何探索認證資料並選取模型/提供者。
- 如何為真實世界的模型/提供者問題新增迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、live 傳輸通道）**已另行記錄：

- [QA 總覽](/zh-TW/concepts/qa-e2e-automation) — 架構、命令介面、情境撰寫。
- [Matrix QA](/zh-TW/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的參考。
- [QA channel](/zh-TW/channels/qa-channel) — 由 repo 支援的情境所使用的合成傳輸 Plugin。

本頁涵蓋一般測試套件與 Docker/Parallels 執行器的執行方式。下方的 QA 專用執行器章節（[QA 專用執行器](#qa-specific-runners)）列出具體的 `qa` 呼叫方式，並指回上述參考。
</Note>

## 快速開始

大多數時候：

- 完整閘門（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足機器上的較快本機完整套件執行：`pnpm test:max`
- 直接 Vitest 監看迴圈：`pnpm test:watch`
- 直接檔案目標現在也會路由擴充功能/通道路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在迭代單一失敗時，優先使用目標式執行。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你變更測試或想要額外信心時：

- 覆蓋率閘門：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

當除錯真實提供者/模型時（需要真實認證資料）：

- Live 套件（模型 + Gateway 工具/影像探測）：`pnpm test:live`
- 安靜地鎖定一個 live 檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型掃描：`pnpm test:docker:live-models`
  - 每個選取的模型現在會執行一個文字回合，加上一個小型檔案讀取風格探測。
    中繼資料宣告支援 `image` 輸入的模型也會執行一個小型影像回合。
    在隔離提供者失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋：每日 `OpenClaw Scheduled Live And E2E Checks` 與手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用的 live/E2E workflow，其中包含依提供者分片的獨立 Docker live 模型矩陣 jobs。
  - 若要進行聚焦的 CI 重新執行，請 dispatch `OpenClaw Live And E2E Checks (Reusable)`，並設定 `include_live_suites: true` 與 `live_models_only: true`。
  - 將新的高訊號提供者 secret 新增到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其排程/發行呼叫端。
- 原生 Codex 綁定聊天 smoke：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker live 通道，使用 `/codex bind` 綁定合成 Slack DM，執行 `/codex fast` 與
    `/codex permissions`，然後驗證純文字回覆與影像附件會經由原生 Plugin 綁定路由，而不是 ACP。
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`
  - 透過 Plugin 擁有的 Codex app-server harness 執行 Gateway agent 回合，驗證 `/codex status` 與 `/codex models`，並預設執行影像、cron MCP、子 agent 與 Guardian 探測。隔離其他 Codex app-server 失敗時，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用子 agent 探測。若要聚焦檢查子 agent，請停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則這會在子 agent 探測後結束。
- Crestodian rescue 命令 smoke：`pnpm test:live:crestodian-rescue-channel`
  - 針對訊息通道 rescue 命令介面的選擇性雙重保險檢查。它會執行 `/crestodian status`、佇列一個持久模型變更、回覆 `/crestodian yes`，並驗證稽核/設定寫入路徑。
- Crestodian planner Docker smoke：`pnpm test:docker:crestodian-planner`
  - 在無設定的容器中執行 Crestodian，並在 `PATH` 上放置假的 Claude CLI，驗證 fuzzy planner fallback 會轉譯成已稽核的型別化設定寫入。
- Crestodian first-run Docker smoke：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw 狀態目錄開始，將裸 `openclaw` 路由至
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入，驗證設定，並驗證稽核項目。相同的 Ring 0 設定路徑也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 涵蓋。
- Moonshot/Kimi 成本 smoke：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對 `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存標準化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先透過下方描述的 allowlist env vars 縮小 live 測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA-lab 真實度時，這些命令會與主要測試套件並列：

CI 會在專用 workflows 中執行 QA Lab。`Parity gate` 會在相符 PR 與手動 dispatch 時使用 mock providers 執行。`QA-Lab - All Lanes` 會每晚在 `main` 上執行，也可手動 dispatch，並將 mock parity gate、live Matrix 通道、Convex 管理的 live Telegram 通道，以及 Convex 管理的 live Discord 通道作為平行 jobs。排程 QA 與發行檢查會明確傳遞 Matrix `--profile fast`，而 Matrix CLI 與手動 workflow input 的預設值維持
`all`；手動 dispatch 可將 `all` 分片成 `transport`、`media`、`e2ee-smoke`、
`e2ee-deep` 與 `e2ee-cli` jobs。`OpenClaw Release Checks` 會在發行核准前執行 parity 加上 fast Matrix 與 Telegram 通道，並使用
`mock-openai/gpt-5.5` 進行發行傳輸檢查，讓它們保持可決定性並避免一般提供者 Plugin 啟動。這些 live 傳輸 Gateway 會停用記憶體搜尋；記憶體行為仍由 QA parity 套件涵蓋。

完整發行 live media 分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 與 `ffprobe`。Docker live 模型/backend 分片使用共用的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像檔，該映像檔會為每個選取 commit 建置一次，之後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在 host 上執行由 repo 支援的 QA 情境。
  - 預設會使用隔離的 Gateway workers 平行執行多個選取情境。`qa-channel` 預設 concurrency 為 4（受選取情境數量限制）。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 執行較舊的序列通道。
  - 任一情境失敗時會以非零狀態結束。當你想要產物但不想要失敗退出碼時，使用 `--allow-failures`。
  - 支援提供者模式 `live-frontier`、`mock-openai` 與 `aimock`。
    `aimock` 會啟動本機 AIMock 支援的提供者伺服器，用於實驗性 fixture 與 protocol-mock 覆蓋，而不取代情境感知的
    `mock-openai` 通道。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 Gateway 啟動 bench 加上一小組 mock QA Lab 情境套件
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），並在 `.artifacts/gateway-cpu-scenarios/` 下寫入合併的 CPU 觀察摘要。
  - 預設只標記持續性高 CPU 觀察（`--cpu-core-warn` 加上 `--hot-wall-warn-ms`），因此短暫啟動突增會被記錄為指標，而不會看起來像數分鐘 Gateway 滿載迴歸。
  - 使用已建置的 `dist` 產物；當 checkout 尚未有新鮮 runtime 輸出時，請先執行 build。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中執行相同 QA 套件。
  - 保持與 host 上 `qa suite` 相同的情境選取行為。
  - 重用與 `qa suite` 相同的提供者/模型選取 flags。
  - Live 執行會轉送對 guest 來說實用的支援 QA auth inputs：
    env 型提供者 keys、QA live provider config path，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須保持在 repo root 下，讓 guest 能透過已掛載 workspace 寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA report + summary 加上 Multipass logs。
- `pnpm qa:lab:up`
  - 啟動 Docker 支援的 QA 站台，用於 operator 風格 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball，在 Docker 中全域安裝，執行非互動式 OpenAI API key onboarding，預設設定 Telegram，驗證啟用 Plugin 會依需求安裝 runtime dependencies，執行 doctor，並針對 mocked OpenAI endpoint 執行一個本機 agent 回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的 packaged-install 通道。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式 runtime context transcripts 執行可決定性的 built-app Docker smoke。它會驗證隱藏 OpenClaw runtime context 會作為非顯示 custom message 持久化，而不是洩漏到可見 user turn，然後植入受影響的損壞 session JSONL，並驗證
    `openclaw doctor --fix` 會將其改寫到 active branch 並建立備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw package candidate，執行 installed-package onboarding，透過已安裝 CLI 設定 Telegram，接著重用 live Telegram QA 通道，並將該已安裝 package 作為 SUT Gateway。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，可測試已解析的本機 tarball，而不是從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env credentials 或 Convex credential source。對於 CI/發行自動化，設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 與 role secret。如果
    `OPENCLAW_QA_CONVEX_SITE_URL` 與 Convex role secret 存在於 CI 中，
    Docker wrapper 會自動選取 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此通道覆寫共用的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 將此通道公開為手動 maintainer workflow
    `NPM Telegram Beta E2E`。它不會在 merge 時執行。該 workflow 使用
    `qa-live-shared` environment 與 Convex CI credential leases。
- GitHub Actions 也公開 `Package Acceptance`，用於針對一個 candidate package 進行旁路產品證明。它接受受信任 ref、已發布 npm spec、HTTPS tarball URL 加上 SHA-256，或來自另一個 run 的 tarball artifact，將標準化的 `openclaw-current.tgz` 上傳為 `package-under-test`，然後使用 smoke、package、product、full 或 custom 通道 profiles 執行既有 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，可針對相同的 `package-under-test` artifact 執行 Telegram QA workflow。
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

- Artifact 證明會從另一個 Actions 執行下載 tarball Artifact：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中封裝並安裝目前的 OpenClaw 建置，啟動已設定 OpenAI 的 Gateway，然後透過設定編輯啟用內建通道/Plugin。
  - 驗證設定探索會讓未設定的 Plugin 執行階段相依性保持不存在，第一次設定後的 Gateway 或 doctor 執行會按需安裝每個內建 Plugin 的執行階段相依性，而第二次重新啟動不會重新安裝已啟用的相依性。
  - 也會安裝已知較舊的 npm 基準版本，在執行 `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證候選版本的更新後 doctor 會修復內建通道執行階段相依性，而不需要測試框架端的 postinstall 修復。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 執行原生封裝安裝更新 smoke。每個選定的平台會先安裝要求的基準套件，然後在同一個 guest 中執行已安裝的 `openclaw update` 命令，並驗證已安裝版本、更新狀態、Gateway 就緒狀態，以及一個本機代理回合。
  - 在針對單一 guest 反覆測試時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得摘要 Artifact 路徑和每條 lane 狀態。
  - OpenAI lane 預設使用 `openai/gpt-5.5` 作為即時代理回合證明。刻意驗證另一個 OpenAI 模型時，傳入 `--model <provider/model>` 或設定 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 將長時間本機執行包在主機逾時中，避免 Parallels 傳輸停滯耗盡剩餘測試時段：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 腳本會在 `/tmp/openclaw-parallels-npm-update.*` 下寫入巢狀 lane 記錄。先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`，再判定外層 wrapper 已停住。
  - Windows 更新在冷 guest 上可能會花 10 到 15 分鐘執行更新後 doctor/執行階段相依性修復；只要巢狀 npm 偵錯記錄仍在前進，這仍是健康狀態。
  - 不要將這個聚合 wrapper 與個別 Parallels macOS、Windows 或 Linux smoke lane 並行執行。它們共用 VM 狀態，可能在 snapshot 還原、套件服務或 guest Gateway 狀態上發生衝突。
  - 更新後證明會執行一般內建 Plugin 介面，因為語音、影像生成和媒體理解等能力 facade 會透過內建執行階段 API 載入，即使代理回合本身只檢查簡單文字回應。

- `pnpm openclaw qa aimock`
  - 僅啟動本機 AIMock provider 伺服器，用於直接 protocol smoke 測試。
- `pnpm openclaw qa matrix`
  - 針對一次性 Docker 後端的 Tuwunel homeserver 執行 Matrix 即時 QA lane。僅限 source checkout — 封裝安裝不會隨附 `qa-lab`。
  - 完整 CLI、profile/scenario 目錄、環境變數與 Artifact 版面配置：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自環境的 driver 和 SUT bot token，針對真實私人群組執行 Telegram 即時 QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群組 ID 必須是數值型 Telegram chat ID。
  - 支援 `--credential-source convex` 以使用共用集區憑證。預設使用 env 模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選用集區 lease。
  - 任何 scenario 失敗時會以非零狀態結束。當你想取得 Artifact 而不想要失敗結束碼時，使用 `--allow-failures`。
  - 需要同一個私人群組中的兩個不同 bot，且 SUT bot 必須公開 Telegram 使用者名稱。
  - 為了穩定的 bot 對 bot 觀察，請在 `@BotFather` 中為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 可以觀察群組 bot 流量。
  - 會在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA 報告、摘要和 observed-messages Artifact。回覆 scenarios 包含從 driver 傳送要求到觀察到 SUT 回覆的 RTT。

即時傳輸 lane 共用一個標準合約，讓新的傳輸不會偏移；每個 lane 的涵蓋矩陣位於 [QA 概觀 → 即時傳輸涵蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的合成套件，不屬於該矩陣。

### 透過 Convex 共用 Telegram 憑證 (v1)

為 `openclaw qa telegram` 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex 後端集區取得獨佔 lease，在 lane 執行期間對該 lease 傳送 Heartbeat，並在關閉時釋放 lease。

參考 Convex 專案 scaffold：

- `qa/convex-credential-broker/`

必要環境變數：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選角色的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- 憑證角色選擇：
  - CLI：`--credential-role maintainer|ci`
  - Env 預設值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中預設為 `ci`，否則為 `maintainer`）

選用環境變數：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用 trace ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許 local-only 開發使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

Maintainer 管理命令（集區新增/移除/列出）特別需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供 maintainer 使用的 CLI helper：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時執行前使用 `doctor` 檢查 Convex site URL、broker secret、endpoint prefix、HTTP 逾時和 admin/list 可達性，且不列印 secret 值。在腳本和 CI 工具中使用 `--json` 取得機器可讀輸出。

預設 endpoint 合約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Exhausted/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

Telegram kind 的 payload 形狀：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數值型 Telegram chat ID 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證這個形狀，並拒絕格式錯誤的 payload。

### 將通道加入 QA

新通道 adapter 的架構和 scenario-helper 名稱位於 [QA 概觀 → 新增通道](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低標準：在共用 `qa-lab` host seam 上實作 transport runner，在 Plugin manifest 中宣告 `qaRunners`，掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫 scenario。

## 測試套件（何處執行什麼）

將套件視為「真實度逐步提高」（同時 flakiness/成本也逐步提高）：

### Unit / integration（預設）

- 命令：`pnpm test`
- 設定：未鎖定目標的執行會使用 `vitest.full-*.config.ts` shard 集合，並可能將多專案 shard 展開為每個專案的設定，以便平行排程
- 檔案：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的 core/unit inventory；UI unit 測試在專用的 `unit-ui` shard 中執行
- 範圍：
  - 純 unit 測試
  - 程序內 integration 測試（Gateway auth、routing、tooling、parsing、config）
  - 已知 bug 的決定性 regression
- 預期：
  - 在 CI 中執行
  - 不需要真實 key
  - 應該快速且穩定
  - Resolver 和公開介面 loader 測試必須使用產生的小型 Plugin fixture 證明廣泛的 `api.js` 和 `runtime-api.js` fallback 行為，而不是使用真實內建 Plugin source API。真實 Plugin API 載入屬於 Plugin 擁有的 contract/integration 套件。

<AccordionGroup>
  <Accordion title="專案、shard 和 scoped lane">

    - 未指定目標的 `pnpm test` 會執行十二個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是單一巨大的原生根專案程序。這會降低高負載機器上的尖峰 RSS，並避免 auto-reply/extension 工作讓不相關的測試套件挨餓。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片的監看迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過作用域車道處理明確的檔案/目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免付出完整根專案啟動成本。
    - `pnpm test:changed` 預設會把變更的 git 路徑展開成便宜的作用域車道：直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖相依項。除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`，否則 config/setup/package 編輯不會廣泛執行測試。
    - `pnpm check:changed` 是窄範圍工作的標準智慧本機檢查閘門。它會將 diff 分類為 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然後執行相符的 typecheck、lint 與 guard 指令。它不會執行 Vitest 測試；測試證明請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅 release metadata 的版本升級會執行目標版本/config/root-dependency 檢查，並有 guard 拒絕頂層 version 欄位以外的 package 變更。
    - Live Docker ACP harness 編輯會執行聚焦檢查：live Docker auth scripts 的 shell 語法，以及 live Docker scheduler dry-run。只有當 diff 限於 `scripts["test:docker:live-*"]` 時，才會包含 `package.json` 變更；dependency、export、version 和其他 package-surface 編輯仍會使用較廣泛的 guard。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純工具區域的輕匯入單元測試會走 `unit-fast` 車道，該車道會略過 `test/setup-openclaw-runtime.ts`；有狀態/執行階段較重的檔案則留在現有車道。
    - 選定的 `plugin-sdk` 和 `commands` helper 原始檔也會把 changed-mode 執行對應到那些輕量車道中的明確同層測試，因此 helper 編輯可避免重新執行該目錄完整的重型套件。
    - `auto-reply` 有專用桶，分別處理頂層 core helpers、頂層 `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹。CI 會進一步把 reply 子樹拆成 agent-runner、dispatch 和 commands/state-routing 分片，因此單一匯入較重的桶不會擁有完整的 Node 尾端。
    - 一般 PR/main CI 會刻意略過 extension 批次掃描和僅 release 使用的 `agentic-plugins` 分片。Full Release Validation 會為 release candidates 派發獨立的 `Plugin Prerelease` 子工作流程，以涵蓋這些 plugin/extension-heavy 套件。

  </Accordion>

  <Accordion title="嵌入式執行器覆蓋範圍">

    - 當你變更 message-tool 探索輸入或 Compaction 執行階段
      context 時，請保留兩個層級的覆蓋範圍。
    - 為純路由和正規化邊界新增聚焦的 helper 回歸測試。
    - 保持嵌入式執行器整合套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證作用域 id 和 Compaction 行為仍會流經真實的
      `run.ts` / `compact.ts` 路徑；只有 helper 的測試無法充分替代那些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool 和隔離預設值">

    - 基礎 Vitest 設定預設為 `threads`。
    - 共用 Vitest 設定固定 `isolate: false`，並在根專案、e2e 和 live config 中使用
      非隔離執行器。
    - 根 UI 車道保留其 `jsdom` 設定和 optimizer，但也在共用的非隔離執行器上執行。
    - 每個 `pnpm test` 分片都會從共用 Vitest 設定繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子 Node
      程序加入 `--no-maglev`，以降低大型本機執行期間的 V8 編譯擾動。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與原生 V8
      行為比較。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構車道。
    - pre-commit hook 只處理格式化。它會重新暫存已格式化的檔案，
      不會執行 lint、typecheck 或測試。
    - 當你需要智慧本機檢查閘門時，請在 handoff 或 push 前明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過便宜的作用域車道處理。只有當 agent
      判斷 harness、config、package 或 contract 編輯確實需要更廣的
      Vitest 覆蓋範圍時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行為，只是 worker 上限較高。
    - 本機 worker 自動縮放刻意保守，並在主機負載平均值已經偏高時退讓，
      因此多個並行 Vitest 執行預設造成的影響較小。
    - 基礎 Vitest 設定會將 projects/config 檔案標記為
      `forceRerunTriggers`，因此測試
      wiring 變更時，changed-mode 重新執行仍保持正確。
    - 此設定會在支援的主機上保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 啟用；
      如果你想為直接 profiling 使用一個明確的快取位置，請設定
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="效能除錯">

    - `pnpm test:perf:imports` 會啟用 Vitest 匯入耗時報告，以及
      import-breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling 視圖限制在
      自 `origin/main` 以來變更的檔案。
    - 分片計時資料會寫入 `.artifacts/vitest-shard-timings.json`。
      整個 config 執行會使用 config 路徑作為 key；include-pattern CI
      分片會附加分片名稱，讓過濾後的分片可被分開追蹤。
    - 當某個熱點測試仍把大部分時間花在啟動匯入時，
      請把重型相依項保留在狹窄的本機 `*.runtime.ts` 邊界後方，並直接
      mock 該邊界，而不是為了將 runtime helpers 傳入 `vi.mock(...)`
      而深度匯入它們。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對該已提交
      diff，比較已路由的 `test:changed` 與原生根專案路徑，並列印 wall time
      以及 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 和根 Vitest config 路由變更檔案清單，
      來對目前 dirty tree 做 benchmark。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite 啟動和 transform 開銷寫入主執行緒 CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用檔案平行化的情況下，
      為單元套件寫入 runner CPU+heap profile。

  </Accordion>
</AccordionGroup>

### 穩定性（gateway）

- 指令：`pnpm test:stability:gateway`
- 設定：`vitest.gateway.config.ts`，強制使用單一 worker
- 範圍：
  - 預設啟用診斷，啟動真實的 loopback Gateway
  - 透過診斷事件路徑驅動合成 gateway message、memory 和 large-payload churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 覆蓋診斷穩定性 bundle persistence helpers
  - 斷言 recorder 保持有界、合成 RSS samples 維持在壓力預算以下，且每個 session queue depth 都會排空回到零
- 預期：
  - CI-safe 且無需 key
  - 用於 stability-regression 後續處理的窄車道，不是完整 Gateway 套件的替代品

### E2E（gateway smoke）

- 指令：`pnpm test:e2e`
- 設定：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的 bundled-plugin E2E tests
- 執行階段預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用自適應 workers（CI：最多 2，本機：預設 1）。
  - 預設以 silent mode 執行，以降低 console I/O 開銷。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 可強制 worker 數量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 可重新啟用詳細 console 輸出。
- 範圍：
  - 多實例 gateway 端到端行為
  - WebSocket/HTTP surfaces、node pairing，以及較重的 networking
- 預期：
  - 在 CI 中執行（當 pipeline 啟用時）
  - 不需要真實 keys
  - 比單元測試有更多 moving parts（可能較慢）

### E2E：OpenShell 後端 smoke

- 指令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 透過 Docker 在主機上啟動隔離的 OpenShell gateway
  - 從臨時本機 Dockerfile 建立 sandbox
  - 透過真實的 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell 後端
  - 透過 sandbox fs bridge 驗證 remote-canonical 檔案系統行為
- 預期：
  - 僅 opt-in；不屬於預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` CLI 以及可運作的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀測試 gateway 和 sandbox
- 實用覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1` 可在手動執行較廣 e2e 套件時啟用測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 可指向非預設 CLI binary 或 wrapper script

### Live（真實 providers + 真實 models）

- 指令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的 bundled-plugin live tests
- 預設值：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個 provider/model 在 _今天_ 使用真實 credentials 是否真的可運作？」
  - 捕捉 provider format changes、tool-calling quirks、auth issues，以及 rate limit behavior
- 預期：
  - 按設計並非 CI-stable（真實網路、真實 provider policies、quotas、outages）
  - 會花錢 / 使用 rate limits
  - 偏好執行較窄的子集，而不是「全部」
- Live 執行會 source `~/.profile` 以取得缺少的 API keys。
- 預設情況下，live 執行仍會隔離 `HOME`，並把 config/auth material 複製到暫時測試 home，因此單元 fixtures 無法改動你真實的 `~/.openclaw`。
- 只有當你刻意需要 live tests 使用真實 home directory 時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設使用較安靜的模式：它保留 `[live] ...` progress output，但會抑制額外的 `~/.profile` notice，並靜音 gateway bootstrap logs/Bonjour chatter。若你想取回完整 startup logs，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key rotation（provider-specific）：以逗號/分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 做 per-live override；測試會在 rate limit responses 時重試。
- Progress/heartbeat 輸出：
  - Live 套件現在會把 progress lines 發到 stderr，因此即使 Vitest console capture 很安靜，長時間 provider calls 也會可見地保持 active。
  - `vitest.live.config.ts` 會停用 Vitest console interception，因此 provider/gateway progress lines 會在 live 執行期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整 direct-model heartbeats。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 gateway/probe heartbeats。

## 我應該執行哪個套件？

使用此決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你變更了很多內容，也執行 `pnpm test:coverage`）
- 觸及 gateway 網路 / WS 通訊協定 / 配對：加上 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ 供應商特定失敗 / 工具呼叫：執行範圍縮小的 `pnpm test:live`

## 即時（觸及網路）測試

如需即時模型矩陣、CLI 後端冒煙測試、ACP 冒煙測試、Codex app-server
測試框架，以及所有媒體供應商即時測試（Deepgram、BytePlus、ComfyUI、影像、
音樂、影片、媒體測試框架）— 以及即時執行的憑證處理 — 請參閱
[測試 — 即時套件](/zh-TW/help/testing-live)。

## Docker 執行器（選用的「可在 Linux 運作」檢查）

這些 Docker 執行器分成兩類：

- 即時模型執行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker 映像中執行其對應 profile-key 的即時檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），掛載你的本機設定目錄與工作區（若有掛載，並會載入 `~/.profile`）。對應的本機進入點是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 即時執行器預設使用較小的冒煙上限，讓完整 Docker 掃描維持可行：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明確想要更大的完整掃描時，
  才覆寫這些 env vars。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置即時 Docker 映像一次，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 封裝成 npm tarball 一次，接著建置/重用兩個 `scripts/e2e/Dockerfile` 映像。裸映像只是用於安裝/更新/Plugin 相依性 lane 的 Node/Git 執行器；這些 lane 會掛載預先建置的 tarball。功能映像會將同一個 tarball 安裝到 `/app`，供已建置 app 的功能 lane 使用。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的計畫。彙總流程使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序 slot，而資源上限會避免繁重的即時、npm-install 和多服務 lane 同時全部啟動。如果單一 lane 比目前上限更重，排程器仍可在 pool 為空時啟動它，並讓它單獨執行到容量再次可用。預設為 10 個 slot、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。執行器預設會執行 Docker 前置檢查、移除過期的 OpenClaw E2E 容器、每 30 秒列印狀態、將成功 lane 的耗時儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行時使用這些耗時先啟動較長的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印加權 lane manifest，而不建置或執行 Docker；或使用 `node scripts/test-docker-all.mjs --plan-json` 列印選定 lane、套件/映像需求與憑證的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生的套件閘門，用來驗證「這個可安裝的 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個候選套件，將它上傳為 `package-under-test`，然後對該精確 tarball 執行可重用的 Docker E2E lane，而不是重新封裝選定的 ref。`workflow_ref` 會選擇受信任的 workflow/測試框架 scripts，而 `package_ref` 會在 `source=ref` 時選擇要封裝的來源 commit/branch/tag；這讓目前的驗收邏輯能驗證較舊的受信任 commit。Profile 依涵蓋廣度排序：`smoke` 是快速安裝/channel/agent 加上 gateway/config，`package` 是套件/更新/Plugin 合約加上 keyless upgrade-survivor fixture，並且是大多數 Parallels 套件/更新涵蓋範圍的預設原生替代項，`product` 會加入 MCP channels、cron/subagent 清理、OpenAI web search 和 OpenWebUI，而 `full` 會以 OpenWebUI 執行 release-path Docker 區塊。發布驗證會執行自訂套件差異（`bundled-channel-deps-compat plugins-offline`）加上 Telegram 套件 QA，因為 release-path Docker 區塊已涵蓋重疊的套件/更新/Plugin lane。從 artifact 產生的目標 GitHub Docker 重新執行命令，會在可用時包含先前的套件 artifact 和已準備的映像輸入，因此失敗的 lane 可避免重建套件與映像。
- 建置與發布檢查會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。該防護會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪靜態建置圖，並在命令分派前的啟動流程匯入 Commander、prompt UI、undici 或 logging 等套件相依性時失敗；它也會讓 bundled gateway run chunk 維持在預算內，並拒絕已知 cold gateway 路徑的靜態匯入。封裝後的 CLI 冒煙測試也涵蓋 root help、onboard help、doctor help、status、config schema，以及 model-list 命令。
- Package Acceptance 舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止版本以前，測試框架只容許已出貨套件的中繼資料缺口：省略的私有 QA inventory 項目、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔、缺少持久化的 `update.channel`、舊版 Plugin install-record 位置、缺少 marketplace install-record 持久化，以及 `plugins update` 期間的 config metadata 遷移。對 `2026.4.25` 之後的套件，這些路徑都是嚴格失敗。
- 容器冒煙執行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 會啟動一個或多個真實容器，並驗證較高層級的整合路徑。

即時模型 Docker 執行器也只會 bind-mount 所需的 CLI auth home（或在執行未縮小範圍時掛載所有支援項目），然後在執行前將它們複製到容器 home，讓外部 CLI OAuth 能重新整理權杖，而不會變更主機 auth store：

- 直接模型：`pnpm test:docker:live-models`（指令碼：`scripts/test-live-models-docker.sh`）
- ACP 綁定煙霧測試：`pnpm test:docker:live-acp-bind`（指令碼：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 與 `pnpm test:docker:live-acp-bind:opencode` 嚴格涵蓋 Droid/OpenCode）
- CLI 後端煙霧測試：`pnpm test:docker:live-cli-backend`（指令碼：`scripts/test-live-cli-backend-docker.sh`）
- Codex 應用程式伺服器測試架煙霧測試：`pnpm test:docker:live-codex-harness`（指令碼：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開發代理：`pnpm test:docker:live-gateway`（指令碼：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性煙霧測試：`pnpm qa:otel:smoke` 是私有 QA 原始碼簽出通道。它刻意不屬於套件 Docker 發布通道，因為 npm tarball 省略了 QA Lab。
- Open WebUI 即時煙霧測試：`pnpm test:docker:openwebui`（指令碼：`scripts/e2e/openwebui-docker.sh`）
- 入門精靈（TTY，完整鷹架）：`pnpm test:docker:onboard`（指令碼：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 入門/頻道/代理煙霧測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball，透過 env-ref 入門流程設定 OpenAI，並預設設定 Telegram，驗證 doctor 修復已啟用的 Plugin 執行階段依賴項，並執行一次模擬的 OpenAI 代理回合。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳過主機重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切換頻道。
- 更新頻道切換煙霧測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證持久化頻道與 Plugin 更新後工作正常，然後切回套件 `stable` 並檢查更新狀態。
- 升級存活煙霧測試：`pnpm test:docker:upgrade-survivor` 會將已封裝的 OpenClaw tarball 安裝到髒污的舊使用者 fixture 上，其中包含代理、頻道設定、Plugin 允許清單、過時的 Plugin 執行階段依賴狀態，以及既有工作區/工作階段檔案。它會在沒有即時提供者或頻道金鑰的情況下執行套件更新與非互動式 doctor，然後啟動一個 loopback Gateway，並檢查設定/狀態保留以及啟動/狀態預算。
- 工作階段執行階段內容煙霧測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏執行階段內容逐字稿持久化，以及 doctor 對受影響的重複提示重寫分支的修復。
- Bun 全域安裝煙霧測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會封裝目前樹狀內容，在隔離的 home 中使用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 回傳內建影像提供者，而不是卡住。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳過主機建置，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- 安裝器 Docker 煙霧測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm 容器之間共用一個 npm 快取。更新煙霧測試預設使用 npm `latest` 作為穩定基準，再升級到候選 tarball。在本機使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上使用 Install Smoke 工作流程的 `update_baseline_version` 輸入覆寫。非 root 安裝器檢查會保留隔離的 npm 快取，因此 root 擁有的快取項目不會掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`，以便在本機重跑時重用 root/update/direct-npm 快取。
- Install Smoke CI 會使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳過重複的 direct-npm 全域更新；需要直接 `npm install -g` 涵蓋時，請在本機不帶該 env 執行指令碼。
- 代理刪除共用工作區 CLI 煙霧測試：`pnpm test:docker:agents-delete-shared-workspace`（指令碼：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置根 Dockerfile 映像，在隔離的容器 home 中植入兩個代理與一個工作區，執行 `agents delete --json`，並驗證有效 JSON 與保留工作區行為。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke 映像。
- Gateway 網路（兩個容器，WS 驗證 + 健康狀態）：`pnpm test:docker:gateway-network`（指令碼：`scripts/e2e/gateway-network-docker.sh`）
- 瀏覽器 CDP 快照煙霧測試：`pnpm test:docker:browser-cdp-snapshot`（指令碼：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置原始碼 E2E 映像加上一層 Chromium，使用原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP 角色快照涵蓋連結 URL、游標提升的可點擊項目、iframe 參照與框架中繼資料。
- OpenAI Responses `web_search` 最小推理迴歸：`pnpm test:docker:openai-web-search-minimal`（指令碼：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行模擬的 OpenAI 伺服器，驗證 `web_search` 將 `reasoning.effort` 從 `minimal` 提升到 `low`，然後強制提供者結構描述拒絕，並檢查原始詳細資訊出現在 Gateway 記錄中。
- MCP 頻道橋接（已植入的 Gateway + stdio 橋接 + 原始 Claude 通知框架煙霧測試）：`pnpm test:docker:mcp-channels`（指令碼：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真實 stdio MCP 伺服器 + 內嵌 Pi 設定檔允許/拒絕煙霧測試）：`pnpm test:docker:pi-bundle-mcp-tools`（指令碼：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/子代理 MCP 清理（真實 Gateway + 在隔離 Cron 與一次性子代理執行後拆除 stdio MCP 子程序）：`pnpm test:docker:cron-mcp-cleanup`（指令碼：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugin（安裝煙霧測試、ClawHub kitchen-sink 安裝/解除安裝、市集更新，以及 Claude-bundle 啟用/檢查）：`pnpm test:docker:plugins`（指令碼：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳過 ClawHub 區塊，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的 kitchen-sink 套件/執行階段組合。若沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用 hermetic 本機 ClawHub fixture 伺服器。
- Plugin 更新未變更煙霧測試：`pnpm test:docker:plugin-update`（指令碼：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 設定重新載入中繼資料煙霧測試：`pnpm test:docker:config-reload`（指令碼：`scripts/e2e/config-reload-source-docker.sh`）
- 內建 Plugin 執行階段依賴項：`pnpm test:docker:bundled-channel-deps` 預設會建置一個小型 Docker 執行器映像，在主機上建置並封裝 OpenClaw 一次，然後將該 tarball 掛載到每個 Linux 安裝情境中。使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 重用映像，在本機新建置後使用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳過主機重建，或使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向既有 tarball。完整 Docker 彙總與發布路徑 bundled-channel 區塊會先預先封裝此 tarball 一次，然後將內建頻道檢查分片到獨立通道，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的個別更新通道。發布區塊會將頻道煙霧測試、更新目標以及設定/執行階段合約拆分為 `bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`；彙總 `bundled-channels` 區塊仍可供手動重跑使用。發布工作流程也會拆分提供者安裝器區塊，以及內建 Plugin 安裝/解除安裝區塊；舊版 `package-update`、`plugins-runtime` 和 `plugins-integrations` 區塊仍保留作為手動重跑的彙總別名。直接執行 bundled 通道時，使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 縮小頻道矩陣，或使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 縮小更新情境。每個情境的 Docker 執行預設為 `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`；多目標更新情境預設為 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`。該通道也會驗證 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 會抑制 doctor/執行階段依賴修復。
- 反覆調整時，可透過停用無關情境來縮小內建 Plugin 執行階段依賴項，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

若要手動預先建置並重用共用功能映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定後，套件專用的映像覆寫（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，如果本機尚未存在，指令碼會拉取它。QR 與安裝器 Docker 測試會保留自己的 Dockerfile，因為它們驗證的是套件/安裝行為，而不是共用已建置應用程式執行階段。

即時模型 Docker 執行器也會以唯讀方式綁定掛載目前的 checkout，並
將其暫存到容器內的暫存工作目錄。這可讓執行階段
映像保持精簡，同時仍能針對你確切的本機原始碼/設定執行 Vitest。
暫存步驟會略過大型的僅限本機快取和應用程式建置輸出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及應用程式本機的 `.build` 或
Gradle 輸出目錄，因此 Docker 即時執行不會花費數分鐘複製
特定機器的成品。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此 Gateway 即時探測不會在
容器內啟動真正的 Telegram/Discord/等頻道 worker。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此在需要縮小或排除該 Docker lane 中的 Gateway
即時覆蓋範圍時，也要傳入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高層級的相容性 smoke：它會啟動一個
啟用 OpenAI 相容 HTTP 端點的 OpenClaw Gateway 容器，
啟動一個針對該 Gateway 的固定版本 Open WebUI 容器，透過
Open WebUI 登入，驗證 `/api/models` 暴露 `openclaw/default`，接著透過 Open WebUI 的 `/api/chat/completions` proxy 傳送一個
真正的聊天請求。
第一次執行可能會明顯較慢，因為 Docker 可能需要拉取
Open WebUI 映像，而 Open WebUI 可能需要完成自己的冷啟動設定。
這個 lane 需要可用的即時模型 key，而 `OPENCLAW_PROFILE_FILE`
（預設為 `~/.profile`）是在 Docker 化執行中提供它的主要方式。
成功執行會列印一小段 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意設計為確定性的，且不需要
真正的 Telegram、Discord 或 iMessage 帳號。它會啟動一個已植入種子的 Gateway
容器，啟動第二個會產生 `openclaw mcp serve` 的容器，接著
驗證路由後的對話探索、逐字稿讀取、附件中繼資料、
即時事件佇列行為、對外傳送路由，以及透過真正 stdio MCP bridge 傳遞的 Claude 風格頻道 +
權限通知。通知檢查會直接檢查原始 stdio MCP frame，因此該 smoke 驗證的是
bridge 實際發出的內容，而不只是特定 client SDK 恰好暴露的內容。
`test:docker:pi-bundle-mcp-tools` 是確定性的，且不需要即時
模型 key。它會建置 repo Docker 映像，在容器內啟動真正的 stdio MCP probe server，
透過內嵌 Pi bundle
MCP runtime 具現化該 server，執行 tool，接著驗證 `coding` 和 `messaging` 保留
`bundle-mcp` tools，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 會將其篩除。
`test:docker:cron-mcp-cleanup` 是確定性的，且不需要即時模型
key。它會以真正的 stdio MCP probe server 啟動已植入種子的 Gateway，執行
隔離的 cron turn 和 `/subagents spawn` 一次性 child turn，接著驗證
MCP child process 在每次執行後都會退出。

手動 ACP 白話 thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此 script 供迴歸/除錯工作流程使用。ACP thread 路由驗證未來可能再次需要它，因此不要刪除。

實用的 env vars：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）掛載到 `/home/node/.profile`，並在執行測試前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 僅驗證從 `OPENCLAW_PROFILE_FILE` source 的 env vars，使用暫存設定/工作區目錄，且不掛載外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）掛載到 `/home/node/.npm-global`，用於 Docker 內快取 CLI 安裝
- `$HOME` 底下的外部 CLI auth 目錄/檔案會以唯讀方式掛載到 `/host-auth...` 底下，然後在測試開始前複製到 `/home/node/...`
  - 預設目錄：`.minimax`
  - 預設檔案：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 縮小範圍的 provider 執行只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要目錄/檔案
  - 使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或類似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗號清單手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於篩選容器內的 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用於在不需要重新建置的重跑中重用既有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保 creds 來自 profile store（而不是 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇 Gateway 暴露給 Open WebUI smoke 的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI smoke 使用的 nonce 檢查 prompt
- `OPENWEBUI_IMAGE=...` 用於覆寫固定的 Open WebUI 映像 tag

## 文件健全性

文件編輯後執行文件檢查：`pnpm check:docs`。
當你也需要頁面內 heading 檢查時，執行完整的 Mintlify anchor 驗證：`pnpm docs:check-links:anchors`。

## 離線迴歸（CI-safe）

這些是不使用真正 providers 的「真實 pipeline」迴歸：

- Gateway tool calling（mock OpenAI，真正的 gateway + agent loop）：`src/gateway/gateway.test.ts`（case：「透過 gateway agent loop 端對端執行 mock OpenAI tool call」）
- Gateway wizard（WS `wizard.start`/`wizard.next`，寫入 config + 強制 auth）：`src/gateway/gateway.test.ts`（case：「透過 ws 執行 wizard 並寫入 auth token config」）

## Agent 可靠性 evals（skills）

我們已經有一些 CI-safe 測試，行為類似「agent 可靠性 evals」：

- 透過真正的 gateway + agent loop 進行 mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 和 config effects 的端對端 wizard flows（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（參見 [Skills](/zh-TW/tools/skills)）：

- **決策：** 當 prompt 中列出 skills 時，agent 是否選擇正確的 skill（或避開無關的 skill）？
- **遵循：** agent 是否在使用前閱讀 `SKILL.md` 並遵循必要步驟/args？
- **工作流程合約：** 斷言 tool 順序、session history carryover 和 sandbox boundaries 的多輪情境。

未來的 evals 應優先保持確定性：

- 使用 mock providers 的情境 runner，用於斷言 tool calls + 順序、skill 檔案讀取，以及 session wiring。
- 一小組以 skill 為焦點的情境（使用 vs 避免、gating、prompt injection）。
- 選用的即時 evals（opt-in、env-gated）僅在 CI-safe suite 到位後再加入。

## 合約測試（plugin 與 channel 形狀）

合約測試會驗證每個已註冊的 plugin 和 channel 都符合其
interface contract。它們會迭代所有探索到的 plugins，並執行一組
形狀與行為斷言。預設的 `pnpm test` unit lane 會刻意
略過這些共享 seam 和 smoke 檔案；當你觸及共享 channel 或 provider surface 時，
請明確執行合約命令。

### 命令

- 所有合約：`pnpm test:contracts`
- 僅 channel 合約：`pnpm test:contracts:channels`
- 僅 provider 合約：`pnpm test:contracts:plugins`

### Channel 合約

位於 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本 plugin 形狀（id、name、capabilities）
- **setup** - 設定 wizard 合約
- **session-binding** - Session binding 行為
- **outbound-payload** - Message payload 結構
- **inbound** - Inbound message 處理
- **actions** - Channel action handlers
- **threading** - Thread ID 處理
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status 合約

位於 `src/plugins/contracts/*.contract.test.ts`。

- **status** - Channel status probes
- **registry** - Plugin registry 形狀

### Provider 合約

位於 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - Auth flow 合約
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - 設定 wizard

### 何時執行

- 變更 plugin-sdk exports 或 subpaths 後
- 新增或修改 channel 或 provider plugin 後
- 重構 plugin registration 或 discovery 後

合約測試會在 CI 中執行，且不需要真正的 API keys。

## 新增迴歸（指引）

當你修復在即時環境中發現的 provider/model 問題時：

- 盡可能新增 CI-safe 迴歸（mock/stub provider，或擷取確切的 request-shape transformation）
- 如果本質上只能即時測試（rate limits、auth policies），請保持即時測試範圍狹窄，並透過 env vars opt-in
- 優先鎖定能捕捉該 bug 的最小層級：
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 或 CI-safe gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class 衍生一個 sampled target，然後斷言 traversal-segment exec ids 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 新增新的 `includeInPlan` SecretRef target family，請更新該測試中的 `classifyTargetClass`。該測試會刻意在未分類的 target ids 上失敗，因此新的 classes 不會被靜默略過。

## 相關

- [Testing live](/zh-TW/help/testing-live)
- [CI](/zh-TW/ci)
