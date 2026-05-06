---
read_when:
    - 您想要安裝或管理 Gateway Plugin 或相容套件
    - 你想要偵錯 Plugin 載入失敗
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 參考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-05-06T09:05:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway Plugin、hook pack 與相容 bundle。

<CardGroup cols={2}>
  <Card title="Plugin system" href="/zh-TW/tools/plugin">
    安裝、啟用與疑難排解 Plugin 的終端使用者指南。
  </Card>
  <Card title="Manage plugins" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝與發布的快速範例。
  </Card>
  <Card title="Plugin bundles" href="/zh-TW/plugins/bundles">
    Bundle 相容性模型。
  </Card>
  <Card title="Plugin manifest" href="/zh-TW/plugins/manifest">
    Manifest 欄位與設定 schema。
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

若要調查緩慢的安裝、檢查、解除安裝或 registry 重新整理，請搭配 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行命令。Trace 會將各階段耗時寫入 stderr，並保持 JSON 輸出可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
內建 Plugin 隨 OpenClaw 一起提供。有些預設啟用（例如內建模型提供者、內建語音提供者，以及內建瀏覽器 Plugin）；其他則需要 `plugins enable`。

原生 OpenClaw Plugin 必須隨附 `openclaw.plugin.json`，其中含有內嵌 JSON Schema（`configSchema`，即使為空也需要）。相容 bundle 則改用自己的 bundle manifest。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細的 list/info 輸出也會顯示 bundle 子類型（`codex`、`claude` 或 `cursor`），以及偵測到的 bundle 功能。
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

<Warning>
在發布切換期間，裸套件名稱預設會從 npm 安裝。若要使用 ClawHub，請使用 `clawhub:<package>`。請將安裝 Plugin 視同執行程式碼。建議優先使用釘選版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 Plugin 套件，並列印可直接安裝的套件名稱。它搜尋的是 code-plugin 與 bundle-plugin 套件，不是 Skills。若要搜尋 ClawHub Skills，請使用 `openclaw skills search`。

