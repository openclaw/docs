---
read_when:
    - 你想要安裝或管理閘道外掛或相容套件組合
    - 你想要建立或驗證一個簡單的工具外掛骨架
    - 你想要偵錯外掛載入失敗的問題
sidebarTitle: Plugins
summary: '`openclaw plugins` 的命令列介面參考（初始化、建置、驗證、列出、安裝、市集、解除安裝、啟用／停用、診斷）'
title: 外掛
x-i18n:
    generated_at: "2026-07-22T10:28:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: af179ea8abc2c6b785200ee44cd4f91a24ec5643ec1825c357572f1b05b33790
    source_path: cli/plugins.md
    workflow: 16
---

管理閘道外掛、Hook 套件包與相容套件組合。

<CardGroup cols={2}>
  <Card title="外掛系統" href="/zh-TW/tools/plugin">
    安裝、啟用及疑難排解外掛的使用者指南。
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

若要調查緩慢的安裝、檢查、解除安裝或登錄檔重新整理，請使用
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行命令。追蹤會將各階段耗時寫入
stderr，並讓 JSON 輸出維持可剖析狀態。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，`openclaw.json` 不可變更。`install`、`update`、`uninstall`、`enable` 和 `disable` 均會拒絕執行。請改為編輯此安裝的 Nix 來源（nix-openclaw 使用 `programs.openclaw.config` 或 `instances.<name>.config`），然後重新建置。請參閱以代理程式為優先的[快速入門](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
隨附外掛會與 OpenClaw 一同提供。部分外掛預設啟用（例如隨附的模型供應商、語音供應商與瀏覽器外掛）；其他外掛則需要 `plugins enable`。

原生 OpenClaw 外掛會提供含內嵌 JSON Schema 的 `openclaw.plugin.json`（`configSchema`，即使其內容為空）。相容套件組合則使用各自的套件組合資訊清單。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細的清單／資訊輸出也會顯示套件組合子類型（`codex`、`claude` 或 `cursor`），以及偵測到的套件組合功能。
</Note>

## 製作

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 預設會建立最小化的 TypeScript 工具外掛。第一個
引數是外掛 ID；`--name` 設定顯示名稱。OpenClaw 會將此
ID 用於預設輸出目錄與套件命名。工具基架使用
`defineToolPlugin`，並產生 `package.json` 指令碼 `plugin:build` 和
`plugin:validate`；這些指令碼會先建置，再呼叫 `openclaw plugins build`/`validate`。

`plugins build` 會匯入建置後的進入點、讀取其靜態工具中繼資料、寫入
`openclaw.plugin.json`，並使 `package.json` 的 `openclaw.extensions` 保持一致。
`plugins validate` 會檢查產生的資訊清單、套件中繼資料與
目前的進入點匯出是否仍然一致。完整製作工作流程請參閱[工具外掛](/zh-TW/plugins/tool-plugins)。

基架會寫入 TypeScript 原始碼，但從建置後的
`./dist/index.js` 進入點產生中繼資料，因此此工作流程也適用於已發布的命令列介面。當進入點不是預設套件進入點時，請使用
`--entry <path>`。在 CI 中使用
`plugins build --check`，可在產生的中繼資料過時時失敗，而不重寫檔案。

### 供應商基架

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

供應商基架會建立一個通用的 OpenAI 相容模型供應商外掛，
其中包含 API 金鑰驗證處理、執行
`clawhub package validate` 的 `npm run validate` 指令碼、ClawHub 套件中繼資料，以及一個
可手動派送的 GitHub Actions 工作流程，供未來透過 GitHub
OIDC 進行受信任發布。供應商基架不會產生 Skills，也不使用
`openclaw plugins build`/`validate`；這些命令用於工具
基架的中繼資料產生路徑。

發布前，請以實際的供應商詳細資料取代預留的 API 基底 URL、模型目錄、文件
路由、認證資訊文字及 README 內容。首次發布至 ClawHub 及設定受信任發布者時，請使用
產生的 README。

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
openclaw plugins install -l <path>                         # 建立連結而非複製
openclaw plugins install <plugin>@<marketplace>             # 市集簡寫
openclaw plugins install <plugin> --marketplace <name>      # 市集（明確指定）
openclaw plugins install <package> --force                  # 確認來源／覆寫現有項目
openclaw plugins install <package> --pin                    # 鎖定解析後的 npm 版本
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

測試設定期間安裝的維護者，可以使用受保護的環境變數覆寫自動外掛安裝
來源。請參閱
[外掛安裝覆寫](/zh-TW/plugins/install-overrides)。

<Warning>
在啟動切換期間，裸套件名稱預設會從 npm 安裝；但若名稱符合隨附或官方外掛 ID，OpenClaw 會改用該本機／官方副本，而不存取 npm 登錄檔。若確實要使用外部 npm 套件，請改用 `npm:<package>`。ClawHub 請使用 `clawhub:<package>`。應將安裝外掛視同執行程式碼；請優先使用鎖定版本。
</Warning>

<Warning>
ClawHub 套件及 OpenClaw 的隨附／官方目錄屬於受信任的安裝
來源。新的任意 npm、`npm-pack:`、git、本機路徑／封存檔或
市集來源會顯示警告，並在繼續前要求確認。對任意來源進行非互動式
安裝時，必須先審查並信任來源，再傳入 `--force`。需要時，相同
旗標也會覆寫現有安裝目標。正常更新已追蹤的安裝項目不需要使用此旗標。此確認與
`--acknowledge-clawhub-risk` 不同，後者僅適用於有風險的 ClawHub 發行版信任
警告。`--force` 不會略過 `security.installPolicy` 或其餘
安裝安全檢查。
</Warning>

`plugins search` 會向 ClawHub 查詢可安裝的 `code-plugin` 和
`bundle-plugin` 套件（不包含 Skills；Skills 請使用 `openclaw skills search`）。
`--limit` 預設為 20，上限為 100。它只會讀取遠端目錄：不會
檢查本機狀態、修改設定、安裝套件或載入外掛執行階段。
結果包含 ClawHub 套件名稱、系列、頻道、版本、摘要，以及
如 `openclaw plugins install clawhub:<package>` 的安裝提示。

<Note>
ClawHub 是大多數外掛的主要發行與探索介面。Npm
仍是受支援的備援與直接安裝路徑。OpenClaw 所有的
`@openclaw/*` 外掛套件已再次發布至 npm；目前清單請參閱
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或
[外掛清單](/zh-TW/plugins/plugin-inventory)。穩定版安裝使用 `latest`。
Beta 頻道的安裝與更新會優先使用 npm 的 `beta` dist-tag（若可用），
否則退回 `latest`。在延伸穩定版頻道中，具有裸名稱／預設或 `latest` 意圖的官方 npm 外掛，
會解析為與已安裝核心版本完全相同的版本。精確鎖定版本與明確指定的非 `latest` 標籤、第三方套件及
非 npm 來源不會被改寫。
</Note>

<AccordionGroup>
  <Accordion title="設定引入與無效設定修復">
    如果你的 `plugins` 區段由單一檔案的 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該引入檔案，並保持 `openclaw.json` 不變。根層級引入、引入陣列及含同層覆寫的引入會採取失敗關閉，而非攤平。支援的形式請參閱[設定引入](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會採取失敗關閉，並要求你先執行 `openclaw doctor --fix`。在閘道啟動與熱重新載入期間，無效的外掛設定會如其他無效設定一樣採取失敗關閉；`openclaw doctor --fix` 可隔離無效的外掛項目。唯一有文件記載的安裝期間例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的外掛所提供之狹義隨附外掛復原路徑。

  </Accordion>
  <Accordion title="--force 確認，以及重新安裝與更新的差異">
    `--force` 會確認非 ClawHub 來源而不顯示提示。它不會略過 `security.installPolicy` 或其餘安裝安全檢查。當外掛或 Hook 套件包已安裝時，它也會重複使用現有目標，並直接覆寫。請在審查任意 npm、本機、封存檔、git 或市集來源後使用，或在刻意重新安裝相同 ID 時使用。若要例行升級已追蹤的 npm 外掛，請優先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果對已安裝的外掛 ID 執行 `plugins install`，OpenClaw 會停止並指引你使用 `plugins update <id-or-npm-spec>` 進行正常升級；若確實要從不同來源覆寫目前的安裝項目，則會指引你使用 `plugins install <package> --force`。任意來源仍會顯示互動式來源警告；非互動式安裝必須在審查後傳入 `--force`。受信任的 ClawHub 與 OpenClaw 目錄來源不需要此旗標。搭配 `--link` 時，`--force` 會確認來源，但不會變更連結路徑安裝模式。

  </Accordion>
  <Accordion title="--pin 適用範圍">
    `--pin` 僅適用於 npm 安裝，並記錄解析後的精確 `<name>@<version>`。它不支援 `git:` 安裝（請改為在規格中鎖定 ref，例如 `git:github.com/acme/plugin@v1.2.3`），也不支援 `--marketplace`（市集安裝會保留市集來源中繼資料，而非 npm 規格）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已淘汰，目前不會執行任何操作。OpenClaw 不再針對外掛安裝執行內建的安裝期間危險程式碼封鎖。

    當需要主機特定的安裝政策時，請使用由操作者擁有的 `security.installPolicy` 介面。外掛 `before_install` 鉤子是外掛執行階段生命週期鉤子，而不是命令列介面安裝的主要政策邊界。

    如果你發佈至 ClawHub 的外掛因登錄檔掃描而被隱藏或封鎖，請使用 [ClawHub 發佈](/zh-TW/clawhub/publishing)中的發佈者步驟。`--dangerously-force-unsafe-install` 不會要求 ClawHub 重新掃描外掛，也不會將遭封鎖的版本公開。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    社群 ClawHub 安裝會在下載前檢查所選版本的信任記錄。如果 ClawHub 停用該版本的下載、回報惡意掃描結果，或將該版本置於封鎖性審核狀態（已隔離、已撤銷），無論是否使用此旗標，OpenClaw 都會直接拒絕。對於不具封鎖性的高風險掃描狀態或審核狀態，OpenClaw 會顯示信任詳細資訊，並在繼續前要求確認。

    只有在檢閱 ClawHub 警告並決定略過互動式提示繼續後，才使用 `--acknowledge-clawhub-risk`。待處理或過期（尚未確認無問題）的掃描結果會顯示警告，但不要求確認。官方 ClawHub 套件和隨附的 OpenClaw 外掛來源會完全略過此版本信任檢查。

  </Accordion>
  <Accordion title="鉤子套件與 npm 規格">
    `plugins install` 也是用於安裝在 `package.json` 中公開 `openclaw.hooks` 的鉤子套件介面。請使用 `openclaw hooks` 控制篩選後的鉤子可見性及個別鉤子的啟用狀態，而不是用於安裝套件。

    Npm 規格**僅限登錄檔**（套件名稱加上選用的**確切版本**或 **dist-tag**）。Git／URL／檔案規格和 semver 範圍都會遭到拒絕。為了安全，即使你的 shell 具有全域 npm 安裝設定，每個外掛的相依套件安裝仍會在各自的受管理 npm 專案中使用 `--ignore-scripts` 執行。受管理的外掛 npm 專案會繼承 OpenClaw 套件層級的 npm `overrides`，因此主機安全性版本鎖定也會套用至提升層級的外掛相依套件。

    使用 `npm:<package>` 明確指定 npm 解析。在啟動切換期間，未加前綴的套件規格也會直接從 npm 安裝，除非它們符合官方外掛 ID。

    與隨附外掛相符的原始 `@openclaw/*` 規格，會先解析為映像檔所擁有的隨附副本，再考慮 npm 備援。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 會使用目前 OpenClaw 組建隨附的 Discord 外掛，而不會建立受管理的 npm 覆寫。若要強制使用外部 npm 套件，請使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    未加前綴的規格與 `@latest` 會維持在穩定版軌道。OpenClaw 帶日期戳記的修正版（例如 `2026.5.3-1`）在此檢查中視為穩定版。如果 npm 將任一形式解析為預發行版本，OpenClaw 會停止並要求你使用預發行標籤（`@beta`/`@rc`）或確切的預發行版本（`@1.2.3-beta.4`）明確選擇加入。

    對於未指定確切版本的 npm 安裝（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 會在安裝前檢查解析出的套件中繼資料。如果最新穩定版套件需要較新的 OpenClaw 外掛 API 或更高的最低主機版本，OpenClaw 會檢查較舊的穩定版本，並改為安裝最新的相容版本。確切版本與明確的 dist-tag 則維持嚴格模式：選擇不相容的版本會失敗，並要求你升級 OpenClaw 或選擇相容版本。

    如果未加前綴的安裝規格符合官方外掛 ID（例如 `diffs`），OpenClaw 會直接安裝目錄項目。若要安裝同名的 npm 套件，請使用明確的範圍規格（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 儲存庫">
    使用 `git:<repo>` 直接從 git 儲存庫安裝。支援的形式：`git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` 複製 URL。加入 `@<ref>` 或 `#<ref>`，即可在安裝前簽出分支、標籤或提交。

    Git 安裝會複製至暫存目錄，在指定參照時簽出該參照，然後使用一般的外掛目錄安裝程式。因此，資訊清單驗證、操作者安裝政策、套件管理工具安裝作業及安裝記錄的行為都與 npm 安裝相同。記錄的 git 安裝包含來源 URL／參照及解析後的提交，因此 `openclaw plugins update` 稍後可以重新解析來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證執行階段註冊項目，例如閘道方法和命令列介面命令。如果外掛使用 `api.registerCli` 註冊命令列介面根命令，請直接透過 OpenClaw 根命令列介面執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 外掛封存檔必須在解壓縮後的外掛根目錄包含有效的 `openclaw.plugin.json`；僅包含 `package.json` 的封存檔，會在 OpenClaw 寫入安裝記錄前遭到拒絕。

    當檔案是 npm-pack tarball，且你想使用與登錄檔安裝相同的
    個別外掛受管理 npm 專案路徑時，請使用 `npm-pack:<path.tgz>`，
    其中包括 `package-lock.json` 驗證、提升層級的相依套件掃描，
    以及 npm 安裝記錄。一般封存檔路徑仍會安裝為外掛擴充功能
    根目錄下的本機封存檔。

    也支援 Claude 市集安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在啟動切換期間，符合 npm 安全命名規則且未加前綴的外掛規格，預設會從 npm 安裝，除非它們符合官方外掛 ID：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 明確指定僅透過 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查所宣告的外掛 API／最低閘道相容性。當所選 ClawHub 版本發佈 ClawPack 成品時，OpenClaw 會下載有版本的 npm-pack `.tgz`、驗證 ClawHub 摘要標頭和成品摘要，然後透過一般封存檔路徑進行安裝。沒有 ClawPack 中繼資料的舊版 ClawHub 仍會透過舊版套件封存檔驗證路徑進行安裝。記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm 完整性、npm shasum、tarball 名稱及 ClawPack 摘要資訊，以供後續更新使用。
未指定版本的 ClawHub 安裝會保留未指定版本的記錄規格，讓 `openclaw plugins update` 可以追蹤較新的 ClawHub 版本；明確的版本或標籤選擇器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）則會固定在該選擇器。

### 市集簡寫

當市集名稱存在於 Claude 位於 `~/.claude/plugins/known_marketplaces.json` 的本機登錄檔快取中時，請使用 `plugin@marketplace` 簡寫：

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
    - git URL

  </Tab>
  <Tab title="遠端市集規則">
    對於從 GitHub 或 git 載入的遠端市集，外掛項目必須位於複製的市集儲存庫內。OpenClaw 接受來自該儲存庫的相對路徑來源，並拒絕遠端資訊清單中的 HTTP(S)、絕對路徑、git、GitHub 及其他非路徑外掛來源。
  </Tab>
</Tabs>

對於本機路徑和封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw 外掛（`openclaw.plugin.json`）
- Codex 相容套件組合（`.codex-plugin/plugin.json`）
- Claude 相容套件組合（`.claude-plugin/plugin.json`，或該資訊清單檔案不存在時的預設 Claude 元件配置）
- Cursor 相容套件組合（`.cursor-plugin/plugin.json`）

受管理的本機安裝必須是外掛目錄或封存檔。獨立的 `.js`、
`.mjs`、`.cjs` 和 `.ts` 外掛檔案不會由
`plugins install` 複製至受管理的外掛根目錄，也無法透過直接放置於
`~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 中載入；這些
自動探索根目錄會載入外掛套件或套件組合目錄，並略過作為本機輔助工具的
頂層指令碼檔案。請改為在 `plugins.load.paths` 中明確列出獨立檔案。

<Note>
相容套件組合會安裝至一般外掛根目錄，並參與相同的列出／資訊／啟用／停用流程。目前支援套件組合 Skills、Claude 命令 Skills、Claude `settings.json` 預設值、Claude `.lsp.json`／資訊清單宣告的 `lspServers` 預設值、Cursor 命令 Skills，以及相容的 Codex 鉤子目錄；其他偵測到的套件組合功能會顯示於診斷／資訊中，但尚未連接至執行階段執行。
</Note>

使用 `-l`/`--link` 指向本機外掛目錄，而不進行複製（新增
至 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--link` 不支援與 `--marketplace` 或 `git:` 安裝搭配使用，而且
需要一個已存在的本機路徑。若要建立非互動式本機連結，
請在檢閱來源後傳入 `--force`；它會確認來源，但不會
複製或覆寫連結的目錄。

<Note>
從工作區擴充功能根目錄探索到、源自工作區的外掛，在明確啟用前不會
匯入或執行。對於本機開發，請執行 `openclaw plugins enable <plugin-id>` 或設定
`plugins.entries.<plugin-id>.enabled: true`；如果你的設定使用
`plugins.allow`，也請在其中包含相同的外掛 ID。即使通道設定明確以源自工作區的外掛為目標，
僅為設定而載入，此失敗時關閉規則仍然適用。因此，當該工作區外掛仍處於停用狀態
或未列入允許清單時，本機通道外掛設定程式碼不會執行。連結安裝
和明確的 `plugins.load.paths` 項目會依其
解析後的外掛來源遵循一般政策。請參閱
[設定外掛政策](/zh-TW/tools/plugin#configure-plugin-policy)
和[設定參考](/zh-TW/gateway/configuration-reference#plugins)。

在 npm 安裝中使用 `--pin`，可將解析後的確切規格（`name@version`）儲存於受管理的外掛索引中，同時維持預設不固定版本的行為。
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
  從表格檢視切換為個別外掛的詳細資訊行，其中包含格式／來源／原始位置／版本／啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清單，以及登錄檔診斷和套件相依性安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取已持久儲存的本機外掛登錄；若登錄遺失或無效，則改用僅根據資訊清單衍生的備援資料。它適合用來檢查外掛是否已安裝、已啟用，且可供冷啟動規劃識別，但不是對已在執行中的閘道程序進行即時執行階段探測。變更外掛程式碼、啟用狀態、鉤子政策或 `plugins.load.paths` 後，必須重新啟動為該頻道提供服務的閘道，才能期待新的 `register(api)` 程式碼或鉤子開始執行。若是遠端／容器部署，請確認重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝程序。

`plugins list --json` 會納入每個外掛在 `package.json`
`dependencies` 與 `optionalDependencies` 中的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於外掛的一般節點 `node_modules` 查詢路徑中；它
不會匯入外掛執行階段程式碼、不會執行套件管理器，也不會修復遺失的
相依套件。
</Note>

如果啟動記錄顯示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，
請執行 `openclaw plugins list --enabled --verbose`，或使用列出的外掛 ID 執行
`openclaw plugins inspect <id>`，以確認外掛
ID，並將可信任的 ID 複製到 `openclaw.json` 中的 `plugins.allow`。當
警告能列出所有已發現的外掛時，會輸出一段可直接貼上的
`plugins.allow` 程式碼片段，其中已包含這些 ID。如果外掛載入時
沒有安裝／載入路徑來源資訊，請檢查該外掛 ID，接著將
可信任的 ID 固定於 `plugins.allow`，或從可信任來源重新安裝外掛，
讓 OpenClaw 記錄安裝來源資訊。

若要在已封裝的 Docker 映像檔內進行隨附外掛開發，請將外掛
原始碼目錄繫結掛載至相符的已封裝原始碼路徑，例如
`/app/extensions/synology-chat`。OpenClaw 會在
`/app/dist/extensions/synology-chat` 之前發現該掛載的原始碼覆疊；
單純複製的原始碼目錄仍不會生效，因此一般的已封裝安裝仍會使用已編譯的 dist。

若要偵錯執行階段鉤子：

- `openclaw plugins inspect <id> --runtime --json` 會顯示透過已載入模組的檢查流程所登錄的鉤子與診斷資訊。執行階段檢查絕不會安裝相依套件；請使用 `openclaw doctor --fix` 清理舊版相依套件狀態，或復原設定所參照但遺失的可下載外掛。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的閘道 URL／設定檔、服務／程序提示、設定路徑及 RPC 健康狀態。
- 非隨附的對話鉤子（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

### 外掛索引

外掛安裝中繼資料是由機器管理的狀態，而不是使用者設定。安裝與更新會將其寫入有效 OpenClaw 狀態目錄下的共用 SQLite 狀態資料庫。`installed_plugin_index` 資料列會儲存持久的 `installRecords` 中繼資料，包括外掛資訊清單損壞或遺失的記錄，以及由資訊清單衍生、供 `openclaw plugins update`、解除安裝、診斷與冷外掛登錄使用的快取。

`plugins.installs` 是已淘汰的手動編寫設定介面。執行階段與更新命令只會讀取 SQLite 的已安裝外掛索引。請執行 `openclaw doctor --fix`，將舊版設定記錄匯入索引並移除已淘汰的鍵，再開始一般執行階段使用。

## 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` 會從 `plugins.entries`、持久儲存的外掛索引、外掛允許／拒絕清單項目，以及適用時已連結的 `plugins.load.paths` 項目中移除外掛記錄。除非設定了 `--keep-files`，否則解除安裝也會移除受追蹤的代管安裝目錄，但僅限其解析結果位於 OpenClaw 的外掛 extensions 根目錄內時。如果外掛目前占用 `memory` 或 `contextEngine` 插槽，該插槽會重設為預設值（記憶體為 `memory-core`，內容脈絡引擎為 `legacy`）。

`uninstall` 會先輸出即將移除項目的預覽，然後在進行變更前提示 `Uninstall plugin "<id>"?`。傳入 `--force` 可略過確認提示（適合指令碼與非互動式執行）；若未傳入，解除安裝需要互動式 TTY。`--dry-run` 會輸出相同預覽，然後結束，不提示也不變更任何內容。

<Note>
`--keep-config` 可作為 `--keep-files` 的已淘汰別名使用。
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

更新適用於代管外掛索引中受追蹤的外掛安裝，以及共用 SQLite 狀態中受追蹤的鉤子套件安裝。更新會重複使用使用者安裝外掛時已選擇的來源，因此不需要再次確認來源。

<AccordionGroup>
  <Accordion title="解析外掛 ID 與 npm 規格">
    傳入外掛 ID 時，OpenClaw 會重複使用該外掛已記錄的安裝規格。這表示先前儲存的 dist-tag（例如 `@beta`）與明確固定的版本，在後續執行 `update <id>` 時仍會繼續使用。

    在 `update <id> --dry-run` 期間，明確固定的 npm 安裝會保持固定。如果 OpenClaw 也能解析套件的登錄預設版本線，且該預設版本線比已安裝的固定版本更新，試執行會回報該固定版本，並輸出明確的 `@latest` 套件更新命令，以跟隨登錄預設版本線。

    這項指定目標的更新規則與大量 `openclaw plugins update --all` 維護路徑不同。大量更新仍會遵循一般受追蹤的安裝規格，但可信任的 OpenClaw 官方外掛記錄可同步至目前的官方目錄目標，而非停留在過時的明確官方套件上。當你有意保持明確版本或帶標籤的官方規格不變時，請使用指定目標的 `update <id>`。

    對於 npm 安裝，你也可以傳入含 dist-tag 或明確版本的 npm 套件規格。OpenClaw 會將該套件名稱解析回受追蹤的外掛記錄、更新該已安裝外掛，並記錄新的 npm 規格，以供日後依 ID 更新。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回受追蹤的外掛記錄。當外掛固定於明確版本，而你想讓它回到登錄的預設發行版本線時，請使用此方式。

  </Accordion>
  <Accordion title="Beta 頻道更新">
    指定目標的 `openclaw plugins update <id-or-npm-spec>` 會重複使用受追蹤的外掛規格，除非你傳入新規格。大量 `openclaw plugins update --all` 在將可信任的官方外掛記錄同步至官方目錄目標時，會使用已設定的 `update.channel`，因此 Beta 頻道安裝可維持在 Beta 發行版本線，而不會在未告知的情況下正規化為 stable/latest。

    `openclaw update` 也會辨識有效的 OpenClaw 更新頻道：在 Beta 頻道上，預設版本線的 npm 與 ClawHub 外掛記錄會先嘗試 `@beta`。如果不存在外掛 Beta 版本，會回復使用已記錄的 default/latest 規格；若 npm 外掛的 Beta 套件存在但未通過安裝驗證，也會回復使用原規格。此備援會以警告回報，且不會導致核心更新失敗。明確版本與明確標籤在指定目標的更新中，仍會固定於該選擇器。

  </Accordion>
  <Accordion title="版本檢查與完整性漂移">
    在進行即時 npm 更新前，OpenClaw 會依據 npm 登錄中繼資料檢查已安裝的套件版本。如果已安裝版本與已記錄的成品識別資訊都已符合解析出的目標，則會略過更新，不會下載、重新安裝或重寫 `openclaw.json`。

    如果存在已儲存的完整性雜湊，而擷取到的成品雜湊已變更，OpenClaw 會將其視為 npm 成品漂移。互動式 `openclaw plugins update` 命令會輸出預期與實際雜湊，並在繼續前要求確認。非互動式更新輔助程式預設會拒絕繼續，除非呼叫端提供明確的繼續政策。

  </Accordion>
  <Accordion title="更新時使用 --dangerously-force-unsafe-install">
    為維持相容性，`plugins update` 也接受 `--dangerously-force-unsafe-install`，但該選項已淘汰，且不再變更外掛更新行為。操作人員的 `security.installPolicy` 仍可封鎖更新；外掛 `before_install` 鉤子只適用於已載入外掛鉤子的程序。
  </Accordion>
  <Accordion title="更新時使用 --acknowledge-clawhub-risk">
    由社群 ClawHub 支援的外掛更新，會在下載替代套件前執行與安裝相同的精確發行版本信任檢查。對於已審查，且應在所選 ClawHub 發行版本出現高風險信任警告時繼續執行的自動化，請使用 `--acknowledge-clawhub-risk`。官方 ClawHub 套件與隨附的 OpenClaw 外掛來源會略過此發行版本信任提示。
  </Accordion>
</AccordionGroup>

## 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

檢查預設不會匯入外掛執行階段，並會顯示識別資訊、載入狀態、來源、資訊清單能力、政策旗標、診斷、安裝中繼資料、套件能力，以及任何偵測到的 MCP 或 LSP 伺服器支援。JSON 輸出包含外掛資訊清單合約，例如 `contracts.agentToolResultMiddleware` 與 `contracts.trustedToolPolicies`，讓操作人員可在啟用或重新啟動外掛前，稽核可信任介面的宣告。加入 `--runtime` 可載入外掛模組，並納入已登錄的鉤子、工具、命令、服務、閘道方法與 HTTP 路由。執行階段檢查會直接回報遺失的外掛相依套件；安裝與修復仍由 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 負責。

外掛擁有的命令列介面命令通常會安裝為根層級 `openclaw` 命令群組，但外掛也可以在核心父命令下登錄巢狀命令，例如 `openclaw nodes`。當 `inspect --runtime` 顯示 `cliCommands` 下的命令後，請依列出的路徑執行；例如，登錄 `demo-git` 的外掛可以使用 `openclaw demo-git ping` 驗證。

每個外掛會依照其在執行階段實際登錄的內容分類：

| 形態                | 意義                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | 僅有一種能力類型（例如僅提供供應商功能的外掛）                    |
| `hybrid-capability` | 有多種能力類型（例如文字 + 語音 + 影像）                           |
| `hook-only`         | 僅有鉤子，沒有能力、工具、命令、服務或路由                         |
| `non-capability`    | 有工具／命令／服務，但沒有能力                                    |

如需進一步瞭解能力模型，請參閱[外掛形態](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合指令碼處理與稽核的機器可讀報告。`inspect --all` 會呈現涵蓋整個機群的表格，其中包含形態、能力種類、相容性通知、套件能力與鉤子摘要欄。`info` 是 `inspect` 的別名。
</Note>

## 診斷

```bash
openclaw plugins doctor
```

`doctor` 會回報外掛載入錯誤、資訊清單／探索診斷、相容性通知，以及缺少外掛插槽等過時的外掛設定參照。當安裝樹與外掛設定都正常時，會輸出 `No plugin issues detected.`。如果仍有過時設定，但安裝樹在其他方面皆正常，摘要會如實說明，而不會暗示外掛完全健康。

如果已設定的外掛存在於磁碟上，但遭載入器的路徑安全檢查封鎖，設定驗證會保留該外掛項目，並將其回報為 `present but blocked`。請修正前述外掛遭封鎖的診斷問題，例如路徑擁有權或所有人皆可寫入的權限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 設定。

若發生模組結構失敗，例如缺少 `register`/`activate` 匯出，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出結構摘要。

## 登錄檔

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機外掛登錄檔是 OpenClaw 持久保存的冷讀取模型，用於記錄已安裝外掛的身分、啟用狀態、來源中繼資料與貢獻項目的擁有權。一般啟動、提供者擁有者查詢、頻道設定分類與外掛清單都能讀取該登錄檔，而不必匯入外掛執行階段模組。

使用 `plugins registry` 檢查持久保存的登錄檔是否存在、為最新狀態或已過期。使用 `--refresh`，根據持久保存的外掛索引、設定原則與資訊清單／套件中繼資料重建登錄檔。這是修復路徑，而非執行階段啟用路徑。

`openclaw doctor --fix` 也會修復登錄檔周邊的受管理 npm 漂移。若受管理外掛 npm 專案或舊版扁平受管理 npm 根目錄下有孤立或復原的 `@openclaw/*` 套件遮蔽內建外掛，doctor 會移除該過期套件並重建登錄檔，使啟動程序依據內建資訊清單進行驗證。當權威安裝記錄選定某個受管理世代，但較舊的扁平或世代目錄仍然存在時，doctor 會將這些過期目錄樹標記為停用，待閘道重新啟動後清除。doctor 也會將主機的 `openclaw` 套件重新連結至宣告 `peerDependencies.openclaw` 的受管理 npm 外掛，使 `openclaw/plugin-sdk/*` 等套件本機執行階段匯入能在更新或 npm 修復後正確解析。

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

`plugins marketplace entries` 會列出已設定之 OpenClaw 市集資訊來源中的項目。預設情況下，它會嘗試使用託管資訊來源，並在失敗時改用最新接受的快照或內建資料。使用 `--feed-profile <name>` 讀取特定的已設定設定檔、使用 `--feed-url <url>` 讀取明確指定的託管資訊來源 URL，以及使用 `--offline` 在不擷取資訊來源的情況下讀取最新接受的快照。

`plugins marketplace refresh` 會重新整理已設定的託管資訊來源快照，並回報 OpenClaw 接受的是託管資料、託管快照或內建備援資料。當呼叫端要求命令僅在最新託管承載內容與固定的總和檢查碼相符時才能成功，請使用 `--expected-sha256`。

市集 `list` 接受本機市集路徑、`marketplace.json` 路徑、`owner/repo` 之類的 GitHub 簡寫、GitHub 儲存庫 URL 或 git URL。`--json` 會輸出解析後的來源標籤，以及剖析後的市集資訊清單與外掛項目。

市集重新整理會載入託管的 OpenClaw 市集資訊來源，並將
通過驗證的回應持久保存為本機託管資訊來源快照。若未指定選項，則使用
已設定的預設資訊來源設定檔。使用 `--feed-profile <name>` 重新整理
特定的已設定設定檔、使用 `--feed-url <url>` 重新整理明確指定的託管
資訊來源 URL、使用 `--expected-sha256 <sha256>` 要求承載內容的總和檢查碼相符
（`sha256:<hex>` 或不含前綴的 64 字元十六進位摘要），並使用 `--json` 取得
機器可讀的輸出。明確指定的託管資訊來源 URL 不得包含
認證資訊、查詢字串或片段。未固定總和檢查碼的重新整理可回報
託管快照或內建備援結果，而不會使命令失敗。固定總和檢查碼的
重新整理除非接受最新的託管承載內容，否則會失敗；成功接受託管內容的
重新整理若 OpenClaw 無法持久保存已驗證的快照，也會失敗。

## 相關內容

- [建置外掛](/zh-TW/plugins/building-plugins)
- [命令列介面參考](/zh-TW/cli)
- [ClawHub](/zh-TW/clawhub)
