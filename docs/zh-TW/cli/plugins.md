---
read_when:
    - 你想要安裝或管理閘道外掛或相容套件組合
    - 您想建立或驗證一個簡單的工具外掛骨架
    - 你想要偵錯外掛載入失敗的問題
sidebarTitle: Plugins
summary: '`openclaw plugins` 的命令列介面參考（初始化、建置、驗證、列出、安裝、市集、解除安裝、啟用／停用、診斷）'
title: 外掛
x-i18n:
    generated_at: "2026-07-11T21:14:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

管理閘道外掛、鉤子套件與相容套件組合。

<CardGroup cols={2}>
  <Card title="外掛系統" href="/zh-TW/tools/plugin">
    安裝、啟用外掛及疑難排解的終端使用者指南。
  </Card>
  <Card title="管理外掛" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝及發布的快速範例。
  </Card>
  <Card title="外掛套件組合" href="/zh-TW/plugins/bundles">
    套件組合相容性模型。
  </Card>
  <Card title="外掛資訊清單" href="/zh-TW/plugins/manifest">
    資訊清單欄位與設定結構描述。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security">
    強化外掛安裝安全性的措施。
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

調查緩慢的安裝、檢查、解除安裝或登錄檔重新整理作業時，請使用
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行命令。追蹤會將各階段耗時
寫入標準錯誤，並讓 JSON 輸出維持可解析狀態。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，`openclaw.json` 不可變更。`install`、`update`、`uninstall`、`enable` 與 `disable` 都會拒絕執行。請改為編輯此安裝項目的 Nix 來源（nix-openclaw 使用 `programs.openclaw.config` 或 `instances.<name>.config`），然後重新建置。請參閱以代理程式為優先的[快速入門](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
內建外掛隨 OpenClaw 一併提供。其中一些預設啟用（例如內建模型供應商、內建語音供應商及內建瀏覽器外掛）；其他外掛則需要執行 `plugins enable`。

原生 OpenClaw 外掛會提供 `openclaw.plugin.json`，其中包含內嵌的 JSON 結構描述（`configSchema`，即使內容為空亦然）。相容套件組合則使用自己的套件組合資訊清單。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細的清單／資訊輸出也會顯示套件組合子類型（`codex`、`claude` 或 `cursor`），以及偵測到的套件組合功能。
</Note>

## 製作

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 預設會建立最基本的 TypeScript 工具外掛。第一個
引數是外掛 ID；`--name` 用於設定顯示名稱。OpenClaw 會將此
ID 用於預設輸出目錄與套件命名。工具骨架使用
`defineToolPlugin`，並在 `package.json` 中產生 `plugin:build` 與
`plugin:validate` 指令碼；這些指令碼會先建置，再呼叫 `openclaw plugins build`／`validate`。

`plugins build` 會匯入建置後的進入點、讀取其靜態工具中繼資料、寫入
`openclaw.plugin.json`，並讓 `package.json` 中的 `openclaw.extensions` 保持一致。
`plugins validate` 會檢查產生的資訊清單、套件中繼資料及
目前進入點的匯出內容是否仍然一致。完整的製作工作流程請參閱[工具外掛](/zh-TW/plugins/tool-plugins)。

骨架會寫入 TypeScript 原始碼，但會從建置後的
`./dist/index.js` 進入點產生中繼資料，因此此工作流程也適用於已發布的命令列介面。當進入點並非預設套件進入點時，請使用
`--entry <path>`。在 CI 中使用
`plugins build --check`，可在產生的中繼資料過期時失敗，而不會
重寫檔案。

### 供應商骨架

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

供應商骨架會建立一個相容 OpenAI 的通用模型供應商外掛，
其中包含 API 金鑰驗證的連接機制、一個執行
`clawhub package validate` 的 `npm run validate` 指令碼、ClawHub 套件中繼資料，以及可手動
觸發的 GitHub Actions 工作流程，以供日後透過 GitHub
OIDC 進行受信任發布。供應商骨架不會產生 Skills，也不會使用
`openclaw plugins build`／`validate`；這些命令適用於工具
骨架的產生中繼資料流程。

發布前，請以實際供應商的詳細資訊取代預留的 API 基礎 URL、模型目錄、文件
路由、憑證文字與 README 內容。首次發布至 ClawHub 及設定受信任發布者時，請使用
產生的 README。

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

測試設定階段安裝的維護者可使用受保護的環境變數，覆寫自動外掛安裝
來源。請參閱
[外掛安裝覆寫](/zh-TW/plugins/install-overrides)。

<Warning>
在啟動轉換期間，裸套件名稱預設會從 npm 安裝；但若名稱符合內建或官方外掛 ID，OpenClaw 會使用該本機／官方副本，而不存取 npm 登錄檔。若您刻意要使用外部 npm 套件，請改用 `npm:<package>`。ClawHub 請使用 `clawhub:<package>`。應將安裝外掛視同執行程式碼；請優先使用固定版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 `code-plugin` 與
`bundle-plugin` 套件（不包含 Skills；若要搜尋 Skills，請使用 `openclaw skills search`）。
`--limit` 預設為 20，上限為 100。此命令只會讀取遠端目錄：不會
檢查本機狀態、修改設定、安裝套件或載入外掛執行階段。
結果包含 ClawHub 套件名稱、系列、頻道、版本、
摘要，以及類似 `openclaw plugins install clawhub:<package>` 的安裝提示。

<Note>
ClawHub 是大多數外掛的主要發布與探索介面。Npm
仍是受支援的備援及直接安裝途徑。OpenClaw 擁有的
`@openclaw/*` 外掛套件已恢復發布至 npm；目前的清單請參閱
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或
[外掛清單](/zh-TW/plugins/plugin-inventory)。穩定版安裝使用 `latest`。
Beta 頻道安裝與更新會在可用時優先使用 npm 的 `beta` 發布標籤，
否則退回 `latest`。在延伸穩定版頻道中，使用裸名稱／預設值或有意指定 `latest` 的官方 npm 外掛，
會解析為目前安裝的核心確切
版本。確切固定版本、明確指定的非 `latest` 標籤、第三方套件，以及
非 npm 來源都不會被重寫。
</Note>

<AccordionGroup>
  <Accordion title="設定引入與無效設定修復">
    如果您的 `plugins` 區段由單一檔案的 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會直接寫入該引入檔案，並保持 `openclaw.json` 不變。根層級引入、引入陣列，以及帶有同層覆寫內容的引入，都會以拒絕方式失敗，而不會將內容扁平化。支援的形式請參閱[設定引入](/zh-TW/gateway/configuration)。

    若安裝期間設定無效，`plugins install` 通常會以拒絕方式失敗，並要求您先執行 `openclaw doctor --fix`。在閘道啟動與熱重新載入期間，無效的外掛設定會像其他無效設定一樣以拒絕方式失敗；`openclaw doctor --fix` 可隔離無效的外掛項目。唯一有文件記載的安裝階段例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的外掛所提供的有限內建外掛復原途徑。

  </Accordion>
  <Accordion title="--force、重新安裝與更新的差異">
    `--force` 會重複使用現有安裝目標，並在原位置覆寫已安裝的外掛或鉤子套件。若您有意從新的本機路徑、封存檔、ClawHub 套件或 npm 成品重新安裝相同 ID，請使用此選項。對於已追蹤 npm 外掛的例行升級，請優先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果您對已安裝的外掛 ID 執行 `plugins install`，OpenClaw 會停止，並指示您使用 `plugins update <id-or-npm-spec>` 進行一般升級；若您確實想從不同來源覆寫目前的安裝，則會指示您使用 `plugins install <package> --force`。`--force` 不支援與 `--link` 搭配使用。

  </Accordion>
  <Accordion title="--pin 適用範圍">
    `--pin` 僅適用於 npm 安裝，並會記錄解析後的確切 `<name>@<version>`。此選項不支援 `git:` 安裝（請改為在規格中固定參照，例如 `git:github.com/acme/plugin@v1.2.3`），也不支援 `--marketplace`（市集安裝會保存市集來源中繼資料，而不是 npm 規格）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已棄用，目前不執行任何作業。OpenClaw 不再針對外掛安裝執行內建的安裝階段危險程式碼封鎖。

    當需要主機特定的安裝政策時，請使用由操作人員管理的 `security.installPolicy` 介面。外掛的 `before_install` 鉤子是外掛執行階段的生命週期鉤子，不是命令列介面安裝的主要政策邊界。

    如果您發布至 ClawHub 的外掛遭登錄檔掃描隱藏或封鎖，請依照 [ClawHub 發布](/zh-TW/clawhub/publishing)中的發布者步驟操作。`--dangerously-force-unsafe-install` 不會要求 ClawHub 重新掃描外掛，也不會將遭封鎖的版本公開。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    安裝社群 ClawHub 套件時，下載前會檢查所選版本的信任記錄。如果 ClawHub 停用該版本的下載、回報惡意掃描結果，或將該版本置於會阻止安裝的審核狀態（已隔離、已撤銷），無論是否使用此旗標，OpenClaw 都會直接拒絕。對於不會阻止安裝的高風險掃描狀態或審核狀態，OpenClaw 會顯示信任詳細資訊，並在繼續前要求確認。

    只有在檢閱 ClawHub 警告並決定不經互動式提示繼續後，才可使用 `--acknowledge-clawhub-risk`。待處理或過期（尚未確認為乾淨）的掃描結果會顯示警告，但不要求確認。官方 ClawHub 套件及內建 OpenClaw 外掛來源會完全略過此版本信任檢查。

  </Accordion>
  <Accordion title="鉤子套件與 npm 規格">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 之鉤子套件的介面。請使用 `openclaw hooks` 進行篩選後的鉤子檢視及個別鉤子啟用，而不是用於安裝套件。

    Npm 規格**僅限登錄檔**（套件名稱加上選用的**確切版本**或 **dist-tag**）。Git/URL/檔案規格與 semver 範圍會遭拒絕。為了安全，即使您的 shell 設有全域 npm 安裝設定，依賴項安裝仍會在每個外掛各自的受管理 npm 專案中使用 `--ignore-scripts` 執行。受管理的外掛 npm 專案會繼承 OpenClaw 套件層級的 npm `overrides`，因此主機的安全性版本鎖定也會套用至提升安裝的外掛依賴項。

    使用 `npm:<package>` 明確指定由 npm 解析。啟動切換期間，裸套件規格也會直接從 npm 安裝，除非其符合官方外掛 ID。

    符合內建外掛的原始 `@openclaw/*` 規格，會先解析至映像檔所擁有的內建副本，之後才退回 npm。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 會使用目前 OpenClaw 組建中的內建 Discord 外掛，而不是建立受管理的 npm 覆寫。若要強制使用外部 npm 套件，請使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    裸規格與 `@latest` 會維持在穩定版本軌。OpenClaw 的日期戳記修正版（例如 `2026.5.3-1`）在此檢查中視為穩定版本。如果 npm 將任一形式解析為預發行版本，OpenClaw 會停止並要求您使用預發行標籤（`@beta`/`@rc`）或確切的預發行版本（`@1.2.3-beta.4`）明確選擇加入。

    對於未指定確切版本的 npm 安裝（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 會在安裝前檢查解析後的套件中繼資料。如果最新穩定套件需要較新的 OpenClaw 外掛 API 或更高的最低主機版本，OpenClaw 會檢查較舊的穩定版本，並改為安裝最新的相容版本。確切版本與明確的 dist-tag 仍會嚴格處理：不相容的選擇將失敗，並要求您升級 OpenClaw 或選擇相容版本。

    如果裸安裝規格符合官方外掛 ID（例如 `diffs`），OpenClaw 會直接安裝目錄項目。若要安裝同名 npm 套件，請使用明確的作用域規格（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 儲存庫">
    使用 `git:<repo>` 直接從 Git 儲存庫安裝。支援的形式包括：`git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` 複製 URL。加入 `@<ref>` 或 `#<ref>`，即可在安裝前簽出分支、標籤或提交。

    Git 安裝會將儲存庫複製到暫存目錄，在指定參照時簽出該參照，然後使用一般的外掛目錄安裝程式，因此資訊清單驗證、操作員安裝政策、套件管理器安裝工作與安裝記錄的行為都與 npm 安裝相同。記錄的 Git 安裝會包含來源 URL/參照及解析後的提交，讓 `openclaw plugins update` 日後可以重新解析來源。

    從 Git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證執行階段註冊項目，例如閘道方法與命令列介面命令。如果外掛透過 `api.registerCli` 註冊了命令列介面根命令，請直接經由 OpenClaw 根命令列介面執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 外掛封存檔必須在解壓縮後的外掛根目錄包含有效的 `openclaw.plugin.json`；僅包含 `package.json` 的封存檔，會在 OpenClaw 寫入安裝記錄前遭拒絕。

    當檔案是 npm-pack tarball，且您希望使用與登錄檔安裝相同的
    每個外掛受管理 npm 專案路徑時，請使用 `npm-pack:<path.tgz>`；
    這包括 `package-lock.json` 驗證、提升安裝的依賴項掃描，
    以及 npm 安裝記錄。一般封存檔路徑仍會以本機
    封存檔形式安裝到外掛擴充功能根目錄下。

    也支援 Claude 市集安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

啟動切換期間，符合 npm 安全命名規則的裸外掛規格預設會從 npm 安裝，除非其符合官方外掛 ID：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 明確指定僅由 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查宣告的外掛 API／最低閘道相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載具版本的 npm-pack `.tgz`、驗證 ClawHub 摘要標頭與成品摘要，然後透過一般封存檔路徑進行安裝。沒有 ClawPack 中繼資料的較舊 ClawHub 版本，仍會透過舊版套件封存檔驗證路徑安裝。記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm 完整性值、npm shasum、tarball 名稱與 ClawPack 摘要資訊，以供日後更新使用。
未指定版本的 ClawHub 安裝會保留未指定版本的記錄規格，使 `openclaw plugins update` 可以追蹤較新的 ClawHub 發行版本；明確的版本或標籤選擇器（例如 `clawhub:pkg@1.2.3` 與 `clawhub:pkg@beta`）則會維持鎖定至該選擇器。

### 市集簡寫

當市集名稱存在於 Claude 的本機登錄快取 `~/.claude/plugins/known_marketplaces.json` 中時，使用 `plugin@marketplace` 簡寫：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

使用 `--marketplace` 明確傳入市集來源：

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
    - Git URL

  </Tab>
  <Tab title="遠端市集規則">
    對於從 GitHub 或 Git 載入的遠端市集，外掛項目必須位於複製的市集儲存庫內。OpenClaw 接受來自該儲存庫的相對路徑來源，並拒絕遠端資訊清單中的 HTTP(S)、絕對路徑、Git、GitHub，以及其他非路徑外掛來源。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw 外掛（`openclaw.plugin.json`）
- 與 Codex 相容的套件組合（`.codex-plugin/plugin.json`）
- 與 Claude 相容的套件組合（`.claude-plugin/plugin.json`，或在缺少該資訊清單檔案時使用預設 Claude 元件配置）
- 與 Cursor 相容的套件組合（`.cursor-plugin/plugin.json`）

受管理的本機安裝必須是外掛目錄或封存檔。獨立的 `.js`、
`.mjs`、`.cjs` 與 `.ts` 外掛檔案不會由 `plugins install` 複製到受管理的外掛
根目錄，也不會因直接放置於
`~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 而載入；這些
自動探索的根目錄會載入外掛套件或套件組合目錄，並略過作為本機輔助工具的
頂層指令碼檔案。請改在
`plugins.load.paths` 中明確列出獨立檔案。

<Note>
相容的套件組合會安裝到一般外掛根目錄，並參與相同的列出／資訊／啟用／停用流程。目前支援套件組合 Skills、Claude 命令 Skills、Claude `settings.json` 預設值、Claude `.lsp.json`／資訊清單宣告的 `lspServers` 預設值、Cursor 命令 Skills，以及相容的 Codex 掛鉤目錄；其他偵測到的套件組合功能會顯示於診斷／資訊中，但尚未接入執行階段執行流程。
</Note>

使用 `-l`/`--link` 指向本機外掛目錄而不進行複製（會加入
`plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--link` 不支援搭配 `--force`（連結的外掛會直接指向來源
路徑，因此沒有可就地覆寫的內容）、`--marketplace` 或
`git:` 安裝，且需要已存在的本機路徑。

<Note>
從工作區擴充功能根目錄探索到的工作區來源外掛，在明確啟用前不會
匯入或執行。進行本機開發時，請執行 `openclaw plugins enable <plugin-id>` 或設定
`plugins.entries.<plugin-id>.enabled: true`；如果您的設定使用
`plugins.allow`，也請在其中加入相同的外掛 ID。此預設拒絕規則
也適用於頻道設定明確以工作區來源外掛為目標、僅為設定而載入的情況；
只要該工作區外掛仍處於停用狀態或被排除於允許清單之外，本機頻道外掛
設定程式碼就不會執行。連結安裝與明確的 `plugins.load.paths` 項目，
會依其解析後的外掛來源遵循一般政策。請參閱
[設定外掛政策](/zh-TW/tools/plugin#configure-plugin-policy)
與[設定參考](/zh-TW/gateway/configuration-reference#plugins)。

在 npm 安裝中使用 `--pin`，可將解析後的確切規格（`name@version`）儲存至受管理的外掛索引，同時維持預設不鎖定的行為。
</Note>

## 列出

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  僅顯示已啟用的外掛。
</ParamField>
<ParamField path="--verbose" type="boolean">
  從表格檢視切換為每個外掛的詳細資料行，其中包含格式／來源／出處／版本／啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清單，以及登錄檔診斷與套件依賴項安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久保存的本機外掛登錄檔；當登錄檔遺失或無效時，則退回僅由資訊清單推導的結果。它適合用來檢查外掛是否已安裝、已啟用，以及是否可供冷啟動規劃看見，但並不是對已執行中閘道程序的即時執行階段探查。變更外掛程式碼、啟用狀態、掛鉤政策或 `plugins.load.paths` 後，請重新啟動為該頻道提供服務的閘道，再期待新的 `register(api)` 程式碼或掛鉤執行。對於遠端／容器部署，請確認您重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝程序。

`plugins list --json` 會包含每個外掛根據 `package.json`
`dependencies` 與 `optionalDependencies` 得出的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於外掛的一般 Node `node_modules` 查找路徑中；它
不會匯入外掛執行階段程式碼、執行套件管理器，或修復遺失的
依賴項。
</Note>

如果啟動記錄顯示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，
請執行 `openclaw plugins list --enabled --verbose`，或使用列出的外掛 ID 執行
`openclaw plugins inspect <id>`，以確認外掛
ID，並將受信任的 ID 複製到 `openclaw.json` 的 `plugins.allow` 中。當
警告能列出所有探索到的外掛時，它會印出可直接貼上的
`plugins.allow` 程式碼片段，其中已包含這些 ID。如果外掛在沒有
安裝／載入路徑來源資訊的情況下載入，請檢查該外掛 ID，然後將
受信任的 ID 鎖定於 `plugins.allow`，或從受信任的來源重新安裝外掛，
讓 OpenClaw 記錄安裝來源資訊。

在封裝的 Docker 映像檔中處理內建外掛時，請將外掛
來源目錄繫結掛載到相符的封裝來源路徑，例如
`/app/extensions/synology-chat`。OpenClaw 會優先於
`/app/dist/extensions/synology-chat` 探索該掛載的來源覆蓋層；單純複製的來源目錄
仍不會生效，因此一般封裝安裝仍會使用已編譯的 dist。

對執行階段掛鉤進行偵錯時：

- `openclaw plugins inspect <id> --runtime --json` 會顯示透過模組載入檢查流程所註冊的鉤子與診斷資訊。執行階段檢查絕不會安裝相依套件；請使用 `openclaw doctor --fix` 清理舊版相依套件狀態，或復原設定中所引用但缺少且可下載的外掛。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的閘道 URL／設定檔、服務／程序提示、設定路徑與 RPC 健康狀態。
- 非內建的對話鉤子（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要設定 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

### 外掛索引

外掛安裝中繼資料是由系統管理的狀態，而非使用者設定。安裝與更新會將其寫入有效 OpenClaw 狀態目錄下的共用 SQLite 狀態資料庫。`installed_plugin_index` 資料列會儲存持久性的 `installRecords` 中繼資料，包括外掛資訊清單損壞或遺失時的記錄，以及從資訊清單衍生的冷啟動登錄快取；此快取供 `openclaw plugins update`、解除安裝、診斷及冷啟動外掛登錄使用。

當 OpenClaw 在設定中發現已發布的舊版 `plugins.installs` 記錄時，執行階段會將其視為相容性輸入讀取，而不改寫 `openclaw.json`。明確的外掛寫入操作與 `openclaw doctor --fix` 會將這些記錄移入外掛索引，並在允許寫入設定時移除該設定鍵；若任一寫入失敗，則會保留設定記錄，以免遺失安裝中繼資料。

## 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` 會從 `plugins.entries`、持久化外掛索引、外掛允許／拒絕清單項目，以及適用時已連結的 `plugins.load.paths` 項目中移除外掛記錄。除非設定 `--keep-files`，解除安裝也會移除受追蹤的託管安裝目錄，但僅限該目錄解析後位於 OpenClaw 的外掛擴充功能根目錄內。如果此外掛目前占用 `memory` 或 `contextEngine` 插槽，該插槽會重設為其預設值（記憶體為 `memory-core`，上下文引擎為 `legacy`）。

`uninstall` 會先列印即將移除內容的預覽，接著在變更前提示「要解除安裝外掛「<id>」嗎？」。傳入 `--force` 可跳過確認提示（適用於指令碼與非互動式執行）；若未傳入，解除安裝需要互動式 TTY。`--dry-run` 會列印相同預覽，然後直接結束，不顯示提示也不進行任何變更。

<Note>
支援使用 `--keep-config` 作為 `--keep-files` 的已棄用別名。
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

更新會套用至託管外掛索引中受追蹤的外掛安裝項目，以及 `hooks.internal.installs` 中受追蹤的鉤子套件安裝項目。

<AccordionGroup>
  <Accordion title="解析外掛 ID 與 npm 規格">
    傳入外掛 ID 時，OpenClaw 會重複使用為該外掛記錄的安裝規格。這表示先前儲存的 `@beta` 等發行標籤及精確鎖定版本，在後續執行 `update <id>` 時仍會繼續使用。

    執行 `update <id> --dry-run` 時，精確鎖定的 npm 安裝項目會維持鎖定。如果 OpenClaw 也能解析套件的登錄預設版本線，且該預設版本線比已安裝的鎖定版本更新，試執行會回報此版本鎖定，並列印明確的 `@latest` 套件更新命令，以改為跟隨登錄的預設版本線。

    這項定向更新規則與批次 `openclaw plugins update --all` 維護路徑不同。批次更新仍會遵循一般受追蹤的安裝規格，但受信任的官方 OpenClaw 外掛記錄可同步至目前官方目錄中的目標版本，而非停留在過時的精確官方套件版本。若您刻意希望精確或帶標籤的官方規格保持不變，請使用定向的 `update <id>`。

    對於 npm 安裝，您也可以傳入含有發行標籤或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回受追蹤的外掛記錄、更新該已安裝外掛，並記錄新的 npm 規格，供未來透過 ID 更新時使用。

    傳入未包含版本或標籤的 npm 套件名稱，也會解析回受追蹤的外掛記錄。若外掛已鎖定至精確版本，而您想將其移回登錄的預設發行版本線，請使用此方式。

  </Accordion>
  <Accordion title="Beta 頻道更新">
    定向的 `openclaw plugins update <id-or-npm-spec>` 會重複使用受追蹤的外掛規格，除非您傳入新規格。批次 `openclaw plugins update --all` 在將受信任的官方外掛記錄同步至官方目錄目標時，會使用已設定的 `update.channel`，因此 Beta 頻道安裝可維持在 Beta 發行版本線，而不會在未告知的情況下正規化為穩定版／最新版。

    `openclaw update` 也會識別目前有效的 OpenClaw 更新頻道：在 Beta 頻道上，採用預設版本線的 npm 與 ClawHub 外掛記錄會先嘗試 `@beta`。如果不存在外掛的 Beta 版本，則會回退至已記錄的預設／最新規格；若 Beta 套件存在但未通過安裝驗證，npm 外掛也會回退。這項回退會以警告回報，且不會導致核心更新失敗。對於定向更新，精確版本及明確標籤會持續鎖定至該選擇器。

  </Accordion>
  <Accordion title="版本檢查與完整性偏移">
    在實際執行 npm 更新前，OpenClaw 會對照 npm 登錄中繼資料檢查已安裝的套件版本。如果已安裝版本及已記錄的成品識別資訊已與解析出的目標相符，便會跳過更新，不進行下載、重新安裝或改寫 `openclaw.json`。

    若存在已儲存的完整性雜湊，而擷取到的成品雜湊有所變更，OpenClaw 會將其視為 npm 成品偏移。互動式 `openclaw plugins update` 命令會列印預期與實際雜湊，並在繼續前要求確認。非互動式更新輔助工具預設會採取封閉式失敗，除非呼叫端提供明確的繼續執行政策。

  </Accordion>
  <Accordion title="更新時使用 --dangerously-force-unsafe-install">
    為了相容性，`plugins update` 也接受 `--dangerously-force-unsafe-install`，但此旗標已棄用，且不再變更外掛更新行為。操作者的 `security.installPolicy` 仍可封鎖更新；外掛的 `before_install` 鉤子僅會在已載入外掛鉤子的程序中套用。
  </Accordion>
  <Accordion title="更新時使用 --acknowledge-clawhub-risk">
    由社群 ClawHub 支援的外掛在更新時，會先執行與安裝相同的精確發行版本信任檢查，再下載替代套件。若經過審查的自動化作業應在選定 ClawHub 發行版本出現高風險信任警告時繼續執行，請使用 `--acknowledge-clawhub-risk`。官方 ClawHub 套件與內建 OpenClaw 外掛來源會略過此發行版本信任提示。
  </Accordion>
</AccordionGroup>

## 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

預設情況下，檢查功能無須匯入外掛執行階段，即可顯示識別資訊、載入狀態、來源、資訊清單能力、政策旗標、診斷資訊、安裝中繼資料、套件能力，以及偵測到的任何 MCP 或 LSP 伺服器支援。JSON 輸出包含外掛資訊清單合約，例如 `contracts.agentToolResultMiddleware` 與 `contracts.trustedToolPolicies`，讓操作者能在啟用或重新啟動外掛前稽核受信任介面的宣告。加入 `--runtime` 可載入外掛模組，並包含已註冊的鉤子、工具、命令、服務、閘道方法及 HTTP 路由。執行階段檢查會直接回報缺少的外掛相依套件；安裝與修復仍由 `openclaw plugins install`、`openclaw plugins update` 及 `openclaw doctor --fix` 負責。

外掛擁有的命令列介面命令通常會安裝為根層級的 `openclaw` 命令群組，但外掛也可以在 `openclaw nodes` 等核心父命令下註冊巢狀命令。當 `inspect --runtime` 在 `cliCommands` 下顯示命令後，請依列出的路徑執行；例如，註冊 `demo-git` 的外掛可透過 `openclaw demo-git ping` 驗證。

系統會依各外掛在執行階段實際註冊的內容進行分類：

| 形態                | 含義                                                               |
| ------------------- | ------------------------------------------------------------------ |
| `plain-capability`  | 恰好一種能力類型（例如僅提供供應商功能的外掛）                     |
| `hybrid-capability` | 超過一種能力類型（例如文字 + 語音 + 圖像）                          |
| `hook-only`         | 僅有鉤子，沒有能力、工具、命令、服務或路由                           |
| `non-capability`    | 具有工具／命令／服務，但沒有能力                                    |

如需進一步瞭解能力模型，請參閱[外掛形態](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適用於指令碼與稽核的機器可讀報告。`inspect --all` 會呈現涵蓋所有外掛的表格，其中包含形態、能力種類、相容性通知、套件能力及鉤子摘要欄。`info` 是 `inspect` 的別名。
</Note>

## 診斷

```bash
openclaw plugins doctor
```

`doctor` 會回報外掛載入錯誤、資訊清單／探索診斷、相容性通知，以及外掛插槽缺失等過時的外掛設定參照。當安裝樹與外掛設定均無問題時，會列印「未偵測到外掛問題。」如果仍有過時設定，但安裝樹在其他方面運作正常，摘要會明確指出此狀況，而不會暗示外掛完全健康。

如果設定的外掛存在於磁碟上，但遭載入器的路徑安全檢查封鎖，設定驗證會保留外掛項目，並將其回報為「存在但遭封鎖」。請修正前面的外掛封鎖診斷，例如路徑擁有權或所有人皆可寫入的權限，而非移除 `plugins.entries.<id>` 或 `plugins.allow` 設定。

若發生缺少 `register`／`activate` 匯出等模組形態失敗，請設定 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 後重新執行，以在診斷輸出中包含精簡的匯出形態摘要。

## 登錄

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機外掛登錄是 OpenClaw 的持久化冷讀取模型，用於保存已安裝外掛的識別資訊、啟用狀態、來源中繼資料及貢獻內容擁有權。一般啟動、供應商擁有者查詢、頻道設定分類及外掛清查均可讀取該登錄，而無須匯入外掛執行階段模組。

使用 `plugins registry` 檢查持久化登錄是否存在、是否為最新或是否已過時。使用 `--refresh` 可根據持久化外掛索引、設定政策及資訊清單／套件中繼資料重建登錄。這是修復路徑，而非執行階段啟用路徑。

`openclaw doctor --fix` 也會修復登錄鄰近的託管 npm 偏移：如果託管外掛 npm 專案下，或舊版扁平託管 npm 根目錄下的孤立或已復原 `@openclaw/*` 套件遮蔽了內建外掛，診斷工具會移除該過時套件並重建登錄，讓啟動流程依據內建資訊清單進行驗證。診斷工具也會將主機的 `openclaw` 套件重新連結至宣告 `peerDependencies.openclaw` 的託管 npm 外掛，使 `openclaw/plugin-sdk/*` 等套件本機執行階段匯入可在更新或 npm 修復後正常解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的緊急相容性開關，適用於登錄讀取失敗的情況。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；此環境變數回退僅供遷移推出期間的緊急啟動復原使用。
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

`plugins marketplace entries` 會列出已設定的 OpenClaw 市集摘要來源中的項目。預設會嘗試使用託管摘要來源，若無法使用，則改用最新已接受的快照或內建資料。使用 `--feed-profile <name>` 可讀取特定的已設定設定檔，使用 `--feed-url <url>` 可讀取明確指定的託管摘要來源 URL，而使用 `--offline` 則可在不擷取摘要來源的情況下讀取最新已接受的快照。

`plugins marketplace refresh` 會重新整理已設定的託管摘要來源快照，並回報 OpenClaw 接受的是託管資料、託管快照，還是內建的備援資料。當呼叫端要求除非最新的託管承載內容符合固定的總和檢查碼，否則命令必須失敗時，請使用 `--expected-sha256`。

市集的 `list` 接受本機市集路徑、`marketplace.json` 路徑、如 `owner/repo` 的 GitHub 簡寫、GitHub 儲存庫 URL 或 Git URL。`--json` 會輸出解析後的來源標籤，以及剖析完成的市集資訊清單與外掛項目。

市集重新整理會載入託管的 OpenClaw 市集摘要來源，並將經驗證的回應持久化為本機託管摘要來源快照。若未指定選項，則使用已設定的預設摘要來源設定檔。使用 `--feed-profile <name>` 可重新整理特定的已設定設定檔，使用 `--feed-url <url>` 可重新整理明確指定的託管摘要來源 URL，使用 `--expected-sha256 <sha256>` 可要求承載內容的總和檢查碼相符（`sha256:<hex>` 或不含前綴的 64 字元十六進位摘要），而使用 `--json` 則可取得機器可讀的輸出。明確指定的託管摘要來源 URL 不得包含認證資訊、查詢字串或片段。未固定總和檢查碼的重新整理可以回報託管快照或內建備援結果，而不會使命令失敗。固定總和檢查碼的重新整理，除非接受最新的託管承載內容，否則會失敗；若 OpenClaw 無法持久化經驗證的快照，成功取得託管資料的重新整理也會失敗。

## 相關內容

- [建置外掛](/zh-TW/plugins/building-plugins)
- [命令列介面參考](/zh-TW/cli)
- [ClawHub](/clawhub)
