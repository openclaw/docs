---
read_when:
    - 你想要安裝或管理 Gateway Plugin 或相容套件
    - 你想偵錯 Plugin 載入失敗
sidebarTitle: Plugins
summary: CLI 參考：`openclaw plugins`（列出、安裝、市集、解除安裝、啟用/停用、doctor）
title: Plugins
x-i18n:
    generated_at: "2026-05-05T01:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway Plugin、hook 套件與相容的 bundle。

<CardGroup cols={2}>
  <Card title="Plugin 系統" href="/zh-TW/tools/plugin">
    給終端使用者的 Plugin 安裝、啟用與疑難排解指南。
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

若要調查緩慢的安裝、檢查、解除安裝或 registry 重新整理，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行該命令。Trace 會將各階段耗時寫入 stderr，並保持 JSON 輸出可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
Bundled plugins 會隨 OpenClaw 一起提供。有些預設啟用（例如 bundled model providers、bundled speech providers，以及 bundled browser plugin）；其他則需要 `plugins enable`。

原生 OpenClaw Plugin 必須隨附 `openclaw.plugin.json`，並包含內嵌 JSON Schema（`configSchema`，即使是空的也一樣）。相容的 bundle 則使用自己的 bundle manifest。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細 list/info 輸出也會顯示 bundle 子類型（`codex`、`claude` 或 `cursor`）以及偵測到的 bundle capabilities。
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
在啟動切換期間，裸套件名稱預設會從 npm 安裝。ClawHub 請使用 `clawhub:<package>`。請像執行程式碼一樣看待 Plugin 安裝。建議優先使用釘選版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 Plugin 套件，並列印可直接安裝的套件名稱。它會搜尋 code-plugin 與 bundle-plugin 套件，而不是 Skills。ClawHub Skills 請使用 `openclaw skills search`。

<Note>
ClawHub 是大多數 Plugin 的主要散佈與探索介面。Npm 仍是受支援的備援與直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` Plugin 套件已重新發布到 npm；請在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或 [Plugin 庫存](/zh-TW/plugins/plugin-inventory)查看目前清單。穩定版安裝使用 `latest`。Beta-channel 安裝與更新會在 npm `beta` dist-tag 可用時優先使用該 tag，然後才回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="設定 include 與無效設定修復">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該被 include 的檔案，並保持 `openclaw.json` 不變。根 include、include 陣列，以及帶有同層覆寫的 include 會 fail closed，而不是被攤平成單一設定。支援的形狀請參閱[設定 include](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會 fail closed，並提示你先執行 `openclaw doctor --fix`。Gateway 啟動與熱重新載入期間，無效的 Plugin 設定會像其他無效設定一樣 fail closed；`openclaw doctor --fix` 可以隔離無效的 Plugin 項目。唯一記錄於文件中的安裝時例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的 Plugin 所提供的狹窄 bundled-plugin 復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝相對於更新">
    `--force` 會重用既有安裝目標，並就地覆寫已安裝的 Plugin 或 hook 套件。當你有意從新的本機路徑、封存檔、ClawHub 套件或 npm artifact 重新安裝相同 id 時使用它。對於已追蹤 npm Plugin 的例行升級，建議使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 Plugin id 執行 `plugins install`，OpenClaw 會停止並引導你使用 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 只適用於 npm 安裝。不支援與 `git:` 安裝搭配；如果你想要釘選來源，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它也不支援與 `--marketplace` 搭配，因為 marketplace 安裝會保留 marketplace 來源中繼資料，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是針對內建 dangerous-code scanner 誤判的 break-glass 選項。即使內建 scanner 回報 `critical` findings，它也允許安裝繼續，但它**不會**繞過 Plugin `before_install` hook 政策封鎖，也**不會**繞過掃描失敗。

    這個 CLI flag 適用於 Plugin 安裝/更新流程。Gateway-backed skill 依賴安裝使用相符的 `dangerouslyForceUnsafeInstall` request override，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

    如果你發布在 ClawHub 的 Plugin 被 registry 掃描封鎖，請使用 [ClawHub](/zh-TW/tools/clawhub) 中的發布者步驟。

  </Accordion>
  <Accordion title="Hook 套件與 npm specs">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 的 hook 套件的介面。請使用 `openclaw hooks` 查看經篩選的 hook 可見性與個別 hook 啟用狀態，而不是用於套件安裝。

    Npm specs **僅限 registry**（套件名稱 + 選用的**精確版本**或 **dist-tag**）。Git/URL/file specs 與 semver ranges 會被拒絕。為了安全，即使你的 shell 有全域 npm 安裝設定，依賴安裝也會以專案本機方式搭配 `--ignore-scripts` 執行。

    當你想明確使用 npm 解析時，請使用 `npm:<package>`。在啟動切換期間，裸套件 spec 也會直接從 npm 安裝。

    裸 specs 與 `@latest` 會留在穩定版軌道。OpenClaw 日期戳記修正版，例如 `2026.5.3-1`，在此檢查中屬於穩定版發行。如果 npm 將其中任何一種解析為 prerelease，OpenClaw 會停止並要求你使用 prerelease tag（例如 `@beta`/`@rc`）或精確的 prerelease 版本（例如 `@1.2.3-beta.4`）明確選擇加入。

    如果裸安裝 spec 符合官方 Plugin id（例如 `diffs`），OpenClaw 會直接安裝 catalog 項目。若要安裝同名 npm 套件，請使用明確的 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repositories">
    使用 `git:<repo>` 直接從 git repository 安裝。支援的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URLs。加入 `@<ref>` 或 `#<ref>` 可在安裝前 checkout 分支、tag 或 commit。

    Git 安裝會 clone 到暫存目錄，在有要求 ref 時 checkout 該 ref，然後使用一般 Plugin 目錄安裝程式。這表示 manifest 驗證、dangerous-code 掃描、package-manager 安裝工作，以及安裝記錄的行為都會像 npm 安裝一樣。記錄的 git 安裝會包含來源 URL/ref 以及解析後的 commit，讓 `openclaw plugins update` 之後可以重新解析來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證 runtime 註冊，例如 gateway methods 與 CLI commands。如果該 Plugin 使用 `api.registerCli` 註冊了 CLI root，請直接透過 OpenClaw root CLI 執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw Plugin 封存檔必須在解壓後的 Plugin root 包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的封存檔會在 OpenClaw 寫入安裝記錄前被拒絕。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在啟動切換期間，裸 npm-safe Plugin specs 預設會從 npm 安裝：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 明確指定僅使用 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查宣告的 Plugin API / 最低 gateway 相容性。當選取的 ClawHub 版本發布 ClawPack artifact 時，OpenClaw 會下載 versioned npm-pack `.tgz`、驗證 ClawHub digest header 與 artifact digest，然後透過一般封存檔路徑安裝。沒有 ClawPack metadata 的舊版 ClawHub 版本仍會透過 legacy package archive verification 路徑安裝。記錄的安裝會保留其 ClawHub 來源中繼資料、artifact kind、npm integrity、npm shasum、tarball name，以及 ClawPack digest facts，以供日後更新使用。
