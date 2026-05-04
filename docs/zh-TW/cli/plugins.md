---
read_when:
    - 你想安裝或管理 Gateway Plugin 或相容套件組合
    - 你想要偵錯 Plugin 載入失敗問題
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 參考（列出、安裝、市集、解除安裝、啟用/停用、診斷）'
title: Plugin
x-i18n:
    generated_at: "2026-05-04T09:37:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway Plugin、hook 套件包與相容套件組。

<CardGroup cols={2}>
  <Card title="Plugin system" href="/zh-TW/tools/plugin">
    安裝、啟用與疑難排解 Plugin 的終端使用者指南。
  </Card>
  <Card title="Manage plugins" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝與發布的快速範例。
  </Card>
  <Card title="Plugin bundles" href="/zh-TW/plugins/bundles">
    套件組相容性模型。
  </Card>
  <Card title="Plugin manifest" href="/zh-TW/plugins/manifest">
    資訊清單欄位與設定結構描述。
  </Card>
  <Card title="Security" href="/zh-TW/gateway/security">
    Plugin 安裝的安全強化。
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
```

若要調查緩慢的安裝、檢查、解除安裝或登錄重新整理，請搭配 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行命令。追蹤會將階段計時寫入 stderr，並讓 JSON 輸出保持可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
隨附的 Plugin 會與 OpenClaw 一起提供。有些預設啟用（例如隨附的模型提供者、隨附的語音提供者，以及隨附的瀏覽器 Plugin）；其他則需要執行 `plugins enable`。

原生 OpenClaw Plugin 必須提供 `openclaw.plugin.json`，並包含內嵌 JSON Schema（`configSchema`，即使是空的也一樣）。相容套件組則改用自己的套件組資訊清單。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細列出/資訊輸出也會顯示套件組子類型（`codex`、`claude` 或 `cursor`）以及偵測到的套件組功能。
</Note>

### 安裝

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
在啟動切換期間，裸套件名稱預設會從 npm 安裝。ClawHub 請使用 `clawhub:<package>`。請將 Plugin 安裝視同執行程式碼。建議使用釘選版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 Plugin 套件，並印出可直接安裝的套件名稱。它會搜尋 code-plugin 與 bundle-plugin 套件，而不是 Skills。若要搜尋 ClawHub Skills，請使用 `openclaw skills search`。

<Note>
ClawHub 是大多數 Plugin 的主要發佈與探索介面。npm 仍是受支援的備援與直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` Plugin 套件已重新發布到 npm；請在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或 [Plugin 清單](/zh-TW/plugins/plugin-inventory)查看目前清單。穩定版安裝使用 `latest`。Beta 通道安裝與更新會在 npm `beta` dist-tag 可用時優先使用該標籤，然後才回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該被包含的檔案，並保持 `openclaw.json` 不變。根層包含、包含陣列，以及帶有同層覆寫的包含都會封閉失敗，而不是攤平成單一內容。支援的形狀請參閱[設定包含](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會封閉失敗，並告訴你先執行 `openclaw doctor --fix`。在 Gateway 啟動與熱重新載入期間，無效的 Plugin 設定會像任何其他無效設定一樣封閉失敗；`openclaw doctor --fix` 可以隔離無效的 Plugin 項目。唯一記載的安裝時例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的 Plugin 所提供的狹窄隨附 Plugin 復原路徑。

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` 會重用現有安裝目標，並就地覆寫已安裝的 Plugin 或 hook 套件包。當你有意從新的本機路徑、封存檔、ClawHub 套件或 npm 成品重新安裝相同 id 時使用。對於已追蹤的 npm Plugin 的例行升級，建議使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 Plugin id 執行 `plugins install`，OpenClaw 會停止並指引你使用 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時，使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` 只適用於 npm 安裝。不支援搭配 `git:` 安裝；若你想要釘選來源，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它也不支援搭配 `--marketplace`，因為 marketplace 安裝會保留 marketplace 來源中繼資料，而不是 npm 規格。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是針對內建危險程式碼掃描器誤判的緊急選項。即使內建掃描器回報 `critical` 發現，它也允許安裝繼續，但它**不會**略過 Plugin `before_install` hook 政策阻擋，也**不會**略過掃描失敗。

    此 CLI 旗標適用於 Plugin 安裝/更新流程。由 Gateway 支援的 skill 相依性安裝會使用對應的 `dangerouslyForceUnsafeInstall` 請求覆寫，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

    如果你發布在 ClawHub 的 Plugin 被登錄掃描阻擋，請使用 [ClawHub](/zh-TW/tools/clawhub) 中的發布者步驟。

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` 也是安裝 hook 套件包的介面，這些套件包會在 `package.json` 中公開 `openclaw.hooks`。請使用 `openclaw hooks` 取得篩選後的 hook 可見性與個別 hook 啟用狀態，而不是用於套件安裝。

    npm 規格是**僅限登錄**（套件名稱 + 選用的**精確版本**或 **dist-tag**）。Git/URL/file 規格與 semver 範圍會被拒絕。為了安全，即使你的 shell 有全域 npm 安裝設定，相依性安裝也會以專案本機方式搭配 `--ignore-scripts` 執行。

    當你想明確使用 npm 解析時，請使用 `npm:<package>`。在啟動切換期間，裸套件規格也會直接從 npm 安裝。

    裸規格與 `@latest` 會保持在穩定軌道。OpenClaw 日期戳記修正版（例如 `2026.5.3-1`）在此檢查中屬於穩定版本。如果 npm 將其中任一解析為預發行版本，OpenClaw 會停止並要求你以預發行標籤（例如 `@beta`/`@rc`）或精確預發行版本（例如 `@1.2.3-beta.4`）明確選擇加入。

    如果裸安裝規格符合官方 Plugin id（例如 `diffs`），OpenClaw 會直接安裝目錄項目。若要安裝同名 npm 套件，請使用明確的 scoped 規格（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repositories">
    使用 `git:<repo>` 可直接從 git 儲存庫安裝。支援的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URL。加入 `@<ref>` 或 `#<ref>` 可在安裝前取出分支、標籤或 commit。

    Git 安裝會 clone 到暫存目錄，在有要求的 ref 時將其取出，然後使用一般 Plugin 目錄安裝器。這表示資訊清單驗證、危險程式碼掃描、套件管理器安裝工作與安裝記錄的行為會像 npm 安裝一樣。已記錄的 git 安裝會包含來源 URL/ref 以及已解析的 commit，讓 `openclaw plugins update` 之後可以重新解析來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證執行階段註冊，例如 gateway 方法與 CLI 命令。如果 Plugin 使用 `api.registerCli` 註冊了 CLI 根命令，請透過 OpenClaw 根 CLI 直接執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="Archives">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw Plugin 封存檔必須在解壓後的 Plugin 根目錄包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的封存檔會在 OpenClaw 寫入安裝記錄前被拒絕。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝會使用明確的 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在啟動切換期間，裸 npm 安全 Plugin 規格預設會從 npm 安裝：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可明確指定僅使用 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查公告的 Plugin API / 最低 gateway 相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載版本化 npm-pack `.tgz`，驗證 ClawHub digest 標頭與成品 digest，然後透過一般封存路徑安裝。沒有 ClawPack 中繼資料的較舊 ClawHub 版本仍會透過舊版套件封存驗證路徑安裝。已記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm integrity、npm shasum、tarball 名稱，以及 ClawPack digest 事實，以供之後更新。
未指定版本的 ClawHub 安裝會保留未指定版本的記錄規格，讓 `openclaw plugins update` 可以跟隨較新的 ClawHub 發行；明確版本或標籤選擇器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）則會保持釘選到該選擇器。

#### Marketplace 簡寫

當 marketplace 名稱存在於 Claude 位於 `~/.claude/plugins/known_marketplaces.json` 的本機登錄快取中時，請使用 `plugin@marketplace` 簡寫：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

當你想明確傳入 marketplace 來源時，請使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - 來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名稱
    - 本機 marketplace 根目錄或 `marketplace.json` 路徑
    - GitHub repo 簡寫，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    對於從 GitHub 或 git 載入的遠端 marketplace，Plugin 項目必須保留在複製下來的 marketplace repo 內。OpenClaw 會接受來自該 repo 的相對路徑來源，並拒絕遠端 manifest 中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑 Plugin 來源。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw plugins（`openclaw.plugin.json`）
- Codex 相容套件組合（`.codex-plugin/plugin.json`）
- Claude 相容套件組合（`.claude-plugin/plugin.json` 或預設 Claude 元件版面配置）
- Cursor 相容套件組合（`.cursor-plugin/plugin.json`）

<Note>
相容套件組合會安裝到一般 Plugin 根目錄，並參與相同的列出/資訊/啟用/停用流程。目前支援套件組合 Skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的套件組合功能會顯示在診斷/資訊中，但尚未接入 runtime 執行。
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
  只顯示已啟用的 plugins。
</ParamField>
<ParamField path="--verbose" type="boolean">
  從表格檢視切換為每個 Plugin 的詳細行，包含來源/起源/版本/啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清單，加上 registry 診斷與套件相依安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久化的本機 Plugin registry；當 registry 缺失或無效時，會使用僅由 manifest 推導出的 fallback。它可用來檢查某個 Plugin 是否已安裝、已啟用，並且對冷啟動規劃可見，但它不是對已在執行中的 Gateway 程序進行即時 runtime 探測。變更 Plugin 程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 之後，請重新啟動服務該通道的 Gateway，再期待新的 `register(api)` 程式碼或 hooks 執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝程序。

`plugins list --json` 會包含每個 Plugin 來自 `package.json`
`dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於該 Plugin 一般 Node `node_modules` 查找路徑上；它
不會匯入 Plugin runtime 程式碼、執行套件管理器，或修復缺失的
相依套件。
</Note>

`plugins search` 是遠端 ClawHub 目錄查詢。它不會檢查本機
狀態、變更 config、安裝套件，或載入 Plugin runtime 程式碼。搜尋
結果包含 ClawHub 套件名稱、family、channel、版本、摘要，以及
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

若要在封裝的 Docker 映像中處理內建 Plugin，請將 Plugin
來源目錄 bind-mount 到相符的封裝來源路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會先於
`/app/dist/extensions/synology-chat` 發現該掛載的來源
覆寫；單純複製的來源目錄會保持無作用，因此一般封裝安裝仍會使用已編譯的 dist。

若要偵錯 runtime hook：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自模組載入檢查流程的已註冊 hooks 與診斷。Runtime 檢查永遠不會安裝相依套件；請使用 `openclaw doctor --fix` 清理舊版相依狀態，或安裝缺失且已設定的可下載 plugins。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、服務/程序提示、config 路徑，以及 RPC 健康狀態。
- 非內建的對話 hooks（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免複製本機目錄（會加入 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援與 `--link` 搭配使用，因為連結式安裝會重用來源路徑，而不是覆寫受管理的安裝目標。

在 npm 安裝上使用 `--pin`，可將解析出的精確 spec（`name@version`）儲存在受管理的 Plugin 索引中，同時保留預設的未釘選行為。
</Note>

### Plugin 索引

Plugin 安裝中繼資料是由機器管理的狀態，不是使用者 config。安裝與更新會將它寫入作用中 OpenClaw 狀態目錄底下的 `plugins/installs.json`。其頂層 `installRecords` map 是安裝中繼資料的持久來源，其中包含毀損或缺失 Plugin manifest 的記錄。`plugins` 陣列是由 manifest 推導出的冷 registry 快取。該檔案包含請勿編輯警告，並由 `openclaw plugins update`、解除安裝、診斷，以及冷 Plugin registry 使用。

當 OpenClaw 在 config 中看到已出貨的舊版 `plugins.installs` 記錄時，會將它們移到 Plugin 索引並移除該 config key；如果任一寫入失敗，config 記錄會被保留，確保安裝中繼資料不會遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會從 `plugins.entries`、持久化 Plugin 索引、Plugin 允許/拒絕清單項目，以及適用時已連結的 `plugins.load.paths` 項目中移除 Plugin 記錄。除非設定 `--keep-files`，解除安裝也會在追蹤的受管理安裝目錄位於 OpenClaw 的 Plugin extensions 根目錄內時移除該目錄。對於 Active Memory plugins，memory slot 會重設為 `memory-core`。

<Note>
`--keep-config` 支援作為 `--keep-files` 的已棄用別名。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新會套用到受管理 Plugin 索引中已追蹤的 Plugin 安裝，以及 `hooks.internal.installs` 中已追蹤的 hook-pack 安裝。

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    當你傳入 Plugin id 時，OpenClaw 會重用該 Plugin 記錄的安裝 spec。這表示先前儲存的 dist-tags（例如 `@beta`）與精確釘選版本，會在之後的 `update <id>` 執行中繼續使用。

    對於 npm 安裝，你也可以傳入含有 dist-tag 或精確版本的明確 npm 套件 spec。OpenClaw 會將該套件名稱解析回已追蹤的 Plugin 記錄、更新該已安裝 Plugin，並記錄新的 npm spec，供未來以 id 為基礎的更新使用。

    傳入不含版本或 tag 的 npm 套件名稱，也會解析回已追蹤的 Plugin 記錄。當某個 Plugin 先前已釘選到精確版本，而你想將它移回 registry 的預設發行線時，請使用這個方式。

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` 會重用已追蹤的 Plugin spec，除非你傳入新的 spec。`openclaw update` 另外知道作用中的 OpenClaw 更新 channel：在 beta channel 上，預設線 npm 與 ClawHub Plugin 記錄會先嘗試 `@beta`，如果沒有 Plugin beta 發行版，才 fallback 到記錄的預設/latest spec。精確版本與明確 tags 會持續釘選到該 selector。

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    在即時 npm 更新之前，OpenClaw 會根據 npm registry 中繼資料檢查已安裝套件版本。如果已安裝版本與記錄的成品身分已符合解析出的目標，更新會被略過，不會下載、重新安裝或重寫 `openclaw.json`。

    當已儲存 integrity hash，且抓取到的成品 hash 發生變化時，OpenClaw 會將其視為 npm 成品漂移。互動式 `openclaw plugins update` 命令會列印預期與實際 hash，並在繼續前要求確認。非互動式更新輔助程式會 fail closed，除非呼叫端提供明確的繼續政策。

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` 也可在 `plugins update` 上使用，作為 Plugin 更新期間內建 dangerous-code 掃描誤判的 break-glass 覆寫。它仍不會繞過 Plugin `before_install` 政策封鎖或掃描失敗封鎖，而且只適用於 Plugin 更新，不適用於 hook-pack 更新。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不會匯入 Plugin runtime，會顯示身分、載入狀態、來源、manifest 功能、政策旗標、診斷、安裝中繼資料、套件組合功能，以及任何偵測到的 MCP 或 LSP server 支援。加入 `--runtime` 可載入 Plugin 模組，並包含已註冊 hooks、tools、commands、services、gateway methods，以及 HTTP routes。Runtime 檢查會直接回報缺失的 Plugin 相依套件；安裝與修復仍留在 `openclaw plugins install`、`openclaw plugins update`，以及 `openclaw doctor --fix` 中進行。

Plugin 擁有的 CLI commands 會安裝為根層級 `openclaw` command groups。當 `inspect --runtime` 在 `cliCommands` 下顯示某個 command 後，請以 `openclaw <command> ...` 執行它；例如，註冊 `demo-git` 的 Plugin 可用 `openclaw demo-git ping` 驗證。

每個 Plugin 會依照它在 runtime 實際註冊的內容分類：

- **plain-capability** — 一種 capability 類型（例如僅 provider 的 Plugin）
- **hybrid-capability** — 多種 capability 類型（例如文字 + 語音 + 圖像）
- **hook-only** — 只有 hooks，沒有 capabilities 或 surfaces
- **non-capability** — tools/commands/services，但沒有 capabilities

如需 capability model 的更多資訊，請參閱 [Plugin shapes](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合 scripting 與 auditing 的機器可讀報告。`inspect --all` 會呈現全體範圍的表格，包含 shape、capability kinds、compatibility notices、bundle capabilities，以及 hook summary 欄位。`info` 是 `inspect` 的別名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報 Plugin 載入錯誤、manifest/discovery 診斷，以及相容性 notices。當一切正常時，它會印出 `No plugin issues detected.`

如果已設定的 Plugin 存在於磁碟上，但被 loader 的路徑安全檢查封鎖，config 驗證會保留該 Plugin 項目，並將它回報為 `present but blocked`。請修正前面的 blocked-plugin 診斷，例如路徑 ownership 或 world-writable permissions，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` config。

對於缺少 `register`/`activate` exports 這類 module-shape 失敗，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的 export-shape 摘要。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 Plugin registry 是 OpenClaw 為已安裝 Plugin 身分、啟用狀態、來源中繼資料，以及貢獻 ownership 所持久化的冷讀取模型。一般啟動、provider owner 查找、channel setup 分類，以及 Plugin 清單都可以在不匯入 Plugin runtime 模組的情況下讀取它。

使用 `plugins registry` 檢查持久化 registry 是否存在、為最新或已過期。使用 `--refresh` 從持久化 Plugin 索引、設定政策，以及資訊清單/套件中繼資料重建它。這是修復路徑，不是執行階段啟用路徑。

`openclaw doctor --fix` 也會修復與 registry 相鄰的受管理 npm 漂移：如果受管理 Plugin npm 根目錄下有孤立或復原的 `@openclaw/*` 套件遮蔽了隨附 Plugin，doctor 會移除該過期套件並重建 registry，讓啟動流程能依據隨附資訊清單進行驗證。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的緊急相容性開關，用於 registry 讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；此 env 後援僅供遷移推出期間的緊急啟動復原使用。
</Warning>

### 市集

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市集清單接受本機市集路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會印出解析後的來源標籤，以及剖析後的市集資訊清單與 Plugin 項目。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [社群 Plugin](/zh-TW/plugins/community)