<Note>
ClawHub 是多數 Plugin 的主要發行與探索介面。Npm 仍是受支援的備援與直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` Plugin 套件已再次發布到 npm；請在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或 [Plugin inventory](/zh-TW/plugins/plugin-inventory) 查看目前清單。穩定版安裝使用 `latest`。Beta 頻道安裝與更新會在 npm `beta` dist-tag 可用時優先使用該標籤，之後才回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該 included 檔案，並保持 `openclaw.json` 不變。Root include、include 陣列，以及含有同層覆寫的 include 會採取失敗關閉，而不是攤平。支援的形狀請參閱[設定 include](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會採取失敗關閉，並要求你先執行 `openclaw doctor --fix`。在 Gateway 啟動與熱重新載入期間，無效的 Plugin 設定會像其他無效設定一樣失敗關閉；`openclaw doctor --fix` 可以隔離無效的 Plugin 項目。唯一有文件記載的安裝時例外，是一條狹窄的內建 Plugin 復原路徑，僅適用於明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的 Plugin。

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` 會重用現有安裝目標，並就地覆寫已安裝的 Plugin 或 hook pack。當你有意從新的本機路徑、封存檔、ClawHub 套件或 npm artifact 重新安裝相同 id 時使用它。若只是對已追蹤的 npm Plugin 進行例行升級，建議使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 Plugin id 執行 `plugins install`，OpenClaw 會停止，並提示你使用 `plugins update <id-or-npm-spec>` 進行一般升級；若你確實想從不同來源覆寫目前安裝，則使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` 只適用於 npm 安裝。不支援與 `git:` 安裝搭配使用；當你想釘選來源時，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它也不支援與 `--marketplace` 搭配使用，因為 marketplace 安裝會保存 marketplace 來源中繼資料，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是針對內建危險程式碼掃描器誤判的破窗選項。即使內建掃描器回報 `critical` 發現，它也允許安裝繼續，但它**不會**繞過 Plugin `before_install` hook 政策封鎖，也**不會**繞過掃描失敗。

    這個 CLI 旗標適用於 Plugin install/update 流程。Gateway 支援的 Skill 相依性安裝會使用對應的 `dangerouslyForceUnsafeInstall` 請求覆寫，而 `openclaw skills install` 仍是獨立的 ClawHub Skill 下載/安裝流程。

    如果你發布到 ClawHub 的 Plugin 被 registry 掃描封鎖，請使用 [ClawHub](/zh-TW/tools/clawhub) 中的發布者步驟。

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 的 hook pack 的介面。請使用 `openclaw hooks` 取得篩選後的 hook 可見性與逐 hook 啟用，而不是用於套件安裝。

    Npm spec **僅限 registry**（套件名稱 + 選用的**精確版本**或 **dist-tag**）。Git/URL/file spec 與 semver range 會被拒絕。為了安全，即使你的 shell 有全域 npm 安裝設定，相依性安裝仍會以專案本機方式搭配 `--ignore-scripts` 執行。

    當你想明確指定 npm 解析時，請使用 `npm:<package>`。在發布切換期間，裸套件 spec 也會直接從 npm 安裝。

    裸 spec 與 `@latest` 會留在穩定軌。OpenClaw 日期戳記修正版號，例如 `2026.5.3-1`，在這項檢查中屬於穩定版發布。如果 npm 將其中任一解析為 prerelease，OpenClaw 會停止並要求你透過 prerelease 標籤（例如 `@beta`/`@rc`）或精確的 prerelease 版本（例如 `@1.2.3-beta.4`）明確選擇加入。

    如果裸安裝 spec 符合官方 Plugin id（例如 `diffs`），OpenClaw 會直接安裝 catalog 項目。若要安裝同名 npm 套件，請使用明確的 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repositories">
    使用 `git:<repo>` 可直接從 git repository 安裝。支援的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URL。加上 `@<ref>` 或 `#<ref>`，即可在安裝前簽出 branch、tag 或 commit。

    Git 安裝會 clone 到暫存目錄，在有要求 ref 時簽出該 ref，然後使用一般 Plugin 目錄安裝器。這表示 manifest 驗證、危險程式碼掃描、package-manager 安裝工作，以及安裝記錄都會像 npm 安裝一樣運作。已記錄的 git 安裝包含來源 URL/ref 與解析出的 commit，因此 `openclaw plugins update` 之後可以重新解析來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證 runtime 註冊，例如 gateway methods 與 CLI commands。如果該 Plugin 使用 `api.registerCli` 註冊了 CLI root，請直接透過 OpenClaw root CLI 執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="Archives">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw Plugin 封存檔必須在解壓後的 Plugin root 中包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的封存檔會在 OpenClaw 寫入安裝記錄前被拒絕。

    當檔案是 npm-pack tarball，且你想測試 registry 安裝使用的相同受管 npm-root 安裝路徑時，請使用 `npm-pack:<path.tgz>`，包括 `package-lock.json` 驗證、hoisted 相依性掃描，以及 npm 安裝記錄。一般封存檔路徑仍會以本機封存檔形式安裝在 Plugin extensions root 下。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在發布切換期間，裸 npm-safe Plugin spec 預設會從 npm 安裝：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可明確指定僅使用 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查宣告的 Plugin API / 最低 Gateway 相容性。當選定的 ClawHub 版本發布 ClawPack artifact 時，OpenClaw 會下載版本化的 npm-pack `.tgz`、驗證 ClawHub digest header 與 artifact digest，然後透過一般封存檔路徑安裝它。沒有 ClawPack 中繼資料的較舊 ClawHub 版本，仍會透過舊版套件封存檔驗證路徑安裝。已記錄的安裝會保留其 ClawHub 來源中繼資料、artifact 類型、npm integrity、npm shasum、tarball 名稱，以及 ClawPack digest 事實，以供之後更新使用。
未指定版本的 ClawHub 安裝會保留未指定版本的已記錄 spec，因此 `openclaw plugins update` 可以跟隨較新的 ClawHub 發布；明確版本或標籤 selector，例如 `clawhub:pkg@1.2.3` 與 `clawhub:pkg@beta`，則會保持釘選到該 selector。

#### Marketplace 簡寫

當 marketplace 名稱存在於 Claude 的本機 registry cache `~/.claude/plugins/known_marketplaces.json` 時，使用 `plugin@marketplace` 簡寫：

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
    對於從 GitHub 或 git 載入的遠端 marketplaces，Plugin 項目必須保留在已複製的 marketplace repo 內。OpenClaw 接受來自該 repo 的相對路徑來源，並拒絕遠端 manifests 中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑 Plugin 來源。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw plugins（`openclaw.plugin.json`）
- Codex 相容 bundles（`.codex-plugin/plugin.json`）
- Claude 相容 bundles（`.claude-plugin/plugin.json` 或預設 Claude component 版面配置）
- Cursor 相容 bundles（`.cursor-plugin/plugin.json`）

<Note>
相容 bundles 會安裝到一般 Plugin 根目錄，並參與相同的清單/資訊/啟用/停用流程。目前支援 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的 bundle capabilities 會顯示在診斷/資訊中，但尚未接入 runtime 執行。
</Note>

