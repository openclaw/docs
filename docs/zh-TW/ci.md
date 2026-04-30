---
read_when:
    - 你需要了解為什麼 CI 作業有執行或未執行
    - 您正在偵錯失敗的 GitHub Actions 檢查
summary: CI 作業圖、範圍門檻與對應的本機命令
title: CI 管線
x-i18n:
    generated_at: "2026-04-30T02:50:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60576e126bd5012b12c62acfb72a991d2c3207e532a5b7137b218ae9b37852d2
    source_path: ci.md
    workflow: 16
---

CI 會在每次推送到 `main` 以及每個 pull request 時執行。它會使用智慧範圍界定，在只有不相關區域變更時跳過昂貴的作業。手動 `workflow_dispatch` 執行會刻意略過智慧範圍界定，並展開完整的一般 CI 圖供候選版本或廣泛驗證使用；Android 通道則透過 `include_android` 為獨立手動執行選擇性啟用。僅供發行使用的 Plugin 預發行通道位於獨立的 `Plugin Prerelease` workflow，且只會從 `Full Release Validation` 或明確的手動 dispatch 執行。

`check-dependencies` shard 會執行 `pnpm deadcode:dependencies`，這是一個僅針對生產 Knip 依賴項的檢查流程，固定使用該 script 所使用的最新 Knip 版本，並在 `dlx` 安裝時停用 pnpm 的最低發布年齡限制。它也會執行 `pnpm deadcode:unused-files`，將 Knip 的生產環境未使用檔案發現結果與 `scripts/deadcode-unused-files.allowlist.mjs` 比對。當 PR 新增未經審查的未使用檔案，或在清理後留下過時的 allowlist 項目時，該防護會失敗，同時保留 Knip 無法靜態解析的刻意動態 Plugin、產生檔、建置、即時測試與套件橋接表面。

`Full Release Validation` 是「發行前執行所有項目」的手動總括 workflow。它接受分支、標籤或完整 commit SHA，使用該目標 dispatch 手動 `CI` workflow，dispatch `Plugin Prerelease` 以進行僅供發行使用的 Plugin/套件/靜態/Docker 證明，並 dispatch `OpenClaw Release Checks` 以進行安裝 smoke、套件驗收、Docker 發行路徑套件、即時/E2E、OpenWebUI、QA Lab parity、Matrix 與 Telegram 通道。當提供已發布的套件 spec 時，它也可以執行發布後的 `NPM Telegram Beta E2E` workflow。`release_profile=minimum|stable|full` 控制傳入發行檢查的即時/供應商廣度：`minimum` 保留最快的 OpenAI/核心發行關鍵通道，`stable` 加入穩定的供應商/後端集合，而 `full` 會執行廣泛的 advisory 供應商/媒體矩陣。總括 workflow 會記錄已 dispatch 的子執行 ID，而最終的 `Verify full validation` job 會重新檢查目前子執行結論，並為每個子執行附加最慢 job 表格。如果子 workflow 重新執行並轉為綠燈，只需重新執行父 verifier job，即可重新整理總括結果與時間摘要。

針對復原，`Full Release Validation` 與 `OpenClaw Release Checks` 都接受 `rerun_group`。對候選版本使用 `all`，只針對一般完整 CI 子項使用 `ci`，針對每個發行子項使用 `release-checks`，或在總括 workflow 使用更窄的發行群組：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。這能在聚焦修正後，將失敗發行機器的重新執行限制在有界範圍內。

發行即時/E2E 子項保留廣泛的原生 `pnpm test:live` 涵蓋範圍，但它會透過 `scripts/test-live-shard.mjs` 以命名 shard 執行（`native-live-src-agents`、`native-live-src-gateway-core`、依供應商篩選的 `native-live-src-gateway-profiles` jobs、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒體音訊/影片 shard，以及依供應商篩選的音樂 shard），而不是一個序列 job。這會維持相同的檔案涵蓋範圍，同時讓緩慢的即時供應商失敗更容易重新執行與診斷。彙總 `native-live-extensions-o-z`、`native-live-extensions-media` 與 `native-live-extensions-media-music` shard 名稱仍可用於手動一次性重新執行。

原生即時媒體 shard 會在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中執行，該映像由 `Live Media Runner Image` workflow 建置。該映像預先安裝 `ffmpeg` 與 `ffprobe`；媒體 job 只會在設定前驗證二進位檔。請將 Docker 支援的即時套件維持在一般 Blacksmith runner 上，因為容器 job 並不是啟動巢狀 Docker 測試的正確位置。

Docker 支援的即時模型/後端 shard 會對每個選定 commit 使用獨立的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 映像。即時發行 workflow 會建置並推送該映像一次，然後 Docker 即時模型、Gateway、CLI 後端、ACP bind 與 Codex harness shard 會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行。如果這些 shard 各自重新建置完整來源 Docker 目標，表示發行執行設定錯誤，並會將 wall clock 浪費在重複映像建置上。

`OpenClaw Release Checks` 使用可信任的 workflow ref，將選定 ref 一次解析成 `release-package-under-test` tarball，然後將該 artifact 傳給即時/E2E 發行路徑 Docker workflow 與套件驗收 shard。這可讓套件位元組在各發行機器間保持一致，並避免在多個子 job 中重複封裝相同候選項。

