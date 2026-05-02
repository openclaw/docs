---
read_when:
    - 您想要安裝或管理 Gateway Plugin 或相容套件
    - 你想要偵錯 Plugin 載入失敗
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 參考（列出、安裝、市集、解除安裝、啟用/停用、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-05-02T20:44:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc046a04175c1b22f787920bf5ec28c24d0bb7d62eda4d9517da8f5dbac4c50
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway Plugin、hook pack 與相容 bundle。

<CardGroup cols={2}>
  <Card title="Plugin 系統" href="/zh-TW/tools/plugin">
    安裝、啟用與疑難排解 Plugin 的終端使用者指南。
  </Card>
  <Card title="管理 Plugin" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝與發布的快速範例。
  </Card>
  <Card title="Plugin bundle" href="/zh-TW/plugins/bundles">
    Bundle 相容性模型。
  </Card>
  <Card title="Plugin manifest" href="/zh-TW/plugins/manifest">
    Manifest 欄位與設定 schema。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security">
    Plugin 安裝的安全性強化。
  </Card>
</CardGroup>

## 指令

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

若要調查緩慢的安裝、檢查、解除安裝或 registry 重新整理，請搭配 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行指令。Trace 會將各階段計時寫入 stderr，並保持 JSON 輸出可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
Bundled plugins 會隨 OpenClaw 一起出貨。有些預設啟用（例如 bundled model providers、bundled speech providers 與 bundled browser plugin）；其他則需要 `plugins enable`。

Native OpenClaw Plugin 必須隨附 `openclaw.plugin.json`，並包含 inline JSON Schema（`configSchema`，即使為空）。相容 bundle 則改用各自的 bundle manifest。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。Verbose list/info 輸出也會顯示 bundle subtype（`codex`、`claude` 或 `cursor`）以及偵測到的 bundle capabilities。
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
在 launch cutover 期間，bare package name 預設會從 npm 安裝。ClawHub 請使用 `clawhub:<package>`。請將安裝 Plugin 視同執行程式碼。建議使用 pinned version。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 Plugin package，並列印可直接安裝的 package name。它會搜尋 code-plugin 與 bundle-plugin package，而不是 Skills。若要搜尋 ClawHub skills，請使用 `openclaw skills search`。

<Note>
ClawHub 是大多數 Plugin 的主要發布與探索介面。Npm 仍是受支援的 fallback 與直接安裝路徑。在遷移到 ClawHub 期間，OpenClaw 仍會在 npm 上發布一些 OpenClaw 擁有的 `@openclaw/*` Plugin package；在 Plugin release train 之間，這些 package version 可能會落後於 bundled source。若 npm 回報 OpenClaw 擁有的 Plugin package 已棄用，該已發布版本是舊的外部 artifact；請使用目前 OpenClaw 內建的 Plugin，或使用 local checkout，直到較新的 npm package 發布為止。
</Note>

