---
read_when:
    - 你想要安裝或管理 Gateway Plugin 或相容套件包
    - 你想偵錯 Plugin 載入失敗
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 參考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-05-02T02:46:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092365bc7c841a6211ae86f15e9103994366d83650fed861f305112fb2ad41b7
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway Plugin、hook 套件與相容 bundle。

<CardGroup cols={2}>
  <Card title="Plugin system" href="/zh-TW/tools/plugin">
    安裝、啟用與疑難排解 Plugin 的終端使用者指南。
  </Card>
  <Card title="Plugin bundles" href="/zh-TW/plugins/bundles">
    Bundle 相容性模型。
  </Card>
  <Card title="Plugin manifest" href="/zh-TW/plugins/manifest">
    Manifest 欄位與設定結構描述。
  </Card>
  <Card title="Security" href="/zh-TW/gateway/security">
    Plugin 安裝的安全強化。
  </Card>
</CardGroup>

## 指令

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
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

若要調查緩慢的安裝、檢查、解除安裝或登錄重新整理，請搭配 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行該指令。追蹤會將階段計時寫入 stderr，並讓 JSON 輸出保持可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
Bundled plugins 會隨 OpenClaw 出貨。其中有些預設啟用（例如 bundled model providers、bundled speech providers 與 bundled browser plugin）；其他則需要 `plugins enable`。

原生 OpenClaw Plugin 必須隨附 `openclaw.plugin.json`，其中包含內嵌 JSON Schema（`configSchema`，即使為空也要有）。相容 bundle 則使用自己的 bundle manifest。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細清單/info 輸出也會顯示 bundle 子類型（`codex`、`claude` 或 `cursor`）以及偵測到的 bundle 能力。
</Note>

### 安裝

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
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
裸套件名稱會先檢查 ClawHub，然後才檢查 npm。請像執行程式碼一樣看待 Plugin 安裝。建議優先使用 pinned 版本。
</Warning>

