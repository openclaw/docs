---
read_when:
    - 您想安裝或管理閘道外掛或相容套件
    - 您想要建立或驗證一個簡單的工具外掛
    - 你想要偵錯外掛載入失敗
sidebarTitle: Plugins
summary: '`openclaw plugins` 的命令列介面參考（init、build、validate、list、install、marketplace、uninstall、enable/disable、doctor）'
title: 外掛
x-i18n:
    generated_at: "2026-07-06T10:49:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

管理閘道外掛、鉤子套件，以及相容套件組。

<CardGroup cols={2}>
  <Card title="外掛系統" href="/zh-TW/tools/plugin">
    終端使用者安裝、啟用和疑難排解外掛的指南。
  </Card>
  <Card title="管理外掛" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝和發布的快速範例。
  </Card>
  <Card title="外掛套件組" href="/zh-TW/plugins/bundles">
    套件組相容性模型。
  </Card>
  <Card title="外掛資訊清單" href="/zh-TW/plugins/manifest">
    資訊清單欄位和設定結構描述。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security">
    外掛安裝的安全性強化。
  </Card>
</CardGroup>

## 指令

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

若要調查安裝、檢查、解除安裝或重新整理登錄檔速度緩慢的問題，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行該指令。追蹤會將階段計時寫入 stderr，並保持 JSON 輸出可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式中（`OPENCLAW_NIX_MODE=1`），`openclaw.json` 是不可變的。`install`、`update`、`uninstall`、`enable` 和 `disable` 都會拒絕執行。請改為編輯此安裝的 Nix 來源（nix-openclaw 的 `programs.openclaw.config` 或 `instances.<name>.config`），然後重新建置。請參閱 agent-first [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
隨附外掛會隨 OpenClaw 一起提供。部分預設啟用（例如隨附模型提供者、隨附語音提供者，以及隨附瀏覽器外掛）；其他則需要 `plugins enable`。

原生 OpenClaw 外掛會提供 `openclaw.plugin.json`，其中含有內嵌 JSON Schema（`configSchema`，即使為空亦然）。相容套件組則改用自己的套件組資訊清單。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細列出/資訊輸出也會顯示套件組子類型（`codex`、`claude` 或 `cursor`），以及偵測到的套件組能力。
</Note>

## 作者

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` 預設會建立最小化的 TypeScript 工具外掛。第一個引數是外掛 ID；`--name` 會設定顯示名稱。OpenClaw 會使用該 ID 作為預設輸出目錄和套件命名。工具鷹架會使用 `defineToolPlugin`，並產生 `package.json` 指令碼 `plugin:build` 和 `plugin:validate`，用於建置後呼叫 `openclaw plugins build`/`validate`。

`plugins build` 會匯入已建置的進入點、讀取其靜態工具中繼資料、寫入 `openclaw.plugin.json`，並讓 `package.json` 的 `openclaw.extensions` 保持一致。`plugins validate` 會檢查產生的資訊清單、套件中繼資料和目前進入點匯出是否仍一致。完整的作者工作流程請參閱[工具外掛](/zh-TW/plugins/tool-plugins)。

鷹架會寫入 TypeScript 原始碼，但會從已建置的 `./dist/index.js` 進入點產生中繼資料，因此此工作流程也可搭配已發布的命令列介面使用。當進入點不是預設套件進入點時，請使用 `--entry <path>`。在 CI 中使用 `plugins build --check`，可在產生的中繼資料過期時失敗，而不重寫檔案。

### 提供者鷹架

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

提供者鷹架會建立一般的 OpenAI 相容模型提供者外掛，包含 API 金鑰驗證管線、執行 `clawhub package validate` 的 `npm run validate` 指令碼、ClawHub 套件中繼資料，以及手動觸發的 GitHub Actions 工作流程，以便未來透過 GitHub OIDC 進行受信任發布。提供者鷹架不會產生 Skills，也不會使用 `openclaw plugins build`/`validate`；這些指令適用於工具鷹架的產生中繼資料路徑。

發布前，請將預留位置 API 基礎 URL、模型目錄、文件路由、認證文字和 README 文案替換為真實提供者詳細資訊。請使用產生的 README 進行首次 ClawHub 發布和受信任發布者設定。

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

維護者測試設定期間安裝時，可以用受防護的環境變數覆寫自動外掛安裝來源。請參閱[外掛安裝覆寫](/zh-TW/plugins/install-overrides)。

<Warning>
在啟動切換期間，裸套件名稱預設會從 npm 安裝，除非它們符合隨附或官方外掛 ID；在這種情況下，OpenClaw 會使用該本機/官方副本，而不會連到 npm 登錄檔。當你刻意需要外部 npm 套件時，請使用 `npm:<package>`。ClawHub 請使用 `clawhub:<package>`。請將外掛安裝視為執行程式碼；優先使用釘選版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 `code-plugin` 和 `bundle-plugin` 套件（不是 Skills；請使用 `openclaw skills search` 搜尋那些項目）。預設 `--limit` 為 20，上限為 100。它只會讀取遠端目錄：不檢查本機狀態、不變更設定、不安裝套件，也不載入外掛執行階段。結果包含 ClawHub 套件名稱、系列、通道、版本、摘要，以及像 `openclaw plugins install clawhub:<package>` 這樣的安裝提示。

<Note>
ClawHub 是大多數外掛的主要散布與探索介面。npm 仍是受支援的備援和直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` 外掛套件已再次發布到 npm；請參閱 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 上的目前清單，或[外掛清冊](/zh-TW/plugins/plugin-inventory)。穩定版安裝使用 `latest`。Beta 通道的安裝與更新會在可用時優先使用 npm `beta` dist-tag，否則退回 `latest`。在延伸穩定通道上，具有裸/預設或 `latest` 意圖的官方 npm 外掛會解析為確切已安裝的核心版本。精確釘選和明確非 `latest` 標籤、第三方套件，以及非 npm 來源不會被重寫。
</Note>

<AccordionGroup>
  <Accordion title="設定包含與無效設定修復">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該被包含的檔案，並讓 `openclaw.json` 保持不變。根包含、包含陣列，以及帶有同層覆寫的包含會失敗並關閉，而不會展平。支援的形狀請參閱[設定包含](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會失敗並關閉，並告訴你先執行 `openclaw doctor --fix`。在閘道啟動和熱重新載入期間，無效外掛設定會像任何其他無效設定一樣失敗並關閉；`openclaw doctor --fix` 可以隔離無效的外掛項目。唯一記錄在文件中的安裝時例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的外掛所提供的狹窄隨附外掛復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝相對於更新">
    `--force` 會重用現有安裝目標，並就地覆寫已安裝的外掛或鉤子套件。當你有意從新的本機路徑、封存檔、ClawHub 套件或 npm 成品重新安裝同一個 ID 時使用。對於已追蹤 npm 外掛的例行升級，請優先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的外掛 ID 執行 `plugins install`，OpenClaw 會停止，並指向 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時，指向 `plugins install <package> --force`。`--force` 不支援與 `--link` 搭配使用。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 只套用於 npm 安裝，並記錄解析後的確切 `<name>@<version>`。它不支援 `git:` 安裝（請改為在規格中釘選 ref，例如 `git:github.com/acme/plugin@v1.2.3`），也不支援 `--marketplace`（市集安裝會持久保存市集來源中繼資料，而不是 npm 規格）。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 已棄用，現在不會執行任何動作。OpenClaw 不再為外掛安裝執行內建的安裝期間危險程式碼封鎖。

    當需要主機特定的安裝政策時，請使用操作員擁有的 `security.installPolicy` 介面。外掛 `before_install` 鉤子是外掛執行階段生命週期鉤子，不是命令列介面安裝的主要政策邊界。

    如果你在 ClawHub 發布的外掛遭登錄檔掃描隱藏或封鎖，請使用 [ClawHub 發布](/zh-TW/clawhub/publishing)中的發布者步驟。`--dangerously-force-unsafe-install` 不會要求 ClawHub 重新掃描外掛，也不會讓遭封鎖的發行版本公開。

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    社群 ClawHub 安裝會在下載前檢查所選發行版本的信任記錄。如果 ClawHub 停用該發行版本的下載、回報惡意掃描結果，或將該發行版本置於封鎖性審核狀態（隔離、撤銷），無論是否使用此旗標，OpenClaw 都會直接拒絕。對於非封鎖性的高風險掃描狀態或審核狀態，OpenClaw 會顯示信任詳細資訊，並在繼續前要求確認。

    只有在審閱 ClawHub 警告並決定不透過互動提示繼續後，才使用 `--acknowledge-clawhub-risk`。擱置或過期（尚未乾淨）的掃描結果會警告，但不需要確認。官方 ClawHub 套件和隨附 OpenClaw 外掛來源會完全略過此發行版本信任檢查。

  </Accordion>
  <Accordion title="鉤子套件與 npm 規格">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 之鉤子套件的介面。請使用 `openclaw hooks` 取得篩選後的鉤子可見性和逐鉤子啟用功能，而不是用於套件安裝。

    Npm 規格**僅限登錄檔**（套件名稱加上選用的**精確版本**或 **dist-tag**）。Git/URL/file 規格與 semver 範圍會被拒絕。為了安全，即使你的 shell 有全域 npm 安裝設定，依賴項安裝仍會在每個外掛一個受管理的 npm 專案中搭配 `--ignore-scripts` 執行。受管理的外掛 npm 專案會繼承 OpenClaw 套件層級的 npm `overrides`，因此主機安全性釘選也會套用到提升的外掛依賴項。

    使用 `npm:<package>` 讓 npm 解析明確化。裸套件規格在啟動轉換期間也會直接從 npm 安裝，除非它們符合官方外掛 ID。

    符合內建外掛的原始 `@openclaw/*` 規格會先解析為映像檔擁有的內建副本，然後才回退到 npm。例如，`openclaw plugins install @openclaw/discord@2026.5.20 --pin` 會使用目前 OpenClaw 建置中的內建 Discord 外掛，而不是建立受管理的 npm 覆寫。若要強制使用外部 npm 套件，請使用 `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`。

    裸規格與 `@latest` 會停留在穩定軌道。OpenClaw 日期戳記修正版，例如 `2026.5.3-1`，在這項檢查中算作穩定版。如果 npm 將任一形式解析為預發行版，OpenClaw 會停止並要求你使用預發行標籤（`@beta`/`@rc`）或精確的預發行版本（`@1.2.3-beta.4`）明確選擇加入。

    對於沒有精確版本的 npm 安裝（`npm:<package>` 或 `npm:<package>@latest`），OpenClaw 會在安裝前檢查解析出的套件中繼資料。如果最新的穩定套件需要較新的 OpenClaw 外掛 API 或最低主機版本，OpenClaw 會檢查較舊的穩定版本，並改為安裝最新的相容發行版。精確版本與明確的 dist-tag 會保持嚴格：不相容的選擇會失敗，並要求你升級 OpenClaw 或選擇相容版本。

    如果裸安裝規格符合官方外掛 ID（例如 `diffs`），OpenClaw 會直接安裝目錄項目。若要安裝同名的 npm 套件，請使用明確的 scoped 規格（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 儲存庫">
    使用 `git:<repo>` 直接從 git 儲存庫安裝。支援的形式：`git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` 複製 URL。新增 `@<ref>` 或 `#<ref>`，可在安裝前簽出分支、標籤或提交。

    Git 安裝會複製到暫存目錄，在提供要求的 ref 時簽出該 ref，然後使用一般外掛目錄安裝程式，因此資訊清單驗證、操作者安裝政策、套件管理器安裝工作與安裝記錄的行為都會像 npm 安裝一樣。記錄的 git 安裝包含來源 URL/ref 加上解析出的提交，因此 `openclaw plugins update` 之後可以重新解析來源。

    從 git 安裝後，使用 `openclaw plugins inspect <id> --runtime --json` 驗證執行階段註冊，例如閘道方法與命令列介面命令。如果外掛使用 `api.registerCli` 註冊了命令列介面根目錄，請透過 OpenClaw 根命令列介面直接執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw 外掛封存檔必須在解壓出的外掛根目錄包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的封存檔會在 OpenClaw 寫入安裝記錄前被拒絕。

    當檔案是 npm-pack tarball，且你想使用與登錄檔安裝相同的每外掛受管理 npm 專案路徑時，請使用 `npm-pack:<path.tgz>`，
    包括 `package-lock.json` 驗證、提升的依賴項掃描，
    以及 npm 安裝記錄。一般封存檔路徑仍會作為本機
    封存檔安裝在外掛 extensions 根目錄下。

    也支援 Claude 市集安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝會使用明確的 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在啟動轉換期間，npm 安全的裸外掛規格預設會從 npm 安裝，除非它們符合官方外掛 ID：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 讓僅限 npm 的解析明確化：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查公告的外掛 API / 最低閘道相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載版本化的 npm-pack `.tgz`，驗證 ClawHub 摘要標頭與成品摘要，然後透過一般封存檔路徑安裝。沒有 ClawPack 中繼資料的較舊 ClawHub 版本仍會透過舊版套件封存檔驗證路徑安裝。記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm 完整性、npm shasum、tarball 名稱，以及 ClawPack 摘要事實，以供之後更新。
未版本化的 ClawHub 安裝會保留未版本化的記錄規格，因此 `openclaw plugins update` 可以跟隨較新的 ClawHub 發行版；明確版本或標籤選擇器，例如 `clawhub:pkg@1.2.3` 與 `clawhub:pkg@beta`，會保持釘選到該選擇器。

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
    對於從 GitHub 或 git 載入的遠端市集，外掛項目必須留在複製出的市集儲存庫內。OpenClaw 會接受來自該儲存庫的相對路徑來源，並拒絕遠端資訊清單中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑外掛來源。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw 外掛（`openclaw.plugin.json`）
- Codex 相容套件組合（`.codex-plugin/plugin.json`）
- Claude 相容套件組合（`.claude-plugin/plugin.json`，或在該資訊清單檔案不存在時使用預設 Claude 元件版面配置）
- Cursor 相容套件組合（`.cursor-plugin/plugin.json`）

受管理的本機安裝必須是外掛目錄或封存檔。獨立的 `.js`、
`.mjs`、`.cjs` 與 `.ts` 外掛檔案不會由 `plugins install` 複製到受管理的外掛
根目錄，也不會因直接放在
`~/.openclaw/extensions` 或 `<workspace>/.openclaw/extensions` 中而載入；那些
自動探索的根目錄會載入外掛套件或套件組合目錄，並略過
頂層指令碼檔案作為本機輔助工具。請改在
`plugins.load.paths` 中明確列出獨立檔案。

<Note>
相容套件組合會安裝到一般外掛根目錄，並參與相同的列表/資訊/啟用/停用流程。今天支援套件組合 Skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / 資訊清單宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的套件組合能力會顯示在診斷/資訊中，但尚未接入執行階段執行。
</Note>

使用 `-l`/`--link` 指向本機外掛目錄而不複製它（新增
到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--link` 不支援搭配 `--force`（連結外掛會直接指向來源
路徑，因此沒有任何可就地覆寫的內容）、`--marketplace`，或
`git:` 安裝，且它需要一個已存在的本機路徑。

<Note>
從工作區 extensions 根目錄探索到的工作區來源外掛，在明確啟用前
不會匯入或執行。對於本機開發，
請執行 `openclaw plugins enable <plugin-id>` 或設定
`plugins.entries.<plugin-id>.enabled: true`；如果你的設定使用
`plugins.allow`，也請在其中包含相同的外掛 ID。這項失敗關閉規則
也適用於通道設定明確針對工作區來源外掛進行
僅設定載入時，因此在該工作區外掛仍停用或排除於允許清單之外時，本機通道外掛設定程式碼
不會執行。連結安裝
與明確的 `plugins.load.paths` 項目會依其
解析出的外掛來源遵循一般政策。請參閱
[設定外掛政策](/zh-TW/tools/plugin#configure-plugin-policy)
與[設定參考](/zh-TW/gateway/configuration-reference#plugins)。

在 npm 安裝上使用 `--pin`，可將解析出的精確規格（`name@version`）儲存在受管理的外掛索引中，同時保留預設的未釘選行為。
</Note>

## 列表

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
  從表格檢視切換為每個外掛的詳細行，包含格式/來源/起源/版本/啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清冊，加上登錄檔診斷與套件依賴項安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久化的本機外掛登錄檔，並在登錄檔遺失或無效時使用僅從資訊清單衍生的回退。它可用於檢查外掛是否已安裝、已啟用，並且對冷啟動規劃可見，但它不是對已執行中閘道程序的即時執行階段探測。變更外掛程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 後，請重新啟動服務該通道的閘道，再預期新的 `register(api)` 程式碼或 hook 會執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝器程序。

`plugins list --json` 會包含每個外掛來自 `package.json`
`dependencies` 與 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於外掛一般 Node `node_modules` 查找路徑中；它
不會匯入外掛執行階段程式碼、執行套件管理器，或修復遺失的
依賴項。
</Note>

如果啟動日誌顯示 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，
請執行 `openclaw plugins list --enabled --verbose` 或
搭配列出的外掛 ID 執行 `openclaw plugins inspect <id>`，以確認外掛
ID，並將信任的 ID 複製到 `openclaw.json` 中的 `plugins.allow`。當
警告可以列出每個探索到的外掛時，它會列印可直接貼上的
`plugins.allow` 片段，且已包含那些 ID。如果外掛在
沒有安裝/載入路徑來源證明的情況下載入，請檢查該外掛 ID，然後將
信任的 ID 釘選在 `plugins.allow` 中，或從信任來源重新安裝外掛，
讓 OpenClaw 記錄安裝來源證明。

對於封裝 Docker 映像檔內的內建外掛工作，請將外掛
來源目錄 bind-mount 到相符的封裝來源路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會先於
`/app/dist/extensions/synology-chat` 探索該掛載的來源覆蓋層；單純複製的來源目錄
會保持無作用，因此一般封裝安裝仍會使用編譯後的 dist。

對於執行階段 hook 偵錯：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自模組載入檢查流程的已註冊鉤子與診斷。執行階段檢查絕不會安裝相依套件；請使用 `openclaw doctor --fix` 清理舊版相依套件狀態，或復原設定中引用但缺少的可下載外掛。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的閘道 URL/設定檔、服務/程序提示、設定路徑與 RPC 健康狀態。
- 非內建對話鉤子（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

### 外掛索引

外掛安裝中繼資料是由機器管理的狀態，不是使用者設定。安裝與更新會將它寫入作用中 OpenClaw 狀態目錄下的共用 SQLite 狀態資料庫。`installed_plugin_index` 資料列會儲存持久的 `installRecords` 中繼資料，包括損壞或缺少外掛 manifest 的記錄，以及由 manifest 衍生、供 `openclaw plugins update`、解除安裝、診斷與冷外掛登錄使用的冷登錄快取。

當 OpenClaw 在設定中看到已發布的舊版 `plugins.installs` 記錄時，執行階段讀取會將它們視為相容性輸入，而不重寫 `openclaw.json`。明確的外掛寫入與 `openclaw doctor --fix` 會將這些記錄移入外掛索引，並在允許寫入設定時移除該設定鍵；如果任一寫入失敗，設定記錄會被保留，確保安裝中繼資料不會遺失。

## 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` 會在適用時從 `plugins.entries`、持久化外掛索引、外掛允許/拒絕清單項目，以及連結的 `plugins.load.paths` 項目中移除外掛記錄。除非設定 `--keep-files`，否則解除安裝也會移除受追蹤的受管理安裝目錄，但前提是它解析後位於 OpenClaw 的外掛 extensions 根目錄內。如果該外掛目前擁有 `memory` 或 `contextEngine` 插槽，該插槽會重設為預設值（記憶體為 `memory-core`，脈絡引擎為 `legacy`）。

`uninstall` 會列印將移除內容的預覽，然後在變更前提示 `Uninstall plugin "<id>"?`。傳入 `--force` 可略過確認提示（適合指令碼與非互動式執行）；若未使用它，解除安裝需要互動式 TTY。`--dry-run` 會列印相同預覽，並在不提示或變更任何內容的情況下結束。

<Note>
`--keep-config` 支援作為 `--keep-files` 的已棄用別名。
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

更新會套用到受管理外掛索引中受追蹤的外掛安裝，以及 `hooks.internal.installs` 中受追蹤的鉤子套件安裝。

<AccordionGroup>
  <Accordion title="解析外掛 id 與 npm 規格">
    當你傳入外掛 id 時，OpenClaw 會重用該外掛記錄的安裝規格。這表示先前儲存的 dist-tag（例如 `@beta`）與精確釘選版本，會在後續 `update <id>` 執行中繼續使用。

    在 `update <id> --dry-run` 期間，精確釘選的 npm 安裝會維持釘選。如果 OpenClaw 也能解析該套件的登錄預設線，且該預設線比已安裝的釘選版本更新，試執行會回報該釘選，並列印明確的 `@latest` 套件更新命令，以跟隨登錄預設線。

    該目標更新規則不同於大量 `openclaw plugins update --all` 維護路徑。大量更新仍會尊重一般受追蹤安裝規格，但受信任的官方 OpenClaw 外掛記錄可以同步到目前官方型錄目標，而不是停留在過時的精確官方套件上。當你刻意想讓精確或帶標籤的官方規格保持不變時，請使用目標式 `update <id>`。

    對於 npm 安裝，你也可以傳入包含 dist-tag 或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回受追蹤的外掛記錄、更新該已安裝外掛，並記錄新的 npm 規格供未來以 id 為基礎的更新使用。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回受追蹤的外掛記錄。當外掛被釘選到精確版本，而你想將它移回登錄的預設發行線時，請使用此方式。

  </Accordion>
  <Accordion title="Beta 通道更新">
    目標式 `openclaw plugins update <id-or-npm-spec>` 會重用受追蹤的外掛規格，除非你傳入新的規格。大量 `openclaw plugins update --all` 在將受信任的官方外掛記錄同步到官方型錄目標時，會使用已設定的 `update.channel`，因此 beta 通道安裝可以留在 beta 發行線，而不會被靜默正規化為 stable/latest。

    `openclaw update` 也知道作用中的 OpenClaw 更新通道：在 beta 通道上，預設線 npm 與 ClawHub 外掛記錄會先嘗試 `@beta`。如果沒有外掛 beta 發行版本，它們會退回記錄的 default/latest 規格；npm 外掛在 beta 套件存在但安裝驗證失敗時也會退回。該退回會以警告回報，且不會導致核心更新失敗。精確版本與明確標籤會在目標式更新中維持釘選到該選擇器。

  </Accordion>
  <Accordion title="版本檢查與完整性漂移">
    在執行即時 npm 更新前，OpenClaw 會依 npm 登錄中繼資料檢查已安裝套件版本。如果已安裝版本與記錄的成品身分已符合解析後的目標，更新會略過，不會下載、重新安裝或重寫 `openclaw.json`。

    當存在已儲存的完整性雜湊，且擷取的成品雜湊發生變更時，OpenClaw 會將其視為 npm 成品漂移。互動式 `openclaw plugins update` 命令會列印預期與實際雜湊，並在繼續前要求確認。非互動式更新輔助工具會預設失敗關閉，除非呼叫端提供明確的繼續政策。

  </Accordion>
  <Accordion title="更新時的 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也會為了相容性在 `plugins update` 上被接受，但它已被棄用，且不再變更外掛更新行為。操作者 `security.installPolicy` 仍可阻擋更新；外掛 `before_install` 鉤子只會套用於外掛鉤子已載入的程序。
  </Accordion>
  <Accordion title="更新時的 --acknowledge-clawhub-risk">
    由社群 ClawHub 支援的外掛更新，在下載替換套件前會執行與安裝相同的精確發行信任檢查。針對已審查、應在所選 ClawHub 發行版本具有高風險信任警告時繼續的自動化，請使用 `--acknowledge-clawhub-risk`。官方 ClawHub 套件與內建 OpenClaw 外掛來源會略過此發行信任提示。
  </Accordion>
</AccordionGroup>

## 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Inspect 預設不匯入外掛執行階段，即可顯示身分、載入狀態、來源、manifest 能力、政策旗標、診斷、安裝中繼資料、套件能力，以及任何偵測到的 MCP 或 LSP 伺服器支援。JSON 輸出包含外掛 manifest 合約，例如 `contracts.agentToolResultMiddleware` 與 `contracts.trustedToolPolicies`，讓操作者可在啟用或重新啟動外掛前稽核受信任介面宣告。加入 `--runtime` 以載入外掛模組，並包含已註冊鉤子、工具、命令、服務、閘道方法與 HTTP 路由。執行階段檢查會直接回報缺少的外掛相依套件；安裝與修復仍保留在 `openclaw plugins install`、`openclaw plugins update` 與 `openclaw doctor --fix`。

外掛擁有的命令列介面命令通常會安裝為根層級 `openclaw` 命令群組，但外掛也可以在核心父命令下註冊巢狀命令，例如 `openclaw nodes`。在 `inspect --runtime` 於 `cliCommands` 下顯示命令後，請在列出的路徑執行它；例如，註冊 `demo-git` 的外掛可使用 `openclaw demo-git ping` 驗證。

每個外掛都會依其在執行階段實際註冊的內容分類：

| 形態                | 含義                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | 恰好一種能力類型（例如僅提供者的外掛）                            |
| `hybrid-capability` | 超過一種能力類型（例如文字 + 語音 + 影像）                        |
| `hook-only`         | 只有鉤子，沒有能力、工具、命令、服務或路由                        |
| `non-capability`    | 有工具/命令/服務，但沒有能力                                      |

請參閱[外掛形態](/zh-TW/plugins/architecture#plugin-shapes)，深入了解能力模型。

<Note>
`--json` 旗標會輸出適合指令碼與稽核的機器可讀報告。`inspect --all` 會呈現整體外掛群的表格，包含形態、能力種類、相容性通知、套件能力與鉤子摘要欄位。`info` 是 `inspect` 的別名。
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報外掛載入錯誤、manifest/探索診斷、相容性通知，以及過時外掛設定引用，例如缺少的外掛插槽。當安裝樹與外掛設定乾淨時，它會列印 `No plugin issues detected.` 如果仍有過時設定，但安裝樹在其他方面健康，摘要會如此說明，而不是暗示整體外掛健康狀態完全正常。

如果已設定外掛存在於磁碟上，但被載入器的路徑安全檢查阻擋，設定驗證會保留該外掛項目，並將它回報為 `present but blocked`。請修正前面的受阻外掛診斷，例如路徑擁有權或 world-writable 權限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 設定。

對於模組形態失敗，例如缺少 `register`/`activate` 匯出，請以 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出形態摘要。

## 登錄

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機外掛登錄是 OpenClaw 持久化的冷讀取模型，用於已安裝外掛身分、啟用狀態、來源中繼資料與貢獻擁有權。一般啟動、提供者擁有者查找、通道設定分類與外掛清單，都可以不匯入外掛執行階段模組而讀取它。

使用 `plugins registry` 檢查持久化登錄是否存在、目前有效或過時。使用 `--refresh` 從持久化外掛索引、設定政策與 manifest/package 中繼資料重建它。這是修復路徑，不是執行階段啟用路徑。

`openclaw doctor --fix` 也會修復與登錄相鄰的受管理 npm 漂移：如果受管理外掛 npm 專案下的孤立或已復原 `@openclaw/*` 套件，或舊版扁平受管理 npm 根目錄，遮蔽了內建外掛，doctor 會移除該過時套件並重建登錄，讓啟動能依內建 manifest 驗證。Doctor 也會將主機 `openclaw` 套件重新連結到宣告 `peerDependencies.openclaw` 的受管理 npm 外掛中，讓套件本機執行階段匯入（例如 `openclaw/plugin-sdk/*`）在更新或 npm 修復後能解析。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的破窗相容性開關，用於登錄讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；該環境變數退回僅供遷移推出期間的緊急啟動復原使用。
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

`plugins marketplace entries` 會列出已設定的 OpenClaw marketplace feed 中的項目。預設會嘗試使用託管的 feed，並在失敗時退回到最新接受的快照或內建資料。使用 `--feed-profile <name>` 讀取特定已設定的設定檔，使用 `--feed-url <url>` 讀取明確的託管 feed URL，並使用 `--offline` 在不擷取 feed 的情況下讀取最新接受的快照。

`plugins marketplace refresh` 會重新整理已設定的託管 feed 快照，並回報 OpenClaw 是否接受了託管資料、託管快照，或內建後援資料。當呼叫端需要命令在新的託管承載內容不符合固定校驗和時失敗，請使用 `--expected-sha256`。

Marketplace `list` 接受本機 marketplace 路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會列印解析後的來源標籤，以及剖析後的 marketplace manifest 和外掛項目。

Marketplace refresh 會載入託管的 OpenClaw marketplace feed，並將
驗證過的回應保存為本機託管 feed 快照。若未提供選項，會使用
已設定的預設 feed 設定檔。使用 `--feed-profile <name>` 重新整理
特定已設定的設定檔，使用 `--feed-url <url>` 重新整理明確的託管
feed URL，使用 `--expected-sha256 <sha256>` 要求相符的承載內容校驗和
（`sha256:<hex>` 或裸露的 64 字元十六進位摘要），並使用 `--json` 取得
機器可讀輸出。明確的託管 feed URL 不得包含
憑證、查詢字串或片段。未固定的重新整理可以回報
託管快照或內建後援結果，而不讓命令失敗。固定的
重新整理必須接受新的託管承載內容才會成功；若 OpenClaw 無法保存已驗證的快照，成功的託管
重新整理也會失敗。

## 相關

- [建置外掛](/zh-TW/plugins/building-plugins)
- [命令列介面參考](/zh-TW/cli)
- [ClawHub](/clawhub)
