---
read_when:
    - 您想要安裝或管理 Gateway Plugin 或相容的套件組合
    - 您想要偵錯 Plugin 載入失敗
sidebarTitle: Plugins
summary: 適用於 `openclaw plugins` 的 CLI 參考（list、install、marketplace、uninstall、enable/disable、doctor）
title: Plugins
x-i18n:
    generated_at: "2026-05-07T01:51:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
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

若要調查緩慢的安裝、檢查、解除安裝或 registry 重新整理，請以 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行命令。追蹤會將各階段耗時寫入 stderr，並保持 JSON 輸出可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，Plugin 生命週期的變更操作會停用。此安裝請使用 Nix 來源，而不是 `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable` 或 `plugins disable`；對於 nix-openclaw，請使用 agent-first 的[快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
Bundled plugins 會隨 OpenClaw 一起提供。有些預設啟用（例如 bundled model providers、bundled speech providers，以及 bundled browser plugin）；其他則需要 `plugins enable`。

原生 OpenClaw Plugin 必須隨附含有內嵌 JSON Schema（`configSchema`，即使是空的）的 `openclaw.plugin.json`。相容 bundle 則改用自己的 bundle manifest。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細 list/info 輸出也會顯示 bundle 子類型（`codex`、`claude` 或 `cursor`），以及偵測到的 bundle capabilities。
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
在 launch cutover 期間，裸 package 名稱預設會從 npm 安裝。ClawHub 請使用 `clawhub:<package>`。請把安裝 Plugin 視為執行程式碼。建議使用固定版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 Plugin package，並印出可直接安裝的 package 名稱。它會搜尋 code-plugin 與 bundle-plugin package，而不是 skills。ClawHub Skills 請使用 `openclaw skills search`。

<Note>
ClawHub 是大多數 Plugin 的主要發行與探索介面。Npm 仍是受支援的 fallback 與直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` Plugin package 已再次發布到 npm；請在 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或 [Plugin 清單](/zh-TW/plugins/plugin-inventory)查看目前清單。穩定版安裝使用 `latest`。Beta-channel 安裝與更新會在 npm `beta` dist-tag 可用時優先使用該 tag，然後 fallback 到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="設定 include 與無效設定修復">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該 include 檔案，並保持 `openclaw.json` 不變。Root include、include array，以及帶有同層覆寫的 include 會 fail closed，而不是攤平成單一設定。支援的形式請參閱[設定 include](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會 fail closed，並要求你先執行 `openclaw doctor --fix`。在 Gateway 啟動與 hot reload 期間，無效的 Plugin 設定會像任何其他無效設定一樣 fail closed；`openclaw doctor --fix` 可以隔離無效的 Plugin entry。唯一記載的安裝時例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的 Plugin 的狹窄 bundled-plugin 復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝 vs 更新">
    `--force` 會重用既有安裝目標，並就地覆寫已安裝的 Plugin 或 hook pack。當你有意從新的本機路徑、封存檔、ClawHub package 或 npm artifact 重新安裝相同 id 時使用它。對於已追蹤 npm Plugin 的例行升級，建議使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 Plugin id 執行 `plugins install`，OpenClaw 會停止，並提示你使用 `plugins update <id-or-npm-spec>` 進行一般升級，或在確實想從不同來源覆寫目前安裝時使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 只適用於 npm 安裝。不支援搭配 `git:` 安裝；如果你想固定來源，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它不支援搭配 `--marketplace`，因為 marketplace 安裝會保留 marketplace 來源 metadata，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是 built-in dangerous-code scanner 誤判時的 break-glass 選項。即使 built-in scanner 回報 `critical` findings，它也允許安裝繼續，但它**不會**繞過 Plugin `before_install` hook policy block，也**不會**繞過掃描失敗。

    此 CLI flag 適用於 Plugin install/update 流程。Gateway-backed skill dependency install 會使用對應的 `dangerouslyForceUnsafeInstall` request override，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

    如果你發布到 ClawHub 的 Plugin 被 registry scan 擋下，請使用 [ClawHub](/zh-TW/tools/clawhub) 中的發布者步驟。

  </Accordion>
  <Accordion title="Hook pack 與 npm spec">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 的 hook pack 的介面。請使用 `openclaw hooks` 查看篩選後的 hook 可見性與逐一啟用 hook，而不是用於 package 安裝。

    Npm spec **僅限 registry**（package name + 可選的**精確版本**或 **dist-tag**）。Git/URL/file spec 與 semver range 會被拒絕。為安全起見，dependency install 會以 project-local 方式搭配 `--ignore-scripts` 執行，即使你的 shell 有全域 npm install settings 也一樣。受管理的 Plugin npm root 會繼承 OpenClaw package-level npm `overrides`，因此 host security pin 也會套用到 hoisted Plugin dependency。

    當你想明確指定 npm resolution 時，請使用 `npm:<package>`。在 launch cutover 期間，裸 package spec 也會直接從 npm 安裝。

    裸 spec 與 `@latest` 會停留在穩定軌。舊版 OpenClaw correction version（例如 `2026.5.3-1`）仍會在此檢查中視為穩定發行，讓較舊的 package 能安全地持續更新。新的 monthly support-line 工作計畫改用一般 SemVer patch number，而不是 hyphen correction suffix。如果 npm 將 default-line spec 解析為 prerelease，OpenClaw 會停止，並要求你使用 prerelease tag（例如 `@beta`/`@rc`）或精確的 prerelease version（例如 `@1.2.3-beta.4`）明確選擇加入。

    如果裸 install spec 符合官方 Plugin id（例如 `diffs`），OpenClaw 會直接安裝 catalog entry。若要安裝同名的 npm package，請使用明確的 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repository">
    使用 `git:<repo>` 可直接從 git repository 安裝。支援的形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URL。加入 `@<ref>` 或 `#<ref>` 可在安裝前 checkout branch、tag 或 commit。

    Git 安裝會 clone 到 temporary directory，在 ref 存在時 checkout 要求的 ref，然後使用一般 Plugin directory installer。這表示 manifest validation、dangerous-code scanning、package-manager install work，以及 install record 的行為都會像 npm 安裝。記錄的 git 安裝包含來源 URL/ref 加上 resolved commit，因此 `openclaw plugins update` 稍後可以重新解析該來源。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證 runtime registration，例如 gateway method 與 CLI command。如果 Plugin 使用 `api.registerCli` 註冊了 CLI root，請直接透過 OpenClaw root CLI 執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="封存檔">
    支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw Plugin 封存檔必須在解壓後的 Plugin root 含有有效的 `openclaw.plugin.json`；僅含 `package.json` 的封存檔會在 OpenClaw 寫入 install record 前被拒絕。

    當檔案是 npm-pack tarball，且你想測試 registry install 使用的同一個 managed npm-root install path 時，請使用 `npm-pack:<path.tgz>`，包括 `package-lock.json` 驗證、hoisted dependency scanning，以及 npm install record。普通封存檔路徑仍會作為本機封存檔安裝到 Plugin extensions root 下。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝會使用明確的 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

在 launch cutover 期間，裸 npm-safe Plugin spec 預設會從 npm 安裝：

```bash
openclaw plugins install openclaw-codex-app-server
```

使用 `npm:` 可明確指定僅使用 npm resolution：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查宣告的 Plugin API / 最低 Gateway 相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載版本化 npm-pack `.tgz`、驗證 ClawHub 摘要標頭與成品摘要，然後透過一般封存路徑安裝。沒有 ClawPack 中繼資料的舊版 ClawHub 版本仍會透過舊版套件封存驗證路徑安裝。已記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm integrity、npm shasum、tarball 名稱，以及 ClawPack 摘要事實，以供後續更新使用。
未指定版本的 ClawHub 安裝會保留未指定版本的已記錄規格，因此 `openclaw plugins update` 可以跟隨較新的 ClawHub 發布；明確版本或標籤選擇器（例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`）則會保持釘選到該選擇器。

#### 市集簡寫

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
- Claude 相容 bundle（`.claude-plugin/plugin.json` 或預設 Claude 元件版面配置）
- Cursor 相容 bundle（`.cursor-plugin/plugin.json`）

<Note>
相容 bundle 會安裝到一般 Plugin 根目錄，並參與相同的 list/info/enable/disable 流程。目前支援 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的 bundle 能力會顯示在診斷/info 中，但尚未接入 runtime 執行。
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
  從表格檢視切換為每個 Plugin 的詳細列，包含來源/起源/版本/啟用中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清單，加上登錄診斷與套件相依項安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久化的本機 Plugin 登錄；當登錄遺失或無效時，會使用僅從 manifest 衍生的後備資料。這可用來檢查 Plugin 是否已安裝、已啟用，且對冷啟動規劃可見，但它不是對已在執行中的 Gateway 程序進行即時 runtime 探測。變更 Plugin 程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 後，請重新啟動服務該 channel 的 Gateway，再期待新的 `register(api)` 程式碼或 hook 執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝程序。

`plugins list --json` 會包含每個 Plugin 來自 `package.json`
`dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於該 Plugin 一般 Node `node_modules` 查找路徑上；它
不會匯入 Plugin runtime 程式碼、執行套件管理器，或修復缺少的
相依項。
</Note>

`plugins search` 是遠端 ClawHub 目錄查詢。它不會檢查本機
狀態、變更 config、安裝套件，或載入 Plugin runtime 程式碼。搜尋
結果包含 ClawHub 套件名稱、家族、channel、版本、摘要，以及
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

若要在封裝的 Docker image 內處理內建 Plugin，請將 Plugin
來源目錄 bind-mount 到相符的封裝來源路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會先探索該掛載的來源
覆蓋，再探索 `/app/dist/extensions/synology-chat`；單純複製的來源
目錄仍會保持無作用，因此一般封裝安裝仍會使用已編譯的 dist。

對於 runtime hook 偵錯：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自模組載入檢查流程的已註冊 hook 與診斷。Runtime 檢查絕不安裝相依項；請使用 `openclaw doctor --fix` 清理舊版相依項狀態，或復原 config 參照中缺少且可下載的 Plugin。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、服務/程序提示、config 路徑，以及 RPC 健康狀態。
- 非內建 conversation hook（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免複製本機目錄（會加入 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援與 `--link` 一起使用，因為 linked 安裝會重用來源路徑，而不是覆寫受管理的安裝目標。

在 npm 安裝上使用 `--pin`，可將解析後的確切規格（`name@version`）儲存在受管理 Plugin index 中，同時保持預設行為不釘選。
</Note>

### Plugin index

Plugin 安裝中繼資料是由機器管理的狀態，不是使用者 config。安裝與更新會將它寫入作用中 OpenClaw 狀態目錄下的 `plugins/installs.json`。其頂層 `installRecords` map 是安裝中繼資料的持久來源，包含損壞或缺少 Plugin manifest 的記錄。`plugins` array 是從 manifest 衍生的冷登錄快取。此檔案包含不要編輯的警告，並由 `openclaw plugins update`、解除安裝、診斷，以及冷 Plugin 登錄使用。

當 OpenClaw 在 config 中看到已出貨的舊版 `plugins.installs` 記錄時，runtime 讀取會將它們視為相容性輸入，而不會重寫 `openclaw.json`。明確的 Plugin 寫入與 `openclaw doctor --fix` 會在允許寫入 config 時，將這些記錄移入 Plugin index 並移除 config key；如果任一寫入失敗，config 記錄會被保留，以免安裝中繼資料遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會在適用時從 `plugins.entries`、持久化 Plugin index、Plugin allow/deny list 項目，以及 linked `plugins.load.paths` 項目中移除 Plugin 記錄。除非設定 `--keep-files`，否則解除安裝也會移除位於 OpenClaw Plugin extensions root 內、已追蹤的受管理安裝目錄。對於 Active Memory Plugin，memory slot 會重設為 `memory-core`。

<Note>
`--keep-config` 作為 `--keep-files` 的已棄用別名受到支援。
</Note>

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新會套用到受管理 Plugin index 中已追蹤的 Plugin 安裝，以及 `hooks.internal.installs` 中已追蹤的 hook-pack 安裝。

<AccordionGroup>
  <Accordion title="解析 Plugin id 與 npm spec">
    當你傳入 Plugin id 時，OpenClaw 會重用該 Plugin 已記錄的安裝規格。這表示先前儲存的 dist-tag（例如 `@beta`）與確切釘選版本，會在後續 `update <id>` 執行中繼續使用。

    對於 npm 安裝，你也可以傳入帶有 dist-tag 或確切版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回已追蹤的 Plugin 記錄，更新該已安裝的 Plugin，並記錄新的 npm 規格供未來依 id 更新使用。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回已追蹤的 Plugin 記錄。當某個 Plugin 已釘選到確切版本，而你想將它移回登錄的預設發布線時，請使用此方式。

  </Accordion>
  <Accordion title="Beta channel 更新">
    `openclaw plugins update` 會重用已追蹤的 Plugin 規格，除非你傳入新規格。`openclaw update` 另外知道作用中的 OpenClaw 更新 channel：在 beta channel 上，預設線 npm 與 ClawHub Plugin 記錄會先嘗試 `@beta`，如果沒有 Plugin beta 發布，則退回到已記錄的 default/latest 規格。確切版本與明確標籤會保持釘選到該選擇器。

    OpenClaw 尚未公開 LTS 或 monthly support Plugin channel。計畫中的 support-line 工作會需要 Plugin 套件與 ClawHub 標籤跟隨 core 套件的相同 support line。

  </Accordion>
  <Accordion title="版本檢查與 integrity 漂移">
    在即時 npm 更新前，OpenClaw 會根據 npm 登錄中繼資料檢查已安裝的套件版本。如果已安裝版本與已記錄的成品識別已符合解析後的目標，更新會略過，而不下載、重新安裝或重寫 `openclaw.json`。

    當已儲存的 integrity hash 存在，且擷取到的成品 hash 改變時，OpenClaw 會將其視為 npm 成品漂移。互動式 `openclaw plugins update` 命令會印出預期與實際 hash，並在繼續前要求確認。非互動式更新 helper 會採 fail closed，除非呼叫端提供明確的繼續政策。

  </Accordion>
  <Accordion title="更新時的 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可在 `plugins update` 上使用，作為 Plugin 更新期間內建危險程式碼掃描誤判的 break-glass 覆寫。它仍不會繞過 Plugin `before_install` 政策封鎖或掃描失敗封鎖，且只適用於 Plugin 更新，不適用於 hook-pack 更新。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect 預設不匯入 Plugin runtime，會顯示身分、載入狀態、來源、manifest 能力、政策旗標、診斷、安裝中繼資料、bundle 能力，以及任何偵測到的 MCP 或 LSP server 支援。加入 `--runtime` 可載入 Plugin 模組，並包含已註冊的 hook、tool、command、service、gateway method，以及 HTTP route。Runtime 檢查會直接回報缺少的 Plugin 相依項；安裝與修復則留在 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix`。

Plugin 擁有的 CLI command 會安裝為根 `openclaw` command group。當 `inspect --runtime` 在 `cliCommands` 下顯示 command 後，請以 `openclaw <command> ...` 執行；例如，註冊 `demo-git` 的 Plugin 可用 `openclaw demo-git ping` 驗證。

每個 Plugin 會依其在 runtime 實際註冊的內容分類：

- **plain-capability** — 一種能力類型（例如僅限 provider 的 Plugin）
- **hybrid-capability** — 多種能力類型（例如文字 + 語音 + 圖像）
- **hook-only** — 僅有 hook，沒有能力或介面
- **non-capability** — 工具/命令/服務，但沒有能力

請參閱 [Plugin 形態](/zh-TW/plugins/architecture#plugin-shapes)，深入了解能力模型。

<Note>
`--json` 旗標會輸出適合用於腳本和稽核的機器可讀報告。`inspect --all` 會呈現整個艦隊範圍的表格，包含形態、能力種類、相容性通知、bundle 能力，以及 hook 摘要欄位。`info` 是 `inspect` 的別名。
</Note>

### 診斷

```bash
openclaw plugins doctor
```

`doctor` 會回報 Plugin 載入錯誤、manifest/discovery 診斷，以及相容性通知。當一切都正常時，它會印出 `No plugin issues detected.`

如果已設定的 Plugin 存在於磁碟上，但被載入器的路徑安全檢查阻擋，設定驗證會保留該 Plugin 項目，並將其回報為 `present but blocked`。請修正前面的 blocked-plugin 診斷，例如路徑擁有權或全域可寫權限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` 設定。

若發生模組形態失敗，例如缺少 `register`/`activate` 匯出，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出形態摘要。

### 登錄檔

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 Plugin 登錄檔是 OpenClaw 對已安裝 Plugin 身分、啟用狀態、來源中繼資料，以及貢獻擁有權的持久化冷讀模型。一般啟動、provider 擁有者查找、頻道設定分類，以及 Plugin 清單都可以讀取它，而不必匯入 Plugin runtime 模組。

使用 `plugins registry` 檢查持久化登錄檔是否存在、是否為目前狀態或已過期。使用 `--refresh` 從持久化 Plugin 索引、設定政策，以及 manifest/package 中繼資料重建它。這是修復路徑，不是 runtime 啟用路徑。

`openclaw doctor --fix` 也會修復與登錄檔相鄰的受管理 npm 偏移：如果受管理 Plugin npm root 底下有孤立或復原的 `@openclaw/*` package 遮蔽了 bundled Plugin，doctor 會移除該過期 package 並重建登錄檔，讓啟動程序依據 bundled manifest 進行驗證。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的緊急相容性開關，用於登錄檔讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；這個環境變數 fallback 僅用於遷移推出期間的緊急啟動復原。
</Warning>

### 市集

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

市集清單接受本機市集路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會印出解析後的來源標籤，以及剖析後的市集 manifest 和 Plugin 項目。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [社群 Plugin](/zh-TW/plugins/community)
