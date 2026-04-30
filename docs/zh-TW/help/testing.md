---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/提供者錯誤新增迴歸測試
    - 偵錯 Gateway + 代理程式行為
summary: 測試工具包：單元/e2e/live 測試套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-04-30T03:12:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 測試套件（單元/整合、e2e、live）和一小組
Docker 執行器。本文件是「我們如何測試」指南：

- 每個套件涵蓋的內容（以及它刻意_不_涵蓋的內容）。
- 常見工作流程（本機、推送前、除錯）應執行哪些命令。
- live 測試如何探索憑證並選擇模型/提供者。
- 如何針對真實世界的模型/提供者問題新增迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、live 傳輸通道）**另有文件說明：

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) — 架構、命令介面、情境撰寫。
- [矩陣 QA](/zh-TW/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的參考。
- [QA channel](/zh-TW/channels/qa-channel) — repo 支援情境所使用的合成傳輸 Plugin。

本頁涵蓋一般測試套件和 Docker/Parallels 執行器的執行方式。下方 QA 專用執行器章節（[QA 專用執行器](#qa-specific-runners)）列出具體的 `qa` 呼叫，並指回上面的參考資料。
</Note>

## 快速開始

多數日常情況：

- 完整閘門（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足機器上更快的本機完整套件執行：`pnpm test:max`
- 直接的 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在迭代單一失敗時，優先使用目標式執行。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你修改測試或想要額外信心時：

- 覆蓋率閘門：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

除錯真實提供者/模型時（需要真實憑證）：

- Live 套件（模型 + Gateway 工具/圖片探測）：`pnpm test:live`
- 安靜地指定一個 live 檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型掃描：`pnpm test:docker:live-models`
  - 每個選取的模型現在會執行一個文字回合，以及一個小型類似檔案讀取的探測。
    中繼資料宣告支援 `image` 輸入的模型，也會執行一個小型圖片回合。
    在隔離提供者失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋：每日 `OpenClaw Scheduled Live And E2E Checks` 和手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用的 live/E2E workflow，其中包含依提供者分片的獨立 Docker live 模型
    矩陣工作。
  - 若要進行聚焦的 CI 重新執行，請以 `include_live_suites: true` 和 `live_models_only: true` 觸發 `OpenClaw Live And E2E Checks (Reusable)`。
  - 將新的高訊號提供者 secrets 新增到 `scripts/ci-hydrate-live-auth.sh`
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其
    排程/發布呼叫端。
- 原生 Codex 綁定聊天 smoke：`pnpm test:docker:live-codex-bind`
  - 對 Codex app-server 路徑執行 Docker live 通道，使用 `/codex bind` 綁定合成的
    Slack DM，演練 `/codex fast` 和
    `/codex permissions`，接著驗證純文字回覆與圖片附件會透過原生 Plugin 綁定路由，而不是 ACP。
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`
  - 透過 Plugin 擁有的 Codex app-server harness 執行 Gateway agent 回合，
    驗證 `/codex status` 和 `/codex models`，且預設會演練圖片、
    cron MCP、sub-agent 和 Guardian 探測。在隔離其他 Codex
    app-server 失敗時，可用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用 sub-agent 探測。若要進行聚焦的 sub-agent 檢查，請停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則這會在 sub-agent 探測後結束。
- Crestodian rescue command smoke：`pnpm test:live:crestodian-rescue-channel`
  - 針對 message-channel rescue command
    介面的選擇加入式加強檢查。它會演練 `/crestodian status`、排入持久化模型
    變更、回覆 `/crestodian yes`，並驗證稽核/設定寫入路徑。
- Crestodian planner Docker smoke：`pnpm test:docker:crestodian-planner`
  - 在 `PATH` 上具有假 Claude CLI 的無設定容器中執行 Crestodian，
    並驗證模糊 planner fallback 會轉換成經稽核的具型別設定寫入。
- Crestodian first-run Docker smoke：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw 狀態目錄開始，將裸 `openclaw` 路由到
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入，
    驗證設定，並驗證稽核項目。相同的 Ring 0 設定路徑
    也在 QA Lab 中由
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 涵蓋。
- Moonshot/Kimi 成本 smoke：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著對
  `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存正規化後的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先透過下方說明的 allowlist env vars 縮小 live 測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA-lab 真實性時，這些命令與主要測試套件並列：

CI 會在專用 workflow 中執行 QA Lab。`Parity gate` 會在符合條件的 PR 上執行，並可透過手動觸發搭配 mock 提供者執行。`QA-Lab - All Lanes` 每晚在
`main` 上執行，也可透過手動觸發，以 mock parity gate、live Matrix 通道、
Convex 管理的 live Telegram 通道，以及 Convex 管理的 live Discord 通道作為
平行工作執行。排程 QA 和發布檢查會明確傳入 Matrix `--profile fast`，
而 Matrix CLI 與手動 workflow 輸入的預設值仍為
`all`；手動觸發可以將 `all` 分片成 `transport`、`media`、`e2ee-smoke`、
`e2ee-deep` 和 `e2ee-cli` 工作。`OpenClaw Release Checks` 會在發布核准前執行 parity 加上
fast Matrix 和 Telegram 通道，並使用
`mock-openai/gpt-5.5` 進行發布傳輸檢查，讓它們保持決定性
並避免一般提供者 Plugin 啟動。這些 live 傳輸 Gateway 會停用
記憶搜尋；記憶行為仍由 QA parity 套件涵蓋。

完整發布 live media 分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已具備
`ffmpeg` 和 `ffprobe`。Docker live 模型/後端分片使用共用的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像檔，該映像檔會針對每個選取的
commit 建置一次，接著以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行 repo 支援的 QA 情境。
  - 預設使用隔離的 gateway worker 平行執行多個已選情境。
    `qa-channel` 預設並行度為 4（受已選情境數量限制）。使用 `--concurrency <count>` 調整 worker
    數量，或用 `--concurrency 1` 執行較舊的序列通道。
  - 當任何情境失敗時會以非零狀態結束。若你想取得 artifacts 而不要失敗結束碼，請使用 `--allow-failures`。
  - 支援提供者模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 會啟動本機 AIMock 支援的提供者伺服器，用於實驗性
    fixture 與 protocol-mock 覆蓋，而不取代情境感知的
    `mock-openai` 通道。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 Gateway 啟動 bench，加上一小包 mock QA Lab 情境
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），並在
    `.artifacts/gateway-cpu-scenarios/` 下寫入合併的 CPU 觀察
    摘要。
  - 預設只標記持續性的高 CPU 觀察（`--cpu-core-warn`
    加上 `--hot-wall-warn-ms`），因此短暫啟動突增會被記錄為指標，
    而不會看起來像持續數分鐘的 Gateway peg 迴歸。
  - 使用已建置的 `dist` artifacts；當 checkout 尚未具備新的 runtime 輸出時，請先執行 build。
- `pnpm openclaw qa suite --runner multipass`
  - 在可拋棄的 Multipass Linux VM 內執行相同的 QA 套件。
  - 保持與主機上 `qa suite` 相同的情境選擇行為。
  - 重用與 `qa suite` 相同的提供者/模型選擇旗標。
  - Live 執行會轉送對 guest 實際可行的支援 QA auth 輸入：
    env 型提供者金鑰、QA live 提供者設定路徑，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須保留在 repo root 下，讓 guest 能透過掛載的工作區寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA 報告 + 摘要以及 Multipass logs。
- `pnpm qa:lab:up`
  - 啟動 Docker 支援的 QA 站台，用於 operator 風格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball，在
    Docker 中全域安裝它，執行非互動式 OpenAI API-key onboarding，預設設定 Telegram，
    驗證啟用 Plugin 會依需求安裝 runtime dependencies，
    執行 doctor，並對 mocked OpenAI
    endpoint 執行一個本機 agent 回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的 packaged-install
    通道。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式 runtime context
    transcripts 執行決定性的 built-app Docker smoke。它會驗證隱藏的 OpenClaw runtime context 會持久化為
    非顯示的 custom message，而不是洩漏到可見的 user turn，
    接著植入受影響的破損 session JSONL，並驗證
    `openclaw doctor --fix` 會以備份將它重寫到 active branch。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw package candidate，執行 installed-package
    onboarding，透過已安裝的 CLI 設定 Telegram，接著將該已安裝 package 作為 SUT Gateway 重用
    live Telegram QA 通道。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而不是
    從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env 憑證或 Convex credential source。對於 CI/發布自動化，請設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` 加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 role secret。若
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex role secret 存在於 CI 中，
    Docker wrapper 會自動選擇 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此通道覆寫共用的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 將此通道公開為手動 maintainer workflow
    `NPM Telegram Beta E2E`。它不會在 merge 時執行。此 workflow 使用
    `qa-live-shared` environment 和 Convex CI credential leases。
- GitHub Actions 也公開 `Package Acceptance`，用於對單一 candidate package 進行 side-run 產品證明。
  它接受受信任的 ref、已發布的 npm spec、
  HTTPS tarball URL 加 SHA-256，或來自另一個 run 的 tarball artifact，上傳
  正規化後的 `openclaw-current.tgz` 作為 `package-under-test`，接著以 smoke、package、product、full 或 custom
  通道 profile 執行既有的 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可針對相同的 `package-under-test` artifact 執行
  Telegram QA workflow。
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

- Artifact proof 會從另一個 Actions 執行作業下載 tarball Artifact：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中封裝並安裝目前的 OpenClaw 建置，啟動已設定 OpenAI 的 Gateway，然後透過設定編輯啟用內建 channel/plugins。
  - 驗證設定探索會讓未設定 Plugin 的執行階段依賴項保持不存在，第一次已設定的 Gateway 或 doctor 執行會按需安裝每個內建 Plugin 的執行階段依賴項，且第二次重新啟動不會重新安裝已啟用的依賴項。
  - 也會安裝已知的較舊 npm 基準版本，在執行 `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證候選版本的更新後 doctor 會修復內建 channel 執行階段依賴項，而不需要 harness 端 postinstall 修復。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 執行原生封裝安裝更新 smoke。每個選取的平台會先安裝要求的基準套件，接著在同一個 guest 中執行已安裝的 `openclaw update` 命令，並驗證已安裝版本、更新狀態、Gateway 就緒狀態，以及一次本機 agent 回合。
  - 在針對單一 guest 反覆測試時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得摘要 Artifact 路徑與每個 lane 的狀態。
  - OpenAI lane 預設使用 `openai/gpt-5.5` 作為即時 agent 回合 proof。若刻意驗證另一個 OpenAI 模型，請傳入 `--model <provider/model>` 或設定 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 將長時間本機執行包在主機 timeout 中，避免 Parallels 傳輸停滯耗盡剩餘測試時間：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 此腳本會在 `/tmp/openclaw-parallels-npm-update.*` 下寫入巢狀 lane 記錄檔。先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`，再判定外層 wrapper 是否卡住。
  - Windows 更新在冷 guest 上可能會花 10 到 15 分鐘進行更新後 doctor/執行階段依賴修復；只要巢狀 npm debug 記錄檔仍在推進，這仍屬正常。
  - 不要將這個彙總 wrapper 與個別 Parallels macOS、Windows 或 Linux smoke lane 並行執行。它們共用 VM 狀態，可能在 snapshot 還原、套件服務或 guest Gateway 狀態上發生衝突。
  - 更新後 proof 會執行一般內建 Plugin 表面，因為語音、影像生成與媒體理解等 capability facade 會透過內建執行階段 API 載入，即使 agent 回合本身只檢查簡單文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider 伺服器，用於直接協定 smoke 測試。
- `pnpm openclaw qa matrix`
  - 對一次性 Docker 後端 Tuwunel homeserver 執行 Matrix 即時 QA lane。僅限原始碼 checkout，封裝安裝不會交付 `qa-lab`。
  - 完整 CLI、profile/scenario catalog、env vars 與 Artifact 配置：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自 env 的 driver 與 SUT bot token，對真實私人群組執行 Telegram 即時 QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群組 ID 必須是數字 Telegram chat ID。
  - 支援 `--credential-source convex` 以使用共用池化憑證。預設使用 env 模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選擇加入池化 lease。
  - 當任何 scenario 失敗時會以非零狀態結束。若想取得 Artifact 但不讓結束碼失敗，請使用 `--allow-failures`。
  - 需要同一個私人群組中的兩個不同 bot，且 SUT bot 必須公開 Telegram 使用者名稱。
  - 為了穩定的 bot 對 bot 觀察，請在 `@BotFather` 中為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確認 driver bot 可以觀察群組 bot 流量。
  - 會在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA 報告、摘要與 observed-messages Artifact。回覆 scenario 包含從 driver 傳送請求到觀察到 SUT 回覆的 RTT。

即時傳輸 lane 共用一個標準合約，讓新傳輸不會偏移；每個 lane 的涵蓋矩陣位於 [QA 概覽 → 即時傳輸涵蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的合成套件，不屬於該矩陣。

### 透過 Convex 共用 Telegram 憑證 (v1)

當為 `openclaw qa telegram` 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex 後端池取得獨占 lease，在 lane 執行期間對該 lease 傳送 Heartbeat，並在關閉時釋放 lease。

參考 Convex 專案 scaffold：

- `qa/convex-credential-broker/`

必要 env vars：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 針對選取角色的一個 secret：
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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用 trace ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許僅限本機開發使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

Maintainer 管理命令（pool add/remove/list）特別需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

Maintainer 可用的 CLI helper：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時執行前使用 `doctor` 檢查 Convex site URL、broker secret、endpoint prefix、HTTP timeout 與 admin/list 可達性，而不列印 secret 值。在腳本和 CI 工具中使用 `--json` 取得機器可讀輸出。

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

Telegram kind 的 payload 形狀：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字 Telegram chat ID 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證此形狀，並拒絕格式錯誤的 payload。

### 將 channel 加入 QA

新 channel adapter 的架構與 scenario-helper 名稱位於 [QA 概覽 → 加入 channel](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低標準：在共用 `qa-lab` host seam 上實作 transport runner，在 Plugin manifest 中宣告 `qaRunners`，掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下編寫 scenario。

## 測試套件（何處執行何者）

可將這些套件視為「真實度逐步提高」（同時 flakiness/成本也逐步提高）：

### Unit / integration（預設）

- Command: `pnpm test`
- Config: 非目標式執行會使用 `vitest.full-*.config.ts` shard set，並可能將多專案 shard 展開為逐專案設定，以便平行排程
- Files: `src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的 core/unit inventory；UI unit test 會在專用 `unit-ui` shard 中執行
- Scope:
  - 純 unit test
  - 同處理程序 integration test（Gateway auth、routing、tooling、parsing、config）
  - 已知 bug 的確定性 regression
- Expectations:
  - 在 CI 中執行
  - 不需要真實 key
  - 應快速且穩定
  - Resolver 與公開表面 loader test 必須使用產生的微型 Plugin fixture 證明廣泛 `api.js` 與 `runtime-api.js` fallback 行為，而不是使用真實內建 Plugin 原始碼 API。真實 Plugin API 載入應屬於 Plugin 擁有的 contract/integration suite。

<AccordionGroup>
  <Accordion title="專案、shard 與範圍化 lane">

    - 未指定目標的 `pnpm test` 會執行十二個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個龐大的原生根專案程序。這會降低高負載機器上的峰值 RSS，並避免 auto-reply/extension 工作讓無關套件得不到資源。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片 watch 迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過作用域 lane 路由明確的檔案/目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免付出完整根專案啟動成本。
    - `pnpm test:changed` 預設會把已變更的 git 路徑展開成成本低的作用域 lane：直接測試編輯、同層 `*.test.ts` 檔案、明確的原始碼映射，以及本機匯入圖相依項。設定/setup/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的標準智慧本機檢查 gate。它會將 diff 分類為核心、核心測試、extensions、extension 測試、apps、docs、release metadata、即時 Docker 工具和 tooling，然後執行相符的 typecheck、lint 和 guard 命令。它不會執行 Vitest 測試；若要測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅 release metadata 的版本 bump 會執行目標式版本/config/root-dependency 檢查，並有 guard 拒絕 top-level version 欄位以外的 package 變更。
    - 即時 Docker ACP harness 編輯會執行聚焦檢查：即時 Docker auth scripts 的 shell 語法，以及即時 Docker scheduler dry-run。只有當 diff 限於 `scripts["test:docker:live-*"]` 時才會包含 `package.json` 變更；dependency、export、version 和其他 package-surface 編輯仍使用較廣泛的 guard。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純工具區域的輕匯入單元測試，會透過 `unit-fast` lane 路由，該 lane 會略過 `test/setup-openclaw-runtime.ts`；有狀態/重 runtime 的檔案則保留在既有 lane。
    - 選定的 `plugin-sdk` 和 `commands` helper 原始碼檔案也會將 changed-mode 執行映射到這些輕量 lane 中的明確同層測試，因此 helper 編輯可避免重新執行該目錄完整的重型套件。
    - `auto-reply` 對頂層核心 helper、頂層 `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹有專用 bucket。CI 進一步將 reply 子樹拆分為 agent-runner、dispatch 和 commands/state-routing 分片，讓單一匯入繁重的 bucket 不會占用完整 Node 尾端時間。
    - 一般 PR/main CI 會刻意略過 extension 批次掃描和僅 release 用的 `agentic-plugins` 分片。完整 Release Validation 會針對 release candidates 派發獨立的 `Plugin Prerelease` 子工作流程，以執行那些 plugin/extension-heavy 套件。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - 當你變更 message-tool 探索輸入或 compaction runtime
      context 時，請保留兩個層級的涵蓋範圍。
    - 為純路由和正規化邊界新增聚焦的 helper 迴歸測試。
    - 維持嵌入式執行器整合套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證作用域 id 和 compaction 行為仍會流經真正的
      `run.ts` / `compact.ts` 路徑；僅 helper 的測試不足以取代那些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - 基礎 Vitest config 預設為 `threads`。
    - 共用 Vitest config 固定 `isolate: false`，並在根專案、e2e 和 live configs 中使用
      非隔離 runner。
    - 根 UI lane 保留其 `jsdom` setup 和 optimizer，但同樣在
      共用非隔離 runner 上執行。
    - 每個 `pnpm test` 分片都會從共用 Vitest config 繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest child Node
      processes 加上 `--no-maglev`，以降低大型本機執行期間的 V8 編譯耗損。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與標準 V8
      行為比較。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構 lane。
    - pre-commit hook 僅處理格式化。它會重新 stage 已格式化檔案，
      不會執行 lint、typecheck 或測試。
    - 當你需要智慧本機檢查 gate 時，請在交接或 push 前明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過成本低的作用域 lane 路由。只有當 agent
      判定 harness、config、package 或 contract 編輯確實需要更廣泛的
      Vitest 涵蓋範圍時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同路由
      行為，只是 worker 上限較高。
    - 本機 worker 自動擴縮刻意保守，並會在主機 load average 已經偏高時退避，
      因此多個並行 Vitest 執行預設造成的影響較小。
    - 基礎 Vitest config 將 projects/config files 標記為
      `forceRerunTriggers`，因此測試 wiring 變更時，changed-mode 重新執行仍保持正確。
    - config 會在支援的主機上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      如果你想為直接 profiling 使用單一明確快取位置，請設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` 會啟用 Vitest 匯入耗時報告，加上
      匯入細項輸出。
    - `pnpm test:perf:imports:changed` 會把相同的 profiling 視圖限定到
      自 `origin/main` 以來變更的檔案。
    - 分片計時資料會寫入 `.artifacts/vitest-shard-timings.json`。
      Whole-config 執行會使用 config path 作為 key；include-pattern CI
      分片會附加分片名稱，讓已篩選分片可分開追蹤。
    - 當某個 hot test 仍把大部分時間花在啟動匯入時，
      請把重型相依項放在狹窄本機 `*.runtime.ts` seam 後面，
      並直接 mock 該 seam，而不是只為了傳入 `vi.mock(...)`
      就深層匯入 runtime helpers。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會將路由後的
      `test:changed` 與該已提交 diff 的原生根專案路徑比較，
      並列印 wall time 加 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 和根 Vitest config 路由 changed file list，
      來 benchmark 目前的 dirty tree。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite 啟動和 transform overhead 寫入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用檔案平行處理時，為
      單元套件寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 穩定性（Gateway）

- 命令：`pnpm test:stability:gateway`
- Config：`vitest.gateway.config.ts`，強制使用一個 worker
- 範圍：
  - 預設啟用 diagnostics，啟動真正的 loopback Gateway
  - 透過 diagnostic event path 驅動 synthetic gateway message、memory 和 large-payload churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 涵蓋 diagnostic stability bundle persistence helpers
  - 斷言 recorder 仍受限、synthetic RSS samples 維持在 pressure budget 以下，且 per-session queue depths 會排空回到零
- 預期：
  - CI 安全且不需要 key
  - 用於 stability-regression 後續處理的窄 lane，不是完整 Gateway 套件的替代品

### E2E（Gateway smoke）

- 命令：`pnpm test:e2e`
- Config：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的 bundled-plugin E2E tests
- Runtime 預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用 adaptive workers（CI：最多 2，本機：預設 1）。
  - 預設以 silent mode 執行，以降低 console I/O overhead。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 可強制 worker count（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 可重新啟用 verbose console output。
- 範圍：
  - 多實例 gateway 端到端行為
  - WebSocket/HTTP surfaces、node pairing，以及較重的 networking
- 預期：
  - 在 CI 中執行（當 pipeline 啟用時）
  - 不需要真實 key
  - 比單元測試有更多移動部件（可能較慢）

### E2E：OpenShell backend smoke

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 透過 Docker 在主機上啟動隔離的 OpenShell gateway
  - 從臨時本機 Dockerfile 建立 sandbox
  - 透過真實的 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell backend
  - 透過 sandbox fs bridge 驗證 remote-canonical filesystem 行為
- 預期：
  - 僅 opt-in；不屬於預設 `pnpm test:e2e` 執行
  - 需要本機 `openshell` CLI 加上可運作的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀測試 gateway 和 sandbox
- 實用覆寫：
  - 手動執行較廣泛的 e2e 套件時，可用 `OPENCLAW_E2E_OPENSHELL=1` 啟用測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 可指向非預設 CLI binary 或 wrapper script

### Live（真實 providers + 真實 models）

- 命令：`pnpm test:live`
- Config：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的 bundled-plugin live tests
- 預設：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個 provider/model _今天_ 搭配真實 creds 是否真的可用？」
  - 捕捉 provider format changes、tool-calling quirks、auth issues 和 rate limit behavior
- 預期：
  - 設計上不保證 CI 穩定（真實 networks、真實 provider policies、quotas、outages）
  - 會花錢 / 使用 rate limits
  - 偏好執行較窄子集，而不是「全部」
- Live 執行會 source `~/.profile` 以取得遺漏的 API keys。
- 預設情況下，live 執行仍會隔離 `HOME`，並將 config/auth material 複製到臨時測試 home，使單元 fixtures 無法修改你的真實 `~/.openclaw`。
- 只有當你刻意需要 live tests 使用真實 home directory 時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設為較安靜的模式：它保留 `[live] ...` progress output，但會隱藏額外的 `~/.profile` notice，並靜音 gateway bootstrap logs/Bonjour chatter。如果你想要完整 startup logs 回來，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key rotation（provider-specific）：使用逗號/分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 設定 per-live override；測試會在 rate limit responses 時重試。
- Progress/heartbeat output：
  - Live suites 現在會將 progress lines 輸出到 stderr，因此即使 Vitest console capture 安靜時，長時間 provider calls 也會可見地保持活動。
  - `vitest.live.config.ts` 會停用 Vitest console interception，因此 provider/gateway progress lines 會在 live runs 期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整 direct-model heartbeats。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 gateway/probe heartbeats。

## 我應該執行哪個套件？

使用此決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你改了很多內容，也執行 `pnpm test:coverage`）
- 觸及 Gateway 網路 / WS 協定 / 配對：加入 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ 提供者特定失敗 / 工具呼叫：執行範圍縮小的 `pnpm test:live`

## 即時（會觸及網路的）測試

關於即時模型矩陣、CLI 後端冒煙測試、ACP 冒煙測試、Codex 應用伺服器測試框架，以及所有媒體提供者即時測試（Deepgram、BytePlus、ComfyUI、圖片、音樂、影片、媒體測試框架），再加上即時執行的憑證處理，請參閱
[測試 — 即時套件](/zh-TW/help/testing-live)。

## Docker 執行器（選用的「可在 Linux 運作」檢查）

這些 Docker 執行器分成兩類：

- 即時模型執行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker 映像內執行各自符合設定檔鍵的即時檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），並掛載你的本機設定目錄與工作區（若有掛載，也會載入 `~/.profile`）。對應的本機進入點是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 即時執行器預設採用較小的冒煙上限，讓完整 Docker 掃描仍然實用：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明確想要較大的完整掃描時，才覆寫這些環境變數。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置一次即時 Docker 映像，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包一次為 npm tarball，然後建置/重用兩個 `scripts/e2e/Dockerfile` 映像。裸映像只是用於安裝/更新/Plugin 相依性 lane 的 Node/Git 執行器；這些 lane 會掛載預先建置的 tarball。功能映像會將同一個 tarball 安裝到 `/app`，用於已建置應用程式功能 lane。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選取的計畫。彙總流程使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序槽位，而資源上限會避免繁重的即時、npm 安裝與多服務 lane 同時全部啟動。如果單一 lane 比作用中的上限更重，排程器仍可在集區為空時啟動它，並讓它單獨執行，直到再次有容量可用。預設值為 10 個槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。執行器預設會執行 Docker 預檢、移除過期的 OpenClaw E2E 容器、每 30 秒列印狀態、將成功 lane 的時間記錄儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行時利用這些時間記錄先啟動較長的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印加權 lane 清單，而不建置或執行 Docker；或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lane、套件/映像需求與憑證的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生的套件 gate，用來回答「這個可安裝的 tarball 作為產品是否可用？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析出一個候選套件，將其上傳為 `package-under-test`，然後針對該確切 tarball 執行可重用的 Docker E2E lane，而不是重新打包所選 ref。`workflow_ref` 選取受信任的 workflow/測試框架腳本，而 `package_ref` 會在 `source=ref` 時選取要打包的來源 commit/branch/tag；這讓目前的驗收邏輯能驗證較舊的受信任 commit。設定檔依涵蓋廣度排序：`smoke` 是快速安裝/channel/agent 加上 Gateway/設定，`package` 是套件/更新/Plugin 合約，也是大多數 Parallels 套件/更新涵蓋範圍的預設原生替代項，`product` 加入 MCP channels、cron/subagent 清理、OpenAI web search 和 OpenWebUI，而 `full` 會執行含 OpenWebUI 的發行路徑 Docker 區塊。發行驗證會執行自訂套件差異（`bundled-channel-deps-compat plugins-offline`）加上 Telegram 套件 QA，因為發行路徑 Docker 區塊已涵蓋重疊的套件/更新/Plugin lane。從成品產生的目標 GitHub Docker 重新執行命令，在可用時會包含先前的套件成品與已準備映像輸入，因此失敗的 lane 可以避免重新建置套件與映像。
- 建置與發行檢查會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。該 guard 會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪靜態建置圖，若在命令分派前的啟動流程匯入 Commander、prompt UI、undici 或 logging 等套件相依性，就會失敗；它也會讓 bundled Gateway run chunk 維持在預算內，並拒絕靜態匯入已知的 cold Gateway 路徑。封裝後的 CLI 冒煙測試也涵蓋 root help、onboard help、doctor help、status、config schema 和 model-list 命令。
- Package Acceptance 舊版相容性上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點之前，測試框架只容忍已出貨套件的中繼資料缺口：省略的私有 QA inventory entries、缺少 `gateway install --wrapper`、tarball 衍生 git fixture 中缺少 patch 檔、缺少持久化的 `update.channel`、舊版 Plugin install-record 位置、缺少 marketplace install-record 持久化，以及 `plugins update` 期間的設定中繼資料遷移。對於 `2026.4.25` 之後的套件，這些路徑都是嚴格失敗。
- 容器冒煙執行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 會啟動一個或多個真實容器，並驗證較高層級的整合路徑。

即時模型 Docker 執行器也只會 bind-mount 需要的 CLI auth homes（或在執行未縮小範圍時掛載所有支援的 auth homes），然後在執行前將它們複製到容器 home，讓外部 CLI OAuth 可以重新整理 token，而不會變更主機 auth store：

- 直接模型：`pnpm test:docker:live-models`（指令碼：`scripts/test-live-models-docker.sh`）
- ACP 繫結冒煙測試：`pnpm test:docker:live-acp-bind`（指令碼：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 與 `pnpm test:docker:live-acp-bind:opencode` 提供嚴格的 Droid/OpenCode 覆蓋）
- CLI 後端冒煙測試：`pnpm test:docker:live-cli-backend`（指令碼：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒煙測試：`pnpm test:docker:live-codex-harness`（指令碼：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開發代理：`pnpm test:docker:live-gateway`（指令碼：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性冒煙測試：`pnpm qa:otel:smoke` 是私有 QA 原始碼 checkout 路徑。它刻意不屬於套件 Docker 發行路徑，因為 npm tarball 省略 QA Lab。
- Open WebUI 即時冒煙測試：`pnpm test:docker:openwebui`（指令碼：`scripts/e2e/openwebui-docker.sh`）
- Onboarding 精靈（TTY、完整鷹架）：`pnpm test:docker:onboard`（指令碼：`scripts/e2e/onboard-docker.sh`）
- Npm tarball onboarding/channel/agent 冒煙測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝已打包的 OpenClaw tarball，透過 env-ref onboarding 設定 OpenAI，並預設設定 Telegram，驗證 doctor 修復已啟用 Plugin 的執行階段依賴項，並執行一次模擬的 OpenAI 代理回合。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳過主機重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切換通道。
- 更新通道切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝已打包的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證已保存的通道與 Plugin 更新後運作，接著切回套件 `stable` 並檢查更新狀態。
- 工作階段執行階段內容冒煙測試：`pnpm test:docker:session-runtime-context` 驗證隱藏執行階段內容 transcript 持久化，以及 doctor 對受影響的重複 prompt-rewrite 分支進行修復。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會打包目前樹狀結構，在隔離的 home 中用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 回傳內建影像提供者而不是卡住。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳過主機建置，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- 安裝器 Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm 容器之間共用一個 npm 快取。更新冒煙測試預設使用 npm `latest` 作為升級到候選 tarball 前的穩定基準。在本機用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上用 Install Smoke workflow 的 `update_baseline_version` 輸入覆寫。非 root 安裝器檢查會保留隔離的 npm 快取，避免 root 擁有的快取項目掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 以在本機重跑時重用 root/update/direct-npm 快取。
- Install Smoke CI 使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳過重複的 direct-npm 全域更新；需要直接 `npm install -g` 覆蓋時，在本機不帶該 env 執行指令碼。
- Agents 刪除共用工作區 CLI 冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（指令碼：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設建置根 Dockerfile 映像，在隔離容器 home 中植入兩個代理與一個工作區，執行 `agents delete --json`，並驗證有效 JSON 與工作區保留行為。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke 映像。
- Gateway 網路（兩個容器、WS 驗證 + 健康狀態）：`pnpm test:docker:gateway-network`（指令碼：`scripts/e2e/gateway-network-docker.sh`）
- 瀏覽器 CDP snapshot 冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（指令碼：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置原始碼 E2E 映像加上一層 Chromium，使用原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP role snapshot 涵蓋連結 URL、cursor-promoted 可點擊項目、iframe refs 和 frame 中繼資料。
- OpenAI Responses web_search minimal reasoning 迴歸：`pnpm test:docker:openai-web-search-minimal`（指令碼：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行模擬的 OpenAI 伺服器，驗證 `web_search` 將 `reasoning.effort` 從 `minimal` 提升到 `low`，接著強制提供者 schema 拒絕，並檢查原始 detail 出現在 Gateway 記錄中。
- MCP 通道 bridge（植入資料的 Gateway + stdio bridge + 原始 Claude notification-frame 冒煙測試）：`pnpm test:docker:mcp-channels`（指令碼：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真實 stdio MCP 伺服器 + 內嵌 Pi profile allow/deny 冒煙測試）：`pnpm test:docker:pi-bundle-mcp-tools`（指令碼：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真實 Gateway + 在隔離 cron 與一次性 subagent 執行後拆除 stdio MCP 子程序）：`pnpm test:docker:cron-mcp-cleanup`（指令碼：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（安裝冒煙測試、ClawHub kitchen-sink 安裝/解除安裝、市集更新，以及 Claude-bundle 啟用/檢查）：`pnpm test:docker:plugins`（指令碼：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 以跳過 ClawHub 區塊，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的 kitchen-sink 套件/執行階段組合。沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` 時，測試會使用 hermetic 本機 ClawHub fixture 伺服器。
- Plugin 更新未變更冒煙測試：`pnpm test:docker:plugin-update`（指令碼：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 設定重新載入中繼資料冒煙測試：`pnpm test:docker:config-reload`（指令碼：`scripts/e2e/config-reload-source-docker.sh`）
- 內建 Plugin 執行階段依賴項：`pnpm test:docker:bundled-channel-deps` 預設建置小型 Docker runner 映像，在主機上建置並打包 OpenClaw 一次，接著將該 tarball 掛載到每個 Linux 安裝情境中。使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 重用映像，在新的本機建置後用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳過主機重建，或用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向現有 tarball。完整 Docker 彙總與 release-path 內建通道 chunk 會先預先打包此 tarball 一次，接著將內建通道檢查分片成獨立路徑，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的個別更新路徑。發行 chunk 會將通道冒煙測試、更新目標，以及設定/執行階段合約拆分為 `bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`；彙總 `bundled-channels` chunk 仍可供手動重跑。發行 workflow 也會拆分提供者安裝器 chunk 和內建 Plugin 安裝/解除安裝 chunk；舊版 `package-update`、`plugins-runtime` 和 `plugins-integrations` chunk 仍作為手動重跑的彙總別名保留。直接執行內建路徑時，使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 縮小通道矩陣，或使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 縮小更新情境。每個情境的 Docker 執行預設為 `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`；多目標更新情境預設為 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`。此路徑也會驗證 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 會抑制 doctor/執行階段依賴項修復。
- 迭代時可透過停用無關情境來縮小內建 Plugin 執行階段依賴項，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

若要手動預建並重用共用功能映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定時，像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 這類套件專用映像覆寫仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，如果本機尚未存在，指令碼會拉取它。QR 與安裝器 Docker 測試保留各自的 Dockerfile，因為它們驗證的是套件/安裝行為，而不是共用已建置應用程式執行階段。

即時模型 Docker runner 也會以唯讀方式 bind-mount 目前 checkout，並
在容器內將它 staging 到暫存工作目錄。這能讓執行階段
映像保持精簡，同時仍針對你的確切本機原始碼/設定執行 Vitest。
staging 步驟會跳過大型本機專用快取和應用程式建置輸出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及應用程式本機 `.build` 或
Gradle 輸出目錄，讓 Docker 即時執行不會花數分鐘複製
機器專用 artifacts。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此 Gateway 即時探測不會在容器內啟動
真正的 Telegram/Discord 等通道 worker。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要從該 Docker 路徑縮小或排除 Gateway
即時覆蓋時，也要傳入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高層級的相容性冒煙測試：它會啟動一個
已啟用 OpenAI-compatible HTTP endpoints 的 OpenClaw gateway 容器，
啟動一個固定版本的 Open WebUI 容器並連到該 gateway，透過
Open WebUI 登入，驗證 `/api/models` 暴露 `openclaw/default`，接著透過 Open WebUI 的 `/api/chat/completions` 代理傳送
真實聊天請求。
第一次執行可能明顯較慢，因為 Docker 可能需要拉取
Open WebUI 映像，而 Open WebUI 可能需要完成自己的 cold-start 設定。
此路徑需要可用的即時模型 key，而 `OPENCLAW_PROFILE_FILE`
（預設為 `~/.profile`）是在 Docker 化執行中提供它的主要方式。
成功執行會列印一小段 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意保持決定性，且不需要
真正的 Telegram、Discord 或 iMessage 帳號。它會啟動植入資料的 Gateway
容器，啟動第二個容器產生 `openclaw mcp serve`，接著
驗證 routed conversation discovery、transcript 讀取、attachment 中繼資料、
live event queue 行為、outbound send routing，以及透過真實 stdio MCP bridge 傳遞的 Claude 風格通道 +
權限通知。notification 檢查會直接檢查原始 stdio MCP frame，因此冒煙測試驗證的是
bridge 實際 emit 的內容，而不只是特定 client SDK 剛好呈現的內容。
`test:docker:pi-bundle-mcp-tools` 具決定性，且不需要即時
模型 key。它會建置 repo Docker 映像，在容器內啟動真實 stdio MCP probe server，
透過內嵌 Pi bundle MCP 執行階段 materialize 該伺服器，
執行工具，接著驗證 `coding` 和 `messaging` 保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 會過濾它們。
`test:docker:cron-mcp-cleanup` 具決定性，且不需要即時模型
key。它會啟動帶有真實 stdio MCP probe server 的植入資料 Gateway，執行
隔離的 cron 回合與 `/subagents spawn` 一次性子回合，接著驗證
MCP 子程序會在每次執行後退出。

手動 ACP 自然語言 thread 冒煙測試（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此腳本供迴歸/除錯工作流程使用。ACP thread 路由驗證之後可能還會再次需要它，因此不要刪除。

實用的環境變數：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）掛載到 `/home/node/.profile`，並在執行測試前載入
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 僅驗證從 `OPENCLAW_PROFILE_FILE` 載入的環境變數，使用暫存的設定/工作區目錄，且不掛載外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）掛載到 `/home/node/.npm-global`，供 Docker 內快取 CLI 安裝使用
- `$HOME` 下的外部 CLI auth 目錄/檔案會以唯讀方式掛載到 `/host-auth...` 下，然後在測試開始前複製到 `/home/node/...`
  - 預設目錄：`.minimax`
  - 預設檔案：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 縮小範圍的 provider 執行只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要目錄/檔案
  - 使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的逗號清單手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於篩選容器內的 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用於在不需要重新建置的重跑中重用既有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保憑證來自 profile store（而非環境變數）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇 Gateway 為 Open WebUI smoke 暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI smoke 使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用於覆寫固定的 Open WebUI 映像標籤

## 文件健全性檢查

文件編輯後執行文件檢查：`pnpm check:docs`。
當你也需要頁內標題檢查時，執行完整的 Mintlify anchor 驗證：`pnpm docs:check-links:anchors`。

## 離線迴歸（CI 安全）

這些是不使用真實 providers 的「真實 pipeline」迴歸：

- Gateway tool calling（mock OpenAI，真實 Gateway + agent loop）：`src/gateway/gateway.test.ts`（案例：「透過 Gateway agent loop 端對端執行 mock OpenAI tool call」）
- Gateway wizard（WS `wizard.start`/`wizard.next`，寫入設定 + 強制 auth）：`src/gateway/gateway.test.ts`（案例：「透過 ws 執行 wizard 並寫入 auth token 設定」）

## Agent 可靠性評估（Skills）

我們已經有幾個 CI 安全測試，其行為類似「agent 可靠性評估」：

- 透過真實 Gateway + agent loop 進行 mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 與設定效果的端對端 wizard flows（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（見 [Skills](/zh-TW/tools/skills)）：

- **決策：** 當 prompt 中列出 Skills 時，agent 是否會選擇正確的 skill（或避開不相關的項目）？
- **合規：** agent 是否會在使用前讀取 `SKILL.md`，並遵循必要步驟/參數？
- **工作流程契約：** 多回合情境，用於斷言 tool 順序、session history carryover 與 sandbox 邊界。

未來的評估應先保持決定性：

- 使用 mock providers 的情境 runner，用來斷言 tool calls + 順序、skill 檔案讀取，以及 session wiring。
- 一小組聚焦於 skill 的情境（使用 vs 避免、gating、prompt injection）。
- 選用的 live evals（opt-in、env-gated）僅在 CI 安全套件到位後加入。

## 契約測試（Plugin 與通道形狀）

契約測試會驗證每個已註冊的 Plugin 與通道都符合其介面契約。它們會逐一檢查所有探索到的 plugins，並執行一組形狀與行為斷言。預設的 `pnpm test` unit lane 會刻意略過這些 shared seam 與 smoke 檔案；當你觸及共用通道或 provider surfaces 時，請明確執行契約命令。

### 命令

- 所有契約：`pnpm test:contracts`
- 僅通道契約：`pnpm test:contracts:channels`
- 僅 provider 契約：`pnpm test:contracts:plugins`

### 通道契約

位於 `src/channels/plugins/contracts/*.contract.test.ts`：

- **Plugin** - 基本 Plugin 形狀（id、name、capabilities）
- **setup** - 設定 wizard 契約
- **session-binding** - Session binding 行為
- **outbound-payload** - 訊息 payload 結構
- **inbound** - Inbound 訊息處理
- **actions** - 通道 action handlers
- **threading** - Thread ID 處理
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider 狀態契約

位於 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 通道狀態 probes
- **registry** - Plugin registry 形狀

### Provider 契約

位於 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - Auth flow 契約
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin 形狀/介面
- **wizard** - 設定 wizard

### 執行時機

- 變更 plugin-sdk exports 或 subpaths 後
- 新增或修改通道或 provider Plugin 後
- 重構 Plugin registration 或 discovery 後

契約測試會在 CI 中執行，且不需要真實 API keys。

## 新增迴歸（指引）

當你修正 live 中發現的 provider/model 問題時：

- 盡可能新增 CI 安全迴歸（mock/stub provider，或捕捉確切的 request-shape 轉換）
- 如果本質上只能 live-only（rate limits、auth policies），請保持 live test 範圍狹窄，並透過環境變數 opt-in
- 優先鎖定能捕捉該 bug 的最小層級：
  - provider request conversion/replay bug → 直接的 models test
  - Gateway session/history/tool pipeline bug → Gateway live smoke 或 CI 安全 Gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class 推導一個 sampled target，然後斷言 traversal-segment exec ids 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增 `includeInPlan` SecretRef target family，請更新該測試中的 `classifyTargetClass`。此測試會刻意在未分類的 target ids 上失敗，讓新的 classes 無法被靜默略過。

## 相關

- [Live 測試](/zh-TW/help/testing-live)
- [CI](/zh-TW/ci)
