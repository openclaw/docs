---
read_when:
    - 你想安裝或管理閘道外掛或相容套件包
    - 你想要搭建或驗證一個簡單的工具外掛
    - 你想要偵錯外掛載入失敗
sidebarTitle: Plugins
summary: '`openclaw plugins` 的命令列介面參考（init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor）'
title: 外掛
x-i18n:
    generated_at: "2026-06-28T20:43:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

管理閘道外掛、鉤子套件包與相容套件包。

<CardGroup cols={2}>
  <Card title="外掛系統" href="/zh-TW/tools/plugin">
    安裝、啟用與疑難排解外掛的終端使用者指南。
  </Card>
  <Card title="管理外掛" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝與發布的快速範例。
  </Card>
  <Card title="外掛套件包" href="/zh-TW/plugins/bundles">
    套件包相容性模型。
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

若要調查緩慢的安裝、檢查、解除安裝或登錄重新整理，請在執行命令時使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。追蹤會將各階段耗時寫入 stderr，並讓 JSON 輸出保持可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，外掛生命週期變更操作會被停用。請改用 Nix 來源進行此安裝，而不是 `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable` 或 `plugins disable`；若使用 nix-openclaw，請使用代理優先的[快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
隨附外掛會隨 OpenClaw 一起出貨。有些預設啟用（例如隨附模型提供者、隨附語音提供者與隨附瀏覽器外掛）；其他則需要 `plugins enable`。

原生 OpenClaw 外掛必須隨附 `openclaw.plugin.json`，其中包含內嵌 JSON Schema（`configSchema`，即使為空也需要）。相容套件包則改用自己的套件包資訊清單。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細的 list/info 輸出也會顯示套件包子類型（`codex`、`claude` 或 `cursor`）以及偵測到的套件包功能。
</Note>

### 作者

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 預設會建立最小 TypeScript 工具外掛。第一個引數是外掛 ID；傳入 `--name` 以設定顯示名稱。OpenClaw 會使用該 ID 作為預設輸出目錄與套件命名。工具鷹架使用 `defineToolPlugin`。
`plugins build` 會匯入建置完成的進入點、讀取其靜態工具中繼資料、寫入 `openclaw.plugin.json`，並讓 `package.json` 的 `openclaw.extensions` 保持同步。
`plugins validate` 會檢查產生的資訊清單、套件中繼資料與目前進入點匯出是否仍一致。完整的工具撰寫工作流程請參閱[工具外掛](/zh-TW/plugins/tool-plugins)。

鷹架會寫入 TypeScript 原始碼，但會從建置完成的 `./dist/index.js` 進入點產生中繼資料，因此此工作流程也可搭配已發布的命令列介面使用。當進入點不是預設套件進入點時，請使用 `--entry <path>`。在 CI 中使用 `plugins build --check`，可在產生的中繼資料過時時讓流程失敗，而不重寫檔案。

### 提供者鷹架

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

提供者鷹架會建立通用文字/模型提供者外掛，包含 OpenAI 相容的 API 金鑰接線、用於 `clawhub package validate` 的內建 `npm run validate` 指令碼、ClawHub 套件中繼資料，以及日後透過 GitHub Actions OIDC 進行受信任發布的手動觸發 GitHub 工作流程。提供者鷹架不會產生 skills，也不使用 `openclaw plugins build` 或 `openclaw plugins validate`；這些命令是給工具鷹架的產生中繼資料路徑使用。

發布前，請以真實的提供者詳細資訊取代預留位置 API 基底 URL、模型目錄、文件路由、憑證文字與 README 文案。首次發布到 ClawHub 以及設定受信任發布者時，請使用產生的 README。

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

測試設定期間安裝的維護者，可以使用受保護的環境變數覆寫自動外掛安裝來源。請參閱[外掛安裝覆寫](/zh-TW/plugins/install-overrides)。

<Warning>
在啟動切換期間，裸套件名稱預設會從 npm 安裝，除非它們符合官方外掛 ID。符合隨附外掛的原始 `@openclaw/*` 套件規格，會使用目前 OpenClaw 建置隨附的副本。當你刻意想使用外部 npm 套件時，請使用 `npm:<package>`。ClawHub 請使用 `clawhub:<package>`。請把安裝外掛視為執行程式碼。建議使用釘選版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的外掛套件，並列印可直接安裝的套件名稱。它會搜尋 code-plugin 與 bundle-plugin 套件，而不是 Skills。若要搜尋 ClawHub Skills，請使用 `openclaw skills search`。

<Note>
ClawHub 是大多數外掛的主要發布與探索介面。Npm 仍是受支援的備援與直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` 外掛套件已再次發布到 npm；請在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或[外掛清單](/zh-TW/plugins/plugin-inventory)查看目前清單。穩定安裝使用 `latest`。Beta 頻道的安裝與更新會優先使用 npm 的 `beta` dist-tag（若該標籤可用），然後才退回 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="設定包含與無效設定修復">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該包含檔案，並讓 `openclaw.json` 保持不變。根層包含、包含陣列，以及帶有同層覆寫的包含，都會失敗關閉，而不會攤平成單一內容。支援的形狀請參閱[設定包含](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會失敗關閉，並告訴你先執行 `openclaw doctor --fix`。在閘道啟動與熱重新載入期間，無效的外掛設定會像任何其他無效設定一樣失敗關閉；`openclaw doctor --fix` 可以隔離無效的外掛項目。唯一有文件記載的安裝期間例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的外掛所提供的狹窄隨附外掛復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝相對於更新">
    `--force` 會重用既有安裝目標，並就地覆寫已安裝的外掛或鉤子套件包。當你刻意要從新的本機路徑、封存檔、ClawHub 套件或 npm 成品重新安裝相同 ID 時，請使用它。若要例行升級已追蹤的 npm 外掛，請優先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的外掛 ID 執行 `plugins install`，OpenClaw 會停止並指向 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時，指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 只適用於 npm 安裝。不支援搭配 `git:` 安裝使用；若你想使用釘選來源，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它也不支援搭配 `--marketplace` 使用，因為 marketplace 安裝會保留 marketplace 來源中繼資料，而不是 npm 規格。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已淘汰，且現在不執行任何操作。OpenClaw 不再對外掛安裝執行內建的安裝期間危險程式碼封鎖。

    當需要主機特定安裝政策時，請使用共享的操作員擁有 `security.installPolicy` 介面。外掛 `before_install` 鉤子是外掛執行階段生命週期鉤子，不是命令列介面安裝的主要政策邊界。

    如果你發布到 ClawHub 的外掛被登錄掃描隱藏或封鎖，請使用 [ClawHub 發布](/zh-TW/clawhub/publishing)中的發布者步驟。`--dangerously-force-unsafe-install` 不會要求 ClawHub 重新掃描外掛，也不會讓被封鎖的發布公開。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    社群 ClawHub 安裝會在下載套件前檢查所選發布的信任記錄。如果 ClawHub 對該發布停用下載、回報惡意掃描發現，或將發布置於封鎖式審核狀態（例如隔離），OpenClaw 會拒絕該發布。對於非封鎖式的高風險掃描狀態、高風險審核狀態或登錄原因，OpenClaw 會顯示信任詳細資訊，並在繼續前要求確認。

    只有在檢閱 ClawHub 警告並決定在沒有互動式提示的情況下繼續後，才使用 `--acknowledge-clawhub-risk`。擱置中或過期的乾淨信任記錄會發出警告，但不需要確認。官方 ClawHub 套件與隨附的 OpenClaw 外掛來源會略過此發布信任提示。

  </Accordion>
  <Accordion title="鉤子套件包與 npm 規格">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 的鉤子套件包的介面。若要篩選鉤子可見性與逐一啟用鉤子，請使用 `openclaw hooks`，而不是套件安裝。

    Npm 規格為**僅限登錄檔**（套件名稱 + 選用的**精確版本**或 **dist-tag**）。Git/URL/file 規格與 semver 範圍會被拒絕。為了安全，即使你的 shell 設有全域 npm install 設定，依賴項安裝也會在每個外掛一個受管理的 npm 專案中以 `--ignore-scripts` 執行。受管理的外掛 npm 專案會繼承 OpenClaw 的套件層級 npm `overrides`，因此主機安全釘選也會套用到提升的外掛依賴項。

    當你想明確指定 npm 解析時，請使用 `npm:<package>`。在啟動切換期間，裸套件規格也會直接從 npm 安裝，除非它們符合官方外掛 id。

    符合內建外掛的原始 `@openclaw/*` 套件規格，會先解析為映像擁有的內建副本，再進行 npm 後援。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 會使用目前 OpenClaw 建置中的內建 Discord 外掛，而不是建立受管理的 npm override。若要強制使用外部 npm 套件，請使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    裸規格與 `@latest` 會留在穩定軌道。OpenClaw 日期戳記修正版，例如 `2026.5.3-1`，在此檢查中屬於穩定版本。如果 npm 將其中任一項解析為預發布版本，OpenClaw 會停止並要求你使用預發布標籤（例如 `@beta`/`@rc`）或精確的預發布版本（例如 `@1.2.3-beta.4`）明確選擇加入。

    對於沒有精確版本的 npm 安裝（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 會在安裝前檢查已解析的套件中繼資料。如果最新穩定套件需要較新的 OpenClaw 外掛 API 或最低主機版本，OpenClaw 會檢查較舊的穩定版本，並改為安裝最新的相容版本。精確版本與明確的 dist-tag（例如 `@beta`）仍會嚴格處理：如果選取的套件不相容，命令會失敗並要求你升級 OpenClaw 或選擇相容版本。

    如果裸安裝規格符合官方外掛 id（例如 `diffs`），OpenClaw 會直接安裝目錄項目。若要安裝同名的 npm 套件，請使用明確的 scoped 規格（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 儲存庫">
    使用 `git:<repo>` 可直接從 git 儲存庫安裝。支援的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` 複製 URL。新增 `@<ref>` 或 `#<ref>` 可在安裝前簽出分支、標籤或提交。

    Git 安裝會複製到暫存目錄，在指定 ref 時簽出要求的 ref，然後使用一般外掛目錄安裝程式。這表示清單驗證、操作員安裝政策、套件管理員安裝作業，以及安裝紀錄的行為都會像 npm 安裝一樣。記錄的 git 安裝會包含來源 URL/ref 與已解析的提交，因此 `openclaw plugins update` 之後可以重新解析來源。

    從 git 安裝後，使用 `openclaw plugins inspect <id> --runtime --json` 驗證執行階段註冊，例如 gateway 方法與命令列介面命令。如果外掛使用 `api.registerCli` 註冊了命令列介面根命令，請直接透過 OpenClaw 根命令列介面執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 外掛封存檔必須在解壓後的外掛根目錄包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的封存檔會在 OpenClaw 寫入安裝紀錄前被拒絕。

    當檔案是 npm-pack tarball，且你想測試與登錄檔安裝相同的每外掛受管理 npm 專案路徑時，請使用 `npm-pack:<path.tgz>`，
    包括 `package-lock.json` 驗證、提升的依賴項掃描，
    以及 npm 安裝紀錄。一般封存檔路徑仍會作為本機
    封存檔安裝在外掛 extensions 根目錄下。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在啟動切換期間，裸 npm-safe 外掛規格預設會從 npm 安裝，除非它們符合官方外掛 id：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可明確指定僅限 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查公布的外掛 API / 最低閘道相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載版本化的 npm-pack `.tgz`，驗證 ClawHub 摘要標頭與成品摘要，然後透過一般封存檔路徑安裝。沒有 ClawPack 中繼資料的較舊 ClawHub 版本，仍會透過舊版套件封存檔驗證路徑安裝。記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm integrity、npm shasum、tarball 名稱，以及 ClawPack 摘要事實，以便之後更新。
未指定版本的 ClawHub 安裝會保留未指定版本的記錄規格，因此 `openclaw plugins update` 可以追蹤較新的 ClawHub 發行版；明確版本或標籤選擇器，例如 `clawhub:pkg@1.2.3` 與 `clawhub:pkg@beta`，仍會釘選到該選擇器。

#### Marketplace 簡寫

當 marketplace 名稱存在於 Claude 的本機 registry 快取 `~/.claude/plugins/known_marketplaces.json` 時，使用 `plugin@marketplace` 簡寫：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

當你想明確傳遞 marketplace 來源時，請使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace 來源">
    - 來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名稱
    - 本機 marketplace 根目錄或 `marketplace.json` 路徑
    - GitHub repo 簡寫，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="遠端 marketplace 規則">
    對於從 GitHub 或 git 載入的遠端 marketplace，外掛項目必須留在複製的 marketplace repo 內。OpenClaw 接受來自該 repo 的相對路徑來源，並拒絕遠端清單中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑外掛來源。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw 外掛（`openclaw.plugin.json`）
- Codex 相容 bundle（`.codex-plugin/plugin.json`）
- Claude 相容 bundle（`.claude-plugin/plugin.json` 或預設 Claude 元件配置）
- Cursor 相容 bundle（`.cursor-plugin/plugin.json`）

受管理的本機安裝必須是外掛目錄或封存檔。獨立的 `.js`、
`.mjs`、`.cjs` 與 `.ts` 外掛檔案不會由 `plugins install` 複製到受管理的外掛
根目錄；請改為在 `plugins.load.paths` 中明確列出它們。

<Note>
相容 bundle 會安裝到一般外掛根目錄，並參與相同的 list/info/enable/disable 流程。目前支援 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / 清單宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的 bundle 能力會顯示在診斷/info 中，但尚未接入執行階段執行。
</Note>

### 列出

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
  僅顯示已啟用的外掛。
</ParamField>
<ParamField path="--verbose" type="boolean">
  從表格檢視切換為每個外掛的詳細列，包含來源/源頭/版本/啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀清單，加上 registry 診斷與套件依賴項安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取已持久化的本機外掛 registry，當 registry 遺失或無效時，才使用僅由清單衍生的後援。它適合用來檢查外掛是否已安裝、已啟用，且對冷啟動規劃可見，但它不是已執行中閘道程序的即時執行階段探測。變更外掛程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 後，請重新啟動服務該 channel 的閘道，再預期新的 `register(api)` 程式碼或 hook 會執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是 wrapper 程序。

`plugins list --json` 會包含每個外掛來自 `package.json`
`dependencies` 與 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於外掛的一般 Node `node_modules` 查找路徑中；它
不會匯入外掛執行階段程式碼、執行套件管理員，或修復遺失的
依賴項。
</Note>

如果啟動日誌顯示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，
請執行 `openclaw plugins list --enabled --verbose` 或
使用列出的外掛 id 執行 `openclaw plugins inspect <id>`，以確認外掛
id，並將受信任的 id 複製到 `openclaw.json` 的 `plugins.allow`。當該
警告可以列出每個已發現外掛時，它會列印一段可直接貼上的
`plugins.allow` 片段，其中已包含這些 id。如果外掛在沒有
安裝/load-path 來源證明的情況下載入，請檢查該外掛 id，然後將
受信任的 id 釘選在 `plugins.allow`，或從受信任來源重新安裝該外掛，
讓 OpenClaw 記錄安裝來源證明。

`plugins search` 是遠端 ClawHub catalog 查詢。它不會檢查本機
狀態、修改 config、安裝套件，或載入外掛執行階段程式碼。搜尋
結果包含 ClawHub 套件名稱、家族、channel、版本、摘要，以及
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

對於封裝 Docker 映像內的內建外掛工作，請將外掛
來源目錄 bind-mount 到相符的封裝來源路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會先於 `/app/dist/extensions/synology-chat` 發現該掛載的來源
overlay；一般複製的來源
目錄仍不會生效，因此一般封裝安裝仍會使用已編譯的 dist。

對於執行階段 hook 偵錯：

- `openclaw plugins inspect <id> --runtime --json` 會顯示從模組載入檢查流程取得的已註冊 hook 與診斷。執行階段檢查永遠不會安裝依賴項；請使用 `openclaw doctor --fix` 清理舊版依賴項狀態，或復原 config 參照的遺失可下載外掛。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的閘道 URL/profile、服務/程序提示、config 路徑，以及 RPC 健康狀態。
- 非內建 conversation hooks（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免複製本機外掛目錄（會加入 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

獨立外掛檔案必須列在 `plugins.load.paths` 中，而不是
使用 `plugins install` 安裝，或直接放在 `~/.openclaw/extensions`
或 `<workspace>/.openclaw/extensions`。這些自動發現的根目錄會載入外掛
套件或 bundle 目錄，而頂層 script 檔案會被視為本機
helper 並略過。

<Note>
從工作區擴充根目錄探索到的工作區來源外掛，在明確啟用之前不會被匯入或執行。若要進行本機開發，請執行 `openclaw plugins enable <plugin-id>`，或設定 `plugins.entries.<plugin-id>.enabled: true`；如果你的設定使用 `plugins.allow`，也請在其中包含相同的外掛 ID。這項預設封閉規則也適用於通道設定明確指定工作區來源外掛進行僅設定載入的情況，因此在該工作區外掛仍停用或被排除在允許清單之外時，本機通道外掛設定程式碼不會執行。連結安裝與明確的 `plugins.load.paths` 項目，會依其解析後外掛來源的正常政策處理。請參閱
[設定外掛政策](/zh-TW/tools/plugin#configure-plugin-policy)
和[設定參考](/zh-TW/gateway/configuration-reference#plugins)。

`--force` 不支援與 `--link` 搭配使用，因為連結安裝會重用來源路徑，而不是覆寫受管理的安裝目標。

在 npm 安裝上使用 `--pin`，可將解析後的精確規格（`name@version`）儲存在受管理的外掛索引中，同時保留預設的未釘選行為。
</Note>

### 外掛索引

外掛安裝中繼資料是由機器管理的狀態，而不是使用者設定。安裝與更新會將其寫入作用中 OpenClaw 狀態目錄下的共享 SQLite 狀態資料庫。`installed_plugin_index` 列會儲存持久的 `installRecords` 中繼資料，包括損壞或遺失外掛 manifest 的記錄，以及由 manifest 衍生、供 `openclaw plugins update`、解除安裝、診斷和冷外掛登錄使用的冷登錄快取。

當 OpenClaw 在設定中看到已發布的舊版 `plugins.installs` 記錄時，執行階段讀取會將其視為相容性輸入，而不會重寫 `openclaw.json`。明確的外掛寫入和 `openclaw doctor --fix` 會在允許寫入設定時，將這些記錄移入外掛索引並移除設定鍵；如果任一寫入失敗，設定記錄會被保留，避免安裝中繼資料遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會在適用時從 `plugins.entries`、持久化外掛索引、外掛允許/拒絕清單項目，以及已連結的 `plugins.load.paths` 項目中移除外掛記錄。除非設定 `--keep-files`，否則解除安裝也會移除位於 OpenClaw 外掛擴充根目錄內、受追蹤的受管理安裝目錄。對於主動記憶外掛，記憶插槽會重設為 `memory-core`。

<Note>
`--keep-config` 作為 `--keep-files` 的已棄用別名仍受支援。
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

更新會套用至受管理外掛索引中受追蹤的外掛安裝，以及 `hooks.internal.installs` 中受追蹤的 hook-pack 安裝。

<AccordionGroup>
  <Accordion title="解析外掛 ID 與 npm 規格">
    當你傳入外掛 ID 時，OpenClaw 會重用該外掛已記錄的安裝規格。這表示先前儲存的 dist-tag（例如 `@beta`）和精確釘選版本，會在後續 `update <id>` 執行時繼續使用。

    在 `update <id> --dry-run` 期間，精確釘選的 npm 安裝會保持釘選。如果 OpenClaw 也能解析套件的登錄預設線，且該預設線比已安裝的釘選版本更新，dry run 會回報該釘選，並列印明確的 `@latest` 套件更新命令，以跟隨登錄預設線。

    該目標更新規則不同於大量 `openclaw plugins update --all` 維護路徑。大量更新仍會尊重一般受追蹤的安裝規格，但受信任的官方 OpenClaw 外掛記錄可以同步至目前官方目錄目標，而不是停留在過時的精確官方套件上。當你刻意想讓精確或帶標籤的官方規格保持不變時，請使用目標式 `update <id>`。

    對於 npm 安裝，你也可以傳入帶有 dist-tag 或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回受追蹤的外掛記錄，更新該已安裝外掛，並記錄新的 npm 規格以供日後依 ID 更新。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回受追蹤的外掛記錄。當外掛被釘選到精確版本，而你想將其移回登錄的預設發行線時，請使用此方式。

  </Accordion>
  <Accordion title="Beta 通道更新">
    目標式 `openclaw plugins update <id-or-npm-spec>` 會重用受追蹤的外掛規格，除非你傳入新規格。大量 `openclaw plugins update --all` 在將受信任的官方外掛記錄同步至官方目錄目標時，會使用設定的 `update.channel`，因此 beta 通道安裝可以留在 beta 發行線，而不是被靜默正規化為 stable/latest。

    `openclaw update` 也知道作用中的 OpenClaw 更新通道：在 beta 通道上，預設線 npm 與 ClawHub 外掛記錄會先嘗試 `@beta`。如果沒有外掛 beta 發行，它們會回退至已記錄的 default/latest 規格；npm 外掛在 beta 套件存在但安裝驗證失敗時也會回退。該回退會以警告回報，且不會讓核心更新失敗。精確版本和明確標籤會在目標式更新中保持釘選到該選擇器。

  </Accordion>
  <Accordion title="版本檢查與完整性漂移">
    在即時 npm 更新之前，OpenClaw 會根據 npm 登錄中繼資料檢查已安裝套件版本。如果已安裝版本和已記錄的 artifact 身分已符合解析後的目標，更新會略過，不會下載、重新安裝或重寫 `openclaw.json`。

    當存在已儲存的完整性雜湊，且擷取到的 artifact 雜湊發生變化時，OpenClaw 會將其視為 npm artifact 漂移。互動式 `openclaw plugins update` 命令會列印預期與實際雜湊，並在繼續前要求確認。非互動式更新輔助程式會預設封閉失敗，除非呼叫端提供明確的延續政策。

  </Accordion>
  <Accordion title="更新時使用 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也會在 `plugins update` 上被接受以維持相容性，但它已棄用，且不再變更外掛更新行為。操作者 `security.installPolicy` 仍可封鎖更新；外掛 `before_install` hook 只會套用在已載入外掛 hook 的處理程序中。
  </Accordion>
  <Accordion title="更新時使用 --acknowledge-clawhub-risk">
    社群 ClawHub 支援的外掛更新，在下載替換套件前會執行與安裝相同的精確發行信任檢查。對於經審查且應在所選 ClawHub 發行具有高風險信任警告時仍繼續的自動化，請使用 `--acknowledge-clawhub-risk`。官方 ClawHub 套件和內建 OpenClaw 外掛來源會略過此發行信任提示。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不會匯入外掛執行階段，會顯示身分、載入狀態、來源、manifest capabilities、政策旗標、診斷、安裝中繼資料、bundle capabilities，以及任何偵測到的 MCP 或 LSP 伺服器支援。JSON 輸出包含外掛 manifest 合約，例如 `contracts.agentToolResultMiddleware` 和 `contracts.trustedToolPolicies`，讓操作者可在啟用或重新啟動外掛前稽核受信任介面宣告。加入 `--runtime` 可載入外掛模組，並包含已註冊的 hooks、tools、commands、services、gateway methods 和 HTTP routes。執行階段檢查會直接回報遺失的外掛相依性；安裝與修復仍由 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 負責。

外掛擁有的命令列介面命令通常會安裝為根 `openclaw` 命令群組，但外掛也可以在核心父層下註冊巢狀命令，例如 `openclaw nodes`。在 `inspect --runtime` 於 `cliCommands` 下顯示命令後，請在列出的路徑執行；例如，註冊 `demo-git` 的外掛可以用 `openclaw demo-git ping` 驗證。

每個外掛會依其在執行階段實際註冊的內容分類：

- **plain-capability** — 一種能力類型（例如僅提供者外掛）
- **hybrid-capability** — 多種能力類型（例如文字 + 語音 + 圖片）
- **hook-only** — 僅 hooks，沒有能力或介面
- **non-capability** — tools/commands/services，但沒有能力

請參閱[外掛形態](/zh-TW/plugins/architecture#plugin-shapes)，了解更多能力模型資訊。

<Note>
`--json` 旗標會輸出適合腳本與稽核的機器可讀報告。`inspect --all` 會呈現涵蓋全體的表格，包含 shape、capability kinds、compatibility notices、bundle capabilities 和 hook summary 欄位。`info` 是 `inspect` 的別名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報外掛載入錯誤、manifest/探索診斷、相容性通知，以及過時的外掛設定參照，例如遺失的外掛插槽。當安裝樹和外掛設定乾淨時，會列印 `No plugin issues detected.`。如果仍有過時設定，但安裝樹其他部分健康，摘要會如此說明，而不是暗示外掛完全健康。

如果已設定的外掛存在於磁碟上，但被載入器的路徑安全檢查封鎖，設定驗證會保留該外掛項目，並回報為 `present but blocked`。請修正前面的已封鎖外掛診斷，例如路徑擁有權或所有人可寫權限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 設定。

對於模組形態失敗，例如遺失 `register`/`activate` 匯出，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出形態摘要。

### 登錄

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機外掛登錄是 OpenClaw 持久化的冷讀模型，用於已安裝外掛身分、啟用狀態、來源中繼資料和貢獻擁有權。正常啟動、提供者擁有者查找、通道設定分類和外掛清查都可讀取它，而不必匯入外掛執行階段模組。

使用 `plugins registry` 檢查持久化登錄是否存在、目前有效或過時。使用 `--refresh` 可從持久化外掛索引、設定政策和 manifest/package 中繼資料重建它。這是修復路徑，不是執行階段啟用路徑。

`openclaw doctor --fix` 也會修復與登錄相鄰的受管理 npm 漂移：如果受管理外掛 npm 專案或舊版扁平受管理 npm 根目錄下，有孤立或已復原的 `@openclaw/*` 套件遮蔽了內建外掛，doctor 會移除該過時套件並重建登錄，讓啟動依內建 manifest 驗證。Doctor 也會將主機 `openclaw` 套件重新連結到宣告 `peerDependencies.openclaw` 的受管理 npm 外掛中，使套件本機執行階段匯入（例如 `openclaw/plugin-sdk/*`）在更新或 npm 修復後可解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的緊急相容性開關，用於登錄讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；env 回退僅供遷移推出期間的緊急啟動復原使用。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

市集清單接受本機市集路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub 儲存庫 URL，或 git URL。`--json` 會列印解析後的來源標籤，以及剖析出的市集清單與外掛項目。

市集重新整理會載入託管的 OpenClaw 市集摘要來源，並將
已驗證的回應保存為本機託管摘要來源快照。未指定選項時，它會使用
已設定的預設摘要來源設定檔。使用 `--feed-profile <name>` 重新整理
特定已設定的設定檔，使用 `--feed-url <url>` 重新整理明確指定的託管
摘要來源 URL，使用 `--expected-sha256 <sha256>` 要求相符的承載校驗和
（`sha256:<hex>` 或裸 64 字元十六進位摘要），並使用 `--json` 取得
機器可讀的輸出。明確指定的託管摘要來源 URL 不得包含
認證資訊、查詢字串或片段。未釘選的重新整理可以回報
託管快照或內建備援結果，而不讓命令失敗。已釘選的
重新整理必須接受新的託管承載才會成功，且如果 OpenClaw 無法保存已驗證的快照，
成功的託管重新整理也會失敗。

## 相關

- [建置外掛](/zh-TW/plugins/building-plugins)
- [命令列介面參考](/zh-TW/cli)
- [ClawHub](/zh-TW/clawhub)
