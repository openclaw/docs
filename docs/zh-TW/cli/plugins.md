---
read_when:
    - 您想安裝或管理 Gateway Plugin 或相容套件。
    - 你想偵錯 Plugin 載入失敗
sidebarTitle: Plugins
summary: '`openclaw plugins` 的 CLI 參考（list、install、marketplace、uninstall、enable/disable、deps、doctor）'
title: Plugin
x-i18n:
    generated_at: "2026-04-30T09:35:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

管理 Gateway Plugin、hook pack 與相容 bundle。

<CardGroup cols={2}>
  <Card title="Plugin 系統" href="/zh-TW/tools/plugin">
    安裝、啟用與疑難排解 Plugin 的終端使用者指南。
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

若要調查安裝、檢查、解除安裝或重新整理 registry 速度緩慢的問題，請在執行命令時加上 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。Trace 會將階段計時寫入 stderr，並保持 JSON 輸出可解析。請參閱[除錯](/zh-TW/help/debugging#plugin-lifecycle-trace)。

<Note>
內建 Plugin 會隨 OpenClaw 一起提供。有些預設啟用（例如內建模型 provider、內建語音 provider，以及內建瀏覽器 Plugin）；其他則需要執行 `plugins enable`。

原生 OpenClaw Plugin 必須提供 `openclaw.plugin.json`，並內嵌 JSON Schema（`configSchema`，即使為空也一樣）。相容 bundle 則使用自己的 bundle manifest。

`plugins list` 會顯示 `Format: openclaw` 或 `Format: bundle`。詳細清單/資訊輸出也會顯示 bundle 子類型（`codex`、`claude` 或 `cursor`）以及偵測到的 bundle 能力。
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
裸 package 名稱會先對照 ClawHub 檢查，然後才是 npm。請把安裝 Plugin 視同執行程式碼。建議使用釘選版本。
</Warning>

<Note>
ClawHub 是多數 Plugin 的主要發布與探索介面。Npm 仍是受支援的備用方案與直接安裝路徑。在遷移到 ClawHub 期間，OpenClaw 仍會在 npm 上發布部分 OpenClaw 擁有的 `@openclaw/*` Plugin package；這些 package 版本在 Plugin 發布批次之間可能會落後於內建原始碼。如果 npm 將 OpenClaw 擁有的 Plugin package 回報為已淘汰，該發布版本就是舊的外部 artifact；請使用目前 OpenClaw 內建的 Plugin，或使用本機 checkout，直到較新的 npm package 發布為止。
</Note>

<AccordionGroup>
  <Accordion title="設定 include 與無效設定復原">
    如果你的 `plugins` 區段是由單一檔案 `$include` 支援，`plugins install/update/enable/disable/uninstall` 會寫入該 included 檔案，並讓 `openclaw.json` 保持不變。Root include、include 陣列，以及含有同層 override 的 include 會 fail closed，而不是被展平。支援的形狀請參閱[設定 include](/zh-TW/gateway/configuration)。

    如果安裝期間設定無效，`plugins install` 通常會 fail closed，並提示你先執行 `openclaw doctor --fix`。Gateway 啟動期間，單一 Plugin 的無效設定會隔離在該 Plugin，因此其他 channel 與 Plugin 仍可繼續執行；`openclaw doctor --fix` 可以隔離無效的 Plugin 項目。唯一記載的安裝時例外，是針對明確選擇加入 `openclaw.install.allowInvalidConfigRecovery` 的 Plugin 所提供的狹窄內建 Plugin 復原路徑。

  </Accordion>
  <Accordion title="--force 與重新安裝相對於 update">
    `--force` 會重用現有安裝目標，並就地覆寫已安裝的 Plugin 或 hook pack。當你有意從新的本機路徑、archive、ClawHub package 或 npm artifact 重新安裝相同 id 時使用它。若要例行升級已追蹤的 npm Plugin，建議使用 `openclaw plugins update <id-or-npm-spec>`。

    如果你對已安裝的 Plugin id 執行 `plugins install`，OpenClaw 會停止，並引導你使用 `plugins update <id-or-npm-spec>` 進行一般升級，或在你確實想從不同來源覆寫目前安裝時使用 `plugins install <package> --force`。

  </Accordion>
  <Accordion title="--pin 範圍">
    `--pin` 只適用於 npm 安裝。不支援與 `--marketplace` 搭配使用，因為 marketplace 安裝會保存 marketplace 來源 metadata，而不是 npm spec。
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 是在內建危險程式碼掃描器誤報時使用的 break-glass 選項。即使內建掃描器回報 `critical` findings，它也允許安裝繼續，但它**不會**繞過 Plugin `before_install` hook policy block，也**不會**繞過掃描失敗。

    此 CLI flag 適用於 Plugin install/update 流程。Gateway 支援的 skill dependency 安裝使用對應的 `dangerouslyForceUnsafeInstall` request override，而 `openclaw skills install` 仍是獨立的 ClawHub skill 下載/安裝流程。

    如果你在 ClawHub 發布的 Plugin 被 registry scan 阻擋，請使用 [ClawHub](/zh-TW/tools/clawhub) 中的 publisher 步驟。

  </Accordion>
  <Accordion title="Hook pack 與 npm spec">
    `plugins install` 也是安裝 hook pack 的介面，這些 hook pack 會在 `package.json` 中公開 `openclaw.hooks`。請使用 `openclaw hooks` 來取得已篩選的 hook 可見性與逐一 hook 啟用功能，而不是用於 package 安裝。

    Npm spec **僅限 registry**（package 名稱加上選用的**精確版本**或 **dist-tag**）。Git/URL/file spec 與 semver range 會被拒絕。即使你的 shell 有全域 npm install 設定，dependency 安裝也會以 project-local 方式執行，並為安全起見加上 `--ignore-scripts`。

    當你想略過 ClawHub 查詢並直接從 npm 安裝時，請使用 `npm:<package>`。裸 package spec 仍會優先使用 ClawHub，只有在 ClawHub 沒有該 package 或版本時才會回退到 npm。

    裸 spec 與 `@latest` 會停留在 stable track。如果 npm 將其中任一項解析為 prerelease，OpenClaw 會停止，並要求你透過 prerelease tag（例如 `@beta`/`@rc`）或精確 prerelease 版本（例如 `@1.2.3-beta.4`）明確選擇加入。

    如果裸 install spec 符合內建 Plugin id（例如 `diffs`），OpenClaw 會直接安裝內建 Plugin。若要安裝同名 npm package，請使用明確 scoped spec（例如 `@scope/diffs`）。

  </Accordion>
  <Accordion title="Archive">
    支援的 archive：`.zip`、`.tgz`、`.tar.gz`、`.tar`。原生 OpenClaw Plugin archive 必須在解壓後的 Plugin root 中包含有效的 `openclaw.plugin.json`；只包含 `package.json` 的 archive 會在 OpenClaw 寫入安裝記錄之前被拒絕。

    也支援 Claude marketplace 安裝。

  </Accordion>
</AccordionGroup>

ClawHub 安裝會使用明確的 `clawhub:<package>` locator：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 現在也會優先對裸 npm-safe Plugin spec 使用 ClawHub。只有在 ClawHub 沒有該 package 或版本時，才會回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

請使用 `npm:` 強制只解析 npm，例如 ClawHub 無法連線，或你知道該 package 只存在於 npm 時：

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw 會從 ClawHub 下載 package archive，檢查宣告的 Plugin API / 最低 gateway 相容性，然後透過一般 archive 路徑安裝。記錄的安裝會保留其 ClawHub 來源 metadata，以供日後 update 使用。
未指定版本的 ClawHub 安裝會保留未指定版本的記錄 spec，因此 `openclaw plugins update` 可以跟隨較新的 ClawHub release；明確版本或 tag selector（例如 `clawhub:pkg@1.2.3` 與 `clawhub:pkg@beta`）會維持釘選到該 selector。

#### Marketplace 簡寫

當 marketplace 名稱存在於 Claude 位於 `~/.claude/plugins/known_marketplaces.json` 的本機 registry cache 中時，請使用 `plugin@marketplace` 簡寫：

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
    - 本機 marketplace root 或 `marketplace.json` 路徑
    - GitHub repo 簡寫，例如 `owner/repo`
    - GitHub repo URL，例如 `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="遠端 marketplace 規則">
    對於從 GitHub 或 git 載入的遠端 marketplace，Plugin 項目必須保持在 cloned marketplace repo 內。OpenClaw 會接受來自該 repo 的相對路徑來源，並拒絕遠端 manifest 中的 HTTP(S)、絕對路徑、git、GitHub，以及其他非路徑 Plugin 來源。
  </Tab>
</Tabs>

對於本機路徑與 archive，OpenClaw 會自動偵測：

- 原生 OpenClaw Plugin（`openclaw.plugin.json`）
- Codex 相容 bundle（`.codex-plugin/plugin.json`）
- Claude 相容 bundle（`.claude-plugin/plugin.json` 或預設 Claude component layout）
- Cursor 相容 bundle（`.cursor-plugin/plugin.json`）

<Note>
相容 bundle 會安裝到一般 Plugin root，並參與相同的 list/info/enable/disable 流程。目前支援 bundle skills、Claude command-skills、Claude `settings.json` 預設值、Claude `.lsp.json` / manifest 宣告的 `lspServers` 預設值、Cursor command-skills，以及相容的 Codex hook 目錄；其他偵測到的 bundle 能力會顯示於 diagnostics/info，但尚未接入 runtime execution。
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
  從表格檢視切換為逐一 Plugin 詳細列，包含 source/origin/version/activation metadata。
</ParamField>
<ParamField path="--json" type="boolean">
  機器可讀 inventory 加上 registry diagnostics。
</ParamField>

<Note>
`plugins list` 會先讀取已持久保存的本機 Plugin 登錄檔；如果登錄檔遺失或無效，則使用僅由 manifest 衍生的備援資料。它適合用來檢查 Plugin 是否已安裝、已啟用，且對冷啟動規劃可見，但它不是對已在執行中的 Gateway 行程進行即時執行階段探查。變更 Plugin 程式碼、啟用狀態、hook 政策或 `plugins.load.paths` 後，請先重新啟動為該通道提供服務的 Gateway，再期待新的 `register(api)` 程式碼或 hook 會執行。對於遠端/容器部署，請確認你重新啟動的是實際的 `openclaw gateway run` 子行程，而不只是包裝行程。
</Note>

若要在封裝的 Docker 映像檔內處理內建 Plugin，請將 Plugin
原始碼目錄 bind-mount 到相符的封裝原始碼路徑上，例如
`/app/extensions/synology-chat`。OpenClaw 會先探索該掛載的原始碼
覆蓋層，然後才是 `/app/dist/extensions/synology-chat`；單純複製的原始碼
目錄仍不會生效，因此一般封裝安裝仍會使用已編譯的 dist。

若要偵錯執行階段 hook：

- `openclaw plugins inspect <id> --json` 會顯示來自模組載入檢查階段的已註冊 hook 和診斷資訊。
- `openclaw gateway status --deep --require-rpc` 會確認可連線的 Gateway、服務/行程提示、設定路徑，以及 RPC 健康狀態。
- 非內建的對話 hook（`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end`）需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 以避免複製本機目錄（會加入 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` 不支援搭配 `--link`，因為連結安裝會重用原始碼路徑，而不是覆寫受管理的安裝目標。

在 npm 安裝中使用 `--pin`，可將解析後的精確規格（`name@version`）儲存在受管理的 Plugin 索引中，同時保留預設的未釘選行為。
</Note>

### Plugin 索引

Plugin 安裝中繼資料是由機器管理的狀態，不是使用者設定。安裝和更新會將它寫入作用中 OpenClaw 狀態目錄下的 `plugins/installs.json`。其頂層 `installRecords` 映射是安裝中繼資料的持久來源，包括損壞或遺失 Plugin manifest 的記錄。`plugins` 陣列是由 manifest 衍生的冷登錄快取。此檔案包含請勿編輯警告，並由 `openclaw plugins update`、解除安裝、診斷，以及冷 Plugin 登錄檔使用。

當 OpenClaw 在設定中看到已隨產品出貨的舊版 `plugins.installs` 記錄時，會將它們移入 Plugin 索引並移除該設定鍵；如果任一寫入失敗，設定記錄會被保留，以免安裝中繼資料遺失。

### 執行階段相依項

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` 會檢查封裝的執行階段相依項階段，範圍是由 Plugin 設定、已啟用/已設定的通道、已設定的模型供應商，或內建 manifest 預設值選取的 OpenClaw 擁有內建 Plugin。它不是第三方 npm 或 ClawHub Plugin 的安裝/更新路徑。

當封裝安裝在 Gateway 啟動期間或 `plugins doctor` 回報缺少內建執行階段相依項時，請使用 `--repair`。修復只會安裝缺少的已啟用內建 Plugin 相依項，且會停用生命週期指令碼。使用 `--prune` 可移除舊封裝版面遺留下來、已過時且未知的外部執行階段相依項根目錄。

### 解除安裝

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 會在適用時從 `plugins.entries`、已持久保存的 Plugin 索引、Plugin allow/deny 清單項目，以及已連結的 `plugins.load.paths` 項目中移除 Plugin 記錄。除非設定了 `--keep-files`，否則解除安裝也會移除已追蹤的受管理安裝目錄，前提是它位於 OpenClaw 的 Plugin extensions 根目錄內。對於 active memory Plugin，memory slot 會重設為 `memory-core`。

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

更新會套用到受管理 Plugin 索引中已追蹤的 Plugin 安裝，以及 `hooks.internal.installs` 中已追蹤的 hook-pack 安裝。

<AccordionGroup>
  <Accordion title="解析 Plugin id 與 npm spec">
    當你傳入 Plugin id 時，OpenClaw 會重用該 Plugin 已記錄的安裝規格。這表示先前儲存的 dist-tag（例如 `@beta`）和精確釘選版本，會在後續 `update <id>` 執行中繼續使用。

    對於 npm 安裝，你也可以傳入含有 dist-tag 或精確版本的明確 npm 套件規格。OpenClaw 會將該套件名稱解析回已追蹤的 Plugin 記錄，更新該已安裝 Plugin，並記錄新的 npm 規格以供未來基於 id 的更新使用。

    傳入不含版本或標籤的 npm 套件名稱，也會解析回已追蹤的 Plugin 記錄。當某個 Plugin 曾被釘選到精確版本，而你想將它移回登錄檔的預設發行線時，請使用此方式。

  </Accordion>
  <Accordion title="版本檢查與完整性漂移">
    在進行即時 npm 更新之前，OpenClaw 會根據 npm 登錄檔中繼資料檢查已安裝的套件版本。如果已安裝版本和已記錄的 artifact 身分已符合解析出的目標，更新會被略過，不會下載、重新安裝或重寫 `openclaw.json`。

    當已儲存的完整性雜湊存在，且擷取到的 artifact 雜湊發生變化時，OpenClaw 會將其視為 npm artifact 漂移。互動式 `openclaw plugins update` 指令會列印預期和實際雜湊，並在繼續前要求確認。非互動式更新輔助程式預設會以封閉方式失敗，除非呼叫端提供明確的繼續政策。

  </Accordion>
  <Accordion title="更新時的 --dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` 也可在 `plugins update` 上使用，作為 Plugin 更新期間內建危險程式碼掃描誤判的緊急覆寫選項。它仍不會繞過 Plugin `before_install` 政策封鎖或掃描失敗封鎖，且只適用於 Plugin 更新，不適用於 hook-pack 更新。
  </Accordion>
</AccordionGroup>

### 檢查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

針對單一 Plugin 的深度自省。顯示身分、載入狀態、來源、已註冊能力、hook、工具、命令、服務、gateway 方法、HTTP 路由、政策旗標、診斷、安裝中繼資料、bundle 能力，以及任何偵測到的 MCP 或 LSP 伺服器支援。

每個 Plugin 會依其在執行階段實際註冊的內容分類：

- **plain-capability** — 一種能力類型（例如僅供應商的 Plugin）
- **hybrid-capability** — 多種能力類型（例如文字 + 語音 + 圖片）
- **hook-only** — 只有 hook，沒有能力或介面
- **non-capability** — 有工具/命令/服務，但沒有能力

請參閱 [Plugin shapes](/zh-TW/plugins/architecture#plugin-shapes) 以了解更多能力模型資訊。

<Note>
`--json` 旗標會輸出適合指令碼和稽核使用的機器可讀報告。`inspect --all` 會呈現整體表格，包含 shape、能力種類、相容性通知、bundle 能力，以及 hook 摘要欄位。`info` 是 `inspect` 的別名。
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 會回報 Plugin 載入錯誤、manifest/探索診斷，以及相容性通知。當一切正常時，它會列印 `No plugin issues detected.`

對於模組形狀失敗，例如缺少 `register`/`activate` 匯出，請使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新執行，以在診斷輸出中包含精簡的匯出形狀摘要。

### 登錄檔

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本機 Plugin 登錄檔是 OpenClaw 持久保存的冷讀模型，用於已安裝 Plugin 的身分、啟用狀態、來源中繼資料，以及貢獻所有權。一般啟動、供應商擁有者查詢、通道設定分類，以及 Plugin 清查，都可以在不匯入 Plugin 執行階段模組的情況下讀取它。

使用 `plugins registry` 檢查已持久保存的登錄檔是否存在、目前有效或已過期。使用 `--refresh` 可從已持久保存的 Plugin 索引、設定政策，以及 manifest/package 中繼資料重建它。這是修復路徑，不是執行階段啟用路徑。

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是已棄用的緊急相容性開關，用於登錄檔讀取失敗。請優先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；env 備援只應在遷移推出期間用於緊急啟動復原。
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 可接受本機 marketplace 路徑、`marketplace.json` 路徑、像 `owner/repo` 這樣的 GitHub 簡寫、GitHub repo URL，或 git URL。`--json` 會列印解析後的來源標籤，以及已剖析的 marketplace manifest 和 Plugin 項目。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [CLI 參考](/zh-TW/cli)
- [社群 Plugin](/zh-TW/plugins/community)
