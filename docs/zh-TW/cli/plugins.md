---
read_when:
    - 你想要安裝或管理閘道外掛或相容套件組合
    - 你想要建立或驗證一個簡單的工具外掛框架
    - 你想要偵錯外掛載入失敗問題
sidebarTitle: Plugins
summary: '`openclaw plugins` 的命令列介面參考（初始化、建置、驗證、列出、安裝、市集、解除安裝、啟用／停用、診斷）'
title: 外掛
x-i18n:
    generated_at: "2026-07-16T11:28:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

管理閘道外掛、鉤子套件及相容套件組合。

<CardGroup cols={2}>
  <Card title="外掛系統" href="/zh-TW/tools/plugin">
    安裝、啟用及疑難排解外掛的終端使用者指南。
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
    外掛安裝的安全性強化。
  </Card>
</CardGroup>

## 命令

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # inspect 的別名
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

若要調查緩慢的安裝、檢查、解除安裝或登錄庫重新整理，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行命令。追蹤會將各階段的計時寫入 stderr，並讓 JSON 輸出維持可剖析狀態。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，`openclaw.json` 不可變更。`install`、`update`、`uninstall`、`enable` 及 `disable` 均會拒絕執行。請改為編輯此安裝的 Nix 來源（nix-openclaw 請使用 `programs.openclaw.config` 或 `instances.<name>.config`），然後重新建置。請參閱以代理程式為優先的[快速入門](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
隨附外掛會與 OpenClaw 一併提供。部分外掛預設啟用（例如隨附的模型提供者、語音提供者及瀏覽器外掛）；其他外掛則需要 `plugins enable`。

原生 OpenClaw 外掛會提供 `openclaw.plugin.json`，其中包含內嵌的 JSON Schema（`configSchema`，即使內容為空亦同）。相容套件組合則使用各自的套件組合資訊清單。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細的清單／資訊輸出也會顯示套件組合子類型（`codex`、`claude` 或 `cursor`），以及偵測到的套件組合功能。
</Note>

## 編寫

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 預設會建立最小型的 TypeScript 工具外掛。第一個引數是外掛 ID；`--name` 用於設定顯示名稱。OpenClaw 使用該 ID 作為預設輸出目錄及套件命名。工具鷹架使用 `defineToolPlugin`，並產生 `package.json` 指令碼 `plugin:build` 和 `plugin:validate`；這些指令碼會先建置，再呼叫 `openclaw plugins build`/`validate`。

`plugins build` 會匯入已建置的進入點、讀取其靜態工具中繼資料、寫入 `openclaw.plugin.json`，並讓 `package.json` 的 `openclaw.extensions` 保持一致。`plugins validate` 會檢查產生的資訊清單、套件中繼資料及目前的進入點匯出是否仍然一致。完整的編寫工作流程請參閱[工具外掛](/zh-TW/plugins/tool-plugins)。

鷹架會寫入 TypeScript 原始碼，但會從建置後的 `./dist/index.js` 進入點產生中繼資料，因此此工作流程也適用於已發布的命令列介面。當進入點不是預設套件進入點時，請使用 `--entry <path>`。在 CI 中，請使用 `plugins build --check`，以便在產生的中繼資料過期時失敗，而不重寫檔案。

### 提供者鷹架

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

提供者鷹架會建立通用且與 OpenAI 相容的模型提供者外掛，其中包含 API 金鑰驗證管線、執行 `clawhub package validate` 的 `npm run validate` 指令碼、ClawHub 套件中繼資料，以及供日後透過 GitHub OIDC 進行受信任發布的手動觸發 GitHub Actions 工作流程。提供者鷹架不會產生 Skills，也不使用 `openclaw plugins build`/`validate`；這些命令用於工具鷹架的產生中繼資料路徑。

發布前，請以真實的提供者詳細資料取代預留位置 API 基底 URL、模型目錄、文件路由、認證資訊文字及 README 內容。首次發布至 ClawHub 及設定受信任發布者時，請使用產生的 README。

## 安裝

```bash
openclaw plugins search "calendar"                      # 搜尋 ClawHub 外掛
openclaw plugins install @openclaw/<package>            # 受信任的官方目錄
openclaw plugins install <package>                       # 任意 npm 套件
openclaw plugins install clawhub:<package>                # 僅限 ClawHub
openclaw plugins install npm:<package>                    # 僅限 npm
openclaw plugins install npm-pack:<path.tgz>               # 本機 npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git 儲存庫
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # 本機路徑或封存檔
openclaw plugins install -l <path>                         # 連結而非複製
openclaw plugins install <plugin>@<marketplace>             # 市集簡寫
openclaw plugins install <plugin> --marketplace <name>      # 市集（明確指定）
openclaw plugins install <package> --force                  # 確認來源／覆寫現有項目
openclaw plugins install <package> --pin                    # 釘選解析出的 npm 版本
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

測試設定階段安裝的維護者，可以使用受保護的環境變數覆寫自動外掛安裝來源。請參閱[外掛安裝覆寫](/zh-TW/plugins/install-overrides)。

<Warning>
在啟動切換期間，單純的套件名稱預設會從 npm 安裝；但若名稱符合隨附或官方外掛 ID，OpenClaw 會改用該本機／官方副本，而不存取 npm 登錄庫。若刻意要使用外部 npm 套件，請改用 `npm:<package>`。若要使用 ClawHub，請使用 `clawhub:<package>`。請將安裝外掛視同執行程式碼；優先使用釘選版本。
</Warning>

<Warning>
ClawHub 套件及 OpenClaw 的隨附／官方目錄是受信任的安裝來源。新的任意 npm、`npm-pack:`、git、本機路徑／封存檔或市集來源，會顯示警告並在繼續前要求確認。非互動式任意來源安裝必須在檢閱並信任來源後傳入 `--force`。必要時，同一旗標也會覆寫現有的安裝目標。對已追蹤安裝進行一般更新時不需要此旗標。此確認與 `--acknowledge-clawhub-risk` 不同，後者僅適用於有風險的 ClawHub 發行信任警告。`--force` 不會略過 `security.installPolicy` 或其餘的安裝安全檢查。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 `code-plugin` 和 `bundle-plugin` 套件（不包含 Skills；請使用 `openclaw skills search` 搜尋 Skills）。`--limit` 預設為 20，上限為 100。此命令只會讀取遠端目錄：不會檢查本機狀態、變更設定、安裝套件或載入外掛執行階段。結果包含 ClawHub 套件名稱、系列、頻道、版本、摘要，以及 `openclaw plugins install clawhub:<package>` 等安裝提示。

<Note>
ClawHub 是大多數外掛的主要散布與探索介面。Npm 仍是受支援的備援方案與直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` 外掛套件已重新發布至 npm；目前清單請參閱 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或[外掛清冊](/zh-TW/plugins/plugin-inventory)。穩定版安裝使用 `latest`。Beta 頻道的安裝與更新會優先使用 npm 的 `beta` dist-tag（若有），否則退回 `latest`。在延伸穩定頻道上，具有單純／預設或 `latest` 意圖的官方 npm 外掛，會解析為與已安裝核心完全相同的版本。確切釘選、明確指定的非 `latest` 標籤、第三方套件及非 npm 來源不會被重寫。
</Note>

<AccordionGroup>
  <Accordion title="設定引入與無效設定修復">
    如果你的 `plugins` 區段由單一檔案的 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會直接寫入該引入檔案，並保持 `openclaw.json` 不變。根層級引入、引入陣列，以及含有同層覆寫的引入會採取失敗關閉，而不是攤平內容。支援的結構請參閱[設定引入](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會採取失敗關閉，並要求你先執行 `openclaw doctor --fix`。在閘道啟動及熱重新載入期間，無效的外掛設定會像其他無效設定一樣採取失敗關閉；`openclaw doctor --fix` 可隔離無效的外掛項目。唯一有文件記載的安裝階段例外，是針對明確選擇採用 `openclaw.install.allowInvalidConfigRecovery` 的外掛所提供之有限隨附外掛復原路徑。

  </Accordion>
  <Accordion title="--force 確認及重新安裝與更新的差異">
    `--force` 會在不提示的情況下確認非 ClawHub 來源。它不會略過 `security.installPolicy` 或其餘的安裝安全檢查。當外掛或鉤子套件已安裝時，它也會重複使用現有目標並就地覆寫。請在檢閱任意 npm、本機、封存檔、git 或市集來源後，或刻意重新安裝相同 ID 時使用此旗標。若要例行升級已追蹤的 npm 外掛，請優先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你針對已安裝的外掛 ID 執行 `plugins install`，OpenClaw 會停止，並引導你使用 `plugins update <id-or-npm-spec>` 進行一般升級；若確實要從不同來源覆寫目前的安裝，則引導你使用 `plugins install <package> --force`。任意來源仍會顯示互動式來源警告；非互動式安裝必須在檢閱後傳入 `--force`。受信任的 ClawHub 及 OpenClaw 目錄來源不需要此旗標。搭配 `--link` 時，`--force` 會確認來源，但不會變更連結路徑安裝模式。

  </Accordion>
  <Accordion title="--pin 的適用範圍">
    `--pin` 僅適用於 npm 安裝，並會記錄解析出的確切 `<name>@<version>`。此選項不支援 `git:` 安裝（請改在規格中釘選參照，例如 `git:github.com/acme/plugin@v1.2.3`），也不支援 `--marketplace`（市集安裝會保存市集來源中繼資料，而非 npm 規格）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已淘汰，目前不執行任何操作。OpenClaw 不再於外掛安裝期間執行內建的危險程式碼阻擋。

    當需要主機特定的安裝政策時，請使用由操作者擁有的 `security.installPolicy` 介面。外掛 `before_install` 鉤子是外掛執行階段生命週期鉤子，而不是命令列介面安裝的主要政策邊界。

    如果你發佈在 ClawHub 上的外掛遭登錄檔掃描隱藏或封鎖，請使用 [ClawHub 發佈](/zh-TW/clawhub/publishing)中的發佈者步驟。`--dangerously-force-unsafe-install` 不會要求 ClawHub 重新掃描外掛，也不會將遭封鎖的版本設為公開。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    社群 ClawHub 安裝會在下載前檢查所選版本的信任記錄。如果 ClawHub 停用該版本的下載、回報惡意掃描結果，或將版本置於阻擋性的審核狀態（已隔離、已撤銷），無論是否使用此旗標，OpenClaw 都會直接拒絕。對於不具阻擋性的高風險掃描狀態或審核狀態，OpenClaw 會顯示信任詳細資料，並在繼續前要求確認。

    請僅在檢閱 ClawHub 警告並決定不經互動式提示繼續後，才使用 `--acknowledge-clawhub-risk`。待處理或過期（尚未確認為安全）的掃描結果會顯示警告，但不要求確認。官方 ClawHub 套件和隨附的 OpenClaw 外掛來源會完全略過此版本信任檢查。

  </Accordion>
  <Accordion title="鉤子套件與 npm 規格">
    `plugins install` 也是在 `package.json` 中公開 `openclaw.hooks` 的鉤子套件安裝介面。請使用 `openclaw hooks` 篩選可見鉤子及個別啟用鉤子，而非安裝套件。

    Npm 規格**僅限登錄檔**（套件名稱加上選用的**確切版本**或 **dist-tag**）。Git／URL／檔案規格和 semver 範圍都會遭拒。為確保安全，即使你的 shell 設有全域 npm 安裝設定，相依套件安裝仍會在每個外掛各自的受管理 npm 專案中使用 `--ignore-scripts` 執行。受管理的外掛 npm 專案會繼承 OpenClaw 套件層級的 npm `overrides`，因此主機安全性固定版本也會套用至提升層級的外掛相依套件。

    請使用 `npm:<package>` 明確指定 npm 解析。除非符合官方外掛 ID，否則純套件規格在啟動切換期間也會直接從 npm 安裝。

    符合隨附外掛的原始 `@openclaw/*` 規格，會先解析至映像檔擁有的隨附副本，再回退至 npm。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 會使用目前 OpenClaw 組建隨附的 Discord 外掛，而不會建立受管理的 npm 覆寫。若要強制使用外部 npm 套件，請使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    純規格與 `@latest` 會維持在穩定版本軌道。OpenClaw 的日期戳記修正版（例如 `2026.5.3-1`）在此檢查中視為穩定版本。如果 npm 將其中任一形式解析為預發行版本，OpenClaw 會停止，並要求你使用預發行標籤（`@beta`/`@rc`）或確切的預發行版本（`@1.2.3-beta.4`）明確選擇加入。

    對於未指定確切版本的 npm 安裝（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 會在安裝前檢查解析出的套件中繼資料。如果最新的穩定套件需要較新的 OpenClaw 外掛 API 或較高的最低主機版本，OpenClaw 會檢查較舊的穩定版本，並改為安裝最新的相容版本。確切版本和明確的 dist-tag 仍採嚴格處理：不相容的選擇會失敗，並要求你升級 OpenClaw 或選擇相容版本。

    如果純安裝規格符合官方外掛 ID（例如 `diffs`），OpenClaw 會直接安裝目錄項目。若要安裝同名 npm 套件，請使用明確的範圍規格（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 儲存庫">
    使用 `git:<repo>` 可直接從 git 儲存庫安裝。支援的形式：`git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` 複製 URL。加入 `@<ref>` 或 `#<ref>`，即可在安裝前簽出分支、標籤或提交。

    Git 安裝會複製至暫存目錄，在指定參照存在時將其簽出，然後使用一般的外掛目錄安裝程式，因此資訊清單驗證、操作者安裝政策、套件管理器安裝作業和安裝記錄的行為都與 npm 安裝相同。記錄的 git 安裝包含來源 URL／參照和解析出的提交，因此 `openclaw plugins update` 稍後可重新解析來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證執行階段註冊，例如閘道方法和命令列介面命令。如果外掛使用 `api.registerCli` 註冊了命令列介面根命令，請直接透過 OpenClaw 根命令列介面執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 外掛封存檔必須在解壓縮後的外掛根目錄包含有效的 `openclaw.plugin.json`；僅包含 `package.json` 的封存檔，會在 OpenClaw 寫入安裝記錄前遭拒。

    當檔案是 npm-pack tarball，且你想使用與登錄檔安裝相同的
    個別外掛受管理 npm 專案路徑時，請使用 `npm-pack:<path.tgz>`，
    其中包括 `package-lock.json` 驗證、提升層級的相依套件掃描，
    以及 npm 安裝記錄。一般封存檔路徑仍會安裝為外掛 extensions
    根目錄下的本機封存檔。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在啟動切換期間，符合 npm 安全命名規則的純外掛規格預設會從 npm 安裝，除非其符合官方外掛 ID：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可明確指定僅限 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查宣告的外掛 API／最低閘道相容性。當選取的 ClawHub 版本發佈 ClawPack 成品時，OpenClaw 會下載帶版本的 npm-pack `.tgz`、驗證 ClawHub 摘要標頭和成品摘要，然後透過一般封存檔路徑進行安裝。沒有 ClawPack 中繼資料的舊版 ClawHub 版本，仍會透過舊版套件封存檔驗證路徑安裝。記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm 完整性值、npm shasum、tarball 名稱，以及 ClawPack 摘要資訊，以供後續更新使用。
未指定版本的 ClawHub 安裝會保留未指定版本的記錄規格，讓 `openclaw plugins update` 能跟隨較新的 ClawHub 版本；明確的版本或標籤選擇器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）則會固定於該選擇器。

### Marketplace 簡寫

當 marketplace 名稱存在於 Claude 的本機登錄檔快取 `~/.claude/plugins/known_marketplaces.json` 中時，請使用 `plugin@marketplace` 簡寫：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

使用 `--marketplace` 可明確傳入 marketplace 來源：

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
    - GitHub 儲存庫簡寫，例如 `owner/repo`
    - GitHub 儲存庫 URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="遠端 marketplace 規則">
    對於從 GitHub 或 git 載入的遠端 marketplace，外掛項目必須位於複製的 marketplace 儲存庫內。OpenClaw 接受來自該儲存庫的相對路徑來源，並拒絕遠端資訊清單中的 HTTP(S)、絕對路徑、git、GitHub 和其他非路徑外掛來源。
  </Tab>
</Tabs>

對於本機路徑和封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw 外掛（`openclaw.plugin.json`）
- 相容於 Codex 的套件組合（`.codex-plugin/plugin.json`）
- 相容於 Claude 的套件組合（`.claude-plugin/plugin.json`，或該資訊清單檔案不存在時的預設 Claude 元件配置）
- 相容於 Cursor 的套件組合（`.cursor-plugin/plugin.json`）

受管理的本機安裝必須是外掛目錄或封存檔。獨立的 `.js`、
`.mjs`、`.cjs` 和 `.ts` 外掛檔案不會由
`plugins install` 複製到受管理的外掛根目錄，也不會因直接放置於
`~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 而載入；這些
自動探索根目錄會載入外掛套件或套件組合目錄，並將頂層指令碼檔案略過為
本機輔助程式。請改為在 `plugins.load.paths` 中明確列出獨立檔案。

<Note>
相容的套件組合會安裝至一般外掛根目錄，並參與相同的清單／資訊／啟用／停用流程。目前支援套件組合 Skills、Claude 命令 Skills、Claude `settings.json` 預設值、Claude `.lsp.json`／資訊清單宣告的 `lspServers` 預設值、Cursor 命令 Skills，以及相容的 Codex 鉤子目錄；其他偵測到的套件組合功能會顯示在診斷／資訊中，但尚未連接至執行階段執行。
</Note>

使用 `-l`/`--link` 可指向本機外掛目錄而不進行複製（新增
至 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--link` 不支援搭配 `--marketplace` 或 `git:` 安裝，且
需要使用已存在的本機路徑。若要建立非互動式本機連結，請在檢閱來源後
傳入 `--force`；此選項會確認來源，但不會複製或覆寫連結的目錄。

<Note>
從工作區 extensions 根目錄探索到的工作區來源外掛，在明確啟用前不會
匯入或執行。進行本機開發時，請執行 `openclaw plugins enable <plugin-id>` 或設定
`plugins.entries.<plugin-id>.enabled: true`；如果你的設定使用
`plugins.allow`，也請在其中加入相同的外掛 ID。此失敗時關閉規則
也適用於頻道設定明確以工作區來源外掛為目標，僅供設定時載入的情況，
因此只要該工作區外掛仍為停用狀態或遭排除於允許清單之外，本機頻道外掛設定程式碼
就不會執行。連結安裝和明確的 `plugins.load.paths` 項目，會依其
解析出的外掛來源遵循一般政策。請參閱
[設定外掛政策](/zh-TW/tools/plugin#configure-plugin-policy)
和[設定參考](/zh-TW/gateway/configuration-reference#plugins)。

在 npm 安裝中使用 `--pin`，可將解析出的確切規格（`name@version`）儲存在受管理的外掛索引中，同時維持預設的不固定版本行為。
</Note>

## 清單

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
  從表格檢視切換為個別外掛的詳細資料行，其中包含格式／來源／起源／版本／啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清冊，以及登錄檔診斷和套件相依性安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取已持久儲存的本機外掛登錄；當登錄遺失或無效時，則改用僅從資訊清單衍生的備援。這適合用來檢查外掛是否已安裝、啟用，且可供冷啟動規劃看見，但不是對已在執行中的閘道處理程序進行即時執行階段探測。變更外掛程式碼、啟用狀態、鉤子原則或 `plugins.load.paths` 後，必須重新啟動為該頻道提供服務的閘道，新的 `register(api)` 程式碼或鉤子才會開始執行。對於遠端／容器部署，請確認重新啟動的是實際的 `openclaw gateway run` 子處理程序，而不只是包裝處理程序。

`plugins list --json` 包含每個外掛在 `package.json`
`dependencies` 和 `optionalDependencies` 中的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於外掛的一般節點 `node_modules` 查詢路徑中；它
不會匯入外掛執行階段程式碼、執行套件管理器或修復遺失的
相依套件。
</Note>

如果啟動記錄顯示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，
請使用列出的外掛 ID 執行 `openclaw plugins list --enabled --verbose` 或
`openclaw plugins inspect <id>`，以確認外掛
ID，並將受信任的 ID 複製到 `openclaw.json` 中的 `plugins.allow`。當
警告可以列出所有已探索到的外掛時，它會印出一段可直接貼上的
`plugins.allow`，其中已包含這些 ID。如果外掛載入時
沒有安裝／載入路徑來源資訊，請檢查該外掛 ID，然後將
受信任的 ID 固定於 `plugins.allow`，或從受信任的來源重新安裝外掛，
讓 OpenClaw 記錄安裝來源資訊。

若要在已封裝的 Docker 映像中處理內建外掛，請將外掛
原始碼目錄繫結掛載至對應的封裝原始碼路徑，例如
`/app/extensions/synology-chat`。OpenClaw 會在
`/app/dist/extensions/synology-chat` 之前探索到該掛載的原始碼覆疊；
單純複製的原始碼目錄不會生效，因此一般封裝安裝仍會使用已編譯的 dist。

若要偵錯執行階段鉤子：

- `openclaw plugins inspect <id> --runtime --json` 會顯示透過已載入模組的檢查階段所取得的已註冊鉤子與診斷資訊。執行階段檢查絕不會安裝相依套件；請使用 `openclaw doctor --fix` 清理舊版相依套件狀態，或復原設定所參照但遺失且可下載的外掛。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的閘道 URL／設定檔、服務／處理程序提示、設定路徑及 RPC 健康狀態。
- 非內建的對話鉤子（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

### 外掛索引

外掛安裝中繼資料是由機器管理的狀態，而不是使用者設定。安裝與更新會將其寫入作用中 OpenClaw 狀態目錄下的共用 SQLite 狀態資料庫。`installed_plugin_index` 資料列會儲存持久的 `installRecords` 中繼資料，包括損壞或遺失之外掛資訊清單的記錄，以及由資訊清單衍生的冷登錄快取，供 `openclaw plugins update`、解除安裝、診斷與冷外掛登錄使用。

當 OpenClaw 在設定中看到已發布的舊版 `plugins.installs` 記錄時，執行階段讀取會將其視為相容性輸入，而不會重寫 `openclaw.json`。明確的外掛寫入操作與 `openclaw doctor --fix` 會將這些記錄移入外掛索引，並在允許寫入設定時移除該設定鍵；如果任一寫入失敗，則會保留設定記錄，以免安裝中繼資料遺失。

## 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` 會從 `plugins.entries`、已持久儲存的外掛索引、外掛允許／拒絕清單項目，以及適用時連結的 `plugins.load.paths` 項目中移除外掛記錄。除非設定了 `--keep-files`，否則解除安裝也會移除受追蹤的受管理安裝目錄，但前提是該目錄解析後位於 OpenClaw 的外掛 extensions 根目錄內。如果該外掛目前占用 `memory` 或 `contextEngine` 插槽，該插槽會重設為其預設值（記憶體使用 `memory-core`，內容引擎使用 `legacy`）。

`uninstall` 會印出將移除項目的預覽，然後在進行變更前提示 `Uninstall plugin "<id>"?`。傳入 `--force` 可略過確認提示（適合指令碼與非互動式執行）；若未傳入，解除安裝需要互動式 TTY。`--dry-run` 會印出相同預覽，然後直接結束，不會提示或變更任何內容。

<Note>
`--keep-config` 是 `--keep-files` 的已棄用別名，仍受支援。
</Note>

## 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新適用於受管理外掛索引中受追蹤的外掛安裝，以及 `hooks.internal.installs` 中受追蹤的鉤子套件安裝。更新會重複使用使用者安裝外掛時已選擇的來源，因此不需要再次確認來源。

<AccordionGroup>
  <Accordion title="解析外掛 ID 與 npm 規格">
    傳入外掛 ID 時，OpenClaw 會重複使用該外掛已記錄的安裝規格。這表示先前儲存的 dist-tag（例如 `@beta`）與精確固定版本，在後續執行 `update <id>` 時仍會繼續使用。

    在 `update <id> --dry-run` 期間，精確固定的 npm 安裝會維持固定。如果 OpenClaw 也能解析該套件的登錄預設發布線，而該預設發布線比已安裝的固定版本更新，試執行會回報固定版本，並印出明確的 `@latest` 套件更新命令，以跟隨登錄預設發布線。

    這項指定更新規則與大量 `openclaw plugins update --all` 維護路徑不同。大量更新仍會遵循一般受追蹤的安裝規格，但受信任的官方 OpenClaw 外掛記錄可以同步至目前的官方目錄目標，而不會停留在過時且精確指定的官方套件。若刻意要讓精確版本或加上標籤的官方規格保持不變，請使用指定的 `update <id>`。

    對於 npm 安裝，也可以傳入包含 dist-tag 或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回受追蹤的外掛記錄、更新該已安裝外掛，並記錄新的 npm 規格，供未來以 ID 為基礎的更新使用。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回受追蹤的外掛記錄。如果外掛已固定為精確版本，而你想將其移回登錄的預設發布線，請使用此方式。

  </Accordion>
  <Accordion title="Beta 頻道更新">
    指定的 `openclaw plugins update <id-or-npm-spec>` 會重複使用受追蹤的外掛規格，除非你傳入新規格。大量 `openclaw plugins update --all` 在將受信任的官方外掛記錄同步至官方目錄目標時，會使用已設定的 `update.channel`，因此 Beta 頻道安裝可以維持在 Beta 發布線，而不會在未提示的情況下正規化為 stable/latest。

    `openclaw update` 也知道作用中的 OpenClaw 更新頻道：在 Beta 頻道上，預設發布線的 npm 與 ClawHub 外掛記錄會先嘗試 `@beta`。如果不存在外掛 Beta 版本，則會退回已記錄的 default/latest 規格；如果 npm 外掛的 Beta 套件存在但未通過安裝驗證，也會退回。這項退回會以警告回報，不會讓核心更新失敗。精確版本與明確標籤會在指定更新時維持固定於該選擇器。

  </Accordion>
  <Accordion title="版本檢查與完整性漂移">
    在即時 npm 更新前，OpenClaw 會根據 npm 登錄中繼資料檢查已安裝的套件版本。如果已安裝版本及已記錄的成品身分皆已與解析出的目標相符，則會略過更新，不會下載、重新安裝或重寫 `openclaw.json`。

    如果存在已儲存的完整性雜湊，而擷取的成品雜湊發生變更，OpenClaw 會將其視為 npm 成品漂移。互動式 `openclaw plugins update` 命令會印出預期與實際雜湊，並在繼續之前要求確認。除非呼叫端提供明確的繼續原則，否則非互動式更新輔助工具會採取封閉式失敗。

  </Accordion>
  <Accordion title="更新時的 --dangerously-force-unsafe-install">
    為了相容性，`plugins update` 也接受 `--dangerously-force-unsafe-install`，但它已棄用，且不再變更外掛更新行為。操作者 `security.installPolicy` 仍可封鎖更新；外掛 `before_install` 鉤子僅適用於已載入外掛鉤子的處理程序。
  </Accordion>
  <Accordion title="更新時的 --acknowledge-clawhub-risk">
    由社群 ClawHub 支援的外掛更新，會在下載替換套件前執行與安裝相同的精確版本信任檢查。如果已審查的自動化作業應在所選 ClawHub 版本出現高風險信任警告時繼續，請使用 `--acknowledge-clawhub-risk`。官方 ClawHub 套件與內建 OpenClaw 外掛來源會略過此版本信任提示。
  </Accordion>
</AccordionGroup>

## 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

依預設，檢查功能不會匯入外掛執行階段，但會顯示身分、載入狀態、來源、資訊清單功能、原則旗標、診斷、安裝中繼資料、套件功能，以及任何偵測到的 MCP 或 LSP 伺服器支援。JSON 輸出包含外掛資訊清單合約，例如 `contracts.agentToolResultMiddleware` 和 `contracts.trustedToolPolicies`，讓操作者能在啟用或重新啟動外掛之前稽核受信任介面宣告。加入 `--runtime` 可載入外掛模組，並包含已註冊的鉤子、工具、命令、服務、閘道方法及 HTTP 路由。執行階段檢查會直接回報遺失的外掛相依套件；安裝與修復則由 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 負責。

外掛擁有的命令列介面命令通常會安裝為根層級的 `openclaw` 命令群組，但外掛也可以在核心父項（例如 `openclaw nodes`）下註冊巢狀命令。當 `inspect --runtime` 在 `cliCommands` 下顯示命令後，請在列出的路徑執行該命令；例如，註冊 `demo-git` 的外掛可以使用 `openclaw demo-git ping` 驗證。

每個外掛都會根據其在執行階段實際註冊的內容進行分類：

| 形態                | 意義                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | 只有一種功能類型（例如僅提供者外掛）                              |
| `hybrid-capability` | 超過一種功能類型（例如文字 + 語音 + 影像）                        |
| `hook-only`         | 僅有鉤子，沒有功能、工具、命令、服務或路由                        |
| `non-capability`    | 有工具／命令／服務，但沒有功能                                    |

如需功能模型的詳細資訊，請參閱[外掛形態](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合用於指令碼與稽核的機器可讀報告。`inspect --all` 會呈現涵蓋整個機群的表格，其中包含形態、功能種類、相容性通知、套件功能及鉤子摘要欄。`info` 是 `inspect` 的別名。
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報外掛載入錯誤、資訊清單／探索診斷、相容性通知，以及過時的外掛設定參照，例如缺少外掛插槽。當安裝樹狀結構與外掛設定皆無問題時，它會輸出 `No plugin issues detected.`。如果仍有過時設定，但安裝樹狀結構在其他方面皆正常，摘要會如實說明，而不會暗示外掛完全正常。

如果已設定的外掛存在於磁碟上，但遭載入器的路徑安全性檢查封鎖，設定驗證會保留此外掛項目，並將其回報為 `present but blocked`。請修正前述的外掛封鎖診斷問題，例如路徑擁有權或所有人皆可寫入的權限，而不要移除 `plugins.entries.<id>` 或 `plugins.allow` 設定。

對於模組結構失敗，例如缺少 `register`/`activate` 匯出，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出結構摘要。

## 登錄檔

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機外掛登錄檔是 OpenClaw 為已安裝外掛的身分、啟用狀態、來源中繼資料及貢獻項目擁有權所保存的冷讀取模型。一般啟動、提供者擁有者查找、頻道設定分類及外掛清單都能讀取該登錄檔，而不必匯入外掛執行階段模組。

使用 `plugins registry` 檢查保存的登錄檔是否存在、為最新狀態或已過時。使用 `--refresh`，根據保存的外掛索引、設定原則及資訊清單／套件中繼資料重建登錄檔。這是修復途徑，而非執行階段啟用途徑。

`openclaw doctor --fix` 也會修復登錄檔相關的受管理 npm 漂移：如果受管理外掛 npm 專案或舊版扁平受管理 npm 根目錄下的孤立或復原 `@openclaw/*` 套件遮蔽了隨附外掛，doctor 會移除該過時套件並重建登錄檔，讓啟動程序依據隨附的資訊清單進行驗證。Doctor 也會將主機的 `openclaw` 套件重新連結至宣告 `peerDependencies.openclaw` 的受管理 npm 外掛，使 `openclaw/plugin-sdk/*` 等套件本機執行階段匯入在更新或 npm 修復後能夠解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的緊急相容性開關，用於處理登錄檔讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；此環境變數後援僅供移轉推出期間的緊急啟動復原使用。
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

`plugins marketplace entries` 會列出已設定 OpenClaw 市集摘要中的項目。依預設，它會嘗試使用託管摘要，若無法使用則退回最新接受的快照或隨附資料。使用 `--feed-profile <name>` 讀取特定的已設定設定檔，使用 `--feed-url <url>` 讀取明確指定的託管摘要 URL，並使用 `--offline` 讀取最新接受的快照而不擷取摘要。

`plugins marketplace refresh` 會重新整理已設定的託管摘要快照，並回報 OpenClaw 接受的是託管資料、託管快照，還是隨附的後援資料。當呼叫端要求除非新的託管承載資料符合固定的總和檢查碼，否則命令必須失敗時，請使用 `--expected-sha256`。

市集 `list` 接受本機市集路徑、`marketplace.json` 路徑、`owner/repo` 等 GitHub 簡寫、GitHub 儲存庫 URL 或 git URL。`--json` 會輸出解析後的來源標籤，以及剖析後的市集資訊清單和外掛項目。

市集重新整理會載入託管的 OpenClaw 市集摘要，並將
驗證過的回應保存為本機託管摘要快照。若未指定選項，則會使用
已設定的預設摘要設定檔。使用 `--feed-profile <name>` 重新整理
特定的已設定設定檔，使用 `--feed-url <url>` 重新整理明確指定的託管
摘要 URL，使用 `--expected-sha256 <sha256>` 要求承載資料的總和檢查碼相符
（`sha256:<hex>` 或不含前綴的 64 字元十六進位摘要），並使用 `--json` 取得
機器可讀的輸出。明確指定的託管摘要 URL 不得包含
認證資訊、查詢字串或片段。未固定總和檢查碼的重新整理可以回報
託管快照或隨附的後援結果，而不會使命令失敗。固定總和檢查碼的
重新整理，除非接受新的託管承載資料，否則會失敗；若 OpenClaw
無法保存驗證過的快照，成功的託管重新整理也會失敗。

## 相關內容

- [建置外掛](/zh-TW/plugins/building-plugins)
- [命令列介面參考](/zh-TW/cli)
- [ClawHub](/zh-TW/clawhub)
