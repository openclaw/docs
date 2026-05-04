---
read_when:
    - 在本機或 CI 中執行測試
    - 為模型/提供者錯誤新增迴歸測試
    - 偵錯 Gateway + 代理行為
summary: 測試工具組：單元／端對端／即時測試套件、Docker 執行器，以及各項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-05-04T07:04:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 測試套件（單元/整合、e2e、live）和一小組
Docker 執行器。本文件是「我們如何測試」指南：

- 每個套件涵蓋的內容（以及它刻意_不_涵蓋的內容）。
- 常見工作流程要執行哪些命令（本機、推送前、偵錯）。
- live 測試如何探索憑證並選擇模型/供應商。
- 如何為真實世界的模型/供應商問題新增回歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、live 傳輸通道）**另有文件說明：

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) — 架構、命令介面、情境撰寫。
- [矩陣 QA](/zh-TW/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的參考。
- [QA channel](/zh-TW/channels/qa-channel) — repo 支援情境所使用的合成傳輸 Plugin。

本頁涵蓋一般測試套件和 Docker/Parallels 執行器的執行方式。下方的 QA 專用執行器區段（[QA-specific runners](#qa-specific-runners)）列出具體的 `qa` 呼叫方式，並指回上述參考。
</Note>

## 快速開始

大多數日子：

- 完整閘門（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充裕的機器上更快執行本機完整套件：`pnpm test:max`
- 直接 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在迭代單一失敗時，優先使用目標式執行。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你碰到測試或想要額外信心時：

- 覆蓋率閘門：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

偵錯真實供應商/模型時（需要真實憑證）：

- Live 套件（模型 + gateway 工具/影像探針）：`pnpm test:live`
- 安靜地指定一個 live 檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行階段效能報告：分派 `OpenClaw Performance`，使用
  `live_gpt54=true` 進行真實 `openai/gpt-5.4` agent 回合，或使用
  `deep_profile=true` 產生 Kova CPU/heap/trace 成品。當設定 `CLAWGRIT_REPORTS_TOKEN` 時，每日排程執行會將 mock-provider、deep-profile 和 GPT 5.4 通道成品發布到
  `openclaw/clawgrit-reports`。mock-provider 報告也包含原始碼層級的 gateway 啟動、記憶體、
  plugin 壓力、重複 fake-model hello-loop，以及 CLI 啟動數字。
- Docker live 模型掃描：`pnpm test:docker:live-models`
  - 每個選取的模型現在會執行一個文字回合，再加上一個小型檔案讀取風格探針。
    中繼資料宣告支援 `image` 輸入的模型也會執行一個小型影像回合。
    在隔離供應商失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探針。
  - CI 覆蓋範圍：每日 `OpenClaw Scheduled Live And E2E Checks` 和手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用的 live/E2E workflow，其中包含依供應商分片的個別 Docker live 模型矩陣作業。
  - 若要聚焦 CI 重新執行，請分派 `OpenClaw Live And E2E Checks (Reusable)`，
    並設定 `include_live_suites: true` 與 `live_models_only: true`。
  - 將新的高訊號供應商 secret 新增到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其
    scheduled/release 呼叫端。
- 原生 Codex bound-chat smoke：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker live 通道，使用 `/codex bind` 綁定合成
    Slack DM，執行 `/codex fast` 和
    `/codex permissions`，接著驗證純文字回覆和影像附件會經由原生 Plugin 綁定路由，而不是 ACP。
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`
  - 透過 Plugin 擁有的 Codex app-server harness 執行 gateway agent 回合，
    驗證 `/codex status` 和 `/codex models`，並預設執行影像、
    cron MCP、子 agent 和 Guardian 探針。隔離其他 Codex
    app-server 失敗時，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用子 agent 探針。若要進行聚焦的子 agent 檢查，請停用其他探針：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否則這會在子 agent 探針後結束。
- Crestodian 救援命令 smoke：`pnpm test:live:crestodian-rescue-channel`
  - 訊息 channel 救援命令介面的選擇性雙重保險檢查。
    它會執行 `/crestodian status`，將持久模型變更新增到佇列，
    回覆 `/crestodian yes`，並驗證稽核/config 寫入路徑。
- Crestodian planner Docker smoke：`pnpm test:docker:crestodian-planner`
  - 在無 config 的容器中執行 Crestodian，並在 `PATH` 上提供 fake Claude CLI，
    驗證 fuzzy planner fallback 會轉換成經稽核的型別化 config 寫入。
- Crestodian first-run Docker smoke：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw 狀態目錄開始，將裸 `openclaw` 路由到
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入，
    驗證 config，並驗證稽核項目。相同的 Ring 0 設定路徑也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆蓋。
- Moonshot/Kimi 成本 smoke：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對
  `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先透過下方說明的 allowlist 環境變數縮小 live 測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA-lab 的真實度時，這些命令位於主要測試套件旁：

CI 會在專用 workflow 中執行 QA Lab。Agentic parity 巢狀位於
`QA-Lab - All Lanes` 和發布驗證之下，而不是獨立的 PR workflow。
廣泛驗證應使用 `Full Release Validation` 搭配
`rerun_group=qa-parity`，或 release-checks QA 群組。`QA-Lab - All Lanes`
每晚在 `main` 上執行，也可透過手動分派執行，並將 mock parity 通道、live
Matrix 通道、Convex 管理的 live Telegram 通道，以及 Convex 管理的 live Discord
通道作為平行作業。排程 QA 和發布檢查會明確傳遞 Matrix
`--profile fast`，而 Matrix CLI 和手動 workflow 輸入的預設值仍為
`all`；手動分派可將 `all` 分片成 `transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。`OpenClaw Release
Checks` 會在發布核准前執行 parity 加上 fast Matrix 和 Telegram 通道，
並使用 `mock-openai/gpt-5.5` 進行發布傳輸檢查，使它們保持決定性並避免一般 provider-plugin 啟動。這些 live 傳輸
gateway 會停用記憶體搜尋；記憶體行為仍由 QA parity
套件覆蓋。

完整發布 live media 分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 和 `ffprobe`。Docker live 模型/後端分片使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像，針對選取的
commit 建置一次，接著用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行以 repo 為基礎的 QA 情境。
  - 預設會使用隔離的 Gateway worker 平行執行多個選取的情境。`qa-channel` 預設並行數為 4（受選取情境數量限制）。使用 `--concurrency <count>` 調整 worker
    數量，或使用 `--concurrency 1` 執行較舊的序列通道。
  - 任一情境失敗時會以非零碼結束。若你想要產出成品但不要失敗的結束碼，請使用 `--allow-failures`。
  - 支援 provider 模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 會啟動本機 AIMock 後端的 provider 伺服器，用於實驗性 fixture 和 protocol-mock 涵蓋範圍，而不會取代具情境感知能力的
    `mock-openai` 通道。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 Gateway 啟動基準測試，加上一小組模擬 QA Lab 情境包
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`)，並在 `.artifacts/gateway-cpu-scenarios/` 下寫入合併的 CPU 觀察摘要。
  - 預設只標記持續的高 CPU 觀察結果（`--cpu-core-warn`
    加上 `--hot-wall-warn-ms`），因此短暫的啟動突增會記錄為指標，而不會看起來像持續數分鐘的 Gateway 滿載退化問題。
  - 使用已建置的 `dist` 成品；若 checkout 尚未有最新的執行階段輸出，請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在可拋棄的 Multipass Linux VM 內執行相同的 QA 套件。
  - 保持與主機上 `qa suite` 相同的情境選取行為。
  - 重用與 `qa suite` 相同的 provider/model 選取旗標。
  - Live 執行會轉送對 guest 實用且受支援的 QA auth 輸入：
    以 env 為基礎的 provider 金鑰、QA live provider 設定路徑，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須保持在 repo 根目錄之下，讓 guest 能透過掛載的工作區寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA 報告與摘要，以及 Multipass 日誌。
- `pnpm qa:lab:up`
  - 啟動 Docker 後端的 QA 網站，用於 operator 風格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball，在 Docker 中全域安裝，執行非互動式 OpenAI API 金鑰 onboarding，預設設定 Telegram，驗證封裝後的 Plugin 執行階段可在不需啟動依賴修復的情況下載入，執行 doctor，並對模擬的 OpenAI endpoint 執行一次本機 agent 回合。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的封裝安裝通道。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式執行階段 context transcript 執行決定性的已建置 app Docker smoke。它會驗證隱藏的 OpenClaw 執行階段 context 會作為非顯示自訂訊息保存，而不是洩漏到可見的使用者回合中，接著植入受影響的損壞 session JSONL，並驗證
    `openclaw doctor --fix` 會以備份將其重寫到作用中分支。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw package 候選項，執行已安裝 package 的 onboarding，透過已安裝的 CLI 設定 Telegram，然後以該已安裝 package 作為 SUT Gateway，重用 live Telegram QA 通道。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而不是從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env credentials 或 Convex credential 來源。對於 CI/release 自動化，請設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，再加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色 secret。若
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色 secret 存在於 CI 中，Docker wrapper 會自動選取 Convex。
  - wrapper 會先在主機上驗證 Telegram 或 Convex credential env，再進行 Docker build/install 工作。只有在刻意偵錯 credential 前置設定時，才設定 `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會針對此通道覆寫共用的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 將此通道公開為手動 maintainer workflow
    `NPM Telegram Beta E2E`。它不會在 merge 時執行。該 workflow 使用
    `qa-live-shared` environment 和 Convex CI credential lease。
- GitHub Actions 也公開 `Package Acceptance`，用於對單一候選 package 進行旁路產品驗證。它接受受信任的 ref、已發布的 npm spec、HTTPS tarball URL 加 SHA-256，或另一個 run 的 tarball artifact，將標準化的 `openclaw-current.tgz` 上傳為 `package-under-test`，接著使用 smoke、package、product、full 或 custom 通道 profile 執行既有 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可讓 Telegram QA workflow 針對同一個 `package-under-test` artifact 執行。
  - 最新 beta 產品驗證：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精確 tarball URL 驗證需要 digest：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact 驗證會從另一個 Actions run 下載 tarball artifact：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中封裝並安裝目前的 OpenClaw build，以已設定的 OpenAI 啟動 Gateway，接著透過 config 編輯啟用 bundled channel/plugins。
  - 驗證 setup discovery 會讓未設定的可下載 Plugin 保持缺席，第一次設定後的 doctor repair 會明確安裝每個缺少的可下載 Plugin，而第二次重啟不會執行隱藏的依賴修復。
  - 也會安裝已知較舊的 npm baseline，在執行
    `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證候選項的更新後 doctor 會清理舊版 Plugin 依賴殘留，而不需要 harness 端 postinstall repair。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 執行原生封裝安裝更新 smoke。每個選取的平台會先安裝要求的 baseline package，接著在同一個 guest 中執行已安裝的 `openclaw update` 命令，並驗證已安裝版本、更新狀態、Gateway 就緒狀態，以及一次本機 agent 回合。
  - 在針對單一 guest 迭代時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得摘要 artifact 路徑和各通道狀態。
  - OpenAI 通道預設使用 `openai/gpt-5.5` 進行 live agent 回合驗證。若刻意驗證其他 OpenAI model，請傳入 `--model <provider/model>` 或設定
    `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 將長時間本機執行包在主機 timeout 中，避免 Parallels transport 停滯耗盡剩餘測試時間：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 腳本會在 `/tmp/openclaw-parallels-npm-update.*` 下寫入巢狀通道日誌。
    在假設外層 wrapper 卡住之前，請檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows 更新在冷 guest 上可能會花 10 到 15 分鐘進行更新後 doctor 和 package 更新工作；只要巢狀 npm debug log 持續前進，這仍然是健康狀態。
  - 請勿將這個聚合 wrapper 與個別 Parallels macOS、Windows 或 Linux smoke 通道平行執行。它們共用 VM 狀態，可能在 snapshot restore、package serving 或 guest Gateway 狀態上發生衝突。
  - 更新後驗證會執行一般 bundled Plugin surface，因為語音、影像生成、媒體理解等 capability facade 會透過 bundled runtime API 載入，即使 agent 回合本身只檢查簡單文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider 伺服器，用於直接 protocol smoke 測試。
- `pnpm openclaw qa matrix`
  - 對一次性 Docker 後端的 Tuwunel homeserver 執行 Matrix live QA 通道。僅限 source-checkout，封裝安裝不會附帶 `qa-lab`。
  - 完整 CLI、profile/scenario catalog、env vars 和 artifact 版面配置：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用 env 中的 driver 和 SUT bot token，針對真實私人群組執行 Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必須是數字 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共用 pooled credentials。預設使用 env 模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選用 pooled lease。
  - 任一情境失敗時會以非零碼結束。若你想要產出成品但不要失敗的結束碼，請使用 `--allow-failures`。
  - 需要同一個私人群組中的兩個不同 bot，且 SUT bot 必須公開 Telegram username。
  - 為了穩定的 bot 對 bot 觀察，請在 `@BotFather` 中為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 能觀察群組 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA 報告、摘要和 observed-messages artifact。回覆情境包含從 driver 傳送請求到觀察到 SUT 回覆的 RTT。

Live transport 通道共用一個標準 contract，讓新 transport 不會漂移；各通道涵蓋矩陣位於 [QA 概覽 → Live transport 涵蓋範圍](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的合成套件，不屬於該矩陣。

### 透過 Convex 共用 Telegram credentials (v1)

當 `openclaw qa telegram` 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex 後端的 pool 取得獨占 lease，在通道執行期間對該 lease 送出 heartbeat，並在關閉時釋放 lease。

參考 Convex 專案 scaffold：

- `qa/convex-credential-broker/`

必要 env vars：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選角色的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- Credential 角色選取：
  - CLI：`--credential-role maintainer|ci`
  - Env 預設：`OPENCLAW_QA_CREDENTIAL_ROLE`（CI 中預設為 `ci`，否則為 `maintainer`）

可選 env vars：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可選 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許本機限定開發使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

Maintainer admin 命令（pool add/remove/list）明確需要
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

Maintainer 的 CLI helper：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` 前，請先檢查 Convex 站台 URL、broker 密鑰、
端點前綴、HTTP 逾時，以及 admin/list 可達性，且不要列印
密鑰值。在指令稿和 CI
公用工具中使用 `--json` 取得機器可讀輸出。

預設端點合約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

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
  - 作用中租約保護：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅維護者密鑰）
  - 請求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram kind 的 payload 形狀：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字型 Telegram 聊天 id 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證此形狀，並拒絕格式錯誤的 payload。

### 將通道新增至 QA

新通道轉接器的架構和情境輔助程式名稱位於 [QA 概覽 → 新增通道](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低標準：在共用 `qa-lab` 主機銜接面上實作傳輸執行器，在 Plugin 資訊清單中宣告 `qaRunners`，掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫情境。

## 測試套件（在哪裡執行什麼）

將套件視為「真實度逐步提高」（且不穩定性/成本也逐步提高）：

### 單元 / 整合（預設）

- 指令：`pnpm test`
- 設定：未指定目標的執行會使用 `vitest.full-*.config.ts` 分片集合，並可能將多專案分片展開成每個專案的設定以便平行排程
- 檔案：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的核心/單元清單；UI 單元測試會在專用的 `unit-ui` 分片中執行
- 範圍：
  - 純單元測試
  - 程序內整合測試（Gateway 驗證、路由、工具、解析、設定）
  - 已知錯誤的確定性迴歸測試
- 預期：
  - 在 CI 中執行
  - 不需要真實金鑰
  - 應快速且穩定
  - 解析器與公開介面載入器測試必須使用產生的小型 Plugin fixture，證明廣泛的 `api.js` 和
    `runtime-api.js` 後援行為，而不是使用真實內建 Plugin 來源 API。真實 Plugin API 載入屬於
    Plugin 擁有的合約/整合套件。

<AccordionGroup>
  <Accordion title="專案、分片與範圍化通道">

    - 未指定目標的 `pnpm test` 會執行十二個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生根專案程序。這會降低高負載機器上的峰值 RSS，並避免 auto-reply/extension 工作拖慢不相關的套件。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片 watch 迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過範圍化通道路由明確的檔案/目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免支付完整根專案啟動成本。
    - `pnpm test:changed` 預設會將變更的 git 路徑展開成低成本的範圍化通道：直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機匯入圖相依項。設定/設置/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的正常智慧本機檢查閘門。它會將 diff 分類成核心、核心測試、extensions、extension 測試、apps、docs、release metadata、live Docker tooling 和 tooling，然後執行對應的型別檢查、lint 和保護指令。它不會執行 Vitest 測試；若需要測試證明，請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>`。僅 release metadata 的版本提升會執行目標式版本/設定/根相依性檢查，並有一道保護會拒絕頂層版本欄位以外的 package 變更。
    - Live Docker ACP harness 編輯會執行聚焦檢查：live Docker 驗證指令稿的 shell 語法，以及 live Docker 排程器 dry-run。只有當 diff 限於 `scripts["test:docker:live-*"]` 時才包含 `package.json` 變更；相依性、export、version 和其他 package 介面編輯仍使用較廣泛的保護。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純公用工具區域的輕匯入單元測試，會路由到 `unit-fast` 通道，該通道會略過 `test/setup-openclaw-runtime.ts`；有狀態/重 runtime 的檔案會留在現有通道上。
    - 選定的 `plugin-sdk` 和 `commands` 輔助來源檔案，也會在變更模式執行時對應到這些輕量通道中的明確同層測試，因此輔助程式編輯可避免重新執行該目錄的完整重型套件。
    - `auto-reply` 有專用 bucket，分別用於頂層核心輔助程式、頂層 `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹。CI 進一步將 reply 子樹拆分成 agent-runner、dispatch 和 commands/state-routing 分片，因此單一匯入繁重的 bucket 不會占用完整 Node 尾端。
    - 一般 PR/main CI 會刻意略過 extension 批次掃描和僅 release 的 `agentic-plugins` 分片。完整 Release Validation 會針對 release candidate 分派獨立的 `Plugin Prerelease` 子工作流程，以執行這些 Plugin/extension 重型套件。

  </Accordion>

  <Accordion title="嵌入式執行器涵蓋範圍">

    - 當你變更訊息工具探索輸入或 compaction runtime
      context 時，請保留兩個層級的涵蓋範圍。
    - 為純路由與正規化邊界新增聚焦的輔助程式迴歸測試。
    - 維持嵌入式執行器整合套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證範圍化 id 與 compaction 行為仍會流經
      真實的 `run.ts` / `compact.ts` 路徑；僅輔助程式的測試
      不能充分替代這些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool 與隔離預設值">

    - 基礎 Vitest 設定預設為 `threads`。
    - 共用 Vitest 設定固定 `isolate: false`，並在根專案、e2e 和 live 設定中使用
      非隔離執行器。
    - 根 UI 通道保留其 `jsdom` 設置與 optimizer，但也在
      共用非隔離執行器上執行。
    - 每個 `pnpm test` 分片都會從共用 Vitest 設定繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子 Node
      程序加入 `--no-maglev`，以減少大型本機執行期間的 V8 編譯 churn。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與原廠 V8
      行為比較。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構通道。
    - pre-commit hook 僅負責格式化。它會重新暫存已格式化的檔案，
      不會執行 lint、型別檢查或測試。
    - 在交接或 push 前，若你需要智慧本機檢查閘門，請明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過低成本的範圍化通道路由。只有當 agent
      判定 harness、設定、package 或合約編輯確實需要更廣泛的
      Vitest 涵蓋範圍時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行為，只是使用較高的 worker 上限。
    - 本機 worker 自動縮放刻意保守，並會在主機 load average 已偏高時退讓，
      因此多個並行 Vitest 執行預設造成較少影響。
    - 基礎 Vitest 設定會將專案/設定檔標記為
      `forceRerunTriggers`，因此測試 wiring 變更時，變更模式重新執行仍保持正確。
    - 設定會在支援的主機上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      若你想要為直接 profiling 指定一個明確的快取位置，請設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="效能偵錯">

    - `pnpm test:perf:imports` 會啟用 Vitest 匯入耗時報告與
      import-breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling 視圖範圍化到
      自 `origin/main` 以來變更的檔案。
    - 分片時間資料會寫入 `.artifacts/vitest-shard-timings.json`。
      全設定執行會使用設定路徑作為 key；include-pattern CI
      分片會附加分片名稱，因此可分別追蹤已過濾的分片。
    - 當某個 hot test 仍將大部分時間花在啟動匯入時，
      請將重型相依性放在窄範圍本機 `*.runtime.ts` 銜接面之後，
      並直接 mock 該銜接面，而不是 deep-import runtime helpers 只為了
      將它們傳入 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會將路由後的
      `test:changed` 與該已提交 diff 的原生根專案路徑比較，
      並列印 wall time 與 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 和根 Vitest 設定，路由變更檔案清單，
      以 benchmark 目前的 dirty tree。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite 啟動與轉換 overhead 寫入主執行緒 CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用檔案平行處理時，為
      單元套件寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 穩定性（Gateway）

- 指令：`pnpm test:stability:gateway`
- 設定：`vitest.gateway.config.ts`，強制使用一個 worker
- 範圍：
  - 啟動真實的 loopback Gateway，預設啟用診斷
  - 透過診斷事件路徑驅動合成 Gateway 訊息、記憶體與大型 payload churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 涵蓋診斷穩定性 bundle 持久化輔助程式
  - 斷言 recorder 保持有界、合成 RSS 樣本維持在壓力預算內，且每個 session 的佇列深度會排空回到零
- 預期：
  - 可安全用於 CI 且不需金鑰
  - 穩定性迴歸後續處理的窄通道，不是完整 Gateway 套件的替代品

### E2E（Gateway smoke）

- 命令：`pnpm test:e2e`
- 設定：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的 bundled-plugin E2E 測試
- 執行階段預設值：
  - 使用 Vitest `threads` 並設定 `isolate: false`，與 repo 其餘部分一致。
  - 使用自適應 worker（CI：最多 2 個，本機：預設 1 個）。
  - 預設以靜默模式執行，以降低主控台 I/O 開銷。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 用於強制指定 worker 數量（上限為 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用於重新啟用詳細主控台輸出。
- 範圍：
  - 多實例 gateway 端對端行為
  - WebSocket/HTTP 介面、Node 配對，以及較重的網路功能
- 預期：
  - 在 CI 中執行（當 pipeline 中啟用時）
  - 不需要真實金鑰
  - 比單元測試有更多移動部件（可能較慢）

### E2E：OpenShell backend smoke

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 透過 Docker 在主機上啟動隔離的 OpenShell gateway
  - 從暫存本機 Dockerfile 建立 sandbox
  - 透過真實的 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell backend
  - 透過 sandbox fs bridge 驗證遠端標準 filesystem 行為
- 預期：
  - 僅限 opt-in；不是預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` CLI 以及可運作的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀測試 gateway 與 sandbox
- 實用覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1` 用於手動執行較完整的 e2e 測試套件時啟用此測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用於指向非預設的 CLI binary 或 wrapper script

### 即時（真實提供者 + 真實模型）

- 命令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的 bundled-plugin 即時測試
- 預設值：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個提供者/模型 _今天_ 真的能用真實憑證運作嗎？」
  - 捕捉提供者格式變更、tool-calling quirks、驗證問題，以及速率限制行為
- 預期：
  - 設計上並非 CI 穩定（真實網路、真實提供者政策、配額、中斷）
  - 會花錢 / 使用速率限制額度
  - 偏好執行縮小範圍的子集，而不是「全部」
- 即時執行會 source `~/.profile` 以取得遺漏的 API keys。
- 預設情況下，即時執行仍會隔離 `HOME`，並將設定/驗證材料複製到暫存測試 home，讓單元測試 fixture 無法修改你真實的 `~/.openclaw`。
- 只有在你刻意需要即時測試使用真實 home directory 時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設為較安靜的模式：保留 `[live] ...` progress output，但抑制額外的 `~/.profile` notice，並讓 gateway bootstrap logs/Bonjour chatter 靜音。如果你想要完整 startup logs，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 輪替（特定提供者）：使用逗號/分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 進行每次即時執行覆寫；測試會在速率限制回應時重試。
- 進度/heartbeat 輸出：
  - 即時測試套件現在會向 stderr 發出進度行，因此即使 Vitest 主控台擷取很安靜，長時間的提供者呼叫仍可明顯看出正在活動。
  - `vitest.live.config.ts` 會停用 Vitest 主控台攔截，因此提供者/gateway 進度行會在即時執行期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整 direct-model heartbeats。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 gateway/probe heartbeats。

## 我應該執行哪個測試套件？

使用這個決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你變更很多，另執行 `pnpm test:coverage`）
- 觸及 gateway networking / WS protocol / pairing：加上 `pnpm test:e2e`
- 偵錯「my bot is down」/ 提供者特定失敗 / tool calling：執行縮小範圍的 `pnpm test:live`

## 即時（會觸及網路）測試

關於即時模型矩陣、CLI backend smokes、ACP smokes、Codex app-server
harness，以及所有 media-provider 即時測試（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness），再加上即時執行的憑證處理，請參閱
[測試即時測試套件](/zh-TW/help/testing-live)。關於專用的更新與
plugin 驗證檢查清單，請參閱
[測試更新與 plugins](/zh-TW/help/testing-updates-plugins)。

## Docker runners（選用的「可在 Linux 運作」檢查）

這些 Docker runners 分成兩個類別：

- 即時模型 runners：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker image 內執行其相符的 profile-key 即時檔案（`src/agents/models.profiles.live.test.ts` 與 `src/gateway/gateway-models.profiles.live.test.ts`），掛載你的本機 config dir 和 workspace（如果已掛載，也會 source `~/.profile`）。相符的本機 entrypoints 是 `test:live:models-profiles` 與 `test:live:gateway-profiles`。
- Docker 即時 runners 預設使用較小的 smoke 上限，讓完整 Docker sweep 保持可行：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明確想要較大的詳盡掃描時，才覆寫那些 env vars。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置即時 Docker image 一次，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包成 npm tarball 一次，然後建置/重用兩個 `scripts/e2e/Dockerfile` images。bare image 只是用於 install/update/plugin-dependency lanes 的 Node/Git runner；那些 lanes 會掛載預先建置的 tarball。functional image 會將同一個 tarball 安裝到 `/app`，供 built-app functionality lanes 使用。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的 plan。彙總使用加權本機 scheduler：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制 process slots，而 resource caps 會避免 heavy live、npm-install，以及 multi-service lanes 全部同時啟動。如果單一 lane 比啟用中的 caps 還重，scheduler 仍可在 pool 為空時啟動它，然後讓它單獨執行，直到再次有容量可用。預設值為 10 slots、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker host 有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。runner 預設會執行 Docker preflight、移除過期的 OpenClaw E2E containers、每 30 秒列印狀態、將成功 lane timings 儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行中使用這些 timings 優先啟動較長的 lanes。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印加權 lane manifest，而不建置或執行 Docker；或使用 `node scripts/test-docker-all.mjs --plan-json` 列印選定 lanes、package/image needs，以及 credentials 的 CI plan。
- `Package Acceptance` 是 GitHub 原生 package gate，用於檢查「這個可安裝的 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個候選 package，將其上傳為 `package-under-test`，然後對該確切 tarball 執行可重用的 Docker E2E lanes，而不是重新打包選定的 ref。Profiles 依廣度排序：`smoke`、`package`、`product` 與 `full`。請參閱[測試更新與 plugins](/zh-TW/help/testing-updates-plugins)，了解 package/update/plugin contract、published-upgrade survivor matrix、release defaults，以及 failure triage。
- Build 與 release checks 會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。此 guard 會從 `dist/entry.js` 與 `dist/cli/run-main.js` 走訪靜態建置 graph，如果 pre-dispatch startup 在 command dispatch 前匯入 Commander、prompt UI、undici 或 logging 等 package dependencies，就會失敗；它也會讓 bundled gateway run chunk 保持在預算內，並拒絕已知 cold gateway paths 的 static imports。Packaged CLI smoke 也涵蓋 root help、onboard help、doctor help、status、config schema，以及 model-list command。
- Package Acceptance legacy compatibility 截止於 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點之前，harness 只容許已發佈 package 的 metadata gaps：省略 private QA inventory entries、缺少 `gateway install --wrapper`、tarball-derived git fixture 中缺少 patch files、缺少 persisted `update.channel`、legacy plugin install-record locations、缺少 marketplace install-record persistence，以及 `plugins update` 期間的 config metadata migration。對於 `2026.4.25` 之後的 packages，這些路徑都是嚴格失敗。
- Container smoke runners：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`，以及 `test:docker:config-reload` 會啟動一個或多個真實 containers，並驗證較高層級的整合路徑。

即時模型 Docker runners 也只會 bind-mount 需要的 CLI auth homes（或在執行未縮小範圍時掛載所有支援的 auth homes），然後在執行前將它們複製到 container home，讓 external-CLI OAuth 可以重新整理 tokens，而不會修改 host auth store：

- 直接模型：`pnpm test:docker:live-models`（腳本：`scripts/test-live-models-docker.sh`）
- ACP 繫結冒煙測試：`pnpm test:docker:live-acp-bind`（腳本：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 提供嚴格的 Droid/OpenCode 覆蓋）
- CLI 後端冒煙測試：`pnpm test:docker:live-cli-backend`（腳本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒煙測試：`pnpm test:docker:live-codex-harness`（腳本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開發代理：`pnpm test:docker:live-gateway`（腳本：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性冒煙測試：`pnpm qa:otel:smoke` 是私有 QA 原始碼 checkout 通道。它刻意不屬於套件 Docker 發行通道，因為 npm tarball 會省略 QA Lab。
- Open WebUI 即時冒煙測試：`pnpm test:docker:openwebui`（腳本：`scripts/e2e/openwebui-docker.sh`）
- Onboarding 精靈（TTY，完整 scaffold）：`pnpm test:docker:onboard`（腳本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball onboarding/channel/agent 冒煙測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝打包好的 OpenClaw tarball，預設透過 env-ref onboarding 設定 OpenAI 加上 Telegram，執行 doctor，並執行一次模擬的 OpenAI agent 回合。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳過主機重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切換 channel。
- 更新 channel 切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝打包好的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證持久化的 channel 和 Plugin 更新後運作正常，接著切回套件 `stable` 並檢查更新狀態。
- 升級存活冒煙測試：`pnpm test:docker:upgrade-survivor` 會把打包好的 OpenClaw tarball 安裝到帶有 agents、channel 設定、Plugin allowlists、過期 Plugin 相依狀態，以及既有 workspace/session 檔案的髒舊使用者 fixture 上。它會在沒有即時 provider 或 channel 金鑰的情況下執行套件更新與非互動式 doctor，接著啟動 loopback Gateway，並檢查設定/狀態保留與啟動/狀態預算。
- 已發布升級存活冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設安裝 `openclaw@latest`，植入逼真的既有使用者檔案，用內建命令配方設定該基準線，驗證產生的設定，把該已發布安裝更新到候選 tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動 loopback Gateway，並檢查已設定 intents、狀態保留、啟動、`/healthz`、`/readyz` 與 RPC 狀態預算。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準線，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 要求彙總排程器展開精確基準線，例如 `all-since-2026.4.23`，並使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue 形狀的 fixture，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動外部 OpenClaw Plugin 安裝修復。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`。
- Session runtime context 冒煙測試：`pnpm test:docker:session-runtime-context` 驗證隱藏 runtime context transcript 持久化，以及 doctor 對受影響重複 prompt-rewrite 分支的修復。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會打包目前的 tree，在隔離 home 中以 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會回傳內建影像 providers，而不是卡住。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳過主機建置，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- Installer Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm 容器之間共用一個 npm 快取。Update 冒煙測試預設以 npm `latest` 作為 stable 基準線，再升級到候選 tarball。本機可用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上使用 Install Smoke workflow 的 `update_baseline_version` 輸入覆寫。非 root installer 檢查會保留隔離 npm 快取，讓 root 擁有的快取項目不會掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`，即可在本機重新執行時重用 root/update/direct-npm 快取。
- Install Smoke CI 會以 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳過重複的 direct-npm 全域更新；需要直接 `npm install -g` 覆蓋時，請在本機不帶該 env 執行腳本。
- Agents 刪除共享 workspace CLI 冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（腳本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設建置 root Dockerfile 映像，在隔離容器 home 中植入兩個 agents 與一個 workspace，執行 `agents delete --json`，並驗證有效 JSON 與保留 workspace 行為。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke 映像。
- Gateway 網路（兩個容器，WS 驗證 + health）：`pnpm test:docker:gateway-network`（腳本：`scripts/e2e/gateway-network-docker.sh`）
- 瀏覽器 CDP snapshot 冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（腳本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置原始碼 E2E 映像加上一層 Chromium，使用原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP role snapshots 涵蓋連結 URL、cursor-promoted clickables、iframe refs 和 frame metadata。
- OpenAI Responses web_search minimal reasoning 回歸測試：`pnpm test:docker:openai-web-search-minimal`（腳本：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行模擬的 OpenAI server，驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提升到 `low`，接著強制 provider schema 拒絕，並檢查原始詳細資訊是否出現在 Gateway logs 中。
- MCP channel bridge（已植入 Gateway + stdio bridge + 原始 Claude notification-frame 冒煙測試）：`pnpm test:docker:mcp-channels`（腳本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP tools（真實 stdio MCP server + 內嵌 Pi profile allow/deny 冒煙測試）：`pnpm test:docker:pi-bundle-mcp-tools`（腳本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP cleanup（真實 Gateway + 在隔離 Cron 和一次性 subagent 執行後拆除 stdio MCP child）：`pnpm test:docker:cron-mcp-cleanup`（腳本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（針對 local path、`file:`、帶 hoisted dependencies 的 npm registry、git moving refs、ClawHub kitchen-sink、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update 冒煙測試）：`pnpm test:docker:plugins`（腳本：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳過 ClawHub 區塊，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設 kitchen-sink package/runtime 配對。沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` 時，測試會使用 hermetic 本機 ClawHub fixture server。
- Plugin 更新未變更冒煙測試：`pnpm test:docker:plugin-update`（腳本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin lifecycle matrix 冒煙測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在裸容器中安裝打包好的 OpenClaw tarball，安裝 npm Plugin，切換 enable/disable，透過本機 npm registry 升級與降級它，刪除已安裝程式碼，接著驗證 uninstall 仍會移除過期狀態，同時記錄每個 lifecycle 階段的 RSS/CPU 指標。
- Config reload metadata 冒煙測試：`pnpm test:docker:config-reload`（腳本：`scripts/e2e/config-reload-source-docker.sh`）
- Plugins：`pnpm test:docker:plugins` 涵蓋針對 local path、`file:`、帶 hoisted dependencies 的 npm registry、git moving refs、ClawHub fixtures、marketplace updates，以及 Claude-bundle enable/inspect 的 install/update 冒煙測試。`pnpm test:docker:plugin-update` 涵蓋已安裝 Plugin 的未變更更新行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋資源追蹤的 npm Plugin 安裝、啟用、停用、升級、降級和缺失程式碼 uninstall。

若要手動預先建置並重用共享 functional 映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定時，套件特定映像覆寫（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共享映像時，如果它尚未存在於本機，腳本會拉取該映像。QR 和 installer Docker 測試會保留自己的 Dockerfiles，因為它們驗證的是套件/安裝行為，而不是共享的已建置 app runtime。

即時模型 Docker 執行器也會以唯讀方式 bind-mount 目前的 checkout，並將其 staged 到容器內的臨時工作目錄。這讓執行階段映像保持精簡，同時仍針對你的確切本機來源/config 執行 Vitest。
staging 步驟會略過大型的僅限本機快取與 app 建置輸出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及 app 本機的 `.build` 或 Gradle 輸出目錄，讓 Docker live 執行不會花好幾分鐘複製機器特定的 artifacts。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此 gateway live probes 不會在容器內啟動真正的 Telegram/Discord/等通道 workers。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要從該 Docker lane 縮小或排除 gateway live 覆蓋範圍時，也要傳入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高階的相容性 smoke：它會啟動一個啟用 OpenAI 相容 HTTP endpoints 的 OpenClaw gateway 容器，啟動一個針對該 gateway 的 pinned Open WebUI 容器，透過 Open WebUI 登入，驗證 `/api/models` 暴露 `openclaw/default`，然後透過 Open WebUI 的 `/api/chat/completions` proxy 傳送真正的 chat request。
第一次執行可能明顯較慢，因為 Docker 可能需要拉取 Open WebUI image，而 Open WebUI 也可能需要完成自己的 cold-start 設定。
此 lane 需要可用的 live model key，而 `OPENCLAW_PROFILE_FILE`（預設為 `~/.profile`）是在 Dockerized 執行中提供它的主要方式。
成功執行會列印一小段 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意設計為 deterministic，且不需要真正的 Telegram、Discord 或 iMessage 帳號。它會啟動一個 seeded Gateway 容器，啟動第二個容器來 spawn `openclaw mcp serve`，然後驗證 routed conversation discovery、transcript reads、attachment metadata、live event queue behavior、outbound send routing，以及透過真正 stdio MCP bridge 傳送的 Claude-style 通道 + permission notifications。notification 檢查會直接檢查原始 stdio MCP frames，因此 smoke 驗證的是 bridge 實際發出的內容，而不只是特定 client SDK 剛好呈現的內容。
`test:docker:pi-bundle-mcp-tools` 是 deterministic，且不需要 live model key。它會建置 repo Docker image，在容器內啟動真正的 stdio MCP probe server，透過 embedded Pi bundle MCP runtime materialize 該 server，執行 tool，然後驗證 `coding` 和 `messaging` 會保留 `bundle-mcp` tools，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 會過濾它們。
`test:docker:cron-mcp-cleanup` 是 deterministic，且不需要 live model key。它會以真正的 stdio MCP probe server 啟動一個 seeded Gateway，執行 isolated cron turn 和 `/subagents spawn` one-shot child turn，然後驗證 MCP child process 會在每次執行後結束。

手動 ACP plain-language thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此 script 供 regression/debug 工作流程使用。ACP thread routing validation 之後可能還會需要它，因此不要刪除。

實用 env vars：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）mounted 到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）mounted 到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）mounted 到 `/home/node/.profile`，並在執行測試前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 僅驗證從 `OPENCLAW_PROFILE_FILE` sourced 的 env vars，使用臨時 config/workspace dirs，且不掛載外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）mounted 到 `/home/node/.npm-global`，供 Docker 內 cached CLI installs 使用
- `$HOME` 下的外部 CLI auth dirs/files 會以唯讀方式 mounted 到 `/host-auth...` 下，然後在測試開始前複製到 `/home/node/...`
  - 預設 dirs：`.minimax`
  - 預設 files：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 縮小範圍的 provider runs 只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷需要的 dirs/files
  - 以 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗號清單（例如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`）手動 override
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於在容器內過濾 providers
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用於在不需要重建的 reruns 中重用既有的 `openclaw:local-live` image
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保 creds 來自 profile store（不是 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇 gateway 為 Open WebUI smoke 暴露的 model
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於 override Open WebUI smoke 使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用於 override pinned Open WebUI image tag

## 文件 sanity

編輯文件後執行 docs checks：`pnpm check:docs`。
當你也需要 in-page heading checks 時，執行完整的 Mintlify anchor validation：`pnpm docs:check-links:anchors`。

## Offline regression（CI-safe）

這些是不使用真正 providers 的「真實 pipeline」regressions：

- Gateway tool calling（mock OpenAI，真正 gateway + agent loop）：`src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway wizard（WS `wizard.start`/`wizard.next`，寫入 config + auth enforced）：`src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## Agent reliability evals（skills）

我們已經有一些 CI-safe tests，行為類似「agent reliability evals」：

- 透過真正 gateway + agent loop 進行 Mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 與 config effects 的 end-to-end wizard flows（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（見 [Skills](/zh-TW/tools/skills)）：

- **Decisioning：**當 prompt 中列出 skills 時，agent 是否會選擇正確的 skill（或避開無關的 skill）？
- **Compliance：**agent 是否會在使用前讀取 `SKILL.md`，並遵循 required steps/args？
- **Workflow contracts：**multi-turn scenarios，用於 assert tool order、session history carryover，以及 sandbox boundaries。

未來 evals 應先保持 deterministic：

- 使用 mock providers 的 scenario runner，用於 assert tool calls + order、skill file reads，以及 session wiring。
- 一小套以 skill 為重點的 scenarios（use vs avoid、gating、prompt injection）。
- Optional live evals（opt-in、env-gated）僅在 CI-safe suite 到位後加入。

## Contract tests（Plugin 與通道 shape）

Contract tests 會驗證每個已註冊的 Plugin 和通道都符合其 interface contract。它們會 iterate 所有 discovered plugins，並執行一組 shape 和 behavior assertions。預設的 `pnpm test` unit lane 會刻意略過這些 shared seam 和 smoke files；當你觸及 shared channel 或 provider surfaces 時，請明確執行 contract commands。

### Commands

- 所有 contracts：`pnpm test:contracts`
- 僅通道 contracts：`pnpm test:contracts:channels`
- 僅 Provider contracts：`pnpm test:contracts:plugins`

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
- 新增或修改通道或 provider Plugin 後
- 重構 Plugin registration 或 discovery 後

Contract tests 會在 CI 執行，且不需要真正的 API keys。

## 新增 regressions（指南）

當你修復 live 中發現的 provider/model issue 時：

- 盡可能新增 CI-safe regression（mock/stub provider，或 capture 確切的 request-shape transformation）
- 如果本質上只能 live-only（rate limits、auth policies），請讓 live test 維持 narrow，並透過 env vars opt-in
- 優先 target 能抓到 bug 的最小 layer：
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 或 CI-safe gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class derive 一個 sampled target，然後 assert traversal-segment exec ids 會被 rejected。
  - 如果你在 `src/secrets/target-registry-data.ts` 新增新的 `includeInPlan` SecretRef target family，請更新該測試中的 `classifyTargetClass`。該測試會刻意在 unclassified target ids 上失敗，讓新 classes 無法被默默略過。

## 相關

- [Testing live](/zh-TW/help/testing-live)
- [Testing updates and plugins](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
