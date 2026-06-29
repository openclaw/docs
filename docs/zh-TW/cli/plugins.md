---
read_when:
    - 你想要安裝或管理閘道外掛或相容套件
    - 您想要建立或驗證一個簡單工具外掛的骨架
    - 你想要偵錯外掛載入失敗
sidebarTitle: Plugins
summary: '`openclaw plugins` 的命令列介面參考（init、build、validate、list、install、marketplace、uninstall、enable/disable、doctor）'
title: 外掛
x-i18n:
    generated_at: "2026-06-28T22:33:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

管理閘道外掛、掛鉤套件與相容套件組合。

<CardGroup cols={2}>
  <Card title="外掛系統" href="/zh-TW/tools/plugin">
    安裝、啟用與疑難排解外掛的使用者指南。
  </Card>
  <Card title="管理外掛" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝與發布的快速範例。
  </Card>
  <Card title="外掛套件組合" href="/zh-TW/plugins/bundles">
    套件組合相容性模型。
  </Card>
  <Card title="外掛資訊清單" href="/zh-TW/plugins/manifest">
    資訊清單欄位與設定結構描述。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security">
    外掛安裝的安全性強化。
  </Card>
</CardGroup>

## 命令

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

若要調查緩慢的安裝、檢查、解除安裝或登錄重新整理，請在執行命令時加上 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。追蹤會將階段耗時寫入 stderr，並讓 JSON 輸出保持可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式 (`OPENCLAW_NIX_MODE=1`) 中，外掛生命週期變更操作會停用。請改用此安裝的 Nix 來源，而不是 `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable` 或 `plugins disable`；若使用 nix-openclaw，請使用以代理程式為優先的[快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
內建外掛會隨 OpenClaw 一起提供。有些預設啟用（例如內建模型供應商、內建語音供應商，以及內建瀏覽器外掛）；其他則需要 `plugins enable`。

原生 OpenClaw 外掛必須隨附 `openclaw.plugin.json`，並包含內嵌 JSON Schema（`configSchema`，即使為空也一樣）。相容套件組合則使用各自的套件組合資訊清單。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細的清單/資訊輸出也會顯示套件組合子類型（`codex`、`claude` 或 `cursor`），以及偵測到的套件組合能力。
</Note>

### 作者

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 預設會建立最小 TypeScript 工具外掛。第一個引數是外掛 id；傳入 `--name` 可設定顯示名稱。OpenClaw 會使用該 id 作為預設輸出目錄和套件命名。工具支架使用 `defineToolPlugin`。
`plugins build` 會匯入建置後的進入點、讀取其靜態工具中繼資料、寫入 `openclaw.plugin.json`，並讓 `package.json` 的 `openclaw.extensions` 保持一致。
`plugins validate` 會檢查產生的資訊清單、套件中繼資料與目前進入點匯出是否仍一致。完整的工具作者工作流程請參閱[工具外掛](/zh-TW/plugins/tool-plugins)。

支架會寫入 TypeScript 原始碼，但會從建置後的 `./dist/index.js` 進入點產生中繼資料，因此此工作流程也能搭配已發布的命令列介面使用。當進入點不是預設套件進入點時，請使用 `--entry <path>`。在 CI 中使用 `plugins build --check`，可在產生的中繼資料過期時失敗，而不重寫檔案。

### 供應商支架

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

供應商支架會建立通用文字/模型供應商外掛，包含與 OpenAI 相容的 API 金鑰管線、用於 `clawhub package validate` 的內建 `npm run validate` 指令碼、ClawHub 套件中繼資料，以及未來透過 GitHub Actions OIDC 進行可信發布的手動觸發 GitHub 工作流程。供應商支架不會產生 skills，也不使用 `openclaw plugins build` 或 `openclaw plugins validate`；這些命令適用於工具支架的產生式中繼資料路徑。

發布前，請將預留位置 API 基礎 URL、模型目錄、文件路由、認證文字與 README 文案替換為真實的供應商詳細資料。使用產生的 README 進行首次 ClawHub 發布與可信發布者設定。

### 安裝

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

測試設定時安裝的維護者，可以使用受保護的環境變數覆寫自動外掛安裝來源。請參閱[外掛安裝覆寫](/zh-TW/plugins/install-overrides)。

<Warning>
在啟動切換期間，裸套件名稱預設會從 npm 安裝，除非它們符合官方外掛 id。符合內建外掛的原始 `@openclaw/*` 套件規格會使用目前 OpenClaw 建置隨附的內建副本。若你刻意要使用外部 npm 套件，請使用 `npm:<package>`。ClawHub 請使用 `clawhub:<package>`。請將外掛安裝視為執行程式碼。建議使用釘選版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的外掛套件，並印出可直接安裝的套件名稱。它會搜尋程式碼外掛和套件組合外掛套件，而不是 skills。ClawHub skills 請使用 `openclaw skills search`。

<Note>
ClawHub 是大多數外掛的主要發行與探索介面。Npm 仍是受支援的後備與直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` 外掛套件已重新發布到 npm；請在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或[外掛清單](/zh-TW/plugins/plugin-inventory)查看目前清單。穩定版安裝使用 `latest`。Beta 通道安裝與更新會在 npm `beta` dist-tag 可用時優先使用該標籤，然後才回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="設定包含與無效設定修復">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該被包含的檔案，並保持 `openclaw.json` 不變。根包含、包含陣列，以及帶有同層覆寫的包含會封閉失敗，而不是展平。支援的形狀請參閱[設定包含](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會封閉失敗，並告訴你先執行 `openclaw doctor --fix`。在閘道啟動與熱重新載入期間，無效外掛設定會像任何其他無效設定一樣封閉失敗；`openclaw doctor --fix` 可以隔離無效的外掛項目。唯一有文件記載的安裝時例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的外掛所提供的狹窄內建外掛復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝相對於更新">
    `--force` 會重用現有安裝目標，並就地覆寫已安裝的外掛或掛鉤套件。當你刻意從新的本機路徑、封存、ClawHub 套件或 npm 成品重新安裝相同 id 時使用。對於已追蹤 npm 外掛的一般升級，建議使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你針對已安裝的外掛 id 執行 `plugins install`，OpenClaw 會停止並指向 `plugins update <id-or-npm-spec>` 進行一般升級；若你確實要從不同來源覆寫目前安裝，則指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 只適用於 npm 安裝。不支援搭配 `git:` 安裝；若要釘選來源，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它也不支援搭配 `--marketplace`，因為 marketplace 安裝會保留 marketplace 來源中繼資料，而不是 npm 規格。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已被棄用，現在不執行任何操作。OpenClaw 不再對外掛安裝執行內建的安裝時危險程式碼封鎖。

    當需要主機特定安裝政策時，請使用共用的操作員擁有 `security.installPolicy` 介面。外掛 `before_install` 掛鉤是外掛執行階段生命週期掛鉤，不是命令列介面安裝的主要政策邊界。

    如果你發布在 ClawHub 的外掛被登錄掃描隱藏或封鎖，請使用 [ClawHub 發布](/zh-TW/clawhub/publishing)中的發布者步驟。`--dangerously-force-unsafe-install` 不會要求 ClawHub 重新掃描外掛，也不會讓被封鎖的版本公開。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    社群 ClawHub 安裝會在下載套件前檢查所選版本的信任紀錄。如果 ClawHub 停用該版本下載、回報惡意掃描結果，或將該版本置於封鎖型審核狀態（例如隔離），OpenClaw 會拒絕該版本。對於非封鎖型的高風險掃描狀態、高風險審核狀態或登錄原因，OpenClaw 會顯示信任詳細資料，並在繼續前要求確認。

    只有在審閱 ClawHub 警告並決定不透過互動提示繼續後，才使用 `--acknowledge-clawhub-risk`。待處理或過期的乾淨信任紀錄會警告，但不需要確認。官方 ClawHub 套件與內建 OpenClaw 外掛來源會略過此版本信任提示。

  </Accordion>
  <Accordion title="掛鉤套件與 npm 規格">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 之掛鉤套件的介面。使用 `openclaw hooks` 查看篩選後的掛鉤可見性與逐掛鉤啟用，而不是進行套件安裝。

    Npm 規格是**僅限登錄庫**（套件名稱 + 可選的**精確版本**或 **dist-tag**）。Git/URL/file 規格與 semver 範圍都會被拒絕。為了安全，即使你的 shell 有全域 npm 安裝設定，依賴安裝仍會在每個外掛的一個受管理 npm 專案中以 `--ignore-scripts` 執行。受管理的外掛 npm 專案會繼承 OpenClaw 套件層級的 npm `overrides`，因此主機安全性釘選也會套用到提升的外掛依賴。

    當你想明確指定 npm 解析時，請使用 `npm:<package>`。在啟動切換期間，裸套件規格也會直接從 npm 安裝，除非它們符合官方外掛 ID。

    符合內建外掛的原始 `@openclaw/*` 套件規格，會在 npm 備援之前解析為映像檔擁有的內建副本。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 會使用目前 OpenClaw 建置中的內建 Discord 外掛，而不是建立受管理的 npm 覆寫。若要強制使用外部 npm 套件，請使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    裸規格和 `@latest` 會停留在穩定軌道。OpenClaw 帶日期戳記的修正版，例如 `2026.5.3-1`，在此檢查中屬於穩定版本。如果 npm 將其中任一項解析為預發行版本，OpenClaw 會停止並要求你使用預發行標籤（例如 `@beta`/`@rc`）或精確的預發行版本（例如 `@1.2.3-beta.4`）明確選擇加入。

    對於沒有精確版本的 npm 安裝（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 會在安裝前檢查已解析的套件中繼資料。如果最新穩定套件需要較新的 OpenClaw 外掛 API 或最低主機版本，OpenClaw 會檢查較舊的穩定版本，並改為安裝最新的相容版本。精確版本和明確的 dist-tag（例如 `@beta`）仍維持嚴格模式：如果選取的套件不相容，命令會失敗並要求你升級 OpenClaw 或選擇相容版本。

    如果裸安裝規格符合官方外掛 ID（例如 `diffs`），OpenClaw 會直接安裝目錄項目。若要安裝同名的 npm 套件，請使用明確的 scoped 規格（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 儲存庫">
    使用 `git:<repo>` 可直接從 git 儲存庫安裝。支援的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` 複製 URL。新增 `@<ref>` 或 `#<ref>` 可在安裝前簽出分支、標籤或提交。

    Git 安裝會複製到暫存目錄，在提供時簽出要求的 ref，然後使用一般外掛目錄安裝程式。這表示清單驗證、操作員安裝政策、套件管理器安裝工作，以及安裝記錄的行為都會像 npm 安裝一樣。記錄的 git 安裝會包含來源 URL/ref 與已解析的提交，因此 `openclaw plugins update` 稍後可以重新解析來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證執行階段註冊，例如閘道方法與命令列介面命令。如果外掛使用 `api.registerCli` 註冊了命令列介面根命令，請直接透過 OpenClaw 根命令列介面執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 外掛封存檔必須在解壓後的外掛根目錄中包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的封存檔會在 OpenClaw 寫入安裝記錄前被拒絕。

    當檔案是 npm-pack tarball，且你想測試與登錄庫安裝相同的每外掛受管理 npm 專案路徑時，請使用 `npm-pack:<path.tgz>`，包括 `package-lock.json` 驗證、提升依賴掃描，以及 npm 安裝記錄。純封存檔路徑仍會作為本機封存檔安裝到外掛 extensions 根目錄下。

    也支援 Claude 市集安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在啟動切換期間，裸 npm 安全外掛規格預設會從 npm 安裝，除非它們符合官方外掛 ID：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 讓僅限 npm 的解析更明確：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查公告的外掛 API / 最低閘道相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載帶版本的 npm-pack `.tgz`，驗證 ClawHub digest 標頭與成品 digest，然後透過一般封存檔路徑安裝。沒有 ClawPack 中繼資料的較舊 ClawHub 版本仍會透過舊版套件封存檔驗證路徑安裝。記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm integrity、npm shasum、tarball 名稱，以及 ClawPack digest 事實，以供稍後更新。
未帶版本的 ClawHub 安裝會保留未帶版本的記錄規格，因此 `openclaw plugins update` 可以追蹤較新的 ClawHub 版本；明確版本或標籤選擇器，例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`，仍會釘選到該選擇器。

#### 市集簡寫

當市集名稱存在於 Claude 位於 `~/.claude/plugins/known_marketplaces.json` 的本機登錄快取中時，請使用 `plugin@marketplace` 簡寫：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

當你想明確傳入市集來源時，請使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="市集來源">
    - 來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知市集名稱
    - 本機市集根目錄或 `marketplace.json` 路徑
    - GitHub 儲存庫簡寫，例如 `owner/repo`
    - GitHub 儲存庫 URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="遠端市集規則">
    對於從 GitHub 或 git 載入的遠端市集，外掛項目必須留在複製出的市集儲存庫內。OpenClaw 會接受來自該儲存庫的相對路徑來源，並拒絕遠端清單中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑外掛來源。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw 外掛（`openclaw.plugin.json`）
- Codex 相容套件組合（`.codex-plugin/plugin.json`）
- Claude 相容套件組合（`.claude-plugin/plugin.json` 或預設 Claude 元件配置）
- Cursor 相容套件組合（`.cursor-plugin/plugin.json`）

受管理的本機安裝必須是外掛目錄或封存檔。獨立的 `.js`、`.mjs`、`.cjs` 和 `.ts` 外掛檔案不會由 `plugins install` 複製到受管理的外掛根目錄；請改為在 `plugins.load.paths` 中明確列出它們。

<Note>
相容套件組合會安裝到一般外掛根目錄，並參與相同的 list/info/enable/disable 流程。目前支援套件組合 Skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / 清單宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的套件組合功能會顯示在 diagnostics/info 中，但尚未接入執行階段執行。
</Note>

### 清單

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  只顯示已啟用的外掛。
</ParamField>
<ParamField path="--verbose" type="boolean">
  從表格檢視切換為每個外掛的詳細列，包含 source/origin/version/activation 中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀取的清查，加上登錄診斷與套件依賴安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久化的本機外掛登錄；當登錄遺失或無效時，則使用僅由清單衍生的備援。它適合用來檢查外掛是否已安裝、已啟用，且可被冷啟動規劃看見，但它不是對已在執行中之閘道程序的即時執行階段探測。變更外掛程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 後，請重新啟動服務該通道的閘道，再期待新的 `register(api)` 程式碼或 hook 執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝程序。

`plugins list --json` 會包含每個外掛來自 `package.json` `dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些套件名稱是否存在於外掛的一般節點 `node_modules` 查找路徑中；它不會匯入外掛執行階段程式碼、執行套件管理器，或修復遺失的依賴。
</Note>

如果啟動日誌顯示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，請執行 `openclaw plugins list --enabled --verbose`，或搭配列出的外掛 ID 執行 `openclaw plugins inspect <id>`，以確認外掛 ID，並將信任的 ID 複製到 `openclaw.json` 中的 `plugins.allow`。當警告可以列出每個已發現的外掛時，它會印出可直接貼上的 `plugins.allow` 片段，且已包含這些 ID。如果外掛在沒有安裝/載入路徑來源證明的情況下載入，請檢查該外掛 ID，然後將信任的 ID 釘選到 `plugins.allow`，或從可信來源重新安裝外掛，讓 OpenClaw 記錄安裝來源證明。

`plugins search` 是遠端 ClawHub 目錄查詢。它不會檢查本機狀態、變更設定、安裝套件，或載入外掛執行階段程式碼。搜尋結果包含 ClawHub 套件名稱、family、channel、version、summary，以及安裝提示，例如 `openclaw plugins install clawhub:<package>`。

若要在封裝的 Docker 映像檔內進行內建外掛工作，請將外掛來源目錄 bind-mount 到相符的封裝來源路徑上，例如 `/app/extensions/synology-chat`。OpenClaw 會在 `/app/dist/extensions/synology-chat` 之前發現該掛載的來源覆蓋；單純複製的來源目錄仍不會生效，因此一般封裝安裝仍會使用編譯後的 dist。

對於執行階段 hook 偵錯：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自模組載入檢查階段的已註冊 hook 與診斷。執行階段檢查絕不會安裝依賴；請使用 `openclaw doctor --fix` 清理舊版依賴狀態，或復原設定中引用的遺失可下載外掛。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的閘道 URL/profile、service/process 提示、設定路徑，以及 RPC 健康狀態。
- 非內建對話 hook（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免複製本機外掛目錄（會新增到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

獨立外掛檔案必須列在 `plugins.load.paths` 中，而不是使用 `plugins install` 安裝，或直接放在 `~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 中。這些自動探索的根目錄會載入外掛套件或套件組合目錄，而頂層指令碼檔案會被視為本機輔助程式並略過。

<Note>
從工作區 extensions 根目錄探索到的工作區來源外掛，在明確啟用前不會被匯入或執行。若要進行本機開發，請執行 `openclaw plugins enable <plugin-id>` 或設定 `plugins.entries.<plugin-id>.enabled: true`；如果你的設定使用 `plugins.allow`，也要在其中包含相同的外掛 id。這項失敗關閉規則也適用於通道設定明確指定工作區來源外掛進行僅設定載入的情況，因此只要該工作區外掛仍停用或被排除在允許清單外，本機通道外掛設定程式碼就不會執行。連結安裝和明確的 `plugins.load.paths` 項目，會依其解析後外掛來源套用一般政策。請參閱
[設定外掛政策](/zh-TW/tools/plugin#configure-plugin-policy)
和[設定參考](/zh-TW/gateway/configuration-reference#plugins)。

`--force` 不支援與 `--link` 搭配使用，因為連結安裝會重用來源路徑，而不是複製到受管理的安裝目標。

在 npm 安裝上使用 `--pin`，可將解析後的精確規格（`name@version`）儲存在受管理的外掛索引中，同時保留預設的未釘選行為。
</Note>

### 外掛索引

外掛安裝中繼資料是機器管理的狀態，不是使用者設定。安裝與更新會將它寫入有效 OpenClaw 狀態目錄下的共享 SQLite 狀態資料庫。`installed_plugin_index` 資料列會儲存持久的 `installRecords` 中繼資料，包括損壞或缺少外掛 manifest 的記錄，以及由 manifest 衍生、供 `openclaw plugins update`、解除安裝、診斷和冷外掛登錄檔使用的冷登錄快取。

當 OpenClaw 在設定中看到已發布的舊版 `plugins.installs` 記錄時，執行階段讀取會把它們視為相容性輸入，而不會重寫 `openclaw.json`。明確的外掛寫入和 `openclaw doctor --fix` 會在允許寫入設定時，把這些記錄移入外掛索引並移除設定鍵；如果任一寫入失敗，設定記錄會被保留，避免安裝中繼資料遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會在適用時從 `plugins.entries`、持久化外掛索引、外掛允許/拒絕清單項目，以及連結的 `plugins.load.paths` 項目中移除外掛記錄。除非設定了 `--keep-files`，解除安裝也會在受追蹤的受管理安裝目錄位於 OpenClaw 外掛 extensions 根目錄內時移除該目錄。對於主動記憶外掛，記憶槽會重設為 `memory-core`。

<Note>
`--keep-config` 作為 `--keep-files` 的已棄用別名受到支援。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新會套用到受管理外掛索引中受追蹤的外掛安裝，以及 `hooks.internal.installs` 中受追蹤的 hook-pack 安裝。

<AccordionGroup>
  <Accordion title="解析外掛 id 與 npm 規格">
    當你傳入外掛 id 時，OpenClaw 會重用該外掛記錄的安裝規格。這表示先前儲存的 dist-tag（例如 `@beta`）和精確釘選版本，會在後續的 `update <id>` 執行中繼續使用。

    在 `update <id> --dry-run` 期間，精確釘選的 npm 安裝會維持釘選。如果 OpenClaw 也能解析套件的登錄預設線，而且該預設線比已安裝的釘選版本更新，試執行會回報該釘選，並列印明確的 `@latest` 套件更新命令，以跟隨登錄預設線。

    這項目標更新規則不同於批次 `openclaw plugins update --all` 維護路徑。批次更新仍會尊重一般受追蹤的安裝規格，但受信任的官方 OpenClaw 外掛記錄可以同步到目前的官方目錄目標，而不是停留在過時的精確官方套件上。當你有意讓精確或帶標籤的官方規格保持不變時，請使用目標式 `update <id>`。

    對於 npm 安裝，你也可以傳入帶有 dist-tag 或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回受追蹤的外掛記錄、更新該已安裝外掛，並記錄新的 npm 規格供未來以 id 為基礎的更新使用。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回受追蹤的外掛記錄。當外掛被釘選到精確版本，而你想把它移回登錄的預設發布線時，請使用此方式。

  </Accordion>
  <Accordion title="Beta 通道更新">
    目標式 `openclaw plugins update <id-or-npm-spec>` 會重用受追蹤的外掛規格，除非你傳入新規格。批次 `openclaw plugins update --all` 在將受信任的官方外掛記錄同步到官方目錄目標時，會使用已設定的 `update.channel`，因此 beta 通道安裝可以留在 beta 發布線上，而不會被悄悄正規化為 stable/latest。

    `openclaw update` 也知道有效的 OpenClaw 更新通道：在 beta 通道上，預設線 npm 和 ClawHub 外掛記錄會先嘗試 `@beta`。如果沒有外掛 beta 發布，它們會退回記錄的 default/latest 規格；當 beta 套件存在但安裝驗證失敗時，npm 外掛也會退回。該退回會以警告回報，且不會使核心更新失敗。精確版本和明確標籤會在目標式更新中維持釘選到該選擇器。

  </Accordion>
  <Accordion title="版本檢查與完整性漂移">
    在即時 npm 更新前，OpenClaw 會依 npm 登錄中繼資料檢查已安裝套件版本。如果已安裝版本和記錄的成品身分已經符合解析出的目標，更新會被略過，不會下載、重新安裝或重寫 `openclaw.json`。

    當已儲存完整性雜湊且擷取到的成品雜湊改變時，OpenClaw 會將其視為 npm 成品漂移。互動式 `openclaw plugins update` 命令會列印預期與實際雜湊，並在繼續前要求確認。非互動式更新輔助工具會失敗關閉，除非呼叫者提供明確的延續政策。

  </Accordion>
  <Accordion title="更新時使用 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也會基於相容性在 `plugins update` 上被接受，但它已棄用，且不再改變外掛更新行為。操作者 `security.installPolicy` 仍可阻擋更新；外掛 `before_install` hook 只會在已載入外掛 hook 的程序中套用。
  </Accordion>
  <Accordion title="更新時使用 --acknowledge-clawhub-risk">
    由社群 ClawHub 支援的外掛更新，會在下載替換套件前執行與安裝相同的精確發布信任檢查。對於已審查且在選定 ClawHub 發布具有高風險信任警告時仍應繼續的自動化，請使用 `--acknowledge-clawhub-risk`。官方 ClawHub 套件和內建 OpenClaw 外掛來源會略過此發布信任提示。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不匯入外掛執行階段，會顯示身分、載入狀態、來源、manifest 能力、政策旗標、診斷、安裝中繼資料、套件能力，以及任何偵測到的 MCP 或 LSP 伺服器支援。JSON 輸出包含外掛 manifest 合約，例如 `contracts.agentToolResultMiddleware` 和 `contracts.trustedToolPolicies`，因此操作者可以在啟用或重新啟動外掛前稽核受信任介面宣告。加入 `--runtime` 可載入外掛模組，並包含已註冊的 hook、工具、命令、服務、閘道方法和 HTTP 路由。執行階段檢查會直接回報缺少的外掛相依項；安裝與修復仍在 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 中進行。

外掛擁有的命令列介面命令通常會安裝為根 `openclaw` 命令群組，但外掛也可以在核心父命令下註冊巢狀命令，例如 `openclaw nodes`。在 `inspect --runtime` 顯示 `cliCommands` 下的命令後，請在列出的路徑執行它；例如，註冊 `demo-git` 的外掛可用 `openclaw demo-git ping` 驗證。

每個外掛會依其在執行階段實際註冊的內容分類：

- **plain-capability** — 一種能力類型（例如僅提供 provider 的外掛）
- **hybrid-capability** — 多種能力類型（例如文字 + 語音 + 圖片）
- **hook-only** — 只有 hook，沒有能力或介面
- **non-capability** — 有工具/命令/服務，但沒有能力

更多能力模型資訊，請參閱[外掛形態](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合腳本和稽核的機器可讀報告。`inspect --all` 會呈現跨整個機群的表格，包含形態、能力種類、相容性通知、套件能力和 hook 摘要欄位。`info` 是 `inspect` 的別名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報外掛載入錯誤、manifest/探索診斷、相容性通知，以及過時的外掛設定參照，例如缺少外掛槽。當安裝樹和外掛設定都乾淨時，它會列印 `No plugin issues detected.` 如果仍有過時設定但安裝樹其他部分健康，摘要會如此說明，而不是暗示完整外掛健康狀態。

如果已設定的外掛存在於磁碟上，但被載入器的路徑安全檢查阻擋，設定驗證會保留外掛項目，並將其回報為 `present but blocked`。請修正前面的受阻外掛診斷，例如路徑所有權或全域可寫權限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 設定。

對於模組形態失敗，例如缺少 `register`/`activate` 匯出，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出形態摘要。

### 登錄檔

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機外掛登錄檔是 OpenClaw 對已安裝外掛身分、啟用狀態、來源中繼資料和貢獻所有權的持久化冷讀模型。一般啟動、provider 擁有者查詢、通道設定分類和外掛清單盤點，都可在不匯入外掛執行階段模組的情況下讀取它。

使用 `plugins registry` 檢查持久化登錄檔是否存在、為目前版本或已過時。使用 `--refresh` 可從持久化外掛索引、設定政策和 manifest/套件中繼資料重建它。這是修復路徑，不是執行階段啟用路徑。

`openclaw doctor --fix` 也會修復與登錄檔相鄰的受管理 npm 漂移：如果受管理外掛 npm 專案或舊版扁平受管理 npm 根目錄下孤立或復原的 `@openclaw/*` 套件遮蔽了內建外掛，doctor 會移除該過時套件並重建登錄檔，讓啟動改為依內建 manifest 驗證。Doctor 也會將主機 `openclaw` 套件重新連結到宣告 `peerDependencies.openclaw` 的受管理 npm 外掛中，因此套件本機執行階段匯入（例如 `openclaw/plugin-sdk/*`）可在更新或 npm 修復後解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的破窗相容性開關，用於登錄檔讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；此環境變數退回僅供遷移推出期間的緊急啟動復原使用。
</Warning>

### Marketplace

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

`plugins marketplace entries` 會列出已設定 OpenClaw marketplace feed 中的 entries。預設會嘗試使用託管 feed，並在失敗時回退到最新接受的快照或 bundled data。使用 `--feed-profile <name>` 讀取特定已設定的 profile，使用 `--feed-url <url>` 讀取明確指定的託管 feed URL，並使用 `--offline` 在不擷取 feed 的情況下讀取最新接受的快照。

`plugins marketplace refresh` 會重新整理已設定的託管 feed 快照，並回報 OpenClaw 接受的是託管資料、託管快照，還是 bundled fallback data。當呼叫端需要命令在新的託管 payload 不符合 pinned checksum 時失敗，請使用 `--expected-sha256`。

Marketplace `list` 接受本機 marketplace 路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會印出解析後的來源標籤，以及已剖析的 marketplace manifest 和外掛 entries。

Marketplace refresh 會載入託管的 OpenClaw marketplace feed，並將已驗證的回應保存為本機託管 feed 快照。若未提供選項，會使用已設定的預設 feed profile。使用 `--feed-profile <name>` 重新整理特定已設定的 profile，使用 `--feed-url <url>` 重新整理明確指定的託管 feed URL，使用 `--expected-sha256 <sha256>` 要求 payload checksum 相符（`sha256:<hex>` 或裸 64 字元 hex digest），並使用 `--json` 取得機器可讀輸出。明確指定的託管 feed URL 不得包含 credentials、查詢字串或 fragment。未 pinned 的重新整理可回報託管快照或 bundled fallback 結果，而不會讓命令失敗。Pinned 的重新整理必須接受新的託管 payload，否則會失敗；成功的託管重新整理若 OpenClaw 無法保存已驗證的快照，也會失敗。

## 相關

- [建置外掛](/zh-TW/plugins/building-plugins)
- [命令列介面參考](/zh-TW/cli)
- [ClawHub](/zh-TW/clawhub)