未版本化的 ClawHub 安裝會保留未版本化的 recorded spec，讓 `openclaw plugins update` 可以跟隨較新的 ClawHub 發行；明確版本或 tag selectors，例如 `clawhub:pkg@1.2.3` 與 `clawhub:pkg@beta`，則會維持釘選到該 selector。

#### Marketplace 簡寫

當 marketplace 名稱存在於 Claude 位於 `~/.claude/plugins/known_marketplaces.json` 的本機 registry cache 時，使用 `plugin@marketplace` 簡寫：

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
    - 來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知市集名稱
    - 本機市集根目錄或 `marketplace.json` 路徑
    - GitHub repo 簡寫，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    對於從 GitHub 或 git 載入的遠端市集，plugin 項目必須留在已複製的市集 repo 內。OpenClaw 接受來自該 repo 的相對路徑來源，並拒絕遠端 manifest 中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑的 plugin 來源。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw plugins (`openclaw.plugin.json`)
- Codex 相容套件 (`.codex-plugin/plugin.json`)
- Claude 相容套件 (`.claude-plugin/plugin.json` 或預設的 Claude 元件版面配置)
- Cursor 相容套件 (`.cursor-plugin/plugin.json`)

<Note>
相容套件會安裝到一般 plugin 根目錄，並參與相同的 list/info/enable/disable 流程。目前支援套件 skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的套件能力會顯示在 diagnostics/info 中，但尚未接入執行階段執行。
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
  從表格檢視切換為每個 plugin 的詳細行，包含 source/origin/version/activation metadata。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀取的 inventory，加上 registry diagnostics 與 package dependency install state。
</ParamField>

