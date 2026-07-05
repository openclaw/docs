---
read_when:
    - 你想安裝或管理閘道外掛或相容套件包
    - 您想要為簡單的工具外掛建立腳手架或進行驗證
    - 你想要偵錯外掛載入失敗
sidebarTitle: Plugins
summary: '`openclaw plugins` 的命令列介面參考（init、build、validate、list、install、marketplace、uninstall、enable/disable、doctor）'
title: 外掛
x-i18n:
    generated_at: "2026-07-05T11:12:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a42d3fa6a60263f3fc2918cd34e6c1e3380b9ecae433a6ed340967c929de4c3c
    source_path: cli/plugins.md
    workflow: 16
---

管理閘道外掛、鉤子套件包與相容套件組。

<CardGroup cols={2}>
  <Card title="外掛系統" href="/zh-TW/tools/plugin">
    安裝、啟用與疑難排解外掛的終端使用者指南。
  </Card>
  <Card title="管理外掛" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝與發布的快速範例。
  </Card>
  <Card title="外掛套件組" href="/zh-TW/plugins/bundles">
    套件組相容性模型。
  </Card>
  <Card title="外掛 manifest" href="/zh-TW/plugins/manifest">
    Manifest 欄位與設定 schema。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security">
    外掛安裝的安全強化。
  </Card>
</CardGroup>

## 命令

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