### 清單

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
  從表格檢視切換為每個 Plugin 的詳細列，包含 source/origin/version/activation 中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清單，加上 registry 診斷與 package dependency 安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久化的本機 Plugin registry；當 registry 遺失或無效時，會改用僅由 manifest 衍生的 fallback。這對檢查 Plugin 是否已安裝、已啟用，且對冷啟動規劃可見很有用，但它不是對已執行中 Gateway process 的即時 runtime probe。變更 Plugin 程式碼、啟用狀態、hook policy 或 `plugins.load.paths` 後，請重新啟動服務該 channel 的 Gateway，再預期新的 `register(api)` 程式碼或 hooks 會執行。對於遠端/container 部署，請確認重新啟動的是實際的 `openclaw gateway run` child，而不只是 wrapper process。

`plugins list --json` 包含每個 Plugin 從 `package.json`
`dependencies` 與 `optionalDependencies` 得出的 `dependencyStatus`。OpenClaw 會檢查這些 package
名稱是否存在於 Plugin 一般 Node `node_modules` 查找路徑中；它
不會匯入 Plugin runtime 程式碼、執行 package manager，或修復缺少的
dependencies。
</Note>

`plugins search` 是遠端 ClawHub catalog lookup。它不會檢查本機
狀態、變更 config、安裝 packages，或載入 Plugin runtime 程式碼。搜尋
結果包含 ClawHub package 名稱、family、channel、version、summary，以及
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

若要在封裝好的 Docker image 內進行 bundled Plugin 工作，請將 Plugin
source 目錄 bind-mount 到對應的封裝 source 路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會在
`/app/dist/extensions/synology-chat` 之前發現該掛載的 source
overlay；單純複製的 source
目錄仍會保持非作用狀態，因此一般封裝安裝仍會使用已編譯的 dist。

對於 runtime hook 偵錯：

- `openclaw plugins inspect <id> --runtime --json` 會顯示透過 module-loaded inspection pass 取得的已註冊 hooks 與診斷。Runtime inspection 絕不會安裝 dependencies；請使用 `openclaw doctor --fix` 清理 legacy dependency 狀態，或恢復 config 所參照但缺少的可下載 plugins。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、service/process 提示、config 路徑與 RPC 健康狀態。
- 非 bundled conversation hooks（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 以避免複製本機目錄（加入至 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援與 `--link` 一起使用，因為 linked installs 會重用 source 路徑，而不是覆寫 managed install 目標。

在 npm installs 上使用 `--pin`，可將解析後的精確 spec（`name@version`）儲存在 managed Plugin index，同時保留預設的未釘選行為。
</Note>

### Plugin index

Plugin install metadata 是由機器管理的狀態，不是使用者 config。安裝與更新會將其寫入 active OpenClaw state 目錄下的 `plugins/installs.json`。其 top-level `installRecords` map 是 install metadata 的 durable source，包含損壞或缺少 Plugin manifests 的 records。`plugins` array 是 manifest 衍生的 cold registry cache。該檔案包含不要編輯的警告，並由 `openclaw plugins update`、uninstall、diagnostics 與 cold Plugin registry 使用。

當 OpenClaw 在 config 中看到已交付的 legacy `plugins.installs` records 時，會將它們移入 Plugin index 並移除 config key；如果任一寫入失敗，config records 會保留下來，避免 install metadata 遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會從 `plugins.entries`、持久化的 Plugin index、Plugin allow/deny list 項目，以及適用時 linked `plugins.load.paths` 項目中移除 Plugin records。除非設定 `--keep-files`，uninstall 也會移除被追蹤的 managed install 目錄，前提是它位於 OpenClaw 的 Plugin extensions root 內。對於 active memory plugins，memory slot 會重設為 `memory-core`。

