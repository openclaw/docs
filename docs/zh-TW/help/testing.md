---
read_when:
    - 在本機或 CI 中執行測試
    - 新增模型/提供者錯誤的迴歸測試
    - Gateway + 代理程式行為偵錯
summary: 測試工具包：單元/端對端/即時測試套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-05-02T20:50:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三套 Vitest 測試套件（單元/整合、e2e、live）以及少量
Docker 執行器。這份文件是「我們如何測試」指南：

- 每套測試涵蓋什麼（以及它刻意_不_涵蓋什麼）。
- 常見工作流程要執行哪些命令（本機、推送前、除錯）。
- live 測試如何探索憑證並選擇模型/提供者。
- 如何為真實世界的模型/提供者問題新增迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、live transport lanes）**另有文件說明：

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) — 架構、命令介面、情境撰寫。
- [Matrix QA](/zh-TW/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的參考資料。
- [QA channel](/zh-TW/channels/qa-channel) — 由 repo 支援的情境使用的合成傳輸 Plugin。

此頁涵蓋執行一般測試套件與 Docker/Parallels 執行器。下方的 QA 專用執行器區段（[QA 專用執行器](#qa-specific-runners)）列出具體的 `qa` 呼叫，並指回上方參考資料。
</Note>

## 快速開始

多數情況：

- 完整閘門（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充足的機器上執行較快的本機完整測試套件：`pnpm test:max`
- 直接使用 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 在針對單一失敗反覆修改時，優先執行目標式測試。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA lane：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你觸及測試或想要額外信心時：

- 覆蓋率閘門：`pnpm test:coverage`
- E2E 測試套件：`pnpm test:e2e`

除錯真實提供者/模型時（需要真實憑證）：

- Live 測試套件（模型 + Gateway 工具/影像探測）：`pnpm test:live`
- 安靜地指定一個 live 檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行階段效能報告：派發 `OpenClaw Performance`，搭配
  `live_gpt54=true` 以取得真實 `openai/gpt-5.4` agent 回合，或搭配
  `deep_profile=true` 以取得 Kova CPU/heap/trace 成品。每日排程執行會在
  設定 `CLAWGRIT_REPORTS_TOKEN` 時，將 mock-provider、deep-profile 與 GPT 5.4 lane 成品
  發佈到 `openclaw/clawgrit-reports`。mock-provider 報告也包含原始碼層級的 Gateway 啟動、記憶體、
  Plugin 壓力、重複 fake-model hello-loop，以及 CLI 啟動數字。
- Docker live 模型掃描：`pnpm test:docker:live-models`
  - 每個被選取的模型現在會執行一個文字回合，加上一個小型類檔案讀取探測。
    中繼資料宣告支援 `image` 輸入的模型也會執行一個微型影像回合。
    隔離提供者失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋範圍：每日 `OpenClaw Scheduled Live And E2E Checks` 與手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true`
    呼叫可重用的 live/E2E workflow，其中包含依提供者分片的獨立 Docker live 模型矩陣作業。
  - 針對聚焦的 CI 重跑，派發 `OpenClaw Live And E2E Checks (Reusable)`，
    並設定 `include_live_suites: true` 與 `live_models_only: true`。
  - 將新的高訊號提供者秘密新增到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其
    排程/發佈呼叫端。
- 原生 Codex bound-chat 煙霧測試：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker live lane，使用 `/codex bind` 綁定合成
    Slack DM，演練 `/codex fast` 與
    `/codex permissions`，接著驗證純文字回覆與影像附件
    會透過原生 Plugin 綁定路由，而不是 ACP。
- Codex app-server harness 煙霧測試：`pnpm test:docker:live-codex-harness`
  - 透過 Plugin 擁有的 Codex app-server harness 執行 Gateway agent 回合，
    驗證 `/codex status` 與 `/codex models`，並預設演練影像、
    Cron MCP、sub-agent 與 Guardian 探測。隔離其他 Codex
    app-server 失敗時，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用 sub-agent 探測。若要做聚焦的 sub-agent 檢查，請停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    這會在 sub-agent 探測後結束，除非已設定
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`。
- Crestodian rescue 命令煙霧測試：`pnpm test:live:crestodian-rescue-channel`
  - 針對訊息通道救援命令介面的選擇性雙重保險檢查。
    它會演練 `/crestodian status`、佇列持久模型
    變更、回覆 `/crestodian yes`，並驗證稽核/設定寫入路徑。
- Crestodian planner Docker 煙霧測試：`pnpm test:docker:crestodian-planner`
  - 在無設定的容器中執行 Crestodian，並在 `PATH`
    上使用假的 Claude CLI，驗證模糊 planner fallback 會轉譯成經稽核的型別化
    設定寫入。
- Crestodian first-run Docker 煙霧測試：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw 狀態目錄開始，將裸 `openclaw` 路由到
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入，
    驗證設定，並驗證稽核項目。相同的 Ring 0 設定路徑也由 QA Lab 中的
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆蓋。
- Moonshot/Kimi 成本煙霧測試：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  針對 `moonshot/kimi-k2.6`。驗證 JSON 回報 Moonshot/K2.6，且
  assistant 轉錄儲存正規化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，請優先透過下方說明的 allowlist 環境變數縮小 live 測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA-lab 真實度時，這些命令會與主要測試套件並列：

CI 會在專用 workflow 中執行 QA Lab。Agentic parity 巢狀於
`QA-Lab - All Lanes` 與 release validation 之下，而不是獨立的 PR workflow。
廣泛驗證應使用 `Full Release Validation` 搭配
`rerun_group=qa-parity`，或使用 release-checks QA 群組。`QA-Lab - All Lanes`
會在 `main` 上每夜執行，也可由手動派發執行，並將 mock parity lane、live
Matrix lane、Convex 管理的 live Telegram lane，以及 Convex 管理的 live Discord
lane 作為平行作業。排程 QA 與 release checks 會明確傳遞 Matrix
`--profile fast`，而 Matrix CLI 與手動 workflow 輸入
預設仍為 `all`；手動派發可將 `all` 分片為 `transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 作業。`OpenClaw Release
Checks` 會在發佈核准前執行 parity 加上 fast Matrix 與 Telegram lane，
並對 release transport checks 使用 `mock-openai/gpt-5.5`，讓它們保持
決定性並避開一般提供者 Plugin 啟動。這些 live transport
Gateway 會停用記憶體搜尋；記憶體行為仍由 QA parity
測試套件覆蓋。

完整發佈 live media 分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 與 `ffprobe`。Docker live model/backend 分片使用共用的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像檔，該映像檔會針對每個選取的
commit 建置一次，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在
每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由 repo 支援的 QA 情境。
  - 預設使用隔離的
    Gateway worker 平行執行多個已選取情境。`qa-channel` 預設並行數為 4（受限於
    已選取的情境數量）。使用 `--concurrency <count>` 調整 worker
    數量，或使用 `--concurrency 1` 進入較舊的序列 lane。
  - 任一情境失敗時會以非零狀態結束。若你
    想要取得成品但不想要失敗結束碼，請使用 `--allow-failures`。
  - 支援 provider 模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 會啟動本機 AIMock 支援的 provider 伺服器，用於實驗性
    fixture 和 protocol-mock 覆蓋，而不會取代具備情境感知的
    `mock-openai` lane。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 Gateway 啟動基準，加上一小組模擬 QA Lab 情境套件
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`)，並在 `.artifacts/gateway-cpu-scenarios/`
    下寫入合併的 CPU 觀測摘要。
  - 預設只標記持續的高 CPU 觀測（`--cpu-core-warn`
    加上 `--hot-wall-warn-ms`），因此短暫的啟動突增會被記錄為指標，
    而不會看起來像持續數分鐘的 Gateway 滿載回歸。
  - 使用已建置的 `dist` 成品；當 checkout 尚未已有新鮮的 runtime 輸出時，
    請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 內執行相同的 QA 套件。
  - 保持與主機上的 `qa suite` 相同的情境選取行為。
  - 重用與 `qa suite` 相同的 provider/model 選取旗標。
  - Live 執行會轉送對 guest 實用且受支援的 QA auth 輸入：
    基於 env 的 provider key、QA live provider 設定路徑，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須保持在 repo 根目錄下，讓 guest 能透過
    掛載的工作區寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA 報告與摘要，以及 Multipass log。
- `pnpm qa:lab:up`
  - 啟動 Docker 支援的 QA 站台，用於 operator 風格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball、在
    Docker 中全域安裝、執行非互動式 OpenAI API key onboarding、預設設定 Telegram、
    驗證封裝的 Plugin runtime 可在無啟動相依性修復下載入、執行 doctor，
    並針對模擬的 OpenAI endpoint 執行一次本機 agent turn。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的 packaged-install
    lane。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式 runtime context transcript 執行確定性的 built-app Docker smoke。
    它會驗證隱藏的 OpenClaw runtime context 會被保留為非顯示的自訂訊息，
    而不是洩漏到可見的使用者 turn，接著植入受影響的損壞 session JSONL，
    並驗證 `openclaw doctor --fix` 會將其重寫到 active branch 並建立備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw 套件候選版本、執行 installed-package
    onboarding、透過已安裝的 CLI 設定 Telegram，然後重用
    live Telegram QA lane，並將該已安裝套件作為 SUT Gateway。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，可測試已解析的本機 tarball，而不是
    從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env 憑證或 Convex 憑證來源。
    對於 CI/release 自動化，請設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` 加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 role secret。若
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex role secret 存在於 CI，
    Docker wrapper 會自動選取 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會對此 lane 覆寫共用的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 將此 lane 暴露為手動 maintainer workflow
    `NPM Telegram Beta E2E`。它不會在 merge 時執行。該 workflow 使用
    `qa-live-shared` environment 和 Convex CI 憑證租約。
- GitHub Actions 也提供 `Package Acceptance`，用於針對單一候選套件進行 side-run 產品證明。
  它接受受信任的 ref、已發布的 npm spec、
  HTTPS tarball URL 加 SHA-256，或來自另一個 run 的 tarball artifact，上傳
  正規化的 `openclaw-current.tgz` 作為 `package-under-test`，然後使用 smoke、package、product、full 或 custom
  lane profile 執行現有的 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，以針對相同的 `package-under-test` artifact 執行
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

- Artifact 證明會從另一個 Actions run 下載 tarball artifact：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 在 Docker 中封裝並安裝目前的 OpenClaw build、啟動已設定 OpenAI 的 Gateway，
    然後透過設定編輯啟用內建 channel/Plugin。
  - 驗證 setup discovery 會讓未設定的可下載 Plugin 保持不存在、
    第一次已設定的 doctor repair 會明確安裝每個缺少的可下載
    Plugin，且第二次重新啟動不會執行隱藏的相依性
    repair。
  - 也會安裝已知較舊的 npm baseline，在執行
    `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證候選版本的
    post-update doctor 會清理舊版 Plugin 相依性殘留，而不需要
    harness-side postinstall repair。
- `pnpm test:parallels:npm-update`
  - 在 Parallels guest 上執行原生 packaged-install update smoke。每個
    已選取的平台會先安裝要求的 baseline 套件，接著在同一個 guest 中執行
    已安裝的 `openclaw update` 命令，並驗證已安裝版本、更新狀態、Gateway 就緒狀態，
    以及一次本機 agent turn。
  - 迭代單一 guest 時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。
    使用 `--json` 取得摘要 artifact 路徑與各 lane 狀態。
  - OpenAI lane 預設使用 `openai/gpt-5.5` 作為 live agent-turn 證明。
    若有意驗證另一個 OpenAI model，請傳入 `--model <provider/model>` 或設定
    `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 將長時間本機執行包在 host timeout 中，避免 Parallels transport 停滯
    消耗剩餘的測試時間窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 該 script 會在 `/tmp/openclaw-parallels-npm-update.*` 下寫入巢狀 lane log。
    在假設外層 wrapper 卡住之前，先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows update 在冷 guest 上可能花 10 到 15 分鐘進行 post-update doctor 和 package
    update 工作；只要巢狀 npm
    debug log 持續前進，這仍是正常狀態。
  - 不要將此彙總 wrapper 與個別 Parallels
    macOS、Windows 或 Linux smoke lane 平行執行。它們共用 VM 狀態，可能在
    snapshot restore、package serving 或 guest Gateway 狀態上衝突。
  - post-update 證明會執行一般的內建 Plugin 表面，因為
    speech、image generation 和 media
    understanding 等 capability facade 是透過內建 runtime API 載入，即使 agent
    turn 本身只檢查簡單文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider 伺服器，用於直接 protocol smoke
    testing。
- `pnpm openclaw qa matrix`
  - 針對一次性 Docker 支援的 Tuwunel homeserver 執行 Matrix live QA lane。僅限 source-checkout，packaged install 不會隨附 `qa-lab`。
  - 完整 CLI、profile/scenario 目錄、env var 和 artifact 版面配置：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自 env 的 driver 和 SUT bot token，針對真實私人群組執行 Telegram live QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必須是數字 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共用 pooled credentials。預設使用 env 模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以選擇 pooled lease。
  - 任一情境失敗時會以非零狀態結束。若你
    想要取得成品但不想要失敗結束碼，請使用 `--allow-failures`。
  - 需要兩個不同的 bot 位於同一個私人群組中，且 SUT bot 必須公開 Telegram 使用者名稱。
  - 為了穩定的 bot-to-bot 觀測，請在 `@BotFather` 中為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 能觀察群組 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA 報告、摘要和 observed-messages artifact。回覆情境包含從 driver send request 到觀測到 SUT reply 的 RTT。

Live transport lane 共用一個標準合約，讓新的 transport 不會偏移；各 lane 覆蓋矩陣位於 [QA 概覽 → Live transport 覆蓋](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的 synthetic suite，不屬於該矩陣。

### 透過 Convex 共用 Telegram 憑證 (v1)

為 `openclaw qa telegram` 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，
QA lab 會從 Convex 支援的 pool 取得獨占 lease、在 lane 執行期間對該 lease 送出 Heartbeat，
並在關閉時釋放 lease。

參考 Convex 專案 scaffold：

- `qa/convex-credential-broker/`

必要 env var：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選 role 的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- 憑證 role 選取：
  - CLI：`--credential-role maintainer|ci`
  - Env 預設值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中預設為 `ci`，否則為 `maintainer`）

選用 env var：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許 local-only 開發使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

Maintainer admin 命令（pool add/remove/list）特別需要
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供 maintainer 使用的 CLI helper：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在 live run 前使用 `doctor`，以檢查 Convex site URL、broker secret、
endpoint prefix、HTTP timeout，以及 admin/list 可達性，而不列印
secret 值。在 script 和 CI
utility 中使用 `--json` 取得 machine-readable 輸出。

預設端點契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 請求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗盡／可重試：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 請求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - 請求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /admin/add`（僅限維護者密鑰）
  - 請求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（僅限維護者密鑰）
  - 請求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 有效租用防護：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅限維護者密鑰）
  - 請求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram kind 的酬載形狀：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字型 Telegram 聊天 ID 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證此形狀，並拒絕格式錯誤的酬載。

### 將通道加入 QA

新通道配接器的架構與情境輔助程式名稱位於 [QA 概觀 → 新增通道](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低門檻：在共用的 `qa-lab` 主機接縫上實作傳輸執行器、在 Plugin manifest 中宣告 `qaRunners`、掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下編寫情境。

## 測試套件（在哪裡執行什麼）

可將這些套件視為「真實度逐步提高」（同時不穩定性／成本也逐步提高）：

### 單元／整合（預設）

- 命令：`pnpm test`
- 設定：未指定目標的執行會使用 `vitest.full-*.config.ts` 分片集合，並可能將多專案分片展開成個別專案設定以進行平行排程
- 檔案：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的核心／單元清單；UI 單元測試會在專用的 `unit-ui` 分片中執行
- 範圍：
  - 純單元測試
  - 程序內整合測試（Gateway 驗證、路由、工具、剖析、設定）
  - 已知錯誤的確定性回歸測試
- 預期：
  - 在 CI 中執行
  - 不需要真實密鑰
  - 應快速且穩定
  - 解析器與公開介面載入器測試必須以產生的微型 Plugin fixtures 證明廣泛的 `api.js` 與
    `runtime-api.js` 備援行為，而不是使用真實的 bundled Plugin 原始碼 API。真實的 Plugin API 載入應屬於
    Plugin 擁有的契約／整合套件。

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - 未指定目標的 `pnpm test` 會執行十二個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生根專案程序。這會降低負載機器上的峰值 RSS，並避免 auto-reply／extension 工作使無關套件飢餓。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片 watch 迴圈並不實用。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過範圍化通道路由明確的檔案／目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免支付完整根專案啟動成本。
    - `pnpm test:changed` 預設會將已變更的 git 路徑展開成低成本的範圍化通道：直接測試編輯、相鄰的 `*.test.ts` 檔案、明確的原始碼對應，以及本機 import 圖相依項。設定／setup／package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的正常智慧型本機檢查閘門。它會將 diff 分類為核心、核心測試、extensions、extension 測試、apps、文件、發行中繼資料、即時 Docker 工具，以及 tooling，然後執行對應的型別檢查、lint 與防護命令。它不會執行 Vitest 測試；請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>` 取得測試證明。僅發行中繼資料的版本升級會執行目標式版本／設定／根相依性檢查，並以防護拒絕頂層版本欄位以外的 package 變更。
    - 即時 Docker ACP harness 編輯會執行聚焦檢查：即時 Docker 驗證指令碼的 shell 語法，以及即時 Docker 排程器 dry-run。只有在 diff 限於 `scripts["test:docker:live-*"]` 時才會包含 `package.json` 變更；相依性、匯出、版本與其他 package 介面編輯仍使用較廣泛的防護。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和類似純工具區域的 import-light 單元測試會透過 `unit-fast` 通道路由，該通道會略過 `test/setup-openclaw-runtime.ts`；有狀態／runtime-heavy 檔案會留在既有通道。
    - 選定的 `plugin-sdk` 與 `commands` 輔助程式原始檔也會將 changed-mode 執行對應到這些輕量通道中的明確相鄰測試，因此輔助程式編輯可避免重新執行該目錄的完整重量級套件。
    - `auto-reply` 針對頂層核心輔助程式、頂層 `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹都有專用 bucket。CI 會進一步將 reply 子樹拆成 agent-runner、dispatch，以及 commands/state-routing 分片，避免單一 import-heavy bucket 擁有完整的 Node 長尾。
    - 一般 PR／main CI 會刻意略過 extension 批次掃描與僅發行用的 `agentic-plugins` 分片。Full Release Validation 會為發行候選版本上的那些 Plugin／extension-heavy 套件 dispatch 獨立的 `Plugin Prerelease` 子 workflow。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - 當你變更訊息工具探索輸入或 Compaction runtime
      context 時，請保留兩個層級的涵蓋率。
    - 為純路由與正規化邊界新增聚焦的輔助程式回歸測試。
    - 維持嵌入式執行器整合套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證範圍化 ID 與 Compaction 行為仍會流經真實的 `run.ts` / `compact.ts` 路徑；僅輔助程式的測試
      不能充分替代這些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - 基礎 Vitest 設定預設為 `threads`。
    - 共用 Vitest 設定固定 `isolate: false`，並在根專案、e2e 與 live 設定中使用
      非隔離執行器。
    - 根 UI 通道保留其 `jsdom` setup 與 optimizer，但也在
      共用非隔離執行器上執行。
    - 每個 `pnpm test` 分片都會繼承共用 Vitest 設定中的相同 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子 Node
      程序加入 `--no-maglev`，以降低大型本機執行期間的 V8 編譯 churn。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與原廠 V8
      行為比較。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構通道。
    - pre-commit hook 僅負責格式化。它會重新 stage 格式化後的檔案，且
      不會執行 lint、型別檢查或測試。
    - 當你需要智慧型本機檢查閘門時，請在交付或推送前明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過低成本的範圍化通道路由。只有在 agent
      判定 harness、設定、package 或契約編輯確實需要更廣泛的
      Vitest 涵蓋率時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行為，只是使用較高的 worker 上限。
    - 本機 worker 自動擴縮刻意採保守策略，且會在主機 load average 已經很高時退讓，因此多個並行
      Vitest 執行預設造成的影響較小。
    - 基礎 Vitest 設定會將 projects／config 檔案標記為
      `forceRerunTriggers`，讓 changed-mode 重新執行在測試
      wiring 變更時仍保持正確。
    - 設定會在支援的
      主機上保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 啟用；如果你想為直接 profiling 指定
      一個明確的快取位置，請設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` 會啟用 Vitest import-duration 報告以及
      import-breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling 視圖範圍限制在
      自 `origin/main` 以來變更的檔案。
    - 分片時間資料會寫入 `.artifacts/vitest-shard-timings.json`。
      Whole-config 執行會使用設定路徑作為 key；include-pattern CI
      分片會附加分片名稱，讓 filtered 分片可以分開追蹤。
    - 當某個 hot test 仍將大部分時間花在啟動 imports 上時，
      請將重量級相依項放在窄範圍的本機 `*.runtime.ts` 接縫後方，並
      直接 mock 該接縫，而不是 deep-import runtime helpers 只為了
      將它們傳入 `vi.mock(...)`。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會針對該已提交
      diff，比較路由後的 `test:changed` 與原生根專案路徑，
      並列印 wall time 與 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 和根 Vitest 設定來路由已變更檔案清單，
      以 benchmark 目前的 dirty tree。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite 啟動與 transform overhead 寫入主執行緒 CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用檔案平行化的情況下，為
      單元套件寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 穩定性（Gateway）

- 命令：`pnpm test:stability:gateway`
- 設定：`vitest.gateway.config.ts`，強制使用一個 worker
- 範圍：
  - 啟動一個真實的 loopback Gateway，預設啟用診斷
  - 透過診斷事件路徑驅動合成 Gateway 訊息、記憶體與大型酬載 churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 涵蓋診斷穩定性 bundle 持久化輔助程式
  - 斷言 recorder 維持有界、合成 RSS 樣本保持在壓力預算下方，且每個 session 的佇列深度都會 drain 回零
- 預期：
  - CI 安全且不需密鑰
  - 針對穩定性回歸追蹤的窄通道，不可取代完整 Gateway 套件

### E2E（Gateway smoke）

- 命令：`pnpm test:e2e`
- 設定：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的 bundled-Plugin E2E 測試
- Runtime 預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用自適應 workers（CI：最多 2，本機：預設 1）。
  - 預設以 silent mode 執行，以降低 console I/O overhead。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 可強制 worker 數量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 可重新啟用詳細 console 輸出。
- 範圍：
  - 多實例 Gateway 端對端行為
  - WebSocket／HTTP 介面、node 配對，以及較重的網路行為
- 預期：
  - 在 CI 中執行（當 pipeline 啟用時）
  - 不需要真實密鑰
  - 比單元測試有更多移動零件（可能較慢）

### E2E：OpenShell 後端 smoke

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 透過 Docker 在主機上啟動隔離的 OpenShell Gateway
  - 從暫時的本機 Dockerfile 建立 sandbox
  - 透過真實的 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell 後端
  - 透過 sandbox fs bridge 驗證遠端標準檔案系統行為
- 預期：
  - 僅限選用；不屬於預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` CLI 加上可運作的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀測試 Gateway 和 sandbox
- 實用覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1`：手動執行較廣泛的 e2e 套件時啟用此測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非預設的 CLI binary 或 wrapper script

### Live（真實 providers + 真實 models）

- 命令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 底下的內建 Plugin live tests
- 預設：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個 provider/model _今天_ 搭配真實 credentials 是否真的能運作？」
  - 捕捉 provider 格式變更、tool-calling 特性、auth 問題，以及 rate limit 行為
- 預期：
  - 設計上並非 CI 穩定（真實網路、真實 provider policies、quotas、outages）
  - 會花錢 / 使用 rate limits
  - 建議執行縮小範圍的子集，而不是「全部」
- Live runs 會 source `~/.profile` 以取得缺少的 API keys。
- 預設情況下，live runs 仍會隔離 `HOME`，並將 config/auth material 複製到暫時的 test home，讓 unit fixtures 無法修改你真實的 `~/.openclaw`。
- 只有在你刻意需要 live tests 使用真實 home directory 時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設為較安靜的模式：保留 `[live] ...` progress output，但隱藏額外的 `~/.profile` notice，並靜音 Gateway bootstrap logs/Bonjour chatter。若想恢復完整 startup logs，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key rotation（provider-specific）：設定 `*_API_KEYS`，使用 comma/semicolon 格式，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可透過 `OPENCLAW_LIVE_*_KEY` 進行 per-live override；tests 會在 rate limit responses 時重試。
- Progress/Heartbeat 輸出：
  - Live suites 現在會將 progress lines 發送到 stderr，讓較長的 provider calls 即使在 Vitest console capture 安靜時仍可看見活動狀態。
  - `vitest.live.config.ts` 會停用 Vitest console interception，讓 provider/Gateway progress lines 在 live runs 期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整 direct-model Heartbeats。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 Gateway/probe Heartbeats。

## 我應該執行哪個套件？

使用這個決策表：

- 編輯 logic/tests：執行 `pnpm test`（如果你改了很多，也執行 `pnpm test:coverage`）
- 觸及 Gateway networking / WS protocol / pairing：加入 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ provider-specific failures / tool calling：執行縮小範圍的 `pnpm test:live`

## Live（會觸及網路的）測試

如需 live model matrix、CLI backend smokes、ACP smokes、Codex app-server
harness，以及所有 media-provider live tests（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness），加上 live runs 的 credential handling，請參閱
[Testing live suites](/zh-TW/help/testing-live)。如需專用的 update 和
Plugin validation checklist，請參閱
[Testing updates and plugins](/zh-TW/help/testing-updates-plugins)。

## Docker runners（選用的「可在 Linux 運作」檢查）

這些 Docker runners 分為兩類：

- Live-model runners：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker image 內執行相符的 profile-key live file（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），並 mount 你的本機 config dir 和 workspace（如果已 mount，也會 source `~/.profile`）。相符的本機 entrypoints 是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live runners 預設使用較小的 smoke cap，讓完整 Docker sweep 保持實用：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明確想要較大的完整掃描時，才覆寫這些 env vars。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置一次 live Docker image，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包一次為 npm tarball，然後建置/重用兩個 `scripts/e2e/Dockerfile` images。bare image 只是用於 install/update/plugin-dependency lanes 的 Node/Git runner；這些 lanes 會 mount 預先建置的 tarball。functional image 會將同一個 tarball 安裝到 `/app`，用於 built-app functionality lanes。Docker lane definitions 位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner logic 位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選取的 plan。aggregate 使用加權本機 scheduler：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制 process slots，而 resource caps 會避免 heavy live、npm-install，以及 multi-service lanes 全部同時啟動。如果單一 lane 比 active caps 更重，scheduler 仍可在 pool 為空時啟動它，然後讓它單獨執行，直到 capacity 再次可用。預設為 10 slots、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`，以及 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker host 有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。runner 預設會執行 Docker preflight、移除陳舊的 OpenClaw E2E containers、每 30 秒列印 status、將成功 lane timings 儲存在 `.artifacts/docker-tests/lane-timings.json`，並使用這些 timings 在後續 runs 中優先啟動較長的 lanes。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不建置或執行 Docker 的情況下列印加權 lane manifest，或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lanes、package/image needs，以及 credentials 的 CI plan。
- `Package Acceptance` 是 GitHub-native package gate，用於回答「這個可安裝的 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個 candidate package，將其上傳為 `package-under-test`，然後針對該精確 tarball 執行 reusable Docker E2E lanes，而不是重新打包所選 ref。Profiles 依廣度排序為：`smoke`、`package`、`product` 和 `full`。如需 package/update/Plugin contract、published-upgrade survivor matrix、release defaults，以及 failure triage，請參閱 [Testing updates and plugins](/zh-TW/help/testing-updates-plugins)。
- Build 和 release checks 會在 tsdown 之後執行 `scripts/check-cli-bootstrap-imports.mjs`。guard 會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪 static built graph，並在 pre-dispatch startup 在 command dispatch 之前匯入 Commander、prompt UI、undici 或 logging 等 package dependencies 時失敗；它也會讓 bundled Gateway run chunk 保持在預算內，並拒絕 known cold Gateway paths 的 static imports。Packaged CLI smoke 也涵蓋 root help、onboard help、doctor help、status、config schema，以及 model-list command。
- Package Acceptance legacy compatibility 截止於 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該截止點之前，harness 只容忍 shipped-package metadata gaps：省略的 private QA inventory entries、缺少 `gateway install --wrapper`、tarball-derived git fixture 中缺少 patch files、缺少 persisted `update.channel`、legacy Plugin install-record locations、缺少 marketplace install-record persistence，以及 `plugins update` 期間的 config metadata migration。對於 `2026.4.25` 之後的 packages，這些 paths 都是 strict failures。
- Container smoke runners：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 會啟動一個或多個真實 containers，並驗證較高層級的 integration paths。

Live-model Docker runners 也只會 bind-mount 需要的 CLI auth homes（或在 run 未縮小範圍時 mount 所有支援的 homes），然後在 run 前將它們複製到 container home，讓 external-CLI OAuth 可以 refresh tokens，而不會修改 host auth store：

- 直接模型：`pnpm test:docker:live-models`（指令碼：`scripts/test-live-models-docker.sh`）
- ACP 綁定冒煙測試：`pnpm test:docker:live-acp-bind`（指令碼：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 對 Droid/OpenCode 進行嚴格覆蓋）
- CLI 後端冒煙測試：`pnpm test:docker:live-cli-backend`（指令碼：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server 測試框架冒煙測試：`pnpm test:docker:live-codex-harness`（指令碼：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開發代理程式：`pnpm test:docker:live-gateway`（指令碼：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性冒煙測試：`pnpm qa:otel:smoke` 是私有 QA 原始碼 checkout 執行線。它刻意不屬於套件 Docker 發布執行線，因為 npm tarball 省略了 QA Lab。
- Open WebUI 即時冒煙測試：`pnpm test:docker:openwebui`（指令碼：`scripts/e2e/openwebui-docker.sh`）
- Onboarding 精靈（TTY，完整鷹架）：`pnpm test:docker:onboard`（指令碼：`scripts/e2e/onboard-docker.sh`）
- Npm tarball onboarding/頻道/代理程式冒煙測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝打包好的 OpenClaw tarball，預設透過 env-ref onboarding 設定 OpenAI 加上 Telegram，執行 doctor，並執行一次模擬的 OpenAI 代理程式回合。用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 略過主機重建，或用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切換頻道。
- 更新頻道切換冒煙測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝打包好的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證持久化頻道和 Plugin 更新後工作狀態，然後切回套件 `stable` 並檢查更新狀態。
- 升級存活冒煙測試：`pnpm test:docker:upgrade-survivor` 會把打包好的 OpenClaw tarball 安裝到含有代理程式、頻道設定、Plugin allowlist、過期 Plugin 依賴狀態，以及既有工作區/工作階段檔案的髒舊使用者 fixture 上。它會在沒有即時供應商或頻道金鑰的情況下執行套件更新加上非互動式 doctor，然後啟動 loopback Gateway，並檢查設定/狀態保留以及啟動/狀態預算。
- 已發布升級存活冒煙測試：`pnpm test:docker:published-upgrade-survivor` 預設安裝 `openclaw@latest`，植入逼真的既有使用者檔案，使用烘焙好的命令配方設定該基線，驗證產生的設定，將該已發布安裝更新到候選 tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，然後啟動 loopback Gateway，並檢查已設定的 intents、狀態保留、啟動、`/healthz`、`/readyz` 和 RPC 狀態預算。用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基線，要求彙總排程器用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確基線，例如 `all-since-2026.4.23`，並用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue 形狀的 fixture，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動修復外部 OpenClaw Plugin 安裝。Package Acceptance 會將它們公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`。
- 工作階段執行階段脈絡冒煙測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏執行階段脈絡 transcript 持久化，以及 doctor 修復受影響的重複 prompt-rewrite 分支。
- Bun 全域安裝冒煙測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會打包目前樹狀目錄，在隔離的 home 中用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 會傳回內建影像供應商，而不是卡住。用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重用預先建置的 tarball，用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 略過主機建置，或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- 安裝程式 Docker 冒煙測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm 容器之間共用一個 npm 快取。更新冒煙測試預設以 npm `latest` 作為穩定基線，再升級到候選 tarball。在本機用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上用 Install Smoke workflow 的 `update_baseline_version` 輸入覆寫。非 root 安裝程式檢查會保留隔離的 npm 快取，讓 root 擁有的快取項目不會掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`，可在本機重新執行之間重用 root/update/direct-npm 快取。
- Install Smoke CI 會用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 略過重複的 direct-npm 全域更新；需要直接 `npm install -g` 覆蓋時，在本機不帶該 env 執行指令碼。
- Agents 刪除共用工作區 CLI 冒煙測試：`pnpm test:docker:agents-delete-shared-workspace`（指令碼：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設建置根 Dockerfile 映像，在隔離的容器 home 中植入兩個代理程式和一個工作區，執行 `agents delete --json`，並驗證有效 JSON 加上保留工作區行為。用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重用 install-smoke 映像。
- Gateway 網路（兩個容器，WS auth + health）：`pnpm test:docker:gateway-network`（指令碼：`scripts/e2e/gateway-network-docker.sh`）
- Browser CDP snapshot 冒煙測試：`pnpm test:docker:browser-cdp-snapshot`（指令碼：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置原始碼 E2E 映像加上一層 Chromium，以原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP role snapshots 涵蓋連結 URL、cursor-promoted clickables、iframe refs 和 frame metadata。
- OpenAI Responses web_search minimal reasoning 迴歸：`pnpm test:docker:openai-web-search-minimal`（指令碼：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行模擬的 OpenAI 伺服器，驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提升到 `low`，然後強制供應商 schema 拒絕，並檢查原始細節出現在 Gateway 記錄中。
- MCP 頻道橋接（已植入資料的 Gateway + stdio 橋接 + 原始 Claude notification-frame 冒煙測試）：`pnpm test:docker:mcp-channels`（指令碼：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真實 stdio MCP 伺服器 + 內嵌 Pi profile allow/deny 冒煙測試）：`pnpm test:docker:pi-bundle-mcp-tools`（指令碼：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真實 Gateway + 在隔離 cron 和一次性 subagent 執行後拆除 stdio MCP 子程序）：`pnpm test:docker:cron-mcp-cleanup`（指令碼：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（本機路徑、`file:`、含提升依賴的 npm registry、git moving refs、ClawHub kitchen-sink、marketplace updates，以及 Claude-bundle enable/inspect 的安裝/更新冒煙測試）：`pnpm test:docker:plugins`（指令碼：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 以略過 ClawHub 區塊，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的 kitchen-sink package/runtime 配對。沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` 時，測試會使用 hermetic 本機 ClawHub fixture 伺服器。
- Plugin 更新無變更冒煙測試：`pnpm test:docker:plugin-update`（指令碼：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 設定重新載入 metadata 冒煙測試：`pnpm test:docker:config-reload`（指令碼：`scripts/e2e/config-reload-source-docker.sh`）
- Plugins：`pnpm test:docker:plugins` 涵蓋本機路徑、`file:`、含提升依賴的 npm registry、git moving refs、ClawHub fixtures、marketplace updates，以及 Claude-bundle enable/inspect 的安裝/更新冒煙測試。`pnpm test:docker:plugin-update` 涵蓋已安裝 plugins 的無變更更新行為。

若要手動預先建置並重用共用功能映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

設定後，像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 這類套件專屬映像覆寫仍會優先。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，如果它尚未存在於本機，指令碼會拉取它。QR 和安裝程式 Docker 測試會保留自己的 Dockerfile，因為它們驗證的是套件/安裝行為，而不是共用的已建置應用程式執行階段。

即時模型 Docker runner 也會以唯讀方式 bind-mount 目前 checkout，並在容器內將其 stage 到暫存 workdir。這能讓執行階段映像保持精簡，同時仍針對你的精確本機原始碼/設定執行 Vitest。stage 步驟會略過大型本機專用快取與應用程式建置輸出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及應用程式本機 `.build` 或 Gradle 輸出目錄，讓 Docker 即時執行不會花數分鐘複製機器專屬 artifacts。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此 gateway 即時 probe 不會在容器內啟動真正的 Telegram/Discord/等頻道 worker。
`test:docker:live-models` 仍會執行 `pnpm test:live`，因此當你需要縮小或排除該 Docker 執行線中的 gateway 即時覆蓋時，也要傳入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高階的相容性冒煙測試：它會啟動已啟用 OpenAI 相容 HTTP 端點的 OpenClaw gateway 容器，啟動固定版本的 Open WebUI 容器並連到該 gateway，透過 Open WebUI 登入，驗證 `/api/models` 暴露 `openclaw/default`，然後透過 Open WebUI 的 `/api/chat/completions` proxy 傳送真實聊天請求。
第一次執行可能明顯較慢，因為 Docker 可能需要拉取 Open WebUI 映像，而 Open WebUI 可能需要完成自己的冷啟動設定。
此執行線需要可用的即時模型金鑰，而 `OPENCLAW_PROFILE_FILE`（預設為 `~/.profile`）是在 Docker 化執行中提供它的主要方式。
成功執行會列印小型 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意保持 deterministic，且不需要真正的 Telegram、Discord 或 iMessage 帳號。它會啟動已植入資料的 Gateway 容器，啟動第二個容器來 spawn `openclaw mcp serve`，然後驗證路由後的對話探索、transcript 讀取、附件 metadata、即時事件 queue 行為、outbound send routing，以及透過真實 stdio MCP 橋接傳送的 Claude 風格頻道 + 權限通知。通知檢查會直接檢視原始 stdio MCP frames，因此冒煙測試驗證的是橋接實際 emitted 的內容，而不只是特定 client SDK 剛好 surface 的內容。
`test:docker:pi-bundle-mcp-tools` 是 deterministic，且不需要即時模型金鑰。它會建置 repo Docker 映像，在容器內啟動真實 stdio MCP probe 伺服器，透過內嵌 Pi bundle MCP runtime materialize 該伺服器，執行工具，然後驗證 `coding` 和 `messaging` 會保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 會篩掉它們。
`test:docker:cron-mcp-cleanup` 是 deterministic，且不需要即時模型金鑰。它會啟動含真實 stdio MCP probe 伺服器的已植入資料 Gateway，執行隔離的 cron 回合與 `/subagents spawn` 一次性子回合，然後驗證 MCP 子程序會在每次執行後退出。

手動 ACP 自然語言 thread 冒煙測試（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此指令碼供迴歸/偵錯工作流程使用。ACP thread routing 驗證日後可能再次需要它，因此不要刪除。

實用 env vars：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）掛載到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）掛載到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）掛載到 `/home/node/.profile`，並在執行測試前載入
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 僅驗證從 `OPENCLAW_PROFILE_FILE` 載入的環境變數，使用暫時的設定/工作區目錄，且不掛載外部 CLI 驗證
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）掛載到 `/home/node/.npm-global`，用於 Docker 內快取的 CLI 安裝
- `$HOME` 下的外部 CLI 驗證目錄/檔案會以唯讀方式掛載到 `/host-auth...` 下，然後在測試開始前複製到 `/home/node/...`
  - 預設目錄：`.minimax`
  - 預設檔案：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 縮小範圍的供應商執行只會掛載從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要目錄/檔案
  - 使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的逗號清單手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於篩選容器內的供應商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用於在不需要重新建置的重跑中重用既有的 `openclaw:local-live` 映像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保憑證來自設定檔儲存區（而不是環境）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇 Gateway 為 Open WebUI 煙霧測試公開的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI 煙霧測試使用的 nonce 檢查提示
- `OPENWEBUI_IMAGE=...` 用於覆寫固定的 Open WebUI 映像標籤

## 文件健全性檢查

編輯文件後執行文件檢查：`pnpm check:docs`。
當你也需要頁面內標題檢查時，執行完整的 Mintlify 錨點驗證：`pnpm docs:check-links:anchors`。

## 離線迴歸（CI 安全）

這些是不使用真實供應商的「真實管線」迴歸：

- Gateway 工具呼叫（模擬 OpenAI，真實 Gateway + 代理程式迴圈）：`src/gateway/gateway.test.ts`（案例："runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway 精靈（WS `wizard.start`/`wizard.next`，寫入設定 + 強制驗證）：`src/gateway/gateway.test.ts`（案例："runs wizard over ws and writes auth token config"）

## 代理程式可靠性評估（Skills）

我們已經有幾個 CI 安全測試，其行為類似「代理程式可靠性評估」：

- 透過真實 Gateway + 代理程式迴圈進行模擬工具呼叫（`src/gateway/gateway.test.ts`）。
- 驗證工作階段接線與設定效果的端對端精靈流程（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請參閱 [Skills](/zh-TW/tools/skills)）：

- **決策：** 當 Skills 列在提示中時，代理程式是否會選擇正確的 Skills（或避免無關項目）？
- **合規性：** 代理程式是否會在使用前讀取 `SKILL.md`，並遵循必要步驟/引數？
- **工作流程合約：** 多輪情境，用於斷言工具順序、工作階段歷史延續，以及沙盒邊界。

未來評估應先保持確定性：

- 使用模擬供應商的情境執行器，用於斷言工具呼叫 + 順序、Skills 檔案讀取，以及工作階段接線。
- 一小組以 Skills 為焦點的情境（使用與避免、門檻、提示注入）。
- 選用的即時評估（選擇加入、由環境控制），僅在 CI 安全套件就緒後加入。

## 合約測試（Plugin 與通道形狀）

合約測試會驗證每個已註冊的 Plugin 與通道都符合其
介面合約。它們會迭代所有已發現的 Plugin，並執行一組
形狀與行為斷言。預設的 `pnpm test` 單元通道刻意
略過這些共用接縫與煙霧測試檔案；當你觸碰共用通道或供應商表面時，
請明確執行合約命令。

### 命令

- 所有合約：`pnpm test:contracts`
- 僅通道合約：`pnpm test:contracts:channels`
- 僅供應商合約：`pnpm test:contracts:plugins`

### 通道合約

位於 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本 Plugin 形狀（id、name、capabilities）
- **setup** - 設定精靈合約
- **session-binding** - 工作階段繫結行為
- **outbound-payload** - 訊息承載結構
- **inbound** - 傳入訊息處理
- **actions** - 通道動作處理常式
- **threading** - 執行緒 ID 處理
- **directory** - 目錄/名冊 API
- **group-policy** - 群組政策強制執行

### 供應商狀態合約

位於 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 通道狀態探測
- **registry** - Plugin 登錄檔形狀

### 供應商合約

位於 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 驗證流程合約
- **auth-choice** - 驗證選擇/選取
- **catalog** - 模型目錄 API
- **discovery** - Plugin 探索
- **loader** - Plugin 載入
- **runtime** - 供應商執行階段
- **shape** - Plugin 形狀/介面
- **wizard** - 設定精靈

### 何時執行

- 變更 plugin-sdk 匯出或子路徑後
- 新增或修改通道或供應商 Plugin 後
- 重構 Plugin 註冊或探索後

合約測試會在 CI 中執行，且不需要真實 API 金鑰。

## 新增迴歸（指引）

當你修復即時環境中發現的供應商/模型問題時：

- 盡可能新增 CI 安全的迴歸（模擬/ stub 供應商，或擷取精確的請求形狀轉換）
- 如果本質上只能即時測試（速率限制、驗證政策），請讓即時測試保持窄範圍，並透過環境變數選擇加入
- 優先鎖定能捕捉錯誤的最小層級：
  - 供應商請求轉換/重播錯誤 → 直接模型測試
  - Gateway 工作階段/歷史/工具管線錯誤 → Gateway 即時煙霧測試或 CI 安全的 Gateway 模擬測試
- SecretRef 周遊防護欄：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從登錄中繼資料（`listSecretTargetRegistryEntries()`）為每個 SecretRef 類別推導一個取樣目標，然後斷言包含周遊片段的 exec id 會遭拒。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增新的 `includeInPlan` SecretRef 目標家族，請更新該測試中的 `classifyTargetClass`。該測試會刻意在未分類的目標 id 上失敗，讓新的類別無法被靜默略過。

## 相關

- [即時測試](/zh-TW/help/testing-live)
- [測試更新與 Plugin](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
