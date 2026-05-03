---
read_when:
    - 您想安裝或管理 Gateway Plugin 或相容套件組合
    - 你想要偵錯 Plugin 載入失敗
sidebarTitle: Plugins
summary: CLI 參考：`openclaw plugins`（list、install、marketplace、uninstall、enable/disable、doctor）
title: Plugin
x-i18n:
    generated_at: "2026-05-03T21:29:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway plugins、hook packs 與相容的 bundles。

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
    Manifest 欄位與設定 schema。
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

若要調查緩慢的安裝、檢查、解除安裝或 registry-refresh，請搭配
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行命令。追蹤會將階段計時寫入
stderr，並保持 JSON 輸出可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
Bundled plugins 會隨 OpenClaw 一起提供。有些預設啟用（例如 bundled model providers、bundled speech providers 與 bundled browser plugin）；其他則需要 `plugins enable`。

原生 OpenClaw plugins 必須提供 `openclaw.plugin.json`，並包含內嵌 JSON Schema（`configSchema`，即使是空的）。相容 bundles 則使用自己的 bundle manifests。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細的 list/info 輸出也會顯示 bundle 子類型（`codex`、`claude` 或 `cursor`）以及偵測到的 bundle 能力。
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
裸套件名稱在啟動切換期間預設會從 npm 安裝。請使用 `clawhub:<package>` 取得 ClawHub。請將 plugin 安裝視為執行程式碼。建議使用釘選版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 plugin 套件，並列印
可直接安裝的套件名稱。它會搜尋 code-plugin 與 bundle-plugin 套件，
而非 skills。請使用 `openclaw skills search` 搜尋 ClawHub skills。

<Note>
ClawHub 是大多數 plugins 的主要散布與探索介面。Npm
仍是受支援的備援與直接安裝路徑。OpenClaw 擁有的
`@openclaw/*` plugin 套件已再次發布到 npm；請在
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或
[plugin 清單](/zh-TW/plugins/plugin-inventory)查看目前清單。穩定版安裝使用 `latest`。
Beta 通道安裝與更新會在 npm `beta` dist-tag 可用時優先使用該標籤，
然後才回退到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="Config includes 與無效設定修復">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該被包含的檔案，並保持 `openclaw.json` 不變。Root includes、include arrays，以及帶有同層覆寫的 includes 會 fail closed，而不是被扁平化。請參閱 [Config includes](/zh-TW/gateway/configuration) 了解支援的形狀。

    如果安裝期間設定無效，`plugins install` 通常會 fail closed，並要求你先執行 `openclaw doctor --fix`。在 Gateway 啟動與熱重新載入期間，無效的 plugin 設定會像其他無效設定一樣 fail closed；`openclaw doctor --fix` 可以隔離無效的 plugin 項目。唯一有文件記載的安裝時例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的 plugins 的狹窄 bundled-plugin 復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝相對於更新">
    `--force` 會重用現有安裝目標，並就地覆寫已安裝的 plugin 或 hook pack。當你有意從新的本機路徑、封存檔、ClawHub 套件或 npm artifact 重新安裝相同 id 時使用它。對於已追蹤 npm plugin 的例行升級，建議使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 plugin id 執行 `plugins install`，OpenClaw 會停止並指向 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時，指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 僅適用於 npm 安裝。不支援搭配 `git:` 安裝；當你想釘選來源時，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它不支援搭配 `--marketplace`，因為 marketplace 安裝會保存 marketplace 來源中繼資料，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是針對內建危險程式碼掃描器誤判的 break-glass 選項。即使內建掃描器回報 `critical` 發現項目，它也允許安裝繼續，但它**不會**繞過 plugin `before_install` hook 政策封鎖，也**不會**繞過掃描失敗。

    此 CLI 旗標適用於 plugin 安裝/更新流程。Gateway 支援的 skill 相依項安裝會使用對應的 `dangerouslyForceUnsafeInstall` 請求覆寫，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

    如果你發布在 ClawHub 上的 plugin 被 registry 掃描封鎖，請使用 [ClawHub](/zh-TW/tools/clawhub) 中的發布者步驟。

  </Accordion>
  <Accordion title="Hook packs 與 npm specs">
    `plugins install` 也是安裝 hook packs 的介面，這些 hook packs 會在 `package.json` 中公開 `openclaw.hooks`。請使用 `openclaw hooks` 進行篩選後的 hook 可見性與逐 hook 啟用，而不是套件安裝。

    Npm specs 是**僅限 registry**（套件名稱加上選用的**精確版本**或 **dist-tag**）。Git/URL/file specs 與 semver ranges 會被拒絕。為了安全，即使你的 shell 有全域 npm 安裝設定，相依項安裝仍會以 project-local 搭配 `--ignore-scripts` 執行。

    當你想明確使用 npm resolution 時，請使用 `npm:<package>`。裸套件 specs 在啟動切換期間也會直接從 npm 安裝。

    裸 specs 與 `@latest` 會留在穩定版軌道。如果 npm 將其中任一項解析為 prerelease，OpenClaw 會停止，並要求你使用 prerelease 標籤（例如 `@beta`/`@rc`）或精確的 prerelease 版本（例如 `@1.2.3-beta.4`）明確選擇加入。

    如果裸安裝 spec 符合官方 plugin id（例如 `diffs`），OpenClaw 會直接安裝 catalog entry。若要安裝同名的 npm 套件，請使用明確的 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repositories">
    使用 `git:<repo>` 直接從 git repository 安裝。支援的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URLs。加入 `@<ref>` 或 `#<ref>` 可在安裝前 checkout branch、tag 或 commit。

    Git 安裝會 clone 到臨時目錄，在存在指定 ref 時 checkout 該 ref，然後使用一般 plugin 目錄安裝器。這表示 manifest 驗證、危險程式碼掃描、package-manager 安裝工作與安裝記錄的行為都像 npm 安裝。記錄的 git 安裝會包含來源 URL/ref 以及已解析的 commit，讓 `openclaw plugins update` 之後可以重新解析來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證 runtime registrations，例如 gateway methods 與 CLI commands。如果 plugin 透過 `api.registerCli` 註冊了 CLI root，請直接透過 OpenClaw root CLI 執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="Archives">
    支援的 archives：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw plugin archives 必須在解壓後的 plugin root 中包含有效的 `openclaw.plugin.json`；僅包含 `package.json` 的 archives 會在 OpenClaw 寫入安裝記錄前被拒絕。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

