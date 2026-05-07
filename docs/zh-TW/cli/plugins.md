---
read_when:
    - 您想安裝或管理 Gateway Plugin 或相容套件
    - 您想要偵錯 Plugin 載入失敗
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 參考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-05-07T13:14:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway plugins、hook packs，以及相容 bundles。

<CardGroup cols={2}>
  <Card title="Plugin 系統" href="/zh-TW/tools/plugin">
    安裝、啟用和疑難排解 plugins 的終端使用者指南。
  </Card>
  <Card title="管理 plugins" href="/zh-TW/plugins/manage-plugins">
    安裝、列出、更新、解除安裝和發布的快速範例。
  </Card>
  <Card title="Plugin bundles" href="/zh-TW/plugins/bundles">
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

若要調查緩慢的安裝、檢查、解除安裝或 registry-refresh，請以 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行該命令。Trace 會將階段計時寫入 stderr，並讓 JSON 輸出保持可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式 (`OPENCLAW_NIX_MODE=1`) 中，plugin 生命週期變更操作會停用。請改用此安裝的 Nix 來源，而不是 `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable` 或 `plugins disable`；若使用 nix-openclaw，請使用 agent-first [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
隨附 plugins 會隨 OpenClaw 一起提供。有些預設啟用（例如隨附的模型 providers、隨附的語音 providers，以及隨附的瀏覽器 plugin）；其他則需要 `plugins enable`。

原生 OpenClaw plugins 必須隨附 `openclaw.plugin.json`，並包含行內 JSON Schema（`configSchema`，即使為空也一樣）。相容 bundles 則改用自己的 bundle manifests。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細的 list/info 輸出也會顯示 bundle subtype（`codex`、`claude` 或 `cursor`）以及偵測到的 bundle capabilities。
</Note>

### 安裝

```bash
openclaw plugins search "calendar"                   # 搜尋 ClawHub plugins
openclaw plugins install <package>                      # 預設使用 npm
openclaw plugins install clawhub:<package>              # 僅 ClawHub
openclaw plugins install npm:<package>                  # 僅 npm
openclaw plugins install npm-pack:<path.tgz>            # 透過 npm install 語意使用本機 npm pack
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # 覆寫既有安裝
openclaw plugins install <package> --pin                # pin 版本
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 本機路徑
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（明確指定）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
在啟動切換期間，裸套件名稱預設會從 npm 安裝。ClawHub 請使用 `clawhub:<package>`。請把 plugin 安裝視為執行程式碼。建議使用 pinned 版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 plugin 套件，並列印可直接安裝的套件名稱。它會搜尋 code-plugin 和 bundle-plugin 套件，而不是 skills。ClawHub skills 請使用 `openclaw skills search`。

<Note>
ClawHub 是大多數 plugins 的主要發行與探索介面。Npm 仍是受支援的備援和直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` plugin 套件已再次發布到 npm；請參閱 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 上的目前清單，或參閱 [plugin inventory](/zh-TW/plugins/plugin-inventory)。穩定版安裝使用 `latest`。Beta-channel 安裝和更新會優先使用 npm `beta` dist-tag（若該 tag 可用），然後再退回 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="設定 includes 與無效設定修復">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該 include 檔案，並保持 `openclaw.json` 不變。Root includes、include arrays，以及帶有 sibling overrides 的 includes 會 fail closed，而不是展平。請參閱[設定 includes](/zh-TW/gateway/configuration) 了解支援的形狀。

    如果安裝期間設定無效，`plugins install` 通常會 fail closed，並要求你先執行 `openclaw doctor --fix`。在 Gateway 啟動和 hot reload 期間，無效 plugin 設定會像其他無效設定一樣 fail closed；`openclaw doctor --fix` 可以隔離無效的 plugin 項目。唯一記載於文件的安裝期間例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的 plugins 所提供的狹窄隨附 plugin 復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝 vs 更新">
    `--force` 會重用現有安裝目標，並就地覆寫已安裝的 plugin 或 hook pack。當你刻意從新的本機路徑、封存檔、ClawHub 套件或 npm artifact 重新安裝相同 id 時使用它。對於已追蹤 npm plugin 的例行升級，請優先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 plugin id 執行 `plugins install`，OpenClaw 會停止並引導你使用 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時，使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 僅適用於 npm 安裝。不支援搭配 `git:` 安裝；若你想要 pinned 來源，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它不支援搭配 `--marketplace`，因為 marketplace 安裝會保存 marketplace 來源 metadata，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是針對內建危險程式碼 scanner 誤判的 break-glass 選項。它允許在內建 scanner 回報 `critical` findings 時繼續安裝，但它**不會**繞過 plugin `before_install` hook policy blocks，也**不會**繞過掃描失敗。

    這個 CLI flag 適用於 plugin install/update 流程。Gateway 支援的 skill dependency installs 使用對應的 `dangerouslyForceUnsafeInstall` request override，而 `openclaw skills install` 仍是另一個獨立的 ClawHub skill 下載/安裝流程。

    如果你發布在 ClawHub 上的 plugin 被 registry scan 阻擋，請使用 [ClawHub](/zh-TW/tools/clawhub) 中的發布者步驟。

  </Accordion>
  <Accordion title="Hook packs 與 npm specs">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 的 hook packs 的介面。請使用 `openclaw hooks` 取得篩選後的 hook 可見性和逐 hook 啟用，而不是用於套件安裝。

    Npm specs **僅限 registry**（套件名稱加上選用的**精確版本**或 **dist-tag**）。Git/URL/file specs 和 semver ranges 會被拒絕。為了安全，即使你的 shell 有全域 npm 安裝設定，dependency installs 也會以 project-local 並搭配 `--ignore-scripts` 執行。受管理的 plugin npm roots 會繼承 OpenClaw package-level npm `overrides`，因此 host security pins 也會套用到 hoisted plugin dependencies。

    當你想明確使用 npm resolution 時，請使用 `npm:<package>`。在啟動切換期間，裸套件 specs 也會直接從 npm 安裝。

    裸 specs 和 `@latest` 會留在 stable track。OpenClaw 日期戳記修正版，例如 `2026.5.3-1`，在此檢查中屬於 stable releases。如果 npm 將其中任一解析為 prerelease，OpenClaw 會停止並要求你以 prerelease tag（例如 `@beta`/`@rc`）或精確 prerelease version（例如 `@1.2.3-beta.4`）明確選擇加入。

    如果裸安裝 spec 符合官方 plugin id（例如 `diffs`），OpenClaw 會直接安裝 catalog entry。若要安裝同名 npm 套件，請使用明確的 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repositories">
    使用 `git:<repo>` 直接從 git repository 安裝。支援的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整的 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URLs。加入 `@<ref>` 或 `#<ref>` 可在安裝前 checkout branch、tag 或 commit。

    Git 安裝會 clone 到暫存目錄，在有指定 ref 時 checkout 該 ref，然後使用一般 plugin 目錄 installer。這表示 manifest validation、dangerous-code scanning、package-manager install 工作，以及 install records 都會像 npm 安裝一樣運作。記錄的 git 安裝會包含來源 URL/ref 和解析後的 commit，因此 `openclaw plugins update` 之後可以重新解析該來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證 runtime registrations，例如 gateway methods 和 CLI commands。如果 plugin 使用 `api.registerCli` 註冊了 CLI root，請直接透過 OpenClaw root CLI 執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw plugin 封存檔必須在解壓後的 plugin root 包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的封存檔會在 OpenClaw 寫入 install records 前被拒絕。

    當檔案是 npm-pack tarball，且你想測試 registry installs 所使用的相同受管理 npm-root 安裝路徑時，請使用 `npm-pack:<path.tgz>`，包含 `package-lock.json` verification、hoisted dependency scanning，以及 npm install records。一般封存檔路徑仍會作為 local archives 安裝在 plugin extensions root 下。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在啟動切換期間，裸 npm-safe plugin specs 預設會從 npm 安裝：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 明確指定僅使用 npm resolution：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查宣告的 Plugin API / 最低 Gateway 相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載版本化 npm-pack `.tgz`、驗證 ClawHub 摘要標頭與成品摘要，然後透過一般封存檔路徑安裝。沒有 ClawPack 中繼資料的較舊 ClawHub 版本，仍會透過舊版套件封存檔驗證路徑安裝。已記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm integrity、npm shasum、tarball 名稱，以及 ClawPack 摘要事實，以供後續更新使用。
未指定版本的 ClawHub 安裝會保留未指定版本的記錄規格，讓 `openclaw plugins update` 可以跟隨較新的 ClawHub 發布；明確的版本或標籤選擇器，例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`，則會維持釘選至該選擇器。

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
  <Tab title="Marketplace 來源">
    - 來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名稱
    - 本機 marketplace 根目錄或 `marketplace.json` 路徑
    - GitHub repo 簡寫，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="遠端 marketplace 規則">
    對於從 GitHub 或 git 載入的遠端 marketplace，Plugin 項目必須留在複製下來的 marketplace repo 內。OpenClaw 會接受來自該 repo 的相對路徑來源，並拒絕遠端 manifest 中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑 Plugin 來源。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 相容 bundle（`.codex-plugin/plugin.json`）
- Claude 相容 bundle（`.claude-plugin/plugin.json` 或預設 Claude 元件版面）
- Cursor 相容 bundle（`.cursor-plugin/plugin.json`）

<Note>
相容 bundle 會安裝到一般 Plugin 根目錄，並參與相同的 list/info/enable/disable 流程。目前支援 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的 bundle 功能會顯示在 diagnostics/info 中，但尚未接入執行階段執行。
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
  從表格檢視切換為每個 Plugin 的詳細列，包含來源/出處/版本/啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀取的清單，加上登錄診斷與套件相依項安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久化的本機 Plugin 登錄；當登錄遺失或無效時，會使用僅由 manifest 衍生的後備資料。這適合用來檢查 Plugin 是否已安裝、已啟用，且對冷啟動規劃可見，但它不是對已執行 Gateway 程序的即時執行階段探測。變更 Plugin 程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 後，請重新啟動服務該 channel 的 Gateway，再期待新的 `register(api)` 程式碼或 hook 執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是 wrapper 程序。

`plugins list --json` 會包含每個 Plugin 來自 `package.json`
`dependencies` 與 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於該 Plugin 一般 Node `node_modules` 查找路徑中；它
不會匯入 Plugin 執行階段程式碼、執行套件管理器，或修復缺少的
相依項。
</Note>

`plugins search` 是遠端 ClawHub 目錄查詢。它不會檢查本機
狀態、變更 config、安裝套件，或載入 Plugin 執行階段程式碼。搜尋
結果包含 ClawHub 套件名稱、family、channel、version、summary，以及
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

若要在已封裝的 Docker 映像內進行內建 Plugin 工作，請將 Plugin
來源目錄 bind-mount 到相符的已封裝來源路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會在 `/app/dist/extensions/synology-chat`
之前發現該掛載的來源覆蓋層；單純複製的來源
目錄仍不會生效，因此一般封裝安裝仍會使用已編譯的 dist。

若要偵錯執行階段 hook：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自模組載入檢查流程的已註冊 hook 與診斷。執行階段檢查絕不會安裝相依項；請使用 `openclaw doctor --fix` 清理舊版相依項狀態，或復原 config 中引用但缺少、可下載的 Plugin。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、服務/程序提示、config 路徑，以及 RPC 健康狀態。
- 非內建對話 hook（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免複製本機目錄（會加入 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援搭配 `--link`，因為 linked install 會重用來源路徑，而不是覆寫受管理的安裝目標。

在 npm 安裝上使用 `--pin`，可將解析後的精確規格（`name@version`）儲存在受管理的 Plugin 索引中，同時保留預設的未釘選行為。
</Note>

### Plugin 索引

Plugin 安裝中繼資料是由機器管理的狀態，不是使用者 config。安裝與更新會把它寫入作用中 OpenClaw state 目錄下的 `plugins/installs.json`。其頂層 `installRecords` map 是安裝中繼資料的持久來源，包含損壞或遺失 Plugin manifest 的記錄。`plugins` 陣列是由 manifest 衍生的冷登錄快取。此檔案包含請勿編輯警告，並由 `openclaw plugins update`、uninstall、diagnostics，以及冷 Plugin 登錄使用。

當 OpenClaw 在 config 中看到已出貨的舊版 `plugins.installs` 記錄時，執行階段讀取會把它們視為相容性輸入，而不會重寫 `openclaw.json`。明確的 Plugin 寫入與 `openclaw doctor --fix` 會在允許寫入 config 時，將這些記錄移入 Plugin 索引並移除 config key；如果任一寫入失敗，會保留 config 記錄，避免安裝中繼資料遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會在適用時從 `plugins.entries`、持久化 Plugin 索引、Plugin allow/deny list 項目，以及 linked `plugins.load.paths` 項目中移除 Plugin 記錄。除非設定 `--keep-files`，否則 uninstall 也會在追蹤的受管理安裝目錄位於 OpenClaw 的 Plugin extensions 根目錄內時移除該目錄。對於 active memory Plugin，memory slot 會重設為 `memory-core`。

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

更新會套用到受管理 Plugin 索引中追蹤的 Plugin 安裝，以及 `hooks.internal.installs` 中追蹤的 hook-pack 安裝。

<AccordionGroup>
  <Accordion title="解析 Plugin id 與 npm 規格">
    當你傳入 Plugin id 時，OpenClaw 會重用該 Plugin 已記錄的安裝規格。這表示先前儲存的 dist-tag，例如 `@beta`，以及精確釘選版本，會在後續 `update <id>` 執行時繼續使用。

    對於 npm 安裝，你也可以傳入帶有 dist-tag 或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回已追蹤的 Plugin 記錄、更新該已安裝的 Plugin，並記錄新的 npm 規格以供未來依 id 更新。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回已追蹤的 Plugin 記錄。當 Plugin 已釘選至精確版本，而你想把它移回登錄的預設發布線時，請使用此方式。

  </Accordion>
  <Accordion title="Beta channel 更新">
    `openclaw plugins update` 會重用已追蹤的 Plugin 規格，除非你傳入新規格。`openclaw update` 另外知道作用中的 OpenClaw 更新 channel：在 beta channel 上，預設線 npm 與 ClawHub Plugin 記錄會先嘗試 `@beta`，如果沒有 Plugin beta 發布，則退回已記錄的 default/latest 規格。精確版本與明確標籤會維持釘選至該選擇器。

  </Accordion>
  <Accordion title="版本檢查與 integrity 漂移">
    在即時 npm 更新前，OpenClaw 會根據 npm registry 中繼資料檢查已安裝套件版本。如果已安裝版本與已記錄成品身分已符合解析後的目標，則會略過更新，不下載、不重新安裝，也不重寫 `openclaw.json`。

    當已儲存的 integrity hash 存在且擷取到的成品 hash 改變時，OpenClaw 會將其視為 npm 成品漂移。互動式 `openclaw plugins update` 指令會列印預期與實際 hash，並在繼續前要求確認。非互動式更新 helper 預設會封閉失敗，除非呼叫端提供明確的繼續政策。

  </Accordion>
  <Accordion title="更新時使用 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可在 `plugins update` 上使用，作為 Plugin 更新期間內建危險程式碼掃描誤報的緊急覆寫。它仍不會繞過 Plugin `before_install` 政策阻擋或掃描失敗阻擋，且只適用於 Plugin 更新，不適用於 hook-pack 更新。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不會匯入 Plugin 執行階段，並會顯示身分、載入狀態、來源、manifest 功能、政策旗標、診斷、安裝中繼資料、bundle 功能，以及任何偵測到的 MCP 或 LSP server 支援。加入 `--runtime` 可載入 Plugin 模組，並包含已註冊的 hook、tool、command、service、gateway method，以及 HTTP route。執行階段檢查會直接回報缺少的 Plugin 相依項；安裝與修復仍留在 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix`。

Plugin 擁有的 CLI command 通常會安裝為根層 `openclaw` command group，但 Plugin 也可以在核心 parent 底下註冊巢狀 command，例如 `openclaw nodes`。當 `inspect --runtime` 在 `cliCommands` 下顯示 command 後，請在列出的路徑執行它；例如註冊 `demo-git` 的 Plugin 可透過 `openclaw demo-git ping` 驗證。

每個 Plugin 都會依其在執行階段實際註冊的內容分類：

- **單一能力** — 一種能力類型（例如僅限提供者的 Plugin）
- **混合能力** — 多種能力類型（例如文字 + 語音 + 圖片）
- **僅限鉤子** — 只有鉤子，沒有能力或介面
- **非能力** — 工具/命令/服務，但沒有能力

如需能力模型的更多資訊，請參閱 [Plugin 形態](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合用於指令碼與稽核的機器可讀報告。`inspect --all` 會呈現涵蓋整個機群的表格，包含形態、能力種類、相容性通知、套件能力，以及鉤子摘要欄位。`info` 是 `inspect` 的別名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會報告 Plugin 載入錯誤、清單/探索診斷，以及相容性通知。當一切正常時，會列印 `No plugin issues detected.`

如果已設定的 Plugin 存在於磁碟上，但被載入器的路徑安全檢查封鎖，設定驗證會保留 Plugin 項目，並將其回報為 `present but blocked`。請修正前面的已封鎖 Plugin 診斷，例如路徑擁有權或全域可寫入權限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 設定。

對於模組形態失敗，例如缺少 `register`/`activate` 匯出，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出形態摘要。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 Plugin registry 是 OpenClaw 針對已安裝 Plugin 身分、啟用狀態、來源中繼資料與貢獻擁有權所持久化的冷讀取模型。一般啟動、提供者擁有者查詢、頻道設定分類，以及 Plugin 清查都可以讀取它，而不需要匯入 Plugin runtime 模組。

使用 `plugins registry` 來檢查持久化 registry 是否存在、為最新或已過期。使用 `--refresh` 可從持久化 Plugin 索引、設定政策，以及清單/套件中繼資料重建它。這是修復路徑，不是 runtime 啟用路徑。

`openclaw doctor --fix` 也會修復與 registry 相鄰的受管理 npm 漂移：如果受管理 Plugin npm 根目錄下有孤立或已復原的 `@openclaw/*` 套件遮蔽了內建 Plugin，doctor 會移除該過期套件並重建 registry，讓啟動能依照內建清單進行驗證。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的 registry 讀取失敗緊急相容性開關。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；此環境變數後援僅用於遷移推出期間的緊急啟動復原。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace 清單接受本機 Marketplace 路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會列印解析出的來源標籤，以及已剖析的 Marketplace 清單與 Plugin 項目。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [社群 Plugin](/zh-TW/plugins/community)
