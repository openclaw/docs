---
read_when:
    - 在本機或 CI 中執行測試
    - 新增模型/供應商錯誤的回歸測試
    - 偵錯 Gateway + 代理程式行為
summary: 測試工具包：單元/端對端/實際服務測試套件、Docker 執行器，以及每項測試涵蓋的內容
title: 測試
x-i18n:
    generated_at: "2026-05-03T21:36:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三個 Vitest 測試套件（單元/整合、e2e、即時）以及一小組
Docker 執行器。這份文件是「我們如何測試」指南：

- 每個套件涵蓋的內容（以及它刻意 _不_ 涵蓋的內容）。
- 常見工作流程（本機、推送前、偵錯）要執行哪些指令。
- 即時測試如何探索憑證並選擇模型/提供者。
- 如何為真實世界的模型/提供者問題加入迴歸測試。

<Note>
**QA 堆疊（qa-lab、qa-channel、即時傳輸通道）** 另有文件說明：

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) — 架構、指令介面、情境撰寫。
- [矩陣 QA](/zh-TW/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的參考。
- [QA channel](/zh-TW/channels/qa-channel) — repo 支援情境所使用的合成傳輸 Plugin。

本頁涵蓋一般測試套件與 Docker/Parallels 執行器的執行方式。下方 QA 專用執行器章節（[QA 專用執行器](#qa-specific-runners)）列出具體的 `qa` 呼叫，並指回上述參考文件。
</Note>

## 快速開始

多數日子：

- 完整關卡（推送前預期執行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在資源充裕機器上較快的本機完整套件執行：`pnpm test:max`
- 直接 Vitest 監看迴圈：`pnpm test:watch`
- 直接指定檔案現在也會路由 extension/channel 路徑：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 當你正在反覆處理單一失敗時，優先使用目標式執行。
- Docker 支援的 QA 站台：`pnpm qa:lab:up`
- Linux VM 支援的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

當你碰到測試或想要額外信心時：

- 覆蓋率關卡：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

偵錯真實提供者/模型時（需要真實憑證）：

- 即時套件（模型 + Gateway 工具/圖片探測）：`pnpm test:live`
- 安靜地指定一個即時檔案：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- 執行期效能報告：派送 `OpenClaw Performance`，並使用
  `live_gpt54=true` 進行真實 `openai/gpt-5.4` agent 回合，或使用
  `deep_profile=true` 產生 Kova CPU/heap/trace 成品。每日排程執行會在
  `CLAWGRIT_REPORTS_TOKEN` 已設定時，將 mock-provider、deep-profile 和 GPT 5.4 通道成品發布到
  `openclaw/clawgrit-reports`。
  mock-provider 報告也包含原始碼層級的 Gateway 啟動、記憶體、
  plugin-pressure、重複 fake-model hello-loop，以及 CLI 啟動數字。
- Docker 即時模型掃描：`pnpm test:docker:live-models`
  - 每個選定模型現在會執行一次文字回合加上一個小型檔案讀取風格探測。
    中繼資料宣告支援 `image` 輸入的模型也會執行一次微型圖片回合。
    隔離提供者失敗時，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 停用額外探測。
  - CI 覆蓋率：每日 `OpenClaw Scheduled Live And E2E Checks` 和手動
    `OpenClaw Release Checks` 都會以 `include_live_suites: true` 呼叫可重用的即時/E2E workflow，
    其中包含依提供者分片的獨立 Docker 即時模型矩陣作業。
  - 若要聚焦 CI 重新執行，請以 `include_live_suites: true` 和 `live_models_only: true`
    派送 `OpenClaw Live And E2E Checks (Reusable)`。
  - 將新的高訊號提供者 secret 加到 `scripts/ci-hydrate-live-auth.sh`
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和它的
    排程/發行呼叫端。
- 原生 Codex 綁定聊天煙霧測試：`pnpm test:docker:live-codex-bind`
  - 針對 Codex app-server 路徑執行 Docker 即時通道，使用 `/codex bind` 綁定合成
    Slack DM，演練 `/codex fast` 和
    `/codex permissions`，接著驗證純文字回覆與圖片附件
    會經由原生 Plugin 綁定而非 ACP 路由。
- Codex app-server harness 煙霧測試：`pnpm test:docker:live-codex-harness`
  - 透過 Plugin 擁有的 Codex app-server harness 執行 Gateway agent 回合，
    驗證 `/codex status` 和 `/codex models`，並預設演練圖片、
    cron MCP、sub-agent 和 Guardian 探測。隔離其他 Codex
    app-server 失敗時，可用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 停用 sub-agent 探測。若要進行聚焦的 sub-agent 檢查，停用其他探測：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非設定 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，
    否則這會在 sub-agent 探測後結束。
- Crestodian 救援指令煙霧測試：`pnpm test:live:crestodian-rescue-channel`
  - 針對訊息通道救援指令介面的選用雙重保險檢查。
    它會演練 `/crestodian status`、排入持久模型變更、
    回覆 `/crestodian yes`，並驗證稽核/設定寫入路徑。
- Crestodian planner Docker 煙霧測試：`pnpm test:docker:crestodian-planner`
  - 在沒有設定檔的容器中執行 Crestodian，並在 `PATH` 上放置假的 Claude CLI，
    驗證模糊 planner 後援會轉譯成經稽核的型別化設定寫入。
- Crestodian 首次執行 Docker 煙霧測試：`pnpm test:docker:crestodian-first-run`
  - 從空的 OpenClaw 狀態目錄開始，將裸 `openclaw` 路由到
    Crestodian，套用 setup/model/agent/Discord Plugin + SecretRef 寫入，
    驗證設定，並驗證稽核項目。同一個 Ring 0 設定路徑
    也在 QA Lab 中由
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 涵蓋。
- Moonshot/Kimi 成本煙霧測試：設定 `MOONSHOT_API_KEY` 後，執行
  `openclaw models list --provider moonshot --json`，接著針對
  `moonshot/kimi-k2.6` 執行隔離的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  驗證 JSON 回報 Moonshot/K2.6，且 assistant transcript 儲存標準化的 `usage.cost`。

<Tip>
當你只需要一個失敗案例時，優先透過下方描述的 allowlist 環境變數縮小即時測試範圍。
</Tip>

## QA 專用執行器

當你需要 QA-lab 真實度時，這些指令會與主要測試套件並列：

CI 會在專用 workflow 中執行 QA Lab。Agentic parity 巢狀位於
`QA-Lab - All Lanes` 和發行驗證下，不是獨立的 PR workflow。
廣泛驗證應使用 `Full Release Validation` 搭配
`rerun_group=qa-parity` 或 release-checks QA 群組。`QA-Lab - All Lanes`
會在 `main` 上每晚執行，也會透過手動派送執行，將 mock parity 通道、即時
Matrix 通道、Convex 管理的即時 Telegram 通道，以及 Convex 管理的即時 Discord
通道作為平行作業。排程 QA 與發行檢查會明確傳入 Matrix
`--profile fast`，而 Matrix CLI 與手動 workflow 輸入
預設值仍為 `all`；手動派送可將 `all` 分片為 `transport`、
`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作業。`OpenClaw Release
Checks` 會在發行核准前執行 parity 加上快速 Matrix 和 Telegram 通道，
並在發行傳輸檢查中使用 `mock-openai/gpt-5.5`，使其保持
決定性並避免一般提供者 Plugin 啟動。這些即時傳輸
Gateway 會停用記憶體搜尋；記憶體行為仍由 QA parity
套件涵蓋。

完整發行即時媒體分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已包含
`ffmpeg` 和 `ffprobe`。Docker 即時模型/後端分片使用共用的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 映像檔，該映像檔會針對每個選定的
commit 建置一次，接著以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取，而不是在
每個分片內重新建置。

- `pnpm openclaw qa suite`
  - 直接在主機上執行由 repo 支援的 QA 情境。
  - 預設以平行方式執行多個選取的情境，並使用隔離的
    Gateway worker。`qa-channel` 預設並行度為 4（受所選情境數量限制）。使用 `--concurrency <count>` 調整 worker
    數量，或使用 `--concurrency 1` 走較舊的序列 lane。
  - 任何情境失敗時會以非零狀態結束。當你想要產生成品但不想要失敗退出碼時，請使用 `--allow-failures`。
  - 支援 provider 模式 `live-frontier`、`mock-openai` 與 `aimock`。
    `aimock` 會啟動本機以 AIMock 支援的 provider 伺服器，用於實驗性
    fixture 與通訊協定 mock 覆蓋，而不會取代具情境感知的
    `mock-openai` lane。
- `pnpm test:gateway:cpu-scenarios`
  - 執行 Gateway 啟動 benchmark，加上一小組 mock QA Lab 情境套件
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），並在 `.artifacts/gateway-cpu-scenarios/`
    下寫入合併的 CPU 觀察摘要。
  - 預設只標記持續性的高溫 CPU 觀察（`--cpu-core-warn`
    加上 `--hot-wall-warn-ms`），因此短暫的啟動尖峰會被記錄為指標，
    而不會看起來像持續數分鐘的 Gateway 滿載迴歸。
  - 使用已建置的 `dist` 成品；當 checkout 尚未有新鮮的執行階段輸出時，請先執行建置。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 中執行相同的 QA 套件。
  - 保持與主機上 `qa suite` 相同的情境選取行為。
  - 重用與 `qa suite` 相同的 provider/model 選取旗標。
  - Live 執行會轉送對 guest 實用的受支援 QA auth 輸入：
    以 env 為基礎的 provider key、QA live provider config 路徑，以及存在時的 `CODEX_HOME`。
  - 輸出目錄必須留在 repo 根目錄下，讓 guest 能透過掛載的工作區寫回。
  - 在 `.artifacts/qa-e2e/...` 下寫入一般 QA 報告與摘要，以及 Multipass 記錄。
- `pnpm qa:lab:up`
  - 啟動由 Docker 支援、用於 operator 式 QA 工作的 QA 網站。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 從目前 checkout 建置 npm tarball，在 Docker 中全域安裝它，執行非互動式 OpenAI API key onboarding，預設設定 Telegram，驗證封裝的 Plugin 執行階段能載入且不需要啟動時依賴修復，執行 doctor，並對 mock OpenAI endpoint 執行一次本機 agent turn。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 執行相同的封裝安裝 lane。
- `pnpm test:docker:session-runtime-context`
  - 針對嵌入式執行階段 context transcript 執行確定性的已建置 app Docker smoke。它會驗證隱藏的 OpenClaw 執行階段 context 會作為非顯示自訂訊息保存，而不是洩漏到可見的使用者 turn，接著植入受影響的損壞 session JSONL，並驗證 `openclaw doctor --fix` 會將其重寫到 active branch 且建立備份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安裝 OpenClaw package candidate，執行已安裝 package 的 onboarding，透過已安裝 CLI 設定 Telegram，然後以該已安裝 package 作為 SUT Gateway，重用 live Telegram QA lane。
  - 預設為 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；設定
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可測試已解析的本機 tarball，而不是從 registry 安裝。
  - 使用與 `pnpm openclaw qa telegram` 相同的 Telegram env 憑證或 Convex 憑證來源。對於 CI/release 自動化，請設定
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，加上
    `OPENCLAW_QA_CONVEX_SITE_URL` 與角色 secret。如果
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色 secret 存在於 CI 中，
    Docker wrapper 會自動選取 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只會為此 lane 覆寫共用的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 將此 lane 暴露為手動 maintainer workflow
    `NPM Telegram Beta E2E`。它不會在 merge 時執行。此 workflow 使用
    `qa-live-shared` environment 與 Convex CI 憑證租約。
- GitHub Actions 也提供 `Package Acceptance`，用於針對一個 candidate package 進行 side-run 產品證明。它接受受信任的 ref、已發布的 npm spec、
  HTTPS tarball URL 加 SHA-256，或來自另一個 run 的 tarball artifact，將正規化的
  `openclaw-current.tgz` 上傳為 `package-under-test`，接著以 smoke、package、product、full 或 custom
  lane profile 執行既有 Docker E2E scheduler。設定 `telegram_mode=mock-openai` 或 `live-frontier`，即可針對相同的 `package-under-test` artifact 執行
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
  - 在 Docker 中打包並安裝目前的 OpenClaw 建置，啟動已設定 OpenAI 的 Gateway，
    接著透過 config 編輯啟用 bundled channel/Plugin。
  - 驗證 setup discovery 會讓未設定的 downloadable Plugin 保持不存在，
    第一次設定後的 doctor repair 會明確安裝每個缺少的 downloadable
    Plugin，而第二次重新啟動不會執行隱藏依賴修復。
  - 也會安裝已知的較舊 npm baseline，在執行
    `openclaw update --tag <candidate>` 前啟用 Telegram，並驗證 candidate 的
    post-update doctor 會清理 legacy Plugin 依賴殘留，而不需要 harness 端 postinstall repair。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels guest 執行原生封裝安裝更新 smoke。每個選取的平台會先安裝要求的 baseline package，接著在同一個 guest 中執行已安裝的
    `openclaw update` 指令，並驗證已安裝版本、更新狀態、Gateway 就緒狀態，以及一次本機 agent turn。
  - 在針對單一 guest 反覆測試時，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 取得摘要 artifact 路徑與各 lane 狀態。
  - OpenAI lane 預設使用 `openai/gpt-5.5` 作為 live agent-turn 證明。
    當刻意驗證另一個 OpenAI model 時，傳入 `--model <provider/model>` 或設定
    `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 將長時間本機執行包在主機 timeout 中，避免 Parallels 傳輸停滯消耗剩餘測試時間：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 此 script 會在 `/tmp/openclaw-parallels-npm-update.*` 下寫入巢狀 lane 記錄。
    在假設外層 wrapper 卡住前，請先檢查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows 更新在冷 guest 上可能會花 10 到 15 分鐘進行 post-update doctor 與 package
    更新工作；只要巢狀 npm debug log 仍在前進，這仍是健康狀態。
  - 不要將此彙總 wrapper 與個別 Parallels
    macOS、Windows 或 Linux smoke lane 平行執行。它們共用 VM 狀態，可能在 snapshot restore、package serving 或 guest Gateway 狀態上衝突。
  - post-update 證明會執行一般 bundled Plugin surface，因為語音、圖片生成與媒體理解等 capability facade 是透過 bundled runtime API 載入，即使 agent turn 本身只檢查簡單文字回應。

- `pnpm openclaw qa aimock`
  - 只啟動本機 AIMock provider 伺服器，用於直接的通訊協定 smoke 測試。
- `pnpm openclaw qa matrix`
  - 針對一次性的 Docker 支援 Tuwunel homeserver 執行 Matrix live QA lane。僅限 source checkout，封裝安裝不會出貨 `qa-lab`。
  - 完整 CLI、profile/情境 catalog、env var 與 artifact 版面配置：[Matrix QA](/zh-TW/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用來自 env 的 driver 與 SUT bot token，針對真實私人群組執行 Telegram live QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 與 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必須是數字形式的 Telegram chat id。
  - 支援 `--credential-source convex` 以使用共用 pooled 憑證。預設使用 env 模式，或設定 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 選擇使用 pooled lease。
  - 任何情境失敗時會以非零狀態結束。當你想要產生成品但不想要失敗退出碼時，請使用 `--allow-failures`。
  - 需要同一個私人群組中兩個不同的 bot，且 SUT bot 必須公開 Telegram username。
  - 為了穩定觀察 bot 對 bot，請在 `@BotFather` 為兩個 bot 啟用 Bot-to-Bot Communication Mode，並確保 driver bot 可觀察群組 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下寫入 Telegram QA 報告、摘要與 observed-messages artifact。回覆情境包含從 driver send request 到觀察到 SUT reply 的 RTT。

Live transport lane 共用一份標準 contract，讓新的 transport 不會偏移；各 lane 覆蓋矩陣位於 [QA overview → Live transport coverage](/zh-TW/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是廣泛的合成套件，不屬於該矩陣。

### 透過 Convex 共用 Telegram 憑證 (v1)

當為 `openclaw qa telegram` 啟用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）時，QA lab 會從 Convex 支援的 pool 取得獨占 lease，在 lane 執行期間對該 lease 發送 Heartbeat，並在關閉時釋放 lease。

參考 Convex project scaffold：

- `qa/convex-credential-broker/`

必要 env var：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所選角色的一個 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用於 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用於 `ci`
- 憑證角色選取：
  - CLI：`--credential-role maintainer|ci`
  - Env 預設：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中預設為 `ci`，否則為 `maintainer`）

選用 env var：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（預設 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（預設 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（預設 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（預設 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（預設 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（選用 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允許 local-only 開發使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在一般操作中應使用 `https://`。

Maintainer admin 指令（pool add/remove/list）明確需要
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供 maintainer 使用的 CLI helper：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在 live 執行前使用 `doctor` 檢查 Convex site URL、broker secret、
endpoint prefix、HTTP timeout 與 admin/list 可達性，且不會列印
secret value。在 script 與 CI utility 中使用 `--json` 取得機器可讀輸出。

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
- `POST /admin/add`（僅限維護者秘密）
  - 請求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（僅限維護者秘密）
  - 請求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 作用中租約防護：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（僅限維護者秘密）
  - 請求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 類型的酬載形狀：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必須是數字型 Telegram 聊天 ID 字串。
- `admin/add` 會針對 `kind: "telegram"` 驗證此形狀，並拒絕格式錯誤的酬載。

### 將頻道加入 QA

新頻道配接器的架構與情境輔助程式名稱位於 [QA overview → Adding a channel](/zh-TW/concepts/qa-e2e-automation#adding-a-channel)。最低要求：在共用的 `qa-lab` 主機 seam 上實作傳輸執行器，在 Plugin manifest 中宣告 `qaRunners`，掛載為 `openclaw qa <runner>`，並在 `qa/scenarios/` 下撰寫情境。

## 測試套件（哪些會在哪裡執行）

把這些套件視為「逐步提升真實度」（同時也增加不穩定性/成本）：

### 單元 / 整合（預設）

- 命令：`pnpm test`
- 設定：未指定目標的執行會使用 `vitest.full-*.config.ts` 分片組，並可能將多專案分片展開成逐專案設定以便平行排程
- 檔案：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的核心/單元清單；UI 單元測試在專用的 `unit-ui` 分片中執行
- 範圍：
  - 純單元測試
  - 程序內整合測試（Gateway 驗證、路由、工具、剖析、設定）
  - 已知錯誤的決定性迴歸測試
- 預期：
  - 在 CI 中執行
  - 不需要真實金鑰
  - 應該快速且穩定
  - Resolver 與公開介面載入器測試必須使用產生的小型 Plugin fixture 證明廣泛的 `api.js` 和
    `runtime-api.js` 後援行為，而不是
    真實的內建 Plugin 原始碼 API。真實 Plugin API 載入屬於
    Plugin 擁有的合約/整合套件。

<AccordionGroup>
  <Accordion title="專案、分片與範圍化通道">

    - 未指定目標的 `pnpm test` 會執行十二個較小的分片設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一個巨大的原生根專案程序。這會降低負載機器上的峰值 RSS，並避免 auto-reply/extension 工作讓無關套件無法取得資源。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 專案圖，因為多分片監看迴圈並不實際。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 會先透過範圍化通道路由明確的檔案/目錄目標，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可避免支付完整根專案啟動成本。
    - `pnpm test:changed` 預設會將變更的 git 路徑展開成低成本的範圍化通道：直接測試編輯、同層 `*.test.ts` 檔案、明確來源對應，以及本機 import graph 相依項。設定/安裝/package 編輯不會廣泛執行測試，除非你明確使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄範圍工作的標準智慧型本機檢查閘門。它會將 diff 分類成 core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling 和 tooling，然後執行相符的型別檢查、lint 與防護命令。它不會執行 Vitest 測試；請呼叫 `pnpm test:changed` 或明確的 `pnpm test <target>` 取得測試證明。僅 release metadata 的版本更新會執行目標式 version/config/root-dependency 檢查，並帶有拒絕頂層 version 欄位以外 package 變更的防護。
    - Live Docker ACP harness 編輯會執行聚焦檢查：live Docker auth scripts 的 shell 語法，以及 live Docker scheduler dry-run。只有當 diff 限於 `scripts["test:docker:live-*"]` 時，才會納入 `package.json` 變更；dependency、export、version 和其他 package 介面編輯仍使用更廣泛的防護。
    - 來自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 與類似純工具區域的輕量 import 單元測試會透過 `unit-fast` 通道路由，該通道會略過 `test/setup-openclaw-runtime.ts`；具狀態/重度 runtime 檔案則留在既有通道。
    - 選定的 `plugin-sdk` 與 `commands` 輔助來源檔案也會將 changed-mode 執行對應到這些輕量通道中的明確同層測試，因此輔助程式編輯可避免重新執行該目錄完整的重型套件。
    - `auto-reply` 具有專用桶，用於頂層核心輔助程式、頂層 `reply.*` 整合測試，以及 `src/auto-reply/reply/**` 子樹。CI 會進一步將 reply 子樹拆分成 agent-runner、dispatch 和 commands/state-routing 分片，因此單一 import-heavy 桶不會佔有完整 Node 尾端。
    - 一般 PR/main CI 會刻意略過 extension 批次掃描和僅 release 使用的 `agentic-plugins` 分片。Full Release Validation 會針對 release candidates 派發獨立的 `Plugin Prerelease` 子 workflow，以執行這些 Plugin/extension-heavy 套件。

  </Accordion>

  <Accordion title="內嵌執行器涵蓋範圍">

    - 當你變更 message-tool discovery 輸入或 Compaction runtime
      context 時，請保留兩個層級的涵蓋範圍。
    - 為純路由與正規化
      邊界新增聚焦的輔助程式迴歸測試。
    - 保持內嵌執行器整合套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`，以及
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 這些套件會驗證範圍化 id 與 Compaction 行為仍會流經
      真實的 `run.ts` / `compact.ts` 路徑；僅輔助程式的測試
      不能充分替代那些整合路徑。

  </Accordion>

  <Accordion title="Vitest pool 與 isolation 預設值">

    - 基礎 Vitest 設定預設為 `threads`。
    - 共用 Vitest 設定會固定 `isolate: false`，並在根專案、e2e 與 live 設定中使用
      非隔離執行器。
    - 根 UI 通道保留其 `jsdom` 設定與 optimizer，但同樣在
      共用非隔離執行器上執行。
    - 每個 `pnpm test` 分片都會從共用 Vitest 設定繼承相同的 `threads` + `isolate: false`
      預設值。
    - `scripts/run-vitest.mjs` 預設會為 Vitest 子 Node
      程序加入 `--no-maglev`，以降低大型本機執行期間的 V8 編譯變動。
      設定 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可與標準 V8
      行為比較。

  </Accordion>

  <Accordion title="快速本機迭代">

    - `pnpm changed:lanes` 會顯示 diff 觸發哪些架構通道。
    - pre-commit hook 僅處理格式化。它會重新暫存已格式化的檔案，且
      不會執行 lint、型別檢查或測試。
    - 在需要智慧型本機檢查閘門時，請於 handoff 或 push 前明確執行 `pnpm check:changed`。
    - `pnpm test:changed` 預設會透過低成本範圍化通道路由。只有當 agent
      判斷 harness、config、package 或 contract 編輯確實需要更廣泛的
      Vitest 涵蓋範圍時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由
      行為，只是使用較高的 worker 上限。
    - 本機 worker 自動縮放刻意保守，並會在主機 load average 已經偏高時退讓，因此多個並行
      Vitest 執行預設造成的影響較小。
    - 基礎 Vitest 設定會將 projects/config files 標記為
      `forceRerunTriggers`，因此當測試 wiring 變更時，changed-mode 重新執行仍保持正確。
    - 設定會在支援的主機上保持啟用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；
      如果你想要一個用於直接 profiling 的明確 cache 位置，請設定 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="效能除錯">

    - `pnpm test:perf:imports` 會啟用 Vitest import-duration 報告以及
      import-breakdown 輸出。
    - `pnpm test:perf:imports:changed` 會將相同的 profiling 視圖限制在
      自 `origin/main` 以來變更的檔案。
    - 分片時間資料會寫入 `.artifacts/vitest-shard-timings.json`。
      整個 config 的執行使用 config path 作為 key；include-pattern CI
      分片會附加分片名稱，因此已篩選分片可被分開追蹤。
    - 當某個熱門測試仍將大部分時間花在 startup imports 時，
      請將重型相依項放在狹窄的本機 `*.runtime.ts` seam 後方，並
      直接 mock 該 seam，而不是僅為了把 runtime helpers 傳入 `vi.mock(...)`
      就 deep-import 它們。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 會比較已路由的
      `test:changed` 與該已提交 diff 的原生根專案路徑，並列印 wall time 以及 macOS max RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 會透過
      `scripts/test-projects.mjs` 和根 Vitest 設定，路由 changed file list 來 benchmark 目前
      dirty tree。
    - `pnpm test:perf:profile:main` 會為
      Vitest/Vite 啟動與 transform overhead 寫入 main-thread CPU profile。
    - `pnpm test:perf:profile:runner` 會在停用 file parallelism 的情況下，為
      unit suite 寫入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 穩定性（Gateway）

- 命令：`pnpm test:stability:gateway`
- 設定：`vitest.gateway.config.ts`，強制使用一個 worker
- 範圍：
  - 啟動真實的 loopback Gateway，預設啟用 diagnostics
  - 透過 diagnostic event path 驅動合成 gateway 訊息、記憶體與大型酬載 churn
  - 透過 Gateway WS RPC 查詢 `diagnostics.stability`
  - 涵蓋 diagnostic stability bundle 持久化輔助程式
  - 斷言 recorder 保持有界、合成 RSS 樣本維持在壓力預算內，且每個 session queue depth 會排空回零
- 預期：
  - CI-safe 且不需要金鑰
  - 穩定性迴歸後續處理的窄通道，不能取代完整 Gateway 套件

### E2E（Gateway smoke）

- 命令：`pnpm test:e2e`
- 設定：`vitest.e2e.config.ts`
- 檔案：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的內建 Plugin E2E 測試
- Runtime 預設值：
  - 使用 Vitest `threads` 搭配 `isolate: false`，與 repo 其餘部分一致。
  - 使用 adaptive workers（CI：最多 2 個，本機：預設 1 個）。
  - 預設以 silent mode 執行，以降低 console I/O overhead。
- 實用覆寫：
  - `OPENCLAW_E2E_WORKERS=<n>` 用於強制 worker 數量（上限為 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用於重新啟用 verbose console output。
- 範圍：
  - 多實例 gateway 端對端行為
  - WebSocket/HTTP 介面、Node pairing，以及較重的網路處理
- 預期：
  - 在 CI 中執行（當 pipeline 啟用時）
  - 不需要真實金鑰
  - 比單元測試有更多 moving parts（可能較慢）

### E2E：OpenShell 後端 smoke

- 命令：`pnpm test:e2e:openshell`
- 檔案：`extensions/openshell/src/backend.e2e.test.ts`
- 範圍：
  - 透過 Docker 在主機上啟動隔離的 OpenShell Gateway
  - 從臨時本機 Dockerfile 建立沙盒
  - 透過真實的 `sandbox ssh-config` + SSH exec 測試 OpenClaw 的 OpenShell 後端
  - 透過沙盒 fs bridge 驗證遠端規範化檔案系統行為
- 預期：
  - 僅限選擇加入；不屬於預設 `pnpm test:e2e` 執行的一部分
  - 需要本機 `openshell` CLI 以及可運作的 Docker daemon
  - 使用隔離的 `HOME` / `XDG_CONFIG_HOME`，然後銷毀測試 Gateway 與沙盒
- 實用覆寫：
  - `OPENCLAW_E2E_OPENSHELL=1` 可在手動執行較廣泛的 e2e 套件時啟用測試
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 可指向非預設的 CLI binary 或 wrapper script

### 線上（真實供應商 + 真實模型）

- 命令：`pnpm test:live`
- 設定：`vitest.live.config.ts`
- 檔案：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 底下的 bundled-plugin live tests
- 預設：由 `pnpm test:live` **啟用**（設定 `OPENCLAW_LIVE_TEST=1`）
- 範圍：
  - 「這個供應商/模型在 _今天_ 搭配真實憑證是否真的可用？」
  - 捕捉供應商格式變更、tool-calling 特性、驗證問題與速率限制行為
- 預期：
  - 設計上並非 CI 穩定（真實網路、真實供應商政策、配額、服務中斷）
  - 會花錢 / 使用速率限制額度
  - 偏好執行縮小範圍的子集，而不是「全部」
- 線上執行會 source `~/.profile` 以取得缺少的 API 金鑰。
- 預設情況下，線上執行仍會隔離 `HOME`，並將設定/驗證材料複製到臨時測試 home，因此 unit fixtures 無法修改你真實的 `~/.openclaw`。
- 只有在你刻意需要線上測試使用真實 home 目錄時，才設定 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 現在預設為較安靜的模式：它保留 `[live] ...` 進度輸出，但抑制額外的 `~/.profile` notice，並靜音 Gateway bootstrap logs/Bonjour 雜訊。如果你想恢復完整啟動 logs，請設定 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 金鑰輪替（依供應商而定）：以逗號/分號格式設定 `*_API_KEYS`，或設定 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或透過 `OPENCLAW_LIVE_*_KEY` 做個別線上覆寫；測試會在收到速率限制回應時重試。
- 進度/Heartbeat 輸出：
  - 線上套件現在會將進度行輸出到 stderr，因此即使 Vitest console capture 很安靜，長時間供應商呼叫也能明顯顯示仍在活動。
  - `vitest.live.config.ts` 會停用 Vitest console interception，讓供應商/Gateway 進度行在 live runs 期間立即串流。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 調整 direct-model heartbeats。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 調整 Gateway/probe heartbeats。

## 我應該執行哪個套件？

使用這個決策表：

- 編輯邏輯/測試：執行 `pnpm test`（如果你變更很多，也執行 `pnpm test:coverage`）
- 觸及 Gateway networking / WS protocol / pairing：加上 `pnpm test:e2e`
- 偵錯「我的 bot 掛了」/ 供應商特定失敗 / tool calling：執行縮小範圍的 `pnpm test:live`

## 線上（會碰觸網路的）測試

如需 live model matrix、CLI backend smokes、ACP smokes、Codex app-server
harness，以及所有 media-provider live tests（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness）加上 live runs 的憑證處理，請參閱
[測試線上套件](/zh-TW/help/testing-live)。如需專用的更新與
Plugin 驗證檢查清單，請參閱
[測試更新與 Plugins](/zh-TW/help/testing-updates-plugins)。

## Docker runners（可選的「可在 Linux 運作」檢查）

這些 Docker runners 分成兩類：

- Live-model runners：`test:docker:live-models` 和 `test:docker:live-gateway` 只會在 repo Docker image 內執行各自相符的 profile-key live file（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），掛載你的本機 config dir 與 workspace（如果已掛載，也會 source `~/.profile`）。相符的本機 entrypoints 是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live runners 預設使用較小的 smoke cap，讓完整 Docker sweep 保持實用：
  `test:docker:live-models` 預設為 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 預設為 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。當你明確想要更大的完整掃描時，請覆寫這些 env vars。
- `test:docker:all` 會先透過 `test:docker:live-build` 建置 live Docker image 一次，透過 `scripts/package-openclaw-for-docker.mjs` 將 OpenClaw 打包一次成 npm tarball，然後建置/重用兩個 `scripts/e2e/Dockerfile` images。bare image 只是 install/update/plugin-dependency lanes 的 Node/Git runner；這些 lanes 會掛載預先建置的 tarball。functional image 會將同一個 tarball 安裝到 `/app`，供 built-app functionality lanes 使用。Docker lane definitions 位於 `scripts/lib/docker-e2e-scenarios.mjs`；planner logic 位於 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 會執行選定的 plan。aggregate 使用 weighted local scheduler：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制 process slots，而 resource caps 會避免 heavy live、npm-install 與 multi-service lanes 同時全部啟動。如果單一 lane 比作用中的 caps 更重，scheduler 仍可在 pool 為空時啟動它，然後讓它獨自執行，直到 capacity 再次可用。預設為 10 slots、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有在 Docker host 有更多餘裕時，才調整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。runner 預設會執行 Docker preflight、移除過時的 OpenClaw E2E containers、每 30 秒列印狀態，將成功的 lane timings 儲存在 `.artifacts/docker-tests/lane-timings.json`，並在後續執行時使用這些 timings 先啟動較長的 lanes。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可列印 weighted lane manifest 而不建置或執行 Docker，或使用 `node scripts/test-docker-all.mjs --plan-json` 列印所選 lanes、package/image needs 與 credentials 的 CI plan。
- `Package Acceptance` 是 GitHub-native package gate，用來確認「這個可安裝的 tarball 是否能作為產品運作？」它會從 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一個 candidate package，將其上傳為 `package-under-test`，然後針對該精確 tarball 執行 reusable Docker E2E lanes，而不是重新打包所選 ref。Profiles 依涵蓋廣度排序：`smoke`、`package`、`product` 和 `full`。請參閱[測試更新與 Plugins](/zh-TW/help/testing-updates-plugins)，了解 package/update/Plugin contract、published-upgrade survivor matrix、release defaults 與 failure triage。
- Build and release checks 會在 tsdown 後執行 `scripts/check-cli-bootstrap-imports.mjs`。guard 會從 `dist/entry.js` 和 `dist/cli/run-main.js` 走訪 static built graph，如果 pre-dispatch startup 在 command dispatch 之前匯入 Commander、prompt UI、undici 或 logging 等 package dependencies，就會失敗；它也會讓 bundled gateway run chunk 保持在 budget 內，並拒絕已知 cold gateway paths 的 static imports。Packaged CLI smoke 也涵蓋 root help、onboard help、doctor help、status、config schema 與 model-list command。
- Package Acceptance legacy compatibility 上限為 `2026.4.25`（包含 `2026.4.25-beta.*`）。在該 cutoff 之前，harness 只容許已發佈套件的 metadata gaps：省略的 private QA inventory entries、缺少 `gateway install --wrapper`、tarball-derived git fixture 中缺少 patch files、缺少 persisted `update.channel`、legacy plugin install-record locations、缺少 marketplace install-record persistence，以及 `plugins update` 期間的 config metadata migration。對 `2026.4.25` 之後的 packages，這些路徑都是嚴格失敗。
- Container smoke runners：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix` 和 `test:docker:config-reload` 會啟動一個或多個真實 containers，並驗證較高層級的整合路徑。

live-model Docker runners 也只會 bind-mount 所需的 CLI auth homes（或在執行未縮小範圍時掛載所有支援的 homes），然後在執行前將它們複製到 container home，讓 external-CLI OAuth 可以 refresh tokens，而不會修改 host auth store：

- 直接模型：`pnpm test:docker:live-models`（指令碼：`scripts/test-live-models-docker.sh`）
- ACP 綁定煙霧測試：`pnpm test:docker:live-acp-bind`（指令碼：`scripts/test-live-acp-bind-docker.sh`；預設涵蓋 Claude、Codex 和 Gemini，並透過 `pnpm test:docker:live-acp-bind:droid` 與 `pnpm test:docker:live-acp-bind:opencode` 嚴格涵蓋 Droid/OpenCode）
- CLI 後端煙霧測試：`pnpm test:docker:live-cli-backend`（指令碼：`scripts/test-live-cli-backend-docker.sh`）
- Codex 應用程式伺服器測試框架煙霧測試：`pnpm test:docker:live-codex-harness`（指令碼：`scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開發代理：`pnpm test:docker:live-gateway`（指令碼：`scripts/test-live-gateway-models-docker.sh`）
- 可觀測性煙霧測試：`pnpm qa:otel:smoke` 是私有 QA 原始碼簽出通道。它刻意不屬於套件 Docker 發布通道，因為 npm tarball 省略了 QA Lab。
- Open WebUI 即時煙霧測試：`pnpm test:docker:openwebui`（指令碼：`scripts/e2e/openwebui-docker.sh`）
- 入門精靈（TTY，完整架構產生）：`pnpm test:docker:onboard`（指令碼：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 入門/頻道/代理煙霧測試：`pnpm test:docker:npm-onboard-channel-agent` 會在 Docker 中全域安裝打包好的 OpenClaw tarball，預設透過 env-ref 入門流程設定 OpenAI 加上 Telegram，執行 doctor，並執行一次模擬的 OpenAI 代理回合。可用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重複使用預先建置的 tarball，用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 略過主機重建，或用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切換頻道。
- 更新頻道切換煙霧測試：`pnpm test:docker:update-channel-switch` 會在 Docker 中全域安裝打包好的 OpenClaw tarball，從套件 `stable` 切換到 git `dev`，驗證持久化的頻道與 Plugin 更新後功能，接著切回套件 `stable` 並檢查更新狀態。
- 升級存活煙霧測試：`pnpm test:docker:upgrade-survivor` 會把打包好的 OpenClaw tarball 安裝到一個骯髒的舊使用者 fixture 之上，其中含有代理、頻道設定、Plugin allowlist、過時的 Plugin 相依狀態，以及既有的工作區/工作階段檔案。它會執行套件更新與非互動式 doctor，不使用即時提供者或頻道金鑰，接著啟動一個 loopback Gateway，並檢查設定/狀態保留與啟動/狀態預算。
- 已發布升級存活煙霧測試：`pnpm test:docker:published-upgrade-survivor` 預設安裝 `openclaw@latest`，植入逼真的既有使用者檔案，用內建命令配方設定該基準線，驗證產生的設定，將該已發布安裝更新到候選 tarball，執行非互動式 doctor，寫入 `.artifacts/upgrade-survivor/summary.json`，接著啟動一個 loopback Gateway，並檢查已設定意圖、狀態保留、啟動、`/healthz`、`/readyz` 和 RPC 狀態預算。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆寫單一基準線，要求彙總排程器用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展開精確基準線，例如 `all-since-2026.4.23`，並用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` 展開 issue 形狀的 fixture，例如 `reported-issues`；reported-issues 集合包含 `configured-plugin-installs`，用於自動修復外部 OpenClaw Plugin 安裝。Package Acceptance 會將這些公開為 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`。
- 工作階段執行階段情境煙霧測試：`pnpm test:docker:session-runtime-context` 會驗證隱藏執行階段情境逐字稿持久化，以及 doctor 對受影響重複 prompt-rewrite 分支的修復。
- Bun 全域安裝煙霧測試：`bash scripts/e2e/bun-global-install-smoke.sh` 會打包目前樹狀結構，在隔離的 home 中用 `bun install -g` 安裝，並驗證 `openclaw infer image providers --json` 傳回 bundled 圖像提供者，而不是卡住。可用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 重複使用預先建置的 tarball，用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 略過主機建置，或用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 從已建置的 Docker 映像複製 `dist/`。
- 安裝程式 Docker 煙霧測試：`bash scripts/test-install-sh-docker.sh` 會在其 root、update 和 direct-npm 容器之間共用一個 npm 快取。更新煙霧測試預設使用 npm `latest` 作為穩定基準線，再升級到候選 tarball。可在本機用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆寫，或在 GitHub 上用 Install Smoke 工作流程的 `update_baseline_version` 輸入覆寫。非 root 安裝程式檢查會保留隔離的 npm 快取，因此 root 擁有的快取項目不會掩蓋使用者本機安裝行為。設定 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 即可在本機重新執行時重複使用 root/update/direct-npm 快取。
- Install Smoke CI 會用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 略過重複的 direct-npm 全域更新；需要直接 `npm install -g` 覆蓋時，請在本機執行該指令碼且不要設定該 env。
- 代理刪除共用工作區 CLI 煙霧測試：`pnpm test:docker:agents-delete-shared-workspace`（指令碼：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）預設建置根 Dockerfile 映像，在隔離的容器 home 中植入兩個代理與一個工作區，執行 `agents delete --json`，並驗證有效 JSON 與保留工作區行為。可用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 重複使用 install-smoke 映像。
- Gateway 網路（兩個容器，WS 驗證 + 健康狀態）：`pnpm test:docker:gateway-network`（指令碼：`scripts/e2e/gateway-network-docker.sh`）
- 瀏覽器 CDP 快照煙霧測試：`pnpm test:docker:browser-cdp-snapshot`（指令碼：`scripts/e2e/browser-cdp-snapshot-docker.sh`）會建置原始碼 E2E 映像加上一層 Chromium，使用原始 CDP 啟動 Chromium，執行 `browser doctor --deep`，並驗證 CDP 角色快照涵蓋連結 URL、游標提升的可點擊項目、iframe 參照與 frame 中繼資料。
- OpenAI Responses web_search 最小推理迴歸：`pnpm test:docker:openai-web-search-minimal`（指令碼：`scripts/e2e/openai-web-search-minimal-docker.sh`）會透過 Gateway 執行模擬的 OpenAI 伺服器，驗證 `web_search` 會將 `reasoning.effort` 從 `minimal` 提升到 `low`，接著強制提供者 schema 拒絕，並檢查原始詳細資訊出現在 Gateway 記錄中。
- MCP 頻道橋接（已植入的 Gateway + stdio 橋接 + 原始 Claude notification-frame 煙霧測試）：`pnpm test:docker:mcp-channels`（指令碼：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真實 stdio MCP 伺服器 + 內嵌 Pi profile allow/deny 煙霧測試）：`pnpm test:docker:pi-bundle-mcp-tools`（指令碼：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真實 Gateway + 在隔離 cron 與一次性 subagent 執行後拆除 stdio MCP 子程序）：`pnpm test:docker:cron-mcp-cleanup`（指令碼：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（本機路徑、`file:`、含提升相依項的 npm registry、git 移動參照、ClawHub kitchen-sink、marketplace 更新，以及 Claude-bundle 啟用/檢查的安裝/更新煙霧測試）：`pnpm test:docker:plugins`（指令碼：`scripts/e2e/plugins-docker.sh`）
  設定 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可略過 ClawHub 區塊，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆寫預設的 kitchen-sink 套件/執行階段配對。沒有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` 時，測試會使用 hermetic 本機 ClawHub fixture 伺服器。
- Plugin 更新未變更煙霧測試：`pnpm test:docker:plugin-update`（指令碼：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin 生命週期矩陣煙霧測試：`pnpm test:docker:plugin-lifecycle-matrix` 會在裸容器中安裝打包好的 OpenClaw tarball，安裝一個 npm Plugin，切換啟用/停用，透過本機 npm registry 對它升級與降級，刪除已安裝程式碼，接著驗證解除安裝仍會移除過時狀態，同時記錄每個生命週期階段的 RSS/CPU 指標。
- 設定重新載入中繼資料煙霧測試：`pnpm test:docker:config-reload`（指令碼：`scripts/e2e/config-reload-source-docker.sh`）
- Plugins：`pnpm test:docker:plugins` 涵蓋本機路徑、`file:`、含提升相依項的 npm registry、git 移動參照、ClawHub fixtures、marketplace 更新，以及 Claude-bundle 啟用/檢查的安裝/更新煙霧測試。`pnpm test:docker:plugin-update` 涵蓋已安裝 Plugin 的未變更更新行為。`pnpm test:docker:plugin-lifecycle-matrix` 涵蓋資源追蹤的 npm Plugin 安裝、啟用、停用、升級、降級與缺少程式碼時的解除安裝。

若要手動預先建置並重複使用共用功能映像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

套件特定映像覆寫（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）在設定時仍會優先採用。當 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向遠端共用映像時，如果它尚未在本機存在，指令碼會拉取它。QR 與安裝程式 Docker 測試會保留自己的 Dockerfile，因為它們驗證的是套件/安裝行為，而不是共用的已建置應用程式執行階段。

live-model Docker 執行器也會以唯讀方式 bind-mount 目前簽出的工作副本，並
將它 staged 到容器內的臨時工作目錄。這會讓 runtime
image 保持精簡，同時仍針對你確切的本機 source/config 執行 Vitest。
staging 步驟會略過大型的本機限定快取與 app 建置輸出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及 app 本機 `.build` 或
Gradle 輸出目錄，讓 Docker live 執行不會花數分鐘複製
特定機器的成品。
它們也會設定 `OPENCLAW_SKIP_CHANNELS=1`，因此 gateway live probe 不會在
容器內啟動真正的 Telegram/Discord/等 channel worker。
`test:docker:live-models` 仍會執行 `pnpm test:live`，所以當你需要縮小或排除該 Docker lane 的 gateway
live coverage 時，也請傳入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是較高階的相容性 smoke：它會啟動一個
已啟用 OpenAI-compatible HTTP endpoint 的 OpenClaw gateway container，
針對該 Gateway 啟動固定版本的 Open WebUI container，透過
Open WebUI 登入，驗證 `/api/models` 會公開 `openclaw/default`，然後透過 Open WebUI 的 `/api/chat/completions` proxy 傳送
真正的 chat request。
第一次執行可能明顯較慢，因為 Docker 可能需要 pull
Open WebUI image，而 Open WebUI 也可能需要完成自身的 cold-start setup。
這個 lane 預期有可用的 live model key，而 `OPENCLAW_PROFILE_FILE`
（預設為 `~/.profile`）是在 Dockerized 執行中提供它的主要方式。
成功的執行會列印小型 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意設計為 deterministic，且不需要
真正的 Telegram、Discord 或 iMessage 帳號。它會啟動一個 seeded Gateway
container，啟動第二個 container 來 spawn `openclaw mcp serve`，接著
驗證 routed conversation discovery、transcript read、attachment metadata、
live event queue 行為、outbound send routing，以及透過真正的 stdio MCP bridge 傳送的 Claude-style channel +
permission notification。notification check
會直接檢查 raw stdio MCP frame，因此此 smoke 驗證的是
bridge 實際 emit 的內容，而不只是特定 client SDK 恰好呈現的內容。
`test:docker:pi-bundle-mcp-tools` 是 deterministic，且不需要 live
model key。它會建置 repo Docker image，在 container 內啟動真正的 stdio MCP probe server，
透過嵌入式 Pi bundle
MCP runtime materialize 該 server，執行 tool，然後驗證 `coding` 與 `messaging` 保留
`bundle-mcp` tools，而 `minimal` 與 `tools.deny: ["bundle-mcp"]` 會將其 filter 掉。
`test:docker:cron-mcp-cleanup` 是 deterministic，且不需要 live model
key。它會啟動帶有真正 stdio MCP probe server 的 seeded Gateway，執行
isolated cron turn 與 `/subagents spawn` one-shot child turn，然後驗證
每次執行後 MCP child process 都會結束。

手動 ACP plain-language thread smoke（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此 script 供 regression/debug workflow 使用。ACP thread routing validation 之後可能再次需要它，所以不要刪除。

有用的 env var：

- `OPENCLAW_CONFIG_DIR=...`（預設：`~/.openclaw`）mounted 到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（預設：`~/.openclaw/workspace`）mounted 到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（預設：`~/.profile`）mounted 到 `/home/node/.profile`，並在執行 tests 前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 只驗證從 `OPENCLAW_PROFILE_FILE` source 出來的 env var，使用 temporary config/workspace dir，且不 mount 外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（預設：`~/.cache/openclaw/docker-cli-tools`）mounted 到 `/home/node/.npm-global`，用於 Docker 內快取的 CLI install
- `$HOME` 下的外部 CLI auth dir/file 會以唯讀方式 mounted 到 `/host-auth...` 底下，接著在 tests 開始前複製到 `/home/node/...`
  - 預設 dir：`.minimax`
  - 預設 file：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 縮小範圍的 provider 執行只會 mount 從 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推斷出的必要 dir/file
  - 使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 這樣的 comma list 手動覆寫
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用於縮小執行範圍
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用於在 container 內 filter provider
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用於重用既有的 `openclaw:local-live` image，供不需要 rebuild 的 rerun 使用
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用於確保 credentials 來自 profile store（而不是 env）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用於選擇 Gateway 為 Open WebUI smoke 公開的 model
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用於覆寫 Open WebUI smoke 使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用於覆寫固定的 Open WebUI image tag

## Docs 健全性檢查

doc 編輯後執行 docs check：`pnpm check:docs`。
當你也需要 in-page heading check 時，執行完整的 Mintlify anchor validation：`pnpm docs:check-links:anchors`。

## 離線 regression（CI-safe）

這些是不使用真實 provider 的「real pipeline」regression：

- Gateway tool calling（mock OpenAI，真實 gateway + agent loop）：`src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway wizard（WS `wizard.start`/`wizard.next`，寫入 config + 強制 auth）：`src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## Agent reliability evals（Skills）

我們已經有幾個 CI-safe test，行為類似「agent reliability evals」：

- 透過真實 Gateway + agent loop 的 mock tool-calling（`src/gateway/gateway.test.ts`）。
- 驗證 session wiring 與 config effect 的 end-to-end wizard flow（`src/gateway/gateway.test.ts`）。

Skills 仍缺少的項目（請參閱 [Skills](/zh-TW/tools/skills)）：

- **Decisioning：** 當 skills 列在 prompt 中時，agent 是否會選擇正確的 skill（或避免無關的 skill）？
- **Compliance：** agent 是否會在使用前讀取 `SKILL.md`，並遵循必要的 step/arg？
- **Workflow contracts：** 斷言 tool order、session history carryover 與 sandbox boundary 的 multi-turn scenario。

未來的 eval 應優先保持 deterministic：

- 使用 mock provider 來斷言 tool call + order、skill file read 與 session wiring 的 scenario runner。
- 一小組 skill-focused scenario（use vs avoid、gating、prompt injection）。
- 只有在 CI-safe suite 就位後，才加入可選的 live eval（opt-in、env-gated）。

## Contract tests（Plugin 與 channel shape）

Contract tests 會驗證每個已註冊的 Plugin 與 channel 都符合其
interface contract。它們會逐一檢查所有 discovered plugins，並執行一組
shape 與 behavior assertion。預設的 `pnpm test` unit lane 會刻意
略過這些 shared seam 與 smoke file；當你觸及 shared channel 或 provider surface 時，
請明確執行 contract command。

### Commands

- 所有 contracts：`pnpm test:contracts`
- 只跑 channel contracts：`pnpm test:contracts:channels`
- 只跑 provider contracts：`pnpm test:contracts:plugins`

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

- 變更 plugin-sdk export 或 subpath 之後
- 新增或修改 channel 或 provider plugin 之後
- refactor plugin registration 或 discovery 之後

Contract tests 會在 CI 中執行，且不需要真實 API key。

## 新增 regression（guidance）

當你修復在 live 中發現的 provider/model issue 時：

- 盡可能新增 CI-safe regression（mock/stub provider，或 capture 確切的 request-shape transformation）
- 如果它本質上只能 live-only（rate limit、auth policy），請保持 live test 範圍狹窄，並透過 env var opt-in
- 優先 target 能抓到 bug 的最小 layer：
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke 或 CI-safe gateway mock test
- SecretRef traversal guardrail：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 會從 registry metadata（`listSecretTargetRegistryEntries()`）為每個 SecretRef class derive 一個 sampled target，然後斷言 traversal-segment exec id 會被拒絕。
  - 如果你在 `src/secrets/target-registry-data.ts` 新增新的 `includeInPlan` SecretRef target family，請更新該 test 中的 `classifyTargetClass`。此 test 會刻意在未分類 target id 上失敗，讓新 class 不能被靜默略過。

## Related

- [Testing live](/zh-TW/help/testing-live)
- [Testing updates and plugins](/zh-TW/help/testing-updates-plugins)
- [CI](/zh-TW/ci)
