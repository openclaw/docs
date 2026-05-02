---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/供應商錯誤新增迴歸測試
    - 偵錯 Gateway + 代理程式行為
summary: 測試工具包：單元/e2e/即時套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-05-02T02:53:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 套件（單元/整合、e2e、live）和一小組
Docker 執行器。本文件是「我們如何測試」指南：

- 每個套件涵蓋的範圍（以及刻意_不_涵蓋的範圍）。
- 常見工作流程（本機、推送前、偵錯）應執行哪些命令。
- live 測試如何探索憑證並選擇模型/供應商。
- 如何為真實世界的模型/供應商問題新增迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、live 傳輸通道）**另有文件說明：

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) — 架構、命令介面、情境撰寫。
- [矩陣 QA](/zh-TW/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的參考。
- [QA channel](/zh-TW/channels/qa-channel) — repo 支援情境使用的合成傳輸 Plugin。

本頁涵蓋執行一般測試套件與 Docker/Parallels 執行器。下方的 QA 專用執行器章節（[QA 專用執行器](#qa-specific-runners)）列出具體的 `qa` 呼叫，並指回上述參考。
</Note>

## 快速開始

大多數日子：

- 完整 gate（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足的機器上較快執行本機完整套件：`pnpm test:max`
- 直接 Vitest 監看迴圈：`pnpm test:watch`
- 直接檔案目標現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你在迭代單一失敗時，優先使用目標式執行。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你碰到測試或想要額外信心時：

- 覆蓋率 gate：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

偵錯真實供應商/模型時（需要真實憑證）：

- Live 套件（模型 + Gateway 工具/影像探測）：`pnpm test:live`
- 安靜地鎖定一個 live 檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型掃描：`pnpm test:docker:live-models`
  - 每個選取的模型現在會執行一個文字回合，加上一個小型檔案讀取風格探測。
    中繼資料宣告支援 `image` 輸入的模型，也會執行一個小型影像回合。
    在隔離供應商失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋率：每日 `OpenClaw Scheduled Live And E2E Checks` 和手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用的 live/E2E 工作流程，其中包含依供應商分片的獨立 Docker live 模型矩陣作業。
  - 若要聚焦 CI 重新執行，請分派 `OpenClaw Live And E2E Checks (Reusable)`，
    並設定 `include_live_suites: true` 和 `live_models_only: true`。
  - 將新的高訊號供應商 secrets 加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和它的排程/發行呼叫端。
- 原生 Codex bound-chat 煙霧測試：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker live 通道，使用 `/codex bind` 綁定合成
    Slack DM，演練 `/codex fast` 和
    `/codex permissions`，接著驗證純文字回覆與影像附件會透過原生 Plugin 綁定路由，而不是 ACP。
- Codex app-server harness 煙霧測試：`pnpm test:docker:live-codex-harness`
  - 透過 Plugin 擁有的 Codex app-server harness 執行 Gateway agent 回合，
    驗證 `/codex status` 和 `/codex models`，並預設演練影像、
    cron MCP、sub-agent 與 Guardian 探測。隔離其他 Codex
    app-server 失敗時，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用 sub-agent 探測。若要聚焦 sub-agent 檢查，停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則這會在 sub-agent 探測後結束。
- Crestodian rescue command 煙霧測試：`pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command 介面的選用雙重保險檢查。
    它會演練 `/crestodian status`、佇列一個持久模型變更、回覆 `/crestodian yes`，並驗證稽核/設定寫入路徑。
- Crestodian planner Docker 煙霧測試：`pnpm test:docker:crestodian-planner`
  - 在沒有設定的容器中執行 Crestodian，`PATH` 上有假的 Claude CLI，
    並驗證 fuzzy planner fallback 會轉譯成經稽核的型別化設定寫入。
- Crestodian first-run Docker 煙霧測試：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw 狀態目錄開始，將裸 `openclaw` 路由到
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入，
    驗證設定，並驗證稽核項目。同一個 Ring 0 設定路徑也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 涵蓋。
- Moonshot/Kimi 成本煙霧測試：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對
  `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，請優先透過下方描述的允許清單環境變數縮小 live 測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA-lab 真實度時，這些命令與主要測試套件並列：

CI 會在專用工作流程中執行 QA Lab。`Parity gate` 會在符合條件的 PR 上執行，也可用 mock 供應商手動分派。`QA-Lab - All Lanes` 會每晚在
`main` 上執行，也可從手動分派執行，並以平行作業執行 mock parity gate、live Matrix 通道、Convex 管理的 live Telegram 通道，以及 Convex 管理的 live Discord 通道。排程 QA 和發行檢查會明確傳入 Matrix `--profile fast`，
而 Matrix CLI 與手動工作流程輸入預設仍為
`all`；手動分派可將 `all` 分片成 `transport`、`media`、`e2ee-smoke`、
`e2ee-deep` 和 `e2ee-cli` 作業。`OpenClaw Release Checks` 會在發行核准前執行 parity 加上 fast Matrix 和 Telegram 通道，針對發行傳輸檢查使用
`mock-openai/gpt-5.5`，因此它們保持決定性並避開一般 provider-plugin 啟動。這些 live 傳輸 Gateway 會停用 memory search；memory 行為仍由 QA parity 套件涵蓋。

完整發行 live media 分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 和 `ffprobe`。Docker live model/backend 分片使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像，該映像會針對每個選取的 commit 建置一次，接著以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行 repo 支援的 QA 情境。
  - 預設以隔離的 Gateway worker 平行執行多個選取情境。
    `qa-channel` 預設並行度為 4（受選取情境數量限制）。使用 `--concurrency <count>` 調整 worker 數量，或使用 `--concurrency 1` 取得較舊的序列通道。
  - 任何情境失敗時會以非零狀態結束。若你想取得 artifacts 但不想要失敗結束碼，請使用 `--allow-failures`。
  - 支援供應商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 會啟動本機 AIMock 支援的供應商伺服器，用於實驗性
    fixture 和 protocol-mock 覆蓋率，而不取代情境感知的
    `mock-openai` 通道。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 Gateway 啟動 bench，加上一小組 mock QA Lab 情境包
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），並在 `.artifacts/gateway-cpu-scenarios/` 下寫入合併的 CPU observation 摘要。
  - 預設只標記持續的高 CPU observations（`--cpu-core-warn`
    加上 `--hot-wall-warn-ms`），因此短暫的啟動突增會記錄為指標，
    而不會看起來像持續數分鐘的 Gateway peg 迴歸。
  - 使用建置好的 `dist` artifacts；當 checkout 尚未有新的 runtime 輸出時，請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 內執行相同的 QA 套件。
  - 保留與主機上 `qa suite` 相同的情境選擇行為。
  - 重用與 `qa suite` 相同的供應商/模型選擇旗標。
  - Live 執行會轉送適合 guest 的受支援 QA auth 輸入：
    env 型供應商金鑰、QA live 供應商設定路徑，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須維持在 repo root 下，讓 guest 可透過掛載的 workspace 寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA 報告 + 摘要，以及 Multipass logs。
- `pnpm qa:lab:up`
  - 啟動 Docker 支援的 QA 站台，用於 operator-style QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball，在 Docker 中全域安裝它，執行非互動式 OpenAI API-key onboarding，預設設定 Telegram，驗證封裝的 Plugin runtime 在沒有啟動 dependency repair 的情況下載入，執行 doctor，並針對 mocked OpenAI endpoint 執行一次本機 agent 回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`，以 Discord 執行相同的 packaged-install 通道。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式 runtime context transcript 執行決定性的 built-app Docker 煙霧測試。它會驗證隱藏的 OpenClaw runtime context 會作為非顯示自訂訊息持久化，而不是洩漏到可見的 user turn，接著種下一個受影響的破損 session JSONL，並驗證
    `openclaw doctor --fix` 會以備份將其重寫到作用中的 branch。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw package candidate，執行 installed-package
    onboarding，透過已安裝的 CLI 設定 Telegram，接著以該已安裝套件作為 SUT Gateway 重用 live Telegram QA 通道。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試解析出的本機 tarball，而不是從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env 憑證或 Convex 憑證來源。對於 CI/發行自動化，設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色 secret。若 CI 中存在
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色 secret，
    Docker wrapper 會自動選擇 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此通道覆寫共享的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 將此通道公開為手動 maintainer 工作流程
    `NPM Telegram Beta E2E`。它不會在 merge 時執行。該工作流程使用
    `qa-live-shared` environment 和 Convex CI credential leases。
- GitHub Actions 也公開 `Package Acceptance`，用於針對一個 candidate package 進行 side-run product proof。它接受受信任 ref、已發布 npm spec、
  HTTPS tarball URL 加 SHA-256，或另一個 run 的 tarball artifact，將正規化的
  `openclaw-current.tgz` 上傳為 `package-under-test`，接著使用 smoke、package、product、full 或 custom 通道 profile 執行現有 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，可針對相同的 `package-under-test` artifact 執行 Telegram QA 工作流程。
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

- 成品證明會從另一個 Actions 執行下載 tarball 成品：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中封裝並安裝目前的 OpenClaw 建置，啟動已設定 OpenAI 的 Gateway，然後透過設定編輯啟用內建的頻道/Plugin。
  - 驗證設定探索會讓未設定的可下載 Plugin 保持不存在，第一次設定好的 doctor 修復會明確安裝每個缺少的可下載 Plugin，而第二次重新啟動不會執行隱藏的依賴修復。
  - 也會安裝已知較舊的 npm 基準版本，在執行 `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證候選版本的更新後 doctor 會清理舊版 Plugin 依賴殘留，而不需要測試框架端的 postinstall 修復。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 客體上執行原生封裝安裝更新 smoke。每個選取的平台會先安裝要求的基準套件，接著在同一個客體中執行已安裝的 `openclaw update` 命令，並驗證已安裝版本、更新狀態、gateway 就緒狀態，以及一次本機代理回合。
  - 針對單一客體反覆測試時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得摘要成品路徑與各 lane 狀態。
  - OpenAI lane 預設使用 `openai/gpt-5.5` 作為即時代理回合證明。若要刻意驗證另一個 OpenAI 模型，請傳入 `--model <provider/model>` 或設定 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 將長時間本機執行包在主機逾時中，避免 Parallels 傳輸停滯耗盡剩餘測試時間：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 此腳本會將巢狀 lane 記錄寫入 `/tmp/openclaw-parallels-npm-update.*` 底下。先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`，再假設外層包裝器已停住。
  - Windows 更新在冷客體上可能會花 10 到 15 分鐘進行更新後 doctor 與套件更新工作；只要巢狀 npm 偵錯記錄仍在前進，這仍屬正常。
  - 不要將這個彙總包裝器與個別 Parallels macOS、Windows 或 Linux smoke lane 平行執行。它們共用 VM 狀態，可能在快照還原、套件提供或客體 Gateway 狀態上衝突。
  - 更新後證明會執行一般內建 Plugin 介面，因為語音、圖片生成與媒體理解等 capability facade 會透過內建執行階段 API 載入，即使代理回合本身只檢查簡單文字回應也是如此。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider 伺服器，用於直接協定 smoke 測試。
- `pnpm openclaw qa matrix`
  - 針對一次性 Docker 支援的 Tuwunel homeserver 執行 Matrix 即時 QA lane。僅限原始碼 checkout，封裝安裝不會隨附 `qa-lab`。
  - 完整 CLI、profile/scenario 目錄、env vars 與成品版面配置：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自 env 的 driver 與 SUT Bot token，針對真實私人群組執行 Telegram 即時 QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群組 id 必須是數字 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共用 pooled credentials。預設使用 env 模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選擇使用 pooled leases。
  - 任一 scenario 失敗時會以非零結束。當你想要成品但不想要失敗結束碼時，使用 `--allow-failures`。
  - 需要同一個私人群組中的兩個不同 Bot，且 SUT Bot 需公開 Telegram 使用者名稱。
  - 為了穩定的 Bot 對 Bot 觀察，請在 `@BotFather` 中為兩個 Bot 啟用 Bot 對 Bot 通訊模式，並確認 driver Bot 可以觀察群組 Bot 流量。
  - 會在 `.artifacts/qa-e2e/...` 底下寫入 Telegram QA 報告、摘要與 observed-messages 成品。回覆 scenario 會包含從 driver 傳送請求到觀察到 SUT 回覆的 RTT。

即時傳輸 lane 共用一個標準合約，讓新傳輸不會偏離；各 lane 涵蓋矩陣位於 [QA 概覽 → 即時傳輸涵蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的合成套件，不屬於該矩陣。

### 透過 Convex 共用 Telegram 憑證（v1）

當針對 `openclaw qa telegram` 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex 支援的 pool 取得獨佔 lease，在 lane 執行期間對該 lease 傳送 Heartbeat，並在關閉時釋放 lease。

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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用追蹤 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許 local loopback `http://` Convex URL，僅供本機開發使用。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

維護者管理命令（pool 新增/移除/列出）特別需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

維護者用 CLI helper：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

即時執行前使用 `doctor` 檢查 Convex site URL、broker secrets、endpoint prefix、HTTP timeout，以及 admin/list 可達性，而不列印 secret 值。在腳本與 CI 工具程式中使用 `--json` 取得機器可讀輸出。

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
- `POST /admin/add`（僅維護者 secret）
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove`（僅維護者 secret）
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅維護者 secret）
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Telegram kind 的 payload 形狀：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字 Telegram chat id 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證此形狀，並拒絕格式錯誤的 payload。

### 將頻道加入 QA

新頻道 adapter 的架構與 scenario-helper 名稱位於 [QA 概覽 → 新增頻道](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低門檻：在共用 `qa-lab` host seam 上實作 transport runner、在 Plugin manifest 中宣告 `qaRunners`、掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 底下撰寫 scenario。

## 測試套件（在哪裡執行什麼）

可將套件視為「真實性遞增」（同時不穩定性/成本也遞增）：

### 單元 / 整合（預設）

- 命令：`pnpm test`
- 設定：非目標式執行使用 `vitest.full-*.config.ts` shard 集合，並可能將多專案 shard 展開為各專案設定以進行平行排程
- 檔案：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 底下的核心/單元清單；UI 單元測試在專用的 `unit-ui` shard 中執行
- 範圍：
  - 純單元測試
  - 程序內整合測試（gateway auth、routing、tooling、parsing、config）
  - 已知錯誤的確定性迴歸
- 預期：
  - 在 CI 中執行
  - 不需要真實金鑰
  - 應快速且穩定
  - Resolver 與 public-surface loader 測試必須使用產生的極小 Plugin fixture 證明廣泛的 `api.js` 與 `runtime-api.js` fallback 行為，而不是使用真實內建 Plugin 原始碼 API。真實 Plugin API 載入應屬於 Plugin 擁有的合約/整合套件。

<AccordionGroup>
  <Accordion title="專案、shard 與限定範圍 lane">

    - 未指定目標的 `pnpm test` 會執行十二個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生根專案程序。這會降低高負載機器上的峰值 RSS，並避免 auto-reply/extension 工作讓無關的測試套件飢餓。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片監看迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過限定範圍的 lane 路由明確的檔案/目錄目標，所以 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免支付完整根專案啟動成本。
    - `pnpm test:changed` 預設會將已變更的 git 路徑展開成低成本的限定範圍 lane：直接的測試編輯、相鄰的 `*.test.ts` 檔案、明確的來源對應，以及本機 import 圖相依項。設定/setup/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的標準智慧型本機檢查閘門。它會將 diff 分類成核心、核心測試、extensions、extension 測試、apps、docs、發行中繼資料、即時 Docker 工具和 tooling，然後執行相符的型別檢查、lint 和 guard 指令。它不會執行 Vitest 測試；如需測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅含發行中繼資料的版本提升會執行目標式版本/config/root-dependency 檢查，並透過 guard 拒絕頂層版本欄位以外的 package 變更。
    - 即時 Docker ACP harness 編輯會執行聚焦檢查：即時 Docker 驗證腳本的 shell 語法，以及即時 Docker scheduler dry-run。只有當 diff 限定在 `scripts["test:docker:live-*"]` 時，才會包含 `package.json` 變更；dependency、export、version 和其他 package surface 編輯仍會使用更廣泛的 guard。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純工具區域的輕 import 單元測試會透過 `unit-fast` lane 路由，該 lane 會略過 `test/setup-openclaw-runtime.ts`；具狀態/執行階段負載較重的檔案則維持在既有 lane。
    - 選定的 `plugin-sdk` 和 `commands` helper 來源檔案，也會在 changed-mode 執行時對應到這些輕量 lane 中明確的相鄰測試，因此 helper 編輯可避免重新執行該目錄的完整重型套件。
    - `auto-reply` 對頂層核心 helper、頂層 `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹都有專用 bucket。CI 進一步將 reply 子樹分成 agent-runner、dispatch 和 commands/state-routing 分片，避免單一 import 負載重的 bucket 佔用完整 Node 尾端。
    - 一般 PR/main CI 會刻意略過 extension 批次掃描和僅供發行使用的 `agentic-plugins` 分片。完整 Release Validation 會針對發行候選版本，派送獨立的 `Plugin Prerelease` 子 workflow 來執行那些 Plugin/extension 負載重的套件。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - 當你變更 message-tool 探索輸入或 Compaction 執行階段
      context 時，請保留兩個層級的涵蓋範圍。
    - 針對純路由和正規化邊界，新增聚焦的 helper 回歸測試。
    - 維持 embedded runner 整合套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證限定範圍 id 和 Compaction 行為仍會流經
      真實的 `run.ts` / `compact.ts` 路徑；僅有 helper 的測試
      無法充分取代這些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - 基礎 Vitest 設定預設為 `threads`。
    - 共用 Vitest 設定會固定 `isolate: false`，並在
      根專案、e2e 和即時設定中使用非隔離 runner。
    - 根 UI lane 保留其 `jsdom` setup 和 optimizer，但也會在
      共用的非隔離 runner 上執行。
    - 每個 `pnpm test` 分片都會從共用 Vitest 設定繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子 Node
      程序加上 `--no-maglev`，以減少大型本機執行期間的 V8 編譯 churn。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與標準 V8
      行為比較。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構 lane。
    - pre-commit hook 只做格式化。它會重新暫存已格式化的檔案，
      不會執行 lint、型別檢查或測試。
    - 當你在 handoff 或 push 前需要智慧型本機檢查閘門時，請明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過低成本的限定範圍 lane 路由。只有當 agent
      判定 harness、config、package 或 contract 編輯確實需要更廣泛的
      Vitest 涵蓋範圍時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行為，只是有較高的 worker 上限。
    - 本機 worker 自動縮放刻意保守，並會在主機負載平均已高時退讓，
      因此多個並行 Vitest 執行預設造成的傷害較小。
    - 基礎 Vitest 設定會將 projects/config 檔案標記為
      `forceRerunTriggers`，因此測試
      wiring 變更時，changed-mode 重新執行仍保持正確。
    - 設定會在支援的主機上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      如果你想為直接 profiling 使用單一明確快取位置，請設定
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` 會啟用 Vitest import-duration 報告以及
      import-breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling 視圖限定在
      自 `origin/main` 以來變更的檔案。
    - 分片 timing 資料會寫入 `.artifacts/vitest-shard-timings.json`。
      整個 config 執行會使用 config 路徑作為 key；include-pattern CI
      分片會附加分片名稱，讓已篩選的分片可分開追蹤。
    - 當某個熱點測試仍將大部分時間花在啟動 import 上時，
      請將重型 dependency 放在窄範圍的本機 `*.runtime.ts` seam 後面，並
      直接 mock 該 seam，而不是深層 import 執行階段 helper，只為了
      將它們傳入 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會比較已路由的
      `test:changed` 與該已提交 diff 的原生根專案路徑，並列印牆鐘時間以及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過將 changed file list 路由到
      `scripts/test-projects.mjs` 和根 Vitest 設定，對目前的
      dirty tree 進行 benchmark。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite 啟動和 transform overhead 寫入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用檔案平行化的情況下，為
      單元套件寫入 runner CPU+heap profile。

  </Accordion>
</AccordionGroup>

### 穩定性（gateway）

- 指令：`pnpm test:stability:gateway`
- 設定：`vitest.gateway.config.ts`，強制為一個 worker
- 範圍：
  - 預設啟用 diagnostics，啟動真實的回送 Gateway
  - 透過 diagnostic event 路徑驅動合成 gateway message、memory 和 large-payload churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 涵蓋 diagnostic stability bundle persistence helpers
  - 斷言 recorder 維持有界、合成 RSS sample 保持低於壓力預算，且每個 session queue depth 會排空回零
- 預期：
  - CI 安全且不需要 key
  - 用於穩定性回歸 follow-up 的窄 lane，不能取代完整 Gateway 套件

### E2E（gateway smoke）

- 指令：`pnpm test:e2e`
- 設定：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的 bundled-plugin E2E 測試
- 執行階段預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用自適應 workers（CI：最多 2 個，本機：預設 1 個）。
  - 預設以 silent mode 執行，以降低 console I/O overhead。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 可強制指定 worker 數（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 可重新啟用詳細 console 輸出。
- 範圍：
  - 多實例 gateway 端對端行為
  - WebSocket/HTTP surface、node pairing，以及較重的 networking
- 預期：
  - 在 CI 中執行（當 pipeline 啟用時）
  - 不需要真實 key
  - 比單元測試有更多 moving parts（可能較慢）

### E2E：OpenShell backend smoke

- 指令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 透過 Docker 在主機上啟動隔離的 OpenShell gateway
  - 從暫時性的本機 Dockerfile 建立 sandbox
  - 透過真實的 `sandbox ssh-config` + SSH exec，測試 OpenClaw 的 OpenShell backend
  - 透過 sandbox fs bridge 驗證 remote-canonical filesystem 行為
- 預期：
  - 僅 opt-in；不屬於預設 `pnpm test:e2e` 執行
  - 需要本機 `openshell` CLI 以及可運作的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，接著銷毀測試 gateway 和 sandbox
- 實用覆寫：
  - 手動執行較廣泛的 e2e 套件時，使用 `OPENCLAW_E2E_OPENSHELL=1` 啟用測試
  - 使用 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 指向非預設 CLI binary 或 wrapper script

### 即時（真實 provider + 真實 model）

- 指令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的 bundled-plugin 即時測試
- 預設值：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個 provider/model 在 _今天_ 使用真實 creds 時是否實際可用？」
  - 捕捉 provider 格式變更、tool-calling 特性、auth 問題和 rate limit 行為
- 預期：
  - 設計上不保證 CI 穩定（真實網路、真實 provider policy、quota、outage）
  - 會花錢 / 使用 rate limit
  - 偏好執行縮小範圍的子集，而不是「everything」
- 即時執行會 source `~/.profile` 以取得缺少的 API keys。
- 預設情況下，即時執行仍會隔離 `HOME`，並將 config/auth material 複製到暫時測試 home，因此單元 fixture 無法修改你的真實 `~/.openclaw`。
- 只有當你刻意需要即時測試使用真實 home 目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設為較安靜的模式：它會保留 `[live] ...` progress 輸出，但抑制額外的 `~/.profile` 通知，並靜音 gateway bootstrap logs/Bonjour chatter。如果你想取回完整啟動 logs，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key rotation（provider-specific）：以逗號/分號格式設定 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 進行 per-live override；測試會在 rate limit response 時重試。
- Progress/heartbeat 輸出：
  - 即時套件現在會將 progress lines 發送到 stderr，因此即使 Vitest console capture 安靜時，長時間的 provider call 仍可見為 active。
  - `vitest.live.config.ts` 會停用 Vitest console interception，因此 provider/gateway progress lines 會在即時執行期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整 direct-model heartbeat。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 gateway/probe heartbeat。

## 我該執行哪個套件？

使用這個決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你變更很多，也執行 `pnpm test:coverage`）
- 觸及 Gateway 網路 / WS 協定 / 配對：加上 `pnpm test:e2e`
- 偵錯「我的機器人無法運作」/ 供應商特定失敗 / 工具呼叫：執行範圍縮小的 `pnpm test:live`

## 即時（觸及網路）測試

如需即時模型矩陣、CLI 後端煙霧測試、ACP 煙霧測試、Codex app-server
harness，以及所有媒體供應商即時測試（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness），再加上即時執行的認證處理，請參閱
[測試即時套件](/zh-TW/help/testing-live)。如需專用的更新與
Plugin 驗證檢查清單，請參閱
[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。

## Docker 執行器（選用的「可在 Linux 運作」檢查）

這些 Docker 執行器分成兩類：

- 即時模型執行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker 映像檔內執行各自對應的 profile-key 即時檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），並掛載你的本機設定目錄與工作區（如果已掛載，也會載入 `~/.profile`）。對應的本機進入點是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 即時執行器預設使用較小的煙霧測試上限，讓完整 Docker 掃描保持實用：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明確想要較大的完整掃描時，才覆寫這些環境變數。
- `test:docker:all` 會先透過 `test:docker:live-build` 建立即時 Docker 映像檔一次，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包成 npm tarball 一次，然後建立/重用兩個 `scripts/e2e/Dockerfile` 映像檔。裸映像檔只是安裝/更新/Plugin 依賴項目測試線的 Node/Git 執行器；這些測試線會掛載預先建立的 tarball。功能性映像檔會將同一個 tarball 安裝到 `/app`，用於已建置應用程式功能測試線。Docker 測試線定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選取的計畫。彙總流程使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序槽位，而資源上限會避免重型即時、npm 安裝和多服務測試線同時全部啟動。如果單一測試線比作用中的上限更重，排程器仍可在集區為空時啟動它，並讓它單獨執行，直到容量再次可用為止。預設值為 10 個槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。執行器預設會執行 Docker 預檢、移除過時的 OpenClaw E2E 容器、每 30 秒列印狀態、將成功測試線耗時儲存在 `.artifacts/docker-tests/lane-timings.json`，並在之後的執行中使用這些耗時資料優先啟動較長的測試線。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不建置或執行 Docker 的情況下列印加權測試線清單，或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選測試線、套件/映像檔需求和認證的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生的套件閘門，用來檢查「這個可安裝的 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個候選套件，將其上傳為 `package-under-test`，接著針對該精確 tarball 執行可重用的 Docker E2E 測試線，而不是重新打包選取的 ref。設定檔依涵蓋廣度排序：`smoke`、`package`、`product` 和 `full`。如需套件/更新/Plugin 合約、已發布升級存活矩陣、發行預設值和失敗分類，請參閱[測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)。
- 建置與發行檢查會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。這個防護會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪靜態建置圖，若命令分派前的啟動流程匯入 Commander、提示 UI、undici 或記錄等套件依賴項目，就會失敗；它也會讓打包的 Gateway 執行區塊保持在預算內，並拒絕已知冷 Gateway 路徑的靜態匯入。封裝後的 CLI 煙霧測試也涵蓋根說明、onboard 說明、doctor 說明、status、config schema，以及 model-list 命令。
- Package Acceptance 舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止版本以前，harness 只容忍已發布套件的中繼資料缺口：省略的私有 QA inventory 項目、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔案、缺少持久化的 `update.channel`、舊版 Plugin 安裝記錄位置、缺少 marketplace 安裝記錄持久化，以及 `plugins update` 期間的設定中繼資料遷移。對 `2026.4.25` 之後的套件，這些路徑都是嚴格失敗。
- 容器煙霧測試執行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 會啟動一個或多個真實容器，並驗證較高層級的整合路徑。

即時模型 Docker 執行器也只會綁定掛載所需的 CLI 驗證 home（或在未縮小執行範圍時掛載所有支援的項目），然後在執行前將它們複製到容器 home，讓外部 CLI OAuth 可以重新整理權杖，而不會改動主機驗證儲存區：

- 直接模型：`pnpm test:docker:live-models`（script：`scripts/test-live-models-docker.sh`）
- ACP 綁定 smoke：`pnpm test:docker:live-acp-bind`（script：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 嚴格涵蓋 Droid/OpenCode）
- CLI 後端 smoke：`pnpm test:docker:live-cli-backend`（script：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`（script：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開發 agent：`pnpm test:docker:live-gateway`（script：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性 smoke：`pnpm qa:otel:smoke` 是私有 QA 原始碼 checkout lane。它刻意不屬於套件 Docker release lane，因為 npm tarball 會省略 QA Lab。
- Open WebUI live smoke：`pnpm test:docker:openwebui`（script：`scripts/e2e/openwebui-docker.sh`）
- Onboarding 精靈（TTY，完整 scaffolding）：`pnpm test:docker:onboard`（script：`scripts/e2e/onboard-docker.sh`）
- Npm tarball onboarding/channel/agent smoke：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝已打包的 OpenClaw tarball，透過 env-ref onboarding 設定 OpenAI，並預設設定 Telegram，執行 doctor，並執行一次 mocked OpenAI agent turn。可用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 略過主機重建，或用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切換 channel。
- 更新 channel 切換 smoke：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝已打包的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證保存的 channel 和 Plugin 更新後可用，接著切回套件 `stable` 並檢查更新狀態。
- 升級存活 smoke：`pnpm test:docker:upgrade-survivor` 會將已打包的 OpenClaw tarball 安裝到帶有 agents、channel config、Plugin allowlists、過期 Plugin 相依狀態，以及既有 workspace/session 檔案的髒舊使用者 fixture 上。它會執行套件更新與非互動式 doctor，不使用 live provider 或 channel keys，接著啟動 loopback Gateway，並檢查 config/state 保存，以及 startup/status 預算。
- 已發布升級存活 smoke：`pnpm test:docker:published-upgrade-survivor` 預設安裝 `openclaw@latest`，植入真實感的既有使用者檔案，用內建 command recipe 設定該 baseline，驗證產生的 config，將該已發布安裝更新到候選 tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動 loopback Gateway，並檢查已設定 intents、state 保存、startup、`/healthz`、`/readyz` 和 RPC status 預算。用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一 baseline，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 要求 aggregate scheduler 展開精確 baselines，並用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue-shaped fixtures，例如 `reported-issues`；Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`。
- Session runtime context smoke：`pnpm test:docker:session-runtime-context` 會驗證隱藏 runtime context transcript 持久化，以及 doctor 對受影響的重複 prompt-rewrite branches 的修復。
- Bun 全域安裝 smoke：`bash scripts/e2e/bun-global-install-smoke.sh` 會打包目前 tree，在隔離的 home 中用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會回傳 bundled image providers，而不是卡住。可用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 略過主機建置，或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker image 複製 `dist/`。
- Installer Docker smoke：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm containers 之間共用一個 npm cache。Update smoke 預設先以 npm `latest` 作為 stable baseline，再升級到候選 tarball。本機可用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上用 Install Smoke workflow 的 `update_baseline_version` input 覆寫。非 root installer 檢查會保留隔離的 npm cache，避免 root 擁有的 cache entries 掩蓋 user-local install 行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本機重跑時重用 root/update/direct-npm cache。
- Install Smoke CI 會用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 略過重複的 direct-npm global update；需要直接 `npm install -g` coverage 時，在本機執行 script 且不要設定該 env。
- Agents 刪除 shared workspace CLI smoke：`pnpm test:docker:agents-delete-shared-workspace`（script：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置 root Dockerfile image，在隔離的 container home 中植入兩個 agents 和一個 workspace，執行 `agents delete --json`，並驗證有效 JSON 與保留 workspace 行為。可用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke image。
- Gateway networking（兩個 containers，WS auth + health）：`pnpm test:docker:gateway-network`（script：`scripts/e2e/gateway-network-docker.sh`）
- Browser CDP snapshot smoke：`pnpm test:docker:browser-cdp-snapshot`（script：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置 source E2E image 加上 Chromium layer，以 raw CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP role snapshots 涵蓋 link URLs、cursor-promoted clickables、iframe refs 和 frame metadata。
- OpenAI Responses web_search minimal reasoning regression：`pnpm test:docker:openai-web-search-minimal`（script：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行 mocked OpenAI server，驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提升到 `low`，接著強制 provider schema reject，並檢查 raw detail 出現在 Gateway logs 中。
- MCP channel bridge（植入資料的 Gateway + stdio bridge + raw Claude notification-frame smoke）：`pnpm test:docker:mcp-channels`（script：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP tools（真實 stdio MCP server + embedded Pi profile allow/deny smoke）：`pnpm test:docker:pi-bundle-mcp-tools`（script：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP cleanup（真實 Gateway + 在隔離 cron 和 one-shot subagent run 後拆除 stdio MCP child）：`pnpm test:docker:cron-mcp-cleanup`（script：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugin（local path、`file:`、含 hoisted dependencies 的 npm registry、git moving refs、ClawHub kitchen-sink、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update smoke）：`pnpm test:docker:plugins`（script：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可略過 ClawHub 區塊，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設 kitchen-sink package/runtime pair。未設定 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` 時，測試會使用 hermetic local ClawHub fixture server。
- Plugin update unchanged smoke：`pnpm test:docker:plugin-update`（script：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- Config reload metadata smoke：`pnpm test:docker:config-reload`（script：`scripts/e2e/config-reload-source-docker.sh`）
- Plugin：`pnpm test:docker:plugins` 涵蓋 local path、`file:`、含 hoisted dependencies 的 npm registry、git moving refs、ClawHub fixtures、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update smoke。`pnpm test:docker:plugin-update` 涵蓋已安裝 Plugin 的 unchanged update 行為。

若要手動預先建置並重用 shared functional image：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定時，像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 這類 suite-specific image 覆寫仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向 remote shared image 時，如果該 image 尚未存在於本機，script 會 pull 它。QR 和 installer Docker 測試保留自己的 Dockerfiles，因為它們驗證的是 package/install 行為，而不是 shared built-app runtime。

live-model Docker runners 也會以唯讀方式 bind-mount 目前 checkout，並將它 stage 到 container 內的暫存 workdir。這能讓 runtime image 保持精簡，同時仍針對你的精確本機 source/config 執行 Vitest。Staging 步驟會略過大型 local-only caches 和 app build outputs，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及 app-local `.build` 或 Gradle output directories，讓 Docker live runs 不會花數分鐘複製 machine-specific artifacts。它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此 gateway live probes 不會在 container 內啟動真實 Telegram/Discord 等 channel workers。`test:docker:live-models` 仍會執行 `pnpm test:live`，所以當你需要從該 Docker lane 縮小或排除 gateway live coverage 時，也要傳入 `OPENCLAW_LIVE_GATEWAY_*`。`test:docker:openwebui` 是較高階的相容性 smoke：它會啟動已啟用 OpenAI-compatible HTTP endpoints 的 OpenClaw gateway container，針對該 gateway 啟動 pinned Open WebUI container，透過 Open WebUI 登入，驗證 `/api/models` 公開 `openclaw/default`，接著透過 Open WebUI 的 `/api/chat/completions` proxy 傳送真實 chat request。第一次執行可能明顯較慢，因為 Docker 可能需要 pull Open WebUI image，且 Open WebUI 可能需要完成自己的 cold-start setup。此 lane 預期有可用的 live model key，而 `OPENCLAW_PROFILE_FILE`（預設為 `~/.profile`）是在 Dockerized runs 中提供它的主要方式。成功執行會印出小型 JSON payload，例如 `{ "ok": true, "model": "openclaw/default", ... }`。`test:docker:mcp-channels` 刻意保持 deterministic，且不需要真實 Telegram、Discord 或 iMessage account。它會啟動植入資料的 Gateway container，啟動第二個 container 來 spawn `openclaw mcp serve`，接著透過真實 stdio MCP bridge 驗證 routed conversation discovery、transcript reads、attachment metadata、live event queue 行為、outbound send routing，以及 Claude-style channel + permission notifications。Notification 檢查會直接檢視 raw stdio MCP frames，因此 smoke 驗證的是 bridge 實際輸出的內容，而不只是特定 client SDK 恰好暴露的內容。`test:docker:pi-bundle-mcp-tools` 是 deterministic，且不需要 live model key。它會建置 repo Docker image，在 container 內啟動真實 stdio MCP probe server，透過 embedded Pi bundle MCP runtime materialize 該 server，執行 tool，接著驗證 `coding` 和 `messaging` 保留 `bundle-mcp` tools，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 會將它們過濾掉。`test:docker:cron-mcp-cleanup` 是 deterministic，且不需要 live model key。它會用真實 stdio MCP probe server 啟動植入資料的 Gateway，執行一次隔離 cron turn 和一次 `/subagents spawn` one-shot child turn，接著驗證 MCP child process 在每次 run 後退出。

手動 ACP plain-language thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此 script 供 regression/debug workflows 使用。ACP thread routing validation 之後可能仍會需要它，所以不要刪除。

實用 env vars：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）掛載到 `/home/node/.profile`，並在執行測試前載入
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 僅驗證從 `OPENCLAW_PROFILE_FILE` 載入的環境變數，使用暫時的設定/工作區目錄，且不掛載外部 CLI 驗證
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）掛載到 `/home/node/.npm-global`，供 Docker 內快取 CLI 安裝使用
- `$HOME` 底下的外部 CLI 驗證目錄/檔案會以唯讀方式掛載到 `/host-auth...` 底下，然後在測試開始前複製到 `/home/node/...`
  - 預設目錄：`.minimax`
  - 預設檔案：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 範圍縮小的 provider 執行只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷所需的目錄/檔案
  - 可用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的逗號清單手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用來縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用來在容器內篩選 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用來在不需要重新建置的重跑中重用既有的 `openclaw:local-live` 映像檔
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用來確保憑證來自設定檔存放區（而非環境變數）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用來選擇 Gateway 為 Open WebUI smoke 所公開的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用來覆寫 Open WebUI smoke 使用的 nonce 檢查提示
- `OPENWEBUI_IMAGE=...` 用來覆寫固定的 Open WebUI 映像檔標籤

## 文件健全性

文件編輯後執行文件檢查：`pnpm check:docs`。
需要同時檢查頁面內標題時，執行完整的 Mintlify 錨點驗證：`pnpm docs:check-links:anchors`。

## 離線迴歸（CI 安全）

這些是不使用真實 providers 的「真實管線」迴歸：

- Gateway 工具呼叫（模擬 OpenAI、真實 Gateway + agent 迴圈）：`src/gateway/gateway.test.ts`（案例："runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway 精靈（WS `wizard.start`/`wizard.next`，寫入設定 + 強制驗證）：`src/gateway/gateway.test.ts`（案例："runs wizard over ws and writes auth token config"）

## Agent 可靠性評估（skills）

我們已經有幾個 CI 安全測試，行為類似「agent 可靠性評估」：

- 透過真實 Gateway + agent 迴圈進行模擬工具呼叫（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 與設定效果的端對端精靈流程（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請見 [Skills](/zh-TW/tools/skills)）：

- **決策：** 當提示中列出 skills 時，agent 是否會選擇正確的 skill（或避開不相關的 skill）？
- **合規：** agent 是否會在使用前讀取 `SKILL.md`，並遵循必要步驟/參數？
- **工作流程合約：** 驗證工具順序、session 歷史承接與沙盒邊界的多輪情境。

未來的評估應先保持確定性：

- 使用模擬 providers 的情境執行器，用來斷言工具呼叫與順序、skill 檔案讀取，以及 session wiring。
- 一小組聚焦 skills 的情境（使用與避免、門檻控管、提示注入）。
- 選用的實際評估（選擇加入、由環境變數控管）只應在 CI 安全套件就緒後再加入。

## 合約測試（Plugin 與 channel 形狀）

合約測試會驗證每個已註冊的 Plugin 與 channel 都符合其
介面合約。它們會逐一檢查所有探索到的 plugins，並執行一組
形狀與行為斷言。預設的 `pnpm test` 單元測試 lane 會刻意
略過這些共用 seam 與 smoke 檔案；當你修改共用 channel 或 provider 介面時，
請明確執行合約命令。

### 命令

- 所有合約：`pnpm test:contracts`
- 只執行 channel 合約：`pnpm test:contracts:channels`
- 只執行 provider 合約：`pnpm test:contracts:plugins`

### Channel 合約

位於 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本 Plugin 形狀（id、name、capabilities）
- **setup** - 設定精靈合約
- **session-binding** - session 綁定行為
- **outbound-payload** - 訊息 payload 結構
- **inbound** - inbound 訊息處理
- **actions** - channel 動作處理器
- **threading** - thread ID 處理
- **directory** - directory/roster API
- **group-policy** - 群組政策強制執行

### Provider 狀態合約

位於 `src/plugins/contracts/*.contract.test.ts`。

- **status** - channel 狀態探測
- **registry** - Plugin 登錄表形狀

### Provider 合約

位於 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 驗證流程合約
- **auth-choice** - 驗證選擇/選取
- **catalog** - 模型 catalog API
- **discovery** - Plugin 探索
- **loader** - Plugin 載入
- **runtime** - provider runtime
- **shape** - Plugin 形狀/介面
- **wizard** - 設定精靈

### 執行時機

- 變更 plugin-sdk 匯出或子路徑後
- 新增或修改 channel 或 provider Plugin 後
- 重構 Plugin 註冊或探索後

合約測試會在 CI 中執行，且不需要真實 API 金鑰。

## 新增迴歸（指引）

當你修正實際測試中發現的 provider/model 問題時：

- 盡可能新增 CI 安全迴歸（模擬/stub provider，或擷取精確的請求形狀轉換）
- 如果本質上只能實際測試（速率限制、驗證政策），請保持實際測試範圍狹窄，並透過環境變數選擇加入
- 優先鎖定能捕捉錯誤的最小層級：
  - provider 請求轉換/replay 錯誤 → 直接 models 測試
  - Gateway session/history/tool 管線錯誤 → Gateway 實際 smoke 或 CI 安全 Gateway 模擬測試
- SecretRef 遍歷防護：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從登錄表中繼資料（`listSecretTargetRegistryEntries()`）為每個 SecretRef 類別推導一個取樣目標，然後斷言會拒絕 traversal-segment exec ids。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增新的 `includeInPlan` SecretRef 目標家族，請更新該測試中的 `classifyTargetClass`。此測試會刻意在未分類的目標 id 上失敗，確保新類別不會被靜默略過。

## 相關

- [實際測試](/zh-TW/help/testing-live)
- [測試更新與 plugins](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