<Note>
`plugins list` 會先讀取已持久化的本機 plugin registry；當 registry 遺失或無效時，會使用僅由 manifest 推導出的備援。它可用來檢查 plugin 是否已安裝、已啟用，且對冷啟動規劃可見，但它不是針對已在執行中的 Gateway 程序的即時執行階段探測。變更 plugin 程式碼、啟用狀態、hook policy 或 `plugins.load.paths` 後，請重新啟動服務該 channel 的 Gateway，再預期新的 `register(api)` 程式碼或 hooks 會執行。對於遠端/容器部署，請確認你正在重新啟動實際的 `openclaw gateway run` 子程序，而不只是 wrapper 程序。

`plugins list --json` 會包含每個 plugin 來自 `package.json`
`dependencies` 與 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些 package
名稱是否存在於 plugin 一般 Node `node_modules` 查找路徑上；它
不會匯入 plugin 執行階段程式碼、執行 package manager，或修復遺失的
dependencies。
</Note>

`plugins search` 是遠端 ClawHub catalog 查詢。它不會檢查本機
狀態、變更 config、安裝 packages，或載入 plugin 執行階段程式碼。搜尋
結果包含 ClawHub package 名稱、family、channel、version、summary，以及
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

若要在封裝好的 Docker image 內處理內建 plugin，請將 plugin
來源目錄 bind-mount 到相符的封裝來源路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會先探索該掛載的來源
overlay，再探索 `/app/dist/extensions/synology-chat`；單純複製的來源
目錄仍會保持無作用，因此一般封裝安裝仍使用已編譯的 dist。

針對執行階段 hook 偵錯：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自 module-loaded inspection pass 的已註冊 hooks 與 diagnostics。Runtime inspection 永遠不會安裝 dependencies；使用 `openclaw doctor --fix` 清理舊版 dependency state，或恢復 config 參照但遺失的可下載 plugins。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、service/process 提示、config 路徑，以及 RPC 健康狀態。
- 非內建 conversation hooks (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) 需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 以避免複製本機目錄（會加入 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援與 `--link` 搭配使用，因為 linked installs 會重用來源路徑，而不是覆寫受管理的安裝目標。

在 npm installs 上使用 `--pin`，可在受管理的 plugin index 中儲存已解析的精確 spec (`name@version`)，同時保持預設行為為未釘選。
</Note>

### Plugin index

Plugin install metadata 是機器管理的狀態，不是使用者 config。安裝與更新會把它寫入作用中 OpenClaw state 目錄下的 `plugins/installs.json`。其頂層 `installRecords` map 是 install metadata 的持久來源，包括損壞或遺失的 plugin manifests 記錄。`plugins` array 是由 manifest 推導出的 cold registry cache。此檔案包含請勿編輯警告，並由 `openclaw plugins update`、uninstall、diagnostics，以及 cold plugin registry 使用。

當 OpenClaw 在 config 中看到已出貨的舊版 `plugins.installs` 記錄時，會將它們移到 plugin index 並移除 config key；如果任一寫入失敗，config 記錄會保留，避免 install metadata 遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會從 `plugins.entries`、已持久化的 plugin index、plugin allow/deny list 項目，以及適用時的 linked `plugins.load.paths` 項目中移除 plugin 記錄。除非設定 `--keep-files`，否則 uninstall 也會移除位於 OpenClaw plugin extensions root 內的受追蹤管理安裝目錄。對於 active memory plugins，memory slot 會重設為 `memory-core`。