<Note>
ClawHub 是多數 Plugin 的主要發佈與探索介面。Npm 仍是受支援的備援與直接安裝路徑。在遷移到 ClawHub 期間，OpenClaw 仍會在 npm 上出貨一些 OpenClaw 擁有的 `@openclaw/*` Plugin 套件；在 Plugin release trains 之間，這些套件版本可能會落後於 bundled source。如果 npm 將 OpenClaw 擁有的 Plugin 套件回報為已棄用，該已發佈版本就是舊的外部成品；請使用目前 OpenClaw 隨附的 Plugin 或本機 checkout，直到較新的 npm 套件發佈為止。
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config recovery">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該 included file，並保持 `openclaw.json` 不變。Root includes、include arrays，以及具有 sibling overrides 的 includes 會 fail closed，而不是被攤平。支援的形狀請參閱[設定 includes](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會 fail closed，並告知你先執行 `openclaw doctor --fix`。在 Gateway 啟動期間，單一 Plugin 的無效設定會隔離到該 Plugin，讓其他 channel 與 Plugin 能繼續執行；`openclaw doctor --fix` 可以隔離該無效 Plugin 項目。唯一記載的安裝時例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的 Plugin 的狹窄 bundled-plugin 復原路徑。

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` 會重用既有安裝目標，並原地覆寫已安裝的 Plugin 或 hook pack。當你有意從新的本機路徑、封存檔、ClawHub 套件或 npm 成品重新安裝相同 id 時使用它。對於已追蹤 npm Plugin 的例行升級，請優先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 Plugin id 執行 `plugins install`，OpenClaw 會停止並提示你使用 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想要從不同來源覆寫目前安裝時使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` 只適用於 npm 安裝。不支援搭配 `git:` 安裝；當你想要 pinned 來源時，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它也不支援搭配 `--marketplace`，因為 marketplace 安裝會持久保存 marketplace 來源中繼資料，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是針對內建 dangerous-code scanner 誤判的 break-glass 選項。即使內建 scanner 回報 `critical` findings，它也允許安裝繼續，但它**不會**繞過 Plugin `before_install` hook policy blocks，也**不會**繞過掃描失敗。

    此 CLI 旗標適用於 Plugin install/update flows。Gateway-backed skill dependency installs 使用相對應的 `dangerouslyForceUnsafeInstall` request override，而 `openclaw skills install` 仍是獨立的 ClawHub skill download/install flow。

    如果你發佈在 ClawHub 上的 Plugin 被 registry scan 封鎖，請使用 [ClawHub](/zh-TW/tools/clawhub) 中的發佈者步驟。

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` 也是在 `package.json` 中公開 `openclaw.hooks` 的 hook packs 的安裝介面。請使用 `openclaw hooks` 進行篩選後的 hook 可見性與個別 hook 啟用，而不是套件安裝。

    Npm specs **僅限登錄**（套件名稱 + 選用的**精確版本**或 **dist-tag**）。Git/URL/file specs 與 semver 範圍會被拒絕。為了安全，即使你的 shell 有全域 npm install 設定，dependency installs 也會以 project-local 搭配 `--ignore-scripts` 執行。

    當你想略過 ClawHub 查詢並直接從 npm 安裝時，請使用 `npm:<package>`。裸套件 spec 仍會優先使用 ClawHub，只有在 ClawHub 沒有該套件或版本時才會退回 npm。

    裸 spec 與 `@latest` 會留在 stable track。如果 npm 將其中任一解析為 prerelease，OpenClaw 會停止並要求你透過 prerelease tag（例如 `@beta`/`@rc`）或精確 prerelease 版本（例如 `@1.2.3-beta.4`）明確選擇加入。

    如果裸安裝 spec 符合官方 Plugin id（例如 `diffs`），OpenClaw 會直接安裝 catalog entry。若要安裝同名的 npm 套件，請使用明確 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repositories">
    使用 `git:<repo>` 可直接從 git repository 安裝。支援的形式包含 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URLs。加入 `@<ref>` 或 `#<ref>` 可在安裝前 checkout branch、tag 或 commit。

    Git 安裝會 clone 到 temporary directory，在有指定 ref 時 checkout 該 ref，然後使用一般 Plugin directory installer。這表示 manifest validation、dangerous-code scanning、package-manager install work 與 install records 的行為都像 npm 安裝。記錄的 git 安裝會包含 source URL/ref 加上 resolved commit，讓 `openclaw plugins update` 之後可以重新解析來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證 runtime registrations，例如 gateway methods 與 CLI commands。如果 Plugin 使用 `api.registerCli` 註冊了 CLI root，請直接透過 OpenClaw root CLI 執行該指令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="Archives">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw Plugin 封存檔必須在解壓後的 Plugin root 中包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的封存檔會在 OpenClaw 寫入 install records 前被拒絕。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 現在也會針對裸 npm-safe Plugin specs 優先使用 ClawHub。只有在 ClawHub 沒有該套件或版本時，才會退回 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可強制僅使用 npm 解析，例如 ClawHub 無法連線，或你知道套件只存在於 npm 上時：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查宣告的 Plugin API / minimum gateway compatibility。當選取的 ClawHub 版本發佈 ClawPack 成品時，OpenClaw 會下載 versioned ClawPack、驗證 ClawHub digest header 與 artifact digest，然後透過一般 archive path 安裝。沒有 ClawPack metadata 的舊版 ClawHub 版本仍會透過 legacy package archive verification path 安裝。記錄的安裝會保留其 ClawHub source metadata 與 ClawPack digest facts，以供之後更新使用。
未指定版本的 ClawHub 安裝會保留未指定版本的 recorded spec，讓 `openclaw plugins update` 可以跟隨較新的 ClawHub releases；明確版本或 tag selectors，例如 `clawhub:pkg@1.2.3` 與 `clawhub:pkg@beta`，仍會 pinned 到該 selector。

#### Marketplace 簡寫

當 marketplace 名稱存在於 Claude 的本機 registry cache `~/.claude/plugins/known_marketplaces.json` 時，請使用 `plugin@marketplace` 簡寫：

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
    - 來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude known-marketplace 名稱
    - 本機 marketplace root 或 `marketplace.json` path
    - GitHub repo shorthand，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    對於從 GitHub 或 git 載入的遠端 marketplaces，Plugin entries 必須留在 cloned marketplace repo 內。OpenClaw 接受來自該 repo 的 relative path sources，並拒絕 remote manifests 中的 HTTP(S)、absolute-path、git、GitHub 及其他 non-path Plugin sources。
  </Tab>