裸 npm-safe plugin specs 在啟動切換期間預設會從 npm 安裝：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 讓僅限 npm 的解析變得明確：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查所宣告的 plugin API / 最低 gateway 相容性。當選定的 ClawHub 版本發布 ClawPack artifact 時，OpenClaw 會下載版本化的 npm-pack `.tgz`，驗證 ClawHub digest header 與 artifact digest，然後透過一般 archive 路徑安裝。沒有 ClawPack metadata 的較舊 ClawHub 版本仍會透過舊版套件 archive 驗證路徑安裝。記錄的安裝會保留其 ClawHub 來源中繼資料、artifact kind、npm integrity、npm shasum、tarball name 與 ClawPack digest facts，以供之後更新使用。
未版本化的 ClawHub 安裝會保留未版本化的記錄 spec，讓 `openclaw plugins update` 可以跟隨較新的 ClawHub releases；明確的版本或標籤選擇器，例如 `clawhub:pkg@1.2.3` 與 `clawhub:pkg@beta`，會保持釘選到該選擇器。

#### Marketplace 速記

當 marketplace 名稱存在於 Claude 位於 `~/.claude/plugins/known_marketplaces.json` 的本機 registry cache 時，請使用 `plugin@marketplace` 速記：

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
  <Tab title="Marketplace 來源">
    - 來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名稱
    - 本機 marketplace 根目錄或 `marketplace.json` 路徑
    - GitHub repo 簡寫，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="遠端 marketplace 規則">
    對於從 GitHub 或 git 載入的遠端 marketplace，plugin 項目必須留在複製下來的 marketplace repo 內。OpenClaw 接受來自該 repo 的相對路徑來源，並拒絕遠端 manifest 中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑的 plugin 來源。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw plugins（`openclaw.plugin.json`）
- Codex 相容 bundle（`.codex-plugin/plugin.json`）
- Claude 相容 bundle（`.claude-plugin/plugin.json` 或預設 Claude component 版面配置）
- Cursor 相容 bundle（`.cursor-plugin/plugin.json`）

