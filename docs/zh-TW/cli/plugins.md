---
read_when:
    - 你想安裝或管理 Gateway Plugin 或相容套件包
    - 你想要偵錯 Plugin 載入失敗
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 參考（list、install、marketplace、uninstall、enable/disable、deps、doctor）'
title: Plugins
x-i18n:
    generated_at: "2026-04-30T02:55:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c1ba79bccbbb74e3403188afc2dffc06e4215d433e2b23ed998b1fb09419601b
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway Plugin、hook pack 與相容的 bundle。

<CardGroup cols={2}>
  <Card title="Plugin 系統" href="/zh-TW/tools/plugin">
    安裝、啟用和疑難排解 Plugin 的使用者指南。
  </Card>
  <Card title="Plugin bundle" href="/zh-TW/plugins/bundles">
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
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

若要調查緩慢的安裝、檢查、解除安裝或 registry 重新整理，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行命令。Trace 會將階段計時寫入 stderr，並保持 JSON 輸出可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
Bundled Plugin 會隨 OpenClaw 出貨。有些預設啟用（例如 bundled model provider、bundled speech provider，以及 bundled browser Plugin）；其他則需要 `plugins enable`。

原生 OpenClaw Plugin 必須隨附 `openclaw.plugin.json`，並包含內嵌 JSON Schema（`configSchema`，即使為空也需要）。相容 bundle 則改用自己的 bundle manifest。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。Verbose list/info 輸出也會顯示 bundle 子類型（`codex`、`claude` 或 `cursor`）以及偵測到的 bundle 能力。
</Note>

### 安裝

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
裸 package 名稱會先對 ClawHub 檢查，然後才是 npm。請像執行程式碼一樣看待 Plugin 安裝。建議使用固定版本。
</Warning>

<Note>
ClawHub 是多數 Plugin 的主要發佈與探索介面。Npm 仍是受支援的備援與直接安裝路徑。在遷移到 ClawHub 期間，OpenClaw 仍會在 npm 上發佈一些 OpenClaw 擁有的 `@openclaw/*` Plugin package；這些 package 版本可能會落後於 Plugin release train 之間的 bundled source。如果 npm 將 OpenClaw 擁有的 Plugin package 回報為 deprecated，該已發佈版本就是舊的外部 artifact；請使用目前 OpenClaw 隨附的 Plugin，或使用 local checkout，直到更新的 npm package 發佈為止。
</Note>

