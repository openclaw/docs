---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/提供者錯誤新增回歸測試
    - 偵錯 Gateway + 代理程式行為
summary: 測試工具包：單元/e2e/實際環境套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-05-01T02:44:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: f663a4476a59e4ccc2a6ea5b43eb0079534945eac37374bec891d6cccb1e941c
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三組 Vitest 測試套件（單元/整合、e2e、實際測試）以及一小組
Docker runner。本文件是「我們如何測試」指南：

- 每個套件涵蓋哪些內容（以及刻意_不_涵蓋哪些內容）。
- 常見工作流程（本機、推送前、除錯）該執行哪些指令。
- 實際測試如何探索認證資料並選取模型/供應商。
- 如何為真實世界的模型/供應商問題新增迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、實際傳輸通道）**另有文件說明：

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) — 架構、指令介面、情境撰寫。
- [矩陣 QA](/zh-TW/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的參考資料。
- [QA channel](/zh-TW/channels/qa-channel) — repo-backed 情境使用的合成傳輸 Plugin。

本頁涵蓋執行一般測試套件與 Docker/Parallels runner。下方的 QA 專用 runner 區段（[QA-specific runners](#qa-specific-runners)）列出具體的 `qa` 呼叫方式，並指回上述參考資料。
</Note>

## 快速開始

多數日子：

- 完整閘門（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足的機器上較快執行本機完整套件：`pnpm test:max`
- 直接 Vitest watch 迴圈：`pnpm test:watch`
- 直接指定檔案現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在針對單一失敗反覆修改時，優先使用目標式執行。
- Docker-backed QA 站台：`pnpm qa:lab:up`
- Linux VM-backed QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你碰到測試或想要額外信心時：

- 覆蓋率閘門：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

當除錯真實供應商/模型時（需要真實認證資料）：

- 實際測試套件（模型 + Gateway 工具/圖片探測）：`pnpm test:live`
- 安靜地鎖定一個實際測試檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker 實際模型掃描：`pnpm test:docker:live-models`
  - 每個選取的模型現在都會執行一輪文字對話，加上一個小型檔案讀取風格探測。
    其 metadata 宣告 `image` 輸入的模型也會執行一個極小的圖片對話。
    隔離供應商失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋範圍：每日 `OpenClaw Scheduled Live And E2E Checks` 和手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用的實際/E2E workflow，其中包含依供應商分片的獨立 Docker 實際模型
    矩陣 jobs。
  - 若要聚焦 CI 重新執行，請以 `include_live_suites: true` 和 `live_models_only: true` dispatch `OpenClaw Live And E2E Checks (Reusable)`。
  - 將新的高訊號供應商 secrets 加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和它的
    排程/發行呼叫端。
- 原生 Codex bound-chat smoke：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行一個 Docker 實際通道，使用 `/codex bind` 綁定合成
    Slack DM，執行 `/codex fast` 和
    `/codex permissions`，然後驗證純文字回覆與圖片附件會透過原生 Plugin binding 路由，而不是 ACP。
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`
  - 透過 Plugin 所有的 Codex app-server harness 執行 Gateway agent turns，
    驗證 `/codex status` 和 `/codex models`，並且預設執行圖片、
    cron MCP、sub-agent 與 Guardian 探測。隔離其他 Codex
    app-server 失敗時，可用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用 sub-agent 探測。若要聚焦 sub-agent 檢查，請停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則這會在 sub-agent 探測後結束。
- Crestodian rescue command smoke：`pnpm test:live:crestodian-rescue-channel`
  - 針對 message-channel rescue command
    介面的 opt-in belt-and-suspenders 檢查。它會執行 `/crestodian status`、排入持久模型
    變更、回覆 `/crestodian yes`，並驗證稽核/config 寫入路徑。
- Crestodian planner Docker smoke：`pnpm test:docker:crestodian-planner`
  - 在 configless 容器中執行 Crestodian，`PATH` 上有 fake Claude CLI，
    並驗證模糊 planner fallback 會轉換成已稽核的 typed
    config 寫入。
- Crestodian first-run Docker smoke：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw state dir 開始，將裸 `openclaw` 路由到
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入，
    驗證 config，並驗證稽核項目。同一個 Ring 0 設定路徑
    也在 QA Lab 中由
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆蓋。
- Moonshot/Kimi cost smoke：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，然後針對 `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先使用下方描述的 allowlist env vars 縮小實際測試範圍。
</Tip>

## QA 專用 runner

當你需要 QA-lab 的真實感時，這些指令位於主要測試套件旁：

CI 在專用 workflow 中執行 QA Lab。`Parity gate` 會在相符 PR 上執行，也可透過手動 dispatch 搭配 mock providers 執行。`QA-Lab - All Lanes` 每晚在
`main` 上執行，也可由手動 dispatch 執行，並將 mock parity gate、實際 Matrix 通道、
Convex-managed 實際 Telegram 通道，以及 Convex-managed 實際 Discord 通道作為
平行 jobs。排程 QA 和發行檢查會明確傳入 Matrix `--profile fast`，
而 Matrix CLI 與手動 workflow input 的預設值仍是
`all`；手動 dispatch 可將 `all` 分片為 `transport`、`media`、`e2ee-smoke`、
`e2ee-deep` 和 `e2ee-cli` jobs。`OpenClaw Release Checks` 在發行核准前執行 parity 加上
快速 Matrix 與 Telegram 通道，並使用
`mock-openai/gpt-5.5` 做發行傳輸檢查，讓它們保持 deterministic
並避免一般 provider-plugin startup。這些實際傳輸 gateways 會停用
memory search；memory 行為仍由 QA parity suites 覆蓋。

完整發行實際 media shards 使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 和 `ffprobe`。Docker 實際模型/backend shards 使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像，該映像會針對每個選取的
commit 建置一次，然後用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在每個 shard 裡重新建置。

- `pnpm openclaw qa suite`
  - 直接在 host 上執行 repo-backed QA 情境。
  - 預設以隔離的 gateway workers 平行執行多個選取的情境。
    `qa-channel` 預設 concurrency 為 4（受選取的 scenario count 限制）。使用 `--concurrency <count>` 調整 worker
    數量，或用 `--concurrency 1` 執行較舊的 serial 通道。
  - 任何情境失敗時以非零狀態結束。當你想要 artifacts 但不想要失敗 exit code 時，使用 `--allow-failures`。
  - 支援 provider modes `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 會啟動本機 AIMock-backed provider server，用於實驗性
    fixture 與 protocol-mock 覆蓋範圍，而不取代 scenario-aware
    `mock-openai` 通道。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 gateway startup bench 加上一小包 mock QA Lab 情境
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），並在 `.artifacts/gateway-cpu-scenarios/` 下寫入合併的 CPU observation
    summary。
  - 預設只標記持續性的 hot CPU observations（`--cpu-core-warn`
    加上 `--hot-wall-warn-ms`），因此短暫 startup bursts 會被記錄為 metrics，
    不會看起來像是持續數分鐘的 gateway peg regression。
  - 使用已建置的 `dist` artifacts；當 checkout 還沒有新的 runtime output 時，請先執行 build。
- `pnpm openclaw qa suite --runner multipass`
  - 在 disposable Multipass Linux VM 中執行同一組 QA 套件。
  - 保持與 host 上 `qa suite` 相同的情境選取行為。
  - 重用與 `qa suite` 相同的 provider/model selection flags。
  - 實際執行會 forward 對 guest 實用且受支援的 QA auth inputs：
    env-based provider keys、QA live provider config path，以及存在時的 `CODEX_HOME`。
  - Output dirs 必須保持在 repo root 底下，讓 guest 能透過
    mounted workspace 寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA report + summary 以及 Multipass logs。
- `pnpm qa:lab:up`
  - 啟動 Docker-backed QA 站台，用於 operator-style QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball，在
    Docker 中全域安裝它，執行非互動式 OpenAI API-key onboarding，預設設定 Telegram，
    驗證啟用 Plugin 會按需安裝 runtime dependencies，執行 doctor，
    並針對 mocked OpenAI endpoint 執行一次本機 agent turn。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行同一個 packaged-install
    通道。
- `pnpm test:docker:session-runtime-context`
  - 針對 embedded runtime context
    transcripts 執行 deterministic built-app Docker smoke。它會驗證隱藏的 OpenClaw runtime context 會以
    non-display custom message 持久化，而不是洩漏到可見的 user turn 中，
    接著植入受影響的 broken session JSONL，並驗證
    `openclaw doctor --fix` 會將它重寫到 active branch 且建立 backup。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw package candidate，執行 installed-package
    onboarding，透過已安裝的 CLI 設定 Telegram，接著重用
    實際 Telegram QA 通道，並將該已安裝 package 作為 SUT Gateway。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而不是
    從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env credentials 或 Convex credential source。針對 CI/發行自動化，設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` 加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 role secret。如果
    `OPENCLAW_QA_CONVEX_SITE_URL` 與 Convex role secret 存在於 CI，
    Docker wrapper 會自動選取 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此通道覆寫共享的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 將此通道公開為手動 maintainer workflow
    `NPM Telegram Beta E2E`。它不會在 merge 時執行。該 workflow 使用
    `qa-live-shared` environment 與 Convex CI credential leases。
- GitHub Actions 也公開 `Package Acceptance`，用於針對一個 candidate package 的 side-run product proof。
  它接受 trusted ref、published npm spec、
  HTTPS tarball URL 加 SHA-256，或另一個 run 的 tarball artifact，將正規化的
  `openclaw-current.tgz` 上傳為 `package-under-test`，然後以 smoke、package、product、full 或 custom
  lane profiles 執行既有的 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可針對相同的
  `package-under-test` artifact 執行 Telegram QA workflow。
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

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中封裝並安裝目前的 OpenClaw 建置，啟動已設定 OpenAI 的 Gateway，然後透過設定編輯啟用內建 channel/Plugin。
  - 驗證設定探索會讓未設定的 Plugin 執行階段相依性保持不存在，第一次設定完成的 Gateway 或 doctor 執行會依需求安裝每個內建 Plugin 的執行階段相依性，且第二次重新啟動不會重新安裝已啟用的相依性。
  - 也會安裝已知較舊的 npm 基準版本，在執行 `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證候選版本的更新後 doctor 會修復內建 channel 執行階段相依性，而不需要測試框架端的 postinstall 修復。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels 來賓系統執行原生封裝安裝更新 smoke。每個選定的平台會先安裝要求的基準套件，接著在同一個來賓系統中執行已安裝的 `openclaw update` 命令，並驗證已安裝版本、更新狀態、Gateway 就緒狀態，以及一次本機代理回合。
  - 在針對單一來賓系統反覆測試時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得摘要成品路徑與每個 lane 的狀態。
  - OpenAI lane 預設使用 `openai/gpt-5.5` 作為即時代理回合證明。若刻意驗證另一個 OpenAI 模型，請傳入 `--model <provider/model>` 或設定 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 以主機逾時包住長時間本機執行，避免 Parallels 傳輸停滯耗盡剩餘測試時段：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 此腳本會將巢狀 lane 記錄寫入 `/tmp/openclaw-parallels-npm-update.*` 底下。先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`，再判定外層包裝器是否卡住。
  - 在冷啟動的來賓系統上，Windows 更新可能會在更新後 doctor/執行階段相依性修復花費 10 到 15 分鐘；只要巢狀 npm 偵錯記錄仍在推進，這仍屬正常。
  - 不要將這個聚合包裝器與個別 Parallels macOS、Windows 或 Linux smoke lane 平行執行。它們共享 VM 狀態，可能在快照還原、套件供應或來賓 Gateway 狀態上衝突。
  - 更新後證明會執行一般內建 Plugin 介面，因為語音、影像生成與媒體理解等 capability facade 會透過內建執行階段 API 載入，即使代理回合本身只檢查簡單文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider 伺服器，用於直接 protocol smoke 測試。
- `pnpm openclaw qa matrix`
  - 針對一次性 Docker 支援的 Tuwunel homeserver 執行 Matrix 即時 QA lane。僅限原始碼 checkout —— 封裝安裝不會隨附 `qa-lab`。
  - 完整 CLI、profile/scenario 目錄、env vars 與成品版面配置：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自 env 的 driver 與 SUT bot token，針對真實私有群組執行 Telegram 即時 QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必須是數字形式的 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共享集區認證。預設使用 env 模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選擇使用集區 lease。
  - 任一 scenario 失敗時會以非零狀態結束。若你想要產生成品但不讓結束碼失敗，請使用 `--allow-failures`。
  - 需要同一個私有群組中的兩個不同 bot，且 SUT bot 必須公開 Telegram 使用者名稱。
  - 為了穩定觀察 bot 對 bot 行為，請在 `@BotFather` 中為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 可以觀察群組 bot 流量。
  - 會在 `.artifacts/qa-e2e/...` 底下寫入 Telegram QA 報告、摘要與 observed-messages 成品。回覆 scenario 會包含從 driver 傳送要求到觀察到 SUT 回覆的 RTT。

即時傳輸 lane 共享一個標準合約，使新的傳輸不會偏移；每個 lane 的覆蓋矩陣位於 [QA overview → 即時傳輸覆蓋率](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的合成套件，不屬於該矩陣的一部分。

### 透過 Convex 共享 Telegram 認證 (v1)

當為 `openclaw qa telegram` 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex 支援的集區取得獨占 lease，在 lane 執行期間對該 lease 傳送 heartbeat，並在關閉時釋放 lease。

參考 Convex 專案 scaffold：

- `qa/convex-credential-broker/`

必要 env vars：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選角色的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- 認證角色選擇：
  - CLI：`--credential-role maintainer|ci`
  - Env 預設值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中預設為 `ci`，否則為 `maintainer`）

選用 env vars：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許僅限本機開發使用的 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

維護者管理命令（pool add/remove/list）特別需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

維護者 CLI 輔助工具：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在即時執行前使用 `doctor` 檢查 Convex site URL、broker secrets、endpoint prefix、HTTP timeout 與 admin/list 可達性，而不列印 secret 值。在腳本與 CI 工具中使用 `--json` 取得機器可讀輸出。

預設 endpoint 合約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 要求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗盡/可重試：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 要求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空白 `2xx`）
- `POST /release`
  - 要求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空白 `2xx`）
- `POST /admin/add`（僅限維護者 secret）
  - 要求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（僅限維護者 secret）
  - 要求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 作用中 lease 保護：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅限維護者 secret）
  - 要求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram kind 的 payload 形狀：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字形式的 Telegram chat id 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證此形狀，並拒絕格式錯誤的 payload。

### 將 channel 新增到 QA

新 channel 轉接器的架構與 scenario-helper 名稱位於 [QA overview → 新增 channel](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低門檻：在共享 `qa-lab` host seam 上實作傳輸 runner，在 Plugin manifest 中宣告 `qaRunners`，掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 底下撰寫 scenario。

## 測試套件（在哪裡執行什麼）

把這些套件視為「真實性遞增」（同時 flakiness/成本也遞增）：

### 單元 / 整合（預設）

- 命令：`pnpm test`
- 設定：未指定目標的執行會使用 `vitest.full-*.config.ts` shard 集合，且可能將多專案 shard 展開為每個專案的設定，以便平行排程
- 檔案：位於 `src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 底下的 core/unit inventory；UI 單元測試會在專用的 `unit-ui` shard 中執行
- 範圍：
  - 純單元測試
  - 進程內整合測試（gateway auth、routing、tooling、parsing、config）
  - 已知 bug 的決定性回歸測試
- 期望：
  - 在 CI 中執行
  - 不需要真實金鑰
  - 應快速且穩定
  - Resolver 與公開介面 loader 測試必須使用產生的小型 Plugin fixture 證明廣泛的 `api.js` 與 `runtime-api.js` fallback 行為，而不是使用真實內建 Plugin 原始碼 API。真實 Plugin API 載入應放在 Plugin 擁有的合約/整合套件中。

<AccordionGroup>
  <Accordion title="專案、shard 與限定範圍的 lane">

    - 非定向的 `pnpm test` 會執行十二個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是單一巨大的原生根專案程序。這會降低負載機器上的尖峰 RSS，並避免 auto-reply/extension 工作餓死不相關的套件。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片監看迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過作用域車道轉送明確的檔案/目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免付出完整根專案啟動成本。
    - `pnpm test:changed` 預設會將變更的 git 路徑展開成低成本的作用域車道：直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖相依項。Config/setup/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的正常智慧型本機檢查閘門。它會將 diff 分類為核心、核心測試、extensions、extension 測試、apps、docs、release metadata、live Docker tooling 和 tooling，然後執行相符的 typecheck、lint 和 guard 命令。它不會執行 Vitest 測試；若需要測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅 release metadata 的版本變更會執行定向的版本/config/root-dependency 檢查，並附帶一個 guard，用來拒絕頂層版本欄位以外的 package 變更。
    - Live Docker ACP harness 編輯會執行聚焦檢查：live Docker auth scripts 的 shell 語法，以及 live Docker scheduler dry-run。只有當 diff 限於 `scripts["test:docker:live-*"]` 時，才會包含 `package.json` 變更；dependency、export、version 和其他 package-surface 編輯仍使用較廣泛的 guard。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純 utility 區域的 import-light 單元測試，會透過 `unit-fast` 車道轉送，該車道會跳過 `test/setup-openclaw-runtime.ts`；stateful/runtime-heavy 檔案則維持在既有車道上。
    - 選定的 `plugin-sdk` 和 `commands` helper 原始檔，也會在 changed-mode 執行中對應到這些 light 車道中的明確同層測試，因此 helper 編輯可避免重新執行該目錄的完整 heavy suite。
    - `auto-reply` 有專用 bucket，分別涵蓋頂層核心 helpers、頂層 `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹。CI 進一步將 reply 子樹拆分為 agent-runner、dispatch 和 commands/state-routing 分片，避免由單一 import-heavy bucket 承擔完整 Node 尾端。
    - 一般 PR/main CI 會刻意跳過 extension 批次掃描與僅 release 使用的 `agentic-plugins` 分片。完整 Release Validation 會為 release candidates 分派獨立的 `Plugin Prerelease` 子工作流程，以執行那些 plugin/extension-heavy 套件。

  </Accordion>

  <Accordion title="嵌入式 runner 覆蓋範圍">

    - 變更 message-tool discovery 輸入或 compaction runtime
      context 時，請保留兩個層級的覆蓋範圍。
    - 為純 routing 和 normalization
      邊界加入聚焦的 helper regression。
    - 保持嵌入式 runner 整合套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證 scoped ids 和 compaction 行為仍透過真實的
      `run.ts` / `compact.ts` 路徑流動；僅 helper 的測試
      不足以取代這些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool 與隔離預設值">

    - 基礎 Vitest config 預設為 `threads`。
    - 共享 Vitest config 固定 `isolate: false`，並在根專案、e2e 和 live configs
      中使用非隔離 runner。
    - 根 UI 車道保留其 `jsdom` setup 和 optimizer，但也在
      共享的非隔離 runner 上執行。
    - 每個 `pnpm test` 分片都會從共享 Vitest config 繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子 Node
      程序加入 `--no-maglev`，以降低大型本機執行期間的 V8 編譯抖動。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與原版 V8
      行為比較。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構車道。
    - pre-commit hook 僅做格式化。它會重新 stage 已格式化的檔案，且
      不會執行 lint、typecheck 或測試。
    - 在 handoff 或 push 前需要智慧型本機檢查閘門時，請明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過低成本的作用域車道轉送。只有當 agent
      判定 harness、config、package 或 contract 編輯確實需要更廣的
      Vitest 覆蓋範圍時，才使用
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的 routing
      行為，只是 worker 上限較高。
    - 本機 worker 自動擴縮刻意保守，並會在主機 load average 已經很高時退讓，
      因此多個並行
      Vitest 執行預設會造成較少損害。
    - 基礎 Vitest config 會將 projects/config files 標記為
      `forceRerunTriggers`，因此當 test
      wiring 變更時，changed-mode 重新執行仍會保持正確。
    - config 會在支援的主機上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      若你想要一個用於直接 profiling 的明確 cache 位置，請設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="效能除錯">

    - `pnpm test:perf:imports` 會啟用 Vitest import-duration reporting 加上
      import-breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling view 限定到
      自 `origin/main` 以來變更的檔案。
    - 分片 timing data 會寫入 `.artifacts/vitest-shard-timings.json`。
      Whole-config 執行會使用 config path 作為 key；include-pattern CI
      分片會附加分片名稱，以便分別追蹤 filtered shards。
    - 當某個 hot test 仍然將大部分時間花在 startup imports 上時，
      請將 heavy dependencies 保留在窄範圍本機 `*.runtime.ts` seam 後方，並
      直接 mock 該 seam，而不是 deep-importing runtime helpers 只是為了
      將它們傳入 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對該 committed
      diff，比較 routed
      `test:changed` 與原生根專案路徑，並列印 wall time 加上 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 和根 Vitest config 路由 changed file list，
      對目前的 dirty tree 進行 benchmark。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite startup 和 transform overhead 寫入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用 file parallelism 的情況下，為
      unit suite 寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 穩定性（gateway）

- 命令：`pnpm test:stability:gateway`
- Config：`vitest.gateway.config.ts`，強制使用一個 worker
- 範圍：
  - 預設會啟動啟用 diagnostics 的真實 loopback Gateway
  - 透過 diagnostic event path 驅動合成 gateway message、memory 和 large-payload churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 涵蓋 diagnostic stability bundle persistence helpers
  - 斷言 recorder 保持有界、合成 RSS samples 維持在 pressure budget 之下，且每個 session queue depths 會排空回到零
- 期望：
  - CI-safe 且不需要 key
  - 用於 stability-regression follow-up 的窄車道，而不是完整 Gateway 套件的替代品

### E2E（gateway smoke）

- 命令：`pnpm test:e2e`
- Config：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的 bundled-plugin E2E 測試
- Runtime 預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用 adaptive workers（CI：最多 2，本機：預設 1）。
  - 預設在 silent mode 執行，以降低 console I/O overhead。
- 實用 overrides：
  - `OPENCLAW_E2E_WORKERS=<n>` 用來強制 worker 數量（上限為 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用來重新啟用 verbose console output。
- 範圍：
  - 多 instance gateway end-to-end 行為
  - WebSocket/HTTP surfaces、node pairing，以及較重的 networking
- 期望：
  - 在 CI 中執行（當 pipeline 啟用時）
  - 不需要真實 keys
  - 比單元測試有更多 moving parts（可能較慢）

### E2E：OpenShell backend smoke

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 透過 Docker 在 host 上啟動隔離的 OpenShell gateway
  - 從暫時本機 Dockerfile 建立 sandbox
  - 透過真實 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell backend
  - 透過 sandbox fs bridge 驗證 remote-canonical filesystem 行為
- 期望：
  - 僅 opt-in；不屬於預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` CLI 加上可運作的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀測試 gateway 和 sandbox
- 實用 overrides：
  - `OPENCLAW_E2E_OPENSHELL=1` 用於手動執行較廣 e2e 套件時啟用該測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用來指向非預設 CLI binary 或 wrapper script

### Live（真實 providers + 真實 models）

- 命令：`pnpm test:live`
- Config：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的 bundled-plugin live tests
- 預設：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個 provider/model _今天_ 是否真的能搭配真實 creds 運作？」
  - 捕捉 provider format changes、tool-calling quirks、auth issues 和 rate limit 行為
- 期望：
  - 設計上不是 CI-stable（真實網路、真實 provider policies、quotas、outages）
  - 會花錢 / 使用 rate limits
  - 偏好執行縮小範圍的子集，而不是「everything」
- Live runs 會 source `~/.profile` 以取得缺少的 API keys。
- 預設情況下，live runs 仍會隔離 `HOME`，並將 config/auth material 複製到暫時 test home，因此 unit fixtures 無法改動你真實的 `~/.openclaw`。
- 只有在你刻意需要 live tests 使用真實 home directory 時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設採用較安靜的模式：它保留 `[live] ...` progress output，但會抑制額外的 `~/.profile` notice，並靜音 gateway bootstrap logs/Bonjour chatter。若想恢復完整 startup logs，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key rotation（provider-specific）：使用逗號/分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 做 per-live override；測試會在 rate limit responses 時重試。
- Progress/heartbeat output：
  - Live suites 現在會將 progress lines 發送到 stderr，因此即使 Vitest console capture 安靜，長時間 provider calls 仍可看出處於 active 狀態。
  - `vitest.live.config.ts` 會停用 Vitest console interception，因此 provider/gateway progress lines 會在 live runs 期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整 direct-model heartbeats。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 gateway/probe heartbeats。

## 我應該執行哪個套件？

使用此決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你改了很多，也執行 `pnpm test:coverage`）
- 觸及 Gateway 網路 / WS 協定 / 配對：加入 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ 供應商特定失敗 / 工具呼叫：執行縮小範圍的 `pnpm test:live`

## Live（會觸及網路）測試

如需 live 模型矩陣、CLI 後端 smoke、ACP smoke、Codex app-server
harness，以及所有媒體供應商 live 測試（Deepgram、BytePlus、ComfyUI、影像、
音樂、影片、媒體 harness），再加上 live 執行的認證處理，請參閱
[測試 - live 套件](/zh-TW/help/testing-live)。

## Docker 執行器（可選的「可在 Linux 運作」檢查）

這些 Docker 執行器分成兩類：

- Live 模型執行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker 映像中執行各自相符的 profile-key live 檔案（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），並掛載你的本機設定目錄與工作區（如果有掛載，也會 source `~/.profile`）。相符的本機進入點是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 執行器預設使用較小的 smoke 上限，讓完整 Docker 掃描保持可行：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明確想要較大的完整掃描時，
  才覆寫這些 env vars。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置 live Docker 映像一次，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包一次成 npm tarball，然後建置/重用兩個 `scripts/e2e/Dockerfile` 映像。bare 映像只是 install/update/plugin-dependency lanes 的 Node/Git 執行器；這些 lanes 會掛載預先建置的 tarball。functional 映像會將同一個 tarball 安裝到 `/app`，用於 built-app 功能 lanes。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；規劃器邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的計畫。彙總程序使用加權本機排程器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制程序 slots，而資源上限會避免 heavy live、npm-install 和 multi-service lanes 全部同時啟動。如果單一 lane 比作用中的上限更重，排程器仍可在 pool 為空時啟動它，然後讓它單獨執行，直到容量再次可用。預設為 10 個 slots、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker 主機有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。執行器預設會執行 Docker preflight、移除過期的 OpenClaw E2E containers、每 30 秒列印狀態、將成功 lane 的時間記錄儲存在 `.artifacts/docker-tests/lane-timings.json`，並在之後執行時使用這些時間記錄優先啟動較長的 lanes。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不建置或執行 Docker 的情況下列印加權 lane manifest，或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lanes、package/image needs，以及 credentials 的 CI 計畫。
- `Package Acceptance` 是 GitHub 原生的 package gate，用來回答「這個可安裝 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個候選 package，將其上傳為 `package-under-test`，然後針對該精確 tarball 執行可重用的 Docker E2E lanes，而不是重新打包選定的 ref。`workflow_ref` 選擇受信任的 workflow/harness scripts，而 `package_ref` 則在 `source=ref` 時選擇要打包的來源 commit/branch/tag；這讓目前的 acceptance 邏輯可以驗證較舊的受信任 commits。Profiles 依涵蓋廣度排序：`smoke` 是快速 install/channel/agent 加上 gateway/config，`package` 是 package/update/plugin contract 加上 keyless upgrade-survivor fixture、published-baseline upgrade survivor lane，以及大多數 Parallels package/update 覆蓋範圍的預設 native 替代項，`product` 加入 MCP channels、cron/subagent cleanup、OpenAI web search 和 OpenWebUI，而 `full` 會執行含 OpenWebUI 的 release-path Docker chunks。Release 驗證會執行自訂 package delta（`bundled-channel-deps-compat plugins-offline`）加上 Telegram package QA，因為 release-path Docker chunks 已涵蓋重疊的 package/update/plugin lanes。從 artifacts 產生的目標式 GitHub Docker 重新執行命令，在可用時會包含先前的 package artifact 和已準備好的 image inputs，因此失敗的 lanes 可以避免重新建置 package 和 images。
- Build 和 release 檢查會在 tsdown 之後執行 `scripts/check-cli-bootstrap-imports.mjs`。該 guard 會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪靜態建置 graph，若 pre-dispatch startup 在命令 dispatch 前匯入 Commander、prompt UI、undici 或 logging 等 package dependencies，就會失敗；它也會讓 bundled gateway run chunk 保持在預算內，並拒絕已知 cold gateway paths 的靜態匯入。Packaged CLI smoke 也涵蓋 root help、onboard help、doctor help、status、config schema，以及 model-list command。
- Package Acceptance legacy compatibility 上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點以前，harness 只容忍已發布 package 的 metadata gaps：省略的 private QA inventory entries、缺少 `gateway install --wrapper`、tarball-derived git fixture 中缺少 patch files、缺少持久化的 `update.channel`、舊版 plugin install-record 位置、缺少 marketplace install-record persistence，以及 `plugins update` 期間的 config metadata migration。對於 `2026.4.25` 之後的 packages，這些路徑都是嚴格失敗。
- Container smoke 執行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`，以及 `test:docker:config-reload` 會啟動一個或多個真實 containers，並驗證較高層級的 integration paths。

live 模型 Docker 執行器也只會 bind-mount 所需的 CLI auth homes（或在執行未縮小範圍時掛載所有支援的 homes），接著在執行前將它們複製到 container home，讓 external-CLI OAuth 可以 refresh tokens，而不會修改 host auth store：

- 直接模型：`pnpm test:docker:live-models`（指令碼：`scripts/test-live-models-docker.sh`）
- ACP 綁定冒煙測試：`pnpm test:docker:live-acp-bind`（指令碼：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 與 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 提供嚴格的 Droid/OpenCode 覆蓋）
- CLI 後端冒煙測試：`pnpm test:docker:live-cli-backend`（指令碼：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒煙測試：`pnpm test:docker:live-codex-harness`（指令碼：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent：`pnpm test:docker:live-gateway`（指令碼：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性冒煙測試：`pnpm qa:otel:smoke` 是私有 QA 原始碼簽出檢查通道。它刻意不屬於套件 Docker 發行通道，因為 npm tarball 會省略 QA Lab。
- Open WebUI 即時冒煙測試：`pnpm test:docker:openwebui`（指令碼：`scripts/e2e/openwebui-docker.sh`）
- 入門精靈（TTY，完整鷹架）：`pnpm test:docker:onboard`（指令碼：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 入門/通道/agent 冒煙測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball，透過 env-ref 入門流程設定 OpenAI，預設再設定 Telegram，驗證 doctor 修復已啟用的 Plugin 執行階段相依套件，並執行一次模擬的 OpenAI agent 回合。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball、用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳過主機重建，或用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切換通道。
- 更新通道切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝已封裝的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證持久化的通道與 Plugin 更新後運作正常，接著切回套件 `stable` 並檢查更新狀態。
- 升級存活者冒煙測試：`pnpm test:docker:upgrade-survivor` 會把已封裝的 OpenClaw tarball 安裝到一個髒的舊使用者 fixture 上，該 fixture 含有 agents、通道設定、Plugin allowlist、過期的 Plugin runtime-deps 狀態，以及既有工作區/工作階段檔案。它會執行套件更新與非互動式 doctor，不使用即時提供者或通道金鑰，接著啟動 loopback Gateway，並檢查設定/狀態保留與啟動/狀態預算。
- 已發布升級存活者冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設會把 `openclaw@latest` 安裝到同一個髒的舊使用者 fixture 上，將該已發布安裝更新為候選 tarball，執行非互動式 doctor，接著啟動 loopback Gateway，並檢查相同的設定/狀態保留與啟動/狀態預算。用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫基準版本。
- 工作階段執行階段上下文冒煙測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏執行階段上下文逐字稿持久化，以及 doctor 對受影響的重複 prompt-rewrite 分支的修復。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會封裝目前樹狀內容，在隔離的 home 中用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會回傳內建圖片提供者，而不是卡住。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball、用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳過主機建置，或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- Installer Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 與 direct-npm 容器之間共用同一個 npm 快取。更新冒煙測試預設使用 npm `latest` 作為穩定基準，再升級到候選 tarball。可在本機用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上用 Install Smoke 工作流程的 `update_baseline_version` 輸入覆寫。非 root 安裝程式檢查會保留隔離的 npm 快取，避免 root 擁有的快取項目遮蔽使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`，即可在本機重新執行時重用 root/update/direct-npm 快取。
- Install Smoke CI 會用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳過重複的 direct-npm 全域更新；需要直接 `npm install -g` 覆蓋時，請在本機不帶該 env 執行指令碼。
- Agents 刪除共用工作區 CLI 冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（指令碼：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設會建置 root Dockerfile 映像，在隔離的容器 home 中植入兩個 agents 與一個工作區，執行 `agents delete --json`，並驗證有效 JSON 與保留工作區行為。用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke 映像。
- Gateway 網路（兩個容器，WS 驗證 + 健康檢查）：`pnpm test:docker:gateway-network`（指令碼：`scripts/e2e/gateway-network-docker.sh`）
- 瀏覽器 CDP 快照冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（指令碼：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置原始碼 E2E 映像加上一層 Chromium，使用原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP 角色快照涵蓋連結 URL、游標提升的可點擊項目、iframe refs 與 frame metadata。
- OpenAI Responses web_search 最小 reasoning 迴歸：`pnpm test:docker:openai-web-search-minimal`（指令碼：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行模擬的 OpenAI 伺服器，驗證 `web_search` 會把 `reasoning.effort` 從 `minimal` 提升到 `low`，接著強制提供者 schema 拒絕，並檢查原始詳細資訊會出現在 Gateway 記錄中。
- MCP 通道橋接（已植入的 Gateway + stdio bridge + 原始 Claude notification-frame 冒煙測試）：`pnpm test:docker:mcp-channels`（指令碼：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真實 stdio MCP 伺服器 + 內嵌 Pi profile allow/deny 冒煙測試）：`pnpm test:docker:pi-bundle-mcp-tools`（指令碼：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真實 Gateway + 在隔離 cron 與 one-shot subagent 執行後拆除 stdio MCP 子程序）：`pnpm test:docker:cron-mcp-cleanup`（指令碼：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（安裝冒煙測試、ClawHub kitchen-sink 安裝/解除安裝、市集更新，以及 Claude-bundle 啟用/檢查）：`pnpm test:docker:plugins`（指令碼：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳過 ClawHub 區塊，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設 kitchen-sink package/runtime 組合。若沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，測試會使用密封的本機 ClawHub fixture 伺服器。
- Plugin 更新未變更冒煙測試：`pnpm test:docker:plugin-update`（指令碼：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 設定重新載入 metadata 冒煙測試：`pnpm test:docker:config-reload`（指令碼：`scripts/e2e/config-reload-source-docker.sh`）
- 內建 Plugin 執行階段相依套件：`pnpm test:docker:bundled-channel-deps` 預設會建置一個小型 Docker runner 映像，並在主機上建置與封裝 OpenClaw 一次，接著把該 tarball 掛載到每個 Linux 安裝情境中。用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 重用映像、在新的本機建置後用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳過主機重建，或用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向既有 tarball。完整 Docker 彙總與 release-path bundled-channel chunks 會先封裝此 tarball 一次，接著將內建通道檢查分片成獨立通道，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 與 ACPX 的個別更新通道。發行 chunks 會把通道冒煙測試、更新目標與設定/執行階段合約拆成 `bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 與 `bundled-channels-contracts`；彙總 `bundled-channels` chunk 仍可用於手動重新執行。發行工作流程也會拆分提供者安裝程式 chunks 與內建 Plugin 安裝/解除安裝 chunks；舊版 `package-update`、`plugins-runtime` 與 `plugins-integrations` chunks 仍保留為手動重新執行用的彙總別名。直接執行內建通道時，可用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 縮小通道矩陣，或用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 縮小更新情境。每個情境的 Docker 執行預設為 `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`；多目標更新情境預設為 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`。此通道也會驗證 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 會抑制 doctor/runtime-dependency 修復。
- 迭代時可透過停用無關情境，縮小內建 Plugin 執行階段相依套件範圍，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

若要手動預先建置並重用共用功能映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 等特定套件的映像覆寫時，仍會優先生效。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，若該映像尚未存在於本機，指令碼會拉取它。QR 與安裝程式 Docker 測試保留自己的 Dockerfiles，因為它們驗證的是套件/安裝行為，而不是共用的已建置 app 執行階段。

即時模型 Docker 執行器也會以唯讀方式 bind-mount 目前的 checkout，並
將其 stage 到容器內的臨時 workdir。這會讓 runtime
映像保持精簡，同時仍針對你確切的本機來源碼/config 執行 Vitest。
staging 步驟會略過大型的僅本機快取與 app 建置輸出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及 app-local `.build` 或
Gradle 輸出目錄，讓 Docker 即時執行不會花費數分鐘複製
特定機器的成品。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此 gateway 即時探測不會在容器內啟動
實際的 Telegram/Discord 等 channel worker。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要從該 Docker lane
縮小或排除 gateway 即時覆蓋範圍時，也請傳入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高層級的相容性 smoke：它會啟動一個
已啟用 OpenAI 相容 HTTP endpoint 的 OpenClaw gateway 容器，
啟動一個 pinned Open WebUI 容器並連到該 Gateway，透過
Open WebUI 登入，驗證 `/api/models` 會公開 `openclaw/default`，然後透過
Open WebUI 的 `/api/chat/completions` proxy 傳送一個
真實聊天請求。
第一次執行可能明顯較慢，因為 Docker 可能需要拉取
Open WebUI 映像，而 Open WebUI 也可能需要完成自己的冷啟動設定。
此 lane 需要可用的即時模型 key，而 `OPENCLAW_PROFILE_FILE`
（預設為 `~/.profile`）是在 Docker 化執行中提供它的主要方式。
成功執行會列印類似 `{ "ok": true, "model":
"openclaw/default", ... }` 的小型 JSON payload。
`test:docker:mcp-channels` 是刻意設計為 deterministic，且不需要
真實的 Telegram、Discord 或 iMessage 帳號。它會啟動一個已 seeded 的 Gateway
容器，啟動第二個容器來 spawn `openclaw mcp serve`，然後
驗證 routed conversation discovery、transcript reads、attachment metadata、
live event queue behavior、outbound send routing，以及透過真實 stdio MCP bridge
傳遞的 Claude-style channel + permission notifications。notification check
會直接檢查原始 stdio MCP frames，因此該 smoke 驗證的是
bridge 實際發出的內容，而不只是某個特定 client SDK 剛好 surfaced 的內容。
`test:docker:pi-bundle-mcp-tools` 是 deterministic，且不需要即時
模型 key。它會建置 repo Docker 映像，在容器內啟動真實的 stdio MCP probe server，
透過 embedded Pi bundle
MCP runtime materialize 該 server，執行 tool，然後驗證 `coding` 與 `messaging` 會保留
`bundle-mcp` tools，而 `minimal` 與 `tools.deny: ["bundle-mcp"]` 會將它們過濾掉。
`test:docker:cron-mcp-cleanup` 是 deterministic，且不需要即時模型
key。它會啟動一個 seeded Gateway 與真實 stdio MCP probe server，執行
隔離的 Cron turn 和 `/subagents spawn` one-shot child turn，然後驗證
MCP child process 會在每次執行後退出。

手動 ACP plain-language thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此 script 供 regression/debug workflows 使用。ACP thread routing 驗證日後可能仍會再次需要它，因此請勿刪除。

實用 env vars：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）掛載到 `/home/node/.profile`，並在執行測試前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 僅驗證從 `OPENCLAW_PROFILE_FILE` source 的 env vars，使用臨時 config/workspace dirs，且不掛載外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）掛載到 `/home/node/.npm-global`，用於 Docker 內快取 CLI 安裝
- `$HOME` 底下的外部 CLI auth dirs/files 會以唯讀方式掛載到 `/host-auth...` 底下，然後在測試開始前複製到 `/home/node/...`
  - 預設 dirs：`.minimax`
  - 預設 files：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 縮小範圍的 provider runs 只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要 dirs/files
  - 可用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的 comma list 手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用來縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用來在容器內篩選 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用來在不需要重新建置的 reruns 中重用現有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用來確保 creds 來自 profile store（而非 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用來選擇 Gateway 為 Open WebUI smoke 公開的 model
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用來覆寫 Open WebUI smoke 使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用來覆寫 pinned Open WebUI image tag

## 文件 sanity

文件編輯後執行文件檢查：`pnpm check:docs`。
當你也需要 in-page heading checks 時，執行完整的 Mintlify anchor validation：`pnpm docs:check-links:anchors`。

## Offline regression（CI-safe）

這些是不使用真實 providers 的「real pipeline」regressions：

- Gateway tool calling（mock OpenAI、真實 gateway + agent loop）：`src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway wizard（WS `wizard.start`/`wizard.next`，寫入 config + auth enforced）：`src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## Agent reliability evals（skills）

我們已經有一些 CI-safe tests，其行為類似「agent reliability evals」：

- 透過真實 Gateway + agent loop 進行 mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 與 config effects 的端到端 wizard flows（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請參閱 [Skills](/zh-TW/tools/skills)）：

- **決策：** 當 prompt 中列出 Skills 時，agent 是否選擇正確的 skill（或避開不相關的 skill）？
- **合規：** agent 是否在使用前讀取 `SKILL.md`，並遵循必要 steps/args？
- **Workflow contracts：** multi-turn scenarios，用來 assert tool order、session history carryover，以及 sandbox boundaries。

未來的 evals 應優先保持 deterministic：

- 使用 mock providers 的 scenario runner，用來 assert tool calls + order、skill file reads，以及 session wiring。
- 一小組以 skill 為重點的 scenarios（use vs avoid、gating、prompt injection）。
- Optional live evals（opt-in、env-gated）只應在 CI-safe suite 就位後加入。

## Contract tests（Plugin 與 channel shape）

Contract tests 會驗證每個已註冊的 Plugin 與 channel 是否符合其
interface contract。它們會逐一處理所有 discovered plugins，並執行一組
shape 與 behavior assertions。預設的 `pnpm test` unit lane 會刻意
跳過這些 shared seam 與 smoke files；當你觸及 shared channel 或 provider surfaces 時，
請明確執行 contract commands。

### Commands

- 所有 contracts：`pnpm test:contracts`
- 僅 channel contracts：`pnpm test:contracts:channels`
- 僅 provider contracts：`pnpm test:contracts:plugins`

### Channel contracts

位於 `src/channels/plugins/contracts/*.contract.test.ts`：

- **Plugin** - 基本 Plugin shape（id、name、capabilities）
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

## 新增 regressions（guidance）

當你修復在 live 中發現的 provider/model issue 時：

- 盡可能新增 CI-safe regression（mock/stub provider，或 capture exact request-shape transformation）
- 如果本質上只能 live-only（rate limits、auth policies），請讓 live test 保持 narrow，並透過 env vars opt-in
- 偏好鎖定能抓到該 bug 的最小 layer：
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 或 CI-safe gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class derive 一個 sampled target，然後 assert traversal-segment exec ids 會被 rejected。
  - 如果你在 `src/secrets/target-registry-data.ts` 新增新的 `includeInPlan` SecretRef target family，請更新該 test 中的 `classifyTargetClass`。該 test 會刻意在 unclassified target ids 上失敗，讓 new classes 無法被 silently skipped。

## 相關

- [Testing live](/zh-TW/help/testing-live)
- [CI](/zh-TW/ci)