</Tabs>

對於本機路徑與封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 相容套件包（`.codex-plugin/plugin.json`）
- Claude 相容套件包（`.claude-plugin/plugin.json` 或預設 Claude 元件版面配置）
- Cursor 相容套件包（`.cursor-plugin/plugin.json`）

<Note>
相容套件包會安裝到一般 Plugin 根目錄，並參與相同的列出/資訊/啟用/停用流程。目前支援套件包 Skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的套件包能力會顯示在診斷/資訊中，但尚未接入執行階段執行。
</Note>

### 清單

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  只顯示已啟用的 Plugin。
</ParamField>
<ParamField path="--verbose" type="boolean">
  從表格檢視切換為每個 Plugin 的詳細行，包含來源/起源/版本/啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清查資料加上登錄診斷。
</ParamField>

<Note>
`plugins list` 會先讀取已持久化的本機 Plugin 登錄；當登錄遺失或無效時，則使用僅由 manifest 推導出的後備資料。它適合用來檢查 Plugin 是否已安裝、已啟用，且對冷啟動規劃可見，但它不是對已執行中 Gateway 程序的即時執行階段探測。變更 Plugin 程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 後，請先重新啟動服務該通道的 Gateway，再預期新的 `register(api)` 程式碼或 hook 會執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝程序。
</Note>

對於封裝 Docker 映像內的隨附 Plugin 作業，請將 Plugin
原始碼目錄 bind-mount 到相符的封裝原始碼路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會先探索該掛載的原始碼
覆蓋層，再探索 `/app/dist/extensions/synology-chat`；單純複製的原始碼
目錄仍不會作用，因此一般封裝安裝仍會使用已編譯的 dist。

對於執行階段 hook 除錯：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自模組載入檢查階段的已註冊 hook 與診斷。執行階段檢查絕不會安裝相依套件；請使用 `openclaw doctor --fix` 清理舊版相依狀態，或安裝遺失的已設定可下載 Plugin。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、服務/程序提示、設定路徑與 RPC 健康狀態。
- 非隨附的對話 hook（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 以避免複製本機目錄（會加入 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援與 `--link` 搭配使用，因為連結安裝會重用原始碼路徑，而不是覆蓋受管理的安裝目標。

在 npm 安裝上使用 `--pin`，可將已解析的精確規格（`name@version`）儲存在受管理的 Plugin 索引中，同時保留預設的未釘選行為。
</Note>

### Plugin 索引

Plugin 安裝中繼資料是由機器管理的狀態，不是使用者設定。安裝與更新會將它寫入作用中 OpenClaw 狀態目錄底下的 `plugins/installs.json`。其頂層 `installRecords` 對映是安裝中繼資料的持久來源，包含損壞或遺失 Plugin manifest 的記錄。`plugins` 陣列是由 manifest 推導出的冷登錄快取。該檔案包含請勿編輯警告，並由 `openclaw plugins update`、解除安裝、診斷與冷 Plugin 登錄使用。

當 OpenClaw 在設定中看到已出貨的舊版 `plugins.installs` 記錄時，會將它們移入 Plugin 索引並移除設定鍵；如果任一寫入失敗，設定記錄會保留，避免安裝中繼資料遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會在適用時從 `plugins.entries`、已持久化的 Plugin 索引、Plugin 允許/拒絕清單項目，以及已連結的 `plugins.load.paths` 項目中移除 Plugin 記錄。除非設定 `--keep-files`，解除安裝也會移除被追蹤的受管理安裝目錄，前提是它位於 OpenClaw 的 Plugin extensions 根目錄內。對於 Active Memory Plugin，記憶體槽會重設為 `memory-core`。

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

更新會套用到受管理 Plugin 索引中被追蹤的 Plugin 安裝，以及 `hooks.internal.installs` 中被追蹤的 hook-pack 安裝。