<Note>
相容 bundle 會安裝到一般 plugin 根目錄，並參與相同的 list/info/enable/disable 流程。目前支援 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的 bundle 功能會顯示在 diagnostics/info 中，但尚未接入 runtime execution。
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
  從表格檢視切換為每個 plugin 的詳細行，包含 source/origin/version/activation metadata。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的 inventory，加上 registry diagnostics 與 package dependency 安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久化的本機 plugin registry；若 registry 遺失或無效，則退回使用僅由 manifest 衍生的 fallback。它適合用來檢查 plugin 是否已安裝、已啟用，並且對 cold startup planning 可見，但它不是對已執行中 Gateway process 的即時 runtime probe。變更 plugin code、啟用狀態、hook policy 或 `plugins.load.paths` 後，請重新啟動服務 channel 的 Gateway，再期待新的 `register(api)` code 或 hooks 執行。對於遠端/container 部署，請確認你重新啟動的是實際的 `openclaw gateway run` child，而不只是 wrapper process。

`plugins list --json` 會包含每個 plugin 從 `package.json`
`dependencies` 與 `optionalDependencies` 取得的 `dependencyStatus`。OpenClaw 會檢查這些 package
名稱是否存在於 plugin 一般 Node `node_modules` lookup path 中；它
不會 import plugin runtime code、執行 package manager，或修復缺少的
dependencies。
</Note>

`plugins search` 是遠端 ClawHub catalog lookup。它不會檢查本機
state、變更 config、安裝 packages，或載入 plugin runtime code。搜尋
結果包含 ClawHub package name、family、channel、version、summary，以及
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

若要在 packaged Docker image 內處理 bundled plugin，請 bind-mount plugin
source directory 到相符的 packaged source path 上，例如
`/app/extensions/synology-chat`。OpenClaw 會在 `/app/dist/extensions/synology-chat` 之前發現該掛載的 source
overlay；單純複製的 source
directory 會維持 inert，因此一般 packaged installs 仍會使用已編譯的 dist。

針對 runtime hook debugging：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自 module-loaded inspection pass 的已註冊 hooks 與 diagnostics。Runtime inspection 絕不會安裝 dependencies；請使用 `openclaw doctor --fix` 清理 legacy dependency state，或安裝缺少且已設定的 downloadable plugins。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、service/process hints、config path，以及 RPC health。
- 非 bundled conversation hooks（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 避免複製本機目錄（會加入 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援與 `--link` 搭配使用，因為 linked installs 會重用 source path，而不是覆寫 managed install target。

在 npm installs 上使用 `--pin`，可將解析後的 exact spec（`name@version`）儲存在 managed plugin index 中，同時保留預設的 unpinned 行為。
</Note>

### Plugin index

Plugin install metadata 是機器管理的 state，不是 user config。Installs 與 updates 會將它寫入 active OpenClaw state directory 底下的 `plugins/installs.json`。其 top-level `installRecords` map 是 install metadata 的持久來源，包含 broken 或 missing plugin manifests 的 records。`plugins` array 是由 manifest 衍生的 cold registry cache。該檔案包含 do-not-edit warning，並由 `openclaw plugins update`、uninstall、diagnostics，以及 cold plugin registry 使用。

當 OpenClaw 在 config 中看到已出貨的 legacy `plugins.installs` records 時，會將它們移入 plugin index 並移除 config key；若任一寫入失敗，config records 會被保留，避免 install metadata 遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會從 `plugins.entries`、持久化 plugin index、plugin allow/deny list 項目，以及適用時 linked `plugins.load.paths` 項目中移除 plugin records。除非設定 `--keep-files`，uninstall 也會移除追蹤到的 managed install directory，前提是它位於 OpenClaw 的 plugin extensions root 內。對於 active memory plugins，memory slot 會重設為 `memory-core`。

<Note>
`--keep-config` 支援作為 `--keep-files` 的已棄用 alias。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates 會套用到 managed plugin index 中追蹤的 plugin installs，以及 `hooks.internal.installs` 中追蹤的 hook-pack installs。