<AccordionGroup>
  <Accordion title="設定 include 與無效設定復原">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該 included 檔案，並保持 `openclaw.json` 不變。Root include、include 陣列，以及帶有 sibling override 的 include 會失敗關閉，而不是攤平成設定。支援的形狀請參閱[設定 include](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會失敗關閉，並提示你先執行 `openclaw doctor --fix`。Gateway 啟動期間，單一 Plugin 的無效設定會隔離到該 Plugin，讓其他 channel 和 Plugin 可以繼續執行；`openclaw doctor --fix` 可以隔離無效的 Plugin 項目。唯一有文件記載的安裝時例外，是一條狹窄的 bundled Plugin 復原路徑，僅適用於明確 opt in `openclaw.install.allowInvalidConfigRecovery` 的 Plugin。

  </Accordion>
  <Accordion title="--force 與重新安裝 vs 更新">
    `--force` 會重用現有安裝目標，並就地覆寫已安裝的 Plugin 或 hook pack。當你有意從新的本機路徑、archive、ClawHub package 或 npm artifact 重新安裝相同 id 時使用它。對於已追蹤 npm Plugin 的例行升級，建議使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 Plugin id 執行 `plugins install`，OpenClaw 會停止並指向 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時，指向 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 只適用於 npm 安裝。它不支援與 `--marketplace` 搭配使用，因為 marketplace 安裝會持久化 marketplace source metadata，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是針對內建危險程式碼掃描器誤判的 break-glass 選項。它允許在內建掃描器回報 `critical` finding 時繼續安裝，但它**不會**繞過 Plugin `before_install` hook policy block，也**不會**繞過掃描失敗。

    這個 CLI flag 適用於 Plugin install/update flow。Gateway 支援的 skill dependency install 會使用對應的 `dangerouslyForceUnsafeInstall` request override，而 `openclaw skills install` 仍是獨立的 ClawHub skill download/install flow。

    如果你發佈在 ClawHub 上的 Plugin 被 registry scan 封鎖，請使用 [ClawHub](/zh-TW/tools/clawhub) 中的 publisher steps。

  </Accordion>
  <Accordion title="Hook pack 與 npm spec">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 的 hook pack 的介面。請使用 `openclaw hooks` 進行篩選後的 hook 可見性與個別 hook 啟用，而不是 package 安裝。

    Npm spec 是**僅限 registry**（package 名稱 + 選用的**精確版本**或 **dist-tag**）。Git/URL/file spec 與 semver range 會被拒絕。即使你的 shell 有全域 npm install 設定，dependency install 也會以 project-local 方式搭配 `--ignore-scripts` 執行，以確保安全。

    當你想略過 ClawHub lookup 並直接從 npm 安裝時，請使用 `npm:<package>`。裸 package spec 仍會優先使用 ClawHub，只有在 ClawHub 沒有該 package 或版本時才會 fallback 到 npm。

    裸 spec 與 `@latest` 會留在 stable track。如果 npm 將其中任一解析為 prerelease，OpenClaw 會停止並要求你使用 prerelease tag（例如 `@beta`/`@rc`）或精確 prerelease 版本（例如 `@1.2.3-beta.4`）明確 opt in。

    如果裸 install spec 符合 bundled Plugin id（例如 `diffs`），OpenClaw 會直接安裝 bundled Plugin。若要安裝同名的 npm package，請使用明確 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Archive">
    支援的 archive：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw Plugin archive 必須在解壓後的 Plugin root 包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的 archive 會在 OpenClaw 寫入安裝記錄前被拒絕。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝使用明確的 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 現在也會對裸 npm-safe Plugin spec 優先使用 ClawHub。只有在 ClawHub 沒有該 package 或版本時，它才會 fallback 到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 強制僅以 npm 解析，例如當 ClawHub 無法連線，或你知道該 package 只存在於 npm 時：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會從 ClawHub 下載 package archive，檢查宣告的 Plugin API / 最低 gateway 相容性，然後透過一般 archive 路徑安裝。記錄下來的安裝會保留其 ClawHub source metadata，以便日後更新。
未指定版本的 ClawHub 安裝會保留未指定版本的 recorded spec，讓 `openclaw plugins update` 可以跟隨較新的 ClawHub release；明確版本或 tag selector（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）會保持固定在該 selector。

#### Marketplace 簡寫

當 marketplace 名稱存在於 Claude 位於 `~/.claude/plugins/known_marketplaces.json` 的本機 registry cache 時，請使用 `plugin@marketplace` 簡寫：

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
  <Tab title="Marketplace source">
    - 來自 `~/.claude/plugins/known_marketplaces.json` 的 Claude known-marketplace 名稱
    - 本機 marketplace root 或 `marketplace.json` 路徑
    - GitHub repo 簡寫，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="遠端 marketplace 規則">
    對於從 GitHub 或 git 載入的遠端 marketplace，Plugin 項目必須保持在 cloned marketplace repo 內。OpenClaw 接受來自該 repo 的相對路徑 source，並拒絕來自 remote manifest 的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑 Plugin source。
  </Tab>
</Tabs>

對於本機路徑和 archive，OpenClaw 會自動偵測：

- 原生 OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 相容 bundle（`.codex-plugin/plugin.json`）
- Claude 相容 bundle（`.claude-plugin/plugin.json` 或預設 Claude component layout）
- Cursor 相容 bundle（`.cursor-plugin/plugin.json`）

<Note>
相容 bundle 會安裝到一般 Plugin root，並參與相同的 list/info/enable/disable flow。目前支援 bundle skill、Claude command-skill、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skill，以及相容 Codex hook 目錄；其他偵測到的 bundle 能力會顯示在 diagnostics/info 中，但尚未接入 runtime execution。
</Note>

### 列出

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  僅顯示已啟用的 Plugin。
</ParamField>
<ParamField path="--verbose" type="boolean">
  從表格檢視切換為每個 Plugin 的詳細行，包含 source/origin/version/activation metadata。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀 inventory 與 registry diagnostics。
</ParamField>

<Note>
`plugins list` 會先讀取已持久化的本機 Plugin 登錄檔；如果登錄檔遺失或無效，才會使用僅由資訊清單衍生的後援資料。它適合用來檢查某個 Plugin 是否已安裝、已啟用，並且對冷啟動規劃可見，但它不是針對已在執行中的 Gateway 程序的即時執行階段探測。變更 Plugin 程式碼、啟用狀態、掛鉤政策或 `plugins.load.paths` 後，請重新啟動提供該通道服務的 Gateway，然後才期待新的 `register(api)` 程式碼或掛鉤執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝程序。
</Note>

對於封裝 Docker 映像檔內的內建 Plugin 工作，請將 Plugin
原始碼目錄繫結掛載到對應的封裝原始碼路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會先於 `/app/dist/extensions/synology-chat` 探索該已掛載的原始碼
覆蓋層；單純複製的原始碼
目錄仍不會生效，因此一般封裝安裝仍會使用已編譯的 dist。

對於執行階段掛鉤偵錯：

- `openclaw plugins inspect <id> --json` 會顯示已註冊的掛鉤，以及來自模組載入檢查階段的診斷資訊。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、服務/程序提示、設定路徑與 RPC 健康狀態。
- 非內建對話掛鉤 (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) 需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免複製本機目錄（會加入到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援與 `--link` 搭配使用，因為連結式安裝會重用原始碼路徑，而不是覆寫受管理的安裝目標。

在 npm 安裝時使用 `--pin`，可將解析後的精確規格 (`name@version`) 儲存在受管理的 Plugin 索引中，同時保留預設的非釘選行為。
</Note>

### Plugin 索引

Plugin 安裝中繼資料是由機器管理的狀態，不是使用者設定。安裝與更新會將它寫入作用中 OpenClaw 狀態目錄底下的 `plugins/installs.json`。其頂層 `installRecords` 對應表是安裝中繼資料的持久來源，包括損壞或遺失 Plugin 資訊清單的記錄。`plugins` 陣列是由資訊清單衍生的冷登錄快取。該檔案包含請勿編輯警告，並由 `openclaw plugins update`、解除安裝、診斷與冷 Plugin 登錄檔使用。

當 OpenClaw 在設定中看到已出貨的舊版 `plugins.installs` 記錄時，會將它們移入 Plugin 索引並移除設定鍵；如果任一寫入失敗，設定記錄會被保留，確保安裝中繼資料不會遺失。

### 執行階段相依項

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` 會檢查 OpenClaw 所擁有內建 Plugin 的封裝執行階段相依項階段。它不是第三方 npm 或 ClawHub Plugin 的安裝/更新路徑。

當封裝安裝在 Gateway 啟動或 `plugins doctor` 期間回報缺少內建執行階段相依項時，請使用 `--repair`。修復只會安裝缺少的已啟用內建 Plugin 相依項，並停用生命週期指令碼。使用 `--prune` 可移除舊版封裝版面配置留下的過期未知外部執行階段相依項根目錄。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會從 `plugins.entries`、持久化 Plugin 索引、Plugin 允許/拒絕清單項目，以及適用時的連結式 `plugins.load.paths` 項目中移除 Plugin 記錄。除非設定 `--keep-files`，否則解除安裝也會移除追蹤到的受管理安裝目錄，前提是它位於 OpenClaw 的 Plugin extensions 根目錄內。對於 active memory Plugin，記憶體槽位會重設為 `memory-core`。

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

更新會套用到受管理 Plugin 索引中已追蹤的 Plugin 安裝，以及 `hooks.internal.installs` 中已追蹤的掛鉤套件安裝。

<AccordionGroup>
  <Accordion title="解析 Plugin ID 與 npm 規格">
    當你傳入 Plugin ID 時，OpenClaw 會重用該 Plugin 已記錄的安裝規格。這表示先前儲存的 dist-tag，例如 `@beta`，以及精確釘選版本，會在之後的 `update <id>` 執行中繼續使用。

    對於 npm 安裝，你也可以傳入帶有 dist-tag 或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回已追蹤的 Plugin 記錄，更新該已安裝的 Plugin，並記錄新的 npm 規格供未來依 ID 更新時使用。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回已追蹤的 Plugin 記錄。當某個 Plugin 已釘選到精確版本，而你想將它移回登錄檔的預設發行線時，請使用此方式。

  </Accordion>
  <Accordion title="版本檢查與完整性漂移">
    在即時 npm 更新之前，OpenClaw 會根據 npm 登錄檔中繼資料檢查已安裝的套件版本。如果已安裝版本與已記錄成品身分已經符合解析後的目標，更新會略過，不會下載、重新安裝或重寫 `openclaw.json`。

    當已儲存的完整性雜湊存在，且擷取到的成品雜湊發生變化時，OpenClaw 會將其視為 npm 成品漂移。互動式 `openclaw plugins update` 命令會列印預期與實際雜湊，並在繼續前要求確認。非互動式更新輔助程式會以關閉失敗處理，除非呼叫者提供明確的續行情境政策。

  </Accordion>
  <Accordion title="更新時使用 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可用於 `plugins update`，作為 Plugin 更新期間內建危險程式碼掃描誤判的緊急覆寫。它仍不會繞過 Plugin `before_install` 政策封鎖或掃描失敗封鎖，而且只適用於 Plugin 更新，不適用於掛鉤套件更新。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

針對單一 Plugin 的深度內省。顯示身分、載入狀態、來源、已註冊能力、掛鉤、工具、命令、服務、Gateway 方法、HTTP 路由、政策旗標、診斷、安裝中繼資料、套件能力，以及任何偵測到的 MCP 或 LSP 伺服器支援。

每個 Plugin 都會依照它在執行階段實際註冊的內容分類：

- **plain-capability** — 一種能力類型（例如僅提供者的 Plugin）
- **hybrid-capability** — 多種能力類型（例如文字 + 語音 + 圖片）
- **hook-only** — 僅有掛鉤，沒有能力或介面
- **non-capability** — 工具/命令/服務，但沒有能力

如需能力模型的更多資訊，請參閱 [Plugin 形態](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合指令碼與稽核使用的機器可讀報告。`inspect --all` 會呈現整體表格，包含形態、能力種類、相容性通知、套件能力與掛鉤摘要欄位。`info` 是 `inspect` 的別名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報 Plugin 載入錯誤、資訊清單/探索診斷，以及相容性通知。當一切正常時，會列印 `No plugin issues detected.`

對於缺少 `register`/`activate` 匯出等模組形態失敗，請用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出形態摘要。

### 登錄檔

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 Plugin 登錄檔是 OpenClaw 對已安裝 Plugin 身分、啟用狀態、來源中繼資料與貢獻所有權的持久化冷讀模型。一般啟動、提供者擁有者查找、通道設定分類與 Plugin 清查，都可以在不匯入 Plugin 執行階段模組的情況下讀取它。

使用 `plugins registry` 檢查持久化登錄檔是否存在、目前有效或過期。使用 `--refresh` 可從持久化 Plugin 索引、設定政策與資訊清單/套件中繼資料重新建置它。這是修復路徑，不是執行階段啟用路徑。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的緊急相容性開關，用於登錄檔讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；env 後援僅供遷移推出期間的緊急啟動復原使用。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 接受本機 Marketplace 路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub 儲存庫 URL，或 git URL。`--json` 會列印解析後的來源標籤，以及已剖析的 Marketplace 資訊清單與 Plugin 項目。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [社群 Plugin](/zh-TW/plugins/community)
