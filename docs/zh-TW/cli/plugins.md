---
read_when:
    - 你想要安裝或管理 Gateway Plugin 或相容套件
    - 你想要偵錯 Plugin 載入失敗問題
sidebarTitle: Plugins
summary: CLI 參考：`openclaw plugins`（list、install、marketplace、uninstall、enable/disable、doctor）
title: Plugin
x-i18n:
    generated_at: "2026-05-10T19:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
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

若要調查緩慢的安裝、檢查、解除安裝或 registry 重新整理，請搭配 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` 執行命令。Trace 會將階段計時寫入 stderr，並保持 JSON 輸出可解析。請參閱[偵錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
在 Nix 模式 (`OPENCLAW_NIX_MODE=1`) 中，Plugin 生命週期變更操作會停用。請改用此安裝的 Nix 來源，而不是 `plugins install`、`plugins update`、`plugins uninstall`、`plugins enable` 或 `plugins disable`；若使用 nix-openclaw，請使用 agent 優先的 [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start)。
</Note>

<Note>
Bundled Plugin 會隨 OpenClaw 一起提供。有些預設啟用（例如 bundled 模型 provider、bundled 語音 provider，以及 bundled browser Plugin）；其他則需要 `plugins enable`。

原生 OpenClaw Plugin 必須提供 `openclaw.plugin.json`，並包含內嵌 JSON Schema（`configSchema`，即使為空也一樣）。相容 bundle 則改用自己的 bundle manifest。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。Verbose list/info 輸出也會顯示 bundle subtype（`codex`、`claude` 或 `cursor`）以及偵測到的 bundle capability。
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

測試設定時安裝的維護者，可以使用受保護的環境變數覆寫自動 Plugin 安裝來源。請參閱
[Plugin 安裝覆寫](/zh-TW/plugins/install-overrides)。

<Warning>
在 launch cutover 期間，裸 package 名稱預設會從 npm 安裝。若要使用 ClawHub，請用 `clawhub:<package>`。請把 Plugin 安裝視為執行程式碼。優先使用 pinned 版本。
</Warning>

`plugins search` 會查詢 ClawHub 中可安裝的 Plugin package，並列印可直接安裝的 package 名稱。它會搜尋 code-plugin 與 bundle-plugin package，而不是 Skills。若要搜尋 ClawHub Skills，請使用 `openclaw skills search`。

<Note>
ClawHub 是大多數 Plugin 的主要發行與探索介面。Npm 仍是受支援的 fallback 與直接安裝路徑。OpenClaw 擁有的 `@openclaw/*` Plugin package 已重新發布到 npm；目前清單請參閱 [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) 或 [Plugin inventory](/zh-TW/plugins/plugin-inventory)。Stable 安裝會使用 `latest`。Beta-channel 安裝與更新會在 npm `beta` dist-tag 可用時優先使用該 tag，然後 fallback 到 `latest`。
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    如果你的 `plugins` 區段由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該 included 檔案，並保持 `openclaw.json` 不變。Root include、include array，以及帶有 sibling override 的 include 會 fail closed，而不是 flatten。支援的形狀請參閱 [Config includes](/zh-TW/gateway/configuration)。

    如果安裝期間 config 無效，`plugins install` 通常會 fail closed，並提示你先執行 `openclaw doctor --fix`。在 Gateway 啟動與熱重新載入期間，無效的 Plugin config 會像其他無效 config 一樣 fail closed；`openclaw doctor --fix` 可以 quarantine 無效的 Plugin entry。唯一有文件記載的安裝時例外，是針對明確 opt into `openclaw.install.allowInvalidConfigRecovery` 的 Plugin 的狹窄 bundled-plugin recovery path。

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` 會重用既有安裝目標，並就地覆寫已安裝的 Plugin 或 hook pack。當你有意從新的本機路徑、archive、ClawHub package 或 npm artifact 重新安裝相同 id 時使用它。對於已追蹤 npm Plugin 的例行升級，請優先使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 Plugin id 執行 `plugins install`，OpenClaw 會停止，並引導你使用 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` 只適用於 npm 安裝。它不支援 `git:` 安裝；若要 pinned source，請使用明確的 git ref，例如 `git:github.com/acme/plugin@v1.2.3`。它不支援 `--marketplace`，因為 marketplace 安裝會保存 marketplace source metadata，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是內建 dangerous-code scanner false positive 的 break-glass 選項。即使內建 scanner 回報 `critical` finding，它也允許安裝繼續，但它**不會**繞過 Plugin `before_install` hook policy block，也**不會**繞過 scan failure。

    此 CLI flag 適用於 Plugin install/update 流程。Gateway-backed Skill dependency 安裝會使用對應的 `dangerouslyForceUnsafeInstall` request override，而 `openclaw skills install` 仍是獨立的 ClawHub Skill 下載/安裝流程。

    如果你發布到 ClawHub 的 Plugin 被 registry scan 封鎖，請使用 [ClawHub](/zh-TW/clawhub/security) 中的 publisher 步驟。

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` 也是安裝在 `package.json` 中公開 `openclaw.hooks` 的 hook pack 的介面。請使用 `openclaw hooks` 取得 filtered hook visibility 與 per-hook enablement，而不是用於 package 安裝。

    Npm spec 是 **registry-only**（package name + optional **exact version** 或 **dist-tag**）。Git/URL/file spec 與 semver range 會被拒絕。為了安全，即使你的 shell 有全域 npm 安裝設定，Dependency 安裝也會以 project-local 搭配 `--ignore-scripts` 執行。受管理的 Plugin npm root 會繼承 OpenClaw 的 package-level npm `overrides`，因此 host security pin 也會套用到 hoisted Plugin dependency。

    當你想明確使用 npm resolution 時，請使用 `npm:<package>`。在 launch cutover 期間，裸 package spec 也會直接從 npm 安裝。

    裸 spec 與 `@latest` 會留在 stable track。OpenClaw 日期標記修正版，例如 `2026.5.3-1`，在此檢查中屬於 stable release。如果 npm 將其中任一解析為 prerelease，OpenClaw 會停止，並要求你以 prerelease tag（例如 `@beta`/`@rc`）或 exact prerelease version（例如 `@1.2.3-beta.4`）明確 opt in。

    如果裸 install spec 符合官方 Plugin id（例如 `diffs`），OpenClaw 會直接安裝 catalog entry。若要安裝同名 npm package，請使用明確的 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Git repositories">
    使用 `git:<repo>` 可直接從 git repository 安裝。支援形式包括 `git:github.com/owner/repo`、`git:owner/repo`、完整 `https://`、`ssh://`、`git://`、`file://`，以及 `git@host:owner/repo.git` clone URL。加入 `@<ref>` 或 `#<ref>`，可在安裝前 check out branch、tag 或 commit。

    Git 安裝會 clone 到 temporary directory，在有指定 ref 時 check out 請求的 ref，然後使用一般 Plugin directory installer。這表示 manifest validation、dangerous-code scanning、package-manager install work 與 install record 的行為都會像 npm 安裝一樣。記錄下來的 git 安裝包含 source URL/ref 以及 resolved commit，因此 `openclaw plugins update` 之後可以重新解析該 source。

    從 git 安裝後，請使用 `openclaw plugins inspect <id> --runtime --json` 驗證 runtime registration，例如 gateway method 與 CLI command。如果 Plugin 使用 `api.registerCli` 註冊了 CLI root，請直接透過 OpenClaw root CLI 執行該命令，例如 `openclaw demo-plugin ping`。

  </Accordion>
  <Accordion title="Archives">
    支援的 archive：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw Plugin archive 必須在 extracted Plugin root 包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的 archive 會在 OpenClaw 寫入 install record 前被拒絕。

    當檔案是 npm-pack tarball，且你想測試與 registry 安裝相同的受管理 npm-root 安裝路徑時，請使用 `npm-pack:<path.tgz>`，
    包括 `package-lock.json` verification、hoisted dependency scanning 與
    npm install record。Plain archive path 仍會以 local archive 安裝在
    Plugin extensions root 底下。

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

使用 `npm:` 可讓 npm-only resolution 明確化：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會在安裝前檢查公告的 Plugin API / 最低 Gateway 相容性。當選取的 ClawHub 版本發布 ClawPack 成品時，OpenClaw 會下載已版本化的 npm-pack `.tgz`、驗證 ClawHub 摘要標頭與成品摘要，然後透過一般封存路徑安裝。沒有 ClawPack 中繼資料的較舊 ClawHub 版本，仍會透過舊版套件封存驗證路徑安裝。記錄的安裝會保留其 ClawHub 來源中繼資料、成品種類、npm integrity、npm shasum、tarball 名稱，以及 ClawPack 摘要事實，以供後續更新使用。
未版本化的 ClawHub 安裝會保留未版本化的記錄規格，讓 `openclaw plugins update` 可以跟隨較新的 ClawHub 發行版本；明確版本或標籤選擇器，例如 `clawhub:pkg@1.2.3` 和 `clawhub:pkg@beta`，仍會固定在該選擇器。

#### Marketplace 簡寫

當 marketplace 名稱存在於 Claude 的本機登錄快取 `~/.claude/plugins/known_marketplaces.json` 時，請使用 `plugin@marketplace` 簡寫：

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

對於本機路徑和封存檔，OpenClaw 會自動偵測：

- 原生 OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 相容 bundle（`.codex-plugin/plugin.json`）
- Claude 相容 bundle（`.claude-plugin/plugin.json` 或預設 Claude 元件配置）
- Cursor 相容 bundle（`.cursor-plugin/plugin.json`）

<Note>
相容 bundle 會安裝到一般 Plugin 根目錄，並參與相同的 list/info/enable/disable 流程。目前支援 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的 bundle 能力會顯示在診斷/info 中，但尚未接入執行階段執行。
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
  從表格檢視切換為每個 Plugin 的詳細列，包含 source/origin/version/activation 中繼資料。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀的清單，加上登錄診斷和套件相依項安裝狀態。
</ParamField>

<Note>
`plugins list` 會先讀取持久化的本機 Plugin 登錄；當登錄遺失或無效時，會退回使用僅由 manifest 衍生的備援。這對於檢查 Plugin 是否已安裝、已啟用，且對冷啟動規劃可見很有用，但它不是對已執行 Gateway 程序的即時執行階段探測。變更 Plugin 程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 後，請重新啟動服務該 channel 的 Gateway，再期待新的 `register(api)` 程式碼或 hook 執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子程序，而不只是包裝程序。

`plugins list --json` 會包含每個 Plugin 來自 `package.json`
`dependencies` 和 `optionalDependencies` 的 `dependencyStatus`。OpenClaw 會檢查這些套件
名稱是否存在於該 Plugin 一般 Node `node_modules` 查找路徑中；它
不會匯入 Plugin 執行階段程式碼、執行套件管理器，或修復遺失的
相依項。
</Note>

`plugins search` 是遠端 ClawHub 目錄查詢。它不會檢查本機
狀態、變更設定、安裝套件，或載入 Plugin 執行階段程式碼。搜尋
結果會包含 ClawHub 套件名稱、family、channel、version、summary，以及
安裝提示，例如 `openclaw plugins install clawhub:<package>`。

若要在已封裝的 Docker 映像中處理內建 Plugin，請將 Plugin
來源目錄 bind-mount 到對應的封裝來源路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會先於 `/app/dist/extensions/synology-chat` 發現該掛載的來源
覆蓋層；單純複製的來源
目錄仍會保持非作用狀態，因此一般封裝安裝仍會使用編譯後的 dist。

對於執行階段 hook 偵錯：

- `openclaw plugins inspect <id> --runtime --json` 會顯示來自模組載入檢查流程的已註冊 hook 和診斷。執行階段檢查絕不會安裝相依項；請使用 `openclaw doctor --fix` 清理舊版相依項狀態，或復原設定中引用但遺失的可下載 Plugin。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、服務/程序提示、設定路徑，以及 RPC 健康狀態。
- 非內建對話 hook（`llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免複製本機目錄（會加入 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援與 `--link` 一起使用，因為連結安裝會重用來源路徑，而不是覆寫受管理的安裝目標。

在 npm 安裝上使用 `--pin`，可將解析後的精確規格（`name@version`）儲存在受管理的 Plugin 索引中，同時保留預設的不固定行為。
</Note>

### Plugin 索引

Plugin 安裝中繼資料是由機器管理的狀態，不是使用者設定。安裝和更新會將它寫入有效 OpenClaw 狀態目錄下的 `plugins/installs.json`。其頂層 `installRecords` map 是安裝中繼資料的持久來源，包含損壞或遺失 Plugin manifest 的記錄。`plugins` 陣列是由 manifest 衍生的冷登錄快取。此檔案包含請勿編輯警告，並由 `openclaw plugins update`、uninstall、診斷，以及冷 Plugin 登錄使用。

當 OpenClaw 在設定中看到已出貨的舊版 `plugins.installs` 記錄時，執行階段讀取會將它們視為相容性輸入，而不會重寫 `openclaw.json`。明確的 Plugin 寫入和 `openclaw doctor --fix` 會在允許寫入設定時，將這些記錄移入 Plugin 索引並移除該設定鍵；若任一寫入失敗，會保留設定記錄，避免安裝中繼資料遺失。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會從 `plugins.entries`、持久化 Plugin 索引、Plugin allow/deny list 項目，以及適用時的連結 `plugins.load.paths` 項目中移除 Plugin 記錄。除非設定 `--keep-files`，否則 uninstall 也會在追蹤的受管理安裝目錄位於 OpenClaw 的 Plugin extensions 根目錄內時移除該目錄。對於 active memory Plugin，memory slot 會重設為 `memory-core`。

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
  <Accordion title="解析 Plugin id 與 npm spec">
    當你傳入 Plugin id 時，OpenClaw 會重用該 Plugin 記錄的安裝規格。這表示先前儲存的 dist-tag，例如 `@beta`，以及精確固定版本，都會在後續 `update <id>` 執行中繼續使用。

    對於 npm 安裝，你也可以傳入具有 dist-tag 或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回已追蹤的 Plugin 記錄、更新該已安裝的 Plugin，並記錄新的 npm 規格以供未來以 id 為基礎的更新使用。

    傳入沒有版本或標籤的 npm 套件名稱，也會解析回已追蹤的 Plugin 記錄。當 Plugin 固定在精確版本，而你想將它移回登錄預設發行線時，請使用這個方式。

  </Accordion>
  <Accordion title="Beta channel 更新">
    `openclaw plugins update` 會重用已追蹤的 Plugin 規格，除非你傳入新規格。`openclaw update` 另外知道有效的 OpenClaw update channel：在 beta channel 上，預設線的 npm 和 ClawHub Plugin 記錄會先嘗試 `@beta`，若不存在 Plugin beta 發行版本，則退回記錄的 default/latest 規格。精確版本和明確標籤會維持固定在該選擇器。

  </Accordion>
  <Accordion title="版本檢查與 integrity 偏移">
    在即時 npm 更新前，OpenClaw 會將已安裝套件版本與 npm registry 中繼資料比對。如果已安裝版本和記錄的成品身分已符合解析後的目標，更新會略過，不會下載、重新安裝或重寫 `openclaw.json`。

    當存在已儲存的 integrity 雜湊，而擷取的成品雜湊改變時，OpenClaw 會將其視為 npm 成品偏移。互動式 `openclaw plugins update` 指令會印出預期和實際雜湊，並在繼續前要求確認。非互動式更新 helper 會封閉失敗，除非呼叫端提供明確的繼續政策。

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

Inspect 預設不會匯入 Plugin 執行階段，會顯示身分、載入狀態、來源、manifest 能力、政策旗標、診斷、安裝中繼資料、bundle 能力，以及任何偵測到的 MCP 或 LSP server 支援。加入 `--runtime` 可載入 Plugin 模組，並包含已註冊的 hook、tool、command、service、gateway method，以及 HTTP route。執行階段檢查會直接回報遺失的 Plugin 相依項；安裝與修復仍留在 `openclaw plugins install`、`openclaw plugins update` 和 `openclaw doctor --fix` 中。

Plugin 擁有的 CLI command 通常會安裝為根 `openclaw` command group，但 Plugin 也可以在核心父層下註冊巢狀 command，例如 `openclaw nodes`。在 `inspect --runtime` 顯示 `cliCommands` 下的 command 後，請在列出的路徑執行；例如註冊 `demo-git` 的 Plugin 可使用 `openclaw demo-git ping` 驗證。

每個 Plugin 都會依照其在執行階段實際註冊的內容分類：

- **plain-capability** — 一種 capability 類型（例如僅提供 provider 的 Plugin）
- **hybrid-capability** — 多種 capability 類型（例如文字 + 語音 + 圖片）
- **hook-only** — 僅有 hook，沒有 capability 或 surface
- **non-capability** — 工具/命令/服務，但沒有 capability

如需 capability 模型的更多資訊，請參閱 [Plugin 形態](/zh-TW/plugins/architecture#plugin-shapes)。

<Note>
`--json` 旗標會輸出適合用於指令碼和稽核的機器可讀報告。`inspect --all` 會呈現整個 fleet 的表格，包含 shape、capability kind、相容性通知、bundle capability，以及 hook 摘要欄位。`info` 是 `inspect` 的別名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會報告 Plugin 載入錯誤、manifest/discovery 診斷，以及相容性通知。當一切正常時，會列印 `No plugin issues detected.`

如果已設定的 Plugin 存在於磁碟上，但被 loader 的 path-safety 檢查封鎖，config 驗證會保留該 Plugin 項目，並將其回報為 `present but blocked`。請修正前面的 blocked-plugin 診斷，例如路徑擁有權或 world-writable 權限，而不是移除 `plugins.entries.<id>` 或 `plugins.allow` config。

對於缺少 `register`/`activate` export 這類 module-shape 失敗，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的 export-shape 摘要。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 Plugin registry 是 OpenClaw 對已安裝 Plugin 身分、啟用狀態、來源 metadata，以及 contribution ownership 的持久化冷讀取模型。一般啟動、provider owner 查找、channel setup 分類，以及 Plugin inventory 都可以在不匯入 Plugin runtime module 的情況下讀取它。

使用 `plugins registry` 檢查持久化 registry 是否存在、目前有效或已過期。使用 `--refresh` 可從持久化 Plugin index、config policy，以及 manifest/package metadata 重建它。這是一條修復路徑，不是 runtime activation 路徑。

`openclaw doctor --fix` 也會修復 registry 相關的 managed npm 漂移：如果 managed Plugin npm root 底下有孤立或復原的 `@openclaw/*` package 遮蔽了 bundled Plugin，doctor 會移除該過期 package 並重建 registry，讓啟動流程根據 bundled manifest 進行驗證。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的 break-glass 相容性開關，用於 registry 讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；env fallback 僅供 migration 推出期間的緊急啟動復原使用。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 接受本機 marketplace 路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會列印解析後的來源標籤，以及剖析後的 marketplace manifest 和 Plugin 項目。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [ClawHub](/zh-TW/clawhub)