<Note>
`--keep-config` 支援作為 `--keep-files` 的 deprecated alias。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新會套用到 managed plugin index 中受追蹤的 plugin installs，以及 `hooks.internal.installs` 中受追蹤的 hook-pack installs。

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    當你傳入 plugin id 時，OpenClaw 會重用該 plugin 記錄的 install spec。這表示先前儲存的 dist-tags，例如 `@beta`，以及精確釘選版本，會在後續 `update <id>` 執行時繼續使用。

    對於 npm installs，你也可以傳入帶有 dist-tag 或精確版本的明確 npm package spec。OpenClaw 會將該 package 名稱解析回受追蹤的 plugin 記錄，更新該已安裝的 plugin，並記錄新的 npm spec 供未來以 id 為基礎的更新使用。

    傳入不含版本或標籤的 npm package 名稱，也會解析回受追蹤的 plugin 記錄。當 plugin 已釘選到精確版本，而你想將它移回 registry 預設發行線時，請使用此方式。

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` 會重用受追蹤的 plugin spec，除非你傳入新的 spec。`openclaw update` 另外知道作用中的 OpenClaw update channel：在 beta channel 上，default-line npm 與 ClawHub plugin 記錄會先嘗試 `@beta`，若沒有 plugin beta release，則退回已記錄的 default/latest spec。精確版本與明確標籤會保持釘選到該 selector。

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    在即時 npm update 前，OpenClaw 會根據 npm registry metadata 檢查已安裝 package 版本。如果已安裝版本與已記錄 artifact identity 已符合解析後目標，更新會略過，不會下載、重新安裝或重寫 `openclaw.json`。

    當存在已儲存的 integrity hash 且擷取到的 artifact hash 改變時，OpenClaw 會將其視為 npm artifact drift。互動式 `openclaw plugins update` command 會列印預期與實際 hash，並在繼續前要求確認。非互動式 update helpers 會 fail closed，除非呼叫端提供明確的 continuation policy。

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` 也可用於 `plugins update`，作為 plugin updates 期間內建 dangerous-code scan false positives 的 break-glass override。它仍不會繞過 plugin `before_install` policy blocks 或 scan-failure blocking，且只適用於 plugin updates，不適用於 hook-pack updates。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不會匯入 plugin 執行階段，並會顯示 identity、load status、source、manifest capabilities、policy flags、diagnostics、install metadata、bundle capabilities，以及任何偵測到的 MCP 或 LSP server 支援。加入 `--runtime` 可載入 plugin module，並包含已註冊的 hooks、tools、commands、services、gateway methods 與 HTTP routes。Runtime inspection 會直接回報遺失的 plugin dependencies；安裝與修復仍位於 `openclaw plugins install`、`openclaw plugins update` 與 `openclaw doctor --fix`。

Plugin 擁有的 CLI commands 會安裝為根層級 `openclaw` command groups。在 `inspect --runtime` 顯示 `cliCommands` 下的 command 後，請以 `openclaw <command> ...` 執行它；例如，註冊 `demo-git` 的 plugin 可用 `openclaw demo-git ping` 驗證。

每個 plugin 會依其在執行階段實際註冊的內容分類：

- **plain-capability** — 一種 capability 類型（例如僅 provider 的 plugin）
- **hybrid-capability** — 多種 capability 類型（例如 text + speech + images）
- **hook-only** — 只有 hooks，沒有 capabilities 或 surfaces
- **non-capability** — 有 tools/commands/services，但沒有 capabilities

請參閱 [Plugin 形態](/zh-TW/plugins/architecture#plugin-shapes) 以了解更多 capability model。

<Note>
`--json` flag 會輸出適合 scripting 與 auditing 的機器可讀報告。`inspect --all` 會呈現整體 fleet-wide 表格，包含 shape、capability kinds、compatibility notices、bundle capabilities 與 hook summary 欄位。`info` 是 `inspect` 的 alias。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報 plugin load errors、manifest/discovery diagnostics 與 compatibility notices。當一切乾淨時，它會列印 `No plugin issues detected.`

如果已設定的 plugin 存在於磁碟上，但被 loader 的 path-safety checks 阻擋，config validation 會保留 plugin 項目，並將其回報為 `present but blocked`。請修正前面的 blocked-plugin diagnostic，例如 path ownership 或 world-writable permissions，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` config。

對於 module-shape failures，例如遺失 `register`/`activate` exports，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在 diagnostic output 中包含精簡的 export-shape summary。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 plugin registry 是 OpenClaw 對已安裝 plugin identity、enablement、source metadata 與 contribution ownership 的已持久化 cold read model。一般 startup、provider owner lookup、channel setup classification 與 plugin inventory 都可以讀取它，而不必匯入 plugin runtime modules。

使用 `plugins registry` 檢查持久化登錄檔是否存在、是否為目前版本，或是否已過期。使用 `--refresh` 從持久化的 Plugin 索引、設定政策，以及資訊清單/套件中繼資料重新建置它。這是修復路徑，不是執行階段啟用路徑。

`openclaw doctor --fix` 也會修復登錄檔相鄰的受管理 npm 偏移：如果受管理的 Plugin npm 根目錄下有孤立或已復原的 `@openclaw/*` 套件遮蔽了內建 Plugin，doctor 會移除該過期套件並重新建置登錄檔，讓啟動時能根據內建資訊清單進行驗證。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的破窗相容性開關，用於登錄檔讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；env 後援僅用於遷移推出期間的緊急啟動復原。
</Warning>

### 市集

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市集列表接受本機市集路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub 儲存庫 URL，或 git URL。`--json` 會輸出已解析的來源標籤，以及已剖析的市集資訊清單與 Plugin 項目。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [社群 Plugin](/zh-TW/plugins/community)