<AccordionGroup>
  <Accordion title="解析 Plugin id 與 npm 規格">
    當你傳入 Plugin id 時，OpenClaw 會重用該 Plugin 的已記錄安裝規格。這表示先前儲存的 dist-tag（例如 `@beta`）與精確釘選版本，會在之後的 `update <id>` 執行中繼續使用。

    對於 npm 安裝，你也可以傳入帶有 dist-tag 或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回被追蹤的 Plugin 記錄、更新該已安裝 Plugin，並記錄新的 npm 規格以供未來基於 id 的更新使用。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回被追蹤的 Plugin 記錄。當某個 Plugin 已被釘選到精確版本，而你想將它移回登錄的預設發行線時，請使用這種方式。

  </Accordion>
  <Accordion title="版本檢查與完整性漂移">
    在即時 npm 更新之前，OpenClaw 會根據 npm 登錄中繼資料檢查已安裝套件版本。如果已安裝版本與已記錄成品身分已符合解析後目標，更新會跳過，不會下載、重新安裝或重寫 `openclaw.json`。

    當已儲存的完整性雜湊存在且擷取到的成品雜湊發生變化時，OpenClaw 會將其視為 npm 成品漂移。互動式 `openclaw plugins update` 命令會列印預期與實際雜湊，並在繼續前要求確認。非互動式更新輔助程式會預設關閉失敗，除非呼叫端提供明確的繼續政策。

  </Accordion>
  <Accordion title="更新時的 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可在 `plugins update` 上使用，作為 Plugin 更新期間內建危險程式碼掃描誤判的破窗覆寫。它仍不會繞過 Plugin `before_install` 政策封鎖或掃描失敗封鎖，且只適用於 Plugin 更新，不適用於 hook-pack 更新。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不會匯入 Plugin 執行階段，但會顯示身分、載入狀態、來源、manifest 能力、政策旗標、診斷、安裝中繼資料、套件包能力，以及任何偵測到的 MCP 或 LSP 伺服器支援。加入 `--runtime` 可載入 Plugin 模組，並包含已註冊的 hook、工具、命令、服務、Gateway 方法與 HTTP 路由。執行階段檢查會直接回報遺失的 Plugin 相依套件；安裝與修復則留在 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 中處理。

Plugin 擁有的 CLI 命令會安裝為根層級 `openclaw` 命令群組。當 `inspect --runtime` 在 `cliCommands` 下顯示某個命令後，請以 `openclaw <command> ...` 執行它；例如註冊 `demo-git` 的 Plugin 可用 `openclaw demo-git ping` 驗證。

每個 Plugin 都會依據它在執行階段實際註冊的內容分類：

- **plain-capability** — 一種能力類型（例如僅提供 provider 的 Plugin）
- **hybrid-capability** — 多種能力類型（例如文字 + 語音 + 圖片）
- **hook-only** — 只有 hook，沒有能力或表面
- **non-capability** — 有工具/命令/服務，但沒有能力

如需能力模型的更多資訊，請參閱 [Plugin 形態](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合指令碼與稽核使用的機器可讀報告。`inspect --all` 會呈現全體表格，包含形態、能力種類、相容性通知、套件包能力與 hook 摘要欄位。`info` 是 `inspect` 的別名。
</Note>

### 診斷

```bash
openclaw plugins doctor
```

`doctor` 會回報 Plugin 載入錯誤、manifest/探索診斷與相容性通知。當一切正常時，它會列印 `No plugin issues detected.`

對於模組形態失敗，例如遺失 `register`/`activate` 匯出，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出形態摘要。

### 登錄

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 Plugin 登錄是 OpenClaw 對已安裝 Plugin 身分、啟用狀態、來源中繼資料與貢獻擁有權所持久化的冷讀取模型。一般啟動、provider 擁有者查詢、通道設定分類與 Plugin 清查，都可以在不匯入 Plugin 執行階段模組的情況下讀取它。

使用 `plugins registry` 檢查已持久化登錄是否存在、目前有效或已過期。使用 `--refresh` 可從已持久化的 Plugin 索引、設定政策，以及 manifest/package 中繼資料重建它。這是修復路徑，不是執行階段啟用路徑。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的破窗相容性開關，用於登錄讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；env 後備僅用於遷移推出期間的緊急啟動復原。
</Warning>

### 市集

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市集清單接受本機市集路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會列印已解析的來源標籤，加上已剖析的市集 manifest 與 Plugin 項目。

## 相關內容

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [社群 Plugin](/zh-TW/plugins/community)
