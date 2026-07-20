---
read_when:
    - 你想要安裝或管理閘道外掛或相容套件組合
    - 你想要建置或驗證一個簡單的工具外掛
    - 你想要偵錯外掛載入失敗問題
sidebarTitle: Plugins
summary: '`openclaw plugins` 的命令列介面參考（初始化、建置、驗證、列出、安裝、市集、解除安裝、啟用/停用、診斷）'
title: 外掛
x-i18n:
    generated_at: "2026-07-20T00:46:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8db98bf732151009ca09a38c0f56d6e9feb185812196fdfa946bc0949aa09d1f
    source_path: cli/plugins.md
    workflow: 16
---

管理閘道外掛、鉤子套件和相容套件組合。

<CardGroup cols={2}>
  <Card title="外掛系統" href="/zh-TW/tools/plugin">
    安裝、啟用外掛及疑難排解的終端使用者指南。
  </Card>
  <Card title="管理外掛" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝和發布的快速範例。
  </Card>
  <Card title="外掛套件組合" href="/zh-TW/plugins/bundles">
    套件組合相容性模型。
  </Card>
  <Card title="外掛資訊清單" href="/zh-TW/plugins/manifest">
    資訊清單欄位和設定結構描述。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security">
    強化外掛安裝的安全性。
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

