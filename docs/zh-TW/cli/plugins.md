---
read_when:
    - 您想要安裝或管理 Gateway Plugin 或相容套件組
    - 你想偵錯 Plugin 載入失敗
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 參考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugins
x-i18n:
    generated_at: "2026-05-11T20:26:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway plugins、hook 套件與相容 bundles。

<CardGroup cols={2}>
  <Card title="Plugin 系統" href="/zh-TW/tools/plugin">
    安裝、啟用與疑難排解 plugins 的終端使用者指南。
  </Card>
  <Card title="管理 plugins" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝與發布的快速範例。
  </Card>
  <Card title="Plugin bundles" href="/zh-TW/plugins/bundles">
    Bundle 相容性模型。
  </Card>
  <Card title="Plugin manifest" href="/zh-TW/plugins/manifest">
    Manifest 欄位與 config schema。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security">
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

若要調查安裝、inspect、解除安裝或 registry-refresh 緩慢的問題，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行命令。追蹤會將各階段耗時寫入 stderr，並讓 JSON 輸出保持可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，plugin lifecycle mutators 會停用。請改用此安裝的 Nix 來源，而不是 `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable` 或 `plugins disable`；若使用 nix-openclaw，請使用以代理程式優先的 [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
Bundled plugins 會隨 OpenClaw 一起提供。有些會預設啟用（例如 bundled model providers、bundled speech providers，以及 bundled browser plugin）；其他則需要 `plugins enable`。

原生 OpenClaw plugins 必須隨附 `openclaw.plugin.json`，並包含內嵌 JSON Schema（`configSchema`，即使為空也需要）。相容 bundles 則改用自己的 bundle manifests。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。Verbose list/info 輸出也會顯示 bundle subtype（`codex`、`claude` 或 `cursor`）以及偵測到的 bundle capabilities。
</Note>

### 安裝

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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

維護者若要測試 setup-time installs，可以用受保護的環境變數覆寫自動 plugin 安裝來源。請參閱 [Plugin install overrides](/zh-TW/plugins/install-overrides)。

<Warning>
在 launch cutover 期間，裸套件名稱預設會從 npm 安裝。ClawHub 請使用 `clawhub:<package>`。請將 plugin 安裝視為執行程式碼。建議使用固定版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 plugin 套件，並列印可直接安裝的套件名稱。它會搜尋 code-plugin 與 bundle-plugin 套件，而非 skills。ClawHub skills 請使用 `openclaw skills search`。

<Note>
ClawHub 是大多數 plugins 的主要發佈與探索介面。Npm 仍是受支援的備援與直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` plugin 套件已重新發布到 npm；請在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或 [plugin inventory](/zh-TW/plugins/plugin-inventory) 查看目前清單。穩定版安裝使用 `latest`。Beta-channel 安裝與更新會在 npm `beta` dist-tag 可用時優先使用該標籤，接著才回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="Config includes 與 invalid-config 修復">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該 included file，並保持 `openclaw.json` 不變。Root includes、include arrays，以及含有 sibling overrides 的 includes 會以 fail closed 處理，而不是展平。支援的形狀請參閱 [Config includes](/zh-TW/gateway/configuration)。

    如果安裝期間 config 無效，`plugins install` 通常會 fail closed，並提示你先執行 `openclaw doctor --fix`。在 Gateway 啟動與熱重載期間，無效的 plugin config 會像任何其他無效 config 一樣 fail closed；`openclaw doctor --fix` 可以隔離無效的 plugin 項目。唯一有文件記載的 install-time 例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的 plugins 所提供的狹窄 bundled-plugin 復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝 vs 更新">
    `--force` 會重用現有安裝目標，並就地覆寫已安裝的 plugin 或 hook pack。當你有意從新的本機路徑、封存檔、ClawHub 套件或 npm 成品重新安裝相同 id 時使用它。若要對已追蹤的 npm plugin 進行例行升級，建議使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 plugin id 執行 `plugins install`，OpenClaw 會停止並指向 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時，指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 只適用於 npm 安裝。它不支援 `git:` 安裝；若你想要固定來源，請使用明確 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它也不支援 `--marketplace`，因為 marketplace 安裝會保留 marketplace 來源中繼資料，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是針對內建 dangerous-code 掃描器誤判的 break-glass 選項。即使內建掃描器回報 `critical` findings，它也允許安裝繼續，但它**不會**繞過 plugin `before_install` hook policy blocks，也**不會**繞過掃描失敗。

    此 CLI 旗標適用於 plugin install/update 流程。由 Gateway 支援的 skill dependency installs 會使用相對應的 `dangerouslyForceUnsafeInstall` request override，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

    如果你發布在 ClawHub 上的 plugin 被 registry 掃描阻擋，請使用 [ClawHub](/zh-TW/clawhub/security) 中的發布者步驟。

  </Accordion>
  <Accordion title="Hook packs 與 npm specs">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 的 hook packs 的介面。請使用 `openclaw hooks` 來取得篩選後的 hook 可見性與個別 hook 啟用，不要用它安裝套件。

    Npm specs **僅限 registry**（套件名稱 + 選用的**精確版本**或 **dist-tag**）。Git/URL/file specs 與 semver ranges 會被拒絕。為了安全，即使你的 shell 有全域 npm install 設定，依賴安裝仍會以 project-local 並搭配 `--ignore-scripts` 執行。受管理的 plugin npm roots 會繼承 OpenClaw 的 package-level npm `overrides`，因此主機安全 pins 也會套用到 hoisted plugin dependencies。

    當你想明確使用 npm 解析時，請使用 `npm:<package>`。在 launch cutover 期間，裸套件 specs 也會直接從 npm 安裝。

    裸 specs 與 `@latest` 會留在穩定軌道。OpenClaw date-stamped correction versions，例如 `2026.5.3-1`，在此檢查中屬於穩定版發行。如果 npm 將其中任一解析為 prerelease，OpenClaw 會停止並要求你用 prerelease tag（例如 `@beta`/`@rc`）或精確 prerelease version（例如 `@1.2.3-beta.4`）明確選擇加入。

    如果裸 install spec 符合官方 plugin id（例如 `diffs`），OpenClaw 會直接安裝 catalog entry。若要安裝同名的 npm 套件，請使用明確的 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repositories">
    使用 `git:<repo>` 可直接從 git repository 安裝。支援形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URLs。加入 `@<ref>` 或 `#<ref>`，可在安裝前 checkout 分支、標籤或 commit。

    Git 安裝會 clone 到暫存目錄，在有要求的 ref 時 checkout，接著使用一般 plugin directory installer。這表示 manifest validation、dangerous-code scanning、package-manager install 工作，以及 install records 的行為都會像 npm 安裝一樣。已記錄的 git 安裝會包含來源 URL/ref 以及解析出的 commit，讓 `openclaw plugins update` 之後能重新解析來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證 runtime registrations，例如 gateway methods 與 CLI commands。如果 plugin 透過 `api.registerCli` 註冊了 CLI root，請直接透過 OpenClaw root CLI 執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="Archives">
    支援的 archives：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw plugin archives 必須在解壓後的 plugin root 中包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的 archives 會在 OpenClaw 寫入 install records 前被拒絕。

    當檔案是 npm-pack tarball，且你想測試 registry 安裝所使用的相同受管理 npm-root 安裝路徑時，請使用 `npm-pack:<path.tgz>`，包含 `package-lock.json` 驗證、hoisted dependency scanning，以及 npm install records。一般 archive 路徑仍會作為 local archives 安裝到 plugin extensions root 下。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在 launch cutover 期間，裸 npm-safe plugin specs 預設會從 npm 安裝：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可明確指定僅使用 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查宣告的 Plugin API / 最低 Gateway 相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載版本化的 npm-pack `.tgz`、驗證 ClawHub 摘要標頭與成品摘要，然後透過一般封存檔路徑安裝。沒有 ClawPack 中繼資料的舊版 ClawHub 版本，仍會透過舊版套件封存檔驗證路徑安裝。已記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm 完整性、npm shasum、tarball 名稱，以及 ClawPack 摘要事實，以供後續更新使用。
未指定版本的 ClawHub 安裝會保留未指定版本的記錄規格，讓 `openclaw plugins update` 可以跟隨較新的 ClawHub 發行；明確版本或標籤選擇器，例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`，會維持釘選到該選擇器。

#### 市集簡寫

當市集名稱存在於 Claude 位於 `~/.claude/plugins/known_marketplaces.json` 的本機登錄快取時，請使用 `plugin@marketplace` 簡寫：

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
    - GitHub repo 簡寫，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="遠端市集規則">
    對於從 GitHub 或 git 載入的遠端市集，Plugin 項目必須留在複製下來的市集 repo 內。OpenClaw 接受來自該 repo 的相對路徑來源，並拒絕遠端 manifest 中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑 Plugin 來源。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 相容套件包（`.codex-plugin/plugin.json`）
- Claude 相容套件包（`.claude-plugin/plugin.json` 或預設 Claude 元件版面配置）
- Cursor 相容套件包（`.cursor-plugin/plugin.json`）

<Note>
相容套件包會安裝到一般 Plugin 根目錄，並參與相同的 list/info/enable/disable 流程。目前支援套件包 Skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的套件包能力會顯示在診斷/info 中，但尚未接入執行階段執行。
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
  只顯示已啟用的 Plugin。
</ParamField>
<ParamField path="--verbose" type="boolean">
  從表格檢視切換為每個 Plugin 的詳細列，包含來源/原點/版本/啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清單，外加登錄診斷與套件相依安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取已持久化的本機 Plugin 登錄；當登錄遺失或無效時，會使用僅由 manifest 衍生的後備資料。它適合用來檢查 Plugin 是否已安裝、已啟用，且對冷啟動規劃可見，但它不是對已在執行中的 Gateway 程序進行即時執行階段探測。變更 Plugin 程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 後，請重新啟動服務該頻道的 Gateway，再預期新的 `register(api)` 程式碼或 hooks 會執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝程序。

`plugins list --json` 包含每個 Plugin 來自 `package.json`
`dependencies` 與 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於該 Plugin 一般 Node `node_modules` 查找路徑中；它
不會匯入 Plugin 執行階段程式碼、執行套件管理器，或修復遺失的
相依套件。
</Note>

`plugins search` 是遠端 ClawHub 目錄查詢。它不會檢查本機
狀態、修改設定、安裝套件，或載入 Plugin 執行階段程式碼。搜尋
結果包含 ClawHub 套件名稱、系列、頻道、版本、摘要，以及
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

在封裝 Docker 映像中進行內建 Plugin 工作時，請將 Plugin
原始碼目錄 bind-mount 到相符的封裝原始碼路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會先於 `/app/dist/extensions/synology-chat` 探索該已掛載的原始碼
覆蓋層；單純複製的原始碼
目錄仍會保持不作用，因此一般封裝安裝仍會使用已編譯的 dist。

針對執行階段 hook 偵錯：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自模組載入檢查流程的已註冊 hooks 與診斷。執行階段檢查絕不安裝相依套件；請使用 `openclaw doctor --fix` 清理舊版相依狀態，或復原設定中引用但遺失的可下載 Plugin。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、服務/程序提示、設定路徑，以及 RPC 健康狀態。
- 非內建的對話 hooks（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 以避免複製本機目錄（會加入 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援與 `--link` 一起使用，因為連結安裝會重用來源路徑，而不是覆寫受管理的安裝目標。

在 npm 安裝上使用 `--pin`，可將解析出的精確規格（`name@version`）儲存在受管理的 Plugin 索引中，同時保留預設的未釘選行為。
</Note>

### Plugin 索引

Plugin 安裝中繼資料是由機器管理的狀態，不是使用者設定。安裝與更新會將它寫入作用中 OpenClaw 狀態目錄下的 `plugins/installs.json`。其頂層 `installRecords` 對應表是安裝中繼資料的持久來源，包含損壞或遺失 Plugin manifest 的記錄。`plugins` 陣列是由 manifest 衍生的冷登錄快取。該檔案包含請勿編輯警告，並由 `openclaw plugins update`、解除安裝、診斷，以及冷 Plugin 登錄使用。

當 OpenClaw 在設定中看到已出貨的舊版 `plugins.installs` 記錄時，執行階段讀取會將其視為相容性輸入，而不重寫 `openclaw.json`。明確的 Plugin 寫入與 `openclaw doctor --fix` 會在允許寫入設定時，將這些記錄移入 Plugin 索引並移除設定鍵；如果任一寫入失敗，會保留設定記錄，避免安裝中繼資料遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會在適用時從 `plugins.entries`、已持久化的 Plugin 索引、Plugin allow/deny list 項目，以及已連結的 `plugins.load.paths` 項目中移除 Plugin 記錄。除非設定 `--keep-files`，解除安裝也會在受追蹤的受管理安裝目錄位於 OpenClaw 的 Plugin extensions 根目錄內時移除該目錄。對於 Active Memory Plugin，記憶體槽會重設為 `memory-core`。

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

更新會套用到受管理 Plugin 索引中受追蹤的 Plugin 安裝，以及 `hooks.internal.installs` 中受追蹤的 hook-pack 安裝。

<AccordionGroup>
  <Accordion title="解析 Plugin ID 與 npm 規格">
    當你傳入 Plugin ID 時，OpenClaw 會重用該 Plugin 已記錄的安裝規格。這表示先前儲存的 dist-tags，例如 `@beta`，以及精確釘選版本，會在後續 `update <id>` 執行時繼續使用。

    對於 npm 安裝，你也可以傳入帶有 dist-tag 或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回受追蹤的 Plugin 記錄、更新該已安裝的 Plugin，並記錄新的 npm 規格，供日後基於 ID 的更新使用。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回受追蹤的 Plugin 記錄。當 Plugin 已釘選到精確版本，而你想將它移回登錄的預設發行線時，請使用此方式。

  </Accordion>
  <Accordion title="Beta 頻道更新">
    `openclaw plugins update` 會重用受追蹤的 Plugin 規格，除非你傳入新的規格。`openclaw update` 另外知道作用中的 OpenClaw 更新頻道：在 beta 頻道上，預設線 npm 與 ClawHub Plugin 記錄會先嘗試 `@beta`，如果沒有 Plugin beta 發行，則退回到已記錄的 default/latest 規格。該退回會以警告回報，且不會使核心更新失敗。精確版本與明確標籤會維持釘選到該選擇器。

  </Accordion>
  <Accordion title="版本檢查與完整性漂移">
    在即時 npm 更新前，OpenClaw 會根據 npm 登錄中繼資料檢查已安裝的套件版本。如果已安裝版本與已記錄的成品身分已符合解析出的目標，更新會略過，不下載、不重新安裝，也不重寫 `openclaw.json`。

    當已儲存的完整性雜湊存在，且擷取到的成品雜湊變更時，OpenClaw 會將其視為 npm 成品漂移。互動式 `openclaw plugins update` 命令會列印預期與實際雜湊，並在繼續前要求確認。非互動式更新輔助程式會預設關閉失敗，除非呼叫者提供明確的繼續政策。

  </Accordion>
  <Accordion title="更新時的 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可在 `plugins update` 上使用，作為 Plugin 更新期間內建危險程式碼掃描誤判的緊急覆寫。它仍不會繞過 Plugin `before_install` 政策封鎖或掃描失敗封鎖，且只適用於 Plugin 更新，不適用於 hook-pack 更新。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不匯入 Plugin 執行階段，會顯示身分、載入狀態、來源、manifest 能力、政策旗標、診斷、安裝中繼資料、套件包能力，以及任何偵測到的 MCP 或 LSP 伺服器支援。加入 `--runtime` 會載入 Plugin 模組，並包含已註冊的 hooks、工具、命令、服務、Gateway 方法，以及 HTTP 路由。執行階段檢查會直接回報遺失的 Plugin 相依套件；安裝與修復仍留在 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix`。

Plugin 擁有的 CLI 命令通常會安裝為根 `openclaw` 命令群組，但 Plugin 也可以在核心父項下註冊巢狀命令，例如 `openclaw nodes`。在 `inspect --runtime` 顯示 `cliCommands` 下的命令後，請在列出的路徑執行它；例如，註冊 `demo-git` 的 Plugin 可使用 `openclaw demo-git ping` 驗證。

每個 Plugin 都會依其在執行階段實際註冊的內容分類：

- **plain-capability** — 一種能力類型（例如：僅提供者 Plugin）
- **hybrid-capability** — 多種能力類型（例如：文字 + 語音 + 圖片）
- **hook-only** — 僅 hooks，沒有能力或介面
- **non-capability** — 工具/命令/服務，但沒有能力

如需深入了解能力模型，請參閱 [Plugin 形態](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合 scripting 和稽核使用的機器可讀報告。`inspect --all` 會呈現一個涵蓋全體的表格，包含形態、能力種類、相容性通知、bundle 能力，以及 hook 摘要欄位。`info` 是 `inspect` 的別名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報 Plugin 載入錯誤、manifest/discovery 診斷，以及相容性通知。一切正常時，它會列印 `No plugin issues detected.`

如果已設定的 Plugin 存在於磁碟上，但被 loader 的路徑安全檢查阻擋，config 驗證會保留該 Plugin 項目，並將它回報為 `present but blocked`。請修正前面的 blocked-plugin 診斷，例如路徑擁有權或 world-writable 權限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` config。

對於缺少 `register`/`activate` exports 這類 module-shape 失敗，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的 export-shape 摘要。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 Plugin registry 是 OpenClaw 持久化的冷讀模型，用於已安裝 Plugin 身分、啟用狀態、來源 metadata，以及 contribution ownership。一般啟動、provider owner lookup、channel setup classification，以及 Plugin inventory 都可以讀取它，而不需要 import Plugin runtime modules。

使用 `plugins registry` 檢查持久化 registry 是否存在、是否為最新或已過期。使用 `--refresh` 會從持久化 Plugin index、config policy，以及 manifest/package metadata 重建它。這是修復路徑，不是 runtime activation 路徑。

`openclaw doctor --fix` 也會修復 registry-adjacent managed npm drift：如果 managed Plugin npm root 底下有孤立或復原的 `@openclaw/*` package 遮蔽 bundled Plugin，doctor 會移除該過期 package 並重建 registry，讓啟動流程改以 bundled manifest 進行驗證。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的 break-glass 相容性開關，用於 registry 讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；env fallback 僅供 migration 推出期間的緊急啟動復原使用。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 接受本機 marketplace 路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會列印解析後的來源標籤，以及已剖析的 marketplace manifest 和 Plugin entries。

## 相關

- [建置 plugins](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [ClawHub](/zh-TW/clawhub)