`Package Acceptance` 是用於驗證套件 artifact 的旁路 workflow，不會阻塞發行 workflow。它會從已發布的 npm spec、以選定 `workflow_ref` harness 建置的可信任 `package_ref`、帶有 SHA-256 的 HTTPS tarball URL，或另一個 GitHub Actions 執行中的 tarball artifact 解析出一個候選項，將其上傳為 `package-under-test`，然後以該 tarball 重新使用 Docker 發行/E2E scheduler，而不是重新封裝 workflow checkout。Profile 涵蓋 smoke、套件、產品、完整與自訂 Docker 通道選擇。`package` profile 使用離線 Plugin 涵蓋範圍，因此已發布套件驗證不會受即時 ClawHub 可用性限制。選用的 Telegram 通道會在 `NPM Telegram Beta E2E` workflow 中重用 `package-under-test` artifact，並保留已發布 npm spec 路徑供獨立 dispatch 使用。

## 套件驗收

當問題是「這個可安裝的 OpenClaw 套件是否能作為產品運作？」時，使用 `Package Acceptance`。它不同於一般 CI：一般 CI 驗證來源樹，而套件驗收會透過使用者在安裝或更新後會使用的相同 Docker E2E harness 來驗證單一 tarball。

該 workflow 有四個 job：

1. `resolve_package` checkout `workflow_ref`、解析一個套件候選項、寫入 `.artifacts/docker-e2e-package/openclaw-current.tgz`、寫入 `.artifacts/docker-e2e-package/package-candidate.json`，將兩者上傳為 `package-under-test` artifact，並在 GitHub 步驟摘要中列印來源、workflow ref、套件 ref、版本、SHA-256 與 profile。
2. `docker_acceptance` 會呼叫 `openclaw-live-and-e2e-checks-reusable.yml`，並帶入 `ref=workflow_ref` 與 `package_artifact_name=package-under-test`。可重用 workflow 會下載該 artifact、驗證 tarball inventory、在需要時準備 package-digest Docker 映像，並針對該套件執行選定的 Docker 通道，而不是封裝 workflow checkout。當 profile 選擇多個目標 `docker_lanes` 時，可重用 workflow 會準備套件與共享映像一次，然後將這些通道展開為平行的目標 Docker jobs，且各自具有唯一 artifact。
3. `package_telegram` 會選擇性呼叫 `NPM Telegram Beta E2E`。它會在 `telegram_mode` 不是 `none` 時執行，且當 Package Acceptance 已解析出套件時，會安裝相同的 `package-under-test` artifact；獨立 Telegram dispatch 仍可安裝已發布的 npm spec。
4. `summary` 會在套件解析、Docker 驗收或選用 Telegram 通道失敗時讓 workflow 失敗。

候選來源：

- `source=npm`：僅接受 `openclaw@beta`、`openclaw@latest`，或精確的 OpenClaw 發行版本，例如 `openclaw@2026.4.27-beta.2`。用於已發布的 beta/stable 驗收。
- `source=ref`：封裝可信任的 `package_ref` 分支、標籤或完整 commit SHA。解析器會擷取 OpenClaw 分支/標籤、驗證選定 commit 可從儲存庫分支歷史或發行標籤到達、在 detached worktree 中安裝依賴項，並使用 `scripts/package-openclaw-for-docker.mjs` 進行封裝。
- `source=url`：下載 HTTPS `.tgz`；必須提供 `package_sha256`。
- `source=artifact`：從 `artifact_run_id` 與 `artifact_name` 下載一個 `.tgz`；`package_sha256` 為選用，但外部共享 artifact 應提供。

請將 `workflow_ref` 與 `package_ref` 分開。`workflow_ref` 是執行測試的可信任 workflow/harness 程式碼。`package_ref` 是在 `source=ref` 時會被封裝的來源 commit。這可讓目前的測試 harness 驗證較舊的可信任來源 commit，而不執行舊的 workflow 邏輯。

Profile 對應到 Docker 涵蓋範圍：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：包含 OpenWebUI 的完整 Docker 發行路徑 chunks
- `custom`：精確的 `docker_lanes`；當 `suite_profile=custom` 時必填

發行檢查會以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 與 `telegram_mode=mock-openai` 呼叫 Package Acceptance。發行路徑 Docker chunks 會涵蓋重疊的套件/更新/Plugin 通道，而 Package Acceptance 會針對相同解析出的套件 tarball，保留 artifact 原生的 bundled-channel 相容性、離線 Plugin 與 Telegram 證明。
跨 OS 發行檢查仍會涵蓋 OS 特定的 onboarding、安裝程式與平台行為；套件/更新產品驗證應從 Package Acceptance 開始。Windows packaged 與 installer fresh 通道也會驗證已安裝的套件可以從原始絕對 Windows 路徑匯入 browser-control override。OpenAI 跨 OS agent-turn smoke 預設在設定時使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否則使用 `openai/gpt-5.4-mini`，因此安裝與 Gateway 證明會保持快速且決定性。專用的即時供應商/模型通道仍會涵蓋更廣泛的模型路由，包括較慢的 frontier 預設值。

