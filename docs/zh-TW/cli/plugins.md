---
read_when:
    - 您想安裝或管理 Gateway Plugin 或相容套件
    - 您想要偵錯 Plugin 載入失敗
sidebarTitle: Plugins
summary: CLI 參考：`openclaw plugins`（list、install、marketplace、uninstall、enable/disable、doctor）
title: Plugin
x-i18n:
    generated_at: "2026-05-02T22:17:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway Plugin、hook 套件包，以及相容套件包。

<CardGroup cols={2}>
  <Card title="Plugin 系統" href="/zh-TW/tools/plugin">
    安裝、啟用與疑難排解 Plugin 的終端使用者指南。
  </Card>
  <Card title="管理 Plugin" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝與發布的快速範例。
  </Card>
  <Card title="Plugin 套件包" href="/zh-TW/plugins/bundles">
    套件包相容性模型。
  </Card>
  <Card title="Plugin 資訊清單" href="/zh-TW/plugins/manifest">
    資訊清單欄位與設定結構描述。
  </Card>
  <Card title="安全性" href="/zh-TW/gateway/security">
    Plugin 安裝的安全強化。
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

若要調查安裝、檢查、解除安裝或重新整理註冊表速度緩慢的問題，請以
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行指令。追蹤會將階段計時寫入
stderr，並讓 JSON 輸出保持可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
隨附 Plugin 會與 OpenClaw 一起提供。有些預設啟用（例如隨附模型供應者、隨附語音供應者，以及隨附瀏覽器 Plugin）；其他則需要執行 `plugins enable`。

原生 OpenClaw Plugin 必須隨附 `openclaw.plugin.json`，其中包含內嵌 JSON Schema（`configSchema`，即使為空也一樣）。相容套件包則改用自己的套件包資訊清單。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細的 list/info 輸出也會顯示套件包子類型（`codex`、`claude` 或 `cursor`）以及偵測到的套件包功能。
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
在啟動切換期間，裸套件名稱預設會從 npm 安裝。ClawHub 請使用 `clawhub:<package>`。請像執行程式碼一樣看待 Plugin 安裝。建議使用釘選版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 Plugin 套件，並列印
可直接安裝的套件名稱。它會搜尋 code-plugin 與 bundle-plugin 套件，
而非 Skills。若要搜尋 ClawHub Skills，請使用 `openclaw skills search`。