若要調查緩慢的安裝、檢查、解除安裝或 registry 重新整理，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行該命令。追蹤會將階段計時寫入 stderr，並讓 JSON 輸出維持可解析。請參閱[除錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，`openclaw.json` 是不可變的。`install`、`update`、`uninstall`、`enable` 與 `disable` 都會拒絕執行。請改為編輯此安裝的 Nix 來源（nix-openclaw 使用 `programs.openclaw.config` 或 `instances.<name>.config`），然後重新建置。請參閱 agent-first [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
內建外掛會隨 OpenClaw 發行。有些預設啟用（例如內建模型提供者、內建語音提供者與內建瀏覽器外掛）；其他則需要 `plugins enable`。

原生 OpenClaw 外掛會隨附 `openclaw.plugin.json`，其中含有內嵌 JSON Schema（`configSchema`，即使為空）。相容套件組則改用自己的套件組 manifest。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細的 list/info 輸出也會顯示套件組子類型（`codex`、`claude` 或 `cursor`）以及偵測到的套件組能力。
</Note>

## 作者

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 預設會建立最小 TypeScript 工具外掛。第一個引數是外掛 ID；`--name` 會設定顯示名稱。OpenClaw 會使用該 ID 作為預設輸出目錄與套件命名。工具 scaffold 使用 `defineToolPlugin`，並產生 `package.json` 指令碼 `plugin:build` 與 `plugin:validate`，用於建置後呼叫 `openclaw plugins build`/`validate`。

`plugins build` 會匯入已建置的 entry、讀取其靜態工具中繼資料、寫入 `openclaw.plugin.json`，並保持 `package.json` 的 `openclaw.extensions` 同步。`plugins validate` 會檢查產生的 manifest、套件中繼資料與目前 entry 匯出是否仍一致。完整作者工作流程請參閱[工具外掛](/zh-TW/plugins/tool-plugins)。

Scaffold 會寫入 TypeScript 來源，但會從已建置的 `./dist/index.js` entry 產生中繼資料，因此此工作流程也能搭配已發布的命令列介面使用。當 entry 不是預設套件 entry 時，請使用 `--entry <path>`。在 CI 中使用 `plugins build --check`，可在產生的中繼資料過期時失敗，而不重寫檔案。

### 提供者 scaffold

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

提供者 scaffold 會建立通用的 OpenAI 相容模型提供者外掛，包含 API key 驗證 plumbing、一個會執行 `clawhub package validate` 的 `npm run validate` 指令碼、ClawHub 套件中繼資料，以及供未來透過 GitHub OIDC 進行受信任發布的手動觸發 GitHub Actions workflow。提供者 scaffold 不會產生 Skills，也不使用 `openclaw plugins build`/`validate`；這些命令適用於工具 scaffold 的產生式中繼資料路徑。

發布前，請將預留位置 API base URL、模型 catalog、文件路由、憑證文字與 README 文案替換為真實提供者詳細資訊。首次發布到 ClawHub 與設定受信任發布者時，請使用產生的 README。

## 安裝

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

維護者測試設定期間安裝時，可以使用受保護的環境變數覆寫自動外掛安裝來源。請參閱[外掛安裝覆寫](/zh-TW/plugins/install-overrides)。

<Warning>
在啟動切換期間，裸套件名稱預設會從 npm 安裝，除非它們符合內建或官方外掛 ID；在這種情況下，OpenClaw 會使用該本機/官方副本，而不是連到 npm registry。當你刻意想使用外部 npm 套件時，請使用 `npm:<package>`。ClawHub 請使用 `clawhub:<package>`。請將外掛安裝視為執行程式碼；優先使用 pinned 版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 `code-plugin` 與 `bundle-plugin` 套件（不是 Skills；那些請使用 `openclaw skills search`）。預設 `--limit` 為 20，上限為 100。它只會讀取遠端 catalog：不會檢查本機狀態、變更設定、安裝套件或載入外掛 runtime。結果包含 ClawHub 套件名稱、family、channel、版本、摘要，以及例如 `openclaw plugins install clawhub:<package>` 的安裝提示。

<Note>
ClawHub 是多數外掛的主要散佈與探索介面。Npm 仍是受支援的 fallback 與直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` 外掛套件已重新發布到 npm；請在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或[外掛清單](/zh-TW/plugins/plugin-inventory)查看目前清單。穩定版安裝使用 `latest`。Beta channel 安裝與更新會在可用時優先使用 npm `beta` dist-tag，否則 fallback 到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="設定 include 與無效設定修復">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該 included 檔案，並保持 `openclaw.json` 不變。Root include、include 陣列，以及帶有 sibling override 的 include 會 fail closed，而不是被攤平。支援的形狀請參閱[設定 include](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會 fail closed，並要求你先執行 `openclaw doctor --fix`。在閘道啟動與 hot reload 期間，無效外掛設定會像任何其他無效設定一樣 fail closed；`openclaw doctor --fix` 可以隔離無效的外掛 entry。唯一記載的安裝期間例外，是針對明確 opt into `openclaw.install.allowInvalidConfigRecovery` 的外掛所提供的狹窄內建外掛復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝 vs 更新">
    `--force` 會重用現有安裝目標，並就地覆寫已安裝的外掛或鉤子套件包。當你刻意從新的本機路徑、封存檔、ClawHub 套件或 npm artifact 重新安裝相同 ID 時使用它。對於已追蹤 npm 外掛的一般升級，請優先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的外掛 ID 執行 `plugins install`，OpenClaw 會停止並指向 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時，指向 `plugins install <package> --force`。`--force` 不支援搭配 `--link` 使用。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 只適用於 npm 安裝，並記錄解析後的精確 `<name>@<version>`。它不支援 `git:` 安裝（請改在 spec 中 pin ref，例如 `git:github.com/acme/plugin@v1.2.3`），也不支援 `--marketplace`（marketplace 安裝會保留 marketplace 來源中繼資料，而不是 npm spec）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已棄用，現在是 no-op。OpenClaw 不再針對外掛安裝執行內建的安裝期間危險程式碼阻擋。

    當需要 host-specific 安裝政策時，請使用操作員擁有的 `security.installPolicy` 介面。外掛 `before_install` hook 是外掛 runtime 生命週期 hook，不是命令列介面安裝的主要政策邊界。

    如果你發布到 ClawHub 的外掛被 registry 掃描隱藏或阻擋，請使用 [ClawHub 發布](/zh-TW/clawhub/publishing)中的發布者步驟。`--dangerously-force-unsafe-install` 不會要求 ClawHub 重新掃描外掛，也不會讓被阻擋的 release 公開。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    社群 ClawHub 安裝會在下載前檢查所選 release 的信任記錄。如果 ClawHub 停用該 release 的下載、回報惡意掃描發現，或將該 release 放入 blocking moderation 狀態（quarantined、revoked），OpenClaw 會直接拒絕，不論是否使用此旗標。對於非 blocking 的高風險掃描狀態或 moderation 狀態，OpenClaw 會顯示信任詳細資訊，並在繼續前要求確認。

    只有在檢閱 ClawHub 警告並決定不透過互動提示繼續後，才使用 `--acknowledge-clawhub-risk`。Pending 或 stale（尚未 clean）的掃描結果會警告，但不需要 acknowledgement。官方 ClawHub 套件與內建 OpenClaw 外掛來源會完全略過此 release-trust 檢查。

  </Accordion>
  <Accordion title="鉤子套件包與 npm spec">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 的鉤子套件包的介面。請使用 `openclaw hooks` 取得篩選後的 hook 可見性與逐一 hook 啟用，而不是套件安裝。

    Npm 規格僅限於**註冊表**（套件名稱加上選用的**精確版本**或 **dist-tag**）。Git/URL/file 規格和 semver 範圍會被拒絕。為了安全，依賴項安裝會在每個外掛各自的一個受管 npm 專案中以 `--ignore-scripts` 執行，即使你的 shell 有全域 npm 安裝設定也是如此。受管外掛 npm 專案會繼承 OpenClaw 套件層級的 npm `overrides`，因此主機安全性釘選也會套用到被提升的外掛依賴項。

    使用 `npm:<package>` 讓 npm 解析明確化。裸套件規格在啟動切換期間也會直接從 npm 安裝，除非它們符合官方外掛 id。

    符合 bundled plugins 的原始 `@openclaw/*` 規格會先解析為映像擁有的 bundled copy，再 fallback 到 npm。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 會使用目前 OpenClaw 建置中的 bundled Discord 外掛，而不是建立受管 npm override。若要強制使用外部 npm 套件，請使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    裸規格和 `@latest` 會留在 stable track。OpenClaw 日期戳記修正版，例如 `2026.5.3-1`，在此檢查中視為穩定版。如果 npm 將任一形式解析為 prerelease，OpenClaw 會停止並要求你使用 prerelease 標籤（`@beta`/`@rc`）或精確的 prerelease 版本（`@1.2.3-beta.4`）明確選擇加入。

    對於沒有精確版本的 npm 安裝（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 會在安裝前檢查已解析的套件中繼資料。如果最新穩定套件需要較新的 OpenClaw 外掛 API 或最低主機版本，OpenClaw 會檢查較舊的穩定版本，並改為安裝最新的相容版本。精確版本和明確的 dist-tag 會保持嚴格：不相容的選擇會失敗，並要求你升級 OpenClaw 或選擇相容版本。

    如果裸安裝規格符合官方外掛 id（例如 `diffs`），OpenClaw 會直接安裝目錄項目。若要安裝同名的 npm 套件，請使用明確的 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 儲存庫">
    使用 `git:<repo>` 直接從 git 儲存庫安裝。支援的形式：`git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URL。加入 `@<ref>` 或 `#<ref>`，即可在安裝前 check out 分支、標籤或 commit。

    Git 安裝會 clone 到暫存目錄，在有指定 ref 時 check out 該 ref，然後使用一般外掛目錄安裝器，因此 manifest 驗證、操作員安裝政策、套件管理器安裝工作和安裝記錄的行為都和 npm 安裝相同。記錄的 git 安裝包含來源 URL/ref 與已解析的 commit，因此 `openclaw plugins update` 之後可以重新解析該來源。

    從 git 安裝後，使用 `openclaw plugins inspect <id> --runtime --json` 驗證執行階段註冊，例如閘道方法和命令列介面命令。如果外掛使用 `api.registerCli` 註冊了命令列介面根目錄，請直接透過 OpenClaw 根命令列介面執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 外掛封存檔必須在解壓後的外掛根目錄包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的封存檔會在 OpenClaw 寫入安裝記錄前被拒絕。

    當檔案是 npm-pack tarball，而且你想使用與註冊表安裝相同的每外掛受管 npm 專案路徑時，請使用 `npm-pack:<path.tgz>`，
    包括 `package-lock.json` 驗證、提升的依賴項掃描，
    以及 npm 安裝記錄。純封存檔路徑仍會作為本機
    封存檔安裝到外掛 extensions 根目錄下。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在啟動切換期間，裸 npm 安全外掛規格預設會從 npm 安裝，除非它們符合官方外掛 id：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 讓 npm-only 解析明確化：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查公告的外掛 API / 最低閘道相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載帶版本的 npm-pack `.tgz`，驗證 ClawHub digest header 和成品 digest，然後透過一般封存檔路徑安裝。沒有 ClawPack 中繼資料的較舊 ClawHub 版本仍會透過舊版套件封存檔驗證路徑安裝。記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm integrity、npm shasum、tarball 名稱，以及 ClawPack digest 事實，以供日後更新。
未指定版本的 ClawHub 安裝會保留未指定版本的記錄規格，因此 `openclaw plugins update` 可以跟隨較新的 ClawHub 發行版；明確版本或標籤選擇器，例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`，仍會釘選到該選擇器。

### Marketplace 簡寫

當 marketplace 名稱存在於 Claude 的本機註冊表快取 `~/.claude/plugins/known_marketplaces.json` 時，使用 `plugin@marketplace` 簡寫：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

使用 `--marketplace` 明確傳入 marketplace 來源：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace 來源">
    - 來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude known-marketplace 名稱
    - 本機 marketplace 根目錄或 `marketplace.json` 路徑
    - GitHub repo 簡寫，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="遠端 marketplace 規則">
    對於從 GitHub 或 git 載入的遠端 marketplace，外掛項目必須留在 clone 下來的 marketplace repo 內。OpenClaw 接受來自該 repo 的相對路徑來源，並拒絕遠端 manifest 中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑外掛來源。
  </Tab>
</Tabs>

對於本機路徑和封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw 外掛（`openclaw.plugin.json`）
- Codex 相容 bundle（`.codex-plugin/plugin.json`）
- Claude 相容 bundle（`.claude-plugin/plugin.json`，或該 manifest 檔案不存在時的預設 Claude component layout）
- Cursor 相容 bundle（`.cursor-plugin/plugin.json`）

受管本機安裝必須是外掛目錄或封存檔。獨立的 `.js`、
`.mjs`、`.cjs` 和 `.ts` 外掛檔案不會由 `plugins install` 複製到受管外掛
根目錄，也不會透過直接放在
`~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 而載入；這些
自動探索的根目錄會載入外掛套件或 bundle 目錄，並略過
頂層指令碼檔案，將其視為本機輔助工具。請改在
`plugins.load.paths` 中明確列出獨立檔案。

<Note>
相容 bundle 會安裝到一般外掛根目錄，並參與相同的 list/info/enable/disable 流程。目前支援 bundle Skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的 bundle capability 會顯示在 diagnostics/info 中，但尚未接入執行階段執行。
</Note>

使用 `-l`/`--link` 指向本機外掛目錄而不複製它（加入
`plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--link` 不支援與 `--force`（連結外掛會直接指向來源
路徑，因此沒有可就地覆寫的內容）、`--marketplace` 或
`git:` 安裝搭配使用，而且需要已存在的本機路徑。

<Note>
從 workspace extensions 根目錄探索到的 workspace-origin plugins 不會
匯入或執行，直到它們被明確啟用。對於本機開發，
執行 `openclaw plugins enable <plugin-id>` 或設定
`plugins.entries.<plugin-id>.enabled: true`；如果你的 config 使用
`plugins.allow`，也請在其中包含相同的外掛 id。此 fail-closed 規則
也會在 channel setup 明確針對 workspace-origin plugin 進行
setup-only loading 時套用，因此當該 workspace 外掛仍處於停用狀態
或被排除在 allowlist 之外時，本機 channel 外掛 setup code 不會執行。Linked installs
和明確的 `plugins.load.paths` 項目會針對其
已解析的外掛來源遵循一般政策。請參閱
[設定外掛政策](/zh-TW/tools/plugin#configure-plugin-policy)
和 [設定參考](/zh-TW/gateway/configuration-reference#plugins)。

在 npm 安裝上使用 `--pin`，可將已解析的精確規格（`name@version`）儲存在受管外掛索引中，同時保留預設未釘選行為。
</Note>

## 清單

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  只顯示已啟用的外掛。
</ParamField>
<ParamField path="--verbose" type="boolean">
  從表格檢視切換為每個外掛的詳細列，包含 format/source/origin/version/activation 中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清查，加上註冊表診斷和套件依賴項安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久化的本機外掛註冊表，並在註冊表缺失或無效時使用僅由 manifest 推導的 fallback。這對檢查外掛是否已安裝、已啟用，以及是否對冷啟動規劃可見很有用，但它不是已執行中閘道程序的即時執行階段探測。變更外掛程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 後，請重新啟動服務該 channel 的閘道，再期待新的 `register(api)` 程式碼或 hook 執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是 wrapper 程序。

`plugins list --json` 會包含每個外掛來自 `package.json`
`dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於該外掛一般的節點 `node_modules` lookup path；它
不會匯入外掛執行階段程式碼、執行套件管理器，或修復缺失的
依賴項。
</Note>

如果啟動記錄出現 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，
請執行 `openclaw plugins list --enabled --verbose` 或
使用列出的外掛 id 執行 `openclaw plugins inspect <id>`，以確認外掛
id，並將受信任的 id 複製到 `openclaw.json` 的 `plugins.allow`。當
警告可以列出每個探索到的外掛時，它會印出可直接貼上的
`plugins.allow` 片段，其中已包含這些 id。如果外掛在沒有
install/load-path provenance 的情況下載入，請檢查該外掛 id，然後
將受信任的 id 釘選到 `plugins.allow`，或從受信任來源重新安裝該外掛，
讓 OpenClaw 記錄安裝 provenance。

對於 packaged Docker image 內的 bundled plugin 工作，請將外掛
來源目錄 bind-mount 到相符的 packaged source path 上，例如
`/app/extensions/synology-chat`。OpenClaw 會先探索該掛載的 source overlay，
再探索 `/app/dist/extensions/synology-chat`；單純複製的來源目錄
仍然是 inert，因此一般 packaged installs 仍會使用 compiled dist。

對於執行階段 hook 除錯：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自模組載入檢查流程的已註冊鉤子與診斷資訊。執行階段檢查絕不會安裝相依套件；請使用 `openclaw doctor --fix` 清理舊版相依套件狀態，或復原設定中引用但遺失的可下載外掛。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的閘道 URL/設定檔、服務/程序提示、設定路徑與 RPC 健康狀態。
- 非內建對話鉤子（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

### 外掛索引

外掛安裝中繼資料是由機器管理的狀態，不是使用者設定。安裝與更新會將其寫入作用中 OpenClaw 狀態目錄下的共用 SQLite 狀態資料庫。`installed_plugin_index` 資料列會儲存持久的 `installRecords` 中繼資料，包括損壞或遺失的外掛資訊清單記錄，以及由資訊清單衍生的冷註冊表快取，供 `openclaw plugins update`、解除安裝、診斷與冷外掛註冊表使用。

當 OpenClaw 在設定中看到已發布的舊版 `plugins.installs` 記錄時，執行階段讀取會將其視為相容性輸入，而不會重寫 `openclaw.json`。明確的外掛寫入與 `openclaw doctor --fix` 會將這些記錄移入外掛索引，並在允許寫入設定時移除該設定鍵；如果任一寫入失敗，設定記錄會保留下來，以免安裝中繼資料遺失。

## 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` 會從 `plugins.entries`、持久化外掛索引、外掛允許/拒絕清單項目，以及適用時已連結的 `plugins.load.paths` 項目中移除外掛記錄。除非設定 `--keep-files`，解除安裝也會移除追蹤的受管理安裝目錄，但前提是該目錄解析後位於 OpenClaw 的外掛擴充根目錄內。如果外掛目前擁有 `memory` 或 `contextEngine` 槽位，該槽位會重設為其預設值（記憶體為 `memory-core`，情境引擎為 `legacy`）。

`uninstall` 會列印將被移除項目的預覽，然後在進行變更前提示 `Uninstall plugin "<id>"?`。傳入 `--force` 可略過確認提示（適合指令碼與非互動式執行）；若未傳入，解除安裝需要互動式 TTY。`--dry-run` 會列印相同預覽並結束，不提示也不變更任何內容。

<Note>
`--keep-config` 仍受支援，但已棄用，作為 `--keep-files` 的別名。
</Note>

## 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新會套用到受管理外掛索引中追蹤的外掛安裝，以及 `hooks.internal.installs` 中追蹤的鉤子包安裝。

<AccordionGroup>
  <Accordion title="解析外掛 ID 與 npm 規格">
    當你傳入外掛 ID 時，OpenClaw 會重用該外掛記錄的安裝規格。這表示先前儲存的 dist-tag（例如 `@beta`）與精確釘選版本，會在後續 `update <id>` 執行中繼續使用。

    在 `update <id> --dry-run` 期間，精確釘選的 npm 安裝會保持釘選。如果 OpenClaw 也能解析該套件的註冊表預設線，且該預設線比已安裝的釘選版本更新，試跑會回報該釘選，並列印明確的 `@latest` 套件更新命令，以跟隨註冊表預設線。

    這項目標更新規則不同於批次 `openclaw plugins update --all` 維護路徑。批次更新仍會遵守一般追蹤的安裝規格，但受信任的官方 OpenClaw 外掛記錄可以同步到目前官方目錄目標，而不是停留在過時的精確官方套件。若你有意讓精確或帶標籤的官方規格保持不變，請使用目標式 `update <id>`。

    對於 npm 安裝，你也可以傳入具有 dist-tag 或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回追蹤的外掛記錄、更新該已安裝外掛，並記錄新的 npm 規格供未來依 ID 更新使用。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回追蹤的外掛記錄。當外掛被釘選到精確版本，而你想將其移回註冊表的預設發布線時，請使用此方式。

  </Accordion>
  <Accordion title="Beta 通道更新">
    目標式 `openclaw plugins update <id-or-npm-spec>` 會重用追蹤的外掛規格，除非你傳入新的規格。批次 `openclaw plugins update --all` 在將受信任官方外掛記錄同步到官方目錄目標時，會使用已設定的 `update.channel`，因此 beta 通道安裝可以停留在 beta 發布線，而不會被靜默正規化為 stable/latest。

    `openclaw update` 也知道作用中的 OpenClaw 更新通道：在 beta 通道上，預設線 npm 與 ClawHub 外掛記錄會先嘗試 `@beta`。如果沒有外掛 beta 發布，它們會退回到記錄的 default/latest 規格；npm 外掛也會在 beta 套件存在但安裝驗證失敗時退回。該退回會以警告回報，且不會使核心更新失敗。精確版本與明確標籤會在目標式更新中保持釘選到該選擇器。

  </Accordion>
  <Accordion title="版本檢查與完整性漂移">
    在即時 npm 更新之前，OpenClaw 會根據 npm 註冊表中繼資料檢查已安裝套件版本。如果已安裝版本與記錄的成品身分已符合解析出的目標，更新會略過，不下載、不重新安裝，也不重寫 `openclaw.json`。

    當已儲存完整性雜湊存在，且擷取到的成品雜湊發生變化時，OpenClaw 會將其視為 npm 成品漂移。互動式 `openclaw plugins update` 命令會列印預期與實際雜湊，並在繼續前要求確認。非互動式更新輔助工具會採取失敗關閉，除非呼叫端提供明確的繼續政策。

  </Accordion>
  <Accordion title="更新時使用 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也會在 `plugins update` 上被接受以維持相容性，但它已棄用，且不再改變外掛更新行為。操作員 `security.installPolicy` 仍可封鎖更新；外掛 `before_install` 鉤子只會在已載入外掛鉤子的程序中套用。
  </Accordion>
  <Accordion title="更新時使用 --acknowledge-clawhub-risk">
    由社群 ClawHub 支援的外掛更新，會在下載替換套件前執行與安裝相同的精確發布信任檢查。對於已審查且在選定 ClawHub 發布有高風險信任警告時仍應繼續的自動化，請使用 `--acknowledge-clawhub-risk`。官方 ClawHub 套件與內建 OpenClaw 外掛來源會略過此發布信任提示。
  </Accordion>
</AccordionGroup>

## 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

檢查預設不匯入外掛執行階段，並顯示身分、載入狀態、來源、資訊清單能力、政策旗標、診斷資訊、安裝中繼資料、套件能力，以及偵測到的任何 MCP 或 LSP 伺服器支援。JSON 輸出包含外掛資訊清單合約，例如 `contracts.agentToolResultMiddleware` 與 `contracts.trustedToolPolicies`，讓操作員可在啟用或重新啟動外掛前稽核受信任介面宣告。加入 `--runtime` 可載入外掛模組，並包含已註冊的鉤子、工具、命令、服務、閘道方法與 HTTP 路由。執行階段檢查會直接回報遺失的外掛相依套件；安裝與修復仍位於 `openclaw plugins install`、`openclaw plugins update` 與 `openclaw doctor --fix`。

外掛擁有的命令列介面命令通常會安裝為根 `openclaw` 命令群組，但外掛也可以在核心父項下註冊巢狀命令，例如 `openclaw nodes`。在 `inspect --runtime` 於 `cliCommands` 下顯示命令後，請在列出的路徑執行它；例如，註冊 `demo-git` 的外掛可用 `openclaw demo-git ping` 驗證。

每個外掛都會依其在執行階段實際註冊的內容分類：

| 形狀                | 意義                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | 正好一種能力類型（例如僅提供者外掛）                              |
| `hybrid-capability` | 超過一種能力類型（例如文字 + 語音 + 圖像）                         |
| `hook-only`         | 只有鉤子，沒有能力、工具、命令、服務或路由                         |
| `non-capability`    | 有工具/命令/服務，但沒有能力                                      |

如需能力模型的更多資訊，請參閱[外掛形狀](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合指令碼與稽核的機器可讀報告。`inspect --all` 會呈現全域表格，其中包含形狀、能力種類、相容性通知、套件能力與鉤子摘要欄位。`info` 是 `inspect` 的別名。
</Note>

## 診斷

```bash
openclaw plugins doctor
```

`doctor` 會回報外掛載入錯誤、資訊清單/探索診斷、相容性通知，以及遺失外掛槽位等過時外掛設定引用。當安裝樹與外掛設定乾淨時，會列印 `No plugin issues detected.` 如果仍有過時設定但安裝樹除此之外是健康的，摘要會如此說明，而不是暗示完整的外掛健康狀態。

如果已設定的外掛存在於磁碟上，但被載入器的路徑安全檢查封鎖，設定驗證會保留該外掛項目，並將其回報為 `present but blocked`。請修正前面的被封鎖外掛診斷，例如路徑擁有權或全域可寫權限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 設定。

對於模組形狀失敗，例如遺失 `register`/`activate` 匯出，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出形狀摘要。

## 註冊表

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機外掛註冊表是 OpenClaw 持久化的冷讀模型，用於已安裝外掛身分、啟用狀態、來源中繼資料與貢獻擁有權。一般啟動、提供者擁有者查找、通道設定分類與外掛清冊，都可以在不匯入外掛執行階段模組的情況下讀取它。

使用 `plugins registry` 檢查持久化註冊表是否存在、為目前版本或已過時。使用 `--refresh` 可從持久化外掛索引、設定政策與資訊清單/套件中繼資料重建它。這是修復路徑，不是執行階段啟用路徑。

`openclaw doctor --fix` 也會修復註冊表相鄰的受管理 npm 漂移：如果受管理外掛 npm 專案或舊版扁平受管理 npm 根目錄下的孤立或復原 `@openclaw/*` 套件遮蔽了內建外掛，doctor 會移除該過時套件並重建註冊表，使啟動可根據內建資訊清單驗證。Doctor 也會將主機 `openclaw` 套件重新連結到宣告 `peerDependencies.openclaw` 的受管理 npm 外掛中，讓套件本機執行階段匯入（例如 `openclaw/plugin-sdk/*`）可在更新或 npm 修復後解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的破窗相容性開關，用於註冊表讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；此環境變數退回只供遷移推出期間的緊急啟動復原使用。
</Warning>

## 市集

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` 會列出已設定 OpenClaw 市集資訊源中的項目。預設會嘗試使用託管資訊源，並在失敗時回退到最新已接受的快照或隨附資料。使用 `--feed-profile <name>` 可讀取特定已設定的設定檔，使用 `--feed-url <url>` 可讀取明確指定的託管資訊源 URL，使用 `--offline` 可在不擷取資訊源的情況下讀取最新已接受的快照。

`plugins marketplace refresh` 會重新整理已設定的託管資訊源快照，並回報 OpenClaw 接受的是託管資料、託管快照，還是隨附的回退資料。當呼叫端需要命令在新鮮的託管承載內容符合固定校驗和時才成功，請使用 `--expected-sha256`。

Marketplace `list` 接受本機 marketplace 路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會印出解析後的來源標籤，以及已剖析的 marketplace manifest 和外掛項目。

Marketplace refresh 會載入託管的 OpenClaw marketplace feed，並將
驗證後的回應保存為本機託管 feed 快照。沒有選項時，它會使用
已設定的預設 feed profile。使用 `--feed-profile <name>` 重新整理
特定已設定的 profile，使用 `--feed-url <url>` 重新整理明確指定的託管
feed URL，使用 `--expected-sha256 <sha256>` 要求相符的 payload checksum
（`sha256:<hex>` 或裸 64 字元 hex digest），並使用 `--json` 取得
機器可讀輸出。明確指定的託管 feed URL 不得包含
憑證、query string 或 fragment。未釘選的 refresh 可以回報
託管快照或 bundled fallback 結果，而不讓命令失敗。釘選的
refresh 除非接受新的託管 payload，否則會失敗；成功的託管
refresh 若 OpenClaw 無法保存已驗證的快照，也會失敗。

## 相關

- [建置外掛](/zh-TW/plugins/building-plugins)
- [命令列介面參考](/zh-TW/cli)
- [ClawHub](/clawhub)