Package Acceptance 對已發布套件有有界的舊版相容性窗口。到 `2026.4.25` 為止的套件，包括 `2026.4.25-beta.*`，可以針對 `dist/postinstall-inventory.json` 中指向 tarball 省略檔案的已知私有 QA 項目使用相容性路徑；當套件未公開該旗標時，`doctor-switch` 可以跳過 `gateway install --wrapper` persistence 子案例；`update-channel-switch` 可以從 tarball 衍生的 fake git fixture 中修剪缺少的 `pnpm.patchedDependencies`，也可以記錄缺少的持久化 `update.channel`；Plugin smoke 可以讀取舊版 install-record 位置，或接受缺少 marketplace install-record persistence；而 `plugin-update` 可以允許 config metadata migration，同時仍要求 install record 與 no-reinstall 行為保持不變。已發布的 `2026.4.26` 套件也可以對已出貨的本機建置 metadata stamp 檔案發出警告。之後的套件必須滿足現代合約；相同條件會失敗，而不是警告或跳過。

範例：

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

偵錯失敗的套件接受度執行時，請先從 `resolve_package`
摘要開始，確認套件來源、版本與 SHA-256。接著檢查
`docker_acceptance` 子執行及其 Docker 成果：
`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道記錄、階段
計時，以及重新執行命令。請優先重新執行失敗的套件設定檔或
精確的 Docker 通道，而不是重新執行完整的發布驗證。

QA Lab 在主要智慧範圍工作流程之外有專用 CI 通道。
`Parity gate` 工作流程會在符合的 PR 變更與手動分派時執行；它會
建置私有 QA 執行階段，並比較模擬 GPT-5.5 與 Opus 4.6
代理套件。`QA-Lab - All Lanes` 工作流程會每晚在 `main` 上執行，也會在
手動分派時執行；它會將模擬同等性閘門、即時 Matrix 通道，以及即時
Telegram 與 Discord 通道分散成平行作業。即時作業會使用
`qa-live-shared` 環境，而 Telegram/Discord 會使用 Convex 租約。發布
檢查會以確定性的模擬提供者與模擬限定模型（`mock-openai/gpt-5.5` 與
`mock-openai/gpt-5.5-alt`）執行 Matrix 與 Telegram 即時傳輸通道，讓通道
契約與即時模型延遲及一般提供者 Plugin 啟動隔離。即時傳輸 Gateway 也會
停用記憶體搜尋，因為 QA 同等性會另外涵蓋記憶體行為；提供者連線能力則由
獨立的即時模型、原生提供者與 Docker 提供者套件涵蓋。Matrix 在排程與發布閘門中使用 `--profile fast`，
只有在已簽出的 CLI 支援時才加上 `--fail-fast`。CLI 預設值
與手動工作流程輸入仍為 `all`；手動 `matrix_profile=all`
分派一律會將完整 Matrix 覆蓋分片成 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 與 `e2ee-cli` 作業。`OpenClaw Release Checks` 也會
在發布核准前執行發布關鍵的 QA Lab 通道；其 QA 同等性
閘門會將候選與基準套件作為平行通道作業執行，接著將
兩個成果下載到小型報告作業，以進行最終同等性比較。
除非變更實際觸及 QA 執行階段、模型套件同等性，或同等性工作流程擁有的介面，
否則不要把 PR 登陸路徑放在 `Parity gate` 後面。
對於一般通道、設定、文件或單元測試修正，請把它視為可選
訊號，並遵循範圍化的 CI/檢查證據。

`Duplicate PRs After Merge` 工作流程是供維護者在登陸後清理重複項目的
手動工作流程。它預設為試跑，且只有在 `apply=true` 時才會關閉明確
列出的 PR。在變更 GitHub 之前，它會驗證已登陸 PR 已合併，且每個重複項目
都有共用的參照議題，或有重疊的變更區塊。

`CodeQL` 工作流程刻意作為窄範圍的第一道安全掃描器，
而不是完整儲存庫掃描。每日、手動與非草稿拉取請求防護
執行會在 `/codeql-critical-security/core-auth-secrets` 類別下，以高精準度安全
查詢掃描 Actions 工作流程程式碼，以及最高風險的 JavaScript/TypeScript
驗證、祕密、沙箱、Cron 與 Gateway 介面。
channel-runtime-boundary 作業會在 `/codeql-critical-security/channel-runtime-boundary`
類別下，另外掃描核心通道實作
契約，以及通道 Plugin 執行階段、Gateway、Plugin SDK、祕密與
稽核接觸點，讓通道安全訊號能在不擴大基準
驗證/祕密類別的情況下擴展。network-ssrf-boundary 作業會在
`/codeql-critical-security/network-ssrf-boundary` 類別下，掃描核心 SSRF、IP 解析、
網路防護、web-fetch 與 Plugin SDK SSRF 政策介面，讓網路信任
邊界訊號與驗證/祕密安全基準保持分離。
mcp-process-tool-boundary 作業會在
`/codeql-critical-security/mcp-process-tool-boundary` 類別下，掃描 MCP 伺服器、程序執行輔助程式、
外送交付與代理工具執行閘門，讓命令與
工具邊界訊號同時與驗證/祕密基準及
非安全 MCP/程序品質分片保持分離。plugin-trust-boundary 作業會在
`/codeql-critical-security/plugin-trust-boundary` 類別下，掃描
Plugin 安裝、載入器、資訊清單、登錄、執行階段相依項暫存、
來源載入、公開介面與 Plugin SDK 套件契約信任介面，讓 Plugin
供應鏈與執行階段載入訊號同時與內建 Plugin
實作程式碼及非安全 Plugin 品質分片保持分離。
拉取請求防護維持輕量：它只會針對
`.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src`
底下的變更啟動，並執行與排程工作流程相同的關鍵安全矩陣。Android、
macOS 與非安全品質 CodeQL 不列入 PR 預設值。

`CodeQL Android Critical Security` 工作流程是排程 Android
安全分片。它會在 workflow sanity 接受的最小
Blacksmith Linux runner 標籤上，為 CodeQL 手動建置 Android 應用程式，並在
`/codeql-critical-security/android` 類別下上傳結果。

`CodeQL macOS Critical Security` 工作流程是每週/手動 macOS
安全分片。它會在 Blacksmith macOS 上為 CodeQL 手動建置 macOS 應用程式、
從上傳的 SARIF 中過濾掉相依項建置結果，並在
`/codeql-critical-security/macos` 類別下上傳結果。請讓它留在每日
預設工作流程之外，因為即使乾淨，macOS 建置也會主導執行時間。

`CodeQL Critical Quality` 工作流程是對應的非安全分片。它
只會在較小的 Blacksmith Linux runner 上，對窄範圍高價值介面執行
錯誤嚴重性、非安全的 JavaScript/TypeScript 品質查詢。其
手動分派接受
`profile=all|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`；
窄範圍設定檔是教學/迭代掛鉤，可在不分派其餘工作流程的情況下
單獨執行一個品質分片。
其
core-auth-secrets 作業會在獨立的 `/codeql-critical-quality/core-auth-secrets`
類別下，掃描驗證、祕密、沙箱、Cron 與 Gateway 安全
邊界程式碼。config-boundary
作業會在獨立的 `/codeql-critical-quality/config-boundary` 類別下，掃描設定結構描述、
遷移、正規化與 IO 契約。gateway-runtime-boundary 作業會在獨立的
`/codeql-critical-quality/gateway-runtime-boundary` 類別下，掃描 Gateway 協定結構描述與伺服器方法
契約。channel-runtime-boundary 作業會在
獨立的 `/codeql-critical-quality/channel-runtime-boundary` 類別下，掃描核心通道實作契約。agent-runtime-boundary 作業會在
獨立的 `/codeql-critical-quality/agent-runtime-boundary` 類別下，掃描命令執行、模型/提供者分派、
自動回覆分派與佇列，以及 ACP 控制平面執行階段契約。
mcp-process-runtime-boundary 作業會在獨立的
`/codeql-critical-quality/mcp-process-runtime-boundary` 類別下，掃描 MCP 伺服器與工具橋接、程序
監督輔助程式，以及外送交付契約。memory-runtime-boundary 作業會在
獨立的 `/codeql-critical-quality/memory-runtime-boundary`
類別下，掃描記憶體主機 SDK、記憶體執行階段 facade、
記憶體 Plugin SDK 別名、記憶體執行階段啟用黏合，以及記憶體 doctor
命令。session-diagnostics-boundary 作業會在獨立的
`/codeql-critical-quality/session-diagnostics-boundary` 類別下，掃描回覆佇列內部、
工作階段交付佇列、外送工作階段繫結/交付輔助程式、診斷
事件/記錄套件介面，以及工作階段 doctor CLI 契約。plugin-sdk-reply-runtime 作業會在獨立的
`/codeql-critical-quality/plugin-sdk-reply-runtime` 類別下，掃描 Plugin SDK 入站回覆分派、回覆
承載/分塊/執行階段輔助程式、通道回覆選項、交付佇列，以及
工作階段/執行緒繫結輔助程式。
provider-runtime-boundary 作業會在獨立的
`/codeql-critical-quality/provider-runtime-boundary` 類別下，掃描模型目錄正規化、提供者驗證
與探索、提供者執行階段註冊、提供者預設值/目錄，以及
網頁/搜尋/擷取/嵌入提供者登錄。
ui-control-plane 作業會在獨立的
`/codeql-critical-quality/ui-control-plane` 類別下，掃描 Control UI 啟動、本機持久化、Gateway
控制流程，以及任務控制平面執行階段契約。
web-media-runtime-boundary 作業會在
獨立的 `/codeql-critical-quality/web-media-runtime-boundary` 類別下，掃描核心網頁擷取/搜尋、媒體 IO、媒體
理解、影像生成與媒體生成執行階段契約。plugin-boundary 作業會在獨立的 `/codeql-critical-quality/plugin-boundary`
類別下，掃描載入器、登錄、公開介面與 Plugin SDK
進入點契約。plugin-sdk-package-contract 作業會在獨立的
`/codeql-critical-quality/plugin-sdk-package-contract` 類別下，掃描已發布套件端
Plugin SDK 原始碼與 Plugin 套件契約輔助程式。請讓此
工作流程與安全分離，讓品質發現項目可以被
排程、測量、停用或擴展，而不會模糊安全訊號。
Swift、Python 與內建 Plugin CodeQL 擴展，應只在窄範圍設定檔有穩定
執行時間與訊號後，作為範圍化或分片後續工作加回。

`Docs Agent` 工作流程是事件驅動的 Codex 維護通道，用於讓
現有文件與最近登陸的變更保持一致。它沒有純排程：在 `main` 上
成功的非機器人推送 CI 執行可以觸發它，手動分派也可以
直接執行它。當 `main` 已前進，或上一小時內已建立另一個非略過的 Docs Agent 執行時，
workflow-run 叫用會略過。執行時，它會
檢閱從上一個非略過 Docs Agent 來源 SHA 到目前 `main` 的提交範圍，
因此每小時一次的執行可以涵蓋自上次文件檢查以來累積的所有 main 變更。

`Test Performance Agent` 工作流程是事件驅動的 Codex 維護通道，
用於慢速測試。它沒有純排程：在
`main` 上成功的非機器人推送 CI 執行可以觸發它，但如果該 UTC 日已有另一個 workflow-run 叫用
已執行或正在執行，它會略過。手動分派會繞過該每日活動
閘門。此通道會建置完整套件分組的 Vitest 效能報告，讓 Codex
只進行小型且保留覆蓋率的測試效能修正，而不是廣泛
重構，接著重新執行完整套件報告，並拒絕會降低
通過基準測試數量的變更。如果基準有失敗測試，Codex 只能修正
明顯失敗項目，且代理後的完整套件報告必須通過，才會
提交任何內容。當 `main` 在機器人推送登陸前前進時，此通道
會 rebase 已驗證的修補、重新執行 `pnpm check:changed`，並重試推送；
有衝突的過期修補會被略過。它使用 GitHub 託管的 Ubuntu，讓 Codex
動作可以維持與 docs agent 相同的 drop-sudo 安全姿態。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 工作概覽

| 工作                             | 用途                                                                                         | 執行時機                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 偵測僅文件變更、變更範圍、變更的 Plugin，並建置 CI 資訊清單                                  | 非草稿推送和 PR 時一律執行        |
| `security-scm-fast`              | 透過 `zizmor` 進行私密金鑰偵測和工作流程稽核                                                  | 非草稿推送和 PR 時一律執行        |
| `security-dependency-audit`      | 針對 npm 公告執行不需依賴項的生產 lockfile 稽核                                               | 非草稿推送和 PR 時一律執行        |
| `security-fast`                  | 快速安全性工作的必要彙總                                                                     | 非草稿推送和 PR 時一律執行        |
| `build-artifacts`                | 建置 `dist/`、Control UI、建置成品檢查，以及可重用的下游成品                                 | Node 相關變更                      |
| `checks-fast-core`               | 快速 Linux 正確性通道，例如 bundled/plugin-contract/protocol 檢查                            | Node 相關變更                      |
| `checks-fast-contracts-channels` | 分片的頻道合約檢查，具備穩定的彙總檢查結果                                                   | Node 相關變更                      |
| `checks-node-core-test`          | Core Node 測試分片，不包含頻道、bundled、合約和 Plugin 通道                                  | Node 相關變更                      |
| `check`                          | 分片的主要本機閘門等效項目：生產型別、lint、防護、測試型別和嚴格 smoke                       | Node 相關變更                      |
| `check-additional`               | 架構、邊界、Plugin 介面防護、套件邊界，以及 gateway-watch 分片                               | Node 相關變更                      |
| `build-smoke`                    | 已建置 CLI smoke 測試和啟動記憶體 smoke                                                       | Node 相關變更                      |
| `checks`                         | 已建置成品頻道測試的驗證器                                                                   | Node 相關變更                      |
| `checks-node-compat-node22`      | Node 22 相容性建置和 smoke 通道                                                              | 發行版的手動 CI 觸發              |
| `check-docs`                     | 文件格式化、lint 和損壞連結檢查                                                              | 文件已變更                         |
| `skills-python`                  | Python 支援 Skills 的 Ruff + pytest                                                          | Python Skills 相關變更            |
| `checks-windows`                 | Windows 特定程序/路徑測試，加上共用執行階段匯入規範回歸測試                                 | Windows 相關變更                   |
| `macos-node`                     | 使用共用建置成品的 macOS TypeScript 測試通道                                                  | macOS 相關變更                     |
| `macos-swift`                    | macOS app 的 Swift lint、建置和測試                                                           | macOS 相關變更                     |
| `android`                        | 兩種 flavor 的 Android 單元測試，加上一個 debug APK 建置                                      | Android 相關變更                   |
| `test-performance-agent`         | 在可信活動後，每日執行 Codex 慢速測試最佳化                                                   | Main CI 成功或手動觸發             |

手動 CI 觸發會執行與一般 CI 相同的工作圖，但會強制啟用每個非 Android 範圍通道：Linux Node 分片、bundled-plugin 分片、頻道合約、Node 22 相容性、`check`、`check-additional`、建置 smoke、文件檢查、Python Skills、Windows、macOS，以及 Control UI i18n。獨立的手動 CI 觸發只會在 `include_android=true` 時執行 Android；完整發行總控流程會透過傳入 `include_android=true` 啟用 Android。Plugin 預發行靜態檢查、僅發行使用的 `agentic-plugins` 分片、完整 Plugin 批次掃描，以及 Plugin 預發行 Docker 通道都排除在 CI 之外。Docker 預發行套件只會在 `Full Release Validation` 觸發獨立的 `Plugin Prerelease` 工作流程，且啟用發行驗證閘門時執行。手動執行使用唯一並行群組，因此候選發行版本的完整套件不會被相同 ref 上的另一個推送或 PR 執行取消。選用的 `target_ref` 輸入可讓可信呼叫端針對分支、tag 或完整 commit SHA 執行該圖，同時使用所選觸發 ref 的工作流程檔案。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失敗順序

工作已排序，讓低成本檢查在高成本工作執行前先失敗：

1. `preflight` 決定哪些通道實際存在。`docs-scope` 和 `changed-scope` 邏輯是此工作內的步驟，不是獨立工作。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 會快速失敗，不等待較重的成品和平台矩陣工作。
3. `build-artifacts` 會與快速 Linux 通道重疊執行，讓下游消費者可在共用建置準備就緒後立即開始。
4. 較重的平台和執行階段通道會在之後展開：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

範圍邏輯位於 `scripts/ci-changed-scope.mjs`，並由 `src/scripts/ci-changed-scope.test.ts` 中的單元測試涵蓋。
手動觸發會略過變更範圍偵測，並讓預檢 manifest
表現得像每個限定範圍都已變更。
CI 工作流程編輯會驗證 Node CI 圖以及工作流程 lint，但不會自行強制執行 Windows、Android 或 macOS 原生建置；這些平台 lane 仍限定於平台來源變更。
僅限 CI 路由的編輯、選定的低成本核心測試 fixture 編輯，以及狹窄的 Plugin contract helper/test-routing 編輯會使用快速的僅 Node manifest 路徑：預檢、安全性，以及單一 `checks-fast-core` 工作。當變更檔案僅限於該快速工作直接演練的路由或 helper surface 時，該路徑會避開建置成品、Node 22 相容性、channel contract、完整核心 shard、內建 Plugin shard，以及額外的 guard matrix。
Windows Node 檢查限定於 Windows 特定的 process/path wrapper、npm/pnpm/UI runner helper、package manager 設定，以及執行該 lane 的 CI 工作流程 surface；不相關的原始碼、Plugin、install-smoke 與僅測試變更會留在 Linux Node lane，因此不會為已由一般 test shard 演練的覆蓋範圍保留 16-vCPU Windows worker。
獨立的 `install-smoke` 工作流程會透過自己的 `preflight` job 重用相同的範圍 script。它會將 smoke 覆蓋範圍拆分為 `run_fast_install_smoke` 與 `run_full_install_smoke`。Pull request 會針對 Docker/package surface、內建 Plugin package/manifest 變更，以及 Docker smoke job 會演練的核心 Plugin/channel/gateway/Plugin SDK surface 執行快速路徑。僅來源的內建 Plugin 變更、僅測試編輯，以及僅文件編輯不會保留 Docker worker。快速路徑會建置一次根 Dockerfile 映像、檢查 CLI、執行 agents delete shared-workspace CLI smoke、執行 container gateway-network e2e、驗證內建 extension build arg，並在 240 秒彙總命令逾時下執行有界的內建 Plugin Docker profile，且每個情境的 Docker run 也會分別設限。完整路徑會保留 QR package install 與 installer Docker/update 覆蓋範圍，用於夜間排程執行、手動觸發、workflow-call release check，以及真正觸及 installer/package/Docker surface 的 pull request。在完整模式中，install-smoke 會準備或重用一個 target-SHA GHCR root Dockerfile smoke 映像，然後以獨立 job 執行 QR package install、root Dockerfile/gateway smoke、installer/update smoke，以及快速內建 Plugin Docker E2E，讓 installer 工作不必等待 root image smoke。`main` push，包括 merge commit，不會強制完整路徑；當變更範圍邏輯會在 push 上要求完整覆蓋時，工作流程會保留快速 Docker smoke，並將完整 install smoke 留給夜間或 release 驗證。較慢的 Bun global install image-provider smoke 會由 `run_bun_global_install_smoke` 另行 gate；它會在夜間排程與 release checks 工作流程中執行，且手動 `install-smoke` 觸發可以選擇加入，但 pull request 與 `main` push 不會執行它。QR 與 installer Docker 測試保留各自以安裝為重點的 Dockerfile。本機 `test:docker:all` 會預先建置一個共用 live-test 映像、將 OpenClaw 打包一次為 npm tarball，並建置兩個共用 `scripts/e2e/Dockerfile` 映像：一個用於 installer/update/plugin-dependency lane 的裸 Node/Git runner，以及一個會將相同 tarball 安裝到 `/app`、供一般功能 lane 使用的 functional image。Docker lane 定義位於 `scripts/lib/docker-e2e-scenarios.mjs`，planner 邏輯位於 `scripts/lib/docker-e2e-plan.mjs`，runner 只會執行選定的 plan。排程器會使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 與 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 為每個 lane 選擇映像，然後以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行 lane；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 調整預設值為 10 的 main-pool slot count，並用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 調整預設值為 10 的 provider-sensitive tail-pool slot count。重型 lane 上限預設為 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 與 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，讓 npm install 與多服務 lane 不會讓 Docker 超額承載，而較輕的 lane 仍能填滿可用 slot。單一 lane 即使比有效上限更重，仍可從空 pool 啟動，然後獨自執行直到釋放容量。lane 啟動預設錯開 2 秒，以避免本機 Docker daemon 建立風暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆寫。本機彙總會預檢 Docker、移除過期的 OpenClaw E2E container、發出 active-lane 狀態、持久化 lane timing 以進行 longest-first 排序，並支援 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 供排程器檢查。預設在第一次失敗後停止排程新的 pooled lane，且每個 lane 都有 120 分鐘 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆寫；選定的 live/tail lane 會使用更嚴格的 per-lane 上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 會執行精確的排程器 lane，包括僅 release 的 lane，例如 `install-e2e`，以及拆分的內建 update lane，例如 `bundled-channel-update-acpx`，同時略過 cleanup smoke，讓 agent 能重現單一失敗 lane。可重用的 live/E2E 工作流程會詢問 `scripts/test-docker-all.mjs --plan-json` 需要哪些 package、image kind、live image、lane 與 credential 覆蓋範圍，然後 `scripts/docker-e2e.mjs` 會將該 plan 轉換為 GitHub output 與 summary。它會透過 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下載目前執行的 package artifact，或從 `package_artifact_run_id` 下載 package artifact；驗證 tarball inventory；當 plan 需要 package-installed lane 時，透過 Blacksmith 的 Docker layer cache 建置並推送 package-digest-tagged bare/functional GHCR Docker E2E 映像；並重用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` input 或既有的 package-digest image，而不是重新建置。Docker image pull 會以有界的每次嘗試 180 秒 timeout 重試，讓卡住的 registry/cache stream 能快速重試，而不是耗掉大部分 CI 關鍵路徑。`Package Acceptance` 工作流程是高階 package gate：它會從 npm、受信任的 `package_ref`、HTTPS tarball 加上 SHA-256，或先前的工作流程 artifact 解析 candidate，然後將該單一 `package-under-test` artifact 傳入可重用的 Docker E2E 工作流程。它會讓 `workflow_ref` 與 `package_ref` 分離，讓目前的 acceptance 邏輯可驗證較舊的受信任 commit，而不必 checkout 舊工作流程程式碼。Release check 會針對目標 ref 執行自訂 Package Acceptance delta：內建 channel compat、離線 Plugin fixture，以及針對解析後 tarball 的 Telegram package QA。release-path Docker suite 會以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 執行較小的分塊 job，讓每個 chunk 只 pull 所需的 image kind，並透過相同的加權排程器執行多個 lane（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。當完整 release-path 覆蓋要求 OpenWebUI 時，OpenWebUI 會併入 `plugins-runtime-services`，且只有在 OpenWebUI-only 觸發時才保留獨立的 `openwebui` chunk。舊版彙總 chunk 名稱 `package-update`、`plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍可用於手動重新執行，但 release 工作流程使用拆分 chunk，讓 installer E2E 與內建 Plugin install/uninstall sweep 不會主宰關鍵路徑。`install-e2e` lane alias 仍是兩個 provider installer lane 的彙總手動重新執行 alias。`bundled-channels` chunk 會執行拆分的 `bundled-channel-*` 與 `bundled-channel-update-*` lane，而不是序列式 all-in-one `bundled-channel-deps` lane。每個 chunk 都會上傳 `.artifacts/docker-tests/`，其中包含 lane log、timing、`summary.json`、`failures.json`、phase timing、scheduler plan JSON、slow-lane table，以及每個 lane 的重新執行命令。工作流程 `docker_lanes` input 會針對已準備好的映像執行選定 lane，而不是 chunk job，這會將失敗 lane 偵錯限定在一個目標 Docker job，並為該執行準備、下載或重用 package artifact；如果選定 lane 是 live Docker lane，目標 job 會為該次重新執行在本機建置 live-test 映像。產生的每個 lane GitHub 重新執行命令會在這些值存在時包含 `package_artifact_run_id`、`package_artifact_name` 與已準備的 image input，因此失敗 lane 可重用失敗執行中的精確 package 與映像。使用 `pnpm test:docker:rerun <run-id>` 可從 GitHub run 下載 Docker artifact，並列印合併/每 lane 的目標重新執行命令；使用 `pnpm test:docker:timings <summary.json>` 可取得 slow-lane 與 phase critical-path summary。排程的 live/E2E 工作流程每天執行完整 release-path Docker suite。內建 update matrix 依 update target 拆分，讓重複的 npm update 與 doctor repair pass 能與其他內建檢查分 shard 執行。

目前 release Docker chunk 為 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 與 `bundled-channels-contracts`。彙總 `bundled-channels` chunk 仍可用於手動一次性重新執行，且 `plugins-runtime-core`、`plugins-runtime` 與 `plugins-integrations` 仍是彙總 Plugin/runtime alias，但 release 工作流程會使用拆分 chunk，讓 channel smoke、update target、Plugin runtime check 與內建 Plugin install/uninstall sweep 能平行執行。目標 `docker_lanes` 觸發也會在一個共用 package/image 準備步驟後，將多個選定 lane 拆成平行 job，且內建 channel update lane 會針對暫時性 npm 網路失敗重試一次。

本機變更通道邏輯位於 `scripts/changed-lanes.mjs`，並由 `scripts/check-changed.mjs` 執行。該本機檢查閘門對架構邊界的要求比廣泛 CI 平台範圍更嚴格：核心生產變更會執行核心生產與核心測試型別檢查，加上核心 lint/防護；僅核心測試變更只會執行核心測試型別檢查加核心 lint；擴充功能生產變更會執行擴充功能生產與擴充功能測試型別檢查，加上擴充功能 lint；僅擴充功能測試變更會執行擴充功能測試型別檢查加擴充功能 lint。公開 Plugin SDK 或 Plugin 合約變更會擴展到擴充功能型別檢查，因為擴充功能依賴這些核心合約，但 Vitest 擴充功能掃描屬於明確的測試工作。僅發行中繼資料的版本遞增會執行目標式版本/設定/根依賴檢查。未知的根目錄/設定變更會以安全失敗方式落到所有檢查通道。
本機變更測試路由位於 `scripts/test-projects.test-support.mjs`，並且刻意比 `check:changed` 更低成本：直接測試編輯會執行自身測試，原始碼編輯會優先使用明確對應，接著是同層測試與匯入圖相依項。共享群組聊天室傳遞設定是明確對應之一：對群組可見回覆設定、來源回覆傳遞模式，或訊息工具系統提示的變更，會路由到核心回覆測試以及 Discord 與 Slack 傳遞回歸測試，讓共享預設值變更在第一次 PR 推送前就失敗。只有當變更範圍足夠涵蓋整個測試框架，使低成本對應集合無法作為可信代理時，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

進行 Testbox 驗證時，請從儲存庫根目錄執行，並偏好為廣泛證明使用全新預熱的測試盒。在把緩慢閘門花在重用、過期，或剛回報非預期大型同步的測試盒之前，先在測試盒內執行 `pnpm testbox:sanity`。當必要根目錄檔案（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 顯示至少 200 個已追蹤刪除項目時，健全性檢查會快速失敗。這通常表示遠端同步狀態不是 PR 的可信副本。停止該測試盒並預熱新的測試盒，而不是偵錯產品測試失敗。對於有意的大量刪除 PR，請為該健全性執行設定 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。當本機 Blacksmith CLI 呼叫停留在同步階段超過五分鐘且沒有同步後輸出時，`pnpm testbox:run` 也會終止該呼叫。設定 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可停用該防護，或為異常大型的本機差異使用較大的毫秒值。

手動 CI 派送會執行 `checks-node-compat-node22` 作為廣泛相容性覆蓋。Android 對獨立手動 CI 採用選用方式，透過 `include_android=true` 啟用，並且在 `Full Release Validation` 中一律啟用。`Plugin Prerelease` 是成本較高的產品/套件覆蓋，因此它是由 `Full Release Validation` 或明確操作員派送的獨立工作流程。一般 pull request、`main` 推送，以及獨立手動 CI 派送都會關閉該套件。

最慢的 Node 測試家族已被拆分或平衡，讓每個工作在不過度保留 runner 的情況下保持小型：頻道合約以三個加權分片執行，小型核心單元通道會配對，自動回覆以四個平衡 worker 執行，並將回覆子樹拆分為 agent-runner、dispatch，以及 commands/state-routing 分片；agentic Gateway/Plugin 設定則分散到既有的僅原始碼 agentic Node 工作，而不是等待建置成品。廣泛瀏覽器、QA、媒體，以及雜項 Plugin 測試會使用專屬 Vitest 設定，而不是共享 Plugin 全收式設定。`Plugin Prerelease` 會在八個擴充功能 worker 之間平衡內建 Plugin 測試；這些擴充功能分片工作一次最多執行兩個 Plugin 設定群組，每個群組使用一個 Vitest worker 和更大的 Node heap，讓匯入密集的 Plugin 批次不會建立額外 CI 工作。廣泛 agents 通道使用共享 Vitest 檔案平行排程器，因為它主要受匯入/排程支配，而不是由單一緩慢測試檔案主導。`runtime-config` 會與 infra core-runtime 分片一起執行，避免共享 runtime 分片承擔尾端時間。Include-pattern 分片會使用 CI 分片名稱記錄 timing 項目，因此 `.artifacts/vitest-shard-timings.json` 能區分完整設定與經過篩選的分片。`check-additional` 會將套件邊界編譯/canary 工作放在一起，並將 runtime 拓撲架構與 Gateway watch 覆蓋分開；邊界防護分片會在單一工作內並行執行其小型獨立防護。Gateway watch、頻道測試，以及核心支援邊界分片會在 `dist/` 與 `dist-runtime/` 已建置後，於 `build-artifacts` 內並行執行，保留其舊檢查名稱作為輕量驗證工作，同時避免兩個額外 Blacksmith worker 和第二個成品消費者佇列。
Android CI 會同時執行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然後建置 Play debug APK。第三方 flavor 沒有獨立 source set 或 manifest；其單元測試通道仍會使用 SMS/通話記錄 BuildConfig 旗標編譯該 flavor，同時避免在每次 Android 相關推送時產生重複 debug APK 封裝工作。
當較新的推送落在同一個 PR 或 `main` ref 上時，GitHub 可能會將已被取代的工作標記為 `cancelled`。除非同一 ref 的最新執行也失敗，否則請將其視為 CI 雜訊。彙總分片檢查使用 `!cancelled() && always()`，因此它們仍會回報一般分片失敗，但不會在整個工作流程已被取代後繼續排入佇列。
自動 CI concurrency key 已版本化（`CI-v7-*`），因此 GitHub 端舊佇列群組中的僵屍項目無法無限期阻擋較新的 main 執行。手動完整套件執行使用 `CI-manual-v1-*`，且不會取消進行中的執行。

## Runner

| Runner                           | 工作                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全性工作與彙總（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 檢查、分片頻道合約檢查、除 lint 以外的 `check` 分片、`check-additional` 分片與彙總、Node 測試彙總驗證器、文件檢查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 託管的 Ubuntu，讓 Blacksmith 矩陣可以更早排入佇列 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、較低權重的擴充功能分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 與 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 測試分片、內建 Plugin 測試分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍對 CPU 足夠敏感，以致 8 vCPU 的成本高於其節省；install-smoke Docker 建置，其中 32-vCPU 佇列時間的成本高於其節省                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 會退回到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 會退回到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本機對應項

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:changed   # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相關

- [安裝概覽](/zh-TW/install)
- [發行通道](/zh-TW/install/development-channels)