<Note>
ClawHub 是多數 Plugin 的主要散發與探索介面。npm
仍是支援的備援與直接安裝路徑。OpenClaw 擁有的
`@openclaw/*` Plugin 套件已再次發布到 npm；請在
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或
[Plugin 清冊](/zh-TW/plugins/plugin-inventory)查看目前清單。穩定安裝使用 `latest`。
Beta 頻道安裝與更新會在 npm `beta` dist-tag 可用時優先使用該標籤，
然後才退回 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="設定 include 與無效設定復原">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該 include 檔案，並讓 `openclaw.json` 保持不變。根 include、include 陣列，以及帶有同層覆寫的 include 會封閉失敗，而不會攤平。支援的形狀請參閱[設定 include](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會封閉失敗，並要求你先執行 `openclaw doctor --fix`。Gateway 啟動期間，單一 Plugin 的無效設定會被隔離到該 Plugin，因此其他頻道與 Plugin 可繼續執行；`openclaw doctor --fix` 可以隔離無效的 Plugin 項目。唯一有文件記載的安裝時例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的 Plugin 所提供的狹窄隨附 Plugin 復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝相較於更新">
    `--force` 會重用既有安裝目標，並在原處覆寫已安裝的 Plugin 或 hook 套件包。當你有意從新的本機路徑、封存檔、ClawHub 套件或 npm 成品重新安裝同一個 id 時，請使用它。若要例行升級已追蹤的 npm Plugin，建議使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 Plugin id 執行 `plugins install`，OpenClaw 會停止，並指引你使用 `plugins update <id-or-npm-spec>` 進行一般升級；若你確實想從不同來源覆寫目前安裝，則會指引你使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 只適用於 npm 安裝。它不支援 `git:` 安裝；當你想釘選來源時，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它不支援 `--marketplace`，因為市集安裝會持久化市集來源中繼資料，而非 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是內建危險程式碼掃描器誤判時的破窗選項。即使內建掃描器回報 `critical` 發現項目，它仍允許安裝繼續，但它**不會**繞過 Plugin `before_install` hook 政策封鎖，也**不會**繞過掃描失敗。

    這個 CLI 旗標適用於 Plugin 安裝/更新流程。Gateway 支援的 skill 相依項安裝會使用對應的 `dangerouslyForceUnsafeInstall` 請求覆寫，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

    如果你發布到 ClawHub 的 Plugin 被註冊表掃描封鎖，請使用 [ClawHub](/zh-TW/tools/clawhub) 中的發布者步驟。

  </Accordion>
  <Accordion title="Hook 套件包與 npm spec">
    `plugins install` 也是 hook 套件包的安裝介面，這類套件包會在 `package.json` 中公開 `openclaw.hooks`。請使用 `openclaw hooks` 取得篩選後的 hook 可見性與個別 hook 啟用，而不是用於套件安裝。

    npm spec **僅限註冊表**（套件名稱 + 選用的**精確版本**或 **dist-tag**）。Git/URL/file spec 與 semver 範圍會被拒絕。為了安全，即使你的 shell 有全域 npm 安裝設定，相依項安裝仍會以專案本機方式搭配 `--ignore-scripts` 執行。

    當你想明確指定 npm 解析時，請使用 `npm:<package>`。在啟動切換期間，裸套件 spec 也會直接從 npm 安裝。

    裸 spec 與 `@latest` 會留在穩定軌道。如果 npm 將其中任一解析為預發行版本，OpenClaw 會停止，並要求你透過預發行標籤（例如 `@beta`/`@rc`）或精確預發行版本（例如 `@1.2.3-beta.4`）明確選擇加入。

    如果裸安裝 spec 符合官方 Plugin id（例如 `diffs`），OpenClaw 會直接安裝目錄項目。若要安裝同名 npm 套件，請使用明確的 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git 儲存庫">
    使用 `git:<repo>` 可直接從 git 儲存庫安裝。支援形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URL。加入 `@<ref>` 或 `#<ref>` 可在安裝前簽出分支、標籤或 commit。

    Git 安裝會 clone 到暫存目錄，在存在要求的 ref 時簽出該 ref，然後使用一般 Plugin 目錄安裝器。這表示資訊清單驗證、危險程式碼掃描、套件管理器安裝工作，以及安裝紀錄都會像 npm 安裝一樣運作。已記錄的 git 安裝包含來源 URL/ref 與解析後的 commit，因此 `openclaw plugins update` 之後可以重新解析來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證 runtime 註冊，例如 gateway 方法與 CLI 指令。如果 Plugin 透過 `api.registerCli` 註冊了 CLI 根，請直接透過 OpenClaw 根 CLI 執行該指令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw Plugin 封存檔必須在解壓後的 Plugin 根目錄包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的封存檔會在 OpenClaw 寫入安裝紀錄之前被拒絕。

    也支援 Claude 市集安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` 定位器：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在啟動切換期間，裸 npm 安全 Plugin spec 預設會從 npm 安裝：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可明確指定僅 npm 解析：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查公告的 Plugin API / 最低 gateway 相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載有版本的 npm-pack `.tgz`、驗證 ClawHub 摘要標頭與成品摘要，然後透過一般封存路徑安裝。沒有 ClawPack 中繼資料的較舊 ClawHub 版本仍會透過舊版套件封存驗證路徑安裝。已記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm integrity、npm shasum、tarball 名稱，以及 ClawPack 摘要事實，以供日後更新。
未指定版本的 ClawHub 安裝會保留未指定版本的已記錄 spec，因此 `openclaw plugins update` 可以跟隨較新的 ClawHub 發行；明確版本或標籤選擇器（例如 `clawhub:pkg@1.2.3` 與 `clawhub:pkg@beta`）仍會釘選到該選擇器。

#### 市集簡寫

當市集名稱存在於 Claude 位於 `~/.claude/plugins/known_marketplaces.json` 的本機註冊表快取時，請使用 `plugin@marketplace` 簡寫：

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
  <Tab title="Marketplace 來源">
    - 來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名稱
    - 本機 marketplace 根目錄或 `marketplace.json` 路徑
    - GitHub repo 簡寫，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="遠端 marketplace 規則">
    對於從 GitHub 或 git 載入的遠端 marketplace，Plugin 項目必須保留在複製的 marketplace repo 內。OpenClaw 會接受該 repo 中的相對路徑來源，並拒絕遠端 manifest 中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑 Plugin 來源。
  </Tab>
</Tabs>

對於本機路徑和封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 相容 bundle（`.codex-plugin/plugin.json`）
- Claude 相容 bundle（`.claude-plugin/plugin.json` 或預設 Claude component 版面配置）
- Cursor 相容 bundle（`.cursor-plugin/plugin.json`）

<Note>
相容 bundle 會安裝到一般 Plugin 根目錄，並參與相同的 list/info/enable/disable 流程。目前支援 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的 bundle capability 會顯示在 diagnostics/info 中，但尚未接入 runtime 執行。
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
  只顯示已啟用的 Plugin。
</ParamField>
<ParamField path="--verbose" type="boolean">
  從表格檢視切換為每個 Plugin 一行詳細資料，包含 source/origin/version/activation metadata。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀取的 inventory，加上 registry diagnostics 和 package dependency install state。
</ParamField>

<Note>
`plugins list` 會先讀取持久化的本機 Plugin registry；當 registry 遺失或無效時，才使用僅由 manifest 衍生的 fallback。它適合用來檢查某個 Plugin 是否已安裝、已啟用，並且可被 cold startup planning 看見，但它不是對已在執行中的 Gateway process 的即時 runtime 探測。變更 Plugin 程式碼、啟用狀態、hook policy 或 `plugins.load.paths` 之後，請重新啟動服務該 channel 的 Gateway，再期待新的 `register(api)` 程式碼或 hook 執行。對於遠端/container 部署，請確認你重新啟動的是實際的 `openclaw gateway run` child，而不只是 wrapper process。

`plugins list --json` 會包含每個 Plugin 來自 `package.json`
`dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些 package
名稱是否存在於該 Plugin 一般 Node `node_modules` 查找路徑上；它不會
import Plugin runtime 程式碼、執行 package manager，或修復遺失的
dependencies。
</Note>

`plugins search` 是遠端 ClawHub catalog 查詢。它不會檢查本機
狀態、變更 config、安裝 package，或載入 Plugin runtime 程式碼。搜尋
結果包含 ClawHub package 名稱、family、channel、version、summary，以及
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

若要在封裝的 Docker image 內處理 bundled Plugin，請將 Plugin
source 目錄 bind-mount 到相符的封裝 source 路徑，例如
`/app/extensions/synology-chat`。OpenClaw 會先於 `/app/dist/extensions/synology-chat` 偵測到該掛載的 source
overlay；單純複製的 source
目錄仍會維持 inert，因此一般封裝安裝仍使用已編譯的 dist。

對於 runtime hook debugging：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自 module-loaded inspection pass 的已註冊 hook 和 diagnostics。Runtime inspection 絕不會安裝 dependencies；請使用 `openclaw doctor --fix` 清理 legacy dependency state，或安裝遺失的已設定 downloadable Plugin。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、service/process 提示、config 路徑和 RPC 健康狀態。
- 非 bundled conversation hook（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 以避免複製本機目錄（會加入 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援與 `--link` 搭配使用，因為 linked install 會重用 source 路徑，而不是覆寫 managed install target。

在 npm install 上使用 `--pin`，可在 managed Plugin index 中儲存解析後的精確 spec（`name@version`），同時保持預設行為不 pinned。
</Note>

### Plugin 索引

Plugin install metadata 是機器管理的狀態，不是使用者 config。安裝和更新會將它寫入 active OpenClaw state directory 下的 `plugins/installs.json`。其 top-level `installRecords` map 是 install metadata 的持久來源，包含 broken 或 missing Plugin manifests 的 records。`plugins` array 是 manifest-derived cold registry cache。該檔案包含請勿編輯警告，並由 `openclaw plugins update`、uninstall、diagnostics 和 cold Plugin registry 使用。

當 OpenClaw 在 config 中看到 shipped legacy `plugins.installs` records 時，會將它們移入 Plugin index 並移除 config key；如果任一寫入失敗，config records 會保留下來，避免 install metadata 遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會從 `plugins.entries`、持久化的 Plugin index、Plugin allow/deny list entries，以及適用時 linked `plugins.load.paths` entries 中移除 Plugin records。除非設定 `--keep-files`，否則 uninstall 也會在 tracked managed install directory 位於 OpenClaw 的 Plugin extensions root 內時移除它。對於 active memory Plugin，memory slot 會重設為 `memory-core`。

<Note>
`--keep-config` 是已棄用的 `--keep-files` alias，仍受支援。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新會套用至 managed Plugin index 中被追蹤的 Plugin install，以及 `hooks.internal.installs` 中被追蹤的 hook-pack install。

<AccordionGroup>
  <Accordion title="解析 Plugin id 與 npm spec">
    當你傳入 Plugin id 時，OpenClaw 會重用該 Plugin 記錄的 install spec。這表示先前儲存的 dist-tags（例如 `@beta`）以及精確 pinned versions，會在之後的 `update <id>` 執行中繼續使用。

    對於 npm install，你也可以傳入含有 dist-tag 或精確 version 的明確 npm package spec。OpenClaw 會將該 package name 解析回被追蹤的 Plugin record，更新該已安裝的 Plugin，並記錄新的 npm spec 供日後 id-based updates 使用。

    傳入不含 version 或 tag 的 npm package name，也會解析回被追蹤的 Plugin record。當某個 Plugin 已 pinned 到精確 version，而你想將它移回 registry 的 default release line 時，請使用這個方式。

  </Accordion>
  <Accordion title="Beta channel 更新">
    `openclaw plugins update` 會重用被追蹤的 Plugin spec，除非你傳入新的 spec。`openclaw update` 另外知道 active OpenClaw update channel：在 beta channel 上，default-line npm 和 ClawHub Plugin records 會先嘗試 `@beta`，若不存在 Plugin beta release，則 fallback 到記錄的 default/latest spec。精確 versions 和明確 tags 會維持 pinned 到該 selector。

  </Accordion>
  <Accordion title="Version 檢查與 integrity drift">
    在 live npm update 之前，OpenClaw 會根據 npm registry metadata 檢查已安裝的 package version。如果已安裝 version 和已記錄 artifact identity 已經符合解析出的 target，更新會被略過，不會下載、重新安裝或重寫 `openclaw.json`。

    當存在已儲存的 integrity hash，且抓取到的 artifact hash 發生變更時，OpenClaw 會將其視為 npm artifact drift。互動式 `openclaw plugins update` command 會列印 expected 和 actual hashes，並在繼續前要求確認。非互動式 update helper 會 fail closed，除非 caller 提供明確的 continuation policy。

  </Accordion>
  <Accordion title="更新時使用 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可在 `plugins update` 上使用，作為 Plugin 更新期間內建 dangerous-code scan false positives 的 break-glass override。它仍不會繞過 Plugin `before_install` policy blocks 或 scan-failure blocking，而且只套用於 Plugin 更新，不套用於 hook-pack 更新。
  </Accordion>
</AccordionGroup>

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不會 import Plugin runtime，會顯示 identity、load status、source、manifest capabilities、policy flags、diagnostics、install metadata、bundle capabilities，以及任何偵測到的 MCP 或 LSP server support。加入 `--runtime` 可載入 Plugin module，並包含已註冊的 hooks、tools、commands、services、gateway methods 和 HTTP routes。Runtime inspection 會直接報告遺失的 Plugin dependencies；安裝和修復仍保留在 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix`。

Plugin 擁有的 CLI commands 會安裝為 root `openclaw` command groups。當 `inspect --runtime` 在 `cliCommands` 下顯示某個 command 後，請以 `openclaw <command> ...` 執行；例如註冊 `demo-git` 的 Plugin，可用 `openclaw demo-git ping` 驗證。

每個 Plugin 會依據它在 runtime 實際註冊的內容分類：

- **plain-capability** — 一種 capability type（例如 provider-only Plugin）
- **hybrid-capability** — 多種 capability types（例如 text + speech + images）
- **hook-only** — 只有 hooks，沒有 capabilities 或 surfaces
- **non-capability** — tools/commands/services，但沒有 capabilities

更多 capability model 資訊請參閱 [Plugin shapes](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` flag 會輸出適合 scripting 和 auditing 的機器可讀取 report。`inspect --all` 會呈現 fleet-wide table，包含 shape、capability kinds、compatibility notices、bundle capabilities 和 hook summary 欄位。`info` 是 `inspect` 的 alias。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會報告 Plugin load errors、manifest/discovery diagnostics 和 compatibility notices。當一切正常時，它會列印 `No plugin issues detected.`

對於 module-shape failures，例如遺失 `register`/`activate` exports，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在 diagnostic output 中包含精簡的 export-shape summary。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 Plugin registry 是 OpenClaw 持久化的 cold read model，用於已安裝 Plugin identity、enablement、source metadata 和 contribution ownership。一般 startup、provider owner lookup、channel setup classification 和 Plugin inventory 可以讀取它，而不必 import Plugin runtime modules。

使用 `plugins registry` 檢查持久化 registry 是否存在、是否為 current 或 stale。使用 `--refresh` 可從持久化的 Plugin index、config policy 和 manifest/package metadata 重建它。這是 repair path，不是 runtime activation path。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的緊急相容性開關，用於登錄檔讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；此環境變數備援只用於遷移逐步推出期間的緊急啟動復原。
</Warning>

### 市集

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市集清單可接受本機市集路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub 存放庫 URL，或 git URL。`--json` 會列印解析後的來源標籤，以及剖析後的市集資訊清單與 Plugin 項目。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考資料](/zh-TW/cli)
- [社群 Plugin](/zh-TW/plugins/community)