<AccordionGroup>
  <Accordion title="解析 plugin id 與 npm spec">
    當你傳入 plugin id 時，OpenClaw 會重用該 plugin 記錄的 install spec。這表示先前儲存的 dist-tags，例如 `@beta`，以及 exact pinned versions，會在後續 `update <id>` 執行時繼續使用。

    對於 npm installs，你也可以傳入明確的 npm package spec，附上 dist-tag 或 exact version。OpenClaw 會將該 package name 解析回追蹤中的 plugin record，更新該已安裝 plugin，並記錄新的 npm spec 供未來以 id 為基礎的 updates 使用。

    傳入不含 version 或 tag 的 npm package name 也會解析回追蹤中的 plugin record。當 plugin 已 pinned 到 exact version，而你想將它移回 registry 的預設 release line 時，請使用此方式。

  </Accordion>
  <Accordion title="Beta channel 更新">
    `openclaw plugins update` 會重用追蹤中的 plugin spec，除非你傳入新的 spec。`openclaw update` 另外知道 active OpenClaw update channel：在 beta channel 上，default-line npm 與 ClawHub plugin records 會先嘗試 `@beta`，若不存在 plugin beta release，則退回使用記錄的 default/latest spec。Exact versions 與 explicit tags 會持續 pinned 到該 selector。

  </Accordion>
  <Accordion title="Version checks 與 integrity drift">
    在 live npm update 之前，OpenClaw 會對照 npm registry metadata 檢查已安裝的 package version。若已安裝 version 與記錄的 artifact identity 已符合解析出的 target，update 會略過，不下載、不重新安裝，也不重寫 `openclaw.json`。

    當存在已儲存的 integrity hash 且擷取到的 artifact hash 發生變更時，OpenClaw 會將其視為 npm artifact drift。互動式 `openclaw plugins update` command 會列印 expected 與 actual hashes，並在繼續前要求確認。非互動式 update helpers 會 fail closed，除非 caller 提供明確的 continuation policy。

  </Accordion>
  <Accordion title="update 上的 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可在 `plugins update` 上使用，作為 plugin updates 期間 built-in dangerous-code scan false positives 的 break-glass override。它仍不會繞過 plugin `before_install` policy blocks 或 scan-failure blocking，而且只適用於 plugin updates，不適用於 hook-pack updates。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不會 import plugin runtime，會顯示 identity、load status、source、manifest capabilities、policy flags、diagnostics、install metadata、bundle capabilities，以及任何偵測到的 MCP 或 LSP server support。加入 `--runtime` 可載入 plugin module，並包含已註冊的 hooks、tools、commands、services、gateway methods 與 HTTP routes。Runtime inspection 會直接回報缺少的 plugin dependencies；installs 與 repairs 仍在 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 中處理。

Plugin 擁有的 CLI commands 會安裝為 root `openclaw` command groups。當 `inspect --runtime` 在 `cliCommands` 下顯示 command 後，請以 `openclaw <command> ...` 執行；例如，註冊 `demo-git` 的 plugin 可用 `openclaw demo-git ping` 驗證。

每個 plugin 會依其實際在 runtime 註冊的內容分類：

- **plain-capability** — 一種 capability type（例如僅 provider 的 plugin）
- **hybrid-capability** — 多種 capability types（例如 text + speech + images）
- **hook-only** — 只有 hooks，沒有 capabilities 或 surfaces
- **non-capability** — 有 tools/commands/services，但沒有 capabilities

請參閱 [Plugin shapes](/zh-TW/plugins/architecture#plugin-shapes)，了解 capability model 的更多資訊。

<Note>
`--json` flag 會輸出適合 scripting 與 auditing 的機器可讀 report。`inspect --all` 會呈現 fleet-wide table，包含 shape、capability kinds、compatibility notices、bundle capabilities，以及 hook summary columns。`info` 是 `inspect` 的 alias。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報 plugin load errors、manifest/discovery diagnostics，以及 compatibility notices。當一切正常時，它會列印 `No plugin issues detected.`

如果已設定的 plugin 存在於磁碟上，但被 loader 的 path-safety checks 阻擋，config validation 會保留 plugin entry，並將它回報為 `present but blocked`。請修復前面的 blocked-plugin diagnostic，例如 path ownership 或 world-writable permissions，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` config。

對於 module-shape failures，例如缺少 `register`/`activate` exports，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在 diagnostic output 中包含精簡的 export-shape summary。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 plugin registry 是 OpenClaw 對已安裝 plugin identity、enablement、source metadata 與 contribution ownership 的持久化 cold read model。一般 startup、provider owner lookup、channel setup classification，以及 plugin inventory 都能讀取它，而不需要 import plugin runtime modules。

使用 `plugins registry` 檢查持久化註冊表是否存在、是否為目前版本，或是否已過期。使用 `--refresh` 從持久化 Plugin 索引、設定政策，以及 manifest/package 中繼資料重新建置它。這是修復路徑，不是執行階段啟用路徑。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的緊急相容性開關，用於處理註冊表讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；env 後備機制僅供 migration 推出期間的緊急啟動復原使用。
</Warning>

### 市集

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市集列表接受本機市集路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會列印已解析的來源標籤，以及已剖析的市集 manifest 和 Plugin 項目。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [社群 Plugin](/zh-TW/plugins/community)