<Note>
`--keep-config` 作為 `--keep-files` 的 deprecated alias 受到支援。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新會套用到 managed Plugin index 中被追蹤的 Plugin installs，以及 `hooks.internal.installs` 中被追蹤的 hook-pack installs。

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    當你傳入 Plugin id 時，OpenClaw 會重用該 Plugin 記錄的 install spec。這表示先前儲存的 dist-tags，例如 `@beta`，以及精確釘選版本，在後續 `update <id>` 執行時會繼續使用。

    對於 npm installs，你也可以傳入明確的 npm package spec，搭配 dist-tag 或精確版本。OpenClaw 會將該 package 名稱解析回被追蹤的 Plugin record，更新該已安裝的 Plugin，並記錄新的 npm spec 供未來以 id 為基礎的更新使用。

    傳入不含版本或 tag 的 npm package 名稱，也會解析回被追蹤的 Plugin record。當 Plugin 被釘選到精確版本，而你想將它移回 registry 的預設 release line 時，請使用這個方式。

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` 會重用被追蹤的 Plugin spec，除非你傳入新的 spec。`openclaw update` 另外知道 active OpenClaw update channel：在 beta channel 上，default-line npm 與 ClawHub Plugin records 會先嘗試 `@beta`，若不存在 Plugin beta release，才 fallback 到記錄的 default/latest spec。精確版本與明確 tags 會保持釘選到該 selector。

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    在 live npm update 之前，OpenClaw 會對照 npm registry metadata 檢查已安裝的 package version。如果已安裝版本與記錄的 artifact identity 已經符合解析後的目標，更新會略過，不會下載、重新安裝或重寫 `openclaw.json`。

    當已儲存的 integrity hash 存在且抓取的 artifact hash 改變時，OpenClaw 會將此視為 npm artifact drift。互動式 `openclaw plugins update` 命令會印出預期與實際 hashes，並在繼續前要求確認。非互動式 update helpers 預設會 fail closed，除非呼叫端提供明確的 continuation policy。

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` 也可在 `plugins update` 上使用，作為 Plugin 更新期間內建 dangerous-code scan 誤判的 break-glass override。它仍不會繞過 Plugin `before_install` policy blocks 或 scan-failure blocking，且只適用於 Plugin updates，不適用於 hook-pack updates。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不會匯入 Plugin runtime，而會顯示 identity、load status、source、manifest capabilities、policy flags、diagnostics、install metadata、bundle capabilities，以及任何偵測到的 MCP 或 LSP server 支援。加入 `--runtime` 會載入 Plugin module，並包含 registered hooks、tools、commands、services、gateway methods 與 HTTP routes。Runtime inspection 會直接回報缺少的 Plugin dependencies；安裝與修復仍位於 `openclaw plugins install`、`openclaw plugins update` 與 `openclaw doctor --fix`。

Plugin 擁有的 CLI commands 會安裝為根層級 `openclaw` command groups。當 `inspect --runtime` 在 `cliCommands` 下顯示 command 後，請以 `openclaw <command> ...` 執行它；例如註冊 `demo-git` 的 Plugin 可透過 `openclaw demo-git ping` 驗證。

每個 Plugin 都會依其在 runtime 實際註冊的內容分類：

- **plain-capability** — 一種 capability type（例如僅 provider 的 Plugin）
- **hybrid-capability** — 多種 capability types（例如 text + speech + images）
- **hook-only** — 只有 hooks，沒有 capabilities 或 surfaces
- **non-capability** — 有 tools/commands/services，但沒有 capabilities

請參閱 [Plugin shapes](/zh-TW/plugins/architecture#plugin-shapes) 以了解更多 capability model。

<Note>
`--json` flag 會輸出適合 scripting 與 auditing 的機器可讀 report。`inspect --all` 會呈現 fleet-wide table，包含 shape、capability kinds、compatibility notices、bundle capabilities 與 hook summary columns。`info` 是 `inspect` 的 alias。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報 Plugin load errors、manifest/discovery diagnostics 與 compatibility notices。當一切乾淨時，會印出 `No plugin issues detected.`

如果已設定的 Plugin 存在於磁碟上，但被 loader 的 path-safety checks 阻擋，config validation 會保留該 Plugin entry，並將其回報為 `present but blocked`。請修正前面的 blocked-plugin diagnostic，例如 path ownership 或 world-writable permissions，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` config。

對於 module-shape failures，例如缺少 `register`/`activate` exports，請以 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在 diagnostic output 中包含精簡的 export-shape summary。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 Plugin 登錄檔是 OpenClaw 對已安裝 Plugin 身分、啟用狀態、來源中繼資料和貢獻擁有權所持久化的冷讀取模型。一般啟動、提供者擁有者查詢、通道設定分類和 Plugin 清單都可以讀取它，而不需匯入 Plugin 執行階段模組。

使用 `plugins registry` 檢查持久化的登錄檔是否存在、為最新狀態或已過期。使用 `--refresh` 從持久化的 Plugin 索引、設定政策和 manifest/package 中繼資料重建它。這是修復路徑，不是執行階段啟用路徑。

`openclaw doctor --fix` 也會修復與登錄檔相鄰的受管理 npm 漂移：如果受管理 Plugin npm 根目錄下某個孤立或復原的 `@openclaw/*` package 遮蔽了 bundled Plugin，doctor 會移除該過期 package 並重建登錄檔，讓啟動流程根據 bundled manifest 進行驗證。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的破窗相容性開關，用於登錄檔讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；env 備援僅用於遷移推出期間的緊急啟動復原。
</Warning>

### 市集

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市集清單接受本機市集路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會列印解析後的來源標籤，以及剖析後的市集 manifest 和 Plugin 項目。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [社群 Plugin](/zh-TW/plugins/community)