若要調查緩慢的安裝、檢查、解除安裝或登錄檔重新整理作業，請搭配 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行命令。追蹤會將各階段的耗時寫入 stderr，並讓 JSON 輸出維持可剖析狀態。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，`openclaw.json` 不可變更。`install`、`update`、`uninstall`、`enable` 和 `disable` 都會拒絕執行。請改為編輯此安裝的 Nix 來源（nix-openclaw 使用 `programs.openclaw.config` 或 `instances.<name>.config`），然後重新建置。請參閱以代理程式為優先的[快速入門](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
隨附外掛會與 OpenClaw 一併提供。部分外掛預設啟用（例如隨附的模型提供者、語音提供者及瀏覽器外掛）；其他外掛則需要 `plugins enable`。

原生 OpenClaw 外掛會提供 `openclaw.plugin.json`，其中包含內嵌的 JSON Schema（`configSchema`，即使內容為空亦然）。相容套件組合則使用各自的套件組合資訊清單。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細的列表／資訊輸出也會顯示套件組合子類型（`codex`、`claude` 或 `cursor`），以及偵測到的套件組合功能。
</Note>

## 編寫

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 預設會建立最小化的 TypeScript 工具外掛。第一個引數是外掛 ID；`--name` 用於設定顯示名稱。OpenClaw 會將此 ID 用於預設輸出目錄和套件命名。工具鷹架使用 `defineToolPlugin`，並產生 `package.json` 指令碼 `plugin:build` 和 `plugin:validate`；這些指令碼會先建置，再呼叫 `openclaw plugins build`/`validate`。

`plugins build` 會匯入建置完成的進入點、讀取其靜態工具中繼資料、寫入 `openclaw.plugin.json`，並讓 `package.json` 的 `openclaw.extensions` 保持一致。`plugins validate` 會檢查產生的資訊清單、套件中繼資料和目前的進入點匯出是否仍然一致。完整的編寫工作流程請參閱[工具外掛](/zh-TW/plugins/tool-plugins)。

鷹架會寫入 TypeScript 原始碼，但從建置完成的 `./dist/index.js` 進入點產生中繼資料，因此此工作流程也適用於已發布的命令列介面。當進入點並非預設套件進入點時，請使用 `--entry <path>`。在 CI 中使用 `plugins build --check`，可在產生的中繼資料過期時讓作業失敗，而不重寫檔案。

### 提供者鷹架

  ```bash
  openclaw plugins init acme-models --name "Acme Models" --type provider
  cd acme-models
  npm install
  npm run build
  npm test
  npm run validate
  ```

  供應商鷹架會建立一個通用且相容於 OpenAI 的模型供應商外掛，並包含 API 金鑰驗證管線、執行
  `clawhub package validate` 的 `npm run validate` 指令碼、ClawHub 套件中繼資料，以及可手動觸發的 GitHub Actions 工作流程，以便未來透過 GitHub OIDC 進行受信任的發布。供應商鷹架不會產生 Skills，也不使用
  `openclaw plugins build`/`validate`；這些命令用於工具鷹架的產生中繼資料路徑。

  發布前，請將預留位置 API 基底 URL、模型目錄、文件路由、認證資訊文字及 README 內容替換為實際的供應商詳細資料。首次發布至 ClawHub 及設定受信任發布者時，請使用產生的 README。

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
  openclaw plugins install <package> --pin                    # 固定解析後的 npm 版本
  openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
  openclaw plugins install <package> --dangerously-force-unsafe-install
  ```

  測試設定期間安裝作業的維護者，可透過受保護的環境變數覆寫自動外掛安裝來源。請參閱[外掛安裝覆寫](/zh-TW/plugins/install-overrides)。

  <Warning>
  在啟動切換期間，裸套件名稱預設會從 npm 安裝；但若名稱符合隨附或官方外掛 ID，OpenClaw 會改用該本機／官方副本，而不會存取 npm 登錄檔。若確實要使用外部 npm 套件，請改用 `npm:<package>`。ClawHub 請使用 `clawhub:<package>`。外掛安裝應視同執行程式碼；請優先使用固定版本。
  </Warning>

  <Warning>
  ClawHub 套件及 OpenClaw 的隨附／官方目錄是受信任的安裝來源。若來源是新的任意 npm、`npm-pack:`、git、本機路徑／封存檔或市集，系統會發出警告並在繼續前要求確認。非互動式的任意來源安裝，必須在你審查並信任來源後傳入 `--force`。需要時，同一旗標也會覆寫現有的安裝目標。對已追蹤安裝進行一般更新時不需要此旗標。此確認與 `--acknowledge-clawhub-risk` 不同，後者僅適用於有風險的 ClawHub 發行版本信任警告。`--force` 不會略過 `security.installPolicy` 或其他安裝安全檢查。
  </Warning>

  `plugins search` 會查詢 ClawHub 中可安裝的 `code-plugin` 與
  `bundle-plugin` 套件（不包含 Skills；Skills 請使用 `openclaw skills search`）。
  預設 `--limit` 為 20，上限為 100。它只會讀取遠端目錄：不會檢查本機狀態、修改設定、安裝套件或載入外掛執行階段。結果會包含 ClawHub 套件名稱、系列、頻道、版本、摘要，以及 `openclaw plugins install clawhub:<package>` 之類的安裝提示。

  <Note>
  ClawHub 是大多數外掛的主要散布與探索介面。Npm 仍是受支援的備援與直接安裝途徑。OpenClaw 所擁有的
  `@openclaw/*` 外掛套件已重新發布至 npm；請參閱 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 上的最新清單或[外掛清冊](/zh-TW/plugins/plugin-inventory)。穩定版安裝使用 `latest`。
  Beta 頻道的安裝與更新會優先使用 npm 的 `beta` dist-tag（若有），否則回退至 `latest`。在延伸穩定頻道中，使用裸名稱／預設或 `latest` 意圖的官方 npm 外掛，會解析為已安裝的確切核心版本。確切固定版本、明確的非 `latest` 標籤、第三方套件及非 npm 來源不會被改寫。
  </Note>

  <AccordionGroup>
  <Accordion title="設定引入與無效設定修復">
    如果你的 `plugins` 區段由單一檔案的 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會直接寫入該引入檔案，並保持 `openclaw.json` 不變。根層級引入、引入陣列，以及含有同層覆寫的引入都會採取失敗即關閉，而非攤平。支援的形式請參閱[設定引入](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會採取失敗即關閉，並告知你先執行 `openclaw doctor --fix`。在閘道啟動與熱重新載入期間，無效的外掛設定會像其他無效設定一樣採取失敗即關閉；`openclaw doctor --fix` 可隔離無效的外掛項目。唯一有文件記載的安裝階段例外，是針對明確選擇使用 `openclaw.install.allowInvalidConfigRecovery` 的外掛所提供的有限隨附外掛復原路徑。

  </Accordion>
  <Accordion title="--force 確認，以及重新安裝與更新的差異">
    `--force` 會在不提示的情況下確認非 ClawHub 來源。它不會略過 `security.installPolicy` 或其他安裝安全檢查。當外掛或掛鉤套件已安裝時，它也會重複使用現有目標並就地覆寫。請在審查任意 npm、本機、封存檔、git 或市集來源後使用；有意重新安裝相同 ID 時也可使用。若只是例行升級已追蹤的 npm 外掛，請優先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的外掛 ID 執行 `plugins install`，OpenClaw 會停止，並引導你使用 `plugins update <id-or-npm-spec>` 進行一般升級；若確實要以不同來源覆寫目前安裝，則使用 `plugins install <package> --force`。任意來源仍會顯示互動式來源警告；非互動式安裝必須在審查後傳入 `--force`。受信任的 ClawHub 與 OpenClaw 目錄來源不需要此旗標。搭配 `--link` 時，`--force` 會確認來源，但不會變更連結路徑安裝模式。

  </Accordion>
  <Accordion title="--pin 適用範圍">
    `--pin` 僅適用於 npm 安裝，並記錄解析後的確切 `<name>@<version>`。它不支援 `git:` 安裝（請改在規格中固定參照，例如 `git:github.com/acme/plugin@v1.2.3`），也不支援 `--marketplace`（市集安裝會保存市集來源中繼資料，而非 npm 規格）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已棄用，目前不會執行任何操作。OpenClaw 不再對外掛安裝執行內建的安裝階段危險程式碼封鎖。

    使用由操作人員擁有的 `security.installPolicy` 介面，以套用主機特定的安裝政策。外掛 `before_install` 鉤子是外掛執行階段生命週期鉤子，而非命令列介面安裝的主要政策邊界。

    如果你在 ClawHub 發布的外掛遭登錄檔掃描隱藏或封鎖，請依照 [ClawHub 發布](/zh-TW/clawhub/publishing)中的發布者步驟操作。`--dangerously-force-unsafe-install` 不會要求 ClawHub 重新掃描外掛，或將遭封鎖的版本設為公開。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    從社群 ClawHub 安裝時，會在下載前檢查所選版本的信任記錄。如果 ClawHub 停用該版本的下載、回報惡意掃描結果，或將該版本置於阻擋式審核狀態（隔離、撤銷），無論是否使用此旗標，OpenClaw 都會直接拒絕。對於不阻擋安裝但有風險的掃描狀態或審核狀態，OpenClaw 會顯示信任詳細資料，並在繼續前要求確認。

    僅應在檢閱 ClawHub 警告並決定不經互動式提示繼續後，才使用 `--acknowledge-clawhub-risk`。待處理或過期（尚未確認安全）的掃描結果會顯示警告，但不要求確認。官方 ClawHub 套件和 OpenClaw 隨附的外掛來源會完全略過此版本信任檢查。

  </Accordion>
  <Accordion title="鉤子套件與 npm 規格">
    `plugins install` 也是安裝鉤子套件的介面，這類套件會在 `package.json` 中公開 `openclaw.hooks`。請使用 `openclaw hooks` 控制經篩選的鉤子可見性及逐一啟用鉤子，而非用於安裝套件。

    Npm 規格**僅限登錄檔**（套件名稱加上選用的**確切版本**或 **dist-tag**）。Git／URL／檔案規格與 semver 範圍均會遭拒。為確保安全，即使你的 shell 設有全域 npm 安裝設定，每個外掛仍會在各自受管理的 npm 專案中使用 `--ignore-scripts` 執行相依套件安裝。受管理的外掛 npm 專案會繼承 OpenClaw 套件層級的 npm `overrides`，因此主機安全性版本鎖定也會套用至提升安裝的外掛相依套件。

    使用 `npm:<package>` 明確指定 npm 解析。啟動切換期間，未加前綴的套件規格也會直接從 npm 安裝，除非其符合官方外掛 ID。

    符合隨附外掛的原始 `@openclaw/*` 規格，會先解析為映像檔所擁有的隨附版本，再嘗試 npm 後備。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 會使用目前 OpenClaw 組建隨附的 Discord 外掛，而不會建立受管理的 npm 覆寫。若要強制使用外部 npm 套件，請使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    未加前綴的規格和 `@latest` 會維持在穩定版本軌。OpenClaw 帶日期標記的修正版（例如 `2026.5.3-1`）在此檢查中視為穩定版本。如果 npm 將任一形式解析為預發行版本，OpenClaw 會停止並要求你使用預發行標籤（`@beta`／`@rc`）或確切的預發行版本（`@1.2.3-beta.4`）明確選擇加入。

    對於未指定確切版本的 npm 安裝（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 會在安裝前檢查解析後的套件中繼資料。如果最新的穩定套件要求較新的 OpenClaw 外掛 API 或更高的主機最低版本，OpenClaw 會檢查較舊的穩定版本，並改為安裝最新的相容版本。確切版本和明確的 dist-tag 仍採嚴格處理：不相容的選擇會失敗，並要求你升級 OpenClaw 或選擇相容版本。

    如果未加前綴的安裝規格符合官方外掛 ID（例如 `diffs`），OpenClaw 會直接安裝目錄項目。若要安裝同名的 npm 套件，請使用明確的限定範圍規格（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 儲存庫">
    使用 `git:<repo>` 直接從 git 儲存庫安裝。支援的形式：`git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` 複製 URL。加入 `@<ref>` 或 `#<ref>`，即可在安裝前簽出分支、標籤或提交。

    Git 安裝會將儲存庫複製到暫存目錄，在指定 ref 時將其簽出，接著使用一般的外掛目錄安裝程式，因此資訊清單驗證、操作人員安裝政策、套件管理工具安裝作業及安裝記錄的行為均與 npm 安裝相同。記錄的 git 安裝包含來源 URL／ref 及解析後的提交，因此 `openclaw plugins update` 稍後可重新解析來源。

    從 git 安裝後，使用 `openclaw plugins inspect <id> --runtime --json` 驗證執行階段註冊項目，例如閘道方法及命令列介面命令。如果外掛使用 `api.registerCli` 註冊了命令列介面根命令，請直接透過 OpenClaw 根命令列介面執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 外掛封存檔必須在解壓縮後的外掛根目錄包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的封存檔會在 OpenClaw 寫入安裝記錄前遭拒。

    當檔案是 npm-pack tarball，且你想使用與登錄檔安裝相同的
    逐外掛受管理 npm 專案路徑時，請使用 `npm-pack:<path.tgz>`，
    其中包括 `package-lock.json` 驗證、提升安裝的相依套件掃描，
    以及 npm 安裝記錄。一般封存檔路徑仍會以本機
    封存檔形式安裝至外掛擴充功能根目錄下。

    也支援 Claude 市集安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

啟動切換期間，符合 npm 安全命名規則且未加前綴的外掛規格，預設會從 npm 安裝，除非其符合官方外掛 ID：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 明確限定只從 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查公告的外掛 API／最低閘道相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載帶版本的 npm-pack `.tgz`、驗證 ClawHub 摘要標頭與成品摘要，然後透過一般封存檔路徑進行安裝。沒有 ClawPack 中繼資料的舊版 ClawHub 版本仍會透過舊有套件封存檔驗證路徑安裝。記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm 完整性資訊、npm shasum、tarball 名稱及 ClawPack 摘要資訊，以供後續更新使用。
未指定版本的 ClawHub 安裝會保留未指定版本的記錄規格，讓 `openclaw plugins update` 可跟隨較新的 ClawHub 版本；明確的版本或標籤選取器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）則會固定於該選取器。

### 市集簡寫

當市集名稱存在於 Claude 的本機登錄檔快取 `~/.claude/plugins/known_marketplaces.json` 時，請使用 `plugin@marketplace` 簡寫：

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
    對於從 GitHub 或 git 載入的遠端市集，外掛項目必須留在複製的市集儲存庫內。OpenClaw 接受以該儲存庫為基準的相對路徑來源，並拒絕遠端資訊清單中的 HTTP(S)、絕對路徑、git、GitHub 及其他非路徑外掛來源。
  </Tab>
</Tabs>

對於本機路徑和封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw 外掛（`openclaw.plugin.json`）
- 與 Codex 相容的套件組合（`.codex-plugin/plugin.json`）
- 與 Claude 相容的套件組合（`.claude-plugin/plugin.json`，或該資訊清單檔案不存在時的預設 Claude 元件配置）
- 與 Cursor 相容的套件組合（`.cursor-plugin/plugin.json`）

受管理的本機安裝必須是外掛目錄或封存檔。獨立的 `.js`、
`.mjs`、`.cjs` 和 `.ts` 外掛檔案不會由
`plugins install` 複製至受管理的外掛根目錄，也不會因直接放置於
`~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 而載入；這些
自動探索根目錄會載入外掛套件或套件組合目錄，並略過作為本機輔助工具的
頂層指令碼檔案。請改在 `plugins.load.paths` 中明確列出獨立檔案。

<Note>
相容的套件組合會安裝至一般外掛根目錄，並參與相同的列出／資訊／啟用／停用流程。目前支援套件組合 Skills、Claude 命令 Skills、Claude `settings.json` 預設值、Claude `.lsp.json`／資訊清單宣告的 `lspServers` 預設值、Cursor 命令 Skills，以及相容的 Codex 鉤子目錄；其他偵測到的套件組合功能會顯示於診斷／資訊中，但尚未接入執行階段執行。
</Note>

使用 `-l`／`--link` 指向本機外掛目錄而不進行複製（會加入
`plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--link` 不支援搭配 `--marketplace` 或 `git:` 安裝，而且
要求本機路徑已存在。若要建立非互動式本機連結，請在檢閱來源後
傳入 `--force`；此選項會確認來源，但不會
複製或覆寫連結的目錄。

<Note>
從工作區擴充功能根目錄探索到、來源為工作區的外掛，在明確啟用前
不會匯入或執行。進行本機開發時，
請執行 `openclaw plugins enable <plugin-id>` 或設定
`plugins.entries.<plugin-id>.enabled: true`；如果你的設定使用
`plugins.allow`，也請在其中加入相同的外掛 ID。此預設拒絕規則
也適用於頻道設定明確以來源為工作區的外掛為目標，
僅載入其設定功能的情況，因此只要該工作區外掛仍處於停用狀態或遭允許清單排除，
本機頻道外掛設定程式碼就不會執行。連結安裝
和明確的 `plugins.load.paths` 項目，則會依其
解析後的外掛來源遵循一般政策。請參閱
[設定外掛政策](/zh-TW/tools/plugin#configure-plugin-policy)
和[設定參考](/zh-TW/gateway/configuration-reference#plugins)。

在 npm 安裝時使用 `--pin`，可將解析後的確切規格（`name@version`）儲存至受管理的外掛索引，同時保留預設不固定版本的行為。
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
  從表格檢視切換為逐外掛詳細資料行，包含格式／來源／起源／版本／啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清單，以及登錄檔診斷資訊和套件相依項目安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久保存的本機外掛登錄；若登錄不存在或無效，則使用僅由資訊清單衍生的備援資料。它適合用來檢查外掛是否已安裝、啟用，並且是否可供冷啟動規劃看見，但不會即時探測已在執行中的閘道程序。變更外掛程式碼、啟用狀態、鉤子原則或 `plugins.load.paths` 後，必須重新啟動為該頻道提供服務的閘道，才會執行新的 `register(api)` 程式碼或鉤子。若為遠端／容器部署，請確認重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝程序。

`plugins list --json` 會納入每個外掛在 `package.json`
`dependencies` 和 `optionalDependencies` 中的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於外掛的一般節點 `node_modules` 查找路徑中；它
不會匯入外掛執行階段程式碼、執行套件管理員或修復遺失的
相依套件。
</Note>

如果啟動記錄顯示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，
請使用列出的外掛 ID 執行 `openclaw plugins list --enabled --verbose` 或
`openclaw plugins inspect <id>`，以確認外掛
ID，並將受信任的 ID 複製到 `openclaw.json` 中的 `plugins.allow`。當
警告可以列出所有已探索到的外掛時，會顯示可直接貼上的
`plugins.allow` 片段，其中已包含這些 ID。如果外掛載入時
沒有安裝／載入路徑來源資訊，請檢查該外掛 ID，然後將
受信任的 ID 固定在 `plugins.allow` 中，或從受信任的來源重新安裝外掛，
讓 OpenClaw 記錄安裝來源資訊。

若要在封裝的 Docker 映像中處理隨附外掛，請將外掛
原始碼目錄繫結掛載至對應的封裝原始碼路徑，例如
`/app/extensions/synology-chat`。OpenClaw 會在
`/app/dist/extensions/synology-chat` 之前探索到該掛載的原始碼覆蓋層；單純複製的原始碼目錄
仍不會生效，因此一般封裝安裝仍會使用已編譯的 dist。

若要偵錯執行階段鉤子：

- `openclaw plugins inspect <id> --runtime --json` 會顯示模組載入檢查階段所註冊的鉤子與診斷資訊。執行階段檢查絕不會安裝相依套件；請使用 `openclaw doctor --fix` 清理舊版相依套件狀態，或復原設定所參照但遺失且可下載的外掛。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的閘道 URL／設定檔、服務／程序提示、設定路徑及 RPC 健康狀態。
- 非隨附的對話鉤子（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

### 外掛索引

外掛安裝中繼資料是由機器管理的狀態，而非使用者設定。安裝和更新會將其寫入使用中 OpenClaw 狀態目錄下的共用 SQLite 狀態資料庫。`installed_plugin_index` 資料列會儲存持久的 `installRecords` 中繼資料，包括外掛資訊清單損壞或遺失的記錄，以及由資訊清單衍生、供 `openclaw plugins update`、解除安裝、診斷和冷外掛登錄使用的快取。

`plugins.installs` 是已淘汰的手動編寫設定介面。執行階段和更新命令只會讀取 SQLite 已安裝外掛索引。在一般執行階段使用前，請執行 `openclaw doctor --fix`，將舊版設定記錄匯入索引並移除已淘汰的鍵。

## 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` 會從 `plugins.entries`、持久保存的外掛索引、外掛允許／拒絕清單項目，以及適用時所連結的 `plugins.load.paths` 項目中移除外掛記錄。除非設定了 `--keep-files`，否則解除安裝也會移除受追蹤的受管理安裝目錄，但僅限該目錄解析後位於 OpenClaw 的外掛擴充根目錄內。如果外掛目前占用 `memory` 或 `contextEngine` 插槽，該插槽會重設為預設值（記憶體使用 `memory-core`，情境引擎使用 `legacy`）。

`uninstall` 會顯示將移除內容的預覽，然後在進行變更前提示 `Uninstall plugin "<id>"?`。傳入 `--force` 可跳過確認提示（適合指令碼和非互動式執行）；若未傳入，解除安裝需要互動式 TTY。`--dry-run` 會顯示相同的預覽，然後直接結束，不提示也不進行任何變更。

<Note>
`--keep-config` 是 `--keep-files` 的已淘汰別名，目前仍受支援。
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

更新會套用至受管理外掛索引中受追蹤的外掛安裝，以及 `hooks.internal.installs` 中受追蹤的鉤子套件安裝。更新會重複使用使用者安裝外掛時已選擇的來源，因此不需要再次確認來源。

<AccordionGroup>
  <Accordion title="解析外掛 ID 與 npm 規格">
    傳入外掛 ID 時，OpenClaw 會重複使用該外掛已記錄的安裝規格。這表示先前儲存的 dist-tag（例如 `@beta`）和明確固定的版本，在之後執行 `update <id>` 時仍會繼續使用。

    在 `update <id> --dry-run` 期間，明確固定版本的 npm 安裝會維持固定。如果 OpenClaw 也能解析該套件的登錄預設發布線，且該預設發布線比已安裝的固定版本更新，試執行會回報此固定狀態，並顯示明確的 `@latest` 套件更新命令，以跟隨登錄的預設發布線。

    此指定目標更新規則與大量 `openclaw plugins update --all` 維護路徑不同。大量更新仍會遵循一般受追蹤的安裝規格，但受信任的官方 OpenClaw 外掛記錄可以同步至目前的官方目錄目標，而不會停留在過時且明確指定的官方套件版本。若你刻意要讓明確版本或標記的官方規格保持不變，請使用指定目標的 `update <id>`。

    對於 npm 安裝，你也可以傳入帶有 dist-tag 或明確版本的 npm 套件規格。OpenClaw 會將該套件名稱解析回受追蹤的外掛記錄、更新已安裝的外掛，並記錄新的 npm 規格，供之後以 ID 為基礎的更新使用。

    傳入不含版本或標記的 npm 套件名稱，也會解析回受追蹤的外掛記錄。當外掛已固定至明確版本，而你想將其移回登錄的預設發布線時，請使用此方式。

  </Accordion>
  <Accordion title="Beta 頻道更新">
    除非傳入新規格，指定目標的 `openclaw plugins update <id-or-npm-spec>` 會重複使用受追蹤的外掛規格。大量 `openclaw plugins update --all` 將受信任的官方外掛記錄同步至官方目錄目標時，會使用已設定的 `update.channel`，因此 Beta 頻道安裝可以維持在 Beta 發布線，而不會在未提示的情況下正規化為 stable/latest。

    `openclaw update` 也知道目前使用中的 OpenClaw 更新頻道：在 Beta 頻道上，預設發布線的 npm 和 ClawHub 外掛記錄會先嘗試 `@beta`。如果不存在外掛 Beta 版本，便會退回已記錄的 default/latest 規格；如果 Beta 套件存在但未通過安裝驗證，npm 外掛也會退回。此備援會以警告回報，且不會導致核心更新失敗。在指定目標的更新中，明確版本和明確標記會持續固定至該選擇器。

  </Accordion>
  <Accordion title="版本檢查與完整性偏移">
    執行即時 npm 更新前，OpenClaw 會根據 npm 登錄中繼資料檢查已安裝的套件版本。如果已安裝版本和已記錄的成品識別資訊都已符合解析出的目標，便會跳過更新，不會下載、重新安裝或重寫 `openclaw.json`。

    如果存在已儲存的完整性雜湊，而擷取到的成品雜湊發生變化，OpenClaw 會將其視為 npm 成品偏移。互動式 `openclaw plugins update` 命令會顯示預期與實際雜湊，並在繼續前要求確認。除非呼叫端提供明確的繼續原則，否則非互動式更新輔助工具會採取失敗關閉策略。

  </Accordion>
  <Accordion title="更新時使用 --dangerously-force-unsafe-install">
    為維持相容性，`plugins update` 也接受 `--dangerously-force-unsafe-install`，但它已淘汰，且不再改變外掛更新行為。操作員 `security.installPolicy` 仍可封鎖更新；外掛 `before_install` 鉤子僅適用於已載入外掛鉤子的程序。
  </Accordion>
  <Accordion title="更新時使用 --acknowledge-clawhub-risk">
    由社群 ClawHub 支援的外掛更新會在下載替換套件前，執行與安裝相同的精確版本信任檢查。如果經過審查的自動化應在所選 ClawHub 版本出現高風險信任警告時繼續執行，請使用 `--acknowledge-clawhub-risk`。官方 ClawHub 套件和隨附的 OpenClaw 外掛來源會略過此版本信任提示。
  </Accordion>
</AccordionGroup>

## 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

依預設，檢查功能會在不匯入外掛執行階段的情況下，顯示識別資訊、載入狀態、來源、資訊清單功能、原則旗標、診斷、安裝中繼資料、套件功能，以及偵測到的 MCP 或 LSP 伺服器支援。JSON 輸出包含外掛資訊清單合約，例如 `contracts.agentToolResultMiddleware` 和 `contracts.trustedToolPolicies`，讓操作員能在啟用或重新啟動外掛前稽核受信任介面的宣告。加入 `--runtime` 可載入外掛模組，並包含已註冊的鉤子、工具、命令、服務、閘道方法和 HTTP 路由。執行階段檢查會直接回報遺失的外掛相依套件；安裝和修復仍由 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 處理。

外掛擁有的命令列介面命令通常會安裝為根層級的 `openclaw` 命令群組，但外掛也可以在核心父命令下註冊巢狀命令，例如 `openclaw nodes`。當 `inspect --runtime` 顯示 `cliCommands` 下的命令後，請在所列路徑執行該命令；例如，註冊 `demo-git` 的外掛可以使用 `openclaw demo-git ping` 驗證。

每個外掛會依照其在執行階段實際註冊的內容分類：

| 形態               | 意義                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | 恰好一種功能類型（例如僅提供者外掛）         |
| `hybrid-capability` | 超過一種功能類型（例如文字 + 語音 + 圖片）       |
| `hook-only`         | 僅有鉤子，沒有功能、工具、命令、服務或路由 |
| `non-capability`    | 有工具／命令／服務，但沒有功能                       |

如需功能模型的詳細資訊，請參閱[外掛形態](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合用於指令碼和稽核的機器可讀報告。`inspect --all` 會呈現涵蓋所有部署實例的表格，其中包含形態、功能種類、相容性通知、套件功能和鉤子摘要欄。`info` 是 `inspect` 的別名。
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報外掛載入錯誤、資訊清單／探索診斷、相容性通知，以及外掛插槽遺失等過時的外掛設定參照。當安裝樹和外掛設定皆無問題時，會顯示 `No plugin issues detected.`；如果仍有過時設定，但安裝樹在其他方面健康，摘要會明確說明，而不會暗示外掛整體完全健康。

如果已設定的外掛存在於磁碟上，但遭載入器的路徑安全檢查封鎖，設定驗證會保留該外掛項目，並將其回報為 `present but blocked`。請修正前面指出外掛遭封鎖的診斷問題，例如路徑擁有權或所有人皆可寫入的權限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 設定。

若發生模組結構錯誤，例如缺少 `register`/`activate` 匯出，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出結構摘要。

## 登錄檔

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機外掛登錄檔是 OpenClaw 持久保存的冷讀取模型，用於記錄已安裝外掛的身分、啟用狀態、來源中繼資料及貢獻項目的擁有權。一般啟動、提供者擁有者查詢、頻道設定分類及外掛清單都可讀取此登錄檔，而無須匯入外掛執行階段模組。

使用 `plugins registry` 檢查持久保存的登錄檔是否存在、為最新狀態或已過期。使用 `--refresh`，根據持久保存的外掛索引、設定原則及資訊清單／套件中繼資料重建登錄檔。這是修復途徑，而非執行階段啟用途徑。

`openclaw doctor --fix` 也會修復登錄檔周邊的受管理 npm 漂移。如果受管理外掛 npm 專案或舊版扁平受管理 npm 根目錄下，存在孤立或已復原的 `@openclaw/*` 套件，且該套件遮蔽了內建外掛，doctor 會移除該過期套件並重建登錄檔，讓啟動程序依照內建資訊清單進行驗證。當具權威性的安裝記錄選取某個受管理世代，但仍殘留較舊的扁平目錄或世代目錄時，doctor 會停用這些過期的目錄樹，待閘道重新啟動後進行清除。doctor 也會將主機的 `openclaw` 套件重新連結至宣告 `peerDependencies.openclaw` 的受管理 npm 外掛，使 `openclaw/plugin-sdk/*` 等套件本機執行階段匯入在更新或 npm 修復後仍可解析。

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

`plugins marketplace entries` 會列出已設定 OpenClaw 市集摘要中的項目。預設會嘗試使用託管摘要，若失敗則改用最近接受的快照或內建資料。使用 `--feed-profile <name>` 讀取特定的已設定設定檔，使用 `--feed-url <url>` 讀取明確指定的託管摘要 URL，並使用 `--offline` 在不擷取摘要的情況下讀取最近接受的快照。

`plugins marketplace refresh` 會重新整理已設定的託管摘要快照，並回報 OpenClaw 接受的是託管資料、託管快照，還是內建備援資料。若呼叫端要求命令只在全新的託管承載資料符合固定的總和檢查碼時才成功，請使用 `--expected-sha256`。

市集 `list` 接受本機市集路徑、`marketplace.json` 路徑、`owner/repo` 之類的 GitHub 簡寫、GitHub 儲存庫 URL 或 git URL。`--json` 會輸出解析後的來源標籤，以及剖析後的市集資訊清單和外掛項目。

市集重新整理會載入託管的 OpenClaw 市集摘要，並將
經驗證的回應持久保存為本機託管摘要快照。未指定選項時，會使用
已設定的預設摘要設定檔。使用 `--feed-profile <name>` 重新整理
特定的已設定設定檔，使用 `--feed-url <url>` 重新整理明確指定的託管
摘要 URL，使用 `--expected-sha256 <sha256>` 要求承載資料的總和檢查碼相符
（`sha256:<hex>` 或純 64 字元十六進位摘要），並使用 `--json` 取得
機器可讀的輸出。明確指定的託管摘要 URL 不得包含
認證資訊、查詢字串或片段。未固定總和檢查碼的重新整理可以回報
託管快照或內建備援結果，而不會使命令失敗。固定總和檢查碼的
重新整理只有在接受全新的託管承載資料時才會成功，而託管
重新整理成功後，如果 OpenClaw 無法持久保存經驗證的快照，仍會判定失敗。

## 相關內容

- [建置外掛](/zh-TW/plugins/building-plugins)
- [命令列介面參考](/zh-TW/cli)
- [ClawHub](/zh-TW/clawhub)