<AccordionGroup>
  <Accordion title="設定 include 與無效設定復原">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該 included file，並保持 `openclaw.json` 不變。Root include、include array，以及帶有 sibling override 的 include 會 fail closed，而不是 flatten。支援的形狀請參閱[設定 include](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會 fail closed，並要求你先執行 `openclaw doctor --fix`。在 Gateway 啟動期間，某個 Plugin 的無效設定會被隔離到該 Plugin，讓其他 channel 與 Plugin 可以繼續執行；`openclaw doctor --fix` 可以隔離無效的 Plugin entry。唯一有文件記載的安裝時例外，是針對明確 opt into `openclaw.install.allowInvalidConfigRecovery` 的 Plugin 所提供的狹義 bundled-plugin 復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝相對於更新">
    `--force` 會重用現有安裝目標，並就地覆寫已安裝的 Plugin 或 hook pack。當你刻意要從新的 local path、archive、ClawHub package 或 npm artifact 重新安裝相同 id 時使用。對於已追蹤 npm Plugin 的例行升級，請優先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你針對已安裝的 Plugin id 執行 `plugins install`，OpenClaw 會停止並指引你使用 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 只適用於 npm 安裝。不支援搭配 `git:` 安裝；若你想要 pinned source，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。不支援搭配 `--marketplace`，因為 marketplace 安裝會持久化 marketplace source metadata，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是用於內建危險程式碼掃描器誤判時的 break-glass 選項。即使內建掃描器回報 `critical` findings，它也允許安裝繼續，但它**不會**略過 Plugin `before_install` hook policy block，也**不會**略過掃描失敗。

    此 CLI flag 適用於 Plugin install/update 流程。Gateway 支援的 skill dependency install 會使用對應的 `dangerouslyForceUnsafeInstall` request override，而 `openclaw skills install` 仍是獨立的 ClawHub skill download/install 流程。

    如果你在 ClawHub 發布的 Plugin 遭 registry scan 封鎖，請使用 [ClawHub](/zh-TW/tools/clawhub) 中的 publisher 步驟。

  </Accordion>
  <Accordion title="Hook pack 與 npm spec">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 的 hook pack 的介面。請使用 `openclaw hooks` 查看經篩選的 hook 可見性與逐一 hook 啟用，而不是安裝 package。

    Npm spec **僅限 registry**（package name 加上選用的**確切版本**或 **dist-tag**）。Git/URL/file spec 與 semver range 會被拒絕。為了安全性，即使你的 shell 有全域 npm install 設定，dependency install 仍會以 project-local 搭配 `--ignore-scripts` 執行。

    當你想明確使用 npm resolution 時，請使用 `npm:<package>`。在 launch cutover 期間，bare package spec 也會直接從 npm 安裝。

    Bare spec 與 `@latest` 會留在 stable track。如果 npm 將其中任一項解析為 prerelease，OpenClaw 會停止並要求你明確選擇加入，使用 prerelease tag（例如 `@beta`/`@rc`）或確切 prerelease version（例如 `@1.2.3-beta.4`）。

    如果 bare install spec 符合官方 Plugin id（例如 `diffs`），OpenClaw 會直接安裝 catalog entry。若要安裝同名 npm package，請使用明確的 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repository">
    使用 `git:<repo>` 可直接從 git repository 安裝。支援的格式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URL。加入 `@<ref>` 或 `#<ref>` 可在安裝前 checkout branch、tag 或 commit。

    Git 安裝會 clone 到暫存目錄，在有指定 ref 時 checkout 要求的 ref，然後使用一般 Plugin 目錄安裝器。這表示 manifest 驗證、危險程式碼掃描、package-manager install 工作與 install record 的行為都會像 npm 安裝一樣。記錄的 git 安裝包含 source URL/ref，以及 resolved commit，因此 `openclaw plugins update` 稍後可以重新解析來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證 runtime registration，例如 gateway method 與 CLI command。如果 Plugin 使用 `api.registerCli` 註冊了 CLI root，請直接透過 OpenClaw root CLI 執行該指令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="Archive">
    支援的 archive：`.zip`、`.tgz`、`.tar.gz`、`.tar`。Native OpenClaw Plugin archive 必須在 extracted plugin root 包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的 archive 會在 OpenClaw 寫入 install record 前被拒絕。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝會使用明確的 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在 launch cutover 期間，bare npm-safe Plugin spec 預設會從 npm 安裝：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可讓 npm-only resolution 明確化：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查 advertised plugin API / minimum gateway 相容性。當選取的 ClawHub 版本發布 ClawPack artifact 時，OpenClaw 會下載 versioned npm-pack `.tgz`，驗證 ClawHub digest header 與 artifact digest，然後透過一般 archive path 安裝。沒有 ClawPack metadata 的較舊 ClawHub 版本仍會透過 legacy package archive verification path 安裝。Recorded install 會保留其 ClawHub source metadata、artifact kind、npm integrity、npm shasum、tarball name 與 ClawPack digest fact，以供後續更新使用。
Unversioned ClawHub install 會保留 unversioned recorded spec，讓 `openclaw plugins update` 可以跟進較新的 ClawHub release；明確的 version 或 tag selector，例如 `clawhub:pkg@1.2.3` 與 `clawhub:pkg@beta`，會維持 pinned 到該 selector。

#### Marketplace shorthand

當 marketplace name 存在於 Claude 的 local registry cache `~/.claude/plugins/known_marketplaces.json` 時，請使用 `plugin@marketplace` shorthand：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

當你想明確傳入 marketplace source 時，請使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace 來源">
    - `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 Marketplace 名稱
    - 本機 Marketplace 根目錄或 `marketplace.json` 路徑
    - GitHub repo 簡寫，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="遠端 Marketplace 規則">
    對於從 GitHub 或 git 載入的遠端 Marketplace，plugin 項目必須留在複製下來的 Marketplace repo 內。OpenClaw 接受來自該 repo 的相對路徑來源，並拒絕遠端 manifest 中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑的 plugin 來源。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw plugins（`openclaw.plugin.json`）
- Codex 相容套件組合（`.codex-plugin/plugin.json`）
- Claude 相容套件組合（`.claude-plugin/plugin.json` 或預設 Claude 元件版面）
- Cursor 相容套件組合（`.cursor-plugin/plugin.json`）

<Note>
相容套件組合會安裝到一般 plugin 根目錄，並參與相同的列出/資訊/啟用/停用流程。目前支援套件組合 skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的套件組合功能會顯示在診斷/資訊中，但尚未接入 runtime 執行。
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
  從表格檢視切換為每個 plugin 的詳細列，包含來源/源頭/版本/啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清單，加上 registry 診斷與套件相依安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久化的本機 plugin registry；當 registry 遺失或無效時，才使用僅由 manifest 衍生的後援。這適合用來檢查 plugin 是否已安裝、已啟用，且對冷啟動規劃可見，但它不是對已執行 Gateway 程序的即時 runtime 探測。變更 plugin 程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 後，請重新啟動提供該通道服務的 Gateway，再預期新的 `register(api)` 程式碼或 hooks 會執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝程序。

`plugins list --json` 會包含每個 plugin 來自 `package.json`
`dependencies` 與 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於 plugin 一般 Node `node_modules` 查找路徑中；它
不會匯入 plugin runtime 程式碼、執行套件管理器，或修復遺失的
相依性。
</Note>

`plugins search` 是遠端 ClawHub 目錄查詢。它不會檢查本機
狀態、變更設定、安裝套件，或載入 plugin runtime 程式碼。搜尋
結果包含 ClawHub 套件名稱、家族、通道、版本、摘要，以及
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

若要在封裝的 Docker 映像中處理 bundled plugin，請將 plugin
來源目錄 bind-mount 到對應的封裝來源路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會先發現該掛載的來源
覆蓋層，再查找 `/app/dist/extensions/synology-chat`；單純複製的來源
目錄仍不會生效，因此一般封裝安裝仍會使用編譯後的 dist。

對於 runtime hook 偵錯：

- `openclaw plugins inspect <id> --runtime --json` 會顯示由模組載入檢查流程註冊的 hooks 與診斷。Runtime 檢查絕不會安裝相依性；請使用 `openclaw doctor --fix` 清理舊版相依狀態，或安裝遺失的已設定可下載 plugins。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、服務/程序提示、設定路徑，以及 RPC 健康狀態。
- 非 bundled 對話 hooks（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 以避免複製本機目錄（會新增到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援與 `--link` 搭配使用，因為連結安裝會重用來源路徑，而不是覆寫受管理的安裝目標。

在 npm 安裝時使用 `--pin`，可將解析後的精確 spec（`name@version`）儲存到受管理的 plugin 索引，同時保留預設的未釘選行為。
</Note>

### Plugin 索引

Plugin 安裝中繼資料是由機器管理的狀態，不是使用者設定。安裝與更新會將它寫入作用中 OpenClaw 狀態目錄下的 `plugins/installs.json`。其頂層 `installRecords` map 是安裝中繼資料的持久來源，包含損壞或遺失 plugin manifests 的記錄。`plugins` 陣列是由 manifest 衍生的冷 registry 快取。該檔案包含請勿編輯警告，並由 `openclaw plugins update`、解除安裝、診斷，以及冷 plugin registry 使用。

當 OpenClaw 在設定中看到已發佈的舊版 `plugins.installs` 記錄時，會將它們移入 plugin 索引並移除該設定鍵；若任一寫入失敗，設定記錄會被保留，避免安裝中繼資料遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會在適用時移除 `plugins.entries`、持久化 plugin 索引、plugin allow/deny list 項目，以及連結的 `plugins.load.paths` 項目中的 plugin 記錄。除非設定 `--keep-files`，解除安裝也會在追蹤的受管理安裝目錄位於 OpenClaw 的 plugin extensions 根目錄內時移除該目錄。對於 active memory plugins，memory slot 會重設為 `memory-core`。

<Note>
`--keep-config` 支援作為 `--keep-files` 的已棄用別名。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新會套用到受管理 plugin 索引中追蹤的 plugin 安裝，以及 `hooks.internal.installs` 中追蹤的 hook-pack 安裝。

<AccordionGroup>
  <Accordion title="解析 plugin id 與 npm spec">
    傳入 plugin id 時，OpenClaw 會重用為該 plugin 記錄的安裝 spec。這表示先前儲存的 dist-tags（例如 `@beta`）與精確釘選版本，會在之後的 `update <id>` 執行中繼續使用。

    對於 npm 安裝，你也可以傳入含 dist-tag 或精確版本的明確 npm 套件 spec。OpenClaw 會將該套件名稱解析回受追蹤的 plugin 記錄，更新該已安裝 plugin，並記錄新的 npm spec 供未來依 id 更新時使用。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回受追蹤的 plugin 記錄。當某個 plugin 已釘選到精確版本，而你想將它移回 registry 的預設發行線時，請使用這種方式。

  </Accordion>
  <Accordion title="Beta 通道更新">
    除非你傳入新的 spec，否則 `openclaw plugins update` 會重用受追蹤的 plugin spec。`openclaw update` 另外知道作用中的 OpenClaw 更新通道：在 beta 通道上，預設線的 npm 與 ClawHub plugin 記錄會先嘗試 `@beta`，若不存在 plugin beta 發行版，才退回記錄的 default/latest spec。精確版本與明確標籤會持續釘選到該 selector。

  </Accordion>
  <Accordion title="版本檢查與完整性漂移">
    在即時 npm 更新前，OpenClaw 會依 npm registry 中繼資料檢查已安裝套件版本。若已安裝版本與記錄的 artifact 身分已符合解析後的目標，更新會被略過，不會下載、重新安裝或重寫 `openclaw.json`。

    當存在已儲存的 integrity hash 且擷取到的 artifact hash 發生變更時，OpenClaw 會將其視為 npm artifact 漂移。互動式 `openclaw plugins update` 命令會列印預期與實際 hash，並在繼續前要求確認。非互動式更新輔助工具會安全失敗，除非呼叫端提供明確的繼續政策。

  </Accordion>
  <Accordion title="更新時使用 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可在 `plugins update` 上使用，作為 plugin 更新期間內建危險程式碼掃描誤判的 break-glass 覆寫。它仍不會繞過 plugin `before_install` 政策封鎖或掃描失敗封鎖，且只適用於 plugin 更新，不適用於 hook-pack 更新。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不匯入 plugin runtime，會顯示身分、載入狀態、來源、manifest 功能、政策旗標、診斷、安裝中繼資料、套件組合功能，以及任何偵測到的 MCP 或 LSP server 支援。新增 `--runtime` 可載入 plugin 模組，並包含註冊的 hooks、tools、commands、services、gateway methods，以及 HTTP routes。Runtime 檢查會直接回報遺失的 plugin 相依性；安裝與修復仍留在 `openclaw plugins install`、`openclaw plugins update` 與 `openclaw doctor --fix`。

Plugin 擁有的 CLI 命令會安裝為根 `openclaw` 命令群組。當 `inspect --runtime` 在 `cliCommands` 下顯示某個命令後，請以 `openclaw <command> ...` 執行；例如註冊 `demo-git` 的 plugin 可用 `openclaw demo-git ping` 驗證。

每個 plugin 會依其在 runtime 實際註冊的內容分類：

- **plain-capability** — 一種功能類型（例如僅 provider 的 plugin）
- **hybrid-capability** — 多種功能類型（例如文字 + 語音 + 圖像）
- **hook-only** — 只有 hooks，沒有功能或 surfaces
- **non-capability** — tools/commands/services，但沒有功能

如需深入了解功能模型，請參閱 [Plugin 形態](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合 scripting 與稽核的機器可讀報告。`inspect --all` 會呈現 fleet-wide 表格，其中包含形態、功能種類、相容性 notices、套件組合功能，以及 hook 摘要欄。`info` 是 `inspect` 的別名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報 plugin 載入錯誤、manifest/discovery 診斷，以及相容性 notices。當一切正常時，會列印 `No plugin issues detected.`

對於缺少 `register`/`activate` 匯出等模組形態失敗，請用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出形態摘要。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 plugin registry 是 OpenClaw 對已安裝 plugin 身分、啟用狀態、來源中繼資料，以及貢獻 ownership 的持久化冷讀取模型。一般啟動、provider owner 查找、通道設定分類，以及 plugin inventory 可以讀取它，而不必匯入 plugin runtime 模組。

使用 `plugins registry` 檢查持久化 registry 是否存在、是否為目前版本，或是否過期。使用 `--refresh` 可從持久化 plugin 索引、設定政策，以及 manifest/package 中繼資料重建它。這是修復路徑，不是 runtime 啟用路徑。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已淘汰的緊急相容性開關，用於 registry 讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；環境變數後援機制僅供遷移推出期間的緊急啟動復原使用。
</Warning>

### 市集

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市集清單接受本機市集路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會列印解析後的來源標籤，以及剖析後的市集資訊清單和 Plugin 項目。

## 相關

- [建立 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [社群 Plugin](/zh-TW/plugins/community)
